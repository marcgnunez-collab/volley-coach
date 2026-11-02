
(()=>{
'use strict';

const VERSION='16.0.0';
const $=id=>document.getElementById(id);
const state={
  context:'training',
  stream:null,
  recorderStream:null,
  recorder:null,
  mediaSource:null,
  sourceBuffer:null,
  mediaUrl:null,
  appendQueue:[],
  appendBusy:false,
  running:false,
  delay:10,
  maxBuffer:120,
  mode:'delay',
  initialized:false,
  mime:'',
  timer:null,
  prunePending:false,
  cameraReady:false,
  lastCameraId:'',
  streamStartedAt:0,
  generation:0,
  chunkSerial:Promise.resolve(),
  queueBytes:0,
  pendingBlobBytes:0,
  chunkCount:0,
  lastChunkAt:0,
  overloads:0,
  quotaFailures:0,
  lastError:'',
  lastBufferEnd:null,
  stalledSince:0
};

function setStatus(text,kind=''){
  const el=$('live-delay-support');if(!el)return;
  el.className=`live-delay-support ${kind||''}`;
  el.innerHTML=text;
}
function setState(id,text,on=false){
  const el=$(id);if(!el)return;el.textContent=text;el.classList.toggle('on',!!on);
}
function fmtSec(v){
  v=Number(v);if(!Number.isFinite(v)||v<0)return '—';
  if(v>=60){
    const m=Math.floor(v/60),s=Math.round(v%60);
    return s?`${m} min ${s} s`:`${m} min`;
  }
  return v<10?`${v.toFixed(1)} s`:`${Math.round(v)} s`;
}
function delayLabel(v){return fmtSec(Number(v)||0)}
function delayed(){return $('live-delay-delayed')}
function live(){return $('live-delay-live')}
function bufferedRange(){
  const v=delayed();if(!v?.buffered?.length)return null;
  try{
    const i=v.buffered.length-1;
    return {start:v.buffered.start(0),end:v.buffered.end(i),span:v.buffered.end(i)-v.buffered.start(0)};
  }catch(_){return null}
}
function savePrefs(){
  try{
    localStorage.setItem('volley_live_delay_v730',JSON.stringify({
      delay:state.delay,maxBuffer:state.maxBuffer,cameraId:state.lastCameraId
    }));
  }catch(_){}
}
function loadPrefs(){
  try{
    const x=JSON.parse(localStorage.getItem('volley_live_delay_v730')||'{}');
    if([3,5,8,10,15,20,30,45,60,90,120,180].includes(Number(x.delay)))state.delay=Number(x.delay);
    if([60,120,180,300,600].includes(Number(x.maxBuffer)))state.maxBuffer=Number(x.maxBuffer);
    if(state.delay>=180&&state.maxBuffer<300)state.maxBuffer=300;
    else if(state.delay>=120&&state.maxBuffer<180)state.maxBuffer=180;
    state.lastCameraId=String(x.cameraId||'');
  }catch(_){}
}
function updateUi(){
  if($('live-delay-seconds'))$('live-delay-seconds').value=String(state.delay);
  if($('live-delay-buffer'))$('live-delay-buffer').value=String(state.maxBuffer);
  if($('live-delay-review-title'))$('live-delay-review-title').textContent=`Retraso · ${delayLabel(state.delay)}`;
  if($('live-delay-delay-badge'))$('live-delay-delay-badge').textContent=`−${delayLabel(state.delay)}`;
  if($('live-delay-context'))$('live-delay-context').textContent=state.context==='scouting'?'Scouting':'Entrenamiento';
  if($('live-delay-context-note'))$('live-delay-context-note').textContent=state.context==='scouting'?'revisión durante partido':'corrección técnica';
  if($('live-delay-subtitle'))$('live-delay-subtitle').textContent=state.context==='scouting'
    ?'Mantén una cámara en directo y revisa jugadas con retraso sin cerrar el entorno de scouting.'
    :'Captura la cámara y revisa la ejecución unos segundos después. Pensado para feedback técnico inmediato.';
  $('live-delay-start')?.classList.toggle('hidden',state.running);
  $('live-delay-stop')?.classList.toggle('hidden',!state.running);
  setState('live-delay-live-state',state.running?'EN DIRECTO':'DETENIDA',state.running);
  if(!state.running)setState('live-delay-review-state','ESPERANDO',false);
  $('live-delay-live-empty')?.classList.toggle('hidden',state.running);
  const mode=$('live-delay-mode');
  if(mode)mode.textContent=state.mode==='delay'?'Delay':state.mode==='paused'?'Pausa':'Revisión';
  const note=$('live-delay-mode-note');
  if(note)note.textContent=state.mode==='delay'?'seguimiento automático':state.mode==='paused'?'imagen detenida':'navegación manual';
  const pause=$('live-delay-pause');
  if(pause)pause.textContent=state.mode==='paused'?'Continuar revisión':'Pausar revisión';
}
async function populateCameras(){
  const sel=$('live-delay-camera');if(!sel||!navigator.mediaDevices?.enumerateDevices)return;
  try{
    const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
    if(!devices.length){sel.innerHTML='<option value="">Cámara predeterminada</option>';return}
    sel.innerHTML=devices.map((d,i)=>`<option value="${String(d.deviceId).replace(/"/g,'&quot;')}">${d.label||`Cámara ${i+1}`}</option>`).join('');
    if(state.lastCameraId&&devices.some(d=>d.deviceId===state.lastCameraId))sel.value=state.lastCameraId;
  }catch(_){}
}
function chooseMime(){
  const mr=window.MediaRecorder,ms=window.MediaSource;
  if(!mr||!ms)return '';
  const candidates=[
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4'
  ];
  return candidates.find(t=>{
    try{return (!mr.isTypeSupported||mr.isTypeSupported(t))&&(!ms.isTypeSupported||ms.isTypeSupported(t))}catch(_){return false}
  })||'';
}
/* V12.5 removed unreachable function: resetMediaPipeline */
function destroyMse(){
  const v=delayed();
  try{if(state.sourceBuffer&&state.mediaSource?.readyState==='open')state.mediaSource.endOfStream()}catch(_){}
  state.sourceBuffer=null;state.mediaSource=null;state.appendQueue=[];state.queueBytes=0;state.appendBusy=false;state.prunePending=false;
  if(v){try{v.pause()}catch(_){};v.removeAttribute('src');try{v.load()}catch(_){}}
  if(state.mediaUrl){try{URL.revokeObjectURL(state.mediaUrl)}catch(_){}state.mediaUrl=null}
}
function createMse(){
  return new Promise((resolve,reject)=>{
    const v=delayed();if(!v)return reject(new Error('No existe el reproductor de retraso.'));
    destroyMse();
    const ms=new MediaSource();state.mediaSource=ms;
    state.mediaUrl=URL.createObjectURL(ms);v.src=state.mediaUrl;v.muted=true;
    const opened=()=>{
      try{
        const sb=ms.addSourceBuffer(state.mime);
        state.sourceBuffer=sb;
        sb.mode='segments';
        sb.addEventListener('updateend',()=>{
          if(state.appendBusy)state.quotaFailures=0;
          state.appendBusy=false;
          pruneBuffer();
          appendNext();
          maintainDelay();
          updateMetrics();
        });
        sb.addEventListener('error',()=>failDelay('Error de decodificación o almacenamiento del búfer.'));
        resolve();
      }catch(err){reject(err)}
    };
    ms.addEventListener('sourceopen',opened,{once:true});
    setTimeout(()=>{if(!state.sourceBuffer)reject(new Error('MediaSource no se abrió.'))},5000);
  });
}
function failDelay(reason){
  if(!state.running)return;
  state.lastError=String(reason||'Error de Live Delay');
  state.overloads++;
  window.stopLiveDelay(true);
  setStatus('<b>Live Delay detenido para evitar saltos no detectados.</b> '+state.lastError+' La grabación REC independiente no se ha detenido. Reinicia el Delay después de comprobar la señal.','bad');
  setState('live-delay-review-state','ERROR',false);
}
function appendNext(){
  if(!state.running||!state.sourceBuffer||state.appendBusy||state.sourceBuffer.updating||!state.appendQueue.length)return;
  const buf=state.appendQueue.shift();state.queueBytes=Math.max(0,state.queueBytes-buf.byteLength);state.appendBusy=true;
  try{state.sourceBuffer.appendBuffer(buf)}catch(err){
    state.appendBusy=false;
    if(err?.name==='QuotaExceededError'){
      state.appendQueue.unshift(buf);state.queueBytes+=buf.byteLength;
      state.quotaFailures++;
      if(state.quotaFailures>=4){failDelay('El navegador ha agotado la memoria de vídeo. Reduce el búfer o usa otro dispositivo.');return;}
      pruneBuffer(true);
    }else{
      console.error('Live Delay append',err);
      failDelay('No se pudo añadir un fragmento de vídeo al búfer.');
    }
  }
}
function pruneBuffer(force=false){
  const sb=state.sourceBuffer;if(!sb||sb.updating||!sb.buffered?.length)return;
  try{
    const start=sb.buffered.start(0),end=sb.buffered.end(sb.buffered.length-1);
    const keep=Math.max(state.maxBuffer,state.delay+20);
    if(force||end-start>keep+10){
      const cutoff=Math.max(start,end-keep);
      const play=delayed();
      const safe=Math.min(cutoff,Math.max(start,(play?.currentTime||cutoff)-2));
      if(safe>start+.5){state.prunePending=true;sb.remove(start,safe)}
    }
  }catch(_){}
}
function targetTime(){
  const r=bufferedRange();if(!r)return null;
  return Math.max(r.start,r.end-state.delay);
}
function maintainDelay(force=false){
  if(!state.running||state.mode!=='delay')return;
  const v=delayed(),r=bufferedRange(),target=targetTime();if(!v||!r||target==null)return;
  const enough=r.span>=Math.max(1.2,state.delay-.4);
  $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  if(!enough){setState('live-delay-review-state','CREANDO BÚFER',false);return}
  setState('live-delay-review-state','RETRASADO',true);
  const diff=target-(Number(v.currentTime)||0);
  if(force||v.readyState<2||Math.abs(diff)>1.5){
    try{v.currentTime=target}catch(_){}
  }
  if(v.paused)v.play().catch(()=>{});
}
function updateMetrics(){
  const r=bufferedRange(),v=delayed();
  if($('live-delay-buffered'))$('live-delay-buffered').textContent=r?fmtSec(r.span):'0 s';
  if($('live-delay-actual')){
    const actual=r&&v&&Number.isFinite(v.currentTime)?Math.max(0,r.end-v.currentTime):null;
    $('live-delay-actual').textContent=actual==null?'—':fmtSec(actual);
  }
  if(state.running&&r){
    const enough=r.span>=Math.max(1.2,state.delay-.4);
    $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  }
}
function startTicker(){
  stopTicker();
  state.timer=setInterval(()=>{
    if(!state.running)return;
    // Reintentar tras una eliminación por límite de memoria; nunca omitir fragmentos.
    appendNext();maintainDelay();updateMetrics();
    const age=Date.now()-(state.lastChunkAt||state.streamStartedAt);
    if(age>20000)failDelay('Sin nuevos fotogramas de cámara desde hace más de 20 segundos. Comprueba móvil, Wi-Fi y permisos.');
    else if(age>7000){
      setState('live-delay-review-state','SEÑAL INESTABLE',false);
      setStatus('<b>La cámara no entrega fragmentos nuevos.</b> Revisando conexión; no se descartan fotogramas sin avisar.','warn');
    }
  },1000);
}
function stopTicker(){if(state.timer){clearInterval(state.timer);state.timer=null}}
async function requestStream(){
  const source=$('live-delay-source')?.value||'local';
  if(source==='remote'){
    const original=window.VC_REMOTE_CAMERA?.getStream?.();
    const tracks=original?.getVideoTracks?.().filter(t=>t.readyState==='live')||[];
    if(!tracks.length)throw new Error('El móvil todavía no está conectado. Escanea el QR e inicia la transmisión desde el móvil.');
    /* Use cloned tracks so stopping Live Delay does not kill the remote WebRTC receiver. */
    return new MediaStream(tracks.map(t=>t.clone()));
  }
  const sel=$('live-delay-camera'),deviceId=sel?.value||state.lastCameraId||'';
  const videoConstraints=deviceId?{
    deviceId:{exact:deviceId},
    width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}
  }:{
    facingMode:{ideal:'environment'},
    width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30,max:30}
  };
  return navigator.mediaDevices.getUserMedia({video:videoConstraints,audio:false});
}
async function startRecorder(){
  let recorderStream=state.stream;
  const sourceMode=$('live-delay-source')?.value||'local';

  /* Remote WebRTC video can carry rotation metadata that MediaRecorder/MediaSource
     interprets differently from a direct <video>. For the DELAY only, render the
     visually-correct LIVE image to a canvas first and record that normalized canvas. */
  if(sourceMode==='remote'&&typeof window.VC_REMOTE_CAMERA?.createDelayNormalizedStream==='function'){
    try{
      const normalized=await window.VC_REMOTE_CAMERA.createDelayNormalizedStream(state.stream);
      if(normalized?.getVideoTracks?.().some(t=>t.readyState==='live')){
        recorderStream=normalized;
        state.recorderStream=normalized;
        delayed()?.setAttribute('data-vc-normalized-delay','1');
      }
    }catch(err){
      console.warn('V7.7.2 delay normalizer fallback',err);
      state.recorderStream=null;
      delayed()?.removeAttribute('data-vc-normalized-delay');
    }
  }else{
    state.recorderStream=null;
    delayed()?.removeAttribute('data-vc-normalized-delay');
  }

  const options=state.mime?{mimeType:state.mime,videoBitsPerSecond:2500000}:{videoBitsPerSecond:2500000};
  const rec=new MediaRecorder(recorderStream,options);state.recorder=rec;
  rec.addEventListener('dataavailable',e=>{
    if(!state.running||!e.data||!e.data.size)return;
    const generation=state.generation;
    state.pendingBlobBytes+=e.data.size;
    if(state.pendingBlobBytes+state.queueBytes>24*1024*1024){
      failDelay('El navegador está acumulando más de 24 MB de vídeo pendientes de procesamiento. El Delay se detiene antes de perder continuidad.');
      return;
    }
    // Serializar también la conversión Blob->ArrayBuffer: lecturas asíncronas
    // completadas fuera de orden pueden romper MediaSource incluso sin pérdida.
    state.chunkSerial=state.chunkSerial.then(async()=>{
      const ab=await e.data.arrayBuffer();
      if(generation===state.generation)state.pendingBlobBytes=Math.max(0,state.pendingBlobBytes-e.data.size);
      if(!state.running||generation!==state.generation)return;
      const LIMIT=24*1024*1024;
      if(state.queueBytes+ab.byteLength>LIMIT){
        failDelay('El reproductor no alcanza a procesar la señal (cola superior a 24 MB). Se ha detenido solo la revisión, sin descartar vídeo silenciosamente.');
        return;
      }
      state.appendQueue.push(ab);
      state.queueBytes+=ab.byteLength;
      state.chunkCount++;
      state.lastChunkAt=Date.now();
      appendNext();
    }).catch(err=>{console.error('Live Delay chunk',err);if(generation===state.generation)failDelay('No se ha podido leer un fragmento de la cámara.')});
  });
  rec.addEventListener('error',e=>{
    console.error('Live Delay recorder',e);
    failDelay('MediaRecorder ha informado de un error de captura.');
  });
  rec.addEventListener('stop',()=>{
    if(state.running)failDelay('La grabación temporal del Delay terminó de forma inesperada.');
  });
  rec.start(500);
}
window.startLiveDelay=async function(){
  if(state.running)return;
  const sourceMode=$('live-delay-source')?.value||'local';
  if(sourceMode!=='remote'&&!navigator.mediaDevices?.getUserMedia){
    setStatus('<b>Este navegador no permite acceder a la cámara local.</b> Abre Volley Coach mediante HTTPS en un navegador moderno.','bad');return;
  }
  state.mime=chooseMime();
  if(!state.mime){
    setStatus('<b>Live Delay no está disponible en este navegador.</b> Se necesita MediaRecorder + MediaSource compatibles. En Windows, usa Chrome o Edge actualizados.','bad');return;
  }
  try{
    setStatus(sourceMode==='remote'?'<b>Conectando con el móvil…</b> Usando la señal WebRTC recibida.':'<b>Solicitando cámara…</b> Acepta el permiso del navegador.','warn');
    state.stream=await requestStream();
    const lv=live();lv.srcObject=state.stream;lv.muted=true;await lv.play().catch(()=>{});
    const track=state.stream.getVideoTracks()[0];
    if(sourceMode!=='remote'){
      state.lastCameraId=track?.getSettings?.().deviceId||$('live-delay-camera')?.value||'';
      await populateCameras();
      if(state.lastCameraId&&$('live-delay-camera'))$('live-delay-camera').value=state.lastCameraId;
    }
    savePrefs();
    state.generation++;
    state.chunkSerial=Promise.resolve();
    state.queueBytes=0;state.pendingBlobBytes=0;state.chunkCount=0;state.quotaFailures=0;state.lastChunkAt=0;state.lastError='';
    await createMse();
    state.running=true;state.mode='delay';state.streamStartedAt=Date.now();
    await startRecorder();startTicker();updateUi();updateMetrics();
    setStatus(`<b>Live Delay activo.</b> Fuente: ${sourceMode==='remote'?'LIVE móvil WebRTC':'cámara local'} · ${delayLabel(state.delay)} de retraso · búfer ${delayLabel(state.maxBuffer)}. El Delay es solo monitor/replay; la grabación REC sigue tomando LIVE directo.`, 'good');
  }catch(err){
    console.error('Live Delay start',err);
    stopLiveDelay(true);
    const denied=err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError';
    setStatus(denied?'<b>Permiso de cámara denegado.</b> Autoriza la cámara para este sitio y vuelve a intentarlo.':'<b>No se pudo iniciar Live Delay.</b> '+String(err?.message||err),'bad');
  }
};
window.stopLiveDelay=function(silent=false){
  stopTicker();state.running=false;state.generation++;state.pendingBlobBytes=0;state.mode='delay';
  try{state.recorder?.stop()}catch(_){}
  state.recorder=null;
  try{window.VC_REMOTE_CAMERA?.stopDelayNormalizedStream?.()}catch(_){}
  if(state.recorderStream&&state.recorderStream!==state.stream){
    try{state.recorderStream.getTracks?.().forEach(t=>t.stop())}catch(_){}
  }
  state.recorderStream=null;
  delayed()?.removeAttribute('data-vc-normalized-delay');
  try{state.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  state.stream=null;
  const lv=live();if(lv){try{lv.pause()}catch(_){};lv.srcObject=null}
  destroyMse();updateUi();updateMetrics();
  $('live-delay-review-empty')?.classList.remove('hidden');
  if(!silent)setStatus('<b>Live Delay detenido.</b> El búfer temporal se ha eliminado.','');
};
window.liveDelaySetDelay=function(v){
  const n=Math.max(1,Math.min(180,Number(v)||10));
  state.delay=n;
  if(n>=180&&state.maxBuffer<300)state.maxBuffer=300;
  else if(n>=120&&state.maxBuffer<180)state.maxBuffer=180;
  savePrefs();updateUi();
  if(state.running){
    state.mode='delay';
    pruneBuffer(false);
    maintainDelay(true);
    setStatus(`<b>Delay actualizado.</b> Retraso: ${delayLabel(state.delay)} · búfer máximo: ${delayLabel(state.maxBuffer)}.`,'good');
  }
};
window.liveDelaySetBuffer=function(v){
  let requested=Math.max(30,Math.min(600,Number(v)||120));
  const minimum=state.delay>=180?300:state.delay>=120?180:Math.max(30,state.delay+30);
  if(requested<minimum)requested=minimum;
  state.maxBuffer=requested;savePrefs();pruneBuffer(true);updateUi();
  setStatus(`<b>Búfer actualizado.</b> Historial temporal: ${delayLabel(state.maxBuffer)}.`,'good')
};
window.liveDelayReturn=function(){
  if(!state.running)return;
  state.mode='delay';updateUi();maintainDelay(true);setStatus(`<b>Delay automático.</b> Revisión a ${delayLabel(state.delay)} del directo.`,'good')
};
window.liveDelayJump=function(delta){
  if(!state.running)return;
  const v=delayed(),r=bufferedRange();if(!v||!r)return;
  state.mode='review';
  const next=Math.max(r.start,Math.min(r.end-.05,(Number(v.currentTime)||r.end-state.delay)+Number(delta||0)));
  try{v.currentTime=next;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics()
};
window.liveDelayReplay=function(seconds){
  if(!state.running)return;
  const v=delayed(),r=bufferedRange();if(!v||!r)return;
  state.mode='review';
  const base=Math.max(r.start,r.end-state.delay);
  const start=Math.max(r.start,base-Math.max(1,Number(seconds)||5));
  try{v.currentTime=start;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics();
  setStatus(`<b>Repetición.</b> Revisando ${Math.round(seconds)} s anteriores; la cámara sigue capturando.`,'warn')
};
window.liveDelayTogglePause=function(){
  if(!state.running)return;
  const v=delayed();if(!v)return;
  if(state.mode==='paused'||v.paused){
    state.mode='review';v.play().catch(()=>{});
  }else{
    state.mode='paused';v.pause();
  }
  updateUi();updateMetrics()
};
window.openLiveDelay=async function(context='training'){
  state.context=context==='scouting'?'scouting':'training';
  loadPrefs();updateUi();
  $('live-delay-modal')?.classList.add('open');
  await populateCameras();
  const remoteSelected=($('live-delay-source')?.value==='remote');
  const supported=!!chooseMime()&&(remoteSelected?!!window.VC_REMOTE_CAMERA?.getStream:!!navigator.mediaDevices?.getUserMedia);
  if(!supported)setStatus('<b>Compatibilidad limitada.</b> Live Delay necesita MediaRecorder y MediaSource. Para la cámara local se requiere permiso de cámara; para móvil, conecta primero el QR.','warn');
  else if(!state.running)setStatus('<b>Preparado.</b> La cámara no se envía a ningún servidor; el búfer temporal permanece en este dispositivo.','');
};
window.closeLiveDelay=function(){
  $('live-delay-modal')?.classList.remove('open');
  if(state.running){
    // Se detiene al cerrar para no dejar la cámara activa accidentalmente.
    stopLiveDelay(true);
  }
};
window.liveDelayDiagnostics=function(){
  const r=bufferedRange(),v=delayed();
  return {
    version:VERSION,
    context:state.context,
    running:state.running,
    mime:state.mime||chooseMime(),
    delaySeconds:state.delay,
    maxBufferSeconds:state.maxBuffer,
    mode:state.mode,
    buffered:r?.span||0,
    actualDelay:r&&v?Math.max(0,r.end-(Number(v.currentTime)||0)):null,
    cameraApi:!!navigator.mediaDevices?.getUserMedia,
    mediaRecorder:typeof MediaRecorder!=='undefined',
    mediaSource:typeof MediaSource!=='undefined',
    queuedChunks:state.appendQueue.length,
    queuedBytes:state.queueBytes,
    pendingBlobBytes:state.pendingBlobBytes,
    chunksReceived:state.chunkCount,
    lastChunkAgeMs:state.lastChunkAt?Date.now()-state.lastChunkAt:null,
    interruptions:state.overloads,
    error:state.lastError||null
  };
};

document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'&&state.running){
    setStatus('<b>Live Delay sigue activo.</b> Mantén esta pestaña visible para una reproducción retrasada estable.','warn');
  }
});
window.addEventListener('beforeunload',()=>{try{state.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}});
loadPrefs();updateUi();
})();
