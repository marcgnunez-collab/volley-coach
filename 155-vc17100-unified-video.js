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
   setContext(kind);
   if(feature==='delay'||feature==='record'){
    if(typeof root.openLiveDelay!=='function'){setFeedback('El motor Live/Delay no está disponible.',true);return false;}
    root.openLiveDelay(kind==='training'?'training':'scouting');
    if(feature==='record')setFeedback('Inicia la cámara y pulsa «Iniciar REC» en el panel de grabación. No se empieza a grabar automáticamente.');
    return true;
   }
   const ok=navigate('scout-video-hub');
   if(!ok){setFeedback('No se pudo abrir Vídeo Pro.',true);return false;}
   if(kind==='training')root.VC_VIDEO_STUDIO_1642?.setMode?.('capture');
   if(feature==='library')void openLibrary();
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
