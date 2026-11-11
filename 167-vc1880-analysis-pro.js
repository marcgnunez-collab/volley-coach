/* Volley Coach V18.8.0 · Analysis Pro Tactical Extensions
 * Read-only analytical views built on VC_ANALYSIS_INTELLIGENCE_1614.model.
 * No scouting writes, score changes, cloud access, or independent persistence.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_PRO_1880=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const EVALS=['#','+','!','-','/','='];
 const LABELS={'#':'Punto / perfecta','+':'Positiva','!':'Intermedia','-':'Negativa','/':'Muy negativa','=':'Error'};
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const norm=x=>str(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b?Math.round((a/b)*1000)/10:null;
 const fmt=x=>x==null?'—':`${Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const signed=x=>num(x)>0?`+${num(x)}`:String(num(x));
 const zone=x=>{const m=str(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 const rowKey=r=>str(r?.key);
 const rallyKey=r=>`${r?.set??''}/${r?.id??r?.index??''}`;
 function group(rows,getter){
  const map=new Map();
  for(const row of arr(rows)){const label=str(getter(row))||'Sin codificar';if(!map.has(label))map.set(label,[]);map.get(label).push(row)}
  return [...map].map(([name,items])=>({name,items})).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es'));
 }
 function evalStats(rows){
  const counts=Object.fromEntries(EVALS.map(k=>[k,0]));
  for(const r of arr(rows)){const ev=str(r?.ev);if(Object.prototype.hasOwnProperty.call(counts,ev))counts[ev]++}
  const n=arr(rows).length,positive=counts['#']+counts['+'];
  return {n,counts,positive,positivePct:pct(positive,n),perfect:counts['#'],errors:counts['='],killPct:pct(counts['#'],n),eff:pct(counts['#']-counts['=']-counts['/'],n),blocked:counts['/'],intermediate:counts['!'],negative:counts['-']};
 }
 function groupStats(rows,field){
  return group(rows,r=>field(r)).map(g=>({name:g.name,items:g.items,stats:evalStats(g.items)}));
 }
 function keys(rows){return [...new Set(arr(rows).map(rowKey).filter(Boolean))]}
 let windowTools={pickButton:(label)=>`<button type="button" disabled>${esc(label)}</button>`};
 function setTools(tools){windowTools={...windowTools,...(tools||{})}}
 function panelHead(kicker,title,copy,tag=''){
  return `<header class="vc1880-panelhead"><div><span>${esc(kicker)}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>${tag?`<b class="vc1880-tag">${esc(tag)}</b>`:''}</header>`;
 }
 function kpi(label,value,detail,kind=''){
  return `<article class="vc1880-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small>${kind?`<em>${esc(kind)}</em>`:''}</article>`;
 }
 function panel(title,copy,body,tag=''){
  return `<section class="vc1880-panel">${panelHead('DESGLOSE Y EVIDENCIA',title,copy,tag)}${body}</section>`;
 }
 function evalStrip(stats){
  return `<div class="vc1880-evals">${EVALS.map(k=>`<div><b>${k}</b><strong>${stats.counts[k]||0}</strong><small>${LABELS[k]}</small></div>`).join('')}</div>`;
 }
 function empty(msg){return `<div class="vc1880-empty">${esc(msg)}</div>`}
 function table(tools,headers,rows){
  return tools.table?tools.table(headers,rows,'vc1880-table'): `<div class="vc1880-tablewrap"><table class="vc1880-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">Sin datos para los filtros actuales.</td></tr>`}</tbody></table></div>`;
 }
 function serveReceive(data,tools={}){
  setTools(tools);
  const target=data?.target==='opponent'?'opponent':'ours';
  const serves=arr(data?.actions).filter(x=>x.skill==='S');
  const receives=arr(data?.actions).filter(x=>x.skill==='R');
  const ss=evalStats(serves),rs=evalStats(receives);
  const serveLinks=[];
  for(const r of arr(data?.rallies)){
   if(!r?.winning||r.serving!==target)continue;
   const serve=arr(r.actions).find(a=>a.team===target&&a.skill==='S');
   if(!serve)continue;
   const receive=arr(r.actions).find(a=>a.team!==target&&a.skill==='R'&&num(a.index)>num(serve.index))||null;
   serveLinks.push({r,serve,receive});
  }
  const linked=serveLinks.filter(x=>x.receive);
  const linkQuality=group(linked,x=>str(x.receive.ev)||'Sin valoración');
  const linkByServeType=group(linked,x=>`${str(x.serve.a?.serveType)||'Saque sin tipo'} → ${str(x.receive.ev)||'Sin valoración'}`);
  const linkTypeRows=linkByServeType.map(g=>{const pos=g.items.filter(x=>['#','+'].includes(x.receive.ev)).length;return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${pos}/${g.items.length}</td><td>${fmt(pct(pos,g.items.length))}</td><td>${windowTools.pickButton('Ver',keys(g.items.map(x=>x.serve)),`Saque y recepción · ${g.name}`)}</td></tr>`}).join('');
  const qualityRows=linkQuality.map(g=>{
   const pos=g.items.filter(x=>['#','+'].includes(x.receive.ev)).length;
   return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${pos}/${g.items.length}</td><td>${fmt(pct(pos,g.items.length))}</td><td>${windowTools.pickButton('Ver saque',keys(g.items.map(x=>x.serve)),`Saque propio · recepción rival ${g.name}`)}</td></tr>`;
  }).join('');
  const k1=arr(data?.chains);
  const k1Groups=group(k1,x=>str(x.rec?.ev)||'Sin valoración');
  const k1Rows=k1Groups.map(g=>{
   const won=g.items.filter(x=>x.outcome===true).length;
   const attacks=g.items.map(x=>x.attack).filter(Boolean);
   const aStats=evalStats(attacks);
   const linkKeys=g.items.flatMap(x=>[x.rec?.key,x.setter?.key,x.attack?.key]).filter(Boolean);
   return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${won}/${g.items.length}</td><td>${fmt(pct(won,g.items.length))}</td><td>${aStats.counts['#']}/${aStats.n}</td><td>${fmt(aStats.eff)}</td><td>${windowTools.pickButton('Ver',linkKeys,`K1 según recepción ${g.name}`)}</td></tr>`;
  }).join('');
  const servePlayers=groupStats(serves,x=>x.player);
  const serveTypes=groupStats(serves,x=>x.a?.serveType);
  const serveZones=groupStats(serves,x=>zone(x.a?.endZone)||'Sin destino'),serveRotations=groupStats(serves,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const receivePlayers=groupStats(receives,x=>x.player);
  const receiveTypes=groupStats(receives,x=>x.a?.receivedServeType);
  const receiveZones=groupStats(receives,x=>zone(x.a?.contactZone||x.a?.endZone)||'Sin zona'),receiveRotations=groupStats(receives,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const serveRows=(groups)=>groups.slice(0,10).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['=']}</td><td>${g.stats.counts['+']}</td><td>${fmt(g.stats.positivePct)}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Saque · ${g.name}`)}</td></tr>`).join('');
  const receiveRows=(groups)=>groups.slice(0,10).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['+']}</td><td>${g.stats.counts['!']+g.stats.counts['-']+g.stats.counts['/']+g.stats.counts['=']}</td><td>${fmt(g.stats.positivePct)}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Recepción · ${g.name}`)}</td></tr>`).join('');
  const serveTypeRows=serveRows(serveTypes),servePlayerRows=serveRows(servePlayers),serveZoneRows=serveRows(serveZones),serveRotationRows=serveRows(serveRotations);
  const receivePlayerRows=receiveRows(receivePlayers),receiveTypeRows=receiveRows(receiveTypes),receiveZoneRows=receiveRows(receiveZones),receiveRotationRows=receiveRows(receiveRotations);
  const body=`<div class="vc1880-kpis">${kpi('Saques registrados',ss.n,`${ss.counts['#']} aces · ${ss.counts['=']} errores`)}${kpi('Saques positivos #/+',`${ss.positive}/${ss.n}`,fmt(ss.positivePct))}${kpi('Recepciones registradas',rs.n,`${rs.counts['#']} perfectas · ${rs.counts['+']} positivas`)}${kpi('Recepción positiva #/+',`${rs.positive}/${rs.n}`,fmt(rs.positivePct))}</div>
  <div class="vc1880-grid2">${panel('Saque por jugador','Aces y errores directos se muestran separados de las valoraciones positivas.',table(tools,['Sacador','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],servePlayerRows),'SAQUE')}${panel('Recepción por jugador','La recepción positiva agrupa únicamente # y +. Las valoraciones !, -, / y = se mantienen separadas.',table(tools,['Receptor','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receivePlayerRows),'RECEPCIÓN')}</div>
  <div class="vc1880-grid2">${panel('Saque por tipo','Distribución según el tipo de saque codificado.',table(tools,['Tipo','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],serveTypeRows))}${panel('Recepción por saque recibido','Tipo de saque registrado en la acción de recepción.',table(tools,['Tipo recibido','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receiveTypeRows))}</div>
  <div class="vc1880-grid2">${panel('Destino del saque','Solo incluye zonas registradas en el destino del saque.',table(tools,['Destino','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],serveZoneRows))}${panel('Zona de contacto de recepción','No se asigna una zona cuando el scouting no la ha codificado.',table(tools,['Zona','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receiveZoneRows))}</div>
  ${panel('Saque del equipo analizado frente a la recepción contraria','Vinculación dentro del mismo rally: saque del equipo seleccionado y primera recepción contraria posterior. Los rallies sin recepción codificada no se interpretan como ace.',table(tools,['Evaluación de recepción','Recepciones vinculadas','Positivas #/+','% positivas','Evidencia'],qualityRows),`${linked.length}/${serveLinks.length} vinculados`)}
  ${panel('Conversión K1 según calidad de recepción del equipo analizado','Solo se consideran la primera recepción registrada en cada K1 y el resultado real del rally. No demuestra causalidad.',table(tools,['Recepción','Rallies K1','Ganados','Side-out','Ataques #/T','EFF ataque','Evidencias'],k1Rows),`${k1.length} K1 con recepción`)}`;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · SAQUE Y RECEPCIÓN</span><h3>Control del primer contacto</h3><p>Analiza el saque y la recepción del equipo seleccionado, y su respuesta frente al adversario, con denominadores visibles. Los resultados se basan en acciones codificadas y rallies cerrados.</p></div>${body}<p class="vc1880-method">Definiciones: aces = evaluación # en saque; errores directos = evaluación =; recepción positiva = # + +. La recepción contraria vinculada se usa solo cuando existe una acción de recepción posterior al saque en el mismo rally.</p></div>`;
 }
 function attack(data,tools={}){
  setTools(tools);
  const rows=arr(data?.attacks),s=evalStats(rows);
  const byPlayer=groupStats(rows,x=>x.player),byTempo=groupStats(rows,x=>x.a?.attackTempo),byCombo=groupStats(rows,x=>x.a?.attackCombo),byDirection=groupStats(rows,x=>x.a?.attackDirection),byZone=groupStats(rows,x=>zone(x.a?.endZone)||'Sin destino'),byRotation=groupStats(rows,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const linked=arr(data?.pairs).filter(p=>p.attack).map(p=>({...p.attack,linkedSetter:p.set?.player||'Sin colocador vinculado',linkedReception:p.recEval||'Sin recepción enlazada'}));
  const bySetter=groupStats(linked,x=>x.linkedSetter),byReception=groupStats(linked,x=>x.linkedReception);
  const renderAttackRows=groups=>groups.slice(0,12).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['=']}</td><td>${g.stats.counts['/']}</td><td>${fmt(g.stats.killPct)}</td><td>${fmt(g.stats.eff)}</td><td>${g.stats.n<8?'Muestra pequeña':`n=${g.stats.n}`}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Ataque · ${g.name}`)}</td></tr>`).join('');
  const rowsTable=(groups,label)=>table(tools,[label,'Intentos','Kill #','Error =','Bloqueado /','Kill %','EFF %','Muestra','Jugadas'],renderAttackRows(groups));
  const coverage=[
   ['Tempo',rows.filter(x=>str(x.a?.attackTempo)).length],
   ['Combinación',rows.filter(x=>str(x.a?.attackCombo)).length],
   ['Dirección',rows.filter(x=>str(x.a?.attackDirection)).length],
   ['Zona destino',rows.filter(x=>zone(x.a?.endZone)).length],
   ['Bloqueadores',rows.filter(x=>str(x.a?.blockers)).length]
  ];
  const kpis=`<div class="vc1880-kpis">${kpi('Ataques',s.n,`# ${s.counts['#']} · + ${s.counts['+']}`)}${kpi('Puntos directos',s.counts['#'],fmt(s.killPct))}${kpi('Errores + bloqueados',s.counts['=']+s.counts['/'],`${s.counts['=']} errores · ${s.counts['/']} bloqueados`)}${kpi('Eficiencia de ataque',fmt(s.eff),`(# − = − /) / ${s.n} intentos`)}</div>`;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · ATAQUE</span><h3>Rendimiento y distribución ofensiva</h3><p>Desglosa los ataques por jugador, tempo, combinación, dirección, destino y rotación. Cada cifra permite abrir las acciones que la componen.</p></div>${kpis}
   <div class="vc1880-grid2">${panel('Ataque por jugador','Ordenado por volumen de intentos; la muestra se muestra en cada fila.',rowsTable(byPlayer,'Atacante'))}${panel('Ataque por tempo','Solo se utilizan los valores attackTempo registrados.',rowsTable(byTempo,'Tempo'))}</div>
   <div class="vc1880-grid2">${panel('Combinaciones','El código attackCombo no se sustituye por el destino de zona.',rowsTable(byCombo,'Combinación'))}${panel('Dirección del ataque','Solo direcciones explícitamente codificadas.',rowsTable(byDirection,'Dirección'))}</div>
   <div class="vc1880-grid2">${panel('Destino de ataque','Distribución por zona de destino; los valores sin zona quedan separados.',rowsTable(byZone,'Destino'))}${panel('Ataque por rotación','La rotación corresponde a la posición registrada al inicio del rally.',rowsTable(byRotation,'Rotación'))}</div>
   <div class="vc1880-grid2">${panel('Ataque tras cada colocador','Solo ataques vinculados a una colocación dentro de la misma posesión.',rowsTable(bySetter,'Colocador'))}${panel('Ataque según recepción previa','La recepción se muestra solo cuando existe una acción previa vinculada.',rowsTable(byReception,'Recepción previa'))}</div>
   ${panel('Profundidad de codificación','Cobertura de los campos que permiten analizar la táctica ofensiva.',`<div class="vc1880-coverage">${coverage.map(([label,n])=>`<div><span>${esc(label)}</span><div><i style="width:${rows.length?Math.round(n/rows.length*100):0}%"></i></div><b>${n}/${rows.length} · ${fmt(pct(n,rows.length))}</b></div>`).join('')}</div>`)}
   <p class="vc1880-method">EFF = (# − = − /) / intentos de ataque. Kill % = # / intentos. Los porcentajes no sustituyen al volumen: revisa siempre el denominador. Las muestras inferiores a ocho intentos se señalan como pequeñas.</p></div>`;
 }
 function blockDefense(data,tools={}){
  setTools(tools);
  const blocks=arr(data?.actions).filter(x=>x.skill==='B'),defenses=arr(data?.actions).filter(x=>x.skill==='D');
  const b=evalStats(blocks),d=evalStats(defenses);
  const blockGroups=[
   ['Bloqueador',x=>x.player],['Zona',x=>zone(x.a?.contactZone||x.a?.startZone)||'Sin zona'],['N.º bloqueadores',x=>str(x.a?.blockers)||'Sin codificar'],['Atacante objetivo',x=>str(x.a?.blockTargetNumber)||'Sin codificar'],['Tipo de bloqueo',x=>str(x.a?.skillSubtype)||'Sin codificar']
  ];
  const defenseGroups=[['Defensor',x=>x.player],['Zona de contacto',x=>zone(x.a?.contactZone||x.a?.endZone)||'Sin zona'],['Tipo de defensa',x=>str(x.a?.skillSubtype)||'Sin codificar']];
  const renderRows=(groups,kind)=>groups.slice(0,12).map(g=>{
   const s=g.stats;
   return `<tr><td><b>${esc(g.name)}</b></td><td>${s.n}</td><td>${s.counts['#']}</td><td>${s.counts['+']}</td><td>${s.counts['!']}</td><td>${s.counts['-']}</td><td>${s.counts['/']}</td><td>${s.counts['=']}</td><td>${windowTools.pickButton('Ver',keys(g.items),`${kind} · ${g.name}`)}</td></tr>`;
  }).join('');
  const makeGroups=(rows,defs)=>defs.map(([label,getter])=>({label,groups:groupStats(rows,getter)}));
  const bg=makeGroups(blocks,blockGroups),dg=makeGroups(defenses,defenseGroups);
  const rallyOutcome=rows=>{
   const map=new Map();
   for(const x of rows){const key=rallyKey(x.r);if(!map.has(key))map.set(key,x.r?.winning===data.target)}
   const n=map.size,w=[...map.values()].filter(Boolean).length;
   return {n,w,pct:pct(w,n)};
  };
  const combinedRally=rallyOutcome([...blocks,...defenses]);
  const groupPanels=(groups,kind)=>groups.map(g=>panel(`${kind} por ${g.label.toLowerCase()}`,`Distribución de acciones de ${kind.toLowerCase()} según ${g.label.toLowerCase()}.`,table(tools,['Categoría','Acciones','#','+','!','-','/','=','Jugadas'],renderRows(g.groups,kind))));
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · BLOQUEO Y DEFENSA</span><h3>Acciones de contención</h3><p>Separa el resultado de la acción individual del resultado del rally. No se atribuyen puntos de equipo a un jugador por aparecer en una secuencia.</p></div>
   <div class="vc1880-kpis">${kpi('Bloqueos',b.n,`${b.counts['#']} puntos directos · ${b.counts['=']} errores`)}${kpi('Puntos de bloqueo',b.counts['#'],fmt(pct(b.counts['#'],b.n)))}${kpi('Defensas',d.n,`${d.positive} positivas #/+`)}${kpi('Rallies ganados con bloqueo/defensa',`${combinedRally.w}/${combinedRally.n}`,'Presencia de la acción en el rally, no atribución causal')}</div>
   <div class="vc1880-grid2">${panel('Evaluación del bloqueo','Distribución de los códigos registrados.',evalStrip(b))}${panel('Evaluación de la defensa','Distribución de los códigos registrados.',evalStrip(d))}</div>
   <div class="vc1880-grid2">${groupPanels(bg,'Bloqueo').join('')}${groupPanels(dg,'Defensa').join('')}</div>
   <p class="vc1880-method">Los rallies ganados se cuentan una vez por grupo de acción y no representan puntos causados por el bloqueo o la defensa. Los valores sin codificar no se interpretan como ausencia de bloqueo o de defensa.</p></div>`;
 }
 function quality(data,tools={}){
  setTools(tools);
  const rows=arr(data?.quality),skills=Object.entries(SKILLS).map(([code,name])=>{
   const fields=rows.filter(x=>x.skill===code);
   const total=fields[0]?.total||0,complete=fields.reduce((sum,x)=>sum+num(x.n),0),denom=fields.reduce((sum,x)=>sum+num(x.total),0);
   return {code,name,fields,total,complete,denom};
  }).filter(x=>x.fields.length);
  const actions=arr(data?.actions),rallies=arr(data?.rallies);
  const unknownRot=rallies.filter(r=>!(data.target==='opponent'?r.opponentRotation:r.rotation)).length;
  const covered=rows.filter(x=>x.pct!=null);const avgCoverage=covered.length?Math.round(covered.reduce((sum,x)=>sum+num(x.pct),0)/covered.length):null;
  const coveragePanels=skills.map(s=>panel(`${s.name} · campos tácticos`,`${s.fields.length} campos comprobados sobre ${s.fields[0]?.total||0} acciones del fundamento.`, `<div class="vc1880-coverage">${s.fields.map(f=>`<div><span>${esc(f.field)}</span><div><i style="width:${f.pct==null?0:Math.max(0,Math.min(100,f.pct))}%"></i></div><b>${f.n}/${f.total} · ${fmt(f.pct)}</b></div>`).join('')}</div>`,`${s.code} · ${s.fields[0]?.total||0}`));
  const allRows=arr(data?.extracted?.rallies),open=allRows.filter(r=>!r.winning).length;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>CONTROL DE CALIDAD · SCOUTING</span><h3>Fiabilidad y profundidad del registro</h3><p>Esta pantalla mide la cobertura de codificación y los datos pendientes. No es una valoración del rendimiento deportivo.</p></div>
   <div class="vc1880-kpis">${kpi('Rallies analizados',data?.points?.rallies||0,'Rallies cerrados y válidos')}${kpi('Acciones del equipo',actions.length,'Acciones cerradas del filtro actual')}${kpi('Rallies sin resultado',open,'En el scouting completo; no entran en métricas')}${kpi('Acciones con referencia de vídeo',data?.videoCount||0,`De ${actions.length} acciones analizadas`)}</div>
   <div class="vc1880-grid2">${panel('Estado del registro','Indicadores de integridad del scouting seleccionado.',`<div class="vc1880-statusgrid"><div><span>Rallies con saque no identificado</span><b>${num(data?.unknownServe)}</b></div><div><span>Rallies con rotación no identificada</span><b>${unknownRot}</b></div><div><span>Acciones de todos los fundamentos</span><b>${arr(data?.extracted?.actions).length}</b></div><div><span>Campos de codificación comprobados</span><b>${rows.length}</b></div></div>`)}${panel('Cobertura global de campos','Media descriptiva de los campos comprobados; no equivale a calidad del rendimiento.',`<div class="vc1880-coverage"><div><span>Completitud media</span><div><i style="width:${avgCoverage==null?0:Math.max(0,Math.min(100,avgCoverage))}%"></i></div><b>${fmt(avgCoverage)}</b></div></div><p class="vc1880-help">La media se calcula sobre campos con denominador disponible. Consulta el detalle por fundamento para interpretar cada valor.</p>`)}</div>
   <div class="vc1880-quality-grid">${coveragePanels.join('')}</div>
   <p class="vc1880-method">Las acciones del análisis proceden de rallies cerrados. Los rallies sin resultado permanecen en el scouting y se excluyen de los denominadores. Un campo vacío significa «no codificado», no que la acción no haya ocurrido.</p></div>`;
 }
 const CSS=`
 #vc157-studio .vc1880-root{display:grid;gap:13px;min-width:0;color:#18364f}
 #vc157-studio .vc1880-intro{padding:18px 20px;border:1px solid #d8e5ef;border-radius:14px;background:linear-gradient(115deg,#f3f8fd,#fff);display:grid;gap:5px}
 #vc157-studio .vc1880-intro>span{font:900 9px/1.4 system-ui;letter-spacing:.13em;color:#2b72a7}
 #vc157-studio .vc1880-intro h3{margin:0!important;font:850 20px/1.25 system-ui!important;color:#123c5d!important}
 #vc157-studio .vc1880-intro p{margin:0!important;color:#68839a;font:500 11px/1.55 system-ui;max-width:900px}
 #vc157-studio .vc1880-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
 #vc157-studio .vc1880-kpi{border:1px solid #dbe6ef;border-radius:12px;background:#fff;padding:13px;min-width:0;display:grid;gap:4px;align-content:start}
 #vc157-studio .vc1880-kpi>span{font:850 9px/1.35 system-ui;color:#67839a;text-transform:uppercase;letter-spacing:.045em}
 #vc157-studio .vc1880-kpi>strong{font:850 24px/1.15 system-ui;color:#143e60;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 #vc157-studio .vc1880-kpi>small{font:500 10px/1.4 system-ui;color:#7890a3}
 #vc157-studio .vc1880-kpi>em{font:800 9px system-ui;color:#3676a6;font-style:normal}
 #vc157-studio .vc1880-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
 #vc157-studio .vc1880-quality-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
 #vc157-studio .vc1880-panel{border:1px solid #dce6ee;border-radius:13px;background:#fff;padding:15px;min-width:0;box-shadow:0 5px 17px rgba(17,54,82,.035)}
 #vc157-studio .vc1880-panelhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}
 #vc157-studio .vc1880-panelhead>div{min-width:0}
 #vc157-studio .vc1880-panelhead span{font:900 8px/1.3 system-ui;letter-spacing:.12em;color:#6391b2}
 #vc157-studio .vc1880-panelhead h3{font:850 15px/1.3 system-ui!important;color:#173f5f!important;margin:3px 0!important}
 #vc157-studio .vc1880-panelhead p{font:500 10px/1.5 system-ui;color:#6e879b;margin:0!important}
 #vc157-studio .vc1880-tag{flex:none;padding:5px 8px;border:1px solid #d9e7f2;border-radius:100px;background:#f1f7fc;color:#356d95;font:800 9px system-ui}
 #vc157-studio .vc1880-tablewrap{width:100%;overflow:auto}
 #vc157-studio .vc1880-table{width:100%;min-width:540px;border-collapse:separate;border-spacing:0;font:500 10px/1.4 system-ui}
 #vc157-studio .vc1880-table th{padding:8px 7px;background:#f3f7fa;color:#58758d;text-align:left;font-weight:850;white-space:nowrap;border-bottom:1px solid #dce7ef}
 #vc157-studio .vc1880-table td{padding:8px 7px;color:#365a75;border-bottom:1px solid #edf2f6;vertical-align:middle}
 #vc157-studio .vc1880-table td b{color:#1a4567}
 #vc157-studio .vc1880-table small{display:block;color:#8195a6}
 #vc157-studio .vc1880-table button{min-height:28px!important;padding:5px 8px!important;font:800 9px system-ui!important}
 #vc157-studio .vc1880-sample{font-size:9px;color:#9a6c32}
 #vc157-studio .vc1880-evals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
 #vc157-studio .vc1880-evals>div{display:grid;gap:3px;padding:9px 5px;border-radius:8px;background:#f5f8fb;text-align:center}
 #vc157-studio .vc1880-evals b{font:900 15px system-ui;color:#1b5682}
 #vc157-studio .vc1880-evals strong{font:850 18px system-ui;color:#173e5c}
 #vc157-studio .vc1880-evals small{font:500 8px system-ui;color:#7890a3}
 #vc157-studio .vc1880-coverage{display:grid;gap:10px}
 #vc157-studio .vc1880-coverage>div{display:grid;grid-template-columns:minmax(100px,150px) minmax(60px,1fr) auto;align-items:center;gap:9px;font:700 10px system-ui;color:#5e7c94}
 #vc157-studio .vc1880-coverage>div>div{height:8px;border-radius:20px;background:#e6eef4;overflow:hidden}
 #vc157-studio .vc1880-coverage i{display:block;height:100%;background:linear-gradient(90deg,#1d67a4,#39a0cf);border-radius:20px}
 #vc157-studio .vc1880-coverage b{font-variant-numeric:tabular-nums;color:#244e6d;white-space:nowrap}
 #vc157-studio .vc1880-statusgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 #vc157-studio .vc1880-statusgrid>div{padding:10px;border-radius:9px;background:#f5f8fb;display:grid;gap:4px}
 #vc157-studio .vc1880-statusgrid span{font:650 9px system-ui;color:#71889b}
 #vc157-studio .vc1880-statusgrid b{font:850 18px system-ui;color:#1a4668}
 #vc157-studio .vc1880-help{font:500 10px/1.5 system-ui;color:#72899b;margin:10px 0 0}
 #vc157-studio .vc1880-empty{padding:16px;border:1px dashed #cbdce8;border-radius:10px;color:#6f879a;background:#f8fbfd;font:600 11px/1.5 system-ui}
 #vc157-studio .vc1880-method{padding:10px 12px;border-left:3px solid #8eb9d8;background:#f4f8fb;color:#647f94;font:500 10px/1.5 system-ui;margin:0;border-radius:0 8px 8px 0}
 @media(max-width:1150px){#vc157-studio .vc1880-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1880-grid2,#vc157-studio .vc1880-quality-grid{grid-template-columns:1fr}}
 @media(max-width:650px){#vc157-studio .vc1880-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#vc157-studio .vc1880-kpi{padding:9px}#vc157-studio .vc1880-kpi>strong{font-size:20px}#vc157-studio .vc1880-panel{padding:11px}#vc157-studio .vc1880-coverage>div{grid-template-columns:90px minmax(40px,1fr);gap:6px}#vc157-studio .vc1880-coverage b{grid-column:2}#vc157-studio .vc1880-evals{grid-template-columns:repeat(3,minmax(0,1fr))}}
 `;
 function installStyle(doc){const d=doc||(typeof document!=='undefined'?document:null);if(!d||d.getElementById('vc1880-analysis-css'))return;const s=d.createElement('style');s.id='vc1880-analysis-css';s.textContent=CSS;d.head.appendChild(s)}
 function renderServeReceive(data,tools){installStyle();return serveReceive(data,tools)}
 function renderAttack(data,tools){installStyle();return attack(data,tools)}
 function renderBlockDefense(data,tools){installStyle();return blockDefense(data,tools)}
 function renderQuality(data,tools){installStyle();return quality(data,tools)}
 return {version:'18.8.0',evalStats,serveReceive,attack,blockDefense,quality,renderServeReceive,renderAttack,renderBlockDefense,renderQuality,installStyle,css:CSS};
});
