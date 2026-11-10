/* Volley Coach V17.12.0 · Grabación de Partidos Pro
 * Reuses existing publisher/WebRTC and desktop Recording Studio; independent
 * on-phone recoverable recording is opt-in and never uploads to cloud.
 * No writes to scouting, scores, Supabase or training databases.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api.pure;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.12.0',DB_NAME='VC1712PhoneRecordings',DB_VERSION=1,MAX_LIST=30;
const clean=(v,n=160)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const fmtMs=v=>{const n=Math.max(0,Math.floor(Number(v)||0)/1000);return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(x=>String(x).padStart(2,'0')).join(':');};
function fileName(v){return clean(v,150).replace(/[^a-zA-Z0-9_\-.]/g,'_')||'VolleyCoach_Partido';}
function getClosedRallies(match){
 const sets=Array.isArray(match?.sets)?match.sets:[];
 return sets.reduce((n,set)=>n+(Array.isArray(set?.rallies)?set.rallies.filter(r=>r?.winner==='ours'||r?.winner==='opponent').length:0),0);
}
function matchSnapshot(bridge){
 const m=bridge?.getActive?.()||null;
 if(!m)return null;
 const lastSet=Array.isArray(m.sets)?m.sets.find(s=>Number(s.number)===Number(m.currentSet))||m.sets.at(-1):null;
 return {id:clean(m.id),opponent:clean(m.opponent||'Rival'),date:clean(m.date||'',24),set:Number(lastSet?.number)||Number(m.currentSet)||1,rallies:getClosedRallies(m)};
}
function recordingBadge(d={}){
 if(d.writeError||d.recorderError)return 'ERROR DE GRABACIÓN';
 if(d.active&&d.paused)return 'REC PAUSADA';
 if(d.active)return 'REC '+fmtMs(d.elapsedMs)+' · '+Math.round((d.durableBytes||0)/1048576)+' MB confirmados';
 return 'REC detenida';
}
function mimeType(win){
 const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4'];
 return types.find(t=>{try{return win.MediaRecorder?.isTypeSupported(t)}catch(_){return false}})||'';
}
const pure={version:VERSION,matchSnapshot,getClosedRallies,recordingBadge,mimeType};
function openDB(win){return new Promise((resolve,reject)=>{
 if(!win.indexedDB)return reject(Error('El navegador no permite almacenamiento recuperable (IndexedDB).'));
 const req=win.indexedDB.open(DB_NAME,DB_VERSION);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'});if(!db.objectStoreNames.contains('chunks'))db.createObjectStore('chunks',{keyPath:['sessionId','index']});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('No se pudo abrir la videoteca local.'));req.onblocked=()=>reject(Error('Cierra otras pestañas de Volley Coach e inténtalo otra vez.'));
 });}
async function put(win,store,value){const db=await openDB(win);try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||Error('No se pudo guardar un fragmento.'));tx.onabort=()=>reject(tx.error||Error('Escritura interrumpida.'));})}finally{db.close()}}
async function getAll(win,store){const db=await openDB(win);try{return await new Promise((resolve,reject)=>{const req=db.transaction(store,'readonly').objectStore(store).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||Error('No se pudo consultar el almacenamiento.'));})}finally{db.close()}}
async function chunksFor(win,id){const db=await openDB(win);try{return await new Promise((resolve,reject)=>{const arr=[],req=db.transaction('chunks','readonly').objectStore('chunks').openCursor();req.onsuccess=()=>{const cursor=req.result;if(!cursor){resolve(arr.sort((a,b)=>a.index-b.index));return;}if(cursor.value.sessionId===id)arr.push(cursor.value);cursor.continue()};req.onerror=()=>reject(req.error||Error('No se pudieron leer los fragmentos.'))})}finally{db.close()}}
async function deleteSession(win,id){const db=await openDB(win);try{await new Promise((resolve,reject)=>{const tx=db.transaction(['sessions','chunks'],'readwrite');tx.objectStore('sessions').delete(id);const req=tx.objectStore('chunks').openCursor();req.onsuccess=()=>{const c=req.result;if(c){if(c.value.sessionId===id)c.delete();c.continue()}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('No se pudo eliminar la grabación.'));})}finally{db.close()}}
function mount(win){
 const doc=win.document;
 const style=doc.createElement('style');style.id='vc1712-style';style.textContent=`
#vc1712-match-panel,#vc1712-phone-panel{background:#f4f9fe;border:1px solid #cbdff1;border-radius:12px;padding:14px;display:grid;gap:10px;color:#173d5e;font:500 12px/1.5 system-ui,sans-serif;min-width:0}
#vc1712-match-panel{margin:0 13px 14px}#vc1712-phone-panel{margin:9px 0;background:#f6faff}
#vc1712-match-panel strong,#vc1712-phone-panel strong{font-size:14px;font-weight:800;color:#143c62}
.vc1712-head,.vc1712-buttons{display:flex;gap:9px;align-items:center;justify-content:space-between;flex-wrap:wrap}.vc1712-buttons{justify-content:flex-start}
#vc1712-match-panel button,#vc1712-phone-panel button{width:auto!important;min-height:38px!important;padding:8px 12px!important;border:1px solid #a9c6de!important;border-radius:8px!important;background:#fff!important;color:#155181!important;font:700 12px/1.3 system-ui,sans-serif!important;cursor:pointer;box-shadow:none!important;letter-spacing:normal!important}
#vc1712-match-panel .vc1712-primary,#vc1712-phone-panel .vc1712-primary{background:#165e9b!important;color:white!important;border-color:#165e9b!important}
#vc1712-match-panel button:disabled,#vc1712-phone-panel button:disabled{opacity:.42!important;cursor:not-allowed!important}
.vc1712-status{font-size:11px;font-weight:700;color:#4b708b}.vc1712-status[data-error="true"]{color:#a43332}.vc1712-help{font-size:11px;color:#617d92;margin:0;line-height:1.5}.vc1712-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.vc1712-library{display:grid;gap:7px;max-height:300px;overflow:auto}.vc1712-entry{background:#fff;border:1px solid #d4e6f5;border-radius:8px;padding:9px;display:flex;gap:9px;align-items:center;justify-content:space-between;flex-wrap:wrap}.vc1712-entry small{display:block;color:#66839a;font-size:10px}.vc1712-input{display:flex;align-items:center;gap:6px;font-size:11px}
@media(max-width:650px){#vc1712-match-panel{margin:0 6px 12px;padding:11px}#vc1712-phone-panel{padding:11px}.vc1712-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.vc1712-buttons button{width:100%!important;padding:8px 5px!important;white-space:normal!important}}
`;doc.head.append(style);
 const $=id=>doc.getElementById(id);
 function readMatch(){return matchSnapshot(win.VC_SCOUT_VIDEO_BRIDGE)}
 let lastKey='',autoRallies=false,autoBaseline=null,recordBound=null;
 const matchPanel=doc.createElement('section');matchPanel.id='vc1712-match-panel';matchPanel.setAttribute('aria-label','Grabación de partidos Pro');
 matchPanel.innerHTML=`<div class="vc1712-head"><div><strong>Grabación de partido · V17.12</strong><div id="vc1712-match-title" class="vc1712-status">Sin partido seleccionado</div></div><span id="vc1712-match-rec" class="vc1712-status">REC detenida</span></div>
<div class="vc1712-buttons"><button type="button" data-vc1712="connect" class="vc1712-primary">Conectar cámara del móvil</button><button type="button" data-vc1712="record">● Iniciar REC</button><button type="button" data-vc1712="mark">Marcar rally</button><button type="button" data-vc1712="markset">Marcar set</button><button type="button" data-vc1712="stop">■ Finalizar REC</button><button type="button" data-vc1712="library">Ver grabaciones</button></div>
<label class="vc1712-input"><input id="vc1712-auto-rallies" type="checkbox"> Crear marcador al cerrar un rally (según el scouting local)</label>
<div id="vc1712-match-status" class="vc1712-status" role="status">Selecciona el scouting del partido. La cámara y el grabador son independientes de la nube.</div>
<p class="vc1712-help">En el ordenador: conecta el móvil con el QR de Cámara remota, espera a recibir LIVE y entonces inicia REC. También puedes usar una cámara local. Los vídeos se guardan en el dispositivo que graba; el scouting de la nube no sube vídeos. Comprueba REC y espacio libre antes del partido.</p>`;
 const existing=$('vc17100-match-dock');const matches=$('vc1720-workspace');
 if(existing?.parentNode)existing.insertAdjacentElement('afterend',matchPanel);else matches?.append(matchPanel);
 const status=(msg,error=false)=>{const el=$('vc1712-match-status');if(el){el.textContent=msg;el.dataset.error=error?'true':'false'}};
 const contextMatches=()=>{try{win.VC17_VIDEO_UNIFIED?.setContext?.('matches')}catch(_){}};
 function recDiag(){try{return win.vcRecordingDiagnostics?.()||{}}catch(_){return {}}}
 function paintMatch(){if(!matchPanel.isConnected)return;const m=readMatch(),d=recDiag(),remote=win.VC_REMOTE_CAMERA?.diagnostics?.()||{};
  const label=m?`${m.opponent} · ${m.date||'Sin fecha'} · Set ${m.set} · ${m.rallies} rallies cerrados`:'Selecciona primero un scouting activo';
  if(label!==lastKey){const t=$('vc1712-match-title');if(t)t.textContent=label;lastKey=label;}
  const rec=$('vc1712-match-rec');if(rec)rec.textContent=recordingBadge(d)+(remote.connected?' · Cámara remota conectada':'')+(d.active&&recordBound?.sessionId===d.sessionId&&m&&recordBound.matchId!==m.id?' · OTRO PARTIDO':'');
  const start=matchPanel.querySelector('[data-vc1712="record"]'),stop=matchPanel.querySelector('[data-vc1712="stop"]');
  if(start)start.disabled=!m||!!d.active;if(stop)stop.disabled=!d.active;
  const mark=matchPanel.querySelector('[data-vc1712="mark"]'),set=matchPanel.querySelector('[data-vc1712="markset"]');if(mark)mark.disabled=!d.active;if(set)set.disabled=!d.active;
 }
 async function connect(){contextMatches();if(typeof win.openLiveDelay!=='function')throw Error('El motor Live/Delay no está disponible.');win.openLiveDelay('scouting');
  const input=$('live-delay-source');if(input)input.value='remote';win.vcRemoteSourceChanged?.('remote');
  if(!win.VC_REMOTE_CAMERA?.diagnostics?.().viewerWanted&&!win.VC_REMOTE_CAMERA?.diagnostics?.().connected)await win.vcRemotePrepare?.(false);
  status('En la ventana Live/Delay, abre Cámara remota y escanea el QR con el móvil. Inicia la transmisión en el móvil y comprueba la imagen en el portátil.');
 }
 async function record(){const m=readMatch();if(!m)throw Error('Selecciona un partido activo antes de iniciar la grabación.');contextMatches();
  if(recDiag().active)return; if(!recDiag().sourceAvailable){win.openLiveDelay?.('scouting');throw Error('Primero inicia la cámara LIVE local o conecta la cámara remota.');}
  if(typeof win.vcRecordingStart!=='function')throw Error('Recording Studio no está cargado.');
  await win.vcRecordingStart();const d=recDiag();if(!d.active)throw Error('No se ha iniciado REC. Comprueba los permisos, la fuente y el espacio de almacenamiento.');
  recordBound={sessionId:d.sessionId,matchId:m.id};autoBaseline={sessionId:d.sessionId,matchId:m.id,rallies:m.rallies};status('REC iniciada. El archivo se guarda en este dispositivo. Puedes marcar rallies y sets.');paintMatch();
 }
 function mark(kind){const d=recDiag(),m=readMatch();if(!d.active||!m)throw Error('Para marcar, primero inicia REC y selecciona el partido.');
  if(recordBound?.sessionId===d.sessionId&&recordBound.matchId!==m.id)throw Error('Esta grabación pertenece al partido anterior. Vuelve a seleccionarlo para marcarlo.');
  if(typeof win.vcRecordingAddMarker!=='function')throw Error('No está disponible el registro de marcadores.');
  const label=kind==='set'?`Set ${m.set} · marca manual`:`Rally ${m.rallies} · Set ${m.set} · marca manual`;
  win.vcRecordingAddMarker(label);status('Marcador añadido al tiempo de esta grabación: '+label);
 }
 async function stop(){const d=recDiag();if(!d.active)return;if(recordBound?.sessionId!==d.sessionId)throw Error('La grabación se inició desde otra pantalla. Finalízala desde sus controles originales.');await win.vcRecordingStop?.();status('REC finalizada. Revisa la biblioteca y exporta el vídeo antes de borrar datos del navegador.');autoBaseline=null;recordBound=null;paintMatch()}
 matchPanel.addEventListener('click',async e=>{const b=e.target.closest('button[data-vc1712]');if(!b||b.disabled)return;
  b.disabled=true;try{const a=b.dataset.vc1712;
   if(a==='connect')await connect();else if(a==='record')await record();else if(a==='mark')mark('rally');else if(a==='markset')mark('set');else if(a==='stop')await stop();else if(a==='library'){contextMatches();win.VC17_VIDEO_UNIFIED?.open?.('matches','library');}
  }catch(err){status(String(err.message||err),true)}finally{paintMatch()}
 });
 $('vc1712-auto-rallies')?.addEventListener('change',e=>{autoRallies=!!e.target.checked;const m=readMatch(),d=recDiag();if(autoRallies&&d.active&&m){recordBound={sessionId:d.sessionId,matchId:m.id};}autoBaseline=m&&d.active?{sessionId:d.sessionId,matchId:m.id,rallies:m.rallies}:null;
  status(autoRallies?'Marcadores automáticos activados (solo nuevas finalizaciones observadas en este dispositivo).':'Marcadores automáticos desactivados.');});
 // Read-only poll of the current match. Never calls any scouting mutation.
 function tick(){paintMatch();if(!autoRallies)return;const d=recDiag(),m=readMatch();if(!d.active||d.paused||!m){autoBaseline=null;return;}
  if(recordBound?.sessionId===d.sessionId&&recordBound.matchId!==m.id)return;
  if(!autoBaseline||autoBaseline.sessionId!==d.sessionId||autoBaseline.matchId!==m.id){autoBaseline={sessionId:d.sessionId,matchId:m.id,rallies:m.rallies};return;}
  if(m.rallies>autoBaseline.rallies){const diff=m.rallies-autoBaseline.rallies;try{win.vcRecordingAddMarker?.(diff===1?`Rally ${m.rallies} · Set ${m.set} · automático`:`${diff} rallies cerrados · Set ${m.set} · automático`)}catch(_){}autoBaseline.rallies=m.rallies;}
  else if(m.rallies<autoBaseline.rallies)autoBaseline.rallies=m.rallies;
 }
 win.setInterval(tick,1500);tick();
 // Companion mobile: optional LOCAL capture of the transmitted stream.
 let phoneState={active:false,stopping:false,rec:null,session:null,queue:Promise.resolve(),index:0,bytes:0,writeError:'',since:0};
 function publisherStream(){return win.VC_REMOTE_CAMERA?.getPublisherStream?.()||null;}
 async function phoneSessions(){return (await getAll(win,'sessions')).sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt))).slice(0,MAX_LIST)}
 function updatePhone(msg='',error=false){const p=$('vc1712-phone-panel');if(!p)return;const r=p.querySelector('[data-vc1712-phone-state]');if(r)r.textContent=phoneState.active?`● REC LOCAL · ${fmtMs(Date.now()-phoneState.since)} · ${Math.round(phoneState.bytes/1048576)} MB escritos`:'Grabación local detenida';
  const a=p.querySelector('[data-vc1712-phone="start"]'),b=p.querySelector('[data-vc1712-phone="stop"]');if(a)a.disabled=phoneState.active||phoneState.stopping;if(b)b.disabled=!phoneState.active||phoneState.stopping;
  const feed=p.querySelector('[data-vc1712-phone-feedback]');if(feed&&msg){feed.textContent=msg;feed.dataset.error=error?'true':'false';}
 }
 async function refreshPhone(){const box=$('vc1712-phone-list');if(!box)return;box.replaceChildren();try{const records=await phoneSessions();
  if(!records.length){box.textContent='Sin grabaciones locales en este móvil.';return;}
  for(const r of records){const el=doc.createElement('article');el.className='vc1712-entry';const label=doc.createElement('div');label.append(doc.createTextNode(fileName(r.filename)),doc.createElement('br'));
   const detail=doc.createElement('small');detail.textContent=`${r.completed?'Completa':'Interrumpida / recuperable'} · ${fmtMs(r.durationMs)} · ${Math.round((r.bytes||0)/1048576)} MB · ${new Date(r.startedAt).toLocaleString('es-ES')}`;label.append(detail);
   const actions=doc.createElement('div');actions.className='vc1712-buttons';for(const [mode,t] of [['export','Descargar vídeo'],['json','Metadatos'],['delete','Eliminar']]){const btn=doc.createElement('button');btn.type='button';btn.textContent=t;btn.dataset.vc1712Phone=mode;btn.dataset.vc1712Id=r.id;actions.append(btn)}el.append(label,actions);box.append(el)}
 }catch(e){box.textContent='No se pudo leer la biblioteca: '+String(e.message||e)}}
 async function startPhone(){if(phoneState.active)throw Error('Ya hay una grabación local activa.');const stream=publisherStream();if(!stream||!stream.getVideoTracks?.().some(t=>t.readyState==='live'))throw Error('Primero pulsa «Iniciar transmisión» para activar la cámara.');
  // Storage estimates are approximate; keep a conservative guard against starting a full match with almost no space.
  try{const q=await win.navigator.storage?.estimate?.();if(q?.quota&&Number.isFinite(q.quota-q.usage)&&q.quota-q.usage<200*1024*1024)throw Error('Queda menos de 200 MB de almacenamiento estimado. Libera espacio y exporta las grabaciones anteriores.');}catch(e){if(String(e.message||e).includes('200 MB'))throw e;}
  try{await win.navigator.storage?.persist?.()}catch(_){}
  const mime=mimeType(win);if(!mime)throw Error('MediaRecorder no admite los formatos de vídeo disponibles.');
  const session={id:'mobile_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),startedAt:new Date().toISOString(),durationMs:0,bytes:0,completed:false,mime,filename:`Partido_${new Date().toISOString().slice(0,10)}`,source:'Cámara móvil · copia local',markers:[],streamId:new URL(win.location.href).searchParams.get('vcCamera')||''};
  // Persist the session metadata before activating REC.
  await put(win,'sessions',session);
  let rec;try{rec=new win.MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});}catch(e){throw Error('No se pudo iniciar MediaRecorder: '+String(e.message||e));}
  phoneState={active:true,stopping:false,rec,session,queue:Promise.resolve(),index:0,bytes:0,writeError:'',since:Date.now()};
  rec.addEventListener('dataavailable',ev=>{if(!ev.data?.size)return;const idx=phoneState.index++;phoneState.queue=phoneState.queue.then(()=>put(win,'chunks',{sessionId:session.id,index:idx,blob:ev.data})).then(()=>{phoneState.bytes+=ev.data.size;updatePhone()}).catch(e=>{phoneState.writeError=String(e.message||e);updatePhone('Error al guardar un fragmento: '+phoneState.writeError,true)})});
  rec.addEventListener('error',e=>{phoneState.writeError=String(e?.error?.message||'Error del grabador');updatePhone(phoneState.writeError,true)});
  rec.addEventListener('stop',()=>{if(phoneState.active&&!phoneState.stopping)void stopPhone();});
  try{rec.start(2000)}catch(e){phoneState.active=false;throw e}
  updatePhone('REC local iniciada. Conserva esta pestaña abierta y comprueba el espacio del móvil.');
 }
 async function stopPhone(){if(!phoneState.active||phoneState.stopping)return;phoneState.stopping=true;const s=phoneState.session,rec=phoneState.rec;
  try{await new Promise((resolve,reject)=>{if(rec.state==='inactive'){resolve();return;}rec.addEventListener('stop',resolve,{once:true});rec.addEventListener('error',()=>reject(Error('Fallo al finalizar la grabación.')),{once:true});try{rec.stop()}catch(e){reject(e)}});
   await phoneState.queue;const durationMs=Date.now()-phoneState.since,hasData=phoneState.bytes>0&&!phoneState.writeError;
   await put(win,'sessions',{...s,endedAt:new Date().toISOString(),durationMs,bytes:phoneState.bytes,completed:hasData,writeError:phoneState.writeError||null});
   updatePhone(hasData?'Grabación cerrada. Descarga el archivo para conservarlo fuera del navegador.':'Grabación incompleta: revisa y exporta los fragmentos recuperables.',!hasData);
  }finally{phoneState.active=false;phoneState.stopping=false;updatePhone();await refreshPhone()}
 }
 async function exportPhone(id,metadataOnly=false){const s=(await phoneSessions()).find(x=>x.id===id);if(!s)throw Error('Grabación no encontrada.');let blob,name;
  if(metadataOnly){blob=new win.Blob([JSON.stringify(s,null,2)],{type:'application/json'});name=fileName(s.filename)+'_marcadores.json'}else{
   const chunks=await chunksFor(win,id);if(!chunks.length)throw Error('No hay fragmentos guardados.');
   for(let i=0;i<chunks.length;i++)if(chunks[i].index!==i)throw Error('Faltan fragmentos; la grabación no es exportable como vídeo completo.');
   blob=new win.Blob(chunks.map(x=>x.blob),{type:s.mime});name=fileName(s.filename)+(s.mime.includes('mp4')?'.mp4':'.webm');
  }
  const url=win.URL.createObjectURL(blob),link=doc.createElement('a');link.href=url;link.download=name;doc.body.append(link);link.click();link.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);return true;
 }
 function phoneMount(){const container=$('vc-publisher-overlay')?.querySelector('.vc-publisher-bottom');if(!container||$('vc1712-phone-panel'))return false;
  const block=doc.createElement('section');block.id='vc1712-phone-panel';block.innerHTML=`<div class="vc1712-head"><strong>Grabación local de partido · V17.12</strong><span class="vc1712-status" data-vc1712-phone-state>REC detenida</span></div>
<div class="vc1712-buttons"><button type="button" class="vc1712-primary" data-vc1712-phone="start">● Grabar en este móvil</button><button type="button" data-vc1712-phone="stop">■ Finalizar y guardar</button><button type="button" data-vc1712-phone="refresh">Grabaciones guardadas</button></div>
<div class="vc1712-status" data-vc1712-phone-feedback role="status">La transmisión WebRTC y la grabación en este móvil son independientes. Pulsa primero «Iniciar transmisión».</div><p class="vc1712-help">Se guardan fragmentos recuperables en este navegador, no en la nube ni automáticamente en el portátil. Descarga el vídeo cuando termines. Mantén la pantalla y la cámara activas; comprueba el espacio libre. Cambiar de cámara u orientación durante REC puede interrumpirla.</p><div id="vc1712-phone-list" class="vc1712-library"></div>`;container.append(block);
  block.addEventListener('click',async e=>{const b=e.target.closest('button[data-vc1712-phone]');if(!b||b.disabled)return;
   const kind=b.dataset.vc1712Phone,id=b.dataset.vc1712Id;b.disabled=true;try{
    if(kind==='start')await startPhone();else if(kind==='stop')await stopPhone();else if(kind==='refresh')await refreshPhone();else if(kind==='export'||kind==='json')await exportPhone(id,kind==='json');else if(kind==='delete'){
     if(phoneState.active&&phoneState.session?.id===id)throw Error('No puedes eliminar la grabación activa.');
     if(win.confirm('¿Eliminar este vídeo de la memoria local? Esta acción es irreversible.')){await deleteSession(win,id);await refreshPhone()}
    }
   }catch(err){updatePhone(String(err.message||err),true)}finally{updatePhone()}
  });
  updatePhone();void refreshPhone();win.setInterval(()=>{if(doc.visibilityState==='visible'&&phoneState.active)updatePhone()},2000);
  // Protect against accidental navigation while a local file is being written.
  win.addEventListener('beforeunload',e=>{if(phoneState.active){e.preventDefault();e.returnValue='';}});
  // Stop the local recorder first so remote-camera stop cannot invalidate its tracks.
  if(typeof win.vcPublisherStop==='function'&&!win.vcPublisherStop.__vc1712){const prev=win.vcPublisherStop;const wrapper=async function(...args){if(phoneState.active){try{await stopPhone()}catch(e){updatePhone('Error al detener REC: '+String(e.message||e),true)}}return prev.apply(this,args)};wrapper.__vc1712=true;win.vcPublisherStop=wrapper;}
  return true;
 }
 const isPublisherLink=new URL(win.location.href).searchParams.has('vcCamera');
 if(isPublisherLink){
   if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',phoneMount,{once:true});else phoneMount();
   // The remote camera module creates this overlay after DOMContentLoaded.
   if(!phoneMount()&&win.MutationObserver){const observer=new win.MutationObserver(()=>{if(phoneMount())observer.disconnect()});observer.observe(doc.body,{childList:true,subtree:true});}
 }
 win.VC_V1712_MATCH_RECORDING={version:VERSION,readMatch,diagnostics:()=>({version:VERSION,match:readMatch(),recording:recDiag(),remote:win.VC_REMOTE_CAMERA?.diagnostics?.(),phoneRecorderActive:phoneState.active})};
}
return {pure,mount};
});
