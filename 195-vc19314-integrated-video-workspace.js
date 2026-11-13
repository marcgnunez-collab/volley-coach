/* Volley Coach V19.3.14 · Integrated Video & Scouting Workspace.
 * One physical Video Review player: its DOM is docked in Analysis and restored
 * when the user leaves. No clone, second media engine, match mutation or storage.
 */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_INTEGRATED_VIDEO_19314=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.14';
 const arr=x=>Array.isArray(x)?x:[];
 const text=x=>String(x??'').trim();
 const esc=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b?`${(100*a/b).toFixed(1).replace('.',',')} %`:'—';
 const number=x=>Number.isFinite(Number(x))?Number(x):0;
 const API={};
 function model(ctx,projection){
  const rallies=arr(projection?.base?.rallies),contacts=arr(projection?.base?.contacts).filter(c=>!ctx?.team||c.team===ctx.team);
  const attacks=contacts.filter(c=>c.skill==='A'),rated=attacks.filter(c=>c.evaluation),points=rated.filter(c=>c.evaluation==='#').length,
   errors=rated.filter(c=>c.evaluation==='='||c.evaluation==='/').length;
  const closed=rallies.filter(r=>r.closed),team=ctx?.team||'ours',receive=closed.filter(r=>r.serving&&r.serving!==team),serve=closed.filter(r=>r.serving===team);
  const k1=receive.filter(r=>r.winner===team).length,k2=serve.filter(r=>r.winner===team).length;
  return {rallies,contacts,attacks:attacks.length,points,errors,eff: rated.length?Math.round(1000*(points-errors)/rated.length)/10:null,
   k1:{made:k1,total:receive.length,rate:pct(k1,receive.length)},k2:{made:k2,total:serve.length,rate:pct(k2,serve.length)},
   marked:contacts.filter(c=>c.video).length};
 }
 function render(ctx,projection){
  const m=model(ctx,projection),rallies=m.rallies.slice(-150).reverse();
  const rows=m.contacts.slice(-250).reverse().map(c=>`<button type="button" class="vc19314-code-row" data-vc19314-contact="${esc(c.key)}" data-vc19314-text="${esc([c.code,c.player,c.skill,c.evaluation,c.set,c.rallyIndex].join(' ').toLocaleLowerCase('es-ES'))}" title="Localizar contacto y rally"><span>S${esc(c.set)} · ${esc(c.rallyIndex)}</span><strong>${esc(c.code||c.skill||'—')}</strong><span>${esc(c.player||'—')}</span><b>${esc(c.evaluation||'—')}</b><i class="${c.video?'has-time':''}">${c.video?'●':'○'}</i></button>`).join('');
  const rallyRows=rallies.map(r=>`<button type="button" class="vc19310-rally vc19314-rally" data-vc19310-rally="${esc(r.key)}"><b>S${esc(r.set)} · #${esc(r.index)}</b><span>${esc(r.scoreBefore?.us??'—')}–${esc(r.scoreBefore?.opponent??'—')} → ${esc(r.scoreAfter?.us??'—')}–${esc(r.scoreAfter?.opponent??'—')}</span><small>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Abierto'} · ${r.contacts.length} contactos</small></button>`).join('');
  return `<section class="vc19314-workspace" aria-label="Vídeo y scouting integrados">
    <header class="vc19314-heading"><div><small>VIDEO ANALYSIS · INTEGRATED WORKSPACE V${VERSION}</small><h3>Vídeo + scouting + estadísticas</h3><p>Un único reproductor, las acciones codificadas y el análisis del partido en el mismo lugar.</p></div>
      <div class="vc19314-header-actions"><button type="button" data-vc19314-action="recording">Abrir grabación</button><button type="button" data-vc19314-action="file">Abrir archivo</button><button type="button" data-vc19314-action="live">LIVE</button><button type="button" data-vc19314-action="delay">DELAY</button><button type="button" data-vc19314-action="source">Video Review completo</button><button type="button" data-vc19312-toggle aria-pressed="true">Marcador · ON</button></div></header>
    <div class="vc19314-kpis"><div><span>Side-out · K1</span><strong>${m.k1.rate}</strong><small>${m.k1.made}/${m.k1.total} rallies</small></div><div><span>Break · K2</span><strong>${m.k2.rate}</strong><small>${m.k2.made}/${m.k2.total} rallies</small></div><div><span>Eficiencia ataque</span><strong>${m.eff==null?'—':m.eff.toLocaleString('es-ES',{maximumFractionDigits:1})+' %'}</strong><small>${m.attacks} ataques · ${m.points} #</small></div><div><span>Referencias de vídeo</span><strong>${m.marked}</strong><small>${m.contacts.length} contactos del filtro</small></div></div>
    <div class="vc19314-layout"><div class="vc19314-left"><section class="vc19314-player"><div class="vc19314-panelhead"><strong>REPRODUCTOR PROFESIONAL</strong><span id="vc19314-player-state">Preparando reproductor…</span></div><div id="vc19314-player-host" class="vc19314-player-host"><div class="vc19314-empty">El reproductor original de Video Review aparecerá aquí.</div></div><div id="vc19314-transport-host" class="vc19314-transport-host"></div><div class="vc19314-actions"><button type="button" data-vc19314-action="skip-back">−8 s</button><button type="button" data-vc19314-action="play">▶ / Pausa</button><button type="button" data-vc19314-action="skip-next">+5 s</button><button type="button" data-vc19314-action="fullscreen">Pantalla completa</button><button type="button" data-vc19314-action="selected">Reproducir rally</button></div><p class="vc19314-status" id="vc19314-status" role="status">Selecciona un rally o contacto. El marcador histórico solo aparece con un tiempo verificado.</p></section>
    <section class="vc19314-data"><div class="vc19314-panelhead"><strong>CÓDIGOS DEL SCOUTING</strong><span>${m.contacts.length} contactos · ${m.marked} con vídeo</span></div><label class="vc19314-code-search">Filtrar códigos<input type="search" data-vc19314-search placeholder="Código, jugador, fundamento…" autocomplete="off"></label><div class="vc19314-code-head"><span>Rally</span><span>Código</span><span>Jugador</span><span>Val.</span><span>Vídeo</span></div><div class="vc19314-code-list">${rows||'<p class="vc19314-no-data">No hay contactos en este filtro.</p>'}</div></section></div>
    <aside class="vc19314-right"><section class="vc19314-rallies"><div class="vc19314-panelhead"><strong>RALLIES</strong><span>${m.rallies.length} en el filtro</span></div><div class="vc19314-rally-list">${rallyRows||'<p class="vc19314-no-data">No hay rallies registrados.</p>'}</div></section><section class="vc19314-selection"><div class="vc19314-panelhead"><strong>JUGADA SELECCIONADA</strong></div><p data-vc19310-detail>Selecciona una jugada</p><div id="vc19314-selection-score" class="vc19314-selection-score">—</div><p id="vc19314-selection-note">Los tiempos del vídeo y el scouting deben coincidir.</p></section></aside></div>
  </section>`;
 }
 const docks=new WeakMap();
 function park(win){
  const state=docks.get(win);if(!state)return false;
  for(const item of state.items.slice().reverse()){
   try{if(item.node&&item.placeholder?.parentNode){item.placeholder.replaceWith(item.node);}}catch(_){}
  }
  state.items=[];state.docked=false;
  return true;
 }
 function move(state,node,host){
  if(!node||!host||node===host||host.contains(node))return false;
  const placeholder=node.ownerDocument.createComment('vc19314-original-location');
  node.parentNode?.replaceChild(placeholder,node);
  host.appendChild(node);
  state.items.push({node,placeholder});return true;
 }
 function alignMatch(win,match){
  if(match?.id==null)return false;
  const select=win.document.getElementById('v780-match');
  if(!select)return false;
  if(![...select.options].some(o=>String(o.value)===String(match.id)))return false;
  if(String(select.value)!==String(match.id)){select.value=String(match.id);win.v780MatchChanged?.();}
  return true;
 }
 function attach(win,root,match){
  const doc=win?.document,frame=doc?.getElementById('v780-video-frame');
  if(!doc||!frame||!root)return false;
  const existing=docks.get(win)||{items:[],docked:false,matchId:null};
  // Never duplicate or replace the actual player when Analysis rerenders.
  if(existing.docked)park(win);
  if(!existing.initialized||String(existing.matchId??'')!==String(match?.id??'')){win.v780Open?.();existing.initialized=true;}
  const aligned=alignMatch(win,match);
  const host=root.querySelector('#vc19314-player-host'),transport=root.querySelector('#vc19314-transport-host');
  if(!host||!transport)return false;
  if(!move(existing,frame,host))return false;
  host.querySelector('.vc19314-empty')?.remove();
  move(existing,doc.getElementById('vc-review-pro-bar'),transport);
  existing.docked=true;existing.matchId=match?.id??null;docks.set(win,existing);
  const status=root.querySelector('#vc19314-player-state');
  if(status)status.textContent=aligned?'Video Review conectado · mismo partido':'Selecciona el partido también en Video Review';
  win.VC_VIDEO_SCORE_19312_STATE?.refresh?.();
  return true;
 }
 function findMatchRally(match,rally){return arr(match?.sets).find(s=>Number(s.number)===Number(rally?.set))?.rallies?.[rally?.provenance?.rallyIndex??rally?.index-1]||null;}
 function select(win,match,rally,{play=false}={}){
  if(!rally)return {ok:false,reason:'Sin rally seleccionado'};
  if(!alignMatch(win,match))return {ok:false,reason:'El scouting seleccionado no está disponible en Video Review'};
  if(rally.nativeId==null)return {ok:false,reason:'El rally no tiene un identificador de origen estable'};
  const key=`r:${rally.set}:${rally.nativeId}`;
  win.v780Select?.(key);
  const canPlay=!!win.VC_VIDEO_REVIEW_API?.loaded?.();
  if(play&&canPlay)win.v780PlayKey?.(key);
  const raw=findMatchRally(match,rally),before=win.VC_VIDEO_SCORE_19312?.snapshot?.(raw,rally.set,rally.index,'before');
  return {ok:true,key,played:play&&canPlay,hasSource:canPlay,before:before?.scores?.complete?before:null};
 }
 function selectContact(win,match,contact,{play=true}={}){
  if(!contact)return {ok:false,reason:'Contacto no encontrado'};
  if(!alignMatch(win,match))return {ok:false,reason:'El vídeo no corresponde al scouting seleccionado'};
  const rally=arr(match?.sets).find(s=>Number(s.number)===Number(contact.set))?.rallies?.[contact.source?.rallyIndex];
  if(!rally?.id||contact.nativeId==null)return {ok:false,reason:'El contacto no tiene referencia original estable'};
  const key=`a:${contact.set}:${rally.id}:${contact.nativeId}`;
  win.v780Select?.(key);
  const loaded=!!win.VC_VIDEO_REVIEW_API?.loaded?.();
  if(loaded&&play)win.v780PlayKey?.(key);
  return {ok:true,key,played:loaded&&play,hasSource:loaded,rallyKey:contact.rallyKey};
 }
 function selectionFeedback(root,rally,result){
  if(!root)return;
  const detail=root.querySelector('#vc19314-status'),score=root.querySelector('#vc19314-selection-score'),note=root.querySelector('#vc19314-selection-note');
  if(detail)detail.textContent=result.ok?(result.played?'Reproduciendo la jugada vinculada.':result.hasSource?'Jugada seleccionada.':'Jugada seleccionada. Carga o vincula su vídeo para reproducirla.'):(result.reason||'No se pudo localizar la jugada');
  if(score){const s=result.before;score.textContent=s?`SET ${s.set} · ${s.scores.ours}–${s.scores.opponent} · R${s.ownRotation??'—'}/R${s.rivalRotation??'—'}`:'Marcador de este rally no registrado';}
  if(note)note.textContent=result.played?'Video Review gestiona la reproducción y la sincronización del marcador.':'Nunca se muestra como histórico el marcador actual sin referencias de tiempo fiables.';
 }
 function filterCodes(root,value){const needle=text(value).toLocaleLowerCase('es-ES');let count=0;
  root.querySelectorAll('.vc19314-code-row').forEach(row=>{const visible=!needle||text(row.dataset.vc19314Text).includes(needle);row.hidden=!visible;if(visible)count++;});return count;
 }
 function handleClick(win,button,{ctx,projection,node,state,selectRally}={}){
  const action=button?.dataset?.vc19314Action,contactKey=button?.dataset?.vc19314Contact;
  if(action===undefined&&contactKey===undefined)return {handled:false};
  if(contactKey!==undefined){
   const c=arr(projection?.base?.contacts).find(x=>x.key===contactKey);
   if(c?.rallyKey)selectRally?.(c.rallyKey,{play:false});
   const result=selectContact(win,ctx?.match,c);
   node.querySelectorAll('.vc19314-code-row.is-selected').forEach(b=>b.classList.remove('is-selected'));button.classList.add('is-selected');
   selectionFeedback(node,arr(projection?.base?.rallies).find(x=>x.key===c?.rallyKey),result);
   return {handled:true};
  }
  switch(action){
   case 'recording':win.v780OpenRecordingPicker?.();break;
   case 'file':win.document.getElementById('v780-file')?.click();break;
   case 'live':win.v117ReviewSetSource?.('live');break;
   case 'delay':win.v117ReviewSetSource?.('delay');break;
   case 'source':park(win);win.v11Navigate?.('video');win.v780Open?.();win.VC_VIDEO_WORKSPACE?.openAnalysis?.();break;
   case 'skip-back':win.v780Jump?.(-8);break;
   case 'skip-next':win.v780Jump?.(5);break;
   case 'play':win.v780TogglePlay?.();break;
   case 'fullscreen':win.v780Fullscreen?.();break;
   case 'selected':{
    const r=arr(projection?.base?.rallies).find(x=>x.key===state?.selected),result=select(win,ctx?.match,r,{play:true});selectionFeedback(node,r,result);break;
   }
   default:return {handled:false};
  }return {handled:true};
 }
 return Object.freeze({VERSION,model,render,attach,park,alignMatch,select,selectContact,selectionFeedback,filterCodes,handleClick});
});
