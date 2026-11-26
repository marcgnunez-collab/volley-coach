/* V20.5.69 · Verify and reconstruct a READONLY player-only JSON backup.
 * No main-club restoration or cloud side effect is permitted.
 */
import {openExistingPlayerShadow,type PlayerShadowPlan,
 type PlayerShadowRow} from './player-shadow';

export interface PlayerBackupResult{
 readonly status:'ready'|'missing'|'different'|'incomplete';
 readonly readOnly:true;readonly authoritative:false;
 readonly records:number;readonly pendingIds:number;
 readonly json?:string;
}
const result=(status:PlayerBackupResult['status'],plan:PlayerShadowPlan,records=0,json?:string):PlayerBackupResult=>
 Object.freeze({status,readOnly:true,authoritative:false,records,
  pendingIds:plan.pendingIds,...(json===undefined?{}:{json})});
const owns=(v:object,key:string)=>Object.prototype.hasOwnProperty.call(v,key);

function readSnapshot(db:IDBDatabase,plan:PlayerShadowPlan):Promise<{
 readonly manifest:any;readonly rows:ReadonlyMap<string,PlayerShadowRow|undefined>;
}>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction(['playerRows','playerManifest'],'readonly')}
  catch(error){reject(error);return}
  let settled=false,manifest:any;
  const rows=new Map<string,PlayerShadowRow|undefined>();
  const fail=(error:unknown)=>{if(!settled){settled=true;
   reject(error||Error('No se pudo reconstruir la plantilla'))}};
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  tx.oncomplete=()=>{if(!settled){settled=true;resolve({manifest,rows})}};
  try{
   const meta=tx.objectStore('playerManifest').get('current');
   meta.onsuccess=()=>{manifest=meta.result};meta.onerror=()=>fail(meta.error);
   const source=tx.objectStore('playerRows');
   for(const item of plan.rows){
    const req=source.get(item.key);
    req.onsuccess=()=>rows.set(item.key,req.result as PlayerShadowRow|undefined);
    req.onerror=()=>fail(req.error);
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** Pure and strict: reconstructs original team order, not just sorted keys. */
export function reconstructPlayersForBackup(plan:PlayerShadowPlan,
 stored:ReadonlyMap<string,PlayerShadowRow|undefined>):Readonly<Record<string,unknown>>{
 if(!plan.complete||plan.schema!==1)throw Error('IDs pendientes en la plantilla');
 const teams:Record<string,unknown>=Object.create(null);
 for(const teamId of plan.teamIds){
  const order=plan.order[teamId];
  if(!Array.isArray(order))throw Error('Orden de la plantilla incompatible');
  const team:Record<string,unknown>=Object.create(null);
  if(plan.present[teamId]){
   const players:unknown[]=[];
   for(const key of order){
    const row=stored.get(key);
    if(!row||row.key!==key||row.teamId!==teamId)
     throw Error('Falta una entidad de jugador');
    const tuple=JSON.parse(key);
    if(!Array.isArray(tuple)||tuple.length!==2||tuple[0]!==teamId)
     throw Error('Clave de jugador incompatible');
    players.push(JSON.parse(row.dataJson));
   }
   Object.defineProperty(team,'jugadores',{value:players,enumerable:true});
  }else if(order.length)throw Error('Campo ausente con registros inesperados');
  Object.defineProperty(teams,teamId,{value:team,enumerable:true});
 }
 return Object.freeze(teams);
}

/** One fresh readonly IDB transaction verifies every row before allowing export. */
export async function preparePlayerShadowBackup(input:{
 readonly factory:Pick<IDBFactory,'open'>;readonly plan:PlayerShadowPlan;
}):Promise<PlayerBackupResult>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1)
  throw Error('Copia de recuperación no disponible');
 const plan=input.plan;
 if(!plan.complete)return result('incomplete',plan);
 const db=await openExistingPlayerShadow(input.factory);
 if(!db)return result('missing',plan);
 try{
  const snapshot=await readSnapshot(db,plan),m=snapshot.manifest;
  if(!m||m.schema!==1||m.pendingIds!==0||m.totalChars!==plan.totalChars||
   JSON.stringify(m.teamIds)!==JSON.stringify(plan.teamIds)||
   JSON.stringify(m.keys)!==JSON.stringify(plan.rows.map(row=>row.key))||
   JSON.stringify(m.order)!==JSON.stringify(plan.order)||
   JSON.stringify(m.present)!==JSON.stringify(plan.present))return result('different',plan);
  for(const row of plan.rows){
   const saved=snapshot.rows.get(row.key);
   if(saved?.key!==row.key||saved?.teamId!==row.teamId||saved?.dataJson!==row.dataJson)
    return result('different',plan);
  }
  try{
   const teams=reconstructPlayersForBackup(plan,snapshot.rows);
   // Guard against malformed prototypes and additional data silently entering backup.
   if(Object.keys(teams).length!==plan.teamIds.length||
    plan.teamIds.some(id=>!owns(teams,id)))return result('different',plan);
   const json=JSON.stringify({schema:'volley-coach-player-backup',version:1,
    scope:'jugadores',authoritative:false,exportedAt:new Date().toISOString(),
    teams});
   if(json.length>6000000)throw Error('Copia de jugadores demasiado grande');
   return result('ready',plan,plan.rows.length,json);
  }catch(_){return result('different',plan)}
 }finally{db.close()}
}
