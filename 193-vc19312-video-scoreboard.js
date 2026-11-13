/* Volley Coach V19.3.12 · Historical scoreboard for Video Analysis and Video Review.
 * Read-only: does not mutate match, video, recording, storage of game data or cloud.
 * No guessed score: video overlay requires reliable source timing and recorded snapshots.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_VIDEO_SCORE_19312=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.12',PREF_KEY='vc19312:score-overlay:v1';
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
 const timestamp=v=>{const n=number(v);return n!=null&&n>=0?n:null;};
 function score(raw){
  const a=number(raw?.us),b=number(raw?.opponent);
  return {ours:a!=null&&Number.isInteger(a)&&a>=0?a:null,opponent:b!=null&&Number.isInteger(b)&&b>=0?b:null,complete:a!=null&&b!=null&&Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0};
 }
 function snapshot(raw,setNo,index,stage='before'){
  if(!raw)return null;
  const before=stage!=='after',current=score(before?raw.scoreBefore:raw.scoreAfter);
  const serving=before?(raw.servingBefore==='ours'||raw.servingBefore==='opponent'?raw.servingBefore:null)
   :(raw.winner==='ours'||raw.winner==='opponent'?raw.winner:null);
  const ownRotation=number(raw.rotationBefore),rivalRotation=number(raw.opponentRotationBefore);
  return {set:setNo,rally:index,stage:before?'before':'after',scores:current,
   serving,ownRotation:ownRotation>=1&&ownRotation<=6?ownRotation:null,
   rivalRotation:rivalRotation>=1&&rivalRotation<=6?rivalRotation:null,
   rotationsAreBefore:!before,source:'scouting'};
 }
 function hasScore(s){return !!s?.scores?.complete}
 function sourceTime(match,scoutMs,recording,timelineApi){
  const ms=timestamp(scoutMs);
  if(ms==null)return null;
  const offset=number(match?.video?.syncOffset);
  if(offset==null)return null;
  if(recording){
   const matchStart=Date.parse(match?.clockStartedAt||match?.createdAt||'');
   const recordingStart=Date.parse(recording?.startedAt||'');
   if(!Number.isFinite(matchStart)||!Number.isFinite(recordingStart)||!timelineApi?.mediaTime)return null;
   const correction=offset-(matchStart-recordingStart)/1000;
   const mapped=timelineApi.mediaTime(match,ms,recording,correction);
   return mapped!=null&&Number.isFinite(mapped)&&mapped>=0?mapped:null;
  }
  const result=ms/1000+offset;
  return Number.isFinite(result)&&result>=0?result:null;
 }
 function buildTimeline(match,recording=null,timelineApi=null){
  const timeline=[];
  for(const set of arr(match?.sets)){
   const setNo=number(set?.number);
   if(setNo==null)continue;
   for(const [i,r] of arr(set.rallies).entries()){
    if(!r)continue;
    const startMs=timestamp(r.scoutStartMs);
    const endMs=timestamp(r.scoutEndMs);
    if(startMs==null||endMs==null||endMs<startMs)continue;
    const start=sourceTime(match,startMs,recording,timelineApi),end=sourceTime(match,endMs,recording,timelineApi);
    if(start==null||end==null||end<start)continue;
    const before=snapshot(r,setNo,i+1,'before'),after=snapshot(r,setNo,i+1,'after');
    if(!hasScore(before)||!hasScore(after))continue;
    timeline.push({set:setNo,index:i+1,id:r.id??null,start,end,before,after});
   }
  }
  return timeline.sort((a,b)=>a.start-b.start||a.set-b.set||a.index-b.index);
 }
 function atVideoTime(seconds,timeline){
  const time=number(seconds),events=arr(timeline);
  if(time==null||time<0||!events.length)return null;
  // Find last rally whose scout start does not exceed current media time.
  let at=-1;
  for(let i=0;i<events.length;i++){
   if(events[i].start<=time+0.001)at=i;else break;
  }
  if(at<0)return null;
  const current=events[at],next=events[at+1];
  if(time<=current.end)return current.before;
  // Avoid showing a stale historical score for arbitrarily long video gaps.
  const maxUntil=next?Math.min(next.start,current.end+25):current.end+25;
  if(time<=maxUntil)return current.after;
  return null;
 }
 function scoreMarkup(s){
  if(!s)return `<div class="vc19312-score-empty">Selecciona un rally con marcador registrado.</div>`;
  const ours=s.scores.ours==null?'—':s.scores.ours,other=s.scores.opponent==null?'—':s.scores.opponent;
  const serving=s.serving==='ours'?'Saque nuestro':s.serving==='opponent'?'Saque rival':'Saque sin registrar';
  const rotations=`R${s.ownRotation??'—'} / R${s.rivalRotation??'—'}`;
  const moment=s.stage==='after'?'Después del rally':'Antes del rally';
  return `<div class="vc19312-score-bar"><div class="vc19312-score-team ${s.serving==='ours'?'is-serving':''}"><span>NUESTRO EQUIPO</span><strong>${ours}</strong></div><div class="vc19312-score-mid"><b>SET ${s.set}</b><small>RALLY ${s.rally}</small><span>${moment}</span></div><div class="vc19312-score-team ${s.serving==='opponent'?'is-serving':''}"><span>RIVAL</span><strong>${other}</strong></div></div><div class="vc19312-score-meta"><span>${serving}</span><span>${rotations}${s.rotationsAreBefore?' · rotaciones al inicio':''}</span></div>`;
 }
 function renderAnalysis(ctx,projection){
  const base=projection?.base||{},rallies=arr(base.rallies),all=arr(base.contacts);
  const contacts=all.filter(c=>c.team===ctx.team),marked=contacts.filter(c=>c.video).length;
  const rows=rallies.slice(-100).reverse().map(r=>{
   const raw=arr(ctx?.match?.sets).find(s=>Number(s.number)===r.set)?.rallies?.[r.provenance?.rallyIndex??r.index-1];
   const b=snapshot(raw,r.set,r.index,'before'),a=snapshot(raw,r.set,r.index,'after');
   const before=b?.scores.complete?`${b.scores.ours}–${b.scores.opponent}`:'—';
   const after=a?.scores.complete?`${a.scores.ours}–${a.scores.opponent}`:'—';
   const refs=r.contacts.filter(c=>c.video).length;
   return `<button type="button" class="vc19310-rally vc19312-rally-row" data-vc19310-rally="${esc(r.key)}"><span class="vc19312-rally-num">S${esc(r.set)} · #${esc(r.index)}</span><b>${esc(before)} → ${esc(after)}</b><small>${refs?'Vídeo · '+refs:'Sin marca'} · ${r.winner==='ours'?'Punto nuestro':r.winner==='opponent'?'Punto rival':'Abierto'}</small></button>`;
  }).join('');
  const codes=contacts.slice(-110).reverse().map(c=>`<tr><td>S${esc(c.set)} · #${esc(c.rallyIndex)}</td><td>${esc(c.code||c.skill||'—')}</td><td>${esc(c.player||'—')}</td><td>${esc(c.evaluation||'—')}</td><td>${c.video?'Sí':'—'}</td></tr>`).join('');
  return `<div class="vc19312-analysis-head"><div><small>VIDEO ANALYSIS · V19.3.12</small><h3>Vídeo y marcador histórico</h3><p>Revisa los rallies con el tanteo exacto registrado antes y después de cada punto.</p></div><button type="button" data-vc19312-toggle>Marcador en vídeo: <b data-vc19312-toggle-label>Activado</b></button></div>
  <div class="vc19312-analysis-layout"><section class="vc19310-panel vc19312-analysis-main"><div class="vc19310-panelhead"><strong>REVISIÓN DE JUGADAS</strong><span>${rallies.length} rallies · ${marked} acciones con referencia de vídeo</span></div><div class="vc19312-preview"><div class="vc19312-preview-top"><span>VOLLEY COACH / VIDEO REVIEW</span><span>MARCADOR DEL SCOUTING</span></div><div id="vc19312-analysis-score" aria-live="polite">${scoreMarkup(null)}</div><p id="vc19312-analysis-description">Selecciona un rally a la derecha para consultar su marcador y abrir el vídeo original.</p><button type="button" data-vc19310-command="play" disabled>▶ Abrir rally en Video Review</button></div><div class="vc19312-score-help"><span>El marcador del reproductor se sincroniza con la posición temporal del vídeo.</span><span>Sin una sincronización válida no se mostrará un resultado histórico aproximado.</span></div><h3>Códigos registrados</h3><div class="vc19310-scroll"><table><thead><tr><th>Rally</th><th>Código</th><th>Jugador</th><th>Valoración</th><th>Vídeo</th></tr></thead><tbody>${codes||'<tr><td colspan="5">No hay contactos para los filtros actuales.</td></tr>'}</tbody></table></div></section>
  <aside class="vc19310-panel vc19312-analysis-rallies"><div class="vc19310-panelhead"><strong>RALLIES Y MARCADOR</strong><span>Últimos 100</span></div><div class="vc19310-rallies">${rows||'<p class="vc19310-note">No hay rallies.</p>'}</div><p class="vc19310-note">Pulsa una jugada para verla con su marcador. El vídeo original se abre en Video Review.</p></aside></div>`;
 }
 function updatePreview(container,r){
  const target=container?.querySelector('#vc19312-analysis-score');if(!target||!r)return;
  const b={set:r.set,rally:r.index,stage:'before',scores:score(r.scoreBefore),serving:r.serving,ownRotation:r.ownRotation,rivalRotation:r.rivalRotation,rotationsAreBefore:false};
  const a={set:r.set,rally:r.index,stage:'after',scores:score(r.scoreAfter),serving:r.winner,ownRotation:r.ownRotation,rivalRotation:r.rivalRotation,rotationsAreBefore:true};
  const shown=hasScore(b)?b:hasScore(a)?a:null;
  target.innerHTML=scoreMarkup(shown);
  const label=container.querySelector('#vc19312-analysis-description');
  if(label)label.textContent=shown?`Set ${r.set} · Rally ${r.index}. Antes: ${b.scores.ours??'—'}–${b.scores.opponent??'—'}. Después: ${a.scores.ours??'—'}–${a.scores.opponent??'—'}.`:'Este rally no tiene puntuación completa registrada.';
 }
 function openRally(win,match,rally){
  if(!win?.document||match?.id==null||rally?.nativeId==null||rally?.set==null)return false;
  try{win.v11Navigate?.('video');win.v780Open?.();}catch(_){return false;}
  const select=win.document.getElementById('v780-match');
  if(!select||![...select.options].some(o=>String(o.value)===String(match.id)))return false;
  if(String(select.value)!==String(match.id)){
   select.value=String(match.id);
   win.v780MatchChanged?.();
  }
  win.VC_VIDEO_WORKSPACE?.openAnalysis?.();
  win.v780SetKind?.('rally');
  const key='r:'+rally.set+':'+rally.nativeId;
  win.v780Select?.(key);
  if(win.VC_VIDEO_REVIEW_API?.loaded?.())win.v780PlayKey?.(key);
  return true;
 }
 function readEnabled(win){try{return win.localStorage?.getItem(PREF_KEY)!=='off'}catch(_){return true}}
 function writeEnabled(win,on){try{win.localStorage?.setItem(PREF_KEY,on?'on':'off')}catch(_){}}
 function mount(win){
  const doc=win.document;if(!doc)return;
  const state={enabled:readEnabled(win),signature:'',timeline:[],lastView:'',lastScore:''};
  const $=id=>doc.getElementById(id);
  function attach(){
   const frame=$('v780-video-frame');if(!frame)return false;
   if(!$('vc19312-video-overlay')){
    const panel=doc.createElement('div');panel.id='vc19312-video-overlay';panel.className='vc19312-video-overlay';panel.hidden=true;panel.setAttribute('aria-label','Marcador del vídeo');frame.append(panel);
    const toolbar=doc.createElement('div');toolbar.className='vc19312-video-controls';toolbar.id='vc19312-video-controls';
    toolbar.innerHTML='<strong>MARCADOR DEL SCOUTING</strong><span id="vc19312-sync-state">Selecciona un vídeo sincronizado.</span><button type="button" data-vc19312-toggle>Ocultar marcador</button>';
    const reviewBar=frame.closest('.v780-video-panel')?.querySelector('#vc-review-pro-bar');
    if(reviewBar)reviewBar.before(toolbar);else frame.after(toolbar);
   }
   return true;
  }
  function syncButtons(){doc.querySelectorAll('[data-vc19312-toggle]').forEach(b=>{
   b.setAttribute('aria-pressed',String(state.enabled));
   const label=b.querySelector('[data-vc19312-toggle-label]');if(label)label.textContent=state.enabled?'Activado':'Desactivado';
   else if(b.id==='vc19312-video-toggle'||b.closest('#vc19312-video-controls'))b.textContent=state.enabled?'Ocultar marcador':'Mostrar marcador';
  });}
  function reset(){state.signature='';state.timeline=[];state.lastView='';state.lastScore=''}
  function tick(){
   if(!attach())return;
   syncButtons();const overlay=$('vc19312-video-overlay'),label=$('vc19312-sync-state'),review=win.VC_VIDEO_REVIEW_API;
   const matchId=$('v780-match')?.value,match=arr(win.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()).find(m=>String(m.id)===String(matchId));
   const live=$('v117-review-stream');
   const liveActive=!!(live&&!live.classList.contains('hidden')&&live.srcObject);
   if(!state.enabled){overlay.hidden=true;if(label)label.textContent='Marcador oculto';return;}
   if(liveActive){overlay.hidden=true;if(label)label.textContent='LIVE/Delay: marcador histórico no disponible en esta vista';return;}
   if(!match||!review?.loaded?.()){overlay.hidden=true;if(label)label.textContent='Carga un vídeo del partido';return;}
   const rec=review.recording?.()||null,offset=number(match.video?.syncOffset);
   if(offset==null){overlay.hidden=true;if(label)label.textContent='Sincroniza el vídeo para activar el marcador histórico';return;}
   const sig=[match.id,match.video?.sourceKey||'',offset,rec?.id||'',...arr(match.sets).flatMap(s=>[s.number,...arr(s.rallies).map(r=>[r.id,r.scoutStartMs,r.scoutEndMs,r.scoreBefore?.us,r.scoreBefore?.opponent,r.scoreAfter?.us,r.scoreAfter?.opponent,r.servingBefore,r.winner,r.rotationBefore,r.opponentRotationBefore].join('/'))])].join('|');
   if(sig!==state.signature){state.signature=sig;state.timeline=buildTimeline(match,rec,win.VC_VIDEO_TIMELINE_1923);state.lastScore='';}
   if(!state.timeline.length){overlay.hidden=true;if(label)label.textContent='Sin marcas temporales completas de rallies';return;}
   const snapshotNow=atVideoTime(review.currentTime?.(),state.timeline);
   if(!snapshotNow){overlay.hidden=true;if(label)label.textContent='Fuera de rallies con tiempo verificado';return;}
   overlay.hidden=false;
   const key=[snapshotNow.set,snapshotNow.rally,snapshotNow.stage,snapshotNow.scores.ours,snapshotNow.scores.opponent,snapshotNow.serving].join(':');
   if(state.lastScore!==key){overlay.innerHTML=scoreMarkup(snapshotNow);state.lastScore=key;}
   if(label)label.textContent=`Sincronizado · Set ${snapshotNow.set} · Rally ${snapshotNow.rally}`;
  }
  doc.addEventListener('click',e=>{if(!e.target.closest('[data-vc19312-toggle]'))return;state.enabled=!state.enabled;writeEnabled(win,state.enabled);tick();});
  doc.addEventListener('change',e=>{if(e.target?.id==='v780-match')reset()});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  // Read-only UI refresh. Also covers YouTube playback, which doesn't dispatch HTML5 timeupdate.
  const interval=win.setInterval(tick,750);
  win.addEventListener('pagehide',()=>win.clearInterval(interval),{once:true});
  win.VC_VIDEO_SCORE_19312_STATE={refresh:tick,get enabled(){return state.enabled},setEnabled:on=>{state.enabled=!!on;writeEnabled(win,state.enabled);tick()},reset};
 }
 return {VERSION,PREF_KEY,score,snapshot,sourceTime,buildTimeline,atVideoTime,scoreMarkup,renderAnalysis,updatePreview,openRally,mount};
});
