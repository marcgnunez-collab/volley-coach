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
  const VERSION = '19.1.2';
  const GROUPS = Object.freeze([
    { id: 'home', label: 'Inicio', icon: '⌂', defaultView: 'dashboard', items: [] },
    { id: 'training', label: 'Entrenamientos', icon: '◇', defaultView: 'entrenamiento', items: [
      ['planificacion', 'Planificar'], ['entrenamiento', 'Sesión actual'],
      ['ejercicios', 'Biblioteca'], ['historial', 'Evaluar'], ['estadisticas', 'Seguimiento']
    ] },
    { id: 'matches', label: 'Partidos', icon: '◈', defaultView: 'scout-dashboard', items: [
      ['scout-dashboard', 'Centro de partidos'], ['competicion', 'Calendario'],
      ['scout-plan', 'Preparar'], ['scout-match-mode', 'Scouting en directo'],
      ['vc155-bench', 'Banquillo']
    ] },
    { id: 'video', label: 'Vídeo', icon: '▷', defaultView: 'scout-video-hub', items: [
      ['scout-video-hub', 'Video Studio']
    ] },
    { id: 'analysis', label: 'Análisis', icon: '▥', defaultView: 'scout-analysis', items: [
      ['scout-analysis', 'Análisis Pro'], ['v11-reports', 'Informes'],
      ['scout-season', 'Temporada'], ['scout-matchup', 'Rivales']
    ] },
    { id: 'team', label: 'Equipo', icon: '◎', defaultView: 'jugadores', items: [
      ['jugadores', 'Plantilla']
    ] },
    { id: 'settings', label: 'Configuración', icon: '⚙', defaultView: 'v11-management', items: [
      ['v11-management', 'Gestión y ajustes'], ['scout-safe', 'Copias y recuperación']
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
    return { version: VERSION, sevenAreas: GROUPS.map(g => g.label), viewCount: views.length,
      routedCount: routed.length, missingRoutes: missing, duplicatedRoutes: duplicated,
      legacyViewsRetained: hiddenLegacy, noBusinessDataChanges: true };
  }
  function attachAudit(doc) {
    const host = doc.getElementById('v11-management');
    if (!host || doc.getElementById('vc19-workspace-audit')) return false;
    const section = doc.createElement('section');
    section.id = 'vc19-workspace-audit';
    const heading = doc.createElement('h3');
    heading.textContent = 'V19 · Espacio de trabajo';
    const intro = doc.createElement('p');
    intro.textContent = 'Siete áreas, una sola navegación. Esta comprobación no modifica datos ni sincronización.';
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
      route: (view, area) => root.VC17_WORKSPACE?.route(view, area) || false,
      diagnostics: () => ({ ...inspect(doc), active: activeContext(doc, root),
        singleSidebar: doc.querySelectorAll('.vc17-primary-nav').length === 1,
        obsoleteStepperRemoved: !doc.getElementById('vc19-workflow'),
        connectedDevicesPreserved: !!doc.getElementById('vc1741-devices-button') })
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => attachAudit(doc), { once: true });
    else attachAudit(doc);
    return true;
  }
  return { VERSION, GROUPS, VIEW_GROUP, VIEW_TO_AREA, WORKFLOWS, nextStep, activeContext, canonicalMatchRoute, inspect, mount };
});
