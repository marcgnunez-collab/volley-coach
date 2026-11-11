/* Volley Coach V16.4.2 · Video Studio Pro
 * Three workspaces over the existing V7.8 / V16 video engine.
 * Does not create, replace or clone a media element, recording, match or clip.
 * All media actions delegate to the existing user-facing engine.
 */
(()=>{
 'use strict';
 if(window.VC_VIDEO_STUDIO_1642)return;
 const VERSION='16.4.3';
 const $=id=>document.getElementById(id);
 const root=$('scout-video-hub'),hub=root?.querySelector('.v780-hub');
 if(!root||!hub)return;
 const allowed=['capture','review','clips'];
 const state={mode:'capture',changes:0,lastError:'',mounted:false};
 let pending=false;
 const command=document.createElement('section');
 command.id='vc1642-command';
 command.className='vc1642-command';
 command.setAttribute('aria-label','Video Studio Pro · controles unificados');
 command.innerHTML=`
  <div class="vc1642-header">
   <div class="vc1642-heading"><span>VOLLEY COACH · VIDEO STUDIO PRO 3.0</span><strong>Captura, revisión y clips</strong><small>Un único reproductor y el mismo scouting, sin copias paralelas</small></div>
   <div class="vc1642-indicators" role="status" aria-live="polite"><span id="vc1642-source-state">Fuente: —</span><span id="vc1642-sync-state">Sincronización: —</span><span id="vc1642-clip-state">Clips: —</span></div>
  </div>
  <nav class="vc1642-modes" aria-label="Espacios de vídeo">
   <button type="button" data-vc1642-mode="capture" aria-pressed="true"><b>01 · Captura</b><small>Fuentes, directo, delay y grabación</small></button>
   <button type="button" data-vc1642-mode="review" aria-pressed="false"><b>02 · Revisión</b><small>Rallies, rotaciones, análisis y playlists</small></button>
   <button type="button" data-vc1642-mode="clips" aria-pressed="false"><b>03 · Clips</b><small>Marcas IN/OUT, catálogo y montajes</small></button>
  </nav>
  <div class="vc1642-actions" aria-label="Acciones rápidas del espacio de vídeo">
   <div class="vc1642-review-buttons" aria-label="Atajos de revisión">
    <button type="button" data-vc1642-action="back" title="Retroceder 8 segundos">−8 s</button>
    <button type="button" data-vc1642-action="play" title="Reproducir o pausar">Reproducir / Pausa</button>
    <button type="button" data-vc1642-action="forward" title="Avanzar 5 segundos">+5 s</button>
    <button type="button" data-vc1642-action="selected">Reproducir selección</button>
    <button type="button" data-vc1642-action="go-clips" class="vc1642-primary">Ir a Clip Studio</button>
   </div>
   <div class="vc1642-clip-buttons" aria-label="Atajos de clips">
    <span>Los clips son referencias temporales; no duplican el vídeo.</span>
    <button type="button" data-vc1642-action="new-clip" class="vc1642-primary">Clip de la selección</button>
    <button type="button" data-vc1642-action="export-clips">Catálogo CSV</button>
    <button type="button" data-vc1642-action="go-review">Volver a revisión</button>
   </div>
  </div>
  <p id="vc1642-feedback" class="vc1642-feedback" aria-live="polite">Selecciona una fuente para grabar o revisar el partido.</p>`;
 const css=document.createElement('style');
 css.id='vc1642-style';
 css.textContent=`
 #scout-video-hub .vc1642-command{order:1;min-width:0;display:grid;gap:10px;background:#fff;border:1px solid #cadce8;border-radius:16px;padding:15px 16px;color:#153a57;font:500 12px/1.4 system-ui, sans-serif;box-shadow:0 7px 20px rgba(13,43,66,.05)}
 #scout-video-hub .vc1642-command *{box-sizing:border-box}
 #scout-video-hub .vc1642-header{display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap}
 #scout-video-hub .vc1642-heading{display:grid;gap:2px}
 #scout-video-hub .vc1642-heading>span{font-size:9px;letter-spacing:.13em;color:#547c97;font-weight:850}
 #scout-video-hub .vc1642-heading strong{font-size:18px;line-height:1.25;color:#153e5f}
 #scout-video-hub .vc1642-heading small{color:#66859d;font-size:11px}
 #scout-video-hub .vc1642-indicators{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
 #scout-video-hub .vc1642-indicators span{background:#eef5f9;border:1px solid #d7e6ef;border-radius:99px;padding:5px 9px;color:#456a83;font-weight:750;font-size:10px}
 #scout-video-hub .vc1642-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:5px;background:#edf3f8;border:1px solid #dce8f0;border-radius:12px}
 #scout-video-hub .vc1642-modes button{display:grid!important;justify-items:start;gap:4px;min-width:0!important;min-height:62px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;padding:10px 12px!important;text-align:left!important;color:#466d8a!important;box-shadow:none!important;cursor:pointer}
 #scout-video-hub .vc1642-modes button b{font-size:12px;font-weight:850;color:inherit}
 #scout-video-hub .vc1642-modes button small{font-size:10px;color:inherit;opacity:.8;line-height:1.35;white-space:normal}
 #scout-video-hub .vc1642-modes button[aria-pressed="true"]{background:#174e7c!important;border-color:#174e7c!important;color:#fff!important;box-shadow:0 4px 10px rgba(23,78,124,.2)!important}
 #scout-video-hub .vc1642-actions>div{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
 #scout-video-hub .vc1642-actions>div>span{color:#678197;font-size:10px;font-weight:750;margin-right:3px}
 #scout-video-hub .vc1642-actions button{min-height:36px!important;border:1px solid #cbdde9!important;background:#f7fbfe!important;color:#225c84!important;padding:7px 11px!important;border-radius:8px!important;font:750 11px system-ui!important;cursor:pointer}
 #scout-video-hub .vc1642-actions button.vc1642-primary{background:#1e6096!important;color:white!important;border-color:#1e6096!important}
 #scout-video-hub .vc1642-actions button:disabled{opacity:.48!important;cursor:not-allowed!important}
 #scout-video-hub .vc1642-feedback{margin:0;color:#6b8398;font:500 10px/1.4 system-ui}
 #scout-video-hub .vc1642-feedback[data-error="true"]{color:#a3433d}
 #scout-video-hub.vc1642-ready .vc58-tabbar{display:none!important}
 #scout-video-hub.vc1642-ready .v780-hero-actions{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .v117-review-source-tabs{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .v117-review-sourcebar{min-height:70px}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-actions{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-review-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-clip-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .vc1642-source-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .vc1642-clip-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-source-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-review-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-toolbar,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-status-grid,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc58-analysis-heading,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-timeline-panel,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v781-set-map-panel,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-side{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hub{grid-template-columns:minmax(0,1fr) minmax(320px,.9fr)!important;grid-template-areas:'hero hero' 'command command' 'context context' 'player clips'!important;gap:12px!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hero{grid-area:hero!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-command{grid-area:command!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc58-context-bar{grid-area:context!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-main{grid-area:player!important;grid-template-columns:minmax(0,1fr)!important;min-width:0!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] #vc-clip33{grid-area:clips!important;min-width:0!important;margin:0!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] #vc-clip33 .vc-clip33-head{flex-wrap:wrap}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .v780-main{grid-template-columns:minmax(0,1.45fr) minmax(260px,.75fr)!important}
 @media(max-width:1100px){#scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hub{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'hero' 'command' 'context' 'player' 'clips'!important}#scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .v780-main{grid-template-columns:minmax(0,1fr)!important}}
 @media(max-width:640px){#scout-video-hub .vc1642-command{padding:10px;gap:8px}#scout-video-hub .vc1642-modes{gap:3px}#scout-video-hub .vc1642-modes button{padding:9px 7px!important;min-height:62px!important}#scout-video-hub .vc1642-modes button b{font-size:10px}#scout-video-hub .vc1642-modes button small{font-size:9px}#scout-video-hub .vc1642-heading strong{font-size:15px}#scout-video-hub .vc1642-indicators{justify-content:flex-start}#scout-video-hub .vc1642-actions>div{gap:4px}#scout-video-hub .vc1642-actions button{flex:1 0 auto;font-size:10px!important;padding:8px!important}}
 @media(prefers-reduced-motion:reduce){#scout-video-hub .vc1642-modes button{transition:none!important}}
 `;
 function say(message,error=false){state.lastError=error?message:'';const out=$('vc1642-feedback');if(out){out.textContent=message;out.dataset.error=error?'true':'false'}}
 const safeCall=(name,...args)=>{const fn=window[name];if(typeof fn!=='function'){say(`La función «${name}» no está disponible en esta pantalla.`,true);return false}try{fn(...args);return true}catch(err){console.warn('VC1642',name,err);say('No se pudo completar la operación. Comprueba la fuente de vídeo.',true);return false}};
 function setMode(next,{focus=false}={}){
  if(!allowed.includes(next))return false;
  const tab=next==='capture'?'player':'analysis';
  // The original two-tab controller only toggles visibility; no media reload.
  if(typeof window.vc58SetVideoTab!=='function'){say('El espacio de vídeo todavía no ha terminado de cargarse.',true);return false}
  state.mode=next;root.dataset.vc1642Mode=next;state.changes++;
  window.vc58SetVideoTab(tab);
  for(const button of command.querySelectorAll('[data-vc1642-mode]')){
   const isActive=button.dataset.vc1642Mode===next;
   button.setAttribute('aria-pressed',String(isActive));
   if(focus&&isActive)button.focus();
  }
  say(next==='capture'?'Usa los controles superiores y el panel principal para elegir fuente, LIVE, DELAY y grabación.':next==='review'?'Selecciona un rally o una acción. El reproductor se mantiene cargado al cambiar de espacio.':'Selecciona o crea clips y playlists; la fuente de vídeo sigue siendo la del partido actual.');
  schedule();return true;
 }
 function refresh(){
  if(!state.mounted)return;
  const dg=window.v780Diagnostics?.()||{};
  const source=$('v117-review-source-label')?.textContent?.trim()||dg.mediaType||'Sin fuente';
  const baseVideo=$('v780-video-state')?.textContent?.trim()||'Sin vídeo';
  const liveStatus=$('v117-review-live-copy')?.textContent?.trim();
  const vid=/^(LIVE|DELAY)$/i.test(source)?(liveStatus||'Cámara sin iniciar'):baseVideo;
  const sync=$('v780-sync-state')?.textContent?.trim()||'Pendiente';
  const count=$('vc-clip33-count')?.textContent?.trim()||'Sin catálogo';
  const fields={'vc1642-source-state':`Fuente: ${source} · ${vid}`,'vc1642-sync-state':`Sincronización: ${sync}`,'vc1642-clip-state':`Clips: ${count}`};
  Object.entries(fields).forEach(([id,value])=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value});
  const canPlay=!!dg.videoLoaded;
  for(const name of ['back','play','forward','selected']){
   const btn=command.querySelector(`[data-vc1642-action="${name}"]`);if(btn)btn.disabled=!canPlay;
  }
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})}
 function action(name){
  if(name==='file'){
   if(!setMode('capture'))return;
   const input=$('v780-file');if(!input){say('No está disponible el selector de archivo.',true);return}input.click();return;
  }
  if(name==='recordings'){if(setMode('capture'))safeCall('v780OpenRecordingPicker');return}
  if(name==='youtube'){if(setMode('capture'))safeCall('v117ReviewSetSource','youtube');return}
  if(name==='live'||name==='delay'){
   if(setMode('capture'))safeCall('v117ReviewSetSource',name);
   // Switching source never starts or stops a camera on behalf of the user.
   return;
  }
  if(name==='back'||name==='forward'){
   const dg=window.v780Diagnostics?.()||{};if(!dg.videoLoaded){say('Carga un vídeo correspondiente a este scouting para navegar.',true);return}
   safeCall('v780Jump',name==='back'?-8:5);return;
  }
  if(name==='play'){
   const dg=window.v780Diagnostics?.()||{};if(!dg.videoLoaded){say('Carga primero el vídeo.',true);return}
   safeCall('v780TogglePlay');return;
  }
  if(name==='selected'){
   const title=$('v780-selected-title')?.textContent?.trim();if(!title||title==='Ningún elemento'){say('Selecciona primero una jugada en la línea temporal.',true);return}
   safeCall('v780PlaySelected');return;
  }
  if(name==='new-clip'){
   // The original Clip Studio validates match/timecode and owns the save.
   const btn=$('vc-clip33-selected');if(!btn){say('Clip Studio no está disponible.',true);return}
   btn.click();schedule();return;
  }
  if(name==='export-clips'){
   const btn=$('vc-clip33-csv');if(!btn){say('No está disponible el exportador de clips.',true);return}
   btn.click();return;
  }
  if(name==='go-clips'){setMode('clips');return}
  if(name==='go-review'){setMode('review');return}
 }
 function mount(){
  if(state.mounted)return true;
  document.head.appendChild(css);
  hub.insertBefore(command,hub.querySelector('.vc58-tabbar'));
  root.classList.add('vc1642-ready');state.mounted=true;
  command.addEventListener('click',event=>{
   const btn=event.target.closest('button');if(!btn||!command.contains(btn)||btn.disabled)return;
   if(btn.dataset.vc1642Mode){setMode(btn.dataset.vc1642Mode);return}
   if(btn.dataset.vc1642Action)action(btn.dataset.vc1642Action);
  });
  // Watch only existing counters and source states; our labels are outside these targets.
  for(const id of ['v780-video-state','v780-sync-state','v117-review-source-label','v117-review-live-copy','vc-clip33-count']){
   const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
  }
  const match=$('v780-match');match?.addEventListener('change',schedule);
  const player=$('v780-player-video');
  for(const evt of ['loadedmetadata','emptied','playing','pause','durationchange','error'])player?.addEventListener(evt,schedule);
  root.addEventListener('click',event=>{
   if(event.target.closest('.v117-review-source-tabs button,.v780-hero-actions button,#vc-clip33 button,.vc58-tabbar button'))schedule();
  });
  new MutationObserver(()=>{
   const active=root.dataset.vc58Tab==='player'?'capture':'review';
   if(root.dataset.vc58Tab==='player'&&state.mode!=='capture'){state.mode='capture';root.dataset.vc1642Mode='capture';for(const b of command.querySelectorAll('[data-vc1642-mode]'))b.setAttribute('aria-pressed',String(b.dataset.vc1642Mode==='capture'))}
   else if(root.dataset.vc58Tab==='analysis'&&state.mode==='capture'){state.mode=active;root.dataset.vc1642Mode=active;for(const b of command.querySelectorAll('[data-vc1642-mode]'))b.setAttribute('aria-pressed',String(b.dataset.vc1642Mode===active))}
   schedule();
  }).observe(root,{attributes:true,attributeFilter:['data-vc58-tab']});
  // Do not change source or replay media on first mount.
  setMode('capture');return true;
 }
 function diagnostics(){return {version:VERSION,mounted:state.mounted,mode:state.mode,changes:state.changes,mediaElements:root.querySelectorAll('#v780-player-video').length,liveStreamElements:root.querySelectorAll('#v117-review-stream').length,hasOriginalClipStudio:!!$('vc-clip33'),hasOriginalRecorder:!!$('vc-rec34-strip'),lastError:state.lastError};}
 window.VC_VIDEO_STUDIO_1642={version:VERSION,mount,setMode,refresh,diagnostics};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
