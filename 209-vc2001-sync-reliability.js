/* Volley Coach V20.1.0 · Sync Engine 2.0 / Reliability Foundation.
 * Read-only monitoring and retry policy for the EXISTING CAS writer (v962).
 * No new cloud tables, no replacement writer, no automatic data restoration.
 * The UI never treats Realtime presence as proof of a successful upload.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_SYNC_200_POLICY=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.1.0';
 const cap=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
 const asText=v=>String(v??'').trim();
 function retryPolicy({failures=1,code='',message=''}={}){
  const c=asText(code).toUpperCase(),m=asText(message).toLowerCase();
  const journal=['VC2011_JOURNAL','VC2011_CAPACITY','VC2011_ORPHAN'].includes(c);
  const review=['VC1915_CONFLICT','VC1917_DELETE_CONFLICT'].includes(c)||/registros tienen cambios incompatibles|conflicto\(s\) entre edición y eliminación|revisa conflictos/.test(m);
  const account=/otra cuenta|ha cambiado la cuenta|cuenta de nube durante|sesión verificada|pendingaccountmismatch/.test(m);
  const fatal=/protección .*no cargada|no se ha podido proteger el estado local|sin aplicar cambios remotos|no se ha podido guardar.*copia|revisión necesaria|borrado masivo/.test(m);
  const auth=['401','403','42501','PGRST301'].includes(c)||/permission denied|jwt expired|invalid jwt|unauthorized|forbidden|row-level security/.test(m);
  if(journal||review||account||fatal||auth)return {retry:false,manualRequired:true,category:review?'conflict':account?'account':auth?'permission':'protection',delayMs:null};
  const attempt=cap(failures,1,24);
  // 2 s, 4 s, 8 s... max 2 min. Deterministic, testable; manual retries bypass delay.
  return {retry:true,manualRequired:false,category:'transient',delayMs:Math.min(120000,2000*Math.pow(2,Math.min(7,attempt-1)))};
 }
 function classify({cloud={},device={},online=true,now=Date.now()}={}){
  const c=cloud||{},d=device||{},pending=!!c.dirty,connected=!!c.connected;
  let key='unknown',heading='Estado de nube sin confirmar',explanation='Comprueba la conexión y el último guardado confirmado.';
  if(c.pendingAccountMismatch||c.blockedCategory==='account'){
   key='blocked';heading='Cuenta diferente · sincronización bloqueada';explanation='Hay datos asociados a otra cuenta. Descarga una copia y verifica la sesión antes de continuar.';
  }else if(c.blockedReason){key='blocked';heading='Revisión manual necesaria';explanation='La sincronización se ha detenido para evitar sobrescrituras. Abre Conflictos y copias.';}
  else if(!online){key='offline';heading=pending?'Guardado local · nube pendiente':'Sin conexión a Internet';explanation='Realtime y Supabase no están disponibles sin red.';}
  else if(!connected){key='offline';heading=pending?'Cambios locales pendientes':'Nube sin sesión';explanation='Conecta una cuenta para confirmar los cambios en la nube.';}
  else if(c.syncing){key='working';heading='Sincronización en curso';explanation='La operación aún no está confirmada por Supabase.';}
  else if(c.retryAt&&Number(c.retryAt)>now){key='retry';heading='Reintento pendiente';explanation='Los cambios locales permanecen pendientes. No confundas conexión con guardado.';}
  else if(c.lastSyncError){key='error';heading='Error de sincronización';explanation='Revisa el diagnóstico; no se ha confirmado esta operación.';}
  else if(pending){key='pending';heading='Pendiente de confirmación';explanation='Al menos un lote local debe confirmarse por el servidor.';}
  else if(c.lastWriteAt){key='confirmed';heading='Última subida confirmada';explanation='Supabase confirmó una escritura; no demuestra que otro dispositivo la haya leído.';}
  else if(c.lastReadAt){key='read';heading='Nube consultada';explanation='Se recibió una consulta; no consta ninguna subida confirmada en esta sesión.';}
  const realtime=d.realtimeState==='SUBSCRIBED';
  const peers=realtime&&Array.isArray(d.presencePeers)?d.presencePeers:[];
  const ids=new Set(peers.map(x=>asText(x?.deviceId)).filter(Boolean));
  return {key,heading,explanation,online:!!online,connected,pending,realtime,devices:realtime?ids.size:null,
   lastReadAt:Number(c.lastReadAt)||null,lastWriteAt:Number(c.lastWriteAt)||null,
   retryAt:Number(c.retryAt)||null,blockedCategory:asText(c.blockedCategory),
   conflictCount:Number(c.conflictCount)||0,localRevision:Number(c.localRevision)||0,
   confirmedRevision:Number.isInteger(c.lastConfirmedRevision)?c.lastConfirmedRevision:null};
 }
 function formatDate(n){const value=Number(n);return Number.isFinite(value)&&value>0?new Date(value).toLocaleString('es-ES'):'Sin confirmar';}
 function safeDiagnostics({cloud={},device={},online=true,now=Date.now()}={}){
  const c=cloud||{},d=device||{},status=classify({cloud:c,device:d,online,now});
  return {version:VERSION,exportedAt:new Date(now).toISOString(),status:status.key,online:status.online,
   connected:status.connected,pending:status.pending,realtime:status.realtime,devices:status.devices,
   lastReadAt:status.lastReadAt,lastWriteAt:status.lastWriteAt,retryAt:status.retryAt,
   consecutiveFailures:Number(c.consecutiveFailures)||0,blockedCategory:status.blockedCategory||null,
   conflictCount:status.conflictCount,localRevision:status.localRevision,confirmedRevision:status.confirmedRevision,
   pendingAccountMismatch:!!c.pendingAccountMismatch,protectionAvailable:!!c.protectionAvailable,
   lastErrorCode:/^[A-Za-z0-9_-]{1,32}$/.test(asText(c.lastErrorCode))?asText(c.lastErrorCode):null,lastErrorSummary:c.lastSyncError?'Error registrado; descripción omitida por privacidad':null,
   realtimeState:asText(d.realtimeState).slice(0,32),lastRealtimeAt:Number(d.lastRemoteAt)||null,
   // Never include Supabase URLs, tokens, user IDs, device IDs, names or actual scouting data.
   caveat:'Presencia, consulta y subida son eventos diferentes. La subida no confirma recepción en otro dispositivo.'};
 }
 function mount(win){
  const doc=win.document;if(!doc)return;
  const $=id=>doc.getElementById(id);
  let busy=false,notice='';
  const el=(tag,cls='',value)=>{const x=doc.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x;};
  const read=()=>({cloud:win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{},device:win.VC_DEVICE_SYNC?.diagnostics?.()||{},online:win.navigator?.onLine!==false,now:Date.now()});
  function ensure(){
   const base=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return null;
   let panel=$('vc200-sync-reliability');if(panel)return panel;
   panel=el('section','vc200-sync-reliability');panel.id='vc200-sync-reliability';panel.setAttribute('aria-label','Estado avanzado de sincronización');
   panel.innerHTML=`<div class="vc200-head"><div><small>V20.1 · SYNC ENGINE 2.0</small><h3>Fiabilidad y cambios pendientes</h3></div><strong id="vc200-sync-label" aria-live="polite">Comprobando</strong></div>
   <p id="vc200-sync-message" class="vc200-explanation"></p>
   <div class="vc200-sync-grid"><div><span>Guardado en nube</span><b id="vc200-last-write">—</b></div><div><span>Última consulta</span><b id="vc200-last-read">—</b></div><div><span>Tiempo de reintento</span><b id="vc200-retry">—</b></div><div><span>Conflictos CAS</span><b id="vc200-conflicts">—</b></div><div><span>Realtime</span><b id="vc200-realtime">—</b></div><div><span>Cambios locales pendientes</span><b id="vc200-pending">—</b></div></div>
   <div class="vc200-actions"><button type="button" id="vc200-retry-now">Comprobar y sincronizar</button><button type="button" id="vc200-backup">Crear copia protegida</button><button type="button" id="vc200-export-diagnostic">Descargar diagnóstico</button></div>
   <p class="vc200-feedback" id="vc200-feedback" role="status"></p><p class="vc200-disclaimer">El motor CAS existente sigue siendo el único que escribe en Supabase. Las copias protegidas permanecen en este navegador; utiliza «Descargar copia JSON» para conservarlas fuera.</p>`;
   const note=base.querySelector('.vc16040-note');base.insertBefore(panel,note||null);
   $('vc200-retry-now').addEventListener('click',async()=>{
    if(busy)return;const engine=win.VC_V962_CLOUD_EFFICIENT;
    if(!engine?.sync||!read().cloud.connected){feedback('Sin cuenta conectada. No se han modificado tus datos.');return;}
    busy=true;render();try{const result=await engine.sync({reason:'vc200-manual',allowWrite:true,bypassBackoff:true});
      const c=read().cloud;feedback(c.lastSyncError?'No confirmado: '+String(c.lastSyncError).slice(0,150):c.dirty?'Nube pendiente: quedan cambios locales.':result?'Operación completada. Comprueba el estado.':'Comprobación completada. Sin subida nueva.');
    }catch(err){feedback('No confirmado: '+String(err?.message||err).slice(0,160));}finally{busy=false;render();}
   });
   $('vc200-backup').addEventListener('click',async()=>{
    if(busy)return;busy=true;render();try{
     const item=await win.VC_V179_SYNC_SAFETY?.manualBackup?.();if(!item)throw Error('Protección IndexedDB no disponible.');
     feedback('Copia local protegida. Descarga una copia JSON externa antes de cambiar de dispositivo.');
    }catch(err){feedback('No se ha podido guardar: '+String(err?.message||err).slice(0,155));}finally{busy=false;render();}
   });
   $('vc200-export-diagnostic').addEventListener('click',()=>{
    try{const json=JSON.stringify(safeDiagnostics(read()),null,2),blob=new win.Blob([json],{type:'application/json;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=el('a');
     a.href=url;a.download='volley-coach-sync-diagnostico-v20.json';doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);
     feedback('Diagnóstico generado sin datos del scouting ni credenciales.');
    }catch(err){feedback('Error al descargar el diagnóstico: '+String(err?.message||err));}
   });
   return panel;
  }
  function feedback(msg){notice=String(msg);const x=$('vc200-feedback');if(x)x.textContent=notice;}
  function render(){
   if(!ensure())return;
   const {cloud,device,online,now}=read(),s=classify({cloud,device,online,now});
   const put=(id,str)=>{const x=$(id);if(x&&x.textContent!==String(str))x.textContent=String(str);};
   const panel=$('vc200-sync-reliability');panel.dataset.status=s.key;
   put('vc200-sync-label',s.heading);put('vc200-sync-message',s.explanation);
   put('vc200-last-write',formatDate(s.lastWriteAt));put('vc200-last-read',formatDate(s.lastReadAt));
   put('vc200-retry',s.retryAt&&s.retryAt>now?Math.ceil((s.retryAt-now)/1000)+' s':cloud.blockedReason?'Revisión manual':'Sin espera');
   put('vc200-conflicts',s.conflictCount);put('vc200-realtime',s.realtime?'Conectado':'Sin confirmación');
   put('vc200-pending',s.pending?'Sí · al menos 1 lote':'No detectados');
   const retry=$('vc200-retry-now'),backup=$('vc200-backup');if(retry)retry.disabled=busy||!s.connected;
   if(backup)backup.disabled=busy;put('vc200-feedback',notice);
  }
  let observer=null;
  function boot(){render();
   if(!$('vc200-sync-reliability')&&doc.body&&win.MutationObserver){observer=new win.MutationObserver(()=>{if(ensure()){observer.disconnect();observer=null;render();}});observer.observe(doc.body,{subtree:true,childList:true});}
   win.addEventListener('vc200:sync-state',render);
   win.addEventListener('online',render);win.addEventListener('offline',render);
   doc.addEventListener('click',e=>{if(e.target?.closest?.('#vc154-presence-button,#vc16040-sync-modal'))win.setTimeout(render,20);},true);
   win.setInterval(()=>{if(!$('vc16040-sync-modal')?.hidden)render();},4000);
  }
  win.VC_SYNC_200={version:VERSION,read:()=>safeDiagnostics(read()),open:()=>{win.VC_SYNC_PRO?.open?.();render();},render};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 }
 return {VERSION,retryPolicy,classify,formatDate,safeDiagnostics,mount};
});
