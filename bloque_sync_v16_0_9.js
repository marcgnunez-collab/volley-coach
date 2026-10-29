(()=>{
'use strict';
/* V16.0.9 · Motor de sincronización entre dispositivos.
   Corrige:
   1) Las marcas de tiempo del servidor ("…+00:00", microsegundos) se comparaban como TEXTO con las del
      cliente ("…Z", milisegundos) → verificación y detección de conflictos siempre fallaban.
   2) El "conflicto" era permanente y sin salida. Ahora se FUSIONA con la lógica existente
      (aplicarEstadoCloud → mergeRemoteState, con tombstones) y después se sube.
   3) Escritura con comparación atómica (compare-and-swap sobre updated_at): nunca pisa lo que otro
      dispositivo haya subido entre la lectura y la escritura.
   4) Un pull "solo lectura" cancelaba el temporizador de subida pendiente (hasta 2 min de retraso).
   5) Lecturas ligeras (solo updated_at) cuando no hay nada nuevo; sin releer todo el estado tras cada subida. */
const VERSION='16.0.9';
const PASSIVE_INTERVAL_MS=120000;
const VISIBLE_MIN_GAP_MS=30000;
const QUIET_SCOUT_MS=1100;
const QUIET_NORMAL_MS=2600;
const MAX_DIRTY_SCOUT_MS=3200;
const MAX_DIRTY_NORMAL_MS=9000;
const MAX_ATTEMPTS=3;
const PREMERGE_BACKUP_GAP_MS=600000;
const DIRTY_KEY='v1523_cloud_dirty';
const REMOTE_STAMP_KEY='v1523_remote_stamp';
const BASE_KEY='v1603_base_remote_stamp';
const MERGE_KEY='v1609_last_merge';

/* ---------- utilidades ---------- */
function canonical(value){return JSON.stringify(value,function(k,v){if(v&&typeof v==='object'&&!Array.isArray(v)){const sorted={};for(const key of Object.keys(v).sort())sorted[key]=v[key];return sorted}return v})}
function stampMs(s){
  if(!s)return NaN;
  let t=String(s).trim().replace(' ','T');
  if(!/(Z|[+-]\d{2}(:?\d{2})?)$/i.test(t))t+='Z';              /* sin zona horaria → UTC */
  t=t.replace(/([+-]\d{2})$/,'$1:00').replace(/([+-]\d{2})(\d{2})$/,'$1:$2');
  t=t.replace(/(\.\d{3})\d+/,'$1');                             /* microsegundos → milisegundos */
  return Date.parse(t);
}
function sameStamp(a,b){const x=stampMs(a),y=stampMs(b);if(Number.isFinite(x)&&Number.isFinite(y))return x===y;return String(a||'')===String(b||'')}
function hashText(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return s.length+':'+h}
function fingerprint(state){try{const c={...state};delete c.updatedAt;delete c.v138SyncMeta;return hashText(JSON.stringify(c))}catch(_){return ''}}
function staleError(){const e=new Error('La nube cambió mientras se guardaba');e.code='VC_STALE';return e}

/* ---------- estado ---------- */
let mutationGeneration=0,lastVerifiedAt=0,lastVerificationError='';
let dirty=localStorage.getItem(DIRTY_KEY)==='1';
let dirtySince=dirty?Date.now():0,dirtyTimer=null,syncPromise=null;
let lastReadAt=Number(localStorage.getItem('v962_last_read_at'))||0;
let lastWriteAt=Number(localStorage.getItem('v962_last_write_at'))||0;
let reads=Number(sessionStorage.getItem('v962_reads'))||0,writes=Number(sessionStorage.getItem('v962_writes'))||0,skippedWrites=Number(sessionStorage.getItem('v962_skipped_writes'))||0;
let failureCount=0,lastSyncError='',retryNotBefore=0,staleRetries=0,merges=0,lightChecks=0,casBroken=false;
let lastMerge=null;try{lastMerge=JSON.parse(localStorage.getItem(MERGE_KEY)||'null')}catch(_){}
/* Marca de la última versión de la nube que ESTE dispositivo ya ha aplicado/fusionado o subido.
   Se guarda tal cual la devuelve el servidor y se compara siempre por instante (no por texto). */
let syncedStamp=(()=>{const a=localStorage.getItem(BASE_KEY)||'',b=localStorage.getItem(REMOTE_STAMP_KEY)||'';if(!a)return b;if(!b)return a;const x=stampMs(a),y=stampMs(b);return(Number.isFinite(y)&&(!Number.isFinite(x)||y>x))?b:a})();
let syncedFingerprint='';
/* El bloqueo permanente de V16.0.3 ya no existe: se limpia cualquier marca antigua de "conflicto". */
try{localStorage.removeItem('v1603_sync_conflict')}catch(_){}

function markSynced(stamp){
  syncedStamp=String(stamp||'');
  try{if(syncedStamp){localStorage.setItem(BASE_KEY,syncedStamp);localStorage.setItem(REMOTE_STAMP_KEY,syncedStamp);localStorage.setItem('volleyCloudLastSync',syncedStamp)}}catch(_){}
}
function persistCounters(){try{sessionStorage.setItem('v962_reads',String(reads));sessionStorage.setItem('v962_writes',String(writes));sessionStorage.setItem('v962_skipped_writes',String(skippedWrites))}catch(_){}}
function connected(){try{return !!cloudClient&&!!cloudUser}catch(_){return false}}
function activeScouting(){try{return !!window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()}catch(_){return false}}
function localState(){return typeof estadoLocal==='function'?estadoLocal():null}
function setStatus(text,kind='online'){try{setCloudUI?.(kind,text)}catch(_){}}
function setDirty(v){dirty=!!v;try{dirty?localStorage.setItem(DIRTY_KEY,'1'):localStorage.removeItem(DIRTY_KEY)}catch(_){};if(!dirty)dirtySince=0}
function markDirty(reason='change'){
  mutationGeneration++;
  if(typeof cloudApplying!=='undefined'&&cloudApplying)return false;
  if(!dirty)dirtySince=Date.now();
  setDirty(true);scheduleDirty(reason);return true;
}
function scheduleDirty(reason='change'){
  if(!dirty||!connected())return;
  clearTimeout(dirtyTimer);
  const scout=activeScouting(),quiet=scout?QUIET_SCOUT_MS:QUIET_NORMAL_MS,max=scout?MAX_DIRTY_SCOUT_MS:MAX_DIRTY_NORMAL_MS;
  const elapsed=Math.max(0,Date.now()-(dirtySince||Date.now())),delay=Math.max(350,Math.min(quiet,Math.max(350,max-elapsed)));
  dirtyTimer=setTimeout(()=>void sync({reason:`dirty:${reason}`,manual:false,allowWrite:true}),Math.max(delay,retryNotBefore-Date.now()));
}

/* ---------- acceso a Supabase ---------- */
function touchRead(){reads++;persistCounters();lastReadAt=Date.now();try{localStorage.setItem('v962_last_read_at',String(lastReadAt))}catch(_){}}
async function readRemote(){
  if(!connected())return null;
  const {data,error}=await cloudClient.from('volley_state').select('state,updated_at').eq('user_id',cloudUser.id).maybeSingle();
  touchRead();if(error)throw error;return data||null;
}
async function readRemoteStamp(){
  if(!connected())return null;
  const {data,error}=await cloudClient.from('volley_state').select('updated_at').eq('user_id',cloudUser.id).maybeSingle();
  touchRead();lightChecks++;if(error)throw error;return data?String(data.updated_at||''):null;
}
/* expectedRaw = updated_at EXACTO (texto del servidor) de la versión sobre la que se basa este guardado.
   Si alguien ha escrito después, el UPDATE no afecta a ninguna fila → VC_STALE (y se fusiona de nuevo). */
async function writeRemote(state,expectedRaw){
  const protectedLocally=await window.VolleySafeCheckpoint?.checkpoint(state,'before-cloud-write');
  if(protectedLocally===false)throw new Error('No se pudo proteger el estado antes de subirlo');
  const uid=cloudUser.id,stampNow=new Date().toISOString(),table=()=>cloudClient.from('volley_state');
  const rowsOf=r=>Array.isArray(r.data)?r.data:(r.data?[r.data]:[]);
  if(expectedRaw&&!casBroken){
    const res=await table().update({state,updated_at:stampNow}).eq('user_id',uid).eq('updated_at',expectedRaw).select('updated_at');
    if(!res.error){
      writes++;persistCounters();
      const rows=rowsOf(res);
      if(!rows.length){staleRetries++;throw staleError()}
      lastWriteAt=Date.now();try{localStorage.setItem('v962_last_write_at',String(lastWriteAt))}catch(_){}
      return String(rows[0].updated_at||stampNow);
    }
    /* Solo si el problema es de "forma de la consulta" (tipo de columna, etc.) se degrada a upsert. */
    if(!/^(22|42)/.test(String(res.error.code||'')))throw res.error;
    casBroken=true;console.warn('V16.0.9 CAS no disponible, se usa upsert',res.error);
  }
  const res=await table().upsert({user_id:uid,state,updated_at:stampNow},{onConflict:'user_id'}).select('updated_at');
  writes++;persistCounters();if(res.error)throw res.error;
  const rows=rowsOf(res);
  if(!rows.length)throw new Error('La nube no confirmó la escritura (revisa las políticas RLS de volley_state)');
  lastWriteAt=Date.now();try{localStorage.setItem('v962_last_write_at',String(lastWriteAt))}catch(_){}
  return String(rows[0].updated_at||stampNow);
}
async function verifyWrite(state,savedRaw){
  const c=await readRemote();
  if(!c)throw new Error('No se pudo comprobar el guardado en la nube');
  if(!sameStamp(c.updated_at,savedRaw))return true;   /* otro dispositivo ha escrito justo después: no es un fallo */
  if(canonical(c.state)!==canonical(state)){lastVerificationError='El contenido guardado en la nube no coincide con el enviado';throw new Error(lastVerificationError)}
  lastVerifiedAt=Date.now();lastVerificationError='';return true;
}

/* ---------- fusión (en vez de bloqueo) ---------- */
async function backupBeforeMerge(){
  try{
    const last=Number(localStorage.getItem('v1609_last_prefusion_backup'))||0;
    if(Date.now()-last>=PREMERGE_BACKUP_GAP_MS){
      await window.VolleyBackups?.save?.('pre-fusion-nube');
      localStorage.setItem('v1609_last_prefusion_backup',String(Date.now()));
    }
  }catch(e){console.warn('V16.0.9 copia previa a la fusión',e)}
  try{await window.VolleySafeCheckpoint?.checkpoint(localState(),'pre-merge-local')}catch(_){}
}
function recordMerge(remoteStamp,reason){
  merges++;lastMerge={at:new Date().toISOString(),remoteStamp:String(remoteStamp||''),reason:String(reason||'')};
  try{localStorage.setItem(MERGE_KEY,JSON.stringify(lastMerge))}catch(_){}
}
function applyRemote(state){
  if(typeof window.aplicarEstadoCloud!=='function')throw new Error('aplicarEstadoCloud no está disponible');
  window.aplicarEstadoCloud(state);
}

function renderVisible(){const id=document.querySelector('.view.active')?.id||'';try{if(id==='dashboard')renderDashboard?.();else if(id==='entrenamiento'){renderizarSesion?.();cargarMeta?.()}else if(id==='ejercicios')filtrarEjercicios?.();else if(id==='planificacion')renderPlanificacion?.();else if(id==='historial')renderHistorial?.();else if(id==='estadisticas')renderStats?.();else if(id==='jugadores'){renderPlayers?.();renderDashboardPlayers?.()}else if(id==='scout-workspace-v900'){window.v900RenderFast?.();window.VC_V121?.render?.();window.VC_V123?.render?.();window.v119RefreshPro?.()}else if(id==='scout-match-mode'){window.v800Render?.()}else if(id==='scout-analysis'){window.scoutRenderAnalysis?.()}else if(id==='scout-season'){window.VC_V151?.render?.()}}catch(_){}}

/* ---------- ciclo de sincronización ---------- */
async function cycle(o){
  const {manual,allowWrite,pullOnly,reason}=o;
  const out={applied:false,merged:false,wrote:false,unchanged:false,verified:false};
  let lastExpected='';
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    /* 1) Comprobación ligera: si no hay nada pendiente y la nube no ha cambiado, no se descarga el estado. */
    if(attempt===1&&!dirty&&!manual&&syncedStamp){
      const head=await readRemoteStamp();
      if(head&&sameStamp(head,syncedStamp)){out.unchanged=true;return out}
    }
    /* 2) Lectura completa */
    const remote=await readRemote();
    const rStamp=String(remote?.updated_at||'');
    const hasState=!!(remote&&remote.state&&typeof remote.state==='object');
    const isNew=hasState&&(!syncedStamp||!sameStamp(rStamp,syncedStamp));
    if(hasState&&!dirty&&(manual||isNew)){
      applyRemote(remote.state);out.applied=true;markSynced(rStamp);syncedFingerprint='';
    }else if(hasState&&dirty&&isNew){
      /* La nube cambió mientras había ediciones locales sin subir: FUSIONAR (no descartar ni sobrescribir). */
      setStatus('Fusionando cambios de otro dispositivo…','syncing');
      await backupBeforeMerge();
      applyRemote(remote.state);out.applied=true;out.merged=true;markSynced(rStamp);syncedFingerprint='';
      recordMerge(rStamp,reason);
    }
    /* 3) ¿Hay que escribir? (un pull "solo lectura" deja el cambio pendiente y se reprograma al final) */
    const needWrite=allowWrite&&!pullOnly&&(dirty||!hasState);
    if(!needWrite)return out;
    const state=localState();if(!state)return out;
    const fp=fingerprint(state);
    if(hasState&&dirty&&!out.merged&&fp&&fp===syncedFingerprint){setDirty(false);skippedWrites++;persistCounters();out.unchanged=true;return out}  /* sin cambios reales desde la última subida */
    const gen=mutationGeneration;
    let saved;
    try{saved=await writeRemote(state,hasState&&rStamp?rStamp:'')}
    catch(err){
      if(err&&err.code==='VC_STALE'){
        if(lastExpected&&sameStamp(lastExpected,rStamp)){
          /* La versión no cambia pero el UPDATE no afecta a ninguna fila → permisos (RLS), no una carrera. */
          throw new Error('La nube rechaza la escritura (revisa las políticas UPDATE de volley_state). Los datos locales siguen protegidos.');
        }
        lastExpected=rStamp;continue;
      }
      throw err;
    }
    out.wrote=true;markSynced(saved);syncedFingerprint=fp;
    if(mutationGeneration===gen)setDirty(false);   /* si hubo cambios durante la subida, sigue pendiente y se reprograma */
    if(manual){await verifyWrite(state,saved);out.verified=true}
    else lastVerifiedAt=Date.now();                 /* el servidor devolvió la fila escrita */
    return out;
  }
  throw new Error('La nube cambió varias veces seguidas durante el guardado. Se reintentará automáticamente.');
}

async function sync(opts={}){
  const {reason='auto',manual=false,allowWrite=true,pullOnly=false}=opts;
  if(syncPromise){
    /* Una petición que debe ESCRIBIR espera a la actual en lugar de perderse. */
    if(manual||(allowWrite&&!pullOnly&&dirty))return syncPromise.catch(()=>false).then(()=>sync(opts));
    return syncPromise;
  }
  if(!manual&&Date.now()<retryNotBefore){if(dirty)scheduleDirty('backoff');return false}
  if(!connected()){if(manual)alert('La nube no está conectada. Los datos siguen guardados en este dispositivo.');return false}
  if(!manual&&typeof navigator!=='undefined'&&navigator.onLine===false){setStatus(dirty?'Sin conexión · cambios pendientes':'Sin conexión','syncing');return false}
  clearTimeout(dirtyTimer);dirtyTimer=null;
  syncPromise=(async()=>{
    if(manual)setStatus('Sincronizando…','syncing');
    try{
      const r=await cycle({reason,manual,allowWrite,pullOnly});
      persistCounters();failureCount=0;lastSyncError='';retryNotBefore=0;
      if(r.applied)renderVisible();
      const status=document.getElementById('v956-scout-sync-status'),scoutCount=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()?.length||0;
      if(status)status.textContent=`${scoutCount} scouting${scoutCount===1?'':'s'} · ${dirty?'pendientes de sincronizar':'nube comprobada'}`;
      const label=dirty?'Cambios pendientes':(r.wrote?(r.verified?'Guardado verificado':'Guardado en la nube'):(r.merged?'Cambios fusionados':(r.applied?'Cambios recibidos':'Nube consultada')));
      setStatus(label,dirty?'syncing':'online');
      const indicator=document.getElementById('save-indicator');if(indicator)indicator.textContent=dirty?'Pendiente de nube':(r.wrote?'✓ '+label:'Nube consultada');
      if(manual)alert(r.wrote?(r.merged?'Cambios de otro dispositivo fusionados con los tuyos y guardados en la nube.':'Datos guardados y verificados en la nube.'):(r.applied?'Cambios de la nube recibidos.':'Nube comprobada. No había cambios pendientes.'));
      return r.applied||r.wrote;
    }catch(err){
      failureCount++;lastSyncError=String(err?.message||err||'Error de sincronización');console.warn('V16.0.9 cloud sync',reason,err);
      if(manual){setStatus('Error de sincronización','error');alert(`${lastSyncError}\n\nLos datos locales siguen protegidos.`)}
      else{
        const delay=Math.min(120000,Math.round(3000*Math.pow(2,Math.min(failureCount-1,5))));
        retryNotBefore=Date.now()+delay;setStatus(`Nube pendiente · reintento en ${Math.ceil(delay/1000)} s`,'syncing');
      }
      return false;
    }finally{
      syncPromise=null;
      if(dirty)scheduleDirty('post-sync');   /* nunca dejar un cambio pendiente sin temporizador */
    }
  })();
  return syncPromise;
}
async function forceSync(reason='manual'){const r=String(reason),isManual=(r==='manual'||r==='button');if(isManual&&dirty)setDirty(true);return sync({reason:r,manual:isManual,allowWrite:true})}

/* ---------- disparadores ---------- */
function visibilitySync(){
  if(!connected())return;
  if(document.visibilityState==='hidden'){if(dirty)void sync({reason:'hidden-flush',allowWrite:true});return}   /* móvil: subir antes de que el sistema suspenda la pestaña */
  if(document.visibilityState!=='visible')return;
  if(dirty)void sync({reason:'visible-dirty',allowWrite:true});
  else if(Date.now()-lastReadAt>=VISIBLE_MIN_GAP_MS)void sync({reason:'visible',allowWrite:false,pullOnly:true});
}
function onOnline(){if(!connected())return;if(dirty)void sync({reason:'online',allowWrite:true});else void sync({reason:'online-pull',allowWrite:false,pullOnly:true})}
const efficientSchedule=function(){return markDirty('autosave')};window.programarSubidaCloud=efficientSchedule;try{programarSubidaCloud=efficientSchedule}catch(_){}
const efficientUpload=function(manual=false){if(manual){setDirty(true);return sync({reason:'manual-upload',manual:true,allowWrite:true})}markDirty('legacy-upload');return Promise.resolve(true)};window.subirNube=efficientUpload;try{subirNube=efficientUpload}catch(_){}
const efficientDownload=function(manual=false){return sync({reason:'manual-download',manual:!!manual,allowWrite:false,pullOnly:true})};window.bajarNube=efficientDownload;try{bajarNube=efficientDownload}catch(_){}
window.v962ForceSync=forceSync;window.v962CloudOnline=onOnline;window.v953SyncNow=()=>sync({reason:'manual',manual:true,allowWrite:true});window.v956SyncScoutingsNow=()=>sync({reason:'manual-scout',manual:true,allowWrite:true});window.v957SyncScoutingsNow=window.v956SyncScoutingsNow;
setInterval(()=>{if(document.visibilityState==='visible'&&connected()){if(dirty)void sync({reason:'passive-dirty',allowWrite:true});else if(Date.now()-lastReadAt>=PASSIVE_INTERVAL_MS)void sync({reason:'passive',allowWrite:false,pullOnly:true})}},PASSIVE_INTERVAL_MS);
document.addEventListener('visibilitychange',visibilitySync);
setTimeout(()=>{if(connected()){if(dirty)void sync({reason:'startup-dirty',allowWrite:true});else void sync({reason:'startup',allowWrite:false,pullOnly:true})}},1200);
window.VC_V962_CLOUD_EFFICIENT={version:VERSION,markDirty,sync,forceSync,diagnostics:()=>({version:VERSION,connected:connected(),dirty,dirtySince:dirtySince||null,syncing:!!syncPromise,lastReadAt:lastReadAt||null,lastWriteAt:lastWriteAt||null,readsThisSession:reads,writesThisSession:writes,skippedWritesThisSession:skippedWrites,lightChecksThisSession:lightChecks,passiveIntervalSeconds:PASSIVE_INTERVAL_MS/1000,scoutingQuietSeconds:QUIET_SCOUT_MS/1000,scoutingMaxBatchSeconds:MAX_DIRTY_SCOUT_MS/1000,failureCount,lastSyncError:lastSyncError||null,fastRealtime:true,conflict:null,merges,lastMerge,staleRetries,compareAndSwap:!casBroken,syncedStamp:syncedStamp||null,baseRemoteStamp:syncedStamp||null,lastVerifiedAt:lastVerifiedAt||null,lastVerificationError:lastVerificationError||null,checkpoint:window.VolleySafeCheckpoint?.diagnostics?.()||null})};
})();
