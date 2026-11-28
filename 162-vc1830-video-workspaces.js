/* VC20715_BUNDLE: preserved original deferred scripts; keep execution order. */
/* VC20715_SOURCE_BEGIN:155-vc17100-unified-video.js */
/* Volley Coach V17.10 · Unified Video Workspace
 * One set of existing camera/Delay/REC engines, opened in two contexts.
 * Navigation and library display only; no extra MediaRecorder, media stream,
 * automatic cloud video upload, or direct modification of scouting/training data.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.10.0';
const TRAINING_VIEWS=new Set(['entrenamiento','planificacion','ejercicios','historial','estadisticas']);
const MATCH_VIEWS=new Set(['scout-dashboard','competicion','scout-plan','scout-match-mode','scout-workspace-v900','vc155-bench']);
function normalizeKind(value){return value==='training'?'training':'matches';}
function classifyRecording(record){return record?.training?'training':record?.match?'matches':'unlinked';}
function filterRecordings(items,kind){return (Array.isArray(items)?items:[]).filter(r=>kind==='training'?classifyRecording(r)!=='matches':classifyRecording(r)==='matches');}
function trainingSnapshot(doc){
 const $=id=>doc.getElementById(id),clean=s=>String(s??'').replace(/\s+/g,' ').trim().slice(0,180);
 return {
  team:clean($('team-active-name')?.textContent||$('v11-team-name')?.textContent)||'Equipo activo',
  date:clean($('sesion-fecha')?.value)||new Date().toISOString().slice(0,10),
  objective:clean($('sesion-objetivo')?.value)||'Sin objetivo especificado',
  exerciseCount:clean($('num-ejercicios')?.textContent)||'',
  sessionReference:'draft-on-device'
 };
}
function displaySize(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n>1048576?(n/1048576).toFixed(1)+' MB':Math.ceil(n/1024)+' KB':'—';}
function displayDuration(v){let n=Math.max(0,Math.floor((Number(v)||0)/1000));return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(x=>String(x).padStart(2,'0')).join(':');}
function displayDate(v){const d=new Date(v);return Number.isNaN(d.valueOf())?'Fecha no registrada':d.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});}
const STYLE=`
body.vc17-shell .vc17100-nav-tools{border-top:1px solid #294669;margin-top:16px;padding:12px 6px 4px;display:grid;gap:3px}
body.vc17-shell #v11-sidebar .vc17100-nav-tools button{border:0!important;background:transparent!important;color:#bed0e4!important;padding:9px 12px!important;min-height:35px!important;text-align:left!important;border-radius:8px!important;box-shadow:none!important;font-size:11px!important;font-weight:700!important}
body.vc17-shell #v11-sidebar .vc17100-nav-tools button:hover{background:#1b426a!important;color:#fff!important}
.vc17100-dock{margin:0 13px 12px;background:#f4f9fe;border:1px solid #d5e5f4;border-radius:12px;padding:12px;display:grid;gap:9px;font:500 12px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;min-width:0}
.vc17100-dock-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.vc17100-dock-head strong{color:#123b64;font-size:13px;font-weight:850}.vc17100-dock-head small{display:block;font-size:10px;color:#6e8399}
.vc17100-dock-actions{display:flex;gap:7px;flex-wrap:wrap}.vc17100-dock button,.vc17100-banner button{width:auto!important;min-height:37px!important;padding:8px 12px!important;border:1px solid #cbdced!important;border-radius:9px!important;background:#fff!important;color:#1a5489!important;box-shadow:none!important;font:750 11px/1.3 system-ui,sans-serif!important;letter-spacing:normal!important;white-space:normal!important;cursor:pointer}
.vc17100-dock button.vc17100-main,.vc17100-banner button.vc17100-main{background:#14568f!important;border-color:#14568f!important;color:white!important}
.vc17100-dock button:focus-visible,.vc17100-banner button:focus-visible{outline:3px solid #61b0fb!important;outline-offset:2px}
.vc17100-dock .vc17100-note{font-size:10px;color:#59748d;line-height:1.45}
#vc17100-video-banner{display:grid;gap:11px;padding:14px;background:#f0f7ff;border:1px solid #cbdff4;border-radius:12px;min-width:0}
#vc17100-video-banner .vc17100-banner-head{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
#vc17100-video-banner .vc17100-banner-head small{font-size:9px;letter-spacing:.08em;font-weight:850;color:#457bb0}
#vc17100-video-banner .vc17100-banner-head strong{display:block;font-size:16px;color:#103c66;margin-top:3px}
#vc17100-video-banner .vc17100-caption{font-size:11px;line-height:1.45;color:#52708e}
#vc17100-video-banner .vc17100-banner-actions{display:flex;gap:7px;flex-wrap:wrap}
#vc17100-video-banner .vc17100-record-state{font-size:10px;font-weight:800;border-radius:8px;padding:6px 9px;background:#fff;border:1px solid #d5e6f5;color:#45677f}
#vc17100-video-banner .vc17100-record-state[data-recording="true"]{border-color:#e1a5a8;background:#fff1f1;color:#a42935}
#vc17100-video-banner #vc17100-feedback{margin:0;color:#4d728f;font-size:10px;line-height:1.45}
#vc17100-video-banner #vc17100-feedback[data-error="1"]{color:#9c3535}
#vc17100-library{border-top:1px solid #d2e3f1;padding-top:10px;display:grid;gap:8px}#vc17100-library[hidden]{display:none!important}
#vc17100-library-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:7px}#vc17100-library-head strong{font-size:12px;color:#164d7c}
#vc17100-library-list{display:grid;gap:7px;max-height:350px;overflow:auto}
.vc17100-recording{background:#fff;border:1px solid #d9e5ef;border-radius:9px;padding:10px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.vc17100-recording .vc17100-meta{min-width:0;display:grid;gap:4px;overflow-wrap:anywhere}.vc17100-recording .vc17100-meta strong{font-size:12px;color:#1c4268}.vc17100-recording .vc17100-meta span{font-size:10px;color:#607e98}
.vc17100-recording .vc17100-recording-actions{display:flex;gap:5px;flex-wrap:wrap}.vc17100-empty{background:#fff;padding:13px;border:1px dashed #bed5e9;border-radius:8px;font-size:11px;color:#648197}
body.vc17100-training-video #scout-video-hub .vc1751-desk,body.vc17100-training-video #scout-video-hub .vc58-context-bar,body.vc17100-training-video #scout-video-hub .v780-toolbar,body.vc17100-training-video #scout-video-hub .v780-status-grid,body.vc17100-training-video #scout-video-hub .v781-set-map-panel,body.vc17100-training-video #scout-video-hub .vc58-analysis-heading,body.vc17100-training-video #scout-video-hub .v780-timeline-panel,body.vc17100-training-video #scout-video-hub .v780-side,body.vc17100-training-video #scout-video-hub .vc-clip33,body.vc17100-training-video #scout-video-hub .vc1642-modes button:not([data-vc1642-mode="capture"]),body.vc17100-training-video #scout-video-hub .vc1642-actions [data-vc1642-action="recordings"],body.vc17100-training-video #scout-video-hub .vc1642-actions [data-vc1642-action="file"],body.vc17100-training-video #scout-video-hub .vc1642-actions [data-vc1642-action="youtube"]{display:none!important}
body.vc17100-training-video #scout-video-hub .vc1642-modes{grid-template-columns:minmax(0,1fr)!important}
body.vc17100-training-video #scout-video-hub .v780-main{grid-template-columns:minmax(0,1fr)!important}
body.vc17100-training-video #scout-video-hub .v780-play-controls,body.vc17100-training-video #scout-video-hub #vc-review-pro-bar{display:none!important}
body.vc17100-training-video #scout-video-hub .v780-hero p{display:none!important}
@media(max-width:630px){.vc17100-dock{margin:0 6px 9px;padding:10px}.vc17100-dock-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.vc17100-dock-actions button{min-width:0!important;padding:9px 5px!important}#vc17100-video-banner{padding:10px}#vc17100-video-banner .vc17100-banner-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}#vc17100-video-banner .vc17100-banner-actions button{padding:8px 5px!important}.vc17100-recording{align-items:stretch;flex-direction:column}}
`;
function mount(root){
 const doc=root.document;if(!doc)return false;
 const start=()=>{
  if(root.VC17_VIDEO_UNIFIED?.version===VERSION)return;
  const $=id=>doc.getElementById(id);
  const studio=$('scout-video-hub'),command=$('vc1642-command');
  const training=$('vc1710-workspace'),matches=$('vc1720-workspace');
  if(!studio||!command||!training||!matches)return false;
  const css=doc.createElement('style');css.id='vc17100-video-css';css.textContent=STYLE;doc.head.appendChild(css);
  const state={kind:normalizeKind(root.VC17_VIDEO_CONTEXT?.kind),libraryOpen:false,libraryBusy:false,recCount:0,lastError:''};
  const activeView=()=>doc.querySelector('.view.active')?.id||'dashboard';
  const getKind=()=>normalizeKind(root.VC17_VIDEO_CONTEXT?.kind||state.kind);
  function recordContext(){const active=activeView();const kind=TRAINING_VIEWS.has(active)?'training':MATCH_VIEWS.has(active)?'matches':getKind();return{kind,training:kind==='training'?trainingSnapshot(doc):null};}
  const setFeedback=(message,error=false)=>{const e=$('vc17100-feedback');if(e){e.textContent=message;e.dataset.error=error?'1':'0'}state.lastError=error?message:''};
  const navigate=view=>{if(root.VC17_WORKSPACE?.route)return root.VC17_WORKSPACE.route(view,view==='scout-video-hub'?getKind():undefined);if(typeof root.showView!=='function')return false;root.showView(view,root.botonVista?.(view)||null);return true};
  function setContext(kind){
   const next=normalizeKind(kind);
   // The currently running recording is tagged using the snapshot created at REC start.
   state.kind=next;root.VC17_VIDEO_CONTEXT={kind:next};
   doc.body.classList.toggle('vc17100-training-video',next==='training'&&activeView()==='scout-video-hub');
   updateContext();return next;
  }
  function open(kind='matches',feature='studio'){
   if(recordingStatus()&&getKind()!==normalizeKind(kind)){
    setFeedback('Finaliza y exporta la grabación actual antes de cambiar entre partido y entrenamiento.',true);return false;
   }
   // All entry points go through the same Video Studio: no more bypass to the
   // historical separate Live/Delay window when a coach chooses the shortcut.
   setContext(kind);
   const ok=navigate('scout-video-hub');
   if(!ok){setFeedback('No se pudo abrir Vídeo Pro.',true);return false;}
   const target=kind==='training'?'entrenamiento':'partido';
   if(root.VC_VIDEO_STUDIO_1810?.diagnostics?.().context!==target){
    root.VC_VIDEO_STUDIO_1810?.setContext?.(target);
   }
   const workspaces=root.VC_VIDEO_WORKSPACES_1830;
   if(feature==='library'){
    if(typeof workspaces?.setScreen==='function')workspaces.setScreen('biblioteca');
    else void openLibrary();
   }else if(feature==='delay'||feature==='record'){
    if(typeof workspaces?.setScreen==='function')workspaces.setScreen('camara');
    else root.VC_VIDEO_STUDIO_1810?.setTab?.('delay');
    if(feature==='record')setFeedback('Conecta la cámara y pulsa «Iniciar REC»; la grabación nunca comienza automáticamente.');
   }
   return true;
  }
  function recordingStatus(){let d={};try{d=root.vcRecordingDiagnostics?.()||{}}catch(_){}return !!d.active;}
  function updateContext(){
   const inStudio=activeView()==='scout-video-hub',kind=getKind();
   doc.body.classList.toggle('vc17100-training-video',inStudio&&kind==='training');
   const title=$('vc17100-title'),desc=$('vc17100-description'),status=$('vc17100-record-state');
   if(title)title.textContent=kind==='training'?'Vídeo de entrenamiento':'Vídeo de partido';
   if(desc)desc.textContent=kind==='training'?`Sesión: ${trainingSnapshot(doc).team} · ${trainingSnapshot(doc).date}. Cámara y Delay independientes del scouting. Las grabaciones se identifican con la sesión actual.`:'Cámara, grabación y revisión del partido seleccionado. La transmisión desde otro móvil requiere una conexión de vídeo activa.';
   if(status){const active=recordingStatus();status.dataset.recording=String(active);status.textContent=active?'REC activo · guardado local':'REC detenido';}
   const dockCount=doc.querySelectorAll('[data-vc17100-recording]');dockCount.forEach(e=>e.textContent=recordingStatus()?'● Grabando':'Cámara preparada');
   const back=$('vc17100-back');if(back)back.textContent=kind==='training'?'Volver a Entrenamientos':'Volver a Partidos';
  }
  const button=(label,kind,feature,main=false)=>`<button type="button" data-vc17100-kind="${kind}" data-vc17100-action="${feature}"${main?' class="vc17100-main"':''}>${label}</button>`;
  const trainingDock=doc.createElement('section');trainingDock.id='vc17100-training-dock';trainingDock.className='vc17100-dock';trainingDock.setAttribute('aria-label','Vídeo en entrenamientos');
  trainingDock.innerHTML=`<div class="vc17100-dock-head"><div><strong>Vídeo para esta sesión</strong><small>Live · Delay · REC · Grabaciones locales</small></div><small data-vc17100-recording>Cámara preparada</small></div><div class="vc17100-dock-actions">${button('Abrir Vídeo Pro','training','studio',true)}${button('Cámara y Delay','training','delay')}${button('Grabar entrenamiento','training','record')}${button('Videoteca de sesiones','training','library')}</div><div class="vc17100-note">Elige el ejercicio en la sesión. El vídeo se graba en el dispositivo, no en la nube. Al empezar REC se captura el equipo, fecha y objetivo actual.</div>`;
  training.insertBefore(trainingDock,training.querySelector('.vc1710-notice')||null);
  const matchDock=doc.createElement('section');matchDock.id='vc17100-match-dock';matchDock.className='vc17100-dock';matchDock.setAttribute('aria-label','Vídeo en partidos');
  matchDock.innerHTML=`<div class="vc17100-dock-head"><div><strong>Vídeo del partido</strong><small>Captura · Live/Delay · Revisión · Clips</small></div><small data-vc17100-recording>Cámara preparada</small></div><div class="vc17100-dock-actions">${button('Abrir Vídeo Pro','matches','studio',true)}${button('Cámara y Delay','matches','delay')}${button('Grabar partido','matches','record')}${button('Grabaciones del partido','matches','library')}</div><div class="vc17100-note">Si grabas con el móvil, conserva el vídeo original en ese dispositivo. La sincronización de scouting y la transmisión de vídeo son conexiones independientes.</div>`;
  matches.insertBefore(matchDock,matches.querySelector('.vc1720-related')||null);
  const banner=doc.createElement('section');banner.id='vc17100-video-banner';banner.setAttribute('aria-label','Vídeo contextual');
  banner.innerHTML=`<div class="vc17100-banner-head"><div><small>V17.10 · VÍDEO COMPARTIDO</small><strong id="vc17100-title">Vídeo de partido</strong></div><span id="vc17100-record-state" class="vc17100-record-state">REC detenido</span></div><span id="vc17100-description" class="vc17100-caption"></span><div class="vc17100-banner-actions"><button type="button" id="vc17100-back" data-vc17100-action="back">Volver a Partidos</button><button type="button" data-vc17100-action="delay">Abrir Live / Delay</button><button type="button" data-vc17100-action="record" class="vc17100-main">Grabar</button><button type="button" data-vc17100-action="library">Videoteca</button><button type="button" data-vc17100-action="marker">Marcar momento REC</button></div><p id="vc17100-feedback" aria-live="polite">Selecciona una fuente; el acceso a la cámara requiere tu permiso.</p><div id="vc17100-library" hidden><div id="vc17100-library-head"><strong>Grabaciones de este dispositivo</strong><button type="button" data-vc17100-action="library-close">Cerrar biblioteca</button></div><p id="vc17100-library-info" class="vc17100-caption">Sin consultar</p><div id="vc17100-library-list"></div></div>`;
  command.prepend(banner);
  function createRow(record){
   const item=doc.createElement('article');item.className='vc17100-recording';
   const meta=doc.createElement('div');meta.className='vc17100-meta';
   const name=doc.createElement('strong');name.textContent=record.filename||'Grabación sin nombre';
   const info=doc.createElement('span');info.textContent=[displayDate(record.startedAt),displayDuration(record.durationMs),displaySize(record.bytes),record.completed?'Finalizada':'Incompleta'].join(' · ');
   const origin=doc.createElement('span');origin.textContent=record.training?`Entrenamiento · ${record.training.team||'Equipo'} · ${record.training.date||'Sin fecha'}`:record.match?`Partido · ${record.match.opponent||'Rival'}`:'Sin vincular (grabación antigua)';
   meta.append(name,info,origin);const actions=doc.createElement('div');actions.className='vc17100-recording-actions';
   const actionsFor=[['export','Exportar vídeo'],['metadata','Marcadores JSON']];
   if(record.match)actionsFor.unshift(['open','Revisar partido']);
   for(const [type,label] of actionsFor){const btn=doc.createElement('button');btn.type='button';btn.dataset.vc17100Action='record-'+type;btn.dataset.vc17100Id=String(record.id);btn.textContent=label;actions.append(btn)}
   item.append(meta,actions);return item;
  }
  async function openLibrary(){
   const wrap=$('vc17100-library'),list=$('vc17100-library-list'),info=$('vc17100-library-info');
   if(!wrap||!list||!info)return false;
   wrap.hidden=false;state.libraryOpen=true;info.textContent='Consultando la biblioteca local…';list.replaceChildren();
   const api=root.VC_RECORDING_PRO;
   if(typeof api?.list!=='function'){info.textContent='Biblioteca de grabaciones todavía no disponible.';return false;}
   if(state.libraryBusy)return false;state.libraryBusy=true;
   try{
    const records=filterRecordings(await api.list(),getKind()).sort((a,b)=>String(b.startedAt||'').localeCompare(String(a.startedAt||''))).slice(0,60);
    if(!state.libraryOpen)return false;
    state.recCount=records.length;
    info.textContent=`${records.length} grabaciones ${getKind()==='training'?'de entrenamiento o antiguas sin asociar':'vinculadas a partidos'} · Los vídeos no se sincronizan automáticamente entre dispositivos.`;
    list.replaceChildren(...(records.length?records.map(createRow):[]));
    if(!records.length){const empty=doc.createElement('div');empty.className='vc17100-empty';empty.textContent='No hay grabaciones en este dispositivo para este apartado.';list.append(empty)}
    return true;
   }catch(err){info.textContent='No se pudo leer la biblioteca local: '+String(err?.message||err);return false}
   finally{state.libraryBusy=false}
  }
  function marker(){
   if(!recordingStatus()){setFeedback('Inicia una grabación antes de añadir un marcador.',true);return false;}
   const kind=getKind(),label=kind==='training'?`Entrenamiento · ${trainingSnapshot(doc).objective.slice(0,40)}`:'Momento del partido';
   const ok=typeof root.vcRecordingAddMarker==='function'?root.vcRecordingAddMarker(label):false;
   setFeedback(ok===false?'No se pudo añadir el marcador.':'Marcador enviado al motor de grabación.',ok===false);
   return ok!==false;
  }
  function action(which,kind,button){
   if(which==='back'){return navigate(getKind()==='training'?'entrenamiento':'scout-dashboard')}
   if(which==='library-close'){const l=$('vc17100-library');if(l)l.hidden=true;state.libraryOpen=false;return true}
   if(which==='marker')return marker();
   if(which==='record-export'||which==='record-metadata'||which==='record-open'){
    const id=button.dataset.vc17100Id;const api=root.VC_RECORDING_PRO;
    const fn=which==='record-export'?api?.export:which==='record-metadata'?api?.metadata:api?.openReview;
    if(typeof fn!=='function')return setFeedback('La acción no está disponible.',true);
    button.disabled=true;
    Promise.resolve().then(()=>fn(id)).then(()=>setFeedback(which==='record-export'?'Exportación solicitada. Para grabaciones en disco, abre el archivo guardado en el dispositivo.':which==='record-open'?'Abriendo grabación del partido.':'Metadatos solicitados.')).catch(e=>setFeedback('No se pudo completar: '+String(e?.message||e),true)).finally(()=>{button.disabled=false});
    return true;
   }
   const target=kind||getKind();
   if(which==='studio'||which==='delay'||which==='record'||which==='library')return open(target,which);
   return false;
  }
  doc.addEventListener('click',event=>{const btn=event.target.closest?.('[data-vc17100-action]');if(!btn||btn.disabled)return;action(btn.dataset.vc17100Action,btn.dataset.vc17100Kind,btn)});
  const observe=new root.MutationObserver(()=>{
   const current=activeView();
   if(TRAINING_VIEWS.has(current))setContext('training');
   else if(MATCH_VIEWS.has(current))setContext('matches');
   else if(current==='scout-video-hub'){state.kind=getKind();updateContext()}
  });
  [...TRAINING_VIEWS,...MATCH_VIEWS,'scout-video-hub'].forEach(id=>{if($(id))observe.observe($(id),{attributes:true,attributeFilter:['class']})});
  ['sesion-fecha','sesion-objetivo'].forEach(id=>$(id)?.addEventListener('change',updateContext));
  root.setInterval?.(()=>{if(!doc.hidden&&activeView()==='scout-video-hub')updateContext()},3000);
  updateContext();
  root.VC17_VIDEO_UNIFIED={version:VERSION,open,openLibrary,setContext,getKind,recordContext,diagnostics:()=>({version:VERSION,kind:getKind(),recording:recordingStatus(),libraryCount:state.recCount,libraryOpen:state.libraryOpen,videoPlayers:studio.querySelectorAll('#v780-player-video').length,videoStreams:studio.querySelectorAll('#v117-review-stream').length,writeEngineModified:false})};
  return true;
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 return true;
}
return{VERSION,TRAINING_VIEWS,MATCH_VIEWS,normalizeKind,classifyRecording,filterRecordings,trainingSnapshot,mount};
});

/* VC20715_SOURCE_END:155-vc17100-unified-video.js */

;
/* VC20715_SOURCE_BEGIN:156-vc17110-training-video-pro.js */
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

/* VC20715_SOURCE_END:156-vc17110-training-video-pro.js */

;
/* VC20715_SOURCE_BEGIN:157-vc17120-match-recording-pro.js */
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

/* VC20715_SOURCE_END:157-vc17120-match-recording-pro.js */

;
/* VC20715_SOURCE_BEGIN:158-vc17121-install-health.js */
/* Volley Coach V17.12.1 · Diagnóstico de publicación y sincronización, SOLO LECTURA.
   No solicita fusiones remotas, no modifica partidas, datos ni service worker. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.document)api.install(root);})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.12.1';
function moduleNames(scripts){return [...new Set(Array.from(scripts||[]).map(x=>{try{return new URL(x.src, 'https://app.example/').pathname.split('/').pop()}catch(_){return ''}}).filter(Boolean))];}
function syncStatus(win){let cloud={};try{cloud=win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};}catch(_){}
let protect=null;try{protect=win.VC_V179_SYNC_SAFETY?.diagnostics?.()||null}catch(_){}
return {online:!!win.navigator?.onLine,protectionLoaded:!!win.VC_V179_SYNC_SAFETY,cloudConnected:!!cloud.connected,dirty:!!cloud.dirty,syncing:!!cloud.syncing,lastWriteAt:cloud.lastWriteAt||null,lastReadAt:cloud.lastReadAt||null,lastSyncError:String(cloud.lastSyncError||''),protection:protect,warning:'Presencia de dispositivos y conexión NO confirman que el guardado se haya aplicado en otro dispositivo.'};}
async function verify(files,fetcher){const out=[];for(const file of files){try{const resp=await fetcher(file,{method:'GET',cache:'no-store'});out.push({file,ok:!!resp.ok,status:resp.status||0});}catch(e){out.push({file,ok:false,status:0,error:String(e?.message||e)})}}return out;}
function install(win){const doc=win.document;const id='vc17121-health';let modal=null,uiButton=null;
function el(tag,text){const x=doc.createElement(tag);if(text!=null)x.textContent=String(text);return x;}
function ensure(){if(modal)return modal;const style=el('style');style.textContent=`#${id}[hidden]{display:none!important}#${id}{position:fixed;inset:0;z-index:70000;background:#071a2fbd;display:grid;place-items:center;padding:12px;font:13px/1.5 system-ui;color:#193e5e}#${id} .vc-health-card{background:white;width:min(740px,100%);max-height:92vh;overflow:auto;padding:20px;border-radius:14px}#${id} h2{font:800 21px system-ui;margin:0 0 6px}#${id} p{font:12px/1.55 system-ui;margin:6px 0 12px}#${id} button{cursor:pointer;border:1px solid #bed3e2;border-radius:7px;background:#eef6fc;color:#174e7f;padding:8px 10px;font:700 12px system-ui;min-height:36px}#${id} .vchead{display:flex;justify-content:space-between;align-items:center;gap:10px}#${id} pre{background:#f4f8fc;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;border-radius:9px;font:12px/1.65 ui-monospace,monospace}#${id} .vc-actions{display:flex;gap:7px;flex-wrap:wrap}#${id} .vc-warning{background:#fff7eb;padding:10px;border-radius:7px;color:#7b4d20}`;doc.head.appendChild(style);
modal=el('div');modal.id=id;modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');const card=el('section');card.className='vc-health-card';const head=el('div');head.className='vchead';head.append(el('h2','Diagnóstico de instalación y nube'));const close=el('button','Cerrar');close.type='button';close.onclick=()=>modal.hidden=true;head.append(close);
const desc=el('p','Comprueba los módulos publicados sin borrar datos ni iniciar sincronización. Si hay nube pendiente, descarga primero una copia JSON desde «Dispositivos y nube».');const warning=el('p','Este diagnóstico NO garantiza que dos dispositivos estén sincronizados. Una comprobación remota necesita probar ambas pantallas con datos de ensayo.');warning.className='vc-warning';const output=el('pre','Pulsa «Comprobar archivos» para consultar la publicación.');output.id='vc17121-result';output.setAttribute('role','status');const actions=el('div');actions.className='vc-actions';const check=el('button','Comprobar archivos'),copy=el('button','Copiar diagnóstico');check.type=copy.type='button';actions.append(check,copy);card.append(head,desc,warning,actions,output);modal.append(card);doc.body.append(modal);
const dump=()=>{const loaded=Array.from(doc.querySelectorAll('script[data-vc-module][src]'));return {version:VERSION,url:win.location?.href||'',missingDuringLoad:moduleNames((win.VC_MODULE_LOAD_ERRORS||[]).map(src=>({src}))),modulesDeclared:loaded.length,modulesUnique:moduleNames(loaded).length,sync:syncStatus(win)}};
copy.onclick=()=>{const data=JSON.stringify({...dump(),files:lastCheck},null,2);if(win.navigator?.clipboard?.writeText){win.navigator.clipboard.writeText(data).then(()=>output.textContent+='\nDiagnóstico copiado.').catch(()=>output.textContent+='\nCopia manualmente este resultado.')}else output.textContent=data};
let lastCheck=[];
check.onclick=async()=>{check.disabled=true;output.textContent='Comprobando los archivos publicados…';const scripts=Array.from(doc.querySelectorAll('script[data-vc-module][src]'));const files=[...new Set(scripts.map(s=>s.src))];const checked=[];for(let i=0;i<files.length;i+=6){const part=await Promise.all(files.slice(i,i+6).map(async url=>{try{const response=await win.fetch(url,{cache:'no-store'});return {file:new URL(url).pathname.split('/').pop(),status:response.status,ok:response.ok}}catch(e){return {file:new URL(url).pathname.split('/').pop(),status:0,ok:false,error:String(e?.message||e)}}}));checked.push(...part);output.textContent=`Comprobados ${checked.length}/${files.length}…`;}lastCheck=checked;const bad=checked.filter(x=>!x.ok);output.textContent=JSON.stringify({...dump(),filesChecked:checked.length,failed:bad.length,failedFiles:bad},null,2);check.disabled=false;};
return modal;}
function attach(){const foot=doc.querySelector('#vc16040-sync-modal .vc16040-foot');if(!foot)return false;if(!uiButton){uiButton=el('button','Diagnóstico de instalación');uiButton.id='vc17121-open';uiButton.type='button';uiButton.onclick=()=>{ensure().hidden=false;const result=doc.getElementById('vc17121-result');result.textContent=JSON.stringify({version:VERSION,sync:syncStatus(win),failedScripts:moduleNames((win.VC_MODULE_LOAD_ERRORS||[]).map(src=>({src})))},null,2);}}if(!uiButton.isConnected)foot.append(uiButton);return true;}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{if(attach())return;const ob=new win.MutationObserver(()=>{if(attach())ob.disconnect()});ob.observe(doc.body,{childList:true,subtree:true})},{once:true});else if(!attach()){const ob=new win.MutationObserver(()=>{if(attach())ob.disconnect()});ob.observe(doc.body,{childList:true,subtree:true})}
win.VC17121_HEALTH={version:VERSION,open:()=>{ensure().hidden=false},status:()=>syncStatus(win)};
}
return {version:VERSION,moduleNames,syncStatus,verify,install};
});

/* VC20715_SOURCE_END:158-vc17121-install-health.js */

;
/* VC20715_SOURCE_BEGIN:159-vc1800-cross-video-evidence.js */
/* Volley Coach V18.0 · Evidencia exacta desde Cruces Pro.
   Solo lectura: usa el modelo oficial V16.1.4 y el buscador de vídeo V15.9;
   no altera rallies, puntuaciones, PDFs, nube ni fuentes de grabación. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root&&root.document)api.mount(root)})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.0.0',arr=x=>Array.isArray(x)?x:[],str=x=>String(x??'').trim();
const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function recClass(ev){return ['#','+'].includes(ev)?'Positiva (# / +)':ev==='!'?'Neutra (!)':['-','/','='].includes(ev)?'Negativa (-, /, =)':'Sin valorar';}
function zone(x){const v=str(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return v?`${v[1]}${v[2]||''}`:'';}
function getEvidence(model,tab,label){if(!model)return [];
 const related=[];const push=x=>{if(x?.key&&!related.some(a=>a.key===x.key))related.push({key:x.key,player:x.player||'',skill:x.skill||'',set:x.set||x.r?.set||'',label:x.code||x.player||x.skill||'Acción'})};
 if(tab==='setters'){
  for(const pair of arr(model.pairs))if(pair.attack&&`${str(pair.set?.player)||'Sin identificar'} → ${str(pair.attack?.player)||'Sin identificar'}`===label)push(pair.attack);
 }else if(tab==='receives'){
  for(const chain of arr(model.chains))if(recClass(chain.rec?.ev)===label)push(chain.rec);
 }else if(tab==='rotations'){
  const n=Number(label.replace(/^R/i,''));if(Number.isInteger(n)&&n>=1&&n<=6)for(const rally of arr(model.rallies))if((model.target==='opponent'?rally.opponentRotation:rally.rotation)===n&&rally.winning){const key=`r:${rally.set}:${rally.id}`;if(!related.some(r=>r.key===key))related.push({key,set:rally.set,player:'',skill:'',label:`Rally ${rally.index}`})}
 }else if(tab==='routes'){
  for(const attack of arr(model.attacks))if(`${zone(attack.a?.startZone)} → ${zone(attack.a?.endZone)}`===label&&zone(attack.a?.startZone)&&zone(attack.a?.endZone))push(attack);
 }else if(tab==='players'){
  for(const action of arr(model.actions))if(action.player===label)push(action);
 }
 return related;
}
function dataForSelected(win){const $=id=>win.document.getElementById(id),id=str($('vc157-match')?.value),intel=win.VC_ANALYSIS_INTELLIGENCE_1614,video=win.VC_V159_STATS_VIDEO;let match=null,bridge=win.VC_SCOUT_VIDEO_BRIDGE||win.VC_SCOUT_REPORT_BRIDGE;
 try{for(const b of [win.VC_SCOUT_REPORT_BRIDGE,win.VC_SCOUT_VIDEO_BRIDGE]){const m=arr(b?.getMatches?.()).find(x=>String(x.id)===id);if(m){match=m;bridge=b}}}catch(_){}
 if(!match||!intel?.model||!video?.buildRows)return {error:'Selecciona un scouting válido y comprueba que Análisis Pro y Vídeo Review están cargados.'};
 const f={team:$('vc157-team')?.value==='opponent'?'opponent':'ours',set:$('vc157-set')?.value||'',rotation:$('vc157-rotation')?.value||'',phase:$('vc157-phase')?.value||''};
 let m=match;if(f.phase==='K1'||f.phase==='K2'){
  const serv=f.phase==='K1'?(f.team==='opponent'?'ours':'opponent'):(f.team==='opponent'?'opponent':'ours');m={...match,sets:arr(match.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===serv)}))};
 }
 return {match,f,model:intel.model(m,bridge,{team:f.team,set:f.set,rotation:f.rotation}),allVideoRows:video.buildRows([match])};
}
function selectedVideoRows(view,tab,label){const evidence=getEvidence(view.model,tab,label),byKey=new Map(view.allVideoRows.map(r=>[r.key,r]));return {total:evidence.length,found:evidence.map(x=>byKey.get(x.key)).filter(Boolean)};}
function mount(win){const doc=win.document,$=id=>doc.getElementById(id);let selected=null,currentRows=[],activeTab='',lastError='';
 const css=`#vc180-evidence{border:1px solid #c8dceb;background:#fff;border-radius:12px;padding:14px;margin-top:13px;display:grid;gap:10px}#vc180-evidence[hidden]{display:none!important}#vc180-evidence .vc180-title{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}#vc180-evidence h3{font:800 16px system-ui;margin:0!important}#vc180-evidence p{font:12px/1.5 system-ui;margin:4px 0;color:#4e6e86}#vc180-evidence .vc180-actions{display:flex;flex-wrap:wrap;gap:6px}#vc180-evidence button,.vc180-row-video{border:1px solid #b9cfe2!important;background:#eaf4fd!important;color:#155485!important;padding:7px 10px!important;border-radius:7px!important;font:750 11px system-ui!important;min-height:34px;cursor:pointer}#vc180-evidence button:focus-visible,.vc180-row-video:focus-visible{outline:2px solid #207cc9;outline-offset:2px}#vc180-evidence button:disabled{opacity:.5;cursor:default}#vc180-evidence .vc180-items{display:grid;gap:6px;max-height:300px;overflow-y:auto}#vc180-evidence .vc180-item{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #e1eaf2;border-radius:8px;padding:8px;min-width:0}#vc180-evidence .vc180-item p{margin:0;overflow-wrap:anywhere}#vc180-evidence .vc180-tag{font-size:10px;color:#6d8192}#vc180-evidence [role=status]{font-size:11px;color:#536d81}#vc1780-cross-panel .vc180-row-video{white-space:nowrap}#vc1780-cross-panel .vc180-video-td{min-width:118px}@media(max-width:590px){#vc180-evidence{padding:9px}#vc180-evidence .vc180-item{align-items:stretch;flex-direction:column}}`;
 function pane(){let panel=$('vc1780-cross-panel');if(!panel)return false;let evidence=$('vc180-evidence');if(!evidence){const sty=doc.createElement('style');sty.id='vc180-style';sty.textContent=css;doc.head.append(sty);evidence=doc.createElement('section');evidence.id='vc180-evidence';evidence.setAttribute('aria-label','Jugadas de vídeo vinculadas a Cruces Pro');evidence.innerHTML=`<div class="vc180-title"><div><h3>Jugadas relacionadas con el dato</h3><p id="vc180-description">Selecciona «Ver jugadas» en una fila de las estadísticas para buscar sus acciones originales.</p></div><div class="vc180-actions"><button type="button" id="vc180-playlist" disabled>▶ Reproducir selección</button><button type="button" id="vc180-clips" disabled>Guardar referencias de clips</button></div></div><div id="vc180-list" class="vc180-items"></div><p role="status" id="vc180-status">Sin selección. Los vídeos se abren únicamente si se conserva la fuente correspondiente.</p>`;panel.querySelector('[data-vc1780-body]')?.insertAdjacentElement('afterend',evidence);
 evidence.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;if(btn.dataset.vc180Key){const view=dataForSelected(win);if(view.error){say(view.error);return}const ok=win.VC_V159_STATS_VIDEO?.openKey?.(String(view.match.id),btn.dataset.vc180Key);if(!ok)say('Partido abierto. Si no se reproduce, selecciona y sincroniza su vídeo en Vídeo Review.');}if(btn.id==='vc180-playlist'){const view=dataForSelected(win);if(!view.error)win.VC_V159_STATS_VIDEO?.playKeys?.(String(view.match.id),currentRows.map(x=>x.key));}if(btn.id==='vc180-clips'){const view=dataForSelected(win);if(!view.error)win.VC_V159_STATS_VIDEO?.clipKeys?.(String(view.match.id),currentRows.map(x=>x.key));}});
 }
 const body=panel.querySelector('[data-vc1780-body]');if(body&&!body.__vc180Watch){body.__vc180Watch=true;const observer=new win.MutationObserver(()=>decorate());observer.observe(body,{childList:true,subtree:true});}decorate();return true;}
 function say(msg){const n=$('vc180-status');if(n)n.textContent=msg}
 function decorate(){const panel=$('vc1780-cross-panel');if(!panel||panel.hidden||panel.closest('[data-vc1780-view="cross"]')==null)return;const table=panel.querySelector('[data-vc1780-body] table');if(!table||table.dataset.vc180Ready==='1')return;const rows=Array.from(table.querySelectorAll('tbody tr'));if(!rows.length||rows[0].querySelector('.vc1780-empty'))return;table.dataset.vc180Ready='1';const thead=table.querySelector('thead tr'),th=doc.createElement('th');th.textContent='Vídeo';thead?.append(th);const tab=panel.querySelector('[data-vc1780-tab][aria-pressed="true"]')?.dataset.vc1780Tab||'setters';rows.forEach(tr=>{const label=str(tr.cells?.[0]?.textContent);if(!label)return;const td=doc.createElement('td');td.className='vc180-video-td';const btn=doc.createElement('button');btn.type='button';btn.className='vc180-row-video';btn.textContent='▶ Ver jugadas';btn.setAttribute('aria-label',`Buscar vídeo de ${label}`);btn.addEventListener('click',()=>select(tab,label));td.append(btn);tr.append(td);});}
 function select(tab,label){let view;try{view=dataForSelected(win)}catch(e){lastError=String(e.message||e);say('No se ha podido leer este scouting.');return}if(view.error){say(view.error);return}selected={tab,label,matchId:String(view.match.id)};activeTab=tab;const {total,found}=selectedVideoRows(view,tab,label);currentRows=found;const hasTime=x=>Number.isFinite(x?.time)&&x.time>=0;const timed=found.filter(hasTime).length;const desc=$('vc180-description');if(desc)desc.textContent=`${label} · ${total} acciones/rallies originales · ${timed} con referencia temporal.`;const list=$('vc180-list');if(list)list.innerHTML=found.length?found.slice(0,120).map((r,i)=>`<div class="vc180-item"><div><b>Set ${esc(r.set)} · ${esc(r.kind==='rally'?'Rally':r.player||'Acción')}</b><p>${esc(r.label)} · ${hasTime(r)?`${Number(r.time).toFixed(1)} s`:'Sin tiempo asociado'}</p></div><button type="button" data-vc180-key="${esc(r.key)}">▶ ${hasTime(r)?'Abrir vídeo':'Localizar'}</button></div>`).join(''):'<p>No hay acciones del scouting original relacionadas con esta fila.</p>';
 if(list&&found.length>120)list.insertAdjacentHTML('beforeend',`<p>Mostradas 120 de ${found.length} acciones. Filtra por set o rotación para acotar la búsqueda.</p>`);
 const pl=$('vc180-playlist'),cl=$('vc180-clips');if(pl)pl.disabled=!timed;if(cl)cl.disabled=!timed;say(`${found.length} coincidencias reales. ${found.length-timed} sin tiempo de vídeo. Las referencias sin tiempo se pueden localizar manualmente, pero no reproducir en el segundo exacto.`);
 $('vc180-evidence')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }
 function boot(){if(pane())return;const area=$('scout-analysis')||doc.body;const obs=new win.MutationObserver(()=>{if(pane())obs.disconnect()});obs.observe(area,{childList:true,subtree:true})}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 doc.addEventListener('change',e=>{if(selected&&['vc157-match','vc157-set','vc157-team','vc157-rotation','vc157-phase'].includes(e.target?.id)){currentRows=[];selected=null;const el=$('vc180-list');if(el)el.replaceChildren();const desc=$('vc180-description');if(desc)desc.textContent='Los filtros han cambiado. Elige una fila de nuevo.';for(const id of ['vc180-playlist','vc180-clips']){const b=$(id);if(b)b.disabled=true;}}},true);
 win.VC180_VIDEO_EVIDENCE={version:VERSION,select,diagnostics:()=>({tab:activeTab,selected:!!selected,results:currentRows.length,lastError,readOnly:true})};
 }
return{version:VERSION,recClass,zone,getEvidence,selectedVideoRows,mount};
});

/* VC20715_SOURCE_END:159-vc1800-cross-video-evidence.js */

;
/* VC20715_SOURCE_BEGIN:160-vc1810-video-studio-layout.js */
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
 const VERSION='18.4.3';
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
   if(!studio||!hub||!main||!$('v780-video-frame'))return false;
   const state={context:selectContext(root.VC17_VIDEO_UNIFIED?.getKind?.()),tab:'directo',wide:false,solo:false,updates:0,lastError:''};
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
    root.VC17_VIDEO_UNIFIED?.setContext?.(next==='entrenamiento'?'training':'matches');
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
     case 'recordings':root.VC17_VIDEO_UNIFIED?.openLibrary?.();return;
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
    const session=root.VC17_VIDEO_UNIFIED?.trainingSnapshot?.(doc)||{};
    const train=root.VC17_VIDEO_CONTEXT?.kind==='training'?(root.VC17_VIDEO_UNIFIED?.recordContext?.().training||{}):{};
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

/* VC20715_SOURCE_END:160-vc1810-video-studio-layout.js */

;
/* VC20715_SOURCE_BEGIN:161-vc1820-video-reliability.js */
/* Volley Coach V18.2.0 — Operative recording & delay safety dashboard.
   Presentation + explicit user controls over existing engines, NO new recorder,
   media streams, database schema, score changes or cloud writes. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.2.0';
 const MB=1024*1024;
 const safeNum=v=>v===null||v===undefined||v===''||typeof v==='boolean'?null:(Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null);
 const formatBytes=v=>{
  const n=safeNum(v);if(n===null)return 'No disponible';
  if(n<MB)return `${Math.round(n/1024)} KB`;
  if(n<1024*MB)return `${(n/MB).toFixed(1)} MB`;
  return `${(n/(1024*MB)).toFixed(2)} GB`;
 };
 function remainingMinutes(freeBytes,bitrate){
  const free=safeNum(freeBytes),rate=safeNum(bitrate);
  if(free===null||rate===null||rate===0)return null;
  // 20% margin for container, browser metadata and filesystem variability.
  return Math.floor((free*8)/(rate*1.2*60));
 }
 function recorderState(d={}){
  if(d.writeError||d.recorderError)return {level:'error',label:'Revisar grabación',detail:String(d.writeError||d.recorderError)};
  if(d.stopping)return {level:'wait',label:'Finalizando archivo',detail:'No cierres la pestaña hasta que termine.'};
  if(d.active&&d.paused)return {level:'wait',label:'REC en pausa',detail:'Los fragmentos confirmados continúan guardados.'};
  if(d.active&&Number(d.pendingWrites)>6)return {level:'wait',label:'REC · guardado retrasado',detail:'Hay varios fragmentos esperando escritura.'};
  if(d.active)return {level:'rec',label:'Grabando',detail:'Se está grabando desde LIVE, no desde Delay.'};
  return {level:'idle',label:'Grabación detenida',detail:'Inicia una fuente LIVE antes de grabar.'};
 }
 function delayState(d={}){
  if(d.error)return {level:'error',label:'Error de Delay',detail:String(d.error)};
  if(d.starting||d.recoveryInProgress)return {level:'wait',label:'Preparando señal',detail:'Esperando al motor de captura.'};
  if(!d.running)return {level:'idle',label:'Delay detenido',detail:'Se necesita una cámara o transmisión LIVE.'};
  const span=safeNum(d.buffered)||0,needed=(safeNum(d.delaySeconds)||10)+0.65;
  if(span<needed)return {level:'wait',label:'Preparando búfer',detail:`${span.toFixed(1)} s disponibles; objetivo de ${Math.round(needed)} s.`};
  if(Number(d.lastChunkAgeMs)>5000)return {level:'wait',label:'Señal de Delay inestable',detail:'No llegan nuevos fragmentos con regularidad.'};
  return {level:'ready',label:'Delay disponible',detail:`${span.toFixed(1)} s en búfer · ${safeNum(d.delaySeconds)||10} s configurados.`};
 }
 function storageState(info,bitrate){
  const free=info&&safeNum(info.quota)!==null&&safeNum(info.usage)!==null?Math.max(0,Number(info.quota)-Number(info.usage)):null;
  const mins=remainingMinutes(free,bitrate);
  const level=free===null?'unknown':free<150*MB?'error':free<500*MB?'warn':'ok';
  return {free,minutes:mins,level,text:free===null?'Cuota no disponible':`${formatBytes(free)} libres`,estimate:mins===null?'Duración desconocida':`≈ ${mins} min a la calidad elegida`};
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC_VIDEO_RELIABILITY_1820)return true;
   const $=id=>doc.getElementById(id),studio=$('scout-video-hub');
   if(!studio||!$('vc181-transport')||!root.VC_VIDEO_STUDIO_1810)return false;
   const panel=doc.createElement('section');panel.id='vc182-panel';panel.className='vc182-panel';
   panel.setAttribute('aria-label','Estado de grabación y Delay');
   panel.innerHTML=`<div class="vc182-heading"><div><span class="vc182-kicker">V18.2 · SEGURIDAD DE VÍDEO</span><h3>Grabación y Delay</h3><p>Estado real de este dispositivo. No representa una copia en la nube.</p></div><span id="vc182-health" class="vc182-pill" data-level="idle">Preparado</span></div>
    <div class="vc182-metrics">
      <div class="vc182-metric"><span>Grabación</span><strong id="vc182-rec-label">Comprobando…</strong><small id="vc182-rec-detail">—</small></div>
      <div class="vc182-metric"><span>Fragmentos confirmados</span><strong id="vc182-durable">—</strong><small id="vc182-pending">—</small></div>
      <div class="vc182-metric"><span>Delay / señal</span><strong id="vc182-delay-label">Comprobando…</strong><small id="vc182-delay-detail">—</small></div>
      <div class="vc182-metric"><span>Espacio disponible</span><strong id="vc182-space">Comprobando…</strong><small id="vc182-estimate">Estimación orientativa</small></div>
    </div>
    <div class="vc182-controls"><button type="button" data-vc182-action="pause" id="vc182-pause" disabled>Pausar grabación</button><button type="button" data-vc182-action="delay" id="vc182-return-delay" disabled>Volver al Delay</button><button type="button" data-vc182-action="recovery">Recuperar grabaciones</button><button type="button" data-vc182-action="settings">Ajustar grabación</button><button type="button" data-vc182-action="persist" id="vc182-persist">Proteger almacenamiento</button><button type="button" data-vc182-action="export">Exportar diagnóstico</button></div>
    <p id="vc182-alert" class="vc182-alert" aria-live="polite" data-level="info">Las grabaciones locales requieren conservar y exportar el archivo. La nube del scouting es independiente.</p>`;
   const videoPanel=studio.querySelector('.v780-video-panel');
   // Inside the original video column, below the existing transport (never reparent the player).
   const transport=$('vc181-transport');transport.insertAdjacentElement('afterend',panel);
   const state={storage:null,storageAt:0,refreshes:0,lastError:'',lastNotice:'',mountedAt:Date.now()};
   const put=(id,text)=>{const el=$(id);if(el&&el.textContent!==String(text))el.textContent=String(text)};
   const feedback=(text,level='info')=>{state.lastNotice=text;put('vc182-alert',text);$('vc182-alert').dataset.level=level};
   const getRec=()=>{try{return root.vcRecordingDiagnostics?.()||{}}catch(err){state.lastError=String(err);return {recorderError:state.lastError}}};
   const getDelay=()=>{try{return root.liveDelayDiagnostics?.()||{}}catch(err){state.lastError=String(err);return {error:state.lastError}}};
   async function checkStorage(force=false){
    if(!force&&Date.now()-state.storageAt<45000)return state.storage;
    state.storageAt=Date.now();
    try{state.storage=typeof root.navigator?.storage?.estimate==='function'?await root.navigator.storage.estimate():null}
    catch(err){state.storage=null;state.lastError=String(err)}
    return state.storage;
   }
   function refresh(){
    const rec=getRec(),del=getDelay(),r=recorderState(rec),d=delayState(del);
    const rate=Number(rec.active?rec.recordingBitrate:($('vc-rec34-bitrate')?.value||rec.recordingBitrate||3500000));
    const storage=storageState(state.storage,rate);
    const trouble=r.level==='error'||d.level==='error'||storage.level==='error';
    const warning=r.level==='wait'||d.level==='wait'||storage.level==='warn';
    const level=trouble?'error':warning?'wait':rec.active?'rec':'idle';
    put('vc182-health',trouble?'Atención necesaria':rec.active&&rec.paused?'REC EN PAUSA':rec.active?'● REC EN CURSO':warning?'Revisar estado':'Preparado');$('vc182-health').dataset.level=level;
    put('vc182-rec-label',r.label);put('vc182-rec-detail',r.detail);
    put('vc182-durable',formatBytes(rec.durableBytes));
    put('vc182-pending',rec.active?`${Number(rec.durableChunks)||0} fragmentos · ${Number(rec.pendingWrites)||0} pendientes`: 'Sin grabación en curso');
    put('vc182-delay-label',d.label);put('vc182-delay-detail',d.detail);
    put('vc182-space',storage.text);put('vc182-estimate',storage.estimate+' · aproximada');
    const pause=$('vc182-pause');pause.disabled=!rec.active||rec.stopping;put('vc182-pause',rec.paused?'Reanudar REC':'Pausar REC');
    const back=$('vc182-return-delay');back.disabled=!del.running;
    if(!state.lastNotice){
      if(r.level==='error')feedback(`Error de REC: ${r.detail}`,'error');
      else if(storage.level==='error')feedback('Espacio disponible muy bajo. Exporta las grabaciones y libera espacio antes de otra sesión.','warn');
      else if(del.running&&d.level==='wait')feedback(d.detail,'info');
    }
    state.refreshes++;return {rec,delay:del,storage};
   }
   async function action(name){
    const rec=getRec(),del=getDelay();
    if(name==='pause'){
      if(!rec.active||rec.stopping)return feedback('No hay una grabación que se pueda pausar.','warn');
      if(typeof root.vcRecordingTogglePause!=='function')return feedback('El control original de REC no está disponible.','error');
      root.vcRecordingTogglePause();feedback('Se ha enviado la orden al grabador. Verifica su nuevo estado.');refresh();return;
    }
    if(name==='delay'){
      if(!del.running||typeof root.liveDelayReturn!=='function')return feedback('El Delay no está activo. Inicia la cámara primero.','warn');
      root.liveDelayReturn();feedback('Vuelta a la reproducción diferida solicitada.');refresh();return;
    }
    if(name==='recovery'){
      if(typeof root.vcRecordingRecover!=='function')return feedback('El recuperador de grabaciones no está disponible.','error');
      await root.vcRecordingRecover();feedback('Se ha abierto la recuperación local. No borres sesiones sin exportarlas.');return;
    }
    if(name==='settings'){
      if(typeof root.openLiveDelay!=='function')return feedback('No se puede abrir la configuración de vídeo.','error');
      root.openLiveDelay();feedback('Comprueba fuente, calidad, modo de guardado y permisos de cámara.');return;
    }
    if(name==='persist'){
      const storageApi=root.navigator?.storage;
      if(typeof storageApi?.persist!=='function')return feedback('Este navegador no permite solicitar almacenamiento persistente. Exporta los vídeos después de cada sesión.','warn');
      try{const accepted=await storageApi.persist();feedback(accepted?'Almacenamiento persistente concedido; sigue siendo necesario exportar los vídeos.':'El navegador no ha concedido almacenamiento persistente. Exporta los vídeos a un archivo.',accepted?'info':'warn')}
      catch(err){state.lastError=String(err);feedback('No se pudo solicitar persistencia: '+String(err?.message||err),'error')}
      return;
    }
    if(name==='export'){
      const data={version:VERSION,capturedAt:new Date().toISOString(),recording:getRec(),delay:getDelay(),storage:state.storage?{usage:state.storage.usage??null,quota:state.storage.quota??null}:null,scope:'Diagnóstico local; no confirma sincronización en la nube'};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
      const url=root.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='Volley_Coach_V18.2_diagnostico_video.json';a.hidden=true;doc.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),3000);
      feedback('Informe de vídeo preparado. Puede incluir detalles del dispositivo o del partido.');return;
    }
   }
   panel.addEventListener('click',event=>{const b=event.target.closest?.('[data-vc182-action]');if(!b||b.disabled)return;Promise.resolve(action(b.dataset.vc182Action)).catch(err=>{state.lastError=String(err);feedback('Error: '+String(err?.message||err),'error')})});
   const timer=root.setInterval?.(()=>{if(doc.hidden||!studio.classList.contains('active'))return;void checkStorage().then(refresh)},4000);
   void checkStorage(true).then(refresh);
   root.VC_VIDEO_RELIABILITY_1820={version:VERSION,refresh:()=>checkStorage(true).then(refresh),diagnostics:()=>({version:VERSION,refreshes:state.refreshes,recording:getRec(),delay:getDelay(),storage:storageState(state.storage,Number(getRec().recordingBitrate)||3500000),uiOnly:true,modifiesSync:false,modifiesRecordingEngine:false}),destroy:()=>{if(timer)root.clearInterval(timer);panel.remove()}};
   return true;
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();return true;
 }
 return {VERSION,MB,formatBytes,remainingMinutes,recorderState,delayState,storageState,mount};
});

/* VC20715_SOURCE_END:161-vc1820-video-reliability.js */

;
/* VC20715_SOURCE_BEGIN:162-vc1830-video-workspaces.js */
/* Volley Coach V18.4.2 — Video Studio: cuatro espacios independientes, una captura compartida.
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
 const VERSION='18.4.3',SCREENS=['camara','revision','clips','biblioteca'];
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
   menu.innerHTML=`<div class="vc183-nav-caption">VIDEO STUDIO PRO · V18.4.3 · 4 ESPACIOS</div><nav aria-label="Áreas de Video Studio Pro">
     <button type="button" data-vc183-screen="camara" aria-current="page"><span class="vc183-nav-icon">◉</span><span><b>Cámara + Delay</b><small>Un origen · dos vistas</small></span></button>
     <button type="button" data-vc183-screen="revision"><span class="vc183-nav-icon">▶</span><span><b>Revisión</b><small>Vídeo y rallies</small></span></button>
     <button type="button" data-vc183-screen="clips"><span class="vc183-nav-icon">✂</span><span><b>Clips Studio</b><small>Editar y comparar</small></span></button>
     <button type="button" data-vc183-screen="biblioteca"><span class="vc183-nav-icon">▤</span><span><b>Videoteca</b><small>Grabaciones locales</small></span></button>
    </nav>`;
   chrome.appendChild(menu);
   const header=doc.createElement('section');header.id='vc183-screen-heading';header.className='vc183-screen-heading';
   header.innerHTML=`<div><span id="vc183-kicker">LIVE Y DELAY CONECTADOS</span><h3 id="vc183-heading">Cámara y revisión diferida</h3><p id="vc183-description">La misma captura alimenta el directo y el búfer de Delay. Cambia de vista sin reiniciar la cámara.</p></div><div class="vc183-heading-actions"><div class="vc183-heading-tools"><div id="vc183-match-slot" class="vc183-match-slot" aria-label="Partido seleccionado"></div><div id="vc183-review-actions" class="vc183-review-actions" aria-label="Fuentes para revisión"><button type="button" data-vc183-action="file">Abrir archivo</button><button type="button" data-vc183-action="recordings">Videoteca</button><button type="button" data-vc183-action="youtube">YouTube</button><button type="button" data-vc183-action="stats">Buscar jugadas</button><button type="button" data-vc183-action="filters">Filtros</button><button type="button" data-vc183-action="sync">Vincular tiempo</button><button type="button" data-vc183-action="go-clips">Abrir Clips</button></div></div><span class="vc183-view-status" id="vc183-status">Cámara detenida</span></div>`;
   hub.insertBefore(header,main);
   function placeMatchSelector(){
    const slot=$('vc183-match-slot');
    if(!slot)return false;
    const current=slot.querySelector('label');
    if(current&&current.contains($('v780-match')))return true;
    const preferred=doc.querySelector('.vc58-match-slot > label')||doc.querySelector('.v780-toolbar > label');
    if(preferred&&preferred.contains($('v780-match'))){slot.appendChild(preferred);return true}
    return false;
   }
   placeMatchSelector();
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
   // V18.4.2: the old stats finder must not render as a giant workspace before
   // the video player. Keep the original DOM/handlers, in a review-only drawer.
   const statsDrawer=doc.createElement('details');statsDrawer.id='vc1842-stats-drawer';statsDrawer.className='vc1842-stats-drawer';
   const statsSummary=doc.createElement('summary');statsSummary.textContent='Buscar jugadas por estadísticas · filtros avanzados';
   statsDrawer.append(statsSummary);timeline.insertAdjacentElement('afterend',statsDrawer);
   function attachStats(){
    const finder=$('vc159-studio');if(!finder)return false;
    if(finder.parentElement!==statsDrawer)statsDrawer.append(finder);
    return true;
   }
   attachStats();
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
   if(safety&&originalVideo){const detail=doc.createElement('details');detail.className='vc183-safety-details';detail.innerHTML='<summary>Estado avanzado de grabación y Delay</summary>';safety.before(detail);detail.append(safety);controls.append(detail);}
   // Advanced legacy controls stay mounted, but inside the Capture drawer rather
   // than appearing as a separate workspace under the video.
   const technicalTools=$('vc181-technical');if(technicalTools)controls.append(technicalTools);
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
    if(next==='revision'){attachStats();drawTimeline();}
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
    placeMatchSelector();attachStats();
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
    if(kind==='stats'){
     setScreen('revision');attachStats();statsDrawer.open=true;
     statsDrawer.scrollIntoView?.({block:'start',behavior:'smooth'});return true;
    }
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
   root.VC_VIDEO_WORKSPACES_1830={version:VERSION,setScreen,showStats:()=>extraAction('stats'),cameraView,delaySeconds,startCamera,stopCamera,drawTimeline,diagnostics:()=>({version:VERSION,screen:state.screen,linkedCapture:!!captureDiagnostics().running,view:studio.dataset.vc183View,originalVideoCount:studio.querySelectorAll('#v780-player-video').length,originalLiveCount:studio.querySelectorAll('#v117-review-stream').length,libraryCount:studio.querySelectorAll('#vc17100-library').length,clipStudioCount:studio.querySelectorAll('#vc-clip33').length,trainingEditorCount:studio.querySelectorAll('#vc17110-panel').length,markers:state.markers.length,recorderReplaced:false,cloudSyncModified:false,lastError:state.lastError})};
   return true;
  }
  let attempts=0;
  function bootstrap(){if(start())return;if(++attempts<48)root.setTimeout?.(bootstrap,250);}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();return true;
 }
 return {VERSION,SCREENS,validScreen,clipTime,normalizeMarkers,mount};
});

/* VC20715_SOURCE_END:162-vc1830-video-workspaces.js */
