
(()=>{
'use strict';
const SCOUT_SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const SCOUT_POS=['p1','p2','p3','p4','p5','p6'];
const scoutClone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const scoutArr=v=>Array.isArray(v)?v:[];
const scoutNow=()=>new Date().toISOString();
function scoutEmptyLineup(){return {ours:{p1:null,p2:null,p3:null,p4:null,p5:null,p6:null},opponent:{p1:'',p2:'',p3:'',p4:'',p5:'',p6:''}}}
function scoutEmptySet(n){return {number:n,scoreUs:0,scoreOpponent:0,finished:false,winner:null,rallies:[],startedAt:scoutNow(),endedAt:null}}
function scoutNormalizeLineup(raw){const base=scoutEmptyLineup();SCOUT_POS.forEach(p=>{base.ours[p]=raw?.ours?.[p]!=null&&raw?.ours?.[p]!==''?Number(raw.ours[p]):null;base.opponent[p]=String(raw?.opponent?.[p]||'')});return base}
function scoutNormalizeRoles(raw){const base={ours:{},opponent:{}};SCOUT_POS.forEach(p=>{base.ours[p]=String(raw?.ours?.[p]||'');base.opponent[p]=String(raw?.opponent?.[p]||'')});return base}
function scoutNormalizeLibero(raw){return {enabled:!!raw?.enabled,auto:raw?.auto!==false,playerId:raw?.playerId!=null&&raw?.playerId!==''?Number(raw.playerId):null,centralIds:scoutArr(raw?.centralIds).map(Number).filter(Boolean),activeForId:raw?.activeForId!=null&&raw?.activeForId!==''?Number(raw.activeForId):null,activePosition:String(raw?.activePosition||'')}}
function scoutNormalizeAction(a){return {id:Number(a?.id)||Date.now(),seq:Number(a?.seq)||1,team:a?.team==='opponent'?'opponent':'ours',playerId:a?.playerId!=null&&a?.playerId!==''?Number(a.playerId):null,playerLabel:String(a?.playerLabel||''),playerNameSnapshot:String(a?.playerNameSnapshot||''),playerNumberSnapshot:a?.playerNumberSnapshot??'',skill:SCOUT_SKILLS[a?.skill]?a.skill:'S',evaluation:['#','+','!','-','/','='].includes(a?.evaluation)?a.evaluation:'!',startZone:String(a?.startZone||''),endZone:String(a?.endZone||''),serveType:['F','JF','JP','U'].includes(a?.serveType)?a.serveType:'',phase:['K1','K2','FB','TR'].includes(a?.phase)?a.phase:'',setTarget:['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'].includes(a?.setTarget)?a.setTarget:'',attackCombo:['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'].includes(a?.attackCombo)?a.attackCombo:'',attackTempo:['RAP','MED','ALT'].includes(a?.attackTempo)?a.attackTempo:'',blockers:['0','1','2','3'].includes(String(a?.blockers))?String(a.blockers):'',code:String(a?.code||''),validationWarnings:scoutArr(a?.validationWarnings).map(String).slice(0,8),createdAt:String(a?.createdAt||scoutNow()),scoutMs:Math.max(0,Number(a?.scoutMs)||0),videoTime:a?.videoTime==null?null:Number(a.videoTime),videoSource:String(a?.videoSource||'')}}
function scoutNormalizeRally(r){return {id:Number(r?.id)||Date.now(),setNumber:Number(r?.setNumber)||1,servingBefore:r?.servingBefore==='opponent'?'opponent':'ours',rotationBefore:Math.min(6,Math.max(1,Number(r?.rotationBefore)||1)),opponentRotationBefore:Math.min(6,Math.max(1,Number(r?.opponentRotationBefore)||1)),lineupBefore:scoutNormalizeLineup(r?.lineupBefore),baseLineupBefore:r?.baseLineupBefore?scoutNormalizeLineup(r.baseLineupBefore):null,liberoBefore:r?.liberoBefore?scoutNormalizeLibero(r.liberoBefore):null,lineupRolesBefore:r?.lineupRolesBefore?scoutNormalizeRoles(r.lineupRolesBefore):null,scoreBefore:{us:Number(r?.scoreBefore?.us)||0,opponent:Number(r?.scoreBefore?.opponent)||0},scoreAfter:{us:Number(r?.scoreAfter?.us)||0,opponent:Number(r?.scoreAfter?.opponent)||0},winner:r?.winner==='opponent'?'opponent':'ours',actions:scoutArr(r?.actions).map(scoutNormalizeAction),startedAt:String(r?.startedAt||scoutNow()),endedAt:String(r?.endedAt||scoutNow()),scoutStartMs:Math.max(0,Number(r?.scoutStartMs)||0),scoutEndMs:Math.max(0,Number(r?.scoutEndMs)||0),editedAt:r?.editedAt?String(r.editedAt):null,editCount:Math.max(0,Number(r?.editCount)||0)}}
function scoutNormalizeSet(s,i=0){return {number:Number(s?.number)||i+1,scoreUs:Number(s?.scoreUs)||0,scoreOpponent:Number(s?.scoreOpponent)||0,finished:!!s?.finished,winner:s?.winner==='opponent'?'opponent':s?.winner==='ours'?'ours':null,rallies:scoutArr(s?.rallies).map(scoutNormalizeRally),startedAt:String(s?.startedAt||scoutNow()),endedAt:s?.endedAt?String(s.endedAt):null}}
function scoutNormalizeMatch(m){const sets=scoutArr(m?.sets).map(scoutNormalizeSet);return {dataVersion:String(m?.dataVersion||'6.8.0'),id:Number(m?.id)||Date.now(),linkedMatchId:m?.linkedMatchId?Number(m.linkedMatchId):null,date:String(m?.date||fechaLocalISO()),opponent:String(m?.opponent||'Rival'),competition:String(m?.competition||''),status:m?.status==='finished'?'finished':'live',currentSet:Math.max(1,Number(m?.currentSet)||1),servingTeam:m?.servingTeam==='opponent'?'opponent':'ours',rotationNo:Math.min(6,Math.max(1,Number(m?.rotationNo)||1)),opponentRotationNo:Math.min(6,Math.max(1,Number(m?.opponentRotationNo)||1)),lineup:scoutNormalizeLineup(m?.lineup),baseLineup:scoutNormalizeLineup(m?.baseLineup||m?.lineup),lineupRoles:scoutNormalizeRoles(m?.lineupRoles),libero:scoutNormalizeLibero(m?.libero),sets:sets.length?sets:[scoutEmptySet(1)],events:scoutArr(m?.events).map(e=>({id:Number(e?.id)||Date.now(),type:['libero','libero_auto','substitution'].includes(e?.type)?e.type:'substitution',team:e?.team==='opponent'?'opponent':'ours',setNumber:Number(e?.setNumber)||1,scoreUs:Number(e?.scoreUs)||0,scoreOpponent:Number(e?.scoreOpponent)||0,position:String(e?.position||''),outPlayerId:e?.outPlayerId!=null?Number(e.outPlayerId):null,inPlayerId:e?.inPlayerId!=null?Number(e.inPlayerId):null,outLabel:String(e?.outLabel||''),inLabel:String(e?.inLabel||''),createdAt:String(e?.createdAt||scoutNow()),scoutMs:Math.max(0,Number(e?.scoutMs)||0)})),clockStartedAt:String(m?.clockStartedAt||m?.createdAt||scoutNow()),clockAccumulatedMs:Math.max(0,Number(m?.clockAccumulatedMs)||0),clockMode:'active-only',liveRally:{id:Number(m?.liveRally?.id)||Date.now(),actions:scoutArr(m?.liveRally?.actions).map(scoutNormalizeAction),startedAt:String(m?.liveRally?.startedAt||scoutNow()),scoutStartMs:Math.max(0,Number(m?.liveRally?.scoutStartMs)||0),startSnapshot:m?.liveRally?.startSnapshot?scoutClone(m.liveRally.startSnapshot):null},createdAt:String(m?.createdAt||scoutNow()),updatedAt:String(m?.updatedAt||scoutNow()),endedAt:m?.endedAt?String(m.endedAt):null}}
let scoutingMatches=scoutArr(equiposData?.[equipoActivo]?.scoutingMatches).map(scoutNormalizeMatch);
let scoutingActiveId=Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null;
function scoutActive(){return scoutingMatches.find(m=>Number(m.id)===Number(scoutingActiveId))||null}
function scoutSet(m){return m?.sets?.find(s=>Number(s.number)===Number(m.currentSet))||null}
function scoutPlayer(id){return (jugadoresEquipo||[]).find(p=>Number(p.id)===Number(id))||null}
function scoutPlayerName(id){const p=scoutPlayer(id);if(!p)return 'Sin asignar';const num=p.number!==''&&p.number!=null?`#${p.number} · `:'';return num+(p.name||'Jugador')}
function scoutOpponentLabel(v,pos=''){return String(v||'').trim()||`Rival ${pos.toUpperCase()}`}

/* ===== V9.0.2 · PERFORMANCE SAFE SAVE ENGINE =====
   - Every change: small independent IndexedDB journal of the active match.
   - Action-only change: lightweight UI render, no full app serialization.
   - Full state commit: after idle, and immediately on points/set/status changes.
   - Exhaustive analysis is NOT simplified; it remains on analysis/PDF paths. */
const V902_JOURNAL_DB='VolleyCoachScoutJournalV902',V902_JOURNAL_STORE='liveMatches',V920_JOURNAL_LIVE_STORE='liveRallies';
let v902CommitTimer=null,v902CommitBusy=false,v902CommitQueued=false,v902LastMutation=null,v902LastFullAt=0,v902RenderFrame=0;

function v902MutationState(m){
  const s=scoutSet(m),
    rallies=scoutArr(m?.sets).reduce((n,x)=>n+scoutArr(x?.rallies).length,0),
    liveActions=scoutArr(m?.liveRally?.actions).length;
  /* V9.3.1: do not recount every closed action on every input.
     Editing an old rally is already protected by Editor checkpoints and is
     consolidated by the idle/full save path. */
  return {
    id:Number(m?.id)||0,currentSet:Number(m?.currentSet)||1,status:String(m?.status||''),
    scoreUs:Number(s?.scoreUs)||0,scoreOpponent:Number(s?.scoreOpponent)||0,rallies,liveActions,
    rotationNo:Number(m?.rotationNo)||1,opponentRotationNo:Number(m?.opponentRotationNo)||1,
    servingTeam:String(m?.servingTeam||''),lineup:JSON.stringify(m?.lineup||{})
  };
}
function v902IsActionOnly(prev,next){
  if(!prev||!next||prev.id!==next.id)return false;
  return prev.currentSet===next.currentSet&&prev.status===next.status&&
    prev.scoreUs===next.scoreUs&&prev.scoreOpponent===next.scoreOpponent&&prev.rallies===next.rallies&&
    prev.rotationNo===next.rotationNo&&
    prev.opponentRotationNo===next.opponentRotationNo&&prev.servingTeam===next.servingTeam&&
    prev.lineup===next.lineup&&prev.liveActions!==next.liveActions;
}
function v902IsCritical(prev,next){
  if(!prev||!next||prev.id!==next.id)return true;
  return prev.currentSet!==next.currentSet||prev.status!==next.status||
    prev.scoreUs!==next.scoreUs||prev.scoreOpponent!==next.scoreOpponent||
    prev.rallies!==next.rallies||
    prev.rotationNo!==next.rotationNo||prev.opponentRotationNo!==next.opponentRotationNo||
    prev.servingTeam!==next.servingTeam||prev.lineup!==next.lineup;
}
let v931JournalDBPromise=null;
function v902OpenJournal(){
  if(v931JournalDBPromise)return v931JournalDBPromise;
  v931JournalDBPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB'in window)){v931JournalDBPromise=null;reject(new Error('IndexedDB no disponible'));return}
    const req=indexedDB.open(V902_JOURNAL_DB,2);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(V902_JOURNAL_STORE))db.createObjectStore(V902_JOURNAL_STORE,{keyPath:'key'});
      if(!db.objectStoreNames.contains(V920_JOURNAL_LIVE_STORE))db.createObjectStore(V920_JOURNAL_LIVE_STORE,{keyPath:'key'});
    };
    req.onsuccess=()=>{
      const db=req.result;
      db.onversionchange=()=>{try{db.close()}catch(_){}v931JournalDBPromise=null};
      resolve(db);
    };
    req.onerror=()=>{v931JournalDBPromise=null;reject(req.error||new Error('No se pudo abrir journal'))};
  });
  return v931JournalDBPromise;
}
window.scoutV931WarmJournal=async function(){try{await v902OpenJournal();return true}catch(_){return false}};
async function v902JournalWrite(m,reason='change'){
  if(!m||!Number(m.id))return false;
  const key=`${equipoActivo}:${Number(m.id)}`,savedAt=new Date().toISOString();
  try{
    const db=await v902OpenJournal();
    if(reason==='action'){
      /* V9.2: action-only journal stores the live rally, not the whole match. */
      const row={
        key,version:'9.2.0',teamId:String(equipoActivo),matchId:Number(m.id),savedAt,reason:'action-delta',
        currentSet:Number(m.currentSet)||1,status:String(m.status||'live'),
        liveRally:scoutClone(m.liveRally||{actions:[]})
      };
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(V920_JOURNAL_LIVE_STORE,'readwrite');
        tx.objectStore(V920_JOURNAL_LIVE_STORE).put(row);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
    }else{
      const row={
        key,version:'9.2.0',teamId:String(equipoActivo),matchId:Number(m.id),savedAt,reason,
        match:scoutClone(m)
      };
      await new Promise((resolve,reject)=>{
        const tx=db.transaction([V902_JOURNAL_STORE,V920_JOURNAL_LIVE_STORE],'readwrite');
        tx.objectStore(V902_JOURNAL_STORE).put(row);
        /* Critical snapshot already contains the latest live state. */
        tx.objectStore(V920_JOURNAL_LIVE_STORE).delete(key);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      });
    }
    return true;
  }catch(err){console.warn('V9.3.1 journal',err);return false}
}
window.scoutV902JournalReadAll=async function(){
  try{
    const db=await v902OpenJournal();
    const [fullRows,liveRows]=await Promise.all([
      new Promise((resolve,reject)=>{
        const tx=db.transaction(V902_JOURNAL_STORE,'readonly'),req=tx.objectStore(V902_JOURNAL_STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
      }),
      new Promise((resolve,reject)=>{
        const tx=db.transaction(V920_JOURNAL_LIVE_STORE,'readonly'),req=tx.objectStore(V920_JOURNAL_LIVE_STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
      })
    ]);
    const byKey=new Map(fullRows.map(r=>[r.key,r]));
    liveRows.forEach(delta=>{
      const base=byKey.get(delta.key);
      if(!base?.match)return;
      const match=scoutClone(base.match);
      match.currentSet=Number(delta.currentSet)||Number(match.currentSet)||1;
      match.status=delta.status||match.status;
      match.liveRally=scoutClone(delta.liveRally||match.liveRally||{actions:[]});
      match.updatedAt=delta.savedAt||match.updatedAt;
      byKey.set(delta.key,{...base,version:'9.2.0',savedAt:delta.savedAt||base.savedAt,reason:'action-delta',match});
    });
    return [...byKey.values()];
  }catch(_){return[]}
};
function v902FastRender(m){
  if(!m)return;
  if(window.VC_SCOUT_RENDER_V92?.requestFast){
    window.VC_SCOUT_RENDER_V92.requestFast('action-save');
    return;
  }
  const workspace=$('scout-workspace-v900')?.classList.contains('active'),
    matchMode=$('scout-match-mode')?.classList.contains('active');
  if(matchMode){
    try{window.v910MatchModeFastRender?.()}catch(_){}
  }else if(workspace){
    try{window.v900RenderFast?.()}catch(_){}
  }
}
function v902RequestFullRender(){
  if(window.VC_SCOUT_RENDER_V92?.request){window.VC_SCOUT_RENDER_V92.request('critical-save');return}
  if(v902RenderFrame)return;
  v902RenderFrame=requestAnimationFrame(()=>{
    v902RenderFrame=0;
    try{scoutRender()}catch(err){console.warn('V9.2 full render',err)}
  });
}
async function v902FullCommit(reason='idle',withCloud=true){
  clearTimeout(v902CommitTimer);v902CommitTimer=null;
  if(v902CommitBusy){v902CommitQueued=true;return false}
  v902CommitBusy=true;
  const t0=performance.now();
  try{
    if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
    /* V9.3.1: scouting changes do not require cloning training history,
       planning, templates, players, season, competition, goals, etc. */
    const team=equiposData[equipoActivo];
    team.scoutingMatches=scoutClone(scoutingMatches);
    team.scoutingActiveId=scoutingActiveId||null;
    guardarEstadoLocalSinCloud();
    v902LastFullAt=Date.now();
    try{void window.scoutV680Backup?.('v931-'+reason)}catch(_){}
    if(withCloud)try{programarSubidaCloud()}catch(_){}
    const b=$('scout-save-badge');if(b)b.textContent='Sesión abierta · auto-protección ✓';
    try{window.VC_PERF_V931?.mark?.('full-save',performance.now()-t0)}catch(_){}
    return true;
  }finally{
    v902CommitBusy=false;
    if(v902CommitQueued){v902CommitQueued=false;setTimeout(()=>v902FullCommit('queued',withCloud),0)}
  }
}
function v902ScheduleCommit(reason='idle',delay=1100){
  clearTimeout(v902CommitTimer);
  v902CommitTimer=setTimeout(()=>v902FullCommit(reason,true),Math.max(250,Number(delay)||1100));
}
window.scoutV902Flush=()=>v902FullCommit('manual-flush',true);
window.scoutV902PerformanceDiagnostics=()=>({
  version:'9.3.1',lastFullAt:v902LastFullAt,commitPending:!!v902CommitTimer,commitBusy:v902CommitBusy,
  lastMutation:v902LastMutation,journalDb:V902_JOURNAL_DB
});

function scoutSave(render=true){
  const m=scoutActive();
  if(m){m.updatedAt=scoutNow();m.dataVersion='9.3.1'}
  const next=v902MutationState(m),prev=v902LastMutation,actionOnly=v902IsActionOnly(prev,next),critical=v902IsCritical(prev,next);
  v902LastMutation=next;

  /* Immediate independent safety layer. Never waits for the full application save. */
  if(m)void v902JournalWrite(m,actionOnly?'action':'critical');

  if(critical){
    /* V9.3.1: the full match is already being written to IndexedDB journal above.
       Defer the expensive whole-app localStorage serialization so the point /
       rotation / lineup button can respond immediately. */
    v902ScheduleCommit('critical-idle',480);
    if(render)v902RequestFullRender();
    const b=$('scout-save-badge');if(b)b.textContent='Protegido · consolidando…';
  }else{
    /* Action within the same rally: fast UI now, full state after a short idle period. */
    v902ScheduleCommit('action-idle',950);
    if(render)v902FastRender(m);
  }
}

/* Flush pending full state whenever the page is backgrounded or closed. */
window.addEventListener('pagehide',()=>{try{void v902FullCommit('pagehide',false)}catch(_){}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')try{void v902FullCommit('background',true)}catch(_){}});


/* V7.0.1 · stable public bridge for video module */
window.VC_SCOUT_VIDEO_BRIDGE={
  getMatches:()=>scoutingMatches,
  getActiveId:()=>scoutingActiveId,
  getActive:()=>scoutActive(),
  getCurrentSet:(m)=>scoutSet(m),
  save:()=>scoutSave(false),
  render:()=>scoutRender(),
  teamName:()=>EQUIPOS?.[equipoActivo]?.nombre||'Equipo',
  getTeamId:()=>String(equipoActivo||'equipo'),
  getPlayers:()=>scoutClone(jugadoresEquipo||[]),
  elapsedMs:(m=scoutActive())=>scoutElapsed(m),
  resumeClock:(m=scoutActive())=>scoutClockResume(m),
  pauseClock:(m=scoutActive())=>scoutClockPause(m),
  replaceMatches:(list,activeId=scoutingActiveId)=>{
    const current=scoutActive();if(current)scoutClockPause(current);
    scoutingMatches=scoutArr(list).map(scoutNormalizeMatch);
    const wanted=Number(activeId)||0;
    scoutingActiveId=wanted&&scoutingMatches.some(x=>Number(x.id)===wanted&&x.status!=='finished')?wanted:null;
    if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
    equiposData[equipoActivo].scoutingMatches=scoutClone(scoutingMatches);
    equiposData[equipoActivo].scoutingActiveId=scoutingActiveId;
    return scoutClone(scoutingMatches);
  },
  activateMatch:(id)=>{
    const m=scoutingMatches.find(x=>Number(x.id)===Number(id));
    if(!m||m.status==='finished')return null;
    const current=scoutActive();
    if(current&&Number(current.id)!==Number(m.id)){scoutClockPause(current);scoutSave(false)}
    scoutingActiveId=m.id;
    m.status='live';m.endedAt=null;m.reopenedAt=scoutNow();m.updatedAt=scoutNow();
    scoutClockResume(m);
    scoutSave(false);
    return m;
  },
  playerLabel:(a)=>{try{return scoutActionPlayerLabel(a)}catch(_){return String(a?.playerLabel||a?.playerNameSnapshot||a?.playerNumberSnapshot||'Jugador')}}
};
/* Estado por equipo / Supabase */
const scoutPrevEmpty=estadoEquipoVacio;estadoEquipoVacio=function(id){const s=scoutPrevEmpty(id);if(!Array.isArray(s.scoutingMatches))s.scoutingMatches=[];if(s.scoutingActiveId===undefined)s.scoutingActiveId=null;return s};
const scoutPrevClean=limpiarEquipo;limpiarEquipo=function(raw,id){const s=scoutPrevClean(raw,id);s.scoutingMatches=scoutArr(raw?.scoutingMatches||s.scoutingMatches).map(scoutNormalizeMatch);s.scoutingActiveId=raw?.scoutingActiveId?Number(raw.scoutingActiveId):null;return s};
const scoutPrevMem=guardarEquipoEnMemoria;guardarEquipoEnMemoria=function(){scoutPrevMem();if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);equiposData[equipoActivo].scoutingMatches=scoutClone(scoutingMatches);equiposData[equipoActivo].scoutingActiveId=scoutingActiveId||null};
const scoutPrevLoad=cargarEquipoEnVariables;cargarEquipoEnVariables=function(id){const out=scoutPrevLoad(id);scoutingMatches=scoutArr(equiposData?.[id]?.scoutingMatches).map(scoutNormalizeMatch);scoutingActiveId=Number(equiposData?.[id]?.scoutingActiveId)||null;return out};
/* Enrutado */
botonVista=function(id){return document.querySelector(`.tab-btn[data-view="${id}"]`)||null};
const scoutPrevTeam=window.cambiarEquipo;window.cambiarEquipo=function(id){const out=scoutPrevTeam(id);scoutingMatches=scoutArr(equiposData?.[equipoActivo]?.scoutingMatches).map(scoutNormalizeMatch);scoutingActiveId=Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null;scoutRender();return out};
function scoutSetsScore(m){const done=scoutArr(m?.sets).filter(s=>s.finished);return {us:done.filter(s=>s.winner==='ours').length,opponent:done.filter(s=>s.winner==='opponent').length}}
function scoutActionCount(m){return scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s.rallies).reduce((a,r)=>a+scoutArr(r.actions).length,0),0)+scoutArr(m?.liveRally?.actions).length}
function scoutRotateTeamLineup(lineup,team='ours',dir=1){const l=scoutNormalizeLineup(lineup),key=team==='opponent'?'opponent':'ours',vals=SCOUT_POS.map(p=>l[key][p]);const rotated=dir>=0?vals.slice(1).concat(vals[0]):[vals[5]].concat(vals.slice(0,5));SCOUT_POS.forEach((p,i)=>l[key][p]=rotated[i]);return l}
/* V12.5 removed unreachable function: scoutRotateLineup */
window.scoutRotate=function(dir=1){const m=scoutActive();if(!m||m.status==='finished')return;m.lineup=scoutRotateTeamLineup(m.lineup,'ours',dir);m.rotationNo=((m.rotationNo-1+(dir>=0?-1:1)+6)%6)+1;scoutSave()};
window.scoutRotateOpponent=function(dir=1){const m=scoutActive();if(!m||m.status==='finished')return;m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',dir);m.opponentRotationNo=((m.opponentRotationNo-1+(dir>=0?-1:1)+6)%6)+1;scoutSave()};
const scoutClockRuntime=new Map();
function scoutClockRecordedMax(m){
  let max=0;
  scoutArr(m?.sets).forEach(s=>scoutArr(s?.rallies).forEach(r=>{
    max=Math.max(max,Number(r?.scoutEndMs)||0,Number(r?.scoutStartMs)||0);
    scoutArr(r?.actions).forEach(a=>max=Math.max(max,Number(a?.scoutMs)||0));
  }));
  scoutArr(m?.liveRally?.actions).forEach(a=>max=Math.max(max,Number(a?.scoutMs)||0));
  scoutArr(m?.events).forEach(e=>max=Math.max(max,Number(e?.scoutMs)||0));
  return Math.max(0,max);
}
function scoutClockEnsure(m){
  if(!m)return 0;
  if(!Number.isFinite(Number(m.clockAccumulatedMs))||Number(m.clockAccumulatedMs)<0)m.clockAccumulatedMs=0;
  /* Migration: old versions used Date.now-clockStartedAt. Use the largest
     actually recorded scouting timestamp instead, so days outside the scout
     are not counted as match time. */
  if(!m.clockMode){
    m.clockAccumulatedMs=Math.max(Number(m.clockAccumulatedMs)||0,scoutClockRecordedMax(m));
    m.clockMode='active-only';
  }
  return Math.max(0,Number(m.clockAccumulatedMs)||0);
}
function scoutClockResume(m){
  if(!m||m.status==='finished')return false;
  scoutClockEnsure(m);
  const id=Number(m.id)||0;if(!id)return false;
  if(!scoutClockRuntime.has(id))scoutClockRuntime.set(id,Date.now());
  return true;
}
function scoutClockPause(m){
  if(!m)return false;
  const id=Number(m.id)||0,start=scoutClockRuntime.get(id);
  scoutClockEnsure(m);
  if(start){
    m.clockAccumulatedMs=Math.max(0,Number(m.clockAccumulatedMs)||0)+Math.max(0,Date.now()-start);
    scoutClockRuntime.delete(id);
    m.updatedAt=scoutNow();
    try{void v902JournalWrite(m,'critical')}catch(_){}
    try{v902ScheduleCommit('clock-pause',300)}catch(_){}
    return true;
  }
  return false;
}
function scoutElapsed(m){
  if(!m)return 0;
  const base=scoutClockEnsure(m),start=scoutClockRuntime.get(Number(m.id)||0);
  return base+(start?Math.max(0,Date.now()-start):0);
}
function scoutCurrentRallySnapshot(m){const s=scoutSet(m);return {servingBefore:m.servingTeam,rotationBefore:m.rotationNo,opponentRotationBefore:m.opponentRotationNo,lineupBefore:scoutClone(m.lineup),scoreBefore:{us:s?.scoreUs||0,opponent:s?.scoreOpponent||0}}}
function scoutEnsureRallyStart(m){if(!m.liveRally.startSnapshot)m.liveRally.startSnapshot=scoutCurrentRallySnapshot(m)}
function scoutResetLiveRally(m){m.liveRally={id:Date.now(),actions:[],startedAt:scoutNow(),scoutStartMs:scoutElapsed(m),startSnapshot:null}}
function scoutBuildCode(a){let token='';if(a.team==='opponent'){const n=String(a.playerLabel||'').match(/\d+/)?.[0]||String(a.playerLabel||'').replace(/\s+/g,'').slice(0,4)||'?';token='R'+n}else{const p=scoutPlayer(a.playerId);token=p?.number!==''&&p?.number!=null?String(p.number):'P'}token+=a.skill+(a.evaluation||'!');if(a.startZone&&a.endZone)token+=`.${a.startZone}>${a.endZone}`;if(a.serveType)token+=`~${a.serveType}`;const combo=a.setTarget||a.attackCombo;if(combo)token+=`:${combo}`;if(a.phase)token+=`^${a.phase}`;if(a.blockers!==''&&a.blockers!=null)token+=`@${a.blockers}`;return token}
function scoutPushAction(action){const m=scoutActive();if(!m||m.status==='finished'){alert('No hay un scouting activo.');return false}const s=scoutSet(m);if(!s||s.finished){alert('Este set está cerrado. Inicia el siguiente set.');return false}scoutEnsureRallyStart(m);if(!action.phase&&action.skill!=='S')action.phase=scoutDefaultPhase(m,action.team==='opponent'?'opponent':'ours');const warnings=typeof window.scoutV680ValidateAction==='function'?window.scoutV680ValidateAction(action,m):[];const snapPlayer=action.team==='ours'?scoutPlayer(action.playerId):null;action=scoutNormalizeAction({...action,validationWarnings:warnings,playerNameSnapshot:action.playerNameSnapshot||(snapPlayer?.name||''),playerNumberSnapshot:action.playerNumberSnapshot??(snapPlayer?.number??''),id:Date.now()+Math.floor(Math.random()*1000),seq:m.liveRally.actions.length+1,createdAt:scoutNow(),scoutMs:scoutElapsed(m)});action.code=scoutBuildCode(action);m.liveRally.actions.push(action);if(warnings.length&&typeof window.scoutV680ReportWarnings==='function')window.scoutV680ReportWarnings(warnings,action);scoutSave();return true}
window.scoutRefreshActionPlayers=function(){const team=$('scout-action-team')?.value||'ours',sel=$('scout-action-player');if(!sel)return;const m=scoutActive();if(team==='ours'){sel.innerHTML=(jugadoresEquipo||[]).map(p=>`<option value="${p.id}">${esc((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador'))}</option>`).join('')||'<option value="">Sin jugadores</option>'}else{const vals=SCOUT_POS.map(pos=>({pos,label:scoutOpponentLabel(m?.lineup?.opponent?.[pos],pos)}));sel.innerHTML=vals.map(x=>`<option value="${esc(x.label)}">${esc(x.label)}</option>`).join('')}};
window.scoutAddManualAction=function(){const team=$('scout-action-team')?.value||'ours',pv=$('scout-action-player')?.value||'',skill=$('scout-action-skill')?.value||'S',combo=$('scout-action-combo')?.value||'';scoutPushAction({team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',skill,evaluation:$('scout-action-eval')?.value||'!',startZone:$('scout-action-start')?.value||'',endZone:$('scout-action-end')?.value||'',serveType:$('scout-action-serve-type')?.value||'',phase:$('scout-action-phase')?.value||'',setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',attackTempo:skill==='A'?($('scout-action-tempo')?.value||''):'',blockers:skill==='A'?($('scout-action-blockers')?.value||''):''})};
function scoutFindOwnByNumber(num){return (jugadoresEquipo||[]).find(p=>String(p.number??'').trim()===String(num).trim())||null}
function scoutFindOpponentByNumber(m,num){for(const pos of SCOUT_POS){const label=String(m?.lineup?.opponent?.[pos]||'');if(label.match(/\d+/)?.[0]===String(num))return label}return '#'+num}
window.scoutAddCode=function(){const input=$('scout-code-input'),raw=String(input?.value||'').trim().toUpperCase().replace(/\s+/g,'');if(!raw)return;const mt=raw.match(/^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])>([1-9]))?(.*)$/);if(!mt){alert('Código no reconocido. Abre “Chuleta” para ver la sintaxis. Ejemplos: 4S+.1>5 · 12A# · R7R-');return}let rest=mt[7]||'';const serve=rest.match(/~(JF|JP|F|U)/)?.[1]||'';rest=rest.replace(/~(JF|JP|F|U)/,'');const combo=rest.match(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/)?.[1]||'';rest=rest.replace(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/,'');const phase=rest.match(/\^(K1|K2|FB|TR)/)?.[1]||'';rest=rest.replace(/\^(K1|K2|FB|TR)/,'');const blockers=rest.match(/@([0-3])/)?.[1]||'';rest=rest.replace(/@([0-3])/,'');if(rest){alert('Hay una parte del código avanzado que no reconozco: '+rest+'\nAbre “Chuleta” para ver la sintaxis V6.2.');return}const m=scoutActive(),rival=!!mt[1],num=mt[2],skill=mt[3],ev=mt[4]||'!',startZ=mt[5]||'',endZ=mt[6]||'',meta={serveType:serve,phase,setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',blockers:skill==='A'?blockers:'',attackTempo:''};if(rival){scoutPushAction({team:'opponent',playerLabel:scoutFindOpponentByNumber(m,num),skill,evaluation:ev,startZone:startZ,endZone:endZ,...meta})}else{const p=scoutFindOwnByNumber(num);if(!p){alert(`No encuentro un jugador de tu plantilla con dorsal ${num}.`);return}scoutPushAction({team:'ours',playerId:p.id,skill,evaluation:ev,startZone:startZ,endZone:endZ,...meta})}if(input){input.value='';input.focus()}};
window.scoutDeleteLastAction=function(){const m=scoutActive();if(!m||!m.liveRally.actions.length)return;m.liveRally.actions.pop();if(!m.liveRally.actions.length)m.liveRally.startSnapshot=null;scoutSave()};
function scoutSetTarget(setNo){return Number(setNo)===5?15:25}
function scoutSetHasWinner(s){const target=scoutSetTarget(s.number),a=s.scoreUs,b=s.scoreOpponent;return (a>=target||b>=target)&&Math.abs(a-b)>=2}
function scoutSyncCompetition(m){if(!m?.linkedMatchId)return;const pm=(partidosEquipo||[]).find(x=>Number(x.id)===Number(m.linkedMatchId));if(!pm)return;const score=scoutSetsScore(m);pm.status='Jugado';pm.setsFor=score.us;pm.setsAgainst=score.opponent;pm.setDetail=scoutArr(m.sets).filter(s=>s.finished).map(s=>`${s.scoreUs}-${s.scoreOpponent}`).join(', ');pm.setParticipation=scoutArr(m.sets).filter(s=>s.finished).map(s=>{const ids=[];scoutArr(s.rallies).forEach(r=>SCOUT_POS.forEach(pos=>{const id=Number(r.lineupBefore?.ours?.[pos]);if(id&&!ids.includes(id))ids.push(id)}));return {set:s.number,playerIds:ids,participantsSnapshot:ids.map(id=>{const p=scoutPlayer(id);return {id,name:p?.name||'',number:p?.number??'',positions:typeof ppPositions==='function'?ppPositions(p||{}):[]}})}});guardarPartidos();renderCompetition();renderPlanificacion();renderStats()}
window.scoutAwardPoint=function(winner){const m=scoutActive(),s=scoutSet(m);if(!m||!s||m.status==='finished'||s.finished)return;scoutEnsureRallyStart(m);const before=m.liveRally.startSnapshot||scoutCurrentRallySnapshot(m);if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;const rally={id:m.liveRally.id,setNumber:s.number,servingBefore:before.servingBefore,rotationBefore:before.rotationBefore,opponentRotationBefore:before.opponentRotationBefore,lineupBefore:scoutClone(before.lineupBefore),scoreBefore:scoutClone(before.scoreBefore),scoreAfter:{us:s.scoreUs,opponent:s.scoreOpponent},winner:winner==='opponent'?'opponent':'ours',actions:scoutClone(m.liveRally.actions),startedAt:m.liveRally.startedAt,endedAt:scoutNow(),scoutStartMs:Number(m.liveRally.scoutStartMs)||0,scoutEndMs:scoutElapsed(m)};s.rallies.push(rally);
 if(winner==='ours'){if(before.servingBefore==='opponent'){m.lineup=scoutRotateTeamLineup(m.lineup,'ours',1);m.rotationNo=((m.rotationNo+4)%6)+1}m.servingTeam='ours'}else{if(before.servingBefore==='ours'){m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',1);m.opponentRotationNo=((m.opponentRotationNo+4)%6)+1}m.servingTeam='opponent'}
 scoutResetLiveRally(m);
 if(scoutSetHasWinner(s)){s.finished=true;s.winner=s.scoreUs>s.scoreOpponent?'ours':'opponent';s.endedAt=scoutNow();const sets=scoutSetsScore(m);if(sets.us>=3||sets.opponent>=3){m.status='finished';m.endedAt=scoutNow();scoutSyncCompetition(m)}}
 scoutSave()};
window.scoutUndoRally=function(){const m=scoutActive(),s=scoutSet(m);if(!m||!s||!s.rallies.length)return;if(s.finished){s.finished=false;s.winner=null;s.endedAt=null;if(m.status==='finished'){m.status='live';m.endedAt=null}}const r=s.rallies.pop();s.scoreUs=Number(r.scoreBefore.us)||0;s.scoreOpponent=Number(r.scoreBefore.opponent)||0;m.servingTeam=r.servingBefore;m.rotationNo=r.rotationBefore;m.opponentRotationNo=r.opponentRotationBefore||1;m.lineup=scoutNormalizeLineup(r.lineupBefore);m.liveRally={id:r.id,actions:scoutClone(r.actions),startedAt:r.startedAt,scoutStartMs:Number(r.scoutStartMs)||0,startSnapshot:{servingBefore:r.servingBefore,rotationBefore:r.rotationBefore,opponentRotationBefore:r.opponentRotationBefore||1,lineupBefore:scoutClone(r.lineupBefore),scoreBefore:scoutClone(r.scoreBefore)}};scoutSave()};
window.scoutNextSet=function(serving){const m=scoutActive(),s=scoutSet(m);if(!m||!s?.finished||m.status==='finished')return;m.currentSet=s.number+1;m.sets.push(scoutEmptySet(m.currentSet));m.servingTeam=serving==='opponent'?'opponent':'ours';scoutResetLiveRally(m);scoutSave();setTimeout(()=>scoutOpenLineup(),40)};
window.scoutFinishMatch=function(){const m=scoutActive();if(!m)return;if(m.status==='finished'){alert('Este scouting ya está finalizado.');return}if(!confirm('¿Finalizar este scouting? Podrás conservar y consultar todos los rallies registrados.'))return;m.status='finished';m.endedAt=scoutNow();const s=scoutSet(m);if(s&&!s.finished&&(s.scoreUs||s.scoreOpponent)){s.finished=true;s.winner=s.scoreUs===s.scoreOpponent?null:(s.scoreUs>s.scoreOpponent?'ours':'opponent');s.endedAt=scoutNow()}scoutSyncCompetition(m);scoutSave()};
window.scoutOpenNewMatch=function(){const sel=$('scout-new-linked');if(sel){sel.innerHTML='<option value="">Sin vincular · crear manualmente</option>'+scoutArr(partidosEquipo).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(p=>`<option value="${p.id}">${esc((p.date||'')+' · '+(p.opponent||'Rival')+(p.competition?' · '+p.competition:''))}</option>`).join('')}$('scout-new-date').value=fechaLocalISO();$('scout-new-opponent').value='';$('scout-new-competition').value='';$('scout-new-serving').value='ours';$('scout-new-rotation').value='1';$('scout-new-modal')?.classList.add('open')};
window.scoutCloseNewMatch=function(){$('scout-new-modal')?.classList.remove('open')};
window.scoutLinkedMatchChanged=function(){const id=Number($('scout-new-linked')?.value),p=(partidosEquipo||[]).find(x=>Number(x.id)===id);if(!p)return;$('scout-new-date').value=p.date||fechaLocalISO();$('scout-new-opponent').value=p.opponent||'';$('scout-new-competition').value=p.competition||''};
window.scoutCreateMatch=function(){const opponent=String($('scout-new-opponent')?.value||'').trim();if(!opponent){alert('Escribe el rival.');return}const id=Date.now(),now=scoutNow(),m=scoutNormalizeMatch({id,linkedMatchId:Number($('scout-new-linked')?.value)||null,date:$('scout-new-date')?.value||fechaLocalISO(),opponent,competition:String($('scout-new-competition')?.value||'').trim(),servingTeam:$('scout-new-serving')?.value||'ours',rotationNo:Number($('scout-new-rotation')?.value)||1,opponentRotationNo:1,lineup:scoutEmptyLineup(),sets:[scoutEmptySet(1)],events:[],currentSet:1,status:'live',clockStartedAt:now,clockAccumulatedMs:0,clockMode:'active-only',createdAt:now,updatedAt:now});scoutingMatches.push(m);scoutingActiveId=id;scoutClockResume(m);scoutCloseNewMatch();scoutSave();showView('scout-workspace-v900',botonVista('scout-workspace-v900'));scoutOpenLineup()};
window.scoutOpenLineup=function(){const m=scoutActive();if(!m){alert('Crea primero un scouting.');return}const own=$('scout-lineup-own'),rival=$('scout-lineup-rival');if(own)own.innerHTML=SCOUT_POS.map(pos=>`<label class="scout-lineup-field"><b>${pos.toUpperCase()}</b><select id="scout-own-${pos}"><option value="">— Sin asignar —</option>${(jugadoresEquipo||[]).map(p=>`<option value="${p.id}" ${Number(m.lineup.ours[pos])===Number(p.id)?'selected':''}>${esc((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador'))}</option>`).join('')}</select></label>`).join('');if(rival)rival.innerHTML=SCOUT_POS.map(pos=>`<label class="scout-lineup-field"><b>${pos.toUpperCase()}</b><input id="scout-rival-${pos}" value="${esc(m.lineup.opponent[pos]||'')}" placeholder="Ej. #7 García"></label>`).join('');$('scout-lineup-rotation').value=String(m.rotationNo||1);if($('scout-lineup-rival-rotation'))$('scout-lineup-rival-rotation').value=String(m.opponentRotationNo||1);$('scout-lineup-modal')?.classList.add('open')};
window.scoutCloseLineup=function(){$('scout-lineup-modal')?.classList.remove('open')};
window.scoutSaveLineup=function(){const m=scoutActive();if(!m)return;const ids=SCOUT_POS.map(pos=>Number($(`scout-own-${pos}`)?.value)||null).filter(Boolean);if(ids.length!==6){alert('Debes asignar exactamente seis jugadores a las posiciones P1–P6.');return}if(new Set(ids).size!==ids.length){alert('Un mismo jugador no puede ocupar dos posiciones a la vez.');return}SCOUT_POS.forEach(pos=>{m.lineup.ours[pos]=Number($(`scout-own-${pos}`)?.value)||null;m.lineup.opponent[pos]=String($(`scout-rival-${pos}`)?.value||'').trim()});m.rotationNo=Number($('scout-lineup-rotation')?.value)||1;m.opponentRotationNo=Number($('scout-lineup-rival-rotation')?.value)||1;scoutCloseLineup();scoutRefreshActionPlayers();scoutSave()};
window.scoutOpenSaved=function(id){const m=scoutingMatches.find(x=>Number(x.id)===Number(id));if(!m)return;const prev=scoutActive();if(prev&&Number(prev.id)!==Number(m.id))scoutClockPause(prev);scoutingActiveId=m.id;scoutClockResume(m);scoutSave();showView('scout-workspace-v900',botonVista('scout-workspace-v900'))};
window.scoutDeleteSaved=function(id){const m=scoutingMatches.find(x=>Number(x.id)===Number(id));if(!m)return;if(!confirm(`¿Eliminar definitivamente el scouting contra ${m.opponent}?`))return;scoutingMatches=scoutingMatches.filter(x=>Number(x.id)!==Number(id));if(Number(scoutingActiveId)===Number(id))scoutingActiveId=null;scoutSave()};
function scoutCourtSlot(m,pos,team){let name='Sin asignar',sub='';if(team==='ours'){const id=m?.lineup?.ours?.[pos],p=scoutPlayer(id);name=p?((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador')):'Sin asignar';sub=p&&typeof ppPositions==='function'?ppPositions(p).join(' · '):''}else{name=scoutOpponentLabel(m?.lineup?.opponent?.[pos],pos)}return `<div class="scout-court-slot ${pos}"><b>${pos.toUpperCase()}</b><strong>${esc(name)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function scoutRenderCourt(m){const own=$('scout-own-court'),rival=$('scout-rival-court');if(own)own.innerHTML=SCOUT_POS.map(p=>scoutCourtSlot(m,p,'ours')).join('');if(rival)rival.innerHTML=SCOUT_POS.map(p=>scoutCourtSlot(m,p,'opponent')).join('');if($('scout-own-label'))$('scout-own-label').textContent=EQUIPOS[equipoActivo].nombre;if($('scout-rival-label'))$('scout-rival-label').textContent=m.opponent;if($('scout-own-rotation-label'))$('scout-own-rotation-label').textContent=`Rotación R${m.rotationNo}`;if($('scout-rival-rotation-label'))$('scout-rival-rotation-label').textContent=`Rotación R${m.opponentRotationNo||1}`}
function scoutRenderCurrentActions(m){const box=$('scout-current-actions'),s=scoutSet(m);if($('scout-rally-title'))$('scout-rally-title').textContent=`${s?.scoreUs||0}–${s?.scoreOpponent||0} · ${m.servingTeam==='ours'?'sacamos':'saca el rival'}`;if(!box)return;box.innerHTML=m.liveRally.actions.length?m.liveRally.actions.map(a=>{const player=a.team==='ours'?scoutPlayerName(a.playerId):a.playerLabel||'Rival',zones=a.startZone&&a.endZone?` · ${a.startZone}→${a.endZone}`:'';return `<div class="scout-action-item"><div class="scout-action-code">${esc(a.code)}</div><div class="scout-action-copy"><strong>${esc(player)} · ${esc(SCOUT_SKILLS[a.skill])}</strong><small>${a.team==='ours'?'Nuestro equipo':'Rival'}${zones}</small></div><div class="scout-eval">${esc(a.evaluation)}</div></div>`}).join(''):'<div class="scout-action-empty">Todavía no hay acciones en este rally.</div>'}
function scoutRenderRallies(m){const s=scoutSet(m),box=$('scout-rally-list');if(!box)return;const rallies=scoutArr(s?.rallies).slice().reverse();box.innerHTML=rallies.length?rallies.map(r=>`<div class="scout-rally-item"><div class="scout-rally-score">${r.scoreAfter.us}–${r.scoreAfter.opponent}</div><div class="scout-rally-copy"><strong>R${r.rotationBefore} · ${r.actions.length} acciones</strong><small>${r.servingBefore==='ours'?'Saque nuestro':'Saque rival'}${r.actions.length?' · '+r.actions.map(a=>a.code).join('  '):''}</small></div><span class="scout-rally-winner ${r.winner==='ours'?'ours':''}">${r.winner==='ours'?'Punto nuestro':'Punto rival'}</span></div>`).join(''):'<div class="scout-action-empty">Aún no hay rallies cerrados en este set.</div>';if($('scout-rally-count'))$('scout-rally-count').textContent=`${rallies.length} rallies`}
function scoutRenderSets(m){const box=$('scout-set-list');if(!box)return;box.innerHTML=scoutArr(m.sets).map(s=>`<div class="scout-set-row"><strong>Set ${s.number}</strong><span>${s.finished?(s.winner==='ours'?'Ganado':s.winner==='opponent'?'Perdido':'Cerrado'):'En juego'} · ${s.rallies.length} rallies</span><b>${s.scoreUs}–${s.scoreOpponent}</b></div>`).join('')}
function scoutRenderEnded(m){const s=scoutSet(m),box=$('scout-set-ended');if(!box)return;if(m.status==='finished'){box.classList.remove('hidden');const score=scoutSetsScore(m);box.innerHTML=`<strong>Partido finalizado · ${score.us}–${score.opponent} sets</strong><div class="scout-set-ended-actions"><button class="ghost" onclick="v121UndoRally()">Reabrir último rally</button></div>`;return}if(s?.finished){box.classList.remove('hidden');box.innerHTML=`<strong>Set ${s.number} cerrado · ${s.scoreUs}–${s.scoreOpponent}. ¿Quién realiza el primer saque del siguiente set?</strong><div class="scout-set-ended-actions"><button class="primary" onclick="scoutNextSet('ours')">Sacamos nosotros</button><button class="ghost" onclick="scoutNextSet('opponent')">Saca el rival</button></div>`}else box.classList.add('hidden')}
function scoutRenderSaved(){const box=$('scout-saved-list');if(!box)return;const arr=scoutingMatches.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));box.innerHTML=arr.length?arr.map(m=>{const sc=scoutSetsScore(m),active=Number(m.id)===Number(scoutingActiveId);return `<div class="scout-saved-item"><div><strong>${esc(m.opponent)} · ${sc.us}–${sc.opponent} sets ${active?'· ACTIVO':''}</strong><small>${esc(m.date)}${m.competition?' · '+esc(m.competition):''} · ${m.status==='finished'?'Finalizado':(m.manualSavedAt?'Guardado · editable':'En curso')} · ${scoutActionCount(m)} acciones</small></div><div class="scout-saved-actions"><button class="ghost" onclick="scoutOpenSaved(${m.id})">Abrir</button><button class="ghost download" onclick="return scoutV752ExportOfficialPDF(${m.id})" title="Hoja estadística oficial">PDF hoja</button><button class="ghost download" onclick="scoutExportCSV(${m.id})">CSV</button><button class="danger" onclick="scoutDeleteSaved(${m.id})">Eliminar</button></div></div>`}).join(''):'<div class="scout-action-empty">No hay partidos de scouting guardados.</div>'}
window.scoutRender=function(){const m=scoutActive(),empty=$('scout-no-match'),live=$('scout-live');scoutRenderSaved();if(!m){empty?.classList.remove('hidden');live?.classList.add('hidden');return}empty?.classList.add('hidden');live?.classList.remove('hidden');const s=scoutSet(m),sets=scoutSetsScore(m);if($('scout-match-title'))$('scout-match-title').textContent=`${EQUIPOS[equipoActivo].nombre} vs ${m.opponent}`;if($('scout-match-meta'))$('scout-match-meta').textContent=[m.date,m.competition,m.linkedMatchId?'Vinculado a Competición':'Scouting independiente'].filter(Boolean).join(' · ');const badge=$('scout-status-badge');if(badge){badge.textContent=m.status==='finished'?'FINALIZADO':'EN DIRECTO';badge.className='scout-status-badge '+(m.status==='finished'?'finished':'live')}if($('scout-kpi-set'))$('scout-kpi-set').textContent=String(m.currentSet);if($('scout-kpi-sets'))$('scout-kpi-sets').textContent=`${sets.us}–${sets.opponent} sets`;if($('scout-kpi-score'))$('scout-kpi-score').textContent=`${s?.scoreUs||0}–${s?.scoreOpponent||0}`;if($('scout-kpi-rallies'))$('scout-kpi-rallies').textContent=`${s?.rallies?.length||0} rallies`;if($('scout-kpi-rotation'))$('scout-kpi-rotation').textContent=`R${m.rotationNo}`;if($('scout-kpi-serve'))$('scout-kpi-serve').textContent=`Saque: ${m.servingTeam==='ours'?'nuestro':'rival'}`;if($('scout-kpi-actions'))$('scout-kpi-actions').textContent=scoutActionCount(m);scoutRenderCourt(m);scoutRenderCurrentActions(m);scoutRenderRallies(m);scoutRenderSets(m);scoutRenderEnded(m);scoutRefreshActionPlayers()};

/* V6.1 · Sustituciones, líbero, análisis y timestamps */
window.scoutOpenSubstitution=function(){const m=scoutActive();if(!m){alert('Crea o abre un scouting primero.');return}if(m.status==='finished'){alert('El partido está finalizado.');return}$('scout-sub-team').value='ours';$('scout-sub-type').value='substitution';$('scout-sub-position').value='p1';scoutRefreshSubstitution();$('scout-sub-modal')?.classList.add('open')};
window.scoutCloseSubstitution=function(){$('scout-sub-modal')?.classList.remove('open')};
window.scoutRefreshSubstitution=function(){const m=scoutActive();if(!m)return;const team=$('scout-sub-team')?.value||'ours',pos=$('scout-sub-position')?.value||'p1',own=team==='ours';$('scout-sub-own-wrap')?.classList.toggle('hidden',!own);$('scout-sub-rival-wrap')?.classList.toggle('hidden',own);if(own){const outId=m.lineup.ours[pos],out=scoutPlayer(outId);$('scout-sub-out').value=out?scoutPlayerName(outId):'Sin asignar';const courtIds=new Set(SCOUT_POS.map(p=>Number(m.lineup.ours[p])).filter(Boolean));const candidates=(jugadoresEquipo||[]).filter(p=>!courtIds.has(Number(p.id)));$('scout-sub-in-player').innerHTML=candidates.map(p=>`<option value="${p.id}" ${Number(p.id)===Number(outId)?'':''}>${esc((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador'))}</option>`).join('')}else{$('scout-sub-out').value=scoutOpponentLabel(m.lineup.opponent[pos],pos);$('scout-sub-in-rival').value=''}};
window.scoutApplySubstitution=function(){const m=scoutActive(),set=scoutSet(m);if(!m||!set)return;const team=$('scout-sub-team')?.value||'ours',type=$('scout-sub-type')?.value==='libero'?'libero':'substitution',pos=$('scout-sub-position')?.value||'p1';let event={id:Date.now(),type,team,setNumber:set.number,scoreUs:set.scoreUs,scoreOpponent:set.scoreOpponent,position:pos,createdAt:scoutNow(),scoutMs:scoutElapsed(m)};if(team==='ours'){const outId=Number(m.lineup.ours[pos])||null,inId=Number($('scout-sub-in-player')?.value)||null;if(!inId){alert('Selecciona el jugador que entra.');return}if(inId===outId){alert('El jugador que entra debe ser distinto al que sale.');return}const occupied=SCOUT_POS.some(p=>p!==pos&&Number(m.lineup.ours[p])===inId);if(occupied){alert('Ese jugador ya está en pista en otra posición.');return}event.outPlayerId=outId;event.inPlayerId=inId;event.outLabel=scoutPlayerName(outId);event.inLabel=scoutPlayerName(inId);m.lineup.ours[pos]=inId}else{const inLabel=String($('scout-sub-in-rival')?.value||'').trim();if(!inLabel){alert('Escribe el jugador rival que entra.');return}event.outLabel=scoutOpponentLabel(m.lineup.opponent[pos],pos);event.inLabel=inLabel;m.lineup.opponent[pos]=inLabel}m.events=scoutArr(m.events);m.events.push(event);scoutCloseSubstitution();scoutRefreshActionPlayers();scoutSave()};
function scoutAllRallies(m){return scoutArr(m?.sets).flatMap(s=>scoutArr(s.rallies))}
function scoutPercent(w,t){return t?Math.round(w/t*100):null}
function scoutAnalysis(m){const rallies=scoutAllRallies(m),side=rallies.filter(r=>r.servingBefore==='opponent'),brk=rallies.filter(r=>r.servingBefore==='ours'),sideWon=side.filter(r=>r.winner==='ours').length,breakWon=brk.filter(r=>r.winner==='ours').length;const rotations=Array.from({length:6},(_,i)=>{const no=i+1,s=side.filter(r=>r.rotationBefore===no),b=brk.filter(r=>r.rotationBefore===no);return {no,sideTotal:s.length,sideWon:s.filter(r=>r.winner==='ours').length,breakTotal:b.length,breakWon:b.filter(r=>r.winner==='ours').length,total:s.length+b.length,won:[...s,...b].filter(r=>r.winner==='ours').length}});const opponentRotations=Array.from({length:6},(_,i)=>{const no=i+1,oppSide=brk.filter(r=>(r.opponentRotationBefore||1)===no),oppBreak=side.filter(r=>(r.opponentRotationBefore||1)===no);return {no,sideTotal:oppSide.length,sideWon:oppSide.filter(r=>r.winner==='opponent').length,breakTotal:oppBreak.length,breakWon:oppBreak.filter(r=>r.winner==='opponent').length,total:oppSide.length+oppBreak.length,won:[...oppSide,...oppBreak].filter(r=>r.winner==='opponent').length}});const actions=rallies.flatMap(r=>scoutArr(r.actions)),skills={};Object.keys(SCOUT_SKILLS).forEach(k=>skills[k]={total:0,positive:0,perfect:0,error:0});actions.filter(a=>a.team==='ours').forEach(a=>{const x=skills[a.skill]||(skills[a.skill]={total:0,positive:0,perfect:0,error:0});x.total++;if(a.evaluation==='#'){x.perfect++;x.positive++}else if(a.evaluation==='+')x.positive++;if(a.evaluation==='=')x.error++});return {rallies,actions,sideTotal:side.length,sideWon,breakTotal:brk.length,breakWon,sidePct:scoutPercent(sideWon,side.length),breakPct:scoutPercent(breakWon,brk.length),rotations,opponentRotations,skills}}
function scoutMatchForAnalysis(){const id=Number($('scout-analysis-match')?.value)||Number(scoutingActiveId);return scoutingMatches.find(x=>Number(x.id)===id)||scoutActive()||scoutingMatches[0]||null}
window.scoutRenderHome=function(){const total=$('scout-home-total'),actions=$('scout-home-actions-count'),side=$('scout-home-sideout'),brk=$('scout-home-break'),activeBox=$('scout-home-active'),nextBox=$('scout-home-next'),read=$('scout-home-reading');if(!total)return;total.textContent=scoutingMatches.length;actions.textContent=scoutingMatches.reduce((n,m)=>n+scoutActionCount(m),0);const m=scoutActive()||scoutingMatches.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]||null,a=m?scoutAnalysis(m):null;side.textContent=a&&a.sidePct!=null?a.sidePct+'%':'—';brk.textContent=a&&a.breakPct!=null?a.breakPct+'%':'—';if(activeBox)activeBox.innerHTML=m?`<div class="scout-home-match"><strong>${esc(EQUIPOS[equipoActivo].nombre)} vs ${esc(m.opponent)}</strong><span>${esc(m.date)} · ${m.status==='finished'?'Finalizado':'En curso'} · ${scoutSetsScore(m).us}–${scoutSetsScore(m).opponent} sets</span><button class="primary" onclick="scoutOpenSaved(${m.id})">${m.status==='finished'?'Abrir':'Continuar'}</button></div>`:'<div class="match-empty">No hay scouting todavía. Crea uno desde esta pantalla.</div>';const today=fechaLocalISO(),next=scoutArr(partidosEquipo).filter(x=>x.status==='Programado'&&x.date>=today).sort((x,y)=>String(x.date+x.time).localeCompare(String(y.date+y.time)))[0];if(nextBox)nextBox.innerHTML=next?`<div class="scout-home-match"><strong>vs ${esc(next.opponent)}</strong><span>${esc(next.date)}${next.time?' · '+esc(next.time):''}${next.competition?' · '+esc(next.competition):''}</span><button class="ghost" onclick="abrirPartidoModal(${next.id})">Abrir partido</button></div>`:'<div class="match-empty">No hay próximo partido programado.</div>';if(read){if(!m||!a||!a.rallies.length)read.innerHTML='<div class="match-empty">Registra rallies para generar lectura automática.</div>';else{const worst=a.rotations.filter(r=>r.sideTotal+r.breakTotal>0).sort((x,y)=>((x.won/x.total)||0)-((y.won/y.total)||0))[0];read.innerHTML=`<div class="scout-reading-grid"><div><span>Side-out</span><b>${a.sidePct??'—'}%</b><small>${a.sideWon}/${a.sideTotal} rallies</small></div><div><span>Break point</span><b>${a.breakPct??'—'}%</b><small>${a.breakWon}/${a.breakTotal} rallies</small></div><div><span>Rotación a revisar</span><b>${worst?'R'+worst.no:'—'}</b><small>${worst?worst.won+'/'+worst.total+' puntos ganados':'Sin muestra'}</small></div></div>`}}};
window.scoutRenderAnalysis=function(){const sel=$('scout-analysis-match');if(!sel)return;const current=Number(sel.value)||Number(scoutingActiveId)||Number(scoutingMatches[0]?.id)||0;sel.innerHTML=scoutingMatches.length?scoutingMatches.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(m=>`<option value="${m.id}" ${Number(m.id)===current?'selected':''}>${esc(m.date+' · '+m.opponent)}</option>`).join(''):'<option value="">Sin scoutings</option>';if(current)sel.value=String(current);const m=scoutMatchForAnalysis();const empty='<div class="match-empty">No hay datos suficientes.</div>';if(!m){['scout-analysis-rotations','scout-analysis-skills','scout-analysis-events'].forEach(id=>{if($(id))$(id).innerHTML=empty});return}const a=scoutAnalysis(m);$('scout-analysis-sideout').textContent=a.sidePct!=null?a.sidePct+'%':'—';$('scout-analysis-sideout-copy').textContent=`${a.sideWon}/${a.sideTotal}`;$('scout-analysis-break').textContent=a.breakPct!=null?a.breakPct+'%':'—';$('scout-analysis-break-copy').textContent=`${a.breakWon}/${a.breakTotal}`;$('scout-analysis-rallies').textContent=a.rallies.length;$('scout-analysis-actions').textContent=a.actions.length;$('scout-analysis-rotations').innerHTML=`<div class="scout-rotation-section-title">Nuestro equipo</div><div class="scout-rotation-table"><div class="head"><b>Rotación</b><b>Side-out</b><b>Break</b><b>Puntos</b></div>${a.rotations.map(r=>`<div><strong>R${r.no}</strong><span>${r.sideTotal?(scoutPercent(r.sideWon,r.sideTotal)+'% · '+r.sideWon+'/'+r.sideTotal):'—'}</span><span>${r.breakTotal?(scoutPercent(r.breakWon,r.breakTotal)+'% · '+r.breakWon+'/'+r.breakTotal):'—'}</span><span>${r.total?r.won+'/'+r.total:'—'}</span></div>`).join('')}</div><div class="scout-rotation-section-title rival">Rival</div><div class="scout-rotation-table"><div class="head"><b>Rotación</b><b>Side-out</b><b>Break</b><b>Puntos</b></div>${a.opponentRotations.map(r=>`<div><strong>R${r.no}</strong><span>${r.sideTotal?(scoutPercent(r.sideWon,r.sideTotal)+'% · '+r.sideWon+'/'+r.sideTotal):'—'}</span><span>${r.breakTotal?(scoutPercent(r.breakWon,r.breakTotal)+'% · '+r.breakWon+'/'+r.breakTotal):'—'}</span><span>${r.total?r.won+'/'+r.total:'—'}</span></div>`).join('')}</div>`;const skillRows=Object.entries(a.skills).filter(([,v])=>v.total).map(([k,v])=>`<div class="stats-list-row"><div><strong>${esc(SCOUT_SKILLS[k])}</strong><small>${v.perfect} # · ${v.error} errores</small></div><div class="stats-list-value">${v.total} acc. · ${scoutPercent(v.positive,v.total)||0}% +/#</div></div>`).join('');$('scout-analysis-skills').innerHTML=skillRows||empty;const events=scoutArr(m.events).slice().reverse();$('scout-analysis-events').innerHTML=events.length?events.map(e=>`<div class="scout-event"><b>Set ${e.setNumber} · ${e.scoreUs}–${e.scoreOpponent}</b><span>${e.type==='libero'?'Líbero':'Sustitución'} · ${e.team==='ours'?'Nuestro':'Rival'} · ${String(e.position||'').toUpperCase()}</span><small>${esc(e.outLabel||'—')} → ${esc(e.inLabel||'—')}</small></div>`).join(''):empty};

/* ===== V6.1.1 · ANALÍTICA INDIVIDUAL + EXPORT (base) ===== */
let scoutPlayerDetailContext=null;
function scoutOwnActionName(a){const p=scoutPlayer(a?.playerId);const number=p?.number??a?.playerNumberSnapshot??'',name=p?.name||a?.playerNameSnapshot||`Jugador ${a?.playerId||''}`;return `${number!==''&&number!=null?'#'+number+' · ':''}${name}`.trim()}
function scoutActionRows(m,includeLive=true){if(!m)return[];const rows=[];scoutArr(m.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>scoutArr(r.actions).forEach((a,ai)=>rows.push({matchId:m.id,set:set.number,rallyIndex:ri+1,scoreBefore:`${r.scoreBefore.us}–${r.scoreBefore.opponent}`,scoreAfter:`${r.scoreAfter.us}–${r.scoreAfter.opponent}`,servingBefore:r.servingBefore,rotation:r.rotationBefore,opponentRotation:r.opponentRotationBefore||1,winner:r.winner,actionIndex:ai+1,...a}))));if(includeLive&&m.liveRally?.actions?.length){const set=scoutSet(m),snap=m.liveRally.startSnapshot||scoutCurrentRallySnapshot(m);scoutArr(m.liveRally.actions).forEach((a,ai)=>rows.push({matchId:m.id,set:set?.number||m.currentSet,rallyIndex:(set?.rallies?.length||0)+1,scoreBefore:`${snap.scoreBefore?.us||0}–${snap.scoreBefore?.opponent||0}`,scoreAfter:'En curso',servingBefore:snap.servingBefore||m.servingTeam,rotation:snap.rotationBefore||m.rotationNo,opponentRotation:snap.opponentRotationBefore||m.opponentRotationNo||1,winner:'',actionIndex:ai+1,live:true,...a}))}return rows}
function scoutActionPlayerLabel(a){return a.team==='ours'?scoutOwnActionName(a):String(a.playerLabel||'Rival')}
function scoutPlayerKey(a){return a.team==='ours'?`ours:${Number(a.playerId)||0}`:`opponent:${String(a.playerLabel||'Rival').trim().toLowerCase()}`}
function scoutEmptySkillStat(){return {total:0,evals:{'#':0,'+':0,'!':0,'-':0,'/':0,'=':0}}}
function scoutBuildPlayerStats(m,team='ours'){
 const map=new Map(),rows=scoutActionRows(m,true);
 function ensure(key,label,meta={}){if(!map.has(key)){const skills={};Object.keys(SCOUT_SKILLS).forEach(k=>skills[k]=scoutEmptySkillStat());map.set(key,{key,label,team,total:0,evals:{'#':0,'+':0,'!':0,'-':0,'/':0,'=':0},skills,actions:[],...meta})}return map.get(key)}
 if(team==='ours'){
   const ids=new Set();SCOUT_POS.forEach(pos=>{const id=Number(m?.lineup?.ours?.[pos]);if(id)ids.add(id)});scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach(r=>SCOUT_POS.forEach(pos=>{const id=Number(r?.lineupBefore?.ours?.[pos]);if(id)ids.add(id)})));rows.filter(a=>a.team==='ours'&&a.playerId).forEach(a=>ids.add(Number(a.playerId)));ids.forEach(id=>{const p=scoutPlayer(id);ensure(`ours:${id}`,p?scoutPlayerName(id):`Jugador ${id}`,{playerId:id,number:p?.number??''})})
 }else{
   const labels=new Set();SCOUT_POS.forEach(pos=>{const l=String(m?.lineup?.opponent?.[pos]||'').trim();if(l)labels.add(l)});scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach(r=>SCOUT_POS.forEach(pos=>{const l=String(r?.lineupBefore?.opponent?.[pos]||'').trim();if(l)labels.add(l)})));rows.filter(a=>a.team==='opponent').forEach(a=>labels.add(String(a.playerLabel||'Rival')));labels.forEach(label=>ensure(`opponent:${label.toLowerCase()}`,label,{playerLabel:label}))
 }
 rows.filter(a=>a.team===team).forEach(a=>{const key=scoutPlayerKey(a),st=ensure(key,scoutActionPlayerLabel(a),team==='ours'?{playerId:Number(a.playerId)||null}:{playerLabel:a.playerLabel});st.total++;st.evals[a.evaluation]=(st.evals[a.evaluation]||0)+1;const sk=st.skills[a.skill]||(st.skills[a.skill]=scoutEmptySkillStat());sk.total++;sk.evals[a.evaluation]=(sk.evals[a.evaluation]||0)+1;st.actions.push(a)});
 return [...map.values()].sort((a,b)=>{const an=Number(String(a.label).match(/#(\d+)/)?.[1]||9999),bn=Number(String(b.label).match(/#(\d+)/)?.[1]||9999);return an-bn||a.label.localeCompare(b.label,'es')})
}
function scoutPct(n,d){return d?Math.round(n/d*100):0}
function scoutSkillMetric(st,skill){const x=st.skills[skill]||scoutEmptySkillStat();return {total:x.total,perfect:x.evals['#']||0,positive:(x.evals['#']||0)+(x.evals['+']||0),neutral:x.evals['!']||0,negative:(x.evals['-']||0)+(x.evals['/']||0),veryNegative:x.evals['/']||0,error:x.evals['=']||0,posPct:scoutPct((x.evals['#']||0)+(x.evals['+']||0),x.total),perfPct:scoutPct(x.evals['#']||0,x.total),errPct:scoutPct(x.evals['=']||0,x.total),effPct:x.total?Math.round((((x.evals['#']||0)-(x.evals['=']||0)-(x.evals['/']||0))/x.total)*100):0}}
function scoutFmtMetric(total,text){return total?text:'—'}
window.scoutRenderPlayerAnalytics=function(){const box=$('scout-analysis-players');if(!box)return;const m=scoutMatchForAnalysis(),team=$('scout-player-team-scope')?.value||'ours';if(!m){box.innerHTML='<div class="match-empty">Selecciona un scouting.</div>';return}const players=scoutBuildPlayerStats(m,team);if(!players.length){box.innerHTML='<div class="match-empty">No hay jugadores ni acciones registradas para este equipo.</div>';return}box.innerHTML=`<div class="scout-dv-table-wrap"><table class="scout-dv-table"><thead><tr><th>Jugador</th><th>ACC</th><th>SAQ T</th><th>SAQ #</th><th>SAQ ERR</th><th>REC T</th><th>REC POS%</th><th>REC PERF%</th><th>REC ERR</th><th>ATQ T</th><th>ATQ #</th><th>ATQ ERR</th><th>ATQ EFF%</th><th>BLQ #</th><th>DEF POS%</th><th>COL POS%</th><th></th></tr></thead><tbody>${players.map(st=>{const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),a=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D'),e=scoutSkillMetric(st,'E'),num=String(st.label).match(/#(\d+)/)?.[1]||'—',clean=st.label.replace(/^#\d+\s*·\s*/,'');return `<tr><td><div class="scout-dv-player"><span class="scout-dv-number">${esc(num)}</span><span><b>${esc(clean||st.label)}</b><small>${st.total} acciones registradas</small></span></div></td><td class="scout-dv-main">${st.total}</td><td>${s.total||'—'}</td><td class="scout-dv-good">${s.total?s.perfect:'—'}</td><td class="scout-dv-bad">${s.total?s.error:'—'}</td><td>${r.total||'—'}</td><td class="scout-dv-good">${scoutFmtMetric(r.total,r.posPct+'%')}</td><td>${scoutFmtMetric(r.total,r.perfPct+'%')}</td><td class="scout-dv-bad">${r.total?r.error:'—'}</td><td>${a.total||'—'}</td><td class="scout-dv-good">${a.total?a.perfect:'—'}</td><td class="scout-dv-bad">${a.total?a.error:'—'}</td><td class="${a.effPct>=0?'scout-dv-good':'scout-dv-bad'}">${scoutFmtMetric(a.total,a.effPct+'%')}</td><td class="scout-dv-good">${b.total?b.perfect:'—'}</td><td>${scoutFmtMetric(d.total,d.posPct+'%')}</td><td>${scoutFmtMetric(e.total,e.posPct+'%')}</td><td><button class="ghost scout-dv-open" onclick="scoutOpenPlayerAnalysis('${team}','${encodeURIComponent(st.key)}')">Acciones</button></td></tr>`}).join('')}</tbody></table></div>`};
window.scoutOpenCodeReference=function(){$('scout-code-reference-modal')?.classList.add('open')};window.scoutCloseCodeReference=function(){$('scout-code-reference-modal')?.classList.remove('open')};
window.scoutOpenPlayerAnalysis=function(team,encodedKey){const m=scoutMatchForAnalysis();if(!m)return;const key=decodeURIComponent(encodedKey),st=scoutV61010FullStats(m,team,false).players.find(x=>x.key===key);if(!st)return;scoutPlayerDetailContext={matchId:m.id,team,key};$('scout-player-detail-title').textContent=st.label;$('scout-player-detail-subtitle').textContent=`${EQUIPOS[equipoActivo].nombre} vs ${m.opponent} · ${m.date}`;$('scout-player-detail-skill').value='';$('scout-player-detail-eval').value='';const pos=(st.evals['#']||0)+(st.evals['+']||0),err=st.evals['=']||0;$('scout-player-detail-kpis').innerHTML=`<div class="scout-player-detail-kpi"><span>Acciones</span><b>${st.total}</b></div><div class="scout-player-detail-kpi"><span>Positivas #/+</span><b>${scoutPct(pos,st.total)}%</b></div><div class="scout-player-detail-kpi"><span>Perfectas #</span><b>${scoutPct(st.evals['#']||0,st.total)}%</b></div><div class="scout-player-detail-kpi"><span>Errores =</span><b>${err}</b></div>`;$('scout-player-detail-skills').innerHTML=Object.entries(SCOUT_SKILLS).map(([k,name])=>{const x=scoutSkillMetric(st,k);return `<div class="scout-player-skill-card"><strong>${esc(name)}</strong><div><span>${x.total} acc.</span><span># ${x.perfect}</span><span>+/# ${x.posPct}%</span><span>= ${x.error}</span></div></div>`}).join('');scoutRenderPlayerDetailActions();$('scout-player-detail-modal')?.classList.add('open')};
window.scoutClosePlayerAnalysis=function(){$('scout-player-detail-modal')?.classList.remove('open')};
window.scoutRenderPlayerDetailActions=function(){const box=$('scout-player-detail-actions'),ctx=scoutPlayerDetailContext;if(!box||!ctx)return;const m=scoutingMatches.find(x=>Number(x.id)===Number(ctx.matchId));if(!m)return;const st=scoutV61010FullStats(m,ctx.team,false).players.find(x=>x.key===ctx.key);if(!st)return;const skill=$('scout-player-detail-skill')?.value||'',ev=$('scout-player-detail-eval')?.value||'';const rows=st.actions.filter(a=>(!skill||a.skill===skill)&&(!ev||a.evaluation===ev));box.innerHTML=rows.length?`<table class="scout-action-detail-table"><thead><tr><th>Set</th><th>Marcador</th><th>Rot.</th><th>Fase</th><th>Código</th><th>Fundamento</th><th>Eval.</th><th>Zonas</th><th>Tiempo</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.set}</td><td>${esc(a.scoreBefore)} → ${esc(a.scoreAfter)}</td><td>R${ctx.team==='ours'?a.rotation:a.opponentRotation}</td><td>${ctx.team==='ours'?(a.servingBefore==='ours'?'Break':'Side-out'):(a.servingBefore==='opponent'?'Break':'Side-out')}</td><td><code>${esc(a.code||'')}</code></td><td>${esc(SCOUT_SKILLS[a.skill]||a.skill)}</td><td><b>${esc(a.evaluation)}</b></td><td>${esc(scoutV6108ZoneText(a))}</td><td class="scout-timecode">${scoutFormatTime(a.scoutMs)}</td></tr>`).join('')}</tbody></table>`:'<div class="match-empty">No hay acciones con estos filtros.</div>'};
function scoutFormatTime(ms){const t=Math.max(0,Math.floor((Number(ms)||0)/1000)),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;return `${h?String(h).padStart(2,'0')+':':''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function scoutSafeFilename(v){return String(v||'scouting').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'scouting'}
function scoutExportMatch(id){const selected=Number(id)||Number($('scout-analysis-match')?.value)||Number(scoutingActiveId);return scoutingMatches.find(x=>Number(x.id)===selected)||scoutActive()||null}
function scoutDownloadBlob(content,type,filename){const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function scoutExportRows(m){return scoutActionRows(m,true)}
function scoutCSVCell(v){const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"'}
window.scoutExportCSV=function(id){const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}const rows=scoutExportRows(m),headers=['fecha','equipo','rival','competicion','set','rally','marcador_antes','marcador_despues','saque_antes','rotacion_nuestra','rotacion_rival','secuencia','equipo_accion','jugador','fundamento','valoracion','zona_origen','zona_destino','tipo_saque','fase','combinacion','tempo_ataque','bloqueadores','codigo','tiempo_scout'];const data=rows.map(a=>[m.date,EQUIPOS[equipoActivo].nombre,m.opponent,m.competition,a.set,a.rallyIndex,a.scoreBefore,a.scoreAfter,a.servingBefore==='ours'?'Nuestro':'Rival',a.rotation,a.opponentRotation,a.actionIndex,a.team==='ours'?'Nuestro':'Rival',scoutActionPlayerLabel(a),SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,a.startZone,a.endZone,V620_SERVE_LABELS[a.serveType]||a.serveType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',a.attackTempo||'',a.blockers??'',a.code,scoutFormatTime(a.scoutMs)]);const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_acciones.csv`)};
window.scoutExportJSON=function(id){const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}const payload={format:'Volley Coach Scouting',version:'6.6.0',exportedAt:new Date().toISOString(),team:EQUIPOS[equipoActivo].nombre,scouting:scoutClone(m)};scoutDownloadBlob(JSON.stringify(payload,null,2),'application/json',`${scoutSafeFilename(m.date+'_'+m.opponent)}_scouting.json`)};
window.scoutExportPlayerCSV=function(){const ctx=scoutPlayerDetailContext;if(!ctx)return;const m=scoutingMatches.find(x=>Number(x.id)===Number(ctx.matchId)),st=m?scoutV61010FullStats(m,ctx.team,false).players.find(x=>x.key===ctx.key):null;if(!m||!st)return;const headers=['set','rally','marcador_antes','marcador_despues','rotacion','fase_rally','codigo','fundamento','valoracion','zona_origen','zona_destino','tipo_saque','fase_accion','combinacion','tempo_ataque','bloqueadores','tiempo_scout'];const data=st.actions.map(a=>[a.set,a.rallyIndex,a.scoreBefore,a.scoreAfter,ctx.team==='ours'?a.rotation:a.opponentRotation,ctx.team==='ours'?(a.servingBefore==='ours'?'Break':'Side-out'):(a.servingBefore==='opponent'?'Break':'Side-out'),a.code,SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,a.startZone,a.endZone,V620_SERVE_LABELS[a.serveType]||a.serveType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',a.attackTempo||'',a.blockers??'',scoutFormatTime(a.scoutMs)]);const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+st.label)}_acciones.csv`)};
function scoutExportNotice(show,text='Preparando informe…'){const el=$('scout-export-status');if(!el)return;el.textContent=text;el.classList.toggle('hidden',!show)}
window.scoutExportPDF=async function(id){const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}scoutExportNotice(true,'Preparando informe PDF…');try{const a=scoutAnalysis(m),players=scoutBuildPlayerStats(m,'ours'),sets=scoutArr(m.sets),seq=scoutSequenceSummary(m,'ours'),dist=scoutDistributionRows(m,'ours','');const report=document.createElement('div');report.style.cssText='position:fixed;left:-20000px;top:0;width:1120px;background:#fff;color:#17324d;padding:46px;font-family:Arial,Helvetica,sans-serif;z-index:-1';const score=scoutSetsScore(m);report.innerHTML=`<div style="border-bottom:4px solid #102b43;padding-bottom:20px;margin-bottom:22px"><div style="font-size:12px;font-weight:900;letter-spacing:.16em;color:#718394">VOLLEY COACH · SCOUTING REPORT</div><h1 style="font-size:30px;margin:7px 0;color:#102b43">${esc(EQUIPOS[equipoActivo].nombre)} vs ${esc(m.opponent)}</h1><div style="color:#697b89;font-size:14px">${esc(m.date)}${m.competition?' · '+esc(m.competition):''} · Resultado ${score.us}–${score.opponent} sets</div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px"><div style="padding:14px;border:1px solid #dfe6eb"><small>SIDE-OUT</small><b style="display:block;font-size:25px">${a.sidePct??'—'}%</b><span>${a.sideWon}/${a.sideTotal}</span></div><div style="padding:14px;border:1px solid #dfe6eb"><small>BREAK POINT</small><b style="display:block;font-size:25px">${a.breakPct??'—'}%</b><span>${a.breakWon}/${a.breakTotal}</span></div><div style="padding:14px;border:1px solid #dfe6eb"><small>RALLIES</small><b style="display:block;font-size:25px">${a.rallies.length}</b></div><div style="padding:14px;border:1px solid #dfe6eb"><small>ACCIONES</small><b style="display:block;font-size:25px">${a.actions.length}</b></div></div><h2 style="font-size:18px;border-bottom:1px solid #dfe6eb;padding-bottom:8px">Sets</h2><table style="width:100%;border-collapse:collapse;margin-bottom:22px"><tbody>${sets.map(s=>`<tr><td style="padding:8px;border-bottom:1px solid #edf0f2"><b>Set ${s.number}</b></td><td style="padding:8px;border-bottom:1px solid #edf0f2">${s.finished?(s.winner==='ours'?'Ganado':'Perdido'):'En curso'}</td><td style="padding:8px;border-bottom:1px solid #edf0f2;text-align:right"><b>${s.scoreUs}–${s.scoreOpponent}</b></td></tr>`).join('')}</tbody></table><h2 style="font-size:18px;border-bottom:1px solid #dfe6eb;padding-bottom:8px">Estadística individual</h2><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#102b43;color:#fff"><th style="padding:8px;text-align:left">Jugador</th><th>ACC</th><th>SAQ #/=</th><th>REC POS/PERF</th><th>ATQ #/=/EFF</th><th>BLQ #</th><th>DEF POS</th></tr></thead><tbody>${players.map(st=>{const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),at=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D');return `<tr><td style="padding:8px;border-bottom:1px solid #e9edf0"><b>${esc(st.label)}</b></td><td style="text-align:center;border-bottom:1px solid #e9edf0">${st.total}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${s.total?s.perfect+'/'+s.error:'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${r.total?r.posPct+'% / '+r.perfPct+'%':'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${at.total?at.perfect+'/'+at.error+' / '+at.effPct+'%':'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${b.total?b.perfect:'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${d.total?d.posPct+'%':'—'}</td></tr>`}).join('')}</tbody></table><h2 style="font-size:18px;border-bottom:1px solid #dfe6eb;padding-bottom:8px;margin-top:25px">Rotaciones</h2><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f1f4f6"><th style="padding:8px">Rotación</th><th>Side-out</th><th>Break</th><th>Puntos ganados</th></tr></thead><tbody>${a.rotations.map(r=>`<tr><td style="padding:8px;border-bottom:1px solid #e9edf0;text-align:center"><b>R${r.no}</b></td><td style="text-align:center;border-bottom:1px solid #e9edf0">${r.sideTotal?scoutPercent(r.sideWon,r.sideTotal)+'% ('+r.sideWon+'/'+r.sideTotal+')':'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${r.breakTotal?scoutPercent(r.breakWon,r.breakTotal)+'% ('+r.breakWon+'/'+r.breakTotal+')':'—'}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${r.total?r.won+'/'+r.total:'—'}</td></tr>`).join('')}</tbody></table><h2 style="font-size:18px;border-bottom:1px solid #dfe6eb;padding-bottom:8px;margin-top:25px">Secuencias K1 / K2</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px"><div style="padding:12px;border:1px solid #dfe6eb"><small>K1 · SIDE-OUT</small><b style="display:block;font-size:21px">${seq.k1.length?scoutPercent(seq.k1Won,seq.k1.length)+'%':'—'}</b><span>${seq.k1Won}/${seq.k1.length}</span></div><div style="padding:12px;border:1px solid #dfe6eb"><small>K2 · BREAK</small><b style="display:block;font-size:21px">${seq.k2.length?scoutPercent(seq.k2Won,seq.k2.length)+'%':'—'}</b><span>${seq.k2Won}/${seq.k2.length}</span></div></div><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f1f4f6"><th style="padding:8px">Recepción</th><th>K1 ganados</th><th>Side-out</th></tr></thead><tbody>${seq.byReception.map(x=>`<tr><td style="padding:8px;border-bottom:1px solid #e9edf0;text-align:center"><b>${x.ev}</b></td><td style="text-align:center;border-bottom:1px solid #e9edf0">${x.won}/${x.total}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${x.total?x.pct+'%':'—'}</td></tr>`).join('')}</tbody></table><h2 style="font-size:18px;border-bottom:1px solid #dfe6eb;padding-bottom:8px;margin-top:25px">Distribución del colocador</h2><div style="font-size:11px;color:#526575;margin-bottom:8px">${dist.length} secuencias con destino/combinación codificada.</div><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f1f4f6"><th style="padding:8px;text-align:left">Destino</th><th>Total</th><th>%</th></tr></thead><tbody>${Object.entries(dist.reduce((o,x)=>{o[x.target]=(o[x.target]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td style="padding:8px;border-bottom:1px solid #e9edf0"><b>${esc(V620_COMBO_LABELS[k]||k)}</b></td><td style="text-align:center;border-bottom:1px solid #e9edf0">${v}</td><td style="text-align:center;border-bottom:1px solid #e9edf0">${dist.length?Math.round(v/dist.length*100):0}%</td></tr>`).join('')||'<tr><td colspan="3" style="padding:10px;color:#84919b">Sin distribución codificada.</td></tr>'}</tbody></table><div style="margin-top:28px;padding-top:12px;border-top:1px solid #dfe6eb;color:#84919b;font-size:10px">Generado por Volley Coach · V6.5.0 · Las métricas se basan en los códigos registrados por el staff.</div>`;document.body.appendChild(report);const canvas=await html2canvas(report,{scale:1.45,backgroundColor:'#ffffff',logging:false,useCORS:true});report.remove();const {jsPDF}=window.jspdf,pdf=new jsPDF('p','mm','a4'),margin=10,pageW=210-margin*2,pageH=297-margin*2,imgW=pageW,imgH=canvas.height*imgW/canvas.width,img=canvas.toDataURL('image/jpeg',.92);let y=margin,remaining=imgH;pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH;while(remaining>0){pdf.addPage();y=margin-(imgH-remaining);pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH}pdf.save(`${scoutSafeFilename(m.date+'_'+m.opponent)}_informe_scouting.pdf`)}catch(err){console.error(err);alert('No se ha podido generar el PDF.')}finally{scoutExportNotice(false)}};

/* ===== V7.5.7 · PDF DIRECTO DENTRO DEL MOTOR DE SCOUTING =====
   IMPORTANTE: este código vive en el mismo closure que scoutExportPDF original.
   No depende de bridges ni de módulos PDF externos de V7.5.x. */
const scoutV757LegacyPDF=window.scoutExportPDF;

function v757Pct(n,d){return d?Math.round((Number(n)||0)*100/(Number(d)||0)):0}
function v757Gp(n){n=Number(n)||0;return `${n>0?'+':''}${n}`}
function v757Rows(m,team){return scoutActionRows(m,false).filter(a=>a.team===team)}
function v757SkillRows(rows,skill){
  const a=rows.filter(x=>x.skill===skill),c={'#':0,'+':0,'!':0,'-':0,'/':0,'=':0};
  a.forEach(x=>c[x.evaluation]=(c[x.evaluation]||0)+1);
  const total=a.length,perfect=c['#']||0,positive=perfect+(c['+']||0),error=c['=']||0,blocked=c['/']||0;
  return {total,perfect,positive,error,blocked,posPct:v757Pct(positive,total),excPct:v757Pct(perfect,total),ptsPct:v757Pct(perfect,total),effPct:total?Math.round((perfect-error-blocked)*100/total):0};
}
function v757Impact(m,team,key=null){
  const all=scoutActionRows(m,false),scope=a=>!key||scoutPlayerKey(a)===key,groups=new Map(),gains=[],losses=[];
  all.forEach(a=>{const k=`${a.set}:${a.rallyIndex}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a)});
  groups.forEach(g=>{
    g.sort((a,b)=>(Number(a.actionIndex)||0)-(Number(b.actionIndex)||0));
    const winner=g.find(a=>a.winner)?.winner||'',mine=g.filter(a=>a.team===team);
    if(winner===team){
      const point=[...mine].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));
      if(point&&scope(point))gains.push(point);
    }else if(winner&&winner!==team){
      const last=mine[mine.length-1];
      if(last&&scope(last)&&(last.evaluation==='='||(last.skill==='A'&&last.evaluation==='/')))losses.push(last);
    }
  });
  return {won:gains.length,lost:losses.length,gp:gains.length-losses.length,fp:gains.filter(a=>a.servingBefore===team).length};
}
function v757PlayerStats(m,team){
  /* V9.6.1: player rows and team totals share the same CLOSED-rally dataset. */
  const data=scoutV61010FullStats(m,team,false);
  return data.players.map(st=>{
    const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),a=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D'),e=scoutSkillMetric(st,'E'),p=v757Impact(m,team,st.key);
    return {...st,_s:s,_r:r,_a:a,_b:b,_d:d,_e:e,_p:p};
  });
}
function v757PhaseAttack(seqRows,kind){
  let rows=[];
  if(kind==='positive')rows=seqRows.filter(x=>x.phase==='K1'&&['#','+'].includes(x.receptionEval)&&x.attackEval);
  if(kind==='negative')rows=seqRows.filter(x=>x.phase==='K1'&&!['#','+'].includes(x.receptionEval)&&x.attackEval);
  if(kind==='counter')rows=seqRows.filter(x=>x.phase==='K2'&&x.attackEval);
  const pts=rows.filter(x=>x.attackEval==='#').length,err=rows.filter(x=>x.attackEval==='=').length,blq=rows.filter(x=>x.attackEval==='/').length;
  return {total:rows.length,pts,err,blq,pct:v757Pct(pts,rows.length),eff:rows.length?Math.round((pts-err-blq)*100/rows.length):0};
}
function v757SetStats(m,team,setNo){
  const rows=v757Rows(m,team).filter(a=>Number(a.set)===Number(setNo));
  return {s:v757SkillRows(rows,'S'),r:v757SkillRows(rows,'R'),a:v757SkillRows(rows,'A'),b:v757SkillRows(rows,'B')};
}
function v757Safe(v){return esc(String(v??''))}
function v757TableTeam(m,team){
  const name=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival'),players=v757PlayerStats(m,team),rows=v757Rows(m,team),tot=v757Impact(m,team),
    ts=v757SkillRows(rows,'S'),tr=v757SkillRows(rows,'R'),ta=v757SkillRows(rows,'A'),tb=v757SkillRows(rows,'B');
  const body=players.map(st=>`<tr>
    <td class="name">${v757Safe(st.label)}</td>
    <td>${st._p.won||'·'}</td><td>${st._p.fp||'·'}</td><td class="gp">${v757Gp(st._p.gp)}</td>
    <td>${st._s.total||'·'}</td><td>${st._s.total?st._s.error:'·'}</td><td>${st._s.total?st._s.perfect:'·'}</td>
    <td>${st._r.total||'·'}</td><td>${st._r.total?st._r.error:'·'}</td><td>${st._r.total?st._r.posPct+'%':'·'}</td><td>${st._r.total?'('+st._r.perfPct+'%)':'·'}</td>
    <td>${st._a.total||'·'}</td><td>${st._a.total?st._a.error:'·'}</td><td>${st._a.total?st._a.veryNegative:'·'}</td><td>${st._a.total?st._a.perfect:'·'}</td><td>${st._a.total?st._a.perfPct+'%':'·'}</td>
    <td>${st._b.total?st._b.perfect:'·'}</td>
  </tr>`).join('');
  const sets=scoutArr(m.sets).map(set=>{
    const x=v757SetStats(m,team,set.number);
    const sr=scoutArr(set.rallies),won=sr.filter(r=>r.winner===team);
    const serve=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='S'&&a.evaluation==='#')).length;
    const attack=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='A'&&a.evaluation==='#')).length;
    const block=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='B'&&a.evaluation==='#')).length;
    const oppErr=Math.max(0,won.length-serve-attack-block);
    return `<tr><td><b>Set ${set.number}</b></td><td>${serve||'·'}</td><td>${attack||'·'}</td><td>${block||'·'}</td><td>${oppErr||'·'}</td><td>${x.s.total||'·'}</td><td>${x.s.error||'·'}</td><td>${x.s.perfect||'·'}</td><td>${x.r.total||'·'}</td><td>${x.r.error||'·'}</td><td>${x.r.total?x.r.posPct+'%':'·'}</td><td>${x.r.total?'('+x.r.excPct+'%)':'·'}</td><td>${x.a.total||'·'}</td><td>${x.a.error||'·'}</td><td>${x.a.blocked||'·'}</td><td>${x.a.perfect||'·'}</td><td>${x.a.total?x.a.ptsPct+'%':'·'}</td><td>${x.b.perfect||'·'}</td></tr>`;
  }).join('');
  return `<section class="v757-team"><h2>${v757Safe(name)}</h2>
  <table><thead><tr><th rowspan="2" class="name">Jugador</th><th colspan="3">Puntos</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr>
  <tr><th>Tot</th><th>FP</th><th>G-P</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>Exc%</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead>
  <tbody>${body}<tr class="total"><td class="name">Totales jugadores</td><td>${tot.won}</td><td>${tot.fp}</td><td class="gp">${v757Gp(tot.gp)}</td><td>${ts.total}</td><td>${ts.error}</td><td>${ts.perfect}</td><td>${tr.total}</td><td>${tr.error}</td><td>${tr.total?tr.posPct+'%':'·'}</td><td>${tr.total?'('+tr.excPct+'%)':'·'}</td><td>${ta.total}</td><td>${ta.error}</td><td>${ta.blocked}</td><td>${ta.perfect}</td><td>${ta.total?ta.ptsPct+'%':'·'}</td><td>${tb.perfect}</td></tr></tbody></table>
  <table class="sets"><thead><tr><th></th><th>Saq</th><th>Att</th><th>BLQ</th><th>Er.Ad.</th><th>Saq T</th><th>Err</th><th>Pts</th><th>Rec T</th><th>Err</th><th>Pos%</th><th>Exc%</th><th>Atq T</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>BLQ</th></tr></thead><tbody>${sets}</tbody></table>
  </section>`;
}
function v757OfficialHTML(m){
  const score=scoutSetsScore(m),a=scoutAnalysis(m),ours=scoutSequenceSummary(m,'ours'),opp=scoutSequenceSummary(m,'opponent'),
    op=v757PhaseAttack(ours.rows,'positive'),on=v757PhaseAttack(ours.rows,'negative'),oc=v757PhaseAttack(ours.rows,'counter'),
    rp=v757PhaseAttack(opp.rows,'positive'),rn=v757PhaseAttack(opp.rows,'negative'),rc=v757PhaseAttack(opp.rows,'counter');
  return `<div class="v757-report official"><style>
    .v757-report{box-sizing:border-box;width:1180px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:24px;font-size:9px}
    .v757-head{display:grid;grid-template-columns:1fr 430px;gap:12px}.v757-title h1{font-size:24px;margin:0 0 4px}.v757-title .report{font-size:18px;font-weight:900;border-top:1px solid #555;padding-top:8px;margin-top:12px}
    .v757-info{border:1px solid #555;padding:8px;margin-top:8px;display:grid;grid-template-columns:85px 1fr 85px 1fr;gap:4px 7px}.v757-score{border:1px solid #555}.v757-score .team{display:flex;justify-content:space-between;padding:7px 9px;font-size:15px;font-weight:900;border-bottom:1px solid #aaa}
    .v757-score table,.v757-team table,.phase table{width:100%;border-collapse:collapse;table-layout:fixed}.v757-score th,.v757-score td,.v757-team th,.v757-team td,.phase th,.phase td{border:1px solid #aaa;padding:2.4px;text-align:center}
    .v757-score th,.v757-team th,.phase th{background:#e4e6e7;font-weight:900}.v757-team{border:1px solid #555;margin-top:7px}.v757-team h2{margin:0;padding:4px 6px;background:#d8dadb;font-size:13px}.v757-team table{font-size:7px}.v757-team .name{text-align:left;width:185px;overflow:hidden}.v757-team .total td{font-weight:900;background:#e4e6e7}.v757-team .sets{margin-top:3px;font-size:6.7px}.gp{font-weight:900}
    .phase{display:grid;grid-template-columns:150px 1fr 150px;gap:5px;margin-top:7px}.side,.center{border:1px solid #555;padding:6px}.side h3,.center h3{text-align:center;font-size:9px;margin:0 0 5px}.side .kv{display:grid;grid-template-columns:1fr auto;gap:3px}.rot{display:grid;grid-template-columns:1fr 1fr;margin-top:5px}.rot span{border:1px solid #ccc;padding:2px;display:flex;justify-content:space-between}.phase table{font-size:7px}
    .legend{border:1px solid #777;margin-top:7px;padding:5px;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;font-size:6.5px}.foot{margin-top:5px;font-size:6.5px;color:#666;display:flex;justify-content:space-between}
  </style>
  <div class="v757-head"><div class="v757-title"><h1>${v757Safe(m.competition||'Volley Coach · Informe de partido')}</h1><div>${v757Safe(m.date||'')} ${m.venue?'· '+v757Safe(m.venue):''}</div><div class="report">Informe</div><div class="v757-info"><b>Partido</b><span>VC-${m.id}</span><b>Fecha</b><span>${v757Safe(m.date||'—')}</span><b>Rival</b><span>${v757Safe(m.opponent||'Rival')}</span><b>Estado</b><span>${m.status==='finished'?'Finalizado':'Guardado'}</span></div></div>
  <div class="v757-score"><div class="team"><span>${v757Safe(EQUIPOS[equipoActivo].nombre)}</span><b>${score.us}</b></div><div class="team"><span>${v757Safe(m.opponent||'Rival')}</span><b>${score.opponent}</b></div>
  <table><thead><tr><th>Set</th><th>Marcador</th><th>Ganador</th></tr></thead><tbody>${scoutArr(m.sets).map(s=>`<tr><td>${s.number}</td><td><b>${s.scoreUs}-${s.scoreOpponent}</b></td><td>${s.finished?(s.winner==='ours'?v757Safe(EQUIPOS[equipoActivo].nombre):v757Safe(m.opponent||'Rival')):'—'}</td></tr>`).join('')}</tbody></table></div></div>
  ${v757TableTeam(m,'ours')}${v757TableTeam(m,'opponent')}
  <div class="phase"><div class="side"><h3>${v757Safe(EQUIPOS[equipoActivo].nombre)}</h3><div class="kv"><span>Recepciones</span><b>${ours.k1.length}</b><span>Puntos SO</span><b>${ours.k1Won}</b><span>Cada</span><b>${ours.k1Won?(ours.k1.length/ours.k1Won).toFixed(2):'·'}</b><span>Saques</span><b>${ours.k2.length}</b><span>Puntos FP</span><b>${ours.k2Won}</b></div><div class="rot">${a.rotations.map(r=>`<span><i>R${r.no}</i><b>${r.total?v757Gp(r.won-(r.total-r.won)):'·'}</b></span>`).join('')}</div></div>
  <div class="center"><h3>CAMBIO DE SAQUE / FASE PUNTO</h3><table><thead><tr><th>Situación</th><th colspan="4">${v757Safe(EQUIPOS[equipoActivo].nombre)}</th><th colspan="4">${v757Safe(m.opponent||'Rival')}</th></tr><tr><th></th><th>Tot</th><th>Pts</th><th>Err/Blq</th><th>Pts%</th><th>Tot</th><th>Pts</th><th>Err/Blq</th><th>Pts%</th></tr></thead><tbody>
  <tr><td>1er ataque tras REC +/#</td><td>${op.total}</td><td>${op.pts}</td><td>${op.err}/${op.blq}</td><td>${op.pct}%</td><td>${rp.total}</td><td>${rp.pts}</td><td>${rp.err}/${rp.blq}</td><td>${rp.pct}%</td></tr>
  <tr><td>1er ataque tras REC negativa</td><td>${on.total}</td><td>${on.pts}</td><td>${on.err}/${on.blq}</td><td>${on.pct}%</td><td>${rn.total}</td><td>${rn.pts}</td><td>${rn.err}/${rn.blq}</td><td>${rn.pct}%</td></tr>
  <tr><td>Contraataque (K2)</td><td>${oc.total}</td><td>${oc.pts}</td><td>${oc.err}/${oc.blq}</td><td>${oc.pct}%</td><td>${rc.total}</td><td>${rc.pts}</td><td>${rc.err}/${rc.blq}</td><td>${rc.pct}%</td></tr></tbody></table></div>
  <div class="side"><h3>${v757Safe(m.opponent||'Rival')}</h3><div class="kv"><span>Recepciones</span><b>${opp.k1.length}</b><span>Puntos SO</span><b>${opp.k1Won}</b><span>Cada</span><b>${opp.k1Won?(opp.k1.length/opp.k1Won).toFixed(2):'·'}</b><span>Saques</span><b>${opp.k2.length}</b><span>Puntos FP</span><b>${opp.k2Won}</b></div><div class="rot">${a.opponentRotations.map(r=>`<span><i>R${r.no}</i><b>${r.total?v757Gp(r.won-(r.total-r.won)):'·'}</b></span>`).join('')}</div></div></div>
  <div class="legend"><span><b>FP</b> Fase punto</span><span><b>G-P</b> Ganados - perdidos</span><span><b>Pos%</b> Recepción +/#</span><span><b>Exc%</b> Recepción #</span><span><b>Pts%</b> Puntos / intentos</span></div>
  <div class="foot"><span>Volley Coach V7.5.7 · Hoja estadística</span><span>Datos calculados desde las acciones registradas.</span></div></div>`;
}

function v890PdfRows(m,team,skill){return scoutActionRows(m,false).filter(a=>a.team===team&&(!skill||a.skill===skill))}
function v890PdfPct(n,d){return d?Math.round(Number(n||0)*100/d):0}
function v890PdfTop(rows,getter){
  const map=new Map();rows.forEach(a=>{const k=String(getter(a)||'').trim();if(k)map.set(k,(map.get(k)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
}
function v890PdfOutcome(rows){
  const pts=rows.filter(a=>a.evaluation==='#').length,err=rows.filter(a=>a.evaluation==='=').length,blk=rows.filter(a=>a.evaluation==='/').length;
  return {pts,err,blk,kill:v890PdfPct(pts,rows.length),eff:rows.length?Math.round((pts-err-blk)*100/rows.length):0};
}
function v890PdfRecSubtype(m,team){
  const rows=v890PdfRows(m,team,'R'),labels={L:'On left',R:'On right',LOW:'Low',OH:'Overhand',MID:'Middle line','':'Sin tipo'};
  return ['L','R','LOW','OH','MID',''].map(k=>{
    const rr=rows.filter(a=>String(a.skillSubtype||'')===k),pos=rr.filter(a=>['#','+'].includes(a.evaluation)).length,
      exc=rr.filter(a=>a.evaluation==='#').length,err=rr.filter(a=>a.evaluation==='=').length,so=rr.filter(a=>a.winner===team).length;
    return {key:k,label:labels[k],total:rr.length,pos:v890PdfPct(pos,rr.length),exc:v890PdfPct(exc,rr.length),err,so:v890PdfPct(so,rr.length),
      contact:v890PdfTop(rr,a=>a.contactZone||a.endZone||a.startZone),source:v890PdfTop(rr,a=>a.dvStartZone)};
  }).filter(x=>x.total);
}
function v890PdfSetTempo(m,team){
  const rows=v890PdfRows(m,team,'E'),labs={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other','':'Sin tempo'};
  return ['Q','U','T','M','H','O',''].map(k=>{
    const rr=rows.filter(a=>String(a.setTempo||'')===k),good=rr.filter(a=>['#','+'].includes(a.evaluation)).length,bad=rr.filter(a=>['-','/','='].includes(a.evaluation)).length;
    return {key:k,label:k?`${k} · ${labs[k]}`:labs[k],total:rr.length,use:v890PdfPct(rr.length,rows.length),gp:good-bad,
      call:v890PdfTop(rr,a=>a.setterCall),target:v890PdfTop(rr,a=>a.setTarget),type:v890PdfTop(rr,a=>a.dvSetType)};
  }).filter(x=>x.total);
}
function v890PdfAttackTempo(m,team){
  const rows=v890PdfRows(m,team,'A'),labs={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other','':'Sin tempo'};
  return ['Q','U','T','M','H','O',''].map(k=>{
    const rr=rows.filter(a=>String(a.attackTempo||'')===k),o=v890PdfOutcome(rr);
    return {key:k,label:k?`${k} · ${labs[k]}`:labs[k],total:rr.length,use:v890PdfPct(rr.length,rows.length),...o,
      code:v890PdfTop(rr,a=>a.attackCode),sub:v890PdfTop(rr,a=>a.skillSubtype),dest:v890PdfTop(rr,a=>a.endCone?`C${a.endCone}`:(a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone))};
  }).filter(x=>x.total);
}
function v890PdfAttackCodes(m,team){
  const rows=v890PdfRows(m,team,'A'),map=new Map();rows.forEach(a=>{const k=String(a.attackCode||'Sin code');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890PdfPct(rr.length,rows.length),...v890PdfOutcome(rr),
    tempo:v890PdfTop(rr,a=>a.attackTempo),sub:v890PdfTop(rr,a=>a.skillSubtype),dest:v890PdfTop(rr,a=>a.endCone?`C${a.endCone}`:(a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone))})).sort((a,b)=>b.total-a.total);
}
function v890PdfSimpleGroups(m,team,skill,field){
  const rows=v890PdfRows(m,team,skill),map=new Map();rows.forEach(a=>{const k=String(a?.[field]||'Sin dato');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890PdfPct(rr.length,rows.length),...v890PdfOutcome(rr)})).sort((a,b)=>b.total-a.total);
}


/* ===== V9.6.1 · SCOUTING → ANALYSIS → PDF DATA INTEGRITY ===== */
function v961Rows(m,team,skill=''){return scoutActionRows(m,false).filter(a=>a.team===team&&(!skill||a.skill===skill))}
function v961Pct(n,d){return d?Math.round(Number(n||0)*100/Number(d||0)):0}
function v961Group(rows,getter){
  const map=new Map();scoutArr(rows).forEach(a=>{const key=String(getter(a)||'').trim()||'Sin dato';if(!map.has(key))map.set(key,[]);map.get(key).push(a)});
  return [...map.entries()].map(([key,rr])=>{const pts=rr.filter(a=>a.evaluation==='#').length,err=rr.filter(a=>a.evaluation==='=').length,blk=rr.filter(a=>a.evaluation==='/').length;return {key,total:rr.length,pct:v961Pct(rr.length,rows.length),pts,err,blk,eff:rr.length?Math.round((pts-err-blk)*100/rr.length):0}}).sort((a,b)=>b.total-a.total)
}
function v961Coverage(m,team){
  const all=v961Rows(m,team),spec=[
    ['Código visible',all,a=>a.code],['Jugador identificado',all,a=>a.playerId||a.playerLabel||a.playerNameSnapshot],['Zona/contacto',all,a=>a.contactZone||a.startZone||a.endZone],['Coordenadas exactas',all,a=>a.startCoordinate||a.endCoordinate||a.contactCoordinate],['Fase VC',all,a=>a.phase],['Fase DataVolley',all,a=>a.dvPhase||a.dvPointPhase||a.dvAttackPhase],
    ['Recepción subtype',all.filter(a=>a.skill==='R'),a=>a.skillSubtype],['Saque recibido',all.filter(a=>a.skill==='R'),a=>a.receivedServeType],['Origen recepción DV',all.filter(a=>a.skill==='R'),a=>a.dvStartZone],
    ['Setter call',all.filter(a=>a.skill==='E'),a=>a.setterCall],['Tempo colocación',all.filter(a=>a.skill==='E'),a=>a.setTempo],['Set type',all.filter(a=>a.skill==='E'),a=>a.dvSetType],['Gesto colocación',all.filter(a=>a.skill==='E'),a=>a.skillSubtype],
    ['Attack code',all.filter(a=>a.skill==='A'),a=>a.attackCode],['Tempo ataque',all.filter(a=>a.skill==='A'),a=>a.attackTempo],['Tipo ataque',all.filter(a=>a.skill==='A'),a=>a.skillSubtype],['Dirección ataque',all.filter(a=>a.skill==='A'),a=>a.attackDirection],['Destino zona/cono',all.filter(a=>a.skill==='A'),a=>a.endCone||a.dvEndCone||a.dvEndSubzone||a.endZone],
    ['Bloqueo subtype',all.filter(a=>a.skill==='B'),a=>a.skillSubtype],['Tamaño bloqueo',all.filter(a=>a.skill==='B'),a=>a.blockers],['Atacante objetivo',all.filter(a=>a.skill==='B'),a=>a.blockTargetNumber||a.blockTargetLabel],['Vídeo enlazado',all,a=>a.videoTime!=null||a.videoAction!=null||a.videoStart!=null]
  ];
  return spec.map(([label,rows,getter])=>{const total=rows.length,coded=rows.filter(a=>!!getter(a)).length;return {label,total,coded,pct:v961Pct(coded,total)}})
}
function v961Integrity(m){
  const closed=scoutActionRows(m,false),all=scoutActionRows(m,true),live=all.filter(a=>a.live),issues=[];
  const rawClosed=scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s?.rallies).reduce((x,r)=>x+scoutArr(r?.actions).length,0),0);
  if(closed.length!==rawClosed)issues.push(`Acciones cerradas: filas ${closed.length} ≠ datos ${rawClosed}.`);
  ['ours','opponent'].forEach(team=>{const rows=closed.filter(a=>a.team===team),data=scoutV61010FullStats(m,team,false),playerTotal=data.players.reduce((n,p)=>n+Number(p.total||0),0);if(data.rows.length!==rows.length)issues.push(`${team}: motor análisis ${data.rows.length} ≠ filas ${rows.length}.`);if(playerTotal!==rows.length)issues.push(`${team}: suma jugadores ${playerTotal} ≠ filas ${rows.length}.`)});
  const ids=closed.map(a=>String(a.uid||a.id||'')).filter(Boolean),duplicates=ids.length-new Set(ids).size;if(duplicates)issues.push(`${duplicates} identificadores de acción duplicados.`);
  const invalid=closed.filter(a=>!['ours','opponent'].includes(a.team)||!['S','R','E','A','B','D','F','C'].includes(a.skill)||!['#','+','!','-','/','='].includes(a.evaluation));if(invalid.length)issues.push(`${invalid.length} acciones con team/skill/evaluation inválido.`);
  return {closedActions:closed.length,liveActions:live.length,rallies:scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s?.rallies).length,0),issues,ok:issues.length===0,ours:v961Coverage(m,'ours'),opponent:v961Coverage(m,'opponent')}
}
function v961CoverageTable(rows){return `<table class="tbl"><thead><tr><th>Campo</th><th>Cod.</th><th>Tot</th><th>Cobertura</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.coded}</td><td>${x.total}</td><td>${x.total?x.pct+'%':'—'}</td></tr>`).join('')}</tbody></table>`}
function v961GroupTable(rows,label){return `<table class="tbl"><thead><tr><th>${v757Safe(label)}</th><th>Tot</th><th>Uso</th><th>Pts</th><th>Err</th><th>Blq</th><th>EFF</th></tr></thead><tbody>${rows.slice(0,12).map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.pct}%</td><td>${x.pts}</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td></tr>`).join('')||'<tr><td colspan="7">Sin datos codificados.</td></tr>'}</tbody></table>`}

function v757ProPages(m){
  const a=scoutAnalysis(m),score=scoutSetsScore(m),ours=v757Rows(m,'ours'),rival=v757Rows(m,'opponent'),
    os=v757SkillRows(ours,'S'),or=v757SkillRows(ours,'R'),oa=v757SkillRows(ours,'A'),ob=v757SkillRows(ours,'B'),
    rs=v757SkillRows(rival,'S'),rr=v757SkillRows(rival,'R'),ra=v757SkillRows(rival,'A'),rb=v757SkillRows(rival,'B'),
    seqO=scoutSequenceSummary(m,'ours'),seqR=scoutSequenceSummary(m,'opponent'),
    po=v757PlayerStats(m,'ours'),pr=v757PlayerStats(m,'opponent');
  const best=[...a.rotations].filter(r=>r.total>=3).sort((x,y)=>(y.won/y.total)-(x.won/x.total))[0];
  const worst=[...a.rotations].filter(r=>r.total>=3).sort((x,y)=>(x.won/x.total)-(y.won/y.total))[0];
  const leader=[...po].filter(x=>x.total>=3).sort((x,y)=>y._p.gp-x._p.gp)[0];
  const insights=[
    `Side-out: ${a.sideTotal?a.sidePct+'% ('+a.sideWon+'/'+a.sideTotal+')':'sin muestra suficiente'}.`,
    `Break point: ${a.breakTotal?a.breakPct+'% ('+a.breakWon+'/'+a.breakTotal+')':'sin muestra suficiente'}.`,
    `Recepción propia: ${or.total?or.posPct+'% positiva y '+or.perfPct+'% perfecta sobre '+or.total:'sin datos'}. Rival: ${rr.total?rr.posPct+'% positiva sobre '+rr.total:'sin datos'}.`,
    `Ataque propio: ${oa.total?oa.perfPct+'% de punto, EFF '+oa.effPct+'% ('+oa.perfect+'/'+oa.total+')':'sin datos'}. Rival: ${ra.total?ra.perfPct+'% de punto, EFF '+ra.effPct+'%':'sin datos'}.`,
    best?`Rotación más eficaz con muestra ≥3: R${best.no}, ${v757Pct(best.won,best.total)}% (${best.won}/${best.total}).`:'No hay ninguna rotación con muestra mínima de 3 rallies.',
    worst&&best&&worst.no!==best.no?`Rotación más exigida: R${worst.no}, ${v757Pct(worst.won,worst.total)}% (${worst.won}/${worst.total}).`:'',
    leader?`Mayor G-P individual: ${leader.label}, ${v757Gp(leader._p.gp)}.`:''
  ].filter(Boolean);
  const common=`<style>.v757-pro{box-sizing:border-box;width:1120px;min-height:1500px;background:#fff;color:#17324d;font-family:Arial,Helvetica,sans-serif;padding:42px}.head{display:flex;justify-content:space-between;border-bottom:4px solid #102b43;padding-bottom:14px}.head h1{font-size:28px;margin:4px 0}.k{font-size:9px;font-weight:900;letter-spacing:.12em;color:#718394}.score{text-align:right}.score b{display:block;font-size:28px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.card{border:1px solid #dfe5e9;background:#f8fafb;padding:12px}.card span{display:block;font-size:8px;text-transform:uppercase;color:#72818d;font-weight:900}.card b{display:block;font-size:21px;margin:4px 0}.card small{font-size:8px;color:#7d8993}h2{font-size:16px;border-bottom:2px solid #294d69;padding-bottom:6px;margin-top:20px}.tbl{width:100%;border-collapse:collapse;font-size:9px}.tbl th,.tbl td{border-bottom:1px solid #e2e7ea;padding:6px;text-align:center}.tbl th{background:#edf2f5;font-size:8px}.tbl th:first-child,.tbl td:first-child{text-align:left}.ins{display:grid;gap:7px}.ins div{border:1px solid #dfe5e9;border-left:4px solid #597b95;padding:9px;background:#fafbfc;font-size:10px}.twocol{display:grid;grid-template-columns:1fr 1fr;gap:12px}.foot{margin-top:25px;border-top:1px solid #dfe5e9;padding-top:7px;color:#788793;font-size:8px;display:flex;justify-content:space-between}</style>`;
  const totalPages=7;
  const head=(title,page)=>`<div class="head"><div><div class="k">VOLLEY COACH · PROFESSIONAL MATCH REPORT · V8.9</div><h1>${v757Safe(title)}</h1><div>${v757Safe(EQUIPOS[equipoActivo].nombre)} vs ${v757Safe(m.opponent||'Rival')} · ${v757Safe(m.date||'')}</div></div><div class="score"><b>${score.us}-${score.opponent}</b><span>${page}/${totalPages}</span></div></div>`;
  const playerTable=(list)=>`<table class="tbl"><thead><tr><th>Jugador</th><th>PTS</th><th>FP</th><th>G-P</th><th>SAQ #/=</th><th>REC</th><th>POS%</th><th>EXC%</th><th>ATQ</th><th>PTS</th><th>EFF%</th><th>BLQ</th></tr></thead><tbody>${list.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x._p.won}</td><td>${x._p.fp}</td><td><b>${v757Gp(x._p.gp)}</b></td><td>${x._s.perfect}/${x._s.error}</td><td>${x._r.total||'·'}</td><td>${x._r.total?x._r.posPct+'%':'·'}</td><td>${x._r.total?x._r.perfPct+'%':'·'}</td><td>${x._a.total||'·'}</td><td>${x._a.perfect||'·'}</td><td>${x._a.total?x._a.effPct+'%':'·'}</td><td>${x._b.perfect||'·'}</td></tr>`).join('')}</tbody></table>`;
  const rotTable=(rot)=>`<table class="tbl"><thead><tr><th>Rot.</th><th>Rallies</th><th>Ganados</th><th>Global%</th><th>Side-out</th><th>Break</th></tr></thead><tbody>${rot.map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.total}</td><td>${r.won}</td><td>${r.total?v757Pct(r.won,r.total)+'%':'·'}</td><td>${r.sideTotal?v757Pct(r.sideWon,r.sideTotal)+'% ('+r.sideWon+'/'+r.sideTotal+')':'·'}</td><td>${r.breakTotal?v757Pct(r.breakWon,r.breakTotal)+'% ('+r.breakWon+'/'+r.breakTotal+')':'·'}</td></tr>`).join('')}</tbody></table>`;
  const page1=`<div class="v757-pro">${common}${head('Informe técnico del partido',1)}<div class="cards">
  <div class="card"><span>K1 Side-out</span><b>${a.sideTotal?a.sidePct+'%':'—'}</b><small>${a.sideWon}/${a.sideTotal}</small></div>
  <div class="card"><span>K2 Break</span><b>${a.breakTotal?a.breakPct+'%':'—'}</b><small>${a.breakWon}/${a.breakTotal}</small></div>
  <div class="card"><span>Recepción +/#</span><b>${or.total?or.posPct+'%':'—'}</b><small>${or.total} recepciones · Exc ${or.total?or.perfPct+'%':'—'}</small></div>
  <div class="card"><span>Ataque</span><b>${oa.total?oa.perfPct+'%':'—'}</b><small>EFF ${oa.total?oa.effPct+'%':'—'} · ${oa.perfect}/${oa.total}</small></div></div>
  <h2>Lectura ejecutiva</h2><div class="ins">${insights.map(x=>`<div>${v757Safe(x)}</div>`).join('')}</div>
  <h2>Evolución por set</h2><table class="tbl"><thead><tr><th>Set</th><th>Marcador</th><th>SAQ ace/err</th><th>REC Pos</th><th>REC Exc</th><th>ATQ Pts</th><th>ATQ EFF</th><th>BLQ</th></tr></thead><tbody>${scoutArr(m.sets).map(s=>{const x=v757SetStats(m,'ours',s.number);return `<tr><td><b>S${s.number}</b></td><td>${s.scoreUs}-${s.scoreOpponent}</td><td>${x.s.perfect}/${x.s.error}</td><td>${x.r.total?x.r.posPct+'%':'·'}</td><td>${x.r.total?x.r.excPct+'%':'·'}</td><td>${x.a.total?x.a.ptsPct+'%':'·'}</td><td>${x.a.total?x.a.effPct+'%':'·'}</td><td>${x.b.perfect}</td></tr>`}).join('')}</tbody></table><div class="foot"><span>${a.rallies.length} rallies · ${a.actions.length} acciones</span><span>Página 1 · Resumen ejecutivo</span></div></div>`;
  const page2=`<div class="v757-pro">${common}${head('Rendimiento individual',2)}<h2>${v757Safe(EQUIPOS[equipoActivo].nombre)}</h2>${playerTable(po)}<h2>${v757Safe(m.opponent||'Rival')}</h2>${playerTable(pr)}<div class="foot"><span>G-P = puntos directos - pérdidas terminales atribuibles.</span><span>Página 2 · Jugadores</span></div></div>`;
  const pO=[v757PhaseAttack(seqO.rows,'positive'),v757PhaseAttack(seqO.rows,'negative'),v757PhaseAttack(seqO.rows,'counter')],pR=[v757PhaseAttack(seqR.rows,'positive'),v757PhaseAttack(seqR.rows,'negative'),v757PhaseAttack(seqR.rows,'counter')],labs=['1er ataque tras recepción +/#','1er ataque tras recepción negativa','Contraataque (K2)'];
  const page3=`<div class="v757-pro">${common}${head('K1, K2 y rotaciones',3)}<div class="twocol"><div><h2>Nuestras rotaciones</h2>${rotTable(a.rotations)}</div><div><h2>Rotaciones rival</h2>${rotTable(a.opponentRotations)}</div></div><h2>Ataque según fase</h2><table class="tbl"><thead><tr><th>Fase</th><th>N Tot</th><th>N Pts</th><th>N Err</th><th>N Blq</th><th>N Pts%</th><th>R Tot</th><th>R Pts</th><th>R Err</th><th>R Blq</th><th>R Pts%</th></tr></thead><tbody>${labs.map((l,i)=>`<tr><td><b>${v757Safe(l)}</b></td><td>${pO[i].total}</td><td>${pO[i].pts}</td><td>${pO[i].err}</td><td>${pO[i].blq}</td><td>${pO[i].pct}%</td><td>${pR[i].total}</td><td>${pR[i].pts}</td><td>${pR[i].err}</td><td>${pR[i].blq}</td><td>${pR[i].pct}%</td></tr>`).join('')}</tbody></table><h2>K1 por calidad de recepción</h2><table class="tbl"><thead><tr><th>Recepción</th><th>Rallies</th><th>K1 ganados</th><th>Side-out</th></tr></thead><tbody>${seqO.byReception.map(x=>`<tr><td><b>${x.ev}</b></td><td>${x.total}</td><td>${x.won}</td><td>${x.total?x.pct+'%':'·'}</td></tr>`).join('')}</tbody></table><div class="foot"><span>K1 = recepción · K2 = saque.</span><span>Página 3 · Fases y rotaciones</span></div></div>`;
  const dist=scoutDistributionRows(m,'ours',''),counts={};dist.forEach(x=>{const k=x.target||'Sin destino';counts[k]=(counts[k]||0)+1});
  const page4=`<div class="v757-pro">${common}${head('Distribución y calidad de datos',4)}<div class="twocol"><div><h2>Distribución del colocador</h2><table class="tbl"><thead><tr><th>Destino / combinación</th><th>Total</th><th>Uso</th></tr></thead><tbody>${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td><b>${v757Safe(k)}</b></td><td>${v}</td><td>${dist.length?v757Pct(v,dist.length):0}%</td></tr>`).join('')||'<tr><td colspan="3">Sin distribución codificada.</td></tr>'}</tbody></table></div><div><h2>Comparativa de fundamentos</h2><table class="tbl"><thead><tr><th>Fundamento</th><th>Nosotros</th><th>Rival</th></tr></thead><tbody><tr><td><b>Saque ace/error</b></td><td>${os.perfect}/${os.error}</td><td>${rs.perfect}/${rs.error}</td></tr><tr><td><b>Recepción Pos%</b></td><td>${or.total?or.posPct+'%':'·'}</td><td>${rr.total?rr.posPct+'%':'·'}</td></tr><tr><td><b>Recepción Exc%</b></td><td>${or.total?or.perfPct+'%':'·'}</td><td>${rr.total?rr.perfPct+'%':'·'}</td></tr><tr><td><b>Ataque Pts%</b></td><td>${oa.total?oa.perfPct+'%':'·'}</td><td>${ra.total?ra.perfPct+'%':'·'}</td></tr><tr><td><b>Ataque EFF%</b></td><td>${oa.total?oa.effPct+'%':'·'}</td><td>${ra.total?ra.effPct+'%':'·'}</td></tr><tr><td><b>Bloqueos punto</b></td><td>${ob.perfect}</td><td>${rb.perfect}</td></tr></tbody></table></div></div><h2>Calidad de la muestra</h2><div class="ins"><div>Rallies cerrados: <b>${a.rallies.length}</b>. Acciones registradas: <b>${a.actions.length}</b>.</div><div>Las cifras que no tienen acciones registradas se muestran como “·” o “—”; no se convierten en cero.</div><div>Para interpretar rotaciones se recomienda una muestra mínima de 3 rallies y, preferiblemente, varias repeticiones por set.</div></div><div class="foot"><span>Informe descriptivo basado en el scouting registrado.</span><span>Página 4 · Distribución y metodología</span></div></div>`;
  const recO=v890PdfRecSubtype(m,'ours'),recR=v890PdfRecSubtype(m,'opponent'),
    setO=v890PdfSetTempo(m,'ours'),setR=v890PdfSetTempo(m,'opponent'),
    atkO=v890PdfAttackTempo(m,'ours'),atkR=v890PdfAttackTempo(m,'opponent'),
    codeO=v890PdfAttackCodes(m,'ours'),codeR=v890PdfAttackCodes(m,'opponent'),
    atkTypeO=v890PdfSimpleGroups(m,'ours','A','skillSubtype'),atkTypeR=v890PdfSimpleGroups(m,'opponent','A','skillSubtype'),
    setGestureO=v890PdfSimpleGroups(m,'ours','E','skillSubtype'),setGestureR=v890PdfSimpleGroups(m,'opponent','E','skillSubtype'),
    blockO=v890PdfSimpleGroups(m,'ours','B','skillSubtype'),blockR=v890PdfSimpleGroups(m,'opponent','B','skillSubtype');

  const recTable=(rows)=>`<table class="tbl"><thead><tr><th>Tipo recepción</th><th>Tot</th><th>Pos%</th><th>Exc%</th><th>Err</th><th>SO%</th><th>Contacto</th><th>Origen DV</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.pos}%</td><td>${x.exc}%</td><td>${x.err}</td><td>${x.so}%</td><td>${x.contact==='—'?'—':'Z'+v757Safe(x.contact)}</td><td>${x.source==='—'?'—':'Z'+v757Safe(x.source)}</td></tr>`).join('')||'<tr><td colspan="8">Sin subtype de recepción codificado.</td></tr>'}</tbody></table>`;
  const setTempoTable=(rows)=>`<table class="tbl"><thead><tr><th>Tempo</th><th>Tot</th><th>Uso</th><th>G-P téc.</th><th>Set code</th><th>Destino VC</th><th>Set type</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${v757Gp(x.gp)}</td><td>${v757Safe(x.call)}</td><td>${v757Safe(x.target)}</td><td>${v757Safe(x.type)}</td></tr>`).join('')||'<tr><td colspan="7">Sin tempo de colocación codificado.</td></tr>'}</tbody></table>`;
  const attackTempoTable=(rows)=>`<table class="tbl"><thead><tr><th>Tempo</th><th>Tot</th><th>Uso</th><th>Kill%</th><th>Err</th><th>Blq</th><th>EFF</th><th>Code</th><th>Tipo</th><th>Destino</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.kill}%</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td><td>${v757Safe(x.code)}</td><td>${v757Safe(x.sub)}</td><td>${v757Safe(x.dest)}</td></tr>`).join('')||'<tr><td colspan="10">Sin tempo de ataque codificado.</td></tr>'}</tbody></table>`;
  const codeTable=(rows)=>`<table class="tbl"><thead><tr><th>Attack code</th><th>Tot</th><th>Uso</th><th>Kill%</th><th>Err</th><th>Blq</th><th>EFF</th><th>Tempo</th><th>Tipo</th><th>Destino</th></tr></thead><tbody>${rows.slice(0,14).map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.kill}%</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td><td>${v757Safe(x.tempo)}</td><td>${v757Safe(x.sub)}</td><td>${v757Safe(x.dest)}</td></tr>`).join('')||'<tr><td colspan="10">Sin attack_code codificado.</td></tr>'}</tbody></table>`;
  const simpleTable=(rows,label)=>`<table class="tbl"><thead><tr><th>${v757Safe(label)}</th><th>Tot</th><th>Uso</th><th>Pts</th><th>Err</th><th>Blq</th><th>EFF</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.pts}</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td></tr>`).join('')||'<tr><td colspan="7">Sin datos codificados.</td></tr>'}</tbody></table>`;

  const page5=`<div class="v757-pro">${common}${head('DataVolley · recepción y colocación',5)}
    <h2>${v757Safe(EQUIPOS[equipoActivo].nombre)} · tipo de recepción</h2>${recTable(recO)}
    <h2>${v757Safe(m.opponent||'Rival')} · tipo de recepción</h2>${recTable(recR)}
    <div class="twocol"><div><h2>Nuestra colocación · tempo</h2>${setTempoTable(setO)}</div><div><h2>Colocación rival · tempo</h2>${setTempoTable(setR)}</div></div>
    <div class="twocol"><div><h2>Nuestro gesto de colocación</h2>${simpleTable(setGestureO,'Gesto')}</div><div><h2>Gesto rival</h2>${simpleTable(setGestureR,'Gesto')}</div></div>
    <div class="foot"><span>Recepción: subtype + contacto físico + origen DataVolley.</span><span>Página 5 · Recepción y colocación</span></div></div>`;

  const page6=`<div class="v757-pro">${common}${head('DataVolley · ataque, bloqueo y destino',6)}
    <div class="twocol"><div><h2>Nuestro ataque · tempo</h2>${attackTempoTable(atkO)}</div><div><h2>Ataque rival · tempo</h2>${attackTempoTable(atkR)}</div></div>
    <h2>Nuestros attack codes</h2>${codeTable(codeO)}
    <h2>Attack codes rival</h2>${codeTable(codeR)}
    <div class="twocol"><div><h2>Tipo de ataque propio</h2>${simpleTable(atkTypeO,'Skill subtype')}</div><div><h2>Tipo de ataque rival</h2>${simpleTable(atkTypeR,'Skill subtype')}</div></div>
    <div class="twocol"><div><h2>Bloqueo propio · subtype</h2>${simpleTable(blockO,'Block subtype')}</div><div><h2>Bloqueo rival · subtype</h2>${simpleTable(blockR,'Block subtype')}</div></div>
    <div class="ins"><div><b>Destinos:</b> los ataques por zonas conservan origen→destino y los ataques por conos aparecen como C1–C8.</div><div><b>Campos no codificados:</b> se muestran como “Sin dato”; Volley Coach no los infiere artificialmente.</div></div>
    <div class="foot"><span>Tempo Q/U/T/M/H/O · attack_code · skill_subtype · zonas/conos.</span><span>Página 6 · Ataque y bloqueo DataVolley</span></div></div>`;
  const audit=v961Integrity(m),dirsO=v961Group(v961Rows(m,'ours','A'),a=>a.attackDirection),dirsR=v961Group(v961Rows(m,'opponent','A'),a=>a.attackDirection),locO=v961Group(v961Rows(m,'ours','A'),a=>a.endCone?`Cono C${a.endCone}`:(a.dvEndCone?`Cono C${a.dvEndCone}`:(a.dvEndSubzone?`Z${a.dvEndZone||a.endZone}${a.dvEndSubzone}`:(a.endZone?`Z${a.endZone}`:'')))),locR=v961Group(v961Rows(m,'opponent','A'),a=>a.endCone?`Cono C${a.endCone}`:(a.dvEndCone?`Cono C${a.dvEndCone}`:(a.dvEndSubzone?`Z${a.dvEndZone||a.endZone}${a.dvEndSubzone}`:(a.endZone?`Z${a.endZone}`:'')))),blkComboO=v961Group(v961Rows(m,'ours','B'),a=>`${a.skillSubtype||'Sin subtype'} · ${a.blockers?`${a.blockers}B`:'sin tamaño'} · ${a.blockTargetNumber?`vs #${a.blockTargetNumber}`:(a.blockTargetLabel?`vs ${a.blockTargetLabel}`:'sin objetivo')}`),blkComboR=v961Group(v961Rows(m,'opponent','B'),a=>`${a.skillSubtype||'Sin subtype'} · ${a.blockers?`${a.blockers}B`:'sin tamaño'} · ${a.blockTargetNumber?`vs #${a.blockTargetNumber}`:(a.blockTargetLabel?`vs ${a.blockTargetLabel}`:'sin objetivo')}`),phaseO=v961Group(v961Rows(m,'ours'),a=>[a.dvPointPhase,a.dvPhase,a.dvAttackPhase].filter(Boolean).join(' / ')),phaseR=v961Group(v961Rows(m,'opponent'),a=>[a.dvPointPhase,a.dvPhase,a.dvAttackPhase].filter(Boolean).join(' / '));
  const page7=`<div class="v757-pro">${common}${head('Trazabilidad y cobertura técnica',7)}<div class="cards"><div class="card"><span>Rallies cerrados</span><b>${audit.rallies}</b><small>base oficial</small></div><div class="card"><span>Acciones cerradas</span><b>${audit.closedActions}</b><small>análisis + PDF</small></div><div class="card"><span>Rally en curso</span><b>${audit.liveActions}</b><small>pendientes</small></div><div class="card"><span>Integridad</span><b>${audit.ok?'OK':'REVISAR'}</b><small>${audit.issues.length} incidencias</small></div></div><div class="twocol"><div><h2>${v757Safe(EQUIPOS[equipoActivo].nombre)} · cobertura</h2>${v961CoverageTable(audit.ours)}</div><div><h2>${v757Safe(m.opponent||'Rival')} · cobertura</h2>${v961CoverageTable(audit.opponent)}</div></div><div class="twocol"><div><h2>Dirección de ataque propia</h2>${v961GroupTable(dirsO,'Dirección')}</div><div><h2>Dirección de ataque rival</h2>${v961GroupTable(dirsR,'Dirección')}</div></div><div class="twocol"><div><h2>Destino zona / subzona / cono</h2>${v961GroupTable(locO,'Destino')}</div><div><h2>Destino rival</h2>${v961GroupTable(locR,'Destino')}</div></div><div class="twocol"><div><h2>Bloqueo subtype / tamaño / objetivo</h2>${v961GroupTable(blkComboO,'Bloqueo')}</div><div><h2>Bloqueo rival</h2>${v961GroupTable(blkComboR,'Bloqueo')}</div></div><div class="twocol"><div><h2>Fases DataVolley</h2>${v961GroupTable(phaseO,'Point / Phase / Attack')}</div><div><h2>Fases rival</h2>${v961GroupTable(phaseR,'Point / Phase / Attack')}</div></div><div class="ins">${audit.issues.length?audit.issues.map(x=>`<div><b>REVISAR:</b> ${v757Safe(x)}</div>`).join(''):`<div><b>Integridad verificada:</b> scouting, análisis individual y PDF comparten la misma base de acciones cerradas.</div>`}<div><b>Criterio:</b> el rally en curso se conserva en Scouting/JSON/CSV acciones, pero no entra en cifras oficiales hasta cerrar el punto.</div></div><div class="foot"><span>Código · zonas · coordenadas · subtype · tempo · set/attack code · dirección · conos · bloqueo · fases · vídeo.</span><span>Página 7 · Trazabilidad</span></div></div>`;
  return [page1,page2,page3,page4,page5,page6,page7];
}
async function v757Canvas(markup,width=1180,scale=1.35){
  const wrap=document.createElement('div');wrap.style.cssText=`position:fixed;left:-30000px;top:0;width:${width}px;background:#fff;z-index:-1`;wrap.innerHTML=markup;document.body.appendChild(wrap);
  try{return await html2canvas(wrap.firstElementChild||wrap,{scale,backgroundColor:'#ffffff',logging:false,useCORS:true})}finally{wrap.remove()}
}
function v757DownloadJsPDF(pdf,filename){
  try{
    const blob=pdf.output('blob');
    scoutDownloadBlob(blob,'application/pdf',filename);
  }catch(err){
    console.warn('V7.5.7 blob download fallback',err);
    pdf.save(filename);
  }
}
window.scoutV757ExportOfficialPDF=async function(id){
  const m=scoutExportMatch(id);
  if(!m){alert('No hay scouting seleccionado.');return false}
  if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF. Comprueba la conexión y recarga la página.');return false}
  scoutExportNotice(true,'Generando hoja estadística…');
  try{
    const canvas=await v757Canvas(v757OfficialHTML(m),1180,1.45),{jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),margin=4,ratio=Math.min((W-margin*2)/canvas.width,(H-margin*2)/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg',.93),'JPEG',(W-w)/2,(H-h)/2,w,h,undefined,'FAST');
    v757DownloadJsPDF(pdf,`${scoutSafeFilename((m.date||'partido')+'_'+(m.opponent||'rival'))}_Hoja_Oficial_V961.pdf`);
    return false;
  }catch(err){
    console.error('V7.5.7 hoja oficial',err);
    try{await scoutV757LegacyPDF(id)}catch(_){}
    alert('La hoja profesional ha encontrado un error. Se ha intentado generar automáticamente el PDF clásico como respaldo.');
    return false;
  }finally{scoutExportNotice(false)}
};
window.scoutV757ExportAnalysisPDF=async function(id){
  const m=scoutExportMatch(id);
  if(!m){alert('No hay scouting seleccionado.');return false}
  if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF. Comprueba la conexión y recarga la página.');return false}
  scoutExportNotice(true,'Generando análisis profesional…');
  try{
    const pages=v757ProPages(m),{jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    for(let i=0;i<pages.length;i++){
      scoutExportNotice(true,`Generando análisis profesional · ${i+1}/${pages.length}…`);
      const canvas=await v757Canvas(pages[i],1120,1.35);
      if(i)pdf.addPage('a4','portrait');
      const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),margin=6,ratio=Math.min((W-margin*2)/canvas.width,(H-margin*2)/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
      pdf.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',(W-w)/2,(H-h)/2,w,h,undefined,'FAST');
    }
    v757DownloadJsPDF(pdf,`${scoutSafeFilename((m.date||'partido')+'_'+(m.opponent||'rival'))}_Analisis_Pro_V961.pdf`);
    return false;
  }catch(err){
    console.error('V7.5.7 análisis Pro',err);
    try{await scoutV757LegacyPDF(id)}catch(_){}
    alert('El análisis Pro ha encontrado un error. Se ha intentado generar automáticamente el PDF clásico como respaldo.');
    return false;
  }finally{scoutExportNotice(false)}
};
window.scoutV757PDFDirectDiagnostics=function(){
  const m=scoutExportMatch();
  return {version:'7.5.7',insideScoutEngine:true,match:m?{id:m.id,date:m.date,opponent:m.opponent}:null,html2canvas:typeof window.html2canvas,jsPDF:typeof window.jspdf?.jsPDF,legacy:typeof scoutV757LegacyPDF,official:typeof window.scoutV757ExportOfficialPDF,analysis:typeof window.scoutV757ExportAnalysisPDF};
};


const scoutRenderAnalysisV611Base=window.scoutRenderAnalysis;window.scoutRenderAnalysis=function(){scoutRenderAnalysisV611Base();scoutRenderPlayerAnalytics()};

/* Extiende el render principal para mantener Inicio/Análisis actualizados */
const scoutRenderV610=scoutRender;window.scoutRender=function(){const out=scoutRenderV610();if($('scout-dashboard')?.classList.contains('active'))scoutRenderHome();if($('scout-analysis')?.classList.contains('active'))scoutRenderAnalysis();return out};

/* Enter en consola */
$('scout-code-input')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();scoutAddCode()}});
/* Migración segura del estado ya cargado */
try{['infantil','cadete'].forEach(t=>{if(equiposData?.[t]){equiposData[t].scoutingMatches=scoutArr(equiposData[t].scoutingMatches).map(scoutNormalizeMatch);equiposData[t].scoutingActiveId=Number(equiposData[t].scoutingActiveId)||null}});scoutingMatches=scoutArr(equiposData?.[equipoActivo]?.scoutingMatches).map(scoutNormalizeMatch);scoutingActiveId=Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null;guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();scoutRender()}catch(err){console.warn('V6.0 scouting migration',err)}
/* ===== V6.1.3 · FIX: PRO ROTATIONS EXECUTED INSIDE SCOUT ENGINE SCOPE ===== */
const VC_POS_META={p1:{zone:'Z1',line:'Zaguero',serve:true},p2:{zone:'Z2',line:'Delantero'},p3:{zone:'Z3',line:'Delantero'},p4:{zone:'Z4',line:'Delantero'},p5:{zone:'Z5',line:'Zaguero'},p6:{zone:'Z6',line:'Zaguero'}};
const VC_BACK_POS=['p1','p5','p6'];
const VC_ROLE_SHORT={Colocador:'COL',Receptor:'REC',Central:'CEN',Opuesto:'OPU','Líbero':'LIB',Universal:'UNI'};
function vcRoleForPlayer(p){const all=typeof ppPositions==='function'?ppPositions(p||{}):[p?.position].filter(Boolean);return all[0]||'Sin rol'}
function vcHasRole(p,role){return (typeof ppPositions==='function'?ppPositions(p||{}):[p?.position]).includes(role)}
function vcPlayerRole(id){return vcRoleForPlayer(scoutPlayer(id))}
function vcShortRole(role){return VC_ROLE_SHORT[role]||String(role||'—').slice(0,3).toUpperCase()}
function vcEnsureProMatch(m){if(!m)return null;m.baseLineup=scoutNormalizeLineup(m.baseLineup||m.lineup);m.lineupRoles=scoutNormalizeRoles(m.lineupRoles);m.libero=scoutNormalizeLibero(m.libero);SCOUT_POS.forEach(pos=>{if(!m.lineupRoles.ours[pos]&&m.baseLineup.ours[pos])m.lineupRoles.ours[pos]=vcPlayerRole(m.baseLineup.ours[pos])});if(!m.libero.centralIds.length){m.libero.centralIds=SCOUT_POS.map(pos=>Number(m.baseLineup.ours[pos])).filter(id=>id&&vcHasRole(scoutPlayer(id),'Central'))}return m}
function vcBaseOwn(m){vcEnsureProMatch(m);return m.baseLineup.ours}
function vcAutoLiberoTarget(m){vcEnsureProMatch(m);if(!m.libero.enabled||!m.libero.auto||!m.libero.playerId)return null;const centralSet=new Set(m.libero.centralIds.map(Number));for(const pos of VC_BACK_POS){const id=Number(m.baseLineup.ours[pos]);if(!id||!centralSet.has(id))continue;if(pos==='p1'&&m.servingTeam==='ours')continue;return {pos,centralId:id}}return null}
function vcRecordLiberoTransition(m,prev,next){if(!m||m.status==='finished')return;const set=scoutSet(m);if(!set)return;if(prev?.centralId&&next?.centralId&&Number(prev.centralId)===Number(next.centralId))return;if(prev?.pos===next?.pos&&Number(prev?.centralId)===Number(next?.centralId))return;const libId=Number(m.libero.playerId)||null;if(prev?.centralId&&!next){m.events=scoutArr(m.events);m.events.push({id:Date.now()+1,type:'libero_auto',team:'ours',setNumber:set.number,scoreUs:set.scoreUs,scoreOpponent:set.scoreOpponent,position:prev.pos,outPlayerId:libId,inPlayerId:prev.centralId,outLabel:scoutPlayerName(libId),inLabel:scoutPlayerName(prev.centralId),createdAt:scoutNow(),scoutMs:scoutElapsed(m)})}else if(next?.centralId){m.events=scoutArr(m.events);m.events.push({id:Date.now()+2,type:'libero_auto',team:'ours',setNumber:set.number,scoreUs:set.scoreUs,scoreOpponent:set.scoreOpponent,position:next.pos,outPlayerId:next.centralId,inPlayerId:libId,outLabel:scoutPlayerName(next.centralId),inLabel:scoutPlayerName(libId),createdAt:scoutNow(),scoutMs:scoutElapsed(m)})}}
function vcApplyAutoLibero(m,record=false){vcEnsureProMatch(m);const prev=m.libero.activePosition&&m.libero.activeForId?{pos:m.libero.activePosition,centralId:Number(m.libero.activeForId)}:null;const opponent=scoutNormalizeLineup(m.lineup).opponent;m.lineup=scoutNormalizeLineup(m.baseLineup);m.lineup.opponent=opponent;const target=vcAutoLiberoTarget(m);if(target){m.lineup.ours[target.pos]=Number(m.libero.playerId);m.libero.activeForId=target.centralId;m.libero.activePosition=target.pos}else{m.libero.activeForId=null;m.libero.activePosition=''}if(record)vcRecordLiberoTransition(m,prev,target);return target}
function vcRotateBase(m,dir=1){vcEnsureProMatch(m);const vals=SCOUT_POS.map(p=>m.baseLineup.ours[p]);const rot=dir>=0?vals.slice(1).concat(vals[0]):[vals[5]].concat(vals.slice(0,5));SCOUT_POS.forEach((p,i)=>m.baseLineup.ours[p]=rot[i]);SCOUT_POS.forEach(p=>m.lineupRoles.ours[p]=m.baseLineup.ours[p]?vcPlayerRole(m.baseLineup.ours[p]):'')}
function vcPosDisplay(pos){const x=VC_POS_META[pos];return `${pos.toUpperCase()} · ${x.zone}`}
function vcLineupOption(p,selected){const role=vcRoleForPlayer(p),num=p.number!==''&&p.number!=null?'#'+p.number+' · ':'';return `<option value="${p.id}" ${Number(selected)===Number(p.id)?'selected':''}>${esc(num+(p.name||'Jugador')+' · '+role)}</option>`}
function vcRenderCentralDetection(){const m=scoutActive(),box=$('scout-lineup-centrals'),lab=$('scout-libero-state-label');if(!m||!box)return;const ids=SCOUT_POS.map(p=>Number($(`scout-own-${p}`)?.value)||0).filter(Boolean),centrals=ids.map(scoutPlayer).filter(p=>p&&vcHasRole(p,'Central'));box.innerHTML=centrals.length?centrals.map(p=>`<span class="scout-central-chip"><b>${esc(p.number!==''&&p.number!=null?'#'+p.number:'CEN')}</b>${esc(p.name||'Central')}</span>`).join(''):'<span class="scout-central-chip">No se detectan centrales en los seis rotacionales</span>';const libId=Number($('scout-lineup-libero')?.value)||0,lp=scoutPlayer(libId);if(lab)lab.textContent=lp?`${lp.number!==''&&lp.number!=null?'#'+lp.number+' · ':''}${lp.name}`:'Sin líbero'}
window.scoutRenderLineupPreview=function(){const box=$('scout-lineup-preview');if(!box)return;const positions=SCOUT_POS.map(pos=>{const id=Number($(`scout-own-${pos}`)?.value)||0,p=scoutPlayer(id),meta=VC_POS_META[pos],role=p?vcRoleForPlayer(p):'—';return `<div class="slot ${meta.line==='Zaguero'?'back':'front'}"><span class="pos">${vcPosDisplay(pos)} · ${meta.line}</span><strong>${p?esc((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador')):'Sin asignar'}</strong><small>${esc(role)}</small></div>`}).join('');box.innerHTML=positions;vcRenderCentralDetection()}
window.scoutOpenLineup=function(){const m=scoutActive();if(!m){alert('Crea primero un scouting.');return}vcEnsureProMatch(m);const own=$('scout-lineup-own'),rival=$('scout-lineup-rival');if(own)own.innerHTML=SCOUT_POS.map(pos=>{const meta=VC_POS_META[pos];return `<label class="scout-lineup-field"><span class="scout-pos-meta"><b>${pos.toUpperCase()}</b><small>${meta.zone} · ${meta.line}</small></span><select id="scout-own-${pos}" onchange="scoutRenderLineupPreview()"><option value="">— Sin asignar —</option>${(jugadoresEquipo||[]).filter(p=>!vcHasRole(p,'Líbero')||Number(p.id)===Number(m.baseLineup.ours[pos])).map(p=>vcLineupOption(p,m.baseLineup.ours[pos])).join('')}</select></label>`}).join('');if(rival)rival.innerHTML=SCOUT_POS.map(pos=>{const meta=VC_POS_META[pos],role=m.lineupRoles.opponent[pos]||'';return `<div><label class="scout-lineup-field"><span class="scout-pos-meta"><b>${pos.toUpperCase()}</b><small>${meta.zone} · ${meta.line}</small></span><input id="scout-rival-${pos}" value="${esc(m.lineup.opponent[pos]||'')}" placeholder="Ej. #7 García"></label><select id="scout-rival-role-${pos}" class="scout-lineup-role-select"><option value="">— Rol rival —</option>${['Colocador','Receptor','Central','Opuesto','Líbero','Universal'].map(x=>`<option ${x===role?'selected':''}>${x}</option>`).join('')}</select></div>`}).join('');$('scout-lineup-rotation').value=String(m.rotationNo||1);$('scout-lineup-rival-rotation').value=String(m.opponentRotationNo||1);const lib=$('scout-lineup-libero');if(lib){const libs=(jugadoresEquipo||[]).filter(p=>vcHasRole(p,'Líbero'));lib.innerHTML='<option value="">Sin líbero automático</option>'+libs.map(p=>vcLineupOption(p,m.libero.playerId)).join('');if(!m.libero.playerId&&libs.length===1)lib.value=String(libs[0].id)}if($('scout-lineup-libero-auto'))$('scout-lineup-libero-auto').checked=m.libero.auto!==false;$('scout-lineup-modal')?.classList.add('open');scoutRenderLineupPreview()};
window.scoutSaveLineup=function(){const m=scoutActive();if(!m)return;vcEnsureProMatch(m);const ids=SCOUT_POS.map(pos=>Number($(`scout-own-${pos}`)?.value)||null).filter(Boolean);if(ids.length!==6){alert('Debes asignar exactamente seis jugadores rotacionales a P1–P6. El líbero se configura aparte.');return}if(new Set(ids).size!==ids.length){alert('Un mismo jugador no puede ocupar dos posiciones a la vez.');return}const bad=ids.map(scoutPlayer).find(p=>p&&vcHasRole(p,'Líbero')&&vcRoleForPlayer(p)==='Líbero');if(bad){alert(`${bad.name||'El líbero'} no debe formar parte de los seis rotacionales. Selecciónalo en “Líbero automático”.`);return}SCOUT_POS.forEach(pos=>{m.baseLineup.ours[pos]=Number($(`scout-own-${pos}`)?.value)||null;m.lineup.opponent[pos]=String($(`scout-rival-${pos}`)?.value||'').trim();m.baseLineup.opponent[pos]=m.lineup.opponent[pos];m.lineupRoles.ours[pos]=vcPlayerRole(m.baseLineup.ours[pos]);m.lineupRoles.opponent[pos]=String($(`scout-rival-role-${pos}`)?.value||'')});m.rotationNo=Number($('scout-lineup-rotation')?.value)||1;m.opponentRotationNo=Number($('scout-lineup-rival-rotation')?.value)||1;const libId=Number($('scout-lineup-libero')?.value)||null;if(libId&&ids.includes(libId)){alert('El líbero no puede estar también entre los seis jugadores rotacionales.');return}m.libero.playerId=libId;m.libero.enabled=!!libId;m.libero.auto=$('scout-lineup-libero-auto')?.checked!==false;m.libero.centralIds=ids.filter(id=>vcHasRole(scoutPlayer(id),'Central'));m.libero.activeForId=null;m.libero.activePosition='';vcApplyAutoLibero(m,false);scoutCloseLineup();scoutRefreshActionPlayers();scoutSave()};
window.scoutRotate=function(dir=1){const m=scoutActive();if(!m||m.status==='finished')return;vcEnsureProMatch(m);vcRotateBase(m,dir);m.rotationNo=((m.rotationNo-1+(dir>=0?-1:1)+6)%6)+1;vcApplyAutoLibero(m,true);scoutSave()};
function vcCourtSlot(m,pos,team){const meta=VC_POS_META[pos];if(team==='ours'){const visibleId=Number(m.lineup.ours[pos])||null,baseId=Number(m.baseLineup.ours[pos])||visibleId,p=scoutPlayer(visibleId),base=scoutPlayer(baseId),isLib=visibleId&&visibleId===Number(m.libero.playerId)&&baseId!==visibleId;const name=p?((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador')):'Sin asignar',role=isLib?'Líbero':(m.lineupRoles.ours[pos]||vcRoleForPlayer(p));return `<div class="scout-court-slot ${pos} ${isLib?'libero-active':''}"><div class="slot-top"><span class="slot-pos">${pos.toUpperCase()} · ${meta.zone}</span><span class="slot-role">${esc(vcShortRole(role))}</span></div><strong>${esc(name)}</strong><small>${esc(meta.line)}</small>${isLib&&base?`<span class="libero-for">por ${esc((base.number!==''&&base.number!=null?'#'+base.number+' · ':'')+(base.name||'Central'))}</span>`:''}</div>`}const name=scoutOpponentLabel(m.lineup.opponent[pos],pos),role=m.lineupRoles.opponent[pos]||'';return `<div class="scout-court-slot ${pos}"><div class="slot-top"><span class="slot-pos">${pos.toUpperCase()} · ${meta.zone}</span>${role?`<span class="slot-role">${esc(vcShortRole(role))}</span>`:''}</div><strong>${esc(name)}</strong><small>${esc(meta.line)}</small></div>`}
function vcRenderRotationStrip(m){const box=$('scout-rotation-strip');if(!box)return;vcEnsureProMatch(m);box.innerHTML=`<div class="rotation-tag">R${m.rotationNo}</div>`+SCOUT_POS.map(pos=>{const baseId=Number(m.baseLineup.ours[pos]),visId=Number(m.lineup.ours[pos]),base=scoutPlayer(baseId),isLib=visId===Number(m.libero.playerId)&&visId!==baseId,shown=scoutPlayer(visId);return `<div class="rotation-player ${pos==='p1'?'active':''} ${isLib?'libero':''}"><b>${pos.toUpperCase()} · ${VC_POS_META[pos].zone} · ${shown?esc((shown.number!==''&&shown.number!=null?'#'+shown.number+' ':'')+(shown.name||'')):'—'}</b><small>${isLib?'LIB por '+esc(base?.name||'central'):esc(m.lineupRoles.ours[pos]||vcPlayerRole(base))}</small></div>`}).join('')}
window.scoutRenderCourt=function(m){if(!m)return;vcEnsureProMatch(m);vcApplyAutoLibero(m,false);const own=$('scout-own-court'),rival=$('scout-rival-court');if(own)own.innerHTML=SCOUT_POS.map(p=>vcCourtSlot(m,p,'ours')).join('');if(rival)rival.innerHTML=SCOUT_POS.map(p=>vcCourtSlot(m,p,'opponent')).join('');if($('scout-own-label'))$('scout-own-label').textContent=EQUIPOS[equipoActivo].nombre;if($('scout-rival-label'))$('scout-rival-label').textContent=m.opponent;if($('scout-own-rotation-label'))$('scout-own-rotation-label').textContent=`R${m.rotationNo} · ${m.servingTeam==='ours'?'SAQUE':'RECEPCIÓN'}${m.libero.activePosition?' · Líbero '+m.libero.activePosition.toUpperCase():''}`;if($('scout-rival-rotation-label'))$('scout-rival-rotation-label').textContent=`R${m.opponentRotationNo||1} · ${m.servingTeam==='opponent'?'SAQUE':'RECEPCIÓN'}`;vcRenderRotationStrip(m)};
window.scoutRefreshActionPlayers=function(){const team=$('scout-action-team')?.value||'ours',sel=$('scout-action-player');if(!sel)return;const m=scoutActive();if(team==='ours'&&m){vcEnsureProMatch(m);vcApplyAutoLibero(m,false);const ids=[...new Set(SCOUT_POS.map(p=>Number(m.lineup.ours[p])).filter(Boolean))];sel.innerHTML=ids.map(id=>{const p=scoutPlayer(id);return `<option value="${id}">${esc((p?.number!==''&&p?.number!=null?'#'+p.number+' · ':'')+(p?.name||'Jugador')+' · '+vcRoleForPlayer(p))}</option>`}).join('')||'<option value="">Sin alineación</option>'}else if(m){const vals=SCOUT_POS.map(pos=>({pos,label:scoutOpponentLabel(m.lineup.opponent[pos],pos)}));sel.innerHTML=vals.map(x=>`<option value="${esc(x.label)}">${esc(x.label)}</option>`).join('')}};
window.scoutAwardPoint=function(winner){const m=scoutActive(),s=scoutSet(m);if(!m||!s||m.status==='finished'||s.finished)return;vcEnsureProMatch(m);vcApplyAutoLibero(m,false);scoutEnsureRallyStart(m);const before=m.liveRally.startSnapshot||scoutCurrentRallySnapshot(m),baseBefore=scoutClone(m.baseLineup),liberoBefore=scoutClone(m.libero),rolesBefore=scoutClone(m.lineupRoles);if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;const rally={id:m.liveRally.id,setNumber:s.number,servingBefore:before.servingBefore,rotationBefore:before.rotationBefore,opponentRotationBefore:before.opponentRotationBefore,lineupBefore:scoutClone(before.lineupBefore),baseLineupBefore:baseBefore,liberoBefore,lineupRolesBefore:rolesBefore,scoreBefore:scoutClone(before.scoreBefore),scoreAfter:{us:s.scoreUs,opponent:s.scoreOpponent},winner:winner==='opponent'?'opponent':'ours',actions:scoutClone(m.liveRally.actions),startedAt:m.liveRally.startedAt,endedAt:scoutNow(),scoutStartMs:Number(m.liveRally.scoutStartMs)||0,scoutEndMs:scoutElapsed(m)};s.rallies.push(rally);if(winner==='ours'){if(before.servingBefore==='opponent'){vcRotateBase(m,1);m.rotationNo=((m.rotationNo+4)%6)+1}m.servingTeam='ours'}else{if(before.servingBefore==='ours'){m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',1);m.baseLineup.opponent=scoutClone(m.lineup.opponent);m.opponentRotationNo=((m.opponentRotationNo+4)%6)+1}m.servingTeam='opponent'}vcApplyAutoLibero(m,true);scoutResetLiveRally(m);if(scoutSetHasWinner(s)){s.finished=true;s.winner=s.scoreUs>s.scoreOpponent?'ours':'opponent';s.endedAt=scoutNow();const sets=scoutSetsScore(m);if(sets.us>=3||sets.opponent>=3){m.status='finished';m.endedAt=scoutNow();scoutSyncCompetition(m)}}scoutSave()};
window.scoutUndoRally=function(){const m=scoutActive(),s=scoutSet(m);if(!m||!s||!s.rallies.length)return;if(s.finished){s.finished=false;s.winner=null;s.endedAt=null;if(m.status==='finished'){m.status='live';m.endedAt=null}}const r=s.rallies.pop();s.scoreUs=Number(r.scoreBefore.us)||0;s.scoreOpponent=Number(r.scoreBefore.opponent)||0;m.servingTeam=r.servingBefore;m.rotationNo=r.rotationBefore;m.opponentRotationNo=r.opponentRotationBefore||1;m.lineup=scoutNormalizeLineup(r.lineupBefore);m.baseLineup=r.baseLineupBefore?scoutNormalizeLineup(r.baseLineupBefore):scoutNormalizeLineup(r.lineupBefore);m.libero=r.liberoBefore?scoutNormalizeLibero(r.liberoBefore):scoutNormalizeLibero(m.libero);m.lineupRoles=r.lineupRolesBefore?scoutNormalizeRoles(r.lineupRolesBefore):scoutNormalizeRoles(m.lineupRoles);m.liveRally={id:r.id,actions:scoutClone(r.actions),startedAt:r.startedAt,scoutStartMs:Number(r.scoutStartMs)||0,startSnapshot:{servingBefore:r.servingBefore,rotationBefore:r.rotationBefore,opponentRotationBefore:r.opponentRotationBefore||1,lineupBefore:scoutClone(r.lineupBefore),scoreBefore:scoutClone(r.scoreBefore)}};scoutSave()};
const vcSubRefreshBase=window.scoutRefreshSubstitution;window.scoutRefreshSubstitution=function(){const m=scoutActive();if(m&&($('scout-sub-team')?.value||'ours')==='ours'){vcEnsureProMatch(m);const pos=$('scout-sub-position')?.value||'p1',baseId=Number(m.baseLineup.ours[pos])||null,visibleId=Number(m.lineup.ours[pos])||baseId;if($('scout-sub-out'))$('scout-sub-out').value=visibleId?scoutPlayerName(visibleId):'Sin asignar';const courtIds=new Set(SCOUT_POS.map(p=>Number(m.lineup.ours[p])).filter(Boolean)),candidates=(jugadoresEquipo||[]).filter(p=>!courtIds.has(Number(p.id))&&Number(p.id)!==Number(m.libero.playerId));if($('scout-sub-in-player'))$('scout-sub-in-player').innerHTML=candidates.map(p=>`<option value="${p.id}">${esc((p.number!==''&&p.number!=null?'#'+p.number+' · ':'')+(p.name||'Jugador')+' · '+vcRoleForPlayer(p))}</option>`).join('');$('scout-sub-own-wrap')?.classList.remove('hidden');$('scout-sub-rival-wrap')?.classList.add('hidden');return}vcSubRefreshBase()};
const vcSubApplyBase=window.scoutApplySubstitution;window.scoutApplySubstitution=function(){const m=scoutActive();if(!m)return;if(($('scout-sub-team')?.value||'ours')!=='ours'){vcSubApplyBase();return}vcEnsureProMatch(m);const set=scoutSet(m),type=$('scout-sub-type')?.value==='libero'?'libero':'substitution',pos=$('scout-sub-position')?.value||'p1',inId=Number($('scout-sub-in-player')?.value)||null;if(!set||!inId){alert('Selecciona el jugador que entra.');return}if(type==='libero'){m.libero.playerId=inId;m.libero.enabled=true;m.libero.auto=false;vcApplyAutoLibero(m,false);scoutCloseSubstitution();scoutSave();return}const outId=Number(m.baseLineup.ours[pos])||null;if(inId===outId){alert('El jugador que entra debe ser distinto al que sale.');return}const occupied=SCOUT_POS.some(p=>p!==pos&&Number(m.baseLineup.ours[p])===inId);if(occupied){alert('Ese jugador ya está en la rotación en otra posición.');return}const event={id:Date.now(),type:'substitution',team:'ours',setNumber:set.number,scoreUs:set.scoreUs,scoreOpponent:set.scoreOpponent,position:pos,outPlayerId:outId,inPlayerId:inId,outLabel:scoutPlayerName(outId),inLabel:scoutPlayerName(inId),createdAt:scoutNow(),scoutMs:scoutElapsed(m)};m.baseLineup.ours[pos]=inId;m.lineupRoles.ours[pos]=vcPlayerRole(inId);m.libero.centralIds=m.libero.centralIds.filter(id=>Number(id)!==outId);if(vcHasRole(scoutPlayer(inId),'Central'))m.libero.centralIds.push(inId);m.libero.centralIds=[...new Set(m.libero.centralIds.map(Number))];m.events=scoutArr(m.events);m.events.push(event);vcApplyAutoLibero(m,false);scoutCloseSubstitution();scoutRefreshActionPlayers();scoutSave()};
const vcRenderAnalysisBase=window.scoutRenderAnalysis;window.scoutRenderAnalysis=function(){vcRenderAnalysisBase();const box=$('scout-analysis-events'),m=scoutMatchForAnalysis();if(box&&m){const events=scoutArr(m.events).slice().reverse();box.innerHTML=events.length?events.map(e=>`<div class="scout-event"><b>Set ${e.setNumber} · ${e.scoreUs}–${e.scoreOpponent}</b><span>${e.type==='libero_auto'?'Líbero automático':e.type==='libero'?'Líbero manual':'Sustitución'} · ${e.team==='ours'?'Nuestro':'Rival'} · ${String(e.position||'').toUpperCase()}</span><small>${esc(e.outLabel||'—')} → ${esc(e.inLabel||'—')}</small></div>`).join(''):'<div class="match-empty">Sin cambios registrados.</div>'}};

const V620_SERVE_LABELS={F:'Flotante',JF:'Flotante salto',JP:'Salto potente',U:'Bajo / seguridad'};
const V620_PHASE_LABELS={K1:'K1 · Side-out',K2:'K2 · Break',FB:'Freeball',TR:'Transición'};
const V620_COMBO_LABELS={Z4:'Zona 4',Z2:'Zona 2',Z1:'Zona 1',Z6:'Zona 6','1T':'Primer tiempo','31':'31',BACK:'Primer tiempo detrás',PIPE:'Pipe','2T':'Segundo toque',OTR:'Otra'};
function scoutAdvancedMetaText(a){const x=[];if(a.serveType)x.push(V620_SERVE_LABELS[a.serveType]||a.serveType);if(a.phase)x.push(V620_PHASE_LABELS[a.phase]||a.phase);const combo=a.setTarget||a.attackCombo;if(combo)x.push(V620_COMBO_LABELS[combo]||combo);if(a.attackTempo)x.push('Tempo '+({RAP:'rápido',MED:'medio',ALT:'alto'}[a.attackTempo]||a.attackTempo));if(a.blockers!==''&&a.blockers!=null)x.push(`${a.blockers} bloqueador${String(a.blockers)==='1'?'':'es'}`);return x.join(' · ')}
function scoutDefaultPhase(m,team){return m?.servingTeam===team?'K2':'K1'}
window.scoutUpdateAdvancedFields=function(){const skill=$('scout-action-skill')?.value||'S',m=scoutActive(),team=$('scout-action-team')?.value||'ours';const show=(id,on)=>$(id)?.classList.toggle('hidden',!on);show('scout-adv-serve-wrap',skill==='S'||skill==='R');show('scout-adv-phase-wrap',skill!=='S');show('scout-adv-combo-wrap',skill==='E'||skill==='A');show('scout-adv-tempo-wrap',skill==='A');show('scout-adv-block-wrap',skill==='A');if($('scout-advanced-title'))$('scout-advanced-title').textContent=SCOUT_SKILLS[skill]||skill;if($('scout-advanced-context'))$('scout-advanced-context').textContent=skill==='S'?'Tipo y dirección del servicio':skill==='R'?'Tipo de saque recibido y calidad':skill==='E'?'Destino de la colocación y fase':skill==='A'?'Combinación, fase, tempo y bloqueo':'Fase táctica de la acción';const phase=$('scout-action-phase');if(phase&&!phase.value&&m&&skill!=='S')phase.dataset.auto=scoutDefaultPhase(m,team);scoutUpdateAdvancedCodePreview()};
window.scoutUpdateAdvancedCodePreview=function(){const skill=$('scout-action-skill')?.value||'S',ev=$('scout-action-eval')?.value||'!',start=$('scout-action-start')?.value||'',end=$('scout-action-end')?.value||'',serve=$('scout-action-serve-type')?.value||'',phase=$('scout-action-phase')?.value||'',combo=$('scout-action-combo')?.value||'',blockers=$('scout-action-blockers')?.value??'';let c='N'+skill+ev;if(start&&end)c+=`.${start}>${end}`;if(serve)c+=`~${serve}`;if((skill==='E'||skill==='A')&&combo)c+=`:${combo}`;if(phase)c+=`^${phase}`;if(skill==='A'&&blockers!=='')c+=`@${blockers}`;if($('scout-advanced-code-preview'))$('scout-advanced-code-preview').textContent='Código: '+c};
function scoutSequenceRows(m,team='ours'){const rows=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const acts=scoutArr(r.actions).filter(a=>a.team===team),recep=acts.find(a=>a.skill==='R'),setter=acts.find(a=>a.skill==='E'),attack=acts.find(a=>a.skill==='A'),phase=r.servingBefore===team?'K2':'K1',target=setter?.setTarget||attack?.attackCombo||'',win=r.winner===team,rotation=team==='ours'?Number(r.rotationBefore)||1:Number(r.opponentRotationBefore)||1;rows.push({set:set.number,rally:ri+1,phase,win,rotation,receptionEval:recep?.evaluation||'',setter:setter?scoutActionPlayerLabel(setter):'',target,attackEval:attack?.evaluation||'',actions:acts,rallyData:r})}));return rows}
function scoutSequenceSummary(m,team){const rows=scoutSequenceRows(m,team),k1=rows.filter(x=>x.phase==='K1'),k2=rows.filter(x=>x.phase==='K2'),byReception=['#','+','!','-','/','='].map(ev=>{const r=k1.filter(x=>x.receptionEval===ev);return {ev,total:r.length,won:r.filter(x=>x.win).length,pct:scoutPercent(r.filter(x=>x.win).length,r.length)}});return {rows,k1,k2,k1Won:k1.filter(x=>x.win).length,k2Won:k2.filter(x=>x.win).length,byReception}}
function scoutDistributionRows(m,team,evalFilter=''){return scoutSequenceRows(m,team).filter(x=>x.target&&(!evalFilter||x.receptionEval===evalFilter))}
function scoutTacticalRotationProfiles(m,team='ours'){const seq=scoutSequenceRows(m,team);return Array.from({length:6},(_,i)=>{const no=i+1,rows=seq.filter(x=>x.rotation===no),sample=rows.find(x=>x.rallyData?.lineupRolesBefore?.[team]);const roles=sample?.rallyData?.lineupRolesBefore?.[team]||{},setterPos=SCOUT_POS.find(p=>String(roles[p]||'').toLowerCase().includes('coloc'))||'',setterLine=['p2','p3','p4'].includes(setterPos)?'Delantero':setterPos?'Zaguero':'—',frontAttackers=['p2','p3','p4'].filter(p=>{const r=String(roles[p]||'').toLowerCase();return r&&!r.includes('coloc')&&!r.includes('líbero')&&!r.includes('libero')}).length,targets={};rows.forEach(x=>{if(x.target)targets[x.target]=(targets[x.target]||0)+1});const top=Object.entries(targets).sort((a,b)=>b[1]-a[1])[0];const k1=rows.filter(x=>x.phase==='K1'),k2=rows.filter(x=>x.phase==='K2');return {no,setterPos,setterLine,frontAttackers,topTarget:top?.[0]||'',topCount:top?.[1]||0,k1Total:k1.length,k1Won:k1.filter(x=>x.win).length,k2Total:k2.length,k2Won:k2.filter(x=>x.win).length}})}
window.scoutRenderPerformanceAnalytics=function(){const m=scoutMatchForAnalysis(),seqBox=$('scout-analysis-sequences'),distBox=$('scout-analysis-distribution'),tacBox=$('scout-analysis-tactical-rotations');if(!m){[seqBox,distBox,tacBox].forEach(x=>{if(x)x.innerHTML='<div class="match-empty">Selecciona un scouting.</div>'});return}const team=$('scout-sequence-team-scope')?.value||'ours',sum=scoutSequenceSummary(m,team),teamLabel=team==='ours'?'Nuestro equipo':'Rival';if(seqBox){seqBox.innerHTML=`<div class="scout-sequence-kpis"><div><span>K1 · Side-out</span><b>${sum.k1.length?scoutPercent(sum.k1Won,sum.k1.length)+'%':'—'}</b><small>${sum.k1Won}/${sum.k1.length}</small></div><div><span>K2 · Break</span><b>${sum.k2.length?scoutPercent(sum.k2Won,sum.k2.length)+'%':'—'}</b><small>${sum.k2Won}/${sum.k2.length}</small></div><div><span>Secuencias</span><b>${sum.rows.length}</b><small>${teamLabel}</small></div></div><div class="scout-sequence-table"><div class="head"><b>Recepción</b><b>K1 ganados</b><b>Side-out</b><b>Muestra</b></div>${sum.byReception.map(x=>`<div><strong>${x.ev}</strong><span>${x.won}/${x.total}</span><span class="${(x.pct||0)>=60?'good':(x.pct||0)<40&&x.total?'bad':''}">${x.total?(x.pct+'%'):'—'}</span><small>${x.total} rallies</small></div>`).join('')}</div>`}const filter=$('scout-distribution-reception-filter')?.value||'',dist=scoutDistributionRows(m,team,filter),targets=['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'];if(distBox){const counts={};targets.forEach(t=>counts[t]=Array(6).fill(0));dist.forEach(x=>{if(!counts[x.target])counts[x.target]=Array(6).fill(0);counts[x.target][Math.max(0,Math.min(5,x.rotation-1))]++});const used=Object.entries(counts).filter(([,arr])=>arr.some(Boolean));const total=dist.length;distBox.innerHTML=used.length?`<div class="scout-dist-summary"><b>${esc(teamLabel)}</b><span>${filter?'Recepción '+esc(filter):'Todas las calidades'} · ${total} distribuciones codificadas</span></div><div class="scout-dist-table-wrap"><table class="scout-dist-table"><thead><tr><th>Destino</th>${[1,2,3,4,5,6].map(n=>`<th>R${n}</th>`).join('')}<th>Total</th><th>%</th></tr></thead><tbody>${used.map(([t,arr])=>{const n=arr.reduce((a,b)=>a+b,0);return `<tr><td><b>${esc(V620_COMBO_LABELS[t]||t)}</b></td>${arr.map(v=>`<td>${v||'—'}</td>`).join('')}<td><b>${n}</b></td><td>${total?Math.round(n/total*100):0}%</td></tr>`}).join('')}</tbody></table></div>`:'<div class="match-empty">Todavía no hay colocaciones/ataques con combinación codificada para este filtro.</div>'}if(tacBox){const profiles=scoutTacticalRotationProfiles(m,team);tacBox.innerHTML=`<div class="scout-tactical-grid">${profiles.map(r=>`<div class="scout-tactical-card"><div class="scout-tactical-head"><b>R${r.no}</b><span>${esc(r.setterLine)}</span></div><div class="scout-tactical-body"><p><span>Colocador</span><b>${r.setterPos?r.setterPos.toUpperCase():'—'}</b></p><p><span>Atacantes delanteros</span><b>${r.frontAttackers||'—'}</b></p><p><span>Destino más usado</span><b>${r.topTarget?esc(V620_COMBO_LABELS[r.topTarget]||r.topTarget):'—'}</b></p><p><span>K1</span><b>${r.k1Total?scoutPercent(r.k1Won,r.k1Total)+'%':'—'}</b></p><p><span>K2</span><b>${r.k2Total?scoutPercent(r.k2Won,r.k2Total)+'%':'—'}</b></p></div></div>`).join('')}</div>`}}
function scoutRenderLiveTactical(m){const box=$('scout-live-tactical');if(!box||!m)return;const team='ours',roles=m.lineupRoles?.ours||{},setterPos=SCOUT_POS.find(p=>String(roles[p]||'').toLowerCase().includes('coloc'))||'',setterLine=['p2','p3','p4'].includes(setterPos)?'delantero':setterPos?'zaguero':'sin identificar',phase=m.servingTeam==='ours'?'K2 · Break':'K1 · Side-out',front=['p2','p3','p4'].filter(p=>{const r=String(roles[p]||'').toLowerCase();return r&&!r.includes('coloc')&&!r.includes('lib')}).length;box.innerHTML=`<div><span>FASE</span><b>${phase}</b></div><div><span>COLOCADOR</span><b>${setterPos?setterPos.toUpperCase()+' · '+setterLine:'—'}</b></div><div><span>ATACANTES DEL.</span><b>${front||'—'}</b></div><div><span>ROTACIÓN RIVAL</span><b>R${m.opponentRotationNo||1}</b></div>`}
function vcUpgradeCodeReference(){const modal=$('scout-code-reference-modal');if(!modal)return;const p=modal.querySelector('.pro-modal-head p');if(p)p.textContent='Sistema de codificación estructurado para registrar rápido y mantener criterios consistentes entre partidos.';const evalGuide=modal.querySelector('.scout-eval-guide');if(evalGuide)evalGuide.innerHTML=`<div><b>#</b><span><strong>Saque:</strong> ace · <strong>Recepción:</strong> perfecta · <strong>Ataque:</strong> punto · <strong>Bloqueo:</strong> punto.</span></div><div><b>+</b><span>Acción positiva: genera ventaja clara o mantiene todas las opciones.</span></div><div><b>!</b><span>Continuidad / acción neutra: no genera una ventaja clara.</span></div><div><b>-</b><span>Acción negativa: reduce opciones o facilita la organización rival.</span></div><div><b>/</b><span><strong>Ataque:</strong> bloqueado · en otros fundamentos, acción muy negativa o balón regalado.</span></div><div><b>=</b><span>Error directo que concede el punto o termina la acción.</span></div>`}
function vcMigrateMatches(){let changed=false;scoutingMatches.forEach(m=>{vcEnsureProMatch(m);if(!m.libero.playerId){const libs=(jugadoresEquipo||[]).filter(p=>vcHasRole(p,'Líbero'));if(libs.length===1){m.libero.playerId=Number(libs[0].id);m.libero.enabled=true;changed=true}}vcApplyAutoLibero(m,false)});if(changed)scoutSave(false)}

/* ===== V6.3 · DATA SHEET PROFESIONAL ===== */
function scoutV630Filters(){return {team:$('scout-player-team-scope')?.value||'ours',set:Number($('scout-v630-set')?.value)||0,rotation:Number($('scout-v630-rotation')?.value)||0,phase:$('scout-v630-phase')?.value||''}}
function scoutV630PhaseForAction(a,team){return team==='ours'?(a.servingBefore==='ours'?'K2':'K1'):(a.servingBefore==='opponent'?'K2':'K1')}
function scoutV630RotationForAction(a,team){return team==='ours'?Number(a.rotation)||1:Number(a.opponentRotation)||1}
function scoutV630FilteredActions(m,team){const f=scoutV630Filters();return scoutActionRows(m,false).filter(a=>a.team===team&&(!f.set||Number(a.set)===f.set)&&(!f.rotation||scoutV630RotationForAction(a,team)===f.rotation)&&(!f.phase||scoutV630PhaseForAction(a,team)===f.phase))}
function scoutV630FilteredSequences(m,team){const f=scoutV630Filters();return scoutSequenceRows(m,team).filter(x=>(!f.set||Number(x.set)===f.set)&&(!f.rotation||Number(x.rotation)===f.rotation)&&(!f.phase||x.phase===f.phase))}
function scoutV630EmptyStat(key,label,team){const skills={};Object.keys(SCOUT_SKILLS).forEach(k=>skills[k]=scoutEmptySkillStat());return {key,label,team,total:0,evals:{'#':0,'+':0,'!':0,'-':0,'/':0,'=':0},skills,actions:[]}}
function scoutV630Aggregate(rows,team,key,label){const st=scoutV630EmptyStat(key,label,team);rows.forEach(a=>{st.total++;st.evals[a.evaluation]=(st.evals[a.evaluation]||0)+1;const sk=st.skills[a.skill]||(st.skills[a.skill]=scoutEmptySkillStat());sk.total++;sk.evals[a.evaluation]=(sk.evals[a.evaluation]||0)+1;st.actions.push(a)});return st}
function scoutV630Stats(m,team){const rows=scoutV630FilteredActions(m,team),catalog=scoutBuildPlayerStats(m,team),map=new Map(catalog.map(x=>[x.key,scoutV630EmptyStat(x.key,x.label,team)]));rows.forEach(a=>{const key=scoutPlayerKey(a);if(!map.has(key))map.set(key,scoutV630EmptyStat(key,scoutActionPlayerLabel(a),team));const st=map.get(key);st.total++;st.evals[a.evaluation]=(st.evals[a.evaluation]||0)+1;const sk=st.skills[a.skill]||(st.skills[a.skill]=scoutEmptySkillStat());sk.total++;sk.evals[a.evaluation]=(sk.evals[a.evaluation]||0)+1;st.actions.push(a)});const players=[...map.values()].sort((a,b)=>{const an=Number(String(a.label).match(/#(\d+)/)?.[1]||9999),bn=Number(String(b.label).match(/#(\d+)/)?.[1]||9999);return an-bn||a.label.localeCompare(b.label,'es')});return {rows,players,teamStat:scoutV630Aggregate(rows,team,'team',team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival')}}
function scoutV630PlayerSequenceRate(m,team,key,phase){const seq=scoutV630FilteredSequences(m,team).filter(x=>x.phase===phase);const rows=key==='team'?seq:seq.filter(x=>{const skill=phase==='K1'?'R':'S',a=x.actions.find(z=>z.skill===skill);return a&&scoutPlayerKey(a)===key});return {total:rows.length,won:rows.filter(x=>x.win).length,pct:rows.length?scoutPercent(rows.filter(x=>x.win).length,rows.length):0,rows}}
function scoutV630MetricLabel(metric){return ({ALL:'Todas las acciones',S_T:'Saque · total',S_ACE:'Saque · aces (#)',S_ERR:'Saque · errores (=)',S_POS:'Saque · positivas (#/+)',R_T:'Recepción · total',R_PERF:'Recepción · perfecta (#)',R_POS:'Recepción · positiva (#/+)',R_ERR:'Recepción · errores (=)',A_T:'Ataque · total',A_KILL:'Ataque · puntos (#)',A_ERR:'Ataque · errores (=)',A_BLK:'Ataque · bloqueados (/)',A_EFF:'Ataque · eficiencia',B_PTS:'Bloqueo · puntos (#)',D_POS:'Defensa · positivas (#/+)',E_POS:'Colocación · positivas (#/+)',K1:'K1 · Side-out',K2:'K2 · Break'})[metric]||metric}
function scoutV630MetricActions(rows,metric){const parts=metric.split('_'),skill=parts[0];if(metric==='ALL')return rows;if(['K1','K2'].includes(metric))return rows;if(!SCOUT_SKILLS[skill])return rows;let out=rows.filter(a=>a.skill===skill);if(metric.endsWith('_ACE')||metric.endsWith('_KILL')||metric.endsWith('_PTS')||metric.endsWith('_PERF'))out=out.filter(a=>a.evaluation==='#');else if(metric.endsWith('_ERR'))out=out.filter(a=>a.evaluation==='=');else if(metric.endsWith('_BLK'))out=out.filter(a=>a.evaluation==='/');else if(metric.endsWith('_POS'))out=out.filter(a=>a.evaluation==='#'||a.evaluation==='+');return out}
function scoutV630Link(value,team,key,metric,cls=''){if(value==='—'||value===''||value==null)return '<span class="scout-v630-na">—</span>';return `<button class="scout-stat-link ${cls}" onclick="scoutV630OpenDrill('${team}','${encodeURIComponent(key)}','${metric}')">${esc(String(value))}</button>`}
function scoutV630Name(st,isTeam=false){if(isTeam)return `<div class="scout-dv-player"><span class="scout-dv-number">Σ</span><span><b>${esc(st.label)}</b><small>total filtrado</small></span></div>`;const num=String(st.label).match(/#(\d+)/)?.[1]||'—',clean=st.label.replace(/^#\d+\s*·\s*/,'');return `<div class="scout-dv-player"><span class="scout-dv-number">${esc(num)}</span><span><b>${esc(clean||st.label)}</b><small>${st.total} acciones filtradas</small></span></div>`}
function scoutV630Row(m,team,st,isTeam=false){const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),a=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D'),e=scoutSkillMetric(st,'E'),k1=scoutV630PlayerSequenceRate(m,team,st.key,'K1'),k2=scoutV630PlayerSequenceRate(m,team,st.key,'K2'),k1v=k1.total?k1.pct+'%':'—',k2v=k2.total?k2.pct+'%':'—';return `<tr class="${isTeam?'scout-v630-team-row':''}"><td>${scoutV630Name(st,isTeam)}</td><td class="scout-dv-main">${scoutV630Link(st.total||'—',team,st.key,'ALL')}</td><td class="scout-v630-divider">${scoutV630Link(s.total||'—',team,st.key,'S_T')}</td><td class="scout-dv-good">${scoutV630Link(s.total?s.perfect:'—',team,st.key,'S_ACE','good')}</td><td>${scoutV630Link(s.total?s.posPct+'%':'—',team,st.key,'S_POS',s.posPct>=50?'good':'')}</td><td class="scout-dv-bad">${scoutV630Link(s.total?s.error:'—',team,st.key,'S_ERR','bad')}</td><td class="scout-v630-divider">${scoutV630Link(r.total||'—',team,st.key,'R_T')}</td><td>${scoutV630Link(r.total?r.perfPct+'%':'—',team,st.key,'R_PERF',r.perfPct>=35?'good':'')}</td><td class="scout-dv-good">${scoutV630Link(r.total?r.posPct+'%':'—',team,st.key,'R_POS','good')}</td><td class="scout-dv-bad">${scoutV630Link(r.total?r.error:'—',team,st.key,'R_ERR','bad')}</td><td class="scout-v630-divider">${scoutV630Link(a.total||'—',team,st.key,'A_T')}</td><td class="scout-dv-good">${scoutV630Link(a.total?a.perfect:'—',team,st.key,'A_KILL','good')}</td><td class="scout-dv-bad">${scoutV630Link(a.total?a.error:'—',team,st.key,'A_ERR','bad')}</td><td class="scout-dv-bad">${scoutV630Link(a.total?a.veryNegative:'—',team,st.key,'A_BLK','bad')}</td><td class="${a.total?(a.effPct>=0?'scout-dv-good':'scout-dv-bad'):''}">${scoutV630Link(a.total?a.effPct+'%':'—',team,st.key,'A_EFF',a.effPct>=0?'good':'bad')}</td><td class="scout-v630-divider scout-dv-good">${scoutV630Link(b.total?b.perfect:'—',team,st.key,'B_PTS','good')}</td><td>${scoutV630Link(d.total?d.posPct+'%':'—',team,st.key,'D_POS')}</td><td>${scoutV630Link(e.total?e.posPct+'%':'—',team,st.key,'E_POS')}</td><td class="scout-v630-divider scout-v630-k1">${scoutV630Link(k1v,team,st.key,'K1',k1.pct>=60?'good':(k1.total&&k1.pct<40?'bad':''))}</td><td class="scout-v630-k2">${scoutV630Link(k2v,team,st.key,'K2',k2.pct>=40?'good':(k2.total&&k2.pct<25?'bad':''))}</td><td><button class="ghost scout-dv-open" onclick="scoutOpenPlayerAnalysis('${team}','${encodeURIComponent(st.key)}')">Ficha</button></td></tr>`}
function scoutV630PopulateSetFilter(m){const sel=$('scout-v630-set');if(!sel||!m)return;const current=sel.value,sets=scoutArr(m.sets).map(s=>Number(s.number)).filter(Boolean);sel.innerHTML='<option value="">Todos los sets</option>'+sets.map(n=>`<option value="${n}">Set ${n}</option>`).join('');if(sets.includes(Number(current)))sel.value=current}
function scoutV630RenderSummary(m,team,stats){const box=$('scout-v630-filter-summary');if(!box)return;const f=scoutV630Filters(),chips=[team==='ours'?'Nuestro equipo':'Rival'];if(f.set)chips.push('Set '+f.set);if(f.rotation)chips.push('R'+f.rotation);if(f.phase)chips.push(f.phase==='K1'?'K1 · Side-out':'K2 · Break');const seq=scoutV630FilteredSequences(m,team);box.innerHTML=`<b>Muestra actual</b>${chips.map(x=>`<span class="scout-v630-filter-chip">${esc(x)}</span>`).join('')}<span>${stats.rows.length} acciones · ${seq.length} rallies</span><span class="scout-v630-sheet-note">Los porcentajes con muestra pequeña deben interpretarse con cautela.</span>`}
window.scoutV630ResetFilters=function(){['scout-v630-set','scout-v630-rotation','scout-v630-phase'].forEach(id=>{if($(id))$(id).value=''});scoutRenderPlayerAnalytics()};
window.scoutRenderPlayerAnalytics=function(){const box=$('scout-analysis-players');if(!box)return;const m=scoutMatchForAnalysis(),team=$('scout-player-team-scope')?.value||'ours';if(!m){box.innerHTML='<div class="match-empty">Selecciona un scouting.</div>';return}scoutV630PopulateSetFilter(m);const data=scoutV630Stats(m,team);scoutV630RenderSummary(m,team,data);if(!data.players.length&&!data.rows.length){box.innerHTML='<div class="match-empty">No hay jugadores ni acciones registradas para este filtro.</div>';return}box.innerHTML=`<div class="scout-dv-table-wrap"><table class="scout-dv-table scout-v630-table"><thead><tr class="group"><th rowspan="2">Jugador</th><th rowspan="2">ACC</th><th colspan="4" class="g-serve">SAQUE</th><th colspan="4" class="g-receive">RECEPCIÓN</th><th colspan="5" class="g-attack">ATAQUE</th><th colspan="3" class="g-other">OTROS</th><th colspan="2" class="g-phase">FASES</th><th rowspan="2"></th></tr><tr class="cols"><th class="scout-v630-divider">TOT</th><th>ACE</th><th>POS%</th><th>ERR</th><th class="scout-v630-divider">TOT</th><th>PERF%</th><th>POS%</th><th>ERR</th><th class="scout-v630-divider">TOT</th><th>KILL</th><th>ERR</th><th>BLK</th><th>EFF%</th><th class="scout-v630-divider">BLQ#</th><th>DEF%</th><th>COL%</th><th class="scout-v630-divider">K1%</th><th>K2%</th></tr></thead><tbody>${scoutV630Row(m,team,data.teamStat,true)}${data.players.map(st=>scoutV630Row(m,team,st,false)).join('')}</tbody></table></div>`};
function scoutV630ActionMetricRows(m,team,key,metric){const rows=scoutV630FilteredActions(m,team).filter(a=>key==='team'||scoutPlayerKey(a)===key);return scoutV630MetricActions(rows,metric)}
function scoutV630SequenceMetricRows(m,team,key,metric){const phase=metric==='K1'?'K1':'K2',skill=phase==='K1'?'R':'S';return scoutV630FilteredSequences(m,team).filter(x=>x.phase===phase&&(key==='team'||x.actions.some(a=>a.skill===skill&&scoutPlayerKey(a)===key)))}
window.scoutV630OpenDrill=function(team,encodedKey,metric){const m=scoutMatchForAnalysis();if(!m)return;const key=decodeURIComponent(encodedKey),titleKey=key==='team'?(team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival'):(scoutV630Stats(m,team).players.find(x=>x.key===key)?.label||'Jugador'),label=scoutV630MetricLabel(metric);$('scout-v630-drill-title').textContent=`${titleKey} · ${label}`;const f=scoutV630Filters(),filterText=[f.set?'Set '+f.set:'Todos los sets',f.rotation?'R'+f.rotation:'Todas las rotaciones',f.phase||'K1 + K2'].join(' · ');$('scout-v630-drill-subtitle').textContent=`${m.date} · ${EQUIPOS[equipoActivo].nombre} vs ${m.opponent} · ${filterText}`;const body=$('scout-v630-drill-body'),kpis=$('scout-v630-drill-kpis');if(metric==='K1'||metric==='K2'){const seq=scoutV630SequenceMetricRows(m,team,key,metric),won=seq.filter(x=>x.win).length,pct=seq.length?scoutPercent(won,seq.length):0;kpis.innerHTML=`<div><span>Rallies</span><b>${seq.length}</b></div><div><span>Ganados</span><b>${won}</b></div><div><span>Rendimiento</span><b>${seq.length?pct+'%':'—'}</b></div><div><span>Fase</span><b>${metric}</b></div>`;body.innerHTML=seq.length?`<table class="scout-v630-drill-table"><thead><tr><th>Set</th><th>Rally</th><th>Rot.</th><th>Recepción</th><th>Distribución</th><th>Ataque</th><th>Resultado</th></tr></thead><tbody>${seq.map(x=>`<tr><td>${x.set}</td><td>${x.rally}</td><td>R${x.rotation}</td><td>${esc(x.receptionEval||'—')}</td><td>${esc(V620_COMBO_LABELS[x.target]||x.target||'—')}</td><td>${esc(x.attackEval||'—')}</td><td class="${x.win?'scout-v630-result-win':'scout-v630-result-loss'}">${x.win?'GANADO':'PERDIDO'}</td></tr>`).join('')}</tbody></table>`:'<div class="match-empty">No hay secuencias para esta cifra.</div>'}else{const rows=scoutV630ActionMetricRows(m,team,key,metric),pos=rows.filter(a=>a.evaluation==='#'||a.evaluation==='+').length,err=rows.filter(a=>a.evaluation==='=').length;kpis.innerHTML=`<div><span>Acciones</span><b>${rows.length}</b></div><div><span>Positivas</span><b>${rows.length?scoutPercent(pos,rows.length)+'%':'—'}</b></div><div><span>#</span><b>${rows.filter(a=>a.evaluation==='#').length}</b></div><div><span>Errores</span><b>${err}</b></div>`;body.innerHTML=rows.length?`<table class="scout-v630-drill-table"><thead><tr><th>Set</th><th>Rally</th><th>Marcador</th><th>Rot.</th><th>Fase</th><th>Jugador</th><th>Código</th><th>Eval.</th><th>Zonas</th><th>Detalle</th><th>Tiempo</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.set}</td><td>${a.rallyIndex}</td><td>${esc(a.scoreBefore)} → ${esc(a.scoreAfter)}</td><td>R${scoutV630RotationForAction(a,team)}</td><td>${scoutV630PhaseForAction(a,team)}</td><td>${esc(scoutActionPlayerLabel(a))}</td><td><code>${esc(a.code||'')}</code></td><td><b>${esc(a.evaluation)}</b></td><td>${esc(scoutV6108ZoneText(a))}</td><td>${esc(scoutAdvancedMetaText(a)||'—')}</td><td>${scoutFormatTime(a.scoutMs)}</td></tr>`).join('')}</tbody></table>`:'<div class="match-empty">No hay acciones para esta cifra.</div>'}$('scout-v630-drill-modal')?.classList.add('open')};
window.scoutV630CloseDrill=function(){$('scout-v630-drill-modal')?.classList.remove('open')};
function scoutV630CSVRow(m,team,st,isTeam=false){const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),a=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D'),e=scoutSkillMetric(st,'E'),k1=scoutV630PlayerSequenceRate(m,team,st.key,'K1'),k2=scoutV630PlayerSequenceRate(m,team,st.key,'K2');return [isTeam?'TOTAL EQUIPO':st.label,st.total,s.total,s.perfect,s.posPct,s.error,r.total,r.perfPct,r.posPct,r.error,a.total,a.perfect,a.error,a.veryNegative,a.effPct,b.perfect,d.posPct,e.posPct,k1.total?k1.pct:'',k2.total?k2.pct:'']}
window.scoutExportStatsCSV=function(){const m=scoutMatchForAnalysis();if(!m){alert('No hay scouting seleccionado.');return}const team=$('scout-player-team-scope')?.value||'ours',data=scoutV630Stats(m,team),f=scoutV630Filters(),headers=['jugador','acciones','saque_total','saque_aces','saque_pos_pct','saque_errores','recepcion_total','recepcion_perf_pct','recepcion_pos_pct','recepcion_errores','ataque_total','ataque_kill','ataque_errores','ataque_bloqueado','ataque_eff_pct','bloqueo_puntos','defensa_pos_pct','colocacion_pos_pct','k1_sideout_pct','k2_break_pct'],rows=[scoutV630CSVRow(m,team,data.teamStat,true),...data.players.map(st=>scoutV630CSVRow(m,team,st))],meta=[['partido',`${EQUIPOS[equipoActivo].nombre} vs ${m.opponent}`],['fecha',m.date],['equipo_analizado',team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival'],['set',f.set||'todos'],['rotacion',f.rotation?`R${f.rotation}`:'todas'],['fase',f.phase||'K1+K2'],[]],csv='\uFEFF'+[...meta,headers,...rows].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_estadistica_v630.csv`)};


/* ===== V6.4 · TENDENCIAS TÁCTICAS ===== */
let scoutV640Mode='setter';
function scoutV640Pct(n,d){return d?Math.round(n/d*100):0}
function scoutV640Eff(actions){const n=actions.length,k=actions.filter(a=>a.evaluation==='#').length,e=actions.filter(a=>a.evaluation==='=').length,b=actions.filter(a=>a.evaluation==='/').length;return n?Math.round((k-e-b)/n*100):0}
function scoutV640Key(a){return a?scoutPlayerKey(a):''}
function scoutV640Enc(v){return encodeURIComponent(String(v??'')).replace(/'/g,'%27')}
function scoutV640ActionRowsByRally(m,team){const rows=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const acts=scoutArr(r.actions).filter(a=>a.team===team);const phase=r.servingBefore===team?'K2':'K1',rotation=team==='ours'?Number(r.rotationBefore)||1:Number(r.opponentRotationBefore)||1,rec=acts.find(a=>a.skill==='R');acts.forEach((a,ai)=>rows.push({action:a,set:Number(set.number)||1,rally:ri+1,phase,rotation,receptionEval:rec?.evaluation||'',rallyData:r,actionIndex:ai}))}));return rows}
function scoutV640DistributionEvents(m,team){const out=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const acts=scoutArr(r.actions).filter(a=>a.team===team),phase=r.servingBefore===team?'K2':'K1',rotation=team==='ours'?Number(r.rotationBefore)||1:Number(r.opponentRotationBefore)||1;for(let i=0;i<acts.length;i++){const setter=acts[i];if(setter.skill!=='E')continue;let attack=null;for(let j=i+1;j<acts.length;j++){if(acts[j].skill==='E')break;if(acts[j].skill==='A'){attack=acts[j];break}}let reception=null;for(let j=i-1;j>=0;j--){if(acts[j].skill==='E'||acts[j].skill==='A')break;if(acts[j].skill==='R'){reception=acts[j];break}}if(!reception)reception=acts.find(a=>a.skill==='R')||null;const target=setter.setTarget||attack?.attackCombo||'',recipientKey=scoutV640Key(attack),recipientLabel=attack?scoutActionPlayerLabel(attack):'Sin ataque asociado';out.push({set:Number(set.number)||1,rally:ri+1,phase,rotation,receptionEval:reception?.evaluation||'',setter,setterKey:scoutV640Key(setter),setterLabel:scoutActionPlayerLabel(setter),attack,recipientKey,recipientLabel,target,win:r.winner===team,rallyData:r})}}));return out}
function scoutV640Filters(){return {team:$('scout-v640-team')?.value||'ours',player:$('scout-v640-player')?.value||'',reception:$('scout-v640-reception')?.value||'',rotation:Number($('scout-v640-rotation')?.value)||0,phase:$('scout-v640-phase')?.value||'',set:Number($('scout-v640-set')?.value)||0}}
function scoutV640Match(){return scoutMatchForAnalysis()}
function scoutV640PopulateSets(m){const el=$('scout-v640-set');if(!el||!m)return;const current=el.value,sets=scoutArr(m.sets).map(s=>Number(s.number)).filter(Boolean);el.innerHTML='<option value="">Todos</option>'+sets.map(n=>`<option value="${n}">Set ${n}</option>`).join('');if(current&&sets.includes(Number(current)))el.value=current}
function scoutV640Candidates(m,team,mode){if(!m)return[];const map=new Map;if(mode==='setter'){scoutV640DistributionEvents(m,team).forEach(x=>{if(x.setterKey)map.set(x.setterKey,x.setterLabel)})}else{scoutV640ActionRowsByRally(m,team).filter(x=>x.action.skill==='A').forEach(x=>{const k=scoutV640Key(x.action);if(k)map.set(k,scoutActionPlayerLabel(x.action))})}return [...map.entries()].map(([key,label])=>({key,label})).sort((a,b)=>a.label.localeCompare(b.label,'es'))}
function scoutV640PopulatePlayers(force=false){const m=scoutV640Match(),team=$('scout-v640-team')?.value||'ours',el=$('scout-v640-player');if(!el||!m)return;const prev=force?'':el.value,list=scoutV640Candidates(m,team,scoutV640Mode);el.innerHTML=list.length?list.map(x=>`<option value="${encodeURIComponent(x.key)}">${esc(x.label)}</option>`).join(''):'<option value="">Sin datos</option>';if(prev&&list.some(x=>encodeURIComponent(x.key)===prev))el.value=prev}
function scoutV640DecodedPlayer(){const v=$('scout-v640-player')?.value||'';try{return decodeURIComponent(v)}catch{return v}}
function scoutV640FilterDistribution(m,f){const key=scoutV640DecodedPlayer();return scoutV640DistributionEvents(m,f.team).filter(x=>(!key||x.setterKey===key)&&(!f.set||x.set===f.set)&&(!f.rotation||x.rotation===f.rotation)&&(!f.phase||x.phase===f.phase)&&(!f.reception||x.receptionEval===f.reception))}
function scoutV640FilterAttacks(m,f){const key=scoutV640DecodedPlayer(),events=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const acts=scoutArr(r.actions).filter(a=>a.team===f.team),phase=r.servingBefore===f.team?'K2':'K1',rotation=f.team==='ours'?Number(r.rotationBefore)||1:Number(r.opponentRotationBefore)||1,rec=acts.find(a=>a.skill==='R')||null;acts.forEach((a,i)=>{if(a.skill!=='A'|| (key&&scoutV640Key(a)!==key))return;let setter=null;for(let j=i-1;j>=0;j--){if(acts[j].skill==='A')break;if(acts[j].skill==='E'){setter=acts[j];break}}events.push({action:a,set:Number(set.number)||1,rally:ri+1,phase,rotation,receptionEval:rec?.evaluation||'',setter,setterLabel:setter?scoutActionPlayerLabel(setter):'',target:setter?.setTarget||a.attackCombo||'',win:r.winner===f.team,rallyData:r})})}));return events.filter(x=>(!f.set||x.set===f.set)&&(!f.rotation||x.rotation===f.rotation)&&(!f.phase||x.phase===f.phase)&&(!f.reception||x.receptionEval===f.reception))}
function scoutV640LabelTarget(t){return V620_COMBO_LABELS[t]||t||'Sin destino'}
function scoutV640Group(rows,keyFn){const m=new Map;rows.forEach(x=>{const k=keyFn(x)||'—';if(!m.has(k))m.set(k,[]);m.get(k).push(x)});return [...m.entries()].sort((a,b)=>b[1].length-a[1].length)}
function scoutV640Bar(label,n,total,extra='',onclick=''){const pct=scoutV640Pct(n,total);return `<div class="scout-v640-bar" ${onclick?`onclick="${onclick}"`:''}><span class="scout-v640-bar-label">${esc(label)}</span><div class="scout-v640-track"><i style="width:${pct}%"></i></div><b>${pct}%</b><small>${n}/${total}${extra?' · '+esc(extra):''}</small></div>`}
function scoutV640SamplePill(n){return n<10?'<span class="scout-v640-pill warn">⚠ Muestra baja · '+n+'</span>':'<span class="scout-v640-pill">Muestra · '+n+'</span>'}
function scoutV640FilterSummary(f,n,label){const vals=[f.team==='ours'?'Nuestro equipo':'Rival',label,f.reception?'Recepción '+f.reception:'Cualquier recepción',f.rotation?'R'+f.rotation:'R1–R6',f.phase||'K1 + K2',f.set?'Set '+f.set:'Todos los sets'];$('scout-v640-filter-summary').innerHTML=vals.map(v=>`<span class="scout-v640-pill">${esc(v)}</span>`).join('')+scoutV640SamplePill(n)}
function scoutV640SetterView(m,f){const rows=scoutV640FilterDistribution(m,f),player=$('scout-v640-player')?.selectedOptions?.[0]?.textContent||'Colocador',targets=scoutV640Group(rows,x=>scoutV640LabelTarget(x.target)),recipients=scoutV640Group(rows,x=>x.recipientLabel),withAttack=rows.filter(x=>x.attack),kills=withAttack.filter(x=>x.attack.evaluation==='#').length,eff=scoutV640Eff(withAttack.map(x=>x.attack)),topT=targets[0],topR=recipients[0];scoutV640FilterSummary(f,rows.length,player);const kpis=`<div class="scout-v640-kpis"><div class="scout-v640-kpi"><span>Distribuciones</span><b>${rows.length}</b><small>${f.reception?'tras recepción '+esc(f.reception):'contexto filtrado'}</small></div><div class="scout-v640-kpi"><span>Destino principal</span><b>${topT?esc(topT[0]):'—'}</b><small>${topT?scoutV640Pct(topT[1].length,rows.length)+'%':'sin muestra'}</small></div><div class="scout-v640-kpi"><span>Jugador preferido</span><b>${topR?esc(topR[0].replace(/^#?\d+\s*[·-]?\s*/,'')):'—'}</b><small>${topR?scoutV640Pct(topR[1].length,rows.length)+'%':'sin muestra'}</small></div><div class="scout-v640-kpi"><span>Kill posterior</span><b>${withAttack.length?scoutV640Pct(kills,withAttack.length)+'%':'—'}</b><small>EFF ${withAttack.length?eff+'%':'—'}</small></div></div>`;if(!rows.length)return kpis+'<div class="scout-v640-empty">No hay distribuciones que cumplan estos filtros. Registra colocación y ataque dentro del mismo rally para construir tendencias.</div>';
const bars=targets.map(([k,v])=>scoutV640Bar(k,v.length,rows.length,'',`scoutV640OpenDrill('setterTarget','${scoutV640Enc(k)}')`)).join('');const recTable=recipients.map(([name,v])=>{const at=v.map(x=>x.attack).filter(Boolean),kill=at.filter(a=>a.evaluation==='#').length;return `<tr class="clickable" onclick="scoutV640OpenDrill('setterRecipient','${scoutV640Enc(name)}')"><td><strong>${esc(name)}</strong></td><td>${v.length}</td><td>${scoutV640Pct(v.length,rows.length)}%</td><td>${at.length?scoutV640Pct(kill,at.length)+'%':'—'}</td><td>${at.length?scoutV640Eff(at)+'%':'—'}</td></tr>`}).join('');const matrixTargets=targets.slice(0,5).map(x=>x[0]),allByRotation=scoutV640DistributionEvents(m,f.team).filter(x=>scoutV640Key(x.setter)===scoutV640DecodedPlayer()&&(!f.reception||x.receptionEval===f.reception)&&(!f.phase||x.phase===f.phase)&&(!f.set||x.set===f.set));const matrix=`<div class="scout-v640-matrix"><div class="head">Destino</div>${[1,2,3,4,5,6].map(r=>`<div class="head">R${r}</div>`).join('')}${matrixTargets.map(t=>{const rr=allByRotation.filter(x=>scoutV640LabelTarget(x.target)===t);return `<div class="row-label">${esc(t)}</div>${[1,2,3,4,5,6].map(r=>{const rot=allByRotation.filter(x=>x.rotation===r),n=rr.filter(x=>x.rotation===r).length,p=scoutV640Pct(n,rot.length);return `<div class="${p>=40&&n?'hot':''}">${rot.length?p+'%':'—'}</div>`}).join('')}`}).join('')}</div>`;const insight=topT?`<div class="scout-v640-insight"><b>Lectura:</b> ${esc(player)} utiliza ${esc(topT[0])} en el ${scoutV640Pct(topT[1].length,rows.length)}% de las distribuciones de este contexto${topR?`, y ${esc(topR[0])} es el destinatario más frecuente (${scoutV640Pct(topR[1].length,rows.length)}%)`:''}. ${rows.length<10?'Interpreta el patrón con cautela por el tamaño de la muestra.':''}</div>`:'';return kpis+`<div class="scout-v640-grid"><div class="scout-v640-card"><div class="scout-v640-card-head"><div><h4>¿Dónde coloca?</h4><small>Distribución por combinación / destino</small></div></div><div class="scout-v640-bars">${bars}</div></div><div class="scout-v640-card"><div class="scout-v640-card-head"><div><h4>¿A quién coloca?</h4><small>Frecuencia y eficacia posterior</small></div></div><div class="scout-v640-table-wrap"><table class="scout-v640-table"><thead><tr><th>Atacante</th><th>Balones</th><th>%</th><th>Kill%</th><th>EFF%</th></tr></thead><tbody>${recTable}</tbody></table></div></div><div class="scout-v640-card wide"><div class="scout-v640-card-head"><div><h4>Patrón por rotación</h4><small>Porcentaje de uso del destino dentro de cada R1–R6</small></div></div>${matrix}${insight}</div></div>`}
function scoutV640AttackerView(m,f){const rows=scoutV640FilterAttacks(m,f),player=$('scout-v640-player')?.selectedOptions?.[0]?.textContent||'Atacante',acts=rows.map(x=>x.action),kills=acts.filter(a=>a.evaluation==='#').length,errors=acts.filter(a=>a.evaluation==='=').length,blocked=acts.filter(a=>a.evaluation==='/').length,directions=scoutV640Group(rows,x=>{const a=x.action;return a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección')}),combos=scoutV640Group(rows,x=>scoutV640LabelTarget(x.target||x.action.attackCombo)),blockers=scoutV640Group(rows,x=>x.action.blockers!==''&&x.action.blockers!=null?String(x.action.blockers)+' bloqueadores':'Sin dato');scoutV640FilterSummary(f,rows.length,player);const top=directions[0];const kpis=`<div class="scout-v640-kpis"><div class="scout-v640-kpi"><span>Ataques</span><b>${rows.length}</b><small>${kills} punto · ${errors} error</small></div><div class="scout-v640-kpi"><span>Kill</span><b>${rows.length?scoutV640Pct(kills,rows.length)+'%':'—'}</b><small>${kills}/${rows.length}</small></div><div class="scout-v640-kpi"><span>Eficiencia</span><b>${rows.length?scoutV640Eff(acts)+'%':'—'}</b><small>${blocked} bloqueados</small></div><div class="scout-v640-kpi"><span>Dirección principal</span><b>${top?esc(top[0]):'—'}</b><small>${top?scoutV640Pct(top[1].length,rows.length)+'%':'sin muestra'}</small></div></div>`;if(!rows.length)return kpis+'<div class="scout-v640-empty">No hay ataques que cumplan estos filtros. Para estudiar direcciones registra zona de origen y destino en los ataques.</div>';const dirRows=directions.map(([name,v])=>{const aa=v.map(x=>x.action),k=aa.filter(a=>a.evaluation==='#').length;return `<tr class="clickable" onclick="scoutV640OpenDrill('attackDirection','${scoutV640Enc(name)}')"><td><strong>${esc(name)}</strong></td><td>${v.length}</td><td>${scoutV640Pct(v.length,rows.length)}%</td><td>${scoutV640Pct(k,v.length)}%</td><td>${scoutV640Eff(aa)}%</td></tr>`}).join('');const comboBars=combos.map(([k,v])=>scoutV640Bar(k,v.length,rows.length,'',`scoutV640OpenDrill('attackCombo','${scoutV640Enc(k)}')`)).join('');const blockerRows=blockers.map(([name,v])=>{const aa=v.map(x=>x.action),k=aa.filter(a=>a.evaluation==='#').length;return `<tr class="clickable" onclick="scoutV640OpenDrill('attackBlockers','${scoutV640Enc(name)}')"><td><strong>${esc(name)}</strong></td><td>${v.length}</td><td>${scoutV640Pct(k,v.length)}%</td><td>${scoutV640Eff(aa)}%</td></tr>`}).join('');const insight=top?`<div class="scout-v640-insight"><b>Lectura:</b> ${esc(player)} dirige el ${scoutV640Pct(top[1].length,rows.length)}% de sus ataques filtrados hacia ${esc(top[0])}. ${rows.length<10?'La muestra todavía es pequeña y no debería considerarse un patrón consolidado.':''}</div>`:'';return kpis+`<div class="scout-v640-grid"><div class="scout-v640-card"><div class="scout-v640-card-head"><div><h4>Direcciones de ataque</h4><small>Frecuencia, kill y eficiencia</small></div></div><div class="scout-v640-table-wrap"><table class="scout-v640-table"><thead><tr><th>Dirección</th><th>ATT</th><th>Uso%</th><th>Kill%</th><th>EFF%</th></tr></thead><tbody>${dirRows}</tbody></table></div>${insight}</div><div class="scout-v640-card"><div class="scout-v640-card-head"><div><h4>Tipo / combinación recibida</h4><small>Qué balón termina atacando</small></div></div><div class="scout-v640-bars">${comboBars}</div></div><div class="scout-v640-card wide"><div class="scout-v640-card-head"><div><h4>Respuesta según bloqueo</h4><small>Rendimiento según número de bloqueadores registrados</small></div></div><div class="scout-v640-table-wrap"><table class="scout-v640-table"><thead><tr><th>Bloqueo</th><th>ATT</th><th>Kill%</th><th>EFF%</th></tr></thead><tbody>${blockerRows}</tbody></table></div></div></div>`}
window.scoutV640SetMode=function(mode){scoutV640Mode=mode==='attacker'?'attacker':'setter';$('scout-v640-mode-setter')?.classList.toggle('active',scoutV640Mode==='setter');$('scout-v640-mode-attacker')?.classList.toggle('active',scoutV640Mode==='attacker');if($('scout-v640-reception'))$('scout-v640-reception').value=scoutV640Mode==='setter'?'#':'';if($('scout-v640-phase'))$('scout-v640-phase').value=scoutV640Mode==='setter'?'K1':'';scoutV640PopulatePlayers(true);scoutV640RenderTendencies()}
window.scoutV640FiltersChanged=function(force=false){scoutV640PopulatePlayers(force);scoutV640RenderTendencies()}
window.scoutV640ResetFilters=function(){if($('scout-v640-team'))$('scout-v640-team').value='ours';if($('scout-v640-reception'))$('scout-v640-reception').value=scoutV640Mode==='setter'?'#':'';if($('scout-v640-rotation'))$('scout-v640-rotation').value='';if($('scout-v640-phase'))$('scout-v640-phase').value=scoutV640Mode==='setter'?'K1':'';if($('scout-v640-set'))$('scout-v640-set').value='';scoutV640PopulatePlayers(true);scoutV640RenderTendencies()}
window.scoutV640RenderTendencies=function(){const box=$('scout-v640-tendencies'),m=scoutV640Match();if(!box)return;if(!m){box.innerHTML='<div class="scout-v640-empty">Selecciona un scouting para analizar las tendencias tácticas.</div>';return}scoutV640PopulateSets(m);if(!$('scout-v640-player')?.options?.length)scoutV640PopulatePlayers(true);const f=scoutV640Filters();box.innerHTML=scoutV640Mode==='setter'?scoutV640SetterView(m,f):scoutV640AttackerView(m,f)}
function scoutV640DrillRows(kind,value){const m=scoutV640Match(),f=scoutV640Filters();if(!m)return[];if(kind.startsWith('setter')){const rows=scoutV640FilterDistribution(m,f);if(kind==='setterTarget')return rows.filter(x=>scoutV640LabelTarget(x.target)===value);if(kind==='setterRecipient')return rows.filter(x=>x.recipientLabel===value)}else{const rows=scoutV640FilterAttacks(m,f);if(kind==='attackDirection')return rows.filter(x=>{const a=x.action,k=a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección');return k===value});if(kind==='attackCombo')return rows.filter(x=>scoutV640LabelTarget(x.target||x.action.attackCombo)===value);if(kind==='attackBlockers')return rows.filter(x=>((x.action.blockers!==''&&x.action.blockers!=null?String(x.action.blockers)+' bloqueadores':'Sin dato')===value))}return[]}
window.scoutV640OpenDrill=function(kind,encoded){const val=decodeURIComponent(encoded),rows=scoutV640DrillRows(kind,val),isSetter=kind.startsWith('setter'),title=(isSetter?'Colocador · ':'Atacante · ')+val;$('scout-v640-drill-title').textContent=title;const f=scoutV640Filters();$('scout-v640-drill-subtitle').textContent=[f.reception?'Recepción '+f.reception:'Recepción libre',f.rotation?'R'+f.rotation:'R1–R6',f.phase||'K1+K2',f.set?'Set '+f.set:'Todos los sets'].join(' · ');const attacks=rows.map(x=>isSetter?x.attack:x.action).filter(Boolean),kills=attacks.filter(a=>a.evaluation==='#').length;$('scout-v640-drill-kpis').innerHTML=`<div><span>Muestra</span><b>${rows.length}</b></div><div><span>Ataques asociados</span><b>${attacks.length}</b></div><div><span>Kill</span><b>${attacks.length?scoutV640Pct(kills,attacks.length)+'%':'—'}</b></div><div><span>Eficiencia</span><b>${attacks.length?scoutV640Eff(attacks)+'%':'—'}</b></div>`;$('scout-v640-drill-body').innerHTML=rows.length?`<table class="scout-v640-drill-table"><thead><tr><th>Set</th><th>Rally</th><th>Rot.</th><th>Fase</th><th>${isSetter?'Colocador':'Atacante'}</th><th>Recep.</th><th>Destino</th><th>Atacante</th><th>Eval.</th><th>Dirección</th><th>Resultado</th></tr></thead><tbody>${rows.map(x=>{const a=isSetter?x.attack:x.action;return `<tr><td>${x.set}</td><td>${x.rally}</td><td>R${x.rotation}</td><td>${x.phase}</td><td>${esc(isSetter?x.setterLabel:scoutActionPlayerLabel(x.action))}</td><td>${esc(x.receptionEval||'—')}</td><td>${esc(scoutV640LabelTarget(isSetter?x.target:(x.target||x.action.attackCombo)))}</td><td>${esc(isSetter?x.recipientLabel:scoutActionPlayerLabel(x.action))}</td><td><b>${esc(a?.evaluation||'—')}</b></td><td>${esc(scoutV6108ZoneText(a))}</td><td>${x.win?'Punto':'Sin punto'}</td></tr>`}).join('')}</tbody></table>`:'<div class="scout-v640-empty">No hay acciones para este patrón.</div>';$('scout-v640-drill-modal')?.classList.add('open')}
window.scoutV640CloseDrill=function(){$('scout-v640-drill-modal')?.classList.remove('open')}


/* ===== V6.6.0 · PLAN DE PARTIDO ===== */
let scoutV650Mode='setter';
function scoutV650OpponentKey(name){return String(name||'Rival').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()||'rival'}
function scoutV650Groups(){const map=new Map();scoutingMatches.forEach(m=>{if(!m)return;const key=scoutV650OpponentKey(m.opponent),actions=scoutActionCount(m),rallies=scoutArr(m.sets).reduce((n,s)=>n+scoutArr(s.rallies).length,0);if(!actions&&!rallies)return;if(!map.has(key))map.set(key,{key,name:String(m.opponent||'Rival').trim()||'Rival',matches:[]});map.get(key).matches.push(m)});return [...map.values()].map(g=>({...g,matches:g.matches.slice().sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt)))})).sort((a,b)=>String(b.matches[0]?.date||'').localeCompare(String(a.matches[0]?.date||''))||a.name.localeCompare(b.name,'es'))}
function scoutV650SelectedGroup(){const key=$('scout-v650-rival')?.value||'',groups=scoutV650Groups();return groups.find(g=>g.key===key)||groups[0]||null}
function scoutV650Matches(){const g=scoutV650SelectedGroup();if(!g)return[];const n=$('scout-v650-period')?.value||'all';return n==='all'?g.matches:g.matches.slice(0,Math.max(1,Number(n)||3))}
function scoutV650PopulateRivals(force=false){const sel=$('scout-v650-rival');if(!sel)return;const groups=scoutV650Groups(),prev=force?'':sel.value;sel.innerHTML=groups.length?groups.map(g=>`<option value="${esc(g.key)}">${esc(g.name)} · ${g.matches.length} partido${g.matches.length===1?'':'s'}</option>`).join(''):'<option value="">Sin rivales con datos</option>';if(prev&&groups.some(g=>g.key===prev))sel.value=prev}
function scoutV650AllActions(matches){return matches.flatMap(m=>scoutActionRows(m,true).filter(a=>a.team==='opponent').map(a=>({...a,match:m})))}
function scoutV650AllSequences(matches){return matches.flatMap(m=>scoutSequenceRows(m,'opponent').map(x=>({...x,match:m})))}
function scoutV650Distribution(matches){return matches.flatMap(m=>scoutV640DistributionEvents(m,'opponent').map(x=>({...x,match:m}))) }
function scoutV650Attacks(matches){const out=[];matches.forEach(m=>scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const acts=scoutArr(r.actions).filter(a=>a.team==='opponent'),phase=r.servingBefore==='opponent'?'K2':'K1',rotation=Number(r.opponentRotationBefore)||1,rec=acts.find(a=>a.skill==='R')||null;acts.forEach((a,i)=>{if(a.skill!=='A')return;let setter=null;for(let j=i-1;j>=0;j--){if(acts[j].skill==='A')break;if(acts[j].skill==='E'){setter=acts[j];break}}out.push({match:m,action:a,set:Number(set.number)||1,rally:ri+1,phase,rotation,receptionEval:rec?.evaluation||'',setter,setterLabel:setter?scoutActionPlayerLabel(setter):'',target:setter?.setTarget||a.attackCombo||'',win:r.winner==='opponent',rallyData:r})})})));return out}
function scoutV650CandidateMap(matches,mode){const map=new Map;if(mode==='setter')scoutV650Distribution(matches).forEach(x=>{if(x.setterKey)map.set(x.setterKey,x.setterLabel)});else scoutV650Attacks(matches).forEach(x=>{const k=scoutV640Key(x.action);if(k)map.set(k,scoutActionPlayerLabel(x.action))});return [...map.entries()].map(([key,label])=>({key,label})).sort((a,b)=>a.label.localeCompare(b.label,'es'))}
function scoutV650PopulatePlayers(force=false){const el=$('scout-v650-player');if(!el)return;const matches=scoutV650Matches(),prev=force?'':el.value,list=scoutV650CandidateMap(matches,scoutV650Mode);el.innerHTML=list.length?list.map(x=>`<option value="${encodeURIComponent(x.key)}">${esc(x.label)}</option>`).join(''):'<option value="">Sin datos</option>';if(prev&&list.some(x=>encodeURIComponent(x.key)===prev))el.value=prev}
function scoutV650PlayerKey(){try{return decodeURIComponent($('scout-v650-player')?.value||'')}catch(_){return $('scout-v650-player')?.value||''}}
function scoutV650Filters(){return {player:scoutV650PlayerKey(),reception:$('scout-v650-reception')?.value||'',rotation:Number($('scout-v650-rotation')?.value)||0,phase:$('scout-v650-phase')?.value||''}}
function scoutV650FilterSetter(matches){const f=scoutV650Filters();return scoutV650Distribution(matches).filter(x=>(!f.player||x.setterKey===f.player)&&(!f.reception||x.receptionEval===f.reception)&&(!f.rotation||x.rotation===f.rotation)&&(!f.phase||x.phase===f.phase))}
function scoutV650FilterAttacker(matches){const f=scoutV650Filters();return scoutV650Attacks(matches).filter(x=>(!f.player||scoutV640Key(x.action)===f.player)&&(!f.reception||x.receptionEval===f.reception)&&(!f.rotation||x.rotation===f.rotation)&&(!f.phase||x.phase===f.phase))}
function scoutV650Group(rows,fn){const map=new Map;rows.forEach(x=>{const k=fn(x)||'Sin dato';if(!map.has(k))map.set(k,[]);map.get(k).push(x)});return [...map.entries()].sort((a,b)=>b[1].length-a[1].length||String(a[0]).localeCompare(String(b[0]),'es'))}
function scoutV650Bar(label,count,total,kind){const pct=total?Math.round(count/total*100):0;return `<div class="scout-v650-bar" onclick="scoutV650OpenDrill('${kind}','${encodeURIComponent(label)}')"><span title="${esc(label)}">${esc(label)}</span><div class="scout-v650-track"><i style="width:${Math.min(100,pct)}%"></i></div><b>${pct}%</b></div>`}
function scoutV650RallyCount(matches){return matches.reduce((n,m)=>n+scoutArr(m.sets).reduce((a,s)=>a+scoutArr(s.rallies).length,0),0)}
function scoutV650Result(m){const s=scoutSetsScore(m);return {us:s.us,opp:s.opponent,label:`${s.us}–${s.opponent}`,cls:s.us>s.opponent?'win':s.us<s.opponent?'loss':''}}
function scoutV650RotationData(matches){const seq=scoutV650AllSequences(matches),dist=scoutV650Distribution(matches);return [1,2,3,4,5,6].map(no=>{const rot=seq.filter(x=>Number(x.rotation)===no),k1=rot.filter(x=>x.phase==='K1'),k2=rot.filter(x=>x.phase==='K2'),rd=dist.filter(x=>Number(x.rotation)===no),tg=scoutV650Group(rd,x=>scoutV640LabelTarget(x.target))[0];return {no,k1Total:k1.length,k1Won:k1.filter(x=>x.win).length,k2Total:k2.length,k2Won:k2.filter(x=>x.win).length,target:tg?.[0]||'',targetPct:tg?scoutV640Pct(tg[1].length,rd.length):0}})}
function scoutV650Roster(matches){const map=new Map;scoutV650AllActions(matches).forEach(a=>{const k=scoutPlayerKey(a),label=scoutActionPlayerLabel(a);if(!map.has(k))map.set(k,{key:k,label,count:0});map.get(k).count++});return [...map.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'es'))}
function scoutV650MatchTable(matches){return `<div class="scout-v650-table-wrap"><table class="scout-v650-table"><thead><tr><th>Fecha</th><th>Competición</th><th>Resultado</th><th class="num">Rallies</th><th class="num">Acciones rival</th><th></th></tr></thead><tbody>${matches.map(m=>{const res=scoutV650Result(m),r=scoutArr(m.sets).reduce((n,s)=>n+scoutArr(s.rallies).length,0),a=scoutActionRows(m,true).filter(x=>x.team==='opponent').length;return `<tr><td><strong>${esc(m.date)}</strong></td><td>${esc(m.competition||'—')}</td><td><span class="scout-v650-match-chip ${res.cls}">${res.label}</span></td><td class="num">${r}</td><td class="num">${a}</td><td class="num"><button class="ghost" onclick="scoutV650OpenMatch(${m.id})">Ver partido</button></td></tr>`}).join('')}</tbody></table></div>`}
function scoutV650SetterHTML(matches){const rows=scoutV650FilterSetter(matches),targets=scoutV650Group(rows,x=>scoutV640LabelTarget(x.target)),recipients=scoutV650Group(rows,x=>x.recipientLabel),att=rows.filter(x=>x.attack),kills=att.filter(x=>x.attack.evaluation==='#').length,eff=scoutV640Eff(att.map(x=>x.attack)),top=targets[0],player=$('scout-v650-player')?.selectedOptions?.[0]?.textContent||'Colocador';const perMatch=matches.map(m=>{const r=rows.filter(x=>Number(x.match.id)===Number(m.id)),tg=scoutV650Group(r,x=>scoutV640LabelTarget(x.target))[0],at=r.filter(x=>x.attack),k=at.filter(x=>x.attack.evaluation==='#').length;return {m,r,tg,kill:at.length?scoutV640Pct(k,at.length):null}}).filter(x=>x.r.length);const stable=top?perMatch.filter(x=>x.tg?.[0]===top[0]).length:0;const recRows=recipients.slice(0,10).map(([name,v])=>{const aa=v.map(x=>x.attack).filter(Boolean),k=aa.filter(a=>a.evaluation==='#').length;return `<tr class="clickable" onclick="scoutV650OpenDrill('setterRecipient','${encodeURIComponent(name)}')"><td><strong>${esc(name)}</strong></td><td class="num">${v.length}</td><td class="num">${scoutV640Pct(v.length,rows.length)}%</td><td class="num">${aa.length?scoutV640Pct(k,aa.length)+'%':'—'}</td><td class="num">${aa.length?scoutV640Eff(aa)+'%':'—'}</td></tr>`}).join('');return `<div class="scout-v650-card"><div class="scout-v650-card-head"><div><h4>Distribución histórica de ${esc(player)}</h4><small>Qué elige el colocador en el contexto seleccionado</small></div><span class="scout-v650-sample ${rows.length<10?'warn':''}">${rows.length} distribuciones</span></div>${rows.length?`<div class="scout-v650-bars">${targets.slice(0,8).map(([k,v])=>scoutV650Bar(k,v.length,rows.length,'setterTarget')).join('')}</div><div class="scout-v650-insight"><b>Patrón principal:</b> ${top?esc(top[0])+' · '+scoutV640Pct(top[1].length,rows.length)+'%':'—'}. ${perMatch.length?`Se repite como primera opción en ${stable}/${perMatch.length} partidos con muestra.`:''}${rows.length<10?' Muestra reducida: úsalo como indicio, no como patrón consolidado.':''}</div>`:'<div class="scout-v650-empty">No hay distribuciones que cumplan los filtros.</div>'}</div><div class="scout-v650-card"><div class="scout-v650-card-head"><div><h4>Atacantes elegidos</h4><small>Uso y rendimiento posterior</small></div><span class="scout-v650-sample">Kill ${att.length?scoutV640Pct(kills,att.length)+'%':'—'} · EFF ${att.length?eff+'%':'—'}</span></div>${recRows?`<div class="scout-v650-table-wrap"><table class="scout-v650-table"><thead><tr><th>Atacante</th><th class="num">Balones</th><th class="num">Uso</th><th class="num">Kill</th><th class="num">EFF</th></tr></thead><tbody>${recRows}</tbody></table></div>`:'<div class="scout-v650-empty">Sin ataques asociados.</div>'}</div><div class="scout-v650-card wide"><div class="scout-v650-card-head"><div><h4>Estabilidad partido a partido</h4><small>Comprueba si la preferencia se mantiene en encuentros diferentes</small></div></div>${perMatch.length?`<div class="scout-v650-table-wrap"><table class="scout-v650-table"><thead><tr><th>Partido</th><th>Primera opción</th><th class="num">Uso</th><th class="num">Distribuciones</th><th class="num">Kill posterior</th></tr></thead><tbody>${perMatch.map(x=>`<tr><td><strong>${esc(x.m.date)}</strong></td><td>${esc(x.tg?.[0]||'—')}</td><td class="num">${x.tg?scoutV640Pct(x.tg[1].length,x.r.length)+'%':'—'}</td><td class="num">${x.r.length}</td><td class="num">${x.kill==null?'—':x.kill+'%'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="scout-v650-empty">Necesitas datos del colocador en más de un encuentro para estudiar estabilidad.</div>'}</div>`}
function scoutV650AttackerHTML(matches){const rows=scoutV650FilterAttacker(matches),dirs=scoutV650Group(rows,x=>{const a=x.action;return a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección')}),combos=scoutV650Group(rows,x=>scoutV640LabelTarget(x.target||x.action.attackCombo)),acts=rows.map(x=>x.action),kills=acts.filter(a=>a.evaluation==='#').length,eff=scoutV640Eff(acts),top=dirs[0],player=$('scout-v650-player')?.selectedOptions?.[0]?.textContent||'Atacante';const perMatch=matches.map(m=>{const r=rows.filter(x=>Number(x.match.id)===Number(m.id)),dg=scoutV650Group(r,x=>{const a=x.action;return a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección')} )[0],aa=r.map(x=>x.action),k=aa.filter(a=>a.evaluation==='#').length;return {m,r,dg,kill:r.length?scoutV640Pct(k,r.length):null,eff:r.length?scoutV640Eff(aa):null}}).filter(x=>x.r.length);const stable=top?perMatch.filter(x=>x.dg?.[0]===top[0]).length:0;const comboRows=combos.slice(0,10).map(([name,v])=>{const aa=v.map(x=>x.action),k=aa.filter(a=>a.evaluation==='#').length;return `<tr class="clickable" onclick="scoutV650OpenDrill('attackCombo','${encodeURIComponent(name)}')"><td><strong>${esc(name)}</strong></td><td class="num">${v.length}</td><td class="num">${scoutV640Pct(v.length,rows.length)}%</td><td class="num">${scoutV640Pct(k,v.length)}%</td><td class="num">${scoutV640Eff(aa)}%</td></tr>`}).join('');return `<div class="scout-v650-card"><div class="scout-v650-card-head"><div><h4>Direcciones históricas de ${esc(player)}</h4><small>Frecuencia de ataque y rendimiento por dirección</small></div><span class="scout-v650-sample ${rows.length<10?'warn':''}">${rows.length} ataques</span></div>${rows.length?`<div class="scout-v650-bars">${dirs.slice(0,8).map(([k,v])=>scoutV650Bar(k,v.length,rows.length,'attackDirection')).join('')}</div><div class="scout-v650-insight"><b>Patrón principal:</b> ${top?esc(top[0])+' · '+scoutV640Pct(top[1].length,rows.length)+'%':'—'}. ${perMatch.length?`Es la dirección principal en ${stable}/${perMatch.length} partidos con muestra.`:''}${rows.length<10?' Muestra reducida: no la consideres todavía una tendencia estable.':''}</div>`:'<div class="scout-v650-empty">No hay ataques que cumplan los filtros.</div>'}</div><div class="scout-v650-card"><div class="scout-v650-card-head"><div><h4>Balón recibido</h4><small>Combinación, uso y eficacia del atacante</small></div><span class="scout-v650-sample">Kill ${rows.length?scoutV640Pct(kills,rows.length)+'%':'—'} · EFF ${rows.length?eff+'%':'—'}</span></div>${comboRows?`<div class="scout-v650-table-wrap"><table class="scout-v650-table"><thead><tr><th>Balón</th><th class="num">ATT</th><th class="num">Uso</th><th class="num">Kill</th><th class="num">EFF</th></tr></thead><tbody>${comboRows}</tbody></table></div>`:'<div class="scout-v650-empty">Sin combinación codificada.</div>'}</div><div class="scout-v650-card wide"><div class="scout-v650-card-head"><div><h4>Estabilidad partido a partido</h4><small>Dirección principal y rendimiento en cada encuentro</small></div></div>${perMatch.length?`<div class="scout-v650-table-wrap"><table class="scout-v650-table"><thead><tr><th>Partido</th><th>Dirección principal</th><th class="num">Uso</th><th class="num">Ataques</th><th class="num">Kill</th><th class="num">EFF</th></tr></thead><tbody>${perMatch.map(x=>`<tr><td><strong>${esc(x.m.date)}</strong></td><td>${esc(x.dg?.[0]||'—')}</td><td class="num">${x.dg?scoutV640Pct(x.dg[1].length,x.r.length)+'%':'—'}</td><td class="num">${x.r.length}</td><td class="num">${x.kill==null?'—':x.kill+'%'}</td><td class="num">${x.eff==null?'—':x.eff+'%'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="scout-v650-empty">Necesitas ataques en más de un encuentro para estudiar estabilidad.</div>'}</div>`}
function scoutV650RotationHTML(matches){const data=scoutV650RotationData(matches);return `<div class="scout-v650-rotation-grid">${data.map(r=>`<div class="scout-v650-rotation"><strong>R${r.no}</strong><p><span>Side-out rival</span><b>${r.k1Total?scoutV640Pct(r.k1Won,r.k1Total)+'%':'—'}</b></p><p><span>Break rival</span><b>${r.k2Total?scoutV640Pct(r.k2Won,r.k2Total)+'%':'—'}</b></p><p><span>Destino frecuente</span><b>${r.target?esc(r.target)+' '+r.targetPct+'%':'—'}</b></p><p><span>Muestra</span><b>${r.k1Total+r.k2Total}</b></p></div>`).join('')}</div>`}
window.scoutV650RivalChanged=function(){scoutV650PopulatePlayers(true);scoutV650Render()}
window.scoutV650PeriodChanged=function(){scoutV650PopulatePlayers(false);scoutV650Render()}
window.scoutV650SetMode=function(mode){scoutV650Mode=mode==='attacker'?'attacker':'setter';$('scout-v650-mode-setter')?.classList.toggle('active',scoutV650Mode==='setter');$('scout-v650-mode-attacker')?.classList.toggle('active',scoutV650Mode==='attacker');if($('scout-v650-reception'))$('scout-v650-reception').value=scoutV650Mode==='setter'?'#':'';if($('scout-v650-phase'))$('scout-v650-phase').value=scoutV650Mode==='setter'?'K1':'';scoutV650PopulatePlayers(true);scoutV650Render()}
window.scoutV650Render=function(){const box=$('scout-v650-body');if(!box)return;scoutV650PopulateRivals(false);const group=scoutV650SelectedGroup(),matches=scoutV650Matches();if(!group||!matches.length){box.innerHTML='<div class="scout-v650-empty">Todavía no hay suficientes scoutings de rivales para construir una ficha histórica.</div>';return}if(!$('scout-v650-player')?.options?.length)scoutV650PopulatePlayers(true);const actions=scoutV650AllActions(matches),rallies=scoutV650RallyCount(matches),last=matches[0],first=matches[matches.length-1],roster=scoutV650Roster(matches),modeRows=scoutV650Mode==='setter'?scoutV650FilterSetter(matches):scoutV650FilterAttacker(matches);box.innerHTML=`<div class="scout-v650-rival-header"><div><span class="pro-kicker" style="color:#9fb2c4">DOSSIER HISTÓRICO</span><h4>${esc(group.name)}</h4><p>${esc(first?.date||'—')} → ${esc(last?.date||'—')} · ${matches.length} partido${matches.length===1?'':'s'} incluidos</p></div><span class="scout-v650-rival-badge">${scoutV650Mode==='setter'?'Distribución rival':'Ataque rival'}</span></div><div class="scout-v650-kpis"><div class="scout-v650-kpi"><span>Partidos</span><b>${matches.length}</b><small>${group.matches.length} disponibles</small></div><div class="scout-v650-kpi"><span>Rallies</span><b>${rallies}</b><small>muestra acumulada</small></div><div class="scout-v650-kpi"><span>Acciones rival</span><b>${actions.length}</b><small>acciones codificadas</small></div><div class="scout-v650-kpi"><span>Jugadores observados</span><b>${roster.length}</b><small>identidades detectadas</small></div><div class="scout-v650-kpi"><span>Muestra filtro</span><b>${modeRows.length}</b><small>${modeRows.length<10?'todavía reducida':'patrón analizable'}</small></div></div><div class="scout-v650-grid"><div class="scout-v650-card wide"><div class="scout-v650-card-head"><div><h4>Partidos incluidos</h4><small>Abre cualquiera para volver al Data Sheet individual del encuentro</small></div></div>${scoutV650MatchTable(matches)}</div>${scoutV650Mode==='setter'?scoutV650SetterHTML(matches):scoutV650AttackerHTML(matches)}<div class="scout-v650-card wide"><div class="scout-v650-card-head"><div><h4>Perfil de rotaciones del rival</h4><small>Side-out, break point y preferencia de distribución acumulados por R1–R6</small></div></div>${scoutV650RotationHTML(matches)}</div><div class="scout-v650-card wide"><div class="scout-v650-card-head"><div><h4>Plantilla observada</h4><small>Jugadores rivales identificados en los scoutings incluidos</small></div></div><div class="scout-v650-roster">${roster.slice(0,30).map(p=>`<span class="scout-v650-player-chip"><b>${esc(p.label)}</b>${p.count} acc.</span>`).join('')||'<span class="muted">Sin jugadores identificados</span>'}</div></div></div>`}
window.scoutV650OpenMatch=function(id){const sel=$('scout-analysis-match');if(sel)sel.value=String(id);scoutRenderAnalysis();document.querySelector('.scout-player-analysis-panel')?.scrollIntoView({behavior:'smooth',block:'start'})}
function scoutV650DrillRows(kind,val){const matches=scoutV650Matches();if(kind.startsWith('setter')){const rows=scoutV650FilterSetter(matches);if(kind==='setterTarget')return rows.filter(x=>scoutV640LabelTarget(x.target)===val);if(kind==='setterRecipient')return rows.filter(x=>x.recipientLabel===val)}else{const rows=scoutV650FilterAttacker(matches);if(kind==='attackDirection')return rows.filter(x=>{const a=x.action,k=a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección');return k===val});if(kind==='attackCombo')return rows.filter(x=>scoutV640LabelTarget(x.target||x.action.attackCombo)===val)}return[]}
window.scoutV650OpenDrill=function(kind,encoded){const val=decodeURIComponent(encoded),rows=scoutV650DrillRows(kind,val),setter=kind.startsWith('setter'),attacks=rows.map(x=>setter?x.attack:x.action).filter(Boolean),kills=attacks.filter(a=>a.evaluation==='#').length;$('scout-v650-drill-title').textContent=(setter?'Distribución · ':'Ataque · ')+val;$('scout-v650-drill-subtitle').textContent=`Histórico ${scoutV650SelectedGroup()?.name||'rival'} · ${rows.length} registros`;const unique=new Set(rows.map(x=>Number(x.match?.id))).size;$('scout-v650-drill-kpis').innerHTML=`<div><span>Muestra</span><b>${rows.length}</b></div><div><span>Partidos</span><b>${unique}</b></div><div><span>Kill posterior</span><b>${attacks.length?scoutV640Pct(kills,attacks.length)+'%':'—'}</b></div><div><span>Eficiencia</span><b>${attacks.length?scoutV640Eff(attacks)+'%':'—'}</b></div>`;$('scout-v650-drill-body').innerHTML=rows.length?`<table class="scout-v650-table"><thead><tr><th>Fecha</th><th>Set</th><th>Rally</th><th>Rot.</th><th>Fase</th><th>Recep.</th><th>Colocador</th><th>Destino</th><th>Atacante</th><th>Eval.</th><th>Dirección</th><th>Resultado</th></tr></thead><tbody>${rows.map(x=>{const a=setter?x.attack:x.action;return `<tr><td>${esc(x.match?.date||'—')}</td><td>${x.set}</td><td>${x.rally}</td><td>R${x.rotation}</td><td>${esc(x.phase)}</td><td>${esc(x.receptionEval||'—')}</td><td>${esc(setter?x.setterLabel:(x.setterLabel||'—'))}</td><td>${esc(scoutV640LabelTarget(setter?x.target:(x.target||x.action.attackCombo)))}</td><td>${esc(setter?x.recipientLabel:scoutActionPlayerLabel(x.action))}</td><td><b>${esc(a?.evaluation||'—')}</b></td><td>${esc(scoutV6108ZoneText(a))}</td><td>${x.win?'Punto rival':'Sin punto'}</td></tr>`}).join('')}</tbody></table>`:'<div class="scout-v650-empty">Sin acciones para este patrón.</div>';$('scout-v650-drill-modal')?.classList.add('open')}
window.scoutV650CloseDrill=function(){$('scout-v650-drill-modal')?.classList.remove('open')}
window.scoutV650ExportPDF=async function(){const group=scoutV650SelectedGroup(),matches=scoutV650Matches();if(!group||!matches.length){alert('No hay un rival seleccionado.');return}if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}const body=$('scout-v650-body');if(!body)return;scoutExportNotice(true,'Preparando dossier del rival…');try{const report=document.createElement('div');report.style.cssText='position:fixed;left:-20000px;top:0;width:1180px;background:#fff;color:#17324d;padding:42px;font-family:Arial,Helvetica,sans-serif;z-index:-1';report.innerHTML=`<div style="border-bottom:4px solid #102b43;padding-bottom:18px;margin-bottom:18px"><div style="font-size:11px;font-weight:900;letter-spacing:.16em;color:#718394">VOLLEY COACH · OPPONENT DOSSIER</div><h1 style="font-size:30px;margin:7px 0;color:#102b43">${esc(group.name)}</h1><div style="font-size:13px;color:#6f7f8c">${matches.length} partidos analizados · ${scoutV650RallyCount(matches)} rallies · ${scoutV650AllActions(matches).length} acciones rivales</div></div>${body.innerHTML}<div style="margin-top:24px;border-top:1px solid #dfe6eb;padding-top:10px;color:#84919b;font-size:9px">Generado por Volley Coach · V6.5.0 · Los patrones dependen de la calidad y cantidad del scouting registrado.</div>`;report.querySelectorAll('button,select').forEach(x=>x.remove());document.body.appendChild(report);const canvas=await html2canvas(report,{scale:1.35,backgroundColor:'#ffffff',logging:false,useCORS:true});report.remove();const {jsPDF}=window.jspdf,pdf=new jsPDF('p','mm','a4'),margin=8,pageW=210-margin*2,pageH=297-margin*2,imgW=pageW,imgH=canvas.height*imgW/canvas.width,img=canvas.toDataURL('image/jpeg',.92);let y=margin,remaining=imgH;pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH;while(remaining>0){pdf.addPage();y=margin-(imgH-remaining);pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH}pdf.save(`${scoutSafeFilename(group.name)}_dossier_rival_v650.pdf`)}catch(err){console.error(err);alert('No se ha podido generar el dossier PDF.')}finally{scoutExportNotice(false)}}


/* ===== V6.6 · PLAN DE PARTIDO ===== */
function scoutV660NormalizePlan(p){const x=p&&typeof p==='object'?scoutClone(p):{};x.id=Number(x.id)||Date.now();x.opponentKey=String(x.opponentKey||scoutV650OpponentKey(x.opponentName||''));x.opponentName=String(x.opponentName||'Rival');x.period=String(x.period||'all');x.linkedMatchId=Number(x.linkedMatchId)||null;x.sourceMatchIds=scoutArr(x.sourceMatchIds).map(Number).filter(Boolean);x.auto=x.auto&&typeof x.auto==='object'?x.auto:{};x.staff={serve:String(x.staff?.serve||''),block:String(x.staff?.block||''),defense:String(x.staff?.defense||''),rotations:String(x.staff?.rotations||''),notes:String(x.staff?.notes||'')};x.status=x.status==='ready'?'ready':'draft';x.generatedAt=x.generatedAt||null;x.updatedAt=x.updatedAt||scoutNow();return x}
let scoutingGamePlans=scoutArr(equiposData?.[equipoActivo]?.scoutingGamePlans).map(scoutV660NormalizePlan);
const v660PrevEmpty=estadoEquipoVacio;estadoEquipoVacio=function(id){const s=v660PrevEmpty(id);if(!Array.isArray(s.scoutingGamePlans))s.scoutingGamePlans=[];return s};
const v660PrevClean=limpiarEquipo;limpiarEquipo=function(raw,id){const s=v660PrevClean(raw,id);s.scoutingGamePlans=scoutArr(raw?.scoutingGamePlans||s.scoutingGamePlans).map(scoutV660NormalizePlan);return s};
const v660PrevMem=guardarEquipoEnMemoria;guardarEquipoEnMemoria=function(){v660PrevMem();if(equiposData?.[equipoActivo])equiposData[equipoActivo].scoutingGamePlans=scoutClone(scoutingGamePlans)};
const v660PrevLoad=cargarEquipoEnVariables;cargarEquipoEnVariables=function(id){const out=v660PrevLoad(id);scoutingGamePlans=scoutArr(equiposData?.[id]?.scoutingGamePlans).map(scoutV660NormalizePlan);return out};
const v660PrevTeam=window.cambiarEquipo;window.cambiarEquipo=function(id){const out=v660PrevTeam(id);scoutingGamePlans=scoutArr(equiposData?.[equipoActivo]?.scoutingGamePlans).map(scoutV660NormalizePlan);scoutV660PopulateRivals(false);scoutV660Render();return out};
function scoutV660Persist(){if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);equiposData[equipoActivo].scoutingGamePlans=scoutClone(scoutingGamePlans);guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();programarSubidaCloud()}
function scoutV660Groups(){return scoutV650Groups()}
function scoutV660SelectedGroup(){const key=$('scout-v660-rival')?.value||'';return scoutV660Groups().find(g=>g.key===key)||scoutV660Groups()[0]||null}
function scoutV660Matches(){const g=scoutV660SelectedGroup();if(!g)return[];const n=$('scout-v660-period')?.value||'all';return n==='all'?g.matches:g.matches.slice(0,Math.max(1,Number(n)||3))}
function scoutV660PlanForKey(key){return scoutingGamePlans.find(p=>p.opponentKey===key)||null}
function scoutV660Pct(n,d){return d?Math.round(n/d*100):0}
function scoutV660Confidence(matches,rallies,actions){const score=Math.min(100,Math.round(Math.min(45,matches.length*15)+Math.min(30,rallies/4)+Math.min(25,actions/20)));return {score,label:score>=75?'Alta':score>=45?'Media':'Baja',cls:score>=75?'high':score>=45?'medium':'low'}}
function scoutV660GroupRows(rows,keyFn){const map=new Map;rows.forEach(r=>{const k=keyFn(r)||'Sin dato';if(!map.has(k))map.set(k,[]);map.get(k).push(r)});return [...map.entries()].sort((a,b)=>b[1].length-a[1].length)}
function scoutV660ReceptionProfiles(matches){const rec=scoutV650AllActions(matches).filter(a=>a.skill==='R');return scoutV660GroupRows(rec,a=>scoutPlayerKey(a)).map(([key,rows])=>{const label=scoutActionPlayerLabel(rows[0]),perfect=rows.filter(a=>a.evaluation==='#').length,pos=rows.filter(a=>['#','+'].includes(a.evaluation)).length,err=rows.filter(a=>a.evaluation==='=').length,neg=rows.filter(a=>['-','/','='].includes(a.evaluation)).length;return {key,label,total:rows.length,perfectPct:scoutV660Pct(perfect,rows.length),positivePct:scoutV660Pct(pos,rows.length),errorPct:scoutV660Pct(err,rows.length),negativePct:scoutV660Pct(neg,rows.length),rows,vulnerability:(100-scoutV660Pct(pos,rows.length))+(scoutV660Pct(err,rows.length)*.8)}}).sort((a,b)=>b.vulnerability-a.vulnerability||b.total-a.total)}
function scoutV660ReceptionZones(matches){const rows=scoutV650AllActions(matches).filter(a=>a.skill==='R'&&a.startZone);return scoutV660GroupRows(rows,a=>'Z'+a.startZone).map(([zone,zrows])=>({zone,total:zrows.length,negative:zrows.filter(a=>['-','/','='].includes(a.evaluation)).length,negativePct:scoutV660Pct(zrows.filter(a=>['-','/','='].includes(a.evaluation)).length,zrows.length),perfectPct:scoutV660Pct(zrows.filter(a=>a.evaluation==='#').length,zrows.length)})).sort((a,b)=>b.negativePct-a.negativePct||b.total-a.total)}
function scoutV660AttackProfiles(matches){const at=scoutV650AllActions(matches).filter(a=>a.skill==='A');return scoutV660GroupRows(at,a=>scoutPlayerKey(a)).map(([key,rows])=>{const label=scoutActionPlayerLabel(rows[0]),kills=rows.filter(a=>a.evaluation==='#').length,errors=rows.filter(a=>a.evaluation==='=').length,blocked=rows.filter(a=>a.evaluation==='/').length,eff=scoutV640Eff(rows),dirs=scoutV660GroupRows(rows,a=>a.startZone&&a.endZone?`Z${a.startZone} → Z${a.endZone}`:(a.endZone?`→ Z${a.endZone}`:'Sin dirección')),topDir=dirs[0];return {key,label,total:rows.length,kills,killPct:scoutV660Pct(kills,rows.length),errors,blocked,eff,topDirection:topDir?.[0]||'',topDirectionPct:topDir?scoutV660Pct(topDir[1].length,rows.length):0,rows}}).sort((a,b)=>(b.total*b.killPct)-(a.total*a.killPct))}
function scoutV660DefenseZones(matches){const at=scoutV650AllActions(matches).filter(a=>a.skill==='A'&&a.endZone);return scoutV660GroupRows(at,a=>'Z'+a.endZone).map(([zone,rows])=>({zone,total:rows.length,pct:scoutV660Pct(rows.length,at.length),kills:rows.filter(a=>a.evaluation==='#').length,killPct:scoutV660Pct(rows.filter(a=>a.evaluation==='#').length,rows.length)})).sort((a,b)=>b.total-a.total)}
function scoutV660SetterProfiles(matches){const dist=scoutV650Distribution(matches);const setters=scoutV660GroupRows(dist,x=>x.setterKey).map(([key,rows])=>({key,label:rows[0]?.setterLabel||key,total:rows.length,rows})).sort((a,b)=>b.total-a.total);const primary=setters[0]||null;const byRotation=[1,2,3,4,5,6].map(no=>{const rows=dist.filter(x=>Number(x.rotation)===no),pos=rows.filter(x=>['#','+'].includes(x.receptionEval)),base=pos.length?pos:rows,groups=scoutV660GroupRows(base,x=>scoutV640LabelTarget(x.target)),top=groups[0];return {no,total:rows.length,qualitySample:pos.length,target:top?.[0]||'',targetPct:top?scoutV660Pct(top[1].length,base.length):0,sample:base.length}});return {primary,setters,byRotation,dist}}
function scoutV660CriticalRotations(matches){return scoutV650RotationData(matches).map(r=>({...r,k1Pct:scoutV660Pct(r.k1Won,r.k1Total),k2Pct:scoutV660Pct(r.k2Won,r.k2Total)})).sort((a,b)=>Math.max(b.k1Pct,b.k2Pct)-Math.max(a.k1Pct,a.k2Pct))}
function scoutV660AutoPlan(group,matches){const actions=scoutV650AllActions(matches),rallies=scoutV650RallyCount(matches),confidence=scoutV660Confidence(matches,rallies,actions.length),receivers=scoutV660ReceptionProfiles(matches),zones=scoutV660ReceptionZones(matches),attackers=scoutV660AttackProfiles(matches),defZones=scoutV660DefenseZones(matches),setter=scoutV660SetterProfiles(matches),rotations=scoutV660CriticalRotations(matches),serve=[],block=[],defense=[],rotationNotes=[],keyPlayers=[];const weak=receivers.filter(x=>x.total>=6).slice(0,3);weak.forEach((x,i)=>serve.push({priority:i===0?'high':'normal',title:`Saque sobre ${x.label}`,detail:`Recepción positiva ${x.positivePct}% · perfecta ${x.perfectPct}% · error ${x.errorPct}%`,evidence:`${x.total} recepciones`}));const z=zones.find(x=>x.total>=6);if(z)serve.push({priority:'normal',title:`Presionar ${z.zone}`,detail:`${z.negativePct}% de recepciones negativas o error · perfecta ${z.perfectPct}%`,evidence:`${z.total} recepciones`});if(!serve.length)serve.push({priority:'normal',title:'Muestra de recepción insuficiente',detail:'Registra más recepciones rivales con jugador y zona para generar objetivos de saque.',evidence:`${receivers.reduce((n,x)=>n+x.total,0)} recepciones`});setter.byRotation.filter(r=>r.sample>=5&&r.target).sort((a,b)=>b.targetPct-a.targetPct).slice(0,4).forEach(r=>block.push({priority:r.targetPct>=40?'high':'normal',title:`R${r.no}: prioridad ${r.target}`,detail:`El rival distribuye ${r.target} en el ${r.targetPct}% de la muestra ${r.qualitySample?'con recepción positiva/perfecta':'disponible'}.`,evidence:`${r.sample} distribuciones`}));attackers.filter(a=>a.total>=8).slice(0,4).forEach(a=>block.push({priority:a.killPct>=50?'high':'normal',title:`${a.label} · ${a.topDirection||'dirección sin codificar'}`,detail:`Kill ${a.killPct}% · EFF ${a.eff}%${a.topDirection?` · ${a.topDirectionPct}% hacia ${a.topDirection}`:''}.`,evidence:`${a.total} ataques`}));defZones.filter(x=>x.total>=6).slice(0,3).forEach(x=>defense.push({priority:x.killPct>=50?'high':'normal',title:`Reforzar defensa en ${x.zone}`,detail:`Recibe el ${x.pct}% de los ataques codificados; ${x.killPct}% terminan en punto rival.`,evidence:`${x.total} ataques`}));attackers.filter(a=>a.total>=8&&a.topDirection).slice(0,3).forEach(a=>defense.push({priority:'normal',title:`Lectura ${a.label}`,detail:`Dirección más frecuente: ${a.topDirection} (${a.topDirectionPct}%).`,evidence:`${a.total} ataques`}));rotations.slice(0,4).forEach(r=>rotationNotes.push({priority:(r.k1Pct>=60||r.k2Pct>=45)?'high':'normal',title:`R${r.no} rival`,detail:`Side-out ${r.k1Total?r.k1Pct+'%':'—'} · Break ${r.k2Total?r.k2Pct+'%':'—'}${r.target?` · destino más usado ${r.target} (${r.targetPct}%)`:''}.`,evidence:`${r.k1Total+r.k2Total} secuencias`}));attackers.filter(a=>a.total>=6).slice(0,4).forEach(a=>keyPlayers.push({type:'Atacante',label:a.label,total:a.total,metric:`${a.killPct}% kill`,detail:a.topDirection?`${a.topDirection} · ${a.topDirectionPct}%`:`EFF ${a.eff}%`}));if(setter.primary)keyPlayers.unshift({type:'Colocador',label:setter.primary.label,total:setter.primary.total,metric:'Distribución',detail:`${setter.primary.total} colocaciones`});if(weak[0])keyPlayers.push({type:'Recepción',label:weak[0].label,total:weak[0].total,metric:`${weak[0].positivePct}% positiva`,detail:`${weak[0].errorPct}% error`});return {opponentKey:group.key,opponentName:group.name,matches:matches.length,rallies,actions:actions.length,confidence,serve,block,defense,rotations:rotationNotes,rotationData:scoutV650RotationData(matches),keyPlayers,sourceMatchIds:matches.map(m=>Number(m.id)),generatedAt:scoutNow()}}
function scoutV660CurrentPlan(create=false){const g=scoutV660SelectedGroup();if(!g)return null;let p=scoutV660PlanForKey(g.key);if(!p&&create){p=scoutV660NormalizePlan({id:Date.now(),opponentKey:g.key,opponentName:g.name,period:$('scout-v660-period')?.value||'all'});scoutingGamePlans.push(p)}return p}
function scoutV660PopulateRivals(force=false){const el=$('scout-v660-rival');if(!el)return;const groups=scoutV660Groups(),prev=force?'':el.value;el.innerHTML=groups.length?groups.map(g=>`<option value="${esc(g.key)}">${esc(g.name)} · ${g.matches.length} part.</option>`).join(''):'<option value="">Sin rivales</option>';if(prev&&groups.some(g=>g.key===prev))el.value=prev;else{const pending=scoutArr(partidosEquipo).filter(m=>m.status==='Programado').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))[0],key=pending?scoutV650OpponentKey(pending.opponent):'';if(key&&groups.some(g=>g.key===key))el.value=key}}
function scoutV660PopulateLinkedMatches(){const el=$('scout-v660-linked-match'),g=scoutV660SelectedGroup();if(!el)return;const key=g?.key||'',matches=scoutArr(partidosEquipo).filter(m=>scoutV650OpponentKey(m.opponent)===key).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))),p=scoutV660CurrentPlan(false),prev=Number(p?.linkedMatchId)||Number(el.value)||0;el.innerHTML='<option value="">Sin asociar</option>'+matches.map(m=>`<option value="${m.id}">${esc(m.date||'—')} · ${esc(m.opponent)}${m.competition?' · '+esc(m.competition):''}</option>`).join('');if(prev&&matches.some(m=>Number(m.id)===prev))el.value=String(prev)}
function scoutV660RecHTML(items){return items?.length?`<div class="scout-v660-rec-list">${items.map(x=>`<div class="scout-v660-rec ${x.priority==='high'?'high':''}"><span class="dot"></span><div><strong>${esc(x.title)}</strong><span>${esc(x.detail)}</span></div><span class="scout-v660-evidence">${esc(x.evidence||'')}</span></div>`).join('')}</div>`:'<div class="scout-v660-empty">Sin datos suficientes.</div>'}
function scoutV660DefaultStaff(auto){return {serve:auto.serve.filter(x=>!x.title.includes('insuficiente')).map(x=>'• '+x.title+': '+x.detail).join('\n'),block:auto.block.map(x=>'• '+x.title+': '+x.detail).join('\n'),defense:auto.defense.map(x=>'• '+x.title+': '+x.detail).join('\n'),rotations:auto.rotations.map(x=>'• '+x.title+': '+x.detail).join('\n'),notes:''}}
window.scoutV660Generate=function(){const g=scoutV660SelectedGroup(),matches=scoutV660Matches();if(!g||!matches.length){alert('No hay histórico suficiente para generar un plan.');return}let p=scoutV660CurrentPlan(true),oldStaff=p.staff||{},auto=scoutV660AutoPlan(g,matches);p.opponentName=g.name;p.period=$('scout-v660-period')?.value||'all';p.sourceMatchIds=auto.sourceMatchIds;p.auto=auto;p.generatedAt=auto.generatedAt;p.updatedAt=scoutNow();const defaults=scoutV660DefaultStaff(auto);p.staff={serve:oldStaff.serve||defaults.serve,block:oldStaff.block||defaults.block,defense:oldStaff.defense||defaults.defense,rotations:oldStaff.rotations||defaults.rotations,notes:oldStaff.notes||''};const link=Number($('scout-v660-linked-match')?.value)||null;if(link)p.linkedMatchId=link;scoutV660Persist();scoutV660Render()}
function scoutV660ReadStaff(p){if(!p)return;p.staff={serve:String($('scout-v660-staff-serve')?.value||''),block:String($('scout-v660-staff-block')?.value||''),defense:String($('scout-v660-staff-defense')?.value||''),rotations:String($('scout-v660-staff-rotations')?.value||''),notes:String($('scout-v660-staff-notes')?.value||'')};p.linkedMatchId=Number($('scout-v660-linked-match')?.value)||null;p.updatedAt=scoutNow()}
window.scoutV660Save=function(){const p=scoutV660CurrentPlan(false);if(!p){scoutV660Generate();return}scoutV660ReadStaff(p);scoutV660Persist();scoutV660Render();const b=$('scout-v660-ready-btn');if(b)b.textContent=p.status==='ready'?'Plan listo':'Marcar listo'}
window.scoutV660ToggleReady=function(){let p=scoutV660CurrentPlan(false);if(!p){scoutV660Generate();p=scoutV660CurrentPlan(false);if(!p)return}scoutV660ReadStaff(p);p.status=p.status==='ready'?'draft':'ready';p.updatedAt=scoutNow();scoutV660Persist();scoutV660Render()}
window.scoutV660RivalChanged=function(){scoutV660PopulateLinkedMatches();const p=scoutV660CurrentPlan(false);if(p&&$('scout-v660-period'))$('scout-v660-period').value=p.period||'all';scoutV660Render()}
window.scoutV660PeriodChanged=function(){scoutV660Render()}
window.scoutV660LinkedMatchChanged=function(){const p=scoutV660CurrentPlan(false);if(p){p.linkedMatchId=Number($('scout-v660-linked-match')?.value)||null;scoutV660Persist()}}
function scoutV660RotationHTML(auto){const data=auto?.rotationData||[];return `<div class="scout-v660-rotation-grid">${data.map(r=>`<div class="scout-v660-rotation"><strong>R${r.no}</strong><p><span>Side-out</span><b>${r.k1Total?scoutV660Pct(r.k1Won,r.k1Total)+'%':'—'}</b></p><p><span>Break</span><b>${r.k2Total?scoutV660Pct(r.k2Won,r.k2Total)+'%':'—'}</b></p><p><span>Prioridad</span><b>${esc(r.target||'—')} ${r.target?`· ${r.targetPct}%`:''}</b></p><p><span>Muestra</span><b>${r.k1Total+r.k2Total}</b></p></div>`).join('')}</div>`}
function scoutV660PlayersHTML(auto){const rows=auto?.keyPlayers||[];return rows.length?`<div style="overflow:auto"><table class="scout-v660-player-table"><thead><tr><th>Perfil</th><th>Jugador</th><th class="num">Muestra</th><th>Métrica</th><th>Patrón</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.type)}</td><td><strong>${esc(x.label)}</strong></td><td class="num">${x.total}</td><td>${esc(x.metric)}</td><td>${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="scout-v660-empty">Sin jugadores con muestra suficiente.</div>'}
window.scoutV660Render=function(){const body=$('scout-v660-body'),kpis=$('scout-v660-kpis');if(!body||!kpis)return;scoutV660PopulateRivals(false);scoutV660PopulateLinkedMatches();const g=scoutV660SelectedGroup();if(!g){kpis.innerHTML='';body.innerHTML='<div class="scout-v660-empty">Necesitas al menos un scouting con acciones para crear un plan de partido.</div>';return}const p=scoutV660CurrentPlan(false),matches=scoutV660Matches(),auto=p?.auto&&p.auto.opponentKey===g.key?p.auto:null,conf=auto?.confidence||scoutV660Confidence(matches,scoutV650RallyCount(matches),scoutV650AllActions(matches).length),ready=p?.status==='ready';kpis.innerHTML=`<div class="scout-v660-kpi"><span>Partidos fuente</span><b>${auto?.matches??matches.length}</b><small>${g.matches.length} disponibles</small></div><div class="scout-v660-kpi"><span>Rallies</span><b>${auto?.rallies??scoutV650RallyCount(matches)}</b><small>muestra táctica</small></div><div class="scout-v660-kpi"><span>Acciones rival</span><b>${auto?.actions??scoutV650AllActions(matches).length}</b><small>codificadas</small></div><div class="scout-v660-kpi"><span>Confianza</span><b>${conf.score}%</b><small><span class="scout-v660-confidence ${conf.cls}">${conf.label}</span></small></div><div class="scout-v660-kpi"><span>Estado</span><b>${ready?'LISTO':'BORRADOR'}</b><small>${p?.updatedAt?new Date(p.updatedAt).toLocaleString('es-ES'):'Sin guardar'}</small></div>`;const btn=$('scout-v660-ready-btn');if(btn)btn.textContent=ready?'Volver a borrador':'Marcar listo';if(!auto){body.innerHTML=`<div class="scout-v660-empty"><strong>No hay un plan generado para ${esc(g.name)}.</strong><br>Selecciona la muestra histórica y pulsa “Generar / actualizar plan”.</div>`;return}const staff=p.staff||scoutV660DefaultStaff(auto),low=auto.confidence.score<45?'<div class="scout-v660-banner warn">La muestra todavía es reducida. Utiliza las recomendaciones como hipótesis de trabajo, no como patrón consolidado.</div>':'<div class="scout-v660-banner">El plan se ha generado a partir de acciones reales del histórico seleccionado. Las decisiones del staff siguen siendo editables.</div>';body.innerHTML=`${low}<div class="scout-v660-grid" style="margin-top:11px"><section class="scout-v660-card scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">SAQUE</span><h3>Objetivos de saque</h3><small>Recepción rival: jugador y zona vulnerables</small></div></div>${scoutV660RecHTML(auto.serve)}</section><section class="scout-v660-card scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">BLOQUEO</span><h3>Prioridades de bloqueo</h3><small>Distribución del colocador y atacantes principales</small></div></div>${scoutV660RecHTML(auto.block)}</section><section class="scout-v660-card scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">DEFENSA</span><h3>Organización defensiva</h3><small>Zonas y direcciones que más utiliza el rival</small></div></div>${scoutV660RecHTML(auto.defense)}</section><section class="scout-v660-card scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">ROTACIONES</span><h3>Rotaciones críticas</h3><small>Side-out, break y prioridad de distribución</small></div></div>${scoutV660RecHTML(auto.rotations)}</section><section class="scout-v660-card wide scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">R1–R6</span><h3>Mapa de rotaciones del rival</h3><small>Lectura compacta para preparar el match-up</small></div></div>${scoutV660RotationHTML(auto)}</section><section class="scout-v660-card wide scout-v660-print-section"><div class="scout-v660-card-head"><div><span class="pro-kicker">KEY PLAYERS</span><h3>Jugadores clave</h3><small>Perfiles detectados automáticamente en el histórico</small></div></div>${scoutV660PlayersHTML(auto)}</section><section class="scout-v660-card wide"><div class="scout-v660-card-head"><div><span class="pro-kicker">STAFF DECISIONS</span><h3>Plan definitivo del entrenador</h3><small>Edita la propuesta automática. Esto es lo que quedará guardado y saldrá en el informe.</small></div><div class="scout-v660-status"><span class="scout-v660-confidence ${ready?'high':'medium'}">${ready?'PLAN LISTO':'BORRADOR'}</span></div></div><div class="scout-v660-staff"><label><span>Plan de saque</span><textarea id="scout-v660-staff-serve">${esc(staff.serve)}</textarea></label><label><span>Plan de bloqueo</span><textarea id="scout-v660-staff-block">${esc(staff.block)}</textarea></label><label><span>Plan defensivo</span><textarea id="scout-v660-staff-defense">${esc(staff.defense)}</textarea></label><label><span>Rotaciones / match-up</span><textarea id="scout-v660-staff-rotations">${esc(staff.rotations)}</textarea></label><label class="wide"><span>Notas generales</span><textarea id="scout-v660-staff-notes" placeholder="Consignas de partido, cambios previstos, mensajes al equipo…">${esc(staff.notes)}</textarea></label></div><div class="scout-v660-plan-actions"><button class="ghost" onclick="scoutV660PushToPlanning()">Llevar prioridades a planificación</button><button class="ghost" onclick="scoutV660ExportPDF()">Exportar PDF</button><button class="primary" onclick="scoutV660Save()">Guardar plan</button></div></section><section class="scout-v660-card wide"><div class="scout-v660-card-head"><div><span class="pro-kicker">FUENTE</span><h3>Partidos utilizados</h3></div></div><div class="scout-v660-source">${auto.sourceMatchIds.map(id=>{const m=scoutingMatches.find(x=>Number(x.id)===Number(id));return `<span>${esc(m?.date||'—')} · ${esc(m?.opponent||g.name)}</span>`}).join('')}</div></section></div>`}
window.scoutV660PushToPlanning=function(){let p=scoutV660CurrentPlan(false);if(!p?.auto){alert('Genera primero el plan de partido.');return}scoutV660ReadStaff(p);const linked=scoutArr(partidosEquipo).find(m=>Number(m.id)===Number(p.linkedMatchId)),date=linked?.date||fechaLocalISO();if(typeof seasonWeekMonday!=='function'||typeof seasonWeekRecord!=='function'||typeof seasonSave!=='function'){alert('No se ha podido conectar con la planificación de temporada.');return}const ws=seasonWeekMonday(date),old=seasonWeekRecord(ws),rec=old?clonar(old):{weekStart:ws,objective:'',fundamentals:[],targetSessions:0,targetMinutes:0,intensity:'Media',match:'',notes:''};rec.objective=`Preparar partido vs ${p.opponentName}`;rec.fundamentals=[...new Set([...(rec.fundamentals||[]),'Saque','Bloqueo','Defensa'])];rec.match=linked?`${linked.opponent}${linked.competition?' · '+linked.competition:''}`:p.opponentName;const marker=`PLAN DE PARTIDO vs ${p.opponentName}`;const note=[marker,p.staff.serve&&`SAQUE\n${p.staff.serve}`,p.staff.block&&`BLOQUEO\n${p.staff.block}`,p.staff.defense&&`DEFENSA\n${p.staff.defense}`,p.staff.rotations&&`ROTACIONES\n${p.staff.rotations}`].filter(Boolean).join('\n\n');const current=String(rec.notes||'');rec.notes=current.includes(marker)?current:([current.trim(),note].filter(Boolean).join('\n\n'));const i=seasonPlan.findIndex(x=>x.weekStart===ws);if(i>=0)seasonPlan[i]=rec;else seasonPlan.push(rec);seasonSave();scoutV660Persist();showView('planificacion',botonVista('planificacion'));if(typeof setVistaPlanificacion==='function')setVistaPlanificacion('temporada')}
window.scoutV660ExportPDF=async function(){const p=scoutV660CurrentPlan(false);if(!p?.auto){alert('Genera primero un plan de partido.');return}scoutV660ReadStaff(p);scoutV660Persist();if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}scoutExportNotice(true,'Preparando plan de partido…');try{const source=$('scout-v660-body'),clone=source.cloneNode(true);clone.querySelectorAll('button').forEach(x=>x.remove());clone.querySelectorAll('textarea').forEach(t=>{const d=document.createElement('div');d.style.cssText='white-space:pre-wrap;border:1px solid #dfe5e9;padding:10px;min-height:60px;font-size:11px;line-height:1.45;background:#fbfcfd';d.textContent=t.value;t.replaceWith(d)});const report=document.createElement('div');report.style.cssText='position:fixed;left:-20000px;top:0;width:1180px;background:#fff;color:#17324d;padding:42px;font-family:Arial,Helvetica,sans-serif;z-index:-1';report.innerHTML=`<div style="border-bottom:4px solid #102b43;padding-bottom:18px;margin-bottom:18px"><div style="font-size:11px;font-weight:900;letter-spacing:.16em;color:#718394">VOLLEY COACH · MATCH PLAN</div><h1 style="font-size:30px;margin:7px 0;color:#102b43">${esc(p.opponentName)}</h1><div style="font-size:13px;color:#6f7f8c">${p.auto.matches} partidos · ${p.auto.rallies} rallies · confianza ${p.auto.confidence.label} (${p.auto.confidence.score}%) · ${p.status==='ready'?'PLAN LISTO':'BORRADOR'}</div></div>`;report.appendChild(clone);const foot=document.createElement('div');foot.style.cssText='margin-top:24px;border-top:1px solid #dfe6eb;padding-top:10px;color:#84919b;font-size:9px';foot.textContent='Generado por Volley Coach · V6.6.0 · Las recomendaciones automáticas dependen de la calidad y cantidad del scouting registrado.';report.appendChild(foot);document.body.appendChild(report);const canvas=await html2canvas(report,{scale:1.35,backgroundColor:'#ffffff',logging:false,useCORS:true});report.remove();const {jsPDF}=window.jspdf,pdf=new jsPDF('p','mm','a4'),margin=8,pageW=210-margin*2,pageH=297-margin*2,imgW=pageW,imgH=canvas.height*imgW/canvas.width,img=canvas.toDataURL('image/jpeg',.92);let y=margin,remaining=imgH;pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH;while(remaining>0){pdf.addPage();y=margin-(imgH-remaining);pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH}pdf.save(`${scoutSafeFilename(p.opponentName)}_plan_partido_v660.pdf`)}catch(err){console.error(err);alert('No se ha podido generar el PDF del plan.')}finally{scoutExportNotice(false)}}



/* ===== V6.10.5 · BUTTON AUDIT FIX ===== */
let scoutV670SelectedPair=null;
function scoutV670Groups(){return scoutV650Groups()}
function scoutV670SelectedGroup(){const key=$('scout-v670-rival')?.value||'';const groups=scoutV670Groups();return groups.find(g=>g.key===key)||groups[0]||null}
function scoutV670Matches(){const g=scoutV670SelectedGroup();if(!g)return[];const n=$('scout-v670-period')?.value||'all';return n==='all'?g.matches:g.matches.slice(0,Math.max(1,Number(n)||3))}
function scoutV670PopulateRivals(force=false){const sel=$('scout-v670-rival');if(!sel)return;const groups=scoutV670Groups(),prev=force?'':sel.value;sel.innerHTML=groups.length?groups.map(g=>`<option value="${esc(g.key)}">${esc(g.name)} · ${g.matches.length} partido${g.matches.length===1?'':'s'}</option>`).join(''):'<option value="">Sin rivales con datos</option>';if(prev&&groups.some(g=>g.key===prev))sel.value=prev}
function scoutV670Rallies(){const setNo=Number($('scout-v670-set')?.value)||0;return scoutV670Matches().flatMap(m=>scoutArr(m.sets).flatMap(set=>{if(setNo&&Number(set.number)!==setNo)return[];return scoutArr(set.rallies).map((r,idx)=>({match:m,set:Number(set.number)||1,rallyIndex:idx+1,...r}))}))}
function scoutV670Pct(n,d){return d?Math.round(n/d*100):0}
function scoutV670Eff(actions){return scoutV640Eff(actions)}
function scoutV670Pair(own,opp,rows=null){const rallies=(rows||scoutV670Rallies()).filter(r=>(Number(r.rotationBefore)||1)===own&&(Number(r.opponentRotationBefore)||1)===opp),won=rallies.filter(r=>r.winner==='ours').length,side=rallies.filter(r=>r.servingBefore==='opponent'),brk=rallies.filter(r=>r.servingBefore==='ours'),sideWon=side.filter(r=>r.winner==='ours').length,breakWon=brk.filter(r=>r.winner==='ours').length,ourAtt=rallies.flatMap(r=>scoutArr(r.actions).filter(a=>a.team==='ours'&&a.skill==='A')),oppAtt=rallies.flatMap(r=>scoutArr(r.actions).filter(a=>a.team==='opponent'&&a.skill==='A')),ourKills=ourAtt.filter(a=>a.evaluation==='#').length,oppKills=oppAtt.filter(a=>a.evaluation==='#').length;return {own,opp,rallies,total:rallies.length,won,lost:rallies.length-won,pointPct:scoutV670Pct(won,rallies.length),sideTotal:side.length,sideWon,sidePct:scoutV670Pct(sideWon,side.length),breakTotal:brk.length,breakWon,breakPct:scoutV670Pct(breakWon,brk.length),ourAttacks:ourAtt.length,ourKillPct:scoutV670Pct(ourKills,ourAtt.length),ourEff:ourAtt.length?scoutV670Eff(ourAtt):0,oppAttacks:oppAtt.length,oppKillPct:scoutV670Pct(oppKills,oppAtt.length),oppEff:oppAtt.length?scoutV670Eff(oppAtt):0}}
function scoutV670Matrix(){const rows=scoutV670Rallies(),out=[];for(let o=1;o<=6;o++)for(let r=1;r<=6;r++)out.push(scoutV670Pair(o,r,rows));return out}
function scoutV670MetricValue(p){const metric=$('scout-v670-metric')?.value||'point';if(metric==='sideout')return p.sideTotal?p.sidePct:null;if(metric==='break')return p.breakTotal?p.breakPct:null;return p.total?p.pointPct:null}
function scoutV670MetricSample(p){const metric=$('scout-v670-metric')?.value||'point';return metric==='sideout'?p.sideTotal:metric==='break'?p.breakTotal:p.total}
function scoutV670CellClass(p){const min=Number($('scout-v670-min')?.value)||5,sample=scoutV670MetricSample(p),v=scoutV670MetricValue(p);if(!sample)return'empty';if(sample<min)return'low';if(v>=55)return'good';if(v<=45)return'bad';return'neutral'}
function scoutV670TopAttackPattern(pair,team){const acts=pair.rallies.flatMap(r=>scoutArr(r.actions).filter(a=>a.team===team&&a.skill==='A'));if(!acts.length)return null;const groups=new Map;acts.forEach(a=>{const key=team==='ours'?(scoutV640LabelTarget(a.attackCombo||'')||((a.startZone&&a.endZone)?`Z${a.startZone}→Z${a.endZone}`:'Sin patrón')):((a.startZone&&a.endZone)?`Z${a.startZone}→Z${a.endZone}`:(scoutV640LabelTarget(a.attackCombo||'')||'Sin patrón'));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a)});const [label,rows]=[...groups.entries()].sort((a,b)=>b[1].length-a[1].length)[0];return {label,total:rows.length,pct:scoutV670Pct(rows.length,acts.length),killPct:scoutV670Pct(rows.filter(a=>a.evaluation==='#').length,rows.length),eff:scoutV670Eff(rows)}}
function scoutV670ConfidenceCell(p){const min=Number($('scout-v670-min')?.value)||5;return p.total>=min?'Muestra suficiente':p.total?`Muestra reducida (${p.total}/${min})`:'Sin muestra'}
function scoutV670BestWorst(matrix){const min=Number($('scout-v670-min')?.value)||5,candidates=matrix.filter(p=>scoutV670MetricSample(p)>=min&&scoutV670MetricValue(p)!=null).sort((a,b)=>scoutV670MetricValue(b)-scoutV670MetricValue(a)||scoutV670MetricSample(b)-scoutV670MetricSample(a));return {best:candidates[0]||null,worst:candidates.length>1?candidates[candidates.length-1]:null,candidates}}
function scoutV670OwnSummary(matrix){return [1,2,3,4,5,6].map(no=>{const cells=matrix.filter(p=>p.own===no&&p.total),rallies=cells.flatMap(p=>p.rallies),won=rallies.filter(r=>r.winner==='ours').length,side=rallies.filter(r=>r.servingBefore==='opponent'),brk=rallies.filter(r=>r.servingBefore==='ours'),best=cells.filter(p=>p.total>=3).sort((a,b)=>b.pointPct-a.pointPct)[0]||null,worst=cells.filter(p=>p.total>=3).sort((a,b)=>a.pointPct-b.pointPct)[0]||null;return {no,total:rallies.length,pointPct:scoutV670Pct(won,rallies.length),sideTotal:side.length,sidePct:scoutV670Pct(side.filter(r=>r.winner==='ours').length,side.length),breakTotal:brk.length,breakPct:scoutV670Pct(brk.filter(r=>r.winner==='ours').length,brk.length),best,worst}})}
function scoutV670PairLabel(p){return `R${p.own} vs R${p.opp}`}
function scoutV670FormatMetric(p){const metric=$('scout-v670-metric')?.value||'point',v=scoutV670MetricValue(p);return v==null?'—':v+'%'}
function scoutV670MatrixHTML(matrix){let html='<div class="scout-v670-matrix"><div class="scout-v670-corner">NUESTRA ↓<br>RIVAL →</div>';for(let r=1;r<=6;r++)html+=`<div class="scout-v670-col-head">RIVAL R${r}</div>`;for(let o=1;o<=6;o++){html+=`<div class="scout-v670-row-head">NUESTRA R${o}</div>`;for(let r=1;r<=6;r++){const p=matrix.find(x=>x.own===o&&x.opp===r),cls=scoutV670CellClass(p),sample=scoutV670MetricSample(p),metric=scoutV670FormatMetric(p),tag=cls==='good'?'FAVORABLE':cls==='bad'?'CRÍTICO':cls==='low'?'MUESTRA BAJA':cls==='empty'?'SIN DATOS':'EQUILIBRADO';html+=`<button class="scout-v670-cell ${cls}" ${p.total?`onclick="scoutV670SelectPair(${o},${r},true)"`:'disabled'}><div class="scout-v670-main"><b>${metric}</b><span>n=${sample}</span></div><div class="scout-v670-mini"><span>SO <strong>${p.sideTotal?p.sidePct+'%':'—'}</strong></span><span>BP <strong>${p.breakTotal?p.breakPct+'%':'—'}</strong></span><span>ATT <strong>${p.ourAttacks?p.ourEff+'% EFF':'—'}</strong></span><span>Pts <strong>${p.won}–${p.lost}</strong></span></div><div class="scout-v670-cell-tag">${tag}</div></button>`}}return html+'</div>'}
function scoutV670InsightsHTML(matrix){const {best,worst}=scoutV670BestWorst(matrix),own=scoutV670OwnSummary(matrix),bestOwn=own.filter(x=>x.total>=5).sort((a,b)=>b.pointPct-a.pointPct)[0],worstOwn=own.filter(x=>x.total>=5).sort((a,b)=>a.pointPct-b.pointPct)[0],items=[];if(best)items.push({cls:'good',title:`Mejor cruce · ${scoutV670PairLabel(best)}`,copy:`${scoutV670FormatMetric(best)} en la métrica seleccionada · ${best.total} rallies · SO ${best.sideTotal?best.sidePct+'%':'—'} · BP ${best.breakTotal?best.breakPct+'%':'—'}.`});if(worst)items.push({cls:'bad',title:`Cruce crítico · ${scoutV670PairLabel(worst)}`,copy:`${scoutV670FormatMetric(worst)} · ${worst.total} rallies. Revisar esta coincidencia antes de interpretar el dato como patrón estable.`});if(bestOwn)items.push({cls:'good',title:`Rotación más sólida · R${bestOwn.no}`,copy:`${bestOwn.pointPct}% de puntos ganados en ${bestOwn.total} rallies observados.`});if(worstOwn)items.push({cls:'bad',title:`Rotación a vigilar · R${worstOwn.no}`,copy:`${worstOwn.pointPct}% de puntos ganados en ${worstOwn.total} rallies observados.`});return items.length?items.map(x=>`<div class="scout-v670-insight ${x.cls}"><strong>${esc(x.title)}</strong><span>${esc(x.copy)}</span></div>`).join(''):'<div class="scout-v670-empty">Todavía no hay cruces con la muestra mínima seleccionada.</div>'}
function scoutV670SelectedHTML(pair){if(!pair||!pair.total)return'<div class="scout-v670-empty">Pulsa una celda de la matriz para estudiar ese enfrentamiento.</div>';const ours=scoutV670TopAttackPattern(pair,'ours'),opp=scoutV670TopAttackPattern(pair,'opponent'),cls=scoutV670CellClass(pair);return `<div class="scout-v670-selected-head"><div><span class="pro-kicker">CRUCE SELECCIONADO</span><h3>${scoutV670PairLabel(pair)}</h3></div><span class="scout-v670-selected-badge">${esc(scoutV670ConfidenceCell(pair))}</span></div><div class="scout-v670-selected-kpis"><div class="scout-v670-selected-kpi"><span>Puntos</span><b>${pair.pointPct}%</b></div><div class="scout-v670-selected-kpi"><span>Side-out</span><b>${pair.sideTotal?pair.sidePct+'%':'—'}</b></div><div class="scout-v670-selected-kpi"><span>Break</span><b>${pair.breakTotal?pair.breakPct+'%':'—'}</b></div><div class="scout-v670-selected-kpi"><span>Nuestro ataque</span><b>${pair.ourAttacks?pair.ourEff+'% EFF':'—'}</b></div><div class="scout-v670-selected-kpi"><span>Ataque rival</span><b>${pair.oppAttacks?pair.oppEff+'% EFF':'—'}</b></div><div class="scout-v670-selected-kpi"><span>Muestra</span><b>${pair.total}</b></div></div>${ours?`<div class="scout-v670-pattern"><b>Nuestro patrón:</b> ${esc(ours.label)} · ${ours.pct}% de uso · ${ours.killPct}% kill · ${ours.eff}% EFF.</div>`:''}${opp?`<div class="scout-v670-pattern"><b>Patrón rival:</b> ${esc(opp.label)} · ${opp.pct}% de uso · ${opp.killPct}% kill · ${opp.eff}% EFF.</div>`:''}<div class="scout-v670-selected-actions"><button class="ghost" onclick="scoutV670OpenDrill(${pair.own},${pair.opp})">Ver rallies</button><button class="ghost" onclick="scoutV670PushToPlan(${pair.own},${pair.opp})">Añadir al plan</button></div>`}
function scoutV670OwnSummaryHTML(matrix){const rows=scoutV670OwnSummary(matrix);return `<div class="scout-v670-table-wrap"><table class="scout-v670-table"><thead><tr><th>Rotación</th><th class="num">Rallies</th><th class="num">Puntos</th><th class="num">Side-out</th><th class="num">Break</th><th>Mejor cruce</th><th>Más difícil</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>R${x.no}</strong></td><td class="num">${x.total}</td><td class="num">${x.total?x.pointPct+'%':'—'}</td><td class="num">${x.sideTotal?x.sidePct+'%':'—'}</td><td class="num">${x.breakTotal?x.breakPct+'%':'—'}</td><td>${x.best?`Rival R${x.best.opp} · ${x.best.pointPct}%`:'—'}</td><td>${x.worst?`Rival R${x.worst.opp} · ${x.worst.pointPct}%`:'—'}</td></tr>`).join('')}</tbody></table></div>`}
window.scoutV670Render=function(){const matrixBox=$('scout-v670-matrix'),kpis=$('scout-v670-kpis');if(!matrixBox||!kpis)return;scoutV670PopulateRivals(false);const group=scoutV670SelectedGroup(),matches=scoutV670Matches(),rallies=scoutV670Rallies();if(!group){kpis.innerHTML='';matrixBox.innerHTML='<div class="scout-v670-empty">Necesitas scoutings con rival y rallies para crear la matriz de match-up.</div>';if($('scout-v670-insights'))$('scout-v670-insights').innerHTML='';if($('scout-v670-selected'))$('scout-v670-selected').innerHTML='';if($('scout-v670-own-summary'))$('scout-v670-own-summary').innerHTML='';return}const matrix=scoutV670Matrix(),{best,worst,candidates}=scoutV670BestWorst(matrix),observed=matrix.filter(p=>p.total).length;kpis.innerHTML=`<div class="scout-v670-kpi"><span>Partidos</span><b>${matches.length}</b><small>${group.matches.length} disponibles</small></div><div class="scout-v670-kpi"><span>Rallies</span><b>${rallies.length}</b><small>muestra del filtro</small></div><div class="scout-v670-kpi"><span>Cruces observados</span><b>${observed}/36</b><small>${candidates.length} con muestra mínima</small></div><div class="scout-v670-kpi"><span>Mejor cruce</span><b>${best?scoutV670PairLabel(best):'—'}</b><small>${best?scoutV670FormatMetric(best)+' · n='+scoutV670MetricSample(best):'sin muestra suficiente'}</small></div><div class="scout-v670-kpi"><span>Cruce crítico</span><b>${worst?scoutV670PairLabel(worst):'—'}</b><small>${worst?scoutV670FormatMetric(worst)+' · n='+scoutV670MetricSample(worst):'sin muestra suficiente'}</small></div>`;matrixBox.innerHTML=`<div class="scout-v670-matrix-wrap">${scoutV670MatrixHTML(matrix)}</div>`;$('scout-v670-insights').innerHTML=scoutV670InsightsHTML(matrix);if(scoutV670SelectedPair){const p=matrix.find(x=>x.own===scoutV670SelectedPair.own&&x.opp===scoutV670SelectedPair.opp);$('scout-v670-selected').innerHTML=scoutV670SelectedHTML(p)}else $('scout-v670-selected').innerHTML='<div class="scout-v670-empty">Selecciona un cruce de la matriz para ver el detalle táctico.</div>';$('scout-v670-own-summary').innerHTML=scoutV670OwnSummaryHTML(matrix)}
window.scoutV670RivalChanged=function(){scoutV670SelectedPair=null;scoutV670Render()}
window.scoutV670Reset=function(){if($('scout-v670-period'))$('scout-v670-period').value='all';if($('scout-v670-set'))$('scout-v670-set').value='';if($('scout-v670-metric'))$('scout-v670-metric').value='point';if($('scout-v670-min'))$('scout-v670-min').value='5';scoutV670SelectedPair=null;scoutV670Render()}
window.scoutV670SelectPair=function(own,opp,open=false){scoutV670SelectedPair={own:Number(own),opp:Number(opp)};scoutV670Render();if(open)scoutV670OpenDrill(own,opp)}
function scoutV670RallyCodes(r,team){return scoutArr(r.actions).filter(a=>a.team===team).map(a=>a.code).join('  ')||'—'}
function scoutV670PatternTable(pair,team){const acts=pair.rallies.flatMap(r=>scoutArr(r.actions).filter(a=>a.team===team&&a.skill==='A'));if(!acts.length)return'<div class="scout-v670-empty">Sin ataques codificados.</div>';const map=new Map;acts.forEach(a=>{const key=team==='ours'?(scoutV640LabelTarget(a.attackCombo||'')||((a.startZone&&a.endZone)?`Z${a.startZone} → Z${a.endZone}`:'Sin patrón')):((a.startZone&&a.endZone)?`Z${a.startZone} → Z${a.endZone}`:(scoutV640LabelTarget(a.attackCombo||'')||'Sin patrón'));if(!map.has(key))map.set(key,[]);map.get(key).push(a)});const rows=[...map.entries()].sort((a,b)=>b[1].length-a[1].length).slice(0,8);return `<div class="scout-v670-table-wrap"><table class="scout-v670-table"><thead><tr><th>Patrón</th><th class="num">ATT</th><th class="num">Uso</th><th class="num">Kill</th><th class="num">EFF</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><td><strong>${esc(k)}</strong></td><td class="num">${v.length}</td><td class="num">${scoutV670Pct(v.length,acts.length)}%</td><td class="num">${scoutV670Pct(v.filter(a=>a.evaluation==='#').length,v.length)}%</td><td class="num">${scoutV670Eff(v)}%</td></tr>`).join('')}</tbody></table></div>`}
window.scoutV670OpenDrill=function(own,opp){const p=scoutV670Pair(Number(own),Number(opp));if(!p.total)return;$('scout-v670-drill-title').textContent=scoutV670PairLabel(p);$('scout-v670-drill-subtitle').textContent=`${scoutV670SelectedGroup()?.name||'Rival'} · ${p.total} rallies · ${scoutV670ConfidenceCell(p)}`;$('scout-v670-drill-kpis').innerHTML=`<div><span>Puntos ganados</span><b>${p.pointPct}%</b></div><div><span>Side-out</span><b>${p.sideTotal?p.sidePct+'%':'—'}</b></div><div><span>Break point</span><b>${p.breakTotal?p.breakPct+'%':'—'}</b></div><div><span>Nuestro ataque</span><b>${p.ourAttacks?p.ourEff+'%':'—'}</b></div><div><span>Ataque rival</span><b>${p.oppAttacks?p.oppEff+'%':'—'}</b></div><div><span>Muestra</span><b>${p.total}</b></div>`;const rallyRows=p.rallies.slice().sort((a,b)=>String(b.match?.date||'').localeCompare(String(a.match?.date||''))||b.set-a.set||b.rallyIndex-a.rallyIndex);$('scout-v670-drill-body').innerHTML=`<div class="scout-v670-grid"><section class="scout-v670-card"><div class="scout-v670-card-head"><div><h3>Nuestro ataque</h3><small>Patrones dentro de este cruce</small></div></div>${scoutV670PatternTable(p,'ours')}</section><section class="scout-v670-card"><div class="scout-v670-card-head"><div><h3>Ataque rival</h3><small>Direcciones dentro de este cruce</small></div></div>${scoutV670PatternTable(p,'opponent')}</section><section class="scout-v670-card wide"><div class="scout-v670-card-head"><div><h3>Rallies del enfrentamiento</h3><small>Secuencia completa para auditar el porcentaje</small></div></div><div class="scout-v670-table-wrap"><table class="scout-v670-table"><thead><tr><th>Fecha</th><th>Set</th><th>Rally</th><th>Marcador</th><th>Saque</th><th>Resultado</th><th>Nuestras acciones</th><th>Rival</th></tr></thead><tbody>${rallyRows.map(r=>`<tr><td>${esc(r.match?.date||'—')}</td><td>${r.set}</td><td>${r.rallyIndex}</td><td>${r.scoreBefore.us}–${r.scoreBefore.opponent} → ${r.scoreAfter.us}–${r.scoreAfter.opponent}</td><td>${r.servingBefore==='ours'?'Nuestro':'Rival'}</td><td><strong>${r.winner==='ours'?'Punto nuestro':'Punto rival'}</strong></td><td>${esc(scoutV670RallyCodes(r,'ours'))}</td><td>${esc(scoutV670RallyCodes(r,'opponent'))}</td></tr>`).join('')}</tbody></table></div></section></div>`;$('scout-v670-drill-modal')?.classList.add('open')}
window.scoutV670CloseDrill=function(){$('scout-v670-drill-modal')?.classList.remove('open')}
window.scoutV670PushToPlan=function(own,opp){const group=scoutV670SelectedGroup(),pair=scoutV670Pair(Number(own),Number(opp));if(!group||!pair.total)return;let p=scoutV660PlanForKey(group.key);const sourceMatches=scoutV670Matches();if(!p){const auto=scoutV660AutoPlan(group,sourceMatches);p=scoutV660NormalizePlan({id:Date.now(),opponentKey:group.key,opponentName:group.name,period:$('scout-v670-period')?.value||'all',sourceMatchIds:auto.sourceMatchIds,auto,generatedAt:auto.generatedAt,staff:scoutV660DefaultStaff(auto)});scoutingGamePlans.push(p)}else if(!p.auto||!Object.keys(p.auto).length){const auto=scoutV660AutoPlan(group,sourceMatches);p.auto=auto;p.sourceMatchIds=auto.sourceMatchIds;p.generatedAt=auto.generatedAt;const defaults=scoutV660DefaultStaff(auto);p.staff={serve:p.staff?.serve||defaults.serve,block:p.staff?.block||defaults.block,defense:p.staff?.defense||defaults.defense,rotations:p.staff?.rotations||defaults.rotations,notes:p.staff?.notes||''}}const ours=scoutV670TopAttackPattern(pair,'ours'),rival=scoutV670TopAttackPattern(pair,'opponent'),line=`${scoutV670PairLabel(pair)} · ${pair.pointPct}% puntos (${pair.won}/${pair.total}) · SO ${pair.sideTotal?pair.sidePct+'%':'—'} · BP ${pair.breakTotal?pair.breakPct+'%':'—'}${rival?` · rival: ${rival.label} ${rival.pct}%`:''}${ours?` · nuestro patrón: ${ours.label}`:''}`;const current=String(p.staff?.rotations||'').trim();if(!current.includes(line))p.staff.rotations=[current,line].filter(Boolean).join('\n');p.updatedAt=scoutNow();scoutV660Persist();alert('Match-up añadido al apartado “Rotaciones / match-up” del plan de partido.')}
window.scoutV670ExportCSV=function(){const g=scoutV670SelectedGroup();if(!g){alert('No hay rival seleccionado.');return}const matrix=scoutV670Matrix(),header=['Nuestra rotacion','Rotacion rival','Rallies','Puntos ganados','Puntos %','Side-out n','Side-out ganado','Side-out %','Break n','Break ganado','Break %','Ataques propios','Kill propio %','EFF propia %','Ataques rival','Kill rival %','EFF rival %'],rows=matrix.map(p=>[`R${p.own}`,`R${p.opp}`,p.total,p.won,p.pointPct,p.sideTotal,p.sideWon,p.sidePct,p.breakTotal,p.breakWon,p.breakPct,p.ourAttacks,p.ourKillPct,p.ourEff,p.oppAttacks,p.oppKillPct,p.oppEff]),csv=[header,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${scoutSafeFilename(g.name)}_matchup_rotaciones_v670.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
const v670PrevTeam=window.cambiarEquipo;window.cambiarEquipo=function(id){const out=v670PrevTeam(id);scoutV670SelectedPair=null;scoutV670PopulateRivals(false);scoutV670Render();return out};

vcUpgradeCodeReference();vcMigrateMatches();const lineModal=$('scout-lineup-modal');lineModal?.addEventListener('change',e=>{if(e.target?.id==='scout-lineup-libero'||e.target?.id==='scout-lineup-libero-auto'||String(e.target?.id||'').startsWith('scout-own-'))scoutRenderLineupPreview()});const renderBase=window.scoutRender;window.scoutRender=function(){const m=scoutActive();if(m){vcEnsureProMatch(m);vcApplyAutoLibero(m,false)}if(!$('scouting')?.classList.contains('active'))return m;renderBase();if(m){vcRenderRotationStrip(m);scoutRenderLiveTactical(m);if($('scout-kpi-rotation'))$('scout-kpi-rotation').textContent=`R${m.rotationNo} · RIV R${m.opponentRotationNo||1}`;if($('scout-kpi-serve'))$('scout-kpi-serve').textContent=`${m.servingTeam==='ours'?'Saque nuestro':'Saque rival'}${m.libero?.activePosition?' · LIB '+m.libero.activePosition.toUpperCase():''}`}};const v620AnalysisBase=window.scoutRenderAnalysis;window.scoutRenderAnalysis=function(){v620AnalysisBase();scoutRenderPerformanceAnalytics();scoutRenderPlayerAnalytics();scoutV640RenderTendencies();scoutV650PopulateRivals(false);scoutV650PopulatePlayers(false);scoutV650Render();scoutV660PopulateRivals(false);scoutV660Render()};const v620CurrentActionsBase=scoutRenderCurrentActions;scoutRenderCurrentActions=function(m){v620CurrentActionsBase(m);document.querySelectorAll('#scout-current-actions .scout-action-item').forEach((row,i)=>{const a=m?.liveRally?.actions?.[i],meta=a?scoutAdvancedMetaText(a):'';if(meta){const small=row.querySelector('.scout-action-copy small');if(small)small.textContent+=(small.textContent?' · ':'')+meta}})};['scout-action-eval','scout-action-start','scout-action-end','scout-action-serve-type','scout-action-phase','scout-action-combo','scout-action-tempo','scout-action-blockers'].forEach(id=>$(id)?.addEventListener('change',scoutUpdateAdvancedCodePreview));$('scout-action-team')?.addEventListener('change',scoutUpdateAdvancedFields);scoutUpdateAdvancedFields();try{scoutV660PopulateRivals(false);scoutV660Render();scoutRender()}catch(err){console.warn('V6.6.0 match plan init',err)}


/* V6.8 relocated inside scouting core scope for runtime stability */
(()=>{
'use strict';
const V680_VERSION='6.8.0';
const V680_DB='volley-coach-match-recovery-v680';
const V680_STORE='snapshots';
const V680_FALLBACK='volley_scout_recovery_v680_';
let v680DBPromise=null,v680LastBackupAt=0,v680LastWarning='',v680EditContext=null,v680BackupBusy=false;

function v680Esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function v680When(iso){if(!iso)return '—';try{return new Date(iso).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch(_){return String(iso)}}
function v680Counts(m){const sets=scoutArr(m?.sets),rallies=sets.reduce((n,s)=>n+scoutArr(s.rallies).length,0),actions=sets.reduce((n,s)=>n+scoutArr(s.rallies).reduce((x,r)=>x+scoutArr(r.actions).length,0),0)+scoutArr(m?.liveRally?.actions).length;return {sets:sets.length,rallies,actions}}
function v680Key(which='current',team=equipoActivo){return `${which}:${team}`}
function v680FallbackKey(which='current',team=equipoActivo){return `${V680_FALLBACK}${which}_${team}`}
function v680OpenDB(){if(v680DBPromise)return v680DBPromise;v680DBPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB no disponible'));return}const req=indexedDB.open(V680_DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(V680_STORE))db.createObjectStore(V680_STORE,{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('No se pudo abrir IndexedDB'))});return v680DBPromise}
async function v680DBGet(key){try{const db=await v680OpenDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(V680_STORE,'readonly'),req=tx.objectStore(V680_STORE).get(key);req.onsuccess=()=>resolve(req.result?.value||null);req.onerror=()=>reject(req.error)})}catch(_){try{return JSON.parse(localStorage.getItem(v680FallbackKey(key.split(':')[0],key.split(':')[1]))||'null')}catch(__){return null}}}
async function v680DBPut(key,value){try{const db=await v680OpenDB();await new Promise((resolve,reject)=>{const tx=db.transaction(V680_STORE,'readwrite');tx.objectStore(V680_STORE).put({key,value});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});return true}catch(_){try{localStorage.setItem(v680FallbackKey(key.split(':')[0],key.split(':')[1]),JSON.stringify(value));return true}catch(__){return false}}}
function v680Snapshot(reason){const m=scoutActive();if(!m)return null;return {type:'volley-coach-scout-recovery',version:V680_VERSION,teamId:equipoActivo,teamName:EQUIPOS?.[equipoActivo]?.nombre||equipoActivo,savedAt:new Date().toISOString(),reason:String(reason||'auto'),activeId:Number(m.id),match:scoutClone(m)}}
window.scoutV680Backup=async function(reason='auto',manual=false){if(v680BackupBusy&&!manual)return false;const snap=v680Snapshot(reason);if(!snap)return false;v680BackupBusy=true;try{const current=await v680DBGet(v680Key('current'));const oldTime=current?.savedAt?Date.parse(current.savedAt):0;if(current&&Date.now()-oldTime>30000)await v680DBPut(v680Key('previous'),current);const ok=await v680DBPut(v680Key('current'),snap);v680LastBackupAt=ok?Date.now():v680LastBackupAt;scoutV680UpdateStatus();if(manual){const b=document.getElementById('scout-save-badge');if(b)b.textContent=ok?'Checkpoint creado':'Error al crear checkpoint'}return ok}finally{v680BackupBusy=false}};

window.scoutV680ValidateAction=function(action,m){const out=[],team=action?.team==='opponent'?'opponent':'ours',skill=String(action?.skill||'');if(skill==='S'&&team!==m.servingTeam)out.push('Saque atribuido a un equipo que no está al saque.');if(skill==='R'&&team===m.servingTeam)out.push('Recepción atribuida al equipo que está sacando.');if(team==='ours'&&action?.playerId){const onCourt=Object.values(m.lineup?.ours||{}).some(id=>Number(id)===Number(action.playerId));if(!onCourt)out.push('El jugador no figura entre los seis visibles en pista.')}if(skill==='A'&&String(action?.startZone||'')&&String(action?.endZone||'')&&String(action.startZone)===String(action.endZone))out.push('Ataque con la misma zona de origen y destino; revisa la trayectoria.');return out};
window.scoutV680ReportWarnings=function(warnings,action){if(!warnings?.length)return;v680LastWarning=`${action?.code||'Acción'} · ${warnings[0]}`;scoutV680UpdateStatus()};

function v680OwnBaseIds(m){const l=m?.baseLineup?.ours||m?.lineup?.ours||{};return ['p1','p2','p3','p4','p5','p6'].map(p=>Number(l[p])||null)}
window.scoutV680ValidateBeforePoint=function(m){if(!m)return false;const ids=v680OwnBaseIds(m),filled=ids.filter(Boolean);if(filled.length!==6){alert('Partido seguro: antes de cerrar un rally debes configurar los seis jugadores rotacionales de tu equipo.');if(typeof window.scoutOpenLineup==='function')window.scoutOpenLineup();return false}if(new Set(filled).size!==6){alert('Partido seguro: hay un jugador repetido en la alineación. Revisa P1–P6.');if(typeof window.scoutOpenLineup==='function')window.scoutOpenLineup();return false}if(Number(m.rotationNo)<1||Number(m.rotationNo)>6||Number(m.opponentRotationNo)<1||Number(m.opponentRotationNo)>6){alert('Partido seguro: la rotación actual no es válida. Revisa la alineación.');return false}return true};
const v680AwardPointBase=window.scoutAwardPoint;window.scoutAwardPoint=function(winner){const m=scoutActive();if(m&&!scoutV680ValidateBeforePoint(m))return;return v680AwardPointBase(winner)};

window.scoutV680Integrity=function(m=scoutActive()){const errors=[],warnings=[];if(!m)return {errors,warnings,total:0};const baseIds=v680OwnBaseIds(m),filled=baseIds.filter(Boolean);if(filled.length!==6)warnings.push('La alineación rotacional propia no tiene seis jugadores.');if(new Set(filled).size!==filled.length)errors.push('Hay jugadores repetidos en la alineación propia.');if(!(Number(m.rotationNo)>=1&&Number(m.rotationNo)<=6))errors.push('Rotación propia fuera de R1–R6.');if(!(Number(m.opponentRotationNo)>=1&&Number(m.opponentRotationNo)<=6))errors.push('Rotación rival fuera de R1–R6.');scoutArr(m.sets).forEach(s=>{let us=0,op=0;scoutArr(s.rallies).forEach((r,i)=>{const before=r.scoreBefore||{},after=r.scoreAfter||{};if(Number(before.us)!==us||Number(before.opponent)!==op)warnings.push(`Set ${s.number}, rally ${i+1}: el marcador inicial no encadena con el rally anterior.`);const du=Number(after.us)-Number(before.us),do_=Number(after.opponent)-Number(before.opponent);if(!((du===1&&do_===0)||(du===0&&do_===1)))errors.push(`Set ${s.number}, rally ${i+1}: incremento de marcador incoherente.`);if(r.winner==='ours'&&du!==1)errors.push(`Set ${s.number}, rally ${i+1}: ganador y marcador no coinciden.`);if(r.winner==='opponent'&&do_!==1)errors.push(`Set ${s.number}, rally ${i+1}: ganador y marcador no coinciden.`);if(!(Number(r.rotationBefore)>=1&&Number(r.rotationBefore)<=6))errors.push(`Set ${s.number}, rally ${i+1}: rotación propia inválida.`);if(!(Number(r.opponentRotationBefore)>=1&&Number(r.opponentRotationBefore)<=6))errors.push(`Set ${s.number}, rally ${i+1}: rotación rival inválida.`);scoutArr(r.actions).forEach((a,j)=>{if(!SCOUT_SKILLS[a.skill])errors.push(`Set ${s.number}, rally ${i+1}, acción ${j+1}: fundamento inválido.`);if(!['#','+','!','-','/','='].includes(a.evaluation))errors.push(`Set ${s.number}, rally ${i+1}, acción ${j+1}: valoración inválida.`);scoutArr(a.validationWarnings).forEach(w=>warnings.push(`Set ${s.number}, rally ${i+1}: ${w}`))});us=Number(after.us)||0;op=Number(after.opponent)||0});if(Number(s.scoreUs)!==us||Number(s.scoreOpponent)!==op)errors.push(`Set ${s.number}: el marcador (${s.scoreUs}–${s.scoreOpponent}) no coincide con sus rallies (${us}–${op}).`)});return {errors:[...new Set(errors)],warnings:[...new Set(warnings)],total:errors.length+warnings.length}};

window.scoutV680UpdateStatus=function(){const m=scoutActive(),net=document.getElementById('scout-v680-network'),backup=document.getElementById('scout-v680-backup'),integ=document.getElementById('scout-v680-integrity'),local=document.getElementById('scout-v680-local'),warn=document.getElementById('scout-v680-last-warning');if(net){net.textContent=navigator.onLine?(cloudUser?'Online · nube disponible':'Online · local'):'Offline · local';net.className='scout-v680-chip '+(navigator.onLine?'ok':'warn')}if(local){local.textContent='Local protegido';local.className='scout-v680-chip ok'}if(backup){backup.textContent=v680LastBackupAt?`Backup ${Math.max(0,Math.round((Date.now()-v680LastBackupAt)/1000))} s`:'Backup pendiente';backup.className='scout-v680-chip '+(v680LastBackupAt?'ok':'warn')}if(integ){const x=scoutV680Integrity(m);integ.textContent=!m?'Integridad —':x.errors.length?`${x.errors.length} errores`:x.warnings.length?`${x.warnings.length} avisos`:'Integridad OK';integ.className='scout-v680-chip '+(!m?'':x.errors.length?'error':x.warnings.length?'warn':'ok')}if(warn)warn.textContent=v680LastWarning||(!navigator.onLine?'Sin conexión: el scouting continúa guardándose localmente y se sincronizará cuando vuelva la red.':'Sin incidencias recientes detectadas.')};
window.addEventListener('online',scoutV680UpdateStatus);window.addEventListener('offline',scoutV680UpdateStatus);
/* V9.5: no heartbeat/background snapshot duplicado. El Journal V9.2 protege las acciones.
   V680 queda disponible para Guardar/Finalizar y recuperación manual. */
window.addEventListener('beforeunload',()=>{try{window.scoutV902Flush?.()}catch(_){}});
setInterval(()=>{try{scoutV680UpdateStatus()}catch(_){}},30000);

async function v680SnapshotCard(snap,which){if(!snap)return `<div class="scout-v680-snapshot"><h4>${which==='current'?'Última copia':'Checkpoint anterior'}</h4><p>No hay copia disponible en este dispositivo.</p></div>`;const c=v680Counts(snap.match);return `<div class="scout-v680-snapshot"><h4>${which==='current'?'Última copia':'Checkpoint anterior'}</h4><p><b>${v680Esc(snap.match?.opponent||'Rival')}</b> · ${v680Esc(snap.match?.date||'—')}</p><p>${c.rallies} rallies · ${c.actions} acciones · ${v680When(snap.savedAt)}</p><p>Motivo: ${v680Esc(snap.reason||'auto')} · formato ${v680Esc(snap.version||'—')}</p><div class="scout-v680-snapshot-actions"><button class="primary" onclick="scoutV680RestoreSnapshot('${which}')">Restaurar</button></div></div>`}
window.scoutV680OpenRecovery=async function(){document.getElementById('scout-v680-recovery-modal')?.classList.add('open');const m=scoutActive(),current=await v680DBGet(v680Key('current')),previous=await v680DBGet(v680Key('previous')),c=m?v680Counts(m):{rallies:0,actions:0},integrity=scoutV680Integrity(m),status=document.getElementById('scout-v680-recovery-status'),snaps=document.getElementById('scout-v680-recovery-snapshots'),issues=document.getElementById('scout-v680-issues');if(status)status.innerHTML=`<div class="scout-v680-status-card"><span>Conexión</span><b>${navigator.onLine?'Online':'Offline'}</b></div><div class="scout-v680-status-card"><span>Partido activo</span><b>${m?v680Esc(m.opponent):'—'}</b></div><div class="scout-v680-status-card"><span>Rallies / acciones</span><b>${c.rallies} / ${c.actions}</b></div><div class="scout-v680-status-card"><span>Integridad</span><b>${integrity.errors.length?integrity.errors.length+' errores':integrity.warnings.length?integrity.warnings.length+' avisos':'OK'}</b></div>`;if(snaps)snaps.innerHTML=(await v680SnapshotCard(current,'current'))+(await v680SnapshotCard(previous,'previous'));if(issues){const all=[...integrity.errors.map(x=>({x,cls:'error'})),...integrity.warnings.map(x=>({x,cls:'warn'}))];issues.innerHTML=all.length?all.slice(0,40).map(i=>`<div class="scout-v680-issue ${i.cls}">${v680Esc(i.x)}</div>`).join(''):'<div class="scout-v680-issue">No se han detectado incoherencias en el partido activo.</div>'}};
window.scoutV680CloseRecovery=function(){document.getElementById('scout-v680-recovery-modal')?.classList.remove('open')};
window.scoutV680RestoreSnapshot=async function(which='current'){const snap=await v680DBGet(v680Key(which));if(!snap?.match){alert('No hay una copia válida para restaurar.');return}if(!confirm(`¿Restaurar la copia de ${v680When(snap.savedAt)}? El scouting activo con el mismo ID será sustituido.`))return;const restored=scoutNormalizeMatch(snap.match),idx=scoutingMatches.findIndex(x=>Number(x.id)===Number(restored.id));if(idx>=0)scoutingMatches[idx]=restored;else scoutingMatches.push(restored);scoutingActiveId=restored.id;scoutSave();scoutV680CloseRecovery();showView('scout-workspace-v900',botonVista('scout-workspace-v900'));scoutRender();alert('Copia restaurada correctamente.')};
window.scoutV680DownloadBackup=function(){const snap=v680Snapshot('download');if(!snap){alert('No hay un scouting activo que copiar.');return}const blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${scoutSafeFilename((snap.match.date||'partido')+'_'+(snap.match.opponent||'rival'))}_backup_v680.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
window.scoutV680ImportBackup=function(event){const file=event?.target?.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(!data?.match||!['volley-coach-scout-recovery','volley-coach-scout-backup'].includes(data.type)){throw new Error('Formato de copia no reconocido')}const restored=scoutNormalizeMatch(data.match);if(!confirm(`Importar scouting contra ${restored.opponent}?`))return;const idx=scoutingMatches.findIndex(x=>Number(x.id)===Number(restored.id));if(idx>=0)scoutingMatches[idx]=restored;else scoutingMatches.push(restored);scoutingActiveId=restored.id;scoutSave();scoutV680CloseRecovery();showView('scout-workspace-v900',botonVista('scout-workspace-v900'));scoutRender()}catch(err){alert('No se pudo importar la copia: '+err.message)}finally{event.target.value=''}};reader.readAsText(file)};

function v680ParseCode(raw,m,oldAction=null){raw=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');const mt=raw.match(/^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])>([1-9]))?(.*)$/);if(!mt)return {error:'Código no reconocido.'};let rest=mt[7]||'';const serve=rest.match(/~(JF|JP|F|U)/)?.[1]||'';rest=rest.replace(/~(JF|JP|F|U)/,'');const combo=rest.match(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/)?.[1]||'';rest=rest.replace(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/,'');const phase=rest.match(/\^(K1|K2|FB|TR)/)?.[1]||'';rest=rest.replace(/\^(K1|K2|FB|TR)/,'');const blockers=rest.match(/@([0-3])/)?.[1]||'';rest=rest.replace(/@([0-3])/,'');if(rest)return {error:'Parte avanzada no reconocida: '+rest};const rival=!!mt[1],num=mt[2],skill=mt[3],evaluation=mt[4]||'!',base={...(oldAction||{}),team:rival?'opponent':'ours',skill,evaluation,startZone:mt[5]||'',endZone:mt[6]||'',serveType:serve,phase,setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',blockers:skill==='A'?blockers:'',validationWarnings:[]};if(rival){base.playerId=null;base.playerLabel=scoutFindOpponentByNumber(m,num);base.playerNumberSnapshot=num;base.playerNameSnapshot=base.playerNameSnapshot||String(base.playerLabel||'').replace(/^#?\d+\s*[·-]?\s*/,'')}else{let p=scoutFindOwnByNumber(num);if(!p&&oldAction&&String(oldAction.playerNumberSnapshot)===String(num))p={id:oldAction.playerId,name:oldAction.playerNameSnapshot,number:num};if(!p)return {error:`No encuentro el dorsal ${num} en la plantilla actual.`};base.playerId=p.id;base.playerLabel='';base.playerNameSnapshot=p.name||base.playerNameSnapshot||'';base.playerNumberSnapshot=p.number??num}const a=scoutNormalizeAction(base);a.code=scoutBuildCode(a);return {action:a}}
window.scoutV680OpenSetEditor=function(setNo){const m=scoutActive(),s=scoutArr(m?.sets).find(x=>Number(x.number)===Number(setNo));if(!m||!s)return;v680EditContext={mode:'set',setNo:Number(setNo)};document.getElementById('scout-v680-rally-modal')?.classList.add('open');document.getElementById('scout-v680-rally-title').textContent=`Set ${s.number} · rallies`;document.getElementById('scout-v680-rally-subtitle').textContent='Selecciona un rally para corregir sus acciones. El marcador queda protegido.';const body=document.getElementById('scout-v680-rally-body'),footer=document.getElementById('scout-v680-rally-footer');if(body)body.innerHTML=`<div class="scout-v680-rally-browser">${scoutArr(s.rallies).slice().reverse().map((r,i)=>`<div class="scout-v680-rally-browser-row"><strong>${r.scoreAfter.us}–${r.scoreAfter.opponent}</strong><div><b>R${r.rotationBefore} · ${r.actions.length} acciones</b><small>${v680Esc(r.actions.map(a=>a.code).join('  ')||'Sin acciones')}${r.editedAt?' · editado '+v680When(r.editedAt):''}</small></div><button class="ghost" onclick="scoutV680OpenRallyEditor(${s.number},${r.id})">Editar acciones</button></div>`).join('')||'<div class="match-empty">No hay rallies cerrados en este set.</div>'}</div>`;if(footer)footer.innerHTML='<div></div><div><button class="ghost" onclick="scoutV680CloseRallyEditor()">Cerrar</button></div>'};
window.scoutV680OpenRallyEditor=function(setNo,rallyId){const m=scoutActive(),s=scoutArr(m?.sets).find(x=>Number(x.number)===Number(setNo)),r=s?.rallies?.find(x=>Number(x.id)===Number(rallyId));if(!m||!s||!r)return;v680EditContext={mode:'rally',setNo:Number(setNo),rallyId:Number(rallyId),actions:scoutClone(r.actions)};document.getElementById('scout-v680-rally-modal')?.classList.add('open');document.getElementById('scout-v680-rally-title').textContent=`Set ${s.number} · ${r.scoreAfter.us}–${r.scoreAfter.opponent}`;document.getElementById('scout-v680-rally-subtitle').textContent=`R${r.rotationBefore} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'} · marcador y rotaciones bloqueados`;scoutV680RenderRallyEditor()};
window.scoutV680RenderRallyEditor=function(){const c=v680EditContext,body=document.getElementById('scout-v680-rally-body'),footer=document.getElementById('scout-v680-rally-footer');if(!body||c?.mode!=='rally')return;body.innerHTML=`<div class="scout-v680-edit-list">${c.actions.map((a,i)=>`<div class="scout-v680-edit-action"><span>${i+1}</span><input id="scout-v680-edit-code-${i}" value="${v680Esc(a.code||scoutBuildCode(a))}" spellcheck="false"><button class="danger" onclick="scoutV680RemoveEditAction(${i})">Eliminar</button></div>`).join('')||'<div class="match-empty">Este rally no tiene acciones.</div>'}</div><div class="scout-v680-add-code"><input id="scout-v680-new-code" placeholder="Añadir código al rally · ej. 12A#.4>5" spellcheck="false"><button class="ghost" onclick="scoutV680AddEditAction()">Añadir</button></div><div class="scout-v680-warning">Edición protegida: solo cambian las acciones. Si el punto fue asignado al equipo incorrecto, utiliza “Deshacer último rally” cuando sea el rally más reciente.</div>`;if(footer)footer.innerHTML=`<div><button class="ghost" onclick="scoutV680OpenSetEditor(${c.setNo})">← Volver al set</button></div><div><button class="ghost" onclick="scoutV680CloseRallyEditor()">Cancelar</button><button class="primary" onclick="scoutV680SaveRallyEdit()">Guardar corrección</button></div>`};
window.scoutV680RemoveEditAction=function(i){if(v680EditContext?.mode!=='rally')return;v680EditContext.actions.splice(Number(i),1);scoutV680RenderRallyEditor()};
window.scoutV680AddEditAction=function(){if(v680EditContext?.mode!=='rally')return;const input=document.getElementById('scout-v680-new-code'),raw=input?.value||'',m=scoutActive(),parsed=v680ParseCode(raw,m,null);if(parsed.error){alert(parsed.error);return}parsed.action.id=Date.now()+Math.floor(Math.random()*1000);parsed.action.createdAt=scoutNow();const s=scoutArr(m.sets).find(x=>Number(x.number)===v680EditContext.setNo),r=s?.rallies?.find(x=>Number(x.id)===v680EditContext.rallyId);parsed.action.scoutMs=Number(r?.scoutEndMs)||0;v680EditContext.actions.push(parsed.action);scoutV680RenderRallyEditor();setTimeout(()=>document.getElementById('scout-v680-new-code')?.focus(),0)};
window.scoutV680SaveRallyEdit=function(){const c=v680EditContext,m=scoutActive();if(c?.mode!=='rally'||!m)return;const s=scoutArr(m.sets).find(x=>Number(x.number)===c.setNo),r=s?.rallies?.find(x=>Number(x.id)===c.rallyId);if(!r)return;const edited=[];for(let i=0;i<c.actions.length;i++){const input=document.getElementById(`scout-v680-edit-code-${i}`),raw=input?.value||c.actions[i].code,parsed=v680ParseCode(raw,m,c.actions[i]);if(parsed.error){alert(`Acción ${i+1}: ${parsed.error}`);input?.focus();return}parsed.action.seq=i+1;edited.push(parsed.action)}r.actions=edited;r.editedAt=scoutNow();r.editCount=(Number(r.editCount)||0)+1;scoutSave();scoutV680Backup('rally-edit',true);scoutV680OpenSetEditor(c.setNo)};
window.scoutV680CloseRallyEditor=function(){document.getElementById('scout-v680-rally-modal')?.classList.remove('open');v680EditContext=null};

const v680RenderRalliesBase=window.scoutRenderRallies;window.scoutRenderRallies=function(m){const s=scoutSet(m),box=document.getElementById('scout-rally-list');if(!box)return v680RenderRalliesBase(m);const rallies=scoutArr(s?.rallies).slice().reverse();box.innerHTML=rallies.length?rallies.map(r=>`<div class="scout-rally-item"><div class="scout-rally-score">${r.scoreAfter.us}–${r.scoreAfter.opponent}</div><div class="scout-rally-copy"><strong>R${r.rotationBefore} · ${r.actions.length} acciones${r.editCount?' · editado':''}</strong><small>${r.servingBefore==='ours'?'Saque nuestro':'Saque rival'}${r.actions.length?' · '+r.actions.map(a=>v680Esc(a.code)).join('  '):''}</small></div><span class="scout-rally-winner ${r.winner==='ours'?'ours':''}">${r.winner==='ours'?'Punto nuestro':'Punto rival'}</span><button class="ghost scout-v680-rally-edit" onclick="scoutV680OpenRallyEditor(${s.number},${r.id})">Editar</button></div>`).join(''):'<div class="scout-action-empty">Aún no hay rallies cerrados en este set.</div>';if(document.getElementById('scout-rally-count'))document.getElementById('scout-rally-count').textContent=`${rallies.length} rallies`};
const v680RenderSetsBase=window.scoutRenderSets;window.scoutRenderSets=function(m){const box=document.getElementById('scout-set-list');if(!box)return v680RenderSetsBase(m);box.innerHTML=scoutArr(m.sets).map(s=>`<div class="scout-set-row"><strong>Set ${s.number}</strong><span>${s.finished?(s.winner==='ours'?'Ganado':s.winner==='opponent'?'Perdido':'Cerrado'):'En juego'} · ${s.rallies.length} rallies</span><b>${s.scoreUs}–${s.scoreOpponent}</b><button class="ghost scout-v680-set-edit" onclick="scoutV680OpenSetEditor(${s.number})">Editar rallies</button></div>`).join('')};
const v680RenderBase=window.scoutRender;window.scoutRender=function(){const out=v680RenderBase();scoutV680UpdateStatus();return out};
window.scoutV680CheckRecoveryOpportunity=async function(){const notice=document.getElementById('scout-v680-recovery-notice'),copy=document.getElementById('scout-v680-recovery-notice-copy'),snap=await v680DBGet(v680Key('current')),m=scoutActive();if(!notice)return;if(!snap?.match||snap.match.status==='finished'){notice.classList.add('hidden');return}const snapT=Date.parse(snap.savedAt||0)||0,curT=Date.parse(m?.updatedAt||0)||0,needs=!m||Number(m.id)!==Number(snap.match.id)||snapT>curT+2000;if(needs){notice.classList.remove('hidden');if(copy)copy.textContent=`${snap.match.opponent||'Rival'} · ${window.scoutV680When(snap.savedAt)} · ${window.scoutV680Counts(snap.match).rallies} rallies.`}else notice.classList.add('hidden')};

// V6.10.5 · Puente seguro para capas posteriores de Session Control.
// Estos helpers viven dentro del motor de scouting; se exportan explícitamente
// para que los hotfixes posteriores no dependan de variables léxicas privadas.
window.scoutV680DBGet=v680DBGet;
window.scoutV680Key=v680Key;
window.scoutV680When=v680When;
window.scoutV680Counts=v680Counts;

// Enter on the editor new-code field.
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='scout-v680-new-code'){e.preventDefault();scoutV680AddEditAction()}});
setTimeout(()=>{scoutV680UpdateStatus();scoutV680CheckRecoveryOpportunity();const m=scoutActive();if(m&&m.status!=='finished')scoutV680Backup('startup')},350);
})();


/* ===== V6.10.5 · BUTTON AUDIT FIX ===== */
const V690_VERSION='6.9.0';
const V690_SETTINGS_KEY='volley_scout_workflow_v690';
const V690_SKILL_CODES=new Set(['S','R','E','A','B','D','F','C']);
const V690_COMBOS=new Set(['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR']);
const v690NormActionBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){const x=v690NormActionBase(a);x.uid=String(a?.uid||`act_${x.id}`);x.videoStart=a?.videoStart==null?null:Number(a.videoStart);x.videoAction=a?.videoAction==null?null:Number(a.videoAction);x.videoEnd=a?.videoEnd==null?null:Number(a.videoEnd);x.clipId=String(a?.clipId||'');return x};
function v690NormalizeWorkflow(raw){raw=raw&&typeof raw==='object'?raw:{};const setLineups={};Object.entries(raw.setLineups||{}).forEach(([k,v])=>{if(v&&typeof v==='object')setLineups[String(k)]={baseLineup:scoutNormalizeLineup(v.baseLineup),lineup:scoutNormalizeLineup(v.lineup||v.baseLineup),lineupRoles:scoutNormalizeRoles(v.lineupRoles),libero:scoutNormalizeLibero(v.libero),rotationNo:Math.min(6,Math.max(1,Number(v.rotationNo)||1)),opponentRotationNo:Math.min(6,Math.max(1,Number(v.opponentRotationNo)||1)),savedAt:String(v.savedAt||scoutNow())}});return {setLineups,events:scoutArr(raw.events).map(e=>({id:Number(e?.id)||Date.now(),uid:String(e?.uid||`evt_${e?.id||Date.now()}`),type:String(e?.type||'note'),subject:String(e?.subject||''),note:String(e?.note||''),setNumber:Number(e?.setNumber)||1,scoreUs:Number(e?.scoreUs)||0,scoreOpponent:Number(e?.scoreOpponent)||0,rotationNo:Math.min(6,Math.max(1,Number(e?.rotationNo)||1)),opponentRotationNo:Math.min(6,Math.max(1,Number(e?.opponentRotationNo)||1)),createdAt:String(e?.createdAt||scoutNow()),scoutMs:Math.max(0,Number(e?.scoutMs)||0),videoTime:e?.videoTime==null?null:Number(e.videoTime),videoSource:String(e?.videoSource||''),videoExact:!!e?.videoExact,noteCategory:String(e?.noteCategory||''),contextLabel:String(e?.contextLabel||'')}))}};
const v690NormMatchBase=scoutNormalizeMatch;
scoutNormalizeMatch=function(m){const x=v690NormMatchBase(m);x.workflow=v690NormalizeWorkflow(m?.workflow);x.dataVersion=V690_VERSION;return x};
scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);

const v690EmptyBase=estadoEquipoVacio;estadoEquipoVacio=function(id){const s=v690EmptyBase(id);if(!Array.isArray(s.scoutLineupTemplatesV690))s.scoutLineupTemplatesV690=[];return s};
const v690CleanBase=limpiarEquipo;limpiarEquipo=function(raw,id){const s=v690CleanBase(raw,id);s.scoutLineupTemplatesV690=scoutArr(raw?.scoutLineupTemplatesV690).map(t=>({id:Number(t?.id)||Date.now(),name:String(t?.name||'Alineación'),baseLineup:scoutNormalizeLineup(t?.baseLineup),lineupRoles:scoutNormalizeRoles(t?.lineupRoles),libero:scoutNormalizeLibero(t?.libero),rotationNo:Math.min(6,Math.max(1,Number(t?.rotationNo)||1)),createdAt:String(t?.createdAt||scoutNow())}));return s};
const v690MemBase=guardarEquipoEnMemoria;guardarEquipoEnMemoria=function(){const keep=scoutClone(equiposData?.[equipoActivo]?.scoutLineupTemplatesV690||[]);v690MemBase();if(equiposData?.[equipoActivo])equiposData[equipoActivo].scoutLineupTemplatesV690=keep};
function scoutV690EnsureTeam(){if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);if(!Array.isArray(equiposData[equipoActivo].scoutLineupTemplatesV690))equiposData[equipoActivo].scoutLineupTemplatesV690=[];return equiposData[equipoActivo]}
function scoutV690EnsureMatch(m=scoutActive()){if(m&&!m.workflow)m.workflow=v690NormalizeWorkflow({});return m}
scoutingMatches.forEach(scoutV690EnsureMatch);

function scoutV690Settings(){const defaults={keyOurs:'ALT_UP',keyRival:'ALT_DOWN',keyUndo:'ALT_Z',keyCode:'ALT_C',autoFocus:true,compactDefault:false,skillAliases:'',comboAliases:''};try{return {...defaults,...JSON.parse(localStorage.getItem(V690_SETTINGS_KEY)||'{}')}}catch(_){return defaults}}
function scoutV690SetSettings(s){localStorage.setItem(V690_SETTINGS_KEY,JSON.stringify(s))}
function scoutV690AliasMap(text,allowed){const map=[];String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(line=>{const [a,b]=line.split('=').map(x=>String(x||'').trim().toUpperCase());if(a&&allowed.has(b))map.push([a,b])});return map.sort((a,b)=>b[0].length-a[0].length)}
function scoutV690PreprocessCode(raw){let x=String(raw||'').trim().toUpperCase().replace(/\s+/g,''),m=x.match(/^(R)?(\d+)(.*)$/);if(!m)return x;let rest=m[3],settings=scoutV690Settings();for(const [alias,canon] of scoutV690AliasMap(settings.skillAliases,V690_SKILL_CODES)){if(rest.startsWith(alias)){rest=canon+rest.slice(alias.length);break}}for(const [alias,canon] of scoutV690AliasMap(settings.comboAliases,V690_COMBOS)){rest=rest.replace(new RegExp(':'+alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\^|@|$)','g'),':'+canon)}return (m[1]||'')+m[2]+rest}
const v690AddCodeBase=window.scoutAddCode;window.scoutAddCode=function(){const input=$('scout-code-input');if(input)input.value=scoutV690PreprocessCode(input.value);const out=v690AddCodeBase();if(scoutV690Settings().autoFocus)setTimeout(()=>$('scout-code-input')?.focus(),0);return out};

window.scoutV690OpenWorkflow=function(){const s=scoutV690Settings();$('scout-v690-key-ours').value=s.keyOurs;$('scout-v690-key-rival').value=s.keyRival;$('scout-v690-key-undo').value=s.keyUndo;$('scout-v690-key-code').value=s.keyCode;$('scout-v690-auto-focus').checked=s.autoFocus!==false;$('scout-v690-compact-default').checked=!!s.compactDefault;$('scout-v690-skill-aliases').value=s.skillAliases||'';$('scout-v690-combo-aliases').value=s.comboAliases||'';$('scout-v690-workflow-modal')?.classList.add('open')};
window.scoutV690CloseWorkflow=function(){$('scout-v690-workflow-modal')?.classList.remove('open')};
window.scoutV690SaveSettings=function(){const s={keyOurs:$('scout-v690-key-ours').value,keyRival:$('scout-v690-key-rival').value,keyUndo:$('scout-v690-key-undo').value,keyCode:$('scout-v690-key-code').value,autoFocus:$('scout-v690-auto-focus').checked,compactDefault:$('scout-v690-compact-default').checked,skillAliases:$('scout-v690-skill-aliases').value,comboAliases:$('scout-v690-combo-aliases').value};scoutV690SetSettings(s);scoutV690CloseWorkflow();scoutV690ApplyCompactDefault();scoutV690UpdateCodeHelp()};
window.scoutV690ResetSettings=function(){localStorage.removeItem(V690_SETTINGS_KEY);scoutV690OpenWorkflow()};
window.scoutV690FocusCode=function(){showView('scout-workspace-v900',botonVista('scout-workspace-v900'));setTimeout(()=>$('scout-code-input')?.focus(),0)};
window.scoutV690ToggleCompact=function(force){const next=typeof force==='boolean'?force:!document.body.classList.contains('scout-live-compact');document.body.classList.toggle('scout-live-compact',next);const b=$('scout-v690-live-btn');if(b){b.classList.toggle('active',next);b.textContent=next?'▣ Salir Live':'▣ Modo Live'}localStorage.setItem('volley_scout_compact_v690',next?'1':'0')};
window.scoutV6101ExitLive=function(){scoutV690ToggleCompact(false);setTimeout(()=>{const el=document.getElementById('scout-v690-live-btn')||document.getElementById('scouting');el?.scrollIntoView?.({behavior:'smooth',block:'start'})},30)};
function scoutV690ApplyCompactDefault(){const s=scoutV690Settings(),stored=localStorage.getItem('volley_scout_compact_v690');scoutV690ToggleCompact(stored===null?!!s.compactDefault:stored==='1')}
function scoutV690UpdateCodeHelp(){const h=document.querySelector('#scouting .scout-code-help'),s=scoutV690Settings();if(!h)return;const aliases=(s.skillAliases||s.comboAliases)?' · Aliases personalizados activos.':'';h.innerHTML=`<b>Formato rápido:</b> dorsal + fundamento + valoración + trayectoria. Los sufijos tácticos <b>~ : ^ @</b> son opcionales. Usa <b>R</b> delante del dorsal para el rival.${aliases}`}

function scoutV690TemplateList(){return scoutV690EnsureTeam().scoutLineupTemplatesV690}
function scoutV690RenderTemplates(){const sel=$('scout-v690-template-select'),m=scoutV690EnsureMatch();if(!sel||!m)return;const list=scoutV690TemplateList();sel.innerHTML='<option value="">— Seleccionar plantilla —</option>'+list.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');const init=m.workflow.setLineups?.[String(m.currentSet)],lab=$('scout-v690-set-initial');if(lab)lab.textContent=init?`Set ${m.currentSet} · inicial guardada ${new Date(init.savedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`:`Set ${m.currentSet} · alineación inicial sin registrar`}
function scoutV690FormSnapshot(){const m=scoutActive();if(!m)return null;const base=scoutEmptyLineup(),roles=scoutNormalizeRoles(m.lineupRoles);SCOUT_POS.forEach(pos=>{base.ours[pos]=Number($(`scout-own-${pos}`)?.value)||null;base.opponent[pos]=String($(`scout-rival-${pos}`)?.value||'').trim();roles.ours[pos]=base.ours[pos]?vcPlayerRole(base.ours[pos]):'';roles.opponent[pos]=String($(`scout-rival-role-${pos}`)?.value||'')});const libId=Number($('scout-lineup-libero')?.value)||null;return {baseLineup:base,lineup:scoutClone(base),lineupRoles:roles,libero:scoutNormalizeLibero({enabled:!!libId,auto:$('scout-lineup-libero-auto')?.checked!==false,playerId:libId,centralIds:SCOUT_POS.map(p=>base.ours[p]).filter(id=>id&&vcHasRole(scoutPlayer(id),'Central'))}),rotationNo:Number($('scout-lineup-rotation')?.value)||1,opponentRotationNo:Number($('scout-lineup-rival-rotation')?.value)||1,savedAt:scoutNow()}}
function scoutV690ApplySnapshotToForm(t){if(!t)return;SCOUT_POS.forEach(pos=>{const o=$(`scout-own-${pos}`),r=$(`scout-rival-${pos}`),rr=$(`scout-rival-role-${pos}`);if(o)o.value=t.baseLineup?.ours?.[pos]||'';if(r)r.value=t.baseLineup?.opponent?.[pos]||'';if(rr)rr.value=t.lineupRoles?.opponent?.[pos]||''});if($('scout-lineup-rotation'))$('scout-lineup-rotation').value=String(t.rotationNo||1);if($('scout-lineup-rival-rotation'))$('scout-lineup-rival-rotation').value=String(t.opponentRotationNo||1);if($('scout-lineup-libero'))$('scout-lineup-libero').value=t.libero?.playerId||'';if($('scout-lineup-libero-auto'))$('scout-lineup-libero-auto').checked=t.libero?.auto!==false;scoutRenderLineupPreview()}
window.scoutV690SaveTemplate=function(){const snap=scoutV690FormSnapshot();if(!snap)return;const name=prompt('Nombre de la plantilla de alineación:','Titular');if(!name)return;const list=scoutV690TemplateList();list.push({id:Date.now(),name:String(name).trim()||'Alineación',...snap,createdAt:scoutNow()});guardarEstadoLocalSinCloud();programarSubidaCloud();scoutV690RenderTemplates()};
window.scoutV690ApplyTemplate=function(id){const t=scoutV690TemplateList().find(x=>Number(x.id)===Number(id));if(t)scoutV690ApplySnapshotToForm(t)};
window.scoutV690DeleteSelectedTemplate=function(){const id=Number($('scout-v690-template-select')?.value)||0;if(!id)return;const list=scoutV690TemplateList(),i=list.findIndex(x=>Number(x.id)===id);if(i>=0&&confirm(`¿Eliminar la plantilla “${list[i].name}”?`)){list.splice(i,1);guardarEstadoLocalSinCloud();programarSubidaCloud();scoutV690RenderTemplates()}};
window.scoutV690SaveSetInitial=function(){const m=scoutV690EnsureMatch(),snap=scoutV690FormSnapshot();if(!m||!snap)return;m.workflow.setLineups[String(m.currentSet)]=snap;scoutSave(false);scoutV690RenderTemplates();scoutV690RenderWorkflow();};
window.scoutV690CopyPreviousSet=function(){const m=scoutV690EnsureMatch();if(!m||m.currentSet<=1){alert('No hay un set anterior.');return}const prev=m.workflow.setLineups[String(m.currentSet-1)];if(!prev){alert('El set anterior no tiene una alineación inicial guardada.');return}scoutV690ApplySnapshotToForm(prev)};
const v690OpenLineupBase=window.scoutOpenLineup;window.scoutOpenLineup=function(){const out=v690OpenLineupBase();scoutV690RenderTemplates();return out};
const v690SaveLineupBase=window.scoutSaveLineup;window.scoutSaveLineup=function(){const m=scoutV690EnsureMatch(),s=scoutSet(m),had=!!m?.workflow?.setLineups?.[String(m.currentSet)],snap=!had&&s&&!s.rallies.length?scoutV690FormSnapshot():null;const out=v690SaveLineupBase();if(snap&&!$('scout-lineup-modal')?.classList.contains('open')){m.workflow.setLineups[String(m.currentSet)]={...snap,baseLineup:scoutClone(m.baseLineup),lineup:scoutClone(m.lineup),lineupRoles:scoutClone(m.lineupRoles),libero:scoutClone(m.libero),rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,savedAt:scoutNow()};scoutSave(false)}scoutV690RenderWorkflow();return out};

const V690_EVENT_LABELS={timeout_ours:'Tiempo nuestro',timeout_opponent:'Tiempo rival',challenge_ours:'Challenge nuestro',challenge_opponent:'Challenge rival',card:'Tarjeta',injury:'Lesión',interruption:'Interrupción',note:'Nota táctica'};
window.scoutV690OpenEvent=function(){const m=scoutV690EnsureMatch(),s=scoutSet(m);if(!m||!s){alert('Necesitas un scouting activo.');return}if($('scout-v690-event-context'))$('scout-v690-event-context').textContent=`Set ${s.number} · ${s.scoreUs}–${s.scoreOpponent} · R${m.rotationNo} vs R${m.opponentRotationNo}`;$('scout-v690-event-subject').value='';$('scout-v690-event-note').value='';$('scout-v690-event-modal')?.classList.add('open')};
window.scoutV690CloseEvent=function(){$('scout-v690-event-modal')?.classList.remove('open')};
window.scoutV690SaveEvent=function(){const m=scoutV690EnsureMatch(),s=scoutSet(m);if(!m||!s)return;const id=Date.now();m.workflow.events.push({id,uid:`evt_${id}`,type:$('scout-v690-event-type').value,subject:String($('scout-v690-event-subject').value||'').trim(),note:String($('scout-v690-event-note').value||'').trim(),setNumber:s.number,scoreUs:s.scoreUs,scoreOpponent:s.scoreOpponent,rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,createdAt:scoutNow(),scoutMs:scoutElapsed(m),videoTime:null});scoutV690CloseEvent();scoutSave(false);scoutV690RenderWorkflow()};
window.scoutV690DeleteEvent=function(id){const m=scoutV690EnsureMatch();if(!m)return;const i=m.workflow.events.findIndex(e=>Number(e.id)===Number(id));if(i>=0&&confirm('¿Eliminar este evento?')){m.workflow.events.splice(i,1);scoutSave(false);scoutV690RenderWorkflow()}};
function scoutV690RenderEvents(m){const box=$('scout-v690-event-strip'),chip=$('scout-v690-events-chip');if(!m){if(box)box.innerHTML='';if(chip)chip.textContent='0 eventos';return}const ev=scoutArr(m.workflow?.events).slice(-8).reverse();if(chip)chip.textContent=`${m.workflow?.events?.length||0} eventos`;if(box)box.innerHTML=ev.map(e=>`<div class="scout-v690-event"><b>${esc(V690_EVENT_LABELS[e.type]||e.type)}</b><span>S${e.setNumber} · ${e.scoreUs}–${e.scoreOpponent}${e.subject?' · '+esc(e.subject):''}</span><button onclick="scoutV690DeleteEvent(${e.id})">×</button></div>`).join('')}

function scoutV690AllRallies(m){const rows=[];scoutArr(m?.sets).forEach(s=>scoutArr(s.rallies).forEach((r,i)=>rows.push({set:s.number,index:i+1,r})));return rows}
function scoutV690Quality(m){const rallies=scoutV690AllRallies(m),n=rallies.length;if(!n)return {score:0,n:0,serve:0,receive:0,attack:0,zones:0,tactical:0,issues:[]};let serve=0,receive=0,attack=0,zones=0,tactical=0;const issues=[];rallies.forEach(({set,index,r})=>{const a=scoutArr(r.actions),server=r.servingBefore,receiver=server==='ours'?'opponent':'ours',hasServe=a.some(x=>x.team===server&&x.skill==='S'),hasReceive=a.some(x=>x.team===receiver&&x.skill==='R'),att=a.filter(x=>x.skill==='A'),hasAttack=att.length>0,hasZones=att.some(x=>x.startZone&&x.endZone)||a.some(x=>x.skill==='S'&&x.startZone&&x.endZone),hasTactical=att.some(x=>x.attackCombo||x.blockers||x.phase)||a.some(x=>x.skill==='E'&&x.setTarget);serve+=hasServe;receive+=hasReceive;attack+=hasAttack;zones+=hasZones;tactical+=hasTactical;const add=(kind,text)=>issues.push({kind,set,index,rallyId:r.id,score:`${r.scoreAfter.us}–${r.scoreAfter.opponent}`,text});if(!hasServe)add('Saque','Sin saque registrado');if(!hasReceive)add('Recepción','Sin recepción del equipo receptor');if(!hasAttack)add('Ataque','Sin ataque registrado');if(hasAttack&&!hasZones)add('Dirección','Ataque sin dirección/zona');if(hasAttack&&!hasTactical)add('Táctico','Ataque sin combinación/bloqueadores/fase')});const pct=x=>Math.round(x/n*100),score=Math.round(pct(serve)*.25+pct(receive)*.25+pct(attack)*.25+pct(zones)*.15+pct(tactical)*.10);return {score,n,serve:pct(serve),receive:pct(receive),attack:pct(attack),zones:pct(zones),tactical:pct(tactical),issues}}
function scoutV690QualityClass(q){return q.score>=85?'good':q.score>=65?'warn':'bad'}
function scoutV690RenderQuality(m){const chip=$('scout-v690-quality-chip'),lineup=$('scout-v690-lineup-chip');if(!m){if(chip)chip.textContent='Calidad —';return}const q=scoutV690Quality(m),cls=scoutV690QualityClass(q);if(chip){chip.textContent=q.n?`Calidad ${q.score}% · ${q.issues.length} avisos`:'Calidad · sin rallies';chip.className='scout-v690-chip '+(q.n?cls:'')}const init=m.workflow?.setLineups?.[String(m.currentSet)];if(lineup){lineup.textContent=init?`Inicial S${m.currentSet} ✓`:`Inicial S${m.currentSet} pendiente`;lineup.className='scout-v690-chip '+(init?'good':'warn')}}
window.scoutV690OpenReview=function(){const m=scoutActive();if(!m){alert('No hay scouting activo.');return}const q=scoutV690Quality(m);$('scout-v690-review-kpis').innerHTML=[['Calidad',q.score+'%'],['Saque',q.serve+'%'],['Recepción',q.receive+'%'],['Ataque',q.attack+'%'],['Direcciones',q.zones+'%']].map(x=>`<div class="scout-v690-review-kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');$('scout-v690-review-summary').innerHTML=`<div class="scout-v690-help"><b>${q.n} rallies revisados.</b> Detalle táctico completo en ${q.tactical}% de los rallies. ${q.issues.length?'Hay '+q.issues.length+' incidencias que conviene revisar.':'No se detectan huecos básicos en el registro.'}<div class="scout-v690-qualitybar"><i style="width:${q.score}%"></i></div></div>`;$('scout-v690-review-issues').innerHTML=q.issues.length?q.issues.slice(0,120).map(i=>`<div class="scout-v690-issue"><strong>Set ${i.set} · ${i.score}</strong><span><b>${esc(i.kind)}</b> · ${esc(i.text)}</span><button class="ghost" onclick="scoutV690OpenIssue(${i.set},${i.rallyId})">Revisar</button></div>`).join(''):'<div class="match-empty">No hay incidencias básicas pendientes.</div>';$('scout-v690-review-modal')?.classList.add('open')};
window.scoutV690CloseReview=function(){$('scout-v690-review-modal')?.classList.remove('open')};
window.scoutV690OpenIssue=function(setNo,rallyId){scoutV690CloseReview();if(typeof window.scoutV680OpenRallyEditor==='function')window.scoutV680OpenRallyEditor(setNo,rallyId)};
window.scoutV690ExportQualityCSV=function(){const m=scoutActive();if(!m)return;const q=scoutV690Quality(m),head=['Set','Rally','Marcador','Tipo','Incidencia'],rows=q.issues.map(i=>[i.set,i.index,i.score,i.kind,i.text]),csv=[head,...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${scoutSafeFilename(m.opponent)}_calidad_scout_v690.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};

function scoutV690RenderWorkflow(){const m=scoutV690EnsureMatch();scoutV690RenderQuality(m);scoutV690RenderEvents(m);scoutV690RenderTemplates();scoutV690UpdateCodeHelp()}
/* V12.3: removed classic-only scoutRender wrapper; Scouting Pro renders through v900Render. */
const v690NextSetBase=window.scoutNextSet;window.scoutNextSet=function(serving){const out=v690NextSetBase(serving);const m=scoutV690EnsureMatch();scoutV690RenderWorkflow();return out};
const v690CreateBase=window.scoutCreateMatch;window.scoutCreateMatch=function(){const out=v690CreateBase();const m=scoutV690EnsureMatch();if(m)scoutSave(false);scoutV690RenderWorkflow();return out};
const v690FinishBase=window.scoutFinishMatch;window.scoutFinishMatch=function(){const m=scoutActive();if(m){const q=scoutV690Quality(m);if(q.n&&q.score<80){if(!confirm(`La calidad del scout es ${q.score}% y hay ${q.issues.length} incidencias. ¿Finalizar igualmente?`)){scoutV690OpenReview();return}}}return v690FinishBase()};
const v690TeamBase=window.cambiarEquipo;window.cambiarEquipo=function(id){const out=v690TeamBase(id);scoutV690EnsureTeam();scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);scoutV690RenderWorkflow();return out};

function scoutV690KeyId(e){if(e.altKey&&e.key==='ArrowUp')return'ALT_UP';if(e.altKey&&e.key==='ArrowDown')return'ALT_DOWN';if(e.ctrlKey&&e.key==='ArrowUp')return'CTRL_UP';if(e.ctrlKey&&e.key==='ArrowDown')return'CTRL_DOWN';if(e.altKey&&String(e.key).toLowerCase()==='z')return'ALT_Z';if(e.ctrlKey&&e.shiftKey&&String(e.key).toLowerCase()==='z')return'CTRL_SHIFT_Z';if(e.altKey&&String(e.key).toLowerCase()==='c')return'ALT_C';if(e.ctrlKey&&String(e.key).toLowerCase()==='k')return'CTRL_K';return''}
/* V12.5 removed unreachable function: scoutV690AppendEval */
/* V12.3: shortcuts migrated from the Classic view to Scouting Pro. */
function v123AppendEval(char){const i=$('v900-code-input');if(!i)return;let v=String(i.value||'');const re=/([#\+!\-\/=])(?=\.|~|:|\^|@|$)/;v=re.test(v)?v.replace(re,char):v+char;i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.focus()}
document.addEventListener('keydown',e=>{const proActive=document.getElementById('scout-workspace-v900')?.classList.contains('active');if(!proActive)return;const code=$('v900-code-input');if(e.target===code&&/^F[1-6]$/.test(e.key)){e.preventDefault();const map={F1:'#',F2:'+',F3:'!',F4:'-',F5:'/',F6:'='};v123AppendEval(map[e.key]);return}if(e.target?.matches?.('input,textarea,select')&&e.target!==code)return;const id=scoutV690KeyId(e),settings=scoutV690Settings();if(!id)return;if(id===settings.keyOurs){e.preventDefault();window.v121Point?.('ours')}else if(id===settings.keyRival){e.preventDefault();window.v121Point?.('opponent')}else if(id===settings.keyUndo){e.preventDefault();window.v121UndoRally?.()}else if(id===settings.keyCode){e.preventDefault();window.scoutV690FocusCode?.()}});


/* ===== V6.10.5 · BUTTON AUDIT FIX ===== */
const V6100_VERSION='6.10.1';
const V6100_ROLES=['Colocador','Receptor','Central','Opuesto','Líbero','Universal'];
function scoutV6100Key(s){return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function scoutV6100Uid(){return 'opp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function scoutV6100NormalizeOpponentProfiles(raw){return scoutArr(raw).map(p=>({key:scoutV6100Key(p?.key||p?.name),name:String(p?.name||'Rival'),updatedAt:String(p?.updatedAt||scoutNow()),players:scoutArr(p?.players).map(x=>({uid:String(x?.uid||scoutV6100Uid()),name:String(x?.name||''),number:String(x?.number??''),role:V6100_ROLES.includes(x?.role)?x.role:'',formerNumbers:scoutArr(x?.formerNumbers).map(String).filter(Boolean)})).filter(x=>x.name||x.number)})).filter(x=>x.key)}
function scoutV6100Team(){return scoutV690EnsureTeam()}
function scoutV6100Profiles(){const t=scoutV6100Team();t.scoutRivalProfilesV6100=scoutV6100NormalizeOpponentProfiles(t.scoutRivalProfilesV6100);return t.scoutRivalProfilesV6100}
function scoutV6100Profile(name=scoutActive()?.opponent){const key=scoutV6100Key(name);return scoutV6100Profiles().find(p=>p.key===key)||null}
function scoutV6100PersistTeam(){guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();programarSubidaCloud()}

// Extend team state without losing existing Supabase/full-state persistence.
const v6100EmptyBase=estadoEquipoVacio;estadoEquipoVacio=function(id){const s=v6100EmptyBase(id);if(!Array.isArray(s.scoutRivalProfilesV6100))s.scoutRivalProfilesV6100=[];return s};
const v6100CleanBase=limpiarEquipo;limpiarEquipo=function(raw,id){const s=v6100CleanBase(raw,id);s.scoutRivalProfilesV6100=scoutV6100NormalizeOpponentProfiles(raw?.scoutRivalProfilesV6100||s.scoutRivalProfilesV6100||[]);return s};
const v6100MemBase=guardarEquipoEnMemoria;guardarEquipoEnMemoria=function(){const keep=scoutClone(equiposData?.[equipoActivo]?.scoutRivalProfilesV6100||[]);v6100MemBase();if(equiposData?.[equipoActivo])equiposData[equipoActivo].scoutRivalProfilesV6100=keep};
['infantil','cadete'].forEach(id=>{if(equiposData?.[id]&&!Array.isArray(equiposData[id].scoutRivalProfilesV6100))equiposData[id].scoutRivalProfilesV6100=[]});

// Stable opponent player identity + future video match container.
const v6100NormActionBase=scoutNormalizeAction;scoutNormalizeAction=function(a){const x=v6100NormActionBase(a);x.opponentPlayerUid=String(a?.opponentPlayerUid||'');return x};
const v6100NormMatchBase=scoutNormalizeMatch;scoutNormalizeMatch=function(m){const x=v6100NormMatchBase(m);x.dataVersion=V6100_VERSION;x.video={syncOffset:m?.video?.syncOffset==null?null:Number(m.video.syncOffset),source:String(m?.video?.source||''),clips:scoutArr(m?.video?.clips)};scoutArr(x.sets).forEach(s=>scoutArr(s.rallies).forEach(r=>{r.videoStart=r?.videoStart==null?null:Number(r.videoStart);r.videoEnd=r?.videoEnd==null?null:Number(r.videoEnd)}));return x};
scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);

function scoutV6100ResolveOpponent(action,m=scoutActive()){if(action?.team!=='opponent')return action;const prof=scoutV6100Profile(m?.opponent),label=String(action.playerLabel||action.playerNameSnapshot||'').trim();if(!prof||!label)return action;const num=(label.match(/#?\s*(\d+)/)||[])[1]||'',name=label.replace(/#?\s*\d+\s*[·\-]?\s*/,'').trim().toLowerCase();let p=prof.players.find(x=>num&&String(x.number)===String(num));if(!p&&name)p=prof.players.find(x=>String(x.name||'').toLowerCase()===name);if(p){action.opponentPlayerUid=p.uid;action.playerNameSnapshot=action.playerNameSnapshot||p.name;action.playerNumberSnapshot=action.playerNumberSnapshot||p.number}return action}
const v6100PushBase=scoutPushAction;scoutPushAction=function(action){scoutV6100ResolveOpponent(action);const out=v6100PushBase(action);if($('scouting')?.classList.contains('active'))setTimeout(()=>{scoutV6100RenderLiveWarning();scoutV6100RenderTimeline()},0);return out};

// Interactive court input.
let v6100Origin='',v6100Dest='';
function scoutV6100ZoneButtons(target,selected){const box=$(target);if(!box)return;box.innerHTML=[1,2,3,4,5,6].map(z=>`<button type="button" class="scout-v6100-zone ${String(selected)===String(z)?'selected':''}" data-zone="${z}" onclick="scoutV6100PickZone('${target.includes('origin')?'origin':'dest'}',${z})">Z${z}</button>`).join('')}
function scoutV6100RenderPath(){scoutV6100ZoneButtons('scout-v6100-origin-grid',v6100Origin);scoutV6100ZoneButtons('scout-v6100-dest-grid',v6100Dest);if($('scout-v6100-path'))$('scout-v6100-path').textContent=`Origen ${v6100Origin||'—'} → Destino ${v6100Dest||'—'}`}
window.scoutV6100PickZone=function(which,z){if(which==='origin')v6100Origin=String(z);else v6100Dest=String(z);scoutV6100RenderPath()};
window.scoutV6100CourtClear=function(){v6100Origin='';v6100Dest='';scoutV6100RenderPath()};
window.scoutV6100OpenCourt=function(){if(!scoutActive()){alert('Crea primero un scouting.');return}v6100Origin=$('scout-action-start')?.value||'';v6100Dest=$('scout-action-end')?.value||'';$('scout-v6100-court-skill').value=$('scout-action-skill')?.value||'A';$('scout-v6100-court-eval').value=$('scout-action-eval')?.value||'!';scoutV6100RenderPath();$('scout-v6100-court-modal')?.classList.add('open')};
window.scoutV6100CloseCourt=function(){$('scout-v6100-court-modal')?.classList.remove('open')};
window.scoutV6100CourtApply=function(register){if($('scout-action-start'))$('scout-action-start').value=v6100Origin;if($('scout-action-end'))$('scout-action-end').value=v6100Dest;if($('scout-action-skill'))$('scout-action-skill').value=$('scout-v6100-court-skill').value;if($('scout-action-eval'))$('scout-action-eval').value=$('scout-v6100-court-eval').value;scoutUpdateAdvancedFields();scoutV6100CloseCourt();if(register)scoutAddManualAction()};

// Code favourites.
function scoutV6100FavoriteList(){return String(scoutV690Settings().favoriteCodes||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const i=line.indexOf('=');return i>0?{label:line.slice(0,i).trim(),code:line.slice(i+1).trim()}:{label:line,code:line}}).filter(x=>x.label&&x.code).slice(0,12)}
function scoutV6100FavoriteResolved(code){const pv=$('scout-action-player')?.value||'',team=$('scout-action-team')?.value||'ours';let dorsal='';if(team==='ours'){const p=scoutPlayer(Number(pv));dorsal=String(p?.number??'')}else dorsal=(String(pv).match(/#?\s*(\d+)/)||[])[1]||'';return String(code).replace(/\{N\}/g,dorsal).replace(/\{R\}/g,team==='opponent'?'R':'')}
window.scoutV6100UseFavorite=function(i){const f=scoutV6100FavoriteList()[Number(i)];if(!f)return;const input=$('scout-code-input');if(!input)return;input.value=scoutV6100FavoriteResolved(f.code);input.focus();scoutAddCode()};
function scoutV6100RenderFavorites(){const box=$('scout-v6100-favorites'),list=scoutV6100FavoriteList();if(!box)return;box.innerHTML=list.length?list.map((f,i)=>`<button class="ghost scout-v6100-fav" onclick="scoutV6100UseFavorite(${i})">${esc(f.label)}</button>`).join(''):'<button class="ghost" onclick="scoutV690OpenWorkflow()">＋ Configurar favoritos</button>'}

// Live flow validation.
function scoutV6100LiveIssues(m=scoutActive()){if(!m)return[];const a=scoutArr(m.liveRally?.actions),issues=[];if(!a.length)return issues;const receiver=m.servingTeam==='ours'?'opponent':'ours',hasR=a.some(x=>x.team===receiver&&x.skill==='R'),hasE=a.some(x=>x.team===receiver&&x.skill==='E'),atts=a.filter(x=>x.team===receiver&&x.skill==='A');if((hasE||atts.length)&&!hasR)issues.push('Hay colocación/ataque sin recepción registrada en el equipo receptor.');atts.forEach(x=>{if(!x.playerId&&!x.playerLabel)issues.push('Hay un ataque sin atacante identificado.');if(!x.startZone||!x.endZone)issues.push('Hay un ataque sin trayectoria completa.')});const serves=a.filter(x=>x.skill==='S');if(serves.length>1)issues.push('Hay más de un saque en el mismo rally.');return [...new Set(issues)]}
window.scoutV6100RenderLiveWarning=function(){const box=$('scout-v6100-live-warning');if(!box)return;const m=scoutActive(),issues=scoutV6100LiveIssues(m);if(!m){box.className='scout-v6100-live-warning';box.textContent='Sin scouting activo.';return}if(!m.liveRally?.actions?.length){box.className='scout-v6100-live-warning good';box.textContent='Rally nuevo · flujo preparado.';return}if(issues.length){box.className='scout-v6100-live-warning warn';box.innerHTML='<b>Revisar:</b> '+issues.map(esc).join(' · ')}else{box.className='scout-v6100-live-warning good';box.textContent='Secuencia coherente hasta el momento.'}}

// Persistent rival roster.
let v6100RivalDraft=[];
function scoutV6100RivalLabel(p){return `${p.number!==''?'#'+p.number+' · ':''}${p.name||'Jugador'}${p.role?' · '+p.role:''}`}
function scoutV6100RenderRivalDraft(){const box=$('scout-v6100-rival-list');if(!box)return;box.innerHTML=v6100RivalDraft.map((p,i)=>`<div class="scout-v6100-rival-row"><input value="${esc(p.number)}" placeholder="Dorsal" oninput="scoutV6100RivalDraftChange(${i},'number',this.value)"><input value="${esc(p.name)}" placeholder="Nombre / apellido" oninput="scoutV6100RivalDraftChange(${i},'name',this.value)"><select onchange="scoutV6100RivalDraftChange(${i},'role',this.value)"><option value="">— Posición —</option>${V6100_ROLES.map(r=>`<option ${r===p.role?'selected':''}>${r}</option>`).join('')}</select><button class="danger" onclick="scoutV6100RemoveRivalPlayer(${i})">×</button></div>`).join('')||'<div class="match-empty">No hay jugadores guardados para este rival.</div>'}
window.scoutV6100RivalDraftChange=function(i,k,v){if(v6100RivalDraft[i])v6100RivalDraft[i][k]=String(v)};
window.scoutV6100AddRivalPlayer=function(){v6100RivalDraft.push({uid:scoutV6100Uid(),name:'',number:'',role:'',formerNumbers:[]});scoutV6100RenderRivalDraft()};
window.scoutV6100RemoveRivalPlayer=function(i){v6100RivalDraft.splice(Number(i),1);scoutV6100RenderRivalDraft()};
window.scoutV6100OpenRivalProfile=function(){const m=scoutActive();if(!m){alert('Crea primero un scouting.');return}const p=scoutV6100Profile(m.opponent);v6100RivalDraft=scoutClone(p?.players||[]);if($('scout-v6100-rival-name'))$('scout-v6100-rival-name').value=m.opponent||'Rival';scoutV6100RenderRivalDraft();$('scout-v6100-rival-modal')?.classList.add('open')};
window.scoutV6100CloseRivalProfile=function(){$('scout-v6100-rival-modal')?.classList.remove('open')};
window.scoutV6100ImportCurrentRivalLineup=function(){const m=scoutActive();if(!m)return;SCOUT_POS.forEach(pos=>{const label=String($(`scout-rival-${pos}`)?.value||m.lineup?.opponent?.[pos]||'').trim(),role=String($(`scout-rival-role-${pos}`)?.value||m.lineupRoles?.opponent?.[pos]||'');if(!label)return;const num=(label.match(/#?\s*(\d+)/)||[])[1]||'',name=label.replace(/#?\s*\d+\s*[·\-]?\s*/,'').trim(),found=v6100RivalDraft.find(x=>(num&&String(x.number)===num)||(name&&x.name.toLowerCase()===name.toLowerCase()));if(found){if(role&&!found.role)found.role=role;if(name&&!found.name)found.name=name}else v6100RivalDraft.push({uid:scoutV6100Uid(),name,number:num,role,formerNumbers:[]})});scoutV6100RenderRivalDraft()};
window.scoutV6100SaveRivalProfile=function(){const m=scoutActive();if(!m)return;const clean=v6100RivalDraft.map(p=>({...p,name:String(p.name||'').trim(),number:String(p.number||'').trim(),role:V6100_ROLES.includes(p.role)?p.role:''})).filter(p=>p.name||p.number);const profiles=scoutV6100Profiles(),key=scoutV6100Key(m.opponent),idx=profiles.findIndex(p=>p.key===key),rec={key,name:m.opponent||'Rival',updatedAt:scoutNow(),players:clean};if(idx>=0)profiles[idx]=rec;else profiles.push(rec);scoutV6100PersistTeam();scoutV6100ApplyRivalDatalist();scoutV6100CloseRivalProfile()};
function scoutV6100ApplyRivalDatalist(){const m=scoutActive(),p=scoutV6100Profile(m?.opponent);let dl=$('scout-v6100-rival-datalist');if(!dl){dl=document.createElement('datalist');dl.id='scout-v6100-rival-datalist';document.body.appendChild(dl)}dl.innerHTML=scoutArr(p?.players).map(x=>`<option value="${esc(scoutV6100RivalLabel(x))}"></option>`).join('');SCOUT_POS.forEach(pos=>{const input=$(`scout-rival-${pos}`);if(input)input.setAttribute('list','scout-v6100-rival-datalist')})}
function scoutV6100AutofillRivalRole(input){const m=scoutActive(),p=scoutV6100Profile(m?.opponent);if(!p||!input)return;const num=(String(input.value).match(/#?\s*(\d+)/)||[])[1]||'',name=String(input.value).replace(/#?\s*\d+\s*[·\-]?\s*/,'').split(' · ')[0].trim().toLowerCase(),found=p.players.find(x=>num&&String(x.number)===num)||p.players.find(x=>name&&x.name.toLowerCase()===name);if(found){const pos=String(input.id).replace('scout-rival-',''),sel=$(`scout-rival-role-${pos}`);if(sel&&found.role)sel.value=found.role}}

// Timeline.
function scoutV6100FmtMs(ms){ms=Math.max(0,Number(ms)||0);const s=Math.floor(ms/1000),m=Math.floor(s/60),ss=s%60;return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`}
window.scoutV6100RenderTimeline=function(){const box=$('scout-v6100-timeline'),m=scoutActive();if(!box)return;if(!m){box.innerHTML='<div class="match-empty">Sin scouting activo.</div>';return}const items=[];scoutArr(m.sets).forEach(s=>scoutArr(s.rallies).forEach((r,i)=>items.push({kind:'rally',ms:r.scoutEndMs??r.scoutStartMs??0,set:s.number,score:`${r.scoreAfter.us}–${r.scoreAfter.opponent}`,title:`Rally ${i+1} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'}`,copy:`R${r.rotationBefore} vs R${r.opponentRotationBefore||1} · ${r.actions.length} acciones`,id:r.id})));scoutArr(m.workflow?.events).forEach(e=>items.push({kind:'event',ms:e.scoutMs||0,set:e.setNumber,score:`${e.scoreUs}–${e.scoreOpponent}`,title:V690_EVENT_LABELS[e.type]||e.type,copy:[e.subject,e.note].filter(Boolean).join(' · ')}));scoutArr(m.events).forEach(e=>items.push({kind:'sub',ms:e.scoutMs||0,set:e.setNumber,score:`${e.scoreUs}–${e.scoreOpponent}`,title:e.type==='libero_auto'?'Líbero automático':'Cambio',copy:`${e.outLabel||'—'} → ${e.inLabel||'—'} · ${String(e.position||'').toUpperCase()}`}));items.sort((a,b)=>a.ms-b.ms);const filter=$('scout-v6100-timeline-filter')?.value||'all',view=filter==='all'?items:items.filter(x=>x.kind===filter);box.innerHTML=view.length?view.map(x=>`<div class="scout-v6100-timeitem ${x.kind}"><time>${scoutV6100FmtMs(x.ms)}</time><span class="kind">S${x.set} · ${x.score}</span><div><strong>${esc(x.title)}</strong>${x.copy?`<small> · ${esc(x.copy)}</small>`:''}</div>${x.kind==='rally'?`<button class="ghost" onclick="scoutV680OpenRallyEditor(${x.set},${x.id})">Abrir</button>`:''}</div>`).join(''):'<div class="match-empty">No hay elementos para este filtro.</div>'};

// Post-match report.
function scoutV6100MatchTotals(m){const sets=scoutArr(m.sets),r=scoutV690AllRallies(m),a=r.flatMap(x=>scoutArr(x.r.actions)),won=sets.filter(s=>s.finished&&s.winner==='ours').length,lost=sets.filter(s=>s.finished&&s.winner==='opponent').length,q=scoutV690Quality(m),oursA=a.filter(x=>x.team==='ours'&&x.skill==='A'),kills=oursA.filter(x=>x.evaluation==='#').length,err=oursA.filter(x=>x.evaluation==='='||x.evaluation==='/').length,eff=oursA.length?Math.round((kills-err)/oursA.length*100):0;return {sets:`${won}–${lost}`,rallies:r.length,actions:a.length,quality:q.score,issues:q.issues.length,attackEff:eff}}
window.scoutV6100OpenPostMatch=function(m=scoutActive()){if(!m)return;const t=scoutV6100MatchTotals(m),q=scoutV690Quality(m);$('scout-v6100-post-title').textContent=`${m.opponent||'Rival'} · ${t.sets}`;$('scout-v6100-post-subtitle').textContent=`${EQUIPOS[equipoActivo]?.nombre||'Equipo'} · ${m.date||''}`;$('scout-v6100-post-kpis').innerHTML=[['Resultado',t.sets],['Rallies',t.rallies],['Acciones',t.actions],['Calidad',t.quality+'%'],['Avisos',t.issues],['Ataque EFF',t.attackEff+'%']].map(x=>`<div class="scout-v6100-post-kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');const topIssues={};q.issues.forEach(i=>topIssues[i.kind]=(topIssues[i.kind]||0)+1);const issueRows=Object.entries(topIssues).sort((a,b)=>b[1]-a[1]).slice(0,6);const rotations=[1,2,3,4,5,6].map(rot=>{const rr=scoutV690AllRallies(m).filter(x=>Number(x.r.rotationBefore)===rot),win=rr.filter(x=>x.r.winner==='ours').length;return {rot,n:rr.length,p:rr.length?Math.round(win/rr.length*100):0}}).filter(x=>x.n).sort((a,b)=>b.p-a.p);$('scout-v6100-post-body').innerHTML=`<section class="scout-v6100-post-panel"><h3>Lectura rápida</h3><div class="scout-v6100-post-list">${rotations.length?`<div><b>Mejor rotación:</b> R${rotations[0].rot} · ${rotations[0].p}% puntos (${rotations[0].n})</div><div><b>Rotación a revisar:</b> R${rotations[rotations.length-1].rot} · ${rotations[rotations.length-1].p}% puntos (${rotations[rotations.length-1].n})</div>`:'<div>Sin muestra de rotaciones.</div>'}<div><b>Calidad:</b> ${q.score}% · ${q.tactical}% con detalle táctico</div></div></section><section class="scout-v6100-post-panel"><h3>Incidencias pendientes</h3><div class="scout-v6100-post-list">${issueRows.length?issueRows.map(x=>`<div><b>${esc(x[0])}:</b> ${x[1]}</div>`).join(''):'<div>Sin incidencias básicas pendientes.</div>'}</div></section>`;$('scout-v6100-post-modal')?.classList.add('open')};
window.scoutV6100ClosePostMatch=function(){$('scout-v6100-post-modal')?.classList.remove('open')};

// Hook workflow settings for favourites.
const v6100OpenWorkflowBase=window.scoutV690OpenWorkflow;window.scoutV690OpenWorkflow=function(){const out=v6100OpenWorkflowBase();if($('scout-v6100-favorite-codes'))$('scout-v6100-favorite-codes').value=scoutV690Settings().favoriteCodes||'';return out};
window.scoutV690SaveSettings=function(){const current=scoutV690Settings();const fav=$('scout-v6100-favorite-codes')?.value||'';const keyOurs=$('scout-v690-key-ours')?.value||current.keyOurs,keyRival=$('scout-v690-key-rival')?.value||current.keyRival,keyUndo=$('scout-v690-key-undo')?.value||current.keyUndo,keyCode=$('scout-v690-key-code')?.value||current.keyCode,autoFocus=$('scout-v690-auto-focus')?.checked!==false,compactDefault=!!$('scout-v690-compact-default')?.checked,skillAliases=$('scout-v690-skill-aliases')?.value||'',comboAliases=$('scout-v690-combo-aliases')?.value||'';scoutV690SetSettings({keyOurs,keyRival,keyUndo,keyCode,autoFocus,compactDefault,skillAliases,comboAliases,favoriteCodes:fav});scoutV690CloseWorkflow();scoutV690ApplyCompactDefault();scoutV690UpdateCodeHelp();scoutV6100RenderFavorites()};

// Enrich lineup with persistent opponent database.
const v6100OpenLineupBase=window.scoutOpenLineup;window.scoutOpenLineup=function(){const out=v6100OpenLineupBase();scoutV6100ApplyRivalDatalist();SCOUT_POS.forEach(pos=>{const input=$(`scout-rival-${pos}`);if(input&&!input.dataset.v6100){input.dataset.v6100='1';input.addEventListener('change',()=>scoutV6100AutofillRivalRole(input))}});return out};

// Keep timeline/quality current after actions, rallies, events and changes.
const v6100EventBase=window.scoutV690SaveEvent;window.scoutV690SaveEvent=function(){const out=v6100EventBase();scoutV6100RenderTimeline();return out};
const v6100SubBase=window.scoutApplySubstitution;window.scoutApplySubstitution=function(){const out=v6100SubBase();scoutV6100RenderTimeline();return out};
const v6100FinishBase=window.scoutFinishMatch;window.scoutFinishMatch=function(){const before=scoutActive(),id=before?.id,status=before?.status;const out=v6100FinishBase();const m=scoutingMatches.find(x=>Number(x.id)===Number(id));if(status!=='finished'&&m?.status==='finished')setTimeout(()=>scoutV6100OpenPostMatch(m),80);return out};

// Update rival profile from active lineup labels when possible without overwriting manually maintained records.
const v6100SaveLineupBase=window.scoutSaveLineup;window.scoutSaveLineup=function(){const out=v6100SaveLineupBase();const m=scoutActive();if(m){const p=scoutV6100Profile(m.opponent);if(p){SCOUT_POS.forEach(pos=>{const label=String(m.lineup?.opponent?.[pos]||''),role=String(m.lineupRoles?.opponent?.[pos]||''),num=(label.match(/#?\s*(\d+)/)||[])[1]||'',name=label.replace(/#?\s*\d+\s*[·\-]?\s*/,'').trim();if(!label)return;let x=p.players.find(v=>num&&String(v.number)===num)||p.players.find(v=>name&&v.name.toLowerCase()===name.toLowerCase());if(x&&role&&!x.role)x.role=role})}}return out};

const v6100AwardBase=window.scoutAwardPoint;window.scoutAwardPoint=function(winner){const before=scoutActive(),id=before?.id,status=before?.status;const out=v6100AwardBase(winner);const m=scoutingMatches.find(x=>Number(x.id)===Number(id));if(status!=='finished'&&m?.status==='finished')setTimeout(()=>scoutV6100OpenPostMatch(m),100);return out};

setTimeout(()=>{scoutV6100RenderFavorites();scoutV6100RenderLiveWarning();scoutV6100RenderTimeline()},520);


// Prepare existing matches for future video linkage and workflow persistence.
scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);scoutingMatches.forEach(m=>{m.dataVersion=V6100_VERSION;scoutArr(m.sets).forEach(s=>scoutArr(s.rallies).forEach(r=>{r.actions=scoutArr(r.actions).map(scoutNormalizeAction)}));m.liveRally.actions=scoutArr(m.liveRally.actions).map(scoutNormalizeAction)});scoutV690EnsureTeam();
setTimeout(()=>{scoutV690ApplyCompactDefault();scoutV690RenderWorkflow()},450);

/* ===== V6.10.5 · BUTTON AUDIT FIX ===== */
const V6102_VERSION='6.10.7';

function scoutV6102ExitToArchive(){
  document.body.classList.remove('scout-live-compact');
  const btn=document.getElementById('scout-v690-live-btn');
  if(btn)btn.textContent='▣ Modo Live';
  showView('scout-dashboard',botonVista('scout-dashboard'));
  if(typeof window.scoutRenderHome==='function')window.scoutRenderHome();
}
window.scoutV6102HasActive=function(){
  const m=scoutActive();
  return !!(m&&m.status!=='finished');
};
window.scoutV6102SaveAndExit=async function(){
  const m=scoutActive();
  if(!m){alert('No hay un scouting activo para guardar.');return}
  m.status='live';m.endedAt=null;m.manualSavedAt=scoutNow();m.dataVersion=V6102_VERSION;
  scoutSave(false);
  try{if(typeof window.scoutV680Backup==='function')await window.scoutV680Backup('manual-save',true)}catch(_){}
  scoutingActiveId=null;
  scoutSave(false);
  scoutV6102ExitToArchive();
};
window.scoutV6102FinalizeAndExit=async function(){
  const m=scoutActive();
  if(!m){alert('No hay un scouting activo para finalizar.');return}
  const pendingActions=scoutArr(m.liveRally?.actions).length;
  if(pendingActions){
    alert(`Hay ${pendingActions} ${pendingActions===1?'acción':'acciones'} en el rally actual sin cerrar. Marca el punto o borra esas acciones antes de finalizar para no perder la relación rally–marcador.`);
    return;
  }
  if(typeof scoutV690Quality==='function'){
    const q=scoutV690Quality(m);
    if(q.n&&q.score<80&&!confirm(`La calidad del scout es ${q.score}% y hay ${q.issues.length} incidencias. ¿Finalizar y guardar igualmente?`)){
      if(typeof window.scoutV690OpenReview==='function')window.scoutV690OpenReview();
      return;
    }
  }
  const set=scoutSet(m);
  if(set&&!set.finished&&(set.scoreUs||set.scoreOpponent)){
    if(scoutSetHasWinner(set)){
      set.finished=true;
      set.winner=set.scoreUs>set.scoreOpponent?'ours':'opponent';
      set.endedAt=scoutNow();
    }else{
      const ok=confirm(`El set ${set.number} está ${set.scoreUs}–${set.scoreOpponent} y no está cerrado reglamentariamente. ¿Finalizar el scouting dejando este set como incompleto?`);
      if(!ok)return;
    }
  }
  if(!confirm('¿Finalizar y guardar este scouting? Después quedará cerrado en el archivo.'))return;
  m.status='finished';m.finalizedByUser=true;m.endedAt=scoutNow();m.updatedAt=scoutNow();m.dataVersion=V6102_VERSION;
  const sets=scoutSetsScore(m);m.resultComplete=sets.us>=3||sets.opponent>=3;if(!m.resultComplete)m.resultCompleteAt=null;
  scoutSyncCompetition(m);
  scoutSave(false);
  try{if(typeof window.scoutV680Backup==='function')await window.scoutV680Backup('final-save',true)}catch(_){}
  scoutingActiveId=null;
  scoutSave(false);
  scoutV6102ExitToArchive();
};
window.scoutFinishMatch=window.scoutV6102FinalizeAndExit;

const v6102OpenNewBase=window.scoutOpenNewMatch;
window.scoutOpenNewMatch=function(){
  const m=scoutActive();
  if(m&&m.status!=='finished'){
    alert('Ya tienes un scouting abierto. Guárdalo o finalízalo antes de crear otro.');
    showView('scout-workspace-v900',botonVista('scout-workspace-v900'));
    return;
  }
  return v6102OpenNewBase();
};

window.scoutAwardPoint=function(winner){
  const m=scoutActive(),s=scoutSet(m);
  if(!m||!s||m.status==='finished'||s.finished)return;
  if(typeof window.scoutV680ValidateBeforePoint==='function'&&!window.scoutV680ValidateBeforePoint(m))return;
  vcEnsureProMatch(m);vcApplyAutoLibero(m,false);scoutEnsureRallyStart(m);
  const before=m.liveRally.startSnapshot||scoutCurrentRallySnapshot(m),
        baseBefore=scoutClone(m.baseLineup),liberoBefore=scoutClone(m.libero),rolesBefore=scoutClone(m.lineupRoles);
  if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;
  const rally={id:m.liveRally.id,setNumber:s.number,servingBefore:before.servingBefore,rotationBefore:before.rotationBefore,opponentRotationBefore:before.opponentRotationBefore,lineupBefore:scoutClone(before.lineupBefore),baseLineupBefore:baseBefore,liberoBefore,lineupRolesBefore:rolesBefore,scoreBefore:scoutClone(before.scoreBefore),scoreAfter:{us:s.scoreUs,opponent:s.scoreOpponent},winner:winner==='opponent'?'opponent':'ours',actions:scoutClone(m.liveRally.actions),startedAt:m.liveRally.startedAt,endedAt:scoutNow(),scoutStartMs:Number(m.liveRally.scoutStartMs)||0,scoutEndMs:scoutElapsed(m)};
  s.rallies.push(rally);
  if(winner==='ours'){
    if(before.servingBefore==='opponent'){vcRotateBase(m,1);m.rotationNo=((m.rotationNo+4)%6)+1}
    m.servingTeam='ours';
  }else{
    if(before.servingBefore==='ours'){m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',1);m.baseLineup.opponent=scoutClone(m.lineup.opponent);m.opponentRotationNo=((m.opponentRotationNo+4)%6)+1}
    m.servingTeam='opponent';
  }
  vcApplyAutoLibero(m,true);scoutResetLiveRally(m);
  if(scoutSetHasWinner(s)){
    s.finished=true;s.winner=s.scoreUs>s.scoreOpponent?'ours':'opponent';s.endedAt=scoutNow();
    const sets=scoutSetsScore(m);m.resultComplete=sets.us>=3||sets.opponent>=3;if(m.resultComplete&&!m.resultCompleteAt)m.resultCompleteAt=scoutNow();
  }
  m.status='live';m.endedAt=null;m.dataVersion=V6102_VERSION;
  scoutSave();
};

scoutRenderEnded=window.scoutRenderEnded=function(m){
  const s=scoutSet(m),box=$('scout-set-ended');
  if(!box)return;
  if(m.status==='finished'){box.classList.remove('hidden');const score=scoutSetsScore(m);box.innerHTML=`<strong>Scouting finalizado · ${score.us}–${score.opponent} sets</strong>`;return}
  if(s?.finished){
    const score=scoutSetsScore(m),complete=score.us>=3||score.opponent>=3;
    box.classList.remove('hidden');
    if(complete){
      box.innerHTML=`<strong>Resultado ${score.us}–${score.opponent} registrado. La sesión sigue abierta hasta que tú la guardes.</strong><div class="scout-set-ended-actions"><button class="ghost" onclick="v121UndoRally()">Reabrir último rally</button><button class="ghost" onclick="scoutV6102SaveAndExit()">Guardar</button><button class="success" onclick="scoutV6102FinalizeAndExit()">Finalizar y guardar</button></div>`;
    }else{
      box.innerHTML=`<strong>Set ${s.number} cerrado · ${s.scoreUs}–${s.scoreOpponent}. ¿Quién realiza el primer saque del siguiente set?</strong><div class="scout-set-ended-actions"><button class="primary" onclick="scoutNextSet('ours')">Sacamos nosotros</button><button class="ghost" onclick="scoutNextSet('opponent')">Saca el rival</button><button class="ghost" onclick="scoutV6102SaveAndExit()">Guardar</button></div>`;
    }
  }else box.classList.add('hidden');
};

window.scoutV680CheckRecoveryOpportunity=async function(){
  const notice=document.getElementById('scout-v680-recovery-notice'),copy=document.getElementById('scout-v680-recovery-notice-copy'),m=scoutActive();
  if(!notice)return;
  if(m&&m.status!=='finished'){notice.classList.add('hidden');return}
  const snap=await window.scoutV680DBGet(window.scoutV680Key('current'));
  if(!snap?.match||snap.match.status==='finished'){notice.classList.add('hidden');return}
  const stored=scoutingMatches.find(x=>Number(x.id)===Number(snap.match.id));
  if(stored?.manualSavedAt){
    const dt=Math.abs((Date.parse(snap.savedAt)||0)-(Date.parse(stored.manualSavedAt)||0));
    if(dt<15000){notice.classList.add('hidden');return}
  }
  notice.classList.remove('hidden');
  if(copy)copy.textContent=`${snap.match.opponent||'Rival'} · ${v680When(snap.savedAt)} · ${v680Counts(snap.match).rallies} rallies.`;
};

const v6102OpenSavedBase=window.scoutOpenSaved;
window.scoutOpenSaved=function(id){
  const active=scoutActive();
  if(active&&active.status!=='finished'&&Number(active.id)!==Number(id)){
    alert(`Tienes un scouting abierto contra ${active.opponent||'el rival actual'}. Guárdalo o finalízalo antes de abrir otro.`);
    showView('scout-workspace-v900',botonVista('scout-workspace-v900'));
    return;
  }
  const m=scoutingMatches.find(x=>Number(x.id)===Number(id));
  if(!m)return;
  if(m.status!=='finished'){m.reopenedAt=scoutNow();m.status='live';m.endedAt=null}
  return v6102OpenSavedBase(id);
};


/* ===== V6.10.5 · BUTTON AUDIT FIX ===== */
window.scoutV6103HasPendingSession=function(){
  const id=Number(scoutingActiveId)||0;
  if(!id)return false;
  const m=scoutingMatches.find(x=>Number(x.id)===id)||null;
  return !!(m&&m.status!=='finished');
};
function scoutV6103StayLive(message){
  if(message)alert(message);
  if(document.body.classList.contains('scout-v690-compact')===false&&typeof window.scoutV690ToggleCompact==='function'){}
  showView('scout-workspace-v900',botonVista('scout-workspace-v900'));
  setTimeout(()=>{if(typeof window.scoutRender==='function')window.scoutRender()},0);
}

const v6103DeleteSavedBase=window.scoutDeleteSaved;
window.scoutDeleteSaved=function(id){
  const active=scoutActive();
  if(active&&active.status!=='finished'&&Number(active.id)===Number(id)){
    scoutV6103StayLive('No puedes eliminar el scouting que está abierto. Primero guárdalo o finalízalo.');
    return;
  }
  return v6103DeleteSavedBase(id);
};

const v6103TeamBase=window.cambiarEquipo;
window.cambiarEquipo=function(id){
  const active=scoutActive();
  if(active&&active.status!=='finished'&&String(id)!==String(equipoActivo)){
    scoutV6103StayLive(`Tienes un scouting abierto contra ${active.opponent||'el rival actual'}. Guárdalo o finalízalo antes de cambiar de equipo.`);
    return false;
  }
  return v6103TeamBase(id);
};

const v6103UndoBase=window.scoutUndoRally;
window.scoutUndoRally=function(){
  const out=v6103UndoBase();
  const m=scoutActive();
  if(m){
    const sets=scoutSetsScore(m);
    m.resultComplete=sets.us>=3||sets.opponent>=3;
    if(!m.resultComplete)m.resultCompleteAt=null;
    m.status='live';m.endedAt=null;m.dataVersion=V6102_VERSION;
    scoutSave(false);scoutRender();
  }
  return out;
};

function scoutV6103WarnMidRally(label){
  const m=scoutActive(),n=scoutArr(m?.liveRally?.actions).length;
  if(!n)return true;
  return confirm(`Ya hay ${n} ${n===1?'acción':'acciones'} en el rally actual. ${label} ahora puede hacer que esas acciones queden asociadas a una alineación o rotación distinta. ¿Continuar igualmente?`);
}
const v6103LineupBase=window.scoutOpenLineup;
window.scoutOpenLineup=function(){if(!scoutV6103WarnMidRally('Cambiar la alineación'))return;return v6103LineupBase()};
const v6103SubBase=window.scoutOpenSubstitution;
window.scoutOpenSubstitution=function(){if(!scoutV6103WarnMidRally('Registrar un cambio'))return;return v6103SubBase()};
const v6103RotateBase=window.scoutRotate;
window.scoutRotate=function(dir=1){if(!scoutV6103WarnMidRally('Rotar nuestro equipo'))return;return v6103RotateBase(dir)};
const v6103RotateOppBase=window.scoutRotateOpponent;
window.scoutRotateOpponent=function(dir=1){if(!scoutV6103WarnMidRally('Rotar al rival'))return;return v6103RotateOppBase(dir)};

const v6103RestoreBase=window.scoutV680RestoreSnapshot;
window.scoutV680RestoreSnapshot=async function(which='current'){
  const active=scoutActive();
  if(active&&active.status!=='finished'){
    scoutV6103StayLive('La restauración está bloqueada mientras el scouting actual está abierto. El autosave y los checkpoints siguen protegiendo la sesión. Guarda primero si quieres restaurar otra copia.');
    return;
  }
  return v6103RestoreBase(which);
};
const v6103ImportBase=window.scoutV680ImportBackup;
window.scoutV680ImportBackup=function(event){
  const active=scoutActive();
  if(active&&active.status!=='finished'){
    if(event?.target)event.target.value='';
    scoutV6103StayLive('No puedes importar otra copia mientras este scouting está abierto. Guárdalo o finalízalo antes.');
    return;
  }
  return v6103ImportBase(event);
};

const v6102PostBase=window.scoutV6100OpenPostMatch;
window.scoutV6100OpenPostMatch=function(m=scoutActive()){
  if(!m||m.status!=='finished'||!m.finalizedByUser)return;
  return v6102PostBase(m);
};

const v6102NormMatchBase=scoutNormalizeMatch;
scoutNormalizeMatch=function(m){
  const x=v6102NormMatchBase(m);
  x.manualSavedAt=m?.manualSavedAt?String(m.manualSavedAt):null;
  x.reopenedAt=m?.reopenedAt?String(m.reopenedAt):null;
  x.finalizedByUser=!!m?.finalizedByUser;
  x.resultComplete=!!m?.resultComplete;
  x.resultCompleteAt=m?.resultCompleteAt?String(m.resultCompleteAt):null;
  x.dataVersion=V6102_VERSION;
  return x;
};
scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);
scoutingMatches.forEach(m=>{if(m.status!=='finished'){m.status='live';m.endedAt=null}m.dataVersion=V6102_VERSION;});

/* ===== V6.10.8 · CONTACT ZONES =====
   Mantiene una sesión de scouting anclada durante la edición y evita que una
   descarga de nube o un wrapper posterior deje la UI visible sin match activo. */
const V6106_PIN_PREFIX='volleyScoutPinnedV6106:';
let v6106SuppressActiveRecovery=false;
function scoutV6106PinKey(){return V6106_PIN_PREFIX+String(equipoActivo||'equipo')}
function scoutV6106PinnedId(){try{return Number(localStorage.getItem(scoutV6106PinKey()))||null}catch(_){return null}}
function scoutV6106Pin(id){try{if(id)localStorage.setItem(scoutV6106PinKey(),String(id));else localStorage.removeItem(scoutV6106PinKey())}catch(_){}}
function scoutV6106Unpin(){try{localStorage.removeItem(scoutV6106PinKey())}catch(_){}}
window.scoutV6106DetachActive=function(){
  scoutingActiveId=null;
  if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
  equiposData[equipoActivo].scoutingActiveId=null;
  scoutV6106Unpin();
  return true;
};

const v6106ScoutActiveBase=scoutActive;
scoutActive=function(){
  const direct=v6106ScoutActiveBase();
  if(direct){if(!v6106SuppressActiveRecovery&&direct.status!=='finished')scoutV6106Pin(direct.id);return direct}
  if(v6106SuppressActiveRecovery)return null;
  const candidates=[
    Number(scoutingActiveId)||null,
    Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null,
    scoutV6106PinnedId()
  ].filter(Boolean);
  for(const id of candidates){
    const found=scoutingMatches.find(x=>Number(x.id)===Number(id));
    if(found&&found.status!=='finished'){
      scoutingActiveId=found.id;
      if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
      equiposData[equipoActivo].scoutingActiveId=found.id;
      scoutV6106Pin(found.id);
      return found;
    }
  }
  return null;
};

function scoutV6106ResolveLineupMatch(){
  let m=scoutActive();
  if(m)return m;
  const modalId=Number(document.getElementById('scout-lineup-modal')?.dataset?.matchId)||null;
  if(modalId){
    m=scoutingMatches.find(x=>Number(x.id)===modalId)||null;
    if(m&&m.status!=='finished'){
      scoutingActiveId=m.id;
      if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
      equiposData[equipoActivo].scoutingActiveId=m.id;
      scoutV6106Pin(m.id);
      return m;
    }
  }
  return null;
}

const v6106OpenLineupBase=window.scoutOpenLineup;
window.scoutOpenLineup=function(){
  const before=scoutActive();
  const out=v6106OpenLineupBase();
  const m=scoutActive()||before;
  const modal=document.getElementById('scout-lineup-modal');
  if(modal&&m&&modal.classList.contains('open'))modal.dataset.matchId=String(m.id);
  return out;
};

const v6106CreateBase=window.scoutCreateMatch;
window.scoutCreateMatch=function(){
  const out=v6106CreateBase();
  const m=scoutActive();
  if(m){scoutV6106Pin(m.id);const modal=document.getElementById('scout-lineup-modal');if(modal)modal.dataset.matchId=String(m.id)}
  return out;
};

const v6106OpenSavedBase=window.scoutOpenSaved;
window.scoutOpenSaved=function(id){
  const out=v6106OpenSavedBase(id);
  const m=scoutActive();
  if(m)scoutV6106Pin(m.id);
  return out;
};

const v6106SaveExitBase=window.scoutV6102SaveAndExit;
window.scoutV6102SaveAndExit=async function(){
  const recovered=scoutActive();
  if(!recovered){alert('No hay un scouting activo para guardar.');return}
  v6106SuppressActiveRecovery=true;
  try{
    return await v6106SaveExitBase()
  }finally{
    /* V9.5.2: Save means "saved and no longer active".
       Clear every recovery source BEFORE automatic recovery is re-enabled. */
    scoutingActiveId=null;
    if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
    equiposData[equipoActivo].scoutingActiveId=null;
    scoutV6106Unpin();
    v6106SuppressActiveRecovery=false;
  }
};

const v6106FinalizeBase=window.scoutV6102FinalizeAndExit;
window.scoutV6102FinalizeAndExit=async function(){
  const recovered=scoutActive();
  if(!recovered){alert('No hay un scouting activo para finalizar.');return}
  v6106SuppressActiveRecovery=true;
  try{return await v6106FinalizeBase()}
  finally{
    if(!scoutingActiveId)scoutV6106Unpin();
    else scoutV6106Pin(scoutingActiveId);
    v6106SuppressActiveRecovery=false;
  }
};
window.scoutFinishMatch=window.scoutV6102FinalizeAndExit;

// Una descarga de Supabase nunca debe borrar una sesión que el usuario está
// editando en ese momento. Conservamos el match local y lo reinyectamos después.
const v6106ApplyCloudBase=window.aplicarEstadoCloud;
if(typeof v6106ApplyCloudBase==='function')window.aplicarEstadoCloud=function(state){
  const active=scoutActive();
  const snapshot=active&&active.status!=='finished'?scoutClone(active):null;
  const activeId=snapshot?.id||null;
  const out=v6106ApplyCloudBase(state);
  if(snapshot&&activeId&&!v6106SuppressActiveRecovery){
    const idx=scoutingMatches.findIndex(x=>Number(x.id)===Number(activeId));
    if(idx>=0){
      const remote=scoutingMatches[idx];
      const localTs=Date.parse(snapshot.updatedAt||snapshot.createdAt||0)||0;
      const remoteTs=Date.parse(remote?.updatedAt||remote?.createdAt||0)||0;
      if(localTs>=remoteTs)scoutingMatches[idx]=snapshot;
    }else scoutingMatches.push(snapshot);
    scoutingActiveId=activeId;
    if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
    equiposData[equipoActivo].scoutingMatches=scoutClone(scoutingMatches);
    equiposData[equipoActivo].scoutingActiveId=activeId;
    scoutV6106Pin(activeId);
    guardarEquipoEnMemoria();
    guardarEstadoLocalSinCloud();
    if(typeof scoutRender==='function')scoutRender();
    if(typeof programarSubidaCloud==='function')programarSubidaCloud();
  }
  return out;
};

// Si ya había una sesión válida al cargar esta versión, la dejamos anclada.
{const m=scoutActive();if(m)scoutV6106Pin(m.id)}

/* ===== V6.10.5 · BUTTON AUDIT FIX =====
   Guardado final unificado: evita depender de la cadena de wrappers histórica. */
window.scoutSaveLineup=function(){
  const m=scoutV6106ResolveLineupMatch();
  if(!m){alert('No se ha podido recuperar la sesión de scouting activa. Vuelve a abrir el partido desde Partidos guardados.');return false}
  scoutingActiveId=m.id;scoutV6106Pin(m.id);
  if(m.status==='finished'){alert('Este scouting está finalizado y no se puede modificar.');return false}
  vcEnsureProMatch(m);

  const missing=[];
  const ids=[];
  SCOUT_POS.forEach(pos=>{
    const id=Number($(`scout-own-${pos}`)?.value)||null;
    if(!id)missing.push(pos.toUpperCase());
    else ids.push(id);
  });
  if(missing.length){
    alert(`Faltan jugadores por asignar en: ${missing.join(', ')}.\n\nDebes tener seis jugadores rotacionales antes de guardar la alineación.`);
    return false;
  }
  if(new Set(ids).size!==6){
    alert('Un mismo jugador no puede ocupar dos posiciones a la vez. Revisa P1–P6.');
    return false;
  }

  const libId=Number($('scout-lineup-libero')?.value)||null;
  if(libId&&ids.includes(libId)){
    alert('El líbero no puede estar también entre los seis jugadores rotacionales.');
    return false;
  }
  const badLib=ids.map(scoutPlayer).find(p=>p&&vcHasRole(p,'Líbero')&&vcRoleForPlayer(p)==='Líbero');
  if(badLib){
    alert(`${badLib.name||'El líbero'} está asignado como uno de los seis rotacionales. Selecciónalo únicamente en “Líbero automático”.`);
    return false;
  }

  // Leer primero todo el formulario; solo mutamos el partido tras superar las validaciones.
  const nextBase=scoutNormalizeLineup(m.baseLineup||m.lineup);
  const nextRoles=scoutNormalizeRoles(m.lineupRoles);
  SCOUT_POS.forEach(pos=>{
    const id=Number($(`scout-own-${pos}`)?.value)||null;
    nextBase.ours[pos]=id;
    const rival=String($(`scout-rival-${pos}`)?.value||'').trim();
    nextBase.opponent[pos]=rival;
    nextRoles.ours[pos]=id?vcPlayerRole(id):'';
    nextRoles.opponent[pos]=String($(`scout-rival-role-${pos}`)?.value||'');
  });
  const rotationNo=Math.min(6,Math.max(1,Number($('scout-lineup-rotation')?.value)||1));
  const opponentRotationNo=Math.min(6,Math.max(1,Number($('scout-lineup-rival-rotation')?.value)||1));
  const autoLib=$('scout-lineup-libero-auto')?.checked!==false;

  m.baseLineup=nextBase;
  m.lineupRoles=nextRoles;
  m.rotationNo=rotationNo;
  m.opponentRotationNo=opponentRotationNo;
  m.libero=scoutNormalizeLibero(m.libero);
  m.libero.playerId=libId;
  m.libero.enabled=!!libId;
  m.libero.auto=autoLib;
  m.libero.centralIds=ids.filter(id=>vcHasRole(scoutPlayer(id),'Central'));
  m.libero.activeForId=null;
  m.libero.activePosition='';
  vcApplyAutoLibero(m,false);

  // Guardar fotografía inicial del set si aún no existe y todavía no se ha cerrado ningún rally.
  scoutV690EnsureMatch(m);
  const s=scoutSet(m);
  if(s&&!s.rallies.length&&!m.workflow.setLineups[String(m.currentSet)]){
    m.workflow.setLineups[String(m.currentSet)]={
      baseLineup:scoutClone(m.baseLineup),
      lineup:scoutClone(m.lineup),
      lineupRoles:scoutClone(m.lineupRoles),
      libero:scoutClone(m.libero),
      rotationNo:m.rotationNo,
      opponentRotationNo:m.opponentRotationNo,
      savedAt:scoutNow()
    };
  }

  // Mantener sincronizados los roles conocidos de la plantilla rival.
  try{
    const profile=scoutV6100Profile(m.opponent);
    if(profile){
      SCOUT_POS.forEach(pos=>{
        const label=String(m.lineup?.opponent?.[pos]||''),role=String(m.lineupRoles?.opponent?.[pos]||'');
        if(!label||!role)return;
        const num=(label.match(/#?\s*(\d+)/)||[])[1]||'';
        const name=label.replace(/#?\s*\d+\s*[·\-]?\s*/,'').trim();
        const player=profile.players.find(v=>num&&String(v.number)===num)||profile.players.find(v=>name&&String(v.name||'').toLowerCase()===name.toLowerCase());
        if(player&&!player.role)player.role=role;
      });
    }
  }catch(err){console.warn('V6.10.7 rival lineup profile sync',err)}

  m.updatedAt=scoutNow();
  m.dataVersion='6.10.7';
  scoutCloseLineup();
  scoutRefreshActionPlayers();
  scoutSave(false);
  scoutRender();
  scoutV690RenderWorkflow();
  scoutV690RenderTemplates();
  const badge=$('scout-save-badge');
  if(badge)badge.textContent='Alineación guardada · sesión abierta';
  setTimeout(()=>{const b=$('scout-save-badge');if(b&&b.textContent.startsWith('Alineación guardada'))b.textContent='Sesión abierta · auto-protección'},2200);
  return true;
};


/* ===== V6.10.8 · CONTACT ZONES =====
   - Rotación reglamentaria: R1 → R6 → R5 → R4 → R3 → R2 → R1 al recuperar saque.
   - Mantiene sincronizadas baseLineup.opponent y lineup.opponent para que la
     alineación rival persista, se vea en pista y al reabrir el modal.
*/
const V6107_VERSION='6.10.7';
function scoutV6107NextRotation(value,dir=1){
  const r=Math.min(6,Math.max(1,Number(value)||1));
  // dir >= 0 = giro reglamentario de los jugadores (P2→P1, P1→P6).
  // Con la nomenclatura de rotaciones del colocador esto es R1→R6→...→R2→R1.
  return ((r-1+(dir>=0?-1:1)+6)%6)+1;
}
function scoutV6107OpponentHasData(obj){
  return !!obj&&SCOUT_POS.some(p=>String(obj[p]??'').trim());
}
function scoutV6107SyncOpponentLineup(m,preferBase=false){
  if(!m)return;
  vcEnsureProMatch(m);
  const live=m.lineup?.opponent||{};
  const base=m.baseLineup?.opponent||{};
  const liveHas=scoutV6107OpponentHasData(live),baseHas=scoutV6107OpponentHasData(base);
  // El rival no usa sustitución automática de líbero: baseLineup es la fuente estable.
  // En V6.10.6 podía actualizarse baseLineup sin copiarse a lineup, por eso siempre
  // preferimos la base cuando contiene datos.
  if(baseHas)m.lineup.opponent=scoutClone(base);
  else if(liveHas)m.baseLineup.opponent=scoutClone(live);
}

// Abrir alineación siempre con la alineación rival actual visible.
const v6107OpenLineupBase=window.scoutOpenLineup;
window.scoutOpenLineup=function(){
  const m=scoutActive();if(m)scoutV6107SyncOpponentLineup(m);
  return v6107OpenLineupBase();
};

// Guardar alineación: además de la base, copiar explícitamente la rival a la pista actual.
const v6107SaveLineupBase=window.scoutSaveLineup;
window.scoutSaveLineup=function(){
  const ok=v6107SaveLineupBase();
  if(ok===false)return false;
  const m=scoutActive();
  if(!m)return ok;
  vcEnsureProMatch(m);
  // La función base V6.10.7 ya ha leído el formulario en baseLineup.opponent.
  m.lineup.opponent=scoutClone(m.baseLineup.opponent);
  SCOUT_POS.forEach(pos=>{
    if(!m.lineupRoles.opponent[pos])m.lineupRoles.opponent[pos]=String($(`scout-rival-role-${pos}`)?.value||'');
  });
  m.dataVersion=V6107_VERSION;m.updatedAt=scoutNow();
  scoutRefreshActionPlayers();
  scoutSave(false);
  scoutRender();
  return true;
};

// Renderizado defensivo: nunca dejar la pista rival vacía si la base está guardada.
const v6107RenderCourtBase=window.scoutRenderCourt;
window.scoutRenderCourt=function(m){
  if(m)scoutV6107SyncOpponentLineup(m);
  return v6107RenderCourtBase(m);
};
const v6107RefreshPlayersBase=window.scoutRefreshActionPlayers;
window.scoutRefreshActionPlayers=function(){
  const m=scoutActive();if(m)scoutV6107SyncOpponentLineup(m);
  return v6107RefreshPlayersBase();
};

// Rotación manual: el movimiento físico ya era correcto; corregimos la etiqueta R1–R6.
window.scoutRotate=function(dir=1){
  if(typeof scoutV6103WarnMidRally==='function'&&!scoutV6103WarnMidRally('Rotar nuestro equipo'))return;
  const m=scoutActive();if(!m||m.status==='finished')return;
  vcEnsureProMatch(m);vcRotateBase(m,dir);
  m.rotationNo=scoutV6107NextRotation(m.rotationNo,dir);
  vcApplyAutoLibero(m,true);m.dataVersion=V6107_VERSION;scoutSave();
};
window.scoutRotateOpponent=function(dir=1){
  if(typeof scoutV6103WarnMidRally==='function'&&!scoutV6103WarnMidRally('Rotar al rival'))return;
  const m=scoutActive();if(!m||m.status==='finished')return;
  vcEnsureProMatch(m);scoutV6107SyncOpponentLineup(m);
  m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',dir);
  m.baseLineup.opponent=scoutClone(m.lineup.opponent);
  m.opponentRotationNo=scoutV6107NextRotation(m.opponentRotationNo,dir);
  m.dataVersion=V6107_VERSION;scoutSave();
};

// Cierre de rally: corregimos la rotación automática de ambos equipos.
window.scoutAwardPoint=function(winner){
  const m=scoutActive(),s=scoutSet(m);
  if(!m||!s||m.status==='finished'||s.finished)return;
  if(typeof window.scoutV680ValidateBeforePoint==='function'&&!window.scoutV680ValidateBeforePoint(m))return;
  vcEnsureProMatch(m);scoutV6107SyncOpponentLineup(m);vcApplyAutoLibero(m,false);scoutEnsureRallyStart(m);
  const before=m.liveRally.startSnapshot||scoutCurrentRallySnapshot(m),
        baseBefore=scoutClone(m.baseLineup),liberoBefore=scoutClone(m.libero),rolesBefore=scoutClone(m.lineupRoles);
  if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;
  const rally={id:m.liveRally.id,setNumber:s.number,servingBefore:before.servingBefore,rotationBefore:before.rotationBefore,opponentRotationBefore:before.opponentRotationBefore,lineupBefore:scoutClone(before.lineupBefore),baseLineupBefore:baseBefore,liberoBefore,lineupRolesBefore:rolesBefore,scoreBefore:scoutClone(before.scoreBefore),scoreAfter:{us:s.scoreUs,opponent:s.scoreOpponent},winner:winner==='opponent'?'opponent':'ours',actions:scoutClone(m.liveRally.actions),startedAt:m.liveRally.startedAt,endedAt:scoutNow(),scoutStartMs:Number(m.liveRally.scoutStartMs)||0,scoutEndMs:scoutElapsed(m)};
  s.rallies.push(rally);
  if(winner==='ours'){
    if(before.servingBefore==='opponent'){
      vcRotateBase(m,1);
      m.rotationNo=scoutV6107NextRotation(m.rotationNo,1);
    }
    m.servingTeam='ours';
  }else{
    if(before.servingBefore==='ours'){
      m.lineup=scoutRotateTeamLineup(m.lineup,'opponent',1);
      m.baseLineup.opponent=scoutClone(m.lineup.opponent);
      m.opponentRotationNo=scoutV6107NextRotation(m.opponentRotationNo,1);
    }
    m.servingTeam='opponent';
  }
  vcApplyAutoLibero(m,true);scoutV6107SyncOpponentLineup(m);scoutResetLiveRally(m);
  if(scoutSetHasWinner(s)){
    s.finished=true;s.winner=s.scoreUs>s.scoreOpponent?'ours':'opponent';s.endedAt=scoutNow();
    const sets=scoutSetsScore(m);m.resultComplete=sets.us>=3||sets.opponent>=3;if(m.resultComplete&&!m.resultCompleteAt)m.resultCompleteAt=scoutNow();
  }
  m.status='live';m.endedAt=null;m.dataVersion=V6107_VERSION;
  scoutSave();
};

// Reparación única de la numeración histórica de rotaciones creada con la lógica anterior.
function scoutV6107RepairRotationHistory(m){
  if(!m||m.rotationDirectionFixedV6107)return;
  scoutArr(m.sets).forEach(set=>{
    const rallies=scoutArr(set.rallies);
    if(!rallies.length)return;
    const snap=m.workflow?.setLineups?.[String(set.number)]||null;
    let own=Math.min(6,Math.max(1,Number(snap?.rotationNo||rallies[0]?.rotationBefore)||1));
    let opp=Math.min(6,Math.max(1,Number(snap?.opponentRotationNo||rallies[0]?.opponentRotationBefore)||1));
    let serve=rallies[0]?.servingBefore==='opponent'?'opponent':'ours';
    rallies.forEach(r=>{
      r.rotationBefore=own;r.opponentRotationBefore=opp;r.servingBefore=serve;
      if(r.winner==='ours'){
        if(serve==='opponent')own=scoutV6107NextRotation(own,1);
        serve='ours';
      }else if(r.winner==='opponent'){
        if(serve==='ours')opp=scoutV6107NextRotation(opp,1);
        serve='opponent';
      }
    });
    if(Number(set.number)===Number(m.currentSet)){
      m.rotationNo=own;m.opponentRotationNo=opp;m.servingTeam=serve;
    }
  });
  m.rotationDirectionFixedV6107=true;
}

// Al cargar partidos antiguos, recuperar la alineación rival y reparar las etiquetas R1–R6.
scoutingMatches.forEach(m=>{try{scoutV6107SyncOpponentLineup(m,true);scoutV6107RepairRotationHistory(m);m.dataVersion=V6107_VERSION}catch(_){}});
if(scoutActive()){scoutV6107SyncOpponentLineup(scoutActive(),true);scoutV6107RepairRotationHistory(scoutActive())}
// Persistir la migración sin forzar un cambio de pantalla.
try{if(scoutingMatches.length)scoutSave(false)}catch(_){}


/* ===== V6.10.8 · CONTACT ZONES =====
   Permite codificar Recepción y Defensa con una sola zona de contacto:
   7R#.6 / 6D+.5. Mantiene .1>6 para trayectoria completa y conserva
   compatibilidad con todos los códigos anteriores.
*/
const V6108_VERSION='6.10.8';
function scoutV6108IsContactSkill(skill){return skill==='R'||skill==='D'}
function scoutV6108ContactZone(a){return String(a?.contactZone||((scoutV6108IsContactSkill(a?.skill))?(a?.endZone||a?.startZone||''):'')||'')}
function scoutV6108ZoneText(a){
  if(a?.startZone&&a?.endZone)return `Z${a.startZone} → Z${a.endZone}`;
  const z=scoutV6108ContactZone(a);return z?`Z${z}`:'—';
}
function scoutV6108NormalizeZoneInput(skill,start,end){
  start=String(start||'');end=String(end||'');
  if(scoutV6108IsContactSkill(skill)){
    if(start&&end)return {startZone:start,endZone:end,contactZone:end,sourceZone:start,zoneInferred:false};
    const z=end||start;
    return {startZone:'',endZone:z,contactZone:z,sourceZone:'',zoneInferred:false};
  }
  return {startZone:start,endZone:end,contactZone:'',sourceZone:'',zoneInferred:false};
}
function scoutV6108InferSource(action,m=scoutActive()){
  if(!action||!m||!scoutV6108IsContactSkill(action.skill)||!action.contactZone||action.sourceZone)return action;
  const wanted=action.skill==='R'?'S':'A';
  const other=action.team==='ours'?'opponent':'ours';
  const prev=[...scoutArr(m.liveRally?.actions)].reverse().find(a=>a.team===other&&a.skill===wanted&&a.startZone&&(a.endZone?String(a.endZone)===String(action.contactZone):true));
  if(prev){action.sourceZone=String(prev.startZone||'');action.zoneInferred=!!action.sourceZone;action.sourceActionId=Number(prev.id)||null}
  return action;
}

// Preserve the new zone metadata through normalization / persistence.
const v6108NormalizeActionBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){
  const x=v6108NormalizeActionBase(a);
  const contact=String(a?.contactZone||((scoutV6108IsContactSkill(x.skill))?(x.endZone||x.startZone||''):'')||'');
  x.contactZone=contact;
  x.sourceZone=String(a?.sourceZone||((scoutV6108IsContactSkill(x.skill)&&x.startZone&&x.endZone)?x.startZone:'')||'');
  x.zoneInferred=!!a?.zoneInferred;
  x.sourceActionId=a?.sourceActionId!=null?Number(a.sourceActionId):null;
  // Old reception/defense records with a single start zone are migrated to contact zone.
  if(scoutV6108IsContactSkill(x.skill)&&contact&&!x.endZone&&!x.startZone)x.endZone=contact;
  return x;
};

// Code builder: R/D can use .6; detailed trajectories remain .1>6.
scoutBuildCode=function(a){
  let token='';
  if(a.team==='opponent'){
    const n=String(a.playerLabel||'').match(/\d+/)?.[0]||String(a.playerNumberSnapshot||'').match(/\d+/)?.[0]||String(a.playerLabel||'').replace(/\s+/g,'').slice(0,4)||'?';
    token='R'+n;
  }else{
    const p=scoutPlayer(a.playerId);token=p?.number!==''&&p?.number!=null?String(p.number):(a.playerNumberSnapshot!==''&&a.playerNumberSnapshot!=null?String(a.playerNumberSnapshot):'P');
  }
  token+=a.skill+(a.evaluation||'!');
  if(a.startZone&&a.endZone)token+=`.${a.startZone}>${a.endZone}`;
  else if(scoutV6108IsContactSkill(a.skill)&&scoutV6108ContactZone(a))token+=`.${scoutV6108ContactZone(a)}`;
  if(a.serveType)token+=`~${a.serveType}`;
  const combo=a.setTarget||a.attackCombo;if(combo)token+=`:${combo}`;
  if(a.phase)token+=`^${a.phase}`;
  if(a.blockers!==''&&a.blockers!=null)token+=`@${a.blockers}`;
  return token;
};

// Enrich R/D with the source action already typed in the same rally, without
// forcing that inferred information into the visible short code.
const v6108PushActionBase=scoutPushAction;
scoutPushAction=function(action){
  if(action&&scoutV6108IsContactSkill(action.skill)){
    const z=scoutV6108NormalizeZoneInput(action.skill,action.startZone,action.endZone||action.contactZone);
    action={...action,...z,contactZone:action.contactZone||z.contactZone,sourceZone:action.sourceZone||z.sourceZone};
    scoutV6108InferSource(action);
  }
  return v6108PushActionBase(action);
};

function scoutV6108ParseRaw(raw,m,oldAction=null){
  raw=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  // One zone is accepted syntactically; below it is restricted to R/D.
  const mt=raw.match(/^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])(?:>([1-9]))?)?(.*)$/);
  if(!mt)return {error:'Código no reconocido.'};
  let rest=mt[7]||'';
  const serve=rest.match(/~(JF|JP|F|U)/)?.[1]||'';rest=rest.replace(/~(JF|JP|F|U)/,'');
  const combo=rest.match(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/)?.[1]||'';rest=rest.replace(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/,'');
  const phase=rest.match(/\^(K1|K2|FB|TR)/)?.[1]||'';rest=rest.replace(/\^(K1|K2|FB|TR)/,'');
  const blockers=rest.match(/@([0-3])/)?.[1]||'';rest=rest.replace(/@([0-3])/,'');
  if(rest)return {error:'Parte avanzada no reconocida: '+rest};
  const rival=!!mt[1],num=mt[2],skill=mt[3],evaluation=mt[4]||'!',z1=mt[5]||'',z2=mt[6]||'';
  if(z1&&!z2&&!scoutV6108IsContactSkill(skill))return {error:'La zona única (.6) solo se usa en recepción o defensa. Para saque/ataque usa origen>destino, por ejemplo .1>6.'};
  const zones=scoutV6108NormalizeZoneInput(skill,z1,z2);
  const base={...(oldAction||{}),team:rival?'opponent':'ours',skill,evaluation,...zones,serveType:serve,phase,setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',blockers:skill==='A'?blockers:'',validationWarnings:[]};
  if(rival){
    base.playerId=null;base.playerLabel=scoutFindOpponentByNumber(m,num);base.playerNumberSnapshot=num;base.playerNameSnapshot=base.playerNameSnapshot||String(base.playerLabel||'').replace(/^#?\d+\s*[·-]?\s*/,'');
  }else{
    let p=scoutFindOwnByNumber(num);if(!p&&oldAction&&String(oldAction.playerNumberSnapshot)===String(num))p={id:oldAction.playerId,name:oldAction.playerNameSnapshot,number:num};
    if(!p)return {error:`No encuentro el dorsal ${num} en la plantilla actual.`};
    base.playerId=p.id;base.playerLabel='';base.playerNameSnapshot=p.name||base.playerNameSnapshot||'';base.playerNumberSnapshot=p.number??num;
  }
  scoutV6108InferSource(base,m);
  const a=scoutNormalizeAction(base);a.code=scoutBuildCode(a);return {action:a};
}

// Quick-code console, now accepting 7R#.6 / 6D+.5 / R7R-.5.
window.scoutAddCode=function(){
  const input=$('scout-code-input');let raw=String(input?.value||'');
  if(typeof scoutV690PreprocessCode==='function')raw=scoutV690PreprocessCode(raw);
  if(!String(raw).trim())return;
  const m=scoutActive();if(!m){alert('No hay un scouting activo.');return}
  const parsed=scoutV6108ParseRaw(raw,m,null);
  if(parsed.error){alert(parsed.error+'\n\nEjemplos: 7R#.6 · 6D+.5 · 4S+.1>5 · 12A#.4>5');return}
  scoutPushAction(parsed.action);
  if(input){input.value='';if(!scoutV690Settings||scoutV690Settings().autoFocus!==false)input.focus()}
};

// Rally editor uses exactly the same grammar as the live console.
window.v680ParseCode=function(raw,m,oldAction=null){return scoutV6108ParseRaw(raw,m,oldAction)};

// Manual form: in R/D, one selected zone becomes the contact zone.
window.scoutAddManualAction=function(){
  const team=$('scout-action-team')?.value||'ours',pv=$('scout-action-player')?.value||'',skill=$('scout-action-skill')?.value||'S',combo=$('scout-action-combo')?.value||'';
  const zones=scoutV6108NormalizeZoneInput(skill,$('scout-action-start')?.value||'',$('scout-action-end')?.value||'');
  scoutPushAction({team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',skill,evaluation:$('scout-action-eval')?.value||'!',...zones,serveType:$('scout-action-serve-type')?.value||'',phase:$('scout-action-phase')?.value||'',setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',attackTempo:skill==='A'?($('scout-action-tempo')?.value||''):'',blockers:skill==='A'?($('scout-action-blockers')?.value||''):''});
};

window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$('scout-action-skill')?.value||'S',ev=$('scout-action-eval')?.value||'!',start=$('scout-action-start')?.value||'',end=$('scout-action-end')?.value||'',serve=$('scout-action-serve-type')?.value||'',phase=$('scout-action-phase')?.value||'',combo=$('scout-action-combo')?.value||'',blockers=$('scout-action-blockers')?.value??'';
  let c='N'+skill+ev;
  if(start&&end)c+=`.${start}>${end}`;
  else if(scoutV6108IsContactSkill(skill)&&(end||start))c+=`.`+(end||start);
  if(serve)c+=`~${serve}`;if((skill==='E'||skill==='A')&&combo)c+=`:${combo}`;if(phase)c+=`^${phase}`;if(skill==='A'&&blockers!=='')c+=`@${blockers}`;
  if($('scout-advanced-code-preview'))$('scout-advanced-code-preview').textContent='Código: '+c;
};

const v6108AdvancedFieldsBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v6108AdvancedFieldsBase();
  const skill=$('scout-action-skill')?.value||'S',contact=scoutV6108IsContactSkill(skill);
  const sl=$('scout-action-start-label'),el=$('scout-action-end-label');
  if(sl)sl.textContent=contact?'Origen (opcional)':'Zona origen';
  if(el)el.textContent=contact?(skill==='R'?'Zona de recepción':'Zona de defensa'):'Zona destino';
  scoutUpdateAdvancedCodePreview();return out;
};
['scout-action-start','scout-action-end','scout-action-skill'].forEach(id=>$(id)?.addEventListener('change',()=>scoutUpdateAdvancedCodePreview()));

// Interactive court: a single zone in R/D is treated as contact. Both zones keep
// the detailed trajectory. The visible explanation changes according to skill.
function scoutV6108CourtSkill(){return $('scout-v6100-court-skill')?.value||$('scout-action-skill')?.value||'A'}
const v6108CourtRenderBase=scoutV6100RenderPath;
scoutV6100RenderPath=function(){
  v6108CourtRenderBase();
  const skill=scoutV6108CourtSkill(),contact=scoutV6108IsContactSkill(skill),path=$('scout-v6100-path');
  const panels=document.querySelectorAll('#scout-v6100-court-modal .scout-v6100-zone-panel h3');
  if(panels[0])panels[0].textContent=contact?'Origen opcional':'Zona de origen';
  if(panels[1])panels[1].textContent=contact?(skill==='R'?'Zona de recepción':'Zona de defensa'):'Zona de destino';
  if(contact&&path){const z=(v6100Origin&&v6100Dest)?'':(v6100Dest||v6100Origin);path.textContent=z?`${skill==='R'?'Recepción':'Defensa'} en Z${z}`:`${v6100Origin&&v6100Dest?`Origen ${v6100Origin} → Destino ${v6100Dest}`:'Selecciona una zona; para trayectoria completa marca origen y destino'}`}
};
const v6108CourtApplyBase=window.scoutV6100CourtApply;
window.scoutV6100CourtApply=function(register){
  const skill=scoutV6108CourtSkill();
  if(scoutV6108IsContactSkill(skill)&&!(v6100Origin&&v6100Dest)){
    const z=v6100Dest||v6100Origin;v6100Origin='';v6100Dest=z;
  }
  return v6108CourtApplyBase(register);
};
$('scout-v6100-court-skill')?.addEventListener('change',()=>scoutV6100RenderPath());

// Show contact zones in the live rally instead of hiding them when no origin exists.
const v6108CurrentActionsBase=scoutRenderCurrentActions;
scoutRenderCurrentActions=function(m){
  v6108CurrentActionsBase(m);
  document.querySelectorAll('#scout-current-actions .scout-action-item').forEach((row,i)=>{
    const a=m?.liveRally?.actions?.[i];if(!a)return;
    const small=row.querySelector('.scout-action-copy small'),z=scoutV6108ZoneText(a);
    if(small&&z!=='—'&&!small.textContent.includes(z))small.textContent+=(small.textContent?' · ':'')+z;
  });
};

// Rival-plan reception zones now use the real contact zone (destination for a
// detailed R .1>6, or the single zone in R#.6).
scoutV660ReceptionZones=function(matches){
  const rows=scoutV650AllActions(matches).filter(a=>a.skill==='R'&&scoutV6108ContactZone(a));
  return scoutV660GroupRows(rows,a=>'Z'+scoutV6108ContactZone(a)).map(([zone,zrows])=>({zone,total:zrows.length,negative:zrows.filter(a=>['-','/','='].includes(a.evaluation)).length,negativePct:scoutV660Pct(zrows.filter(a=>['-','/','='].includes(a.evaluation)).length,zrows.length),perfectPct:scoutV660Pct(zrows.filter(a=>a.evaluation==='#').length,zrows.length)})).sort((a,b)=>b.negativePct-a.negativePct||b.total-a.total);
};

// Better code-reference help.
const v6108CodeRefBase=window.scoutOpenCodeReference;
window.scoutOpenCodeReference=function(){
  const modal=$('scout-code-reference-modal');
  if(modal){
    const examples=modal.querySelector('.scout-example-list');
    if(examples&&!modal.dataset.contactZoneHelp){
      examples.insertAdjacentHTML('afterbegin',`<div class="scout-example"><code>7R#.6</code>Recepción perfecta del #7 realizada en Z6. No necesitas indicar de dónde venía el saque.</div><div class="scout-example"><code>6D+.5</code>Defensa positiva del #6 realizada en Z5.</div><div class="scout-example"><code>7R#.1&gt;6</code>Formato detallado: recepción en Z6 de un balón procedente de Z1.</div>`);
      modal.dataset.contactZoneHelp='1';
    }
  }
  return v6108CodeRefBase();
};

// Migrate old R/D actions and rebuild their code without changing rallies/scores.
function scoutV6108MigrateAction(a){
  if(!a||!scoutV6108IsContactSkill(a.skill))return false;
  let changed=false;
  if(!a.contactZone){a.contactZone=String(a.endZone||a.startZone||'');changed=!!a.contactZone}
  if(a.startZone&&a.endZone&&!a.sourceZone){a.sourceZone=String(a.startZone);changed=true}
  const rebuilt=scoutBuildCode(a);if(rebuilt&&a.code!==rebuilt){a.code=rebuilt;changed=true}
  return changed;
}
let v6108Migrated=false;
scoutingMatches.forEach(m=>{
  let changed=false;
  scoutArr(m.sets).forEach(s=>scoutArr(s.rallies).forEach(r=>scoutArr(r.actions).forEach(a=>{if(scoutV6108MigrateAction(a))changed=true})));
  scoutArr(m.liveRally?.actions).forEach(a=>{if(scoutV6108MigrateAction(a))changed=true});
  if(changed){m.dataVersion=V6108_VERSION;m.updatedAt=scoutNow();v6108Migrated=true}
});
if(v6108Migrated){try{scoutSave(false)}catch(_){}}
const v6108Active=scoutActive();if(v6108Active)v6108Active.dataVersion=V6108_VERSION;
const v6108HelpBase=scoutV690UpdateCodeHelp;
scoutV690UpdateCodeHelp=function(){
  v6108HelpBase();
  const h=document.querySelector('#scouting .scout-code-help');
  if(h)h.innerHTML='<b>Formato rápido:</b> dorsal + fundamento + valoración. <b>R/D:</b> usa una sola zona de contacto (<b>7R#.6</b>, <b>6D+.5</b>) o trayectoria completa (<b>7R#.1&gt;6</b>). <b>S/A:</b> trayectoria <b>.origen&gt;destino</b>. Sufijos <b>~ : ^ @</b> opcionales. Usa <b>R</b> delante del dorsal para el rival.';
};
scoutV690UpdateCodeHelp();scoutUpdateAdvancedFields();


/* ===== V7.0.1 · VIDEO SCOUTING COUNTS =====
   Adapta las métricas compartidas con la hoja oficial Data Volley a conteos.
   Mantiene todos los módulos propios (tendencias, rival, match-up, etc.).
*/
const V6109_VERSION='6.10.9';
function scoutV6109Skill(st,skill){
  const x=st?.skills?.[skill]||scoutEmptySkillStat(),e=x.evals||{};
  return {total:Number(x.total)||0,perfect:Number(e['#'])||0,positive:(Number(e['#'])||0)+(Number(e['+'])||0),neutral:Number(e['!'])||0,minus:Number(e['-'])||0,blocked:Number(e['/'])||0,error:Number(e['='])||0,failed:(Number(e['-'])||0)+(Number(e['/'])||0)+(Number(e['='])||0)};
}
function scoutV6109PointMetrics(st,team){
  const rows=scoutArr(st?.actions),isWin=a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill),isLoss=a=>(a.skill==='S'&&a.evaluation==='=')||(a.skill==='R'&&a.evaluation==='=')||(a.skill==='A'&&(a.evaluation==='='||a.evaluation==='/'));
  const won=rows.filter(isWin).length,lost=rows.filter(isLoss).length,bp=rows.filter(a=>isWin(a)&&a.servingBefore===team).length;
  return {won,lost,bp,gp:won-lost};
}
function scoutV6109GpText(gp,won,lost){if(won==null||lost==null)return '—';const sign=gp>0?'+':'';return `${sign}${gp} (${won}/${lost})`}
function scoutV6109GpClass(v){return v>0?'good':v<0?'bad':''}
function scoutV6109Phase(m,team,key,phase){const x=scoutV630PlayerSequenceRate(m,team,key,phase),lost=x.total-x.won,gp=x.won-lost;return {...x,lost,gp}}
function scoutV6109InitialPos(m,team,st,setNo){
  const snap=m?.workflow?.setLineups?.[String(setNo)]||null,base=snap?.baseLineup?.[team]||snap?.lineup?.[team]||null;
  if(base){for(const p of SCOUT_POS){if(team==='ours'){const id=Number(String(st.key).split(':')[1])||Number(st.playerId)||0;if(id&&Number(base[p])===id)return String(Number(p.slice(1)))}else{const label=String(st.label||'').trim().toLowerCase(),v=String(base[p]||'').trim().toLowerCase();if(label&&v===label)return String(Number(p.slice(1)))}}}
  const participated=scoutActionRows(m,true).some(a=>Number(a.set)===Number(setNo)&&a.team===team&&scoutPlayerKey(a)===st.key);
  return participated?'*':'';
}
function scoutV6109FormationCells(m,team,st,isTeam){if(isTeam)return '<td colspan="5" class="scout-v6109-form">—</td>';return [1,2,3,4,5].map(n=>`<td class="scout-v6109-form">${esc(scoutV6109InitialPos(m,team,st,n)||'')}</td>`).join('')}
function scoutV6109WonBreakdown(m,team){
  const seq=scoutV630FilteredSequences(m,team),won=seq.filter(x=>x.win);let serve=0,attack=0,block=0,oppErr=0;
  won.forEach(x=>{const acts=scoutArr(x.rallyData?.actions),mine=acts.filter(a=>a.team===team),lastPoint=[...mine].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));if(lastPoint?.skill==='S')serve++;else if(lastPoint?.skill==='A')attack++;else if(lastPoint?.skill==='B')block++;else oppErr++});
  return {total:won.length,serve,attack,block,oppErr,lost:seq.length-won.length,gp:won.length-(seq.length-won.length)};
}
/* V12.5 removed unreachable function: scoutV6109MetricLabel */
const scoutV6109MetricLabelBase=scoutV630MetricLabel;scoutV630MetricLabel=function(metric){return ({P_PTS:'Puntos · total',P_BP:'Puntos · break point',P_GP:'Puntos · G-P',S_GP:'Saque · G-P',A_GP:'Ataque · G-P',D_GP:'Defensa · G-P',E_GP:'Colocación · G-P'})[metric]||scoutV6109MetricLabelBase(metric)};
function scoutV6109ImpactRows(rows,metric,team){
  if(metric==='P_PTS')return rows.filter(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));
  if(metric==='P_BP')return rows.filter(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill)&&a.servingBefore===team);
  if(metric==='P_GP')return rows.filter(a=>(a.evaluation==='#'&&['S','A','B'].includes(a.skill))||(a.skill==='S'&&a.evaluation==='=')||(a.skill==='R'&&a.evaluation==='=')||(a.skill==='A'&&(a.evaluation==='='||a.evaluation==='/')));
  if(metric==='S_GP')return rows.filter(a=>a.skill==='S'&&(a.evaluation==='#'||a.evaluation==='='));
  if(metric==='A_GP')return rows.filter(a=>a.skill==='A'&&(a.evaluation==='#'||a.evaluation==='='||a.evaluation==='/'));
  if(metric==='D_GP')return rows.filter(a=>a.skill==='D'&&['#','+','-','/','='].includes(a.evaluation));
  if(metric==='E_GP')return rows.filter(a=>a.skill==='E'&&['#','+','-','/','='].includes(a.evaluation));
  return null;
}
scoutV630ActionMetricRows=function(m,team,key,metric){const all=scoutV630FilteredActions(m,team).filter(a=>key==='team'||scoutPlayerKey(a)===key),impact=scoutV6109ImpactRows(all,metric,team);return impact||scoutV630MetricActions(all,metric)};
function scoutV6109Row(m,team,st,isTeam=false){
  const s=scoutV6109Skill(st,'S'),r=scoutV6109Skill(st,'R'),a=scoutV6109Skill(st,'A'),b=scoutV6109Skill(st,'B'),d=scoutV6109Skill(st,'D'),e=scoutV6109Skill(st,'E'),p=scoutV6109PointMetrics(st,team),k1=scoutV6109Phase(m,team,st.key,'K1'),k2=scoutV6109Phase(m,team,st.key,'K2');
  const sgp=s.perfect-s.error,agp=a.perfect-a.error-a.blocked,dgp=d.positive-d.failed,egp=e.positive-e.failed;
  const gpCell=(v,w,l,metric)=>scoutV630Link(scoutV6109GpText(v,w,l),team,st.key,metric,scoutV6109GpClass(v));
  return `<tr class="${isTeam?'scout-v630-team-row':''}"><td>${scoutV630Name(st,isTeam)}</td>${scoutV6109FormationCells(m,team,st,isTeam)}<td class="scout-dv-main">${scoutV630Link(st.total||'—',team,st.key,'ALL')}</td><td class="scout-v630-divider scout-dv-good">${scoutV630Link(p.won||'—',team,st.key,'P_PTS','good')}</td><td>${scoutV630Link(p.bp||'—',team,st.key,'P_BP')}</td><td class="scout-v6109-gp ${scoutV6109GpClass(p.gp)}">${gpCell(p.gp,p.won,p.lost,'P_GP')}</td><td class="scout-v630-divider">${scoutV630Link(s.total||'—',team,st.key,'S_T')}</td><td class="scout-dv-bad">${scoutV630Link(s.total?s.error:'—',team,st.key,'S_ERR','bad')}</td><td class="scout-dv-good">${scoutV630Link(s.total?s.perfect:'—',team,st.key,'S_ACE','good')}</td><td class="scout-v6109-gp ${scoutV6109GpClass(sgp)}">${s.total?gpCell(sgp,s.perfect,s.error,'S_GP'):'—'}</td><td class="scout-v630-divider">${scoutV630Link(r.total||'—',team,st.key,'R_T')}</td><td class="scout-dv-bad">${scoutV630Link(r.total?r.error:'—',team,st.key,'R_ERR','bad')}</td><td class="scout-dv-good">${scoutV630Link(r.total?r.positive:'—',team,st.key,'R_POS','good')}</td><td>${scoutV630Link(r.total?r.perfect:'—',team,st.key,'R_PERF')}</td><td class="scout-v630-divider">${scoutV630Link(a.total||'—',team,st.key,'A_T')}</td><td class="scout-dv-bad">${scoutV630Link(a.total?a.error:'—',team,st.key,'A_ERR','bad')}</td><td class="scout-dv-bad">${scoutV630Link(a.total?a.blocked:'—',team,st.key,'A_BLK','bad')}</td><td class="scout-dv-good">${scoutV630Link(a.total?a.perfect:'—',team,st.key,'A_KILL','good')}</td><td class="scout-v6109-gp ${scoutV6109GpClass(agp)}">${a.total?gpCell(agp,a.perfect,a.error+a.blocked,'A_GP'):'—'}</td><td class="scout-v630-divider scout-dv-good">${scoutV630Link(b.total?b.perfect:'—',team,st.key,'B_PTS','good')}</td><td>${d.total?gpCell(dgp,d.positive,d.failed,'D_GP'):'—'}</td><td>${e.total?gpCell(egp,e.positive,e.failed,'E_GP'):'—'}</td><td class="scout-v630-divider scout-v630-k1 scout-v6109-gp ${scoutV6109GpClass(k1.gp)}">${k1.total?scoutV630Link(scoutV6109GpText(k1.gp,k1.won,k1.lost),team,st.key,'K1',scoutV6109GpClass(k1.gp)):'—'}</td><td class="scout-v630-k2 scout-v6109-gp ${scoutV6109GpClass(k2.gp)}">${k2.total?scoutV630Link(scoutV6109GpText(k2.gp,k2.won,k2.lost),team,st.key,'K2',scoutV6109GpClass(k2.gp)):'—'}</td><td><button class="ghost scout-dv-open" onclick="scoutOpenPlayerAnalysis('${team}','${encodeURIComponent(st.key)}')">Ficha</button></td></tr>`;
}
scoutV630Row=scoutV6109Row;
scoutV630RenderSummary=function(m,team,stats){const box=$('scout-v630-filter-summary');if(!box)return;const f=scoutV630Filters(),chips=[team==='ours'?'Nuestro equipo':'Rival'];if(f.set)chips.push('Set '+f.set);if(f.rotation)chips.push('R'+f.rotation);if(f.phase)chips.push(f.phase==='K1'?'K1 · Side-out':'K2 · Break');const seq=scoutV630FilteredSequences(m,team),w=scoutV6109WonBreakdown(m,team);box.innerHTML=`<b>Muestra actual</b>${chips.map(x=>`<span class="scout-v630-filter-chip">${esc(x)}</span>`).join('')}<span>${stats.rows.length} acciones · ${seq.length} rallies</span><div class="scout-v6109-points-strip"><span><b>Puntos ganados</b> ${w.total}</span><span>Saque <b>${w.serve}</b></span><span>Ataque <b>${w.attack}</b></span><span>Bloqueo <b>${w.block}</b></span><span>Error rival <b>${w.oppErr}</b></span><span>Rally G-P <b>${scoutV6109GpText(w.gp,w.total,w.lost)}</b></span></div><span class="scout-v630-sheet-note">G-P sigue la lógica Data Volley: ganados menos perdidos. Las tendencias tácticas mantienen porcentajes porque describen reparto de decisiones, no rendimiento.</span>`};
window.scoutRenderPlayerAnalytics=function(){const box=$('scout-analysis-players');if(!box)return;const m=scoutMatchForAnalysis(),team=$('scout-player-team-scope')?.value||'ours';if(!m){box.innerHTML='<div class="match-empty">Selecciona un scouting.</div>';return}scoutV630PopulateSetFilter(m);const data=scoutV630Stats(m,team);scoutV630RenderSummary(m,team,data);if(!data.players.length&&!data.rows.length){box.innerHTML='<div class="match-empty">No hay jugadores ni acciones registradas para este filtro.</div>';return}box.innerHTML=`<div class="scout-dv-table-wrap"><table class="scout-dv-table scout-v630-table"><thead><tr class="group"><th rowspan="2">Jugador</th><th colspan="5">FORMACIÓN INICIAL</th><th rowspan="2">ACC</th><th colspan="3">PUNTOS</th><th colspan="4" class="g-serve">SAQUE</th><th colspan="4" class="g-receive">RECEPCIÓN</th><th colspan="5" class="g-attack">ATAQUE</th><th colspan="1" class="g-other">BLOQUEO</th><th colspan="2" class="g-other">NUESTROS EXTRAS</th><th colspan="2" class="g-phase">FASES</th><th rowspan="2"></th></tr><tr class="cols"><th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th class="scout-v630-divider">TOT</th><th>BP</th><th>G-P</th><th class="scout-v630-divider">TOT</th><th>ERR</th><th>ACE</th><th>G-P</th><th class="scout-v630-divider">TOT</th><th>ERR</th><th>POS</th><th>EXC</th><th class="scout-v630-divider">TOT</th><th>ERR</th><th>BLO</th><th>PTS</th><th>G-P</th><th class="scout-v630-divider">PTS</th><th>DEF G-P</th><th>COL G-P</th><th class="scout-v630-divider">K1 G-P</th><th>K2 G-P</th></tr></thead><tbody>${scoutV630Row(m,team,data.teamStat,true)}${data.players.map(st=>scoutV630Row(m,team,st,false)).join('')}</tbody></table></div>`};
window.scoutV630OpenDrill=function(team,encodedKey,metric){const m=scoutMatchForAnalysis();if(!m)return;const key=decodeURIComponent(encodedKey),titleKey=key==='team'?(team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival'):(scoutV630Stats(m,team).players.find(x=>x.key===key)?.label||'Jugador'),label=scoutV630MetricLabel(metric);$('scout-v630-drill-title').textContent=`${titleKey} · ${label}`;const f=scoutV630Filters(),filterText=[f.set?'Set '+f.set:'Todos los sets',f.rotation?'R'+f.rotation:'Todas las rotaciones',f.phase||'K1 + K2'].join(' · ');$('scout-v630-drill-subtitle').textContent=`${m.date} · ${EQUIPOS[equipoActivo].nombre} vs ${m.opponent} · ${filterText}`;const body=$('scout-v630-drill-body'),kpis=$('scout-v630-drill-kpis');if(metric==='K1'||metric==='K2'){const seq=scoutV630SequenceMetricRows(m,team,key,metric),won=seq.filter(x=>x.win).length,lost=seq.length-won,gp=won-lost;kpis.innerHTML=`<div><span>Rallies</span><b>${seq.length}</b></div><div><span>Ganados</span><b>${won}</b></div><div><span>Perdidos</span><b>${lost}</b></div><div><span>G-P</span><b>${gp>0?'+':''}${gp}</b></div>`;body.innerHTML=seq.length?`<table class="scout-v630-drill-table"><thead><tr><th>Set</th><th>Rally</th><th>Rot.</th><th>Recepción</th><th>Distribución</th><th>Ataque</th><th>Resultado</th></tr></thead><tbody>${seq.map(x=>`<tr><td>${x.set}</td><td>${x.rally}</td><td>R${x.rotation}</td><td>${esc(x.receptionEval||'—')}</td><td>${esc(V620_COMBO_LABELS[x.target]||x.target||'—')}</td><td>${esc(x.attackEval||'—')}</td><td class="${x.win?'scout-v630-result-win':'scout-v630-result-loss'}">${x.win?'GANADO':'PERDIDO'}</td></tr>`).join('')}</tbody></table>`:'<div class="match-empty">No hay secuencias para esta cifra.</div>'}else{const rows=scoutV630ActionMetricRows(m,team,key,metric),good=rows.filter(a=>a.evaluation==='#'||a.evaluation==='+').length,bad=rows.filter(a=>['-','/','='].includes(a.evaluation)).length,gp=good-bad;kpis.innerHTML=`<div><span>Acciones</span><b>${rows.length}</b></div><div><span>Ganadas / positivas</span><b>${good}</b></div><div><span>Perdidas / negativas</span><b>${bad}</b></div><div><span>G-P técnico</span><b>${gp>0?'+':''}${gp}</b></div>`;body.innerHTML=rows.length?`<table class="scout-v630-drill-table"><thead><tr><th>Set</th><th>Rally</th><th>Marcador</th><th>Rot.</th><th>Fase</th><th>Jugador</th><th>Código</th><th>Eval.</th><th>Zonas</th><th>Detalle</th><th>Tiempo</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.set}</td><td>${a.rallyIndex}</td><td>${esc(a.scoreBefore)} → ${esc(a.scoreAfter)}</td><td>R${scoutV630RotationForAction(a,team)}</td><td>${scoutV630PhaseForAction(a,team)}</td><td>${esc(scoutActionPlayerLabel(a))}</td><td><code>${esc(a.code||'')}</code></td><td><b>${esc(a.evaluation)}</b></td><td>${esc(scoutV6108ZoneText(a))}</td><td>${esc(scoutAdvancedMetaText(a)||'—')}</td><td>${scoutFormatTime(a.scoutMs)}</td></tr>`).join('')}</tbody></table>`:'<div class="match-empty">No hay acciones para esta cifra.</div>'}$('scout-v630-drill-modal')?.classList.add('open')};
function scoutV6109CSVRow(m,team,st,isTeam=false){const s=scoutV6109Skill(st,'S'),r=scoutV6109Skill(st,'R'),a=scoutV6109Skill(st,'A'),b=scoutV6109Skill(st,'B'),d=scoutV6109Skill(st,'D'),e=scoutV6109Skill(st,'E'),p=scoutV6109PointMetrics(st,team),k1=scoutV6109Phase(m,team,st.key,'K1'),k2=scoutV6109Phase(m,team,st.key,'K2');const form=isTeam?['','','','','']:[1,2,3,4,5].map(n=>scoutV6109InitialPos(m,team,st,n));return [isTeam?'TOTAL EQUIPO':st.label,...form,st.total,p.won,p.bp,p.gp,s.total,s.error,s.perfect,s.perfect-s.error,r.total,r.error,r.positive,r.perfect,a.total,a.error,a.blocked,a.perfect,a.perfect-a.error-a.blocked,b.perfect,d.positive,d.failed,d.positive-d.failed,e.positive,e.failed,e.positive-e.failed,k1.won,k1.lost,k1.gp,k2.won,k2.lost,k2.gp]}
window.scoutExportStatsCSV=function(){const m=scoutMatchForAnalysis();if(!m){alert('No hay scouting seleccionado.');return}const team=$('scout-player-team-scope')?.value||'ours',data=scoutV630Stats(m,team),f=scoutV630Filters(),headers=['jugador','formacion_set1','formacion_set2','formacion_set3','formacion_set4','formacion_set5','acciones','puntos_total','puntos_bp','puntos_g_p','saque_total','saque_err','saque_ace','saque_g_p','recepcion_total','recepcion_err','recepcion_pos','recepcion_exc','ataque_total','ataque_err','ataque_bloqueado','ataque_puntos','ataque_g_p','bloqueo_puntos','defensa_ganadas','defensa_perdidas','defensa_g_p','colocacion_ganadas','colocacion_perdidas','colocacion_g_p','k1_ganados','k1_perdidos','k1_g_p','k2_ganados','k2_perdidos','k2_g_p'],rows=[scoutV6109CSVRow(m,team,data.teamStat,true),...data.players.map(st=>scoutV6109CSVRow(m,team,st))],meta=[['partido',`${EQUIPOS[equipoActivo].nombre} vs ${m.opponent}`],['fecha',m.date],['equipo_analizado',team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival'],['set',f.set||'todos'],['rotacion',f.rotation?`R${f.rotation}`:'todas'],['fase',f.phase||'K1+K2'],['criterio_g_p','Puntos directos ganados menos pérdidas directas. Saque: ACE-ERR. Ataque: PTS-ERR-BLO.'],[]],csv='\uFEFF'+[...meta,headers,...rows].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_estadistica_GP.csv`)};
window.scoutExportPDF=async function(id){const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}scoutExportNotice(true,'Preparando informe PDF…');try{const team='ours',data=scoutV6109FullStats(m,team),sets=scoutArr(m.sets),score=scoutSetsScore(m),w=scoutV6109WonBreakdownAll(m,team),seq=scoutSequenceSummary(m,team),dist=scoutDistributionRows(m,team,'');const report=document.createElement('div');report.style.cssText='position:fixed;left:-25000px;top:0;width:1500px;background:#fff;color:#17324d;padding:42px;font-family:Arial,Helvetica,sans-serif;z-index:-1';const rows=[data.teamStat,...data.players];report.innerHTML=`<div style="border-bottom:4px solid #102b43;padding-bottom:18px;margin-bottom:18px"><div style="font-size:11px;font-weight:900;letter-spacing:.14em;color:#718394">VOLLEY COACH · DATA SHEET G-P</div><h1 style="font-size:29px;margin:6px 0;color:#102b43">${esc(EQUIPOS[equipoActivo].nombre)} vs ${esc(m.opponent)}</h1><div style="color:#697b89;font-size:13px">${esc(m.date)}${m.competition?' · '+esc(m.competition):''} · Resultado ${score.us}–${score.opponent} sets</div></div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:18px"><div style="padding:10px;border:1px solid #dfe6eb"><small>PUNTOS GANADOS</small><b style="display:block;font-size:22px">${w.total}</b></div><div style="padding:10px;border:1px solid #dfe6eb"><small>SAQUE</small><b style="display:block;font-size:22px">${w.serve}</b></div><div style="padding:10px;border:1px solid #dfe6eb"><small>ATAQUE</small><b style="display:block;font-size:22px">${w.attack}</b></div><div style="padding:10px;border:1px solid #dfe6eb"><small>BLOQUEO</small><b style="display:block;font-size:22px">${w.block}</b></div><div style="padding:10px;border:1px solid #dfe6eb"><small>ERROR RIVAL</small><b style="display:block;font-size:22px">${w.oppErr}</b></div><div style="padding:10px;border:1px solid #dfe6eb"><small>RALLY G-P</small><b style="display:block;font-size:18px">${scoutV6109GpText(w.gp,w.total,w.lost)}</b></div></div><h2 style="font-size:17px;border-bottom:1px solid #dfe6eb;padding-bottom:7px">Estadística individual · conteos</h2><table class="scout-v6109-pdf-table"><thead><tr><th>Jugador</th><th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th>PTS</th><th>BP</th><th>G-P</th><th>SAQ T</th><th>ERR</th><th>ACE</th><th>REC T</th><th>ERR</th><th>POS</th><th>EXC</th><th>ATQ T</th><th>ERR</th><th>BLO</th><th>PTS</th><th>G-P</th><th>BLQ</th><th>DEF G-P</th><th>COL G-P</th><th>K1 G-P</th><th>K2 G-P</th></tr></thead><tbody>${rows.map((st,i)=>{const s=scoutV6109Skill(st,'S'),r=scoutV6109Skill(st,'R'),a=scoutV6109Skill(st,'A'),b=scoutV6109Skill(st,'B'),d=scoutV6109Skill(st,'D'),e=scoutV6109Skill(st,'E'),p=scoutV6109PointMetrics(st,team),k1=scoutV6109Phase(m,team,st.key,'K1'),k2=scoutV6109Phase(m,team,st.key,'K2'),form=i===0?['—','','','','']:[1,2,3,4,5].map(n=>scoutV6109InitialPos(m,team,st,n));return `<tr class="${i===0?'scout-v6109-pdf-team':''}"><td><b>${esc(i===0?'TOTAL EQUIPO':st.label)}</b></td>${form.map(x=>`<td>${esc(x||'')}</td>`).join('')}<td>${p.won}</td><td>${p.bp}</td><td>${p.gp>0?'+':''}${p.gp}</td><td>${s.total}</td><td>${s.error}</td><td>${s.perfect}</td><td>${r.total}</td><td>${r.error}</td><td>${r.positive}</td><td>${r.perfect}</td><td>${a.total}</td><td>${a.error}</td><td>${a.blocked}</td><td>${a.perfect}</td><td>${a.perfect-a.error-a.blocked}</td><td>${b.perfect}</td><td>${scoutV6109GpText(d.positive-d.failed,d.positive,d.failed)}</td><td>${scoutV6109GpText(e.positive-e.failed,e.positive,e.failed)}</td><td>${k1.total?scoutV6109GpText(k1.gp,k1.won,k1.lost):'—'}</td><td>${k2.total?scoutV6109GpText(k2.gp,k2.won,k2.lost):'—'}</td></tr>`}).join('')}</tbody></table><div style="font-size:9px;color:#718394;margin:9px 0 18px">G-P = puntos directos ganados − pérdidas directas. Formación inicial: 1–6 = posición inicial; * = participó sin estar en la formación inicial guardada.</div><h2 style="font-size:17px;border-bottom:1px solid #dfe6eb;padding-bottom:7px">Sets</h2><table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:18px"><tbody>${sets.map(s=>`<tr><td style="padding:6px;border-bottom:1px solid #edf0f2"><b>Set ${s.number}</b></td><td style="padding:6px;border-bottom:1px solid #edf0f2">${s.finished?(s.winner==='ours'?'Ganado':'Perdido'):'En curso'}</td><td style="padding:6px;border-bottom:1px solid #edf0f2;text-align:right"><b>${s.scoreUs}–${s.scoreOpponent}</b></td></tr>`).join('')}</tbody></table><h2 style="font-size:17px;border-bottom:1px solid #dfe6eb;padding-bottom:7px">K1 / K2 por conteos</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px"><div style="padding:11px;border:1px solid #dfe6eb"><small>K1 · SIDE-OUT</small><b style="display:block;font-size:19px">${scoutV6109GpText(seq.k1Won-(seq.k1.length-seq.k1Won),seq.k1Won,seq.k1.length-seq.k1Won)}</b></div><div style="padding:11px;border:1px solid #dfe6eb"><small>K2 · BREAK</small><b style="display:block;font-size:19px">${scoutV6109GpText(seq.k2Won-(seq.k2.length-seq.k2Won),seq.k2Won,seq.k2.length-seq.k2Won)}</b></div></div><h2 style="font-size:17px;border-bottom:1px solid #dfe6eb;padding-bottom:7px">Distribución del colocador · volumen</h2><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#f1f4f6"><th style="padding:7px;text-align:left">Destino</th><th>Total</th></tr></thead><tbody>${Object.entries(dist.reduce((o,x)=>{o[x.target]=(o[x.target]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td style="padding:7px;border-bottom:1px solid #e9edf0"><b>${esc(V620_COMBO_LABELS[k]||k)}</b></td><td style="text-align:center;border-bottom:1px solid #e9edf0">${v}</td></tr>`).join('')||'<tr><td colspan="2" style="padding:10px;color:#84919b">Sin distribución codificada.</td></tr>'}</tbody></table><div style="margin-top:24px;padding-top:10px;border-top:1px solid #dfe6eb;color:#84919b;font-size:9px">Generado por Volley Coach · V6.10.9 · Estadística principal por conteos G-P; las tendencias tácticas se conservan como análisis adicional.</div>`;document.body.appendChild(report);const canvas=await html2canvas(report,{scale:1.25,backgroundColor:'#ffffff',logging:false,useCORS:true});report.remove();const {jsPDF}=window.jspdf,pdf=new jsPDF('l','mm','a4'),margin=8,pageW=297-margin*2,pageH=210-margin*2,imgW=pageW,imgH=canvas.height*imgW/canvas.width,img=canvas.toDataURL('image/jpeg',.92);let y=margin,remaining=imgH;pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH;while(remaining>0){pdf.addPage();y=margin-(imgH-remaining);pdf.addImage(img,'JPEG',margin,y,imgW,imgH);remaining-=pageH}pdf.save(`${scoutSafeFilename(m.date+'_'+m.opponent)}_DataSheet_GP.pdf`)}catch(err){console.error(err);alert('No se ha podido generar el PDF.')}finally{scoutExportNotice(false)}};
// Postpartido: sustituir rendimiento porcentual por conteos G/P/G-P, manteniendo calidad como indicador propio.
window.scoutV6100OpenPostMatch=function(m=scoutActive()){
  if(!m||m.status!=='finished'||!m.finalizedByUser)return;
  const t=scoutV6100MatchTotals(m),q=scoutV690Quality(m),stats=scoutV6109FullStats(m,'ours'),pm=scoutV6109PointMetrics(stats.teamStat,'ours'),w=scoutV6109WonBreakdownAll(m,'ours');
  $('scout-v6100-post-title').textContent=`${m.opponent||'Rival'} · ${t.sets}`;$('scout-v6100-post-subtitle').textContent=`${EQUIPOS[equipoActivo]?.nombre||'Equipo'} · ${m.date||''}`;
  $('scout-v6100-post-kpis').innerHTML=[['Resultado',t.sets],['Rallies',t.rallies],['Acciones',t.actions],['Calidad',t.quality+'%'],['Puntos directos',pm.won],['G-P',`${pm.gp>0?'+':''}${pm.gp}`]].map(x=>`<div class="scout-v6100-post-kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  const topIssues={};q.issues.forEach(i=>topIssues[i.kind]=(topIssues[i.kind]||0)+1);const issueRows=Object.entries(topIssues).sort((a,b)=>b[1]-a[1]).slice(0,6);const rotations=[1,2,3,4,5,6].map(rot=>{const rr=scoutV690AllRallies(m).filter(x=>Number(x.r.rotationBefore)===rot),win=rr.filter(x=>x.r.winner==='ours').length,lost=rr.length-win;return {rot,n:rr.length,win,lost,gp:win-lost}}).filter(x=>x.n).sort((a,b)=>b.gp-a.gp||b.win-a.win);
  $('scout-v6100-post-body').innerHTML=`<section class="scout-v6100-post-panel"><h3>Lectura rápida</h3><div class="scout-v6100-post-list">${rotations.length?`<div><b>Mejor rotación:</b> R${rotations[0].rot} · G/P ${rotations[0].win}/${rotations[0].lost} · G-P ${rotations[0].gp>0?'+':''}${rotations[0].gp}</div><div><b>Rotación a revisar:</b> R${rotations[rotations.length-1].rot} · G/P ${rotations[rotations.length-1].win}/${rotations[rotations.length-1].lost} · G-P ${rotations[rotations.length-1].gp>0?'+':''}${rotations[rotations.length-1].gp}</div>`:'<div>Sin muestra de rotaciones.</div>'}<div><b>Puntos ganados:</b> saque ${w.serve} · ataque ${w.attack} · bloqueo ${w.block} · error rival ${w.oppErr}</div><div><b>Calidad del registro:</b> ${q.score}% · ${q.tactical}% con detalle táctico</div></div></section><section class="scout-v6100-post-panel"><h3>Incidencias pendientes</h3><div class="scout-v6100-post-list">${issueRows.length?issueRows.map(x=>`<div><b>${esc(x[0])}:</b> ${x[1]}</div>`).join(''):'<div>Sin incidencias básicas pendientes.</div>'}</div></section>`;
  $('scout-v6100-post-modal')?.classList.add('open');
};

function scoutV6109FullStats(m,team){
  const rows=scoutActionRows(m,true).filter(a=>a.team===team),players=scoutBuildPlayerStats(m,team),teamStat=scoutV630Aggregate(rows,team,'team',team==='ours'?EQUIPOS[equipoActivo].nombre:'Rival');return {rows,players,teamStat};
}
function scoutV6109WonBreakdownAll(m,team){
  const seq=scoutSequenceRows(m,team),won=seq.filter(x=>x.win);let serve=0,attack=0,block=0,oppErr=0;
  won.forEach(x=>{const mine=scoutArr(x.rallyData?.actions).filter(a=>a.team===team),lastPoint=[...mine].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));if(lastPoint?.skill==='S')serve++;else if(lastPoint?.skill==='A')attack++;else if(lastPoint?.skill==='B')block++;else oppErr++});return {total:won.length,serve,attack,block,oppErr,lost:seq.length-won.length,gp:won.length-(seq.length-won.length)};
}
// K1/K2 de rendimiento pasan a conteos G/P/G-P. La distribución táctica mantiene % porque expresa preferencia de destino.
const scoutV6109PerfBase=window.scoutRenderPerformanceAnalytics;
window.scoutRenderPerformanceAnalytics=function(){
  scoutV6109PerfBase();const m=scoutMatchForAnalysis(),seqBox=$('scout-analysis-sequences'),tacBox=$('scout-analysis-tactical-rotations');if(!m)return;const team=$('scout-sequence-team-scope')?.value||'ours',sum=scoutSequenceSummary(m,team),teamLabel=team==='ours'?'Nuestro equipo':'Rival';
  if(seqBox){const k1L=sum.k1.length-sum.k1Won,k2L=sum.k2.length-sum.k2Won;seqBox.innerHTML=`<div class="scout-sequence-kpis"><div><span>K1 · Side-out</span><b>${scoutV6109GpText(sum.k1Won-k1L,sum.k1Won,k1L)}</b><small>Ganados / perdidos</small></div><div><span>K2 · Break</span><b>${scoutV6109GpText(sum.k2Won-k2L,sum.k2Won,k2L)}</b><small>Ganados / perdidos</small></div><div><span>Secuencias</span><b>${sum.rows.length}</b><small>${teamLabel}</small></div></div><div class="scout-sequence-table"><div class="head"><b>Recepción</b><b>Ganados</b><b>Perdidos</b><b>G-P</b></div>${sum.byReception.map(x=>{const lost=x.total-x.won,gp=x.won-lost;return `<div><strong>${x.ev}</strong><span>${x.won}</span><span>${lost}</span><small class="${gp>0?'good':gp<0?'bad':''}">${gp>0?'+':''}${gp}</small></div>`}).join('')}</div>`}
  if(tacBox){const profiles=scoutTacticalRotationProfiles(m,team);tacBox.innerHTML=`<div class="scout-tactical-grid">${profiles.map(r=>{const k1L=r.k1Total-r.k1Won,k2L=r.k2Total-r.k2Won;return `<div class="scout-tactical-card"><div class="scout-tactical-head"><b>R${r.no}</b><span>${esc(r.setterLine)}</span></div><div class="scout-tactical-body"><p><span>Colocador</span><b>${r.setterPos?r.setterPos.toUpperCase():'—'}</b></p><p><span>Atacantes delanteros</span><b>${r.frontAttackers||'—'}</b></p><p><span>Destino más usado</span><b>${r.topTarget?esc(V620_COMBO_LABELS[r.topTarget]||r.topTarget):'—'}</b></p><p><span>K1 G-P</span><b>${r.k1Total?scoutV6109GpText(r.k1Won-k1L,r.k1Won,k1L):'—'}</b></p><p><span>K2 G-P</span><b>${r.k2Total?scoutV6109GpText(r.k2Won-k2L,r.k2Won,k2L):'—'}</b></p></div></div>`}).join('')}</div>`}
};
const scoutV6109HomeBase=window.scoutRenderHome;
window.scoutRenderHome=function(){scoutV6109HomeBase();const m=scoutActive()||scoutingMatches.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]||null;if(!m)return;const a=scoutAnalysis(m),sideLost=a.sideTotal-a.sideWon,breakLost=a.breakTotal-a.breakWon;if($('scout-home-sideout'))$('scout-home-sideout').textContent=a.sideTotal?scoutV6109GpText(a.sideWon-sideLost,a.sideWon,sideLost):'—';if($('scout-home-break'))$('scout-home-break').textContent=a.breakTotal?scoutV6109GpText(a.breakWon-breakLost,a.breakWon,breakLost):'—'};

scoutingMatches.forEach(m=>{m.dataVersion=V6109_VERSION});const v6109Active=scoutActive();if(v6109Active)v6109Active.dataVersion=V6109_VERSION;


/* ===== V7.0.1 · VIDEO SCOUTING / DATA VOLLEY STYLE =====
   Main table follows the official statistical-sheet logic where our data supports it.
   Volley Coach extras remain available in a second table / second PDF page.
*/
function scoutV61010Pct(n,d){n=Number(n)||0;d=Number(d)||0;return d?Math.round((n/d)*100):null}
/* V12.5 removed unreachable function: scoutV61010PctText */
function scoutV61010Gp(v){v=Number(v)||0;return `${v>0?'+':''}${v}`}
function scoutV61010Skill(st,skill){return scoutV6109Skill(st,skill)}
function scoutV61010TerminalLoss(a){return !!a&&((a.evaluation==='=')||(a.skill==='A'&&a.evaluation==='/'))}
function scoutV61010PointImpact(rows,team,key='team'){
  const all=scoutArr(rows).filter(a=>a&&a.team===team&&!a.live),scope=a=>key==='team'||scoutPlayerKey(a)===key,groups=new Map();
  all.forEach(a=>{const k=`${a.set}:${a.rallyIndex}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a)});
  const wonRows=[],lostRows=[];
  groups.forEach(g=>{
    g.sort((a,b)=>(Number(a.actionIndex)||0)-(Number(b.actionIndex)||0));
    const winner=g.find(a=>a.winner)?.winner||'';
    if(winner===team){
      /* Una hoja oficial solo puede atribuir un punto directo por rally. Si se
         codificaron varios #, usamos el último S/A/B como acción terminal. */
      const point=[...g].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));
      if(point&&scope(point))wonRows.push(point);
    }else if(winner&&winner!==team){
      const last=g[g.length-1];
      if(last&&scoutV61010TerminalLoss(last)&&scope(last))lostRows.push(last);
    }
  });
  const fp=wonRows.filter(a=>a.servingBefore===team).length;
  return {won:wonRows.length,lost:lostRows.length,fp,gp:wonRows.length-lostRows.length,wonRows,lostRows,impactRows:[...wonRows,...lostRows]};
}
function scoutV61010PointMetrics(m,team,key='team',rows=null){return scoutV61010PointImpact(rows||scoutV630FilteredActions(m,team),team,key)}
function scoutV61010Reception(st){const r=scoutV61010Skill(st,'R');return {...r,posPct:scoutV61010Pct(r.positive,r.total),excPct:scoutV61010Pct(r.perfect,r.total)}}
function scoutV61010Attack(st){const a=scoutV61010Skill(st,'A');return {...a,ptsPct:scoutV61010Pct(a.perfect,a.total),gp:a.perfect-a.error-a.blocked}}
function scoutV61010FullStats(m,team,includeLive=false){
  const rows=scoutActionRows(m,includeLive).filter(a=>a.team===team),catalog=(includeLive?scoutBuildPlayerStats(m,team):scoutActionRows(m,false).filter(a=>a.team===team).reduce((out,a)=>{const k=scoutPlayerKey(a);if(!out.some(x=>x.key===k))out.push({key:k,label:scoutActionPlayerLabel(a)});return out},[])),map=new Map(catalog.map(x=>[x.key,scoutV630EmptyStat(x.key,x.label,team)]));
  rows.forEach(a=>{const k=scoutPlayerKey(a);if(!map.has(k))map.set(k,scoutV630EmptyStat(k,scoutActionPlayerLabel(a),team));const st=map.get(k);st.total++;st.evals[a.evaluation]=(st.evals[a.evaluation]||0)+1;const sk=st.skills[a.skill]||(st.skills[a.skill]=scoutEmptySkillStat());sk.total++;sk.evals[a.evaluation]=(sk.evals[a.evaluation]||0)+1;st.actions.push(a)});
  const players=[...map.values()].sort((a,b)=>{const an=Number(String(a.label).match(/#(\d+)/)?.[1]||9999),bn=Number(String(b.label).match(/#(\d+)/)?.[1]||9999);return an-bn||String(a.label).localeCompare(String(b.label),'es')});
  return {rows,players,teamStat:scoutV630Aggregate(rows,team,'team',team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival'))};
}
function scoutV61010OfficialName(st,isTeam=false){if(isTeam)return `<b>TOTALES</b>`;const label=String(st.label||'Jugador'),num=label.match(/#(\d+)/)?.[1]||'',clean=label.replace(/^#\d+\s*·\s*/,'');return `<span style="font-weight:950">${num?esc(num)+' · ':''}${esc(clean||label)}</span>`}
function scoutV61010Formation(m,team,st,isTeam=false){if(isTeam)return '<td colspan="5" class="soft">—</td>';return [1,2,3,4,5].map(n=>`<td>${esc(scoutV6109InitialPos(m,team,st,n)||'')}</td>`).join('')}
function scoutV61010Link(value,team,key,metric,cls=''){return scoutV630Link(value,team,key,metric,cls)}
function scoutV61010OfficialRow(m,team,st,isTeam=false,rows=null){
  const s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),p=scoutV61010PointMetrics(m,team,st.key,rows),gpcls=p.gp>0?'pos':p.gp<0?'neg':'';
  return `<tr class="${isTeam?'team-total':''}"><td class="player">${scoutV61010OfficialName(st,isTeam)}</td>${scoutV61010Formation(m,team,st,isTeam)}<td>${scoutV61010Link(p.won||'—',team,st.key,'P_PTS')}</td><td>${scoutV61010Link(p.fp||'—',team,st.key,'P_BP')}</td><td class="gp ${gpcls}" title="Ganados ${p.won} · Perdidos ${p.lost}">${scoutV61010Link(scoutV61010Gp(p.gp),team,st.key,'P_GP',gpcls==='pos'?'good':gpcls==='neg'?'bad':'')}</td><td>${scoutV61010Link(s.total||'—',team,st.key,'S_T')}</td><td>${scoutV61010Link(s.total?s.error:'—',team,st.key,'S_ERR','bad')}</td><td>${scoutV61010Link(s.total?s.perfect:'—',team,st.key,'S_ACE','good')}</td><td>${scoutV61010Link(r.total||'—',team,st.key,'R_T')}</td><td>${scoutV61010Link(r.total?r.error:'—',team,st.key,'R_ERR','bad')}</td><td class="pct">${r.total?scoutV61010Link(`${r.posPct}%`,team,st.key,'R_POS','good'):'—'}</td><td class="pct">${r.total?`(${scoutV61010Link(`${r.excPct}%`,team,st.key,'R_PERF')})`:'—'}</td><td>${scoutV61010Link(a.total||'—',team,st.key,'A_T')}</td><td>${scoutV61010Link(a.total?a.error:'—',team,st.key,'A_ERR','bad')}</td><td>${scoutV61010Link(a.total?a.blocked:'—',team,st.key,'A_BLK','bad')}</td><td>${scoutV61010Link(a.total?a.perfect:'—',team,st.key,'A_KILL','good')}</td><td class="pct">${a.total?scoutV61010Link(`${a.ptsPct}%`,team,st.key,'A_KILL','good'):'—'}</td><td>${scoutV61010Link(b.total?b.perfect:'—',team,st.key,'B_PTS','good')}</td></tr>`;
}
function scoutV61010ExtraRow(m,team,st,isTeam=false,rows=null){
  const s=scoutV61010Skill(st,'S'),a=scoutV61010Attack(st),d=scoutV61010Skill(st,'D'),e=scoutV61010Skill(st,'E'),k1=scoutV6109Phase(m,team,st.key,'K1'),k2=scoutV6109Phase(m,team,st.key,'K2'),sgp=s.perfect-s.error,dgp=d.positive-d.failed,egp=e.positive-e.failed;
  return `<tr class="${isTeam?'team-total':''}"><td>${scoutV61010OfficialName(st,isTeam)}</td><td>${st.total||'—'}</td><td>${s.total?scoutV61010Gp(sgp):'—'}</td><td>${a.total?scoutV61010Gp(a.gp):'—'}</td><td>${d.total||'—'}</td><td>${d.total?d.positive:'—'}</td><td>${d.total?d.failed:'—'}</td><td>${d.total?scoutV61010Gp(dgp):'—'}</td><td>${e.total||'—'}</td><td>${e.total?e.positive:'—'}</td><td>${e.total?e.failed:'—'}</td><td>${e.total?scoutV61010Gp(egp):'—'}</td><td>${k1.total?`${k1.won}/${k1.lost}`:'—'}</td><td>${k1.total?scoutV61010Gp(k1.gp):'—'}</td><td>${k2.total?`${k2.won}/${k2.lost}`:'—'}</td><td>${k2.total?scoutV61010Gp(k2.gp):'—'}</td></tr>`;
}
function scoutV61010Rallies(m,team,applyFilters=false){
  const f=applyFilters?scoutV630Filters():{set:0,rotation:0,phase:''},out=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const rotation=team==='ours'?Number(r.rotationBefore||1):Number(r.opponentRotationBefore||1),phase=r.servingBefore===team?'K2':'K1';if(f.set&&Number(set.number)!==f.set)return;if(f.rotation&&rotation!==f.rotation)return;if(f.phase&&phase!==f.phase)return;out.push({set:Number(set.number),rallyIndex:ri+1,r,rotation,phase,win:r.winner===team})}));return out;
}
function scoutV61010Breakdown(rallies,team){let serve=0,attack=0,block=0,oppErr=0;rallies.filter(x=>x.r.winner===team).forEach(x=>{const mine=scoutArr(x.r.actions).filter(a=>a.team===team),last=[...mine].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));if(last?.skill==='S')serve++;else if(last?.skill==='A')attack++;else if(last?.skill==='B')block++;else oppErr++});return {serve,attack,block,oppErr,total:serve+attack+block+oppErr}}
function scoutV61010AttackMetrics(list){const a=scoutArr(list);const total=a.length,err=a.filter(x=>x.evaluation==='=').length,blq=a.filter(x=>x.evaluation==='/').length,pts=a.filter(x=>x.evaluation==='#').length;return {total,err,blq,pts,pct:scoutV61010Pct(pts,total)}}
function scoutV61010Performance(m,team,applyFilters=false){
  const rr=scoutV61010Rallies(m,team,applyFilters),pos=[],neg=[],counter=[],unknown=[];let receptionTotal=0,serveTotal=0,so=0,bp=0;
  rr.forEach(x=>{const acts=scoutArr(x.r.actions),ours=acts.map((a,i)=>({a,i})).filter(z=>z.a.team===team);if(x.phase==='K1')receptionTotal+=ours.filter(z=>z.a.skill==='R').length;if(x.phase==='K2')serveTotal+=ours.filter(z=>z.a.skill==='S').length;if(x.phase==='K1'&&x.win)so++;if(x.phase==='K2'&&x.win)bp++;
    const attacks=ours.filter(z=>z.a.skill==='A');if(!attacks.length)return;if(x.phase==='K2'){attacks.forEach(z=>counter.push(z.a));return}const rec=ours.find(z=>z.a.skill==='R');if(!rec){attacks.forEach(z=>unknown.push(z.a));return}const first=attacks.find(z=>z.i>rec.i);if(!first)return;if(['#','+'].includes(rec.a.evaluation))pos.push(first.a);else if(['!','-','/'].includes(rec.a.evaluation))neg.push(first.a);else unknown.push(first.a);attacks.filter(z=>z.i>first.i).forEach(z=>counter.push(z.a));
  });
  const rot=Array.from({length:6},(_,i)=>{const no=i+1,a=rr.filter(x=>x.rotation===no),w=a.filter(x=>x.win).length,l=a.length-w;return {no,total:a.length,won:w,lost:l,gp:w-l}});
  return {rallies:rr,receptionTotal,serveTotal,sideOut:so,breakPoint:bp,recPerPoint:so?receptionTotal/so:null,servePerPoint:bp?serveTotal/bp:null,positive:scoutV61010AttackMetrics(pos),negative:scoutV61010AttackMetrics(neg),counter:scoutV61010AttackMetrics(counter),unknown:scoutV61010AttackMetrics(unknown),rot};
}
function scoutV61010SetStat(m,team,setNo){
  const rows=scoutActionRows(m,false).filter(a=>a.team===team&&Number(a.set)===Number(setNo)),st=scoutV630Aggregate(rows,team,'team',team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival')),rallies=scoutV61010Rallies(m,team,false).filter(x=>x.set===Number(setNo)),bd=scoutV61010Breakdown(rallies,team),s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B');return {setNo,st,bd,s,r,a,b};
}
function scoutV61010SetSummaryHTML(m,team){const sets=scoutArr(m.sets).map(x=>scoutV61010SetStat(m,team,x.number));return `<div class="scout-v61010-section-title"><h4>Resumen por set</h4><span>Puntos ganados y porcentajes sobre intentos reales</span></div><div class="scout-v61010-official-wrap"><table class="scout-v61010-set-table"><thead><tr><th>Set</th><th>Saq Pts</th><th>Atq Pts</th><th>BLQ Pts</th><th>Err. adv.</th><th>SAQ Tot</th><th>Err</th><th>Pts</th><th>REC Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>ATQ Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>BLQ</th></tr></thead><tbody>${sets.map(x=>`<tr><td><b>${x.setNo}</b></td><td>${x.bd.serve||'—'}</td><td>${x.bd.attack||'—'}</td><td>${x.bd.block||'—'}</td><td>${x.bd.oppErr||'—'}</td><td>${x.s.total||'—'}</td><td>${x.s.total?x.s.error:'—'}</td><td>${x.s.total?x.s.perfect:'—'}</td><td>${x.r.total||'—'}</td><td>${x.r.total?x.r.error:'—'}</td><td>${x.r.total?x.r.posPct+'%':'—'}</td><td>${x.r.total?'('+x.r.excPct+'%)':'—'}</td><td>${x.a.total||'—'}</td><td>${x.a.total?x.a.error:'—'}</td><td>${x.a.total?x.a.blocked:'—'}</td><td>${x.a.total?x.a.perfect:'—'}</td><td>${x.a.total?x.a.ptsPct+'%':'—'}</td><td>${x.b.total?x.b.perfect:'—'}</td></tr>`).join('')}</tbody></table></div>`}
function scoutV61010AttackRow(label,x){return `<tr><td style="text-align:left"><b>${esc(label)}</b></td><td>${x.err}</td><td>${x.blq}</td><td>${x.pct==null?'—':x.pct+'%'}</td><td>${x.total}</td><td>${x.pts}</td></tr>`}
function scoutV61010PerformanceHTML(m,team){const p=scoutV61010Performance(m,team,true),nm=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival');return `<div class="scout-v61010-section-title"><h4>Cambio de saque / fase punto</h4><span>${esc(nm)}</span></div><div class="scout-v61010-performance"><div class="scout-v61010-perf-side"><h4>${esc(nm)}</h4><div class="scout-v61010-perf-kpi"><span>Recepciones</span><b>${p.receptionTotal}</b><span>Puntos SO</span><b>${p.sideOut}</b><span>Cada</span><b>${p.recPerPoint?p.recPerPoint.toFixed(2)+' rec. / punto':'—'}</b><span>Saques</span><b>${p.serveTotal}</b><span>Puntos FP</span><b>${p.breakPoint}</b><span>Cada</span><b>${p.servePerPoint?p.servePerPoint.toFixed(2)+' saq. / BP':'—'}</b></div><div class="scout-v61010-rot-diff">${p.rot.map(r=>`<span>R${r.no}<br><b>${r.total?scoutV61010Gp(r.gp):'—'}</b></span>`).join('')}</div></div><div class="scout-v61010-perf-center"><h4>Ataque por fase</h4><table class="scout-v61010-attack-split"><thead><tr><th>Situación</th><th>Err</th><th>Blq</th><th>Pts%</th><th>Tot</th><th>Pts</th></tr></thead><tbody>${scoutV61010AttackRow('1er ataque tras recepción positiva (+/#)',p.positive)}${scoutV61010AttackRow('1er ataque tras recepción negativa (!/-)',p.negative)}${scoutV61010AttackRow('Contraataque',p.counter)}</tbody></table>${p.unknown.total?`<div class="scout-v61010-formula">${p.unknown.total} ataques quedan sin clasificar por falta de recepción/fase suficiente; no se fuerzan como contraataque.</div>`:''}</div><div class="scout-v61010-perf-side"><h4>Lectura</h4><div class="scout-v61010-perf-kpi"><span>Side-out</span><b>${p.rallies.filter(x=>x.phase==='K1').length?scoutV61010Pct(p.sideOut,p.rallies.filter(x=>x.phase==='K1').length)+'%':'—'}</b><span>Break point</span><b>${p.rallies.filter(x=>x.phase==='K2').length?scoutV61010Pct(p.breakPoint,p.rallies.filter(x=>x.phase==='K2').length)+'%':'—'}</b><span>G-P rally</span><b>${scoutV61010Gp(p.rallies.filter(x=>x.win).length-p.rallies.filter(x=>!x.win).length)}</b></div></div></div>`}
function scoutV61010ExtrasHTML(m,team,data){return `<div class="scout-v61010-section-title"><h4>Volley Coach · métricas ampliadas</h4><span>No sustituyen la hoja oficial; añaden contexto técnico</span></div><div class="scout-v61010-official-wrap"><table class="scout-v61010-extra-table"><thead><tr><th>Jugador</th><th>ACC</th><th>SAQ G-P</th><th>ATQ G-P</th><th>DEF Tot</th><th>DEF +</th><th>DEF -</th><th>DEF G-P</th><th>COL Tot</th><th>COL +</th><th>COL -</th><th>COL G-P</th><th>K1 G/P</th><th>K1 G-P</th><th>K2 G/P</th><th>K2 G-P</th></tr></thead><tbody>${scoutV61010ExtraRow(m,team,data.teamStat,true,data.rows)}${data.players.map(st=>scoutV61010ExtraRow(m,team,st,false,data.rows)).join('')}</tbody></table></div>`}

// Main in-app individual sheet: official columns first, Volley Coach extras below.
function scoutV61010EnsureScope(){const sel=$('scout-player-team-scope');if(sel&&!sel.querySelector('option[value="both"]'))sel.insertAdjacentHTML('beforeend','<option value="both">Ambos equipos · hoja completa</option>')}
function scoutV61010TeamBlock(m,team,data){const name=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival');return `<div class="scout-v61010-section-title"><h4>${esc(name)} · estadística individual</h4><span>G-P individual visible en PUNTOS</span></div><div class="scout-v61010-official-wrap"><table class="scout-v61010-official"><thead><tr class="group"><th rowspan="2" class="player">Jugador</th><th colspan="5">FORMACIÓN INICIAL</th><th colspan="3">PUNTOS</th><th colspan="3">SAQUE</th><th colspan="4">RECEPCIÓN</th><th colspan="5">ATAQUE</th><th>BLOQUEO</th></tr><tr class="cols"><th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th><th>Tot</th><th>FP</th><th>G-P</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead><tbody>${data.players.map(st=>scoutV61010OfficialRow(m,team,st,false,data.rows)).join('')}${scoutV61010OfficialRow(m,team,data.teamStat,true,data.rows)}</tbody></table></div>${scoutV61010SetSummaryHTML(m,team)}${scoutV61010ExtrasHTML(m,team,data)}${scoutV61010PerformanceHTML(m,team)}`}
window.scoutRenderPlayerAnalytics=function(){
  const box=$('scout-analysis-players');if(!box)return;const m=scoutMatchForAnalysis();if(!m){box.innerHTML='<div class="match-empty">Selecciona un scouting.</div>';return}scoutV61010EnsureScope();const scope=$('scout-player-team-scope')?.value||'ours';scoutV630PopulateSetFilter(m);
  if(scope==='both'){
    const ours=scoutV630Stats(m,'ours'),opp=scoutV630Stats(m,'opponent'),summary=$('scout-v630-filter-summary'),f=scoutV630Filters();if(summary)summary.innerHTML=`<b>Hoja completa</b><span class="scout-v630-filter-chip">Ambos equipos</span>${f.set?`<span class="scout-v630-filter-chip">Set ${f.set}</span>`:''}${f.rotation?`<span class="scout-v630-filter-chip">R${f.rotation}</span>`:''}${f.phase?`<span class="scout-v630-filter-chip">${f.phase}</span>`:''}<span>${ours.rows.length+opp.rows.length} acciones filtradas</span>`;
    box.innerHTML=`${scoutV61010TeamBlock(m,'ours',ours)}${scoutV61010TeamBlock(m,'opponent',opp)}<div class="scout-v61010-formula"><b>Fórmulas:</b> Recepción Pos% = (# + +) / total · Exc% = # / total · Ataque Pts% = ataques # / total · G-P = puntos directos (# en saque/ataque/bloqueo) - errores terminales atribuidos (= y ataque bloqueado /). Los porcentajes se redondean al entero más próximo, como en la hoja de referencia.</div>`;return;
  }
  const team=scope,data=scoutV630Stats(m,team);scoutV630RenderSummary(m,team,data);if(!data.players.length&&!data.rows.length){box.innerHTML='<div class="match-empty">No hay jugadores ni acciones registradas para este filtro.</div>';return}box.innerHTML=`${scoutV61010TeamBlock(m,team,data)}<div class="scout-v61010-formula"><b>Fórmulas:</b> Recepción Pos% = (# + +) / total · Exc% = # / total · Ataque Pts% = ataques # / total · G-P = puntos directos (# en saque/ataque/bloqueo) - errores terminales atribuidos (= y ataque bloqueado /). Los porcentajes se redondean al entero más próximo, como en la hoja de referencia.</div>`;
};

// Correct metric labels and G-P drill-down so only terminal point losses are counted.
const scoutV61010MetricLabelBase=scoutV630MetricLabel;scoutV630MetricLabel=function(metric){return ({P_BP:'Puntos · FP (fase punto)',P_GP:'Puntos · G-P',R_POS:'Recepción · Pos%',R_PERF:'Recepción · Exc%',A_KILL:'Ataque · puntos / Pts%'})[metric]||scoutV61010MetricLabelBase(metric)};
const scoutV61010ActionRowsBase=scoutV630ActionMetricRows;scoutV630ActionMetricRows=function(m,team,key,metric){if(metric==='P_GP'){const rows=scoutV630FilteredActions(m,team),p=scoutV61010PointImpact(rows,team,key);return p.impactRows}return scoutV61010ActionRowsBase(m,team,key,metric)};

function scoutV61010CSVRow(m,team,st,isTeam=false,rows=null){const s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),d=scoutV61010Skill(st,'D'),e=scoutV61010Skill(st,'E'),p=scoutV61010PointMetrics(m,team,st.key,rows),k1=scoutV6109Phase(m,team,st.key,'K1'),k2=scoutV6109Phase(m,team,st.key,'K2'),form=isTeam?['','','','','']:[1,2,3,4,5].map(n=>scoutV6109InitialPos(m,team,st,n));return [isTeam?'TOTAL EQUIPO':st.label,...form,p.won,p.fp,p.gp,s.total,s.error,s.perfect,r.total,r.error,r.posPct??'',r.excPct??'',a.total,a.error,a.blocked,a.perfect,a.ptsPct??'',b.perfect,st.total,s.perfect-s.error,a.gp,d.total,d.positive,d.failed,d.positive-d.failed,e.total,e.positive,e.failed,e.positive-e.failed,k1.won,k1.lost,k1.gp,k2.won,k2.lost,k2.gp]}
window.scoutExportStatsCSV=function(){const m=scoutMatchForAnalysis();if(!m){alert('No hay scouting seleccionado.');return}const scope=$('scout-player-team-scope')?.value||'ours',f=scoutV630Filters(),headers=['equipo','jugador','formacion_set1','formacion_set2','formacion_set3','formacion_set4','formacion_set5','puntos_tot','puntos_fp','puntos_g_p','saque_tot','saque_err','saque_pts','recepcion_tot','recepcion_err','recepcion_pos_pct','recepcion_exc_pct','ataque_tot','ataque_err','ataque_blq','ataque_pts','ataque_pts_pct','bloqueo_pts','acciones','saque_g_p','ataque_g_p','defensa_tot','defensa_positivas','defensa_perdidas','defensa_g_p','colocacion_tot','colocacion_positivas','colocacion_perdidas','colocacion_g_p','k1_ganados','k1_perdidos','k1_g_p','k2_ganados','k2_perdidos','k2_g_p'],teams=scope==='both'?['ours','opponent']:[scope],blocks=[];teams.forEach(team=>{const data=scoutV630Stats(m,team),label=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival');blocks.push(headers);data.players.forEach(st=>blocks.push([label,...scoutV61010CSVRow(m,team,st,false,data.rows)]));blocks.push([label,...scoutV61010CSVRow(m,team,data.teamStat,true,data.rows)]);blocks.push([])});const meta=[['partido',`${EQUIPOS[equipoActivo].nombre} vs ${m.opponent}`],['fecha',m.date],['equipo_analizado',scope==='both'?'ambos':(scope==='ours'?EQUIPOS[equipoActivo].nombre:m.opponent)],['set',f.set||'todos'],['rotacion',f.rotation?`R${f.rotation}`:'todas'],['fase',f.phase||'K1+K2'],['formula_recepcion_pos_pct','(# + +) / total'],['formula_recepcion_exc_pct','# / total'],['formula_ataque_pts_pct','ataques # / total'],['formula_g_p','puntos directos menos errores terminales atribuidos'],[]],csv='\uFEFF'+[...meta,...blocks].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_estadistica_pro.csv`)};

function scoutV61010LinkedMatch(m){return scoutArr(partidosEquipo).find(x=>Number(x.id)===Number(m?.linkedMatchId))||null}
function scoutV61010SetDuration(s){const a=Date.parse(s?.startedAt||''),b=Date.parse(s?.endedAt||'');if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return '—';const min=Math.max(0,Math.round((b-a)/60000));return `${min} min`}
function scoutV61010PdfPlayerRows(m,team,data){return data.players.map(st=>{const s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),p=scoutV61010PointMetrics(m,team,st.key,data.rows),form=[1,2,3,4,5].map(n=>scoutV6109InitialPos(m,team,st,n));return `<tr><td class="nm">${scoutV61010OfficialName(st,false)}</td>${form.map(x=>`<td>${esc(x||'')}</td>`).join('')}<td>${p.won||'·'}</td><td>${p.fp||'·'}</td><td class="bold">${scoutV61010Gp(p.gp)}</td><td>${s.total||'·'}</td><td>${s.total?s.error||'·':'·'}</td><td>${s.total?s.perfect||'·':'·'}</td><td>${r.total||'·'}</td><td>${r.total?r.error||'·':'·'}</td><td>${r.total?r.posPct+'%':'·'}</td><td>${r.total?'('+r.excPct+'%)':'·'}</td><td>${a.total||'·'}</td><td>${a.total?a.error||'·':'·'}</td><td>${a.total?a.blocked||'·':'·'}</td><td>${a.total?a.perfect||'·':'·'}</td><td>${a.total?a.ptsPct+'%':'·'}</td><td>${b.total?b.perfect||'·':'·'}</td></tr>`}).join('')}
function scoutV61010PdfTotalRow(m,team,data){const st=data.teamStat,s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),p=scoutV61010PointMetrics(m,team,'team',data.rows);return `<tr class="total"><td class="nm"><b>Totales jugadores</b></td><td colspan="5"></td><td>${p.won}</td><td>${p.fp}</td><td>${scoutV61010Gp(p.gp)}</td><td>${s.total}</td><td>${s.error}</td><td>${s.perfect}</td><td>${r.total}</td><td>${r.error}</td><td>${r.total?r.posPct+'%':'·'}</td><td>${r.total?'('+r.excPct+'%)':'·'}</td><td>${a.total}</td><td>${a.error}</td><td>${a.blocked}</td><td>${a.perfect}</td><td>${a.total?a.ptsPct+'%':'·'}</td><td>${b.perfect}</td></tr>`}
function scoutV61010PdfSetRows(m,team){return scoutArr(m.sets).map(s=>{const x=scoutV61010SetStat(m,team,s.number);return `<tr><td><b>Set ${s.number}</b></td><td>${x.bd.serve||'·'}</td><td>${x.bd.attack||'·'}</td><td>${x.bd.block||'·'}</td><td>${x.bd.oppErr||'·'}</td><td>${x.s.total||'·'}</td><td>${x.s.total?x.s.error||'·':'·'}</td><td>${x.s.total?x.s.perfect||'·':'·'}</td><td>${x.r.total||'·'}</td><td>${x.r.total?x.r.error||'·':'·'}</td><td>${x.r.total?x.r.posPct+'%':'·'}</td><td>${x.r.total?'('+x.r.excPct+'%)':'·'}</td><td>${x.a.total||'·'}</td><td>${x.a.total?x.a.error||'·':'·'}</td><td>${x.a.total?x.a.blocked||'·':'·'}</td><td>${x.a.total?x.a.perfect||'·':'·'}</td><td>${x.a.total?x.a.ptsPct+'%':'·'}</td><td>${x.b.total?x.b.perfect||'·':'·'}</td></tr>`}).join('')}
function scoutV61010PdfTeam(name,m,team,data){return `<section class="team"><h2>${esc(name)}</h2><table class="main"><thead><tr class="grp"><th rowspan="2" class="nm"></th><th colspan="5">Set</th><th colspan="3">Puntos</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr><tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>Tot</th><th>FP</th><th>G-P</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead><tbody>${scoutV61010PdfPlayerRows(m,team,data)}${scoutV61010PdfTotalRow(m,team,data)}</tbody></table><table class="sets"><thead><tr><th></th><th colspan="4">Pts gan.</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr><tr><th></th><th>Saq</th><th>Att</th><th>BLQ</th><th>Er.Ad.</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead><tbody>${scoutV61010PdfSetRows(m,team)}</tbody></table></section>`}
function scoutV61010PdfPerfSide(m,team){const p=scoutV61010Performance(m,team,false),name=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival');return `<div class="pside"><b>${esc(name)}</b><div class="pk"><span>Recepción</span><strong>${p.receptionTotal}</strong><span>Puntos SO</span><strong>${p.sideOut}</strong><span>Cada</span><strong>${p.recPerPoint?p.recPerPoint.toFixed(2):'—'}</strong><span>Saque</span><strong>${p.serveTotal}</strong><span>Puntos FP</span><strong>${p.breakPoint}</strong><span>Cada</span><strong>${p.servePerPoint?p.servePerPoint.toFixed(2):'—'}</strong></div><div class="rds">${p.rot.map(r=>`<span>R${r.no}<b>${r.total?scoutV61010Gp(r.gp):'·'}</b></span>`).join('')}</div></div>`}
function scoutV61010PdfPerfCenter(m){const a=scoutV61010Performance(m,'ours',false),b=scoutV61010Performance(m,'opponent',false),row=(title,x,y)=>`<tr><td>${esc(title)}</td><td>${x.err}</td><td>${x.blq}</td><td>${x.pct==null?'·':x.pct+'%'}</td><td>${x.total}</td><td>${y.total}</td><td>${y.pct==null?'·':y.pct+'%'}</td><td>${y.blq}</td><td>${y.err}</td></tr>`;return `<div class="pcenter"><b>CAMBIO DE SAQUE / ATAQUE POR FASE</b><table><thead><tr><th>Situación</th><th>Err</th><th>Blq</th><th>Pts%</th><th>Tot</th><th>Tot</th><th>Pts%</th><th>Blq</th><th>Err</th></tr></thead><tbody>${row('1er ataque tras recepción positiva (+/#)',a.positive,b.positive)}${row('1er ataque tras recepción negativa (!/-)',a.negative,b.negative)}${row('Contraataque',a.counter,b.counter)}</tbody></table></div>`}
function scoutV61010PhaseAll(m,team,key,phase){const seq=scoutSequenceRows(m,team).filter(x=>x.phase===phase),rows=key==='team'?seq:seq.filter(x=>{const skill=phase==='K1'?'R':'S',a=x.actions.find(z=>z.skill===skill);return a&&scoutPlayerKey(a)===key}),won=rows.filter(x=>x.win).length,lost=rows.length-won;return {total:rows.length,won,lost,gp:won-lost}}
function scoutV61010PdfExtraRow(m,team,st){const s=scoutV61010Skill(st,'S'),a=scoutV61010Attack(st),d=scoutV61010Skill(st,'D'),e=scoutV61010Skill(st,'E'),k1=scoutV61010PhaseAll(m,team,st.key,'K1'),k2=scoutV61010PhaseAll(m,team,st.key,'K2');return `<tr><td>${scoutV61010OfficialName(st,false)}</td><td>${st.total||'·'}</td><td>${s.total?scoutV61010Gp(s.perfect-s.error):'·'}</td><td>${a.total?scoutV61010Gp(a.gp):'·'}</td><td>${d.total||'·'}</td><td>${d.total?d.positive:'·'}</td><td>${d.total?d.failed:'·'}</td><td>${d.total?scoutV61010Gp(d.positive-d.failed):'·'}</td><td>${e.total||'·'}</td><td>${e.total?e.positive:'·'}</td><td>${e.total?e.failed:'·'}</td><td>${e.total?scoutV61010Gp(e.positive-e.failed):'·'}</td><td>${k1.total?`${k1.won}/${k1.lost}`:'·'}</td><td>${k1.total?scoutV61010Gp(k1.gp):'·'}</td><td>${k2.total?`${k2.won}/${k2.lost}`:'·'}</td><td>${k2.total?scoutV61010Gp(k2.gp):'·'}</td></tr>`}
function scoutV61010PdfExtras(m,team,data){return `<h2>${esc(team==='ours'?EQUIPOS[equipoActivo].nombre:m.opponent)} · métricas ampliadas</h2><table class="extra"><thead><tr><th>Jugador</th><th>ACC</th><th>SAQ G-P</th><th>ATQ G-P</th><th>DEF T</th><th>DEF +</th><th>DEF -</th><th>DEF G-P</th><th>COL T</th><th>COL +</th><th>COL -</th><th>COL G-P</th><th>K1 G/P</th><th>K1 G-P</th><th>K2 G/P</th><th>K2 G-P</th></tr></thead><tbody>${data.players.map(st=>scoutV61010PdfExtraRow(m,team,st)).join('')}</tbody></table>`}
window.scoutExportPDF=async function(id){
  const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}scoutExportNotice(true,'Preparando hoja estadística profesional…');
  try{
    const ours=scoutV61010FullStats(m,'ours',false),opp=scoutV61010FullStats(m,'opponent',false),score=scoutSetsScore(m),linked=scoutV61010LinkedMatch(m),comp=linked?.competition||m.competition||'Partido',round=linked?.round||'',date=m.date||linked?.date||'',time=linked?.time||'',pavilion=linked?.pavilion||'',venue=linked?.venue||'',sets=scoutArr(m.sets),totalMin=sets.reduce((n,s)=>{const a=Date.parse(s.startedAt||''),b=Date.parse(s.endedAt||'');return n+(Number.isFinite(a)&&Number.isFinite(b)&&b>=a?Math.round((b-a)/60000):0)},0);
    const p1=document.createElement('div');p1.style.cssText='position:fixed;left:-30000px;top:0;width:1180px;background:#fff;color:#111;padding:24px 30px;font-family:Arial,Helvetica,sans-serif;z-index:-1';p1.innerHTML=`<style>.sheet{font-size:11px}.head{display:grid;grid-template-columns:1.1fr 1fr;gap:14px;margin-bottom:10px}.head h1{font-size:23px;margin:0 0 3px}.head .label{font-size:17px;font-weight:900;border-top:1px solid #555;padding-top:8px}.info,.score{border:1px solid #555;border-collapse:collapse;width:100%;font-size:10px}.info td,.score td,.score th{border:1px solid #777;padding:4px}.teamscore{font-size:18px;font-weight:900;border:1px solid #555;padding:7px 10px;margin-bottom:4px;display:flex;justify-content:space-between}.team{margin-top:8px;border:1px solid #666}.team h2{font-size:14px;margin:0;padding:5px 7px;background:#d9dcde}.main,.sets,.pcenter table,.extra{width:100%;border-collapse:collapse;font-size:8.2px}.main th,.main td,.sets th,.sets td,.pcenter th,.pcenter td,.extra th,.extra td{border:1px solid #c1c5c8;padding:3px;text-align:center}.main .nm,.main td.nm{text-align:left;min-width:170px}.main thead th,.sets thead th,.extra thead th{background:#eef0f1;font-weight:900}.main tr.total td{font-weight:950;background:#e5e7e8;border-top:2px solid #555}.sets{margin-top:3px}.perf{display:grid;grid-template-columns:210px 1fr 210px;gap:6px;margin-top:10px}.pside,.pcenter{border:1px solid #666;padding:6px}.pside>b,.pcenter>b{display:block;text-align:center;font-size:10px;margin-bottom:5px}.pk{display:grid;grid-template-columns:1fr auto;gap:2px 6px;font-size:8px}.rds{display:grid;grid-template-columns:repeat(2,1fr);gap:2px;margin-top:5px}.rds span{display:flex;justify-content:space-between;border:1px solid #ddd;padding:2px}.legend{margin-top:6px;border:1px solid #777;padding:5px;font-size:8px;display:flex;gap:12px;flex-wrap:wrap}.footer{font-size:7.5px;margin-top:6px;color:#555}</style><div class="sheet"><div class="head"><div><h1>${esc(comp)}</h1><div>${esc(round)}</div><div class="label">Informe</div><table class="info"><tr><td><b>Fecha</b></td><td>${esc(date||'—')}</td><td><b>Hora</b></td><td>${esc(time||'—')}</td></tr><tr><td><b>Pabellón</b></td><td>${esc(pavilion||'—')}</td><td><b>Condición</b></td><td>${esc(venue||'—')}</td></tr></table></div><div><div class="teamscore"><span>${esc(EQUIPOS[equipoActivo].nombre)}</span><b>${score.us}</b></div><div class="teamscore"><span>${esc(m.opponent)}</span><b>${score.opponent}</b></div><table class="score"><thead><tr><th>Set</th><th>Duración</th><th>Resultado</th></tr></thead><tbody>${sets.map(s=>`<tr><td>${s.number}</td><td>${scoutV61010SetDuration(s)}</td><td><b>${s.scoreUs} - ${s.scoreOpponent}</b></td></tr>`).join('')}<tr><td colspan="2"><b>Total</b></td><td>${totalMin?totalMin+' min':'—'}</td></tr></tbody></table></div></div>${scoutV61010PdfTeam(EQUIPOS[equipoActivo].nombre,m,'ours',ours)}${scoutV61010PdfTeam(m.opponent,m,'opponent',opp)}<div class="perf">${scoutV61010PdfPerfSide(m,'ours')}${scoutV61010PdfPerfCenter(m)}${scoutV61010PdfPerfSide(m,'opponent')}</div><div class="legend"><span><b>FP</b> Fase Punto / break point</span><span><b>G-P</b> Ganados - Perdidos</span><span><b>Pos%</b> Recepción positiva +/#</span><span><b>Exc%</b> Recepción perfecta #</span><span><b>Pts%</b> Ataques punto / ataques totales</span><span><b>*</b> Participó sin ser titular inicial registrado</span></div><div class="footer">Volley Coach · V7.0.1 · Hoja principal compatible con la lógica estadística de Data Volley en las métricas compartidas.</div></div>`;document.body.appendChild(p1);
    const p2=document.createElement('div');p2.style.cssText='position:fixed;left:-30000px;top:0;width:1180px;background:#fff;color:#17324d;padding:34px;font-family:Arial,Helvetica,sans-serif;z-index:-1';const po=scoutV61010Performance(m,'ours',false),pr=scoutV61010Performance(m,'opponent',false),seq=scoutSequenceSummary(m,'ours'),dist=scoutDistributionRows(m,'ours','');p2.innerHTML=`<style>.x h1{font-size:24px;margin:0 0 5px}.x h2{font-size:15px;border-bottom:2px solid #19344c;padding-bottom:5px;margin:18px 0 7px}.extra{width:100%;border-collapse:collapse;font-size:9px}.extra th,.extra td{padding:5px;border:1px solid #d9e0e5;text-align:center}.extra th{background:#edf2f5}.extra td:first-child,.extra th:first-child{text-align:left}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.card{border:1px solid #d8e0e5;padding:10px}.card span{font-size:8px;color:#6b7b86}.card b{display:block;font-size:18px}.dist{width:100%;border-collapse:collapse;font-size:9px}.dist td,.dist th{padding:5px;border-bottom:1px solid #dde3e7;text-align:left}</style><div class="x"><h1>Volley Coach · análisis ampliado</h1><div>${esc(EQUIPOS[equipoActivo].nombre)} vs ${esc(m.opponent)} · ${esc(date)}</div>${scoutV61010PdfExtras(m,'ours',ours)}${scoutV61010PdfExtras(m,'opponent',opp)}<h2>Fases del partido</h2><div class="cards"><div class="card"><span>K1 · Side-out</span><b>${seq.k1.length?`${seq.k1Won}/${seq.k1.length}`:'—'}</b><small>G-P ${seq.k1.length?scoutV61010Gp(seq.k1Won-(seq.k1.length-seq.k1Won)):'—'}</small></div><div class="card"><span>K2 · Break</span><b>${seq.k2.length?`${seq.k2Won}/${seq.k2.length}`:'—'}</b><small>G-P ${seq.k2.length?scoutV61010Gp(seq.k2Won-(seq.k2.length-seq.k2Won)):'—'}</small></div><div class="card"><span>Recepciones / SO</span><b>${po.receptionTotal}/${po.sideOut}</b><small>${po.recPerPoint?po.recPerPoint.toFixed(2)+' rec. por punto':'—'}</small></div><div class="card"><span>Saques / BP</span><b>${po.serveTotal}/${po.breakPoint}</b><small>${po.servePerPoint?po.servePerPoint.toFixed(2)+' saq. por BP':'—'}</small></div></div><h2>Distribución del colocador · nuestro equipo</h2><table class="dist"><thead><tr><th>Destino</th><th>Total</th><th>Uso</th></tr></thead><tbody>${Object.entries(dist.reduce((o,x)=>{o[x.target]=(o[x.target]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td><b>${esc(V620_COMBO_LABELS[k]||k)}</b></td><td>${v}</td><td>${dist.length?scoutV61010Pct(v,dist.length)+'%':'—'}</td></tr>`).join('')||'<tr><td colspan="3">Sin distribución codificada.</td></tr>'}</tbody></table><p style="font-size:9px;color:#70808c;margin-top:18px">Los porcentajes de tendencia se mantienen porque expresan frecuencia de elección; los resultados principales se presentan con Tot / FP / G-P y porcentajes de recepción/ataque calculados sobre intentos reales.</p></div>`;document.body.appendChild(p2);
    const render=async el=>{const c=await html2canvas(el,{scale:1.8,backgroundColor:'#fff',logging:false,useCORS:true});el.remove();return c},c1=await render(p1),c2=await render(p2),{jsPDF}=window.jspdf,pdf=new jsPDF('p','mm','a4');const add=(canvas,newPage)=>{if(newPage)pdf.addPage();const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),mrg=5,maxW=W-mrg*2,maxH=H-mrg*2,ratio=Math.min(maxW/canvas.width,maxH/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio,x=(W-w)/2,y=(H-h)/2;pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',x,y,w,h)};add(c1,false);add(c2,true);pdf.save(`${scoutSafeFilename(m.date+'_'+m.opponent)}_Hoja_Estadistica_Pro.pdf`);
  }catch(err){console.error(err);alert('No se ha podido generar el PDF.')}finally{scoutExportNotice(false)}
};

// Post-match uses the corrected G-P attribution as well.
window.scoutV6100OpenPostMatch=function(m=scoutActive()){
  if(!m||m.status!=='finished'||!m.finalizedByUser)return;const t=scoutV6100MatchTotals(m),q=scoutV690Quality(m),data=scoutV61010FullStats(m,'ours',false),pm=scoutV61010PointImpact(data.rows,'ours','team'),w=scoutV6109WonBreakdownAll(m,'ours');$('scout-v6100-post-title').textContent=`${m.opponent||'Rival'} · ${t.sets}`;$('scout-v6100-post-subtitle').textContent=`${EQUIPOS[equipoActivo]?.nombre||'Equipo'} · ${m.date||''}`;$('scout-v6100-post-kpis').innerHTML=[['Resultado',t.sets],['Rallies',t.rallies],['Acciones',t.actions],['Calidad',t.quality+'%'],['Puntos directos',pm.won],['G-P',scoutV61010Gp(pm.gp)]].map(x=>`<div class="scout-v6100-post-kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');const topIssues={};q.issues.forEach(i=>topIssues[i.kind]=(topIssues[i.kind]||0)+1);const issueRows=Object.entries(topIssues).sort((a,b)=>b[1]-a[1]).slice(0,6),perf=scoutV61010Performance(m,'ours',false),rotations=perf.rot.filter(x=>x.total).sort((a,b)=>b.gp-a.gp||b.won-a.won);$('scout-v6100-post-body').innerHTML=`<section class="scout-v6100-post-panel"><h3>Lectura rápida</h3><div class="scout-v6100-post-list">${rotations.length?`<div><b>Mejor rotación:</b> R${rotations[0].no} · G/P ${rotations[0].won}/${rotations[0].lost} · G-P ${scoutV61010Gp(rotations[0].gp)}</div><div><b>Rotación a revisar:</b> R${rotations[rotations.length-1].no} · G/P ${rotations[rotations.length-1].won}/${rotations[rotations.length-1].lost} · G-P ${scoutV61010Gp(rotations[rotations.length-1].gp)}</div>`:'<div>Sin muestra de rotaciones.</div>'}<div><b>Puntos ganados:</b> saque ${w.serve} · ataque ${w.attack} · bloqueo ${w.block} · error rival ${w.oppErr}</div><div><b>Recepción:</b> ${scoutV61010Reception(data.teamStat).total?scoutV61010Reception(data.teamStat).posPct+'% positiva · '+scoutV61010Reception(data.teamStat).excPct+'% excelente':'sin muestra'}</div><div><b>Ataque:</b> ${scoutV61010Attack(data.teamStat).total?scoutV61010Attack(data.teamStat).ptsPct+'% puntos':'sin muestra'}</div></div></section><section class="scout-v6100-post-panel"><h3>Incidencias pendientes</h3><div class="scout-v6100-post-list">${issueRows.length?issueRows.map(x=>`<div><b>${esc(x[0])}:</b> ${x[1]}</div>`).join(''):'<div>Sin incidencias básicas pendientes.</div>'}</div></section>`;$('scout-v6100-post-modal')?.classList.add('open')
};

// Keep saved matches tagged with the new statistics schema.
scoutingMatches.forEach(m=>{m.dataVersion='7.0.1'});const v61010Active=scoutActive();if(v61010Active)v61010Active.dataVersion='7.0.0';

/* ===== V7.0.1 · VIDEO SCOUTING ENGINE ===== */
(()=>{
'use strict';
const V700_VERSION='7.0.1';
let v700ObjectUrl=null,v700FileMatchId=null,v700StopAt=null,v700SelectedKey='';
const v700$=id=>document.getElementById(id);
const v700Num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const v700Clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function v700Video(){return v700$('scout-v700-player')}
function v700Match(){const id=Number(v700$('scout-v700-match')?.value)||0;return scoutingMatches.find(m=>Number(m.id)===id)||null}
function v700Meta(m){if(!m)return null;const raw=m.video&&typeof m.video==='object'?m.video:{};m.video={syncOffset:raw.syncOffset==null?null:Number(raw.syncOffset),source:String(raw.source||''),fileSize:Math.max(0,Number(raw.fileSize)||0),lastModified:Math.max(0,Number(raw.lastModified)||0),mimeType:String(raw.mimeType||''),duration:raw.duration==null?null:Number(raw.duration),syncedAt:raw.syncedAt?String(raw.syncedAt):null,anchor:raw.anchor&&typeof raw.anchor==='object'?raw.anchor:null,preRoll:Math.max(0,Number(raw.preRoll ?? 2)),postRoll:Math.max(0,Number(raw.postRoll ?? 2)),clips:scoutArr(raw.clips)};return m.video}
function v700Persist(){try{scoutSave(false)}catch(err){console.error('V7 video persist',err)}}
function v700Fmt(sec){if(sec==null||!Number.isFinite(Number(sec)))return '—';sec=Math.max(0,Number(sec));const m=Math.floor(sec/60),s=sec-m*60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`}
/* V12.5 removed unreachable function: v700FileSize */
function v700Mapped(m,ms){const meta=v700Meta(m);if(meta?.syncOffset==null)return null;return Math.max(0,(Number(ms)||0)/1000+Number(meta.syncOffset))}
function v700RallyStartMs(r){const a=scoutArr(r?.actions);return a.length?(Number(a[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0)}
function v700RallyEndMs(r){const a=scoutArr(r?.actions);return a.length?(Number(a[a.length-1].scoutMs)||Number(r?.scoutEndMs)||v700RallyStartMs(r)):(Number(r?.scoutEndMs)||v700RallyStartMs(r))}
function v700ApplyMapping(m){const meta=v700Meta(m);if(!m||meta.syncOffset==null)return;scoutArr(m.sets).forEach(set=>scoutArr(set.rallies).forEach(r=>{r.videoStart=v700Mapped(m,v700RallyStartMs(r));r.videoEnd=v700Mapped(m,v700RallyEndMs(r));scoutArr(r.actions).forEach(a=>{a.videoAction=v700Mapped(m,a.scoutMs);a.videoStart=a.videoAction==null?null:Math.max(0,a.videoAction-meta.preRoll);a.videoEnd=a.videoAction==null?null:a.videoAction+meta.postRoll})}));scoutArr(m.liveRally?.actions).forEach(a=>{a.videoAction=v700Mapped(m,a.scoutMs);a.videoStart=a.videoAction==null?null:Math.max(0,a.videoAction-meta.preRoll);a.videoEnd=a.videoAction==null?null:a.videoAction+meta.postRoll});scoutArr(m.workflow?.events).forEach(e=>{if(e.videoTime==null)e.videoTime=v700Mapped(m,e.scoutMs)});scoutArr(m.events).forEach(e=>e.videoTime=v700Mapped(m,e.scoutMs))}
function v700FindRaw(type,id,setNo,actionId){const m=v700Match();if(!m)return null;if(type==='rally'){const s=scoutArr(m.sets).find(x=>Number(x.number)===Number(setNo));const r=scoutArr(s?.rallies).find(x=>Number(x.id)===Number(id));return r?{type,ms:v700RallyStartMs(r),set:s.number,id:r.id,r}:null}if(type==='action'){const s=scoutArr(m.sets).find(x=>Number(x.number)===Number(setNo));let r=scoutArr(s?.rallies).find(x=>Number(x.id)===Number(id)),live=false;if(!r&&Number(m.liveRally?.id)===Number(id)){r=m.liveRally;live=true}const a=scoutArr(r?.actions).find(x=>Number(x.id)===Number(actionId));return a?{type,ms:a.scoutMs,set:s?.number||m.currentSet,id:r.id,actionId:a.id,r,a,live}:null}if(type==='event'){const e=[...scoutArr(m.workflow?.events),...scoutArr(m.events)].find(x=>String(x.uid||x.id)===String(id));return e?{type,ms:e.scoutMs,set:e.setNumber,id:String(e.uid||e.id),e}:null}return null}
function v700Timeline(m){const out=[];scoutArr(m?.sets).forEach(set=>scoutArr(set.rallies).forEach((r,ri)=>{const key=`r:${set.number}:${r.id}`;out.push({key,type:'rally',ms:v700RallyStartMs(r),set:set.number,rallyId:r.id,label:`Set ${set.number} · Rally ${ri+1} · ${r.scoreAfter.us}–${r.scoreAfter.opponent}`,copy:`R${r.rotationBefore} vs R${r.opponentRotationBefore||1} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${r.actions.length} acciones`,team:r.winner});scoutArr(r.actions).forEach((a,ai)=>out.push({key:`a:${set.number}:${r.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:set.number,rallyId:r.id,actionId:a.id,skill:a.skill,team:a.team,label:`${a.code||SCOUT_SKILLS[a.skill]||'Acción'}`,copy:`S${set.number} · Rally ${ri+1} · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${scoutActionPlayerLabel(a)}`,evaluation:a.evaluation}))}));const liveSet=scoutSet(m),liveIndex=(scoutArr(liveSet?.rallies).length||0)+1;scoutArr(m?.liveRally?.actions).forEach(a=>out.push({key:`a:${m.currentSet}:${m.liveRally.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:m.currentSet,rallyId:m.liveRally.id,actionId:a.id,skill:a.skill,team:a.team,label:`${a.code||SCOUT_SKILLS[a.skill]||'Acción'}`,copy:`S${m.currentSet} · Rally ${liveIndex} en curso · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${scoutActionPlayerLabel(a)}`,evaluation:a.evaluation,live:true}));scoutArr(m?.workflow?.events).forEach(e=>out.push({key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:e.setNumber,id:String(e.uid||e.id),label:typeof V690_EVENT_LABELS!=='undefined'?(V690_EVENT_LABELS[e.type]||e.type):e.type,copy:`S${e.setNumber} · ${e.scoreUs}–${e.scoreOpponent}${e.note?' · '+e.note:''}`}));scoutArr(m?.events).forEach(e=>out.push({key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:e.setNumber,id:String(e.uid||e.id),label:e.type==='libero_auto'?'Líbero automático':'Cambio',copy:`S${e.setNumber} · ${e.scoreUs}–${e.scoreOpponent} · ${e.outLabel||'—'} → ${e.inLabel||'—'}`}));return out.sort((a,b)=>a.ms-b.ms||String(a.key).localeCompare(String(b.key)))}
function v700ParseKey(key){const p=String(key||'').split(':');if(p[0]==='r')return v700FindRaw('rally',Number(p[2]),Number(p[1]));if(p[0]==='a')return v700FindRaw('action',Number(p[2]),Number(p[1]),Number(p[3]));if(p[0]==='e')return v700FindRaw('event',p.slice(1).join(':'));return null}
function v700ItemMapped(m,item){if(!item)return null;return v700Mapped(m,item.ms)}
function v700SetCurrent(label,time){if(v700$('scout-v700-current-label'))v700$('scout-v700-current-label').textContent=label||'Sin segmento seleccionado';if(v700$('scout-v700-current-time'))v700$('scout-v700-current-time').textContent=v700Fmt(time)}
function v700ReleaseUrl(){if(v700ObjectUrl){try{URL.revokeObjectURL(v700ObjectUrl)}catch(_){ }v700ObjectUrl=null}v700FileMatchId=null;const v=v700Video();if(v){v.pause();v.removeAttribute('src');v.load()}v700StopAt=null}
function v700PopulateMatches(preferred){const sel=v700$('scout-v700-match');if(!sel)return;const sorted=scoutArr(scoutingMatches).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.id)-Number(a.id));sel.innerHTML=sorted.length?sorted.map(m=>`<option value="${m.id}">${esc(m.date||'')} · ${esc(EQUIPOS[equipoActivo]?.nombre||'Equipo')} vs ${esc(m.opponent||'Rival')}</option>`).join(''):'<option value="">Sin scoutings</option>';const id=Number(preferred)||Number(scoutingActiveId)||Number(v700$('scout-analysis-match')?.value)||Number(sorted[0]?.id)||0;if(id&&sorted.some(m=>Number(m.id)===id))sel.value=String(id)}
function v700RenderMeta(){const m=v700Match(),meta=v700Meta(m),v=v700Video();if(!m){['scout-v700-meta-file','scout-v700-meta-duration','scout-v700-meta-sync','scout-v700-meta-rallies'].forEach(id=>{if(v700$(id))v700$(id).textContent='—'});return}const attached=Number(v700FileMatchId)===Number(m.id)&&v?.src;v700$('scout-v700-meta-file').textContent=attached?(meta.source||'Vídeo local'):(meta.source?`${meta.source} · volver a seleccionar`:'—');v700$('scout-v700-meta-file').title=meta.source||'';v700$('scout-v700-meta-duration').textContent=v700Fmt(attached&&Number.isFinite(v.duration)?v.duration:meta.duration);v700$('scout-v700-meta-sync').textContent=meta.syncOffset==null?'Sin sincronizar':`${meta.syncOffset>=0?'+':''}${Number(meta.syncOffset).toFixed(2)} s`;const rallies=scoutArr(m.sets).reduce((n,s)=>n+scoutArr(s.rallies).filter(r=>r.videoStart!=null||meta.syncOffset!=null).length,0);v700$('scout-v700-meta-rallies').textContent=String(rallies);const st=v700$('scout-v700-sync-state');if(st){st.textContent=meta.syncOffset==null?'SIN SINCRONIZAR':'SINCRONIZADO';st.classList.toggle('ok',meta.syncOffset!=null)}if(v700$('scout-v700-preroll'))v700$('scout-v700-preroll').value=String(meta.preRoll);if(v700$('scout-v700-postroll'))v700$('scout-v700-postroll').value=String(meta.postRoll);v700$('scout-v700-video-empty')?.classList.toggle('scout-v700-hidden',!!attached)}
window.scoutV700RenderTimeline=function(){const box=v700$('scout-v700-timeline'),m=v700Match();if(!box)return;if(!m){box.innerHTML='<div class="match-empty">No hay scouting seleccionado.</div>';return}const kind=v700$('scout-v700-kind')?.value||'all',skill=v700$('scout-v700-skill')?.value||'',q=String(v700$('scout-v700-search')?.value||'').trim().toLowerCase(),meta=v700Meta(m);let rows=v700Timeline(m).filter(x=>(kind==='all'||x.type===kind)&&(!skill||(x.type==='action'&&x.skill===skill)));if(q)rows=rows.filter(x=>`${x.label} ${x.copy} ${x.set}`.toLowerCase().includes(q));box.innerHTML=rows.length?rows.map(x=>{const mapped=v700ItemMapped(m,x),canPlay=mapped!=null;return `<div class="scout-v700-item ${x.key===v700SelectedKey?'active':''}" data-key="${esc(x.key)}"><div class="time">${canPlay?v700Fmt(mapped):scoutV6100FmtMs(x.ms)}</div><div><span class="scout-v700-pill ${x.team==='ours'?'ours':x.team==='opponent'?'opponent':''}">${x.type==='rally'?'RALLY':x.type==='action'?(SCOUT_SKILLS[x.skill]||x.skill):'EVENTO'}</span><strong>${esc(x.label)}</strong><small>${esc(x.copy||'')}</small></div><div class="actions"><button class="ghost" onclick="scoutV700SyncKey('${esc(x.key)}')">Sincronizar aquí</button><button class="${canPlay?'primary':'ghost'}" ${canPlay?'':'disabled'} onclick="scoutV700PlayKey('${esc(x.key)}')">▶</button></div></div>`}).join(''):'<div class="match-empty">No hay elementos para estos filtros.</div>';v700RenderMeta()};
function v700Render(){const m=v700Match();v700RenderMeta();scoutV700RenderTimeline();if(v700$('scout-v700-subtitle'))v700$('scout-v700-subtitle').textContent=m?`${m.date||''} · ${EQUIPOS[equipoActivo]?.nombre||'Equipo'} vs ${m.opponent||'Rival'}`:'Carga o selecciona un scouting para empezar.'}
window.scoutV700OpenVideo=function(context=''){let id=Number(scoutingActiveId)||0;if(context==='analysis')id=Number(v700$('scout-analysis-match')?.value)||id;v700PopulateMatches(id);v700$('scout-v700-video-modal')?.classList.add('open');v700Render()};
window.scoutV700CloseVideo=function(){v700$('scout-v700-video-modal')?.classList.remove('open');v700StopAt=null;const v=v700Video();if(v&&!v.paused)v.pause()};
window.scoutV700MatchChanged=function(){const active=typeof window.scoutV6103HasPendingSession==='function'&&window.scoutV6103HasPendingSession();if(active&&Number(v700$('scout-v700-match')?.value)!==Number(scoutingActiveId)){alert('Hay un scouting en directo. El vídeo debe permanecer vinculado al partido activo hasta que guardes o finalices la sesión.');v700$('scout-v700-match').value=String(scoutingActiveId);return}if(Number(v700FileMatchId)!==Number(v700$('scout-v700-match')?.value))v700ReleaseUrl();v700SelectedKey='';v700Render()};
window.scoutV700LoadFile=function(ev){const file=ev?.target?.files?.[0];const m=v700Match();if(!file||!m)return;if(!String(file.type||'').startsWith('video/')&&!/\.(mp4|mov|m4v|webm|ogv|avi)$/i.test(file.name)){alert('Selecciona un archivo de vídeo.');return}const meta=v700Meta(m),different=!!meta.source&&(meta.source!==file.name||(meta.fileSize&&Number(meta.fileSize)!==Number(file.size))||(meta.lastModified&&Number(meta.lastModified)!==Number(file.lastModified)));if(different&&meta.syncOffset!=null){if(!confirm(`Este scouting estaba sincronizado con “${meta.source}”. El archivo seleccionado es diferente. ¿Reemplazarlo y borrar la sincronización anterior?`)){if(ev?.target)ev.target.value='';return}meta.syncOffset=null;meta.syncedAt=null;meta.anchor=null;scoutArr(m.sets).forEach(s=>scoutArr(s.rallies).forEach(r=>{r.videoStart=null;r.videoEnd=null;scoutArr(r.actions).forEach(a=>{a.videoStart=null;a.videoAction=null;a.videoEnd=null})}));scoutArr(m.workflow?.events).forEach(e=>e.videoTime=null);scoutArr(m.events).forEach(e=>e.videoTime=null)}v700ReleaseUrl();const v=v700Video();v700ObjectUrl=URL.createObjectURL(file);v700FileMatchId=m.id;meta.source=file.name;meta.fileSize=file.size||0;meta.lastModified=file.lastModified||0;meta.mimeType=file.type||'';v.src=v700ObjectUrl;v.load();v.onloadedmetadata=()=>{meta.duration=Number.isFinite(v.duration)?v.duration:null;v700Persist();v700Render();};v.onerror=()=>alert('El navegador no ha podido reproducir este formato de vídeo. Prueba con MP4/H.264 o WebM.');v700Persist();v700Render()};
window.scoutV700DetachFile=function(){v700ReleaseUrl();if(v700$('scout-v700-file'))v700$('scout-v700-file').value='';v700Render()};
window.scoutV700RangeChanged=function(){const m=v700Match(),meta=v700Meta(m);if(!meta)return;meta.preRoll=v700Clamp(v700Num(v700$('scout-v700-preroll')?.value,2),0,15);meta.postRoll=v700Clamp(v700Num(v700$('scout-v700-postroll')?.value,2),0,15);if(meta.syncOffset!=null)v700ApplyMapping(m);v700Persist();v700RenderMeta()};
window.scoutV700SyncKey=function(key){const m=v700Match(),v=v700Video(),item=v700ParseKey(key);if(!m||!item)return;if(!v?.src||Number(v700FileMatchId)!==Number(m.id)){alert('Carga primero el archivo de vídeo de este partido.');return}const meta=v700Meta(m);meta.syncOffset=Number(v.currentTime)-(Number(item.ms)||0)/1000;meta.syncedAt=new Date().toISOString();meta.anchor={key,type:item.type,set:item.set||null,scoutMs:Number(item.ms)||0,videoTime:Number(v.currentTime)};v700ApplyMapping(m);v700SelectedKey=key;v700Persist();v700Render();v700SetCurrent('Ancla sincronizada',v.currentTime)};
window.scoutV700Nudge=function(delta){const m=v700Match(),meta=v700Meta(m);if(!m||meta.syncOffset==null){alert('Sincroniza primero el vídeo con un rally o una acción.');return}meta.syncOffset=Number(meta.syncOffset)+Number(delta||0);v700ApplyMapping(m);v700Persist();v700Render()};
window.scoutV700ClearSync=function(){const m=v700Match(),meta=v700Meta(m);if(!m)return;if(!confirm('¿Quitar la sincronización de vídeo de este scouting? El archivo asociado se conservará como referencia.'))return;meta.syncOffset=null;meta.syncedAt=null;meta.anchor=null;scoutArr(m.sets).forEach(s=>scoutArr(s.rallies).forEach(r=>{r.videoStart=null;r.videoEnd=null;scoutArr(r.actions).forEach(a=>{a.videoStart=null;a.videoAction=null;a.videoEnd=null})}));scoutArr(m.workflow?.events).forEach(e=>e.videoTime=null);scoutArr(m.events).forEach(e=>e.videoTime=null);v700Persist();v700Render()};
window.scoutV700PlayKey=function(key){const m=v700Match(),meta=v700Meta(m),v=v700Video(),item=v700ParseKey(key);if(!m||!item)return;if(!v?.src||Number(v700FileMatchId)!==Number(m.id)){alert(meta?.source?`Este scouting está vinculado a “${meta.source}”. Vuelve a seleccionar ese archivo de vídeo para reproducirlo.`:'Carga primero el vídeo del partido.');return}if(meta.syncOffset==null){alert('Sincroniza primero el vídeo usando “Sincronizar aquí”.');return}v700SelectedKey=key;let start=v700Mapped(m,item.ms),end=start+meta.postRoll;if(item.type==='rally'&&item.r){const rs=v700Mapped(m,v700RallyStartMs(item.r)),re=v700Mapped(m,v700RallyEndMs(item.r));start=Math.max(0,(rs??start)-meta.preRoll);end=(re??start)+meta.postRoll}else{start=Math.max(0,start-meta.preRoll);end=start+meta.preRoll+meta.postRoll}if(Number.isFinite(v.duration))end=Math.min(end,v.duration);v.currentTime=Math.max(0,start);v700StopAt=end;const label=item.type==='rally'?`Set ${item.set} · Rally ${scoutArr(scoutArr(m.sets).find(s=>Number(s.number)===Number(item.set))?.rallies).findIndex(r=>Number(r.id)===Number(item.id))+1}`:item.type==='action'?(item.a?.code||'Acción'):'Evento';v700SetCurrent(label,start);v.play().catch(()=>{});scoutV700RenderTimeline()};
window.scoutV700PlayRally=function(setNo,rallyId){const m=v700Match()||scoutActive();if(!m)return;if(v700$('scout-v700-match'))v700$('scout-v700-match').value=String(m.id);window.scoutV700PlayKey(`r:${setNo}:${rallyId}`)};
function v700OnTimeUpdate(){const v=v700Video();if(!v)return;if(v700$('scout-v700-current-time'))v700$('scout-v700-current-time').textContent=v700Fmt(v.currentTime);if(v700StopAt!=null&&v.currentTime>=v700StopAt-.04){v.pause();v700StopAt=null}}
setTimeout(()=>{const v=v700Video();if(v){v.addEventListener('timeupdate',v700OnTimeUpdate);v.addEventListener('seeking',()=>{if(v700StopAt!=null&&v.currentTime>v700StopAt+1)v700StopAt=null})}},0);

// Preserve video fields during every normalization pass.
const v700NormActionBase=scoutNormalizeAction;scoutNormalizeAction=function(a){const x=v700NormActionBase(a);x.videoStart=a?.videoStart==null?null:Number(a.videoStart);x.videoAction=a?.videoAction==null?null:Number(a.videoAction);x.videoEnd=a?.videoEnd==null?null:Number(a.videoEnd);x.clipId=String(a?.clipId||'');return x};
const v700NormRallyBase=scoutNormalizeRally;scoutNormalizeRally=function(r){const x=v700NormRallyBase(r);x.videoStart=r?.videoStart==null?null:Number(r.videoStart);x.videoEnd=r?.videoEnd==null?null:Number(r.videoEnd);return x};
const v700NormMatchBase=scoutNormalizeMatch;scoutNormalizeMatch=function(m){const x=v700NormMatchBase(m),raw=m?.video&&typeof m.video==='object'?m.video:{};x.dataVersion=V700_VERSION;x.video={...x.video,syncOffset:raw.syncOffset==null?x.video?.syncOffset??null:Number(raw.syncOffset),source:String(raw.source||x.video?.source||''),fileSize:Math.max(0,Number(raw.fileSize)||0),lastModified:Math.max(0,Number(raw.lastModified)||0),mimeType:String(raw.mimeType||''),duration:raw.duration==null?null:Number(raw.duration),syncedAt:raw.syncedAt?String(raw.syncedAt):null,anchor:raw.anchor&&typeof raw.anchor==='object'?raw.anchor:null,preRoll:Math.max(0,Number(raw.preRoll??2)),postRoll:Math.max(0,Number(raw.postRoll??2)),clips:scoutArr(raw.clips||x.video?.clips)};return x};
scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);scoutingMatches.forEach(m=>{if(m.video?.syncOffset!=null)v700ApplyMapping(m)});

// Add a direct video jump beside closed rallies in the live screen.
/* V12.5 removed unreachable function: v700DecorateRallies */

// Keep V7 version in saved state without changing session behavior.
const v700SaveBase=scoutSave;scoutSave=function(render=true){const m=scoutActive();if(m)m.dataVersion=V700_VERSION;const out=v700SaveBase(render);if(m)m.dataVersion=V700_VERSION;return out};

window.scoutV700Diagnostics=function(){const m=v700Match()||scoutActive(),meta=m?v700Meta(m):null;return {version:V700_VERSION,match:m?.id||null,videoSource:meta?.source||'',syncOffset:meta?.syncOffset??null,rallies:scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s.rallies).length,0),mappedRallies:scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s.rallies).filter(r=>r.videoStart!=null).length,0)}};
})();


/* V7.5.2 · stable public bridge for professional reports/PDFs.
   This is intentionally created inside the scouting closure, where all
   statistical helpers and private match state are actually accessible. */
window.VC_SCOUT_REPORT_BRIDGE={
  getMatches:()=>scoutingMatches,
  getActiveId:()=>scoutingActiveId,
  getActive:()=>scoutActive(),
  getMatchForAnalysis:()=>scoutMatchForAnalysis(),
  getExportMatch:(id)=>scoutExportMatch(id),
  setsScore:(m)=>scoutSetsScore(m),
  actionRows:(m,includeLive=true)=>scoutActionRows(m,includeLive),
  distributionRows:(m,team,evalFilter='')=>scoutDistributionRows(m,team,evalFilter),
  stats630:(m,team)=>scoutV630Stats(m,team),
  fullStats:(m,team,includeLive=false)=>scoutV61010FullStats(m,team,includeLive),
  skill:(st,skill)=>scoutV61010Skill(st,skill),
  reception:(st)=>scoutV61010Reception(st),
  attack:(st)=>scoutV61010Attack(st),
  pointMetrics:(m,team,key='team',rows=null)=>scoutV61010PointMetrics(m,team,key,rows),
  initialPos:(m,team,st,setNo)=>scoutV6109InitialPos(m,team,st,setNo),
  setStat:(m,team,setNo)=>scoutV61010SetStat(m,team,setNo),
  officialName:(st,isTeam=false)=>scoutV61010OfficialName(st,isTeam),
  breakdown:(rallies,team)=>scoutV61010Breakdown(rallies,team),
  performance:(m,team,applyFilters=false)=>scoutV61010Performance(m,team,applyFilters),
  rallies:(m,team,applyFilters=false)=>scoutV61010Rallies(m,team,applyFilters),
  linkedMatch:(m)=>scoutV61010LinkedMatch(m),
  safeFilename:(v)=>scoutSafeFilename(v),
  exportNotice:(show,text='Preparando informe…')=>scoutExportNotice(show,text),
  teamName:()=>EQUIPOS?.[equipoActivo]?.nombre||'Equipo',
  comboLabel:(key)=>V620_COMBO_LABELS?.[key]||key||'',
  skillLabel:(key)=>SCOUT_SKILLS?.[key]||key||'',
  metricRows:(m,team,key,metric)=>scoutV630ActionMetricRows(m,team,key,metric),
  metricSequences:(m,team,key,metric)=>scoutV630SequenceMetricRows(m,team,key,metric),
  metricLabel:(metric)=>scoutV630MetricLabel(metric),
  playerKey:(a)=>scoutPlayerKey(a),
  playerLabel:(a)=>scoutActionPlayerLabel(a),
  rotationForAction:(a,team)=>scoutV630RotationForAction(a,team),
  phaseForAction:(a,team)=>scoutV630PhaseForAction(a,team),
  zoneText:(a)=>scoutV6108ZoneText(a),
  advancedMetaText:(a)=>scoutAdvancedMetaText(a)
};

/* Compatibility exports for the V7.5 report module. These functions used to
   be private to this IIFE, which was the reason both PDF buttons failed. */
Object.assign(window,{
  scoutExportMatch,
  scoutMatchForAnalysis,
  scoutSetsScore,
  scoutActionRows,
  scoutDistributionRows,
  scoutV630Stats,
  scoutV61010FullStats,
  scoutV61010Skill,
  scoutV61010Reception,
  scoutV61010Attack,
  scoutV61010PointMetrics,
  scoutV6109InitialPos,
  scoutV61010SetStat,
  scoutV61010OfficialName,
  scoutV61010Breakdown,
  scoutV61010Performance,
  scoutV61010Rallies,
  scoutV61010LinkedMatch,
  scoutSafeFilename,
  scoutExportNotice
});
window.V620_COMBO_LABELS=V620_COMBO_LABELS;



/* ===== INTEGRATED V8.3 TACTICAL ===== */
const V830_ATTACK_DIR={LIN:'Línea',DC:'Diagonal corta',DL:'Diagonal larga'};
const V830_SERVE={F:'Flotante',JF:'Flotante salto',JP:'Salto potente',U:'Seguridad'};
const $v=id=>document.getElementById(id);
const arr830=v=>Array.isArray(v)?v:[];
const pct830=(n,d)=>d?Math.round(Number(n||0)*100/Number(d||0)):0;

/* ---------- Persist new tactical metadata ---------- */
const v830NormalizeBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){
  const x=v830NormalizeBase(a);
  x.attackDirection=['LIN','DC','DL'].includes(String(a?.attackDirection||''))?String(a.attackDirection):'';
  x.receivedServeType=['F','JF','JP','U'].includes(String(a?.receivedServeType||''))?String(a.receivedServeType):'';
  // Compatibility: early builds allowed ~JF on R inside serveType.
  if(x.skill==='R'&&!x.receivedServeType&&['F','JF','JP','U'].includes(String(a?.serveType||'')))x.receivedServeType=String(a.serveType);
  if(x.skill==='R')x.serveType='';
  return x;
};

function v830InferReceptionMeta(action,m=scoutActive()){
  if(!action||action.skill!=='R'||!m)return action;
  const other=action.team==='ours'?'opponent':'ours';
  const prev=[...arr830(m.liveRally?.actions)].reverse().find(a=>a.team===other&&a.skill==='S');
  if(prev){
    if(!action.receivedServeType&&prev.serveType)action.receivedServeType=prev.serveType;
    if(!action.sourceZone&&prev.startZone)action.sourceZone=String(prev.startZone);
    if(!action.sourceActionId)action.sourceActionId=Number(prev.id)||null;
  }
  return action;
}
const v830PushBase=scoutPushAction;
scoutPushAction=function(action){
  if(action?.skill==='R')v830InferReceptionMeta(action);
  return v830PushBase(action);
};

/* ---------- Code builder/parser ---------- */
scoutBuildCode=function(a){
  let token='';
  if(a.team==='opponent'){
    const n=String(a.playerLabel||'').match(/\d+/)?.[0]||String(a.playerNumberSnapshot||'').match(/\d+/)?.[0]||String(a.playerLabel||'').replace(/\s+/g,'').slice(0,4)||'?';
    token='R'+n;
  }else{
    const p=scoutPlayer(a.playerId);
    token=p?.number!==''&&p?.number!=null?String(p.number):(a.playerNumberSnapshot!==''&&a.playerNumberSnapshot!=null?String(a.playerNumberSnapshot):'P');
  }
  token+=a.skill+(a.evaluation||'!');
  if(a.startZone&&a.endZone)token+=`.${a.startZone}>${a.endZone}`;
  else if(typeof scoutV6108IsContactSkill==='function'&&scoutV6108IsContactSkill(a.skill)&&scoutV6108ContactZone(a))token+=`.${scoutV6108ContactZone(a)}`;
  const serveMeta=a.skill==='R'?a.receivedServeType:a.serveType;
  if(serveMeta)token+=`~${serveMeta}`;
  const combo=a.setTarget||a.attackCombo;if(combo)token+=`:${combo}`;
  if(a.skill==='A'&&a.attackDirection)token+=`*${a.attackDirection}`;
  if(a.phase)token+=`^${a.phase}`;
  if(a.blockers!==''&&a.blockers!=null)token+=`@${a.blockers}`;
  return token;
};

const v830ParseBase=scoutV6108ParseRaw;
scoutV6108ParseRaw=function(raw,m,oldAction=null){
  raw=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  const direction=raw.match(/\*(LIN|DC|DL)/)?.[1]||'';
  raw=raw.replace(/\*(LIN|DC|DL)/,'');
  const parsed=v830ParseBase(raw,m,oldAction);
  if(parsed?.error||!parsed?.action)return parsed;
  let a=parsed.action;
  if(a.skill==='R'){
    a.receivedServeType=a.receivedServeType||a.serveType||'';
    a.serveType='';
    v830InferReceptionMeta(a,m);
  }
  if(a.skill==='A')a.attackDirection=direction||String(oldAction?.attackDirection||'');
  else a.attackDirection='';
  a=scoutNormalizeAction(a);a.code=scoutBuildCode(a);
  return {action:a};
};
window.v680ParseCode=function(raw,m,oldAction=null){return scoutV6108ParseRaw(raw,m,oldAction)};

/* ---------- Manual form ---------- */
window.scoutAddManualAction=function(){
  const team=$v('scout-action-team')?.value||'ours',pv=$v('scout-action-player')?.value||'',skill=$v('scout-action-skill')?.value||'S',combo=$v('scout-action-combo')?.value||'';
  const zones=scoutV6108NormalizeZoneInput(skill,$v('scout-action-start')?.value||'',$v('scout-action-end')?.value||'');
  const serve=$v('scout-action-serve-type')?.value||'';
  scoutPushAction({
    team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',
    skill,evaluation:$v('scout-action-eval')?.value||'!',...zones,
    serveType:skill==='S'?serve:'',
    receivedServeType:skill==='R'?serve:'',
    phase:$v('scout-action-phase')?.value||'',
    setTarget:skill==='E'?combo:'',
    attackCombo:skill==='A'?combo:'',
    attackTempo:skill==='A'?($v('scout-action-tempo')?.value||''):'',
    attackDirection:skill==='A'?($v('scout-action-direction')?.value||''):'',
    blockers:skill==='A'?($v('scout-action-blockers')?.value||''):''
  });
};

window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$v('scout-action-skill')?.value||'S',ev=$v('scout-action-eval')?.value||'!',start=$v('scout-action-start')?.value||'',end=$v('scout-action-end')?.value||'',
    serve=$v('scout-action-serve-type')?.value||'',phase=$v('scout-action-phase')?.value||'',combo=$v('scout-action-combo')?.value||'',
    direction=$v('scout-action-direction')?.value||'',blockers=$v('scout-action-blockers')?.value??'';
  let c='N'+skill+ev;
  if(start&&end)c+=`.${start}>${end}`;
  else if(typeof scoutV6108IsContactSkill==='function'&&scoutV6108IsContactSkill(skill)&&(end||start))c+=`.`+(end||start);
  if((skill==='S'||skill==='R')&&serve)c+=`~${serve}`;
  if((skill==='E'||skill==='A')&&combo)c+=`:${combo}`;
  if(skill==='A'&&direction)c+=`*${direction}`;
  if(phase)c+=`^${phase}`;
  if(skill==='A'&&blockers!=='')c+=`@${blockers}`;
  if($v('scout-advanced-code-preview'))$v('scout-advanced-code-preview').textContent='Código: '+c;
};

const v830AdvancedBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v830AdvancedBase?.();
  const skill=$v('scout-action-skill')?.value||'S';
  $v('scout-adv-direction-wrap')?.classList.toggle('hidden',skill!=='A');
  const lab=$v('scout-action-serve-label');
  if(lab)lab.textContent=skill==='R'?'Tipo de saque recibido':'Tipo de saque';
  const ctx=$v('scout-advanced-context');
  if(ctx&&skill==='R')ctx.textContent='Zona de contacto + valoración + tipo de saque recibido';
  if(ctx&&skill==='A')ctx.textContent='Combinación + dirección + fase + tempo + bloqueo';
  scoutUpdateAdvancedCodePreview();
  return out;
};
['scout-action-direction','scout-action-serve-type'].forEach(id=>$v(id)?.addEventListener('change',scoutUpdateAdvancedCodePreview));

const v830MetaBase=scoutAdvancedMetaText;
scoutAdvancedMetaText=function(a){
  const parts=[];
  const base=v830MetaBase(a);if(base)parts.push(base);
  if(a?.skill==='R'&&a.receivedServeType)parts.push('Recibe '+(V830_SERVE[a.receivedServeType]||a.receivedServeType));
  if(a?.skill==='A'&&a.attackDirection)parts.push(V830_ATTACK_DIR[a.attackDirection]||a.attackDirection);
  return [...new Set(parts)].join(' · ');
};

/* ---------- Reception serve inference for saved rallies ---------- */
function v830ReceptionServeType(m,row){
  if(row?.receivedServeType)return row.receivedServeType;
  if(row?.skill==='R'&&row?.serveType)return row.serveType;
  const set=arr830(m?.sets).find(s=>Number(s.number)===Number(row?.set));
  const rally=arr830(set?.rallies)[Math.max(0,Number(row?.rallyIndex||1)-1)];
  if(!rally)return '';
  const acts=arr830(rally.actions),idx=Math.max(0,Number(row?.actionIndex||1)-1),other=row.team==='ours'?'opponent':'ours';
  const prev=acts.slice(0,idx).reverse().find(a=>a.team===other&&a.skill==='S');
  return prev?.serveType||'';
}
function v830ReceptionSourceZone(m,row){
  if(row?.sourceZone)return String(row.sourceZone);
  const set=arr830(m?.sets).find(s=>Number(s.number)===Number(row?.set));
  const rally=arr830(set?.rallies)[Math.max(0,Number(row?.rallyIndex||1)-1)];
  if(!rally)return '';
  const acts=arr830(rally.actions),idx=Math.max(0,Number(row?.actionIndex||1)-1),other=row.team==='ours'?'opponent':'ours';
  const prev=acts.slice(0,idx).reverse().find(a=>a.team===other&&a.skill==='S');
  return String(prev?.startZone||'');
}

/* ---------- Enhanced setter distribution ---------- */
function v830SetterRows(m,team){
  return scoutSequenceRows(m,team).filter(x=>x.target);
}
function v830PopulateSetterFilter(m,team){
  const sel=$v('scout-distribution-setter-filter');if(!sel)return;
  const old=sel.value,setters=[...new Set(v830SetterRows(m,team).map(x=>x.setter).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  sel.innerHTML='<option value="">Todos</option>'+setters.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  if(setters.includes(old))sel.value=old;
}
function scoutV830RenderSetterDistribution(){
  const m=scoutMatchForAnalysis(),box=$v('scout-analysis-distribution');if(!m||!box)return;
  const team=$v('scout-sequence-team-scope')?.value||'ours';
  v830PopulateSetterFilter(m,team);
  const setter=$v('scout-distribution-setter-filter')?.value||'',phase=$v('scout-distribution-phase-filter')?.value||'',rec=$v('scout-distribution-reception-filter')?.value||'';
  let rows=v830SetterRows(m,team);
  if(setter)rows=rows.filter(x=>x.setter===setter);
  if(phase)rows=rows.filter(x=>x.phase===phase);
  if(rec)rows=rows.filter(x=>x.receptionEval===rec);
  const targets=['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'];
  const data=targets.map(t=>{
    const rr=rows.filter(x=>x.target===t),kills=rr.filter(x=>x.attackEval==='#').length,err=rr.filter(x=>x.attackEval==='=').length,blk=rr.filter(x=>x.attackEval==='/').length,att=rr.filter(x=>x.attackEval).length,wins=rr.filter(x=>x.win).length;
    const rot=[1,2,3,4,5,6].map(n=>rr.filter(x=>Number(x.rotation)===n).length);
    return {t,n:rr.length,kills,err,blk,att,wins,usage:pct830(rr.length,rows.length),killPct:pct830(kills,att),eff:att?Math.round((kills-err-blk)*100/att):0,winPct:pct830(wins,rr.length),rot};
  }).filter(x=>x.n);
  const top=data.slice().sort((a,b)=>b.n-a.n)[0],best=data.filter(x=>x.att>=3).slice().sort((a,b)=>b.eff-a.eff)[0];
  box.innerHTML=data.length?`
    <div class="scout-v830-kpis">
      <div><span>Distribuciones</span><b>${rows.length}</b><small>${setter||'Todos los colocadores'}</small></div>
      <div><span>Destino más usado</span><b>${top?esc(V620_COMBO_LABELS[top.t]||top.t):'—'}</b><small>${top?top.usage+'% · '+top.n+' balones':'—'}</small></div>
      <div><span>Mejor EFF ataque</span><b>${best?best.eff+'%':'—'}</b><small>${best?esc(V620_COMBO_LABELS[best.t]||best.t)+' · n='+best.att:'muestra < 3'}</small></div>
      <div><span>Rallies ganados</span><b>${rows.length?pct830(rows.filter(x=>x.win).length,rows.length)+'%':'—'}</b><small>${rows.filter(x=>x.win).length}/${rows.length}</small></div>
    </div>
    <div class="scout-v830-table-wrap"><table class="scout-v830-table scout-v830-matrix"><thead><tr><th>Destino</th>${[1,2,3,4,5,6].map(n=>`<th>R${n}</th>`).join('')}<th>Total</th><th>Uso</th><th>Kill%</th><th>EFF</th><th>Rally%</th></tr></thead><tbody>
      ${data.map(x=>`<tr><td><b>${esc(V620_COMBO_LABELS[x.t]||x.t)}</b></td>${x.rot.map(v=>`<td class="rotation">${v||'—'}</td>`).join('')}<td><b>${x.n}</b></td><td>${x.usage}%</td><td>${x.att?x.killPct+'%':'—'}</td><td class="${x.eff>=20?'good':x.eff<0?'bad':''}">${x.att?x.eff+'%':'—'}</td><td>${x.winPct}%</td></tr>`).join('')}
    </tbody></table></div>
    <div class="scout-v830-note">Ejemplo de código de colocación: <b>3E+:Z1^K1</b>. El destino va después de <b>:</b>. Z1/Z6 quedan separados de PIPE/1T/31 para poder analizar la distribución real por rotación.</div>`
    :'<div class="match-empty">No hay colocaciones con destino codificado para este filtro.</div>';
}

/* ---------- Attack directions ---------- */
function v830PhaseForAction(a,team){return team==='ours'?(a.servingBefore==='ours'?'K2':'K1'):(a.servingBefore==='opponent'?'K2':'K1')}
function v830RotationForAction(a,team){return team==='ours'?Number(a.rotation)||1:Number(a.opponentRotation)||1}
function v830PopulatePlayers(selectId,m,team,skill){
  const sel=$v(selectId);if(!sel)return;
  const old=sel.value,rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill===skill),map=new Map();
  rows.forEach(a=>map.set(scoutPlayerKey(a),scoutActionPlayerLabel(a)));
  sel.innerHTML='<option value="">Todos</option>'+[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],'es')).map(([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`).join('');
  if(map.has(old))sel.value=old;
}
window.scoutV830RenderAttackDirections=function(){
  const m=scoutMatchForAnalysis(),box=$v('scout-v830-attack-directions');if(!m||!box)return;
  const team=$v('scout-v830-attack-team')?.value||'ours';v830PopulatePlayers('scout-v830-attack-player',m,team,'A');
  const player=$v('scout-v830-attack-player')?.value||'',rot=Number($v('scout-v830-attack-rotation')?.value)||0,phase=$v('scout-v830-attack-phase')?.value||'';
  let rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='A');
  if(player)rows=rows.filter(a=>scoutPlayerKey(a)===player);
  if(rot)rows=rows.filter(a=>v830RotationForAction(a,team)===rot);
  if(phase)rows=rows.filter(a=>v830PhaseForAction(a,team)===phase);
  const coded=rows.filter(a=>a.attackDirection);
  const data=['LIN','DC','DL'].map(dir=>{
    const rr=coded.filter(a=>a.attackDirection===dir),kill=rr.filter(a=>a.evaluation==='#').length,err=rr.filter(a=>a.evaluation==='=').length,blk=rr.filter(a=>a.evaluation==='/').length;
    const routeMap={};rr.forEach(a=>{const k=a.startZone&&a.endZone?`Z${a.startZone}→Z${a.endZone}`:'Sin trayectoria';routeMap[k]=(routeMap[k]||0)+1});
    const top=Object.entries(routeMap).sort((a,b)=>b[1]-a[1])[0];
    return {dir,n:rr.length,kill,err,blk,killPct:pct830(kill,rr.length),eff:rr.length?Math.round((kill-err-blk)*100/rr.length):0,top:top?.[0]||'—'};
  }).filter(x=>x.n);
  const uncoded=rows.length-coded.length;
  box.innerHTML=data.length?`
    <div class="scout-v830-kpis"><div><span>Ataques</span><b>${rows.length}</b><small>filtro actual</small></div><div><span>Dirección codificada</span><b>${pct830(coded.length,rows.length)}%</b><small>${coded.length}/${rows.length}</small></div><div><span>Sin dirección</span><b>${uncoded}</b><small>se pueden editar después</small></div><div><span>Dirección dominante</span><b>${esc(V830_ATTACK_DIR[data.slice().sort((a,b)=>b.n-a.n)[0]?.dir]||'—')}</b><small>por volumen</small></div></div>
    <div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Dirección</th><th>Total</th><th>Kill</th><th>Error</th><th>Bloq.</th><th>Kill%</th><th>EFF</th><th>Trayectoria más usada</th></tr></thead><tbody>${data.map(x=>`<tr><td><b>${esc(V830_ATTACK_DIR[x.dir])}</b></td><td>${x.n}</td><td>${x.kill}</td><td>${x.err}</td><td>${x.blk}</td><td>${x.killPct}%</td><td class="${x.eff>=20?'good':x.eff<0?'bad':''}">${x.eff}%</td><td>${esc(x.top)}</td></tr>`).join('')}</tbody></table></div>
    <div class="scout-v830-codeguide"><div><code>12A#.4&gt;5*DL</code><span>Punto desde Z4 a Z5 · diagonal larga.</span></div><div><code>12A+.4&gt;1*LIN</code><span>Ataque positivo · línea.</span></div><div><code>12A/.4&gt;4*DC</code><span>Ataque bloqueado · diagonal corta.</span></div></div>`
    :'<div class="match-empty">Todavía no hay ataques con dirección *LIN / *DC / *DL en este filtro.</div>';
};

/* ---------- Professional reception ---------- */
window.scoutV830RenderReception=function(){
  const m=scoutMatchForAnalysis(),box=$v('scout-v830-reception');if(!m||!box)return;
  const team=$v('scout-v830-rec-team')?.value||'ours';v830PopulatePlayers('scout-v830-rec-player',m,team,'R');
  const player=$v('scout-v830-rec-player')?.value||'',serve=$v('scout-v830-rec-serve')?.value||'',zone=$v('scout-v830-rec-zone')?.value||'';
  let rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='R').map(a=>({...a,_serve:v830ReceptionServeType(m,a),_source:v830ReceptionSourceZone(m,a),_contact:String(a.contactZone||a.endZone||a.startZone||'')}));
  if(player)rows=rows.filter(a=>scoutPlayerKey(a)===player);
  if(serve)rows=rows.filter(a=>a._serve===serve);
  if(zone)rows=rows.filter(a=>zone.length===1?String(a._contact||'').startsWith(zone):String(a._contact||'')===zone);
  const groups=new Map();
  rows.forEach(a=>{
    const key=`${a._serve||'UNK'}|${a._contact||'?'}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(a);
  });
  const data=[...groups.entries()].map(([key,rr])=>{
    const [st,z]=key.split('|'),perfect=rr.filter(a=>a.evaluation==='#').length,pos=rr.filter(a=>['#','+'].includes(a.evaluation)).length,neg=rr.filter(a=>['-','/','='].includes(a.evaluation)).length,err=rr.filter(a=>a.evaluation==='=').length,so=rr.filter(a=>a.winner===team).length;
    const src={};rr.forEach(a=>{if(a._source)src[a._source]=(src[a._source]||0)+1});const topSrc=Object.entries(src).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
    return {st,z,n:rr.length,perfect,pos,neg,err,so,posPct:pct830(pos,rr.length),excPct:pct830(perfect,rr.length),errPct:pct830(err,rr.length),soPct:pct830(so,rr.length),topSrc};
  }).sort((a,b)=>b.n-a.n);
  const perfect=rows.filter(a=>a.evaluation==='#').length,pos=rows.filter(a=>['#','+'].includes(a.evaluation)).length,err=rows.filter(a=>a.evaluation==='=').length,so=rows.filter(a=>a.winner===team).length;
  box.innerHTML=rows.length?`
    <div class="scout-v830-kpis"><div><span>Recepciones</span><b>${rows.length}</b><small>muestra filtrada</small></div><div><span>Positiva +/#</span><b>${pct830(pos,rows.length)}%</b><small>${pos}/${rows.length}</small></div><div><span>Excelente #</span><b>${pct830(perfect,rows.length)}%</b><small>${perfect}/${rows.length}</small></div><div><span>Side-out</span><b>${pct830(so,rows.length)}%</b><small>${so}/${rows.length} rallies ganados</small></div></div>
    <div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Saque recibido</th><th>Zona</th><th>Origen saq.</th><th>Total</th><th>Pos%</th><th>Exc%</th><th>Errores</th><th>Err%</th><th>Side-out%</th></tr></thead><tbody>${data.map(x=>`<tr><td><b>${esc(V830_SERVE[x.st]||'No especificado')}</b></td><td>${x.z==='?'?'—':'Z'+esc(x.z)}</td><td>${x.topSrc==='—'?'—':'Z'+esc(x.topSrc)}</td><td>${x.n}</td><td class="${x.posPct>=60?'good':''}">${x.posPct}%</td><td>${x.excPct}%</td><td>${x.err}</td><td class="${x.errPct>=20?'bad':''}">${x.errPct}%</td><td class="${x.soPct>=60?'good':x.soPct<40?'bad':''}">${x.soPct}%</td></tr>`).join('')}</tbody></table></div>
    <div class="scout-v830-codeguide"><div><code>7R#.6~JF</code><span>Perfecta en Z6 ante flotante en salto.</span></div><div><code>7R+.5~JP</code><span>Positiva en Z5 ante salto potente.</span></div><div><code>7R-.1~F</code><span>Negativa en Z1 ante flotante.</span></div></div>
    <div class="scout-v830-note">Si antes registras el saque rival, por ejemplo <b>R4S+.1&gt;6~JF</b>, y después escribes <b>7R#.6</b>, Volley Coach intenta inferir automáticamente que la recepción llegó desde Z1 y que el saque era JF.</div>`
    :'<div class="match-empty">No hay recepciones para este filtro.</div>';
};

/* ---------- Hook into existing analysis ---------- */
const v830PerformanceBase=window.scoutRenderPerformanceAnalytics;
window.scoutRenderPerformanceAnalytics=function(){
  v830PerformanceBase?.();
  scoutV830RenderSetterDistribution();
  scoutV830RenderAttackDirections();
  scoutV830RenderReception();
};
const v830AnalysisBase=window.scoutRenderAnalysis;
window.scoutRenderAnalysis=function(){
  v830AnalysisBase?.();
  scoutV830RenderSetterDistribution();
  scoutV830RenderAttackDirections();
  scoutV830RenderReception();
};

/* ---------- CSV exports: tactical fields ---------- */
const v830ExportCSVBase=window.scoutExportCSV;
window.scoutExportCSV=function(id){
  const m=scoutExportMatch(id);if(!m)return v830ExportCSVBase(id);
  const rows=scoutExportRows(m);
  const headers=['fecha','equipo','rival','competicion','set','rally','marcador_antes','marcador_despues','saque_antes','rotacion_nuestra','rotacion_rival','secuencia','equipo_accion','jugador','fundamento','valoracion','zona_origen','zona_destino','tipo_saque','tipo_saque_recibido','fase','combinacion','direccion_ataque','tempo_ataque','bloqueadores','codigo','tiempo_scout'];
  const data=rows.map(a=>[m.date,EQUIPOS[equipoActivo].nombre,m.opponent,m.competition,a.set,a.rallyIndex,a.scoreBefore,a.scoreAfter,a.servingBefore==='ours'?'Nuestro':'Rival',a.rotation,a.opponentRotation,a.actionIndex,a.team==='ours'?'Nuestro':'Rival',scoutActionPlayerLabel(a),SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,a.startZone,a.endZone,V620_SERVE_LABELS[a.serveType]||a.serveType||'',V830_SERVE[a.receivedServeType]||a.receivedServeType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',V830_ATTACK_DIR[a.attackDirection]||a.attackDirection||'',a.attackTempo||'',a.blockers??'',a.code,scoutFormatTime(a.scoutMs)]);
  const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');
  scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_acciones.csv`);
};

/* Initial UI */
scoutUpdateAdvancedFields();

/* ===== INTEGRATED V8.4 PRO RALLY/BLOCK/PHASE ===== */
const $84=id=>document.getElementById(id);
const a84=v=>Array.isArray(v)?v:[];
const pct84=(n,d)=>d?Math.round(Number(n||0)*100/Number(d||0)):0;
const BLOCK_EVAL={
  '#':'Punto de bloqueo',
  '+':'Toque positivo / controlado',
  '!':'Toque de continuidad',
  '-':'Toque negativo',
  '/':'Block-out',
  '=':'Error de bloqueo'
};

/* ==========================================================
   BLOCKING METADATA + CODE
   Format: 4B#.3@2&12
   ========================================================== */
const v840NormBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){
  const x=v840NormBase(a);
  x.blockTargetNumber=String(a?.blockTargetNumber||'').replace(/\D/g,'').slice(0,3);
  x.blockTargetLabel=String(a?.blockTargetLabel||'');
  if(x.skill!=='B'){x.blockTargetNumber='';x.blockTargetLabel=''}
  return x;
};

function v840InferBlockTarget(action,m=scoutActive()){
  if(!action||action.skill!=='B'||!m)return action;
  const other=action.team==='ours'?'opponent':'ours';
  const prev=[...a84(m.liveRally?.actions)].reverse().find(a=>a.team===other&&a.skill==='A');
  if(prev&&!action.blockTargetNumber){
    action.blockTargetNumber=String(prev.playerNumberSnapshot||String(prev.playerLabel||'').match(/\d+/)?.[0]||'');
    action.blockTargetLabel=scoutActionPlayerLabel(prev);
  }
  return action;
}

const v840PushBase=scoutPushAction;
scoutPushAction=function(action){
  if(action?.skill==='B')v840InferBlockTarget(action);
  return v840PushBase(action);
};

const v840BuildBase=scoutBuildCode;
scoutBuildCode=function(a){
  if(a?.skill!=='B')return v840BuildBase(a);
  const z=String(a.startZone||a.contactZone||'');
  const copy={...a,startZone:z,endZone:z||''};
  let code=v840BuildBase(copy);
  if(z)code=code.replace(`.${z}>${z}`,`.${z}`);
  if(a.blockTargetNumber)code+=`&${String(a.blockTargetNumber).replace(/\D/g,'').slice(0,3)}`;
  return code;
};

const v840ParseBase=scoutV6108ParseRaw;
scoutV6108ParseRaw=function(raw,m,oldAction=null){
  const original=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  const target=original.match(/&(\d{1,3})/)?.[1]||'';
  const blockSize=original.match(/@([1-3])/)?.[1]||'';
  let cleaned=original.replace(/&\d{1,3}/,'');
  let singleBlockZone='';
  const bz=cleaned.match(/^(R)?(\d+)B([#\+!\-\/=])?\.([1-9])(?!>)/);
  if(bz){
    singleBlockZone=bz[4];
    cleaned=cleaned.replace(`.${singleBlockZone}`,`.${singleBlockZone}>${singleBlockZone}`);
  }
  const parsed=v840ParseBase(cleaned,m,oldAction);
  if(parsed?.error||!parsed?.action)return parsed;
  let a=parsed.action;
  if(a.skill==='B'){
    if(singleBlockZone){a.startZone=singleBlockZone;a.endZone='';a.contactZone=singleBlockZone}
    a.blockers=blockSize||String(oldAction?.blockers||'');
    a.blockTargetNumber=target||String(oldAction?.blockTargetNumber||'');
    if(!a.blockTargetNumber)v840InferBlockTarget(a,m);
  }else{
    a.blockTargetNumber='';
    a.blockTargetLabel='';
  }
  a=scoutNormalizeAction(a);a.code=scoutBuildCode(a);
  return {action:a};
};
window.v680ParseCode=function(raw,m,oldAction=null){return scoutV6108ParseRaw(raw,m,oldAction)};

/* ---------- Manual blocking fields ---------- */
const v840ManualBase=window.scoutAddManualAction;
window.scoutAddManualAction=function(){
  const skill=$84('scout-action-skill')?.value||'S';
  if(skill!=='B')return v840ManualBase();
  const team=$84('scout-action-team')?.value||'ours',pv=$84('scout-action-player')?.value||'',
    z=$84('scout-action-start')?.value||$84('scout-action-end')?.value||'';
  scoutPushAction({
    team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',
    skill:'B',evaluation:$84('scout-action-eval')?.value||'!',
    startZone:z,endZone:'',contactZone:z,
    phase:$84('scout-action-phase')?.value||'',
    blockers:$84('scout-action-blockers')?.value||'',
    blockTargetNumber:String($84('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3)
  });
};

const v840FieldsBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v840FieldsBase?.();
  const skill=$84('scout-action-skill')?.value||'S',isB=skill==='B';
  $84('scout-adv-block-wrap')?.classList.toggle('hidden',!(skill==='A'||isB));
  $84('scout-v840-block-target-wrap')?.classList.toggle('hidden',!isB);
  if(isB){
    const sl=$84('scout-action-start-label'),el=$84('scout-action-end-wrap'),ctx=$84('scout-advanced-context');
    if(sl)sl.textContent='Zona de bloqueo';
    el?.classList.add('hidden');
    const lab=$84('scout-adv-block-wrap')?.querySelector('span');if(lab)lab.textContent='Tamaño del bloqueo';
    if(ctx)ctx.textContent='Zona + individual/doble/triple + atacante objetivo';
  }else{
    $84('scout-action-end-wrap')?.classList.remove('hidden');
    const lab=$84('scout-adv-block-wrap')?.querySelector('span');if(lab)lab.textContent='Bloqueadores';
  }
  scoutUpdateAdvancedCodePreview();
  return out;
};

const v840PreviewBase=window.scoutUpdateAdvancedCodePreview;
window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$84('scout-action-skill')?.value||'S';
  if(skill!=='B')return v840PreviewBase?.();
  const ev=$84('scout-action-eval')?.value||'!',z=$84('scout-action-start')?.value||$84('scout-action-end')?.value||'',
    phase=$84('scout-action-phase')?.value||'',size=$84('scout-action-blockers')?.value||'',target=String($84('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3);
  let c='NB'+ev;if(z)c+=`.${z}`;if(phase)c+=`^${phase}`;if(size)c+=`@${size}`;if(target)c+=`&${target}`;
  if($84('scout-advanced-code-preview'))$84('scout-advanced-code-preview').textContent='Código: '+c;
};
$84('scout-v840-block-target')?.addEventListener('input',scoutUpdateAdvancedCodePreview);

/* ==========================================================
   PROFESSIONAL RALLY EDITOR
   ========================================================== */
function v840EditorRally(){
  const c=v680EditContext,m=scoutActive(),s=a84(m?.sets).find(x=>Number(x.number)===Number(c?.setNo));
  return s?.rallies?.find(x=>Number(x.id)===Number(c?.rallyId))||null;
}
function v840ActionMeta(a){
  const bits=[a.team==='ours'?'Nuestro':'Rival',SCOUT_SKILLS[a.skill]||a.skill,BLOCK_EVAL[a.evaluation]&&a.skill==='B'?BLOCK_EVAL[a.evaluation]:a.evaluation];
  if(a.skill==='B'&&a.blockers)bits.push(a.blockers==='1'?'Individual':a.blockers==='2'?'Doble':'Triple');
  if(a.skill==='B'&&a.blockTargetNumber)bits.push('vs #'+a.blockTargetNumber);
  if(a.skill==='B'&&a.startZone)bits.push('Z'+a.startZone);
  if(a.videoTime!=null)bits.push('vídeo '+Math.floor(Number(a.videoTime))+'s');
  return bits.filter(Boolean);
}
window.scoutV840MoveEditAction=function(i,delta){
  if(v680EditContext?.mode!=='rally')return;
  i=Number(i);const j=i+Number(delta);
  if(j<0||j>=v680EditContext.actions.length)return;
  const [x]=v680EditContext.actions.splice(i,1);v680EditContext.actions.splice(j,0,x);
  scoutV680RenderRallyEditor();
};
window.scoutV840DuplicateEditAction=function(i){
  if(v680EditContext?.mode!=='rally')return;
  i=Number(i);const src=v680EditContext.actions[i];if(!src)return;
  const c=scoutClone(src);c.id=Date.now()+Math.floor(Math.random()*1000);c.createdAt=scoutNow();c.seq=i+2;
  v680EditContext.actions.splice(i+1,0,c);scoutV680RenderRallyEditor();
};
window.scoutV840AddAt=function(where='end'){
  if(v680EditContext?.mode!=='rally')return;
  const input=$84('scout-v680-new-code'),raw=String(input?.value||'').trim(),m=scoutActive();
  if(!raw){input?.focus();return}
  const parsed=v680ParseCode(raw,m,null);if(parsed.error){alert(parsed.error);input?.focus();return}
  parsed.action.id=Date.now()+Math.floor(Math.random()*1000);parsed.action.createdAt=scoutNow();
  const r=v840EditorRally();parsed.action.scoutMs=Number(r?.scoutEndMs)||0;
  if(where==='start')v680EditContext.actions.unshift(parsed.action);else v680EditContext.actions.push(parsed.action);
  scoutV680RenderRallyEditor();setTimeout(()=>$84('scout-v680-new-code')?.focus(),0);
};
window.scoutV680AddEditAction=function(){scoutV840AddAt('end')};

window.scoutV680RenderRallyEditor=function(){
  const c=v680EditContext,body=$84('scout-v680-rally-body'),footer=$84('scout-v680-rally-footer'),r=v840EditorRally();
  if(!body||c?.mode!=='rally'||!r)return;
  const warnings=c.actions.reduce((n,a)=>n+a84(a.validationWarnings).length,0);
  body.innerHTML=`
    <div class="scout-v840-editor-summary">
      <div><span>Marcador</span><b>${r.scoreBefore.us}-${r.scoreBefore.opponent} → ${r.scoreAfter.us}-${r.scoreAfter.opponent}</b></div>
      <div><span>Ganador</span><b>${r.winner==='ours'?'Nuestro':'Rival'}</b></div>
      <div><span>Saque</span><b>${r.servingBefore==='ours'?'Nuestro':'Rival'}</b></div>
      <div><span>Rotaciones</span><b>R${r.rotationBefore} · Rival R${r.opponentRotationBefore||1}</b></div>
      <div><span>Acciones</span><b>${c.actions.length}${warnings?' · '+warnings+' avisos':''}</b></div>
    </div>
    <div class="scout-v680-edit-list">${c.actions.map((a,i)=>`
      <div class="scout-v840-edit-row ${a84(a.validationWarnings).length?'has-warning':''}">
        <span class="scout-v840-edit-seq">${i+1}</span>
        <div class="scout-v840-edit-main">
          <input id="scout-v680-edit-code-${i}" value="${v680Esc(a.code||scoutBuildCode(a))}" spellcheck="false">
          <div class="scout-v840-edit-meta">${v840ActionMeta(a).map(x=>`<span>${v680Esc(x)}</span>`).join('')}${a84(a.validationWarnings).map(x=>`<span>⚠ ${v680Esc(x)}</span>`).join('')}</div>
        </div>
        <div class="scout-v840-edit-tools">
          <button class="ghost" ${i===0?'disabled':''} onclick="scoutV840MoveEditAction(${i},-1)" title="Subir">↑</button>
          <button class="ghost" ${i===c.actions.length-1?'disabled':''} onclick="scoutV840MoveEditAction(${i},1)" title="Bajar">↓</button>
          <button class="ghost" onclick="scoutV840DuplicateEditAction(${i})" title="Duplicar">⧉</button>
          <button class="danger" onclick="scoutV680RemoveEditAction(${i})" title="Eliminar">×</button>
        </div>
      </div>`).join('')||'<div class="match-empty">Este rally no tiene acciones.</div>'}</div>
    <div class="scout-v840-add"><input id="scout-v680-new-code" placeholder="Añadir acción · ej. 4B#.3@2&12" spellcheck="false" onkeydown="if(event.key==='Enter'){event.preventDefault();scoutV840AddAt('end')}"><button class="ghost" onclick="scoutV840AddAt('start')">＋ Al inicio</button><button class="primary" onclick="scoutV840AddAt('end')">＋ Al final</button></div>
    <div class="scout-v840-editor-help"><b>Editor profesional:</b> puedes corregir códigos, reordenar ↑↓, duplicar, eliminar o insertar acciones. Al guardar se vuelve a interpretar cada código con la gramática actual V8.4. Marcador, ganador y rotaciones siguen protegidos para evitar romper el partido.</div>`;
  if(footer)footer.innerHTML=`<div><button class="ghost" onclick="scoutV680OpenSetEditor(${c.setNo})">← Volver al set</button></div><div><button class="ghost" onclick="scoutV680CloseRallyEditor()">Cancelar</button><button class="primary" onclick="scoutV680SaveRallyEdit()">Guardar rally</button></div>`;
};

/* ==========================================================
   PROFESSIONAL BLOCK ANALYSIS
   ========================================================== */
function v840PlayerKey(a){return scoutPlayerKey(a)}
function v840PopulateBlockPlayers(m,team){
  const sel=$84('scout-v840-block-player');if(!sel)return;
  const old=sel.value,map=new Map();
  scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='B').forEach(a=>map.set(v840PlayerKey(a),scoutActionPlayerLabel(a)));
  sel.innerHTML='<option value="">Todos</option>'+[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],'es')).map(([k,v])=>`<option value="${esc(k)}">${esc(v)}</option>`).join('');
  if(map.has(old))sel.value=old;
}
window.scoutV840RenderBlocking=function(){
  const m=scoutMatchForAnalysis(),box=$84('scout-v840-blocking');if(!m||!box)return;
  const team=$84('scout-v840-block-team')?.value||'ours';v840PopulateBlockPlayers(m,team);
  const player=$84('scout-v840-block-player')?.value||'',size=$84('scout-v840-block-size')?.value||'',zone=$84('scout-v840-block-zone')?.value||'';
  let rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='B');
  if(player)rows=rows.filter(a=>v840PlayerKey(a)===player);
  if(size)rows=rows.filter(a=>String(a.blockers||'')===size);
  if(zone)rows=rows.filter(a=>zone.length===1?String(a.startZone||a.contactZone||'').startsWith(zone):String(a.startZone||a.contactZone||'')===zone);
  const point=rows.filter(a=>a.evaluation==='#').length,pos=rows.filter(a=>a.evaluation==='+').length,cont=rows.filter(a=>a.evaluation==='!').length,
    neg=rows.filter(a=>a.evaluation==='-').length,bo=rows.filter(a=>a.evaluation==='/').length,err=rows.filter(a=>a.evaluation==='=').length;
  const sizes=[1,2,3].map(n=>({n,total:rows.filter(a=>String(a.blockers)===String(n)).length,pts:rows.filter(a=>String(a.blockers)===String(n)&&a.evaluation==='#').length}));
  const targets=new Map();rows.forEach(a=>{const k=String(a.blockTargetNumber||'');if(k){if(!targets.has(k))targets.set(k,{n:0,pts:0});const x=targets.get(k);x.n++;if(a.evaluation==='#')x.pts++}});
  const targetRows=[...targets.entries()].sort((a,b)=>b[1].n-a[1].n).slice(0,8);
  box.innerHTML=rows.length?`
    <div class="scout-v830-kpis"><div><span>Acciones de bloqueo</span><b>${rows.length}</b><small>filtro actual</small></div><div><span>Puntos</span><b>${point}</b><small>${pct84(point,rows.length)}%</small></div><div><span>Toque + / !</span><b>${pos+cont}</b><small>control/continuidad</small></div><div><span>Block-out + error</span><b>${bo+err}</b><small>${pct84(bo+err,rows.length)}%</small></div></div>
    <div class="scout-v840-grid">
      <div class="scout-v840-subpanel"><h4>Resultado del bloqueo</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Resultado</th><th>Total</th><th>%</th></tr></thead><tbody>
      ${[['#','Punto',point],['+','Toque positivo',pos],['!','Continuidad',cont],['-','Toque negativo',neg],['/','Block-out',bo],['=','Error',err]].map(x=>`<tr><td><b>${x[0]} · ${x[1]}</b></td><td>${x[2]}</td><td>${pct84(x[2],rows.length)}%</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="scout-v840-subpanel"><h4>Tamaño del bloqueo</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Bloqueo</th><th>Total</th><th>Puntos</th><th>Punto%</th></tr></thead><tbody>
      ${sizes.map(x=>`<tr><td><b>${x.n===1?'Individual':x.n===2?'Doble':'Triple'}</b></td><td>${x.total}</td><td>${x.pts}</td><td>${x.total?pct84(x.pts,x.total)+'%':'—'}</td></tr>`).join('')}
      </tbody></table></div></div>
    </div>
    ${targetRows.length?`<div class="scout-v840-subpanel" style="margin-top:8px"><h4>Atacantes objetivo</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Atacante rival</th><th>Bloqueos</th><th>Puntos</th><th>Punto%</th></tr></thead><tbody>${targetRows.map(([k,x])=>`<tr><td><b>#${esc(k)}</b></td><td>${x.n}</td><td>${x.pts}</td><td>${pct84(x.pts,x.n)}%</td></tr>`).join('')}</tbody></table></div></div>`:''}
    <div class="scout-v840-codeguide"><div><code>4B#.3@2&amp;12</code><span>Punto en Z3 · bloqueo doble · sobre atacante #12.</span></div><div><code>4B+.3@2&amp;12</code><span>Toque positivo/controlado.</span></div><div><code>4B/.4@1&amp;9</code><span>Block-out en Z4 · bloqueo individual · atacante #9.</span></div></div>
    <div class="scout-v840-resultlegend"><span><b>#</b> punto</span><span><b>+</b> toque positivo</span><span><b>!</b> continuidad</span><span><b>-</b> toque negativo</span><span><b>/</b> block-out</span><span><b>=</b> error</span></div>`
    :'<div class="match-empty">No hay acciones de bloqueo para este filtro.</div>';
};

/* ==========================================================
   ADVANCED BREAK POINT / SIDE-OUT
   ========================================================== */
function v840AllRallies(m,team){
  const setFilter=Number($84('scout-v840-phase-set')?.value)||0,rotFilter=Number($84('scout-v840-phase-rotation')?.value)||0,out=[];
  a84(m?.sets).forEach(set=>a84(set.rallies).forEach((r,ri)=>{
    const rotation=team==='ours'?Number(r.rotationBefore||1):Number(r.opponentRotationBefore||1);
    if(setFilter&&Number(set.number)!==setFilter)return;if(rotFilter&&rotation!==rotFilter)return;
    const phase=r.servingBefore===team?'K2':'K1';
    out.push({set:set.number,index:ri+1,r,rotation,phase,win:r.winner===team,actions:a84(r.actions).filter(a=>a.team===team)});
  }));
  return out;
}
function v840PopulatePhaseSets(m){
  const sel=$84('scout-v840-phase-set');if(!sel)return;const old=sel.value;
  sel.innerHTML='<option value="">Todos</option>'+a84(m?.sets).map(s=>`<option value="${s.number}">Set ${s.number}</option>`).join('');
  if([...sel.options].some(o=>o.value===old))sel.value=old;
}
function v840ReceiverRows(rallies,team){
  const map=new Map();
  rallies.filter(x=>x.phase==='K1').forEach(x=>{
    const r=x.actions.find(a=>a.skill==='R');if(!r)return;
    const key=scoutPlayerKey(r),label=scoutActionPlayerLabel(r);
    if(!map.has(key))map.set(key,{key,label,total:0,won:0,pos:0,perfect:0,err:0});
    const z=map.get(key);z.total++;if(x.win)z.won++;if(['#','+'].includes(r.evaluation))z.pos++;if(r.evaluation==='#')z.perfect++;if(r.evaluation==='=')z.err++;
  });
  return [...map.values()].sort((a,b)=>b.total-a.total);
}
function v840ServerRows(rallies,team){
  const map=new Map();
  rallies.filter(x=>x.phase==='K2').forEach(x=>{
    const s=x.actions.find(a=>a.skill==='S');if(!s)return;
    const key=scoutPlayerKey(s),label=scoutActionPlayerLabel(s);
    if(!map.has(key))map.set(key,{key,label,total:0,bp:0,ace:0,err:0});
    const z=map.get(key);z.total++;if(x.win)z.bp++;if(s.evaluation==='#')z.ace++;if(s.evaluation==='=')z.err++;
  });
  return [...map.values()].sort((a,b)=>b.total-a.total);
}
function v840ReceptionQuality(rallies){
  return ['#','+','!','-','/','='].map(ev=>{
    const rr=rallies.filter(x=>x.phase==='K1'&&x.actions.some(a=>a.skill==='R'&&a.evaluation===ev));
    return {ev,total:rr.length,won:rr.filter(x=>x.win).length};
  }).filter(x=>x.total);
}
function v840Rotations(rallies){
  return [1,2,3,4,5,6].map(no=>{
    const k1=rallies.filter(x=>x.rotation===no&&x.phase==='K1'),k2=rallies.filter(x=>x.rotation===no&&x.phase==='K2');
    return {no,k1:k1.length,k1w:k1.filter(x=>x.win).length,k2:k2.length,k2w:k2.filter(x=>x.win).length};
  });
}
window.scoutV840RenderPhaseAdvanced=function(){
  const m=scoutMatchForAnalysis(),box=$84('scout-v840-phase-advanced');if(!m||!box)return;
  v840PopulatePhaseSets(m);
  const team=$84('scout-v840-phase-team')?.value||'ours',rallies=v840AllRallies(m,team),k1=rallies.filter(x=>x.phase==='K1'),k2=rallies.filter(x=>x.phase==='K2'),
    k1w=k1.filter(x=>x.win).length,k2w=k2.filter(x=>x.win).length,firstAttackKills=k1.filter(x=>x.actions.find(a=>a.skill==='A')?.evaluation==='#').length,
    aceBP=k2.filter(x=>x.actions.some(a=>a.skill==='S'&&a.evaluation==='#')&&x.win).length,transitionBP=k2w-aceBP,
    receivers=v840ReceiverRows(rallies,team),servers=v840ServerRows(rallies,team),quality=v840ReceptionQuality(rallies),rots=v840Rotations(rallies);
  box.innerHTML=`
    <div class="scout-v840-phase-cards">
      <div class="scout-v840-phase-card"><span>Side-out</span><b>${k1.length?pct84(k1w,k1.length)+'%':'—'}</b><small>${k1w}/${k1.length} K1 ganados</small></div>
      <div class="scout-v840-phase-card"><span>1er ataque K1 #</span><b>${k1.length?pct84(firstAttackKills,k1.length)+'%':'—'}</b><small>${firstAttackKills}/${k1.length} rallies</small></div>
      <div class="scout-v840-phase-card"><span>Break Point</span><b>${k2.length?pct84(k2w,k2.length)+'%':'—'}</b><small>${k2w}/${k2.length} al saque</small></div>
      <div class="scout-v840-phase-card"><span>BP por ace</span><b>${k2w?pct84(aceBP,k2w)+'%':'—'}</b><small>${aceBP} de ${k2w} BP</small></div>
      <div class="scout-v840-phase-card"><span>BP transición</span><b>${k2w?pct84(transitionBP,k2w)+'%':'—'}</b><small>${transitionBP} sin ace</small></div>
      <div class="scout-v840-phase-card"><span>Rallies</span><b>${rallies.length}</b><small>K1 ${k1.length} · K2 ${k2.length}</small></div>
    </div>
    <div class="scout-v840-grid">
      <div class="scout-v840-subpanel"><h4>Side-out por receptora</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Receptora</th><th>Rec.</th><th>Pos%</th><th>Exc%</th><th>Err</th><th>SO%</th></tr></thead><tbody>${receivers.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${pct84(x.pos,x.total)}%</td><td>${pct84(x.perfect,x.total)}%</td><td>${x.err}</td><td class="${pct84(x.won,x.total)>=60?'good':pct84(x.won,x.total)<45?'bad':''}">${pct84(x.won,x.total)}%</td></tr>`).join('')||'<tr><td colspan="6">Sin recepción individual codificada.</td></tr>'}</tbody></table></div></div>
      <div class="scout-v840-subpanel"><h4>Break Point por sacadora</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Sacadora</th><th>Saques</th><th>BP</th><th>BP%</th><th>Aces</th><th>Err</th></tr></thead><tbody>${servers.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.bp}</td><td class="${pct84(x.bp,x.total)>=45?'good':pct84(x.bp,x.total)<30?'bad':''}">${pct84(x.bp,x.total)}%</td><td>${x.ace}</td><td>${x.err}</td></tr>`).join('')||'<tr><td colspan="6">Sin saque individual codificado.</td></tr>'}</tbody></table></div></div>
    </div>
    <div class="scout-v840-grid" style="margin-top:8px">
      <div class="scout-v840-subpanel"><h4>Side-out según calidad de recepción</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Recepción</th><th>Rallies</th><th>Ganados</th><th>SO%</th></tr></thead><tbody>${quality.map(x=>`<tr><td><b>${x.ev}</b></td><td>${x.total}</td><td>${x.won}</td><td>${pct84(x.won,x.total)}%</td></tr>`).join('')||'<tr><td colspan="4">Sin recepciones codificadas.</td></tr>'}</tbody></table></div></div>
      <div class="scout-v840-subpanel"><h4>K1 / K2 por rotación</h4><div class="scout-v830-table-wrap"><table class="scout-v830-table"><thead><tr><th>Rot.</th><th>K1</th><th>SO%</th><th>K2</th><th>BP%</th></tr></thead><tbody>${rots.map(x=>`<tr><td><b>R${x.no}</b></td><td>${x.k1}</td><td>${x.k1?pct84(x.k1w,x.k1)+'%':'—'}</td><td>${x.k2}</td><td>${x.k2?pct84(x.k2w,x.k2)+'%':'—'}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
    <div class="scout-v840-editor-help"><b>Lectura:</b> Side-out% = rallies K1 ganados / rallies recibidos. BP% = rallies K2 ganados / rallies iniciados al saque. “1er ataque K1 #” mide si el primer ataque registrado de K1 fue punto; no sustituye al Side-out.</div>`;
};

/* ---------- Hook analysis ---------- */
const v840PerfBase=window.scoutRenderPerformanceAnalytics;
window.scoutRenderPerformanceAnalytics=function(){
  v840PerfBase?.();
  scoutV840RenderBlocking();
  scoutV840RenderPhaseAdvanced();
};
const v840AnalysisBase=window.scoutRenderAnalysis;
window.scoutRenderAnalysis=function(){
  v840AnalysisBase?.();
  scoutV840RenderBlocking();
  scoutV840RenderPhaseAdvanced();
};

/* ---------- Meta text ---------- */
const v840MetaBase=scoutAdvancedMetaText;
scoutAdvancedMetaText=function(a){
  const bits=[];const b=v840MetaBase(a);if(b)bits.push(b);
  if(a?.skill==='B'){
    if(a.startZone)bits.push('Bloqueo Z'+a.startZone);
    if(a.blockTargetNumber)bits.push('vs #'+a.blockTargetNumber);
    if(BLOCK_EVAL[a.evaluation])bits.push(BLOCK_EVAL[a.evaluation]);
  }
  return [...new Set(bits)].join(' · ');
};

/* ---------- CSV action export gets block target ---------- */
const v840CSVBase=window.scoutExportCSV;
window.scoutExportCSV=function(id){
  const m=scoutExportMatch(id);if(!m)return v840CSVBase(id);
  const rows=scoutExportRows(m);
  const headers=['fecha','equipo','rival','competicion','set','rally','marcador_antes','marcador_despues','saque_antes','rotacion_nuestra','rotacion_rival','secuencia','equipo_accion','jugador','fundamento','valoracion','zona_origen','zona_destino','tipo_saque','tipo_saque_recibido','fase','combinacion','direccion_ataque','tempo_ataque','tamano_bloqueo','atacante_objetivo','codigo','tiempo_scout'];
  const data=rows.map(a=>[m.date,EQUIPOS[equipoActivo].nombre,m.opponent,m.competition,a.set,a.rallyIndex,a.scoreBefore,a.scoreAfter,a.servingBefore==='ours'?'Nuestro':'Rival',a.rotation,a.opponentRotation,a.actionIndex,a.team==='ours'?'Nuestro':'Rival',scoutActionPlayerLabel(a),SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,a.startZone,a.endZone,V620_SERVE_LABELS[a.serveType]||a.serveType||'',V830_SERVE?.[a.receivedServeType]||a.receivedServeType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',V830_ATTACK_DIR?.[a.attackDirection]||a.attackDirection||'',a.attackTempo||'',a.blockers??'',a.blockTargetNumber||'',a.code,scoutFormatTime(a.scoutMs)]);
  const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');
  scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_acciones.csv`);
};

/* Init */
scoutUpdateAdvancedFields();

/* ===== INTEGRATED V8.5 CONTEXT/LINEUP/VIDEO NOTES ===== */
const $85=id=>document.getElementById(id);
const a85=v=>Array.isArray(v)?v:[];
const pct85=(n,d)=>d?Math.round(Number(n||0)*100/Number(d||0)):0;
const esc85=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ==========================================================
   CONTEXTUAL SCORE
   ========================================================== */
function v850SetTarget(setNo){return Number(setNo)===5?15:25}
function v850ScoreContext(setNo,us,op){
  us=Number(us)||0;op=Number(op)||0;
  const target=v850SetTarget(setNo),high=Math.max(us,op),diff=us-op,abs=Math.abs(diff);
  const earlyEnd=target===15?5:10,finalStart=target===15?12:20;
  const stage=high<=earlyEnd?'early':high>=finalStart?'final':'middle';
  const stageLabel=stage==='early'?'Inicio':stage==='middle'?'Tramo medio':'Final';
  const close=abs<=2,tied=abs===0;
  const oursSP=us>=target-1&&(us-op)>=1,opSP=op>=target-1&&(op-us)>=1;
  const setPoint=oursSP?'ours':opSP?'opponent':null;
  const pressure=!!setPoint||(stage==='final'&&close);
  return {target,stage,stageLabel,diff,abs,close,tied,setPoint,pressure,label:`${stageLabel}${close?' · cerrado':''}${setPoint?' · punto de set':''}`};
}
function v850AllRallies(m){
  const out=[];a85(m?.sets).forEach(s=>a85(s.rallies).forEach((r,i)=>out.push({set:s.number,index:i+1,r,ctx:v850ScoreContext(s.number,r.scoreBefore?.us,r.scoreBefore?.opponent)})));
  return out;
}
function v850Perspective(row,team){
  const r=row.r,win=r.winner===team,phase=r.servingBefore===team?'K2':'K1',acts=a85(r.actions).filter(a=>a.team===team);
  return {...row,win,phase,acts};
}
function v850ContextStats(rows,team){
  const rr=rows.map(x=>v850Perspective(x,team)),k1=rr.filter(x=>x.phase==='K1'),k2=rr.filter(x=>x.phase==='K2'),
    serve=rr.flatMap(x=>x.acts).filter(a=>a.skill==='S'),att=rr.flatMap(x=>x.acts).filter(a=>a.skill==='A');
  const kills=att.filter(a=>a.evaluation==='#').length,err=att.filter(a=>a.evaluation==='=').length,blk=att.filter(a=>a.evaluation==='/').length;
  return {
    n:rr.length,won:rr.filter(x=>x.win).length,
    winPct:pct85(rr.filter(x=>x.win).length,rr.length),
    k1:k1.length,k1w:k1.filter(x=>x.win).length,k1Pct:pct85(k1.filter(x=>x.win).length,k1.length),
    k2:k2.length,k2w:k2.filter(x=>x.win).length,k2Pct:pct85(k2.filter(x=>x.win).length,k2.length),
    serve:serve.length,serveErr:serve.filter(a=>a.evaluation==='=').length,
    serveErrPct:pct85(serve.filter(a=>a.evaluation==='=').length,serve.length),
    att:att.length,attEff:att.length?Math.round((kills-err-blk)*100/att.length):null
  };
}
function v850CurrentStageRate(m,s){
  const ctx=v850ScoreContext(s?.number||m.currentSet,s?.scoreUs||0,s?.scoreOpponent||0);
  const rows=v850AllRallies(m).filter(x=>Number(x.set)===Number(s?.number||m.currentSet)&&x.ctx.stage===ctx.stage);
  return {ctx,st:v850ContextStats(rows,'ours')};
}
window.scoutV850RenderContextAnalysis=function(){
  const m=scoutMatchForAnalysis?.(),box=$85('scout-v850-context-analysis');if(!box||!m)return;
  const team=$85('scout-v850-context-team')?.value||'ours',setNo=Number($85('scout-v850-context-set')?.value)||0,sel=$85('scout-v850-context-set');
  if(sel){
    const old=sel.value;sel.innerHTML='<option value="">Todos</option>'+a85(m.sets).map(s=>`<option value="${s.number}">Set ${s.number}</option>`).join('');
    if([...sel.options].some(o=>o.value===old))sel.value=old;
  }
  let all=v850AllRallies(m);if(setNo)all=all.filter(x=>Number(x.set)===setNo);
  const groups=[
    ['Inicio',x=>x.ctx.stage==='early'],
    ['Tramo medio',x=>x.ctx.stage==='middle'],
    ['Final',x=>x.ctx.stage==='final'],
    ['Marcador cerrado ±2',x=>x.ctx.close],
    ['Presión',x=>x.ctx.pressure],
    ['Punto de set',x=>!!x.ctx.setPoint]
  ].map(([label,fn])=>({label,st:v850ContextStats(all.filter(fn),team)}));
  box.innerHTML=`<div class="scout-v830-kpis">
    <div><span>Rallies analizados</span><b>${all.length}</b><small>${setNo?'Set '+setNo:'Todos los sets'}</small></div>
    <div><span>Finales cerrados</span><b>${all.filter(x=>x.ctx.stage==='final'&&x.ctx.close).length}</b><small>final + diferencia ≤2</small></div>
    <div><span>Puntos de set</span><b>${all.filter(x=>x.ctx.setPoint).length}</b><small>marcador antes del rally</small></div>
    <div><span>Rallies de presión</span><b>${all.filter(x=>x.ctx.pressure).length}</b><small>cerrado final o set point</small></div>
  </div>
  <div class="scout-v830-table-wrap"><table class="v850-context-table"><thead><tr><th>Contexto</th><th>Rallies</th><th>Ganados</th><th>Win%</th><th>Side-out%</th><th>BP%</th><th>Error saque%</th><th>ATQ EFF</th></tr></thead><tbody>
  ${groups.map(g=>`<tr><td><b>${esc85(g.label)}</b></td><td>${g.st.n}</td><td>${g.st.won}</td><td class="${g.st.n&&g.st.winPct>=55?'good':g.st.n&&g.st.winPct<40?'bad':''}">${g.st.n?g.st.winPct+'%':'—'}</td><td>${g.st.k1?g.st.k1Pct+'%':'—'}</td><td>${g.st.k2?g.st.k2Pct+'%':'—'}</td><td>${g.st.serve?g.st.serveErrPct+'%':'—'}</td><td>${g.st.att?g.st.attEff+'%':'—'}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="scout-v840-editor-help"><b>Criterio:</b> sets a 25 → inicio 0–10, medio 11–19 y final 20+. Set 5 → inicio 0–5, medio 6–11 y final 12+. “Presión” incluye finales con diferencia ≤2 y puntos de set.</div>`;
};

/* ==========================================================
   ADVANCED LINEUP CONTROL
   ========================================================== */
function v850PlayerLabel(id){
  const p=scoutPlayer?.(Number(id));return p?`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`:'—';
}
function v850Role(id){try{return vcPlayerRole?.(Number(id))||''}catch(_){return ''}}
function v850LineupAudit(m){
  const issues=[],warnings=[],ok=[];
  if(!m)return {issues:['Sin partido activo'],warnings,ok,subs:[],base:[],live:[],bench:[]};
  try{vcEnsureProMatch?.(m)}catch(_){}
  const base=SCOUT_POS.map(pos=>({pos,id:Number(m.baseLineup?.ours?.[pos])||null,liveId:Number(m.lineup?.ours?.[pos])||null,role:String(m.lineupRoles?.ours?.[pos]||v850Role(m.baseLineup?.ours?.[pos]))}));
  const ids=base.map(x=>x.id).filter(Boolean),liveIds=base.map(x=>x.liveId).filter(Boolean);
  if(ids.length!==6)issues.push(`Hay ${ids.length}/6 jugadores rotacionales asignados.`);
  else ok.push('Seis rotacionales completos');
  if(new Set(ids).size!==ids.length)issues.push('Hay un jugador repetido en los seis rotacionales.');
  if(liveIds.length!==6)issues.push(`La pista actual contiene ${liveIds.length}/6 jugadores.`);
  if(new Set(liveIds).size!==liveIds.length)issues.push('Hay un jugador repetido en la pista actual.');
  const libId=Number(m.libero?.playerId)||null;
  if(libId&&ids.includes(libId))issues.push('El líbero aparece dentro de los seis rotacionales.');
  if(libId){
    const livePos=base.find(x=>x.liveId===libId)?.pos||'';
    if(livePos&&['p2','p3','p4'].includes(livePos))issues.push(`El líbero está en primera línea (${livePos.toUpperCase()}).`);
    else if(livePos)ok.push(`Líbero activo en ${livePos.toUpperCase()}`);
    else warnings.push('Líbero configurado pero actualmente fuera de pista.');
  }else warnings.push('No hay líbero configurado.');
  const setter=base.find(x=>String(x.role||'').toLowerCase().includes('coloc'));
  if(setter){
    const expected=Number(setter.pos.slice(1));
    if(Number(m.rotationNo)!==expected)warnings.push(`Rotación marcada R${m.rotationNo}, pero el colocador está en ${setter.pos.toUpperCase()} (esperable R${expected}).`);
    else ok.push(`Rotación R${m.rotationNo} coherente con el colocador`);
  }else warnings.push('No se identifica un colocador entre los seis rotacionales.');
  const set=scoutSet?.(m),start=m.workflow?.setLineups?.[String(m.currentSet)];
  if(!start)warnings.push(`No hay foto inicial guardada del Set ${m.currentSet}.`);
  else ok.push(`Foto inicial del Set ${m.currentSet} guardada`);
  const subs=a85(m.events).filter(e=>Number(e.setNumber)===Number(m.currentSet)&&e.team==='ours');
  const realSubs=subs.filter(e=>e.type==='substitution'),libEvents=subs.filter(e=>e.type==='libero'||e.type==='libero_auto');
  if(realSubs.length)ok.push(`${realSubs.length} cambio(s) registrado(s) en el set`);
  const roster=typeof jugadoresEquipo!=='undefined'?a85(jugadoresEquipo):[];
  const used=new Set(liveIds);
  const bench=roster.filter(p=>!used.has(Number(p.id))).map(p=>({id:Number(p.id),label:v850PlayerLabel(p.id),role:v850Role(p.id)}));
  return {issues,warnings,ok,subs,realSubs,libEvents,base,bench,start,set};
}
window.v850LineupAudit=v850LineupAudit;

function v850RenderLineupMini(m){
  const audit=v850LineupAudit(m),sum=$85('v850-lineup-summary'),box=$85('v850-lineup-mini');
  if(sum)sum.textContent=audit.issues.length?`${audit.issues.length} error(es) · revisar`:audit.warnings.length?`${audit.warnings.length} aviso(s) · estructura válida`:'Alineación coherente';
  if(box){
    const chips=[
      {t:audit.issues.length?`${audit.issues.length} errores`:'6/6 OK',c:audit.issues.length?'bad':''},
      {t:`R${m.rotationNo}`,c:audit.warnings.some(x=>x.includes('Rotación marcada'))?'warn':''},
      {t:m.libero?.playerId?(m.libero.activePosition?`LIB ${String(m.libero.activePosition).toUpperCase()}`:'LIB fuera'):'Sin LIB',c:!m.libero?.playerId?'warn':''},
      {t:`${audit.realSubs.length} cambios`,c:''},
      {t:audit.start?'Inicial ✓':'Inicial pendiente',c:audit.start?'':'warn'}
    ];
    box.innerHTML=chips.map(x=>`<span class="v850-lineup-chip ${x.c}">${esc85(x.t)}</span>`).join('');
  }
}
window.v850OpenLineupControl=function(){
  const m=scoutActive?.();if(!m){alert('No hay un scouting activo.');return}
  const a=v850LineupAudit(m),body=$85('v850-lineup-modal-body');if(!body)return;
  body.innerHTML=`
    <div class="v850-audit-head">
      <div><span>Rotación</span><b>R${m.rotationNo} · rival R${m.opponentRotationNo}</b></div>
      <div><span>Set</span><b>${m.currentSet}</b></div>
      <div><span>Cambios registrados</span><b>${a.realSubs.length}</b></div>
      <div><span>Líbero</span><b>${m.libero?.playerId?esc85(v850PlayerLabel(m.libero.playerId)):'No configurado'}</b></div>
    </div>
    <div class="v850-audit-grid">
      <section class="v850-audit-section"><h3>Seis rotacionales / pista actual</h3><div class="v850-six">
        ${a.base.map(x=>{
          const isLib=Number(x.liveId)&&Number(x.liveId)===Number(m.libero?.playerId)&&Number(x.liveId)!==Number(x.id);
          return `<div class="${isLib?'libero':''}"><span>${x.pos.toUpperCase()} · ${VC_POS_META?.[x.pos]?.zone||''}</span><b>${esc85(v850PlayerLabel(x.liveId||x.id))}</b><small>${isLib?'LIB por '+esc85(v850PlayerLabel(x.id)):esc85(x.role||v850Role(x.id))}</small></div>`;
        }).join('')}
      </div></section>
      <section class="v850-audit-section"><h3>Control</h3><div class="v850-audit-list">
        ${a.issues.map(x=>`<div class="v850-audit-item bad">✕ ${esc85(x)}</div>`).join('')}
        ${a.warnings.map(x=>`<div class="v850-audit-item warn">⚠ ${esc85(x)}</div>`).join('')}
        ${a.ok.map(x=>`<div class="v850-audit-item">✓ ${esc85(x)}</div>`).join('')}
      </div></section>
      <section class="v850-audit-section"><h3>Banquillo actual</h3><div class="v850-bench">${a.bench.length?a.bench.map(x=>`<span>${esc85(x.label)}${x.role?' · '+esc85(x.role):''}</span>`).join(''):'<span>Sin jugadores fuera de pista</span>'}</div></section>
      <section class="v850-audit-section"><h3>Cambios / líbero · Set ${m.currentSet}</h3><div class="v850-sub-history">
        ${a.subs.length?a.subs.slice().reverse().map(e=>`<div><time>${e.scoreUs}-${e.scoreOpponent} · ${String(e.position||'').toUpperCase()}</time><span>${e.type==='libero_auto'?'Líbero automático':e.type==='libero'?'Líbero':'Cambio'} · ${esc85(e.outLabel||'—')} → ${esc85(e.inLabel||'—')}</span></div>`).join(''):'<div><span>Sin cambios registrados.</span></div>'}
      </div></section>
    </div>`;
  $85('v850-lineup-modal')?.classList.remove('hidden');document.body.classList.add('v800-lock');
};
window.v850CloseLineupControl=function(){$85('v850-lineup-modal')?.classList.add('hidden');if(!document.fullscreenElement)document.body.classList.remove('v800-lock')};
window.v850SaveInitialSnapshot=function(){
  const m=scoutActive?.();if(!m)return;
  if(typeof scoutV690SaveSetInitial==='function'){scoutV690SaveSetInitial();v850OpenLineupControl();window.v800Render?.()}
};

/* Warn before silently rewriting the six after rallies have started. */
const v850SaveLineupBase=window.scoutSaveLineup;
window.scoutSaveLineup=function(){
  const m=scoutActive?.(),s=scoutSet?.(m);
  if(m&&s&&a85(s.rallies).length){
    const next=SCOUT_POS.map(p=>Number($85(`scout-own-${p}`)?.value)||null);
    const cur=SCOUT_POS.map(p=>Number(m.baseLineup?.ours?.[p])||null);
    const changed=next.some((x,i)=>Number(x)!==Number(cur[i]));
    if(changed&&!confirm(`El Set ${s.number} ya tiene ${s.rallies.length} rallies.\n\nCambiar P1–P6 desde “Alineación” reescribe la rotación actual sin registrar una sustitución. Para un cambio real usa “Cambio / Líbero”.\n\n¿Continuar solo como corrección de datos?`))return false;
  }
  const out=v850SaveLineupBase?.();
  setTimeout(()=>{const mm=scoutActive?.();if(mm){v850RenderLineupMini(mm);window.v800Render?.()}},20);
  return out;
};

/* ==========================================================
   VIDEO-LINKED NOTES
   ========================================================== */
function v850MediaStamp(){
  const bridge=window.VC_MATCH_MODE_MEDIA,d=typeof window.vcRecordingDiagnostics==='function'?window.vcRecordingDiagnostics():null;
  try{
    if(bridge?.isReview?.()&&bridge?.loaded?.()){
      const source=bridge.source?.()||'video';
      return {videoTime:Number(bridge.current?.())||0,videoSource:source==='youtube'?`youtube:${bridge.youtubeId?.()||''}`:`local:${bridge.localName?.()||''}`,videoExact:true,kind:source};
    }
  }catch(_){}
  if(d?.active){
    return {videoTime:Math.max(0,Number(d.elapsedMs||0)/1000),videoSource:`recording:${d.source||'live'}`,videoExact:true,kind:'recording'};
  }
  return {videoTime:null,videoSource:'scout-clock',videoExact:false,kind:'scout'};
}
function v850FmtTime(sec){
  if(sec==null||!Number.isFinite(Number(sec)))return 'sin tiempo exacto';
  sec=Math.max(0,Math.floor(Number(sec)));const m=Math.floor(sec/60),s=sec%60,h=Math.floor(m/60);
  return h?`${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
window.v850OpenVideoNote=function(){
  const m=scoutActive?.(),s=scoutSet?.(m);if(!m||!s){alert('No hay un scouting activo.');return}
  const stamp=v850MediaStamp(),ctx=v850ScoreContext(s.number,s.scoreUs,s.scoreOpponent);
  $85('v850-note-subject').value='';$85('v850-note-text').value='';
  $85('v850-note-time-copy').textContent=stamp.videoExact?`Se guardará en ${v850FmtTime(stamp.videoTime)} del vídeo actual.`:'No hay un vídeo/regrabación con tiempo exacto. Se guardará el reloj del scouting para sincronizarlo después.';
  $85('v850-note-link-status').textContent=stamp.videoExact?`Vinculación exacta · ${v850FmtTime(stamp.videoTime)}`:'Vinculación por reloj de scouting';
  $85('v850-note-context').innerHTML=`Set ${s.number} · <b>${s.scoreUs}-${s.scoreOpponent}</b> · R${m.rotationNo} vs R${m.opponentRotationNo} · ${m.servingTeam==='ours'?'K2 / saque':'K1 / recepción'} · ${esc85(ctx.label)}`;
  $85('v850-note-modal').dataset.stamp=JSON.stringify(stamp);
  $85('v850-note-modal')?.classList.remove('hidden');document.body.classList.add('v800-lock');setTimeout(()=>$85('v850-note-subject')?.focus(),20);
};
window.v850CloseVideoNote=function(){$85('v850-note-modal')?.classList.add('hidden');if(!document.fullscreenElement)document.body.classList.remove('v800-lock')};
window.v850SaveVideoNote=function(){
  const m=scoutV690EnsureMatch?.(),s=scoutSet?.(m);if(!m||!s)return;
  const subject=String($85('v850-note-subject')?.value||'').trim(),note=String($85('v850-note-text')?.value||'').trim();
  if(!subject&&!note){alert('Escribe un título o una nota.');return}
  let stamp={};try{stamp=JSON.parse($85('v850-note-modal')?.dataset?.stamp||'{}')}catch(_){}
  const ctx=v850ScoreContext(s.number,s.scoreUs,s.scoreOpponent),id=Date.now();
  m.workflow.events.push({
    id,uid:`evt_${id}`,type:'note',subject,note,noteCategory:String($85('v850-note-category')?.value||'Táctica'),
    setNumber:s.number,scoreUs:s.scoreUs,scoreOpponent:s.scoreOpponent,rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,
    createdAt:scoutNow(),scoutMs:scoutElapsed(m),videoTime:stamp.videoTime==null?null:Number(stamp.videoTime),
    videoSource:String(stamp.videoSource||''),videoExact:!!stamp.videoExact,contextLabel:ctx.label
  });
  scoutSave(false);v850CloseVideoNote();window.v800Render?.();try{scoutV690RenderWorkflow?.()}catch(_){}
};
function v850VideoNotes(m){
  return a85(m?.workflow?.events).filter(e=>e.type==='note').slice(-5).reverse();
}
function v850RenderVideoNotes(m){
  const box=$85('v850-video-notes');if(!box)return;
  const notes=v850VideoNotes(m);
  box.innerHTML=notes.length?notes.map(e=>`<div class="v850-video-note"><time>${e.videoTime!=null?'▶ '+v850FmtTime(e.videoTime):'⏱ '+scoutV6100FmtMs?.(e.scoutMs||0)}</time><div><b>${esc85(e.noteCategory||'Nota')}${e.subject?' · '+esc85(e.subject):''}</b><small>${esc85(e.note||e.contextLabel||'')}</small></div><button class="ghost" onclick="v850PlayNote('${String(e.uid||e.id).replace(/'/g,"\\'")}')">Ver</button></div>`).join(''):'';
}
window.v850PlayNote=function(uid){
  const m=scoutActive?.(),e=a85(m?.workflow?.events).find(x=>String(x.uid||x.id)===String(uid));if(!m||!e)return;
  const bridge=window.VC_MATCH_MODE_MEDIA;
  if(e.videoTime!=null&&bridge?.isReview?.()&&bridge?.loaded?.()){
    try{bridge.seek?.(Math.max(0,Number(e.videoTime)-2));bridge.play?.();return}catch(_){}
  }
  const btn=typeof botonVista==='function'?botonVista('scout-video-hub'):document.querySelector('.tab-btn[data-view="scout-video-hub"]');
  showView?.('scout-video-hub',btn);
  setTimeout(()=>{
    try{
      const sel=$85('v780-match');if(sel){sel.value=String(m.id);window.v780MatchChanged?.()}
      setTimeout(()=>{const key=`e:${String(e.uid||e.id)}`;window.v780Select?.(key);window.v780PlayKey?.(key)},140);
    }catch(_){}
  },80);
};

/* Timestamp substitution/libero events when created from Match Mode. */
function v850StampNewEvents(m,before){
  const list=a85(m?.events);if(list.length<=before)return;
  const stamp=v850MediaStamp();
  list.slice(before).forEach(e=>{
    if(e.videoTime==null&&stamp.videoExact){e.videoTime=stamp.videoTime;e.videoSource=stamp.videoSource;e.videoExact=true}
  });
  scoutSave(false);
}
const v850SubBase=window.scoutApplySubstitution;
window.scoutApplySubstitution=function(...args){
  const m=scoutActive?.(),before=a85(m?.events).length,out=v850SubBase?.apply(this,args);
  const mm=scoutActive?.();if(mm){v850StampNewEvents(mm,before);setTimeout(()=>{v850RenderLineupMini(mm);window.v800Render?.()},20)}
  return out;
};

/* ==========================================================
   MATCH MODE EXTRA RENDER
   ========================================================== */
window.v850RenderMatchExtras=function(m,s){
  if(!m||!s)return;
  const {ctx,st}=v850CurrentStageRate(m,s),diff=Number(s.scoreUs||0)-Number(s.scoreOpponent||0);
  if($85('v850-context-stage'))$85('v850-context-stage').textContent=ctx.stageLabel.toUpperCase();
  if($85('v850-context-copy'))$85('v850-context-copy').textContent=`${s.scoreUs}-${s.scoreOpponent} · objetivo ${ctx.target}`;
  if($85('v850-context-diff'))$85('v850-context-diff').textContent=diff>0?`+${diff}`:String(diff);
  if($85('v850-context-close'))$85('v850-context-close').textContent=ctx.tied?'Empate':ctx.close?'Diferencia ≤2':diff>0?'Ventaja nuestra':'Ventaja rival';
  if($85('v850-context-phase'))$85('v850-context-phase').textContent=m.servingTeam==='ours'?'K2':'K1';
  if($85('v850-context-phase-copy'))$85('v850-context-phase-copy').textContent=m.servingTeam==='ours'?'Saque / Break Point':'Recepción / Side-out';
  if($85('v850-context-rate'))$85('v850-context-rate').textContent=st.n?`${st.winPct}%`:'—';
  if($85('v850-context-rate-copy'))$85('v850-context-rate-copy').textContent=st.n?`${st.won}/${st.n} rallies ganados en ${ctx.stageLabel.toLowerCase()}`:'Sin rallies en este tramo';
  const p=$85('v850-pressure-box');if(p)p.className=ctx.setPoint?'setpoint':ctx.pressure?'pressure':'';
  if($85('v850-context-pressure'))$85('v850-context-pressure').textContent=ctx.setPoint?(ctx.setPoint==='ours'?'SET POINT NUESTRO':'SET POINT RIVAL'):ctx.pressure?'ALTA':'NORMAL';
  if($85('v850-context-pressure-copy'))$85('v850-context-pressure-copy').textContent=ctx.setPoint?'El siguiente punto puede cerrar el set':ctx.pressure?'Final con marcador cerrado':'Sin punto de set';
  v850RenderLineupMini(m);v850RenderVideoNotes(m);
};

/* Stamp newly created libero-auto events and refresh after points. */
const v850PointBase=window.scoutAwardPoint;
window.scoutAwardPoint=function(...args){
  const m=scoutActive?.(),before=a85(m?.events).length,out=v850PointBase?.apply(this,args);
  const mm=scoutActive?.();if(mm){v850StampNewEvents(mm,before);setTimeout(()=>window.v800Render?.(),20)}
  return out;
};

/* Analysis hook */
const v850AnalysisBase=window.scoutRenderAnalysis;
window.scoutRenderAnalysis=function(){
  v850AnalysisBase?.();
  scoutV850RenderContextAnalysis();
};

/* Enhance post-match note labels without changing its statistics. */
const v850PostRender=window.v820Render;
if(typeof v850PostRender==='function')window.v820Render=function(){
  const out=v850PostRender();
  const m=(window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()||[]).find(x=>Number(x.id)===Number($85('v820-match')?.value))||window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.();
  const box=$85('v820-events');
  if(m&&box){
    const ev=[...a85(m.workflow?.events),...a85(m.events)].sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
    box.innerHTML=ev.length?ev.map(e=>`<article class="v820-event-row"><time>S${e.setNumber||'—'} · ${e.scoreUs??0}-${e.scoreOpponent??0}${e.videoTime!=null?' · '+v850FmtTime(e.videoTime):''}</time><div><strong>${e.type==='note'?'Nota '+esc85(e.noteCategory||'táctica'):(typeof EVENT_LABELS!=='undefined'?(EVENT_LABELS[e.type]||e.type):e.type)}</strong><small>${esc85(e.subject||e.outLabel&&e.inLabel?`${e.outLabel||''} → ${e.inLabel||''}`:e.note||'')}</small></div><span></span></article>`).join(''):'<div class="match-empty">No hay eventos registrados.</div>';
  }
  return out;
};

/* Modal backdrop close */
['v850-lineup-modal','v850-note-modal'].forEach(id=>$85(id)?.addEventListener('click',e=>{if(e.target?.id===id){id==='v850-lineup-modal'?v850CloseLineupControl():v850CloseVideoNote()}}));

/* ===== INTEGRATED V8.5.1 CONTROL FIX (nested) ===== */

(()=>{
'use strict';
const VERSION='8.5.1';
const POS=['p1','p2','p3','p4','p5','p6'];
const $f=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const clone=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v??null))}};
const now=()=>new Date().toISOString();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function resolveMatch(){
  let m=null;
  try{if(typeof scoutActive==='function')m=scoutActive()}catch(_){}
  if(!m)try{m=bridge()?.getActive?.()||null}catch(_){}
  if(m)return m;

  // If Match Mode has a selected saved in-progress scouting, reactivate it.
  const selected=Number($f('v800-match-select')?.value)||0;
  if(selected){
    try{
      m=bridge()?.activateMatch?.(selected)||null;
      if(m)return m;
    }catch(_){}
  }

  // Last fallback: lineup modal may remember the match id.
  const modalId=Number($f('scout-lineup-modal')?.dataset?.matchId)||0;
  if(modalId){
    try{
      m=bridge()?.activateMatch?.(modalId)||null;
      if(m)return m;
    }catch(_){}
  }
  return null;
}
function setOf(m){
  if(!m)return null;
  try{if(typeof scoutSet==='function')return scoutSet(m)}catch(_){}
  return arr(m.sets).find(s=>Number(s.number)===Number(m.currentSet))||arr(m.sets)[0]||null;
}
function roster(){
  try{const r=bridge()?.getPlayers?.();if(Array.isArray(r))return r}catch(_){}
  try{if(typeof jugadoresEquipo!=='undefined'&&Array.isArray(jugadoresEquipo))return jugadoresEquipo}catch(_){}
  return [];
}
function player(id){
  const p=roster().find(x=>Number(x.id)===Number(id));
  return p?`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`:'—';
}
function role(id){
  try{if(typeof vcPlayerRole==='function')return String(vcPlayerRole(Number(id))||'')}catch(_){}
  const p=roster().find(x=>Number(x.id)===Number(id));
  return String(p?.position||p?.role||'');
}
function hasRole(id,name){
  try{
    if(typeof vcHasRole==='function'){
      const p=typeof scoutPlayer==='function'?scoutPlayer(Number(id)):roster().find(x=>Number(x.id)===Number(id));
      return !!vcHasRole(p,name);
    }
  }catch(_){}
  return role(id).toLowerCase().includes(String(name).toLowerCase());
}
function ensureStructures(m){
  if(!m.baseLineup)m.baseLineup={ours:{},opponent:{}};
  if(!m.lineup)m.lineup={ours:{},opponent:{}};
  if(!m.lineupRoles)m.lineupRoles={ours:{},opponent:{}};
  if(!m.libero)m.libero={playerId:null,enabled:false,auto:true,centralIds:[],activeForId:null,activePosition:''};
  if(!m.workflow)m.workflow={setLineups:{},events:[]};
  if(!m.workflow.setLineups)m.workflow.setLineups={};
  if(!Array.isArray(m.workflow.events))m.workflow.events=[];
  if(!Array.isArray(m.events))m.events=[];
  POS.forEach(p=>{
    if(!(p in m.baseLineup.ours))m.baseLineup.ours[p]=null;
    if(!(p in m.baseLineup.opponent))m.baseLineup.opponent[p]='';
    if(!(p in m.lineup.ours))m.lineup.ours[p]=m.baseLineup.ours[p]||null;
    if(!(p in m.lineup.opponent))m.lineup.opponent[p]=m.baseLineup.opponent[p]||'';
    if(!(p in m.lineupRoles.ours))m.lineupRoles.ours[p]='';
    if(!(p in m.lineupRoles.opponent))m.lineupRoles.opponent[p]='';
  });
  try{if(typeof vcEnsureProMatch==='function')vcEnsureProMatch(m)}catch(_){}
  return m;
}
function persist(m){
  m.updatedAt=now();
  try{if(typeof scoutRefreshActionPlayers==='function')scoutRefreshActionPlayers()}catch(_){}
  try{if(typeof scoutSave==='function')scoutSave(false); else bridge()?.save?.()}catch(_){try{bridge()?.save?.()}catch(__){}}
  try{if(typeof scoutRender==='function')scoutRender()}catch(_){}
  try{if(typeof scoutV690RenderWorkflow==='function')scoutV690RenderWorkflow()}catch(_){}
  try{window.v800Render?.()}catch(_){}
}
function closeLineupModal(){
  const modal=$f('scout-lineup-modal');
  if(modal){modal.classList.remove('open');modal.removeAttribute('data-match-id')}
}

/* ------------------------------
   1) ROBUST LINEUP SAVE
   ------------------------------ */
window.v851SaveLineup=function(){
  const m=ensureStructures(resolveMatch());
  if(!m){alert('No encuentro el scouting activo. Abre el partido desde Modo Partido o Partidos guardados y vuelve a intentarlo.');return false}
  if(m.status==='finished'){alert('Este scouting está finalizado y no se puede modificar.');return false}

  const controls=POS.map(pos=>({pos,el:$f(`scout-own-${pos}`)}));
  if(controls.some(x=>!x.el)){
    alert('La ventana de alineación no está preparada. Ciérrala, vuelve a pulsar “Alineación” y prueba de nuevo.');
    return false;
  }
  const ids=controls.map(x=>Number(x.el.value)||null);
  const missing=POS.filter((_,i)=>!ids[i]);
  if(missing.length){
    alert(`Faltan jugadores en ${missing.map(x=>x.toUpperCase()).join(', ')}. Debes asignar exactamente seis rotacionales.`);
    return false;
  }
  if(new Set(ids).size!==6){alert('Hay un jugador repetido. Cada posición P1–P6 debe tener un jugador distinto.');return false}

  const libId=Number($f('scout-lineup-libero')?.value)||null;
  if(libId&&ids.includes(libId)){alert('El líbero no puede estar también dentro de los seis rotacionales.');return false}
  const badLib=ids.find(id=>hasRole(id,'Líbero'));
  if(badLib){alert(`${player(badLib)} está marcado como líbero y no puede formar parte de los seis rotacionales.`);return false}

  const s=setOf(m);
  if(s&&arr(s.rallies).length){
    const old=POS.map(p=>Number(m.baseLineup?.ours?.[p])||null);
    const changed=ids.some((id,i)=>id!==old[i]);
    if(changed&&!confirm(`El Set ${s.number} ya tiene ${arr(s.rallies).length} rallies.\n\nEsto modificará P1–P6 como corrección de datos. Para una sustitución real usa “Cambio / Líbero”.\n\n¿Guardar igualmente?`))return false;
  }

  POS.forEach((pos,i)=>{
    const id=ids[i];
    const rival=String($f(`scout-rival-${pos}`)?.value||'').trim();
    m.baseLineup.ours[pos]=id;
    m.baseLineup.opponent[pos]=rival;
    m.lineupRoles.ours[pos]=role(id);
    m.lineupRoles.opponent[pos]=String($f(`scout-rival-role-${pos}`)?.value||'');
  });
  m.rotationNo=Math.min(6,Math.max(1,Number($f('scout-lineup-rotation')?.value)||1));
  m.opponentRotationNo=Math.min(6,Math.max(1,Number($f('scout-lineup-rival-rotation')?.value)||1));

  m.libero.playerId=libId;
  m.libero.enabled=!!libId;
  m.libero.auto=$f('scout-lineup-libero-auto')?.checked!==false;
  m.libero.centralIds=ids.filter(id=>hasRole(id,'Central'));
  m.libero.activeForId=null;
  m.libero.activePosition='';

  // Live lineup starts from the six rotational players, then auto-libero may replace a central.
  m.lineup.ours=clone(m.baseLineup.ours);
  m.lineup.opponent=clone(m.baseLineup.opponent);
  try{if(typeof vcApplyAutoLibero==='function')vcApplyAutoLibero(m,false)}catch(_){}

  // Initial snapshot if the set has not started.
  if(s&&!arr(s.rallies).length&&!m.workflow.setLineups[String(m.currentSet)]){
    m.workflow.setLineups[String(m.currentSet)]={
      baseLineup:clone(m.baseLineup),lineup:clone(m.lineup),lineupRoles:clone(m.lineupRoles),
      libero:clone(m.libero),rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,savedAt:now()
    };
  }

  persist(m);
  closeLineupModal();
  const badge=$f('scout-save-badge');
  if(badge)badge.textContent='Alineación guardada · sesión abierta';
  setTimeout(()=>{if(badge&&badge.textContent.startsWith('Alineación guardada'))badge.textContent='Sesión abierta · auto-protección'},2200);
  return true;
};
// Make every old “Guardar alineación” call use the fixed implementation.
window.scoutSaveLineup=window.v851SaveLineup;

/* ------------------------------
   2) ROBUST LINEUP CONTROL
   ------------------------------ */
function audit(m){
  m=ensureStructures(m);
  const issues=[],warnings=[],ok=[];
  const base=POS.map(pos=>({
    pos,
    id:Number(m.baseLineup.ours[pos])||null,
    liveId:Number(m.lineup.ours[pos])||null,
    role:String(m.lineupRoles.ours[pos]||role(m.baseLineup.ours[pos]))
  }));
  const baseIds=base.map(x=>x.id).filter(Boolean),liveIds=base.map(x=>x.liveId).filter(Boolean);
  if(baseIds.length!==6)issues.push(`Seis rotacionales incompletos: ${baseIds.length}/6.`);
  else ok.push('Seis rotacionales completos');
  if(new Set(baseIds).size!==baseIds.length)issues.push('Hay jugadores duplicados en P1–P6.');
  if(liveIds.length!==6)issues.push(`Pista actual incompleta: ${liveIds.length}/6.`);
  if(new Set(liveIds).size!==liveIds.length)issues.push('Hay jugadores duplicados en la pista actual.');

  const libId=Number(m.libero?.playerId)||null;
  if(libId&&baseIds.includes(libId))issues.push('El líbero aparece dentro de los seis rotacionales.');
  const libPos=base.find(x=>x.liveId===libId)?.pos||'';
  if(libId&&['p2','p3','p4'].includes(libPos))issues.push(`El líbero está en primera línea (${libPos.toUpperCase()}).`);
  else if(libId&&libPos)ok.push(`Líbero activo en ${libPos.toUpperCase()}`);
  else if(libId)warnings.push('Líbero configurado, actualmente fuera de pista.');
  else warnings.push('No hay líbero configurado.');

  const setter=base.find(x=>String(x.role).toLowerCase().includes('coloc'));
  if(setter){
    const expected=Number(setter.pos.slice(1));
    if(Number(m.rotationNo)!==expected)warnings.push(`Marcador R${m.rotationNo}; colocador en ${setter.pos.toUpperCase()} (referencia R${expected}).`);
    else ok.push(`R${m.rotationNo} coherente con la posición del colocador`);
  }else warnings.push('No se identifica un colocador en los seis rotacionales.');

  const s=setOf(m),snap=m.workflow?.setLineups?.[String(m.currentSet)];
  if(snap)ok.push(`Foto inicial del Set ${m.currentSet} guardada`);
  else warnings.push(`Falta foto inicial del Set ${m.currentSet}.`);

  const subs=arr(m.events).filter(e=>Number(e.setNumber)===Number(m.currentSet)&&e.team==='ours');
  const realSubs=subs.filter(e=>e.type==='substitution');
  if(realSubs.length)ok.push(`${realSubs.length} cambio(s) registrado(s) en el set`);

  const used=new Set(liveIds);
  const bench=roster().filter(p=>!used.has(Number(p.id)));
  return {issues,warnings,ok,base,subs,realSubs,bench,snap,s};
}
window.v851OpenLineupControl=function(){
  const m=resolveMatch();
  if(!m){alert('No hay un scouting activo. Abre un partido en Modo Partido y vuelve a intentarlo.');return false}
  const modal=$f('v850-lineup-modal'),body=$f('v850-lineup-modal-body');
  if(!modal||!body){alert('No encuentro la ventana de Control de alineación. Recarga la aplicación con Ctrl+F5.');return false}
  const a=audit(m);
  const posMeta=(pos)=>{
    try{if(typeof VC_POS_META!=='undefined')return VC_POS_META[pos]?.zone||''}catch(_){}
    return '';
  };
  body.innerHTML=`
    <div class="v850-audit-head">
      <div><span>Rotación</span><b>R${m.rotationNo||1} · rival R${m.opponentRotationNo||1}</b></div>
      <div><span>Set</span><b>${m.currentSet||1}</b></div>
      <div><span>Cambios</span><b>${a.realSubs.length}</b></div>
      <div><span>Líbero</span><b>${m.libero?.playerId?esc(player(m.libero.playerId)):'No configurado'}</b></div>
    </div>
    <div class="v850-audit-grid">
      <section class="v850-audit-section"><h3>Seis rotacionales / pista actual</h3><div class="v850-six">
        ${a.base.map(x=>{
          const isLib=Number(x.liveId)&&Number(x.liveId)===Number(m.libero?.playerId)&&Number(x.liveId)!==Number(x.id);
          return `<div class="${isLib?'libero':''}"><span>${x.pos.toUpperCase()}${posMeta(x.pos)?' · '+esc(posMeta(x.pos)):''}</span><b>${esc(player(x.liveId||x.id))}</b><small>${isLib?'LIB por '+esc(player(x.id)):esc(x.role||role(x.id))}</small></div>`;
        }).join('')}
      </div></section>
      <section class="v850-audit-section"><h3>Control</h3><div class="v850-audit-list">
        ${a.issues.map(x=>`<div class="v850-audit-item bad">✕ ${esc(x)}</div>`).join('')}
        ${a.warnings.map(x=>`<div class="v850-audit-item warn">⚠ ${esc(x)}</div>`).join('')}
        ${a.ok.map(x=>`<div class="v850-audit-item">✓ ${esc(x)}</div>`).join('')}
      </div></section>
      <section class="v850-audit-section"><h3>Banquillo actual</h3><div class="v850-bench">${a.bench.length?a.bench.map(p=>`<span>${esc(player(p.id))}${role(p.id)?' · '+esc(role(p.id)):''}</span>`).join(''):'<span>Sin jugadores fuera de pista.</span>'}</div></section>
      <section class="v850-audit-section"><h3>Cambios / Líbero · Set ${m.currentSet||1}</h3><div class="v850-sub-history">
        ${a.subs.length?a.subs.slice().reverse().map(e=>`<div><time>${e.scoreUs??0}-${e.scoreOpponent??0} · ${esc(String(e.position||'').toUpperCase())}</time><span>${e.type==='libero_auto'?'Líbero automático':e.type==='libero'?'Líbero':'Cambio'} · ${esc(e.outLabel||'—')} → ${esc(e.inLabel||'—')}</span></div>`).join(''):'<div><span>Sin cambios registrados.</span></div>'}
      </div></section>
    </div>`;
  const status=$f('v851-lineup-control-status');
  if(status)status.textContent=a.issues.length?`${a.issues.length} error(es) detectado(s).`:a.warnings.length?`${a.warnings.length} aviso(s); estructura utilizable.`:'Alineación coherente.';
  modal.classList.remove('hidden');
  document.body.classList.add('v800-lock');
  return true;
};
window.v851CloseLineupControl=function(){
  $f('v850-lineup-modal')?.classList.add('hidden');
  if(!document.fullscreenElement)document.body.classList.remove('v800-lock');
};
window.v851SaveInitialSnapshot=function(){
  const m=ensureStructures(resolveMatch()),s=setOf(m);
  if(!m||!s){alert('No hay un set activo.');return false}
  m.workflow.setLineups[String(m.currentSet)]={
    baseLineup:clone(m.baseLineup),lineup:clone(m.lineup),lineupRoles:clone(m.lineupRoles),
    libero:clone(m.libero),rotationNo:m.rotationNo,opponentRotationNo:m.opponentRotationNo,savedAt:now()
  };
  persist(m);
  window.v851OpenLineupControl();
  return true;
};
// Backward-compatible aliases.
window.v850OpenLineupControl=window.v851OpenLineupControl;
window.v850CloseLineupControl=window.v851CloseLineupControl;
window.v850SaveInitialSnapshot=window.v851SaveInitialSnapshot;

/* ------------------------------
   3) ROBUST VIDEO NOTE
   ------------------------------ */
function mediaStamp(){
  const media=window.VC_MATCH_MODE_MEDIA;
  try{
    if(media?.isReview?.()&&media?.loaded?.()){
      const source=String(media.source?.()||'video');
      return {
        videoTime:Number(media.current?.())||0,
        videoSource:source==='youtube'?`youtube:${media.youtubeId?.()||''}`:`local:${media.localName?.()||''}`,
        videoExact:true,kind:source
      };
    }
  }catch(_){}
  try{
    const d=typeof window.vcRecordingDiagnostics==='function'?window.vcRecordingDiagnostics():null;
    if(d?.active)return {videoTime:Math.max(0,Number(d.elapsedMs||0)/1000),videoSource:`recording:${d.source||'live'}`,videoExact:true,kind:'recording'};
  }catch(_){}
  return {videoTime:null,videoSource:'scout-clock',videoExact:false,kind:'scout'};
}
function fmt(sec){
  if(sec==null||!Number.isFinite(Number(sec)))return 'sin tiempo exacto';
  sec=Math.max(0,Math.floor(Number(sec)));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function scoutMs(m){
  try{if(typeof scoutElapsed==='function')return Number(scoutElapsed(m))||0}catch(_){}
  const start=Date.parse(m?.clockStartedAt||m?.createdAt||'');
  return Number.isFinite(start)?Math.max(0,Date.now()-start):0;
}
window.v851OpenVideoNote=function(){
  const m=ensureStructures(resolveMatch()),s=setOf(m);
  if(!m||!s){alert('No hay un scouting activo. Abre el partido en Modo Partido y vuelve a intentarlo.');return false}
  const modal=$f('v850-note-modal');
  if(!modal){alert('No encuentro la ventana de Nota vídeo. Recarga con Ctrl+F5.');return false}
  const stamp=mediaStamp();
  const subject=$f('v850-note-subject'),text=$f('v850-note-text');
  if(subject)subject.value='';if(text)text.value='';
  const copy=$f('v850-note-time-copy');
  if(copy)copy.textContent=stamp.videoExact?`Se guardará en ${fmt(stamp.videoTime)} del vídeo/REC actual.`:'Se guardará con el reloj del scouting para sincronizarlo después.';
  const status=$f('v850-note-link-status');
  if(status)status.textContent=stamp.videoExact?`Vinculación exacta · ${fmt(stamp.videoTime)}`:'Vinculación por reloj del scouting';
  const ctx=$f('v850-note-context');
  if(ctx)ctx.innerHTML=`Set ${s.number||m.currentSet} · <b>${s.scoreUs||0}-${s.scoreOpponent||0}</b> · R${m.rotationNo||1} vs R${m.opponentRotationNo||1} · ${m.servingTeam==='ours'?'K2 / saque':'K1 / recepción'}`;
  modal.dataset.stamp=JSON.stringify(stamp);
  modal.classList.remove('hidden');document.body.classList.add('v800-lock');
  setTimeout(()=>subject?.focus(),20);
  return true;
};
window.v851CloseVideoNote=function(){
  $f('v850-note-modal')?.classList.add('hidden');
  if(!document.fullscreenElement)document.body.classList.remove('v800-lock');
};
window.v851SaveVideoNote=function(){
  const m=ensureStructures(resolveMatch()),s=setOf(m);
  if(!m||!s){alert('No hay un scouting activo.');return false}
  const subject=String($f('v850-note-subject')?.value||'').trim();
  const note=String($f('v850-note-text')?.value||'').trim();
  if(!subject&&!note){alert('Escribe un título o una nota.');return false}
  let stamp={};try{stamp=JSON.parse($f('v850-note-modal')?.dataset?.stamp||'{}')}catch(_){}
  const id=Date.now();
  m.workflow.events.push({
    id,uid:`evt_${id}`,type:'note',
    subject,note,noteCategory:String($f('v850-note-category')?.value||'Táctica'),
    setNumber:Number(s.number||m.currentSet)||1,
    scoreUs:Number(s.scoreUs)||0,scoreOpponent:Number(s.scoreOpponent)||0,
    rotationNo:Number(m.rotationNo)||1,opponentRotationNo:Number(m.opponentRotationNo)||1,
    createdAt:now(),scoutMs:scoutMs(m),
    videoTime:stamp.videoTime==null?null:Number(stamp.videoTime),
    videoSource:String(stamp.videoSource||''),
    videoExact:!!stamp.videoExact,
    contextLabel:''
  });
  persist(m);
  window.v851CloseVideoNote();
  return true;
};
window.v850OpenVideoNote=window.v851OpenVideoNote;
window.v850CloseVideoNote=window.v851CloseVideoNote;
window.v850SaveVideoNote=window.v851SaveVideoNote;

window.v851Diagnostics=()=>({
  version:VERSION,
  match:resolveMatch()?.id||null,
  saveLineup:typeof window.v851SaveLineup,
  lineupControl:typeof window.v851OpenLineupControl,
  videoNote:typeof window.v851OpenVideoNote,
  lineupModal:!!$f('scout-lineup-modal'),
  controlModal:!!$f('v850-lineup-modal'),
  noteModal:!!$f('v850-note-modal')
});
})();



/* =====================================================================
   V8.5.7 · REBUILT SHARED SCOUT CORE
   This code intentionally lives INSIDE scouting-pro-v600-script.
   ===================================================================== */
const V857_VERSION='8.5.7';
let v857PointBusy=false,v857UndoBusy=false,v857CodeBusy=false;

function v857Status(msg,type=''){
  const el=document.getElementById('v855-match-status');
  if(!el)return;
  el.textContent=msg;
  el.className='v855-match-status'+(type?' '+type:'');
}
function v857CodeStatus(msg,type=''){
  const el=document.getElementById('v852-code-status');
  if(!el)return;
  el.textContent=msg;
  el.className='v852-code-status'+(type?' '+type:'');
}
function v857SelectedMatch(){
  const id=Number(document.getElementById('v800-match-select')?.value)||0;
  let m=scoutActive();
  if(id&&Number(m?.id)!==id){
    try{window.VC_SCOUT_VIDEO_BRIDGE?.activateMatch?.(id)}catch(_){}
    m=scoutActive();
  }
  return m||scoutActive();
}
function v857Set(m){return m?scoutSet(m):null}
function v857LiveCount(m){return scoutArr(m?.liveRally?.actions).length}
function v857RallyCount(s){return scoutArr(s?.rallies).length}
function v857Score(s){return {us:Number(s?.scoreUs)||0,op:Number(s?.scoreOpponent)||0}}

function v857RenderMatchState(m=v857SelectedMatch(),s=v857Set(m)){
  if(!m||!s)return;
  const actions=scoutArr(m.liveRally?.actions);
  const title=document.getElementById('v855-live-rally-title');
  const saveTxt=document.getElementById('v855-live-rally-save');
  const box=document.getElementById('v855-live-actions');
  if(title)title.textContent=`Rally actual · ${actions.length} acción${actions.length===1?'':'es'}`;
  if(saveTxt)saveTxt.textContent=actions.length?'Guardadas en la sesión':'Sin acciones pendientes';
  if(box){
    box.innerHTML=actions.length
      ? actions.map(a=>`<span class="action">${esc(a.code||scoutBuildCode(a)||'Acción')}</span>`).join('')
      : '<span class="empty">Añade acciones antes de cerrar el punto.</span>';
  }
}
window.v857RenderMatchState=v857RenderMatchState;
window.v855RenderMatchState=v857RenderMatchState;

function v857Refresh(){
  try{scoutRender()}catch(_){}
  try{window.v800Render?.()}catch(_){}
  try{v857RenderMatchState()}catch(_){}
}

function v857Preprocess(raw){
  raw=String(raw||'');
  try{if(typeof scoutV690PreprocessCode==='function')raw=scoutV690PreprocessCode(raw)}catch(_){}
  return String(raw||'').trim();
}

function v857RegisterRaw(raw,m=scoutActive()){
  raw=v857Preprocess(raw);
  if(!raw)return {ok:false,error:'Código vacío.'};
  if(!m||m.status==='finished')return {ok:false,error:'No hay un scouting activo.'};
  const s=scoutSet(m);
  if(!s||s.finished)return {ok:false,error:'El set está cerrado.'};

  const before=v857LiveCount(m);
  const parsed=scoutV6108ParseRaw(raw,m,null);
  if(parsed?.error||!parsed?.action){
    return {ok:false,error:parsed?.error||'Código no reconocido.',before,after:before};
  }

  const pushed=scoutPushAction(parsed.action);
  const after=v857LiveCount(m);
  if(pushed===false||after!==before+1){
    return {ok:false,error:'La acción no se ha añadido al rally.',before,after};
  }
  return {
    ok:true,before,after,match:m,
    action:scoutArr(m.liveRally?.actions).slice(-1)[0],
    raw:String(raw).toUpperCase().replace(/\s+/g,'')
  };
}

function v857StampVideo(action){
  if(!action)return;
  const media=window.VC_MATCH_MODE_MEDIA;
  try{
    if(media?.isReview?.()&&media?.loaded?.()){
      action.videoTime=Number(media.current?.())||0;
      action.videoSource=String(media.source?.()||'video');
      scoutSave(false);
      return;
    }
  }catch(_){}
  try{
    const d=typeof window.vcRecordingDiagnostics==='function'?window.vcRecordingDiagnostics():null;
    if(d?.active){
      action.videoTime=Math.max(0,Number(d.elapsedMs||0)/1000);
      action.videoSource=`recording:${d.source||'live'}`;
      scoutSave(false);
    }
  }catch(_){}
}

/* COMPLETE SCOUTING: canonical quick-code function. */
window.scoutAddCode=function(){
  const input=document.getElementById('scout-code-input');
  const result=v857RegisterRaw(input?.value||'',scoutActive());
  if(!result.ok){
    if(result.error!=='Código vacío.'){
      alert(result.error+'\n\nAbre “Chuleta” para revisar la sintaxis.');
    }
    input?.focus();
    return false;
  }
  if(input){
    input.value='';
    try{
      if(typeof scoutV690Settings!=='function'||scoutV690Settings().autoFocus!==false)input.focus();
    }catch(_){input.focus()}
  }
  return true;
};

/* MATCH MODE: same parser + same scoutPushAction, no alternate parser. */
window.v857AddCode=function(){
  if(v857CodeBusy)return false;
  v857CodeBusy=true;
  try{
    const input=document.getElementById('v800-code');
    const raw=String(input?.value||'');
    if(!raw.trim()){
      v857CodeStatus('Escribe un código o usa la chuleta.','wait');
      input?.focus();
      return false;
    }

    const m=v857SelectedMatch();
    const result=v857RegisterRaw(raw,m);
    if(!result.ok){
      v857CodeStatus('✕ '+result.error,'bad');
      input?.focus();
      v857Refresh();
      return false;
    }

    v857StampVideo(result.action);
    if(input)input.value='';
    v857CodeStatus(`✓ ${result.raw} guardado · rally actual: ${result.after} ${result.after===1?'acción':'acciones'}.`,'ok');
    v857Status(`Acción guardada: ${result.raw}`,'ok');
    v857Refresh();
    input?.focus();
    return true;
  } finally {
    setTimeout(()=>{v857CodeBusy=false},80);
  }
};
window.v800AddCode=window.v857AddCode;
window.v852AddCode=window.v857AddCode;
window.v853AddCode=window.v857AddCode;
window.v855AddCode=window.v857AddCode;
window.v856AddCode=window.v857AddCode;

/* The old strict lineup gate had become a scoring blocker after several
   versions. Keep integrity reporting, but do not block the actual rally. */
const v857StrictPointValidator=window.scoutV680ValidateBeforePoint;
window.scoutV680ValidateBeforePoint=function(m){
  if(!m)return false;
  const ids=['p1','p2','p3','p4','p5','p6']
    .map(p=>Number(m.baseLineup?.ours?.[p]||m.lineup?.ours?.[p])||null)
    .filter(Boolean);
  if(ids.length!==6){
    v857Status('Alineación incompleta: el marcador funciona, pero conviene completar P1–P6.','warn');
  }else if(new Set(ids).size!==6){
    v857Status('Hay un jugador repetido en P1–P6: revisa la alineación.','warn');
  }
  if(!(Number(m.rotationNo)>=1&&Number(m.rotationNo)<=6))m.rotationNo=1;
  if(!(Number(m.opponentRotationNo)>=1&&Number(m.opponentRotationNo)<=6))m.opponentRotationNo=1;
  return true;
};

/* POINTS: call the mature internal chain exactly once, then verify +1. */
const v857AwardBase=window.scoutAwardPoint;
window.scoutAwardPoint=function(winner){
  winner=winner==='opponent'?'opponent':'ours';
  if(v857PointBusy)return false;
  v857PointBusy=true;
  try{
    const m=v857SelectedMatch()||scoutActive(),s=v857Set(m);
    if(!m||!s||m.status==='finished'||s.finished){
      v857Status('No hay un set abierto para añadir el punto.','warn');
      return false;
    }
    const beforeScore=v857Score(s),beforeRallies=v857RallyCount(s);
    let err=null;
    try{v857AwardBase(winner)}catch(e){err=e}

    const mm=v857SelectedMatch()||scoutActive()||m,ss=v857Set(mm)||s;
    const afterScore=v857Score(ss),afterRallies=v857RallyCount(ss);
    const expectedUs=beforeScore.us+(winner==='ours'?1:0);
    const expectedOp=beforeScore.op+(winner==='opponent'?1:0);
    const ok=afterScore.us===expectedUs&&afterScore.op===expectedOp&&afterRallies===beforeRallies+1;

    if(!ok){
      console.error('V8.5.7 point verification failed',err,{beforeScore,afterScore,beforeRallies,afterRallies});
      v857Status('No se ha podido guardar el punto correctamente. No se hará un segundo intento automático.','bad');
      v857Refresh();
      return false;
    }

    v857Status(`✓ Punto guardado ${afterScore.us}-${afterScore.op} · rally ${afterRallies}.`,'ok');
    v857Refresh();
    return true;
  }finally{
    setTimeout(()=>{v857PointBusy=false},120);
  }
};

/* UNDO: same mature undo chain, once, with verification. */
const v857UndoBase=window.scoutUndoRally;
window.scoutUndoRally=function(){
  if(v857UndoBusy)return false;
  v857UndoBusy=true;
  try{
    const m=v857SelectedMatch()||scoutActive(),s=v857Set(m);
    if(!m||!s){v857Status('No hay un scouting activo.','bad');return false}
    const before=v857RallyCount(s),scoreBefore=v857Score(s);
    if(!before){v857Status('No hay rallies cerrados para deshacer.','warn');return false}

    let err=null;
    try{v857UndoBase()}catch(e){err=e}
    const mm=v857SelectedMatch()||scoutActive()||m,ss=v857Set(mm)||s;
    const after=v857RallyCount(ss),scoreAfter=v857Score(ss);
    if(after!==before-1){
      console.error('V8.5.7 undo verification failed',err,{before,after});
      v857Status('No se ha podido deshacer el rally correctamente.','bad');
      v857Refresh();
      return false;
    }
    v857Status(`↶ Rally deshecho · ${scoreBefore.us}-${scoreBefore.op} → ${scoreAfter.us}-${scoreAfter.op}.`,'ok');
    v857Refresh();
    return true;
  }finally{
    setTimeout(()=>{v857UndoBusy=false},120);
  }
};

/* Professional rally editor, directly from the real private editor. */
window.v857OpenRallyEditor=function(){
  const m=v857SelectedMatch()||scoutActive();
  if(!m){alert('No hay un scouting activo.');return false}
  const setNo=Number(m.currentSet)||1;
  if(typeof window.scoutV680OpenSetEditor!=='function'){
    alert('El editor profesional de rallies no está disponible.');
    return false;
  }
  window.scoutV680OpenSetEditor(setNo);
  return true;
};
window.v853OpenRallyEditor=window.v857OpenRallyEditor;

/* Stable public bridge. Future external UI must use this, not private names. */
window.VC_SCOUT_CORE={
  version:V857_VERSION,
  getActive:()=>scoutActive(),
  getSet:(m=scoutActive())=>scoutSet(m),
  parse:(raw,m=scoutActive(),oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction),
  push:(action)=>scoutPushAction(action),
  register:(raw,m=scoutActive())=>v857RegisterRaw(raw,m),
  addFromFull:()=>window.scoutAddCode(),
  addFromMatch:()=>window.v857AddCode(),
  point:(winner)=>window.scoutAwardPoint(winner),
  undo:()=>window.scoutUndoRally(),
  openRallyEditor:()=>window.v857OpenRallyEditor(),
  liveActions:(m=scoutActive())=>scoutClone(scoutArr(m?.liveRally?.actions)),
  strictLineupValidator:v857StrictPointValidator
};

window.v857Diagnostics=()=>({
  version:V857_VERSION,
  activeId:scoutActive()?.id||null,
  parser:'function',
  push:'function',
  core:!!window.VC_SCOUT_CORE,
  fullCode:typeof window.scoutAddCode,
  matchCode:typeof window.v857AddCode,
  point:typeof window.scoutAwardPoint,
  undo:typeof window.scoutUndoRally,
  rallyEditor:typeof window.scoutV680OpenSetEditor
});





/* =====================================================================
   V8.6.0 · 36 SUBZONES (1A–9D)
   Lives inside scouting-pro-v600-script to share the real parser/state.
   ===================================================================== */
const V860_VERSION='8.6.0';
const V860_SUBZONES=['A','B','C','D'];

function v860ZoneToken(zone,sub=''){
  zone=String(zone||'').trim().toUpperCase();
  sub=String(sub||'').trim().toUpperCase();
  if(!/^[1-9]$/.test(zone))return '';
  return zone+(V860_SUBZONES.includes(sub)?sub:'');
}
function v860SplitZone(token){
  const m=String(token||'').trim().toUpperCase().match(/^([1-9])([A-D])?$/);
  return m?{zone:m[1],sub:m[2]||''}:{zone:'',sub:''};
}
function v860BaseZone(token){return v860SplitZone(token).zone}
function v860SubZone(token){return v860SplitZone(token).sub}

/* Parser wrapper:
   12A#.4B>5D... -> temporarily parse as .4>5 using the mature V8.4 parser,
   then restore the exact alphanumeric zones before normalize/build. */
const v860ParseBase=scoutV6108ParseRaw;
scoutV6108ParseRaw=function(raw,m,oldAction=null){
  const original=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  const zm=original.match(/^((?:R)?\d+(?:S|R|E|A|B|D|F|C)(?:[#\+!\-\/=])?)\.([1-9])([A-D]?)(?:>([1-9])([A-D]?))?(.*)$/);
  if(!zm||(!zm[3]&&!zm[5]))return v860ParseBase(original,m,oldAction);

  const prefix=zm[1],z1=zm[2],s1=zm[3]||'',z2=zm[4]||'',s2=zm[5]||'',rest=zm[6]||'';
  const cleaned=prefix+'.'+z1+(z2?('>'+z2):'')+rest;
  const parsed=v860ParseBase(cleaned,m,oldAction);
  if(parsed?.error||!parsed?.action)return parsed;

  let a=parsed.action;
  const full1=z1+s1,full2=z2?(z2+s2):'';
  if(a.skill==='R'||a.skill==='D'){
    if(full2){
      a.startZone=full1;a.endZone=full2;a.contactZone=full2;a.sourceZone=full1;a.zoneInferred=false;
    }else{
      a.startZone='';a.endZone=full1;a.contactZone=full1;a.sourceZone='';a.zoneInferred=false;
    }
  }else if(a.skill==='B'){
    a.startZone=full1;a.endZone='';a.contactZone=full1;
  }else{
    a.startZone=full1;a.endZone=full2;
  }
  a=scoutNormalizeAction(a);
  a.code=scoutBuildCode(a);
  return {action:a};
};
window.v680ParseCode=function(raw,m,oldAction=null){return scoutV6108ParseRaw(raw,m,oldAction)};

/* Manual form: optional subzone selector is concatenated to the numeric zone. */
window.scoutAddManualAction=function(){
  const team=$('scout-action-team')?.value||'ours',
    pv=$('scout-action-player')?.value||'',
    skill=$('scout-action-skill')?.value||'S',
    combo=$('scout-action-combo')?.value||'',
    start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),
    end=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||''),
    serve=$('scout-action-serve-type')?.value||'',
    direction=$('scout-action-direction')?.value||'',
    blockers=$('scout-action-blockers')?.value??'',
    target=String($('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3);

  let zones=scoutV6108NormalizeZoneInput(skill,start,end);
  if(skill==='B'){
    const z=start||end;
    zones={startZone:z,endZone:'',contactZone:z,sourceZone:'',zoneInferred:false};
  }

  scoutPushAction({
    team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',
    skill,evaluation:$('scout-action-eval')?.value||'!',...zones,
    serveType:skill==='S'?serve:'',
    receivedServeType:skill==='R'?serve:'',
    phase:$('scout-action-phase')?.value||'',
    setTarget:skill==='E'?combo:'',
    attackCombo:skill==='A'?combo:'',
    attackTempo:skill==='A'?($('scout-action-tempo')?.value||''):'',
    attackDirection:skill==='A'?direction:'',
    blockers:(skill==='A'||skill==='B')?String(blockers):'',
    blockTargetNumber:skill==='B'?target:''
  });
};

/* Precise manual preview. */
window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$('scout-action-skill')?.value||'S',
    ev=$('scout-action-eval')?.value||'!',
    start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),
    end=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||''),
    serve=$('scout-action-serve-type')?.value||'',
    phase=$('scout-action-phase')?.value||'',
    combo=$('scout-action-combo')?.value||'',
    direction=$('scout-action-direction')?.value||'',
    blockers=$('scout-action-blockers')?.value??'',
    target=String($('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3);

  let c='N'+skill+ev;
  if(skill==='B'){
    const z=start||end;if(z)c+='.'+z;
  }else if(start&&end)c+=`.${start}>${end}`;
  else if(scoutV6108IsContactSkill(skill)&&(end||start))c+='.'+(end||start);

  if((skill==='S'||skill==='R')&&serve)c+=`~${serve}`;
  if((skill==='E'||skill==='A')&&combo)c+=`:${combo}`;
  if(skill==='A'&&direction)c+=`*${direction}`;
  if(phase)c+=`^${phase}`;
  if((skill==='A'||skill==='B')&&blockers!=='')c+=`@${blockers}`;
  if(skill==='B'&&target)c+=`&${target}`;
  if($('scout-advanced-code-preview'))$('scout-advanced-code-preview').textContent='Código: '+c;
};

/* Labels/visibility for subzone selectors. */
const v860FieldsBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v860FieldsBase?.();
  const skill=$('scout-action-skill')?.value||'S';
  const contact=scoutV6108IsContactSkill(skill);
  const block=skill==='B';

  const ss=$('scout-action-start-sub-wrap'),es=$('scout-action-end-sub-wrap');
  if(ss)ss.classList.toggle('hidden',false);
  if(es)es.classList.toggle('hidden',block);

  const sl=$('scout-action-start-sub-label'),el=$('scout-action-end-sub-label');
  if(sl)sl.textContent=block?'Subzona bloqueo':(contact?'Subzona origen (opc.)':'Subzona origen');
  if(el)el.textContent=contact?(skill==='R'?'Subzona recepción':'Subzona defensa'):'Subzona destino';

  scoutUpdateAdvancedCodePreview();
  return out;
};

['scout-action-start-sub','scout-action-end-sub'].forEach(id=>{
  $(id)?.addEventListener('change',()=>scoutUpdateAdvancedCodePreview());
});
['scout-action-start','scout-action-end','scout-action-skill','scout-action-eval','scout-action-serve-type','scout-action-phase','scout-action-combo','scout-action-tempo','scout-action-direction','scout-action-blockers','scout-v840-block-target'].forEach(id=>{
  $(id)?.addEventListener('change',()=>scoutUpdateAdvancedCodePreview());
});

/* Base-zone filters also accept all four subzones; exact subzone filters can
   be selected from the dynamically-added entries. */
function v860AddSubzoneFilterOptions(id,bases){
  const sel=$(id);if(!sel||sel.dataset.v860Subzones)return;
  bases.forEach(z=>{
    const group=document.createElement('optgroup');
    group.label='Z'+z+' · subzonas';
    V860_SUBZONES.forEach(s=>{
      const o=document.createElement('option');
      o.value=String(z)+s;o.textContent='Z'+z+s;group.appendChild(o);
    });
    sel.appendChild(group);
  });
  sel.dataset.v860Subzones='1';
}
v860AddSubzoneFilterOptions('scout-v830-rec-zone',['1','2','3','4','5','6','7','8','9']);
v860AddSubzoneFilterOptions('scout-v840-block-zone',['2','3','4']);

/* Helpful API for later heatmaps / exports. */
window.VC_SUBZONES={
  version:V860_VERSION,
  letters:[...V860_SUBZONES],
  parse:v860SplitZone,
  compose:v860ZoneToken,
  base:v860BaseZone,
  sub:v860SubZone,
  examples:[
    '7R#.6C~JF',
    '3E+.2B>4C:Z4^K1',
    '12A#.4B>5D:Z4*DL^K1@2',
    '4B#.3C@2&12'
  ]
};

/* Refresh public core so external UI always reaches the FINAL parser. */
if(window.VC_SCOUT_CORE){
  window.VC_SCOUT_CORE.version=V860_VERSION;
  window.VC_SCOUT_CORE.parse=(raw,m=scoutActive(),oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction);
  window.VC_SCOUT_CORE.register=(raw,m=scoutActive())=>v857RegisterRaw(raw,m);
}
scoutUpdateAdvancedFields();





/* =====================================================================
   V8.6.1 · MANUAL SET END + FINAL MATCH RESULT
   ===================================================================== */
const V861_VERSION='8.6.1';

function v861Int(id,max=99){
  const n=Number.parseInt(String($(id)?.value??''),10);
  return Number.isFinite(n)?Math.max(0,Math.min(max,n)):0;
}
function v861RecordedScore(m){
  const done=scoutArr(m?.sets).filter(s=>s.finished);
  return {
    us:done.filter(s=>s.winner==='ours').length,
    opponent:done.filter(s=>s.winner==='opponent').length
  };
}
function v861SetDetail(m){
  return scoutArr(m?.sets).map(s=>{
    const suffix=s.manualFinished?' · cierre manual':'';
    return `Set ${s.number}: ${s.scoreUs}-${s.scoreOpponent}${s.finished?suffix:' · en curso'}`;
  }).join(' · ');
}
function v861ClearManualResult(m){
  if(!m?.manualFinalResult?.active)return;
  m.manualFinalResult={...m.manualFinalResult,active:false,clearedAt:scoutNow()};
  m.resultComplete=false;
  m.resultCompleteAt=null;
}

/* Preserve manual result metadata through every later normalization/reload. */
const v861NormBase=scoutNormalizeMatch;
scoutNormalizeMatch=function(m){
  const x=v861NormBase(m);
  const rawSets=scoutArr(m?.sets);
  scoutArr(x.sets).forEach((s,i)=>{
    const raw=rawSets.find(r=>Number(r?.number)===Number(s.number))||rawSets[i]||{};
    s.manualFinished=!!raw?.manualFinished;
    s.manualFinishedAt=raw?.manualFinishedAt?String(raw.manualFinishedAt):null;
    s.manualScorePrevious=raw?.manualScorePrevious&&typeof raw.manualScorePrevious==='object'
      ? {us:Number(raw.manualScorePrevious.us)||0,opponent:Number(raw.manualScorePrevious.opponent)||0}
      : null;
  });
  x.manualFinalResult=m?.manualFinalResult&&typeof m.manualFinalResult==='object'
    ? {
        active:!!m.manualFinalResult.active,
        us:Math.max(0,Number(m.manualFinalResult.us)||0),
        opponent:Math.max(0,Number(m.manualFinalResult.opponent)||0),
        savedAt:m.manualFinalResult.savedAt?String(m.manualFinalResult.savedAt):null,
        finalizedAt:m.manualFinalResult.finalizedAt?String(m.manualFinalResult.finalizedAt):null,
        clearedAt:m.manualFinalResult.clearedAt?String(m.manualFinalResult.clearedAt):null
      }
    : null;
  x.dataVersion=V861_VERSION;
  return x;
};

/* Result override affects match result only. Technical stats still read actual
   rallies/actions and actual set objects. */
const v861SetsScoreBase=scoutSetsScore;
scoutSetsScore=function(m){
  if(m?.manualFinalResult?.active){
    return {
      us:Math.max(0,Number(m.manualFinalResult.us)||0),
      opponent:Math.max(0,Number(m.manualFinalResult.opponent)||0)
    };
  }
  return v861SetsScoreBase(m);
};
window.scoutSetsScore=scoutSetsScore;

window.scoutV861OpenFinishSet=function(){
  const m=scoutActive(),s=scoutSet(m);
  if(!m||!s){alert('No hay un scouting activo.');return}
  if(m.status==='finished'){alert('El scouting está finalizado. Ábrelo de nuevo antes de corregir un set.');return}

  $('scout-v861-set-title').textContent=`Finalizar Set ${s.number}`;
  $('scout-v861-set-us-label').textContent=EQUIPOS?.[equipoActivo]?.nombre||'Nuestro equipo';
  $('scout-v861-set-op-label').textContent=m.opponent||'Rival';
  $('scout-v861-set-us').value=String(Number(s.scoreUs)||0);
  $('scout-v861-set-op').value=String(Number(s.scoreOpponent)||0);

  const pending=scoutArr(m.liveRally?.actions).length;
  const warning=$('scout-v861-set-warning');
  if(warning){
    if(pending){
      warning.className='scout-v861-notice bad';
      warning.innerHTML=`Hay <b>${pending}</b> ${pending===1?'acción':'acciones'} en el rally actual sin cerrar. Marca el punto o borra esas acciones antes de finalizar el set.`;
    }else{
      warning.className='scout-v861-notice';
      warning.innerHTML=s.finished
        ? `El Set ${s.number} ya estaba cerrado en <b>${s.scoreUs}-${s.scoreOpponent}</b>. Puedes corregir aquí su marcador final.`
        : `Marcador registrado actualmente: <b>${s.scoreUs}-${s.scoreOpponent}</b>. Puedes corregirlo si te falta algún punto.`;
    }
  }
  $('scout-v861-finish-set-modal')?.classList.add('open');
};
window.scoutV861CloseFinishSet=function(){$('scout-v861-finish-set-modal')?.classList.remove('open')};

window.scoutV861FinishSet=function(){
  const m=scoutActive(),s=scoutSet(m);
  if(!m||!s)return;
  const pending=scoutArr(m.liveRally?.actions).length;
  if(pending){
    alert(`Hay ${pending} ${pending===1?'acción':'acciones'} en el rally actual. Cierra el rally con un punto o borra esas acciones antes de finalizar el set.`);
    return;
  }

  const us=v861Int('scout-v861-set-us'),op=v861Int('scout-v861-set-op');
  if(us===op){alert('Un set finalizado no puede quedar empatado.');return}
  if(us===0&&op===0){alert('Introduce el marcador final del set.');return}

  const regulatory=scoutSetHasWinner({number:s.number,scoreUs:us,scoreOpponent:op});
  if(!regulatory&&!confirm(`El marcador ${us}-${op} no corresponde al cierre reglamentario habitual del Set ${s.number}. ¿Guardarlo igualmente como resultado final manual?`))return;

  const prev={us:Number(s.scoreUs)||0,opponent:Number(s.scoreOpponent)||0};
  s.scoreUs=us;
  s.scoreOpponent=op;
  s.finished=true;
  s.winner=us>op?'ours':'opponent';
  s.endedAt=scoutNow();
  s.manualFinished=true;
  s.manualFinishedAt=scoutNow();
  s.manualScorePrevious=prev;

  v861ClearManualResult(m);
  const recorded=v861RecordedScore(m);
  m.resultComplete=recorded.us>=3||recorded.opponent>=3;
  m.resultCompleteAt=m.resultComplete?scoutNow():null;
  m.status='live';
  m.endedAt=null;
  m.dataVersion=V861_VERSION;

  scoutResetLiveRally(m);
  scoutSave(false);
  window.scoutV861CloseFinishSet();
  scoutRender();
  try{window.v800Render?.()}catch(_){}
};

window.scoutV861OpenFinalResult=function(){
  const m=scoutActive();
  if(!m){alert('No hay un scouting activo.');return}

  const recorded=v861RecordedScore(m);
  const current=m.manualFinalResult?.active
    ? {us:Number(m.manualFinalResult.us)||0,opponent:Number(m.manualFinalResult.opponent)||0}
    : recorded;

  $('scout-v861-result-title').textContent=`${EQUIPOS?.[equipoActivo]?.nombre||'Equipo'} vs ${m.opponent||'Rival'}`;
  $('scout-v861-result-us-label').textContent=EQUIPOS?.[equipoActivo]?.nombre||'Nuestro equipo';
  $('scout-v861-result-op-label').textContent=m.opponent||'Rival';
  $('scout-v861-result-us').value=String(current.us);
  $('scout-v861-result-op').value=String(current.opponent);

  const detail=v861SetDetail(m);
  const info=$('scout-v861-result-recorded');
  if(info){
    info.innerHTML=`<strong>Registrado en el scouting: ${recorded.us}-${recorded.opponent} sets</strong>${detail?`<span>${esc(detail)}</span>`:''}${m.manualFinalResult?.active?`<span class="scout-v861-manual-tag">Resultado manual actual ${m.manualFinalResult.us}-${m.manualFinalResult.opponent}</span>`:''}`;
  }
  $('scout-v861-final-result-modal')?.classList.add('open');
};
window.scoutV861CloseFinalResult=function(){$('scout-v861-final-result-modal')?.classList.remove('open')};

window.scoutV861SaveFinalResult=async function(finalize=false){
  const m=scoutActive();
  if(!m){alert('No hay un scouting activo.');return}
  const us=v861Int('scout-v861-result-us',5),op=v861Int('scout-v861-result-op',5);
  if(us===op){alert('El resultado final del partido no puede quedar empatado.');return}
  if(us===0&&op===0){alert('Introduce el resultado final en sets.');return}

  const now=scoutNow();
  m.manualFinalResult={active:true,us,opponent:op,savedAt:now,finalizedAt:finalize?now:null,clearedAt:null};
  m.resultComplete=true;
  m.resultCompleteAt=now;
  m.dataVersion=V861_VERSION;

  if(finalize){
    const pending=scoutArr(m.liveRally?.actions).length;
    if(pending&&!confirm(`Hay ${pending} ${pending===1?'acción':'acciones'} en el rally actual sin cerrar. No se convertirán en un rally. ¿Finalizar igualmente el scouting?`))return;

    m.status='finished';
    m.finalizedByUser=true;
    m.endedAt=now;
    if(pending){
      m.manualPendingActionsAtFinish=pending;
    }
  }else if(m.status!=='finished'){
    m.status='live';
    m.endedAt=null;
  }

  scoutSyncCompetition(m);
  scoutSave(false);
  window.scoutV861CloseFinalResult();

  if(finalize){
    try{if(typeof window.scoutV680Backup==='function')await window.scoutV680Backup('manual-final-result',true)}catch(_){}
    scoutingActiveId=null;
    scoutSave(false);
    try{scoutV6102ExitToArchive()}catch(_){showView('scout-dashboard',botonVista('scout-dashboard'))}
  }else{
    scoutRender();
    try{window.v800Render?.()}catch(_){}
  }
};

/* Starting/changing gameplay invalidates a previously-entered global manual result. */
const v861AwardBase=window.scoutAwardPoint;
window.scoutAwardPoint=function(winner){
  const m=scoutActive();
  if(m?.manualFinalResult?.active)v861ClearManualResult(m);
  return v861AwardBase(winner);
};
const v861UndoBase=window.scoutUndoRally;
window.scoutUndoRally=function(){
  const m=scoutActive();
  if(m?.manualFinalResult?.active)v861ClearManualResult(m);
  return v861UndoBase();
};
const v861NextSetBase=window.scoutNextSet;
window.scoutNextSet=function(serving){
  const m=scoutActive();
  if(m?.manualFinalResult?.active)v861ClearManualResult(m);
  return v861NextSetBase(serving);
};

/* Make the end-of-set area aware of a stored manual final result. */
const v861RenderEndedBase=scoutRenderEnded;
scoutRenderEnded=window.scoutRenderEnded=function(m){
  const box=$('scout-set-ended');
  if(m?.manualFinalResult?.active&&box){
    box.classList.remove('hidden');
    const r=m.manualFinalResult;
    if(m.status==='finished'){
      box.innerHTML=`<strong>Partido finalizado · resultado manual ${r.us}-${r.opponent} sets</strong><div class="scout-set-ended-actions"><button class="ghost" onclick="v120OpenFinalResult()">Ver resultado</button></div>`;
    }else{
      box.innerHTML=`<strong>Resultado final manual guardado · ${r.us}-${r.opponent} sets</strong><div class="scout-set-ended-actions"><button class="ghost" onclick="v120OpenFinalResult()">Editar resultado</button><button class="success" onclick="v120OpenFinalResult()">Finalizar scouting</button></div>`;
    }
    return;
  }
  return v861RenderEndedBase(m);
};

/* Add manual labels to set list while retaining professional rally editor. */
window.scoutV861RenderSetList=function(m=scoutActive()){
  const box=$('scout-set-list');if(!box||!m)return;
  box.innerHTML=scoutArr(m.sets).map(s=>`
    <div class="scout-set-row">
      <strong>Set ${s.number}${s.manualFinished?'<span class="scout-v861-manual-tag">manual</span>':''}</strong>
      <span>${s.finished?(s.winner==='ours'?'Ganado':s.winner==='opponent'?'Perdido':'Cerrado'):'En juego'} · ${s.rallies.length} rallies</span>
      <b>${s.scoreUs}-${s.scoreOpponent}</b>
      <button class="ghost scout-v680-set-edit" onclick="scoutV680OpenSetEditor(${s.number})">Editar rallies</button>
    </div>`).join('');
};


/* Update public bridges. */
if(window.VC_SCOUT_CORE){
  window.VC_SCOUT_CORE.version=V861_VERSION;
  window.VC_SCOUT_CORE.finishSet=()=>window.scoutV861OpenFinishSet();
  window.VC_SCOUT_CORE.finalResult=()=>window.scoutV861OpenFinalResult();
}
if(window.VC_SCOUT_REPORT_BRIDGE){
  window.VC_SCOUT_REPORT_BRIDGE.setsScore=(m)=>scoutSetsScore(m);
}

window.scoutV861Diagnostics=()=>({
  version:V861_VERSION,
  activeId:scoutActive()?.id||null,
  currentSet:scoutSet(scoutActive())?.number||null,
  recorded:v861RecordedScore(scoutActive()),
  displayed:scoutActive()?scoutSetsScore(scoutActive()):null,
  manualResult:scoutActive()?.manualFinalResult||null,
  finishSet:typeof window.scoutV861FinishSet,
  finalResult:typeof window.scoutV861SaveFinalResult
});





/* =====================================================================
   V8.7.0 · DATAVOLLEY PRO CODING
   ===================================================================== */
const V870_VERSION='8.7.0';
const V870_TEMPO={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
const V870_SETTYPE={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};
const V870_SUBTYPE={
  A:{HSP:'Hard spike',SSP:'Soft spike/topspin',TIP:'Tip'},
  E:{'1H':'1 hand set','2H':'2 hands set',BUMP:'Bump set',UND:'Underhand set',OTH:'Other set'},
  R:{L:'On left',R:'On right',LOW:'Low',OH:'Overhand',MID:'Middle line'},
  B:{AST:'Block assist',ATT:'Block attempt',SOFT:'Block on soft spike'},
  D:{COV:'Spike cover',AB:'After block',EMG:'Emergency',TIP:'Tip',SOFT:'Soft spike'}
};
const V870_LEGACY_TEMPO={RAP:'T',MED:'M',ALT:'H'};

function v870CleanToken(v,max=10){
  return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,max);
}
function v870SkillFromRaw(raw){
  return String(raw||'').trim().toUpperCase().replace(/\s+/g,'').match(/^(?:R)?\d+(S|R|E|A|B|D|F|C)/)?.[1]||'';
}

const v870NormalizeBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){
  const x=v870NormalizeBase(a);
  const rawTempo=v870CleanToken(a?.attackTempo||a?.setTempo||x.attackTempo||'',3);
  const tempo=V870_TEMPO[rawTempo]?rawTempo:(V870_LEGACY_TEMPO[rawTempo]||'');
  x.attackTempo=x.skill==='A'?tempo:'';
  x.setTempo=x.skill==='E'?tempo:'';
  x.attackCode=x.skill==='A'?v870CleanToken(a?.attackCode||'',6):'';
  x.setterCall=x.skill==='E'?v870CleanToken(a?.setterCall||'',6):'';
  x.dvSetType=(x.skill==='A'||x.skill==='E')&&V870_SETTYPE[String(a?.dvSetType||'').toUpperCase()]?String(a.dvSetType).toUpperCase():'';
  const subtype=v870CleanToken(a?.skillSubtype||'',8);
  x.skillSubtype=V870_SUBTYPE[x.skill]?.[subtype]?subtype:'';
  x.specialCode=v870CleanToken(a?.specialCode||'',10);
  x.customCode=v870CleanToken(a?.customCode||'',5);
  return x;
};

const v870BuildBase=scoutBuildCode;
scoutBuildCode=function(a){
  let code=v870BuildBase(a);
  const dvCode=a?.skill==='A'?a.attackCode:(a?.skill==='E'?a.setterCall:'');
  const tempo=a?.skill==='A'?a.attackTempo:(a?.skill==='E'?a.setTempo:'');
  if(dvCode)code+=`::${v870CleanToken(dvCode,6)}`;
  if(tempo&&V870_TEMPO[tempo])code+=`~${tempo}`;
  if(a?.skillSubtype)code+=`%${v870CleanToken(a.skillSubtype,8)}`;
  if(a?.dvSetType&&V870_SETTYPE[a.dvSetType])code+=`|${a.dvSetType}`;
  if(a?.specialCode)code+=`?${v870CleanToken(a.specialCode,10)}`;
  if(a?.customCode)code+=`$${v870CleanToken(a.customCode,5)}`;
  return code;
};

const v870ParseBase=scoutV6108ParseRaw;
scoutV6108ParseRaw=function(raw,m,oldAction=null){
  const original=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  const skill=v870SkillFromRaw(original);
  let cleaned=original;

  let dvCode=cleaned.match(/::([A-Z0-9]{1,6})/)?.[1]||'';
  cleaned=cleaned.replace(/::[A-Z0-9]{1,6}/,'');

  if(!dvCode&&(skill==='A'||skill==='E')){
    const single=cleaned.match(/:([A-Z0-9]{1,6})/)?.[1]||'';
    const vcCombos=['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'];
    if(single&&!vcCombos.includes(single)){
      dvCode=single;
      cleaned=cleaned.replace(':'+single,'');
    }
  }

  let tempo='';
  if(skill==='A'||skill==='E'){
    tempo=cleaned.match(/~([QUTMHO])/)?.[1]||'';
    if(tempo)cleaned=cleaned.replace(/~[QUTMHO]/,'');
  }

  const subtype=cleaned.match(/%([A-Z0-9]{1,8})/)?.[1]||'';
  if(subtype)cleaned=cleaned.replace(/%[A-Z0-9]{1,8}/,'');

  const setType=cleaned.match(/\|([FCBPS])/)?.[1]||'';
  if(setType)cleaned=cleaned.replace(/\|[FCBPS]/,'');

  const special=cleaned.match(/\?([A-Z0-9]{1,10})/)?.[1]||'';
  if(special)cleaned=cleaned.replace(/\?[A-Z0-9]{1,10}/,'');

  const custom=cleaned.match(/\$([A-Z0-9]{1,5})/)?.[1]||'';
  if(custom)cleaned=cleaned.replace(/\$[A-Z0-9]{1,5}/,'');

  const parsed=v870ParseBase(cleaned,m,oldAction);
  if(parsed?.error||!parsed?.action)return parsed;

  let a=parsed.action;
  if(a.skill==='A'){
    a.attackCode=dvCode||String(oldAction?.attackCode||'');
    a.attackTempo=tempo||String(oldAction?.attackTempo||'');
  }else{
    a.attackCode='';
    if(a.skill==='E'){
      a.setterCall=dvCode||String(oldAction?.setterCall||'');
      a.setTempo=tempo||String(oldAction?.setTempo||'');
    }else{
      a.setterCall='';a.setTempo='';
    }
  }
  a.skillSubtype=subtype||String(oldAction?.skillSubtype||'');
  a.dvSetType=setType||String(oldAction?.dvSetType||'');
  a.specialCode=special||String(oldAction?.specialCode||'');
  a.customCode=custom||String(oldAction?.customCode||'');
  a=scoutNormalizeAction(a);
  a.code=scoutBuildCode(a);
  return {action:a};
};
window.v680ParseCode=(raw,m,oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction);

function v870FillSubtype(skill){
  const sel=$('scout-action-subtype');if(!sel)return;
  const old=sel.value,data=V870_SUBTYPE[skill]||{};
  sel.innerHTML='<option value="">— Sin especificar —</option>'+Object.entries(data)
    .map(([k,v])=>`<option value="${k}">${k} · ${esc(v)}</option>`).join('');
  if(data[old])sel.value=old;
}
function v870FieldValue(id){return String($(id)?.value||'').trim().toUpperCase()}

window.scoutAddManualAction=function(){
  const team=$('scout-action-team')?.value||'ours',
    pv=$('scout-action-player')?.value||'',skill=$('scout-action-skill')?.value||'S',
    combo=$('scout-action-combo')?.value||'',
    start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),
    end=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||''),
    serve=$('scout-action-serve-type')?.value||'',
    direction=$('scout-action-direction')?.value||'',
    blockers=$('scout-action-blockers')?.value??'',
    target=String($('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3),
    dvCode=v870CleanToken(v870FieldValue('scout-action-dv-code'),6),
    tempo=v870FieldValue('scout-action-tempo'),
    subtype=v870FieldValue('scout-action-subtype'),
    setType=v870FieldValue('scout-action-set-type'),
    special=v870CleanToken(v870FieldValue('scout-action-special'),10),
    custom=v870CleanToken(v870FieldValue('scout-action-custom'),5);

  let zones=scoutV6108NormalizeZoneInput(skill,start,end);
  if(skill==='B'){
    const z=start||end;
    zones={startZone:z,endZone:'',contactZone:z,sourceZone:'',zoneInferred:false};
  }

  scoutPushAction({
    team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',
    skill,evaluation:$('scout-action-eval')?.value||'!',...zones,
    serveType:skill==='S'?serve:'',receivedServeType:skill==='R'?serve:'',
    phase:$('scout-action-phase')?.value||'',setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',
    attackCode:skill==='A'?dvCode:'',setterCall:skill==='E'?dvCode:'',
    attackTempo:skill==='A'?tempo:'',setTempo:skill==='E'?tempo:'',
    dvSetType:(skill==='A'||skill==='E')?setType:'',skillSubtype:subtype,
    specialCode:special,customCode:custom,attackDirection:skill==='A'?direction:'',
    blockers:(skill==='A'||skill==='B')?String(blockers):'',blockTargetNumber:skill==='B'?target:''
  });
};

window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$('scout-action-skill')?.value||'S',ev=$('scout-action-eval')?.value||'!',
    start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),
    end=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||''),
    serve=$('scout-action-serve-type')?.value||'',phase=$('scout-action-phase')?.value||'',
    combo=$('scout-action-combo')?.value||'',direction=$('scout-action-direction')?.value||'',
    blockers=$('scout-action-blockers')?.value??'',
    target=String($('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3),
    dvCode=v870CleanToken(v870FieldValue('scout-action-dv-code'),6),
    tempo=v870FieldValue('scout-action-tempo'),subtype=v870FieldValue('scout-action-subtype'),
    setType=v870FieldValue('scout-action-set-type'),
    special=v870CleanToken(v870FieldValue('scout-action-special'),10),
    custom=v870CleanToken(v870FieldValue('scout-action-custom'),5);

  let sample={team:'opponent',playerLabel:'N',skill,evaluation:ev,startZone:start,endZone:end,
    serveType:skill==='S'?serve:'',receivedServeType:skill==='R'?serve:'',phase,
    setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',
    attackCode:skill==='A'?dvCode:'',setterCall:skill==='E'?dvCode:'',
    attackTempo:skill==='A'?tempo:'',setTempo:skill==='E'?tempo:'',
    dvSetType:(skill==='A'||skill==='E')?setType:'',skillSubtype:subtype,
    specialCode:special,customCode:custom,attackDirection:skill==='A'?direction:'',
    blockers:(skill==='A'||skill==='B')?String(blockers):'',blockTargetNumber:skill==='B'?target:''};

  if(skill==='R'||skill==='D'){sample.contactZone=end||start;sample.endZone=end||start;sample.startZone=start&&end?start:''}
  if(skill==='B'){sample.contactZone=start||end;sample.startZone=start||end;sample.endZone=''}
  sample=scoutNormalizeAction(sample);
  let c=scoutBuildCode(sample).replace(/^RN/,'N');
  if($('scout-advanced-code-preview'))$('scout-advanced-code-preview').textContent='Código: '+c;
};

const v870FieldsBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v870FieldsBase?.(),skill=$('scout-action-skill')?.value||'S',ea=skill==='E'||skill==='A';
  $('scout-v870-dvcode-wrap')?.classList.toggle('hidden',!ea);
  $('scout-adv-tempo-wrap')?.classList.toggle('hidden',!ea);
  $('scout-v870-settype-wrap')?.classList.toggle('hidden',!ea);
  $('scout-v870-subtype-wrap')?.classList.toggle('hidden',!V870_SUBTYPE[skill]);
  v870FillSubtype(skill);
  const dl=$('scout-v870-dvcode-label');if(dl)dl.textContent=skill==='A'?'Attack code DataVolley':skill==='E'?'Setter call DataVolley':'Código DataVolley';
  const tl=$('scout-action-tempo-label');if(tl)tl.textContent=skill==='E'?'Tempo de colocación · DataVolley':'Tempo de ataque · DataVolley';
  const sl=$('scout-v870-subtype-label');if(sl)sl.textContent=`Skill subtype · ${SCOUT_SKILLS[skill]||skill}`;
  const ctx=$('scout-advanced-context');
  if(ctx&&skill==='E')ctx.textContent='Destino + setter call DV + tempo Q/U/T/M/H/O + tipo de gesto';
  if(ctx&&skill==='A')ctx.textContent='Attack code DV + tempo + subtype + set type + dirección + bloqueo';
  scoutUpdateAdvancedCodePreview();
  return out;
};

['scout-action-dv-code','scout-action-set-type','scout-action-subtype','scout-action-special','scout-action-custom'].forEach(id=>{
  $(id)?.addEventListener('input',()=>scoutUpdateAdvancedCodePreview());
  $(id)?.addEventListener('change',()=>scoutUpdateAdvancedCodePreview());
});

const v870MetaBase=scoutAdvancedMetaText;
scoutAdvancedMetaText=function(a){
  const parts=[],base=v870MetaBase(a);if(base)parts.push(base);
  if(a?.skill==='A'&&a.attackCode)parts.push('DV ATQ '+a.attackCode);
  if(a?.skill==='E'&&a.setterCall)parts.push('DV SET '+a.setterCall);
  const tempo=a?.skill==='A'?a.attackTempo:(a?.skill==='E'?a.setTempo:'');
  if(tempo)parts.push('Tempo '+tempo+' '+(V870_TEMPO[tempo]||''));
  if(a?.dvSetType)parts.push('Set '+a.dvSetType+' '+(V870_SETTYPE[a.dvSetType]||''));
  if(a?.skillSubtype)parts.push(V870_SUBTYPE[a.skill]?.[a.skillSubtype]||a.skillSubtype);
  if(a?.specialCode)parts.push('Special '+a.specialCode);
  if(a?.customCode)parts.push('Custom '+a.customCode);
  return [...new Set(parts)].join(' · ');
};

window.scoutExportCSV=function(id){
  const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}
  const rows=scoutExportRows(m);
  const headers=['fecha','equipo','rival','competicion','set','rally','marcador_antes','marcador_despues',
    'saque_antes','rotacion_nuestra','rotacion_rival','secuencia','equipo_accion','jugador','fundamento',
    'valoracion','zona_origen','zona_destino','tipo_saque','tipo_saque_recibido','fase_vc',
    'destino_combinacion_vc','attack_code_dv','set_code_dv','tempo_dv','set_type_dv','skill_subtype_dv',
    'special_code_dv','custom_code_dv','direccion_ataque_vc','bloqueadores','atacante_objetivo_vc',
    'codigo','tiempo_scout','video_time'];
  const data=rows.map(a=>{
    const tempo=a.skill==='A'?a.attackTempo:(a.skill==='E'?a.setTempo:'');
    return [m.date,EQUIPOS[equipoActivo].nombre,m.opponent,m.competition,a.set,a.rallyIndex,a.scoreBefore,
      a.scoreAfter,a.servingBefore==='ours'?'Nuestro':'Rival',a.rotation,a.opponentRotation,a.actionIndex,
      a.team==='ours'?'Nuestro':'Rival',scoutActionPlayerLabel(a),SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,
      a.startZone,a.endZone,V620_SERVE_LABELS[a.serveType]||a.serveType||'',
      V830_SERVE?.[a.receivedServeType]||a.receivedServeType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',
      V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',
      a.attackCode||'',a.setterCall||'',tempo||'',a.dvSetType||'',a.skillSubtype||'',a.specialCode||'',
      a.customCode||'',V830_ATTACK_DIR?.[a.attackDirection]||a.attackDirection||'',a.blockers??'',
      a.blockTargetNumber||'',a.code,scoutFormatTime(a.scoutMs),a.videoTime==null?'':Number(a.videoTime)];
  });
  const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');
  scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_acciones_datavolley_pro.csv`);
};

window.VC_DATAVOLLEY={
  version:V870_VERSION,tempo:{...V870_TEMPO},setType:{...V870_SETTYPE},subtype:scoutClone(V870_SUBTYPE),
  syntax:{attackCode:'::X1',setterCall:'::K1',tempo:'~Q/~U/~T/~M/~H/~O',subtype:'%HSP',
    setType:'|F',special:'?NET',custom:'$ABC'}
};
if(window.VC_SCOUT_CORE){
  window.VC_SCOUT_CORE.version=V870_VERSION;
  window.VC_SCOUT_CORE.datavolley=window.VC_DATAVOLLEY;
  window.VC_SCOUT_CORE.parse=(raw,m=scoutActive(),oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction);
  window.VC_SCOUT_CORE.register=(raw,m=scoutActive())=>v857RegisterRaw(raw,m);
}
scoutUpdateAdvancedFields();





/* =====================================================================
   V8.8.0 · DATAVOLLEY COURT SYSTEM
   ===================================================================== */
const V880_VERSION='8.8.0';
const V880_ZONE_ORDER=[4,3,2,7,8,9,5,6,1];
const V880_CONTACT_SKILLS=new Set(['R','D','B','C']);
let v880OriginCoord=null,v880DestCoord=null,v880EndCone='';
let v880CourtPrecision='subzone',v880AttackLocationMode='zones';

function v880Clamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
function v880BaseToken(token){return String(token||'').match(/[1-9]/)?.[0]||''}
function v880SubToken(token){return String(token||'').toUpperCase().match(/[A-D]/)?.[0]||''}
function v880CoordClone(c){return c&&Number.isFinite(Number(c.x))&&Number.isFinite(Number(c.y))?{x:Number(c.x),y:Number(c.y)}:null}

function v880XYToZone(x,y){
  x=v880Clamp(x,0.5001,3.4999);y=v880Clamp(y,0.5001,3.4999);
  const col=x<1.5?0:x<2.5?1:2,row=y>=2.5?0:y>=1.5?1:2;
  return [[4,3,2],[7,8,9],[5,6,1]][row][col];
}
function v880ZoneBounds(zone){
  const pos={4:[0.5,2.5],3:[1.5,2.5],2:[2.5,2.5],7:[0.5,1.5],8:[1.5,1.5],9:[2.5,1.5],5:[0.5,0.5],6:[1.5,0.5],1:[2.5,0.5]}[Number(zone)];
  return pos?{x0:pos[0],y0:pos[1]}:null;
}
function v880XYToSubzone(x,y,zone=v880XYToZone(x,y)){
  const b=v880ZoneBounds(zone);if(!b)return '';
  const right=Number(x)>=b.x0+0.5,front=Number(y)>=b.y0+0.5;
  if(front&&!right)return 'A';if(front&&right)return 'B';if(!front&&!right)return 'D';return 'C';
}
function v880XYToToken(x,y){const z=v880XYToZone(x,y);return String(z)+v880XYToSubzone(x,y,z)}
function v880ZoneCenter(token){
  const z=v880BaseToken(token),s=v880SubToken(token),b=v880ZoneBounds(z);if(!b)return null;
  if(!s)return{x:b.x0+0.5,y:b.y0+0.5};
  const off={A:[0.25,0.75],B:[0.75,0.75],D:[0.25,0.25],C:[0.75,0.25]}[s];
  return{x:b.x0+off[0],y:b.y0+off[1]};
}
function v880FormatCoord(c){return c?`x ${Number(c.x).toFixed(2)} · y ${Number(c.y).toFixed(2)}`:'sin coordenada exacta'}

function v880DataVolleyFields(action,m=scoutActive()){
  const skill=action?.skill||'',start=String(action?.startZone||''),end=String(action?.endZone||'');
  const contact=String(action?.contactZone||((skill==='R'||skill==='D')?(end||start):'')||'');
  let dvStart=v880BaseToken(action?.dvStartZone||start),dvEnd=v880BaseToken(action?.dvEndZone||end),
      dvEndSub=v880SubToken(action?.dvEndSubzone||end),sourceId=action?.dvSourceActionId!=null?Number(action.dvSourceActionId):null;

  if(skill==='R'||skill==='D'){
    const wanted=skill==='R'?'S':'A',other=action.team==='ours'?'opponent':'ours';
    const prev=[...scoutArr(m?.liveRally?.actions)].reverse().find(a=>a.team===other&&a.skill===wanted);
    if(prev){dvStart=v880BaseToken(prev.startZone);dvEnd=v880BaseToken(prev.endZone);dvEndSub=v880SubToken(prev.endZone);sourceId=Number(prev.id)||null}
  }
  const serving=m?.servingTeam==='opponent'?'opponent':'ours';
  const pointPhase=action?.team===serving?'Breakpoint':'Sideout';
  const dvPhase=skill==='S'?'Serve':(action?.phase==='K1'?'Reception':'Transition');
  let attackPhase='';
  if(skill==='A')attackPhase=action?.phase==='K1'?'Reception':(pointPhase==='Breakpoint'?'Transition breakpoint':'Transition sideout');

  return {contactZone:contact,dvStartZone:dvStart,dvEndZone:action?.endCone?'':dvEnd,dvEndSubzone:action?.endCone?'':dvEndSub,
    dvEndCone:action?.endCone?Number(action.endCone):null,dvSourceActionId:sourceId,dvPointPhase:pointPhase,dvPhase,dvAttackPhase:attackPhase};
}

const v880NormalizeBase=scoutNormalizeAction;
scoutNormalizeAction=function(a){
  const x=v880NormalizeBase(a);
  x.locationMode=a?.locationMode==='cones'?'cones':'zones';
  x.endCone=a?.endCone!=null&&/^[1-8]$/.test(String(a.endCone))?Number(a.endCone):null;
  x.startCoordinate=v880CoordClone(a?.startCoordinate);x.endCoordinate=v880CoordClone(a?.endCoordinate);x.contactCoordinate=v880CoordClone(a?.contactCoordinate);
  x.contactZone=String(a?.contactZone||x.contactZone||'');x.dvStartZone=String(a?.dvStartZone||'');x.dvEndZone=String(a?.dvEndZone||'');x.dvEndSubzone=String(a?.dvEndSubzone||'');
  x.dvEndCone=a?.dvEndCone!=null&&Number.isFinite(Number(a.dvEndCone))?Number(a.dvEndCone):null;x.dvSourceActionId=a?.dvSourceActionId!=null?Number(a.dvSourceActionId):null;
  x.dvPointPhase=String(a?.dvPointPhase||'');x.dvPhase=String(a?.dvPhase||'');x.dvAttackPhase=String(a?.dvAttackPhase||'');
  return x;
};

const v880PushBase=scoutPushAction;
scoutPushAction=function(action){
  const m=scoutActive();action={...action,...v880DataVolleyFields(action,m)};
  const out=v880PushBase(action);
  if(out&&m?.liveRally?.actions?.length){
    const last=m.liveRally.actions[m.liveRally.actions.length-1];Object.assign(last,v880DataVolleyFields(last,m));
    last.locationMode=last.endCone?'cones':(last.locationMode||'zones');
    /* Base push already scheduled journal + consolidation. The journal clone
       happens asynchronously and therefore sees these final DV fields. */
  }
  return out;
};

const v880BuildBase=scoutBuildCode;
scoutBuildCode=function(a){
  let code=v880BuildBase(a);
  if(a?.skill==='A'&&a?.endCone&&a?.startZone){
    const loc=`.${a.startZone}>C${a.endCone}`,prefixRe=/^((?:R)?(?:\d+|P)(?:S|R|E|A|B|D|F|C)[#\+!\-\/=])/;
    if(!code.includes('>C'+a.endCone))code=code.replace(prefixRe,`$1${loc}`);
  }
  return code;
};

const v880ParseBase=scoutV6108ParseRaw;
scoutV6108ParseRaw=function(raw,m,oldAction=null){
  const original=String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
  const cm=original.match(/^((?:R)?\d+A[#\+!\-\/=]?)\.([1-9][A-D]?)>C([1-8])(.*)$/);
  if(!cm)return v880ParseBase(original,m,oldAction);
  const parsed=v880ParseBase(cm[1]+cm[4],m,oldAction);if(parsed?.error||!parsed?.action)return parsed;
  let a=parsed.action;a.startZone=cm[2];a.endZone='';a.contactZone='';a.locationMode='cones';a.endCone=Number(cm[3]);
  a=scoutNormalizeAction({...a,...v880DataVolleyFields(a,m)});a.code=scoutBuildCode(a);return{action:a};
};
window.v680ParseCode=(raw,m,oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction);

window.scoutAddManualAction=function(){
  const team=$('scout-action-team')?.value||'ours',pv=$('scout-action-player')?.value||'',skill=$('scout-action-skill')?.value||'S',
    combo=$('scout-action-combo')?.value||'',start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),
    end=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||''),serve=$('scout-action-serve-type')?.value||'',
    direction=$('scout-action-direction')?.value||'',blockers=$('scout-action-blockers')?.value??'',
    target=String($('scout-v840-block-target')?.value||'').replace(/\D/g,'').slice(0,3),
    dvCode=v870CleanToken(v870FieldValue('scout-action-dv-code'),6),tempo=v870FieldValue('scout-action-tempo'),
    subtype=v870FieldValue('scout-action-subtype'),setType=v870FieldValue('scout-action-set-type'),
    special=v870CleanToken(v870FieldValue('scout-action-special'),10),custom=v870CleanToken(v870FieldValue('scout-action-custom'),5),
    locationMode=skill==='A'?($('scout-action-location-mode')?.value||'zones'):'zones',
    endCone=skill==='A'&&($('scout-action-location-mode')?.value==='cones')?Number($('scout-action-end-cone')?.value)||null:null;

  let zones=scoutV6108NormalizeZoneInput(skill,start,end);
  if(skill==='B'){const z=start||end;zones={startZone:z,endZone:'',contactZone:z,sourceZone:'',zoneInferred:false}}
  if(skill==='A'&&locationMode==='cones'){
    zones={...zones,startZone:start,endZone:'',contactZone:'',sourceZone:'',zoneInferred:false};
    if(!start||!endCone){alert('Para ataque por conos selecciona zona de origen y cono de destino.');return}
  }

  const action={team,playerId:team==='ours'?Number(pv)||null:null,playerLabel:team==='opponent'?pv:'',skill,
    evaluation:$('scout-action-eval')?.value||'!',...zones,serveType:skill==='S'?serve:'',receivedServeType:skill==='R'?serve:'',
    phase:$('scout-action-phase')?.value||'',setTarget:skill==='E'?combo:'',attackCombo:skill==='A'?combo:'',
    attackCode:skill==='A'?dvCode:'',setterCall:skill==='E'?dvCode:'',attackTempo:skill==='A'?tempo:'',setTempo:skill==='E'?tempo:'',
    dvSetType:(skill==='A'||skill==='E')?setType:'',skillSubtype:subtype,specialCode:special,customCode:custom,
    attackDirection:skill==='A'?direction:'',blockers:(skill==='A'||skill==='B')?String(blockers):'',blockTargetNumber:skill==='B'?target:'',
    locationMode,endCone,startCoordinate:v880OriginCoord,endCoordinate:locationMode==='zones'?v880DestCoord:null,
    contactCoordinate:V880_CONTACT_SKILLS.has(skill)?(v880DestCoord||v880OriginCoord):null};
  Object.assign(action,v880DataVolleyFields(action,scoutActive()));scoutPushAction(action);
};

const v880FieldsBase=window.scoutUpdateAdvancedFields;
window.scoutUpdateAdvancedFields=function(){
  const out=v880FieldsBase?.(),skill=$('scout-action-skill')?.value||'S',mode=$('scout-action-location-mode')?.value||'zones';
  $('scout-v880-location-mode-wrap')?.classList.toggle('hidden',skill!=='A');
  $('scout-v880-cone-wrap')?.classList.toggle('hidden',!(skill==='A'&&mode==='cones'));
  $('scout-action-end-wrap')?.classList.toggle('hidden',skill==='A'&&mode==='cones');
  $('scout-action-end-sub-wrap')?.classList.toggle('hidden',skill==='A'&&mode==='cones');
  const ctx=$('scout-advanced-context');if(ctx&&skill==='A'&&mode==='cones')ctx.textContent='Ataque DataVolley por conos · origen + end_cone; no se guarda end_zone';
  return out;
};
$('scout-action-location-mode')?.addEventListener('change',()=>{scoutUpdateAdvancedFields();scoutUpdateAdvancedCodePreview()});
$('scout-action-end-cone')?.addEventListener('change',()=>scoutUpdateAdvancedCodePreview());

const v880PreviewBase=window.scoutUpdateAdvancedCodePreview;
window.scoutUpdateAdvancedCodePreview=function(){
  const skill=$('scout-action-skill')?.value||'S',mode=$('scout-action-location-mode')?.value||'zones';
  if(skill!=='A'||mode!=='cones')return v880PreviewBase?.();
  const start=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||''),cone=Number($('scout-action-end-cone')?.value)||null,
    ev=$('scout-action-eval')?.value||'!',combo=$('scout-action-combo')?.value||'',direction=$('scout-action-direction')?.value||'',
    phase=$('scout-action-phase')?.value||'',blockers=$('scout-action-blockers')?.value??'',
    dvCode=v870CleanToken(v870FieldValue('scout-action-dv-code'),6),tempo=v870FieldValue('scout-action-tempo'),
    subtype=v870FieldValue('scout-action-subtype'),setType=v870FieldValue('scout-action-set-type'),
    special=v870CleanToken(v870FieldValue('scout-action-special'),10),custom=v870CleanToken(v870FieldValue('scout-action-custom'),5);
  let sample={team:'opponent',playerLabel:'N',skill:'A',evaluation:ev,startZone:start,endZone:'',attackCombo:combo,
    attackCode:dvCode,attackTempo:tempo,dvSetType:setType,skillSubtype:subtype,specialCode:special,customCode:custom,
    attackDirection:direction,phase,blockers:String(blockers),locationMode:'cones',endCone:cone};
  sample=scoutNormalizeAction(sample);let c=scoutBuildCode(sample).replace(/^RN/,'N');
  if($('scout-advanced-code-preview'))$('scout-advanced-code-preview').textContent='Código: '+c;
};

function v880Selection(which){return which==='origin'?v6100Origin:v6100Dest}
function v880SetSelection(which,val){if(which==='origin')v6100Origin=String(val||'');else v6100Dest=String(val||'')}
function v880SetCoord(which,c){if(which==='origin')v880OriginCoord=v880CoordClone(c);else v880DestCoord=v880CoordClone(c)}
function v880SelectedCoord(which){return which==='origin'?v880OriginCoord:v880DestCoord}
function v880ZoneCell(zone,which){
  const selected=v880Selection(which),base=v880BaseToken(selected);
  if(v880CourtPrecision==='zone')return `<div class="v880-zone-cell ${String(base)===String(zone)?'selected':''}"><button type="button" class="v880-zone-main ${String(base)===String(zone)?'selected':''}" onclick="scoutV880PickLocation('${which}','${zone}')">Z${zone}</button></div>`;
  const letters=['A','B','D','C'];
  return `<div class="v880-zone-cell ${String(base)===String(zone)?'selected':''}"><span class="v880-zone-number">${zone}</span><div class="v880-subgrid">${letters.map(s=>`<button type="button" class="${selected===String(zone)+s?'selected':''}" onclick="scoutV880PickLocation('${which}','${zone+s}')">${s}</button>`).join('')}</div></div>`;
}
function v880RenderCoordinateLayer(box,which){
  const layer=document.createElement('div');layer.className='v880-coordinate-layer';
  layer.addEventListener('click',ev=>{
    const r=layer.getBoundingClientRect(),xf=v880Clamp((ev.clientX-r.left)/Math.max(1,r.width),0,1),yf=v880Clamp((ev.clientY-r.top)/Math.max(1,r.height),0,1);
    const c={x:0.5+3*xf,y:3.5-3*yf};v880SetCoord(which,c);v880SetSelection(which,v880XYToToken(c.x,c.y));scoutV6100RenderPath();
  });
  const c=v880SelectedCoord(which);if(c){const marker=document.createElement('span');marker.className='v880-coordinate-marker';marker.style.left=`${((c.x-0.5)/3)*100}%`;marker.style.top=`${((3.5-c.y)/3)*100}%`;layer.appendChild(marker)}
  box.appendChild(layer);
}
function v880RenderGrid(target,which){
  const box=$(target);if(!box)return;box.innerHTML=V880_ZONE_ORDER.map(z=>v880ZoneCell(z,which)).join('');
  if(v880CourtPrecision==='coordinate')v880RenderCoordinateLayer(box,which);
}
function v880RenderCones(){const box=$('scout-v880-cone-grid');if(!box)return;box.innerHTML=[1,2,3,4,5,6,7,8].map(c=>`<button type="button" class="${Number(v880EndCone)===c?'selected':''}" onclick="scoutV880PickCone(${c})">C${c}${c===8?'<small>central</small>':''}</button>`).join('')}
window.scoutV880PickCone=function(c){v880EndCone=String(c);scoutV6100RenderPath()};
window.scoutV880PickLocation=function(which,token){v880SetSelection(which,token);v880SetCoord(which,null);scoutV6100RenderPath()};

scoutV6100RenderPath=function(){
  const skill=$('scout-v6100-court-skill')?.value||'A';v880CourtPrecision=$('scout-v880-court-precision')?.value||'subzone';v880AttackLocationMode=$('scout-v880-court-attack-mode')?.value||'zones';
  const isAttack=skill==='A',isRD=skill==='R'||skill==='D',isContact=V880_CONTACT_SKILLS.has(skill);
  $('scout-v880-court-attack-mode-wrap')?.classList.toggle('hidden',!isAttack);
  $('scout-v880-origin-panel')?.classList.toggle('hidden',isRD);
  $('scout-v6100-dest-grid')?.classList.toggle('hidden',isAttack&&v880AttackLocationMode==='cones');
  $('scout-v880-cone-grid')?.classList.toggle('hidden',!(isAttack&&v880AttackLocationMode==='cones'));
  const heads=document.querySelectorAll('#scout-v6100-court-modal .v880-zone-panel h3');
  if(heads[0])heads[0].textContent=skill==='B'?'Zona de bloqueo':isContact?'Zona de contacto / origen':'Zona de origen';
  if(heads[1])heads[1].textContent=isRD?'Zona física de contacto':(isAttack&&v880AttackLocationMode==='cones'?'Dirección por cono':'Zona de destino');
  v880RenderGrid('scout-v6100-origin-grid','origin');if(!(isAttack&&v880AttackLocationMode==='cones'))v880RenderGrid('scout-v6100-dest-grid','dest');else v880RenderCones();
  const od=$('scout-v880-origin-detail'),dd=$('scout-v880-dest-detail'),path=$('scout-v6100-path');
  if(od)od.textContent=`Origen ${v6100Origin||'—'} · ${v880FormatCoord(v880OriginCoord)}`;
  if(dd)dd.textContent=isAttack&&v880AttackLocationMode==='cones'?`Destino DataVolley · ${v880EndCone?'cono '+v880EndCone:'—'}`:`Destino ${v6100Dest||'—'} · ${v880FormatCoord(v880DestCoord)}`;
  if(path){
    if(isRD)path.textContent=`Contacto físico ${v6100Dest||v6100Origin||'—'} · trayectoria DataVolley heredada del ${skill==='R'?'saque':'ataque'} anterior`;
    else if(isAttack&&v880AttackLocationMode==='cones')path.textContent=`Origen ${v6100Origin||'—'} → Cono ${v880EndCone||'—'}`;
    else if(skill==='B')path.textContent=`Bloqueo en ${v6100Origin||v6100Dest||'—'}`;
    else path.textContent=`Origen ${v6100Origin||'—'} → Destino ${v6100Dest||'—'}`;
  }
  const help=$('scout-v880-court-help');if(help)help.textContent=v880CourtPrecision==='coordinate'?'Haz clic en el punto exacto. Volley Coach calcula automáticamente zona y subzona y conserva las coordenadas.':v880CourtPrecision==='subzone'?'Selecciona una de las 36 subzonas A–D.':'Selecciona una de las 9 zonas DataVolley.';
};

window.scoutV6100CourtClear=function(){v6100Origin='';v6100Dest='';v880OriginCoord=null;v880DestCoord=null;v880EndCone='';scoutV6100RenderPath()};
window.scoutV6100OpenCourt=function(){
  if(!scoutActive()){alert('Crea primero un scouting.');return}
  v6100Origin=v860ZoneToken($('scout-action-start')?.value||'',$('scout-action-start-sub')?.value||'');v6100Dest=v860ZoneToken($('scout-action-end')?.value||'',$('scout-action-end-sub')?.value||'');
  v880OriginCoord=null;v880DestCoord=null;v880EndCone=String($('scout-action-end-cone')?.value||'');
  $('scout-v6100-court-skill').value=$('scout-action-skill')?.value||'A';$('scout-v6100-court-eval').value=$('scout-action-eval')?.value||'!';
  $('scout-v880-court-attack-mode').value=$('scout-action-location-mode')?.value||'zones';scoutV6100RenderPath();$('scout-v6100-court-modal')?.classList.add('open');
};
window.scoutV6100CourtApply=function(register){
  const skill=$('scout-v6100-court-skill')?.value||'A';
  if(skill==='R'||skill==='D'){const z=v6100Dest||v6100Origin;v6100Origin='';v6100Dest=z}
  if(skill==='B'&&!v6100Origin){v6100Origin=v6100Dest;v6100Dest=''}
  const sp=v860SplitZone(v6100Origin),ep=v860SplitZone(v6100Dest);
  $('scout-action-start').value=sp.zone;$('scout-action-start-sub').value=sp.sub;$('scout-action-end').value=ep.zone;$('scout-action-end-sub').value=ep.sub;
  $('scout-action-skill').value=skill;$('scout-action-eval').value=$('scout-v6100-court-eval')?.value||'!';
  $('scout-action-location-mode').value=skill==='A'?v880AttackLocationMode:'zones';$('scout-action-end-cone').value=skill==='A'&&v880AttackLocationMode==='cones'?v880EndCone:'';
  scoutUpdateAdvancedFields();scoutUpdateAdvancedCodePreview();scoutV6100CloseCourt();if(register)scoutAddManualAction();
};
$('scout-v880-court-precision')?.addEventListener('change',()=>scoutV6100RenderPath());
$('scout-v880-court-attack-mode')?.addEventListener('change',()=>scoutV6100RenderPath());
$('scout-v6100-court-skill')?.addEventListener('change',()=>scoutV6100RenderPath());

scoutV6100LiveIssues=function(m=scoutActive()){
  if(!m)return[];const a=scoutArr(m.liveRally?.actions),issues=[];if(!a.length)return issues;
  const receiver=m.servingTeam==='ours'?'opponent':'ours',hasR=a.some(x=>x.team===receiver&&x.skill==='R'),hasE=a.some(x=>x.team===receiver&&x.skill==='E'),atts=a.filter(x=>x.team===receiver&&x.skill==='A');
  if((hasE||atts.length)&&!hasR)issues.push('Hay colocación/ataque sin recepción registrada en el equipo receptor.');
  atts.forEach(x=>{if(!x.playerId&&!x.playerLabel)issues.push('Hay un ataque sin atacante identificado.');if(!x.startZone||(!x.endZone&&!x.endCone))issues.push('Hay un ataque sin destino: zona o cono.')});
  if(a.filter(x=>x.skill==='S').length>1)issues.push('Hay más de un saque en el mismo rally.');return[...new Set(issues)];
};

window.scoutExportCSV=function(id){
  const m=scoutExportMatch(id);if(!m){alert('No hay scouting seleccionado.');return}
  const rows=scoutExportRows(m);
  const headers=['fecha','equipo','rival','competicion','set','rally','marcador_antes','marcador_despues','saque_antes','rotacion_nuestra','rotacion_rival','secuencia','equipo_accion','jugador','fundamento','valoracion',
    'contact_zone_vc','zona_origen_vc','zona_destino_vc','location_mode','dv_start_zone','dv_end_zone','dv_end_subzone','dv_end_cone',
    'start_x','start_y','end_x','end_y','contact_x','contact_y','tipo_saque','tipo_saque_recibido','fase_vc','dv_phase','dv_point_phase','dv_attack_phase',
    'destino_combinacion_vc','attack_code_dv','set_code_dv','tempo_dv','set_type_dv','skill_subtype_dv','special_code_dv','custom_code_dv','direccion_ataque_vc','bloqueadores','atacante_objetivo_vc','codigo','tiempo_scout','video_time'];
  const data=rows.map(a=>{
    const tempo=a.skill==='A'?a.attackTempo:(a.skill==='E'?a.setTempo:'');
    return [m.date,EQUIPOS[equipoActivo].nombre,m.opponent,m.competition,a.set,a.rallyIndex,a.scoreBefore,a.scoreAfter,a.servingBefore==='ours'?'Nuestro':'Rival',a.rotation,a.opponentRotation,a.actionIndex,
      a.team==='ours'?'Nuestro':'Rival',scoutActionPlayerLabel(a),SCOUT_SKILLS[a.skill]||a.skill,a.evaluation,a.contactZone||'',a.startZone||'',a.endZone||'',a.locationMode||'zones',
      a.dvStartZone||'',a.dvEndZone||'',a.dvEndSubzone||'',a.dvEndCone??'',a.startCoordinate?.x??'',a.startCoordinate?.y??'',a.endCoordinate?.x??'',a.endCoordinate?.y??'',a.contactCoordinate?.x??'',a.contactCoordinate?.y??'',
      V620_SERVE_LABELS[a.serveType]||a.serveType||'',V830_SERVE?.[a.receivedServeType]||a.receivedServeType||'',V620_PHASE_LABELS[a.phase]||a.phase||'',a.dvPhase||'',a.dvPointPhase||'',a.dvAttackPhase||'',
      V620_COMBO_LABELS[a.setTarget||a.attackCombo]||a.setTarget||a.attackCombo||'',a.attackCode||'',a.setterCall||'',tempo||'',a.dvSetType||'',a.skillSubtype||'',a.specialCode||'',a.customCode||'',
      V830_ATTACK_DIR?.[a.attackDirection]||a.attackDirection||'',a.blockers??'',a.blockTargetNumber||'',a.code,scoutFormatTime(a.scoutMs),a.videoTime==null?'':Number(a.videoTime)];
  });
  const csv='\uFEFF'+[headers,...data].map(r=>r.map(scoutCSVCell).join(';')).join('\r\n');scoutDownloadBlob(csv,'text/csv;charset=utf-8',`${scoutSafeFilename(m.date+'_'+m.opponent)}_acciones_datavolley_v880.csv`);
};

window.VC_DATAVOLLEY_COURT={version:V880_VERSION,zones:[...V880_ZONE_ORDER],subzones:['A','B','C','D'],
  subzoneOrientation:{A:'front-left',B:'front-right',D:'rear-left',C:'rear-right'},xyToZone:v880XYToZone,xyToSubzone:v880XYToSubzone,xyToToken:v880XYToToken,zoneCenter:v880ZoneCenter,
  coneSyntax:'>C1 ... >C8',note:'contactZone is separate from DataVolley trajectory for reception/dig'};
if(window.VC_SCOUT_CORE){window.VC_SCOUT_CORE.version=V880_VERSION;window.VC_SCOUT_CORE.datavolleyCourt=window.VC_DATAVOLLEY_COURT;window.VC_SCOUT_CORE.parse=(raw,m=scoutActive(),oldAction=null)=>scoutV6108ParseRaw(raw,m,oldAction);window.VC_SCOUT_CORE.register=(raw,m=scoutActive())=>v857RegisterRaw(raw,m)}
scoutUpdateAdvancedFields();





/* =====================================================================
   V8.9.0 · DATAVOLLEY TECHNICAL ANALYSIS
   ===================================================================== */
const V890_VERSION='8.9.0';
const V890_REC_LABEL={L:'On left · izquierda',R:'On right · derecha',LOW:'Low · baja',OH:'Overhand · dedos',MID:'Middle line · línea media'};
const V890_ATK_LABEL={HSP:'Hard spike · remate fuerte',SSP:'Soft spike / topspin',TIP:'Tip · finta'};
const V890_SET_SUB_LABEL={'1H':'1 hand · una mano','2H':'2 hands · dos manos',BUMP:'Bump set · antebrazos',UND:'Underhand',OTH:'Other'};
const V890_BLOCK_LABEL={AST:'Block assist',ATT:'Block attempt',SOFT:'Block on soft spike'};
const V890_TEMPO_LABEL={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
const V890_SETTYPE_LABEL={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};

function v890Pct(n,d){return d?Math.round(Number(n||0)*100/d):0}
function v890Rows(m,team,skill=''){return scoutActionRows(m,false).filter(a=>a.team===team&&(!skill||a.skill===skill))}
function v890Gp(n){n=Number(n)||0;return n>0?`+${n}`:String(n)}
function v890Top(rows,getter){
  const map=new Map();
  rows.forEach(a=>{const k=String(getter(a)||'').trim();if(k)map.set(k,(map.get(k)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
}
function v890ActionOutcome(rows){
  const pts=rows.filter(a=>a.evaluation==='#').length,
    err=rows.filter(a=>a.evaluation==='=').length,
    blocked=rows.filter(a=>a.evaluation==='/').length;
  return {pts,err,blocked,killPct:v890Pct(pts,rows.length),eff:rows.length?Math.round((pts-err-blocked)*100/rows.length):0};
}
function v890ReceptionGroups(m,team){
  const rows=v890Rows(m,team,'R');
  const keys=['L','R','LOW','OH','MID',''];
  return keys.map(key=>{
    const rr=rows.filter(a=>String(a.skillSubtype||'')===key);
    const pos=rr.filter(a=>['#','+'].includes(a.evaluation)).length,
      exc=rr.filter(a=>a.evaluation==='#').length,
      err=rr.filter(a=>a.evaluation==='=').length,
      so=rr.filter(a=>a.winner===team).length;
    return {
      key,label:key?(V890_REC_LABEL[key]||key):'Sin tipo especificado',
      total:rr.length,pos,exc,err,so,posPct:v890Pct(pos,rr.length),excPct:v890Pct(exc,rr.length),
      errPct:v890Pct(err,rr.length),soPct:v890Pct(so,rr.length),
      contact:v890Top(rr,a=>a.contactZone||a.endZone||a.startZone),
      source:v890Top(rr,a=>a.dvStartZone),
      serve:v890Top(rr,a=>a.receivedServeType)
    };
  }).filter(x=>x.total);
}
function v890ReceptionZoneGroups(m,team){
  const rows=v890Rows(m,team,'R'),map=new Map();
  rows.forEach(a=>{
    const k=String(a.contactZone||a.endZone||a.startZone||'Sin zona');
    if(!map.has(k))map.set(k,[]);map.get(k).push(a);
  });
  return [...map.entries()].map(([key,rr])=>{
    const pos=rr.filter(a=>['#','+'].includes(a.evaluation)).length,exc=rr.filter(a=>a.evaluation==='#').length,
      err=rr.filter(a=>a.evaluation==='=').length,so=rr.filter(a=>a.winner===team).length;
    return {key,total:rr.length,posPct:v890Pct(pos,rr.length),excPct:v890Pct(exc,rr.length),err,soPct:v890Pct(so,rr.length),
      source:v890Top(rr,a=>a.dvStartZone),serve:v890Top(rr,a=>a.receivedServeType)};
  }).sort((a,b)=>b.total-a.total);
}
function v890SetTempoGroups(m,team){
  const rows=v890Rows(m,team,'E'),keys=['Q','U','T','M','H','O',''];
  return keys.map(key=>{
    const rr=rows.filter(a=>String(a.setTempo||'')===key);
    const good=rr.filter(a=>['#','+'].includes(a.evaluation)).length,bad=rr.filter(a=>['-','/','='].includes(a.evaluation)).length;
    return {key,label:key?`${key} · ${V890_TEMPO_LABEL[key]||key}`:'Sin tempo',total:rr.length,use:v890Pct(rr.length,rows.length),gp:good-bad,
      topCall:v890Top(rr,a=>a.setterCall),topTarget:v890Top(rr,a=>a.setTarget),topType:v890Top(rr,a=>a.dvSetType)};
  }).filter(x=>x.total);
}
function v890SetterCalls(m,team){
  const rows=v890Rows(m,team,'E'),map=new Map();
  rows.forEach(a=>{const k=String(a.setterCall||'Sin set_code');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890Pct(rr.length,rows.length),
    tempo:v890Top(rr,a=>a.setTempo),target:v890Top(rr,a=>a.setTarget),type:v890Top(rr,a=>a.dvSetType),
    gesture:v890Top(rr,a=>a.skillSubtype)})).sort((a,b)=>b.total-a.total);
}
function v890SetSubtypes(m,team){
  const rows=v890Rows(m,team,'E'),map=new Map();
  rows.forEach(a=>{const k=String(a.skillSubtype||'');if(!k)return;if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,label:V890_SET_SUB_LABEL[key]||key,total:rr.length,use:v890Pct(rr.length,rows.length)})).sort((a,b)=>b.total-a.total);
}
function v890AttackTempoGroups(m,team){
  const rows=v890Rows(m,team,'A'),keys=['Q','U','T','M','H','O',''];
  return keys.map(key=>{
    const rr=rows.filter(a=>String(a.attackTempo||'')===key),o=v890ActionOutcome(rr);
    return {key,label:key?`${key} · ${V890_TEMPO_LABEL[key]||key}`:'Sin tempo',total:rr.length,use:v890Pct(rr.length,rows.length),
      ...o,topCode:v890Top(rr,a=>a.attackCode),topType:v890Top(rr,a=>a.skillSubtype),topSetType:v890Top(rr,a=>a.dvSetType)};
  }).filter(x=>x.total);
}
function v890AttackCodes(m,team){
  const rows=v890Rows(m,team,'A'),map=new Map();
  rows.forEach(a=>{const k=String(a.attackCode||'Sin attack_code');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890Pct(rr.length,rows.length),...v890ActionOutcome(rr),
    tempo:v890Top(rr,a=>a.attackTempo),subtype:v890Top(rr,a=>a.skillSubtype),setType:v890Top(rr,a=>a.dvSetType),
    route:v890Top(rr,a=>a.endCone?`C${a.endCone}`:(a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone||''))})).sort((a,b)=>b.total-a.total);
}
function v890AttackSubtypes(m,team){
  const rows=v890Rows(m,team,'A'),keys=['HSP','SSP','TIP',''];
  return keys.map(key=>{
    const rr=rows.filter(a=>String(a.skillSubtype||'')===key),o=v890ActionOutcome(rr);
    return {key,label:key?(V890_ATK_LABEL[key]||key):'Sin tipo especificado',total:rr.length,...o};
  }).filter(x=>x.total);
}
function v890AttackLocation(m,team){
  const rows=v890Rows(m,team,'A'),zones=rows.filter(a=>!a.endCone),cones=rows.filter(a=>a.endCone);
  const coneMap=new Map();cones.forEach(a=>{const k=`C${a.endCone}`;if(!coneMap.has(k))coneMap.set(k,[]);coneMap.get(k).push(a)});
  return {
    zones:{total:zones.length,pct:v890Pct(zones.length,rows.length),top:v890Top(zones,a=>a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone)},
    cones:{total:cones.length,pct:v890Pct(cones.length,rows.length),top:v890Top(cones,a=>`C${a.endCone}`),
      rows:[...coneMap.entries()].map(([key,rr])=>({key,total:rr.length,...v890ActionOutcome(rr)})).sort((a,b)=>b.total-a.total)}
  };
}
function v890BlockGroups(m,team){
  const rows=v890Rows(m,team,'B'),map=new Map();
  rows.forEach(a=>{const k=String(a.skillSubtype||'Sin subtipo');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,label:V890_BLOCK_LABEL[key]||key,total:rr.length,points:rr.filter(a=>a.evaluation==='#').length,
    zone:v890Top(rr,a=>a.contactZone||a.startZone),size:v890Top(rr,a=>a.blockers),target:v890Top(rr,a=>a.blockTargetNumber)})).sort((a,b)=>b.total-a.total);
}
function v890PhaseGroups(m,team){
  const rows=scoutActionRows(m,false).filter(a=>a.team===team),map=new Map();
  rows.forEach(a=>{const k=[a.dvPointPhase||'—',a.dvPhase||'—',a.dvAttackPhase||'—'].join('|');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>{const [point,phase,attack]=key.split('|');return {point,phase,attack,total:rr.length}}).sort((a,b)=>b.total-a.total);
}

function v890Table(headers,rows,empty='Sin datos codificados'){
  return rows.length?`<div class="v890-table-wrap"><table class="v890-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:`<div class="v890-empty">${esc(empty)}</div>`;
}
function v890Card(title,sub,body,wide=false,count=''){
  return `<section class="v890-card ${wide?'wide':''}"><div class="v890-card-head"><div><h4>${esc(title)}</h4><p>${esc(sub)}</p></div>${count!==''?`<span>${esc(count)}</span>`:''}</div>${body}</section>`;
}

window.scoutV890RenderDataVolleyAnalysis=function(){
  const box=$('scout-v890-datavolley-detail'),m=scoutMatchForAnalysis();if(!box||!m)return;
  const team=$('scout-v890-team')?.value||'ours',name=team==='ours'?(EQUIPOS[equipoActivo]?.nombre||'Nuestro equipo'):(m.opponent||'Rival');
  const rec=v890ReceptionGroups(m,team),recZones=v890ReceptionZoneGroups(m,team),
    st=v890SetTempoGroups(m,team),calls=v890SetterCalls(m,team),setSubs=v890SetSubtypes(m,team),
    at=v890AttackTempoGroups(m,team),ac=v890AttackCodes(m,team),as=v890AttackSubtypes(m,team),
    loc=v890AttackLocation(m,team),blocks=v890BlockGroups(m,team),ph=v890PhaseGroups(m,team);
  const recRows=rec.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td class="${x.posPct>=60?'v890-good':''}">${x.posPct}%</td><td>${x.excPct}%</td><td class="${x.errPct>=20?'v890-bad':''}">${x.err}</td><td>${x.soPct}%</td><td>${x.contact==='—'?'—':'Z'+esc(x.contact)}</td><td>${x.source==='—'?'—':'Z'+esc(x.source)}</td><td>${esc(V830_SERVE?.[x.serve]||x.serve||'—')}</td></tr>`);
  const recZoneRows=recZones.slice(0,16).map(x=>`<tr><td><b>${x.key==='Sin zona'?'—':'Z'+esc(x.key)}</b></td><td>${x.total}</td><td>${x.posPct}%</td><td>${x.excPct}%</td><td>${x.err}</td><td>${x.soPct}%</td><td>${x.source==='—'?'—':'Z'+esc(x.source)}</td><td>${esc(V830_SERVE?.[x.serve]||x.serve||'—')}</td></tr>`);
  const setTempoRows=st.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${v890Gp(x.gp)}</td><td>${esc(x.topCall)}</td><td>${esc(x.topTarget)}</td><td>${esc(V890_SETTYPE_LABEL[x.topType]||x.topType)}</td></tr>`);
  const callRows=calls.slice(0,16).map(x=>`<tr><td><b class="v890-code">${esc(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${esc(x.tempo||'—')}</td><td>${esc(x.target||'—')}</td><td>${esc(V890_SETTYPE_LABEL[x.type]||x.type||'—')}</td><td>${esc(V890_SET_SUB_LABEL[x.gesture]||x.gesture||'—')}</td></tr>`);
  const atkTempoRows=at.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td class="${x.killPct>=45?'v890-good':''}">${x.killPct}%</td><td>${x.err}</td><td>${x.blocked}</td><td class="${x.eff<0?'v890-bad':x.eff>=20?'v890-good':''}">${x.eff}%</td><td>${esc(x.topCode)}</td><td>${esc(V890_ATK_LABEL[x.topType]||x.topType||'—')}</td></tr>`);
  const codeRows=ac.slice(0,18).map(x=>`<tr><td><b class="v890-code">${esc(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.killPct}%</td><td>${x.err}</td><td>${x.blocked}</td><td class="${x.eff<0?'v890-bad':x.eff>=20?'v890-good':''}">${x.eff}%</td><td>${esc(x.tempo||'—')}</td><td>${esc(x.route||'—')}</td></tr>`);
  const atkSubtypeRows=as.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.killPct}%</td><td>${x.err}</td><td>${x.blocked}</td><td class="${x.eff<0?'v890-bad':x.eff>=20?'v890-good':''}">${x.eff}%</td></tr>`);
  const blockRows=blocks.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.points}</td><td>${x.zone==='—'?'—':'Z'+esc(x.zone)}</td><td>${esc(x.size||'—')}</td><td>${esc(x.target||'—')}</td></tr>`);
  const phaseRows=ph.slice(0,14).map(x=>`<tr><td><b>${esc(x.point)}</b></td><td>${esc(x.phase)}</td><td>${esc(x.attack)}</td><td>${x.total}</td></tr>`);
  const setSubRows=setSubs.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td></tr>`);
  const coneRows=loc.cones.rows.map(x=>`<tr><td><b>${esc(x.key)}</b></td><td>${x.total}</td><td>${x.killPct}%</td><td>${x.err}</td><td>${x.blocked}</td><td>${x.eff}%</td></tr>`);

  box.innerHTML=`<div class="v890-kpis">
      <div><span>Equipo</span><b>${esc(name)}</b><small>filtro actual</small></div>
      <div><span>Recepciones</span><b>${v890Rows(m,team,'R').length}</b><small>${rec.filter(x=>x.key).reduce((n,x)=>n+x.total,0)} con subtype</small></div>
      <div><span>Colocaciones</span><b>${v890Rows(m,team,'E').length}</b><small>${st.filter(x=>x.key).reduce((n,x)=>n+x.total,0)} con tempo</small></div>
      <div><span>Ataques</span><b>${v890Rows(m,team,'A').length}</b><small>${at.filter(x=>x.key).reduce((n,x)=>n+x.total,0)} con tempo</small></div>
      <div><span>Destino ATQ</span><b>${loc.zones.total}/${loc.cones.total}</b><small>zonas / conos</small></div>
    </div>
    <div class="v890-grid">
      ${v890Card('Recepción · tipo DataVolley','On left / On right / Low / Overhand / Middle line',v890Table(['Tipo','Tot','Pos%','Exc%','Err','SO%','Contacto','Origen DV','Saque'],recRows),true)}
      ${v890Card('Recepción · contacto físico','Zona donde la receptora tocó realmente el balón; el origen DV se hereda del saque rival.',v890Table(['Contacto','Tot','Pos%','Exc%','Err','SO%','Origen DV','Saque'],recZoneRows),true)}
      ${v890Card('Colocación · tempo','Q Quick · U Super · T Fast · M Medium · H High · O Other',v890Table(['Tempo','Tot','Uso','G-P técnico','Set code','Destino VC','Set type'],setTempoRows))}
      ${v890Card('Colocación · setter calls','Set codes DataVolley y contexto más frecuente.',v890Table(['Set code','Tot','Uso','Tempo','Destino','Set type','Gesto'],callRows))}
      ${v890Card('Colocación · tipo de gesto','1 hand, 2 hands, bump, underhand…',v890Table(['Gesto','Tot','Uso'],setSubRows))}
      ${v890Card('Ataque · tempo','Rendimiento del ataque según velocidad/altura.',v890Table(['Tempo','Tot','Uso','Kill%','Err','Bloq','EFF','Attack code','Tipo'],atkTempoRows),true)}
      ${v890Card('Ataque · attack codes','Combinaciones DataVolley realmente utilizadas.',v890Table(['Attack code','Tot','Uso','Kill%','Err','Bloq','EFF','Tempo','Destino'],codeRows),true)}
      ${v890Card('Ataque · tipo de golpe','Hard spike / soft spike / tip.',v890Table(['Tipo','Tot','Kill%','Err','Bloq','EFF'],atkSubtypeRows))}
      ${v890Card('Ataque · zonas vs conos',`Zonas ${loc.zones.total} (${loc.zones.pct}%) · conos ${loc.cones.total} (${loc.cones.pct}%). Zona dominante ${loc.zones.top}; cono dominante ${loc.cones.top}.`,v890Table(['Cono','Tot','Kill%','Err','Bloq','EFF'],coneRows,'No hay ataques por conos'))}
      ${v890Card('Bloqueo · subtype DataVolley','Intento, asistencia, soft spike; además zona, tamaño y atacante objetivo.',v890Table(['Tipo','Tot','Pts','Zona','Tamaño','Objetivo'],blockRows))}
      ${v890Card('Fases DataVolley','Point phase, phase y attack_phase guardados por acción.',v890Table(['Point phase','Phase','Attack phase','Acciones'],phaseRows))}
    </div>
    <div class="v890-legend"><b>Importante:</b> si un campo aparece como “Sin tipo” o “Sin tempo”, no se inventa. Solo se analiza lo que hayas codificado. En recepción, <b>contact_zone</b> es el contacto físico; <b>Origen DV</b> procede del saque rival enlazado.</div>`;
};

/* Extend the existing V8.3 reception analysis with DataVolley reception subtype. */
const v890ReceptionBase=window.scoutV830RenderReception;
window.scoutV830RenderReception=function(){
  v890ReceptionBase?.();
  const m=scoutMatchForAnalysis(),box=$('scout-v830-reception');if(!m||!box||box.querySelector('.v890-rec-detail'))return;
  const team=$('scout-v830-rec-team')?.value||'ours',groups=v890ReceptionGroups(m,team);
  if(!groups.length)return;
  const rows=groups.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${x.total}</td><td>${x.posPct}%</td><td>${x.excPct}%</td><td>${x.err}</td><td>${x.soPct}%</td><td>${x.contact==='—'?'—':'Z'+esc(x.contact)}</td></tr>`);
  box.insertAdjacentHTML('beforeend',`<div class="v890-rec-detail"><h4>Tipo de recepción DataVolley</h4>${v890Table(['Tipo','Total','Pos%','Exc%','Errores','Side-out%','Contacto habitual'],rows)}</div>`);
};

/* Final analysis hook inside the shared scouting engine. */
const v890AnalysisBase=window.scoutRenderAnalysis;
window.scoutRenderAnalysis=function(){
  const out=v890AnalysisBase?.();
  try{window.scoutV890RenderDataVolleyAnalysis()}catch(err){console.warn('V8.9 DataVolley analysis',err)}
  return out;
};
if(window.VC_SCOUT_CORE){
  window.VC_SCOUT_CORE.version=V890_VERSION;
  window.VC_SCOUT_CORE.datavolleyAnalysis=()=>window.scoutV890RenderDataVolleyAnalysis();
}





/* =====================================================================
   V8.9.1 · SCOUTING DATA-SAFETY + AUTOMATIC SNAPSHOT RESCUE
   ===================================================================== */
const V891_VERSION='8.9.1';
let v891LastRescue={rescued:0,replaced:0,teams:[],items:[],checkedAt:null};

function v891MatchCounts(m){
  const sets=scoutArr(m?.sets),rallies=sets.reduce((n,s)=>n+scoutArr(s?.rallies).length,0),
    actions=sets.reduce((n,s)=>n+scoutArr(s?.rallies).reduce((x,r)=>x+scoutArr(r?.actions).length,0),0)+scoutArr(m?.liveRally?.actions).length;
  return {rallies,actions};
}
function v891SnapshotScore(snap){
  if(!snap?.match)return -1;
  const c=v891MatchCounts(snap.match),t=Date.parse(snap.savedAt||snap.match.updatedAt||snap.match.createdAt||0)||0;
  return c.actions*1000000+c.rallies*10000+Math.floor(t/1000);
}
function v891IsSnapshotBetter(snap,existing){
  if(!snap?.match)return false;
  const sc=v891MatchCounts(snap.match),ec=v891MatchCounts(existing);
  if(sc.actions!==ec.actions)return sc.actions>ec.actions;
  if(sc.rallies!==ec.rallies)return sc.rallies>ec.rallies;
  const st=Date.parse(snap.savedAt||snap.match.updatedAt||0)||0,et=Date.parse(existing?.updatedAt||0)||0;
  return st>et+1500;
}
function v891Banner(result,automatic=false){
  const box=$('scout-v891-rescue-banner');if(!box)return;
  if(!result||(!result.rescued&&!result.replaced)){
    if(automatic){box.classList.add('hidden');return}
    box.className='scout-v891-rescue-banner';
    box.innerHTML='<strong>No se ha encontrado ningún scouting adicional para rescatar.</strong><span>Se han revisado las copias de recuperación de este navegador. Si borraste los datos del sitio o cambiaste de dispositivo, necesitarás una copia JSON/nube.</span>';
    return;
  }
  box.className='scout-v891-rescue-banner ok';
  const total=result.rescued+result.replaced;
  box.innerHTML=`<strong>✓ ${total} ${total===1?'scouting recuperado':'scoutings recuperados'} desde la autoprotección local.</strong>
    <span>${result.items.map(x=>`${esc(x.teamName)} · ${esc(x.opponent||'Rival')} · ${x.rallies} rallies · ${x.actions} acciones`).join('<br>')}</span>
    <div class="actions"><button class="ghost" onclick="scoutV891RecoverLostScoutings(true)">Volver a comprobar</button><button class="primary" onclick="scoutRenderHome()">Actualizar lista</button></div>`;
}
async function v891ScanTeam(teamId){
  const teamName=EQUIPOS?.[teamId]?.nombre||teamId;
  if(!equiposData?.[teamId])equiposData[teamId]=estadoEquipoVacio(teamId);
  const list=scoutArr(equiposData[teamId].scoutingMatches).map(scoutNormalizeMatch);
  const byId=new Map(list.map((m,i)=>[Number(m.id),i]));
  const snaps=[];
  for(const which of ['current','previous']){
    const s=await v680DBGet(v680Key(which,teamId));
    if(s?.match&&(!s.teamId||String(s.teamId)===String(teamId)))snaps.push({...s,_which:which});
  }
  /* Keep best snapshot for each match id. */
  const best=new Map();
  snaps.forEach(s=>{
    const id=Number(s.match?.id);if(!id)return;
    const prev=best.get(id);if(!prev||v891SnapshotScore(s)>v891SnapshotScore(prev))best.set(id,s);
  });

  const changes=[];
  for(const [id,snap] of best){
    const restored=scoutNormalizeMatch(snap.match),idx=byId.get(id),counts=v891MatchCounts(restored);
    if(idx==null){
      list.push(restored);byId.set(id,list.length-1);
      changes.push({type:'rescued',teamId,teamName,id,opponent:restored.opponent,date:restored.date,...counts,savedAt:snap.savedAt});
    }else if(v891IsSnapshotBetter(snap,list[idx])){
      list[idx]=restored;
      changes.push({type:'replaced',teamId,teamName,id,opponent:restored.opponent,date:restored.date,...counts,savedAt:snap.savedAt});
    }
  }
  equiposData[teamId].scoutingMatches=scoutClone(list);

  /* Restore an active id only when no active match is currently known. */
  if(!Number(equiposData[teamId].scoutingActiveId)){
    const live=changes.map(x=>list.find(m=>Number(m.id)===Number(x.id))).filter(m=>m&&m.status!=='finished')
      .sort((a,b)=>(Date.parse(b.updatedAt||b.createdAt||0)||0)-(Date.parse(a.updatedAt||a.createdAt||0)||0))[0];
    if(live)equiposData[teamId].scoutingActiveId=Number(live.id)||null;
  }
  return changes;
}

window.scoutV891RecoverLostScoutings=async function(manual=false){
  const result={rescued:0,replaced:0,teams:[],items:[],checkedAt:new Date().toISOString()};
  try{
    for(const teamId of Object.keys(EQUIPOS||{})){
      const changes=await v891ScanTeam(teamId);
      if(changes.length){
        result.teams.push(teamId);result.items.push(...changes);
        result.rescued+=changes.filter(x=>x.type==='rescued').length;
        result.replaced+=changes.filter(x=>x.type==='replaced').length;
      }
    }

    if(result.rescued||result.replaced){
      /* Rebind active-team globals after rescuing. */
      scoutingMatches=scoutArr(equiposData?.[equipoActivo]?.scoutingMatches).map(scoutNormalizeMatch);
      scoutingActiveId=Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null;
      guardarEstadoLocalSinCloud();
      try{scoutRender()}catch(_){}
      try{scoutRenderHome()}catch(_){}
    }
    v891LastRescue=result;
    v891Banner(result,!manual);
    if(manual){
      if(result.rescued||result.replaced){
        alert(`Recuperación completada: ${result.rescued} scoutings restaurados y ${result.replaced} actualizados desde copias de autoprotección.`);
      }else{
        alert('No se han encontrado más scoutings en las copias de autoprotección de este navegador.');
      }
    }
    return result;
  }catch(err){
    console.error('V8.9.1 recovery',err);
    if(manual)alert('No se pudo completar la recuperación: '+err.message);
    return result;
  }
};

/* Safer delete: create a checkpoint before deleting a scouting. */
const v891DeleteBase=window.scoutDeleteSaved;
window.scoutDeleteSaved=async function(id){
  const m=scoutingMatches.find(x=>Number(x.id)===Number(id));
  if(m){
    try{
      const snap={type:'volley-coach-scout-recovery',version:V891_VERSION,teamId:equipoActivo,teamName:EQUIPOS?.[equipoActivo]?.nombre||equipoActivo,
        savedAt:new Date().toISOString(),reason:'before-delete',activeId:Number(m.id),match:scoutClone(m)};
      await v680DBPut(v680Key('previous',equipoActivo),snap);
    }catch(_){}
  }
  return v891DeleteBase(id);
};

/* Public diagnostics. */
window.scoutV891Diagnostics=async function(){
  const snapshots={};
  for(const teamId of Object.keys(EQUIPOS||{})){
    snapshots[teamId]={current:await v680DBGet(v680Key('current',teamId)),previous:await v680DBGet(v680Key('previous',teamId))};
  }
  return {
    version:V891_VERSION,
    activeTeam:equipoActivo,
    storedTeams:Object.fromEntries(Object.keys(EQUIPOS||{}).map(t=>[t,scoutArr(equiposData?.[t]?.scoutingMatches).length])),
    lastRescue:v891LastRescue,
    snapshots:Object.fromEntries(Object.entries(snapshots).map(([t,x])=>[t,{
      current:x.current?.match?{id:x.current.match.id,opponent:x.current.match.opponent,savedAt:x.current.savedAt,counts:v891MatchCounts(x.current.match)}:null,
      previous:x.previous?.match?{id:x.previous.match.id,opponent:x.previous.match.opponent,savedAt:x.previous.savedAt,counts:v891MatchCounts(x.previous.match)}:null
    }]))
  };
};

if(window.VC_SCOUT_CORE)window.VC_SCOUT_CORE.version=V891_VERSION;

/* Run once after all startup migrations in this IIFE. */
/* V8.9.2 supersedes the limited automatic V8.9.1 recovery. */





/* =====================================================================
   V8.9.2 · MULTI-SOURCE RECOVERY CENTER
   ===================================================================== */
const V892_VERSION='8.9.2';
let v892Candidates=new Map(),v892Inventory={sources:{},candidates:[],scannedAt:null};

function v892Counts(m){const sets=scoutArr(m?.sets),rallies=sets.reduce((n,s)=>n+scoutArr(s?.rallies).length,0),actions=sets.reduce((n,s)=>n+scoutArr(s?.rallies).reduce((x,r)=>x+scoutArr(r?.actions).length,0),0)+scoutArr(m?.liveRally?.actions).length;return{sets:sets.length,rallies,actions}}
function v892Stamp(m){for(const v of [m?.updatedAt,m?.manualSavedAt,m?.resultCompleteAt,m?.endedAt,m?.createdAt,m?.date]){const t=Date.parse(v||'');if(Number.isFinite(t))return t}return 0}
function v892TeamName(t){return EQUIPOS?.[t]?.nombre||String(t||'Equipo')}
function v892Existing(team,id){return scoutArr(equiposData?.[team]?.scoutingMatches).find(m=>Number(m.id)===Number(id))||null}
function v892State(candidate){const ex=v892Existing(candidate.teamId,candidate.match.id);if(!ex)return'missing';const c=v892Counts(candidate.match),e=v892Counts(ex);if(c.actions>e.actions||c.rallies>e.rallies)return'richer';if(c.actions===e.actions&&c.rallies===e.rallies&&v892Stamp(candidate.match)>v892Stamp(ex)+1500)return'richer';return'duplicate'}
function v892AddCandidate(source,teamId,raw,meta={}){if(!raw||typeof raw!=='object')return;let m;try{m=scoutNormalizeMatch(raw)}catch(_){return}if(!Number(m.id))return;const team=EQUIPOS?.[teamId]?teamId:(meta.teamHint&&EQUIPOS?.[meta.teamHint]?meta.teamHint:equipoActivo),counts=v892Counts(m),key=`${source}|${team}|${m.id}|${meta.slot||''}`;const c={key,source,teamId:team,teamName:v892TeamName(team),match:m,counts,meta,state:'duplicate'};c.state=v892State(c);v892Candidates.set(key,c)}
function v892ExtractMatches(obj,source,teamHint='',depth=0,path='root'){
  if(depth>7||obj==null)return;
  if(Array.isArray(obj)){if(obj.length&&obj.every(x=>x&&typeof x==='object')&&obj.some(x=>Number(x?.id)&&Array.isArray(x?.sets))){obj.forEach((m,i)=>v892AddCandidate(source,teamHint,m,{slot:`${path}[${i}]`,teamHint}));return}obj.forEach((x,i)=>v892ExtractMatches(x,source,teamHint,depth+1,`${path}[${i}]`));return}
  if(typeof obj!=='object')return;
  if(obj.match&&Number(obj.match?.id)&&Array.isArray(obj.match?.sets))v892AddCandidate(source,obj.teamId||teamHint,obj.match,{slot:path+'.match',teamHint});
  if(Array.isArray(obj.scoutingMatches))obj.scoutingMatches.forEach((m,i)=>v892AddCandidate(source,teamHint,m,{slot:`${path}.scoutingMatches[${i}]`,teamHint}));
  if(Array.isArray(obj.matches)&&obj.matches.some(m=>Number(m?.id)&&Array.isArray(m?.sets)))obj.matches.forEach((m,i)=>v892AddCandidate(source,obj.teamId||teamHint,m,{slot:`${path}.matches[${i}]`,teamHint}));
  if(obj.equiposData&&typeof obj.equiposData==='object')Object.entries(obj.equiposData).forEach(([t,v])=>v892ExtractMatches(v,source,t,depth+1,`${path}.equiposData.${t}`));
  for(const t of Object.keys(EQUIPOS||{}))if(obj[t]&&typeof obj[t]==='object')v892ExtractMatches(obj[t],source,t,depth+1,`${path}.${t}`);
}
function v892OpenDB(name,version=1){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB no disponible'));return}const r=indexedDB.open(name,version);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('No se pudo abrir '+name))})}
async function v892ReadAll(name,store){try{const db=await v892OpenDB(name,1);if(!db.objectStoreNames.contains(store)){db.close();return[]}const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});db.close();return rows}catch(err){console.warn('V8.9.2 read',name,err);return[]}}
async function v892WriteV702(teamId,matches,activeId=null){try{const db=await v892OpenDB('VolleyCoachScoutingV702',1);if(!db.objectStoreNames.contains('scoutingByTeam')){db.close();return false}await new Promise((resolve,reject)=>{const tx=db.transaction('scoutingByTeam','readwrite');tx.objectStore('scoutingByTeam').put({teamId:String(teamId),version:V892_VERSION,savedAt:new Date().toISOString(),reason:'recovery-v892',activeId:activeId?Number(activeId):null,matches:scoutClone(matches)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});db.close();return true}catch(err){console.warn('V8.9.2 write V702',err);return false}}
function v892ScanKnownLocalStorage(){
  const sources={};
  const inspect=(key,label)=>{try{const raw=localStorage.getItem(key);if(!raw)return;const obj=JSON.parse(raw);sources[label]=(sources[label]||0)+1;v892ExtractMatches(obj,label,'',0,key)}catch(_){}};
  inspect('volleyCoachStateV43','Estado principal V43');inspect('volleyCoachTeamsV42','Estado antiguo V42');
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';if(!/^(volleyCoach|volley_|volleyV)/i.test(key)||['volleyCoachStateV43','volleyCoachTeamsV42'].includes(key))continue;try{const raw=localStorage.getItem(key);if(!raw||raw.length<20||(!raw.startsWith('{')&&!raw.startsWith('[')))continue;const obj=JSON.parse(raw),before=v892Candidates.size;v892ExtractMatches(obj,'LocalStorage '+key,'',0,key);if(v892Candidates.size>before)sources['Otras copias localStorage']=(sources['Otras copias localStorage']||0)+1}catch(_){}}
  return sources;
}
async function v892Collect(){
  v892Candidates=new Map();const sources=v892ScanKnownLocalStorage();
  const independent=await v892ReadAll('VolleyCoachScoutingV702','scoutingByTeam');
  independent.forEach((row,ri)=>{const before=v892Candidates.size;scoutArr(row?.matches).forEach((m,i)=>v892AddCandidate('IndexedDB V7.0.2',row.teamId,m,{slot:`row${ri}.${i}`}));if(v892Candidates.size>before)sources['IndexedDB V7.0.2']=(sources['IndexedDB V7.0.2']||0)+1});
  const journal=typeof window.scoutV902JournalReadAll==='function'?await window.scoutV902JournalReadAll():[];
  journal.forEach((row,i)=>{
    if(row?.match){
      v892AddCandidate('Journal V9.0.2',row.teamId,row.match,{slot:`journal${i}`});
      sources['Journal V9.0.2']=(sources['Journal V9.0.2']||0)+1;
    }
  });

  const rec=await v892ReadAll('volley-coach-match-recovery-v680','snapshots');
  rec.forEach((row,i)=>{const value=row?.value||row;if(value?.match){v892AddCandidate('Snapshot V6.8',value.teamId||String(row?.key||'').split(':')[1],value.match,{slot:String(row?.key||i)});sources['Snapshots V6.8']=(sources['Snapshots V6.8']||0)+1}});
  for(const team of Object.keys(EQUIPOS||{}))for(const which of ['current','previous']){try{const value=JSON.parse(localStorage.getItem(`volley_scout_recovery_v680_${which}_${team}`)||'null');if(value?.match){v892AddCandidate('Snapshot fallback',team,value.match,{slot:`${which}:${team}`});sources['Snapshot fallback']=(sources['Snapshot fallback']||0)+1}}catch(_){}}
  const order={missing:0,richer:1,duplicate:2};
  const rows=[...v892Candidates.values()].map(c=>({...c,state:v892State(c)})).sort((a,b)=>(order[a.state]-order[b.state])||(v892Stamp(b.match)-v892Stamp(a.match)));
  v892Candidates=new Map(rows.map(c=>[c.key,c]));v892Inventory={sources,candidates:rows.map(c=>({key:c.key,source:c.source,teamId:c.teamId,teamName:c.teamName,id:c.match.id,opponent:c.match.opponent,date:c.match.date,status:c.match.status,counts:c.counts,state:c.state,updatedAt:c.match.updatedAt||null})),scannedAt:new Date().toISOString()};return rows;
}
function v892Render(rows){
  const status=$('scout-v892-status'),list=$('scout-v892-list'),sources=$('scout-v892-sources');if(!status||!list||!sources)return;
  const recoverable=rows.filter(x=>x.state!=='duplicate');status.className='scout-v892-status '+(recoverable.length?'ok':'warn');
  status.innerHTML=recoverable.length?`<b>Se han encontrado ${recoverable.length} copias recuperables.</b> Ninguna fuente se modificará hasta que pulses Restaurar.`:`<b>No se ha encontrado una copia distinta a la lista actual.</b> Importa un JSON si tienes una copia externa.`;
  sources.innerHTML=Object.entries(v892Inventory.sources).map(([k,v])=>`<span class="scout-v892-source">${esc(k)} · ${v}</span>`).join('')||'<span class="scout-v892-source">Sin fuentes con datos</span>';
  list.innerHTML=rows.length?rows.map(c=>{const badge=c.state==='missing'?'FALTANTE':c.state==='richer'?'MÁS COMPLETA':'YA EXISTE';return `<article class="scout-v892-row ${c.state}"><div class="scout-v892-main"><b>${esc(c.teamName)} · ${esc(c.match.opponent||'Rival')}</b><small>${esc(c.match.date||'Sin fecha')} · ${esc(c.source)} · ID ${Number(c.match.id)}</small></div><div class="scout-v892-cell"><span>Contenido</span><b>${c.counts.rallies} rallies · ${c.counts.actions} acc.</b></div><div class="scout-v892-cell"><span>Estado</span><b>${esc(c.match.status||'—')}</b></div><div class="scout-v892-cell"><span>Actualizado</span><b>${c.match.updatedAt?new Date(c.match.updatedAt).toLocaleDateString('es-ES'):'—'}</b></div><div><span class="scout-v892-badge ${c.state}">${badge}</span></div><button class="${c.state==='duplicate'?'ghost':'primary'}" ${c.state==='duplicate'?'disabled':''} onclick="scoutV892RestoreCandidate('${esc(c.key)}')">Restaurar</button></article>`}).join(''):'<div class="match-empty">No hay scoutings en las fuentes locales inspeccionadas.</div>';
}
window.scoutV892ScanRecovery=async function(){const status=$('scout-v892-status');if(status){status.className='scout-v892-status';status.textContent='Buscando en todas las copias locales…'}const rows=await v892Collect();v892Render(rows);return rows};
window.scoutV892OpenRecoveryCenter=function(){$('scout-v892-recovery-modal')?.classList.add('open');void window.scoutV892ScanRecovery()};
window.scoutV892CloseRecoveryCenter=function(){$('scout-v892-recovery-modal')?.classList.remove('open')};
function v892ProtectBeforeRestore(){try{const raw=localStorage.getItem(APP_STORAGE_KEY);if(raw)localStorage.setItem('volley_recovery_pre_v892',raw)}catch(_){}}
window.scoutV892RestoreCandidate=async function(key){
  const c=v892Candidates.get(String(key));if(!c||c.state==='duplicate')return false;
  if(!confirm(`Restaurar ${c.teamName} vs ${c.match.opponent||'Rival'}?\n\n${c.counts.rallies} rallies · ${c.counts.actions} acciones\nFuente: ${c.source}`))return false;
  v892ProtectBeforeRestore();const team=c.teamId,restored=scoutNormalizeMatch(c.match);if(!equiposData[team])equiposData[team]=estadoEquipoVacio(team);
  const list=scoutArr(equiposData[team].scoutingMatches).map(scoutNormalizeMatch),idx=list.findIndex(m=>Number(m.id)===Number(restored.id));if(idx>=0)list[idx]=restored;else list.push(restored);equiposData[team].scoutingMatches=scoutClone(list);
  if(team===equipoActivo){scoutingMatches=scoutClone(list).map(scoutNormalizeMatch);if(restored.status!=='finished')scoutingActiveId=Number(restored.id)||scoutingActiveId;equiposData[team].scoutingActiveId=scoutingActiveId||null;guardarEquipoEnMemoria()}
  guardarEstadoLocalSinCloud();await v892WriteV702(team,list,equiposData[team].scoutingActiveId||null);try{scoutRenderHome();scoutRenderAnalysis();scoutRender()}catch(_){}
  await window.scoutV892ScanRecovery();alert('Scouting restaurado y protegido de nuevo en la copia independiente.');return true;
};
window.scoutV892RestoreAll=async function(){
  const rows=[...v892Candidates.values()].filter(c=>c.state!=='duplicate');if(!rows.length){alert('No hay scoutings recuperables en el inventario actual.');return}
  if(!confirm(`Restaurar ${rows.length} copias recuperables?`))return;v892ProtectBeforeRestore();const byTeam=new Map();
  for(const c of rows){const team=c.teamId,restored=scoutNormalizeMatch(c.match);if(!equiposData[team])equiposData[team]=estadoEquipoVacio(team);const list=byTeam.get(team)||scoutArr(equiposData[team].scoutingMatches).map(scoutNormalizeMatch);const idx=list.findIndex(m=>Number(m.id)===Number(restored.id));if(idx>=0)list[idx]=restored;else list.push(restored);byTeam.set(team,list)}
  for(const [team,list] of byTeam){equiposData[team].scoutingMatches=scoutClone(list);await v892WriteV702(team,list,equiposData[team].scoutingActiveId||null)}
  scoutingMatches=scoutArr(equiposData?.[equipoActivo]?.scoutingMatches).map(scoutNormalizeMatch);scoutingActiveId=Number(equiposData?.[equipoActivo]?.scoutingActiveId)||null;guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();try{scoutRenderHome();scoutRenderAnalysis();scoutRender()}catch(_){}
  await window.scoutV892ScanRecovery();alert('Recuperación múltiple completada.');
};
function v892Download(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
window.scoutV892ExportInventory=function(){v892Download({type:'volley-coach-recovery-inventory',version:V892_VERSION,...v892Inventory},`Volley_Coach_Recovery_Diagnostic_${new Date().toISOString().slice(0,10)}.json`)};
window.scoutV892ImportRecoveryFile=async function(ev){
  const file=ev?.target?.files?.[0];if(!file)return;
  try{const obj=JSON.parse(await file.text()),before=v892Candidates.size;v892ExtractMatches(obj,'Archivo '+file.name,'',0,'file');
    if(obj?.type==='volley-coach-backup'){Object.entries(obj.localStorage||{}).forEach(([k,v])=>{try{v892ExtractMatches(JSON.parse(v),'Backup V7.9 · '+k,'',0,k)}catch(_){}});scoutArr(obj.indexedDB?.VolleyCoachScoutingV702?.scoutingByTeam).forEach((row,ri)=>scoutArr(row?.matches).forEach((m,i)=>v892AddCandidate('Backup V7.9 · IndexedDB',row.teamId,m,{slot:`${ri}.${i}`})));scoutArr(obj.indexedDB?.['volley-coach-match-recovery-v680']?.snapshots).forEach((row,i)=>{const val=row?.value||row;if(val?.match)v892AddCandidate('Backup V7.9 · Snapshot',val.teamId,val.match,{slot:String(i)})})}
    if(v892Candidates.size===before)throw new Error('El archivo no contiene scoutings reconocibles.');
    const order={missing:0,richer:1,duplicate:2},rows=[...v892Candidates.values()].map(c=>({...c,state:v892State(c)})).sort((a,b)=>(order[a.state]-order[b.state])||(v892Stamp(b.match)-v892Stamp(a.match)));
    v892Candidates=new Map(rows.map(c=>[c.key,c]));v892Inventory.candidates=rows.map(c=>({key:c.key,source:c.source,teamId:c.teamId,id:c.match.id,opponent:c.match.opponent,date:c.match.date,counts:c.counts,state:c.state}));v892Render(rows);alert('Copia importada al inventario. Ahora puedes restaurar solo el scouting que necesites.');
  }catch(err){alert('No se pudo leer la copia: '+err.message)}finally{if(ev?.target)ev.target.value=''}
};
window.scoutV892Diagnostics=async function(){const rows=await v892Collect();return{version:V892_VERSION,sources:v892Inventory.sources,recoverable:rows.filter(x=>x.state!=='duplicate').map(x=>({source:x.source,team:x.teamId,id:x.match.id,opponent:x.match.opponent,counts:x.counts,state:x.state})),totalCandidates:rows.length}};
if(window.VC_SCOUT_CORE)window.VC_SCOUT_CORE.version=V892_VERSION;
setTimeout(async()=>{try{const rows=await v892Collect(),n=rows.filter(x=>x.state!=='duplicate').length,box=$('scout-v891-rescue-banner');if(box&&n){box.className='scout-v891-rescue-banner ok';box.innerHTML=`<strong>Se han detectado ${n} ${n===1?'copia recuperable':'copias recuperables'}.</strong><span>Abre el Centro de recuperación para revisarlas antes de restaurar.</span><div class="actions"><button class="primary" onclick="scoutV892OpenRecoveryCenter()">Abrir recuperación</button></div>`}}catch(err){console.warn('V8.9.2 inventory',err)}},450);





/* =====================================================================
   V8.9.3 · SCOUTING SAFE / VERSIONED VAULT + CLOUD READ-ONLY RECOVERY
   ===================================================================== */
const V893_VERSION='8.9.3',V893_DB='VolleyCoachScoutingVaultV893',V893_STORE='versions';
let v893VaultCache=[],v893CloudCandidates=new Map(),v893LastWrite=new Map(),v893CloudLastChecked=null;

function v893Counts(m){const sets=scoutArr(m?.sets),rallies=sets.reduce((n,s)=>n+scoutArr(s?.rallies).length,0),actions=sets.reduce((n,s)=>n+scoutArr(s?.rallies).reduce((x,r)=>x+scoutArr(r?.actions).length,0),0)+scoutArr(m?.liveRally?.actions).length;return{sets:sets.length,rallies,actions}}
function v893Stamp(m){for(const x of [m?.updatedAt,m?.manualSavedAt,m?.resultCompleteAt,m?.endedAt,m?.createdAt,m?.date]){const t=Date.parse(x||'');if(Number.isFinite(t))return t}return 0}
function v893Sig(m){const c=v893Counts(m),s=scoutSetsScore(m);return `${m?.id}|${m?.status}|${c.rallies}|${c.actions}|${s.us}-${s.opponent}|${m?.currentSet||''}`}
function v893ReasonGroup(reason){reason=String(reason||'');if(reason.includes('cloud'))return'cloud';if(reason.includes('delete')||reason.includes('final'))return'critical';if(reason.includes('manual'))return'manual';if(reason.includes('restore'))return'manual';return''}
function v893ReasonLabel(r){const map={manual:'Manual',autosave:'Automático','before-delete':'Antes de borrar','before-finalize':'Antes de finalizar','after-finalize':'Finalizado','cloud-read':'Nube · lectura','cloud-before-upload':'Nube · antes de subir','cloud-download':'Nube · descarga','cloud-upload':'Tras subida','before-cloud-download':'Antes de descargar nube','restore':'Restauración','recovery-v892':'Recuperación'};return map[r]||String(r||'Checkpoint')}
function v893OpenDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(V893_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(V893_STORE))db.createObjectStore(V893_STORE,{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('No se pudo abrir la Caja fuerte'))})}
async function v893All(){try{const db=await v893OpenDB(),rows=await new Promise((resolve,reject)=>{const tx=db.transaction(V893_STORE,'readonly'),r=tx.objectStore(V893_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});db.close();return rows}catch(err){console.warn('V8.9.3 vault read',err);return[]}}
async function v893Put(row){const db=await v893OpenDB();await new Promise((resolve,reject)=>{const tx=db.transaction(V893_STORE,'readwrite');tx.objectStore(V893_STORE).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});db.close();return true}
async function v893Delete(key){const db=await v893OpenDB();await new Promise((resolve,reject)=>{const tx=db.transaction(V893_STORE,'readwrite');tx.objectStore(V893_STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
function v893CloudMirror(teamId,m,reason,createdAt){
  if(!equiposData?.[teamId]||!m)return;
  const mirror=equiposData[teamId].scoutingSafeCloud&&typeof equiposData[teamId].scoutingSafeCloud==='object'?equiposData[teamId].scoutingSafeCloud:{};
  mirror[String(m.id)]={savedAt:createdAt||new Date().toISOString(),reason,match:scoutClone(m)};equiposData[teamId].scoutingSafeCloud=mirror;
}
async function v893Prune(teamId,matchId){
  const all=(await v893All()).filter(x=>String(x.teamId)===String(teamId)&&Number(x.matchId)===Number(matchId)).sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
  if(all.length<=36)return;
  const protectedReasons=new Set(['manual','before-delete','before-finalize','after-finalize','cloud-read','cloud-before-upload','restore','recovery-v892']);
  let keep=36;for(const row of all.slice(36)){if(protectedReasons.has(row.reason))continue;if(keep<=36)await v893Delete(row.key);keep++}
}
async function v893CheckpointMatch(match,reason='autosave',force=false,teamId=equipoActivo,source='local'){
  if(!match||!Number(match.id))return false;const m=scoutNormalizeMatch(match),counts=v893Counts(m),now=Date.now(),sig=v893Sig(m),last=v893LastWrite.get(`${teamId}:${m.id}`);
  const major=counts.rallies>0&&(!last||counts.rallies!==last.rallies)&&counts.rallies%5===0;
  if(!force&&last&&last.sig===sig)return false;
  if(!force&&last&&!major&&now-last.at<60000)return false;
  const createdAt=new Date().toISOString(),key=`${teamId}:${m.id}:${now}:${Math.random().toString(36).slice(2,7)}`;
  const row={key,version:V893_VERSION,teamId:String(teamId),teamName:EQUIPOS?.[teamId]?.nombre||teamId,matchId:Number(m.id),opponent:m.opponent||'Rival',matchDate:m.date||'',createdAt,reason,source,signature:sig,counts,status:m.status||'',match:scoutClone(m)};
  await v893Put(row);v893LastWrite.set(`${teamId}:${m.id}`,{sig,at:now,rallies:counts.rallies});
  if(source==='local')v893CloudMirror(teamId,m,reason,createdAt);
  void v893Prune(teamId,m.id);return true;
}
window.scoutV893CheckpointAll=async function(manual=true,reason='manual',force=true){
  let saved=0;for(const teamId of Object.keys(EQUIPOS||{})){for(const m of scoutArr(equiposData?.[teamId]?.scoutingMatches)){if(await v893CheckpointMatch(m,reason,force,teamId,'local'))saved++}}
  if(manual){guardarEstadoLocalSinCloud();alert(`Caja fuerte actualizada: ${saved} ${saved===1?'versión guardada':'versiones guardadas'}.`)}
  try{await window.scoutV893RenderVault()}catch(_){}return saved;
};

function v893CurrentState(team,id){const ex=scoutArr(equiposData?.[team]?.scoutingMatches).find(m=>Number(m.id)===Number(id));return ex||null}
function v893CandidateState(team,m){const ex=v893CurrentState(team,m.id);if(!ex)return'missing';const a=v893Counts(m),b=v893Counts(ex);if(a.actions>b.actions||a.rallies>b.rallies||(a.actions===b.actions&&a.rallies===b.rallies&&v893Stamp(m)>v893Stamp(ex)+1500))return'richer';return'duplicate'}
async function v893RestoreMatch(teamId,raw,source='vault'){
  const restored=scoutNormalizeMatch(raw);if(!restored?.id)return false;
  const current=v893CurrentState(teamId,restored.id);if(current)await v893CheckpointMatch(current,'before-restore',true,teamId,'local');
  if(!equiposData[teamId])equiposData[teamId]=estadoEquipoVacio(teamId);const list=scoutArr(equiposData[teamId].scoutingMatches).map(scoutNormalizeMatch),idx=list.findIndex(m=>Number(m.id)===Number(restored.id));if(idx>=0)list[idx]=restored;else list.push(restored);equiposData[teamId].scoutingMatches=scoutClone(list);
  if(teamId===equipoActivo){scoutingMatches=scoutClone(list).map(scoutNormalizeMatch);if(restored.status!=='finished')scoutingActiveId=Number(restored.id)||scoutingActiveId;equiposData[teamId].scoutingActiveId=scoutingActiveId||null;guardarEquipoEnMemoria()}
  guardarEstadoLocalSinCloud();try{await v892WriteV702(teamId,list,equiposData[teamId].scoutingActiveId||null)}catch(_){}
  await v893CheckpointMatch(restored,'restore',true,teamId,'local');try{scoutRenderHome();scoutRenderAnalysis();scoutRender()}catch(_){}return true;
}
window.scoutV893RestoreVersion=async function(key){const row=(await v893All()).find(x=>x.key===key);if(!row)return alert('La versión ya no está disponible.');if(!confirm(`Restaurar esta versión?\n\n${row.teamName} vs ${row.opponent}\n${row.counts.rallies} rallies · ${row.counts.actions} acciones\n${new Date(row.createdAt).toLocaleString('es-ES')}`))return;await v893RestoreMatch(row.teamId,row.match,'vault');alert('Versión restaurada. La versión anterior también ha quedado protegida.');await window.scoutV893RenderVault()};
window.scoutV893ExportVersion=async function(key){const row=(await v893All()).find(x=>x.key===key);if(!row)return;const blob=new Blob([JSON.stringify({type:'volley-coach-scout-vault-version',version:V893_VERSION,...row},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${scoutSafeFilename((row.matchDate||'partido')+'_'+row.opponent)}_vault_${row.createdAt.replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)};
window.scoutV893ExportVault=async function(){const rows=await v893All(),blob=new Blob([JSON.stringify({type:'volley-coach-scout-vault',version:V893_VERSION,createdAt:new Date().toISOString(),versions:rows},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Volley_Coach_Scout_Vault_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)};

window.scoutV893RenderVault=async function(){
  const list=$('v893-vault-list'),status=$('v893-vault-status');if(!list||!status)return;const team=$('v893-team-filter')?.value||'',reason=$('v893-reason-filter')?.value||'';let rows=await v893All();v893VaultCache=rows;
  const all=rows,matchKeys=new Set(all.map(x=>`${x.teamId}:${x.matchId}`)),latest=all.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0))[0];
  $('v893-kpi-versions').textContent=all.length;$('v893-kpi-matches').textContent=matchKeys.size;$('v893-kpi-last').textContent=latest?new Date(latest.createdAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—';$('v893-kpi-last-copy').textContent=latest?`${latest.teamName} · ${latest.opponent}`:'sin checkpoint';
  rows=all.filter(x=>(!team||x.teamId===team)&&(!reason||(reason==='cloud'?String(x.reason).includes('cloud'):String(x.reason).includes(reason)))).sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0)).slice(0,120);
  status.className='v893-safe-status '+(all.length?'ok':'warn');status.innerHTML=all.length?`<b>${all.length} versiones protegidas.</b> Se conservan fuera del estado principal y se limitan automáticamente los autosaves antiguos.`:'<b>Todavía no hay versiones.</b> Pulsa “Proteger estado ahora”.';
  list.innerHTML=rows.length?rows.map(r=>`<article class="v893-version-row ${v893ReasonGroup(r.reason)}"><div class="v893-version-main"><b>${esc(r.teamName)} · ${esc(r.opponent)}</b><small>${esc(r.matchDate||'Sin fecha')} · ${esc(v893ReasonLabel(r.reason))} · ${esc(r.source||'local')}</small></div><div class="v893-version-cell"><span>Contenido</span><b>${r.counts.rallies} rallies · ${r.counts.actions} acc.</b></div><div class="v893-version-cell"><span>Fecha copia</span><b>${new Date(r.createdAt).toLocaleString('es-ES')}</b></div><div class="v893-version-cell"><span>Estado</span><b>${esc(r.status||'—')}</b></div><div><span class="v893-pill">${esc(v893ReasonLabel(r.reason))}</span></div><div><button class="ghost" onclick="scoutV893ExportVersion('${r.key}')">JSON</button> <button class="primary" onclick="scoutV893RestoreVersion('${r.key}')">Restaurar</button></div></article>`).join(''):'<div class="match-empty">No hay versiones con estos filtros.</div>';
};

function v893ExtractCloud(state){
  const out=[];for(const teamId of Object.keys(EQUIPOS||{})){const team=state?.equiposData?.[teamId]||{};scoutArr(team.scoutingMatches).forEach(m=>out.push({teamId,source:'cloud-state',match:scoutNormalizeMatch(m)}));const mirror=team.scoutingSafeCloud&&typeof team.scoutingSafeCloud==='object'?team.scoutingSafeCloud:{};Object.values(mirror).forEach(x=>{if(x?.match)out.push({teamId,source:'cloud-safe-mirror',savedAt:x.savedAt,reason:x.reason,match:scoutNormalizeMatch(x.match)})})}return out;
}
window.scoutV893CaptureCloudState=async function(state,reason='cloud-read',remoteUpdatedAt=null){let saved=0;for(const item of v893ExtractCloud(state)){if(await v893CheckpointMatch(item.match,reason,true,item.teamId,'cloud'))saved++}return saved};
window.scoutV893CaptureRemoteBeforeUpload=async function(){
  if(!cloudClient||!cloudUser)return 0;const {data,error}=await cloudClient.from('volley_state').select('state,updated_at').eq('user_id',cloudUser.id).maybeSingle();if(error||!data?.state)return 0;return window.scoutV893CaptureCloudState(data.state,'cloud-before-upload',data.updated_at);
};
window.scoutV893CloudReadOnly=async function(){
  const status=$('v893-cloud-status'),list=$('v893-cloud-list');if(status){status.className='v893-safe-status';status.textContent='Consultando Supabase en modo solo lectura…'}if(list)list.innerHTML='';
  try{
    if(!cloudClient)crearCloudClient();if(!cloudClient)throw new Error('Supabase no está configurado en este dispositivo.');const ses=await cloudClient.auth.getSession();cloudUser=ses?.data?.session?.user||cloudUser;if(!cloudUser)throw new Error('Inicia sesión desde el botón Nube y vuelve a comprobar.');
    const {data,error}=await cloudClient.from('volley_state').select('state,updated_at').eq('user_id',cloudUser.id).maybeSingle();if(error)throw error;if(!data?.state)throw new Error('La nube no contiene un estado guardado.');
    const items=v893ExtractCloud(data.state),dedup=new Map();items.forEach(x=>{const key=`${x.teamId}:${x.match.id}`;const prev=dedup.get(key);if(!prev||v893Counts(x.match).actions>v893Counts(prev.match).actions||v893Stamp(x.match)>v893Stamp(prev.match))dedup.set(key,x)});v893CloudCandidates=dedup;v893CloudLastChecked=data.updated_at||new Date().toISOString();
    await window.scoutV893CaptureCloudState(data.state,'cloud-read',data.updated_at);
    const rows=[...dedup.values()].sort((a,b)=>v893Stamp(b.match)-v893Stamp(a.match));$('v893-kpi-cloud').textContent=rows.length;$('v893-kpi-cloud-copy').textContent=data.updated_at?`actualizada ${new Date(data.updated_at).toLocaleString('es-ES')}`:'copia encontrada';
    if(status){status.className='v893-safe-status ok';status.innerHTML=`<b>${rows.length} scoutings encontrados en Supabase.</b> La consulta ha sido solo lectura. Además se ha conservado una copia local en la Caja fuerte antes de cualquier posible subida.`}
    if(list)list.innerHTML=rows.length?rows.map(x=>{const c=v893Counts(x.match),state=v893CandidateState(x.teamId,x.match),label=state==='missing'?'FALTANTE':state==='richer'?'MÁS COMPLETA':'YA LOCAL';return `<article class="v893-version-row cloud"><div class="v893-version-main"><b>${esc(EQUIPOS?.[x.teamId]?.nombre||x.teamId)} · ${esc(x.match.opponent||'Rival')}</b><small>${esc(x.match.date||'Sin fecha')} · ${esc(x.source)}</small></div><div class="v893-version-cell"><span>Contenido nube</span><b>${c.rallies} rallies · ${c.actions} acc.</b></div><div class="v893-version-cell"><span>Actualizado</span><b>${x.match.updatedAt?new Date(x.match.updatedAt).toLocaleString('es-ES'):'—'}</b></div><div class="v893-version-cell"><span>Estado local</span><b>${label}</b></div><div><span class="v893-pill ${state}">${label}</span></div><button class="${state==='duplicate'?'ghost':'primary'}" ${state==='duplicate'?'disabled':''} onclick="scoutV893RestoreCloud('${x.teamId}',${Number(x.match.id)})">Restaurar local</button></article>`}).join(''):'<div class="match-empty">La nube no contiene scoutings.</div>';
    await window.scoutV893RenderVault();return rows;
  }catch(err){if(status){status.className='v893-safe-status warn';status.innerHTML=`<b>No se pudo consultar la nube.</b> ${esc(err?.message||String(err))}`}$('v893-kpi-cloud').textContent='—';$('v893-kpi-cloud-copy').textContent='sin acceso';return[]}
};
window.scoutV893RestoreCloud=async function(teamId,id){const item=v893CloudCandidates.get(`${teamId}:${Number(id)}`);if(!item)return alert('Esa copia de nube ya no está cargada. Pulsa Comprobar nube.');const c=v893Counts(item.match);if(!confirm(`Restaurar SOLO este scouting desde nube?\n\n${item.match.opponent||'Rival'} · ${c.rallies} rallies · ${c.actions} acciones\n\nLa nube no se modificará.`))return;await v893RestoreMatch(teamId,item.match,'cloud-read');alert('Scouting restaurado localmente. Supabase no se ha modificado.');await window.scoutV893CloudReadOnly()};
window.scoutV893OpenRecoveryCenter=function(){if(typeof window.scoutV892OpenRecoveryCenter==='function')window.scoutV892OpenRecoveryCenter()};

/* Hook final save layer: current state remains in V7.0.2, while this vault keeps history. */
/* V9.5: Caja fuerte V8.9.3 queda en modo legado. No intercepta cada scoutSave. */

/* Important lifecycle checkpoints. */
/* V9.5: sin checkpoint automático antes de borrar; recuperación principal = Journal + nube. */
/* V9.5: finalizar no crea versiones duplicadas en Caja fuerte. */

window.scoutV893Diagnostics=async function(){const rows=await v893All();return{version:V893_VERSION,versions:rows.length,matches:new Set(rows.map(x=>`${x.teamId}:${x.matchId}`)).size,last:rows.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0))[0]||null,cloudLastChecked:v893CloudLastChecked}};
if(window.VC_SCOUT_CORE){window.VC_SCOUT_CORE.version=V893_VERSION;window.VC_SCOUT_CORE.vault={checkpoint:window.scoutV893CheckpointAll,render:window.scoutV893RenderVault,cloudRead:window.scoutV893CloudReadOnly}}
/* V9.5: baseline automático de Caja fuerte desactivado. */



/* V9.2 · minimal preparation bridge used by the fused render router. */
window.VC_SCOUT_FAST_BRIDGE_V92={
  getActive:()=>scoutActive(),
  prepare:()=>{
    const m=scoutActive();
    if(m){
      try{vcEnsureProMatch(m)}catch(_){}
      try{vcApplyAutoLibero(m,false)}catch(_){}
    }
    return m;
  },
};

})();
