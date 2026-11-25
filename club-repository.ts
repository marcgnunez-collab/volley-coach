/* V20.5.63 · Manual, non-authoritative IndexedDB replica; no active save hook.
 * A single atomic write across stores, followed by a separate read transaction.
 * The original club JSON, sync and rally journal are never opened or changed.
 */
import {CLUB_PARTITION_STORES,type ClubPartitionPlan,
 type ClubPartitionStore} from './club-partitions';
import {CLUB_ENTITY_STORES} from './club-entity-plan';

export const CLUB_PILOT_DB='VolleyCoachClubPartitionsV2063';
const META_STORE='metadata';
const ALL_STORES=[...CLUB_PARTITION_STORES,META_STORE] as const;
const SCHEMA_STORES=[...ALL_STORES,...CLUB_ENTITY_STORES,'entityManifest'] as const;
export const CLUB_PILOT_SCHEMA_VERSION=2;
export interface ClubPilotReceipt{
 readonly status:'verified';
 readonly revision:string;
 readonly teamCount:number;
 readonly recordCount:number;
 readonly totalChars:number;
 readonly authoritative:false;
}

export function openClubPilotDatabase(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  let done=false;
  const fail=(error:unknown)=>{if(done)return;done=true;reject(error||Error('No se pudo abrir el piloto local'))};
  let request:IDBOpenDBRequest;
  try{request=factory.open(CLUB_PILOT_DB,CLUB_PILOT_SCHEMA_VERSION)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{
   try{for(const store of SCHEMA_STORES)if(!request.result.objectStoreNames.contains(store))
    request.result.createObjectStore(store,{keyPath:
     store===META_STORE||store==='entityManifest'||CLUB_ENTITY_STORES.includes(store as typeof CLUB_ENTITY_STORES[number])?'key':'teamId'});
   }catch(error){try{request.transaction?.abort()}catch(_){}fail(error)}
  };
  request.onsuccess=()=>{
   const db=request.result;
   if(done){db.close();return}
   for(const store of SCHEMA_STORES)if(!db.objectStoreNames.contains(store)){
    db.close();fail(Error('Falta una colección en el repositorio piloto'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(Error('Otra pestaña impide abrir el repositorio piloto'));
 });
}

function writeClubPilot(db:IDBDatabase,plan:ClubPartitionPlan):Promise<void>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction([...ALL_STORES],'readwrite')}
  catch(error){reject(error);return}
  let settled=false;
  const fail=(error:unknown)=>{if(settled)return;settled=true;
   reject(error||Error('Transacción de réplica cancelada'))};
  tx.oncomplete=()=>{if(!settled){settled=true;resolve()}};
  tx.onerror=()=>fail(tx.error);
  tx.onabort=()=>fail(tx.error);
  try{
   for(const store of CLUB_PARTITION_STORES){
    const dest=tx.objectStore(store);
    for(const row of plan.rows[store])dest.put(row);
   }
   // Metadata is in the same transaction, so half-written snapshots cannot be verified.
   tx.objectStore(META_STORE).put({key:'current',schema:1,revision:plan.revision,
    teamIds:[...plan.teamIds],totalChars:plan.totalChars});
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

function verifyClubPilot(db:IDBDatabase,plan:ClubPartitionPlan):Promise<ClubPilotReceipt>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction([...ALL_STORES],'readonly')}
  catch(error){reject(error);return}
  let mismatch=false,finished=false,requests=0;
  const fail=(error:unknown)=>{if(finished)return;finished=true;
   reject(error||Error('Fallo de lectura del repositorio piloto'))};
  const guard=(request:IDBRequest,check:(row:any)=>boolean)=>{
   requests++;
   request.onsuccess=()=>{try{if(!check(request.result))mismatch=true}catch(_){mismatch=true}};
   request.onerror=()=>{mismatch=true};
  };
  tx.oncomplete=()=>{
   if(finished)return;finished=true;
   if(mismatch||requests!==1+plan.teamIds.length*CLUB_PARTITION_STORES.length){
    reject(Error('La réplica no coincide con la instantánea original'));return;
   }
   resolve(Object.freeze({status:'verified',revision:plan.revision,
    teamCount:plan.teamIds.length,recordCount:plan.teamIds.length*CLUB_PARTITION_STORES.length,
    totalChars:plan.totalChars,authoritative:false}));
  };
  tx.onerror=()=>fail(tx.error);
  tx.onabort=()=>fail(tx.error);
  try{
   guard(tx.objectStore(META_STORE).get('current'),row=>
    row?.key==='current'&&row.schema===1&&row.revision===plan.revision&&
    row.totalChars===plan.totalChars&&Array.isArray(row.teamIds)&&
    JSON.stringify(row.teamIds)===JSON.stringify(plan.teamIds));
   for(const store of CLUB_PARTITION_STORES){
    const source=plan.rows[store];
    for(const expected of source){
     guard(tx.objectStore(store).get(expected.teamId),row=>
      row?.teamId===expected.teamId&&row.revision===plan.revision&&
      row.dataJson===expected.dataJson);
    }
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** Manual opt-in only. Never called by the regular state writer or sync path. */
export async function pilotClubPartitions(input:{
 readonly factory:Pick<IDBFactory,'open'>;
 readonly plan:ClubPartitionPlan;
}):Promise<ClubPilotReceipt>{
 if(!input?.factory||typeof input.factory.open!=='function'||
  !input.plan||input.plan.schema!==1||!input.plan.teamIds?.length)
  throw Error('Repositorio piloto no disponible');
 const db=await openClubPilotDatabase(input.factory);
 try{
  await writeClubPilot(db,input.plan);
  return await verifyClubPilot(db,input.plan);
 }finally{db.close()}
}

/** Deletes ONLY the optional V20.5.63 mirror; never touches any original data. */
export function removeClubPilot(factory:Pick<IDBFactory,'deleteDatabase'>):Promise<true>{
 if(!factory||typeof factory.deleteDatabase!=='function')
  return Promise.reject(Error('Limpieza del repositorio piloto no disponible'));
 return new Promise((resolve,reject)=>{
  let finished=false,req:IDBOpenDBRequest;
  const fail=(error:unknown)=>{if(finished)return;finished=true;
   reject(error||Error('No se ha podido borrar la réplica de prueba'))};
  try{req=factory.deleteDatabase(CLUB_PILOT_DB)}catch(error){fail(error);return}
  req.onsuccess=()=>{if(!finished){finished=true;resolve(true)}};
  req.onerror=()=>fail(req.error);
  req.onblocked=()=>fail(Error('Cierra las otras pestañas para eliminar la réplica piloto'));
 });
}
