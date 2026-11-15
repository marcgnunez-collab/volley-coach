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
