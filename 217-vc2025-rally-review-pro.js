/* Volley Coach V20.2.5 · Rally Review Pro
 * Read-only review surface. All changes open the canonical protected editor
 * (V19.3.15); video uses the original Video Review timeline/player.
 */
(function (root, factory) {
 'use strict';
 const api = factory(root);
 if (typeof module === 'object' && module.exports) module.exports = api;
 if (!root?.document) return;
 if (root.VC_RALLY_REVIEW_2025) return;
 root.VC_RALLY_REVIEW_2025 = api;
 if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', api.boot, { once: true });
 else api.boot();
})(typeof window !== 'undefined' ? window : null, function (win) {
 'use strict';
 const VERSION = '20.2.5';
 const arr = value => Array.isArray(value) ? value : [];
 const str = value => String(value ?? '').trim();
 const esc = value => str(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
 const player = a => str(a?.number ?? a?.playerNumberSnapshot ?? a?.playerNumber ?? a?.playerLabel ?? a?.playerNameSnapshot);
 const validScore = s => s && Number.isInteger(Number(s.us)) && Number.isInteger(Number(s.opponent)) && Number(s.us) >= 0 && Number(s.opponent) >= 0 && String(s.us).trim() !== '' && String(s.opponent).trim() !== '' && s.us != null && s.opponent != null;
 const score = s => validScore(s) ? `${Number(s.us)}–${Number(s.opponent)}` : '—';
 const match = () => win?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.() || null;
 const byId = id => win?.document?.getElementById(id) || null;
 const visible = () => !!byId('scout-match-mode')?.classList.contains('active');
 let mounted = false, open = false, selected = '', currentId = '', signature = '', dock = null, timer = null;
 let filters = { set: '', player: '', skill: '', grade: '', rotation: '' };
 const state = () => ({open, selected, currentId, filters:{...filters}});

 function collect(matchData) {
  const bridge=win?.VC_RALLY_TIMELINE_2062;
  if(bridge?.VERSION==='20.6.2'&&bridge.readOnly===true&&bridge.canonicalReferences===true&&typeof bridge.review==='function'){
   try{const typed=bridge.review(matchData);if(Array.isArray(typed)){
    let index=0,valid=true;const sets=arr(matchData?.sets);
    outer:for(let si=0;si<sets.length;si++){
     if(!(si in sets))continue;
     const set=sets[si],rallies=arr(set?.rallies);
     for(let ri=0;ri<rallies.length;ri++){
      if(!(ri in rallies))continue;
      const rally=rallies[ri],row=typed[index++];
      if(!row||Object.keys(row).length!==12||
       !Object.is(row.key,`${si}:${ri}:${str(rally?.id??'')}`)||
       !Object.is(row.setIndex,si)||!Object.is(row.rallyIndex,ri)||
       !Object.is(row.setNo,set?.number??si+1)||!Object.is(row.rallyNo,ri+1)||
       !Object.is(row.id,rally?.id)||!Object.is(row.rally,rally)||
       !Object.is(row.actions,arr(rally?.actions))||
       !Object.is(row.winner,rally?.winner||null)||
       !Object.is(row.rotation,rally?.rotationBefore??null)||
       !Object.is(row.before,rally?.scoreBefore)||!Object.is(row.after,rally?.scoreAfter)){
       valid=false;break outer;
      }
     }
    }
    if(valid&&index===typed.length)return typed;
   }
   }catch(_){}
  }
  return arr(matchData?.sets).flatMap((set, si) => arr(set?.rallies).map((rally, ri) => ({
   key: `${si}:${ri}:${str(rally?.id ?? '')}`, setIndex: si, rallyIndex: ri,
   setNo: set?.number ?? si + 1, rallyNo: ri + 1, id: rally?.id, rally,
   actions: arr(rally?.actions), winner: rally?.winner || null,
   rotation: rally?.rotationBefore ?? null, before: rally?.scoreBefore, after: rally?.scoreAfter
  })));
 }
 function issues(item, parser, matchData) {
  if (!item) return [];
  const found = [], ids = new Set(); let previousTime = null;
  for (const [i,a] of item.actions.entries()) {
   const code = str(a?.code || a?.raw).toUpperCase();
   if (!code) found.push(`Contacto ${i+1}: falta el código.`);
   else if (typeof parser === 'function') {
    try { const out = parser(code, matchData, a); if (out?.error || !out?.action) found.push(`Contacto ${i+1}: código no reconocido.`); }
    catch (_) { found.push(`Contacto ${i+1}: no se puede interpretar el código.`); }
   }
   if (a?.id == null) found.push(`Contacto ${i+1}: sin identificador; revisa antes de editar.`);
   else if (ids.has(str(a.id))) found.push(`Contacto ${i+1}: identificador duplicado.`);
   else ids.add(str(a.id));
   if (a?.seq != null && Number(a.seq) !== i+1) found.push(`Contacto ${i+1}: orden interno no coincide.`);
   const t = a?.scoutMs == null ? null : Number(a.scoutMs);
   if (t != null && Number.isFinite(t)) {
    if (previousTime != null && t < previousTime) found.push(`Contacto ${i+1}: tiempo anterior al contacto previo.`);
    previousTime = t;
   }
  }
  if (item.winner === 'ours' || item.winner === 'opponent') {
   if (!validScore(item.before) || !validScore(item.after)) found.push('Marcador histórico incompleto; no se reconstruyen puntos.');
   else {
    const us = Number(item.after.us)-Number(item.before.us), them = Number(item.after.opponent)-Number(item.before.opponent);
    if ((item.winner === 'ours' && (us !== 1 || them !== 0)) || (item.winner === 'opponent' && (us !== 0 || them !== 1)))
     found.push('Posible incoherencia entre ganador y tanteo registrado.');
   }
  }
  return found;
 }
 function filterRows(rows, f=filters) {
  return rows.filter(r => (!f.set || String(r.setNo) === String(f.set)) &&
   (!f.rotation || String(r.rotation) === String(f.rotation)) &&
   (!f.player && !f.skill && !f.grade || r.actions.some(a =>
    (!f.player || player(a) === String(f.player)) &&
    (!f.skill || str(a?.skill) === f.skill) && (!f.grade || str(a?.evaluation) === f.grade))));
 }
 function optionList(values, selectedValue, names={}) {
  return values.map(v => `<option value="${esc(v)}"${str(v) === str(selectedValue) ? ' selected' : ''}>${esc(names[v] || v)}</option>`).join('');
 }
 function stableSignature(m) {
  // Some external sync routes replace rallies without changing updatedAt.
  return JSON.stringify([m?.id, m?.updatedAt, arr(m?.sets).map(s => [s?.number,arr(s?.rallies).map(r => [r?.id,r?.winner,r?.scoreBefore,r?.scoreAfter,r?.rotationBefore,arr(r?.actions).map(a => [a?.id,a?.code,a?.skill,a?.number,a?.evaluation,a?.seq,a?.videoExactTime])])])]);
 }
 function canEdit(m) { return !!m && str(m.status) !== 'finished' && !!win?.VC_SCOUTING_EDITOR_19315?.open; }
 function editor(item, actionIndex=0) {
  const m=match(), api=win?.VC_SCOUTING_EDITOR_19315;
  if (!m || !item || m.id == null || !api?.open) return notify('Editor no disponible o scouting no seleccionado.',true);
  if (!canEdit(m)) return notify('Reabre el scouting finalizado desde Gestión para corregir contactos.',true);
  const found=collect(m).find(r => r.key === item.key && String(r.id) === String(item.id));
  if (!found || found.id == null) return notify('El rally ha cambiado. Actualiza la revisión.',true);
  const projected={nativeId:found.id,set:found.setNo,provenance:{setIndex:found.setIndex,rallyIndex:found.rallyIndex},
   contacts: found.actions[actionIndex] ? [{key:'review-selected',nativeId:found.actions[actionIndex].id,source:{actionIndex}}] : []};
  const result=api.open(win,m,projected,projected.contacts.length?'review-selected':null,found.actions[actionIndex]?.team==='opponent'?'opponent':'ours');
  if (!result?.ok) return notify(result?.error || 'No se pudo abrir el editor.',true);
  notify('Corrige la secuencia en el editor protegido y confirma «Guardar y recalcular».');return true;
 }
 function timeKey(item, actionIndex) {
  const a=item?.actions?.[actionIndex];
  if (!a || a.id == null || item?.id == null) return null;
  return `a:${item.setNo}:${item.id}:${a.id}`;
 }
 function reviewReady(m) {
  const diag=win?.v780Diagnostics?.() || {};
  return !!win?.VC_VIDEO_REVIEW_API?.loaded?.() && String(diag.match) === String(m?.id) && String(diag.fileMatchId) === String(m?.id);
 }
 function play(item, index=null) {
  const m=match(), api=win?.VC_VIDEO_REVIEW_API;
  if (!reviewReady(m)) return notify('Carga en Video Review un archivo o grabación del mismo partido para navegar por sus contactos.',true);
  const key=index === null ? `r:${item.setNo}:${item.id}` : timeKey(item,index);
  if (!key || !api?.rangeForKey?.(key)) return notify('Este contacto no dispone de tiempo verificable en la fuente actual. No se inventará uno.',true);
  api.select?.(key); api.play?.(key);
  notify(`Vídeo vinculado: set ${item.setNo}, rally ${item.rallyNo}${index === null ? '' : ', contacto '+(index+1)}.`);
  if (!dock) showVideo();
  return true;
 }
 function notify(message, error=false) { const el=byId('vc2025-feedback');if(el){el.textContent=message;el.classList.toggle('is-error',error)}return false; }
 function restoreVideo() {
  if (dock?.placeholder?.parentNode && dock.frame) dock.placeholder.replaceWith(dock.frame);
  dock=null;byId('vc2025-review-video')?.classList.remove('has-video');
 }
 function showVideo() {
  const m=match(), host=byId('vc2025-review-video'), frame=byId('v780-video-frame');
  if (!host || !frame) return notify('El reproductor de revisión todavía no está disponible.',true);
  if (!reviewReady(m)) return notify('Abre un vídeo del mismo partido en Video Review para mostrar su vista previa.',true);
  if (dock?.frame === frame) return true;
  if (byId('vc19314-player-host')?.contains(frame)) return notify('Este reproductor está ocupado por Análisis. Vuelve al Scouting para revisarlo.',true);
  if (!frame.parentNode) return notify('No se puede trasladar el reproductor.',true);
  const placeholder=win.document.createComment('vc2025-review-video-original-position');
  frame.parentNode.replaceChild(placeholder,frame);
  host.append(frame);dock={frame,placeholder};host.classList.add('has-video');return true;
 }
 function choices(rows) {
  const unique = key => [...new Set(rows.flatMap(r => r.actions.map(a => key === 'player' ? player(a) : str(a?.[key]))).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'es',{numeric:true}));
  const sets=[...new Set(rows.map(r => str(r.setNo)))], rotations=[...new Set(rows.map(r=>str(r.rotation)).filter(v=>/^[1-6]$/.test(v)))].sort();
  return {sets,rotations,players:unique('player'),skills:unique('skill'),grades:unique('evaluation')};
 }
 function makeWindow() {
  let root=byId('vc2025-window');if(root)return root;
  root=win.document.createElement('section');root.id='vc2025-window';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','Rally Review Pro');root.setAttribute('aria-modal','false');
  root.innerHTML=`<header class="vc2025-head"><div><span>VOLLEY COACH · V${VERSION}</span><h2>Rally Review Pro</h2></div><div class="vc2025-head-actions"><button type="button" data-vc2025="prev" aria-label="Rally anterior">← Anterior</button><button type="button" data-vc2025="next" aria-label="Rally siguiente">Siguiente →</button><button type="button" data-vc2025="close" aria-label="Cerrar revisión">×</button></div></header>
   <div class="vc2025-filters"><label>Set<select data-vc2025-filter="set"></select></label><label>Jugador<select data-vc2025-filter="player"></select></label><label>Fundamento<select data-vc2025-filter="skill"></select></label><label>Valoración<select data-vc2025-filter="grade"></select></label><label>Rotación<select data-vc2025-filter="rotation"></select></label><button type="button" data-vc2025="clear">Limpiar filtros</button></div>
   <div class="vc2025-layout"><nav class="vc2025-rallies" aria-label="Historial completo de rallies"><div class="vc2025-pane-title"><strong>Rallies por set</strong><span id="vc2025-count"></span></div><div id="vc2025-rally-list" class="vc2025-rally-list"></div></nav>
   <div class="vc2025-detail"><div id="vc2025-rally-detail"></div><section class="vc2025-video"><div class="vc2025-pane-title"><strong>Vídeo por contacto</strong><button type="button" data-vc2025="video">Mostrar vídeo de revisión</button></div><div id="vc2025-review-video" class="vc2025-review-video"><p>Vídeo original de Video Review: se mostrará aquí al cargar la grabación del mismo partido.</p></div></section><p id="vc2025-feedback" class="vc2025-feedback" role="status" aria-live="polite">El marcador y las rotaciones no se pueden modificar desde la revisión.</p></div></div>
   <footer class="vc2025-footer"><span>Atajos: Alt + ← / → · Esc para cerrar</span><button type="button" data-vc2025="edit">Editar secuencia · añadir / borrar / ordenar</button></footer>`;
  (byId('vc2023-windows') || byId('scout-match-mode'))?.append(root);
  return root;
 }
 function renderFilters(rows) {
  const lists=choices(rows), values={set:lists.sets,player:lists.players,skill:lists.skills,grade:lists.grades,rotation:lists.rotations};
  const names={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
  for (const [key,options] of Object.entries(values)) {
   const node=byId('vc2025-window')?.querySelector(`[data-vc2025-filter="${key}"]`);if(!node)continue;
   node.innerHTML=`<option value="">Todos</option>`+optionList(options,filters[key],key==='skill'?names:{});
   if(filters[key] && !options.includes(filters[key])) { filters[key]='';node.value=''; }
  }
 }
 function render(force=false) {
  if(!open || !visible())return false;
  const m=match(); if(!m){notify('No hay un scouting activo.',true);return false;}
  const all=collect(m),stamp=stableSignature(m);
  if(!force && stamp===signature && currentId===str(m.id))return true;
  if(currentId!==str(m.id)){selected='';filters={set:'',player:'',skill:'',grade:'',rotation:''};restoreVideo();}
  currentId=str(m.id);signature=stamp;renderFilters(all);
  const rows=filterRows(all),list=byId('vc2025-rally-list');if(!list)return false;
  if(!rows.some(r=>r.key===selected))selected=rows[0]?.key||'';
  byId('vc2025-count').textContent=`${rows.length} / ${all.length}`;
  list.innerHTML=rows.map(r=>`<button type="button" data-vc2025-rally="${esc(r.key)}" class="${r.key===selected?'is-selected':''}" aria-current="${r.key===selected?'true':'false'}"><span>S${esc(r.setNo)} · R${r.rallyNo}</span><strong>${esc(score(r.before))} → ${esc(score(r.after))}</strong><small>${r.actions.length} contactos · ${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Resultado pendiente'}</small></button>`).join('')||'<p class="vc2025-empty">Sin rallies para estos filtros.</p>';
  renderDetail(rows.find(r=>r.key===selected) || null,m);return true;
 }
 function renderDetail(item,m) {
  const node=byId('vc2025-rally-detail');if(!node)return;
  if(!item){node.innerHTML='<p class="vc2025-empty">Selecciona un rally para ver su secuencia de contactos.</p>';return;}
  const warnings=issues(item,win?.VC_SCOUT_CORE?.parse || win?.v680ParseCode,m);
  const r=item.rotation!=null&&Number.isInteger(Number(item.rotation))&&Number(item.rotation)>=1&&Number(item.rotation)<=6?'R'+item.rotation:'—';
  node.innerHTML=`<div class="vc2025-rally-context"><div><small>SET ${esc(item.setNo)} · RALLY ${item.rallyNo}</small><h3>${esc(score(item.before))} <span>→</span> ${esc(score(item.after))}</h3><p>${item.winner==='ours'?'Punto propio':item.winner==='opponent'?'Punto rival':'Sin ganador registrado'} · Rotación inicial ${r} · ${item.actions.length} contactos</p></div><button type="button" data-vc2025="play-rally">▶ Rally</button></div>
   <div class="vc2025-pane-title"><strong>Secuencia de contactos</strong><span>Código · jugador · valoración</span></div>
   <div class="vc2025-actions">${item.actions.map((a,i)=>`<div class="vc2025-action"><span class="vc2025-order">${i+1}</span><code title="Código original">${esc(a?.code || a?.raw || 'Sin código')}</code><span>#${esc(player(a) || '—')} · ${esc(a?.skill || '—')} · ${esc(a?.evaluation || '—')}</span><button type="button" data-vc2025-play="${i}" title="Reproducir contacto">▶</button><button type="button" data-vc2025-edit="${i}" title="Editar contacto">Editar</button></div>`).join('')||'<p class="vc2025-empty">Rally sin contactos. Puedes añadirlos con el editor protegido.</p>'}</div>
   <div class="vc2025-audit ${warnings.length?'has-warnings':'is-clean'}"><strong>${warnings.length?`Revisar · ${warnings.length} aviso${warnings.length===1?'':'s'}`:'Secuencia sin incidencias detectadas'}</strong>${warnings.length?`<ul>${warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:'<p>Comprobación informativa; no sustituye la revisión del analista.</p>'}</div>`;
 }
 function select(key) { selected=key;signature='';render(true); }
 function jump(direction) {
  const rows=filterRows(collect(match())),index=rows.findIndex(r=>r.key===selected);
  if(!rows.length)return false;
  select(rows[Math.min(rows.length-1,Math.max(0,index+direction))].key);
  Array.from(byId('vc2025-rally-list')?.querySelectorAll('[data-vc2025-rally]') || []).find(b=>b.dataset.vc2025Rally===selected)?.focus?.();return true;
 }
 function start() {
  if(!visible())return false;
  makeWindow().hidden=false;open=true;signature='';render(true);return true;
 }
 function close() {restoreVideo();const node=byId('vc2025-window');if(node)node.hidden=true;open=false;return true;}
 function onClick(e) {
  const b=e.target?.closest?.('[data-vc2025],[data-vc2025-open],[data-vc2025-rally],[data-vc2025-edit],[data-vc2025-play]');if(!b)return;
  if(b.hasAttribute('data-vc2025-open')){e.preventDefault();start();return;}
  if(!open || !byId('vc2025-window')?.contains(b))return;
  const item=collect(match()).find(r=>r.key===selected),cmd=b.dataset.vc2025;
  if(b.dataset.vc2025Rally!=null){select(b.dataset.vc2025Rally);return;}
  if(b.dataset.vc2025Edit!=null){editor(item,Number(b.dataset.vc2025Edit));return;}
  if(b.dataset.vc2025Play!=null){play(item,Number(b.dataset.vc2025Play));return;}
  switch(cmd) {
   case 'close':close();break;
   case 'prev':jump(-1);break;
   case 'next':jump(1);break;
   case 'clear':filters={set:'',player:'',skill:'',grade:'',rotation:''};signature='';render(true);break;
   case 'edit':editor(item);break;
   case 'video':showVideo();break;
   case 'play-rally':play(item);break;
  }
 }
 function onChange(e) {const key=e.target?.dataset?.vc2025Filter;if(!open || !Object.hasOwn(filters,key))return;filters[key]=str(e.target.value);signature='';render(true);}
 function onKey(e) {
  if(!visible() || e.defaultPrevented || e.ctrlKey || e.metaKey)return;
  if(e.altKey && e.shiftKey && e.code==='KeyR'){e.preventDefault();start();return;}
  if(!open || e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(e.key==='Escape' && !e.altKey){e.preventDefault();close();return;}
  if(e.altKey && (e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();jump(e.key==='ArrowLeft'?-1:1);}
 }
 function injectLaunch() {
  const nav=byId('vc2023-menubar');if(!nav)return false;
  if(!byId('vc2025-launch')){
   const button=win.document.createElement('button');button.id='vc2025-launch';button.type='button';button.textContent='▤ Revisar rallies';button.dataset.vc2025Open='';button.title='Rally Review Pro (Alt + Mayús + R)';
   nav.insertBefore(button,nav.querySelector('.vc2023-return') || null);
  }
  const menu=nav.querySelector('.vc2023-menu:nth-child(3) .vc2023-dropdown');
  if(menu && !menu.querySelector('[data-vc2025-open]')){
   const button=win.document.createElement('button');button.type='button';button.dataset.vc2025Open='';button.textContent='Rally Review Pro · historial completo';button.setAttribute('role','menuitem');menu.append(button);
  }
  return true;
 }
 function boot() {
  if(!win?.document)return false;injectLaunch();
  if(mounted)return true;mounted=true;
  win.document.addEventListener('click',onClick);
  win.document.addEventListener('change',onChange);
  win.document.addEventListener('keydown',onKey);
  win.document.addEventListener('vc19315:edited',()=>{if(open){signature='';render(true);notify('Edición guardada localmente. El estado de nube se consulta en el sincronizador.');}});
  const view=byId('scout-match-mode');
  if(view && win.MutationObserver){new win.MutationObserver(()=>{injectLaunch();if(!visible() && open)close()}).observe(view,{attributes:true,attributeFilter:['class']});}
  timer=win.setInterval?.(()=>{if(!win.document.hidden){injectLaunch();if(open)render();}},2000);
  return true;
 }
 function diagnostics(){return {version:VERSION,mounted,open,currentId,selected,videoDocked:!!dock,timer:!!timer,scoutingMutations:0,usesNativeEditor:true};}
 return {VERSION,collect,issues,filterRows,stableSignature,state,boot,start,close,render,editor,play,restoreVideo,diagnostics};
});
