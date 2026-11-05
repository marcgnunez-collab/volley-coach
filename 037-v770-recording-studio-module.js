
(()=>{
'use strict';

const VERSION='16.0.6.3';
const DB_NAME='VolleyCoachRecordingsV770';
const DB_VERSION=1;
const $=id=>document.getElementById(id);

const state={
  active:false,
  paused:false,
  recorder:null,
  stream:null,
  mode:'disk',
  mime:'',
  extension:'webm',
  sessionId:null,
  filename:'',
  startedAt:0,
  pausedAt:0,
  pausedMs:0,
  bytes:0,
  chunkIndex:0,
  writer:null,
  fileHandle:null,
  writeQueue:Promise.resolve(),
  timer:null,
  markers:[],
  lastMarkerSignature:null,
  lastMarkerContainer:null,
  lastSet:null,
  lastDownloadUrl:null,
  lastGalleryFile:null,
  lastGalleryName:'',
  blockCounter:0,
  sourceLabelAtStart:'',
  sourceKind:'',
  writeError:null,
  recorderError:null,
  healthTimer:null,
  healthRecovering:false,
  sourceFailureSince:0,
  wakeLock:null,
  durableBytes:0, durableChunks:0, pendingWrites:0, lastDurableAt:0, checkPointAt:0
};

function nowIso(){return new Date().toISOString()}
function makeId(){return `rec_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
function fmtTime(ms){
  ms=Math.max(0,Number(ms)||0);
  const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`;
}
function fmtBytes(bytes){
  bytes=Number(bytes)||0;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(0)} KB`;
  if(bytes<1024*1024*1024)return `${(bytes/1024/1024).toFixed(1)} MB`;
  return `${(bytes/1024/1024/1024).toFixed(2)} GB`;
}
function safeName(v){
  return String(v||'Volley_Coach')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_')
    .replace(/^_+|_+$/g,'').slice(0,90)||'Volley_Coach';
}
function recordingElapsed(){
  if(!state.startedAt)return 0;
  const end=state.paused?state.pausedAt:Date.now();
  return Math.max(0,end-state.startedAt-state.pausedMs);
}
function setState(text,kind=''){
  const el=$('vc-recording-state');if(!el)return;
  el.textContent=text;el.className=`vc-recording-state ${kind}`;
}
function sourceLabel(){
  if(state.active&&state.sourceLabelAtStart)return state.sourceLabelAtStart;
  const source=$('live-delay-source')?.value||'local';
  return source==='remote'?'LIVE móvil directo':'LIVE cámara local';
}
function getSourceStream(){
  const selected=$('live-delay-source')?.value||'local';
  const direct=$('live-delay-live')?.srcObject;
  const remote=window.VC_REMOTE_CAMERA?.getStream?.();

  /* IMPORTANT: this function never reads live-delay-delayed.
     Recording always originates from the raw LIVE receiver/camera. */
  if(selected==='remote'){
    // Do not silently switch REC to the laptop camera when the remote camera drops.
    if(remote?.getVideoTracks?.().some(t=>t.readyState==='live'))return remote;
    return null;
  }
  // Do not silently switch REC to the remote camera when local mode is selected.
  return direct?.getVideoTracks?.().some(t=>t.readyState==='live')?direct:null;
}
function cloneSource(stream){
  const tracks=stream?.getTracks?.().filter(t=>t.readyState==='live')||[];
  return new MediaStream(tracks.map(t=>t.clone()));
}
function chooseMime(preferMp4=false){
  if(typeof MediaRecorder==='undefined')return '';
  const mp4=[
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4'
  ];
  const webm=[
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  const candidates=preferMp4?[...mp4,...webm]:[...webm,...mp4];
  return candidates.find(x=>{try{return MediaRecorder.isTypeSupported?.(x)}catch(_){return false}})||'';
}
function extForMime(mime){return String(mime).startsWith('video/mp4')?'mp4':'webm'}
function currentMatch(){
  try{return window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}
}
function currentSetNo(){
  try{
    const m=currentMatch();
    return Number(window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)?.number)||null;
  }catch(_){return null}
}
function defaultName(){
  const m=currentMatch();
  if(m)return `${m.date||new Date().toISOString().slice(0,10)}_${m.opponent||'Partido'}`;
  return `Entrenamiento_${new Date().toISOString().slice(0,10)}`;
}
function updateUI(){
  const elapsed=recordingElapsed();
  if($('vc-recording-time'))$('vc-recording-time').textContent=fmtTime(elapsed);
  if($('vc-recording-size'))$('vc-recording-size').textContent=fmtBytes(state.bytes);
  if($('vc-recording-source'))$('vc-recording-source').textContent=state.active?sourceLabel():'—';
  if($('vc-recording-marker-count'))$('vc-recording-marker-count').textContent=String(state.markers.length);
  if($('vc-recording-status-note')){
    $('vc-recording-status-note').textContent=state.active
      ? (state.paused?'Grabación pausada':`REC desde ${state.sourceLabelAtStart||'LIVE directo'} · ${state.mode==='disk'?'archivo directo':'fragmentos recuperables'}`)
      : 'Cámara preparada · REC siempre toma LIVE, nunca Delay';
  }
  $('vc-recording-start')?.classList.toggle('hidden',state.active);
  $('vc-recording-pause')?.classList.toggle('hidden',!state.active);
  $('vc-recording-stop')?.classList.toggle('hidden',!state.active);
  if($('vc-recording-pause'))$('vc-recording-pause').textContent=state.paused?'Reanudar':'Pausar';

  const box=$('vc-recording-markers');
  if(box){
    const signature=state.markers.map(m=>`${m.label}\u001f${m.ms}`).join('\u001e');
    if(box!==state.lastMarkerContainer||signature!==state.lastMarkerSignature){
      box.innerHTML=state.markers.map(m=>`<span class="vc-recording-marker"><b>${m.label}</b> ${fmtTime(m.ms)}</span>`).join('');
      state.lastMarkerContainer=box;
      state.lastMarkerSignature=signature;
    }
  }
}
function startTimer(){
  clearInterval(state.timer);
  state.timer=setInterval(()=>{
    // Recording and set markers continue even when the modal is closed.
    // Rebuilding the marker DOM twice a second outside Recording Studio is wasted work.
    if(document.visibilityState==='visible'&&$('live-delay-modal')?.classList.contains('open'))updateUI();
    if(state.active&&$('vc-recording-auto-set')?.checked){
      const setNo=currentSetNo();
      if(setNo&&setNo!==state.lastSet){
        state.lastSet=setNo;
        addMarkerInternal(`Set ${setNo}`,true);
      }
    }
  },500);
}
function stopTimer(){clearInterval(state.timer);state.timer=null}

/* ---------- IndexedDB ---------- */
function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'});
      if(!db.objectStoreNames.contains('chunks')){
        const st=db.createObjectStore('chunks',{keyPath:'key'});
        st.createIndex('sessionId','sessionId',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbPutSession(patch){
  const db=await openDB();
  const existing=await new Promise((resolve,reject)=>{
    const tx=db.transaction('sessions','readonly'),r=tx.objectStore('sessions').get(patch.id);
    r.onsuccess=()=>resolve(r.result||{});r.onerror=()=>reject(r.error);
  });
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('sessions','readwrite');
    tx.objectStore('sessions').put({...existing,...patch});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  db.close();
}
async function dbPutChunk(sessionId,index,blob){
  const db=await openDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction('chunks','readwrite');
    tx.objectStore('chunks').put({key:`${sessionId}:${String(index).padStart(8,'0')}`,sessionId,index,blob,size:blob.size});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  db.close();
}
async function dbChunks(sessionId){
  const db=await openDB();
  const out=await new Promise((resolve,reject)=>{
    const tx=db.transaction('chunks','readonly'),idx=tx.objectStore('chunks').index('sessionId'),r=idx.getAll(sessionId);
    r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
  });
  db.close();
  return out.sort((a,b)=>a.index-b.index);
}
async function dbSessions(){
  const db=await openDB();
  const out=await new Promise((resolve,reject)=>{
    const tx=db.transaction('sessions','readonly'),r=tx.objectStore('sessions').getAll();
    r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
  });
  db.close();
  return out.sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||'')));
}
async function dbDeleteSession(id){
  const db=await openDB();
  const chunks=await new Promise((resolve,reject)=>{
    const tx=db.transaction('chunks','readonly'),idx=tx.objectStore('chunks').index('sessionId'),r=idx.getAllKeys(id);
    r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
  });
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(['sessions','chunks'],'readwrite');
    tx.objectStore('sessions').delete(id);
    const cs=tx.objectStore('chunks');chunks.forEach(k=>cs.delete(k));
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });
  db.close();
}

/* ---------- Recording ---------- */
async function chooseDiskFile(filename,mime){
  if(typeof window.showSaveFilePicker!=='function')return null;
  const ext=extForMime(mime);
  return window.showSaveFilePicker({
    suggestedName:`${filename}.${ext}`,
    types:[{description:ext==='mp4'?'Vídeo MP4':'Vídeo WebM',accept:{[ext==='mp4'?'video/mp4':'video/webm']:[`.${ext}`]}}]
  });
}
function cleanupLastUrl(){
  if(state.lastDownloadUrl){try{URL.revokeObjectURL(state.lastDownloadUrl)}catch(_){}state.lastDownloadUrl=null}
}
function offerDownload(blob,filename,autoSave=true){
  cleanupLastUrl();
  const url=URL.createObjectURL(blob);state.lastDownloadUrl=url;
  const a=$('vc-recording-download');
  if(a){
    a.href=url;a.download=filename;a.textContent='Descargar última grabación';a.classList.remove('hidden');
  }
  let triggered=false;
  if(autoSave){
    try{
      const auto=document.createElement('a');
      auto.href=url;auto.download=filename;auto.style.display='none';
      document.body.appendChild(auto);auto.click();auto.remove();
      triggered=true;
    }catch(_){}
  }
  return {url,triggered};
}
function metadataPayload(session){
  return {
    version:VERSION,
    id:session.id,
    filename:session.filename,
    startedAt:session.startedAt,
    endedAt:session.endedAt||nowIso(),
    durationMs:session.durationMs,
    bytes:session.bytes,
    mime:session.mime,
    source:session.source,
    mode:session.mode,
    markers:session.markers||[],
    match:session.match||null
  };
}
function downloadJSON(obj,name){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function writeChunk(blob){
  state.bytes+=blob.size;
  const idx=state.chunkIndex++;
  state.pendingWrites=(state.pendingWrites||0)+1;
  const task=async()=>{
    try{
      if(state.mode==='disk'&&state.writer)await state.writer.write(blob);
      else await dbPutChunk(state.sessionId,idx,blob);
      state.durableBytes=(state.durableBytes||0)+blob.size;
      state.durableChunks=(state.durableChunks||0)+1;
      state.lastDurableAt=Date.now();
      // A lightweight, durable recovery checkpoint every ten chunks.
      // On unexpected shutdown, already committed IDB fragments still survive.
      if(state.durableChunks%10===0){
        await dbPutSession({id:state.sessionId,bytes:state.durableBytes,
          chunkCount:state.durableChunks,durationMs:recordingElapsed(),
          checkpointAt:nowIso(),completed:false});
      }
    }finally{state.pendingWrites=Math.max(0,(state.pendingWrites||0)-1)}
  };
  /* Always continue from the previous task, even if it failed, so one failed
     write does not permanently poison every later chunk in the promise chain. */
  state.writeQueue=state.writeQueue
    .catch(()=>{})
    .then(task)
    .catch(err=>{
      if(!state.writeError)state.writeError=err;
      console.error('V9.5.9 chunk write',err);
      setState('ERROR DE GUARDADO','bad');
    });
  updateUI();
}
function addMarkerInternal(label,automatic=false){
  if(!state.active)return null;
  const marker={label:String(label||`Bloque ${++state.blockCounter}`),ms:recordingElapsed(),at:nowIso(),automatic:!!automatic};
  state.markers.push(marker);
  dbPutSession({id:state.sessionId,markers:state.markers}).catch(()=>{});
  updateUI();return marker;
}
window.vcRecordingAddMarker=function(label){
  if(!state.active){alert('Inicia primero la grabación.');return}
  if(!label){
    const setNo=currentSetNo();
    label=setNo?`Set ${setNo}`:`Bloque ${++state.blockCounter}`;
  }
  addMarkerInternal(label,false);
};

function autosaveEnabled(){
  const el=$('vc-recording-autosave');
  return el?!!el.checked:true;
}
function saveAutosavePreference(){
  try{localStorage.setItem('vc-recording-autosave',autosaveEnabled()?'1':'0')}catch(_){}
}
function restoreAutosavePreference(){
  try{
    const raw=localStorage.getItem('vc-recording-autosave');
    if(raw!==null&&$('vc-recording-autosave'))$('vc-recording-autosave').checked=raw!=='0';
  }catch(_){}
}
window.vcRecordingAutoSaveChanged=function(){
  saveAutosavePreference();
  const last=$('vc-recording-last');
  if(last&&!state.active){
    last.classList.remove('v871-saved','v871-warn');
    last.textContent=autosaveEnabled()?'Guardado automático activado':'Guardado automático desactivado';
  }
};

function galleryShareSupported(file=null){
  if(typeof navigator.share!=='function')return false;
  if(!file)return true;
  try{return typeof navigator.canShare!=='function'||navigator.canShare({files:[file]})}catch(_){return false}
}
async function shareGalleryFile(file,filename,quiet=false){
  if(!file)return false;
  if(!galleryShareSupported(file)){
    if(!quiet)alert('Este navegador no permite enviar directamente el vídeo a Fotos/Galería. Se dejará disponible como archivo de vídeo.');
    return false;
  }
  try{
    await navigator.share({files:[file],title:filename,text:'Grabación de Volley Coach'});
    return true;
  }catch(err){
    if(err?.name==='AbortError')return false;
    console.warn('V8.7.2 gallery share',err);
    if(!quiet)alert('El sistema no ha permitido abrir Fotos/Galería automáticamente. Usa de nuevo “Guardar en Fotos / Galería”.');
    return false;
  }
}
window.vcRecordingSaveToGallery=async function(){
  const file=state.lastGalleryFile;
  if(!file){
    alert('No hay una grabación preparada para guardar en Fotos/Galería.');
    return false;
  }
  return shareGalleryFile(file,state.lastGalleryName||file.name,false);
};

window.vcRecordingStorageChanged=function(){
  const sel=$('vc-recording-storage');
  if(!sel)return;
  if(sel.value==='disk'&&typeof window.showSaveFilePicker!=='function'){
    if(galleryShareSupported()){
      sel.value='gallery';
      alert('Este dispositivo no permite grabar directamente a un archivo desde la web. Se usará Fotos/Galería.');
    }else{
      sel.value='browser';
      alert('Este dispositivo no permite acceso directo a archivos ni a Fotos/Galería desde la web. Se usará el modo recuperable.');
    }
  }
  if(sel.value==='gallery'&&!galleryShareSupported()){
    sel.value='browser';
    alert('Este navegador no permite abrir Fotos/Galería con un vídeo. Se usará el modo recuperable.');
  }
};

async function requestRecordingWakeLock(){
  try{
    if('wakeLock'in navigator&&!state.wakeLock)state.wakeLock=await navigator.wakeLock.request('screen');
  }catch(err){console.warn('V9.5.9 recording wake lock',err)}
}
async function releaseRecordingWakeLock(){
  try{await state.wakeLock?.release?.()}catch(_){}
  state.wakeLock=null;
}
function stopRecordingHealth(){
  clearInterval(state.healthTimer);state.healthTimer=null;
  state.healthRecovering=false;state.sourceFailureSince=0;
}
async function recoverRemoteRecordingSource(){
  if(state.healthRecovering||state.sourceKind!=='remote'||!state.active)return false;
  state.healthRecovering=true;
  try{
    const raw=window.VC_REMOTE_CAMERA?.getStream?.();
    const tracks=raw?.getVideoTracks?.().filter(t=>t.readyState==='live')||[];
    if(!tracks.length)return false;
    const ok=await window.VC_REMOTE_CAMERA?.refreshLiveRecordingSource?.(raw);
    if(ok){
      state.sourceFailureSince=0;
      setState('● REC','rec');
      const note=$('vc-recording-status-note');
      if(note)note.textContent='Señal LIVE recuperada · REC continúa en el mismo archivo';
      return true;
    }
    return false;
  }catch(err){
    console.warn('V9.5.9 source recovery',err);return false;
  }finally{state.healthRecovering=false}
}
function startRecordingHealth(){
  stopRecordingHealth();
  state.healthTimer=setInterval(async()=>{
    if(!state.active)return;
    const rec=state.recorder;
    if(rec&&rec.state==='inactive'&&!state.recorderError){
      state.recorderError=new Error('MediaRecorder se ha detenido inesperadamente.');
    }

    if(state.sourceKind==='remote'){
      const d=window.VC_REMOTE_CAMERA?.getLiveRecordingDiagnostics?.()||{};
      const age=Number(d.lastFrameAgeMs);
      if(Number.isFinite(age)&&age>3500){
        if(!state.sourceFailureSince)state.sourceFailureSince=Date.now();
        setState('REC · RECUPERANDO LIVE','pause');
        if(age>4000)await recoverRemoteRecordingSource();
        const failedFor=Date.now()-state.sourceFailureSince;
        if(failedFor>10000&&state.active){
          const note=$('vc-recording-status-note');
          if(note)note.textContent='Se perdió la señal LIVE. Cerrando la grabación para evitar vídeo congelado.';
          state.recorderError=state.recorderError||new Error('Señal LIVE sin fotogramas durante más de 10 segundos.');
          setTimeout(()=>window.vcRecordingStop(false),0);
        }
      }else{
        state.sourceFailureSince=0;
      }
    }

    if(state.active&&state.mode!=='disk'&&navigator.storage?.estimate&&
       Date.now()-(state.storageLastCheckAt||0)>30000){
      state.storageLastCheckAt=Date.now();
      try{
        const info=await navigator.storage.estimate();
        const free=Number(info.quota)-Number(info.usage||0);
        if(Number.isFinite(free)&&free>0&&free<64*1024*1024){
          state.writeError=state.writeError||new Error('Espacio del navegador inferior a 64 MB.');
          setState('ESPACIO AGOTÁNDOSE','bad');
        }
      }catch(_){}
    }
    if((state.writeError||state.recorderError)&&state.active&&!state.stopping){
      const note=$('vc-recording-status-note');
      if(note)note.textContent=state.writeError
        ?'Error al guardar un fragmento. Cerrando REC para conservar lo ya escrito.'
        :'La captura terminó inesperadamente. Cerrando REC para conservar los fragmentos disponibles.';
      // Finalization marks the session incomplete on recorder or storage error.
      // Preserve all already committed IDB chunks for recovery.
      state.stopping=true;
      setTimeout(()=>{state.stopping=false;window.vcRecordingStop(false)},0);
    }
  },2000);
}

async function storagePreflight(mode){
  if(mode==='disk'||!navigator.storage?.estimate)return true;
  try{
    const info=await navigator.storage.estimate();
    const free=Number(info.quota)-Number(info.usage||0);
    if(!Number.isFinite(free)||free<=0)return true;
    // Bitrate REC elegido + margen de metadatos; estimación, no garantía.
    const recBitrate=Number($('vc-rec34-bitrate')?.value)||3500000;
    const minutes=Math.floor(free/(recBitrate/8*1.15)/60);
    if(free<150*1024*1024){
      alert('Espacio estimado inferior a 150 MB: no es seguro iniciar la grabación recuperable. Selecciona archivo directo o libera espacio.');
      return false;
    }
    if(minutes<60){
      return confirm(`Almacenamiento disponible estimado: ${minutes} minutos al bitrate actual. Para un partido largo se recomienda grabar directamente a archivo. ¿Quieres iniciar REC recuperable igualmente?`);
    }
    try{await navigator.storage.persist?.()}catch(_){}
  }catch(err){console.warn('V16.0 storage estimate',err)}
  return true;
}
window.vcRecordingStart=async function(){
  if(state.active||state.starting)return;
  state.starting=true;
  try{
  const source=getSourceStream();
  if(!source){alert('Primero inicia la cámara o conecta el móvil y activa Live Delay.');return}
  if(typeof MediaRecorder==='undefined'){alert('Este navegador no dispone de MediaRecorder.');return}

  let mode=$('vc-recording-storage')?.value||'disk';
  if(mode==='disk'&&typeof window.showSaveFilePicker!=='function'){
    mode=galleryShareSupported()?'gallery':'browser';
    if($('vc-recording-storage'))$('vc-recording-storage').value=mode;
  }
  if(mode==='gallery'&&!galleryShareSupported())mode='browser';

  if(!(await storagePreflight(mode)))return;
  const mime=chooseMime(mode==='disk'||mode==='gallery');
  if(!mime){alert('No se ha encontrado un formato de vídeo compatible para grabar.');return}

  const base=safeName($('vc-recording-name')?.value||defaultName());
  const filename=`${base}_${new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)}`;
  let handle=null,writer=null;

  try{
    if(mode==='disk'){
      handle=await chooseDiskFile(filename,mime);
      if(!handle)return; // User cancelled picker.
      writer=await handle.createWritable();
    }

    const selectedSource=$('live-delay-source')?.value||'local';
    let recStream=null;
    if(selectedSource==='remote'&&typeof window.VC_REMOTE_CAMERA?.createLiveRecordingStream==='function'){
      recStream=await window.VC_REMOTE_CAMERA.createLiveRecordingStream(source);
    }else{
      recStream=cloneSource(source);
    }
    const videoTracks=recStream?.getVideoTracks?.()||[];
    if(!videoTracks.length)throw new Error('No hay ninguna pista LIVE de vídeo activa.');

    const sessionId=makeId(),m=currentMatch();
    Object.assign(state,{
      active:true,paused:false,recorder:null,stream:recStream,mode,mime,extension:extForMime(mime),
      sessionId,filename,startedAt:Date.now(),pausedAt:0,pausedMs:0,bytes:0,chunkIndex:0,
      writer,fileHandle:handle,writeQueue:Promise.resolve(),markers:[],lastSet:currentSetNo(),blockCounter:0,
      sourceKind:selectedSource,sourceLabelAtStart:selectedSource==='remote'
        ?`LIVE móvil directo · ${window.VC_REMOTE_CAMERA?.getLiveRecordingDiagnostics?.()?.outputOrientation==='portrait'?'vertical 9:16':'horizontal 16:9'} · independiente del Delay`
        :'LIVE cámara local · independiente del Delay',
      writeError:null,recorderError:null,healthRecovering:false,sourceFailureSince:0,stopping:false,storageLastCheckAt:0,
      durableBytes:0,durableChunks:0,pendingWrites:0,lastDurableAt:0,checkPointAt:0
    });

    const initialSession={
      id:sessionId,filename,startedAt:nowIso(),endedAt:null,durationMs:0,bytes:0,mime,mode,
      source:sourceLabel(),completed:false,markers:[],requestedBitrate:Number($('vc-rec34-bitrate')?.value)||3500000,
      match:m?{id:m.id,date:m.date,opponent:m.opponent}:null
    };
    if(handle){
      try{await dbPutSession({...initialSession,fileHandle:handle})}
      catch(err){
        console.warn('V7.8 · el navegador no permite persistir FileSystemHandle; se guardan solo metadatos.',err);
        await dbPutSession(initialSession);
      }
    }else{
      await dbPutSession(initialSession);
    }

    const recBitrate=Math.max(1200000,Math.min(4000000,Number($('vc-rec34-bitrate')?.value)||3500000));
    state.recBitrate=recBitrate;
    const opts={mimeType:mime,videoBitsPerSecond:recBitrate};
    const recorder=new MediaRecorder(recStream,opts);
    state.recorder=recorder;
    // A local REC uses cloned tracks and can outlive a Delay restart. If the
    // recording track itself ends, finalize the durable chunks explicitly.
    for(const track of videoTracks)track.addEventListener?.('ended',()=>{
      if(!state.active||state.stopping||state.recorder!==recorder)return;
      state.recorderError=state.recorderError||new Error('La pista de vídeo de REC terminó inesperadamente.');
      setState('SEÑAL REC PERDIDA','bad');
      void window.vcRecordingStop(false);
    },{once:true});

    recorder.addEventListener('dataavailable',e=>{
      if(e.data?.size)writeChunk(e.data).catch(err=>{
        console.error('V7.7 write chunk',err);
        setState('ERROR','bad');
      });
    });
    recorder.addEventListener('error',e=>{
      console.error('V9.5.9 recorder',e);
      state.recorderError=e?.error||new Error('MediaRecorder ha informado de un error.');
      setState('ERROR DE GRABACIÓN','bad');
      setTimeout(()=>{if(state.active)window.vcRecordingStop(false)},0);
    });
    recorder.addEventListener('start',()=>setState('● REC','rec'),{once:true});
    recorder.start(1000);
    await requestRecordingWakeLock();
    startRecordingHealth();

    cleanupLastUrl();
    state.lastGalleryFile=null;state.lastGalleryName='';
    $('vc-recording-download')?.classList.add('hidden');
    $('vc-recording-gallery-save')?.classList.add('hidden');
    if($('vc-recording-name'))$('vc-recording-name').value=base;
    setState('● REC','rec');
    if(state.lastSet)addMarkerInternal(`Set ${state.lastSet}`,true);
    else addMarkerInternal('Inicio',true);
    startTimer();updateUI();
  }catch(err){
    console.error('V7.7 start',err);
    try{await writer?.abort?.()}catch(_){}
    try{state.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
    try{window.VC_REMOTE_CAMERA?.stopLiveRecordingStream?.()}catch(_){}
    stopRecordingHealth();await releaseRecordingWakeLock();
    Object.assign(state,{active:false,recorder:null,stream:null,writer:null,fileHandle:null,sourceKind:'',sourceLabelAtStart:'',writeError:null,recorderError:null});
    setState('ERROR','bad');
    alert('No se ha podido iniciar la grabación.\n\n'+String(err?.message||err));
  }
  }finally{state.starting=false;}
};

window.vcRecordingTogglePause=function(){
  if(!state.active||!state.recorder)return;
  try{
    if(state.paused){
      state.pausedMs+=Date.now()-state.pausedAt;state.pausedAt=0;state.paused=false;
      state.recorder.resume();setState('● REC','rec');
      addMarkerInternal('Reanudación',true);
    }else{
      state.paused=true;state.pausedAt=Date.now();state.recorder.pause();setState('PAUSA','pause');
      addMarkerInternal('Pausa',true);
    }
    updateUI();
  }catch(err){console.error('V7.7 pause',err)}
};

async function finalizeSession(){
  await state.writeQueue;
  const endedAt=nowIso(),durationMs=recordingElapsed();
  const m=currentMatch();
  const baseSession={
    id:state.sessionId,filename:state.filename,startedAt:new Date(state.startedAt).toISOString(),
    endedAt,durationMs,bytes:state.bytes,mime:state.mime,mode:state.mode,source:sourceLabel(),
    markers:state.markers,completed:false,match:m?{id:m.id,date:m.date,opponent:m.opponent}:null,
    error:state.writeError?String(state.writeError?.message||state.writeError):state.recorderError?String(state.recorderError?.message||state.recorderError):null
  };
  /* Persist an incomplete state first. It becomes completed only after the
     output file/blob has actually been closed/prepared successfully. */
  await dbPutSession(baseSession);

  const autoSave=autosaveEnabled();
  let finalBytes=state.bytes;
  if(state.mode==='disk'&&state.writer){
    await state.writer.close();
    state.writer=null;
    const last=$('vc-recording-last');
    if(last){
      last.classList.remove('v871-warn');last.classList.add('v871-saved');
      last.textContent=`✓ Vídeo guardado como archivo normal · ${state.filename}.${state.extension} · ${fmtTime(durationMs)} · ${fmtBytes(state.bytes)}`;
    }
  }else{
    const chunks=await dbChunks(state.sessionId);
    if(!chunks.length)throw new Error('La grabación no contiene fragmentos recuperables.');
    const blob=new Blob(chunks.map(x=>x.blob),{type:state.mime||'video/webm'});
    finalBytes=blob.size;
    const fullName=`${state.filename}.${state.extension}`;

    if(state.mode==='gallery'){
      const file=new File([blob],fullName,{type:state.mime||blob.type||'video/webm',lastModified:Date.now()});
      state.lastGalleryFile=file;
      state.lastGalleryName=fullName;

      cleanupLastUrl();
      const url=URL.createObjectURL(blob);state.lastDownloadUrl=url;
      const a=$('vc-recording-download');
      if(a){a.href=url;a.download=fullName;a.textContent='Guardar archivo de vídeo';a.classList.remove('hidden')}
      $('vc-recording-gallery-save')?.classList.remove('hidden');

      let shared=false;
      if(autoSave)shared=await shareGalleryFile(file,fullName,true);
      const last=$('vc-recording-last');
      if(last){
        last.classList.remove('v871-saved','v871-warn');
        last.classList.add(shared?'v871-saved':'v871-warn');
        last.textContent=shared
          ?`✓ Vídeo enviado al guardado nativo de Fotos/Galería · ${fullName}`
          :`Vídeo preparado · pulsa “Guardar en Fotos / Galería” para añadirlo a la fototeca.`;
      }
    }else{
      const provisional={...baseSession,bytes:finalBytes};
      const dl=offerDownload(blob,fullName,autoSave);
      if(autoSave)downloadJSON(metadataPayload(provisional),`${state.filename}_marcadores.json`);
      const last=$('vc-recording-last');
      if(last){
        last.classList.remove('v871-saved','v871-warn');
        last.classList.add(autoSave&&dl.triggered?'v871-saved':'v871-warn');
        last.textContent=autoSave&&dl.triggered
          ?`✓ Archivo de vídeo preparado/guardado · ${fullName} · ${fmtTime(durationMs)} · ${fmtBytes(blob.size)}`
          :`Vídeo preparado · usa “Guardar archivo de vídeo” · ${fmtTime(durationMs)} · ${fmtBytes(blob.size)}`;
      }
    }
  }

  if(state.writeError)throw new Error('Se produjo un error al escribir uno o más fragmentos. El vídeo puede estar incompleto.');
  if(state.recorderError)throw new Error('MediaRecorder informó de un error durante la grabación.');

  const session={...baseSession,bytes:finalBytes,completed:true,error:null};
  await dbPutSession(session);
  return session;
}
window.vcRecordingStop=async function(silent=false){
  if(!state.active||state.stopping)return null;
  state.stopping=true;
  stopTimer();
  setState('GUARDANDO','pause');

  const recorder=state.recorder;
  const stopped=recorder&&recorder.state!=='inactive'
    ?new Promise(resolve=>recorder.addEventListener('stop',resolve,{once:true}))
    :Promise.resolve();

  try{
    if(recorder&&recorder.state!=='inactive'){
      try{if(recorder.state==='recording')recorder.requestData?.()}catch(_){}
      recorder.stop();
    }
    await stopped;
    const session=await finalizeSession();
    setState('GUARDADO','done');
    if(!silent){
      if(state.mode==='disk')alert(`Grabación guardada como vídeo normal del dispositivo.\n\n${state.filename}.${state.extension}`);
      else if(state.mode==='gallery'){
        if(state.lastGalleryFile)alert('Grabación finalizada. Si el sistema no la ha añadido todavía a Fotos/Galería, pulsa “Guardar en Fotos / Galería”.');
      }else if(autosaveEnabled())alert(`Grabación finalizada. Se ha preparado el archivo de vídeo.\n\n${state.filename}.${state.extension}`);
      else alert('Grabación finalizada. Puedes guardarla con “Guardar archivo de vídeo”.');
    }
    return session;
  }catch(err){
    console.error('V7.7 finalize',err);
    setState('ERROR','bad');
    if(!silent)alert('La grabación se ha detenido, pero ha ocurrido un error al finalizarla.\nPuedes intentar recuperarla desde “Recuperar grabaciones”.\n\n'+String(err?.message||err));
    return null;
  }finally{
    stopRecordingHealth();
    await releaseRecordingWakeLock();
    try{state.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
    try{window.VC_REMOTE_CAMERA?.stopLiveRecordingStream?.()}catch(_){}
    Object.assign(state,{active:false,paused:false,stopping:false,recorder:null,stream:null,writer:null,fileHandle:null,pausedAt:0,sourceKind:'',sourceLabelAtStart:'',writeError:null,recorderError:null,healthRecovering:false,sourceFailureSince:0});
    updateUI();
  }
};

/* ---------- Recovery ---------- */
window.vcRecordingRecover=async function(){
  try{
    const sessions=await dbSessions();
    const browserSessions=sessions.filter(s=>s.mode==='browser'||s.mode==='gallery');
    let modal=document.getElementById('vc-rec-recovery');
    if(modal)modal.remove();
    modal=document.createElement('div');modal.id='vc-rec-recovery';modal.className='vc-rec-recovery';
    const rows=browserSessions.map(s=>`<div class="vc-rec-recovery-row">
      <div><strong>${String(s.filename||s.id)}</strong><small>${String(s.startedAt||'')} · ${fmtTime(s.durationMs||0)} · ${fmtBytes(s.bytes||0)} · ${s.completed?'finalizada':'interrumpida / recuperable'}</small></div>
      <div><button class="primary" onclick="vcRecordingExportRecovered('${s.id}')">Descargar</button><button class="danger" onclick="vcRecordingDeleteRecovered('${s.id}')">Eliminar</button></div>
    </div>`).join('');
    modal.innerHTML=`<div class="vc-rec-recovery-card"><h3>Grabaciones recuperables</h3><p style="font-size:9px;color:#71818d">Fragmentos guardados en este navegador. Puedes descargar o eliminar cada sesión.</p><div class="vc-rec-recovery-list">${rows||'<div class="vc-recording-help">No hay grabaciones guardadas en el navegador.</div>'}</div><div style="margin-top:10px;text-align:right"><button class="ghost" id="vc-rec-recovery-close">Cerrar</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
    document.body.appendChild(modal);
    $('vc-rec-recovery-close')?.addEventListener('click',()=>modal.remove());
  }catch(err){alert('No se han podido leer las grabaciones recuperables.\n\n'+String(err?.message||err))}
};
window.vcRecordingExportRecovered=async function(id){
  try{
    const sessions=await dbSessions(),s=sessions.find(x=>x.id===id);
    if(!s)throw new Error('No se encuentra la sesión.');
    const chunks=await dbChunks(id);
    if(!chunks.length)throw new Error('No hay fragmentos guardados.');
    const blob=new Blob(chunks.map(x=>x.blob),{type:s.mime||'video/webm'});
    offerDownload(blob,`${s.filename}.${extForMime(s.mime)}`);
    downloadJSON(metadataPayload({...s,bytes:blob.size}),`${s.filename}_marcadores.json`);
  }catch(err){alert('No se ha podido recuperar la grabación.\n\n'+String(err?.message||err))}
};
window.vcRecordingDeleteRecovered=async function(id){
  if(!confirm('¿Eliminar definitivamente esta grabación recuperable del navegador?'))return;
  await dbDeleteSession(id);window.vcRecordingRecover();
};

/* ---------- Integration / safeguards ---------- */
/* REC clones the LIVE track (or uses its own normalised mobile stream) and is
   independent of Live Delay for both local and remote modes. Never wrap
   stopLiveDelay to terminate a valid recording. Stop REC only explicitly or
   when its own recording track/durable storage has failed. */

window.addEventListener('beforeunload',e=>{
  if(!state.active)return;
  e.preventDefault();e.returnValue='';
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&state.active&&!state.wakeLock)void requestRecordingWakeLock();
});

window.vcRecordingDiagnostics=function(){
  return {
    version:VERSION,sessionId:state.sessionId,
    active:state.active,paused:state.paused,mode:state.mode,mime:state.mime,recordingBitrate:state.recBitrate||3500000,
    bytes:state.bytes,durableBytes:state.durableBytes||0,durableChunks:state.durableChunks||0,
    pendingWrites:state.pendingWrites||0,lastDurableAt:state.lastDurableAt||null,
    elapsedMs:recordingElapsed(),markers:state.markers,
    diskDirectSupported:typeof window.showSaveFilePicker==='function',
    indexedDB:typeof indexedDB!=='undefined',
    sourceKind:state.sourceKind,
    sourceLabel:sourceLabel(),
    recordsFromLive:true,
    independentFromDelay:true,
    mediaRecorder:typeof MediaRecorder!=='undefined',
    sourceAvailable:!!getSourceStream(),
    autoSave:autosaveEnabled(),
    autoSaveMode:state.mode==='disk'?'device-file':state.mode==='gallery'?'system-gallery':'browser-file',
    galleryShareSupported:galleryShareSupported(state.lastGalleryFile),
    writeError:state.writeError?String(state.writeError?.message||state.writeError):null,
    recorderError:state.recorderError?String(state.recorderError?.message||state.recorderError):null,
    healthActive:!!state.healthTimer,
    stopping:!!state.stopping,
    sourceFailureSince:state.sourceFailureSince||0,
    liveFrames:window.VC_REMOTE_CAMERA?.getLiveRecordingDiagnostics?.()||null
  };
};

(async()=>{
  restoreAutosavePreference();
  if($('vc-recording-name')&&!$('vc-recording-name').value)$('vc-recording-name').value=defaultName();
  const storage=$('vc-recording-storage');
  if(storage&&typeof window.showSaveFilePicker!=='function')storage.value=galleryShareSupported()?'gallery':'browser';
  updateUI();
  try{
    const sessions=await dbSessions();
    const interrupted=sessions.filter(s=>(s.mode==='browser'||s.mode==='gallery')&&!s.completed);
    if(interrupted.length&&$('vc-recording-last'))$('vc-recording-last').textContent=`${interrupted.length} grabación(es) recuperable(s)`;
  }catch(_){}
})();
})();
