/* Volley Coach V16.6.1 · Performance & Stability.
 * On-demand, read-only checks. No scouting writes, LocalStorage writes,
 * Supabase calls or service worker cache deletions. The classic sync engines
 * 083 / 108 / 002 are explicitly outside this module's scope. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document && !root.VC_STABILITY_1661) {
    root.VC_STABILITY_1661 = api;
    api.mount(root);
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  function summarize(input) {
    const d = input || {}, issues = [];
    function check(key, ok, label, detail, level = 'warn') {
      issues.push({ key, label, ok: !!ok, level: ok ? 'ok' : level, detail });
    }
    check('storage', d.storageReady, 'Estado y guardado local disponibles', 'Comprobación de funciones; no se guarda ni modifica nada.');
    check('sync', d.classicSyncAvailable, 'Motor clásico de nube accesible', 'La presencia del motor no confirma subida ni lectura de Supabase.', 'info');
    check('scout', d.scoutingReady, 'Motor de scouting disponible', 'Se comprueba su interfaz, no se modifica un partido.');
    check('video', d.videoPlayers === 1 && d.videoFrames === 1, 'Reproductor de vídeo único', `Vídeos: ${d.videoPlayers || 0} · marcos: ${d.videoFrames || 0}.`, 'info');
    check('duplicate', d.duplicates === 0, 'Sin identificadores HTML duplicados', `${d.duplicates || 0} ID duplicados detectados.`, 'warn');
    check('scripts', d.missingModules === 0, 'Sin errores de carga de módulos detectados', `${d.missingModules || 0} recursos fallidos.`, 'warn');
    check('active', d.activeViews === 1, 'Vista de navegación única', `${d.activeViews || 0} vistas marcadas como activas.`, 'info');
    const warnings = issues.filter(x => !x.ok && x.level === 'warn').length;
    const infos = issues.filter(x => !x.ok && x.level === 'info').length;
    return { version: '16.6.1', warnings, infos, passed: issues.filter(x => x.ok).length, checks: issues };
  }
  function inspect(win) {
    const doc = win.document;
    const ids = new Set(); let duplicates = 0;
    // Invoked only by the user: not an expensive DOM scan on every rally.
    for (const node of doc.querySelectorAll('[id]')) {
      const id = node.id;
      if (ids.has(id)) duplicates++; else ids.add(id);
    }
    const raw = {
      storageReady: typeof win.estadoLocal === 'function' && typeof win.guardarEstadoLocalSinCloud === 'function',
      classicSyncAvailable: typeof win.VC_V962_CLOUD_EFFICIENT?.sync === 'function',
      scoutingReady: typeof win.VC_SCOUT_VIDEO_BRIDGE?.getMatches === 'function',
      videoPlayers: doc.querySelectorAll('#v780-player-video').length,
      videoFrames: doc.querySelectorAll('#v780-video-frame').length,
      duplicates,
      missingModules: (win.VC_MODULE_LOAD_ERRORS || []).length,
      activeViews: doc.querySelectorAll('.view.active').length,
      online: win.navigator?.onLine !== false,
      performance: win.VC_PERFORMANCE_CORE?.diagnostics?.() || null
    };
    return { ...summarize(raw), online: raw.online, performance: {
      domNodes: raw.performance?.ui?.domNodes ?? null,
      longTasks: raw.performance?.longTasks?.count ?? null,
      loadMs: raw.performance?.navigation?.loadMs ?? null,
      workspaceVisibleMs: raw.performance?.navigation?.workspaceVisibleMs ?? null
    } };
  }
  function mount(win) {
    const doc = win.document;
    function setup() {
      const panel = doc.getElementById('vc60-diagnostics');
      if (!panel || doc.getElementById('vc1661-check')) return false;
      const actions = panel.querySelector('.vc60-actions');
      if (!actions) return false;
      const button = doc.createElement('button'); button.id = 'vc1661-check';
      button.type = 'button'; button.textContent = 'Comprobar estabilidad';
      button.setAttribute('aria-controls', 'vc1661-results');
      const results = doc.createElement('section');
      results.id = 'vc1661-results'; results.hidden = true;
      results.setAttribute('aria-live', 'polite');
      const style = doc.createElement('style'); style.id = 'vc1661-style';
      style.textContent = `#vc60-diagnostics #vc1661-results[hidden]{display:none!important}
#vc60-diagnostics #vc1661-results{margin:12px 0;border:1px solid #d7e5ed;border-radius:10px;padding:12px;background:#f9fbfd;color:#244763}
#vc60-diagnostics .vc1661-list{display:grid;gap:6px;margin:8px 0}
#vc60-diagnostics .vc1661-item{display:grid;grid-template-columns:20px 1fr;gap:3px 7px;padding:7px;border:1px solid #e1ebf0;background:#fff;border-radius:8px;font-size:11px}
#vc60-diagnostics .vc1661-item small{grid-column:2;color:#627d91;line-height:1.45}
#vc60-diagnostics .vc1661-item[data-level="warn"]{border-color:#e5cfb2}
#vc60-diagnostics .vc1661-item[data-level="info"]{border-color:#c7ddec}
#vc60-diagnostics #vc1661-results h4{color:#16496a;margin:0;font-size:14px}
#vc60-diagnostics #vc1661-results p{font-size:11px;line-height:1.5;color:#5c788c;margin:8px 0 0}`;
      doc.head.append(style); actions.prepend(button);
      const stats = panel.querySelector('#vc60-stat-grid');
      if (stats) stats.after(results); else panel.append(results);
      button.addEventListener('click', () => {
        try {
          const report = inspect(win);
          const head = doc.createElement('h4');
          head.textContent = `Comprobación de estabilidad · ${report.warnings} avisos prioritarios`;
          const list = doc.createElement('div');list.className = 'vc1661-list';
          for (const c of report.checks) {
            const item = doc.createElement('div'); item.className = 'vc1661-item'; item.dataset.level = c.level;
            const icon = doc.createElement('span');icon.textContent = c.ok ? '✓' : c.level === 'warn' ? '!' : '·';
            const strong = doc.createElement('strong'); strong.textContent = c.label;
            const note = doc.createElement('small'); note.textContent = c.detail;
            item.append(icon,strong,note);list.append(item);
          }
          const foot = doc.createElement('p');foot.textContent = 'Diagnóstico local de solo lectura: no verifica la sincronización efectiva entre PC y móvil, ni modifica datos.';
          results.replaceChildren(head,list,foot);results.hidden = false;
        } catch (e) {
          results.hidden = false;results.textContent = 'La comprobación no está disponible: ' + String(e?.message || e);
        }
      });
      return true;
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
  }
  return Object.freeze({ version: '16.6.1', summarize, inspect, mount });
});
