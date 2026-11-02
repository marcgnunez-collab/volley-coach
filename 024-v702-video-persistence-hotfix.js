
/* Volley Coach · V7.0.2 HOTFIX
   Corrige:
   1) Apertura fiable del módulo de vídeo.
   2) Persistencia del scouting (rallies, acciones y metadatos) aunque localStorage falle.
   3) Conservación de campos nuevos durante normalizaciones/migraciones.
   4) Restauración automática de scoutings desde IndexedDB.
*/
(() => {
  'use strict';

  const VERSION = '7.0.2';
  const DB_NAME = 'VolleyCoachScoutingV702';
  const DB_STORE = 'scoutingByTeam';

  const arr = v => Array.isArray(v) ? v : [];
  const clone = v => {
    try {
      if (typeof scoutClone === 'function') return scoutClone(v);
      return JSON.parse(JSON.stringify(v));
    } catch (_) {
      return v;
    }
  };
  const now = () => new Date().toISOString();
  const teamKey = () => {
    try { return String(equipoActivo || 'equipo'); }
    catch (_) { return 'equipo'; }
  };

  function matchStamp(m) {
    const candidates = [m?.updatedAt, m?.manualSavedAt, m?.resultCompleteAt, m?.endedAt, m?.createdAt];
    for (const value of candidates) {
      const t = Date.parse(value || '');
      if (Number.isFinite(t)) return t;
    }
    return 0;
  }

  /* ---------- 1. Normalización sin pérdida de datos ---------- */

  if (typeof scoutNormalizeAction === 'function') {
    const baseNormalizeAction = scoutNormalizeAction;
    scoutNormalizeAction = function(a) {
      const raw = clone(a || {}) || {};
      const normalized = baseNormalizeAction(a);
      return {
        ...raw,
        ...normalized,
        uid: String(normalized?.uid || raw.uid || `act_${normalized?.id || raw.id || Date.now()}`),
        videoStart: raw.videoStart == null ? (normalized?.videoStart ?? null) : Number(raw.videoStart),
        videoAction: raw.videoAction == null ? (normalized?.videoAction ?? null) : Number(raw.videoAction),
        videoEnd: raw.videoEnd == null ? (normalized?.videoEnd ?? null) : Number(raw.videoEnd),
        clipId: String(raw.clipId || normalized?.clipId || ''),
        opponentPlayerUid: String(raw.opponentPlayerUid || normalized?.opponentPlayerUid || '')
      };
    };
  }

  if (typeof scoutNormalizeRally === 'function') {
    const baseNormalizeRally = scoutNormalizeRally;
    scoutNormalizeRally = function(r) {
      const raw = clone(r || {}) || {};
      const normalized = baseNormalizeRally(r);
      return {
        ...raw,
        ...normalized,
        videoStart: raw.videoStart == null ? (normalized?.videoStart ?? null) : Number(raw.videoStart),
        videoEnd: raw.videoEnd == null ? (normalized?.videoEnd ?? null) : Number(raw.videoEnd)
      };
    };
  }

  if (typeof scoutNormalizeSet === 'function') {
    const baseNormalizeSet = scoutNormalizeSet;
    scoutNormalizeSet = function(s, i = 0) {
      const raw = clone(s || {}) || {};
      const normalized = baseNormalizeSet(s, i);
      return { ...raw, ...normalized };
    };
  }

  if (typeof scoutNormalizeMatch === 'function') {
    const baseNormalizeMatch = scoutNormalizeMatch;
    scoutNormalizeMatch = function(m) {
      const raw = clone(m || {}) || {};
      const normalized = baseNormalizeMatch(m);
      const rawVideo = raw.video && typeof raw.video === 'object' ? raw.video : {};
      const normalizedVideo = normalized?.video && typeof normalized.video === 'object' ? normalized.video : {};
      const rawWorkflow = raw.workflow && typeof raw.workflow === 'object' ? raw.workflow : {};
      const normalizedWorkflow = normalized?.workflow && typeof normalized.workflow === 'object' ? normalized.workflow : {};

      return {
        ...raw,
        ...normalized,
        dataVersion: VERSION,
        workflow: {
          ...rawWorkflow,
          ...normalizedWorkflow,
          setLineups: normalizedWorkflow.setLineups || rawWorkflow.setLineups || {},
          events: arr(normalizedWorkflow.events?.length ? normalizedWorkflow.events : rawWorkflow.events)
        },
        video: {
          ...rawVideo,
          ...normalizedVideo,
          syncOffset: rawVideo.syncOffset == null
            ? (normalizedVideo.syncOffset ?? null)
            : Number(rawVideo.syncOffset),
          source: String(rawVideo.source || normalizedVideo.source || ''),
          fileSize: Math.max(0, Number(rawVideo.fileSize ?? normalizedVideo.fileSize) || 0),
          lastModified: Math.max(0, Number(rawVideo.lastModified ?? normalizedVideo.lastModified) || 0),
          mimeType: String(rawVideo.mimeType || normalizedVideo.mimeType || ''),
          duration: rawVideo.duration == null
            ? (normalizedVideo.duration ?? null)
            : Number(rawVideo.duration),
          syncedAt: rawVideo.syncedAt || normalizedVideo.syncedAt || null,
          anchor: rawVideo.anchor || normalizedVideo.anchor || null,
          preRoll: Math.max(0, Number(rawVideo.preRoll ?? normalizedVideo.preRoll ?? 2)),
          postRoll: Math.max(0, Number(rawVideo.postRoll ?? normalizedVideo.postRoll ?? 2)),
          clips: arr(rawVideo.clips?.length ? rawVideo.clips : normalizedVideo.clips)
        }
      };
    };
  }

  try {
    if (typeof scoutingMatches !== 'undefined') {
      scoutingMatches = arr(scoutingMatches).map(m =>
        typeof scoutNormalizeMatch === 'function' ? scoutNormalizeMatch(m) : m
      );
    }
  } catch (err) {
    console.error('V7.0.2 · normalización inicial', err);
  }

  /* ---------- 2. Copia independiente de scouting en IndexedDB ---------- */

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB no disponible'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'teamId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('No se pudo abrir IndexedDB'));
    });
  }

  async function writeSnapshot(reason = 'autosave') {
    try {
      if (typeof scoutingMatches === 'undefined') return false;
      const db = await openDB();
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({
        teamId: teamKey(),
        version: VERSION,
        savedAt: now(),
        reason,
        activeId: (typeof scoutingActiveId !== 'undefined' && scoutingActiveId) ? Number(scoutingActiveId) : null,
        matches: clone(arr(scoutingMatches))
      });
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Error guardando snapshot'));
        tx.onabort = () => reject(tx.error || new Error('Snapshot abortado'));
      });
      db.close();
      return true;
    } catch (err) {
      console.error('V7.0.2 · backup scouting', err);
      return false;
    }
  }

  async function readSnapshot() {
    try {
      const db = await openDB();
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(teamKey());
      const result = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error || new Error('Error leyendo snapshot'));
      });
      db.close();
      return result;
    } catch (err) {
      console.error('V7.0.2 · lectura backup scouting', err);
      return null;
    }
  }

  function syncMatchesIntoTeamMemory() {
    try {
      if (typeof equiposData === 'undefined' || typeof equipoActivo === 'undefined') return;
      if (!equiposData[equipoActivo] && typeof estadoEquipoVacio === 'function') {
        equiposData[equipoActivo] = estadoEquipoVacio(equipoActivo);
      }
      if (equiposData[equipoActivo]) {
        equiposData[equipoActivo].scoutingMatches = clone(arr(scoutingMatches));
        equiposData[equipoActivo].scoutingActiveId =
          (typeof scoutingActiveId !== 'undefined' && scoutingActiveId) ? Number(scoutingActiveId) : null;
      }
    } catch (err) {
      console.error('V7.0.2 · sincronización memoria', err);
    }
  }

  async function restoreSnapshot() {
    const snap = await readSnapshot();
    if (!snap || !arr(snap.matches).length || typeof scoutingMatches === 'undefined') return false;

    try {
      const current = arr(scoutingMatches);
      const map = new Map(current.map(m => [Number(m.id), m]));
      let changed = false;

      for (const raw of arr(snap.matches)) {
        const candidate = typeof scoutNormalizeMatch === 'function'
          ? scoutNormalizeMatch(raw)
          : clone(raw);
        const id = Number(candidate?.id);
        if (!id) continue;
        const existing = map.get(id);

        if (!existing || matchStamp(candidate) > matchStamp(existing)) {
          map.set(id, candidate);
          changed = true;
        }
      }

      if (!changed) return false;

      scoutingMatches = [...map.values()].sort((a, b) =>
        String(b.updatedAt || b.date || '').localeCompare(String(a.updatedAt || a.date || ''))
      );

      syncMatchesIntoTeamMemory();

      try {
        if (typeof guardarEquipoEnMemoria === 'function') guardarEquipoEnMemoria();
        if (typeof guardarEstadoLocalSinCloud === 'function') guardarEstadoLocalSinCloud();
      } catch (err) {
        // Si localStorage está lleno, el snapshot de IndexedDB sigue siendo válido.
        console.warn('V7.0.2 · localStorage no pudo reflejar la restauración; IndexedDB mantiene la copia.', err);
      }

      try { if (typeof window.scoutRenderHome === 'function') window.scoutRenderHome(); } catch (_) {}
      try { if (typeof window.scoutRenderAnalysis === 'function') window.scoutRenderAnalysis(); } catch (_) {}
      try { if (typeof window.scoutRender === 'function') window.scoutRender(); } catch (_) {}

      return true;
    } catch (err) {
      console.error('V7.0.2 · restauración scouting', err);
      return false;
    }
  }

  /* Guardar antes y después del guardado normal.
     Si localStorage lanza QuotaExceededError, el scouting sigue protegido en IndexedDB. */
  if (typeof scoutSave === 'function') {
    const baseScoutSave = scoutSave;
    scoutSave = function(render = true) {
      let activeBefore = null;
      try {
        activeBefore = typeof scoutActive === 'function' ? scoutActive() : null;
        if (activeBefore) activeBefore.dataVersion = VERSION;
      } catch (_) {}
      void writeSnapshot('before-save');
      try {
        const out = baseScoutSave(render);
        try {
          const activeAfter = typeof scoutActive === 'function' ? scoutActive() : activeBefore;
          if (activeAfter) activeAfter.dataVersion = VERSION;
        } catch (_) {}
        void writeSnapshot('after-save');
        return out;
      } catch (err) {
        console.error('V7.0.2 · fallo del guardado principal', err);
        void writeSnapshot('save-error');

        const badge = document.getElementById('scout-save-badge');
        if (badge) badge.textContent = 'Scouting protegido · almacenamiento principal con incidencia';

        const indicator = document.getElementById('save-indicator');
        if (indicator) indicator.textContent = '⚠ Scouting protegido en copia local';

        if (render) {
          try { if (typeof scoutRender === 'function') scoutRender(); } catch (_) {}
        }
        return false;
      }
    };
  }

  /* Recuperar también después de cambiar de equipo. */
  if (typeof window.cambiarEquipo === 'function') {
    const baseChangeTeam = window.cambiarEquipo;
    window.cambiarEquipo = function(id) {
      const out = baseChangeTeam.apply(this, arguments);
      setTimeout(() => { void restoreSnapshot(); }, 0);
      return out;
    };
  }

  /* Recuperar después de una descarga de nube para evitar que una copia antigua
     borre accidentalmente un scouting local más reciente. */
  if (typeof window.bajarNube === 'function') {
    const baseCloudDownload = window.bajarNube;
    window.bajarNube = async function() {
      const out = await baseCloudDownload.apply(this, arguments);
      await restoreSnapshot();
      return out;
    };
  }

  /* ---------- 3. Vídeo: un único punto de entrada fiable ---------- */

  const previousOpenVideo = typeof window.scoutV700OpenVideo === 'function'
    ? window.scoutV700OpenVideo
    : null;

  function videoMatches() {
    try {
      const bridge = window.VC_SCOUT_VIDEO_BRIDGE;
      const list = bridge?.getMatches?.();
      if (Array.isArray(list)) return list;
    } catch (_) {}

    try {
      if (typeof scoutingMatches !== 'undefined') return arr(scoutingMatches);
    } catch (_) {}

    return [];
  }

  function wantedVideoMatchId(context, matches) {
    let id = 0;

    if (context === 'analysis') {
      id = Number(document.getElementById('scout-analysis-match')?.value) || 0;
    }

    if (!id) {
      try { id = Number(window.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.()) || 0; }
      catch (_) {}
    }

    if (!id) {
      try { id = Number(typeof scoutingActiveId !== 'undefined' ? scoutingActiveId : 0) || 0; }
      catch (_) {}
    }

    if (!id) {
      const sorted = matches.slice().sort((a, b) =>
        String(b.updatedAt || b.date || '').localeCompare(String(a.updatedAt || a.date || ''))
      );
      id = Number(sorted[0]?.id) || 0;
    }

    return id;
  }

  function populateVideoSelect(context) {
    const select = document.getElementById('scout-v700-match');
    if (!select) return null;

    const matches = videoMatches().slice().sort((a, b) =>
      String(b.date || '').localeCompare(String(a.date || '')) ||
      Number(b.id || 0) - Number(a.id || 0)
    );

    const wanted = wantedVideoMatchId(context, matches);
    const currentValues = new Set([...select.options].map(o => String(o.value)));
    const expectedValues = new Set(matches.map(m => String(m.id)));

    const needsRebuild =
      select.options.length !== matches.length ||
      [...expectedValues].some(v => !currentValues.has(v));

    if (needsRebuild) {
      select.replaceChildren();

      if (!matches.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Sin scoutings guardados';
        select.appendChild(option);
      } else {
        let teamName = 'Equipo';
        try {
          teamName = window.VC_SCOUT_VIDEO_BRIDGE?.teamName?.() ||
            (typeof EQUIPOS !== 'undefined' && typeof equipoActivo !== 'undefined'
              ? EQUIPOS?.[equipoActivo]?.nombre
              : '') ||
            'Equipo';
        } catch (_) {}

        for (const m of matches) {
          const option = document.createElement('option');
          option.value = String(m.id);
          option.textContent = `${m.date || ''} · ${teamName} vs ${m.opponent || 'Rival'}`;
          select.appendChild(option);
        }
      }
    }

    if (wanted && matches.some(m => Number(m.id) === wanted)) {
      select.value = String(wanted);
    }

    return { matches, wanted };
  }

  window.scoutV700OpenVideo = function(context = '') {
    const modal = document.getElementById('scout-v700-video-modal');

    if (!modal) {
      alert('No se encuentra el panel de vídeo. Recarga la aplicación con la versión V7.0.2.');
      return;
    }

    let baseError = null;
    try {
      if (previousOpenVideo) previousOpenVideo(context);
    } catch (err) {
      baseError = err;
      console.error('V7.0.2 · apertura anterior de vídeo', err);
    }

    const state = populateVideoSelect(context);

    // Garantiza la apertura aunque un handler anterior haya fallado.
    modal.classList.add('open');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.zIndex = '10000';

    try {
      if (typeof window.scoutV700RenderTimeline === 'function') {
        window.scoutV700RenderTimeline();
      }
    } catch (err) {
      console.error('V7.0.2 · render timeline vídeo', err);
    }

    const subtitle = document.getElementById('scout-v700-subtitle');
    if (subtitle && state && !state.matches.length) {
      subtitle.textContent = 'No hay scoutings guardados todavía. Crea o abre un scouting antes de vincular un vídeo.';
    }

    if (baseError) {
      const empty = document.getElementById('scout-v700-video-empty');
      if (empty && !empty.textContent.includes('modo seguro')) {
        const note = document.createElement('span');
        note.textContent = 'Panel abierto en modo seguro V7.0.2.';
        empty.appendChild(note);
      }
    }
  };

  /* Los botones dejan de depender del onclick inline.
     Esto elimina problemas de orden de carga y handlers V7 duplicados. */
  function bindVideoButtons(root = document) {
    root.querySelectorAll?.('button[onclick*="scoutV700OpenVideo"]').forEach(btn => {
      if (btn.dataset.v702VideoBound === '1') return;

      const raw = btn.getAttribute('onclick') || '';
      const context = raw.includes("'analysis'") ? 'analysis'
        : raw.includes("'home'") ? 'home'
        : 'live';

      btn.dataset.v702VideoBound = '1';
      btn.dataset.v702VideoContext = context;
      btn.removeAttribute('onclick');

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.scoutV700OpenVideo(context);
      });
    });
  }

  bindVideoButtons();

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node?.nodeType === 1) bindVideoButtons(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  /* ---------- 4. Diagnóstico ---------- */

  window.scoutV702Diagnostics = function() {
    let matches = [];
    try { matches = videoMatches(); } catch (_) {}

    return {
      version: VERSION,
      videoModal: !!document.getElementById('scout-v700-video-modal'),
      videoOpenHandler: typeof window.scoutV700OpenVideo,
      boundVideoButtons: document.querySelectorAll('[data-v702-video-bound="1"]').length,
      scoutingMatches: matches.length,
      activeId: (() => {
        try { return Number(window.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.()) || null; }
        catch (_) { return null; }
      })(),
      indexedDB: 'indexedDB' in window
    };
  };

  /* V8.9.2 SAFETY: restore, but never overwrite the independent copy on startup. */
  setTimeout(async () => {
    await restoreSnapshot();
  }, 0);

  console.info('Volley Coach V7.0.2 · hotfix de vídeo y persistencia cargado');
})();

