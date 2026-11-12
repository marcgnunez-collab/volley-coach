/* Volley Coach V19.2.0 · Video Connection Hub
 * A single entry point for camera selection and diagnostics. Reuses the V7.6
 * WebRTC publisher/viewer, V18.4 Live/Delay, and the ORIGINAL recorder.
 * No new MediaStream, MediaRecorder, persistence layer or cloud listener.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='19.2.0';
 const SOURCES=['local','remote','file'];
 function normalizeSource(value){return SOURCES.includes(value)?value:'local'}
 function stateOf({source='local',remoteConnected=false,remoteWanted=false,remotePreparing=false,remoteError=false,captureRunning=false,recording=false,hasLink=false,secure=true,mediaDevices=true}={}){
  source=normalizeSource(source);
  if(source==='file')return {kind:'file',label:'Archivo local',help:'Abre un vídeo guardado para revisarlo. No inicia ninguna cámara.'};
  if(source==='remote'&&captureRunning&&!remoteConnected)return {kind:'disconnected',label:'Señal remota interrumpida',help:'La captura estaba activa pero se ha perdido el móvil. Comprueba la reconexión antes de continuar.'};
  if(captureRunning)return {kind:'running',label:recording?'Live + Delay y REC activos':'Live + Delay activo',help:'La captura utiliza el motor original. Cambia entre directo y Delay sin detenerla.'};
  if(source==='local'){
   if(!secure||!mediaDevices)return {kind:'blocked',label:'Cámara no disponible',help:'Abre Volley Coach con HTTPS y comprueba los permisos de cámara del navegador.'};
   return {kind:'local',label:'Cámara local seleccionada',help:'Inicia Live + Delay cuando quieras comenzar a capturar; el navegador puede pedir permiso.'};
  }
  if(remoteConnected)return {kind:'connected',label:'Móvil conectado',help:'La señal de vídeo ha llegado. Inicia Live + Delay para grabar o usar el retraso.'};
  if(remotePreparing)return {kind:'waiting',label:'Preparando conexión',help:'Creando la sesión y estableciendo WebRTC…'};
  if(remoteError)return {kind:'disconnected',label:'Error de conexión remota',help:'La cámara no transmite. Comprueba los permisos y pulsa Reconectar.'};
  if(remoteWanted&&hasLink)return {kind:'waiting',label:'Esperando señal del móvil',help:'Escanea el QR y pulsa Iniciar transmisión en el móvil.'};
  if(hasLink)return {kind:'disconnected',label:'Móvil sin señal',help:'Comprueba la transmisión del móvil o pulsa Reconectar.'};
  return {kind:'idle',label:'Sin emparejar',help:'Genera un QR y ábrelo en el móvil para transmitir vídeo.'};
 }
 function safeDiagnostics(raw={}){
  // Whitelist only: never export the QR URL, room, stream ID, password,
  // Supabase credentials, user IDs or media stream object.
  const number=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):null;
  const setting=raw.trackSettings||{};
  return {
   version:VERSION,source:normalizeSource(raw.source),status:String(raw.status||'unknown').slice(0,40),
   https:!!raw.https,online:!!raw.online,mediaDevices:!!raw.mediaDevices,
   remoteConnected:!!raw.remoteConnected,remoteWanted:!!raw.remoteWanted,
   reconnectAttempts:number(raw.reconnectAttempts),captureRunning:!!raw.captureRunning,
   recording:!!raw.recording,
   video:{width:number(setting.width),height:number(setting.height),frameRate:number(setting.frameRate)}
  };
 }
 function mount(root){
  const doc=root.document;
  if(!doc)return false;
  function start(){
   if(root.VC_VIDEO_CONNECTION_HUB_1920)return true;
   if(new URLSearchParams(root.location?.search||'').has('vcCamera'))return false; // Phone publisher remains exclusive.
   const $=id=>doc.getElementById(id);
   const studio=$('scout-video-hub'),panel=$('vc183-capture-side');
   if(!studio||!panel||!root.VC_VIDEO_WORKSPACES_1830)return false;
   const hub=doc.createElement('section');hub.id='vc1920-connection-hub';hub.className='vc1920-hub';
   hub.setAttribute('aria-label','Centro de conexiones de vídeo');
   hub.innerHTML=`<div class="vc1920-heading"><div><span>V19.2.0 · CONNECTION HUB</span><h3>Conexión de vídeo</h3><p>Un solo origen de captura para Live, Delay y grabación.</p></div><strong id="vc1920-status" class="vc1920-status" role="status" aria-live="polite">Comprobando…</strong></div>
    <label class="vc1920-picker">Fuente de vídeo<select id="vc1920-source" aria-label="Fuente de vídeo"><option value="local">Cámara de este dispositivo</option><option value="remote">Móvil por QR / WebRTC</option><option value="file">Vídeo guardado</option></select></label>
    <div class="vc1920-source-help" id="vc1920-help" role="status" aria-live="polite"></div><small id="vc1920-signal-meta" class="vc1920-signal-meta">Sin información de calidad de señal</small>
    <div id="vc1920-remote" class="vc1920-remote" hidden>
     <div class="vc1920-steps"><span><b>1.</b> Preparar QR en el ordenador</span><span><b>2.</b> Abrir en móvil y transmitir</span><span><b>3.</b> Activar Live + Delay</span></div>
     <div class="vc1920-pair"><div id="vc1920-qr" class="vc1920-qr" aria-label="Código QR para cámara móvil"><span>Pulsa «Generar QR»</span></div>
      <div class="vc1920-connect-actions"><button type="button" data-vc1920-action="prepare" class="primary">Generar QR / conectar</button><button type="button" data-vc1920-action="copy">Copiar enlace</button><button type="button" data-vc1920-action="retry">Reconectar</button><button type="button" data-vc1920-action="reset">Nuevo QR</button><button type="button" data-vc1920-action="disconnect">Desconectar móvil</button></div></div>
     <p class="vc1920-security">El QR incluye una clave privada temporal: compártelo solo con el dispositivo de grabación. La conexión requiere señalización por Internet.</p>
    </div>
    <div class="vc1920-footer"><button type="button" data-vc1920-action="start" class="primary" id="vc1920-start">Iniciar Live + Delay</button><button type="button" data-vc1920-action="stop" id="vc1920-stop">Detener Live + Delay</button><button type="button" data-vc1920-action="advanced">Opciones de cámara</button><button type="button" data-vc1920-action="diagnostics">Diagnóstico</button></div>
    <p class="vc1920-feedback" id="vc1920-feedback" role="status" aria-live="polite">Selecciona la fuente y prepara la conexión.</p>`;
   panel.insertBefore(hub,panel.firstChild);
   studio.classList.add('vc1920-ready');
   const label=panel.querySelector('[data-vc1845-group="source"] .vc1845-group-heading strong');
   if(label)label.textContent='Estado de captura';
   const state={source:normalizeSource($('vc183-source-select')?.value),lastQrSignature:'',lastError:'',busy:false,lastStatus:'',updates:0};
   function capture(){try{return root.liveDelayDiagnostics?.()||{}}catch(_){return {}}}
   function recorder(){try{return root.vcRecordingDiagnostics?.()||{}}catch(_){return {}}}
   function remote(){try{return root.VC_REMOTE_CAMERA?.diagnostics?.()||{}}catch(_){return {}}}
   function isRecording(){const d=recorder();return !!(d.active||d.running||d.recording||d.stopping)}
   function cameraLocked(){const d=capture();return !!(d.running||d.starting||isRecording())}
   function hasLink(){return !!$('vc-remote-link')?.value}
   function report(text,error=false){const el=$('vc1920-feedback');if(el){el.textContent=text;el.dataset.error=error?'1':'0'}state.lastError=error?text:''}
   function chooseSource(value){
    const next=normalizeSource(value);
    if(cameraLocked()&&next!==state.source){report('Detén la captura y finaliza REC antes de cambiar de fuente.',true);update();return false}
    if(next==='file'){
     root.VC_VIDEO_WORKSPACES_1830.setScreen?.('revision');
     state.source='file';update();
     $('v780-file')?.click(); // Original selector, only on user action.
     report('Abre un archivo local en Revisión; no se inicia otra cámara.');
     return true;
    }
    state.source=next;
    if($('vc183-source-select'))$('vc183-source-select').value=next;
    if($('v117-review-live-source-select'))$('v117-review-live-source-select').value=next;
    if(typeof root.v117ReviewChooseLiveSource==='function')root.v117ReviewChooseLiveSource(next);
    else if(typeof root.vcRemoteSourceChanged==='function')root.vcRemoteSourceChanged(next);
    update();return true;
   }
   function qrView(){
    const link=$('vc-remote-link')?.value||'';
    const dest=$('vc1920-qr'),original=$('vc-remote-qr');if(!dest)return;
    const qr=original?.querySelector('img')||original?.querySelector('canvas');
    // The QR library can finish AFTER the link was written; refresh on readiness.
    const signature=link+'|'+(qr?'ready':'fallback');
    if(signature===state.lastQrSignature)return;
    state.lastQrSignature=signature;
    dest.replaceChildren();
    if(link&&qr)dest.appendChild(qr.cloneNode(true));
    else{const el=doc.createElement('span');el.textContent=link?'QR no disponible. Pulsa «Copiar enlace».':'Pulsa «Generar QR»';dest.appendChild(el)}
   }
   function snapshot(){
    const d=remote(),stream=root.VC_REMOTE_CAMERA?.getStream?.();
    const track=stream?.getVideoTracks?.().find(t=>t.readyState==='live');
    const cd=capture();
    const raw={source:state.source,status:state.lastStatus,https:root.isSecureContext!==false,
     online:root.navigator?.onLine!==false,mediaDevices:!!root.navigator?.mediaDevices,
     remoteConnected:!!root.VC_REMOTE_CAMERA?.isConnected?.(),remoteWanted:!!d.viewerWanted,
     reconnectAttempts:d.reconnectAttempts,captureRunning:!!cd.running,
     recording:isRecording(),trackSettings:track?.getSettings?.()||{}};
    return safeDiagnostics(raw);
   }
   function update(){
    const c=capture(),r=remote();
    if(state.source!=='file'&&!cameraLocked()&&['local','remote'].includes(r.source))state.source=r.source;
    const status=stateOf({source:state.source,
     remoteConnected:!!root.VC_REMOTE_CAMERA?.isConnected?.(),remoteWanted:!!r.viewerWanted,
     remotePreparing:state.busy||!!r.reconnecting,remoteError:/^(ERROR|SIN CONEXI[ÓO]N|SIN V[ÍI]DEO|SE[ÑN]AL PERDIDA|SIN SE[ÑN]AL|REINTENTAR)/i.test($('vc-remote-status')?.textContent||''),
     captureRunning:!!c.running,recording:isRecording(),
     hasLink:hasLink(),secure:root.isSecureContext!==false,mediaDevices:!!root.navigator?.mediaDevices});
    state.lastStatus=status.kind;state.updates++;
    const badge=$('vc1920-status');if(badge){badge.textContent=status.label;badge.dataset.kind=status.kind}
    if($('vc1920-help'))$('vc1920-help').textContent=status.help;
    if($('vc1920-source')){
     $('vc1920-source').value=state.source;
     $('vc1920-source').disabled=!!(c.running||c.starting||isRecording());
    }
    const signal=$('vc1920-signal-meta');if(signal){
     const track=root.VC_REMOTE_CAMERA?.getStream?.()?.getVideoTracks?.()?.find(t=>t.readyState==='live');
     const cfg=track?.getSettings?.()||{};
     const size=(cfg.width&&cfg.height)?cfg.width+'×'+cfg.height:'Resolución no informada';
     const fps=cfg.frameRate?' · '+Math.round(cfg.frameRate)+' fps':'';
     signal.textContent=state.source==='remote'?(track?'Señal recibida: '+size+fps:'No hay fotogramas remotos confirmados'):'Fuente: '+(state.source==='local'?'cámara del dispositivo':'archivo local');
    }
    const rem=$('vc1920-remote');if(rem)rem.hidden=state.source!=='remote';
    const start=$('vc1920-start');if(start){
     start.textContent=state.source==='file'?'Abrir archivo':c.running?'Live + Delay activos':'Iniciar Live + Delay';
     start.disabled=!!(c.running||c.starting||state.busy||(state.source==='remote'&&!root.VC_REMOTE_CAMERA?.isConnected?.()));
    }
    const stop=$('vc1920-stop');if(stop)stop.disabled=!c.running||isRecording()||state.busy||!!$('vc183-stop')?.disabled;
    for(const btn of hub.querySelectorAll('[data-vc1920-action]')){
     const a=btn.dataset.vc1920Action;
     if(['reset','disconnect'].includes(a))btn.disabled=cameraLocked()||state.busy;
     if(a==='retry')btn.disabled=state.busy||!hasLink()||cameraLocked();
     if(a==='copy')btn.disabled=!hasLink();
     if(a==='prepare')btn.disabled=state.busy||cameraLocked();
    }
    qrView();return status;
   }
   async function prepare(force=false){
    if(cameraLocked()){report('Detén Live + Delay y guarda REC antes de generar otro QR.',true);return false}
    if(force&&hasLink()&&typeof root.confirm==='function'&&!root.confirm('Crear otro QR desconectará la cámara asociada al anterior. ¿Continuar?'))return false;
    if(!chooseSource('remote'))return false;
    if(typeof root.vcRemotePrepare!=='function'){report('El módulo de cámara remota no está cargado.',true);return false}
    // Selecting remote already creates a session in V7.6; never start two viewers.
    if(!force&&hasLink()){
     if(!remote().viewerWanted&&!root.VC_REMOTE_CAMERA?.isConnected?.())return retry();
     report('El QR actual sigue activo. Escanéalo en el móvil.');update();return true
    }
    state.busy=true;update();report('Preparando la conexión WebRTC…');
    try{await root.vcRemotePrepare(force);report('QR preparado. Inicia la transmisión en el móvil.');return true}
    catch(err){report('Error preparando la cámara: '+String(err?.message||err),true);return false}
    finally{state.busy=false;state.lastQrSignature='';update()}
   }
   async function retry(){
    if(cameraLocked()){report('Detén Live + Delay antes de reconectar manualmente.',true);return false}
    if(!hasLink())return prepare(false);
    if(typeof root.vcRemoteReconnect!=='function'){report('Reconexión no disponible.',true);return false}
    state.busy=true;update();report('Reconectando la señal…');
    try{await root.vcRemoteReconnect();report('Reconexión solicitada. Comprueba la cámara del móvil.');return true}
    catch(err){report('No se pudo reconectar: '+String(err?.message||err),true);return false}
    finally{state.busy=false;update()}
   }
   function startCapture(){
    if(state.source==='file'){root.VC_VIDEO_WORKSPACES_1830.setScreen?.('revision');$('v780-file')?.click();return true}
    if(state.source==='remote'&&!root.VC_REMOTE_CAMERA?.isConnected?.()){report('No se recibe vídeo del móvil. Escanea el QR e inicia la transmisión.',true);return false}
    const button=$('vc183-start');
    if(!button||button.disabled){report('El motor Live + Delay no está listo o ya está capturando.',true);return false}
    button.click();report('Iniciando el motor original de Live + Delay…');return true;
   }
   function stopCapture(){
    if(isRecording()){report('Finaliza y guarda REC antes de detener la cámara.',true);return false}
    const btn=$('vc183-stop');
    if(!btn||btn.disabled){report('La cámara ya está detenida o no hay una captura activa.',true);return false}
    btn.click();report('Deteniendo el motor original de Live + Delay…');return true;
   }
   function exportDiagnostics(){
    const payload={...snapshot(),generatedAt:new Date().toISOString(),lastError:state.lastError.slice(0,200)};
    // Avoid writing arbitrary error messages with sensitive URLs.
    delete payload.lastError;
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=doc.createElement('a');a.href=url;a.download='volley-coach-video-diagnostico-v19.2.0.json';
    doc.body.appendChild(a);a.click();a.remove();root.setTimeout?.(()=>URL.revokeObjectURL(url),500);
    report('Diagnóstico descargado sin enlaces de cámara ni credenciales.');return payload;
   }
   $('vc1920-source').addEventListener('change',event=>chooseSource(event.target.value));
   hub.addEventListener('click',async event=>{
    const btn=event.target.closest('[data-vc1920-action]');if(!btn||btn.disabled)return;
    const action=btn.dataset.vc1920Action;
    try{
     if(action==='prepare')await prepare(false);
     else if(action==='reset')await prepare(true);
     else if(action==='copy'){
      if(!hasLink())report('Genera un QR antes de copiar el enlace.',true);
      else if(typeof root.vcRemoteCopyLink==='function')await root.vcRemoteCopyLink();
      report('Enlace de cámara listo para compartir solo con tu móvil.');
     }
     else if(action==='retry')await retry();
     else if(action==='disconnect'){
      if(cameraLocked())report('Finaliza la captura y guarda REC antes de desconectar.',true);
      else{await root.vcRemoteDisconnect?.();report('Móvil desconectado; la sesión QR puede reutilizarse.');}
     }
     else if(action==='start')startCapture();
     else if(action==='stop')stopCapture();
     else if(action==='advanced'){
      if(typeof root.v117ReviewConfigureLive==='function')root.v117ReviewConfigureLive();
      else report('No está disponible el panel avanzado de cámara.',true);
     }
     else if(action==='diagnostics')exportDiagnostics();
    }catch(err){report('Error de conexión: '+String(err?.message||err),true)}
    update();
   });
   // Poll only presentation/telemetry. No network polling or duplicated WebRTC connections.
   const interval=root.setInterval?.(()=>{if(!doc.hidden&&studio.isConnected)update()},1500);
   doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)update()});
   update();
   root.VC_VIDEO_CONNECTION_HUB_1920={version:VERSION,chooseSource,prepare,retry,refresh:update,diagnostics:snapshot,
    details:()=>({version:VERSION,source:state.source,uiUpdates:state.updates,hasOriginalCapture:!!$('vc183-start'),
      originalPreviewCount:doc.querySelectorAll('#vc-remote-preview').length,
      originalLiveCount:doc.querySelectorAll('#v117-review-stream').length,
      originalPlayerCount:doc.querySelectorAll('#v780-player-video').length,
      syncTouched:false,recordingEngineReplaced:false}),
    dispose:()=>{if(interval)root.clearInterval?.(interval)}};
   return true;
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});
  else if(!start())root.setTimeout?.(start,100);
  return true;
 }
 return {VERSION,normalizeSource,stateOf,safeDiagnostics,mount};
});
