/* V20.5.72 · Opt-in, non-authoritative training entity mirror.
 * Extract ONLY from the confirmed original club JSON. No guessed IDs, reads
 * from live editor state, cloud calls, or automatic recovery writes.
 */
export const TRAINING_SHADOW_DB='VolleyCoachTrainingShadowV2072';
export const TRAINING_FIELDS=['sesionActual','historial','planificacion','plantillas'] as const;
const ROWS='trainingRows',MANIFEST='trainingManifest';
const MAX_ROWS=20000,MAX_CHARS=5000000;
const object=(value:unknown):value is Record<string,unknown>=>
 !!value&&typeof value==='object'&&!Array.isArray(value);
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const identity=(value:unknown):string|null=>{
 if(!object(value))return null;
 for(const field of ['id','uuid','_id']){
  const id=value[field];
  if((typeof id==='string'&&id.trim())||(typeof id==='number'&&Number.isSafeInteger(id)))
   return String(id).trim();
 }
 return null;
};
export interface TrainingRow{readonly key:string;readonly teamId:string;
 readonly field:string;readonly dataJson:string}
export interface TrainingLayout{readonly present:Readonly<Record<string,boolean>>;
 readonly order:Readonly<Record<string,readonly string[]>>}
export interface TrainingPlan{readonly schema:1;readonly revision:string;
 readonly teams:readonly string[];readonly rows:readonly TrainingRow[];
 readonly layout:Readonly<Record<string,TrainingLayout>>;
 readonly pendingIds:number;readonly totalChars:number;readonly complete:boolean}
export interface TrainingCheck{readonly status:'verified'|'missing'|'different'|'incomplete';
 readonly records:number;readonly pendingIds:number;readonly readOnly:true;
 readonly authoritative:false}
export interface TrainingReceipt{readonly status:'verified';readonly records:number;
 readonly added:number;readonly changed:number;readonly removed:number;
 readonly unchanged:number;readonly authoritative:false}
const check=(status:TrainingCheck['status'],plan:TrainingPlan,records=0):TrainingCheck=>
 Object.freeze({status,records,pendingIds:plan.pendingIds,readOnly:true,authoritative:false});

/** Preserve field presence and exercise/session order without inventing IDs. */
export function planTrainingShadow(raw:string,revision:string):Readonly<TrainingPlan>{
 if(typeof raw!=='string'||!raw||raw.length>12000000||
  typeof revision!=='string'||!revision||revision.length>128)
  throw Error('Guardado original o revisión no válidos');
 const source=JSON.parse(raw);
 if(!object(source)||!object(source.equiposData))throw Error('Guardado principal sin equipos');
 const teams=Object.keys(source.equiposData).sort();
 if(!teams.length||teams.length>100)throw Error('Número de equipos incompatible');
 const rows:TrainingRow[]=[],layout:Record<string,TrainingLayout>=Object.create(null);
 let pendingIds=0,totalChars=0;
 const add=(teamId:string,field:string,key:string,value:unknown)=>{
  const dataJson=JSON.stringify(value);
  if(typeof dataJson!=='string'){pendingIds++;return false}
  totalChars+=dataJson.length;
  if(rows.length>=MAX_ROWS||totalChars>MAX_CHARS)throw Error('Entrenamientos demasiado grandes para la réplica');
  rows.push(Object.freeze({key,teamId,field,dataJson}));return true;
 };
 for(const teamId of teams){
  const team=source.equiposData[teamId];
  if(!object(team))throw Error('Equipo de entrenamiento incompatible');
  const present:Record<string,boolean>=Object.create(null),order:Record<string,readonly string[]>=Object.create(null);
  for(const field of TRAINING_FIELDS){
   present[field]=own(team,field);
   if(!present[field])continue;
   if(!Array.isArray(team[field])){pendingIds++;continue}
   const entries=team[field] as unknown[];
   const ids=entries.map(identity),count=new Map<string,number>();
   for(const id of ids)if(id!==null)count.set(id,(count.get(id)||0)+1);
   const keys:string[]=[];
   for(let i=0;i<entries.length;i++){
    const id=ids[i];
    if(id===null||(count.get(id)||0)>1){pendingIds++;continue}
    const key=JSON.stringify([teamId,field,id]);
    if(add(teamId,field,key,entries[i]))keys.push(key);
   }
   order[field]=Object.freeze(keys);
  }
  present.meta=own(team,'meta');
  if(present.meta)add(teamId,'meta',JSON.stringify([teamId,'meta','singleton']),team.meta);
  Object.defineProperty(layout,teamId,{value:Object.freeze({present:Object.freeze(present),
   order:Object.freeze(order)}),enumerable:true});
 }
 rows.sort((a,b)=>a.key.localeCompare(b.key));
 return Object.freeze({schema:1 as const,revision,teams:Object.freeze(teams),
  rows:Object.freeze(rows),layout:Object.freeze(layout),pendingIds,totalChars,
  complete:pendingIds===0});
}

const manifest=(plan:TrainingPlan)=>({key:'current',schema:1,revision:plan.revision,
 teams:[...plan.teams],keys:plan.rows.map(row=>row.key),layout:plan.layout,
 totalChars:plan.totalChars,pendingIds:plan.pendingIds});
const matches=(saved:any,plan:TrainingPlan)=>
 saved?.schema===1&&saved.totalChars===plan.totalChars&&
 saved.pendingIds===0&&JSON.stringify(saved.teams)===JSON.stringify(plan.teams)&&
 JSON.stringify(saved.keys)===JSON.stringify(plan.rows.map(row=>row.key))&&
 JSON.stringify(saved.layout)===JSON.stringify(plan.layout);

/** A read-only check never upgrades/creates an absent database. */
export function openExistingTrainingShadow(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase|null>{
 return new Promise((resolve,reject)=>{
  let done=false,missing=false,request:IDBOpenDBRequest;
  const fail=(reason:unknown)=>{if(!done){done=true;reject(reason||Error('No se pudo leer IndexedDB'))}};
  try{request=factory.open(TRAINING_SHADOW_DB)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{missing=true;try{request.transaction?.abort()}catch(error){fail(error)}};
  request.onsuccess=()=>{
   const db=request.result;if(done){db.close();return}
   if(missing){db.close();done=true;resolve(null);return}
   if(!db.objectStoreNames.contains(ROWS)||!db.objectStoreNames.contains(MANIFEST)){
    db.close();fail(Error('Esquema de entrenamientos incompatible'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>{if(missing&&!done){done=true;resolve(null)}else fail(request.error)};
  request.onblocked=()=>fail(Error('Otra pestaña bloquea los entrenamientos'));
 });
}
function openTrainingShadow(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  let done=false,request:IDBOpenDBRequest;
  const fail=(reason:unknown)=>{if(!done){done=true;reject(reason||Error('No se pudo abrir IndexedDB'))}};
  try{request=factory.open(TRAINING_SHADOW_DB,1)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{
   try{for(const name of [ROWS,MANIFEST])if(!request.result.objectStoreNames.contains(name))
    request.result.createObjectStore(name,{keyPath:'key'});
   }catch(error){try{request.transaction?.abort()}catch(_){}fail(error)}
  };
  request.onsuccess=()=>{
   const db=request.result;if(done){db.close();return}
   if(!db.objectStoreNames.contains(ROWS)||!db.objectStoreNames.contains(MANIFEST)){
    db.close();fail(Error('Esquema de entrenamientos incompatible'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(Error('Otra pestaña bloquea la réplica de entrenamientos'));
 });
}

function verify(db:IDBDatabase,plan:TrainingPlan):Promise<boolean>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction,ok=true,done=false;
  try{tx=db.transaction([ROWS,MANIFEST],'readonly')}catch(error){reject(error);return}
  const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('Lectura incompleta'))}};
  tx.oncomplete=()=>{if(!done){done=true;resolve(ok)}};
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  try{
   const meta=tx.objectStore(MANIFEST).get('current');
   meta.onsuccess=()=>{if(!matches(meta.result,plan))ok=false};meta.onerror=()=>{ok=false};
   const store=tx.objectStore(ROWS),all=store.getAllKeys();
   all.onsuccess=()=>{if(JSON.stringify(all.result.map(String).sort())!==
    JSON.stringify(plan.rows.map(row=>row.key).sort()))ok=false};all.onerror=()=>{ok=false};
   for(const row of plan.rows){
    const found=store.get(row.key);
    found.onsuccess=()=>{if(found.result?.key!==row.key||found.result?.teamId!==row.teamId||
     found.result?.field!==row.field||found.result?.dataJson!==row.dataJson)ok=false};
    found.onerror=()=>{ok=false};
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** One transaction applies entity deltas and removes stale rows in this isolated DB. */
export async function writeTrainingShadow(input:{readonly factory:Pick<IDBFactory,'open'>;
 readonly plan:TrainingPlan}):Promise<TrainingReceipt>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1||
  !input.plan.complete)throw Error('Entrenamientos con IDs pendientes: no se crea la réplica');
 const db=await openTrainingShadow(input.factory);
 try{
  const delta=await new Promise<{added:number;changed:number;removed:number;unchanged:number}>((resolve,reject)=>{
   let tx:IDBTransaction,done=false,added=0,changed=0,removed=0,unchanged=0;
   try{tx=db.transaction([ROWS,MANIFEST],'readwrite')}catch(error){reject(error);return}
   const fail=(error:unknown)=>{if(!done){done=true;reject(error||Error('Escritura incompleta'))}};
   const abort=(error:unknown)=>{try{tx.abort()}catch(_){}fail(error)};
   tx.oncomplete=()=>{if(!done){done=true;resolve({added,changed,removed,unchanged})}};
   tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
   try{
    const store=tx.objectStore(ROWS),prior=store.getAllKeys();
    prior.onsuccess=()=>{
     try{
      const wanted=new Set(input.plan.rows.map(row=>row.key));
      for(const key of prior.result){if(!wanted.has(String(key))){store.delete(key);removed++}}
      for(const row of input.plan.rows){
       const saved=store.get(row.key);
       saved.onsuccess=()=>{
        try{
         if(saved.result?.dataJson===row.dataJson&&saved.result?.teamId===row.teamId&&
          saved.result?.field===row.field){unchanged++;return}
         if(saved.result)changed++;else added++;
         store.put(row);
        }catch(error){abort(error)}
       };
       saved.onerror=()=>abort(saved.error);
      }
      tx.objectStore(MANIFEST).put(manifest(input.plan));
     }catch(error){abort(error)}
    };
    prior.onerror=()=>abort(prior.error);
   }catch(error){abort(error)}
  });
  if(!await verify(db,input.plan))throw Error('La réplica no coincide tras el guardado');
  return Object.freeze({status:'verified',authoritative:false,records:input.plan.rows.length,...delta});
 }finally{db.close()}
}
export async function inspectTrainingShadow(input:{readonly factory:Pick<IDBFactory,'open'>;
 readonly plan:TrainingPlan}):Promise<TrainingCheck>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1)
  throw Error('Inspección de entrenamientos no disponible');
 if(!input.plan.complete)return check('incomplete',input.plan);
 const db=await openExistingTrainingShadow(input.factory);
 if(!db)return check('missing',input.plan);
 try{return check(await verify(db,input.plan)?'verified':'different',input.plan,input.plan.rows.length)}
 finally{db.close()}
}
export function deleteTrainingShadow(factory:Pick<IDBFactory,'deleteDatabase'>):Promise<true>{
 if(typeof factory?.deleteDatabase!=='function')return Promise.reject(Error('Borrado no disponible'));
 return new Promise((resolve,reject)=>{
  let done=false,request:IDBOpenDBRequest;
  const fail=(reason:unknown)=>{if(!done){done=true;reject(reason||Error('No se pudo borrar la réplica'))}};
  try{request=factory.deleteDatabase(TRAINING_SHADOW_DB)}catch(error){fail(error);return}
  request.onsuccess=()=>{if(!done){done=true;resolve(true)}};
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(Error('Cierra otras pestañas antes de borrar la réplica'));
 });
}
