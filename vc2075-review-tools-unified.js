/* Volley Coach V20.7.5 · Video montage, reports and bench UI, original deferred order preserved. */
/* VC2075_SOURCE_BEGIN:199-vc19317-video-montage-pro.js */
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
/* VC2075_SOURCE_END:199-vc19317-video-montage-pro.js */
;
/* VC2075_SOURCE_BEGIN:200-vc19318-worksheets-reports-pro.js */
/* Volley Coach V19.3.18 · Worksheets & Reports Pro
 * Solo lectura. Proyecta datos canónicos de 1938; no modifica matches,
 * puntuaciones, sincronización, vídeo ni almacenamiento de scouting.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_WORKSHEETS_19318=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.18.0', STORAGE_KEY='vc19318:worksheet-presets:1', MAX_PRESETS=25;
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const GROUPS={player:'Jugador',rotation:'Rotación',set:'Set',skill:'Fundamento',phase:'Fase K1/K2',zone:'Zona explícita',team:'Equipo',total:'Total'};
 const METRICS={N:{label:'Acciones',format:'count'},EVAL:{label:'Valoradas',format:'count'},UNRATED:{label:'Sin valorar',format:'count'},POINT:{label:'Valoración #',format:'count'},PLUS:{label:'Valoración +',format:'count'},ERROR:{label:'Valoración =',format:'count'},BLOCKED:{label:'Valoración /',format:'count'},POSITIVE:{label:'# / +',format:'count'},POS_RATE:{label:'Positivas %',format:'pct'},ATTACKS:{label:'Ataques',format:'count'},KILL:{label:'Ataques #',format:'count'},ATTACK_RATE:{label:'Kill % ataque',format:'pct'},ATTACK_EFF:{label:'EFF ataque %',format:'pct'},RECEPTIONS:{label:'Recepciones',format:'count'},RECEPTION_POS:{label:'Recepción positiva %',format:'pct'},SERVES:{label:'Saques',format:'count'},SERVE_ACE:{label:'Saques #',format:'count'},SERVE_ACE_RATE:{label:'Saques # %',format:'pct'},FORMULA:{label:'Fórmula personalizada',format:'number'}};
 const KEY_COLS=Object.keys(METRICS);
 const BUILTINS=[
  {name:'Ataque · Eficiencia',group:'player',skill:'A',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_RATE','ATTACK_EFF']},
  {name:'Recepción · Calidad',group:'player',skill:'R',columns:['N','EVAL','POINT','PLUS','ERROR','RECEPTION_POS']},
  {name:'Saque · Valoración',group:'player',skill:'S',columns:['N','EVAL','SERVE_ACE','ERROR','SERVE_ACE_RATE']},
  {name:'Rotaciones · Ataque',group:'rotation',skill:'A',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_EFF']},
  {name:'Colocadores · Acciones',group:'player',skill:'E',columns:['N','EVAL','POINT','PLUS','ERROR','POS_RATE']},
  {name:'Resumen · Fundamentos',group:'skill',skill:'',columns:['N','EVAL','UNRATED','POINT','POSITIVE','POS_RATE']}
 ];
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(x,n)=>n>0?Math.round(x/n*1000)/10:null;
 const display=(v,fmt='count')=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('es-ES',{maximumFractionDigits:2})+(fmt==='pct'?' %':'');
 const cleanName=s=>str(s).slice(0,55).replace(/[\x00-\x1f]/g,'');
 const defaultConfig=()=>({name:'Ataque · Eficiencia',group:'player',skill:'A',set:'',rotation:'',phase:'',player:'',evaluation:'',zone:'',focus:'',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_EFF'],formula:'100*(POINT-ERROR-BLOCKED)/EVAL',sort:'volume'});
 function sanitizeConfig(raw){
  if(!raw||typeof raw!=='object')return null;
  const d=defaultConfig(),g=str(raw.group||d.group),skill=str(raw.skill||'').toUpperCase();
  if(!GROUPS[g]||(skill&&!SKILLS[skill]))return null;
  const cols=[...new Set(arr(raw.columns).filter(c=>typeof c==='string'&&KEY_COLS.includes(c)))].slice(0,14);
  if(!cols.length)return null;
  const r={...d,name:cleanName(raw.name)||d.name,group:g,skill,columns:cols};
  for(const key of ['set','rotation','phase','player','evaluation','zone'])r[key]=str(raw[key]||'').slice(0,80);
  if(r.set&&!/^\d{1,2}$/.test(r.set))return null;
  if(r.rotation&&!/^[1-6]$|^unknown$/.test(r.rotation))return null;
  if(r.phase&&!['K1','K2','unknown'].includes(r.phase))return null;
  if(r.evaluation&&!['#','+','!','-','/','='].includes(r.evaluation))return null;
  if(r.zone&&!/^Z[1-9][ABCD]?$|^unknown$/.test(r.zone))return null;
  if(raw.focus)r.focus=str(raw.focus).slice(0,100);
  r.sort=['volume','label','efficiency'].includes(raw.sort)?raw.sort:'volume';
  r.formula=str(raw.formula||d.formula).slice(0,128);
  if(cols.includes('FORMULA')){try{compile(r.formula)}catch(_){return null;}}
  return r;
 }
 function compile(expression){
  const engine=typeof window!=='undefined'?window.VC_ANALYSIS_SCREENS_19311:null;
  // En Node, no se necesita window: la dependencia canónica es inyectable.
  const source=engine||((typeof module==='object'&&module.exports)?require('./192-vc19311-professional-analysis-screens.js'):null);
  if(!source?.compileFormula)throw Error('Motor seguro de fórmulas no disponible');
  return source.compileFormula(expression);
 }
 function storage(win){try{return win?.localStorage||null}catch(_){return null}}
 function readPresets(store){try{const data=JSON.parse(store?.getItem(STORAGE_KEY)||'[]');return arr(data).slice(0,MAX_PRESETS).map(sanitizeConfig).filter(Boolean).map(x=>({...x,focus:''}));}catch(_){return []}}
 function legacyPresets(store){
  try{const data=JSON.parse(store?.getItem('vc19311:worksheet-layouts:v1')||'[]');
   return arr(data).slice(0,24).filter(x=>x&&typeof x.name==='string'&&typeof x.formula==='string').map(x=>sanitizeConfig({...defaultConfig(),...x,name:'Anterior · '+cleanName(x.name),columns:['N','EVAL','FORMULA']})).filter(Boolean).map(c=>({...c,focus:''}));
  }catch(_){return []}
 }
 function savePreset(store,cfg){const clean=sanitizeConfig(cfg);if(!store||!clean)throw Error('La plantilla contiene valores no válidos');
  const presets=readPresets(store).filter(x=>x.name!==clean.name);presets.push({...clean,focus:''});store.setItem(STORAGE_KEY,JSON.stringify(presets.slice(-MAX_PRESETS)));return clean;}
 function deletePreset(store,name){if(!store)throw Error('Almacenamiento local no disponible');store.setItem(STORAGE_KEY,JSON.stringify(readPresets(store).filter(p=>p.name!==name)));}
 function ensureState(state){if(!state.vc19318)state.vc19318={config:defaultConfig(),template:'builtin:Ataque · Eficiencia',editor:false,showReport:true};return state.vc19318;}
 function sourceZone(c){const f=c.fields||{};return c.skill==='E'?f.setTarget?.code||'':c.skill==='R'?f.contactZone?.code||f.startZone?.code||'':f.startZone?.code||'';}
 function lookupRally(base){return new Map(arr(base?.rallies).map(r=>[r.key,r]));}
 function getPhase(r,team){if(!r?.serving)return 'unknown';return r.serving===team?'K2':'K1';}
 function rowContext(c,r,team){const rotation=team==='ours'?r?.ownRotation:r?.rivalRotation;
  return {set:String(c.set),rotation:rotation>=1&&rotation<=6?String(rotation):'unknown',phase:getPhase(r,team),zone:sourceZone(c)||'unknown',player:c.player||'Sin identificar',team:c.team,skill:c.skill||''};
 }
 function filterContacts(projection,team,cfg){const base=projection.base,byRally=lookupRally(base);
  return arr(base.contacts).filter(c=>{
   if(c.team!==team)return false;const x=rowContext(c,byRally.get(c.rallyKey),team);
   if(cfg.skill&&x.skill!==cfg.skill)return false;
   for(const field of ['set','rotation','phase','player','evaluation','zone']){
    if(!cfg[field])continue;
    if(field==='evaluation'){if(c.evaluation!==cfg.evaluation)return false;continue;}
    if(x[field]!==cfg[field])return false;
   }return true;
  });
 }
 function metrics(rows){const rated=rows.filter(c=>c.evaluation),count=code=>rated.filter(c=>c.evaluation===code).length;
  const attacks=rows.filter(c=>c.skill==='A'),evalA=attacks.filter(c=>c.evaluation),aCount=code=>evalA.filter(c=>c.evaluation===code).length;
  const receptions=rows.filter(c=>c.skill==='R'),evalR=receptions.filter(c=>c.evaluation),rPos=evalR.filter(c=>c.evaluation==='#'||c.evaluation==='+').length;
  const serves=rows.filter(c=>c.skill==='S'),evalS=serves.filter(c=>c.evaluation),aces=evalS.filter(c=>c.evaluation==='#').length;
  return {N:rows.length,EVAL:rated.length,UNRATED:rows.length-rated.length,POINT:count('#'),PLUS:count('+'),ERROR:count('='),BLOCKED:count('/'),POSITIVE:count('#')+count('+'),POS_RATE:pct(count('#')+count('+'),rated.length),ATTACKS:attacks.length,KILL:aCount('#'),ATTACK_RATE:pct(aCount('#'),evalA.length),ATTACK_EFF:pct(aCount('#')-aCount('=')-aCount('/'),evalA.length),RECEPTIONS:receptions.length,RECEPTION_POS:pct(rPos,evalR.length),SERVES:serves.length,SERVE_ACE:aces,SERVE_ACE_RATE:pct(aces,evalS.length)};
 }
 function labelGroup(c,r,team,group){const x=rowContext(c,r,team);
  if(group==='total')return 'Total';if(group==='player')return x.player;
  if(group==='rotation')return x.rotation==='unknown'?'Sin rotación':'P'+x.rotation;
  if(group==='set')return 'Set '+x.set;
  if(group==='skill')return SKILLS[x.skill]||'Sin fundamento';
  if(group==='phase')return x.phase==='unknown'?'Saque no registrado':x.phase;
  if(group==='zone')return x.zone==='unknown'?'Sin zona explícita':x.zone;
  if(group==='team')return c.team==='ours'?'Nuestro equipo':'Rival';return 'Total';
 }
 function calc(projection,team,cfg){const clean=sanitizeConfig(cfg);if(!clean)throw Error('Configuración estadística inválida');
  const contacts=filterContacts(projection,team,clean),rallyMap=lookupRally(projection.base),groups=new Map();
  for(const c of contacts){const label=labelGroup(c,rallyMap.get(c.rallyKey),team,clean.group);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(c);}
  const fn=clean.columns.includes('FORMULA')?compile(clean.formula):null;
  const values=rows=>{const m=metrics(rows);if(fn){const scalar=fn({N:m.N,EVAL:m.EVAL,POINT:m.POINT,HASH:m.POINT,PLUS:m.PLUS,ERROR:m.ERROR,BLOCKED:m.BLOCKED,POSITIVE:m.POSITIVE,NEGATIVE:rows.filter(c=>['-','=','/'].includes(c.evaluation)).length,NOT_RATED:m.UNRATED});m.FORMULA=scalar;}return m;};
  const result=[...groups].map(([label,items])=>({label,contacts:items,stats:values(items),rallyKeys:[...new Set(items.map(c=>c.rallyKey))]}));
  result.sort((a,b)=>clean.sort==='label'?a.label.localeCompare(b.label,'es',{numeric:true}):clean.sort==='efficiency'?(b.stats.ATTACK_EFF??-Infinity)-(a.stats.ATTACK_EFF??-Infinity)||b.stats.N-a.stats.N:b.stats.N-a.stats.N||a.label.localeCompare(b.label,'es',{numeric:true}));
  const keys=[...new Set(contacts.map(c=>c.rallyKey))],rallies=arr(projection.base.rallies).filter(r=>keys.includes(r.key));
  const closed=rallies.filter(r=>r.closed),k1=closed.filter(r=>r.serving&&r.serving!==team),k2=closed.filter(r=>r.serving===team);
  const pointStat=list=>({n:list.length,won:list.filter(r=>r.winner===team).length,pct:pct(list.filter(r=>r.winner===team).length,list.length)});
  const chosen=clean.focus?result.find(r=>r.label===clean.focus):null;
  const filtered=chosen?new Set(chosen.rallyKeys):new Set(keys);
  return {config:clean,contacts,rows:result,rallies:rallies.filter(r=>filtered.has(r.key)),summary:values(contacts),coverage:{contacts:contacts.length,groups:result.length,rallies:rallies.length,unrated:contacts.filter(c=>!c.evaluation).length,unknownZone:contacts.filter(c=>!sourceZone(c)).length},points:{k1:pointStat(k1),k2:pointStat(k2),unknownServe:closed.filter(r=>!r.serving).length},team};
 }
 function csvCell(value){let s=str(value);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function toCSV(data){const c=data.config,head=['Grupo',...c.columns.map(id=>METRICS[id].label),'Rallies únicos'],rows=data.rows.map(r=>[r.label,...c.columns.map(id=>r.stats[id]??''),r.rallyKeys.length]);return '\ufeff'+[head,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');}
 function exportJSON(cfg){const c=sanitizeConfig(cfg);if(!c)throw Error('Configuración inválida');return JSON.stringify({kind:'volley-coach-worksheet',version:1,template:{...c,focus:''}},null,2);}
 function importJSON(value){const parsed=typeof value==='string'?JSON.parse(value):value;if(parsed?.kind!=='volley-coach-worksheet'||parsed.version!==1)throw Error('No es una plantilla V19.3.18 válida');const c=sanitizeConfig(parsed.template);if(!c)throw Error('Configuración de plantilla inválida');return {...c,focus:''};}
 function option(value,label,current){return `<option value="${esc(value)}"${str(current)===str(value)?' selected':''}>${esc(label)}</option>`;}
 function select(items,current,blank='Todos'){return option('',blank,current)+items.map(([id,label])=>option(id,label,current)).join('');}
 function csvSafeName(name){return str(name).replace(/[^a-z0-9-_]+/gi,'-').slice(0,40)||'hoja';}
 function rowTable(data){const cols=data.config.columns;return `<div class="vc19318-table-scroll"><table class="vc19318-stats"><thead><tr><th>Grupo</th>${cols.map(x=>`<th>${esc(METRICS[x].label)}</th>`).join('')}<th>Rallies</th></tr></thead><tbody>${data.rows.map(row=>`<tr class="${data.config.focus===row.label?'is-selected':''}"><th><button type="button" data-vc19318-group="${esc(row.label)}" aria-pressed="${data.config.focus===row.label}">${esc(row.label)}</button></th>${cols.map(x=>`<td>${display(row.stats[x],METRICS[x].format)}</td>`).join('')}<td>${row.rallyKeys.length}</td></tr>`).join('')||`<tr><td colspan="${cols.length+2}">No hay contactos para esta selección.</td></tr>`}</tbody><tfoot><tr><th>TOTAL</th>${cols.map(x=>`<td>${display(data.summary[x],METRICS[x].format)}</td>`).join('')}<td>${data.coverage.rallies}</td></tr></tfoot></table></div>`;}
 function reportPanel(data){const s=data.summary,p=data.points;return `<section class="vc19318-panel vc19318-report"><header><div><small>INFORME TÁCTICO · ${esc(data.config.name)}</small><h3>Resumen estadístico del scouting</h3></div><span>${esc(data.team==='ours'?'Nuestro equipo':'Equipo rival')}</span></header><div class="vc19318-report-metrics"><div><small>Contactos</small><strong>${s.N}</strong></div><div><small>Rallies filtrados</small><strong>${data.coverage.rallies}</strong></div><div><small>EFF ataque</small><strong>${display(s.ATTACK_EFF,'pct')}</strong></div><div><small>Recepción positiva</small><strong>${display(s.RECEPTION_POS,'pct')}</strong></div><div><small>K1 · rallies ganados</small><strong>${display(p.k1.pct,'pct')}</strong><span>${p.k1.won}/${p.k1.n}</span></div><div><small>K2 · rallies ganados</small><strong>${display(p.k2.pct,'pct')}</strong><span>${p.k2.won}/${p.k2.n}</span></div></div><p>Valoración # en la tabla = calificación del contacto, no marcador del partido. K1 y K2 utilizan únicamente rallies cerrados con equipo al saque conocido. Los porcentajes sin denominador se muestran como «—».</p></section>`;}
 function evidence(data){return `<section class="vc19318-panel vc19318-evidence"><header><div><small>EVIDENCIA VINCULADA</small><h3>Rallies de ${esc(data.config.focus||'la muestra')}</h3></div><span>${data.rallies.length} rallies</span></header><div class="vc19318-rally-list">${data.rallies.slice(-80).reverse().map(r=>`<button type="button" data-vc19318-video="${esc(r.key)}"><b>Set ${r.set} · Rally ${r.index}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.contacts.length} contactos</span><strong>Ver vídeo</strong></button>`).join('')||'<p>No hay rallies vinculados.</p>'}</div><p>«Ver vídeo» abre el rally en Video Analysis. El vídeo solo se reproduce si existe una grabación vinculada y disponible.</p></section>`;}
 function render({space,ctx,projection,state,win}){
  if(space!=='worksheets')return null;
  const s=ensureState(state),cfg=s.config,data=calc(projection,ctx.team,cfg),all=projection.base.contacts.filter(c=>c.team===ctx.team),rMap=lookupRally(projection.base),pre=readPresets(storage(win));
  const sets=[...new Set(all.map(c=>String(c.set)))].sort((a,b)=>Number(a)-Number(b)).map(x=>[x,'Set '+x]);
  const players=[...new Set(all.map(c=>c.player||'Sin identificar'))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).map(x=>[x,x]);
  const zones=[...new Set(all.map(c=>sourceZone(c)).filter(Boolean))].sort().map(x=>[x,x]);
  const field=(name,key,options)=>`<label>${esc(name)}<select data-vc19318-filter="${key}">${options}</select></label>`;
  const built=BUILTINS.map(t=>option('builtin:'+t.name,t.name,s.template)).join('');const saved=pre.map(t=>option('saved:'+t.name,t.name,s.template)).join('');const legacy=legacyPresets(storage(win)).map(t=>option('legacy:'+t.name,t.name,s.template)).join('');
  const controls=`<div class="vc19318-filtergrid">${field('Fundamento','skill',select(Object.entries(SKILLS),cfg.skill,'Todos'))}${field('Agrupar','group',Object.entries(GROUPS).map(([id,label])=>option(id,label,cfg.group)).join(''))}${field('Set','set',select(sets,cfg.set,'Todos'))}${field('Rotación','rotation',select([...Array.from({length:6},(_,i)=>[String(i+1),'P'+(i+1)]),['unknown','Sin rotación']],cfg.rotation,'Todas'))}${field('Fase','phase',select([['K1','K1 · Recepción'],['K2','K2 · Saque'],['unknown','Sin saque registrado']],cfg.phase,'Todas'))}${field('Jugador','player',select(players,cfg.player,'Todos'))}${field('Valoración','evaluation',select(['#','+','!','-','/','='].map(x=>[x,x]),cfg.evaluation,'Todas'))}${field('Zona explícita','zone',select([...zones,['unknown','Sin zona explícita']],cfg.zone,'Todas'))}</div>`;
  const editor=`<section class="vc19318-panel vc19318-editor"><header><h3>Configurar columnas</h3><span>Selecciona las métricas visibles</span></header><div class="vc19318-colgrid">${Object.entries(METRICS).map(([id,m])=>`<label><input type="checkbox" data-vc19318-column="${id}"${cfg.columns.includes(id)?' checked':''}/>${esc(m.label)}</label>`).join('')}</div><div class="vc19318-formula"><label>Fórmula segura (solo para la columna personalizada)<input id="vc19318-formula" type="text" spellcheck="false" maxlength="128" value="${esc(cfg.formula)}"/></label><button type="button" data-vc19318-act="formula">Aplicar</button><small>Variables: N, EVAL, POINT, HASH, PLUS, ERROR, BLOCKED, POSITIVE, NEGATIVE, NOT_RATED. División entre cero = «—».</small></div></section>`;
  const html=`<div class="vc19318-root"><div class="vc19318-title"><div><small>V19.3.18 · WORKSHEETS & REPORTS PRO</small><h2>Hojas estadísticas e informes configurables</h2><p>Solo lectura del scouting original · recalculado al actualizar · datos no inventados</p></div><div class="vc19318-actions"><button type="button" data-vc19318-act="export-csv">CSV</button><button type="button" data-vc19318-act="export-html">Informe HTML</button><button type="button" data-vc19318-act="print">Imprimir / PDF</button></div></div><section class="vc19318-panel"><div class="vc19318-presets"><label>Plantilla<select data-vc19318-template><optgroup label="Oficiales">${built}</optgroup><optgroup label="Guardadas en este dispositivo">${saved}</optgroup><optgroup label="Plantillas V19.3.11 anteriores">${legacy}</optgroup></select></label><button type="button" data-vc19318-act="load">Aplicar plantilla</button><button type="button" data-vc19318-act="save">Guardar nueva</button><button type="button" data-vc19318-act="delete">Eliminar guardada</button><button type="button" data-vc19318-act="export-json">Exportar plantilla</button><label class="vc19318-import">Importar JSON<input type="file" accept="application/json,.json" data-vc19318-import/></label></div>${controls}<div class="vc19318-options"><button type="button" data-vc19318-act="columns">${s.editor?'Ocultar columnas':'Personalizar columnas'}</button><button type="button" data-vc19318-act="reset">Restablecer filtros</button>${field('Orden','sort',[['volume','Más acciones'],['label','Nombre'],['efficiency','Eficiencia ataque']].map(([id,label])=>option(id,label,cfg.sort)).join(''))}<span>${pre.length} plantillas locales · los datos no se guardan en la plantilla</span></div></section>${s.editor?editor:''}<div class="vc19318-kpis"><div><small>Contactos en muestra</small><strong>${data.coverage.contacts}</strong></div><div><small>Rallies vinculados</small><strong>${data.coverage.rallies}</strong></div><div><small>Grupos</small><strong>${data.coverage.groups}</strong></div><div><small>Sin valoración</small><strong>${data.coverage.unrated}</strong></div><div><small>Sin zona</small><strong>${data.coverage.unknownZone}</strong></div></div><div class="vc19318-grid"><section class="vc19318-panel vc19318-tablepanel"><header><div><small>HOJA MULTICOLUMNA</small><h3>${esc(cfg.name)}</h3></div><span>${data.rows.length} filas</span></header>${rowTable(data)}<p>Haz clic en un grupo para mostrar únicamente sus rallies. Los porcentajes usan contactos valorados del fundamento correspondiente. La zona significa origen de ataque, contacto de recepción o destino de colocación según el fundamento.</p></section>${evidence(data)}</div>${s.showReport?reportPanel(data):''}<div class="vc19318-foot"><p>Las métricas de ataque se calculan solo con acciones A; las de recepción con R y las de saque con S. La eficacia de ataque es (# − = − /) / ataques valorados. Los campos ausentes no se convierten en ceros estadísticos ni en puntos perdidos.</p><div><button type="button" data-vc19310-legacy-page="players:builder">Hojas anteriores</button><button type="button" data-vc19310-legacy-page="reports:">Informes anteriores</button><button type="button" data-vc19318-act="toggle-report">${s.showReport?'Ocultar resumen':'Mostrar resumen'}</button></div></div></div>`;
  return {html,rallies:data.rallies};
 }
 function download(win,name,content,type){if(!win?.Blob||!win?.URL?.createObjectURL||!win.document?.createElement)return false;const b=new win.Blob([content],{type}),url=win.URL.createObjectURL(b),a=win.document.createElement('a');a.href=url;a.download=name;win.document.body.append(a);a.click();a.remove();win.setTimeout?.(()=>win.URL.revokeObjectURL(url),3000);return true;}
 function standaloneHTML(data){const rows=data.rows.map(r=>`<tr><th>${esc(r.label)}</th>${data.config.columns.map(id=>`<td>${display(r.stats[id],METRICS[id].format)}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Volley Coach · ${esc(data.config.name)}</title><style>body{font:14px system-ui;color:#183451;margin:32px}h1{font-size:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bfd0df;padding:9px;text-align:right}th:first-child{text-align:left}thead{background:#eaf3fb}p{color:#415b74}.meta{font-size:12px;color:#607c94}@media print{body{margin:13mm}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><h1>${esc(data.config.name)}</h1><p>Volley Coach V19.3.18 · ${esc(data.team==='ours'?'Nuestro equipo':'Equipo rival')}</p><p class="meta">${data.coverage.contacts} contactos · ${data.coverage.rallies} rallies · ${data.coverage.unrated} sin valoración · exportación local de datos reales</p><table><thead><tr><th>Grupo</th>${data.config.columns.map(id=>`<th>${esc(METRICS[id].label)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><h2>Contexto</h2><p>EFF ataque: (# − = − /) / ataques evaluados; Kill: # / ataques evaluados. Las valoraciones # no son necesariamente puntos del partido. — = sin muestra evaluada.</p><p>K1: ${data.points.k1.won}/${data.points.k1.n} rallies ganados · K2: ${data.points.k2.won}/${data.points.k2.n} rallies ganados. Solo rallies cerrados con saque registrado de la muestra.</p></body></html>`;
 }
 function handleClick({button,state,node,ctx,projection,win,status}){
  const act=button.dataset.vc19318Act,group=button.dataset.vc19318Group,video=button.dataset.vc19318Video;
  if(act===undefined&&group===undefined&&video===undefined)return {handled:false};
  const s=ensureState(state),c=s.config;
  if(group!==undefined){c.focus=c.focus===group?'':group;return {handled:true,repaint:true};}
  if(video!==undefined)return {handled:true,navigateVideo:video};
  if(act==='columns'){s.editor=!s.editor;return {handled:true,repaint:true};}
  if(act==='toggle-report'){s.showReport=!s.showReport;return {handled:true,repaint:true};}
  if(act==='reset'){s.config={...c,set:'',rotation:'',phase:'',player:'',evaluation:'',zone:'',focus:''};return {handled:true,repaint:true};}
  if(act==='formula'){const expr=str(node.querySelector('#vc19318-formula')?.value).slice(0,128);try{compile(expr);c.formula=expr;c.columns=[...new Set([...c.columns,'FORMULA'])];return {handled:true,repaint:true};}catch(e){status?.(e.message);return {handled:true};}}
  if(act==='load'){const id=str(node.querySelector('[data-vc19318-template]')?.value||s.template),kind=id.split(':')[0],name=id.slice(kind.length+1);const selected=kind==='builtin'?BUILTINS.find(x=>x.name===name):kind==='legacy'?legacyPresets(storage(win)).find(x=>x.name===name):kind==='saved'?readPresets(storage(win)).find(x=>x.name===name):null;if(selected){s.config={...defaultConfig(),...selected,focus:''};s.template=id;return {handled:true,repaint:true};}status?.('Selecciona una plantilla válida.');return {handled:true};}
  if(act==='save'){const name=cleanName(win.prompt?.('Nombre de la plantilla (máx. 55 caracteres):',c.name));if(!name)return {handled:true};try{savePreset(storage(win),{...c,name,focus:''});s.config.name=name;s.template='saved:'+name;status?.('Plantilla guardada localmente (solo configuración).');return {handled:true,repaint:true};}catch(e){status?.('No se pudo guardar: '+e.message);return {handled:true};}}
  if(act==='delete'){if(!s.template.startsWith('saved:')){status?.('Solo se pueden borrar plantillas guardadas por el usuario.');return {handled:true};}try{deletePreset(storage(win),s.template.slice(6));s.template='builtin:'+BUILTINS[0].name;status?.('Plantilla local eliminada.');return {handled:true,repaint:true};}catch(e){status?.(e.message);return {handled:true};}}
  let data;try{data=calc(projection,ctx.team,c);}catch(e){status?.(e.message);return {handled:true};}
  if(act==='export-csv'){status?.(download(win,'vc-hoja-'+csvSafeName(c.name)+'.csv',toCSV(data),'text/csv;charset=utf-8')?'CSV exportado.':'Descarga CSV no disponible.');return {handled:true};}
  if(act==='export-json'){status?.(download(win,'vc-plantilla-'+csvSafeName(c.name)+'.json',exportJSON(c),'application/json;charset=utf-8')?'Plantilla JSON exportada.':'Descarga no disponible.');return {handled:true};}
  if(act==='export-html'){status?.(download(win,'vc-informe-'+csvSafeName(c.name)+'.html',standaloneHTML(data),'text/html;charset=utf-8')?'Informe HTML exportado.':'Descarga no disponible.');return {handled:true};}
  if(act==='print'){const tab=win.open?.('','_blank');if(!tab){status?.('Ventana bloqueada: utiliza Exportar informe HTML y después Imprimir > Guardar como PDF.');return {handled:true};}tab.document.write(standaloneHTML(data));tab.document.close();tab.focus?.();tab.print?.();return {handled:true};}
  return {handled:false};
 }
 function handleChange({target,state}){
  const s=ensureState(state);if(target?.dataset?.vc19318Template!==undefined){s.template=target.value;return true;}
  const col=target?.dataset?.vc19318Column;if(col!==undefined){if(!METRICS[col])return false;const cfg=s.config;const next=target.checked?[...new Set([...cfg.columns,col])]:cfg.columns.filter(id=>id!==col);if(!next.length)return true;cfg.columns=next.slice(0,14);cfg.focus='';return true;}
  const key=target?.dataset?.vc19318Filter;if(!key||!['skill','group','set','rotation','phase','player','evaluation','zone','sort'].includes(key))return false;
  const draft={...s.config,[key]:target.value,focus:''};if(!sanitizeConfig(draft))return false;s.config=draft;return true;
 }
 async function handleFile({target,state,win,status}){if(!target?.dataset||target.dataset.vc19318Import===undefined)return false;const file=target.files?.[0];if(!file)return true;
  try{if(file.size>16000)throw Error('El JSON supera el tamaño máximo de 16 KB');const value=await file.text(),cfg=importJSON(value);savePreset(storage(win),cfg);const s=ensureState(state);s.config=cfg;s.template='saved:'+cfg.name;status?.('Plantilla importada y guardada localmente.');win.VC_PRO_ANALYSIS_19310_STATE?.refresh?.();}catch(e){status?.('No se pudo importar: '+e.message);}return true;
 }
 return {VERSION,STORAGE_KEY,SKILLS,GROUPS,METRICS,BUILTINS,defaultConfig,sanitizeConfig,readPresets,legacyPresets,savePreset,deletePreset,ensureState,sourceZone,rowContext,filterContacts,metrics,calc,csvCell,toCSV,importJSON,exportJSON,standaloneHTML,render,handleClick,handleChange,handleFile};
});
/* VC2075_SOURCE_END:200-vc19318-worksheets-reports-pro.js */
;
/* VC2075_SOURCE_BEGIN:201-vc19319-bench-client-pro.js */
/* Volley Coach V19.3.19 · Bench Client Pro
 * Read-only coach surface. Reads the same VC_SCOUT_VIDEO_BRIDGE matches as
 * the original bench; never writes to the bridge, scouting or cloud.
 * Client URL is a display route, NOT an authentication/permission token.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_BENCH_CLIENT_19319=api;if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.install(root),{once:true});
  else api.install(root);
 }}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19';
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validTeam=t=>t==='ours'||t==='opponent';
 const validScore=x=>x!==null&&x!==undefined&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=0;
 const score=x=>validScore(x)?String(Number(x)):'—';
 const validRotation=x=>x!==null&&x!==undefined&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=6?Number(x):null;
 const pct=(num,den)=>den>0?Math.round(num/den*1000)/10:null;
 const percent=x=>x===null?'—':`${x.toLocaleString('es-ES',{maximumFractionDigits:1})} %`;
 const name=a=>str(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||a?.playerId||a?.playerNumber)||'Sin identificar';
 const rating=a=>str(a?.evaluation||a?.ev);
 const winStat=(rallies,team)=>({n:rallies.length,won:rallies.filter(r=>r.winner===team).length,pct:pct(rallies.filter(r=>r.winner===team).length,rallies.length)});
 const phaseOf=(r,team)=>!validTeam(r?.servingBefore)?'—':r.servingBefore===team?'K2':'K1';
 function attackStat(actions){
  const recorded=arr(actions).filter(a=>a&&a.skill==='A');
  const rated=recorded.filter(a=>['#','+','!','-','/','='].includes(rating(a)));
  const kills=rated.filter(a=>rating(a)==='#').length,errors=rated.filter(a=>rating(a)==='=').length,blocks=rated.filter(a=>rating(a)==='/').length;
  return {n:recorded.length,rated:rated.length,kills,errors,blocks,kill:pct(kills,rated.length),eff:pct(kills-errors-blocks,rated.length)};
 }
 function normalizeOptions(options={}){
  const team=validTeam(options.team)?options.team:'ours';
  const limit=[5,10,20].includes(Number(options.limit))?Number(options.limit):10;
  const set=options.set==null||str(options.set)===''?'current':str(options.set);
  const rotation=validRotation(options.rotation)?validRotation(options.rotation):null;
  return {team,limit,set,rotation};
 }
 function snapshot(match,options={}){
  const cfg=normalizeOptions(options);
  const sets=arr(match?.sets).filter(Boolean),setIds=sets.map((s,i)=>({raw:s,key:str(s.number)||String(i+1),number:Number(s.number)||i+1}));
  const current=setIds.find(s=>str(match?.currentSet)===s.key)||setIds.at(-1)||null;
  const pairs=setIds.flatMap(s=>arr(s.raw.rallies).filter(Boolean).map((r,index)=>({set:s.number,setKey:s.key,index:index+1,r}))).filter(x=>x.r);
  const selected=cfg.set==='all'?pairs:cfg.set==='current'?pairs.filter(p=>p.setKey===current?.key):pairs.filter(p=>p.setKey===cfg.set);
  const filtered=cfg.rotation?selected.filter(p=>validRotation(cfg.team==='ours'?p.r.rotationBefore:p.r.opponentRotationBefore)===cfg.rotation):selected;
  const closed=filtered.filter(p=>validTeam(p.r.winner)), withServe=closed.filter(p=>validTeam(p.r.servingBefore));
  const k1=winStat(withServe.filter(p=>p.r.servingBefore!==cfg.team).map(p=>p.r),cfg.team),k2=winStat(withServe.filter(p=>p.r.servingBefore===cfg.team).map(p=>p.r),cfg.team);
  const recent=closed.slice(-cfg.limit).reverse();
  const teamActions=filtered.flatMap(p=>arr(p.r.actions).filter(a=>a?.team===cfg.team));
  const attacks=attackStat(teamActions);
  const reception=teamActions.filter(a=>a?.skill==='R'&&['#','+','!','-','/','='].includes(rating(a)));
  const positive=reception.filter(a=>['#','+'].includes(rating(a))).length;
  const attackers=new Map();
  for(const a of teamActions.filter(a=>a?.skill==='A')){const key=name(a);if(!attackers.has(key))attackers.set(key,[]);attackers.get(key).push(a);}
  const attackerStats=[...attackers].map(([player,actions])=>({player,...attackStat(actions)})).sort((a,b)=>b.n-a.n||a.player.localeCompare(b.player,'es',{numeric:true})).slice(0,12);
  const rotationRows=Array.from({length:6},(_,i)=>{
   const rotation=i+1,rr=closed.filter(p=>validRotation(cfg.team==='ours'?p.r.rotationBefore:p.r.opponentRotationBefore)===rotation);
   const serving=rr.filter(p=>validTeam(p.r.servingBefore));
   const base=filtered.filter(p=>validRotation(cfg.team==='ours'?p.r.rotationBefore:p.r.opponentRotationBefore)===rotation);
   const a=attackStat(base.flatMap(p=>arr(p.r.actions).filter(x=>x?.team===cfg.team)));
   return {rotation,n:rr.length,k1:winStat(serving.filter(p=>p.r.servingBefore!==cfg.team).map(p=>p.r),cfg.team),k2:winStat(serving.filter(p=>p.r.servingBefore===cfg.team).map(p=>p.r),cfg.team),attack:a};
  });
  const setWin=sets.filter(s=>s.finished===true&&s.winner==='ours').length;
  const setLost=sets.filter(s=>s.finished===true&&s.winner==='opponent').length;
  const currentScore=current?.raw?{
   ours:score(current.raw.scoreUs),opponent:score(current.raw.scoreOpponent),
   set:current.number,finished:!!current.raw.finished
  }:{ours:'—',opponent:'—',set:'—',finished:false};
  const streak=[];
  for(const p of pairs.slice().reverse()){
   if(p.set!==current?.number||!validTeam(p.r.winner))break;
   if(streak.length&&p.r.winner!==streak[0].r.winner)break;
   streak.push(p);
  }
  const warnings=[];
  if(streak.length>=3&&streak[0].r.winner!==cfg.team)warnings.push({level:'warn',title:`${streak.length} puntos seguidos del rival`,detail:'Racha observada en el set actual; revisar las jugadas antes de ajustar.'});
  if(k1.n>=6&&k1.pct!==null&&k1.pct<45)warnings.push({level:'warn',title:`Side-out K1 ${percent(k1.pct)}`,detail:`Muestra ${k1.won}/${k1.n} con saque previo conocido.`});
  if(attacks.rated>=6&&attacks.eff!==null&&attacks.eff<0)warnings.push({level:'note',title:`Eficiencia ofensiva ${percent(attacks.eff)}`,detail:`${attacks.rated} ataques evaluados; indicador descriptivo.`});
  if(!warnings.length)warnings.push({level:'note',title:'Sin señales automáticas destacadas',detail:'Los indicadores no sustituyen la revisión táctica del entrenador.'});
  return {cfg,current:current?.raw||null,currentScore,sets:setIds.map(s=>s.key),setWin,setLost,allPairs:pairs,closed,recent,withServe,k1,k2,attacks,reception:{rated:reception.length,positive,positivePct:pct(positive,reception.length)},rotationRows,attackerStats,teamActions,warnings,unknownServe:closed.length-withServe.length,matchName:str(match?.name||match?.opponent||match?.title||match?.id)||'Partido sin nombre',rival:str(match?.opponent||match?.opponentName)||'Rival',status:str(match?.status),updatedAt:match?.updatedAt||null};
 }
 function freshness(match,diag={},online=true,now=Date.now()){
  if(!online)return {kind:'offline',title:'Sin conexión',detail:'Datos locales. No se confirman los cambios del otro dispositivo.'};
  const sub=diag?.realtimeState==='SUBSCRIBED',ts=Date.parse(str(match?.updatedAt));
  const known=Number.isFinite(ts)&&ts>0&&ts<now+120000;
  const age=known?Math.max(0,now-ts):null;
  return {kind:sub?(known&&age>180000?'stale':'connected'):'pending',
   title:sub?'Canal Realtime conectado':'Nube sin confirmar',
   detail:(known?`Última modificación local: ${new Date(ts).toLocaleString('es-ES')} (${Math.floor(age/60000)} min).`:'Sin marca de actualización verificable.')+' La conexión no garantiza que el partido esté sincronizado.'};
 }
 function renderContent(data,health,selectedDetail=null){
  const kpi=(label,value,detail)=>`<article class="vc19319-kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`;
  const {cfg,currentScore}=data;
  const header=`<header class="vc19319-head"><div><small>VOLLEY COACH · V${VERSION}</small><h2>Bench Client Pro</h2><p>Centro de consulta para el cuerpo técnico · mismo scouting, sin modificarlo</p></div><div class="vc19319-buttons"><button type="button" data-vc19319-act="share">Copiar enlace de consulta</button><button type="button" data-vc19319-act="classic">Vista clásica</button></div></header>`;
  const controls=`<div class="vc19319-controls"><label>Equipo<select data-vc19319-field="team"><option value="ours"${cfg.team==='ours'?' selected':''}>Nuestro equipo</option><option value="opponent"${cfg.team==='opponent'?' selected':''}>Rival</option></select></label><label>Set<select data-vc19319-field="set"><option value="current"${cfg.set==='current'?' selected':''}>Set actual</option><option value="all"${cfg.set==='all'?' selected':''}>Todos los sets</option>${data.sets.map(s=>`<option value="${esc(s)}"${cfg.set===s?' selected':''}>Set ${esc(s)}</option>`).join('')}</select></label><label>Rotación<select data-vc19319-field="rotation"><option value="">Todas</option>${[1,2,3,4,5,6].map(r=>`<option value="${r}"${cfg.rotation===r?' selected':''}>R${r}</option>`).join('')}</select></label><label>Últimas jugadas<select data-vc19319-field="limit">${[5,10,20].map(x=>`<option value="${x}"${cfg.limit===x?' selected':''}>${x} rallies</option>`).join('')}</select></label><button type="button" data-vc19319-act="refresh">Actualizar ahora</button></div>`;
  const scorecard=`<section class="vc19319-scoreboard"><div><small>LOCAL</small><strong>Nuestro equipo</strong></div><div class="vc19319-tally"><span>${esc(currentScore.ours)}</span><i>–</i><span>${esc(currentScore.opponent)}</span><small>SET ${esc(currentScore.set)} · Sets ${data.setWin}–${data.setLost}${currentScore.finished?' · Finalizado':''}</small></div><div><small>VISITANTE</small><strong>${esc(data.rival)}</strong></div></section>`;
  const metrics=`<div class="vc19319-kpis">${kpi('K1 · Side-out',percent(data.k1.pct),`${data.k1.won}/${data.k1.n} rallies con saque conocido`)}${kpi('K2 · Break point',percent(data.k2.pct),`${data.k2.won}/${data.k2.n} rallies con saque conocido`)}${kpi('Eficiencia de ataque',percent(data.attacks.eff),`${data.attacks.rated}/${data.attacks.n} ataques valorados`)}${kpi('Recepción # / +',percent(data.reception.positivePct),`${data.reception.positive}/${data.reception.rated} recepciones evaluadas`)}${kpi('Rallies cerrados',data.closed.length,`${data.unknownServe} con saque sin identificar`)}</div>`;
  const rotations=`<section class="vc19319-panel"><h3>K1 / K2 por rotación</h3><div class="vc19319-table"><table><thead><tr><th>Rot.</th><th>Rallies</th><th>K1</th><th>K2</th><th>EFF ataque</th></tr></thead><tbody>${data.rotationRows.map(r=>`<tr><th>R${r.rotation}</th><td>${r.n}</td><td>${percent(r.k1.pct)} <small>${r.k1.won}/${r.k1.n}</small></td><td>${percent(r.k2.pct)} <small>${r.k2.won}/${r.k2.n}</small></td><td>${percent(r.attack.eff)} <small>${r.attack.rated} val.</small></td></tr>`).join('')}</tbody></table></div></section>`;
  const attackers=`<section class="vc19319-panel"><h3>Atacantes · rendimiento</h3><div class="vc19319-table"><table><thead><tr><th>Jugador</th><th>At.</th><th>Valorados</th><th>Kill %</th><th>EFF %</th></tr></thead><tbody>${data.attackerStats.map(a=>`<tr><th>${esc(a.player)}</th><td>${a.n}</td><td>${a.rated}</td><td>${percent(a.kill)}</td><td>${percent(a.eff)}</td></tr>`).join('')||'<tr><td colspan="5">Todavía no hay ataques codificados.</td></tr>'}</tbody></table></div></section>`;
  const recent=`<section class="vc19319-panel vc19319-recent"><h3>Últimas jugadas registradas</h3><div class="vc19319-rallylist">${data.recent.map((x,i)=>{const r=x.r,rot=validRotation(cfg.team==='ours'?r.rotationBefore:r.opponentRotationBefore);return `<button type="button" class="vc19319-rally ${r.winner===cfg.team?'won':'lost'}${selectedDetail===i?' active':''}" data-vc19319-rally="${i}"><b>S${x.set} · #${x.index}</b><strong>${score(r.scoreAfter?.us)} – ${score(r.scoreAfter?.opponent)}</strong><span>${r.winner===cfg.team?'Ganado':'Perdido'} · ${phaseOf(r,cfg.team)} · R${rot||'—'}</span><small>${arr(r.actions).length} contactos</small></button>`;}).join('')||'<p>Sin rallies cerrados para esta selección.</p>'}</div><div id="vc19319-details" class="vc19319-details">${selectedDetail!=null?detailMarkup(data.recent[selectedDetail]):'<p>Selecciona un rally para revisar sus contactos codificados.</p>'}</div></section>`;
  const cues=`<section class="vc19319-panel"><h3>Señales para revisar</h3>${data.warnings.map(x=>`<div class="vc19319-cue ${x.level}"><b>${esc(x.title)}</b><p>${esc(x.detail)}</p></div>`).join('')}<p class="vc19319-disclaimer">Solo observaciones de los datos registrados; ninguna señal es una recomendación automática de cambio.</p></section>`;
  return `${header}<div class="vc19319-freshness ${esc(health.kind)}"><strong>${esc(health.title)}</strong><span>${esc(health.detail)}</span></div>${controls}${scorecard}${metrics}<div class="vc19319-grid">${recent}<div class="vc19319-stats">${rotations}${attackers}${cues}</div></div><p class="vc19319-foot">Las puntuaciones se muestran únicamente cuando están registradas. Los puntos no se calculan a partir de las valoraciones de ataque. El enlace de consulta no da acceso a una cuenta: debes iniciar sesión y sincronizar el equipo correspondiente.</p><p class="vc19319-status" role="status" aria-live="polite"></p>`;
 }
 function detailMarkup(pair){
  if(!pair)return '<p>La jugada ya no está disponible.</p>';
  const r=pair.r,rows=arr(r.actions);
  return `<div class="vc19319-detailhead"><strong>Set ${pair.set} · Rally ${pair.index}</strong><span>${rows.length} contactos codificados</span></div><div class="vc19319-actions">${rows.map(a=>`<div><b>${esc(str(a.skill)||'—')}${esc(rating(a))}</b><span>${esc(a.team==='ours'?'Nuestro':a.team==='opponent'?'Rival':'Sin equipo')} · ${esc(name(a))}</span><small>${esc(str(a.code)||'Sin código')}</small></div>`).join('')||'<p>Sin contactos registrados.</p>'}</div>${rows.some(a=>a&&a.id!=null&&r.id!=null)?'<button type="button" data-vc19319-act="review">Revisar acciones en Video Analytics</button>':''}`;
 }
 function linkForView(href){const u=new URL(href);u.searchParams.set('banquillo','1');u.searchParams.set('modo','consulta');u.searchParams.set('bench','pro');u.hash='';return u.toString();}
 function videoKeys(pair){
  if(!pair?.r||pair.r.id==null)return [];
  return arr(pair.r.actions).filter(a=>a&&a.id!=null&&a.id!=='').map(a=>`a:${pair.set}:${pair.r.id}:${a.id}`);
 }
 function install(win){
  const doc=win?.document,bench=doc?.getElementById('vc155-bench'),bar=bench?.querySelector('.vc155-toolbar');
  if(!bench||!bar||bench.dataset.vc19319Installed==='1')return false;
  bench.dataset.vc19319Installed='1';
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='vc19319-switch';toggle.id='vc19319-open';toggle.textContent='Bench Client Pro';bar.appendChild(toggle);
  const panel=doc.createElement('section');panel.id='vc19319-root';panel.setAttribute('aria-label','Bench Client Pro');panel.hidden=true;bar.insertAdjacentElement('afterend',panel);
  const opts={team:'ours',set:'current',rotation:null,limit:10};
  let active=false,lastSignature='',selectedDetail=null,currentData=null,currentMatch=null,lastRenderedAt=0;
  const bridge=()=>win.VC_SCOUT_VIDEO_BRIDGE;
  function chosen(){const all=arr(bridge()?.getMatches?.());const id=str(doc.getElementById('vc155-match')?.value);return all.find(m=>str(m?.id)===id)||all.find(m=>str(m?.id)===str(bridge()?.getActiveId?.()))||null;}
  function setActive(on){active=!!on;bench.classList.toggle('vc19319-pro-open',active);panel.hidden=!active;toggle.textContent=active?'Vista clásica':'Bench Client Pro';
   if(active)refresh(true);
   try{const u=new URL(win.location.href);if(active)u.searchParams.set('bench','pro');else u.searchParams.delete('bench');win.history.replaceState(null,'',u);}catch(_){}
  }
  function refresh(force=false){
   if(!active||!bench.classList.contains('active')||doc.hidden)return;
   const match=chosen();const diag=win.VC_DEVICE_SYNC?.diagnostics?.()||{},health=freshness(match,diag,win.navigator?.onLine!==false);
   if(!match){panel.innerHTML='<p class="vc19319-empty">No hay un partido disponible. Comprueba la cuenta, el equipo activo y la sincronización.</p>';lastSignature='';currentData=null;currentMatch=null;return;}
   const signature=JSON.stringify([str(bridge()?.getTeamId?.()),match.id,match.name,match.opponent,match.opponentName,match.updatedAt,match.currentSet,match.status,
    ...arr(match.sets).map(s=>[s.number,s.scoreUs,s.scoreOpponent,s.finished,s.winner,...arr(s.rallies).map(r=>[r.id,r.winner,r.servingBefore,r.rotationBefore,r.opponentRotationBefore,r.scoreAfter?.us,r.scoreAfter?.opponent,...arr(r.actions).map(a=>[a.id,a.team,a.skill,a.evaluation,a.playerNumberSnapshot,a.playerNameSnapshot,a.playerLabel,a.playerId,a.playerNumber,a.code])])]),
    opts.team,opts.set,opts.rotation,opts.limit,health.kind,health.title,Math.floor(win.Date.now()/60000)]);
   if(!force&&signature===lastSignature)return;lastSignature=signature;
   currentMatch=match;currentData=snapshot(match,opts);
   if(selectedDetail!=null&&selectedDetail>=currentData.recent.length)selectedDetail=null;
   panel.innerHTML=renderContent(currentData,health,selectedDetail);lastRenderedAt=win.Date.now();
  }
  toggle.addEventListener('click',()=>setActive(!active));
  panel.addEventListener('change',e=>{const field=e.target?.dataset?.vc19319Field;if(!field)return;
   if(field==='team')opts.team=validTeam(e.target.value)?e.target.value:'ours';
   else if(field==='set')opts.set=['all','current',...arr(currentData?.sets)].includes(e.target.value)?e.target.value:'current';
   else if(field==='rotation')opts.rotation=validRotation(e.target.value);
   else if(field==='limit')opts.limit=[5,10,20].includes(Number(e.target.value))?Number(e.target.value):10;
   selectedDetail=null;refresh(true);
  });
  panel.addEventListener('click',async e=>{
   const target=e.target?.closest?.('button');if(!target)return;
   if(target.dataset.vc19319Rally!==undefined){const i=Number(target.dataset.vc19319Rally);if(!Number.isInteger(i)||!currentData?.recent[i])return;selectedDetail=i;panel.querySelectorAll('[data-vc19319-rally]').forEach(b=>b.classList.toggle('active',Number(b.dataset.vc19319Rally)===i));panel.querySelector('#vc19319-details').innerHTML=detailMarkup(currentData.recent[i]);return;}
   const action=target.dataset.vc19319Act;
   if(action==='classic'){setActive(false);return;}
   if(action==='refresh'){refresh(true);return;}
   if(action==='share'){
    const link=linkForView(win.location.href);const status=panel.querySelector('.vc19319-status');
    try{await win.navigator.clipboard.writeText(link);if(status)status.textContent='Enlace copiado. Requiere la misma cuenta/equipo; no otorga permisos.';}
    catch(_){win.prompt?.('Copia el enlace:',link);if(status)status.textContent='El enlace no otorga permisos de acceso.';}
   }
   if(action==='review'){
    const pair=currentData?.recent?.[selectedDetail];const keys=videoKeys(pair);const status=panel.querySelector('.vc19319-status');
    if(doc.body.classList.contains('v158-view-only')){if(status)status.textContent='En modo consulta, utiliza los códigos del rally para revisar el vídeo desde el dispositivo del analista.';return;}
    if(!keys.length||!currentMatch?.id||typeof win.VC_VIDEO_ANALYTICS_1612?.openKeys!=='function'){
     if(status)status.textContent='No hay acciones identificadas para abrir en Video Analytics.';return;
    }
    const result=win.VC_VIDEO_ANALYTICS_1612.openKeys(currentMatch.id,keys);
    if(status)status.textContent=result?'Acciones abiertas. El vídeo requiere una fuente disponible en este dispositivo.':'No se pudieron abrir las acciones.';
   }
  });
  doc.getElementById('vc155-match')?.addEventListener('change',()=>{selectedDetail=null;lastSignature='';refresh(true)});
  doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)refresh(true)});
  win.addEventListener('focus',()=>refresh(true));
  const observer=new win.MutationObserver(()=>{if(bench.classList.contains('active')&&active)refresh(true)});
  observer.observe(bench,{attributes:true,attributeFilter:['class']});
  const loop=()=>{if(active&&bench.classList.contains('active')&&!doc.hidden)refresh();win.setTimeout(loop,active?2500:12000);};
  win.setTimeout(loop,2500);
  try{if(new URL(win.location.href).searchParams.get('bench')==='pro')setActive(true);}catch(_){}
  win.VC_BENCH_CLIENT_19319_CONTROLLER={refresh,setActive,diagnostics:()=>({version:VERSION,installed:true,active,matchId:currentMatch?.id||null,renderedAt:lastRenderedAt,readOnly:true})};
  return true;
 }
 return {VERSION,normalizeOptions,snapshot,attackStat,freshness,phaseOf,linkForView,videoKeys,renderContent,detailMarkup,install};
});
/* VC2075_SOURCE_END:201-vc19319-bench-client-pro.js */
;
