/* V20.7.17 · Source-preserving defer bundle. Original scripts in exact execution order. */
/* VC20717_SOURCE_BEGIN:184-vc1933-analysis-engine.js */
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

/* VC20717_SOURCE_END:184-vc1933-analysis-engine.js */

/* VC20717_SOURCE_BEGIN:185-vc1934-setter-attack-intelligence.js */
/* Volley Coach V19.3.4 · Setter & Attack Intelligence
 * Read-only, possession-safe E -> A association. Uses canonical V16.1.4
 * extracted action rows; no persistence, cloud or player-state mutations.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_SETTER_ATTACK_1934=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.4', EVALS=new Set(['#','+','!','-','/','=']);
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=x=>txt(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 const pct=(a,b)=>b>0?Math.round(a*1000/b)/10:null;
 const fmt=v=>v===null?'—':`${v.toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const name=a=>txt(a?.player||a?.a?.playerNameSnapshot||a?.a?.playerLabel||a?.a?.playerNumberSnapshot)||'Sin identificar';
 const ev=a=>txt(a?.ev||a?.evaluation);
 const skill=a=>txt(a?.skill).toUpperCase();
 const side=a=>a?.team==='ours'?'ours':a?.team==='opponent'?'opponent':'';
 function sequences(rows,team='opponent'){
  const out=[];
  for(const r of arr(rows)){
   const acts=arr(r?.actions);
   for(let i=0;i<acts.length;i++){
    const set=acts[i];if(side(set)!==team||skill(set)!=='E')continue;
    // A set never belongs to an attack after a change of possession,
    // another set, or another reception (a new team action chain).
    let attack=null;
    for(let j=i+1;j<acts.length;j++){
     const a=acts[j];if(side(a)!==team||['E','R'].includes(skill(a)))break;
     if(skill(a)==='A'){attack=a;break;}
    }
    // A reception belongs only to the same uninterrupted chain.
    // Stop at an opposing action, earlier set, or previous attack.
    let rec=null;
    for(let j=i-1;j>=0;j--){
     const a=acts[j];if(side(a)!==team||['E','A'].includes(skill(a)))break;
     if(skill(a)==='R'){rec=a;break;}
    }
    out.push({r,set,attack,rec,setter:name(set),attacker:attack?name(attack):'',
     target:zone(set.a?.setTarget), // only explicit set target counts as distribution
     attackOrigin:zone(attack?.a?.startZone), // never substituted for set target
     tempo:txt(set.a?.setTempo), // never inferred from attackTempo
     combo:txt(set.a?.attackCombo||attack?.a?.attackCombo),
     reception:rec?ev(rec):'',attackEval:attack?ev(attack):''});
   }
  }
  return out;
 }
 function pairMatches(s,f={}){
  if(f.setter&&norm(s.setter)!==norm(f.setter))return false;
  if(f.target&&s.target!==f.target)return false;
  if(f.tempo&&s.tempo!==f.tempo)return false;
  if(f.sequenceReception&&s.reception!==f.sequenceReception)return false;
  if(f.attacker&&norm(s.attacker)!==norm(f.attacker))return false;
  if(f.combo&&s.combo!==f.combo)return false;
  // Cross-filtering against one concrete action of THIS sequence, not a
  // different action by another player in the same rally.
  const hasActionFilter=f.skill||f.player||f.evaluation||f.video||f.startZone||f.endZone;
  if(hasActionFilter){
   const api=typeof window!=='undefined'?window.VC_ANALYSIS_ENGINE_1933:null;
   if(api?.matchesAction){
    const candidates=[s.rec,s.set,s.attack].filter(Boolean);
    if(['R','E','A'].includes(f.skill)||!f.skill){
     if(!candidates.some(a=>api.matchesAction(a,f)))return false;
    }
   }
  }
  return true;
 }
 const hasPairFilters=f=>!!(f.setter||f.target||f.tempo||f.sequenceReception||f.attacker||f.combo);
 function filterRows(rows,f={}){
  if(!hasPairFilters(f))return arr(rows);
  const team=f.team==='ours'?'ours':'opponent';
  const matching=new Set(sequences(rows,team).filter(s=>pairMatches(s,f)).map(s=>s.r));
  return arr(rows).filter(r=>matching.has(r));
 }
 function summary(items){
  const all=arr(items),linked=all.filter(s=>s.attack),rated=linked.filter(s=>EVALS.has(s.attackEval));
  const kill=rated.filter(s=>s.attackEval==='#').length;
  const error=rated.filter(s=>s.attackEval==='=').length;
  const blocked=rated.filter(s=>s.attackEval==='/').length;
  return {n:all.length,linked:linked.length,rated:rated.length,unrated:linked.length-rated.length,
   kill,error,blocked,killPct:pct(kill,rated.length),eff:pct(kill-error-blocked,rated.length)};
 }
 function group(list,key,missing='Sin codificar'){
  const map=new Map();
  for(const x of arr(list)){
   const k=txt(key(x))||missing;
   if(!map.has(k))map.set(k,[]);
   map.get(k).push(x);
  }
  return [...map].map(([label,items])=>({label,...summary(items),items})).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label,'es',{numeric:true}));
 }
 function facets(rows,team='opponent'){
  const seq=sequences(rows,team),values=key=>[...new Set(seq.map(key).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  return {setters:values(s=>s.setter).filter(v=>v!=='Sin identificar'),targets:values(s=>s.target),
   tempos:values(s=>s.tempo),attackers:values(s=>s.attacker).filter(v=>v!=='Sin identificar'),combos:values(s=>s.combo)};
 }
 function analyze(rows,f={}){
  const team=f.team==='ours'?'ours':'opponent';
  const all=sequences(rows,team),selected=all.filter(x=>pairMatches(x,f));
  const total=summary(selected),hasTarget=selected.filter(x=>x.target).length;
  const hasTempo=selected.filter(x=>x.tempo).length;
  const hasReception=selected.filter(x=>x.rec&&EVALS.has(x.reception)).length;
  const hasAttackOrigin=selected.filter(x=>x.attackOrigin).length;
  const withSetter=selected.filter(x=>x.setter!=='Sin identificar').length;
  const withAttacker=selected.filter(x=>x.attack&&x.attacker!=='Sin identificar').length;
  return {team,filters:f,allCount:all.length,selected,summary:total,
   coverage:{target:hasTarget,tempo:hasTempo,reception:hasReception,origin:hasAttackOrigin,
    setter:withSetter,attacker:withAttacker},
   bySetter:group(selected,s=>s.setter,'Sin identificar'),
   byTarget:group(selected,s=>s.target),
   byTempo:group(selected,s=>s.tempo),
   byReception:group(selected,s=>s.reception),
   byAttacker:group(selected.filter(s=>s.attack),s=>s.attacker,'Sin identificar'),
   byCombo:group(selected,s=>s.combo),
   byRotation:group(selected,s=>{
    const value=Number(team==='ours'?s.r.ownRotation:s.r.rotation);
    return Number.isInteger(value)&&value>=1&&value<=6?'R'+value:'';
   })};
 }
 function csvCell(v){let s=txt(v);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function exportCSV(d){const header=['Partido ID','Fecha','Set','Rally ID','Colocador','Destino explicito E','Tempo E','Combinacion','Calidad R','Atacante','Origen ataque','Valoracion ataque'];const rows=arr(d?.selected).map(s=>[s.r.id,s.r.date,s.r.set,s.r.rally,s.setter,s.target,s.tempo,s.combo,s.reception,s.attacker,s.attackOrigin,s.attackEval]);return '\ufeff'+[header,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');}
 function render(d,minSample=8){
  if(!d)return '';
  const stat=d.summary,c=d.coverage;
  const team=d.team==='ours'?'nuestro equipo':'rival';
  const info=(label,big,foot)=>`<div class="vc1934-kpi"><span>${esc(label)}</span><strong>${esc(big)}</strong><small>${esc(foot)}</small></div>`;
  const btn=(field,value,label)=>`<button type="button" data-vc1934-filter="${field}" data-vc1934-value="${esc(value)}" title="Filtrar todas las tablas por ${esc(label)}">${esc(label)}</button>`;
  const table=(title,desc,items,field,knownOnly=false)=>{
   const list=knownOnly?items.filter(x=>x.label!=='Sin codificar'&&x.label!=='Sin identificar'):items;
   const denominator=knownOnly?list.reduce((s,g)=>s+g.n,0):stat.n;
   const body=list.slice(0,15).map(g=>`<tr><td>${field?btn(field,g.label,g.label):esc(g.label)}</td><td>${g.n}</td><td>${fmt(pct(g.n,denominator))}</td><td>${g.linked}</td><td>${fmt(g.killPct)}</td><td>${fmt(g.eff)}</td><td>${g.rated}/${g.linked}${g.n<minSample?' <small>muestra limitada</small>':''}</td></tr>`).join('');
   return `<article class="vc1930-card vc1934-table"><h4>${esc(title)}</h4><p>${esc(desc)}</p><div class="vc1930-scroll"><table><thead><tr><th>Valor</th><th>Coloc.</th><th>Uso</th><th>Ataques</th><th>Kill</th><th>EFF</th><th>Eval.</th></tr></thead><tbody>${body||'<tr><td colspan="7">No hay datos explícitos para este desglose.</td></tr>'}</tbody></table></div></article>`;
  };
  const evidence=d.selected.slice(-50).reverse().map(s=>`<tr><td>${esc(s.r.date||'—')}</td><td>S${esc(s.r.set)} · ${esc(s.r.index)}</td><td>${esc(s.setter)}</td><td>${esc(s.target||'—')}</td><td>${esc(s.tempo||'—')}</td><td>${esc(s.reception||'—')}</td><td>${esc(s.attacker||'Sin ataque')}</td><td>${esc(s.attackEval||'—')}</td><td>${s.r.id!=null?`<button type="button" data-vc1930-match="${esc(s.r.id)}">Partido</button>`:''}${s.r.rally!=null?`<button type="button" data-vc1930-video="${esc(s.r.id)}" data-vc1930-set="${esc(s.r.set)}" data-vc1930-rally="${esc(s.r.rally)}">Vídeo*</button>`:''}</td></tr>`).join('');
  return `<section class="vc1930-card vc1934-workbench" aria-label="Setter & Attack Intelligence">
   <div class="vc1934-heading"><div><small>V19.3.4 · SETTER & ATTACK INTELLIGENCE</small><h3>Distribución de colocación y resultado ofensivo</h3><p>Análisis del ${team}, enlazado acción a acción dentro de una misma posesión.</p></div><div class="vc1934-heading-actions"><span>Solo lectura</span><button type="button" data-vc1934-csv>Exportar secuencias CSV</button></div></div>
   <div class="vc1934-kpis">${info('Colocaciones',stat.n,`${d.allCount} antes de filtros de secuencia`)}${info('Ataques asociados',stat.linked,`${stat.n-stat.linked} sin ataque posterior`)}${info('Kill de ataque',fmt(stat.killPct),`${stat.kill}/${stat.rated} ataques evaluados`)}${info('Eficiencia ataque',fmt(stat.eff),`(${stat.kill}−${stat.error}−${stat.blocked})/${stat.rated} evaluados`)}</div>
   ${stat.n===0?'<div class="vc1930-data-warning">No hay colocaciones codificadas para esta selección. Sin acciones E y A de la misma posesión no se puede analizar la distribución del colocador.</div>':''}
   <p class="vc1934-audit">Cobertura: destino explícito <b>${c.target}/${stat.n}</b> · tempo de colocación <b>${c.tempo}/${stat.n}</b> · recepción evaluada <b>${c.reception}/${stat.n}</b> · origen del ataque <b>${c.origin}/${stat.n}</b> · colocador identificado <b>${c.setter}/${stat.n}</b> · atacante identificado <b>${c.attacker}/${stat.linked}</b>. Los datos ausentes no equivalen a errores.</p>
   <div class="vc1934-grids">${table('Distribución por colocador','Volumen y eficiencia de ataques vinculados, sin duplicar jugadas.',d.bySetter,'setter')}${table('Destino explícito de colocación','Solo setTarget codificado; no se infiere desde el origen del ataque.',d.byTarget,'target',true)}${table('Tempo del colocador','Solo setTempo registrado en la acción E.',d.byTempo,'tempo',true)}${table('Recepción previa','Solo recepciones de la misma cadena de posesión; sin atribuir calidad desconocida.',d.byReception,'reception',true)}${table('Ataques por receptor de colocación','Atacantes identificados en el ataque inmediatamente posterior.',d.byAttacker,'attacker')}${table('Combinaciones ofensivas','Código explícito de combinación de la colocación o el ataque enlazado.',d.byCombo,'combo',true)}${table('Distribución por rotación','Rotaciones codificadas del equipo analizado.',d.byRotation,null)}</div>
   <article class="vc1930-card vc1934-evidence" id="vc1934-evidence"><h4>Evidencia · colocación → ataque</h4><p>Últimas ${Math.min(50,stat.n)} de ${stat.n} secuencias filtradas. "Vídeo" requiere una grabación asociada y disponible; no transfiere archivos entre dispositivos.</p><div class="vc1930-scroll"><table><thead><tr><th>Fecha</th><th>Set / rally</th><th>Colocador</th><th>Destino E</th><th>Tempo E</th><th>Recep.</th><th>Atacante</th><th>Eval. A</th><th>Revisar</th></tr></thead><tbody>${evidence||'<tr><td colspan="9">Sin secuencias.</td></tr>'}</tbody></table></div></article>
   <p class="vc1934-foot">Kill = ataques # / ataques evaluados; EFF = (# − = − /) / ataques evaluados. Las colocaciones sin ataque o ataques sin valoración no se convierten en resultados negativos. Valores descriptivos, no predicciones.</p>
  </section>`;
 }
 return {VERSION,zone,sequences,pairMatches,hasPairFilters,filterRows,summary,group,facets,analyze,exportCSV,render};
});

/* VC20717_SOURCE_END:185-vc1934-setter-attack-intelligence.js */

/* VC20717_SOURCE_BEGIN:186-vc1935-analysis-workspace.js */
/* Volley Coach 19.3.5 · Professional Analysis Workspace
 * PRESENTATION ONLY: reuses V19.3.0-19.3.4 report/filter/video pathways.
 * The DOM nodes generated by the existing engine are MOVED, not copied.
 * No scoutings, cloud sessions or recordings are written by this module.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_WORKSPACE_1935=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VIEWS=[['overview','Resumen'],['rotations','Rotaciones y K1/K2'],['setter','Colocadores'],['attack','Ataque'],['court','Pistas'],['evidence','Vídeo y rallies']];
 const FILTER_IDS=['vc1930-rival','vc1930-scope','vc1930-phase','vc1930-rotation','vc1932-own-rotation','vc1932-reception','vc1932-attack-start','vc1932-attack-end','vc1930-min','vc1933-set','vc1933-team','vc1933-skill','vc1933-player','vc1933-eval','vc1933-result','vc1933-video','vc1934-setter','vc1934-target','vc1934-tempo','vc1934-attacker','vc1934-sequence-reception','vc1934-combo'];
 const STORAGE_KEY='vc1935:analysis-views:1';
 const value=x=>String(x??'').trim();
 const viewName=v=>VIEWS.some(x=>x[0]===v)?v:'overview';
 const route=node=>{
  if(node.id==='vc1930-evidence')return 'evidence';
  if(node.classList.contains('vc1930-kpis'))return 'kpis';
  if(node.classList.contains('vc1934-workbench'))return 'setter';
  if(node.classList.contains('vc1933-workbench'))return 'overview';
  if(node.classList.contains('vc1930-data-warning')||node.classList.contains('vc1930-empty'))return 'overview';
  if(node.classList.contains('vc1930-section-heading'))return /laboratorio táctico/i.test(node.textContent)?'rotations':'overview';
  if(node.classList.contains('vc1930-grid'))return node.querySelector('.vc1932-court-card')?'court': /combinaciones|direcciones/i.test(node.textContent)?'attack':'overview';
  const h=value(node.querySelector('h3,h4')?.textContent).toLocaleLowerCase('es');
  if(/matriz|k1\/k2 por rotación/i.test(h))return 'rotations';
  if(/colocador|recepción/i.test(h))return 'setter';
  if(/atacant|ataque rival|combinacion|direcci/i.test(h))return 'attack';
  return 'overview';
 };
 function safeViews(raw){
  try{
   const entries=JSON.parse(raw||'[]');if(!Array.isArray(entries))return [];
   return entries.filter(x=>x&&typeof x.name==='string'&&x.name.length<=50&&x.filters&&typeof x.filters==='object').slice(0,20)
    .map(x=>({name:x.name,tab:viewName(x.tab),filters:Object.fromEntries(FILTER_IDS.filter(k=>typeof x.filters[k]==='string'&&x.filters[k].length<120).map(k=>[k,x.filters[k]]))}));
  }catch(_){return []}
 }
 function readFilters(panel){return Object.fromEntries(FILTER_IDS.map(id=>[id,value(panel.querySelector('#'+id)?.value)]));}
 function applyFilters(panel,filters){
  for(const id of FILTER_IDS){const select=panel.querySelector('#'+id);if(!select)continue;
   const requested=value(filters?.[id]);select.value=[...select.options].some(x=>x.value===requested)?requested:'';
  }
 }
 function numeric(s){
  const x=value(s).replace(/\s+/g,'').replace(/%$/,'').replace(/\./g,'').replace(',','.');
  return /^[-+]?\d+(?:\.\d+)?$/.test(x)?Number(x):null;
 }
 function compareCells(a,b){const n=numeric(a),m=numeric(b);if(n!==null&&m!==null)return n-m;return value(a).localeCompare(value(b),'es',{numeric:true,sensitivity:'base'});}
 function sortable(root){
  for(const table of root.querySelectorAll('.vc1930-scroll table')){
   if(table.dataset.vc1935Sorted==='yes')continue;table.dataset.vc1935Sorted='yes';
   const ths=[...table.querySelectorAll('thead th')];
   ths.forEach((th,index)=>{
    if(/evidencia|consultar|abrir|revisar/i.test(th.textContent))return;
    const title=value(th.textContent);if(!title)return;
    const button=table.ownerDocument.createElement('button');button.type='button';button.className='vc1935-sort';button.textContent=title+' ↕';button.setAttribute('aria-label','Ordenar por '+title);button.dataset.vc1935Column=String(index);
    th.textContent='';th.append(button);
   });
  }
 }
 function sortTable(button){
  const table=button.closest('table'),tbody=table?.tBodies[0];if(!tbody)return;
  const index=Number(button.dataset.vc1935Column),next=button.dataset.vc1935Dir==='asc'?'desc':'asc';
  const entries=[...tbody.rows].map((row,i)=>({row,i,text:row.cells[index]?.textContent||''}));
  entries.sort((a,b)=>{const order=compareCells(a.text,b.text);return (next==='asc'?order:-order)||(a.i-b.i)});
  entries.forEach(x=>tbody.append(x.row));
  table.querySelectorAll('[data-vc1935-column]').forEach(btn=>{btn.dataset.vc1935Dir='';btn.setAttribute('aria-sort','none');});
  button.dataset.vc1935Dir=next;button.textContent=button.textContent.replace(/[↑↓↕]$/,'')+(next==='asc'?'↑':'↓');
  button.closest('th')?.setAttribute('aria-sort',next==='asc'?'ascending':'descending');
 }
 function ensure(panel){
  if(panel.querySelector('#vc1935-toolbar'))return;
  panel.classList.add('vc1935-ready');
  const head=panel.querySelector('.vc1930-head'),filters=panel.querySelector('.vc1930-filters');
  if(!head||!filters)return;
  const heading=head.querySelector('h2');if(heading)heading.textContent='Analysis Pro · Workspace';
  const summary=head.querySelector('p');if(summary)summary.textContent='Preparación de rivales, rotaciones, colocadores y vídeo en un solo espacio de trabajo.';
  const originalLaunch=panel.ownerDocument.getElementById('vc1930-open');if(originalLaunch)originalLaunch.textContent='Analysis Pro · Workspace';
  const toolbar=panel.ownerDocument.createElement('div');toolbar.id='vc1935-toolbar';toolbar.className='vc1935-toolbar';
  toolbar.innerHTML=`<div class="vc1935-toolbar-top"><div><strong>ANALYSIS PRO</strong><span>Mesas tácticas · Data + vídeo · Mismos filtros</span></div><div class="vc1935-toolbar-actions"><button type="button" data-vc1935-filters aria-expanded="false">Filtros <span aria-hidden="true">▾</span></button><button type="button" data-vc1935-newview>Guardar vista</button></div></div><nav class="vc1935-tabs" aria-label="Vistas del análisis" role="tablist">${VIEWS.map(([id,label])=>`<button type="button" role="tab" data-vc1935-tab="${id}" aria-selected="false">${label}</button>`).join('')}</nav><div class="vc1935-saved"><label for="vc1935-preset">Vistas guardadas</label><select id="vc1935-preset" aria-label="Vistas guardadas"><option value="">Selecciona una vista</option></select><button type="button" data-vc1935-load>Aplicar</button><button type="button" data-vc1935-delete>Eliminar</button></div><div class="vc1935-save" hidden><label>Nombre de la vista <input id="vc1935-name" maxlength="50" placeholder="Por ejemplo: K1 rival en R3"></label><button type="button" data-vc1935-save>Guardar</button><button type="button" data-vc1935-cancel>Cancelar</button></div>`;
  head.after(toolbar);
  const fold=panel.ownerDocument.createElement('div');fold.className='vc1935-filter-fold';fold.id='vc1935-filter-fold';fold.hidden=true;toolbar.after(fold);fold.append(filters);
  panel.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b||!panel.contains(b))return;
   const state=panel._vc1935;
   if(b.matches('[data-vc1935-tab]')){event.preventDefault();activate(panel,b.dataset.vc1935Tab);return;}
   if(b.hasAttribute('data-vc1935-filters')){const next=!fold.hidden;fold.hidden=next;b.setAttribute('aria-expanded',String(!next));return;}
   if(b.hasAttribute('data-vc1935-newview')){panel.querySelector('.vc1935-save').hidden=false;panel.querySelector('#vc1935-name').focus();return;}
   if(b.hasAttribute('data-vc1935-cancel')){panel.querySelector('.vc1935-save').hidden=true;return;}
   if(b.hasAttribute('data-vc1935-save')){
    const name=value(panel.querySelector('#vc1935-name').value).slice(0,50);if(!name)return;
    try{const storage=panel.ownerDocument.defaultView?.localStorage;
     if(!storage){status(panel,'El navegador no permite guardar preferencias.');return;}
     const views=safeViews(storage.getItem(STORAGE_KEY)).filter(x=>x.name!==name);
     views.push({name,tab:viewName(state.active),filters:readFilters(panel)});
     storage.setItem(STORAGE_KEY,JSON.stringify(views.slice(-20)));
     populate(panel,name);panel.querySelector('.vc1935-save').hidden=true;status(panel,'Vista guardada en este dispositivo.');
    }catch(_){status(panel,'No se pudo guardar la vista en este navegador.');}
    return;
   }
   if(b.hasAttribute('data-vc1935-load')){
    const select=panel.querySelector('#vc1935-preset');const chosen=load(panel).find(x=>x.name===select.value);if(!chosen)return;
    applyFilters(panel,chosen.filters);state.active=viewName(chosen.tab);
    panel.querySelector('[data-vc1930-refresh]')?.click(); // Repopulate options for the selected rival and team.
    applyFilters(panel,chosen.filters);
    panel.querySelector('[data-vc1930-refresh]')?.click();return;
   }
   if(b.hasAttribute('data-vc1935-delete')){
    const select=panel.querySelector('#vc1935-preset'),name=select.value;if(!name)return;
    try{const storage=panel.ownerDocument.defaultView?.localStorage;
     storage?.setItem(STORAGE_KEY,JSON.stringify(load(panel).filter(x=>x.name!==name)));
     populate(panel);status(panel,'Vista local eliminada.');
    }catch(_){status(panel,'No se pudo eliminar la vista.');}return;
   }
   if(b.hasAttribute('data-vc1935-column')){event.preventDefault();sortTable(b);return;}
  });
  panel._vc1935={active:'overview'};
  populate(panel);
 }
 function status(panel,msg){const target=panel.querySelector('#vc1935-status');if(target)target.textContent=msg;}
 function load(panel){try{return safeViews(panel.ownerDocument.defaultView?.localStorage?.getItem(STORAGE_KEY));}catch(_){return []}}
 function populate(panel,selected=''){
  const select=panel.querySelector('#vc1935-preset');if(!select)return;
  const current=selected||select.value;select.innerHTML='<option value="">Selecciona una vista</option>';
  for(const view of load(panel)){const opt=select.ownerDocument.createElement('option');opt.value=view.name;opt.textContent=view.name;select.append(opt)}
  select.value=[...select.options].some(x=>x.value===current)?current:'';
 }
 function activate(panel,tab){
  const active=viewName(tab);panel._vc1935.active=active;
  panel.querySelectorAll('[data-vc1935-tab]').forEach(b=>{const yes=b.dataset.vc1935Tab===active;b.classList.toggle('is-active',yes);b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
  panel.dataset.vc1935Active=active;
  panel.querySelectorAll('[data-vc1935-view]').forEach(section=>{section.hidden=section.dataset.vc1935View!==active;});
  const side=panel.querySelector('.vc1935-evidence');if(side)side.classList.toggle('vc1935-evidence-full',active==='evidence');
  if(typeof window!=='undefined')window.VC_ANALYSIS_WORKSPACE_1936?.switchLayout?.(panel,active);
 }
 function afterRender(panel,data){
  ensure(panel);
  const results=panel.querySelector('#vc1930-results');if(!results||!panel._vc1935)return;
  const nodes=[...results.children];const doc=panel.ownerDocument;
  const kpibox=doc.createElement('div');kpibox.className='vc1935-kpi-host';
  const split=doc.createElement('div');split.className='vc1935-split';
  const main=doc.createElement('div');main.className='vc1935-main';
  const sections=new Map(VIEWS.map(([id])=>{const el=doc.createElement('section');el.className='vc1935-view';el.dataset.vc1935View=id;el.setAttribute('aria-label',VIEWS.find(x=>x[0]===id)[1]);main.append(el);return [id,el]}));
  const side=doc.createElement('aside');side.className='vc1935-evidence';side.setAttribute('aria-label','Evidencia de rallies y vídeo');side.innerHTML='<div class="vc1935-evidence-head"><strong>VÍDEO Y EVIDENCIA</strong><span>Selección actual del análisis</span></div><p class="vc1935-evidence-hint">Los botones «Vídeo» abren la grabación disponible en Video Studio. El vídeo no se duplica ni se transfiere automáticamente.</p>';
  const evidence=doc.createElement('div');evidence.className='vc1935-evidence-list';side.append(evidence);
  const mini=doc.createElement('div');mini.className='vc1935-evidence-mini';
  for(const r of (Array.isArray(data?.selected)?data.selected:[]).slice(-15).reverse()){
   const item=doc.createElement('div');item.className='vc1935-rally';
   const title=doc.createElement('strong');title.textContent=`Set ${r.set??'?'} · Rally ${r.index??r.rally??'?'} · ${r.winner==='opponent'?'Punto rival':'Punto nuestro'}`;
   const meta=doc.createElement('span');meta.textContent=`${r.date||''} · ${r.phase||'Fase sin codificar'} · ${r.rotation?'R'+r.rotation:'Rotación desconocida'}`;
   const buttons=doc.createElement('div');
   const matchBtn=doc.createElement('button');matchBtn.type='button';matchBtn.textContent='Partido';matchBtn.dataset.vc1930Match=String(r.id);buttons.append(matchBtn);
   if(r.rally!=null){const v=doc.createElement('button');v.type='button';v.textContent='Abrir vídeo';v.dataset.vc1930Video=String(r.id);v.dataset.vc1930Set=String(r.set);v.dataset.vc1930Rally=String(r.rally);buttons.append(v)}
   item.append(title,meta,buttons);mini.append(item);
  }
  if(!mini.children.length){const note=doc.createElement('p');note.textContent='Sin rallies en la selección.';mini.append(note)}
  side.append(mini);
  for(const node of nodes){const dest=route(node);if(dest==='kpis')kpibox.append(node);else if(dest==='evidence')evidence.append(node);else sections.get(dest).append(node);}
  if(!evidence.children.length)evidence.innerHTML='<p class="vc1930-empty">Sin rallies que mostrar para este filtro.</p>';
  const evidenceFooter=doc.createElement('p');evidenceFooter.className='vc1935-evidence-count';evidenceFooter.textContent=`${data?.selected?.length||0} rallies filtrados · Evidencia enlazada con el scouting original.`;side.append(evidenceFooter);
  split.append(main,side);results.append(kpibox,split);
  if(!panel.querySelector('#vc1935-status')){const s=doc.createElement('div');s.id='vc1935-status';s.className='vc1935-status';s.setAttribute('role','status');panel.querySelector('#vc1930-notice')?.after(s);}
  sortable(results);activate(panel,panel._vc1935.active);
 }
 return {VERSION:'19.3.5',VIEWS,FILTER_IDS,STORAGE_KEY,route,readFilters,applyFilters,safeViews,numeric,compareCells,afterRender,ensure,activate};
});

/* VC20717_SOURCE_END:186-vc1935-analysis-workspace.js */

/* VC20717_SOURCE_BEGIN:187-vc1936-analysis-three-pane.js */
/* Volley Coach V19.3.6 · Professional Three-Pane Analysis
 * Presentation-only extension of the existing V19.3.5 and V19.3.0 engines.
 * Does NOT write scoutings, recordings, cloud records or match state.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_WORKSPACE_1936=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const v=x=>String(x??'').trim();
 const escape=x=>v(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ZONES=[2,3,4,1,6,5];
 // Relative to the bench: rival is above the net, our court below it.
 const START_POS={1:[0.17,0.14],6:[0.5,0.14],5:[0.83,0.14],2:[0.17,0.39],3:[0.5,0.39],4:[0.83,0.39]};
 const END_POS={4:[0.17,0.61],3:[0.5,0.61],2:[0.83,0.61],5:[0.17,0.86],6:[0.5,0.86],1:[0.83,0.86]};
 const parseZone=input=>{const m=v(input).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);return m?{zone:Number(m[1]),quadrant:m[2]||''}:null;};
 const ratio=(count,total)=>total?Math.round(1000*count/total)/10:null;
 function courtModel(rows,team='opponent'){
  const attacks=[];
  for(const r of Array.isArray(rows)?rows:[]){
   for(const a of Array.isArray(r?.actions)?r.actions:[]){if(a?.skill==='A'&&a?.team===team)attacks.push({r,a,start:parseZone(a.a?.startZone),end:parseZone(a.a?.endZone)});}
  }
  const collect=key=>{
   const coded=attacks.filter(x=>x[key]);
   return {coded:coded.length,missing:attacks.length-coded.length,zones:[1,2,3,4,5,6,7,8,9].map(zone=>{
    const entries=coded.filter(x=>x[key].zone===zone),quad=Object.fromEntries(['A','B','C','D'].map(q=>[q,entries.filter(x=>x[key].quadrant===q).length]));
    return {zone,n:entries.length,pct:ratio(entries.length,coded.length),quadrants:quad,quadrantCoded:Object.values(quad).reduce((s,n)=>s+n,0)};
   })};
  };
  const paths=new Map();
  for(const x of attacks){if(!x.start||!x.end||!START_POS[x.start.zone]||!END_POS[x.end.zone])continue;
   const key=x.start.zone+'-'+x.end.zone;
   const entry=paths.get(key)||{from:x.start.zone,to:x.end.zone,n:0};entry.n++;paths.set(key,entry);
  }
  return {total:attacks.length,origin:collect('start'),destination:collect('end'),
   paths:[...paths.values()].sort((a,b)=>b.n-a.n||a.from-b.from||a.to-b.to), paired:attacks.filter(x=>x.start&&x.end).length,team};
 }
 function courtView(model,mode='origin'){
  const origin=mode!=='destination';const info=origin?model.origin:model.destination;
  const zoneData=n=>info.zones.find(x=>x.zone===n)||{zone:n,n:0,pct:null,quadrants:{},quadrantCoded:0};
  const max=Math.max(1,...info.zones.map(x=>x.n));
  // Canvas-based model is independent of scouting: all percentages come from coded attacks.
  const zoneCell=(no,side)=>{
   const applicable=side===(origin?'top':'bottom');const x=applicable?zoneData(no):null;
   const quadrants=x?['C','B','D','A'].map(q=>`<span title="Subzona ${q}: ${x.quadrants[q]} ataques">${q}${x.quadrants[q]?' · '+x.quadrants[q]:''}</span>`).join(''):'';
   const intensity=x&&x.n?Math.max(0.09,Math.min(0.67,x.n/max*.60)):0;
   const label=x?`Zona ${no}: ${x.n} ataques, ${x.pct}% de las zonas conocidas`:`Zona ${no} (lado ${side==='top'?'rival':'propio'})`;
   const filter=applicable?'data-vc1932-zone="'+no+'" data-vc1932-zone-kind="'+(origin?'start':'end')+'"':'';
   return `<button type="button" class="vc1936-zone${applicable?' is-active':''}" ${filter} ${!applicable||!x?.n?'disabled':''} aria-label="${escape(label)}" style="--vc1936-heat:${intensity}"><b>Z${no}</b>${applicable?`<strong>${x.n||'—'}</strong><small>${x.pct!=null?x.pct.toLocaleString('es-ES')+' %':'Sin datos'}</small><div class="vc1936-subzones" aria-label="Subzonas">${quadrants}</div>`:''}</button>`;
  };
  const top=[1,6,5,2,3,4].map(no=>zoneCell(no,'top')).join('');
  const bottom=[4,3,2,5,6,1].map(no=>zoneCell(no,'bottom')).join('');
  const lines=model.paths.slice(0,6).map((p,i)=>{
   const a=START_POS[p.from],b=END_POS[p.to];const x=a[0]*600,y=a[1]*620,X=b[0]*600,Y=b[1]*620;
   const bend=(i%2?1:-1)*Math.min(35,9*i);
   return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x+X)/2+bend} 310 ${X.toFixed(1)} ${Y.toFixed(1)}" stroke="${i===0?'#ed8425':'#185d98'}" stroke-width="${Math.min(7,2+p.n)}" fill="none" stroke-linecap="round" marker-end="url(#vc1936-head)" opacity=".72"/>`;
  }).join('');
  return `<div class="vc1936-court" role="group" aria-label="Pista táctica interactiva, ${origin?'origen':'destino'} de ataques"><div class="vc1936-court-label">RIVAL · LADO SUPERIOR</div><div class="vc1936-court-half rival">${top}</div><div class="vc1936-net"><span>RED</span></div><div class="vc1936-court-half own">${bottom}</div><div class="vc1936-court-label">NUESTRO CAMPO · LADO INFERIOR</div>${model.paths.length?`<svg class="vc1936-paths" viewBox="0 0 600 620" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="vc1936-head" markerWidth="5" markerHeight="5" refX="3" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4" fill="none" stroke="#165a97" stroke-width="1.5"/></marker></defs>${lines}</svg>`:''}</div>`;
 }
 function quickFilters(panel){
  const toolbar=panel.querySelector('#vc1935-toolbar');if(!toolbar)return;
  let quick=toolbar.querySelector('.vc1936-quick');if(quick)return;
  quick=panel.ownerDocument.createElement('div');quick.className='vc1936-quick';quick.setAttribute('aria-label','Filtros tácticos principales');
  for(const id of ['vc1930-rival','vc1930-scope','vc1930-phase','vc1930-rotation','vc1932-own-rotation','vc1932-reception']){
   const field=panel.querySelector('#'+id);const label=field?.closest('label');if(label)quick.append(label);
  }
  toolbar.querySelector('.vc1935-tabs')?.before(quick);
  toolbar.querySelector('.vc1935-toolbar-top strong').textContent='VOLLEY COACH · ANALYSIS PRO';
  const hint=toolbar.querySelector('.vc1935-toolbar-top span');if(hint)hint.textContent='Tablas · Pista · Evidencia en una sola vista';
 }
 function miniEvidence(panel,selected){
  const side=panel.querySelector('.vc1935-evidence');if(!side)return;
  side.querySelector('.vc1935-evidence-hint')?.remove();
  side.querySelector('.vc1935-evidence-mini')?.remove();
  side.querySelector('.vc1935-evidence-count')?.remove();
  side.querySelector('.vc1936-review')?.remove();
  const doc=panel.ownerDocument;
  const section=doc.createElement('div');section.className='vc1936-review';
  section.innerHTML='<div class="vc1936-review-title"><strong>Rallies filtrados</strong><span data-vc1936-rally-count></span></div><div class="vc1936-rally-list" role="listbox" aria-label="Rallies filtrados"></div><div class="vc1936-review-preview"><div class="vc1936-preview-screen"><span aria-hidden="true">▶</span><strong>Vídeo del rally</strong><small>Se abre en el reproductor vinculado de Video Studio</small></div><div class="vc1936-rally-meta" aria-live="polite"></div><button type="button" class="vc1936-play" disabled>Selecciona un rally</button></div>';
  const list=section.querySelector('.vc1936-rally-list'),preview=section.querySelector('.vc1936-review-preview'),count=section.querySelector('[data-vc1936-rally-count]');
  const entries=(Array.isArray(selected)?selected:[]).slice().reverse().slice(0,100);
  count.textContent=`${entries.length} de ${selected?.length||0}`;
  entries.forEach((r,i)=>{
   const b=doc.createElement('button');b.type='button';b.className='vc1936-rally-item';b.setAttribute('role','option');b.setAttribute('aria-selected','false');
   const text=doc.createElement('span');text.textContent=`S${r.set??'?'} · #${r.index??r.rally??'?'} · ${r.phase||'—'} · ${r.rotation?'R'+r.rotation:'Rot. —'}`;
   const result=doc.createElement('b');result.textContent=r.winner==='opponent'?'Punto rival':'Punto nuestro';
   b.append(text,result);
   b.addEventListener('click',()=>{
    list.querySelectorAll('[role=option]').forEach(x=>x.setAttribute('aria-selected','false'));b.setAttribute('aria-selected','true');
    const details=preview.querySelector('.vc1936-rally-meta');details.textContent=`${r.opponent||'Rival'} · ${r.date||''} · Set ${r.set||'—'} · Rally ${r.index??r.rally??'—'}`;
    const play=preview.querySelector('.vc1936-play');const eligible=r.id!=null&&r.rally!=null&&r.set!=null;
    play.disabled=!eligible;play.textContent=eligible?'Abrir vídeo de este rally':'Sin enlace a vídeo';
    if(eligible){play.dataset.vc1930Video=String(r.id);play.dataset.vc1930Set=String(r.set);play.dataset.vc1930Rally=String(r.rally);}
    else{delete play.dataset.vc1930Video;delete play.dataset.vc1930Set;delete play.dataset.vc1930Rally;}
   });list.append(b);
  });
  if(!entries.length){const p=doc.createElement('p');p.className='vc1936-empty';p.textContent='No hay rallies cerrados con los filtros actuales.';list.append(p);}
  side.querySelector('.vc1935-evidence-head')?.after(section);
 }
 function renderCenter(doc,model){
  const center=doc.createElement('div');center.className='vc1936-center';
  center.innerHTML=`<div class="vc1936-center-head"><div><strong>PISTA TÁCTICA</strong><span>${model.total} ataques registrados · ${model.origin.coded} con origen · ${model.destination.coded} con destino</span></div><div class="vc1936-switch" role="group" aria-label="Tipo de mapa"><button type="button" data-vc1936-mode="origin" class="is-selected">Origen</button><button type="button" data-vc1936-mode="destination">Destino</button></div></div><div class="vc1936-court-host"></div><div class="vc1936-court-summary"><div><strong>${model.total}</strong><span>Ataques</span></div><div><strong>${model.paired}</strong><span>Trayectorias con ambos extremos</span></div><div><strong>${model.origin.missing}</strong><span>Sin origen codificado</span></div></div><p class="vc1936-court-note">Porcentajes sobre ataques con la zona codificada. A/B/C/D: A abajo derecha, B arriba derecha, C arriba izquierda, D abajo izquierda. La flecha solo representa pares origen-destino registrados; no es una trayectoria medida del balón.</p>`;
  const host=center.querySelector('.vc1936-court-host');let mode='origin';
  const apply=()=>{host.innerHTML=courtView(model,mode);center.querySelectorAll('[data-vc1936-mode]').forEach(b=>b.classList.toggle('is-selected',b.dataset.vc1936Mode===mode));};
  center.querySelectorAll('[data-vc1936-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.vc1936Mode;apply();}));
  apply();return center;
 }
 function afterRender(panel,data){
  if(!panel?.querySelector?.('.vc1935-split'))return;
  panel.classList.add('vc1936-ready');quickFilters(panel);
  const split=panel.querySelector('.vc1935-split'),main=split.querySelector(':scope > .vc1935-main'),side=split.querySelector(':scope > .vc1935-evidence');
  if(!main||!side)return;
  const doc=panel.ownerDocument;const model=courtModel(data?.selected,panel.querySelector('#vc1933-team')?.value==='ours'?'ours':'opponent');
  const center=renderCenter(doc,model);
  const left=doc.createElement('div');left.className='vc1936-left';left.append(main);
  const label=doc.createElement('div');label.className='vc1936-left-head';label.innerHTML='<strong>ANÁLISIS ESTADÍSTICO</strong><span>Tablas y resultados · selección actual</span>';left.prepend(label);
  split.replaceChildren(left,center,side);split.classList.add('vc1936-three');
  miniEvidence(panel,data?.selected||[]);
  const active=panel._vc1935?.active||'overview';switchLayout(panel,active);
 }
 function switchLayout(panel,tab){
  if(!panel?.classList?.contains('vc1936-ready'))return;
  panel.dataset.vc1936Tab=tab;
  const center=panel.querySelector('.vc1936-center');if(center)center.hidden=tab==='evidence';
  const left=panel.querySelector('.vc1936-left');if(left)left.hidden=tab==='evidence';
  const side=panel.querySelector('.vc1935-evidence');if(side){side.classList.remove('vc1935-evidence-full');}
 }
 function showEvidence(panel){
  // Existing event handlers update the shared filters; stay in the tripanel workspace.
  if(panel?.classList?.contains('vc1936-ready')){
   const aside=panel.querySelector('.vc1935-evidence');aside?.scrollIntoView?.({block:'nearest',behavior:'instant'});
   aside?.classList.add('vc1936-attention');return true;
  }
  return false;
 }
 return {VERSION:'19.3.6',ZONES,parseZone,ratio,courtModel,courtView,afterRender,switchLayout,showEvidence};
});

/* VC20717_SOURCE_END:187-vc1936-analysis-three-pane.js */

/* VC20717_SOURCE_BEGIN:183-vc1930-tactical-rival-desk.js */
/* Volley Coach V19.3.0 · Mesa de preparación de rivales.
 * Lectura exclusivamente de scoutings cerrados del motor Analysis Intelligence.
 * No escribe en los partidos, en la nube ni en el reproductor.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_TACTICAL_RIVALS_1930=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.5';
 const arr=v=>Array.isArray(v)?v:[];
 const text=v=>String(v??'').trim();
 const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');
 const safe=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b>0?Math.round(a*1000/b)/10:null;
 const fmt=v=>v==null?'—':`${v.toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const int=v=>{const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=6?n:0};
 const finished=m=>m?.status==='finished'||m?.resultComplete===true||m?.manualFinalResult?.active===true;
 const date=m=>text(m?.date||m?.createdAt).slice(0,10);
 const unknownOpponent=name=>!name||['rival','sin rival','sin registrar','desconocido'].includes(norm(name));
 const phase=r=>r?.serving==='ours'?'K1':r?.serving==='opponent'?'K2':''; // fases del rival
 function source(matches,extract){
  const rows=[],failures=[];
  for(const match of arr(matches)){
   if(!match||match.id==null)continue;
   try{
    const data=extract(match)||{};
    const rallies=arr(data.rallies);
    for(const r of rallies){
     if(r?.winning!=='ours'&&r?.winning!=='opponent')continue;
     rows.push({match,id:text(match.id),date:date(match),opponent:text(match.opponent),
      set:r.set,rally:r.id,index:r.index,rotation:int(r.opponentRotation),ownRotation:int(r.rotation),
      winner:r.winning,serving:r.serving,phase:phase(r),actions:arr(r.actions),raw:r});
    }
   }catch(_){failures.push(text(match.id));}
  }
  return {rows,failures};
 }
 function rivals(matches){
  const map=new Map();
  for(const m of arr(matches)){
   if(m?.id==null||unknownOpponent(m.opponent))continue;
   const key=norm(m.opponent);
   if(!map.has(key))map.set(key,{key,name:text(m.opponent),matches:0});
   map.get(key).matches++;
  }
  return [...map.values()].sort((a,b)=>b.matches-a.matches||a.name.localeCompare(b.name,'es'));
 }
 function count(rows){return {n:rows.length,w:rows.filter(r=>r.winner==='opponent').length,pct:pct(rows.filter(r=>r.winner==='opponent').length,rows.length)};}
 function attacks(rows){
  return arr(rows).flatMap(r=>arr(r.actions).filter(a=>a?.team==='opponent'&&a?.skill==='A').map(a=>({r,action:a,ev:text(a.ev),player:text(a.player||a.a?.playerNameSnapshot||'Sin identificar'),combo:text(a.a?.attackCombo),direction:text(a.a?.attackDirection)})));
 }
 function attackSummary(items){
  const n=items.length,k=items.filter(a=>a.ev==='#').length,e=items.filter(a=>a.ev==='=').length,b=items.filter(a=>a.ev==='/').length;
  // EFF/Kill share Analysis Engine Pro's denominator: ONLY explicitly rated attacks.
  // An unrated attempt remains visible in n and in the coverage audit, not as a zero outcome.
  const rated=items.filter(a=>['#','+','!','-','/','='].includes(a.ev)).length;
  return {n,rated,k,e,b,eff:pct(k-e-b,rated),kill:pct(k,rated)};
 }
 function reception(rows){
  const list=[];
  for(const r of rows){const rec=r.actions.find(a=>a?.team==='opponent'&&a?.skill==='R');if(rec)list.push(rec)}
  const positive=list.filter(a=>a.ev==='#'||a.ev==='+').length;
  const rated=list.filter(a=>['#','+','!','-','/','='].includes(a.ev)).length;
  return {n:list.length,rated,positive,pct:pct(positive,rated),notCoded:rows.length-list.length};
 }
 function zone(v){
  const m=text(v).toUpperCase().match(/^Z?([1-9])(?:[A-D])?$/);
  return m?m[1]:'';
 }
 function rivalActs(r,skill){return arr(r?.actions).filter(x=>x?.team==='opponent'&&x?.skill===skill)}
 function rivalReception(r){return rivalActs(r,'R')[0]||null}
 function receptionCode(r){return text(rivalReception(r)?.ev)}
 function attackHasZone(r,kind,value){return rivalActs(r,'A').some(x=>zone(x?.a?.[kind])===value)}
 // All cells use explicit rotations. Unknown rotation never becomes R1.
 function rotationMatchups(rows){
  return [1,2,3,4,5,6].map(own=>[1,2,3,4,5,6].map(rival=>{
   const entries=arr(rows).filter(r=>r.ownRotation===own&&r.rotation===rival);
   const wins=entries.filter(r=>r.winner==='opponent').length;
   return {own,rival,n:entries.length,wins,pct:pct(wins,entries.length),entries};
  }));
 }
 function zoneDistribution(rows,field){
  const actions=attacks(rows),coded=actions.filter(x=>zone(x.action?.a?.[field]));
  return {total:actions.length,coded:coded.length,missing:actions.length-coded.length,
   values:[1,2,3,4,5,6,7,8,9].map(i=>{
    const list=coded.filter(x=>zone(x.action.a[field])===String(i));
    return {zone:i,n:list.length,pct:pct(list.length,coded.length),rallies:list.map(x=>x.r)};
   })};
 }
 // Setter-to-attack is linked only within the same uninterrupted team possession.
 function setterSequences(rows){
  const sequences=[];
  for(const r of arr(rows)){
   const acts=arr(r.actions);
   for(let i=0;i<acts.length;i++){
    const set=acts[i];if(set?.team!=='opponent'||set.skill!=='E')continue;
    let attack=null;
    for(let j=i+1;j<acts.length;j++){
     const next=acts[j];if(next?.team!=='opponent'||next.skill==='E')break;
     if(next.skill==='A'){attack=next;break}
    }
    let rec=null;
    for(let j=i-1;j>=0;j--){
     const prev=acts[j];if(prev?.team!=='opponent')break;
     if(prev.skill==='R'){rec=prev;break}
    }
    sequences.push({r,set,attack,rec,player:text(set.player)||'Sin identificar',
     target:zone(set.a?.setTarget)||zone(attack?.a?.startZone),
     setTargetCoded:!!zone(set.a?.setTarget),
     tempo:text(set.a?.setTempo||attack?.a?.attackTempo),
     call:text(set.a?.setterCall),recEval:text(rec?.ev)});
   }
  }
  return sequences;
 }
 function setterDistribution(rows){
  const seq=setterSequences(rows);
  return {total:seq.length,withAttack:seq.filter(x=>x.attack).length,withZone:seq.filter(x=>x.target).length,
   byPlayer:groups(seq,x=>x.player).map(g=>({name:g.name,n:g.n,
    attacks:g.entries.filter(x=>x.attack).length,
    zones:groups(g.entries.filter(x=>x.target),x=>'Z'+x.target).map(z=>({name:z.name,n:z.n,pct:pct(z.n,g.entries.filter(x=>x.target).length)})),
    tempos:groups(g.entries.filter(x=>x.tempo),x=>x.tempo),
    calls:groups(g.entries.filter(x=>x.call),x=>x.call),
    codedTarget:g.entries.filter(x=>x.setTargetCoded).length
   }))};
 }
 // Reception-to-attack pairs: no attribution across a change of possession.
 function receptionsToAttack(rows){
  const list=[];
  for(const r of arr(rows)){
   const acts=arr(r.actions);
   for(let i=0;i<acts.length;i++){
    const rec=acts[i];if(rec?.team!=='opponent'||rec.skill!=='R')continue;
    let attack=null;
    for(let j=i+1;j<acts.length;j++){
     const next=acts[j];if(next?.team!=='opponent')break;
     if(next.skill==='R')break;
     if(next.skill==='A'){attack=next;break}
    }
    if(attack)list.push({r,rec,attack,ev:text(rec.ev),zone:zone(attack.a?.startZone)});
   }
  }
  return list;
 }
 function receptionAttackMatrix(rows){
  const list=receptionsToAttack(rows);
  const codes=['#','+','!','-','/','='];
  return {total:list.length,conditions:codes.map(code=>{
   const subset=list.filter(x=>x.ev===code),stats=attackSummary(subset.map(x=>({ev:x.attack.ev})));
   const zones=[1,2,3,4,5,6].map(no=>({zone:no,n:subset.filter(x=>x.zone===String(no)).length}));
   return {code,n:subset.length,stats,zones,knownZone:subset.filter(x=>x.zone).length};
  })};
 }
 function groups(items,key){
  const map=new Map();
  for(const x of arr(items)){const name=text(key(x));if(!name)continue;if(!map.has(name))map.set(name,[]);map.get(name).push(x);}
  return [...map].map(([name,entries])=>({name,entries,n:entries.length})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'));
 }
 function report(matches,extracted,filters={}){
  const key=norm(filters.rival),includeLive=filters.scope==='all';
  const eligible=arr(matches).filter(m=>m?.id!=null&&(!key||norm(m.opponent)===key)&&(includeLive||finished(m)));
  const ids=new Set(eligible.map(m=>text(m.id)));
  const raw=arr(extracted?.rows).filter(r=>ids.has(text(r.id)));
  const missingServing=raw.filter(r=>!r.phase).length;
  const missingRotation=raw.filter(r=>!r.rotation).length;
  const selectedBase=raw.filter(r=>(!filters.phase||r.phase===filters.phase)
   &&(!int(filters.rotation)||r.rotation===int(filters.rotation))
   &&(!int(filters.ownRotation)||r.ownRotation===int(filters.ownRotation))
   &&(!filters.reception||receptionCode(r)===filters.reception)
   &&(!zone(filters.attackStart)||attackHasZone(r,'startZone',zone(filters.attackStart)))
   &&(!zone(filters.attackEnd)||attackHasZone(r,'endZone',zone(filters.attackEnd))));
  // V19.3.3: one cross-filtered rally set drives every legacy KPI, table and evidence.
  // The engine never alters the source scouting objects and does not infer missing fields.
  const engine=typeof window!=='undefined'?window.VC_ANALYSIS_ENGINE_1933:null;
  const selectedEngine=engine?.filterRows?engine.filterRows(selectedBase,filters):selectedBase;
  const setterEngine=typeof window!=='undefined'?window.VC_SETTER_ATTACK_1934:null;
  const selected=setterEngine?.filterRows?setterEngine.filterRows(selectedEngine,filters):selectedEngine;
  const known=selected.filter(r=>r.phase);const k1=count(known.filter(r=>r.phase==='K1'));const k2=count(known.filter(r=>r.phase==='K2'));
  const aa=attacks(selected),rec=reception(selected),byRotation=[1,2,3,4,5,6].map(no=>{
   const r=selected.filter(x=>x.rotation===no),withPhase=r.filter(x=>x.phase);
   return {no,n:r.length,k1:count(withPhase.filter(x=>x.phase==='K1')),k2:count(withPhase.filter(x=>x.phase==='K2')),attack:attackSummary(attacks(r)),evidence:r};
  });
  const byPlayer=groups(aa,x=>x.player).map(g=>({...g,...attackSummary(g.entries)}));
  const combos=groups(aa.filter(a=>a.combo),a=>a.combo);
  const directions=groups(aa.filter(a=>a.direction),a=>a.direction);
  const ordered=eligible.slice().sort((a,b)=>date(a).localeCompare(date(b))||text(a.id).localeCompare(text(b.id)));
  const last=ordered.slice(-3);const prev=ordered.slice(-6,-3);
  const sliceReport=ms=>{const set=new Set(ms.map(m=>text(m.id))),r=selected.filter(x=>set.has(text(x.id))),k=r.filter(x=>x.phase==='K1');return {matches:ms.length,n:k.length,w:k.filter(x=>x.winner==='opponent').length,pct:pct(k.filter(x=>x.winner==='opponent').length,k.length)};};
  const trend={recent:sliceReport(last),previous:sliceReport(prev)};
  const min=Math.min(100,Math.max(3,Number.isFinite(Number(filters.minSample))?Number(filters.minSample):8));
  const qualified=byRotation.filter(x=>x.k1.n>=min);
  const fragile=qualified.slice().sort((a,b)=>a.k1.pct-b.k1.pct||b.k1.n-a.k1.n)[0]||null;
  const strongest=qualified.slice().sort((a,b)=>b.k1.pct-a.k1.pct||b.k1.n-a.k1.n)[0]||null;
  return {key,eligible,all:raw,selected,k1,k2,attacks:attackSummary(aa),reception:rec,
   byRotation,byPlayer,combos,directions,missingServing,missingRotation,trend,fragile,strongest,
   matchups:rotationMatchups(selected),startingZones:zoneDistribution(selected,'startZone'),endingZones:zoneDistribution(selected,'endZone'),
   setter: setterDistribution(selected),recAttack:receptionAttackMatrix(selected),
   engine:engine?.analyze?engine.analyze(selected,filters):null,
   setterAttack:setterEngine?.analyze?setterEngine.analyze(selected,filters):null,
   sample:min,issues:arr(extracted?.failures).filter(id=>ids.has(text(id))),
   videoPossible:selected.filter(x=>x.rally!=null).length};
 }
 function csvSafe(v){let s=text(v);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function exportCSV(rows){
  const heading=['Partido ID','Fecha','Rival','Set','Rally ID','Rally número','Rotación rival','Rotación propia','Fase rival','Ganador','Recepción rival','Zonas origen ataque rival','Zonas destino ataque rival','Colocadores rivales'];
  return '\ufeff'+[heading,...arr(rows).map(r=>[r.id,r.date,r.opponent,r.set,r.rally??'',r.index,r.rotation||'',r.ownRotation||'',r.phase||'',r.winner,receptionCode(r),rivalActs(r,'A').map(x=>zone(x.a?.startZone)).filter(Boolean).join(','),rivalActs(r,'A').map(x=>zone(x.a?.endZone)).filter(Boolean).join(','),rivalActs(r,'E').map(x=>text(x.player)).filter(Boolean).join(',')])].map(row=>row.map(csvSafe).join(';')).join('\r\n');
 }
 const sample=(n,min)=>n===0?'Sin datos':n<min?`Muestra limitada (${n} < ${min})`:`n=${n}`;
 const buttonEvidence=(items)=>`<button type="button" data-vc1930-focus="${safe(items)}">Ver rallies</button>`;
 function markup(){return `<section class="vc1930-desk" id="vc1930-desk" aria-label="Preparación táctica del rival" hidden>
  <header class="vc1930-head"><div><small>V19.3 · TACTICAL INTELLIGENCE</small><h2>Preparación de rivales</h2><p>Análisis cruzado de rotaciones, colocación, recepción y zonas. Solo datos codificados, con evidencia.</p></div><button type="button" data-vc1930-close>Volver al análisis</button></header>
  <div class="vc1930-filters"><label>Rival<select id="vc1930-rival"><option value="">Todos los rivales</option></select></label><label>Partidos<select id="vc1930-scope"><option value="finished">Solo finalizados</option><option value="all">Incluir en curso</option></select></label><label>Fase del rival<select id="vc1930-phase"><option value="">K1 y K2</option><option value="K1">K1 · recibe</option><option value="K2">K2 · saca</option></select></label><label>Rotación rival<select id="vc1930-rotation"><option value="">R1–R6</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Rotación propia<select id="vc1932-own-rotation"><option value="">R1–R6 propias</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n} propia</option>`).join('')}</select></label><label>Recepción rival<select id="vc1932-reception"><option value="">Todas las calidades</option><option value="#">Perfecta #</option><option value="+">Positiva +</option><option value="!">! codificada</option><option value="-">- codificada</option><option value="/">/ codificada</option><option value="=">= codificada</option></select></label><label>Origen del ataque rival<select id="vc1932-attack-start"><option value="">Todas las zonas</option>${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">Zona ${n}</option>`).join('')}</select></label><label>Destino del ataque rival<select id="vc1932-attack-end"><option value="">Todos los destinos</option>${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">Zona ${n}</option>`).join('')}</select></label><label>Muestra mínima<select id="vc1930-min"><option value="8">8 rallies</option><option value="5">5 rallies</option><option value="12">12 rallies</option></select></label><details class="vc1933-filter-box" open><summary>Analysis Engine Pro · filtros cruzados por jugador, set y acción</summary><div class="vc1933-filter-grid"><label>Set<select id="vc1933-set"><option value="">Todos los sets</option></select></label><label>Equipo analizado<select id="vc1933-team"><option value="opponent">Rival</option><option value="ours">Nuestro equipo</option></select></label><label>Fundamento<select id="vc1933-skill"><option value="">Todos los fundamentos</option><option value="S">Saque</option><option value="R">Recepción</option><option value="E">Colocación</option><option value="A">Ataque</option><option value="B">Bloqueo</option><option value="D">Defensa</option><option value="F">Freeball</option><option value="C">Cobertura</option></select></label><label>Jugador<select id="vc1933-player"><option value="">Todos los jugadores</option></select></label><label>Valoración de la acción<select id="vc1933-eval"><option value="">Todas</option><option value="#"># · Perfecta</option><option value="+">+ · Positiva</option><option value="!">!</option><option value="-">-</option><option value="/">/</option><option value="=">=</option></select></label><label>Ganador del rally<select id="vc1933-result"><option value="">Ambos</option><option value="opponent">Rival</option><option value="ours">Nuestro equipo</option></select></label><label>Acción con vídeo marcado<select id="vc1933-video"><option value="">Cualquiera</option><option value="yes">Sí</option><option value="no">No</option></select></label></div><p class="vc1933-filter-hint">Se aplican simultáneamente a todas las tablas, matriz, evidencia y CSV. Al seleccionar un fundamento y una valoración, deben pertenecer a la misma acción.</p></details><details class="vc1933-filter-box vc1934-filter-box"><summary>Setter & Attack Intelligence · distribución y decisiones del colocador</summary><div class="vc1933-filter-grid"><label>Colocador<select id="vc1934-setter"><option value="">Todos</option></select></label><label>Destino explícito<select id="vc1934-target"><option value="">Todas las zonas</option></select></label><label>Tempo E<select id="vc1934-tempo"><option value="">Todos</option></select></label><label>Atacante asociado<select id="vc1934-attacker"><option value="">Todos</option></select></label><label>Recepción previa<select id="vc1934-sequence-reception"><option value="">Todas</option>${['#','+','!','-','/','='].map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join('')}</select></label><label>Combinación<select id="vc1934-combo"><option value="">Todas</option></select></label></div><p class="vc1933-filter-hint">Los filtros de colocador, destino, tempo y atacante deben coincidir en la misma secuencia E → A, no en acciones independientes del rally. Solo se muestran destinos y tempos realmente codificados.</p></details><div class="vc1930-actions"><button type="button" data-vc1930-refresh>Actualizar resultados</button><button type="button" data-vc1932-reset>Limpiar filtros</button><button type="button" data-vc1930-csv>Exportar evidencia CSV</button></div></div>
  <div class="vc1930-notice" id="vc1930-notice" role="status"></div>
  <div id="vc1930-results"></div>
 </section>`;}
 function renderAdvanced(d){
  const matchups=arr(d.matchups),starts=d.startingZones||{total:0,coded:0,values:[]},ends=d.endingZones||{total:0,coded:0,values:[]};
  const setter=d.setter||{total:0,withAttack:0,withZone:0,byPlayer:[]};
  const cond=d.recAttack||{total:0,conditions:[]};
  const spread=matchups.flat().filter(x=>x.n>0).length;
  const cells=(r)=>arr(r).map(x=>`<td class="vc1932-matrix-cell"><button type="button" data-vc1932-own="${x.own}" data-vc1932-rival="${x.rival}" ${x.n?'':'disabled'} title="R${x.own} propia · R${x.rival} rival: ${x.wins}/${x.n} rallies ganados por el rival"><strong>${x.n?fmt(x.pct):'—'}</strong><small>n=${x.n}</small></button></td>`).join('');
  const table=(heads,body)=>`<div class="vc1930-scroll"><table><thead><tr>${heads.map(x=>`<th>${safe(x)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  const matrix=table(['Propia / Rival','R1 rival','R2 rival','R3 rival','R4 rival','R5 rival','R6 rival'],matchups.map((row,i)=>`<tr><th>R${i+1} propia</th>${cells(row)}</tr>`).join('')||'<tr><td colspan="7">Sin información de rotaciones enfrentadas.</td></tr>');
  const setterRows=arr(setter.byPlayer).slice(0,15).map(g=>`<tr><td>${safe(g.name)}</td><td>${g.n}</td><td>${g.attacks}</td><td>${g.zones.length?g.zones.slice(0,4).map(z=>`${safe(z.name)}: ${z.n} (${fmt(z.pct)})`).join(' · '):'Sin zona'}</td><td>${safe(g.tempos[0]?.name||'—')}</td><td>${safe(g.calls[0]?.name||'—')}</td></tr>`).join('');
  const receptions=table(['Recepción','Ataques posteriores','Kill %','EFF %','Origen de ataque codificado','Consultar'],arr(cond.conditions).map(c=>`<tr><td><b>${safe(c.code)}</b></td><td>${c.n}</td><td>${fmt(c.stats.kill)}</td><td>${fmt(c.stats.eff)}</td><td>${c.knownZone}/${c.n}</td><td><button type="button" data-vc1932-receive="${safe(c.code)}" ${c.n?'':'disabled'}>Filtrar</button></td></tr>`).join(''));
  function court(data,name,kind){
   const byZone=no=>arr(data.values).find(x=>x.zone===no)||{zone:no,n:0,pct:null};
   return `<article class="vc1930-card vc1932-court-card"><h4>${name}</h4><p>${data.coded}/${data.total} ataques con esta zona codificada. Porcentaje sobre los ${data.coded} ataques con zona conocida.</p><div class="vc1932-court" role="group" aria-label="${safe(name)}">${[4,3,2,5,6,1].map(no=>{const x=byZone(no);return `<button type="button" data-vc1932-zone="${no}" data-vc1932-zone-kind="${kind}" ${x.n?'':'disabled'} aria-label="Zona ${no}: ${x.n} ataques"><b>Z${no}</b><strong>${x.n}</strong><small>${fmt(x.pct)}</small></button>`}).join('')}</div><small class="vc1932-extra">${[7,8,9].map(no=>`Z${no}: ${byZone(no).n}`).join(' · ')} · Sin zona: ${data.missing}</small></article>`;
  }
  return `<div class="vc1930-section-heading"><h3>Laboratorio táctico · distribución y filtros cruzados</h3><span>Referencia funcional: búsquedas avanzadas por rotación y calidad de recepción</span></div>
  <article class="vc1930-card"><h3>Matriz R1–R6 · nuestra rotación frente a la rival</h3><p>Porcentaje de rallies ganados por el rival para cada enfrentamiento de rotaciones (no es K1 ni K2). Cada celda muestra su propia muestra. Pulsa una celda para filtrar y abrir su evidencia. Cruces con datos: ${spread}/36.</p>${matrix}</article>
  <div class="vc1930-grid">${court(starts,'Origen de los ataques rivales','start')}${court(ends,'Destino de los ataques rivales','end')}</div>
  <article class="vc1930-card"><h3>Distribución del colocador rival</h3><p>${setter.total} colocaciones · ${setter.withAttack} con ataque posterior en la misma posesión · ${setter.withZone} con zona explícita. Las zonas se extraen del destino codificado de la colocación o del origen del ataque posterior, nunca de una posición supuesta.</p>${table(['Colocador','Colocaciones','Ataques enlazados','Zonas del ataque','Tempo principal','Llamada principal'],setterRows||'<tr><td colspan="6">Faltan colocaciones codificadas del rival. Para obtener distribución, registra acciones E y A del contrario.</td></tr>')}</article>
  <article class="vc1930-card"><h3>Ataque rival según calidad de recepción</h3><p>Solo se vincula una recepción con el ataque siguiente de la misma posesión, sin acciones intermedias de nuestro equipo. ${cond.total} secuencias verificables. La escala #, +, !, -, /, = se muestra sin reinterpretar sus valores.</p>${receptions}</article>`;
 }
 function render(d){
  const engine=typeof window!=='undefined'?window.VC_ANALYSIS_ENGINE_1933:null;
  const advancedHtml=d.engine&&engine?.render?engine.render(d.engine):'';
  const setterApi=typeof window!=='undefined'?window.VC_SETTER_ATTACK_1934:null;
  const setterHtml=d.setterAttack&&setterApi?.render?setterApi.render(d.setterAttack,d.sample):'';
  const perspectiveNote=d.engine?.team==='ours'?'<div class="vc1930-data-warning" role="note"><strong>Dos perspectivas:</strong> el Analysis Engine Pro muestra acciones de nuestro equipo. Los indicadores K1/K2, las rotaciones y las tablas históricas de esta mesa siguen describiendo al rival en los mismos rallies seleccionados; no se convierten en estadísticas propias.</div>':'';
  if(!d.eligible.length)return '<p class="vc1930-empty">No hay partidos de ese rival en el periodo seleccionado. Revisa el filtro de Temporada o incluye partidos en curso.</p>';
  const v=(s,rate)=>`<strong${rate==null?' class="vc1930-na"':''}>${rate==null?'Sin datos':fmt(rate)}</strong><small>${s}</small>`;
  const cell=(x)=>`${fmt(x.pct)}<small>${x.w}/${x.n} · ${sample(x.n,d.sample)}</small>`;
  const table=(headers,rows)=>`<div class="vc1930-scroll"><table><thead><tr>${headers.map(x=>`<th>${safe(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const rot=table(['Rotación rival','Rallies','K1 · Side-out','K2 · Break','Ataque EFF','Evidencia'],d.byRotation.map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.n}</td><td>${cell(r.k1)}</td><td>${cell(r.k2)}</td><td>${fmt(r.attack.eff)}<small>n=${r.attack.n}</small></td><td>${buttonEvidence('R'+r.no)}</td></tr>`).join(''));
  const players=d.byPlayer.slice(0,15).map(p=>`<tr><td>${safe(p.name)}</td><td>${p.n}</td><td>${p.k} / ${p.e} / ${p.b}</td><td>${fmt(p.eff)}</td><td>${sample(p.n,d.sample)}</td></tr>`).join('');
  const attacksTable=table(['Atacante rival','Intentos','Puntos / errores / bloqueados','Eficiencia','Muestra'],players||'<tr><td colspan="5">No hay ataques del equipo rival codificados en estos scoutings.</td></tr>');
  const patterns=(groups,title,total)=>`<article class="vc1930-card"><h4>${title}</h4><p>${groups.reduce((s,x)=>s+x.n,0)}/${total} ataques con esta información</p>${groups.length?groups.slice(0,8).map(g=>`<div class="vc1930-pattern"><span>${safe(g.name)}</span><b>${g.n}</b></div>`).join(''):'<p>Sin datos codificados.</p>'}</article>`;
  const note=d.strongest?`R${d.strongest.no} presenta el side-out rival más alto entre las rotaciones con al menos ${d.sample} K1: ${d.strongest.k1.w}/${d.strongest.k1.n} (${fmt(d.strongest.k1.pct)}). Es una tendencia descriptiva, no una predicción.`:'No hay suficientes rallies de K1 por rotación para destacar tendencias con el umbral seleccionado.';
  const trend=d.trend.previous.matches?`Últimos ${d.trend.recent.matches} partidos: K1 rival ${fmt(d.trend.recent.pct)} (${d.trend.recent.w}/${d.trend.recent.n}); anteriores ${d.trend.previous.matches}: ${fmt(d.trend.previous.pct)} (${d.trend.previous.w}/${d.trend.previous.n}). Las muestras no se ajustan por rival ni alineación.`:'Tendencia histórica: hacen falta al menos cuatro partidos del rival en el periodo seleccionado para comparar bloques.';
  const evidence=table(['Partido','Set / rally','Rotación','Fase','Ganador','Abrir'],d.selected.slice().sort((a,b)=>b.date.localeCompare(a.date)||Number(b.set)-Number(a.set)||Number(b.index)-Number(a.index)).slice(0,100).map((r)=>`<tr><td>${safe(r.date)} · ${safe(r.opponent)}</td><td>S${safe(r.set)} · ${safe(r.index)}</td><td>${r.rotation?'R'+r.rotation:'Sin dato'}</td><td>${safe(r.phase||'Sin dato')}</td><td>${r.winner==='opponent'?'Rival':'Nuestro'}</td><td><button type="button" data-vc1930-match="${safe(r.id)}">Partido</button>${r.rally!=null?`<button type="button" data-vc1930-video="${safe(r.id)}" data-vc1930-set="${safe(r.set)}" data-vc1930-rally="${safe(r.rally)}">Vídeo*</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">Sin rallies cerrados.</td></tr>');
  return `<div class="vc1930-section-heading"><h3>Indicadores del rival</h3><span>Calculados sobre las acciones realmente registradas</span></div><div class="vc1930-kpis"><article><span>Partidos</span><b>${d.eligible.length}</b><small>${d.selected.length} rallies cerrados filtrados</small></article><article><span>K1 rival · recibe</span>${v(`${d.k1.w}/${d.k1.n} · ${sample(d.k1.n,d.sample)}`,d.k1.pct)}</article><article><span>K2 rival · saca</span>${v(`${d.k2.w}/${d.k2.n} · ${sample(d.k2.n,d.sample)}`,d.k2.pct)}</article><article><span>Ataque rival · EFF</span>${v(`${d.attacks.rated}/${d.attacks.n} valorados · (${d.attacks.k}−${d.attacks.e}−${d.attacks.b})/${d.attacks.rated||'—'}`,d.attacks.eff)}</article><article><span>Recepción rival #/+</span>${v(`${d.reception.positive}/${d.reception.rated} valoradas · ${d.reception.n} registradas`,d.reception.pct)}</article></div>
  ${perspectiveNote}${typeof window!=='undefined'&&window.VC_RIVAL_INTELLIGENCE_2042?.render?window.VC_RIVAL_INTELLIGENCE_2042.render(d):''}${advancedHtml}${setterHtml}${d.attacks.n===0&&d.reception.n===0?'<div class="vc1930-data-warning" role="note"><strong>Faltan acciones del rival:</strong> los rallies permiten estudiar el resultado de K1/K2, pero no identificar atacantes, combinaciones ni calidad de recepción. Para completar ese análisis, codifica también las acciones del equipo contrario durante el scouting.</div>':''}<div class="vc1930-grid"><article class="vc1930-card"><h3>Lectura táctica verificable</h3><p>${safe(note)}</p><p>${safe(trend)}</p></article><article class="vc1930-card"><h3>Calidad de datos</h3><p>${d.missingServing} rallies sin servidor conocido; ${d.missingRotation} sin rotación rival; ${d.reception.notCoded} sin recepción rival en el filtro actual.</p><p>No se interpretan los campos vacíos como errores. ${d.issues.length?'No se han podido procesar '+d.issues.length+' scoutings.':''}</p></article></div>
  <article class="vc1930-card"><h3>K1/K2 por rotación del rival</h3><p>Ganados por el rival / oportunidades con servidor conocido. No se infiere rotación si no está codificada.</p>${rot}</article>
  ${renderAdvanced(d)}
  <article class="vc1930-card"><h3>Principales atacantes del rival</h3><p>Eficiencia = (ataques # − errores = − bloqueados /) / ataques con valoración reconocida. Los ataques sin valorar se muestran en la auditoría, pero no cuentan como resultado negativo.</p>${attacksTable}</article>
  <div class="vc1930-grid">${patterns(d.combos,'Combinaciones de ataque',d.attacks.n)}${patterns(d.directions,'Direcciones de ataque',d.attacks.n)}</div>
  <article class="vc1930-card" id="vc1930-evidence"><h3>Evidencia · rallies originales</h3><p>Se muestran hasta 100 de ${d.selected.length} rallies. El CSV incluye todos. *El vídeo solo se abrirá si existe una grabación vinculada y disponible.</p>${evidence}</article>`;
 }
 function mount(root){
  const doc=root.document;if(!doc)return;
  const start=()=>{
   const view=doc.getElementById('scout-analysis');if(!view||doc.getElementById('vc1930-desk'))return;
   const workspace=doc.getElementById('vc1730-workspace');
   if(!workspace)return;
   workspace.insertAdjacentHTML('afterend',markup());
   const panel=doc.getElementById('vc1930-desk');const native=view.querySelector('.scout-analysis-shell');
   const actions=workspace.querySelector('.vc1730-head-actions');
   if(!actions)return;
   const launch=doc.createElement('button');launch.type='button';launch.id='vc1930-open';launch.textContent='Preparación de rivales';actions.prepend(launch);
   const $=id=>doc.getElementById(id);
   let current=null,filtered=null,opened=false;
   const matches=()=>{try{return arr(root.VC_V151_SEASON?.matches?.())}catch(_){return[]}};
   function refresh(){
    const ms=matches(),old=$('vc1930-rival').value;
    const options=rivals(ms);
    $('vc1930-rival').innerHTML='<option value="">Todos los rivales</option>'+options.map(x=>`<option value="${safe(x.key)}">${safe(x.name)} (${x.matches})</option>`).join('');
    $('vc1930-rival').value=options.some(x=>x.key===old)?old:'';
    const extract=root.VC_ANALYSIS_INTELLIGENCE_1614?.extract;
    if(typeof extract!=='function'){$('vc1930-results').innerHTML='<p class="vc1930-empty">No está disponible el motor de análisis. Comprueba que se han cargado los scripts.</p>';return;}
    current=source(ms,m=>extract(m,root.VC_SCOUT_REPORT_BRIDGE));
    const engine=root.VC_ANALYSIS_ENGINE_1933;
    if(engine?.facets){
     const rival=$('vc1930-rival').value,live=$('vc1930-scope').value==='all',team=$('vc1933-team').value;
     const eligibleRows=current.rows.filter(r=>(!rival||norm(r.opponent)===rival)&&(live||finished(r.match)));
     const facet=engine.facets(eligibleRows,team);
     function fill(id,items,label){const el=$(id),old=el.value;el.innerHTML=`<option value="">${label}</option>`+items.map(v=>`<option value="${safe(v)}">${safe(v)}</option>`).join('');el.value=items.includes(old)?old:'';}
     fill('vc1933-set',facet.sets,'Todos los sets');
     fill('vc1933-player',facet.players,'Todos los jugadores');
     const setterApi=root.VC_SETTER_ATTACK_1934;
     if(setterApi?.facets){const f=setterApi.facets(eligibleRows,team);
      fill('vc1934-setter',f.setters,'Todos los colocadores');
      fill('vc1934-target',f.targets,'Todos los destinos');
      fill('vc1934-tempo',f.tempos,'Todos los tempos');
      fill('vc1934-attacker',f.attackers,'Todos los atacantes');
      fill('vc1934-combo',f.combos,'Todas las combinaciones');}

    }
    filtered=report(ms,current,{rival:$('vc1930-rival').value,scope:$('vc1930-scope').value,phase:$('vc1930-phase').value,rotation:$('vc1930-rotation').value,ownRotation:$('vc1932-own-rotation').value,reception:$('vc1932-reception').value,attackStart:$('vc1932-attack-start').value,attackEnd:$('vc1932-attack-end').value,minSample:$('vc1930-min').value,
     set:$('vc1933-set').value,team:$('vc1933-team').value,skill:$('vc1933-skill').value,
     player:$('vc1933-player').value,evaluation:$('vc1933-eval').value,result:$('vc1933-result').value,video:$('vc1933-video').value,
     setter:$('vc1934-setter').value,target:$('vc1934-target').value,tempo:$('vc1934-tempo').value,
     attacker:$('vc1934-attacker').value,sequenceReception:$('vc1934-sequence-reception').value,combo:$('vc1934-combo').value});
    $('vc1930-notice').textContent=engine?.analyze?
     `Periodo: el seleccionado en Temporada · ${ms.length} scoutings accesibles · ${filtered.eligible.length} partidos seleccionados. Solo rallies con ganador conocido.`:
     'No se ha cargado el motor Analysis Engine Pro (184-vc1933-analysis-engine.js). Los filtros avanzados no estarán activos hasta actualizar ese archivo. El análisis clásico sigue disponible.';
    $('vc1930-results').innerHTML=render(filtered);
    root.VC_ANALYSIS_WORKSPACE_1935?.afterRender?.(panel,filtered);
    root.VC_ANALYSIS_WORKSPACE_1936?.afterRender?.(panel,filtered);
   }
   function open(){opened=true;panel.hidden=false;if(native)native.hidden=true;view.classList.add('vc1930-active');refresh();panel.scrollIntoView?.({block:'start',behavior:'instant'});}
   function close(){opened=false;panel.hidden=true;if(native)native.hidden=false;view.classList.remove('vc1930-active');}
   launch.addEventListener('click',()=>opened?close():open());
   panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-vc1930-close')){close();return}
    if(b.hasAttribute('data-vc1930-refresh')){refresh();return}
    if(b.hasAttribute('data-vc1932-reset')){
     ['vc1930-rival','vc1930-phase','vc1930-rotation','vc1932-own-rotation','vc1932-reception','vc1932-attack-start','vc1932-attack-end','vc1933-set','vc1933-skill','vc1933-player','vc1933-eval','vc1933-result','vc1933-video','vc1934-setter','vc1934-target','vc1934-tempo','vc1934-attacker','vc1934-sequence-reception','vc1934-combo'].forEach(id=>$(id).value='');$('vc1933-team').value='opponent';$('vc1930-scope').value='finished';$('vc1930-min').value='8';refresh();return;
    }
    if(b.hasAttribute('data-vc1932-own')){
     $('vc1932-own-rotation').value=b.dataset.vc1932Own;
     $('vc1930-rotation').value=b.dataset.vc1932Rival;
     refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1932-zone')){
     $(b.dataset.vc1932ZoneKind==='end'?'vc1932-attack-end':'vc1932-attack-start').value=b.dataset.vc1932Zone;
     refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1932-receive')){
     $('vc1932-reception').value=b.dataset.vc1932Receive;refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1934-filter')){
     const map={setter:'vc1934-setter',target:'vc1934-target',tempo:'vc1934-tempo',attacker:'vc1934-attacker',combo:'vc1934-combo',sequenceReception:'vc1934-sequence-reception'};
     const id=map[b.dataset.vc1934Filter],value=b.dataset.vc1934Value;
     if(id&&$(id)&&[...$(id).options].some(o=>o.value===value)){$(id).value=value;refresh();$('vc1934-evidence')?.scrollIntoView?.({block:'start'});}
     return;
    }
    if(b.hasAttribute('data-vc1934-csv')){
     const api=root.VC_SETTER_ATTACK_1934;if(!api?.exportCSV||!filtered?.setterAttack)return;
     const csv=api.exportCSV(filtered.setterAttack);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
     const a=doc.createElement('a');a.href=url;a.download='volley_coach_v1934_colocaciones_ataques.csv';doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),1200);return;
    }
    if(b.hasAttribute('data-vc1933-drill-skill')){
     $('vc1933-skill').value=b.dataset.vc1933DrillSkill;refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1933-drill-player')){
     const player=b.dataset.vc1933DrillPlayer;
     if([...$('vc1933-player').options].some(x=>x.value===player))$('vc1933-player').value=player;
     refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1930-csv')){
     const csv=exportCSV(filtered?.selected||[]);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=doc.createElement('a');a.href=url;a.download='volley_coach_v1930_evidencia_rival.csv';doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),1200);return;
    }
    if(b.hasAttribute('data-vc1930-focus')){
     const code=b.dataset.vc1930Focus;if(code?.startsWith('R')){$('vc1930-rotation').value=code.slice(1);refresh();if(!root.VC_ANALYSIS_WORKSPACE_1936?.showEvidence?.(panel)){root.VC_ANALYSIS_WORKSPACE_1935?.activate?.(panel,'evidence');$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}}return;
    }
    if(b.hasAttribute('data-vc1930-match')){
     const id=b.dataset.vc1930Match;if(Number.isSafeInteger(Number(id))&&typeof root.v151OpenMatch==='function'){close();root.v151OpenMatch(Number(id));}return;
    }
    if(b.hasAttribute('data-vc1930-video')){
     const id=b.dataset.vc1930Video;const rally=b.dataset.vc1930Rally,set=b.dataset.vc1930Set;
     const entry=filtered?.selected.find(r=>text(r.id)===id&&text(r.set)===set&&text(r.rally)===rally);
     if(entry&&typeof root.VC_V159_STATS_VIDEO?.openExact==='function')root.VC_V159_STATS_VIDEO.openExact(entry.match.id,entry.set,entry.rally);
     else root.alert?.('Vídeo no disponible: falta un vínculo válido con esa jugada.');
    }
   });
   panel.querySelectorAll('select').forEach(el=>el.addEventListener('change',refresh));
   workspace.addEventListener('click',e=>{if(opened&&e.target.closest('button')!==launch)close()},true);
   doc.addEventListener('vc:matchstatechange',()=>{if(opened)refresh()});
   root.VC_TACTICAL_RIVALS_1930.open=open;
   root.VC_TACTICAL_RIVALS_1930.close=close;
   root.VC_TACTICAL_RIVALS_1930.refresh=refresh;
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>root.setTimeout(start,0),{once:true});else root.setTimeout(start,0);
 }
 return {VERSION,source,rivals,count,attacks,attackSummary,reception,report,exportCSV,render,markup,mount,
  zone,rotationMatchups,zoneDistribution,setterSequences,setterDistribution,receptionsToAttack,receptionAttackMatrix,renderAdvanced};
});

/* VC20717_SOURCE_END:183-vc1930-tactical-rival-desk.js */

/* VC20717_SOURCE_BEGIN:189-vc1938-professional-data-engine.js */
/* Volley Coach V19.3.8 · Professional Data Engine
 * Canonical, read-only projection of the existing scouting schema.
 * A projection is deliberately NOT a migration or second source of truth.
 * All provenance points back to the original match/set/rally/action indexes.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_DATA_ENGINE_1938=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='19.3.8',SKILLS=new Set(['S','R','E','A','B','D','F','C']);
 const EVALS=new Set(['#','+','!','-','/','=']);
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const team=x=>x==='ours'||x==='opponent'?x:null;
 const zone=x=>{const match=val(x).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);return match?{zone:Number(match[1]),quadrant:match[2]||null,code:'Z'+match[1]+(match[2]||'')}:null};
 const pct=(n,d)=>d?Math.round(1000*n/d)/10:null;
 const present=x=>x!==null&&x!==undefined&&val(x)!=='';
 const idPart=x=>encodeURIComponent(val(x));
 const getPlayer=a=>val(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||a?.playerId||a?.playerNumber);
 function normalize(match){
  const issues=[],rallies=[],contacts=[],possessions=[],chains=[];
  const matchId=val(match?.id),setKeys=new Set();
  for(const [si,set] of arr(match?.sets).entries()){
   const setNumber=Number(set?.number);
   const setId=Number.isInteger(setNumber)&&setNumber>0?setNumber:si+1;
   if(setKeys.has(setId))issues.push({type:'duplicate-set',set:setId,message:'Número de set duplicado'});
   setKeys.add(setId);
   const rallyIds=new Set();
   for(const [ri,raw] of arr(set?.rallies).entries()){
    if(!raw)continue;
    const nativeRallyId=present(raw.id)?val(raw.id):null;
    if(nativeRallyId&&rallyIds.has(nativeRallyId))issues.push({type:'duplicate-rally',set:setId,index:ri+1,message:'Identificador de rally repetido'});
    if(nativeRallyId)rallyIds.add(nativeRallyId);
    const key=[idPart(matchId),setId,nativeRallyId?'id:'+idPart(nativeRallyId):'pos:'+ri].join('|');
    const serving=team(raw.servingBefore),winner=team(raw.winner);
    const ownRotation=Number(raw.rotationBefore),rivalRotation=Number(raw.opponentRotationBefore);
    const rally={key,matchId,set:setId,index:ri+1,nativeId:nativeRallyId,
     serving,winner,closed:!!winner,ownRotation:Number.isInteger(ownRotation)&&ownRotation>=1&&ownRotation<=6?ownRotation:null,
     rivalRotation:Number.isInteger(rivalRotation)&&rivalRotation>=1&&rivalRotation<=6?rivalRotation:null,
     contacts:[],possessions:[],scoreBefore:raw.scoreBefore||null,scoreAfter:raw.scoreAfter||null,
     provenance:{setIndex:si,rallyIndex:ri,stableId:!!nativeRallyId}};
    if(!winner)issues.push({type:'unknown-winner',key,message:'Ganador de rally sin registrar'});
    if(!serving)issues.push({type:'unknown-serve',key,message:'Equipo al saque no identificado'});
    const actionIds=new Set();
    for(const [ai,a] of arr(raw.actions).entries()){
     if(!a)continue;
     const t=team(a.team),skill=val(a.skill).toUpperCase(),evaluation=val(a.evaluation);
     const actionId=present(a.id)?val(a.id):null;
     if(actionId&&actionIds.has(actionId))issues.push({type:'duplicate-action',key,index:ai,message:'Acción duplicada dentro del rally'});
     if(actionId)actionIds.add(actionId);
     const fields={startZone:zone(a.startZone),endZone:zone(a.endZone),contactZone:zone(a.contactZone),setTarget:zone(a.setTarget),
      tempo:val(a.setTempo),attackTempo:val(a.attackTempo),combo:val(a.attackCombo),setterCall:val(a.setterCall),
      direction:val(a.attackDirection),blockers:present(a.blockers)?val(a.blockers):'',serveType:val(a.serveType),
      subtype:val(a.skillSubtype),receivedServeType:val(a.receivedServeType),
      dvSetType:val(a.dvSetType),attackCode:val(a.attackCode),endCone:val(a.endCone),
      specialCode:val(a.specialCode),blockTargetNumber:val(a.blockTargetNumber),
      startCoordinate:present(a.startCoordinate)?a.startCoordinate:null,
      endCoordinate:present(a.endCoordinate)?a.endCoordinate:null,
      contactCoordinate:present(a.contactCoordinate)?a.contactCoordinate:null};
     const videoFields=['videoTime','videoTimestamp','liveVideoTime','videoAction'];
     const video=videoFields.some(field=>present(a[field])&&Number.isFinite(Number(a[field]))&&Number(a[field])>=0);
     const contact={key:key+'|'+(actionId?'id:'+idPart(actionId):'pos:'+ai),rallyKey:key,matchId,set:setId,rallyIndex:ri+1,
      actionIndex:ai,nativeId:actionId,team:t,code:val(a.code),skill:SKILLS.has(skill)?skill:null,skillRaw:skill,evaluation:EVALS.has(evaluation)?evaluation:null,
      evaluationRaw:evaluation,player:getPlayer(a)||null,fields,video,scoutMs:Number.isFinite(Number(a.scoutMs))&&present(a.scoutMs)?Number(a.scoutMs):null,
      source:{matchId,setIndex:si,rallyIndex:ri,actionIndex:ai,stableId:!!actionId}};
     if(!t)issues.push({type:'unknown-team',key:contact.key,message:'Acción sin equipo identificado'});
     if(!contact.skill)issues.push({type:'unknown-skill',key:contact.key,message:'Fundamento desconocido'});
     if(evaluation&&!contact.evaluation)issues.push({type:'unknown-evaluation',key:contact.key,message:'Valoración no reconocida'});
     for(const field of ['startZone','endZone','contactZone','setTarget'])if(present(a[field])&&!fields[field])
      issues.push({type:'invalid-zone',key:contact.key,field,message:'Zona no reconocida'});
     contacts.push(contact);rally.contacts.push(contact);
    }
    // Each possession is a contiguous run of contacts from the SAME known team.
    // An unknown team is a boundary, never assigned to either team.
    let group=null;
    for(const c of rally.contacts){
     if(!group||!c.team||group.team!==c.team){
      if(!c.team){group=null;continue;}
      group={key:rally.key+'|pos:'+rally.possessions.length,rallyKey:rally.key,team:c.team,contacts:[],set:rally.set,rotation:c.team==='ours'?rally.ownRotation:rally.rivalRotation,
       serving:rally.serving,winner:rally.winner};
      rally.possessions.push(group);possessions.push(group);
     }
     group.contacts.push(c);c.possessionKey=group.key;
    }
    // Pair a set only with its next attack BEFORE another set or any team change.
    // Reception is the most recent contact R within the same possession before E.
    for(const p of rally.possessions){
     for(const [pi,c] of p.contacts.entries()){
      if(c.skill!=='E')continue;
      let attack=null,rec=null;
      for(let i=pi+1;i<p.contacts.length;i++){const next=p.contacts[i];if(next.skill==='E')break;if(next.skill==='A'){attack=next;break;}}
      for(let i=pi-1;i>=0;i--)if(p.contacts[i].skill==='R'){rec=p.contacts[i];break;}
      chains.push({key:c.key,team:p.team,rallyKey:rally.key,possessionKey:p.key,rotation:p.rotation,setter:c,attack,reception:rec,
       target:c.fields.setTarget,tempo:c.fields.tempo,combo:c.fields.combo||attack?.fields.combo||'',explicitTarget:!!c.fields.setTarget});
     }
    }
    rallies.push(rally);
   }
  }
  return {version:VERSION,matchId,rallies,contacts,possessions,chains,issues,
   count:{rallies:rallies.length,closed:rallies.filter(x=>x.closed).length,contacts:contacts.length,possessions:possessions.length,chains:chains.length}};
 }
 // V20.5.24: the exported normalization delegates to the typed Vite engine.
 // The historic pure function remains a compatible fallback for old deployments.
 function normalizeCompat(match){
  try{const typed=root?.VC_ANALYSIS_NORMALIZE_20524;
   if(typeof typed?.normalize==='function'){
    const projected=typed.normalize(match);
    if(projected&&projected.version===VERSION&&Array.isArray(projected.rallies)&&Array.isArray(projected.contacts))return projected;
   }
  }catch(_){/* Read-only fallback: no change to original match. */}
  return normalize(match);
 }
 function filter(data,f={}){
  const target=team(f.team),set=present(f.set)?Number(f.set):null,rotation=present(f.rotation)?Number(f.rotation):null;
  const phase=val(f.phase).toUpperCase(),skill=val(f.skill).toUpperCase(),evalCode=val(f.evaluation),player=val(f.player).toLocaleLowerCase('es');
  const start=zone(f.startZone),end=zone(f.endZone),setter=val(f.setter).toLocaleLowerCase('es');
  const rallyBase=data.rallies.filter(r=>r.closed&&(!set||r.set===set)&&(!rotation||(!target?false:(target==='ours'?r.ownRotation:r.rivalRotation)===rotation))&&
   (!phase||!!r.serving&&(!target?false:phase==='K1'?r.serving!==target:phase==='K2'?r.serving===target:false)));
  const candidates=new Set(rallyBase.map(r=>r.key));
  const actionFiltered=!!(skill||evalCode||player||start||end||f.video===true);
  const contacts=data.contacts.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&(!skill||c.skill===skill)&&
   (!evalCode||c.evaluation===evalCode)&&(!player||c.player?.toLocaleLowerCase('es')===player)&&
   (!start||c.fields.startZone?.code===start.code)&&(!end||c.fields.endZone?.code===end.code)&&
   (f.video!==true||c.video));
  const chains=data.chains.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&(!setter||c.setter.player?.toLocaleLowerCase('es')===setter));
  // A setter + action combination must match one possession, not two unrelated
  // contacts inside the same rally. Action filters themselves match ONE contact.
  const allowedPossessions=setter?new Set(chains.map(c=>c.possessionKey)):null;
  const matchingContacts=allowedPossessions?contacts.filter(c=>allowedPossessions.has(c.possessionKey)):contacts;
  const chosen=new Set(actionFiltered?matchingContacts.map(c=>c.rallyKey):setter?chains.map(c=>c.rallyKey):rallyBase.map(r=>r.key));
  const rallies=rallyBase.filter(r=>chosen.has(r.key));
  const keys=new Set(rallies.map(r=>r.key));
  return {rallies,contacts:matchingContacts.filter(c=>keys.has(c.rallyKey)),possessions:data.possessions.filter(p=>keys.has(p.rallyKey)&&(!target||p.team===target)&&(!allowedPossessions||allowedPossessions.has(p.key))),
   chains:chains.filter(c=>keys.has(c.rallyKey)),target,filters:f};
 }
 function evaluate(contacts,skill='A'){
  const rows=arr(contacts).filter(c=>c.skill===skill),rated=rows.filter(c=>c.evaluation),kills=rated.filter(c=>c.evaluation==='#').length,
   errors=rated.filter(c=>c.evaluation==='=').length,blocked=rated.filter(c=>c.evaluation==='/').length;
  return {recorded:rows.length,rated:rated.length,missing:rows.length-rated.length,kills,errors,blocked,
   killPct:pct(kills,rated.length),efficiency:skill==='A'?pct(kills-errors-blocked,rated.length):null};
 }
 function points(rows,teamId){
  const target=team(teamId);if(!target)return null;
  const valid=arr(rows).filter(r=>r.closed),k1=valid.filter(r=>r.serving&&r.serving!==target),k2=valid.filter(r=>r.serving===target);
  const calc=list=>({n:list.length,won:list.filter(r=>r.winner===target).length,pct:pct(list.filter(r=>r.winner===target).length,list.length)});
  return {closed:valid.length,unknownServe:valid.filter(r=>!r.serving).length,k1:calc(k1),k2:calc(k2)};
 }
 function coverage(data){
  const all=data.contacts,bySkill=[];
  for(const s of ['S','R','E','A','B','D']){
   const rows=all.filter(c=>c.skill===s),n=rows.length;
   const properties={team:rows.filter(c=>c.team).length,player:rows.filter(c=>c.player).length,evaluation:rows.filter(c=>c.evaluation).length,
    zone:rows.filter(c=>c.fields.contactZone||c.fields.startZone||c.fields.endZone||(s==='E'&&c.fields.setTarget)).length,
    video:rows.filter(c=>c.video).length};
   if(s==='E'){properties.tempo=rows.filter(c=>c.fields.tempo).length;properties.target=rows.filter(c=>c.fields.setTarget).length;}
   if(s==='A'){properties.direction=rows.filter(c=>c.fields.direction).length;properties.attackTempo=rows.filter(c=>c.fields.attackTempo).length;}
   bySkill.push({skill:s,n,properties});
  }
  return {bySkill,missingIDs:data.contacts.filter(c=>!c.nativeId).length,unknownTeams:data.contacts.filter(c=>!c.team).length,
   invalidValues:data.issues.filter(i=>['invalid-zone','unknown-evaluation','unknown-skill','duplicate-action','duplicate-rally','duplicate-set'].includes(i.type)).length};
 }
 function reconcile(data,legacy,teamId){
  const target=team(teamId),ours=points(data.rallies,target),previous=legacy?.points;
  if(!ours||!previous)return null;
  return {oldK1:previous.k1?.n,newK1:ours.k1.n,oldK2:previous.k2?.n,newK2:ours.k2.n,
   agrees:previous.k1?.n===ours.k1.n&&previous.k2?.n===ours.k2.n,
   note:'La comparación es de denominadores, no sustituye los cálculos oficiales.'};
 }
 // V20.5.25: the actual Data Engine UI invokes the typed operations when loaded.
 // All five historical pure functions remain as a no-write fallback.
 const typedOperation=(name,args,valid,fallback)=>{
  try{
   const operation=root?.VC_ANALYSIS_OPERATIONS_20525?.[name];
   if(typeof operation==='function'){
    const result=operation(...args);
    if(valid(result))return result;
   }
  }catch(_){/* No data changes: safely re-run the historical pure operation. */}
  return fallback(...args);
 };
 const filterCompat=(data,f={})=>typedOperation('filter',[data,f],
  x=>!!x&&Array.isArray(x.rallies)&&Array.isArray(x.contacts)&&
   Array.isArray(x.possessions)&&Array.isArray(x.chains),filter);
 const evaluateCompat=(contacts,skill='A')=>typedOperation('evaluate',[contacts,skill],
  x=>!!x&&Number.isInteger(x.recorded)&&Number.isInteger(x.rated)&&'efficiency'in x,evaluate);
 const pointsCompat=(rows,teamId)=>typedOperation('points',[rows,teamId],
  x=>x===null||!!x&&Number.isInteger(x.closed)&&Number.isInteger(x.k1?.n)&&Number.isInteger(x.k2?.n),points);
 const coverageCompat=data=>typedOperation('coverage',[data],
  x=>!!x&&Array.isArray(x.bySkill)&&Number.isInteger(x.unknownTeams),coverage);
 const reconcileCompat=(data,legacy,teamId)=>typedOperation('reconcile',[data,legacy,teamId],
  x=>x===null||!!x&&typeof x.agrees==='boolean'&&Number.isInteger(x.newK1),reconcile);
 function csvEscape(x){let text=val(x);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(text.trim()))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
 function toCSV(data){const header=['Partido','Set','Rally','ID rally estable','Posesión','Acción','ID acción estable','Equipo','Fundamento','Jugador','Evaluación','Zona origen','Zona destino','Zona contacto','Destino E','Tempo E','Combinación','Referencia vídeo'];
  const rByKey=new Map(data.rallies.map(r=>[r.key,r]));
  const rows=data.contacts.map(c=>{const r=rByKey.get(c.rallyKey);return [data.matchId,c.set,c.rallyIndex,r?.nativeId||'',c.possessionKey||'',c.actionIndex+1,c.nativeId||'',c.team||'',c.skill||c.skillRaw,c.player||'',c.evaluation||'',c.fields.startZone?.code||'',c.fields.endZone?.code||'',c.fields.contactZone?.code||'',c.fields.setTarget?.code||'',c.fields.tempo,c.fields.combo,c.video?'Sí':'No']});
  return '\ufeff'+[header,...rows].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 // V20.5.26: CSV export delegates to the typed, read-only module when loaded.
 // The exact historical quoting, columns, BOM and formula guard remain fallback.
 function toCSVCompat(data){
  try{
   const typed=root?.VC_ANALYSIS_CSV_20526?.toCSV;
   if(typeof typed==='function'){
    const csv=typed(data);
    if(typeof csv==='string'&&csv.startsWith('\ufeff"Partido";"Set";"Rally"'))return csv;
   }
  }catch(_){/* Export fallback never changes the scouting record. */}
  return toCSV(data);
 }
 function panelHTML(data,selection,legacy){
  const c=coverageCompat(data),stats=evaluateCompat(selection.contacts),comparison=reconcileCompat({rallies:selection.rallies},legacy,selection.target);
  // V20.5.29: TypeScript owns the real Data Engine view when the Vite module
  // is present. The original markup below remains the exact offline fallback.
  try{
   const render=root?.VC_ANALYSIS_VIEW_20529?.renderDataEngine;
   if(typeof render==='function'){
    const html=render({data,selection,coverage:c,attack:stats,comparison});
    if(html&&typeof html.left==='string'&&typeof html.center==='string'&&
     typeof html.notice==='string'&&Array.isArray(html.badges)&&html.badges.length===5&&
     html.left.includes('vc1938-audit')&&html.center.includes('vc1938-audit'))return html;
   }
  }catch(_){/* A broken or unavailable Vite renderer cannot block analysis. */}
  const rows=c.bySkill.map(row=>`<tr><td><b>${esc(row.skill)}</b></td><td>${row.n}</td><td>${row.properties.team}/${row.n}</td><td>${row.properties.player}/${row.n}</td><td>${row.properties.evaluation}/${row.n}</td><td>${row.properties.zone}/${row.n}</td><td>${row.properties.video}/${row.n}</td></tr>`).join('');
  const chains=selection.chains.slice(-45).reverse().map(link=>`<tr><td>${esc(link.setter.set)} · ${esc(link.setter.rallyIndex)}</td><td>${esc(link.setter.player||'—')}</td><td>${esc(link.reception?.evaluation||'—')}</td><td>${esc(link.target?.code||'—')}</td><td>${esc(link.tempo||'—')}</td><td>${esc(link.attack?.player||'Sin ataque')}</td><td>${esc(link.attack?.evaluation||'—')}</td></tr>`).join('');
  return {left:`<div class="vc1938-audit"><h3>Professional Data Engine · Contactos</h3><p>Modelo común de solo lectura. Los contactos sin equipo o valoración se mantienen como desconocidos, sin asignaciones automáticas.</p><div class="vc1938-filters"><label>Fundamento<select data-vc1938-filter="skill"><option value="">Todos</option>${['S','R','E','A','B','D','F','C'].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label><label>Valoración<select data-vc1938-filter="evaluation"><option value="">Todas</option>${['#','+','!','-','/','='].map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${selection.rallies.length}</strong>rallies filtrados</span><span><strong>${selection.contacts.length}</strong>contactos filtrados</span><span><strong>${selection.possessions.length}</strong>posesiones</span><span><strong>${selection.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${rows}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
   center:`<div class="vc1938-audit"><h3>Posesión → colocación → ataque</h3><p>Solo se emparejan contactos consecutivos del mismo equipo; un contacto rival o sin equipo separa posesiones.</p><div class="vc1938-scroll"><table><thead><tr><th>Set / rally</th><th>Colocador</th><th>Recep.</th><th>Destino</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${chains||'<tr><td colspan="7">No hay colocaciones en esta selección.</td></tr>'}</tbody></table></div><div class="vc1938-note">Ataques evaluados: ${stats.rated}/${stats.recorded}; EFF ataque: ${stats.efficiency==null?'sin muestra':stats.efficiency+' %'}. ${comparison?(comparison.agrees?'K1/K2 coincide en número de oportunidades.':'Revisar diferencias de denominadores K1/K2 con el motor anterior.'):'Sin comparación disponible.'}</div></div>`,
   notice:`${data.count.rallies} rallies totales · ${data.count.closed} cerrados · ${c.unknownTeams} contactos sin equipo · ${c.missingIDs} contactos sin ID · ${c.invalidValues} incidencias de integridad · ${data.issues.length} observaciones`,
   badges:[['Rallies',data.count.rallies],['Contactos',data.count.contacts],['Posesiones',data.count.possessions],['Colocaciones',data.count.chains],['Rallies abiertos',data.count.rallies-data.count.closed]]
  };
 }
 function decorate(panel,ctx,tab){
  if(tab!=='data'||!ctx?.match)return;
  const original=ctx.match,api=panel.ownerDocument.defaultView?.VC_DATA_ENGINE_1938;
  const data=api?.normalize(original);if(!data)return;
  const state=panel._vc1938||{skill:'',evaluation:''};
  const f={team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase,skill:state.skill,evaluation:state.evaluation};
  const selection=filterCompat(data,f),visual=panelHTML(data,selection,ctx.data);
  const left=panel.querySelector('.vc1937-left-body'),center=panel.querySelector('.vc1937-courtbody');
  if(!left||!center)return;
  // V20.5.28: avoid destroying filters and result nodes on an unchanged redraw.
  // Check the mounted marker too: other historic tabs can replace the same host.
  const win=panel.ownerDocument.defaultView,start=win?.performance?.now?.()??Date.now();
  const prior=panel._vc1938Rendered||{};
  const leftChanged=prior.left!==visual.left||!left.firstElementChild?.classList?.contains('vc1938-audit');
  const centerChanged=prior.center!==visual.center||!center.firstElementChild?.classList?.contains('vc1938-audit');
  if(leftChanged)left.innerHTML=visual.left;
  if(centerChanged)center.innerHTML=visual.center;
  panel._vc1938Rendered={left:visual.left,center:visual.center};
  win?.VC_RENDER_METRICS_20528?.observe?.('data-engine',leftChanged||centerChanged?'render':'skip',
   (win?.performance?.now?.()??Date.now())-start);
  const leftHead=panel.querySelector('.vc1937-left>header strong');if(leftHead)leftHead.textContent='AUDITORÍA DE CONTACTOS';
  const centerHead=panel.querySelector('.vc1937-center>header strong');if(centerHead)centerHead.textContent='POSESIONES Y SECUENCIAS';
  const reset=panel.querySelector('.vc1937-center>header [data-vc1937-reset]');if(reset)reset.hidden=true;
  const legacyHint=panel.querySelector('.vc1937-details-hint');if(legacyHint)legacyHint.hidden=true;
  const timeline=panel.querySelector('.vc1937-timeline');if(timeline)timeline.hidden=true;
  const metrics=panel.querySelector('.vc1937-kpis');if(metrics){const badgesHTML=visual.badges.map(([k,n])=>`<div class="vc1937-kpi"><span>${esc(k)}</span><strong>${n}</strong></div>`).join('');if(metrics.innerHTML!==badgesHTML)metrics.innerHTML=badgesHTML;}
  const note=panel.querySelector('.vc1937-courtnote');if(note)note.textContent=visual.notice;
  for(const select of panel.querySelectorAll('[data-vc1938-filter]'))select.value=state[select.dataset.vc1938Filter]||'';
  const matching=new Set(selection.rallies.map(r=>`${r.set}:${r.nativeId}`));
  const mapped=ctx.data.rallies.filter(r=>matching.has(`${r.set}:${r.id}`));
  panel._vc1937VisibleRallies=mapped;
  const list=panel.querySelector('.vc1937-rallies');if(list){
   const listHTML=mapped.slice(-100).reverse().map(r=>`<button type="button" class="vc1937-rally" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="false"><b>S${r.set} · #${r.index}</b><span>${esc(r.winning||'Sin ganador')}</span></button>`).join('')||'<p class="vc1937-empty">Sin rallies con estos filtros o sin ID estable.</p>';
   if(list.innerHTML!==listHTML)list.innerHTML=listHTML;
   panel.querySelector('.vc1937-rally-count').textContent=`${mapped.length} rallies con referencia original`;
  }
  panel._vc1938={...state,data,ctx,selection};
  if(!panel.dataset.vc1938Bound){
   panel.dataset.vc1938Bound='yes';
   panel.addEventListener('change',event=>{
    const el=event.target;if(!el?.dataset?.vc1938Filter)return;
    const s=panel._vc1938;if(!s)return;s[el.dataset.vc1938Filter]=el.value;decorate(panel,s.ctx,'data');
   });
   panel.addEventListener('click',event=>{
    const b=event.target.closest?.('[data-vc1938-export]');if(!b)return;
    const s=panel._vc1938;if(!s)return;
    const source=toCSVCompat({...s.data,contacts:s.selection.contacts}),win=panel.ownerDocument.defaultView;
    const blob=new win.Blob([source],{type:'text/csv;charset=utf-8'});
    const url=win.URL.createObjectURL(blob),link=panel.ownerDocument.createElement('a');link.href=url;link.download='volley-coach-contactos-'+s.data.matchId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';
    panel.ownerDocument.body.append(link);link.click();link.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
   });
  }
 }
 return {VERSION,SKILLS,EVALS,zone,team,normalize:normalizeCompat,
  filter:filterCompat,evaluate:evaluateCompat,points:pointsCompat,coverage:coverageCompat,
  reconcile:reconcileCompat,toCSV:toCSVCompat,panelHTML,decorate};
});

/* VC20717_SOURCE_END:189-vc1938-professional-data-engine.js */

/* VC20717_SOURCE_BEGIN:190-vc1939-rally-search-pro.js */
/* Volley Coach V19.3.9 · Rally Search Pro
 * Read-only multi-criteria rally search using VC_DATA_ENGINE_1938 canonical
 * rally/contact/possession projections. No new scouting or cloud persistence.
 * All selected evidence is resolved back to original match/set/rally IDs.
 */
(function(root,factory){
 'use strict';const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_RALLY_SEARCH_1939=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='19.3.9',STORAGE_KEY='vc1939:search-presets:1';
 const val=x=>String(x??'').trim();
 const arr=x=>Array.isArray(x)?x:[];
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lc=x=>val(x).toLocaleLowerCase('es');
 const validTeam=t=>t==='ours'||t==='opponent'?t:null;
 const option=(x,label=x)=>`<option value="${esc(x)}">${esc(label)}</option>`;
 const FILTERS=['code','skill','player','evaluation','ownRotation','rivalRotation','reception','setter','attacker','tempo','combo','startZone','endZone','outcome','video','status'];
 const skillLabels={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const selectors={
  skill:[['','Todos los fundamentos'],...Object.entries(skillLabels)],
  evaluation:[['','Todas las valoraciones'],...['#','+','!','-','/','='].map(x=>[x,x])],
  ownRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
  rivalRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
  reception:[['','Cualquier recepción'],...['#','+','!','-','/','='].map(x=>[x,x])],
  outcome:[['','Todos'],['ours','Punto nuestro'],['opponent','Punto rival']],
  video:[['','Todos'],['yes','Con marca de vídeo'],['no','Sin marca de vídeo']],
  status:[['closed','Solo cerrados'],['all','Cerrados y abiertos'],['open','Solo abiertos']]
 };
 const normFilters=f=>Object.fromEntries(FILTERS.map(k=>[k,val(f?.[k]).slice(0,k==='code'?100:80)]));
 function query(data,filters={}){
  const f=normFilters(filters),target=validTeam(filters.team),set=val(filters.set),rotation=val(filters.rotation),phase=val(filters.phase).toUpperCase();
  const code=lc(f.code),actionRequired=!!(code||f.skill||f.player||f.evaluation||f.startZone||f.endZone||f.video);
  const chainRequired=!!(f.setter||f.attacker||f.tempo||f.combo);
  const sequenceRequired=chainRequired||!!f.reception;
  const selectedRallies=[],contactByKey=new Map(),chainByKey=new Map();
  const chainsByRally=new Map();for(const chain of arr(data?.chains)){if(!chainsByRally.has(chain.rallyKey))chainsByRally.set(chain.rallyKey,[]);chainsByRally.get(chain.rallyKey).push(chain)}
  const checkContact=c=>c&&(!target||c.team===target)&&(!f.skill||c.skill===f.skill)&&(!f.evaluation||c.evaluation===f.evaluation)&&
   (!f.player||lc(c.player)===lc(f.player))&&(!code||[c.code,c.skillRaw,c.fields?.attackCode,c.fields?.specialCode,c.fields?.startZone?.code,c.fields?.endZone?.code,c.fields?.setTarget?.code,c.fields?.contactZone?.code,c.fields?.combo,c.fields?.direction].some(s=>lc(s).includes(code)))&&
   (!f.startZone||c.fields?.startZone?.code===f.startZone.toUpperCase().replace(/^([^Z])/, 'Z$1'))&&
   (!f.endZone||c.fields?.endZone?.code===f.endZone.toUpperCase().replace(/^([^Z])/, 'Z$1'))&&
   (!f.video||(f.video==='yes'?!!c.video:!c.video));
  const chainMatches=c=>c&&(!target||c.team===target)&&(!f.setter||lc(c.setter?.player)===lc(f.setter))&&
   (!f.attacker||lc(c.attack?.player)===lc(f.attacker))&&
   (!f.tempo||lc(c.tempo||c.attack?.fields?.attackTempo)===lc(f.tempo))&&
   (!f.combo||lc(c.combo)===lc(f.combo))&&(!f.reception||c.reception?.evaluation===f.reception);
  for(const r of arr(data?.rallies)){
   if(f.status!=='all'&&((f.status==='open')!==!r.closed))continue;
   if(set&&String(r.set)!==set)continue;
   if(f.ownRotation&&String(r.ownRotation||'')!==f.ownRotation)continue;
   if(f.rivalRotation&&String(r.rivalRotation||'')!==f.rivalRotation)continue;
   if(rotation&&String((target==='opponent'?r.rivalRotation:r.ownRotation)||'')!==rotation)continue;
   if(phase){if(!target||!r.serving)continue;const actual=r.serving===target?'K2':'K1';if(actual!==phase)continue;}
   if(f.outcome&&r.winner!==f.outcome)continue;
   const inTeam=r.contacts.filter(c=>!target||c.team===target);
   const matchedChains=(chainsByRally.get(r.key)||[]).filter(chainMatches);
   let candidates;
   if(sequenceRequired){
    const allowedKeys=new Set();
    for(const chain of matchedChains){for(const c of [chain.reception,chain.setter,chain.attack])if(c)allowedKeys.add(c.key)}
    // A reception-only query can find receptions even if no setter follows.
    if(f.reception&&!chainRequired)for(const c of inTeam)if(c.skill==='R'&&c.evaluation===f.reception)allowedKeys.add(c.key);
    const possessionKeys=new Set([...matchedChains.map(c=>c.possessionKey)]);
    if(f.reception&&!chainRequired)for(const c of inTeam)if(c.skill==='R'&&c.evaluation===f.reception&&c.possessionKey)possessionKeys.add(c.possessionKey);
    // For mixed contact + sequence criteria, match one contact that belongs to the
    // matched possession; if a specific contact type is selected, check it directly.
    candidates=inTeam.filter(c=>possessionKeys.has(c.possessionKey)&&(!actionRequired||checkContact(c))&&
     (!actionRequired||!f.skill||allowedKeys.has(c.key)));
    if(!actionRequired)candidates=inTeam.filter(c=>allowedKeys.has(c.key));
   }else candidates=inTeam.filter(checkContact);
   if((actionRequired||sequenceRequired)&&!candidates.length)continue;
   selectedRallies.push(r);
   for(const c of candidates)contactByKey.set(c.key,c);
   for(const chain of matchedChains)if(!actionRequired||candidates.some(c=>c.possessionKey&&c.possessionKey===chain.possessionKey))chainByKey.set(chain.key,chain);
  }
  const contacts=[...contactByKey.values()],chains=[...chainByKey.values()];
  const bySkill=new Map(),byPlayer=new Map();
  for(const c of contacts){const skill=c.skill||'?',player=c.player||'Sin identificar';bySkill.set(skill,(bySkill.get(skill)||0)+1);byPlayer.set(player,(byPlayer.get(player)||0)+1)}
  const ratedAttacks=contacts.filter(c=>c.skill==='A'&&c.evaluation),kills=ratedAttacks.filter(c=>c.evaluation==='#').length,
   errors=ratedAttacks.filter(c=>c.evaluation==='=').length,blocked=ratedAttacks.filter(c=>c.evaluation==='/').length;
  const eff=ratedAttacks.length?Math.round((kills-errors-blocked)/ratedAttacks.length*1000)/10:null;
  const statistics={rallies:selectedRallies.length,contacts:contacts.length,chains:chains.length,videoContacts:contacts.filter(c=>c.video).length,
   missingEvaluation:contacts.filter(c=>!c.evaluation).length,attackRated:ratedAttacks.length,kills,errors,blocked,efficiency:eff,
   bySkill:[...bySkill].sort((a,b)=>b[1]-a[1]),byPlayer:[...byPlayer].sort((a,b)=>b[1]-a[1])};
  return {rallies:selectedRallies,contacts,chains,statistics,filters:f,target,matchId:val(data?.matchId)};
 }
 function csvEscape(x){let s=val(x);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function toCSV(result){const header=['Partido','Set','Rally','ID rally','Índice acción','ID acción','Equipo','Jugador','Fundamento','Código','Evaluación','Zona origen','Zona destino','Posesión','Vídeo'];
  const match=new Map(result.rallies.map(r=>[r.key,r]));
  const records=result.contacts.map(c=>{const r=match.get(c.rallyKey);return [result.matchId,c.set,c.rallyIndex,r?.nativeId||'',c.actionIndex+1,c.nativeId||'',c.team||'',c.player||'',c.skill||c.skillRaw,c.code,c.evaluation||'',c.fields?.startZone?.code||'',c.fields?.endZone?.code||'',c.possessionKey||'',c.video?'Sí':'No']});
  return '\ufeff'+[header,...records].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 function readPresets(storage){try{const list=JSON.parse(storage?.getItem(STORAGE_KEY)||'[]');return arr(list).filter(x=>x&&typeof x.name==='string'&&x.name.length<=40&&x.filters&&typeof x.filters==='object').slice(-15).map(x=>({name:x.name,filters:normFilters(x.filters)}));}catch(_){return []}}
 function readPresetsCompat(storage){
  try{const typed=root?.VC_RALLY_CONTROLS_20531?.readPresets;
   if(typeof typed==='function'){
    const list=typed(storage);
    if(Array.isArray(list)&&list.length<=15&&list.every(x=>x&&typeof x.name==='string'&&x.filters&&typeof x.filters==='object'))return list;
   }
  }catch(_){/* Preserve historic preset parsing if the typed bridge fails. */}
  return readPresets(storage);
 }
 function catalog(data){const unique=(values)=>[...new Set(values.map(val).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).slice(0,250);
  const contacts=arr(data?.contacts),chains=arr(data?.chains);
  return {players:unique(contacts.map(x=>x.player)),setters:unique(chains.map(x=>x.setter?.player)),attackers:unique(chains.map(x=>x.attack?.player)),
   tempos:unique(chains.map(x=>x.tempo||x.attack?.fields?.attackTempo)),combos:unique(chains.map(x=>x.combo)),
   startZones:unique(contacts.map(x=>x.fields?.startZone?.code)),endZones:unique(contacts.map(x=>x.fields?.endZone?.code))};
 }
 function field(label,id,items,active=''){return `<label>${esc(label)}<select data-vc1939-filter="${id}">${items.map(([k,v])=>option(k,v)).join('')}</select></label>`;}
 function renderPanel(data,result,filters){
  // V20.5.30: the Vite/TypeScript module owns HTML generation when available.
  // The original rendering and every legacy interaction remain a safe fallback.
  try{
   const render=root?.VC_RALLY_VIEW_20530?.render;
   if(typeof render==='function'){
    const html=render(data,result,filters);
    if(html&&typeof html.left==='string'&&typeof html.center==='string'&&
     html.left.startsWith('<div class="vc1939-left">')&&
     html.center.startsWith('<div class="vc1939-center-body">'))return html;
   }
  }catch(_){/* A missing or broken Vite view cannot block scouting search. */}
  const c=catalog(data),f=normFilters(filters),selectOptions=(choices)=>[['','Todos'],...choices.map(x=>[x,x])];
  const filterBlock=`<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${field('Fundamento','skill',selectors.skill)}${field('Jugador','player',selectOptions(c.players))}${field('Valoración','evaluation',selectors.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${field('Rotación propia','ownRotation',selectors.ownRotation)}${field('Rotación rival','rivalRotation',selectors.rivalRotation)}
  ${field('Recepción anterior','reception',selectors.reception)}${field('Colocador','setter',selectOptions(c.setters))}
  ${field('Atacante tras colocación','attacker',selectOptions(c.attackers))}${field('Tempo','tempo',selectOptions(c.tempos))}
  ${field('Combinación','combo',selectOptions(c.combos))}${field('Origen','startZone',selectOptions(c.startZones))}
  ${field('Destino','endZone',selectOptions(c.endZones))}${field('Ganador del rally','outcome',selectors.outcome)}
  ${field('Marca temporal','video',selectors.video)}${field('Estado del rally','status',selectors.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`;
  const summary=result.statistics,stats=`<div class="vc1939-metrics"><div><strong>${summary.rallies}</strong><span>Rallies</span></div><div><strong>${summary.contacts}</strong><span>Contactos</span></div><div><strong>${summary.chains}</strong><span>Colocaciones</span></div><div><strong>${summary.videoContacts}</strong><span>Marcas vídeo</span></div></div>`;
  const skills=summary.bySkill.map(([key,n])=>`<tr><td>${esc(skillLabels[key]||key)}</td><td>${n}</td><td>${summary.contacts?Math.round(n/summary.contacts*1000)/10:0} %</td></tr>`).join('');
  const players=summary.byPlayer.slice(0,10).map(([key,n])=>`<tr><td>${esc(key)}</td><td>${n}</td></tr>`).join('');
  const left=`<div class="vc1939-left"><h3>Buscador de rallies</h3>${filterBlock}${stats}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${skills||'<tr><td colspan="3">Sin acciones con esta selección.</td></tr>'}</tbody></table></div></div>`;
  const seqRows=result.chains.slice(0,50).map(c=>`<tr><td>S${c.setter?.set} · R${c.setter?.rallyIndex}</td><td>${esc(c.reception?.evaluation||'—')}</td><td>${esc(c.setter?.player||'—')}</td><td>${esc(c.tempo||'—')}</td><td>${esc(c.attack?.player||'—')}</td><td>${esc(c.attack?.evaluation||'—')}</td></tr>`).join('');
  const center=`<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${summary.attackRated} · Eficiencia: ${summary.efficiency==null?'Sin muestra':summary.efficiency.toLocaleString('es-ES')+' %'} · Sin valoración: ${summary.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${players||'<tr><td colspan="2">Sin jugadores codificados.</td></tr>'}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${seqRows||'<tr><td colspan="6">No hay secuencias completas con estos filtros.</td></tr>'}</tbody></table></div></div>`;
  return {left,center};
 }
 function decorate(panel,ctx,tab){if(tab!=='search'||!ctx?.match)return;
  const win=panel.ownerDocument.defaultView,api=win?.VC_DATA_ENGINE_1938;const normalized=api?.normalize?.(ctx.match);if(!normalized)return;
  const session=panel._vc1939&&panel._vc1939.matchId===normalized.matchId?panel._vc1939:{matchId:normalized.matchId,filters:{status:'closed'},active:false};
  const currentInput=panel.ownerDocument.activeElement;const activeFilter=currentInput?.dataset?.vc1939Filter||'';const cursor=activeFilter&&currentInput.tagName==='INPUT'?currentInput.selectionStart:null;
  const advancedOpen=panel.querySelector('.vc1939-advanced')?.open||false;
  const merged={...session.filters,team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase};
  // V20.5.23: the proven UI, presets, exports and video mappings stay here.
  // Only the pure multi-filter query delegates to the typed Vite module.
  // The historical query remains a safe fallback if the new module is absent.
  let result,engine='classic';
  try{const typed=win?.VC_ANALYSIS_QUERY_20523;
   if(typeof typed?.query==='function'){result=typed.query(normalized,merged);engine='typescript';}}
  catch(_){engine='classic';}
  if(!result)result=query(normalized,merged);
  panel.dataset.vc20523QueryEngine=engine;
  const html=renderPanel(normalized,result,session.filters);
  const left=panel.querySelector('.vc1937-left-body'),center=panel.querySelector('.vc1937-courtbody');if(!left||!center)return;
  // V20.5.28: retain the active search controls on an identical redraw.
  // A different tab may reuse these containers, so validate their live markers.
  const start=win?.performance?.now?.()??Date.now(),prior=panel._vc1939Rendered||{};
  const leftChanged=prior.left!==html.left||!left.firstElementChild?.classList?.contains('vc1939-left');
  const centerChanged=prior.center!==html.center||!center.firstElementChild?.classList?.contains('vc1939-center-body');
  if(leftChanged)left.innerHTML=html.left;
  if(centerChanged)center.innerHTML=html.center;
  panel._vc1939Rendered={left:html.left,center:html.center};
  win?.VC_RENDER_METRICS_20528?.observe?.('rally-search',leftChanged||centerChanged?'render':'skip',
   (win?.performance?.now?.()??Date.now())-start);
  const advanced=panel.querySelector('.vc1939-advanced');if(advanced)advanced.open=advancedOpen;
  const leftHead=panel.querySelector('.vc1937-left>header strong');if(leftHead)leftHead.textContent='BÚSQUEDA TÁCTICA';
  const centerHead=panel.querySelector('.vc1937-center>header strong');if(centerHead)centerHead.textContent='RESULTADOS DE LA BÚSQUEDA';
  const reset=panel.querySelector('.vc1937-center>header [data-vc1937-reset]');if(reset)reset.hidden=true;
  const detail=panel.querySelector('.vc1937-details-hint');if(detail)detail.hidden=true;
  const timeline=panel.querySelector('.vc1937-timeline');if(timeline)timeline.hidden=true;
  const badges=panel.querySelector('.vc1937-kpis');if(badges){const badgesHTML=[['Rallies',result.statistics.rallies],['Contactos',result.statistics.contacts],['Con vídeo',result.statistics.videoContacts],['Colocaciones',result.statistics.chains],['Sin evaluar',result.statistics.missingEvaluation]].map(([k,n])=>`<div class="vc1937-kpi"><span>${k}</span><strong>${n}</strong></div>`).join('');if(badges.innerHTML!==badgesHTML)badges.innerHTML=badgesHTML;}
  const note=panel.querySelector('.vc1937-courtnote');if(note)note.textContent='Resultados procedentes del scouting original. No se infieren jugadores, posesiones, tiempos ni rotaciones ausentes.'+(engine==='typescript'?' · Consulta TypeScript.':'');
  for(const input of panel.querySelectorAll('[data-vc1939-filter]')){const name=input.dataset.vc1939Filter;input.value=session.filters[name]||((name==='status')?'closed':'');}
  if(activeFilter){const next=panel.querySelector('[data-vc1939-filter="'+activeFilter+'"]');if(next){next.focus();if(cursor!=null&&next.setSelectionRange)next.setSelectionRange(cursor,cursor);}}
  const presets=panel.querySelector('[data-vc1939-preset]');if(presets){const old=session.preset||'';let saved=[];try{saved=readPresetsCompat(win.localStorage)}catch(_){}const presetsHTML='<option value="">Búsquedas guardadas</option>'+saved.map(p=>option(p.name)).join('');if(presets.innerHTML!==presetsHTML)presets.innerHTML=presetsHTML;presets.value=[...presets.options].some(o=>o.value===old)?old:'';}
  // Preserve source IDs: never map a synthetic index to a different rally.
  const selectedKeys=new Set(result.rallies.filter(r=>r.nativeId!=null).map(r=>`${r.set}:${r.nativeId}`));
  const mapped=ctx.data.rallies.filter(r=>r.id!=null&&selectedKeys.has(`${r.set}:${r.id}`));
  panel._vc1937VisibleRallies=mapped;
  const list=panel.querySelector('.vc1937-rallies');if(list){const listHTML=mapped.slice(-150).reverse().map(r=>`<button type="button" class="vc1937-rally" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="false"><b>Set ${r.set} · #${r.index}</b><span>${esc(r.winning==='ours'?'Punto nuestro':r.winning==='opponent'?'Punto rival':'Sin resultado')}</span></button>`).join('')||'<p class="vc1937-empty">Sin rallies con ID válido, o sin coincidencias.</p>';
   if(list.innerHTML!==listHTML)list.innerHTML=listHTML;
   panel.querySelector('.vc1937-rally-count').textContent=`${mapped.length} rallies con referencia · ${result.rallies.length} encontrados`;
  }
  session.matchId=normalized.matchId;session.data=normalized;session.result=result;session.ctx=ctx;session.active=true;panel._vc1939=session;
  // V20.5.31: delegated TypeScript controller owns new event binding when
  // present. Existing panels and browser builds retain the classic handlers.
  if(!panel.dataset.vc1939Bound){
   try{if(win?.VC_RALLY_CONTROLS_20531?.bind?.(panel,{
    refresh:()=>{if(panel._vc1939?.ctx)decorate(panel,panel._vc1939.ctx,'search')},toCSV
   }))panel.dataset.vc20531Controls='typescript';}
   catch(_){/* Existing V19.3.9 controller remains available below. */}
  }
  if(!panel.dataset.vc1939Bound){panel.dataset.vc1939Bound='yes';panel.dataset.vc20531Controls='classic';panel.addEventListener('change',event=>{
   const x=event.target;if(x.matches('select[data-vc1939-filter]')){const s=panel._vc1939;if(!s)return;s.filters[x.dataset.vc1939Filter]=x.value;win.clearTimeout(panel._vc1939Timer);panel._vc1939Timer=win.setTimeout(()=>{if(panel._vc1939?.ctx)decorate(panel,panel._vc1939.ctx,'search')},0);}
   if(x.matches('[data-vc1939-preset]')){panel._vc1939.preset=x.value;}
  });panel.addEventListener('input',event=>{
   const x=event.target;if(!x.matches('input[data-vc1939-filter]'))return;const s=panel._vc1939;if(!s)return;s.filters[x.dataset.vc1939Filter]=x.value;
   win.clearTimeout(panel._vc1939Timer);panel._vc1939Timer=win.setTimeout(()=>{if(panel._vc1939?.ctx)decorate(panel,panel._vc1939.ctx,'search')},350);
  });panel.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b)return;const s=panel._vc1939;if(!s?.ctx)return;
   if(b.hasAttribute('data-vc1939-clear')){s.filters={status:'closed'};decorate(panel,s.ctx,'search');return;}
   if(b.hasAttribute('data-vc1939-export')){try{const source=toCSV(s.result),blob=new win.Blob([source],{type:'text/csv;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=panel.ownerDocument.createElement('a');a.href=url;a.download='volley-coach-rally-search-'+s.matchId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';panel.ownerDocument.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}catch(_){/* blocked download: source data unchanged */}return;}
   if(b.hasAttribute('data-vc1939-save')){const name=win.prompt?.('Nombre de la búsqueda (máximo 40 caracteres)');if(!val(name))return;try{const storage=win.localStorage,all=readPresets(storage).filter(x=>x.name!==val(name).slice(0,40));all.push({name:val(name).slice(0,40),filters:normFilters(s.filters)});storage?.setItem(STORAGE_KEY,JSON.stringify(all.slice(-15)));s.preset=val(name).slice(0,40);decorate(panel,s.ctx,'search');}catch(_){}return;}
   if(b.hasAttribute('data-vc1939-load')){const item=readPresets(win.localStorage).find(x=>x.name===s.preset);if(item){s.filters={...item.filters};decorate(panel,s.ctx,'search');}return;}
   if(b.hasAttribute('data-vc1939-delete')){try{win.localStorage?.setItem(STORAGE_KEY,JSON.stringify(readPresets(win.localStorage).filter(x=>x.name!==s.preset)));s.preset='';decorate(panel,s.ctx,'search');}catch(_){}return;}
  });}
 }
 return {VERSION,FILTERS,query,catalog,renderPanel,toCSV,normFilters,readPresets,decorate};
});

/* VC20717_SOURCE_END:190-vc1939-rally-search-pro.js */

/* VC20717_SOURCE_BEGIN:188-vc1937-analysis-main-rebuild.js */
/* Volley Coach V19.3.7 · Analysis Main Workspace Rebuild
 * Main entry to #scout-analysis: same scouting bridge, statistical model and video links.
 * Read-only presentation adapter. The original Analyst Studio, official exports,
 * worksheets, comparisons and opponent analysis remain mounted and accessible.
 */
(function(root,factory){
 'use strict';
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){root.VC_ANALYSIS_MAIN_1937=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.9',SKILLS={A:'Ataque',R:'Recepción',S:'Saque',E:'Distribución',B:'Bloqueo',D:'Defensa'};
 const TABS=[['overview','Resumen'],['rotations','Rotaciones'],['distribution','Colocador'],['attack','Ataque'],['reception','Recepción'],['serve','Saque'],['defense','Defensa'],['video','Vídeo y rallies'],['data','Datos y posesiones'],['search','Buscar rallies']];
 const $=(doc,id)=>doc.getElementById(id);
 const arr=v=>Array.isArray(v)?v:[];
 const txt=v=>String(v??'').trim();
 const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const zone=v=>{const m=txt(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?{n:Number(m[1]),q:m[2]||''}:null};
 const pct=(n,d)=>d?Math.round(n/d*1000)/10:null;
 const fmt=n=>n==null?'—':n.toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
 const effort=(rows)=>{const scored=arr(rows).filter(x=>['#','+','!','-','=','/'].includes(x.ev));const k=scored.filter(x=>x.ev==='#').length,e=scored.filter(x=>x.ev==='=').length,b=scored.filter(x=>x.ev==='/').length;return {count:rows.length,scored:scored.length,k,e,b,eff:pct(k-e-b,scored.length)};};
 const phaseFor=(r,team)=>!r.serving?'Sin saque':r.serving===team?'K2':'K1';
 function selectContext(win){
  const doc=win.document,sel=$ (doc,'vc157-match');const id=txt(sel?.value||$(doc,'scout-analysis-match')?.value);
  const bridges=[win.VC_SCOUT_REPORT_BRIDGE,win.VC_SCOUT_VIDEO_BRIDGE];
  let matches=[];
  for(const bridge of bridges){try{matches.push(...arr(bridge?.getMatches?.()));}catch(_){}}
  const found=matches.find(m=>String(m?.id)===id)||(!id?matches[0]:null);
  if(!found)return null;
  const team=$(doc,'vc157-team')?.value==='opponent'?'opponent':'ours',set=txt($(doc,'vc157-set')?.value),rotation=txt($(doc,'vc157-rotation')?.value),phase=txt($(doc,'vc157-phase')?.value);
  const match=phase?{...found,sets:arr(found.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===(team==='ours'?(phase==='K1'?'opponent':'ours'):(phase==='K1'?'ours':'opponent')))}))}:found;
  const model=win.VC_ANALYSIS_INTELLIGENCE_1614?.model;
  if(!model)return null;
  return {match:found,team,set,rotation,phase,data:model(match,win.VC_SCOUT_VIDEO_BRIDGE||win.VC_SCOUT_REPORT_BRIDGE,{team,set,rotation})};
 }
 function courtData(data,tab='attack',team='ours'){
  const skill=tab==='distribution'?'E':tab==='reception'?'R':tab==='serve'?'S':tab==='defense'?'D':'A';
  let rows=data.actions.filter(x=>x.skill===skill&&x.team===team),key=skill==='A'?'endZone':skill==='E'?'setTarget':skill==='S'?'endZone':skill==='R'?'contactZone':'contactZone';
  const values=rows.map(x=>({row:x,zone:zone(x.a?.[key]||(skill==='R'?x.a?.endZone:null))}));
  const coded=values.filter(x=>x.zone);const counts=new Map();
  for(const {zone:z} of coded){const val=counts.get(z.n)||{n:0,sub:{A:0,B:0,C:0,D:0}};val.n++;if(z.q)val.sub[z.q]++;counts.set(z.n,val)}
  const total=coded.length;
  return {skill,rows,values,coded:total,missing:rows.length-total,counts:[1,2,3,4,5,6].map(n=>({zone:n,n:counts.get(n)?.n||0,pct:pct(counts.get(n)?.n||0,total),sub:counts.get(n)?.sub||{A:0,B:0,C:0,D:0}}))};
 }
 function tableFor(ctx,tab){
  const data=ctx.data;
  if(tab==='overview'||tab==='rotations'||tab==='video'){
   const headers='<th>Rot.</th><th>Rallies</th><th>K1 Side-out</th><th>K2 Break</th><th>G-P</th><th>Jugadas</th>';
   const body=data.rotations.map(r=>`<tr><td><button class="vc1937-link" data-vc1937-rotation="${r.rotation}">R${r.rotation}</button></td><td>${r.rallies}</td><td>${fmt(r.k1.pct)}<small>${r.k1.w}/${r.k1.n}</small></td><td>${fmt(r.k2.pct)}<small>${r.k2.w}/${r.k2.n}</small></td><td>${2*r.won-r.rallies>0?'+':''}${2*r.won-r.rallies}</td><td><button class="vc1937-link" data-vc1937-rotation="${r.rotation}">Ver</button></td></tr>`).join('');
   return {title:'Rotaciones · K1/K2',subtitle:'Puntos ganados / oportunidades por rotación',headers,body};
  }
  if(tab==='distribution'){
   const groups=new Map();for(const x of data.pairs){const key=txt(x.target)||'Sin codificar';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}
   const body=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([k,list])=>{const s=effort(list.map(x=>x.attack).filter(Boolean));return `<tr><td>${esc(k)}</td><td>${list.length}</td><td>${fmt(pct(list.length,data.pairs.length))}</td><td>${s.count}</td><td>${fmt(s.eff)}</td></tr>`}).join('');
   return {title:'Distribución del colocador',subtitle:`${data.pairs.length} colocaciones · destino declarado`,headers:'<th>Destino / combinación</th><th>Coloc.</th><th>Uso</th><th>Ataques</th><th>EFF</th>',body};
  }
  const skill=({attack:'A',reception:'R',serve:'S',defense:'D'})[tab]||'A';
  const rows=data.actions.filter(x=>skill==='D'?['D','B'].includes(x.skill):x.skill===skill);
  const groups=new Map();for(const x of rows){const k=x.player||'Sin identificar';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
  const body=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([name,items])=>{const s=effort(items),pos=items.filter(x=>['#','+'].includes(x.ev)).length;return `<tr><td>${esc(name)}</td><td>${s.count}</td><td>${s.scored}</td><td>${skill==='A'?s.k:pos}</td><td>${s.e}</td><td>${skill==='A'?fmt(s.eff):fmt(pct(pos,s.scored))}</td></tr>`}).join('');
  return {title:(skill==='D'?'Defensa y bloqueo':SKILLS[skill])+' · por jugador',subtitle:'Acciones codificadas; sin valoración fuera del denominador',headers:`<th>Jugador</th><th>Acc.</th><th>Evaluadas</th><th>${skill==='A'?'Puntos':'Positivas'}</th><th>Errores</th><th>${skill==='A'?'EFF':'% positivo'}</th>`,body};
 }
 function courtHtml(model,focus){
  const nums=[4,3,2,5,6,1],max=Math.max(1,...model.counts.map(x=>x.n));
  const cards=nums.map(n=>{const c=model.counts.find(x=>x.zone===n),intensity=c.n/max;
   return `<button type="button" data-vc1937-zone="${n}" class="vc1937-zone${focus===n?' is-selected':''}" style="--heat:${(0.10+intensity*.60).toFixed(3)}" aria-pressed="${focus===n}" title="Zona ${n}; ${c.n} acciones con zona registrada"><b>Z${n}</b><strong>${c.n||'—'}</strong><small>${c.pct==null?'Sin datos':fmt(c.pct)}</small><span class="vc1937-subs" aria-label="A/B/C/D">${['C','B','D','A'].map(k=>`<em>${k}<sup>${c.sub[k]||''}</sup></em>`).join('')}</span></button>`}).join('');
  return `<div class="vc1937-court-caption">RED · CAMPO ANALIZADO</div><div class="vc1937-court">${cards}</div><div class="vc1937-court-legend"><span>${model.coded} zonas registradas</span><span>${model.missing} sin zona</span></div>`;
 }
 function makeOverview(ctx){const d=ctx.data,at=effort(d.attacks),recs=arr(d.receives).filter(a=>['#','+','!','-','/','='].includes(a.ev));const reception=fmt(pct(recs.filter(x=>['#','+'].includes(x.ev)).length,recs.length));return [
  ['K1 · Side-out',fmt(d.points.k1.pct),`${d.points.k1.w}/${d.points.k1.n} oportunidades`],
  ['K2 · Break',fmt(d.points.k2.pct),`${d.points.k2.w}/${d.points.k2.n} oportunidades`],
  ['Ataque · EFF',fmt(at.eff),`${at.scored}/${at.count} valorados`],
  ['Recepción +/#',reception,`${recs.length} valoradas`],
  ['Rallies válidos',String(d.points.rallies),`${d.actions.length} acciones`]
 ].map(([label,value,note])=>`<div class="vc1937-kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('')}
 function traceSvg(data){const list=data.timeline||[];if(!list.length)return '<p>Sin rallies cerrados.</p>';
  const sampled=list.length>400?list.filter((_,i)=>i%Math.ceil(list.length/400)===0||i===list.length-1):list;
  const min=Math.min(-2,...sampled.map(p=>p.diff)),max=Math.max(2,...sampled.map(p=>p.diff));
  const pts=sampled.map((x,i)=>`${(i/(sampled.length-1||1)*100).toFixed(2)},${(30-(x.diff-min)/(max-min||1)*28).toFixed(2)}`).join(' ');
  return `<svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-label="Evolución de diferencia de puntos en rallies cerrados"><line x1="0" y1="30" x2="100" y2="30" stroke="#dbe7f3" stroke-width=".5"/><polyline points="${pts}" fill="none" stroke="#2874ca" stroke-width="1.15" vector-effect="non-scaling-stroke"/></svg>`;
 }
 function build(doc){const root=doc.createElement('section');root.id='vc1937-pro';root.className='vc1937-pro';root.innerHTML=`<nav class="vc1937-tabs" aria-label="Análisis Pro">${TABS.map(([id,t])=>`<button type="button" data-vc1937-tab="${id}" aria-pressed="false">${t}</button>`).join('')}</nav><div class="vc1937-kpis"></div><div class="vc1937-timeline"><div><b>EVOLUCIÓN DE PUNTOS</b><span>Diferencia acumulada · rallies cerrados</span></div><div class="vc1937-graph"></div></div><div class="vc1937-columns"><section class="vc1937-left"><header><strong>ESTADÍSTICAS</strong><span>Tabla táctica principal</span></header><div class="vc1937-left-body"></div><div class="vc1937-details-hint">Selecciona una rotación para filtrar todo el análisis. Las tablas completas siguen disponibles en «Herramientas avanzadas».</div></section><section class="vc1937-center"><header><strong>PISTA TÁCTICA</strong><button data-vc1937-reset type="button">Todas las zonas</button></header><div class="vc1937-courtbody"></div><p class="vc1937-courtnote">A/B/C/D: A abajo derecha, B arriba derecha, C arriba izquierda, D abajo izquierda. Solo zonas codificadas, sin estimaciones.</p></section><aside class="vc1937-right"><header><strong>EVIDENCIA Y VÍDEO</strong><span class="vc1937-rally-count"></span></header><div class="vc1937-rallies" role="listbox" aria-label="Jugadas con los filtros aplicados"></div><div class="vc1937-videobox"><div class="vc1937-video-placeholder"><span>▶</span><strong>Revisión de jugada</strong><small>Reproductor original de Video Studio</small></div><div class="vc1937-rally-detail" aria-live="polite">Selecciona una jugada de la lista.</div><button class="vc1937-open-video" type="button" disabled>Abrir vídeo vinculado</button></div></aside></div><p class="vc1937-source">Solo lectura · Datos derivados del scouting y su registro de rallies. La grabación original no se modifica.</p>`;return root}
 function mount(win){const doc=win.document,view=$(doc,'scout-analysis');if(!view)return;
  let state={tab:'overview',zone:null,selectedRally:null,advanced:false};let attached=false,renderQueued=false,observer=null,matchObserver=null;
  function sync(){const studio=$(doc,'vc157-studio');if(!studio||!view.classList.contains('active')||view.classList.contains('vc1930-active'))return;
   if(!attached){attached=true;view.classList.add('vc1937-primary');const bar=doc.createElement('header');bar.id='vc1937-head';bar.className='vc1937-head';bar.innerHTML='<div><small>VOLLEY COACH · V19.3.9</small><h2>ANALYSIS PRO WORKSPACE</h2><p>Datos · rotaciones · pista · rallies · vídeo</p></div><div class="vc1937-actions"><button type="button" data-vc1937-action="rival">Preparación de rivales</button><button type="button" data-vc1937-action="official">PDF oficial</button><button type="button" data-vc1937-action="csv">Exportar CSV</button><button type="button" data-vc1937-action="advanced">Herramientas avanzadas</button><label class="vc1937-tool-label">Sección avanzada <select id="vc1937-tool"><option value="overview:">Resumen del partido</option><option value="players:builder">Hojas configurables</option><option value="players:sheet">Hoja oficial</option><option value="lab:rotations">Rotaciones K1/K2</option><option value="lab:distribution">Distribución del colocador</option><option value="lab:zones">Zonas y direcciones</option><option value="lab:sequences">Secuencias</option><option value="athletes:profile">Ficha individual</option><option value="comparisons:matches">Comparar partidos</option><option value="reports:">Informes Pro</option></select></label></div>';studio.querySelector('.vc157-toolbar')?.before(bar);
    const work=studio.querySelector('.vc157-work');if(work)work.prepend(build(doc));
    const sample=$(doc,'vc157-sample');if(sample){matchObserver=new win.MutationObserver(queue);matchObserver.observe(sample,{childList:true,characterData:true,subtree:true});}
    const switcher=$(doc,'vc157-tabs');if(switcher){const obs=new win.MutationObserver(()=>{if(!state.advanced)return;});obs.observe(switcher,{childList:true});}
   }
   view.dataset.vc1937Mode=state.advanced?'advanced':'pro';
   if(!state.advanced)paint();
  }
  function queue(){if(renderQueued)return;renderQueued=true;win.setTimeout(()=>{renderQueued=false;sync()},40)}
  function paint(){const panel=$(doc,'vc1937-pro');if(!panel)return;let ctx;
   try{ctx=selectContext(win);}catch(err){console.warn('Analysis Main V19.3.7: solo lectura',err);}
   if(!ctx){panel.querySelector('.vc1937-kpis').innerHTML='<p class="vc1937-empty">Selecciona un scouting para empezar el análisis.</p>';panel.querySelector('.vc1937-left-body').innerHTML='';panel.querySelector('.vc1937-courtbody').innerHTML='';panel.querySelector('.vc1937-rallies').innerHTML='';return}
   panel.querySelectorAll('[data-vc1937-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc1937Tab===state.tab)));
   if(state.tab!=='data'&&state.tab!=='search'){
    const leftHead=panel.querySelector('.vc1937-left>header strong');if(leftHead)leftHead.textContent='ESTADÍSTICAS';
    const centerHead=panel.querySelector('.vc1937-center>header strong');if(centerHead)centerHead.textContent='PISTA TÁCTICA';
    const reset=panel.querySelector('.vc1937-center>header [data-vc1937-reset]');if(reset)reset.hidden=false;
    const legacyHint=panel.querySelector('.vc1937-details-hint');if(legacyHint)legacyHint.hidden=false;
    const timeline=panel.querySelector('.vc1937-timeline');if(timeline)timeline.hidden=false;
   }
   panel.querySelector('.vc1937-kpis').innerHTML=makeOverview(ctx);panel.querySelector('.vc1937-graph').innerHTML=traceSvg(ctx.data);
   const t=tableFor(ctx,state.tab);panel.querySelector('.vc1937-left-body').innerHTML=`<h3>${esc(t.title)}</h3><p>${esc(t.subtitle)}</p><div class="vc1937-table-scroll"><table><thead><tr>${t.headers}</tr></thead><tbody>${t.body||`<tr><td colspan="7">Sin acciones codificadas para este filtro.</td></tr>`}</tbody></table></div>`;
   const cmap=courtData(ctx.data,state.tab,ctx.team);panel.querySelector('.vc1937-courtbody').innerHTML=courtHtml(cmap,state.zone);
   const selected=ctx.data.rallies.filter(r=>!state.zone||r.actions.some(a=>a.team===ctx.team&&a.skill===cmap.skill&&zone(a.a?.[cmap.skill==='E'?'setTarget':cmap.skill==='R'?'contactZone':cmap.skill==='D'?'contactZone':'endZone'])?.n===state.zone));
   const list=panel.querySelector('.vc1937-rallies');const rows=selected.slice(-150).reverse();
   list.innerHTML=rows.length?rows.map((r,i)=>`<button type="button" class="vc1937-rally${state.selectedRally===`${r.set}:${r.id}`?' is-selected':''}" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="${state.selectedRally===`${r.set}:${r.id}`}"><b>#${r.index} · Set ${r.set}</b><span>R${ctx.team==='ours'?r.rotation||'?':r.opponentRotation||'?'} · ${phaseFor(r,ctx.team)}</span><em class="${r.winning===ctx.team?'win':'lose'}">${!r.winning?'Sin cerrar':r.winning===ctx.team?'Ganado':'Perdido'}</em></button>`).join(''):'<p class="vc1937-empty">Sin rallies con estos filtros y zona.</p>';
   panel.querySelector('.vc1937-rally-count').textContent=`${selected.length} rallies`;
   panel._vc1937Ctx=ctx;panel._vc1937VisibleRallies=selected;
   const chosen=selected.find(r=>`${r.set}:${r.id}`===state.selectedRally)||selected[selected.length-1]||null;
   if(chosen){state.selectedRally=`${chosen.set}:${chosen.id}`;showRally(panel,ctx,chosen)}else{state.selectedRally=null;panel.querySelector('.vc1937-rally-detail').textContent='No hay jugadas en la selección.';panel.querySelector('.vc1937-open-video').disabled=true}
   win.VC_DATA_ENGINE_1938?.decorate?.(panel,ctx,state.tab);
   win.VC_RALLY_SEARCH_1939?.decorate?.(panel,ctx,state.tab);
   const current=list.querySelector(`[data-vc1937-rally="${win.CSS?.escape?.(state.selectedRally||'')||''}"]`);if(current){current.classList.add('is-selected');current.setAttribute('aria-selected','true')}
  }
  function showRally(panel,ctx,r){const actions=r.actions.filter(a=>a.team===ctx.team),playable=actions.filter(a=>a.video&&a.key);
   panel.querySelector('.vc1937-rally-detail').textContent=`Set ${r.set} · Rally ${r.index} · ${phaseFor(r,ctx.team)} · ${!r.winning?'Rally sin cerrar':r.winning===ctx.team?'Punto nuestro':'Punto rival'} · ${actions.length} acciones · ${playable.length} con vídeo`;
   panel.querySelector('.vc1937-open-video').disabled=!playable.length||!win.VC_VIDEO_ANALYTICS_1612?.openKeys;
   panel._vc1937Video={id:ctx.match.id,keys:playable.map(a=>a.key)};
  }
  view.addEventListener('click',event=>{const panel=$(doc,'vc1937-pro');const b=event.target.closest('button');if(!b||!view.contains(b))return;
   if(b.dataset.vc1937Action){event.preventDefault();const action=b.dataset.vc1937Action;if(action==='advanced'){state.advanced=!state.advanced;b.textContent=state.advanced?'Volver al Workspace':'Herramientas avanzadas';sync();return;}
    if(action==='rival'){$(doc,'vc1930-open')?.click();return}
    if(action==='official'){$(doc,'vc157-official')?.click();return}
    if(action==='csv'){$(doc,'vc157-csv')?.click();return}
   }
   if(b.dataset.vc1937Tab&&panel){state.tab=b.dataset.vc1937Tab;state.zone=null;state.selectedRally=null;paint();return}
   if(b.dataset.vc1937Rotation){const select=$(doc,'vc157-rotation');if(select){select.value=b.dataset.vc1937Rotation;select.dispatchEvent(new win.Event('change',{bubbles:true}));queue()}return}
   if(b.dataset.vc1937Zone){state.zone=state.zone===Number(b.dataset.vc1937Zone)?null:Number(b.dataset.vc1937Zone);state.selectedRally=null;paint();return}
   if(b.hasAttribute('data-vc1937-reset')){state.zone=null;state.selectedRally=null;paint();return}
   if(b.dataset.vc1937Rally&&panel){state.selectedRally=b.dataset.vc1937Rally;const ctx=panel._vc1937Ctx,r=arr(panel._vc1937VisibleRallies).find(r=>`${r.set}:${r.id}`===state.selectedRally);if(ctx&&r){panel.querySelectorAll('[data-vc1937-rally]').forEach(x=>{const a=x===b;x.classList.toggle('is-selected',a);x.setAttribute('aria-selected',String(a))});showRally(panel,ctx,r)}return}
   if(b.classList.contains('vc1937-open-video')&&panel){const ref=panel._vc1937Video;if(!ref?.keys?.length)return;try{win.VC_VIDEO_ANALYTICS_1612?.openKeys?.(ref.id,ref.keys);}catch(e){console.warn('Video vinculado V19.3.7',e)}return}
  });
  view.addEventListener('change',e=>{if(e.target.id==='vc1937-tool'){const [page,sub='']=e.target.value.split(':');const api=win.VC173_ANALYSIS_WORKSPACE;if(api?.selectPage){api.selectPage(page,sub);}else{$(doc,'vc157-tabs')?.querySelector(`[data-section="${page}"]`)?.click();if(sub)$(doc,'vc1620-subtabs')?.querySelector(`[data-subpage="${sub}"]`)?.click();}return}if(['vc157-match','vc157-team','vc157-set','vc157-rotation','vc157-phase'].includes(e.target.id)){state.zone=null;state.selectedRally=null;queue()}},true);
  const watcher=new win.MutationObserver(()=>{if(view.classList.contains('active'))queue();});watcher.observe(view,{attributes:true,attributeFilter:['class','data-vc157-mode']});
  if(view.classList.contains('active'))queue();
  const childObserver=new win.MutationObserver(()=>{if(!attached&&$(doc,'vc157-studio'))queue()});childObserver.observe(view,{childList:true,subtree:true});
  win.addEventListener('focus',()=>{if(view.classList.contains('active'))queue()});
  win.VC_ANALYSIS_MAIN_1937?.__setMounted?.(true);
 }
 let mounted=false;const __setMounted=x=>{mounted=x};
 return {VERSION,TABS,SKILLS,zone,pct,fmt,effort,phaseFor,courtData,tableFor,makeOverview,traceSvg,selectContext,mount,__setMounted,get mounted(){return mounted}};
});

/* VC20717_SOURCE_END:188-vc1937-analysis-main-rebuild.js */

/* VC20717_SOURCE_BEGIN:192-vc19311-professional-analysis-screens.js */
/* Volley Coach V19.3.11 · Professional Analysis Screens.
 * Read-only analytical surfaces: setter distribution, direction zones, and worksheets.
 * Scouting/Sync/REC/PDF remain the sole original data owners.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_SCREENS_19311=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.11.3',SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const PREF_KEY='vc19311:worksheet-layouts:v1';
 const DEFAULTS=[{name:'Eficiencia de ataque',formula:'100*(POINT-ERROR-BLOCKED)/EVAL',group:'player',skill:'A'},
  {name:'Recepción positiva',formula:'100*POSITIVE/EVAL',group:'player',skill:'R'},
  {name:'Puntos de saque',formula:'100*POINT/EVAL',group:'player',skill:'S'}];
 const VARS=['N','EVAL','POINT','HASH','PLUS','ERROR','BLOCKED','POSITIVE','NEGATIVE','NOT_RATED'];
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(n,d)=>d?Math.round(n/d*1000)/10:null;
 const num=x=>Number.isFinite(x)?x.toLocaleString('es-ES',{maximumFractionDigits:1}):'—';
 const percentage=x=>x==null?'—':num(x)+' %';
 const known=(x)=>x!==null&&x!==undefined&&val(x)!=='';
 const zoneOf=(c,kind,skill)=>{
  const f=c?.fields||{};
  if(kind==='origin')return f.startZone||(skill==='R'?f.contactZone:null);
  if(kind==='destination')return skill==='E'?f.setTarget:(f.endZone||(skill==='R'?f.contactZone:null));
  return null;
 };
 function ensureState(state){
  if(!state.vc19311)state.vc19311={dist:{setter:'',reception:'',tempo:'',attacker:'',target:'',combo:''},
   court:{skill:'A',kind:'destination',evaluation:'',player:'',zone:null,quad:'',path:'',expanded:false},
   ws:{skill:'A',group:'player',formula:DEFAULTS[0].formula,label:'Eficiencia de ataque',selected:'',focus:''}};
  return state.vc19311;
 }
 function optionList(values,current='',label='Todos'){
  const opts=[['',label],...values.map(x=>Array.isArray(x)?x:[x,x])];
  return opts.map(([id,name])=>`<option value="${esc(id)}"${val(id)===val(current)?' selected':''}>${esc(name)}</option>`).join('');
 }
 function filterLabel(name,key,opts,value){return `<label>${esc(name)}<select data-vc19311-filter="${esc(key)}">${optionList(opts,value)}</select></label>`;}
 function unique(items){return [...new Set(items.map(x=>val(x)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));}
 function teamRallies(base,keys){return arr(base.rallies).filter(r=>keys.has(r.key));}
 function evidence(rallies,title='RALLIES VINCULADOS'){
  const list=arr(rallies).slice(-120).reverse().map(r=>`<button class="vc19310-rally" type="button" data-vc19310-rally="${esc(r.key)}"><b>S${esc(r.set)} · #${esc(r.index)}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.serving==='ours'?'Saque propio':r.serving==='opponent'?'Saque rival':'Saque —'}</span></button>`).join('');
  return `<aside class="vc19310-panel vc19310-evidence"><div class="vc19310-panelhead"><strong>${esc(title)}</strong><span>${rallies.length} rallies</span></div><div class="vc19310-rallies">${list||'<p class="vc19310-note">No hay rallies que cumplan estos filtros.</p>'}</div><div class="vc19310-video-box"><div class="vc19310-screen"><strong>VIDEO STUDIO</strong><small>Selecciona el rally para abrir su vídeo vinculado</small></div><p data-vc19310-detail>Selecciona una jugada</p><button type="button" data-vc19310-command="play" disabled>Abrir vídeo del rally</button></div></aside>`;
 }
 function attackOutcome(chains){const a=chains.map(x=>x.attack).filter(Boolean),rated=a.filter(x=>x.evaluation),win=rated.filter(x=>x.evaluation==='#').length,err=rated.filter(x=>x.evaluation==='=').length,blocked=rated.filter(x=>x.evaluation==='/').length;
  return {attacks:a.length,rated:rated.length,win,err,blocked,eff:pct(win-err-blocked,rated.length)};
 }
 function matchChains(chains,f){return arr(chains).filter(c=>(!f.setter||c.setter?.player===f.setter)&&(!f.reception||c.reception?.evaluation===f.reception)
  &&(!f.tempo||val(c.tempo||c.attack?.fields?.attackTempo)===f.tempo)&&(!f.attacker||c.attack?.player===f.attacker)
  &&(!f.target||c.target?.code===f.target||(/^Z[1-9]$/.test(f.target)&&c.target?.zone===Number(f.target.slice(1))))&&(!f.combo||val(c.combo)===f.combo));}
 function distributionModel(projection,team,f){
  const chains=projection.base.chains.filter(c=>c.team===team),selected=matchChains(chains,f),coded=selected.filter(c=>c.target?.zone>=1&&c.target.zone<=9);
  const groups=new Map();
  for(const c of coded){const key=c.target.code,entry=groups.get(key)||{key,zone:c.target.zone,quadrant:c.target.quadrant||'',chains:[]};entry.chains.push(c);groups.set(key,entry);}
  const zones=Array.from({length:9},(_,i)=>({zone:i+1,chains:coded.filter(c=>c.target.zone===i+1)}));
  const perSetter=[...new Set(selected.map(c=>c.setter?.player||'Sin identificar'))].map(name=>({name,chains:selected.filter(c=>(c.setter?.player||'Sin identificar')===name)}));
  const keys=new Set(selected.map(c=>c.rallyKey));
  return {all:chains,selected,coded,unknown:selected.length-coded.length,zones,groups:[...groups.values()].sort((a,b)=>b.chains.length-a.chains.length),perSetter,keys,outcome:attackOutcome(selected)};
 }
 function rotationCells(base,team,selected){return Array.from({length:6},(_,i)=>{
  const n=i+1,rallies=base.rallies.filter(r=>(team==='ours'?r.ownRotation:r.rivalRotation)===n),keys=new Set(rallies.map(r=>r.key)),count=selected.filter(c=>keys.has(c.rallyKey)).length,
   k1=rallies.filter(r=>r.serving&&r.serving!==team),k2=rallies.filter(r=>r.serving===team);
  const ratio=rs=>rs.length?percentage(pct(rs.filter(r=>r.winner===team).length,rs.length)):'—';
  return `<button type="button" data-vc19310-rot="${n}"><strong>R${n}</strong><span>${count} colocaciones</span><small>K1 ${ratio(k1)} · K2 ${ratio(k2)}</small></button>`;
 }).join('');}
 const COURT_POS={4:[.18,.18],3:[.50,.18],2:[.82,.18],5:[.18,.50],6:[.50,.50],1:[.82,.50],7:[.18,.82],8:[.50,.82],9:[.82,.82]};
 const DIST_HUB=[.50,.88];
 function directionSvg(paths,options={}){
  const max=Math.max(1,...paths.map(x=>x.count));
  const mode=options.mode==='distribution'?'distribution':'court';
  const width=mode==='distribution'?700:900;
  const height=mode==='distribution'?430:640;
  const markerId='vc19311-arrow-'+mode;
  const visible=paths.slice(0,mode==='distribution'?6:12);
  const renderPath=(from,to,count,index)=>{
   const source=mode==='distribution'?DIST_HUB:(COURT_POS[from]||DIST_HUB);
   const target=COURT_POS[to];
   if(!source||!target)return '';
   const X=Math.round(source[0]*width),Y=Math.round(source[1]*height),x2=Math.round(target[0]*width),y2=Math.round(target[1]*height);
   const bend=index%2?-1:1;
   const curve=Math.min(90,25+index*8);
   const cx=Math.round((X+x2)/2 + bend*curve);
   const cy=Math.round((Y+y2)/2 - (mode==='distribution'?70:40));
   const active=options.activePath&&options.activePath===`${from}→${to}`;
   const primary=index===0||active;
   const stroke=primary?'#f08a37':'#2f6db0';
   const opacity=active?1:(primary?.92:.76);
   const sw=(mode==='distribution'?5.5:4)+(count/max)*(mode==='distribution'?5:4.5);
   return `<path d="M ${X} ${Y} Q ${cx} ${cy} ${x2} ${y2}" stroke="${stroke}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" opacity="${opacity}" fill="none" marker-end="url(#${markerId})"/>`;
  };
  return `<svg class="vc19311-direction-overlay ${mode==='distribution'?'is-distribution':'is-court'}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#2f6db0"/></marker><marker id="${markerId}-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#f08a37"/></marker></defs>${visible.map((x,i)=>{
    const from=mode==='distribution'?6:x.from;
    return renderPath(from,x.to,x.count,i).replace(`url(#${markerId})`,`url(#${i===0||(options.activePath&&options.activePath===`${from}→${x.to}`)?markerId+'-hot':markerId})`);
  }).join('')}</svg>`;
 }
 function distributionCourt(model){
  const totals=model.coded.length,zoneCounts=new Map(model.zones.map(x=>[x.zone,x.chains.length]));const top=Math.max(1,...zoneCounts.values());
  const pathways=model.zones.filter(z=>z.chains.length).map(z=>({from:6,to:z.zone,count:z.chains.length}));
  const topTargets=model.groups.slice(0,5).map((g,i)=>`<div class="vc19311-mini-stat ${i===0?'is-top':''}"><span>${esc(g.key||('Z'+g.zone))}</span><strong>${g.chains.length}</strong><small>${percentage(pct(g.chains.length,totals))}</small></div>`).join('');
  return `<div class="vc19311-dist-shell"><div class="vc19311-dist-court" role="group" aria-label="Distribución a zonas de colocación"><div class="vc19311-dist-label">RED · DISTRIBUCIÓN DE COLOCACIÓN</div><div class="vc19311-court-grid">${[4,3,2,5,6,1].map(z=>{
   const n=zoneCounts.get(z)||0;return `<button type="button" data-vc19311-dist-zone="Z${z}" class="vc19311-cell" style="--intensity:${(n/top*.52+.09).toFixed(2)}"><small>Z${z}</small><strong>${n||'—'}</strong><span>${percentage(pct(n,totals))}</span></button>`;
  }).join('')}</div><div class="vc19311-setter-hub"><span>SET</span><strong>Z6</strong></div>${directionSvg(pathways,{mode:'distribution'})}</div><div class="vc19311-dist-side"><div class="vc19311-side-head"><strong>Resumen visual</strong><span>${totals} destinos codificados</span></div><div class="vc19311-mini-grid">${topTargets||'<p class="vc19311-help">Sin destinos codificados.</p>'}</div><p class="vc19311-help">Las flechas muestran la frecuencia de colocación desde la zona de distribución hacia el destino final. No representan una trayectoria física real.</p></div></div>`;
 }
 function distributionView(ctx,projection,state){
  const f=ensureState(state).dist,base=projection.base,model=distributionModel(projection,ctx.team,f);
  const fields=`${filterLabel('Colocador','dist.setter',unique(model.all.map(c=>c.setter?.player)),f.setter)}${filterLabel('Recepción previa','dist.reception',['#','+','!','-','/','='],f.reception)}${filterLabel('Tempo','dist.tempo',unique(model.all.map(c=>c.tempo||c.attack?.fields?.attackTempo)),f.tempo)}${filterLabel('Atacante','dist.attacker',unique(model.all.map(c=>c.attack?.player)),f.attacker)}${filterLabel('Combinación','dist.combo',unique(model.all.map(c=>c.combo)),f.combo)}${filterLabel('Destino','dist.target',unique([...Array.from({length:9},(_,i)=>'Z'+(i+1)),...model.all.map(c=>c.target?.code)]),f.target)}`;
  const rows=model.zones.filter(z=>z.chains.length).map(z=>{const s=attackOutcome(z.chains);return `<tr><td><button type="button" data-vc19311-dist-zone="Z${z.zone}">Z${z.zone}</button></td><td>${z.chains.length}</td><td>${percentage(pct(z.chains.length,model.coded.length))}</td><td>${s.rated}/${s.attacks}</td><td>${percentage(s.eff)}</td></tr>`}).join('');
  const setterRows=model.perSetter.sort((a,b)=>b.chains.length-a.chains.length).map(x=>{const s=attackOutcome(x.chains);return `<tr><td>${esc(x.name)}</td><td>${x.chains.length}</td><td>${s.attacks}</td><td>${percentage(s.eff)}</td></tr>`}).join('');
  const rotationRow=rotationCells(base,ctx.team,model.selected),hasUnknown=!!model.unknown;
  const html=`<div class="vc19311-title"><div><small>SETTER DISTRIBUTION · PROFESSIONAL</small><h3>Distribución del colocador</h3><span>Datos vinculados a posesión y a los contactos reales</span></div><button type="button" data-vc19311-command="dist-clear">Reiniciar filtros</button></div><div class="vc19311-filterbar">${fields}</div>
  <div class="vc19310-rot-cards vc19311-rot-row">${rotationRow}</div><div class="vc19311-metrics"><div><small>Colocaciones filtradas</small><strong>${model.selected.length}</strong></div><div><small>Destinos conocidos</small><strong>${model.coded.length}</strong></div><div><small>Sin destino codificado</small><strong>${model.unknown}</strong></div><div><small>EFF ataque posterior</small><strong>${percentage(model.outcome.eff)}</strong><span>${model.outcome.rated} ataques valorados</span></div></div>
  <div class="vc19311-workspace vc19311-dist-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>DISTRIBUCIÓN POR ZONA</strong><span>${model.coded.length} destinos válidos</span></div>${distributionCourt(model)}</section><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>FRECUENCIAS Y EFICIENCIA</strong><span>Por destino / por colocador</span></div><h3>Zonas de colocación</h3><div class="vc19310-scroll"><table><thead><tr><th>Zona</th><th>E</th><th>Uso</th><th>A val.</th><th>EFF A</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sin destinos codificados</td></tr>'}</tbody></table></div><h3>Colocadores</h3><div class="vc19310-scroll"><table><thead><tr><th>Colocador</th><th>E</th><th>A</th><th>EFF A</th></tr></thead><tbody>${setterRows||'<tr><td colspan="4">Sin colocaciones</td></tr>'}</tbody></table></div><p class="vc19311-help">EFF A = (# − = − /) / ataques valorados. Se excluyen ataques sin valoración. ${hasUnknown?'Hay destinos sin codificar.':''}</p></section>${evidence(teamRallies(base,model.keys),'RALLIES DEL FILTRO')}</div>`;
  return {html,rallies:teamRallies(base,model.keys)};
 }
 function courtModel(projection,team,filters){
  const all=projection.base.contacts.filter(c=>c.team===team&&c.skill===filters.skill);
  const chosen=all.filter(c=>(!filters.evaluation||c.evaluation===filters.evaluation)&&(!filters.player||c.player===filters.player));
  const located=chosen.map(c=>({c,z:zoneOf(c,filters.kind,filters.skill)})).filter(x=>x.z?.zone>=1&&x.z.zone<=9),missing=chosen.length-located.length;
  const byZone=Array.from({length:9},(_,i)=>({zone:i+1,items:located.filter(x=>x.z.zone===i+1)}));
  const pathItems=chosen.map(c=>({c,from:c.fields?.startZone?.zone,to:c.fields?.endZone?.zone})).filter(x=>x.from>=1&&x.from<=9&&x.to>=1&&x.to<=9);
  const paths=new Map();for(const x of pathItems){const id=x.from+'→'+x.to,entry=paths.get(id)||{id,from:x.from,to:x.to,count:0,keys:new Set()};entry.count++;entry.keys.add(x.c.rallyKey);paths.set(id,entry);}
  const visible=located.filter(x=>(!filters.zone||x.z.zone===filters.zone)&&(!filters.quad||x.z.quadrant===filters.quad)
   &&(!filters.path||(filters.path===val(x.c.fields?.startZone?.zone)+'→'+val(x.c.fields?.endZone?.zone))));
  return {all,chosen,located,missing,byZone,paths:[...paths.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id)),visible,
   rallyKeys:new Set((filters.zone||filters.quad||filters.path?visible.map(x=>x.c):chosen).map(c=>c.rallyKey))};
 }
 const quadOrder=['C','B','D','A'];
 function courtCells(model,f){const len=f.expanded?9:6,zones=(f.expanded?[4,3,2,5,6,1,7,8,9]:[4,3,2,5,6,1]);
  const max=Math.max(1,...model.byZone.map(x=>x.items.length));
  const topZones=model.byZone.filter(z=>(f.expanded||z.zone<=6)&&z.items.length).sort((a,b)=>b.items.length-a.items.length).slice(0,4).map(z=>`<div class="vc19311-zone-pill"><strong>Z${z.zone}</strong><span>${z.items.length}</span><small>${percentage(pct(z.items.length,model.located.length))}</small></div>`).join('');
  return `<div class="vc19311-analysis-shell"><div class="vc19311-analysis-court"><div class="vc19311-court-top">${f.kind==='destination'?'DESTINO DE ACCIONES':'ORIGEN DE ACCIONES'} · RED / NET</div><div class="vc19311-court-grid ${len===9?'is-nine':''}">${zones.map(n=>{
   const z=model.byZone[n-1],active=f.zone===n,quads=quadOrder.map(q=>{const count=z.items.filter(x=>x.z.quadrant===q).length;return `<button type="button" data-vc19311-quadrant="${n}:${q}" class="${active&&f.quad===q?'is-active':''}" aria-label="Zona ${n}, subzona ${q}: ${count} acciones"><span>${q}</span><small>${count||'—'}</small></button>`;}).join('');
   return `<div class="vc19311-court-zone ${active?'is-selected':''}" style="--intensity:${(z.items.length/max*.52+.08).toFixed(2)}"><button type="button" class="vc19311-zone-action" data-vc19311-zone="${n}" aria-pressed="${active}"><strong>Z${n}</strong><b>${z.items.length||'—'}</b><small>${percentage(pct(z.items.length,model.located.length))}</small></button><div class="vc19311-quad-grid">${quads}</div></div>`;
  }).join('')}</div></div><aside class="vc19311-court-summary"><div class="vc19311-side-head"><strong>Lectura rápida</strong><span>${model.located.length} acciones con zona</span></div><div class="vc19311-mini-grid">${topZones||'<p class="vc19311-help">Sin zonas explícitas.</p>'}</div><p class="vc19311-help">A: abajo derecha · B: arriba derecha · C: arriba izquierda · D: abajo izquierda. ${f.expanded?'Z7–Z9 son zonas adicionales de codificación, no posiciones reglamentarias.':''}</p></aside></div>`;
 }
 function courtView(ctx,projection,state){const f=ensureState(state).court,base=projection.base,model=courtModel(projection,ctx.team,f),skillOptions=Object.entries(SKILLS).map(([k,x])=>[k,x]);
  const bar=`${filterLabel('Fundamento','court.skill',skillOptions,f.skill)}${filterLabel('Jugador','court.player',unique(base.contacts.filter(c=>c.team===ctx.team&&c.skill===f.skill).map(c=>c.player)),f.player)}${filterLabel('Valoración','court.evaluation',['#','+','!','-','/','='],f.evaluation)}${filterLabel('Mapa','court.kind',[['origin','Origen'],['destination','Destino']],f.kind)}<label>Visualización<select data-vc19311-filter="court.expanded"><option value="false"${!f.expanded?' selected':''}>6 zonas oficiales</option><option value="true"${f.expanded?' selected':''}>9 zonas ampliadas</option></select></label><button type="button" data-vc19311-command="court-clear">Quitar selección</button>`;
  const counts=model.byZone.filter(z=>f.expanded||z.zone<=6).map(z=>`<tr><td><button type="button" data-vc19311-zone="${z.zone}">Z${z.zone}</button></td><td>${z.items.length}</td><td>${percentage(pct(z.items.length,model.located.length))}</td><td>${z.items.filter(x=>x.z.quadrant).length}</td></tr>`).join('');
  const routeRows=model.paths.slice(0,20).map(x=>`<tr><td><button type="button" data-vc19311-path="${esc(x.id)}">Z${x.from} → Z${x.to}</button></td><td>${x.count}</td><td>${percentage(pct(x.count,model.pathItems||model.paths.reduce((n,x)=>n+x.count,0)))}</td></tr>`).join('');
  const keyset=model.rallyKeys;const rallies=teamRallies(base,keyset);
  const activeLabel=f.path?f.path:(f.zone?`Z${f.zone}${f.quad?` · ${f.quad}`:''}`:'Todas las zonas');
  const html=`<div class="vc19311-title"><div><small>COURT & DIRECTION ANALYSIS</small><h3>Mapas de zonas y trayectorias</h3><span>Selecciona una zona, subzona o dirección para revisar los rallies</span></div><button type="button" data-vc19311-command="court-clear">Limpiar mapa</button></div><div class="vc19311-filterbar">${bar}</div><div class="vc19311-metrics"><div><small>Acciones del filtro</small><strong>${model.chosen.length}</strong></div><div><small>Con zona explícita</small><strong>${model.located.length}</strong></div><div><small>Sin zona registrada</small><strong>${model.missing}</strong></div><div><small>Con origen y destino</small><strong>${model.paths.reduce((n,x)=>n+x.count,0)}</strong></div></div>
   <div class="vc19311-workspace vc19311-court-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>PISTA INTERACTIVA</strong><span>${activeLabel} · ${model.paths.length} direcciones</span></div>${courtCells(model,f)}<div class="vc19311-direction-bar"><strong>Mapa de trayectorias codificadas</strong><span>${model.paths.reduce((n,x)=>n+x.count,0)} pares origen–destino</span></div><div class="vc19311-direction-board">${directionSvg(model.paths,{mode:'court',activePath:f.path})}<small>Mapa de frecuencias entre origen y destino. Solo usa pares explícitamente codificados.</small></div></section><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>ANÁLISIS DE DESTINOS</strong><span>${rallies.length} rallies seleccionados</span></div><h3>Frecuencias por zona</h3><div class="vc19310-scroll"><table><thead><tr><th>Zona</th><th>N</th><th>Uso</th><th>Subzonas</th></tr></thead><tbody>${counts}</tbody></table></div><h3>Direcciones codificadas</h3><div class="vc19310-scroll"><table><thead><tr><th>Origen → destino</th><th>N</th><th>%</th></tr></thead><tbody>${routeRows||'<tr><td colspan="3">Sin pares explícitos</td></tr>'}</tbody></table></div><p class="vc19311-help">No se infieren zonas ausentes. Los porcentajes de zona utilizan solo acciones con zona conocida, y las direcciones solo los rallies que tienen origen y destino codificados.</p></section>${evidence(rallies,'EVIDENCIA DE ZONAS')}</div>`;
  return {html,rallies};
 }
 // Restricted arithmetic interpreter: no eval, no Function, no arbitrary identifiers.
 function compileFormula(text){
  const expression=val(text).toUpperCase();if(!expression||expression.length>128)throw Error('La fórmula debe contener entre 1 y 128 caracteres.');
  let pos=0,depth=0;const tokens=[];
  while(pos<expression.length){const rem=expression.slice(pos),ws=rem.match(/^\s+/);if(ws){pos+=ws[0].length;continue;}
   const m=rem.match(/^(\d+(?:\.\d+)?|[A-Z_][A-Z0-9_]*|[()+*/-])/);
   if(!m)throw Error('La fórmula contiene símbolos no permitidos.');tokens.push(m[0]);pos+=m[0].length;if(tokens.length>96)throw Error('Fórmula demasiado extensa.');
  }
  let at=0;
  function primary(){const t=tokens[at++];if(!t)throw Error('Fórmula incompleta.');
   if(t==='+'||t==='-'){const fn=primary();return m=>{const n=fn(m);return n==null?null:t==='-'?-n:n;};}
   if(t==='('){if(++depth>20)throw Error('Demasiados paréntesis.');const inner=expr();depth--;if(tokens[at++]!==')')throw Error('Falta cerrar un paréntesis.');return inner;}
   if(/^\d/.test(t)){const n=Number(t);return ()=>n;}
   if(!VARS.includes(t))throw Error('Variable no permitida: '+t+'.');
   return m=>{const n=Number(m[t]);return Number.isFinite(n)?n:0;};
  }
  function term(){let a=primary();while(tokens[at]==='*'||tokens[at]==='/'){
   const op=tokens[at++],b=primary(),left=a;a=m=>{const x=left(m),y=b(m);if(x==null||y==null||(op==='/'&&y===0))return null;const z=op==='*'?x*y:x/y;return Number.isFinite(z)?z:null;};
  }return a;}
  function expr(){let a=term();while(tokens[at]==='+'||tokens[at]==='-'){
   const op=tokens[at++],b=term(),left=a;a=m=>{const x=left(m),y=b(m);if(x==null||y==null)return null;const z=op==='+'?x+y:x-y;return Number.isFinite(z)?z:null;};
  }return a;}
  const fn=expr();if(at!==tokens.length)throw Error('La fórmula tiene operadores o paréntesis sobrantes.');
  return (metrics)=>{const n=fn(metrics);return n!=null&&Number.isFinite(n)?Math.round(n*100)/100:null;};
 }
 function worksheetMetrics(rows){const rated=arr(rows).filter(c=>c.evaluation);
  const count=code=>rated.filter(c=>c.evaluation===code).length;
  return {N:rows.length,EVAL:rated.length,POINT:count('#'),HASH:count('#'),PLUS:count('+'),ERROR:count('='),BLOCKED:count('/'),POSITIVE:count('#')+count('+'),NEGATIVE:count('-')+count('=')+count('/'),NOT_RATED:rows.length-rated.length};
 }
 function worksheetRows(projection,team,ws){
  const base=projection.base,contacts=base.contacts.filter(c=>c.team===team&&(!ws.skill||c.skill===ws.skill));
  const rMap=new Map(base.rallies.map(r=>[r.key,r]));
  const groupKey=c=>ws.group==='skill'?SKILLS[c.skill]||'Sin fundamento':ws.group==='rotation'?((rMap.get(c.rallyKey)?.[team==='ours'?'ownRotation':'rivalRotation'])?'R'+rMap.get(c.rallyKey)[team==='ours'?'ownRotation':'rivalRotation']:'Sin rotación'):c.player||'Sin jugador';
  const groups=new Map();for(const c of contacts){const k=groupKey(c);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);}
  let evaluator=null,error='';try{evaluator=compileFormula(ws.formula);}catch(e){error=e.message;}
  const rows=[...groups].map(([name,list])=>({name,contacts:list,metrics:worksheetMetrics(list),value:evaluator?evaluator(worksheetMetrics(list)):null})).sort((a,b)=>b.metrics.N-a.metrics.N||a.name.localeCompare(b.name,'es',{numeric:true}));
  return {contacts,rows,error,formula:ws.formula,valid:!!evaluator};
 }
 function sanitizePreset(x){if(!x||typeof x.name!=='string'||x.name.length>45)return null;
  const skill=val(x.skill).toUpperCase(),group=val(x.group),formula=val(x.formula);if(skill&&!SKILLS[skill])return null;if(!['player','skill','rotation'].includes(group))return null;
  try{compileFormula(formula);}catch(_){return null;}return {name:x.name.slice(0,45),skill,group,formula};
 }
 function safeStorage(win){try{return win?.localStorage||null;}catch(_){return null;}}
 function readPresets(storage){try{const parsed=JSON.parse(storage?.getItem(PREF_KEY)||'[]');return arr(parsed).slice(0,24).map(sanitizePreset).filter(Boolean);}catch(_){return []}}
 function csvEscape(value){let s=val(value);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function worksheetCSV(data,ws){const head=['Grupo','N','Evaluadas','Valoración #','Positivas #/+','Errores =','Bloqueos /','Fórmula '+ws.formula],rows=data.rows.map(r=>[r.name,r.metrics.N,r.metrics.EVAL,r.metrics.POINT,r.metrics.POSITIVE,r.metrics.ERROR,r.metrics.BLOCKED,r.value==null?'':r.value]);
  return '\ufeff'+[head,...rows].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 function worksheetsView(ctx,projection,state,win){
  const ws=ensureState(state).ws,base=projection.base,data=worksheetRows(projection,ctx.team,ws),all=base.contacts.filter(c=>c.team===ctx.team),presets=readPresets(safeStorage(win)),matching=new Set((ws.focus?data.rows.find(r=>r.name===ws.focus)?.contacts||[]:data.contacts).map(c=>c.rallyKey)),rallies=teamRallies(base,matching);
  const rows=data.rows.map(r=>{const m=r.metrics;return `<tr class="${ws.focus===r.name?'vc19311-selected':''}"><td><button type="button" data-vc19311-ws-focus="${esc(r.name)}">${esc(r.name)}</button></td><td>${m.N}</td><td>${m.EVAL}</td><td>${m.POINT}</td><td>${m.POSITIVE}</td><td>${m.ERROR}</td><td>${m.BLOCKED}</td><td>${num(r.value)}</td></tr>`;}).join('');
  const html=`<div class="vc19311-title"><div><small>CUSTOM WORKSHEETS · PROFESSIONAL</small><h3>Hojas estadísticas configurables</h3><span>Métricas y fórmulas locales calculadas sobre los contactos codificados</span></div><button type="button" data-vc19311-command="ws-export">Exportar hoja CSV</button></div><div class="vc19311-filterbar vc19311-ws-toolbar"><label>Fundamento<select data-vc19311-filter="ws.skill">${optionList(Object.entries(SKILLS).map(([k,n])=>[k,n]),ws.skill)}</select></label><label>Agrupar por<select data-vc19311-filter="ws.group">${optionList([['player','Jugador'],['skill','Fundamento'],['rotation','Rotación']],ws.group,'Agrupación')}</select></label><label>Fórmula personalizada<input type="text" id="vc19311-formula" maxlength="128" value="${esc(ws.formula)}" spellcheck="false" aria-label="Fórmula personalizada"/></label><button type="button" data-vc19311-command="ws-apply">Aplicar fórmula</button></div>
  <div class="vc19311-ws-presets"><label>Plantilla<select data-vc19311-filter="ws.selected"><option value="">Seleccionar plantilla</option>${[...DEFAULTS,...presets].map(p=>`<option value="${esc(p.name)}"${ws.selected===p.name?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button type="button" data-vc19311-command="ws-load">Aplicar plantilla</button><button type="button" data-vc19311-command="ws-save">Guardar hoja</button><button type="button" data-vc19311-command="ws-delete">Eliminar guardada</button><span>${presets.length} plantillas locales guardadas</span></div><p class="vc19311-ws-legend">Variables permitidas: <code>${VARS.join(' · ')}</code>. Usa + − * / y paréntesis; para porcentajes multiplica por 100. Ejemplo: <code>100*(POINT-ERROR-BLOCKED)/EVAL</code>. POINT y HASH cuentan valoraciones #, que no equivalen necesariamente a puntos en todos los fundamentos. La división entre cero produce «—».</p>
  ${data.error?`<p class="vc19311-error" role="alert">${esc(data.error)}</p>`:''}<div class="vc19311-metrics"><div><small>Contactos filtrados</small><strong>${data.contacts.length}</strong></div><div><small>Grupos</small><strong>${data.rows.length}</strong></div><div><small>Evaluadas</small><strong>${data.contacts.filter(c=>c.evaluation).length}</strong></div><div><small>Sin valoración</small><strong>${data.contacts.filter(c=>!c.evaluation).length}</strong></div></div><div class="vc19311-workspace vc19311-ws-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>HOJA PERSONALIZADA</strong><span>${esc(ws.formula)} · ${data.rows.length} filas</span></div><div class="vc19310-scroll"><table><thead><tr><th>Grupo</th><th>N</th><th>Eval.</th><th>#</th><th>#+</th><th>=</th><th>/</th><th>Fórmula</th></tr></thead><tbody>${rows||'<tr><td colspan="8">No hay contactos para estos filtros</td></tr>'}</tbody></table></div><p class="vc19311-help">Los resultados de la columna Fórmula son valores numéricos. Usa «100*» en la fórmula si deseas un porcentaje. Solo se incluyen contactos registrados, sin completar datos ausentes.</p><div class="vc19310-work-buttons"><button type="button" data-vc19310-legacy-page="players:builder">Hojas anteriores</button><button type="button" data-vc19310-legacy-page="players:sheet">Hoja oficial</button><button type="button" data-vc19310-legacy-page="reports:">Informes Pro</button></div></section>${evidence(rallies,ws.focus?'RALLIES · '+ws.focus:'EVIDENCIA DE LA HOJA')}</div>`;
  return {html,rallies};
 }
 function render({space,ctx,projection,state,win}){
  if(space==='distribution')return distributionView(ctx,projection,state);
  if(space==='court')return courtView(ctx,projection,state);
  if(space==='worksheets')return worksheetsView(ctx,projection,state,win);
  return null;
 }
 function downloadCSV(win,filename,csv){if(!win?.Blob||!win.URL?.createObjectURL)return false;const doc=win.document,blob=new win.Blob([csv],{type:'text/csv;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=filename;doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),2000);return true;}
 function handleClick({button,state,node,ctx,projection,win,status}){
  const cmd=button.dataset.vc19311Command,zone=button.dataset.vc19311DistZone,area=button.dataset.vc19311Zone,quad=button.dataset.vc19311Quadrant,path=button.dataset.vc19311Path,focus=button.dataset.vc19311WsFocus;
  if(!cmd&&zone===undefined&&area===undefined&&quad===undefined&&path===undefined&&focus===undefined)return {handled:false};
  const f=ensureState(state);
  if(zone!==undefined){f.dist.target=f.dist.target===zone?'':zone;return {handled:true,repaint:true};}
  if(area!==undefined){f.court.zone=f.court.zone===Number(area)?null:Number(area);f.court.quad='';f.court.path='';return {handled:true,repaint:true};}
  if(quad!==undefined){const [z,q]=quad.split(':');if(f.court.zone===Number(z)&&f.court.quad===q){f.court.zone=null;f.court.quad='';}else{f.court.zone=Number(z);f.court.quad=q;}f.court.path='';return {handled:true,repaint:true};}
  if(path!==undefined){f.court.path=f.court.path===path?'':path;f.court.zone=null;f.court.quad='';return {handled:true,repaint:true};}
  if(focus!==undefined){f.ws.focus=f.ws.focus===focus?'':focus;return {handled:true,repaint:true};}
  if(cmd==='dist-clear'){f.dist={setter:'',reception:'',tempo:'',attacker:'',target:'',combo:''};return {handled:true,repaint:true};}
  if(cmd==='court-clear'){f.court.zone=null;f.court.quad='';f.court.path='';return {handled:true,repaint:true};}
  if(cmd==='ws-apply'){f.ws.formula=val(node.querySelector('#vc19311-formula')?.value).slice(0,128);return {handled:true,repaint:true};}
  if(cmd==='ws-export'){const data=worksheetRows(projection,ctx.team,f.ws);if(!data.valid){status?.(data.error);return {handled:true};}
   const ok=downloadCSV(win,'volley-coach-hoja-v19311.csv',worksheetCSV(data,f.ws));status?.(ok?'Hoja descargada en CSV.':'Exportación no disponible.');return {handled:true};}
  if(cmd==='ws-save'){
   const name=val(win.prompt?.('Nombre de la hoja (máx. 45 caracteres)')).slice(0,45);if(!name)return {handled:true};
   const draft=sanitizePreset({name,skill:f.ws.skill,group:f.ws.group,formula:val(node.querySelector('#vc19311-formula')?.value||f.ws.formula)});
   if(!draft){status?.('La fórmula o los campos de la hoja no son válidos.');return {handled:true};}
   try{const store=safeStorage(win);if(!store)throw Error('No hay almacenamiento local');const presets=readPresets(store).filter(p=>p.name!==name);presets.push(draft);store.setItem(PREF_KEY,JSON.stringify(presets.slice(-24)));f.ws.selected=name;f.ws.formula=draft.formula;status?.('Hoja guardada en este dispositivo.');return {handled:true,repaint:true};}catch(_){status?.('No se pudo guardar esta hoja.');return {handled:true};}
  }
  if(cmd==='ws-load'){const chosen=[...DEFAULTS,...readPresets(safeStorage(win))].find(p=>p.name===f.ws.selected);if(chosen){f.ws.skill=chosen.skill;f.ws.group=chosen.group;f.ws.formula=chosen.formula;f.ws.focus='';return {handled:true,repaint:true};}return {handled:true};}
  if(cmd==='ws-delete'){try{const store=safeStorage(win);if(!store)throw Error('No hay almacenamiento local');store.setItem(PREF_KEY,JSON.stringify(readPresets(store).filter(p=>p.name!==f.ws.selected)));f.ws.selected='';status?.('Plantilla local eliminada.');return {handled:true,repaint:true};}catch(_){status?.('No se pudo eliminar la plantilla.');return {handled:true};}}
  return {handled:false};
 }
 function handleChange({target,state}){
  const key=target?.dataset?.vc19311Filter;if(!key)return false;
  const [section,field]=key.split('.'),s=ensureState(state);if(!s[section]||!(field in s[section]))return false;
  s[section][field]=field==='zone'?Number(target.value):(field==='expanded'?target.value==='true':target.value);
  if(section==='court'&&field!=='expanded'){s.court.zone=null;s.court.quad='';s.court.path='';}
  if(section==='ws'&&field!=='selected')s.ws.focus='';
  return true;
 }
 return {VERSION,PREF_KEY,SKILLS,VARS,DEFAULTS,ensureState,compileFormula,worksheetMetrics,worksheetRows,worksheetCSV,readPresets,sanitizePreset,csvEscape,
  matchChains,distributionModel,courtModel,distributionView,courtView,worksheetsView,render,handleClick,handleChange};
});

/* VC20717_SOURCE_END:192-vc19311-professional-analysis-screens.js */

/* VC20717_SOURCE_BEGIN:193-vc19312-video-scoreboard.js */
/* Volley Coach V19.3.14 · Historical scoreboard for Video Review and verified Live Delay.
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
 const VERSION='19.3.14',PREF_KEY='vc19312:score-overlay:v1';
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
 /**
  * A Live Delay timestamp is usable only when the running capture has not
  * restarted, its media timeline is continuous, a matching active scouting
  * session has been timestamped close to the capture start, and the rally
  * explicitly carries both bounds + an internally consistent scout clock.
  * No extrapolation beyond the rally, or through an MSE discontinuity.
  */
 function delaySnapshot(match,mediaSeconds,diagnostics,reviewTimeline){
  const ms=number(mediaSeconds),diag=diagnostics||{},range=reviewTimeline||{};
  if(ms==null||ms<0||diag.running!==true||diag.context!=='scouting'||diag.captureRestarts>0||diag.latestRangeDisconnected===true||range.available!==true)return null;
  const captured=number(diag.captureStartEpochMs),sessionId=str(match?.liveVideo?.currentSessionId);
  if(captured==null||captured<=0||!sessionId)return null;
  const session=arr(match?.liveVideo?.sessions).find(s=>str(s.id)===sessionId);
  const started=Date.parse(session?.startedAt||'');
  if(!Number.isFinite(started)||Math.abs(started-captured)>4500)return null;
  const sessionMs=number(session?.scoutMsAtStart);
  if(sessionMs==null)return null;
  const point=range.current==null?ms:number(range.current);
  if(point==null||Math.abs(point-ms)>0.2)return null;
  for(const set of arr(match?.sets)){
   const setNo=number(set?.number);if(setNo==null)continue;
   for(const [i,r] of arr(set?.rallies).entries()){
    if(str(r?.liveVideoSessionId)!==sessionId)continue;
    const a=number(r?.liveVideoStart),b=number(r?.liveVideoEnd);
    const startMs=number(r?.scoutStartMs),endMs=number(r?.scoutEndMs);
    if(a==null||b==null||startMs==null||endMs==null||b<=a||endMs<startMs)continue;
    // The recorded timestamps must agree with the active scouting session.
    if(Math.abs(a-(startMs-sessionMs)/1000)>1.25||Math.abs(b-(endMs-sessionMs)/1000)>1.25)continue;
    // The capture clock and scouting session agree only at sub-few-second
    // granularity. Exclude both ends of the rally, where point transitions
    // may otherwise be ambiguous.
    if(point<a+0.75||point>=b-0.75)continue;
    const snap=snapshot(r,setNo,i+1,'before');
    if(hasScore(snap))return {...snap,source:'live-delay-verified'};
   }
  }
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
   if(liveActive){
    const badge=$('v117-review-stream-badge');
    const isDelay=badge&&!badge.classList.contains('hidden')&&/^DELAY\b/i.test(badge.textContent||'');
    if(!isDelay){overlay.hidden=true;if(label)label.textContent='LIVE · el marcador histórico solo corresponde a la revisión';return;}
    const diag=win.liveDelayDiagnostics?.(),range=win.liveDelayGetReviewTimeline?.();
    const snap=delaySnapshot(match,range?.current,diag,range);
    if(!snap){overlay.hidden=true;if(label)label.textContent='DELAY · sin correspondencia temporal verificada de este rally';return;}
    overlay.hidden=false;
    const key=[match.id,'delay',snap.set,snap.rally,snap.scores.ours,snap.scores.opponent,snap.serving].join(':');
    if(state.lastScore!==key){overlay.innerHTML=scoreMarkup(snap);state.lastScore=key;}
    if(label)label.textContent=`DELAY verificado · Set ${snap.set} · Rally ${snap.rally}`;
    return;
   }
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
 return {VERSION,PREF_KEY,score,snapshot,sourceTime,buildTimeline,atVideoTime,delaySnapshot,scoreMarkup,renderAnalysis,updatePreview,openRally,mount};
});

/* VC20717_SOURCE_END:193-vc19312-video-scoreboard.js */
