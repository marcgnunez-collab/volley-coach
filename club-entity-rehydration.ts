/* V20.5.66 · Manual, readonly rehearsal of an entity-level club recovery.
 * A complete manifest preserves array order, field presence and stable keys.
 * The reconstructed data is transient and NEVER replaces the live club.
 */
import {CLUB_ENTITY_STORES,type ClubEntityPlan,type ClubEntityRow,
 type ClubEntityStore} from './club-entity-plan';
import {openExistingPilot} from './club-recovery';
import {planClubPartitions,sameClubPartitionPlan} from './club-partitions';

const STORES=[...CLUB_ENTITY_STORES,'entityManifest'];
const ARRAY_FIELDS=new Set(['jugadores','historial','planificacion','plantillas','sesionActual','temporadas']);
export interface ClubRehydrationReport{
 readonly status:'ready'|'missing'|'different'|'incomplete'|'incompatible';
 readonly dryRun:true;readonly readOnly:true;readonly authoritative:false;
 readonly records:number;readonly teams:number;readonly pendingIds:number;
}
interface ReplicaSnapshot{readonly manifest:unknown;
 readonly rows:ReadonlyMap<string,ClubEntityRow|undefined>}
const object=(v:unknown):v is Record<string,unknown>=>
 !!v&&typeof v==='object'&&!Array.isArray(v);
const keyFor=(store:ClubEntityStore,teamId:string,collection:string,id:string)=>
 JSON.stringify([store,teamId,collection,id]);
const pending=(plan:ClubEntityPlan)=>plan.missingIds+plan.duplicatedIds+plan.invalidRecords;
const report=(status:ClubRehydrationReport['status'],plan:ClubEntityPlan,records=0):ClubRehydrationReport=>
 Object.freeze({status,dryRun:true,readOnly:true,authoritative:false,
  records,teams:plan.teamIds.length,pendingIds:pending(plan)});

/** One independent, readonly transaction; no implicit creation of pilot data. */
function readReplica(db:IDBDatabase,plan:ClubEntityPlan):Promise<ReplicaSnapshot>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction(STORES,'readonly')}
  catch(error){reject(error);return}
  let manifest:unknown,done=false;
  const rows=new Map<string,ClubEntityRow|undefined>();
  const fail=(error:unknown)=>{if(done)return;done=true;
   reject(error||Error('No se pudo leer la réplica local'))};
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  tx.oncomplete=()=>{if(!done){done=true;resolve({manifest,rows})}};
  try{
   const request=tx.objectStore('entityManifest').get('current');
   request.onsuccess=()=>{manifest=request.result};
   request.onerror=()=>fail(request.error);
   for(const store of CLUB_ENTITY_STORES){
    const destination=tx.objectStore(store);
    for(const planned of plan.rows[store]){
     const saved=destination.get(planned.key);
     saved.onsuccess=()=>{rows.set(planned.key,saved.result as ClubEntityRow|undefined)};
     saved.onerror=()=>fail(saved.error);
    }
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** Rebuild ONLY the selected club fields and original array order. Pure; no scouting. */
export function reconstructClubEntityFields(plan:ClubEntityPlan,
 saved:ReadonlyMap<string,ClubEntityRow|undefined>):Readonly<Record<string,unknown>>{
 if(plan.schema!==2||!plan.complete)throw Error('No se puede reconstruir un piloto incompleto');
 const result:Record<string,unknown>=Object.create(null);
 for(const teamId of plan.teamIds){
  const layout=plan.layout[teamId];
  if(!layout||!Array.isArray(layout.fields))throw Error('Disposición de entidades ausente');
  const team:Record<string,unknown>=Object.create(null);
  for(const field of layout.fields){
   if(Object.prototype.hasOwnProperty.call(team,field))throw Error('Campo repetido');
   if(ARRAY_FIELDS.has(field)){
    const order=layout.arrays[field];
    if(!Array.isArray(order))throw Error('Orden histórico ausente');
    const values:unknown[]=[];
    for(const key of order){
     const entity=saved.get(key);
     if(!entity||entity.teamId!==teamId||entity.collection!==field||entity.key!==key)
      throw Error('Entidad o clave histórica incompatible');
     values.push(JSON.parse(entity.dataJson));
    }
    Object.defineProperty(team,field,{value:values,enumerable:true,writable:true});
   }else{
    if(!['meta','temporada','temporadaActual','season','seasonName'].includes(field))
     throw Error('Campo no permitido en la reconstrucción');
    const store:ClubEntityStore=field==='meta'?'trainingEntities':'seasonEntities';
    const key=keyFor(store,teamId,field,'singleton');
    const entity=saved.get(key);
    if(!entity||entity.teamId!==teamId||entity.collection!==field||entity.key!==key)
     throw Error('Campo histórico ausente');
    Object.defineProperty(team,field,{value:JSON.parse(entity.dataJson),enumerable:true,writable:true});
   }
  }
  Object.defineProperty(result,teamId,{value:team,enumerable:true});
 }
 return Object.freeze(result);
}

/** Rehearses rebuilding every selected field, then checks exact JSON parity. */
export async function rehearseClubEntityRecovery(input:{
 readonly factory:Pick<IDBFactory,'open'>;readonly plan:ClubEntityPlan;readonly source:unknown;
}):Promise<ClubRehydrationReport>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==2||
  !object(input.source))throw Error('Ensayo de recuperación no disponible');
 const {plan}=input;
 if(!plan.complete)return report('incomplete',plan);
 const db=await openExistingPilot(input.factory);
 if(!db)return report('missing',plan);
 try{
  const snapshot=await readReplica(db,plan),manifest=snapshot.manifest;
  if(!manifest)return report('missing',plan);
  if(!object(manifest)||manifest.schema!==2||!object(manifest.layout))
   return report('incompatible',plan);
  const keys=Object.fromEntries(CLUB_ENTITY_STORES.map(store=>
   [store,plan.rows[store].map(row=>row.key)]));
  if(JSON.stringify(manifest.keys)!==JSON.stringify(keys)||
   JSON.stringify(manifest.teamIds)!==JSON.stringify(plan.teamIds)||
   manifest.totalChars!==plan.totalChars||manifest.pendingIds!==pending(plan)||
   JSON.stringify(manifest.layout)!==JSON.stringify(plan.layout))
   return report('different',plan);
  let records=0;
  for(const store of CLUB_ENTITY_STORES){
   for(const expected of plan.rows[store]){
    const row=snapshot.rows.get(expected.key);
    if(!row||row.key!==expected.key||row.teamId!==expected.teamId||
     row.collection!==expected.collection||row.dataJson!==expected.dataJson)
     return report('different',plan);
    records++;
   }
  }
  try{
   const reconstructed=reconstructClubEntityFields(plan,snapshot.rows);
   const original=planClubPartitions(input.source,'dry-run');
   const roundtrip=planClubPartitions(reconstructed,'dry-run');
   return report(sameClubPartitionPlan(original,roundtrip)?'ready':'different',plan,records);
  }catch(_){return report('incompatible',plan)}
 }finally{db.close()}
}
