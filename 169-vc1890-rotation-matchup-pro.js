/* Volley Coach V18.9.0 · Rotation Matchup Pro
 * Read-only rotation × rotation analysis, built from the canonical
 * VC_ANALYSIS_INTELLIGENCE_1614 extracted rallies. No writes, sync, score or
 * official PDF changes. Every denominator is explicit; missing rotations stay missing.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ROTATION_MATCHUP_1890=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='18.9.0', EVALS=['#','+','!','-','/','='];
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const pct=(a,b)=>b?Math.round((a/b)*1000)/10:null;
 const fmt=x=>x==null?'—':`${Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const rotation=x=>{const n=Number(x);return Number.isInteger(n)&&n>=1&&n<=6?n:0};
 const team=x=>x==='opponent'?'opponent':'ours';
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 function phaseFor(r,target){
  // Match the shared Analysis Pro K1/K2 filter: the side receiving is K1,
  // the side serving is K2. Never infer a phase when the server is unknown.
  if(r?.serving==='ours'||r?.serving==='opponent')return r.serving===target?'K2':'K1';
  const actions=arr(r?.actions).filter(a=>a?.team===target);
  const priority=actions.filter(a=>['E','A'].includes(a?.skill)).concat(actions);
  for(const row of priority){
   const raw=txt(row?.a?.phase||row?.a?.dvPointPhase||row?.a?.dvPhase||row?.a?.dvAttackPhase).toUpperCase();
   if(/^K1\b|SIDE[ -]?OUT/.test(raw))return 'K1';
   if(/^K2\b|BREAK/.test(raw))return 'K2';
   if(/^TR\b|TRANS/.test(raw))return 'TR';
   if(/^FB\b|FREEBALL/.test(raw))return 'FB';
  }
  return 'UNK';
 }
 function rallyContext(r,target){
  const own=target==='ours'?rotation(r?.rotation):rotation(r?.opponentRotation);
  const rival=target==='ours'?rotation(r?.opponentRotation):rotation(r?.rotation);
  return {own,rival,phase:phaseFor(r,target)};
 }
 function attackStats(rows){
  const list=arr(rows),counts=Object.fromEntries(EVALS.map(k=>[k,0]));
  for(const a of list)if(Object.prototype.hasOwnProperty.call(counts,txt(a?.ev)))counts[txt(a.ev)]++;
  const n=list.length,k=counts['#'],e=counts['='],b=counts['/'];
  return {n,counts,k,e,b,plus:counts['+'],killPct:pct(k,n),eff:pct(k-e-b,n)};
 }
 function group(rows,getter){
  const map=new Map();
  for(const row of arr(rows)){const label=txt(getter(row))||'Sin registrar';if(!map.has(label))map.set(label,[]);map.get(label).push(row)}
  return [...map].map(([name,items])=>({name,items})).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es'));
 }
 function keysFor(rallies,target,limit=500){
  const keys=[];
  for(const r of arr(rallies))for(const a of arr(r?.actions))if(a?.team===target&&a?.key)keys.push(a.key);
  return [...new Set(keys)].slice(0,limit);
 }
 function analyze(data,state={}){
  const target=team(data?.target),source=arr(data?.extracted?.rallies?.length?data.extracted.rallies:data?.rallies);
  const closed=source.filter(r=>r&&(r.winning==='ours'||r.winning==='opponent'));
  const filtered=closed.filter(r=>{
   const c=rallyContext(r,target);
   if(state.set&&Number(r.set)!==Number(state.set))return false;
   if(state.rotation&&c.own!==Number(state.rotation))return false;
   if(state.phase){const servingKnown=r?.serving==='ours'||r?.serving==='opponent';const headerPhase=servingKnown?(r.serving===target?'K2':'K1'):'';if(headerPhase!==String(state.phase))return false;}
   if(state.matchupRivalRotation&&c.rival!==Number(state.matchupRivalRotation))return false;
   return true;
  });
  const contextual=filtered.filter(r=>{const c=rallyContext(r,target);return c.own>0&&c.rival>0});
  const attacks=filtered.flatMap(r=>arr(r.actions).filter(a=>a?.team===target&&a?.skill==='A').map(a=>({a,r,context:rallyContext(r,target),player:txt(a.player)||'Sin identificar',ev:txt(a.ev)})));
  const contextualAttacks=attacks.filter(x=>x.context.own>0&&x.context.rival>0);
  const allStats=attackStats(attacks.map(x=>x.a));
  const win=filtered.filter(r=>r.winning===target).length;
  const losses=filtered.length-win;
  const missingOwn=filtered.filter(r=>!rallyContext(r,target).own).length;
  const missingRival=filtered.filter(r=>!rallyContext(r,target).rival).length;
  const matrix=Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>{
   const items=contextual.filter(r=>{const c=rallyContext(r,target);return c.own===i+1&&c.rival===j+1});
   const w=items.filter(r=>r.winning===target).length;
   return {own:i+1,rival:j+1,items,n:items.length,w,l:items.length-w,pct:pct(w,items.length)};
  }));
  const rotationRows=Array.from({length:6},(_,i)=>{
   const own=i+1,items=filtered.filter(r=>rallyContext(r,target).own===own);
   const k1=items.filter(r=>rallyContext(r,target).phase==='K1'),k2=items.filter(r=>rallyContext(r,target).phase==='K2');
   const wins=items.filter(r=>r.winning===target).length;
   const at=attacks.filter(x=>x.context.own===own);
   const st=attackStats(at.map(x=>x.a));
   return {own,items,n:items.length,wins,losses:items.length-wins,k1:{items:k1,n:k1.length,w:k1.filter(r=>r.winning===target).length},k2:{items:k2,n:k2.length,w:k2.filter(r=>r.winning===target).length},attacks:st};
  });
  const pairGroups=group(contextual,r=>{const c=rallyContext(r,target);return `${c.own}|${c.rival}`}).map(g=>{
   const [own,rival]=g.name.split('|').map(Number),w=g.items.filter(r=>r.winning===target).length;
   return {own,rival,items:g.items,n:g.items.length,w,l:g.items.length-w,pct:pct(w,g.items.length)};
  }).sort((a,b)=>b.n-a.n||b.pct-a.pct);
  const attackerGroups=group(contextualAttacks,x=>`${x.context.own}|${x.context.rival}|${x.player}`).map(g=>{
   const [own,rival,player]=g.name.split('|');const st=attackStats(g.items.map(x=>x.a));
   const tempos=group(g.items,x=>x.a?.a?.attackTempo),destinations=group(g.items,x=>zone(x.a?.a?.endZone)||x.a?.a?.attackDirection||'Sin registrar'),combos=group(g.items,x=>x.a?.a?.attackCombo);
   const keys=keysFor([...new Set(g.items.map(x=>x.r))],target);
   return {own:Number(own),rival:Number(rival),player,items:g.items,stats:st,tempo:tempos[0]?.name||'Sin registrar',destination:destinations[0]?.name||'Sin registrar',combo:combos[0]?.name||'Sin registrar',keys};
  }).sort((a,b)=>b.stats.n-a.stats.n||a.player.localeCompare(b.player,'es'));
  const best=pairGroups.filter(x=>x.n>=5).slice().sort((a,b)=>b.pct-a.pct||b.n-a.n)[0]||null;
  const worst=pairGroups.filter(x=>x.n>=5).slice().sort((a,b)=>a.pct-b.pct||b.n-a.n)[0]||null;
  return {target,sourceRallies:closed.length,filtered,contextual,attacks,contextualAttacks,allStats,win,losses,winPct:pct(win,filtered.length),missingOwn,missingRival,matrix,rotationRows,pairGroups,attackerGroups,best,worst};
 }
 function panel(title,copy,body,tag=''){
  return `<section class="vc1890-panel"><header><div><span>ROTATION MATCHUP PRO</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>${tag?`<b>${esc(tag)}</b>`:''}</header>${body}</section>`;
 }
 function kpi(label,value,detail){return `<article class="vc1890-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`}
 function sample(n){return n>0&&n<5?'<em class="vc1890-sample">Muestra pequeña · N &lt; 5</em>':''}
 function render(data,state={},tools={}){
  const d=analyze(data,state),targetName=d.target==='ours'?'Nuestro equipo':'Rival';
  const pick=typeof tools.pickButton==='function'?tools.pickButton:(label,keys,title)=>`<button type="button" disabled>${esc(label)}</button>`;
  const table=typeof tools.table==='function'?tools.table:(headers,rows,klass='')=>`<div class="vc1890-tablewrap"><table class="vc1890-table ${esc(klass)}"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">Sin datos para los filtros actuales.</td></tr>`}</tbody></table></div>`;
  const matrixRows=d.matrix.map(row=>`<tr><th scope="row">R${row[0].own}</th>${row.map(cell=>{
   if(!cell.n)return '<td><span class="vc1890-empty-cell">—</span></td>';
   const label=`${cell.w}G–${cell.l}P · ${fmt(cell.pct)} · N=${cell.n}`;
   const keys=keysFor(cell.items,d.target);
   return `<td><div class="vc1890-cell"><strong>${cell.w}–${cell.l}</strong><small>${fmt(cell.pct)} · N=${cell.n}</small>${keys.length?pick('Ver jugadas',keys,`R${cell.own} vs R${cell.rival} · ${cell.w}G ${cell.l}P`):''}${sample(cell.n)}</div></td>`;
  }).join('')}</tr>`).join('');
  const matrix=`<div class="vc1890-matrix-note"><span>Filas: rotación propia</span><span>Columnas: rotación rival</span><span>G–P: rallies ganados y perdidos por ${targetName.toLowerCase()}</span></div><div class="vc1890-tablewrap"><table class="vc1890-matrix"><thead><tr><th>Propia × rival</th>${[1,2,3,4,5,6].map(n=>`<th>R${n}</th>`).join('')}</tr></thead><tbody>${matrixRows||'<tr><td colspan="7">Sin cruces de rotación.</td></tr>'}</tbody></table></div>`;
  const rotationTable=d.rotationRows.map(x=>{
   const k1p=pct(x.k1.w,x.k1.n),k2p=pct(x.k2.w,x.k2.n),keys=keysFor(x.items,d.target);
   return `<tr><td><b>R${x.own}</b></td><td>${x.n}</td><td>${x.wins}–${x.losses}</td><td>${x.k1.w}/${x.k1.n} · ${fmt(k1p)}${sample(x.k1.n)}</td><td>${x.k2.w}/${x.k2.n} · ${fmt(k2p)}${sample(x.k2.n)}</td><td>${x.attacks.n}</td><td>${fmt(x.attacks.killPct)}</td><td>${fmt(x.attacks.eff)}</td><td>${keys.length?pick('Ver',keys,`R${x.own} · todas las jugadas`):'—'}</td></tr>`;
  }).join('');
  const matchupTable=d.pairGroups.map(x=>{
   const keys=keysFor(x.items,d.target);
   return `<tr><td><b>R${x.own} vs R${x.rival}</b></td><td>${x.n}</td><td>${x.w}–${x.l}</td><td>${fmt(x.pct)}${sample(x.n)}</td><td>${keys.length?pick('Ver',keys,`R${x.own} vs R${x.rival}`):'—'}</td></tr>`;
  }).join('');
  const attackerTable=d.attackerGroups.map(x=>`<tr><td><b>R${x.own} vs R${x.rival}</b></td><td>${esc(x.player)}</td><td>${x.stats.n}${sample(x.stats.n)}</td><td>${fmt(pct(x.stats.n,d.contextualAttacks.length))}</td><td>${x.stats.k}</td><td>${x.stats.e}</td><td>${x.stats.b}</td><td>${fmt(x.stats.killPct)}</td><td>${fmt(x.stats.eff)}</td><td>${esc(x.tempo)}</td><td>${esc(x.combo)}</td><td>${esc(x.destination)}</td><td>${x.keys.length?pick('Ver',x.keys,`Ataques · ${x.player} · R${x.own} vs R${x.rival}`):'—'}</td></tr>`).join('');
  const noData=d.filtered.length?'':`<div class="vc1890-empty">No hay rallies cerrados para los filtros actuales. Comprueba el scouting, el set, la rotación propia y el complejo K1/K2.</div>`;
  const best=d.best?`R${d.best.own} vs R${d.best.rival} · ${d.best.w}/${d.best.n} (${fmt(d.best.pct)})`:'Muestra insuficiente (N &lt; 5)';
  const worst=d.worst?`R${d.worst.own} vs R${d.worst.rival} · ${d.worst.w}/${d.worst.n} (${fmt(d.worst.pct)})`:'Muestra insuficiente (N &lt; 5)';
  const filterText=[state.set?`Set ${state.set}`:'Todos los sets',state.rotation?`R${state.rotation} propia`:'Todas las rotaciones propias',state.phase||'Todos los complejos',state.matchupRivalRotation?`R${state.matchupRivalRotation} rival`:'Todas las rotaciones rivales'].join(' · ');
  const rivalOptions=[['','Todas'] ,...[1,2,3,4,5,6].map(n=>[String(n),`R${n}`])];
  const filters=`<div class="vc1890-filterbar"><label>Rotación rival<select id="vc1890-rival-rotation">${rivalOptions.map(([v,l])=>`<option value="${v}" ${String(state.matchupRivalRotation||'')===v?'selected':''}>${l}</option>`).join('')}</select></label><p>Filtros compartidos: ${esc(filterText)}</p></div>`;
  const bestWorst=`<div class="vc1890-insight-grid"><div><span>Mejor cruce (N ≥ 5)</span><strong>${best}</strong></div><div><span>Cruce más difícil (N ≥ 5)</span><strong>${worst}</strong></div></div>`;
  const coverage=`<p class="vc1890-method">Contexto completo: ${d.contextual.length}/${d.filtered.length} rallies (${fmt(pct(d.contextual.length,d.filtered.length))}) con ambas rotaciones identificadas. ${d.missingOwn} sin rotación propia y ${d.missingRival} sin rotación rival. Se excluyen de la matriz y del análisis de atacantes por cruce, pero no del resultado global.</p>`;
  const method=`<p class="vc1890-method">Método: K1 = el equipo analizado recibe el saque; K2 = el equipo analizado saca. Si no se identifica el saque, solo se conserva una fase explícita codificada. G–P cuenta rallies cerrados. Kill = ataques # / ataques registrados. EFF = (# − = − /) / total de ataques. No se atribuye el resultado del rally a un atacante individual. Las acciones sin valoración permanecen en el denominador de intentos. N &lt; 5 se interpreta como muestra pequeña.</p>`;
  return `<div class="vc1890-root"><section class="vc1890-hero"><div><span>VOLLEY COACH · ANALYSIS PRO · V18.9.0</span><h3>Cruces de rotaciones y rendimiento ofensivo</h3><p>Relaciona la rotación propia con la rotación rival, separa K1/K2 y muestra qué atacantes aparecen y cómo resuelven en cada cruce.</p></div><b>${d.filtered.length} rallies</b></section>${filters}
   <div class="vc1890-kpis">${kpi('Rallies analizados',d.filtered.length,`${d.win} ganados · ${d.losses} perdidos`)}${kpi('Conversión de rallies',fmt(d.winPct),`${d.win}/${d.filtered.length} · G–P`)}${kpi('Ataques registrados',d.allStats.n,`${d.contextualAttacks.length} con cruce completo`)}${kpi('EFF de ataque',fmt(d.allStats.eff),`${d.allStats.k} puntos · ${d.allStats.e} errores · ${d.allStats.b} bloqueados`)}</div>
   ${noData}
   ${panel('Matriz de cruces · rotación propia × rival','Cada celda muestra rallies ganados–perdidos y conversión. Selecciona «Ver jugadas» para abrir las acciones que forman el cruce.',''+matrix,'6 × 6')}
   ${panel('Rendimiento por rotación propia','K1 y K2 se calculan sobre sus oportunidades reales. El ataque EFF se calcula sobre los ataques del equipo en esa rotación.',table(['Rotación','Rallies','G–P','K1 · G/N','K2 · G/N','Ataques','Kill %','EFF','Evidencia'],rotationTable,'vc1890-table'),'R1–R6')}
   <div class="vc1890-grid2">${panel('Resultados por cruce','Ordenados por volumen de rallies. No se recomienda ordenar solo por porcentaje cuando la muestra es pequeña.',table(['Cruce','Rallies','G–P','Conversión','Evidencia'],matchupTable,'vc1890-table'))}${panel('Lectura de cruces','Mejor y peor conversión entre cruces con al menos cinco rallies. No se interpreta como causalidad.',bestWorst+coverage)}</div>
   ${panel('Uso y eficiencia de atacantes por cruce','Uso relativo sobre los ataques con ambas rotaciones identificadas. Kill y EFF se calculan sobre intentos del atacante en ese cruce.',table(['Cruce','Atacante','Ataques','Uso','Puntos #','Errores =','Bloqueados /','Kill %','EFF','Tempo','Combinación','Destino','Evidencia'],attackerTable,'vc1890-table'))}
   ${method}</div>`;
 }
 const CSS=`
 #vc157-studio .vc1890-root{display:grid;gap:12px;min-width:0;color:#193d59}
 #vc157-studio .vc1890-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;border:1px solid #d5e4ef;border-radius:14px;background:linear-gradient(112deg,#f1f7fc,#fff)}
 #vc157-studio .vc1890-hero span{font:900 9px/1.4 system-ui;letter-spacing:.12em;color:#2870a5}
 #vc157-studio .vc1890-hero h3{margin:4px 0!important;font:850 20px/1.25 system-ui!important;color:#143d5e!important}
 #vc157-studio .vc1890-hero p{margin:0!important;font:500 11px/1.5 system-ui;color:#6a8499;max-width:900px}
 #vc157-studio .vc1890-hero>b{flex:none;padding:8px 11px;border-radius:9px;background:#e5f0fa;color:#1b5b8e;font:850 11px system-ui}
 #vc157-studio .vc1890-filterbar{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:11px 13px;border:1px solid #dce7ef;border-radius:11px;background:#f7fafc}
 #vc157-studio .vc1890-filterbar label{display:grid;gap:5px;min-width:170px;font:800 9px system-ui;color:#5c7890}
 #vc157-studio .vc1890-filterbar select{min-height:36px;border:1px solid #cbdce9;border-radius:8px;padding:7px 10px;background:#fff;color:#244e6d;font:650 11px system-ui}
 #vc157-studio .vc1890-filterbar p{margin:0;color:#71889b;font:600 10px/1.5 system-ui}
 #vc157-studio .vc1890-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
 #vc157-studio .vc1890-kpi{min-width:0;display:grid;gap:4px;align-content:start;padding:12px;border:1px solid #dce7ef;border-radius:11px;background:#fff}
 #vc157-studio .vc1890-kpi span{font:850 8px/1.35 system-ui;color:#70889c;text-transform:uppercase;letter-spacing:.04em}
 #vc157-studio .vc1890-kpi strong{font:850 22px/1.2 system-ui;color:#153f60;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 #vc157-studio .vc1890-kpi small{font:500 9px/1.4 system-ui;color:#7890a3}
 #vc157-studio .vc1890-panel{min-width:0;padding:14px;border:1px solid #dce6ee;border-radius:12px;background:#fff;box-shadow:0 4px 15px #123b5908}
 #vc157-studio .vc1890-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
 #vc157-studio .vc1890-panel>header>div{min-width:0}
 #vc157-studio .vc1890-panel>header span{font:900 8px system-ui;letter-spacing:.12em;color:#6b91ad}
 #vc157-studio .vc1890-panel>header h3{margin:3px 0!important;font:850 14px/1.3 system-ui!important;color:#194665!important}
 #vc157-studio .vc1890-panel>header p{margin:0!important;font:500 10px/1.45 system-ui;color:#71899d}
 #vc157-studio .vc1890-panel>header>b{flex:none;padding:5px 8px;border-radius:20px;background:#f0f6fb;color:#3b6d92;font:800 9px system-ui}
 #vc157-studio .vc1890-tablewrap{width:100%;overflow:auto}
 #vc157-studio .vc1890-tablewrap .vc157-table{min-width:690px}
 #vc157-studio .vc1890-matrix{width:100%;min-width:720px;border-collapse:separate;border-spacing:4px;font:600 9px/1.35 system-ui}
 #vc157-studio .vc1890-matrix th{padding:8px 5px;text-align:center;background:#f1f6fa;border-radius:7px;color:#4d6d86;white-space:nowrap}
 #vc157-studio .vc1890-matrix tbody th{background:#e9f2fa;color:#1b5079;font-weight:900}
 #vc157-studio .vc1890-matrix td{padding:0;min-width:88px;text-align:center;background:#f8fafc;border:1px solid #e2eaf1;border-radius:8px;vertical-align:middle}
 #vc157-studio .vc1890-cell{display:grid;gap:3px;justify-items:center;padding:8px 4px;min-height:76px;align-content:center}
 #vc157-studio .vc1890-cell>strong{font:900 15px system-ui;color:#174b73}
 #vc157-studio .vc1890-cell>small{font:650 8px system-ui;color:#71889b}
 #vc157-studio .vc1890-cell button{min-height:25px!important;padding:4px 6px!important;font:800 8px system-ui!important}
 #vc157-studio .vc1890-empty-cell{color:#b0bdc9;font-size:15px}
 #vc157-studio .vc1890-matrix-note{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 8px;color:#71889b;font:650 9px system-ui}
 #vc157-studio .vc1890-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:start}
 #vc157-studio .vc1890-insight-grid{display:grid;gap:8px}
 #vc157-studio .vc1890-insight-grid>div{display:grid;gap:4px;padding:11px;border:1px solid #e1eaf2;border-radius:9px;background:#f8fafc}
 #vc157-studio .vc1890-insight-grid span{font:750 9px system-ui;color:#71879a}
 #vc157-studio .vc1890-insight-grid strong{font:850 12px/1.45 system-ui;color:#1b4869;overflow-wrap:anywhere}
 #vc157-studio .vc1890-sample{display:block;color:#9a713d;font:700 8px system-ui;font-style:normal}
 #vc157-studio .vc1890-method{margin:9px 0 0;padding:9px 11px;border-left:3px solid #8fb8d5;background:#f4f8fb;color:#647f94;font:500 9px/1.5 system-ui;border-radius:0 7px 7px 0}
 #vc157-studio .vc1890-empty{padding:14px;border:1px dashed #cbdce8;border-radius:9px;background:#f8fbfd;color:#6f879a;font:600 10px/1.5 system-ui}
 @media(max-width:1100px){#vc157-studio .vc1890-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:850px){#vc157-studio .vc1890-grid2{grid-template-columns:1fr}}
 @media(max-width:620px){#vc157-studio .vc1890-hero{align-items:flex-start;padding:14px;flex-direction:column}#vc157-studio .vc1890-hero h3{font-size:17px!important}#vc157-studio .vc1890-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1890-kpi{padding:9px}#vc157-studio .vc1890-kpi strong{font-size:18px}#vc157-studio .vc1890-panel{padding:10px}#vc157-studio .vc1890-filterbar{align-items:stretch}#vc157-studio .vc1890-filterbar label{min-width:100%;width:100%}#vc157-studio .vc1890-filterbar p{width:100%}}
 `;
 function installStyle(doc){const d=doc||(typeof document!=='undefined'?document:null);if(!d||d.getElementById('vc1890-rotation-matchup-css'))return;const s=d.createElement('style');s.id='vc1890-rotation-matchup-css';s.textContent=CSS;d.head.appendChild(s)}
 function renderPage(data,state,tools){installStyle();return render(data,state,tools)}
 return {VERSION,phaseFor,rallyContext,attackStats,analyze,render,renderPage,installStyle,css:CSS};
});
