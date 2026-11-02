
(()=>{
'use strict';
const VERSION='8.0.3';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const POS=['p1','p2','p3','p4','p5','p6'];
const EVENT_LABELS={timeout_ours:'Tiempo nuestro',timeout_opponent:'Tiempo rival',challenge_ours:'Challenge nuestro',challenge_opponent:'Challenge rival',card:'Tarjeta',injury:'Lesión',interruption:'Interrupción',note:'Nota táctica',substitution:'Cambio',libero:'Líbero'};
let ticker=null;

let media={
  source:'live',
  videoMode:'live',
  localUrl:null,
  localFile:null,
  youtubeId:null,
  youtubeUrl:'',
  youtubePlayer:null,
  youtubeReady:false,
  youtubePromise:null,
  youtubeTicker:null,
  matchId:null
};


function br(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function openMatches(){
  try{
    return arr(br()?.getMatches?.()).filter(m=>m&&m.status!=='finished')
      .sort((a,b)=>String(b.manualSavedAt||b.updatedAt||b.createdAt||'').localeCompare(String(a.manualSavedAt||a.updatedAt||a.createdAt||'')));
  }catch(_){return []}
}
function populateMatchPicker(){
  const sel=$('v800-match-select');if(!sel)return;
  const active=Number(br()?.getActiveId?.())||0,previous=Number(sel.value)||0,list=openMatches();
  sel.innerHTML=list.length
    ? list.map(m=>`<option value="${m.id}">${m.date||''} · ${m.opponent||'Rival'}${m.manualSavedAt?' · Guardado':' · En curso'}</option>`).join('')
    : '<option value="">Sin scoutings en curso</option>';
  if(active&&list.some(m=>Number(m.id)===active))sel.value=String(active);
  else if(previous&&list.some(m=>Number(m.id)===previous))sel.value=String(previous);
  else if(list[0])sel.value=String(list[0].id);
  const resume=$('v800-resume-btn');
  if(resume)resume.classList.toggle('hidden',!!active||!list.length);
}
function activateMatch(id,silent=false){
  id=Number(id)||0;if(!id)return null;
  const current=br()?.getActive?.();
  if(current&&Number(current.id)===id)return current;
  const target=openMatches().find(m=>Number(m.id)===id);
  if(!target)return null;
  if(current&&Number(current.id)!==id&&!silent){
    if(!confirm(`Cambiar del scouting contra ${current.opponent||'el rival actual'} al scouting guardado contra ${target.opponent||'el rival seleccionado'}?`)){
      populateMatchPicker();return current;
    }
  }
  const activated=br()?.activateMatch?.(id)||null;
  populateMatchPicker();
  return activated;
}
function ensureMatchForMode(){
  let m=br()?.getActive?.()||null;
  if(m)return m;
  populateMatchPicker();
  const selId=Number($('v800-match-select')?.value)||Number(openMatches()[0]?.id)||0;
  if(selId)m=activateMatch(selId,true);
  return m||null;
}
function match(){try{return br()?.getActive?.()||null}catch(_){return null}}
function setOf(m){try{return br()?.getCurrentSet?.(m)||null}catch(_){return null}}
function teamName(){try{return br()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function roster(){try{return arr(br()?.getPlayers?.())}catch(_){return []}}
function player(id){
  const p=roster().find(x=>Number(x.id)===Number(id));
  if(!p)return 'Sin asignar';
  return `${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`;
}
function setsScore(m){
  const done=arr(m?.sets).filter(s=>s.finished);
  return {us:done.filter(s=>s.winner==='ours').length,op:done.filter(s=>s.winner==='opponent').length}
}
function allRallies(m){return arr(m?.sets).flatMap(s=>arr(s.rallies).map(r=>({s,r})))}
function allActions(m){return allRallies(m).flatMap(x=>arr(x.r.actions).map(a=>({...x,a})))}
function pct(n,d){return d?Math.round(n*100/d):null}
function elapsed(m){
  let ms=0;
  try{ms=Number(br()?.elapsedMs?.(m))||0}catch(_){ms=Math.max(0,Number(m?.clockAccumulatedMs)||0)}
  const sec=Math.max(0,Math.floor(ms/1000)),h=Math.floor(sec/3600),min=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function currentSetStats(m,s){
  const rs=arr(s?.rallies),k1=rs.filter(r=>r.servingBefore==='opponent'),k2=rs.filter(r=>r.servingBefore==='ours');
  const k1w=k1.filter(r=>r.winner==='ours').length,k2w=k2.filter(r=>r.winner==='ours').length;
  const acts=rs.flatMap(r=>arr(r.actions)).filter(a=>a.team==='ours');
  const g=acts.filter(a=>a.evaluation==='#').length,p=acts.filter(a=>a.evaluation==='=').length;
  return {rallies:rs.length,k1:k1.length,k1w,k1pct:pct(k1w,k1.length),k2:k2.length,k2w,k2pct:pct(k2w,k2.length),g,p,gp:g-p};
}
function rotationStats(m,no){
  const rs=allRallies(m).map(x=>x.r).filter(r=>Number(r.rotationBefore||1)===Number(no));
  const won=rs.filter(r=>r.winner==='ours').length;
  const k1=rs.filter(r=>r.servingBefore==='opponent'),k1w=k1.filter(r=>r.winner==='ours').length;
  const k2=rs.filter(r=>r.servingBefore==='ours'),k2w=k2.filter(r=>r.winner==='ours').length;
  return {total:rs.length,won,winPct:pct(won,rs.length),k1:k1.length,k1w,k1Pct:pct(k1w,k1.length),k2:k2.length,k2w,k2Pct:pct(k2w,k2.length)};
}
function lineupHealth(m){
  const ids=POS.map(p=>Number(m?.lineup?.ours?.[p])||0);
  const filled=ids.filter(Boolean),unique=new Set(filled);
  if(filled.length<6)return {ok:false,text:`Alineación ${filled.length}/6`};
  if(unique.size!==filled.length)return {ok:false,text:'Jugador duplicado'};
  return {ok:true,text:'Alineación OK'};
}
function renderCourt(container,lineup,ours=true){
  if(!container)return;
  container.innerHTML=POS.map(pos=>{
    const raw=lineup?.[pos];
    const label=ours?player(raw):String(raw||'Sin asignar');
    return `<div class="v800-pos ${pos}"><b>${label}</b><small>${pos.toUpperCase()}</small></div>`;
  }).join('');
}
function quickEvents(m){
  return [...arr(m?.workflow?.events),...arr(m?.events)]
    .sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))
    .slice(-7).reverse();
}
function opponentTarget(m){
  const actions=allActions(m).map(x=>x.a).filter(a=>a.team==='opponent'&&a.skill==='R');
  const map=new Map();
  actions.forEach(a=>{
    const key=String(a.playerNameSnapshot||a.playerLabel||a.playerNumberSnapshot||'Rival');
    if(!map.has(key))map.set(key,{name:key,total:0,bad:0,err:0});
    const x=map.get(key);x.total++;
    if(['-','/','='].includes(a.evaluation))x.bad++;
    if(a.evaluation==='=')x.err++;
  });
  return [...map.values()].filter(x=>x.total>=2).sort((a,b)=>(b.bad/b.total)-(a.bad/a.total)||b.total-a.total)[0]||null;
}
function decisionRows(m){
  const rows=[],current=rotationStats(m,m.rotationNo||1);
  if(current.total>=3){
    rows.push({kind:current.winPct<45?'warn':current.winPct>=60?'good':'',title:`R${m.rotationNo} · ${current.winPct}% rallies ganados`,copy:`K1 ${current.k1?current.k1Pct+'%':'—'} · K2 ${current.k2?current.k2Pct+'%':'—'} · ${current.won}/${current.total} rallies.`});
  } else rows.push({kind:'',title:`R${m.rotationNo} · muestra pequeña`,copy:`Solo ${current.total} rallies registrados en esta rotación.`});
  const rotations=[1,2,3,4,5,6].map(n=>({n,...rotationStats(m,n)})).filter(x=>x.total>=3);
  if(rotations.length){
    const worst=rotations.slice().sort((a,b)=>a.winPct-b.winPct)[0];
    if(worst.n!==Number(m.rotationNo))rows.push({kind:'warn',title:`Rotación a vigilar: R${worst.n}`,copy:`${worst.winPct}% de rallies ganados (${worst.won}/${worst.total}).`});
  }
  const target=opponentTarget(m);
  if(target)rows.push({kind:target.bad/target.total>=.45?'good':'',title:`Objetivo de saque: ${target.name}`,copy:`${target.bad}/${target.total} recepciones negativas o error (${pct(target.bad,target.total)}%).`});
  const recent=allRallies(m).map(x=>x.r).slice(-8);
  if(recent.length>=5){
    const ours=recent.filter(r=>r.winner==='ours').length;
    rows.push({kind:ours>=5?'good':ours<=2?'warn':'',title:`Últimos ${recent.length}: ${ours}-${recent.length-ours}`,copy:ours>=5?'Tramo favorable. Mantener la estructura actual.':ours<=2?'Tramo desfavorable. Revisar rotación, saque y recepción.':'Tramo equilibrado.'});
  }
  return rows.slice(0,4);
}

function mediaLocalVideo(){return $('v802-local-video')}
function mediaYoutubeWrap(){return $('v802-youtube-wrap')}
function mediaIsReview(){return media.source==='local'||media.source==='youtube'}
function mediaLoaded(){
  if(media.source==='local')return !!media.localUrl&&!!mediaLocalVideo()?.src;
  if(media.source==='youtube')return !!media.youtubeReady&&!!media.youtubePlayer&&!!media.youtubeId;
  return mobileConnected()||!!$('live-delay-live')?.srcObject?.getVideoTracks?.().some(t=>t.readyState==='live');
}
function mediaCurrent(){
  if(media.source==='local')return Number(mediaLocalVideo()?.currentTime)||0;
  if(media.source==='youtube'){try{return Number(media.youtubePlayer?.getCurrentTime?.())||0}catch(_){return 0}}
  return null;
}
function mediaDuration(){
  if(media.source==='local')return Number(mediaLocalVideo()?.duration)||0;
  if(media.source==='youtube'){try{return Number(media.youtubePlayer?.getDuration?.())||0}catch(_){return 0}}
  return 0;
}
function mediaPaused(){
  if(media.source==='local')return mediaLocalVideo()?.paused!==false;
  if(media.source==='youtube'){try{return media.youtubePlayer?.getPlayerState?.()!==window.YT?.PlayerState?.PLAYING}catch(_){return true}}
  return false;
}
function mediaSeek(sec){
  const d=mediaDuration(),t=Math.max(0,Math.min(d>0?d:1e12,Number(sec)||0));
  if(media.source==='local'){try{mediaLocalVideo().currentTime=t}catch(_){}}
  else if(media.source==='youtube'){try{media.youtubePlayer?.seekTo?.(t,true)}catch(_){}}
}
function mediaPlay(){
  if(media.source==='local')mediaLocalVideo()?.play?.().catch?.(()=>{});
  else if(media.source==='youtube'){try{media.youtubePlayer?.playVideo?.()}catch(_){}}
}
function mediaPause(){
  if(media.source==='local'){try{mediaLocalVideo()?.pause?.()}catch(_){}}
  else if(media.source==='youtube'){try{media.youtubePlayer?.pauseVideo?.()}catch(_){}}
}
function parseYoutubeId(value){
  const raw=String(value||'').trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;
  try{
    const u=new URL(raw),host=u.hostname.replace(/^www\./,'').toLowerCase();
    if(host==='youtu.be'){
      const id=u.pathname.split('/').filter(Boolean)[0]||'';
      return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
    }
    if(host.endsWith('youtube.com')||host.endsWith('youtube-nocookie.com')){
      let id=u.searchParams.get('v')||'';
      if(!id){
        const parts=u.pathname.split('/').filter(Boolean),i=parts.findIndex(x=>['embed','shorts','live','v'].includes(x));
        if(i>=0)id=parts[i+1]||'';
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
    }
  }catch(_){}
  return null;
}
function ensureYoutubeApi(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(media.youtubePromise)return media.youtubePromise;
  media.youtubePromise=new Promise((resolve,reject)=>{
    const old=window.onYouTubeIframeAPIReady,started=Date.now();
    window.onYouTubeIframeAPIReady=function(){try{if(typeof old==='function')old()}catch(_){}if(window.YT?.Player)resolve(window.YT)};
    if(![...document.scripts].some(s=>/youtube\.com\/iframe_api/.test(s.src||''))){
      const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;s.onerror=()=>reject(new Error('No se ha podido cargar la API de YouTube.'));document.head.appendChild(s);
    }
    const timer=setInterval(()=>{
      if(window.YT?.Player){clearInterval(timer);resolve(window.YT)}
      else if(Date.now()-started>12000){clearInterval(timer);reject(new Error('YouTube no ha respondido.'))}
    },120);
  });
  return media.youtubePromise;
}
function resetYoutubeContainer(){
  const w=mediaYoutubeWrap();if(w)w.innerHTML='<div id="v802-youtube-player"></div>';
}
function destroyYoutube(){
  clearInterval(media.youtubeTicker);media.youtubeTicker=null;
  if(media.youtubePlayer){try{media.youtubePlayer.destroy?.()}catch(_){}}
  media.youtubePlayer=null;media.youtubeReady=false;
  resetYoutubeContainer();
}
function saveMediaPreference(){
  const m=match();if(!m)return;
  m.matchModeMedia=m.matchModeMedia||{};
  m.matchModeMedia={
    type:media.videoMode||media.source,
    youtubeId:media.youtubeId||null,
    youtubeUrl:media.youtubeUrl||'',
    localName:media.localFile?.name||m.matchModeMedia.localName||'',
    updatedAt:new Date().toISOString()
  };
  br()?.save?.();
}
function setSourceUi(){
  const mode=media.videoMode||media.source||'live';
  ['live','delay','local','youtube'].forEach(x=>$(`v802-source-${x}`)?.classList.toggle('active',mode===x));
  $('v803-mobile-tools')?.classList.toggle('hidden',mode!=='live');
  $('v116-delay-tools')?.classList.toggle('hidden',mode!=='delay');
  $('v802-local-tools')?.classList.toggle('hidden',mode!=='local');
  $('v802-youtube-tools')?.classList.toggle('hidden',mode!=='youtube');
  $('v802-playback')?.classList.toggle('hidden',!mediaIsReview());
  $('v802-live-delay-btn')?.classList.toggle('hidden',!(mode==='live'||mode==='delay'));
  $('v800-rec-btn')?.classList.toggle('hidden',!(mode==='live'||mode==='delay'));
  $('v800-rec-copy')?.classList.toggle('hidden',!(mode==='live'||mode==='delay'));
  $('v800-live-video')?.classList.toggle('hidden',!(mode==='live'||mode==='delay'));
  mediaLocalVideo()?.classList.toggle('hidden',mode!=='local');
  mediaYoutubeWrap()?.classList.toggle('hidden',mode!=='youtube');
  const title=$('v802-video-title'),help=$('v802-video-help'),label=$('v116-source-label'),copy=$('v116-source-copy');
  const titles={live:'Directo',delay:'Vídeo Delay',local:'Vídeo guardado',youtube:'YouTube'};
  const labels={live:'LIVE',delay:'DELAY',local:'ARCHIVO',youtube:'YOUTUBE'};
  const copies={
    live:'Cámara en directo para scoutar mientras ves el partido.',
    delay:'Revisión retrasada sin salir del entorno de scouting.',
    local:'Carga un vídeo guardado y conserva el instante exacto de cada acción.',
    youtube:'Abre un partido de YouTube y codifica sobre su línea temporal.'
  };
  if(title)title.textContent=titles[mode]||'Vídeo';
  if(label)label.textContent=labels[mode]||String(mode).toUpperCase();
  if(copy)copy.textContent=copies[mode]||'';
  if(help)help.textContent=mode==='live'
    ?'LIVE muestra la señal actual. Puedes usar la cámara móvil o abrir Live Delay para configurar una cámara local/capturadora.'
    :mode==='delay'
      ?'DELAY utiliza el módulo Live Delay. Elige un retraso rápido o abre Configurar para seleccionar cámara, móvil remoto y búfer.'
      :mode==='local'
        ?'Haz scouting mientras reproduces el archivo. Cada acción registrada desde esta pantalla guarda el instante exacto del vídeo.'
        :'Haz scouting sobre YouTube. Cada acción registrada desde esta pantalla guarda el instante exacto del vídeo.';
  refreshMediaStatus();
}
function refreshMediaStatus(){
  const empty=$('v800-video-empty'),status=$('v800-video-status'),overlay=$('v802-video-overlay'),sync=$('v802-sync-badge');
  const loaded=mediaLoaded();
  if(media.source==='live'){
    const remote=mobileConnected(),live=loaded||remote;
    if(empty){empty.textContent='Conecta el móvil aquí o inicia Live Delay para ver la cámara.';empty.classList.toggle('hidden',live)}
    if(status){status.textContent=remote?'MÓVIL':live?'LIVE':'OFF';status.className=`v800-status ${live?'on':''}`}
  }else if(media.source==='local'){
    if(empty){empty.textContent=media.localFile?'Preparando vídeo…':'Selecciona un archivo de vídeo guardado.';empty.classList.toggle('hidden',loaded)}
    if(status){status.textContent=loaded?'ARCHIVO':'SIN VÍDEO';status.className=`v800-status ${loaded?'on':''}`}
  }else{
    if(empty){empty.textContent=media.youtubeId?'Cargando YouTube…':'Pega un enlace de YouTube.';empty.classList.toggle('hidden',loaded)}
    if(status){status.textContent=loaded?'YOUTUBE':'SIN VÍDEO';status.className=`v800-status ${loaded?'on':''}`}
  }
  const m=match(),hasExact=mediaIsReview()&&allActions(m||{}).some(x=>x.a?.videoTime!=null);
  if(sync){
    sync.textContent=hasExact?'TIEMPO EXACTO':m?.video?.syncOffset!=null?'VINCULADO':'SIN VINCULAR';
    sync.className=`v800-status ${hasExact?'exact':m?.video?.syncOffset!=null?'synced':''}`;
  }
  if(overlay&&mediaIsReview()&&loaded){
    const t=mediaCurrent(),d=mediaDuration();
    overlay.textContent=`${formatMediaTime(t)} / ${formatMediaTime(d)} · ${media.source==='youtube'?'YouTube':media.localFile?.name||'Archivo'}`;
    overlay.classList.remove('hidden');
  }else overlay?.classList.add('hidden');
}
function formatMediaTime(sec){
  sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function stampLatestAction(){
  if(!mediaIsReview()||!mediaLoaded())return;
  const m=match(),s=setOf(m),a=arr(m?.liveRally?.actions).slice(-1)[0];
  if(!m||!a)return;
  a.videoTime=mediaCurrent();
  a.videoSource=media.source;
  m.video=m.video||{};
  if(media.source==='youtube'){
    m.video.youtubeId=media.youtubeId;m.video.youtubeUrl=media.youtubeUrl;m.video.source=`YouTube · ${media.youtubeId}`;
  }else if(media.localFile){
    m.video.source=media.localFile.name;m.video.fileSize=media.localFile.size||0;m.video.mimeType=media.localFile.type||'';
  }
  br()?.save?.();
  refreshMediaStatus();
}
function stampEvent(e){
  if(mediaIsReview()&&mediaLoaded()&&e){e.videoTime=mediaCurrent();e.videoSource=media.source}
}
function mediaScoutSeconds(m){
  const start=Date.parse(m?.clockStartedAt||m?.createdAt||'');
  return Number.isFinite(start)?Math.max(0,(Date.now()-start)/1000):0;
}
window.v802SetSource=function(source){
  if(!['live','delay','local','youtube'].includes(source))return;
  media.videoMode=source;
  media.source=source==='delay'?'live':source;
  media.matchId=match()?.id||null;
  setSourceUi();saveMediaPreference();
  if(media.source==='live')syncVideo();
};
window.v116SetVideoSource=function(source){
  if(source==='delay'){
    window.v802SetSource('delay');
    window.v116OpenDelay?.();
    return;
  }
  window.v802SetSource(source);
};
window.v116OpenDelay=function(seconds){
  media.videoMode='delay';media.source='live';setSourceUi();saveMediaPreference();syncVideo();
  if(seconds!=null){
    const sel=$('live-delay-seconds');if(sel)sel.value=String(seconds);
    try{window.liveDelaySetDelay?.(seconds)}catch(_){}
    const status=$('v116-delay-status');if(status)status.textContent=`Retraso · ${Number(seconds)} s`;
  }
  try{window.openLiveDelay?.('scouting')}catch(err){console.warn('V11.6 Live Delay',err)}
};
window.v116ReturnLive=function(){window.v802SetSource('live')};
window.v802LoadLocal=function(ev){
  const f=ev?.target?.files?.[0];if(!f)return;
  if(media.localUrl){try{URL.revokeObjectURL(media.localUrl)}catch(_){}}
  media.localFile=f;media.localUrl=URL.createObjectURL(f);media.source='local';media.videoMode='local';media.matchId=match()?.id||null;
  const v=mediaLocalVideo();v.src=media.localUrl;v.load();
  $('v802-local-name').textContent=f.name;
  v.onloadedmetadata=()=>{setSourceUi();saveMediaPreference();refreshMediaStatus()};
  v.ontimeupdate=refreshMediaStatus;
  setSourceUi();
};
window.v802LoadYouTube=async function(){
  const url=String($('v802-youtube-url')?.value||'').trim(),id=parseYoutubeId(url);
  if(!id){alert('No reconozco ese enlace de YouTube.');return}
  media.source='youtube';media.videoMode='youtube';media.youtubeId=id;media.youtubeUrl=url;media.matchId=match()?.id||null;
  setSourceUi();destroyYoutube();
  try{
    await ensureYoutubeApi();resetYoutubeContainer();
    media.youtubePlayer=new YT.Player('v802-youtube-player',{
      width:'100%',height:'100%',videoId:id,
      playerVars:{playsinline:1,controls:1,rel:0},
      events:{
        onReady:()=>{
          media.youtubeReady=true;setSourceUi();saveMediaPreference();
          clearInterval(media.youtubeTicker);media.youtubeTicker=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('scout-match-mode')?.classList.contains('active')&&media.source==='youtube')refreshMediaStatus()},500);
        },
        onStateChange:()=>refreshMediaStatus(),
        onError:e=>{
          media.youtubeReady=false;refreshMediaStatus();
          const msg=Number(e.data)===101||Number(e.data)===150?'El propietario no permite reproducir este vídeo fuera de YouTube.':Number(e.data)===100?'El vídeo es privado, no existe o se ha eliminado.':'YouTube no puede reproducir este vídeo aquí.';
          alert(msg);
        }
      }
    });
  }catch(err){alert('No se ha podido cargar YouTube.\n\n'+String(err?.message||err))}
};
window.v802Jump=function(delta){if(mediaIsReview()&&mediaLoaded())mediaSeek(mediaCurrent()+Number(delta||0))};
window.v802TogglePlay=function(){if(!mediaIsReview()||!mediaLoaded())return;mediaPaused()?mediaPlay():mediaPause()};
window.v802SetSpeed=function(value){
  const r=Number(value)||1;
  if(media.source==='local'&&mediaLocalVideo())mediaLocalVideo().playbackRate=r;
  else if(media.source==='youtube'){try{media.youtubePlayer?.setPlaybackRate?.(r)}catch(_){}}
};
window.v802SyncNow=function(){
  const m=match();if(!m||!mediaIsReview()||!mediaLoaded()){alert('Abre primero un archivo o un vídeo de YouTube.');return}
  m.video=m.video||{};
  m.video.syncOffset=mediaCurrent()-mediaScoutSeconds(m);
  m.video.syncedAt=new Date().toISOString();
  m.video.anchor={type:'match-mode',scoutMs:Math.round(mediaScoutSeconds(m)*1000),videoTime:mediaCurrent()};
  if(media.source==='youtube'){m.video.youtubeId=media.youtubeId;m.video.youtubeUrl=media.youtubeUrl;m.video.source=`YouTube · ${media.youtubeId}`}
  else if(media.localFile){m.video.source=media.localFile.name;m.video.fileSize=media.localFile.size||0;m.video.mimeType=media.localFile.type||''}
  br()?.save?.();refreshMediaStatus();
};
window.v802PrimaryReplay=function(){
  if(media.source==='live'){window.scoutV740ReplayLastRally?.();return}
  const m=match(),s=setOf(m),r=arr(s?.rallies).slice(-1)[0];if(!r){alert('Todavía no hay rallies cerrados.');return}
  const times=arr(r.actions).map(a=>a.videoTime).filter(v=>v!=null&&Number.isFinite(Number(v))).map(Number);
  if(!times.length){alert('Ese rally no tiene tiempos de vídeo directos. Usa “Vincular tiempo” o registra las acciones desde Modo Partido.');return}
  mediaSeek(Math.max(0,Math.min(...times)-2));mediaPlay();
};
window.v802SecondaryReplay=function(){
  if(media.source==='live'){window.scoutV740ReplayLastAction?.();return}
  const m=match(),actions=allActions(m||{}).map(x=>x.a).filter(a=>a.videoTime!=null),a=actions.slice(-1)[0];
  if(!a){alert('Todavía no hay acciones con tiempo de vídeo.');return}
  mediaSeek(Math.max(0,Number(a.videoTime)-2));mediaPlay();
};
function restoreMatchMedia(){
  const m=match();if(!m)return;
  if(Number(media.matchId)===Number(m.id))return;
  media.matchId=m.id;
  const pref=m.matchModeMedia||{};
  if(pref.type==='youtube'&&pref.youtubeId){
    media.source='youtube';media.videoMode='youtube';media.youtubeId=pref.youtubeId;media.youtubeUrl=pref.youtubeUrl||`https://www.youtube.com/watch?v=${pref.youtubeId}`;
    if($('v802-youtube-url'))$('v802-youtube-url').value=media.youtubeUrl;
    setTimeout(()=>window.v802LoadYouTube?.(),20);
  }else if(pref.type==='local'){
    media.source='local';media.videoMode='local';setSourceUi();
    if($('v802-local-name'))$('v802-local-name').textContent=pref.localName?`${pref.localName} · vuelve a seleccionar el archivo`:'Ningún archivo seleccionado';
  }else if(pref.type==='delay'){
    media.source='live';media.videoMode='delay';setSourceUi();
  }else{
    media.source='live';media.videoMode='live';setSourceUi();
  }
}


function mobileDiagnostics(){
  try{return window.vcRemoteCameraDiagnostics?.()||window.VC_REMOTE_CAMERA?.diagnostics?.()||{}}catch(_){return {}}
}
function mobileConnected(){
  try{return !!window.VC_REMOTE_CAMERA?.isConnected?.()}catch(_){return false}
}
function mobileStream(){
  try{return window.VC_REMOTE_CAMERA?.getStream?.()||null}catch(_){return null}
}
function remotePublisherLink(){
  const fromDom=String($('vc-remote-link')?.value||'').trim();
  if(fromDom)return fromDom;
  return '';
}
function renderMobileQR(){
  const box=$('v803-mobile-qr'),input=$('v803-mobile-link'),link=remotePublisherLink();
  if(input)input.value=link;
  if(!box)return;
  box.innerHTML='';
  if(!link){box.innerHTML='<span>No se ha generado todavía una sesión.</span>';return}
  if(window.QRCode){
    try{new QRCode(box,{text:link,width:106,height:106,correctLevel:QRCode.CorrectLevel.M});return}catch(_){}
  }
  box.innerHTML='<span>QR no disponible. Usa “Copiar enlace”.</span>';
}
function refreshMobileStatus(){
  const status=$('v803-mobile-status'),note=$('v803-mobile-note');
  if(!status)return;
  const d=mobileDiagnostics(),connected=mobileConnected();
  if(connected){
    status.textContent='MÓVIL CONECTADO';status.className='v800-status on';
    if(note)note.textContent='Señal recibida. Puedes pulsar ● REC y seguir haciendo scouting a la vez.';
  }else if(d.streamId){
    status.textContent='ESPERANDO MÓVIL';status.className='v800-status wait';
    if(note)note.textContent='QR preparado. Abre el enlace en el móvil y pulsa “Iniciar transmisión”.';
  }else{
    status.textContent='SIN CONECTAR';status.className='v800-status';
    if(note)note.textContent='Escanea el QR en el móvil, abre la cámara y pulsa “Iniciar transmisión”. La imagen aparecerá en la pantalla grande.';
  }
}
window.v803PrepareMobile=async function(reset=false){
  if(typeof window.vcRemotePrepare!=='function'){alert('La cámara remota no está disponible.');return}
  const status=$('v803-mobile-status');
  if(status){status.textContent='PREPARANDO…';status.className='v800-status wait'}
  try{
    window.vcRemoteSourceChanged?.('remote');
    await window.vcRemotePrepare(reset);
    renderMobileQR();refreshMobileStatus();syncVideo();renderREC();
  }catch(err){
    if(status){status.textContent='ERROR';status.className='v800-status bad'}
    alert('No se ha podido preparar la cámara móvil.\n\n'+String(err?.message||err));
  }
};
window.v803CopyMobileLink=async function(){
  const link=String($('v803-mobile-link')?.value||remotePublisherLink()).trim();
  if(!link){alert('Primero genera el QR de la cámara móvil.');return}
  try{await navigator.clipboard.writeText(link);const s=$('v803-mobile-status');if(s){s.textContent='ENLACE COPIADO';s.className='v800-status on'}}
  catch(_){prompt('Copia este enlace y ábrelo en el móvil:',link)}
};
window.v803DisconnectMobile=async function(){
  try{await window.vcRemoteDisconnect?.()}catch(_){}
  refreshMobileStatus();syncVideo();renderREC();
};

function syncVideo(){
  const source=$('live-delay-live'),target=$('v800-live-video');
  const remote=mobileConnected()?mobileStream():null;
  const delayedLive=source?.srcObject;
  const stream=remote?.getVideoTracks?.().some(t=>t.readyState==='live')?remote:delayedLive;
  const live=stream?.getVideoTracks?.().some(t=>t.readyState==='live');
  if(live&&target?.srcObject!==stream){target.srcObject=stream;target.muted=true;target.play().catch(()=>{})}
  if(!live&&target?.srcObject)target.srcObject=null;
  if(media.source==='live')refreshMediaStatus();
  refreshMobileStatus();
}
function renderREC(){
  const d=typeof window.vcRecordingDiagnostics==='function'?window.vcRecordingDiagnostics():null;
  const btn=$('v800-rec-btn'),copy=$('v800-rec-copy');
  if(!btn||!copy)return;
  if(d?.active){
    btn.textContent=d.paused?'▶ Reanudar REC':'■ Finalizar REC';
    btn.className='v800-status rec';
    copy.textContent=`REC ${Math.floor((d.elapsedMs||0)/1000)} s · ${Math.round((d.bytes||0)/1048576)} MB · ${d.mode||''}`;
  }else{
    btn.textContent='● REC';btn.className='ghost';copy.textContent='Grabación detenida.';
  }
}

/* ===== V9.1 · MATCH MODE SELECTIVE RENDER ===== */
let v910ViewMode=localStorage.getItem('v910_match_view')||'directo';
let v910DecisionCache={key:'',rows:[]};

function v910ViewNeeds(name){
  if(v910ViewMode==='todo')return true;
  if(v910ViewMode==='directo')return name==='directo'||name==='lectura-lite';
  return v910ViewMode===name;
}
function v910ViewCopy(){
  return v910ViewMode==='video'
    ?'Vídeo carga únicamente cámara/replay/REC y evita cálculos tácticos innecesarios.'
    :v910ViewMode==='lectura'
      ?'Lectura recalcula K1/K2, G-P, decisiones y último rally.'
      :v910ViewMode==='todo'
        ?'Todo reproduce la distribución completa histórica de Modo partido.'
        :'Directo prioriza marcador, pista, puntos, códigos y lectura esencial.';
}
function v910ApplyModeClass(){
  const shell=$('v800-shell');if(!shell)return;
  ['directo','video','lectura','todo'].forEach(x=>shell.classList.toggle(`v910-mode-${x}`,v910ViewMode===x));
  document.querySelectorAll('#v910-match-view-nav [data-v910-view]').forEach(b=>b.classList.toggle('active',b.dataset.v910View===v910ViewMode));
  const copy=$('v910-match-view-copy');if(copy)copy.textContent=v910ViewCopy();
}
function v910DecisionRows(m){
  const rallies=allRallies(m),key=[m?.id,m?.currentSet,m?.rotationNo,rallies.length,rallies.slice(-1)[0]?.r?.id||0].join('|');
  if(v910DecisionCache.key===key)return v910DecisionCache.rows;
  const rows=decisionRows(m);v910DecisionCache={key,rows};return rows;
}
function v910InvalidateMatchCaches(){v910DecisionCache={key:'',rows:[]}}
function v910FastMutation(){
  const m=match();if(!m)return;
  const s=setOf(m);
  if($('v800-rally-chip'))$('v800-rally-chip').textContent=`Rally ${(s?.rallies?.length||0)+1} · ${arr(m?.liveRally?.actions).length} acc.`;
  if($('v800-clock'))$('v800-clock').textContent=elapsed(m);
  const badge=document.getElementById('scout-save-badge');
  if(badge&&badge.textContent.includes('consolidando'))badge.title='Journal inmediato activo';
}
window.v910SetMatchView=function(mode){
  if(!['directo','video','lectura','todo'].includes(mode))mode='directo';
  v910ViewMode=mode;localStorage.setItem('v910_match_view',mode);v910ApplyModeClass();
  if(mode==='video'||mode==='todo'){restoreMatchMedia();setSourceUi();syncVideo();renderREC();refreshMediaStatus();refreshMobileStatus()}
  render();
};
window.v910InvalidateMatchCaches=v910InvalidateMatchCaches;
window.v910MatchModeFastRender=v910FastMutation;
window.VC_V910_MATCH_VIEW={get:()=>v910ViewMode,set:window.v910SetMatchView,invalidate:v910InvalidateMatchCaches};

function render(){
  populateMatchPicker();
  v910ApplyModeClass();
  const m=match(),empty=$('v800-empty'),live=$('v800-live');
  if(!m){
    const saved=openMatches();
    empty?.classList.remove('hidden');live?.classList.add('hidden');
    $('v800-title').textContent=saved.length?'Scouting guardado disponible':'Sin partido activo';
    $('v800-meta').textContent=saved.length?`${saved.length} scouting(s) en curso guardado(s). Selecciona uno para continuar.`:'Abre o crea un scouting para empezar.';
    const resume=$('v800-resume-btn');if(resume)resume.classList.toggle('hidden',!saved.length);
    return;
  }

  empty?.classList.add('hidden');live?.classList.remove('hidden');
  const s=setOf(m),sets=setsScore(m),lh=lineupHealth(m);
  $('v800-title').textContent=`${teamName()} vs ${m.opponent||'Rival'}`;
  $('v800-meta').textContent=`${m.date||''}${m.competition?' · '+m.competition:''} · ${m.status==='finished'?'Finalizado':'En directo'}`;
  $('v800-team-name').textContent=teamName();$('v800-opponent').textContent=m.opponent||'Rival';
  $('v800-score-us').textContent=String(s?.scoreUs||0);$('v800-score-op').textContent=String(s?.scoreOpponent||0);
  $('v800-sets-us').textContent=`${sets.us} sets`;$('v800-sets-op').textContent=`${sets.op} sets`;
  $('v800-set-label').textContent=`SET ${m.currentSet||s?.number||1}`;$('v800-clock').textContent=elapsed(m);
  $('v800-service-copy').textContent=m.servingTeam==='opponent'?'Saque rival':'Saque nuestro';
  $('v800-service-dot').style.background=m.servingTeam==='opponent'?'#b76458':'#68aa7f';
  $('v800-rotation-title').textContent=`R${m.rotationNo||1} · vs R${m.opponentRotationNo||1}`;
  $('v800-lineup-health').textContent=lh.text;$('v800-lineup-health').style.background=lh.ok?'#e7f4ec':'#faece8';$('v800-lineup-health').style.color=lh.ok?'#2b6543':'#8f453e';
  $('v800-rally-chip').textContent=`Rally ${(s?.rallies?.length||0)+1} · ${arr(m?.liveRally?.actions).length} acc.`;

  const needDirect=v910ViewNeeds('directo');
  const needVideo=v910ViewNeeds('video');
  const needRead=v910ViewNeeds('lectura')||v910ViewNeeds('lectura-lite');

  if(needDirect){
    renderCourt($('v800-court-own'),m.lineup?.ours,true);
    renderCourt($('v800-court-rival'),m.lineup?.opponent,false);
    const ev=quickEvents(m);
    $('v800-events').innerHTML=ev.length?ev.map(e=>`<span class="v800-event-pill"><b>${EVENT_LABELS[e.type]||e.type}</b> · S${e.setNumber||m.currentSet} ${e.scoreUs??0}-${e.scoreOpponent??0}${e.subject?' · '+String(e.subject):''}</span>`).join(''):'<span class="v800-event-pill">Sin eventos registrados</span>';
  }

  if(needRead){
    const st=currentSetStats(m,s);
    $('v800-k1').textContent=st.k1pct==null?'—':`${st.k1pct}%`;$('v800-k1-copy').textContent=`${st.k1w}/${st.k1}`;
    $('v800-k2').textContent=st.k2pct==null?'—':`${st.k2pct}%`;$('v800-k2-copy').textContent=`${st.k2w}/${st.k2}`;
    $('v800-gp').textContent=`${st.gp>0?'+':''}${st.gp}`;$('v800-gp-copy').textContent=`G ${st.g} · P ${st.p}`;$('v800-rallies').textContent=String(st.rallies);

    if(v910ViewMode==='lectura'||v910ViewMode==='todo'){
      const decisions=v910DecisionRows(m);
      $('v800-decisions').innerHTML=decisions.length?decisions.map(x=>`<div class="v800-decision ${x.kind}"><b>${x.title}</b><span>${x.copy}</span></div>`).join(''):'<div class="v800-decision"><b>Aún sin muestra</b><span>Registra varios rallies para generar lectura en directo.</span></div>';
    }

    const last=arr(s?.rallies).slice(-1)[0];
    if(last){
      $('v800-last-title').textContent=`${last.scoreAfter?.us??0}-${last.scoreAfter?.opponent??0} · ${last.winner==='ours'?'Punto nuestro':'Punto rival'}`;
      $('v800-last-rally').innerHTML=`R${last.rotationBefore||1} · ${last.servingBefore==='ours'?'K2 / saque':'K1 / recepción'} · ${arr(last.actions).length} acciones<div class="v800-last-actions">${arr(last.actions).slice(-7).map(a=>`<span>${a.code||((a.playerNumberSnapshot||'')+(a.skill||'')+(a.evaluation||''))}</span>`).join('')}</div>`;
    }else{
      $('v800-last-title').textContent='Todavía sin rallies';$('v800-last-rally').textContent='El último rally aparecerá aquí cuando cierres el primer punto.';
    }
  }

  if(needDirect){
    window.v850RenderMatchExtras?.(m,s);
    window.v855RenderMatchState?.(m,s);
  }

  if(needVideo){
    syncVideo();renderREC();refreshMediaStatus();refreshMobileStatus();
  }
}
window.v800Render=render;
window.v800Open=function(){
  populateMatchPicker();
  ensureMatchForMode();
  v910ApplyModeClass();
  if(v910ViewMode==='video'||v910ViewMode==='todo'){restoreMatchMedia();setSourceUi();renderMobileQR();refreshMobileStatus()}
  render();
  clearInterval(ticker);
  ticker=setInterval(()=>{
    const view=$('scout-match-mode');
    if(view?.classList.contains('active')){
      const m=match();
      if(m)$('v800-clock').textContent=elapsed(m);
      if(v910ViewMode==='video'||v910ViewMode==='todo'){
        syncVideo();renderREC();refreshMediaStatus();refreshMobileStatus();
        if(!$('v803-mobile-link')?.value&&remotePublisherLink())renderMobileQR();
      }
    }
  },1000)
};
window.v800SelectMatch=function(id){
  if(!id)return;
  const m=activateMatch(id,false);
  if(m){media.matchId=null;restoreMatchMedia();render();setSourceUi()}
};
window.v800ResumeSelected=function(){
  const id=Number($('v800-match-select')?.value)||Number(openMatches()[0]?.id)||0;
  if(!id){alert('No hay ningún scouting guardado en curso.');return}
  const m=activateMatch(id,true);
  if(m){media.matchId=null;restoreMatchMedia();render();setSourceUi()}
};
window.v800AddCode=function(){
  const value=String($('v800-code')?.value||'').trim().toUpperCase().replace(/\s+/g,'');if(!value)return;
  const target=$('scout-code-input');if(!target){alert('No encuentro la consola de códigos del scouting.');return}
  target.value=value;
  try{window.scoutAddCode?.();stampLatestAction();$('v800-code').value='';window.VC_SCOUT_RENDER_V92?.requestFast?.('match-code')}catch(err){alert('No se ha podido registrar el código.\n\n'+String(err?.message||err))}
};
window.v800Preset=function(suffix){
  const n=String($('v800-code-number')?.value||'').trim();
  if(!n){$('v800-code-number')?.focus();return}
  const prefix=$('v800-code-team')?.value==='opponent'?'R':'';
  $('v800-code').value=`${prefix}${n}${suffix}`;v800AddCode();
};
window.v800QuickEvent=function(type){
  const m=match(),s=setOf(m);if(!m||!s)return;
  if(type==='note'){
    const note=prompt('Nota táctica:');if(!String(note||'').trim())return;
    type='note';
    m.workflow=m.workflow||{};m.workflow.events=arr(m.workflow.events);
    const evt={id:Date.now(),uid:`evt_${Date.now()}`,type,subject:'',note:String(note).trim(),setNumber:s.number,scoreUs:s.scoreUs,scoreOpponent:s.scoreOpponent,rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,createdAt:new Date().toISOString(),scoutMs:Math.max(0,Date.now()-Date.parse(m.clockStartedAt||m.createdAt||new Date().toISOString())),videoTime:null};stampEvent(evt);m.workflow.events.push(evt);
  }else{
    m.workflow=m.workflow||{};m.workflow.events=arr(m.workflow.events);
    const evt={id:Date.now(),uid:`evt_${Date.now()}`,type,subject:'',note:'',setNumber:s.number,scoreUs:s.scoreUs,scoreOpponent:s.scoreOpponent,rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,createdAt:new Date().toISOString(),scoutMs:Math.max(0,Date.now()-Date.parse(m.clockStartedAt||m.createdAt||new Date().toISOString())),videoTime:null};stampEvent(evt);m.workflow.events.push(evt);
  }
  br()?.save?.();try{br()?.render?.()}catch(_){}render();
};
window.v800ToggleREC=async function(){
  if(typeof window.vcRecordingDiagnostics!=='function'||typeof window.vcRecordingStart!=='function'){alert('Recording Studio no está disponible.');return}
  const d=window.vcRecordingDiagnostics();
  try{
    if(d?.active){if(confirm('¿Finalizar y guardar la grabación actual?'))await window.vcRecordingStop?.()}
    else{
      if(mobileConnected())window.vcRemoteSourceChanged?.('remote');
      if(!d?.sourceAvailable&&!mobileConnected()){alert('Primero conecta el móvil, inicia Live Delay o conecta una cámara activa.');return}
      await window.vcRecordingStart();
    }
  }catch(err){alert('No se ha podido cambiar el estado de grabación.\n\n'+String(err?.message||err))}
  renderREC();
};
window.v800ToggleFullscreen=async function(){
  const view=$('scout-match-mode');
  if(!view)return;
  if(document.fullscreenElement){try{await document.exitFullscreen()}catch(_){}view.classList.remove('v800-full');document.body.classList.remove('v800-lock');return}
  try{
    if(view.requestFullscreen){await view.requestFullscreen()}
    else{view.classList.add('v800-full');document.body.classList.add('v800-lock')}
  }catch(_){view.classList.toggle('v800-full');document.body.classList.toggle('v800-lock')}
};
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){$('scout-match-mode')?.classList.remove('v800-full');document.body.classList.remove('v800-lock')}});

/* V9.1: refresh only the visible Mode Partido surface.
   Actions inside the current rally use a lightweight refresh; structural
   changes invalidate tactical caches and run the full visible render. */
['scoutAwardPoint','scoutUndoRally','scoutAddCode','scoutAddManualAction','scoutApplySubstitution','scoutSaveLineup','scoutNextSet','scoutFinishMatch'].forEach(name=>{
  const base=window[name];if(typeof base!=='function'||base.__v800)return;
  const wrapped=function(...args){
    const out=base.apply(this,args);
    Promise.resolve(out).finally(()=>{
      if(!$('scout-match-mode')?.classList.contains('active'))return;
      if(name==='scoutAddCode'||name==='scoutAddManualAction'){
        window.VC_SCOUT_RENDER_V92?.requestFast?.('match-action');
      }else{
        v910InvalidateMatchCaches();
        if(window.VC_SCOUT_RENDER_V92?.request)window.VC_SCOUT_RENDER_V92.request('match-structural');
        else setTimeout(render,0);
      }
    });
    return out
  };
  wrapped.__v800=true;window[name]=wrapped;
});

window.VC_MATCH_MODE_MEDIA={
  source:()=>media.source,
  loaded:()=>mediaLoaded(),
  current:()=>mediaCurrent(),
  duration:()=>mediaDuration(),
  seek:(t)=>mediaSeek(t),
  play:()=>mediaPlay(),
  pause:()=>mediaPause(),
  isReview:()=>mediaIsReview(),
  localName:()=>media.localFile?.name||null,
  youtubeId:()=>media.youtubeId||null
};
window.v800Diagnostics=()=>({version:VERSION,active:!!match(),matchId:match()?.id||null,openSaved:openMatches().map(m=>({id:m.id,opponent:m.opponent,status:m.status,manualSavedAt:m.manualSavedAt||null})),selectedId:Number($('v800-match-select')?.value)||null,set:match()?.currentSet||null,rotation:match()?.rotationNo||null,mediaSource:media.source,videoMode:media.videoMode||media.source,mediaLoaded:mediaLoaded(),mediaTime:mediaCurrent(),youtubeId:media.youtubeId||null,localFile:media.localFile?.name||null,mobileConnected:mobileConnected(),mobile:mobileDiagnostics(),liveVideo:!!$('live-delay-live')?.srcObject,recording:typeof window.vcRecordingDiagnostics==='function'?window.vcRecordingDiagnostics():null});
})();
