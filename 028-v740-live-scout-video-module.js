/* VC20710_BUNDLE: exact legacy modules, executed in original order; v20.7.10 */
/* VC20710_SOURCE_BEGIN:027-v730-live-delay-module.js */

(()=>{
'use strict';

const VERSION='19.2.2';
const delayPolicy=window.VC_VIDEO_DELAY_POLICY_1921||null;
const reviewPolicy=window.VC_VIDEO_REVIEW_POLICY_1922||null;
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
  autoplayErrors:0,
  lastAutoplayNoticeAt:0,
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
  reviewSpeed:1,
  reviewExpirations:0,
  autoplayBlocked:false,
  userScrubbing:false
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
    if(delayPolicy)return delayPolicy.lastRange(v.buffered);
    const i=v.buffered.length-1;
    return {start:v.buffered.start(i),end:v.buffered.end(i),span:v.buffered.end(i)-v.buffered.start(i),disconnected:i>0};
  }catch(_){return null}
}
// In manual review, a segment can still be available before an MSE gap.
// Automatic Delay always follows the newest segment instead.
function reviewRange(){
  const v=delayed();
  if(!v?.buffered?.length)return null;
  return reviewPolicy?.reviewRange(v.buffered,Number(v.currentTime))||bufferedRange();
}
function currentReviewRange(){
  return state.mode==='delay'?bufferedRange():reviewRange();
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
  const returnButton=$('vc1922-review-transport')?.querySelector('.vc1922-primary');
  if(returnButton)returnButton.textContent=`Volver a Delay −${delayLabel(state.delay)}`;
  const pause=$('live-delay-pause');
  if(pause)pause.textContent=state.mode==='paused'?'Continuar revisión':'Pausar revisión';
  $('live-delay-resume')?.classList.toggle('hidden',!state.autoplayBlocked);
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
  if(state.autoplayBlocked)return 'TOCA REPRODUCIR';
  if(state.mode==='paused')return 'REVISIÓN EN PAUSA';
  if(state.mode==='review')return 'REVISIÓN MANUAL';
  if(!r||(delayPolicy&&!delayPolicy.getTarget(r,state.delay))||r.span<Math.max(1.6,state.delay+0.65))return 'CARGANDO BÚFER';
  if(state.lastChunkAt&&now-state.lastChunkAt>5000)return 'SEÑAL INESTABLE';
  if(state.waitingAt&&now-state.waitingAt>1000)return 'RECUPERANDO';
  if(v?.paused||v?.readyState<2)return 'PREPARANDO REPRODUCCIÓN';
  return 'ESTABLE';
}
function metricText(id,value){
  const el=$(id);
  if(el&&el.textContent!==String(value))el.textContent=String(value);
}
function updateProMetrics(){
  playbackQuality();
  state.health=delayHealth();
  const mean=state.chunkIntervals.length
    ?Math.round(state.chunkIntervals.reduce((a,b)=>a+b,0)/state.chunkIntervals.length):0;
  metricText('live-delay-pro-stutters',String(state.playbackWaits));
  metricText('live-delay-pro-frames',state.totalFrames?`${state.droppedFrames}/${state.totalFrames}`:'—');
  metricText('live-delay-pro-health',state.health);
  metricText('live-delay-pro-chunks',mean?`${mean} ms`:'—');
  metricText('live-delay-pro-recovery',String(state.playbackRecoveries));
  metricText('live-delay-pro-restarts',String(state.captureRestarts));
  metricText('live-delay-pro-quality',quality().label.split(' · ')[0]);
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
    let finished=false,timeout=null;
    const settle=(error)=>{
      if(finished)return;
      finished=true;clearTimeout(timeout);
      if(error)reject(error);else resolve();
    };
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
      // A former MediaSource may open after a stop/restart; it must not alter the new pipeline.
      if(finished||state.mediaSource!==ms)return;
      try{
        const sb=ms.addSourceBuffer(state.mime);
        state.sourceBuffer=sb;
        sb.mode='segments';
        sb.addEventListener('updateend',()=>{
          if(state.mediaSource!==ms)return;
          if(state.appendBusy)state.quotaFailures=0;
          state.appendBusy=false;
          pruneBuffer();
          appendNext();
          maintainDelay();
          updateMetrics();
        });
        sb.addEventListener('error',()=>{if(state.mediaSource===ms)failDelay('Error de decodificación o almacenamiento del búfer.')});
        settle();
      }catch(err){settle(err)}
    };
    ms.addEventListener('sourceopen',opened,{once:true});
    timeout=setTimeout(()=>settle(new Error('MediaSource no se abrió en 10 segundos.')),10000);
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
    const v=delayed();
    const playback=Number(v?.currentTime);
    const plan=reviewPolicy?.prunePlan({start,end,keepSeconds:keep,
      playbackTime:playback,playbackStarted:state.playbackStarted,mode:state.mode,force});
    if(plan){
      if(plan.needsReturn){
        // A paused or manually reviewed moment can become older than the
        // retention window. Rejoin automatic delay BEFORE discarding it.
        // Never let the old playhead pin memory indefinitely until a quota crash.
        if(v?.seeking)return;
        const newest=bufferedRange();
        const preferred=delayPolicy?.getTarget(newest,state.delay);
        const jumpTo=Math.max(plan.removeEnd+1,Number.isFinite(preferred)?preferred:Math.max(start+.25,end-1));
        if(v){v.currentTime=Math.min(end-.25,jumpTo);v.playbackRate=1;}
        const expired=plan.reviewExpired;
        state.mode='delay';state.reviewSpeed=1;state.autoplayBlocked=false;
        state.lastSeekAt=Date.now();state.playbackStarted=true;
        if(expired){
          state.reviewExpirations++;
          setStatus('<b>La revisión llegó al límite del búfer.</b> Se vuelve al Delay automáticamente para conservar la captura y evitar agotar la memoria. REC continúa.','warn');
        }
        updateUi();
      }
      state.prunePending=true;sb.remove(start,plan.removeEnd);
      return;
    }
    // Fallback only for older deployments that do not load the 19.2.2 policy.
    if(!reviewPolicy&&(force||end-start>keep+10)){
      const cutoff=Math.max(start,end-keep);
      const safe=Number.isFinite(playback)&&state.playbackStarted
        ?Math.min(cutoff,Math.max(start,playback-5)):cutoff;
      if(safe>start+1){state.prunePending=true;sb.remove(start,safe)}
    }
  }catch(err){console.warn('Live Delay prune',err)}
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
  const target=delayPolicy?.getTarget(r,state.delay)??null;
  const fallbackReady=r.span>=Math.max(1.8,state.delay+.85);
  const enough=delayPolicy?target!==null:fallbackReady;
  $('live-delay-review-empty')?.classList.toggle('hidden',enough);
  if(!enough){
    setState('live-delay-review-state','CREANDO BÚFER',false);
    state.health=r.disconnected?'RECONSTRUYENDO BÚFER':'CARGANDO BÚFER';
    return;
  }
  const now=Date.now();
  const seekTarget=target??Math.max(r.start+.15,Math.min(r.end-.55,r.end-state.delay));
  const current=Number(v.currentTime)||0;
  if(!Number.isFinite(seekTarget))return;
  const diff=seekTarget-current,abs=Math.abs(diff);
  state.driftSamples++;state.sumAbsDrift+=abs;
  state.maxAbsDrift=Math.max(state.maxAbsDrift,abs);
  if(!v.seeking&&current>state.lastProgressPosition+.05){
    state.lastProgressPosition=current;state.lastProgressAt=now;
  }
  const outOfRange=current<r.start-.1||current>r.end-.18;
  const noProgress=state.playbackStarted&&!v.seeking&&!v.paused&&now-state.lastProgressAt>3500&&r.end-current>1.7;
  const bufferedStall=state.waitingAt>0&&now-state.waitingAt>2800&&r.end-current>1.7;
  const seriousDrift=abs>Math.max(5,state.delay*.55);
  const initial=!state.playbackStarted;
  const shouldSeek=delayPolicy?.seekDecision({initial,outOfRange,seriousDrift,stalled:bufferedStall,noProgress,seeking:v.seeking,now,lastSeekAt:state.lastSeekAt})
    ??((initial||outOfRange||seriousDrift||bufferedStall||noProgress)&&!v.seeking&&(initial||now-state.lastSeekAt>=5000));
  if((force||shouldSeek)&&!v.seeking&&(force||initial||now-state.lastSeekAt>=5000)){
    try{
      v.currentTime=seekTarget;
      v.playbackRate=1;
      state.playbackStarted=true;
      state.lastSeekAt=now;
      state.lastProgressAt=now;
      state.lastProgressPosition=seekTarget;
      state.seekCorrections++;
      if(!initial&&(bufferedStall||noProgress)){
        state.playbackRecoveries++;state.recoveryAttempts++;state.engineRecoveryAt=now;
      }
      if(state.waitingAt){state.playbackStallMs+=now-state.waitingAt;state.waitingAt=0;}
    }catch(err){console.warn('Video Engine Pro seek',err)}
  }else if(state.playbackStarted&&!v.seeking){
    const wanted=delayPolicy?.playbackRate(diff)??Math.max(.95,Math.min(1.05,1+diff*.025));
    if(Math.abs((Number(v.playbackRate)||1)-wanted)>.009)v.playbackRate=wanted;
  }
  if(v.paused&&!v.seeking&&!state.autoplayBlocked&&now-state.lastPlayAttemptAt>=1200){
    state.lastPlayAttemptAt=now;
    const play=v.play();
    if(play?.then)play.then(()=>{state.autoplayBlocked=false;updateUi()}).catch(err=>{
      // iOS Safari / autoplay policy can reject silent MSE video playback.
      // Do not pretend that Delay is running when a tap is required.
      if(!state.running||state.mode!=='delay')return;
      state.autoplayErrors++;
      state.autoplayBlocked=err?.name==='NotAllowedError';
      if(now-state.lastAutoplayNoticeAt>5000){
        state.lastAutoplayNoticeAt=now;
        setState('live-delay-review-state','PULSA REPRODUCIR',false);
        setStatus('<b>El navegador ha bloqueado la reproducción diferida.</b> Pulsa Reproducir en el vídeo Delay. La cámara y REC siguen independientes.','warn');
      }
    });
  }
  if(state.autoplayBlocked)setState('live-delay-review-state','PULSA REPRODUCIR',false);
  else setState('live-delay-review-state',state.waitingAt&&now-state.waitingAt>1000?'RECUPERANDO':'RETRASADO',true);
}
function maintainDelay(force=false){
  if(state.engine==='pro')maintainDelayPro(force);
  else maintainDelayLegacy(force);
}
// Rolling review transport does not seek while the user drags its timeline.
function updateReviewTransport(){
  const control=$('vc1922-scrub'),v=delayed(),r=currentReviewRange();
  if(!control)return;
  const available=!!(state.running&&r&&r.span>.6);
  control.disabled=!available;
  if(!available){
    metricText('vc1922-review-window','ESPERANDO BÚFER');
    metricText('vc1922-review-position','—');
    return;
  }
  const position=Number(v?.currentTime);
  if(!state.userScrubbing&&Number.isFinite(position)){
    const fraction=Math.max(0,Math.min(1,(position-r.start)/r.span));
    control.value=String(Math.round(fraction*1000));
  }
  metricText('vc1922-review-window',`${fmtSec(r.span)} disponibles`);
  if(!state.userScrubbing)metricText('vc1922-review-position',`${fmtSec(Math.max(0,r.end-position))} del último vídeo`);
  metricText('vc1922-review-mode',state.mode==='delay'?'DELAY AUTOMÁTICO':state.mode==='paused'?'REVISIÓN PAUSADA':'REVISIÓN MANUAL');
}
function updateMetrics(){
  // Telemetry is presentation-only. Never stop MediaRecorder/MSE or delay ticks.
  if(document.visibilityState==='hidden'||(!($('live-delay-modal')?.classList.contains('open'))&&!($('scout-video-hub')?.classList.contains('active'))))return;
  const r=bufferedRange(),v=delayed();
  updateReviewTransport();
  metricText('live-delay-buffered',r?fmtSec(r.span):'0 s');
  if($('live-delay-actual')){
    const actual=r&&v&&Number.isFinite(v.currentTime)?Math.max(0,r.end-v.currentTime):null;
    metricText('live-delay-actual',actual==null?'—':fmtSec(actual));
  }
  if(state.running&&r){
    const enough=delayPolicy?delayPolicy.getTarget(r,state.delay)!==null:r.span>=Math.max(1.6,state.delay+.65);
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
      if(state.sourceMode==='remote'&&!window.VC_REMOTE_CAMERA?.isConnected?.()){
        setState('live-delay-review-state','ESPERANDO MÓVIL',false);
        setStatus('<b>Señal remota interrumpida.</b> El receptor intenta reconectar; no se borra el búfer ni se detiene REC.','warn');
        if(age>90000)failDelay('El móvil no ha enviado vídeo durante 90 segundos. Comprueba la conexión y vuelve a iniciar el Delay.');
        return;
      }
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
      const normalized=await window.VC_REMOTE_CAMERA.createDelayNormalizedStream(state.stream,quality());
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
  const generation=state.generation; // Fence delayed events from a previous capture.
  rec.addEventListener('dataavailable',e=>{
    if(!state.running||rec!==state.recorder||generation!==state.generation||!e.data||!e.data.size)return;
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
    if(generation!==state.generation||rec!==state.recorder)return;
    console.error('Live Delay recorder',e);
    if(!state.autoRecovery)failDelay('MediaRecorder ha informado de un error de captura.');
    else attemptCaptureRecovery('MediaRecorder ha informado de un error').then(ok=>{
      if(!ok&&state.running&&state.sourceMode!=='remote')failDelay('MediaRecorder dejó de grabar y no se pudo restablecer el delay.');
    });
  });
  rec.addEventListener('stop',()=>{
    if(generation!==state.generation||rec!==state.recorder)return;
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
    state.autoplayErrors=0;state.autoplayBlocked=false;state.userScrubbing=false;state.lastAutoplayNoticeAt=0;
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
  stopTicker();state.starting=false;state.running=false;state.generation++;state.pendingBlobBytes=0;state.mode='delay';state.autoplayBlocked=false;state.userScrubbing=false;
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
  state.autoplayBlocked=false;state.mode='delay';state.reviewSpeed=1;if(delayed())delayed().playbackRate=1;updateUi();maintainDelay(true);setStatus(`<b>Delay automático.</b> Revisión a ${delayLabel(state.delay)} del directo.`,'good')
};
window.liveDelayJump=function(delta){
  if(!state.running)return;
  const v=delayed(),r=currentReviewRange();if(!v||!r)return;
  state.mode='review';state.playbackStarted=true;
  const next=Math.max(r.start,Math.min(r.end-.05,(Number(v.currentTime)||r.end-state.delay)+Number(delta||0)));
  try{v.playbackRate=1;v.currentTime=reviewPolicy?.reviewSeek(r,next)??next;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics()
};
window.liveDelayReplay=function(seconds){
  if(!state.running)return;
  const v=delayed(),r=currentReviewRange();if(!v||!r)return;
  state.mode='review';state.playbackStarted=true;
  const base=Math.max(r.start,r.end-state.delay);
  const start=Math.max(r.start,base-Math.max(1,Number(seconds)||5));
  try{v.playbackRate=1;v.currentTime=reviewPolicy?.reviewSeek(r,start)??start;v.play().catch(()=>{})}catch(_){}
  updateUi();updateMetrics();
  setStatus(`<b>Repetición.</b> Revisando ${Math.round(seconds)} s anteriores; la cámara sigue capturando.`,'warn')
};
window.liveDelayGetReviewTimeline=function(){
  const r=currentReviewRange(),v=delayed();
  if(!state.running||!r||!v)return {available:false,start:0,end:0,current:0,mode:state.mode};
  return {available:true,start:r.start,end:r.end,current:Math.max(r.start,Math.min(r.end,Number(v.currentTime)||r.start)),mode:state.mode,playing:!v.paused,speed:Number(v.playbackRate)||1};
};
window.liveDelaySeekFraction=function(fraction){
  if(!state.running)return false;
  const r=currentReviewRange(),v=delayed();if(!r||!v)return false;
  const f=Math.max(0,Math.min(1,Number(fraction)||0));
  const t=reviewPolicy?.reviewSeek(r,r.start+f*r.span)??Math.max(r.start,Math.min(r.end-0.25,r.start+f*r.span));
  if(!Number.isFinite(t))return false;
  const stayPaused=state.mode==='paused';
  state.mode=stayPaused?'paused':'review';state.playbackStarted=true;
  try{
    v.currentTime=t;v.playbackRate=stayPaused?1:state.reviewSpeed||1;
    if(!stayPaused){
      const promise=v.play();
      if(promise?.catch)promise.catch(err=>{
        if(err?.name==='NotAllowedError'){
          state.autoplayBlocked=true;updateUi();
          setStatus('<b>Reproducción bloqueada.</b> Pulsa Reproducir vídeo para continuar la revisión.','warn');
        }
      });
    }
  }catch(_){return false}
  updateUi();updateMetrics();return true;
};
window.liveDelayScrubbing=function(active){
  state.userScrubbing=!!active;
  if(!active)updateReviewTransport();
};
window.liveDelayPreviewScrub=function(value){
  const r=currentReviewRange();if(!r)return;
  state.userScrubbing=true;
  const fraction=Math.max(0,Math.min(1,(Number(value)||0)/1000));
  metricText('vc1922-review-position',`${fmtSec((1-fraction)*r.span)} del último vídeo`);
};
window.liveDelayResumeFromGesture=async function(){
  if(!state.running)return false;
  const v=delayed();if(!v)return false;
  try{
    await v.play();
    state.autoplayBlocked=false;state.lastPlayAttemptAt=Date.now();
    updateUi();updateMetrics();
    setStatus('<b>Reproducción reanudada.</b> La cámara y REC siguen funcionando de forma independiente.','good');
    return true;
  }catch(err){
    state.autoplayBlocked=err?.name==='NotAllowedError';
    updateUi();
    setStatus('<b>El navegador sigue bloqueando la reproducción.</b> Comprueba que esta pestaña está visible y utiliza Reproducir.','warn');
    return false;
  }
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
  const v=delayed(),r=currentReviewRange();if(!v||!r)return false;
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
    captureStartEpochMs:state.running&&Number.isFinite(state.streamStartedAt)&&state.streamStartedAt>0?state.streamStartedAt:null,
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
    reviewExpirations:state.reviewExpirations,
    autoplayBlocked:state.autoplayBlocked,
    buffered:r?.span||0,
    latestRangeDisconnected:!!r?.disconnected,
    autoplayErrors:state.autoplayErrors,
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

/* VC20710_SOURCE_END:027-v730-live-delay-module.js */
;

/* VC20710_SOURCE_BEGIN:028-v740-live-scout-video-module.js */

(()=>{
'use strict';

const VERSION='7.4.0';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const state={
  dockOpen:false,
  moved:false,
  sessionId:null,
  sessionStartedAt:null,
  replayStop:null,
  replayAutoReturn:false,
  replayReturnTimer:null,
  compact:false,
  exporting:false
};
function active(){try{const native=window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null,bridge=window.VC_MATCH_CONTEXT_2061;if(bridge?.VERSION==='20.6.1'&&bridge.readOnly===true&&bridge.singleNativeSource===true){try{const typed=bridge.getActive();if(typed===native)return typed}catch(_){}}return native}catch(_){return null}}
function setOf(m){try{const native=window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)||null,bridge=window.VC_MATCH_CONTEXT_2061;if(bridge?.VERSION==='20.6.1'&&bridge.readOnly===true&&bridge.singleNativeSource===true){try{const typed=bridge.getSet(m);if(typed===native)return typed}catch(_){}}return native}catch(_){return null}}
function save(){try{window.VC_SCOUT_VIDEO_BRIDGE?.save?.()}catch(err){console.error('V7.4 save',err)}}
function playerLabel(a){try{return window.VC_SCOUT_VIDEO_BRIDGE?.playerLabel?.(a)||String(a?.playerLabel||a?.playerNameSnapshot||a?.playerNumberSnapshot||'Jugador')}catch(_){return 'Jugador'}}
function scoutElapsedSafe(m){
  try{if(typeof scoutElapsed==='function')return Number(scoutElapsed(m))||0}catch(_){}
  const t=Date.parse(m?.clockStartedAt||m?.createdAt||new Date().toISOString());
  return Math.max(0,Date.now()-(Number.isFinite(t)?t:Date.now()));
}
function delayed(){return $('live-delay-delayed')}
function liveRunning(){try{return !!window.liveDelayDiagnostics?.().running}catch(_){return false}}
function bufferRange(){
  const v=delayed();if(!v?.buffered?.length)return null;
  try{
    const start=v.buffered.start(0),end=v.buffered.end(v.buffered.length-1);
    return {start,end,span:Math.max(0,end-start)};
  }catch(_){return null}
}
function currentSession(m=active()){
  if(!m)return null;
  ensureMeta(m);
  const id=state.sessionId||m.liveVideo.currentSessionId;
  return arr(m.liveVideo.sessions).find(s=>String(s.id)===String(id))||null;
}
function ensureMeta(m){
  if(!m)return null;
  const raw=m.liveVideo&&typeof m.liveVideo==='object'?m.liveVideo:{};
  m.liveVideo={
    ...raw,
    version:VERSION,
    sessions:arr(raw.sessions),
    bookmarks:arr(raw.bookmarks),
    currentSessionId:raw.currentSessionId||null,
    enabled:!!raw.enabled
  };
  return m.liveVideo;
}
function makeId(prefix='lv'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}
function fmt(s){
  s=Number(s);if(!Number.isFinite(s)||s<0)return '—';
  const m=Math.floor(s/60),x=s-m*60;
  return `${String(m).padStart(2,'0')}:${x.toFixed(1).padStart(4,'0')}`;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){
  let el=$('scout-v740-toast');
  if(!el){el=document.createElement('div');el.id='scout-v740-toast';el.className='scout-v740-toast';document.body.appendChild(el)}
  el.textContent=msg;clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),3300);
}
function prefs(){
  try{return JSON.parse(localStorage.getItem('volley_v740_prefs')||'{}')}catch(_){return {}}
}
window.scoutV740SavePrefs=function(){
  try{
    localStorage.setItem('volley_v740_prefs',JSON.stringify({
      autoReplay:!!$('scout-v740-auto-replay')?.checked,
      autoReturn:Number($('scout-v740-auto-return')?.value)||0,
      compact:state.compact
    }));
  }catch(_){}
};
function loadPrefs(){
  const p=prefs();
  if($('scout-v740-auto-replay'))$('scout-v740-auto-replay').checked=!!p.autoReplay;
  if($('scout-v740-auto-return')){
    const values=[...$('scout-v740-auto-return').options].map(o=>o.value);
    $('scout-v740-auto-return').value=values.includes(String(p.autoReturn))?String(p.autoReturn):'1.2';
  }
  state.compact=!!p.compact;$('scout-v740-dock')?.classList.toggle('compact',state.compact);
}
function nodes(){
  const modal=$('live-delay-modal'),card=modal?.querySelector('.live-delay-card');
  if(!card)return [];
  const selectors=[
    '.live-delay-toolbar','.live-delay-support','.live-delay-grid','.live-delay-metrics',
    '#vc1922-review-transport','.live-delay-controls','.live-delay-training-tools','.live-delay-help'
  ];
  return selectors.map(s=>card.querySelector(s)||$('scout-v740-inline-host')?.querySelector(s)).filter(Boolean);
}
function moveInline(){
  const host=$('scout-v740-inline-host');if(!host||state.moved)return;
  const list=nodes();list.forEach(n=>host.appendChild(n));state.moved=!!list.length;
}
function restoreModal(){
  if(!state.moved)return;
  const card=$('live-delay-modal')?.querySelector('.live-delay-card'),head=card?.querySelector('.pro-modal-head');
  if(!card)return;
  const list=[
    hostFind('.live-delay-toolbar'),hostFind('.live-delay-support'),hostFind('.live-delay-grid'),
    hostFind('.live-delay-metrics'),hostFind('#vc1922-review-transport'),hostFind('.live-delay-controls'),
    hostFind('.live-delay-training-tools'),hostFind('.live-delay-help')
  ].filter(Boolean);
  let ref=head?.nextSibling||null;
  list.forEach(n=>{card.insertBefore(n,ref);ref=n.nextSibling});
  state.moved=false;
}
function hostFind(sel){return $('scout-v740-inline-host')?.querySelector(sel)||null}
async function openDock(){
  const m=active();
  if(!m){alert('Necesitas un scouting activo para abrir Live Scouting + Video.');return}
  state.dockOpen=true;
  $('scout-v740-dock')?.classList.remove('hidden');
  loadPrefs();
  try{await window.openLiveDelay?.('scouting')}catch(err){console.warn('V7.4 open Live Delay',err)}
  $('live-delay-modal')?.classList.remove('open');
  moveInline();
  ensureMeta(m).enabled=true;
  m.dataVersion=VERSION;save();render();
  setTimeout(()=>document.getElementById('scout-v740-dock')?.scrollIntoView({block:'nearest',behavior:'smooth'}),0);
}
window.scoutV740ToggleDock=function(){if(state.dockOpen)window.scoutV740CloseDock();else openDock()};
window.scoutV740CloseDock=function(){
  state.dockOpen=false;clearReplay();
  try{window.stopLiveDelay?.(true)}catch(_){}
  restoreModal();$('live-delay-modal')?.classList.remove('open');
  $('scout-v740-dock')?.classList.add('hidden');
  const m=active();if(m){ensureMeta(m).enabled=false;m.liveVideo.currentSessionId=null;save()}
  state.sessionId=null;state.sessionStartedAt=null;render();
};
window.scoutV740ToggleCompactVideo=function(){
  state.compact=!state.compact;$('scout-v740-dock')?.classList.toggle('compact',state.compact);window.scoutV740SavePrefs()
};

function beginSession(){
  const m=active();if(!m)return;
  const lv=ensureMeta(m),diag=window.liveDelayDiagnostics?.()||{};
  const s={
    id:makeId('session'),startedAt:new Date().toISOString(),endedAt:null,
    scoutMsAtStart:scoutElapsedSafe(m),
    delaySeconds:Number(diag.delaySeconds)||Number($('live-delay-seconds')?.value)||10,
    maxBufferSeconds:Number(diag.maxBufferSeconds)||Number($('live-delay-buffer')?.value)||120,
    actionsLinked:0,ralliesLinked:0
  };
  lv.sessions.push(s);lv.currentSessionId=s.id;lv.enabled=true;
  state.sessionId=s.id;state.sessionStartedAt=Date.now();
  // If camera starts in the middle of a rally, its available video begins at 0.
  if(m.liveRally&&!Number.isFinite(Number(m.liveRally.liveVideoStart)))m.liveRally.liveVideoStart=0;
  m.liveRally.liveVideoSessionId=s.id;
  m.dataVersion=VERSION;save();render();
}
function endSession(){
  const m=active(),s=currentSession(m);if(!m||!s)return;
  s.endedAt=new Date().toISOString();const r=bufferRange();s.lastBufferedEnd=r?.end??null;
  const lv=ensureMeta(m);lv.currentSessionId=null;lv.enabled=false;
  m.dataVersion=VERSION;save();state.sessionId=null;state.sessionStartedAt=null;render();
}
function videoTimeForScoutMs(m,scoutMs){
  const s=currentSession(m);if(!s)return null;
  const t=(Number(scoutMs)-Number(s.scoutMsAtStart))/1000;
  return Number.isFinite(t)?Math.max(0,t):null;
}
function videoNow(m){
  const s=currentSession(m);if(!s)return null;
  const t=(scoutElapsedSafe(m)-Number(s.scoutMsAtStart))/1000;
  return Number.isFinite(t)?Math.max(0,t):null;
}
function markAction(a,m){
  const s=currentSession(m);if(!s||!a)return;
  const t=videoTimeForScoutMs(m,a.scoutMs);
  a.liveVideoTime=t;a.liveVideoSessionId=s.id;a.liveVideoLinkedAt=new Date().toISOString();
  s.actionsLinked=Number(s.actionsLinked||0)+1;
}
function lastClosedRally(m=active()){
  if(!m)return null;
  const bridge=window.VC_RALLY_TIMELINE_2062;
  if(bridge?.VERSION==='20.6.2'&&bridge.readOnly===true&&bridge.canonicalReferences===true&&typeof bridge.last==='function'){
    try{
      const typed=bridge.last(m),sets=arr(m.sets);let actual=null;
      outer:for(let si=sets.length-1;si>=0;si--){
        if(!(si in sets))continue;
        const set=sets[si],rallies=arr(set.rallies);
        for(let ri=rallies.length-1;ri>=0;ri--){
          if(ri in rallies){actual={r:rallies[ri],set};break outer}
        }
      }
      if((!typed&&!actual)||(typed&&actual&&typed.rally===actual.r&&typed.set===actual.set))return actual;
    }catch(_){}
  }
  const all=arr(m.sets).flatMap(s=>arr(s.rallies).map(r=>({r,set:s})));
  return all.length?all[all.length-1]:null;
}
function lastAction(m=active()){
  if(!m)return null;
  const live=arr(m.liveRally?.actions);if(live.length)return live[live.length-1];
  const lr=lastClosedRally(m)?.r;const aa=arr(lr?.actions);return aa.length?aa[aa.length-1]:null;
}
function linkRally(r,m,start,end){
  const s=currentSession(m);if(!r||!s)return;
  r.liveVideoSessionId=s.id;
  r.liveVideoStart=Math.max(0,Number(start)||0);
  r.liveVideoEnd=Math.max(r.liveVideoStart,Number(end)||r.liveVideoStart);
  r.liveVideoLinkedAt=new Date().toISOString();
  s.ralliesLinked=Number(s.ralliesLinked||0)+1;
}
function rangeAvailable(start,end){
  const r=bufferRange();if(!r)return {ok:false,reason:'El búfer de vídeo todavía no está disponible.'};
  if(end<r.start||start>r.end)return {ok:false,reason:'Ese momento ya no está dentro del búfer actual.'};
  return {ok:true,start:Math.max(start,r.start),end:Math.min(end,r.end),range:r,trimmed:start<r.start||end>r.end};
}
function clearReplay(){
  state.replayStop=null;state.replayAutoReturn=false;
  if(state.replayReturnTimer){clearTimeout(state.replayReturnTimer);state.replayReturnTimer=null}
}
function playRange(start,end,title='',autoReturn=false){
  if(!liveRunning()){alert('Inicia primero la cámara de Live Delay.');return false}
  const check=rangeAvailable(Number(start),Number(end));
  if(!check.ok){alert(check.reason);return false}
  const v=delayed();if(!v)return false;
  try{window.liveDelayJump?.(0)}catch(_){}
  clearReplay();state.replayStop=check.end;state.replayAutoReturn=!!autoReturn;
  try{v.currentTime=check.start;v.play().catch(()=>{})}catch(_){}
  if(title)toast((check.trimmed?'Replay parcial · ':'Replay · ')+title);
  return true;
}
function actionRange(a,m=active()){
  const s=currentSession(m);if(!a||!s||String(a.liveVideoSessionId)!==String(s.id)||a.liveVideoTime==null)return null;
  return {start:Math.max(0,Number(a.liveVideoTime)-2.2),end:Number(a.liveVideoTime)+2.0};
}
function rallyRange(r,m=active()){
  const s=currentSession(m);if(!r||!s||String(r.liveVideoSessionId)!==String(s.id))return null;
  if(r.liveVideoStart==null||r.liveVideoEnd==null)return null;
  return {start:Math.max(0,Number(r.liveVideoStart)-1.5),end:Number(r.liveVideoEnd)+1.5};
}
window.scoutV740ReplayLastAction=function(){
  const m=active(),a=lastAction(m),range=actionRange(a,m);
  if(!a||!range){alert('La última acción no está vinculada al búfer de vídeo actual.');return}
  playRange(range.start,range.end,`${a.code||a.skill||'Acción'} · ${playerLabel(a)}`,false);
};
window.scoutV740ReplayLastRally=function(auto=false){
  const m=active(),item=lastClosedRally(m),range=rallyRange(item?.r,m);
  if(!item?.r||!range){if(!auto)alert('El último rally no está vinculado al búfer de vídeo actual.');return false}
  const idx=arr(item.set.rallies).indexOf(item.r)+1;
  const title=`Set ${item.set.number} · Rally ${idx} · ${item.r.scoreAfter?.us??0}-${item.r.scoreAfter?.opponent??0}`;
  return playRange(range.start,range.end,title,!!auto);
};
window.scoutV740BookmarkLastRally=function(){
  const m=active(),item=lastClosedRally(m),range=rallyRange(item?.r,m),lv=ensureMeta(m),s=currentSession(m);
  if(!m||!item?.r||!range||!s){alert('No hay un último rally reproducible en la sesión de vídeo actual.');return}
  const idx=arr(item.set.rallies).indexOf(item.r)+1;
  const mark={
    id:makeId('mark'),sessionId:s.id,set:item.set.number,rallyId:item.r.id,
    start:range.start,end:range.end,createdAt:new Date().toISOString(),
    name:`Set ${item.set.number} · Rally ${idx}`,
    score:`${item.r.scoreAfter?.us??0}-${item.r.scoreAfter?.opponent??0}`,
    winner:item.r.winner
  };
  if(!lv.bookmarks.some(x=>String(x.sessionId)===String(mark.sessionId)&&Number(x.rallyId)===Number(mark.rallyId)))lv.bookmarks.push(mark);
  save();render();toast('Marcador de vídeo guardado');
};
window.scoutV740PlayBookmark=function(id){
  const m=active(),x=ensureMeta(m)?.bookmarks.find(b=>String(b.id)===String(id)),s=currentSession(m);
  if(!x||!s||String(x.sessionId)!==String(s.id)){alert('Este marcador pertenece a otra sesión de cámara y ya no está disponible en el búfer actual.');return}
  playRange(x.start,x.end,x.name,false);
};
window.scoutV740DeleteBookmark=function(id){
  const m=active(),lv=ensureMeta(m);if(!lv)return;
  lv.bookmarks=lv.bookmarks.filter(x=>String(x.id)!==String(id));save();render()
};

function renderBookmarks(m){
  const box=$('scout-v740-bookmark-list'),count=$('scout-v740-bookmark-count');if(!box||!count)return;
  const lv=ensureMeta(m),items=arr(lv?.bookmarks).slice().reverse();
  count.textContent=String(items.length);
  box.innerHTML=items.length?items.map(x=>{
    const playable=String(x.sessionId)===String(state.sessionId)&&liveRunning();
    return `<div class="scout-v740-bookmark"><time>${fmt(x.start)}–${fmt(x.end)}</time><div><strong>${esc(x.name||'Rally')}</strong><small>${esc(x.score||'')} · ${x.winner==='ours'?'Punto nuestro':x.winner==='opponent'?'Punto rival':'—'}${playable?' · disponible':' · sesión anterior'}</small></div><div><button class="ghost" ${playable?'':'disabled'} onclick="scoutV740PlayBookmark('${esc(x.id)}')">▶</button><button class="danger" onclick="scoutV740DeleteBookmark('${esc(x.id)}')">×</button></div></div>`;
  }).join(''):'<div class="scout-action-empty">Sin marcadores de vídeo guardados.</div>';
}
function renderLinkedRows(m){
  document.querySelectorAll('#scout-current-actions .scout-action-item').forEach((row,i)=>{
    const a=arr(m?.liveRally?.actions)[i];row.classList.toggle('scout-v740-action-linked',a?.liveVideoTime!=null);
    const small=row.querySelector('.scout-action-copy small');
    if(a?.liveVideoTime!=null&&small&&!small.dataset.v740){
      small.dataset.v740='1';small.innerHTML+=` · <span class="scout-v740-link-dot"></span>vídeo ${fmt(a.liveVideoTime)}`;
    }
  });
  document.querySelectorAll('#scout-rally-list .scout-rally-item').forEach((row,i)=>{
    const s=setOf(m),r=arr(s?.rallies)[i];row.classList.toggle('scout-v740-rally-linked',r?.liveVideoStart!=null&&r?.liveVideoEnd!=null);
  });
}
function render(){
  const m=active(),diag=window.liveDelayDiagnostics?.()||{},r=bufferRange(),s=currentSession(m);
  const badge=$('scout-v740-video-badge');
  if(badge){
    const running=!!diag.running;
    badge.textContent=running?(diag.mode==='delay'?`VÍDEO · −${diag.delaySeconds||'?'} s`:'VÍDEO · REPLAY'):'VÍDEO OFF';
    badge.className='scout-save-badge scout-v740-video-badge '+(running?(diag.mode==='delay'?'on':'review'):'');
  }
  const btn=$('scout-v740-live-video-btn');if(btn)btn.textContent=state.dockOpen?'🎥 Cerrar live vídeo':'🎥 Live vídeo';
  if(!m){
    if($('scout-v740-linked-actions'))$('scout-v740-linked-actions').textContent='0';
    if($('scout-v740-linked-rallies'))$('scout-v740-linked-rallies').textContent='0';
    return;
  }
  const sessionText=s?String(s.id).replace(/^session_/,'').slice(0,13):'—';
  if($('scout-v740-session'))$('scout-v740-session').textContent=sessionText;
  if($('scout-v740-session-note'))$('scout-v740-session-note').textContent=s?(diag.running?'Cámara activa':'Sesión detenida'):'Cámara detenida';
  const actions=arr(m.sets).flatMap(x=>arr(x.rallies)).flatMap(x=>arr(x.actions)).concat(arr(m.liveRally?.actions)).filter(a=>s&&String(a.liveVideoSessionId)===String(s.id)).length;
  const rallies=arr(m.sets).flatMap(x=>arr(x.rallies)).filter(x=>s&&String(x.liveVideoSessionId)===String(s.id)).length;
  if($('scout-v740-linked-actions'))$('scout-v740-linked-actions').textContent=String(actions);
  if($('scout-v740-linked-rallies'))$('scout-v740-linked-rallies').textContent=String(rallies);
  if($('scout-v740-buffer'))$('scout-v740-buffer').textContent=r?`${Math.round(r.span)} s`:'0 s';
  const last=lastClosedRally(m),lr=last?.r,idx=lr?arr(last.set.rallies).indexOf(lr)+1:0,range=rallyRange(lr,m);
  if($('scout-v740-last-title'))$('scout-v740-last-title').textContent=lr?`Set ${last.set.number} · Rally ${idx} · ${lr.scoreAfter?.us??0}-${lr.scoreAfter?.opponent??0}`:'Todavía no hay una jugada vinculada.';
  if($('scout-v740-last-note'))$('scout-v740-last-note').textContent=lr?(range?`${lr.winner==='ours'?'Punto nuestro':'Punto rival'} · vídeo ${fmt(range.start)}–${fmt(range.end)}`:'Rally guardado, pero no pertenece al búfer de cámara actual.'):'Inicia la cámara y registra acciones normalmente.';
  renderBookmarks(m);renderLinkedRows(m);
}

function csvSafe(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function slug(v){return String(v||'rally').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'rally'}
function captureMime(){
  if(typeof MediaRecorder==='undefined')return '';
  const list=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return list.find(x=>{try{return MediaRecorder.isTypeSupported?.(x)}catch(_){return false}})||'';
}
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
window.scoutV740ExportLastRally=async function(){
  if(state.exporting)return;
  const m=active(),item=lastClosedRally(m),range=rallyRange(item?.r,m),v=delayed();
  if(!m||!item?.r||!range){alert('No hay un último rally disponible en el búfer actual.');return}
  if(!v?.src||!liveRunning()){alert('Live Delay debe estar activo para exportar el rally.');return}
  const capture=v.captureStream||v.mozCaptureStream,mime=captureMime();
  if(typeof capture!=='function'||!mime){alert('Este navegador no permite exportar el replay directamente. El vínculo del rally queda guardado igualmente.');return}
  const check=rangeAvailable(range.start,range.end);if(!check.ok){alert(check.reason);return}
  state.exporting=true;clearReplay();
  try{
    window.liveDelayJump?.(0);v.pause();v.currentTime=check.start;
    await new Promise(res=>{if(v.readyState>=2)setTimeout(res,80);else v.addEventListener('seeked',()=>res(),{once:true})});
    const stream=capture.call(v),chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3000000});
    rec.addEventListener('dataavailable',e=>{if(e.data?.size)chunks.push(e.data)});
    const stopped=new Promise(res=>rec.addEventListener('stop',res,{once:true}));
    rec.start(250);await v.play();
    await new Promise(resolve=>{
      const tick=()=>{if(v.currentTime>=check.end-.04){cleanup();resolve()}};
      const cleanup=()=>v.removeEventListener('timeupdate',tick);
      v.addEventListener('timeupdate',tick);
      setTimeout(()=>{cleanup();resolve()},Math.max(3500,(check.end-check.start+2)*1700));
    });
    v.pause();if(rec.state!=='inactive')rec.stop();await stopped;stream.getTracks?.().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:mime});if(!blob.size)throw new Error('Sin datos exportados');
    const idx=arr(item.set.rallies).indexOf(item.r)+1;
    dl(blob,`${slug(m.date||'partido')}_set${item.set.number}_rally${idx}_${item.r.scoreAfter?.us??0}-${item.r.scoreAfter?.opponent??0}.webm`);
    toast('Rally exportado como WebM');
  }catch(err){
    console.error('V7.4 export rally',err);alert('No se ha podido exportar el rally en este navegador. El scouting y el vínculo de vídeo no se han perdido.');
  }finally{
    state.exporting=false;setTimeout(()=>window.liveDelayReturn?.(),200);
  }
};

// Start/stop wrappers: create a mapping session between scouting clock and camera clock.
const baseStartLive=window.startLiveDelay;
window.startLiveDelay=async function(...args){
  const was=liveRunning(),out=await baseStartLive?.apply(this,args);
  if(!was&&liveRunning())beginSession();
  render();return out;
};
const baseStopLive=window.stopLiveDelay;
window.stopLiveDelay=function(...args){
  if(liveRunning())endSession();
  const out=baseStopLive?.apply(this,args);render();return out;
};

// Action wrapper: timestamp every action against the active camera session.
if(typeof scoutPushAction==='function'){
  const basePush=scoutPushAction;
  scoutPushAction=function(action){
    const m=active(),before=arr(m?.liveRally?.actions).length;
    const out=basePush(action);
    const mm=active(),aa=arr(mm?.liveRally?.actions);
    if(out&&liveRunning()&&aa.length>before){
      const a=aa[aa.length-1];markAction(a,mm);
      if(mm.liveRally&&mm.liveRally.liveVideoStart==null){
        const s=currentSession(mm);
        mm.liveRally.liveVideoStart=s?Math.max(0,(Number(mm.liveRally.scoutStartMs)-Number(s.scoutMsAtStart))/1000):0;
        mm.liveRally.liveVideoSessionId=s?.id||null;
      }
      mm.dataVersion=VERSION;
      /* Base push already initiated the action journal and idle consolidation.
         Avoid a second save + full video render for the same click. */
      if($('scout-match-mode')?.classList.contains('active')&&(window.VC_V910_MATCH_VIEW?.get?.()==='video'||window.VC_V910_MATCH_VIEW?.get?.()==='todo'))setTimeout(render,0);
    }
    return out;
  };
}

// Rally reset wrapper: start the next rally at the current camera time.
if(typeof scoutResetLiveRally==='function'){
  const baseReset=scoutResetLiveRally;
  scoutResetLiveRally=function(m){
    const out=baseReset(m);
    if(m&&liveRunning()){
      const s=currentSession(m);if(s){
        m.liveRally.liveVideoSessionId=s.id;
        m.liveRally.liveVideoStart=videoNow(m);
      }
    }
    return out;
  };
}

// Point wrapper: close the video range and optionally replay it immediately.
const baseAward=window.scoutAwardPoint;
window.scoutAwardPoint=function(winner){
  const m=active(),s=currentSession(m);
  const liveId=m?.liveRally?.id,start=m?.liveRally?.liveVideoStart,sessionId=m?.liveRally?.liveVideoSessionId||s?.id;
  const end=(m&&s&&liveRunning())?videoNow(m):null;
  const out=baseAward?.call(this,winner);
  const mm=active();
  if(mm&&s&&end!=null){
    const all=arr(mm.sets).flatMap(set=>arr(set.rallies).map(r=>({set,r})));
    const found=all.slice().reverse().find(x=>Number(x.r.id)===Number(liveId));
    if(found&&String(sessionId)===String(s.id)){
      const first=arr(found.r.actions).find(a=>String(a.liveVideoSessionId)===String(s.id));
      const effectiveStart=start!=null?Number(start):(first?.liveVideoTime!=null?Math.max(0,Number(first.liveVideoTime)-1):Math.max(0,end-8));
      linkRally(found.r,mm,effectiveStart,end);
      mm.dataVersion=VERSION;save();
      if($('scout-match-mode')?.classList.contains('active')&&(window.VC_V910_MATCH_VIEW?.get?.()==='video'||window.VC_V910_MATCH_VIEW?.get?.()==='todo'))render();
      if($('scout-v740-auto-replay')?.checked){
        setTimeout(()=>window.scoutV740ReplayLastRally(true),800);
      }
    }
  }
  return out;
};

// Undo wrapper: preserve live-video fields when a closed rally is reopened.
const baseUndo=window.scoutUndoRally;
window.scoutUndoRally=function(...args){
  const m=active(),last=lastClosedRally(m)?.r;
  const keep=last?{
    liveVideoSessionId:last.liveVideoSessionId,liveVideoStart:last.liveVideoStart,
    liveVideoEnd:last.liveVideoEnd,liveVideoLinkedAt:last.liveVideoLinkedAt
  }:null;
  const out=baseUndo?.apply(this,args);
  const mm=active();
  if(mm?.liveRally&&keep){
    Object.entries(keep).forEach(([k,v])=>{if(v!==undefined)mm.liveRally[k]=v});
    mm.dataVersion=VERSION;save();render();
  }
  return out;
};

// Render wrapper: keep video status integrated with every scouting render.
const baseRender=window.scoutRender;
window.scoutRender=function(...args){
  const out=baseRender?.apply(this,args);if(state.dockOpen||$('scouting')?.classList.contains('active'))setTimeout(render,0);return out;
};

// Keep linked markers after V6/V7 UI redraws.
const delayedVideo=delayed();
if(delayedVideo&&!delayedVideo.dataset.v740Bound){
  delayedVideo.dataset.v740Bound='1';
  delayedVideo.addEventListener('timeupdate',()=>{
    if(state.replayStop!=null&&delayedVideo.currentTime>=state.replayStop-.04){
      delayedVideo.pause();const auto=state.replayAutoReturn;clearReplay();
      if(auto){
        const wait=Math.max(0,Number($('scout-v740-auto-return')?.value)||0);
        if(wait>0)state.replayReturnTimer=setTimeout(()=>window.liveDelayReturn?.(),wait*1000);
      }
    }
    render();
  });
}

// If the user saves/finalizes and actually exits the live scouting, release camera safely.
['scoutV6102SaveAndExit','scoutV6102FinalizeAndExit'].forEach(name=>{
  const base=window[name];if(typeof base!=='function')return;
  window[name]=async function(...args){
    const out=await base.apply(this,args);
    const still=typeof window.scoutV6102HasActive==='function'&&window.scoutV6102HasActive();
    if(!still&&state.dockOpen)window.scoutV740CloseDock();
    return out;
  };
});

// Keyboard shortcuts only while the scouting view and dock are active.
document.addEventListener('keydown',e=>{
  if(!state.dockOpen||!$('scouting')?.classList.contains('active'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();if(['input','select','textarea'].includes(tag))return;
  if(e.altKey&&e.key.toLowerCase()==='r'){e.preventDefault();window.scoutV740ReplayLastRally()}
  else if(e.altKey&&e.key.toLowerCase()==='a'){e.preventDefault();window.scoutV740ReplayLastAction()}
  else if(e.altKey&&e.key.toLowerCase()==='l'){e.preventDefault();window.liveDelayReturn?.()}
});

// If V7.3 modal close is invoked while its controls are embedded, use the V7.4 close flow.
const baseCloseLive=window.closeLiveDelay;
window.closeLiveDelay=function(...args){
  if(state.dockOpen){window.scoutV740CloseDock();return}
  return baseCloseLive?.apply(this,args);
};

window.scoutV740Diagnostics=function(){
  const m=active(),s=currentSession(m),r=bufferRange(),last=lastClosedRally(m)?.r;
  return {
    version:VERSION,
    dockOpen:state.dockOpen,
    liveDelay:window.liveDelayDiagnostics?.()||null,
    matchId:m?.id||null,
    currentSessionId:s?.id||null,
    sessionScoutMsAtStart:s?.scoutMsAtStart??null,
    linkedActions:m&&s?arr(m.sets).flatMap(x=>arr(x.rallies)).flatMap(x=>arr(x.actions)).concat(arr(m.liveRally?.actions)).filter(a=>String(a.liveVideoSessionId)===String(s.id)).length:0,
    linkedRallies:m&&s?arr(m.sets).flatMap(x=>arr(x.rallies)).filter(x=>String(x.liveVideoSessionId)===String(s.id)).length:0,
    buffer:r,
    lastRally:last?{id:last.id,start:last.liveVideoStart,end:last.liveVideoEnd,sessionId:last.liveVideoSessionId}:null,
    bookmarks:arr(m?.liveVideo?.bookmarks).length
  };
};

loadPrefs();setTimeout(render,0);
})();

/* VC20710_SOURCE_END:028-v740-live-scout-video-module.js */
;
