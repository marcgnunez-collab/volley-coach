/* Volley Coach V19.1.0 · Fiabilidad profesional (fase 1)
 * Funciones puras testeables para informes, guardado y fusión conservadora.
 * La protección previa a la nube sigue usando IndexedDB V17.9; no se crean
 * escritores alternativos ni se altera el contador de dispositivos.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.VC_V191_RELIABILITY = api;
    api.mount(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '19.1.0';
  const TRACKED = Object.freeze(['planificacion', 'historial', 'scoutingMatches', 'jugadores']);
  const monitor = {remoteRisk:null, checkedAt:null};
  function noteRemoteRisk(risk){monitor.remoteRisk=risk;monitor.checkedAt=new Date().toISOString();}
  const array = x => Array.isArray(x) ? x : [];
  const object = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const clone = x => JSON.parse(JSON.stringify(x));
  const hasId = v => v != null && (typeof v === 'string' || typeof v === 'number') && String(v).length > 0;
  const idOf = (record, index) => hasId(record?.id) ? String(record.id) : 'index-' + index;

  function foundations(exercise) {
    const list = Array.isArray(exercise?.fundamentos) ? exercise.fundamentos :
      Array.isArray(exercise?.fundamento) ? exercise.fundamento :
      [exercise?.fundamento];
    return [...new Set(list.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))];
  }
  /** No convertir ejercicios de 0 minutos en aportación del 0% si faltan tiempos. */
  function contentBreakdown(exercises) {
    const list = array(exercises);
    const withoutDuration = list.filter(e => !(Number(e?.tiempo) > 0)).length;
    const mode = withoutDuration ? 'ejercicios' : 'minutos';
    const amounts = new Map();
    let missingFoundations = 0;
    list.forEach(e => {
      const tags = foundations(e);
      if (!tags.length) { missingFoundations++; return; }
      const weight = mode === 'minutos' ? Number(e.tiempo) : 1;
      tags.forEach(f => amounts.set(f, (amounts.get(f) || 0) + weight / tags.length));
    });
    const sorted = [...amounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const total = sorted.reduce((n, e) => n + e[1], 0);
    if (!total) return { mode, withoutDuration, missingFoundations, items: [], total: 0 };
    const exact = sorted.map(([, w]) => w / total * 100);
    const rounded = exact.map(Math.floor);
    let remaining = 100 - rounded.reduce((a, b) => a + b, 0);
    const fractions = exact.map((n, i) => ({i, part: n - Math.floor(n)}))
      .sort((a, b) => b.part - a.part || a.i - b.i);
    for (let j = 0; j < remaining; j++) rounded[fractions[j].i]++;
    return {
      mode, withoutDuration, missingFoundations, total,
      items: sorted.map(([name, weight], i) => ({name, weight, percent: rounded[i]}))
    };
  }

  function countState(state) {
    const teams = object(state?.equiposData), result = {};
    for (const [team, data] of Object.entries(teams)) {
      const item = object(data);
      result[team] = Object.fromEntries(TRACKED.map(key => [key, array(item[key]).length]));
      result[team].sesionActual = array(item.sesionActual).length;
    }
    return result;
  }
  /** Comparación diagnóstica; no interpreta una ausencia como una baja intencionada. */
  function assessRemote(local, remote) {
    const lhs = object(local?.equiposData), rhs = object(remote?.equiposData);
    const losses = [], severe = [];
    for (const [team, localTeam] of Object.entries(lhs)) {
      for (const key of TRACKED) {
        const entries = array(localTeam?.[key]), remoteIds = new Set(array(rhs[team]?.[key]).map(idOf));
        const missing = entries.map(idOf).filter(id => !remoteIds.has(id));
        if (!missing.length) continue;
        const risk = {team, kind: key, local: entries.length, remote: array(rhs[team]?.[key]).length,
          missingCount: missing.length, sampleIds: missing.slice(0, 5)};
        losses.push(risk);
        if ((key === 'planificacion' || key === 'historial' || key === 'scoutingMatches') &&
            entries.length >= 2 && missing.length === entries.length) severe.push(risk);
      }
    }
    // Bloqueo crítico solo cuando desaparece todo el archivo de trabajo del
    // equipo. El paso normal de planes a historial no es un borrado masivo.
    const criticalTeams = new Set(severe.map(x => x.team));
    const catastrophic = [...criticalTeams].some(team => {
      const remoteTeam=rhs[team] || {};
      return ['planificacion','historial','scoutingMatches']
        .every(key => array(remoteTeam[key]).length === 0);
    });
    return {losses, severe, requiresSnapshot: losses.length > 0, catastrophic};
  }
  function recordTimestamp(entry) {
    for (const key of ['updatedAt', 'guardadoPlanificacionEn', 'actualizadoEnSesion', 'realizadoEn', 'manualSavedAt']) {
      const raw = entry?.[key], date = typeof raw === 'number' ? raw : Date.parse(raw || '');
      if (Number.isFinite(date) && date > 0) return date;
    }
    return 0;
  }
  function mergeRecords(remoteEntries, localEntries) {
    const combined = array(remoteEntries).map(clone);
    const position = new Map(combined.map((entry, i) => [idOf(entry, i), i]));
    array(localEntries).forEach((entry, i) => {
      const id = idOf(entry, i), idx = position.get(id);
      if (idx == null) {position.set(id, combined.length); combined.push(clone(entry)); return;}
      // Dos ediciones del mismo registro: solo sustituimos la nube si la edición
      // local tiene una marca temporal posterior. La copia V17.9 permite auditar.
      const newerLocal = recordTimestamp(entry) > recordTimestamp(combined[idx]);
      if (newerLocal) combined[idx] = clone(entry);
    });
    return combined;
  }
  /** SOLO para cambios locales pendientes; protege altas sin reintroducir borrados en pulls normales. */
  function mergePending(local, remote) {
    const merged = clone(object(remote));
    merged.equiposData = merged.equiposData || {};
    for (const [team, localTeam] of Object.entries(object(local?.equiposData))) {
      const base = object(merged.equiposData[team]);
      const result = {...base};
      for (const key of ['planificacion', 'historial', 'jugadores', 'plantillas']) {
        result[key] = mergeRecords(base[key], localTeam?.[key]);
      }
      // Mantener la sesión en curso cuando el dispositivo tiene una edición posterior.
      if (localTeam?.meta && (!base.meta || recordTimestamp(localTeam.meta) > recordTimestamp(base.meta))) {
        result.meta = clone(localTeam.meta);
        result.sesionActual = clone(array(localTeam.sesionActual));
      }
      merged.equiposData[team] = result;
    }
    return merged;
  }
  function mount(win) {
    const doc = win.document;
    function make(type, label, className) {
      const el = doc.createElement(type);
      if (label != null) el.textContent = label;
      if (className) el.className = className;
      return el;
    }
    function downloadState() {
      if (typeof win.estadoLocal !== 'function') throw Error('No está disponible el estado de la aplicación.');
      const state = win.estadoLocal();
      if (!state?.equiposData) throw Error('No se ha podido verificar el estado local.');
      const json = JSON.stringify({schema:'volley-coach-recovery',version:VERSION,
        exportedAt:new Date().toISOString(),state},null,2);
      const blob = new Blob([json], {type:'application/json;charset=utf-8'});
      const url = win.URL.createObjectURL(blob), a = make('a');
      a.href = url;
      a.download = 'Volley_Coach_backup_V19_1_' + new Date().toISOString().slice(0,10) + '.json';
      doc.body.appendChild(a); a.click(); a.remove();
      win.setTimeout(() => win.URL.revokeObjectURL(url), 30000);
      return {bytes:blob.size, teams:Object.keys(state.equiposData).length};
    }
    function currentReport() {
      const diag = win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {};
      let data = {}, problem = '';
      try { data = countState(win.estadoLocal?.()); } catch (e) {problem = String(e.message||e);}
      return {version:VERSION,checkedAt:new Date().toISOString(),cloud:{connected:!!diag.connected,
        dirty:!!diag.dirty,syncing:!!diag.syncing,error:diag.lastSyncError||'',
        lastWriteAt:diag.lastWriteAt||null,lastReadAt:diag.lastReadAt||null,
        conflictCount:diag.conflictCount||0},teams:data,localError:problem,remoteRisk:monitor.remoteRisk};
    }
    function attach() {
      if (doc.getElementById('vc191-data-panel')) return true;
      const container = doc.getElementById('v11-management');
      if (!container) return false;
      const style = make('style');style.id='vc191-data-style';
      style.textContent=`#vc191-data-panel{background:#fff;color:#193a53;border:1px solid #cddfeb;border-radius:13px;padding:16px;margin:16px 0;font:13px/1.5 system-ui,sans-serif}#vc191-data-panel h3{font-size:17px;margin:0 0 4px;color:#183b58}#vc191-data-panel p{margin:7px 0;color:#637f93}#vc191-data-panel .vc191-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}#vc191-data-panel button{padding:9px 13px!important;border:1px solid #acc8de!important;border-radius:8px!important;font:700 12px system-ui!important;color:#1a557c!important;background:#ecf5fb!important;min-height:36px!important}#vc191-data-panel pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;font:12px/1.6 ui-monospace,monospace;background:#f4f8fb;color:#294d63;padding:12px;border-radius:9px}#vc191-data-panel .vc191-alert{color:#91452e;background:#fff3e9;border-radius:8px;padding:9px}`;
      doc.head.appendChild(style);
      const section = make('section');section.id='vc191-data-panel';
      section.append(make('h3','V19.1 · Fiabilidad y recuperación'),
        make('p','Auditoría local no destructiva. Una subida confirmada no demuestra recepción en otro dispositivo.'));
      const actions = make('div',null,'vc191-actions');
      const review = make('button','Comprobar integridad'), backup = make('button','Crear copia protegida'),
        exportBtn = make('button','Descargar copia JSON');
      [review,backup,exportBtn].forEach(b=>{b.type='button';actions.appendChild(b)});
      const result = make('pre','Pulsa «Comprobar integridad» para ver los registros locales y el estado de la nube.');
      const status = make('p');status.setAttribute('role','status');
      section.append(actions,result,status);container.appendChild(section);
      review.addEventListener('click',()=>{const d=currentReport();
        result.textContent=Object.entries(d.teams).map(([name,v])=>`${name}: ${v.planificacion} planes · ${v.historial} entrenamientos · ${v.scoutingMatches} scoutings · ${v.jugadores} jugadores · ${v.sesionActual} ejercicios activos`).join('\n') || 'Sin equipos cargados';
        result.textContent+='\n\nNube: '+(!d.cloud.connected?'desconectada':d.cloud.error?'error: '+d.cloud.error:d.cloud.dirty?'pendiente':d.cloud.syncing?'comprobando':'sin cambios pendientes');
        if(d.remoteRisk?.losses?.length)result.textContent+='\nAviso: la última lectura remota no contenía '+d.remoteRisk.losses.map(x=>`${x.missingCount} registros de ${x.kind} (${x.team})`).join(', ');
        status.textContent=d.localError||'Revisión finalizada. Para recuperar información se necesita una copia externa o el historial de copias protegidas.';
      });
      backup.addEventListener('click',async()=>{backup.disabled=true;
        try {if(!win.VC_V179_SYNC_SAFETY?.manualBackup)throw Error('Protección V17.9 no disponible.');
          await win.VC_V179_SYNC_SAFETY.manualBackup();status.textContent='Copia conservada en este navegador. Descarga también una copia JSON externa.';
        } catch(e) {status.textContent='No se pudo crear la copia: '+String(e.message||e)}
        finally {backup.disabled=false;}
      });
      exportBtn.addEventListener('click',()=>{try{downloadState();status.textContent='Descarga iniciada; comprueba que el archivo está en tu dispositivo.'}catch(e){status.textContent=String(e.message||e)}});
      return true;
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded',attach,{once:true});
    else attach();
    // No interceptamos ni sustituimos la comunicación Realtime, únicamente los datos
    // que el motor central transmite al merge preexistente.
    return {downloadState,currentReport,monitor};
  }
  return {version:VERSION,contentBreakdown,countState,assessRemote,mergeRecords,mergePending,noteRemoteRisk,mount};
});
