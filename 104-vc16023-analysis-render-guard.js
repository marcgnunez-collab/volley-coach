/* Volley Coach V16.0.2.3 · Optimización de render de Análisis.
   NO modifica datos, estadísticas, operaciones de red ni el motor de vídeo.
   Para desactivar temporalmente: ?vc_analysis_legacy=1
   Mantiene un límite temporal de 5 s para recuperar el render completo aunque
   un cambio externo no estuviera representado en la firma del partido.
*/
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
const disabled=params.get('vc_analysis_legacy')==='1';
const original=window.scoutRenderAnalysis;
const diagnostics={version:'16.0.2.3',enabled:!disabled,requests:0,executed:0,skipped:0,invalidations:0,checksumMs:0,renderMs:0,lastReason:'inicio'};
let previous=null;
const renderView=()=>document.getElementById('scout-analysis');
const isVisible=()=>!!renderView()?.classList.contains('active');
const now=()=>performance.now();
const invalidate=(reason='evento')=>{previous=null;diagnostics.invalidations++;diagnostics.lastReason=reason;};
window.VC_ANALYSIS_RENDER_OPT=Object.freeze({
 version:'16.0.2.3',enabled:!disabled,
 invalidate:()=>invalidate('manual'),diagnostics:()=>({...diagnostics})
});
if(disabled||typeof original!=='function')return;
const selections=[
 'scout-analysis-match','scout-player-team-scope','scout-v830-dist-team',
 'scout-v830-attack-team','scout-v830-rec-team','scout-v840-block-team',
 'scout-v750-team','scout-v650-match','scout-v850-context-team'
];
function signature(){
 const view=renderView(),br=window.VC_SCOUT_REPORT_BRIDGE;
 const match=br?.getMatchForAnalysis?.();
 // Sin acceso al partido, se ejecuta siempre el render original.
 if(!view||!match||!br?.getMatches)return null;
 const matches=br.getMatches()||[];
 // Firma exacta: incluye acciones, sets, rallies, correcciones y metadatos.
 // No usa el timestamp solamente, pues una edición puede no actualizarlo.
 return JSON.stringify({
  tab:view.dataset.v115Tab||'summary',
  team:br.teamName?.()||'',
  activeId:br.getActiveId?.()||null,
  match,
  menu:matches.map(m=>[m.id,m.date,m.opponent,m.updatedAt,m.status]),
  filters:selections.map(id=>document.getElementById(id)?.value??null)
 });
}
const wrapped=function(...args){
 diagnostics.requests++;
 if(!isVisible()){
  previous=null;
  diagnostics.executed++;
  return original.apply(this,args);
 }
 let key=null,t=now();
 try{key=signature()}catch(_){key=null;}
 diagnostics.checksumMs+=now()-t;
 const age=previous?now()-previous.time:Infinity;
 const essentials=document.getElementById('scout-analysis-rotations');
 const ready=!!(essentials&&essentials.childElementCount);
 // Si no hay contenido, el usuario vuelve a la vista o la firma falla,
 // preferimos renderizar. Nunca se omite una actualización con datos distintos.
 if(key!==null&&previous&&previous.key===key&&age<5000&&ready){
  diagnostics.skipped++;
  diagnostics.lastReason='datos idénticos';
  return;
 }
 diagnostics.executed++;
 // Guardar la firma solo después de terminar correctamente.
 t=now();
 try{
  const result=original.apply(this,args);
  previous=key===null?null:{key,time:now()};
  return result;
 }catch(e){previous=null;throw e;}
 finally{diagnostics.renderMs+=now()-t;}
};
wrapped.__vc16023=true;
window.scoutRenderAnalysis=wrapped;
// Invalidar cuando una persona cambia filtros o pestañas, y cuando el estado
// del partido cambia. No se recalcula nada dentro de estos escuchadores.
for(const type of ['change','input']){
 document.addEventListener(type,e=>{
  if(e.target?.closest?.('#scout-analysis'))invalidate(type);
 },true);
}
for(const event of ['vc:matchstatechange','storage','pageshow']){
 window.addEventListener(event,()=>invalidate(event));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate('visible');});
// La navegación a otro módulo no guarda una firma reutilizable.
document.addEventListener('click',e=>{
 if(e.target?.closest?.('#scout-analysis button[data-tab]'))invalidate('tab');
},true);
})();
