/* Volley Coach V17.11.0 · Training Video Pro
 * Non-destructive training clip references + two-player technique comparison.
 * The original V7.7 recording engine and scouting / sync are read-only here.
 * Clip metadata stays in IndexedDB on the current device; videos NEVER auto-upload.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.11.0', DB='VolleyCoachTrainingClipsV1711', REC_DB='VolleyCoachRecordingsV770', MAX_PREVIEW_BYTES=180*1024*1024;
const clean=(v,max=120)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const num=v=>Number(v);
const safeSeconds=v=>Number.isFinite(num(v))?Math.round(num(v)*100)/100:NaN;
function validateRange(start,end,duration){
 const a=safeSeconds(start),b=safeSeconds(end),d=safeSeconds(duration);
 if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a)throw Error('Marca un inicio y un final válidos (final posterior al inicio).');
 if(b-a<0.2)throw Error('El clip debe durar al menos 0,2 segundos.');
 if(b-a>600)throw Error('El clip de referencia no puede superar 10 minutos.');
 if(Number.isFinite(d)&&d>0&&b>d+0.3)throw Error('El final del clip supera la duración del vídeo.');
 return{startSec:a,endSec:b};
}
function buildClip(input,now=Date.now(),random='x'){
 const range=validateRange(input.startSec,input.endSec,input.durationSec);
 const exercise=clean(input.exercise,150),player=clean(input.player,110);
 if(!exercise)throw Error('Selecciona o escribe el ejercicio antes de guardar el clip.');
 const recordingId=clean(input.recordingId,120),filename=clean(input.filename,180);
 if(!recordingId&&!filename)throw Error('Selecciona una grabación o un archivo local.');
 if(!Number.isFinite(now))throw Error('Fecha inválida.');
 return {id:'tclip_'+now+'_'+clean(random,20),version:VERSION,createdAt:new Date(now).toISOString(),
  sourceType:recordingId?'recording':'file',recordingId:recordingId||null,filename,
  startSec:range.startSec,endSec:range.endSec,exercise,player,team:clean(input.team,120),
  sessionDate:clean(input.sessionDate,20),note:clean(input.note,400)};
}
function filterClips(list,filter={}){
 const q=clean(filter.query,140).toLocaleLowerCase('es');
 return (Array.isArray(list)?list:[]).filter(c=>(!filter.team||c.team===filter.team)&&(!q||[c.exercise,c.player,c.note,c.filename].some(x=>String(x||'').toLocaleLowerCase('es').includes(q)))).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
function formatSeconds(n){const secs=Math.max(0,Math.floor(Number(n)||0)),cs=Math.round(((Number(n)||0)-secs)*100);return String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')+'.'+String(cs).padStart(2,'0')}
function openDB(root,name,version,upgrade){return new Promise((resolve,reject)=>{if(!root.indexedDB)return reject(Error('Este navegador no admite IndexedDB.'));const r=root.indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade?.(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('No se puede abrir el almacenamiento.'));r.onblocked=()=>reject(Error('Cierra otras pestañas de Volley Coach para actualizar la biblioteca.'));})}
async function storeClips(root){const db=await openDB(root,DB,1,db=>{if(!db.objectStoreNames.contains('clips'))db.createObjectStore('clips',{keyPath:'id'});});return db}
async function withStore(root,mode,work){const db=await storeClips(root);try{return await new Promise((resolve,reject)=>{let result;const tx=db.transaction('clips',mode);try{result=work(tx.objectStore('clips'))}catch(e){tx.abort();reject(e);return}tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('No se han guardado los metadatos.'));tx.onabort=()=>reject(tx.error||Error('Guardado interrumpido.'));})}finally{db.close()}}
async function allClips(root){const db=await storeClips(root);try{return await new Promise((resolve,reject)=>{const tx=db.transaction('clips','readonly'),r=tx.objectStore('clips').getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error||Error('No se han podido consultar los clips.'));})}finally{db.close()}}
async function writeClip(root,clip){return withStore(root,'readwrite',s=>{s.put(clip);return clip})}
async function deleteClip(root,id){return withStore(root,'readwrite',s=>{s.delete(String(id));return true})}
async function readRecording(root,id){
 const db=await openDB(root,REC_DB,1,db=>{if(!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'});if(!db.objectStoreNames.contains('chunks')){const c=db.createObjectStore('chunks',{keyPath:'key'});c.createIndex('sessionId','sessionId',{unique:false})}});
 try{
  const session=await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readonly'),req=tx.objectStore('sessions').get(String(id));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
  if(!session)throw Error('Grabación no encontrada en este dispositivo.');
  if(session.mode==='disk'){
   if(session.fileHandle){let perm=await session.fileHandle.queryPermission?.({mode:'read'});if(perm!=='granted')perm=await session.fileHandle.requestPermission?.({mode:'read'});if(perm==='granted')return {blob:await session.fileHandle.getFile(),session}}
   throw Error('La grabación se guardó en disco. Selecciona su archivo original con «Cargar archivo».');
  }
  if(!['browser','gallery'].includes(session.mode))throw Error('Formato de grabación desconocido.');
  if(Number(session.bytes)>MAX_PREVIEW_BYTES)throw Error('Vídeo demasiado grande para abrirlo desde la memoria del navegador. Exporta el archivo original y selecciónalo con «Cargar archivo».');
  const blobs=await new Promise((resolve,reject)=>{
   const tx=db.transaction('chunks','readonly'),index=tx.objectStore('chunks').index('sessionId'),req=index.openCursor(root.IDBKeyRange.only(String(id)));
   const chunks=[];let total=0,done=false;
   req.onsuccess=()=>{if(done)return;const cur=req.result;if(!cur){done=true;resolve(chunks);return}const c=cur.value;if(!(c.blob instanceof root.Blob)){done=true;reject(Error('Fragmento de vídeo ilegible.'));return}total+=c.blob.size;if(total>MAX_PREVIEW_BYTES){done=true;reject(Error('Vídeo demasiado grande. Usa el archivo original.'));return}chunks.push(c);cur.continue()};
   req.onerror=()=>{if(!done){done=true;reject(req.error)}};
   tx.onerror=()=>{if(!done){done=true;reject(tx.error)}};
  });
  if(!blobs.length)throw Error('No hay fragmentos disponibles; utiliza el archivo original.');
  blobs.sort((a,b)=>Number(a.index)-Number(b.index));
  for(let i=0;i<blobs.length;i++)if(Number(blobs[i].index)!==i)throw Error('Faltan fragmentos del vídeo. Exporta la grabación desde Recording Studio.');
  return {blob:new root.Blob(blobs.map(c=>c.blob),{type:session.mime||'video/webm'}),session};
 }finally{db.close()}
}
const STYLE=`
#vc17110-panel{display:none;min-width:0;border:1px solid #ccdded;border-radius:12px;background:#fff;padding:14px;margin:10px 0;font:500 13px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#173e62}
body.vc17100-training-video #vc17110-panel{display:grid;gap:12px}
#vc17110-panel *,#vc17110-panel *:before,#vc17110-panel *:after{box-sizing:border-box}
#vc17110-panel h3{font:800 19px/1.3 system-ui,sans-serif;margin:0;color:#133b5f}
#vc17110-panel p{margin:2px 0;color:#58748c;font-size:12px}
.vc17110-top,.vc17110-actions,.vc17110-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between}
#vc17110-panel button{width:auto!important;min-height:38px!important;border:1px solid #c5d9ea!important;border-radius:8px!important;background:#f4f9fd!important;color:#124d80!important;font:750 12px/1.2 system-ui,sans-serif!important;padding:9px 11px!important;cursor:pointer}
#vc17110-panel button.vc17110-primary{color:#fff!important;border-color:#14598b!important;background:#14598b!important}
#vc17110-panel button:disabled{opacity:.45!important;cursor:not-allowed}#vc17110-panel button:focus-visible{outline:3px solid #78b9ec!important;outline-offset:2px}
#vc17110-panel label{display:grid;gap:4px;font-weight:700;font-size:12px;min-width:0}
#vc17110-panel label span{color:#4d7290}
#vc17110-panel input,#vc17110-panel select,#vc17110-panel textarea{width:100%;min-width:0;min-height:38px;background:#fff;border:1px solid #bad2e7;border-radius:8px;padding:8px!important;font:500 12px/1.35 system-ui,sans-serif!important;color:#153d5e}
#vc17110-panel input[type=file]{font-size:11px!important;max-width:100%}
.vc17110-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
.vc17110-side{display:grid;gap:9px;padding:12px;min-width:0;border:1px solid #d9e5ef;border-radius:12px;background:#f7fafc}
.vc17110-side video{display:block;width:100%;max-height:320px;aspect-ratio:16/9;object-fit:contain;background:#101d2c;border-radius:8px}
.vc17110-sidelabel{font-size:12px;font-weight:900;color:#164976}
.vc17110-inline{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.vc17110-bottom{border-top:1px solid #e1eaf2;padding-top:12px;display:grid;gap:10px}
.vc17110-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.vc17110-fieldwide{grid-column:span 2}
#vc17110-list{display:grid;gap:7px;max-height:430px;overflow:auto}
.vc17110-clip{display:grid;gap:7px;padding:10px;border:1px solid #dae5ef;border-radius:9px;background:#fafcff}
.vc17110-clip strong{font-size:13px;color:#184d77}.vc17110-clip small{font-size:11px;color:#607e97;overflow-wrap:anywhere}
.vc17110-message{border-radius:7px;border:1px solid #d0e3f1;background:#f0f7fc;padding:9px 11px;color:#285d86!important;font-size:12px!important}
.vc17110-message[data-error="1"]{border-color:#e7b9b9;background:#fff4f4;color:#9d3838!important}
.vc17110-mini{font-size:10px!important;color:#6b8399!important}
@media(max-width:850px){.vc17110-grid,.vc17110-fields{grid-template-columns:1fr}.vc17110-fieldwide{grid-column:auto}}
`;
function mount(root){const doc=root.document;if(!doc)return false;
 const initialize=()=>{
  if(root.VC_TRAINING_VIDEO_PRO?.version===VERSION)return true;
  const host=doc.getElementById('vc17100-video-banner'),studio=doc.getElementById('scout-video-hub');
  if(!host||!studio||!root.VC17_VIDEO_UNIFIED)return false;
  const css=doc.createElement('style');css.id='vc17110-style';css.textContent=STYLE;doc.head.append(css);
  const panel=doc.createElement('section');panel.id='vc17110-panel';panel.setAttribute('aria-label','Vídeo técnico de entrenamientos');
  panel.innerHTML=`
   <div class="vc17110-top"><div><small>V17.11 · VÍDEO DE ENTRENAMIENTO PRO</small><h3>Revisión y comparación técnica</h3><p>Abre una grabación local, marca fragmentos por ejercicio y jugador y compara dos ejecuciones.</p></div><button type="button" data-vc17110="refresh">Actualizar grabaciones</button></div>
   <div class="vc17110-grid">
    <div class="vc17110-side" data-side="a"><div class="vc17110-sidelabel">A · Ejecución principal</div><label><span>Grabación de entrenamiento</span><select id="vc17110-source-a"></select></label><label><span>Cargar archivo original (si no está en la biblioteca)</span><input type="file" id="vc17110-file-a" accept="video/*"></label><video id="vc17110-video-a" controls playsinline preload="metadata"></video><div class="vc17110-inline"><label><span>Inicio (segundos)</span><input type="number" id="vc17110-start" min="0" step="0.1" value="0"></label><label><span>Fin (segundos)</span><input type="number" id="vc17110-end" min="0" step="0.1" value="10"></label></div><div class="vc17110-actions"><button type="button" data-vc17110="mark-start">Marcar inicio</button><button type="button" data-vc17110="mark-end">Marcar fin</button><button type="button" data-vc17110="play-a">Reproducir fragmento</button></div></div>
    <div class="vc17110-side" data-side="b"><div class="vc17110-sidelabel">B · Segunda ejecución para comparar</div><label><span>Grabación de entrenamiento</span><select id="vc17110-source-b"></select></label><label><span>Archivo original alternativo</span><input type="file" id="vc17110-file-b" accept="video/*"></label><video id="vc17110-video-b" controls playsinline preload="metadata"></video><label><span>Clip guardado para comparación</span><select id="vc17110-compare-clip"></select></label><div class="vc17110-actions"><button type="button" data-vc17110="compare">Reproducir A + B</button><button type="button" data-vc17110="pause">Pausar ambos</button></div><small class="vc17110-mini">La comparación inicia ambos reproductores, sin sincronización de fotogramas.</small></div>
   </div>
   <div class="vc17110-bottom"><strong>Guardar un clip del vídeo A (sin recortar el original)</strong><div class="vc17110-fields"><label><span>Ejercicio de esta sesión *</span><input id="vc17110-exercise" list="vc17110-exercises" maxlength="150" placeholder="Selecciona o escribe un ejercicio" required><datalist id="vc17110-exercises"></datalist></label><label><span>Jugador (opcional)</span><input id="vc17110-player" list="vc17110-players" maxlength="110" placeholder="Jugador / dorsal"><datalist id="vc17110-players"></datalist></label><label><span>Observación</span><input id="vc17110-note" maxlength="400" placeholder="Aspecto que debe mejorar"></label></div><div class="vc17110-actions"><button type="button" class="vc17110-primary" data-vc17110="save">Guardar clip vinculado</button><button type="button" data-vc17110="export">Exportar referencias JSON</button><small class="vc17110-mini">Los clips guardan tiempos y referencias, no generan nuevos archivos de vídeo; quedan en este dispositivo.</small></div><label><span>Buscar clips (ejercicio, jugador, nota)</span><input id="vc17110-search" placeholder="Filtrar clips"></label><div id="vc17110-list" aria-live="polite"></div></div><p id="vc17110-message" class="vc17110-message" role="status">Las grabaciones y clips son locales; exporta tus originales antes de borrar datos del navegador.</p>
  `;
  host.insertAdjacentElement('afterend',panel);
  const $=id=>doc.getElementById('vc17110-'+id);
  const sides={a:{video:$('video-a'),url:null,file:null,recordingId:'',filename:'',duration:NaN,clip:null,busy:false},b:{video:$('video-b'),url:null,file:null,recordingId:'',filename:'',duration:NaN,clip:null,busy:false}};
  let records=[],clips=[],lastSaveBusy=false;
  const message=(s,error=false)=>{const e=$('message');e.textContent=s;e.dataset.error=error?'1':'0'};
  const context=()=>root.VC17_VIDEO_UNIFIED.recordContext?.().training||{team:'Equipo',date:new Date().toISOString().slice(0,10)};
  function refreshSuggestions(){
   const exercises=[...doc.querySelectorAll('#lista-sesion .session-exercise-name')].map(x=>clean(x.textContent,150)).filter(Boolean);
   $('exercises').replaceChildren(...[...new Set(exercises)].map(n=>{const e=doc.createElement('option');e.value=n;return e}));
   const players=[...doc.querySelectorAll('#session-roster-grid .vc-attendance-player b,#session-roster-grid .session-roster-item span')].map(x=>clean(x.textContent,110)).filter(Boolean);
   $('players').replaceChildren(...[...new Set(players)].map(n=>{const e=doc.createElement('option');e.value=n;return e}));
  }
  const setOptions=(select,rows,placeholder)=>{const selected=select.value;select.replaceChildren();const first=doc.createElement('option');first.value='';first.textContent=placeholder;select.append(first);rows.forEach(r=>{const o=doc.createElement('option');o.value=r.id;o.textContent=[r.filename||r.id, r.training?.date||'',r.durationMs?formatSeconds(r.durationMs/1000):''].filter(Boolean).join(' · ');select.append(o)});if(rows.some(r=>String(r.id)===selected))select.value=selected;};
  async function refresh(){
   const api=root.VC_RECORDING_PRO;
   if(!api?.list){message('No se ha cargado Recording Pro. Puedes seleccionar un archivo original.',true);return}
   try{records=(await api.list()).filter(r=>r.training&&!r.match).sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||'')));
     setOptions($('source-a'),records,'Selecciona una grabación (o un archivo)');setOptions($('source-b'),records,'Selecciona segunda grabación');
     clips=await allClips(root);render();message(`Biblioteca preparada: ${records.length} grabaciones de entrenamiento, ${clips.length} clips vinculados.`);
   }catch(e){message('No se pudo consultar la biblioteca: '+String(e.message||e),true)}
  }
  function clearSide(key){const side=sides[key];side.video.pause();side.video.removeAttribute('src');side.video.load();if(side.url)root.URL.revokeObjectURL(side.url);side.url=null;side.file=null;side.recordingId='';side.filename='';side.duration=NaN;side.clip=null;}
  async function setBlob(key,blob,meta={}){
   if(!(blob instanceof root.Blob))throw Error('El archivo de vídeo no es válido.');
   clearSide(key);const side=sides[key];side.file=blob;side.recordingId=meta.recordingId||'';side.filename=meta.filename||blob.name||'';
   side.url=root.URL.createObjectURL(blob);side.video.src=side.url;side.video.load();
   if(key==='a'){$('start').value='0';$('end').value='10';}
  }
  async function loadRecord(key,id){
   const side=sides[key];if(side.busy)return;
   if(!id){clearSide(key);return}
   const rec=records.find(r=>String(r.id)===String(id));if(!rec){message('Grabación no encontrada.',true);return}
   side.busy=true;message('Abriendo grabación de '+(key==='a'?'A':'B')+'…');
   try{const r=await readRecording(root,rec.id);await setBlob(key,r.blob,{recordingId:rec.id,filename:rec.filename||''});message('Grabación cargada. Marca el inicio y el final del fragmento.');}
   catch(e){clearSide(key);message('No se pudo abrir: '+String(e.message||e),true)}finally{side.busy=false}
  }
  function seekTo(key,start,end){const side=sides[key];if(!side.video.src){message('Selecciona primero un vídeo para '+key.toUpperCase()+'.',true);return false}const max=Number.isFinite(side.video.duration)?side.video.duration:NaN;const range=validateRange(start,end,max);side.clip=range;try{if(side.video.readyState>=1)side.video.currentTime=range.startSec;else side.video.addEventListener('loadedmetadata',()=>{try{side.video.currentTime=range.startSec}catch(_){ }},{once:true})}catch(e){message('No se pudo ir al instante indicado.',true);return false}return true;}
  function playSide(key){const side=sides[key];if(!side.video.src)return false;const pending=side.clip;if(pending&&side.video.currentTime>=pending.endSec-0.1)side.video.currentTime=pending.startSec;side.video.play().catch(e=>message('El navegador no pudo iniciar el vídeo: '+String(e.message||e),true));return true;}
  async function loadClip(key,clip){
   if(!clip)return false;
   const side=sides[key];
   if(clip.recordingId){if(side.recordingId!==clip.recordingId)await loadRecord(key,clip.recordingId);}
   else if(!(side.filename===clip.filename&&side.video.src)){
    message('Este clip procede de un archivo local. Carga el original «'+clip.filename+'» en el reproductor '+key.toUpperCase()+'.',true);
    sides[key].pendingClip=clip;return false;
   }
   if(!side.video.src)return false;
   if(!seekTo(key,clip.startSec,clip.endSec))return false;
   if(key==='a'){$('start').value=clip.startSec;$('end').value=clip.endSec;$('exercise').value=clip.exercise;$('player').value=clip.player||'';$('note').value=clip.note||'';}
   return true;
  }
  function render(){
   const list=$('list');list.replaceChildren();const matches=filterClips(clips,{query:$('search').value});
   const compared=$('compare-clip'),selected=compared.value;compared.replaceChildren();const opt0=doc.createElement('option');opt0.value='';opt0.textContent='Selecciona un clip guardado';compared.append(opt0);
   clips.forEach(c=>{const o=doc.createElement('option');o.value=c.id;o.textContent=`${c.exercise} · ${c.player||'Equipo'} · ${formatSeconds(c.startSec)}–${formatSeconds(c.endSec)}`;compared.append(o)});if(clips.some(c=>c.id===selected))compared.value=selected;
   if(!matches.length){const empty=doc.createElement('p');empty.textContent='No hay clips guardados para este filtro.';list.append(empty);return}
   matches.slice(0,100).forEach(c=>{
    const item=doc.createElement('article');item.className='vc17110-clip';
    const title=doc.createElement('strong');title.textContent=`${c.exercise} · ${c.player||'Equipo'}`;
    const detail=doc.createElement('small');detail.textContent=`${c.sessionDate||'Sin fecha'} · ${formatSeconds(c.startSec)} → ${formatSeconds(c.endSec)} · ${c.filename||'Vídeo original'}${c.note?' · '+c.note:''}`;
    const actions=doc.createElement('div');actions.className='vc17110-actions';
    for(const [label,cmd] of [['Abrir en A','a'],['Comparar en B','b'],['Eliminar referencia','delete']]){
     const b=doc.createElement('button');b.type='button';b.textContent=label;
     b.addEventListener('click',async()=>{if(cmd==='delete'){if(!root.confirm('¿Eliminar esta referencia de clip? El vídeo original no se borrará.'))return;try{await deleteClip(root,c.id);clips=clips.filter(x=>x.id!==c.id);render();message('Referencia eliminada. El vídeo no se ha modificado.')}catch(e){message(String(e.message||e),true)}return}b.disabled=true;try{await loadClip(cmd,c)}catch(e){message(String(e.message||e),true)}finally{b.disabled=false}});
     actions.append(b);
    }
    item.append(title,detail,actions);list.append(item);
   });
  }
  async function save(){
   if(lastSaveBusy)return;const side=sides.a;if(!side.video.src){message('Selecciona una grabación en el reproductor A.',true);return}
   if(side.video.error){message('El vídeo no se puede reproducir. Prueba con el archivo original.',true);return}
   const c=context();let clip;
   try{clip=buildClip({startSec:$('start').value,endSec:$('end').value,durationSec:side.video.duration,exercise:$('exercise').value,player:$('player').value,note:$('note').value,
     recordingId:side.recordingId,filename:side.filename,team:c.team,sessionDate:c.date},Date.now(),Math.random().toString(36).slice(2,9));}
   catch(e){message(String(e.message||e),true);return}
   lastSaveBusy=true;
   try{await writeClip(root,clip);clips.unshift(clip);render();message('Clip vinculado guardado en este navegador. El vídeo original permanece intacto.');}
   catch(e){message('No se pudo guardar el clip: '+String(e.message||e),true)}finally{lastSaveBusy=false}
  }
  function exportJSON(){const data=filterClips(clips);const blob=new root.Blob([JSON.stringify({schema:'volley-coach-training-clips-v1',createdAt:new Date().toISOString(),clips:data},null,2)],{type:'application/json'});const url=root.URL.createObjectURL(blob);const a=doc.createElement('a');a.href=url;a.download='VolleyCoach_clips_entrenamiento_'+new Date().toISOString().slice(0,10)+'.json';doc.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),60000);message('Exportación de referencias solicitada. Los vídeos originales no están incluidos.');}
  for(const key of ['a','b']){
   const side=sides[key];const select=$('source-'+key),input=$('file-'+key);
   select.addEventListener('change',()=>{void loadRecord(key,select.value)});
   input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{select.value='';await setBlob(key,file,{filename:file.name});message('Archivo local cargado. Conserva el original para volver a abrir los clips.');if(side.pendingClip){const pending=side.pendingClip;side.pendingClip=null;if(file.name===pending.filename)await loadClip(key,pending);else message('El archivo no coincide con el clip guardado. Selecciona el original correcto.',true);}}catch(e){message(String(e.message||e),true)}});
   side.video.addEventListener('loadedmetadata',()=>{side.duration=side.video.duration;if(key==='a'&&Number.isFinite(side.duration)&&!side.clip){$('end').value=String(Math.min(10,Math.floor(side.duration*10)/10))}});
   side.video.addEventListener('timeupdate',()=>{if(side.clip&&side.video.currentTime>=side.clip.endSec-0.04){side.video.pause();}});
  }
  panel.addEventListener('click',event=>{const b=event.target.closest('button[data-vc17110]');if(!b)return;const act=b.dataset.vc17110;
   if(act==='refresh')void refresh();if(act==='mark-start')$('start').value=String(Math.round(sides.a.video.currentTime*10)/10);
   if(act==='mark-end')$('end').value=String(Math.round(sides.a.video.currentTime*10)/10);
   if(act==='play-a'){try{if(seekTo('a',$('start').value,$('end').value))playSide('a')}catch(e){message(String(e.message||e),true)}}
   if(act==='compare'){try{if(!sides.a.video.src||!sides.b.video.src)throw Error('Carga un vídeo en A y otro en B.');const ra=validateRange($('start').value,$('end').value,sides.a.video.duration);sides.a.clip=ra;sides.a.video.currentTime=ra.startSec;
    if(!sides.b.clip){const cap=Number.isFinite(sides.b.video.duration)?sides.b.video.duration:Infinity;sides.b.clip={startSec:0,endSec:cap};sides.b.video.currentTime=0;}
    playSide('a');playSide('b');message('Comparación iniciada. La reproducción no está sincronizada a nivel de fotograma.');}catch(e){message(String(e.message||e),true)}}
   if(act==='pause'){sides.a.video.pause();sides.b.video.pause()}
   if(act==='save')void save();if(act==='export')exportJSON();
  });
  $('compare-clip').addEventListener('change',async()=>{const clip=clips.find(c=>c.id===$('compare-clip').value);if(clip)try{await loadClip('b',clip)}catch(e){message(String(e.message||e),true)}});
  $('search').addEventListener('input',render);
  const dock=doc.getElementById('vc17100-training-dock');if(dock){const actions=dock.querySelector('.vc17100-dock-actions');if(actions){const btn=doc.createElement('button');btn.type='button';btn.className='vc17100-main';btn.textContent='Revisar clips / comparar';btn.addEventListener('click',()=>{refreshSuggestions();root.VC17_VIDEO_UNIFIED.open('training','studio');void refresh();panel.scrollIntoView({block:'start',behavior:'smooth'});});actions.append(btn)}}
  const old=doc.getElementById('vc17100-library');if(old)old.dataset.vc17110LegacyLibrary='1';
  // Keep video from playing invisibly when the coach navigates back to a match.
  const visibilityGuard=new root.MutationObserver(()=>{if(!doc.body.classList.contains('vc17100-training-video')){sides.a.video.pause();sides.b.video.pause()}});
  visibilityGuard.observe(doc.body,{attributes:true,attributeFilter:['class']});
  // Populate on demand; no background video reads or new polling loops.
  root.VC_TRAINING_VIDEO_PRO={version:VERSION,refresh,save,diagnostics:()=>({version:VERSION,recordings:records.length,clips:clips.length,players:2,writeEngineModified:false}),destroy:()=>{visibilityGuard.disconnect();Object.values(sides).forEach(s=>{s.video.pause();if(s.url)root.URL.revokeObjectURL(s.url)})}};
  doc.addEventListener('click',event=>{const btn=event.target.closest('[data-vc17100-kind="training"][data-vc17100-action="studio"]');if(btn){refreshSuggestions();void refresh();}});
  void refresh();refreshSuggestions();return true;
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();return true;
}
return{VERSION,MAX_PREVIEW_BYTES,clean,validateRange,buildClip,filterClips,formatSeconds,readRecording,allClips,writeClip,deleteClip,mount};
});
