/* Volley Coach V16.9.6 — sincronización CAS, sin sobrescritura silenciosa.
   Sustituye al motor V16.9.3. No carga motores antiguos en paralelo.
   La nube es un único documento por usuario; no se permite último-escritor-gana.
*/
(()=>{
'use strict';
if(window.VC_SYNC_V1696)return;
const VERSION='16.9.6',DB='VolleyCoachSyncV1696',STORE='records',TABLE='volley_state';
const MISSING=Symbol('missing'),ARR=Array.isArray,OBJECT=x=>x!==null&&typeof x==='object'&&!ARR(x);
const copy=x=>x===MISSING?MISSING:x===undefined?undefined:JSON.parse(JSON.stringify(x));
const timestamp=()=>new Date().toISOString();
function canonical(x){if(x===MISSING)return '[absent]';if(ARR(x))return '['+x.map(canonical).join(',')+']';if(OBJECT(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x)}
const eq=(a,b)=>canonical(a)===canonical(b);
const value=(o,k)=>OBJECT(o)&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:MISSING;
const user=()=>{try{return typeof cloudUser!=='undefined'&&cloudUser?.id&&typeof cloudClient!=='undefined'&&cloudClient?String(cloudUser.id):null}catch{return null}};
const client=()=>typeof cloudClient!=='undefined'?cloudClient:null;
let dbPromise=null;
function db(){if(dbPromise)return dbPromise;dbPromise=new Promise((ok,no)=>{
 try{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'key'})};q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error||new Error('IndexedDB falló'))}catch(e){no(e)}
 }).catch(e=>{dbPromise=null;throw e});return dbPromise}
async function get(key){const d=await db();return new Promise((ok,no)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).get(key);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>no(q.error)})}
async function put(row){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=()=>ok(true);tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error)})}
async function all(){const d=await db();return new Promise((ok,no)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>no(q.error)})}
async function remove(key){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>ok();tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error)})}
let savedBase=null,initializedFor='',pending=false,busy=null,revision=0,poll=null,pollSoon=null,applying=false,blocked=false,problem='',lastConfirm=null,lastRead=null,lastWrite=null,channel=null,channelUser=null;
let observed=null,commitQueue=Promise.resolve(),status='Arrancando sincronización…';
const id=()=>user()||'sin-sesion';
function setStatus(text){status=text;const node=document.getElementById('vc1696-status');if(node)node.textContent=text;try{if(typeof setCloudUI==='function')setCloudUI(blocked?'error':pending?'syncing':'online',text)}catch{}}
function baseKey(){return 'base:'+id()}function outboxKey(){return 'pending:'+id()}
function state(){
 // Team data from the old UI is retained; never trust a stale separate scout mirror.
 if(typeof guardarEquipoEnMemoria==='function')guardarEquipoEnMemoria();
 const teams=copy(typeof equiposData!=='undefined'?equiposData:{}),team=String(typeof equipoActivo!=='undefined'?equipoActivo:'');
 const live=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.();
 if(team&&OBJECT(teams[team])&&ARR(live)){
  // A truly empty bridge must not erase already persisted matches.
  if(live.length||!ARR(teams[team].scoutingMatches)||!teams[team].scoutingMatches.length){
   const deleted=teams[team].scoutingDeleted||{};
   teams[team].scoutingMatches=copy(live).filter(m=>!deleted[String(m?.id)]);
  }
 }
 return {version:16.8,bibliotecaCompartida:copy(typeof baseDeDatos!=='undefined'?baseDeDatos:[]),
  bibliotecaBorrados:typeof cargarBorradosBiblioteca==='function'?copy(cargarBorradosBiblioteca()):[],
  bibliotecaVersion:1,equiposData:teams};
}
function normalize(x){if(!OBJECT(x))return null;
 const teams=copy(OBJECT(x.equiposData)?x.equiposData:{});
 // Legacy cloud mirrors sometimes contain the only surviving copy of a scouting.
 for(const [team,items] of Object.entries(x.scoutingSyncIndex||{})){
  teams[team]??={};const seen=new Set((teams[team].scoutingMatches||[]).map(m=>String(m.id)));
  const list=ARR(teams[team].scoutingMatches)?teams[team].scoutingMatches:[];
  for(const m of ARR(items)?items:[])if(m?.id!=null&&!seen.has(String(m.id))&&!teams[team].scoutingDeleted?.[String(m.id)]){
   list.push(copy(m));seen.add(String(m.id));
  }
  teams[team].scoutingMatches=list;
 }
 return {version:16.8,bibliotecaCompartida:ARR(x.bibliotecaCompartida)?x.bibliotecaCompartida:[],
 bibliotecaBorrados:ARR(x.bibliotecaBorrados)?x.bibliotecaBorrados:[],bibliotecaVersion:1,equiposData:teams}}

function deleted(...sources){const out={};for(const s of sources){for(const [t,data] of Object.entries(s?.equiposData||{}))for(const [mid,when] of Object.entries(data?.scoutingDeleted||{}))if(when){out[t]??={};if(!out[t][mid]||String(when)>out[t][mid])out[t][mid]=String(when)}}return out}
function applyDeletes(s,tomb){if(!s)return s;const o=copy(s);for(const [t,ids] of Object.entries(tomb)){
 const v=o.equiposData?.[t];if(!v)continue;
 v.scoutingDeleted={...(v.scoutingDeleted||{}),...ids};
 v.scoutingMatches=(ARR(v.scoutingMatches)?v.scoutingMatches:[]).filter(m=>!ids[String(m?.id)]);
 if(ids[String(v.scoutingActiveId)])v.scoutingActiveId=null;
 if(ARR(o.scoutingSyncIndex?.[t]))o.scoutingSyncIndex[t]=o.scoutingSyncIndex[t].filter(m=>!ids[String(m?.id)]);
 }return o}
function keyOf(x,name){if(!OBJECT(x))return null;const k=name==='sets'?x.number:name==='seasonPlan'?x.weekStart:x.id;return k==null||k===''?null:String(k)}
function mergeThree(base,local,remote){
 const tomb=deleted(base,local,remote);base=applyDeletes(base,tomb);local=applyDeletes(local,tomb);remote=applyDeletes(remote,tomb);
 const conflicts=[];
 function merge(b,l,r,p='',kind=''){
  if(eq(l,r))return copy(l);
  // Never interpret a missing field or an abbreviated archive as deletion.
  if(r===MISSING&&b!==MISSING&&l!==MISSING){conflicts.push(p+': campo remoto ausente');return copy(l)}
  if(l===MISSING&&b!==MISSING&&r!==MISSING){conflicts.push(p+': campo local ausente');return copy(r)}
  const protectedArray=['scoutingMatches','sets','rallies','actions'].includes(kind);
  const shorter=(previous,next)=>ARR(previous)&&ARR(next)&&previous.some(z=>keyOf(z,kind)!==null&&!next.some(w=>keyOf(w,kind)===keyOf(z,kind)));
  if(eq(b,l)&&!(OBJECT(b)&&OBJECT(r))){
   if(protectedArray&&shorter(b,r)){conflicts.push(p+': registros remotos ausentes');return copy(l)}
   return copy(r);
  }
  if(eq(b,r)&&!(OBJECT(b)&&OBJECT(l))){
   if(protectedArray&&shorter(b,l)){conflicts.push(p+': registros locales ausentes');return copy(r)}
   return copy(l);
  }
  if(l===MISSING&&r!==MISSING){if(b!==MISSING&&kind!=='scoutingDeleted')conflicts.push(p+': borrado local sin marca');return copy(r)}
  if(r===MISSING&&l!==MISSING){if(b!==MISSING&&kind!=='scoutingDeleted')conflicts.push(p+': borrado remoto sin marca');return copy(l)}
  if(OBJECT(l)&&OBJECT(r)&&(b===MISSING||OBJECT(b))){
   const result={};for(const k of new Set([...Object.keys(b===MISSING?{}:b),...Object.keys(l),...Object.keys(r)])){
    const v=merge(value(b,k),value(l,k),value(r,k),p+'.'+k,k);if(v!==MISSING)result[k]=v;
   }return result;
  }
  if(ARR(l)&&ARR(r)){
   const usable=a=>a.every(z=>keyOf(z,kind)!==null)&&new Set(a.map(z=>keyOf(z,kind))).size===a.length;
   if(usable(l)&&usable(r)&&(b===MISSING||ARR(b)&&usable(b))){
    const lm=new Map(l.map(x=>[keyOf(x,kind),x])),rm=new Map(r.map(x=>[keyOf(x,kind),x]));
    const bm=new Map((b===MISSING?[]:b).map(x=>[keyOf(x,kind),x])),out=[];
    for(const k of new Set([...lm.keys(),...rm.keys(),...bm.keys()])){
     const x=merge(bm.has(k)?bm.get(k):MISSING,lm.has(k)?lm.get(k):MISSING,rm.has(k)?rm.get(k):MISSING,p+'['+k+']',k);
     if(x!==MISSING)out.push(x);
    }
    if(kind==='sets')out.sort((x,y)=>(Number(x.number)||0)-(Number(y.number)||0));return out;
   }
  }
  conflicts.push(p||'raíz');return copy(l);
 }
 const combined=merge(base??MISSING,local??MISSING,remote??MISSING);
 return {merged:applyDeletes(combined,tomb),conflicts:[...new Set(conflicts)]};
}
function apply(s){
 const clean=normalize(s);if(!clean)throw Error('Estado recibido no válido');
 const team=String(typeof equipoActivo!=='undefined'?equipoActivo:'');applying=true;
 try{
  equiposData=copy(clean.equiposData);
  if(typeof baseDeDatos!=='undefined')baseDeDatos=copy(clean.bibliotecaCompartida);
  if(typeof guardarBorradosBiblioteca==='function')guardarBorradosBiblioteca(copy(clean.bibliotecaBorrados));
  const rawTeam=teamsHave(team)?copy(equiposData[team]):null;
  if(teamsHave(team)&&typeof cargarEquipoEnVariables==='function')cargarEquipoEnVariables(team);
  if(rawTeam){
   // Reattach fields removed by legacy normalizers.
   equiposData[team]={...equiposData[team],...rawTeam};
   if(typeof partidosEquipo!=='undefined'&&ARR(rawTeam.partidos))partidosEquipo=copy(rawTeam.partidos);
  }
  if(teamsHave(team)&&window.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches){
    window.VC_SCOUT_VIDEO_BRIDGE.replaceMatches(copy(equiposData[team].scoutingMatches||[]),equiposData[team].scoutingActiveId??null);
  }
  if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
  window.MatchState?.sync?.('vc1696-cloud');
  for(const name of ['scoutRenderHome','scoutRender','v800Render','v119RefreshPro','renderPlanificacion','renderHistorial','renderDashboard']){
   if(typeof window[name]==='function')try{window[name]()}catch(e){console.warn('refresh',name,e)}
  }
 }finally{applying=false}
}
function teamsHave(team){return typeof equiposData!=='undefined'&&OBJECT(equiposData?.[team])}
async function checkpoint(reason='change'){
 const snapshot=state(),owner=id();observed=copy(snapshot);
 commitQueue=commitQueue.catch(()=>{}).then(()=>put({key:'pending:'+owner,kind:'pending',owner,dirty:true,state:snapshot,at:timestamp(),reason,revision}));
 await commitQueue;return snapshot;
}
async function archive(reason,s){
 const owner=id(),row={key:'archive:'+owner+':'+Date.now()+':'+Math.random(),owner,kind:'archive',reason,at:timestamp(),state:copy(s)};
 await put(row);const history=(await all()).filter(x=>x.kind==='archive'&&x.owner===owner).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 // Keep 16 recent archives. Old databases and exported files are untouched.
 for(const older of history.slice(16))await remove(older.key);
}
async function capture(reason='manual'){try{await checkpoint(reason);return true}catch(e){problem='No se pudo guardar la copia local: '+String(e);blocked=true;setStatus(problem);return false}}
async function legacyBaseline(uid){
 // Reuse an existing acknowledged baseline when migrating from V16.9.3.
 // The old database is read-only and never deleted or modified.
 try{return await new Promise((resolve,reject)=>{
   const q=indexedDB.open('VolleyCoachSyncV1680');
   q.onsuccess=()=>{const d=q.result;
    if(!d.objectStoreNames.contains('records')){d.close();resolve(null);return}
    const r=d.transaction('records','readonly').objectStore('records').get('base:'+uid);
    r.onsuccess=()=>{const v=r.result;d.close();resolve(v?.state&&v?.stamp?v:null)};
    r.onerror=()=>{d.close();reject(r.error)};
   };
   q.onerror=()=>reject(q.error);
  })}catch{return null}
}
async function ensureAccount(){
 const u=user();if(!u)return false;
 if(initializedFor===u)return true;
 const previous=(await get('base:'+u))||(await legacyBaseline(u)),out=await get('pending:'+u);
 savedBase=previous||null;pending=!!out?.dirty;observed=copy(out?.state||state());initializedFor=u;
 // Existing offline edits from V16.9.x must not be discarded during migration.
 if(previous?.state&&!out?.dirty&&!eq(state(),normalize(previous.state))){
  pending=true;revision++;if(!await capture('migration-local-difference')){blocked=true;return true}
 }
 if(out?.dirty&&!eq(state(),out.state)){
  const merged=mergeThree(previous?.state,normalize(state()),out.state);
  if(merged.conflicts.length){blocked=true;problem='Cambios locales no enviados en conflicto; exporta copias';setStatus(problem);return true}
  await archive('before-outbox-recovery',state());apply(merged.merged);
 }
 return true;
}
async function readCloud(){const {data,error}=await client().from(TABLE).select('state,updated_at').eq('user_id',user()).maybeSingle();if(error)throw error;return data||null}
async function writeCAS(stamp,s){
 const target=timestamp();const q=client().from(TABLE);
 const res=stamp?await q.update({state:s,updated_at:target}).eq('user_id',user()).eq('updated_at',stamp).select('updated_at')
  :await q.insert({user_id:user(),state:s,updated_at:target}).select('updated_at');
 if(res.error){if(res.error.code==='23505')return null;throw res.error}
 return ARR(res.data)&&res.data.length?String(res.data[0].updated_at):null;
}
async function saveBase(stamp,s){const u=user();await put({key:'base:'+u,kind:'base',owner:u,stamp,state:copy(s),at:timestamp()});savedBase={stamp,state:copy(s)}}
async function ack(){await put({key:outboxKey(),owner:id(),kind:'pending',dirty:false,state:state(),at:timestamp(),revision});observed=copy(state());pending=false}
async function sync({reason='manual',write=false}={}){
 if(busy)return busy;
 if(!user()){setStatus('Sin sesión · datos locales conservados');return false}
 if(navigator.onLine===false){setStatus('Sin conexión · datos locales conservados');return false}
 busy=(async()=>{try{
  await ensureAccount();if(blocked){setStatus(problem||'Sincronización bloqueada: revisar copias');return false}
  let local=state();
  if(observed&&!eq(local,observed)){revision++;pending=true;if(!await capture('cambio-detectado:'+reason))return false;local=state()}
  setStatus(pending?'Comprobando cambios y nube…':'Consultando nube…');
  const beforeRev=revision,server=await readCloud();lastRead=timestamp();
  let remote=normalize(server?.state),stamp=server?.updated_at||null;
  const localOriginal=copy(local),remoteOriginal=copy(remote);
  if(remote){const tomb=deleted(local,remote,savedBase?.state);remote=applyDeletes(remote,tomb);local=applyDeletes(local,tomb)}
  let combined=null,needsWrite=false;
  if(!remote){combined=local;needsWrite=Object.keys(local.equiposData||{}).length>0||local.bibliotecaCompartida.length>0}
  else if(savedBase?.state){
   const b=normalize(savedBase.state);
   const localChanged=pending||!eq(local,observed||b),remoteChanged=!eq(remoteOriginal,b);
   if(!localChanged){combined=remote}
   else if(!remoteChanged){combined=local;needsWrite=true}
   else {const m=mergeThree(b,local,remote);combined=m.merged;needsWrite=!eq(combined,remote);
    if(m.conflicts.length){await archive('conflict-local:'+reason,local);await archive('conflict-remote:'+reason,remote);blocked=true;problem='Conflicto en '+m.conflicts.slice(0,3).join(', ')+' · copias guardadas, sin sobrescritura';setStatus(problem);return false}
   }
  }else{
   const localHas=Object.values(local.equiposData||{}).some(t=>OBJECT(t)&&Object.values(t).some(v=>ARR(v)&&v.length));
   if(!localHas&&!local.bibliotecaCompartida.length){combined=remote}
   else if(eq(local,remote)){combined=remote}
   else{
    const m=mergeThree(undefined,local,remote);combined=m.merged;needsWrite=!eq(combined,remote);
    if(m.conflicts.length){await archive('first-link-local',local);await archive('first-link-cloud',remote);blocked=true;problem='Dos dispositivos con datos distintos sin base común · exporta copias';setStatus(problem);return false}
   }
  }
  // A tombstone inherited from THIS device is not yet present in the cloud.
  // Filtering the remote candidate must never be mistaken for a confirmed delete.
  if(remoteOriginal&&!eq(combined,remoteOriginal))needsWrite=true;
  if(revision!==beforeRev){setStatus('Hay cambios nuevos · se intentará otra vez');return false}
  if(needsWrite){
   if(!write){pending=true;setStatus('Cambios locales pendientes de subida');return true}
   if(!await capture('before-cloud-write'))return false;
   const saved=await writeCAS(stamp,combined);
   if(!saved){setStatus('La nube cambió; reintentando sin sobrescribir');return false}
   const verified=await readCloud();
   if(!verified||String(verified.updated_at)!==saved||!eq(normalize(verified.state),normalize(combined))){
    problem='Subida no verificada: se conservaron los datos locales';setStatus(problem);return false;
   }
   // The remote value is confirmed; only now apply/ack.
   if(!eq(state(),combined)){await archive('before-confirmed-apply',state());apply(combined)}
   await saveBase(saved,combined);await ack();lastConfirm=lastWrite=timestamp();setStatus('Nube confirmada ✓');return true;
  }
  if(!eq(localOriginal,combined)){
   await archive('before-remote-apply',localOriginal);apply(combined);
  }
  if(remote)await saveBase(stamp,remote);await ack();lastConfirm=timestamp();setStatus('Nube confirmada ✓');return true;
 }catch(e){problem=String(e?.message||e);pending=true;setStatus('Error de sincronización: '+problem);console.error('VC1696',reason,e);return false}
 finally{busy=null}
 })();return busy;
}
function schedule(reason='change',delay=600){if(applying)return;revision++;pending=true;void capture('outbox:'+reason);
 clearTimeout(pollSoon);pollSoon=setTimeout(()=>void sync({reason,write:true}),delay)}
function onMutation(reason='change'){schedule(reason)}
const flush=(reason='manual')=>sync({reason,write:true});
const pull=(reason='manual')=>sync({reason,write:false});
async function exportProtected(){const rows=await all(),payload={version:VERSION,at:timestamp(),rows};download('VolleyCoach_copias_protegidas_V1696.json',payload)}
function download(name,x){const url=URL.createObjectURL(new Blob([JSON.stringify(x,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function exportDiag(){download('VolleyCoach_diagnostico_V1696.json',diagnostics())}
async function deleteScouting(team,mid){team=String(team);mid=String(mid);if(!user()||blocked)throw Error('Inicia sesión y resuelve conflictos');
 if(busy)await busy;const t=equiposData?.[team];if(!t||!ARR(t.scoutingMatches)||!t.scoutingMatches.some(m=>String(m.id)===mid))throw Error('Scouting no encontrado');
 await archive('before-delete:'+team+':'+mid,state());
 t.scoutingDeleted={...(t.scoutingDeleted||{}),[mid]:timestamp()};t.scoutingMatches=t.scoutingMatches.filter(m=>String(m.id)!==mid);
 if(String(t.scoutingActiveId)===mid)t.scoutingActiveId=null;
 if(String(typeof equipoActivo!=='undefined'?equipoActivo:'')===team)window.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches?.(t.scoutingMatches,t.scoutingActiveId);
 if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();schedule('delete-scouting');if(!await capture('delete-scouting'))throw Error('Copia sin confirmar');return true;
}
async function recoverScouting(team,match){team=String(team);if(!OBJECT(match)||!ARR(match.sets)||!equiposData?.[team])throw Error('Copia inválida');
 if(!user()||blocked)throw Error('Inicia sesión y resuelve conflictos');if(busy)await busy;
 await archive('before-recovery:'+team,state());const t=equiposData[team],cp=copy(match);let nid=Date.now();
 const used=new Set((t.scoutingMatches||[]).map(m=>String(m.id)));while(used.has(String(nid))||t.scoutingDeleted?.[String(nid)])nid++;
 cp.restoredFromId=match.id;cp.id=nid;cp.restoredAt=timestamp();cp.updatedAt=timestamp();t.scoutingMatches=[...(t.scoutingMatches||[]),cp];
 if(String(typeof equipoActivo!=='undefined'?equipoActivo:'')===team)window.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches?.(t.scoutingMatches,t.scoutingActiveId);
 if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();schedule('recover-scouting');if(!await capture('recover-scouting'))throw Error('Copia sin confirmar');return cp;
}
async function listArchivedScoutings(){const rows=await all();const found=[];const seen=new Set();
 for(const row of rows.filter(r=>r.kind==='archive'||r.kind==='pending'))for(const [team,data] of Object.entries(row.state?.equiposData||{}))for(const match of (data.scoutingMatches||[])){
  const key=team+':'+String(match?.id);if(!match?.id||seen.has(key))continue;seen.add(key);found.push({team,match:copy(match),source:'Copia V16.9.6 · '+row.reason});
 }return found}
async function restoreMissing(candidates){let added=0,skipped=0;for(const c of candidates||[]){try{await recoverScouting(c.teamId,c.match);added++}catch{skipped++}}return{added,skipped}}
async function resolveFromCloud(){
 if(!blocked)throw Error('No existe un conflicto bloqueante');
 if(!user())throw Error('Debes iniciar sesión para consultar la nube');
 const row=await readCloud();if(!row?.state)throw Error('No existe una copia remota para recuperar');
 const local=state(),remote=normalize(row.state);
 // Independent, durable copies are written BEFORE user confirmation or any apply.
 await archive('manual-resolution-local',local);await archive('manual-resolution-cloud',remote);
 download('VolleyCoach_conflicto_ambas_copias_'+Date.now()+'.json',{version:VERSION,at:timestamp(),local,remote});
 if(!confirm('Se ha preparado una descarga con AMBAS copias. ¿Estás seguro de utilizar la nube como estado actual? La copia local permanecerá archivada para recuperación.'))return false;
 applying=true;
 try{apply(remote);await saveBase(row.updated_at,remote);await ack();blocked=false;problem='';lastConfirm=timestamp();setStatus('Nube recuperada por decisión manual ✓');return true}
 finally{applying=false}
}
function diagnostics(){return {version:VERSION,connected:!!user(),pending,status,lastConfirm,lastRead,lastWrite,blocked,problem,revision,accountReady:initializedFor===user(),lastBaseStamp:savedBase?.stamp}}
function setupButtons(){if(document.getElementById('vc1696-panel'))return;
 const host=document.querySelector('#v11-management')||document.querySelector('#scout-workspace-v900');if(!host)return;
 const el=document.createElement('section');el.id='vc1696-panel';el.style.cssText='margin:12px;padding:13px;border:1px solid #cfdce7;border-radius:9px;background:#fff;color:#17324b;font:13px Arial';
 const b=(label,fn)=>{const x=document.createElement('button');x.type='button';x.className='ghost';x.style.margin='4px';x.textContent=label;x.onclick=()=>void Promise.resolve(fn()).catch(e=>alert(String(e)));el.append(x)};
 const title=document.createElement('strong');title.textContent='Sincronización V16.9.6';el.append(title);
 const st=document.createElement('p');st.id='vc1696-status';st.textContent=status;el.append(st);
 b('Comprobar nube',()=>pull('manual'));b('Guardar en nube',()=>flush('manual'));b('Resolver conflicto con nube (con copia)',resolveFromCloud);b('Exportar copias',exportProtected);b('Diagnóstico',exportDiag);
 host.append(el);
}
function boot(){setupButtons();
 // Old functions still appear throughout the monolithic HTML. Replace their entrypoints, not the data.
 try{programarSubidaCloud=()=>schedule('legacy-save');subirNube=()=>flush('legacy-upload');bajarNube=()=>pull('legacy-pull')}catch{}
 window.programarSubidaCloud=()=>schedule('legacy-save');window.subirNube=()=>flush('legacy-upload');window.bajarNube=()=>pull('legacy-pull');
 window.addEventListener('online',()=>void flush('online'));
 window.addEventListener('focus',()=>void sync({reason:'focus',write:pending}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void sync({reason:'visible',write:pending})});
 const previousSave=typeof guardarEstadoLocalSinCloud==='function'?guardarEstadoLocalSinCloud:null;
 if(previousSave&&!previousSave.__vc1696){const wrapper=function(...args){const r=previousSave.apply(this,args);if(!applying)void observe('local-save');return r};wrapper.__vc1696=true;
  try{guardarEstadoLocalSinCloud=wrapper}catch{}window.guardarEstadoLocalSinCloud=wrapper}
 function watch(){if(!document.hidden){void observe('watch');if(user()&&!busy)void sync({reason:'poll',write:pending})}}
 setInterval(watch,4500);setTimeout(()=>void sync({reason:'startup',write:pending}),800);
}
async function observe(reason){if(applying||!user()||blocked)return;try{const local=state();if(observed&&!eq(local,observed)){schedule(reason)}}catch(e){console.warn('VC1696 observation',e)}}
window.VC_SYNC_V1696={version:VERSION,mergeThree,normalize,applyDeletes,diagnostics,onMutation,flush,pull,sync,capture,exportProtected,exportDiag,deleteScouting,recoverScouting,listArchivedScoutings,restoreMissing,resolveFromCloud};
window.VC_SYNC_V1680=window.VC_SYNC_V1696;
window.VC_V962_CLOUD_EFFICIENT={version:VERSION,markDirty:onMutation,sync:o=>sync({reason:o?.reason||'legacy',write:!o?.pullOnly}),forceSync:flush,diagnostics};
window.v962ForceSync=flush;window.v953SyncNow=flush;window.v956SyncScoutingsNow=flush;window.v957SyncScoutingsNow=flush;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
