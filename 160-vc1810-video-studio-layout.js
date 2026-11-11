/* Volley Coach V18.1.0 · Video Studio Pro — presentation layer.
 * Reuses the existing V7.8 video, Live/Delay, Recorder, Clip Studio and training-review engines.
 * Creates no media source, MediaRecorder, score event, scouting record or cloud write.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.1.0';
 const CONTEXTS=['partido','entrenamiento','analisis'];
 const TABS=['directo','delay','revision','clips'];
 const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
 function formatSeconds(n){
  if(!Number.isFinite(Number(n))||Number(n)<0)return '--:--';
  const t=Math.floor(Number(n));
  return `${String(Math.floor(t/3600)>0?Math.floor(t/3600):Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t/3600)>0?Math.floor(t/60)%60:t%60).padStart(2,'0')}${Math.floor(t/3600)>0?':'+String(t%60).padStart(2,'0'):''}`;
 }
 function selectContext(kind){return kind==='training'?'entrenamiento':'partido'}
 function validContext(next){return CONTEXTS.includes(next)}
 function validTab(next){return TABS.includes(next)}
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC_VIDEO_STUDIO_1810)return true;
   const $=id=>doc.getElementById(id);
   const studio=$('scout-video-hub'),hub=studio?.querySelector('.v780-hub'),main=studio?.querySelector('.v780-main');
   if(!studio||!hub||!main||!$('v780-video-frame')||!$('vc1642-command')||!root.VC17_VIDEO_UNIFIED)return false;
   const state={context:selectContext(root.VC17_VIDEO_UNIFIED.getKind?.()),tab:'directo',wide:false,solo:false,updates:0,lastError:''};
   const html=`
    <div class="vc181-titlebar">
      <div class="vc181-identity"><span class="vc181-logo" aria-hidden="true">VC</span><div><span class="vc181-eyebrow">VOLLEY COACH · VIDEO STUDIO PRO</span><h2 id="vc181-title">Vídeo de partido</h2><p id="vc181-subtitle">Grabación, directo y revisión en un mismo espacio</p></div></div>
      <div class="vc181-status"><span id="vc181-source-state" class="vc181-status-chip">FUENTE · Sin conectar</span><span id="vc181-record-state" class="vc181-status-chip">REC · Detenido</span></div>
    </div>
    <div class="vc181-contexts" role="group" aria-label="Contexto de vídeo">
      <button type="button" data-vc181-context="partido" aria-pressed="true">Partido</button>
      <button type="button" data-vc181-context="entrenamiento" aria-pressed="false">Entrenamiento</button>
      <button type="button" data-vc181-context="analisis" aria-pressed="false">Análisis</button>
    </div>
    <div class="vc181-worktabs" role="group" aria-label="Herramientas de vídeo">
      <button type="button" data-vc181-tab="directo" aria-pressed="true">● Directo</button>
      <button type="button" data-vc181-tab="delay" aria-pressed="false">◷ Delay</button>
      <button type="button" data-vc181-tab="revision" aria-pressed="false">▶ Revisión</button>
      <button type="button" data-vc181-tab="clips" aria-pressed="false">✂ Clips</button>
    </div>
    <div class="vc181-sourcebar" role="group" aria-label="Fuente de vídeo y grabación">
      <div class="vc181-source-left">
       <button type="button" data-vc181-action="live">Cámara</button>
       <button type="button" data-vc181-action="source-delay">Delay</button>
       <button type="button" data-vc181-action="file">Abrir archivo</button>
       <button type="button" data-vc181-action="youtube">YouTube</button>
      </div>
      <div class="vc181-source-right">
       <button type="button" data-vc181-action="configure">Conectar / configurar</button>
       <button type="button" data-vc181-action="recordings">Videoteca</button>
      </div>
    </div>`;
   const chrome=doc.createElement('section');chrome.className='vc181-chrome';chrome.id='vc181-chrome';chrome.innerHTML=html;hub.insertBefore(chrome,hub.firstElementChild);
   const player=main.querySelector('.v780-video-panel');
   const transport=doc.createElement('div');transport.className='vc181-transport';transport.id='vc181-transport';
   transport.innerHTML=`<div class="vc181-control-row" role="group" aria-label="Reproducción">
      <button type="button" data-vc181-action="back" title="Retroceder 8 segundos">−8 s</button>
      <button type="button" class="vc181-play" data-vc181-action="play" title="Reproducir o pausar">▶ / ❚❚</button>
      <button type="button" data-vc181-action="next" title="Avanzar 5 segundos">+5 s</button>
      <label>Velocidad <select id="vc181-speed" aria-label="Velocidad de reproducción"><option value="0.5">0,5×</option><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
      <button type="button" data-vc181-action="clip">Crear clip</button>
      <span class="vc181-spacer"></span>
      <button type="button" data-vc181-action="wide" aria-pressed="false" title="Vídeo grande con panel lateral">Vídeo +</button>
      <button type="button" data-vc181-action="solo" aria-pressed="false" title="Ocultar panel lateral">Solo vídeo</button>
      <button type="button" data-vc181-action="fullscreen" title="Pantalla completa del reproductor">⛶</button>
    </div><div class="vc181-scrub" role="group" aria-label="Línea temporal de reproducción"><span id="vc181-clock">--:--</span><input id="vc181-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Buscar momento del vídeo" disabled><span id="vc181-duration">--:--</span></div><div class="vc181-timeline-note" id="vc181-timeline-note">Los rallies, ejercicios y clips usan la misma fuente de vídeo.</div>`;
   const frame=$('v780-video-frame');frame.insertAdjacentElement('afterend',transport);
   // Keep the original review controls available, without showing a second transport by default.
   const review=$('vc-review-pro-bar');if(review){const advancedReview=doc.createElement('details');advancedReview.className='vc181-review-details';advancedReview.innerHTML='<summary>Controles de revisión avanzados</summary>';review.before(advancedReview);advancedReview.append(review);}
   const side=doc.createElement('aside');side.id='vc181-side';side.className='vc181-side';side.setAttribute('aria-label','Herramientas según el contexto');
   side.innerHTML=`<div class="vc181-side-top"><span class="vc181-eyebrow" id="vc181-side-eyebrow">PARTIDO</span><strong id="vc181-side-title">Scouting y vídeo</strong><p id="vc181-side-help">Vídeo conectado al trabajo del entrenador.</p></div>
     <div class="vc181-side-content" data-vc181-panel="partido">
       <div class="vc181-match-card"><span id="vc181-match-label">Partido seleccionado</span><div class="vc181-score"><strong id="vc181-us">—</strong><small id="vc181-set">SET —</small><strong id="vc181-op">—</strong></div><small id="vc181-match-status">Los puntos proceden del marcador original.</small></div>
       <div class="vc181-side-block"><strong>Scouting</strong><p>Codifica con la pista 9×4 y el código rápido original.</p><button type="button" class="vc181-primary" data-vc181-action="scouting">Abrir scouting con vídeo</button></div>
       <div class="vc181-side-block"><strong>Grabación de partido</strong><p id="vc181-rec-info">Se guarda en este dispositivo.</p><div class="vc181-button-grid"><button type="button" data-vc181-action="record-start">● Iniciar REC</button><button type="button" data-vc181-action="record-stop">■ Finalizar y guardar</button></div><button type="button" data-vc181-action="marker">Marcar momento REC</button></div>
     </div>
     <div class="vc181-side-content" data-vc181-panel="entrenamiento" hidden>
       <div class="vc181-side-block"><span class="vc181-eyebrow">EJERCICIO / SESIÓN</span><strong id="vc181-training-label">Sesión de entrenamiento</strong><small id="vc181-training-date">Fecha de la sesión</small></div>
       <div class="vc181-side-block"><strong>Retraso de vídeo</strong><p>La cámara sigue capturando mientras revisas una ejecución.</p><div class="vc181-delay-grid"><button type="button" data-vc181-delay="5">5 s</button><button type="button" data-vc181-delay="10">10 s</button><button type="button" data-vc181-delay="15">15 s</button><button type="button" data-vc181-delay="30">30 s</button></div><button type="button" data-vc181-action="configure">Iniciar/configurar cámara</button></div>
       <div class="vc181-side-block"><strong>Grabación y técnica</strong><div class="vc181-button-grid"><button type="button" data-vc181-action="record-start">● Iniciar REC</button><button type="button" data-vc181-action="record-stop">■ Guardar</button></div><button class="vc181-primary" type="button" data-vc181-action="compare">Revisar clips y comparar A / B</button></div>
     </div>
     <div class="vc181-side-content" data-vc181-panel="analisis" hidden>
       <div class="vc181-side-block"><span class="vc181-eyebrow">VÍDEO + DATOS</span><strong>Acciones vinculadas</strong><p>Utiliza el filtro de jugador, fundamento y rotación; selecciona un rally para abrir su tiempo.</p><button type="button" class="vc181-primary" data-vc181-action="filters">Mostrar filtros</button></div>
       <div class="vc181-side-block"><strong>Jugadas y playlists</strong><div class="vc181-button-grid"><button type="button" data-vc181-action="selected">▶ Jugada seleccionada</button><button type="button" data-vc181-action="playlist">▶ Filtro actual</button></div><button type="button" data-vc181-action="clips">Abrir Clip Studio</button></div>
       <p class="vc181-note">Las acciones sin tiempo de vídeo deben sincronizarse antes de poder reproducirse.</p>
     </div><p id="vc181-feedback" class="vc181-feedback" role="status" aria-live="polite">Selecciona una fuente. El vídeo local no se sube automáticamente a la nube.</p>`;
   main.insertBefore(side,main.querySelector('.v780-side'));
   const filterDetails=doc.createElement('details');filterDetails.id='vc181-filters';filterDetails.className='vc181-extras';filterDetails.innerHTML='<summary>Filtros de análisis y selección de partido</summary>';
   const filterElements=['.vc58-context-bar','.v780-toolbar','.v780-status-grid','.vc58-analysis-heading','.v781-set-map-panel'];
   for(const selector of filterElements){const el=hub.querySelector(selector);if(el)filterDetails.append(el)}
   hub.append(filterDetails);
   const technical=doc.createElement('details');technical.id='vc181-technical';technical.className='vc181-extras';technical.innerHTML='<summary>Herramientas técnicas, fuentes y opciones avanzadas</summary>';
   for(const selector of ['.vc1642-command','.v117-review-sourcebar','#vc-rec34-strip']){const el=hub.querySelector(selector);if(el)technical.append(el)}
   hub.append(technical);
   // Training media editor, library, and their existing event listeners remain intact.
   const training=$('vc17110-panel');if(training)hub.append(training);
   const library=$('vc17100-library');if(library)hub.append(library);
   const originalSide=main.querySelector('.v780-side');if(originalSide)originalSide.classList.add('vc181-original-side');
   const oldHero=hub.querySelector('.v780-hero');if(oldHero)oldHero.classList.add('vc181-old-hero');
   studio.classList.add('vc181-ready');
   function feedback(message,error=false){state.lastError=error?clean(message):'';const el=$('vc181-feedback');if(el){el.textContent=clean(message);el.dataset.error=error?'1':'0'}}
   function recordingActive(){try{return !!root.vcRecordingDiagnostics?.().active}catch(_){return false}}
   function mode(mode){if(typeof root.VC_VIDEO_STUDIO_1642?.setMode==='function')return root.VC_VIDEO_STUDIO_1642.setMode(mode)!==false;return false}
   function currentKind(){return state.context==='entrenamiento'?'training':'matches'}
   function viewContext(next){
    if(!validContext(next))return false;
    if(recordingActive()&&currentKind()!==(next==='entrenamiento'?'training':'matches')){
     feedback('Finaliza y guarda la grabación actual antes de cambiar entre partido y entrenamiento.',true);return false;
    }
    state.context=next;
    root.VC17_VIDEO_UNIFIED.setContext(next==='entrenamiento'?'training':'matches');
    if(next==='analisis')changeTab('revision');
    else if(state.tab==='clips'&&next==='entrenamiento')changeTab('revision');
    else if(next==='partido'&&state.tab==='clips')changeTab('directo');
    else if(next==='entrenamiento')changeTab('delay');
    else changeTab(state.tab);
    refresh();return true;
   }
   function changeTab(next){
    if(!validTab(next))return false;
    if(next==='clips'&&state.context==='entrenamiento'){
     // Training clips have their own editor; do not invoke the match-scoped Clip Studio.
     mode('capture');
    }else mode(next==='revision'?'review':next==='clips'?'clips':'capture');
    if(next==='directo'&&state.context!=='analisis')root.v117ReviewSetSource?.('live');
    if(next==='delay')root.v117ReviewSetSource?.('delay');
    state.tab=next;studio.dataset.vc181Tab=next;
    refresh();return true;
   }
   function openTechnical(){technical.open=true;return technical;}
   function invoke(name,...args){const fn=root[name];if(typeof fn!=='function'){feedback('El motor original no ofrece '+name+'.',true);return false}try{return fn(...args)!==false}catch(err){feedback('No se pudo completar la operación: '+String(err?.message||err),true);return false}}
   function perform(action){
    const d=root.v780Diagnostics?.()||{};
    switch(action){
     case 'live':changeTab('directo');return;
     case 'source-delay':changeTab('delay');return;
     case 'file':$('v780-file')?.click();return;
     case 'youtube':if(state.context==='entrenamiento'){feedback('YouTube no es una fuente de grabación. Usa un archivo local o la cámara.');return}return invoke('v782OpenYouTubeDialog');
     case 'configure':openTechnical();if(state.tab==='delay')root.v117ReviewSetSource?.('delay');else root.v117ReviewSetSource?.('live');technical.scrollIntoView?.({block:'nearest'});return;
     case 'recordings':root.VC17_VIDEO_UNIFIED.openLibrary?.();return;
     case 'back':if(d.videoLoaded)return invoke('v780Jump',-8);return invoke('vcReviewProSkip',-8);
     case 'next':if(d.videoLoaded)return invoke('v780Jump',5);return invoke('vcReviewProSkip',5);
     case 'play':if(d.videoLoaded)return invoke('v780TogglePlay');return invoke('vcReviewProToggle');
     case 'clip':if(state.context==='entrenamiento')return perform('compare');if(state.tab!=='clips')changeTab('clips');$('vc-clip33-selected')?.click();return;
     case 'wide':state.wide=!state.wide;studio.classList.toggle('vc181-wide',state.wide);refresh();return;
     case 'solo':state.solo=!state.solo;studio.classList.toggle('vc181-solo',state.solo);refresh();return;
     case 'fullscreen':return invoke('v780Fullscreen');
     case 'scouting':{const ok=root.VC17_WORKSPACE?.route?.('scout-match-mode','matches');if(!ok)feedback('No se pudo abrir el modo de scouting.',true);return}
     case 'record-start':{const b=$('vc-rec34-strip-start');if(!b||b.disabled){feedback('Conecta una fuente LIVE y comprueba los permisos de cámara antes de grabar.',true);openTechnical();return}b.click();return}
     case 'record-stop':{const b=$('vc-rec34-strip-stop');if(!b||b.disabled){feedback('No hay una grabación activa que finalizar.',true);return}b.click();return}
     case 'marker':return root.VC17_VIDEO_UNIFIED?.getKind?.()==='training'?invoke('vcRecordingAddMarker','Entrenamiento'):invoke('vcRecordingAddMarker','Momento de partido');
     case 'compare':{const p=$('vc17110-panel');if(!p){feedback('El editor de entrenamiento no está disponible.',true);return}changeTab('clips');p.scrollIntoView?.({block:'start',behavior:'smooth'});return}
     case 'filters':filterDetails.open=true;filterDetails.scrollIntoView?.({block:'nearest'});return;
     case 'selected':return invoke('v780PlaySelected');
     case 'playlist':return invoke('v780PlayVisible');
     case 'clips':changeTab('clips');return;
    }
   }
   function activeSource(){return ['live','delay','local','youtube'].find(x=>$('v117-review-source-'+x)?.classList.contains('active'))||'local'}
   function showPanel(){
    studio.dataset.vc181Context=state.context;
    const name=state.context==='partido'?'Vídeo de partido':state.context==='entrenamiento'?'Vídeo de entrenamiento':'Análisis de vídeo';
    const description=state.context==='partido'?'Grabación, directo y scouting simultáneo':state.context==='entrenamiento'?'Delay, grabación y revisión técnica':'Revisión de rallies, acciones y clips';
    if($('vc181-title')?.textContent!==name)$('vc181-title').textContent=name;
    if($('vc181-subtitle')?.textContent!==description)$('vc181-subtitle').textContent=description;
    for(const el of chrome.querySelectorAll('[data-vc181-context]'))el.setAttribute('aria-pressed',String(el.dataset.vc181Context===state.context));
    for(const el of chrome.querySelectorAll('[data-vc181-tab]'))el.setAttribute('aria-pressed',String(el.dataset.vc181Tab===state.tab));
    for(const panel of side.querySelectorAll('[data-vc181-panel]'))panel.hidden=panel.dataset.vc181Panel!==state.context;
    $('vc181-side-eyebrow').textContent=state.context.toUpperCase();
    $('vc181-side-title').textContent=state.context==='entrenamiento'?'Control del entrenamiento':state.context==='analisis'?'Revisión táctica':'Scouting y vídeo';
    $('vc181-side-help').textContent=state.context==='entrenamiento'?'Ejercicio, Delay y clips técnicos.':state.context==='analisis'?'Filtra jugadas y abre el momento de vídeo.':'Sigue el partido sin duplicar acciones ni códigos.';
    studio.querySelector('[data-vc181-action="wide"]')?.setAttribute('aria-pressed',String(state.wide));
    studio.querySelector('[data-vc181-action="solo"]')?.setAttribute('aria-pressed',String(state.solo));
    const selection=$('v780-match')?.selectedOptions?.[0]?.textContent||'';
    $('vc181-match-label').textContent=clean(selection)||'Selecciona un partido';
    // Display data only from the original match scoreboard, not mirrored mutable state.
    const selectedId=Number($('v780-match')?.value)||0;
    let activeId=0;try{activeId=Number(root.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.())||0}catch(_){}
    const sameMatch=!!selectedId&&selectedId===activeId;
    const us=sameMatch?clean($('v800-score-us')?.textContent):'',op=sameMatch?clean($('v800-score-op')?.textContent):'';
    const set=sameMatch?clean($('v113-video-set')?.textContent||$('vc155-set')?.textContent):'';
    $('vc181-us').textContent=us||'—';$('vc181-op').textContent=op||'—';$('vc181-set').textContent=set||'SET —';
    $('vc181-match-status').textContent=sameMatch?'Marcador del scouting activo.':'Para ver el marcador, selecciona el scouting activo.';
    const session=root.VC17_VIDEO_UNIFIED.trainingSnapshot?.(doc)||{};
    const train=root.VC17_VIDEO_CONTEXT?.kind==='training'?(root.VC17_VIDEO_UNIFIED.recordContext?.().training||{}):{};
    $('vc181-training-label').textContent=train.objective||clean($('sesion-objetivo')?.value)||'Sesión de entrenamiento';
    $('vc181-training-date').textContent=train.date||clean($('sesion-fecha')?.value)||'Fecha pendiente';
    for(const btn of side.querySelectorAll('[data-vc181-delay]')){const v=Number(root.liveDelayDiagnostics?.()?.delaySeconds);btn.setAttribute('aria-pressed',String(v===Number(btn.dataset.vc181Delay)))}
   }
   function refresh(){
    state.updates++;showPanel();
    const d=root.v780Diagnostics?.()||{},rec=root.vcRecordingDiagnostics?.()||{},source=activeSource();
    const sourceLabel=source==='local'?'Archivo':source==='youtube'?'YouTube':source==='delay'?'Delay':'LIVE';
    $('vc181-source-state').textContent='FUENTE · '+sourceLabel+(d.videoLoaded?' lista':'');
    const active=!!rec.active;$('vc181-record-state').textContent=active?'● REC · Activo':'REC · Detenido';$('vc181-record-state').dataset.recording=String(active);
    const video=$('v780-player-video');const duration=d.videoLoaded?Number(d.duration):Number(video?.duration);
    const time=d.videoLoaded?Number(d.currentTime):Number(video?.currentTime);
    const playable=Number.isFinite(duration)&&duration>0&&source==='local'&&!!(video?.currentSrc||video?.src);
    $('vc181-clock').textContent=playable?formatSeconds(time):'--:--';$('vc181-duration').textContent=playable?formatSeconds(duration):'--:--';
    const slider=$('vc181-seek');if(slider){slider.disabled=!playable;if(playable&&slider.dataset.dragging!=='1')slider.value=String(Math.round(Math.max(0,Math.min(1,time/duration))*1000));}
    // Never enable editing or replay controls just because a source badge exists.
    for(const act of ['play','back','next']){const b=transport.querySelector(`[data-vc181-action="${act}"]`);if(b)b.disabled=!(d.videoLoaded||(source==='delay'&&!!root.liveDelayGetReviewTimeline?.()?.available));}
    for(const act of ['record-start','record-stop']){for(const b of side.querySelectorAll(`[data-vc181-action="${act}"]`)){const original=$(act==='record-start'?'vc-rec34-strip-start':'vc-rec34-strip-stop');b.disabled=!original||original.disabled;}}
    return true;
   }
   studio.addEventListener('click',e=>{
    const context=e.target.closest?.('[data-vc181-context]');if(context&&chrome.contains(context)){viewContext(context.dataset.vc181Context);return}
    const tab=e.target.closest?.('[data-vc181-tab]');if(tab&&chrome.contains(tab)){changeTab(tab.dataset.vc181Tab);return}
    const delay=e.target.closest?.('[data-vc181-delay]');if(delay&&side.contains(delay)){const sec=Number(delay.dataset.vc181Delay);if(sec>=1&&sec<=180){invoke('liveDelaySetDelay',sec);changeTab('delay');feedback('Delay ajustado a '+sec+' s. Inicia la cámara si todavía está detenida.');}return}
    const b=e.target.closest?.('[data-vc181-action]');if(b&&studio.contains(b)&&!b.disabled)perform(b.dataset.vc181Action);
   });
   const speed=$('vc181-speed');speed?.addEventListener('change',()=>{
    const rate=Number(speed.value);const d=root.v780Diagnostics?.()||{};
    if(d.videoLoaded){const original=$('v780-speed');if(original){original.value=String(rate);invoke('v780SpeedChanged')}else invoke('vcReviewProSpeed',rate)}
    else invoke('vcReviewProSpeed',rate);
   });
   const slider=$('vc181-seek');slider?.addEventListener('input',()=>{slider.dataset.dragging='1';const d=root.v780Diagnostics?.()||{};$('vc181-clock').textContent=formatSeconds(Number(d.duration)*Number(slider.value)/1000)});
   slider?.addEventListener('change',()=>{slider.dataset.dragging='0';const d=root.v780Diagnostics?.()||{};if(d.videoLoaded&&Number(d.duration)>0){const target=Number(d.duration)*Number(slider.value)/1000;if(typeof root.vcReviewProSeek==='function')invoke('vcReviewProSeek',Number(slider.value));else if($('v780-player-video'))$('v780-player-video').currentTime=target;}refresh()});
   $('v780-player-video')?.addEventListener('timeupdate',refresh);
   $('v780-match')?.addEventListener('change',refresh);
   const recorder=$('vc-rec34-strip');if(recorder&&root.MutationObserver)new root.MutationObserver(()=>{if(doc.querySelector('#scout-video-hub.view.active'))refresh()}).observe(recorder,{attributes:true,attributeFilter:['data-active']});
   let pending=false;function schedule(){if(pending)return;pending=true;(root.requestAnimationFrame||((f)=>f()))(()=>{pending=false;if(studio.classList.contains('active'))refresh();})}
   if(root.MutationObserver){const obs=new root.MutationObserver(schedule);for(const id of ['v117-review-source-label','v780-video-state','vc-rec34-strip-status']){const el=$(id);if(el)obs.observe(el,{childList:true,subtree:true,characterData:true})}}
   root.setInterval?.(()=>{if(!doc.hidden&&studio.classList.contains('active'))refresh()},2000);
   // Preserve the selected source on mount; selecting Directo must be an explicit action.
   state.tab=activeSource()==='delay'?'delay':activeSource()==='live'?'directo':'revision';
   studio.dataset.vc181Tab=state.tab;mode(state.tab==='revision'?'review':'capture');refresh();
   root.VC_VIDEO_STUDIO_1810={version:VERSION,setContext:viewContext,setTab:changeTab,refresh,diagnostics:()=>({version:VERSION,context:state.context,tab:state.tab,wide:state.wide,solo:state.solo,updates:state.updates,originalVideoCount:studio.querySelectorAll('#v780-player-video').length,originalLiveCount:studio.querySelectorAll('#v117-review-stream').length,originalRecorderCount:studio.querySelectorAll('#vc-rec34-strip').length,lastError:state.lastError,scoutingEngineModified:false,syncEngineModified:false})};
   return true;
  }
  let attempts=0;
  function bootstrap(){if(start())return;if(++attempts<48)root.setTimeout?.(bootstrap,250);}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();return true;
 }
 return {VERSION,CONTEXTS,TABS,clean,formatSeconds,selectContext,validContext,validTab,mount};
});
