/* Volley Coach V19.3.3 — Analysis Engine Pro.
 * Original, read-only cross-filtering over the canonical V16.1.4 extracted rallies.
 * No scoring, Supabase, media or persistence APIs. Unknown data remains unknown.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_ENGINE_1933=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.3', SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const EVALS=new Set(['#','+','!','-','/','=']);
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const norm=x=>txt(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b?Math.round(a*1000/b)/10:null;
 const fmt=x=>x===null?'—':`${x.toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const has=x=>x!==undefined&&x!==null&&txt(x)!=='';
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])(?:[A-D])?$/);return m?m[1]:''};
 const skillOf=x=>txt(x?.skill).toUpperCase();
 const evalOf=x=>txt(x?.ev||x?.evaluation);
 const playerOf=x=>txt(x?.player||x?.a?.playerNameSnapshot||x?.a?.playerLabel||x?.a?.playerNumberSnapshot);
 const teamOf=x=>x?.team==='ours'?'ours':x?.team==='opponent'?'opponent':'';
 const videoOf=x=>x?.video===true; // explicitly verified by Analysis Intelligence
 function matchesAction(action,filters={}){
  const team=filters.team==='ours'?'ours':'opponent';
  if(teamOf(action)!==team)return false;
  if(filters.skill&&skillOf(action)!==txt(filters.skill).toUpperCase())return false;
  if(filters.player&&norm(playerOf(action))!==norm(filters.player))return false;
  if(filters.evaluation&&evalOf(action)!==filters.evaluation)return false;
  if(filters.video==='yes'&&!videoOf(action))return false;
  if(filters.video==='no'&&videoOf(action))return false;
  if(filters.startZone&&zone(action?.a?.startZone)!==zone(filters.startZone))return false;
  if(filters.endZone&&zone(action?.a?.endZone)!==zone(filters.endZone))return false;
  return true;
 }
 function hasActionFilters(f={}){return !!(f.skill||f.player||f.evaluation||f.video||f.startZone||f.endZone)}
 function filterRows(rows,filters={}){
  const set=Number(filters.set),hasSet=Number.isInteger(set)&&set>=1&&set<=99;
  return arr(rows).filter(r=>{
   if(hasSet&&Number(r.set)!==set)return false;
   if(filters.result&&r.winner!==filters.result)return false;
   if(hasActionFilters(filters)&&!arr(r.actions).some(a=>matchesAction(a,filters)))return false;
   return true;
  });
 }
 function coverageCounts(rallies,team){
  const actions=arr(rallies).flatMap(r=>arr(r.actions).filter(a=>teamOf(a)===team));
  const skills=arr(actions).filter(a=>SKILLS[skillOf(a)]);
  const rate=(name,items,fn)=>({name,n:items.filter(fn).length,total:items.length,pct:pct(items.filter(fn).length,items.length)});
  const a=skills.filter(x=>skillOf(x)==='A'),e=skills.filter(x=>skillOf(x)==='E'),r=skills.filter(x=>skillOf(x)==='R');
  return [rate('Valoración de acciones',skills,x=>EVALS.has(evalOf(x))),
   rate('Jugador identificado',skills,x=>has(playerOf(x))&&norm(playerOf(x))!=='sin identificar'),
   rate('Recepción · calidad',r,x=>EVALS.has(evalOf(x))),
   rate('Recepción · zona de contacto',r,x=>!!zone(x.a?.contactZone||x.a?.endZone)),
   rate('Colocación · destino',e,x=>!!zone(x.a?.setTarget)),
   rate('Colocación · tempo',e,x=>has(x.a?.setTempo)),
   rate('Ataque · origen',a,x=>!!zone(x.a?.startZone)),
   rate('Ataque · destino',a,x=>!!zone(x.a?.endZone)),
   rate('Ataque · combinación',a,x=>has(x.a?.attackCombo)),
   rate('Ataque · tempo',a,x=>has(x.a?.attackTempo))];
 }
 function grouped(items,key){const groups=new Map();for(const x of arr(items)){const label=txt(key(x))||'Sin identificar';if(!groups.has(label))groups.set(label,[]);groups.get(label).push(x)}return [...groups].map(([name,actions])=>({name,actions,n:actions.length})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'))}
 function stats(actions){
  const n=actions.length,rated=actions.filter(a=>EVALS.has(evalOf(a))),evaluated=rated.length;
  const count=e=>rated.filter(a=>evalOf(a)===e).length;
  const perfect=count('#'),positive=count('+'),errors=count('='),blocked=count('/');
  return {n,evaluated,missing:n-evaluated,perfect,positive,errors,blocked,
   perfectPct:pct(perfect,evaluated),positivePct:pct(perfect+positive,evaluated),
   killPct:pct(perfect,evaluated),eff:pct(perfect-errors-blocked,evaluated)};
 }
 function analyze(rows,filters={}){
  const team=filters.team==='ours'?'ours':'opponent',rallies=filterRows(rows,filters);
  const teamActions=rallies.flatMap(r=>arr(r.actions).filter(a=>teamOf(a)===team));
  const actions=hasActionFilters(filters)?teamActions.filter(a=>matchesAction(a,filters)):teamActions;
  const bySkill=grouped(actions.filter(a=>SKILLS[skillOf(a)]),a=>skillOf(a)).map(g=>({...g,label:SKILLS[g.name],...stats(g.actions)}));
  const byPlayer=grouped(actions.filter(a=>has(playerOf(a))),playerOf).map(g=>({...g,...stats(g.actions)}));
  const wins=rallies.filter(r=>r.winner===team).length;
  const availability=coverageCounts(rallies,team);
  return {team,filters,rallies,actions,rallyCount:rallies.length,winCount:wins,winPct:pct(wins,rallies.length),
   actionsCount:teamActions.length,selectedActions:actions.length,bySkill,byPlayer,availability,
   missingServer:rallies.filter(r=>r.serving!=='ours'&&r.serving!=='opponent').length,
   missingOwnRotation:rallies.filter(r=>!Number.isInteger(Number(r.ownRotation))||Number(r.ownRotation)<1||Number(r.ownRotation)>6).length,
   missingRivalRotation:rallies.filter(r=>!Number.isInteger(Number(r.rotation))||Number(r.rotation)<1||Number(r.rotation)>6).length,
   validEvaluation:actions.filter(a=>EVALS.has(evalOf(a))).length,
   videoActions:actions.filter(videoOf).length};
 }
 function facets(rows,team='opponent'){
  const all=arr(rows),actions=all.flatMap(r=>arr(r.actions).filter(a=>teamOf(a)===team));
  const uniq=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  return {sets:uniq(all.map(r=>txt(r.set))),players:uniq(actions.map(playerOf).filter(v=>norm(v)!=='sin identificar')),
   skills:uniq(actions.map(skillOf).filter(s=>SKILLS[s])),evaluations:uniq(actions.map(evalOf).filter(v=>EVALS.has(v)))};
 }
 function render(data){
  if(!data)return '';
  const mini=(label,value,detail)=>`<article class="vc1933-metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`;
  const actionLabel=data.filters.skill?` · ${SKILLS[data.filters.skill]||data.filters.skill}`:'';
  const skillRows=data.bySkill.map(g=>`<tr><td><button type="button" data-vc1933-drill-skill="${esc(g.name)}">${esc(g.label||g.name)}</button></td><td>${g.n}</td><td>${g.evaluated}/${g.n}</td><td>${fmt(g.positivePct)}</td><td>${['A','S','B'].includes(g.name)?fmt(g.killPct):'—'}</td><td>${g.name==='A'?fmt(g.eff):'—'}</td></tr>`).join('');
  const playerRows=data.byPlayer.slice(0,16).map(g=>`<tr><td><button type="button" data-vc1933-drill-player="${esc(g.name)}">${esc(g.name)}</button></td><td>${g.n}</td><td>${g.evaluated}/${g.n}</td><td>${fmt(g.positivePct)}</td><td>${data.filters.skill==='A'?fmt(g.eff):'—'}</td></tr>`).join('');
  const coverage=data.availability.map(g=>`<div class="vc1933-cover"><div class="vc1933-cover-head"><span>${esc(g.name)}</span><b>${g.total?`${g.n}/${g.total} · ${fmt(g.pct)}`:'Sin muestra'}</b></div><div class="vc1933-track"><i style="width:${g.pct===null?0:Math.max(0,Math.min(100,g.pct))}%"></i></div></div>`).join('');
  return `<section class="vc1930-card vc1933-workbench" aria-label="Analysis Engine Pro">
   <div class="vc1933-head"><div><small>V19.3.3 · ANALYSIS ENGINE PRO</small><h3>Estudio estadístico cruzado</h3><p>Una misma selección controla los indicadores, las rotaciones, las acciones y la lista de rallies. Las celdas son navegables.</p></div><span class="vc1933-readonly">Solo lectura</span></div>
   <div class="vc1933-metrics">${mini('Rallies seleccionados',data.rallyCount,'Misma base de la evidencia')}${mini('Resultado del equipo analizado',fmt(data.winPct),`${data.winCount}/${data.rallyCount} rallies`)}${mini('Acciones del equipo',data.selectedActions,`${data.actionsCount} antes del filtro de acción`)}${mini('Evaluaciones válidas',`${data.validEvaluation}/${data.selectedActions}`,`${data.videoActions} acciones con marca de vídeo`)}</div>
   <div class="vc1933-columns"><article><h4>Fundamentos${esc(actionLabel)}</h4><p>Los porcentajes de valoración utilizan solo acciones con código reconocido. Una muestra vacía no equivale a 0%.</p><div class="vc1930-scroll"><table><thead><tr><th>Fundamento</th><th>Acciones</th><th>Evaluadas</th><th>Positivas #/+</th><th>Kill #</th><th>EFF ataque</th></tr></thead><tbody>${skillRows||'<tr><td colspan="6">No hay acciones codificadas para esta selección.</td></tr>'}</tbody></table></div></article>
   <article><h4>Jugadores</h4><p>Selecciona un jugador para restringir todas las tablas a los rallies en los que intervino.</p><div class="vc1930-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th><th>Evaluadas</th><th>Positivas #/+</th><th>EFF ataque*</th></tr></thead><tbody>${playerRows||'<tr><td colspan="5">No hay jugadores identificados en la selección.</td></tr>'}</tbody></table></div><small>* EFF solo cuando el filtro de fundamento es Ataque.</small></article></div>
   <div class="vc1933-coverage"><div><h4>Auditoría de calidad de codificación</h4><p>Porcentaje de campos presentes dentro del equipo y rallies seleccionados. Los campos ausentes se consideran desconocidos, no errores.</p></div><div class="vc1933-coverage-grid">${coverage}</div></div>
   <p class="vc1933-foot">Rallies sin servidor: ${data.missingServer}; sin rotación propia: ${data.missingOwnRotation}; sin rotación rival: ${data.missingRivalRotation}. La ausencia de datos condiciona lo que se puede concluir.</p>
   </section>`;
 }
 return {VERSION,SKILLS,EVALS,zone,playerOf,matchesAction,hasActionFilters,filterRows,coverageCounts,stats,analyze,facets,render};
});
