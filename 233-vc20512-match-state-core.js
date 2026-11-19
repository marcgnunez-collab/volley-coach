(()=>{
'use strict';
const VERSION='13.0.0';
const $=id=>document.getElementById(id);
const clone=x=>{try{return JSON.parse(JSON.stringify(x))}catch(_){return x}};
const bus=new EventTarget();
let revision=0,lastReason='boot',lastSignature='';

function list(){try{return Array.isArray(scoutingMatches)?scoutingMatches.filter(Boolean):window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()||[]}catch(_){return[]}}
function byId(id){id=Number(id)||0;return list().find(m=>Number(m?.id)===id)||null}
function active(){try{return typeof scoutActive==='function'?scoutActive():window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
function setOf(m=active()){try{return typeof scoutSet==='function'?scoutSet(m):window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)||null}catch(_){return null}}
function setsScore(m=active()){try{return typeof scoutSetsScore==='function'?scoutSetsScore(m):{us:0,opponent:0}}catch(_){return{us:0,opponent:0}}}
function actionCount(m=active()){try{return typeof scoutActionCount==='function'?scoutActionCount(m):0}catch(_){return 0}}
function isReadonly(m=active()){return !!m&&String(m.status||'')==='finished'}
function signature(m=active()){
  if(!m)return 'none';const s=setOf(m),ss=setsScore(m);
  return [m.id,m.status,m.currentSet,s?.scoreUs,s?.scoreOpponent,m.rotationNo,m.opponentRotationNo,m.servingTeam,ss.us,ss.opponent,actionCount(m),m.updatedAt].join('|');
}
function snapshot(m=active()){
  if(!m)return null;const s=setOf(m),ss=setsScore(m);
  return {
    schema:'vc.match-state/13.0',revision,matchId:Number(m.id)||0,readonly:isReadonly(m),status:String(m.status||''),
    info:{date:m.date||'',opponent:m.opponent||'',competition:m.competition||'',linkedMatchId:m.linkedMatchId??null},
    currentSet:Number(m.currentSet)||1,score:{us:Number(s?.scoreUs)||0,opponent:Number(s?.scoreOpponent)||0,setsUs:Number(ss.us)||0,setsOpponent:Number(ss.opponent)||0},
    rotations:{us:Number(m.rotationNo)||1,opponent:Number(m.opponentRotationNo)||1},service:m.servingTeam==='opponent'?'opponent':'ours',
    phase:m.servingTeam==='opponent'?'K1':'K2',lineup:clone(m.lineup||{}),baseLineup:clone(m.baseLineup||{}),libero:clone(m.libero||{}),
    liveRally:clone(m.liveRally||{}),sets:clone(m.sets||[]),events:clone(m.events||[]),workflow:clone(m.workflow||{}),
    actions:actionCount(m),updatedAt:m.updatedAt||null
  };
}
function emit(reason='change',detail={}){
  revision++;lastReason=reason;lastSignature=signature();
  try{bus.dispatchEvent(new CustomEvent('change',{detail:{reason,revision,snapshot:snapshot(),...detail}}))}catch(_){}
  try{document.dispatchEvent(new CustomEvent('vc:matchstatechange',{detail:{reason,revision,matchId:Number(active()?.id)||null}}))}catch(_){}
  refreshReadonly();
}
function sync(reason='legacy-sync'){
  const sig=signature();if(sig!==lastSignature){emit(reason);return true}refreshReadonly();return false;
}
async function persistSelection(){
  try{
    if(typeof equiposData!=='undefined'&&typeof equipoActivo!=='undefined'){
      if(!equiposData[equipoActivo]&&typeof estadoEquipoVacio==='function')equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
      const team=equiposData[equipoActivo];if(team){team.scoutingActiveId=Number(active()?.id)||null;if(typeof scoutClone==='function')team.scoutingMatches=scoutClone(list())}
    }
    if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
    else await window.scoutV902Flush?.();
  }catch(err){console.warn('V13.0 persist selection',err)}
}
async function select(id,{saveCurrent=true,openWorkspace=true}={}){
  id=Number(id)||0;const target=byId(id);if(!target)throw new Error('No se encuentra el scouting seleccionado.');
  const current=active();if(Number(current?.id)===id){refreshReadonly();return target}
  if(saveCurrent&&current){try{await window.scoutV902Flush?.()}catch(_){try{window.scoutSave?.(false)}catch(__){}}}
  if(current&&String(current.status||'')!=='finished'){try{window.VC_SCOUT_VIDEO_BRIDGE?.pauseClock?.(current)}catch(_){}}
  let selected=null;
  if(String(target.status||'')==='finished'){
    /* A finished match is selectable for review, but is never silently reopened. */
    try{scoutingActiveId=target.id;selected=target}catch(_){selected=target}
    await persistSelection();
  }else{
    selected=window.VC_SCOUT_VIDEO_BRIDGE?.activateMatch?.(id)||null;
    if(!selected){try{scoutingActiveId=target.id;selected=target;window.VC_SCOUT_VIDEO_BRIDGE?.resumeClock?.(target);await persistSelection()}catch(_){}}
  }
  if(!selected)throw new Error('No se ha podido activar el scouting seleccionado.');
  emit('match:selected',{previousId:Number(current?.id)||null,matchId:id});
  if(openWorkspace){try{window.showView?.('scout-workspace-v900',window.botonVista?.('scout-workspace-v900')||null)}catch(_){} }
  refreshProfessionalUi();
  return selected;
}
function mutate(mutator,reason='mutation',{save=true}={}){
  const m=active();if(!m)throw new Error('No hay scouting activo.');if(isReadonly(m))throw new Error('Este scouting está finalizado y se ha abierto en modo solo lectura.');
  const result=mutator(m,setOf(m));m.updatedAt=typeof scoutNow==='function'?scoutNow():new Date().toISOString();
  if(save)try{window.scoutSave?.(false)}catch(_){}
  emit(reason);return result;
}
function subscribe(fn){if(typeof fn!=='function')return()=>{};const h=e=>fn(e.detail);bus.addEventListener('change',h);return()=>bus.removeEventListener('change',h)}
function ensureReadonlyBanner(){
  if($('v130-readonly-banner'))return;const bar=$('v123-scout-switchbar')||$('v900-live');if(!bar)return;
  const node=document.createElement('div');node.id='v130-readonly-banner';node.className='v130-readonly-banner';node.innerHTML='<div><b>Partido finalizado · modo solo lectura</b><span>Puedes revisar el scouting y cambiar de partido sin reabrir ni modificar este resultado.</span></div><div class="actions"><button type="button" class="ghost" onclick="v11Navigate(\'analysis\')">Abrir análisis</button><button type="button" class="ghost" onclick="v122OpenMatchSwitcher()">Cambiar scouting</button></div>';
  if(bar.id==='v123-scout-switchbar')bar.insertAdjacentElement('afterend',node);else bar.prepend(node);
}
function refreshReadonly(){
  ensureReadonlyBanner();const ro=isReadonly();document.body.classList.toggle('v130-readonly-match',ro);
  const selectors=['#v121-live-control .v121-score-actions>button','#v121-live-control .v121-score-actions .tools button'];
  document.querySelectorAll(selectors.join(',')).forEach(b=>{b.disabled=ro;b.setAttribute('aria-disabled',ro?'true':'false');if(ro)b.title='Partido finalizado · solo lectura';else if(b.title==='Partido finalizado · solo lectura')b.removeAttribute('title')});
}
function refreshProfessionalUi(){
  try{window.VC_V123?.render?.()}catch(_){}try{window.v119RefreshPro?.()}catch(_){}try{window.v120RenderManagement?.()}catch(_){}try{window.VC_V121?.render?.()}catch(_){}try{window.v900Open?.()}catch(_){}refreshReadonly();
}
async function switchFromUi(id){
  id=Number(id)||0;if(!id)return false;const controls=[$('v123-match-select'),$('v119-match-picker')].filter(Boolean);controls.forEach(x=>x.disabled=true);
  try{await select(id,{saveCurrent:true,openWorkspace:true});refreshProfessionalUi();return true}
  catch(err){console.error('V13.0 switch scouting',err);alert(String(err?.message||'No se ha podido cambiar de scouting.'));refreshProfessionalUi();return false}
  finally{controls.forEach(x=>x.disabled=false)}
}

const MatchState={
  version:VERSION,schema:'vc.match-state/13.0',list,getById:byId,getActive:active,getSet:setOf,getSnapshot:snapshot,isReadonly,
  select,mutate,subscribe,sync,get revision(){return revision},get lastReason(){return lastReason},
  diagnostics:()=>({version:VERSION,schema:'vc.match-state/13.0',revision,lastReason,activeId:Number(active()?.id)||null,readonly:isReadonly(),matches:list().length,signature:signature()})
};
window.MatchState=MatchState;window.VC_MATCH_STATE=MatchState;
window.v130SwitchMatch=switchFromUi;
/* Every visible switcher now uses the same state transition. */
window.v119SwitchMatch=switchFromUi;window.v122SwitchMatch=async id=>{const ok=await switchFromUi(id);if(ok)try{window.v122CloseMatchSwitcher?.()}catch(_){}return ok};window.v123SwitchMatch=switchFromUi;
window.scoutOpenSaved=id=>switchFromUi(id);

/* Compatibility bridge: old modules keep reading the canonical legacy object, while V13 exposes it as one state. */
window.VC_MATCH_STATE_ADAPTER={
  legacyMatches:()=>list(),legacyActiveId:()=>Number(active()?.id)||null,legacyActive:()=>active(),
  currentSet:()=>setOf(),snapshot:()=>snapshot(),select:id=>select(id)
};

function boot(){
  document.body.classList.add('v130-match-state');lastSignature=signature();ensureReadonlyBanner();refreshReadonly();
  /* v900 is already the central professional render point; use it to detect legacy mutations without changing their logic. */
  try{const base=window.v900Render;if(typeof base==='function'&&!base.__v130){const wrapped=function(...args){const out=base.apply(this,args);queueMicrotask(()=>sync('workspace-render'));return out};wrapped.__v130=true;window.v900Render=wrapped}}catch(_){}
  try{const teamBase=window.cambiarEquipo;if(typeof teamBase==='function'&&!teamBase.__v130){const wrapped=function(...args){const out=teamBase.apply(this,args);queueMicrotask(()=>emit('team:changed'));return out};wrapped.__v130=true;window.cambiarEquipo=wrapped}}catch(_){}
  refreshProfessionalUi();emit('boot');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
