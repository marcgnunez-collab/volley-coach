/* V20.5.64 · Explicit incremental replica writes inside the existing pilot DB.
 * The live club, backups, scouting journal and cloud are never read or mutated.
 */
import {CLUB_ENTITY_STORES,type ClubEntityPlan,type ClubEntityStore,
 type ClubEntityRow} from './club-entity-plan';
import {openClubPilotDatabase} from './club-repository';

const MANIFEST='entityManifest';
const STORES=[...CLUB_ENTITY_STORES,MANIFEST];
type EntityKeys=Record<ClubEntityStore,string[]>;
interface PriorManifest{readonly schema?:unknown;readonly keys?:Partial<EntityKeys>}
export interface ClubEntityReceipt{
 readonly status:'verified';readonly authoritative:false;readonly partial:boolean;
 readonly entities:number;readonly added:number;readonly changed:number;
 readonly unchanged:number;readonly removed:number;readonly pendingIds:number;
}
const allKeys=(plan:ClubEntityPlan):EntityKeys=>({
 playerEntities:plan.rows.playerEntities.map(v=>v.key),
 trainingEntities:plan.rows.trainingEntities.map(v=>v.key),
 seasonEntities:plan.rows.seasonEntities.map(v=>v.key)
});
const validPrior=(row:unknown):row is PriorManifest=>
 !!row&&typeof row==='object'&&(row as {schema?:unknown}).schema===2;

async function writeDelta(db:IDBDatabase,plan:ClubEntityPlan){
 const keys=allKeys(plan),deleted=[] as {store:ClubEntityStore;key:string}[];
 let added=0,changed=0,unchanged=0,removed=0;
 await new Promise<void>((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction(STORES,'readwrite')}
  catch(error){reject(error);return}
  let settled=false;
  const fail=(error:unknown)=>{if(settled)return;settled=true;
   reject(error||Error('La escritura parcial se ha cancelado'))};
  const abort=(error:unknown)=>{try{tx.abort()}catch(_){}fail(error)};
  tx.oncomplete=()=>{if(!settled){settled=true;resolve()}};
  tx.onerror=()=>fail(tx.error);
  tx.onabort=()=>fail(tx.error);
  try{
   const manifest=tx.objectStore(MANIFEST),request=manifest.get('current');
   request.onsuccess=()=>{
    try{
     if(request.result!==undefined&&!validPrior(request.result))throw Error('Catálogo piloto incompatible');
     const prior=validPrior(request.result)?request.result as PriorManifest:null;
     for(const store of CLUB_ENTITY_STORES){
      const dest=tx.objectStore(store),now=new Set(keys[store]);
      const before=prior?.keys?.[store];
      if(before!==undefined&&!Array.isArray(before))throw Error('Catálogo piloto anterior no válido');
      for(const key of before||[]){
       if(typeof key!=='string')throw Error('Clave piloto no válida');
       if(!now.has(key)){dest.delete(key);deleted.push({store,key});removed++}
      }
      for(const row of plan.rows[store]){
       const existing=dest.get(row.key);
       existing.onsuccess=()=>{
        try{
         const actual=existing.result as ClubEntityRow|undefined;
         if(actual?.dataJson===row.dataJson&&actual?.teamId===row.teamId&&
          actual?.collection===row.collection){unchanged++;return}
         if(actual)changed++;else added++;
         dest.put(row);
        }catch(error){abort(error)}
       };
       existing.onerror=()=>abort(existing.error||Error('Entidad no legible'));
      }
     }
     manifest.put({key:'current',schema:2,revision:plan.revision,
      keys,teamIds:[...plan.teamIds],totalChars:plan.totalChars,
      pendingIds:plan.missingIds+plan.duplicatedIds+plan.invalidRecords});
    }catch(error){abort(error)}
   };
   request.onerror=()=>abort(request.error||Error('Catálogo no legible'));
  }catch(error){abort(error)}
 });
 return {keys,deleted,added,changed,unchanged,removed};
}

async function verifyDelta(db:IDBDatabase,plan:ClubEntityPlan,
 result:Awaited<ReturnType<typeof writeDelta>>):Promise<ClubEntityReceipt>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=db.transaction(STORES,'readonly')}
  catch(error){reject(error);return}
  let failed=false,settled=false;
  const fail=(error:unknown)=>{if(settled)return;settled=true;
   reject(error||Error('Fallo al leer las entidades'))};
  const check=(req:IDBRequest,valid:(value:any)=>boolean)=>{
   req.onsuccess=()=>{try{if(!valid(req.result))failed=true}catch(_){failed=true}};
   req.onerror=()=>{failed=true};
  };
  tx.oncomplete=()=>{
   if(settled)return;settled=true;
   if(failed){reject(Error('Las entidades guardadas no coinciden con el origen'));return}
   resolve(Object.freeze({status:'verified',authoritative:false,
    partial:!plan.complete,entities:CLUB_ENTITY_STORES.reduce((n,s)=>n+plan.rows[s].length,0),
    added:result.added,changed:result.changed,unchanged:result.unchanged,
    removed:result.removed,pendingIds:plan.missingIds+plan.duplicatedIds+plan.invalidRecords}));
  };
  tx.onerror=()=>fail(tx.error);
  tx.onabort=()=>fail(tx.error);
  try{
   const keys=result.keys;
   check(tx.objectStore(MANIFEST).get('current'),value=>value?.schema===2&&
    value?.revision===plan.revision&&value?.totalChars===plan.totalChars&&
    JSON.stringify(value?.keys)===JSON.stringify(keys)&&
    JSON.stringify(value?.teamIds)===JSON.stringify(plan.teamIds));
   for(const store of CLUB_ENTITY_STORES){
    const target=tx.objectStore(store);
    for(const row of plan.rows[store])check(target.get(row.key),actual=>
     actual?.key===row.key&&actual?.teamId===row.teamId&&
     actual?.collection===row.collection&&actual?.dataJson===row.dataJson);
   }
   for(const removed of result.deleted)check(tx.objectStore(removed.store).get(removed.key),
    value=>value===undefined);
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

/** Manual pilot only: compare, write changes, remove obsolete PILOT rows, verify. */
export async function pilotClubEntityDelta(input:{
 readonly factory:Pick<IDBFactory,'open'>;readonly plan:ClubEntityPlan;
}):Promise<ClubEntityReceipt>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==2)
  throw Error('Plan de entidades no disponible');
 const db=await openClubPilotDatabase(input.factory);
 try{
  const result=await writeDelta(db,input.plan);
  return await verifyDelta(db,input.plan,result);
 }finally{db.close()}
}
