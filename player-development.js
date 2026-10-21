/* ===== JUGADORES PRO V2 ===== */
const PLAYER_EVAL_SCHEMA={
  'Colocador':{
    'Colocación':['Precisión','Altura y tempo','Orientación corporal'],
    'Toma de decisiones':['Lectura del bloqueo','Distribución','Gestión fuera de sistema'],
    'Defensa':['Posicionamiento','Control del primer contacto','Transición'],
    'Bloqueo':['Lectura','Desplazamiento','Cierre'],
    'Saque':['Control','Riesgo','Regularidad']
  },
  'Receptor':{
    'Recepción':['Posicionamiento inicial','Plataforma','Dirección del pase'],
    'Ataque':['Carrera y batida','Contacto','Decisión'],
    'Defensa':['Lectura','Desplazamiento','Control'],
    'Saque':['Control','Agresividad','Regularidad'],
    'Bloqueo':['Lectura','Desplazamiento','Cierre']
  },
  'Central':{
    'Bloqueo':['Lectura','Desplazamiento lateral','Penetración y cierre'],
    'Ataque':['Tempo','Batida','Dirección'],
    'Saque':['Control','Riesgo','Regularidad'],
    'Desplazamiento':['Velocidad','Frenada','Transición'],
    'Lectura táctica':['Colocador rival','Prioridades','Adaptación']
  },
  'Opuesto':{
    'Ataque':['Balón alto','Dirección','Resolución bajo presión'],
    'Bloqueo':['Lectura','Desplazamiento','Cierre'],
    'Saque':['Control','Agresividad','Regularidad'],
    'Defensa':['Posicionamiento','Lectura','Control'],
    'Transición':['Salida de red','Carrera','Disponibilidad ofensiva']
  },
  'Líbero':{
    'Recepción':['Posicionamiento','Plataforma','Dirección del pase'],
    'Defensa':['Lectura','Desplazamiento','Control'],
    'Cobertura':['Posicionamiento','Reacción','Continuidad'],
    'Colocación de emergencia':['Precisión','Decisión','Control'],
    'Comunicación':['Información','Liderazgo','Coordinación']
  },
  'Universal':{
    'Recepción':['Posicionamiento','Plataforma','Dirección'],
    'Saque':['Control','Riesgo','Regularidad'],
    'Ataque':['Carrera','Contacto','Decisión'],
    'Bloqueo':['Lectura','Desplazamiento','Cierre'],
    'Defensa':['Lectura','Desplazamiento','Control'],
    'Colocación':['Precisión','Decisión','Control']
  }
};
const PLAYER_OBS_TAGS=['Buen entrenamiento','Mejora técnica','Fatiga','Molestia','Concentración','Buena comunicación','Competitivo','A revisar'];

const PLAYER_POSITION_OPTIONS=['Colocador','Receptor','Central','Opuesto','Líbero','Universal'];
function ppPositions(p){
  const arr=[p?.position,...(Array.isArray(p?.positions)?p.positions:[]),p?.position2].filter(Boolean);
  return [...new Set(arr.map(String))];
}
function ppPositionText(p,sep=' · '){return ppPositions(p).join(sep)||'Sin posición'}
function ppPositionTags(p){return ppPositions(p).map((x,i)=>`<span class="pp-position-tag ${i===0?'primary':''}">${ppSafe(x)}</span>`).join('')}
function ppExtraPositionsFromForm(){const primary=$('player-position')?.value||'';return [...document.querySelectorAll('input[name="player-extra-position"]:checked')].map(x=>x.value).filter(x=>x&&x!==primary)}
function ppSyncPositionChoices(selected){
  const primary=$('player-position')?.value||'';
  const chosen=Array.isArray(selected)?new Set(selected):null;
  document.querySelectorAll('input[name="player-extra-position"]').forEach(cb=>{
    cb.disabled=cb.value===primary;
    if(cb.disabled)cb.checked=false;
    else if(chosen)cb.checked=chosen.has(cb.value);
  });
}
function ppSchema(p){return PLAYER_EVAL_SCHEMA[p?.position]||PLAYER_EVAL_SCHEMA.Universal}
function ppPlayer(id){return jugadoresEquipo.find(p=>Number(p.id)===Number(id))}
function ppSafe(v){return esc(String(v??''))}
function ppInitials(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function ppAge(y){y=Number(y);return y?new Date().getFullYear()-y:null}
function ppStatusClass(s){return s==='Disponible'?'available':s==='Recuperación'?'recovery':s==='Lesionado'?'injured':''}
function ppDays(iso){if(!iso)return Infinity;return Math.max(0,Math.floor((new Date()-new Date(iso+'T12:00:00'))/86400000))}
function ppEvaluations(p){return [...(p?.evaluations||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function ppLatest(p){return ppEvaluations(p)[0]||null}
function ppPrev(p){return ppEvaluations(p)[1]||null}
function ppAverage(vals){vals=(vals||[]).map(Number).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function ppCategoryScore(ev,cat){
  if(!ev)return null;
  if(ev.categoryScores&&Number.isFinite(Number(ev.categoryScores[cat])))return Number(ev.categoryScores[cat]);
  const sub=ev.metrics?.[cat];
  if(sub&&typeof sub==='object')return ppAverage(Object.values(sub));
  if(Number.isFinite(Number(sub)))return Number(sub);
  return null;
}
function ppOverall(ev){
  if(!ev)return null;
  const cats=Object.keys(ev.categoryScores||{});
  if(cats.length)return ppAverage(cats.map(c=>ev.categoryScores[c]));
  const vals=[];
  Object.entries(ev.metrics||{}).forEach(([k,v])=>{if(v&&typeof v==='object')vals.push(ppAverage(Object.values(v)));else if(Number.isFinite(Number(v)))vals.push(Number(v))});
  return ppAverage(vals.filter(Number.isFinite));
}
function ppTrend(p){
  const a=ppOverall(ppLatest(p)),b=ppOverall(ppPrev(p));
  if(a==null||b==null)return {key:'flat',symbol:'—',text:'Sin tendencia',delta:null};
  const d=a-b;if(d>.2)return {key:'up',symbol:'↑',text:`+${d.toFixed(1)}`,delta:d};if(d<-.2)return {key:'down',symbol:'↓',text:d.toFixed(1),delta:d};return {key:'flat',symbol:'→',text:'Estable',delta:d};
}
function ppActiveGoal(p){return (p?.goals||[]).find(g=>g.status!=='done')||null}
function ppCurrentAreaScore(p,area){return ppCategoryScore(ppLatest(p),area)}
function ppGoalProgress(p,g){
  if(g.status==='done')return 100;
  const start=Number(g.start),target=Number(g.target),current=ppCurrentAreaScore(p,g.area);
  if(!Number.isFinite(start)||!Number.isFinite(target)||target===start||!Number.isFinite(current))return Number(g.progress)||0;
  return Math.max(0,Math.min(100,((current-start)/(target-start))*100));
}
function ppSessionsForPlayer(p){return (historial||[]).filter(h=>Array.isArray(h.playerIds)&&h.playerIds.map(Number).includes(Number(p.id)))}
function ppWorkload(p,days=30){
  const cutoff=days?new Date(Date.now()-days*86400000):null,c={};let total=0,sessions=0;
  ppSessionsForPlayer(p).forEach(h=>{
    const d=h.fecha?new Date(h.fecha+'T12:00:00'):null;if(cutoff&&d&&d<cutoff)return;sessions++;
    (h.ejercicios||[]).forEach(e=>{const fs=normalizarFundamentos(e),m=Number(e.tiempo)||0;if(!fs.length)return;fs.forEach(f=>c[f]=(c[f]||0)+m/fs.length);total+=m});
  });
  return {byFoundation:c,total,sessions};
}
function ppInsights(p){
  const out=[],last=ppLatest(p),prev=ppPrev(p),score=ppOverall(last),trend=ppTrend(p),load=ppWorkload(p,30),goal=ppActiveGoal(p);
  if(!last)out.push({type:'warn',text:'Falta la evaluación inicial. Sin ella no se puede medir evolución.'});
  else if(ppDays(last.date)>30)out.push({type:'warn',text:`Última evaluación hace ${ppDays(last.date)} días. Conviene actualizarla.`});
  if(prev&&trend.key==='up')out.push({type:'good',text:`Evolución positiva: +${trend.delta.toFixed(1)} puntos respecto a la evaluación anterior.`});
  if(prev&&trend.key==='down')out.push({type:'warn',text:`Descenso de ${Math.abs(trend.delta).toFixed(1)} puntos. Revisa contexto, carga y observaciones antes de interpretarlo.`});
  if(goal){const gp=ppGoalProgress(p,goal);out.push({type:gp>=75?'good':'',text:`Objetivo prioritario "${goal.title}" al ${Math.round(gp)}% del recorrido estimado.`})}
  if(load.sessions===0)out.push({type:'',text:'Sin sesiones individuales registradas en los últimos 30 días.'});
  else{
    const entries=Object.entries(load.byFoundation).sort((a,b)=>a[1]-b[1]);if(entries.length&&load.total>0){const [f,m]=entries[0];if(m/load.total<.1)out.push({type:'warn',text:`${f} representa solo el ${Math.round(m/load.total*100)}% de su trabajo registrado en 30 días.`})}
  }
  return out.slice(0,4);
}
function ppSave(){
  if(!equiposData)equiposData={};
  if(!equiposData[equipoActivo])equiposData[equipoActivo]=estadoEquipoVacio(equipoActivo);
  equiposData[equipoActivo].jugadores=clonar(jugadoresEquipo);
  guardarEstadoLocalSinCloud();programarSubidaCloud();
  const ind=$('save-indicator');if(ind)ind.textContent='✓ Jugadores guardados y sincronizables';
}
function showPlayersView(btn){showView('jugadores',btn)}
function renderPlayers(){
  const body=$('pp-table-body');if(!body)return;
  const q=String($('pp-search')?.value||'').trim().toLowerCase(),pos=$('pp-position-filter')?.value||'',status=$('pp-status-filter')?.value||'';
  const all=jugadoresEquipo||[],list=all.filter(p=>(!q||String(p.name||'').toLowerCase().includes(q)||String(p.number||'').includes(q))&&(!pos||ppPositions(p).includes(pos))&&(!status||p.status===status));
  const pending=all.filter(p=>!ppLatest(p)||ppDays(ppLatest(p).date)>30).length,recent=all.filter(p=>ppLatest(p)&&ppDays(ppLatest(p).date)<=30).length,goals=all.reduce((n,p)=>n+(p.goals||[]).filter(g=>g.status!=='done').length,0);
  if($('pp-kpi-total'))$('pp-kpi-total').textContent=all.length;if($('pp-kpi-available'))$('pp-kpi-available').textContent=all.filter(p=>p.status==='Disponible').length;if($('pp-kpi-pending'))$('pp-kpi-pending').textContent=pending;if($('pp-kpi-goals'))$('pp-kpi-goals').textContent=goals;if($('pp-kpi-recent'))$('pp-kpi-recent').textContent=recent;
  body.innerHTML=list.map(p=>{
    const score=ppOverall(ppLatest(p)),trend=ppTrend(p),goal=ppActiveGoal(p),load=ppWorkload(p,30);
    return `<tr>
      <td><div class="pp-identity"><div class="pp-avatar">${ppSafe(ppInitials(p.name))}</div><div><div class="pp-name">${p.number!==''&&p.number!=null?`#${ppSafe(p.number)} · `:''}${ppSafe(p.name)}</div><div class="pp-sub">${p.birth?`${ppAge(p.birth)} años`:''}${p.height?`${p.birth?' · ':''}${ppSafe(p.height)} cm`:''}</div></div></div></td>
      <td><div class="pp-position-tags">${ppPositionTags(p)}</div></td>
      <td><span class="pp-status ${ppStatusClass(p.status)}">${ppSafe(p.status||'Disponible')}</span></td>
      <td>${score==null?'<span class="small">Sin evaluar</span>':`<div class="pp-score"><b>${score.toFixed(1)}</b><div class="pp-score-track"><span style="width:${score*10}%"></span></div></div>`}</td>
      <td><span class="pp-trend ${trend.key}">${trend.symbol} ${trend.text}</span></td>
      <td><div class="pp-name">${Math.round(load.total)} min</div><div class="pp-sub">${load.sessions} sesiones</div></td>
      <td>${goal?`<div class="pp-name">${ppSafe(goal.title)}</div><div class="pp-sub">${Math.round(ppGoalProgress(p,goal))}% · ${ppSafe(goal.area)}</div>`:'<span class="small">Sin objetivo</span>'}</td>
      <td><div class="pp-actions"><button class="ghost" onclick="abrirPerfilJugador(${p.id})">Ficha</button><button class="ghost" onclick="abrirEvaluacionJugador(${p.id})">Evaluar</button></div></td>
    </tr>`;
  }).join('');
  $('pp-empty')?.classList.toggle('hidden',list.length>0);
}
function abrirNuevoJugador(){
  $('player-id').value='';$('player-form-title').textContent='Nuevo jugador';['player-name','player-number','player-birth','player-height','player-notes'].forEach(id=>$(id).value='');$('player-position').value='Receptor';ppSyncPositionChoices([]);$('player-hand').value='Diestro';$('player-status').value='Disponible';$('player-start').value=fechaLocalISO();$('player-form-modal').classList.add('open');
}
function editarJugador(id){
  const p=ppPlayer(id);if(!p)return;$('player-id').value=p.id;$('player-form-title').textContent='Editar jugador';$('player-name').value=p.name||'';$('player-number').value=p.number??'';$('player-position').value=p.position||ppPositions(p)[0]||'Receptor';ppSyncPositionChoices(ppPositions(p).filter(x=>x!==$('player-position').value));$('player-birth').value=p.birth||'';$('player-height').value=p.height||'';$('player-hand').value=p.hand||'Diestro';$('player-status').value=p.status||'Disponible';$('player-start').value=p.startDate||'';$('player-notes').value=p.notes||'';cerrarPlayerModal('player-profile-modal');$('player-form-modal').classList.add('open');
}
function guardarJugador(){
  const name=String($('player-name').value||'').trim();if(!name){alert('Escribe el nombre del jugador.');return}
  const id=Number($('player-id').value)||Date.now(),old=ppPlayer(id),primary=$('player-position').value,extras=ppExtraPositionsFromForm(),positions=[primary,...extras],p={...(old||{}),id,name,number:$('player-number').value,position:primary,positions,position2:extras[0]||'',birth:$('player-birth').value,height:$('player-height').value,hand:$('player-hand').value,status:$('player-status').value,startDate:$('player-start').value,notes:String($('player-notes').value||'').trim(),evaluations:old?.evaluations||[],goals:old?.goals||[],observations:old?.observations||[],createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  const i=jugadoresEquipo.findIndex(x=>Number(x.id)===Number(id));if(i>=0)jugadoresEquipo[i]=p;else jugadoresEquipo.push(p);ppSave();cerrarPlayerModal('player-form-modal');renderPlayers();renderDashboardPlayers();renderSessionRoster();
}
function eliminarJugador(id){
  const p=ppPlayer(id);if(!p)return;
  if(!confirm(`¿Quieres eliminar a ${p.name}?\n\nTambién se borrarán sus evaluaciones, objetivos y observaciones.`))return;
  const confirmacion=prompt(`Para confirmar el borrado definitivo, escribe el nombre del jugador:\n${p.name}`);
  if(String(confirmacion||'').trim().toLowerCase()!==String(p.name||'').trim().toLowerCase()){
    if(confirmacion!==null)alert('El nombre no coincide. No se ha eliminado ningún dato.');
    return;
  }
  jugadoresEquipo=jugadoresEquipo.filter(x=>Number(x.id)!==Number(id));
  meta.playerIds=(meta.playerIds||[]).filter(x=>Number(x)!==Number(id));
  ppSave();cerrarPlayerModal('player-profile-modal');renderPlayers();renderDashboardPlayers();renderSessionRoster();
}
function cerrarPlayerModal(id){$(id)?.classList.remove('open')}

function abrirEvaluacionJugador(id){
  const p=ppPlayer(id);if(!p)return;$('player-eval-id').value=p.id;$('player-eval-title').textContent=`Evaluar · ${p.name}`;$('player-eval-date').value=fechaLocalISO();$('player-eval-note').value='';
  const prev=ppLatest(p),schema=ppSchema(p);
  $('player-eval-categories').innerHTML=Object.entries(schema).map(([cat,subs])=>`<div class="eval-category" data-cat="${ppSafe(cat)}"><div class="eval-category-head"><strong>${ppSafe(cat)}</strong><span class="eval-category-score" id="eval-cat-${ppCss(cat)}">—</span></div><div class="eval-subgrid">${subs.map(sub=>{let v=prev?.metrics?.[cat]?.[sub];if(!Number.isFinite(Number(v)))v=5;return `<div class="eval-submetric"><label><span>${ppSafe(sub)}</span><b id="eval-val-${ppCss(cat)}-${ppCss(sub)}">${Number(v).toFixed(1)}</b></label><input type="range" min="1" max="10" step=".5" value="${Number(v)}" data-cat="${ppSafe(cat)}" data-sub="${ppSafe(sub)}" oninput="ppUpdateEval(this)"></div>`}).join('')}</div></div>`).join('');
  document.querySelectorAll('#player-eval-categories input[type=range]').forEach(ppUpdateEval);
  cerrarPlayerModal('player-profile-modal');$('player-eval-modal').classList.add('open');
}
function ppCss(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'-')}
function ppUpdateEval(input){
  const v=$(`eval-val-${ppCss(input.dataset.cat)}-${ppCss(input.dataset.sub)}`);if(v)v.textContent=Number(input.value).toFixed(1);
  const vals=[...document.querySelectorAll(`#player-eval-categories input[data-cat="${CSS.escape(input.dataset.cat)}"]`)].map(x=>Number(x.value));const e=$('eval-cat-'+ppCss(input.dataset.cat));if(e)e.textContent=ppAverage(vals).toFixed(1);
}
function guardarEvaluacionJugador(){
  const p=ppPlayer(Number($('player-eval-id').value));if(!p)return;const metrics={},categoryScores={};
  document.querySelectorAll('#player-eval-categories input[type=range]').forEach(x=>{if(!metrics[x.dataset.cat])metrics[x.dataset.cat]={};metrics[x.dataset.cat][x.dataset.sub]=Number(x.value)});
  Object.keys(metrics).forEach(cat=>categoryScores[cat]=ppAverage(Object.values(metrics[cat])));
  if(!p.evaluations)p.evaluations=[];p.evaluations.push({id:Date.now(),date:$('player-eval-date').value||fechaLocalISO(),metrics,categoryScores,note:String($('player-eval-note').value||'').trim(),createdAt:new Date().toISOString()});
  ppSave();cerrarPlayerModal('player-eval-modal');renderPlayers();renderDashboardPlayers();abrirPerfilJugador(p.id);
}

function abrirObjetivoJugador(id){
  const p=ppPlayer(id);if(!p)return;$('player-goal-player-id').value=p.id;$('player-goal-title').value='';const areas=Object.keys(ppSchema(p));$('player-goal-area').innerHTML=areas.map(a=>`<option>${ppSafe(a)}</option>`).join('');const first=areas[0],cur=ppCurrentAreaScore(p,first);$('player-goal-start').value=Number.isFinite(cur)?cur.toFixed(1):'';$('player-goal-target').value=Number.isFinite(cur)?Math.min(10,cur+1).toFixed(1):'';$('player-goal-deadline').value='';$('player-goal-note').value='';cerrarPlayerModal('player-profile-modal');$('player-goal-modal').classList.add('open');
}
function ppGoalAreaChanged(){const p=ppPlayer(Number($('player-goal-player-id').value));if(!p)return;const cur=ppCurrentAreaScore(p,$('player-goal-area').value);if(Number.isFinite(cur)){$('player-goal-start').value=cur.toFixed(1);$('player-goal-target').value=Math.min(10,cur+1).toFixed(1)}}
function guardarObjetivoJugador(){
  const p=ppPlayer(Number($('player-goal-player-id').value)),title=String($('player-goal-title').value||'').trim();if(!p||!title){alert('Escribe el objetivo.');return}
  const start=Number($('player-goal-start').value),target=Number($('player-goal-target').value);if(!Number.isFinite(start)||!Number.isFinite(target)){alert('Indica nivel inicial y nivel objetivo.');return}
  if(!p.goals)p.goals=[];p.goals.push({id:Date.now(),title,area:$('player-goal-area').value,start,target,deadline:$('player-goal-deadline').value,note:String($('player-goal-note').value||'').trim(),status:'active',createdAt:new Date().toISOString()});ppSave();cerrarPlayerModal('player-goal-modal');renderPlayers();renderDashboardPlayers();abrirPerfilJugador(p.id);
}
function ppToggleGoal(pid,gid){const p=ppPlayer(pid),g=p?.goals?.find(x=>Number(x.id)===Number(gid));if(!g)return;g.status=g.status==='done'?'active':'done';ppSave();abrirPerfilJugador(pid);renderPlayers();renderDashboardPlayers()}
function ppDeleteGoal(pid,gid){const p=ppPlayer(pid);if(!p)return;p.goals=(p.goals||[]).filter(g=>Number(g.id)!==Number(gid));ppSave();abrirPerfilJugador(pid);renderPlayers();renderDashboardPlayers()}
function ppAddObservation(pid,tag){
  const p=ppPlayer(pid);if(!p)return;if(!p.observations)p.observations=[];p.observations.unshift({id:Date.now(),date:fechaLocalISO(),tag,note:'',createdAt:new Date().toISOString()});ppSave();abrirPerfilJugador(pid);renderDashboardPlayers();
}
function ppDeleteObservation(pid,oid){const p=ppPlayer(pid);if(!p)return;p.observations=(p.observations||[]).filter(o=>Number(o.id)!==Number(oid));ppSave();abrirPerfilJugador(pid)}

function ppSwitchProfileTab(pid,tab,btn){
  document.querySelectorAll('#player-profile-content .pp-tab').forEach(x=>x.classList.remove('active'));$(`pp-tab-${tab}`)?.classList.add('active');document.querySelectorAll('#player-profile-content .pp-profile-nav button').forEach(x=>x.classList.remove('active'));btn?.classList.add('active');if(tab==='development')ppRenderChart(pid);
}
function ppMetricRows(p,ev){return Object.keys(ppSchema(p)).map(cat=>{const v=ppCategoryScore(ev,cat);return `<div class="pp-metric-row"><span>${ppSafe(cat)}</span><div class="pp-metric-track"><i style="width:${Number.isFinite(v)?v*10:0}%"></i></div><b>${Number.isFinite(v)?v.toFixed(1):'—'}</b></div>`}).join('')}
function ppWorkloadHtml(p){
  const w=ppWorkload(p,30),entries=Object.entries(w.byFoundation).sort((a,b)=>b[1]-a[1]);if(!entries.length)return '<div class="small">Todavía no hay sesiones con participación individual registrada.</div>';
  return `<div class="pp-workload-grid">${entries.map(([f,m])=>`<div class="pp-load-card"><span>${ppSafe(f)}</span><b>${Math.round(m)} min</b></div>`).join('')}</div><div class="small" style="margin-top:8px">${w.sessions} sesiones · ${Math.round(w.total)} min registrados en los últimos 30 días.</div>`;
}
function abrirPerfilJugador(id){
  const p=ppPlayer(id),box=$('player-profile-content');if(!p||!box)return;const evs=ppEvaluations(p),last=evs[0],score=ppOverall(last),trend=ppTrend(p),goals=p.goals||[],obs=(p.observations||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))),ins=ppInsights(p),load=ppWorkload(p,30);
  const goalHtml=goals.length?goals.map(g=>{const prog=ppGoalProgress(p,g),cur=ppCurrentAreaScore(p,g.area);return `<div class="pp-goal ${g.status==='done'?'done':''}"><div class="pp-goal-head"><div><div class="pp-goal-title">${ppSafe(g.title)}</div><div class="pp-goal-meta">${ppSafe(g.area)} · ${Number(g.start).toFixed(1)} → ${Number(g.target).toFixed(1)}${Number.isFinite(cur)?` · actual ${cur.toFixed(1)}`:''}${g.deadline?` · ${ppSafe(g.deadline)}`:''}</div></div><div class="pp-goal-actions"><button class="ghost" onclick="verEjerciciosObjetivo('${String(g.area).replace(/'/g,"\\'")}')">Ver ejercicios</button><button class="ghost" onclick="ppToggleGoal(${p.id},${g.id})">${g.status==='done'?'Reabrir':'Completar'}</button><button class="ghost" onclick="ppDeleteGoal(${p.id},${g.id})">×</button></div></div><div class="pp-goal-progress"><span style="width:${prog}%"></span></div><div class="pp-goal-meta">${Math.round(prog)}% del recorrido estimado${g.note?` · ${ppSafe(g.note)}`:''}</div></div>`}).join(''):'<div class="small">Sin objetivos definidos.</div>';
  const histHtml=evs.length?evs.map(e=>`<div class="pp-history-item"><strong>${ppSafe(e.date||'')}</strong><div><small>${ppSafe(e.note||'Sin observación global')}</small></div><b>${ppOverall(e)?.toFixed(1)||'—'}</b></div>`).join(''):'<div class="small">Sin evaluaciones todavía.</div>';
  const obsHtml=obs.length?obs.slice(0,20).map(o=>`<div class="pp-observation"><div><b>${ppSafe(o.tag)}</b><div><small>${ppSafe(o.date)}</small></div></div><button class="ghost" style="padding:3px 5px!important;font-size:8px!important" onclick="ppDeleteObservation(${p.id},${o.id})">×</button></div>`).join(''):'<div class="small">Sin observaciones rápidas.</div>';
  const areas=Object.keys(ppSchema(p));
  box.innerHTML=`<div class="player-modal-head"><div><span class="pro-kicker">PLAYER PROFILE</span><h2>Ficha de desarrollo</h2></div><button class="player-modal-close" onclick="cerrarPlayerModal('player-profile-modal')">×</button></div>
  <div class="pp-profile-top"><div class="pp-profile-avatar">${ppSafe(ppInitials(p.name))}</div><div class="pp-profile-name"><h2>${p.number!==''&&p.number!=null?`#${ppSafe(p.number)} · `:''}${ppSafe(p.name)}</h2><p>${ppPositions(p).map(ppSafe).join(' · ')}${p.height?` · ${ppSafe(p.height)} cm`:''}${p.birth?` · ${ppAge(p.birth)} años`:''} · ${ppSafe(p.status||'Disponible')}</p></div><div class="pp-profile-actions"><button class="ghost" onclick="editarJugador(${p.id})">Editar</button><button class="primary" onclick="abrirEvaluacionJugador(${p.id})">Nueva evaluación</button><button class="ghost" onclick="abrirObjetivoJugador(${p.id})">+ Objetivo</button><button class="ghost" onclick="exportarInformeJugador(${p.id})">PDF</button></div></div>
  <div class="pp-profile-nav"><button class="active" onclick="ppSwitchProfileTab(${p.id},'summary',this)">Resumen</button><button onclick="ppSwitchProfileTab(${p.id},'development',this)">Desarrollo</button><button onclick="ppSwitchProfileTab(${p.id},'goals',this)">Objetivos</button><button onclick="ppSwitchProfileTab(${p.id},'history',this)">Historial</button></div>
  <div id="pp-tab-summary" class="pp-tab active"><div class="pp-grid">
    <div class="pp-card wide"><div class="pp-summary-kpis"><div class="pp-mini-kpi"><span>Nivel técnico</span><b>${score==null?'—':score.toFixed(1)}</b></div><div class="pp-mini-kpi"><span>Tendencia</span><b class="pp-trend ${trend.key}">${trend.symbol} ${trend.delta==null?'—':Math.abs(trend.delta).toFixed(1)}</b></div><div class="pp-mini-kpi"><span>30 días</span><b>${Math.round(load.total)}m</b></div><div class="pp-mini-kpi"><span>Objetivos</span><b>${goals.filter(g=>g.status!=='done').length}</b></div></div></div>
    <div class="pp-card"><h3>Perfil técnico actual</h3>${last?ppMetricRows(p,last):'<div class="small">Haz una primera evaluación para crear el perfil.</div>'}</div>
    <div class="pp-card"><h3>Lectura automática</h3>${ins.map(x=>`<div class="pp-insight ${x.type}">${ppSafe(x.text)}</div>`).join('')||'<div class="small">Sin alertas.</div>'}</div>
    <div class="pp-card wide"><h3>Carga individual · 30 días</h3>${ppWorkloadHtml(p)}</div>
    <div class="pp-card"><h3>Observación rápida</h3><div class="pp-observation-tags">${PLAYER_OBS_TAGS.map(t=>`<button class="ghost" onclick="ppAddObservation(${p.id},'${t.replace(/'/g,"\\'")}')">${ppSafe(t)}</button>`).join('')}</div></div>
    <div class="pp-card"><h3>Últimas observaciones</h3><div class="pp-observation-list">${obsHtml}</div></div>
  </div></div>
  <div id="pp-tab-development" class="pp-tab"><div class="pp-grid"><div class="pp-card wide"><h3>Evolución</h3><div class="pp-chart-controls"><select id="pp-chart-area" onchange="ppRenderChart(${p.id})">${['General',...areas].map(a=>`<option>${ppSafe(a)}</option>`).join('')}</select><select id="pp-chart-period" onchange="ppRenderChart(${p.id})"><option value="30">30 días</option><option value="90" selected>90 días</option><option value="0">Temporada</option></select></div><div id="pp-chart-box" class="pp-chart-box"></div></div><div class="pp-card"><h3>Perfil actual</h3>${last?ppMetricRows(p,last):'<div class="small">Sin datos.</div>'}</div><div class="pp-card"><h3>Carga reciente</h3>${ppWorkloadHtml(p)}</div></div></div>
  <div id="pp-tab-goals" class="pp-tab"><div class="pp-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h3 style="margin:0!important">Objetivos individuales</h3><button class="primary" onclick="abrirObjetivoJugador(${p.id})">+ Nuevo objetivo</button></div><div style="margin-top:10px">${goalHtml}</div></div></div>
  <div id="pp-tab-history" class="pp-tab"><div class="pp-grid"><div class="pp-card"><h3>Evaluaciones</h3><div class="pp-history">${histHtml}</div></div><div class="pp-card"><h3>Observaciones</h3><div class="pp-observation-list">${obsHtml}</div></div><div class="pp-card wide"><h3>Notas del jugador</h3><div class="small" style="white-space:pre-wrap">${ppSafe(p.notes||'Sin notas generales.')}</div></div></div></div>
  <div class="player-form-actions"><button class="danger" onclick="eliminarJugador(${p.id})">Eliminar jugador</button><button class="ghost" onclick="cerrarPlayerModal('player-profile-modal')">Cerrar</button></div>`;
  $('player-profile-modal').classList.add('open');
}
function ppRenderChart(pid){
  const p=ppPlayer(pid),box=$('pp-chart-box');if(!p||!box)return;const area=$('pp-chart-area')?.value||'General',days=Number($('pp-chart-period')?.value||90),cutoff=days?new Date(Date.now()-days*86400000):null;
  const pts=ppEvaluations(p).slice().reverse().filter(e=>{if(!cutoff)return true;const d=new Date((e.date||'')+'T12:00:00');return d>=cutoff}).map(e=>({date:e.date,value:area==='General'?ppOverall(e):ppCategoryScore(e,area)})).filter(x=>Number.isFinite(x.value));
  if(pts.length<2){box.innerHTML='<div class="pp-chart-empty">Se necesitan al menos dos evaluaciones en este periodo para dibujar la evolución.</div>';return}
  const W=760,H=210,padL=38,padR=18,padT=16,padB=32,iw=W-padL-padR,ih=H-padT-padB,min=1,max=10;
  const xy=pts.map((p,i)=>({x:padL+(pts.length===1?iw/2:i*iw/(pts.length-1)),y:padT+(max-p.value)/(max-min)*ih,...p}));
  const lines=[2,4,6,8,10].map(v=>{const y=padT+(max-v)/(max-min)*ih;return `<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#e5e9ec" stroke-width="1"/><text x="${padL-8}" y="${y+3}" text-anchor="end" font-size="9" fill="#85919b">${v}</text>`}).join('');
  const path=xy.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
  const dots=xy.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#e49a3a"/><text x="${p.x}" y="${p.y-8}" text-anchor="middle" font-size="9" font-weight="700" fill="#17324d">${p.value.toFixed(1)}</text><text x="${p.x}" y="${H-10}" text-anchor="middle" font-size="8" fill="#84909a">${ppSafe(String(p.date||'').slice(5))}</text>`).join('');
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución ${ppSafe(area)}">${lines}<path d="${path}" fill="none" stroke="#315f84" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}</svg>`;
}
function verEjerciciosObjetivo(area){
  cerrarPlayerModal('player-profile-modal');const btn=botonVista('ejercicios');abrirBibliotecaNormal(btn);
  document.querySelectorAll('input[name="filtro-fundamento"]').forEach(x=>x.checked=false);
  const target=[...document.querySelectorAll('input[name="filtro-fundamento"]')].find(x=>x.value===area);if(target){target.checked=true;filtrarEjercicios();const lab=$('fundamento-filtro-label');if(lab)lab.textContent=area}
}
function exportarInformeJugador(pid){
  const p=ppPlayer(pid);if(!p)return;const jsPDF=window.jspdf?.jsPDF;if(!jsPDF){alert('No se ha cargado jsPDF.');return}const doc=new jsPDF(),last=ppLatest(p),trend=ppTrend(p),load=ppWorkload(p,30);let y=20;
  const line=(t,size=10,bold=false)=>{doc.setFontSize(size);doc.setFont('helvetica',bold?'bold':'normal');const parts=doc.splitTextToSize(String(t),175);doc.text(parts,18,y);y+=parts.length*(size*.45+2);if(y>275){doc.addPage();y=20}};
  line('VOLLEY COACH · INFORME DE DESARROLLO',15,true);line(`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`,13,true);line(`${ppPositionText(p,' / ')} · ${p.status||'Disponible'}`,10);y+=3;line('Resumen',11,true);line(`Nivel técnico: ${ppOverall(last)?.toFixed(1)||'—'} · Tendencia: ${trend.text} · Carga 30 días: ${Math.round(load.total)} min`,10);y+=2;line('Perfil técnico',11,true);Object.keys(ppSchema(p)).forEach(cat=>line(`${cat}: ${ppCategoryScore(last,cat)?.toFixed(1)||'—'}`,10));y+=2;line('Objetivos activos',11,true);const gs=(p.goals||[]).filter(g=>g.status!=='done');if(!gs.length)line('Sin objetivos activos.',10);else gs.forEach(g=>line(`• ${g.title} · ${g.area} · ${Math.round(ppGoalProgress(p,g))}%`,10));y+=2;line('Observaciones recientes',11,true);(p.observations||[]).slice(0,8).forEach(o=>line(`• ${o.date}: ${o.tag}`,10));if(!(p.observations||[]).length)line('Sin observaciones.',10);doc.save(`Jugador_${String(p.name).replace(/[^\wáéíóúñü]+/gi,'_')}.pdf`);
}
function exportarInformeEquipoJugadores(){
  const jsPDF=window.jspdf?.jsPDF;if(!jsPDF){alert('No se ha cargado jsPDF.');return}const doc=new jsPDF(),team=EQUIPOS[equipoActivo].nombre;doc.setFontSize(16);doc.text(`Volley Coach · ${team}`,18,20);doc.setFontSize(10);doc.text(`Plantilla · ${jugadoresEquipo.length} jugadores`,18,28);let y=38;
  jugadoresEquipo.forEach(p=>{if(y>275){doc.addPage();y=20}const sc=ppOverall(ppLatest(p)),tr=ppTrend(p),g=ppActiveGoal(p);doc.setFont('helvetica','bold');doc.text(`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`,18,y);doc.setFont('helvetica','normal');doc.text(`${ppPositionText(p,' / ')} · ${p.status||'Disponible'} · nivel ${sc?.toFixed(1)||'—'} · ${tr.symbol} ${tr.text}${g?' · '+g.title:''}`,18,y+6);y+=15});doc.save(`Plantilla_${team.replace(/[^\w]+/g,'_')}.pdf`);
}

function rosterSeleccionados(){return [...document.querySelectorAll('#session-roster-grid input[type=checkbox]:checked')].map(x=>Number(x.value))}
function renderSessionRoster(){
  const grid=$('session-roster-grid'),sum=$('session-roster-summary');if(!grid||!sum)return;const selected=new Set((meta.playerIds||[]).map(Number)),available=jugadoresEquipo.filter(p=>p.status!=='Baja');
  if(!available.length){grid.innerHTML='<div class="session-roster-empty">Añade jugadores en la pestaña Jugadores para registrar participación individual.</div>';sum.textContent='Plantilla de la sesión · sin plantilla';return}
  grid.innerHTML=available.map(p=>`<label class="session-roster-item"><input type="checkbox" value="${p.id}" ${selected.has(Number(p.id))?'checked':''} onchange="guardarRosterSesion()"><span>${p.number!==''&&p.number!=null?`#${ppSafe(p.number)} · `:''}${ppSafe(p.name)} <small>· ${ppSafe(ppPositionText(p,' / '))}</small></span></label>`).join('');
  const n=available.filter(p=>selected.has(Number(p.id))).length;sum.textContent=`Plantilla de la sesión · ${n}/${available.length} seleccionados`;
}
function seleccionarRosterSesion(all){const ids=all?jugadoresEquipo.filter(p=>p.status==='Disponible'||p.status==='Recuperación').map(p=>p.id):[];meta.playerIds=ids;meta.jugadores=ids.length?String(ids.length):meta.jugadores;const inp=$('sesion-jugadores');if(inp&&ids.length)inp.value=ids.length;save();renderSessionRoster()}
function guardarRosterSesion(){meta.playerIds=rosterSeleccionados();if(meta.playerIds.length){meta.jugadores=String(meta.playerIds.length);const inp=$('sesion-jugadores');if(inp)inp.value=meta.playerIds.length}save();renderSessionRoster()}

function renderDashboardPlayers(){
  const state=$('dash-player-state'),alerts=$('dash-player-alerts');if(!state||!alerts)return;const all=jugadoresEquipo||[],available=all.filter(p=>p.status==='Disponible').length,recovery=all.filter(p=>p.status==='Recuperación').length,inj=all.filter(p=>p.status==='Lesionado').length,pending=all.filter(p=>!ppLatest(p)||ppDays(ppLatest(p).date)>30);
  state.innerHTML=all.length?`<div class="dashboard-team-state"><div><span>Plantilla</span><b>${all.length}</b></div><div><span>Disponibles</span><b>${available}</b></div><div><span>Recuperación</span><b>${recovery}</b></div><div><span>Lesionados</span><b>${inj}</b></div></div>`:'<div class="dashboard-empty">Añade jugadores para activar el seguimiento individual.</div>';
  const att=[];pending.slice(0,3).forEach(p=>att.push({p,text:ppLatest(p)?`Evaluación hace ${ppDays(ppLatest(p).date)} días`:'Sin evaluación inicial'}));all.forEach(p=>{const g=ppActiveGoal(p);if(g&&ppGoalProgress(p,g)<35)att.push({p,text:`Objetivo ${g.area} · ${Math.round(ppGoalProgress(p,g))}%`})});
  alerts.innerHTML=att.length?att.slice(0,5).map(x=>`<div class="dashboard-player-alert"><b>${ppSafe(x.p.name)}</b><span>${ppSafe(x.text)}</span></div>`).join(''):'<div class="dashboard-empty">Sin seguimientos urgentes.</div>';
}
