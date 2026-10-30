/* Volley Coach V16.9.3 — motor único de sincronización conservadora.
   NO elimina ni sustituye datos en caso de conflicto. Realtime: avisos, no estados.
   Cada escritura cloud: copia local -> 3-way merge -> CAS -> verificación.
*/
(()=>{
'use strict';
const VERSION='16.9.3',DB='VolleyCoachSyncV1680',STORE='records',TABLE='volley_state',MISSING=Symbol('missing');
const LAUNCH_KEY='vc1680_sync_device',QUICK_WAIT=650,ACTIVE_POLL=3500,IDLE_POLL=11000,CONNECTION_CHECK=4000;
const now=()=>new Date().toISOString(),arr=x=>Array.isArray(x)?x:[],obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const clone=x=>x===MISSING?MISSING:x===undefined?undefined:JSON.parse(JSON.stringify(x));
const encoded=x=>x===MISSING?'[ABSENT]':JSON.stringify(x);
function stable(x){if(x===MISSING)return'[ABSENT]';if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(obj(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x)}
const equal=(a,b)=>a===MISSING&&b===MISSING||a!==MISSING&&b!==MISSING&&stable(a)===stable(b);
const own=(o,k)=>obj(o)&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:MISSING;
function keyFor(x,kind){if(!obj(x))return null;const v=kind==='seasonPlan'?x.weekStart:kind==='sets'?x.number:x.id;return v===undefined||v===null||v===''?null:String(v)}
function containsBusinessData(s){if(!obj(s))return false;const es=obj(s.equiposData)?Object.values(s.equiposData):[];return es.some(t=>['jugadores','historial','planificacion','partidos','scoutingMatches','teamGoals','seasonPlan','plantillas'].some(k=>arr(t?.[k]).length>0))}
function makeConflict(path,b,l,r){return {path,base:b===MISSING?null:clone(b),local:l===MISSING?null:clone(l),remote:r===MISSING?null:clone(r),localMissing:l===MISSING,remoteMissing:r===MISSING}}
function deletedIds(...states){const out={};for(const st of states){for(const [team,t] of Object.entries(st?.equiposData||{})){for(const [id,time] of Object.entries(t?.scoutingDeleted||{})){if(time){(out[team]??={})[id]=String(time)}}}}return out}
function enforceDeletions(st,deleted){if(!st)return st;st=clone(st);for(const [team,ids] of Object.entries(deleted)){const t=st.equiposData?.[team];if(!t)continue;t.scoutingDeleted={...(t.scoutingDeleted||{}),...ids};t.scoutingMatches=arr(t.scoutingMatches).filter(m=>!ids[String(m.id)]);if(ids[String(t.scoutingActiveId)])t.scoutingActiveId=null}return st}
function mergeThree(base,local,remote){
 const deleted=deletedIds(base,local,remote);base=enforceDeletions(base,deleted);local=enforceDeletions(local,deleted);remote=enforceDeletions(remote,deleted);
 const conflicts=[];
 function visit(b,l,r,path='',key=''){
  // An unexplained disappearance from the remote scouting archive is never applied.
  if(['scoutingMatches','sets','rallies','actions'].includes(key)&&Array.isArray(b)&&Array.isArray(l)&&Array.isArray(r)){
   const ids=x=>new Set(x.map(z=>keyFor(z,key)).filter(Boolean));
   const old=ids(b),localIds=ids(l),remoteIds=ids(r);
   const suspicious=[...old].filter(id=>localIds.has(id)&&!remoteIds.has(id));
   if(suspicious.length){conflicts.push(makeConflict(path,b,l,r));return clone(l)}
  }
  // Missing values in a partial local snapshot are NOT deletion requests.
  // Deletions must eventually use explicit tombstones; until then we block
  // remote erasure and preserve the last known copy for manual review.
  if(l===MISSING&&r!==MISSING)return clone(r);
  if(r===MISSING&&l!==MISSING){
    if(b!==MISSING)conflicts.push(makeConflict(path,b,l,r));
    return clone(l);
  }
  if(l===MISSING&&r===MISSING&&b!==MISSING){
    conflicts.push(makeConflict(path,b,l,r));
    return clone(b);
  }
  if(equal(l,r))return clone(l);
  // One-sided updates are not conflicts, but visit nested records so that
  // missing rallies/actions and partial replacements still reach the guards.
  const protectedList=['scoutingMatches','sets','rallies','actions'].includes(key);
  const traverse=(obj(l)&&obj(r))||(protectedList&&Array.isArray(l)&&Array.isArray(r));
  if(equal(b,l)&&!traverse){
   if(r===MISSING&&protectedList&&Array.isArray(l)&&l.length){
    conflicts.push(makeConflict(path,b,l,r));return clone(l);
   }
   return clone(r);
  }
  if(equal(b,r)&&!traverse)return clone(l);
  // A new device without previous baseline is not allowed to silently decide
  // which of two existing records is newer.
  if(key==='scoutingActiveId'||key==='currentWorkspace')return clone(l===MISSING?r:l);
  if(['version','bibliotecaVersion'].includes(key)){
    if(l===MISSING)return clone(r);if(r===MISSING)return clone(l);
    return clone(Math.max(Number(l)||0,Number(r)||0));
  }
  if(['updatedAt','createdAt','modifiedAt','manualSavedAt','reopenedAt','trainingUpdatedAt'].includes(key)&&l!==MISSING&&r!==MISSING){
   const lt=Date.parse(l)||0,rt=Date.parse(r)||0;return clone(lt>=rt?l:r);
  }
  if(Array.isArray(l)&&Array.isArray(r)){
   const canKey=x=>keyFor(x,key);
   const usable=a=>a.every(x=>canKey(x)!==null)&&new Set(a.map(canKey)).size===a.length;
   if(key==='rallies'&&!equal(b,l)&&!equal(b,r)){
    // Only independently changed rally histories are ambiguous. A single
    // remote writer MUST be accepted and rendered on the receiving device.
    conflicts.push(makeConflict(path,b,l,r));return clone(l);
   }
   if(usable(l)&&usable(r)&&(b===MISSING||Array.isArray(b)&&usable(b))){
    const bm=new Map((b===MISSING?[]:b).map(x=>[canKey(x),x]));
    const lm=new Map(l.map(x=>[canKey(x),x]));const rm=new Map(r.map(x=>[canKey(x),x]));
    const ids=[...new Set([...lm.keys(),...rm.keys(),...bm.keys()])];
    const out=[];
    for(const id of ids){const value=visit(bm.has(id)?bm.get(id):MISSING,lm.has(id)?lm.get(id):MISSING,rm.has(id)?rm.get(id):MISSING,path+'['+id+']',id);
      if(value!==MISSING)out.push(value);
    }
    if(key==='sets')out.sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0));
    return out;
   }
   conflicts.push(makeConflict(path,b,l,r));return clone(l);
  }
  if(obj(l)&&obj(r)&&(b===MISSING||obj(b))){
    const out={};const keys=new Set([...Object.keys(b===MISSING?{}:b),...Object.keys(l),...Object.keys(r)]);
    for(const k of keys){const v=visit(own(b,k),own(l,k),own(r,k),path?path+'.'+k:k,k);if(v!==MISSING)out[k]=v}
    return out;
  }
  // Any modification concurrent with a deletion or other value is a conflict.
  conflicts.push(makeConflict(path,b,l,r));return clone(l);
 }
 const merged=visit(base===undefined?MISSING:base,local===undefined?MISSING:local,remote===undefined?MISSING:remote);
 return {merged:enforceDeletions(merged,deleted),conflicts};
}
let database=null,dbPromise=null;
function openDb(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{
 try{if(!('indexedDB'in window))throw new Error('IndexedDB no disponible');const r=indexedDB.open(DB,1);
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};
 r.onsuccess=()=>{database=r.result;database.onversionchange=()=>{database.close();dbPromise=null};resolve(database)};
 r.onerror=()=>reject(r.error||new Error('No se pudo abrir IndexedDB'));
 }catch(e){reject(e)}
 }).catch(e=>{dbPromise=null;throw e});return dbPromise}
async function readRecord(key){const d=await openDb();return new Promise((resolve,reject)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error)})}
async function putRecord(row){const d=await openDb();return new Promise((resolve,reject)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(row);t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)})}
function userId(){try{return cloudClient&&cloudUser&&cloudUser.id?String(cloudUser.id):null}catch(_){return null}}
function cloud(){return typeof cloudClient!=='undefined'?cloudClient:null}
function localState(){
 // Do not call legacy estadoLocal() here: it invokes a version-selection merge.
 if(typeof guardarEquipoEnMemoria==='function')guardarEquipoEnMemoria();
 const teams=clone(typeof equiposData!=='undefined'?equiposData:{});
 const team=String(typeof equipoActivo!=='undefined'?equipoActivo:'');
 const current=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.();
 // A delayed/empty scouting bridge must not erase the persisted archive.
 if(team&&Array.isArray(current)&&(current.length||!arr(teams[team]?.scoutingMatches).length)){
  teams[team]=teams[team]||{};
  // The active in-memory scouting is authoritative while its debounced save is pending.
  teams[team].scoutingMatches=clone(current);
  const active=window.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.();
  if(active!==undefined&&active!==null)teams[team].scoutingActiveId=active;
 }
 return {version:16.8,bibliotecaCompartida:clone(typeof baseDeDatos!=='undefined'?baseDeDatos:[]),
   bibliotecaBorrados:typeof cargarBorradosBiblioteca==='function'?clone(cargarBorradosBiblioteca()):[],
   bibliotecaVersion:1,equiposData:teams};
}
function applyState(state){
 if(!obj(state)||!obj(state.equiposData))throw Error('Estado remoto inválido; aplicación cancelada');
 // Source state is already merged and checkpointed. Never call legacy aplicarEstadoCloud:
 // it includes an independent richness/timestamp merge and triggers another upload.
 const teamId=String(typeof equipoActivo!=='undefined'?equipoActivo:'');
 cloudApplying=true;
 try{
  equiposData=clone(state.equiposData);
  if(Array.isArray(state.bibliotecaCompartida))baseDeDatos=clone(state.bibliotecaCompartida);
  if(typeof guardarBorradosBiblioteca==='function'&&Array.isArray(state.bibliotecaBorrados))guardarBorradosBiblioteca(state.bibliotecaBorrados);
  if(typeof cargarEquipoEnVariables==='function'&&equiposData[teamId])cargarEquipoEnVariables(teamId);
  // Some old competition normalizers kept only a fixed list of fields.
  // Rehydrate the original official-match properties after their UI defaults.
  if(equiposData[teamId]&&typeof partidosEquipo!=='undefined'){
    const saved=arr(state.equiposData[teamId]?.partidos);
    const normalized=arr(partidosEquipo),byId=new Map(normalized.map(m=>[String(m.id),m]));
    partidosEquipo=saved.map(m=>({...byId.get(String(m.id)),...clone(m)}));
    equiposData[teamId].partidos=clone(partidosEquipo);
  }
  // Keep the full raw scouting object (including advanced fields). The compatibility
  // normalizer preserves extras when the in-memory bridge rehydrates the list.
  if(equiposData[teamId]&&window.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches){
    const raw=clone(state.equiposData[teamId]?.scoutingMatches||[]),active=state.equiposData[teamId]?.scoutingActiveId;
    window.VC_SCOUT_VIDEO_BRIDGE.replaceMatches(raw,active);
    equiposData[teamId].scoutingMatches=clone(raw);
    equiposData[teamId].scoutingActiveId=active??null;
  }
  guardarEstadoLocalSinCloud();
  // Refresh the ACTUAL visible professional scouting surfaces. scoutRender
  // alone only refreshes the legacy workspace, not the V8/V12 live scoreboard.
  const activeView=document.querySelector('.view.active')?.id||'';
  try{
   if(activeView==='scout-match-mode'){
    window.v910InvalidateMatchCaches?.();
    window.v800Render?.();
    window.v910MatchModeFastRender?.();
    window.VC_V121?.render?.();
    window.VC_V123?.render?.();
    window.v119RefreshPro?.();
   }else if(activeView==='scout-workspace-v900'){
    window.scoutRender?.();
    window.v900RenderFast?.();
    window.VC_V121?.render?.();
    window.VC_V123?.render?.();
    window.v119RefreshPro?.();
   }else if(activeView==='scout-analysis')window.scoutRenderAnalysis?.();
   else if(activeView==='scout-dashboard')window.scoutRenderHome?.();
   else if(activeView==='planificacion')window.renderPlanificacion?.();
   else if(activeView==='historial')window.renderHistorial?.();
   else if(activeView==='jugadores')window.renderPlayers?.();
   else if(activeView==='estadisticas')window.renderStats?.();
   else if(activeView==='entrenamiento')window.renderizarSesion?.();
   else if(activeView==='competicion')window.renderCompetition?.();
   else if(activeView==='dashboard')window.renderDashboard?.();
   window.MatchState?.sync?.('cloud-verified');
  }catch(e){console.warn('VC sync: vista no actualizada',e)}
  lastRemoteApplyAt=Date.now();
 }finally{cloudApplying=false}
}
function stampEqual(a,b){return String(a??'')===String(b??'')}
let deviceId=null;try{deviceId=localStorage.getItem(LAUNCH_KEY);if(!deviceId){deviceId='vc-'+(crypto.randomUUID?.()||String(Date.now())+'-'+Math.random());localStorage.setItem(LAUNCH_KEY,deviceId)}}catch(_){deviceId='vc-'+Math.random()}
let working=null,rerunNeeded=false,rerunForce=false,timer=null,captureTimer=null,signal=null,channel=null,channelUser='',realtimeStatus='DISCONNECTED',lastRealtimeAt=0,lastHintAt=0,lastRemoteApplyAt=0,remoteReads=0,changeRevision=0,lastCheck=0,lastPersisted=0,lastError='',status='Sin comprobar',pending=false,lastAck=null,conflictCount=0,remoteSeen=false,lastSavedHash='',lastLocalSave=0,seq=0,retries=0;
let outboxChain=Promise.resolve(),outboxFailure='',initPromise=null,initUser='',outboxHold=false,pauseWrites=false,writeConfirmedAt=0;
function setStatus(s){status=s;try{setCloudUI?.(s.includes('Error')||s.includes('Conflicto')?'error':s.includes('Guardando')?'syncing':'online',s)}catch(_){};
 const n=document.getElementById('vc1680-status');if(n)n.textContent=s;
 const old=document.getElementById('save-indicator');if(old&&s==='Nube confirmada ✓')old.textContent=s;
}
function connected(){return!!(userId()&&cloud())}
// Durable outbox: every mutation is captured before it may be sent to the cloud.
// Old records from V16.8.0/V16.8.1 remain readable for recovery.
async function checkpoint(reason='change',state=null){
 const snap=clone(state||localState()),uid=userId()||'disconnected';
 const row={key:'pending:'+uid,kind:'pending',dirty:pending,revision:changeRevision,at:now(),reason,account:uid,state:snap};
 outboxChain=outboxChain.catch(()=>{}).then(()=>putRecord(row));
 await outboxChain;outboxFailure='';lastLocalSave=Date.now();return snap;
}
async function archive(reason,state){const uid=userId()||'disconnected';const key='archive:'+uid+':'+Date.now()+':'+(++seq);
 await putRecord({key,kind:'archive',account:uid,reason,at:now(),state:clone(state)});return key}
async function capture(reason='change'){
 try{await checkpoint(reason);lastError='';return true}catch(e){outboxFailure=String(e?.message||e);lastError='Guardado local: '+outboxFailure;setStatus('Error: almacenamiento local insuficiente');return false}
}
function schedule(reason='change',delay=QUICK_WAIT){
 changeRevision++;pending=true;
 // Capture on every mutation, not after a timer that could be suspended by iOS.
 void capture('outbox:'+reason);
 clearTimeout(timer);timer=setTimeout(()=>void sync({reason,write:true}),delay);
}
async function markOutboxDone(rev){
 if(changeRevision!==rev||!userId())return false;
 const uid=userId();const row=await readRecord('pending:'+uid);
 if(!row||Number(row.revision)!==rev)return false;
 await putRecord({...row,dirty:false,confirmedAt:now()});return true;
}
async function initializeAccount(){
 const uid=userId();if(!uid)return false;
 if(initPromise&&initUser===uid)return initPromise;
 initUser=uid;initPromise=(async()=>{
  const row=await readRecord('pending:'+uid);if(!row||row.dirty!==true)return true;
  // Preserve unsent work across app restarts; never silently discard it.
  pending=true;const local=localState();const base=await loadBase();
  const merged=mergeThree(base?.state,local,row.state);
  if(merged.conflicts.length){
   await saveConflict(row.state,local,merged.conflicts,base?.stamp||null);
   outboxHold=true;setStatus('Recuperación pendiente: revisar copias antes de subir');return false;
  }
  if(!equal(local,merged.merged)){
   await archive('before-outbox-recovery',local);
   applyState(merged.merged);
  }
  setStatus('Cambios no enviados recuperados · pendiente de nube');return true;
 })().catch(e=>{lastError='Inicio seguro: '+String(e);outboxHold=true;setStatus('Error de recuperación local');return false});
 return initPromise;
}
async function readCloud(){const uid=userId();if(!uid)throw Error('Nube sin sesión');
 const {data,error}=await cloud().from(TABLE).select('state,updated_at').eq('user_id',uid).maybeSingle();if(error)throw error;
 return data||null;
}
async function readCloudStamp(){const uid=userId();if(!uid)throw Error('Nube sin sesión');
 const {data,error}=await cloud().from(TABLE).select('updated_at').eq('user_id',uid).maybeSingle();if(error)throw error;
 return data?.updated_at||null;
}
async function casWrite(s,stamp){const uid=userId(),sent=new Date(Math.max(Date.now(),(Date.parse(stamp)||0)+1)).toISOString();let res;
 if(stamp){res=await cloud().from(TABLE).update({state:s,updated_at:sent}).eq('user_id',uid).eq('updated_at',stamp).select('updated_at')}
 else{res=await cloud().from(TABLE).insert({user_id:uid,state:s,updated_at:sent}).select('updated_at')}
 if(res.error){if(res.error.code==='23505')return null;throw res.error}
 const rows=Array.isArray(res.data)?res.data:(res.data?[res.data]:[]);
 return rows.length?String(rows[0].updated_at):null;
}
async function loadBase(){const uid=userId();return uid?await readRecord('base:'+uid):null}
async function saveBase(stamp,state){await putRecord({key:'base:'+userId(),kind:'base',at:now(),stamp,state:clone(state)});lastAck=stamp}
async function saveConflict(remote,local,conflicts,stamp){
 const uid=userId(),key='conflict:'+uid+':'+Date.now()+':'+(++seq);
 await putRecord({key,kind:'conflict',at:now(),account:uid,stamp,conflicts,remote:clone(remote),local:clone(local)});
 conflictCount=conflicts.length;
 return key;
}
function integrateScoutMirror(st){
 if(!obj(st))return st;const s=clone(st);if(!obj(s.scoutingSyncIndex))return s;
 s.equiposData=obj(s.equiposData)?s.equiposData:{};
 for(const [id,entries] of Object.entries(s.scoutingSyncIndex)){
  if(!obj(s.equiposData[id]))s.equiposData[id]={};
  const existing=arr(s.equiposData[id].scoutingMatches);const seen=new Set(existing.map(x=>String(x?.id)));
  for(const m of arr(entries))if(m?.id!=null&&!seen.has(String(m.id))){existing.push(m);seen.add(String(m.id))}
  s.equiposData[id].scoutingMatches=existing;
 }
 return s;
}
// Never accept a cloud snapshot that omits ANY previously stored business record.
// This check is intentionally conservative: a legitimate removal is deferred for
// explicit conflict review rather than mistaken for stale-device data.
// Only use this to decide whether a READ can safely replace a stale device.
 // Values may legitimately change in the cloud; missing records or fields may not.
function remoteCoversLocal(local,remote){
 function covers(a,b,key=''){
  if(Array.isArray(a)){
   if(!Array.isArray(b))return false;
   const keyed=x=>x.every(z=>keyFor(z,key)!==null)&&new Set(x.map(z=>keyFor(z,key))).size===x.length;
   if(keyed(a)&&keyed(b)){
    const byId=new Map(b.map(x=>[keyFor(x,key),x]));
    return a.every(x=>{const id=keyFor(x,key);return byId.has(id)&&covers(x,byId.get(id),id)});
   }
   // Unkeyed arrays cannot be compared by identity; shortening is unsafe.
   return b.length>=a.length;
  }
  if(obj(a)){
   if(!obj(b))return false;
   return Object.keys(a).every(k=>Object.prototype.hasOwnProperty.call(b,k)&&covers(a[k],b[k],k));
  }
  // The field exists. Updated primitive values are legitimate server changes.
  return b!==undefined;
 }
 return covers(local,remote);
}

async function sync({reason='manual',write=false,force=false}={}){
 if(working){if(write||force||/remote|reconnect|postgres|hint|live/i.test(reason)){rerunNeeded=true;rerunForce=rerunForce||force}return working;}
 if(!connected()){setStatus('Sin sesión · guardado local');return false}
 if(typeof navigator!=='undefined'&&navigator.onLine===false){setStatus('Sin conexión · guardado local');return false}
 working=(async()=>{
  const uid=userId();
  try{
   if(!(await initializeAccount()))return false;
   if(outboxHold||pauseWrites){setStatus('Datos protegidos · revisión pendiente');return false}
   setStatus('Comprobando nube…');
   const revisionAtStart=changeRevision;
   const base=await loadBase(),initial=localState();
   // Legacy UI may mutate memory without signaling the cloud bridge.
   // Capture those edits before any cloud read can replace them.
   if(base&&!pending&&!equal(initial,base.state)){
    pending=true;changeRevision++;
    if(!(await capture('untracked-local-change')))return false;
    rerunNeeded=true;setStatus('Cambio local detectado · guardando antes de consultar');return false;
   }
   // An unchanged cloud version requires no multi-megabyte download or archive.
   if(base&&!pending&&!force&&equal(initial,base.state)){const head=await readCloudStamp();
     if(head&&stampEqual(head,base.stamp)){lastCheck=Date.now();setStatus('Nube confirmada ✓');return true}}
   const remote=await readCloud();remoteReads++;lastCheck=Date.now();
   const remoteState=remote?.state?integrateScoutMirror(remote.state):null,stamp=remote?.updated_at||null;
   const deletionSet=deletedIds(base?.state,initial,remoteState);
   const cloudSafe=enforceDeletions(remoteState,deletionSet),localSafe=enforceDeletions(initial,deletionSet);
   let joined;
   if(!remoteState){joined=localSafe}
   else if(!pending){
    // Reopening a phone is a READ, never a write. Do not merge its stale
    // incidental local timestamps back over the laptop's confirmed changes.
    // Preserve copies if remote would omit any previously recorded entity.
    if((base&&!equal(initial,base.state))||(!base&&!remoteCoversLocal(localSafe,cloudSafe))){
     await archive('stale-device-protected:'+reason,initial);
     await saveConflict(remoteState,initial,[makeConflict('local records absent from cloud',initial,initial,remoteState)],stamp);
     outboxHold=true;
     setStatus('Copias distintas · exportar y revisar (sin sobrescribir)');return false;
    }
    joined=clone(cloudSafe);
   }
   else if(!base&&!containsBusinessData(initial))joined=clone(remoteState);
   else {
    const result=mergeThree(base?.state,initial,remoteState);joined=result.merged;
    if(result.conflicts.length){
     await archive('before-conflict:'+reason,initial);
     await saveConflict(remoteState,initial,result.conflicts,stamp);
     outboxHold=true;
     setStatus('Conflicto protegido · revisión necesaria');pending=true;return false;
    }
   }
   // A new point may have been scored while the network read was in flight.
   // Never apply the snapshot captured before that action.
   if(changeRevision!==revisionAtStart){
     pending=true;setStatus('Hay cambios nuevos · reintentando sin sustituir datos');
     rerunNeeded=true;return false;
   }
   // Only changed/pending states require a full backup; polling must not fill IDB.
   const differences=!equal(initial,joined)||!equal(joined,remoteState);
   if(differences){
     await archive('before-mutation:'+reason,initial);
     if(remoteState)await archive('remote-before-merge:'+reason,remoteState);
   }
   if(!equal(initial,joined)){
    applyState(joined);
    await checkpoint('merged:'+reason,joined);
   }
   // Verified full pull can record its base only AFTER successful local apply.
   if(remoteState)await saveBase(stamp,remoteState);
   if(!equal(joined,remoteState)){
    // Never schedule an upload merely because an old device was opened.
    // A durable, explicit local mutation is required to send any state.
    if(!pending){
      await archive('divergent-readonly:'+reason,initial);
      await saveConflict(remoteState||{},initial,[makeConflict('not-authorized-for-write',remoteState||{},initial,joined)],stamp);
      outboxHold=true;
      setStatus('Diferencia conservada · subida bloqueada');return false;
    }
    if(!write){setStatus('Cambios locales pendientes · aún no enviados');return true}
    setStatus('Guardando en nube…');
    if(!(await capture('before-cloud-write'))){pending=true;return false}
    await outboxChain;
    if(changeRevision!==revisionAtStart){rerunNeeded=true;pending=true;return false}
    let saved=await casWrite(joined,stamp);
    if(!saved){pending=true;setStatus('Nube modificada · reintentando');
      // The next attempt must read the new confirmed revision before any write.
      rerunNeeded=true;return false;
    }
    const confirmed=await readCloud();
    if(!confirmed||!stampEqual(confirmed.updated_at,saved)||!equal(confirmed.state,joined)){
      pending=true;setStatus('Guardado sin verificar · reintentando');return false;
    }
    await saveBase(saved,confirmed.state);
    lastPersisted=Date.now();writeConfirmedAt=lastPersisted;pending=changeRevision!==revisionAtStart;
    if(!pending)await markOutboxDone(revisionAtStart);
    setStatus(pending?'Cambios adicionales pendientes':'Nube confirmada ✓');
    notify(saved);return true;
   }
   pending=changeRevision!==revisionAtStart;lastPersisted=Date.now();
   if(!pending)await markOutboxDone(revisionAtStart);
   setStatus(pending?'Cambios adicionales pendientes':'Nube confirmada ✓');return true;
  }catch(e){lastError=String(e?.message||e);pending=true;setStatus('Error de sincronización · datos locales protegidos');console.error('VC1680 sync',reason,e);return false}
  finally{working=null;if(rerunNeeded){const mustForce=rerunForce;rerunNeeded=false;rerunForce=false;setTimeout(()=>void sync({reason:'queued-retry',write:pending,force:mustForce}),180)}}
 })();return working;
}
function notify(stamp){
 try{const res=channel?.send({type:'broadcast',event:'vc1680-changed',payload:{deviceId,stamp,at:now()}});Promise.resolve(res).catch(()=>{});}catch(_){}
}
function queueRemote(reason){
 remoteSeen=true;lastHintAt=Date.now();clearTimeout(signal);
 signal=setTimeout(()=>{if(connected())void sync({reason:'remote-'+reason,write:pending,force:true})},170);
}
function disconnectChannel(){
 if(channel){try{cloud()?.removeChannel(channel)}catch(_){try{channel?.unsubscribe?.()}catch(__){}}}
 channel=null;channelUser='';realtimeStatus='DISCONNECTED';
}
function connect(){
 const uid=userId();if(!uid||!cloud()){disconnectChannel();return false}
 if(channel&&channelUser===uid&&(realtimeStatus==='SUBSCRIBED'||(['SUBSCRIBING','connecting'].includes(realtimeStatus)&&Date.now()-lastRealtimeAt<12000)))return true;
 disconnectChannel();channelUser=uid;realtimeStatus='connecting';lastRealtimeAt=Date.now();
 try{
  channel=cloud().channel('vc1680-'+uid,{config:{broadcast:{self:false}}})
   .on('broadcast',{event:'vc1680-changed'},m=>{if(m?.payload?.deviceId!==deviceId)queueRemote('broadcast')})
   .on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:'user_id=eq.'+uid},()=>queueRemote('postgres'))
   .subscribe(state=>{
     realtimeStatus=String(state||'');lastRealtimeAt=Date.now();
     if(realtimeStatus==='SUBSCRIBED')queueRemote('subscribed');
     const badge=document.getElementById('vc1681-realtime');if(badge)badge.textContent='Realtime: '+realtimeStatus+' · respaldo automático cada '+Math.round(ACTIVE_POLL/1000)+' s';
     if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(realtimeStatus)){
       setStatus('Realtime desconectado · recuperación por consulta');
       // The periodic connection watchdog retries. Do not reconnect recursively.
     }
   });
 return true
 }catch(e){lastError=String(e);disconnectChannel();realtimeStatus='CHANNEL_ERROR';return false}
}
async function restoreMissing(candidates){
 if(!Array.isArray(candidates)||!candidates.length)return {added:0,skipped:0};
 if(working)await working;
 pauseWrites=true;
 try{
  const state=localState();await archive('before-manual-scout-restore',state);
  let added=0,skipped=0;
  const restored=clone(state);restored.equiposData=restored.equiposData||{};
  for(const candidate of candidates){
   const team=String(candidate?.teamId||''),m=candidate?.match,id=Number(m?.id);
   if(!team||!Number.isFinite(id)||id<=0||!obj(m)||!Array.isArray(m.sets)){skipped++;continue}
   restored.equiposData[team]=restored.equiposData[team]||{};
   const list=arr(restored.equiposData[team].scoutingMatches);
   if(list.some(x=>Number(x?.id)===id)){skipped++;continue}
   list.push(clone(m));restored.equiposData[team].scoutingMatches=list;added++;
  }
  if(added){
   // No deletion: only missing match IDs are inserted; existing entries untouched.
   await putRecord({key:'restore-staging:'+Date.now(),kind:'archive',account:userId()||'disconnected',reason:'before-restore-apply',at:now(),state:clone(restored)});
   applyState(restored);schedule('restore-missing',1000);await capture('restore-missing');
  }
  return {added,skipped};
 }finally{pauseWrites=false}
}
async function deleteScouting(team,id){
 team=String(team);id=String(id);
 if(!userId()||outboxHold||pauseWrites)throw Error('Borrado bloqueado hasta sincronizar');
 if(working)await working;
 const t=equiposData?.[team],list=arr(t?.scoutingMatches);
 if(!list.some(m=>String(m.id)===id))throw Error('Scouting inexistente');
 await archive('before-delete:'+team+':'+id,localState());
 t.scoutingDeleted={...t.scoutingDeleted,[id]:now()};
 t.scoutingMatches=list.filter(m=>String(m.id)!==id);
 if(String(t.scoutingActiveId)===id)t.scoutingActiveId=null;
 guardarEstadoLocalSinCloud();schedule('delete-scouting');
 if(!(await capture('delete-scouting')))throw Error('Guardado protegido fallido');
 return true;
}
function onMutation(reason='change'){if(typeof cloudApplying!=='undefined'&&cloudApplying)return;
 schedule(reason);
}
function flush(reason='manual'){return sync({reason,write:true,force:true})}
function pull(reason='manual'){return sync({reason,write:false,force:true})}
async function exportDiag(){const data={version:VERSION,at:now(),deviceId,connected:connected(),pending,lastError,status,lastAck,conflictCount,lastPersisted,lastCheck,remoteSeen,outboxHold,outboxFailure,writeConfirmedAt,realtimeStatus,lastRealtimeAt,lastHintAt,lastRemoteApplyAt,remoteReads};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VolleyCoach_sync_diagnostico_V1691.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
async function exportProtected(){
 const d=await openDb();const list=await new Promise((resolve,reject)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)});
 const blob=new Blob([JSON.stringify({version:VERSION,exportedAt:now(),rows:list},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='VolleyCoach_sync_copias_protegidas_V1680.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)
}
function ensurePanel(){if(document.getElementById('vc1680-panel'))return;
 const shell=document.querySelector('#scout-workspace-v900 .v900-shell')||document.querySelector('#scout-workspace-v900');if(!shell)return;
 const el=document.createElement('section');el.id='vc1680-panel';el.style.cssText='padding:12px;background:#fff;border:1px solid #d9e2ec;border-radius:9px;margin:12px 0;font:12px Arial';
 const title=document.createElement('strong');title.textContent='Sincronización V16.9.3 · móvil sin sobrescritura';el.append(title);
 const state=document.createElement('div');state.id='vc1680-status';state.style.cssText='padding:8px 0';state.textContent=status;el.append(state);
 for(const [label,fn] of [['Guardar en nube',()=>flush('manual')],['Comprobar nube',()=>pull('manual')],['Exportar copias',()=>exportProtected()],['Diagnóstico',()=>exportDiag()]]){
  const b=document.createElement('button');b.type='button';b.className='ghost';b.style.margin='3px';b.textContent=label;b.onclick=()=>{void Promise.resolve(fn()).catch(e=>alert(String(e)))};el.append(b)
 }
 shell.prepend(el)
}
function liveView(){
 const view=document.querySelector('.view.active')?.id||'';
 return ['scout-match-mode','scout-workspace-v900','scout-dashboard','entrenamiento','historial','planificacion','jugadores','estadisticas','competicion','dashboard'].includes(view);
}
let pollTimer=null;
function pollLoop(){
 clearTimeout(pollTimer);pollTimer=setTimeout(async()=>{
  try{if(connected()&&document.visibilityState==='visible'){
    connect();
    await sync({reason:'live-poll',write:pending});
  }}catch(e){lastError=String(e)}finally{pollLoop()}
 },liveView()?ACTIVE_POLL:IDLE_POLL);
}
function boot(){ensurePanel();connect();if(connected())void sync({reason:'startup',write:pending,force:true});
 window.addEventListener('online',()=>{connect();void sync({reason:'online',write:pending,force:true})});
 window.addEventListener('focus',()=>{connect();void sync({reason:'focus',write:pending,force:true})});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){connect();void sync({reason:'visible',write:pending,force:true})}else if(pending)void checkpoint('background')});
 window.addEventListener('pagehide',()=>{if(pending)void checkpoint('pagehide')});
 // Auth is initialized asynchronously in the old HTML. Prior boot-only connect()
 // silently left both devices without a Realtime subscription.
 setInterval(()=>{if(connected())connect();else if(channel)disconnectChannel()},CONNECTION_CHECK);
 pollLoop();
}
window.VC_SYNC_V1680={version:VERSION,onMutation,flush,pull,sync,connect,capture,exportProtected,exportDiag,restoreMissing,initializeAccount,
 mergeThree,remoteCoversLocal,deleteScouting,diagnostics:()=>({version:VERSION,connected:connected(),pending,syncing:!!working,status,lastAck,lastPersisted,lastCheck,lastError,conflictCount,deviceId,realtimeStatus,lastRealtimeAt,lastHintAt,lastRemoteApplyAt,remoteReads,pollActiveMs:ACTIVE_POLL,outboxHold,outboxFailure,writeConfirmedAt})};
window.VC_V962_CLOUD_EFFICIENT={version:VERSION,markDirty:()=>{schedule('legacy-mark')},sync:options=>sync({reason:options?.reason||'legacy',write:options?.allowWrite!==false&&!options?.pullOnly}),forceSync:flush,diagnostics:()=>({...window.VC_SYNC_V1680.diagnostics(),dirty:pending,lastWriteAt:lastPersisted,compareAndSwap:true})};
window.VC_DEVICE_SYNC={version:VERSION,connect,broadcast:()=>{},notifyCloudChanged:notify,diagnostics:()=>({deviceId,realtimeState:realtimeStatus,cloudConnected:connected()})};
window.v962ForceSync=flush;window.v953SyncNow=flush;window.v956SyncScoutingsNow=flush;window.v957SyncScoutingsNow=flush;window.v138SyncNow=pull;
const scheduleCompat=()=>schedule('legacy-save');
try{programarSubidaCloud=scheduleCompat;subirNube=(manual=false)=>flush(manual?'manual':'legacy-upload');bajarNube=(manual=false)=>pull(manual?'manual':'legacy-pull')}catch(e){console.warn('VC1680 compat',e)}
window.programarSubidaCloud=scheduleCompat;window.subirNube=manual=>flush(manual?'manual':'legacy-upload');window.bajarNube=manual=>pull(manual?'manual':'legacy-pull');
// Capture every remaining local-only mutation (not just callbacks that call programarSubidaCloud).
// This closes a historical gap where UI buttons updated memory and localStorage but not Supabase.
let vcLastUserGesture=0;
for(const evt of ['pointerdown','keydown','touchstart'])window.addEventListener(evt,()=>{vcLastUserGesture=Date.now()},{passive:true,capture:true});
try{const originalLocalSave=guardarEstadoLocalSinCloud;
 if(typeof originalLocalSave==='function'&&!originalLocalSave.__v1680){
  const hooked=function(...args){const out=originalLocalSave.apply(this,args);
    // Legacy boot/render paths call local saves even without editing.
    // True scout-save and cloud-schedule hooks continue working independently.
    if(!cloudApplying&&Date.now()-vcLastUserGesture<3000)onMutation('local-storage-save');return out};
  hooked.__v1680=true;guardarEstadoLocalSinCloud=hooked;window.guardarEstadoLocalSinCloud=hooked;
 }}catch(e){console.warn('VC1680 local save bridge',e)}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
