
(()=>{
'use strict';

const VERSION='16.0.3.2';
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
  stalledSince:0,
  playbackStarted:false,
  lastSeekAt:0,
  lastPlayAttemptAt:0,
  seekCorrections:0,
  playbackWaits:0,
  playbackRecoveries:0,
  waitingAt:0,
  playbackEventsBound:false,
  // Video Engine Pro is a distinct playback controller sharing the battle-tested
  // capture/MSE pipeline. Classic stays available as a fallback.
  engine:'pro',
  starting:false,
  engineRecoveryAt:0,
  lastProgressAt:0,
  lastProgressPosition:-1,
  firstFrameAt:0,
  playbackStallMs:0,
  waitingStartedAt:0,
  recoveryAttempts:0,
  maxAbsDrift:0,
  sumAbsDrift:0,
  driftSamples:0,
  chunkIntervals:[],
  chunkMaxInterval:0,
  lastChunkTimestamp:0,
  droppedBase:0,
  totalFramesBase:0,
  droppedFrames:0,
  totalFrames:0,
  health:'ESPERANDO',
  proTickCount:0,
  qualityProfile:'balanced',
  autoRecovery:true,
  captureRestarts:0,
  captureRecoveryFailures:0,
  recoveryInProgress:false,
  captureRecoveryWindowStart:0,
  lastCaptureRecoveryAt:0,
  recoveryWindowCount:0,
  lastRecoveryReason:'',
  sourceMode:'local',
  reviewSpeed:1
};
const QUALITY_PROFILES=Object.freeze({
  fluid:Object.freeze({label:'Fluido · 360p / 24 FPS',width:640,height:360,fps:24,bitrate:850000}),
  balanced:Object.freeze({label:'Equilibrado · 540p / 25 FPS',width:960,height:540,fps:25,bitrate:1500000}),
  high:Object.freeze({label:'Alta calidad · 720p / 30 FPS',width:1280,height:720,fps:30,bitrate:2500000})
});
function quality(){return QUALITY_PROFILES[state.qualityProfile]||QUALITY_PROFILES.balanced}


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
      delay:state.delay,maxBuffer:state.maxBuffer,cameraId:state.lastCameraId,engine:state.engine,qualityProfile:state.qualityProfile,autoRecovery:state.autoRecovery
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
    state.engine=x.engine==='classic'?'classic':'pro';
    state.qualityProfile=Object.hasOwn(QUALITY_PROFILES,x.qualityProfile)?x.qualityProfile:'balanced';
    state.autoRecovery=x.autoRecovery!==false;
  }catch(_){}
}
function updateUi(){
  if($('live-delay-quality')){
    $('live-delay-quality').value=state.qualityProfile;
    $('live-delay-quality').disabled=state.running||state.starting;
  }
  if($('live-delay-auto-recovery'))$('live-delay-auto-recovery').checked=state.autoRecovery;
  if($('live-delay-quality-note')){
    $('live-delay-quality-note').textContent=state.sourceMode==='remote'
      ?'En móvil WebRTC ajusta el codificador del delay, no la cámara remota.'
      :`${quality().width}×${quality().height} · ${quality().fps} FPS · ${Math.round(quality().bitrate/1000)} kbps`;
  }
  if($('live-delay-engine')){
    $('live-delay-engine').value=state.engine;
    $('live-delay-engine').disabled=state.running||state.starting;
  }
  if($('live-delay-engine-label'))$('live-delay-engine-label').textContent=state.engine==='pro'?'ENGINE PRO':'CLÁSICO';
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
// A bounded telemetry ring: no video frames or personal data leave the browser.
function resetProTelemetry(){
  state.engineRecoveryAt=0;state.lastProgressAt=Date.now();state.lastProgressPosition=-1;
  state.firstFrameAt=0;state.playbackStallMs=0;state.waitingStartedAt=0;
  state.recoveryAttempts=0;state.maxAbsDrift=0;state.sumAbsDrift=0;state.driftSamples=0;
  state.chunkIntervals=[];state.chunkMaxInterval=0;state.lastChunkTimestamp=0;
  state.droppedBase=0;state.totalFramesBase=0;state.droppedFrames=0;state.totalFrames=0;
  state.health='ESPERANDO';state.proTickCount=0;
}
function recordChunkArrival(){
  const now=Date.now();
  if(state.lastChunkTimestamp){
    const delta=now-state.lastChunkTimestamp;
    state.chunkIntervals.push(delta);
    if(state.chunkIntervals.length>90)state.chunkIntervals.shift();
    state.chunkMaxInterval=Math.max(state.chunkMaxInterval,delta);
  }
  state.lastChunkTimestamp=now;
}
function playbackQuality(){
  const v=delayed();
  try{
    const q=v?.getVideoPlaybackQuality?.();
    if(q){
      const total=Number(q.totalVideoFrames)||0,dropped=Number(q.droppedVideoFrames)||0;
      if(total<state.totalFramesBase||dropped<state.droppedBase){
        state.totalFramesBase=0;state.droppedBase=0;
      }
      state.totalFrames=Math.max(0,total-state.totalFramesBase);
      state.droppedFrames=Math.max(0,dropped-state.droppedBase);
    }
  }catch(_){}
}
function delayHealth(){
  const r=bufferedRange(),v=delayed(),now=Date.now();
  if(!state.running)return 'DETENIDO';
  if(state.mode==='paused')return 'REVISIÓN EN PAUSA';
  if(state.mode==='review')return 'REVISIÓN MANUAL';
  if(!r||r.span<Math.max(1.6,state.delay+0.65))return 'CARGANDO BÚFER';
  if(state.lastChunkAt&&now-state.lastChunkAt>5000)return 'SEÑAL INESTABLE';
  if(state.waitingAt&&now-state.waitingAt>1000)return 'RECUPERANDO';
  if(v?.paused||v?.readyState<2)return 'PREPARANDO REPRODUCCIÓN';
  return 'ESTABLE';
}
function updateProMetrics(){
  playbackQuality();
  state.health=delayHealth();
  const mean=state.chunkIntervals.length
    ?Math.round(state.chunkIntervals.reduce((a,b)=>a+b,0)/state.chunkIntervals.length):0;
  const stutter=$('live-delay-pro-stutters');
  if(stutter)stutter.textContent=String(state.playbackWaits);
  const dropped=$('live-delay-pro-frames');
  if(dropped)dropped.textContent=state.totalFrames?`${state.droppedFrames}/${state.totalFrames}`:'—';
  const health=$('live-delay-pro-health');
  if(health)health.textContent=state.health;
  const interval=$('live-delay-pro-chunks');
  if(interval)interval.textContent=mean?`${mean} ms`:'—';
  const recoveries=$('live-delay-pro-recovery');
  if(recoveries)recoveries.textContent=String(state.playbackRecoveries);
  const restarts=$('live-delay-pro-restarts');
  if(restarts)restarts.textContent=String(state.captureRestarts);
  const activeProfile=$('live-delay-pro-quality');
  if(activeProfile)activeProfile.textContent=quality().label.split(' · ')[0];
}
function chooseMime(){
  const mr=window.MediaRecorder,ms=window.MediaSource;
  if(!mr||!ms)return '';
  // VP8 is usually less CPU-intensive for simultaneous WebRTC decode,
  // MediaRecorder encode and MediaSource playback on ordinary laptops.
  const candidates=[
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
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
  state.playbackStarted=false;state.lastSeekAt=0;state.lastPlayAttemptAt=0;state.waitingAt=0;
  if(v){try{v.pause()}catch(_){};v.removeAttribute('src');try{v.load()}catch(_){}}
  if(state.mediaUrl){try{URL.revokeObjectURL(state.mediaUrl)}catch(_){}state.mediaUrl=null}
}
function createMse(){
  return new Promise((resolve,reject)=>{
    const v=delayed();if(!v)return reject(new Error('No existe el reproductor de retraso.'));
    destroyMse();
    const ms=new MediaSource();state.mediaSource=ms;
    state.droppedBase=0;state.totalFramesBase=0;
    state.mediaUrl=URL.createObjectURL(ms);v.src=state.mediaUrl;v.muted=true;
    // Attach listeners just once: the media element survives pipeline restarts.
    if(!state.playbackEventsBound){
      state.playbackEventsBound=true;
      for(const name of ['waiting','stalled'])v.addEventListener(name,()=>{
        if(!state.running||state.mode!=='delay'||!state.playbackStarted)return;
        // 'waiting' and 'stalled' often fire for the same outage: count once.
        if(!state.waitingAt){state.playbackWaits++;state.waitingAt=Date.now();}
      });
      v.addEventListener('playing',()=>{
        if(state.waitingAt){
          state.playbackStallMs+=Date.now()-state.waitingAt;
          state.waitingAt=0;
        }
        if(state.running&&!state.firstFrameAt)state.firstFrameAt=Date.now();
      });
    }
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
      // Retain at least five seconds behind playback so ongoing decode is not
      // disturbed while MediaSource is removing old ranges.
      const playback=Number(play?.currentTime);
      const safe=Number.isFinite(playback)&&state.playbackStarted
        ?Math.min(cutoff,Math.max(start,playback-5))
        :cutoff;
      if(safe>start+1){state.prunePending=true;sb.remove(start,safe)}
    }
  }catch(_){}
}
function targetTime(){
  const r=bufferedRange();if(!r)return null;
  return Math.max(r.start,r.end-state.delay);
}
function maintainDelayLegacy(force=false){
  if(!state.running||state.mode!=='delay')return;
  const v=delayed(),r=bufferedRange(),rawTarget=targetTime();
  if(!v||!r||rawTarget==null)return;
  // Require a little extra material before starting; playing at the very end
  // of an MSE buffer causes repeated waiting/playing cycles on some browsers.
  const enough=r.span>=Math.max(1.6,state.delay+0.65);
  $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  if(!enough){setState('live-delay-review-state','CREANDO BÚFER',false);return}
  const target=Math.max(r.start+0.12,Math.min(r.end-0.45,rawTarget));
  if(!Number.isFinite(target))return;
  const now=Date.now(),current=Number(v.currentTime)||0;
  const diff=target-current;
  const outOfRange=current<r.start-0.12||current>r.end-0.10;
  const badlyBehind=Math.abs(diff)>Math.max(5,state.delay*0.35);
  const stalled=state.waitingAt>0&&now-state.waitingAt>2300&&r.end-current>1.5;
  const shouldSeek=force||!state.playbackStarted||outOfRange||badlyBehind||stalled;
  // Do not seek while a previous seek is still decoding, or repeatedly on
  // every 500ms recorder chunk. The old implementation could seek several
  // times a second whenever readyState was below HAVE_CURRENT_DATA.
  if(shouldSeek&&!v.seeking&&(force||!state.playbackStarted||now-state.lastSeekAt>=4000)){
    try{
      v.currentTime=target;
      v.playbackRate=1;
      state.playbackStarted=true;
      state.lastSeekAt=now;
      state.seekCorrections++;
      if(stalled)state.playbackRecoveries++;
      state.waitingAt=0;
    }catch(err){console.warn('Live Delay seek',err)}
  }else if(state.playbackStarted&&!v.seeking){
    // Minor drift is corrected by slightly varying playback speed instead of
    // jumping the playhead and interrupting decoding/keyframe acquisition.
    const rate=Math.abs(diff)<0.35?1:Math.abs(diff)<1.1
      ?(diff>0?1.035:0.965):(diff>0?1.065:0.94);
    if(Math.abs((Number(v.playbackRate)||1)-rate)>0.005)v.playbackRate=rate;
  }
  if(v.paused&&!v.seeking&&now-state.lastPlayAttemptAt>=800){
    state.lastPlayAttemptAt=now;
    v.play().catch(()=>{});
  }
  setState('live-delay-review-state',state.waitingAt&&now-state.waitingAt>1000?'RECUPERANDO':'RETRASADO',true);
}

// Pro controller: choose one stable target; gently correct drift. A seek is
// reserved for initial acquisition, a true out-of-range position, or a long
// verified stall. No second pipeline is created and REC is never touched.
function maintainDelayPro(force=false){
  if(!state.running||state.mode!=='delay')return;
  const v=delayed(),r=bufferedRange();
  if(!v||!r)return;
  const margin=state.delay<=5?0.38:0.52;
  const enough=r.span>=Math.max(1.8,state.delay+0.85);
  $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  if(!enough){
    setState('live-delay-review-state','CREANDO BÚFER',false);
    state.health='CARGANDO BÚFER';return;
  }
  const now=Date.now();
  const target=Math.max(r.start+0.15,Math.min(r.end-margin,r.end-state.delay));
  const current=Number(v.currentTime)||0;
  if(!Number.isFinite(target))return;
  const diff=target-current;
  const abs=Math.abs(diff);
  state.driftSamples++;
  state.sumAbsDrift+=abs;state.maxAbsDrift=Math.max(state.maxAbsDrift,abs);
  if(!v.seeking&&current>state.lastProgressPosition+0.05){
    state.lastProgressPosition=current;
    state.lastProgressAt=now;
  }
  const outOfRange=current<r.start-0.1||current>r.end-0.18;
  // Detect lack of progress only when enough buffered material is *ahead*.
  const noProgress=state.playbackStarted&&!v.seeking&&!v.paused
    &&now-state.lastProgressAt>3500&&r.end-current>1.7;
  const bufferedStall=state.waitingAt>0&&now-state.waitingAt>2800&&r.end-current>1.7;
  const seriousDrift=abs>Math.max(5,state.delay*.55);
  const initial=!state.playbackStarted;
  const seekNeeded=initial||outOfRange||seriousDrift||bufferedStall||noProgress;
  const cooldown=initial?0:5000;
  if(seekNeeded&&!v.seeking&&(initial||now-state.lastSeekAt>=cooldown)){
    try{
      // Don't attempt to seek into future, and keep a media decoding margin.
      v.currentTime=target;
      v.playbackRate=1;
      state.playbackStarted=true;
      state.lastSeekAt=now;
      state.lastProgressAt=now;
      state.lastProgressPosition=target;
      state.seekCorrections++;
      if(!initial&&(bufferedStall||noProgress)){
        state.playbackRecoveries++;state.recoveryAttempts++;
        state.engineRecoveryAt=now;
      }
      if(state.waitingAt){
        state.playbackStallMs+=now-state.waitingAt;
        state.waitingAt=0;
      }
    }catch(err){console.warn('Video Engine Pro seek',err)}
  }else if(state.playbackStarted&&!v.seeking){
    // Hysteresis avoids oscillating between faster/slower playback.
    // Maximum ±8% correction is intentionally imperceptible for review.
    let wanted=1;
    if(abs>0.38)wanted=Math.max(.93,Math.min(1.08,1+diff*.035));
    if(Math.abs((Number(v.playbackRate)||1)-wanted)>.009)v.playbackRate=wanted;
  }
  if(v.paused&&!v.seeking&&now-state.lastPlayAttemptAt>=1200){
    state.lastPlayAttemptAt=now;
    v.play().catch(()=>{});
  }
  setState('live-delay-review-state',state.waitingAt&&now-state.waitingAt>1000?'RECUPERANDO':'RETRASADO',true);
}
function maintainDelay(force=false){
  if(state.engine==='pro')maintainDelayPro(force);
  else maintainDelayLegacy(force);
}
function updateMetrics(){
  // Telemetry is presentation-only. Never stop MediaRecorder/MSE or delay ticks.
  if(document.visibilityState==='hidden'||(!($('live-delay-modal')?.classList.contains('open'))&&!($('scout-video-hub')?.classList.contains('active'))))return;
  const r=bufferedRange(),v=delayed();
  if($('live-delay-buffered'))$('live-delay-buffered').textContent=r?fmtSec(r.span):'0 s';
  if($('live-delay-actual')){
    const actual=r&&v&&Number.isFinite(v.currentTime)?Math.max(0,r.end-v.currentTime):null;
    $('live-delay-actual').textContent=actual==null?'—':fmtSec(actual);
  }
  if(state.running&&r){
    const enough=r.span>=Math.max(1.6,state.delay+.65);
    $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  }
  updateProMetrics();
}
// Restart only the delay capture. The independent REC studio is NEVER stopped here.
// A rebuilt MediaSource buffer loses its prior delay history: tell the user,
// and impose a finite retry budget instead of looping forever.
async function attemptCaptureRecovery(reason){
  if(!state.running||!state.autoRecovery||state.recoveryInProgress)return false;
  // Do not destroy the last buffered material until a new remote source exists.
  // The WebRTC receiver manages its own mobile reconnection separately.
  if(state.sourceMode==='remote'&&!window.VC_REMOTE_CAMERA?.getStream?.()?.getVideoTracks?.().some(t=>t.readyState==='live')){
    setState('live-delay-review-state','ESPERANDO MÓVIL',false);
    setStatus('<b>Señal móvil interrumpida.</b> Esperando a que WebRTC reconecte antes de reconstruir el búfer.','warn');
    return false;
  }
  const now=Date.now();
  if(!state.captureRecoveryWindowStart||now-state.captureRecoveryWindowStart>120000){
    state.captureRecoveryWindowStart=now;state.recoveryWindowCount=0;
  }
  if(state.recoveryWindowCount>=2||now-state.lastCaptureRecoveryAt<12000)return false;
  state.recoveryInProgress=true;
  state.recoveryWindowCount++;
  state.lastCaptureRecoveryAt=now;
  state.lastRecoveryReason=String(reason||'Señal interrumpida');
  setStatus('<b>Recuperación automática de cámara…</b> '+state.lastRecoveryReason+'. El historial temporal del delay se reinicia; REC independiente continúa.','warn');
  try{
    window.stopLiveDelay(true);
    await window.startLiveDelay();
    const ok=state.running;
    if(ok){
      state.captureRestarts++;
      setStatus('<b>Señal restablecida.</b> Reconstruyendo el búfer desde cero. La grabación REC independiente no se ha detenido.','good');
    }else state.captureRecoveryFailures++;
    return ok;
  }catch(err){
    state.captureRecoveryFailures++;
    state.lastError=String(err?.message||err);
    return false;
  }finally{state.recoveryInProgress=false;updateUi();updateMetrics()}
}
function startTicker(){
  stopTicker();
  state.timer=setInterval(()=>{
    if(!state.running)return;
    // Reintentar tras una eliminación por límite de memoria; nunca omitir fragmentos.
    appendNext();maintainDelay();updateMetrics();
    const age=Date.now()-(state.lastChunkAt||state.streamStartedAt);
    if(age>20000){
      if(document.visibilityState==='hidden')return; // prevent background tab throttling from forcing a rebuild
      if(state.autoRecovery){
        attemptCaptureRecovery('No llegan nuevos fragmentos').then(ok=>{
          if(!ok&&!state.recoveryInProgress&&state.running&&Date.now()-(state.lastChunkAt||state.streamStartedAt)>(state.sourceMode==='remote'?45000:25000)){
            failDelay('No hay vídeo nuevo; la recuperación automática no ha sido posible. Comprueba móvil, Wi-Fi o permisos.');
          }
        });
      }else failDelay('Sin nuevos fotogramas de cámara desde hace más de 20 segundos. Comprueba móvil, Wi-Fi y permisos.');
    }
    else if(age>7000){
      setState('live-delay-review-state','SEÑAL INESTABLE',false);
      setStatus('<b>La cámara no entrega fragmentos nuevos.</b> Revisando conexión; no se descartan fotogramas sin avisar.','warn');
    }
  },state.engine==='pro'?500:1000);
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
  const q=quality();
  const videoConstraints=deviceId?{
    deviceId:{exact:deviceId},
    width:{ideal:q.width},height:{ideal:q.height},frameRate:{ideal:q.fps,max:q.fps}
  }:{
    facingMode:{ideal:'environment'},
    width:{ideal:q.width},height:{ideal:q.height},frameRate:{ideal:q.fps,max:q.fps}
  };
  try{
    return await navigator.mediaDevices.getUserMedia({video:videoConstraints,audio:false});
  }catch(err){
    // An unplugged/repaired USB camera can have a new deviceId. Retry using
    // the default camera, but never retry a permission denial.
    if(!deviceId||!['NotFoundError','OverconstrainedError','DevicesNotFoundError'].includes(err?.name))throw err;
    state.lastCameraId='';
    if(sel)sel.value='';
    const fallback={facingMode:{ideal:'environment'},width:{ideal:q.width},height:{ideal:q.height},frameRate:{ideal:q.fps,max:q.fps}};
    return navigator.mediaDevices.getUserMedia({video:fallback,audio:false});
  }
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

  // Encoding a normalized mobile camera and decoding the delayed stream are
  // simultaneous; use a moderate bitrate to protect CPU and append latency.
  const bitrate=quality().bitrate;
  const options=state.mime?{mimeType:state.mime,videoBitsPerSecond:bitrate}:{videoBitsPerSecond:bitrate};
  let rec;
  try{rec=new MediaRecorder(recorderStream,{...options,videoKeyFrameIntervalDuration:1000})}
  catch(_){rec=new MediaRecorder(recorderStream,options)}
  state.recorder=rec;
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
      recordChunkArrival();
      state.lastChunkAt=Date.now();
      appendNext();
    }).catch(err=>{console.error('Live Delay chunk',err);if(generation===state.generation){state.pendingBlobBytes=0;failDelay('No se ha podido leer un fragmento de la cámara.')}});
  });
  rec.addEventListener('error',e=>{
    console.error('Live Delay recorder',e);
    if(!state.autoRecovery)failDelay('MediaRecorder ha informado de un error de captura.');
    else attemptCaptureRecovery('MediaRecorder ha informado de un error').then(ok=>{
      if(!ok&&state.running&&state.sourceMode!=='remote')failDelay('MediaRecorder dejó de grabar y no se pudo restablecer el delay.');
    });
  });
  rec.addEventListener('stop',()=>{
    if(state.running&&!state.recoveryInProgress){
      if(state.autoRecovery)attemptCaptureRecovery('MediaRecorder terminó inesperadamente').then(ok=>{
        if(!ok&&state.running&&state.sourceMode!=='remote')failDelay('El grabador de delay se detuvo y no se pudo recuperar.');
      });
      else failDelay('La grabación temporal del Delay terminó de forma inesperada.');
    }
  });
  rec.start(500);
}
window.startLiveDelay=async function(){
  if(state.running||state.starting)return;
  state.starting=true;
  updateUi();
  const sourceMode=$('live-delay-source')?.value||'local';
  state.sourceMode=sourceMode;
  if(sourceMode!=='remote'&&!navigator.mediaDevices?.getUserMedia){
    setStatus('<b>Este navegador no permite acceder a la cámara local.</b> Abre Volley Coach mediante HTTPS en un navegador moderno.','bad');state.starting=false;updateUi();return;
  }
  state.mime=chooseMime();
  if(!state.mime){
    setStatus('<b>Live Delay no está disponible en este navegador.</b> Se necesita MediaRecorder + MediaSource compatibles. En Windows, usa Chrome o Edge actualizados.','bad');state.starting=false;updateUi();return;
  }
  try{
    setStatus(sourceMode==='remote'?'<b>Conectando con el móvil…</b> Usando la señal WebRTC recibida.':'<b>Solicitando cámara…</b> Acepta el permiso del navegador.','warn');
    const captured=await requestStream();
    if(!state.starting){captured?.getTracks?.().forEach(t=>t.stop());return;}
    state.stream=captured;
    const liveTrack=captured.getVideoTracks?.()[0];
    if(liveTrack)liveTrack.addEventListener('ended',()=>{
      if(!state.running||state.recoveryInProgress)return;
      if(state.autoRecovery){
        attemptCaptureRecovery('Se perdió la pista de cámara').then(ok=>{
          if(!ok&&state.running&&state.sourceMode!=='remote')failDelay('La cámara se desconectó y no se pudo restablecer.');
        });
      }else failDelay('La cámara ha dejado de enviar vídeo.');
    },{once:true});
    const lv=live();lv.srcObject=state.stream;lv.muted=true;await lv.play().catch(()=>{});
    if(!state.starting)return;
    const track=state.stream.getVideoTracks()[0];
    if(sourceMode!=='remote'){
      state.lastCameraId=track?.getSettings?.().deviceId||$('live-delay-camera')?.value||'';
      await populateCameras();
      if(!state.starting)return;
      if(state.lastCameraId&&$('live-delay-camera'))$('live-delay-camera').value=state.lastCameraId;
    }
    savePrefs();
    state.generation++;
    state.chunkSerial=Promise.resolve();
    state.queueBytes=0;state.pendingBlobBytes=0;state.chunkCount=0;state.quotaFailures=0;state.lastChunkAt=0;state.lastError='';
    state.seekCorrections=0;state.playbackWaits=0;state.playbackRecoveries=0;
    resetProTelemetry();
    await createMse();
    if(!state.starting){destroyMse();return;}
    state.running=true;state.mode='delay';state.streamStartedAt=Date.now();
    await startRecorder();state.starting=false;startTicker();updateUi();updateMetrics();
    setStatus(`<b>Live Delay activo · ${state.engine==='pro'?'Engine Pro':'motor clásico'}.</b> Fuente: ${sourceMode==='remote'?'LIVE móvil WebRTC':'cámara local'} · ${delayLabel(state.delay)} de retraso · búfer ${delayLabel(state.maxBuffer)}. La grabación REC sigue tomando LIVE directo.`, 'good');
  }catch(err){
    console.error('Live Delay start',err);
    stopLiveDelay(true);
    const denied=err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError';
    setStatus(denied?'<b>Permiso de cámara denegado.</b> Autoriza la cámara para este sitio y vuelve a intentarlo.':'<b>No se pudo iniciar Live Delay.</b> '+String(err?.message||err),'bad');
  }
};
window.stopLiveDelay=function(silent=false){
  stopTicker();state.starting=false;state.running=false;state.generation++;state.pendingBlobBytes=0;state.mode='delay';
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
window.liveDelaySetQuality=function(value){
  const selected=Object.hasOwn(QUALITY_PROFILES,value)?value:'balanced';
  if(state.running||state.starting){
    setStatus('<b>Detén el delay antes de cambiar la calidad.</b> Así se evita interrumpir el vídeo o el búfer actual.','warn');
    updateUi();return false;
  }
  state.qualityProfile=selected;savePrefs();updateUi();
  setStatus(`<b>Perfil ${quality().label}.</b> ${state.sourceMode==='remote'?'En remoto modifica el codificador del delay; la calidad que envía el móvil se ajusta en el propio móvil.':'Se aplicará a la próxima captura local.'}`,'good');
  return true;
};
window.liveDelaySetAutoRecovery=function(enabled){
  state.autoRecovery=enabled!==false;savePrefs();updateUi();
  setStatus(state.autoRecovery?'<b>Recuperación automática activada.</b> Se intentará restablecer una señal caída; si es necesario, se reconstruirá el búfer.':'<b>Recuperación automática desactivada.</b> Los fallos de señal requerirán intervención manual.','');
};
window.liveDelaySetEngine=function(mode){
  const engine=mode==='classic'?'classic':'pro';
  if(state.running||state.starting){
    setStatus('<b>Detén Live Delay para cambiar de motor.</b> REC puede continuar grabando de forma independiente.','warn');
    updateUi();return;
  }
  state.engine=engine;savePrefs();updateUi();updateProMetrics();
  setStatus(engine==='pro'
    ?'<b>Engine Pro seleccionado.</b> Control suave del retraso, monitorización de cortes y recuperación supervisada.'
    :'<b>Motor clásico seleccionado.</b> Conserva el comportamiento de reproducción de la V16.0.2.9.','good');
};
window.liveDelayCopyDiagnostics=async function(){
  // Deliberately exclude pairing URLs, session identifiers and camera device IDs.
  const report={capturedAt:new Date().toISOString(),source:$('live-delay-source')?.value||'local',delay:window.liveDelayDiagnostics?.()};
  const contents=JSON.stringify(report,null,2);
  try{
    if(!navigator.clipboard?.writeText)throw new Error('clipboard');
    await navigator.clipboard.writeText(contents);
    setStatus('<b>Diagnóstico copiado.</b> Puedes pegarlo aquí para analizar los tirones.','good');
  }catch(_){
    try{
      const box=document.createElement('textarea');box.value=contents;box.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      document.body.appendChild(box);box.select();
      const ok=document.execCommand?.('copy');box.remove();
      if(!ok)throw new Error('copy');
      setStatus('<b>Diagnóstico copiado.</b> Pégalo en el chat.','good');
    }catch(_){setStatus('<b>No se pudo copiar automáticamente.</b> Consulta los datos en la consola con liveDelayDiagnostics().','warn')}
  }
  return contents;
};
window.liveDelayRecoverPlayback=function(){
  if(!state.running)return;
  state.mode='delay';updateUi();maintainDelay(true);
  setStatus('<b>Recuperación solicitada.</b> Se ha intentado volver a la posición de retraso sin detener la captura.','warn');
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
  state.mode='delay';state.reviewSpeed=1;if(delayed())delayed().playbackRate=1;updateUi();maintainDelay(true);setStatus(`<b>Delay automático.</b> Revisión a ${delayLabel(state.delay)} del directo.`,'good')
};
window.liveDelayJump=function(delta){
  if(!state.running)return;
  const v=delayed(),r=bufferedRange();if(!v||!r)return;
  state.mode='review';
  const next=Math.max(r.start,Math.min(r.end-.05,(Number(v.currentTime)||r.end-state.delay)+Number(delta||0)));
  try{v.playbackRate=1;v.currentTime=next;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics()
};
window.liveDelayReplay=function(seconds){
  if(!state.running)return;
  const v=delayed(),r=bufferedRange();if(!v||!r)return;
  state.mode='review';
  const base=Math.max(r.start,r.end-state.delay);
  const start=Math.max(r.start,base-Math.max(1,Number(seconds)||5));
  try{v.playbackRate=1;v.currentTime=start;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics();
  setStatus(`<b>Repetición.</b> Revisando ${Math.round(seconds)} s anteriores; la cámara sigue capturando.`,'warn')
};
window.liveDelayGetReviewTimeline=function(){
  const r=bufferedRange(),v=delayed();
  if(!state.running||!r||!v)return {available:false,start:0,end:0,current:0,mode:state.mode};
  return {available:true,start:r.start,end:r.end,current:Math.max(r.start,Math.min(r.end,Number(v.currentTime)||r.start)),mode:state.mode,playing:!v.paused,speed:Number(v.playbackRate)||1};
};
window.liveDelaySeekFraction=function(fraction){
  if(!state.running)return false;
  const r=bufferedRange(),v=delayed();if(!r||!v)return false;
  const f=Math.max(0,Math.min(1,Number(fraction)||0));
  if(f>=0.998){window.liveDelayReturn();return true}
  const t=Math.max(r.start,Math.min(r.end-0.25,r.start+f*r.span));
  if(!Number.isFinite(t))return false;
  state.mode='review';try{v.currentTime=t;v.playbackRate=state.reviewSpeed||1}catch(_){return false}
  updateUi();updateMetrics();return true;
};
window.liveDelaySetReviewSpeed=function(rate){
  if(!state.running)return false;
  const value=Number(rate);
  if(![.25,.5,.75,1,1.25,1.5,2].includes(value))return false;
  state.reviewSpeed=value;
  const v=delayed();if(!v)return false;
  if(state.mode==='delay')state.mode='review';
  try{v.playbackRate=value}catch(_){return false}
  updateUi();updateMetrics();return true;
};
window.liveDelayFrameStep=function(dir){
  if(!state.running)return false;
  const v=delayed(),r=bufferedRange();if(!v||!r)return false;
  const fps=Number(state.stream?.getVideoTracks?.()[0]?.getSettings?.().frameRate)||quality().fps||30;
  // Browser seeks to an approximate decoded frame; exact frame accuracy is
  // not guaranteed on MediaSource GOP/keyframe boundaries.
  const step=(dir<0?-1:1)/Math.min(60,Math.max(1,fps));
  const next=Math.max(r.start,Math.min(r.end-.2,(Number(v.currentTime)||r.start)+step));
  try{v.pause();v.currentTime=next;v.playbackRate=1}catch(_){return false}
  state.mode='paused';updateUi();updateMetrics();return true;
};
window.liveDelayTogglePause=function(){
  if(!state.running)return;
  const v=delayed();if(!v)return;
  if(state.mode==='paused'||v.paused){
    state.mode='review';v.playbackRate=state.reviewSpeed||1;v.play().catch(()=>{});
  }else{
    state.mode='paused';v.playbackRate=1;v.pause();
  }
  updateUi();updateMetrics()
};
window.openLiveDelay=async function(context='training'){
  state.context=context==='scouting'?'scouting':'training';
  loadPrefs();updateUi();
  $('live-delay-modal')?.classList.add('open');
  updateMetrics();
  await populateCameras();
  const remoteSelected=($('live-delay-source')?.value==='remote');
  const supported=!!chooseMime()&&(remoteSelected?!!window.VC_REMOTE_CAMERA?.getStream:!!navigator.mediaDevices?.getUserMedia);
  if(!supported)setStatus('<b>Compatibilidad limitada.</b> Live Delay necesita MediaRecorder y MediaSource. Para la cámara local se requiere permiso de cámara; para móvil, conecta primero el QR.','warn');
  else if(!state.running)setStatus('<b>Preparado.</b> La cámara no se envía a ningún servidor; el búfer temporal permanece en este dispositivo.','');
};
window.closeLiveDelay=function(){
  $('live-delay-modal')?.classList.remove('open');
  if(state.running||state.starting){
    // Closing during the permission prompt must cancel a pending capture too.
    stopLiveDelay(true);
  }
};
window.liveDelayDiagnostics=function(){
  const r=bufferedRange(),v=delayed();
  return {
    version:VERSION,
    engine:state.engine,
    engineLabel:state.engine==='pro'?'Video Engine Pro':'Motor clásico',
    starting:state.starting,
    context:state.context,
    running:state.running,
    mime:state.mime||chooseMime(),
    qualityProfile:state.qualityProfile,
    requestedLocalWidth:quality().width,
    requestedLocalHeight:quality().height,
    requestedLocalFps:quality().fps,
    requestedEncoderBitrate:quality().bitrate,
    sourceMode:state.sourceMode,
    actualCameraSettings:(()=>{const settings=state.stream?.getVideoTracks?.()[0]?.getSettings?.()||{};return {width:settings.width||null,height:settings.height||null,frameRate:settings.frameRate||null}})(),
    autoRecovery:state.autoRecovery,
    captureRestarts:state.captureRestarts,
    captureRecoveryFailures:state.captureRecoveryFailures,
    recoveryInProgress:state.recoveryInProgress,
    lastRecoveryReason:state.lastRecoveryReason||null,
    delaySeconds:state.delay,
    maxBufferSeconds:state.maxBuffer,
    mode:state.mode,
    reviewSpeed:state.reviewSpeed,
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
    seekCorrections:state.seekCorrections,
    playbackWaits:state.playbackWaits,
    playbackRecoveries:state.playbackRecoveries,
    recoveryAttempts:state.recoveryAttempts,
    stallDurationMs:state.playbackStallMs+(state.waitingAt?Date.now()-state.waitingAt:0),
    droppedFrames:state.totalFrames?state.droppedFrames:null,
    decodedFrames:state.totalFrames||null,
    chunkMeanIntervalMs:state.chunkIntervals.length
      ?Math.round(state.chunkIntervals.reduce((a,b)=>a+b,0)/state.chunkIntervals.length):null,
    chunkMaxIntervalMs:state.chunkIntervals.length?Math.max(...state.chunkIntervals):null,
    meanAbsoluteDriftSeconds:state.driftSamples?Number((state.sumAbsDrift/state.driftSamples).toFixed(2)):null,
    maxAbsoluteDriftSeconds:state.driftSamples?Number(state.maxAbsDrift.toFixed(2)):null,
    health:state.health,
    playbackRate:Number(v?.playbackRate)||1,
    playbackReadyState:v?.readyState??null,
    seeking:!!v?.seeking,
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
