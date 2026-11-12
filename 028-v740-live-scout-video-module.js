
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
function active(){try{return window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
function setOf(m){try{return window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)||null}catch(_){return null}}
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
