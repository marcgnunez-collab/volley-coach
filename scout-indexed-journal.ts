/* V20.5.60 · The existing V9.3.1 IndexedDB journal's transactional WRITE path.
 * The legacy owner still opens the database, captures payloads and recovers data.
 * One transaction per command, no second writer, retries, schema upgrades or cloud calls.
 */
export type ScoutJournalMode='checkpoint'|'action-delta';
export interface ScoutJournalAnchor{
 readonly savedAt:string;
 readonly liveRally:unknown;
 readonly currentSet:number;
 readonly status:string;
 readonly match:unknown;
}
export interface ScoutJournalWrite{
 readonly db:Pick<IDBDatabase,'transaction'>;
 readonly fullStore:string;
 readonly liveStore:string;
 readonly key:string;
 readonly payload:Readonly<Record<string,unknown>>;
 readonly mode:ScoutJournalMode;
 /** Only called inside the existing write transaction if the base snapshot is absent. */
 readonly captureAnchor?:()=>ScoutJournalAnchor;
}

/** Resolves ONLY on transaction completion, never on an individual request's success. */
export function writeScoutJournalTransaction(input:ScoutJournalWrite):Promise<true>{
 if(!input||!input.db||typeof input.db.transaction!=='function'||
  typeof input.fullStore!=='string'||!input.fullStore||
  typeof input.liveStore!=='string'||!input.liveStore||input.fullStore===input.liveStore||
  typeof input.key!=='string'||!input.key||
  !input.payload||typeof input.payload!=='object'||Array.isArray(input.payload)||
  input.payload.key!==input.key||
  (input.mode!=='checkpoint'&&input.mode!=='action-delta')||
  (input.mode==='action-delta'&&typeof input.captureAnchor!=='function'))
  return Promise.reject(new Error('Contrato del diario IndexedDB no disponible'));

 return new Promise<true>((resolve,reject)=>{
  let tx:IDBTransaction;
  try{tx=input.db.transaction([input.fullStore,input.liveStore],'readwrite')}
  catch(error){reject(error);return}
  let finished=false;
  const rejectOnce=(error:unknown)=>{
   if(finished)return;
   finished=true;reject(error||new Error('Transacción IndexedDB cancelada'));
  };
  const abort=(error:unknown)=>{
   try{tx.abort()}catch(_){/* An automatic IDB abort may already be underway. */}
   rejectOnce(error);
  };
  tx.oncomplete=()=>{if(!finished){finished=true;resolve(true)}};
  tx.onerror=()=>rejectOnce(tx.error||new Error('Error de transacción IndexedDB'));
  tx.onabort=()=>rejectOnce(tx.error||new Error('Transacción IndexedDB abortada'));

  try{
   const full=tx.objectStore(input.fullStore),live=tx.objectStore(input.liveStore);
   if(input.mode==='checkpoint'){
    full.put(input.payload);
    live.delete(input.key);
    return;
   }
   const read=full.get(input.key);
   read.onsuccess=()=>{
    try{
     const priorFull=read.result as {match?:unknown;savedAt?:unknown}|undefined;
     if(!priorFull?.match){
      const anchor=input.captureAnchor!();
      if(!anchor||typeof anchor.savedAt!=='string')throw Error('Base de rally no disponible');
      // Keep the existing V9.3.1 anchor and delta shape, including timestamp priority.
      const current={...input.payload,savedAt:anchor.savedAt,
       liveRally:anchor.liveRally,currentSet:anchor.currentSet,status:anchor.status};
      full.put({...current,reason:'initial-action-anchor',match:anchor.match});
      live.put(current);
      return;
     }
     // A delayed action must never overwrite a newer complete checkpoint.
     if(Date.parse(String(priorFull.savedAt||0))>
      Date.parse(String(input.payload.savedAt)))return;
     const prior=live.get(input.key);
     prior.onsuccess=()=>{
      try{
       const previous=prior.result as {savedAt?:unknown}|undefined;
       if(!previous||Date.parse(String(previous.savedAt||0))<=
        Date.parse(String(input.payload.savedAt)))live.put(input.payload);
      }catch(error){abort(error)}
     };
     prior.onerror=()=>abort(prior.error||new Error('No se pudo leer el rally pendiente'));
    }catch(error){abort(error)}
   };
   read.onerror=()=>abort(read.error||new Error('No se pudo leer el checkpoint'));
  }catch(error){abort(error)}
 });
}
