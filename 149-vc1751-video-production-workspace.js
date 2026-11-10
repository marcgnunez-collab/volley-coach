/* Volley Coach V17.5.1 · Video Production Workspace
 * Presentation/read-only recording-library adapter for the existing Video Review,
 * Recording Pro, Live/Delay and Clip Studio. No additional media element, Recorder,
 * database, upload or scouting state. All actions delegate to the original engines.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root?.document){
    // Legacy Video Studio mounts on DOMContentLoaded. This deferred V17 script may
    // execute at readyState=interactive *before* that listener runs. Mount only
    // after the original workspace is ready to avoid creating a stray grid item.
    const doc=root.document;
    if(doc.readyState==='loading'||(doc.readyState==='interactive'&&!doc.getElementById('vc1642-command')))
      doc.addEventListener('DOMContentLoaded',()=>api.mount(root),{once:true});
    else api.mount(root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.5.1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=x=>String(x??'').trim()&&String(x).trim()!=='0'?String(x).trim():'';
function readableBytes(bytes){const n=Number(bytes);if(!Number.isFinite(n)||n<0)return '—';return n>=1073741824?(n/1073741824).toFixed(2)+' GB':n>=1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB'}
function readableDuration(ms){const n=Number(ms);if(!Number.isFinite(n)||n<0)return '—';const t=Math.floor(n/1000);return String(Math.floor(t/3600)).padStart(2,'0')+':'+String(Math.floor(t%3600/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function sameMatch(rec,matchId){const recorded=validId(rec?.match?.id),selected=validId(matchId);return !recorded||!!selected&&recorded===selected}
function recordingRows(items,matchId){return (Array.isArray(items)?items:[]).map(r=>({
  id:String(r?.id??''),name:String(r?.filename||'Grabación sin nombre'),date:String(r?.startedAt||''),
  duration:readableDuration(r?.durationMs),size:readableBytes(r?.bytes),completed:!!r?.completed,
  compatible:!!validId(matchId)&&sameMatch(r,matchId),linkedMatch:validId(r?.match?.id),mode:String(r?.mode||''),error:!!r?.error
 })).filter(x=>x.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50)}
function readiness(d={},rec={},source='',matchId=''){
 const selected=validId(matchId||d.match), sourceText=String(source||d.mediaType||'').toUpperCase().trim();
 const isLive=/\bLIVE\b/.test(sourceText),isDelay=/\bDELAY\b/.test(sourceText);
 const loaded=!!d.videoLoaded;
 const videoMatch=validId(d.fileMatchId),mismatch=loaded&&!!selected&&!!videoMatch&&selected!==videoMatch;
 const sync=Number.isFinite(Number(d.syncOffset))&&d.syncOffset!==null&&d.syncOffset!=='';
 return {
  selectedMatch:selected,source:sourceText||'SIN FUENTE',loaded,live:isLive,delay:isDelay,mismatch,
  linkedVideo:loaded&&!mismatch,videoSync:loaded&&!mismatch&&sync,
  offset:sync?Number(d.syncOffset):null,recording:!!rec.active,
  sourceDescription: mismatch?'El archivo cargado corresponde a otro scouting':
    isLive?'Fuente LIVE seleccionada (no equivale a grabación)':
    isDelay?'Fuente DELAY seleccionada (no equivale a archivo guardado)':
    loaded?'Reproductor con fuente disponible':'Selecciona un archivo, grabación o fuente',
  status: mismatch?'warn':loaded?'ready':isLive||isDelay?'source':'empty'
 };
}
function mount(root){
 const doc=root.document,$=id=>doc.getElementById(id),hub=$('scout-video-hub'),grid=hub?.querySelector('.v780-hub');
 if(!hub||!grid||$('vc1751-desk'))return false;
 const command=$('vc1642-command');if(!command||command.parentElement!==grid)return false;
 const desk=doc.createElement('section');desk.id='vc1751-desk';desk.className='vc1751-desk';desk.setAttribute('aria-label','Centro de producción de vídeo');
 desk.innerHTML=`
  <div class="vc1751-heading"><div><span class="vc1751-kicker">VIDEO STUDIO · V${VERSION}</span><h3>Centro de producción</h3><p>Un partido, una fuente y un reproductor. Revisa el estado antes de grabar o crear clips.</p></div>
   <button type="button" data-vc1751="library" id="vc1751-library-open" aria-expanded="false">Biblioteca de grabaciones</button></div>
  <div class="vc1751-readiness" role="status" aria-live="polite">
    <div><small>Partido de referencia</small><strong id="vc1751-match">Sin seleccionar</strong><span id="vc1751-match-note">Elige un scouting en el selector existente</span></div>
    <div><small>Fuente de vídeo</small><strong id="vc1751-source">Sin fuente</strong><span id="vc1751-source-note">Ningún archivo o cámara disponible</span></div>
    <div><small>Marca temporal</small><strong id="vc1751-timecode">Sin sincronizar</strong><span>Sincronización de vídeo, no de nube</span></div>
    <div><small>Grabación local</small><strong id="vc1751-recording">Sin grabar</strong><span>Los vídeos no se suben a Supabase</span></div>
  </div>
  <div class="vc1751-shortcuts" aria-label="Ir a los controles existentes">
    <button type="button" data-vc1751="source">Fuentes y cámara</button>
    <button type="button" data-vc1751="record">Control REC</button>
    <button type="button" data-vc1751="sync">Sincronizar vídeo</button>
    <button type="button" data-vc1751="review">Revisar rallies</button>
    <button type="button" data-vc1751="clips">Clips y playlists</button>
  </div>
  <section id="vc1751-library" class="vc1751-library" aria-label="Grabaciones almacenadas" hidden>
    <div class="vc1751-library-head"><div><h4>Grabaciones de este dispositivo</h4><p>Solo se muestran metadatos. Abrir una grabación no la elimina ni inicia una nueva captura.</p></div><div><button type="button" data-vc1751="refresh">Actualizar</button><button type="button" data-vc1751="close">Cerrar</button></div></div>
    <p id="vc1751-library-state" role="status">Pulsa Actualizar para consultar las sesiones guardadas.</p>
    <div id="vc1751-recordings" class="vc1751-recordings"></div>
  </section>
  <p id="vc1751-feedback" class="vc1751-feedback" aria-live="polite">Selecciona un partido y carga una fuente para comenzar.</p>`;
 // Preserve original video DOM and controls; add a presentation section only.
 command.appendChild(desk);
 let revision=0,reading=false,activeOpen=false,refreshes=0,lastError='';
 const show=(message,error=false)=>{lastError=error?message:'';const el=$('vc1751-feedback');if(el){el.textContent=message;el.dataset.error=error?'1':'0'}};
 const mode=kind=>{const set=root.VC_VIDEO_STUDIO_1642?.setMode;return typeof set==='function'&&set(kind)!==false};
 const scrollTo=id=>{const el=$(id);if(!el)return false;try{el.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(_){el.scrollIntoView?.()}return true};
 const setText=(id,value)=>{const node=$(id);if(node&&node.textContent!==String(value))node.textContent=String(value)};
 function diagnostics(){let d={},r={};try{d=root.v780Diagnostics?.()||{}}catch(_){}try{r=root.vcRecordingDiagnostics?.()||{}}catch(_){}return readiness(d,r,$('v117-review-source-label')?.textContent||'', $('v780-match')?.value||'')}
 function refresh(){const p=diagnostics();refreshes++;
  const matchOpt=$('v780-match')?.selectedOptions?.[0];
  setText('vc1751-match',p.selectedMatch?(matchOpt?.textContent?.trim()||('Partido '+p.selectedMatch)):'Sin seleccionar');
  setText('vc1751-match-note',p.selectedMatch?'Scouting seleccionado en Video Studio':'Selecciona un partido antes de abrir una grabación');
  setText('vc1751-source',p.source);setText('vc1751-source-note',p.sourceDescription);
  setText('vc1751-timecode',p.videoSync?'Desfase '+p.offset.toFixed(1)+' s':p.mismatch?'Partido distinto':'Sin marca confirmada');
  setText('vc1751-recording',p.recording?'REC en curso':'Sin grabación activa');
  desk.dataset.videoState=p.status;
  const syncButton=desk.querySelector('[data-vc1751="sync"]');if(syncButton)syncButton.disabled=!p.selectedMatch;
  return p;
 }
 let scheduled=false;
 function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||((f)=>f()))(()=>{scheduled=false;refresh()})}
 async function openLibrary(){activeOpen=true;const p=$('vc1751-library');p.hidden=false;desk.querySelector('#vc1751-library-open')?.setAttribute('aria-expanded','true');await loadLibrary()}
 function closeLibrary(){activeOpen=false;revision++;const p=$('vc1751-library');if(p)p.hidden=true;desk.querySelector('#vc1751-library-open')?.setAttribute('aria-expanded','false')}
 async function loadLibrary(){const el=$('vc1751-recordings'),info=$('vc1751-library-state');
   if(!el||!info||!activeOpen)return false;
   if(reading){show('Se está consultando la biblioteca.');return false}
   const n=++revision;
   const list=root.VC_RECORDING_PRO?.list;if(typeof list!=='function'){info.textContent='Recording Pro todavía no está disponible.';return false}
   reading=true;info.textContent='Consultando grabaciones guardadas en este navegador…';
   try{
    const data=await list();if(n!==revision||!activeOpen)return false;
    const selected=$('v780-match')?.value||'';const rows=recordingRows(data,selected);
    info.textContent=rows.length?`${rows.length} grabaciones locales · ${rows.filter(r=>r.compatible).length} disponibles para el partido seleccionado`:'No hay grabaciones guardadas en este navegador.';
    el.innerHTML=rows.map(r=>`<article class="vc1751-recording"><div><strong>${esc(r.name)}</strong><small>${esc(r.date?new Date(r.date).toLocaleString('es-ES'):'Fecha no registrada')} · ${r.duration} · ${r.size}</small><span>${r.completed?'Finalizada':'Incompleta'} · ${esc(r.mode||'Local')} ${r.linkedMatch?'· Partido '+esc(r.linkedMatch):'· Sin partido vinculado'}${r.error?' · Incidencia registrada':''}</span></div><button type="button" data-vc1751-open="${esc(r.id)}" ${r.compatible?'':'disabled title="Pertenece a otro partido o no hay partido seleccionado"'}>Abrir</button></article>`).join('')||'<div class="vc1751-empty">Sin grabaciones. Las grabaciones guardadas en otro dispositivo no aparecen aquí automáticamente.</div>';
    show('Biblioteca consultada. Los archivos de vídeo permanecen en este dispositivo.');return true;
   }catch(e){if(n===revision){info.textContent='No se ha podido leer la biblioteca local.';show('Error de lectura de grabaciones: '+String(e?.message||e),true)}return false}
   finally{reading=false}
 }
 async function openRecording(id){const btn=Array.from(desk.querySelectorAll('[data-vc1751-open]')).find(x=>x.dataset.vc1751Open===String(id));
   const list=root.VC_RECORDING_PRO?.list;const open=root.v780OpenRecordingById;
   if(typeof list!=='function'||typeof open!=='function'){show('No están disponibles las funciones originales de grabación.',true);return false}
   const match=$('v780-match')?.value||'';if(!validId(match)){show('Selecciona un partido en Video Studio antes de abrir una grabación.',true);return false}
   try{const all=await list();const rec=all.find(r=>String(r?.id)===String(id));if(!rec||!sameMatch(rec,match)){show('La grabación pertenece a otro partido. Selecciona su scouting antes de abrirla.',true);return false}
     if(btn)btn.disabled=true;
     const ok=await open(id);if(ok===false){show('No se ha podido cargar la grabación.',true);return false}
     closeLibrary();mode('review');show('Grabación cargada desde el motor original. Comprueba su sincronización temporal antes de crear clips.');schedule();return true;
   }catch(e){show('No se pudo abrir la grabación: '+String(e?.message||e),true);return false}
   finally{if(btn)btn.disabled=false}
 }
 const action=async name=>{
  if(name==='library'){if(activeOpen)closeLibrary();else await openLibrary();return}
  if(name==='refresh'){await loadLibrary();return}
  if(name==='close'){closeLibrary();return}
  if(name==='source'){if(mode('capture')){scrollTo('v117-review-source-label');show('Selecciona LIVE, DELAY, archivo o YouTube con los controles originales.')}return}
  if(name==='record'){if(!mode('capture'))return;const ok=scrollTo('vc-rec34-strip')||scrollTo('v117-review-live-tools');show(ok?'Utiliza Iniciar REC y Finalizar y guardar en el panel original.':'El panel de grabación todavía no está disponible.',!ok);return}
  if(name==='sync'){if(!validId($('v780-match')?.value)){show('Selecciona primero un partido.',true);return}if(!mode('review'))return;
   const btn=$('vc1611-open');if(btn){btn.click();scrollTo('vc1611-wizard');show('Abierto el asistente original de sincronización temporal de vídeo.')}else{scrollTo('v780-sync-panel');show('Consulta la sincronización temporal del vídeo en el panel original.')}return}
  if(name==='review'){if(mode('review')){scrollTo('v780-timeline');show('Selecciona una jugada en la línea temporal para reproducirla.')}return}
  if(name==='clips'){if(mode('clips')){scrollTo('vc-clip33');show('Clip Studio utiliza las marcas de tiempo y el vídeo actual.')}return}
 };
 desk.addEventListener('click',event=>{
   const btn=event.target.closest('button');if(!btn||!desk.contains(btn)||btn.disabled)return;
   if(btn.dataset.vc1751Open)openRecording(btn.dataset.vc1751Open);
   else if(btn.dataset.vc1751)action(btn.dataset.vc1751);
 });
 for(const id of ['v780-match','v117-review-source-label','v780-video-state','v780-sync-state','vc-rec34-strip-status']){
  const el=$(id);if(!el)continue;
  if(id==='v780-match')el.addEventListener('change',()=>{schedule();if(activeOpen)loadLibrary()});
  else if(root.MutationObserver)new root.MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
 }
 for(const id of ['v780-player-video']){const video=$(id);for(const ev of ['loadedmetadata','emptied','durationchange','error'])video?.addEventListener(ev,schedule)}
 refresh();
 const api={version:VERSION,refresh,diagnostics:()=>({version:VERSION,opened:activeOpen,refreshes,mediaElements:hub.querySelectorAll('#v780-player-video').length,streamElements:hub.querySelectorAll('#v117-review-stream').length,lastError}),openLibrary,closeLibrary,loadLibrary,openRecording};
 root.VC_VIDEO_PRODUCTION_1751=api;return true;
}
return {version:VERSION,mount,readiness,recordingRows,sameMatch,readableBytes,readableDuration};
});
