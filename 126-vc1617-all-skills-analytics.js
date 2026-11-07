/* Volley Coach V16.1.7 · All Skills Tactical Analytics
   READ-ONLY: uses the canonical V16.1.4 extracted/filtered action rows.
   No scoring, Supabase, PDF, CSV or match-data writes.
*/
(()=>{
 'use strict';
 if(window.VC_ALL_SKILLS_1617)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arr=v=>Array.isArray(v)?v:[];
 const filled=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
 const text=v=>filled(v)?String(v).trim():'Sin codificar';
 const pct=(n,d)=>d?Math.round(n*1000/d)/10:null;
 const fmt=v=>v===null?'—':`${Number(v).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const zone=v=>{const m=String(v??'').toUpperCase().trim().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:'Sin codificar';};
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const skillOrder=['S','R','E','A','B','D','F','C'];
 const SKILL_GROUPS={
  S:[['player','Jugador'],['serveType','Tipo de saque'],['startZone','Zona de origen'],['endZone','Zona de destino'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  R:[['player','Receptor'],['receivedServeType','Saque recibido'],['contactZone','Zona de contacto'],['skillSubtype','Técnica de recepción'],['serveOrigin','Origen del saque rival'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  E:[['player','Colocador'],['setTempo','Tempo de colocación'],['setTarget','Destino de colocación'],['setterCall','Setter call'],['dvSetType','Tipo colocación'],['skillSubtype','Gesto'],['attacker','Atacante posterior'],['receptionQuality','Calidad de recepción'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  A:[['player','Atacante'],['attackTempo','Tempo de ataque'],['attackCombo','Combinación'],['attackDirection','Dirección'],['startZone','Zona de origen'],['endZone','Zona de destino'],['endCone','Cono destino'],['blockers','N.º bloqueadores'],['attackCode','Attack code DV'],['setter','Colocador anterior'],['receptionQuality','Calidad de recepción'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  B:[['player','Bloqueador'],['contactZone','Zona de bloqueo'],['blockers','N.º bloqueadores'],['blockTargetNumber','Atacante objetivo'],['skillSubtype','Tipo de bloqueo'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  D:[['player','Defensor'],['contactZone','Contacto'],['skillSubtype','Tipo de defensa'],['rotation','Rotación'],['phase','Complejo K1/K2']],
  F:[['player','Jugador'],['startZone','Origen'],['endZone','Destino'],['rotation','Rotación']],
  C:[['player','Jugador'],['contactZone','Zona'],['rotation','Rotación']]
 };
 const evalKeys=['#','+','!','-','/','='];
 function phase(row,target){
  if(!row?.r?.serving)return 'Saque inicial no codificado';
  return row.r.serving===target?'K2 · Saque':'K1 · Recepción';
 }
 function findPair(row,bySet,byAttack){return row.skill==='E'?bySet.get(row):row.skill==='A'?byAttack.get(row):null;}
 function field(row,k,target,bySet,byAttack){
  const a=row.a||{},pair=findPair(row,bySet,byAttack);
  if(k==='player')return text(row.player);
  if(k==='rotation')return row.rotation?`R${row.rotation}`:'Sin codificar';
  if(k==='phase')return phase(row,target);
  if(k==='attacker')return text(pair?.attack?.player);
  if(k==='setter')return text(pair?.set?.player);
  if(k==='receptionQuality'){
   const evalCode=pair?.recEval;
   return filled(evalCode)?String(evalCode):'Sin recepción enlazada';
  }
  if(k==='serveOrigin'){
   const r=arr(row.r?.actions);
   for(let i=row.index-1;i>=0;i--){
    if(r[i]?.team===row.team)continue;
    if(r[i]?.skill==='S')return zone(r[i].a?.startZone);
   }
   return 'Sin saque enlazado';
  }
  if(['startZone','endZone','contactZone'].includes(k))return zone(a[k]||(k==='contactZone'?a.endZone:''));
  if(k==='blockers'&&filled(a.blockers))return `${a.blockers} bloqueador(es)`;
  return text(a[k]);
 }
 function groupStats(rows, skill, target){
  let ratings=Object.fromEntries(evalKeys.map(v=>[v,0]));
  let won=new Set(),allR=new Set();
  for(const a of rows){
   if(Object.hasOwn(ratings,a.ev))ratings[a.ev]++;
   const key=`${a.set}/${a.r?.id??a.r?.index}`;
   if(a.r?.winning){allR.add(key);if(a.r.winning===target)won.add(key)}
  }
  const n=rows.length;
  return {n,ratings,terminal:ratings['#'],errors:ratings['='],blocked:skill==='A'?ratings['/']:0,
   positive:ratings['#']+ratings['+'],positivePct:pct(ratings['#']+ratings['+'],n),
   killPct:skill==='A'?pct(ratings['#'],n):null,
   efficiency:skill==='A'?pct(ratings['#']-ratings['=']-ratings['/'],n):null,
   rallies:allR.size,wonRallies:won.size,wonRallyPct:pct(won.size,allR.size)};
 }
 function buildReport(data,skill='A',dimension='player',player=''){
  const validSkill=skillOrder.includes(skill)?skill:'A';
  const options=SKILL_GROUPS[validSkill]||SKILL_GROUPS.A;
  const dim=options.some(([x])=>x===dimension)?dimension:options[0][0];
  const target=data?.target==='opponent'?'opponent':'ours';
  const pairs=arr(data?.pairs),bySet=new Map(),byAttack=new Map();
  for(const p of pairs){
   if(p.set)bySet.set(p.set,p);
   if(p.attack&&!byAttack.has(p.attack))byAttack.set(p.attack,p);
  }
  const all=arr(data?.actions).filter(r=>r.skill===validSkill);
  const selected=player?all.filter(r=>String(r.player)===player):all;
  const groups=new Map();
  for(const r of selected){
   const value=field(r,dim,target,bySet,byAttack);
   if(!groups.has(value))groups.set(value,[]);
   groups.get(value).push(r);
  }
  const distributions=[...groups.entries()].map(([key,rows])=>({key,rows,stats:groupStats(rows,validSkill,target)}))
   .sort((a,b)=>b.stats.n-a.stats.n||a.key.localeCompare(b.key,'es'));
  const quality=options.map(([k,label])=>({key:k,label,complete:selected.filter(r=>{
    const v=field(r,k,target,bySet,byAttack);
    return v!=='Sin codificar'&&!v.startsWith('Sin ')&&!v.startsWith('Saque inicial no');
   }).length,total:selected.length}));
  const paired=validSkill==='E'?selected.filter(r=>bySet.get(r)?.attack):validSkill==='A'?selected.filter(r=>byAttack.get(r)?.set):[];
  const linkedAttacks=validSkill==='E'?paired.map(r=>bySet.get(r).attack):[];
  return {skill:validSkill,dimension:dim,options,target,rows:selected,allRows:all,groups:distributions,
   players:[...new Set(all.map(r=>String(r.player)))].sort((a,b)=>a.localeCompare(b,'es')),
   totals:groupStats(selected,validSkill,target),quality,
   linked:{n:paired.length,total:selected.length,attacks:linkedAttacks,attackStats:groupStats(linkedAttacks,'A',target)},
   // A link is an observed adjacent sequence within a possession, not proof of causality.
   links:paired.map(r=>({r,set:validSkill==='A'?byAttack.get(r)?.set:r,attack:validSkill==='E'?bySet.get(r)?.attack:r}))};
 }
 function makeTable(headers,rows){return `<div class="vc171-tablewrap"><table class="vc171-table"><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="vc171-empty">Sin acciones codificadas con estos filtros.</td></tr>`}</tbody></table></div>`;}
 function pick(rows,label,tools){return tools.pickButton(label,rows.map(r=>r.key),'Evidencia · '+label,'vc171-pick');}
 function groupTable(report,tools){
  const isAtk=report.skill==='A',isR=report.skill==='R',isSetter=report.skill==='E';
  const head=['Categoría','Acc.','#','+','!','−','/','=','% #/+'];
  if(isAtk)head.push('Kill %','EFF %');
  head.push('Rallies ganados*','Acciones');
  const body=report.groups.map(g=>{
   const s=g.stats;
   return `<tr><td><b>${esc(g.key)}</b></td><td>${s.n}</td>${evalKeys.map(k=>`<td>${s.ratings[k]||0}</td>`).join('')}
    <td>${fmt(s.positivePct)}</td>${isAtk?`<td>${fmt(s.killPct)}</td><td>${fmt(s.efficiency)}</td>`:''}
    <td>${s.wonRallies}/${s.rallies} <small>(${fmt(s.wonRallyPct)})</small></td><td>${pick(g.rows,'▶ Ver',tools)}</td></tr>`;
  }).join('');
  return makeTable(head,body);
 }
 function qualityTable(report){
  return `<div class="vc171-coverage">${report.quality.map(x=>`<div class="vc171-coverage-row"><span>${esc(x.label)}</span><div class="vc171-track"><i style="width:${x.total?x.complete/x.total*100:0}%"></i></div><b>${x.complete}/${x.total}</b></div>`).join('')}</div>`;
 }
 function sequenceTable(report,tools){
  const linked=report.links.slice(0,130);
  const rows=linked.map(x=>{
   const a=x.r,p=x.set,t=x.attack;
   return `<tr><td>${esc(a.player)}</td><td>${esc(p?.player||'—')}</td><td>${esc(t?.player||'—')}</td><td>${esc(p?.a?.setTempo||'—')}</td><td>${esc(p?.a?.setTarget||'—')}</td><td>${esc(t?.ev||'—')}</td><td>${pick([a,...(p&&p!==a?[p]:[]),...(t&&t!==a?[t]:[])],'▶',tools)}</td></tr>`;
  }).join('');
  return linked.length?makeTable(['Jugador base','Colocador','Atacante','Tempo E','Destino E','Eval. ataque','Vídeo'],rows):'<p class="vc171-help">No hay secuencias de colocación y ataque vinculadas para esta selección.</p>';
 }
 function detailTable(report,tools){
  const rows=report.rows.slice(0,125).map(x=>{
   const a=x.a;
   const detail=report.skill==='E'?`Tempo ${text(a.setTempo)} · ${text(a.setTarget)} · Call ${text(a.setterCall)}`:
    report.skill==='A'?`Tempo ${text(a.attackTempo)} · ${text(a.attackCombo)} · ${text(a.attackDirection)} · ${zone(a.endZone)}`:
    report.skill==='S'?`Tipo ${text(a.serveType)} · ${zone(a.startZone)} → ${zone(a.endZone)}`:
    report.skill==='R'?`Saque ${text(a.receivedServeType)} · ${zone(a.contactZone||a.endZone)}`:
    report.skill==='B'?`Objetivo ${text(a.blockTargetNumber)} · ${text(a.blockers)} bloqueadores`:
    `${zone(a.contactZone||a.endZone)} · ${text(a.skillSubtype)}`;
   return `<tr><td>${x.set}</td><td>${x.r?.index||'—'}</td><td>${esc(x.player)}</td><td><code>${esc(x.code)}</code></td><td>${esc(x.ev||'—')}</td><td>${esc(detail)}</td><td>${x.video?'Sí':'—'}</td><td>${pick([x],'▶',tools)}</td></tr>`;
  }).join('');
  return makeTable(['Set','Rally','Jugador','Código','Eval.','Contexto registrado','Vídeo','Acción'],rows)+
   (report.rows.length>125?'<p class="vc171-help">Solo se muestran las primeras 125 acciones. Los desgloses y totales utilizan todas las acciones del filtro.</p>':'');
 }
 function render(data,options={},tools){
  if(!tools?.pickButton)throw new Error('Inspector de vídeo no disponible');
  const st=Object.assign({skill:'A',dimension:'player',player:''},options);
  const report=buildReport(data,st.skill,st.dimension,st.player);
  const names={S:'Aces # / errores =',R:'Recepción #/+ sobre intentos',E:'Colocaciones codificadas',A:'Ataques # / errores / bloqueos',B:'Bloqueos punto #',D:'Defensas codificadas',F:'Freeballs registradas',C:'Coberturas registradas'};
  const t=report.totals,s=report.skill;
  const stats=s==='A'?[['Ataques',t.n],['Kill #',t.terminal],['Errores + bloqueados',t.errors+t.blocked],['EFF',fmt(t.efficiency)]]:
   s==='R'?[['Recepciones',t.n],['Positivas #/+',t.positive],['Perfectas #',t.terminal],['Positivas',fmt(t.positivePct)]]:
   s==='E'?[['Colocaciones',t.n],['Con ataque enlazado',report.linked.n],['Ataques enlazados #',report.linked.attackStats.terminal],['EFF ataques enlazados',fmt(report.linked.attackStats.efficiency)]]:
   s==='S'?[['Saques',t.n],['Aces #',t.terminal],['Errores =',t.errors],['Eval. #/+',fmt(t.positivePct)]]:
   s==='B'?[['Bloqueos',t.n],['Puntos #',t.terminal],['Errores =',t.errors],['Eval. #/+',fmt(t.positivePct)]]:
   [['Acciones',t.n],['Eval. #',t.terminal],['Eval. +',t.ratings['+']],['Eval. #/+',fmt(t.positivePct)]];
  const details=report.rows.length?`<div class="vc171-panels"><section class="vc171-card"><h4>Desglose por ${esc(report.options.find(o=>o[0]===report.dimension)?.[1]||report.dimension)}</h4>${groupTable(report,tools)}</section><section class="vc171-card"><h4>Calidad y profundidad de codificación</h4>${qualityTable(report)}</section></div>`:'<div class="vc171-card"><p>No hay acciones de este fundamento en el partido y filtros seleccionados. No se muestran porcentajes sin muestra.</p></div>';
  return `<div id="vc171-root" class="vc171-root">
    <div class="vc171-title"><div><span>ANÁLISIS TÁCTICO COMPLETO</span><h3>Fundamentos y contexto · ${esc(SKILLS[s])}</h3><p>Desgloses sobre acciones reales. Valores ausentes como «Sin codificar»; sin estimaciones automáticas.</p></div><span class="vc171-tag">${report.rows.length} acciones</span></div>
    <div class="vc171-skillbar" role="tablist" aria-label="Fundamentos">
      ${skillOrder.map(k=>`<button type="button" role="tab" data-vc171-skill="${k}" aria-selected="${s===k}">${esc(SKILLS[k])}</button>`).join('')}
    </div>
    <div class="vc171-filters"><label>Desglosar por<select id="vc171-dimension">${report.options.map(([k,v])=>`<option value="${k}" ${report.dimension===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
    <label>Jugador<select id="vc171-player"><option value="">Todos los jugadores</option>${report.players.map(p=>`<option value="${esc(p)}" ${report.rows.length&&st.player===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label>
    <div class="vc171-context">Filtros principales: <b>${esc(data?.target==='opponent'?'Rival':'Nuestro equipo')}</b> · ${data?.points?.rallies||0} rallies cerrados</div></div>
    <div class="vc171-metrics">${stats.map(([label,n])=>`<div><span>${esc(label)}</span><strong>${n}</strong></div>`).join('')}</div>
    <p class="vc171-method"><b>Definiciones:</b> ${esc(names[s])}. Cada porcentaje de evaluación utiliza acciones de este fundamento como denominador. En ataque, EFF = (# − = − /) / ataques. *«Rallies ganados» corresponde a los rallies únicos donde aparece una acción del grupo, no a puntos causados por esa acción ni a tasas de side-out.</p>
    ${details}
    ${s==='E'||s==='A'?`<section class="vc171-card"><h4>Secuencia vinculada: colocador → atacante</h4><p class="vc171-help">Vincula la colocación con el primer ataque posterior de la misma posesión cuando ambos están codificados. No calcula tiempos reales de vuelo.</p>${sequenceTable(report,tools)}</section>`:''}
    <section class="vc171-card"><h4>Acciones registradas y evidencia en vídeo</h4><p class="vc171-help">Pulsa «Ver» para enviar las acciones al inspector lateral y abrirlas en Video Analytics cuando tengan una marca temporal.</p>${detailTable(report,tools)}</section>
    </div>`;
 }
 const CSS=`
 #vc157-studio .vc171-root{display:grid;gap:12px;min-width:0}#vc157-studio .vc171-root *{box-sizing:border-box}
 #vc157-studio .vc171-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#f3f8fd;border:1px solid #d8e6f0;border-radius:10px;padding:14px}
 #vc157-studio .vc171-title span{font-size:9px;letter-spacing:.12em;font-weight:900;color:#477fa7}#vc157-studio .vc171-title h3{font-size:17px!important;color:#183f60!important;margin:4px 0!important}#vc157-studio .vc171-title p{margin:0;color:#698399;font-size:11px}
 #vc157-studio .vc171-title .vc171-tag{border-radius:100px;padding:7px 10px;background:#e2f0fb;color:#1f5b88;font-size:11px;letter-spacing:0}
 #vc157-studio .vc171-skillbar{display:flex;flex-wrap:wrap;gap:4px;background:#eaf2f8;padding:6px;border-radius:10px}
 #vc157-studio .vc171-skillbar button{min-height:34px!important;background:#fff!important;color:#426d8a!important;border:1px solid #d8e6ee!important;border-radius:7px!important;padding:7px 10px!important;font:800 11px system-ui!important}
 #vc157-studio .vc171-skillbar button[aria-selected="true"]{background:#195b99!important;border-color:#195b99!important;color:#fff!important}
 #vc157-studio .vc171-filters{display:flex;align-items:end;gap:9px;flex-wrap:wrap}#vc157-studio .vc171-filters label{display:grid;gap:4px;min-width:170px;flex:1}#vc157-studio .vc171-filters label,#vc157-studio .vc171-context{font:750 10px system-ui;color:#587992}
 #vc157-studio .vc171-filters select{width:100%;min-height:37px;padding:7px;background:#fff;color:#1b496c;border:1px solid #cddfeb;border-radius:7px;font-size:11px}
 #vc157-studio .vc171-context{padding:10px;flex:1 1 180px;background:#f4f8fa;border-radius:7px}
 #vc157-studio .vc171-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
 #vc157-studio .vc171-metrics>div{display:grid;gap:4px;padding:12px;border-radius:10px;border:1px solid #d8e7f2;background:#fff}
 #vc157-studio .vc171-metrics span{font-size:10px;color:#708ba2;font-weight:750}#vc157-studio .vc171-metrics strong{font-size:22px;color:#18446b;font-variant-numeric:tabular-nums}
 #vc157-studio .vc171-method{font-size:10px;color:#68869d;background:#f5f9fc;border-left:3px solid #6390b1;border-radius:5px;padding:10px;line-height:1.5;margin:0}
 #vc157-studio .vc171-panels{display:grid;grid-template-columns:minmax(0,2fr) minmax(200px,1fr);gap:10px;align-items:start}
 #vc157-studio .vc171-card{border:1px solid #dce8f1;border-radius:10px;background:#fff;padding:12px;min-width:0}
 #vc157-studio .vc171-card h4{font-size:13px;color:#19486c;margin:0 0 8px}
 #vc157-studio .vc171-tablewrap{overflow:auto;max-width:100%}#vc157-studio .vc171-table{width:100%;border-collapse:collapse;white-space:nowrap;font:650 10px system-ui}
 #vc157-studio .vc171-table th{background:#edf5fb;color:#527591;position:sticky;top:0;padding:7px 8px;text-align:left;border-bottom:1px solid #d9e8f2}
 #vc157-studio .vc171-table td{padding:7px 8px;color:#325b78;border-bottom:1px solid #ebf2f7}#vc157-studio .vc171-table small{color:#849aad}
 #vc157-studio .vc171-table .vc171-empty{text-align:center;color:#7892a4;padding:16px}
 #vc157-studio .vc171-coverage{display:grid;gap:10px}#vc157-studio .vc171-coverage-row{display:grid;gap:5px;grid-template-columns:minmax(95px,1fr) minmax(45px,1fr) auto;align-items:center;font:650 10px system-ui;color:#567791}
 #vc157-studio .vc171-track{height:8px;background:#e6edf3;border-radius:5px;overflow:hidden}#vc157-studio .vc171-track i{display:block;height:100%;background:#3b85bd;border-radius:5px}
 #vc157-studio .vc171-help{font-size:10px;color:#748da1;line-height:1.5;margin:0 0 10px}
 #vc157-studio button.vc171-pick{font-weight:800!important;color:#165d96!important;background:#eaf4fc!important;text-decoration:none;border:1px solid #ccdfed!important;padding:5px 7px!important;border-radius:6px!important}
 @media(max-width:1100px){#vc157-studio .vc171-panels{grid-template-columns:1fr}}
 @media(max-width:650px){#vc157-studio .vc171-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc171-filters{display:grid;grid-template-columns:1fr}#vc157-studio .vc171-filters label{min-width:0}#vc157-studio .vc171-skillbar button{font-size:10px!important}}
 `;
 function installStyle(){if(document.getElementById('vc171-style'))return;const s=document.createElement('style');s.id='vc171-style';s.textContent=CSS;document.head.appendChild(s)}
 window.VC_ALL_SKILLS_1617={version:'16.1.7',buildReport,render,installStyle};
})();
