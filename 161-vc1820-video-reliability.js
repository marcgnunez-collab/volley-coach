/* Volley Coach V18.2.0 — Operative recording & delay safety dashboard.
   Presentation + explicit user controls over existing engines, NO new recorder,
   media streams, database schema, score changes or cloud writes. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.2.0';
 const MB=1024*1024;
 const safeNum=v=>v===null||v===undefined||v===''||typeof v==='boolean'?null:(Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null);
 const formatBytes=v=>{
  const n=safeNum(v);if(n===null)return 'No disponible';
  if(n<MB)return `${Math.round(n/1024)} KB`;
  if(n<1024*MB)return `${(n/MB).toFixed(1)} MB`;
  return `${(n/(1024*MB)).toFixed(2)} GB`;
 };
 function remainingMinutes(freeBytes,bitrate){
  const free=safeNum(freeBytes),rate=safeNum(bitrate);
  if(free===null||rate===null||rate===0)return null;
  // 20% margin for container, browser metadata and filesystem variability.
  return Math.floor((free*8)/(rate*1.2*60));
 }
 function recorderState(d={}){
  if(d.writeError||d.recorderError)return {level:'error',label:'Revisar grabación',detail:String(d.writeError||d.recorderError)};
  if(d.stopping)return {level:'wait',label:'Finalizando archivo',detail:'No cierres la pestaña hasta que termine.'};
  if(d.active&&d.paused)return {level:'wait',label:'REC en pausa',detail:'Los fragmentos confirmados continúan guardados.'};
  if(d.active&&Number(d.pendingWrites)>6)return {level:'wait',label:'REC · guardado retrasado',detail:'Hay varios fragmentos esperando escritura.'};
  if(d.active)return {level:'rec',label:'Grabando',detail:'Se está grabando desde LIVE, no desde Delay.'};
  return {level:'idle',label:'Grabación detenida',detail:'Inicia una fuente LIVE antes de grabar.'};
 }
 function delayState(d={}){
  if(d.error)return {level:'error',label:'Error de Delay',detail:String(d.error)};
  if(d.starting||d.recoveryInProgress)return {level:'wait',label:'Preparando señal',detail:'Esperando al motor de captura.'};
  if(!d.running)return {level:'idle',label:'Delay detenido',detail:'Se necesita una cámara o transmisión LIVE.'};
  const span=safeNum(d.buffered)||0,needed=(safeNum(d.delaySeconds)||10)+0.65;
  if(span<needed)return {level:'wait',label:'Preparando búfer',detail:`${span.toFixed(1)} s disponibles; objetivo de ${Math.round(needed)} s.`};
  if(Number(d.lastChunkAgeMs)>5000)return {level:'wait',label:'Señal de Delay inestable',detail:'No llegan nuevos fragmentos con regularidad.'};
  return {level:'ready',label:'Delay disponible',detail:`${span.toFixed(1)} s en búfer · ${safeNum(d.delaySeconds)||10} s configurados.`};
 }
 function storageState(info,bitrate){
  const free=info&&safeNum(info.quota)!==null&&safeNum(info.usage)!==null?Math.max(0,Number(info.quota)-Number(info.usage)):null;
  const mins=remainingMinutes(free,bitrate);
  const level=free===null?'unknown':free<150*MB?'error':free<500*MB?'warn':'ok';
  return {free,minutes:mins,level,text:free===null?'Cuota no disponible':`${formatBytes(free)} libres`,estimate:mins===null?'Duración desconocida':`≈ ${mins} min a la calidad elegida`};
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC_VIDEO_RELIABILITY_1820)return true;
   const $=id=>doc.getElementById(id),studio=$('scout-video-hub');
   if(!studio||!$('vc181-transport')||!root.VC_VIDEO_STUDIO_1810)return false;
   const panel=doc.createElement('section');panel.id='vc182-panel';panel.className='vc182-panel';
   panel.setAttribute('aria-label','Estado de grabación y Delay');
   panel.innerHTML=`<div class="vc182-heading"><div><span class="vc182-kicker">V18.2 · SEGURIDAD DE VÍDEO</span><h3>Grabación y Delay</h3><p>Estado real de este dispositivo. No representa una copia en la nube.</p></div><span id="vc182-health" class="vc182-pill" data-level="idle">Preparado</span></div>
    <div class="vc182-metrics">
      <div class="vc182-metric"><span>Grabación</span><strong id="vc182-rec-label">Comprobando…</strong><small id="vc182-rec-detail">—</small></div>
      <div class="vc182-metric"><span>Fragmentos confirmados</span><strong id="vc182-durable">—</strong><small id="vc182-pending">—</small></div>
      <div class="vc182-metric"><span>Delay / señal</span><strong id="vc182-delay-label">Comprobando…</strong><small id="vc182-delay-detail">—</small></div>
      <div class="vc182-metric"><span>Espacio disponible</span><strong id="vc182-space">Comprobando…</strong><small id="vc182-estimate">Estimación orientativa</small></div>
    </div>
    <div class="vc182-controls"><button type="button" data-vc182-action="pause" id="vc182-pause" disabled>Pausar grabación</button><button type="button" data-vc182-action="delay" id="vc182-return-delay" disabled>Volver al Delay</button><button type="button" data-vc182-action="recovery">Recuperar grabaciones</button><button type="button" data-vc182-action="settings">Ajustar grabación</button><button type="button" data-vc182-action="persist" id="vc182-persist">Proteger almacenamiento</button><button type="button" data-vc182-action="export">Exportar diagnóstico</button></div>
    <p id="vc182-alert" class="vc182-alert" aria-live="polite" data-level="info">Las grabaciones locales requieren conservar y exportar el archivo. La nube del scouting es independiente.</p>`;
   const videoPanel=studio.querySelector('.v780-video-panel');
   // Inside the original video column, below the existing transport (never reparent the player).
   const transport=$('vc181-transport');transport.insertAdjacentElement('afterend',panel);
   const state={storage:null,storageAt:0,refreshes:0,lastError:'',lastNotice:'',mountedAt:Date.now()};
   const put=(id,text)=>{const el=$(id);if(el&&el.textContent!==String(text))el.textContent=String(text)};
   const feedback=(text,level='info')=>{state.lastNotice=text;put('vc182-alert',text);$('vc182-alert').dataset.level=level};
   const getRec=()=>{try{return root.vcRecordingDiagnostics?.()||{}}catch(err){state.lastError=String(err);return {recorderError:state.lastError}}};
   const getDelay=()=>{try{return root.liveDelayDiagnostics?.()||{}}catch(err){state.lastError=String(err);return {error:state.lastError}}};
   async function checkStorage(force=false){
    if(!force&&Date.now()-state.storageAt<45000)return state.storage;
    state.storageAt=Date.now();
    try{state.storage=typeof root.navigator?.storage?.estimate==='function'?await root.navigator.storage.estimate():null}
    catch(err){state.storage=null;state.lastError=String(err)}
    return state.storage;
   }
   function refresh(){
    const rec=getRec(),del=getDelay(),r=recorderState(rec),d=delayState(del);
    const rate=Number(rec.active?rec.recordingBitrate:($('vc-rec34-bitrate')?.value||rec.recordingBitrate||3500000));
    const storage=storageState(state.storage,rate);
    const trouble=r.level==='error'||d.level==='error'||storage.level==='error';
    const warning=r.level==='wait'||d.level==='wait'||storage.level==='warn';
    const level=trouble?'error':warning?'wait':rec.active?'rec':'idle';
    put('vc182-health',trouble?'Atención necesaria':rec.active&&rec.paused?'REC EN PAUSA':rec.active?'● REC EN CURSO':warning?'Revisar estado':'Preparado');$('vc182-health').dataset.level=level;
    put('vc182-rec-label',r.label);put('vc182-rec-detail',r.detail);
    put('vc182-durable',formatBytes(rec.durableBytes));
    put('vc182-pending',rec.active?`${Number(rec.durableChunks)||0} fragmentos · ${Number(rec.pendingWrites)||0} pendientes`: 'Sin grabación en curso');
    put('vc182-delay-label',d.label);put('vc182-delay-detail',d.detail);
    put('vc182-space',storage.text);put('vc182-estimate',storage.estimate+' · aproximada');
    const pause=$('vc182-pause');pause.disabled=!rec.active||rec.stopping;put('vc182-pause',rec.paused?'Reanudar REC':'Pausar REC');
    const back=$('vc182-return-delay');back.disabled=!del.running;
    if(!state.lastNotice){
      if(r.level==='error')feedback(`Error de REC: ${r.detail}`,'error');
      else if(storage.level==='error')feedback('Espacio disponible muy bajo. Exporta las grabaciones y libera espacio antes de otra sesión.','warn');
      else if(del.running&&d.level==='wait')feedback(d.detail,'info');
    }
    state.refreshes++;return {rec,delay:del,storage};
   }
   async function action(name){
    const rec=getRec(),del=getDelay();
    if(name==='pause'){
      if(!rec.active||rec.stopping)return feedback('No hay una grabación que se pueda pausar.','warn');
      if(typeof root.vcRecordingTogglePause!=='function')return feedback('El control original de REC no está disponible.','error');
      root.vcRecordingTogglePause();feedback('Se ha enviado la orden al grabador. Verifica su nuevo estado.');refresh();return;
    }
    if(name==='delay'){
      if(!del.running||typeof root.liveDelayReturn!=='function')return feedback('El Delay no está activo. Inicia la cámara primero.','warn');
      root.liveDelayReturn();feedback('Vuelta a la reproducción diferida solicitada.');refresh();return;
    }
    if(name==='recovery'){
      if(typeof root.vcRecordingRecover!=='function')return feedback('El recuperador de grabaciones no está disponible.','error');
      await root.vcRecordingRecover();feedback('Se ha abierto la recuperación local. No borres sesiones sin exportarlas.');return;
    }
    if(name==='settings'){
      if(typeof root.openLiveDelay!=='function')return feedback('No se puede abrir la configuración de vídeo.','error');
      root.openLiveDelay();feedback('Comprueba fuente, calidad, modo de guardado y permisos de cámara.');return;
    }
    if(name==='persist'){
      const storageApi=root.navigator?.storage;
      if(typeof storageApi?.persist!=='function')return feedback('Este navegador no permite solicitar almacenamiento persistente. Exporta los vídeos después de cada sesión.','warn');
      try{const accepted=await storageApi.persist();feedback(accepted?'Almacenamiento persistente concedido; sigue siendo necesario exportar los vídeos.':'El navegador no ha concedido almacenamiento persistente. Exporta los vídeos a un archivo.',accepted?'info':'warn')}
      catch(err){state.lastError=String(err);feedback('No se pudo solicitar persistencia: '+String(err?.message||err),'error')}
      return;
    }
    if(name==='export'){
      const data={version:VERSION,capturedAt:new Date().toISOString(),recording:getRec(),delay:getDelay(),storage:state.storage?{usage:state.storage.usage??null,quota:state.storage.quota??null}:null,scope:'Diagnóstico local; no confirma sincronización en la nube'};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
      const url=root.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='Volley_Coach_V18.2_diagnostico_video.json';a.hidden=true;doc.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),3000);
      feedback('Informe de vídeo preparado. Puede incluir detalles del dispositivo o del partido.');return;
    }
   }
   panel.addEventListener('click',event=>{const b=event.target.closest?.('[data-vc182-action]');if(!b||b.disabled)return;Promise.resolve(action(b.dataset.vc182Action)).catch(err=>{state.lastError=String(err);feedback('Error: '+String(err?.message||err),'error')})});
   const timer=root.setInterval?.(()=>{if(doc.hidden||!studio.classList.contains('active'))return;void checkStorage().then(refresh)},4000);
   void checkStorage(true).then(refresh);
   root.VC_VIDEO_RELIABILITY_1820={version:VERSION,refresh:()=>checkStorage(true).then(refresh),diagnostics:()=>({version:VERSION,refreshes:state.refreshes,recording:getRec(),delay:getDelay(),storage:storageState(state.storage,Number(getRec().recordingBitrate)||3500000),uiOnly:true,modifiesSync:false,modifiesRecordingEngine:false}),destroy:()=>{if(timer)root.clearInterval(timer);panel.remove()}};
   return true;
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();return true;
 }
 return {VERSION,MB,formatBytes,remainingMinutes,recorderState,delayState,storageState,mount};
});
