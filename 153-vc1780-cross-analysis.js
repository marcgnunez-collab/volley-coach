/* V20.7.17 · Source-preserving defer bundle. Original scripts in exact execution order. */
/* VC20717_SOURCE_BEGIN:149-vc1751-video-production-workspace.js */
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

/* VC20717_SOURCE_END:149-vc1751-video-production-workspace.js */

/* VC20717_SOURCE_BEGIN:150-vc1752-scouting-fast-flow.js */
/* Volley Coach V17.5.4 · Ruta automática, panel tras la pista y barra legible.
 * Presentación/draft only: no añade acciones, puntos, rally, nube ni guardado.
 * Reutiliza el teclado 9×4, los dos campos existentes y el motor de scouting.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  const doc=root.document;
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>api.mount(root),{once:true});
  else api.mount(root);
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.5.4';
 const ORIENTATION=Object.freeze(['C','B','D','A']);
 const safeUndo=(now,snapshot)=>snapshot&&String(now)===String(snapshot.after)?snapshot.before:null;
 const nextStep=(step,applied)=>!applied?step:step==='origin'?'destination':step==='destination'?'done':'done';
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  const panel=$('v113-video-code-panel');if(!panel)return false;
  let step='origin',originToken='',destinationToken='',lastEdit=null,latest=[],mounted=false;
  function input(){const video=$('v113-video-code'),direct=$('v800-code');
   if(video?.getClientRects?.().length)return video;
   if(direct?.getClientRects?.().length)return direct;
   return video||direct||null;
  }
  function board(){return root.VC_1613_ZONE_BOARD}
  function status(message){const node=$('vc1752-feedback');if(node&&node.textContent!==message)node.textContent=message}
  function routeHighlight(){
   const court=$('vc1613-board');if(!court)return;
   for(const b of court.querySelectorAll('[data-zone]')){
    const key=String(b.dataset.zone||'')+String(b.dataset.sub||'');
    b.classList.toggle('vc1752-origin',!!originToken&&key===originToken);
    b.classList.toggle('vc1752-destination',!!destinationToken&&key===destinationToken);
   }
   const summary=$('vc1752-route');
   if(summary)summary.textContent=originToken
    ?'Origen Z'+originToken+(destinationToken?' → Destino Z'+destinationToken:' → toca una casilla diferente para el destino')
    :step==='off'?'Modo manual · solo destino':'Automático · 1.ª casilla: origen · 2.ª casilla: destino';
  }
  function update(){const el=$('vc1752-strip');if(!el)return;
   el.dataset.step=step;
   const guided=$('vc1752-guide');if(guided){guided.setAttribute('aria-pressed',String(step==='origin'||step==='destination'));guided.textContent=step==='origin'?'AUTO · 1/2 ORIGEN':step==='destination'?'AUTO · 2/2 DESTINO':'Activar ruta automática'}
   const undo=$('vc1752-undo');if(undo)undo.disabled=(safeUndo(input()?.value,lastEdit)===null);
   const recent=$('vc1752-recent');if(recent){recent.replaceChildren();for(const token of latest){
    const b=doc.createElement('button');b.type='button';b.dataset.vc1752Token=token;b.textContent=token;b.title='Aplicar Z'+token+' al código';b.setAttribute('aria-label','Repetir zona '+token);recent.appendChild(b)
   }}
   routeHighlight();
  }
  function setStep(value){step=value;
   if(value==='origin'||value==='destination')board()?.setMode?.(value);
   update();
  }
  function ensure(){
   const entry=panel.querySelector('.v113-video-code-entry'),zone=$('vc1613-board');
   if(!entry||!zone)return false;
   let strip=$('vc1752-strip'),created=false;
   if(!strip){created=true;
    strip=doc.createElement('section');strip.id='vc1752-strip';strip.className='vc1752-strip';strip.setAttribute('aria-label','Codificación rápida');
    strip.innerHTML=`<div class="vc1752-heading"><b>SCOUTING RÁPIDO · V${VERSION}</b><small>Dos casillas: origen y destino · sin guardar automáticamente</small></div>
     <div class="vc1752-actions"><button type="button" id="vc1752-guide" aria-pressed="true">AUTO · 1/2 ORIGEN</button><button type="button" id="vc1752-dest">Solo destino</button><button type="button" id="vc1752-focus">Foco código</button><button type="button" id="vc1752-undo" disabled>Deshacer código</button></div>
     <div id="vc1752-route" class="vc1752-route" role="status">Automático · 1.ª casilla: origen · 2.ª casilla: destino</div>
     <div class="vc1752-bottom"><span>Repetir zona:</span><div id="vc1752-recent" aria-label="Últimas cuatro zonas"></div></div>
     <p id="vc1752-feedback" role="status" aria-live="polite">Escribe el código y toca dos casillas diferentes: origen y destino. Pulsa Añadir para registrar.</p>`;
    strip.addEventListener('click',e=>{
     const b=e.target.closest('button');if(!b)return;
     if(b.id==='vc1752-guide'){
      if(step==='origin'||step==='destination'){originToken='';destinationToken='';setStep('off');board()?.setMode?.('destination');status('Ruta automática desactivada: elige solo el destino.')}
      else{originToken='';destinationToken='';setStep('origin');status('Ruta automática activada: toca la casilla de origen.')} 
     }else if(b.id==='vc1752-dest'){originToken='';destinationToken='';setStep('off');board()?.setMode?.('destination');status('Modo manual: selecciona únicamente el destino o contacto.')}
     else if(b.id==='vc1752-focus') {input()?.focus?.({preventScroll:true})}
     else if(b.id==='vc1752-undo'){
      const target=input(),value=safeUndo(target?.value,lastEdit);if(!target||value===null)return;
      const edit=lastEdit;
      target.value=value;target.dispatchEvent(new Event('input',{bubbles:true}));lastEdit=null;
      if(edit?.stage==='destination'){originToken=edit.origin;destinationToken='';setStep('destination');board()?.restoreModeContext?.('origin','destination');status('Destino deshecho: marca una casilla distinta del origen.')}
      else if(edit?.stage==='origin'){originToken='';destinationToken='';setStep('origin');board()?.restoreModeContext?.('destination','origin');status('Origen deshecho: marca una nueva casilla de origen.')}
      else {setStep('off');board()?.setMode?.('destination');status('Última selección deshecha. No se ha modificado el partido.')}
     }else if(b.dataset.vc1752Token){const token=b.dataset.vc1752Token;
      board()?.applyToken?.(token[0],token.slice(1));
     }
    });
   }
   // Keep the panel UNDER the 9×4 court inside its existing section.
   // This preserves the court's required sibling order (right before the
   // video keyboard) and avoids a move/reinsert loop during rerenders.
   if(strip.parentElement!==zone||zone.lastElementChild!==strip)zone.appendChild(strip);
   if(created||!mounted){mounted=true;update()}
   return true;
  }
  function onZone(e){
   const d=e.detail||{};
   if(!d.zone||!d.before||d.before===d.after)return;
   const token=String(d.token||'');
   if(!/^[1-9][ABCD]?$/.test(token))return;
   const stage=step;
   // The second cell must differ from the first. Restore only the draft code.
   if(stage==='destination'&&d.mode==='destination'&&token===originToken){
    const target=input();
    if(target&&target.value===d.after){target.value=d.before;target.dispatchEvent(new Event('input',{bubbles:true}))}
    board()?.restoreModeContext?.('origin','destination');
    status('Has marcado el mismo origen. Toca una casilla diferente para indicar el destino.');
    update();return;
   }
   lastEdit={before:d.before,after:d.after,stage:stage===d.mode?stage:'manual',origin:originToken};
   latest=[token,...latest.filter(x=>x!==token)].slice(0,4);
   if(stage==='origin'&&d.mode==='origin'){
    originToken=token;destinationToken='';setStep('destination');
    status('Origen Z'+token+' marcado. Toca otra casilla para el destino.');
   }else if(stage==='destination'&&d.mode==='destination'){
    destinationToken=token;setStep('origin');
    status('Ruta Z'+originToken+' → Z'+token+' completada en el código. Pulsa Añadir/Enter para registrar; próxima ruta: origen.');
   }else status('Z'+token+' aplicada al código. Revisa antes de registrar.');
   update();
  }
  function onManualMode(e){
   const mode=e.detail?.mode;
   if(mode!=='origin'&&mode!=='destination')return;
   step='off';originToken='';destinationToken='';update();
   status('Selección manual '+(mode==='origin'?'de origen':'de destino')+'. Pulsa «Activar ruta automática» para volver a dos toques.');
  }
  function installStyle(){if($('vc1752-style'))return;
   const el=doc.createElement('style');el.id='vc1752-style';el.textContent=`
 /* V17.5.4 · Estado operativo compacto: evita el texto apilado sin estructura */
 body.v11-shell #scout-match-mode #vc54-operation-bar{
  display:grid!important;grid-template-columns:minmax(96px,1.05fr) minmax(70px,.6fr) minmax(90px,.8fr) minmax(112px,1fr) minmax(105px,1fr) minmax(130px,1.1fr)!important;
  align-items:stretch!important;gap:7px!important;max-width:100%!important;margin:10px 0 14px!important;padding:9px!important;
  background:#f6faff!important;border:1px solid #d2e0ee!important;border-radius:13px!important;
  box-sizing:border-box!important;color:#183d62!important;overflow:visible!important;
  font:650 12px/1.35 system-ui,sans-serif!important;
 }
 body.v11-shell #scout-match-mode #vc54-operation-bar>div{min-width:0!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;gap:3px!important;padding:8px 11px!important;background:#fff!important;border:1px solid #dfebf5!important;border-radius:9px!important;white-space:normal!important;overflow-wrap:anywhere!important}
 body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-live-indicator{flex-direction:row!important;align-items:center!important;gap:7px!important;color:#16704a!important;font-size:11px!important;font-weight:850!important;letter-spacing:.025em!important}
 body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-live-indicator i{display:inline-block!important;flex:0 0 8px!important;width:8px!important;height:8px!important;border-radius:50%!important;background:#17a36f!important}
 body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-operation small{display:block!important;color:#617d98!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important;letter-spacing:.045em!important}
 body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-operation strong{display:block!important;color:#143a60!important;font-size:13px!important;font-weight:800!important;line-height:1.3!important;white-space:normal!important}
 body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-clock strong{font-variant-numeric:tabular-nums!important}
 @media(max-width:870px){body.v11-shell #scout-match-mode #vc54-operation-bar{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
 @media(max-width:530px){body.v11-shell #scout-match-mode #vc54-operation-bar{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:6px!important;gap:5px!important;margin:8px 0 11px!important}body.v11-shell #scout-match-mode #vc54-operation-bar>div{padding:8px!important}body.v11-shell #scout-match-mode #vc54-operation-bar .vc54-clock{grid-column:span 2!important}}
 #scout-match-mode #vc1613-board #vc1752-strip{display:grid;gap:9px;margin:12px 0 0;padding:11px;background:#fff;border:1px solid #b8d1e6;border-radius:10px;min-width:0;font:650 12px/1.45 system-ui,sans-serif;color:#285477}
 #scout-match-mode .vc1752-heading{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
 #scout-match-mode .vc1752-heading b{font-size:12px;color:#114a7a;letter-spacing:.045em}
 #scout-match-mode .vc1752-heading small{font-size:11px;color:#658098}
 #scout-match-mode .vc1752-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;min-width:0}
 body.v11-shell #scout-match-mode #vc1752-strip button{min-height:35px!important;min-width:0!important;border:1px solid #bfd3e6!important;border-radius:7px!important;background:#f5f9fd!important;color:#24587f!important;padding:6px!important;font:750 11px/1.25 system-ui,sans-serif!important;box-shadow:none!important}
 body.v11-shell #scout-match-mode #vc1752-guide[aria-pressed="true"]{background:#1e67b2!important;color:white!important;border-color:#1e67b2!important}
 body.v11-shell #scout-match-mode #vc1752-strip button:disabled{opacity:.45!important;cursor:not-allowed}
 body.v11-shell #scout-match-mode #vc1752-strip button:focus-visible{outline:3px solid #83b9ea!important;outline-offset:2px}
 #scout-match-mode .vc1752-route{background:#e5f2fc;border:1px solid #bfd8ec;border-radius:7px;padding:7px 9px;color:#185580;font:750 11px/1.45 system-ui,sans-serif}
 body.v11-shell #scout-match-mode #vc1613-board [data-zone].vc1752-origin{box-shadow:inset 0 0 0 3px #1594bd!important}
 body.v11-shell #scout-match-mode #vc1613-board [data-zone].vc1752-destination{box-shadow:inset 0 0 0 3px #e69b37!important}
 #scout-match-mode .vc1752-bottom{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:#69839a;font-size:11px}
 #scout-match-mode #vc1752-recent{display:flex;gap:4px;flex-wrap:wrap}
 body.v11-shell #scout-match-mode #vc1752-recent button{min-height:27px!important;min-width:36px!important;font-weight:850!important}
 #scout-match-mode #vc1752-feedback{margin:0!important;color:#507c9b;font-size:11px;line-height:1.45;overflow-wrap:anywhere}
 #scout-match-mode #vc1613-board .vc1613-quads button{min-height:32px!important;font-size:12px!important}
 @media(max-width:650px){#scout-match-mode .vc1752-actions{grid-template-columns:repeat(2,minmax(0,1fr))}body.v11-shell #scout-match-mode #vc1752-strip button{min-height:43px!important}#scout-match-mode #vc1613-board .vc1613-quads button{min-height:38px!important}}
 `;doc.head.appendChild(el)
  }
  installStyle();
  root.addEventListener('vc1752:zone-applied',onZone);
  root.addEventListener('vc1752:zone-mode-manual',onManualMode);
  const observer=new MutationObserver(()=>ensure());
  observer.observe(panel,{childList:true,subtree:true});
  for(const id of ['v113-video-code','v800-code']){const field=$(id);if(field)field.addEventListener('input',update)}
  ensure();
  // The route is active immediately: no extra activation button is needed.
  board()?.setMode?.('origin');
  update();
  return true;
 }
 return {version:VERSION,orientation:ORIENTATION,nextStep,safeUndo,mount};
});

/* VC20717_SOURCE_END:150-vc1752-scouting-fast-flow.js */

/* VC20717_SOURCE_BEGIN:152-vc1770-video-pro.js */
/* Volley Coach V17.7.0 · Vídeo Pro
 * Extiende exclusivamente la vista de scouting sobre vídeo existente.
 * Nunca crea media, cambia la fuente, altera el scouting ni escribe en almacenamiento.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){
  const ready=()=>api.mount(root);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.7.0';
 const ID='vc1770-video-pro';
 const isEditable=el=>!!el?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"]');
 const isReplaySource=s=>s==='local'||s==='youtube';
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  const shell=()=>$('v800-shell'),drawer=()=>$('v112-video-drawer');
  if(!shell()||!drawer())return false;
  let layout='balanced', mounted=0, seeks=0, toggles=0, shortcutCount=0;
  let pending=false;
  const open=()=>!!shell()?.classList.contains('v112-video-open')&&!!$('scout-match-mode')?.classList.contains('active');
  const theater=()=>!!drawer()?.classList.contains('vc1644-theater');
  const selectedSource=()=>{
   for(const s of ['local','youtube','delay','live']){
    const tab=$('v802-source-'+s);
    if(tab?.classList.contains('active')||tab?.getAttribute('aria-selected')==='true')return s;
   }
   const label=($('v116-source-label')?.textContent||'').trim().toUpperCase();
   if(label.includes('YOUTUBE'))return 'youtube';
   if(label.includes('ARCHIVO')||label.includes('LOCAL'))return 'local';
   if(label.includes('DELAY'))return 'delay';
   return 'live';
  };
  const ready=()=>{
   const s=selectedSource();
   if(s==='local'){
    const video=$('v802-local-video');
    return !!video?.getAttribute('src')||!!video?.currentSrc;
   }
   if(s==='youtube'){
    const box=$('v802-youtube-player');
    return !!box?.querySelector('iframe')||!!box?.getAttribute('data-ready');
   }
   return false;
  };
  const activeTransport=()=>open()&&isReplaySource(selectedSource())&&ready();
  const css=`
/* Mobile and desktop video view: keep one original player and original coding. */
#scout-match-mode #v112-video-drawer .vc1770-toolbar{display:none!important;min-width:0;gap:7px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:8px 10px;margin:0;background:#0b2640;border:1px solid #365671;border-radius:9px;color:#f2f7ff;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button{appearance:none!important;border:1px solid #4e7390!important;background:#24465f!important;border-radius:7px!important;color:#f7fbff!important;font:750 12px/1.2 system-ui,sans-serif!important;min-height:35px!important;padding:7px 10px!important;cursor:pointer!important;white-space:nowrap!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button[disabled]{opacity:.45!important;cursor:not-allowed!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button[aria-pressed="true"]{background:#e9f3ff!important;color:#173a65!important;border-color:#c6e4ff!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button:focus-visible{outline:3px solid #7abaf8!important;outline-offset:2px!important;}
#scout-match-mode #v112-video-drawer .vc1770-transport,#scout-match-mode #v112-video-drawer .vc1770-layout{display:flex;gap:5px;align-items:center;flex-wrap:wrap;}
#scout-match-mode #v112-video-drawer .vc1770-transport{flex:1 1 auto;}
#scout-match-mode #v112-video-drawer .vc1770-source{font:650 11px/1.3 system-ui,sans-serif;color:#d1e3f4;flex:1 1 100%;min-width:0;}
#scout-match-mode #v112-video-drawer .vc1770-source strong{color:#fff;}
body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready{grid-template-columns:minmax(0,1fr) clamp(305px,28vw,440px)!important;}
body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready.vc1770-video-focus{grid-template-columns:minmax(0,1fr) clamp(300px,22vw,335px)!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>.vc1770-toolbar{display:flex!important;order:2!important;grid-column:auto!important;grid-row:auto!important;flex:0 0 auto!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>#v802-playback{order:3!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>.v800-video-actions{order:4!important;}
@media(max-width:820px){
 body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready,
 body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready.vc1770-video-focus{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;}
 #scout-match-mode #v112-video-drawer .vc1770-toolbar{padding:7px!important;}
 #scout-match-mode #v112-video-drawer .vc1770-toolbar button{min-height:38px!important;}
}
@media(max-width:460px){
 #scout-match-mode #v112-video-drawer .vc1770-transport{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));width:100%;}
 #scout-match-mode #v112-video-drawer .vc1770-transport button{min-width:0!important;padding:8px 3px!important;font-size:11px!important;}
 #scout-match-mode #v112-video-drawer .vc1770-layout{width:100%;justify-content:space-between;}
}
@media(prefers-reduced-motion:reduce){#scout-match-mode #v112-video-drawer .vc1770-toolbar button{transition:none!important;}}
`;
  function installCss(){if($('vc1770-video-style'))return;
   const style=doc.createElement('style');style.id='vc1770-video-style';style.textContent=css;doc.head.appendChild(style);
  }
  function ensure(){
   const d=drawer(),card=d?.querySelector(':scope > .v112-video-card');
   if(!card)return false;
   let el=$(ID);
   if(!el){
    el=doc.createElement('div');el.id=ID;el.className='vc1770-toolbar';
    el.setAttribute('role','group');el.setAttribute('aria-label','Controles de Vídeo Pro');
    el.innerHTML=`<div class="vc1770-source" aria-live="polite" id="vc1770-source">Repetición: sin vídeo cargado</div>
    <div class="vc1770-transport" role="group" aria-label="Repetición de vídeo">
      <button type="button" data-vc1770="back" title="Retroceder 8 segundos (Shift + flecha izquierda)">−8 s</button>
      <button type="button" data-vc1770="play" title="Pausar o reproducir (Shift + espacio)">▶ / ❚❚</button>
      <button type="button" data-vc1770="forward" title="Avanzar 5 segundos (Shift + flecha derecha)">+5 s</button>
      <button type="button" data-vc1770="focus" title="Ir al campo de código rápido">⌨ Código</button>
    </div>
    <div class="vc1770-layout" role="group" aria-label="Distribución de pantalla">
      <button type="button" data-vc1770="balanced" aria-pressed="true" title="Más espacio para codificar">Equilibrada</button>
      <button type="button" data-vc1770="big" aria-pressed="false" title="Dar más espacio al vídeo manteniendo el panel de código">Vídeo +</button>
    </div>`;
    el.addEventListener('click',click);
    mounted++;
   }
   if(el.parentElement!==card){
    const playback=$('v802-playback');
    if(playback?.parentElement===card)card.insertBefore(el,playback);
    else card.appendChild(el);
   }
   d.classList.add('vc1770-video-pro-ready');
   d.classList.toggle('vc1770-video-focus',layout==='big');
   update();
   return true;
  }
  function update(){
   const el=$(ID);if(!el)return;
   const source=selectedSource(),loaded=ready();
   const state=$('vc1770-source');
   if(state){
    const message=source==='local'?'Archivo':source==='youtube'?'YouTube':source==='delay'?'Delay':'Directo';
    const tip=isReplaySource(source)?loaded?'Control de repetición disponible':'Abre el vídeo para activar la repetición':'Usa los controles originales de Live / Delay';
    const label=message+' · '+tip;
    if(state.textContent!==label)state.textContent=label;
   }
   for(const name of ['back','play','forward']){
    const btn=el.querySelector('[data-vc1770="'+name+'"]');
    if(btn)btn.disabled=!activeTransport();
   }
   for(const name of ['balanced','big']){
    const btn=el.querySelector('[data-vc1770="'+name+'"]');
    if(btn)btn.setAttribute('aria-pressed',String(layout===(name==='big'?'big':'balanced')));
   }
  }
  function seek(seconds){
   if(!activeTransport()||typeof root.v802Jump!=='function')return false;
   root.v802Jump(seconds);seeks++;return true;
  }
  function play(){
   if(!activeTransport()||typeof root.v802TogglePlay!=='function')return false;
   root.v802TogglePlay();toggles++;return true;
  }
  function setLayout(which){
   if(!['big','balanced'].includes(which))return false;
   layout=which;drawer()?.classList.toggle('vc1770-video-focus',layout==='big');update();return true;
  }
  function focusCode(){return !!root.VC_SCOUT_VIDEO_UX_1644?.focusCode?.()}
  function click(e){
   const button=e.target.closest('button[data-vc1770]');if(!button)return;
   const action=button.dataset.vc1770;
   if(action==='back')seek(-8);
   else if(action==='forward')seek(5);
   else if(action==='play')play();
   else if(action==='focus')focusCode();
   else if(action==='big'||action==='balanced')setLayout(action);
   update();
  }
  function handleKey(event){
   if(!open()||!theater()||isEditable(event.target))return;
   if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!event.shiftKey)return;
   let success=false;
   if(event.key==='ArrowLeft')success=seek(-8);
   if(event.key==='ArrowRight')success=seek(5);
   if(event.code==='Space')success=play();
   if(success){event.preventDefault();shortcutCount++;update();}
  }
  function schedule(){if(pending)return;
   pending=true;root.requestAnimationFrame(()=>{pending=false;ensure()});
  }
  installCss();ensure();
  doc.addEventListener('keydown',handleKey,true);
  const observer=new MutationObserver(schedule);
  observer.observe(drawer(),{childList:true,subtree:true});
  const stateObserver=new MutationObserver(schedule);
  for(const id of ['v800-shell','v112-video-drawer','v802-source-local','v802-source-youtube','v802-source-live','v802-source-delay']){
   const el=$(id);if(el)stateObserver.observe(el,{attributes:true,attributeFilter:['class','aria-selected']});
  }
  for(const id of ['v802-local-video']){
   const el=$(id);if(!el)continue;
   ['loadedmetadata','emptied','loadstart'].forEach(name=>el.addEventListener(name,schedule));
  }
  // React to the original source selectors; do not replace their handlers.
  drawer().addEventListener('click',e=>{
   if(e.target.closest?.('.v116-source-tabs button,.v802-source-tabs button'))schedule();
  });
  root.VC_VIDEO_PRO_1770={version:VERSION,setLayout,seek,play,refresh:ensure,
   diagnostics:()=>({version:VERSION,mounted,layout,theater:theater(),source:selectedSource(),replayEnabled:activeTransport(),seeks,toggles,shortcuts:shortcutCount,videoNodes:drawer()?.querySelectorAll('video').length||0})};
  return true;
 }
 return {VERSION,mount,isReplaySource,isEditable};
});

/* VC20717_SOURCE_END:152-vc1770-video-pro.js */

/* VC20717_SOURCE_BEGIN:153-vc1780-cross-analysis.js */
/* Volley Coach V17.8.0 · Cruces Pro (Analysis Pro)
 * READ ONLY. Reuses the current Analyst Studio selectors and the existing
 * VC_ANALYSIS_INTELLIGENCE_1614 extraction/model. Does not mutate scouting,
 * rankings, ratings, official PDFs, cloud state, video or storage.
 */
(function(root, factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.8.0';
 const TYPES=[['setters','Colocador → atacante'],['receives','Recepción → ataque'],['rotations','Rotaciones y ataque'],['routes','Rutas de ataque'],['players','Individual G-P']];
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const num=x=>Number.isFinite(+x)?+x:0;
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const zone=x=>{const v=str(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return v?`${v[1]}${v[2]||''}`:'';};
 const pct=(n,d)=>d?`${(100*n/d).toLocaleString('es-ES',{maximumFractionDigits:1})}%`:'—';
 const signed=n=>n>0?`+${n}`:String(n);
 const group=(items,fn)=>{const map=new Map();for(const item of items){const key=str(fn(item))||'Sin codificar';if(!map.has(key))map.set(key,[]);map.get(key).push(item)}return [...map].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es'));};
 const evalAttack=(items,get=x=>x)=>{const xs=items.map(get).filter(Boolean),n=xs.length,k=xs.filter(x=>x.ev==='#').length,e=xs.filter(x=>x.ev==='=').length,b=xs.filter(x=>x.ev==='/').length;return {n,k,e,b,gp:k-e-b,eff:n?(k-e-b)/n:null};};
 const fmtEff=x=>x==null?'—':`${(x*100).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const rowSorter=(a,b)=>b.n-a.n||str(a.label).localeCompare(str(b.label),'es');
 function compute(data){
  const pairs=arr(data?.pairs),chains=arr(data?.chains),attacks=arr(data?.attacks),actions=arr(data?.actions),rallies=arr(data?.rallies),team=data?.target==='opponent'?'opponent':'ours';
  const linked=pairs.filter(p=>p.attack);
  const setters=group(linked,p=>`${str(p.set?.player)||'Sin identificar'} → ${str(p.attack?.player)||'Sin identificar'}`).map(([label,ps])=>{
   const a=evalAttack(ps,p=>p.attack),[setter,attacker]=label.split(' → ');
   const tempos=group(ps,p=>p.attack?.a?.attackTempo||p.set?.a?.setTempo)[0];
   const targets=group(ps,p=>p.set?.a?.setTarget||p.set?.a?.attackCombo)[0];
   return {label,setter,attacker,...a,tempo:tempos?.[0]||'Sin codificar',target:targets?.[0]||'Sin codificar'};
  }).sort(rowSorter);
  const recType=ev=>['#','+'].includes(ev)?'Positiva (# / +)':ev==='!'?'Neutra (!)':['-','/','='].includes(ev)?'Negativa (-, /, =)':'Sin valorar';
  const receives=group(chains,c=>recType(c.rec?.ev)).map(([label,ps])=>{
   const a=evalAttack(ps,p=>p.attack),won=ps.filter(p=>p.outcome).length;
   return {label,chains:ps.length,won,attacks:a.n,...a,k1pct:ps.length?won/ps.length:null};
  });
  const rotations=Array.from({length:6},(_,i)=>{
   const no=i+1,aa=attacks.filter(a=>a.rotation===no),r=rallies.filter(x=>(team==='ours'?x.rotation:x.opponentRotation)===no&&x.winning),k1=r.filter(x=>x.serving&&x.serving!==team),k2=r.filter(x=>x.serving===team),a=evalAttack(aa);
   return {label:`R${no}`,rotation:no,...a,k1n:k1.length,k1w:k1.filter(x=>x.winning===team).length,k2n:k2.length,k2w:k2.filter(x=>x.winning===team).length,rallies:r.length};
  });
  const validRoutes=attacks.filter(x=>zone(x.a?.startZone)&&zone(x.a?.endZone));
  const routes=group(validRoutes,a=>`${zone(a.a.startZone)} → ${zone(a.a.endZone)}`).map(([label,aa])=>({label,...evalAttack(aa)}));
  const players=group(actions,a=>a.player).map(([label,aa])=>{
   const atk=aa.filter(a=>a.skill==='A'),recs=aa.filter(a=>a.skill==='R'),s=aa.filter(a=>a.skill==='S'),sets=aa.filter(a=>a.skill==='E'),st=evalAttack(atk);
   return {label,n:aa.length,attack:st.n,k:st.k,e:st.e,b:st.b,gp:st.gp,eff:st.eff,receives:recs.length,positive:recs.filter(a=>['#','+'].includes(a.ev)).length,serves:s.length,aces:s.filter(a=>a.ev==='#').length,sets:sets.length};
  }).sort(rowSorter);
  return {setters,receives,rotations,routes,players,sample:{rallies:rallies.length,actions:actions.length,attacks:attacks.length,sets:pairs.length,linked:linked.length,chains:chains.length,validRoutes:validRoutes.length,unresolvedPairs:pairs.length-linked.length,attackZoneMissing:attacks.length-validRoutes.length}};
 }
 function dataForMatch(match, bridge, intel, filters){
  const phase=filters.phase;
  let m=match;
  if(phase==='K1'||phase==='K2'){
   const expected=phase==='K1'?(filters.team==='opponent'?'ours':'opponent'):(filters.team==='opponent'?'opponent':'ours');
   m={...match,sets:arr(match.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===expected)}))};
  }
  return intel.model(m,bridge,{team:filters.team,set:filters.set,rotation:filters.rotation});
 }
 function td(val,attrs=''){return `<td ${attrs}>${esc(val)}</td>`;}
 function mini(value,n){return `<div class="vc1780-rate"><span>${pct(value,n)}</span><i style="width:${n?Math.max(0,Math.min(100,value*100/n)):0}%"></i></div>`;}
 function table(headers,rows,empty='No hay datos codificados para esta selección.'){
  return `<div class="vc1780-overflow"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(c=>`<tr>${c}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="vc1780-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
 }
 function note(text){return `<p class="vc1780-footnote">${esc(text)}</p>`;}
 function viewHtml(tab,data){
  const {setters,receives,rotations,routes,players,sample}=data;
  if(tab==='setters')return `<h3>Relación colocador–atacante</h3><p>Asocia cada colocación al ataque siguiente de la misma posesión. No asigna ataques si interviene el rival o falta un registro válido.</p>`+
   table(['Colocador → atacante','Ataques','Puntos (#)','Errores (=)','Bloqueos (/)','G-P','EFF','Tempo más frecuente','Destino más frecuente'],setters.map(x=>[td(x.label),td(x.n),td(x.k),td(x.e),td(x.b),td(signed(x.gp),'class="vc1780-number"'),td(fmtEff(x.eff)),td(x.tempo),td(x.target)].join('')))+
   note(`${sample.sets} colocaciones registradas; ${sample.linked} vinculadas con un ataque; ${sample.unresolvedPairs} sin ataque vinculado. El tempo y el destino solo se muestran si fueron codificados.`);
  if(tab==='receives')return `<h3>Cadena recepción → colocación → ataque</h3><p>Cadenas de K1 agrupadas por valoración de recepción. El side-out es el rally ganado; el punto de ataque (#) es una valoración de una acción y se cuenta por separado.</p>`+
   table(['Recepción','Cadenas K1','Side-out G','Side-out %','Ataques ligados','Puntos de ataque','Errores','Bloqueos','EFF ataque'],receives.map(x=>[td(x.label),td(x.chains),td(x.won),`<td>${mini(x.won,x.chains)}</td>`,td(x.attacks),td(x.k),td(x.e),td(x.b),td(fmtEff(x.eff))].join('')))+
   note(`${sample.chains} cadenas con recepción. Sin recepción codificada no es posible atribuir calidad de pase. Los ataques se vinculan solo si están en el mismo rally y después de la recepción.`);
  if(tab==='rotations')return `<h3>Rotaciones · K1/K2 y finalización</h3><p>Compara la conversión del rally con el ataque codificado en cada rotación. Las muestras pequeñas requieren revisión de vídeo antes de interpretar diferencias.</p>`+
   table(['Rotación','Rallies','K1 G/N','K1 %','K2 G/N','K2 %','Ataques','G-P ataque','EFF ataque'],rotations.map(x=>[td(x.label),td(x.rallies),td(`${x.k1w}/${x.k1n}`),`<td>${mini(x.k1w,x.k1n)}</td>`,td(`${x.k2w}/${x.k2n}`),`<td>${mini(x.k2w,x.k2n)}</td>`,td(x.n),td(signed(x.gp)),td(fmtEff(x.eff))].join('')))+
   note('K1: rallies ganados al recibir / rallies con saque rival conocido. K2: rallies ganados al sacar / rallies con saque propio conocido. Las acciones incompletas no crean rallies adicionales.');
  if(tab==='routes')return `<h3>Rutas de ataque · zonas y subzonas A/B/C/D</h3><p>Relación de origen y destino explícitamente codificados. Una subzona forma parte de su zona numerada; no se infieren trayectorias ausentes.</p>`+
   table(['Origen → destino','Ataques','Frecuencia del total codificado','Puntos (#)','Errores (=)','Bloqueos (/)','G-P','EFF'],routes.slice(0,30).map(x=>[td(x.label),td(x.n),`<td>${mini(x.n,sample.validRoutes)}</td>`,td(x.k),td(x.e),td(x.b),td(signed(x.gp)),td(fmtEff(x.eff))].join('')))+
   note(`Rutas completas ${sample.validRoutes}/${sample.attacks} ataques. ${sample.attackZoneMissing} sin origen y destino válidos. Se muestran hasta 30 rutas, ordenadas por frecuencia.`);
  return `<h3>Rendimiento individual · conteos reales</h3><p>G-P corresponde a puntos directos de ataque (#) menos errores (=) y bloqueos recibidos (/). No equivale al saldo completo de puntos del partido.</p>`+
   table(['Jugador','Acciones','Ataques','Puntos A','Errores A','Bloqueos /','G-P ataque','EFF A','Recep. +/#','Saques ace','Colocaciones'],players.map(x=>[td(x.label),td(x.n),td(x.attack),td(x.k),td(x.e),td(x.b),td(signed(x.gp)),td(fmtEff(x.eff)),td(`${x.positive}/${x.receives}`),td(`${x.aces}/${x.serves}`),td(x.sets)].join('')))+
   note('Solo se contabilizan acciones vinculadas a rallies cerrados. Sin identificación de jugador, las acciones se agrupan como «Sin identificar».');
 }
 function sheetRows(tab,data){
  const d=data;
  if(tab==='setters')return [['Colocador','Atacante','Ataques','Puntos','Errores','Bloqueos','G-P','EFF','Tempo','Destino'],...d.setters.map(x=>[x.setter,x.attacker,x.n,x.k,x.e,x.b,x.gp,fmtEff(x.eff),x.tempo,x.target])];
  if(tab==='receives')return [['Recepción','Cadenas','Sideout ganados','Sideout %','Ataques','Puntos','Errores','Bloqueos','EFF'],...d.receives.map(x=>[x.label,x.chains,x.won,pct(x.won,x.chains),x.attacks,x.k,x.e,x.b,fmtEff(x.eff)])];
  if(tab==='rotations')return [['Rotación','Rallies','K1 ganados','K1 total','K2 ganados','K2 total','Ataques','Puntos','Errores','Bloqueos','G-P','EFF'],...d.rotations.map(x=>[x.label,x.rallies,x.k1w,x.k1n,x.k2w,x.k2n,x.n,x.k,x.e,x.b,x.gp,fmtEff(x.eff)])];
  if(tab==='routes')return [['Ruta','Ataques','Porcentaje del total de rutas','Puntos','Errores','Bloqueos','G-P','EFF'],...d.routes.map(x=>[x.label,x.n,pct(x.n,d.sample.validRoutes),x.k,x.e,x.b,x.gp,fmtEff(x.eff)])];
  return [['Jugador','Acciones','Ataques','Puntos ataque','Errores ataque','Bloqueos','G-P ataque','EFF','Recepciones','Recepciones positivas','Saques','Aces','Colocaciones'],...d.players.map(x=>[x.label,x.n,x.attack,x.k,x.e,x.b,x.gp,fmtEff(x.eff),x.receives,x.positive,x.serves,x.aces,x.sets])];
 }
 function csvCells(rows){
  return '\ufeff'+rows.map(r=>r.map(v=>{
   let s=str(v);if(typeof v==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';
  }).join(';')).join('\r\n')+'\r\n';
 }
 const CSS=`
 #scout-analysis[data-vc1780-view="cross"] #vc157-studio .vc157-work{display:none!important}
 #vc1780-cross-panel[hidden]{display:none!important}
 #vc1780-cross-panel{background:#f6f9fd;padding:18px;display:grid;gap:13px;color:#173c5d;font:400 12px/1.5 system-ui,-apple-system,sans-serif}
 #vc1780-cross-panel *{box-sizing:border-box}
 #vc1780-cross-panel .vc1780-title{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #d9e5f0;padding-bottom:14px}
 #vc1780-cross-panel .vc1780-kicker{font-weight:850;font-size:10px;letter-spacing:.09em;color:#2774b7}
 #vc1780-cross-panel h2{margin:3px 0 4px!important;font:850 22px/1.15 system-ui!important;color:#133a60!important}
 #vc1780-cross-panel h3{margin:0 0 5px!important;font:850 16px/1.2 system-ui!important;color:#153e66!important}
 #vc1780-cross-panel p{margin:0;color:#58758d;font-size:12px;line-height:1.55}
 #vc1780-cross-panel .vc1780-actions{display:flex;flex-wrap:wrap;gap:6px}
 #vc1780-cross-panel button{background:white!important;border:1px solid #c7d9e9!important;color:#205882!important;min-height:37px!important;border-radius:8px!important;padding:8px 11px!important;font:750 11px/1.2 system-ui!important;cursor:pointer}
 #vc1780-cross-panel button:hover{background:#e8f3ff!important}
 #vc1780-cross-panel button:focus-visible{outline:3px solid #7db9f6!important;outline-offset:2px}
 #vc1780-cross-panel .vc1780-tabs{display:flex;gap:7px;flex-wrap:wrap}
 #vc1780-cross-panel .vc1780-tabs button[aria-pressed="true"]{background:#174d85!important;color:#fff!important;border-color:#174d85!important}
 #vc1780-cross-panel .vc1780-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
 #vc1780-cross-panel .vc1780-kpi{background:#fff;border:1px solid #dce7f0;border-radius:10px;padding:12px 14px;display:grid;gap:2px}
 #vc1780-cross-panel .vc1780-kpi small{font:800 10px/1.3 system-ui;color:#718ba0}
 #vc1780-cross-panel .vc1780-kpi strong{font:850 24px/1.2 system-ui;color:#133e6a}
 #vc1780-cross-panel .vc1780-kpi span{font-size:10px;color:#718ba0}
 #vc1780-cross-panel .vc1780-card{background:#fff;border:1px solid #dce7f0;border-radius:13px;padding:14px;min-width:0}
 #vc1780-cross-panel .vc1780-context{font-size:11px;color:#648198;line-height:1.5;margin-bottom:10px}
 #vc1780-cross-panel .vc1780-overflow{max-width:100%;overflow:auto;overscroll-behavior-x:contain;border-radius:8px;border:1px solid #e1eaf1}
 #vc1780-cross-panel table{width:100%;min-width:740px;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:11px;white-space:nowrap}
 #vc1780-cross-panel th{text-align:left;background:#ebf3fa;color:#325e82;font-size:10px;letter-spacing:.01em;padding:11px 9px;border-bottom:1px solid #d7e6f2;position:sticky;top:0}
 #vc1780-cross-panel td{padding:10px 9px;color:#294c68;border-bottom:1px solid #edf2f7}
 #vc1780-cross-panel tbody tr:nth-child(even){background:#f9fbfd}
 #vc1780-cross-panel .vc1780-number{font-weight:850;color:#15507d}
 #vc1780-cross-panel .vc1780-rate{position:relative;display:inline-flex;min-width:64px;padding-bottom:4px;font-weight:750;color:#295976}
 #vc1780-cross-panel .vc1780-rate i{position:absolute;bottom:0;left:0;height:3px;background:#3386c6;max-width:100%;border-radius:2px}
 #vc1780-cross-panel .vc1780-empty{text-align:center;color:#738da2;padding:28px}
 #vc1780-cross-panel .vc1780-footnote{font-size:10.5px;color:#6c8297;margin-top:11px;line-height:1.5}
 #vc1780-cross-panel .vc1780-notice{border-left:3px solid #76a8d4;padding:9px 11px;background:#edf6ff;border-radius:6px;font-size:11px;color:#3b6383}
 #scout-analysis .vc1730-links [data-vc1780-open]{background:#eaf4ff!important;border-color:#9ac3e7!important;color:#16558c!important;font-weight:850!important}
 #scout-analysis .vc1730-links [data-vc1780-open][aria-current="page"]{background:#174d85!important;color:#fff!important}
 @media(max-width:850px){#vc1780-cross-panel{padding:11px}#vc1780-cross-panel .vc1780-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:460px){#vc1780-cross-panel .vc1780-kpis{gap:5px}#vc1780-cross-panel .vc1780-kpi{padding:9px}#vc1780-cross-panel .vc1780-kpi strong{font-size:19px}#vc1780-cross-panel .vc1780-tabs{display:grid;grid-template-columns:1fr 1fr}#vc1780-cross-panel .vc1780-title{align-items:flex-start}}
 `;
 function mount(root){
  const doc=root.document,state={open:false,tab:'setters',data:null,signature:'',renders:0};
  const $=id=>doc.getElementById(id);
  const analysis=()=> $('scout-analysis');
  const active=()=>!!analysis()?.classList.contains('active');
  function selected(){
   const el=$('vc157-match'),id=str(el?.value),bridge=root.VC_SCOUT_VIDEO_BRIDGE||root.VC_SCOUT_REPORT_BRIDGE;
   if(!bridge)return {error:'No está disponible el motor de lectura de scoutings.'};
   const all=new Map();
   for(const source of [root.VC_SCOUT_REPORT_BRIDGE,root.VC_SCOUT_VIDEO_BRIDGE]){
    try{for(const m of arr(source?.getMatches?.()))if(m&&m.id!=null)all.set(String(m.id),m);}catch(e){console.warn('V17.8 · lectura de scoutings:',e)}
   }
   const match=id?all.get(id):null;
   if(!id||!match)return {error:'Selecciona un scouting válido en el selector superior. No se sustituirá por otro automáticamente.'};
   const filters={team:$('vc157-team')?.value==='opponent'?'opponent':'ours',set:$('vc157-set')?.value||'',rotation:$('vc157-rotation')?.value||'',phase:$('vc157-phase')?.value||''};
   const intel=root.VC_ANALYSIS_INTELLIGENCE_1614;
   if(!intel?.model)return {error:'El motor de análisis aún no se ha cargado.'};
   return {match,filters,bridge,intel,label:str(el.selectedOptions?.[0]?.textContent)||'Scouting seleccionado'};
  }
  function paint(){
   if(!state.open||!active())return;
   const panel=$('vc1780-cross-panel');if(!panel)return;
   state.renders++;
   const one=selected();
   if(one.error){state.data=null;panel.querySelector('[data-vc1780-info]').textContent=one.error;panel.querySelector('[data-vc1780-kpis]').innerHTML='';panel.querySelector('[data-vc1780-body]').innerHTML=`<div class="vc1780-notice">${esc(one.error)}</div>`;return;}
   const f=one.filters;let result;
   try{result=compute(dataForMatch(one.match,one.bridge,one.intel,f));}
   catch(e){console.warn('V17.8 Cross Analysis · lectura fallida:',e);state.data=null;panel.querySelector('[data-vc1780-body]').innerHTML='<div class="vc1780-notice">No se han podido calcular los cruces de este scouting. Las estadísticas originales no se han modificado.</div>';return;}
   state.data=result;
   const sample=result.sample;
   panel.querySelector('[data-vc1780-info]').textContent=`${one.label} · ${f.team==='opponent'?'Rival':'Nuestro equipo'} · ${f.set?'Set '+f.set:'Todos los sets'} · ${f.rotation?'R'+f.rotation:'Todas las rotaciones'} · ${f.phase||'K1 + K2'}`;
   panel.querySelector('[data-vc1780-kpis]').innerHTML=[['Rallies cerrados',sample.rallies,'Con resultado válido'],['Acciones',sample.actions,'Del equipo y filtro'],['Ataques',sample.attacks,'Codificados'],['Colocación → ataque',`${sample.linked}/${sample.sets}`,'Vinculadas / registradas']].map(([label,value,detail])=>`<div class="vc1780-kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></div>`).join('');
   panel.querySelectorAll('[data-vc1780-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc1780Tab===state.tab)));
   panel.querySelector('[data-vc1780-body]').innerHTML=(sample.rallies>0&&sample.rallies<8?'<div class="vc1780-notice" style="margin-bottom:11px">Muestra reducida: menos de 8 rallies cerrados con los filtros actuales. Evita interpretar estas diferencias como tendencias.</div>':'')+viewHtml(state.tab,result);
  }
  function close(){state.open=false;analysis()?.removeAttribute('data-vc1780-view');const p=$('vc1780-cross-panel');if(p)p.hidden=true;const b=$('vc1780-nav');if(b)b.setAttribute('aria-current','false');}
  function open(){
   if(!$('vc1780-cross-panel'))attachPanel();
   if(!$('vc1780-cross-panel'))return false;
   state.open=true;analysis()?.setAttribute('data-vc1780-view','cross');$('vc1780-cross-panel').hidden=false;
   $('vc1780-nav')?.setAttribute('aria-current','page');paint();return true;
  }
  function csvExport(){
   if(!state.data)return;
   const lines=sheetRows(state.tab,state.data),blob=new root.Blob([csvCells(lines)],{type:'text/csv;charset=utf-8'}),url=root.URL.createObjectURL(blob),a=doc.createElement('a');
   a.href=url;a.download=`Volley_Coach_V17.8_${state.tab}.csv`;doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),2000);
  }
  function attachPanel(){
   const studio=$('vc157-studio'),toolbar=studio?.querySelector('.vc157-toolbar');if(!studio||!toolbar)return false;
   if($('vc1780-cross-panel'))return true;
   const style=doc.createElement('style');style.id='vc1780-style';style.textContent=CSS;doc.head.appendChild(style);
   const section=doc.createElement('section');section.id='vc1780-cross-panel';section.hidden=true;section.setAttribute('aria-label','Cruces avanzados del scouting');
   section.innerHTML=`<div class="vc1780-title"><div><span class="vc1780-kicker">ANÁLISIS PRO · V${VERSION} · SOLO LECTURA</span><h2>Cruces avanzados</h2><p>Relaciones entre acciones codificadas, fases del rally y rendimiento.</p></div><div class="vc1780-actions"><button type="button" data-vc1780-refresh>↻ Actualizar</button><button type="button" data-vc1780-export>Exportar CSV</button><button type="button" data-vc1780-close>Cerrar cruces</button></div></div><div class="vc1780-context" data-vc1780-info>Utiliza los filtros compartidos de arriba.</div><div class="vc1780-kpis" data-vc1780-kpis></div><nav class="vc1780-tabs" aria-label="Vistas de cruces avanzados">${TYPES.map(([id,label])=>`<button type="button" data-vc1780-tab="${id}" aria-pressed="false">${esc(label)}</button>`).join('')}</nav><div class="vc1780-card" data-vc1780-body></div><p class="vc1780-notice">Muestra y trazabilidad: únicamente rallies cerrados y acciones registradas. EFF de ataque = (# − = − /) / ataques. Los datos sin codificar se señalan; nunca se infieren automáticamente. Estas tablas son auxiliares y no modifican el PDF oficial.</p>`;
   toolbar.insertAdjacentElement('afterend',section);
   section.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-vc1780-close'))close();else if(b.hasAttribute('data-vc1780-refresh'))paint();else if(b.hasAttribute('data-vc1780-export'))csvExport();else if(b.dataset.vc1780Tab){state.tab=b.dataset.vc1780Tab;paint();}});
   return true;
  }
  function addLink(){
   const nav=$('vc1730-workspace')?.querySelector('[data-vc1730-links]');if(!nav||nav.dataset.mode!=='tactics')return;
   if(nav.querySelector('[data-vc1780-open]'))return;
   const b=doc.createElement('button');b.id='vc1780-nav';b.type='button';b.dataset.vc1780Open='';b.setAttribute('aria-current',state.open?'page':'false');b.textContent='Cruces Pro';nav.appendChild(b);
  }
  function init(){
   const view=analysis();if(!view)return;
   attachPanel();addLink();
   const nav=$('vc1730-workspace')?.querySelector('[data-vc1730-links]');
   if(nav){const observer=new root.MutationObserver(()=>addLink());observer.observe(nav,{childList:true});}
   // Dynamic Analista Studio: only wait for initial mount, not for live DOM churn.
   if(!$('vc1780-cross-panel')){
    const watcher=new root.MutationObserver(()=>{if(attachPanel())watcher.disconnect();});watcher.observe(view,{childList:true,subtree:true});
   }
   doc.addEventListener('click',e=>{
    const b=e.target.closest?.('button');if(!b)return;
    if(b.hasAttribute('data-vc1780-open')){open();return;}
    if(state.open&&b.closest('#vc1730-workspace')&&
      (b.hasAttribute('data-vc1730-mode')||b.hasAttribute('data-vc1730-page')||b.hasAttribute('data-vc1730-view')))close();
   },true);
   doc.addEventListener('change',e=>{if(state.open&&['vc157-match','vc157-team','vc157-set','vc157-rotation','vc157-phase'].includes(e.target?.id))root.setTimeout(paint,0)},true);
   view.addEventListener('click',e=>{if(state.open&&e.target?.id==='vc157-refresh-matches')root.setTimeout(paint,0)},true);
   const activeObserver=new root.MutationObserver(()=>{if(state.open&&!active())close();});activeObserver.observe(view,{attributes:true,attributeFilter:['class']});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const api={version:VERSION,open,close,refresh:paint,diagnostics:()=>({open:state.open,tab:state.tab,renders:state.renders,sample:state.data?.sample||null,readOnly:true})};
  root.VC178_CROSS_ANALYSIS=api;
 }
 return {VERSION,TYPES,compute,dataForMatch,viewHtml,sheetRows,csvCells,mount};
});

/* VC20717_SOURCE_END:153-vc1780-cross-analysis.js */
