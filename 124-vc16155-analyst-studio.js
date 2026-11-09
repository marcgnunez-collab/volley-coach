/* Volley Coach V16.5.1 · Analysis Pro 3.0 · Tactical Laboratory Pro
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
// Analysis Pro 3.0: five workspaces. Legacy route keys remain as non-visible
// aliases so internal links and old integrations cannot strand the user.
const pages={
 overview:['Resumen','Lectura rápida del partido'],
 players:['Estadísticas','Constructor de hojas y fundamentos'],
 lab:['Laboratorio táctico','Rotaciones, ataque, colocador y secuencias'],
 athletes:['Jugadores','Fichas individuales y comparador'],
 explorer:['Vídeo y acciones','Búsqueda y revisión de evidencias'],
 comparisons:['Comparativas','Partidos, jugadores y rivales'],
 reports:['Informes Pro','Partidos, jugadores y rivales · PDF propio'],
 tactics:['Laboratorio táctico','Compatibilidad con rutas antiguas'],
 setter:['Laboratorio táctico','Compatibilidad con rutas antiguas'],
 season:['Temporada','Comparación histórica disponible desde el menú general']
};
const mainPages=['overview','players','lab','athletes','explorer','comparisons','reports'];
const subpages={
 players:[['builder','Hojas configurables'],['sheet','Hoja oficial por jugador'],['fundamentals','Fundamentos Pro']],
 lab:[['workbench','Mesa táctica'],['rotations','Rotaciones y K1/K2'],['zones','Mapa de ataque'],['distribution','Distribución del colocador'],['details','Tempos y combinaciones'],['sequences','Secuencias y patrones']],
 athletes:[['profile','Ficha individual'],['compare','Comparador A/B']],
 comparisons:[['matches','Partidos A/B'],['players','Jugadores y evolución'],['rivals','Scouting de rivales']],
 tactics:[['rotations','Rotaciones y complejos'],['zones','Zonas y bloqueo']],
 setter:[['distribution','Distribución y destinos'],['details','Tempos y combinaciones'],['sequences','Secuencias y patrones']]
};
function routeTo(main,sub){
 if(main==='tactics')return ['lab',sub==='zones'?'zones':'rotations'];
 if(main==='setter')return ['lab',['distribution','details','sequences'].includes(sub)?sub:'distribution'];
 if(main==='players'&&['profile','compare'].includes(sub))return ['athletes',sub];
 return [main,sub];
}

// V16.5.7: report preferences contain only presentation flags, never match data.
function reportPreferences(){
 return window.VC_REPORTS_1657?.loadPrefs?.()||{kind:'match',sections:{}}
}
function saveReportPreferences(){
 window.VC_REPORTS_1657?.savePrefs?.(state.report);
}
let reportEntries=[];
function exportReportFile(type){
 const api=window.VC_REPORTS_1657;
 if(!api)return;
 const plan=api.make(reportEntries,state.report),notice=$('vc1657-status');
 if(plan.error){if(notice)notice.textContent=plan.error;return;}
 const button=$(type==='pdf'?'vc1657-pdf':'vc1657-html');if(button)button.disabled=true;
 const task=async()=>{
  if(type==='pdf'){
   if(!window.jspdf?.jsPDF){if(!window.v141EnsurePdfLibraries)throw new Error('Motor PDF no disponible; utiliza la descarga HTML.');await window.v141EnsurePdfLibraries();}
   api.createPDF(plan,window.jspdf?.jsPDF).save(api.filename(plan,'pdf'));
  }else{
   const blob=new Blob([api.htmlDocument(plan)],{type:'text/html;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=api.filename(plan,'html');document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
 };
 task().then(()=>{if(notice)notice.textContent=type==='pdf'?'PDF generado.':'HTML descargado; también puedes imprimirlo como PDF desde el navegador.'}).catch(error=>{console.warn('Informes Pro',error);if(notice)notice.textContent=`Error al exportar: ${error.message||error}. Puedes utilizar el HTML como alternativa.`}).finally(()=>{if(button?.isConnected)button.disabled=false});
}
function inDeepView(){return state.page==='players'&&state.subpage.players==='fundamentals';}
const state={page:'overview',subpage:{players:'builder',lab:'workbench',athletes:'profile',comparisons:'matches',tactics:'rotations',setter:'distribution'},team:'ours',set:'',rotation:'',phase:'',skill:'',rating:'',player:'',match:'',technical:false,deepSkill:'A',deepDim:'player',deepPlayer:'',profilePlayer:'',comparePlayerA:'',comparePlayerB:'',setterPlayer:'',setterReception:'',setterTempo:'',attackPlayer:'',attackResult:'',seqReception:'',seqReceiver:'',seqAttacker:'',seqOutcome:'',seqCompareA:'',seqCompareB:'',labFilters:{reception:'all',setter:'',attacker:'',tempo:'',outcome:'',destination:''},selected:[],selectedTitle:'Selecciona una cifra de la tabla',worksheet:{skill:'A',group:'player',reception:'all',sort:'count',columns:['count','kills','errors','blocked','gp','eff','video']},worksheetSavedName:'',worksheetNotice:'',compareSelection:{matchA:'',matchB:'',playerA:'',playerB:''},loaded:false,draws:0};
let host=null,native=null,view=null;
// Same immutable-for-UI model that painted the current view. Never reused for a
// fresh refresh or export: scouting data can change in place after a cloud pull.
let paintedModel=null;
const vc1632Metrics={modelCalls:0,modelMs:0,modelMaxMs:0,drillReuses:0,drillMisses:0,renderCalls:0,renderMs:0,renderMaxMs:0};
const perfNow=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
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
 const started=perfNow();
 try{return api.model(filteredMatch(m),scoutedTeam(),{team:state.team,set:state.set,rotation:state.rotation});}
 finally{const elapsed=perfNow()-started;vc1632Metrics.modelCalls++;vc1632Metrics.modelMs+=elapsed;vc1632Metrics.modelMaxMs=Math.max(vc1632Metrics.modelMaxMs,elapsed)}
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
  return `<tr><td class="vc157-player">${pickButton(p.name,keys,`Todas las acciones · ${p.name}`,'vc157-namelink')}<button class="vc1626-profilelink" type="button" data-vc1626-open="${html(vc1626Identity(playerActions[0]))}" title="Abrir ficha de ${html(p.name)}">Ficha ↗</button></td><td>${p.n}</td>${cell(''+pts,'Puntos directos',canonical?officialKeys(['wonActions']):by(direct))}${cell(''+signed(gp),'G-P oficial',canonical?officialKeys(['wonActions','lostActions']):by(gpRelevant))}${cell(''+signed(serveGP),'Saque G-P',by(r=>r.skill==='S'&&['#','='].includes(r.ev)))}<td>${pickButton(fmt(recPct),by(r=>r.skill==='R'&&['#','+'].includes(r.ev)),`Recepciones positivas · ${p.name}`)}<small>${rec.positive||0}/${rec.n||0}</small></td><td>${pickButton(`${rec.perfect||0}/${rec.n||0}`,by(r=>r.skill==='R'&&r.ev==='#'),`Recepciones perfectas · ${p.name}`)}</td><td>${pickButton(`${ap}/${attack.n||0}`,by(r=>r.skill==='A'&&r.ev==='#'),`Ataques punto · ${p.name}`)}</td><td>${pickButton(`${ae}+${ab}`,by(r=>r.skill==='A'&&['=','/'].includes(r.ev)),`Errores y ataques bloqueados · ${p.name}`)}</td><td>${pickButton(fmt(atkEff),by(r=>r.skill==='A'),`Todos los ataques · ${p.name}`)}</td><td>${pickButton(''+(block.kills||0),by(r=>r.skill==='B'&&r.ev==='#'),`Bloqueos punto · ${p.name}`)}</td></tr>`;
 }).join('');
}
function pagePlayers(data){return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Hoja individual · G-P y eficiencia</h3><p>Una fila por jugador y todas las acciones del filtro. Pulsa un jugador o una cifra para inspeccionar sus jugadas.</p></div><span class="vc157-tag">${data.playerGroups.length} jugadores</span></div>
 ${table(['Jugador','Acc.','PTS','G-P','Saq. G-P','Rec. +/#','Rec. #','Ataque #','Err+BLO','Atq. EFF','Bloq. #'],sheetRows(data),'vc157-sheet')}
 <p class="vc157-note">PTS y G-P = atribución terminal de la Hoja Oficial; máximo una acción terminal por rally. Recepción +/# = (# + +)/total; eficiencia de ataque = (# − = − /)/ataques. Revisa los denominadores antes de comparar.</p></div>
 <div class="vc157-grid2"><div class="vc157-panel"><h3>Acciones registradas por fundamento</h3>${table(['Fundamento','Total','Positivas','Errores','Vídeo'],Object.entries(categories).map(([s,n])=>{const g=data.skills[s],rows=rowsBy(data,r=>r.skill===s);if(!g?.n)return'';return `<tr><td>${n}</td><td>${g.n}</td><td>${g.positive||0}</td><td>${g.errors||0}</td><td>${pickButton('Ver',rows.map(x=>x.key),n)}</td></tr>`}).join(''))}</div></div>`}
/* V16.2.7 · Tactical board & table fix. Read-only and based on the same closed-rally rows
   as the official sheet. Player history requires stable own-team ID + matching
   name snapshots; rival shirt numbers are never used to combine matches. */
function vc1626Norm(v){return String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim()}
function vc1626Identity(row){
 const id=Number(row?.a?.playerId);
 if(row?.team==='ours'&&Number.isSafeInteger(id)&&id>0)return `id:${id}`;
 return `label:${vc1626Norm(row?.player)||'sin identificar'}`;
}
function vc1626Roster(data){
 const players=new Map();
 for(const row of data.actions){
  const key=vc1626Identity(row);
  if(!players.has(key))players.set(key,{key,name:row.player,rows:[],id:key.startsWith('id:')?Number(key.slice(3)):null});
  const p=players.get(key);p.rows.push(row);
  if(row.player&&p.name==='Sin identificar')p.name=row.player;
 }
 return [...players.values()].sort((a,b)=>b.rows.length-a.rows.length||a.name.localeCompare(b.name,'es'));
}
function vc1626Stats(rows){
 const skill=c=>rows.filter(r=>r.skill===c);
 const att=skill('A'),rec=skill('R'),serve=skill('S'),block=skill('B'),set=skill('E'),def=skill('D');
 const n=arr=>arr.length,eq=(arr,v)=>arr.filter(x=>x.ev===v).length;
 const atkK=eq(att,'#'),atkE=eq(att,'='),atkB=eq(att,'/');
 const positive=rec.filter(x=>x.ev==='#'||x.ev==='+').length;
 return {rows,n:rows.length,video:rows.filter(r=>r.video).length,
  attack:{n:n(att),k:atkK,e:atkE,b:atkB,eff:pct(atkK-atkE-atkB,n(att)),killPct:pct(atkK,n(att)),rows:att},
  reception:{n:n(rec),positive,perfect:eq(rec,'#'),errors:eq(rec,'='),pct:pct(positive,n(rec)),rows:rec},
  serve:{n:n(serve),ace:eq(serve,'#'),error:eq(serve,'='),rows:serve},
  block:{n:n(block),points:eq(block,'#'),rows:block},set:{n:n(set),rows:set},defense:{n:n(def),rows:def},
  skills:Object.fromEntries(Object.keys(categories).map(key=>[key,skill(key)]))};
}
function vc1626Opts(roster,selected){return roster.map(p=>`<option value="${html(p.key)}" ${selected===p.key?'selected':''}>${html(p.name)} · ${p.rows.length} acciones</option>`).join('')}
function vc1626Find(roster,key){return roster.find(p=>p.key===key)||roster[0]||null}
function vc1626ProfileMetric(label,value,note,rows){return `<div class="vc1626-stat"><small>${html(label)}</small><strong>${html(value)}</strong><span>${html(note)}</span>${pickButton('Ver acciones',rows.map(r=>r.key),`${label} · ficha individual`)}</div>`}
function vc1626GroupMetrics(rows){
 const s=vc1626Stats(rows);
 return `${vc1626ProfileMetric('Ataque · EFF',fmt(s.attack.eff),`${s.attack.k} puntos − ${s.attack.e} errores − ${s.attack.b} bloqueados / ${s.attack.n} ataques`,s.attack.rows)}
 ${vc1626ProfileMetric('Recepción positiva',fmt(s.reception.pct),`${s.reception.positive}/${s.reception.n} recepciones # o +`,s.reception.rows)}
 ${vc1626ProfileMetric('Saque',`${s.serve.ace}/${s.serve.n}`,`${s.serve.error} errores · ${s.serve.n} intentos`,s.serve.rows)}
 ${vc1626ProfileMetric('Bloqueo punto',String(s.block.points),`${s.block.n} bloqueos registrados`,s.block.rows)}
 ${vc1626ProfileMetric('Colocaciones',String(s.set.n),'Colocaciones codificadas',s.set.rows)}
 ${vc1626ProfileMetric('Acciones',String(s.n),`${s.video} con marca temporal`,s.rows)}`;
}
function vc1626Skills(rows){
 const total=rows.length;
 const tr=Object.entries(categories).map(([code,label])=>{
  const ss=rows.filter(r=>r.skill===code),n=ss.length;
  if(!n)return '';
  const st=vc1626Stats(ss);
  let detail=code==='A'?`${st.attack.k} # · ${st.attack.e} = · ${st.attack.b} / · EFF ${fmt(st.attack.eff)}`:
   code==='R'?`${st.reception.positive}/${st.reception.n} positivas · ${fmt(st.reception.pct)}`:
   code==='S'?`${st.serve.ace} aces · ${st.serve.error} errores`:
   code==='B'?`${st.block.points} puntos`:`${ss.filter(r=>['#','+'].includes(r.ev)).length} positivas`;
  return `<tr><td><b>${html(label)}</b></td><td>${n}<small>${fmt(pct(n,total))} del registro</small></td><td><span class="vc1626-bar"><i style="width:${Math.max(0,pct(n,total)||0)}%"></i></span></td><td>${html(detail)}</td><td>${pickButton('Jugadas',ss.map(r=>r.key),`${label} · ficha`)}</td></tr>`;
 }).join('');
 return table(['Fundamento','Acciones','Distribución','Detalle','Evidencias'],tr,'vc1626-sheet');
}
function vc1626Breakdown(rows,field){
 const choices=field==='set'?[...new Set(rows.map(r=>r.set))].sort((a,b)=>a-b):[1,2,3,4,5,6];
 return choices.map(c=>{
  const rr=rows.filter(r=>field==='set'?r.set===c:r.rotation===c),s=vc1626Stats(rr);
  if(!rr.length)return '';
  const label=field==='set'?`Set ${c}`:`R${c}`;
  return `<tr><td><b>${label}</b></td><td>${rr.length}</td><td>${s.attack.k}/${s.attack.n}<small>EFF ${fmt(s.attack.eff)}</small></td><td>${s.reception.positive}/${s.reception.n}<small>${fmt(s.reception.pct)}</small></td><td>${s.serve.ace}/${s.serve.n}</td><td>${pickButton('Ver',rr.map(r=>r.key),`${label} · ficha`)}</td></tr>`;
 }).join('');
}
function vc1626History(p){
 if(state.team!=='ours')return '<p class="vc1626-hint">La evolución individual del rival no se agrupa entre partidos: el dorsal no garantiza una identidad estable.</p>';
 if(!p.id)return '<p class="vc1626-hint">El jugador no tiene un identificador estable. La comparación entre partidos se omite para evitar unir personas distintas.</p>';
 const names=new Set(p.rows.map(r=>vc1626Norm(r.a?.playerNameSnapshot)).filter(Boolean));
 if(!names.size)return '<p class="vc1626-hint">No hay un nombre guardado en las acciones para verificar la identidad entre partidos. El histórico individual no se calcula.</p>';
 const api=window.VC_ANALYSIS_INTELLIGENCE_1614;
 const history=[];
 for(const m of matches().slice(0,12)){
  try{
   const d=api.model(filteredMatch(m),scoutedTeam(),{team:'ours'});
   const all=d.actions.filter(r=>r.team==='ours'&&Number(r.a?.playerId)===p.id);
   const good=all.filter(r=>names.has(vc1626Norm(r.a?.playerNameSnapshot)));
   // Reject a match when its ID also belongs to a conflicting known identity.
   const conflict=all.some(r=>r.a?.playerNameSnapshot&&!names.has(vc1626Norm(r.a.playerNameSnapshot)));
   if(!good.length||conflict)continue;
   history.push({m,stats:vc1626Stats(good)});
  }catch(err){console.warn('Player Performance: historial omitido',m.id,err)}
 }
 history.sort((a,b)=>String(a.m.date||'').localeCompare(String(b.m.date||''))||Number(a.m.id||0)-Number(b.m.id||0));
 if(!history.length)return '<p class="vc1626-hint">No se han encontrado partidos con coincidencia verificada de ID y nombre guardado.</p>';
 const rows=history.map(x=>{const s=x.stats;return `<tr><td><button class="vc1626-matchlink" data-vc1626-history="${html(String(x.m.id))}">${html(x.m.opponent||'Rival')}</button><small>${html(x.m.date||'Sin fecha')}</small></td><td>${s.n}</td><td>${s.attack.k}/${s.attack.n}<small>EFF ${fmt(s.attack.eff)}</small></td><td>${s.reception.positive}/${s.reception.n}<small>${fmt(s.reception.pct)}</small></td><td>${s.serve.ace}</td><td>${s.block.points}</td></tr>`}).join('');
 const chart=history.map(x=>{const a=x.stats.attack;return `<div class="vc1626-trendrow"><small>${html(x.m.opponent||'Rival')}</small><span class="vc1626-trendtrack"><i style="width:${a.n&&a.eff!=null?Math.max(0,Math.min(100,(a.eff+100)/2)):0}%"></i></span><b>${fmt(a.eff)}</b><small>${a.n} ataques</small></div>`}).join('');
 return `<p class="vc1626-hint">Hasta 12 scoutings recientes. Solo coincidencias con ID y nombre guardado. No se aplican los filtros de set ni rotación a esta serie.</p><div class="vc1626-historygrid"><div>${table(['Partido','Acc.','Ataque','Recepción','Aces','Bloq.'],rows)}</div><div class="vc1626-minichart"><b>Ataque · EFF por partido</b>${chart}<p class="vc1626-hint">La barra representa visualmente EFF entre −100 % y +100 %, no el porcentaje de ataques ganados.</p></div></div>`;
}
function pagePlayerProfile(data){
 const roster=vc1626Roster(data);
 if(!roster.length)return '<div class="vc157-empty">Todavía no hay acciones cerradas de jugadores con los filtros actuales.</div>';
 const player=vc1626Find(roster,state.profilePlayer);state.profilePlayer=player.key;
 const rows=player.rows,stats=vc1626Stats(rows);
 const options=vc1626Opts(roster,player.key);
 const phases=[['K1',rows.filter(r=>r.r?.serving&&r.r.serving!==r.team)],['K2',rows.filter(r=>r.r?.serving===r.team)],['Sin saque registrado',rows.filter(r=>!r.r?.serving)]].filter(([,list])=>list.length);
 return `<section class="vc157-panel vc1626-profilehead"><div class="vc1626-profiletop"><div><span class="vc1626-overline">PLAYER PERFORMANCE PRO · PERFIL DE PARTIDO</span><h3>${html(player.name)}</h3><p>Datos del equipo ${data.target==='ours'?'propio':'rival'} · ${rows.length} acciones registradas · ${stats.video} con vídeo</p></div><label>Seleccionar jugador<select id="vc1626-player">${options}</select></label></div><div class="vc1626-summary">${vc1626GroupMetrics(rows)}</div><p class="vc157-note">Los indicadores se calculan sobre acciones registradas y rallies cerrados. La ficha no atribuye un resultado de rally completo a una única persona.</p></section>
 <div class="vc157-panel"><h3>Rendimiento por fundamento</h3><p>Desglose de acciones registradas, valoraciones y evidencia original.</p>${vc1626Skills(rows)}</div>
 <div class="vc157-grid2"><section class="vc157-panel"><h3>Por rotación</h3>${table(['Rot.','Acc.','Ataque','Recepción','Aces','Jugadas'],vc1626Breakdown(rows,'rotation'))}<p class="vc157-note">R1–R6 se refiere a la rotación del equipo en el instante de la acción, no a la rotación nominal o posición del jugador.</p></section><section class="vc157-panel"><h3>Por set</h3>${table(['Set','Acc.','Ataque','Recepción','Aces','Jugadas'],vc1626Breakdown(rows,'set'))}</section></div>
 <section class="vc157-panel"><h3>Participación por complejo</h3>${table(['Fase','Acciones','Ataques','Rec. positivas','Colocaciones','Jugadas'],phases.map(([phase,rr])=>{const st=vc1626Stats(rr);return `<tr><td>${phase}</td><td>${st.n}</td><td>${st.attack.k}/${st.attack.n}<small>EFF ${fmt(st.attack.eff)}</small></td><td>${st.reception.positive}/${st.reception.n}</td><td>${st.set.n}</td><td>${pickButton('Ver',rr.map(r=>r.key),`${phase} · ${player.name}`)}</td></tr>`}).join(''))}<p class="vc157-note">K1 y K2 clasifican las acciones según quién sacaba antes del rally. Las acciones sin saque conocido se indican aparte. No representan un porcentaje individual de side-out o de break.</p></section>
 <section class="vc157-panel"><h3>Evolución individual entre partidos</h3>${vc1626History(player)}</section>`;
}
function vc1626ComparisonMetric(label,a,b,fn,den){
 const A=fn(a),B=fn(b),val=x=>x==null?'—':fmt(x),small=Math.min(den(a),den(b))<8;
 return `<tr><th scope="row">${html(label)}</th><td><b>${val(A)}</b><small>n=${den(a)}</small></td><td><b>${val(B)}</b><small>n=${den(b)}</small></td><td>${small?'<span class="vc1626-small">Muestra pequeña</span>':(A==null||B==null?'—':`${signed(Math.round((A-B)*10)/10)} pp`)}</td></tr>`;
}
function pagePlayerCompare(data){
 const roster=vc1626Roster(data);
 if(roster.length<2)return '<div class="vc157-panel"><h3>Comparador de jugadores</h3><p>Se necesitan al menos dos jugadores con acciones codificadas en este scouting y filtros.</p></div>';
 let a=roster.find(p=>p.key===state.comparePlayerA)||null;
 let b=roster.find(p=>p.key===state.comparePlayerB)||null;
 if(!a)a=roster.find(p=>p.key!==b?.key)||roster[0];
 if(!b||b.key===a.key)b=roster.find(p=>p.key!==a.key)||null;
 if(!a||!b)return '<div class="vc157-empty">Elige dos jugadores diferentes.</div>';
 state.comparePlayerA=a.key;state.comparePlayerB=b.key;
 const x=vc1626Stats(a.rows),y=vc1626Stats(b.rows);
 const row=(title,fn)=>`<tr><td>${title}</td><td>${fn(x)}</td><td>${fn(y)}</td><td>—</td></tr>`;
 return `<section class="vc157-panel"><div class="vc157-panelhead"><div><h3>Comparador individual</h3><p>Compara dos jugadores en el mismo scouting y con los mismos filtros globales.</p></div><span class="vc157-tag">Datos comparables por contexto, no por minutos jugados</span></div><div class="vc1626-comparefilters"><label>Jugador A<select id="vc1626-player-a">${vc1626Opts(roster,a.key)}</select></label><label>Jugador B<select id="vc1626-player-b">${vc1626Opts(roster,b.key)}</select></label></div><div class="vc1626-duel"><div><span>JUGADOR A</span><strong>${html(a.name)}</strong><small>${x.n} acciones · ${x.video} con vídeo</small>${pickButton('Abrir todas sus jugadas',a.rows.map(r=>r.key),a.name)}</div><div><span>JUGADOR B</span><strong>${html(b.name)}</strong><small>${y.n} acciones · ${y.video} con vídeo</small>${pickButton('Abrir todas sus jugadas',b.rows.map(r=>r.key),b.name)}</div></div>
 ${table(['Indicador',a.name,b.name,'Diferencia A−B'],[
  vc1626ComparisonMetric('Ataque · EFF',x,y,s=>s.attack.eff,s=>s.attack.n),
  vc1626ComparisonMetric('Ataque · puntos %',x,y,s=>s.attack.killPct,s=>s.attack.n),
  vc1626ComparisonMetric('Recepción positiva +/#',x,y,s=>s.reception.pct,s=>s.reception.n),
  row('Ataque · puntos / intentos',s=>`${s.attack.k} / ${s.attack.n}`),
  row('Ataque · errores + bloqueados',s=>`${s.attack.e+s.attack.b}`),
  row('Saque · aces / intentos',s=>`${s.serve.ace} / ${s.serve.n}`),
  row('Bloqueos punto / intentos',s=>`${s.block.points} / ${s.block.n}`),
  row('Colocaciones',s=>s.set.n)
 ].join(''))}<p class="vc157-note">La diferencia en pp solo se muestra con al menos 8 intentos por jugador; las muestras individuales se indican siempre. Compara jugadores con roles parecidos y volumen suficiente. Los totales no están normalizados por tiempo en pista.</p></section>
 <section class="vc157-panel"><h3>Comparación por fundamento</h3>${table(['Fundamento','Acciones A','Acciones B','Jugadas A','Jugadas B'],Object.entries(categories).map(([k,label])=>{const aa=x.skills[k],bb=y.skills[k];if(!aa.length&&!bb.length)return '';return `<tr><td>${html(label)}</td><td>${aa.length}</td><td>${bb.length}</td><td>${pickButton('Ver',aa.map(r=>r.key),`${label} · ${a.name}`)}</td><td>${pickButton('Ver',bb.map(r=>r.key),`${label} · ${b.name}`)}</td></tr>`}).join(''))}</section>`;
}
function overviewKpi(label,number,note,keys){
 return `<div class="vc1625-kpi"><span>${html(label)}</span><strong>${html(number)}</strong><small>${html(note)}</small>${pickButton('Consultar acciones',keys,`Detalle · ${label}`)}</div>`;
}
function overviewTrend(data){
 const timeline=data.timeline.slice(-100),ys=timeline.map(x=>x.diff),lo=Math.min(-1,...ys),hi=Math.max(1,...ys);
 const W=520,H=178,left=34,right=14,top=14,bottom=25;
 const xx=i=>left+(timeline.length<2?(W-left-right)/2:i*(W-left-right)/(timeline.length-1));
 const yy=v=>top+(hi-v)*(H-top-bottom)/(hi-lo);
 const pts=timeline.map((x,i)=>`${xx(i).toFixed(1)},${yy(x.diff).toFixed(1)}`).join(' ');
 const zero=yy(0).toFixed(1),last=timeline[timeline.length-1],g=last?.diff??0;
 const dots=timeline.length&&timeline.length<=24?timeline.map((x,i)=>`<circle cx="${xx(i).toFixed(1)}" cy="${yy(x.diff).toFixed(1)}" r="2.6" fill="${x.diff>=0?'#256a9c':'#c16b54'}"/>`).join(''):'';
 return `<section class="vc157-panel vc1625-plot"><div class="vc157-panelhead"><div><h3>Evolución del partido</h3><p>Diferencia acumulada de rallies ganados y perdidos, en orden registrado.</p></div><span class="vc157-tag">G-P ${signed(g)}</span></div>
 <svg class="vc1625-trendsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de diferencia acumulada de rallies, último valor ${signed(g)}"><line x1="${left}" y1="${zero}" x2="${W-right}" y2="${zero}" stroke="#b7c8d7" stroke-width="1" stroke-dasharray="4 5"/>${[-1,0,1].map(f=>{const v=Math.round(lo+(hi-lo)*(f+1)/2);return `<text x="${left-7}" y="${(yy(v)+4).toFixed(1)}" text-anchor="end" fill="#648099" font-size="11">${v}</text>`}).join('')}${timeline.length>1?`<polyline points="${pts}" fill="none" stroke="#2876af" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`:''}${dots}<text x="${left}" y="${H-6}" fill="#69839a" font-size="11">Primer rally</text><text x="${W-right}" y="${H-6}" fill="#69839a" text-anchor="end" font-size="11">Último rally</text></svg><div class="vc1625-plotfoot"><span>${timeline.length} rallies representados</span><button type="button" data-vc1625-page="explorer">Explorar jugadas</button></div></section>`;
}
function overviewRotations(data){
 const rows=data.rotations.map(r=>{
  const keys=data.actions.filter(a=>a.r&&(data.target==='ours'?a.r.rotation:a.r.opponentRotation)===r.rotation).map(a=>a.key);
  return `<tr><th scope="row"><button type="button" data-vc1625-rotation="${r.rotation}" title="Abrir análisis de R${r.rotation}">R${r.rotation}</button></th><td>${fmt(r.k1.pct)}<small>${r.k1.w}/${r.k1.n}</small></td><td>${fmt(r.k2.pct)}<small>${r.k2.w}/${r.k2.n}</small></td><td>${signed(2*r.won-r.rallies)}</td><td>${pickButton('Ver',keys,`R${r.rotation} · acciones`)}</td></tr>`;
 }).join('');
 return `<section class="vc157-panel vc1625-rotations"><div class="vc157-panelhead"><div><h3>Rendimiento por rotación</h3><p>Conversión de K1 y K2 con muestras y G-P.</p></div><button class="vc1625-more" data-vc1625-page="tactics">Ver táctica</button></div><div class="vc1625-rotwrap"><table><thead><tr><th>Rot.</th><th>K1</th><th>K2</th><th>G-P</th><th>Jugadas</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
function overviewCourt(items,keyFor,heading,description,buttonTo){
 const mapped=groupZone(items,keyFor),n=[...mapped.values()].reduce((v,x)=>v+x.length,0),max=Math.max(1,...[...mapped.values()].map(a=>a.length));
 const cells=zoneOrder.map(z=>{
  const group=mapped.get(String(z))||[],count=group.length;
  const keys=[...new Set(group.flatMap(x=>x?.set?.key?pairKeys(x):[x.key]).filter(Boolean))];
  const alpha=(0.06+0.46*count/max).toFixed(2);
  const enc=encodeURIComponent(JSON.stringify(keys));
  return `<button class="vc1625-courtcell" style="--zone-strength:${alpha}" data-pick="${enc}" data-pick-title="${html(heading)} · zona ${z}" ${!count?'disabled':''} aria-label="Zona ${z}: ${count} acciones"><span>Z${z}</span><b>${count||'—'}</b></button>`;
 }).join('');
 return `<section class="vc157-panel vc1625-courtpanel"><div class="vc157-panelhead"><div><h3>${heading}</h3><p>${description}</p></div><button class="vc1625-more" data-vc1625-page="${buttonTo}">Abrir detalle</button></div><div class="vc1625-courtframe"><div class="vc1625-courttop"><span>RED · PISTA 9 ZONAS</span><span>${n} codificadas / ${items.length} totales</span></div><div class="vc1625-courtgrid">${cells}</div></div><p class="vc157-note">Pulsa una zona para ver las acciones. Las celdas son zonas codificadas, no posiciones exactas del balón.</p></section>`;
}
function overviewPatterns(data){
 const groups=seqGroups(sequenceRows(data)).slice(0,5),total=sequenceRows(data).length;
 const list=groups.map((g,i)=>`<button type="button" class="vc1625-patternrow" ${drillAttrs(g.keys,`Patrón ${i+1} · ${g.first.setter} → ${g.first.attacker}`)}><span class="vc1625-patternindex">${String(i+1).padStart(2,'0')}</span><span class="vc1625-patternlabel"><b>${html(g.first.setter)} → ${html(g.first.attacker)}</b><small>${html(g.first.reception)} · Tempo ${html(g.first.tempo)}</small></span><span class="vc1625-patternval"><b>${g.rows.length}</b><small>${fmt(pct(g.rows.length,total))}</small></span></button>`).join('');
 return `<section class="vc157-panel vc1625-patternpanel"><div class="vc157-panelhead"><div><h3>Secuencias más frecuentes</h3><p>Recepción → colocador → atacante, solo relaciones verificables.</p></div><button class="vc1625-more" data-vc1625-page="setter" data-vc1625-subpage="sequences">Todas</button></div><div class="vc1625-patterns">${list||'<p class="vc157-muted">Todavía no hay secuencias de colocación registradas.</p>'}</div></section>`;
}
function overviewInsights(data){
 const insights=window.VC_ANALYSIS_INTELLIGENCE_1614?.insights?.(data)||[];
 return `<section class="vc157-panel vc1625-reading"><div class="vc157-panelhead"><div><h3>Lectura del partido</h3><p>Observaciones descriptivas respaldadas por la muestra registrada.</p></div></div><div class="vc1625-readinglist">${insights.slice(0,3).map(i=>`<div><b>${html(i.title)}</b><p>${html(i.detail)}</p></div>`).join('')||'<p>La muestra actual todavía no permite destacar un patrón con suficiente respaldo.</p>'}</div><div class="vc1625-quality">Registro: ${data.points.rallies} rallies cerrados · ${data.actions.length} acciones · ${data.videoCount} con vídeo</div></section>`;
}
function pageOverview(data){
 const p=data.points,rec=data.skills.R||{},atk=data.skills.A||{},serve=data.skills.S||{},block=data.skills.B||{};
 const actions=c=>data.actions.filter(a=>a.skill===c).map(a=>a.key);
 const k1=data.actions.filter(a=>a.r.serving&&a.r.serving!==data.target).map(x=>x.key);
 const k2=data.actions.filter(a=>a.r.serving===data.target).map(x=>x.key);
 const metrics=`<div class="vc1625-metrics">${overviewKpi('SIDE-OUT · K1',fmt(p.k1.pct),`${p.k1.w}/${p.k1.n} rallies`,k1)}${overviewKpi('BREAK · K2',fmt(p.k2.pct),`${p.k2.w}/${p.k2.n} rallies`,k2)}${overviewKpi('ATAQUE · EFF',fmt(atk.eff),`${atk.kills||0} − ${atk.errors||0} − ${atk.blocked||0} / ${atk.n||0}`,actions('A'))}${overviewKpi('RECEPCIÓN +/#',fmt(rec.positivePct),`${rec.positive||0}/${rec.n||0} acciones`,actions('R'))}${overviewKpi('BLOQUEOS PUNTO',String(block.kills||0),`${block.n||0} acciones`,actions('B'))}${overviewKpi('ACES DE SAQUE',String(serve.kills||0),`${serve.n||0} saques`,actions('S'))}</div>`;
 return `<div class="vc1625-overview"><div class="vc1625-scorehead"><div><span class="vc1625-label">DASHBOARD DEL PARTIDO</span><h3>${html(currentMatch()?.opponent||'Scouting seleccionado')}</h3><p>Equipo ${data.target==='ours'?'propio':'rival'} · ${data.points.rallies} rallies válidos · Datos calculados del scouting</p></div><span class="vc1625-scorebadge">${data.points.won||0} ganados / ${data.points.rallies-(data.points.won||0)} perdidos</span></div>${metrics}
 <div class="vc1625-dashgrid">${overviewTrend(data)}${overviewRotations(data)}${overviewCourt(data.attacks,x=>x.a.endZone,'Mapa de ataque','Destinos codificados · número de ataques por zona','tactics')}${overviewCourt(data.pairs,x=>x.set?.a?.setTarget,'Distribución del colocador','Destinos codificados · colocaciones registradas','setter')}${overviewPatterns(data)}${overviewInsights(data)}</div></div>`;
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
// V16.2.2: registered selection references avoid embedding large action arrays in SVG paths.
const diagramDrills=new Map();let diagramSerial=0;
function drillAttrs(keys,title){
 const id='d'+(++diagramSerial);diagramDrills.set(id,{keys:[...new Set(keys.filter(Boolean))],title});
 return `data-vc1622-drill="${id}"`;
}
const zoneOrder=[4,3,2,7,8,9,5,6,1];
const zoneIndex=z=>zoneOrder.indexOf(Number(z));
function zonePoint(z,x,y,w=255,h=240){const i=zoneIndex(z);return i<0?null:{x:x+(i%3+.5)*w/3,y:y+(Math.floor(i/3)+.5)*h/3};}
const parsedZone=v=>{const m=String(v??'').trim().toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?m[1]:null};
const attackKind=a=>a.ev==='#'?'kill':a.ev==='='||a.ev==='/'?'error':'continuation';
function mapAttackFilter(rows){return rows.filter(a=>(!state.attackPlayer||a.player===state.attackPlayer)&&(!state.attackResult||attackKind(a)===state.attackResult));}
const diagramColor=(s)=>s.n===0?'#7890a3':(s.k-s.e-s.b)>0?'#1d8576':(s.k-s.e-s.b)<0?'#c66b55':'#6283ab';
function diagramCourt(x,y,w,h,label,counts){
 const max=Math.max(1,...zoneOrder.map(z=>(counts.get(String(z))||[]).length));
 return `<text x="${x}" y="${y-16}" class="vc1622-label">${html(label)}</text>`+zoneOrder.map((z,i)=>{
  const col=i%3,row=Math.floor(i/3),xx=x+col*w/3,yy=y+row*h/3,items=counts.get(String(z))||[];
  const strength=items.length/max;
  const fill=`rgba(41,123,173,${(0.04+strength*.23).toFixed(3)})`;
  return `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${(w/3).toFixed(1)}" height="${(h/3).toFixed(1)}" rx="3" fill="${fill}" stroke="#abc5d7" stroke-width="1"/><text x="${(xx+w/6).toFixed(1)}" y="${(yy+h/6-5).toFixed(1)}" text-anchor="middle" class="vc1622-court-number">Z${z}</text><text x="${(xx+w/6).toFixed(1)}" y="${(yy+h/6+15).toFixed(1)}" text-anchor="middle" class="vc1622-court-count">${items.length}</text>`;
 }).join('');
}
function groupZone(items,field){const m=new Map();for(const row of items){const z=parsedZone(field(row));if(!z)continue;if(!m.has(z))m.set(z,[]);m.get(z).push(row)}return m;}
// V16.2.8 · A true face-to-face court: net-centered mirrored team orientations.
// Coordinates are centers of coded 3x3 subzones, not measured impact points.
const vc1628LeftGrid=[[5,7,4],[6,8,3],[1,9,2]];
const vc1628RightGrid=[[2,9,1],[3,8,6],[4,7,5]];
function vc1628Cell(side,z,x,y,w){
 const grid=side==='left'?vc1628LeftGrid:vc1628RightGrid;
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(grid[row][col]===Number(z))return {x:x+(col+.5)*w/3,y:y+(row+.5)*w/3,row,col};
 return null;
}
function vc1628PaintHalf(side,x,y,w,counts,label){
 const grid=side==='left'?vc1628LeftGrid:vc1628RightGrid;
 const max=Math.max(1,...zoneOrder.map(z=>(counts.get(String(z))||[]).length));
 let markup=`<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${side==='left'?'#eaf6f8':'#e9f3ff'}" stroke="#ffffff" stroke-width="3"/>`;
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const z=grid[row][col],items=counts.get(String(z))||[],count=items.length;
  const xx=x+col*w/3,yy=y+row*w/3,cellW=w/3;
  const strength=count/max,fill=side==='left'?`rgba(26,129,128,${(0.06+strength*.30).toFixed(3)})`:`rgba(38,109,189,${(0.06+strength*.30).toFixed(3)})`;
  const attrs=count?drillAttrs(items.map(a=>a.key),`${label} · Z${z}`):'';
  markup+=`<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellW.toFixed(1)}" fill="${fill}" stroke="#a9c9da" stroke-width=".75"/><text x="${(xx+cellW/2).toFixed(1)}" y="${(yy+cellW/2-9).toFixed(1)}" text-anchor="middle" class="vc1622-court-number">Z${z}</text><text x="${(xx+cellW/2).toFixed(1)}" y="${(yy+cellW/2+15).toFixed(1)}" text-anchor="middle" class="vc1622-court-count">${count}</text>`;
  if(count)markup+=`<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellW.toFixed(1)}" fill="transparent" class="vc1622-route-hit" ${attrs} tabindex="0" role="button" aria-label="${label} Z${z}: ${count} acciones"><title>${label} Z${z}: ${count} acciones</title></rect>`;
 }
 // The 3m attack line is 1/3 of each half-court measured from the net.
 const attackX=side==='left'?x+2*w/3:x+w/3;
 markup+=`<line x1="${attackX.toFixed(1)}" y1="${y}" x2="${attackX.toFixed(1)}" y2="${y+w}" stroke="#ffffff" stroke-width="4.5" pointer-events="none"/><line x1="${attackX.toFixed(1)}" y1="${y}" x2="${attackX.toFixed(1)}" y2="${y+w}" stroke="#39738a" stroke-width="1" opacity=".65" pointer-events="none"/><text x="${(x+w/2).toFixed(1)}" y="${(y+w+22).toFixed(1)}" text-anchor="middle" fill="#476c81" font-size="12" font-weight="800">${label}</text>`;
 return markup;
}
function vc1628CourtBackground(x,y,w){
 const netX=x+w;
 return `<rect x="${x-8}" y="${y-8}" width="${2*w+16}" height="${w+16}" fill="#d9ba8d" rx="10"/><rect x="${x}" y="${y}" width="${w*2}" height="${w}" fill="#e8f5f8" stroke="#ffffff" stroke-width="4"/><rect x="${x}" y="${y}" width="${2*w}" height="${w}" fill="none" stroke="#fcfcf8" stroke-width="4"/><line x1="${netX}" y1="${y-17}" x2="${netX}" y2="${y+w+17}" stroke="#163b58" stroke-width="6"/><line x1="${netX}" y1="${y-17}" x2="${netX}" y2="${y+w+17}" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3 4"/><text x="${netX}" y="${y-26}" text-anchor="middle" fill="#244f69" font-size="11" font-weight="900">RED</text><text x="${netX-24}" y="${y+w+37}" text-anchor="end" fill="#5e7d91" font-size="10">3 m</text><text x="${netX+24}" y="${y+w+37}" text-anchor="start" fill="#5e7d91" font-size="10">3 m</text>`;
}
function attackDiagram(data){
 const rows=mapAttackFilter(data.attacks),paths=new Map();
 for(const a of rows){const from=parsedZone(a.a.startZone),to=parsedZone(a.a.endZone);if(!from||!to)continue;const key=from+':'+to;if(!paths.has(key))paths.set(key,{from,to,items:[]});paths.get(key).items.push(a)}
 const routes=[...paths.values()].sort((a,b)=>b.items.length-a.items.length||Number(a.from)-Number(b.from)||Number(a.to)-Number(b.to));
 const observed=routes.reduce((n,r)=>n+r.items.length,0),top=routes.slice(0,12);
 const origins=groupZone(rows,a=>a.a.startZone),destinations=groupZone(rows,a=>a.a.endZone);
 const size=342,x=104,y=56,netX=x+size;
 const left=vc1628PaintHalf('left',x,y,size,origins,'Origen registrado');
 const right=vc1628PaintHalf('right',netX,y,size,destinations,'Destino registrado');
 const arrows=top.map((route,i)=>{
  const start=vc1628Cell('left',route.from,x,y,size),end=vc1628Cell('right',route.to,netX,y,size);
  if(!start||!end)return '';
  const stats=attackStats(route.items),color=diagramColor(stats),width=(2.1+Math.min(5.5,Math.sqrt(route.items.length)*.7)).toFixed(1);
  const bump=((i%5)-2)*9;
  const d=`M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${(netX-80).toFixed(1)} ${(start.y+bump).toFixed(1)}, ${(netX+80).toFixed(1)} ${(end.y+bump).toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  return `<path d="${d}" stroke="${color}" stroke-width="${width}" opacity=".76" fill="none" marker-end="url(#vc1628-arrow)" pointer-events="none"/><path d="${d}" class="vc1622-route-hit" ${drillAttrs(route.items.map(a=>a.key),`Ataque Z${route.from} → Z${route.to}`)} tabindex="0" role="button" aria-label="Ver ${route.items.length} ataques de Z${route.from} a Z${route.to}" stroke="transparent" stroke-width="19" fill="none"><title>Z${route.from} → Z${route.to} · ${route.items.length} ataques · ${stats.k} puntos · EFF ${effStat(stats)}</title></path>`;
 }).join('');
 const figure=`<div class="vc1622-diagramwrap vc1628-real-wrap"><svg class="vc1622-diagram vc1628-real-court" viewBox="0 0 900 480" role="group" aria-label="Pista de voleibol con zonas enfrentadas: Z4 frente a Z2, Z3 frente a Z3 y Z2 frente a Z4"><defs><marker id="vc1628-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#486b80"/></marker></defs>
 ${vc1628CourtBackground(x,y,size)}${left}${right}<line x1="${netX}" y1="${y-15}" x2="${netX}" y2="${y+size+15}" stroke="#163b58" stroke-width="5" pointer-events="none"/>${arrows}
 <g transform="translate(105 449)"><circle r="5" fill="#1d8576"/><text x="12" y="4" font-size="11" fill="#4c718b">EFF positiva</text><circle cx="142" r="5" fill="#6283ab"/><text x="154" y="4" font-size="11" fill="#4c718b">Neutra</text><circle cx="244" r="5" fill="#c66b55"/><text x="256" y="4" font-size="11" fill="#4c718b">Negativa</text><text x="478" y="4" font-size="11" fill="#4c718b">${observed}/${rows.length} trayectorias codificadas</text></g></svg></div>`;
 const trows=routes.slice(0,24).map(route=>{const st=attackStats(route.items);return `<tr><td>Z${route.from} → Z${route.to}</td><td>${route.items.length}</td><td>${st.k}</td><td>${st.e+st.b}</td><td>${effStat(st)}</td><td><button type="button" class="vc157-pick" ${drillAttrs(route.items.map(a=>a.key),`Ataques Z${route.from} → Z${route.to}`)}>Ver acciones</button></td></tr>`}).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Trayectorias de ataque · pista completa</h3><p>Orientación enfrentada y red real: Z4 ↔ Z2, Z3 ↔ Z3 y Z2 ↔ Z4. Líneas de 3 metros visibles.</p></div><span class="vc157-tag">${observed}/${rows.length} trayectorias completas</span></div>
 <div class="vc1622-filterline"><label>Atacante<select id="vc1622-attack-player">${selOpts([...new Set(data.attacks.map(a=>a.player))].sort((a,b)=>a.localeCompare(b,'es')).map(x=>[x,x]),state.attackPlayer,'Todos')}</select></label><label>Resultado<select id="vc1622-attack-result">${selOpts([['kill','Punto (#)'],['error','Error o bloqueado (= /)'],['continuation','Continúa la jugada']],state.attackResult,'Todos')}</select></label><span class="vc1622-legend"><i class="positive"></i>EFF positiva <i class="negative"></i>EFF negativa <i class="neutral"></i>Neutra</span></div>
 ${figure}<p class="vc157-note">Las flechas agrupan hasta 12 rutas frecuentes y pueden abrir sus jugadas. Las nueve celdas de cada mitad son subdivisiones codificadas, no zonas reglamentarias ni coordenadas exactas de impacto.</p>
 ${table(['Origen → destino','Ataques','Puntos','Errores y bloqueados','EFF','Evidencias'],trows)}${routes.length>24?`<p class="vc157-note">${routes.length-24} rutas adicionales no se muestran en la tabla para mantener el rendimiento; todas cuentan en los totales.</p>`:''}</div>`;
}
function setterDiagram(pairs){
 const mapped=pairs.filter(p=>parsedZone(p.set.a.setTarget));
 const destinations=groupZone(mapped,p=>p.set.a.setTarget),total=mapped.length;
 const routes=zoneOrder.map(z=>({z,items:destinations.get(String(z))||[]})).filter(x=>x.items.length);
 const x=310,y=54,size=315;
 const half=vc1628PaintHalf('left',x,y,size,destinations,'Destino de colocación');
 const arrows=routes.map(({z,items})=>{
  const end=vc1628Cell('left',z,x,y,size),st=attackStats(items.map(p=>p.attack));
  const col=diagramColor(st),d=`M 140 213 Q 240 ${end.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  return `<path d="${d}" stroke="${col}" stroke-width="${(2+Math.min(7,Math.sqrt(items.length))).toFixed(1)}" opacity=".7" fill="none" marker-end="url(#vc1628-set-arrow)" pointer-events="none"/><path d="${d}" stroke="transparent" stroke-width="19" fill="none" class="vc1622-route-hit" tabindex="0" role="button" aria-label="Ver colocaciones a Z${z}" ${drillAttrs(items.flatMap(pairKeys),`Colocaciones a Z${z}`)}><title>Z${z}: ${items.length}/${total} colocaciones; EFF ${effStat(st)}</title></path>`;
 }).join('');
 const fig=`<div class="vc1622-diagramwrap vc1628-real-wrap"><svg class="vc1622-diagram vc1628-setter-court" viewBox="0 0 720 440" role="group" aria-label="Distribución zonal del colocador sobre una media pista orientada hacia la red"><defs><marker id="vc1628-set-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#486b80"/></marker></defs>
 <rect x="302" y="46" width="331" height="331" fill="#d9ba8d" rx="9"/>${half}
 <line x1="${x+size}" y1="${y-12}" x2="${x+size}" y2="${y+size+12}" stroke="#173e57" stroke-width="5" pointer-events="none"/><text x="${x+size+20}" y="${y+size/2}" fill="#37657d" font-size="11" font-weight="800">RED</text>
 <rect x="32" y="178" width="124" height="70" rx="13" fill="#e4f1fc" stroke="#9cc3df"/><text x="94" y="204" class="vc1622-setnode" text-anchor="middle">COLOCADOR</text><text x="94" y="226" class="vc1622-court-count" text-anchor="middle">${pairs.length} acciones</text>${arrows}
 <text x="94" y="272" text-anchor="middle" font-size="10" fill="#607d91">Origen ilustrativo</text><text x="94" y="287" text-anchor="middle" font-size="10" fill="#607d91">no registrado</text>
 <text x="${x+size/2}" y="416" text-anchor="middle" font-size="12" fill="#466b82">Destinos codificados en media pista</text></svg></div>`;
 const cards=routes.map(({z,items})=>{const st=attackStats(items.map(p=>p.attack));return `<button type="button" class="vc1622-destcard" ${drillAttrs(items.flatMap(pairKeys),`Destino de colocación Z${z}`)}><b>Z${z}</b><strong>${items.length}</strong><span>${fmt(pct(items.length,total))} · Ataque ${st.k}/${st.n} · EFF ${effStat(st)}</span></button>`}).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Distribución del colocador · pista orientada</h3><p>La línea de ataque está a 3 metros de la red. Los destinos siguen el orden real de las zonas enfrentadas.</p></div><span class="vc157-tag">${total}/${pairs.length} destinos zonales</span></div>${fig}<div class="vc1622-destcards">${cards||'<p class="vc157-muted">Ninguna colocación tiene destino codificado con los filtros actuales.</p>'}</div><p class="vc157-note">El nodo de colocador es ilustrativo: la flecha no afirma un punto de origen real. Se muestran destinos registrados y ataques posteriores vinculados; no se infieren origen ni tempo.</p></div>`;
}
function rotationDashboard(data){
 const active=state.rotation;
 const cards=data.rotations.map(r=>{const keys=data.actions.filter(a=>a.r&&(data.target==='ours'?a.r.rotation:a.r.opponentRotation)===r.rotation).map(a=>a.key);
  const show=(label,x)=>`<div class="vc1622-rotline"><small>${label} <b>${x.w}/${x.n}</b></small><div class="vc1622-track"><i style="width:${x.pct||0}%"></i></div><strong>${fmt(x.pct)}</strong></div>`;
  return `<div class="vc1622-rotcard ${String(active)===String(r.rotation)?'is-active':''}"><div class="vc1622-rothead"><b>R${r.rotation}</b><small>${r.rallies} rallies · G-P ${signed(2*r.won-r.rallies)}</small></div>${show('K1',r.k1)}${show('K2',r.k2)}<div class="vc1622-rotactions"><button type="button" class="vc1622-rot-filter" data-vc1622-rotation="${r.rotation}" ${active===String(r.rotation)?'disabled':''}>Filtrar R${r.rotation}</button><button type="button" class="vc157-pick" ${drillAttrs(keys,`Rotación R${r.rotation}`)}>Jugadas</button></div></div>`;
 }).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Comparador visual R1–R6</h3><p>Conversión K1 y K2 con muestras separadas. Pulsa una rotación para filtrar toda la vista.</p></div><span class="vc157-tag">${data.points.rallies} rallies</span></div><div class="vc1622-rotgrid">${cards}</div>${active?'<button type="button" class="vc1622-clear-rot" data-vc1622-rotation="">Mostrar todas las rotaciones</button>':''}<p class="vc157-note">Los porcentajes sin oportunidades se muestran como «—». Una rotación con pocos rallies no permite concluir que sea mejor o peor. El filtro de rotación del encabezado también controla esta vista.</p></div>`;
}

/* V16.5.1: one tactical workbench, one canonical model, one filter context.
 * Uses real possession-bounded setter pairs; incomplete sequences are not invented. */
function labInspectFiltered(){
 const api=window.VC_TACTICAL_LAB_1651,data=paintedModel;
 if(!api||!data)return;
 const rows=api.apply(sequenceRows(data),state.labFilters);
 const keys=new Set(api.uniqueKeys(rows));
 const selected=data.actions.filter(a=>keys.has(a.key));
 state.selected=selected.slice(0,250);
 state.selectedTitle=`Mesa táctica · ${rows.length} secuencias · ${selected.length} acciones${selected.length>250?' (primeras 250)':''}`;
 renderInspector();
}
function labSelector(name,title,options,selected,all){
 return `<label>${html(title)}<select data-vc1651-filter="${html(name)}" aria-label="${html(title)}">${selOpts(options.map(v=>Array.isArray(v)?v:[v,v]),selected,all)}</select></label>`;
}
function labCourt(summary){
 const rows=summary.rows.filter(x=>x.attack);
 const attacks=rows.map(x=>x.attack);
 const origins=groupZone(attacks,a=>a.a.startZone),dest=groupZone(attacks,a=>a.a.endZone);
 const x=48,y=48,size=260,net=x+size;
 const routes=summary.routes.filter(g=>g.items.length).slice(0,10);
 const arrows=routes.map((route,i)=>{
  const r=route.items[0],from=vc1628Cell('left',parsedZone(r.attack.a.startZone),x,y,size),to=vc1628Cell('right',parsedZone(r.attack.a.endZone),net,y,size);
  if(!from||!to)return '';
  const stat=window.VC_TACTICAL_LAB_1651.rating(route.items),color=stat.eff==null?'#6283ab':stat.eff>0?'#1d8576':stat.eff<0?'#c66b55':'#6283ab';
  const bump=(i%5-2)*7,d=`M${from.x.toFixed(1)} ${from.y.toFixed(1)} C${(net-48).toFixed(1)} ${(from.y+bump).toFixed(1)} ${(net+48).toFixed(1)} ${(to.y+bump).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  return `<path d="${d}" fill="none" stroke="${color}" opacity=".8" stroke-width="${(2+Math.min(4,Math.sqrt(route.n)*.75)).toFixed(1)}" marker-end="url(#vc1651-arrow)" pointer-events="none"/><path d="${d}" fill="none" stroke="transparent" stroke-width="20" class="vc1622-route-hit" role="button" tabindex="0" ${drillAttrs(route.keys,`Ataques ${route.name}`)} aria-label="${html(route.name)} · ${route.n} ataques"><title>${html(route.name)} · ${route.n} ataques · EFF ${fmt(stat.eff)}</title></path>`;
 }).join('');
 return `<section class="vc157-panel vc1651-board"><div class="vc157-panelhead"><div><h3>Trayectorias de ataque</h3><p>Campo completo, zonas enfrentadas y solo rutas registradas.</p></div><button type="button" class="vc1651-more" data-vc1651-subpage="zones">Ampliar</button></div><div class="vc1651-courtwrap"><svg viewBox="0 0 665 372" role="group" aria-label="Pista real: origen y destino de ataque con flechas filtradas"><defs><marker id="vc1651-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#456e85"/></marker></defs>${vc1628CourtBackground(x,y,size)}${vc1628PaintHalf('left',x,y,size,origins,'Origen ataque')}${vc1628PaintHalf('right',net,y,size,dest,'Destino ataque')}${arrows}<line x1="${net}" y1="${y-16}" x2="${net}" y2="${y+size+16}" stroke="#153e58" stroke-width="4" pointer-events="none"/></svg></div><p class="vc157-note">${summary.trajectories}/${rows.length} ataques vinculados tienen origen y destino. Las flechas agrupadas son rutas entre centros de zonas, no trayectorias medidas del balón. Pulsa una flecha o zona para abrir acciones.</p></section>`;
}
function labSetterCourt(summary){
 const rows=summary.rows.filter(r=>r.pair?.set);
 const mapped=rows.filter(x=>parsedZone(x.pair.set.a.setTarget));
 const grouped=groupZone(mapped.map(x=>x.pair.set),s=>s.a.setTarget);
 const x=210,y=40,size=260,net=x+size;
 const paths=summary.destinations.slice(0,9).map(g=>{
  const r=g.items[0],z=parsedZone(r.pair.set.a.setTarget),dest=vc1628Cell('left',z,x,y,size);if(!dest)return '';
  const st=window.VC_TACTICAL_LAB_1651.rating(g.items),color=st.eff==null?'#6283ab':st.eff>0?'#1d8576':st.eff<0?'#c66b55':'#6283ab',d=`M 80 176 Q 152 ${dest.y.toFixed(1)} ${dest.x.toFixed(1)} ${dest.y.toFixed(1)}`;
  return `<path d="${d}" stroke="${color}" stroke-width="${(2+Math.min(5,Math.sqrt(g.n))).toFixed(1)}" opacity=".75" fill="none" marker-end="url(#vc1651-set-arrow)" pointer-events="none"/><path d="${d}" fill="none" stroke="transparent" stroke-width="19" role="button" tabindex="0" class="vc1622-route-hit" ${drillAttrs(g.keys,`Colocaciones a ${g.name}`)} aria-label="${g.n} colocaciones a ${g.name}"><title>${g.name}: ${g.n} colocaciones · EFF ${fmt(st.eff)}</title></path>`;
 }).join('');
 return `<section class="vc157-panel vc1651-board"><div class="vc157-panelhead"><div><h3>Distribución del colocador</h3><p>Destinos codificados y ataques posteriores vinculados.</p></div><button type="button" class="vc1651-more" data-vc1651-subpage="distribution">Ampliar</button></div><div class="vc1651-courtwrap"><svg viewBox="0 0 525 350" role="group" aria-label="Distribución de colocación sobre media pista y red"><defs><marker id="vc1651-set-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#456e85"/></marker></defs><rect x="${x-7}" y="${y-7}" width="${size+14}" height="${size+14}" fill="#d9ba8d" rx="9"/>${vc1628PaintHalf('left',x,y,size,grouped,'Destino colocación')}<line x1="${net}" y1="${y-13}" x2="${net}" y2="${y+size+13}" stroke="#193e57" stroke-width="5"/><text x="${net}" y="${y-17}" font-size="10" text-anchor="middle" fill="#426983">RED</text><rect x="12" y="142" width="112" height="65" rx="10" fill="#e5f2fc" stroke="#a9ccdf"/><text x="68" y="164" font-size="12" font-weight="800" text-anchor="middle" fill="#205477">COLOCADOR</text><text x="68" y="185" font-size="11" text-anchor="middle" fill="#205477">Esquemático</text>${paths}</svg></div><p class="vc157-note">${summary.setterTargets}/${rows.length} colocaciones tienen destino zonal. El origen de las flechas es esquemático, no una posición de toque registrada.</p></section>`;
}
function pageLabWorkbench(data){
 const api=window.VC_TACTICAL_LAB_1651;
 if(!api)return `<div class="vc157-empty">El módulo del laboratorio no se ha cargado. Actualiza la página para intentar recuperarlo.</div>`;
 const all=sequenceRows(data),filters=api.sanitize(state.labFilters);state.labFilters=filters;
 const filtered=api.apply(all,filters),s=api.summarize(filtered),names=key=>[...new Set(all.map(x=>x[key]))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
 const options=['reception','setter','attacker','tempo','outcome','destination'];
 const any=options.some(k=>filters[k]&&(k!=='reception'||filters[k]!=='all'));
 const rlab=[['positive','Positiva o perfecta'],['other','Otra recepción registrada'],['missing','Sin recepción vinculada'],['unknown','Valoración no estándar']];
 const outs=Object.entries(seqOutcomeLabel);
 const zoneOptions=[1,2,3,4,5,6,7,8,9].map(n=>[String(n),'Z'+n]);
 const filtersHtml=`<div class="vc1651-filtergrid">${labSelector('reception','Recepción previa',rlab,filters.reception==='all'?'':filters.reception,'Todas')}${labSelector('setter','Colocador',names('setter'),filters.setter,'Todos')}${labSelector('attacker','Atacante',names('attacker'),filters.attacker,'Todos')}${labSelector('tempo','Tempo',names('tempo'),filters.tempo,'Todos')}${labSelector('outcome','Resultado ataque',outs,filters.outcome,'Todos')}${labSelector('destination','Destino del ataque',zoneOptions,filters.destination,'Todas las zonas')}</div>`;
 const stats=s.stats;
 const tile=(name,value,detail,keys)=>`<div class="vc1651-kpi"><span>${html(name)}</span><strong>${html(value)}</strong><small>${html(detail)}</small>${pickButton('Ver acciones',keys,`${name} · Mesa táctica`)}</div>`;
 const metrics=`<div class="vc1651-metrics">${tile('Colocaciones filtradas',`${s.n}/${all.length}`,'Secuencias de colocación',s.keys)}${tile('Recepción → colocación → ataque',`${s.complete}/${s.n}`,'Cadenas con recepción y ataque',s.rows.filter(x=>x.rec&&x.attack).flatMap(x=>x.keys))}${tile('Ataque vinculado',`${s.linked}/${s.n}`,'Primer ataque tras la colocación',s.rows.filter(x=>x.attack).flatMap(x=>x.keys))}${tile('Ataque · EFF',fmt(stats.eff),`${stats.k} puntos, ${stats.e+stats.blocked} errores/bloqueos / ${stats.n} ataques valorados`,s.rows.filter(x=>x.attack).flatMap(x=>x.keys))}</div>`;
 const patRows=s.patterns.slice(0,15).map(g=>{const x=g.items[0],stat=api.rating(g.items);
  return `<tr><td>${html(x.reception)}</td><td>${html(x.setter)}</td><td>${html(x.attacker)}</td><td>${html(x.tempo)}</td><td>${g.n}</td><td>${fmt(pct(g.n,s.n))}</td><td>${stat.k}/${stat.n}</td><td>${fmt(stat.eff)}</td><td>${pickButton('Ver',g.keys,`Patrón ${x.setter} → ${x.attacker}`)}</td></tr>`;
 }).join('');
 const setters=s.setters.slice(0,10).map(g=>{const st=api.rating(g.items);return `<tr><td>${html(g.name)}</td><td>${g.n}</td><td>${fmt(pct(g.n,s.n))}</td><td>${st.k}/${st.n}</td><td>${fmt(st.eff)}</td><td>${pickButton('Jugadas',g.keys,`Colocador ${g.name}`)}</td></tr>`}).join('');
 const routeRows=s.routes.slice(0,8).map(g=>{const st=api.rating(g.items);return `<tr><td>${html(g.name)}</td><td>${g.n}</td><td>${st.k}/${st.n}</td><td>${fmt(st.eff)}</td><td>${pickButton('Ver',g.keys,`Ruta ${g.name}`)}</td></tr>`}).join('');
 return `<div class="vc1651-workbench"><section class="vc157-panel vc1651-filterpanel"><div class="vc157-panelhead"><div><span class="vc1651-eyebrow">TACTICAL LABORATORY PRO · V16.5.5</span><h3>Mesa táctica · filtros cruzados</h3><p>Una consulta para distribución, ataque, combinaciones y jugadas. Respeta los filtros de equipo, set, rotación y K1/K2 del encabezado.</p></div><button type="button" id="vc1651-reset" ${!any?'disabled':''}>Limpiar filtros</button></div>${filtersHtml}<div class="vc1651-footnote">${s.n} de ${all.length} secuencias verificables cumplen los filtros. Las recepciones ausentes no se tratan como negativas. No se incluyen ataques sin colocación vinculada.</div></section>${metrics}<div class="vc1651-boardgrid">${labCourt(s)}${labSetterCourt(s)}</div><div class="vc1651-tablegrid"><section class="vc157-panel"><div class="vc157-panelhead"><div><h3>Combinaciones más frecuentes</h3><p>Recepción → colocador → atacante → resultado.</p></div><button type="button" class="vc1651-more" data-vc1651-subpage="sequences">Comparar patrones</button></div>${table(['Recepción','Colocador','Atacante','Tempo','N','Uso','Puntos/T','EFF','Acciones'],patRows)}${s.patterns.length>15?`<p class="vc157-note">Se muestran 15 de ${s.patterns.length} patrones. Los totales incluyen todas las secuencias filtradas.</p>`:''}</section><section class="vc157-panel"><h3>Colocadores de la muestra</h3>${table(['Colocador','Colocaciones','Uso','Puntos/T','EFF','Acciones'],setters)}<h3 class="vc1651-secondary-title">Principales rutas de ataque</h3>${table(['Ruta','N','Puntos/T','EFF','Acciones'],routeRows)}</section></div><p class="vc157-note">EFF = (puntos − errores − bloqueados) / ataques valorados. Los porcentajes no se muestran cuando el denominador es cero. Las rutas están basadas en zonas registradas, no en posiciones continuas de balón; no se atribuye causalidad ni puntuación individual del rally.</p></div>`;
}
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
 return `${rotationDashboard(data)}<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Rotaciones · rendimiento real por complejo</h3><p>K1 y K2 por rally resuelto. Recepción y ataque se calculan sobre acciones codificadas, no sobre todos los rallies.</p></div><span class="vc157-tag">${data.points.rallies} rallies</span></div>
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
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Distribución por colocador</h3><p>Colocaciones reales y primeros ataques vinculados en la misma posesión.</p></div><span class="vc157-tag">${data.pairs.length} colocaciones</span></div>${setterFilters(data)}${setterSummary(data,pairs)}${table(['Colocador','Total','Uso','Ataques vinculados','Kill','EFF','Evidencias'],setterRows)}</div>
 ${setterDiagram(pairs)}<div class="vc157-panel"><h3>Destinos exactos registrados</h3>${table(['Destino','Uso','%','Ataques','Kill','EFF','Acciones'],destRows)}<p class="vc157-note">Los destinos de texto libre, las subzonas y «Sin registrar» permanecen en la tabla, sin ubicarlos arbitrariamente en la pista. EFF solo incluye los ataques realmente vinculados.</p></div>`;
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
// V16.2.3: read-only, auditable, possession-bounded reception -> setter -> attack chains.
// A rally result and an attack evaluation are intentionally separate fields.
const seqQuality=ev=>({'#':'Perfecta (#)','+':'Positiva (+)','!':'Intermedia (!)','-':'Negativa (-)','/':'Muy negativa (/)','=':'Error (=)'})[ev]||(ev?'Valoración no estándar':'Recepción sin valorar');
const seqRecClass=rec=>!rec?'missing':['#','+'].includes(rec.ev)?'positive':['!','-','/','='].includes(rec.ev)?'other':'unknown';
const seqRecTitle=rec=>rec?seqQuality(rec.ev):'Sin recepción vinculada';
function sequenceReception(pair,target){
 const rows=pair.r?.actions||[];
 const ix=rows.findIndex(x=>x.key===pair.set.key);
 if(ix<0)return null;
 for(let i=ix-1;i>=0;i--){
  const row=rows[i];
  // Any opponent touch, previous set, attack or serve terminates this reception context.
  if(row.team!==target||['E','A','S'].includes(row.skill))break;
  if(row.skill==='R')return row;
 }
 return null;
}
function seqAttackOutcome(attack){
 if(!attack)return 'missing';
 if(attack.ev==='#')return 'point';
 if(attack.ev==='='||attack.ev==='/')return 'error';
 if(['+','!','-'].includes(attack.ev))return 'ongoing';
 return 'unknown';
}
const seqOutcomeLabel={point:'Punto de ataque',error:'Error / bloqueado',ongoing:'Ataque no terminal',unknown:'Sin valoración estándar',missing:'Sin ataque vinculado'};
const seqStats=rows=>attackStats(rows.filter(x=>x.attack&&['#','+','!','-','/','='].includes(x.attack.ev)).map(x=>x.attack));
function sequenceRows(data){
 return data.pairs.map(pair=>{
  const rec=sequenceReception(pair,data.target),attack=pair.attack||null;
  const receiver=rec?.player||'Sin receptor vinculado';
  const setter=pair.set.player||'Sin identificar';
  const attacker=attack?.player||'Sin ataque vinculado';
  const tempo=setterText(pair.set.a.setTempo),combo=setterText(pair.set.a.attackCombo||attack?.a.attackCombo);
  const reception=seqRecTitle(rec),recClass=seqRecClass(rec),outcome=seqAttackOutcome(attack);
  const keys=[rec?.key,pair.set.key,attack?.key].filter(Boolean);
  const signature=JSON.stringify([reception,setter,attacker,tempo,combo]);
  return {pair,rec,attack,receiver,setter,attacker,tempo,combo,reception,recClass,outcome,keys,signature,won:pair.r.winning===data.target,phase:pair.r.serving===data.target?'K2':pair.r.serving?'K1':'Sin saque registrado'};
 });
}
function seqFiltered(data){
 return sequenceRows(data).filter(x=>
  (!state.setterPlayer||x.setter===state.setterPlayer)&&
  (!state.setterTempo||x.tempo===state.setterTempo)&&
  (!state.seqReception||x.recClass===state.seqReception)&&
  (!state.seqReceiver||x.receiver===state.seqReceiver)&&
  (!state.seqAttacker||x.attacker===state.seqAttacker)&&
  (!state.seqOutcome||x.outcome===state.seqOutcome)
 );
}
function seqGroups(items){
 const out=new Map();
 for(const x of items){let v=out.get(x.signature);if(!v)out.set(x.signature,v=[]);v.push(x)}
 return [...out].map(([key,rows])=>({key,rows,first:rows[0],stat:seqStats(rows),keys:[...new Set(rows.flatMap(x=>x.keys))]}))
  .sort((a,b)=>b.rows.length-a.rows.length||a.key.localeCompare(b.key,'es'));
}
function seqFilterBar(data){
 const all=sequenceRows(data);
 const receivers=[...new Set(all.map(x=>x.receiver))].sort((a,b)=>a.localeCompare(b,'es'));
 const attackers=[...new Set(all.map(x=>x.attacker))].sort((a,b)=>a.localeCompare(b,'es'));
 return `<div class="vc1623-filterbar">
 <label>Colocador<select id="vc1621-setter-player">${selOpts([...new Set(all.map(x=>x.setter))].sort((a,b)=>a.localeCompare(b,'es')).map(v=>[v,v]),state.setterPlayer,'Todos')}</select></label>
 <label>Tempo registrado<select id="vc1621-setter-tempo">${selOpts([...new Set(all.map(x=>x.tempo))].sort((a,b)=>a.localeCompare(b,'es')).map(v=>[v,v]),state.setterTempo,'Todos')}</select></label>
 <label>Calidad de recepción<select id="vc1623-rec">${selOpts([['positive','Perfecta / positiva'],['other','Otra calidad registrada'],['missing','Sin recepción vinculada'],['unknown','Recepción sin valoración estándar']],state.seqReception,'Todas')}</select></label>
 <label>Receptor<select id="vc1623-receiver">${selOpts(receivers.map(v=>[v,v]),state.seqReceiver,'Todos')}</select></label>
 <label>Atacante<select id="vc1623-attacker">${selOpts(attackers.map(v=>[v,v]),state.seqAttacker,'Todos')}</select></label>
 <label>Resultado del ataque<select id="vc1623-outcome">${selOpts(Object.entries(seqOutcomeLabel).map(([k,v])=>[k,v]),state.seqOutcome,'Todos')}</select></label>
 </div>`;
}
function seqMetrics(rows,all){
 const stats=seqStats(rows),withRec=rows.filter(x=>x.rec),withAttack=rows.filter(x=>x.attack),full=rows.filter(x=>x.rec&&x.attack);
 const vals=[['Secuencias',rows.length,`De ${all.length} colocaciones del scouting filtrado`],
  ['Cadena R→E→A',`${full.length}/${rows.length}`,fmt(pct(full.length,rows.length))],
  ['Ataque vinculado',`${withAttack.length}/${rows.length}`,fmt(pct(withAttack.length,rows.length))],
  ['Ataque punto',`${stats.k}/${stats.n}`,fmt(pct(stats.k,stats.n))],
  ['EFF de ataque',effStat(stats),`${stats.n} ataques valorados como acciones`]];
 return `<div class="vc1623-metrics">${vals.map(([label,value,detail])=>`<div><span>${html(label)}</span><strong>${html(value)}</strong><small>${html(detail)}</small></div>`).join('')}</div>
 <p class="vc157-note">${withRec.length}/${rows.length} secuencias tienen recepción vinculada. Una secuencia empieza en una colocación del equipo y enlaza su primer ataque posterior solo cuando no interviene el rival ni otra colocación. El resultado del rally se muestra por separado del ataque. EFF = (puntos − errores − bloqueados) / ataques con valoración reconocida; los ataques sin valoración se muestran como vinculados, pero no entran en EFF.</p>`;
}
function seqFlow(groups,allCount){
 if(!groups.length)return '<p class="vc157-muted">No hay secuencias con los filtros seleccionados.</p>';
 return `<div class="vc1623-flow" role="list" aria-label="Combinaciones más frecuentes">${groups.slice(0,8).map((g,i)=>{
  const f=g.first,st=g.stat,n=g.rows.length;
  const lab=`${f.reception} → ${f.setter} → ${f.attacker}`;
  return `<button type="button" role="listitem" class="vc1623-flowrow" ${drillAttrs(g.keys,`Secuencia ${lab}`)} title="Abrir acciones de esta combinación">
  <span class="vc1623-flowtop"><b>${i+1}. ${n} secuencia${n===1?'':'s'}</b><small>${fmt(pct(n,allCount))} de la muestra · Tempo ${html(f.tempo)} · ${html(f.combo==='Sin registrar'?'Combinación sin registrar':'Combo '+f.combo)}</small></span>
  <span class="vc1623-flowpath"><span>${html(f.reception)}</span><i>→</i><span>${html(f.setter)}</span><i>→</i><span>${html(f.attacker)}</span><i>→</i><span>${st.k}/${st.n} punto · EFF ${effStat(st)}</span></span>
  <span class="vc1623-progress"><i style="width:${Math.max(0,Math.min(100,pct(n,allCount)||0))}%"></i></span>
  </button>`;
 }).join('')}</div>${groups.length>8?`<p class="vc157-note">Se visualizan las 8 combinaciones más frecuentes; la tabla contiene hasta 30 y el total de secuencias incluye todas.</p>`:''}`;
}
function seqComparison(groups){
 if(!groups.length)return '';
 const a=groups.find(g=>g.key===state.seqCompareA)||groups[0];
 const b=groups.find(g=>g.key===state.seqCompareB&&g.key!==a.key)||groups.find(g=>g.key!==a.key)||null;
 const card=(g,letter)=>{
  if(!g)return `<div class="vc1623-compcard"><h4>Patrón ${letter}</h4><p>Selecciona otro patrón en la tabla para comparar.</p></div>`;
  const f=g.first,s=g.stat,w=g.rows.filter(x=>x.won).length;
  return `<div class="vc1623-compcard"><span class="vc1623-comptag">PATRÓN ${letter}</span><h4>${html(f.setter)} → ${html(f.attacker)}</h4><p>${html(f.reception)} · Tempo ${html(f.tempo)} · Combo ${html(f.combo)}</p>
   <div class="vc1623-compnums"><div><strong>${g.rows.length}</strong><span>Secuencias</span></div><div><strong>${s.k}/${s.n}</strong><span>Ataques punto</span></div><div><strong>${effStat(s)}</strong><span>EFF ataque</span></div><div><strong>${w}/${g.rows.length}</strong><span>Secuencias en rally ganado</span></div></div>
   <button type="button" class="vc157-pick" ${drillAttrs(g.keys,`Patrón ${letter}: ${f.setter} → ${f.attacker}`)}>Inspeccionar acciones</button>${g.rows.length<5?'<p class="vc1623-smalln">Muestra pequeña: menos de 5 secuencias.</p>':''}
   </div>`;
 };
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Comparación A / B de combinaciones</h3><p>Elige A y B en la tabla. Cada cifra se calcula sobre las secuencias del patrón, no sobre partidos distintos.</p></div></div><div class="vc1623-compare">${card(a,'A')}${card(b,'B')}</div><p class="vc157-note">«Secuencias en rally ganado» es una asociación descriptiva: si un rally contiene varias colocaciones, puede contribuir a varias secuencias. No equivale a puntos atribuibles al colocador ni a side-out.</p></div>`;
}
function seqTable(groups,n){
 const a=groups.find(g=>g.key===state.seqCompareA)||groups[0];
 const b=groups.find(g=>g.key===state.seqCompareB&&g.key!==a?.key)||groups.find(g=>g.key!==a?.key);
 const rows=groups.slice(0,30).map(g=>{
  const f=g.first,st=g.stat,encoded=encodeURIComponent(g.key);
  const button=(side,active)=>`<button type="button" class="vc1623-pickcompare${active?' is-active':''}" aria-pressed="${active}" data-vc1623-compare="${side}" data-vc1623-key="${encoded}">${side}</button>`;
  return `<tr><td>${html(f.reception)}</td><td>${html(f.setter)}</td><td>${html(f.tempo)}</td><td>${html(f.attacker)}</td><td>${html(f.combo)}</td><td>${g.rows.length}</td><td>${fmt(pct(g.rows.length,n))}</td><td>${st.k}/${st.n}</td><td>${effStat(st)}</td><td><span class="vc1623-abbuttons">${button('A',a?.key===g.key)}${button('B',b?.key===g.key)}</span> <button class="vc157-pick" type="button" ${drillAttrs(g.keys,`Combinación de ${f.setter} hacia ${f.attacker}`)}>Ver</button></td></tr>`;
 }).join('');
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Tabla de combinaciones reales</h3><p>Recepción → colocador → tempo → atacante; «Combo» muestra el código original si existe.</p></div><span class="vc157-tag">${groups.length} patrones · ${n} secuencias</span></div>${table(['Recepción','Colocador','Tempo','Atacante','Combo','N','Uso','Kill/T','EFF','Comparar / Ver'],rows)}${groups.length>30?`<p class="vc157-note">Se muestran 30 patrones de ${groups.length}; se incluyen todos en los cálculos.</p>`:''}</div>`;
}
function seqQualityComparison(rows){
 const specs=[['positive','Perfecta / positiva (#,+)'],['other','Otra recepción registrada'],['missing','Sin recepción vinculada'],['unknown','Recepción sin valoración estándar']];
 const t=specs.map(([cls,label])=>{
  const list=rows.filter(x=>x.recClass===cls),s=seqStats(list);
  return `<tr><td>${html(label)}</td><td>${list.length}</td><td>${list.filter(x=>x.attack).length}/${list.length}</td><td>${s.k}/${s.n}</td><td>${effStat(s)}</td><td>${pickButton('Ver',list.flatMap(x=>x.keys),`Secuencias · ${label}`)}</td></tr>`;
 }).join('');
 const combos=new Map();for(const x of rows){const k=x.setter+' → '+x.attacker;let list=combos.get(k);if(!list)combos.set(k,list=[]);list.push(x)}
 const m=[...combos].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es')).slice(0,16).map(([label,list])=>{
  const stats=seqStats(list);return `<tr><td>${html(label)}</td><td>${list.length}</td><td>${stats.k}/${stats.n}</td><td>${effStat(stats)}</td><td>${pickButton('Ver',list.flatMap(x=>x.keys),label)}</td></tr>`;
 }).join('');
 return `<div class="vc157-grid2"><div class="vc157-panel"><h3>Comparar según calidad de recepción</h3>${table(['Contexto','Secuencias','Ataques enlazados','Puntos','EFF','Acciones'],t)}<p class="vc157-note">La comparación de recepción incluye únicamente acciones vinculadas a la misma posesión; «sin recepción» no se interpreta como una recepción mala.</p></div>
 <div class="vc157-panel"><h3>Relación colocador → atacante</h3>${table(['Pareja','Secuencias','Kill/T','EFF','Acciones'],m)}</div></div>`;
}
function pageSequences(data){
 const all=sequenceRows(data),rows=seqFiltered(data),groups=seqGroups(rows);
 return `<div class="vc157-panel"><div class="vc157-panelhead"><div><h3>Secuencias de juego · recepción → colocación → ataque</h3><p>Relaciones verificables dentro de la misma posesión, con los resultados y el vídeo original disponibles desde el inspector.</p></div><span class="vc157-tag">${rows.length}/${all.length} secuencias</span></div>
 ${seqFilterBar(data)}${seqMetrics(rows,all)}<div class="vc1623-toolrow"><p>Selecciona una ruta para abrir sus acciones. Las flechas indican una secuencia de eventos, no una trayectoria física del balón.</p><button type="button" class="vc157-pick" id="vc1623-export">Exportar secuencias CSV</button></div>${seqFlow(groups,rows.length)}</div>
 ${seqComparison(groups)}${seqTable(groups,rows.length)}${seqQualityComparison(rows)}`;
}
function exportSequenceCsv(){
 const d=dataset(),m=currentMatch();if(!d||!m)return;
 const rows=seqFiltered(d);
 const header=['Set','Rally','Complejo','Rotación','Receptor','Recepción','Colocador','Tempo','Destino colocación','Atacante','Combinación','Valoración ataque','Rally ganado','Código recepción','Código colocación','Código ataque'];
 const clean=x=>`"${String(x??'').replace(/"/g,'""')}"`;
 const body='\ufeff'+[header,...rows.map(x=>[x.pair.r.set,x.pair.r.index,x.phase,x.pair.set.rotation,x.receiver,x.reception,x.setter,x.tempo,x.pair.set.a.setTarget||'',x.attacker,x.combo,x.attack?.ev||'',x.won?'Sí':'No',x.rec?.code||'',x.pair.set.code||'',x.attack?.code||''])].map(r=>r.map(clean).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`volley-coach-secuencias-${m.id}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function pageZones(data){
 const attack=mapAttackFilter(data.attacks);
 const blMap=new Map();for(const r of attack){const k=r.a.blockers==null||r.a.blockers===''?'Sin registrar':String(r.a.blockers);if(!blMap.has(k))blMap.set(k,[]);blMap.get(k).push(r)}
 const blockers=[...blMap].map(([k,rows])=>{const kill=rows.filter(a=>a.ev==='#').length,neg=rows.filter(a=>a.ev==='='||a.ev==='/').length;return `<tr><td>${html(k)}</td><td>${rows.length}</td><td>${fmt(pct(kill,rows.length))}</td><td>${fmt(pct(kill-neg,rows.length))}</td><td>${pickButton('Ver',rows.map(a=>a.key),`Bloqueadores ${k}`)}</td></tr>`}).join('');
 const zones=groupZone(attack,a=>a.a.endZone),zN=[...zones.values()].reduce((n,x)=>n+x.length,0);
 const zoneRows=zoneOrder.map(z=>{const items=zones.get(String(z))||[],st=attackStats(items);return `<tr><td>Z${z}</td><td>${items.length}</td><td>${fmt(pct(items.length,zN))}</td><td>${st.k}</td><td>${st.e+st.b}</td><td>${effStat(st)}</td><td>${pickButton('Ver',items.map(a=>a.key),`Ataques al destino Z${z}`)}</td></tr>`}).join('');
 return `${attackDiagram(data)}<div class="vc157-grid2"><div class="vc157-panel"><h3>Rendimiento por zona de destino</h3><p>${zN}/${attack.length} ataques tienen destino zonal registrado.</p>${table(['Zona','Ataques','Uso','Puntos','Errores','EFF','Evidencias'],zoneRows)}</div><div class="vc157-panel"><h3>Ataque según bloqueo rival</h3>${table(['Bloqueadores','Ataques','Kill %','EFF','Jugadas'],blockers)}<p class="vc157-note">Solo se muestran características de bloqueo codificadas. «Sin registrar» no equivale a bloqueo de cero jugadores.</p></div></div>`;
}
/* V16.5.6: cross-match summary uses the unfiltered canonical intelligence
   engine for each scouting; it does not switch the active match or write data.
   The comparison has its own bounds, independently of the current set/phase. */
function comparisonEntries(){
 const core=window.VC_COMPARISONS_1656, engine=window.VC_ANALYSIS_INTELLIGENCE_1614;
 if(!core?.entry||!engine?.model)return [];
 const out=[];
 for(const match of matches().slice(0,24)){
  try{
   const own=engine.model(match,scoutedTeam(),{team:'ours'});
   const opponent=engine.model(match,scoutedTeam(),{team:'opponent'});
   out.push(core.entry(match,own,opponent));
  }catch(error){console.warn('Comparativas Pro: scouting omitido',match?.id,error)}
 }
 return out;
}
function exportComparison(){
 const core=window.VC_COMPARISONS_1656;if(!core?.exportRows)return;
 const source=comparisonEntries(),kind=state.subpage.comparisons||'matches';
 const blob=new Blob([core.exportRows(source,kind)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`volley-coach-comparativas-${kind}-v1656.csv`;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
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
function pageCustomWorksheet(data){
 const api=window.VC_CUSTOM_WORKSHEETS_1650;
 if(!api?.render)return '<div class="vc157-panel"><h3>Hojas configurables</h3><p>El módulo de hojas no se ha cargado. Comprueba el archivo 135-vc1650-custom-worksheets.js.</p></div>';
 state.worksheet=api.sanitize(state.worksheet);
 return api.render(data,state.worksheet,{pickButton,savedName:state.worksheetSavedName});
}
function saveWorksheetExport(){
 const api=window.VC_CUSTOM_WORKSHEETS_1650,data=paintedModel||dataset(),match=currentMatch();
 if(!api?.csv||!data||!match)return;
 const contents=api.csv(data,state.worksheet),blob=new Blob([contents],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=`volley-coach-hoja-personalizada-${String(match.id).replace(/[^a-zA-Z0-9_-]/g,'_')}.csv`;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
let vc1661ReportPreviewTimer=null,vc1661PreviewRenders=0;
function vc1661PreviewSchedule(){
 if(vc1661ReportPreviewTimer!==null)clearTimeout(vc1661ReportPreviewTimer);
 vc1661ReportPreviewTimer=setTimeout(()=>{
  vc1661ReportPreviewTimer=null;
  if(state.page!=='reports'||!view?.classList.contains('active'))return;
  const preview=$('vc1657-preview-body'),api=window.VC_REPORTS_1657;
  if(!api||!preview)return;
  preview.innerHTML=api.reportBody(api.make(reportEntries,state.report));
  vc1661PreviewRenders++;
 },180);
}
function vc1661PreviewCancel(){
 if(vc1661ReportPreviewTimer!==null){clearTimeout(vc1661ReportPreviewTimer);vc1661ReportPreviewTimer=null;}
}
function renderPage(){
 vc1661PreviewCancel();
 if(!state.loaded||state.technical)return;
 const surface=$('vc157-content');if(!surface)return;
 const started=perfNow();vc1632Metrics.renderCalls++;
 paintedModel=null;
 diagramDrills.clear();diagramSerial=0;
 const studio=$('vc157-studio');if(studio){studio.dataset.vc1656Comparisons=String(state.page==='comparisons');studio.dataset.vc1657Reports=String(state.page==='reports');}if(studio){studio.dataset.vc1620Setter=String((state.page==='setter'&&state.subpage.setter==='details')||(state.page==='lab'&&state.subpage.lab==='details'));studio.dataset.vc1620Season=String(state.page==='season');}
 const heading=$('vc157-section-title');if(heading)heading.textContent=pages[state.page]?.[0]||'Resumen';
 const meta=$('vc157-sample');
 document.querySelectorAll('#vc157-tabs [data-section]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.section===state.page)));
 const sub=$('vc1620-subtabs');
 if(sub){
  const options=subpages[state.page]||[];
  sub.hidden=options.length===0;
  sub.innerHTML=options.map(([key,label])=>`<button type="button" data-subpage="${key}" aria-pressed="${state.subpage[state.page]===key}">${html(label)}</button>`).join('');
 }
 if(state.page==='reports'){
  const api=window.VC_REPORTS_1657;reportEntries=comparisonEntries();
  if(meta)meta.textContent=`${reportEntries.length} scoutings accesibles · Informes históricos solo lectura`;
  surface.innerHTML=api?.render?api.render(reportEntries,state.report):'<div class="vc157-panel">No se ha cargado el módulo 140 de Informes Pro.</div>';
  state.draws++;measurePaint(started);return;
 }
 if(state.page==='comparisons'){
  const core=window.VC_COMPARISONS_1656,entries=comparisonEntries();
  if(meta)meta.textContent=`${entries.length} scoutings comparables · Histórico sin filtro de set`;
  surface.innerHTML=core?.render?core.render(entries,state.subpage.comparisons,state.compareSelection):'<div class="vc157-panel">No se ha cargado el módulo de comparativas.</div>';
  state.draws++;measurePaint(started);return;
 }
 if(state.page==='season'){
  if(meta)meta.textContent=`${matches().length} scoutings disponibles · Comparativa de partidos`;
  surface.innerHTML=pageSeason();state.draws++;measurePaint(started);return;
 }
 const data=dataset();
 if(!data){surface.innerHTML='<div class="vc157-empty">Selecciona un scouting para empezar el análisis.</div>';if(meta)meta.textContent='Sin scouting disponible';measurePaint(started);return;}
 paintedModel=data;
 if(meta)meta.textContent=periodLabel(data);
 const page=state.page,subpage=state.subpage[page];
 if(inDeepView()){
  pageDeep(data,surface);
 }else if(page==='overview')surface.innerHTML=pageOverview(data);
 else if(page==='players')surface.innerHTML=subpage==='builder'?pageCustomWorksheet(data):pagePlayers(data);
 else if(page==='athletes')surface.innerHTML=subpage==='compare'?pagePlayerCompare(data):pagePlayerProfile(data);
 else if(page==='lab')surface.innerHTML=subpage==='workbench'?pageLabWorkbench(data):subpage==='zones'?pageZones(data):subpage==='distribution'?pageDistribution(data):subpage==='details'?pageSetterDetails(data):subpage==='sequences'?pageSequences(data):pageRotations(data);
 else if(page==='tactics')surface.innerHTML=subpage==='zones'?pageZones(data):pageRotations(data);
 else if(page==='setter')surface.innerHTML=subpage==='sequences'?pageSequences(data):subpage==='details'?pageSetterDetails(data):pageDistribution(data);
 else if(page==='explorer')surface.innerHTML=pageExplorer(data);
 if(page==='lab'&&subpage==='workbench')labInspectFiltered();
 const note=$('vc1650-message');if(note&&state.worksheetNotice)note.textContent=state.worksheetNotice;
 state.draws++;measurePaint(started);
}
function measurePaint(started){const elapsed=perfNow()-started;vc1632Metrics.renderMs+=elapsed;vc1632Metrics.renderMaxMs=Math.max(vc1632Metrics.renderMaxMs,elapsed)}
function selectKeys(keys,title){
 // A drill-down must show the exact actions behind the rendered statistic.
 // Reusing the painted model also avoids parsing the whole match again.
 const data=paintedModel||dataset();if(paintedModel)vc1632Metrics.drillReuses++;else vc1632Metrics.drillMisses++;
 if(!data)return;
 const keyset=new Set(keys),selection=data.actions.filter(x=>keyset.has(x.key));
 state.selected=selection;state.selectedTitle=title||'Jugadas seleccionadas';renderInspector();
}
function renderInspector(){
 const out=$('vc157-inspector-content');if(!out)return;
 const rows=state.selected,video=rows.filter(r=>r.video),title=$('vc157-inspector-title');if(title)title.textContent=state.selectedTitle;
 out.innerHTML=rows.length?`<p><b>${rows.length}</b> acciones · <b>${video.length}</b> con referencia temporal</p><div class="vc157-inspector-list">${rows.slice(0,60).map(r=>`<div class="vc157-inspector-item"><div><b>${html(r.code||r.skill+r.ev)}</b><small>Set ${r.set} · Rally ${r.r.index} · ${html(r.player)} · ${html(r.ev)}</small></div>${r.video?`<button type="button" class="vc1622-clip" data-vc1622-clip="${encodeURIComponent(r.key)}" aria-label="Abrir vídeo de la acción ${html(r.code||r.skill+r.ev)}">▶ Vídeo</button>`:'<span>Sin marca</span>'}</div>`).join('')}</div>${rows.length>60?'<p>Se muestran las primeras 60 acciones. La selección para vídeo incluye todas las que tienen referencia temporal.</p>':''}`:'<p>Selecciona una cifra, rotación, flecha, zona o jugada para inspeccionar las acciones que la componen.</p>';
 const btn=$('vc157-video');if(btn)btn.disabled=!video.length;
}
function openVideoKeys(keys){
 const m=currentMatch();if(!m||!keys.length)return;
 const api=window.VC_VIDEO_ANALYTICS_1612;
 if(!api?.openKeys){const note=$('vc157-inspector-note');if(note)note.textContent='Video Analytics no está disponible en esta versión.';return;}
 try{const ok=api.openKeys(m.id,keys);if(!ok){const note=$('vc157-inspector-note');if(note)note.textContent='No se ha podido abrir la selección de vídeo. Comprueba el partido y la fuente de vídeo.';}}
 catch(e){console.warn('Analyst Studio video',e);const note=$('vc157-inspector-note');if(note)note.textContent='Error al abrir el vídeo.';}
}
function openVideo(){openVideoKeys(state.selected.filter(a=>a.video).map(x=>x.key))}
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
 paintedModel=null;buildHeader();renderPage();
}
function onTeamChanged(){
 paintedModel=null;
 state.match=String(matches()[0]?.id||'');
 state.set='';state.rotation='';state.phase='';state.player='';state.skill='';state.rating='';
 state.profilePlayer='';state.comparePlayerA='';state.comparePlayerB='';
 state.setterPlayer='';state.setterReception='';state.setterTempo='';
 state.attackPlayer='';state.attackResult='';state.seqReception='';state.seqReceiver='';
 state.seqAttacker='';state.seqOutcome='';state.seqCompareA='';state.seqCompareB='';
 state.labFilters={reception:'all',setter:'',attacker:'',tempo:'',outcome:'',destination:''};
 state.selected=[];state.selectedTitle='Selecciona una cifra de la tabla';
 state.report={...state.report,matchId:'',compareId:'',playerKey:'',rivalKey:''};
 if(state.loaded){renderInspector();refresh()}
}
function mount(){
 view=$('scout-analysis');native=$('scout-analysis-match');if(!view||!native||!window.VC_ANALYSIS_INTELLIGENCE_1614?.model)return false;
 if($('vc157-studio')){state.loaded=true;return true;}
 const style=document.createElement('style');style.id='vc157-style';style.textContent=CSS;document.head.appendChild(style);
 const reports=window.VC_REPORTS_1657;
 if(reports?.css&&!$('vc1657-style')){const st=document.createElement('style');st.id='vc1657-style';st.textContent=reports.css;document.head.appendChild(st);}
 state.report=reportPreferences();
 const comparative=window.VC_COMPARISONS_1656;
 if(comparative?.css&&!$('vc1656-style')){const style=document.createElement('style');style.id='vc1656-style';style.textContent=comparative.css;document.head.appendChild(style);}
 host=document.createElement('div');host.id='vc157-studio';host.className='vc157-studio';host.innerHTML=`<div class="vc157-appshell"><div class="vc157-top"><div class="vc157-brand"><span class="vc157-eyebrow">VOLLEY COACH / ANALYSIS PRO 3.0 · V16.5.7</span><h2>Centro de análisis profesional</h2><p id="vc157-match-label">Datos conectados a Scouting Pro y al vídeo</p><div class="vc157-headmeta"><span class="vc157-metapill">Vista unificada</span><span class="vc157-metapill">Solo lectura</span><span class="vc157-metapill">Trazabilidad de jugadas</span></div></div><div class="vc157-actions"><button id="vc157-official" class="vc157-pdf" title="Exportación oficial sin cambios">PDF oficial</button><button id="vc157-propdf">PDF análisis</button></div></div>
 <div class="vc157-toolbar"><div class="vc157-filterbar"><label class="vc157-match-field">Scouting <span id="vc157-match-count" class="vc157-match-count"></span><select id="vc157-match" aria-label="Seleccionar scouting del análisis"></select></label><button type="button" id="vc157-refresh-matches" title="Actualizar lista de scoutings">↻ Actualizar</button><label>Equipo<select id="vc157-team"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label>Set<select id="vc157-set"></select></label><label>Rotación<select id="vc157-rotation">${selOpts([1,2,3,4,5,6].map(n=>[n,'R'+n]),'','Todas')}</select></label><label>Complejo<select id="vc157-phase"><option value="">K1 + K2</option><option value="K1">K1 · Side-out</option><option value="K2">K2 · Break</option></select></label></div></div>
 <div class="vc157-work"><nav id="vc157-tabs" class="vc157-tabs" aria-label="Espacios de análisis">${mainPages.map(k=>`<button type="button" data-section="${k}" aria-selected="false"><b>${pages[k][0]}</b><span>${pages[k][1]}</span></button>`).join('')}</nav>
 <div class="vc157-stagehead"><div><span class="vc157-eyebrow">ESTUDIO TÁCTICO · SOLO LECTURA</span><h3 id="vc157-section-title">Resumen</h3><p id="vc157-sample"></p></div><div class="vc157-export"><button id="vc157-csv-official">CSV Hoja Oficial</button><button id="vc157-csv">CSV avanzado</button><button id="vc157-json">JSON</button></div></div>
 <div id="vc1620-subtabs" class="vc1620-subtabs" hidden></div><div class="vc157-columns"><main id="vc157-content" class="vc157-content"></main><aside class="vc157-inspector"><div class="vc157-inspector-head"><span>INSPECTOR DE JUGADAS</span><h3 id="vc157-inspector-title">Selecciona una cifra de la tabla</h3></div><div id="vc157-inspector-content"><p>Selecciona una cifra para explorar las acciones que la componen.</p></div><button id="vc157-video" disabled>▶ Abrir jugadas en vídeo</button><p id="vc157-inspector-note">Se utiliza Video Analytics y el reproductor original.</p></aside></div></div>
 <p class="vc157-footer">Analysis Pro 3.0 · Mesa táctica con filtros cruzados, pistas, secuencias e inspector vinculados. Se conservan las hojas configurables. Los cálculos, la Hoja Oficial, los PDF y la sincronización originales permanecen intactos.</p></div>`;
 view.appendChild(host);
 $('vc157-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(!b||!pages[b.dataset.section])return;state.page=b.dataset.section;if(state.page==='comparisons'){state.selected=[];state.selectedTitle='Selecciona un scouting del historial';renderInspector();}renderPage()});
 $('vc1620-subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-subpage]');if(!b)return;const allowed=(subpages[state.page]||[]).some(([k])=>k===b.dataset.subpage);if(!allowed)return;state.subpage[state.page]=b.dataset.subpage;renderPage()});
 host.addEventListener('input',e=>{
  const t=e.target;if(!['vc1657-title','vc1657-notes'].includes(t.id))return;
  const key=t.id==='vc1657-title'?'title':'notes';state.report={...state.report,[key]:t.value};
  vc1661PreviewSchedule();
 });
 host.addEventListener('change',e=>{
  const t=e.target,id=t.id;
  if(id==='vc1657-title'||id==='vc1657-notes')return;
  if(id==='vc1657-kind'){
   state.report={...state.report,kind:t.value,matchId:'',compareId:'',playerKey:'',rivalKey:''};saveReportPreferences();renderPage();return;
  }
  if(id==='vc1657-subject'){
   const field=state.report.kind==='match'?'matchId':state.report.kind==='player'?'playerKey':'rivalKey';
   state.report={...state.report,[field]:t.value,compareId:field==='matchId'?'':state.report.compareId};renderPage();return;
  }
  if(id==='vc1657-compare'){state.report={...state.report,compareId:t.value};renderPage();return;}
  if(t.matches?.('[data-vc1657-section]')){
   const key=t.dataset.vc1657Section;
   state.report={...state.report,sections:{...state.report.sections,[key]:t.checked}};
   saveReportPreferences();renderPage();return;
  }

  // Editing the view name must not refresh the page on blur: doing so would
  // detach the Save button just as the user clicks it.
  if(t.matches?.('[data-vc1651-filter]')){
   const api=window.VC_TACTICAL_LAB_1651;
   if(!api)return;
   const name=t.dataset.vc1651Filter;
   if(!Object.prototype.hasOwnProperty.call(state.labFilters,name))return;
   state.labFilters=api.sanitize({...state.labFilters,[name]:t.value});
   state.selected=[];state.selectedTitle='Acciones del contexto filtrado';renderInspector();
   renderPage();labInspectFiltered();return;
  }
  if(['vc1656-match-a','vc1656-match-b','vc1656-player-a','vc1656-player-b'].includes(id)){
   const key=id.replace('vc1656-','').replace(/-([ab])$/,(_,side)=>side.toUpperCase());
   if(Object.prototype.hasOwnProperty.call(state.compareSelection,key)){
    state.compareSelection[key]=t.value;
    if(key==='matchA'&&state.compareSelection.matchB===t.value)state.compareSelection.matchB='';
    if(key==='playerA'&&state.compareSelection.playerB===t.value)state.compareSelection.playerB='';
    renderPage();
   }
   return;
  }
  if(id==='vc1650-name')return;
  if(id.startsWith('vc1650-')){
   const api=window.VC_CUSTOM_WORKSHEETS_1650;if(!api)return;
   if(id==='vc1650-views'){
    const choice=api.views().find(x=>x.name===t.value);
    state.worksheetSavedName=choice?.name||'';
    if(choice)state.worksheet=api.sanitize(choice.config);
    state.worksheetNotice='';renderPage();return;
   }
   if(['vc1650-skill','vc1650-group','vc1650-reception','vc1650-sort'].includes(id)){
    state.worksheet={...state.worksheet,[id.slice(7)]:t.value};
    state.worksheet=api.sanitize(state.worksheet);
    state.worksheetSavedName='';state.worksheetNotice='';state.selected=[];renderInspector();renderPage();return;
   }
  }
  if(t.matches?.('[data-vc1650-col]')){
   const col=t.dataset.vc1650Col;
   const cols=new Set(state.worksheet.columns);
   if(t.checked)cols.add(col);else cols.delete(col);
   state.worksheet=window.VC_CUSTOM_WORKSHEETS_1650.sanitize({...state.worksheet,columns:[...cols]});
   state.worksheetSavedName='';state.worksheetNotice='';renderPage();return;
  }
  if(id==='vc1626-player'){state.profilePlayer=t.value;state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1626-player-a'){state.comparePlayerA=t.value;if(state.comparePlayerA===state.comparePlayerB)state.comparePlayerB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1626-player-b'){state.comparePlayerB=t.value;if(state.comparePlayerB===state.comparePlayerA)state.comparePlayerA='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1622-attack-player'){state.attackPlayer=t.value;state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1622-attack-result'){state.attackResult=t.value;state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1623-rec'){state.seqReception=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1623-receiver'){state.seqReceiver=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1623-attacker'){state.seqAttacker=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1623-outcome'){state.seqOutcome=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1621-setter-player'){state.setterPlayer=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc1621-setter-reception'){state.setterReception=t.value;renderPage();return}
  if(id==='vc1621-setter-tempo'){state.setterTempo=t.value;state.seqCompareA='';state.seqCompareB='';state.selected=[];renderInspector();renderPage();return}
  if(id==='vc171-dimension'){state.deepDim=t.value;renderPage();return}
  if(id==='vc171-player'){state.deepPlayer=t.value;renderPage();return}
  if(id==='vc157-match'){
   const chosen=matches().find(m=>String(m.id)===String(t.value));
   if(!chosen){buildHeader();return;}
   state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.player='';state.setterPlayer='';state.setterReception='';state.setterTempo='';state.attackPlayer='';state.attackResult='';state.seqReception='';state.seqReceiver='';state.seqAttacker='';state.seqOutcome='';state.seqCompareA='';state.seqCompareB='';state.labFilters={reception:'all',setter:'',attacker:'',tempo:'',outcome:'',destination:''};
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
  if(e.target.closest('#vc1657-pdf')){exportReportFile('pdf');return;}
  if(e.target.closest('#vc1657-html')){exportReportFile('html');return;}
  const labReset=e.target.closest('#vc1651-reset');
  if(labReset){state.labFilters=window.VC_TACTICAL_LAB_1651.blank();state.selected=[];state.selectedTitle='Selecciona una cifra o una zona';renderInspector();renderPage();return;}
  const labOpen=e.target.closest('[data-vc1651-subpage]');
  if(labOpen){const key=labOpen.dataset.vc1651Subpage;if(subpages.lab.some(([name])=>key===name)){state.page='lab';state.subpage.lab=key;renderPage();}return;}
  const profile=e.target.closest('[data-vc1626-open]');
  if(profile){state.profilePlayer=profile.dataset.vc1626Open;state.page='athletes';state.subpage.athletes='profile';state.selected=[];renderInspector();renderPage();return}
  const history=e.target.closest('[data-vc1626-history]');
  if(history){const chosen=matches().find(m=>String(m.id)===history.dataset.vc1626History);if(chosen){state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.page='athletes';state.subpage.athletes='profile';state.selected=[];setNativeSelection(state.match);renderInspector();buildHeader();renderPage()}return}
  const go=e.target.closest('[data-vc1625-page]');
  if(go&&pages[go.dataset.vc1625Page]){
   const [destination,sub]=routeTo(go.dataset.vc1625Page,go.dataset.vc1625Subpage);
   state.page=destination;
   if(sub&&subpages[state.page]?.some(([key])=>key===sub))state.subpage[state.page]=sub;
   renderPage();return;
  }
  const rotation=e.target.closest('[data-vc1625-rotation]');
  if(rotation){state.rotation=rotation.dataset.vc1625Rotation;state.page='lab';state.subpage.lab='rotations';state.selected=[];renderInspector();buildHeader();renderPage();return;}
  const hit=e.target.closest('[data-vc1622-drill]');
  if(hit){const obj=diagramDrills.get(hit.dataset.vc1622Drill);if(obj)selectKeys(obj.keys,obj.title);return;}
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.vc1622Clip){openVideoKeys([decodeURIComponent(t.dataset.vc1622Clip)]);return;}
  if(t.dataset.vc1623Compare){const key=decodeURIComponent(t.dataset.vc1623Key||'');if(t.dataset.vc1623Compare==='A')state.seqCompareA=key;else state.seqCompareB=key;renderPage();return;}
  if(t.id==='vc1623-export'){exportSequenceCsv();return;}
  if(t.hasAttribute('data-vc1622-rotation')){state.rotation=t.dataset.vc1622Rotation;state.selected=[];renderInspector();buildHeader();renderPage();return;}
  if(t.dataset.vc171Skill){if(['setter','lab'].includes(state.page)&&t.dataset.vc171Skill!=='E'){state.page='players';state.subpage.players='fundamentals';}state.deepSkill=t.dataset.vc171Skill;state.deepDim='player';state.deepPlayer='';renderPage();return}
  if(t.id==='vc171-retry'){deepLoadError='';renderPage();return}
  if(t.dataset.seasonMatch){
   const chosen=matches().find(m=>String(m.id)===String(t.dataset.seasonMatch));
   if(!chosen)return;
   state.match=String(chosen.id);state.set='';state.rotation='';state.phase='';state.setterPlayer='';state.setterReception='';state.setterTempo='';state.attackPlayer='';state.attackResult='';state.seqReception='';state.seqReceiver='';state.seqAttacker='';state.seqOutcome='';state.seqCompareA='';state.seqCompareB='';
   state.page='overview';state.selected=[];state.selectedTitle='Selecciona una cifra';setNativeSelection(state.match);
   renderInspector();buildHeader();renderPage();return;
  }
  if(t.id==='vc1650-save'||t.id==='vc1650-delete'||t.id==='vc1650-export'){
   const api=window.VC_CUSTOM_WORKSHEETS_1650;if(!api)return;
   if(t.id==='vc1650-export'){saveWorksheetExport();return;}
   const name=t.id==='vc1650-save'?($('vc1650-name')?.value||''):state.worksheetSavedName;
   const result=t.id==='vc1650-save'?api.saveView(name,state.worksheet):api.removeView(name);
   state.worksheetNotice=result.message;
   if(result.ok)state.worksheetSavedName=t.id==='vc1650-save'?String(name).trim().slice(0,50):'';
   renderPage();return;
  }
  if(t.dataset.pick){let keys=[];try{keys=JSON.parse(decodeURIComponent(t.dataset.pick))}catch(_){ }selectKeys(keys,t.dataset.pickTitle);return}
  switch(t.id){
   case 'vc157-refresh-matches':refresh();break;
   case 'vc1656-export':exportComparison();break;
   case 'vc157-official':window.scoutV114ExportOfficialPDF?.(currentMatch()?.id);break;
   case 'vc157-propdf':window.scoutV114ExportAnalysisPDF?.(currentMatch()?.id);break;
   case 'vc157-video':openVideo();break;
   case 'vc157-csv':exportFile('csv');break;
   case 'vc157-csv-official':exportFile('csv-official');break;
   case 'vc157-json':exportFile('json');break;
  }
 });
 host.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const t=e.target.closest('svg [data-vc1622-drill]');if(!t)return;e.preventDefault();const obj=diagramDrills.get(t.dataset.vc1622Drill);if(obj)selectKeys(obj.keys,obj.title);});
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
#scout-analysis[data-vc157-mode="studio"] > :is(#vc1614-intelligence,#vc1614-view-switch){display:none!important}
#scout-analysis[data-vc157-mode="technical"]>#vc157-studio{display:none!important}
#vc157-studio, #vc157-studio *{box-sizing:border-box}
body.v11-shell #scout-analysis #vc157-studio{
 --vc1620-ink:#18364f;
 --vc1620-ink-strong:#102d45;
 --vc1620-muted:#607c96;
 --vc1620-line:#d9e5ef;
 --vc1620-line-strong:#cbd9e5;
 --vc1620-paper:#fff;
 --vc1620-paper-soft:#f8fbfd;
 --vc1620-surface:#eef4f8;
 --vc1620-surface-2:#f4f7fa;
 --vc1620-accent:#1e6c9f;
 --vc1620-accent-2:#2d85b9;
 --vc1620-success:#2f7f67;
 --vc1620-warn:#9a6d2a;
 --vc1620-shadow:0 10px 28px rgba(16,45,69,.08);
 max-width:100%;min-width:0;color:var(--vc1620-ink);font:500 13px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;margin:0 auto 28px
}
#vc157-studio button{cursor:pointer;font-family:inherit}
#vc157-studio button:focus-visible,#vc157-studio select:focus-visible{outline:3px solid #8cc5f3;outline-offset:2px}
#vc157-studio .vc157-appshell{background:linear-gradient(180deg,#f7fbfe 0%,#f2f6f9 100%);border:1px solid #d7e2eb;border-radius:22px;overflow:hidden;box-shadow:0 12px 35px rgba(16,45,69,.08)}
#vc157-studio .vc157-top{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;flex-wrap:wrap;padding:28px 30px;background:linear-gradient(125deg,#0e2740,#173f63 56%,#1f5f88 100%);color:#fff;position:relative;overflow:hidden}
#vc157-studio .vc157-top::after{content:'';position:absolute;inset:auto -60px -80px auto;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle at center,rgba(255,255,255,.15),transparent 65%);pointer-events:none}
#vc157-studio .vc157-brand{display:grid;gap:6px;min-width:0;max-width:780px}
#vc157-studio .vc157-eyebrow{display:block;color:#8fd0f2;letter-spacing:.13em;font-size:10px;font-weight:850}
#vc157-studio .vc157-top h2{font:850 clamp(25px,2.4vw,32px)/1.15 system-ui!important;color:#fff!important;margin:0!important}
#vc157-studio .vc157-top p{font-size:13px;color:#d2e3ef;margin:0}
#vc157-studio .vc157-headmeta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
#vc157-studio .vc157-metapill{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:#eff8ff;font-size:10px;font-weight:800;letter-spacing:.03em}
#vc157-studio .vc157-actions{display:flex;gap:8px;flex-wrap:wrap;align-self:flex-start}
#vc157-studio .vc157-actions button{min-height:40px!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:10px!important;background:rgba(255,255,255,.08)!important;color:#fff!important;font-weight:780!important;font-size:11px!important;padding:10px 14px!important;backdrop-filter:blur(2px)}
#vc157-studio .vc157-actions .vc157-pdf{background:#fff!important;border-color:#fff!important;color:#174d77!important}
#vc157-studio .vc157-toolbar{padding:16px 22px;background:linear-gradient(180deg,#f7fafc,#f3f7fa);border-bottom:1px solid var(--vc1620-line)}
#vc157-studio .vc157-filterbar{display:grid;grid-template-columns:minmax(250px,2.4fr) auto repeat(4,minmax(120px,1fr));align-items:end;gap:12px}
#vc157-studio .vc157-filterbar label, #vc157-studio .vc157-explorer-filters label, #vc157-studio .vc171-filters label{display:grid;gap:6px;min-width:0;color:var(--vc1620-muted);font:800 10px/1.4 system-ui;letter-spacing:.02em;text-transform:uppercase}
#vc157-studio .vc157-match-field{position:relative}
#vc157-studio .vc157-match-count{position:absolute;right:0;top:0;font-size:9px;color:#497ba0;font-weight:800}
body.v11-shell #scout-analysis #vc157-studio select{width:100%!important;max-width:none!important;min-width:0!important;height:42px!important;min-height:42px!important;border:1px solid #cadbe8!important;border-radius:10px!important;padding:8px 11px!important;background:#fff!important;color:#244963!important;font:700 12px system-ui!important;box-shadow:inset 0 1px 2px rgba(15,52,80,.04)}
#vc157-studio #vc157-refresh-matches{height:42px!important;min-height:42px!important;padding:8px 13px!important;border:1px solid #d4e1ea!important;border-radius:10px!important;background:#fff!important;color:#195b8d!important;font-weight:800!important;font-size:11px!important;box-shadow:0 1px 2px rgba(15,52,80,.05)}
#vc157-studio .vc157-work{display:grid;grid-template-columns:224px minmax(0,1fr);grid-template-areas:'nav head' 'nav tabs' 'nav contents';column-gap:18px;row-gap:14px;align-items:start;padding:20px;background:#f4f7fa;min-width:0}
#vc157-studio .vc157-tabs{grid-area:nav!important;display:flex!important;flex-direction:column!important;position:sticky;top:72px;background:linear-gradient(180deg,#edf3f7,#e6eef4);border:1px solid #d8e3ec;border-radius:16px;padding:10px;gap:6px;margin:0!important;min-width:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
#vc157-studio .vc157-tabs button{min-height:62px!important;text-align:left!important;padding:12px 13px!important;display:grid;gap:3px;align-content:center;white-space:normal!important;background:transparent!important;border:1px solid transparent!important;border-radius:11px!important;color:#52738f!important;transition:background .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease}
#vc157-studio .vc157-tabs button:hover{background:rgba(255,255,255,.55)!important;border-color:#d2dfea!important;transform:translateY(-1px)}
#vc157-studio .vc157-tabs button b{font-size:13px;font-weight:850;color:var(--vc1620-ink-strong)}
#vc157-studio .vc157-tabs button span{font-size:10px;line-height:1.35;color:inherit;opacity:.85}
#vc157-studio .vc157-tabs button[aria-selected="true"]{background:#fff!important;color:#154d7c!important;border-color:#cbddec!important;box-shadow:0 6px 14px rgba(20,59,85,.10)}
#vc157-studio .vc157-stagehead{grid-area:head;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:2px 2px 12px;border-bottom:1px solid #dbe6ef}
#vc157-studio .vc157-stagehead h3{color:#153a5b!important;font:850 24px/1.18 system-ui!important;margin:4px 0 2px!important}
#vc157-studio .vc157-stagehead p{color:#67839a;font-size:12px;margin:0}
#vc157-studio .vc157-export{display:flex;gap:7px;flex-wrap:wrap}
#vc157-studio .vc157-export button{background:#fff!important;border:1px solid #d0dde8!important;border-radius:10px!important;color:#245b84!important;min-height:36px!important;font:780 10px system-ui!important;padding:8px 11px!important;box-shadow:0 1px 2px rgba(15,52,80,.05)}
#vc157-studio .vc1620-subtabs{grid-area:tabs;display:flex;gap:8px;flex-wrap:wrap;min-width:0}
#vc157-studio .vc1620-subtabs[hidden]{display:none!important}
#vc157-studio .vc1620-subtabs button{border:1px solid #d5e2ec!important;background:#fff!important;color:#53748f!important;padding:8px 14px!important;min-height:38px!important;border-radius:999px!important;font-weight:800!important;font-size:11px!important}
#vc157-studio .vc1620-subtabs button[aria-pressed="true"]{color:#fff!important;background:linear-gradient(180deg,#1c679f,#185787)!important;border-color:#185787!important;box-shadow:0 6px 14px rgba(24,87,135,.18)}
#vc157-studio[data-vc1620-setter="true"] .vc171-skillbar{display:none!important}
#vc157-studio[data-vc1620-season="true"] .vc157-inspector{display:none!important}
#vc157-studio[data-vc1620-season="true"] .vc157-columns{grid-template-columns:minmax(0,1fr)!important}
#vc157-studio .vc157-columns{grid-area:contents;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,320px);gap:16px;align-items:start;min-width:0}
#vc157-studio .vc157-content{display:grid;gap:16px;min-width:0;max-width:100%;margin:0}
#vc157-studio .vc157-panel,#vc157-studio .vc157-inspector{background:var(--vc1620-paper);border:1px solid var(--vc1620-line);border-radius:16px;padding:18px;min-width:0;box-shadow:0 4px 16px rgba(24,52,79,.05)}
#vc157-studio .vc157-panel h3,#vc157-studio .vc157-inspector h3{color:#173e60!important;font:850 16px/1.3 system-ui!important;margin:0 0 8px!important}
#vc157-studio .vc157-panel p,#vc157-studio .vc157-inspector p{font-size:11px;color:#668198;line-height:1.58;margin:7px 0}
#vc157-studio .vc157-panelhead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start}
#vc157-studio .vc157-tag{font-size:10px;color:#2e648a;padding:6px 11px;background:#eef6fc;border:1px solid #d6e9f6;border-radius:999px;white-space:nowrap;font-weight:800}
#vc157-studio .vc157-tablewrap{max-width:100%;overflow:auto;border:1px solid #dfe8ef;border-radius:12px;background:#fff}
#vc157-studio .vc157-table{border-collapse:separate;border-spacing:0;width:100%;min-width:620px;white-space:nowrap;font:650 11px/1.4 system-ui;font-variant-numeric:tabular-nums}
#vc157-studio .vc157-table th{background:linear-gradient(180deg,#f4f8fb,#edf4f8);color:#52718a;text-align:left;padding:11px 9px;font:800 10px system-ui;position:sticky;top:0;z-index:1;border-bottom:1px solid #d8e3eb}
#vc157-studio .vc157-table td{padding:10px 9px;border-bottom:1px solid #edf2f6;color:#335a77;vertical-align:middle;background:#fff}
#vc157-studio .vc157-table tbody tr:nth-child(even) td{background:#fbfdff}
#vc157-studio .vc157-table tbody tr:hover td{background:#f2f8fd}
#vc157-studio .vc157-table td small{display:block;color:#899caf;font-size:10px;margin-top:2px}
#vc157-studio .vc157-table td:first-child,#vc157-studio .vc157-table th:first-child{position:static;left:auto;z-index:auto;box-shadow:none}
#vc157-studio .vc157-table td:first-child{background:inherit}
#vc157-studio .vc157-table th:first-child{background:linear-gradient(180deg,#f4f8fb,#edf4f8)}
#vc157-studio .vc157-tablewrap{position:relative}
#vc157-studio .vc157-tablewrap::after{content:'';position:absolute;top:0;right:0;bottom:0;width:18px;pointer-events:none;background:linear-gradient(270deg,rgba(248,251,253,.92),rgba(248,251,253,0))}
#vc157-studio .vc157-table .vc157-muted{padding:22px;color:#7d95a8;text-align:center}
#vc157-studio .vc157-player{font-weight:850}
#vc157-studio .vc157-pick{background:transparent!important;border:0!important;color:#17649b!important;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#b5d4e7;padding:2px!important;font:800 11px system-ui!important;white-space:nowrap!important}
#vc157-studio .vc157-note{margin-top:12px!important;border-top:1px solid #e8eff4;padding-top:10px;color:#7c94a6!important;font-size:10px!important}
#vc157-studio .vc157-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
#vc157-studio .vc157-inspector{position:sticky;top:72px;max-height:min(78vh,850px);overflow:auto;background:linear-gradient(180deg,#fff,#fbfdff)}
#vc157-studio .vc157-inspector-head{padding-bottom:12px;margin-bottom:10px;border-bottom:1px solid #e3ebf2}
#vc157-studio .vc157-inspector-head span{color:#6b94b5;font:900 9px system-ui;letter-spacing:.12em}
#vc157-studio .vc157-inspector-list{display:grid;gap:8px;max-height:360px;overflow:auto}
#vc157-studio .vc157-inspector-item{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f5f9fc;padding:10px;border:1px solid #e2ebf3;border-radius:10px}
#vc157-studio .vc157-inspector-item b{font:850 11px ui-monospace,Consolas,monospace;color:#284c6b}
#vc157-studio .vc157-inspector-item small{display:block;font-size:9px;color:#819aad;margin-top:2px}
#vc157-studio .vc157-inspector-item>span{font-size:9px;color:#4e7e9d}
#vc157-studio .vc1622-clip{min-height:31px!important;background:#fff!important;border:1px solid #cfe0eb!important;border-radius:8px!important;color:#1f628f!important;font-weight:800!important;font-size:10px!important;padding:7px 9px!important}
#vc157-studio #vc157-video{min-height:42px!important;background:linear-gradient(180deg,#1a669d,#155986)!important;border:1px solid #155986!important;border-radius:10px!important;color:#fff!important;width:100%;font-weight:850!important;font-size:11px!important;margin-top:12px;box-shadow:0 8px 18px rgba(21,89,134,.18)}
#vc157-studio #vc157-video:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
#vc157-studio .vc157-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
#vc157-studio .vc157-metric{display:grid;gap:5px;align-content:start;min-width:0;background:linear-gradient(180deg,#fff,#f8fbfd);border:1px solid var(--vc1620-line);border-radius:14px;padding:15px;box-shadow:0 2px 8px rgba(24,52,79,.04)}
#vc157-studio .vc157-metric>span{color:#63819a;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.03em}
#vc157-studio .vc157-metric strong{color:#153a5a;font-size:clamp(19px,2vw,28px);line-height:1.2}
#vc157-studio .vc157-metric small{font-size:10px;color:#7b93a7}
#vc157-studio .vc157-metric button{justify-self:start}
#vc157-studio .vc157-statline{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid #e8eff5;font-size:12px}
#vc157-studio .vc157-insight{border-left:3px solid #5a9ac5;background:#f1f7fc;border-radius:10px;margin-bottom:10px;padding:12px}
#vc157-studio .vc157-insight b{font-size:11px;color:#245174}
#vc157-studio .vc157-cellbar{display:inline-block;width:58px;height:7px;border-radius:7px;background:#e3edf5;overflow:hidden;margin-right:6px;vertical-align:middle}
#vc157-studio .vc157-cellbar i{display:block;height:100%;background:#468abc}
#vc157-studio .vc157-court{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-width:460px;border:2px solid #ad7b47;background:linear-gradient(180deg,#d2a977,#c59058);border-radius:14px;padding:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
#vc157-studio .vc157-zone{display:grid;position:relative;place-items:center;gap:3px;min-height:86px!important;overflow:hidden;border:1px solid #dfcbae!important;border-radius:10px!important;background:#fff9f0!important;color:#22445b!important}
#vc157-studio .vc157-zone i{position:absolute;inset:auto 0 0 0;background:linear-gradient(180deg,transparent,#3282bc);pointer-events:none;opacity:.92}
#vc157-studio .vc157-zone>:not(i){position:relative;z-index:1}
#vc157-studio .vc157-zone strong{font-size:20px}
#vc157-studio .vc157-explorer-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
#vc157-studio .vc157-footer{color:#8197a9;font-size:10px;margin:14px 22px 22px}
#vc157-studio .vc157-empty{background:#fff;border:1px dashed #b5ccdf;border-radius:14px;padding:34px;color:#66849e;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
#vc157-studio .vc1620-season-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:12px}
#vc157-studio .vc1620-season-metrics>div{display:grid;gap:5px;border:1px solid #dae7f0;border-radius:11px;padding:12px;background:#f7fafd;min-width:0}
#vc157-studio .vc1620-season-metrics span{font-size:10px;font-weight:800;color:#547d97}
#vc157-studio .vc1620-season-metrics strong{font-size:20px;color:#153b5f}
#vc157-studio .vc1620-season-metrics small{font-size:9px;color:#7794a8}
#vc157-studio .vc157-season-link{border:0!important;background:transparent!important;color:#165c94!important;font:800 11px system-ui!important;padding:2px!important;text-decoration:underline;text-underline-offset:3px}
#vc157-studio .vc1620-trend{display:grid;gap:9px;margin-top:12px}
#vc157-studio .vc1620-trendrow{display:grid;grid-template-columns:minmax(100px,1.1fr) minmax(80px,2fr) 65px 55px;gap:9px;align-items:center;color:#54758e;font-size:11px}
#vc157-studio .vc1620-trendrow>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#vc157-studio .vc1620-trendrow b{color:#265d84}
#vc157-studio .vc1620-track{height:10px;overflow:hidden;background:#e8f0f6;border-radius:8px}
#vc157-studio .vc1620-track i{display:block;background:#377caa;height:100%;border-radius:8px}
#vc157-studio .vc1623-filterbar{display:grid;grid-template-columns:repeat(4,minmax(145px,1fr));gap:10px;margin:12px 0}
#vc157-studio .vc1623-filterbar label{display:grid;gap:4px;min-width:0;color:#56748d;font:750 10px/1.4 system-ui}
#vc157-studio .vc1623-filterbar select{min-width:0;width:100%}
#vc157-studio .vc1623-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:14px 0}
#vc157-studio .vc1623-metrics>div{background:#f1f7fd;border:1px solid #d7e8f4;border-radius:12px;min-width:0;padding:12px 9px;display:flex;flex-direction:column;gap:4px}
#vc157-studio .vc1623-metrics span{font-size:10px;font-weight:750;color:#52738a}
#vc157-studio .vc1623-metrics strong{font-size:19px;color:#154c75}
#vc157-studio .vc1623-metrics small{font-size:10px;color:#648397}
#vc157-studio .vc1623-toolrow{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:12px 0}
#vc157-studio .vc1623-toolrow p{margin:0;font-size:11px;color:#5a7c94}
#vc157-studio .vc1623-flow{display:grid;gap:9px}
#vc157-studio .vc1623-flowrow{display:grid!important;gap:7px;padding:12px 14px!important;border:1px solid #d3e5f0!important;background:#f8fbff!important;border-radius:12px!important;text-align:left!important;color:#204b68!important;min-width:0!important;white-space:normal!important;cursor:pointer;box-shadow:0 2px 8px rgba(24,52,79,.03)}
#vc157-studio .vc1623-flowrow:focus-visible{outline:3px solid #276eaf!important;outline-offset:2px}
#vc157-studio .vc1623-flowtop{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px}
#vc157-studio .vc1623-flowtop small{color:#67859b;font-size:10px;text-align:right}
#vc157-studio .vc1623-flowpath{display:grid;grid-template-columns:minmax(0,1fr) 13px minmax(0,1fr) 13px minmax(0,1fr) 13px minmax(0,1.2fr);align-items:center;gap:6px}
#vc157-studio .vc1623-flowpath span{border-radius:8px;background:#e7f1fa;border:1px solid #d0e4f2;padding:9px 7px;text-align:center;min-width:0;overflow-wrap:anywhere;font-size:10px;font-weight:700;color:#295875}
#vc157-studio .vc1623-flowpath span:last-child{background:#eaf5ee;border-color:#cae5d4;color:#286c57}
#vc157-studio .vc1623-flowpath i{font-style:normal;color:#5783a1;font-weight:900;text-align:center}
#vc157-studio .vc1623-progress{display:block;border-radius:7px;height:4px;background:#dfeef7;overflow:hidden}
#vc157-studio .vc1623-progress i{display:block;height:100%;background:#347daf;border-radius:7px}
#vc157-studio .vc1623-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:11px}
#vc157-studio .vc1623-compcard{padding:14px;background:#f6faff;border:1px solid #d6e7f2;border-radius:13px;min-width:0;display:grid;align-content:start;gap:8px}
#vc157-studio .vc1623-comptag{font-size:10px;font-weight:850;letter-spacing:.09em;color:#40759c}
#vc157-studio .vc1623-compcard h4{font-size:15px!important;line-height:1.4;margin:0!important;color:#194e73}
#vc157-studio .vc1623-compcard p{font-size:11px;line-height:1.5;margin:0;color:#61839c}
#vc157-studio .vc1623-compnums{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#vc157-studio .vc1623-compnums>div{display:grid;gap:4px;border-top:1px solid #d7e8f3;padding-top:8px}
#vc157-studio .vc1623-compnums strong{font-size:17px;color:#1b577f}
#vc157-studio .vc1623-compnums span{font-size:10px;color:#5c7d95}
#vc157-studio .vc1623-smalln{color:#a16d2f!important;font-weight:750}
#vc157-studio .vc1623-abbuttons{display:inline-flex;gap:3px}
#vc157-studio .vc1623-pickcompare{padding:6px 8px!important;min-height:29px!important;background:#f3f8fc!important;color:#2c658a!important;border:1px solid #bed7e8!important;border-radius:7px!important;font-weight:800!important;font-size:10px!important}
#vc157-studio .vc1623-pickcompare.is-active{background:#256d9e!important;color:#fff!important;border-color:#256d9e!important}
#vc157-studio .vc1622-filterline{display:flex;align-items:end;flex-wrap:wrap;gap:10px;margin:12px 0}
#vc157-studio .vc1622-filterline label{display:grid;gap:4px;min-width:155px;flex:1;color:#56748d;font:750 10px/1.4 system-ui}
#vc157-studio .vc1622-legend{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:10px;color:#6a8398;margin:0 0 10px}
#vc157-studio .vc1622-legend i{width:11px;height:11px;border-radius:4px;background:#6283ab;margin-left:6px}
#vc157-studio .vc1622-legend .positive{background:#1d8576}#vc157-studio .vc1622-legend .negative{background:#c66b55}#vc157-studio .vc1622-legend .neutral{background:#6283ab}
#vc157-studio .vc1622-diagramwrap{width:100%;overflow-x:auto;border:1px solid #d5e4ee;border-radius:14px;background:linear-gradient(#fff,#f7fbff);margin:11px 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.55)}
#vc157-studio .vc1622-diagram{display:block;width:100%;min-width:540px;height:auto;max-height:350px}
#vc157-studio .vc1622-label{font:800 13px system-ui;fill:#244f6e;letter-spacing:.06em}
#vc157-studio .vc1622-court-number{font:750 12px system-ui;fill:#3b7093}
#vc157-studio .vc1622-court-count{font:850 18px system-ui;fill:#123e5e}
#vc157-studio .vc1622-setnode{font:800 13px system-ui;fill:#18517d}
#vc157-studio .vc1622-route-hit{cursor:pointer;pointer-events:stroke}
#vc157-studio .vc1622-route-hit:focus-visible{stroke:#183e60;stroke-opacity:.26;outline:none}
#vc157-studio .vc1622-destcards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
#vc157-studio .vc1622-destcard{display:grid!important;grid-template-columns:38px 48px 1fr;gap:7px;align-items:center;text-align:left!important;min-width:0!important;min-height:56px!important;padding:9px!important;border:1px solid #d9e6ef!important;border-radius:11px!important;background:#f3f8fc!important;color:#244d6b!important}
#vc157-studio .vc1622-destcard b{font-size:12px}#vc157-studio .vc1622-destcard strong{font-size:17px}#vc157-studio .vc1622-destcard span{font-size:10px;line-height:1.45}
#vc157-studio .vc1622-rotgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:13px 0}
#vc157-studio .vc1622-rotcard{background:#f8fbfe;border:1px solid #d6e5f0;border-radius:12px;padding:12px;min-width:0;box-shadow:0 2px 8px rgba(24,52,79,.03)}
#vc157-studio .vc1622-rotcard.is-active{border-color:#257bb5;background:#eaf5fd}
#vc157-studio .vc1622-rothead{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px}
#vc157-studio .vc1622-rothead b{color:#165886;font-size:17px}
#vc157-studio .vc1622-rothead small{color:#728da3;font-size:9px;text-align:right}
#vc157-studio .vc1622-rotline{display:grid;grid-template-columns:1fr;gap:4px;margin-bottom:7px;font-size:10px}
#vc157-studio .vc1622-rotline small{display:flex;justify-content:space-between;gap:5px;color:#527692}
#vc157-studio .vc1622-rotline strong{text-align:right;color:#275c80;font-size:11px}
#vc157-studio .vc1622-track{height:7px;background:#dfecf5;border-radius:10px;overflow:hidden}
#vc157-studio .vc1622-track i{display:block;height:100%;background:linear-gradient(90deg,#3f82b3,#235f8b);border-radius:10px}
#vc157-studio .vc1622-rotactions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
#vc157-studio .vc1622-rot-filter,#vc157-studio .vc1622-clear-rot{min-height:32px!important;border:1px solid #d4e2ed!important;background:#fff!important;color:#215e89!important;border-radius:8px!important;font-size:10px!important;font-weight:800!important;padding:7px 10px!important}
@media(max-width:1280px){#vc157-studio .vc157-columns{grid-template-columns:minmax(0,1fr) 290px}#vc157-studio .vc157-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1620-season-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}#vc157-studio .vc1623-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1120px){#vc157-studio .vc157-work{grid-template-columns:1fr;grid-template-areas:'head' 'nav' 'tabs' 'contents'}#vc157-studio .vc157-tabs{position:static;flex-direction:row!important;overflow:auto;padding:8px}#vc157-studio .vc157-tabs button{min-width:180px}#vc157-studio .vc157-columns{grid-template-columns:1fr}#vc157-studio .vc157-inspector{position:static;max-height:none}}
@media(max-width:900px){#vc157-studio .vc157-filterbar{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc157-grid2{grid-template-columns:1fr}#vc157-studio .vc1622-rotgrid,#vc157-studio .vc1622-destcards{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1620-season-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1623-filterbar{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1623-compare{grid-template-columns:1fr}}
@media(max-width:720px){#vc157-studio .vc157-top{padding:22px 18px}#vc157-studio .vc157-toolbar{padding:14px 14px 16px}#vc157-studio .vc157-work{padding:14px}#vc157-studio .vc157-metrics,#vc157-studio .vc1623-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc157-explorer-filters{grid-template-columns:1fr}#vc157-studio .vc1623-flowtop{align-items:flex-start;flex-direction:column;gap:3px}#vc157-studio .vc1623-flowtop small{text-align:left}#vc157-studio .vc1623-flowpath{grid-template-columns:minmax(0,1fr) 12px minmax(0,1fr);row-gap:5px}#vc157-studio .vc1623-flowpath span:nth-last-child(1){grid-column:1/4}}
@media(max-width:560px){#vc157-studio .vc157-filterbar,#vc157-studio .vc1623-filterbar{grid-template-columns:1fr}#vc157-studio .vc157-metrics,#vc157-studio .vc1623-metrics,#vc157-studio .vc1622-rotgrid,#vc157-studio .vc1622-destcards,#vc157-studio .vc1620-season-metrics{grid-template-columns:1fr}#vc157-studio .vc157-stagehead{align-items:flex-start}#vc157-studio .vc157-export{width:100%}#vc157-studio .vc157-export button{flex:1}#vc157-studio .vc157-tabs button{min-width:155px}#vc157-studio .vc157-table{min-width:560px}}

/* V16.2.5 · Real layout change. Navigation is horizontal, overview is a dashboard. */
#vc157-studio .vc157-appshell{border-radius:17px}
#vc157-studio .vc157-top{padding:19px 24px;background:linear-gradient(112deg,#12324f,#1d537e);align-items:center}
#vc157-studio .vc157-brand{gap:3px}
#vc157-studio .vc157-top h2{font-size:24px!important;line-height:1.2!important}
#vc157-studio .vc157-top p{font-size:11px}
#vc157-studio .vc157-headmeta{display:none}
#vc157-studio .vc157-toolbar{padding:10px 17px}
#vc157-studio .vc157-filterbar{gap:8px;grid-template-columns:minmax(210px,2.4fr) auto repeat(4,minmax(105px,1fr))}
#vc157-studio .vc157-work{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:'nav' 'head' 'tabs' 'contents';row-gap:12px;padding:12px 16px 18px}
#vc157-studio .vc157-tabs{grid-area:nav;position:static;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr));flex-direction:row!important;gap:5px;padding:5px;background:#ecf2f7;border-radius:11px;overflow:visible}
#vc157-studio .vc157-tabs button{min-height:47px!important;min-width:0!important;padding:9px 10px!important;text-align:center!important;gap:1px}
#vc157-studio .vc157-tabs button b{font-size:11px}
#vc157-studio .vc157-tabs button span{display:none}
#vc157-studio .vc157-tabs button[aria-selected="true"]{background:#2169a1!important;color:#fff!important;border-color:#2169a1!important}
#vc157-studio .vc157-tabs button[aria-selected="true"] b{color:#fff!important}
#vc157-studio .vc157-stagehead{grid-area:head;align-items:center;padding:5px 4px 9px}
#vc157-studio .vc157-stagehead h3{font-size:19px!important}
#vc157-studio .vc157-columns{grid-template-columns:minmax(0,1fr) minmax(222px,260px);gap:12px}
#vc157-studio .vc157-content{gap:12px}
#vc157-studio .vc157-panel,#vc157-studio .vc157-inspector{padding:13px;border-radius:12px}
#vc157-studio .vc157-inspector{top:18px;max-height:75vh}
#vc157-studio .vc157-inspector-head h3{font-size:13px!important}
#vc157-studio .vc1625-overview{display:grid;gap:12px;min-width:0}
#vc157-studio .vc1625-scorehead{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #dce7ef;border-radius:11px;background:linear-gradient(110deg,#f8fbff,#edf5fb);padding:12px 15px}
#vc157-studio .vc1625-label{font-size:9px;letter-spacing:.09em;font-weight:850;color:#5384a5}
#vc157-studio .vc1625-scorehead h3{margin:1px 0!important;font-size:15px!important;color:#183d5c!important}
#vc157-studio .vc1625-scorehead p{font-size:10px;color:#678297;margin:0}
#vc157-studio .vc1625-scorebadge{white-space:nowrap;border:1px solid #cee2f2;background:#fff;border-radius:9px;color:#245f88;font-size:11px;font-weight:850;padding:9px 12px;font-variant-numeric:tabular-nums}
#vc157-studio .vc1625-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#vc157-studio .vc1625-kpi{min-width:0;display:flex;flex-direction:column;gap:4px;border:1px solid #dbe6ee;border-radius:12px;padding:11px 12px;background:#fff}
#vc157-studio .vc1625-kpi>span{font-size:9px;font-weight:850;letter-spacing:.035em;color:#577d99}
#vc157-studio .vc1625-kpi strong{font-size:clamp(18px,2.1vw,25px);line-height:1.1;color:#143c5e;font-weight:900;font-variant-numeric:tabular-nums}
#vc157-studio .vc1625-kpi small{font-size:9px;color:#7892a5}
#vc157-studio .vc1625-kpi .vc157-pick{align-self:flex-start;margin-top:auto;font-size:9px!important}
#vc157-studio .vc1625-dashgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
#vc157-studio .vc1625-dashgrid .vc157-panel{height:100%;min-width:0;overflow:hidden}
#vc157-studio .vc1625-dashgrid .vc157-panelhead{align-items:center}
#vc157-studio .vc1625-dashgrid h3{font-size:13px!important;margin:0 0 3px!important}
#vc157-studio .vc1625-dashgrid .vc157-panelhead p{font-size:10px;line-height:1.4;margin:0}
#vc157-studio .vc1625-more{border:1px solid #cbdde9!important;background:#f2f8fd!important;border-radius:8px!important;padding:6px 9px!important;color:#22618a!important;font-size:10px!important;font-weight:800!important;white-space:nowrap}
#vc157-studio .vc1625-trendsvg{width:100%;height:auto;display:block;margin:11px 0 5px;max-height:188px}
#vc157-studio .vc1625-plotfoot{display:flex;gap:6px;justify-content:space-between;align-items:center;color:#748a9c;font-size:10px;border-top:1px solid #e8f0f5;padding-top:9px}
#vc157-studio .vc1625-plotfoot button{background:#eef6fc!important;border:1px solid #d8e7f2!important;border-radius:7px!important;color:#1b628e!important;padding:5px 8px!important;font-size:10px!important;font-weight:750!important}
#vc157-studio .vc1625-rotwrap{overflow-x:auto;margin-top:10px}
#vc157-studio .vc1625-rotwrap table{width:100%;border-collapse:collapse;font:700 10px/1.35 system-ui;white-space:nowrap;font-variant-numeric:tabular-nums}
#vc157-studio .vc1625-rotwrap thead{background:#f0f5f9}
#vc157-studio .vc1625-rotwrap th,#vc157-studio .vc1625-rotwrap td{padding:7px 5px;border-bottom:1px solid #e8eef4;text-align:left}
#vc157-studio .vc1625-rotwrap tbody tr:nth-child(even){background:#fafcfe}
#vc157-studio .vc1625-rotwrap td small{display:block;color:#90a4b4;font-size:9px;font-weight:500}
#vc157-studio .vc1625-rotwrap th button{border:0!important;background:transparent!important;color:#165b8c!important;font-size:11px!important;font-weight:850!important;padding:2px!important}
#vc157-studio .vc1625-rotwrap .vc157-pick{font-size:10px!important}
#vc157-studio .vc1625-courtframe{margin-top:13px;border:1px solid #bfdbec;border-radius:12px;background:#e7f2f9;padding:10px}
#vc157-studio .vc1625-courttop{display:flex;justify-content:space-between;flex-wrap:wrap;gap:5px;padding:0 2px 8px;color:#56819e;font-size:9px;font-weight:800;letter-spacing:.025em}
#vc157-studio .vc1625-courtgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;background:#d0e4f1;border-radius:9px;border:2px solid #80acc9;padding:5px;position:relative}
#vc157-studio .vc1625-courtgrid::after{content:'';position:absolute;left:0;right:0;top:33.333%;border-top:2px solid #1d5c8b;pointer-events:none}
#vc157-studio .vc1625-courtcell{min-height:63px!important;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3px;background:linear-gradient(0deg,rgba(36,119,178,var(--zone-strength)),rgba(255,255,255,.9))!important;border:1px solid #b3d2e6!important;border-radius:6px!important;color:#1b567f!important;font-weight:850!important;transition:box-shadow .15s ease,transform .15s ease}
#vc157-studio .vc1625-courtcell:enabled:hover{box-shadow:0 0 0 2px #247db4;transform:scale(1.015)}
#vc157-studio .vc1625-courtcell:disabled{opacity:.48;cursor:default!important}
#vc157-studio .vc1625-courtcell span{font-size:10px}
#vc157-studio .vc1625-courtcell b{font-size:16px}
#vc157-studio .vc1625-patterns{display:grid;gap:5px;margin-top:10px}
#vc157-studio .vc1625-patternrow{display:grid!important;grid-template-columns:26px minmax(0,1fr) 36px;align-items:center;gap:7px;text-align:left!important;padding:8px!important;border:1px solid #e2ebf2!important;background:#f9fcfe!important;border-radius:8px!important;color:#254c66!important;min-width:0}
#vc157-studio .vc1625-patternrow:hover{background:#eff7fc!important}
#vc157-studio .vc1625-patternindex{font-size:10px;font-weight:900;color:#4d8cb5}
#vc157-studio .vc1625-patternlabel{display:grid;gap:2px;min-width:0}
#vc157-studio .vc1625-patternlabel b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#vc157-studio .vc1625-patternlabel small{font-size:9px;color:#839aab;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#vc157-studio .vc1625-patternval{text-align:right;display:grid;gap:2px}
#vc157-studio .vc1625-patternval b{font-size:13px}
#vc157-studio .vc1625-patternval small{font-size:9px;color:#8aa2b3}
#vc157-studio .vc1625-readinglist>div{padding:8px 0;border-bottom:1px solid #edf1f5}
#vc157-studio .vc1625-readinglist b{font-size:11px;color:#1f5478}
#vc157-studio .vc1625-readinglist p{margin:3px 0!important;font-size:10px!important}
#vc157-studio .vc1625-quality{padding-top:10px;color:#7b91a4;font-size:10px}
@media(max-width:1100px){#vc157-studio .vc157-columns{grid-template-columns:minmax(0,1fr)}#vc157-studio .vc157-inspector{position:static;max-height:none}}
@media(max-width:930px){#vc157-studio .vc157-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}#vc157-studio .vc157-filterbar{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){#vc157-studio .vc1625-dashgrid{grid-template-columns:1fr}#vc157-studio .vc1625-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc157-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1625-scorehead{flex-direction:column;align-items:start}}
/* V16.2.7 · Tactical board & table fix, retaining Player Performance Pro. */
#vc157-studio .vc1626-overline{display:block;font:850 10px/1.4 system-ui;letter-spacing:.10em;color:#41779e;margin-bottom:7px}
#vc157-studio .vc1626-profiletop{display:flex;align-items:end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:16px}
#vc157-studio .vc1626-profiletop h3{font-size:24px!important;margin:0!important}
#vc157-studio .vc1626-profiletop p{margin-top:6px!important}
#vc157-studio .vc1626-profiletop label,#vc157-studio .vc1626-comparefilters label{display:grid;gap:7px;min-width:200px;font:800 10px/1.4 system-ui;text-transform:uppercase;color:#5e7d96;letter-spacing:.025em}
#vc157-studio .vc1626-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
#vc157-studio .vc1626-stat{display:grid;align-content:start;gap:5px;padding:15px;background:linear-gradient(150deg,#f9fcff,#eff6fb);border:1px solid #dce8f1;border-radius:12px;min-width:0}
#vc157-studio .vc1626-stat small{font-size:10px;font-weight:850;letter-spacing:.035em;text-transform:uppercase;color:#5b7e99}
#vc157-studio .vc1626-stat strong{font-size:clamp(22px,2.3vw,31px);line-height:1.1;color:#143e60;font-variant-numeric:tabular-nums}
#vc157-studio .vc1626-stat>span{font-size:10px;line-height:1.5;color:#617d96;min-height:30px}
#vc157-studio .vc1626-stat button{justify-self:start}
#vc157-studio .vc1626-sheet{min-width:720px}
#vc157-studio .vc1626-bar{display:block;background:#e3eef5;height:9px;min-width:90px;border-radius:10px;overflow:hidden}
#vc157-studio .vc1626-bar i{display:block;background:linear-gradient(90deg,#3f9ac5,#1d6298);height:100%;border-radius:10px}
#vc157-studio .vc1626-hint{font-size:11px!important;color:#637f95!important;line-height:1.55}
#vc157-studio .vc1626-historygrid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(245px,1fr);gap:14px;align-items:start}
#vc157-studio .vc1626-minichart{padding:14px;background:#f8fbfe;border:1px solid #dfebf2;border-radius:12px;min-width:0}
#vc157-studio .vc1626-minichart>b{display:block;font-size:12px;color:#194966;margin-bottom:14px}
#vc157-studio .vc1626-trendrow{display:grid;grid-template-columns:minmax(70px,1fr) minmax(70px,1.5fr) 55px 55px;gap:8px;align-items:center;font-size:10px;margin:10px 0;min-width:0}
#vc157-studio .vc1626-trendrow small{color:#63809b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#vc157-studio .vc1626-trendrow>b{color:#1c587f;text-align:right}
#vc157-studio .vc1626-trendtrack{height:9px;border-radius:10px;background:#e2edf5;overflow:hidden}
#vc157-studio .vc1626-trendtrack i{height:100%;display:block;background:#2f7fae;border-radius:10px}
#vc157-studio .vc1626-matchlink{background:none!important;border:none!important;color:#216997!important;text-decoration:underline;text-underline-offset:3px;font-weight:800!important;padding:0!important;text-align:left!important}
#vc157-studio .vc1626-comparefilters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:15px 0}
#vc157-studio .vc1626-duel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:13px 0 18px}
#vc157-studio .vc1626-duel>div{display:grid;gap:5px;padding:16px;border:1px solid #d9e6ef;background:#f5f9fc;border-radius:12px}
#vc157-studio .vc1626-duel>div>span{font-size:10px;font-weight:900;letter-spacing:.08em;color:#4f83a5}
#vc157-studio .vc1626-duel strong{font-size:18px;color:#163f60;line-height:1.3}
#vc157-studio .vc1626-duel small{font-size:11px;color:#668198}
#vc157-studio .vc1626-duel button{justify-self:start}
#vc157-studio .vc1626-small{color:#91662e;font-size:10px;font-weight:800}
#vc157-studio .vc1626-profilelink{background:transparent!important;border:0!important;color:#307eae!important;font-size:10px!important;font-weight:800!important;padding:2px 4px!important;margin-left:6px!important;white-space:nowrap}
@media(max-width:1230px){#vc157-studio .vc1626-historygrid{grid-template-columns:1fr}#vc157-studio .vc1626-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){#vc157-studio .vc1626-comparefilters,#vc157-studio .vc1626-duel{grid-template-columns:1fr}#vc157-studio .vc1626-profiletop label{width:100%}}
@media(max-width:510px){#vc157-studio .vc1626-summary{grid-template-columns:1fr}#vc157-studio .vc1626-trendrow{grid-template-columns:1fr 1.5fr 45px;gap:5px}#vc157-studio .vc1626-trendrow small:last-child{display:none}}


/* V16.2.8: full top-down courts, preserve ratio and scroll without shrinking numbers. */
#vc157-studio .vc1628-real-wrap{background:#f7fafc;padding:7px;overflow-x:auto}
#vc157-studio .vc1628-real-court{width:100%;min-width:580px;max-height:none;aspect-ratio:900/480;object-fit:contain}
#vc157-studio .vc1628-setter-court{width:100%;min-width:480px;max-height:none;aspect-ratio:720/440;object-fit:contain}
#vc157-studio .vc1628-real-wrap .vc1622-route-hit:hover{stroke-opacity:.22;stroke:#205f86;cursor:pointer}
#vc157-studio .vc1628-real-wrap .vc1622-route-hit:focus-visible{stroke:#1c6494;stroke-opacity:.5;outline:none}

/* V16.5.0 · Five workspaces and custom worksheet — scoped to Analysis Pro. */
#vc157-studio .vc157-tabs{grid-template-columns:repeat(6,minmax(0,1fr))!important}
#vc157-studio .vc157-tabs button{min-height:49px!important}
#vc157-studio .vc1650-sheet{display:grid;gap:15px}
#vc157-studio .vc1650-eyebrow{display:block;font-size:10px;letter-spacing:.11em;color:#2a76a6;font-weight:850;margin-bottom:6px}
#vc157-studio .vc1650-config{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:15px;border:1px solid #d7e4ed;border-radius:12px;background:#f5f9fc}
#vc157-studio .vc1650-config label,#vc157-studio .vc1650-savebar label{display:grid;gap:6px;font-size:11px;color:#4b6b83;font-weight:800;min-width:0}
#vc157-studio .vc1650-config label{font-size:10px;letter-spacing:.025em;text-transform:uppercase}
#vc157-studio .vc1650-config select:disabled{opacity:.6;cursor:not-allowed}
#vc157-studio .vc1650-columnpanel{border:1px solid #dce7ef;border-radius:12px;padding:12px;background:#fff}
#vc157-studio .vc1650-columnhead{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap}
#vc157-studio .vc1650-columnhead b{font-size:12px;color:#183d58}
#vc157-studio .vc1650-columnhead span{font-size:10px;color:#6c879a}
#vc157-studio .vc1650-checks{display:flex;flex-wrap:wrap;gap:7px}
#vc157-studio .vc1650-check{display:inline-flex;gap:6px;align-items:center;padding:7px 9px;border:1px solid #dbe7f0;border-radius:8px;background:#f7fafc;color:#2b5571;font-size:10px;font-weight:700;cursor:pointer}
#vc157-studio .vc1650-check input{width:15px;height:15px;margin:0;accent-color:#1c689d}
#vc157-studio .vc1650-savebar{display:grid;grid-template-columns:minmax(130px,1fr) minmax(145px,1fr) auto auto auto;gap:8px;align-items:end}
#vc157-studio .vc1650-savebar input{height:42px;width:100%;padding:8px 10px;border:1px solid #cbdbe6;border-radius:10px;color:#193e5d;background:white;font:700 12px system-ui}
#vc157-studio .vc1650-savebar button{min-height:42px!important;background:#edf6fd!important;color:#1c628f!important;border:1px solid #cddfec!important;border-radius:10px!important;padding:8px 11px!important;font-size:11px!important;font-weight:800!important;white-space:nowrap}
#vc157-studio #vc1650-save{background:#1a659a!important;border-color:#1a659a!important;color:#fff!important}
#vc157-studio .vc1650-savebar button:disabled{opacity:.5;cursor:not-allowed}
#vc157-studio .vc1650-summary{display:flex;gap:8px;flex-wrap:wrap}
#vc157-studio .vc1650-summary span{padding:9px 11px;border:1px solid #dce7ef;border-radius:9px;background:#f8fbfd;color:#53718a;font-size:11px}
#vc157-studio .vc1650-summary strong{color:#153f60;font-size:15px;margin-right:4px}
#vc157-studio .vc1650-tablewrap{max-width:100%;overscroll-behavior-x:contain}
#vc157-studio .vc1650-table{border-collapse:separate;border-spacing:0;min-width:620px}
#vc157-studio .vc1650-table th:first-child,#vc157-studio .vc1650-table td:first-child{position:static!important;left:auto!important;z-index:auto!important;box-shadow:none!important}
#vc157-studio .vc1650-table tbody th{font-weight:750;color:#164b73;background:#fff;text-align:left;padding:9px 10px;border-bottom:1px solid #e7eef4;white-space:nowrap}
#vc157-studio .vc1650-num{font-variant-numeric:tabular-nums;white-space:nowrap}
#vc157-studio .vc1650-message{border-top:1px solid #e5edf3;padding-top:8px;color:#587891!important;margin:0!important}
@media(max-width:1200px){#vc157-studio .vc1650-config{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1650-savebar{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1650-savebar button{width:100%}}
@media(max-width:850px){#vc157-studio .vc157-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media(max-width:600px){#vc157-studio .vc157-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}#vc157-studio .vc1650-config,#vc157-studio .vc1650-savebar{grid-template-columns:1fr}}

/* Tactical Laboratory Pro V16.5.1 · shared-filter dashboard */
#vc157-studio .vc1651-workbench{display:grid;gap:14px;min-width:0}
#vc157-studio .vc1651-filterpanel{background:linear-gradient(180deg,#fff,#f6faff);border-color:#bed9eb}
#vc157-studio .vc1651-eyebrow{font-size:10px;letter-spacing:.10em;color:#2674a9;font-weight:850}
#vc157-studio #vc1651-reset{border:1px solid #bcd8e9!important;background:#f2f8fd!important;color:#255f86!important;border-radius:8px!important;padding:8px 13px!important;font-size:11px!important;font-weight:800!important;white-space:nowrap}
#vc157-studio #vc1651-reset:disabled{opacity:.45;cursor:default}
#vc157-studio .vc1651-filtergrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:15px 0 10px}
#vc157-studio .vc1651-filtergrid label{display:grid;gap:4px;min-width:0;font-size:10px;color:#5f7990;font-weight:850}
#vc157-studio .vc1651-filtergrid select{min-width:0;width:100%}
#vc157-studio .vc1651-footnote{color:#50748f;font-size:11px;border-top:1px solid #d9e9f3;padding-top:10px}
#vc157-studio .vc1651-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
#vc157-studio .vc1651-kpi{border:1px solid #d7e5ef;border-radius:11px;background:#fff;padding:12px;min-width:0;display:grid;gap:5px;align-content:start}
#vc157-studio .vc1651-kpi span{font-size:10px;color:#527c98;font-weight:850}
#vc157-studio .vc1651-kpi strong{font-size:22px;color:#16466b;line-height:1.25;font-variant-numeric:tabular-nums}
#vc157-studio .vc1651-kpi small{font-size:10px;color:#7290a4;line-height:1.4}
#vc157-studio .vc1651-kpi button{justify-self:start;margin-top:3px}
#vc157-studio .vc1651-boardgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
#vc157-studio .vc1651-board{min-width:0;overflow:hidden}
#vc157-studio .vc1651-courtwrap{width:100%;overflow-x:auto;margin-top:12px;border-radius:12px;background:#f2f7fb;border:1px solid #dce9f1}
#vc157-studio .vc1651-courtwrap svg{display:block;width:100%;min-width:400px;height:auto}
#vc157-studio .vc1651-more{background:#eaf4fb!important;color:#24638f!important;border:1px solid #cce2f1!important;border-radius:8px!important;padding:7px 10px!important;font-size:10px!important;font-weight:850!important;white-space:nowrap}
#vc157-studio .vc1651-tablegrid{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;min-width:0}
#vc157-studio .vc1651-tablegrid .vc157-panel{min-width:0}
#vc157-studio .vc1651-tablegrid .vc157-table{min-width:600px}
#vc157-studio .vc1651-secondary-title{margin-top:18px!important;padding-top:14px;border-top:1px solid #dce7ef}
@media(max-width:1420px){#vc157-studio .vc1651-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1651-boardgrid,#vc157-studio .vc1651-tablegrid{grid-template-columns:1fr}}
@media(max-width:790px){#vc157-studio .vc1651-filtergrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){#vc157-studio .vc1651-filtergrid,#vc157-studio .vc1651-metrics{grid-template-columns:1fr}#vc157-studio .vc1651-courtwrap svg{min-width:470px}}
`;
/* Scoped visual overrides appended to the existing stylesheet. */
window.VC_ANALYST_STUDIO_16155={version:'16.5.7',mount,open,refresh,onTeamChanged,videoSelection:()=>({matchId:String(currentMatch()?.id||''),page:state.page,subpage:state.subpage[state.page]||'',selected:state.selected.map(r=>({key:String(r.key),video:!!r.video,code:String(r.code||r.skill+r.ev||''),player:String(r.player||''),set:r.set,rally:r.r?.index||''})),title:state.selectedTitle}),setPage:(p)=>{if(pages[p]){state.page=routeTo(p)[0];renderPage()}},diagnostics:()=>({loaded:state.loaded,draws:state.draws,page:state.page,technical:state.technical,selected:state.selected.length,locked:false,performance:{...vc1632Metrics,modelMs:+vc1632Metrics.modelMs.toFixed(1),renderMs:+vc1632Metrics.renderMs.toFixed(1),modelMaxMs:+vc1632Metrics.modelMaxMs.toFixed(1),renderMaxMs:+vc1632Metrics.renderMaxMs.toFixed(1)}})};
})();
