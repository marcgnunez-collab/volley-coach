/* Volley Coach V20.5.2 · Architecture & Performance Foundation.
 * Read-only. No access to match data, player names, authentication, cloud or local storage.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  root.VC_ARCH_FOUNDATION_2052=api;
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.mount(root),{once:true});
  else api.mount(root);
 }
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.5.2';
 const finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0?x:null;
 const round=x=>x==null?null:Math.round(x*10)/10;
 const count=(items,test)=>items.filter(test).length;
 function summarize({navigation=[],resources=[],longTasks=[],scripts=[],styles=[]}={}){
  const nav=Array.isArray(navigation)?navigation[0]:null;
  const entries=Array.isArray(resources)?resources:[];
  const internal=entries.filter(e=>e?.local===true);
  const tasks=Array.isArray(longTasks)?longTasks:[];
  const seconds=tasks.map(x=>finite(x?.duration)).filter(x=>x!=null);
  return {
   version:VERSION,
   navigation:{responseMs:round(finite(nav?.responseEnd)),domReadyMs:round(finite(nav?.domContentLoadedEventEnd)),loadMs:round(finite(nav?.loadEventEnd))},
   localResources:{count:internal.length,scripts:count(internal,e=>e.type==='js'),styles:count(internal,e=>e.type==='css'),transferKiB:round(internal.reduce((sum,e)=>sum+(finite(e.bytes)||0),0)/1024)},
   markup:{scriptElements:Array.isArray(scripts)?scripts.length:0,styleElements:Array.isArray(styles)?styles.length:0},
   longTasks:{observed:seconds.length,maxMs:seconds.length?round(Math.max(...seconds)):null,totalMs:round(seconds.reduce((a,b)=>a+b,0))},
   notes:['Medición de este navegador y esta carga; no compara sesiones distintas.','Long Tasks puede no estar disponible en todos los navegadores.','No mide latencia del registro ni confirma sincronización con otro dispositivo.']
  };
 }
 function collect(win,tasks){
  const perf=win.performance||null;
  const get=type=>{try{return Array.from(perf?.getEntriesByType?.(type)||[])}catch(_){return []}};
  const origin=win.location?.origin||'';
  const resources=get('resource').map(x=>{
   let local=false,type='other';
   try{const url=new win.URL(x.name);local=url.origin===origin;type=/\.js(?:\?|$)/i.test(url.pathname)?'js':/\.css(?:\?|$)/i.test(url.pathname)?'css':'other';}catch(_){}
   return {local,type,bytes:x.transferSize||x.encodedBodySize||0};
  });
  return summarize({navigation:get('navigation'),resources,longTasks:tasks,
   scripts:Array.from(win.document?.scripts||[]),styles:Array.from(win.document?.querySelectorAll?.('style')||[])});
 }
 function render(report){
  const fmt=x=>x==null?'No disponible':String(x);
  const metrics=[['DOM preparado',fmt(report.navigation.domReadyMs)+' ms'],['Carga completa',fmt(report.navigation.loadMs)+' ms'],
   ['Recursos locales',report.localResources.count],['Transferencia local',fmt(report.localResources.transferKiB)+' KiB'],
   ['Bloques > 50 ms',report.longTasks.observed],['Bloqueo máximo',fmt(report.longTasks.maxMs)+' ms']];
  return `<div class="vc2052-metrics">${metrics.map(([name,value])=>`<div><small>${name}</small><strong>${value}</strong></div>`).join('')}</div>
   <p>Scripts DOM: ${report.markup.scriptElements} · Bloques de estilo embebidos: ${report.markup.styleElements}. No se recopilan rutas privadas, datos deportivos ni identificadores de cuenta.</p>
   <p class="vc2052-foot">${report.notes.join(' ')}</p>`;
 }
 function mount(win){
  const doc=win.document,host=doc.getElementById('v11-management');
  if(!host)return false;
  let panel=doc.getElementById('vc2052-foundation');
  if(!panel){
   panel=doc.createElement('section');panel.id='vc2052-foundation';panel.className='vc2052-foundation';
   panel.innerHTML='<div class="vc2052-title"><div><small>ARCHITECTURE & PERFORMANCE · V20.5.2</small><h3>Diagnóstico técnico del navegador</h3><p>Medición local y de solo lectura. Para comparar, repite después de recargar la aplicación.</p></div><span>Solo lectura</span></div><div class="vc2052-actions"><button type="button" data-vc2052="measure">Medir ahora</button><button type="button" data-vc2052="export">Descargar medición JSON</button></div><div id="vc2052-report" role="status" aria-live="polite">Pulsa Medir ahora para obtener la línea base.</div>';
   const anchor=doc.getElementById('vc2050-release-health');
   if(anchor&&anchor.parentNode===host)anchor.insertAdjacentElement('afterend',panel);
   else host.querySelector('.v11-page-head')?.insertAdjacentElement('afterend',panel);
  }
  if(panel.dataset.vc2052Bound==='1')return true;
  panel.dataset.vc2052Bound='1';
  let tasks=[],last=null;
  if(typeof win.PerformanceObserver==='function'){
   try{const observer=new win.PerformanceObserver(list=>{
    const values=list.getEntries().map(x=>({duration:x.duration}));tasks=tasks.concat(values).slice(-120);
   });observer.observe({type:'longtask',buffered:true});}
   catch(_){}
  }
  const measure=()=>{last=collect(win,tasks);doc.getElementById('vc2052-report').innerHTML=render(last);return last;};
  panel.addEventListener('click',event=>{
   const action=event.target?.closest?.('[data-vc2052]')?.dataset.vc2052;
   if(action==='measure')measure();
   if(action==='export'){
    const payload=JSON.stringify(last||measure(),null,2),file=new win.Blob([payload],{type:'application/json'});
    const url=win.URL.createObjectURL(file),a=doc.createElement('a');a.href=url;a.download='volley-coach-v2052-performance.json';
    doc.body.appendChild(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
   }
  });
  return true;
 }
 return {VERSION,summarize,collect,render,mount};
});
