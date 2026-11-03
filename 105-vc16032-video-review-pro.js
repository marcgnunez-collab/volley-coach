(()=>{
'use strict';
// V16.0.3.2 · Unified review controls. No modification of match or cloud data.
const VERSION='16.0.3.2';
const $=id=>document.getElementById(id);
const root=$('scout-video-hub');
if(!root||!$('vc-review-pro-bar'))return;
root.classList.add('vc-review-pro-enabled');
const state={marks:[],markKey:'',dragging:false,lastSource:'',lastAvailable:false};
const diag=()=>{try{return window.liveDelayDiagnostics?.()||{}}catch(_){return{}}};
const activeSource=()=>['live','delay','youtube','local'].find(k=>$('v117-review-source-'+k)?.classList.contains('active'))||'local';
const video=()=>$('v780-player-video');
const number=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function format(t){if(!Number.isFinite(t)||t<0)return '—:—';const sec=Math.floor(t);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function currentData(){
  const source=activeSource(),v=video();
  if(source==='delay'){
    const d=window.liveDelayGetReviewTimeline?.()||{},health=diag();
    return {source,available:!!d.available,start:number(d.start),end:number(d.end),current:number(d.current),playing:!!d.playing,speed:number(d.speed,1),health:health.health||'ESPERANDO',liveDelay:health.actualDelay,details:'Búfer temporal · revisión en directo'};
  }
  if(source==='local'){
    const end=number(v?.duration);return {source,available:!!v&&end>0,start:0,end,current:number(v?.currentTime),playing:!!v&&!v.paused,speed:number(v?.playbackRate,1),health:'ARCHIVO',liveDelay:null,details:'Archivo / grabación local'};
  }
  if(source==='live')return {source,available:false,start:0,end:0,current:0,playing:!!diag().running,speed:1,health:diag().running?'EN DIRECTO':'DESCONECTADO',details:'Para revisar, abre DELAY'};
  return {source,available:false,start:0,end:0,current:0,playing:false,speed:1,health:'YOUTUBE',details:'Usa los controles del reproductor YouTube'};
}
function markContext(source){
  const match=$('v780-match')?.value||'sin-partido',local=video();
  const file=source==='local'?String(local?.currentSrc||local?.src||'archivo').slice(-160):'delay';
  return [source,match,file].join('|');
}
function rebuildMarks(){
  const box=$('vc-review-pro-marks');if(!box)return;
  box.replaceChildren();
  for(const m of state.marks){
    const btn=document.createElement('button');btn.type='button';btn.className='vc-review-marker';
    btn.textContent=format(m.time);
    btn.title='Volver al momento marcado';
    btn.addEventListener('click',()=>seekAbsolute(m.time));
    box.appendChild(btn);
  }
  if(!state.marks.length){const empty=document.createElement('span');empty.textContent='Sin marcas en esta sesión';box.appendChild(empty)}
}
function seekAbsolute(t){
  const data=currentData();if(!data.available)return false;
  const target=clamp(number(t),data.start,Math.max(data.start,data.end-.08));
  if(data.source==='delay')return !!window.liveDelaySeekFraction?.((target-data.start)/Math.max(.001,data.end-data.start));
  if(data.source==='local'){
    try{video().currentTime=target;return true}catch(_){return false}
  }
  return false;
}
window.vcReviewProSkip=function(sec){
  const d=currentData();if(!d.available)return false;
  if(d.source==='delay')return window.liveDelayJump?.(Number(sec)||0),true;
  return seekAbsolute(d.current+Number(sec||0));
};
window.vcReviewProToggle=function(){
  const d=currentData();if(!d.available)return false;
  if(d.source==='delay'){window.liveDelayTogglePause?.();return true}
  if(d.source==='local'){
    const v=video();try{if(v.paused)v.play().catch(()=>{});else v.pause();return true}catch(_){return false}
  }
  return false;
};
window.vcReviewProFrame=function(dir){
  const d=currentData();if(!d.available)return false;
  if(d.source==='delay')return !!window.liveDelayFrameStep?.(dir);
  if(d.source==='local'){
    // Frame seeking is approximate for variable-frame-rate and GOP encoded files.
    try{const v=video();v.pause();v.currentTime=clamp(d.current+(dir<0?-1:1)/30,0,Math.max(0,d.end-.001));return true}catch(_){return false}
  }
  return false;
};
window.vcReviewProSpeed=function(rate){
  const d=currentData();if(!d.available)return false;
  const n=Number(rate);if(![.25,.5,.75,1,1.25,1.5,2].includes(n))return false;
  if(d.source==='delay')return !!window.liveDelaySetReviewSpeed?.(n);
  if(d.source==='local'){try{video().playbackRate=n;return true}catch(_){return false}}
  return false;
};
window.vcReviewProSeek=function(value){
  state.dragging=false;
  const d=currentData();if(!d.available)return false;
  return seekAbsolute(d.start+clamp(number(value)/1000,0,1)*(d.end-d.start));
};
window.vcReviewProScrubLabel=function(value){
  state.dragging=true;const d=currentData();if(!d.available)return;
  const stamp=d.start+clamp(number(value)/1000,0,1)*(d.end-d.start);
  const label=$('vc-review-pro-time');if(label)label.textContent=`${format(stamp-d.start)} / ${format(d.end-d.start)}`;
};
window.vcReviewProToDelay=function(){
  const d=diag();if(!d.running){window.v117ReviewConfigureDelay?.();return}
  window.liveDelayReturn?.();window.v117ReviewSetSource?.('delay');
};
window.vcReviewProToLive=function(){window.v117ReviewSetSource?.('live')};
window.vcReviewProMark=function(){
  const d=currentData();if(!d.available)return false;
  const key=markContext(d.source);
  if(state.markKey!==key){state.markKey=key;state.marks=[]}
  const current=number(d.current);
  if(!state.marks.some(m=>Math.abs(m.time-current)<.4)){
    state.marks.push({time:current});state.marks.sort((a,b)=>a.time-b.time);
    if(state.marks.length>30)state.marks.shift();
  }
  rebuildMarks();return true;
};
window.vcReviewProClearMarks=function(){state.marks=[];rebuildMarks()};
function refresh(){
  if(!root.classList.contains('active'))return;
  const d=currentData(),key=markContext(d.source);
  if(key!==state.markKey){state.markKey=key;state.marks=[];rebuildMarks()}
  const source=$('vc-review-pro-source');if(source)source.textContent=d.source.toUpperCase();
  const health=$('vc-review-pro-health');if(health)health.textContent=d.health;
  const progress=$('vc-review-pro-timeline');
  if(progress){
    progress.disabled=!d.available;
    if(!state.dragging)progress.value=d.available?String(Math.round(1000*clamp((d.current-d.start)/Math.max(.001,d.end-d.start),0,1))):'0';
  }
  const time=$('vc-review-pro-time');if(time&&!state.dragging)time.textContent=d.available?`${format(d.current-d.start)} / ${format(d.end-d.start)}`:'—:— / —:—';
  const rate=$('vc-review-pro-rate');if(rate&&d.available){const newRate=String(d.speed);if([...rate.options].some(o=>o.value===newRate))rate.value=newRate}
  const play=$('vc-review-pro-play');if(play)play.textContent=d.playing?'❚❚ Pausa':'▶ Reproducir';
  root.querySelectorAll('[data-vc-review-seek]').forEach(el=>{el.disabled=!d.available});
  if(rate)rate.disabled=!d.available;
  const mark=$('vc-review-pro-mark');if(mark)mark.disabled=!d.available;
  const msg=$('vc-review-pro-hint');if(msg)msg.textContent=d.details;
  const delayBadge=$('vc-review-pro-delay');if(delayBadge)delayBadge.textContent=d.source==='delay'&&d.liveDelay!=null?`${number(d.liveDelay).toFixed(1)} s del directo`:' ';
  if(state.dragging&&progress&&!progress.matches(':active'))state.dragging=false;
}
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!root.classList.contains('active'))return;
  if(event.target?.closest?.('input,textarea,select,button,[contenteditable="true"],[role="dialog"]'))return;
  const map={' ':'pause','ArrowLeft':'back','ArrowRight':'forward',',':'prevFrame','.':'nextFrame'};
  const k=map[event.key];if(!k)return;
  event.preventDefault();
  if(k==='pause')window.vcReviewProToggle();
  if(k==='back')window.vcReviewProSkip(-5);
  if(k==='forward')window.vcReviewProSkip(5);
  if(k==='prevFrame')window.vcReviewProFrame(-1);
  if(k==='nextFrame')window.vcReviewProFrame(1);
});
$('vc-review-pro-timeline')?.addEventListener('pointercancel',()=>{state.dragging=false});
$('vc-review-pro-timeline')?.addEventListener('blur',()=>{state.dragging=false});
setInterval(refresh,450);
rebuildMarks();refresh();
window.VC_VIDEO_REVIEW_PRO={version:VERSION,diagnostics:()=>({source:activeSource(),marks:state.marks.length,available:currentData().available}),refresh};
})();
