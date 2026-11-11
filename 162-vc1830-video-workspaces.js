/* Volley Coach V18.4.0 — Video Studio: cuatro espacios independientes, una captura compartida.
 * Presentación y control explícito sobre motores existentes: NO crea streams,
 * MediaRecorder, elementos video ni mutaciones de scouting/sincronización.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.4.0',SCREENS=['camara','revision','clips','biblioteca'];
 const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
 function validScreen(x){return SCREENS.includes(x)}
 function clipTime(x){const n=Number(x);if(!Number.isFinite(n)||n<0)return '--:--';const s=Math.floor(n);return (Math.floor(s/3600)?String(Math.floor(s/3600)).padStart(2,'0')+':':'')+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 function normalizeMarkers(rows,rangeForRow){
  if(!Array.isArray(rows))return [];
  const result=[],seen=new Set();
  for(const row of rows){
   if(!row||row.key==null||seen.has(String(row.key)))continue;
   let range;try{range=rangeForRow(row)}catch(_){continue}
   if(!range)continue;
   const sec=Number(row.type==='rally'?range.start:(range.center??range.start));
   if(!Number.isFinite(sec)||sec<0)continue;
   const type=row.type==='rally'?'rally':row.skill==='S'?'saque':row.skill==='R'?'recepcion':row.skill==='A'?'ataque':'accion';
   seen.add(String(row.key));
   result.push({key:String(row.key),time:sec,type,label:clean(row.label)||'Jugada'});
  }
  return result.sort((a,b)=>a.time-b.time).slice(0,500);
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC_VIDEO_WORKSPACES_1830)return true;
   const $=id=>doc.getElementById(id),studio=$('scout-video-hub'),hub=studio?.querySelector('.v780-hub'),main=hub?.querySelector('.v780-main');
   if(!studio||!hub||!main||!$('v780-video-frame')||!root.VC_VIDEO_STUDIO_1810)return false;
   const chrome=$('vc181-chrome');if(!chrome)return false;
   const state={screen:'camara',changing:false,updates:0,markers:[],markerSig:'',lastError:'',busy:false};
   // A new navigation level: Clips is a full workspace, not a panel under Live/Delay.
   const menu=doc.createElement('div');menu.id='vc183-navigation';menu.className='vc183-navigation';
   menu.innerHTML=`<div class="vc183-nav-caption">VIDEO STUDIO PRO · ESPACIOS INDEPENDIENTES</div><nav aria-label="Áreas de Video Studio Pro">
     <button type="button" data-vc183-screen="camara" aria-current="page"><span class="vc183-nav-icon">◉</span><span><b>Cámara + Delay</b><small>Un origen · dos vistas</small></span></button>
     <button type="button" data-vc183-screen="revision"><span class="vc183-nav-icon">▶</span><span><b>Revisión</b><small>Vídeo y rallies</small></span></button>
     <button type="button" data-vc183-screen="clips"><span class="vc183-nav-icon">✂</span><span><b>Clips Studio</b><small>Editar y comparar</small></span></button>
     <button type="button" data-vc183-screen="biblioteca"><span class="vc183-nav-icon">▤</span><span><b>Videoteca</b><small>Grabaciones locales</small></span></button>
    </nav>`;
   chrome.appendChild(menu);
   const header=doc.createElement('section');header.id='vc183-screen-heading';header.className='vc183-screen-heading';
   header.innerHTML=`<div><span id="vc183-kicker">LIVE Y DELAY CONECTADOS</span><h3 id="vc183-heading">Cámara y revisión diferida</h3><p id="vc183-description">La misma captura alimenta el directo y el búfer de Delay. Cambia de vista sin reiniciar la cámara.</p></div><div class="vc183-heading-actions"><div id="vc183-review-actions" class="vc183-review-actions" aria-label="Fuentes para revisión"><button type="button" data-vc183-action="file">Abrir archivo</button><button type="button" data-vc183-action="recordings">Videoteca</button><button type="button" data-vc183-action="youtube">YouTube</button><button type="button" data-vc183-action="filters">Filtros</button><button type="button" data-vc183-action="sync">Vincular tiempo</button><button type="button" data-vc183-action="go-clips">Abrir Clips</button></div><span class="vc183-view-status" id="vc183-status">Cámara detenida</span></div>`;
   hub.insertBefore(header,main);
   // Reuse the exact same original video player and transport; only the sidebar changes.
   const controls=doc.createElement('aside');controls.id='vc183-capture-side';controls.className='vc183-capture-side';
   controls.setAttribute('aria-label','Cámara y Delay conectados');
   controls.innerHTML=`<div class="vc183-headline"><span>CAPTURA COMPARTIDA</span><h3>Live + Delay</h3><p>La cámara se inicia una sola vez. El Delay usa esa misma señal y continúa acumulando vídeo mientras ves LIVE.</p></div>
    <div class="vc183-linked-switch" role="group" aria-label="Vista de la misma cámara">
      <button type="button" data-vc183-view="live" aria-pressed="true"><b>● LIVE</b><small>Tiempo real</small></button>
      <button type="button" data-vc183-view="delay" aria-pressed="false"><b>◷ DELAY</b><small>Repetición diferida</small></button>
    </div>
    <div class="vc183-signal"><span>Captura</span><strong id="vc183-capture-state">Sin iniciar</strong><span>Delay</span><strong id="vc183-buffer-state">Sin búfer</strong></div>
    <div class="vc183-capture-buttons"><button type="button" class="vc183-primary" id="vc183-start">▶ Iniciar Live + Delay</button><button type="button" id="vc183-stop" disabled>■ Detener cámara</button></div>
    <label class="vc183-source-select">Origen de la señal<select id="vc183-source-select"><option value="local">Cámara de este dispositivo</option><option value="remote">Móvil conectado (WebRTC)</option></select></label>
    <div class="vc183-delay-presets"><span>Retraso</span><div role="group" aria-label="Retraso de reproducción"><button data-vc183-seconds="5" type="button">5 s</button><button data-vc183-seconds="10" type="button">10 s</button><button data-vc183-seconds="15" type="button">15 s</button><button data-vc183-seconds="30" type="button">30 s</button></div></div>
    <div class="vc183-record-controls"><div class="vc183-record-head"><strong>Grabación local</strong><span id="vc183-rec-status">REC detenido</span></div><div class="vc183-rec-buttons"><button type="button" class="vc183-record-start" id="vc183-rec-start" disabled>● Iniciar REC</button><button type="button" id="vc183-rec-stop" disabled>■ Finalizar y guardar</button></div><button type="button" id="vc183-add-marker" disabled>＋ Marcar rally / ejercicio</button><small>La grabación toma la fuente LIVE, no las imágenes retrasadas.</small></div>
    <div class="vc183-capture-actions"><button type="button" data-vc183-action="return">Volver al retraso</button><button type="button" data-vc183-action="configure">Configurar cámara / QR</button><button type="button" data-vc183-action="recordings">Videoteca</button></div>
    <p id="vc183-note" class="vc183-note" role="status" aria-live="polite">Inicia la cámara para ver LIVE y DELAY conectados. La grabación REC es independiente.</p>`;
   main.appendChild(controls);
   const timeline=doc.createElement('section');timeline.id='vc183-timeline';timeline.className='vc183-timeline';
   timeline.innerHTML=`<div class="vc183-timeline-head"><div><span>TIME LINE PRO</span><h3>Rallies y acciones vinculados</h3><p>Selecciona una marca para abrir el momento asociado al vídeo cargado.</p></div><div class="vc183-timeline-filters"><label>Mostrar<select id="vc183-mark-filter"><option value="all">Todas</option><option value="rally">Rallies</option><option value="ataque">Ataques</option><option value="saque">Saques</option><option value="recepcion">Recepciones</option></select></label><span id="vc183-mark-count">0 referencias</span></div></div><div class="vc183-marker-rail" id="vc183-marker-rail" aria-label="Marcas de vídeo"></div><div id="vc183-marker-list" class="vc183-marker-list"></div><p class="vc183-timeline-help">Las marcas solo aparecen cuando el scouting contiene referencias temporales. Sin vídeo sincronizado no se puede reproducir la jugada.</p>`;
   hub.insertBefore(timeline,main.nextSibling);
   // Keep the full legacy rally history accessible, but not stacked below the new
   // timestamp rail as an apparent second Timeline. No data or controls are removed.
   const legacyTimeline=hub.querySelector(':scope > .v780-timeline-panel');
   if(legacyTimeline){
    const history=doc.createElement('details');history.id='vc184-rally-history';history.className='vc184-rally-history';
    history.innerHTML='<summary>Historial completo de rallies (incluidas acciones sin tiempo)</summary>';
    legacyTimeline.before(history);history.appendChild(legacyTimeline);
   }
   // Dedicated clips landing page — separate heading and catalog. The one playback
   // element remains in main as a clip preview; no duplicate recorder or video.
   const clipsHead=doc.createElement('section');clipsHead.id='vc183-clips-heading';clipsHead.className='vc183-clips-heading';
   clipsHead.innerHTML=`<div><span>CLIP STUDIO PRO · ESPACIO INDEPENDIENTE</span><h3>Biblioteca y editor de clips</h3><p>Selecciona jugadas, marca IN/OUT, organiza referencias y compara ejecuciones de entrenamiento.</p></div><div class="vc183-clip-actions"><button type="button" data-vc183-action="back-review">← Volver a revisión</button><button type="button" data-vc183-action="export">Exportar referencias CSV</button></div>`;
   hub.insertBefore(clipsHead,main);
   // Fourth workspace: the real local recording library from V17.10, not a second store.
   const libraryHead=doc.createElement('section');libraryHead.id='vc183-library-heading';libraryHead.className='vc183-library-heading';
   libraryHead.innerHTML=`<div><span>VIDEOTECA · ALMACENAMIENTO LOCAL</span><h3>Grabaciones y archivos</h3><p>Consulta las grabaciones guardadas en este dispositivo. El vídeo no se sube automáticamente a la nube.</p></div><div class="vc183-library-actions"><button type="button" data-vc183-action="refresh-library">Actualizar grabaciones</button><button type="button" data-vc183-action="open-library-file">Abrir archivo en Revisión</button></div>`;
   hub.insertBefore(libraryHead,main);
   const clipHelp=doc.createElement('section');clipHelp.id='vc183-clips-guide';clipHelp.className='vc183-clips-guide';clipHelp.innerHTML='<strong>Clips de entrenamiento</strong><p>Abre un vídeo local en el editor de entrenamiento y guarda los momentos IN/OUT con ejercicio y jugador. Para partidos utiliza las referencias vinculadas al scouting.</p>';
   const training=$('vc17110-panel');if(training)training.insertAdjacentElement('beforebegin',clipHelp);else hub.append(clipHelp);
   const originalVideo=main.querySelector('.v780-video-panel');
   const originalClips=$('vc-clip33');
   const originalTraining=$('vc17110-panel');
   const safety=$('vc182-panel');
   if(safety&&originalVideo){const detail=doc.createElement('details');detail.className='vc183-safety-details';detail.innerHTML='<summary>Estado avanzado de grabación y Delay</summary>';safety.before(detail);detail.append(safety);}
   const ctx=()=>studio.dataset.vc181Context||'partido';
   function feedback(message,error=false){state.lastError=error?clean(message):'';const el=$('vc183-note');if(el){el.textContent=clean(message);el.dataset.error=error?'1':'0'}}
   function captureDiagnostics(){try{return root.liveDelayDiagnostics?.()||{}}catch(_){return{}}}
   function recordDiagnostics(){try{return root.vcRecordingDiagnostics?.()||{}}catch(_){return{}}}
   function currentSource(){return ['live','delay','local','youtube'].find(v=>$('v117-review-source-'+v)?.classList.contains('active'))||'local'}
   function cameraView(view){
    if(!['live','delay'].includes(view))return false;
    // Both tabs reuse the SAME stream and MediaSource buffer of LiveDelay V7.3.
    // Do not invoke stopLiveDelay, getUserMedia or any second recorder here.
    if(typeof root.v117ReviewSetSource!=='function'){feedback('El visor de Live/Delay no está cargado.',true);return false}
    root.v117ReviewSetSource(view);
    if(view==='delay'&&captureDiagnostics().running)root.liveDelayReturn?.();
    studio.dataset.vc183View=view;
    for(const b of controls.querySelectorAll('[data-vc183-view]'))b.setAttribute('aria-pressed',String(b.dataset.vc183View===view));
    update();return true;
   }
   async function startCamera(){
    if(state.busy)return false;
    if(captureDiagnostics().running){update();return true}
    const origSource=$('v117-review-live-source-select'),chosen=$('vc183-source-select').value;
    if(origSource)origSource.value=chosen;
    if(typeof root.v117ReviewChooseLiveSource==='function')root.v117ReviewChooseLiveSource(chosen);
    if(typeof root.v117ReviewStartLive!=='function'){feedback('El motor de cámara no está disponible.',true);return false}
    state.busy=true;update();feedback('Conectando la cámara compartida…');
    try{
     const ok=await root.v117ReviewStartLive();
     if(!ok||!captureDiagnostics().running){feedback(clean($('v117-review-live-feedback')?.textContent)||'No se ha podido iniciar la cámara. Comprueba permisos y señal.',true);return false}
     cameraView(studio.dataset.vc183View==='delay'?'delay':'live');
     feedback('Captura activa. LIVE y DELAY utilizan la misma señal; puedes alternar sin reiniciar.');
     return true;
    }catch(err){feedback('Error al conectar: '+String(err?.message||err),true);return false}
    finally{state.busy=false;update()}
   }
   function stopCamera(){
    const recording=recordDiagnostics();
    if(recording.active||recording.stopping){feedback('Finaliza y guarda REC antes de detener la cámara.',true);return false}
    if(typeof root.v117ReviewStopLive!=='function'){feedback('El motor de cámara no está disponible.',true);return false}
    root.v117ReviewStopLive();feedback('Cámara y búfer detenidos. Las grabaciones ya guardadas permanecen disponibles.');update();return true;
   }
   function delaySeconds(seconds){
    const n=Number(seconds);if(![5,10,15,30].includes(n))return false;
    if(typeof root.liveDelaySetDelay!=='function'){feedback('El ajuste de Delay no está disponible.',true);return false}
    const ok=root.liveDelaySetDelay(n);if(ok===false){feedback('No se pudo modificar el retraso.',true);return false}
    if(state.screen==='camara')cameraView('delay');
    feedback('Retraso ajustado a '+n+' segundos sobre la misma captura.');update();return true;
   }
   function setScreen(next){
    if(!validScreen(next))return false;
    state.screen=next;studio.dataset.vc183Screen=next;studio.dataset.vc183Training=String(ctx()==='entrenamiento');
    // The existing player, Live/Delay capture and recorder remain mounted.
    // Do not switch the legacy mode when the shared camera or REC is active:
    // that may change a source while the coach is still recording.
    const capturing=!!captureDiagnostics().running||!!recordDiagnostics().active;
    if(!capturing){
     if(next==='camara')root.VC_VIDEO_STUDIO_1810.setTab?.(studio.dataset.vc183View==='delay'?'delay':'directo');
     else if(next==='revision'||next==='biblioteca')root.VC_VIDEO_STUDIO_1810.setTab?.('revision');
     else if(ctx()!=='entrenamiento')root.VC_VIDEO_STUDIO_1810.setTab?.('clips');
    }
    for(const b of menu.querySelectorAll('[data-vc183-screen]')){
     const selected=b.dataset.vc183Screen===next;
     if(selected){b.setAttribute('aria-current','page');b.setAttribute('aria-pressed','true')}
     else{b.removeAttribute('aria-current');b.setAttribute('aria-pressed','false')}
    }
    const desc={
     camara:['LIVE Y DELAY CONECTADOS','Cámara + Delay','La misma captura alimenta la vista en directo, el búfer de Delay y la grabación local.'],
     revision:['REVISIÓN TÁCTICA','Revisión de vídeo','Abre una grabación y consulta las jugadas o los ejercicios asociados a su tiempo.'],
     clips:['CLIPS STUDIO','Edición y comparación','Guarda referencias IN/OUT y crea listas de jugadas sin tocar el vídeo original.'],
     biblioteca:['VIDEOTECA','Grabaciones locales','Recupera vídeos de partidos y entrenamientos en este dispositivo.']
    }[next];
    $('vc183-kicker').textContent=desc[0];$('vc183-heading').textContent=desc[1];$('vc183-description').textContent=desc[2];
    const ch=clipsHead.querySelector('h3');if(ch)ch.textContent=ctx()==='entrenamiento'?'Clips de entrenamiento · A/B':'Clips Studio · Partido';
    if(next==='revision')drawTimeline();
    if(next==='biblioteca'){
     const info=$('vc17100-library-info');if(info)info.textContent='Consultando las grabaciones del dispositivo…';
     Promise.resolve().then(()=>root.VC17_VIDEO_UNIFIED?.openLibrary?.()).then(ok=>{
      if(ok===false&&state.screen==='biblioteca')feedback('No se ha podido leer la biblioteca local. Puedes abrir un archivo desde Revisión.',true);
     }).catch(err=>feedback('No se pudo consultar la videoteca: '+String(err?.message||err),true));
    }
    update();return true;
   }
   function getMarkers(){
    const rows=root.VC_VIDEO_REVIEW_API?.timeline?.()||[],range=root.VC_SCOUT_CLIPS_PRO?.rangeForRow;
    if(typeof range!=='function')return [];
    return normalizeMarkers(rows,row=>range(row));
   }
   function drawTimeline(){
    const filter=$('vc183-mark-filter')?.value||'all';
    const items=getMarkers().filter(x=>filter==='all'||x.type===filter);
    state.markers=items;
    const count=$('vc183-mark-count');if(count)count.textContent=`${items.length} referencias con tiempo`;
    const rail=$('vc183-marker-rail'),list=$('vc183-marker-list');if(!rail||!list)return;
    rail.replaceChildren();list.replaceChildren();
    if(!items.length){const empty=doc.createElement('p');empty.className='vc183-empty';empty.textContent='No hay referencias temporales para este filtro. Selecciona un partido y sincroniza el vídeo.';list.append(empty);return}
    const max=Math.max(1,items[items.length-1].time);let lastPos=-100;
    for(const item of items.slice(0,250)){
     const pos=Math.max(0,Math.min(100,item.time/max*100));
     if(pos-lastPos<1.2)continue;lastPos=pos;
     const button=doc.createElement('button');button.type='button';button.className='vc183-rail-marker';button.dataset.vc183Key=item.key;button.dataset.type=item.type;button.style.left=pos+'%';button.title=`${item.label} · ${clipTime(item.time)}`;button.setAttribute('aria-label',button.title);rail.append(button);
    }
    for(const item of items.slice(-30).reverse()){
     const button=doc.createElement('button');button.type='button';button.className='vc183-marker-row';button.dataset.vc183Key=item.key;
     const type=doc.createElement('span');type.className='vc183-marker-tag';type.dataset.type=item.type;type.textContent=item.type;
     const title=doc.createElement('strong');title.textContent=item.label;
     const time=doc.createElement('time');time.textContent=clipTime(item.time);
     button.append(type,title,time);list.append(button);
    }
   }
   function openMarker(key){
    const item=state.markers.find(x=>x.key===String(key));if(!item)return false;
    const player=root.VC_SMART_VIDEO_CORE;
    if(typeof player?.playKey==='function')return player.playKey(item.key);
    if(typeof root.v780Select==='function')root.v780Select(item.key);
    if(!root.v780Diagnostics?.().videoLoaded){feedback('Selecciona el archivo correspondiente antes de reproducir este momento.',true);return false}
    if(typeof root.v780OpenAt==='function')return root.v780OpenAt(item.time,item.key,{pre:0,post:5})!==false;
    feedback('La reproducción vinculada no está disponible.',true);return false;
   }
   function update(){
    const d=captureDiagnostics(),r=recordDiagnostics(),running=!!d.running,starting=!!d.starting||state.busy;
    const on=studio.dataset.vc183View==='delay'?'delay':'live';
    controls.querySelectorAll('[data-vc183-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc183View===on)));
    const put=(id,text)=>{const el=$(id);if(el&&el.textContent!==String(text))el.textContent=String(text)};
    put('vc183-capture-state',running?'En directo':starting?'Conectando…':'Sin iniciar');
    const span=Number(d.buffered)||0,delay=Number(d.delaySeconds)||10;
    put('vc183-buffer-state',running?`${Math.round(span)} s disponibles · −${delay} s`:'Sin búfer');
    put('vc183-status',state.screen==='biblioteca'?'Videoteca local':state.screen==='clips'?'Clips Studio':state.screen==='revision'?'Revisión de vídeo':running?'Cámara activa':starting?'Conectando cámara':'Cámara detenida');
    studio.dataset.vc183Capturing=String(running||r.active||r.stopping);
    $('vc183-start').disabled=running||starting;$('vc183-stop').disabled=!running&&!starting||r.active||r.stopping;
    const originalRecStart=$('vc-rec34-strip-start'),originalRecStop=$('vc-rec34-strip-stop');
    $('vc183-rec-start').disabled=!originalRecStart||originalRecStart.disabled;
    $('vc183-rec-stop').disabled=!originalRecStop||originalRecStop.disabled;
    $('vc183-add-marker').disabled=!r.active;
    put('vc183-rec-status',r.active?(r.paused?'REC en pausa':'● Grabando'):(r.stopping?'Guardando archivo…':'REC detenido'));
    $('vc183-start').textContent=starting?'Conectando…':'▶ Iniciar Live + Delay';
    const source=$('vc183-source-select');source.disabled=running||starting;
    if(!source.disabled){const original=$('live-delay-source')?.value||'local';if(source.value!==original)source.value=original}
    for(const b of controls.querySelectorAll('[data-vc183-seconds]'))b.setAttribute('aria-pressed',String(Number(b.dataset.vc183Seconds)===delay));
    state.updates++;
   }
   function extraAction(kind){
    if(kind==='return'){if(!captureDiagnostics().running){feedback('Inicia la cámara compartida para utilizar Delay.',true);return false}root.liveDelayReturn?.();return cameraView('delay')}
    if(kind==='configure'){if(typeof root.v117ReviewConfigureLive==='function')return root.v117ReviewConfigureLive();feedback('La configuración original no está disponible.',true);return false}
    if(kind==='recordings')return setScreen('biblioteca');
    if(kind==='refresh-library'){void root.VC17_VIDEO_UNIFIED?.openLibrary?.();return true}
    if(kind==='open-library-file'){setScreen('revision');return extraAction('file')}
    if(kind==='go-clips')return setScreen('clips');
    if(kind==='file'){const input=$('v780-file');if(!input){feedback('No está disponible el selector de vídeo.',true);return false}input.click();return true}
    if(kind==='youtube'){if(ctx()==='entrenamiento'){feedback('En entrenamientos utiliza un archivo local o una grabación propia.',true);return false}if(typeof root.v782OpenYouTubeDialog==='function'){root.v782OpenYouTubeDialog();return true}feedback('No está disponible YouTube en esta vista.',true);return false}
    if(kind==='filters'){const panel=$('vc181-filters');if(panel){panel.open=true;panel.scrollIntoView?.({block:'nearest'});return true}return false}
    if(kind==='sync'){const btn=$('vc1611-open');if(btn){btn.click();return true}const panel=$('vc181-filters');if(panel){panel.open=true;return true}return false}
    if(kind==='back-review')return setScreen('revision');
    if(kind==='export'){const el=$('vc-clip33-csv');if(el&&ctx()!=='entrenamiento'){el.click();return true}feedback('Para entrenamientos usa «Exportar JSON» en el editor de clips.',true);return false}
    return false;
   }
   menu.addEventListener('click',event=>{const b=event.target.closest('[data-vc183-screen]');if(b) setScreen(b.dataset.vc183Screen)});
   controls.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.vc183View){cameraView(b.dataset.vc183View);return}
    if(b.dataset.vc183Seconds){delaySeconds(b.dataset.vc183Seconds);return}
    if(b.id==='vc183-start'){void startCamera();return}
    if(b.id==='vc183-stop'){stopCamera();return}
    if(b.id==='vc183-rec-start'){$('vc-rec34-strip-start')?.click();update();return}
    if(b.id==='vc183-rec-stop'){$('vc-rec34-strip-stop')?.click();update();return}
    if(b.id==='vc183-add-marker'){
     const label=ctx()==='entrenamiento'?'Ejercicio de entrenamiento':'Momento de partido';
     if(typeof root.vcRecordingAddMarker==='function')root.vcRecordingAddMarker(label);
     else feedback('El grabador no permite marcar el momento.',true);
     return;
    }
    if(b.dataset.vc183Action)extraAction(b.dataset.vc183Action);
   });
   header.addEventListener('click',event=>{const b=event.target.closest('[data-vc183-action]');if(b)extraAction(b.dataset.vc183Action)});
   clipsHead.addEventListener('click',event=>{const b=event.target.closest('[data-vc183-action]');if(b)extraAction(b.dataset.vc183Action)});
   libraryHead.addEventListener('click',event=>{const b=event.target.closest('[data-vc183-action]');if(b)extraAction(b.dataset.vc183Action)});
   timeline.addEventListener('click',event=>{const b=event.target.closest('[data-vc183-key]');if(b)openMarker(b.dataset.vc183Key)});
   $('vc183-mark-filter')?.addEventListener('change',drawTimeline);
   // V18.1 transport and older Clip Studio shortcuts must open the dedicated screen.
   studio.addEventListener('click',event=>{
    const b=event.target.closest('[data-vc181-action="clip"],[data-vc181-action="clips"]');
    if(b){event.preventDefault();event.stopImmediatePropagation();setScreen('clips')}
   },true);
   // Existing context tabs remain functional; refresh the dedicated clip screen.
   if(root.MutationObserver)new root.MutationObserver(()=>{
    studio.dataset.vc183Training=String(ctx()==='entrenamiento');
    if(state.screen==='clips'){const h=clipsHead.querySelector('h3');h.textContent=ctx()==='entrenamiento'?'Clips de entrenamiento · A/B':'Clips Studio · Partido'}
    update();
   }).observe(studio,{attributes:true,attributeFilter:['data-vc181-context']});
   $('v780-match')?.addEventListener('change',()=>{if(state.screen!=='camara')drawTimeline()});
   const player=$('v780-player-video');if(player){for(const e of ['loadedmetadata','durationchange'])player.addEventListener(e,()=>{if(state.screen!=='camara')drawTimeline()})}
   root.setInterval?.(()=>{if(!doc.hidden&&studio.classList.contains('active'))update()},2500);
   studio.classList.add('vc183-ready');studio.dataset.vc183View=currentSource()==='delay'?'delay':'live';
   const loaded=!!root.v780Diagnostics?.().videoLoaded;state.screen=(loaded&&['local','youtube'].includes(currentSource()))?'revision':'camara';
   setScreen(state.screen);
   root.VC_VIDEO_WORKSPACES_1830={version:VERSION,setScreen,cameraView,delaySeconds,startCamera,stopCamera,drawTimeline,diagnostics:()=>({version:VERSION,screen:state.screen,linkedCapture:!!captureDiagnostics().running,view:studio.dataset.vc183View,originalVideoCount:studio.querySelectorAll('#v780-player-video').length,originalLiveCount:studio.querySelectorAll('#v117-review-stream').length,libraryCount:studio.querySelectorAll('#vc17100-library').length,clipStudioCount:studio.querySelectorAll('#vc-clip33').length,trainingEditorCount:studio.querySelectorAll('#vc17110-panel').length,markers:state.markers.length,recorderReplaced:false,cloudSyncModified:false,lastError:state.lastError})};
   return true;
  }
  let attempts=0;
  function bootstrap(){if(start())return;if(++attempts<48)root.setTimeout?.(bootstrap,250);}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();return true;
 }
 return {VERSION,SCREENS,validScreen,clipTime,normalizeMarkers,mount};
});
