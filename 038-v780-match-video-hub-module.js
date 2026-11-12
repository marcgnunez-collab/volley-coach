
(()=>{
'use strict';

const VERSION='16.0.6.3';
const REC_DB='VolleyCoachRecordingsV770';
const REC_DB_VERSION=1;
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const skillNames={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const state={
  objectUrl:null,file:null,fileMatchId:null,selectedKey:'',kind:'all',
  stopAt:null,playlist:[],playlistIndex:-1,playlistName:'',
  lastRows:[],loadedRecording:null,rotation:0,tv:false,
  mediaType:'local',youtubePlayer:null,youtubeId:null,youtubeUrl:'',
  youtubeReady:false,youtubeApiPromise:null,youtubeTicker:null,
  playheadCache:null,playingRowKey:null,playingRowNode:null
};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return Number(bridge()?.getActiveId?.())||0}catch(_){return 0}}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function save(){try{bridge()?.save?.()}catch(err){console.error('V7.8 save',err)}}
function playerLabel(a){try{return bridge()?.playerLabel?.(a)||fallbackPlayer(a)}catch(_){return fallbackPlayer(a)}}
function fallbackPlayer(a){return String(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||'Jugador')}
function currentMatch(){const id=Number($('v780-match')?.value)||activeId();return matches().find(m=>Number(m.id)===id)||null}
function video(){return $('v780-player-video')}

function youtubeWrap(){return $('v782-youtube-wrap')}
/* V12.5 removed unreachable function: youtubeElement */
function isYouTube(){return state.mediaType==='youtube'}
function mediaLoaded(){
  const m=currentMatch();
  if(!m||Number(state.fileMatchId)!==Number(m.id))return false;
  if(isYouTube())return !!state.youtubeReady&&!!state.youtubeId&&!!state.youtubePlayer;
  return !!video()?.src;
}
function mediaCurrentTime(){
  if(isYouTube()){
    try{return Number(state.youtubePlayer?.getCurrentTime?.())||0}catch(_){return 0}
  }
  return Number(video()?.currentTime)||0;
}
function mediaDuration(){
  if(isYouTube()){
    try{return Number(state.youtubePlayer?.getDuration?.())||0}catch(_){return 0}
  }
  return Number(video()?.duration)||0;
}
function mediaSeek(seconds){
  const target=Math.max(0,Math.min(mediaDuration()>0?mediaDuration():1e9,Number(seconds)||0));
  if(isYouTube()){
    try{state.youtubePlayer?.seekTo?.(target,true)}catch(_){}
  }else if(video()?.src){
    try{video().currentTime=target}catch(_){}
  }
}
function mediaPlay(){
  if(isYouTube()){
    try{state.youtubePlayer?.playVideo?.()}catch(_){}
  }else{
    video()?.play?.().catch?.(()=>{});
  }
}
function mediaPause(){
  if(isYouTube()){
    try{state.youtubePlayer?.pauseVideo?.()}catch(_){}
  }else{
    try{video()?.pause?.()}catch(_){}
  }
}
function mediaIsPaused(){
  if(isYouTube()){
    try{return state.youtubePlayer?.getPlayerState?.()!==window.YT?.PlayerState?.PLAYING}catch(_){return true}
  }
  return video()?.paused!==false;
}
function mediaSetSpeed(rate){
  const r=Math.max(.25,Math.min(2,Number(rate)||1));
  if(isYouTube()){
    try{
      const available=state.youtubePlayer?.getAvailablePlaybackRates?.()||[];
      const chosen=available.length?available.reduce((best,x)=>Math.abs(x-r)<Math.abs(best-r)?x:best,available[0]):r;
      state.youtubePlayer?.setPlaybackRate?.(chosen);
      if($('v780-speed'))$('v780-speed').value=String(chosen);
    }catch(_){}
  }else if(video()){
    video().playbackRate=r;
  }
}
function showMediaLayer(type){
  state.mediaType=type==='youtube'?'youtube':'local';
  const v=video(),yw=youtubeWrap(),empty=$('v780-video-empty');
  if(v)v.classList.toggle('hidden',isYouTube());
  yw?.classList.toggle('hidden',!isYouTube());
  if(mediaLoaded())empty?.classList.add('hidden');
}
function parseYouTubeId(value){
  const raw=String(value||'').trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;
  try{
    const u=new URL(raw);
    const host=u.hostname.replace(/^www\./,'').toLowerCase();
    if(host==='youtu.be'){
      const id=u.pathname.split('/').filter(Boolean)[0]||'';
      return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
    }
    if(host.endsWith('youtube.com')||host.endsWith('youtube-nocookie.com')){
      let id=u.searchParams.get('v')||'';
      if(!id){
        const parts=u.pathname.split('/').filter(Boolean);
        const i=parts.findIndex(x=>['embed','shorts','live','v'].includes(x));
        if(i>=0)id=parts[i+1]||'';
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
    }
  }catch(_){}
  return null;
}
function ensureYouTubeAPI(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(state.youtubeApiPromise)return state.youtubeApiPromise;
  state.youtubeApiPromise=new Promise((resolve,reject)=>{
    const old=window.onYouTubeIframeAPIReady;
    let done=false;
    const finish=()=>{
      if(done)return;
      if(window.YT?.Player){done=true;resolve(window.YT)}
    };
    window.onYouTubeIframeAPIReady=function(){
      try{if(typeof old==='function')old()}catch(err){console.warn(err)}
      finish();
    };
    let script=[...document.scripts].find(s=>/youtube\.com\/iframe_api/.test(s.src||''));
    if(!script){
      script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      script.async=true;
      script.onerror=()=>{if(!done){done=true;reject(new Error('No se ha podido cargar la API de YouTube.'))}};
      document.head.appendChild(script);
    }
    const started=Date.now();
    const poll=setInterval(()=>{
      if(done){clearInterval(poll);return}
      if(window.YT?.Player){clearInterval(poll);finish();return}
      if(Date.now()-started>12000){clearInterval(poll);done=true;reject(new Error('Tiempo de espera agotado cargando YouTube.'))}
    },120);
  });
  return state.youtubeApiPromise;
}
function resetYouTubeContainer(){
  const wrap=youtubeWrap();if(!wrap)return;
  wrap.innerHTML='<div id="v782-youtube-player"></div>';
}
function destroyYouTube(){
  clearInterval(state.youtubeTicker);state.youtubeTicker=null;
  if(state.youtubePlayer){
    try{state.youtubePlayer.stopVideo?.()}catch(_){}
    try{state.youtubePlayer.destroy?.()}catch(_){}
  }
  state.youtubePlayer=null;state.youtubeReady=false;state.youtubeId=null;state.youtubeUrl='';
  resetYouTubeContainer();
  youtubeWrap()?.classList.add('hidden');
  const empty=$('v780-video-empty');
  if(empty){empty.classList.remove('hidden');empty.innerHTML='<b>Sin vídeo cargado</b><span>Abre un archivo, una grabación o pega un enlace de YouTube.</span>'}
}
function youtubeErrorText(code){
  const map={
    2:'El enlace o ID de YouTube no es válido.',
    5:'YouTube no puede reproducir este vídeo en HTML5.',
    100:'El vídeo no existe, es privado o ha sido eliminado.',
    101:'El propietario no permite reproducir este vídeo fuera de YouTube.',
    150:'El propietario no permite reproducir este vídeo fuera de YouTube.'
  };
  return map[Number(code)]||`YouTube ha devuelto el error ${code}.`;
}
function mediaTick(){
  updatePlayhead();
  const now=mediaCurrentTime();
  if(state.stopAt!=null&&now>=state.stopAt-.08){
    mediaPause();state.stopAt=null;
    if(state.playlist.length)setTimeout(nextPlaylist,250);
  }
  const playing=!mediaIsPaused()?String(state.selectedKey||''):'';
  const valid=state.playingRowNode?.isConnected;
  if(playing===state.playingRowKey&&(!playing||valid))return;
  if(valid)state.playingRowNode.classList.remove('playing');
  state.playingRowKey=playing;state.playingRowNode=null;
  if(playing){
    const nodes=document.querySelectorAll('#v780-timeline .v780-row');
    for(const el of nodes){if(el.dataset.key===playing){el.classList.add('playing');state.playingRowNode=el;break;}}
  }
}
async function loadYouTubeById(id,url=''){
  const m=currentMatch();if(!m)throw new Error('Selecciona primero un partido.');
  releaseVideo();
  state.mediaType='youtube';
  activateSource(m,`youtube:${id}`,null);
  state.fileMatchId=Number(m.id);
  state.youtubeId=id;
  state.youtubeUrl=url||`https://www.youtube.com/watch?v=${id}`;
  const x=meta(m);
  x.source=`YouTube · ${id}`;x.youtubeId=id;x.youtubeUrl=state.youtubeUrl;x.mimeType='youtube';x.fileSize=0;
  showMediaLayer('youtube');
  $('v780-video-empty')?.classList.remove('hidden');
  $('v780-video-empty').innerHTML='<b>Cargando YouTube…</b><span>Preparando reproductor integrado.</span>';
  await ensureYouTubeAPI();
  resetYouTubeContainer();
  state.youtubePlayer=new YT.Player('v782-youtube-player',{
    width:'100%',height:'100%',videoId:id,
    playerVars:{playsinline:1,controls:1,rel:0},
    events:{
      onReady:e=>{
        state.youtubeReady=true;
        try{x.duration=Number(e.target.getDuration())||null}catch(_){}
        $('v780-video-empty')?.classList.add('hidden');
        showMediaLayer('youtube');
        save();renderAll();
        clearInterval(state.youtubeTicker);
        state.youtubeTicker=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('scout-video-hub')?.classList.contains('active')&&isYouTube()&&state.youtubeReady)mediaTick()},500);
      },
      onStateChange:e=>{
        if(e.data===YT.PlayerState.ENDED){
          state.stopAt=null;
          if(state.playlist.length)setTimeout(nextPlaylist,250);
        }
        mediaTick();
      },
      onError:e=>{
        const message=youtubeErrorText(e.data);
        state.youtubeReady=false;
        $('v780-video-empty')?.classList.remove('hidden');
        $('v780-video-empty').innerHTML=`<b>No se puede reproducir este vídeo</b><span>${esc(message)}</span>`;
        renderStatus();
      }
    }
  });
  save();renderAll();
}
window.v782OpenYouTubeDialog=function(){
  document.getElementById('v782-youtube-modal')?.remove();
  const modal=document.createElement('div');modal.id='v782-youtube-modal';modal.className='v782-youtube-modal';
  const saved=meta(currentMatch())?.youtubeUrl||'';
  modal.innerHTML=`<div class="v782-youtube-card">
    <span class="pro-kicker">V7.8.2 · YOUTUBE</span>
    <h3>Abrir vídeo de YouTube</h3>
    <p>Pega el enlace del partido. Después podrás sincronizarlo y usar rallies, rotaciones, jugadores y playlists igual que con un vídeo local.</p>
    <div class="v782-youtube-input-row">
      <input id="v782-youtube-url" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=..." value="${esc(saved)}">
      <button class="primary" id="v782-youtube-open">Abrir</button>
    </div>
    <div id="v782-youtube-error" class="v782-youtube-error"></div>
    <div class="v782-youtube-examples">Compatible con youtube.com/watch, youtu.be, Shorts, /embed/ y /live/. El vídeo debe permitir reproducción incrustada.</div>
    <div class="v782-youtube-actions"><button class="ghost" id="v782-youtube-close">Cancelar</button></div>
  </div>`;
  document.body.appendChild(modal);
  const input=$('v782-youtube-url');setTimeout(()=>input?.focus(),30);
  const open=async()=>{
    const id=parseYouTubeId(input?.value);
    const err=$('v782-youtube-error');
    if(!id){err.textContent='No reconozco ese enlace de YouTube.';err.classList.add('show');return}
    err.classList.remove('show');
    try{modal.remove();await loadYouTubeById(id,input.value.trim())}
    catch(e){alert('No se ha podido abrir YouTube.\n\n'+String(e?.message||e))}
  };
  $('v782-youtube-open').onclick=open;
  $('v782-youtube-close').onclick=()=>modal.remove();
  input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();open()}});
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
};
window.v782LoadYouTube=function(value){
  const id=parseYouTubeId(value);
  if(!id){alert('No reconozco ese enlace de YouTube.');return false}
  loadYouTubeById(id,String(value||'').trim()).catch(e=>alert(String(e?.message||e)));
  return true;
};

function fmt(sec){
  if(sec==null||!Number.isFinite(Number(sec)))return '—';
  sec=Math.max(0,Number(sec));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`:`${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function meta(m){
  if(!m)return null;
  const r=m.video&&typeof m.video==='object'?m.video:{};
  m.video={...r,syncOffset:r.syncOffset==null?null:Number(r.syncOffset),source:String(r.source||''),duration:r.duration==null?null:Number(r.duration),preRoll:Math.max(0,Number(r.preRoll??2)),postRoll:Math.max(0,Number(r.postRoll??2)),syncedAt:r.syncedAt||null,anchor:r.anchor||null,clips:arr(r.clips)};
  return m.video;
}
function sourceKeyForFile(blob,name){return `file:${String(name||'').slice(0,150)}:${Number(blob?.size)||0}:${Number(blob?.lastModified)||0}`}
function activateSource(m,key,defaultOffset=null){
  const x=meta(m);if(!x)return false;
  const sources=x.sourceAlignments&&typeof x.sourceAlignments==='object'?x.sourceAlignments:{};
  x.sourceAlignments=sources;
  if(x.sourceKey&&x.sourceKey!==key&&x.syncOffset!=null&&Number.isFinite(Number(x.syncOffset))){
    sources[x.sourceKey]={offset:Number(x.syncOffset),anchor:x.anchor||null};
  }
  x.sourceKey=key;
  const saved=sources[key];
  x.syncOffset=saved&&Number.isFinite(Number(saved.offset))?Number(saved.offset):defaultOffset;
  x.anchor=saved?.anchor||null;
  x.syncedAt=x.syncOffset==null?null:new Date().toISOString();
  return !!saved;
}
function rememberSource(m){const x=meta(m);if(x?.sourceKey&&x.syncOffset!=null)x.sourceAlignments[x.sourceKey]={offset:Number(x.syncOffset),anchor:x.anchor||null}}
function recordingCorrection(m){
 const rec=state.loadedRecording,x=meta(m);if(!rec||!x)return 0;
 const start=Date.parse(rec.startedAt||''),matchStart=Date.parse(m?.clockStartedAt||m?.createdAt||'');
 if(!Number.isFinite(start)||!Number.isFinite(matchStart))return 0;
 return Number(x.syncOffset)-(matchStart-start)/1000;
}
function anchorOffset(m,scoutMs,videoTime){
 if(!state.loadedRecording)return Number(videoTime)-Number(scoutMs)/1000;
 const rec=state.loadedRecording,t=window.VC_VIDEO_TIMELINE_1923?.mediaTime?.(m,scoutMs,rec,0);
 const begin=Date.parse(rec.startedAt||''),scout=Date.parse(m?.clockStartedAt||m?.createdAt||'');
 if(t==null||!Number.isFinite(begin)||!Number.isFinite(scout))return null;
 return (scout-begin)/1000+Number(videoTime)-t;
}
function rallyStartMs(r){const a=arr(r?.actions);return a.length?(Number(a[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0)}
function rallyEndMs(r){const a=arr(r?.actions);return a.length?(Number(a[a.length-1].scoutMs)||Number(r?.scoutEndMs)||rallyStartMs(r)):(Number(r?.scoutEndMs)||rallyStartMs(r))}
function mapped(m,ms){
 const x=meta(m);if(!m||x?.syncOffset==null||ms==null||ms==='')return null;
 if(state.loadedRecording){
   return window.VC_VIDEO_TIMELINE_1923?.mediaTime?.(m,ms,state.loadedRecording,recordingCorrection(m))??null;
 }
 const result=Number(ms)/1000+Number(x.syncOffset);
 return Number.isFinite(result)&&result>=0?result:null;
}
function applyMap(m){
  const x=meta(m);if(!m||x.syncOffset==null)return;
  // REC maps from the original scout clock and its pause windows on demand.
  // Do not persist derived videoAction on each action: it becomes stale when
  // another recording is opened, and would produce false video markers.
  if(state.loadedRecording)return;
  arr(m.sets).forEach(s=>arr(s.rallies).forEach(r=>{
    r.videoStart=mapped(m,rallyStartMs(r));r.videoEnd=mapped(m,rallyEndMs(r));
    arr(r.actions).forEach(a=>{
      a.videoAction=a.videoTime!=null?Number(a.videoTime):mapped(m,a.scoutMs);
      a.videoStart=a.videoAction==null?null:Math.max(0,a.videoAction-x.preRoll);
      a.videoEnd=a.videoAction==null?null:a.videoAction+x.postRoll;
    });
  }));
}
function releaseVideo(){
  clearInterval(state.youtubeTicker);state.youtubeTicker=null;
  if(state.objectUrl){try{URL.revokeObjectURL(state.objectUrl)}catch(_){}state.objectUrl=null}
  state.file=null;state.fileMatchId=null;state.loadedRecording=null;state.stopAt=null;
  const v=video();if(v){try{v.pause()}catch(_){}v.removeAttribute('src');try{v.load()}catch(_){}}
  if(state.youtubePlayer||state.youtubeId)destroyYouTube();
  state.mediaType='local';
  v?.classList.remove('hidden');
  youtubeWrap()?.classList.add('hidden');
}
function loadBlob(blob,name='',recording=null){
  const m=currentMatch();if(!m)throw new Error('Selecciona primero un partido.');
  releaseVideo();
  state.objectUrl=URL.createObjectURL(blob);
  state.fileMatchId=Number(m.id);
  state.loadedRecording=recording||null;
  const baseOffset=recording&&Number.isFinite(Date.parse(recording.startedAt||''))&&Number.isFinite(Date.parse(m.clockStartedAt||m.createdAt||''))
    ?(Date.parse(m.clockStartedAt||m.createdAt)-Date.parse(recording.startedAt))/1000:null;
  const wasAligned=activateSource(m,recording?`recording:${recording.id}`:sourceKeyForFile(blob,name),baseOffset);
  state.mediaType='local';
  const v=video();v.classList.remove('hidden');youtubeWrap()?.classList.add('hidden');v.src=state.objectUrl;v.load();
  const x=meta(m);x.source=name||recording?.filename||'Vídeo';
  x.fileSize=blob.size||0;x.mimeType=blob.type||'';
  v.onloadedmetadata=()=>{
    x.duration=Number.isFinite(v.duration)?v.duration:null;
    $('v780-video-empty')?.classList.add('hidden');
    if(recording&&!wasAligned)autoSyncRecording(recording,m);
    save();renderAll();
  };
  v.onerror=()=>alert('No se ha podido reproducir este vídeo.');
  save();renderAll();
}
function autoSyncRecording(rec,m){
  if(!rec||!m)return false;
  const recStart=Date.parse(rec.startedAt||'');
  const scoutStart=Date.parse(m.clockStartedAt||m.createdAt||'');
  if(!Number.isFinite(recStart)||!Number.isFinite(scoutStart))return false;
  const x=meta(m);
  x.syncOffset=(scoutStart-recStart)/1000;
  x.syncedAt=new Date().toISOString();
  x.anchor={type:'recording-auto',recordingId:rec.id,scoutStart:m.clockStartedAt||m.createdAt,recordingStart:rec.startedAt};
  rememberSource(m);applyMap(m);save();return true;
}
function timeline(m){
  const out=[];
  arr(m?.sets).forEach(s=>arr(s.rallies).forEach((r,ri)=>{
    const score=`${r.scoreAfter?.us??0}–${r.scoreAfter?.opponent??0}`;
    out.push({
      key:`r:${s.number}:${r.id}`,type:'rally',ms:rallyStartMs(r),endMs:rallyEndMs(r),set:Number(s.number)||1,
      team:r.winner==='opponent'?'opponent':'ours',ownRotation:Number(r.rotationBefore)||1,opponentRotation:Number(r.opponentRotationBefore)||1,
      servingBefore:r.servingBefore==='opponent'?'opponent':'ours',winner:r.winner==='opponent'?'opponent':'ours',score,
      label:`Set ${s.number} · Rally ${ri+1} · ${score}`,
      copy:`R${r.rotationBefore||1} · ${r.servingBefore==='opponent'?'K1 / side-out':'K2 / break'} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${arr(r.actions).length} acciones`,r
    });
    arr(r.actions).forEach(a=>out.push({
      key:`a:${s.number}:${r.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(s.number)||1,
      team:a.team==='opponent'?'opponent':'ours',ownRotation:Number(r.rotationBefore)||1,opponentRotation:Number(r.opponentRotationBefore)||1,
      servingBefore:r.servingBefore==='opponent'?'opponent':'ours',winner:r.winner==='opponent'?'opponent':'ours',score,
      skill:a.skill||'',evaluation:a.evaluation||'',player:playerLabel(a),
      label:String(a.code||skillNames[a.skill]||'Acción'),copy:`${skillNames[a.skill]||a.skill||'Acción'} · ${playerLabel(a)} · ${a.evaluation||'!'} · R${r.rotationBefore||1}`,a,r
    }));
  }));
  const live=m?.liveRally,cs=arr(m?.sets).find(x=>Number(x.number)===Number(m?.currentSet));
  if(live&&arr(live.actions).length){
    const score=`${Number(cs?.scoreUs)||0}–${Number(cs?.scoreOpponent)||0}`;
    arr(live.actions).forEach(a=>out.push({
      key:`a:${m.currentSet}:${live.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(m.currentSet)||1,live:true,
      team:a.team==='opponent'?'opponent':'ours',ownRotation:Number(m.rotationNo)||1,opponentRotation:Number(m.opponentRotationNo)||1,
      servingBefore:m.servingTeam==='opponent'?'opponent':'ours',winner:'',score,skill:a.skill||'',evaluation:a.evaluation||'',player:playerLabel(a),
      label:String(a.code||skillNames[a.skill]||'Acción'),copy:`Rally en curso · ${skillNames[a.skill]||a.skill||'Acción'} · ${playerLabel(a)} · ${a.evaluation||'!'} · R${m.rotationNo||1}`,a,r:live
    }));
  }
  return out.sort((a,b)=>a.ms-b.ms);
}
function actionVideoTime(a,m=currentMatch()){
  // The original liveVideoTime belongs to the temporary Delay buffer, not REC.
  // Only the selected source's alignment is valid for stored-video playback.
  return a?.scoutMs!=null?mapped(m,a.scoutMs):null;
}
function rowRange(row,m=currentMatch()){
  if(!row||!m)return null;
  const actionPre=8,actionPost=5,x=meta(m),rallyPre=Math.max(0,Number(x?.preRoll??2)),rallyPost=Math.max(0,Number(x?.postRoll??2));
  if(row.type==='action'){
    const center=actionVideoTime(row.a,m);
    if(center==null)return null;
    return {start:Math.max(0,center-actionPre),end:center+actionPost,center,exact:row.a?.videoExact!==false&&row.a?.videoTimestamp!=null};
  }
  if(row.type==='rally'){
    const direct=arr(row.r?.actions).map(a=>actionVideoTime(a,m)).filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number);
    if(direct.length)return {start:Math.max(0,Math.min(...direct)-rallyPre),end:Math.max(...direct)+rallyPost,center:direct[0],exact:true};
    if(x?.syncOffset==null)return null;
    const st=mapped(m,row.ms),en=mapped(m,row.endMs);if(st==null||en==null)return null;
    return {start:Math.max(0,st-rallyPre),end:en+rallyPost,center:st,exact:false};
  }
  return null;
}
function filteredRows(){
  const m=currentMatch();if(!m)return [];
  const set=Number($('v780-set')?.value)||0,team=$('v780-team')?.value||'',skill=$('v780-skill')?.value||'',player=$('v780-player')?.value||'',rotation=Number($('v781-rotation')?.value)||state.rotation||0,q=String($('v780-search')?.value||'').trim().toLowerCase();
  return timeline(m).filter(r=>{
    if(state.kind!=='all'&&r.type!==state.kind)return false;
    if(set&&Number(r.set)!==set)return false;
    if(team&&r.team!==team)return false;
    if(skill&&(r.type!=='action'||r.skill!==skill))return false;
    if(player&&(r.type!=='action'||r.player!==player))return false;
    if(rotation&&Number(r.ownRotation)!==rotation)return false;
    if(q&&!`${r.label} ${r.copy} ${r.player||''} ${r.evaluation||''}`.toLowerCase().includes(q))return false;
    return true;
  });
}
function findRow(key){return timeline(currentMatch()).find(x=>x.key===key)||null}
function selectedRow(){return findRow(state.selectedKey)}
function playRow(row){
  const m=currentMatch();if(!row||!m)return;
  if(!mediaLoaded()){alert('Carga primero el vídeo de este partido.');return}
  const range=rowRange(row,m);
  if(!range){alert('Sincroniza primero el vídeo.');return}
  const duration=mediaDuration();
  const end=duration>0?Math.min(range.end,duration):range.end;
  mediaSeek(Math.max(0,range.start));state.stopAt=end;state.selectedKey=row.key;
  mediaPlay();renderTimeline();renderSelection();
}
function nearestPlayheadRow(m,scoutMs){
  // Timeline creation sorts every rally/action. Cache briefly for video ticks,
  // refresh on any explicit UI render, and refresh periodically for edits elsewhere.
  const now=Date.now(),id=String(m?.id??''),stamp=String(m?.updatedAt??'');
  let c=state.playheadCache;
  if(!c||c.id!==id||c.stamp!==stamp||now-c.at>1500){
    c={id,stamp,at:now,rows:timeline(m)};
    state.playheadCache=c;
  }
  const rows=c.rows;
  if(!rows.length)return null;
  let lo=0,hi=rows.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(rows[mid].ms<scoutMs)lo=mid+1;else hi=mid;}
  if(lo<=0)return rows[0];
  if(lo>=rows.length)return rows[rows.length-1];
  return Math.abs(rows[lo].ms-scoutMs)<Math.abs(rows[lo-1].ms-scoutMs)?rows[lo]:rows[lo-1];
}
function updatePlayhead(){
  const head=$('v780-ruler-playhead'),duration=mediaDuration(),current=mediaCurrentTime();
  if(head&&duration>0)head.style.left=`${Math.max(0,Math.min(100,current/duration*100))}%`;
  const m=currentMatch();
  if(m&&meta(m)?.syncOffset!=null&&mediaLoaded()){
    const scoutMs=state.loadedRecording
      ?window.VC_VIDEO_TIMELINE_1923?.scoutMsAtMediaTime?.(m,current,state.loadedRecording,recordingCorrection(m))
      :(current-Number(meta(m).syncOffset))*1000;
    const closest=scoutMs==null?null:nearestPlayheadRow(m,scoutMs);
    const ov=$('v780-now-overlay');
    if(ov&&closest&&Math.abs(closest.ms-scoutMs)<5000){
      const html=`<b>${esc(closest.type==='rally'?'RALLY':closest.label)}</b> · ${esc(closest.copy)}`;
      ov.classList.remove('hidden');
      if(ov.innerHTML!==html)ov.innerHTML=html;
    }else ov?.classList.add('hidden');
  }
}
function renderRuler(){
  const box=$('v780-ruler'),m=currentMatch(),duration=mediaDuration();if(!box)return;
  [...box.querySelectorAll('.v780-ruler-marker')].forEach(x=>x.remove());
  if(!m||duration<=0){if($('v780-ruler-copy'))$('v780-ruler-copy').textContent='Carga el vídeo para ver las marcas del scouting.';return}
  const rows=timeline(m);let visible=0,exact=0;
  rows.forEach(r=>{
    let t=null;
    if(r.type==='action')t=actionVideoTime(r.a,m);
    else {const range=rowRange(r,m);t=range?.center??null}
    if(t==null||t<0||t>duration)return;visible++;if(r.type==='action'&&r.a?.videoTimestamp!=null)exact++;
    const mk=document.createElement('i');mk.className=`v780-ruler-marker ${r.type==='action'?'action':''} ${r.team||''} ${r.skill?`skill-${r.skill}`:''}`;
    mk.style.left=`${Math.max(0,Math.min(100,t/duration*100))}%`;mk.title=`${r.label} · ${fmt(t)}${r.type==='action'?' · '+(skillNames[r.skill]||r.skill||'Acción'):''}`;
    mk.onclick=e=>{e.stopPropagation();state.selectedKey=r.key;playRow(r)};box.appendChild(mk);
  });
  if($('v780-ruler-copy'))$('v780-ruler-copy').textContent=`${visible} marcas · ${exact} timestamps exactos · duración ${fmt(duration)}`;
}
function populateMatches(){
  const sel=$('v780-match');if(!sel)return;
  const list=matches().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.id)-Number(a.id));
  const previous=Number(sel.value)||activeId()||Number(list[0]?.id)||0;
  sel.innerHTML=list.length?list.map(m=>`<option value="${m.id}">${esc(m.date||'')} · ${esc(teamName())} vs ${esc(m.opponent||'Rival')}</option>`).join(''):'<option value="">Sin scoutings</option>';
  if(previous&&list.some(m=>Number(m.id)===previous))sel.value=String(previous);
}
function populateFilters(){
  const m=currentMatch(),setSel=$('v780-set'),playerSel=$('v780-player');if(!m)return;
  const prevSet=setSel?.value||'',prevPlayer=playerSel?.value||'';
  const sets=arr(m.sets).map(s=>Number(s.number)).filter(Boolean);
  if(setSel){setSel.innerHTML='<option value="">Todos</option>'+sets.map(n=>`<option value="${n}">Set ${n}</option>`).join('');if(sets.includes(Number(prevSet)))setSel.value=prevSet}
  const players=[...new Set(timeline(m).filter(r=>r.type==='action').map(r=>r.player).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  if(playerSel){playerSel.innerHTML='<option value="">Todos</option>'+players.map(p=>`<option>${esc(p)}</option>`).join('');if(players.includes(prevPlayer))playerSel.value=prevPlayer}
}
function renderStatus(){
  const m=currentMatch(),x=meta(m);
  const loaded=mediaLoaded();
  $('v780-video-state').textContent=loaded?(isYouTube()?'YouTube':'Cargado'):'Sin vídeo';
  $('v780-video-source').textContent=loaded?(x?.source||state.file?.name||'Vídeo'):(x?.source?`${x.source} · volver a cargar`:'Selecciona archivo, grabación o YouTube');
  $('v780-sync-state').textContent=x?.syncOffset==null?'Pendiente':'Sincronizado';
  $('v780-sync-copy').textContent=x?.syncOffset==null?'—':`${x.syncOffset>=0?'+':''}${Number(x.syncOffset).toFixed(2)} s`;
  $('v780-sync-title').textContent=x?.syncOffset==null?'Vídeo todavía no sincronizado':`Sincronizado · offset ${x.syncOffset>=0?'+':''}${Number(x.syncOffset).toFixed(2)} s`;
}
function renderSelection(){
  const row=selectedRow(),t=$('v780-selected-title'),c=$('v780-selected-copy');
  if(!row){if(t)t.textContent='Ningún elemento';if(c)c.textContent='Selecciona un rally o una acción de la lista.';return}
  if(t)t.textContent=row.label;
  if(c)c.innerHTML=`${esc(row.copy)}<br><b>Scout:</b> ${fmt(row.ms/1000)}${row.type==='action'?` · <b>${esc(skillNames[row.skill]||row.skill||'')}</b> ${esc(row.evaluation||'')}`:''}`;
}
function presetRows(type){
  const rows=timeline(currentMatch());
  if(type==='points')return rows.filter(r=>r.type==='rally'&&r.team==='ours');
  if(type==='errors')return rows.filter(r=>r.type==='action'&&r.team==='ours'&&(r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/')));
  if(type==='kills')return rows.filter(r=>r.type==='action'&&r.team==='ours'&&r.skill==='A'&&r.evaluation==='#');
  if(type==='recepbad')return rows.filter(r=>r.type==='action'&&r.team==='ours'&&r.skill==='R'&&['-','/','='].includes(r.evaluation));
  if(type==='aces')return rows.filter(r=>r.type==='action'&&r.team==='ours'&&r.skill==='S'&&r.evaluation==='#');
  return [];
}
function smartRows(type){
  const rows=timeline(currentMatch()),player=$('v780-player')?.value||'';
  if(type==='playerKills')return player?rows.filter(r=>r.type==='action'&&r.team==='ours'&&r.player===player&&r.skill==='A'&&r.evaluation==='#'):[];
  if(type==='recepMinusBang')return rows.filter(r=>r.type==='action'&&r.team==='ours'&&r.skill==='R'&&['-','!'].includes(r.evaluation));
  if(type==='r6')return rows.filter(r=>Number(r.ownRotation)===6);
  if(type==='sideoutLost')return rows.filter(r=>r.type==='rally'&&r.servingBefore==='opponent'&&r.winner==='opponent');
  if(type==='oppZ4')return rows.filter(r=>r.type==='action'&&r.team==='opponent'&&r.skill==='A'&&(String(r.a?.startZone||'').startsWith('4')||String(r.a?.attackCombo||'')==='Z4'||String(r.a?.sourceZone||'').startsWith('4')));
  return [];
}
function renderPresetCounts(){
  const map={points:'v780-count-points',errors:'v780-count-errors',kills:'v780-count-kills',recepbad:'v780-count-recepbad',aces:'v780-count-aces'};
  Object.entries(map).forEach(([k,id])=>{const n=presetRows(k).length;$(id).textContent=`${n} ${k==='points'?'rallies':'acciones'}`});
  $('v780-count-visible').textContent=`${state.lastRows.length} elementos`;
  const player=$('v780-player')?.value||'',pairs=[['playerKills','v133-count-player-kills'],['recepMinusBang','v133-count-recep'],['r6','v133-count-r6'],['sideoutLost','v133-count-sideout'],['oppZ4','v133-count-oppz4']];
  pairs.forEach(([type,id])=>{const el=$(id);if(!el)return;const n=smartRows(type).length;el.textContent=type==='playerKills'&&!player?'Selecciona jugador':`${n} ${['r6'].includes(type)?'elementos':type==='sideoutLost'?'rallies':'acciones'}`});
}
function renderTimeline(){
  const box=$('v780-timeline');if(!box)return;
  const rows=filteredRows();state.lastRows=rows;
  let rallies=0,actions=0;rows.forEach(r=>r.type==='rally'?rallies++:actions++);
  $('v780-rally-count').textContent=String(rallies);$('v780-action-count').textContent=String(actions);
  box.innerHTML=rows.length?rows.map(r=>{
    const range=rowRange(r),tm=r.type==='action'?actionVideoTime(r.a,currentMatch()):(range?.center??mapped(currentMatch(),r.ms)),playable=!!range&&mediaLoaded();
    const linked=r.type==='action'&&actionVideoTime(r.a,currentMatch())!=null;
    return `<article class="v780-row ${state.selectedKey===r.key?'selected':''} ${r.type==='action'?'skill-'+esc(r.skill||'X'):''}" data-key="${esc(r.key)}" onclick="v780Select('${esc(r.key)}')">
      <div class="v780-time">${fmt(tm!=null?tm:r.ms/1000)}</div>
      <span class="v780-type ${r.team||''}">${r.type==='rally'?'RALLY':esc(r.skill||'ACC')}</span>
      <div class="v780-row-copy"><strong>${esc(r.label)}${linked?' <em class="v133-linked">VÍDEO</em>':''}</strong><small>${esc(r.copy)}${linked?` · ▶ ${fmt(actionVideoTime(r.a,currentMatch()))}`:''}</small></div>
      <div class="v780-row-actions"><button class="${playable?'primary':'ghost'}" ${playable?'':'disabled'} onclick="event.stopPropagation();v780PlayKey('${esc(r.key)}')">▶</button><button class="ghost" onclick="event.stopPropagation();v780CreateClip('${esc(r.key)}')">Clip −8/+5</button></div>
    </article>`;
  }).join(''):'<div class="match-empty">No hay elementos para estos filtros.</div>';
  renderPresetCounts();
}

function pct(n,d){return d?Math.round((Number(n)||0)*100/(Number(d)||0)):0}
function rotationStats(m,no){
  const rallies=timeline(m).filter(r=>r.type==='rally'&&Number(r.ownRotation)===Number(no));
  const won=rallies.filter(r=>r.winner==='ours').length,lost=rallies.length-won;
  const k1=rallies.filter(r=>r.servingBefore==='opponent'),k1w=k1.filter(r=>r.winner==='ours').length;
  const k2=rallies.filter(r=>r.servingBefore==='ours'),k2w=k2.filter(r=>r.winner==='ours').length;
  return {no,total:rallies.length,won,lost,gp:won-lost,pct:pct(won,rallies.length),k1Total:k1.length,k1Won:k1w,k1Pct:pct(k1w,k1.length),k2Total:k2.length,k2Won:k2w,k2Pct:pct(k2w,k2.length),rallies};
}
function renderTactical(){
  const m=currentMatch(),box=$('v781-rotation-grid'),detail=$('v781-rotation-detail');
  if(!box||!m)return;
  const selected=Number($('v781-rotation')?.value)||state.rotation||0;
  const stats=[1,2,3,4,5,6].map(n=>rotationStats(m,n));
  box.innerHTML=stats.map(s=>`<button class="v781-rotation-card ${selected===s.no?'active':''}" onclick="v781SelectRotation(${s.no})">
    <strong>R${s.no}</strong><small>${s.won}/${s.total} rallies · G-P ${s.gp>0?'+':''}${s.gp}</small><em>${s.total?s.pct+'%':'—'}</em>
  </button>`).join('');
  if(detail){
    if(!selected)detail.textContent='Selecciona una rotación para filtrar y revisar sus rallies.';
    else{
      const s=stats.find(x=>x.no===selected);
      detail.innerHTML=`<b>R${selected}</b> · Global ${s.total?s.pct+'%':'—'} (${s.won}/${s.total}) · K1 ${s.k1Total?s.k1Pct+'%':'—'} (${s.k1Won}/${s.k1Total}) · K2 ${s.k2Total?s.k2Pct+'%':'—'} (${s.k2Won}/${s.k2Total}) · G-P <b>${s.gp>0?'+':''}${s.gp}</b>`;
    }
  }
}
function playerStats(name){
  const rows=timeline(currentMatch()).filter(r=>r.type==='action'&&r.player===name);
  const own=rows.filter(r=>r.team==='ours');
  const points=own.filter(r=>['S','A','B'].includes(r.skill)&&r.evaluation==='#').length;
  const errors=own.filter(r=>r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/')).length;
  const rec=own.filter(r=>r.skill==='R'),recPos=rec.filter(r=>['#','+'].includes(r.evaluation)).length,recExc=rec.filter(r=>r.evaluation==='#').length;
  const att=own.filter(r=>r.skill==='A'),attPts=att.filter(r=>r.evaluation==='#').length,attErr=att.filter(r=>r.evaluation==='=').length,attBlq=att.filter(r=>r.evaluation==='/').length;
  const serve=own.filter(r=>r.skill==='S'),aces=serve.filter(r=>r.evaluation==='#').length,serveErr=serve.filter(r=>r.evaluation==='=').length;
  const blocks=own.filter(r=>r.skill==='B'&&r.evaluation==='#').length;
  const attEff=att.length?Math.round((attPts-attErr-attBlq)*100/att.length):0;
  return {rows,own,total:own.length,points,errors,gp:points-errors,rec:rec.length,recPos,recExc,recPosPct:pct(recPos,rec.length),recExcPct:pct(recExc,rec.length),att:att.length,attPts,attErr,attBlq,attEff,serve:serve.length,aces,serveErr,blocks};
}
function renderPlayerFocus(){
  const name=$('v780-player')?.value||'',title=$('v781-player-title'),box=$('v781-player-kpis'),line=$('v781-player-skill-line');
  if(!title||!box||!line)return;
  if(!name){
    title.textContent='Selecciona una jugadora';
    box.innerHTML='<div><span>Acciones</span><b>—</b></div><div><span>G-P</span><b>—</b></div><div><span>REC +/#</span><b>—</b></div><div><span>ATQ EFF</span><b>—</b></div>';
    line.textContent='Selecciona un jugador en el filtro superior.';
    return;
  }
  const s=playerStats(name);title.textContent=name;
  box.innerHTML=`<div><span>Acciones</span><b>${s.total}</b></div><div><span>G-P</span><b>${s.gp>0?'+':''}${s.gp}</b></div><div><span>REC +/#</span><b>${s.rec?s.recPosPct+'%':'—'}</b></div><div><span>ATQ EFF</span><b>${s.att?s.attEff+'%':'—'}</b></div>`;
  line.innerHTML=`Saque ${s.serve}: <b>${s.aces} ace</b> / ${s.serveErr} error · Recepción ${s.rec}: +/# ${s.recPosPct}% · # ${s.recExcPct}% · Ataque ${s.att}: ${s.attPts} punto / ${s.attErr} error / ${s.attBlq} bloqueado · Bloqueo: ${s.blocks} puntos`;
}
function setStats(set){
  const rallies=arr(set?.rallies),won=rallies.filter(r=>r.winner==='ours').length,lost=rallies.length-won;
  const first=rallies[0],last=rallies[rallies.length-1];
  const start=first?rallyStartMs(first):0,end=last?rallyEndMs(last):start;
  const k1=rallies.filter(r=>r.servingBefore==='opponent'),k1w=k1.filter(r=>r.winner==='ours').length;
  const k2=rallies.filter(r=>r.servingBefore==='ours'),k2w=k2.filter(r=>r.winner==='ours').length;
  return {rallies,won,lost,start,end,duration:Math.max(0,end-start),k1:k1.length,k1w,k1pct:pct(k1w,k1.length),k2:k2.length,k2w,k2pct:pct(k2w,k2.length)};
}
function renderSetMap(){
  const m=currentMatch(),box=$('v781-set-map');if(!box)return;
  if(!m){box.innerHTML='<div class="match-empty">Sin partido seleccionado.</div>';return}
  const selectedSet=Number($('v780-set')?.value)||0;
  box.innerHTML=arr(m.sets).map(set=>{
    const st=setStats(set),span=Math.max(1,st.end-st.start);
    const dots=st.rallies.map((r,i)=>{
      const ms=rallyStartMs(r),left=st.rallies.length===1?50:Math.max(1,Math.min(99,(ms-st.start)/span*100));
      const key=`r:${set.number}:${r.id}`,selected=state.selectedKey===key;
      return `<button class="v781-set-dot ${r.winner==='ours'?'ours':'opponent'} ${selected?'selected':''}" style="left:${left}%" title="Rally ${i+1} · ${r.scoreAfter?.us??0}-${r.scoreAfter?.opponent??0} · R${r.rotationBefore||1}" onclick="event.stopPropagation();v781PlayMapRally('${esc(key)}')"></button>`;
    }).join('');
    return `<article class="v781-set-lane ${selectedSet===Number(set.number)?'active':''}">
      <div class="v781-set-label" onclick="v781SelectSet(${Number(set.number)})"><b>Set ${set.number} · ${set.scoreUs||0}-${set.scoreOpponent||0}</b><small>${st.rallies.length} rallies · ${fmt(st.duration/1000)}</small></div>
      <div class="v781-set-track" onclick="v781SelectSet(${Number(set.number)})">${dots}</div>
      <div class="v781-set-summary"><span>K1 <b>${st.k1?st.k1pct+'%':'—'}</b></span><span>K2 <b>${st.k2?st.k2pct+'%':'—'}</b></span><span>G <b>${st.won}</b></span><span>P <b>${st.lost}</b></span></div>
    </article>`;
  }).join('')||'<div class="match-empty">Este partido todavía no tiene sets.</div>';
}
window.v781SelectSet=function(n){const s=$('v780-set');if(s)s.value=String(n);renderAll()};
window.v781PlayMapRally=function(key){state.selectedKey=key;renderAll();const r=findRow(key);if(r)playRow(r)};
window.v781SelectRotation=function(n){state.rotation=Number(n)||0;const s=$('v781-rotation');if(s)s.value=state.rotation?String(state.rotation):'';renderAll()};
window.v781ClearRotation=function(){state.rotation=0;const s=$('v781-rotation');if(s)s.value='';renderAll()};
window.v781RotationChanged=function(){state.rotation=Number($('v781-rotation')?.value)||0;renderAll()};
window.v781PlayerChanged=function(){renderAll()};
window.v781ClearPlayer=function(){const p=$('v780-player');if(p)p.value='';renderAll()};
window.v781PlayRotation=function(){
  const n=Number($('v781-rotation')?.value)||state.rotation||0;if(!n){alert('Selecciona una rotación R1–R6.');return}
  startPlaylist(timeline(currentMatch()).filter(r=>r.type==='rally'&&Number(r.ownRotation)===n),`Rotación R${n}`);
};
window.v781PlayRotationErrors=function(){
  const n=Number($('v781-rotation')?.value)||state.rotation||0;if(!n){alert('Selecciona una rotación R1–R6.');return}
  startPlaylist(timeline(currentMatch()).filter(r=>r.type==='action'&&Number(r.ownRotation)===n&&r.team==='ours'&&(r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/'))),`Errores R${n}`);
};
window.v781PlayPlayer=function(kind='all'){
  const name=$('v780-player')?.value||'';if(!name){alert('Selecciona una jugadora.');return}
  const rows=timeline(currentMatch()).filter(r=>r.type==='action'&&r.player===name&&r.team==='ours').filter(r=>{
    if(kind==='points')return ['S','A','B'].includes(r.skill)&&r.evaluation==='#';
    if(kind==='errors')return r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/');
    return true;
  });
  startPlaylist(rows,`${name} · ${kind==='points'?'Puntos':kind==='errors'?'Errores':'Todas las acciones'}`);
};
window.v781ToggleTV=function(force){
  const view=$('scout-video-hub');if(!view)return;
  state.tv=typeof force==='boolean'?force:!state.tv;
  view.classList.toggle('v781-tv',state.tv);
  document.body.classList.toggle('v781-tv-lock',state.tv);
  const b=$('v781-tv-button');if(b)b.textContent=state.tv?'Salir TV':'▣ Modo TV';
};
window.v781ExitTV=function(){window.v781ToggleTV(false)};

function renderAll(){state.playheadCache=null;state.playingRowNode=null;populateFilters();renderStatus();renderTimeline();renderSelection();renderRuler();renderSetMap();renderTactical();renderPlayerFocus();updatePlayhead()}
window.v780Render=renderAll;
window.v780Open=function(){
  populateMatches();populateFilters();renderAll();
  const m=currentMatch();if(m&&!mediaLoaded()){const x=meta(m);if(x?.youtubeId&&(!x.sourceKey||String(x.sourceKey).startsWith('youtube:')))loadYouTubeById(x.youtubeId,x.youtubeUrl||'').catch(()=>{});else tryAutoOpenRecording(m.id)};
};
window.v780MatchChanged=function(){releaseVideo();state.selectedKey='';state.playlist=[];state.playlistIndex=-1;state.rotation=0;if($('v781-rotation'))$('v781-rotation').value='';if($('v780-player'))$('v780-player').value='';populateFilters();renderAll();tryAutoOpenRecording(Number($('v780-match')?.value)||0)};
window.v780FiltersChanged=function(){populateFilters();renderAll()};
window.v780SetKind=function(kind){state.kind=['all','rally','action'].includes(kind)?kind:'all';['all','rally','action'].forEach(k=>$(`v780-kind-${k}`)?.classList.toggle('active',k===state.kind));renderAll()};
window.v780Select=function(key){state.selectedKey=key;renderTimeline();renderSelection();renderSetMap()};
window.v780PlayKey=function(key){const r=findRow(key);if(r)playRow(r)};
window.v780PlaySelected=function(){const r=selectedRow();if(!r){alert('Selecciona primero un rally o una acción.');return}playRow(r)};
window.v780Jump=function(delta){if(mediaLoaded())mediaSeek(mediaCurrentTime()+Number(delta||0))};
window.v780TogglePlay=function(){if(!mediaLoaded())return;mediaIsPaused()?mediaPlay():mediaPause()};
window.v780SpeedChanged=function(){mediaSetSpeed(Number($('v780-speed')?.value)||1)};
window.v780Fullscreen=async function(){const el=$('v780-video-frame'),v=video();try{if(document.fullscreenElement)return document.exitFullscreen();if(el?.requestFullscreen)return el.requestFullscreen();if(!isYouTube()&&v?.webkitEnterFullscreen)return v.webkitEnterFullscreen()}catch(err){console.warn(err)}};
window.v780RulerSeek=function(e){const box=$('v780-ruler'),duration=mediaDuration();if(!mediaLoaded()||duration<=0||!box)return;const r=box.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));mediaSeek(x*duration)};
window.v780SyncSelected=function(){
  const m=currentMatch(),row=selectedRow();if(!m||!row){alert('Selecciona un rally o una acción.');return}if(!mediaLoaded()){alert('Carga primero el vídeo.');return}
  const current=mediaCurrentTime(),x=meta(m),offset=anchorOffset(m,row.ms,current);
  if(offset==null){alert('Esta acción no pertenece al tramo grabado o cae durante una pausa de REC. Elige otra acción.');return}
  x.syncOffset=offset;x.syncedAt=new Date().toISOString();x.anchor={key:row.key,type:row.type,scoutMs:row.ms,videoTime:current};
  rememberSource(m);applyMap(m);save();renderAll();
};
/* V16.1.1 · Explicit anchor API for guided synchronization; uses the existing
   match syncOffset, same mapping and same save path as v780SyncSelected. */
window.v780SyncFromAnchor=function({key,videoTime}={}){
  const m=currentMatch(),row=m?findRow(String(key||'')):null;
  if(!m||!row)return {ok:false,error:'Selecciona una acción del partido actual.'};
  if(!mediaLoaded())return {ok:false,error:'Carga el vídeo correspondiente a este partido.'};
  const t=Number(videoTime),ms=Number(row.ms);
  if(videoTime==null||!Number.isFinite(t)||t<0||!Number.isFinite(ms)||ms<0)return {ok:false,error:'Marca un instante y una acción con tiempos válidos.'};
  const duration=mediaDuration();
  if(duration>0&&t>duration+.5)return {ok:false,error:'El instante marcado supera la duración del vídeo.'};
  const x=meta(m),offset=anchorOffset(m,ms,t);
  if(offset==null)return {ok:false,error:'Esta acción está fuera de la grabación REC o durante una pausa. Selecciona otra.'};
  x.syncOffset=offset;
  x.syncedAt=new Date().toISOString();
  x.anchor={key:row.key,type:row.type,scoutMs:ms,videoTime:t};
  rememberSource(m);applyMap(m);save();renderAll();
  return {ok:true,offset:x.syncOffset,matchId:m.id};
};
window.v780Nudge=function(delta){const m=currentMatch(),x=meta(m);if(!m||x?.syncOffset==null){alert('Sincroniza primero el vídeo.');return}x.syncOffset+=Number(delta||0);rememberSource(m);applyMap(m);save();renderAll()};
window.v780LoadFile=function(ev){
  const f=ev?.target?.files?.[0];if(!f)return;
  if(!String(f.type||'').startsWith('video/')&&!/\.(webm|mp4|mov|m4v)$/i.test(f.name)){alert('Selecciona un archivo de vídeo compatible.');return}
  state.file=f;loadBlob(f,f.name,null);
};
window.v780CreateClip=function(key){
  state.selectedKey=key;renderSelection();
  if(typeof window.scoutV720CreateFromKey==='function'){
    const m=currentMatch(),x=meta(m),row=findRow(key);
    if(x?.syncOffset==null){alert('Sincroniza primero el vídeo.');return}
    /* V7.2 works on its own modal/player, so persist mapped ranges and create a compatible clip directly. */
    const range=rowRange(row,m);if(!range)return;
    x.clips=arr(x.clips);
    x.clips.push({id:`hub_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,name:row.label,tag:row.team==='opponent'?'opponent':row.type==='action'?'technical':'general',note:row.copy,start:range.start,end:range.end,duration:range.end-range.start,sourceKey:key,type:row.type,set:row.set,team:row.team||'',skill:row.skill||'',evaluation:row.evaluation||'',player:row.player||'',createdAt:new Date().toISOString(),source:x.source||''});
    save();
    alert(isYouTube()
      ? 'Referencia de clip guardada. En YouTube se conserva el intervalo para análisis, pero Volley Coach no descarga ni recorta el vídeo de YouTube.'
      : 'Clip añadido a Clip Studio.');
  }
};
window.v780CreateClipSelected=function(){if(!state.selectedKey){alert('Selecciona primero un elemento.');return}v780CreateClip(state.selectedKey)};
function startPlaylist(rows,name){
  const playable=rows.filter(r=>rowRange(r));if(!playable.length){alert('No hay elementos sincronizados para esta playlist.');return}
  state.playlist=playable.map(r=>r.key);state.playlistIndex=-1;state.playlistName=name;nextPlaylist();
}
function nextPlaylist(){
  state.playlistIndex++;
  if(state.playlistIndex>=state.playlist.length){window.v780StopPlaylist();$('v780-playlist-state').textContent='Playlist terminada.';return}
  const key=state.playlist[state.playlistIndex],row=findRow(key);if(!row){nextPlaylist();return}
  $('v780-playlist-state').textContent=`${state.playlistName} · ${state.playlistIndex+1}/${state.playlist.length}`;
  playRow(row);
}
window.v780PlayPreset=function(type){startPlaylist(presetRows(type),({points:'Puntos nuestros',errors:'Errores',kills:'Ataques #',recepbad:'Recepciones negativas',aces:'Aces'})[type]||'Playlist')};
window.v780PlayVisible=function(){startPlaylist(state.lastRows,'Filtro actual')};
window.v780StopPlaylist=function(){state.playlist=[];state.playlistIndex=-1;state.playlistName='';state.stopAt=null;mediaPause();$('v780-playlist-state').textContent='Ninguna playlist activa.';renderTimeline()};

/* Recording Studio integration */
function openRecDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(REC_DB,REC_DB_VERSION);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function recSessions(){
  const db=await openRecDB();
  const out=await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readonly'),r=tx.objectStore('sessions').getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
  db.close();return out.sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||'')));
}
async function recChunks(id){
  const db=await openRecDB();
  const out=await new Promise((resolve,reject)=>{const tx=db.transaction('chunks','readonly'),idx=tx.objectStore('chunks').index('sessionId'),r=idx.getAll(id);r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
  db.close();return out.sort((a,b)=>a.index-b.index);
}
async function openRecording(rec){
  if(!rec)return;
  if(rec.mode==='browser'||rec.mode==='gallery'){
    if(Number(rec.bytes||0)>280*1024*1024)throw new Error('Esta grabación es demasiado grande para abrirse directamente desde IndexedDB. Expórtala desde Recording Pro y ábrela como archivo en Video Review.');
    const chunks=await recChunks(rec.id);if(!chunks.length)throw new Error('Esta grabación no contiene fragmentos.');
    const blob=new Blob(chunks.map(x=>x.blob),{type:rec.mime||'video/webm'});loadBlob(blob,`${rec.filename}.${String(rec.mime||'').startsWith('video/mp4')?'mp4':'webm'}`,rec);return;
  }
  if(rec.fileHandle){
    try{
      let perm=await rec.fileHandle.queryPermission?.({mode:'read'});
      if(perm!=='granted')perm=await rec.fileHandle.requestPermission?.({mode:'read'});
      if(perm==='granted'){const file=await rec.fileHandle.getFile();state.file=file;loadBlob(file,file.name,rec);return}
    }catch(err){console.warn('V7.8 file handle',err)}
  }
  alert('Esta grabación se guardó directamente al disco. Selecciona ahora el archivo WebM/MP4 correspondiente.');
  document.getElementById('v780-file')?.click();
}
window.v780OpenRecordingById=async function(id){
  const s=(await recSessions()).find(x=>String(x.id)===String(id));
  if(!s)throw new Error('Grabación no encontrada en este navegador.');
  const m=currentMatch();
  if(!m)throw new Error('Selecciona un partido en Video Review antes de abrir la grabación.');
  if(s.match?.id&&Number(s.match.id)!==Number(m.id))throw new Error('Esta grabación corresponde a otro partido. Selecciona ese partido en Video Review.');
  await openRecording(s);
  try{window.v117ReviewSetSource?.('local')}catch(_){}
  return true;
};
window.v780OpenRecordingPicker=async function(){
  try{
    const all=await recSessions(),mid=Number(currentMatch()?.id)||0;
    const list=all.filter(s=>!mid||Number(s.match?.id)===mid||!s.match?.id);
    document.getElementById('v780-recording-modal')?.remove();
    const modal=document.createElement('div');modal.id='v780-recording-modal';modal.className='v780-recording-modal';
    modal.innerHTML=`<div class="v780-recording-card"><div class="v780-section-head"><div><span class="pro-kicker">RECORDING STUDIO</span><h3>Grabaciones disponibles</h3></div><button class="ghost" id="v780-rec-close">Cerrar</button></div><div class="v780-recording-list">${list.length?list.map(s=>`<div class="v780-recording-row"><div><strong>${esc(s.filename||s.id)}</strong><small>${esc(s.startedAt||'')} · ${esc(s.source||'')} · ${s.mode==='browser'?'Navegador':'Disco'}${s.match?.opponent?' · '+esc(s.match.opponent):''}</small></div><button class="primary" data-rec="${esc(s.id)}">Abrir</button></div>`).join(''):'<div class="match-empty">No hay grabaciones compatibles para este partido.</div>'}</div></div>`;
    document.body.appendChild(modal);
    modal.onclick=e=>{if(e.target===modal)modal.remove()};
    $('v780-rec-close').onclick=()=>modal.remove();
    modal.querySelectorAll('[data-rec]').forEach(btn=>btn.onclick=async()=>{const s=all.find(x=>x.id===btn.dataset.rec);modal.remove();try{await openRecording(s)}catch(err){alert('No se ha podido abrir la grabación.\n\n'+String(err?.message||err))}});
  }catch(err){alert('No se han podido leer las grabaciones de Recording Studio.\n\n'+String(err?.message||err))}
};
async function tryAutoOpenRecording(matchId){
  if(!matchId||mediaLoaded())return;
  try{
    const all=await recSessions();
    const candidates=all.filter(s=>Number(s.match?.id)===Number(matchId)&&s.completed!==false);
    if(candidates.length===1&&!mediaLoaded()&&Number(currentMatch()?.id)===Number(matchId))await openRecording(candidates[0]);
  }catch(err){console.warn('V7.8 auto recording',err)}
}

const v=video();
if(v&&!v.dataset.v780Bound){
  v.dataset.v780Bound='1';
  v.addEventListener('timeupdate',mediaTick);
  v.addEventListener('loadedmetadata',renderRuler);
}

document.addEventListener('keydown',e=>{
  const view=$('scout-video-hub');
  if(!view||!view.classList.contains('active'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();
  if(['input','select','textarea'].includes(tag))return;
  if(e.key.toLowerCase()==='t'){e.preventDefault();v781ToggleTV()}
  if(e.key==='Escape'&&state.tv){e.preventDefault();v781ExitTV()}
  if(/^[1-6]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();v781SelectRotation(Number(e.key))}
});

window.v780PlaySmartPreset=function(type){
  if(type==='playerKills'&&!($('v780-player')?.value||'')){alert('Selecciona primero una jugadora en el filtro superior.');return}
  const names={playerKills:'Ataques # del jugador',recepMinusBang:'Recepciones − / !',r6:'Rotación R6',sideoutLost:'Side-out perdido',oppZ4:'Ataques rivales desde Z4'};
  startPlaylist(smartRows(type),names[type]||'Playlist táctica');
};
window.v780OpenAt=function(sec,key='',opts={}){
  const t=Number(sec);if(!Number.isFinite(t)||t<0)return false;
  if(key)state.selectedKey=String(key);
  if(!mediaLoaded()){renderTimeline();renderSelection();alert('La acción está vinculada al vídeo. Carga el archivo, grabación o YouTube de este partido para saltar al timecode.');return false}
  const pre=Number.isFinite(Number(opts.pre))?Math.max(0,Number(opts.pre)):8,post=Number.isFinite(Number(opts.post))?Math.max(0,Number(opts.post)):5;
  mediaSeek(Math.max(0,t-pre));state.stopAt=t+post;mediaPlay();renderTimeline();renderSelection();return true;
};
window.v780CreateSmartClips=function(type='visible'){
  const m=currentMatch(),x=meta(m);if(!m||!x)return;
  let rows=type==='visible'?state.lastRows:smartRows(type);rows=rows.filter(r=>r.type==='action'&&actionVideoTime(r.a,m)!=null);
  if(!rows.length){alert('No hay acciones con timestamp de vídeo en esta selección.');return}
  x.clips=arr(x.clips);const existing=new Set(x.clips.map(c=>String(c.sourceKey||'')));let added=0;
  rows.forEach(r=>{if(existing.has(r.key))return;const t=actionVideoTime(r.a,m),start=Math.max(0,t-8),end=t+5;x.clips.push({id:`v133_${Date.now()}_${added}_${Math.random().toString(36).slice(2,6)}`,name:`${r.player||'Jugador'} · ${r.label}`,tag:r.team==='opponent'?'opponent':'technical',note:`${r.copy} · clip automático −8/+5`,start,end,duration:end-start,sourceKey:r.key,type:'action',set:r.set,team:r.team||'',skill:r.skill||'',evaluation:r.evaluation||'',player:r.player||'',createdAt:new Date().toISOString(),source:x.source||'',videoTimestamp:t,auto:true});existing.add(r.key);added++});
  save();renderAll();$('v780-playlist-state').textContent=`${added} clips automáticos creados · −8 s / +5 s`;if(!added)alert('Las acciones seleccionadas ya tenían clip guardado.');
};
window.VC_V159_VIDEO_ENGINE={
  playlist:(keys,label)=>{const wanted=new Set(keys.map(String)),rows=timeline(currentMatch()).filter(r=>wanted.has(r.key));if(!mediaLoaded())return false;const good=rows.filter(r=>rowRange(r));if(!good.length)return false;startPlaylist(good,label||'Selección estadística');return true},
  clips:(keys)=>{const m=currentMatch(),x=meta(m);if(!m||!x)return 0;x.clips=arr(x.clips);const existing=new Set(x.clips.map(c=>String(c.sourceKey||'')));const wanted=new Set(keys.map(String));let n=0;timeline(m).filter(r=>r.type==='action'&&wanted.has(r.key)).forEach(r=>{const t=actionVideoTime(r.a,m);if(t==null||existing.has(r.key))return;const start=Math.max(0,t-8),end=t+5;x.clips.push({id:`v159_${Date.now()}_${n}_${Math.random().toString(36).slice(2,6)}`,name:`${r.player||'Jugador'} · ${r.label}`,tag:r.team==='opponent'?'opponent':'technical',note:r.copy,start,end,duration:end-start,sourceKey:r.key,type:'action',set:r.set,team:r.team||'',skill:r.skill||'',evaluation:r.evaluation||'',player:r.player||'',createdAt:new Date().toISOString(),source:x.source||'',videoTimestamp:t,auto:true});existing.add(r.key);n++});if(n){save();renderAll()}return n},
  seekKey:key=>{const row=timeline(currentMatch()).find(r=>r.key===String(key));if(!row)return false;playRow(row);return true}
};
window.VC_VIDEO_REVIEW_API={version:'19.2.3',openAt:window.v780OpenAt,select:key=>window.v780Select?.(key),play:key=>window.v780PlayKey?.(key),createClip:key=>window.v780CreateClip?.(key),createVisibleClips:()=>window.v780CreateSmartClips('visible'),currentTime:()=>mediaCurrentTime(),loaded:()=>mediaLoaded(),timeline:()=>timeline(currentMatch()),rangeForRow:row=>rowRange(row),rangeForKey:key=>rowRange(findRow(String(key))),recording:()=>state.loadedRecording};

window.v780Diagnostics=()=>({version:VERSION,matches:matches().length,match:currentMatch()?.id||null,videoLoaded:mediaLoaded(),mediaType:state.mediaType,youtubeId:state.youtubeId||null,fileMatchId:state.fileMatchId,syncOffset:meta(currentMatch())?.syncOffset??null,duration:mediaDuration(),currentTime:mediaCurrentTime(),rows:timeline(currentMatch()).length,recording:state.loadedRecording?.id||null,rotation:state.rotation||null,player:$('v780-player')?.value||null,tv:state.tv});
})();
