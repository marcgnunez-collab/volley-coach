/* V20.5.67 · Isolated, opt-in player entity replica. NEVER authoritative.
 * Only confirmed original club JSON is accepted; no scouting or cloud writes.
 */
export const PLAYER_SHADOW_DB='VolleyCoachPlayerShadowV2067';
const ROWS='playerRows',MANIFEST='playerManifest',LIMIT_ROWS=20000,LIMIT_CHARS=5000000;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const idOf=(row:unknown):string|null=>{
 if(!object(row))return null;
 for(const key of ['id','uuid','_id']){
  const id=row[key];
  if((typeof id==='string'&&id.trim())||(typeof id==='number'&&Number.isSafeInteger(id)))
   return String(id).trim();
 }
 return null;
};
export interface PlayerShadowRow{readonly key:string;readonly teamId:string;readonly dataJson:string}
export interface PlayerShadowPlan{
 readonly schema:1;readonly revision:string;readonly teamIds:readonly string[];
 readonly rows:readonly PlayerShadowRow[];readonly order:Readonly<Record<string,readonly string[]>>;
 readonly present:Readonly<Record<string,boolean>>;
 readonly totalChars:number;readonly pendingIds:number;readonly complete:boolean;
}
export interface PlayerShadowReceipt{
 readonly status:'verified';readonly authoritative:false;
 readonly records:number;readonly added:number;readonly changed:number;
 readonly removed:number;readonly unchanged:number;
}
export interface PlayerShadowCheck{
 readonly status:'verified'|'missing'|'different'|'incomplete';
 readonly readOnly:true;readonly authoritative:false;
 readonly records:number;readonly pendingIds:number;
}
const response=(status:PlayerShadowCheck['status'],plan:PlayerShadowPlan,records=0):PlayerShadowCheck=>
 Object.freeze({status,readOnly:true,authoritative:false,records,pendingIds:plan.pendingIds});

/** Extract from the ORIGINAL confirmed JSON, not an asynchronously mutated live object. */
export function planPlayerShadow(raw:string,revision:string):Readonly<PlayerShadowPlan>{
 if(typeof raw!=='string'||!raw||raw.length>12000000||
  typeof revision!=='string'||!revision||revision.length>128)
  throw Error('Instantánea de club o revisión no válida');
 const source=JSON.parse(raw);
 if(!object(source)||!object(source.equiposData))throw Error('Guardado principal sin equipos');
 const teams=source.equiposData,teamIds=Object.keys(teams).sort();
 if(!teamIds.length||teamIds.length>100)throw Error('Número de equipos inválido');
 const rows:PlayerShadowRow[]=[],order:Record<string,readonly string[]>=Object.create(null);
 const present:Record<string,boolean>=Object.create(null);
 let pendingIds=0,totalChars=0;
 for(const teamId of teamIds){
  const team=teams[teamId];if(!object(team))throw Error('Equipo incompatible');
  const hasPlayers=Object.prototype.hasOwnProperty.call(team,'jugadores');
  present[teamId]=hasPlayers;
  const players=hasPlayers?team.jugadores:[];
  if(!Array.isArray(players)){pendingIds++;order[teamId]=Object.freeze([]);continue}
  const ids=players.map(idOf),count=new Map<string,number>();
  for(const id of ids)if(id)count.set(id,(count.get(id)||0)+1);
  const keys:string[]=[];
  for(let i=0;i<players.length;i++){
   const id=ids[i];
   if(!id||(count.get(id)||0)>1){pendingIds++;continue}
   const key=JSON.stringify([teamId,id]),dataJson=JSON.stringify(players[i]);
   if(typeof dataJson!=='string'){pendingIds++;continue}
   totalChars+=dataJson.length;
   if(totalChars>LIMIT_CHARS||rows.length>=LIMIT_ROWS)throw Error('Plantilla demasiado grande para la réplica');
   keys.push(key);rows.push(Object.freeze({key,teamId,dataJson}));
  }
  order[teamId]=Object.freeze(keys);
 }
 rows.sort((a,b)=>a.key.localeCompare(b.key));
 return Object.freeze({schema:1 as const,revision,teamIds:Object.freeze(teamIds),
  rows:Object.freeze(rows),order:Object.freeze(order),present:Object.freeze(present),
  totalChars,pendingIds,complete:pendingIds===0});
}

function openPlayerDB(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  let done=false,request:IDBOpenDBRequest;
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('No se pudo abrir la réplica'))}};
  try{request=factory.open(PLAYER_SHADOW_DB,1)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{
   try{for(const name of [ROWS,MANIFEST])if(!request.result.objectStoreNames.contains(name))
    request.result.createObjectStore(name,{keyPath:'key'});
   }catch(error){try{request.transaction?.abort()}catch(_){}fail(error)}
  };
  request.onsuccess=()=>{
   const db=request.result;if(done){db.close();return}
   if(!db.objectStoreNames.contains(ROWS)||!db.objectStoreNames.contains(MANIFEST)){
    db.close();fail(Error('Esquema de réplica incompatible'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(Error('Otra pestaña bloquea la réplica de jugadores'));
 });
}

/** Missing DB must NOT be created by a read/inspection. */
export function openExistingPlayerShadow(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase|null>{
 return new Promise((resolve,reject)=>{
  let done=false,missing=false,request:IDBOpenDBRequest;
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('No se pudo leer la réplica'))}};
  try{request=factory.open(PLAYER_SHADOW_DB)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{missing=true;try{request.transaction?.abort()}catch(error){fail(error)}};
  request.onsuccess=()=>{
   const db=request.result;if(done){db.close();return}
   if(missing){db.close();done=true;resolve(null);return}
   if(!db.objectStoreNames.contains(ROWS)||!db.objectStoreNames.contains(MANIFEST)){
    db.close();fail(Error('Esquema de réplica incompatible'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>{if(missing&&!done){done=true;resolve(null)}else fail(request.error)};
  request.onblocked=()=>fail(Error('Otra pestaña bloquea la réplica'));
 });
}

function manifestOf(plan:PlayerShadowPlan){return {
 key:'current',schema:1,revision:plan.revision,teamIds:[...plan.teamIds],
 keys:plan.rows.map(row=>row.key),order:plan.order,present:plan.present,
 totalChars:plan.totalChars,pendingIds:plan.pendingIds
}}
const sameManifest=(row:any,plan:PlayerShadowPlan,revisionRequired=false)=>
 row?.schema===1&&(!revisionRequired||row.revision===plan.revision)&&
 row.totalChars===plan.totalChars&&row.pendingIds===plan.pendingIds&&
 JSON.stringify(row.keys)===JSON.stringify(plan.rows.map(r=>r.key))&&
 JSON.stringify(row.order)===JSON.stringify(plan.order)&&
 JSON.stringify(row.present)===JSON.stringify(plan.present)&&
 JSON.stringify(row.teamIds)===JSON.stringify(plan.teamIds);

async function writeShadow(db:IDBDatabase,plan:PlayerShadowPlan){
 return new Promise<{added:number;changed:number;removed:number;unchanged:number}>((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction([ROWS,MANIFEST],'readwrite')}catch(error){reject(error);return}
  let done=false,added=0,changed=0,removed=0,unchanged=0;
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('No se guardó la réplica'))}};
  const abort=(error:unknown)=>{try{tx.abort()}catch(_){}fail(error)};
  tx.oncomplete=()=>{if(!done){done=true;resolve({added,changed,removed,unchanged})}};
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  try{
   const dest=tx.objectStore(ROWS),meta=tx.objectStore(MANIFEST),request=meta.get('current');
   request.onsuccess=()=>{
    try{
     const old=request.result;
     if(old!==undefined&&(old?.schema!==1||!Array.isArray(old?.keys)))
      throw Error('Catálogo anterior incompatible');
     const current=new Set(plan.rows.map(row=>row.key));
     for(const key of old?.keys||[]){
      if(typeof key!=='string')throw Error('Clave antigua incompatible');
      if(!current.has(key)){dest.delete(key);removed++}
     }
     for(const row of plan.rows){
      const prior=dest.get(row.key);
      prior.onsuccess=()=>{
       try{
        if(prior.result?.dataJson===row.dataJson&&prior.result?.teamId===row.teamId){unchanged++;return}
        if(prior.result)changed++;else added++;
        dest.put(row);
       }catch(error){abort(error)}
      };
      prior.onerror=()=>abort(prior.error);
     }
     meta.put(manifestOf(plan));
    }catch(error){abort(error)}
   };
   request.onerror=()=>abort(request.error);
  }catch(error){abort(error)}
 });
}

function verifyShadow(db:IDBDatabase,plan:PlayerShadowPlan,revisionRequired:boolean):Promise<boolean>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction([ROWS,MANIFEST],'readonly')}catch(error){reject(error);return}
  let failed=false,done=false;
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('Fallo de lectura de la réplica'))}};
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  tx.oncomplete=()=>{if(!done){done=true;resolve(!failed)}};
  try{
   const meta=tx.objectStore(MANIFEST).get('current');
   meta.onsuccess=()=>{if(!sameManifest(meta.result,plan,revisionRequired))failed=true};
   meta.onerror=()=>{failed=true};
   for(const row of plan.rows){
    const req=tx.objectStore(ROWS).get(row.key);
    req.onsuccess=()=>{if(req.result?.key!==row.key||req.result?.teamId!==row.teamId||
     req.result?.dataJson!==row.dataJson)failed=true};
    req.onerror=()=>{failed=true};
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** Isolated non-authoritative DB; only invoked after a confirmed original save. */
export async function writePlayerShadow(input:{factory:Pick<IDBFactory,'open'>;
 plan:PlayerShadowPlan}):Promise<PlayerShadowReceipt>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1||
  !input.plan.complete)throw Error('La plantilla tiene IDs pendientes: no se crea la réplica');
 const db=await openPlayerDB(input.factory);
 try{
  const delta=await writeShadow(db,input.plan);
  if(!await verifyShadow(db,input.plan,true))throw Error('La lectura de la réplica no coincide');
  return Object.freeze({status:'verified',authoritative:false,records:input.plan.rows.length,...delta});
 }finally{db.close()}
}

/** Read-only comparison with a NEW connection; absent DB never created. */
export async function inspectPlayerShadow(input:{factory:Pick<IDBFactory,'open'>;
 plan:PlayerShadowPlan}):Promise<PlayerShadowCheck>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1)
  throw Error('Inspección de jugadores no disponible');
 if(!input.plan.complete)return response('incomplete',input.plan);
 const db=await openExistingPlayerShadow(input.factory);
 if(!db)return response('missing',input.plan);
 try{return response(await verifyShadow(db,input.plan,false)?'verified':'different',
  input.plan,input.plan.rows.length)}finally{db.close()}
}

/** Explicit erasure of ONLY the isolated shadow database. */
export function deletePlayerShadow(factory:Pick<IDBFactory,'deleteDatabase'>):Promise<true>{
 if(typeof factory?.deleteDatabase!=='function')return Promise.reject(Error('Borrado no disponible'));
 return new Promise((resolve,reject)=>{
  let done=false,request:IDBOpenDBRequest;
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('No pudo borrarse la réplica'))}};
  try{request=factory.deleteDatabase(PLAYER_SHADOW_DB)}catch(error){fail(error);return}
  request.onsuccess=()=>{if(!done){done=true;resolve(true)}};
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(Error('Cierra otras pestañas antes de borrar la réplica'));
 });
}
