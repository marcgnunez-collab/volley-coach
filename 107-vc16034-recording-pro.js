(()=>{
'use strict';
// V16.0.3.4 · Recording Pro. Reads ONLY the pre-existing Recording Studio database.
// No writes to match/scouting state except explicit clip creation via VC_SCOUT_CLIPS_PRO.
const VERSION='16.0.3.4',DB='VolleyCoachRecordingsV770',$=id=>document.getElementById(id);
const root=$('vc-rec34');if(!root)return;
const state={busy:false,sessions:[],lastScan:0,storageAt:0,refreshing:false,libraryKey:null,stats:{libraryRenders:0,librarySkipped:0,libraryScans:0,idleTicks:0,uiTicks:0}};
const modalOpen=()=>!!$('live-delay-modal')?.classList.contains('open');
const reviewOpen=()=>!!$('scout-video-hub')?.classList.contains('active');
const put=(el,value)=>{if(el&&el.textContent!==String(value))el.textContent=String(value)};
const formatSize=b=>{b=Math.max(0,Number(b)||0);return b<1024*1024?`${Math.round(b/1024)} KB`:b<1024**3?`${(b/1024**2).toFixed(1)} MB`:`${(b/1024**3).toFixed(2)} GB`};
const formatTime=ms=>{let s=Math.max(0,Math.floor((Number(ms)||0)/1000));return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const safeName=s=>String(s||'Volley_Coach').replace(/[\\/:*?"<>|\x00-\x1f]+/g,'_').trim().slice(0,100)||'Volley_Coach';
const ext=mime=>String(mime||'').startsWith('video/mp4')?'mp4':'webm';
const tell=(text,bad=false)=>{const n=$('vc-rec34-status');if(n){n.textContent=String(text);n.style.color=bad?'#ffb8b3':'#b3c8d6'}};
const errMsg=e=>String(e?.message||e||'Error desconocido');
function btn(label,fn,options={}){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=!!options.disabled;b.className=options.danger?'vc-rec34-delete':'';b.addEventListener('click',()=>{try{const result=fn();if(result?.catch)result.catch(e=>tell(errMsg(e),true))}catch(e){tell(errMsg(e),true)}});return b}
function openDB(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined')return reject(Error('El navegador no admite IndexedDB.'));
 const r=indexedDB.open(DB,1);
 r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('sessions'))d.createObjectStore('sessions',{keyPath:'id'});if(!d.objectStoreNames.contains('chunks')){const c=d.createObjectStore('chunks',{keyPath:'key'});c.createIndex('sessionId','sessionId',{unique:false})}};
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('No se puede abrir la biblioteca.'));
 })}
async function getSessions(){const db=await openDB();try{return await new Promise((resolve,reject)=>{const t=db.transaction('sessions','readonly'),r=t.objectStore('sessions').getAll();r.onsuccess=()=>resolve((r.result||[]).sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||''))));r.onerror=()=>reject(r.error)})}finally{db.close()}}
async function getSession(id){const db=await openDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('sessions','readonly').objectStore('sessions').get(String(id));r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}finally{db.close()}}
// Bounded IDB cursor batches; no getAll of potentially multi-gigabyte recordings.
async function nextBatch(db,id,after,batchSize=16){return await new Promise((resolve,reject)=>{
 const tx=db.transaction('chunks','readonly'),store=tx.objectStore('chunks');
 const lower=after==null?`${id}:` :after, upper=`${id}:\uffff`;
 const range=IDBKeyRange.bound(lower,upper,after!==null,false);
 const req=store.openCursor(range),out=[];
 req.onsuccess=()=>{const c=req.result;if(!c||out.length>=batchSize)return resolve(out);out.push(c.value);if(out.length>=batchSize)resolve(out);else c.continue()};
 req.onerror=()=>reject(req.error||Error('Error leyendo fragmentos'));
 tx.onerror=()=>reject(tx.error||Error('Error de IndexedDB'));
 })}
async function walkChunks(id,callback){const db=await openDB();let after=null,total=0,bytes=0,expected=0;try{
 for(;;){const batch=await nextBatch(db,id,after);if(!batch.length)break;
 for(const row of batch){if(!Number.isSafeInteger(row.index)||row.index!==expected)throw Error(`La grabación tiene un fragmento ausente en la posición ${expected}. No se exportará como vídeo completo.`);
 if(!(row.blob instanceof Blob))throw Error('Fragmento de vídeo ilegible.');
 await callback(row.blob,row.index);expected++;total++;bytes+=row.blob.size;after=row.key;
 }
 }return{chunks:total,bytes};
 }finally{db.close()}}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.download=name;a.href=u;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
function metadata(s){return{version:VERSION,id:s.id,filename:s.filename,mode:s.mode,mime:s.mime,startedAt:s.startedAt,endedAt:s.endedAt||null,durationMs:s.durationMs,bytes:s.bytes,completed:!!s.completed,error:s.error||null,match:s.match||null,training:s.training||null,markers:Array.isArray(s.markers)?s.markers:[],checkpointAt:s.checkpointAt||null,chunkCount:s.chunkCount||null}}
async function downloadMetadata(id){const s=await getSession(id);if(!s)throw Error('Grabación no encontrada');download(new Blob([JSON.stringify(metadata(s),null,2)],{type:'application/json'}),safeName(s.filename||id)+'_marcadores.json');tell('Metadatos exportados.')}
async function doExport(id){if(state.busy)return false;const s=await getSession(id);if(!s)throw Error('Grabación no encontrada');
 if(s.mode==='disk'){
  tell('La grabación ya se guardó como archivo del dispositivo. Puedes abrirla en Review o buscar el archivo en tu ordenador.');return false;
 }
 if(!['browser','gallery'].includes(s.mode))throw Error('Formato de grabación no compatible.');
 if(!s.completed&&!confirm('La sesión está incompleta. El archivo puede reproducirse parcialmente o requerir reparación. ¿Intentar exportar los fragmentos conservados?'))return false;
 state.busy=true;render();
 let writer=null,handle=null;
 try{
  const name=safeName(s.filename||id)+'.'+ext(s.mime);
  const picker=typeof window.showSaveFilePicker==='function';
  if(picker){
   try{handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'Vídeo de Volley Coach',accept:{[ext(s.mime)==='mp4'?'video/mp4':'video/webm']:[`.${ext(s.mime)}`]}}]})}
   catch(e){if(e?.name==='AbortError'){tell('Exportación cancelada.');return false}throw e}
   writer=await handle.createWritable();let written=0;const result=await walkChunks(id,async blob=>{await writer.write(blob);written+=blob.size;if(written%(32*1024*1024)<blob.size)tell(`Exportando ${formatSize(written)}…`)});
   if(!result.chunks)throw Error('No existen fragmentos recuperables en esta sesión.');
   await writer.close();writer=null;tell(`Vídeo exportado a archivo · ${formatSize(result.bytes)} · ${result.chunks} fragmentos.`);
  }else{
   // Browsers without File System Access need a Blob download. Warn for large sessions.
   if(Number(s.bytes||0)>280*1024*1024&&!confirm('Este navegador no admite guardar por streaming. La grabación es grande y unirla podría agotar la memoria. Se recomienda usar Chrome/Edge en un ordenador compatible. ¿Intentarlo igualmente?'))return false;
   const blobs=[];const result=await walkChunks(id,async blob=>{blobs.push(blob)});
   if(!result.chunks)throw Error('No existen fragmentos recuperables.');
   download(new Blob(blobs,{type:s.mime||'video/webm'}),name);
   tell(`Descarga preparada · ${formatSize(result.bytes)}. Comprueba que el archivo se reproduce antes de eliminar la sesión.`);
  }
  return true;
 }catch(e){if(writer){try{await writer.abort()}catch(_){}}tell('No se pudo exportar: '+errMsg(e),true);return false}
 finally{state.busy=false;render()}
}
async function openReview(id,marker){const s=await getSession(id);if(!s)throw Error('Grabación no encontrada.');
 try{window.v11Navigate?.('video');window.v780Open?.()}catch(e){console.warn('VC REC34 navigation',e)}
 const selector=$('v780-match');
 if(s.match?.id&&selector){const option=[...selector.options].find(o=>Number(o.value)===Number(s.match.id));if(option){if(selector.value!==option.value){selector.value=option.value;window.v780MatchChanged?.()}}else{tell('No existe el partido vinculado en este dispositivo. Selecciónalo o importa el scouting antes de crear clips.',true);return false}}
 try{const ok=await window.v780OpenRecordingById?.(id);if(!ok){tell('No se puede abrir la grabación directamente. Selecciona el vídeo guardado en Video Review.',true);return false}
  if(marker){const created=window.VC_SCOUT_CLIPS_PRO?.createFromRecordingMarker?.(marker,s);tell(created?'Clip añadido al partido; ahora puedes reproducirlo o exportarlo desde Video Review.':'Abierta la grabación. Comprueba el partido antes de crear el clip.',!created)}
  else tell('Grabación cargada en Video Review. Los clips se crean desde el archivo, no desde el búfer.');
  return true;
 }catch(e){tell('No se pudo abrir automáticamente: '+errMsg(e)+'. Prueba a cargar el archivo desde Video Review.',true);return false}
}
async function remove(id){if(state.busy)return false;const s=await getSession(id);if(!s)return false;
 const d=window.vcRecordingDiagnostics?.()||{};if(d.active&&String(s.id)===String(d.sessionId))throw Error('Detén la grabación antes de eliminarla.');
 if(s.mode==='disk'){tell('La sesión está en disco: usa la gestión original para evitar borrar la referencia al archivo.');return false}
 if(!confirm(`Eliminar los fragmentos locales de «${s.filename||s.id}»? Esta operación no se puede deshacer.`))return false;
 state.busy=true;render();let db=null;
 try{db=await openDB();
  const keys=await new Promise((resolve,reject)=>{const r=db.transaction('chunks','readonly').objectStore('chunks').index('sessionId').getAllKeys(String(id));r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
  await new Promise((resolve,reject)=>{const tx=db.transaction(['sessions','chunks'],'readwrite');tx.objectStore('sessions').delete(id);for(const key of keys)tx.objectStore('chunks').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  tell('Sesión eliminada del almacenamiento local.');await refresh();return true;
 }finally{db?.close();state.busy=false;render()}
}
async function storageInfo(){if(!navigator.storage?.estimate)return;
 try{const q=await navigator.storage.estimate(),free=Math.max(0,Number(q.quota||0)-Number(q.usage||0));
 if($('vc-rec34-space'))$('vc-rec34-space').textContent=q.quota?formatSize(free):'No disponible';
 if($('vc-rec34-capacity'))$('vc-rec34-capacity').textContent=q.quota?`${formatSize(q.usage||0)} usados · cuota ${formatSize(q.quota)}`:'Cuota desconocida';
 }catch(_){} }
async function persistStorage(){if(!navigator.storage?.persist){tell('Este navegador no ofrece solicitud de almacenamiento persistente.',true);return false}
 try{const granted=await navigator.storage.persist();tell(granted?'Almacenamiento persistente autorizado para este origen.':'El navegador no concedió almacenamiento persistente. Conserva copias de los vídeos exportados.',!granted);return granted}
 catch(e){tell('No se pudo solicitar persistencia: '+errMsg(e),true);return false}}
// Short REC strip inside Video Review. Uses the existing Recording Studio engine.
function installReviewStrip(){
 const hub=$('scout-video-hub')?.querySelector('.v780-hub'),hero=hub?.querySelector('.v780-hero');if(!hub||!hero||$('vc-rec34-strip'))return;
 const strip=document.createElement('section');strip.id='vc-rec34-strip';strip.className='vc-rec34-strip';strip.setAttribute('aria-label','Grabación de Video Review');
 const title=document.createElement('div');title.className='vc-rec34-strip-label';const ey=document.createElement('span');ey.textContent='RECORDING PRO';const copy=document.createElement('strong');copy.textContent='Grabación desde Video Review';const status=document.createElement('small');status.id='vc-rec34-strip-status';status.textContent='La grabación utiliza LIVE, no el retraso';title.append(ey,copy,status);
 const actions=document.createElement('div');actions.className='vc-rec34-strip-actions';
 const start=btn('● Iniciar REC',()=>window.vcRecordingStart?.()),pause=btn('Pausar',()=>window.vcRecordingTogglePause?.()),stop=btn('■ Finalizar y guardar',()=>window.vcRecordingStop?.()),library=btn('Biblioteca / REC',async()=>{await window.openLiveDelay?.('training');$('vc-rec34')?.scrollIntoView({block:'center',behavior:'smooth'})});
 start.id='vc-rec34-strip-start';pause.id='vc-rec34-strip-pause';stop.id='vc-rec34-strip-stop';actions.append(start,pause,stop,library);strip.append(title,actions);hero.insertAdjacentElement('afterend',strip);
}
function updateReviewStrip(d){const strip=$('vc-rec34-strip');if(!strip)return;
 const active=!!d.active,status=$('vc-rec34-strip-status'),start=$('vc-rec34-strip-start'),pause=$('vc-rec34-strip-pause'),stop=$('vc-rec34-strip-stop');
 const statusValue=active?`${d.paused?'REC en pausa':'REC activa'} · ${formatTime(d.elapsedMs)} · ${formatSize(d.durableBytes)} escritos`:'Inicia LIVE antes de grabar. REC es independiente de DELAY.';
 if(strip.dataset.active!==(active?'1':'0'))strip.dataset.active=active?'1':'0';put(status,statusValue);
 if(start&&start.disabled!==(active||state.busy))start.disabled=active||state.busy;
 if(pause){if(pause.disabled!==(!active||state.busy))pause.disabled=!active||state.busy;put(pause,d.paused?'Reanudar':'Pausar')}
 if(stop&&stop.disabled!==(!active||state.busy))stop.disabled=!active||state.busy;
}
installReviewStrip();
function updateStatus(d=window.vcRecordingDiagnostics?.()||{}){
 if(reviewOpen())updateReviewStrip(d);
 if(!modalOpen())return;
 put($('vc-rec34-saved'),formatSize(d.durableBytes||0));
 put($('vc-rec34-pending'),d.active?`${d.durableChunks||0} fragmentos confirmados · ${d.pendingWrites||0} pendientes`:'Sin grabación activa');
 const health=$('vc-rec34-health');if(health){const error=!!(d.writeError||d.recorderError),level=error?'error':d.active?'rec':'';
  if(health.dataset.level!==level)health.dataset.level=level;put(health,error?'Comprobar REC':d.active?(d.paused?'REC PAUSADA':'● REC ACTIVA'):'Preparado')}
 put($('vc-rec34-mode'),($('vc-recording-storage')?.value||'disk')==='disk'?'Archivo directo':'Recuperable');
}
function render(){updateStatus();const list=$('vc-rec34-library');if(!list)return;
 const available=state.sessions.filter(s=>['browser','gallery'].includes(s.mode));
 put($('vc-rec34-count'),available.length);
 // Only rebuild on real catalogue/state changes. Changing REC elapsed time
 // must NEVER replace every session card (or reset its focused buttons).
 const key=JSON.stringify([state.busy,state.sessions.length,state.sessions.slice(0,30).map(s=>[s.id,s.filename,s.mode,s.startedAt,s.completed,s.durationMs,s.bytes,s.match?.opponent,(s.markers||[]).length])]);
 if(key===state.libraryKey){state.stats.librarySkipped++;return}
 state.libraryKey=key;state.stats.libraryRenders++;
 list.replaceChildren();
 if(!state.sessions.length){const empty=document.createElement('p');empty.className='vc-rec34-empty';empty.textContent='Todavía no hay sesiones guardadas en este navegador.';list.appendChild(empty);return}
 for(const s of state.sessions.slice(0,30)){
  const item=document.createElement('article');item.className='vc-rec34-item';const info=document.createElement('div');info.className='vc-rec34-info';
  const title=document.createElement('strong');title.textContent=String(s.filename||s.id);
  const detail=document.createElement('small');detail.textContent=`${s.completed?'Finalizada':'Interrumpida / en curso'} · ${s.mode==='disk'?'Archivo directo':s.mode==='gallery'?'Galería / recuperable':'Navegador / recuperable'} · ${formatTime(s.durationMs)} · ${formatSize(s.bytes)}${s.match?.opponent?' · '+String(s.match.opponent):''}`;
  info.append(title,detail);const actions=document.createElement('div');actions.className='vc-rec34-item-actions';
  actions.append(btn('Abrir en Review',()=>openReview(s.id),{disabled:state.busy}),btn('Exportar vídeo',()=>doExport(s.id),{disabled:state.busy||s.mode==='disk'}),btn('Marcadores JSON',()=>downloadMetadata(s.id),{disabled:state.busy}));
  if(Array.isArray(s.markers)&&s.markers.length){const choose=btn(`Clip de una marca (${s.markers.length})`,()=>{
   const valid=s.markers.filter(m=>Number.isFinite(Number(m.ms))&&Number(m.ms)>=0);
   if(!valid.length){tell('No hay marcas con tiempo válido.',true);return}
   const selection=valid.length===1?valid[0]:valid[Number(prompt(`Selecciona un marcador del 1 al ${Math.min(valid.length,30)}:\n`+valid.slice(0,30).map((m,i)=>`${i+1}. ${m.label} (${formatTime(m.ms)})`).join('\n'),'1'))-1];
   if(selection)void openReview(s.id,selection);
  },{disabled:state.busy});actions.append(choose)}
  if(s.mode==='browser'||s.mode==='gallery')actions.append(btn('Eliminar',()=>remove(s.id),{danger:true,disabled:state.busy}));
  item.append(info,actions);list.appendChild(item)
 }
 if(state.sessions.length>30){const more=document.createElement('p');more.className='vc-rec34-empty';more.textContent=`Se muestran las 30 sesiones más recientes de ${state.sessions.length}.`;list.appendChild(more)}
}
async function refresh(){if(state.refreshing)return;state.refreshing=true;state.stats.libraryScans++;
 try{state.sessions=await getSessions();state.lastScan=Date.now();render();await storageInfo()}
 catch(e){tell('No se puede leer la biblioteca: '+errMsg(e),true)}finally{state.refreshing=false}}
try{const v=localStorage.getItem('vc-rec34-quality');if(['1600000','2500000','3500000'].includes(v)&&$('vc-rec34-bitrate'))$('vc-rec34-bitrate').value=v}catch(_){}
$('vc-rec34-bitrate')?.addEventListener('change',e=>{try{localStorage.setItem('vc-rec34-quality',e.target.value)}catch(_){}tell('El perfil se aplicará al iniciar la próxima grabación.')});
$('vc-rec34-refresh')?.addEventListener('click',refresh);$('vc-rec34-persist')?.addEventListener('click',persistStorage);
$('vc-recording-storage')?.addEventListener('change',()=>updateStatus());
window.VC_RECORDING_PRO={version:VERSION,list:()=>getSessions().then(a=>a.map(metadata)),export:doExport,openReview,metadata:downloadMetadata,refresh,diagnostics:()=>({version:'16.0.3.5',sessions:state.sessions.length,busy:state.busy,performance:{...state.stats},recording:window.vcRecordingDiagnostics?.()||{}})};
// No background IndexedDB reads or DOM rebuilding in Scouting/Analysis.
// A lightweight live status remains visible when the REC strip is on screen.
let wasModalOpen=false,previousActive=false;
setInterval(()=>{
 if(document.visibilityState==='hidden'){state.stats.idleTicks++;return}
 const modal=modalOpen(),review=reviewOpen();
 if(!modal&&!review){wasModalOpen=false;state.stats.idleTicks++;return}
 state.stats.uiTicks++;
 const d=window.vcRecordingDiagnostics?.()||{};
 updateStatus(d);
 if(modal){
  const changed=modal!==wasModalOpen;
  if((changed||Date.now()-state.lastScan>30000)&&!state.refreshing)void refresh();
  else if(previousActive&&!d.active)void refresh();
 }
 previousActive=!!d.active;wasModalOpen=modal;
},1500);
// IndexDB can hold gigabytes: do not scan on every application launch.
// Load on opening Recording Studio, or explicitly via the public refresh button.
if(modalOpen())void refresh();else render();
})();
