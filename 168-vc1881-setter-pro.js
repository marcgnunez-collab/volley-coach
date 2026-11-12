/* Volley Coach V18.8.1 · Setter & Offensive Systems Pro
 * Read-only extension over the canonical VC_ANALYSIS_INTELLIGENCE_1614 model.
 * Uses only explicitly coded actions and same-match video timestamps.
 * No scouting writes, score changes, persistence, cloud access or sync hooks.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_SETTER_PRO_1881=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const EVALS=['#','+','!','-','/','='];
 const EVAL_LABELS={'#':'Punto / perfecta','+':'Positiva','!':'Intermedia','-':'Negativa','/':'Muy negativa','=':'Error'};
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const pct=(a,b)=>b?Math.round((a/b)*1000)/10:null;
 const fmt=x=>x==null?'—':`${Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 const median=values=>{const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
 const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const fmtSec=x=>x==null?'—':`${x.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})} s`;
 const keyOfRally=r=>`${r?.set??''}/${r?.id??r?.index??''}`;
 const group=(rows,fn)=>{const m=new Map();for(const x of arr(rows)){const k=txt(fn(x))||'Sin registrar';if(!m.has(k))m.set(k,[]);m.get(k).push(x)}return [...m].map(([name,items])=>({name,items})).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es'))};
 const stats=rows=>{const a=arr(rows).filter(Boolean),n=a.length,k=a.filter(x=>x.ev==='#').length,e=a.filter(x=>x.ev==='=').length,b=a.filter(x=>x.ev==='/').length;return {n,k,e,b,kill:pct(k,n),eff:pct(k-e-b,n)}};
 const phaseLabels={K1:'K1 · recepción',K2:'K2 · saque',TR:'Transición',FB:'Freeball'};
 function phaseInfo(pair,target){
  const raw=txt(pair?.set?.a?.phase||pair?.attack?.a?.phase).toUpperCase();
  if(Object.prototype.hasOwnProperty.call(phaseLabels,raw))return {code:raw,label:phaseLabels[raw],source:'Codificada'};
  const serving=pair?.r?.serving;
  if(serving==='ours'||serving==='opponent'){
   const code=serving===target?'K2':'K1';
   return {code,label:phaseLabels[code],source:'Derivada del equipo que sirve'};
  }
  return {code:'UNK',label:'Sin fase identificada',source:'Sin dato'};
 }
 function videoStamp(action){
  const a=action?.a||{};
  const mapped=Number(a.videoAction);
  if(a.videoAction!==null&&a.videoAction!==undefined&&a.videoAction!==''&&Number.isFinite(mapped)&&mapped>=0)
   return {seconds:mapped,kind:'mapped',source:txt(a.videoSource)};
  const direct=Number(a.videoTime);
  if(a.videoTime!==null&&a.videoTime!==undefined&&a.videoTime!==''&&Number.isFinite(direct)&&direct>=0)
   return {seconds:direct,kind:'direct',source:txt(a.videoSource)};
  return null;
 }
 function compatibleDelta(first,second,maxSeconds=30){
  const a=videoStamp(first),b=videoStamp(second);
  if(!a||!b||a.kind!==b.kind)return null;
  if(a.source&&b.source&&a.source!==b.source)return null;
  const d=b.seconds-a.seconds;
  return Number.isFinite(d)&&d>=0&&d<=maxSeconds?d:null;
 }
 function findReception(pair,target){
  const rows=arr(pair?.r?.actions),ix=rows.findIndex(x=>x?.key===pair?.set?.key);
  if(ix<0)return null;
  for(let i=ix-1;i>=0;i--){
   const x=rows[i];
   if(x?.team!==target||['S','E','A'].includes(x?.skill))break;
   if(x?.skill==='R')return x;
  }
  return null;
 }
 function buildRows(data){
  const target=data?.target==='opponent'?'opponent':'ours';
  return arr(data?.pairs).map(pair=>{
   const set=pair?.set||null,attack=pair?.attack||null,rec=findReception(pair,target);
   const phase=phaseInfo(pair,target),r=pair?.r||{};
   const rotation=target==='opponent'?num(r.opponentRotation):num(r.rotation);
   const tempo=txt(set?.a?.setTempo)||'Sin registrar';
   const attackTempo=txt(attack?.a?.attackTempo)||'Sin registrar';
   const combo=txt(set?.a?.attackCombo||attack?.a?.attackCombo)||'Sin registrar';
   const destination=txt(set?.a?.setTarget)||'Sin registrar';
   const setterCall=txt(set?.a?.setterCall)||'Sin registrar';
   const setType=txt(set?.a?.dvSetType)||'Sin registrar';
   const attacker=attack?.player||'Sin ataque vinculado';
   const reception=rec?({'#':'Perfecta (#)','+':'Positiva (+)','!':'Intermedia (!)','-':'Negativa (-)','/':'Muy negativa (/)','=':'Error (=)'}[rec.ev]||'Sin valoración estándar'):'Sin recepción vinculada';
   const keys=[rec?.key,set?.key,attack?.key].filter(Boolean);
   return {pair,set,attack,rec,phase,rotation,tempo,attackTempo,combo,destination,setterCall,setType,setter:set?.player||'Sin identificar',attacker,reception,keys,
    rallyKey:keyOfRally(r),rallyWon:r.winning===target,
    recToSet:rec&&set?compatibleDelta(rec,set):null,
    setToAttack:set&&attack?compatibleDelta(set,attack):null};
  });
 }
 function applyFilters(rows,state={}){
  return rows.filter(x=>(!state.setterPlayer||x.setter===state.setterPlayer)&&
   (!state.setterReception||x.receptionClass===state.setterReception)&&
   (!state.setterTempo||x.tempo===state.setterTempo));
 }
 function enrich(rows){
  return rows.map(x=>({...x,receptionClass:!x.rec?'Sin recepción registrada':['#','+'].includes(x.rec.ev)?'Positiva / perfecta':'Otra recepción'}));
 }
 function makeTools(tools={}){
  const pick=typeof tools.pickButton==='function'?tools.pickButton:(label,keys,title)=>`<button type="button" disabled>${esc(label)}</button>`;
  const table=typeof tools.table==='function'?tools.table:(headers,rows)=>`<div class="vc1881-tablewrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">Sin datos para los filtros actuales.</td></tr>`}</tbody></table></div>`;
  return {pick,table};
 }
 function kpi(label,value,detail){return `<article class="vc1881-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`}
 function panel(title,copy,body,tag=''){return `<section class="vc1881-panel"><header><div><span>ANÁLISIS TÁCTICO</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>${tag?`<b>${esc(tag)}</b>`:''}</header>${body}</section>`}
 function sample(n){return n<5?'<em class="vc1881-small-sample">Muestra pequeña · N &lt; 5</em>':''}
 function render(data,state={},tools={}){
  const {pick,table}=makeTools(tools),all=enrich(buildRows(data)),rows=applyFilters(all,state),total=rows.length;
  const setters=group(rows,x=>x.setter),linked=rows.filter(x=>x.attack),attackStats=stats(linked.map(x=>x.attack));
  const withTarget=rows.filter(x=>x.destination!=='Sin registrar').length,withTempo=rows.filter(x=>x.tempo!=='Sin registrar').length;
  const recTimes=rows.map(x=>x.recToSet).filter(x=>x!=null),setTimes=rows.map(x=>x.setToAttack).filter(x=>x!=null);
  const medianRec=median(recTimes),medianSet=median(setTimes);
  const videoCoverage=rows.filter(x=>x.recToSet!=null||x.setToAttack!=null).length;
  const filterPlayers=[...new Set([...all.map(x=>x.setter),...(state.setterPlayer?[state.setterPlayer]:[])])].sort((a,b)=>a.localeCompare(b,'es'));
  const filterTempos=[...new Set([...all.map(x=>x.tempo),...(state.setterTempo?[state.setterTempo]:[])])].sort((a,b)=>a.localeCompare(b,'es'));
  const filters=`<div class="vc1881-filters"><label>Colocador<select id="vc1621-setter-player"><option value="">Todos los colocadores</option>${filterPlayers.map(x=>`<option value="${esc(x)}" ${state.setterPlayer===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Recepción previa<select id="vc1621-setter-reception"><option value="">Todas / K1 y transición</option>${['Positiva / perfecta','Otra recepción','Sin recepción registrada'].map(x=>`<option value="${esc(x)}" ${state.setterReception===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Tempo colocación<select id="vc1621-setter-tempo"><option value="">Todos los tempos</option>${filterTempos.map(x=>`<option value="${esc(x)}" ${state.setterTempo===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>`;
  const setterRows=setters.map(g=>{
   const linkedRows=g.items.filter(x=>x.attack),st=stats(linkedRows.map(x=>x.attack));
   const dest=g.items.filter(x=>x.destination!=='Sin registrar').length,tempo=g.items.filter(x=>x.tempo!=='Sin registrar').length;
   const keys=[...new Set(g.items.flatMap(x=>x.keys))];
   return `<tr><td><b>${esc(g.name)}</b>${sample(g.items.length)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,total))}</td><td>${dest}/${g.items.length} · ${fmt(pct(dest,g.items.length))}</td><td>${tempo}/${g.items.length} · ${fmt(pct(tempo,g.items.length))}</td><td>${linkedRows.length}/${g.items.length}</td><td>${st.k}/${st.n}</td><td>${fmt(st.eff)}</td><td>${pick('Ver',keys,`Colocador ${g.name}`)}</td></tr>`;
  }).join('');
  const rotationGroups=group(rows,x=>`${x.rotation||'?' }|${x.phase.code}|${x.setter}`)
   .map(g=>{const f=g.items[0],st=stats(g.items.filter(x=>x.attack).map(x=>x.attack)),dest=group(g.items,x=>x.destination)[0]?.name||'Sin registrar';return {...g,rotation:f.rotation,phase:f.phase,setter:f.setter,st,dest}})
   .sort((a,b)=>num(a.rotation)-num(b.rotation)||a.phase.localeCompare(b.phase)||b.items.length-a.items.length);
  const matrixSetters=[...new Set(rows.map(x=>x.setter))].sort((a,b)=>a.localeCompare(b,'es'));
  const matrixRows=matrixSetters.map(name=>{
   const own=rows.filter(x=>x.setter===name),cells=[1,2,3,4,5,6].map(rot=>{
    const n=own.filter(x=>x.rotation===rot).length,den=rows.filter(x=>x.rotation===rot).length;
    return `<td>${n?`${n} <small>${fmt(pct(n,den))}</small>`:'—'}</td>`;
   }).join('');
   return `<tr><td><b>${esc(name)}</b></td>${cells}<td><b>${own.length}</b></td></tr>`;
  }).join('');
  const rotationRows=rotationGroups.map(g=>`<tr><td><b>${g.rotation?`R${g.rotation}`:'—'}</b></td><td>${esc(g.phase)}</td><td>${esc(g.setter)}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.dest)}</td><td>${pick('Jugadas',[...new Set(g.items.flatMap(x=>x.keys))],`R${g.rotation} · ${g.phase} · ${g.setter}`)}</td></tr>`).join('');
  const setterAttacker=group(rows,x=>`${x.setter}|||${x.attacker}`).map(g=>{
   const first=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack));
   const tempos=group(g.items,x=>x.tempo),dest=group(g.items,x=>x.destination);
   return {...g,setter:first.setter,attacker:first.attacker,st,tempo:tempos[0]?.name||'Sin registrar',destination:dest[0]?.name||'Sin registrar'};
  });
  const setterAttackerRows=setterAttacker.map(g=>`<tr><td>${esc(g.setter)}</td><td><b>${esc(g.attacker)}</b></td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.kill)}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.tempo)}</td><td>${esc(g.destination)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],`${g.setter} → ${g.attacker}`)}</td></tr>`).join('');
  const systemGroups=group(rows,x=>`${x.tempo}|||${x.setterCall}|||${x.setType}|||${x.combo}|||${x.attacker}|||${x.attackTempo}`).map(g=>{
   const f=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack));
   return {...g,tempo:f.tempo,setterCall:f.setterCall,setType:f.setType,combo:f.combo,attacker:f.attacker,attackTempo:f.attackTempo,st};
  });
  const systemRows=systemGroups.map(g=>`<tr><td>${esc(g.tempo)}</td><td>${esc(g.setterCall)}</td><td>${esc(g.setType)}</td><td>${esc(g.combo)}</td><td>${esc(g.attacker)}</td><td>${esc(g.attackTempo)}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],`${g.tempo} · ${g.combo} · ${g.attacker}`)}</td></tr>`).join('');
  const phases=group(rows,x=>`${x.phase.code}|||${x.phase.label}|||${x.phase.source}`).map(g=>{
   const f=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack)),rallies=new Set(g.items.map(x=>x.rallyKey));
   return {...g,code:f.phase.code,label:f.phase.label,source:f.phase.source,st,rallies:rallies.size};
  }).sort((a,b)=>['K1','K2','TR','FB','UNK'].indexOf(a.code)-['K1','K2','TR','FB','UNK'].indexOf(b.code));
  const phaseRows=phases.map(g=>`<tr><td><b>${esc(g.label)}</b></td><td>${g.rallies}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.source)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],g.label)}</td></tr>`).join('');
  const evalCounts=Object.fromEntries(EVALS.map(k=>[k,rows.filter(x=>x.set?.ev===k).length]));
  const evalStrip=`<div class="vc1881-evals">${EVALS.map(k=>`<div><b>${k}</b><strong>${evalCounts[k]}</strong><small>${EVAL_LABELS[k]}</small></div>`).join('')}</div>`;
  const timeRows=`<div class="vc1881-timegrid"><div><span>Recepción → colocación</span><strong>${fmtSec(medianRec)}</strong><small>Mediana · N=${recTimes.length}</small></div><div><span>Colocación → ataque</span><strong>${fmtSec(medianSet)}</strong><small>Mediana · N=${setTimes.length}</small></div><div><span>Secuencias con marcas de vídeo</span><strong>${videoCoverage}/${total}</strong><small>${fmt(pct(videoCoverage,total))} de la muestra</small></div></div>`;
  const noRows=total? '' : '<div class="vc1881-empty">No hay colocaciones que coincidan con los filtros actuales. Comprueba el equipo, set, rotación y fase seleccionados en la cabecera del análisis.</div>';
  return `<div class="vc1881-root"><section class="vc1881-hero"><div><span>VOLLEY COACH · ANALYSIS PRO 3.1 · V18.8.1</span><h3>Colocador Pro y sistemas ofensivos</h3><p>Distribución por rotación y fase, conexiones colocador–atacante, combinaciones y tiempos entre marcas de vídeo verificables.</p></div><b>${total} colocaciones</b></section>${filters}
   <div class="vc1881-kpis">${kpi('Colocaciones',total,`De ${arr(data?.pairs).length} del filtro actual`)}${kpi('Ataques vinculados',`${linked.length}/${total}`,fmt(pct(linked.length,total)))}${kpi('Destino registrado',`${withTarget}/${total}`,fmt(pct(withTarget,total)))}${kpi('Tempo registrado',`${withTempo}/${total}`,fmt(pct(withTempo,total)))}${kpi('Ataque · kill',`${attackStats.k}/${attackStats.n}`,fmt(attackStats.kill))}${kpi('Ataque · EFF',fmt(attackStats.eff),`${attackStats.n} ataques valorados`)}</div>
   ${noRows}
   ${panel('Matriz de colocaciones por rotación','Cada celda muestra colocaciones y porcentaje del volumen de esa rotación. La matriz respeta los filtros activos del encabezado.',table(['Colocador','R1','R2','R3','R4','R5','R6','Total'],matrixRows))}
   ${panel('Qué colocador organiza cada rotación','Una fila por rotación, fase y colocador identificado. El volumen cuenta colocaciones, no rallies ni puntos.',table(['Rotación','Fase','Colocador','Coloc.','Atq. enlaz.','Kill/T','EFF','Destino más usado','Evidencia'],rotationRows),'R1–R6')}
   ${panel('Perfil de cada colocador','Uso, completitud de codificación y rendimiento de los ataques realmente vinculados. EFF no es una puntuación individual del colocador.',table(['Colocador','Coloc.','Uso','Destino','Tempo','Atq. enlaz.','Kill/T','EFF','Evidencia'],setterRows))}
   <div class="vc1881-grid2">${panel('Conexión colocador → atacante','Permite detectar qué parejas aparecen y qué resultados tienen sus ataques enlazados.',table(['Colocador','Atacante','Coloc.','Atq. enlaz.','Kill/T','Kill %','EFF','Tempo más usado','Destino más usado','Evidencia'],setterAttackerRows))}${panel('Sistemas ofensivos','Agrupa tempo de colocación, combinación registrada y atacante. Los códigos no se infieren cuando faltan.',table(['Tempo coloc.','Setter call','Tipo DV','Combinación','Atacante','Tempo ataque','Coloc.','Atq. enlaz.','Kill/T','EFF','Evidencia'],systemRows))}</div>
   ${panel('K1, K2 y transiciones','Se usa la fase explícita de la acción cuando existe; si falta, K1/K2 se deriva del equipo que servía al inicio del rally. TR y FB solo se muestran si están codificados.',table(['Fase','Rallies','Coloc.','Atq. enlaz.','Kill/T','EFF','Origen fase','Evidencia'],phaseRows))}
   <div class="vc1881-grid2">${panel('Valoración registrada de la colocación','Distribución literal de la evaluación codificada. No se interpreta como calidad técnica sin una escala definida.',evalStrip)}${panel('Análisis temporal con vídeo','Solo se calcula cuando colocación y ataque tienen marcas de vídeo compatibles en el mismo partido.',timeRows+`<p class="vc1881-note">Los intervalos son diferencias entre marcas de vídeo guardadas en el scouting. No miden la velocidad del balón ni el tiempo biomecánico de vuelo. Se excluyen marcas incompatibles, negativas o separadas por más de 30 segundos.</p>`)}</div>
   <p class="vc1881-method">Método: los ataques se enlazan dentro del mismo rally y hasta la siguiente interrupción por acción rival u otra colocación. Kill = # / ataques vinculados; EFF = (# − = − /) / ataques valorados. Los denominadores se muestran en todas las tablas. Una colocación puede no tener ataque enlazado; no se rellena con una inferencia.</p></div>`;
 }
 const CSS=`
 #vc157-studio .vc1881-root{display:grid;gap:12px;min-width:0;color:#193d59}
 #vc157-studio .vc1881-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 19px;border:1px solid #d6e5f0;border-radius:14px;background:linear-gradient(112deg,#f0f6fc,#fff)}
 #vc157-studio .vc1881-hero span{font:900 9px/1.4 system-ui;letter-spacing:.12em;color:#2870a5}
 #vc157-studio .vc1881-hero h3{margin:4px 0!important;font:850 20px/1.25 system-ui!important;color:#143d5e!important}
 #vc157-studio .vc1881-hero p{margin:0!important;font:500 11px/1.5 system-ui;color:#6a8499}
 #vc157-studio .vc1881-hero>b{flex:none;padding:8px 11px;border-radius:9px;background:#e4f0fa;color:#1b5b8e;font:850 11px system-ui}
 #vc157-studio .vc1881-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:12px;border:1px solid #dce7ef;border-radius:12px;background:#f7fafc}
 #vc157-studio .vc1881-filters label{display:grid;gap:5px;font:800 9px system-ui;color:#5c7890}
 #vc157-studio .vc1881-filters select{width:100%;min-width:0;min-height:37px;border:1px solid #cbdce9;border-radius:8px;padding:7px 9px;background:#fff;color:#244e6d;font:650 11px system-ui}
 #vc157-studio .vc1881-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
 #vc157-studio .vc1881-kpi{min-width:0;display:grid;gap:4px;align-content:start;padding:11px;border:1px solid #dce7ef;border-radius:11px;background:#fff}
 #vc157-studio .vc1881-kpi span{font:850 8px/1.35 system-ui;color:#70889c;text-transform:uppercase;letter-spacing:.04em}
 #vc157-studio .vc1881-kpi strong{font:850 21px/1.2 system-ui;color:#153f60;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 #vc157-studio .vc1881-kpi small{font:500 9px/1.4 system-ui;color:#7890a3}
 #vc157-studio .vc1881-panel{min-width:0;padding:14px;border:1px solid #dce6ee;border-radius:12px;background:#fff;box-shadow:0 4px 15px #123b5908}
 #vc157-studio .vc1881-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
 #vc157-studio .vc1881-panel>header>div{min-width:0}
 #vc157-studio .vc1881-panel>header span{font:900 8px system-ui;letter-spacing:.12em;color:#6b91ad}
 #vc157-studio .vc1881-panel>header h3{margin:3px 0!important;font:850 14px/1.3 system-ui!important;color:#194665!important}
 #vc157-studio .vc1881-panel>header p{margin:0!important;font:500 10px/1.45 system-ui;color:#71899d}
 #vc157-studio .vc1881-panel>header>b{flex:none;padding:5px 8px;border-radius:20px;background:#f0f6fb;color:#3b6d92;font:800 9px system-ui}
 #vc157-studio .vc1881-panel .vc157-tablewrap{width:100%;overflow:auto}
 #vc157-studio .vc1881-panel table{width:100%;min-width:640px;border-collapse:separate;border-spacing:0;font:500 9px/1.4 system-ui}
 #vc157-studio .vc1881-panel th{padding:8px 7px;background:#f3f7fa;color:#5a768d;text-align:left;white-space:nowrap;font-weight:850;border-bottom:1px solid #dce7ef}
 #vc157-studio .vc1881-panel td{padding:8px 7px;color:#3b5c75;border-bottom:1px solid #edf2f6;vertical-align:middle}
 #vc157-studio .vc1881-panel td b{color:#1a4667}
 #vc157-studio .vc1881-panel td button{min-height:26px!important;padding:4px 7px!important;font:800 9px system-ui!important}
 #vc157-studio .vc1881-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:start}
 #vc157-studio .vc1881-evals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
 #vc157-studio .vc1881-evals>div{display:grid;gap:3px;padding:8px 4px;text-align:center;border-radius:8px;background:#f4f8fb}
 #vc157-studio .vc1881-evals b{font:900 14px system-ui;color:#24628f}
 #vc157-studio .vc1881-evals strong{font:850 17px system-ui;color:#183f5d}
 #vc157-studio .vc1881-evals small{font:500 8px system-ui;color:#7890a3}
 #vc157-studio .vc1881-timegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
 #vc157-studio .vc1881-timegrid>div{display:grid;gap:5px;padding:10px;border-radius:9px;background:#f4f8fb}
 #vc157-studio .vc1881-timegrid span{font:800 9px system-ui;color:#6a8499}
 #vc157-studio .vc1881-timegrid strong{font:850 19px system-ui;color:#194765}
 #vc157-studio .vc1881-timegrid small{font:500 9px system-ui;color:#7c91a2}
 #vc157-studio .vc1881-note,#vc157-studio .vc1881-method{margin:9px 0 0;padding:9px 11px;border-left:3px solid #8fb8d5;background:#f4f8fb;color:#647f94;font:500 9px/1.5 system-ui;border-radius:0 7px 7px 0}
 #vc157-studio .vc1881-small-sample{display:block;margin-top:3px;color:#9a713d;font:700 8px system-ui;font-style:normal}
 #vc157-studio .vc1881-empty{padding:14px;border:1px dashed #cbdce8;border-radius:9px;background:#f8fbfd;color:#6f879a;font:600 10px/1.5 system-ui}
 @media(max-width:1150px){#vc157-studio .vc1881-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:850px){#vc157-studio .vc1881-grid2{grid-template-columns:1fr}}
 @media(max-width:620px){#vc157-studio .vc1881-filters{grid-template-columns:1fr}#vc157-studio .vc1881-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1881-kpi{padding:9px}#vc157-studio .vc1881-kpi strong{font-size:18px}#vc157-studio .vc1881-panel{padding:10px}#vc157-studio .vc1881-evals{grid-template-columns:repeat(3,minmax(0,1fr))}#vc157-studio .vc1881-timegrid{grid-template-columns:1fr}}
 `;
 function installStyle(doc){const d=doc||(typeof document!=='undefined'?document:null);if(!d||d.getElementById('vc1881-setter-pro-css'))return;const s=d.createElement('style');s.id='vc1881-setter-pro-css';s.textContent=CSS;d.head.appendChild(s)}
 function renderPage(data,state,tools){installStyle();return render(data,state,tools)}
 return {version:'18.8.1',buildRows,enrich,applyFilters,phaseInfo,videoStamp,compatibleDelta,render,renderPage,installStyle,css:CSS};
});
