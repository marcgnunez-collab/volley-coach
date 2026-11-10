
(()=>{
'use strict';

const VERSION='16.0.6.3';
const $=id=>document.getElementById(id);
const state={
  room:'',
  streamId:'',
  key:'',
  sdk:null,
  stream:null,
  connected:false,
  preparing:false,
  viewerPromise:null,
  viewerWanted:false,
  viewerGeneration:0,
  viewerWatchdog:null,
  publisherPreviewBound:false,
  reconnectTimer:null,
  reconnectAttempts:0,
  reconnecting:false,
  source:'local',
  publisher:null,
  publisherStream:null,
  publisherFacing:'environment',
  publisherQuality:'720',
  publisherOrientation:null,
  publisherOrientationPreference:'auto',
  orientationTimer:null,
  orientationBusy:false,
  viewOrientation:'auto',
  delayOrientationFix:'sync',
  delayCanvas:null,
  delayCtx:null,
  delayStream:null,
  delaySourceVideo:null,
  delaySourceStream:null,
  delaySourceOwned:false,
  delayFrameHandle:null,
  delayFrameMode:'',
  delayFrameLastDrawAt:0,
  delayFrameGeneration:0,
  delayDrawnFrames:0,
  delaySkippedFrames:0,
  recordingCanvas:null,
  recordingCtx:null,
  recordingStream:null,
  recordingSourceVideo:null,
  recordingSourceStream:null,
  recordingFrameHandle:null,
  recordingFrameMode:'',
  recordingFrameLastDrawAt:0,
  recordingFrameGeneration:0,
  recordingSkippedFrames:0,
  recordingLastFrameAt:0,
  recordingFrameCount:0,
  recordingDrawErrors:0,
  recordingRefreshBusy:false,
  recordingOutputOrientation:'landscape',
  recordingOutputWidth:1280,
  recordingOutputHeight:720,
  wakeLock:null
};

function randomToken(prefix='',bytes=12){
  const a=new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return prefix+[...a].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function setRemoteStatus(text,kind=''){
  const el=$('vc-remote-status');if(!el)return;
  el.textContent=text;el.className=`vc-remote-status ${kind}`;
}
function setPreviewEmpty(text,hidden=false){
  const el=$('vc-remote-preview-empty');if(!el)return;
  el.textContent=text||'';el.classList.toggle('hidden',!!hidden);
}
function loadScript(src,test,timeout=12000){
  if(test())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){
      const timer=setInterval(()=>{if(test()){clearInterval(timer);resolve()}},80);
      setTimeout(()=>{clearInterval(timer);test()?resolve():reject(new Error('No se pudo cargar '+src))},timeout);
      return;
    }
    const s=document.createElement('script');s.src=src;s.async=true;
    const to=setTimeout(()=>reject(new Error('Timeout cargando '+src)),timeout);
    s.onload=()=>{clearTimeout(to);test()?resolve():reject(new Error('La librería no expuso su API.'))};
    s.onerror=()=>{clearTimeout(to);reject(new Error('Error cargando '+src))};
    document.head.appendChild(s);
  });
}
async function ensureVDOSDK(){
  if(window.VDONinjaSDK)return;
  const sources=[
    'https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.2/vdoninja-sdk.min.js',
    'https://unpkg.com/@vdoninja/sdk@1.6.2/vdoninja-sdk.min.js'
  ];
  let last;
  for(const src of sources){
    try{await loadScript(src,()=>!!window.VDONinjaSDK);return}catch(err){last=err}
  }
  throw last||new Error('No se pudo cargar VDO.Ninja SDK.');
}
async function ensureQR(){
  if(window.QRCode)return true;
  try{
    await loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',()=>!!window.QRCode,10000);
    return true;
  }catch(err){
    console.warn('QR library unavailable',err);
    return false;
  }
}
function publisherUrl(){
  const u=new URL(location.href);
  u.search='';
  u.hash='';
  u.searchParams.set('vcCamera',state.streamId);
  u.searchParams.set('vcRoom',state.room);
  u.searchParams.set('vcKey',state.key);
  u.searchParams.set('vcQuality','720');
  return u.href;
}
async function renderQR(){
  const box=$('vc-remote-qr'),input=$('vc-remote-link');
  const link=publisherUrl();
  if(input)input.value=link;
  if(!box)return;
  box.innerHTML='';
  const ok=await ensureQR();
  if(ok&&window.QRCode){
    new QRCode(box,{text:link,width:148,height:148,correctLevel:QRCode.CorrectLevel.M});
  }else{
    box.innerHTML='<span>No se pudo dibujar el QR. Usa “Copiar enlace” y ábrelo en el móvil.</span>';
  }
}
function cancelReconnect(){
  if(state.reconnectTimer){clearTimeout(state.reconnectTimer);state.reconnectTimer=null;}
}
function cancelViewerWatchdog(){
  if(state.viewerWatchdog){clearTimeout(state.viewerWatchdog);state.viewerWatchdog=null;}
}
async function bounded(operation,timeoutMs,description){
  let timeout;
  try{return await Promise.race([
    Promise.resolve(operation),
    new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error(description+' agotó el tiempo de espera.')),timeoutMs)})
  ])}finally{clearTimeout(timeout)}
}
function scheduleReconnect(reason){
  if(!state.viewerWanted||!state.room||!state.key||state.connected||state.reconnecting||state.reconnectTimer)return;
  if(state.reconnectAttempts>=4){
    setRemoteStatus('SIN CONEXIÓN · REINTENTAR','bad');
    setPreviewEmpty('No se ha podido reconectar automáticamente. Pulsa «Reintentar conexión».',false);
    return;
  }
  const seconds=Math.min(16,2**state.reconnectAttempts*2);
  state.reconnectAttempts++;
  setRemoteStatus(`RECONECTANDO · ${state.reconnectAttempts}/4`,'wait');
  state.reconnectTimer=setTimeout(async()=>{
    state.reconnectTimer=null;
    if(!state.viewerWanted||state.connected)return;
    state.reconnecting=true;
    try{await connectViewer();}
    catch(err){console.warn('V16.0 reconectar WebRTC',err);}
    finally{
      state.reconnecting=false;
      if(!state.connected&&state.viewerWanted){
        setTimeout(()=>scheduleReconnect('sin fotogramas'),3000);
      }
    }
  },seconds*1000);
}
async function disconnectViewer(keepSession=true){
  cancelViewerWatchdog();
  state.viewerGeneration++;
  state.connected=false;
  const preview=$('vc-remote-preview');
  if(preview){try{preview.pause()}catch(_){};preview.srcObject=null}
  if(state.stream){try{state.stream.getTracks().forEach(t=>t.stop())}catch(_){}}
  state.stream=null;
  try{state.sdk?.disconnect?.()}catch(_){}
  state.sdk=null;state.viewerPromise=null;
  setPreviewEmpty('Esperando al móvil…',false);
  setRemoteStatus(keepSession?'DESCONECTADO':'SIN PREPARAR',keepSession?'wait':'');
  if(!keepSession){state.room='';state.streamId='';state.key='';if($('vc-remote-link'))$('vc-remote-link').value='';if($('vc-remote-qr'))$('vc-remote-qr').innerHTML='<span>Genera una sesión para mostrar el QR.</span>'}
}
async function connectViewer(){
  if(!state.room||!state.streamId||!state.key)throw new Error('Primero genera una sesión de cámara.');
  await ensureVDOSDK();
  if(!state.viewerWanted)return;
  await disconnectViewer(true);
  const generation=state.viewerGeneration;
  setRemoteStatus('ESPERANDO MÓVIL','wait');
  setPreviewEmpty('Esperando al móvil…',false);

  const sdk=new VDONinjaSDK({salt:'vdo.ninja',password:state.key});
  state.sdk=sdk;
  const incoming=new MediaStream();

  sdk.addEventListener('track',event=>{
    const track=event?.detail?.track;
    if(sdk!==state.sdk||!track||track.kind!=='video')return;
    if(!incoming.getVideoTracks().some(t=>t.id===track.id))incoming.addTrack(track);
    state.stream=incoming;
    state.connected=true;state.reconnectAttempts=0;cancelReconnect();cancelViewerWatchdog();
    const pv=$('vc-remote-preview');
    if(pv){
      pv.srcObject=incoming;pv.muted=true;
      pv.play().then(()=>setTimeout(vcApplyViewOrientation,60)).catch(()=>{});
    }
    setPreviewEmpty('',true);
    setRemoteStatus('MÓVIL CONECTADO','on');
    if($('live-delay-live-title'))$('live-delay-live-title').textContent='Móvil remoto';
    track.addEventListener('ended',()=>{
      if(sdk!==state.sdk)return;
      state.connected=false;
      setRemoteStatus('SEÑAL PERDIDA','bad');
      setPreviewEmpty('Se ha perdido la señal del móvil. Reconectando…',false);
      scheduleReconnect('pista terminada');
    },{once:true});
  });

  sdk.addEventListener?.('connectionstate',e=>{
    if(sdk!==state.sdk)return;
    const s=String(e?.detail?.state||e?.detail||'');
    if(/failed|disconnected|closed/i.test(s)){
      state.connected=false;
      setRemoteStatus('SIN SEÑAL','bad');
      scheduleReconnect(s);
    }
  });

  try{
    await bounded(sdk.connect(),15000,'Conexión WebRTC');
    if(generation!==state.viewerGeneration||!state.viewerWanted)return;
    await bounded(sdk.joinRoom({room:state.room,password:state.key}),15000,'Sala de cámara');
    if(generation!==state.viewerGeneration||!state.viewerWanted)return;
    state.viewerPromise=sdk.view(state.streamId,{audio:false,video:true});
    // Some SDK connections succeed without ever delivering a video track.
    state.viewerWatchdog=setTimeout(async()=>{
      state.viewerWatchdog=null;
      if(sdk!==state.sdk||!state.viewerWanted||state.connected)return;
      setRemoteStatus('SIN VÍDEO · RECONECTANDO','bad');
      await disconnectViewer(true);
      scheduleReconnect('No llegaron fotogramas');
    },20000);
  }catch(err){
    if(sdk===state.sdk){
      await disconnectViewer(true);
      if(state.viewerWanted)scheduleReconnect('Fallo al conectar');
    }
    throw err;
  }
  Promise.resolve(state.viewerPromise).catch(err=>{
    if(sdk!==state.sdk)return;
    console.warn('V7.6 remote view',err);
    if(!state.connected){
      setRemoteStatus('REINTENTAR','bad');
      void disconnectViewer(true).then(()=>scheduleReconnect('fallo de visualización'));
    }
  });
}
window.vcRemotePrepare=async function(reset=false){
  if(state.preparing)return;
  state.preparing=true;
  try{
    if(reset||!state.room||!state.streamId||!state.key){
      await disconnectViewer(false);
      state.room=randomToken('vcroom_',8);
      state.streamId=randomToken('cam_',10);
      state.key=randomToken('',14);
    }
    state.viewerWanted=true;state.reconnectAttempts=0;cancelReconnect();
    setRemoteStatus('PREPARANDO…','wait');
    await renderQR();
    const note=$('vc-remote-session-note');
    if(note)note.textContent=`Sesión ${state.streamId.slice(-8)} · el enlace contiene una clave privada; no lo compartas públicamente.`;
    await connectViewer();
  }catch(err){
    console.error('V7.6 prepare remote',err);
    setRemoteStatus('ERROR','bad');
    setPreviewEmpty('No se ha podido preparar la conexión remota.',false);
    alert('No se ha podido preparar la cámara remota.\n\n'+String(err?.message||err));
  }finally{state.preparing=false}
};
window.vcRemoteReconnect=async function(){
  state.viewerWanted=true;state.reconnectAttempts=0;cancelReconnect();
  try{await connectViewer()}catch(err){setRemoteStatus('ERROR','bad');alert(String(err?.message||err))}
};
window.vcRemoteDisconnect=async function(){state.viewerWanted=false;cancelReconnect();await disconnectViewer(true)};
window.vcRemoteCopyLink=async function(){
  const link=$('vc-remote-link')?.value||publisherUrl();
  try{await navigator.clipboard.writeText(link);setRemoteStatus('ENLACE COPIADO','on')}
  catch(_){prompt('Copia este enlace y ábrelo en el móvil:',link)}
};
window.vcRemoteSourceChanged=function(value){
  state.source=value==='remote'?'remote':'local';
  const remote=$('vc-remote-panel'),local=$('live-delay-local-camera-field');
  remote?.classList.toggle('hidden',state.source!=='remote');
  local?.classList.toggle('hidden',state.source==='remote');
  if($('live-delay-live-title'))$('live-delay-live-title').textContent=state.source==='remote'?'Móvil remoto':'Cámara actual';
  try{localStorage.setItem('volley_live_delay_source',state.source)}catch(_){}
  if(state.source==='remote'&&!state.room)window.vcRemotePrepare(false);
};
window.VC_REMOTE_CAMERA={
  getStream:()=>state.stream,
  getPublisherStream:()=>state.publisherStream,
  getPublisherOrientation:()=>state.publisherOrientation||null,
  getPublisherOrientationPreference:()=>state.publisherOrientationPreference||'auto',
  isConnected:()=>state.connected&&!!state.stream?.getVideoTracks?.().some(t=>t.readyState==='live'),
  prepare:window.vcRemotePrepare,
  disconnect:window.vcRemoteDisconnect,
  diagnostics:()=>({version:VERSION,source:state.source,connected:state.connected,viewerWanted:state.viewerWanted,reconnectAttempts:state.reconnectAttempts,reconnecting:state.reconnecting,waitingForVideo:!!state.viewerWatchdog,tracks:state.stream?.getVideoTracks?.().map(t=>({state:t.readyState}))||[]})
};


/* ---------- PC view orientation / aspect ratio ---------- */
function vcViewTargets(){
  const remote=$('vc-remote-preview');
  const live=$('live-delay-live');
  const delayed=$('live-delay-delayed');
  return [
    {video:remote,frame:$('vc-remote-preview-frame')},
    {video:live,frame:live?.closest?.('.live-delay-video-frame')},
    {video:delayed,frame:delayed?.closest?.('.live-delay-video-frame')}
  ].filter(x=>x.video&&x.frame);
}
function vcVideoIntrinsic(video){
  const w=Number(video?.videoWidth)||0,h=Number(video?.videoHeight)||0;
  return {w,h,portrait:!!(w&&h&&h>w),landscape:!!(w&&h&&w>=h)};
}
function vcDesiredRotation(video,mode){
  /* The delayed MediaSource is already physically normalized by the canvas.
     Do not apply the DIRECT rotation again or the image is double-rotated. */
  if(video?.id==='live-delay-delayed'&&video?.dataset?.vcNormalizedDelay==='1')return 0;
  const d=vcVideoIntrinsic(video);
  if(mode==='right')return 90;
  if(mode==='left')return -90;
  if(mode==='horizontal')return d.portrait?90:0;
  if(mode==='vertical')return d.landscape?90:0;
  return 0;
}
function vcDelayCorrection(video){
  if(video?.id!=='live-delay-delayed')return 0;
  const v=state.delayOrientationFix;
  if(v==='180')return 180;
  if(v==='90')return 90;
  if(v==='-90')return -90;
  return 0;
}
function vcTargetAspect(video,mode,rotation){
  const d=vcVideoIntrinsic(video);
  if(mode==='horizontal'||mode==='right'||mode==='left')return 16/9;
  if(mode==='vertical')return 9/16;
  if(d.w&&d.h)return rotation?d.h/d.w:d.w/d.h;
  return 16/9;
}
function vcLayoutVideo(video,frame){
  if(!video||!frame)return;
  const mode=state.viewOrientation||'auto';
  const baseRotation=vcDesiredRotation(video,mode);
  const rotation=baseRotation+vcDelayCorrection(video);
  const aspect=vcTargetAspect(video,mode,baseRotation);

  frame.style.aspectRatio=String(aspect);
  frame.dataset.viewMode=mode;
  frame.dataset.rotation=String(rotation);
  frame.dataset.orientation=aspect>=1?'landscape':'portrait';

  /* The video is absolutely positioned. For a 90° rotation its CSS width/height
     are swapped to match the container before rotation. This avoids a tiny,
     letterboxed portrait image in a horizontal fullscreen frame. */
  video.style.position='absolute';
  video.style.left='50%';
  video.style.top='50%';
  video.style.maxWidth='none';
  video.style.maxHeight='none';
  video.style.objectFit='contain';
  video.style.transformOrigin='center center';

  const fw=Math.max(1,frame.clientWidth||0),fh=Math.max(1,frame.clientHeight||0);
  if(Math.abs(rotation)===90){
    video.style.width=`${fh}px`;
    video.style.height=`${fw}px`;
    video.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`;
  }else{
    video.style.width='100%';
    video.style.height='100%';
    video.style.transform='translate(-50%,-50%)';
  }
}
function vcApplyViewOrientation(){
  vcViewTargets().forEach(({video,frame})=>vcLayoutVideo(video,frame));
  const sel=$('vc-remote-view-orientation');
  if(sel&&sel.value!==state.viewOrientation)sel.value=state.viewOrientation;
}
function vcBindViewVideo(video,frame){
  if(!video||!frame||video.dataset.vcViewBound)return;
  video.dataset.vcViewBound='1';
  const sync=()=>requestAnimationFrame(()=>vcLayoutVideo(video,frame));
  video.addEventListener('resize',sync);
  video.addEventListener('loadedmetadata',sync);
  video.addEventListener('loadeddata',sync);
  video.addEventListener('playing',sync);
  setTimeout(sync,0);
}
function vcBindAllAspects(){
  vcViewTargets().forEach(({video,frame})=>vcBindViewVideo(video,frame));
  vcApplyViewOrientation();
}
window.vcRemoteSetViewOrientation=function(mode){
  const allowed=['auto','horizontal','vertical','right','left'];
  state.viewOrientation=allowed.includes(mode)?mode:'auto';
  try{localStorage.setItem('volley_remote_view_orientation',state.viewOrientation)}catch(_){}
  vcApplyViewOrientation();
};
window.vcRemoteRotateView=function(direction=1){
  const current=state.viewOrientation||'auto';
  const cycleRight={auto:'right',right:'vertical',vertical:'left',left:'horizontal',horizontal:'auto'};
  const cycleLeft={auto:'left',left:'vertical',vertical:'right',right:'horizontal',horizontal:'auto'};
  state.viewOrientation=(Number(direction)<0?cycleLeft:cycleRight)[current]||'auto';
  try{localStorage.setItem('volley_remote_view_orientation',state.viewOrientation)}catch(_){}
  vcApplyViewOrientation();
};

window.vcSetDelayOrientationFix=function(value){
  const allowed=['sync','180','90','-90'];
  state.delayOrientationFix=allowed.includes(String(value))?String(value):'sync';
  try{localStorage.setItem('volley_delay_orientation_fix',state.delayOrientationFix)}catch(_){}
  const sel=$('vc-delay-orientation-fix');
  if(sel&&sel.value!==state.delayOrientationFix)sel.value=state.delayOrientationFix;
  vcApplyViewOrientation();
};
function vcRestoreDelayOrientationFix(){
  try{
    const saved=localStorage.getItem('volley_delay_orientation_fix');
    if(['sync','180','90','-90'].includes(saved))state.delayOrientationFix=saved;
  }catch(_){}
  const sel=$('vc-delay-orientation-fix');
  if(sel)sel.value=state.delayOrientationFix;
}

function vcRestoreViewOrientation(){
  try{
    const saved=localStorage.getItem('volley_remote_view_orientation');
    if(['auto','horizontal','vertical','right','left'].includes(saved))state.viewOrientation=saved;
  }catch(_){}
  const sel=$('vc-remote-view-orientation');
  if(sel)sel.value=state.viewOrientation;
}
vcRestoreViewOrientation();
vcRestoreDelayOrientationFix();
setTimeout(vcBindAllAspects,0);
// V16.0.1: avoid laying out remote video on every change to statistics tables.
let vcAspectPending=false;
new MutationObserver(records=>{
  const relevant=records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1 &&
    (n.matches?.('video, .vc-remote-video, .v700-video-frame, #scout-v700-video-modal') ||
     n.querySelector?.('video'))));
  if(!relevant||vcAspectPending)return;
  vcAspectPending=true;
  requestAnimationFrame(()=>{vcAspectPending=false;vcBindAllAspects()});
}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',()=>requestAnimationFrame(vcApplyViewOrientation));
document.addEventListener('fullscreenchange',()=>setTimeout(vcApplyViewOrientation,60));
document.addEventListener('webkitfullscreenchange',()=>setTimeout(vcApplyViewOrientation,60));


/* ---------- V7.7.2 · Normalize REMOTE video before MediaRecorder ---------- */
function vcWaitForVideoDimensions(video,timeout=2500){
  return new Promise(resolve=>{
    if(video?.videoWidth&&video?.videoHeight)return resolve(true);
    const started=Date.now();
    const tick=()=>{
      if(video?.videoWidth&&video?.videoHeight)return resolve(true);
      if(Date.now()-started>=timeout)return resolve(false);
      setTimeout(tick,60);
    };
    tick();
  });
}
function vcDelayCanvasSpec(video){
  const mode=state.viewOrientation||'auto';
  const d=vcVideoIntrinsic(video);
  const rotation=vcDesiredRotation(video,mode);
  let landscape=true;
  if(mode==='vertical')landscape=false;
  else if(['horizontal','right','left'].includes(mode))landscape=true;
  else if(d.w&&d.h){
    const rw=Math.abs(rotation)%180===90?d.h:d.w;
    const rh=Math.abs(rotation)%180===90?d.w:d.h;
    landscape=rw>=rh;
  }
  return {
    mode,rotation,
    width:landscape?1280:720,
    height:landscape?720:1280
  };
}
function vcScheduleDelayFrame(video){
  if(!state.delayCanvas||!state.delayCtx||!state.delaySourceVideo)return;
  if(typeof video?.requestVideoFrameCallback==='function'){
    state.delayFrameMode='rvfc';
    const token=state.delayFrameGeneration;
    state.delayFrameHandle=video.requestVideoFrameCallback(()=>{if(token===state.delayFrameGeneration)vcDrawDelayNormalizedFrame(undefined,video)});
  }else{
    state.delayFrameMode='raf';
    const token=state.delayFrameGeneration;
    state.delayFrameHandle=requestAnimationFrame(ts=>{if(token===state.delayFrameGeneration)vcDrawDelayNormalizedFrame(ts,video)});
  }
}
function vcDrawDelayNormalizedFrame(timestamp,expectedVideo){
  const canvas=state.delayCanvas,ctx=state.delayCtx,video=state.delaySourceVideo;
  // An old callback may run after a camera reconnect; it must not start a second loop.
  if(!canvas||!ctx||!video||(expectedVideo&&expectedVideo!==video))return;
  // Only the RAF fallback needs pacing. requestVideoFrameCallback already follows
  // actual decoded frames. canvas.captureStream(30) cannot use 60/120 redraws.
  if(state.delayFrameMode==='raf'&&Number.isFinite(timestamp)){
    if(state.delayFrameLastDrawAt&&timestamp-state.delayFrameLastDrawAt<1000/30){
      state.delaySkippedFrames++;vcScheduleDelayFrame(video);return;
    }
    state.delayFrameLastDrawAt=timestamp;
  }
  try{
    const sw=Number(video.videoWidth)||0,sh=Number(video.videoHeight)||0;
    if(sw&&sh&&video.readyState>=2){
      const spec=vcDelayCanvasSpec(video);
      const cw=canvas.width,ch=canvas.height;
      const r=((spec.rotation%360)+360)%360;
      const quarter=r===90||r===270;
      const rw=quarter?sh:sw,rh=quarter?sw:sh;
      const scale=Math.min(cw/rw,ch/rh);
      ctx.save();
      try{
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle='#000';
        ctx.fillRect(0,0,cw,ch);
        ctx.translate(cw/2,ch/2);
        ctx.rotate(spec.rotation*Math.PI/180);
        ctx.drawImage(video,-sw*scale/2,-sh*scale/2,sw*scale,sh*scale);
        state.delayDrawnFrames++;
      }finally{
        try{ctx.restore()}catch(_){}
      }
    }
  }catch(err){
    console.warn('V9.5.9 delay frame transient error',err);
  }finally{
    vcScheduleDelayFrame(state.delaySourceVideo);
  }
}
function vcCreateHiddenLiveVideo(sourceStream,label='vc-hidden-live'){
  const tracks=sourceStream?.getVideoTracks?.().filter(t=>t.readyState==='live')||[];
  if(!tracks.length)throw new Error('No existe una pista LIVE activa.');
  const cloned=new MediaStream(tracks.map(t=>t.clone()));
  const video=document.createElement('video');
  video.dataset.vcRole=label;
  video.autoplay=true;video.muted=true;video.playsInline=true;
  video.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.001;pointer-events:none;z-index:-1';
  document.body.appendChild(video);
  video.srcObject=cloned;
  return {video,stream:cloned};
}
window.vcStopDelayNormalizer=function(){
  const video=state.delaySourceVideo;
  try{
    if(state.delayFrameMode==='rvfc'&&video?.cancelVideoFrameCallback&&state.delayFrameHandle!=null){
      video.cancelVideoFrameCallback(state.delayFrameHandle);
    }else if(state.delayFrameMode==='raf'&&state.delayFrameHandle!=null){
      cancelAnimationFrame(state.delayFrameHandle);
    }
  }catch(_){}
  state.delayFrameGeneration++;state.delayFrameHandle=null;state.delayFrameMode='';state.delayFrameLastDrawAt=0;
  try{state.delayStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  try{state.delaySourceStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  try{if(state.delaySourceOwned&&video){video.pause();video.srcObject=null;video.remove()}}catch(_){}
  state.delayStream=null;state.delayCanvas=null;state.delayCtx=null;
  state.delaySourceVideo=null;state.delaySourceStream=null;state.delaySourceOwned=false;
};
async function vcCreateDelayNormalizedStream(source){
  window.vcStopDelayNormalizer();
  if(!source)throw new Error('No existe la señal LIVE para crear el Delay.');
  if(typeof HTMLCanvasElement==='undefined'||typeof document.createElement('canvas').captureStream!=='function'){
    throw new Error('Este navegador no permite normalizar el vídeo mediante canvas.');
  }

  let video=source;
  if(typeof MediaStream!=='undefined'&&source instanceof MediaStream){
    const hidden=vcCreateHiddenLiveVideo(source,'vc-delay-live-source');
    video=hidden.video;
    state.delaySourceStream=hidden.stream;
    state.delaySourceOwned=true;
    await video.play().catch(()=>{});
  }else{
    state.delaySourceOwned=false;
    state.delaySourceStream=null;
  }

  await vcWaitForVideoDimensions(video,3000);
  const spec=vcDelayCanvasSpec(video);
  const canvas=document.createElement('canvas');
  canvas.width=spec.width;canvas.height=spec.height;
  const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
  if(!ctx)throw new Error('No se pudo crear el canvas de orientación.');
  state.delayCanvas=canvas;state.delayCtx=ctx;state.delaySourceVideo=video;
  vcDrawDelayNormalizedFrame();
  const stream=canvas.captureStream(30);
  state.delayStream=stream;
  return stream;
}
window.VC_REMOTE_CAMERA.createDelayNormalizedStream=vcCreateDelayNormalizedStream;
window.VC_REMOTE_CAMERA.stopDelayNormalizedStream=window.vcStopDelayNormalizer;

/* ---------- V9.5.8 · LIVE recording normalizer ----------
   Recording is fed from the RAW LIVE WebRTC MediaStream, never from MediaSource
   and never from the delayed <video>. */
function vcCancelRecordingFrame(){
  const video=state.recordingSourceVideo;
  try{
    if(state.recordingFrameMode==='rvfc'&&video?.cancelVideoFrameCallback&&state.recordingFrameHandle!=null){
      video.cancelVideoFrameCallback(state.recordingFrameHandle);
    }else if(state.recordingFrameMode==='raf'&&state.recordingFrameHandle!=null){
      cancelAnimationFrame(state.recordingFrameHandle);
    }
  }catch(_){}
  state.recordingFrameGeneration++;state.recordingFrameHandle=null;state.recordingFrameMode='';state.recordingFrameLastDrawAt=0;
}
function vcStopLiveRecordingNormalizer(){
  const video=state.recordingSourceVideo;
  vcCancelRecordingFrame();
  try{state.recordingStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  try{state.recordingSourceStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  try{if(video){video.pause();video.srcObject=null;video.remove()}}catch(_){}
  state.recordingCanvas=null;state.recordingCtx=null;state.recordingStream=null;
  state.recordingSourceVideo=null;state.recordingSourceStream=null;
  state.recordingLastFrameAt=0;state.recordingFrameCount=0;
  state.recordingRefreshBusy=false;
}
function vcScheduleLiveRecordingFrame(video){
  if(!state.recordingCanvas||!state.recordingCtx||!state.recordingSourceVideo)return;
  if(typeof video?.requestVideoFrameCallback==='function'){
    state.recordingFrameMode='rvfc';
    const token=state.recordingFrameGeneration;
    state.recordingFrameHandle=video.requestVideoFrameCallback(()=>{if(token===state.recordingFrameGeneration)vcDrawLiveRecordingFrame(undefined,video)});
  }else{
    state.recordingFrameMode='raf';
    const token=state.recordingFrameGeneration;
    state.recordingFrameHandle=requestAnimationFrame(ts=>{if(token===state.recordingFrameGeneration)vcDrawLiveRecordingFrame(ts,video)});
  }
}
function vcDrawLiveRecordingFrame(timestamp,expectedVideo){
  const canvas=state.recordingCanvas,ctx=state.recordingCtx,video=state.recordingSourceVideo;
  if(!canvas||!ctx||!video||(expectedVideo&&expectedVideo!==video))return;
  if(state.recordingFrameMode==='raf'&&Number.isFinite(timestamp)){
    if(state.recordingFrameLastDrawAt&&timestamp-state.recordingFrameLastDrawAt<1000/30){
      state.recordingSkippedFrames++;vcScheduleLiveRecordingFrame(video);return;
    }
    state.recordingFrameLastDrawAt=timestamp;
  }
  try{
    const sw=Number(video.videoWidth)||0,sh=Number(video.videoHeight)||0;
    if(sw&&sh&&video.readyState>=2){
      const outputOrientation=state.recordingOutputOrientation||'landscape';
      let rotation=0;
      const sourcePortrait=sh>sw;
      if(outputOrientation==='landscape'&&sourcePortrait)rotation=90;
      else if(outputOrientation==='portrait'&&!sourcePortrait)rotation=90;

      const cw=canvas.width,ch=canvas.height;
      const quarter=Math.abs(rotation)%180===90;
      const rw=quarter?sh:sw,rh=quarter?sw:sh;
      const scale=Math.max(cw/rw,ch/rh);

      ctx.save();
      try{
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle='#000';ctx.fillRect(0,0,cw,ch);
        ctx.translate(cw/2,ch/2);
        ctx.rotate(rotation*Math.PI/180);
        ctx.drawImage(video,-sw*scale/2,-sh*scale/2,sw*scale,sh*scale);
        state.recordingLastFrameAt=Date.now();
        state.recordingFrameCount++;
      }finally{
        try{ctx.restore()}catch(_){}
      }
    }
  }catch(err){
    state.recordingDrawErrors++;
    console.warn('V9.5.9 recording frame transient error',err);
  }finally{
    vcScheduleLiveRecordingFrame(state.recordingSourceVideo);
  }
}
async function vcAttachLiveRecordingSource(sourceStream){
  const hidden=vcCreateHiddenLiveVideo(sourceStream,'vc-recording-live-source');
  const oldVideo=state.recordingSourceVideo,oldStream=state.recordingSourceStream;
  vcCancelRecordingFrame();
  state.recordingSourceVideo=hidden.video;
  state.recordingSourceStream=hidden.stream;
  await hidden.video.play().catch(()=>{});
  await vcWaitForVideoDimensions(hidden.video,3000);
  state.recordingLastFrameAt=Date.now();
  try{oldStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  try{if(oldVideo){oldVideo.pause();oldVideo.srcObject=null;oldVideo.remove()}}catch(_){}
  vcDrawLiveRecordingFrame();
  return true;
}
async function vcRefreshLiveRecordingSource(sourceStream){
  if(state.recordingRefreshBusy)return false;
  state.recordingRefreshBusy=true;
  try{
    const tracks=sourceStream?.getVideoTracks?.().filter(t=>t.readyState==='live')||[];
    if(!tracks.length)return false;
    await vcAttachLiveRecordingSource(sourceStream);
    return true;
  }catch(err){
    console.warn('V9.5.9 recording source refresh',err);
    return false;
  }finally{
    state.recordingRefreshBusy=false;
  }
}
async function vcCreateLiveRecordingStream(sourceStream){
  vcStopLiveRecordingNormalizer();

  /* First attach the RAW LIVE source, then choose the output dimensions from
     the decoded video. This is the reliable cross-device equivalent of the
     native phone camera orientation. */
  const canvas=document.createElement('canvas');
  canvas.width=1280;canvas.height=720;
  const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
  if(!ctx)throw new Error('No se pudo crear la salida de grabación.');
  state.recordingCanvas=canvas;state.recordingCtx=ctx;
  state.recordingLastFrameAt=Date.now();
  state.recordingFrameCount=0;state.recordingDrawErrors=0;

  await vcAttachLiveRecordingSource(sourceStream);

  const liveVideo=state.recordingSourceVideo;
  const sw=Number(liveVideo?.videoWidth)||1280;
  const sh=Number(liveVideo?.videoHeight)||720;
  const outputOrientation=sh>sw?'portrait':'landscape';
  state.recordingOutputOrientation=outputOrientation;
  state.recordingOutputWidth=outputOrientation==='portrait'?720:1280;
  state.recordingOutputHeight=outputOrientation==='portrait'?1280:720;
  canvas.width=state.recordingOutputWidth;
  canvas.height=state.recordingOutputHeight;

  const stream=canvas.captureStream(30);
  /* Preserve audio if a future LIVE source provides it. */
  sourceStream?.getAudioTracks?.().filter(t=>t.readyState==='live').forEach(t=>{
    try{stream.addTrack(t.clone())}catch(_){}
  });
  state.recordingStream=stream;
  return stream;
}
window.VC_REMOTE_CAMERA.createLiveRecordingStream=vcCreateLiveRecordingStream;
window.VC_REMOTE_CAMERA.refreshLiveRecordingSource=vcRefreshLiveRecordingSource;
window.VC_REMOTE_CAMERA.stopLiveRecordingStream=vcStopLiveRecordingNormalizer;
window.VC_REMOTE_CAMERA.getLiveRecordingDiagnostics=()=>({
  active:!!state.recordingStream,
  source:'RAW LIVE WebRTC',
  output:`${state.recordingOutputWidth||1280}x${state.recordingOutputHeight||720}`,
  outputOrientation:state.recordingOutputOrientation||'landscape',
  independentFromDelay:true,
  lastFrameAt:state.recordingLastFrameAt||0,
  lastFrameAgeMs:state.recordingLastFrameAt?Math.max(0,Date.now()-state.recordingLastFrameAt):null,
  frameCount:state.recordingFrameCount||0,
  drawErrors:state.recordingDrawErrors||0,
  fallbackSkippedFrames:state.recordingSkippedFrames||0,
  sourceTracks:state.recordingSourceStream?.getVideoTracks?.().map(t=>({id:t.id,state:t.readyState}))||[],
  outputTracks:state.recordingStream?.getVideoTracks?.().map(t=>({id:t.id,state:t.readyState}))||[]
});


/* ---------- Fullscreen ---------- */
async function fullscreenElement(el,video){
  try{
    if(document.fullscreenElement){
      await document.exitFullscreen();
      setTimeout(()=>window.vcRemoteSetViewOrientation?.(state.viewOrientation),60);
      return;
    }
    if(el?.requestFullscreen){
      await el.requestFullscreen();
      setTimeout(vcApplyViewOrientation,80);
      return;
    }
    if(el?.webkitRequestFullscreen){
      el.webkitRequestFullscreen();
      setTimeout(vcApplyViewOrientation,80);
      return;
    }
    if(video?.webkitEnterFullscreen){
      video.webkitEnterFullscreen();
      return;
    }
    throw new Error('El navegador no ofrece pantalla completa para este elemento.');
  }catch(err){console.warn('Fullscreen',err)}
}
window.liveDelayFullscreen=function(which='live'){
  const id=which==='delay'?'live-delay-delayed':'live-delay-live';
  const v=$(id),frame=v?.closest?.('.live-delay-video-frame')||v;
  return fullscreenElement(frame,v);
};
window.vcRemoteFullscreenPreview=function(){
  const v=$('vc-remote-preview'),frame=$('vc-remote-preview-frame')||v;
  return fullscreenElement(frame,v);
};

/* ---------- Mobile publisher mode ---------- */
function publisherParams(){
  const q=new URLSearchParams(location.search);
  const streamId=q.get('vcCamera')||'',room=q.get('vcRoom')||'',key=q.get('vcKey')||'',quality=q.get('vcQuality')||'720';
  return {streamId,room,key,quality};
}
function publisherSensorOrientation(){
  try{
    const type=screen.orientation?.type||'';
    if(type.startsWith('landscape'))return 'landscape';
    if(type.startsWith('portrait'))return 'portrait';
  }catch(_){}
  return window.innerWidth>window.innerHeight?'landscape':'portrait';
}
function publisherOrientation(){
  if(state.publisherOrientationPreference==='horizontal')return 'landscape';
  if(state.publisherOrientationPreference==='vertical')return 'portrait';
  return publisherSensorOrientation();
}
function setPublisherOrientationBadge(orientation=publisherOrientation()){
  const el=$('vc-publisher-orientation');
  if(el){
    el.textContent=orientation==='landscape'?'HORIZONTAL':'VERTICAL';
    el.className=`vc-publisher-orientation ${orientation}`;
  }
}
function qualityConfig(q,orientation=publisherOrientation()){
  const hd=String(q)==='1080';
  const long=hd?1920:1280,short=hd?1080:720,fps=30,bitrate=hd?5000:2800;
  const width=orientation==='portrait'?short:long;
  const height=orientation==='portrait'?long:short;
  return {width,height,fps,bitrate,resolution:`${width}x${height}@${fps}`};
}
async function requestPublisherCamera(orientation=publisherOrientation()){
  setPublisherOrientationBadge(orientation);
  const cfg=qualityConfig(state.publisherQuality,orientation);
  return navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:{ideal:state.publisherFacing},
      width:{ideal:cfg.width},height:{ideal:cfg.height},
      aspectRatio:{ideal:cfg.width/cfg.height},
      frameRate:{ideal:cfg.fps,max:cfg.fps}
    },
    audio:false
  });
}
function publisherState(text,kind=''){
  const el=$('vc-publisher-state');if(!el)return;
  el.textContent=text;el.className=`vc-publisher-state ${kind}`;
}
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator)state.wakeLock=await navigator.wakeLock.request('screen');
  }catch(_){}
}
async function releaseWakeLock(){try{await state.wakeLock?.release?.()}catch(_){}state.wakeLock=null}
window.vcPublisherStart=async function(){
  const p=publisherParams();
  if(!p.streamId||!p.room||!p.key)return;
  if(state.publisher)return;
  try{
    publisherState('INICIANDO…','');
    await ensureVDOSDK();
    const captureOrientation=publisherOrientation();
    state.publisherStream=await requestPublisherCamera(captureOrientation);
    state.publisherOrientation=captureOrientation;
    const preview=$('vc-publisher-video');
    if(preview){
      preview.srcObject=state.publisherStream;preview.muted=true;await preview.play().catch(()=>{});
      if(!state.publisherPreviewBound){
        ['loadedmetadata','resize','playing'].forEach(ev=>preview.addEventListener(ev,vcPublisherApplyPreviewOrientation));
        state.publisherPreviewBound=true;
      }
      setTimeout(vcPublisherApplyPreviewOrientation,80);
    }
    $('vc-publisher-empty')?.classList.add('hidden');

    const cfg=qualityConfig(state.publisherQuality,state.publisherOrientation||publisherOrientation());
    const sdk=new VDONinjaSDK({salt:'vdo.ninja',password:p.key});
    state.publisher=sdk;
    await sdk.connect();
    await sdk.joinRoom({room:p.room,password:p.key});
    await sdk.publish(state.publisherStream,{
      room:p.room,streamID:p.streamId,password:p.key,label:'Volley Coach Remote Camera',
      media:{video:{codec:'VP8',maxBitrate:cfg.bitrate,resolution:cfg.resolution}}
    });
    await requestWakeLock();
    publisherState('TRANSMITIENDO','on');
    if($('vc-publisher-start'))$('vc-publisher-start').classList.add('hidden');
    if($('vc-publisher-stop'))$('vc-publisher-stop').classList.remove('hidden');
  }catch(err){
    console.error('Publisher start',err);
    publisherState('ERROR','bad');
    alert('No se ha podido iniciar la cámara.\n\n'+String(err?.message||err));
    await window.vcPublisherStop(true);
  }
};
window.vcPublisherStop=async function(silent=false){
  try{state.publisher?.stopPublishing?.()}catch(_){}
  try{await state.publisher?.disconnect?.()}catch(_){}
  state.publisher=null;
  try{state.publisherStream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
  state.publisherStream=null;
  const v=$('vc-publisher-video');if(v){try{v.pause()}catch(_){};v.srcObject=null}
  $('vc-publisher-empty')?.classList.remove('hidden');
  await releaseWakeLock();
  publisherState('DETENIDA','');
  $('vc-publisher-start')?.classList.remove('hidden');
  $('vc-publisher-stop')?.classList.add('hidden');
  if(!silent)publisherState('DETENIDA','');
};

async function vcPublisherReplaceVideoTrack(reason='orientation'){
  if(!state.publisher||!state.publisherStream||state.orientationBusy)return false;
  const targetOrientation=publisherOrientation();
  state.orientationBusy=true;
  try{
    publisherState(reason==='orientation'?'AJUSTANDO GIRO…':'CAMBIANDO CÁMARA…','');
    setPublisherOrientationBadge(targetOrientation);

    const oldTrack=state.publisherStream.getVideoTracks()[0];
    const next=await requestPublisherCamera(targetOrientation);
    const newTrack=next.getVideoTracks()[0];
    if(!newTrack)throw new Error('La cámara no ha devuelto una pista de vídeo.');

    if(typeof state.publisher.replaceTrack==='function'&&oldTrack){
      await state.publisher.replaceTrack(oldTrack,newTrack);
    }else{
      const p=publisherParams(),cfg=qualityConfig(state.publisherQuality,targetOrientation);
      try{state.publisher.stopPublishing?.()}catch(_){}
      await state.publisher.publish(new MediaStream([newTrack]),{
        room:p.room,streamID:p.streamId,password:p.key,label:'Volley Coach Remote Camera',
        media:{video:{codec:'VP8',maxBitrate:cfg.bitrate,resolution:cfg.resolution,frameRate:cfg.fps}}
      });
    }

    if(oldTrack){
      try{state.publisherStream.removeTrack(oldTrack)}catch(_){}
      try{oldTrack.stop()}catch(_){}
    }
    state.publisherStream.addTrack(newTrack);
    state.publisherOrientation=targetOrientation;

    const preview=$('vc-publisher-video');
    if(preview){
      preview.srcObject=state.publisherStream;
      preview.muted=true;
      await preview.play().catch(()=>{});
      setTimeout(vcPublisherApplyPreviewOrientation,80);
    }
    next.getTracks().filter(t=>t!==newTrack).forEach(t=>t.stop());

    const cfg=qualityConfig(state.publisherQuality,targetOrientation);
    try{
      await state.publisher.updatePublisherMedia?.({
        media:{video:{maxBitrate:cfg.bitrate,resolution:cfg.resolution,frameRate:cfg.fps}}
      });
    }catch(err){console.warn('V7.6.1 update media',err)}

    publisherState('TRANSMITIENDO','on');
    return true;
  }catch(err){
    console.error('V7.6.1 replace track',reason,err);
    publisherState('TRANSMITIENDO','on');
    if(reason!=='orientation')alert('No se ha podido cambiar la cámara.\n\n'+String(err?.message||err));
    return false;
  }finally{
    state.orientationBusy=false;
  }
}
function schedulePublisherOrientationRefresh(){
  const orientation=publisherOrientation();
  setPublisherOrientationBadge(orientation);
  setTimeout(vcPublisherApplyPreviewOrientation,0);
  if(!state.publisher||!state.publisherStream){
    state.publisherOrientation=orientation;
    return;
  }
  if(state.publisherOrientationPreference!=='auto')return;
  if(orientation===state.publisherOrientation)return;
  clearTimeout(state.orientationTimer);
  state.orientationTimer=setTimeout(async()=>{
    const fresh=publisherOrientation();
    if(fresh!==state.publisherOrientation){
      await vcPublisherReplaceVideoTrack('device-rotation');
      setTimeout(vcPublisherApplyPreviewOrientation,80);
    }
  },250);
}
window.vcPublisherRefreshOrientation=()=>vcPublisherReplaceVideoTrack('orientation');

function vcPublisherApplyPreviewOrientation(){
  const video=$('vc-publisher-video'),frame=video?.parentElement;
  if(!video||!frame)return;
  const desired=state.publisherOrientationPreference==='auto'
    ?publisherSensorOrientation()
    :publisherOrientation();
  const w=Number(video.videoWidth)||0,h=Number(video.videoHeight)||0;
  const portrait=!!(w&&h&&h>w),landscape=!!(w&&h&&w>=h);
  const rotate=(desired==='landscape'&&portrait)?90:(desired==='portrait'&&landscape)?90:0;
  frame.style.aspectRatio=desired==='landscape'?'16 / 9':'9 / 16';
  frame.dataset.orientation=desired;
  video.style.position='absolute';
  video.style.left='50%';video.style.top='50%';
  video.style.maxWidth='none';video.style.maxHeight='none';
  video.style.objectFit='cover';video.style.transformOrigin='center center';
  const fw=Math.max(1,frame.clientWidth||window.innerWidth),fh=Math.max(1,frame.clientHeight||window.innerHeight);
  if(Math.abs(rotate)===90){
    video.style.width=`${fh}px`;video.style.height=`${fw}px`;
    video.style.transform='translate(-50%,-50%) rotate(90deg)';
  }else{
    video.style.width='100%';video.style.height='100%';
    video.style.transform='translate(-50%,-50%)';
  }
}
window.vcPublisherOrientationChanged=async function(value){
  const allowed=['auto','horizontal','vertical'];
  state.publisherOrientationPreference=allowed.includes(value)?value:'auto';
  try{localStorage.setItem('volley_publisher_orientation',state.publisherOrientationPreference)}catch(_){}
  const orientation=publisherOrientation();
  setPublisherOrientationBadge(orientation);
  try{
    if(state.publisherOrientationPreference==='horizontal'){
      await screen.orientation?.lock?.('landscape').catch?.(()=>{});
    }else if(state.publisherOrientationPreference==='vertical'){
      await screen.orientation?.lock?.('portrait').catch?.(()=>{});
    }else{
      try{screen.orientation?.unlock?.()}catch(_){}
    }
  }catch(_){}
  if(state.publisher&&state.publisherStream)await vcPublisherReplaceVideoTrack('orientation');
  setTimeout(vcPublisherApplyPreviewOrientation,80);
};
window.vcPublisherSwitchCamera=async function(){
  state.publisherFacing=state.publisherFacing==='environment'?'user':'environment';
  const btn=$('vc-publisher-switch');
  if(btn)btn.textContent=state.publisherFacing==='environment'?'Usar cámara frontal':'Usar cámara trasera';
  if(!state.publisher||!state.publisherStream)return;
  await vcPublisherReplaceVideoTrack('camera');
};
window.vcPublisherQualityChanged=async function(value){
  state.publisherQuality=value==='1080'?'1080':'720';
  if(!state.publisher)return;
  try{
    const cfg=qualityConfig(state.publisherQuality,state.publisherOrientation||publisherOrientation());
    await state.publisher.updatePublisherMedia?.({media:{video:{maxBitrate:cfg.bitrate,resolution:cfg.resolution}}});
  }catch(err){console.warn('Quality update',err)}
};
window.vcPublisherFullscreen=function(){
  const overlay=$('vc-publisher-overlay'),v=$('vc-publisher-video');
  return fullscreenElement(overlay,v);
};
function initPublisherMode(){
  const p=publisherParams();
  if(!p.streamId||!p.room||!p.key)return false;
  state.publisherQuality=p.quality==='1080'?'1080':'720';
  try{
    const saved=localStorage.getItem('volley_publisher_orientation');
    if(['auto','horizontal','vertical'].includes(saved))state.publisherOrientationPreference=saved;
    else state.publisherOrientationPreference='auto';
  }catch(_){}
  document.body.classList.add('vc-remote-publisher-mode');
  const el=document.createElement('div');
  el.id='vc-publisher-overlay';el.className='vc-publisher-overlay';
  el.innerHTML=`<div class="vc-publisher-top"><div><div class="brand">VOLLEY COACH · CÁMARA REMOTA</div><small>Envía esta cámara al ordenador mediante WebRTC</small></div><div class="vc-publisher-top-status"><span id="vc-publisher-orientation" class="vc-publisher-orientation">—</span><span id="vc-publisher-state" class="vc-publisher-state">DETENIDA</span></div></div>
  <div class="vc-publisher-video"><video id="vc-publisher-video" autoplay muted playsinline></video><div id="vc-publisher-empty" class="vc-publisher-empty">Pulsa “Iniciar transmisión” y permite el acceso a la cámara.<br>Para menor latencia, mantén esta página visible.</div></div>
  <div class="vc-publisher-bottom">
    <label>Calidad<select id="vc-publisher-quality" onchange="vcPublisherQualityChanged(this.value)"><option value="720">720p · 30 fps</option><option value="1080">1080p · 30 fps</option></select></label>
    <label>Orientación<select id="vc-publisher-orientation-select" onchange="vcPublisherOrientationChanged(this.value)"><option value="auto">Automática · como la cámara del móvil</option><option value="horizontal">Forzar horizontal 16:9</option><option value="vertical">Forzar vertical 9:16</option></select></label>
    <div class="vc-publisher-buttons">
      <button id="vc-publisher-start" class="start" type="button" onclick="vcPublisherStart()">Iniciar transmisión</button>
      <button id="vc-publisher-stop" class="stop hidden" type="button" onclick="vcPublisherStop()">Detener</button>
      <button id="vc-publisher-switch" type="button" onclick="vcPublisherSwitchCamera()">Usar cámara frontal</button>
      <button type="button" onclick="vcPublisherFullscreen()">⛶ Pantalla completa</button>
    </div>
    <div class="vc-publisher-note">Puedes girar el móvil mientras transmites. Volley Coach detecta vertical/horizontal y renueva automáticamente la pista WebRTC. No cierres ni bloquees esta pestaña durante el partido.</div>
  </div>`;
  document.body.appendChild(el);
  $('vc-publisher-quality').value=state.publisherQuality;
  if($('vc-publisher-orientation-select'))$('vc-publisher-orientation-select').value=state.publisherOrientationPreference;
  setPublisherOrientationBadge(publisherOrientation());
  state.publisherOrientation=publisherOrientation();
  return true;
}

/* Restore preferred source on desktop. */
function initDesktop(){
  let source='local';
  try{source=localStorage.getItem('volley_live_delay_source')||'local'}catch(_){}
  const sel=$('live-delay-source');if(sel){sel.value=source==='remote'?'remote':'local';vcRemoteSourceChanged(sel.value)}
}
function boot(){
  if(initPublisherMode())return;
  initDesktop();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

document.addEventListener('visibilitychange',async()=>{
  if(document.visibilityState==='visible'&&state.publisher&&!state.wakeLock)await requestWakeLock();
});
try{screen.orientation?.addEventListener?.('change',schedulePublisherOrientationRefresh)}catch(_){}
window.addEventListener('orientationchange',schedulePublisherOrientationRefresh);
window.addEventListener('resize',()=>{
  clearTimeout(state.orientationTimer);
  state.orientationTimer=setTimeout(schedulePublisherOrientationRefresh,250);
});
window.addEventListener('beforeunload',()=>{
  try{window.vcStopDelayNormalizer?.()}catch(_){}
  try{state.sdk?.disconnect?.()}catch(_){}
  try{state.publisher?.disconnect?.()}catch(_){}
});

/* Keyboard fullscreen inside Live Delay: F = delayed view, Shift+F = live. */
document.addEventListener('keydown',e=>{
  const modal=$('live-delay-modal');
  const scoutingDock=$('scout-v740-dock');
  const visible=modal?.classList.contains('open')||(scoutingDock&&!scoutingDock.classList.contains('hidden'));
  if(!visible)return;
  const tag=String(e.target?.tagName||'').toLowerCase();if(['input','select','textarea'].includes(tag))return;
  if(e.key.toLowerCase()==='f'){e.preventDefault();liveDelayFullscreen(e.shiftKey?'live':'delay')}
});

window.vcRemoteCameraDiagnostics=function(){
  return {
    version:VERSION,
    orientation:publisherOrientation(),
    publisherTrackOrientation:state.publisherOrientation,
    publisherMode:!!publisherParams().streamId,
    source:state.source,
    pcViewOrientation:state.viewOrientation,
    delayOrientationFix:state.delayOrientationFix,
    delayNormalizerActive:!!state.delayStream,
    delayFrameDrawn:state.delayDrawnFrames,
    delayFallbackFramesSkipped:state.delaySkippedFrames,
    recordingFallbackFramesSkipped:state.recordingSkippedFrames,
    remoteConnected:state.connected,
    room:state.room||null,
    streamId:state.streamId||null,
    sdkLoaded:!!window.VDONinjaSDK,
    qrLoaded:!!window.QRCode,
    fullscreen:!!document.fullscreenEnabled,
    remoteTracks:state.stream?.getVideoTracks?.().map(t=>({id:t.id,state:t.readyState}))||[]
  };
};
})();
