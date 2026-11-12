/* Volley Coach V16.0.5.2 · Scouting Pro Unificado.
 * Presentation/router only. Reuse the unique existing MatchState, Scouting Core,
 * V8 match engine, V9 visual builder, V11 video and V13 recovery/sync.
 * No match data, saved schema, camera stream or persisted rally is modified here.
 */
(()=>{
'use strict';
if(window.VC_16052_UNIFIED)return;
const $=id=>document.getElementById(id);
const MODES=new Set(['visual','directo','video','revisar','analizar']);
const MATCH='scout-match-mode',OLD='scout-workspace-v900';
let mode='visual',switching=false,mounts=0,navigations=0;
let viewObserver=null,peerObserver=null;
function visible(){return !!$(MATCH)?.classList.contains('active')}
function updateTitle(){
 const label=$('v11-page-title');if(label&&visible())label.textContent='Scouting Pro · Partido';
 const crumb=$('v11-breadcrumb');if(crumb&&visible())crumb.textContent='SCOUTING UNIFICADO';
 document.querySelectorAll('#v11-sidebar [data-v11-nav="match"],#v11-sidebar [data-v11-nav="scouting"]').forEach(el=>{
  el.classList.toggle('active',el.dataset.v11Nav==='scouting'&&visible());
 });
}
function syncActive(){
 const root=$(OLD),should=visible()&&mode!=='directo'&&mode!=='video';
 if(root&&root.classList.contains('active')!==should)root.classList.toggle('active',should);
 updateTitle();
}
function syncTabs(){
 const shell=$('v800-shell');if(!shell)return;
 shell.dataset.vc52Mode=mode;
 document.querySelectorAll('#vc52-modes [data-vc52-mode]').forEach(b=>{
  const on=b.dataset.vc52Mode===mode;
  b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));
 });
 const message=$('vc52-mode-description');if(message)message.textContent={
  visual:'Selecciona jugador, acción, zona y valoración. Un único registro de datos.',
  directo:'Marcador, rotaciones, rallies y código rápido sin vídeo.',
  video:'Vídeo grande y codificación simultánea con el mismo motor de acciones.',
  revisar:'Revisa rallies y acciones registradas sin salir del partido.',
  analizar:'Resumen estadístico del partido; el informe completo sigue disponible en Análisis Pro.'
 }[mode]||'';
 syncActive();
}
function setMode(next,{skipVideo=false,keepPosition=false}={}){
 if(!MODES.has(next))next='visual';
 const shell=$('v800-shell');if(!shell)return false;
 const prev=mode;mode=next;
 switching=true;
 try{
  if(!skipVideo){
   if(next==='video'&&!shell.classList.contains('v112-video-open'))window.__vc52OriginalVideo?.(true);
   if(next!=='video'&&shell.classList.contains('v112-video-open'))window.__vc52OriginalVideo?.(false);
  }
  const phase=next==='revisar'?'review':next==='analizar'?'analyze':'scout';
  // V9 works on the SAME current match and Scouting Core as V8; no action duplication.
  if(next==='visual'||next==='revisar'||next==='analizar'){
   try{window.v900SetPhase?.(phase)}catch(e){console.warn('Scouting unificado: fase',e)}
   if(next==='visual')try{window.v111ScoutNav?.('coding')}catch(_){ }
   try{window.v900Render?.()}catch(e){console.warn('Scouting unificado: render',e)}
  }
  if(next==='video'){
   try{window.v910SetMatchView?.('video')}catch(_){}
  }else if(next==='directo' || next==='visual'){
   try{window.v910SetMatchView?.('directo')}catch(_){}
  }
 }finally{switching=false}
 syncTabs();
 if(!keepPosition&&prev!==next&&visible()){
  const anchor=$('vc52-modes');if(anchor){try{anchor.scrollIntoView({block:'start',behavior:'instant'})}catch(_){}}
 }
 return true;
}
function mount(){
 const root=$(OLD),slot=$('vc52-pro-host'),match=$('scout-match-mode');
 if(!root||!slot||!match)return false;
 if(root.parentElement!==slot){
  root.classList.remove('view','active');
  root.classList.add('vc52-integrated');
  slot.appendChild(root);mounts++;
 }
 if(!viewObserver){
  viewObserver=new MutationObserver(()=>{syncActive();syncTabs()});
  viewObserver.observe(match,{attributes:true,attributeFilter:['class']});
 }
 placeDevices();
 const commands=$('v900-live')?.querySelector('.v119-probar');
 if(commands&&!$('vc52-match-tools')){
  const details=document.createElement('details');details.id='vc52-match-tools';
  const summary=document.createElement('summary');summary.textContent='Herramientas adicionales: cambios, líbero, sets y eventos';
  details.append(summary);commands.parentNode.insertBefore(details,commands);details.appendChild(commands);
 }
 syncTabs();return true;
}
function placeDevices(){
 const host=$('vc52-devices-body'),strip=$('v138-device-strip');
 if(host&&strip&&strip.parentElement!==host){host.appendChild(strip)}
 const parent=$('v138-peer-main'),pill=$('vc52-peer-count');
 if(parent&&pill){
  const refresh=()=>{const v=String(parent.textContent||'—').trim();if(pill.textContent!==v)pill.textContent=v};
  refresh();
  if(!peerObserver){peerObserver=new MutationObserver(refresh);peerObserver.observe(parent,{childList:true,characterData:true,subtree:true})}
 }
}
function initDevices(){
 const root=$(OLD);if(!root)return;
 // Watch only the existing small UI shell for the asynchronously injected presence strip.
 const shell=root.querySelector('.v900-shell');
 if(shell){const obs=new MutationObserver(()=>placeDevices());obs.observe(shell,{childList:true});}
 placeDevices();
}
const originalToggle=window.v112ToggleVideo;
window.__vc52OriginalVideo=originalToggle;
if(typeof originalToggle==='function'){
 window.v112ToggleVideo=function(force){
  const out=originalToggle.apply(this,arguments);
  if(!switching){const isVideo=!!$('v800-shell')?.classList.contains('v112-video-open');if(isVideo)mode='video';else if(mode==='video')mode='directo';syncTabs()}
  return out;
 };
}
const originalTab=window.v112MatchTab;
if(typeof originalTab==='function'){
 window.v112MatchTab=function(name){
  if(name==='video')return setMode('video');
  if(name==='live')return setMode('directo');
  const result=originalTab.apply(this,arguments);
  if(!switching){mode='directo';syncTabs()}
  return result;
 };
}
const previousShow=window.showView;
if(typeof previousShow==='function'){
 window.showView=function(id,btn){
  const old= id===OLD||id==='scouting';
  const canonical=old?MATCH:id;
  const out=previousShow.call(this,canonical,old?(window.botonVista?.(MATCH)||btn):btn);
  if(old)setMode('visual',{keepPosition:true});
  syncActive();
  return out;
 };
}
const previousNavigate=window.v11Navigate;
if(typeof previousNavigate==='function'){
 window.v11Navigate=function(target){
  if(target==='scouting'||target==='match'){
   navigations++;
   const out=previousNavigate.call(this,'match');
   setMode(target==='scouting'?'video':'directo',{keepPosition:true});
   syncActive();return out;
  }
  return previousNavigate.apply(this,arguments);
 };
}
window.vc52SetMode=function(next){
 if(!visible())window.showView?.(MATCH,window.botonVista?.(MATCH));
 return setMode(next);
};
window.vc52OpenScouting=function(){window.showView?.(MATCH,window.botonVista?.(MATCH));return setMode('video',{keepPosition:true})};
window.VC_16052_UNIFIED={
 version:'16.0.5.2',open:window.vc52OpenScouting,mode:window.vc52SetMode,currentMode:()=>mode,
 diagnostics:()=>({mounted:$(OLD)?.parentElement?.id==='vc52-pro-host',currentMode:mode,viewActive:visible(),
  v8Video:!!$('v800-shell')?.classList.contains('v112-video-open'),matchId:window.MatchState?.getActive?.()?.id||null,
  presenceKept:!!$('v138-device-strip'),mounts,navigations,sharedCore:!!window.VC_SCOUT_CORE})
};
function boot(){mount();initDevices();
 // If a previous version left the independent V9 view open, open the merged cockpit.
 const any=document.querySelector('.view.active');
 if(any?.id===OLD)window.vc52OpenScouting();
 syncTabs();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
