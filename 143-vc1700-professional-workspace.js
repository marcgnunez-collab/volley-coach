/* Volley Coach V17.0.1 · Professional Workspace visual fix.
 * Navigation and presentation adapter ONLY. Does not read/write local data, Supabase,
 * scouting, media or training engines. Keeps all original view IDs and APIs intact.
 */
(function(root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const GROUPS=[
 {id:'home',label:'Inicio',icon:'⌂',defaultView:'dashboard',items:[]},
 {id:'training',label:'Entrenamientos',icon:'◇',defaultView:'entrenamiento',items:[['entrenamiento','Sesión actual'],['planificacion','Planificación'],['ejercicios','Biblioteca'],['historial','Historial'],['estadisticas','Seguimiento']]},
 {id:'matches',label:'Partidos',icon:'◈',defaultView:'scout-dashboard',items:[['scout-dashboard','Centro de partidos'],['competicion','Calendario'],['scout-plan','Preparación'],['scout-match-mode','En directo'],['scout-workspace-v900','Codificación'],['vc155-bench','Banquillo']]},
 {id:'analysis',label:'Análisis',icon:'▥',defaultView:'scout-analysis',items:[['scout-analysis','Estadísticas y táctica'],['v11-reports','Informes'],['scout-season','Temporada'],['scout-matchup','Rivales']]},
 {id:'video',label:'Vídeo',icon:'▷',defaultView:'scout-video-hub',items:[['scout-video-hub','Video Studio']]},
 {id:'team',label:'Equipo',icon:'◎',defaultView:'jugadores',items:[['jugadores','Plantilla'],['scout-season','Temporada'],['scout-safe','Copias y recuperación']]},
 {id:'management',label:'Gestión',icon:'⚙',defaultView:'v11-management',items:[['v11-management','Configuración'],['scout-safe','Recuperación']]}
];
const GROUP_BY_ID=Object.fromEntries(GROUPS.map(x=>[x.id,x]));
// Explicit resolution for routes shared by more than one workspace.
const VIEW_GROUP={dashboard:'home',entrenamiento:'training',planificacion:'training',ejercicios:'training',historial:'training',estadisticas:'training',
 'scout-dashboard':'matches',competicion:'matches','scout-plan':'matches','scout-match-mode':'matches','scout-workspace-v900':'matches','vc155-bench':'matches',
 'scout-analysis':'analysis','v11-reports':'analysis','scout-season':'analysis','scout-matchup':'analysis','scout-video-hub':'video',jugadores:'team',
 'v11-management':'management','scout-safe':'management'};
const ALIASES={home:'dashboard',training:'entrenamiento',planning:'planificacion',players:'jugadores','scout-home':'scout-dashboard',
 scouting:'scout-workspace-v900',match:'scout-match-mode',bench:'vc155-bench',analysis:'scout-analysis',reports:'v11-reports',video:'scout-video-hub',management:'v11-management'};
const cleanString=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
function resolveRoute(raw){
 const target=String(raw||'home');
 const g=GROUP_BY_ID[target];if(g)return {view:g.defaultView,group:g.id};
 const view=ALIASES[target]||target;
 return {view,group:VIEW_GROUP[view]||'home'};
}
function navTitle(id){for(const g of GROUPS){if(g.defaultView===id)return g.label;const found=g.items.find(x=>x[0]===id);if(found)return found[1]}return 'Área de trabajo'}
function cloudSummary(raw){
 const text=cleanString(raw)||'Nube sin comprobar';
 // Presence is independent of successful synchronization.
 const lower=text.toLowerCase();
 return {text,kind:/error|fall|desconect|pendiente|conflicto|sin conexi[oó]n/.test(lower)?'warn':/sincroniz|conectad|actualizad|guardad|online/.test(lower)?'ok':'idle'};
}
function statusFromDOM(doc){
 const $=id=>doc.getElementById(id);
 const countRaw=cleanString($('vc52-peer-count')?.textContent);
 const peers=/^\d+$/.test(countRaw)?Number(countRaw):null;
 return {team:cleanString($('team-active-name')?.textContent||$('v11-team-name')?.textContent)||'Equipo activo',
  cloud:cloudSummary($('cloud-label')?.textContent||$('v11-cloud-label')?.textContent),
  peers,exerciseCount:cleanString($('dash-library')?.textContent)||'—',weekCount:cleanString($('dash-week-count')?.textContent)||'—',
  historyCount:cleanString($('dash-history-count')?.textContent)||'—',sessionCount:cleanString($('dash-current-count')?.textContent)||'—',
  plannedMinutes:cleanString($('dash-current-time')?.textContent)||'—'};
}
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function navIcon(id){
 const paths={
 home:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/>',
 training:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
 matches:'<circle cx="12" cy="12" r="9"/><path d="M12 3 6 8l2 7 7 2 6-5M6 8 3 11M15 17l-1 4"/>',
 analysis:'<path d="M4 20V12M10 20V8M16 20V4M22 20V10"/><path d="M2 21h22"/>',
 video:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4z"/>',
 team:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6M21 20v-2a5 5 0 0 0-4-4.8"/>',
 management:'<circle cx="12" cy="12" r="3"/><path d="M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'
 };
 return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[id]||paths.home)+'</svg>';
}
function makeSidebar(doc){
 const aside=doc.getElementById('v11-sidebar');if(!aside)return false;
 const footer=aside.querySelector('.v11-sidebar-footer');
 const wrapper=doc.createElement('div');wrapper.className='vc17-sidebar-frame';
 wrapper.innerHTML=`<div class="vc17-brand"><div class="vc17-brand-mark" aria-hidden="true"><b>V</b><i>C</i></div><div><strong>Volley Coach</strong><span>PROFESSIONAL WORKSPACE</span></div><button type="button" class="vc17-side-close" aria-label="Cerrar menú" data-vc17-close>×</button></div>
 <nav class="vc17-primary-nav" aria-label="Áreas de la aplicación">${GROUPS.map(g=>`<div class="vc17-nav-group" data-vc17-group="${g.id}">
  <button type="button" class="vc17-nav-main" data-vc17-main="${g.id}" aria-expanded="false"><span class="vc17-nav-icon" aria-hidden="true">${navIcon(g.id)}</span><span>${g.label}</span>${g.items.length?'<span class="vc17-chevron" aria-hidden="true">⌄</span>':''}</button>
  ${g.items.length?`<div class="vc17-subnav" role="group" aria-label="${g.label}">${g.items.map(x=>`<button type="button" data-vc17-view="${x[0]}">${x[1]}</button>`).join('')}</div>`:''}</div>`).join('')}</nav>`;
 aside.replaceChildren(wrapper);
 if(footer){footer.classList.add('vc17-footer');aside.appendChild(footer)}
 return true;
}
function makeTopbar(doc){
 const bar=doc.getElementById('v11-topbar');if(!bar)return;
 const original=bar.querySelector('.v11-topbar-actions');
 const cloud=doc.createElement('div');cloud.id='vc17-top-actions';cloud.className='vc17-top-actions';
 cloud.innerHTML=`<div class="vc17-team-control" aria-label="Seleccionar equipo"><span>Equipo</span><select id="vc17-team-select" aria-label="Equipo activo"><option value="infantil">Infantil</option><option value="cadete">Cadete</option></select></div>
 <button type="button" id="vc17-sync-button" class="vc17-sync-button" aria-label="Abrir estado de nube"><span class="vc17-cloud-dot" id="vc17-cloud-dot"></span><span class="vc17-sync-copy"><b id="vc17-cloud-title">Nube</b><small id="vc17-peer-label">Dispositivos: sin comprobar</small></span></button>
 <button type="button" id="vc17-search-open" class="vc17-search-button" aria-label="Buscar una sección" title="Buscar una sección (Ctrl+K)">⌕ <span>Buscar</span> <kbd>Ctrl K</kbd></button>`;
 if(original)original.style.display='none';bar.appendChild(cloud);
 const left=bar.querySelector('.v11-topbar-left');if(left){const button=left.querySelector('.v11-menu-toggle');if(button){button.textContent='☰';button.setAttribute('aria-label','Abrir navegación');button.setAttribute('aria-expanded','false')}}
}
function makeContext(doc){
 const main=doc.getElementById('v11-main');if(!main)return;
 const strip=doc.createElement('section');strip.id='vc17-context';strip.className='vc17-context';strip.setAttribute('aria-label','Navegación del área');
 strip.innerHTML=`<div class="vc17-context-title"><span id="vc17-area-kicker">Inicio</span><b id="vc17-view-label">Centro de trabajo</b></div><div class="vc17-context-links" id="vc17-context-links"></div>`;
 main.insertBefore(strip,main.firstChild);
}
function makeDashboard(doc){
 const dashboard=doc.getElementById('dashboard');if(!dashboard)return;
 const home=doc.createElement('div');home.id='vc17-dashboard';
 home.innerHTML=`<div class="vc17-hero"><div class="vc17-hero-copy"><span>VOLLEY COACH · V17.0.1</span><h2>Tu centro de trabajo</h2><p>Prepara entrenamientos, continúa un partido o revisa tus datos desde un mismo lugar.</p><div class="vc17-hero-actions"><button type="button" data-vc17-link="entrenamiento" class="vc17-primary">Continuar sesión</button><button type="button" data-vc17-link="scout-dashboard" class="vc17-secondary">Abrir partidos</button></div></div><div class="vc17-hero-art" aria-hidden="true"><span>VC</span><small>COACHING · SCOUTING · ANALYSIS</small></div></div>
 <div class="vc17-section-header"><div><span>ÁREAS DE TRABAJO</span><h3>¿Qué necesitas hacer?</h3></div></div>
 <div class="vc17-workspaces">${GROUPS.filter(g=>!['home','management'].includes(g.id)).map(g=>`<button type="button" class="vc17-workspace-card" data-vc17-link="${g.defaultView}"><span class="vc17-work-icon">${navIcon(g.id)}</span><strong>${g.label}</strong><small>${({training:'Planifica y dirige tus sesiones',matches:'Scouting, partido y banquillo',analysis:'Estadísticas, táctica e informes',video:'Reproductor, Delay y clips',team:'Plantilla y desarrollo'})[g.id]}</small><span class="vc17-work-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>
 <div class="vc17-section-header vc17-space"><div><span>ESTADO DEL EQUIPO</span><h3>Actividad y accesos rápidos</h3></div><button type="button" class="vc17-text-button" id="vc17-refresh">Actualizar</button></div>
 <div class="vc17-summary-grid"><div class="vc17-stat"><span>Equipo activo</span><b id="vc17-kpi-team">—</b><small>Contexto de trabajo</small></div><div class="vc17-stat"><span>Ejercicios</span><b id="vc17-kpi-exercises">—</b><small>Biblioteca disponible</small></div><div class="vc17-stat"><span>Sesiones esta semana</span><b id="vc17-kpi-week">—</b><small>Según planificación local</small></div><div class="vc17-stat"><span>Historial</span><b id="vc17-kpi-history">—</b><small>Sesiones registradas</small></div></div>
 <div class="vc17-home-bottom"><section class="vc17-home-panel"><div class="vc17-home-panel-top"><h3>Entrenamientos</h3><button type="button" data-vc17-link="planificacion">Ver planificación ↗</button></div><p>Planifica, prepara y consulta el trabajo del equipo.</p><div class="vc17-home-feature"><b id="vc17-feature-session">—</b><span id="vc17-feature-session-time">Duración de la sesión en preparación</span></div><div class="vc17-home-panel-links"><button type="button" data-vc17-link="entrenamiento">Sesión actual</button><button type="button" data-vc17-link="ejercicios">Ejercicios</button><button type="button" data-vc17-link="historial">Historial</button></div></section>
 <section class="vc17-home-panel"><div class="vc17-home-panel-top"><h3>Partidos</h3><button type="button" data-vc17-link="scout-dashboard">Centro de partidos ↗</button></div><p>Continúa el scouting o prepara el próximo partido.</p><div class="vc17-home-feature"><b id="vc17-feature-match">Sin partido activo</b><span id="vc17-feature-match-count">— scoutings guardados</span></div><div class="vc17-home-panel-links"><button type="button" data-vc17-link="scout-match-mode">Modo partido</button><button type="button" data-vc17-link="vc155-bench">Banquillo</button><button type="button" data-vc17-link="scout-analysis">Análisis</button></div></section>
 <section class="vc17-home-panel"><div class="vc17-home-panel-top"><h3>Estado de nube</h3><button type="button" data-vc17-cloud>Ver detalles ↗</button></div><p>La presencia de otros dispositivos no significa que los cambios estén confirmados.</p><div class="vc17-home-feature"><b id="vc17-feature-cloud">Nube sin comprobar</b><span id="vc17-feature-peers">Dispositivos: sin comprobar</span></div><div class="vc17-home-panel-links"><button type="button" data-vc17-link="v11-management">Gestión</button><button type="button" data-vc17-cloud>Dispositivos y nube</button></div></section></div>`;
 dashboard.insertBefore(home,dashboard.firstChild);
}
function makeSearch(doc){
 const dlg=doc.createElement('div');dlg.id='vc17-command';dlg.hidden=true;
 dlg.innerHTML=`<div class="vc17-command-shade" data-vc17-dismiss></div><div class="vc17-command-box" role="dialog" aria-modal="true" aria-label="Buscar sección"><label for="vc17-command-input">Ir a una sección</label><input id="vc17-command-input" autocomplete="off" placeholder="Entrenamiento, partido, análisis…"/><div id="vc17-command-results" role="listbox"></div><p>Esc para cerrar · Enter para abrir el primer resultado</p></div>`;
 doc.body.appendChild(dlg);
}
function mount(root){
 const doc=root.document;
 if(!doc||doc.getElementById('vc17-context'))return;
 const begin=()=>{
  if(doc.getElementById('vc17-context'))return;
  if(!doc.getElementById('v11-sidebar')||!doc.getElementById('dashboard'))return;
  makeSidebar(doc);makeTopbar(doc);makeContext(doc);makeDashboard(doc);makeSearch(doc);
  doc.body.classList.add('vc17-shell');
  let activeView=doc.querySelector('.view.active')?.id||'dashboard',openGroup=resolveRoute(activeView).group,searchLastFocus=null;
  const $=id=>doc.getElementById(id);
  function closeMenu(){doc.getElementById('v11-sidebar')?.classList.remove('open');$('v11-sidebar-overlay')?.classList.remove('open');doc.querySelector('.v11-menu-toggle')?.setAttribute('aria-expanded','false')}
  function activate(view,preferredGroup){
   activeView=view;const group=(GROUP_BY_ID[preferredGroup]?.items.some(x=>x[0]===view)||GROUP_BY_ID[preferredGroup]?.defaultView===view)?preferredGroup:resolveRoute(view).group;
   openGroup=group;
   doc.querySelectorAll('[data-vc17-group]').forEach(node=>{const selected=node.dataset.vc17Group===group;node.classList.toggle('active',selected);node.classList.toggle('expanded',selected);node.querySelector('.vc17-nav-main')?.setAttribute('aria-expanded',String(selected))});
   doc.querySelectorAll('[data-vc17-view]').forEach(btn=>{const selected=btn.dataset.vc17View===view&&btn.closest('[data-vc17-group]')?.dataset.vc17Group===group;btn.classList.toggle('active',selected);if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
   const meta=GROUP_BY_ID[group]||GROUP_BY_ID.home;
   if($('vc17-area-kicker'))$('vc17-area-kicker').textContent=meta.label;
   if($('vc17-view-label'))$('vc17-view-label').textContent=view==='dashboard'?'Centro de trabajo':navTitle(view);
   const links=$('vc17-context-links');if(links){
    const nav=meta.items.length?meta.items:[[meta.defaultView,meta.label]];
    links.replaceChildren(...nav.map(([id,label])=>{const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.vc17Link=id;b.className='vc17-context-link'+(id===view?' active':'');if(id===view)b.setAttribute('aria-current','page');return b}));
   }
   closeMenu();if(view==='dashboard')updateAll();
  }
  function route(target,preferredGroup){
   const {view}=resolveRoute(target);
   if(!doc.getElementById(view)||!doc.getElementById(view).classList.contains('view'))return false;
   try{
    // Reuse original workspace activation; never copy or change business data.
    if(['scout-dashboard','scout-match-mode','scout-workspace-v900','scout-analysis','vc155-bench','competicion','scout-plan','scout-matchup','scout-season'].includes(view))root.openWorkspace?.('scouting');
    else if(view==='scout-video-hub')root.openWorkspace?.('video');
    else if(['dashboard','entrenamiento','planificacion','ejercicios','historial','estadisticas','jugadores'].includes(view))root.openWorkspace?.('training');
    if(typeof root.showView!=='function')return false;
    root.showView(view,root.botonVista?.(view)||null);
    activate(view,preferredGroup);
    return true;
   }catch(err){console.warn('VC17: no se pudo abrir',view,err);return false}
  }
  function updateAll(){
   const s=statusFromDOM(doc);
   function txt(id,val){const el=$(id);if(el&&el.textContent!==String(val))el.textContent=String(val)}
   txt('vc17-kpi-team',s.team);txt('vc17-kpi-exercises',s.exerciseCount);txt('vc17-kpi-week',s.weekCount);txt('vc17-kpi-history',s.historyCount);
   txt('vc17-feature-session',s.sessionCount+' ejercicios');txt('vc17-feature-session-time',s.plannedMinutes);
   let active=null,matches=[];try{active=root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null;matches=root.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()||[]}catch(_){ }
   txt('vc17-feature-match',active?'vs '+cleanString(active.opponent||'Rival'):'Sin partido activo');
   txt('vc17-feature-match-count',matches.length+' scoutings guardados');
   txt('vc17-cloud-title',s.cloud.text);txt('vc17-feature-cloud',s.cloud.text);
   const peers=s.peers===null?'Otros dispositivos: sin comprobar':`Otros dispositivos conectados: ${s.peers}`;
   txt('vc17-peer-label',peers);txt('vc17-feature-peers',peers);
   const dot=$('vc17-cloud-dot');if(dot)dot.dataset.state=s.cloud.kind;
   const teamSelect=$('vc17-team-select');
   const team=String(root.equipoActivo||'').toLowerCase();
   if(team==='infantil'||team==='cadete')teamSelect.value=team;
   else{const name=s.team.toLowerCase();if(name.includes('infantil'))teamSelect.value='infantil';if(name.includes('cadete'))teamSelect.value='cadete'}
  }
  function openSearch(){const el=$('vc17-command');if(!el)return;searchLastFocus=doc.activeElement;el.hidden=false;drawSearch('');const input=$('vc17-command-input');if(input){input.value='';input.focus()}}
  function closeSearch(){const el=$('vc17-command');if(el)el.hidden=true;searchLastFocus?.focus?.()}
  function drawSearch(q){const result=$('vc17-command-results');if(!result)return;const term=cleanString(q).toLocaleLowerCase('es');const candidates=GROUPS.flatMap(g=>g.items.length?g.items.map(([id,label])=>({id,label,group:g.label})):[{id:g.defaultView,label:g.label,group:'Inicio'}]).filter(x=>!term||`${x.label} ${x.group}`.toLocaleLowerCase('es').includes(term)).slice(0,12);result.replaceChildren(...candidates.map(x=>{const b=doc.createElement('button');b.type='button';b.dataset.vc17Link=x.id;b.innerHTML=`<strong>${escapeHTML(x.label)}</strong><small>${escapeHTML(x.group)}</small>`;return b}));if(!candidates.length)result.textContent='No se ha encontrado esa sección.'}
  doc.addEventListener('click',event=>{
   const btn=event.target.closest?.('[data-vc17-main],[data-vc17-view],[data-vc17-link],[data-vc17-close],[data-vc17-cloud],[data-vc17-dismiss],#vc17-sync-button,#vc17-search-open,#vc17-refresh');if(!btn)return;
   if(btn.matches('[data-vc17-dismiss]'))return closeSearch();
   if(btn.matches('[data-vc17-close]'))return closeMenu();
   if(btn.matches('#vc17-search-open'))return openSearch();
   if(btn.matches('#vc17-refresh')){try{root.renderDashboard?.()}catch(_){}return updateAll()}
   if(btn.matches('[data-vc17-cloud],#vc17-sync-button'))return root.abrirCloud?.();
   if(btn.dataset.vc17Main){route(btn.dataset.vc17Main,btn.dataset.vc17Main);return}
   const target=btn.dataset.vc17View||btn.dataset.vc17Link;if(target){const contextGroup=btn.closest('[data-vc17-group]')?.dataset.vc17Group;const ok=route(target,contextGroup);if(ok)closeSearch()}
  });
  $('vc17-team-select')?.addEventListener('change',e=>{const id=e.target.value;if(typeof root.v11SetTeam==='function')root.v11SetTeam(id);else root.cambiarEquipo?.(id);updateAll()});
  $('vc17-command-input')?.addEventListener('input',e=>drawSearch(e.target.value));
  doc.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();return}
   if(e.key==='Escape'){closeSearch();closeMenu();return}
   if(e.key==='Enter'&&!$('vc17-command')?.hidden&&doc.activeElement?.id==='vc17-command-input'){$('vc17-command-results')?.querySelector('button')?.click()}
  });
  doc.querySelector('.v11-menu-toggle')?.addEventListener('click',()=>{const open=doc.getElementById('v11-sidebar')?.classList.contains('open');doc.querySelector('.v11-menu-toggle')?.setAttribute('aria-expanded',String(!!open))});
  const baseShow=root.showView;
  if(typeof baseShow==='function'&&!baseShow.__vc17){
   const wrapped=function(...args){const out=baseShow.apply(this,args);const view=doc.querySelector('.view.active')?.id||args[0];if(view)activate(view);return out};wrapped.__vc17=true;root.showView=wrapped;
  }
  const baseRender=root.renderDashboard;
  if(typeof baseRender==='function'&&!baseRender.__vc17){const wrapped=function(...args){const out=baseRender.apply(this,args);updateAll();return out};wrapped.__vc17=true;root.renderDashboard=wrapped}
  const baseTeam=root.cambiarEquipo;
  if(typeof baseTeam==='function'&&!baseTeam.__vc17){const wrapped=function(...args){const out=baseTeam.apply(this,args);updateAll();return out};wrapped.__vc17=true;root.cambiarEquipo=wrapped}
  // Observe only the legacy status fields, not the entire document. No polling / network calls.
  ['cloud-label','vc52-peer-count','team-active-name','dash-library','dash-week-count','dash-history-count','dash-current-count','dash-current-time'].forEach(id=>{
   const el=$(id);if(el&&typeof root.MutationObserver==='function')new root.MutationObserver(updateAll).observe(el,{childList:true,subtree:true,characterData:true});
  });
  activate(activeView);updateAll();
  root.VC17_WORKSPACE={version:'17.0.1',route,resolveRoute,refresh:updateAll,diagnostics:()=>({activeView,activeGroup:resolveRoute(activeView).group,links:doc.querySelectorAll('[data-vc17-link]').length,navGroups:doc.querySelectorAll('[data-vc17-group]').length,classicSyncUnchanged:true,dataModelChanged:false})};
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
}
return {GROUPS,VIEW_GROUP,resolveRoute,navTitle,cloudSummary,statusFromDOM,escapeHTML,mount};
});
