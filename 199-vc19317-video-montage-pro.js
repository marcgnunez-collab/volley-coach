/* Volley Coach V19.3.17 · Video Montage Pro
 * Montages are lightweight metadata on the original match. ONE native Video
 * Review player and ONE underlying video source. No scores or scouting edits.
 * MediaRecorder output is a real-time, browser-dependent WebM file, not MP4.
 */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_VIDEO_MONTAGE_19317=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.17',MAX_SEGMENTS=120,MAX_MONTAGES=30,MAX_DURATION=600;
 const arr=x=>Array.isArray(x)?x:[], val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const finite=x=>x!==''&&x!=null&&Number.isFinite(Number(x))?Number(x):null;
 const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number(x)||0));
 const copy=x=>JSON.parse(JSON.stringify(x));
 const uniq=()=>`vm_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
 const mm=x=>Number.isFinite(Number(x))?`${Math.floor(Number(x)/60).toString().padStart(2,'0')}:${(Number(x)%60).toFixed(1).padStart(4,'0')}`:'—';
  function validateSegment(raw,limit=MAX_DURATION){
  const start=finite(raw?.start),end=finite(raw?.end),rate=Number(raw?.rate||1);
  if(start===null||end===null||start<0||end-start<.15||end-start>limit||![.5,1,1.5].includes(rate))return null;
  const shapes=arr(raw?.annotations).slice(0,50).map(validateShape).filter(Boolean);
  return {id:val(raw.id).slice(0,60)||uniq(),kind:['clip','rally','action'].includes(raw?.kind)?raw.kind:'clip',
   ref:val(raw?.ref).slice(0,250),label:val(raw?.label).slice(0,120)||'Jugada',start,end,rate,
   caption:val(raw?.caption).slice(0,180),annotations:shapes};
 }
 function validateShape(shape){
  if(!shape||!['line','arrow','rectangle','circle','pen','text'].includes(shape.kind))return null;
  const color=/^#[0-9a-f]{6}$/i.test(val(shape.color))?shape.color:'#ffae46';
  const points=arr(shape.points).slice(0,150).filter(x=>finite(x?.x)!==null&&finite(x?.y)!==null).map(x=>({x:clamp(x.x),y:clamp(x.y)}));
  if(shape.kind==='pen'&&points.length<2)return null;
  if(shape.kind!=='pen'&&points.length<1)return null;
  if(!['pen','text'].includes(shape.kind)&&points.length<2)return null;
  return {kind:shape.kind,color,points,text:val(shape.text).slice(0,180)};
 }
 function validateMontage(m){
  if(!m||!Array.isArray(m.segments))return null;
  const segments=m.segments.slice(0,MAX_SEGMENTS).map(x=>validateSegment(x)).filter(Boolean);
  return {id:val(m.id).slice(0,60)||uniq(),name:val(m.name).slice(0,100)||'Montaje sin título',
   createdAt:val(m.createdAt),updatedAt:val(m.updatedAt),segments};
 }
 function totalDuration(segments){return arr(segments).reduce((n,s)=>n+(s.end-s.start)/s.rate,0)}
 function rallyRef(r){return r?.nativeId==null?'':`r:${r.set}:${r.nativeId}`}
 function groupCatalog(win,match){
  const diag=win?.VC_SCOUT_CLIPS_PRO?.diagnostics?.()||{};
  if(String(diag.matchId)!==String(match?.id))return [];
  return arr(win?.VC_SCOUT_CLIPS_PRO?.available?.()).filter(x=>finite(x.start)!=null&&finite(x.end)!=null&&Number(x.end)>Number(x.start))
   .slice(0,350).map(x=>({label:val(x.name||x.label||x.sourceKey||x.id).slice(0,120),start:Number(x.start),end:Number(x.end),ref:x.virtual&&x.sourceKey?'a:'+String(x.sourceKey):'c:'+String(x.id),kind:x.virtual?'action':'clip',sourceKey:val(x.sourceKey),clipId:val(x.id)}));
 }
 function sourceForRally(win,r){const ref=rallyRef(r);if(!ref)return null;
  const range=win?.VC_VIDEO_REVIEW_API?.rangeForKey?.(ref);
  if(!range||finite(range.start)==null||finite(range.end)==null||range.end<=range.start)return null;
  return validateSegment({id:uniq(),kind:'rally',ref,label:`Set ${r.set} · Rally ${r.index}`,start:range.start,end:range.end,rate:1,caption:'',annotations:[]});
 }
 function sourceForClip(c){return validateSegment({id:uniq(),kind:c.kind,ref:c.ref,label:c.label,start:c.start,end:c.end,rate:1,caption:'',annotations:[]});}
 function resolvePlaylist(ref,catalog){return catalog.find(c=>ref?.kind==='action'?c.ref==='a:'+String(ref.key):ref?.kind==='clip'?c.ref==='c:'+String(ref.id):false)||null}
 function csvCell(x){let s=val(x);if(/^[\s\x00-\x1f]*[=+@\-]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
 function edlCSV(plan){const head=['Orden','Nombre','Tipo','Referencia','Inicio segundos','Final segundos','Velocidad','Texto','Dibujos'],rows=arr(plan?.segments).map((s,i)=>[i+1,s.label,s.kind,s.ref,s.start,s.end,s.rate,s.caption,arr(s.annotations).length]);return '\ufeff'+[head,...rows].map(r=>r.map(csvCell).join(';')).join('\r\n')}
 function drawShapes(ctx,shapes,w,h){
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  for(const s of arr(shapes)){
   const x=s.points?.[0];if(!x)continue;const X=x.x*w,Y=x.y*h,y=s.points?.[1];
   ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=Math.max(2.5,w/340);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=Math.max(1,w/350);
   if(s.kind==='text'){ctx.font=`bold ${Math.max(18,Math.round(w/34))}px sans-serif`;ctx.strokeStyle='#0c253d';ctx.lineWidth=Math.max(3,w/150);const lines=val(s.text).split(/\n/).slice(0,3);lines.forEach((t,i)=>{ctx.strokeText(t,X,Y+i*w/32,w*.75);ctx.fillText(t,X,Y+i*w/32,w*.75)});continue;}
   if(!y)continue;const x2=y.x*w,y2=y.y*h;ctx.beginPath();
   if(s.kind==='pen'){ctx.moveTo(X,Y);for(const p of s.points.slice(1))ctx.lineTo(p.x*w,p.y*h);}
   else if(s.kind==='rectangle')ctx.rect(Math.min(X,x2),Math.min(Y,y2),Math.abs(X-x2),Math.abs(Y-y2));
   else if(s.kind==='circle')ctx.ellipse((X+x2)/2,(Y+y2)/2,Math.max(1,Math.abs(x2-X)/2),Math.max(1,Math.abs(y2-Y)/2),0,0,Math.PI*2);
   else {ctx.moveTo(X,Y);ctx.lineTo(x2,y2)}ctx.stroke();
   if(s.kind==='arrow'){const angle=Math.atan2(y2-Y,x2-X),length=Math.max(13,w/44);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-length*Math.cos(angle-.55),y2-length*Math.sin(angle-.55));ctx.moveTo(x2,y2);ctx.lineTo(x2-length*Math.cos(angle+.55),y2-length*Math.sin(angle+.55));ctx.stroke();}
  }
  ctx.restore();
 }
 function drawCaption(ctx,text,w,h){const caption=val(text);if(!caption)return;
  ctx.save();ctx.font=`700 ${Math.max(17,w/34)}px sans-serif`;const pad=w*.027,bottom=h*.052,width=Math.min(w*.94,ctx.measureText(caption).width+2*pad);
  ctx.fillStyle='rgba(4,20,38,.75)';ctx.fillRect((w-width)/2,h-bottom-w*.06,width,w*.075);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(caption,w/2,h-bottom-w*.022,w*.90);ctx.restore();
 }
 function makeScreen(win,plan){return `<div class="vc19317-shell"><header class="vc19317-hero"><div><small>V${VERSION} · VIDEO MONTAGE PRO</small><h3>Montaje táctico y análisis en vídeo</h3><p>Organiza jugadas, anota el vídeo y exporta una composición real en WebM.</p></div><div class="vc19317-hero-actions"><button type="button" data-vc19317-act="load-file">Abrir archivo</button><button type="button" data-vc19317-act="recording">Abrir REC</button><button type="button" data-vc19317-act="video">Video Analysis</button></div></header>
  <div class="vc19317-columns"><div class="vc19317-main"><section class="vc19317-panel"><div class="vc19317-head"><b>REPRODUCTOR ORIGINAL · VIDEO REVIEW</b><span>Una sola fuente de vídeo</span></div><div id="vc19314-player-host" class="vc19314-player-host"></div><div id="vc19314-transport-host" class="vc19314-transport-host"></div><div class="vc19317-transport"><button data-vc19317-act="prev">◀ Clip anterior</button><button data-vc19317-act="preview">▶ Reproducir selección</button><button data-vc19317-act="play-all">▶ Montaje completo</button><button data-vc19317-act="stop">■ Detener</button><button data-vc19317-act="next">Siguiente ▶</button></div><p class="vc19317-note">Los dibujos se editan sobre este vídeo y se incrustan en la exportación WebM. Vídeos YouTube, LIVE y DELAY temporal no son exportables.</p></section>
  <section class="vc19317-panel"><div class="vc19317-head"><b>HERRAMIENTAS DE ANOTACIÓN</b><span>Por clip · coordenadas relativas</span></div><div class="vc19317-annotate"><label>Herramienta<select data-vc19317-input="tool"><option value="off">Solo reproducir</option><option value="arrow">Flecha</option><option value="line">Línea</option><option value="circle">Círculo</option><option value="rectangle">Rectángulo</option><option value="pen">Mano alzada</option><option value="text">Texto en pista</option></select></label><label>Color<input type="color" data-vc19317-input="color" value="#ffae46"/></label><label>Texto de dibujo<input maxlength="100" data-vc19317-input="draw-text" placeholder="Ej. Atención al bloqueo"/></label><button data-vc19317-act="undo">Deshacer trazo</button><button data-vc19317-act="clear-annotations">Limpiar dibujos</button></div><label class="vc19317-wide">Título / nota del clip<input maxlength="180" data-vc19317-input="caption" placeholder="Aparecerá sobre el vídeo exportado"/></label><p class="vc19317-note">Selecciona un clip y una herramienta para dibujar. Con “Solo reproducir”, la pista vuelve a responder al reproductor normal.</p></section>
  <section class="vc19317-panel"><div class="vc19317-head"><b>LÍNEA DE TIEMPO</b><span id="vc19317-total">0 clips</span></div><div id="vc19317-sequence" class="vc19317-sequence"></div><div class="vc19317-export"><button class="vc19317-primary" data-vc19317-act="export">Exportar montaje WebM</button><button data-vc19317-act="export-clip">Exportar clip seleccionado</button><button data-vc19317-act="export-json">Exportar montaje JSON</button><button data-vc19317-act="export-csv">Exportar EDL CSV</button><button data-vc19317-act="cancel-export">Cancelar exportación</button></div><p class="vc19317-note">WebM se genera en tiempo real desde un archivo o grabación local. Se respetan orden, cortes, velocidad, textos y dibujos; el sonido depende del soporte del navegador.</p></section></div>
  <aside class="vc19317-side"><section class="vc19317-panel"><div class="vc19317-head"><b>MIS MONTAJES</b><span id="vc19317-count">0 guardados</span></div><label>Nombre de nuevo montaje<input id="vc19317-new-name" maxlength="100" placeholder="Ej. Análisis rival · Set 3"/></label><button class="vc19317-primary" data-vc19317-act="create">＋ Nuevo montaje</button><div id="vc19317-library" class="vc19317-library"></div><div class="vc19317-nameedit"><label>Renombrar seleccionado<input id="vc19317-name" maxlength="100"/></label><button data-vc19317-act="rename">Guardar nombre</button><button data-vc19317-act="delete">Eliminar montaje</button></div></section>
  <section class="vc19317-panel"><div class="vc19317-head"><b>AÑADIR JUGADAS</b><span>Sin duplicar vídeo</span></div><div id="vc19317-sources"></div><button data-vc19317-act="add-rallies">Añadir rallies del filtro</button><label>Playlist existente<select id="vc19317-playlist"><option value="">Elegir playlist</option></select></label><button data-vc19317-act="import-playlist">Incorporar playlist</button><p class="vc19317-note">Se conservan las referencias originales a acciones y recortes. Los clips sin tiempo válido no se añaden.</p></section><section class="vc19317-panel"><div class="vc19317-head"><b>EDICIÓN DEL SEGMENTO</b></div><label>Inicio (s)<input type="number" min="0" step="0.1" data-vc19317-input="start"/></label><label>Final (s)<input type="number" min="0" step="0.1" data-vc19317-input="end"/></label><label>Velocidad<select data-vc19317-input="rate"><option value="0.5">0,5× lenta</option><option value="1">1× normal</option><option value="1.5">1,5× rápida</option></select></label><button data-vc19317-act="save-segment">Guardar intervalo y velocidad</button></section></aside></div><div class="vc19317-status" id="vc19317-status" role="status" aria-live="polite">Selecciona un partido, crea un montaje y carga el vídeo correspondiente.</div></div>`}
 const sessions=new WeakMap();
 function getState(win){let s=sessions.get(win);if(!s){s={id:'',matchId:'',segmentIndex:0,tool:'off',color:'#ffae46',drawText:'',pen:null,previewing:false,previewAll:false,exporting:false,exportAbort:false,exportRecorder:null,exportStream:null,frameId:0,mask:null,root:null,source:null,busy:false,selectedSource:'',saveFailed:false};sessions.set(win,s)}return s}
 const media=win=>win?.document?.getElementById('v780-player-video');
 const bridge=win=>win?.VC_SCOUT_VIDEO_BRIDGE||{};
 const getList=m=>arr(m?.videoMontages).map(validateMontage).filter(Boolean);
 const selected=(s,m)=>getList(m).find(x=>x.id===s.id)||null;
 function contextOk(win,s){return s.root?.isConnected&&s.matchId&&String(win.document.getElementById('v780-match')?.value)===String(s.matchId)}
 function status(s,msg,error=false){const el=s.root?.querySelector('#vc19317-status');if(el){el.textContent=msg;el.dataset.error=error?'1':'0'}}
 async function commit(win,s,fn){
  const match=s.source?.match;if(!match||s.busy||s.exporting||!contextOk(win,s))return false;s.saveFailed=false;
  const current=arr(bridge(win).getMatches?.()).find(x=>String(x.id)===s.matchId);
  if(current&&current!==match){status(s,'El partido cambió desde que abriste el montaje. Actualiza Análisis antes de guardar.',true);return false;}
  const old=match.videoMontages==null?null:copy(match.videoMontages),previousUpdated=match.updatedAt,next=old==null?[]:copy(old);
  if(fn(next)===false)return false;
  if(next.length>MAX_MONTAGES)return false;
  s.busy=true;
  try{
   const save=bridge(win).save;if(typeof save!=='function')throw Error('Guardado de partidos no disponible');
   match.videoMontages=next;match.updatedAt=new Date().toISOString();const result=save();
   if(result===false)throw Error('El guardado de partido devolvió un error');
   if(result&&typeof result.then==='function')await result;
   if(!contextOk(win,s))return false;
   s.busy=false;return true;
  }catch(err){
   if(match.videoMontages===next){if(old===null)delete match.videoMontages;else match.videoMontages=old;match.updatedAt=previousUpdated;}
   s.saveFailed=true;status(s,'No se guardó el montaje: '+val(err.message||err),true);return false;
  }finally{s.busy=false;}
 }
 function download(win,data,name,mime){const blob=data instanceof win.Blob?data:new win.Blob([data],{type:mime});const url=win.URL.createObjectURL(blob),a=win.document.createElement('a');a.href=url;a.download=name;win.document.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),5000);}
 function safeName(s){return val(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,48)||'montaje'}
 function previewOverlay(win,s){const v=media(win),can=s.mask;if(!v||!can)return;
  const dpr=Math.min(2,win.devicePixelRatio||1),box=can.getBoundingClientRect();if(box.width<1||box.height<1)return;
  const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));if(can.width!==w||can.height!==h){can.width=w;can.height=h;}
  const ctx=can.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,w,h);
  const seg=selected(s,s.source.match)?.segments?.[s.segmentIndex];if(!seg)return;
  drawShapes(ctx,seg.annotations,w,h);drawCaption(ctx,seg.caption,w,h);
  if(s.pen?.points?.length>1)drawShapes(ctx,[s.pen],w,h);
 }
 function overlay(win,s){const frame=win.document.getElementById('v780-video-frame');if(!frame)return;
  s.mask?.remove();const can=win.document.createElement('canvas');can.id='vc19317-drawing-surface';can.setAttribute('aria-label','Editor de dibujos sobre vídeo');frame.append(can);s.mask=can;
  const pointer=(e)=>{const rect=can.getBoundingClientRect();return {x:clamp((e.clientX-rect.left)/Math.max(rect.width,1)),y:clamp((e.clientY-rect.top)/Math.max(rect.height,1))}};
  const down=e=>{if(s.tool==='off'||s.exporting||!selected(s,s.source.match)?.segments?.[s.segmentIndex])return;
   e.preventDefault();can.setPointerCapture?.(e.pointerId);const p=pointer(e);
   s.pen={kind:s.tool,color:s.color,points:[p],text:s.tool==='text'?s.drawText:''};
   if(s.tool==='text'&&!val(s.pen.text)){status(s,'Escribe primero un texto para colocarlo en la pista.',true);s.pen=null;return;}
   previewOverlay(win,s);
  };
  const move=e=>{if(!s.pen)return;e.preventDefault();const p=pointer(e);if(s.pen.kind==='pen'){if(s.pen.points.length<150)s.pen.points.push(p)}else if(s.pen.kind!=='text')s.pen.points[1]=p;previewOverlay(win,s)};
  const up=async e=>{if(!s.pen)return;e.preventDefault();const draft=s.pen;s.pen=null;
   if(draft.kind==='text')draft.points=[draft.points[0]];
   else if(draft.kind==='pen'&&draft.points.length===1)draft.points.push(pointer(e));
   else if(draft.points.length<2)draft.points.push(pointer(e));
   const checked=validateShape(draft);if(!checked)return;
   const id=s.id,idx=s.segmentIndex;
   if(await commit(win,s,list=>{const m=list.find(x=>x.id===id),segment=m?.segments?.[idx];if(!segment||arr(segment.annotations).length>=50)return false;segment.annotations.push(checked);m.updatedAt=new Date().toISOString();}))refresh(win,s);
  };
  can.addEventListener('pointerdown',down);can.addEventListener('pointermove',move);can.addEventListener('pointerup',up);can.addEventListener('pointercancel',()=>{s.pen=null;previewOverlay(win,s)});
  syncPointer(s);previewOverlay(win,s);
 }
 function syncPointer(s){if(s.mask){s.mask.style.pointerEvents=s.tool==='off'?'none':'auto';s.mask.style.cursor=s.tool==='off'?'default':'crosshair'}}
 function refresh(win,s){const root=s.root,match=s.source?.match;if(!root||!match||!root.isConnected)return;
  const plan=selected(s,match),list=getList(match),catalog=groupCatalog(win,match),rallies=arr(s.source?.projection?.base?.rallies);
  const library=root.querySelector('#vc19317-library');if(library)library.innerHTML=list.map(p=>`<button class="${p.id===s.id?'active':''}" data-vc19317-act="pick" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><small>${p.segments.length} clips</small></button>`).join('')||'<p class="vc19317-note">No hay montajes guardados.</p>';
  const name=root.querySelector('#vc19317-name');if(name&&win.document.activeElement!==name)name.value=plan?.name||'';
  const counter=root.querySelector('#vc19317-count');if(counter)counter.textContent=`${list.length} guardados`;
  const sources=root.querySelector('#vc19317-sources');if(sources)sources.innerHTML=`<label>Rally de este análisis<select id="vc19317-source-rally"><option value="">Seleccionar rally</option>${rallies.slice(-150).reverse().filter(r=>r.nativeId!=null).map(r=>`<option value="${esc(r.key)}">Set ${r.set} · Rally ${r.index} (${r.contacts.length} contactos)</option>`).join('')}</select></label><button data-vc19317-act="add-rally">Añadir rally seleccionado</button><label>Clip del catálogo<select id="vc19317-source-clip"><option value="">Seleccionar clip</option>${catalog.map((c,i)=>`<option value="${i}">${esc(c.label)} · ${mm(c.start)}–${mm(c.end)}</option>`).join('')}</select></label><button data-vc19317-act="add-clip">Añadir clip seleccionado</button>`;
  const playlist=root.querySelector('#vc19317-playlist');if(playlist){const current=playlist.value;playlist.innerHTML='<option value="">Elegir playlist</option>'+arr(match.clipPlaylists).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} (${arr(p.entries).length})</option>`).join('');playlist.value=[...playlist.options].some(o=>o.value===current)?current:'';}
  const sequence=root.querySelector('#vc19317-sequence');if(sequence){sequence.innerHTML=arr(plan?.segments).map((seg,i)=>`<div class="vc19317-clip ${s.segmentIndex===i?'active':''}" data-index="${i}"><button data-vc19317-act="select" data-index="${i}" class="vc19317-seg-name"><strong>${i+1}. ${esc(seg.label)}</strong><small>${mm(seg.start)}–${mm(seg.end)} · ${seg.rate.toFixed(1)}× · ${mm((seg.end-seg.start)/seg.rate)} · ${seg.annotations.length} dibujos</small></button><div class="vc19317-clip-buttons"><button title="Subir" data-vc19317-act="up" data-index="${i}" ${i===0?'disabled':''}>↑</button><button title="Bajar" data-vc19317-act="down" data-index="${i}" ${i===plan.segments.length-1?'disabled':''}>↓</button><button title="Duplicar" data-vc19317-act="duplicate" data-index="${i}">Duplicar</button><button title="Eliminar" data-vc19317-act="remove" data-index="${i}">Quitar</button></div></div>`).join('')||'<p class="vc19317-note">Todavía no hay clips. Añade rallies, clips o una playlist.</p>';}
  const total=root.querySelector('#vc19317-total');if(total)total.textContent=`${plan?.segments.length||0} clips · ${mm(totalDuration(plan?.segments))}`;
  const seg=plan?.segments?.[s.segmentIndex];
  for(const k of ['start','end','rate','caption']){const input=root.querySelector(`[data-vc19317-input="${k}"]`);if(input&&win.document.activeElement!==input)input.value=seg?.[k]??'';}
  const tool=root.querySelector('[data-vc19317-input="tool"]');if(tool)tool.value=s.tool;
  const color=root.querySelector('[data-vc19317-input="color"]');if(color)color.value=s.color;
  const text=root.querySelector('[data-vc19317-input="draw-text"]');if(text&&win.document.activeElement!==text)text.value=s.drawText;
  root.querySelectorAll('.vc19317-clip-buttons button').forEach(b=>b.disabled=b.disabled||s.exporting);
  previewOverlay(win,s);
 }
 function seek(win,s,segment,{autoplay=false}={}){const video=media(win),diag=win.v780Diagnostics?.()||{};
  if(!video||!contextOk(win,s)||!win.VC_VIDEO_REVIEW_API?.loaded?.()||diag.mediaType==='youtube'||!Number.isFinite(video.duration)){
   status(s,'Carga un archivo o una grabación local de este mismo partido.',true);return false;}
  if(segment.end>video.duration+.2){status(s,'El intervalo del clip supera la duración de la grabación cargada.',true);return false;}
  if(!s.exporting)win.v780StopPlaylist?.();video.pause();video.currentTime=segment.start;video.playbackRate=segment.rate;
  if(autoplay){video.play().catch(()=>status(s,'El navegador bloqueó la reproducción automática.',true))}return true;
 }
 function tick(win,s){if(!contextOk(win,s)){cancel(win,s);return;}
  previewOverlay(win,s);if(s.exporting)return;
  if(!s.previewing)return;const seg=selected(s,s.source.match)?.segments?.[s.segmentIndex],v=media(win);if(!seg||!v){stopPreview(win,s);return}
  if(v.currentTime>=seg.end-.07){if(s.previewAll){const plan=selected(s,s.source.match);if(s.segmentIndex+1<plan.segments.length){s.segmentIndex++;seek(win,s,plan.segments[s.segmentIndex],{autoplay:true});refresh(win,s);return;}}stopPreview(win,s);status(s,'Previsualización terminada.');}
 }
 function stopPreview(win,s){s.previewing=false;s.previewAll=false;media(win)?.pause()}
 function cancel(win,s){s.exportAbort=true;if(s.previewing)stopPreview(win,s);try{if(s.exportRecorder?.state==='recording')s.exportRecorder.stop()}catch(_){};s.exportStream?.getTracks().forEach(t=>t.stop());}
 function cleanup(win){const s=getState(win);cancel(win,s);s.mask?.remove();s.mask=null;s.root=null;s.source=null;s.matchId='';s.pen=null;}
 function mount(win,root,ctx,projection){const s=getState(win);s.root=root;s.source={match:ctx.match,projection};s.matchId=String(ctx.match.id);
  if(!getList(ctx.match).some(m=>m.id===s.id)){s.id=getList(ctx.match)[0]?.id||'';s.segmentIndex=0;}
  overlay(win,s);const v=media(win);v?.addEventListener('timeupdate',s.onTick||(s.onTick=()=>tick(win,s)));
  const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>previewOverlay(win,s)):null;
  if(observer){observer.observe(win.document.getElementById('v780-video-frame'));s.resizeObserver=observer;}
  refresh(win,s);return true;
 }
 function unmount(win){const s=getState(win);s.resizeObserver?.disconnect();s.resizeObserver=null;media(win)?.removeEventListener('timeupdate',s.onTick);cleanup(win)}
 async function modifySegment(win,s,fn){const id=s.id,i=s.segmentIndex;const ok=await commit(win,s,list=>{const p=list.find(x=>x.id===id);const seg=p?.segments?.[i];if(!seg)return false;const result=fn(seg);if(result===false)return false;p.updatedAt=new Date().toISOString();});if(ok)refresh(win,s);return ok}
 async function addSegment(win,s,segment){if(!segment){status(s,'No hay intervalo de vídeo válido para esa jugada. Sincroniza el vídeo primero.',true);return false;}
  const ok=await commit(win,s,list=>{const p=list.find(x=>x.id===s.id);if(!p||p.segments.length>=MAX_SEGMENTS)return false;p.segments.push(segment);p.updatedAt=new Date().toISOString();});
  if(ok){s.segmentIndex=selected(s,s.source.match).segments.length-1;refresh(win,s);status(s,'Jugada añadida. Guardado solicitado; referencias originales conservadas.');}else if(!s.saveFailed)status(s,'Crea un montaje o comprueba el límite de clips.',true);return ok;
 }
 async function importSegments(win,s,items){const valid=arr(items).map(x=>validateSegment(x)).filter(Boolean),p=selected(s,s.source.match);if(!p||!valid.length)return false;
  const ok=await commit(win,s,list=>{const target=list.find(x=>x.id===p.id);if(!target||target.segments.length+valid.length>MAX_SEGMENTS)return false;target.segments.push(...valid);target.updatedAt=new Date().toISOString();});
  if(ok){s.segmentIndex=0;refresh(win,s);status(s,`${valid.length} jugadas añadidas. Guardado solicitado.`)}return ok;
 }
 function prepExport(win,s,plan){const v=media(win),diag=win.v780Diagnostics?.()||{};
  if(!v||!win.VC_VIDEO_REVIEW_API?.loaded?.()||diag.mediaType==='youtube'||!v.currentSrc||!v.videoWidth||!v.videoHeight||!Number.isFinite(v.duration)||!contextOk(win,s))throw Error('Exportación solo disponible con archivo o grabación local del partido seleccionado.');
  if(!arr(plan.segments).length)throw Error('El montaje no contiene clips.');
  if(totalDuration(plan.segments)>MAX_DURATION)throw Error('La exportación admite un máximo de 10 minutos.');
  for(const seg of plan.segments){if(!validateSegment(seg)||seg.end>v.duration+.2)throw Error(`Intervalo no válido: ${seg.label}`)}
  if(typeof win.MediaRecorder!=='function'||typeof win.HTMLCanvasElement?.prototype?.captureStream!=='function')throw Error('El navegador no permite exportar vídeo WebM con anotaciones.');
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>win.MediaRecorder.isTypeSupported?.(x));
  if(!mime)throw Error('El navegador no ofrece un codificador WebM compatible.');
  // Confirm that drawing this media source is allowed (cross-origin streaming can taint canvas).
  const test=win.document.createElement('canvas');test.width=2;test.height=2;test.getContext('2d').drawImage(v,0,0,2,2);test.toDataURL();
  return mime;
 }
 function waitSeek(v,at,signal){return new Promise((resolve,reject)=>{
  if(signal())return reject(Error('Exportación cancelada'));
  let timer;function end(err){winClear();err?reject(err):resolve()}function winClear(){clearTimeout(timer);v.removeEventListener('seeked',success);v.removeEventListener('error',failure)}
  function success(){end()}function failure(){end(Error('Error leyendo la grabación'))}
  v.addEventListener('seeked',success,{once:true});v.addEventListener('error',failure,{once:true});timer=setTimeout(()=>end(Error('No se pudo posicionar el vídeo')),12000);
  try{v.currentTime=at;if(Math.abs(v.currentTime-at)<.06&&v.readyState>=2){winClear();resolve()}}catch(e){end(e)}
 });}
 function paintExportFrame(ctx,v,seg,w,h){ctx.fillStyle='#050e17';ctx.fillRect(0,0,w,h);const vw=v.videoWidth||w,vh=v.videoHeight||h,scale=Math.min(w/vw,h/vh),sw=vw*scale,sh=vh*scale;
  ctx.drawImage(v,(w-sw)/2,(h-sh)/2,sw,sh);drawShapes(ctx,seg.annotations,w,h);drawCaption(ctx,seg.caption,w,h);
 }
 async function exportVideo(win,s,onlySelected=false){if(s.exporting)return;
  const original=selected(s,s.source.match);if(!original){status(s,'Selecciona un montaje para exportar.',true);return;}
  const plan=copy(original),v=media(win),matchId=s.matchId;
  if(onlySelected){if(!plan.segments[s.segmentIndex]){status(s,'Selecciona un clip para exportarlo.',true);return;}plan.segments=[plan.segments[s.segmentIndex]];}
  let mime;try{mime=prepExport(win,s,plan)}catch(e){status(s,val(e.message),true);return;}
  s.exporting=true;s.exportAbort=false;stopPreview(win,s);win.v780StopPlaylist?.();
  const wasPaused=v.paused,oldTime=v.currentTime,oldRate=v.playbackRate;
  let recorder=null,stream=null,paintFrame=0,parts=[],cancelled=false;
  try{
   const width=Math.min(1280,Math.max(320,v.videoWidth||960)),height=Math.round(width*(v.videoHeight||540)/(v.videoWidth||960));
   const canvas=win.document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{alpha:false});
   stream=canvas.captureStream(30);s.exportStream=stream;
   // Where supported, add only the audio track of the loaded local file.
   try{const from=v.captureStream?.();const track=from?.getAudioTracks?.()?.[0];if(track)stream.addTrack(track)}catch(_){}
   recorder=new win.MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3500000});s.exportRecorder=recorder;
   recorder.addEventListener('dataavailable',e=>{if(e.data?.size)parts.push(e.data)});
   const completed=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=e=>reject(Error(e.error?.message||'Error en MediaRecorder'))});
   // Start recording only after first frame is ready.
   const first=plan.segments[0];await waitSeek(v,first.start,()=>s.exportAbort||!contextOk(win,s));paintExportFrame(ctx,v,first,width,height);
   recorder.start(1000);
   for(let index=0;index<plan.segments.length;index++){
    if(s.exportAbort||s.matchId!==matchId||!contextOk(win,s))throw Error('Exportación cancelada por cambio de partido o navegación');
    const seg=plan.segments[index];v.pause();await waitSeek(v,seg.start,()=>s.exportAbort||!contextOk(win,s));v.playbackRate=seg.rate;
    paintExportFrame(ctx,v,seg,width,height);
    await new Promise((resolve,reject)=>{
     let t0=0,raf=0,settled=false,freezeAtEnd=false;
     const finish=err=>{if(settled)return;settled=true;win.cancelAnimationFrame(raf);v.pause();err?reject(err):resolve()};
     const loop=()=>{
      if(s.exportAbort||!contextOk(win,s)||win.document.hidden)return finish(Error('Exportación cancelada o pestaña no visible')); 
      if(v.currentTime>=seg.end-.045&&!freezeAtEnd){freezeAtEnd=true;v.pause();}
      try{paintExportFrame(ctx,v,seg,width,height)}catch(err){return finish(err)}
      status(s,`Exportando clip ${index+1}/${plan.segments.length} · ${mm(v.currentTime)} / ${mm(seg.end)}. Mantén esta pestaña activa.`);
      const elapsed=win.performance.now()-t0,expected=(seg.end-seg.start)/seg.rate*1000;
      // Never shorten clips because media time advanced faster than recorder wall time.
      if(freezeAtEnd&&elapsed>=expected-35)return finish();
      if(elapsed>expected+18000)return finish(Error('La grabación no avanza o el navegador la ha pausado.'));
      raf=win.requestAnimationFrame(loop);
     };
     v.play().then(()=>{t0=win.performance.now();raf=win.requestAnimationFrame(loop)}).catch(finish);
    });
   }
   if(recorder.state!=='inactive')recorder.stop();await completed;
   cancelled=s.exportAbort;
   if(!cancelled&&!parts.length)throw Error('El navegador no produjo vídeo válido.');
   if(!cancelled){download(win,new win.Blob(parts,{type:mime}),'volley-coach_'+safeName(plan.name)+(onlySelected?'-clip':'')+'.webm',mime);status(s,`Vídeo WebM exportado: ${plan.segments.length} clips. Comprueba sonido y sincronización al reproducirlo.`)}
  }catch(err){cancelled=true;status(s,`Exportación no completada: ${val(err.message||err)}`,true);try{if(recorder?.state!=='inactive')recorder.stop()}catch(_){}}
  finally{
   s.exporting=false;s.exportAbort=false;s.exportRecorder=null;s.exportStream=null;
   try{v.pause();v.playbackRate=oldRate;v.currentTime=oldTime;if(!wasPaused)await v.play().catch(()=>{});}catch(_){}
   stream?.getTracks().forEach(t=>t.stop());refresh(win,s);
  }
 }
 async function click(win,button){const s=getState(win),root=s.root,action=button?.dataset?.vc19317Act;if(!root||action===undefined)return false;
  const match=s.source?.match,plan=selected(s,match),index=Number(button.dataset.index),catalog=groupCatalog(win,match),rallies=arr(s.source.projection.base.rallies);
  if(s.exporting&&!['cancel-export'].includes(action)){status(s,'Termina o cancela la exportación antes de modificar el montaje.',true);return true;}
  const persist=async fn=>{const ok=await commit(win,s,fn);if(ok)refresh(win,s);return ok;};
  switch(action){
   case 'video':win.VC_PRO_ANALYSIS_19310_STATE?.show?.('video');break;
   case 'load-file':win.document.getElementById('v780-file')?.click();break;
   case 'recording':win.v780OpenRecordingPicker?.();break;
   case 'create':{const name=val(root.querySelector('#vc19317-new-name')?.value).slice(0,100);if(!name){status(s,'Escribe el nombre del montaje.',true);break;}
    const id=uniq();if(await persist(list=>{if(list.length>=MAX_MONTAGES)return false;list.push({id,name,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),segments:[]});})){s.id=id;s.segmentIndex=0;root.querySelector('#vc19317-new-name').value='';refresh(win,s);status(s,'Montaje creado. Guardado solicitado en el partido.')}break;}
   case 'pick':s.id=val(button.dataset.id);s.segmentIndex=0;stopPreview(win,s);refresh(win,s);break;
   case 'rename':if(plan){const name=val(root.querySelector('#vc19317-name')?.value).slice(0,100);if(name)await persist(list=>{const m=list.find(x=>x.id===s.id);if(!m)return false;m.name=name;m.updatedAt=new Date().toISOString();});}break;
   case 'delete':if(plan&&win.confirm?.('¿Eliminar este montaje? Los clips y scoutings originales no se borrarán.')){stopPreview(win,s);if(await persist(list=>{const i=list.findIndex(x=>x.id===s.id);if(i<0)return false;list.splice(i,1);})){s.id=getList(match)[0]?.id||'';s.segmentIndex=0;refresh(win,s)}}break;
   case 'add-rally':{const key=root.querySelector('#vc19317-source-rally')?.value;await addSegment(win,s,sourceForRally(win,rallies.find(r=>r.key===key)));break;}
   case 'add-rallies':{const refs=rallies.slice(-150).map(r=>sourceForRally(win,r)).filter(Boolean).slice(0,80);if(!refs.length)status(s,'No hay rallies con tiempos verificados en este filtro.',true);else if(!await importSegments(win,s,refs))status(s,'No se pudieron añadir los rallies (límite de 120).',true);break;}
   case 'add-clip':{const raw=root.querySelector('#vc19317-source-clip')?.value;const chosen=raw===''?null:catalog[Number(raw)];await addSegment(win,s,chosen?sourceForClip(chosen):null);break;}
   case 'import-playlist':{const id=root.querySelector('#vc19317-playlist')?.value,p=arr(match.clipPlaylists).find(x=>val(x.id)===id);if(!p){status(s,'Selecciona una playlist existente.',true);break;}
    const segments=arr(p.entries).map(x=>resolvePlaylist(x,catalog)).filter(Boolean).map(sourceForClip);if(!segments.length)status(s,'La playlist no tiene clips con intervalos válidos en este vídeo.',true);else if(!await importSegments(win,s,segments))status(s,'No se pudo importar la playlist.',true);break;}
   case 'select':if(plan?.segments[index]){s.segmentIndex=index;stopPreview(win,s);refresh(win,s);seek(win,s,plan.segments[index]);}break;
   case 'up':case 'down':{const delta=action==='up'?-1:1;if(plan?.segments[index+delta]){if(await persist(list=>{const segments=list.find(x=>x.id===s.id)?.segments;if(!segments||!segments[index+delta])return false;[segments[index],segments[index+delta]]=[segments[index+delta],segments[index]];})){s.segmentIndex=index+delta;refresh(win,s)}}break;}
   case 'duplicate':if(plan?.segments[index]){const seg=copy(plan.segments[index]);seg.id=uniq();if(await persist(list=>{const segments=list.find(x=>x.id===s.id)?.segments;if(!segments||segments.length>=MAX_SEGMENTS)return false;segments.splice(index+1,0,seg);}))s.segmentIndex=index+1;refresh(win,s)}break;
   case 'remove':if(plan?.segments[index]){if(await persist(list=>{list.find(x=>x.id===s.id)?.segments.splice(index,1);})){s.segmentIndex=Math.max(0,Math.min(index,selected(s,match)?.segments.length-1));refresh(win,s)}}break;
   case 'save-segment':{const start=finite(root.querySelector('[data-vc19317-input="start"]')?.value),end=finite(root.querySelector('[data-vc19317-input="end"]')?.value),rate=Number(root.querySelector('[data-vc19317-input="rate"]')?.value);
    if(start===null||end===null||!validateSegment({...plan?.segments?.[s.segmentIndex],start,end,rate})){status(s,'Comprueba inicio, final y velocidad (0,5×, 1× o 1,5×).',true);break;}
    if(await modifySegment(win,s,seg=>{seg.start=start;seg.end=end;seg.rate=rate;}))status(s,'Corte y velocidad guardados.');break;}
   case 'undo':await modifySegment(win,s,seg=>{if(!seg.annotations.length)return false;seg.annotations.pop();});break;
   case 'clear-annotations':await modifySegment(win,s,seg=>{if(!seg.annotations.length)return false;seg.annotations=[];});break;
   case 'preview':case 'play-all':{if(!plan?.segments.length){status(s,'Añade algún clip antes de reproducir.',true);break;}stopPreview(win,s);s.previewing=true;s.previewAll=action==='play-all';
    if(action==='play-all')s.segmentIndex=0;const seg=plan.segments[s.segmentIndex];if(!seek(win,s,seg,{autoplay:true})){stopPreview(win,s);break;}refresh(win,s);break;}
   case 'prev':case 'next':if(plan?.segments.length){s.segmentIndex=clamp(s.segmentIndex+(action==='prev'?-1:1),0,plan.segments.length-1);stopPreview(win,s);refresh(win,s);seek(win,s,plan.segments[s.segmentIndex]);}break;
   case 'stop':stopPreview(win,s);break;
   case 'export-json':if(plan)download(win,JSON.stringify({format:'volley-coach-video-montage',version:1,matchId:s.matchId,plan},null,2),safeName(plan.name)+'.json','application/json');break;
   case 'export-csv':if(plan)download(win,edlCSV(plan),safeName(plan.name)+'.csv','text/csv;charset=utf-8');break;
   case 'export':await exportVideo(win,s);break;
   case 'export-clip':await exportVideo(win,s,true);break;
   case 'cancel-export':cancel(win,s);status(s,'Cancelando exportación.');break;
  }return true;
 }
 async function change(win,target){const s=getState(win),key=target?.dataset?.vc19317Input;if(!s.root||key===undefined)return false;
  if(key==='tool'){s.tool=target.value;syncPointer(s);}
  else if(key==='color')s.color=/^#[a-f0-9]{6}$/i.test(target.value)?target.value:'#ffae46';
  else if(key==='draw-text')s.drawText=val(target.value).slice(0,100);
  else if(key==='caption'){const value=val(target.value).slice(0,180);await modifySegment(win,s,seg=>{seg.caption=value;});}
  return true;
 }
 function render(){return {html:makeScreen(),rallies:null};}
 return Object.freeze({VERSION,MAX_SEGMENTS,MAX_MONTAGES,validateSegment,validateShape,validateMontage,totalDuration,rallyRef,sourceForRally,sourceForClip,resolvePlaylist,groupCatalog,drawShapes,edlCSV,render,mount,unmount,click,change,getState,prepExport});
});
