/* VC20716_BUNDLE: preserved original scripts in HTML execution order. */
/* VC20716_SOURCE_BEGIN:148-vc1750-ui-scheduler.js */
/* Volley Coach V17.5.0 · UI scheduler.
 * Display-only: groups redundant DOM observer notifications into one animation
 * frame. No networking, match/training mutations, timers that poll data or sync.
 * Explicit button actions still call their existing handlers synchronously.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document&&!root.VC175_UI_SCHEDULER){
  const raf=typeof root.requestAnimationFrame==='function'?root.requestAnimationFrame.bind(root):cb=>root.setTimeout(cb,16);
  root.VC175_UI_SCHEDULER=api.createScheduler({raf,now:()=>root.performance?.now?.()??Date.now()});
  root.VC175_UI_SCHEDULER.version=api.VERSION;
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.5.0';
 function createScheduler({raf,now}={}){
  if(typeof raf!=='function')throw new TypeError('raf es necesario');
  const clock=typeof now==='function'?now:()=>Date.now();
  const jobs=new Map();let pending=false;
  const stats={frames:0,callbacks:0,coalesced:0,errors:0,maxQueue:0,totalCallbackMs:0,maxCallbackMs:0};
  function flush(){
   pending=false;
   const batch=[...jobs.entries()];jobs.clear();
   if(!batch.length)return;
   stats.frames++;
   for(const [key,fn] of batch){
    const start=clock();
    try{fn();}
    catch(err){stats.errors++;if(typeof console!=='undefined')console.error('[VC17.5 UI]',key,err)}
    finally{
     const duration=Math.max(0,clock()-start);
     stats.callbacks++;
     stats.totalCallbackMs+=duration;
     stats.maxCallbackMs=Math.max(stats.maxCallbackMs,duration);
    }
   }
  }
  function schedule(key,fn){
   if(typeof fn!=='function')return false;
   const name=String(key||'ui');
   if(jobs.has(name))stats.coalesced++;
   jobs.set(name,fn);
   stats.maxQueue=Math.max(stats.maxQueue,jobs.size);
   if(!pending){pending=true;raf(flush)}
   return true;
  }
  function diagnostics(){
   return {version:VERSION,frames:stats.frames,callbacks:stats.callbacks,
    coalesced:stats.coalesced,errors:stats.errors,maxQueue:stats.maxQueue,
    pendingKeys:[...jobs.keys()],averageCallbackMs:stats.callbacks?Math.round(100*stats.totalCallbackMs/stats.callbacks)/100:0,
    maxCallbackMs:Math.round(100*stats.maxCallbackMs)/100,
    readonly:true};
  }
  return {schedule,diagnostics};
 }
 return {VERSION,createScheduler};
});

/* VC20716_SOURCE_END:148-vc1750-ui-scheduler.js */

;
/* VC20716_SOURCE_BEGIN:170-vc1900-unified-workflow.js */
/* Volley Coach · Professional Workspace 2.0 (V19.1.2).
 * Canonical information architecture. Existing views and business engines remain
 * mounted under their original IDs. This module does not change stored data.
 * A single navigation renderer (V17 adapter) consumes the registry below.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    // Resolve the model before V17's deferred mount runs. Never mount a second bar.
    root.VC19_WORKSPACE_MODEL = api;
    api.mount(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '19.3.19.2';
  const GROUPS = Object.freeze([
    { id: 'home', label: 'Inicio', icon: '⌂', defaultView: 'dashboard', items: [] },
    { id: 'team', label: 'Club y equipos', icon: '◎', defaultView: 'jugadores', items: [
      ['jugadores', 'Centro del club y plantilla'], ['scout-season', 'Temporada y rendimiento']
    ] },
    { id: 'training', label: 'Entrenamientos', icon: '◇', defaultView: 'planificacion', items: [
      ['planificacion', 'Planificación'], ['entrenamiento', 'Sesión actual'],
      ['ejercicios', 'Biblioteca'], ['historial', 'Historial y evaluación'], ['estadisticas', 'Seguimiento']
    ] },
    { id: 'matches', label: 'Partidos', icon: '◈', defaultView: 'scout-dashboard', items: [
      ['scout-dashboard', 'Centro de partidos'], ['competicion', 'Calendario'],
      ['scout-plan', 'Preparar partido'], ['scout-match-mode', 'Match Workspace · Scouting'],
      ['vc155-bench', 'Banquillo y Bench Client']
    ] },
    { id: 'analysis', label: 'Análisis', icon: '▥', defaultView: 'scout-analysis', items: [
      ['scout-analysis', 'Análisis táctico y Worksheets'], ['v11-reports', 'Informes'],
      ['scout-matchup', 'Rivales']
    ] },
    { id: 'video', label: 'Video Studio', icon: '▷', defaultView: 'scout-video-hub', items: [
      ['scout-video-hub', 'Grabación, Delay y videoteca']
    ] },
    { id: 'settings', label: 'Configuración', icon: '⚙', defaultView: 'v11-management', items: [
      ['v11-management', 'Gestión y arquitectura'], ['scout-safe', 'Copias y recuperación']
    ] }
  ].map(group => Object.freeze({ ...group, items: Object.freeze(group.items.map(item => Object.freeze(item))) })));
  const VIEW_GROUP = Object.freeze(Object.fromEntries(GROUPS.flatMap(g =>
    (g.items.length ? g.items : [[g.defaultView, g.label]]).map(([view]) => [view, g.id])
  ).concat([['scouting', 'matches'], ['scout-workspace-v900','matches']])));
  const WORKFLOWS = Object.freeze(Object.fromEntries(GROUPS.map(g => [g.id, Object.freeze({
    label: g.label, description: {
      home: 'Vista general', training: 'Preparación, sesión y evaluación',
      matches: 'Preparación, directo y registro', video: 'Grabación, Delay, clips y revisión',
      analysis: 'Datos, informes y evolución', team: 'Jugadores y plantilla',
      settings: 'Ajustes, integridad y recuperación'
    }[g.id], steps: g.items.length ? g.items : [[g.defaultView, g.label]]
  })])));
  const VIEW_TO_AREA = VIEW_GROUP;
  /** Canonical work area and legacy destinations; visual mode remains an explicit choice. */
  function canonicalMatchRoute(raw) {
    const target=String(raw||'');
    if(['scouting','scout-workspace-v900','coding','codificacion','scouting-pro'].includes(target))
      return {view:'scout-match-mode',mode:'visual',legacy:true};
    if(['match','scout-match-mode'].includes(target))
      return {view:'scout-match-mode',mode:null,legacy:target!=='scout-match-mode'};
    return {view:target,mode:null,legacy:false};
  }
  /** Shared navigation bridge. All workspace adapters use the V17 router when
   * available; only early boot uses the original showView fallback.
   * This adapter does not activate matches or write business data.
   */
  function navigateView(root, raw, preferredArea) {
    const route = canonicalMatchRoute(raw);
    const view = route.view;
    const dest = root?.document?.getElementById?.(view);
    if (!dest || !dest.classList?.contains('view')) return false;
    if (typeof root?.VC17_WORKSPACE?.route === 'function') {
      try { return root.VC17_WORKSPACE.route(raw, preferredArea) === true; }
      catch (err) { root.console?.warn?.('V19: no se pudo abrir la vista', view, err); return false; }
    }
    if (typeof root?.showView !== 'function') return false;
    try {
      root.showView(view, root.botonVista?.(view) || null);
      if (route.mode === 'visual') root.vc52SetMode?.('visual');
      return true;
    } catch (err) {
      root.console?.warn?.('V19: no se pudo abrir la vista', view, err);
      return false;
    }
  }
  function activeContext(doc, root) {
    const view = doc.querySelector('.view.active')?.id || 'dashboard';
    return { view, area: VIEW_TO_AREA[view] || 'home', videoOrigin: view === 'scout-video-hub' ?
      (root?.VC17_VIDEO_CONTEXT?.kind === 'training' ? 'training' : 'matches') : null };
  }
  function nextStep(area, view) {
    const steps = WORKFLOWS[area]?.steps || [];
    const index = steps.findIndex(([id]) => id === view);
    return index < 0 || index + 1 >= steps.length ? null : steps[index + 1];
  }
  function inspect(doc) {
    const views = Array.from(doc.querySelectorAll('.view[id]')).map(v => v.id);
    const routed = GROUPS.flatMap(g => (g.items.length ? g.items : [[g.defaultView, g.label]]).map(x => x[0]));
    const missing = routed.filter(id => !views.includes(id));
    const duplicated = routed.filter((id, i) => routed.indexOf(id) !== i);
    const hiddenLegacy = views.filter(id => !routed.includes(id));
    const staticDuplicateLinks = doc.querySelectorAll('.vc1730-legacy').length;
    const matchPickerCount = doc.querySelectorAll('#vc19-match-picker').length;
    return { version: VERSION, sevenAreas: GROUPS.map(g => g.label), viewCount: views.length,
      routedCount: routed.length, missingRoutes: missing, duplicatedRoutes: duplicated,
      legacyViewsRetained: hiddenLegacy, presentation: {
        analysisQuickLinkDuplicates: staticDuplicateLinks,
        scoutingPickerCount: matchPickerCount,
        scoutingEditorConsolidated: matchPickerCount === 1,
        connectedDevicesCounterRetained: !!doc.getElementById('vc1741-devices-button')
      }, noBusinessDataChanges: true };
  }
  function attachAudit(doc) {
    const host = doc.getElementById('v11-management');
    if (!host || doc.getElementById('vc19-workspace-audit')) return false;
    const section = doc.createElement('section');
    section.id = 'vc19-workspace-audit';
    const heading = doc.createElement('h3');
    heading.textContent = 'V19 · Espacio de trabajo';
    const intro = doc.createElement('p');
    intro.textContent = 'Seis áreas operativas y configuración. Esta comprobación no modifica datos ni sincronización.';
    const btn = doc.createElement('button');
    btn.type = 'button'; btn.textContent = 'Comprobar estructura';
    const out = doc.createElement('p');
    out.setAttribute('role', 'status');
    out.textContent = 'Pulsa para verificar rutas y detectar accesos antiguos.';
    btn.addEventListener('click', () => {
      const report = inspect(doc);
      out.textContent = `${report.sevenAreas.length} áreas · ${report.routedCount} rutas · ` +
        `${report.missingRoutes.length} rutas ausentes · ${report.duplicatedRoutes.length} duplicadas. ` +
        (report.legacyViewsRetained.length ?
          'Vistas heredadas conservadas por compatibilidad: ' + report.legacyViewsRetained.join(', ') + '.' :
          'No quedan vistas heredadas fuera del mapa.');
    });
    section.append(heading, intro, btn, out);
    host.appendChild(section);
    return true;
  }
  function mount(root) {
    const doc = root.document;
    root.VC19_UNIFIED_WORKFLOW = {
      version: VERSION, inspect: () => inspect(doc),
      route: (view, area) => navigateView(root, view, area),
      diagnostics: () => ({ ...inspect(doc), active: activeContext(doc, root),
        singleSidebar: doc.querySelectorAll('.vc17-primary-nav').length === 1,
        obsoleteStepperRemoved: !doc.getElementById('vc19-workflow'),
        connectedDevicesPreserved: !!doc.getElementById('vc1741-devices-button') })
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => attachAudit(doc), { once: true });
    else attachAudit(doc);
    return true;
  }
  return { VERSION, GROUPS, VIEW_GROUP, VIEW_TO_AREA, WORKFLOWS, nextStep, activeContext, canonicalMatchRoute, navigateView, inspect, mount };
});

/* VC20716_SOURCE_END:170-vc1900-unified-workflow.js */

;
/* VC20716_SOURCE_BEGIN:143-vc1700-professional-workspace.js */
/* Volley Coach V17.4.1 · Professional Workspace brand & layout polish.
 * Navigation and presentation adapter ONLY. Does not read/write local data, Supabase,
 * scouting, media or training engines. Keeps all original view IDs and APIs intact.
 */
(function(root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LEGACY_GROUPS=[
 {id:'home',label:'Inicio',icon:'⌂',defaultView:'dashboard',items:[]},
 {id:'training',label:'Entrenamientos',icon:'◇',defaultView:'entrenamiento',items:[['planificacion','Planificar'],['entrenamiento','Preparar sesión'],['scout-video-hub','Vídeo · Delay y grabación'],['historial','Evaluar'],['ejercicios','Biblioteca'],['estadisticas','Seguimiento']]},
 {id:'matches',label:'Partidos',icon:'◈',defaultView:'scout-dashboard',items:[['scout-dashboard','Centro de partidos'],['competicion','Calendario'],['scout-plan','Preparación'],['scout-match-mode','En directo'],['scout-workspace-v900','Codificación'],['vc155-bench','Banquillo'],['scout-video-hub','Vídeo y grabación']]},
 {id:'analysis',label:'Análisis',icon:'▥',defaultView:'scout-analysis',items:[['scout-analysis','Estadísticas y táctica'],['v11-reports','Informes'],['scout-season','Temporada'],['scout-matchup','Rivales']]},
 {id:'team',label:'Equipo',icon:'◎',defaultView:'jugadores',items:[['jugadores','Plantilla'],['scout-season','Temporada'],['scout-safe','Copias y recuperación']]},
 {id:'management',auxiliary:true,label:'Gestión',icon:'⚙',defaultView:'v11-management',items:[['v11-management','Configuración'],['scout-safe','Recuperación']]}
];
let CANONICAL_MATCH_ROUTE=null;
let GROUPS=LEGACY_GROUPS;
let GROUP_BY_ID=Object.fromEntries(GROUPS.map(x=>[x.id,x]));
// Explicit resolution for routes shared by more than one workspace.
let VIEW_GROUP={dashboard:'home',entrenamiento:'training',planificacion:'training',ejercicios:'training',historial:'training',estadisticas:'training',
 'scout-dashboard':'matches',competicion:'matches','scout-plan':'matches','scout-match-mode':'matches','scout-workspace-v900':'matches','vc155-bench':'matches',
 'scout-analysis':'analysis','v11-reports':'analysis','scout-season':'analysis','scout-matchup':'analysis','scout-video-hub':'matches',jugadores:'team',
 'v11-management':'management','scout-safe':'management'};
const ALIASES={home:'dashboard',training:'entrenamiento',planning:'planificacion',players:'jugadores','scout-home':'scout-dashboard',
 scouting:'scout-match-mode','scout-workspace-v900':'scout-match-mode',coding:'scout-match-mode',codificacion:'scout-match-mode','scouting-pro':'scout-match-mode',match:'scout-match-mode',bench:'vc155-bench',analysis:'scout-analysis',reports:'v11-reports',video:'scout-video-hub',management:'v11-management',settings:'v11-management',configuration:'v11-management'};
const cleanString=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
function resolveRoute(raw){
 const target=String(raw||'home');
 const g=GROUP_BY_ID[target];if(g)return {view:g.defaultView,group:g.id,mode:null};
 const canonical=CANONICAL_MATCH_ROUTE?.(target);
 const view=canonical?.view&&canonical.view!==target?canonical.view:(ALIASES[target]||target);
 const mode=canonical?.mode||(['scouting','scout-workspace-v900','coding','codificacion','scouting-pro'].includes(target)?'visual':null);
 return {view,group:VIEW_GROUP[view]||'home',mode};
}
function navTitle(id){for(const g of GROUPS){if(g.defaultView===id)return g.label;const found=g.items.find(x=>x[0]===id);if(found)return found[1]}return 'Área de trabajo'}
function cloudSummary(raw){
 const text=cleanString(raw)||'Nube sin comprobar';
 // Presence is independent of successful synchronization.
 const lower=text.toLowerCase();
 return {text,kind:/error|fall|desconect|pendiente|conflicto|sin conexi[oó]n/.test(lower)?'warn':/sincroniz|conectad|actualizad|guardad|online/.test(lower)?'ok':'idle'};
}
// Presence is a live Realtime signal, not the last known device in a scouting panel.
// Preserve the legacy DOM fallback only when the Sync Pro presence API is not loaded.
function presenceCount(root,doc){
 try{
  if(typeof root?.VC_SYNC_PRO?.connectedDevices==='function'){
   const connected=root.VC_SYNC_PRO.connectedDevices();
   return Array.isArray(connected)?new Set(connected.map(p=>String(p?.deviceId||'')).filter(Boolean)).size:null;
  }
  const device=root?.VC_DEVICE_SYNC?.diagnostics?.();
  if(device){
   if(device.realtimeState!=='SUBSCRIBED')return null;
   return new Set((Array.isArray(device.presencePeers)?device.presencePeers:[]).map(p=>String(p?.deviceId||'')).filter(Boolean)).size;
  }
 }catch(_){return null}
 const raw=cleanString(doc.getElementById('vc52-peer-count')?.textContent);
 return /^\d+$/.test(raw)?Number(raw):null;
}
function statusFromDOM(doc,root=doc.defaultView){
 const $=id=>doc.getElementById(id);
 const peers=presenceCount(root,doc);
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
 settings:'<circle cx="12" cy="12" r="3"/><path d="M4 12a8 8 0 0 1 16 0 8 8 0 0 1-16 0z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'
 };
 return '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[id]||paths.home)+'</svg>';
}
function makeSidebar(doc){
 const aside=doc.getElementById('v11-sidebar');if(!aside)return false;
 const footer=aside.querySelector('.v11-sidebar-footer');
 const wrapper=doc.createElement('div');wrapper.className='vc17-sidebar-frame';
 wrapper.innerHTML=`<div class="vc17-brand"><div class="vc17-brand-mark" aria-hidden="true"><img src="./vc-logo-mark.png?v=17.0.2" alt=""></div><div><strong>Volley Coach</strong><span>PROFESSIONAL WORKSPACE</span></div><button type="button" class="vc17-side-close" aria-label="Cerrar menú" data-vc17-close>×</button></div>
 <nav class="vc17-primary-nav" aria-label="Áreas de la aplicación">${GROUPS.filter(g=>!g.auxiliary).map(g=>`<div class="vc17-nav-group" data-vc17-group="${g.id}">
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
 <button type="button" id="vc1741-devices-button" class="vc1741-devices-button" aria-label="Presencia de dispositivos sin confirmar" title="Ver dispositivos conectados"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="15" height="11" rx="1.5"/><path d="M6 20h7M9.5 15v5"/><rect x="18" y="9" width="4" height="10" rx="1"/></svg><b id="vc1741-devices-number">—</b><span>dispositivos</span></button>
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
 home.innerHTML=`<div class="vc17-hero"><div class="vc17-hero-copy"><span>VOLLEY COACH · V19.3.19.2</span><h2>Tu centro de trabajo</h2><p>Prepara entrenamientos, continúa un partido o revisa tus datos desde un mismo lugar.</p><div class="vc17-hero-actions"><button type="button" data-vc17-link="entrenamiento" class="vc17-primary">Continuar sesión</button><button type="button" data-vc17-link="scout-dashboard" class="vc17-secondary">Abrir partidos</button></div></div><div class="vc17-hero-art" aria-hidden="true"><img src="./vc-logo-icon.png?v=17.0.2" alt=""><small>COACHING · SCOUTING · ANALYSIS</small></div></div>
 <div class="vc17-section-header"><div><span>ÁREAS DE TRABAJO</span><h3>¿Qué necesitas hacer?</h3></div></div>
 <div class="vc17-workspaces">${GROUPS.filter(g=>!['home','management'].includes(g.id)&&!g.auxiliary).map(g=>`<button type="button" class="vc17-workspace-card" data-vc17-link="${g.defaultView}"><span class="vc17-work-icon">${navIcon(g.id)}</span><strong>${g.label}</strong><small>${({training:'Planifica y dirige tus sesiones',matches:'Scouting, partido y banquillo',analysis:'Estadísticas, táctica e informes',video:'Reproductor, Delay y clips',team:'Plantilla y desarrollo',settings:'Nube, copias y ajustes'})[g.id]}</small><span class="vc17-work-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>
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
function useNavigationModel(model){
 if(!Array.isArray(model?.GROUPS)||model.GROUPS.length!==7||!model.VIEW_GROUP)return false;
 const ids=model.GROUPS.map(group=>group.id);
 if(new Set(ids).size!==ids.length)return false;
 GROUPS=model.GROUPS;
 GROUP_BY_ID=Object.fromEntries(GROUPS.map(group=>[group.id,group]));
 VIEW_GROUP=model.VIEW_GROUP;
 CANONICAL_MATCH_ROUTE=typeof model.canonicalMatchRoute==='function'?model.canonicalMatchRoute:null;
 return true;
}
function mount(root){
 const doc=root.document;
 if(!doc||doc.getElementById('vc17-context'))return;
 // Consume the canonical model; the legacy registry is failure-tolerant fallback.
 useNavigationModel(root.VC19_WORKSPACE_MODEL);
 const begin=()=>{
  if(doc.getElementById('vc17-context'))return;
  if(!doc.getElementById('v11-sidebar')||!doc.getElementById('dashboard'))return;
  makeSidebar(doc);makeTopbar(doc);makeContext(doc);makeDashboard(doc);makeSearch(doc);
  doc.body.classList.add('vc17-shell');
  let activeView=doc.querySelector('.view.active')?.id||'dashboard',openGroup=resolveRoute(activeView).group,searchLastFocus=null;
  const $=id=>doc.getElementById(id);
  function closeMenu(){doc.getElementById('v11-sidebar')?.classList.remove('open');$('v11-sidebar-overlay')?.classList.remove('open');doc.querySelector('.v11-menu-toggle')?.setAttribute('aria-expanded','false')}
  function activate(view,preferredGroup){
   const prior=activeView;activeView=view;
   // Video is its own workspace. Preserve origin for recordings linked to
   // a training or match instead of setting kind='video' (not an engine value).
   if(view==='scout-video-hub'){
    const origin=VIEW_GROUP[prior]==='training'?'training':
      VIEW_GROUP[prior]==='matches'?'matches':null;
    const kind=preferredGroup==='training'||preferredGroup==='matches'?preferredGroup:(origin || (root.VC17_VIDEO_CONTEXT?.kind==='training'?'training':'matches'));
    root.VC17_VIDEO_CONTEXT={...(root.VC17_VIDEO_CONTEXT||{}),kind};
   }
   const group=(GROUP_BY_ID[preferredGroup]?.items.some(x=>x[0]===view)||GROUP_BY_ID[preferredGroup]?.defaultView===view)?preferredGroup:resolveRoute(view).group;
   openGroup=group;
   doc.querySelectorAll('[data-vc17-group]').forEach(node=>{const selected=node.dataset.vc17Group===group;node.classList.toggle('active',selected);node.classList.toggle('expanded',selected);node.querySelector('.vc17-nav-main')?.setAttribute('aria-expanded',String(selected))});
   doc.querySelectorAll('[data-vc17-view]').forEach(btn=>{const selected=btn.dataset.vc17View===view&&btn.closest('[data-vc17-group]')?.dataset.vc17Group===group;btn.classList.toggle('active',selected);if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
   const meta=GROUP_BY_ID[group]||GROUP_BY_ID.home;
   if($('vc17-area-kicker'))$('vc17-area-kicker').textContent=meta.label;
   if($('vc17-view-label'))$('vc17-view-label').textContent=view==='dashboard'?'Centro de trabajo':view==='scout-video-hub'?(root.VC17_VIDEO_CONTEXT?.kind==='training'?'Video Studio · Entrenamiento':'Video Studio · Partido'):navTitle(view);
   const links=$('vc17-context-links');if(links){
    const nav=meta.items.length?meta.items:[[meta.defaultView,meta.label]];
    links.replaceChildren(...nav.map(([id,label])=>{const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.vc17Link=id;b.className='vc17-context-link'+(id===view?' active':'');if(id===view)b.setAttribute('aria-current','page');return b}));
   }
   closeMenu();if(view==='dashboard')updateAll();
  }
  function route(target,preferredGroup){
   const {view,mode}=resolveRoute(target);
   if(!doc.getElementById(view)||!doc.getElementById(view).classList.contains('view'))return false;
   try{
    // Reuse original workspace activation; never copy or change business data.
    if(['scout-dashboard','scout-match-mode','scout-workspace-v900','scout-analysis','vc155-bench','competicion','scout-plan','scout-matchup','scout-season'].includes(view))root.openWorkspace?.('scouting');
    else if(view==='scout-video-hub'){const previous=VIEW_GROUP[activeView];const kind=preferredGroup==='training'||preferredGroup==='matches'?preferredGroup:(previous==='training'||previous==='matches'?previous:(root.VC17_VIDEO_CONTEXT?.kind==='training'?'training':'matches'));root.VC17_VIDEO_CONTEXT={...(root.VC17_VIDEO_CONTEXT||{}),kind};root.openWorkspace?.('video');}
    else if(['dashboard','entrenamiento','planificacion','ejercicios','historial','estadisticas','jugadores'].includes(view))root.openWorkspace?.('training');
    if(typeof root.showView!=='function')return false;
    root.showView(view,root.botonVista?.(view)||null);
    activate(view,preferredGroup);
    // A historic Scouting Pro link opens the real integrated editor, not an
    // orphaned `.view` element. Never select or create a match implicitly here.
    if(mode==='visual')root.vc52SetMode?.('visual');
    return true;
   }catch(err){console.warn('VC17: no se pudo abrir',view,err);return false}
  }
  function updateAll(){
   const s=statusFromDOM(doc,root);
   function txt(id,val){const el=$(id);if(el&&el.textContent!==String(val))el.textContent=String(val)}
   txt('vc17-kpi-team',s.team);txt('vc17-kpi-exercises',s.exerciseCount);txt('vc17-kpi-week',s.weekCount);txt('vc17-kpi-history',s.historyCount);
   txt('vc17-feature-session',s.sessionCount+' ejercicios');txt('vc17-feature-session-time',s.plannedMinutes);
   // The dashboard is hidden in most workflows. Skip the match-list traversal
   // unless its cards are actually visible; presence/cloud status stays live.
   if($('dashboard')?.classList.contains('active')){
    let active=null,matches=[];try{active=root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null;matches=root.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()||[]}catch(_){ }
    txt('vc17-feature-match',active?'vs '+cleanString(active.opponent||'Rival'):'Sin partido activo');
    txt('vc17-feature-match-count',matches.length+' scoutings guardados');
   }
   txt('vc17-cloud-title',s.cloud.text);txt('vc17-feature-cloud',s.cloud.text);
   const peers=s.peers===null?'Dispositivos: sin comprobar':`Dispositivos conectados: ${s.peers}`;
   txt('vc17-peer-label',peers);txt('vc17-feature-peers',peers);
   txt('vc1741-devices-number',s.peers===null?'—':String(s.peers));
   const presenceBtn=$('vc1741-devices-button');
   if(presenceBtn){
    presenceBtn.dataset.presence=s.peers===null?'unknown':'confirmed';
    const label=s.peers===null?'Presencia de dispositivos sin confirmar':`${s.peers} dispositivo${s.peers===1?'':'s'} conectado${s.peers===1?'':'s'} · Ver detalles`;
    presenceBtn.setAttribute('aria-label',label);presenceBtn.title=label;
   }
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
   const btn=event.target.closest?.('[data-vc17-main],[data-vc17-view],[data-vc17-link],[data-vc17-close],[data-vc17-cloud],[data-vc17-dismiss],#vc17-sync-button,#vc1741-devices-button,#vc17-search-open,#vc17-refresh');if(!btn)return;
   if(btn.matches('[data-vc17-dismiss]'))return closeSearch();
   if(btn.matches('[data-vc17-close]'))return closeMenu();
   if(btn.matches('#vc17-search-open'))return openSearch();
   if(btn.matches('#vc17-refresh')){try{root.renderDashboard?.()}catch(_){}return updateAll()}
   if(btn.matches('#vc1741-devices-button')){
    if(typeof root.VC_SYNC_PRO?.open==='function')return root.VC_SYNC_PRO.open();
    return root.abrirCloud?.();
   }
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
   const wrapped=function(...args){
    const requested=String(args[0]??'');
    const target=resolveRoute(requested);
    // Prevent legacy buttons and inline handlers from opening orphan `.view`s.
    // Retain the original showView for all canonical destinations.
    const redirected=!!(requested&&target.view!==requested&&doc.getElementById(target.view)?.classList.contains('view'));
    const actual=redirected?[target.view,root.botonVista?.(target.view)||null]:args;
    const out=baseShow.apply(this,actual);
    if(redirected&&target.mode==='visual')root.vc52SetMode?.('visual');
    const view=doc.querySelector('.view.active')?.id||actual[0];if(view)activate(view);
    return out;
   };wrapped.__vc17=true;root.showView=wrapped;
  }
  const baseRender=root.renderDashboard;
  if(typeof baseRender==='function'&&!baseRender.__vc17){const wrapped=function(...args){const out=baseRender.apply(this,args);updateAll();return out};wrapped.__vc17=true;root.renderDashboard=wrapped}
  const baseTeam=root.cambiarEquipo;
  if(typeof baseTeam==='function'&&!baseTeam.__vc17){const wrapped=function(...args){const out=baseTeam.apply(this,args);updateAll();return out};wrapped.__vc17=true;root.cambiarEquipo=wrapped}
  // Observe only the legacy status fields, not the entire document. No polling / network calls.
  ['cloud-label','vc52-peer-count','team-active-name','dash-library','dash-week-count','dash-history-count','dash-current-count','dash-current-time'].forEach(id=>{
   const el=$(id);if(el&&typeof root.MutationObserver==='function')new root.MutationObserver(()=>{const q=root.VC175_UI_SCHEDULER;q?q.schedule("vc17-status",updateAll):updateAll()}).observe(el,{childList:true,subtree:true,characterData:true});
  });
  activate(activeView);updateAll();
  // Live presence changes without DOM updates when away from Match Mode. This
  // timer reads the existing diagnostic API; it does not connect or sync.
  root.setInterval?.(()=>{if(doc.visibilityState==='visible')updateAll()},3500);
  root.VC17_WORKSPACE={version:'19.1.3',route,resolveRoute,refresh:updateAll,diagnostics:()=>({activeView,activeGroup:resolveRoute(activeView).group,links:doc.querySelectorAll('[data-vc17-link]').length,navGroups:doc.querySelectorAll('[data-vc17-group]').length,classicSyncUnchanged:true,dataModelChanged:false})};
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
}
return {get GROUPS(){return GROUPS},get VIEW_GROUP(){return VIEW_GROUP},useNavigationModel,resolveRoute,navTitle,cloudSummary,statusFromDOM,presenceCount,escapeHTML,mount};
});

/* VC20716_SOURCE_END:143-vc1700-professional-workspace.js */

;
/* VC20716_SOURCE_BEGIN:144-vc1703-functional-audit.js */
/* Volley Coach V17.0.3 · Functional Integrity Review.
 * User-triggered, read-only diagnostic. No save(), no Supabase RPC, no cache clearing.
 * It measures structure and local UI, NOT correctness of live network synchronization,
 * true camera performance, or real PDF downloads.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document && !root.VC1703_AUDIT) {
    root.VC1703_AUDIT = api;
    api.mount(root);
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const VERSION = '17.0.3';
  const arr = x => Array.isArray(x) ? x : [];
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const knownId = x => (typeof x === 'number' || typeof x === 'string') && String(x).trim() !== '';
  const isDate = x => !x || /^\d{4}-\d{2}-\d{2}$/.test(String(x));
  const maxIssues = 120;

  function auditSnapshot(state, coreAudit) {
    const counts = { teams: 0, exercises: 0, planned: 0, history: 0, draftExercises: 0,
      matches: 0, rallies: 0, actions: 0, liveActions: 0 };
    const issues = [];
    let errors = 0, warnings = 0;
    const issue = (level, code, area, detail) => {
      if (level === 'error') errors++; else warnings++;
      if (issues.length < maxIssues) issues.push({ level, code, area, detail });
    };
    if (!object(state) || !object(state.equiposData)) {
      issue('error', 'STATE_MISSING', 'Aplicación', 'No se ha podido leer la estructura de equipos.');
      return { version: VERSION, counts, errors, warnings, issues, truncated: false };
    }
    const library = arr(state.bibliotecaCompartida);
    if (state.bibliotecaCompartida != null && !Array.isArray(state.bibliotecaCompartida))
      issue('error', 'LIBRARY_INVALID', 'Biblioteca', 'La biblioteca no es una lista.');
    counts.exercises = library.length;
    const libraryIds = new Set();
    library.forEach((e, i) => {
      if (!object(e)) { issue('error', 'EXERCISE_INVALID', 'Biblioteca', `Ejercicio ${i + 1} inválido.`); return; }
      if (knownId(e.id)) {
        const k = String(e.id);
        if (libraryIds.has(k)) issue('error', 'EXERCISE_ID_DUPLICATE', 'Biblioteca', 'Hay ejercicios con el mismo identificador.');
        libraryIds.add(k);
      } else issue('warning', 'EXERCISE_ID_MISSING', 'Biblioteca', 'Hay un ejercicio sin identificador.');
      if (e.tiempo != null && e.tiempo !== '' && (!Number.isFinite(Number(e.tiempo)) || Number(e.tiempo) < 0))
        issue('warning', 'EXERCISE_DURATION_INVALID', 'Biblioteca', 'Un ejercicio tiene duración negativa o no numérica.');
    });
    for (const [teamKey, team] of Object.entries(state.equiposData)) {
      if (!object(team)) { issue('error', 'TEAM_INVALID', 'Equipo', 'Los datos de un equipo no son válidos.'); continue; }
      counts.teams++;
      const label = teamKey === 'infantil' ? 'Infantil' : teamKey === 'cadete' ? 'Cadete' : 'Equipo';
      for (const [field, code] of [['planificacion', 'PLANS_INVALID'], ['historial', 'HISTORY_INVALID'],
        ['sesionActual', 'DRAFT_INVALID']]) {
        if (team[field] != null && !Array.isArray(team[field]))
          issue('error', code, label, `${field} no contiene una lista.`);
      }
      const plans = arr(team.planificacion), history = arr(team.historial), draft = arr(team.sesionActual);
      counts.planned += plans.length;
      counts.history += history.length;
      counts.draftExercises += draft.length;
      const historyIds = new Set();
      history.forEach((h, i) => {
        if (!object(h)) { issue('error', 'HISTORY_ENTRY_INVALID', label, `Registro ${i + 1} del historial inválido.`); return; }
        if (!knownId(h.id)) issue('warning', 'HISTORY_ID_MISSING', label, 'Registro de historial sin ID.');
        else if (historyIds.has(String(h.id))) issue('error', 'HISTORY_ID_DUPLICATE', label, 'Hay registros de historial con el mismo ID.');
        else historyIds.add(String(h.id));
        if (!isDate(h.fecha)) issue('warning', 'HISTORY_DATE_INVALID', label, 'Fecha de historial con formato no esperado.');
      });
      const planIds = new Set();
      plans.forEach((p, i) => {
        if (!object(p)) { issue('error', 'PLAN_ENTRY_INVALID', label, `Planificación ${i + 1} inválida.`); return; }
        if (!knownId(p.id)) issue('warning', 'PLAN_ID_MISSING', label, 'Sesión planificada sin ID.');
        else if (planIds.has(String(p.id))) issue('error', 'PLAN_ID_DUPLICATE', label, 'Dos sesiones planificadas comparten identificador.');
        else planIds.add(String(p.id));
        if (!isDate(p.fecha)) issue('warning', 'PLAN_DATE_INVALID', label, 'Una sesión tiene una fecha con formato no esperado.');
        if (knownId(p.historialId) && !historyIds.has(String(p.historialId)) && p.historialEliminado !== true)
          issue('warning', 'PLAN_HISTORY_UNRESOLVED', label, 'Una sesión apunta a un registro del historial que no está disponible localmente.');
        if (p.ejercicios != null && !Array.isArray(p.ejercicios))
          issue('error', 'PLAN_EXERCISES_INVALID', label, 'El listado de ejercicios de una sesión no es válido.');
        if (p.duracion != null && p.duracion !== '' && (!Number.isFinite(Number(p.duracion)) || Number(p.duracion) < 0))
          issue('warning', 'PLAN_DURATION_INVALID', label, 'Una sesión planificada tiene una duración no válida.');
      });
      draft.forEach(e => {
        const id = object(e) ? e.id : e;
        if (knownId(id) && libraryIds.size && !libraryIds.has(String(id)))
          issue('warning', 'DRAFT_EXERCISE_NOT_IN_LIBRARY', label, 'La sesión actual contiene un ejercicio no encontrado en la biblioteca local.');
      });
      if (team.scoutingMatches != null && !Array.isArray(team.scoutingMatches))
        issue('error', 'MATCHES_INVALID', label, 'El listado de partidos no es una lista.');
      counts.matches += arr(team.scoutingMatches).length;
    }
    // Reuse the existing tested validator; do not create a competing scorer.
    if (typeof coreAudit === 'function') {
      const scout = coreAudit(state);
      counts.rallies = scout?.summary?.rallies || 0;
      counts.actions = scout?.summary?.actions || 0;
      counts.liveActions = scout?.summary?.liveActions || 0;
      errors += scout?.summary?.errors || 0;
      warnings += scout?.summary?.warnings || 0;
      for (const entry of arr(scout?.issues).slice(0, maxIssues - issues.length)) {
        // Never export player names, notes, action codes, or raw state in diagnostics.
        issues.push({ level: entry.level === 'error' ? 'error' : 'warning', code: String(entry.code || 'SCOUT_ISSUE'),
          area: 'Scouting', detail: String(entry.detail || 'Comprobar el partido.').slice(0, 170) });
      }
    }
    return { version: VERSION, counts, errors, warnings, issues, truncated: errors + warnings > issues.length };
  }

  function inspect(win) {
    const doc = win.document;
    const read = () => {
      if (typeof win.estadoLocal !== 'function') throw new Error('No está disponible el estado de la aplicación.');
      return win.estadoLocal();
    };
    const state = read();
    const snapshot = auditSnapshot(state, win.VC_CORE_RELIABILITY_1630?.auditState);
    let jsonRoundTrip = false;
    try {
      const encoded = JSON.stringify(state);
      jsonRoundTrip = encoded.length > 0 && object(JSON.parse(encoded).equiposData);
    } catch (_) { /* JSON export cannot be trusted */ }
    if (!jsonRoundTrip) {
      snapshot.errors++;
      snapshot.issues.push({ level: 'error', code: 'BACKUP_JSON_INVALID', area: 'Copias',
        detail: 'El estado no puede serializarse y recuperarse como JSON.' });
    }
    const ids = new Set(); let duplicateDomIds = 0;
    for (const e of doc.querySelectorAll('[id]')) {
      if (ids.has(e.id)) duplicateDomIds++; else ids.add(e.id);
    }
    const players = doc.querySelectorAll('#v780-player-video').length;
    const activeViews = doc.querySelectorAll('.view.active').length;
    const missingModules = (win.VC_MODULE_LOAD_ERRORS || []).length;
    const syncAvailable = typeof win.VC_V962_CLOUD_EFFICIENT?.sync === 'function';
    const cloud = win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {};
    const deviceCount = String(doc.getElementById('vc52-peer-count')?.textContent || '').trim();
    const checks = [
      { id: 'LOCAL_STATE', ok: true, label: 'Estado de equipos disponible' },
      { id: 'BACKUP_SERIALIZABLE', ok: jsonRoundTrip, label: 'Copia JSON serializable' },
      { id: 'CLASSIC_SYNC_ENGINE', ok: syncAvailable, label: 'Sincronizador clásico cargado' },
      { id: 'MISSING_MODULES', ok: missingModules === 0, label: 'Sin módulos JavaScript fallidos' },
      { id: 'DUPLICATE_DOM_IDS', ok: duplicateDomIds === 0, label: 'Sin IDs de interfaz repetidos' },
      { id: 'SINGLE_VIEW', ok: activeViews === 1, label: 'Una pantalla de trabajo activa' },
      { id: 'VIDEO_PLAYER', ok: players === 1, label: 'Un reproductor principal de vídeo' },
      { id: 'BACKUP_BUTTON', ok: typeof win.VC_CORE_RELIABILITY_1630?.downloadBackup === 'function',
        label: 'Descarga de copia disponible' }
    ];
    return { version: VERSION, generatedAt: new Date().toISOString(), local: snapshot,
      checks, technical: { missingModules, duplicateDomIds, activeViews, players,
        classicSyncAvailable: syncAvailable, cloudConnected: !!cloud.connected, cloudPendingLocal: !!cloud.dirty,
        cloudSyncing: !!cloud.syncing, cloudError: !!cloud.lastSyncError,
        devicesShown: /^\d+$/.test(deviceCount) ? Number(deviceCount) : null },
      limits: ['No prueba comunicación real PC-móvil o confirmación de escritura en Supabase.',
        'No ejecuta grabación, Delay, PDF real ni importación sobre tus datos.',
        'Los recuentos corresponden a la copia local leída en este dispositivo.'] };
  }

  function mount(win) {
    const doc = win.document;
    let last = null;
    function setup() {
      const panel = doc.getElementById('vc60-diagnostics');
      const actions = panel?.querySelector('.vc60-actions');
      if (!panel || !actions || doc.getElementById('vc1703-audit-run')) return false;
      const button = doc.createElement('button');
      button.id = 'vc1703-audit-run'; button.type = 'button'; button.textContent = 'Auditoría funcional V17';
      button.setAttribute('aria-controls', 'vc1703-audit-results');
      const exportBtn = doc.createElement('button');
      exportBtn.id = 'vc1703-audit-export'; exportBtn.type = 'button'; exportBtn.textContent = 'Descargar auditoría JSON';
      exportBtn.hidden = true;
      actions.prepend(exportBtn); actions.prepend(button);
      const results = doc.createElement('div'); results.id = 'vc1703-audit-results'; results.hidden = true;
      results.setAttribute('aria-live', 'polite');
      panel.append(results);
      const css = doc.createElement('style'); css.id = 'vc1703-audit-style';
      css.textContent = `#vc1703-audit-results[hidden],#vc1703-audit-export[hidden]{display:none!important}
#vc1703-audit-results{margin-top:16px;padding:16px;border:1px solid #dbe7f1;border-radius:12px;background:#f7fbff;font:12px/1.6 system-ui,sans-serif;color:#29465f}
#vc1703-audit-results h4{font-size:16px;color:#183a5c;margin:0 0 8px}
#vc1703-audit-results .vc1703-counts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
#vc1703-audit-results .vc1703-counts span{display:grid;gap:2px;min-width:100px;padding:9px;border:1px solid #dbe7f1;background:#fff;border-radius:8px}
#vc1703-audit-results .vc1703-counts b{font-size:17px;color:#12395f}
#vc1703-audit-results .vc1703-list{display:grid;gap:6px;margin:10px 0;max-height:320px;overflow:auto}
#vc1703-audit-results .vc1703-item{padding:8px 10px;background:#fff;border-left:3px solid #d89b43;border-radius:6px}
#vc1703-audit-results .vc1703-item[data-level="error"]{border-color:#c95f5f}
#vc1703-audit-results p{margin:8px 0}`;
      doc.head.append(css);
      function render(report) {
        results.replaceChildren();
        const title = doc.createElement('h4');
        title.textContent = `Auditoría local · ${report.local.errors} errores · ${report.local.warnings} avisos`;
        const info = doc.createElement('p');
        info.textContent = 'Revisión de solo lectura. No guarda, borra, restaura ni sincroniza datos.';
        const nums = doc.createElement('div'); nums.className = 'vc1703-counts';
        for (const [label, value] of [
          ['Equipos', report.local.counts.teams], ['Ejercicios', report.local.counts.exercises],
          ['Planificaciones', report.local.counts.planned], ['Historial', report.local.counts.history],
          ['Partidos', report.local.counts.matches], ['Rallies', report.local.counts.rallies]]) {
          const x = doc.createElement('span');
          const b = doc.createElement('b'); b.textContent = String(value);
          x.textContent = label; x.append(b); nums.append(x);
        }
        const notices = doc.createElement('div'); notices.className = 'vc1703-list';
        const failures = report.checks.filter(x => !x.ok).map(x => ({ level: 'warning', detail: x.label, code: x.id }));
        const all = [...report.local.issues, ...failures];
        if (!all.length) notices.textContent = 'No se han encontrado incoherencias estructurales en esta muestra.';
        else for (const issue of all.slice(0, 50)) {
          const item = doc.createElement('div'); item.className = 'vc1703-item'; item.dataset.level = issue.level;
          item.textContent = `${issue.code} · ${issue.area || 'Interfaz'} · ${issue.detail || ''}`;
          notices.append(item);
        }
        const note = doc.createElement('p');
        note.textContent = 'Pendiente de validar: PDF real, vídeo y sincronización entre dispositivos. El contador de presencia no confirma que los datos estén al día.';
        results.append(title, info, nums, notices, note); results.hidden = false;
      }
      button.addEventListener('click', () => {
        try { last = inspect(win); render(last); exportBtn.hidden = false; }
        catch (e) { last = null; exportBtn.hidden = true; results.hidden = false; results.textContent = `No se ha podido completar la auditoría: ${String(e?.message || e)}`; }
      });
      exportBtn.addEventListener('click', () => {
        if (!last) return;
        const blob = new Blob([JSON.stringify(last, null, 2)], { type: 'application/json;charset=utf-8' });
        const uri = win.URL.createObjectURL(blob);
        const a = doc.createElement('a'); a.href = uri; a.download = `volley-coach-auditoria-v17.0.3.json`;
        doc.body.append(a); a.click(); a.remove();
        win.setTimeout(() => win.URL.revokeObjectURL(uri), 15000);
      });
      return true;
    }
    function open() {
      if (!setup() && !doc.getElementById('vc1703-audit-run')) return;
      if (typeof win.VC_PERFORMANCE_CORE?.open === 'function') win.VC_PERFORMANCE_CORE.open();
      doc.getElementById('vc1703-audit-run')?.click();
    }
    // Expose an explicit user action, never run automatically at startup.
    apiOpen = open;
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', setup, { once: true });
    else setup();
  }
  let apiOpen = () => {};
  return Object.freeze({ version: VERSION, auditSnapshot, inspect, mount, open: (...args) => apiOpen(...args) });
});

/* VC20716_SOURCE_END:144-vc1703-functional-audit.js */

;
/* VC20716_SOURCE_BEGIN:145-vc1710-training-workspace.js */
/* Volley Coach V17.1.0 · Training Workspace.
 * Presentation-only adapter for existing training/planning/history views.
 * The training data model, saving, scouting and classic Supabase sync are untouched.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';
const VERSION='17.1.0';
const AREAS=[
 {id:'plan',title:'Planificar',description:'Calendario y biblioteca',primary:'planificacion',views:['planificacion','ejercicios'],links:[['planificacion','Calendario'],['ejercicios','Biblioteca de ejercicios']]},
 {id:'direct',title:'Preparar',description:'Sesión, ejercicios y vídeos',primary:'entrenamiento',views:['entrenamiento'],links:[['entrenamiento','Editor de sesión']]},
 {id:'review',title:'Evaluar',description:'Historial y seguimiento',primary:'historial',views:['historial','estadisticas'],links:[['historial','Historial'],['estadisticas','Seguimiento']]}
];
const ALL_VIEWS=AREAS.flatMap(a=>a.views);
const modeForView=view=>AREAS.find(a=>a.views.includes(view))||null;
const cleanText=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
const safeText=value=>cleanText(value).slice(0,140);
function sessionSummaryFromDOM(doc){
 const get=id=>doc.getElementById(id);
 const date=cleanText(get('sesion-fecha')?.value);
 const minutes=safeText(get('tiempo-total')?.textContent)||'—';
 const exercises=safeText(get('num-ejercicios')?.textContent)||'—';
 const objective=safeText(get('sesion-objetivo')?.value)||'Objetivo sin definir';
 const team=safeText(get('team-active-name')?.textContent||get('v11-team-name')?.textContent)||'Equipo activo';
 return{date: /^\d{4}-\d\d-\d\d$/.test(date)?date:'—',minutes,exercises,objective,team};
}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const STYLE=`
body.vc1710-shell #v11-sidebar [data-vc17-view="ejercicios"],body.vc1710-shell #v11-sidebar [data-vc17-view="estadisticas"]{display:none!important}
body.vc1710-shell .vc1710-workspace{font:inherit;color:#17354e;border:1px solid #dbe7f2;background:#fff;border-radius:17px;box-shadow:0 7px 26px rgba(16,51,90,.065);overflow:hidden;margin:2px 0 19px;max-width:100%}
body.vc1710-shell .vc1710-head{background:linear-gradient(113deg,#0d2442,#133c67);padding:20px 23px 17px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#fff}
body.vc1710-shell .vc1710-kicker{display:block;font:800 10px/1.3 system-ui,sans-serif;letter-spacing:.09em;color:#b5d7f4;margin-bottom:6px}
body.vc1710-shell .vc1710-head h2{font:750 23px/1.15 system-ui,sans-serif!important;letter-spacing:-.02em;color:#fff!important;margin:0!important}
body.vc1710-shell .vc1710-head p{font:400 11px/1.5 system-ui,sans-serif;color:#c5d9ee;margin:7px 0 0;max-width:700px}
body.vc1710-shell .vc1710-team{font:750 11px/1.3 system-ui,sans-serif;background:rgba(255,255,255,.11);color:#fff;padding:10px 13px;border:1px solid rgba(255,255,255,.25);border-radius:9px;flex:0 1 auto;max-width:230px;text-align:right;overflow-wrap:anywhere}
body.vc1710-shell .vc1710-modes{padding:11px 13px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;background:#f5f8fc;border-bottom:1px solid #dfe9f2}
body.vc1710-shell .vc1710-mode{display:flex!important;gap:11px;align-items:center;justify-content:flex-start;text-align:left;min-height:62px;padding:11px 12px!important;background:#fff!important;border:1px solid #dbe6f0!important;border-radius:11px!important;color:#254665!important;box-shadow:none!important;letter-spacing:normal!important;font-family:system-ui,sans-serif!important;white-space:normal}
body.vc1710-shell .vc1710-mode-number{font-size:13px;font-weight:850;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#eef4fc;color:#2362aa;flex:none}
body.vc1710-shell .vc1710-mode b{display:block;font-size:13px;line-height:1.25;color:inherit}
body.vc1710-shell .vc1710-mode small{display:block;color:#6d8297;font-size:10px;line-height:1.3;margin-top:3px}
body.vc1710-shell .vc1710-mode[aria-current="step"]{background:#e6f1ff!important;border-color:#6da7eb!important;color:#113e75!important;box-shadow:inset 0 0 0 1px #a9c8ef!important}
body.vc1710-shell .vc1710-mode[aria-current="step"] .vc1710-mode-number{color:white;background:#1c66c2}
body.vc1710-shell .vc1710-subnav{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:9px 17px;border-bottom:1px solid #edf1f5;min-height:54px}
body.vc1710-shell .vc1710-subnav-label{font-size:10px;color:#7891a4;font-weight:800;margin-right:5px}
body.vc1710-shell .vc1710-subnav button{width:auto;min-height:35px!important;padding:7px 12px!important;border-radius:8px!important;background:transparent!important;border:1px solid transparent!important;box-shadow:none!important;color:#486b86!important;font:700 11px/1.3 system-ui,sans-serif!important}
body.vc1710-shell .vc1710-subnav button[aria-current="page"]{background:#153c67!important;color:#fff!important;border-color:#153c67!important}
body.vc1710-shell .vc1710-session-strip{display:grid;grid-template-columns:1.05fr .7fr .7fr 2fr;gap:12px;padding:12px 19px;background:#fff}
body.vc1710-shell .vc1710-session-strip>div{min-width:0;border-right:1px solid #e4edf4;padding-right:9px}
body.vc1710-shell .vc1710-session-strip>div:last-child{border:0}
body.vc1710-shell .vc1710-session-strip small{display:block;color:#7a91a5;font:750 9px/1.3 system-ui,sans-serif;letter-spacing:.03em;margin-bottom:3px}
body.vc1710-shell .vc1710-session-strip strong{display:block;color:#173e65;font:750 12px/1.4 system-ui,sans-serif;overflow-wrap:anywhere}
body.vc1710-shell .vc1710-session-strip strong[data-vc1710-objective]{font-size:11px;font-weight:600}
body.vc1710-shell .vc1710-notice{padding:8px 18px;background:#f9fbfd;color:#72889a;font:400 10px/1.4 system-ui,sans-serif;border-top:1px solid #eaf0f6}
body.vc1710-shell .vc1710-mode:focus-visible,body.vc1710-shell .vc1710-subnav button:focus-visible{outline:3px solid #70afe9;outline-offset:2px}
@media(max-width:900px){body.vc1710-shell .vc1710-head{padding:16px}body.vc1710-shell .vc1710-team{max-width:170px}body.vc1710-shell .vc1710-session-strip{grid-template-columns:repeat(2,minmax(0,1fr))}body.vc1710-shell .vc1710-session-strip>div:nth-child(2){border:0}}
@media(max-width:620px){body.vc1710-shell .vc1710-head{align-items:flex-start;flex-direction:column;gap:9px}body.vc1710-shell .vc1710-head h2{font-size:20px!important}body.vc1710-shell .vc1710-team{max-width:100%;text-align:left;padding:7px 9px}body.vc1710-shell .vc1710-modes{gap:5px;padding:7px}body.vc1710-shell .vc1710-mode{flex-direction:column;gap:5px;align-items:center;justify-content:center;text-align:center;padding:9px 4px!important;min-height:91px}body.vc1710-shell .vc1710-mode b{font-size:12px}body.vc1710-shell .vc1710-mode small{font-size:9px}body.vc1710-shell .vc1710-subnav{padding:8px 9px}body.vc1710-shell .vc1710-session-strip{padding:12px;gap:10px}body.vc1710-shell .vc1710-session-strip strong{font-size:11px}body.vc1710-shell .vc1710-notice{padding:8px 12px}}
`;
function markup(){return `<div class="vc1710-head"><div><span class="vc1710-kicker">TRAINING WORKSPACE · V${VERSION}</span><h2>Entrenamientos</h2><p>Un único espacio para preparar, utilizar y revisar las sesiones. Conserva el guardado y las herramientas originales.</p></div><div class="vc1710-team" data-vc1710-team>Equipo activo</div></div>
<div class="vc1710-modes" role="group" aria-label="Modos de entrenamiento">${AREAS.map((a,i)=>`<button type="button" class="vc1710-mode" data-vc1710-mode="${a.id}"><span class="vc1710-mode-number">0${i+1}</span><span><b>${a.title}</b><small>${a.description}</small></span></button>`).join('')}</div>
<div class="vc1710-subnav" data-vc1710-subnav aria-label="Herramientas del modo"></div>
<div class="vc1710-session-strip" aria-label="Resumen de la sesión actual"><div><small>FECHA DE LA SESIÓN</small><strong data-vc1710-date>—</strong></div><div><small>MINUTOS DE EJERCICIOS</small><strong data-vc1710-minutes>—</strong></div><div><small>EJERCICIOS</small><strong data-vc1710-exercises>—</strong></div><div><small>OBJETIVO</small><strong data-vc1710-objective>—</strong></div></div>
<div class="vc1710-notice">Resumen del borrador de sesión de este dispositivo. No confirma la subida a la nube. Cambia de modo sin duplicar ni guardar datos automáticamente.</div>`;}
function mount(root){
 const doc=root.document;if(!doc||doc.getElementById('vc1710-workspace'))return;
 const start=()=>{
  if(doc.getElementById('vc1710-workspace'))return;
  if(!ALL_VIEWS.every(id=>doc.getElementById(id)))return;
  const style=doc.createElement('style');style.id='vc1710-training-css';style.textContent=STYLE;doc.head.appendChild(style);
  const shell=doc.createElement('section');shell.id='vc1710-workspace';shell.className='vc1710-workspace';shell.setAttribute('aria-label','Centro de entrenamientos');shell.innerHTML=markup();
  const $=(id)=>doc.getElementById(id);
  function activeView(){return ALL_VIEWS.find(id=>$(id)?.classList.contains('active'))||null;}
  function route(view){if(!ALL_VIEWS.includes(view))return false;
    try{root.openWorkspace?.('training');}catch(_){}
    try{if(typeof root.showView==='function')root.showView(view,root.botonVista?.(view)||null);else return false;}
    catch(_){return false;}
    sync();return true;
  }
  function sync(){const view=activeView();if(!view){shell.remove();return;}
    const host=$(view);if(shell.parentElement!==host)host.insertBefore(shell,host.firstChild);
    const mode=modeForView(view);
    shell.querySelectorAll('[data-vc1710-mode]').forEach(btn=>{
      if(btn.dataset.vc1710Mode===mode.id)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');
    });
    const nav=shell.querySelector('[data-vc1710-subnav]');
    nav.innerHTML=`<span class="vc1710-subnav-label">${mode.title}</span>${mode.links.map(([target,label])=>`<button type="button" data-vc1710-view="${target}" ${view===target?'aria-current="page"':''}>${escapeHtml(label)}</button>`).join('')}`;
    const summary=sessionSummaryFromDOM(doc);
    for(const [id,value] of Object.entries({team:summary.team,date:summary.date,minutes:summary.minutes,exercises:summary.exercises,objective:summary.objective})){
      const node=shell.querySelector(`[data-vc1710-${id}]`);if(node&&node.textContent!==value)node.textContent=value;
    }
  }
  shell.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||!shell.contains(button))return;
    const mode=button.dataset.vc1710Mode,view=button.dataset.vc1710View;
    if(mode){const a=AREAS.find(x=>x.id===mode);if(a)route(a.primary);}
    else if(view)route(view);
  });
  doc.body.classList.add('vc1710-shell');
  const observer=new root.MutationObserver(()=>{const q=root.VC175_UI_SCHEDULER;q?q.schedule("vc17-training",sync):sync()});
  for(const id of ALL_VIEWS)observer.observe($(id),{attributes:true,attributeFilter:['class']});
  // Read-only listeners: never call the existing guardarSesionMeta/save/sync methods.
  ['sesion-fecha','sesion-objetivo','sesion-jugadores','sesion-duracion-objetivo'].forEach(id=>{
    const input=$(id);if(input){input.addEventListener('input',sync);input.addEventListener('change',sync);}
  });
  ['tiempo-total','num-ejercicios','team-active-name','v11-team-name'].forEach(id=>{const n=$(id);if(n)observer.observe(n,{childList:true,characterData:true,subtree:true});});
  sync();
  root.VC171_TRAINING={version:VERSION,modeForView,sessionSummary:()=>sessionSummaryFromDOM(doc),navigate:route,refresh:sync,readonly:true};
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return {VERSION,AREAS,ALL_VIEWS,modeForView,sessionSummaryFromDOM,escapeHtml,markup,mount};
});

/* VC20716_SOURCE_END:145-vc1710-training-workspace.js */

;
/* VC20716_SOURCE_BEGIN:146-vc1720-match-workspace.js */
/* Volley Coach V17.2.0 · Match Workspace.
 * Non-mutating navigation/context layer. It never writes a match, a rally, a
 * score, a training session, media, localStorage or cloud state.
 * The existing match-mode and bench remain the ONLY operational controls.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.2.0';
 const MODES=[
  {id:'prepare',title:'Preparar',subtitle:'Agenda y estrategia',primary:'scout-dashboard',views:['scout-dashboard','competicion','scout-plan','scout-matchup'],links:[['scout-dashboard','Centro de partidos'],['competicion','Calendario'],['scout-plan','Plan de partido'],['scout-matchup','Match-up']]},
  {id:'live',title:'En directo',subtitle:'Registro y codificación',primary:'scout-match-mode',views:['scout-match-mode'],links:[['scout-match-mode','Scouting en directo']]},
  {id:'bench',title:'Banquillo',subtitle:'Lectura en tiempo real',primary:'vc155-bench',views:['vc155-bench'],links:[['vc155-bench','Banquillo Pro']]}
 ];
 const MATCH_VIEWS=MODES.flatMap(m=>m.views);
 const modeForView=view=>MODES.find(mode=>mode.views.includes(view))||null;
 const asArray=value=>Array.isArray(value)?value:[];
 const normal=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
 const safe=value=>normal(value).slice(0,160);
 const escapeHTML=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const currentSetFor=m=>asArray(m?.sets).find(s=>Number(s.number)===Number(m?.currentSet))||asArray(m?.sets).at(-1)||null;
 function readMatchContext(bridge,view,selectedId){
  const matches=asArray(bridge?.getMatches?.());
  const activeId=bridge?.getActiveId?.();
  const explicitId=(view==='vc155-bench'||view==='scout-match-mode')?selectedId:null;
  const selected=explicitId!=null&&String(explicitId)!==''?matches.find(m=>String(m.id)===String(explicitId)):null;
  const active=matches.find(m=>String(m.id)===String(activeId))||bridge?.getActive?.()||null;
  // Never silently call activateMatch, save, or overwrite bench's separate selection.
  const match=selected||active||null;
  const set=currentSetFor(match);
  const closed=asArray(set?.rallies).filter(r=>r?.winner==='ours'||r?.winner==='opponent').length;
  const finished=match?.status==='finished';
  return {
   id:match?.id??null,opponent:safe(match?.opponent)||'Sin partido seleccionado',
   team:safe(bridge?.teamName?.())||'Equipo activo',date:safe(match?.date)||'—',
   status:match?(finished?'Finalizado':'En curso'):'Sin scouting',
   set:match?(Number(set?.number)||Number(match.currentSet)||1):null,
   rotation:match?(Number(match.rotationNo)||null):null,
   rallies:match?closed:null,
   selectedDifferent:!!(match&&active&&String(match.id)!==String(active.id)),
   localLabel:'Datos visibles en este dispositivo',
   matchCount:matches.length,
   isFinished:!!finished
  };
 }
 const CSS=`
/* V19.1.1: el contexto global permanece visible en Partidos. */
/* Se mantienen accesibles las rutas de calendario, preparación y codificación. */
body.vc1720-shell .vc1720-workspace{min-width:0;max-width:100%;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#183950;background:#fff;border:1px solid #d8e5ef;border-radius:17px;box-shadow:0 7px 23px #0a28450c;overflow:hidden;margin:2px 0 18px}
body.vc1720-shell .vc1720-head{background:linear-gradient(115deg,#0e294a,#17446f);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;padding:18px 22px;color:#fff}
body.vc1720-shell .vc1720-kicker{display:block;font-size:10px;letter-spacing:.1em;font-weight:800;color:#a7d5ff;margin-bottom:5px}
body.vc1720-shell .vc1720-head h2{margin:0!important;color:#fff!important;font:800 22px/1.2 system-ui,sans-serif!important;letter-spacing:-.025em}
body.vc1720-shell .vc1720-head p{font-size:11px;line-height:1.5;color:#ccdef1;margin:6px 0 0}
body.vc1720-shell .vc1720-head-right{display:flex;align-items:center;gap:10px;min-width:0}
body.vc1720-shell .vc1720-status{font-size:10px;font-weight:800;letter-spacing:.01em;padding:8px 11px;border:1px solid #ffffff45;border-radius:10px;background:#ffffff16;color:#fff;white-space:nowrap}
body.vc1720-shell .vc1720-status[data-finished="true"]{background:#66778b38;color:#d9e6ef}
body.vc1720-shell .vc1720-context{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:13px 19px;background:#f6f9fd;border-bottom:1px solid #e0e9f2}
body.vc1720-shell .vc1720-match-label{min-width:0;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
body.vc1720-shell .vc1720-match-label small{font-size:10px;font-weight:850;color:#7491a9}
body.vc1720-shell .vc1720-match-label strong{font-size:15px;font-weight:850;color:#123c63;max-width:290px;overflow-wrap:anywhere}
body.vc1720-shell .vc1720-match-label em{font-size:10px;font-style:normal;color:#5d7b94}
body.vc1720-shell .vc1720-facts{display:flex;gap:7px;flex-wrap:wrap}
body.vc1720-shell .vc1720-fact{font-size:11px;color:#335a78;background:#fff;border:1px solid #dce6f0;border-radius:8px;padding:6px 9px;white-space:nowrap}
body.vc1720-shell .vc1720-fact b{font-weight:850;color:#144b7c}
body.vc1720-shell .vc1720-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:11px 13px;border-bottom:1px solid #e5edf3}
body.vc1720-shell button.vc1720-mode{display:flex!important;align-items:center;text-align:left;gap:10px;min-width:0;min-height:61px;border:1px solid #dce7f1!important;border-radius:11px!important;background:#fff!important;color:#315873!important;padding:10px 12px!important;box-shadow:none!important;font:inherit!important;letter-spacing:normal!important;white-space:normal}
body.vc1720-shell .vc1720-num{display:grid;place-items:center;width:31px;height:31px;flex:none;border-radius:9px;background:#edf4fb;color:#2168a8;font-weight:850;font-size:13px}
body.vc1720-shell .vc1720-mode b{display:block;color:inherit;font-size:13px;font-weight:850;line-height:1.3}
body.vc1720-shell .vc1720-mode small{display:block;color:#7890a3;font-size:10px;line-height:1.3;margin-top:2px}
body.vc1720-shell button.vc1720-mode[aria-current="step"]{background:#e7f2ff!important;border-color:#80b6e7!important;color:#114a8a!important;box-shadow:inset 0 0 0 1px #b1d4f0!important}
body.vc1720-shell button.vc1720-mode[aria-current="step"] .vc1720-num{background:#1667ba;color:#fff}
body.vc1720-shell .vc1720-tools{padding:9px 17px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-height:50px}
body.vc1720-shell .vc1720-tools-label{font-size:10px;font-weight:850;color:#7b96a7;margin-right:6px}
body.vc1720-shell .vc1720-tools button,body.vc1720-shell .vc1720-related button{width:auto!important;min-height:34px!important;padding:7px 11px!important;background:transparent!important;border:1px solid transparent!important;border-radius:8px!important;box-shadow:none!important;color:#3c6685!important;font:700 11px/1.3 system-ui,sans-serif!important}
body.vc1720-shell .vc1720-tools button[aria-current="page"]{background:#184b7c!important;color:#fff!important;border-color:#184b7c!important}
body.vc1720-shell .vc1720-related{padding:8px 17px;border-top:1px solid #edf2f6;background:#fcfdff;display:flex;gap:9px;align-items:center;flex-wrap:wrap}
body.vc1720-shell .vc1720-related span{color:#8193a6;font-size:10px;font-weight:700;margin-right:3px}
body.vc1720-shell .vc1720-related button{color:#235b91!important;border-color:#dce9f3!important;background:#fff!important}
body.vc1720-shell .vc1720-note{padding:8px 17px;background:#f6f9fd;color:#688198;font-size:10px;line-height:1.4;border-top:1px solid #e8eef4}
body.vc1720-shell .vc1720-tools button:focus-visible,body.vc1720-shell button.vc1720-mode:focus-visible{outline:3px solid #62a8f1!important;outline-offset:2px}
@media(max-width:840px){body.vc1720-shell .vc1720-head{padding:15px 16px}body.vc1720-shell .vc1720-context{padding:10px 13px}body.vc1720-shell .vc1720-tools{padding:8px 12px}}
@media(max-width:580px){body.vc1720-shell .vc1720-head{grid-template-columns:1fr;gap:10px}body.vc1720-shell .vc1720-head h2{font-size:19px!important}body.vc1720-shell .vc1720-status{padding:5px 8px}body.vc1720-shell .vc1720-modes{gap:5px;padding:6px}body.vc1720-shell button.vc1720-mode{min-height:84px;flex-direction:column;justify-content:center;text-align:center;padding:8px 3px!important;gap:6px}body.vc1720-shell .vc1720-mode small{font-size:9px}body.vc1720-shell .vc1720-mode b{font-size:11.5px}body.vc1720-shell .vc1720-fact{font-size:10px;padding:5px 7px}body.vc1720-shell .vc1720-tools{gap:3px}body.vc1720-shell .vc1720-tools button{font-size:10px!important;padding:7px 8px!important}body.vc1720-shell .vc1720-related{padding:7px 12px}}
 `;
 function markup(){return `<div class="vc1720-head"><div><span class="vc1720-kicker">MATCH WORKSPACE · V${VERSION}</span><h2>Centro de partidos</h2><p>Un único partido de referencia. Prepara, registra y consulta desde los controles que ya conoces.</p></div><div class="vc1720-head-right"><span class="vc1720-status" data-vc1720-status>Sin scouting</span></div></div>
<div class="vc1720-context" aria-label="Contexto del partido"><div class="vc1720-match-label"><small>PARTIDO</small><strong data-vc1720-opponent>Sin partido seleccionado</strong><em data-vc1720-date>—</em></div><div class="vc1720-facts"><span class="vc1720-fact"><b data-vc1720-set>—</b> · Set</span><span class="vc1720-fact"><b data-vc1720-rotation>—</b> · Rotación</span><span class="vc1720-fact"><b data-vc1720-rallies>—</b> · Rallies del set</span></div></div>
<nav class="vc1720-modes" aria-label="Flujo del partido">${MODES.map((m,i)=>`<button class="vc1720-mode" type="button" data-vc1720-mode="${m.id}"><span class="vc1720-num">0${i+1}</span><span><b>${m.title}</b><small>${m.subtitle}</small></span></button>`).join('')}</nav>
<div class="vc1720-tools" data-vc1720-tools aria-label="Herramientas del modo"></div>
<div class="vc1720-related"><span>REVISIÓN</span><button type="button" data-vc1720-related="scout-analysis">Análisis y estadísticas</button><button type="button" data-vc1720-related="scout-video-hub">Vídeo y clips</button></div>
<div class="vc1720-note" data-vc1720-note>Los datos se leen en este dispositivo. Los dispositivos presentes no equivalen a una sincronización confirmada.</div>`;}
 function createCompactController(shell){
  // Keep nodes (and listeners) in memory so other match views can reuse them.
  // The live editor already has one canonical workspace and the global menu.
  const order=Array.from(shell.children);
  const redundant=order.filter(node=>['vc1720-head','vc1720-modes','vc1720-tools','vc1720-related']
   .some(cls=>node.classList?.contains(cls)));
  let compact=false;
  return {
   set(value){
    const requested=!!value;
    if(requested===compact)return;
    compact=requested;
    if(compact){for(const node of redundant)node.remove();}
    else{for(let i=0;i<order.length;i++){
      if(shell.children[i]!==order[i])shell.insertBefore(order[i],shell.children[i]||null);
    }}
   },
   get compact(){return compact}, get detachedCount(){return redundant.filter(el=>el.parentElement!==shell).length}
  };
 }
 function mount(root){
  const doc=root.document;if(!doc||doc.getElementById('vc1720-workspace'))return;
  const start=()=>{
   if(doc.getElementById('vc1720-workspace'))return;
   if(!MATCH_VIEWS.every(id=>doc.getElementById(id)))return;
   const css=doc.createElement('style');css.id='vc1720-match-css';css.textContent=CSS;doc.head.appendChild(css);
   const shell=doc.createElement('section');shell.id='vc1720-workspace';shell.className='vc1720-workspace';shell.setAttribute('aria-label','Match Workspace');shell.innerHTML=markup();
   const compact=createCompactController(shell);
   const $=id=>doc.getElementById(id);
   const view=()=>MATCH_VIEWS.find(id=>$(id)?.classList.contains('active'))||null;
   function navigate(target){
    const unified=root.VC19_UNIFIED_WORKFLOW;
    if(typeof unified?.route==='function'){
     const ok=unified.route(target);if(ok)render();return ok;
    }
    if(!doc.getElementById(target)||typeof root.showView!=='function')return false;
    try{root.showView(target,root.botonVista?.(target)||null);}catch(_){return false}
    render();return true;
   }
   function selectedIdFor(v){const id={"vc155-bench":"vc155-match","scout-match-mode":"vc19-match-picker"}[v];return id?$(id)?.value:null;}
   function render(){const v=view();doc.body.classList.toggle('vc1720-match-active',!!v);if(!v){shell.remove();return;}
    const host=$(v);if(shell.parentElement!==host)host.insertBefore(shell,host.firstChild);
    // Only the live editor has already been consolidated (V19.1.2).
    // Remove redundant controls from the DOM instead of keeping invisible click targets.
    const compactLive=v==='scout-match-mode'&&!!doc.getElementById('vc19-match-picker');
    compact.set(compactLive);
    const mode=modeForView(v);
    if(!compactLive){
     shell.querySelectorAll('[data-vc1720-mode]').forEach(button=>{if(button.dataset.vc1720Mode===mode.id)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current')});
     const links=shell.querySelector('[data-vc1720-tools]');
     const currentLink=links.querySelector('[aria-current="page"]')?.dataset.vc1720View;
     if(links.dataset.mode!==mode.id||currentLink!==v){
      links.dataset.mode=mode.id;
      links.innerHTML=`<span class="vc1720-tools-label">${escapeHTML(mode.title)}</span>${mode.links.map(([id,label])=>`<button type="button" data-vc1720-view="${id}" ${id===v?'aria-current="page"':''}>${escapeHTML(label)}</button>`).join('')}`;
     }
    }
    let info;try{info=readMatchContext(root.VC_SCOUT_VIDEO_BRIDGE,v,selectedIdFor(v));}catch(_){info=readMatchContext(null,v,null)}
    const fields={status:info.status,opponent:info.opponent,date:info.date,set:info.set==null?'—':String(info.set),rotation:info.rotation==null?'—':`R${info.rotation}`,rallies:info.rallies==null?'—':String(info.rallies)};
    for(const [key,val] of Object.entries(fields)){const field=shell.querySelector(`[data-vc1720-${key}]`);if(field&&field.textContent!==val)field.textContent=val;}
    const status=shell.querySelector('[data-vc1720-status]');if(status)status.dataset.finished=String(info.isFinished);
    const note=info.selectedDifferent?'Estás consultando un partido distinto del scouting activo. Cambiar de vista no lo activa ni sobrescribe.':info.isFinished?'Scouting finalizado: consulta sus datos sin abrirlo para edición.':'Datos locales de este dispositivo. La presencia de otros dispositivos no confirma la recepción de cambios.';
    const label=shell.querySelector('[data-vc1720-note]');if(label.textContent!==note)label.textContent=note;
   }
   shell.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||!shell.contains(button))return;
    const targetMode=MODES.find(x=>x.id===button.dataset.vc1720Mode);
    if(targetMode)navigate(targetMode.primary);
    else if(button.dataset.vc1720View)navigate(button.dataset.vc1720View);
    else if(button.dataset.vc1720Related)navigate(button.dataset.vc1720Related);
   });
   doc.body.classList.add('vc1720-shell');
   const observer=new root.MutationObserver(()=>{const q=root.VC175_UI_SCHEDULER;q?q.schedule("vc17-match",render):render()});
   for(const id of MATCH_VIEWS)observer.observe($(id),{attributes:true,attributeFilter:['class']});
   for(const id of ['v800-title','v800-score-us','v800-score-opponent','v800-set-label','vc155-us-score','vc155-opp-score','team-active-name']){const e=$(id);if(e)observer.observe(e,{childList:true,characterData:true,subtree:true});}
   for(const id of ['vc155-match','v800-match-select','v123-match-select'])$(id)?.addEventListener('change',render);
   root.addEventListener('focus',render);
   doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)render()});
   // Poll current match ONLY while a match view is visible: supports remote updates
   // and save state changes without touching the classic sync engine.
   root.setInterval(()=>{if(!doc.hidden&&view())render()},4000);
   render();
   root.VC172_MATCH_WORKSPACE={version:VERSION,modeForView,navigate,refresh:render,
    compactDiagnostics:()=>({liveCompact:compact.compact,detachedNavigationNodes:compact.detachedCount}),
    readCurrent:()=>readMatchContext(root.VC_SCOUT_VIDEO_BRIDGE,view(),selectedIdFor(view())),readonly:true};
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 return {VERSION,MODES,MATCH_VIEWS,modeForView,readMatchContext,escapeHTML,markup,createCompactController,mount};
});

/* VC20716_SOURCE_END:146-vc1720-match-workspace.js */

;
/* VC20716_SOURCE_BEGIN:147-vc1730-analysis-workspace.js */
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
 body.vc1730-shell .vc1730-links button{background:#fff!important;box-shadow:none!important;font:750 11px/1.3 system-ui!important;color:#3a6789!important;padding:8px 11px!important;min-height:35px!important;border:1px solid #e2ebf3!important;border-radius:8px!important}
 body.vc1730-shell .vc1730-links button[aria-current="page"]{background:#174c80!important;color:#fff!important;border-color:#174c80!important}
 body.vc1730-shell .vc1730-bottom{border-top:1px solid #e7edf3;padding:8px 17px;background:#f9fbfd;display:flex;align-items:center;gap:7px;justify-content:space-between;flex-wrap:wrap}
 body.vc1730-shell .vc1730-bottom>span{font-size:10px;color:#6a849a;line-height:1.5}
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
<div class="vc1730-bottom"><span data-vc1730-info>Los filtros de partido se comparten en Partido, Fundamentos y Táctica. Histórico e Informes tienen su selección propia.</span></div>`;}
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
   shell.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!shell.contains(b))return;
    if(b.dataset.vc1730Mode){selectMode(b.dataset.vc1730Mode);return;}
    if(b.dataset.vc1730Page){const page=b.dataset.vc1730Page,sub=b.dataset.vc1730Sub||'';preferredMode=modeForPage(page,sub);selectPage(page,sub);return;}
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

/* VC20716_SOURCE_END:147-vc1730-analysis-workspace.js */
