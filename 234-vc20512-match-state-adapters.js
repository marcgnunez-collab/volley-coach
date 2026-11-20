(()=>{
'use strict';
const VERSION='13.1.0';
const State=window.MatchState||window.VC_MATCH_STATE;
if(!State){console.warn('V13.1: MatchState no disponible');return}
const $=id=>document.getElementById(id);
const captured={
  point:window.v121AwardPoint,
  undo:window.v121UndoRally,
  lineup:window.v119SaveLineup,
  change:window.v120SaveChange,
  liberoAuto:window.v120ToggleLiberoAuto,
  liberoEnter:window.v120LiberoEnter,
  liberoExit:window.v120LiberoExit,
  event:window.v120SaveEvent,
  finishSet:window.v120FinishSet,
  newSet:window.v121StartNewSet,
  finalResult:window.v120SaveFinalResult,
  matchQuickEvent:window.v800QuickEvent,
  matchCode:window.v800AddCode,
  proCode:window.v900RegisterCode,
  proVisual:window.v900RegisterVisual
};
let operationSeq=0,lastOperation='boot',renderQueued=false;
/* V20.5.55: one FIFO for score/undo via Vite TypeScript, never a second writer.
 * The existing V12.1 commands stay as the only persistence/video owners.
 * If the bundle has not loaded, the captured original command still works.
 */
let rallyCoordinator=null,rallyCoordinatorStatus='awaiting-module',notifiedContextDrops=0;
function getRallyCoordinator(){
  if(rallyCoordinator)return rallyCoordinator;
  const bridge=window.VC_RALLY_WRITER_20555;
  if(!bridge||bridge.VERSION!=='20.5.55'||bridge.singleNativeWriter!==true||typeof bridge.create!=='function')return null;
  if(typeof captured.point!=='function'||typeof captured.undo!=='function'){
    rallyCoordinatorStatus='missing-native-command';return null;
  }
  try{
    const next=bridge.create({readCurrent:()=>State.getActive?.(),awardPoint:captured.point,undoRally:captured.undo});
    if(typeof next?.awardPoint!=='function'||typeof next?.undoRally!=='function'||typeof next?.report!=='function'){
      rallyCoordinatorStatus='invalid-module';return null;
    }
    rallyCoordinator=next;rallyCoordinatorStatus='active';return rallyCoordinator;
  }catch(error){rallyCoordinatorStatus='module-error';console.warn('V20.5.55 coordinator unavailable',error);return null}
}
async function delegateRallyCommand(operation,winner){
  const coordinator=getRallyCoordinator();
  if(coordinator){
    const result=operation==='point'?await coordinator.awardPoint(winner):await coordinator.undoRally();
    const discarded=coordinator.report().contextDiscarded||0;
    if(discarded>notifiedContextDrops){
      notifiedContextDrops=discarded;
      window.alert?.('No se ha registrado la acción porque se estaba cambiando de partido. Comprueba el marcador antes de continuar.');
    }
    return result;
  }
  // Fallback is only for an ABSENT coordinator, never for a failed native call.
  return operation==='point'?captured.point(winner):captured.undo();
}
function ensureMutable(){const m=State.getActive?.();if(!m)throw new Error('No hay un scouting activo.');if(State.isReadonly?.(m))throw new Error('Este scouting está finalizado y está abierto en modo solo lectura.');return m}
function updateChip(){
  let chip=$('v131-state-chip');const host=$('v123-scout-switchbar')||document.querySelector('#scout-workspace-v900 .v119-probar');
  if(!chip&&host){chip=document.createElement('span');chip.id='v131-state-chip';chip.className='v131-state-chip';host.appendChild(chip)}
  if(!chip)return;const snap=State.getSnapshot?.();chip.classList.toggle('readonly',!!snap?.readonly);chip.textContent=snap?(snap.readonly?'MATCHSTATE · SOLO LECTURA':'MATCHSTATE · SINCRONIZADO'):'MATCHSTATE · SIN PARTIDO';chip.title=`V${VERSION} · ${lastOperation} · rev ${State.revision||0}`;
}
function scheduleConsumers(reason='state'){
  lastOperation=reason;updateChip();if(renderQueued)return;renderQueued=true;
  const run=()=>{renderQueued=false;
    try{window.VC_V123?.render?.()}catch(_){}
    try{window.v119RefreshPro?.()}catch(_){}
    try{window.v120RenderManagement?.()}catch(_){}
    try{window.VC_V121?.render?.()}catch(_){}
    try{if($('scout-workspace-v900')?.classList.contains('active'))window.v900Render?.()}catch(_){}
    try{if($('scout-match-mode')?.classList.contains('active'))window.v800Render?.()}catch(_){}
    try{if($('v850-lineup-control')?.classList.contains('open'))window.v850RenderLineupControl?.()}catch(_){}
    updateChip();
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0)
}
async function throughState(name,fn,args=[],opts={}){
  if(typeof fn!=='function')throw new Error(`La operación ${name} no está disponible.`);
  if(!opts.allowReadonly)ensureMutable();
  const seq=++operationSeq;lastOperation=name;updateChip();$('v131-state-chip')?.classList.add('busy');
  try{
    const out=await Promise.resolve(fn(...args));
    State.sync?.(`v13.1:${name}`);
    scheduleConsumers(name);
    return out;
  }catch(err){console.error(`V13.1 ${name}`,err);throw err}
  finally{if(seq===operationSeq)$('v131-state-chip')?.classList.remove('busy')}
}
const commands={
  prepareMatchSwitch:async()=>{
    const coordinator=getRallyCoordinator();
    return typeof coordinator?.beginMatchSelection==='function'?coordinator.beginMatchSelection():()=>{};
  },
  awardPoint:winner=>throughState('score:point',()=>delegateRallyCommand('point',winner)),
  undoRally:()=>throughState('score:undo',()=>delegateRallyCommand('undo')),
  saveLineup:()=>throughState('lineup:save',captured.lineup,[]),
  saveChange:()=>throughState('lineup:substitution',captured.change,[]),
  liberoAuto:()=>throughState('lineup:libero-auto',captured.liberoAuto,[]),
  liberoEnter:()=>throughState('lineup:libero-enter',captured.liberoEnter,[]),
  liberoExit:()=>throughState('lineup:libero-exit',captured.liberoExit,[]),
  saveEvent:()=>throughState('event:add',captured.event,[]),
  finishSet:()=>throughState('set:finish',captured.finishSet,[]),
  startNewSet:()=>throughState('set:new',captured.newSet,[]),
  saveFinalResult:finalize=>throughState(finalize?'match:finish':'match:result',captured.finalResult,[!!finalize]),
  quickEvent:type=>throughState('event:quick',captured.matchQuickEvent,[type]),
  matchCode:()=>throughState('action:match-code',captured.matchCode,[]),
  proCode:()=>throughState('action:pro-code',captured.proCode,[]),
  proVisual:()=>throughState('action:pro-visual',captured.proVisual,[])
};
State.commands=Object.assign(State.commands||{},commands);
State.version=VERSION;State.schema='vc.match-state/13.1';

/* User-facing mutations now enter through MatchState. The lower-level scout* functions remain engine adapters during migration. */
window.v121AwardPoint=commands.awardPoint;window.v121Point=commands.awardPoint;
window.v121UndoRally=commands.undoRally;
window.v119SaveLineup=commands.saveLineup;
window.v120SaveChange=commands.saveChange;
window.v120ToggleLiberoAuto=commands.liberoAuto;
window.v120LiberoEnter=commands.liberoEnter;
window.v120LiberoExit=commands.liberoExit;
window.v120SaveEvent=commands.saveEvent;
window.v120FinishSet=commands.finishSet;
window.v121StartNewSet=commands.startNewSet;
window.v120SaveFinalResult=commands.saveFinalResult;
window.v800QuickEvent=commands.quickEvent;
window.v800AddCode=commands.matchCode;
window.v900RegisterCode=commands.proCode;
window.v900RegisterVisual=commands.proVisual;

/* Match Mode selects exactly the same canonical match as Scouting Pro. */
window.v800SelectMatch=async function(id){
  id=Number(id)||0;if(!id)return false;
  try{await State.select(id,{saveCurrent:true,openWorkspace:false});scheduleConsumers('match:selected-from-mode');return true}
  catch(err){console.error('V13.1 mode select',err);alert(String(err?.message||'No se ha podido cambiar de scouting.'));return false}
};
window.v800ResumeSelected=async function(){const id=Number($('v800-match-select')?.value)||Number(State.list?.().find(m=>m.status!=='finished')?.id)||0;if(!id)return alert('No hay ningún scouting guardado.');return window.v800SelectMatch(id)};

/* Keep public professional API pointing to the state layer. */
if(window.VC_SCOUT_CORE){window.VC_SCOUT_CORE.version=VERSION;window.VC_SCOUT_CORE.professionalPoint=commands.awardPoint;window.VC_SCOUT_CORE.professionalUndo=commands.undoRally}
if(window.VC_V121){window.VC_V121.version=VERSION;window.VC_V121.point=commands.awardPoint;window.VC_V121.undo=commands.undoRally}
if(window.VC_V119){window.VC_V119.version=VERSION}
if(window.VC_V120){window.VC_V120.version=VERSION}

const unsubscribe=State.subscribe?.(d=>scheduleConsumers(d?.reason||'state:change'))||(()=>{});
const baseDiag=typeof State.diagnostics==='function'?State.diagnostics.bind(State):()=>({});
State.diagnostics=()=>({...baseDiag(),version:VERSION,schema:'vc.match-state/13.1',adapter:'v13.1',lastOperation,operations:operationSeq,
  rallyCoordinator:{status:rallyCoordinatorStatus,...(rallyCoordinator?{report:rallyCoordinator.report()}: {})},
  consumers:{scoutingPro:!!$('scout-workspace-v900')?.classList.contains('active'),matchMode:!!$('scout-match-mode')?.classList.contains('active')}});
window.VC_V131={version:VERSION,state:State,commands,diagnostics:()=>State.diagnostics(),dispose:unsubscribe};
function boot(){document.body.classList.add('v131-match-state-adapters');updateChip();State.sync?.('v13.1:boot');scheduleConsumers('boot')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
