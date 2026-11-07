/* Volley Coach V16.1.5.6 · Analyst Studio Pro
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
const pages={overview:['Panorama','KPIs y lectura del partido'],players:['Hoja estadística','Rendimiento por jugador'],rotations:['Rotaciones','K1 / K2 y comparación'],distribution:['Distribución','Recepción y colocador'],zones:['Zonas','Origen, destino y bloqueo'],explorer:['Explorador','Acciones y evidencia en vídeo']};
const state={page:'players',team:'ours',set:'',rotation:'',phase:'',skill:'',rating:'',player:'',match:'',technical:false,selected:[],selectedTitle:'Selecciona una cifra de la tabla',loaded:false,draws:0};
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
 const h=$('vc155-match');
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
 const setsBox=$('vc155-set');if(setsBox){
  const opts=selOpts(sets,state.set,'Todos');
  if(setsBox.innerHTML!==opts)setsBox.innerHTML=opts;
 }
 const te=$('vc155-team');if(te)te.value=state.team;
 const rot=$('vc155-rotation');if(rot)rot.value=state.rotation;
 const phase=$('vc155-phase');if(phase)phase.value=state.phase;
 const mat=$('vc155-match-label');if(mat)mat.textContent=m?`${m.opponent||'Rival'} · ${m.date||'Sin fecha'} · ${arr(m.sets).length} sets`:'Selecciona un scouting para comenzar';
 const count=$('vc155-match-count');if(count)count.textContent=`${ms.length} disponibles`;
}
function table(headers,rows,klass=''){return `<div class="vc155-tablewrap"><table class="vc155-table ${klass}"><thead><tr>${headers.map(s=>`<th>${html(s)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="vc155-muted">Sin datos registrados para los filtros actuales.</td></tr>`}</tbody></table></div>`}
function pickButton(label,keys,title,klass=''){const enc=encodeURIComponent(JSON.stringify(keys));return `<button type="button" class="vc155-pick ${klass}" data-pick="${enc}" data-pick-title="${html(title)}">${html(label)}</button>`}
function rowsBy(data,cb){return data.actions.filter(cb)}
function periodLabel(data){return `${data.points.rallies} rallies cerrados · ${data.actions.length} acciones · ${data.videoCount} con referencia temporal`}
function sheetRows(data){
 const grouped=data.playerGroups.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
 return grouped.map(p=>{
  const s=p.skills,serve=s.S||{},rec=s.R||{},attack=s.A||{},block=s.B||{};
  const sp=(serve.kills||0)-(serve.errors||0),ap=(attack.kills||0),ae=attack.errors||0,ab=attack.blocked||0;
  const pts=(serve.kills||0)+ap+(block.kills||0),gp=pts-(serve.errors||0)-ae-ab-(block.errors||0);
  const playerActions=rowsBy(data,r=>r.player===p.name);
  const keys=playerActions.map(r=>r.key);
  const by=(predicate)=>playerActions.filter(predicate).map(r=>r.key);
  const direct=r=>['S','A','B'].includes(r.skill)&&r.ev==='#';
  const gpRelevant=r=>direct(r)||(r.skill==='S'&&r.ev==='=')||(r.skill==='A'&&['=','/'].includes(r.ev))||(r.skill==='B'&&r.ev==='=');
  const cell=(n,label,chosen)=>`<td>${pickButton(n,chosen,`${label} · ${p.name}`)}</td>`;
  return `<tr><td class="vc155-player">${pickButton(p.name,keys,`Todas las acciones · ${p.name}`,'vc155-namelink')}</td><td>${p.n}</td>${cell(''+pts,'Puntos directos',by(direct))}${cell(''+signed(gp),'G-P técnico',by(gpRelevant))}${cell(''+signed(sp),'Saque G-P',by(r=>r.skill==='S'&&['#','='].includes(r.ev)))}<td>${pickButton(fmt(rec.positivePct),by(r=>r.skill==='R'&&['#','+'].includes(r.ev)),`Recepciones positivas · ${p.name}`)}<small>${rec.positive||0}/${rec.n||0}</small></td><td>${pickButton(`${rec.perfect||0}/${rec.n||0}`,by(r=>r.skill==='R'&&r.ev==='#'),`Recepciones perfectas · ${p.name}`)}</td><td>${pickButton(`${ap}/${attack.n||0}`,by(r=>r.skill==='A'&&r.ev==='#'),`Ataques punto · ${p.name}`)}</td><td>${pickButton(`${ae}+${ab}`,by(r=>r.skill==='A'&&['=','/'].includes(r.ev)),`Errores y ataques bloqueados · ${p.name}`)}</td><td>${pickButton(fmt(attack.eff),by(r=>r.skill==='A'),`Todos los ataques · ${p.name}`)}</td><td>${pickButton(''+(block.kills||0),by(r=>r.skill==='B'&&r.ev==='#'),`Bloqueos punto · ${p.name}`)}</td></tr>`;
 }).join('');
}
function pagePlayers(data){return `<div class="vc155-panel"><div class="vc155-panelhead"><div><h3>Hoja individual · G-P y eficiencia</h3><p>Una fila por jugador y todas las acciones del filtro. Pulsa un jugador o una cifra para inspeccionar sus jugadas.</p></div><span class="vc155-tag">${data.playerGroups.length} jugadores</span></div>
 ${table(['Jugador','Acc.','PTS','G-P','Saq. G-P','Rec. +/#','Rec. #','Ataque #','Err+BLO','Atq. EFF','Bloq. #'],sheetRows(data),'vc155-sheet')}
 <p class="vc155-note">PTS = ace + ataque # + bloqueo #. G-P técnico = puntos directos − errores directos y ataques bloqueados. Recepción +/# = (# + +)/total; eficiencia de ataque = (# − = − /)/ataques. Revisa los denominadores antes de comparar.</p></div>
 <div class="vc155-grid2"><div class="vc155-panel"><h3>Acciones registradas por fundamento</h3>${table(['Fundamento','Total','Positivas','Errores','Vídeo'],Object.entries(categories).map(([s,n])=>{const g=data.skills[s],rows=rowsBy(data,r=>r.skill===s);if(!g?.n)return'';return `<tr><td>${n}</td><td>${g.n}</td><td>${g.positive||0}</td><td>${g.errors||0}</td><td>${pickButton('Ver',rows.map(x=>x.key),n)}</td></tr>`}).join(''))}</div><div class="vc155-panel"><h3>Interpretación de estadísticas</h3><p>El número de intentos determina la fiabilidad de la lectura. Las celdas no convierten valoraciones técnicas en puntos de marcador.</p><p class="vc155-note">La Hoja Oficial PDF mantiene su generador y su estructura. Esta tabla es una vista interactiva adicional.</p></div></div>`}
function pageOverview(data){
 const p=data.points,rec=data.skills.R||{},atk=data.skills.A||{};
 const tiles=[['Side-out K1',fmt(p.k1.pct),`${p.k1.w}/${p.k1.n} rallies`,'K1'],['Break K2',fmt(p.k2.pct),`${p.k2.w}/${p.k2.n} rallies`,'K2'],['Recepción +/#',fmt(rec.positivePct),`${rec.positive||0}/${rec.n||0} acciones`,'R'],['Ataque EFF',fmt(atk.eff),`${atk.kills||0} − ${atk.errors||0} − ${atk.blocked||0} / ${atk.n||0}`,'A']];
 const insights=window.VC_ANALYSIS_INTELLIGENCE_1614?.insights?.(data)||[];
 return `<div class="vc155-metrics">${tiles.map(([n,v,s,c])=>`<div class="vc155-metric"><span>${n}</span><strong>${v}</strong><small>${s}</small>${pickButton('Ver jugadas',data.actions.filter(a=>(c==='K1'?a.r.serving&&a.r.serving!==data.target:c==='K2'?a.r.serving===data.target:a.skill===c)).map(x=>x.key),n)}</div>`).join('')}</div>
 <div class="vc155-grid2"><div class="vc155-panel"><h3>Lectura táctica</h3>${insights.map(i=>`<div class="vc155-insight"><b>${html(i.title)}</b><p>${html(i.detail)}</p><small>${html(i.how)}</small></div>`).join('')||'<p>No se detectan patrones suficientemente respaldados por la muestra.</p>'}</div>
 <div class="vc155-panel"><h3>Calidad del registro</h3><div class="vc155-statline"><span>Rallies válidos</span><b>${p.rallies}</b></div><div class="vc155-statline"><span>Acciones codificadas</span><b>${data.actions.length}</b></div><div class="vc155-statline"><span>Acciones con vídeo</span><b>${data.videoCount}/${data.actions.length}</b></div><div class="vc155-statline"><span>Rallies sin saque registrado</span><b>${data.unknownServe}</b></div><p class="vc155-note">Las hipótesis son descriptivas. Sin muestra suficiente, no se infiere causa táctica.</p></div></div>`;
}
function pageRotations(data){
 const rows=data.rotations.map(r=>{
 const rRows=data.actions.filter(a=>a.r&&(data.target==='ours'?a.r.rotation:a.r.opponentRotation)===r.rotation);
 const gp=2*r.won-r.rallies;
 return `<tr><td class="vc155-strong">R${r.rotation}</td><td>${r.k1.w}/${r.k1.n}</td><td><div class="vc155-cellbar"><i style="width:${r.k1.pct||0}%"></i></div>${fmt(r.k1.pct)}</td><td>${r.k2.w}/${r.k2.n}</td><td>${fmt(r.k2.pct)}</td><td>${r.rallies}</td><td>${signed(gp)}</td><td>${pickButton('▶ Jugadas',rRows.map(a=>a.key),`Rotación R${r.rotation}`)}</td></tr>`}).join('');
 return `<div class="vc155-panel"><h3>Rotaciones · K1 y K2 comparados</h3>${table(['Rotación','K1 G/T','K1 %','K2 G/T','K2 %','Rallies','G-P','Vídeo'],rows)}<p class="vc155-note">K1 = rallies ganados recibiendo / oportunidades de recepción. K2 = rallies ganados al saque / oportunidades de saque. Un rally cuenta una sola vez.</p></div>`
}
function pageDistribution(data){
 const groups=new Map();for(const p of data.pairs){const key=p.target||'Sin codificar';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p)}
 const rows=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([target,items])=>{
  const attacks=items.map(i=>i.attack).filter(Boolean),kill=attacks.filter(x=>x.ev==='#').length,err=attacks.filter(x=>x.ev==='=').length,bl=attacks.filter(x=>x.ev==='/').length;
  return `<tr><td>${html(target)}</td><td>${items.length}</td><td>${fmt(pct(items.length,data.pairs.length))}</td><td>${attacks.length}</td><td>${fmt(pct(kill,attacks.length))}</td><td>${fmt(pct(kill-err-bl,attacks.length))}</td><td>${pickButton('▶ Ver',items.flatMap(i=>[i.set?.key,i.attack?.key]).filter(Boolean),`Destino ${target}`)}</td></tr>`}).join('');
 const rec=[['Recepción positiva',data.chains.filter(c=>c.positive)],['Recepción restante',data.chains.filter(c=>!c.positive)]].map(([key,rows])=>{
  const won=rows.filter(r=>r.outcome).length;
  return `<tr><td>${key}</td><td>${rows.length}</td><td>${won}/${rows.length}</td><td>${fmt(pct(won,rows.length))}</td><td>${pickButton('▶ Ver',rows.map(r=>r.rec?.key).filter(Boolean),key)}</td></tr>`}).join('');
 return `<div class="vc155-panel"><h3>Distribución del colocador</h3><p class="vc155-sub">Colocaciones codificadas y primer ataque posterior de la misma posesión.</p>${table(['Destino','Uso','% uso','Ataques','Kill %','EFF','Vídeo'],rows)}</div><div class="vc155-panel"><h3>Recepción → colocación → ataque</h3>${table(['Calidad','Rallies','Ganados','Side-out','Evidencia'],rec)}<p class="vc155-note">La primera cadena del rally es una asociación temporal; no implica causalidad. El destino se muestra sin inferir cuando no fue codificado.</p></div>`;
}
function pageZones(data){
 const zones=new Map(data.zoneCounts),tot=data.zoneCounts.reduce((n,[,items])=>n+items.length,0);
 const body=[4,3,2,7,8,9,5,6,1].map(z=>{const rows=zones.get(String(z))||[],clickRows=rows.map(r=>r.key);return `<button class="vc155-zone" data-pick="${encodeURIComponent(JSON.stringify(clickRows))}" data-pick-title="Ataques en Z${z}"><b>Z${z}</b><strong>${rows.length}</strong><small>${fmt(pct(rows.length,tot))}</small><i style="opacity:${Math.max(.08,Math.min(.55,rows.length/Math.max(1,tot)*2.5))}"></i></button>`}).join('');
 const blMap=new Map();for(const r of data.attacks){const k=r.a.blockers==null||r.a.blockers===''?'Sin registrar':String(r.a.blockers);if(!blMap.has(k))blMap.set(k,[]);blMap.get(k).push(r)}
 const blockers=[...blMap].map(([k,rows])=>{const kill=rows.filter(a=>a.ev==='#').length,neg=rows.filter(a=>a.ev==='='||a.ev==='/').length;return `<tr><td>${html(k)}</td><td>${rows.length}</td><td>${fmt(pct(kill,rows.length))}</td><td>${fmt(pct(kill-neg,rows.length))}</td><td>${pickButton('▶',rows.map(a=>a.key),`Bloqueadores ${k}`)}</td></tr>`}).join('');
 return `<div class="vc155-grid2"><div class="vc155-panel"><h3>Destinos de ataque · pista 9×4</h3><p>${tot}/${data.attacks.length} ataques tienen una zona registrada. Pulsa una zona para ver sus acciones.</p><div class="vc155-court">${body}</div><p class="vc155-note">Subzonas A–D disponibles en los datos originales y exportaciones; aquí se agregan a las nueve zonas para facilitar la lectura.</p></div><div class="vc155-panel"><h3>Ataque según bloqueo rival</h3>${table(['Bloqueadores','Ataques','Kill %','EFF','Vídeo'],blockers)}<p class="vc155-note">Se incluyen únicamente las características codificadas. Sin datos registrados, no se inventa el tipo de bloqueo.</p></div></div>`;
}
function pageExplorer(data){
 const players=[...new Set(data.actions.map(x=>x.player))].sort((a,b)=>a.localeCompare(b,'es'));
 const f=state;
 const selection=data.actions.filter(a=>(!f.player||a.player===f.player)&&(!f.skill||a.skill===f.skill)&&(!f.rating||a.ev===f.rating));
 const tr=selection.slice(0,150).map(a=>`<tr><td>${a.set}</td><td>${a.r.index}</td><td>${html(a.player)}</td><td>${html(categories[a.skill]||a.skill)}</td><td>${html(a.ev)}</td><td><code>${html(a.code)}</code></td><td>${a.video?'Vinculada':'Sin marca'}</td><td>${pickButton('▶', [a.key],`${a.code} · ${a.player}`)}</td></tr>`).join('');
 return `<div class="vc155-panel"><h3>Explorador de acciones</h3><div class="vc155-explorer-filters"><label>Jugador<select id="vc155-player">${selOpts(players.map(x=>[x,x]),f.player,'Todos')}</select></label><label>Fundamento<select id="vc155-skill">${selOpts(Object.entries(categories).map(([k,v])=>[k,v]),f.skill,'Todos')}</select></label><label>Valoración<select id="vc155-rating">${selOpts(['#','+','!','-','/','='].map(x=>[x,x]),f.rating,'Todas')}</select></label></div><p>${selection.length} coincidencias · ${selection.filter(a=>a.video).length} con referencia de vídeo · ${pickButton('▶ Seleccionar todas',selection.map(a=>a.key),'Búsqueda combinada')}</p>${table(['Set','Rally','Jugador','Fundamento','Eval.','Código','Vídeo','Abrir'],tr)}${selection.length>150?'<p class="vc155-note">Se muestran las primeras 150 filas. La selección puede incluir todas las coincidencias.</p>':''}</div>`;
}
function renderPage(){
 if(!state.loaded||state.technical)return;
 const data=dataset(),surface=$('vc155-content');if(!surface)return;
 if(!data){surface.innerHTML='<div class="vc155-empty">Selecciona un scouting para empezar el análisis.</div>';return;}
 const p=state.page;
 const content={overview:pageOverview,players:pagePlayers,rotations:pageRotations,distribution:pageDistribution,zones:pageZones,explorer:pageExplorer}[p]||pagePlayers;
 surface.innerHTML=content(data);
 const meta=$('vc155-sample');if(meta)meta.textContent=periodLabel(data);
 document.querySelectorAll('#vc155-tabs [data-section]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.section===state.page)));
 const title=$('vc155-section-title');if(title)title.textContent=pages[p][0];
 state.draws++;
}
function selectKeys(keys,title){
 const data=dataset();if(!data)return;
 const keyset=new Set(keys),selection=data.actions.filter(x=>keyset.has(x.key));
 state.selected=selection;state.selectedTitle=title||'Jugadas seleccionadas';renderInspector();
}
function renderInspector(){
 const out=$('vc155-inspector-content');if(!out)return;
 const rows=state.selected,video=rows.filter(r=>r.video),title=$('vc155-inspector-title');if(title)title.textContent=state.selectedTitle;
 out.innerHTML=rows.length?`<p><b>${rows.length}</b> acciones · <b>${video.length}</b> con marca de vídeo</p><div class="vc155-inspector-list">${rows.slice(0,45).map(r=>`<div class="vc155-inspector-item"><div><b>${html(r.code||r.skill+r.ev)}</b><small>Set ${r.set} · ${html(r.player)}</small></div><span>${r.video?'Vídeo':'Sin tiempo'}</span></div>`).join('')}</div>${rows.length>45?'<p>Se muestran las primeras 45 acciones.</p>':''}`:'<p>Selecciona una cifra, rotación, zona o jugada para ver las acciones que forman ese resultado.</p>';
 const btn=$('vc155-video');if(btn)btn.disabled=!video.length;
}
function openVideo(){
 const m=currentMatch(),keys=state.selected.filter(a=>a.video).map(x=>x.key);
 if(!m||!keys.length)return;
 const api=window.VC_VIDEO_ANALYTICS_1612;
 if(!api?.openKeys){const note=$('vc155-inspector-note');if(note)note.textContent='Video Analytics no está disponible en esta versión.';return;}
 try{const ok=api.openKeys(m.id,keys);if(!ok){const note=$('vc155-inspector-note');if(note)note.textContent='No se ha podido abrir la selección de vídeo.';}}catch(e){console.warn('Analyst Studio video',e)}
}
function exportFile(ext){
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
 view.dataset.vc155Mode=technical?'technical':'studio';
 const studio=$('vc155-studio');if(studio)studio.hidden=!!technical;
 const base=$('vc1614-view-switch');
 base?.querySelector(`[data-mode="${technical?'technical':'intelligence'}"]`)?.click();
 const btn=$('vc155-back');if(btn)btn.hidden=!technical;
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
 if($('vc155-studio')){state.loaded=true;return true;}
 const style=document.createElement('style');style.id='vc155-style';style.textContent=CSS;document.head.appendChild(style);
 host=document.createElement('div');host.id='vc155-studio';host.className='vc155-studio';host.innerHTML=`<div class="vc155-top"><div><span class="vc155-eyebrow">VOLLEY COACH · ANALYST STUDIO</span><h2>Análisis profesional de partido</h2><p id="vc155-match-label">Datos conectados a Scouting Pro y al vídeo</p></div><div class="vc155-actions"><button id="vc155-official" class="vc155-pdf">PDF hoja oficial</button><button id="vc155-propdf">PDF análisis Pro</button><button id="vc155-technical">Análisis técnico</button></div></div>
 <div class="vc155-filterbar"><label class="vc155-match-field">Scouting <span id="vc155-match-count" class="vc155-match-count"></span><select id="vc155-match" aria-label="Seleccionar scouting del análisis"></select></label><button type="button" id="vc155-refresh-matches" title="Actualizar lista de scoutings">↻ Actualizar</button><label>Equipo<select id="vc155-team"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label>Set<select id="vc155-set"></select></label><label>Rotación<select id="vc155-rotation">${selOpts([1,2,3,4,5,6].map(n=>[n,'R'+n]),'','Todas')}</select></label><label>Complejo<select id="vc155-phase"><option value="">K1 + K2</option><option value="K1">K1 · Side-out</option><option value="K2">K2 · Break</option></select></label></div>
 <div class="vc155-work"><nav id="vc155-tabs" class="vc155-tabs" aria-label="Espacios de análisis">${Object.entries(pages).map(([k,[v,sub]])=>`<button type="button" data-section="${k}" aria-selected="false"><b>${v}</b><span>${sub}</span></button>`).join('')}</nav>
 <div class="vc155-stagehead"><div><span class="vc155-eyebrow">ANALYST WORKSPACE</span><h3 id="vc155-section-title">Hoja estadística</h3><p id="vc155-sample"></p></div><div class="vc155-export"><button id="vc155-csv">CSV</button><button id="vc155-json">JSON</button></div></div>
 <div class="vc155-columns"><main id="vc155-content" class="vc155-content"></main><aside class="vc155-inspector"><div class="vc155-inspector-head"><span>INSPECTOR DE JUGADAS</span><h3 id="vc155-inspector-title">Selecciona una cifra de la tabla</h3></div><div id="vc155-inspector-content"><p>Selecciona una cifra para explorar las acciones que la componen.</p></div><button id="vc155-video" disabled>▶ Abrir jugadas en vídeo</button><p id="vc155-inspector-note">Se utiliza Video Analytics y el reproductor original.</p></aside></div></div>
 <p class="vc155-footer">Vista técnica de solo lectura. Las métricas provienen del motor V16.1.4 y solo incluyen rallies cerrados. La Hoja Oficial PDF conserva su generador V11.4.</p>`;
 view.appendChild(host);
 const back=document.createElement('button');back.id='vc155-back';back.hidden=true;back.textContent='← Volver a Analyst Studio';view.insertBefore(back,view.querySelector('.scout-analysis-shell'));
 back.addEventListener('click',()=>switchMode(false));
 $('vc155-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(!b)return;state.page=b.dataset.section;state.player='';state.skill='';state.rating='';renderPage()});
 host.addEventListener('change',e=>{
  const t=e.target,id=t.id;
  if(id==='vc155-match'){
   const chosen=matches().find(m=>String(m.id)===String(t.value));
   if(!chosen){buildHeader();return;}
   state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.player='';
   // Never dispatch the old select's change from Studio: the legacy renderer
   // can rebuild its options and switch back to the active match mid-selection.
   setNativeSelection(state.match);
   state.selected=[];state.selectedTitle='Selecciona una cifra de la tabla';renderInspector();
  } else if(id==='vc155-team'||id==='vc155-set'||id==='vc155-rotation'||id==='vc155-phase'){
   state[id.slice(6)]=t.value;state.selected=[];renderInspector();
  } else if(id==='vc155-player'||id==='vc155-skill'||id==='vc155-rating')state[id.slice(6)]=t.value;
  refresh();
 });
 host.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.pick){let keys=[];try{keys=JSON.parse(decodeURIComponent(t.dataset.pick))}catch(_){ }selectKeys(keys,t.dataset.pickTitle);return}
  switch(t.id){
   case 'vc155-refresh-matches':refresh();break;
   case 'vc155-official':window.scoutV114ExportOfficialPDF?.(currentMatch()?.id);break;
   case 'vc155-propdf':window.scoutV114ExportAnalysisPDF?.(currentMatch()?.id);break;
   case 'vc155-technical':switchMode(true);break;
   case 'vc155-video':openVideo();break;
   case 'vc155-csv':exportFile('csv');break;
   case 'vc155-json':exportFile('json');break;
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
body.v11-shell #scout-analysis[data-vc155-mode="studio"]>.scout-analysis-shell{display:none!important}
#scout-analysis[data-vc155-mode="studio"]>#vc155-back{display:none!important}
#scout-analysis[data-vc155-mode="technical"]>#vc155-studio{display:none!important}
body.v11-shell #scout-analysis #vc155-studio{font:500 13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#183550;max-width:100%;min-width:0;margin:0 auto 25px}
#vc155-studio *{box-sizing:border-box}#vc155-studio button{cursor:pointer;font-family:inherit}#vc155-studio button:focus-visible,#vc155-studio select:focus-visible{outline:3px solid #8bc3f2;outline-offset:1px}
#vc155-studio .vc155-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;background:#102943;color:#fff;border-radius:12px 12px 0 0;padding:20px 22px}
#vc155-studio .vc155-eyebrow{font-size:10px;font-weight:850;color:#75b9e9;letter-spacing:.10em}
#vc155-studio .vc155-top h2{color:#fff!important;font:850 25px/1.2 system-ui!important;margin:5px 0!important}
#vc155-studio .vc155-top p{color:#a9c3da;margin:0;font-size:12px}
#vc155-studio .vc155-actions{display:flex;gap:7px;flex-wrap:wrap}
#vc155-studio .vc155-actions button,#vc155-studio .vc155-export button{background:#244666!important;color:#eaf5ff!important;border:1px solid #44698b!important;border-radius:8px!important;padding:9px 11px!important;font:750 11px system-ui!important;min-height:34px!important}
#vc155-studio .vc155-actions button.vc155-pdf{background:#eff6ff!important;color:#10467d!important;border-color:#d6e5f4!important}
#vc155-studio .vc155-filterbar{display:grid;grid-template-columns:minmax(190px,2fr) repeat(4,minmax(90px,1fr));gap:8px;padding:13px 14px;background:#fff;border:1px solid #d5e1ec}
#vc155-studio .vc155-filterbar label,#vc155-studio .vc155-explorer-filters label{display:grid;gap:4px;color:#56738c;font:800 10px/1.3 system-ui;min-width:0}
body.v11-shell #scout-analysis #vc155-studio select{width:100%!important;max-width:100%!important;min-height:36px!important;height:36px!important;min-width:0!important;padding:6px 8px!important;border-radius:7px!important;border:1px solid #ccdae7!important;background:#fff!important;color:#173e61!important;font:700 11px system-ui!important}
#vc155-studio .vc155-work{background:#f6f9fc;border:1px solid #d5e1ec;border-top:0;padding:12px;border-radius:0 0 12px 12px}
#vc155-studio .vc155-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;background:#e7eef6;padding:5px;border-radius:10px;margin:0 0 12px}
#vc155-studio .vc155-tabs button{background:transparent!important;border:1px solid transparent!important;border-radius:8px!important;padding:9px 6px!important;min-height:52px!important;color:#58758c!important;min-width:0!important;display:grid;align-content:center;gap:3px;text-align:center}
#vc155-studio .vc155-tabs button[aria-selected="true"]{background:#fff!important;border-color:#c6d9e8!important;color:#154d7b!important;box-shadow:0 2px 7px #1b43600f}
#vc155-studio .vc155-tabs b{font-size:12px}#vc155-studio .vc155-tabs span{font-size:9px;color:inherit}
#vc155-studio .vc155-stagehead{display:flex;align-items:end;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:2px 5px 13px}
#vc155-studio .vc155-stagehead h3{font:850 20px/1.2 system-ui!important;color:#143b5c!important;margin:4px 0!important}
#vc155-studio .vc155-stagehead p{color:#718aa0;font-size:11px;margin:0}
#vc155-studio .vc155-export{display:flex;gap:5px}#vc155-studio .vc155-export button{background:#fff!important;color:#28618d!important;border-color:#c7dce9!important}
#vc155-studio .vc155-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,275px);gap:11px;align-items:start}
#vc155-studio .vc155-content{min-width:0!important;display:grid;gap:11px;margin:0;padding:0;width:auto;max-width:none}
#vc155-studio .vc155-panel,#vc155-studio .vc155-inspector{background:#fff;border:1px solid #d8e5ef;border-radius:10px;padding:15px;min-width:0;box-shadow:0 3px 10px #102a4207}
#vc155-studio .vc155-panel h3,#vc155-studio .vc155-inspector h3{color:#164265!important;font:850 15px/1.3 system-ui!important;margin:0 0 10px!important}
#vc155-studio .vc155-panel p{font:500 11px/1.55 system-ui;color:#617e95}
#vc155-studio .vc155-panelhead{display:flex;gap:10px;align-items:start;justify-content:space-between}
#vc155-studio .vc155-panelhead h3{margin-bottom:4px!important}
#vc155-studio .vc155-tag{background:#eaf3fb;color:#2c668f;border-radius:999px;padding:5px 8px;white-space:nowrap;font-size:10px}
#vc155-studio .vc155-tablewrap{overflow:auto;max-width:100%;border:1px solid #e2eaf1;border-radius:7px}
#vc155-studio .vc155-table{width:100%;border-collapse:collapse;font:650 11px/1.4 system-ui;white-space:nowrap;min-width:550px}
#vc155-studio .vc155-table th{background:#edf4f9;color:#597b94;letter-spacing:.01em;text-align:left;font-weight:850;font-size:10px;padding:10px 9px;border-bottom:1px solid #d3e2ed}
#vc155-studio .vc155-table td{color:#365d78;font-variant-numeric:tabular-nums;padding:9px;border-bottom:1px solid #ebf0f5}
#vc155-studio .vc155-table tbody tr:hover{background:#f7fbff}#vc155-studio .vc155-table td small{display:block;color:#90a3b4;font-size:9px}
#vc155-studio .vc155-table .vc155-player{font-weight:850;color:#1a4e76}
#vc155-studio .vc155-table .vc155-muted{padding:16px;color:#718a9e;text-align:center}
#vc155-studio .vc155-pick{background:transparent!important;border:0!important;color:#1766a4!important;font:800 11px system-ui!important;text-decoration:underline;text-decoration-color:#abd0ea;text-underline-offset:3px;padding:2px!important;white-space:nowrap}
#vc155-studio .vc155-pick:hover{color:#073c67!important}
#vc155-studio .vc155-note{border-top:1px solid #e6edf4;padding-top:10px;margin-top:11px!important;color:#768fa2!important;font-size:10px!important}
#vc155-studio .vc155-grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
#vc155-studio .vc155-inspector{position:sticky;top:74px;max-height:min(76vh,800px);overflow:auto}
#vc155-studio .vc155-inspector-head{border-bottom:1px solid #e4edf4;padding-bottom:7px;margin-bottom:8px}
#vc155-studio .vc155-inspector-head span{font-size:9px;font-weight:900;letter-spacing:.1em;color:#6e94b3}
#vc155-studio .vc155-inspector-head h3{margin:5px 0!important;font-size:14px!important}
#vc155-studio .vc155-inspector p{font-size:11px;color:#617e95;line-height:1.5}
#vc155-studio .vc155-inspector-list{display:grid;gap:5px;max-height:285px;overflow:auto}
#vc155-studio .vc155-inspector-item{display:flex;justify-content:space-between;align-items:center;gap:4px;background:#f4f8fb;border:1px solid #e2ebf3;border-radius:7px;padding:7px}
#vc155-studio .vc155-inspector-item b{color:#254e6c;font:850 11px ui-monospace,Consolas,monospace}
#vc155-studio .vc155-inspector-item small{display:block;color:#7591a7;font-size:9px}
#vc155-studio .vc155-inspector-item>span{font-size:9px;color:#598bb1;white-space:nowrap}
#vc155-studio #vc155-video{background:#155ba4!important;color:#fff!important;border:1px solid #155ba4!important;border-radius:8px!important;min-height:38px!important;padding:9px!important;width:100%;font:850 11px system-ui!important;margin-top:10px}
#vc155-studio #vc155-video:disabled{opacity:.4;cursor:not-allowed}
#vc155-studio .vc155-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
#vc155-studio .vc155-metric{display:grid;gap:5px;align-content:start;background:#fff;border:1px solid #d8e5ef;border-radius:10px;padding:12px}
#vc155-studio .vc155-metric>span{color:#68849a;font-size:10px;font-weight:800}
#vc155-studio .vc155-metric strong{color:#163c5e;font-size:23px}
#vc155-studio .vc155-metric small{color:#8297a9;font-size:10px}
#vc155-studio .vc155-metric button{justify-self:start}
#vc155-studio .vc155-statline{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e8eef4}
#vc155-studio .vc155-insight{border-left:3px solid #6d9cc1;background:#f4f9fd;padding:9px 10px;border-radius:6px;margin-bottom:6px}
#vc155-studio .vc155-insight b{font-size:11px;color:#234e70}#vc155-studio .vc155-insight p{margin:4px 0}
#vc155-studio .vc155-cellbar{display:inline-block;width:45px;height:5px;border-radius:5px;background:#e0eaf3;margin-right:6px;vertical-align:middle;overflow:hidden}
#vc155-studio .vc155-cellbar i{display:block;height:100%;background:#2f83bd}
#vc155-studio .vc155-court{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;background:#cfa067;border:2px solid #b88041;border-radius:9px;padding:7px;max-width:410px}
#vc155-studio .vc155-zone{display:grid;place-items:center;gap:3px;min-height:82px!important;position:relative;overflow:hidden;background:#fff9ef!important;border:1px solid #ddc6a8!important;border-radius:7px!important;color:#20455f!important}
#vc155-studio .vc155-zone i{position:absolute;inset:0;background:#368dd4;pointer-events:none}
#vc155-studio .vc155-zone>*:not(i){position:relative;z-index:1}#vc155-studio .vc155-zone strong{font-size:21px}
#vc155-studio .vc155-explorer-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}
#vc155-studio .vc155-footer{margin-top:12px;font-size:10px;color:#7a90a4}
#scout-analysis #vc155-back{background:#eaf4fc!important;color:#205b85!important;border:1px solid #b6d3ea!important;border-radius:9px!important;padding:10px 13px!important;margin-bottom:12px;font:800 12px system-ui!important}
#scout-analysis #vc155-back[hidden]{display:none!important}
@media(max-width:1200px){#vc155-studio .vc155-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}#vc155-studio .vc155-filterbar{grid-template-columns:repeat(3,minmax(0,1fr))}#vc155-studio .vc155-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){#vc155-studio .vc155-columns{grid-template-columns:1fr}#vc155-studio .vc155-inspector{position:static;max-height:none}#vc155-studio .vc155-grid2{grid-template-columns:1fr}}
@media(max-width:600px){#vc155-studio .vc155-top{padding:14px}#vc155-studio .vc155-top h2{font-size:20px!important}#vc155-studio .vc155-filterbar{grid-template-columns:1fr 1fr}#vc155-studio .vc155-filterbar label:first-child{grid-column:1/-1}#vc155-studio .vc155-work{padding:7px}#vc155-studio .vc155-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}#vc155-studio .vc155-tabs button{min-height:49px!important}#vc155-studio .vc155-tabs span{font-size:8px}#vc155-studio .vc155-panel{padding:10px}#vc155-studio .vc155-explorer-filters{grid-template-columns:1fr 1fr}}

/* V16.1.5.6 · Analyst Workbench: dense statistical sheet, persistent filters,
   vertical technical navigation and contextual video inspector. */
#vc155-studio .vc155-top{padding:13px 18px!important;border-radius:10px 10px 0 0!important}
#vc155-studio .vc155-top h2{font-size:21px!important;margin:2px 0!important}
#vc155-studio .vc155-top p{font-size:11px!important}
#vc155-studio .vc155-filterbar{grid-template-columns:minmax(195px,2fr) auto repeat(4,minmax(80px,1fr))!important;align-items:end!important;background:#f7fafc!important;padding:10px 13px!important;gap:8px!important}
#vc155-studio .vc155-match-field{position:relative}
#vc155-studio .vc155-match-count{font:700 9px/1 system-ui,sans-serif;color:#5f819d;position:absolute;right:0;top:0}
#vc155-studio #vc155-refresh-matches{min-height:36px!important;padding:7px 10px!important;color:#265985!important;background:#fff!important;border:1px solid #cad9e8!important;border-radius:7px!important;font:750 11px system-ui,sans-serif!important}
#vc155-studio .vc155-work{display:grid!important;grid-template-columns:160px minmax(0,1fr)!important;grid-template-areas:"nav head" "nav contents"!important;gap:8px 13px!important;padding:10px!important;align-items:start}
#vc155-studio .vc155-tabs{grid-area:nav!important;display:flex!important;flex-direction:column!important;position:sticky;top:76px;padding:7px!important;gap:4px!important;margin:0!important;align-self:start;min-height:270px;background:#eaf0f6!important}
#vc155-studio .vc155-tabs button{text-align:left!important;min-height:46px!important;padding:9px 10px!important;justify-content:start!important;align-content:center!important}
#vc155-studio .vc155-tabs b{font-size:11px!important}
#vc155-studio .vc155-tabs span{font-size:9px!important}
#vc155-studio .vc155-stagehead{grid-area:head!important;padding:2px 4px 8px!important}
#vc155-studio .vc155-stagehead h3{font-size:18px!important}
#vc155-studio .vc155-columns{grid-area:contents!important;grid-template-columns:minmax(0,1fr) minmax(225px,250px)!important;gap:9px!important}
#vc155-studio .vc155-panel,#vc155-studio .vc155-inspector{padding:12px!important;box-shadow:none!important}
#vc155-studio .vc155-inspector{top:76px!important}
#vc155-studio .vc155-table{font-size:10.5px!important}
#vc155-studio .vc155-table td{padding:7px 7px!important}
#vc155-studio .vc155-table th{padding:8px 7px!important;position:sticky;top:0;z-index:1}
#vc155-studio .vc155-table td:first-child,#vc155-studio .vc155-table th:first-child{position:sticky;left:0;background:#fff;z-index:2;box-shadow:1px 0 #dce6ef}
#vc155-studio .vc155-table th:first-child{background:#edf4f9;z-index:3}
#vc155-studio .vc155-table tbody tr:hover td:first-child{background:#f7fbff}
#vc155-studio .vc155-content{gap:9px!important}
@media(max-width:1220px){#vc155-studio .vc155-filterbar{grid-template-columns:minmax(180px,2fr) auto repeat(2,minmax(85px,1fr))!important}#vc155-studio .vc155-columns{grid-template-columns:minmax(0,1fr)!important}#vc155-studio .vc155-inspector{position:static!important;max-height:none!important}}
@media(max-width:850px){#vc155-studio .vc155-work{grid-template-columns:1fr!important;grid-template-areas:"nav" "head" "contents"!important}#vc155-studio .vc155-tabs{position:static!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;min-height:0!important}#vc155-studio .vc155-tabs button{text-align:center!important}#vc155-studio .vc155-filterbar{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important}}
@media(max-width:550px){#vc155-studio .vc155-filterbar{grid-template-columns:minmax(0,1fr) auto!important}#vc155-studio .vc155-filterbar .vc155-match-field{grid-column:1!important}#vc155-studio .vc155-filterbar>label:not(.vc155-match-field){grid-column:span 1}#vc155-studio .vc155-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}}

`;
window.VC_ANALYST_STUDIO_16155={version:'16.1.5.6',mount,open,refresh,setPage:(p)=>{if(pages[p]){state.page=p;renderPage()}},diagnostics:()=>({loaded:state.loaded,draws:state.draws,page:state.page,technical:state.technical,selected:state.selected.length,locked:false})};
})();
