/* VC20710_BUNDLE: exact legacy modules, executed in original order; v20.7.10 */
/* VC20710_SOURCE_BEGIN:024-v702-video-persistence-hotfix.js */

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


/* VC20710_SOURCE_END:024-v702-video-persistence-hotfix.js */
;

/* VC20710_SOURCE_BEGIN:025-v710-video-analysis-module.js */

(()=>{
'use strict';

const V710_VERSION='7.1.0';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const state={selectedKey:'',lastMatchId:null};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return Number(bridge()?.getActiveId?.())||0}catch(_){return 0}}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function label(a){try{return bridge()?.playerLabel?.(a)||fallbackLabel(a)}catch(_){return fallbackLabel(a)}}
function fallbackLabel(a){const n=a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot;return String(n||'Jugador')}
function currentMatch(){const id=Number($('scout-v700-match')?.value)||activeId();return matches().find(m=>Number(m.id)===id)||null}
function video(){return $('scout-v700-player')}
function meta(m){const x=m?.video;return x&&typeof x==='object'?x:null}
function fmt(s){if(s==null||!Number.isFinite(Number(s)))return '—';s=Math.max(0,Number(s));const mm=Math.floor(s/60),ss=s-mm*60;return `${String(mm).padStart(2,'0')}:${ss.toFixed(1).padStart(4,'0')}`}
function pct(n,d){return d?Math.round((Number(n)||0)*100/d):0}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function actionPlayerKey(a){if(a?.team==='ours')return `ours:${a.playerId??a.playerNumberSnapshot??a.playerNameSnapshot??a.playerLabel??''}`;return `opponent:${a.playerLabel??a.playerNumberSnapshot??a.playerNameSnapshot??''}`}
function rallyStartMs(r){const aa=arr(r?.actions);return aa.length?(Number(aa[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0)}
function rallyEndMs(r){const aa=arr(r?.actions);return aa.length?(Number(aa[aa.length-1].scoutMs)||Number(r?.scoutEndMs)||rallyStartMs(r)):(Number(r?.scoutEndMs)||rallyStartMs(r))}
function mapped(m,ms){const x=meta(m);return x?.syncOffset==null?null:Math.max(0,(Number(ms)||0)/1000+Number(x.syncOffset))}

function allItems(m){
  const out=[];
  arr(m?.sets).forEach(s=>arr(s.rallies).forEach((r,ri)=>{
    out.push({
      key:`r:${s.number}:${r.id}`,type:'rally',ms:rallyStartMs(r),endMs:rallyEndMs(r),set:Number(s.number)||1,
      team:r.winner==='ours'?'ours':'opponent',label:`Set ${s.number} · Rally ${ri+1} · ${r.scoreAfter?.us??0}–${r.scoreAfter?.opponent??0}`,
      copy:`R${r.rotationBefore||1} vs R${r.opponentRotationBefore||1} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${arr(r.actions).length} acciones`,
      rally:r,actions:arr(r.actions)
    });
    arr(r.actions).forEach(a=>out.push({
      key:`a:${s.number}:${r.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(s.number)||1,
      team:a.team==='opponent'?'opponent':'ours',skill:a.skill,evaluation:a.evaluation,playerKey:actionPlayerKey(a),
      playerLabel:label(a),label:String(a.code||SKILLS[a.skill]||'Acción'),
      copy:`S${s.number} · Rally ${ri+1} · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${label(a)}`,
      action:a,rally:r
    }));
  }));
  const cs=arr(m?.sets).find(s=>Number(s.number)===Number(m?.currentSet));
  const li=arr(cs?.rallies).length+1;
  arr(m?.liveRally?.actions).forEach(a=>out.push({
    key:`a:${m.currentSet}:${m.liveRally.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(m.currentSet)||1,
    team:a.team==='opponent'?'opponent':'ours',skill:a.skill,evaluation:a.evaluation,playerKey:actionPlayerKey(a),
    playerLabel:label(a),label:String(a.code||SKILLS[a.skill]||'Acción'),
    copy:`S${m.currentSet} · Rally ${li} en curso · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${label(a)}`,
    action:a,rally:m.liveRally,live:true
  }));
  arr(m?.workflow?.events).forEach(e=>out.push({
    key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:Number(e.setNumber)||1,
    label:String(e.type||'Evento'),copy:`S${e.setNumber||'?'} · ${e.scoreUs??0}–${e.scoreOpponent??0}${e.note?' · '+e.note:''}`,event:e
  }));
  arr(m?.events).forEach(e=>out.push({
    key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:Number(e.setNumber)||1,
    label:e.type==='libero_auto'?'Líbero automático':'Cambio',
    copy:`S${e.setNumber||'?'} · ${e.scoreUs??0}–${e.scoreOpponent??0} · ${e.outLabel||'—'} → ${e.inLabel||'—'}`,event:e
  }));
  return out.sort((a,b)=>a.ms-b.ms||String(a.key).localeCompare(String(b.key)));
}

function filterState(){
  return {
    kind:$('scout-v700-kind')?.value||'all',
    set:$('scout-v710-set')?.value||'',
    team:$('scout-v710-team')?.value||'',
    player:$('scout-v710-player')?.value||'',
    skill:$('scout-v700-skill')?.value||'',
    evaluation:$('scout-v710-eval')?.value||'',
    q:String($('scout-v700-search')?.value||'').trim().toLowerCase()
  };
}
function actionMatches(item,f){
  if(item.type!=='action')return false;
  if(f.set&&String(item.set)!==f.set)return false;
  if(f.team&&item.team!==f.team)return false;
  if(f.player&&item.playerKey!==f.player)return false;
  if(f.skill&&item.skill!==f.skill)return false;
  if(f.evaluation&&item.evaluation!==f.evaluation)return false;
  if(f.q&&!`${item.label} ${item.copy} ${item.playerLabel||''} ${SKILLS[item.skill]||''} ${item.set}`.toLowerCase().includes(f.q))return false;
  return true;
}
function itemMatches(item,f){
  if(f.kind!=='all'&&item.type!==f.kind)return false;
  if(f.set&&String(item.set)!==f.set)return false;

  const actionSpecific=!!(f.team||f.player||f.skill||f.evaluation);
  if(item.type==='action')return actionMatches(item,f);
  if(item.type==='rally'&&actionSpecific){
    const actions=arr(item.actions).map(a=>({
      type:'action',set:item.set,team:a.team==='opponent'?'opponent':'ours',playerKey:actionPlayerKey(a),
      skill:a.skill,evaluation:a.evaluation,label:String(a.code||''),copy:label(a),playerLabel:label(a)
    }));
    if(!actions.some(x=>actionMatches(x,{...f,kind:'action',set:''})))return false;
  }
  if(item.type==='event'&&actionSpecific)return false;
  if(f.q&&!`${item.label} ${item.copy} ${item.set}`.toLowerCase().includes(f.q))return false;
  return true;
}
function filteredItems(m){const f=filterState();return allItems(m).filter(x=>itemMatches(x,f))}
function filteredActions(m){
  const f=filterState();
  return allItems(m).filter(x=>x.type==='action'&&actionMatches(x,{...f,kind:'action'}));
}

function populateDynamicFilters(m){
  if(!m)return;
  const setSel=$('scout-v710-set');
  if(setSel){
    const old=setSel.value;
    const sets=[...new Set(arr(m.sets).map(s=>Number(s.number)).filter(Boolean))].sort((a,b)=>a-b);
    setSel.innerHTML='<option value="">Todos los sets</option>'+sets.map(n=>`<option value="${n}">Set ${n}</option>`).join('');
    if(sets.map(String).includes(old))setSel.value=old;
  }
  populatePlayers(m);
}
function populatePlayers(m){
  const sel=$('scout-v710-player');if(!sel||!m)return;
  const old=sel.value,team=$('scout-v710-team')?.value||'';
  const map=new Map();
  allItems(m).filter(x=>x.type==='action'&&(!team||x.team===team)).forEach(x=>{
    if(!map.has(x.playerKey))map.set(x.playerKey,{label:x.playerLabel||'Jugador',team:x.team});
  });
  const rows=[...map.entries()].sort((a,b)=>{
    if(a[1].team!==b[1].team)return a[1].team==='ours'?-1:1;
    return String(a[1].label).localeCompare(String(b[1].label),'es',{numeric:true});
  });
  sel.innerHTML='<option value="">Todos los jugadores</option>'+rows.map(([k,v])=>`<option value="${esc(k)}">${v.team==='ours'?'Nuestro':'Rival'} · ${esc(v.label)}</option>`).join('');
  if(rows.some(([k])=>k===old))sel.value=old;
}

function metrics(m){
  const rows=filteredActions(m),g=rows.filter(x=>x.evaluation==='#').length,p=rows.filter(x=>x.evaluation==='=').length,
        pos=rows.filter(x=>x.evaluation==='#'||x.evaluation==='+').length,
        neg=rows.filter(x=>['-','/','='].includes(x.evaluation)).length;
  return {rows,total:rows.length,g,p,gp:g-p,pos,neg,posPct:pct(pos,rows.length),errPct:pct(p,rows.length)};
}

function filterSummary(){
  const f=filterState(),parts=[];
  if(f.set)parts.push(`Set ${f.set}`);
  if(f.team)parts.push(f.team==='ours'?teamName():'Rival');
  if(f.player)parts.push($('scout-v710-player')?.selectedOptions?.[0]?.textContent||'Jugador');
  if(f.skill)parts.push(SKILLS[f.skill]||f.skill);
  if(f.evaluation)parts.push(`Valoración ${f.evaluation}`);
  if(f.q)parts.push(`“${f.q}”`);
  return parts.length?parts.join(' · '):'Todas las acciones';
}
function renderMetrics(m){
  const k=$('scout-v710-kpis'),breakdown=$('scout-v710-skill-breakdown');
  if(!k||!breakdown)return;
  if(!m){k.innerHTML='';breakdown.innerHTML='';return}
  const x=metrics(m);
  $('scout-v710-filter-summary').textContent=filterSummary();
  k.innerHTML=`
    <div class="scout-v710-kpi"><span>Acciones</span><b>${x.total}</b><small>muestra filtrada</small></div>
    <div class="scout-v710-kpi good"><span>G · #</span><b>${x.g}</b><small>ganancias</small></div>
    <div class="scout-v710-kpi bad"><span>P · =</span><b>${x.p}</b><small>pérdidas/error</small></div>
    <div class="scout-v710-kpi gp"><span>G-P</span><b>${x.gp>0?'+':''}${x.gp}</b><small># menos =</small></div>
    <div class="scout-v710-kpi"><span>Positivas</span><b>${x.posPct}%</b><small># / +</small></div>`;
  const groups=Object.keys(SKILLS).map(skill=>{
    const r=x.rows.filter(a=>a.skill===skill),g=r.filter(a=>a.evaluation==='#').length,p=r.filter(a=>a.evaluation==='=').length,pos=r.filter(a=>['#','+'].includes(a.evaluation)).length;
    return {skill,n:r.length,g,p,gp:g-p,pos:pct(pos,r.length)};
  }).filter(r=>r.n);
  breakdown.innerHTML=groups.length?`
    <div class="scout-v710-skill-row head"><span>Fundamento</span><span>Acc.</span><span>G</span><span>P</span><span>G-P</span><span>+/#</span></div>
    ${groups.map(r=>`<div class="scout-v710-skill-row"><b>${esc(SKILLS[r.skill])}</b><span>${r.n}</span><span>${r.g}</span><span>${r.p}</span><span>${r.gp>0?'+':''}${r.gp}</span><span>${r.pos}%</span></div>`).join('')}`:
    '<div class="scout-v710-empty">No hay acciones que cumplan los filtros.</div>';
}

function renderTimeline(){
  const box=$('scout-v700-timeline'),m=currentMatch();if(!box)return;
  if(!m){box.innerHTML='<div class="match-empty">No hay scouting seleccionado.</div>';renderMetrics(null);return}
  populateDynamicFilters(m);
  const rows=filteredItems(m);
  box.innerHTML=rows.length?rows.map(x=>{
    const t=mapped(m,x.ms),play=t!=null,pill=x.type==='rally'?'RALLY':x.type==='action'?(SKILLS[x.skill]||x.skill):'EVENTO';
    const evalBadge=x.type==='action'&&x.evaluation?`<span class="v710-eval-badge ${['#','+'].includes(x.evaluation)?'good':['=','/','-'].includes(x.evaluation)?'bad':''}">${esc(x.evaluation)}</span>`:'';
    return `<div class="scout-v700-item ${x.key===state.selectedKey?'active':''}" data-key="${esc(x.key)}">
      <div class="time">${play?fmt(t):fmt((Number(x.ms)||0)/1000)}</div>
      <div><span class="scout-v700-pill ${x.team==='ours'?'ours':x.team==='opponent'?'opponent':''}">${esc(pill)}</span>${evalBadge}<strong>${esc(x.label)}</strong><small>${esc(x.copy||'')}</small></div>
      <div class="actions"><button class="ghost" onclick="scoutV700SyncKey('${esc(x.key)}')">Sincronizar aquí</button><button class="${play?'primary':'ghost'}" ${play?'':'disabled'} onclick="scoutV700PlayKey('${esc(x.key)}')">▶</button></div>
    </div>`;
  }).join(''):'<div class="match-empty">No hay elementos para estos filtros.</div>';
  renderMetrics(m);
}

function setCurrentLabel(key){
  const m=currentMatch();if(!m)return;
  const item=allItems(m).find(x=>x.key===key);if(!item)return;
  state.selectedKey=key;
  const el=$('scout-v700-current-label');if(el)el.textContent=item.label;
  const ov=$('scout-v710-overlay');if(ov)ov.innerHTML=`<b>${item.type==='rally'?'RALLY':item.type==='action'?(SKILLS[item.skill]||'ACCIÓN'):'EVENTO'}</b><span>${esc(item.label)} · ${esc(item.copy||'')}</span>`;
}
function nearestItemByVideoTime(m,t){
  if(!m||meta(m)?.syncOffset==null)return null;
  const rows=filteredItems(m).filter(x=>mapped(m,x.ms)!=null);
  if(!rows.length)return null;
  let best=rows[0],bestD=Math.abs(mapped(m,best.ms)-t);
  rows.forEach(x=>{const d=Math.abs(mapped(m,x.ms)-t);if(d<bestD){best=x;bestD=d}});
  return best;
}
function move(dir){
  const m=currentMatch();if(!m)return;
  const rows=filteredItems(m).filter(x=>mapped(m,x.ms)!=null);
  if(!rows.length){alert('No hay elementos sincronizados con los filtros actuales.');return}
  let idx=rows.findIndex(x=>x.key===state.selectedKey);
  if(idx<0){
    const near=nearestItemByVideoTime(m,Number(video()?.currentTime)||0);
    idx=near?rows.findIndex(x=>x.key===near.key):(dir>0?-1:0);
  }
  idx=Math.max(0,Math.min(rows.length-1,idx+dir));
  window.scoutV700PlayKey?.(rows[idx].key);
}
window.scoutV710Previous=()=>move(-1);
window.scoutV710Next=()=>move(1);
window.scoutV710Seek=function(delta){const v=video();if(!v?.src)return;const max=Number.isFinite(v.duration)?v.duration:Infinity;v.currentTime=Math.max(0,Math.min(max,(Number(v.currentTime)||0)+Number(delta||0)))};
window.scoutV710TogglePlay=function(){const v=video();if(!v?.src)return;if(v.paused)v.play().catch(()=>{});else v.pause()};
window.scoutV710SetSpeed=function(rate){const v=video();if(!v)return;const r=Math.max(.25,Math.min(3,Number(rate)||1));v.playbackRate=r;try{localStorage.setItem('volley_v710_playback_rate',String(r))}catch(_){}};
window.scoutV710ResetFilters=function(){
  ['scout-v710-set','scout-v710-team','scout-v710-player','scout-v700-skill','scout-v710-eval'].forEach(id=>{if($(id))$(id).value=''});
  if($('scout-v700-kind'))$('scout-v700-kind').value='all';
  if($('scout-v700-search'))$('scout-v700-search').value='';
  populatePlayers(currentMatch());
  renderTimeline();
};
window.scoutV710FilterChanged=function(){populatePlayers(currentMatch());renderTimeline()};

const baseOpen=window.scoutV700OpenVideo;
window.scoutV700OpenVideo=function(context=''){
  const out=baseOpen?.(context);
  const m=currentMatch();
  populateDynamicFilters(m);
  const saved=Number(localStorage.getItem('volley_v710_playback_rate'))||1;
  if($('scout-v710-speed'))$('scout-v710-speed').value=String(saved);
  if(video())video().playbackRate=saved;
  setTimeout(renderTimeline,0);
  return out;
};

const baseChanged=window.scoutV700MatchChanged;
window.scoutV700MatchChanged=function(){
  state.selectedKey='';
  const out=baseChanged?.();
  const m=currentMatch();
  state.lastMatchId=m?.id||null;
  populateDynamicFilters(m);
  setTimeout(renderTimeline,0);
  return out;
};

const basePlay=window.scoutV700PlayKey;
window.scoutV700PlayKey=function(key){
  setCurrentLabel(key);
  const out=basePlay?.(key);
  setTimeout(renderTimeline,0);
  return out;
};

['scoutV700SyncKey','scoutV700Nudge','scoutV700ClearSync','scoutV700RangeChanged','scoutV700DetachFile'].forEach(name=>{
  const base=window[name];
  if(typeof base!=='function')return;
  window[name]=function(...args){
    const out=base.apply(this,args);
    setTimeout(renderTimeline,0);
    return out;
  };
});

const baseLoad=window.scoutV700LoadFile;
window.scoutV700LoadFile=function(ev){
  const out=baseLoad?.(ev);
  const v=video();
  if(v)v.addEventListener('loadedmetadata',()=>renderTimeline(),{once:true});
  setTimeout(renderTimeline,0);
  return out;
};

window.scoutV700RenderTimeline=renderTimeline;

const v=video();
if(v&&!v.dataset.v710Bound){
  v.dataset.v710Bound='1';
  v.addEventListener('timeupdate',()=>{
    const m=currentMatch();if(!m||meta(m)?.syncOffset==null)return;
    const rows=allItems(m).filter(x=>mapped(m,x.ms)!=null);
    if(!rows.length)return;
    let current=rows[0];
    for(const x of rows){if(mapped(m,x.ms)<=v.currentTime+.15)current=x;else break}
    const ov=$('scout-v710-overlay');
    if(ov&&current)ov.innerHTML=`<b>${current.type==='rally'?'RALLY':current.type==='action'?(SKILLS[current.skill]||'ACCIÓN'):'EVENTO'}</b><span>${esc(current.label)} · ${esc(current.copy||'')}</span>`;
  });
}

document.addEventListener('keydown',e=>{
  const modal=$('scout-v700-video-modal');
  if(!modal?.classList.contains('open'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();
  if(['input','select','textarea'].includes(tag))return;
  if(e.code==='Space'){e.preventDefault();window.scoutV710TogglePlay()}
  else if(e.key==='ArrowLeft'){e.preventDefault();window.scoutV710Seek(e.shiftKey?-5:-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();window.scoutV710Seek(e.shiftKey?5:1)}
  else if(e.key==='ArrowUp'){e.preventDefault();window.scoutV710Previous()}
  else if(e.key==='ArrowDown'){e.preventDefault();window.scoutV710Next()}
});

window.scoutV710Diagnostics=function(){
  const m=currentMatch(),x=m?metrics(m):null;
  return {
    version:V710_VERSION,
    matchId:m?.id||null,
    videoLoaded:!!video()?.src,
    synchronized:meta(m)?.syncOffset!=null,
    filteredItems:m?filteredItems(m).length:0,
    filteredActions:x?.total||0,
    gains:x?.g||0,
    losses:x?.p||0,
    gp:x?.gp||0
  };
};

setTimeout(()=>{const m=currentMatch();if(m){populateDynamicFilters(m);renderTimeline()}},0);
})();

/* VC20710_SOURCE_END:025-v710-video-analysis-module.js */
;

/* VC20710_SOURCE_BEGIN:026-v720-clip-studio-module.js */

(()=>{
'use strict';

const VERSION='7.2.0';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const TAGS={general:'General',highlights:'Highlights',technical:'Técnico',tactical:'Táctico',player:'Jugador',opponent:'Rival',error:'Corrección / error'};
const state={in:null,out:null,playingClipId:null,playlist:[],playlistIndex:-1,playlistStop:null,exporting:false};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return Number(bridge()?.getActiveId?.())||0}catch(_){return 0}}
function currentMatch(){
  const id=Number($('scout-v700-match')?.value)||activeId();
  return matches().find(m=>Number(m.id)===id)||null;
}
function video(){return $('scout-v700-player')}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function playerLabel(a){try{return bridge()?.playerLabel?.(a)||String(a?.playerLabel||a?.playerNameSnapshot||a?.playerNumberSnapshot||'Jugador')}catch(_){return 'Jugador'}}
function save(){
  const m=currentMatch();
  if(m){m.updatedAt=new Date().toISOString();m.dataVersion=VERSION}
  try{bridge()?.save?.()}catch(err){console.error('V7.2 clip save',err)}
}
function meta(m){
  if(!m)return null;
  const raw=m.video&&typeof m.video==='object'?m.video:{};
  m.video={...raw,clips:arr(raw.clips)};
  return m.video;
}
function clips(m=currentMatch()){return meta(m)?.clips||[]}
function fmt(s){
  if(s==null||!Number.isFinite(Number(s)))return '—';
  s=Math.max(0,Number(s));const mm=Math.floor(s/60),ss=s-mm*60;
  return `${String(mm).padStart(2,'0')}:${ss.toFixed(1).padStart(4,'0')}`;
}
function durationText(s){if(!Number.isFinite(Number(s)))return '—';return `${Math.max(0,Number(s)).toFixed(1)} s`}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function slug(v){return String(v||'clip').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'clip'}
function id(){return `clip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}
function stampStatus(msg,kind=''){
  const el=$('scout-v720-status');if(!el)return;
  el.textContent=msg||'';el.className=`scout-v720-status ${kind||''}`;
  if(msg)setTimeout(()=>{if(el.textContent===msg){el.textContent='';el.className='scout-v720-status'}},3500);
}
function downloadBlob(blob,name){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function downloadText(text,name,type='text/plain;charset=utf-8'){
  downloadBlob(new Blob([text],{type}),name);
}
function mapped(m,ms){
  const x=meta(m);return x?.syncOffset==null?null:Math.max(0,(Number(ms)||0)/1000+Number(x.syncOffset));
}
function rallyStartMs(r){
  const a=arr(r?.actions);
  return a.length?(Number(a[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0);
}
function rallyEndMs(r){
  const a=arr(r?.actions);
  return a.length?(Number(a[a.length-1].scoutMs)||Number(r?.scoutEndMs)||rallyStartMs(r)):(Number(r?.scoutEndMs)||rallyStartMs(r));
}
function findByKey(key,m=currentMatch()){
  if(!m)return null;
  const p=String(key||'').split(':');
  if(p[0]==='r'){
    const setNo=Number(p[1]),rid=Number(p[2]),s=arr(m.sets).find(x=>Number(x.number)===setNo),r=arr(s?.rallies).find(x=>Number(x.id)===rid);
    if(!r)return null;
    const pre=Math.max(0,Number(meta(m)?.preRoll??2)),post=Math.max(0,Number(meta(m)?.postRoll??2));
    const a=mapped(m,rallyStartMs(r)),b=mapped(m,rallyEndMs(r));
    return a==null||b==null?null:{
      key,type:'rally',set:setNo,start:Math.max(0,a-pre),end:b+post,
      name:`Set ${setNo} · Rally ${arr(s.rallies).findIndex(x=>Number(x.id)===rid)+1}`,
      note:`${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${r.scoreAfter?.us??0}-${r.scoreAfter?.opponent??0}`,
      team:r.winner==='ours'?'ours':'opponent'
    };
  }
  if(p[0]==='a'){
    const setNo=Number(p[1]),rid=Number(p[2]),aid=Number(p[3]),s=arr(m.sets).find(x=>Number(x.number)===setNo);
    let r=arr(s?.rallies).find(x=>Number(x.id)===rid);
    if(!r&&Number(m.liveRally?.id)===rid)r=m.liveRally;
    const a=arr(r?.actions).find(x=>Number(x.id)===aid);if(!a)return null;
    const x=meta(m),center=a.videoAction!=null?Number(a.videoAction):mapped(m,a.scoutMs);
    let start=a.videoStart!=null?Number(a.videoStart):(center==null?null:Math.max(0,center-Math.max(0,Number(x?.preRoll??2))));
    let end=a.videoEnd!=null?Number(a.videoEnd):(center==null?null:center+Math.max(0,Number(x?.postRoll??2)));
    if(start==null||end==null)return null;
    return {
      key,type:'action',set:setNo,start,end,
      name:`${SKILLS[a.skill]||a.skill||'Acción'} · ${playerLabel(a)}`,
      note:`${a.code||''}${a.evaluation?` · ${a.evaluation}`:''}`,
      team:a.team==='opponent'?'opponent':'ours',skill:a.skill||'',evaluation:a.evaluation||'',player:playerLabel(a)
    };
  }
  if(p[0]==='e'){
    const uid=p.slice(1).join(':'),events=[...arr(m.workflow?.events),...arr(m.events)],e=events.find(x=>String(x.uid||x.id)===uid);
    if(!e)return null;
    const center=e.videoTime!=null?Number(e.videoTime):mapped(m,e.scoutMs);if(center==null)return null;
    const pre=Math.max(0,Number(meta(m)?.preRoll??2)),post=Math.max(0,Number(meta(m)?.postRoll??2));
    return {key,type:'event',set:Number(e.setNumber)||null,start:Math.max(0,center-pre),end:center+post,name:String(e.type||'Evento'),note:e.note||'',team:''};
  }
  return null;
}
function normalizeRange(start,end){
  start=Number(start);end=Number(end);
  if(!Number.isFinite(start)||!Number.isFinite(end))return null;
  if(end<start)[start,end]=[end,start];
  if(end-start<0.15)return null;
  const v=video();if(Number.isFinite(v?.duration)){start=Math.max(0,Math.min(start,v.duration));end=Math.max(0,Math.min(end,v.duration))}
  return {start,end};
}
function createClip(data,quiet=false){
  const m=currentMatch();if(!m){if(!quiet)alert('Selecciona un scouting.');return null}
  const x=meta(m),range=normalizeRange(data.start,data.end);
  if(!range){if(!quiet)alert('El clip necesita un intervalo IN–OUT válido.');return null}
  const clip={
    id:id(),name:String(data.name||`Clip ${clips(m).length+1}`).trim()||`Clip ${clips(m).length+1}`,
    tag:String(data.tag||'general'),note:String(data.note||'').trim(),
    start:range.start,end:range.end,duration:range.end-range.start,
    sourceKey:data.sourceKey||null,type:data.type||'manual',set:data.set??null,team:data.team||'',
    skill:data.skill||'',evaluation:data.evaluation||'',player:data.player||'',
    createdAt:new Date().toISOString(),source:x?.source||''
  };
  x.clips.push(clip);save();render();
  if(!quiet)stampStatus(`Clip guardado · ${durationText(clip.duration)}`,'good');
  return clip;
}
function renderMarkers(){
  if($('scout-v720-in'))$('scout-v720-in').textContent=fmt(state.in);
  if($('scout-v720-out'))$('scout-v720-out').textContent=fmt(state.out);
  const r=normalizeRange(state.in,state.out);
  if($('scout-v720-duration'))$('scout-v720-duration').textContent=r?durationText(r.end-r.start):'—';
}
function render(){
  renderMarkers();
  const box=$('scout-v720-clips'),m=currentMatch();if(!box)return;
  if(!m){box.innerHTML='<div class="scout-v720-empty">Selecciona un scouting.</div>';return}
  const rows=clips(m).slice().sort((a,b)=>Number(a.start)-Number(b.start)||String(a.createdAt).localeCompare(String(b.createdAt)));
  box.innerHTML=rows.length?rows.map(c=>{
    const tags=[
      `<span class="scout-v720-tag">${esc(TAGS[c.tag]||c.tag||'General')}</span>`,
      c.skill?`<span class="scout-v720-tag skill">${esc(SKILLS[c.skill]||c.skill)}</span>`:'',
      c.evaluation?`<span class="scout-v720-tag ${['#','+'].includes(c.evaluation)?'good':['=','/','-'].includes(c.evaluation)?'bad':''}">${esc(c.evaluation)}</span>`:'',
      c.player?`<span class="scout-v720-tag">${esc(c.player)}</span>`:''
    ].join('');
    return `<article class="scout-v720-clip ${state.playingClipId===c.id?'playing':''}" data-clip-id="${esc(c.id)}">
      <div class="scout-v720-time">${fmt(c.start)}<small>→ ${fmt(c.end)} · ${durationText(c.duration)}</small></div>
      <div class="scout-v720-copy"><strong>${esc(c.name)}</strong><small>${esc(c.note||c.sourceKey||'Clip manual')}</small><div class="scout-v720-tags">${tags}</div></div>
      <div class="scout-v720-actions">
        <button class="primary" type="button" onclick="scoutV720Play('${esc(c.id)}')">▶</button>
        <button class="ghost" type="button" onclick="scoutV720Edit('${esc(c.id)}')">Editar</button>
        <button class="ghost" type="button" onclick="scoutV720ExportWebM('${esc(c.id)}')">WebM</button>
        <button class="danger" type="button" onclick="scoutV720Delete('${esc(c.id)}')">Eliminar</button>
      </div>
    </article>`;
  }).join(''):'<div class="scout-v720-empty">Todavía no hay clips. Pulsa “Clip” en una fila o marca IN/OUT sobre el vídeo.</div>';
}
function decorateTimeline(){
  const root=$('scout-v700-timeline');if(!root)return;
  root.querySelectorAll('.scout-v700-item').forEach(row=>{
    if(row.querySelector('.scout-v720-row-clip'))return;
    const key=row.dataset.key;if(!key)return;
    const actions=row.querySelector('.actions');if(!actions)return;
    const b=document.createElement('button');
    b.type='button';b.className='ghost scout-v720-row-clip';b.textContent='Clip';
    b.onclick=e=>{e.stopPropagation();window.scoutV720CreateFromKey(key)};
    actions.prepend(b);
  });
}
function selectedKey(){
  return $('scout-v700-timeline')?.querySelector('.scout-v700-item.active')?.dataset?.key||
         $('scout-v700-timeline')?.querySelector('.scout-v700-item')?.dataset?.key||'';
}
function clipById(cid){return clips().find(c=>String(c.id)===String(cid))||null}
function playRange(c){
  const v=video();if(!v?.src){alert('Vuelve a seleccionar el archivo de vídeo de este partido.');return}
  const r=normalizeRange(c.start,c.end);if(!r)return;
  state.playingClipId=c.id||null;state.playlistStop=r.end;
  try{v.currentTime=r.start;v.play().catch(()=>{})}catch(_){}
  render();
}
function stopPlayback(){
  state.playingClipId=null;state.playlistStop=null;state.playlist=[];state.playlistIndex=-1;render();
}
function nextPlaylist(){
  if(!state.playlist.length){stopPlayback();return}
  state.playlistIndex++;
  if(state.playlistIndex>=state.playlist.length){try{video()?.pause()}catch(_){};stopPlayback();stampStatus('Montaje terminado','good');return}
  const c=clipById(state.playlist[state.playlistIndex]);
  if(!c){nextPlaylist();return}
  playRange(c);
}
window.scoutV720MarkIn=function(){const v=video();if(!v?.src){alert('Carga primero el vídeo.');return}state.in=Number(v.currentTime)||0;renderMarkers();stampStatus(`IN ${fmt(state.in)}`,'good')};
window.scoutV720MarkOut=function(){const v=video();if(!v?.src){alert('Carga primero el vídeo.');return}state.out=Number(v.currentTime)||0;renderMarkers();stampStatus(`OUT ${fmt(state.out)}`,'good')};
window.scoutV720ClearMarkers=function(){state.in=null;state.out=null;renderMarkers()};
window.scoutV720CreateManual=function(){
  const name=$('scout-v720-name')?.value||'',tag=$('scout-v720-tag')?.value||'general',note=$('scout-v720-note')?.value||'';
  const c=createClip({start:state.in,end:state.out,name,tag,note,type:'manual'});
  if(c){if($('scout-v720-name'))$('scout-v720-name').value='';if($('scout-v720-note'))$('scout-v720-note').value='';state.in=null;state.out=null;renderMarkers()}
};
window.scoutV720CreateFromKey=function(key,quiet=false){
  const data=findByKey(key);if(!data){if(!quiet)alert('Este elemento todavía no tiene tiempo de vídeo. Sincroniza el partido primero.');return null}
  return createClip({start:data.start,end:data.end,name:data.name,note:data.note,sourceKey:key,type:data.type,set:data.set,team:data.team,skill:data.skill,evaluation:data.evaluation,player:data.player,
    tag:data.team==='opponent'?'opponent':data.type==='action'?'technical':'general'},quiet);
};
window.scoutV720CreateSelected=function(){
  const key=selectedKey();if(!key){alert('No hay ninguna fila disponible.');return}
  window.scoutV720CreateFromKey(key);
};
window.scoutV720CreateVisible=function(){
  const keys=[...($('scout-v700-timeline')?.querySelectorAll('.scout-v700-item')||[])].map(x=>x.dataset.key).filter(Boolean);
  if(!keys.length){alert('No hay filas visibles con los filtros actuales.');return}
  const m=currentMatch(),existing=new Set(clips(m).map(c=>c.sourceKey).filter(Boolean));
  let added=0,skipped=0;
  keys.forEach(key=>{
    if(existing.has(key)){skipped++;return}
    const c=window.scoutV720CreateFromKey(key,true);if(c){added++;existing.add(key)}else skipped++;
  });
  save();render();stampStatus(`${added} clips creados${skipped?` · ${skipped} omitidos`:''}`,added?'good':'warn');
};
window.scoutV720Play=function(cid){
  state.playlist=[];state.playlistIndex=-1;
  const c=clipById(cid);if(c)playRange(c);
};
window.scoutV720PlayPlaylist=function(){
  const rows=clips().slice().sort((a,b)=>Number(a.start)-Number(b.start));
  if(!rows.length){alert('No hay clips guardados.');return}
  if(!video()?.src){alert('Vuelve a seleccionar el archivo de vídeo del partido.');return}
  state.playlist=rows.map(c=>c.id);state.playlistIndex=-1;nextPlaylist();
};
window.scoutV720Delete=function(cid){
  const m=currentMatch(),x=meta(m);if(!m||!x)return;
  const c=clipById(cid);if(!c)return;
  if(!confirm(`¿Eliminar el clip “${c.name}”?`))return;
  x.clips=x.clips.filter(k=>String(k.id)!==String(cid));
  if(state.playingClipId===cid)stopPlayback();save();render();stampStatus('Clip eliminado','good');
};
window.scoutV720Edit=function(cid){
  const c=clipById(cid);if(!c)return;
  const name=prompt('Nombre del clip:',c.name);if(name===null)return;
  const note=prompt('Nota del clip:',c.note||'');if(note===null)return;
  c.name=String(name).trim()||c.name;c.note=String(note).trim();c.updatedAt=new Date().toISOString();
  save();render();stampStatus('Clip actualizado','good');
};
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
window.scoutV720ExportCSV=function(){
  const m=currentMatch();if(!m)return;
  const rows=[['Nombre','Etiqueta','Inicio','Fin','Duracion_s','Tipo','Set','Equipo','Fundamento','Evaluacion','Jugador','Nota','SourceKey']];
  clips(m).forEach(c=>rows.push([c.name,TAGS[c.tag]||c.tag,c.start,c.end,c.duration,c.type,c.set,c.team,c.skill,c.evaluation,c.player,c.note,c.sourceKey]));
  downloadText(rows.map(r=>r.map(csvEscape).join(',')).join('\n'),`${slug(m.date||'partido')}_${slug(m.opponent||'rival')}_clips.csv`,'text/csv;charset=utf-8');
  stampStatus('CSV de clips descargado','good');
};
window.scoutV720ExportJSON=function(){
  const m=currentMatch();if(!m)return;
  const payload={version:VERSION,exportedAt:new Date().toISOString(),match:{id:m.id,date:m.date,team:teamName(),opponent:m.opponent},video:{source:meta(m)?.source||'',syncOffset:meta(m)?.syncOffset??null},clips:clips(m)};
  downloadText(JSON.stringify(payload,null,2),`${slug(m.date||'partido')}_${slug(m.opponent||'rival')}_clips.json`,'application/json;charset=utf-8');
  stampStatus('JSON de clips descargado','good');
};
function exportOverlay(msg){
  let el=$('scout-v720-exporting');if(!el){el=document.createElement('div');el.id='scout-v720-exporting';el.className='scout-v720-exporting';document.body.appendChild(el)}
  el.textContent=msg;return el;
}
function removeExportOverlay(){const el=$('scout-v720-exporting');if(el)el.remove()}
function supportedMime(){
  if(typeof MediaRecorder==='undefined')return '';
  const types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
}
async function waitEvent(target,name,timeout=7000){
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(ok,e)=>{if(done)return;done=true;clearTimeout(timer);target.removeEventListener(name,on);ok?resolve(e):reject(new Error(`Timeout ${name}`))};
    const on=e=>finish(true,e);target.addEventListener(name,on,{once:true});
    const timer=setTimeout(()=>finish(false),timeout);
  });
}
window.scoutV720ExportWebM=async function(cid){
  if(state.exporting)return;
  const c=clipById(cid),v=video();if(!c||!v?.src)return;
  const capture=v.captureStream||v.mozCaptureStream;
  if(typeof capture!=='function'||typeof MediaRecorder==='undefined'){
    alert('Este navegador no permite exportar el recorte de vídeo directamente. Puedes usar Chrome/Edge de escritorio o exportar la lista CSV/JSON.');
    return;
  }
  const range=normalizeRange(c.start,c.end);if(!range)return;
  const mime=supportedMime();if(!mime){alert('El navegador no dispone de un formato WebM compatible para exportar el clip.');return}
  state.exporting=true;
  const old={time:v.currentTime,rate:v.playbackRate,muted:v.muted,paused:v.paused};
  let recorder=null,stream=null,timer=null;
  try{
    exportOverlay(`Preparando “${c.name}”…`);
    v.pause();v.playbackRate=1;
    if(Math.abs(v.currentTime-range.start)>.08){v.currentTime=range.start;await waitEvent(v,'seeked')}
    stream=capture.call(v);
    const chunks=[];
    recorder=new MediaRecorder(stream,{mimeType:mime});
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    const stopped=new Promise(resolve=>recorder.addEventListener('stop',resolve,{once:true}));
    recorder.start(250);
    exportOverlay(`Exportando “${c.name}” · ${durationText(range.end-range.start)}`);
    await v.play();
    await new Promise((resolve,reject)=>{
      const check=()=>{if(v.currentTime>=range.end-.04){cleanup();resolve()}};
      const error=()=>{cleanup();reject(new Error('Error de reproducción'))};
      const cleanup=()=>{v.removeEventListener('timeupdate',check);v.removeEventListener('error',error);if(timer)clearTimeout(timer)};
      v.addEventListener('timeupdate',check);v.addEventListener('error',error,{once:true});
      timer=setTimeout(()=>{cleanup();resolve()},Math.max(3000,(range.end-range.start+2)*1800));
    });
    v.pause();if(recorder.state!=='inactive')recorder.stop();await stopped;
    const blob=new Blob(chunks,{type:mime});if(!blob.size)throw new Error('El navegador no generó datos de vídeo.');
    downloadBlob(blob,`${slug(c.name)}.webm`);
    stampStatus('Clip WebM exportado','good');
  }catch(err){
    console.error('V7.2 WebM export',err);
    alert('No se ha podido exportar este clip como WebM. La definición del clip sigue guardada y puedes exportarla en CSV/JSON.');
  }finally{
    try{if(recorder&&recorder.state!=='inactive')recorder.stop()}catch(_){}
    try{stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
    try{v.playbackRate=old.rate||1;v.currentTime=old.time||0;if(!old.paused)v.play().catch(()=>{})}catch(_){}
    state.exporting=false;removeExportOverlay();
  }
};
window.scoutV720Diagnostics=function(){
  const m=currentMatch();
  return {version:VERSION,matchId:m?.id||null,clips:clips(m).length,markers:{in:state.in,out:state.out},videoLoaded:!!video()?.src,captureStream:typeof (video()?.captureStream||video()?.mozCaptureStream)==='function',mediaRecorder:typeof MediaRecorder!=='undefined'};
};

const timeline=$('scout-v700-timeline');
if(timeline&&!timeline.dataset.v720Observed){
  timeline.dataset.v720Observed='1';
  new MutationObserver(()=>decorateTimeline()).observe(timeline,{childList:true,subtree:true});
}
const modal=$('scout-v700-video-modal');
if(modal&&!modal.dataset.v720Observed){
  modal.dataset.v720Observed='1';
  new MutationObserver(()=>{decorateTimeline();render()}).observe(modal,{attributes:true,attributeFilter:['class']});
}
const v=video();
if(v&&!v.dataset.v720Bound){
  v.dataset.v720Bound='1';
  v.addEventListener('timeupdate',()=>{
    if(state.playlistStop!=null&&v.currentTime>=state.playlistStop-.04){
      v.pause();
      if(state.playlist.length)nextPlaylist();else{state.playingClipId=null;state.playlistStop=null;render()}
    }
  });
  v.addEventListener('ended',()=>{if(state.playlist.length)nextPlaylist();else stopPlayback()});
}

const baseOpen=window.scoutV700OpenVideo;
window.scoutV700OpenVideo=function(context=''){
  const out=baseOpen?.(context);setTimeout(()=>{render();decorateTimeline()},0);return out;
};
const baseChanged=window.scoutV700MatchChanged;
window.scoutV700MatchChanged=function(){
  state.in=null;state.out=null;stopPlayback();
  const out=baseChanged?.();setTimeout(()=>{render();decorateTimeline()},0);return out;
};

document.addEventListener('keydown',e=>{
  const modal=$('scout-v700-video-modal');
  if(!modal?.classList.contains('open'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();
  if(['input','select','textarea'].includes(tag))return;
  if(e.key.toLowerCase()==='i'){e.preventDefault();window.scoutV720MarkIn()}
  else if(e.key.toLowerCase()==='o'){e.preventDefault();window.scoutV720MarkOut()}
  else if(e.key.toLowerCase()==='c'&&state.in!=null&&state.out!=null){e.preventDefault();window.scoutV720CreateManual()}
});

setTimeout(()=>{render();decorateTimeline()},0);
})();

/* VC20710_SOURCE_END:026-v720-clip-studio-module.js */
;
