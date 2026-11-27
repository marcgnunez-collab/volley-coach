/* Volley Coach V20.7.3 · Three consecutive diagnostics/preflight UI modules, original source order. */
/* VC2073_SOURCE_BEGIN:230-vc2050-release-health.js */
/* Volley Coach V20.5.0 · Deployment diagnostics.
 * Read-only: never inspects scouting, accounts, IndexedDB or cloud state.
 * Checks optional static assets only when the user explicitly requests it.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.VC_RELEASE_HEALTH_2050 = api;
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => api.mount(root), {once:true});
    } else api.mount(root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const VERSION = '20.5.0.3';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function assets(doc) {
    const found = new Map();
    for (const element of doc.querySelectorAll('link[rel="stylesheet"][href],script[src]')) {
      const uri = element.getAttribute(element.tagName.toLowerCase() === 'link' ? 'href' : 'src');
      if (!uri || !/^\.\//.test(uri)) continue;
      const file = uri.split(/[?#]/)[0];
      if (!found.has(file)) found.set(file, element.tagName.toLowerCase() === 'link' ? 'css' : 'js');
    }
    return [...found].map(([file,type]) => ({file,type}));
  }
  async function check(items, fetcher, base) {
    const results=[];
    // Small batches avoid flooding the deployment server and mobile radios.
    for(let i=0;i<items.length;i+=4) {
      const batch=items.slice(i,i+4);
      results.push(...await Promise.all(batch.map(async item => {
        try {
          const url=new URL(item.file,base);
          if(url.origin!==new URL(base).origin) return {...item,status:'error'};
          const response=await fetcher(url.href,{method:'GET',cache:'no-store',redirect:'follow'});
          // SPA fallback can return index.html as 200 for a missing asset.
          const mime=response.headers?.get?.('content-type') || '';
          const expected=item.type==='js' ? /javascript|ecmascript|text\/plain/i : /css|text\/plain/i;
          const invalidMime=/text\/html/i.test(mime) || (!!mime && !expected.test(mime));
          return {...item,status:response.ok&&!invalidMime?'ok':response.status===404?'missing':'error',http:response.status};
        } catch (_) {return {...item,status:'offline'};}
      })));
    }
    return results;
  }
  function summary(results) {
    return {total:results.length,ok:results.filter(r=>r.status==='ok').length,
      missing:results.filter(r=>r.status==='missing'),error:results.filter(r=>r.status==='error'),
      offline:results.filter(r=>r.status==='offline')};
  }
  function organize(doc,host,section) {
    if(doc.getElementById('vc20501-management-groups'))return true;
    const original=host.querySelector('.v11-management-grid');
    if(!original)return false;
    const buttons=[...original.children].filter(x=>x.tagName?.toLowerCase()==='button');
    if(buttons.length<10)return false; // Never reorganize an unexpected legacy screen.
    const container=doc.createElement('div');container.id='vc20501-management-groups';
    container.className='vc20501-groups';
    const config=[
      {name:'Organización deportiva',sub:'Equipo, partidos y planificación',indices:[0,1,2,3]},
      {name:'Nube y protección de datos',sub:'Sincronización, copias y recuperación',indices:[4,5,6]},
      {name:'Auditorías y mantenimiento',sub:'Herramientas para diagnosticar sin modificar datos',indices:[7,8,9]}
    ];
    for(const group of config){
      const block=doc.createElement('section');block.className='vc20501-group';
      const heading=doc.createElement('div');heading.className='vc20501-group-head';
      const title=doc.createElement('h3');title.textContent=group.name;
      const description=doc.createElement('p');description.textContent=group.sub;
      heading.append(title,description);block.append(heading);
      const grid=doc.createElement('div');grid.className='v11-management-grid';
      for(const index of group.indices)grid.appendChild(buttons[index]);
      if(group.name==='Auditorías y mantenimiento'){
        const card=doc.createElement('button');card.type='button';
        card.className='vc20501-health-card';
        card.innerHTML='<span>◇</span><div><b>Integridad de instalación</b><small>Comprobar archivos de Volley Coach · V20.5.0.1</small></div><strong>→</strong>';
        card.addEventListener('click',()=>{
          section.scrollIntoView?.({behavior:'smooth',block:'start'});
          section.querySelector('.vc2050-check')?.focus?.();
        });
        grid.appendChild(card);
      }
      block.appendChild(grid);container.appendChild(block);
    }
    // Move the original buttons (with their handlers) instead of cloning them.
    original.replaceWith(container);
    return true;
  }
  function mount(root) {
    const doc=root.document;
    const host=doc.getElementById('v11-management') || doc.getElementById('vc60-diagnostics')?.parentElement;
    if(!host)return false;
    let section=doc.getElementById('vc2050-release-health');
    if(!section){
      section=doc.createElement('section');
      section.id='vc2050-release-health';section.className='vc2050-health';
      section.innerHTML='<div class="vc20501-heading"><div><small>COMPROBACIÓN DEL SISTEMA · V20.5.0.3</small><h3>Integridad de instalación</h3><p>Comprueba que los archivos de interfaz están publicados. No lee ni modifica datos del club, vídeos ni la nube.</p></div><span class="vc20501-pill">Solo lectura</span></div><button type="button" class="vc2050-check">Comprobar archivos</button><div class="vc2050-result" role="status" aria-live="polite">Sin comprobar</div>';
      const heading=host.querySelector('.v11-page-head');
      if(heading)heading.insertAdjacentElement('afterend',section);
      else host.prepend(section);
    }
    if(section.dataset.vc2050Bound==='1')return true;
    section.dataset.vc2050Bound='1';
    organize(doc,host,section); // No-op if the HTML already supplies the layout.
    const button=section.querySelector('button'),out=section.querySelector('.vc2050-result');
    button.addEventListener('click',async()=>{
      button.disabled=true;out.textContent='Comprobando archivos locales publicados…';
      try {
        const result=summary(await check(assets(doc),root.fetch.bind(root),doc.baseURI));
        const problems=[...result.missing,...result.error,...result.offline];
        out.innerHTML=`<strong>${result.ok}/${result.total} disponibles</strong> · ${result.missing.length} ausentes · ${result.error.length} con error · ${result.offline.length} sin conexión. `+
          (problems.length?`<details><summary>Ver ${problems.length} incidencias</summary><ul>${problems.map(r=>`<li>${escape(r.file)} — ${escape(r.status)}</li>`).join('')}</ul></details>`:
           '<span>Sin incidencias entre los archivos comprobados.</span>')+
          '<p>La comprobación de archivos no sustituye las pruebas de scouting, vídeo o sincronización real.</p>';
      } catch(_){out.textContent='No se pudo completar la comprobación. Inténtalo de nuevo con conexión.';}
      finally{button.disabled=false;}
    });
    return true;
  }
  return {VERSION,assets,check,summary,mount,organize};
});
/* VC2073_SOURCE_END:230-vc2050-release-health.js */
;
/* VC2073_SOURCE_BEGIN:231-vc2051-scouting-expert.js */
/* Volley Coach V20.5.1 · Scouting Expert preflight; V20.5.34 TypeScript classification.
 * No writing, parsing replacement, scoreboard changes or cloud traffic.
 * The existing native code registrar remains the only action writer.
 */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  if(root.VC_SCOUT_EXPERT_2051)return;
  root.VC_SCOUT_EXPERT_2051=api;
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.mount,{once:true});
  else api.mount();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.5.1';
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const GRADES=new Set(['#','+','!','-','/','=']);
 const HEAD=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
 const IDS=['v800-code','v113-video-code'];
 const clean=x=>String(x??'').trim().toUpperCase().replace(/\s+/g,'');
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=x=>String(x??'').slice(0,180);
 const byId=id=>root?.document?.getElementById(id)||null;
 const classification={typed:0,classic:0,differences:0,errors:0,nativeCalls:0};
 let lastEngine='classic';
 function inspectLegacy(raw,match,nativeParser){
  const code=clean(raw);
  if(!code)return {state:'idle',message:'Escribe un código: 7A# · 3R+ · R12S=.',code};
  if(code.length>140)return {state:'error',message:'Código demasiado largo para previsualizar.',code};
  if(!match)return {state:'warning',message:'Abre un scouting activo.',code};
  if(match.status==='finished')return {state:'warning',message:'El scouting está finalizado. Reábrelo para editar.',code};
  const m=code.match(HEAD);
  if(!m)return {state:'error',message:'Empieza por el dorsal (7A#) o R+dorsal rival (R7A#).',code};
  if(!m[3])return {state:'draft',message:`Dorsal ${m[2]} reconocido · falta fundamento (S/R/E/A/B/D/F/C).`,code};
  const side=m[1]?'Rival':'Nuestro',skill=SKILLS[m[3]],rating=m[4];
  const summary=`${side} · #${m[2]} · ${skill}${rating?' · '+rating:''}`;
  if(typeof nativeParser!=='function')return {state:'warning',message:`${summary} · motor de validación no disponible.`,code};
  try{
   const parsed=nativeParser(code,match,null);
   if(!parsed||parsed.error||!parsed.action)
    return {state:'error',message:label(parsed?.error||'Código no reconocido por el motor de scouting.'),code,summary};
   const a=parsed.action;
   const extras=[];
   if(a.startZone)extras.push(`origen ${a.startZone}`);
   if(a.endZone)extras.push(`destino ${a.endZone}`);
   if(a.tempo)extras.push(`tempo ${a.tempo}`);
   const grade=GRADES.has(a.evaluation)?a.evaluation:(rating||'—');
   return {state:rating?'ok':'caution',code,summary:`${side} · #${m[2]} · ${skill} · ${grade}`,
    message:rating?'Código aceptado por el motor. Pulsa Enter o Añadir para registrarlo.':
     'El motor acepta el código, pero falta una valoración explícita. Comprueba el resultado antes de añadir.',
    extras,playerKnown:!!a.playerId||!!a.playerLabel||!!a.playerNumberSnapshot,
    // V20.5.6: the shadow module reuses this existing preview result. No second
    // native parser call, player name, object reference or match data is sent.
    nativeShape:Object.freeze({team:a.team,skill:a.skill,evaluation:a.evaluation,
     playerNumberSnapshot:a.playerNumberSnapshot??'',startZone:a.startZone||'',endZone:a.endZone||''})};
  }catch(_){return {state:'warning',message:'No se pudo comprobar el borrador. El registro original sigue disponible.',code,summary};}
 }
 function typedBridge(){
  const bridge=root?.VC_SCOUT_PREFLIGHT_20534;
  return bridge?.VERSION==='20.5.34'&&bridge?.previewOnly===true&&typeof bridge.classify==='function'?bridge:null;
 }
 function inspect(raw,match,nativeParser){
  const bridge=typedBridge();
  if(!bridge){lastEngine='classic';classification.classic++;return inspectLegacy(raw,match,nativeParser);}
  // Capture the one result already requested by the classic preview. TS never
  // invokes the native parser a second time, so live previews remain safe.
  let nativeResult,parserThrew=false;
  const captured=typeof nativeParser==='function'?(code,current,old)=>{
   classification.nativeCalls++;
   try{nativeResult=nativeParser(code,current,old);return nativeResult;}
   catch(error){parserThrew=true;throw error;}
  }:nativeParser;
  const fallback=inspectLegacy(raw,match,captured);
  try{
   const typed=bridge.classify(raw,!!match,match?.status,typeof nativeParser==='function',nativeResult,parserThrew);
   if(JSON.stringify(typed)===JSON.stringify(fallback)){
    lastEngine='typescript';classification.typed++;return typed;
   }
   classification.differences++;
  }catch(_){classification.errors++;}
  lastEngine='classic';classification.classic++;return fallback;
 }
 function mount(){
  const doc=root?.document,view=byId('scout-match-mode');
  if(!doc||!view)return false;
  for(const id of IDS){
   const input=byId(id);if(!input||byId('vc2051-'+id))continue;
   const host=doc.createElement('div');host.id='vc2051-'+id;host.className='vc2051-preflight';
   host.setAttribute('role','status');host.setAttribute('aria-live','polite');
   host.innerHTML='<span class="vc2051-indicator"></span><span class="vc2051-message">Previsualización antes de registrar</span><small class="vc2051-engine">Clásico</small>';
   const row=input.closest('.v800-code-row, .v113-video-code-row')||input.parentElement;
   row?.insertAdjacentElement('afterend',host);
  }
  if(!byId('vc2051-native-actions')){
   const original=byId('vc2021-dock');
   const bar=doc.createElement('div');bar.id='vc2051-native-actions';bar.className='vc2051-actions';
   bar.innerHTML='<span>SCOUTING EXPERT · V20.5.1</span><button type="button" data-vc2051-action="substitution">⇄ Sustitución</button><small>Alt+Mayús+S: abrir control de sustituciones · No registra acciones automáticamente</small>';
   const anchor=original||byId('vc2020-matchbar');
   anchor?.insertAdjacentElement('afterend',bar);
   bar.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-vc2051-action="substitution"]'))openSubstitution();
   });
  }
  if(mount.started)return true;
  mount.started=true;
  let pending=null;
  const published=new Map();
  const refresh=()=>{
   if(!view.classList.contains('active'))return;
   const match=(()=>{try{return root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||root.VC_SCOUT_REPORT_BRIDGE?.getActive?.()||null}catch(_){return null}})();
   const parser=typeof root.v680ParseCode==='function'?root.v680ParseCode:null;
   for(const id of IDS){
    const input=byId(id),status=byId('vc2051-'+id);
    if(!input||!status)continue;
    const result=inspect(input.value,match,parser);
    status.dataset.state=result.state;
    status.dataset.vc20534Engine=lastEngine;
    const engine=status.querySelector('.vc2051-engine');
    if(engine)engine.textContent=lastEngine==='typescript'?'TypeScript':'Clásico';
    status.querySelector('.vc2051-message').textContent=result.summary?`${result.summary} · ${result.message}`:result.message;
    // Publish a bounded preflight fact, not a scouting action. Only complete
    // head drafts are relevant; reset the dedupe key when an input is emptied.
    if(!result.code){published.delete(id);continue;}
    if(!/^(?:R)?\d+[SREABDFC]/.test(result.code)||result.code.length>140)continue;
    const signature=JSON.stringify([match?.id??null,result.code,result.state,result.nativeShape||null]);
    if(signature===published.get(id))continue;
    published.set(id,signature);
    try{
     if(typeof root.CustomEvent==='function')doc.dispatchEvent(new root.CustomEvent('vc:scout-code-preflight',{
      detail:{source:id,code:result.code,state:result.state,nativeShape:result.nativeShape||null}
     }));
    }catch(_){/* Diagnostic events must never affect the original registrar. */}
   }
  };
  const schedule=()=>{if(pending)root.clearTimeout(pending);pending=root.setTimeout(()=>{pending=null;refresh()},140);};
  doc.addEventListener('input',event=>{if(IDS.includes(event.target?.id))schedule()},true);
  doc.addEventListener('focusin',event=>{if(IDS.includes(event.target?.id))schedule()},true);
  doc.addEventListener('vc:matchstatechange',schedule);
  doc.addEventListener('keydown',event=>{
   if(!view.classList.contains('active')||event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey)return;
   if(event.altKey&&event.shiftKey&&event.code==='KeyS'){
    if(event.target?.closest?.('input:not(#v800-code):not(#v113-video-code),textarea,select,[contenteditable="true"],[role="dialog"]'))return;
    if(openSubstitution()){event.preventDefault();event.stopPropagation();}
   }
  },true);
  if(root.MutationObserver)new root.MutationObserver(schedule).observe(view,{attributes:true,attributeFilter:['class']});
  refresh();return true;
 }
 function openSubstitution(){
  if(!byId('scout-match-mode')?.classList.contains('active'))return false;
  const match=(()=>{try{return root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||root.VC_SCOUT_REPORT_BRIDGE?.getActive?.()||null}catch(_){return null}})();
  if(!match||match.status==='finished')return false;
  if(typeof root.v120OpenChanges==='function'){root.v120OpenChanges();return true;}
  if(typeof root.scoutOpenSubstitution==='function'){root.scoutOpenSubstitution();return true;}
  return false;
 }
 function diagnostics(){return {version:VERSION,lastEngine,classification:{...classification}};}
 return {VERSION,inspect,mount,openSubstitution,diagnostics};
});
/* VC2073_SOURCE_END:231-vc2051-scouting-expert.js */
;
/* VC2073_SOURCE_BEGIN:232-vc2052-architecture-foundation.js */
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
/* VC2073_SOURCE_END:232-vc2052-architecture-foundation.js */
;
