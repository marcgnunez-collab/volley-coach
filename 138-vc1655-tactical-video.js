/* Volley Coach V16.5.5 · Tactical Video Integration.
 * Read-only tactical selection. Reparents the ONE existing V7.8 video frame;
 * never constructs video/iframe elements or changes any cloud/scouting engine.
 * Explicit clip saves use the existing Video Engine only on a user click. */
(()=>{
 'use strict';
 if(window.VC_TACTICAL_VIDEO_1655)return;
 const $=id=>document.getElementById(id);
 let dock=null,rail=null,studio=null,analysis=null,videoHub=null,frame=null,homeMarker=null,homeParent=null;
 let inspectorObserver=null,contentObserver=null,navObserver=null,studioObserver=null;
 let selected=[],currentIndex=-1,active=false,mounted=false,lastMatch='',lastSignature='',playCalls=0,clipCalls=0,portalMoves=0;
 const status=(message,kind='info')=>{const el=$('vc1655-status');if(el){el.textContent=message;el.dataset.kind=kind}};
 const currentMatch=()=>String(window.VC_ANALYST_STUDIO_16155?.videoSelection?.().matchId||'');
 const selectedMatch=()=>String($('v780-match')?.value||'');
 const videoReady=()=>{
  const diag=window.v780Diagnostics?.();
  return !!diag?.videoLoaded&&String(diag.match)===currentMatch()&&selectedMatch()===currentMatch();
 };
 function readSelection(){
  const raw=window.VC_ANALYST_STUDIO_16155?.videoSelection?.();
  if(!raw||!Array.isArray(raw.selected))return [];
  return raw.selected.filter(x=>x&&x.key).map(x=>({key:String(x.key),video:!!x.video,code:String(x.code||''),player:String(x.player||''),set:x.set,rally:x.rally}));
 }
 function isLab(){
  return !!(analysis?.classList.contains('active')&&studio&&!studio.hidden&&
   $('vc157-studio')&&window.VC_ANALYST_STUDIO_16155?.videoSelection?.().page==='lab'&&
   window.VC_ANALYST_STUDIO_16155?.videoSelection?.().subpage==='workbench'&&
   !!studio.querySelector('.vc1651-workbench'));
 }
 function restore(){
  if(!homeMarker||!frame||frame.parentElement!==$('vc1655-frame-slot'))return;
  // Restoring the original video node keeps native video/YouTube controls unique.
  if(homeMarker.parentNode)homeMarker.parentNode.replaceChild(frame,homeMarker);
  else homeParent?.appendChild(frame);
  portalMoves++;
 }
 function show(){
  if(!frame||!dock)return;
  const slot=$('vc1655-frame-slot');if(!slot||frame.parentElement===slot)return;
  if(!homeParent){homeParent=frame.parentNode;homeMarker=document.createComment('Video original · slot V7.8');}
  if(homeMarker.parentNode)homeMarker.remove();
  frame.parentNode?.insertBefore(homeMarker,frame);
  slot.appendChild(frame);
  portalMoves++;
 }
 function textFor(row){return `Set ${row.set||'—'} · ${row.player||'Jugador'} · ${row.code||'Acción'}`}
 function renderQueue(){
  const rows=readSelection(),id=currentMatch(),signature=id+'|'+rows.map(x=>x.key+(x.video?'1':'0')).join('|');
  if(signature===lastSignature)return;
  lastSignature=signature;lastMatch=id;selected=rows.filter(x=>x.video);
  if(currentIndex>=selected.length||currentIndex<0||!selected.some(x=>x.key===selected[currentIndex]?.key))currentIndex=selected.length?0:-1;
  const count=$('vc1655-count'),list=$('vc1655-queue');if(count)count.textContent=`${selected.length} con vídeo / ${rows.length} acciones`;
  if(!list)return;
  list.replaceChildren();
  for(let i=0;i<Math.min(selected.length,75);i++){
   const a=selected[i],btn=document.createElement('button');btn.type='button';btn.className='vc1655-queue-item';btn.dataset.vc1655Key=a.key;btn.setAttribute('aria-current',String(i===currentIndex));
   const title=document.createElement('strong');title.textContent=textFor(a);
   const more=document.createElement('small');more.textContent=`Rally ${a.rally||'—'} · ${i+1}/${selected.length}`;
   btn.append(title,more);list.append(btn);
  }
  if(selected.length>75){const p=document.createElement('p');p.className='vc1655-muted';p.textContent='Se muestran 75 jugadas. La playlist utiliza toda la selección.';list.append(p)}
  for(const id of ['vc1655-play','vc1655-playlist','vc1655-save']){const btn=$(id);if(btn)btn.disabled=!selected.length}
  if(!rows.length)status('Selecciona un filtro, flecha o estadística. Todavía no hay jugadas.');
  else if(!selected.length)status(`${rows.length} acciones sin marca temporal de vídeo. Sincroniza primero el vídeo.`, 'warn');
  else status(`${selected.length} acciones vinculadas. Selecciona una para reproducirla.`);
 }
 function refreshStatus(){
  if(!active)return;
  const name=$('vc1655-linked');if(name){const id=selectedMatch();name.textContent=id&&id===currentMatch()?'Partido vinculado':'Vídeo de otro partido / sin vincular';}
  const loaded=$('vc1655-loaded');if(loaded)loaded.textContent=videoReady()?'Vídeo cargado':'Carga el vídeo del partido';
  const good=videoReady();for(const id of ['vc1655-play','vc1655-playlist']){const b=$(id);if(b)b.disabled=!selected.length||!good}
  const save=$('vc1655-save');if(save)save.disabled=!selected.length||!good;
 }
 function sync(){
  if(!mounted)return;
  const should=isLab();
  if(should){active=true;dock.hidden=false;studio.dataset.vc1655Video='true';show();renderQueue();refreshStatus()}
  else {active=false;dock.hidden=true;studio?.removeAttribute('data-vc1655-video');restore()}
 }
 function linkMatch(){
  const id=currentMatch();if(!id){status('Selecciona primero un scouting.', 'warn');return false}
  const select=$('v780-match');if(!select){status('El selector de vídeo original no está disponible.', 'warn');return false}
  if(![...select.options].some(o=>o.value===id))window.v780Open?.();
  if(![...select.options].some(o=>o.value===id)){status('Este scouting no aparece en Video Studio. Revisa el equipo.', 'warn');return false}
  if(select.value!==id){select.value=id;window.v780MatchChanged?.()} // Explicit action. May release previous video source.
  else window.v780Open?.();
  refreshStatus();
  status(videoReady()?'Partido vinculado y vídeo preparado.':'Partido vinculado. Carga su vídeo en Video Studio si todavía no está disponible.');
  return true;
 }
 function safePlayback(){if(!active)return false;
  if(!currentMatch()||selectedMatch()!==currentMatch()){status('El vídeo corresponde a otro partido. Pulsa «Vincular scouting» antes de reproducir.', 'warn');return false}
  if(!videoReady()){status('Carga y sincroniza primero el archivo, la grabación o el vídeo del partido.','warn');return false}
  return true;
 }
 function play(key){
  if(!safePlayback())return false;
  const i=selected.findIndex(x=>x.key===String(key));if(i<0){status('Esta acción no pertenece a la selección actual.','warn');return false}
  const ok=window.VC_SMART_VIDEO_CORE?.playKey?.(String(key));
  if(ok!==true){status('La acción no tiene un intervalo reproducible. Revisa la sincronización temporal.','warn');return false}
  currentIndex=i;playCalls++;
  $('vc1655-queue')?.querySelectorAll('[data-vc1655-key]').forEach(node=>node.setAttribute('aria-current',String(node.dataset.vc1655Key===key)));
  status(`Reproduciendo ${i+1}/${selected.length}: ${textFor(selected[i])}`,'ok');return true;
 }
 function playCurrent(){return currentIndex>=0?play(selected[currentIndex].key):false}
 function next(delta){if(!selected.length)return false;currentIndex=(currentIndex+delta+selected.length)%selected.length;return playCurrent()}
 function playlist(){if(!safePlayback()||!selected.length)return false;
  const ok=window.VC_V159_VIDEO_ENGINE?.playlist?.(selected.map(x=>x.key),'Laboratorio táctico');
  status(ok?`Playlist de ${selected.length} acciones iniciada.`:'La playlist no pudo iniciarse; comprueba los tiempos del vídeo.',ok?'ok':'warn');return !!ok;
 }
 function saveClips(){if(!safePlayback()||!selected.length)return 0;
  const api=window.VC_V159_VIDEO_ENGINE;
  if(typeof api?.clips!=='function'){status('Clip Studio no está disponible.','warn');return 0}
  const n=api.clips(selected.map(x=>x.key));clipCalls++;
  status(n?`${n} clips añadidos al catálogo original. Los duplicados se omiten.`:'No se han añadido clips nuevos. Comprueba tiempos o duplicados.',n?'ok':'warn');return n;
 }
 function goVideo(){restore();window.v11Navigate?.('video');window.vc58SetVideoTab?.('analysis');window.v780Open?.()}
 function make(){
  analysis=$('scout-analysis');videoHub=$('scout-video-hub');studio=$('vc157-studio');
  const columns=studio?.querySelector('.vc157-columns'),inspector=columns?.querySelector('.vc157-inspector');
  frame=$('v780-video-frame');
  if(!analysis||!videoHub||!studio||!columns||!inspector||!frame)return false;
  const style=document.createElement('style');style.id='vc1655-video-style';style.textContent=`
 #vc157-studio .vc1655-sidebar{min-width:0;display:grid;align-content:start;gap:13px}
 #vc157-studio .vc1655-dock{min-width:0;padding:13px;background:#fff;border:1px solid #cfdfea;border-radius:14px;box-shadow:0 4px 16px #18344f0d}
 #vc157-studio .vc1655-head{display:flex;align-items:start;justify-content:space-between;gap:8px;margin-bottom:9px}
 #vc157-studio .vc1655-head strong{font-size:14px;color:#17466a}
 #vc157-studio .vc1655-head small{display:block;color:#6a879c;font-size:10px}
 #vc157-studio .vc1655-head .vc1655-chip{background:#eaf5fc;border-radius:8px;color:#23618b;padding:5px 7px;font-weight:850;font-size:9px;white-space:nowrap}
 #vc157-studio #vc1655-frame-slot .v780-video-frame{aspect-ratio:16/9;min-height:170px;max-height:400px;width:100%;border-radius:9px;background:#050e16;overflow:hidden}
 #vc157-studio #vc1655-frame-slot .v780-video-frame video{width:100%;height:100%;object-fit:contain}
 #vc157-studio #vc1655-frame-slot .v782-youtube-wrap{position:absolute;inset:0}
 #vc157-studio .vc1655-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
 #vc157-studio .vc1655-toolbar button,#vc157-studio .vc1655-actions button,#vc157-studio .vc1655-head button{border:1px solid #c7dce9!important;border-radius:8px!important;background:#edf6fc!important;color:#1c5a83!important;min-height:36px!important;padding:7px 10px!important;font:800 11px system-ui!important;cursor:pointer}
 #vc157-studio .vc1655-toolbar button:disabled,#vc157-studio .vc1655-actions button:disabled{opacity:.42;cursor:not-allowed!important}
 #vc157-studio .vc1655-toolbar button.vc1655-main{background:#1b669d!important;color:#fff!important;border-color:#1b669d!important}
 #vc157-studio .vc1655-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
 #vc157-studio .vc1655-actions #vc1655-playlist{grid-column:1/-1}
 #vc157-studio .vc1655-statusline{display:flex;justify-content:space-between;gap:7px;flex-wrap:wrap;font-size:10px;font-weight:750;color:#577b95}
 #vc157-studio #vc1655-status{font-size:11px;margin:7px 0;padding:9px;border:1px solid #dce9f1;background:#f6fafd;color:#53728a;border-radius:8px}
 #vc157-studio #vc1655-status[data-kind=warn]{background:#fff6ee;color:#8b6027;border-color:#efd9be}
 #vc157-studio #vc1655-status[data-kind=ok]{background:#eff8f4;color:#27654f}
 #vc157-studio .vc1655-queue{max-height:210px;overflow:auto;display:grid;gap:5px;margin-top:6px}
 #vc157-studio .vc1655-queue-item{display:grid;text-align:left!important;border:1px solid #dce7ef!important;border-radius:8px!important;background:#f7fafd!important;padding:8px!important;min-height:43px!important;color:#345d78!important}
 #vc157-studio .vc1655-queue-item[aria-current=true]{border-color:#3580ad!important;background:#eaf5fc!important}
 #vc157-studio .vc1655-queue-item strong{font-size:10px}#vc157-studio .vc1655-queue-item small{font-size:9px;color:#6d8ba0}
 #vc157-studio .vc1655-muted{font-size:10px;color:#768c9d}
 #vc157-studio[data-vc1655-video=true] .vc157-columns{grid-template-columns:minmax(0,1fr) minmax(350px,41%)}
 #vc157-studio[data-vc1655-video=true] .vc1655-sidebar{position:sticky;top:64px;max-height:calc(100vh - 78px);overflow:auto;overscroll-behavior:contain}
 #vc157-studio[data-vc1655-video=true] .vc157-inspector{position:static;max-height:none;overflow:visible}
 #vc157-studio .vc1655-dock[hidden]{display:none!important}
 @media(max-width:1250px){#vc157-studio[data-vc1655-video=true] .vc157-columns{grid-template-columns:minmax(0,1fr)}#vc157-studio[data-vc1655-video=true] .vc1655-sidebar{position:static;max-height:none;overflow:visible}}
 `;document.head.appendChild(style);
  rail=document.createElement('div');rail.className='vc1655-sidebar';
  dock=document.createElement('section');dock.className='vc1655-dock';dock.id='vc1655-video-dock';dock.setAttribute('aria-label','Reproductor táctico integrado');dock.hidden=true;
  dock.innerHTML=`<div class="vc1655-head"><div><small>TACTICAL VIDEO · V16.5.5</small><strong>Vídeo del Laboratorio</strong></div><span class="vc1655-chip">Reproductor original</span></div>
 <div class="vc1655-statusline"><span id="vc1655-linked">Sin partido vinculado</span><span id="vc1655-loaded">Vídeo no cargado</span></div><div id="vc1655-frame-slot"></div>
 <div class="vc1655-toolbar"><button id="vc1655-prev" type="button" title="Jugada anterior">← Anterior</button><button id="vc1655-play" class="vc1655-main" type="button">▶ Jugada</button><button id="vc1655-next" type="button" title="Siguiente jugada">Siguiente →</button><button id="vc1655-back8" type="button">−8 s</button><button id="vc1655-forward5" type="button">+5 s</button></div>
 <div class="vc1655-actions"><button type="button" id="vc1655-bind">Vincular scouting</button><button type="button" id="vc1655-open-studio">Abrir Video Studio</button><button type="button" id="vc1655-playlist">▶ Playlist filtrada</button><button type="button" id="vc1655-save">＋ Guardar clips filtrados</button></div>
 <p id="vc1655-status" role="status" aria-live="polite">Selecciona una jugada para reproducirla.</p><div class="vc1655-head"><strong>Jugadas seleccionadas</strong><span id="vc1655-count" class="vc1655-chip">0</span></div><div id="vc1655-queue" class="vc1655-queue" aria-label="Jugadas con vídeo disponibles"></div>
 <p class="vc1655-muted">Se utiliza el mismo archivo o transmisión de Video Studio. La selección y los filtros no modifican el scouting. Guardar clips sí añade referencias al catálogo.</p>`;
  columns.insertBefore(rail,inspector);rail.append(dock,inspector);
  homeParent=frame.parentNode;homeMarker=document.createComment('Video original · slot V7.8');
  dock.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.vc1655Key){play(b.dataset.vc1655Key);return}
   switch(b.id){
    case 'vc1655-prev':next(-1);break;
    case 'vc1655-play':playCurrent();break;
    case 'vc1655-next':next(1);break;
    case 'vc1655-back8':if(safePlayback())window.v780Jump?.(-8);break;
    case 'vc1655-forward5':if(safePlayback())window.v780Jump?.(5);break;
    case 'vc1655-bind':linkMatch();break;
    case 'vc1655-open-studio':goVideo();break;
    case 'vc1655-playlist':playlist();break;
    case 'vc1655-save':saveClips();break;
   }
  });
  // Keep the existing analysis inspector's buttons inside the Lab. Do not call
  // the legacy openKeys handler, which navigates away from the lab page.
  analysis.addEventListener('click',e=>{
   if(!active)return;
   const btn=e.target.closest('#vc157-inspector-content [data-vc1622-clip], #vc157-video');
   if(!btn)return;
   e.preventDefault();e.stopPropagation();
   if(btn.id==='vc157-video'){playCurrent();return}
   let key='';try{key=decodeURIComponent(btn.dataset.vc1622Clip||'')}catch(_){return}
   play(key);
  },true);
  contentObserver=new MutationObserver(()=>sync());contentObserver.observe($('vc157-content'),{childList:true});
  inspectorObserver=new MutationObserver(()=>renderQueue());inspectorObserver.observe($('vc157-inspector-content'),{childList:true});
  navObserver=new MutationObserver(()=>sync());navObserver.observe(analysis,{attributes:true,attributeFilter:['class']});
  studioObserver=new MutationObserver(()=>sync());studioObserver.observe(studio,{attributes:true,attributeFilter:['hidden']});
  mounted=true;sync();return true;
 }
 function wait(){
  if(make())return;
  const analysis=$('scout-analysis');if(!analysis)return;
  const obs=new MutationObserver(()=>{if(make())obs.disconnect()});obs.observe(analysis,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else wait();
 window.VC_TACTICAL_VIDEO_1655={version:'16.5.5',sync,play,playlist,restore,diagnostics:()=>({mounted,active,match:lastMatch,videoMatch:selectedMatch(),available:selected.length,playerCount:document.querySelectorAll('#v780-player-video').length,frameCount:document.querySelectorAll('#v780-video-frame').length,atDock:frame?.parentElement?.id==='vc1655-frame-slot',portalMoves,playCalls,clipCalls})};
})();
