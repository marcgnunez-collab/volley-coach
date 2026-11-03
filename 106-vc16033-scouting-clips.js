(()=>{
'use strict';
// V16.0.3.3 · Match-scoped clip catalogue. Does not modify scouting scores or sync engine.
const VERSION='16.0.3.3', $=id=>document.getElementById(id), A=x=>Array.isArray(x)?x:[];
const root=$('scout-video-hub'),panel=$('vc-clip33');if(!root||!panel)return;
const state={in:null,out:null,exporting:false,playingId:null,lastMatch:'',refreshKey:'',error:''};
const finite=x=>(x===null||x===undefined||x==='')?null:(Number.isFinite(Number(x))?Number(x):null);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fmt=t=>{if(!Number.isFinite(t))return '—';t=Math.max(0,t);let h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=(t%60).toFixed(1).padStart(4,'0');return (h?`${String(h).padStart(2,'0')}:`:'')+`${String(m).padStart(2,'0')}:${s}`};
const activeSource=()=>['live','delay','youtube','local'].find(k=>$('v117-review-source-'+k)?.classList.contains('active'))||'local';
const api=()=>window.VC_VIDEO_REVIEW_API||{};
const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||{};
const allMatches=()=>{try{return A(bridge().getMatches?.())}catch(_){return []}};
const match=()=>{const id=Number($('v780-match')?.value)||Number(bridge().getActiveId?.());return allMatches().find(x=>Number(x.id)===id)||null};
const rows=()=>{try{return A(api().timeline?.())}catch(_){return []}};
const media=()=>{try{return window.v780Diagnostics?.()||{}}catch(_){return {}}};
const video=()=>$('v780-player-video');
function clips(m=match()){if(!m)return[];return A(m.video?.clips)}
function notify(message,bad=false){const node=$('vc-clip33-status');if(node){node.textContent=message;node.dataset.bad=bad?'1':'0'}state.error=bad?message:''}
function persist(m){if(!m)return false;try{const save=bridge().save;if(typeof save!=='function')throw new Error('Motor de guardado no disponible');m.updatedAt=new Date().toISOString();save();return true}catch(e){console.error('VC clip save failed',e);notify('Error al guardar el clip: '+String(e?.message||e),true);return false}}
function ensureClips(m){if(!m)return null;if(!m.video||typeof m.video!=='object')m.video={};if(!Array.isArray(m.video.clips))m.video.clips=[];return m.video.clips}
function mapped(m,ms){const v=finite(m?.video?.syncOffset),t=finite(ms);return v===null||t===null?null:Math.max(0,t/1000+v)}
function actionTime(a,m){for(const k of ['videoTimestamp','liveVideoTime','videoAction','videoTime']){const t=finite(a?.[k]);if(t!==null&&t>=0)return t}return mapped(m,a?.scoutMs)}
function timeRange(r,m){if(!r||!m)return null;
 const pre=r.type==='action'?8:Math.max(0,finite(m.video?.preRoll)??2),post=r.type==='action'?5:Math.max(0,finite(m.video?.postRoll)??2);
 if(r.type==='action'){const t=actionTime(r.a,m);return t===null?null:{start:Math.max(0,t-pre),end:t+post,center:t,exact:finite(r.a?.videoTimestamp)!==null}}
 if(r.type==='rally'){
  const stamps=A(r.r?.actions).map(a=>actionTime(a,m)).filter(t=>t!==null);
  if(stamps.length){const start=Math.min(...stamps),end=Math.max(...stamps);return{start:Math.max(0,start-pre),end:end+post,center:start,exact:true}}
  const s=mapped(m,r.ms),e=mapped(m,r.endMs);return s===null||e===null?null:{start:Math.max(0,s-pre),end:e+post,center:s,exact:false};
 }
 return null;
}
function selectedRow(){const active=$('v780-timeline')?.querySelector('.v780-row.selected')?.dataset?.key;return rows().find(r=>r.key===active)||null}
function clipForRow(r,m){const range=timeRange(r,m);if(!range||!Number.isFinite(range.start)||!Number.isFinite(range.end)||range.end-range.start<.15)return null;
 return {id:`vc33_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,name:String(r.label||'Jugada').slice(0,120),tag:r.team==='opponent'?'opponent':r.type==='action'?'technical':'general',note:String(r.copy||'').slice(0,300),start:range.start,end:range.end,duration:range.end-range.start,sourceKey:String(r.key),type:r.type,set:r.set??null,team:r.team||'',skill:r.skill||'',evaluation:r.evaluation||'',player:r.player||'',createdAt:new Date().toISOString(),source:String(m.video?.source||''),videoTimestamp:range.center,auto:true,scoutingLinked:true};
}
function addClip(c,m){const list=ensureClips(m);if(!list)return false;if(c.sourceKey&&list.some(x=>String(x.sourceKey)===c.sourceKey)){notify('Este rally o acción ya tiene un clip guardado.');return false}list.push(c);if(!persist(m)){list.pop();return false}notify(`Clip guardado · ${fmt(c.start)}–${fmt(c.end)}`);render(true);return true}
function createFromRow(key){const m=match(),r=rows().find(x=>x.key===key);if(!m||!r){notify('Selecciona un rally o una acción del partido.',true);return false}const c=clipForRow(r,m);if(!c){notify('Falta tiempo de vídeo. Sincroniza el partido o registra timestamps antes de crear el clip.',true);return false}return addClip(c,m)}
function visibleRows(){const keys=new Set([...($('v780-timeline')?.querySelectorAll('.v780-row[data-key]')||[])].map(el=>el.dataset.key));return rows().filter(r=>keys.has(r.key))}
function createVisible(){const m=match();if(!m){notify('Selecciona un partido.',true);return 0}const list=ensureClips(m),seen=new Set(list.map(c=>String(c.sourceKey||'')).filter(Boolean));let added=0,missing=0;for(const r of visibleRows()){if(seen.has(r.key))continue;const c=clipForRow(r,m);if(!c){missing++;continue}list.push(c);seen.add(r.key);added++}if(added&&!persist(m))list.splice(-added,added);else render(true);notify(`${added} clips creados${missing?` · ${missing} sin timestamp`:''}`);return added}
function sourceReady(){const d=media(),source=activeSource();return !!d.videoLoaded&&(source==='local'||source==='youtube')&&((d.mediaType==='youtube')===(source==='youtube'))}
function captureMark(which){if(!sourceReady()){notify('Abre el archivo o YouTube del partido. LIVE y DELAY temporal no sirven para marcar un clip exportable.',true);return}const t=finite(api().currentTime?.());if(t===null){notify('No se puede leer la posición del vídeo.',true);return}state[which]=t;updateMarks();notify(`Marca ${which.toUpperCase()} en ${fmt(t)}`)}
function updateMarks(){const i=$('vc-clip33-in'),o=$('vc-clip33-out');if(i)i.textContent=fmt(state.in);if(o)o.textContent=fmt(state.out)}
function createManual(){const m=match(),a=finite(state.in),b=finite(state.out);if(!m){notify('Selecciona un partido.',true);return false}if(a===null||b===null||b-a<.15){notify('Marca IN y OUT en ese orden. Debe haber al menos 0,15 s.',true);return false}const c={id:`vc33_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,name:`Clip manual · ${fmt(a)}`,tag:'general',note:'Marcado desde Video Review',start:a,end:b,duration:b-a,sourceKey:null,type:'manual',set:finite($('v780-set')?.value),team:'',skill:'',evaluation:'',player:'',createdAt:new Date().toISOString(),source:String(m.video?.source||''),auto:false};const ok=addClip(c,m);if(ok){state.in=null;state.out=null;updateMarks()}return ok}
function createFromRecordingMarker(marker,session){
 const m=match();if(!m||!session||!marker){notify('Selecciona el partido de la grabación antes de crear el clip.',true);return false}
 if(session.match?.id&&Number(session.match.id)!==Number(m.id)){
  notify('La grabación y el partido seleccionado no coinciden.',true);return false;
 }
 const time=finite(marker.ms);if(time===null||time<0){notify('La marca no tiene una posición de vídeo válida.',true);return false}
 const duration=finite(session.durationMs);const start=Math.max(0,time/1000-8),end=Math.max(start+.15,Math.min(duration===null?Infinity:duration/1000,time/1000+5));
 const sourceKey=`rec:${String(session.id)}:${Math.round(time)}`;
 if(clips(m).some(c=>c.sourceKey===sourceKey)){notify('Esta marca ya tiene un clip vinculado.');return false}
 const name=String(marker.label||'Momento REC').slice(0,100);
 return addClip({id:`vc34_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,name,tag:'general',
 note:`Marca de grabación · ${String(session.filename||'sesión').slice(0,90)}`,start,end,duration:end-start,
 sourceKey,type:'manual',set:null,team:'',skill:'',evaluation:'',player:'',
 recordingId:String(session.id),createdAt:new Date().toISOString(),source:String(session.filename||''),auto:false,
 scoutingLinked:true},m)
}
function play(c){if(!sourceReady()){notify('Carga el archivo o YouTube vinculado al partido y selecciona su pestaña antes de reproducir.',true);return false}if(!Number.isFinite(Number(c.start))||!Number.isFinite(Number(c.end))||Number(c.end)<=Number(c.start)){notify('Intervalo de clip no válido.',true);return false}const t=Number(c.start),span=Number(c.end)-t;state.playingId=c.id;try{const ok=window.v780OpenAt?.(t,String(c.sourceKey||''),{pre:0,post:span});if(ok===false){state.playingId=null;return false}notify(`Reproduciendo ${String(c.name||'clip')} · ${fmt(t)}–${fmt(t+span)}`);return true}catch(e){state.playingId=null;notify('No se pudo reproducir este clip.',true);return false}}
function remove(c){const m=match();if(!m||!window.confirm(`¿Eliminar “${c.name||'clip'}” de este partido?`))return false;const list=ensureClips(m),index=list.findIndex(x=>String(x.id)===String(c.id));if(index<0)return false;const old=list.splice(index,1)[0];if(!persist(m)){list.splice(index,0,old);return false}notify('Clip eliminado.');render(true);return true}
function csvValue(value){let s=String(value??'');if(/^[\s]*[=+@\-]/.test(s))s="'"+s;return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function download(blob,filename){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function downloadCSV(){const m=match();if(!m||!clips(m).length){notify('No hay clips para exportar.',true);return}const keys=['id','name','type','set','team','skill','evaluation','player','start','end','duration','sourceKey','source','note'];const data=[keys.map(csvValue).join(',')].concat(clips(m).map(c=>keys.map(k=>csvValue(c[k])).join(','))).join('\r\n');download(new Blob(['\uFEFF',data],{type:'text/csv;charset=utf-8'}),`volley_clips_${m.id}.csv`);notify('Catálogo de clips CSV exportado; no incluye el vídeo.')}
function waitEvent(el,event,timeout=10000){return new Promise((resolve,reject)=>{let tid;const clean=()=>{clearTimeout(tid);el.removeEventListener(event,good);el.removeEventListener('error',bad)};const good=()=>{clean();resolve()};const bad=()=>{clean();reject(new Error('Error cargando el vídeo'))};el.addEventListener(event,good,{once:true});el.addEventListener('error',bad,{once:true});tid=setTimeout(()=>{clean();reject(new Error('Tiempo de espera agotado'))},timeout)})}
async function exportWebM(c){
 if(state.exporting)return;
 const d=media(),source=activeSource(),v=video(),secs=Number(c.end)-Number(c.start);
 if(source!=='local'||d.mediaType==='youtube'||!d.videoLoaded||!v?.currentSrc){notify('WebM solo disponible para vídeo local o grabaciones cargadas de este partido.',true);return false}
 if(!Number.isFinite(secs)||secs<.15||secs>120){notify('La exportación WebM admite clips de 0,15 a 120 segundos.',true);return false}
 if(typeof MediaRecorder==='undefined'||typeof (document.createElement('video').captureStream||document.createElement('video').mozCaptureStream)!=='function'){notify('Este navegador no admite recortar a WebM. El clip y su CSV siguen disponibles.',true);return false}
 const mime=['video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported?.(t));if(!mime){notify('No hay códec WebM compatible.',true);return false}
 state.exporting=true;let shadow=null,rec=null,stream=null,ticker=null;
 try{
  shadow=document.createElement('video');shadow.muted=true;shadow.playsInline=true;shadow.preload='auto';shadow.style.cssText='position:fixed;bottom:0;right:0;width:1px;height:1px;opacity:.001;pointer-events:none;z-index:-1';document.body.appendChild(shadow);
  const ready=waitEvent(shadow,'loadedmetadata');shadow.src=v.currentSrc;await ready;
  const end=Math.min(Number(c.end),Number(shadow.duration)||Number(c.end)),start=clamp(Number(c.start),0,Math.max(0,end-.15));if(end-start<.15)throw Error('El intervalo está fuera de la duración del archivo.');
  if(Math.abs(shadow.currentTime-start)>.05){const seek=waitEvent(shadow,'seeked');shadow.currentTime=start;await seek}
  stream=(shadow.captureStream||shadow.mozCaptureStream).call(shadow);const chunks=[];rec=new MediaRecorder(stream,{mimeType:mime});rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  const stop=new Promise(resolve=>rec.addEventListener('stop',resolve,{once:true}));rec.start(250);
  notify(`Exportando WebM (${fmt(end-start)}). El archivo se genera en tiempo real…`);
  await shadow.play();await new Promise((resolve,reject)=>{
    const done=()=>{clearInterval(ticker);shadow.removeEventListener('error',err);resolve()};const err=()=>{clearInterval(ticker);reject(Error('Error leyendo vídeo'))};shadow.addEventListener('error',err,{once:true});
    const begun=Date.now();ticker=setInterval(()=>{if(shadow.currentTime>=end-.06||shadow.ended){done();return}if(Date.now()-begun>Math.max(15000,(end-start+8)*3500)){clearInterval(ticker);reject(Error('La exportación ha excedido el tiempo permitido'))}},90);
  });
  shadow.pause();if(rec.state!=='inactive')rec.stop();await stop;
  const blob=new Blob(chunks,{type:'video/webm'});if(!blob.size)throw Error('El navegador no ha generado un archivo de vídeo');
  const safe=String(c.name||'clip').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,60)||'clip';download(blob,`${safe}.webm`);notify('WebM exportado correctamente.');return true;
 }catch(e){console.warn('VC 16.0.3.3 export',e);notify('No se pudo exportar el vídeo: '+String(e.message||e)+'. La referencia del clip sigue guardada.',true);return false}
 finally{clearInterval(ticker);try{if(rec?.state==='recording')rec.stop()}catch(_){}try{stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}if(shadow){try{shadow.pause();shadow.removeAttribute('src');shadow.load()}catch(_){}shadow.remove()}state.exporting=false;render(true)}
}
function button(text,kind,onClick,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=`vc-clip33-btn ${kind||''}`;b.disabled=disabled;b.addEventListener('click',onClick);return b}
function render(force=false){if(!root.classList.contains('active')&&!force)return;
 const m=match(),id=String(m?.id||''),items=clips(m),filter=$('vc-clip33-filter')?.value||'all',q=String($('vc-clip33-search')?.value||'').trim().toLowerCase();
 if(state.lastMatch!==id){state.lastMatch=id;state.in=null;state.out=null;updateMarks();state.playingId=null}
 const count=$('vc-clip33-count');if(count)count.textContent=`${items.length} clips en este partido`;
 const list=$('vc-clip33-list');if(!list)return;list.replaceChildren();
 const visible=items.filter(c=>(filter==='all'||(filter==='rally'&&c.type==='rally')||(filter==='action'&&c.type==='action')||(filter==='manual'&&c.type==='manual'))&&(!q||`${c.name||''} ${c.player||''} ${c.skill||''} ${c.note||''}`.toLowerCase().includes(q))).slice().sort((a,b)=>Number(a.start)-Number(b.start));
 if(!m||!visible.length){const empty=document.createElement('p');empty.className='vc-clip33-empty';empty.textContent=!m?'Selecciona un partido.':items.length?'No hay clips para este filtro.':'No hay clips todavía. Selecciona una acción del scouting o usa IN / OUT.';list.appendChild(empty);return}
 for(const c of visible){const card=document.createElement('article');card.className='vc-clip33-card';const desc=document.createElement('div');desc.className='vc-clip33-info';const title=document.createElement('strong');title.textContent=String(c.name||'Clip');const sub=document.createElement('span');sub.textContent=`${fmt(Number(c.start))} → ${fmt(Number(c.end))} · ${fmt(Number(c.duration)||Number(c.end)-Number(c.start))} · ${c.type==='rally'?'Rally':c.type==='action'?'Acción':'Manual'}${c.player?' · '+c.player:''}`;const note=document.createElement('small');note.textContent=String(c.note||'');desc.append(title,sub,note);const actions=document.createElement('div');actions.className='vc-clip33-actions';actions.append(button('▶ Ver','primary',()=>play(c)),button('WebM','',()=>exportWebM(c),state.exporting),button('Eliminar','danger',()=>remove(c),state.exporting));card.append(desc,actions);list.appendChild(card)}
}
// All public actions are scoped to Video Review's selected match, not the separate V7.2 modal.
window.VC_SCOUT_CLIPS_PRO={version:VERSION,createFromKey:createFromRow,createSelected:()=>{const r=selectedRow();return r?createFromRow(r.key):(notify('Selecciona un rally o una acción de la línea temporal.',true),false)},createVisible,createFromRecordingMarker,markIn:()=>captureMark('in'),markOut:()=>captureMark('out'),createManual,exportCSV:downloadCSV,play:id=>{const c=clips().find(x=>String(x.id)===String(id));return c?play(c):false},list:()=>clips().map(c=>({...c})),refresh:()=>render(true),diagnostics:()=>({version:VERSION,matchId:match()?.id||null,clips:clips().length,source:activeSource(),videoReady:sourceReady(),exporting:state.exporting})};
$('vc-clip33-selected')?.addEventListener('click',()=>window.VC_SCOUT_CLIPS_PRO.createSelected());
$('vc-clip33-filtered')?.addEventListener('click',createVisible);
$('vc-clip33-in-button')?.addEventListener('click',()=>captureMark('in'));
$('vc-clip33-out-button')?.addEventListener('click',()=>captureMark('out'));
$('vc-clip33-manual')?.addEventListener('click',createManual);
$('vc-clip33-csv')?.addEventListener('click',downloadCSV);
for(const k of ['vc-clip33-filter','vc-clip33-search']){const e=$(k);e?.addEventListener(k.endsWith('search')?'input':'change',()=>render(true))}
$('v780-match')?.addEventListener('change',()=>setTimeout(()=>render(true),0));
// Route the existing 'Clip −8/+5' buttons into the same deduplicated catalogue.
if(typeof window.v780CreateClip==='function')window.v780CreateClip=key=>createFromRow(String(key||''));
const oldRender=window.v780Render;if(typeof oldRender==='function')window.v780Render=function(...args){const result=oldRender.apply(this,args);render();return result};
// Modest polling only while video view is visible. External tabs may update the match in place.
setInterval(()=>{if(!root.classList.contains('active'))return;const m=match(),cl=clips(m),signature=[m?.id||'',cl.length,cl.map(x=>x.id+':'+x.start+':'+x.end).join('|')].join('/');if(signature!==state.refreshKey){state.refreshKey=signature;render()}},2200);
render(true);
})();
