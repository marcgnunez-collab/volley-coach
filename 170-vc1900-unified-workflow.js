/* Volley Coach V19.0.0 — Navegación por flujos, sobre los módulos existentes.
 * Presentación y enrutamiento. No sustituye ni modifica los modelos de
 * entrenamiento, scouting, vídeo, análisis, equipos, nube o guardado.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '19.0.0';
  const WORKFLOWS = Object.freeze({
    training: {
      label: 'Entrenamientos',
      description: 'De la planificación al seguimiento',
      steps: [
        ['planificacion', 'Planificar'],
        ['entrenamiento', 'Preparar sesión'],
        ['ejercicios', 'Biblioteca'],
        ['scout-video-hub', 'Vídeo'],
        ['historial', 'Evaluar'],
        ['estadisticas', 'Seguimiento']
      ]
    },
    matches: {
      label: 'Partidos',
      description: 'Preparación, directo y revisión',
      steps: [
        ['scout-dashboard', 'Centro de partidos'],
        ['scout-plan', 'Preparar'],
        ['scout-match-mode', 'En directo'],
        ['scout-video-hub', 'Vídeo'],
        ['competicion', 'Calendario']
      ]
    },
    analysis: {
      label: 'Análisis',
      description: 'Datos, informes y comparativas',
      steps: [
        ['scout-analysis', 'Análisis Pro'],
        ['v11-reports', 'Informes'],
        ['scout-season', 'Temporada'],
        ['scout-matchup', 'Rivales']
      ]
    },
    team: {
      label: 'Equipo y gestión',
      description: 'Plantilla y datos',
      steps: [
        ['jugadores', 'Plantilla'],
        ['v11-management', 'Gestión'],
        ['scout-safe', 'Copias y recuperación']
      ]
    }
  });
  const VIEW_TO_AREA = Object.freeze(Object.fromEntries(Object.entries(WORKFLOWS)
    .flatMap(([area, config]) => config.steps.map(([view]) => [view, area]))));

  function activeContext(doc, root) {
    const view = doc.querySelector('.view.active')?.id || 'dashboard';
    // Un único centro de vídeo, pero conservando el origen real de la sesión.
    if (view === 'scout-video-hub') {
      return { view, area: root.VC17_VIDEO_CONTEXT?.kind === 'training' ? 'training' : 'matches' };
    }
    const selected = doc.querySelector('[data-vc17-group].active')?.dataset.vc17Group;
    const area = VIEW_TO_AREA[view] || (selected in WORKFLOWS ? selected : null);
    return { view, area };
  }
  function nextStep(area, view) {
    const steps = WORKFLOWS[area]?.steps || [];
    const index = steps.findIndex(([id]) => id === view);
    return index < 0 || index === steps.length - 1 ? null : steps[index + 1];
  }
  function mount(root) {
    const doc = root.document;
    if (!doc) return false;
    function begin() {
      if (root.VC19_UNIFIED_WORKFLOW) return true;
      const main = doc.getElementById('v11-main');
      const context = doc.getElementById('vc17-context');
      if (!main || !context || !root.VC17_WORKSPACE?.route) return false;
      const bar = doc.createElement('nav');
      bar.id = 'vc19-workflow';
      bar.className = 'vc19-workflow';
      bar.setAttribute('aria-label', 'Pasos del área de trabajo');
      bar.hidden = true;
      context.insertAdjacentElement('afterend', bar);
      doc.body.classList.add('vc19-workspace');
      const brand = doc.querySelector('.vc17-brand span');
      if (brand) brand.textContent = 'V19 · WORKSPACE PROFESIONAL';
      let active = { view: '', area: '' };
      let updates = 0;
      let pending = false;
      function refresh() {
        pending = false;
        const state = activeContext(doc, root);
        if (state.area === active.area && state.view === active.view && bar.childElementCount) return true;
        active = state;
        const config = WORKFLOWS[state.area];
        bar.replaceChildren();
        if (!config) {
          bar.hidden = true;
          doc.body.classList.remove('vc19-flow-active');
          return false;
        }
        updates++;
        bar.hidden = false;
        doc.body.classList.add('vc19-flow-active');
        const head = doc.createElement('div');
        head.className = 'vc19-flow-title';
        const title = doc.createElement('strong');
        title.textContent = config.label;
        const sub = doc.createElement('span');
        sub.textContent = config.description;
        head.append(title, sub);
        const steps = doc.createElement('div');
        steps.className = 'vc19-flow-steps';
        steps.setAttribute('role', 'group');
        steps.setAttribute('aria-label', 'Ir a sección');
        let activeIndex = -1;
        config.steps.forEach(([view, label], index) => {
          const el = doc.createElement('button');
          el.type = 'button';
          el.dataset.vc19View = view;
          el.dataset.vc19Area = state.area;
          el.className = 'vc19-flow-step';
          const number = doc.createElement('span');
          number.className = 'vc19-flow-number';
          number.textContent = String(index + 1).padStart(2, '0');
          const text = doc.createElement('span');
          text.textContent = label;
          el.append(number, text);
          if (state.view === view) {
            activeIndex = index;
            el.classList.add('active');
            el.setAttribute('aria-current', 'page');
          }
          steps.append(el);
        });
        const end = doc.createElement('div');
        end.className = 'vc19-flow-end';
        const indexLabel = doc.createElement('small');
        indexLabel.textContent = activeIndex < 0 ? 'Sección del área' : `Paso ${activeIndex + 1} de ${config.steps.length}`;
        end.append(indexLabel);
        const next = nextStep(state.area, state.view);
        if (next) {
          const nextButton = doc.createElement('button');
          nextButton.type = 'button';
          nextButton.dataset.vc19View = next[0];
          nextButton.dataset.vc19Area = state.area;
          nextButton.className = 'vc19-flow-next';
          nextButton.textContent = 'Siguiente: ' + next[1];
          end.append(nextButton);
        }
        bar.append(head, steps, end);
        return true;
      }
      function schedule() {
        if (pending) return;
        pending = true;
        if (typeof root.requestAnimationFrame === 'function') root.requestAnimationFrame(refresh);
        else Promise.resolve().then(refresh);
      }
      bar.addEventListener('click', event => {
        const button = event.target?.closest?.('button[data-vc19-view]');
        if (!button || !bar.contains(button)) return;
        if (!doc.getElementById(button.dataset.vc19View)?.classList.contains('view')) return;
        // The V17 router controls the old page lifecycle. Do not write .active
        // manually or create competing video/scouting instances.
        root.VC17_WORKSPACE.route(button.dataset.vc19View, button.dataset.vc19Area);
        schedule();
      });
      const observer = typeof root.MutationObserver === 'function' ? new root.MutationObserver(schedule) : null;
      for (const id of ['vc17-area-kicker', 'vc17-view-label']) {
        const element = doc.getElementById(id);
        if (observer && element) observer.observe(element, { childList: true, characterData: true, subtree: true });
      }
      doc.addEventListener('vc19:navigate', schedule);
      refresh();
      root.VC19_UNIFIED_WORKFLOW = {
        version: VERSION,
        refresh,
        route: (view, area) => root.VC17_WORKSPACE.route(view, area),
        diagnostics: () => ({ version: VERSION, mounted: !!doc.getElementById('vc19-workflow'),
          currentView: active.view, area: active.area, steps: bar.querySelectorAll('.vc19-flow-step').length,
          updates, legacyNavigationPreserved: !!doc.getElementById('v11-sidebar'), dataMigration: false })
      };
      return true;
    }
    let attempts = 0;
    function bootstrap() {
      if (begin()) return;
      if (++attempts < 36 && typeof root.setTimeout === 'function') root.setTimeout(bootstrap, 200);
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    else bootstrap();
    return true;
  }
  return { VERSION, WORKFLOWS, VIEW_TO_AREA, nextStep, activeContext, mount };
});
