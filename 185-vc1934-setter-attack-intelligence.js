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
