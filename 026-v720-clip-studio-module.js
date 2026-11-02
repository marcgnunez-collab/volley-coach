
(()=>{
'use strict';

const VERSION='7.2.0';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const TAGS={general:'General',highlights:'Highlights',technical:'Técnico',tactical:'Táctico',player:'Jugador',opponent:'Rival',error:'Corrección / error'};
const state={in:null,out:null,playingClipId:null,playlist:[],playlistIndex:-1,playlistStop:null,exporting:false};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return Number(bridge()?.getActiveId?.())||0}catch(_){return 0}}
function currentMatch(){
  const id=Number($('scout-v700-match')?.value)||activeId();
  return matches().find(m=>Number(m.id)===id)||null;
}
function video(){return $('scout-v700-player')}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function playerLabel(a){try{return bridge()?.playerLabel?.(a)||String(a?.playerLabel||a?.playerNameSnapshot||a?.playerNumberSnapshot||'Jugador')}catch(_){return 'Jugador'}}
function save(){
  const m=currentMatch();
  if(m){m.updatedAt=new Date().toISOString();m.dataVersion=VERSION}
  try{bridge()?.save?.()}catch(err){console.error('V7.2 clip save',err)}
}
function meta(m){
  if(!m)return null;
  const raw=m.video&&typeof m.video==='object'?m.video:{};
  m.video={...raw,clips:arr(raw.clips)};
  return m.video;
}
function clips(m=currentMatch()){return meta(m)?.clips||[]}
function fmt(s){
  if(s==null||!Number.isFinite(Number(s)))return '—';
  s=Math.max(0,Number(s));const mm=Math.floor(s/60),ss=s-mm*60;
  return `${String(mm).padStart(2,'0')}:${ss.toFixed(1).padStart(4,'0')}`;
}
function durationText(s){if(!Number.isFinite(Number(s)))return '—';return `${Math.max(0,Number(s)).toFixed(1)} s`}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function slug(v){return String(v||'clip').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'clip'}
function id(){return `clip_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}
function stampStatus(msg,kind=''){
  const el=$('scout-v720-status');if(!el)return;
  el.textContent=msg||'';el.className=`scout-v720-status ${kind||''}`;
  if(msg)setTimeout(()=>{if(el.textContent===msg){el.textContent='';el.className='scout-v720-status'}},3500);
}
function downloadBlob(blob,name){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function downloadText(text,name,type='text/plain;charset=utf-8'){
  downloadBlob(new Blob([text],{type}),name);
}
function mapped(m,ms){
  const x=meta(m);return x?.syncOffset==null?null:Math.max(0,(Number(ms)||0)/1000+Number(x.syncOffset));
}
function rallyStartMs(r){
  const a=arr(r?.actions);
  return a.length?(Number(a[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0);
}
function rallyEndMs(r){
  const a=arr(r?.actions);
  return a.length?(Number(a[a.length-1].scoutMs)||Number(r?.scoutEndMs)||rallyStartMs(r)):(Number(r?.scoutEndMs)||rallyStartMs(r));
}
function findByKey(key,m=currentMatch()){
  if(!m)return null;
  const p=String(key||'').split(':');
  if(p[0]==='r'){
    const setNo=Number(p[1]),rid=Number(p[2]),s=arr(m.sets).find(x=>Number(x.number)===setNo),r=arr(s?.rallies).find(x=>Number(x.id)===rid);
    if(!r)return null;
    const pre=Math.max(0,Number(meta(m)?.preRoll??2)),post=Math.max(0,Number(meta(m)?.postRoll??2));
    const a=mapped(m,rallyStartMs(r)),b=mapped(m,rallyEndMs(r));
    return a==null||b==null?null:{
      key,type:'rally',set:setNo,start:Math.max(0,a-pre),end:b+post,
      name:`Set ${setNo} · Rally ${arr(s.rallies).findIndex(x=>Number(x.id)===rid)+1}`,
      note:`${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${r.scoreAfter?.us??0}-${r.scoreAfter?.opponent??0}`,
      team:r.winner==='ours'?'ours':'opponent'
    };
  }
  if(p[0]==='a'){
    const setNo=Number(p[1]),rid=Number(p[2]),aid=Number(p[3]),s=arr(m.sets).find(x=>Number(x.number)===setNo);
    let r=arr(s?.rallies).find(x=>Number(x.id)===rid);
    if(!r&&Number(m.liveRally?.id)===rid)r=m.liveRally;
    const a=arr(r?.actions).find(x=>Number(x.id)===aid);if(!a)return null;
    const x=meta(m),center=a.videoAction!=null?Number(a.videoAction):mapped(m,a.scoutMs);
    let start=a.videoStart!=null?Number(a.videoStart):(center==null?null:Math.max(0,center-Math.max(0,Number(x?.preRoll??2))));
    let end=a.videoEnd!=null?Number(a.videoEnd):(center==null?null:center+Math.max(0,Number(x?.postRoll??2)));
    if(start==null||end==null)return null;
    return {
      key,type:'action',set:setNo,start,end,
      name:`${SKILLS[a.skill]||a.skill||'Acción'} · ${playerLabel(a)}`,
      note:`${a.code||''}${a.evaluation?` · ${a.evaluation}`:''}`,
      team:a.team==='opponent'?'opponent':'ours',skill:a.skill||'',evaluation:a.evaluation||'',player:playerLabel(a)
    };
  }
  if(p[0]==='e'){
    const uid=p.slice(1).join(':'),events=[...arr(m.workflow?.events),...arr(m.events)],e=events.find(x=>String(x.uid||x.id)===uid);
    if(!e)return null;
    const center=e.videoTime!=null?Number(e.videoTime):mapped(m,e.scoutMs);if(center==null)return null;
    const pre=Math.max(0,Number(meta(m)?.preRoll??2)),post=Math.max(0,Number(meta(m)?.postRoll??2));
    return {key,type:'event',set:Number(e.setNumber)||null,start:Math.max(0,center-pre),end:center+post,name:String(e.type||'Evento'),note:e.note||'',team:''};
  }
  return null;
}
function normalizeRange(start,end){
  start=Number(start);end=Number(end);
  if(!Number.isFinite(start)||!Number.isFinite(end))return null;
  if(end<start)[start,end]=[end,start];
  if(end-start<0.15)return null;
  const v=video();if(Number.isFinite(v?.duration)){start=Math.max(0,Math.min(start,v.duration));end=Math.max(0,Math.min(end,v.duration))}
  return {start,end};
}
function createClip(data,quiet=false){
  const m=currentMatch();if(!m){if(!quiet)alert('Selecciona un scouting.');return null}
  const x=meta(m),range=normalizeRange(data.start,data.end);
  if(!range){if(!quiet)alert('El clip necesita un intervalo IN–OUT válido.');return null}
  const clip={
    id:id(),name:String(data.name||`Clip ${clips(m).length+1}`).trim()||`Clip ${clips(m).length+1}`,
    tag:String(data.tag||'general'),note:String(data.note||'').trim(),
    start:range.start,end:range.end,duration:range.end-range.start,
    sourceKey:data.sourceKey||null,type:data.type||'manual',set:data.set??null,team:data.team||'',
    skill:data.skill||'',evaluation:data.evaluation||'',player:data.player||'',
    createdAt:new Date().toISOString(),source:x?.source||''
  };
  x.clips.push(clip);save();render();
  if(!quiet)stampStatus(`Clip guardado · ${durationText(clip.duration)}`,'good');
  return clip;
}
function renderMarkers(){
  if($('scout-v720-in'))$('scout-v720-in').textContent=fmt(state.in);
  if($('scout-v720-out'))$('scout-v720-out').textContent=fmt(state.out);
  const r=normalizeRange(state.in,state.out);
  if($('scout-v720-duration'))$('scout-v720-duration').textContent=r?durationText(r.end-r.start):'—';
}
function render(){
  renderMarkers();
  const box=$('scout-v720-clips'),m=currentMatch();if(!box)return;
  if(!m){box.innerHTML='<div class="scout-v720-empty">Selecciona un scouting.</div>';return}
  const rows=clips(m).slice().sort((a,b)=>Number(a.start)-Number(b.start)||String(a.createdAt).localeCompare(String(b.createdAt)));
  box.innerHTML=rows.length?rows.map(c=>{
    const tags=[
      `<span class="scout-v720-tag">${esc(TAGS[c.tag]||c.tag||'General')}</span>`,
      c.skill?`<span class="scout-v720-tag skill">${esc(SKILLS[c.skill]||c.skill)}</span>`:'',
      c.evaluation?`<span class="scout-v720-tag ${['#','+'].includes(c.evaluation)?'good':['=','/','-'].includes(c.evaluation)?'bad':''}">${esc(c.evaluation)}</span>`:'',
      c.player?`<span class="scout-v720-tag">${esc(c.player)}</span>`:''
    ].join('');
    return `<article class="scout-v720-clip ${state.playingClipId===c.id?'playing':''}" data-clip-id="${esc(c.id)}">
      <div class="scout-v720-time">${fmt(c.start)}<small>→ ${fmt(c.end)} · ${durationText(c.duration)}</small></div>
      <div class="scout-v720-copy"><strong>${esc(c.name)}</strong><small>${esc(c.note||c.sourceKey||'Clip manual')}</small><div class="scout-v720-tags">${tags}</div></div>
      <div class="scout-v720-actions">
        <button class="primary" type="button" onclick="scoutV720Play('${esc(c.id)}')">▶</button>
        <button class="ghost" type="button" onclick="scoutV720Edit('${esc(c.id)}')">Editar</button>
        <button class="ghost" type="button" onclick="scoutV720ExportWebM('${esc(c.id)}')">WebM</button>
        <button class="danger" type="button" onclick="scoutV720Delete('${esc(c.id)}')">Eliminar</button>
      </div>
    </article>`;
  }).join(''):'<div class="scout-v720-empty">Todavía no hay clips. Pulsa “Clip” en una fila o marca IN/OUT sobre el vídeo.</div>';
}
function decorateTimeline(){
  const root=$('scout-v700-timeline');if(!root)return;
  root.querySelectorAll('.scout-v700-item').forEach(row=>{
    if(row.querySelector('.scout-v720-row-clip'))return;
    const key=row.dataset.key;if(!key)return;
    const actions=row.querySelector('.actions');if(!actions)return;
    const b=document.createElement('button');
    b.type='button';b.className='ghost scout-v720-row-clip';b.textContent='Clip';
    b.onclick=e=>{e.stopPropagation();window.scoutV720CreateFromKey(key)};
    actions.prepend(b);
  });
}
function selectedKey(){
  return $('scout-v700-timeline')?.querySelector('.scout-v700-item.active')?.dataset?.key||
         $('scout-v700-timeline')?.querySelector('.scout-v700-item')?.dataset?.key||'';
}
function clipById(cid){return clips().find(c=>String(c.id)===String(cid))||null}
function playRange(c){
  const v=video();if(!v?.src){alert('Vuelve a seleccionar el archivo de vídeo de este partido.');return}
  const r=normalizeRange(c.start,c.end);if(!r)return;
  state.playingClipId=c.id||null;state.playlistStop=r.end;
  try{v.currentTime=r.start;v.play().catch(()=>{})}catch(_){}
  render();
}
function stopPlayback(){
  state.playingClipId=null;state.playlistStop=null;state.playlist=[];state.playlistIndex=-1;render();
}
function nextPlaylist(){
  if(!state.playlist.length){stopPlayback();return}
  state.playlistIndex++;
  if(state.playlistIndex>=state.playlist.length){try{video()?.pause()}catch(_){};stopPlayback();stampStatus('Montaje terminado','good');return}
  const c=clipById(state.playlist[state.playlistIndex]);
  if(!c){nextPlaylist();return}
  playRange(c);
}
window.scoutV720MarkIn=function(){const v=video();if(!v?.src){alert('Carga primero el vídeo.');return}state.in=Number(v.currentTime)||0;renderMarkers();stampStatus(`IN ${fmt(state.in)}`,'good')};
window.scoutV720MarkOut=function(){const v=video();if(!v?.src){alert('Carga primero el vídeo.');return}state.out=Number(v.currentTime)||0;renderMarkers();stampStatus(`OUT ${fmt(state.out)}`,'good')};
window.scoutV720ClearMarkers=function(){state.in=null;state.out=null;renderMarkers()};
window.scoutV720CreateManual=function(){
  const name=$('scout-v720-name')?.value||'',tag=$('scout-v720-tag')?.value||'general',note=$('scout-v720-note')?.value||'';
  const c=createClip({start:state.in,end:state.out,name,tag,note,type:'manual'});
  if(c){if($('scout-v720-name'))$('scout-v720-name').value='';if($('scout-v720-note'))$('scout-v720-note').value='';state.in=null;state.out=null;renderMarkers()}
};
window.scoutV720CreateFromKey=function(key,quiet=false){
  const data=findByKey(key);if(!data){if(!quiet)alert('Este elemento todavía no tiene tiempo de vídeo. Sincroniza el partido primero.');return null}
  return createClip({start:data.start,end:data.end,name:data.name,note:data.note,sourceKey:key,type:data.type,set:data.set,team:data.team,skill:data.skill,evaluation:data.evaluation,player:data.player,
    tag:data.team==='opponent'?'opponent':data.type==='action'?'technical':'general'},quiet);
};
window.scoutV720CreateSelected=function(){
  const key=selectedKey();if(!key){alert('No hay ninguna fila disponible.');return}
  window.scoutV720CreateFromKey(key);
};
window.scoutV720CreateVisible=function(){
  const keys=[...($('scout-v700-timeline')?.querySelectorAll('.scout-v700-item')||[])].map(x=>x.dataset.key).filter(Boolean);
  if(!keys.length){alert('No hay filas visibles con los filtros actuales.');return}
  const m=currentMatch(),existing=new Set(clips(m).map(c=>c.sourceKey).filter(Boolean));
  let added=0,skipped=0;
  keys.forEach(key=>{
    if(existing.has(key)){skipped++;return}
    const c=window.scoutV720CreateFromKey(key,true);if(c){added++;existing.add(key)}else skipped++;
  });
  save();render();stampStatus(`${added} clips creados${skipped?` · ${skipped} omitidos`:''}`,added?'good':'warn');
};
window.scoutV720Play=function(cid){
  state.playlist=[];state.playlistIndex=-1;
  const c=clipById(cid);if(c)playRange(c);
};
window.scoutV720PlayPlaylist=function(){
  const rows=clips().slice().sort((a,b)=>Number(a.start)-Number(b.start));
  if(!rows.length){alert('No hay clips guardados.');return}
  if(!video()?.src){alert('Vuelve a seleccionar el archivo de vídeo del partido.');return}
  state.playlist=rows.map(c=>c.id);state.playlistIndex=-1;nextPlaylist();
};
window.scoutV720Delete=function(cid){
  const m=currentMatch(),x=meta(m);if(!m||!x)return;
  const c=clipById(cid);if(!c)return;
  if(!confirm(`¿Eliminar el clip “${c.name}”?`))return;
  x.clips=x.clips.filter(k=>String(k.id)!==String(cid));
  if(state.playingClipId===cid)stopPlayback();save();render();stampStatus('Clip eliminado','good');
};
window.scoutV720Edit=function(cid){
  const c=clipById(cid);if(!c)return;
  const name=prompt('Nombre del clip:',c.name);if(name===null)return;
  const note=prompt('Nota del clip:',c.note||'');if(note===null)return;
  c.name=String(name).trim()||c.name;c.note=String(note).trim();c.updatedAt=new Date().toISOString();
  save();render();stampStatus('Clip actualizado','good');
};
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
window.scoutV720ExportCSV=function(){
  const m=currentMatch();if(!m)return;
  const rows=[['Nombre','Etiqueta','Inicio','Fin','Duracion_s','Tipo','Set','Equipo','Fundamento','Evaluacion','Jugador','Nota','SourceKey']];
  clips(m).forEach(c=>rows.push([c.name,TAGS[c.tag]||c.tag,c.start,c.end,c.duration,c.type,c.set,c.team,c.skill,c.evaluation,c.player,c.note,c.sourceKey]));
  downloadText(rows.map(r=>r.map(csvEscape).join(',')).join('\n'),`${slug(m.date||'partido')}_${slug(m.opponent||'rival')}_clips.csv`,'text/csv;charset=utf-8');
  stampStatus('CSV de clips descargado','good');
};
window.scoutV720ExportJSON=function(){
  const m=currentMatch();if(!m)return;
  const payload={version:VERSION,exportedAt:new Date().toISOString(),match:{id:m.id,date:m.date,team:teamName(),opponent:m.opponent},video:{source:meta(m)?.source||'',syncOffset:meta(m)?.syncOffset??null},clips:clips(m)};
  downloadText(JSON.stringify(payload,null,2),`${slug(m.date||'partido')}_${slug(m.opponent||'rival')}_clips.json`,'application/json;charset=utf-8');
  stampStatus('JSON de clips descargado','good');
};
function exportOverlay(msg){
  let el=$('scout-v720-exporting');if(!el){el=document.createElement('div');el.id='scout-v720-exporting';el.className='scout-v720-exporting';document.body.appendChild(el)}
  el.textContent=msg;return el;
}
function removeExportOverlay(){const el=$('scout-v720-exporting');if(el)el.remove()}
function supportedMime(){
  if(typeof MediaRecorder==='undefined')return '';
  const types=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return types.find(t=>MediaRecorder.isTypeSupported?.(t))||'';
}
async function waitEvent(target,name,timeout=7000){
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(ok,e)=>{if(done)return;done=true;clearTimeout(timer);target.removeEventListener(name,on);ok?resolve(e):reject(new Error(`Timeout ${name}`))};
    const on=e=>finish(true,e);target.addEventListener(name,on,{once:true});
    const timer=setTimeout(()=>finish(false),timeout);
  });
}
window.scoutV720ExportWebM=async function(cid){
  if(state.exporting)return;
  const c=clipById(cid),v=video();if(!c||!v?.src)return;
  const capture=v.captureStream||v.mozCaptureStream;
  if(typeof capture!=='function'||typeof MediaRecorder==='undefined'){
    alert('Este navegador no permite exportar el recorte de vídeo directamente. Puedes usar Chrome/Edge de escritorio o exportar la lista CSV/JSON.');
    return;
  }
  const range=normalizeRange(c.start,c.end);if(!range)return;
  const mime=supportedMime();if(!mime){alert('El navegador no dispone de un formato WebM compatible para exportar el clip.');return}
  state.exporting=true;
  const old={time:v.currentTime,rate:v.playbackRate,muted:v.muted,paused:v.paused};
  let recorder=null,stream=null,timer=null;
  try{
    exportOverlay(`Preparando “${c.name}”…`);
    v.pause();v.playbackRate=1;
    if(Math.abs(v.currentTime-range.start)>.08){v.currentTime=range.start;await waitEvent(v,'seeked')}
    stream=capture.call(v);
    const chunks=[];
    recorder=new MediaRecorder(stream,{mimeType:mime});
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    const stopped=new Promise(resolve=>recorder.addEventListener('stop',resolve,{once:true}));
    recorder.start(250);
    exportOverlay(`Exportando “${c.name}” · ${durationText(range.end-range.start)}`);
    await v.play();
    await new Promise((resolve,reject)=>{
      const check=()=>{if(v.currentTime>=range.end-.04){cleanup();resolve()}};
      const error=()=>{cleanup();reject(new Error('Error de reproducción'))};
      const cleanup=()=>{v.removeEventListener('timeupdate',check);v.removeEventListener('error',error);if(timer)clearTimeout(timer)};
      v.addEventListener('timeupdate',check);v.addEventListener('error',error,{once:true});
      timer=setTimeout(()=>{cleanup();resolve()},Math.max(3000,(range.end-range.start+2)*1800));
    });
    v.pause();if(recorder.state!=='inactive')recorder.stop();await stopped;
    const blob=new Blob(chunks,{type:mime});if(!blob.size)throw new Error('El navegador no generó datos de vídeo.');
    downloadBlob(blob,`${slug(c.name)}.webm`);
    stampStatus('Clip WebM exportado','good');
  }catch(err){
    console.error('V7.2 WebM export',err);
    alert('No se ha podido exportar este clip como WebM. La definición del clip sigue guardada y puedes exportarla en CSV/JSON.');
  }finally{
    try{if(recorder&&recorder.state!=='inactive')recorder.stop()}catch(_){}
    try{stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
    try{v.playbackRate=old.rate||1;v.currentTime=old.time||0;if(!old.paused)v.play().catch(()=>{})}catch(_){}
    state.exporting=false;removeExportOverlay();
  }
};
window.scoutV720Diagnostics=function(){
  const m=currentMatch();
  return {version:VERSION,matchId:m?.id||null,clips:clips(m).length,markers:{in:state.in,out:state.out},videoLoaded:!!video()?.src,captureStream:typeof (video()?.captureStream||video()?.mozCaptureStream)==='function',mediaRecorder:typeof MediaRecorder!=='undefined'};
};

const timeline=$('scout-v700-timeline');
if(timeline&&!timeline.dataset.v720Observed){
  timeline.dataset.v720Observed='1';
  new MutationObserver(()=>decorateTimeline()).observe(timeline,{childList:true,subtree:true});
}
const modal=$('scout-v700-video-modal');
if(modal&&!modal.dataset.v720Observed){
  modal.dataset.v720Observed='1';
  new MutationObserver(()=>{decorateTimeline();render()}).observe(modal,{attributes:true,attributeFilter:['class']});
}
const v=video();
if(v&&!v.dataset.v720Bound){
  v.dataset.v720Bound='1';
  v.addEventListener('timeupdate',()=>{
    if(state.playlistStop!=null&&v.currentTime>=state.playlistStop-.04){
      v.pause();
      if(state.playlist.length)nextPlaylist();else{state.playingClipId=null;state.playlistStop=null;render()}
    }
  });
  v.addEventListener('ended',()=>{if(state.playlist.length)nextPlaylist();else stopPlayback()});
}

const baseOpen=window.scoutV700OpenVideo;
window.scoutV700OpenVideo=function(context=''){
  const out=baseOpen?.(context);setTimeout(()=>{render();decorateTimeline()},0);return out;
};
const baseChanged=window.scoutV700MatchChanged;
window.scoutV700MatchChanged=function(){
  state.in=null;state.out=null;stopPlayback();
  const out=baseChanged?.();setTimeout(()=>{render();decorateTimeline()},0);return out;
};

document.addEventListener('keydown',e=>{
  const modal=$('scout-v700-video-modal');
  if(!modal?.classList.contains('open'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();
  if(['input','select','textarea'].includes(tag))return;
  if(e.key.toLowerCase()==='i'){e.preventDefault();window.scoutV720MarkIn()}
  else if(e.key.toLowerCase()==='o'){e.preventDefault();window.scoutV720MarkOut()}
  else if(e.key.toLowerCase()==='c'&&state.in!=null&&state.out!=null){e.preventDefault();window.scoutV720CreateManual()}
});

setTimeout(()=>{render();decorateTimeline()},0);
})();
