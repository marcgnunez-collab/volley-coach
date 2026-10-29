/* Volley Coach 16.2.0 · Sync Fast & Quiet: reemplaza el bloque v962 de V16.1.3 */
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
const VERSION='16.2.0';
const PASSIVE_INTERVAL_MS=180000;
const VISIBLE_MIN_GAP_MS=8000;
const QUIET_SCOUT_MS=450;
const QUIET_NORMAL_MS=850;
const MAX_DIRTY_SCOUT_MS=1400;
const MAX_DIRTY_NORMAL_MS=2800;
const MAX_ATTEMPTS=3;
const PREMERGE_BACKUP_GAP_MS=600000;
const DIRTY_KEY='v1523_cloud_dirty';
const REMOTE_STAMP_KEY='v1523_remote_stamp';
const BASE_KEY='v1603_base_remote_stamp';
const MERGE_KEY='v1609_last_merge';
const OWNER_KEY='v1620_cloud_owner';

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
let lastStatusText='',lastStatusKind='',currentUserId='',fastHeadSkips=0,mergedWritebacks=0,remoteNotifications=0;
let inFlightMode='',pendingWrite=false,queuedManual=false,accountBlocked=false;
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
let checkpointRequired=true; // Se conserva la copia local obligatoria antes de cada subida.
/* El bloqueo permanente de V16.0.3 ya no existe: se limpia cualquier marca antigua de "conflicto". */
try{localStorage.removeItem('v1603_sync_conflict')}catch(_){}

function markSynced(stamp){
  syncedStamp=String(stamp||'');
  try{if(syncedStamp){localStorage.setItem(BASE_KEY,syncedStamp);localStorage.setItem(REMOTE_STAMP_KEY,syncedStamp);localStorage.setItem('volleyCloudLastSync',syncedStamp)}}catch(_){}
}
function persistCounters(){try{sessionStorage.setItem('v962_reads',String(reads));sessionStorage.setItem('v962_writes',String(writes));sessionStorage.setItem('v962_skipped_writes',String(skippedWrites))}catch(_){}}
function connected(){try{return !!cloudClient&&!!cloudUser}catch(_){return false}}
function ensureUser(){
  if(!connected())return false;
  const uid=String(cloudUser.id||'');if(!uid)return false;
  if(currentUserId===uid)return !accountBlocked;
  const previous=localStorage.getItem(OWNER_KEY)||'';
  accountBlocked=!!(previous&&previous!==uid&&dirty);
  currentUserId=uid;
  if(previous&&previous!==uid){syncedStamp='';syncedFingerprint='';}
  if(!accountBlocked){try{localStorage.setItem(OWNER_KEY,uid)}catch(_){}}
  if(accountBlocked)setStatus('Cambios locales pendientes en otra cuenta','error');
  return !accountBlocked;
}
function activeScouting(){try{return !!window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()}catch(_){return false}}
function localState(){return typeof estadoLocal==='function'?estadoLocal():null}
function setStatus(text,kind='online'){
  if(text===lastStatusText&&kind===lastStatusKind)return;
  lastStatusText=text;lastStatusKind=kind;
  try{setCloudUI?.(kind,text)}catch(_){}
}
function setDirty(v){dirty=!!v;try{dirty?localStorage.setItem(DIRTY_KEY,'1'):localStorage.removeItem(DIRTY_KEY)}catch(_){};if(!dirty)dirtySince=0}
function markDirty(reason='change'){
  if(typeof cloudApplying!=='undefined'&&cloudApplying)return false;
  mutationGeneration++;
  if(!dirty)dirtySince=Date.now();
  setDirty(true);scheduleDirty(reason);return true;
}
function scheduleDirty(reason='change'){
  if(!dirty||!ensureUser())return;
  clearTimeout(dirtyTimer);
  const scout=activeScouting(),quiet=scout?QUIET_SCOUT_MS:QUIET_NORMAL_MS,max=scout?MAX_DIRTY_SCOUT_MS:MAX_DIRTY_NORMAL_MS;
  const elapsed=Math.max(0,Date.now()-(dirtySince||Date.now()));
  const delay=Math.max(150,Math.min(quiet,Math.max(150,max-elapsed)));
  const wait=Math.max(delay,retryNotBefore-Date.now());
  dirtyTimer=setTimeout(()=>void sync({reason:`dirty:${reason}`,allowWrite:true}),wait);
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
  let res;
  if(expectedRaw){
    /* CAS obligatorio: NUNCA degradar a upsert sin protección. */
    res=await table().update({state,updated_at:stampNow}).eq('user_id',uid).eq('updated_at',expectedRaw).select('updated_at');
    if(res.error){casBroken=true;throw new Error('La nube no permite comprobar la versión antes de escribir: '+String(res.error.message||res.error))}
    if(!rowsOf(res).length){staleRetries++;throw staleError()}
  }else{
    /* Primera fila: INSERT, nunca upsert que sobreescriba datos ajenos. */
    res=await table().insert({user_id:uid,state,updated_at:stampNow}).select('updated_at');
    if(res.error){if(String(res.error.code||'')==='23505'){staleRetries++;throw staleError()}throw res.error}
    if(!rowsOf(res).length)throw new Error('La nube no confirmó la creación (revisa RLS de volley_state)');
  }
  writes++;persistCounters();
  lastWriteAt=Date.now();try{localStorage.setItem('v962_last_write_at',String(lastWriteAt))}catch(_){}
  return String(rowsOf(res)[0].updated_at||stampNow);
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

/* aplicarEstadoCloud ya renderiza la vista activa; evitar una segunda pasada pesada. */
function renderVisible(){}

function hasLocalRecoveries(remoteState){
  const local=localState();if(!local||!remoteState)return false;
  const remoteTeams=remoteState.equiposData||{},localTeams=local.equiposData||{};
  const listNewer=(a,b,kind='normal')=>{
    const entries=Array.isArray(a)?a:[],received=new Map((Array.isArray(b)?b:[]).filter(x=>x&&x.id!=null).map(x=>[String(x.id),x]));
    return entries.some(x=>{
      if(!x||x.id==null)return false;
      const prev=received.get(String(x.id));if(!prev)return true;
      const t=Date.parse(x.updatedAt||x.modifiedAt||x.savedAt||x.manualSavedAt||'')||0;
      const u=Date.parse(prev.updatedAt||prev.modifiedAt||prev.savedAt||prev.manualSavedAt||'')||0;
      if(t>u)return true;
      if(kind==='scout'){
        const count=m=>(Array.isArray(m.sets)?m.sets:[]).reduce((n,s)=>n+(s.rallies?.length||0)+(s.rallies||[]).reduce((z,r)=>z+(r.actions?.length||0),0),0);
        return count(x)>count(prev);
      }
      return false;
    });
  };
  if(listNewer(local.bibliotecaCompartida,remoteState.bibliotecaCompartida))return true;
  for(const [id,team] of Object.entries(localTeams)){
    const r=remoteTeams[id]||{};
    for(const key of ['planificacion','historial','partidos','plantillas','jugadores']){
      if(listNewer(team?.[key],r?.[key]))return true;
    }
    if(listNewer(team?.scoutingMatches,[...(r.scoutingMatches||[]),...(remoteState.scoutingSyncIndex?.[id]||[])],'scout'))return true;
    for(const key of ['v953DeletedPlanIds','v953DeletedHistoryIds','v956DeletedScoutIds']){
      if(listNewer(team?.[key],r?.[key]))return true;
    }
    const localTraining=Date.parse(team?.trainingUpdatedAt||'')||0,cloudTraining=Date.parse(r?.trainingUpdatedAt||'')||0;
    if(localTraining>cloudTraining)return true;
  }
  return false;
}
/* ---------- ciclo de sincronización ---------- */
async function cycle(o){
  const {manual,allowWrite,pullOnly,reason}=o;
  const out={applied:false,merged:false,wrote:false,unchanged:false,verified:false};
  let lastExpected='',mustReadFull=!!(manual&&pullOnly);
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    /* La consulta ligera evita descargar megabytes al guardar un solo punto. */
    let remote=null,hasState=false,rStamp='',isNew=false;
    if(!mustReadFull&&syncedStamp){
      const head=await readRemoteStamp();
      if(head&&sameStamp(head,syncedStamp)){
        rStamp=head;hasState=true;fastHeadSkips++;
        if(!dirty){out.unchanged=true;return out}
      }else mustReadFull=true;
    }else mustReadFull=true;
    if(mustReadFull){
      remote=await readRemote();
      rStamp=String(remote?.updated_at||'');
      hasState=!!(remote&&remote.state&&typeof remote.state==='object');
      isNew=hasState&&(!syncedStamp||!sameStamp(rStamp,syncedStamp));
      if(hasState&&(isNew||(manual&&pullOnly))){
        const wasDirty=dirty;
        if(wasDirty){setStatus('Fusionando cambios…','syncing');await backupBeforeMerge()}
        applyRemote(remote.state);out.applied=true;
        markSynced(rStamp);syncedFingerprint='';
        if(wasDirty){out.merged=true;recordMerge(rStamp,reason)}
        else if(hasLocalRecoveries(remote.state)){
          /* La fusión recuperó información local no presente en la nube. */
          setDirty(true);dirtySince=Date.now();mergedWritebacks++;
          out.merged=true;recordMerge(rStamp,'writeback:'+reason);
        }
      }
    }
    const needWrite=allowWrite&&!pullOnly&&(dirty||!hasState);
    if(!needWrite)return out;
    const state=localState();if(!state)return out;
    const fp=fingerprint(state);
    if(hasState&&dirty&&!out.merged&&fp&&fp===syncedFingerprint){
      setDirty(false);skippedWrites++;persistCounters();out.unchanged=true;return out;
    }
    const gen=mutationGeneration;
    let saved;
    try{saved=await writeRemote(state,hasState?rStamp:'')}
    catch(err){
      if(err&&err.code==='VC_STALE'){
        if(lastExpected&&sameStamp(lastExpected,rStamp))throw new Error('La nube rechaza la escritura (comprueba permisos UPDATE y políticas RLS). Los datos locales siguen protegidos.');
        lastExpected=rStamp;mustReadFull=true;continue;
      }
      throw err;
    }
    out.wrote=true;markSynced(saved);syncedFingerprint=fp;
    if(mutationGeneration===gen)setDirty(false);
    if(manual){await verifyWrite(state,saved);out.verified=true}
    else lastVerifiedAt=Date.now();
    /* Evento pequeño; el otro dispositivo descarga por su cuenta, sin payloads gigantes. */
    try{window.VC_DEVICE_SYNC?.notifyCloudChanged?.(saved)}catch(_){}
    return out;
  }
  throw new Error('Varios cambios simultáneos. Reintentaremos; la copia local está protegida.');
}

async function sync(opts={}){
  const {reason='auto',manual=false,allowWrite=true,pullOnly=false}=opts;
  if(syncPromise){
    if(manual)return syncPromise.catch(()=>false).then(()=>sync(opts));
    if(allowWrite&&!pullOnly)pendingWrite=true;
    return syncPromise; // no crear cadenas de llamadas por cada punto o evento de foco
  }
  if(!ensureUser())return false;
  if(!manual&&Date.now()<retryNotBefore){if(dirty)scheduleDirty('backoff');return false}
  if(!manual&&typeof navigator!=='undefined'&&navigator.onLine===false){
    setStatus(dirty?'Sin conexión · guardado local':'Sin conexión',dirty?'error':'online');return false;
  }
  clearTimeout(dirtyTimer);dirtyTimer=null;
  inFlightMode=allowWrite&&!pullOnly?'write':'read';
  syncPromise=(async()=>{
    if(manual)setStatus('Sincronizando…','syncing');
    else if(dirty&&allowWrite&&!pullOnly)setStatus('Guardando cambios…','syncing');
    try{
      const r=await cycle({reason,manual,allowWrite,pullOnly});
      persistCounters();failureCount=0;lastSyncError='';retryNotBefore=0;
      if(r.applied)renderVisible();
      if(r.applied||r.wrote||dirty){
        const status=document.getElementById('v956-scout-sync-status'),scoutCount=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()?.length||0;
        if(status)status.textContent=`${scoutCount} scouting${scoutCount===1?'':'s'} · ${dirty?'pendientes de sincronizar':'nube al día'}`;
      }
      /* Una consulta sin cambios no modifica la interfaz ni dispara renders. */
      if(r.applied||r.wrote||dirty||lastStatusKind!=='online'){
        const label=dirty?'Cambios pendientes':(r.wrote?(r.verified?'Guardado verificado':'Nube al día'):(r.merged?'Cambios fusionados':(r.applied?'Actualizado desde otro dispositivo':'Nube al día')));
        setStatus(label,dirty?'syncing':'online');
        const indicator=document.getElementById('save-indicator');if(indicator)indicator.textContent=dirty?'Pendiente de nube':'✓ '+label;
      }
      if(manual)alert(r.wrote?'Datos guardados y comprobados en la nube.':r.applied?'Cambios recibidos de la nube.':'Nube al día; sin cambios pendientes.');
      return !!(r.applied||r.wrote);
    }catch(err){
      failureCount++;lastSyncError=String(err?.message||err||'Error de sincronización');
      console.warn('V16.2.0 cloud sync',reason,err);
      if(manual){setStatus('Error de sincronización','error');alert(`${lastSyncError}\n\nLos datos locales siguen protegidos.`)}
      else{
        const delay=Math.min(180000,Math.round(3500*Math.pow(2,Math.min(failureCount-1,6))));
        retryNotBefore=Date.now()+delay;
        /* Sin cuenta atrás parpadeante: se conserva el estado local y se reintenta sin bloquear la UI. */
        setStatus(dirty?'Cambios locales pendientes':'Nube temporalmente no disponible','error');
      }
      return false;
    }finally{
      syncPromise=null;inFlightMode='';
      if(dirty||pendingWrite){pendingWrite=false;if(dirty)scheduleDirty('post-sync')}
    }
  })();
  return syncPromise;
}

async function forceSync(reason='manual'){const r=String(reason),isManual=(r==='manual'||r==='button');if(isManual&&dirty)setDirty(true);return sync({reason:r,manual:isManual,allowWrite:true})}

/* ---------- disparadores ---------- */
let lastResumeCheck=0;
function visibilitySync(){
  if(!connected())return;
  if(document.visibilityState==='hidden'){if(dirty)void sync({reason:'hidden-flush',allowWrite:true});return}   /* móvil: subir antes de que el sistema suspenda la pestaña */
  if(document.visibilityState!=='visible')return;
  if(dirty)void sync({reason:'visible-dirty',allowWrite:true});
  else if(Date.now()-Math.max(lastReadAt,lastResumeCheck)>=VISIBLE_MIN_GAP_MS){lastResumeCheck=Date.now();void sync({reason:'visible',allowWrite:false,pullOnly:true})}
}
function onOnline(){if(!connected())return;retryNotBefore=0;if(dirty)void sync({reason:'online',allowWrite:true});else void sync({reason:'online-pull',allowWrite:false,pullOnly:true})}
const efficientSchedule=function(){return markDirty('autosave')};window.programarSubidaCloud=efficientSchedule;try{programarSubidaCloud=efficientSchedule}catch(_){}
const efficientUpload=function(manual=false){if(manual){if(!dirty){setDirty(true);dirtySince=Date.now()}return sync({reason:'manual-upload',manual:true,allowWrite:true})}markDirty('legacy-upload');return Promise.resolve(true)};window.subirNube=efficientUpload;try{subirNube=efficientUpload}catch(_){}
const efficientDownload=function(manual=false){return sync({reason:'manual-download',manual:!!manual,allowWrite:false,pullOnly:true})};window.bajarNube=efficientDownload;try{bajarNube=efficientDownload}catch(_){}
window.v962ForceSync=forceSync;window.v962CloudOnline=onOnline;window.v953SyncNow=()=>sync({reason:'manual',manual:true,allowWrite:true});window.v956SyncScoutingsNow=()=>sync({reason:'manual-scout',manual:true,allowWrite:true});window.v957SyncScoutingsNow=window.v956SyncScoutingsNow;
setInterval(()=>{
  if(document.visibilityState!=='visible'||!ensureUser())return;
  if(dirty)void sync({reason:'passive-dirty',allowWrite:true});
  else if(!window.VC_DEVICE_SYNC&&Date.now()-lastReadAt>=PASSIVE_INTERVAL_MS)void sync({reason:'passive',allowWrite:false,pullOnly:true});
},PASSIVE_INTERVAL_MS);
document.addEventListener('visibilitychange',visibilitySync);
setTimeout(()=>{if(connected()){if(dirty)void sync({reason:'startup-dirty',allowWrite:true});else void sync({reason:'startup',allowWrite:false,pullOnly:true})}},1200);
window.VC_V962_CLOUD_EFFICIENT={version:VERSION,markDirty,sync,forceSync,diagnostics:()=>({version:VERSION,fastHeadSkips,mergedWritebacks,remoteNotifications,inFlightMode,accountBlocked,connected:connected(),dirty,dirtySince:dirtySince||null,syncing:!!syncPromise,lastReadAt:lastReadAt||null,lastWriteAt:lastWriteAt||null,readsThisSession:reads,writesThisSession:writes,skippedWritesThisSession:skippedWrites,lightChecksThisSession:lightChecks,passiveIntervalSeconds:PASSIVE_INTERVAL_MS/1000,scoutingQuietSeconds:QUIET_SCOUT_MS/1000,scoutingMaxBatchSeconds:MAX_DIRTY_SCOUT_MS/1000,failureCount,lastSyncError:lastSyncError||null,fastRealtime:!!window.VC_DEVICE_SYNC?.diagnostics?.().realtimeState?.includes('SUBSCRIBED'),conflict:null,merges,lastMerge,staleRetries,compareAndSwap:!casBroken,syncedStamp:syncedStamp||null,baseRemoteStamp:syncedStamp||null,lastVerifiedAt:lastVerifiedAt||null,lastVerificationError:lastVerificationError||null,checkpoint:window.VolleySafeCheckpoint?.diagnostics?.()||null})};
})();
