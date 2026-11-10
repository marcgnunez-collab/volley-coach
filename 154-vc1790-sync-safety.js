/* Volley Coach V17.9.0 · Protección antes de fusionar datos remotos.
   No modifica scoutings ni escribe en Supabase. Las copias se guardan en IndexedDB
   de ESTE navegador. Descarga manual necesaria para una copia fuera del equipo.
   La función beforeRemoteApply es invocada por el motor CAS antes de aplicar
   un estado remoto cuando existen cambios locales pendientes. */
(function(root, factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api.pure;
  if(root && root.document){
    if(root.VC_V179_SYNC_SAFETY) return;
    root.VC_V179_SYNC_SAFETY=api;
    api.install(root);
  }
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const VERSION='17.9.0';
  const DB_NAME='volley-coach-local-protection-179',STORE='snapshots',MAX_COPIES=12;
  const MAX_JSON_CHARS=25*1024*1024;
  let dbPromise=null,lastError='',lastSavedAt=0,savedSession=0,lastReason='',modalOpen=false;
  const state={saving:false};
  const pure={
    version:VERSION,
    classify(c={}){
      if(!c.connected)return {kind:'offline',heading:'Solo guardado local',detail:'Sin sesión de nube conectada.'};
      if(c.lastSyncError)return {kind:'error',heading:'Error de sincronización',detail:'Hay que verificar los cambios pendientes.'};
      if(c.dirty)return {kind:'pending',heading:'Cambios pendientes',detail:c.syncing?'Subiendo o comprobando cambios.':'Todavía no están confirmados en la nube.'};
      if(c.syncing)return {kind:'pending',heading:'Comprobando nube',detail:'La operación no ha finalizado.'};
      if(c.lastWriteAt)return {kind:'saved',heading:'Última subida confirmada',detail:'La subida fue aceptada por la nube; no confirma que el otro equipo la haya recibido.'};
      return {kind:'unknown',heading:'Conectado sin subida confirmada',detail:'La presencia no demuestra que los datos estén sincronizados.'};
    },
    validateState(value){
      if(!value||typeof value!=='object'||Array.isArray(value)||!value.equiposData||typeof value.equiposData!=='object'||Array.isArray(value.equiposData))throw Error('Estado local incompleto; la mezcla remota se ha detenido para protegerlo.');
      const json=JSON.stringify(value);
      if(!json||json.length>MAX_JSON_CHARS)throw Error('La copia local supera el tamaño de seguridad. Descarga una copia manual y revisa el almacenamiento.');
      return json;
    },
    safeDate(t){return Number.isFinite(+t)&&+t>0?new Date(+t).toLocaleString('es-ES'):'Sin confirmar';},
    needsProtection({dirty=false,remoteState=false,stampChanged=false}={}){return !!(dirty&&remoteState&&stampChanged);}
  };
  function openDb(win){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!win.indexedDB){reject(Error('IndexedDB no está disponible.'));return;}
      const req=win.indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||Error('Error al abrir almacén local.'));
      req.onblocked=()=>reject(Error('Almacén bloqueado por otra pestaña.'));
    }).catch(err=>{dbPromise=null;throw err;});
    return dbPromise;
  }
  async function all(win){
    const db=await openDb(win);
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
      req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>b.createdAt-a.createdAt));
      req.onerror=()=>reject(req.error||Error('No se pudo leer el historial local.'));
    });
  }
  async function put(win,item){
    const db=await openDb(win);
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(item);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||Error('No se pudo almacenar la copia.'));
      tx.onabort=()=>reject(tx.error||Error('El navegador interrumpió la copia.'));
    });
    // Las copias antiguas se retiran solo después de confirmar la nueva.
    const older=(await all(win)).slice(MAX_COPIES);
    if(older.length){
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        for(const copy of older)tx.objectStore(STORE).delete(copy.id);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('No se pudo limitar el historial.'));
      });
    }
  }
  function notify(win){try{win.dispatchEvent(new win.CustomEvent('vc179:snapshot'))}catch(_){}}
  async function beforeRemoteApply({localState,remoteStamp='',localRevision=0}={}){
    const win=typeof window!=='undefined'?window:null;
    if(!win)throw Error('Protección local no disponible.');
    if(state.saving)throw Error('Hay otra copia local en curso.');
    state.saving=true;
    try{
      const stateJson=pure.validateState(localState);
      const createdAt=Date.now();
      const item={id:'auto-'+createdAt+'-'+Math.random().toString(36).slice(2,10),createdAt,
        kind:'before-cloud-merge',remoteStamp:String(remoteStamp).slice(0,40),localRevision:Number(localRevision)||0,
        sizeBytes:new Blob([stateJson]).size,stateJson};
      await put(win,item);lastSavedAt=createdAt;savedSession++;lastReason='Antes de recibir cambios remotos';lastError='';
      notify(win);
      return {saved:true,id:item.id};
    }catch(err){
      lastError=String(err?.message||err);
      notify(win);
      // Importante: el llamador NO debe fusionar ni subir el estado cuando esto falla.
      throw Error('No se ha podido proteger el estado local antes de la mezcla: '+lastError);
    }finally{state.saving=false;}
  }
  async function manualBackup(){
    const win=window;
    const snapshot=win.estadoLocal?.();
    const stateJson=pure.validateState(snapshot);
    const createdAt=Date.now();
    const item={id:'manual-'+createdAt+'-'+Math.random().toString(36).slice(2,9),createdAt,kind:'manual',remoteStamp:'',localRevision:0,sizeBytes:new Blob([stateJson]).size,stateJson};
    await put(win,item);lastSavedAt=createdAt;savedSession++;lastReason='Copia manual';lastError='';notify(win);
    return item;
  }
  function downloadItem(item,win){
    if(!item?.stateJson)throw Error('La copia no contiene datos para descargar.');
    const blob=new Blob([item.stateJson],{type:'application/json;charset=utf-8'});
    const url=win.URL.createObjectURL(blob);
    const a=win.document.createElement('a');a.href=url;a.download='volley-coach-copia-v179-'+new Date(item.createdAt).toISOString().replace(/[:.]/g,'-')+'.json';
    win.document.body.appendChild(a);a.click();a.remove();
    win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);
  }
  async function remove(win,id){
    const db=await openDb(win);
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('No se pudo borrar la copia.'));});
    notify(win);
  }
  function diagnostics(){return {version:VERSION,lastSavedAt:lastSavedAt||null,snapshotsThisSession:savedSession,lastReason,lastError,protecting:state.saving,warning:'Copias solo en este dispositivo; descarga JSON para conservarlas fuera.'};}
  function install(win){
    const doc=win.document;let modal=null,button=null;
    const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n;};
    const style=el('style');style.id='vc179-safety-css';style.textContent=`
#vc179-protection[hidden]{display:none!important}#vc179-protection{position:fixed;inset:0;z-index:60000;background:rgba(10,27,44,.72);display:grid;place-items:center;padding:14px;color:#163a56;font:13px/1.5 system-ui,sans-serif}
#vc179-protection *{box-sizing:border-box}#vc179-protection .vc179-card{width:min(720px,100%);max-height:92vh;overflow:auto;background:white;border-radius:15px;padding:20px;box-shadow:0 18px 55px #0019}
#vc179-protection h2{margin:0 0 7px;font-size:21px!important;color:#143b5d}#vc179-protection p{margin:5px 0 12px;font-size:12px;color:#59748a}#vc179-protection button,.vc179-button{min-height:37px!important;padding:8px 11px!important;font:700 12px system-ui!important;border:1px solid #bfd6e6!important;border-radius:8px!important;background:#eef6fd!important;color:#164f79!important;cursor:pointer!important}
#vc179-protection .vc179-head,#vc179-protection .vc179-actions{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}#vc179-protection .vc179-actions{justify-content:flex-start;margin:15px 0}#vc179-protection .vc179-table{display:grid;gap:7px;max-height:44vh;overflow:auto}
#vc179-protection .vc179-row{padding:10px;background:#f5f9fc;border:1px solid #dce9f3;border-radius:9px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}#vc179-protection .vc179-row small{display:block;color:#607d93;font-size:11px}#vc179-protection .vc179-row .vc179-controls{display:flex;gap:5px}#vc179-protection .vc179-warning{background:#fff8ec;color:#755527;border:1px solid #ecd9af;border-radius:9px;padding:11px;font-size:12px}#vc179-protection .vc179-status{min-height:22px;color:#235f83;font-weight:700;margin-top:10px}
#vc179-sync-summary{padding:10px;border:1px solid #dde9f2;border-radius:9px;background:#f6fafd;margin:11px 0;font:12px/1.5 system-ui;color:#254b65}#vc179-sync-summary strong{display:block;font-size:13px}#vc179-sync-summary small{color:#6d8192}
@media(max-width:560px){#vc179-protection .vc179-card{padding:13px}#vc179-protection .vc179-row{align-items:stretch}#vc179-protection .vc179-controls{width:100%}#vc179-protection .vc179-controls button{flex:1}}`;
    const status=t=>{const n=doc.getElementById('vc179-protection-status');if(n)n.textContent=t;};
    function ensure(){
      if(modal)return modal;
      modal=el('div');modal.id='vc179-protection';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Copias de protección locales');
      const card=el('section',null,'vc179-card'),head=el('div',null,'vc179-head');
      const left=el('div');left.append(el('small','VOLLEY COACH · V17.9 · PROTECCIÓN DE DATOS'),el('h2','Copias protegidas'));
      const close=el('button','Cerrar');close.type='button';close.addEventListener('click',()=>{modal.hidden=true;modalOpen=false;});head.append(left,close);
      const intro=el('p','Antes de fusionar un cambio remoto con modificaciones locales pendientes se guarda una copia recuperable en este navegador. No se restaura automáticamente para evitar sobrescrituras.');
      const warning=el('div','Las copias locales pueden desaparecer si se borran los datos del navegador. Descarga un JSON en un lugar seguro. Una copia local no confirma el guardado en la nube.','vc179-warning');
      const actions=el('div',null,'vc179-actions');const make=el('button','Crear copia local'),refresh=el('button','Actualizar lista');
      make.type='button';refresh.type='button';actions.append(make,refresh);
      const list=el('div',null,'vc179-table');list.id='vc179-protection-list';const info=el('p','', 'vc179-status');info.id='vc179-protection-status';info.setAttribute('role','status');
      card.append(head,intro,warning,actions,list,info);modal.append(card);doc.body.append(modal);
      modal.addEventListener('click',e=>{if(e.target===modal){modal.hidden=true;modalOpen=false;}});
      make.addEventListener('click',async()=>{make.disabled=true;try{const item=await manualBackup();status('Copia guardada aquí. Descárgala para tenerla también fuera del navegador.');await render();}catch(e){status(String(e.message||e));}finally{make.disabled=false;}});
      refresh.addEventListener('click',()=>void render());return modal;
    }
    async function render(){
      if(!modalOpen)return;
      const list=doc.getElementById('vc179-protection-list');if(!list)return;
      list.replaceChildren();
      try{
        const items=await all(win);
        if(!items.length){list.append(el('p','Todavía no hay copias protegidas en este navegador.'));return;}
        for(const item of items){
          const row=el('div',null,'vc179-row'),description=el('div'),controls=el('div',null,'vc179-controls');
          description.append(el('strong',pure.safeDate(item.createdAt)),el('small',(item.kind==='manual'?'Copia manual':'Anterior a fusión con nube')+' · '+Math.round(item.sizeBytes/1024)+' KB'));
          const down=el('button','Descargar JSON'),del=el('button','Eliminar');down.type=del.type='button';
          down.addEventListener('click',()=>{try{downloadItem(item,win);status('Descarga iniciada. Comprueba que el archivo se haya guardado.');}catch(e){status(String(e.message||e));}});
          del.addEventListener('click',async()=>{if(!win.confirm('¿Eliminar esta copia local? Esta operación no se puede deshacer.'))return;try{await remove(win,item.id);status('Copia local eliminada.');await render();}catch(e){status(String(e.message||e));}});
          controls.append(down,del);row.append(description,controls);list.append(row);
        }
      }catch(err){status('No se pudo leer el historial: '+String(err.message||err));}
    }
    function drawSummary(){
      const summary=doc.getElementById('vc179-sync-summary');if(!summary)return;
      const c=win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{},s=pure.classify(c);
      summary.replaceChildren();summary.append(el('strong',s.heading),el('span',s.detail));
      const update=el('small',' · Última lectura: '+pure.safeDate(c.lastReadAt)+' · Última subida: '+pure.safeDate(c.lastWriteAt)+' · Conflictos de escritura detectados: '+(Number(c.conflictCount)||0));
      summary.append(update);
      if(lastSavedAt)summary.append(el('small',' · Última copia previa a fusión: '+pure.safeDate(lastSavedAt)));
      if(lastError)summary.append(el('strong','Protección local: '+lastError));
    }
    function hook(){
      const foot=doc.querySelector('#vc16040-sync-modal .vc16040-foot');
      if(!foot)return false;
      if(!button){button=el('button','Copias protegidas');button.type='button';button.id='vc179-open-protection';button.addEventListener('click',()=>{ensure().hidden=false;modalOpen=true;status('');void render();});}
      if(!button.isConnected)foot.append(button);
      const parent=doc.querySelector('#vc16040-sync-modal .vc16040-card');
      if(parent&&!doc.getElementById('vc179-sync-summary')){const summary=el('div');summary.id='vc179-sync-summary';const note=parent.querySelector('.vc16040-note');parent.insertBefore(summary,note||foot);}
      drawSummary();return true;
    }
    function boot(){
      doc.head.append(style);if(!hook()){
        const observer=new win.MutationObserver(()=>{if(hook())observer.disconnect();});observer.observe(doc.body,{childList:true,subtree:true});
      }
      win.addEventListener('vc179:snapshot',()=>{drawSummary();if(modalOpen)void render();});
      doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen){modal.hidden=true;modalOpen=false;}});
      doc.addEventListener('click',e=>{if(e.target?.closest?.('#vc154-presence-button,#vc16040-sync-modal'))win.setTimeout(drawSummary,50);},true);
      win.setInterval(()=>{if(!doc.getElementById('vc16040-sync-modal')?.hidden)drawSummary();},5000);
    }
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }
  return {version:VERSION,pure,beforeRemoteApply,manualBackup,diagnostics,install};
});
