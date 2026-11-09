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
