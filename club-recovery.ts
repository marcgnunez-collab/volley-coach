/* V20.5.65 · Read the existing pilot after opening a NEW connection.
 * No active-data write, remote sync, scorer call or automatic recovery.
 * The operator may run this manually again after a browser restart.
 */
import {CLUB_ENTITY_STORES,type ClubEntityPlan} from './club-entity-plan';
import {CLUB_PILOT_DB} from './club-repository';

const MANIFEST='entityManifest';
const REQUIRED=[...CLUB_ENTITY_STORES,MANIFEST];
export interface ClubRecoveryReport{
 readonly status:'verified'|'missing'|'different';
 readonly readOnly:true;
 readonly authoritative:false;
 readonly records:number;
 readonly pendingIds:number;
 readonly partial:boolean;
}

/** Never creates or upgrades a missing pilot database: abort the upgrade event. */
function openExistingPilot(factory:Pick<IDBFactory,'open'>):Promise<IDBDatabase|null>{
 return new Promise((resolve,reject)=>{
  let request:IDBOpenDBRequest,missing=false,done=false;
  const fail=(error:unknown)=>{if(done)return;done=true;
   reject(error||Error('No se pudo abrir la copia piloto'))};
  try{request=factory.open(CLUB_PILOT_DB)}catch(error){fail(error);return}
  request.onupgradeneeded=()=>{
   missing=true;
   try{request.transaction?.abort()}catch(error){fail(error)}
  };
  request.onsuccess=()=>{
   const db=request.result;
   if(done){db.close();return}
   if(missing){db.close();done=true;resolve(null);return}
   if(REQUIRED.some(store=>!db.objectStoreNames.contains(store))){
    db.close();fail(Error('Esquema anterior: aún no hay repositorios de entidades'));return;
   }
   done=true;resolve(db);
  };
  request.onerror=()=>{
   if(missing&&!done){done=true;resolve(null)}
   else fail(request.error);
  };
  request.onblocked=()=>fail(Error('Otra pestaña bloquea la comprobación del piloto'));
 });
}

/** An independent readonly transaction checks every row and manifest field. */
function readRecovery(db:IDBDatabase,plan:ClubEntityPlan):Promise<ClubRecoveryReport>{
 return new Promise((resolve,reject)=>{
  let transaction:IDBTransaction;
  try{transaction=db.transaction([...CLUB_ENTITY_STORES,MANIFEST],'readonly')}
  catch(error){reject(error);return}
  let settled=false,missing=false,different=false,records=0;
  const fail=(error:unknown)=>{if(settled)return;settled=true;
   reject(error||Error('No se pudo comprobar la recuperación local'))};
  transaction.onerror=()=>fail(transaction.error);
  transaction.onabort=()=>fail(transaction.error);
  transaction.oncomplete=()=>{
   if(settled)return;settled=true;
   resolve(Object.freeze({status:missing?'missing':different?'different':'verified',
    readOnly:true,authoritative:false,records,pendingIds:
     plan.missingIds+plan.duplicatedIds+plan.invalidRecords,partial:!plan.complete}));
  };
  try{
   const manifest=transaction.objectStore(MANIFEST).get('current');
   manifest.onsuccess=()=>{
    try{
     const data=manifest.result;
     if(!data){missing=true;return}
     const keys=Object.fromEntries(CLUB_ENTITY_STORES.map(s=>[s,plan.rows[s].map(v=>v.key)]));
     if(data.schema!==2||data.totalChars!==plan.totalChars||
      data.pendingIds!==plan.missingIds+plan.duplicatedIds+plan.invalidRecords||
      JSON.stringify(data.teamIds)!==JSON.stringify(plan.teamIds)||
      JSON.stringify(data.keys)!==JSON.stringify(keys))different=true;
     // All requests are scheduled synchronously inside the active transaction.
     for(const store of CLUB_ENTITY_STORES){
      const source=transaction.objectStore(store);
      for(const row of plan.rows[store]){
       const req=source.get(row.key);records++;
       req.onsuccess=()=>{
        const saved=req.result;
        if(saved?.key!==row.key||saved?.teamId!==row.teamId||
         saved?.collection!==row.collection||saved?.dataJson!==row.dataJson)different=true;
       };
       req.onerror=()=>{different=true};
      }
     }
    }catch(error){try{transaction.abort()}catch(_){}fail(error)}
   };
   manifest.onerror=()=>{try{transaction.abort()}catch(_){}fail(manifest.error)};
  }catch(error){try{transaction.abort()}catch(_){}fail(error)}
 });
}

/** Read-after-reopen proof for the local pilot only. Does not prove disk durability or remote delivery. */
export async function inspectClubEntityRecovery(input:{
 readonly factory:Pick<IDBFactory,'open'>;
 readonly plan:ClubEntityPlan;
}):Promise<ClubRecoveryReport>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==2)
  throw Error('Comprobación de recuperación no disponible');
 const db=await openExistingPilot(input.factory);
 if(!db)return Object.freeze({status:'missing',readOnly:true,authoritative:false,
  records:0,pendingIds:input.plan.missingIds+input.plan.duplicatedIds+
   input.plan.invalidRecords,partial:!input.plan.complete});
 try{return await readRecovery(db,input.plan)}
 finally{db.close()}
}
