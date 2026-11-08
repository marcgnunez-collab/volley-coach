/* Volley Coach V16.2.1 · Analysis Pro · Profundidad táctica y colocador
   Read-only professional workspace. Uses VC_ANALYSIS_INTELLIGENCE_1614.model
   as the sole statistical engine. No match writes and NO PDF template changes. */
(()=>{
'use strict';
if(window.VC_ANALYST_STUDIO_16155)return;
const $=id=>document.getElementById(id), arr=x=>Array.isArray(x)?x:[];
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,digit=1)=>n==null?'—':`${Number(n).toLocaleString('es-ES',{maximumFractionDigits:digit})}%`;
const pct=(a,b)=>b?Math.round(a/b*1000)/10:null;
const signed=n=>n>0?`+${n}`:String(n);
const categories={S:'Saque',R:'Recepción',A:'Ataque',B:'Bloqueo',E:'Colocación',D:'Defensa',F:'Freeball',C:'Cobertura'};
const pages={
 overview:['Resumen','Rendimiento general y lectura táctica'],
 players:['Estadísticas','Hoja individual y fundamentos'],
 tactics:['Táctica','Rotaciones, side-out, K1 / K2 y mapas'],
 setter:['Colocador','Distribución, tempo y secuencias'],
 explorer:['Vídeo y acciones','Busca, filtra y revisa evidencias'],
 season:['Temporada','Comparación de partidos y evolución']
};
const subpages={
 players:[['sheet','Hoja por jugador'],['fundamentals','Fundamentos Pro']],
 tactics:[['rotations','Rotaciones y complejos'],['zones','Zonas y bloqueo']],
 setter:[['distribution','Distribución y destinos'],['details','Tempos y combinaciones']]
};
function inDeepView(){return state.page==='players'&&state.subpage.players==='fundamentals';}
const state={page:'overview',subpage:{players:'sheet',tactics:'rotations',setter:'distribution'},team:'ours',set:'',rotation:'',phase:'',skill:'',rating:'',player:'',match:'',technical:false,deepSkill:'A',deepDim:'player',deepPlayer:'',setterPlayer:'',setterReception:'',setterTempo:'',selected:[],selectedTitle:'Selecciona una cifra de la tabla',loaded:false,draws:0};
let host=null,native=null,view=null;
/* Collect all accessible matches (including finished scouting), without changing
   the active match. A different team or a remote sync may update this list. */
function matches(){
 const result=new Map();
 for(const bridge of [window.VC_SCOUT_REPORT_BRIDGE,window.VC_SCOUT_VIDEO_BRIDGE]){
  try{for(const m of arr(bridge?.getMatches?.()))if(m&&m.id!=null)result.set(String(m.id),m)}catch(err){console.warn('Analyst Studio: matches',err)}
 }
 if(!result.size){
  for(const bridge of [window.VC_SCOUT_REPORT_BRIDGE,window.VC_SCOUT_VIDEO_BRIDGE]){
   try{const m=bridge?.getMatchForAnalysis?.()||bridge?.getActive?.();if(m&&m.id!=null)result.set(String(m.id),m)}catch(_){}
  }
 }
 return [...result.values()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.id||0)-Number(a.id||0));
}
function currentMatch(){
 const list=matches(),selected=String(state.match||'');
 if(selected){
  const hit=list.find(m=>String(m.id)===selected);
  if(hit)return hit;
  // Do not silently switch to the active match when a chosen scouting vanishes.
  return null;
 }
 const nativeId=String($('scout-analysis-match')?.value||'');
 return list.find(m=>String(m.id)===nativeId)||list[0]||null;
}
function setNativeSelection(id){
 if(!native||!id)return;
 const key=String(id);
 // The legacy selector is hidden but is still the match reference for PDF tools.
 if([...native.options].some(o=>o.value===key))native.value=key;
}
function syncSelection(){
 const list=matches();
 if(!list.length){state.match='';return null;}
 const id=String(state.match||'');
 if(id&&list.some(m=>String(m.id)===id))return list.find(m=>String(m.id)===id);
 const saved=String(native?.value||'');
 const chosen=list.find(m=>String(m.id)===saved)||list[0];
 state.match=String(chosen.id);
 return chosen;
}
function scoutedTeam(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function filteredMatch(m){
 if(!state.phase||!m)return m;
 const wanted=state.team==='ours'? (state.phase==='K1'?'opponent':'ours'):(state.phase==='K1'?'ours':'opponent');
 return {...m,sets:arr(m.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===wanted)}))};
}
function dataset(){const api=window.VC_ANALYSIS_INTELLIGENCE_1614,m=currentMatch();if(!api?.model||!m)return null;
 return api.model(filteredMatch(m),scoutedTeam(),{team:state.team,set:state.set,rotation:state.rotation});
}
function selOpts(values,value,all){return `<option value="">${html(all)}</option>${values.map(([k,v])=>`<option value="${html(k)}" ${String(value)===String(k)?'selected':''}>${html(v)}</option>`).join('')}`}
function buildHeader(){
 const ms=matches(),m=syncSelection(),sets=arr(m?.sets).map(s=>[String(s.number),`Set ${s.number}`]);
 const h=$('vc157-match');
 if(h){
  const entries=ms.map(x=>({id:String(x.id),label:`${x.date||'Sin fecha'} · ${x.opponent||'Rival'}${x.status==='finished'?' · Finalizado':''}`}));
  const previous=[...h.options].map(o=>[o.value,o.textContent]);
  if(previous.length!==entries.length||entries.some((e,i)=>previous[i]?.[0]!==e.id||previous[i]?.[1]!==e.label)){
   const f=document.createDocumentFragment();
   if(!entries.length){f.appendChild(new Option('No hay scoutings disponibles',''))}
   else for(const e of entries)f.appendChild(new Option(e.label,e.id));
   h.replaceChildren(f);
  }
  if(m&&h.value!==String(m.id))h.value=String(m.id);
  h.disabled=!entries.length;
  h.title=entries.length?`${entries.length} scouting(s) disponibles`:'Comprueba el equipo seleccionado y los scoutings guardados';
 }
 const setsBox=$('vc157-set');if(setsBox){
  const opts=selOpts(sets,state.set,'Todos');
  if(setsBox.innerHTML!==opts)setsBox.innerHTML=opts;
 }
 const te=$('vc157-team');if(te)te.value=state.team;
 const rot=$('vc157-rotation');if(rot)rot.value=state.rotation;
 const phase=$('vc157-phase');if(phase)phase.value=state.phase;
 const mat=$('vc157-match-label');if(mat)mat.textContent=m?`${m.opponent||'Rival'} · ${m.date||'Sin fecha'} · ${arr(m.sets).length} sets · ${m.status==='finished'?'Finalizado':'En curso'}`:'Selecciona un scouting para comenzar';
 const count=$('vc157-match-count');if(count)count.textContent=`${ms.length} disponibles`;
}
function table(headers,rows,klass=''){return `<div class="vc157-tablewrap"><table class="vc157-table ${klass}"><thead><tr>${headers.map(s=>`<th>${html(s)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="vc157-muted">Sin datos registrados para los filtros actuales.</td></tr>`}</tbody></table></div>`}
function pickButton(label,keys,title,klass=''){const enc=encodeURIComponent(JSON.stringify(keys));return `<button type="button" class="vc157-pick ${klass}" data-pick="${enc}" data-pick-title="${html(title)}">${html(label)}</button>`}
function rowsBy(data,cb){return data.actions.filter(cb)}
function periodLabel(data){return `${data.points.rallies} rallies cerrados · ${data.actions.length} acciones · ${data.videoCount} con referencia temporal`}
function sheetRows(data){
 const grouped=data.playerGroups.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
 const official=window.VC_STATISTICS_1616?.forMatch?.(currentMatch(),state.team,{set:state.set,rotation:state.rotation,phase:state.phase});
 const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 function findOfficial(name){
  const exact=official?.players.find(p=>normalize(p.label)===normalize(name));if(exact)return exact;
  const n=String(name).match(/#(\d+)\b/)?.[1]||String(data.actions.find(a=>a.player===name)?.a?.playerNumberSnapshot||'');
  const found=(official?.players||[]).filter(p=>String(p.label).match(/#(\d+)\b/)?.[1]===n);
  return n&&found.length===1?found[0]:null;
 }
 return grouped.map(p=>{
  const s=p.skills,serve=s.S||{},rec=s.R||{},attack=s.A||{},block=s.B||{};
  const sp=(serve.kills||0)-(serve.errors||0),ap=(attack.kills||0),ae=attack.errors||0,ab=attack.blocked||0;
  const canonical=findOfficial(p.name);
  const pts=canonical?.points.won??((serve.kills||0)+ap+(block.kills||0)),gp=canonical?.points.gp??(pts-(serve.errors||0)-ae-ab-(block.errors||0));
  const serveGP=canonical?.serve.gp??sp,recPct=canonical?.receive.positivePct??rec.positivePct,atkEff=canonical?.attack.efficiencyPct??attack.eff;

  const playerActions=rowsBy(data,r=>r.player===p.name);
  const keys=playerActions.map(r=>r.key);
  const by=(predicate)=>playerActions.filter(predicate).map(r=>r.key);
  const officialKeys=names=>{
   const refs=names.flatMap(name=>canonical?.points?.[name]||[]);
   return playerActions.filter(a=>refs.some(p=>Number(a.set)===p.set&&Number(a.r.index)===p.rallyIndex&&String(a.a.id)===String(p.id))).map(a=>a.key);
  };
  const direct=r=>['S','A','B'].includes(r.skill)&&r.ev==='#';
  const gpRelevant=r=>direct(r)||(r.skill==='S'&&r.ev==='=')||(r.skill==='A'&&['=','/'].includes(r.ev))||(r.skill==='B'&&r.ev==='=');
  const cell=(n,label,chosen)=>`<td>${pickButton(n,chosen,`${label} · ${p.name}`)}</td>`;
  return `<tr><td class="vc157-player">${pickButton(p.name,keys,`Todas las acciones · ${p.name}`,'vc157-namelink')}</td><td>${p.n}</td>${cell(''+pts,'Puntos directos',canonical?officialKeys(['wonActions']):by(direct))}${cell(''+signed(gp),'G-P oficial',canonical?officialKeys(['wonActions','lostActions']):by(gpRelevant))}${cell(''+signed(serveGP),'Saque G-P',by(r=>r.skill==='S'&&['#','='].includes(r.ev)))}<td>${pickButton(fmt(recPct),by(r=>r.skill==='R'&&['#','+'].includes(r.ev)),`Recepciones positivas · ${p.name}`)}<small>${rec.positive||0}/${rec.n||0}</small></td><td>${pickButton(`${rec.perfect||0}/${rec.n||0}`,by(r=>r.skill==='R'&&r.ev==='#'),`Recepciones perfectas · ${p.name}`)}</td><td>${pickButton(`${ap}/${attack.n||0}`,by(r=>r.skill==='A'&&r.ev==='#'),`Ataques punto · ${p.name}`)}</td><td>${pickButton(`${ae}+${ab}`,by(r=>r.skill==='A'&&['=','/'].includes(r.ev)),`Errores y ataques bloqueados · ${p.name}`)}</td><td>${pickButton(fmt(atkEff),by(r=>r.skill==='A'),`Todos los ataques · ${p.name}`)}</td><td>${pickButton(''+(block.kills||0),by(r=>r.skill==='B'&&r.ev==='#'),`Bloqueos punto · ${p.name}`)}</td></tr>`;
 }).join('');
}
function pagePlayers(data){return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Hoja individual · G-P y eficiencia</h3><p>Una fila por jugador y todas las acciones del filtro. Pulsa un jugador o una cifra para inspeccionar sus jugadas.</p></div><span class="vc157-tag">${data.playerGroups.length} jugadores</span></div>
 ${table(['Jugador','Acc.','PTS','G-P','Saq. G-P','Rec. +/#','Rec. #','Ataque #','Err+BLO','Atq. EFF','Bloq. #'],sheetRows(data),'vc157-sheet')}
 <p class="vc157-note">PTS y G-P = atribución terminal de la Hoja Oficial; máximo una acción terminal por rally. Recepción +/# = (# + +)/total; eficiencia de ataque = (# − = − /)/ataques. Revisa los denominadores antes de comparar.</p></div>
 <div class="vc157-grid2"><div class="vc157-panel"><h3>Acciones registradas por fundamento</h3>${table(['Fundamento','Total','Positivas','Errores','Vídeo'],Object.entries(categories).map(([s,n])=>{const g=data.skills[s],rows=rowsBy(data,r=>r.skill===s);if(!g?.n)return'';return `<tr><td>${n}</td><td>${g.n}</td><td>${g.positive||0}</td><td>${g.errors||0}</td><td>${pickButton('Ver',rows.map(x=>x.key),n)}</td></tr>`}).join(''))}</div></div>`}
function pageOverview(data){
 const p=data.points,rec=data.skills.R||{},atk=data.skills.A||{};
 const tiles=[['Side-out K1',fmt(p.k1.pct),`${p.k1.w}/${p.k1.n} rallies`,'K1'],['Break K2',fmt(p.k2.pct),`${p.k2.w}/${p.k2.n} rallies`,'K2'],['Recepción +/#',fmt(rec.positivePct),`${rec.positive||0}/${rec.n||0} acciones`,'R'],['Ataque EFF',fmt(atk.eff),`${atk.kills||0} − ${atk.errors||0} − ${atk.blocked||0} / ${atk.n||0}`,'A']];
 const insights=window.VC_ANALYSIS_INTELLIGENCE_1614?.insights?.(data)||[];
 return `<div class="vc157-metrics">${tiles.map(([n,v,s,c])=>`<div class="vc157-metric"><span>${n}</span><strong>${v}</strong><small>${s}</small>${pickButton('Ver jugadas',data.actions.filter(a=>(c==='K1'?a.r.serving&&a.r.serving!==data.target:c==='K2'?a.r.serving===data.target:a.skill===c)).map(x=>x.key),n)}</div>`).join('')}</div>
 <div class="vc157-grid2"><div class="vc157-panel"><h3>Lectura táctica</h3>${insights.map(i=>`<div class="vc157-insight"><b>${html(i.title)}</b><p>${html(i.detail)}</p><small>${html(i.how)}</small></div>`).join('')||'<p>No se detectan patrones suficientemente respaldados por la muestra.</p>'}</div>
 <div class="vc157-panel"><h3>Calidad del registro</h3><div class="vc157-statline"><span>Rallies válidos</span><b>${p.rallies}</b></div><div class="vc157-statline"><span>Acciones codificadas</span><b>${data.actions.length}</b></div><div class="vc157-statline"><span>Acciones con vídeo</span><b>${data.videoCount}/${data.actions.length}</b></div><div class="vc157-statline"><span>Rallies sin saque registrado</span><b>${data.unknownServe}</b></div><p class="vc157-note">Las hipótesis son descriptivas. Sin muestra suficiente, no se infiere causa táctica.</p></div></div>`;
}
// Tactical and setter analysis only read normalized actions from the 16.1.4 engine.
// A coded receiver/tempo/target is required to assign contextual categories.
const setterText=v=>v==null||String(v).trim()===''?'Sin registrar':String(v).trim();
const setterZone=v=>{const m=String(v??'').trim().toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?m[1]:null};
const setterRec=p=>['#','+'].includes(p.recEval)?'Positiva / perfecta':p.recEval?'Otra recepción':'Sin recepción registrada';
const pairKeys=p=>[p.set?.key,p.attack?.key].filter(Boolean);
const attackStats=(items)=>{const attacks=items.filter(Boolean);return {n:attacks.length,k:attacks.filter(a=>a.ev==='#').length,e:attacks.filter(a=>a.ev==='=').length,b:attacks.filter(a=>a.ev==='/').length}};
const effStat=s=>fmt(pct(s.k-s.e-s.b,s.n));
function tabRows(grouped,valueName,keysName){return [...grouped].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es')).map(([name,items])=>({name,items,att:attackStats(items.map(x=>x.attack)),keys:items.flatMap(pairKeys)}))}
function groupedBy(items,label){const map=new Map();for(const item of items){const key=setterText(label(item));if(!map.has(key))map.set(key,[]);map.get(key).push(item)}return tabRows(map)}
function pageRotations(data){
 const rows=data.rotations.map(r=>{
  const rRows=data.actions.filter(a=>a.r&&(data.target==='ours'?a.r.rotation:a.r.opponentRotation)===r.rotation);
  const att=rRows.filter(a=>a.skill==='A'),at=attackStats(att),gp=2*r.won-r.rallies;
  const rr=data.chains.filter(c=>(data.target==='ours'?c.r.rotation:c.r.opponentRotation)===r.rotation);
  const recCount=rr.length,recGood=rr.filter(c=>c.positive).length;
  return `<tr><td class="vc157-strong">R${r.rotation}</td><td>${r.k1.w}/${r.k1.n}</td><td><div class="vc157-cellbar"><i style="width:${r.k1.pct||0}%"></i></div>${fmt(r.k1.pct)}</td><td>${r.k2.w}/${r.k2.n}</td><td>${fmt(r.k2.pct)}</td><td>${r.rallies}</td><td>${signed(gp)}</td><td>${recGood}/${recCount}<small>${fmt(pct(recGood,recCount))}</small></td><td>${at.k}/${at.n}<small>${effStat(at)} EFF</small></td><td>${pickButton('Ver',rRows.map(a=>a.key),`Rotación R${r.rotation}`)}</td></tr>`;
 }).join('');
 const validK1=data.rallies.filter(r=>r.winning&&r.serving&&r.serving!==data.target);
 const withRec=new Set(data.chains.map(c=>c.r));
 const quality=[['#','Perfecta'],['+','Positiva'],['!','Neutra'],['-','Negativa'],['/','Mala /'],['=','Error =']].map(([ev,label])=>{
  const list=data.chains.filter(c=>c.rec.ev===ev),w=list.filter(c=>c.outcome).length;
  const attacks=list.map(c=>c.attack).filter(Boolean),st=attackStats(attacks);
  return `<tr><td>${label} <small>${html(ev)}</small></td><td>${list.length}</td><td>${w}/${list.length}</td><td>${fmt(pct(w,list.length))}</td><td>${st.k}/${st.n}</td><td>${effStat(st)}</td><td>${pickButton('Ver',list.map(c=>c.rec.key),`Recepción ${ev} en K1`)}</td></tr>`;
 }).join('');
 const knownK1=data.chains.length,miss=Math.max(0,validK1.length-knownK1);
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Rotaciones · rendimiento real por complejo</h3><p>K1 y K2 por rally resuelto. Recepción y ataque se calculan sobre acciones codificadas, no sobre todos los rallies.</p></div><span class="vc157-tag">${data.points.rallies} rallies</span></div>
 ${table(['Rot.','K1 G/T','K1 %','K2 G/T','K2 %','Rallies','G-P','Rec. +/#','Ataque # / EFF','Acciones'],rows)}
 <p class="vc157-note">G-P de esta tabla = rallies ganados menos perdidos. Rec. +/# y ataque pueden estar incompletos si el scouting no registra todas las acciones; un rally se cuenta una sola vez para K1/K2.</p></div>
 <div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Side-out según la recepción</h3><p>Comparación por calidad de la primera recepción registrada en cada rally de K1.</p></div><span class="vc157-tag">${knownK1}/${validK1.length} K1 con recepción</span></div>
 ${table(['Recepción','Rallies','Ganados','Side-out','Ataques #/T','Ataque EFF','Jugadas'],quality)}
 <p class="vc157-note">${miss} rallies de K1 sin recepción codificada quedan fuera de esta comparación. Las filas sin observaciones muestran «—» en los porcentajes. La asociación recepción–ataque no demuestra causalidad.</p></div>`;
}
function setterPairsView(data){
 return data.pairs.filter(p=>
  (!state.setterPlayer||p.set.player===state.setterPlayer)&&
  (!state.setterReception||setterRec(p)===state.setterReception)&&
  (!state.setterTempo||setterText(p.set.a.setTempo)===state.setterTempo));
}
function setterFilters(data){
 const players=[...new Set(data.pairs.map(p=>p.set.player))].sort((a,b)=>a.localeCompare(b,'es'));
 const tempos=[...new Set(data.pairs.map(p=>setterText(p.set.a.setTempo)))].sort((a,b)=>a.localeCompare(b,'es'));
 const rec=['Positiva / perfecta','Otra recepción','Sin recepción registrada'];
 return `<div class="vc1621-setterfilters"><label>Colocador<select id="vc1621-setter-player">${selOpts(players.map(v=>[v,v]),state.setterPlayer,'Todos los colocadores')}</select></label>
 <label>Recepción previa<select id="vc1621-setter-reception">${selOpts(rec.map(v=>[v,v]),state.setterReception,'Todas / K1 y transición')}</select></label>
 <label>Tempo colocación<select id="vc1621-setter-tempo">${selOpts(tempos.map(v=>[v,v]),state.setterTempo,'Todos los tempos')}</select></label></div>`;
}
function setterSummary(data,items){
 const linked=items.filter(p=>p.attack),s=attackStats(linked.map(p=>p.attack));
 const target=items.filter(p=>setterZone(p.set.a.setTarget)||setterText(p.set.a.setTarget)!=='Sin registrar').length;
 const tempos=items.filter(p=>setterText(p.set.a.setTempo)!=='Sin registrar').length;
 const sample=[['Colocaciones',items.length,`De ${data.pairs.length} del scouting filtrado`],['Ataque vinculado',`${linked.length}/${items.length}`,fmt(pct(linked.length,items.length))],['Destino registrado',`${target}/${items.length}`,fmt(pct(target,items.length))],['Tempo registrado',`${tempos}/${items.length}`,fmt(pct(tempos,items.length))]];
 return `<div class="vc1621-metrics">${sample.map(([name,value,detail])=>`<div><span>${html(name)}</span><strong>${html(value)}</strong><small>${html(detail)}</small></div>`).join('')}</div><p class="vc157-note">El primer ataque del equipo tras la colocación se vincula solo si no ha intervenido antes el rival u otra colocación. Kill: ${s.k}/${s.n}; EFF: ${effStat(s)}. No representa necesariamente todas las oportunidades de ataque del rally.</p>`;
}
function pageDistribution(data){
 const pairs=setterPairsView(data),bySetter=groupedBy(pairs,p=>p.set.player);
 const byDest=groupedBy(pairs,p=>p.set.a.setTarget),total=pairs.length;
 const setterRows=bySetter.map(g=>`<tr><td>${pickButton(g.name,g.keys,`Colocaciones de ${g.name}`)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,total))}</td><td>${g.att.n}/${g.items.length}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Distribución · ${g.name}`)}</td></tr>`).join('');
 const destRows=byDest.map(g=>`<tr><td>${html(g.name)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,total))}</td><td>${g.att.n}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Destino ${g.name}`)}</td></tr>`).join('');
 const inZones=pairs.filter(p=>setterZone(p.set.a.setTarget)),validCount=inZones.length;
 const court=[4,3,2,7,8,9,5,6,1].map(z=>{const here=inZones.filter(p=>setterZone(p.set.a.setTarget)===String(z));return `<button class="vc1621-zone" type="button" data-pick="${encodeURIComponent(JSON.stringify(here.flatMap(pairKeys)))}" data-pick-title="Colocaciones a Z${z}"><b>Z${z}</b><strong>${here.length}</strong><small>${fmt(pct(here.length,validCount))}</small></button>`}).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Distribución por colocador</h3><p>Se agrupan colocaciones reales y ataques posteriores vinculados a la misma posesión.</p></div><span class="vc157-tag">${data.pairs.length} colocaciones</span></div>${setterFilters(data)}${setterSummary(data,pairs)}${table(['Colocador','Total','Uso','Ataques vinculados','Kill','EFF','Evidencias'],setterRows)}</div>
 <div class="vc157-grid2"><div class="vc157-panel"><h3>Mapa de destinos de la colocación</h3><p>${validCount}/${total} colocaciones con zona Z1–Z9 explícita. Pulsa una zona para inspeccionar acciones.</p><div class="vc1621-court">${court}</div><p class="vc157-note">Los destinos no zonales (combinaciones o texto libre) aparecen en la tabla, pero no se sitúan artificialmente en la pista.</p></div><div class="vc157-panel"><h3>Destinos registrados y eficacia</h3>${table(['Destino','Uso','%','Ataques','Kill','EFF','Acciones'],destRows)}<p class="vc157-note">«Sin registrar» significa que no se escribió destino. La efectividad se refiere únicamente a los ataques vinculados, no a las colocaciones sin ataque.</p></div></div>`;
}
function pageSetterDetails(data){
 const pairs=setterPairsView(data),n=pairs.length;
 const tempo=groupedBy(pairs,p=>p.set.a.setTempo);
 const tempoRows=tempo.map(g=>`<tr><td>${html(g.name)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,n))}</td><td>${g.att.n}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Tempo ${g.name}`)}</td></tr>`).join('');
 const attacks=groupedBy(pairs,p=>p.attack?.player||'Sin ataque vinculado');
 const attackRows=attacks.map(g=>`<tr><td>${html(g.name)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,n))}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Colocaciones hacia ${g.name}`)}</td></tr>`).join('');
 const combos=groupedBy(pairs,p=>p.set.a.attackCombo||p.attack?.a.attackCombo);
 const comboRows=combos.map(g=>`<tr><td>${html(g.name)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,n))}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Combinación ${g.name}`)}</td></tr>`).join('');
 const ctx=groupedBy(pairs,p=>setterRec(p));
 const recRows=ctx.map(g=>`<tr><td>${html(g.name)}</td><td>${g.items.length}</td><td>${g.att.n}</td><td>${g.att.k}/${g.att.n}</td><td>${effStat(g.att)}</td><td>${pickButton('Ver',g.keys,`Contexto ${g.name}`)}</td></tr>`).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Tempos, atacantes y combinaciones</h3><p>Filtros cruzados con colocador, recepción y tempo. Cada fila contiene las acciones que permiten verificar el cálculo.</p></div><span class="vc157-tag">${n} colocaciones</span></div>${setterFilters(data)}${setterSummary(data,pairs)}</div>
 <div class="vc157-grid2"><div class="vc157-panel"><h3>Tempo declarado por el colocador</h3>${table(['Tempo','Coloc.','Uso','Ataques','Kill','EFF','Acciones'],tempoRows)}<p class="vc157-note">Solo se utiliza «setTempo» registrado en la colocación. No se sustituye por el tempo del ataque ni se adivina por el destino.</p></div>
 <div class="vc157-panel"><h3>Atacante después de la colocación</h3>${table(['Atacante','Secuencias','Uso','Kill','EFF','Acciones'],attackRows)}<p class="vc157-note">Un atacante sin codificar no se atribuye a otra persona. Se diferencia del atacante que no llegó a ejecutar una acción codificada.</p></div>
 <div class="vc157-panel"><h3>Combinación codificada</h3>${table(['Combinación','Coloc.','Uso','Kill','EFF','Acciones'],comboRows)}<p class="vc157-note">Se muestra el código «attackCombo» de la colocación o del ataque posterior, si existe. No se confunde con la zona de destino.</p></div>
 <div class="vc157-panel"><h3>Contexto de recepción</h3>${table(['Recepción','Coloc.','Ataques','Kill','EFF','Acciones'],recRows)}<p class="vc157-note">Sin recepción registrada puede ser transición K2, un rally incompleto o una recepción omitida. No se etiqueta automáticamente como recepción negativa.</p></div></div>`;
}
function pageZones(data){
 const zones=new Map(data.zoneCounts),tot=data.zoneCounts.reduce((n,[,items])=>n+items.length,0);
 const body=[4,3,2,7,8,9,5,6,1].map(z=>{const rows=zones.get(String(z))||[],clickRows=rows.map(r=>r.key);return `<button class="vc157-zone" data-pick="${encodeURIComponent(JSON.stringify(clickRows))}" data-pick-title="Ataques en Z${z}"><b>Z${z}</b><strong>${rows.length}</strong><small>${fmt(pct(rows.length,tot))}</small><i style="opacity:${Math.max(.08,Math.min(.55,rows.length/Math.max(1,tot)*2.5))}"></i></button>`}).join('');
 const blMap=new Map();for(const r of data.attacks){const k=r.a.blockers==null||r.a.blockers===''?'Sin registrar':String(r.a.blockers);if(!blMap.has(k))blMap.set(k,[]);blMap.get(k).push(r)}
 const blockers=[...blMap].map(([k,rows])=>{const kill=rows.filter(a=>a.ev==='#').length,neg=rows.filter(a=>a.ev==='='||a.ev==='/').length;return `<tr><td>${html(k)}</td><td>${rows.length}</td><td>${fmt(pct(kill,rows.length))}</td><td>${fmt(pct(kill-neg,rows.length))}</td><td>${pickButton('▶',rows.map(a=>a.key),`Bloqueadores ${k}`)}</td></tr>`}).join('');
 return `<div class="vc157-grid2"><div class="vc157-panel"><h3>Destinos de ataque · pista 9×4</h3><p>${tot}/${data.attacks.length} ataques tienen una zona registrada. Pulsa una zona para ver sus acciones.</p><div class="vc157-court">${body}</div><p class="vc157-note">Subzonas A–D disponibles en los datos originales y exportaciones; aquí se agregan a las nueve zonas para facilitar la lectura.</p></div><div class="vc157-panel"><h3>Ataque según bloqueo rival</h3>${table(['Bloqueadores','Ataques','Kill %','EFF','Vídeo'],blockers)}<p class="vc157-note">Se incluyen únicamente las características codificadas. Sin datos registrados, no se inventa el tipo de bloqueo.</p></div></div>`;
}
function pageSeason(){
 const api=window.VC_ANALYSIS_INTELLIGENCE_1614;
 const all=matches();
 if(!all.length)return '<div class="vc157-panel"><h3>Temporada</h3><p>No hay scoutings disponibles en el equipo seleccionado.</p></div>';
 // Visible window explicitly bounded for responsiveness on mobile devices.
 const recent=all.slice(0,12),history=[];
 for(const match of recent){
  try{
   const d=api.model(filteredMatch(match),scoutedTeam(),{team:state.team});
   const p=d.points,at=d.skills.A||{},rec=d.skills.R||{};
   history.push({match,id:String(match.id),p,at,rec,actions:d.actions.length});
  }catch(e){console.warn('Analysis Pro temporada: no se pudo analizar un partido',match.id,e)}
 }
 if(!history.length)return '<div class="vc157-panel"><p>No hay partidos interpretables para construir la comparativa.</p></div>';
 const total=(selector)=>history.reduce((sum,x)=>sum+selector(x),0);
 const k1W=total(x=>x.p.k1.w),k1N=total(x=>x.p.k1.n),k2W=total(x=>x.p.k2.w),k2N=total(x=>x.p.k2.n);
 const rallies=total(x=>x.p.rallies),wins=total(x=>x.p.won||0),atN=total(x=>x.at.n||0),atKills=total(x=>x.at.kills||0),atNeg=total(x=>(x.at.errors||0)+(x.at.blocked||0));
 const overall=[['Partidos analizados',history.length,'Últimos scoutings disponibles'],['Rallies',rallies,'Cerrados y válidos'],['K1 · Side-out',fmt(pct(k1W,k1N)),`${k1W}/${k1N} oportunidades`],['K2 · Break',fmt(pct(k2W,k2N)),`${k2W}/${k2N} oportunidades`],['Ataque EFF',fmt(pct(atKills-atNeg,atN)),`${atKills} − ${atNeg} / ${atN} ataques`]];
 const rows=history.map(({match,id,p,at,rec,actions},index)=>{
  const gp=p.rallies?`${signed(2*(p.won||0)-p.rallies)}`:'—';
  const link=`<button type="button" class="vc157-season-link" data-season-match="${html(id)}" title="Abrir scouting ${html(match.opponent||'Rival')}">${html(match.opponent||'Rival')} <span>↗</span></button>`;
  return `<tr><td>${link}<small>${html(match.date||'Sin fecha')}</small></td><td>${p.rallies}</td><td>${gp}</td><td>${p.k1.w}/${p.k1.n} <small>${fmt(p.k1.pct)}</small></td><td>${p.k2.w}/${p.k2.n} <small>${fmt(p.k2.pct)}</small></td><td>${fmt(at.eff)}</td><td>${fmt(rec.positivePct)}</td><td>${actions}</td></tr>`;
 }).join('');
 const trend=history.slice().reverse().map(({match,p})=>{
  const val=p.k1.pct;
  return `<div class="vc1620-trendrow"><span>${html(match.opponent||'Rival')}</span><div class="vc1620-track"><i style="width:${val==null?0:Math.max(0,Math.min(100,val))}%"></i></div><b>${fmt(val)}</b><small>${p.k1.w}/${p.k1.n}</small></div>`;
 }).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Evolución de los últimos ${history.length} scoutings</h3><p>Comparativa del equipo ${state.team==='ours'?'propio':'rival'} · ${state.phase?'Filtro '+state.phase+' aplicado a esta consulta':'K1 y K2 completos'}. En esta vista no se aplican los filtros de set y rotación del partido individual.</p></div><span class="vc157-tag">${all.length} disponibles</span></div>
 <div class="vc1620-season-metrics">${overall.map(([name,value,note])=>`<div><span>${name}</span><strong>${value}</strong><small>${note}</small></div>`).join('')}</div></div>
 <div class="vc157-panel"><h3>Comparación entre partidos</h3>${table(['Partido','Rallies','G-P','K1','K2','Atq. EFF','Rec. +/#','Acciones'],rows)}<p class="vc157-note">Selecciona el nombre de un partido para abrir su resumen. G-P = rallies ganados menos perdidos; no equivale a G-P de puntos directos por jugador.</p></div>
 <div class="vc157-panel"><h3>Tendencia de side-out K1</h3><div class="vc1620-trend">${trend}</div><p class="vc157-note">Porcentajes descriptivos, sin promediar porcentajes de partidos. El agregado utiliza los denominadores. No atribuye causalidad ni compara rivales de distinta dificultad.</p></div>`;
}
function pageExplorer(data){
 const players=[...new Set(data.actions.map(x=>x.player))].sort((a,b)=>a.localeCompare(b,'es'));
 const f=state;
 const selection=data.actions.filter(a=>(!f.player||a.player===f.player)&&(!f.skill||a.skill===f.skill)&&(!f.rating||a.ev===f.rating));
 const tr=selection.slice(0,150).map(a=>`<tr><td>${a.set}</td><td>${a.r.index}</td><td>${html(a.player)}</td><td>${html(categories[a.skill]||a.skill)}</td><td>${html(a.ev)}</td><td><code>${html(a.code)}</code></td><td>${a.video?'Vinculada':'Sin marca'}</td><td>${pickButton('▶', [a.key],`${a.code} · ${a.player}`)}</td></tr>`).join('');
 return `<div class="vc157-panel"><h3>Explorador de acciones</h3><div class="vc157-explorer-filters"><label>Jugador<select id="vc157-player">${selOpts(players.map(x=>[x,x]),f.player,'Todos')}</select></label><label>Fundamento<select id="vc157-skill">${selOpts(Object.entries(categories).map(([k,v])=>[k,v]),f.skill,'Todos')}</select></label><label>Valoración<select id="vc157-rating">${selOpts(['#','+','!','-','/','='].map(x=>[x,x]),f.rating,'Todas')}</select></label></div><p>${selection.length} coincidencias · ${selection.filter(a=>a.video).length} con referencia de vídeo · ${pickButton('▶ Seleccionar todas',selection.map(a=>a.key),'Búsqueda combinada')}</p>${table(['Set','Rally','Jugador','Fundamento','Eval.','Código','Vídeo','Abrir'],tr)}${selection.length>150?'<p class="vc157-note">Se muestran las primeras 150 filas. La selección puede incluir todas las coincidencias.</p>':''}</div>`;
}
let deepLoading=null,deepLoadError='';
function pageDeep(data,surface){
 const api=window.VC_ALL_SKILLS_1617;
 if(api?.render){
  try{
   api.installStyle();
   surface.innerHTML=api.render(data,{skill:state.deepSkill,dimension:state.deepDim,player:state.deepPlayer},{pickButton,table,html});
  }catch(e){console.error('Fundamentos Pro',e);surface.innerHTML='<div class="vc157-panel">No se puede mostrar este análisis. Revisa la disponibilidad del módulo de fundamentos.</div>'}
  return;
 }
 surface.innerHTML=`<div class="vc157-panel"><h3>Fundamentos Pro</h3><p>${deepLoadError?'No se ha podido cargar el módulo de análisis detallado.':'Preparando los desgloses de todos los fundamentos…'}</p>${deepLoadError?'<button id="vc171-retry" type="button">Reintentar</button>':''}</div>`;
 if(deepLoading||deepLoadError)return;
 deepLoading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='./126-vc1617-all-skills-analytics.js?v=16.1.7';script.defer=true;
  script.onload=()=>resolve(true);
  script.onerror=()=>reject(new Error('No se pudo descargar el módulo Fundamentos Pro'));
  document.body.appendChild(script);
 });
 deepLoading.then(()=>{deepLoading=null;if(inDeepView()&&!state.technical)renderPage()})
  .catch(err=>{deepLoading=null;deepLoadError=String(err.message||err);console.warn('Fundamentos Pro',err);if(inDeepView()&&!state.technical)renderPage()});
}
function renderPage(){
 if(!state.loaded||state.technical)return;
 const surface=$('vc157-content');if(!surface)return;
 const studio=$('vc157-studio');if(studio){studio.dataset.vc1620Setter=String(state.page==='setter'&&state.subpage.setter==='details');studio.dataset.vc1620Season=String(state.page==='season');}
 const heading=$('vc157-section-title');if(heading)heading.textContent=pages[state.page]?.[0]||'Resumen';
 const meta=$('vc157-sample');
 document.querySelectorAll('#vc157-tabs [data-section]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.section===state.page)));
 const sub=$('vc1620-subtabs');
 if(sub){
  const options=subpages[state.page]||[];
  sub.hidden=options.length===0;
  sub.innerHTML=options.map(([key,label])=>`<button type="button" data-subpage="${key}" aria-pressed="${state.subpage[state.page]===key}">${html(label)}</button>`).join('');
 }
 if(state.page==='season'){
  if(meta)meta.textContent=`${matches().length} scoutings disponibles · Comparativa de partidos`;
  surface.innerHTML=pageSeason();state.draws++;return;
 }
 const data=dataset();
 if(!data){surface.innerHTML='<div class="vc157-empty">Selecciona un scouting para empezar el análisis.</div>';if(meta)meta.textContent='Sin scouting disponible';return;}
 if(meta)meta.textContent=periodLabel(data);
 const page=state.page,subpage=state.subpage[page];
 if(inDeepView()){
  pageDeep(data,surface);
 }else if(page==='overview')surface.innerHTML=pageOverview(data);
 else if(page==='players')surface.innerHTML=pagePlayers(data);
 else if(page==='tactics')surface.innerHTML=subpage==='zones'?pageZones(data):pageRotations(data);
 else if(page==='setter')surface.innerHTML=subpage==='details'?pageSetterDetails(data):pageDistribution(data);
 else if(page==='explorer')surface.innerHTML=pageExplorer(data);
 state.draws++;
}
function selectKeys(keys,title){
 const data=dataset();if(!data)return;
 const keyset=new Set(keys),selection=data.actions.filter(x=>keyset.has(x.key));
 state.selected=selection;state.selectedTitle=title||'Jugadas seleccionadas';renderInspector();
}
function renderInspector(){
 const out=$('vc157-inspector-content');if(!out)return;
 const rows=state.selected,video=rows.filter(r=>r.video),title=$('vc157-inspector-title');if(title)title.textContent=state.selectedTitle;
 out.innerHTML=rows.length?`<p><b>${rows.length}</b> acciones · <b>${video.length}</b> con marca de vídeo</p><div class="vc157-inspector-list">${rows.slice(0,45).map(r=>`<div class="vc157-inspector-item"><div><b>${html(r.code||r.skill+r.ev)}</b><small>Set ${r.set} · ${html(r.player)}</small></div><span>${r.video?'Vídeo':'Sin tiempo'}</span></div>`).join('')}</div>${rows.length>45?'<p>Se muestran las primeras 45 acciones.</p>':''}`:'<p>Selecciona una cifra, rotación, zona o jugada para ver las acciones que forman ese resultado.</p>';
 const btn=$('vc157-video');if(btn)btn.disabled=!video.length;
}
function openVideo(){
 const m=currentMatch(),keys=state.selected.filter(a=>a.video).map(x=>x.key);
 if(!m||!keys.length)return;
 const api=window.VC_VIDEO_ANALYTICS_1612;
 if(!api?.openKeys){const note=$('vc157-inspector-note');if(note)note.textContent='Video Analytics no está disponible en esta versión.';return;}
 try{const ok=api.openKeys(m.id,keys);if(!ok){const note=$('vc157-inspector-note');if(note)note.textContent='No se ha podido abrir la selección de vídeo.';}}catch(e){console.warn('Analyst Studio video',e)}
}
function exportFile(ext){
 if(ext==='csv-official'){
  const core=window.VC_STATISTICS_1616,match=currentMatch();if(!core?.csvForMatch||!match)return;
  const csv=core.csvForMatch(match,state.team,{set:state.set,rotation:state.rotation,phase:state.phase});
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`volley-coach-hoja-${match.id}-${state.team}.csv`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);return;
 }
 const api=window.VC_ANALYSIS_INTELLIGENCE_1614;
 const data=dataset(),match=currentMatch();if(!api||!data||!match)return;
 const filename=`volley-coach-analyst-${match.id||'partido'}-${state.team}-${state.phase||'todos'}`;
 let body,mime;
 if(ext==='csv'){
  // Reuse the V16.1.4 canonical CSV field names, ordering and escaping.
  body=api.rowsExport(data);mime='text/csv;charset=utf-8';
 }else{
  body=JSON.stringify({version:'16.1.5.5',engine:'16.1.4',matchId:match.id,
    filters:{team:state.team,set:state.set,rotation:state.rotation,phase:state.phase},
    metrics:{points:data.points,skills:data.skills,rotations:data.rotations,coverage:data.quality},
    definitions:{k1:'rallies ganados recibiendo / oportunidades de recepción',k2:'rallies ganados al saque / oportunidades de saque',
      attackEff:'(ataques # − errores = − ataques bloqueados /) / ataques',gpRallies:'rallies ganados − perdidos'},
    note:'Exportación de lectura avanzada. La Hoja Oficial PDF es independiente y no se ha modificado.'},null,2);
  mime='application/json;charset=utf-8';
 }
 const url=URL.createObjectURL(new Blob([body],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=filename+'.'+ext;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function switchMode(technical){
 state.technical=!!technical;
 view.dataset.vc157Mode=technical?'technical':'studio';
 const studio=$('vc157-studio');if(studio)studio.hidden=!!technical;
 const base=$('vc1614-view-switch');
 base?.querySelector(`[data-mode="${technical?'technical':'intelligence'}"]`)?.click();

 if(technical){
  setNativeSelection(state.match);
  // Only the technical view runs the legacy (expensive) render pipeline.
  try{window.scoutRenderAnalysis?.()}catch(err){console.warn('Analyst Studio technical analysis',err)}
 }else refresh();
}
function refresh(){
 if(!view?.classList.contains('active')||!state.loaded||state.technical)return;
 buildHeader();renderPage();
}
function mount(){
 view=$('scout-analysis');native=$('scout-analysis-match');if(!view||!native||!window.VC_ANALYSIS_INTELLIGENCE_1614?.model)return false;
 if($('vc157-studio')){state.loaded=true;return true;}
 const style=document.createElement('style');style.id='vc157-style';style.textContent=CSS;document.head.appendChild(style);
 host=document.createElement('div');host.id='vc157-studio';host.className='vc157-studio';host.innerHTML=`<div class="vc157-top"><div><span class="vc157-eyebrow">VOLLEY COACH / ANALYSIS PRO 2.1</span><h2>Centro de análisis</h2><p id="vc157-match-label">Datos conectados a Scouting Pro y al vídeo</p></div><div class="vc157-actions"><button id="vc157-official" class="vc157-pdf" title="Exportación oficial sin cambios">PDF oficial</button><button id="vc157-propdf">PDF análisis</button></div></div>
 <div class="vc157-filterbar"><label class="vc157-match-field">Scouting <span id="vc157-match-count" class="vc157-match-count"></span><select id="vc157-match" aria-label="Seleccionar scouting del análisis"></select></label><button type="button" id="vc157-refresh-matches" title="Actualizar lista de scoutings">↻ Actualizar</button><label>Equipo<select id="vc157-team"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label>Set<select id="vc157-set"></select></label><label>Rotación<select id="vc157-rotation">${selOpts([1,2,3,4,5,6].map(n=>[n,'R'+n]),'','Todas')}</select></label><label>Complejo<select id="vc157-phase"><option value="">K1 + K2</option><option value="K1">K1 · Side-out</option><option value="K2">K2 · Break</option></select></label></div>
 <div class="vc157-work"><nav id="vc157-tabs" class="vc157-tabs" aria-label="Espacios de análisis">${Object.entries(pages).map(([k,[v,sub]])=>`<button type="button" data-section="${k}" aria-selected="false"><b>${v}</b><span>${sub}</span></button>`).join('')}</nav>
 <div class="vc157-stagehead"><div><span class="vc157-eyebrow">ESTUDIO TÁCTICO · SOLO LECTURA</span><h3 id="vc157-section-title">Resumen</h3><p id="vc157-sample"></p></div><div class="vc157-export"><button id="vc157-csv-official">CSV Hoja Oficial</button><button id="vc157-csv">CSV avanzado</button><button id="vc157-json">JSON</button></div></div>
 <div id="vc1620-subtabs" class="vc1620-subtabs" hidden></div><div class="vc157-columns"><main id="vc157-content" class="vc157-content"></main><aside class="vc157-inspector"><div class="vc157-inspector-head"><span>INSPECTOR DE JUGADAS</span><h3 id="vc157-inspector-title">Selecciona una cifra de la tabla</h3></div><div id="vc157-inspector-content"><p>Selecciona una cifra para explorar las acciones que la componen.</p></div><button id="vc157-video" disabled>▶ Abrir jugadas en vídeo</button><p id="vc157-inspector-note">Se utiliza Video Analytics y el reproductor original.</p></aside></div></div>
 <p class="vc157-footer">Analysis Pro 2.1 · Estadísticas calculadas sin modificar el scouting. Muestras explícitas y acciones trazables. La Hoja Oficial conserva su generador y estructura.</p>`;
 view.appendChild(host);
 $('vc157-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(!b||!pages[b.dataset.section])return;state.page=b.dataset.section;renderPage()});
 $('vc1620-subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-subpage]');if(!b)return;const allowed=(subpages[state.page]||[]).some(([k])=>k===b.dataset.subpage);if(!allowed)return;state.subpage[state.page]=b.dataset.subpage;renderPage()});
 host.addEventListener('change',e=>{
  const t=e.target,id=t.id;
  if(id==='vc1621-setter-player'){state.setterPlayer=t.value;renderPage();return}
  if(id==='vc1621-setter-reception'){state.setterReception=t.value;renderPage();return}
  if(id==='vc1621-setter-tempo'){state.setterTempo=t.value;renderPage();return}
  if(id==='vc171-dimension'){state.deepDim=t.value;renderPage();return}
  if(id==='vc171-player'){state.deepPlayer=t.value;renderPage();return}
  if(id==='vc157-match'){
   const chosen=matches().find(m=>String(m.id)===String(t.value));
   if(!chosen){buildHeader();return;}
   state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.player='';state.setterPlayer='';state.setterReception='';state.setterTempo='';
   // Never dispatch the old select's change from Studio: the legacy renderer
   // can rebuild its options and switch back to the active match mid-selection.
   setNativeSelection(state.match);
   state.selected=[];state.selectedTitle='Selecciona una cifra de la tabla';renderInspector();
  } else if(id==='vc157-team'||id==='vc157-set'||id==='vc157-rotation'||id==='vc157-phase'){
   state[id.slice(6)]=t.value;state.selected=[];renderInspector();
  } else if(id==='vc157-player'||id==='vc157-skill'||id==='vc157-rating')state[id.slice(6)]=t.value;
  refresh();
 });
 host.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.vc171Skill){if(state.page==='setter'&&t.dataset.vc171Skill!=='E'){state.page='players';state.subpage.players='fundamentals';}state.deepSkill=t.dataset.vc171Skill;state.deepDim='player';state.deepPlayer='';renderPage();return}
  if(t.id==='vc171-retry'){deepLoadError='';renderPage();return}
  if(t.dataset.seasonMatch){
   const chosen=matches().find(m=>String(m.id)===String(t.dataset.seasonMatch));
   if(!chosen)return;
   state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.setterPlayer='';state.setterReception='';state.setterTempo='';
   state.page='overview';state.selected=[];state.selectedTitle='Selecciona una cifra';setNativeSelection(state.match);
   renderInspector();buildHeader();renderPage();return;
  }
  if(t.dataset.pick){let keys=[];try{keys=JSON.parse(decodeURIComponent(t.dataset.pick))}catch(_){ }selectKeys(keys,t.dataset.pickTitle);return}
  switch(t.id){
   case 'vc157-refresh-matches':refresh();break;
   case 'vc157-official':window.scoutV114ExportOfficialPDF?.(currentMatch()?.id);break;
   case 'vc157-propdf':window.scoutV114ExportAnalysisPDF?.(currentMatch()?.id);break;
   case 'vc157-video':openVideo();break;
   case 'vc157-csv':exportFile('csv');break;
   case 'vc157-csv-official':exportFile('csv-official');break;
   case 'vc157-json':exportFile('json');break;
  }
 });
 native.addEventListener('change',()=>{
  if(!state.technical && !state.match){state.match=native.value;state.set='';state.rotation='';refresh()}
 });
 state.loaded=true;state.match='';syncSelection();
 switchMode(false);
 return true;
}
function open(){if(!mount())return false;refresh();return true}
const CSS=`
body.v11-shell #scout-analysis[data-vc157-mode="studio"] > .scout-analysis-shell{display:none!important}
body.v11-shell #scout-analysis[data-vc157-mode="studio"] > :is(#vc1615-back,#vc157-back){display:none!important}
#scout-analysis[data-vc157-mode="technical"]>#vc157-studio{display:none!important}
#vc157-studio, #vc157-studio *{box-sizing:border-box}
body.v11-shell #scout-analysis #vc157-studio{--vc1620-ink:#193955;--vc1620-muted:#607c96;--vc1620-line:#d9e5ef;--vc1620-paper:#fff;max-width:100%;min-width:0;color:var(--vc1620-ink);font:500 13px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;margin:0 auto 28px}
#vc157-studio button{cursor:pointer;font-family:inherit}#vc157-studio button:focus-visible,#vc157-studio select:focus-visible{outline:3px solid #8cc5f3;outline-offset:2px}
#vc157-studio .vc157-top{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:wrap;padding:24px 28px;background:linear-gradient(117deg,#0d2740,#173f62);color:#fff;border-radius:16px 16px 0 0}
#vc157-studio .vc157-eyebrow{display:block;color:#80c5ee;letter-spacing:.13em;font-size:10px;font-weight:850}
#vc157-studio .vc157-top h2{font:850 clamp(22px,2.2vw,29px)/1.2 system-ui!important;color:#fff!important;margin:5px 0!important}
#vc157-studio .vc157-top p{font-size:12px;color:#c3d8e8;margin:4px 0 0}
#vc157-studio .vc157-actions{display:flex;gap:7px;flex-wrap:wrap}
#vc157-studio .vc157-actions button{min-height:37px!important;border:1px solid #547491!important;border-radius:8px!important;background:#254f71!important;color:#fff!important;font-weight:750!important;font-size:11px!important;padding:9px 12px!important}
#vc157-studio .vc157-actions .vc157-pdf{background:#fff!important;border-color:#fff!important;color:#174d77!important}
#vc157-studio .vc157-filterbar{display:grid;grid-template-columns:minmax(240px,2.4fr) auto repeat(4,minmax(115px,1fr));align-items:end;gap:10px;background:#fff;border:1px solid var(--vc1620-line);border-top:0;padding:15px 22px}
#vc157-studio .vc157-filterbar label, #vc157-studio .vc157-explorer-filters label, #vc157-studio .vc171-filters label{display:grid;gap:5px;min-width:0;color:var(--vc1620-muted);font:750 10px/1.4 system-ui;letter-spacing:.01em}
#vc157-studio .vc157-match-field{position:relative}
#vc157-studio .vc157-match-count{position:absolute;right:0;top:0;font-size:9px;color:#497ba0;font-weight:750}
body.v11-shell #scout-analysis #vc157-studio select{width:100%!important;max-width:none!important;min-width:0!important;height:39px!important;min-height:39px!important;border:1px solid #cadbe8!important;border-radius:8px!important;padding:7px 9px!important;background:#fff!important;color:#244963!important;font:700 12px system-ui!important}
#vc157-studio #vc157-refresh-matches{height:39px!important;min-height:39px!important;padding:7px 12px!important;border:1px solid var(--vc1620-line)!important;border-radius:8px!important;background:#eff6fc!important;color:#195b8d!important;font-weight:750!important;font-size:11px!important}
#vc157-studio .vc157-work{display:grid;grid-template-columns:203px minmax(0,1fr);grid-template-areas:'nav head' 'nav tabs' 'nav contents';column-gap:18px;row-gap:12px;align-items:start;background:#f5f8fb;border:1px solid var(--vc1620-line);border-top:0;padding:20px;border-radius:0 0 16px 16px;min-width:0}
#vc157-studio .vc157-tabs{grid-area:nav!important;display:flex!important;flex-direction:column!important;position:sticky;top:72px;background:#eaf1f7;border:1px solid #d7e4ef;border-radius:12px;padding:8px;gap:4px;margin:0!important;min-width:0}
#vc157-studio .vc157-tabs button{min-height:58px!important;text-align:left!important;padding:10px 12px!important;display:grid;gap:2px;align-content:center;white-space:normal!important;background:transparent!important;border:1px solid transparent!important;border-radius:9px!important;color:#52738f!important}
#vc157-studio .vc157-tabs button b{font-size:12px;font-weight:850}#vc157-studio .vc157-tabs button span{font-size:10px;line-height:1.3;color:inherit;opacity:.8}
#vc157-studio .vc157-tabs button[aria-selected="true"]{background:#fff!important;color:#154d7c!important;border-color:#cbddec!important;box-shadow:0 2px 8px #143b5512}
#vc157-studio .vc157-stagehead{grid-area:head;display:flex;align-items:end;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:0 3px 9px;border-bottom:1px solid #dbe6ef}
#vc157-studio .vc157-stagehead h3{color:#153a5b!important;font:850 22px/1.2 system-ui!important;margin:5px 0!important}#vc157-studio .vc157-stagehead p{color:#67839a;font-size:11px;margin:0}
#vc157-studio .vc157-export{display:flex;gap:5px;flex-wrap:wrap}
#vc157-studio .vc157-export button{background:#fff!important;border:1px solid #cbdce8!important;border-radius:8px!important;color:#245b84!important;min-height:34px!important;font:750 10px system-ui!important;padding:8px 10px!important}
#vc157-studio .vc1620-subtabs{grid-area:tabs;display:flex;gap:7px;flex-wrap:wrap;min-width:0}
#vc157-studio .vc1620-subtabs[hidden]{display:none!important}
#vc157-studio .vc1620-subtabs button{border:1px solid #d5e2ec!important;background:#fff!important;color:#53748f!important;padding:8px 14px!important;min-height:36px!important;border-radius:8px!important;font-weight:750!important;font-size:11px!important}
#vc157-studio .vc1620-subtabs button[aria-pressed="true"]{color:#fff!important;background:#1b5a90!important;border-color:#1b5a90!important}
#vc157-studio[data-vc1620-setter="true"] .vc171-skillbar{display:none!important}
#vc157-studio[data-vc1620-season="true"] .vc157-inspector{display:none!important}
#vc157-studio[data-vc1620-season="true"] .vc157-columns{grid-template-columns:minmax(0,1fr)!important}
#vc157-studio .vc157-columns{grid-area:contents;display:grid;grid-template-columns:minmax(0,1fr) minmax(238px,280px);gap:14px;align-items:start;min-width:0}
#vc157-studio .vc157-content{display:grid;gap:14px;min-width:0;max-width:100%;margin:0}
#vc157-studio .vc157-panel,#vc157-studio .vc157-inspector{background:#fff;border:1px solid var(--vc1620-line);border-radius:12px;padding:18px;min-width:0;box-shadow:0 2px 10px #18344f08}
#vc157-studio .vc157-panel h3,#vc157-studio .vc157-inspector h3{color:#173e60!important;font:850 15px/1.3 system-ui!important;margin:0 0 9px!important}
#vc157-studio .vc157-panel p,#vc157-studio .vc157-inspector p{font-size:11px;color:#668198;line-height:1.55;margin:7px 0}
#vc157-studio .vc157-panelhead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
#vc157-studio .vc157-tag{font-size:10px;color:#2e648a;padding:5px 10px;background:#eef6fc;border-radius:20px;white-space:nowrap}
#vc157-studio .vc157-tablewrap{max-width:100%;overflow-x:auto;border:1px solid #e0eaf2;border-radius:8px}
#vc157-studio .vc157-table{border-collapse:collapse;width:100%;min-width:570px;white-space:nowrap;font:650 11px/1.35 system-ui;font-variant-numeric:tabular-nums}
#vc157-studio .vc157-table th{background:#eff5fa;color:#54758e;text-align:left;padding:10px 8px;font:800 10px system-ui;position:sticky;top:0;z-index:1;border-bottom:1px solid #d5e1eb}
#vc157-studio .vc157-table td{padding:9px 8px;border-bottom:1px solid #e8eff5;color:#335a77;vertical-align:middle}
#vc157-studio .vc157-table tbody tr:hover{background:#f6faff}
#vc157-studio .vc157-table td small{display:block;color:#899caf;font-size:10px}
#vc157-studio .vc157-table td:first-child,#vc157-studio .vc157-table th:first-child{position:sticky;left:0;background:#fff;z-index:2;box-shadow:1px 0 #e0e9ef}
#vc157-studio .vc157-table th:first-child{background:#eff5fa;z-index:3}
#vc157-studio .vc157-table .vc157-muted{padding:18px;color:#7d95a8;text-align:center}
#vc157-studio .vc157-player{font-weight:800}
#vc157-studio .vc157-pick{background:transparent!important;border:0!important;color:#17649b!important;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#b5d4e7;padding:2px!important;font:800 11px system-ui!important;white-space:nowrap!important}
#vc157-studio .vc157-note{margin-top:12px!important;border-top:1px solid #e8eff4;padding-top:10px;color:#7c94a6!important;font-size:10px!important}
#vc157-studio .vc157-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
#vc157-studio .vc157-inspector{position:sticky;top:72px;max-height:min(78vh,850px);overflow:auto}
#vc157-studio .vc157-inspector-head{padding-bottom:10px;margin-bottom:8px;border-bottom:1px solid #e0ebf2}
#vc157-studio .vc157-inspector-head span{color:#6b94b5;font:900 9px system-ui;letter-spacing:.12em}
#vc157-studio .vc157-inspector-list{display:grid;gap:6px;max-height:330px;overflow:auto}
#vc157-studio .vc157-inspector-item{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f4f8fb;padding:9px;border:1px solid #e1ebf4;border-radius:8px}
#vc157-studio .vc157-inspector-item b{font:850 11px ui-monospace,Consolas,monospace;color:#284c6b}
#vc157-studio .vc157-inspector-item small{display:block;font-size:9px;color:#819aad}
#vc157-studio .vc157-inspector-item>span{font-size:9px;color:#4e7e9d}
#vc157-studio #vc157-video{min-height:40px!important;background:#165c97!important;border:1px solid #165c97!important;border-radius:8px!important;color:#fff!important;width:100%;font-weight:850!important;font-size:11px!important;margin-top:12px}
#vc157-studio #vc157-video:disabled{opacity:.45;cursor:not-allowed}
#vc157-studio .vc157-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
#vc157-studio .vc157-metric{display:grid;gap:5px;align-content:start;min-width:0;background:#fff;border:1px solid var(--vc1620-line);border-radius:11px;padding:15px}
#vc157-studio .vc157-metric>span{color:#63819a;font-size:10px;font-weight:800}
#vc157-studio .vc157-metric strong{color:#153a5a;font-size:clamp(19px,2vw,27px);line-height:1.2}
#vc157-studio .vc157-metric small{font-size:10px;color:#7b93a7}
#vc157-studio .vc157-metric button{justify-self:start}
#vc157-studio .vc157-statline{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #e8eff5;font-size:12px}
#vc157-studio .vc157-insight{border-left:3px solid #5a9ac5;background:#f1f7fc;border-radius:7px;margin-bottom:9px;padding:11px}
#vc157-studio .vc157-insight b{font-size:11px;color:#245174}
#vc157-studio .vc157-cellbar{display:inline-block;width:50px;height:6px;border-radius:7px;background:#e3edf5;overflow:hidden;margin-right:5px;vertical-align:middle}
#vc157-studio .vc157-cellbar i{display:block;height:100%;background:#468abc}
#vc157-studio .vc157-court{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;max-width:420px;border:2px solid #ad7b47;background:#cfa570;border-radius:10px;padding:7px}
#vc157-studio .vc157-zone{display:grid;position:relative;place-items:center;gap:3px;min-height:80px!important;overflow:hidden;border:1px solid #dfcbae!important;border-radius:7px!important;background:#fff9f0!important;color:#22445b!important}
#vc157-studio .vc157-zone i{position:absolute;inset:0;background:#3282bc;pointer-events:none}#vc157-studio .vc157-zone>:not(i){position:relative;z-index:1}#vc157-studio .vc157-zone strong{font-size:20px}
#vc157-studio .vc157-explorer-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
#vc157-studio .vc157-footer{color:#8197a9;font-size:10px;margin:13px 2px}
#vc157-studio .vc157-empty{background:#fff;border:1px dashed #b5ccdf;border-radius:10px;padding:32px;color:#66849e;text-align:center}
#vc157-studio .vc1620-season-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:12px}
#vc157-studio .vc1620-season-metrics>div{display:grid;gap:5px;border:1px solid #dae7f0;border-radius:9px;padding:12px;background:#f7fafd;min-width:0}
#vc157-studio .vc1620-season-metrics span{font-size:10px;font-weight:800;color:#547d97}
#vc157-studio .vc1620-season-metrics strong{font-size:20px;color:#153b5f}
#vc157-studio .vc1620-season-metrics small{font-size:9px;color:#7794a8}
#vc157-studio .vc157-season-link{border:0!important;background:transparent!important;color:#165c94!important;font:800 11px system-ui!important;padding:2px!important;text-decoration:underline;text-underline-offset:3px}
#vc157-studio .vc1620-trend{display:grid;gap:9px;margin-top:12px}
#vc157-studio .vc1620-trendrow{display:grid;grid-template-columns:minmax(100px,1.1fr) minmax(80px,2fr) 65px 55px;gap:9px;align-items:center;color:#54758e;font-size:11px}
#vc157-studio .vc1620-trendrow>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}#vc157-studio .vc1620-trendrow b{color:#265d84}
#vc157-studio .vc1620-track{height:10px;overflow:hidden;background:#e8f0f6;border-radius:8px}#vc157-studio .vc1620-track i{display:block;background:#377caa;height:100%;border-radius:8px}

/* V16.2.1 tactical and setter improvements */
#vc157-studio .vc1621-setterfilters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 16px}
#vc157-studio .vc1621-setterfilters label{display:grid;gap:5px;min-width:0;color:#607c96;font:750 10px/1.4 system-ui}
#vc157-studio .vc1621-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:13px 0}
#vc157-studio .vc1621-metrics>div{display:grid;align-content:start;gap:4px;background:#f2f7fc;border:1px solid #d9e6f0;border-radius:10px;padding:10px;min-width:0}
#vc157-studio .vc1621-metrics span{font-size:10px;color:#55758d;font-weight:750}
#vc157-studio .vc1621-metrics strong{font-size:19px;color:#183e61}
#vc157-studio .vc1621-metrics small{color:#7090a8;font-size:9px}
#vc157-studio .vc1621-court{max-width:440px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;border:2px solid #ad7b47;border-radius:11px;background:#cba270;padding:7px;margin:12px auto}
#vc157-studio .vc1621-court .vc1621-zone{min-height:86px!important;display:grid;place-content:center;gap:3px;border:1px solid #d4bd9f!important;border-radius:7px!important;background:#fff9f0!important;color:#2d536f!important}
#vc157-studio .vc1621-zone strong{font-size:19px}#vc157-studio .vc1621-zone small{font-size:10px}
@media(max-width:780px){#vc157-studio .vc1621-setterfilters{grid-template-columns:1fr}#vc157-studio .vc1621-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}

@media(max-width:1250px){#vc157-studio .vc157-filterbar{grid-template-columns:minmax(190px,2fr) auto repeat(2,minmax(105px,1fr))}#vc157-studio .vc157-columns{grid-template-columns:minmax(0,1fr)}#vc157-studio .vc157-inspector{position:static;max-height:none}#vc157-studio .vc1620-season-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:950px){#vc157-studio .vc157-work{grid-template-columns:1fr;grid-template-areas:'nav' 'head' 'tabs' 'contents';padding:12px}#vc157-studio .vc157-tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;position:static;min-height:0}#vc157-studio .vc157-tabs button{min-height:54px!important}#vc157-studio .vc157-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc157-grid2{grid-template-columns:1fr}}
@media(max-width:620px){#vc157-studio .vc157-top{padding:17px;align-items:flex-start;gap:11px}#vc157-studio .vc157-top h2{font-size:22px!important}#vc157-studio .vc157-filterbar{grid-template-columns:minmax(0,1fr) auto;gap:7px;padding:11px}#vc157-studio .vc157-filterbar>label:not(.vc157-match-field){grid-column:span 1}#vc157-studio .vc157-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}#vc157-studio .vc157-tabs button b{font-size:11px}#vc157-studio .vc157-stagehead h3{font-size:19px!important}#vc157-studio .vc157-panel{padding:11px}#vc157-studio .vc157-export button{padding:7px!important}#vc157-studio .vc157-explorer-filters{grid-template-columns:1fr 1fr}#vc157-studio .vc1620-season-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1620-trendrow{grid-template-columns:minmax(70px,1fr) minmax(45px,1.2fr) 50px 40px;gap:4px;font-size:10px}}
`;
window.VC_ANALYST_STUDIO_16155={version:'16.2.1',mount,open,refresh,setPage:(p)=>{if(pages[p]){state.page=p;renderPage()}},diagnostics:()=>({loaded:state.loaded,draws:state.draws,page:state.page,technical:state.technical,selected:state.selected.length,locked:false})};
})();
