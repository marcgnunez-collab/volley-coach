/* Volley Coach V18.9.0 · Analysis Pro Workspace.
 * Read-only navigation adapter for the existing Analyst Studio. Its filters,
 * calculations, scouting selection, inspector, videos and PDF exporters remain
 * owned exclusively by their original modules. No persistence or cloud writes.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.9.0';
 const MODES=[
  {id:'match',title:'Partido',subtitle:'Resumen, marcador y rendimiento',links:[['overview','','Resumen del partido'],['players','builder','Hojas configurables'],['players','sheet','Hoja oficial G-P'],['explorer','','Vídeo y acciones']]},
  {id:'fundamentals',title:'Fundamentos',subtitle:'Saque, recepción, ataque y defensa',links:[['lab','serve','Saque y recepción'],['lab','attack','Análisis de ataque'],['lab','block','Bloqueo y defensa'],['players','fundamentals','Fundamentos Pro'],['lab','quality','Calidad del scouting']]},
  {id:'tactics',title:'Táctica',subtitle:'Rotaciones, cruces, colocador y secuencias',links:[['lab','workbench','Mesa táctica'],['lab','rotations','Rotaciones K1/K2'],['lab','matchups','Cruces de rotaciones'],['lab','zones','Mapa de ataque'],['lab','distribution','Distribución del colocador'],['lab','details','Colocador Pro · sistemas ofensivos'],['lab','sequences','Secuencias de juego']]},
  {id:'players',title:'Jugadores',subtitle:'Rendimiento y comparación individual',links:[['athletes','profile','Ficha individual'],['athletes','compare','Comparador A/B']]},
  {id:'history',title:'Histórico',subtitle:'Evolución entre partidos y rivales',links:[['comparisons','matches','Partidos A/B'],['comparisons','players','Evolución de jugadores'],['comparisons','rivals','Scouting de rivales']]},
  {id:'reports',title:'Informes',subtitle:'Exportación y presentación',links:[['reports','','Informes Pro']]}
 ];
 const PAGE_MODE={overview:'match',players:'match',athletes:'players',lab:'tactics',explorer:'match',comparisons:'history',reports:'reports',season:'history'};
 const ALLOWED=new Set(['overview','players','athletes','lab','explorer','comparisons','reports']);
 const LINK_KEYS=new Set(MODES.flatMap(mode=>mode.links.map(link=>link[0]+':'+(link[1]||''))));
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
 function modeForPage(page,sub){
  if(page==='lab'&&['serve','attack','block','quality'].includes(sub))return 'fundamentals';
  if(page==='players'&&sub==='fundamentals')return 'fundamentals';
  if(page==='athletes')return 'players';
  if(page==='explorer')return 'match';
  return PAGE_MODE[page]||'match';
 }
 function currentTab(doc){const tab=doc.querySelector('#vc157-tabs [data-section][aria-selected="true"]');return tab?.dataset.section||'overview';}
 function currentSub(doc){return doc.querySelector('#vc1620-subtabs [data-subpage][aria-pressed="true"]')?.dataset.subpage||'';}
 function selectedFilterSummary(doc){
  const one=id=>{const input=doc.getElementById(id);if(!input)return null;const option=input.options?.[input.selectedIndex];return {value:input.value||'',label:clean(option?.textContent||input.value||'')};};
  const match=one('vc157-match'),team=one('vc157-team'),set=one('vc157-set'),rotation=one('vc157-rotation'),phase=one('vc157-phase');
  const parts=[];
  if(team)parts.push(team.label);
  if(set?.value)parts.push(set.label);
  if(rotation?.value)parts.push(rotation.label);
  if(phase?.value)parts.push(phase.label);
  if(!set?.value&&!rotation?.value&&!phase?.value)parts.push('Todos los sets y rotaciones');
  return {match:match?.value?match.label:'Sin scouting seleccionado',matchId:match?.value||'',filters:parts.join(' · '),team:team?.value||'',set:set?.value||'',rotation:rotation?.value||'',phase:phase?.value||''};
 }
 const CSS=`
 /* V19.1.1: conserve global breadcrumb and all Analysis links. */
 body.vc1730-shell .vc1730-workspace{background:#fff;border:1px solid #d8e5ef;border-radius:17px;overflow:hidden;box-shadow:0 7px 23px #0a28450d;margin:2px 0 18px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#19394e;max-width:100%}
 body.vc1730-shell .vc1730-head{background:linear-gradient(110deg,#0d2849,#164477);padding:19px 22px;display:flex;justify-content:space-between;gap:15px;align-items:center;color:#fff}
 body.vc1730-shell .vc1730-head small{display:block;font:800 10px/1.4 system-ui;letter-spacing:.09em;color:#abd8fa;margin-bottom:5px}
 body.vc1730-shell .vc1730-head h2{margin:0!important;color:#fff!important;font:850 22px/1.2 system-ui!important}
 body.vc1730-shell .vc1730-head p{font:400 11px/1.5 system-ui;color:#d4e5f5;margin:7px 0 0;max-width:620px}
 body.vc1730-shell .vc1730-head-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:center;justify-content:flex-end}
 body.vc1730-shell .vc1730-head-actions button{font:750 11px/1.3 system-ui!important;min-height:38px!important;border-radius:9px!important;padding:8px 12px!important;background:#ffffff16!important;border:1px solid #ffffff57!important;color:#fff!important;white-space:normal}
 body.vc1730-shell .vc1730-head-actions button:disabled{opacity:.45!important}
 body.vc1730-shell .vc1730-context{padding:12px 19px;background:#f5f9fd;border-bottom:1px solid #e0ebf3;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 body.vc1730-shell .vc1730-match{min-width:0;display:grid;gap:3px}
 body.vc1730-shell .vc1730-match small{font-size:9px;color:#728ba1;font-weight:800;letter-spacing:.05em}
 body.vc1730-shell .vc1730-match strong{font-size:12px;color:#18486e;overflow-wrap:anywhere}
 body.vc1730-shell .vc1730-filter-summary{font-size:10px;color:#426a87;background:#fff;border:1px solid #dce9f4;border-radius:8px;padding:9px 11px;max-width:100%;line-height:1.4}
 body.vc1730-shell .vc1730-modes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;padding:10px 13px;background:#fff;border-bottom:1px solid #e7edf3}
 body.vc1730-shell .vc1730-mode{display:flex!important;gap:9px;align-items:center;text-align:left!important;min-height:64px!important;padding:10px 11px!important;background:#fff!important;border:1px solid #dce7f0!important;border-radius:11px!important;color:#2d5674!important;box-shadow:none!important;font-family:system-ui,sans-serif!important;white-space:normal}
 body.vc1730-shell .vc1730-mode-number{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;flex:none;background:#ebf3fb;color:#236ba7;font:850 12px system-ui}
 body.vc1730-shell .vc1730-mode b{display:block;font-size:12px;color:inherit;line-height:1.3}
 body.vc1730-shell .vc1730-mode small{display:block;font-size:9.5px;color:#718ba0;line-height:1.35;margin-top:3px}
 body.vc1730-shell .vc1730-mode[aria-current="step"]{background:#e8f2ff!important;color:#144a82!important;border-color:#85b6e6!important;box-shadow:inset 0 0 0 1px #bedaf4!important}
 body.vc1730-shell .vc1730-mode[aria-current="step"] .vc1730-mode-number{background:#1a67b8;color:#fff}
 body.vc1730-shell .vc1730-links{display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:52px;padding:9px 17px;border-bottom:1px solid #eaf0f5}
 body.vc1730-shell .vc1730-links>span{font:850 10px system-ui;color:#778fa2;margin-right:5px}
 body.vc1730-shell .vc1730-links button,body.vc1730-shell .vc1730-legacy button{background:#fff!important;box-shadow:none!important;font:750 11px/1.3 system-ui!important;color:#3a6789!important;padding:8px 11px!important;min-height:35px!important;border:1px solid #e2ebf3!important;border-radius:8px!important}
 body.vc1730-shell .vc1730-links button[aria-current="page"]{background:#174c80!important;color:#fff!important;border-color:#174c80!important}
 body.vc1730-shell .vc1730-bottom{border-top:1px solid #e7edf3;padding:8px 17px;background:#f9fbfd;display:flex;align-items:center;gap:7px;justify-content:space-between;flex-wrap:wrap}
 body.vc1730-shell .vc1730-bottom>span{font-size:10px;color:#6a849a;line-height:1.5}
 body.vc1730-shell .vc1730-legacy{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
 body.vc1730-shell .vc1730-legacy button{font-size:10px!important;min-height:31px!important;padding:6px 8px!important}
 body.vc1730-shell .vc1730-mode:focus-visible,body.vc1730-shell .vc1730-links button:focus-visible,body.vc1730-shell .vc1730-head-actions button:focus-visible{outline:3px solid #65a8ef!important;outline-offset:2px!important}
 /* One navigation and one header; keep the original filter controls, evidence inspector and exports. */
 body.vc1730-shell #scout-analysis[data-vc157-mode="studio"] #vc157-tabs{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;pointer-events:none!important;margin:0!important;padding:0!important}
 body.vc1730-shell #scout-analysis[data-vc157-mode="studio"] #vc157-studio .vc157-top{display:none!important}
 body.vc1730-shell #scout-analysis[data-vc157-mode="studio"] #vc1620-subtabs{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;pointer-events:none!important;margin:0!important;padding:0!important}
 body.vc1730-shell #scout-analysis[data-vc157-mode="studio"] #vc157-studio .vc157-toolbar{margin-top:0!important}
 body.vc1730-shell #scout-analysis[data-vc157-mode="studio"] .vc157-stagehead{margin-top:5px}
 @media(max-width:1050px){body.vc1730-shell .vc1730-head{padding:16px}body.vc1730-shell .vc1730-modes{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}}
 @media(max-width:610px){body.vc1730-shell .vc1730-head{flex-direction:column;align-items:stretch;padding:14px}body.vc1730-shell .vc1730-head h2{font-size:20px!important}body.vc1730-shell .vc1730-head-actions{justify-content:flex-start}body.vc1730-shell .vc1730-context{padding:10px 12px}body.vc1730-shell .vc1730-modes{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:6px}body.vc1730-shell .vc1730-mode{flex-direction:column;justify-content:center;gap:5px;text-align:center!important;min-height:85px!important;padding:7px 3px!important}body.vc1730-shell .vc1730-mode b{font-size:11px}body.vc1730-shell .vc1730-mode small{font-size:9px}body.vc1730-shell .vc1730-links{padding:9px;gap:4px}body.vc1730-shell .vc1730-links button{padding:7px 8px!important;font-size:10px!important}body.vc1730-shell .vc1730-bottom{padding:9px 11px}}
 `;
 function markup(){return `<div class="vc1730-head"><div><small>ANALYSIS PRO WORKSPACE · V${VERSION}</small><h2>Centro de análisis</h2><p>Análisis verificable del partido: fundamentos, táctica, jugadores, histórico y evidencias en un único estudio.</p></div><div class="vc1730-head-actions"><button type="button" data-vc1730-action="video" disabled>▶ Ver jugadas seleccionadas</button><button type="button" data-vc1730-action="official">PDF oficial</button><button type="button" data-vc1730-action="pro">PDF análisis</button></div></div>
<div class="vc1730-context" aria-label="Contexto del análisis"><div class="vc1730-match"><small>SCOUTING DEL ANÁLISIS</small><strong data-vc1730-match>Sin scouting seleccionado</strong></div><div class="vc1730-filter-summary" data-vc1730-filters>Filtros compartidos en el análisis del partido</div></div>
<nav class="vc1730-modes" aria-label="Áreas de análisis">${MODES.map((m,i)=>`<button type="button" class="vc1730-mode" data-vc1730-mode="${m.id}"><span class="vc1730-mode-number">0${i+1}</span><span><b>${m.title}</b><small>${m.subtitle}</small></span></button>`).join('')}</nav>
<div class="vc1730-links" data-vc1730-links aria-label="Herramientas del área"></div>
<div class="vc1730-bottom"><span data-vc1730-info>Los filtros de partido se comparten en Partido, Fundamentos y Táctica. Histórico e Informes tienen su selección propia.</span><div class="vc1730-legacy"><button type="button" data-vc1730-view="scout-season">Temporada clásica</button><button type="button" data-vc1730-view="scout-matchup">Ficha del rival</button><button type="button" data-vc1730-view="v11-reports">Informes clásicos</button></div></div>`;}
 function mount(root){
  const doc=root.document;if(!doc||doc.getElementById('vc1730-workspace'))return;
  const start=()=>{
   const view=doc.getElementById('scout-analysis');if(!view||doc.getElementById('vc1730-workspace'))return;
   const css=doc.createElement('style');css.id='vc1730-analysis-css';css.textContent=CSS;doc.head.appendChild(css);
   const shell=doc.createElement('section');shell.id='vc1730-workspace';shell.className='vc1730-workspace';shell.setAttribute('aria-label','Analysis Workspace');shell.innerHTML=markup();
   view.insertBefore(shell,view.firstChild);doc.body.classList.add('vc1730-shell');
   let preferredMode='match',pending=null,studioObserver=null,tabObserver=null;
   const $=id=>doc.getElementById(id);
   const active=()=>view.classList.contains('active');
   const studio=()=>root.VC_ANALYST_STUDIO_16155;
   function sync(){
    const loaded=!!$('vc157-tabs');
    doc.body.classList.toggle('vc1730-active',active());
    if(!active())return;
    if(loaded){
     const page=currentTab(doc),sub=currentSub(doc);
     if(!pending)preferredMode=modeForPage(page,sub);
    }
    const mode=MODES.find(m=>m.id===preferredMode)||MODES[0];
    shell.querySelectorAll('[data-vc1730-mode]').forEach(b=>b.setAttribute('aria-current',b.dataset.vc1730Mode===mode.id?'step':'false'));
    const links=shell.querySelector('[data-vc1730-links]');
    if(links.dataset.mode!==mode.id){
     links.dataset.mode=mode.id;
     links.innerHTML=`<span>${esc(mode.title)}</span>${mode.links.map(([page,sub,label])=>`<button type="button" data-vc1730-page="${page}" data-vc1730-sub="${sub}" aria-current="false">${esc(label)}</button>`).join('')}`;
    }
    const page=currentTab(doc),sub=currentSub(doc);
    links.querySelectorAll('[data-vc1730-page]').forEach(b=>{
     const matches=loaded&&page===b.dataset.vc1730Page&&(!b.dataset.vc1730Sub||sub===b.dataset.vc1730Sub);
     b.setAttribute('aria-current',matches?'page':'false');
    });
    const filters=selectedFilterSummary(doc);
    const matchLabel=shell.querySelector('[data-vc1730-match]');if(matchLabel.textContent!==filters.match)matchLabel.textContent=filters.match;
    const filterNode=shell.querySelector('[data-vc1730-filters]');
    const text=mode.id==='history'||mode.id==='reports'?'Comparativas e informes: muestra histórica con selectores propios.':filters.filters;
    if(filterNode.textContent!==text)filterNode.textContent=text;
    const selected=studio()?.videoSelection?.();
    const videos=(selected?.selected||[]).filter(a=>a.video).length;
    const videoBtn=shell.querySelector('[data-vc1730-action="video"]');videoBtn.disabled=!videos;
    videoBtn.textContent=videos?`▶ Ver ${videos} jugadas en vídeo`:'▶ Ver jugadas seleccionadas';
    const info=shell.querySelector('[data-vc1730-info]');const note=mode.id==='history'||mode.id==='reports'?'Las comparativas y los informes usan sus propios periodos y conjuntos de datos. No heredan automáticamente el filtro del set.':'La selección de scouting, equipo, set, rotación y K1/K2 se comparte entre Partido, Fundamentos y Táctica.';
    if(info.textContent!==note)info.textContent=note;
   }
   function selectPage(page,sub=''){
    if(!ALLOWED.has(page)||!LINK_KEYS.has(page+':'+sub))return false;
    if(!active()){
     if(typeof root.showView!=='function')return false;
     try{root.showView('scout-analysis',root.botonVista?.('scout-analysis')||null);}catch(_){return false;}
    }
    const tabs=$('vc157-tabs');
    const tab=tabs?.querySelector(`[data-section="${page}"]`);
    if(!tab){pending={page,sub};sync();return true;}
    pending=null;tab.click();
    if(sub){const subtab=$('vc1620-subtabs')?.querySelector(`[data-subpage="${sub}"]`);if(subtab)subtab.click();}
    sync();return true;
   }
   function selectMode(id){const mode=MODES.find(m=>m.id===id);if(!mode)return false;preferredMode=id;const [p,s]=mode.links[0];return selectPage(p,s);}
   function navigateLegacy(id){if(!['scout-season','scout-matchup','v11-reports'].includes(id)||!$(id)||typeof root.showView!=='function')return false;
    root.showView(id,root.botonVista?.(id)||null);return true;
   }
   shell.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!shell.contains(b))return;
    if(b.dataset.vc1730Mode){selectMode(b.dataset.vc1730Mode);return;}
    if(b.dataset.vc1730Page){const page=b.dataset.vc1730Page,sub=b.dataset.vc1730Sub||'';preferredMode=modeForPage(page,sub);selectPage(page,sub);return;}
    if(b.dataset.vc1730View){navigateLegacy(b.dataset.vc1730View);return;}
    if(b.dataset.vc1730Action){
     const target=({official:'vc157-official',pro:'vc157-propdf',video:'vc157-video'})[b.dataset.vc1730Action];const existing=$(target);
     if(existing&&!existing.disabled)existing.click();
    }
   });
   const refresh=()=>{const q=root.VC175_UI_SCHEDULER;q?q.schedule("vc17-analysis",sync):sync()};
   const viewObserver=new root.MutationObserver(refresh);viewObserver.observe(view,{attributes:true,attributeFilter:['class','data-vc157-mode']});
   // The Analyst Studio is lazy loaded. Observe only until its original tabs exist.
   const attach=()=>{
    if(!$('vc157-tabs'))return false;
    if(studioObserver){studioObserver.disconnect();studioObserver=null;}
    if(!tabObserver){
     tabObserver=new root.MutationObserver(refresh);
     $('vc157-tabs').querySelectorAll('[data-section]').forEach(b=>tabObserver.observe(b,{attributes:true,attributeFilter:['aria-selected']}));
     const subs=$('vc1620-subtabs');if(subs)tabObserver.observe(subs,{childList:true,subtree:false});
     const sample=$('vc157-sample');if(sample)tabObserver.observe(sample,{childList:true,characterData:true,subtree:true});
    }
    if(pending){const {page,sub}=pending;pending=null;selectPage(page,sub);}
    sync();return true;
   };
   if(!attach()){
    studioObserver=new root.MutationObserver(attach);
    studioObserver.observe(view,{childList:true,subtree:true});
   }
   doc.addEventListener('change',e=>{if(['vc157-match','vc157-team','vc157-set','vc157-rotation','vc157-phase'].includes(e.target?.id))sync()},true);
   root.addEventListener('focus',sync);
   doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)sync()});
   doc.addEventListener('click',e=>{if(active()&&e.target?.closest?.('#vc157-content'))root.queueMicrotask?root.queueMicrotask(sync):Promise.resolve().then(sync)},true);
   sync();
   root.VC173_ANALYSIS_WORKSPACE={version:VERSION,modes:MODES.map(m=>m.id),readonly:true,selectPage,selectMode,refresh:sync,context:()=>selectedFilterSummary(doc),active:()=>active()};
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 return {VERSION,MODES,ALLOWED,LINK_KEYS,modeForPage,currentTab,currentSub,selectedFilterSummary,markup,mount};
});
