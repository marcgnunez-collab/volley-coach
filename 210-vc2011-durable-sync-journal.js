/* Volley Coach V20.1.1 · Durable sync journal / protected local batches.
 * One Supabase writer remains V962. This journal does NOT replay independent
 * action mutations or write to Supabase: it checkpoints full local snapshots
 * and requires CAS acknowledgement before deleting pending batches.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_SYNC_2011_JOURNAL=api.createBrowserJournal(root);if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.1.1',DB='vc2011-sync-journal-v1',STORE='checkpoints',MAX_PENDING=16,MAX_SIZE=26*1024*1024;
 const asText=x=>String(x??'').trim();
 function protectedError(message,code='VC2011_JOURNAL'){
  const e=new Error(message);e.code=code;return e;
 }
 function serialize(state){
  if(!state||typeof state!=='object'||Array.isArray(state)||!state.equiposData||typeof state.equiposData!=='object'||Array.isArray(state.equiposData))
   throw protectedError('El estado local no tiene la estructura necesaria. Se ha cancelado la subida.');
  let json;try{json=JSON.stringify(state);}catch(_){throw protectedError('No se ha podido serializar el estado local.');}
  if(!json||json.length>MAX_SIZE)throw protectedError('La copia excede el límite del diario seguro. Exporta el estado desde Gestión.');
  return json;
 }
 function indexedDBStore(win){
  let dbPromise=null;
  function open(){
   if(dbPromise)return dbPromise;
   dbPromise=new Promise((resolve,reject)=>{
    if(!win.indexedDB)return reject(protectedError('IndexedDB no está disponible: subida a la nube bloqueada.'));
    let req;try{req=win.indexedDB.open(DB,1);}catch(err){return reject(err);}
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||Error('No se puede abrir IndexedDB'));
    req.onblocked=()=>reject(Error('Diario bloqueado por otra pestaña'));
   }).catch(e=>{dbPromise=null;throw e;});
   return dbPromise;
  }
  async function transaction(mode,operation){
   const db=await open();
   return new Promise((resolve,reject)=>{
    let tx,result,failed=false;
    try{tx=db.transaction(STORE,mode);const os=tx.objectStore(STORE);result=operation(os);}
    catch(err){reject(err);return;}
    tx.oncomplete=()=>resolve(result && result.result!==undefined?result.result:undefined);
    tx.onerror=()=>{failed=true;reject(tx.error||Error('Transacción del diario fallida'));};
    tx.onabort=()=>{if(!failed)reject(tx.error||Error('Transacción del diario cancelada'));};
   });
  }
  async function list(){
   const db=await open();return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||Error('No se puede leer el diario'));
    tx.onabort=()=>reject(tx.error||Error('Lectura del diario cancelada'));
   });
  }
  async function put(entry){await transaction('readwrite',store=>store.put(entry));}
  async function removeMany(ids){if(!ids.length)return;await transaction('readwrite',store=>{for(const id of ids)store.delete(id);});}
  return {list,put,removeMany};
 }
 function createJournal({store,now=()=>Date.now(),makeId=()=>Math.random().toString(36).slice(2),onUpdate=()=>{}}={}){
  if(!store||typeof store.list!=='function'||typeof store.put!=='function'||typeof store.removeMany!=='function')throw Error('Journal store required');
  let chain=Promise.resolve(),error=null;
  const serial=fn=>{const task=chain.then(fn);chain=task.catch(()=>{});return task;};
  const byAccount=(entries,account)=>entries.filter(e=>e.accountId===account&&e.status==='pending').sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
  // Legacy estadoLocal() generates a fresh root updatedAt every time it is
  // called, even when no sport data changed. Ignore ONLY that volatile field
  // for checkpoint deduplication, keeping the original JSON for recovery.
  const stable=(json)=>{const state=JSON.parse(json);delete state.updatedAt;return JSON.stringify(state);};
  async function prepare({accountId,revision=0,state,mode='upload'}={}){return serial(async()=>{
   const account=asText(accountId);if(!account)throw protectedError('Sin identidad de cuenta para proteger la subida.');
   const stateJson=serialize(state);
   try{
    const pending=byAccount(await store.list(),account);
    const stableJson=stable(stateJson),sameState=x=>stable(x.stateJson)===stableJson;
    const upload=mode!=='draft';
    // Drafts are a single rolling durable copy, NOT one full snapshot per
    // keystroke or rally. Once upload starts, it has an independent ID so a
    // newer edit cannot be accidentally acknowledged by an older request.
    const previousDraft=pending.find(x=>x.mode==='draft');
    if(upload){const duplicate=pending.find(x=>x.mode==='upload'&&sameState(x));
     if(duplicate){error=null;return {id:duplicate.id,reused:true};}}
    if(upload&&pending.filter(x=>x.mode==='upload').length>=MAX_PENDING)
     throw protectedError('Hay demasiadas copias pendientes. Descarga una copia y revisa la nube antes de continuar.','VC2011_CAPACITY');
    const createdAt=now(),id=!upload&&previousDraft?previousDraft.id:'batch-'+createdAt+'-'+makeId();
    if(!upload&&previousDraft&&sameState(previousDraft)){error=null;return {id,reused:true};}
    await store.put({id,accountId:account,createdAt,revision:Number(revision)||0,status:'pending',mode:upload?'upload':'draft',stateJson});
    error=null;onUpdate();return {id,reused:false};
   }catch(e){error=asText(e.message);throw protectedError('No se ha podido guardar el lote pendiente en IndexedDB: '+error,e.code==='VC2011_CAPACITY'?e.code:'VC2011_JOURNAL');}
  });}
  async function acknowledge({accountId,id}={}){return serial(async()=>{
   const account=asText(accountId);if(!account||!id)throw protectedError('Confirmación sin identidad de lote.');
   try{
    const pending=byAccount(await store.list(),account),current=pending.find(x=>x.id===id);
    if(!current)throw protectedError('No se encuentra el lote enviado; no se eliminarán cambios locales.');
    // A successful full-state CAS supersedes older batches. Preserve batches
    // created later (or in the same millisecond) by other edits/tabs.
    const old=pending.filter(x=>x.id===id||x.createdAt<current.createdAt||(x.createdAt===current.createdAt&&stable(x.stateJson)===stable(current.stateJson))).map(x=>x.id);
    await store.removeMany(old);error=null;onUpdate();return {acknowledged:old.length};
   }catch(e){error=asText(e.message);throw protectedError('No se puede confirmar el lote persistente: '+error);}
  });}
  async function inspect(accountId=''){return serial(async()=>{
   const account=asText(accountId);
   try{const all=await store.list(),pending=byAccount(all,account);
    const otherAccounts=all.some(e=>e.status==='pending'&&e.accountId!==account);
    return {version:VERSION,pendingCount:pending.length,oldestAt:pending[0]?.createdAt||null,newestAt:pending[pending.length-1]?.createdAt||null,
     hasOtherAccounts:otherAccounts,lastError:error};
   }catch(e){error=asText(e.message);return {version:VERSION,pendingCount:null,oldestAt:null,newestAt:null,hasOtherAccounts:false,lastError:error};}
  });}
  async function guardCleanPull(accountId,isDirty){return serial(async()=>{
   if(isDirty)return true;
   try{const pending=byAccount(await store.list(),asText(accountId));
    if(pending.length)throw protectedError('Hay copias pendientes sin indicador de edición local. Revisa y exporta el diario antes de aplicar cambios remotos.','VC2011_ORPHAN');
    return true;
   }catch(e){throw protectedError(e.message,e.code||'VC2011_JOURNAL');}
  });}
  async function newest(accountId){return serial(async()=>{
   const list=byAccount(await store.list(),asText(accountId));return list[list.length-1]||null;
  });}
  return {version:VERSION,prepare,acknowledge,inspect,guardCleanPull,newest};
 }
 function createBrowserJournal(win){
  const core=createJournal({store:indexedDBStore(win),onUpdate:()=>{try{win.dispatchEvent(new win.CustomEvent('vc2011:journal'));}catch(_){}}});
  let timer=null,lastCheckpointError='';
  function noteDirty({accountId,revision,getState,isStillDirty}={}){
   const account=asText(accountId);if(!account)return;
   if(timer)win.clearTimeout(timer);
   timer=win.setTimeout(()=>{
    timer=null;if(typeof isStillDirty==='function'&&!isStillDirty())return;
    core.prepare({accountId:account,revision,state:getState?.(),mode:'draft'}).then(()=>{lastCheckpointError='';},e=>{lastCheckpointError=asText(e.message);win.dispatchEvent?.(new win.CustomEvent('vc2011:journal'));});
   },450);
  }
  function clearTimer(){if(timer)win.clearTimeout(timer);timer=null;}
  return {...core,noteDirty,clearTimer,checkpointError:()=>lastCheckpointError};
 }
 function mount(win){
  const doc=win.document,journal=win.VC_SYNC_2011_JOURNAL;if(!doc||!journal)return;
  const $=id=>doc.getElementById(id);
  let last='';
  const text=(tag,value)=>{const el=doc.createElement(tag);el.textContent=value;return el;};
  function account(){return win.VC_V962_CLOUD_EFFICIENT?.getAccountId?.()||'';}
  function ensure(){
   const panel=$('vc200-sync-reliability');if(!panel)return null;
   let wrap=$('vc2011-journal-panel');if(wrap)return wrap;
   wrap=doc.createElement('section');wrap.id='vc2011-journal-panel';wrap.className='vc2011-journal-panel';wrap.innerHTML='<div class="vc2011-head"><strong>Diario durable de sincronización</strong><span>V20.1.1 · IndexedDB local</span></div><p id="vc2011-journal-status" role="status">Comprobando copias pendientes…</p><div class="vc2011-actions"><button type="button" id="vc2011-refresh">Revisar diario</button><button type="button" id="vc2011-download">Descargar última copia pendiente</button></div><p class="vc2011-hint">Las copias no se aplican automáticamente ni se comparten con otros dispositivos. Solo una confirmación CAS permite retirar lotes pendientes. Guarda el JSON fuera del navegador.</p>';
   panel.append(wrap);
   $('vc2011-refresh').addEventListener('click',()=>void render());
   $('vc2011-download').addEventListener('click',async()=>{
    try{const item=await journal.newest(account());if(!item)throw Error('No hay una copia pendiente para esta cuenta.');
     const blob=new win.Blob([item.stateJson],{type:'application/json;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');
     a.href=url;a.download='volley-coach-pendiente-v2011-'+new Date(item.createdAt).toISOString().replace(/[:.]/g,'-')+'.json';doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);
     last='Descarga iniciada. Conserva este archivo para una restauración manual.';
    }catch(e){last=asText(e.message);}void render();
   });
   return wrap;
  }
  async function render(){if(!ensure())return;const a=account(),info=await journal.inspect(a),n=$('vc2011-journal-status'),button=$('vc2011-download');
   if(!n)return;const count=info.pendingCount===null?'No disponible':String(info.pendingCount);
   n.textContent=last||('Lotes pendientes para la cuenta actual: '+count+(info.oldestAt?' · El más antiguo: '+new Date(info.oldestAt).toLocaleString('es-ES'):'')+(info.hasOtherAccounts?' · También hay copias de otra cuenta en este navegador.':'')+(info.lastError?' · Error de almacenamiento; no subas datos antes de revisarlo.':''));
   if(button)button.disabled=!a||!info.pendingCount;
  }
  function boot(){ensure();void render();if(win.MutationObserver&&doc.body){const observer=new win.MutationObserver(()=>{if(ensure()){observer.disconnect();void render();}});observer.observe(doc.body,{subtree:true,childList:true});}
   win.addEventListener('vc2011:journal',()=>void render());win.addEventListener('vc200:sync-state',()=>{if($('vc2011-journal-panel'))void render();});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 }
 return {VERSION,serialize,protectedError,indexedDBStore,createJournal,createBrowserJournal,mount};
});
