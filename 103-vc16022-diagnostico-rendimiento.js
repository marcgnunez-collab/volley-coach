/* Volley Coach V16.0.2.2 — diagnóstico OPT-IN.
   Solo se activa con ?vc_perf=1. No escribe partidos, no envía datos
   a servidores, no modifica el motor de nube ni los cálculos.
*/
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(params.get('vc_perf')!=='1')return;
if(window.VC_DIAGNOSTICO_RENDIMIENTO)return;
const P=window.performance;
const now=()=>P.now();
const MAX_INTERACTIONS=70,MAX_LONGTASKS=120;
const tabName=()=>{
 const s=String(document.getElementById('scout-analysis')?.dataset.v115Tab||'summary');
 return ['summary','players','phases','attack','receive','context','opponent','all'].includes(s)?s:'unknown';
};
const isAnalysis=()=>!!document.getElementById('scout-analysis')?.classList.contains('active');
const monitored={
 'Análisis.render':['window','scoutRenderAnalysis'],
 'Análisis.individual':['window','scoutRenderPlayerAnalytics'],
 'Análisis.rendimiento':['window','scoutRenderPerformanceAnalytics'],
 'Análisis.tendencias':['window','scoutV640RenderTendencies'],
 'Análisis.rival':['window','scoutV650Render'],
 'Análisis.rival avanzado':['window','scoutV660Render'],
 'Análisis.pestaña':['window','v115SetAnalysisTab'],
 'Análisis.contexto':['window','scoutV750RenderProfessionalAnalysis'],
 'Análisis.K1/K2':['window','scoutV840RenderPhaseAdvanced'],
 'Análisis.ataques':['window','scoutV830RenderAttackDirections'],
 'Análisis.recepción':['window','scoutV830RenderReception'],
 'Análisis.bloqueo':['window','scoutV840RenderBlocking'],
 'Análisis.distribución':['window','scoutV830RenderSetterDistribution'],
 'Estadística.acciones':['bridge','actionRows'],
 'Estadística.completa':['bridge','fullStats'],
 'Estadística.rallies':['bridge','rallies'],
 'Estadística.K1/K2':['bridge','pointMetrics'],
 'Estadística.ataque':['bridge','attack'],
 'Estadística.recepción':['bridge','reception'],
 'Estadística.rendimiento':['bridge','performance'],
 'Estadística.distribución':['bridge','distributionRows']
};
const s={running:false,started:0,stopped:0,functions:new Map(),longtasks:[],interactions:[],tabTime:new Map(),domMutations:0,domEvents:0,errors:0,memory:[],rafBlocked:0};
const wraps=[],listeners=[],observers=[];
const el=(tag,css,text)=>{const e=document.createElement(tag);if(css)e.className=css;if(text!=null)e.textContent=text;return e};
const root=el('aside','vc-perf-root');root.setAttribute('aria-label','Diagnóstico de rendimiento');
const style=el('style');style.textContent=`
.vc-perf-root{all:initial!important;font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif!important;position:fixed!important;right:12px!important;bottom:12px!important;z-index:2147483640!important;width:min(410px,calc(100vw - 24px))!important;color:#1a3044!important}
.vc-perf-root *{box-sizing:border-box!important;font-family:inherit!important}
.vc-perf-root button{cursor:pointer!important;font-size:12px!important;width:auto!important;min-width:0!important;padding:8px 10px!important;border-radius:7px!important;border:1px solid #aac5d8!important;background:#f5fafc!important;color:#134166!important;box-shadow:none!important}
.vc-perf-root .vc-perf-toggle{background:#16476e!important;color:white!important;border-color:#16476e!important;font-weight:700!important;padding:10px 13px!important;box-shadow:0 3px 12px #0002!important}
.vc-perf-root .vc-perf-panel{background:white!important;border:1px solid #9ebbd2!important;border-radius:12px!important;box-shadow:0 8px 30px #0004!important;padding:14px!important;max-height:65vh!important;overflow:auto!important;margin-bottom:8px!important}
.vc-perf-root .vc-perf-panel[hidden]{display:none!important}
.vc-perf-root .vc-perf-actions{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin:10px 0!important}
.vc-perf-root .vc-perf-title{font-weight:750!important;font-size:15px!important;color:#173c58!important;margin:0 0 7px!important}
.vc-perf-root .vc-perf-small{font-size:11px!important;color:#526b81!important;margin:6px 0!important}
.vc-perf-root .vc-perf-stats{font-size:12px!important;background:#eff5f9!important;padding:8px!important;border-radius:8px!important;white-space:pre-wrap!important}
.vc-perf-root .vc-perf-table{font-variant-numeric:tabular-nums!important;width:100%!important;border-collapse:collapse!important;font-size:11px!important}
.vc-perf-root .vc-perf-table td,.vc-perf-root .vc-perf-table th{padding:5px 3px!important;border-bottom:1px solid #edf2f6!important;text-align:left!important}
.vc-perf-root .vc-perf-table td:last-child,.vc-perf-root .vc-perf-table th:last-child{text-align:right!important}
.vc-perf-root .vc-perf-foot{text-align:right!important;margin-top:6px!important}
@media(max-width:600px){.vc-perf-root{right:5px!important;bottom:5px!important;width:min(340px,calc(100vw - 10px))!important}.vc-perf-root .vc-perf-panel{max-height:60vh!important}}
`;
const title=el('div','vc-perf-title','Diagnóstico V16.0.2.2');
const desc=el('p','vc-perf-small','Medición local y voluntaria. No modifica estadísticas ni sincronización. No incluye nombres de jugadoras ni datos del partido.');
const status=el('div','vc-perf-stats','Sin medición.');
const actions=el('div','vc-perf-actions');
const table=el('table','vc-perf-table');
const foot=el('div','vc-perf-small','Abre Análisis y cambia de pestañas durante la medición.');
const panel=el('div','vc-perf-panel');panel.hidden=true;
const toggle=el('button','vc-perf-toggle','Rendimiento · abrir');toggle.type='button';toggle.setAttribute('aria-expanded','false');
const mkBtn=(name,fn)=>{const b=el('button','',name);b.type='button';b.addEventListener('click',fn);actions.appendChild(b);return b};
root.append(panel,toggle);panel.append(title,desc,status,actions,table,foot);document.head.appendChild(style);(document.body||document.documentElement).appendChild(root);
toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.textContent=panel.hidden?'Rendimiento · abrir':'Rendimiento · cerrar';if(!panel.hidden)refresh()});
function stat(name){if(!s.functions.has(name))s.functions.set(name,{calls:0,totalMs:0,selfMs:0,maxMs:0,slowCalls:0});return s.functions.get(name)}
const callstack=[];
function wrap(obj,key,name){
 if(!obj||typeof obj[key]!=='function')return;
 const original=obj[key];
 if(original.__vc_perf_probe)return;
 const instrumented=function(...args){
  if(!s.running||!isAnalysis())return original.apply(this,args);
  const frame={begin:now(),childMs:0};callstack.push(frame);
  try{return original.apply(this,args)}finally{
   const duration=now()-frame.begin;callstack.pop();
   if(callstack.length)callstack[callstack.length-1].childMs+=duration;
   const x=stat(name);x.calls++;x.totalMs+=duration;
   x.selfMs+=Math.max(0,duration-frame.childMs);x.maxMs=Math.max(x.maxMs,duration);
   if(duration>=50)x.slowCalls++;
  }
 };
 // Preserve metadata used by the application's compatibility checks.
 try{for(const prop of Object.getOwnPropertyNames(original)){
  if(['name','length','arguments','caller','prototype'].includes(prop))continue;
  const d=Object.getOwnPropertyDescriptor(original,prop);
  if(d)Object.defineProperty(instrumented,prop,d);
 }}catch(_){ }
 Object.defineProperty(instrumented,'__vc_perf_probe',{value:true,configurable:true});
 try{obj[key]=instrumented;if(obj[key]===instrumented)wraps.push({obj,key,original,instrumented})}catch(_){}
}
function installWrappers(){
 for(const [name,[where,key]] of Object.entries(monitored)){
  wrap(where==='bridge'?window.VC_SCOUT_REPORT_BRIDGE:window,key,name);
 }
 // Public module render functions (not the private closure render functions).
 for(const [key,label] of [['VC_V135_ANALYSIS','Análisis.panel profesional'],['VC_V151_SEASON','Temporada.panel']]){
  wrap(window[key],'render',label);
 }
}
function uninstallWrappers(){for(const w of wraps.splice(0).reverse()){
 try{if(w.obj[w.key]===w.instrumented)w.obj[w.key]=w.original}catch(_){}
}}
function sampleMemory(){if(!s.running)return;
 const mem=P.memory;
 if(mem&&Number.isFinite(mem.usedJSHeapSize))s.memory.push({t:Math.round(now()-s.started),usedMB:Math.round(mem.usedJSHeapSize/1048576),limitMB:Math.round(mem.jsHeapSizeLimit/1048576)});
 if(s.memory.length>24)s.memory.shift();
}
function observe(){
 if('PerformanceObserver' in window){
  try{const o=new PerformanceObserver(list=>{
   if(!s.running||!isAnalysis())return;
   for(const e of list.getEntries()){
    s.longtasks.push({ms:+e.duration.toFixed(1),t:Math.round(e.startTime-s.started),tab:tabName()});
    if(s.longtasks.length>MAX_LONGTASKS)s.longtasks.shift();
   }
  });o.observe({type:'longtask',buffered:false});observers.push(o)}catch(_){}
 }
 const view=document.getElementById('scout-analysis');
 if(view&&window.MutationObserver){
  const o=new MutationObserver(recs=>{
   if(!s.running||!isAnalysis())return;
   s.domEvents+=recs.length;
   for(const r of recs)s.domMutations+=(r.addedNodes?.length||0)+(r.removedNodes?.length||0);
  });o.observe(view,{subtree:true,childList:true});observers.push(o);
 }
 const onClick=ev=>{if(!s.running)return;
  const t=ev.target instanceof Element?ev.target:null;if(!t)return;
  let kind=null;
  if(t.closest('#v115-analysis-nav [data-tab]'))kind='pestaña';
  else if(t.closest('#scout-analysis')&&!t.closest('.vc-perf-root'))kind='clic';
  else if(t.closest('[onclick*="scout-analysis"], [data-view="scout-analysis"]'))kind='abrir-análisis';
  if(kind)trackInteraction(kind);
 };
 const onChange=ev=>{if(s.running&&ev.target instanceof Element&&ev.target.closest('#scout-analysis'))trackInteraction('filtro')};
 document.addEventListener('click',onClick,true);document.addEventListener('change',onChange,true);
 listeners.push(['click',onClick],['change',onChange]);
}
function trackInteraction(kind){
 const t=now(),startingTab=tabName();
 // Two frames approximate the browser's first visible response, not every async update.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!s.running)return;
  s.interactions.push({kind,from:startingTab,to:tabName(),ms:Math.round(now()-t)});
  if(s.interactions.length>MAX_INTERACTIONS)s.interactions.shift();
 }));
}
function cleanup(){uninstallWrappers();for(const o of observers.splice(0))try{o.disconnect()}catch(_){};
 for(const [key,listener]of listeners.splice(0))document.removeEventListener(key,listener,true);
}
function resetData(){s.functions.clear();s.longtasks.length=0;s.interactions.length=0;s.tabTime.clear();s.domMutations=0;s.domEvents=0;s.errors=0;s.memory.length=0}
function start(){if(s.running)return;resetData();s.started=now();s.stopped=0;s.running=true;installWrappers();observe();sampleMemory();refresh()}
function stop(){if(!s.running)return;s.stopped=now();s.running=false;sampleMemory();cleanup();refresh()}
function reset(){if(s.running)stop();resetData();s.started=0;s.stopped=0;refresh()}
function report(){
 const fun=[...s.functions].map(([name,v])=>({name,calls:v.calls,totalMs:+v.totalMs.toFixed(1),selfMs:+v.selfMs.toFixed(1),maxMs:+v.maxMs.toFixed(1),slowCalls:v.slowCalls})).sort((a,b)=>b.selfMs-a.selfMs);
 const times=s.interactions.map(x=>x.ms).sort((a,b)=>a-b),p95=times.length?times[Math.max(0,Math.ceil(.95*times.length)-1)]:null;
 const elapsed=s.started?Math.round((s.running?now():s.stopped)-s.started):0;
 return {appVersion:'16.0.2.2-diag',measurement:'mediciones de funciones síncronas (incl. y exclusivo), tareas largas y respuesta de interfaz aproximada (2 frames)',
  active:s.running,durationMs:elapsed,tab:tabName(),functions:fun,slowTasks:{count:s.longtasks.length,maxMs:Math.max(0,...s.longtasks.map(x=>x.ms)),examples:s.longtasks.slice(-40)},
  interaction:{count:times.length,p95Ms:p95,examples:s.interactions.slice(-40)},dom:{records:s.domEvents,nodesChanged:s.domMutations},memory:s.memory.slice(),
  browser:{deviceMemoryGB:navigator.deviceMemory??null,hardwareConcurrency:navigator.hardwareConcurrency??null},privacy:'No incluye jugadoras, rivales, nombres de equipos, partidas, cuentas ni contenidos del scouting.'};
}
function showRows(){const data=report();status.textContent=[`Estado: ${s.running?'Midiendo':'Detenido'}`,`Tiempo: ${(data.durationMs/1000).toFixed(1)} s · Operaciones: ${data.functions.reduce((n,f)=>n+f.calls,0)}`,`Bloqueos ≥50 ms: ${data.slowTasks.count} · Máximo: ${Math.round(data.slowTasks.maxMs)} ms`,`Respuesta p95 (2 fotogramas): ${data.interaction.p95Ms??'—'} ms · Interacciones: ${data.interaction.count}`,`Cambios DOM: ${data.dom.nodesChanged}`].join('\n');
 table.replaceChildren();const head=el('tr');for(const t of ['Operación','Llamadas','Total ms','Propios ms'])head.appendChild(el('th','',t));table.appendChild(head);
 for(const f of data.functions.slice(0,9)){
  const tr=el('tr');for(const value of [f.name,f.calls,Math.round(f.totalMs),Math.round(f.selfMs)])tr.appendChild(el('td','',String(value)));table.appendChild(tr)
 }
 foot.textContent=data.functions.length?'Ordenado por tiempo propio. El total de funciones anidadas no debe sumarse.':'Pulsa «Iniciar», abre Análisis, cambia de pestañas y vuelve a «Detener».';
}
function refresh(){if(!panel.hidden)showRows()}
function download(){const r=report(),blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='volley-rendimiento-v16.0.2.2.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function copy(){const r=report(),f=r.functions.slice(0,7),msg=[`Volley Coach V16.0.2.2 | Diagnóstico ${Math.round(r.durationMs/1000)} s`,`Bloqueos: ${r.slowTasks.count} (máx ${r.slowTasks.maxMs} ms)`,`Respuesta p95: ${r.interaction.p95Ms??'no medida'} ms`,...f.map(x=>`${x.name}: ${x.calls} llamadas, ${x.selfMs} ms propios, máx ${x.maxMs} ms`) ].join('\n');
 try{await navigator.clipboard.writeText(msg);foot.textContent='Resumen copiado. Puedes pegarlo aquí en el chat.'}catch(_){foot.textContent='No se ha podido copiar; utiliza Descargar JSON.'}
}
const startBtn=mkBtn('Iniciar',start);mkBtn('Detener',stop);mkBtn('Reiniciar',reset);mkBtn('Copiar resumen',copy);mkBtn('Descargar JSON',download);
window.VC_DIAGNOSTICO_RENDIMIENTO=Object.freeze({start,stop,report,reset,isRunning:()=>s.running});
addEventListener('pagehide',()=>{if(s.running)stop()},{once:true});
})();
