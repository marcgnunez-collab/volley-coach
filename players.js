/* Volley Coach - rendimiento y desarrollo de jugadores */

const PLAYER_POSITIONS=['Colocador','Receptor','Central','Opuesto','Líbero','Universal'];
const PLAYER_SKILLS={
  recepcion:{label:'Recepción',foundation:'Recepción'},
  saque:{label:'Saque',foundation:'Saque'},
  ataque:{label:'Ataque',foundation:'Ataque'},
  bloqueo:{label:'Bloqueo',foundation:'Bloqueo'},
  defensa:{label:'Defensa',foundation:'Defensa'},
  colocacion:{label:'Colocación',foundation:'Colocación'},
  tactica:{label:'Lectura táctica',foundation:null},
  comunicacion:{label:'Comunicación',foundation:null}
};
const POSITION_SKILLS={
  'Colocador':['colocacion','tactica','saque','defensa','bloqueo','comunicacion'],
  'Receptor':['recepcion','ataque','saque','defensa','bloqueo','tactica'],
  'Central':['bloqueo','ataque','saque','defensa','tactica','comunicacion'],
  'Opuesto':['ataque','bloqueo','saque','defensa','tactica','comunicacion'],
  'Líbero':['recepcion','defensa','colocacion','tactica','comunicacion'],
  'Universal':['recepcion','saque','ataque','bloqueo','defensa','colocacion','tactica','comunicacion']
};
const FOUNDATION_TO_SKILL={'Recepción':'recepcion','Saque':'saque','Ataque':'ataque','Bloqueo':'bloqueo','Defensa':'defensa','Colocación':'colocacion'};
let playerProfileId=null,playerEvaluationId=null,playerGoalId=null,exercisePlayersTargetId=null;

function playerById(id){return players.find(p=>String(p.id)===String(id))||null}
function activePlayers(){return players.filter(p=>p.status!=='Baja').sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999)||String(a.name||'').localeCompare(String(b.name||''),'es'))}
function playerInitials(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function playerSkillKeys(player){return POSITION_SKILLS[player?.position]||POSITION_SKILLS.Universal}
function parseISODate(s){if(!s)return null;const d=new Date(String(s)+'T12:00:00');return Number.isNaN(d.getTime())?null:d}
function daysSince(dateStr){const d=parseISODate(dateStr);if(!d)return null;return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))}
function fmtDate(s){const d=parseISODate(s);return d?d.toLocaleDateString('es-ES'):'—'}
function avg(nums){const a=nums.filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function clampScore(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(10,n)):null}
function scoreLabel(n){return Number.isFinite(n)?n.toFixed(1).replace('.0',''):'—'}
function trendLabel(delta){if(!Number.isFinite(delta))return 'Sin comparación';if(delta>=0.35)return `↑ +${delta.toFixed(1)}`;if(delta<=-0.35)return `↓ ${delta.toFixed(1)}`;return '→ Estable'}
function trendClass(delta){if(!Number.isFinite(delta))return 'neutral';if(delta>=0.35)return 'up';if(delta<=-0.35)return 'down';return 'neutral'}

function playerEvaluationsFor(id){return playerEvaluations.filter(e=>String(e.playerId)===String(id)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function playerGoalsFor(id,activeOnly=false){return playerGoals.filter(g=>String(g.playerId)===String(id)&&(!activeOnly||g.status!=='Completado')).sort((a,b)=>String(a.targetDate||'9999').localeCompare(String(b.targetDate||'9999')))}
function evaluationAverage(ev,p){if(!ev)return null;const keys=playerSkillKeys(p);return avg(keys.map(k=>clampScore(ev.metrics?.[k])).filter(Number.isFinite))}
function latestSkillScore(playerId,skill){const evs=playerEvaluationsFor(playerId);for(const ev of evs){const n=clampScore(ev.metrics?.[skill]);if(Number.isFinite(n))return n}return null}

function attendanceRecord(h,playerId){return (h.asistencia||[]).find(a=>String(a.playerId)===String(playerId))||null}
function playerWasInSession(h,playerId){const rec=attendanceRecord(h,playerId);if(rec)return !['Ausente','Lesionado'].includes(rec.status);return Array.isArray(h.playerIds)&&h.playerIds.some(id=>String(id)===String(playerId))}
function exerciseIncludesPlayer(h,e,playerId){if(Array.isArray(e.playerIds))return e.playerIds.some(id=>String(id)===String(playerId));if(Array.isArray(h.playerIds))return h.playerIds.some(id=>String(id)===String(playerId));return false}

function playerWorkload(playerId,days=30){
  const cutoff=Date.now()-days*86400000,byFoundation={},lastWorked={};let minutes=0,sessions=0;
  historial.forEach(h=>{
    const d=parseISODate(h.fecha);if(!d||d.getTime()<cutoff||!playerWasInSession(h,playerId))return;
    let sessionHasWork=false;
    (h.ejercicios||[]).forEach(e=>{
      if(!exerciseIncludesPlayer(h,e,playerId))return;
      const fs=normalizarFundamentos(e).filter(f=>f&&f!=='Control'&&f!=='Juegos');
      const min=Number(e.tiempo)||0;if(!min)return;
      sessionHasWork=true;minutes+=min;
      const share=fs.length?min/fs.length:min;
      fs.forEach(f=>{byFoundation[f]=(byFoundation[f]||0)+share;if(!lastWorked[f]||String(h.fecha)>String(lastWorked[f]))lastWorked[f]=h.fecha});
    });
    if(sessionHasWork)sessions++;
  });
  return {minutes,sessions,byFoundation,lastWorked};
}
function playerAttendance(playerId){
  let total=0,present=0,partial=0;
  historial.forEach(h=>{const rec=attendanceRecord(h,playerId);if(!rec)return;total++;if(rec.status==='Presente')present++;else if(rec.status==='Parcial')partial+=0.5});
  return {total,present,partial,pct:total?Math.round((present+partial)/total*100):null};
}
function goalWorkMinutes(goal){
  const foundation=PLAYER_SKILLS[goal.skill]?.foundation;if(!foundation)return 0;
  const start=parseISODate(goal.startDate)?.getTime()||0;let total=0;
  historial.forEach(h=>{const d=parseISODate(h.fecha);if(!d||d.getTime()<start||!playerWasInSession(h,goal.playerId))return;(h.ejercicios||[]).forEach(e=>{if(!exerciseIncludesPlayer(h,e,goal.playerId))return;const fs=normalizarFundamentos(e);if(fs.includes(foundation))total+=(Number(e.tiempo)||0)/(Math.max(1,fs.filter(f=>f&&f!=='Control'&&f!=='Juegos').length));});});
  return Math.round(total);
}
function goalLastWorked(goal){
  const foundation=PLAYER_SKILLS[goal.skill]?.foundation;if(!foundation)return null;let last=null;
  historial.forEach(h=>{if(!playerWasInSession(h,goal.playerId))return;(h.ejercicios||[]).forEach(e=>{if(exerciseIncludesPlayer(h,e,goal.playerId)&&normalizarFundamentos(e).includes(foundation)&&(!last||String(h.fecha)>String(last)))last=h.fecha});});
  return last;
}
function playerStats(playerId){
  const p=playerById(playerId),evs=playerEvaluationsFor(playerId),latest=evs[0]||null,prev=evs[1]||null;
  const latestAvg=evaluationAverage(latest,p),prevAvg=evaluationAverage(prev,p),delta=Number.isFinite(latestAvg)&&Number.isFinite(prevAvg)?latestAvg-prevAvg:null;
  return {player:p,attendance:playerAttendance(playerId),work30:playerWorkload(playerId,30),latest,prev,latestAvg,prevAvg,delta,goals:playerGoalsFor(playerId,true)};
}
function playerAlerts(playerId){
  const st=playerStats(playerId),alerts=[];
  if(!st.latest)alerts.push({level:'high',text:'Sin evaluación técnica inicial.'});
  else{const age=daysSince(st.latest.date);if(age!==null&&age>35)alerts.push({level:'mid',text:`Evaluación pendiente: última hace ${age} días.`})}
  st.goals.forEach(g=>{const foundation=PLAYER_SKILLS[g.skill]?.foundation;if(!foundation)return;const last=goalLastWorked(g),age=last?daysSince(last):null;if(age===null)alerts.push({level:'high',text:`Objetivo “${PLAYER_SKILLS[g.skill].label}” todavía sin trabajo registrado.`});else if(age>14)alerts.push({level:'mid',text:`${PLAYER_SKILLS[g.skill].label}: ${age} días sin trabajo específico.`})});
  const values=Object.entries(st.work30.byFoundation).filter(([,v])=>v>0);const total=values.reduce((a,[,v])=>a+v,0);if(total>=90){values.forEach(([f,v])=>{const pct=v/total*100;if(pct<8)alerts.push({level:'low',text:`${f} solo representa el ${Math.round(pct)}% del trabajo técnico de los últimos 30 días.`})})}
  return alerts.slice(0,4);
}

function ensureSessionRoster(){
  if(!meta.playerIds||!Array.isArray(meta.playerIds))meta.playerIds=[];
  if(!meta.exercisePlayers||typeof meta.exercisePlayers!=='object')meta.exercisePlayers={};
  if(!meta.rosterInitialized){meta.playerIds=activePlayers().filter(p=>!['Lesionado','Baja'].includes(p.status)).map(p=>p.id);meta.rosterInitialized=true;meta.jugadores=String(meta.playerIds.length);}
  const valid=new Set(players.map(p=>String(p.id)));meta.playerIds=meta.playerIds.filter(id=>valid.has(String(id)));
}
function selectedSessionPlayers(){ensureSessionRoster();return activePlayers().filter(p=>meta.playerIds.some(id=>String(id)===String(p.id)))}
function renderSessionRoster(){
  const box=$('session-player-list'),count=$('session-player-count');if(!box)return;ensureSessionRoster();
  const aps=activePlayers();if(count)count.textContent=`${meta.playerIds.length}/${aps.length}`;
  if($('sesion-jugadores'))$('sesion-jugadores').value=meta.playerIds.length||'';
  if(!aps.length){box.innerHTML='<div class="empty compact-empty">Todavía no hay jugadores en este equipo. Añádelos desde Rendimiento.</div>';return}
  box.innerHTML=aps.map(p=>`<label class="roster-chip ${meta.playerIds.some(id=>String(id)===String(p.id))?'selected':''}"><input type="checkbox" ${meta.playerIds.some(id=>String(id)===String(p.id))?'checked':''} onchange="toggleSessionPlayer('${p.id}',this.checked)"><span class="roster-number">${p.number?esc('#'+p.number):'—'}</span><span>${esc(p.name)}</span><small>${esc(p.position||'Sin posición')}</small></label>`).join('');
}
function toggleSessionPlayer(id,checked){ensureSessionRoster();if(checked){if(!meta.playerIds.some(x=>String(x)===String(id)))meta.playerIds.push(id)}else meta.playerIds=meta.playerIds.filter(x=>String(x)!==String(id));meta.jugadores=String(meta.playerIds.length);save();renderSessionRoster();renderizarSesion()}
function selectAllSessionPlayers(){ensureSessionRoster();meta.playerIds=activePlayers().filter(p=>p.status!=='Lesionado').map(p=>p.id);meta.jugadores=String(meta.playerIds.length);save();renderSessionRoster();renderizarSesion()}
function clearSessionPlayers(){ensureSessionRoster();meta.playerIds=[];meta.jugadores='0';save();renderSessionRoster();renderizarSesion()}
function goPlayers(){showView('jugadores',botonVista('jugadores'))}
function exercisePlayerIds(id){ensureSessionRoster();const specific=meta.exercisePlayers[String(id)];return Array.isArray(specific)?specific:meta.playerIds}
function exercisePlayerSummary(id){const ids=exercisePlayerIds(id),all=meta.playerIds||[];if(!activePlayers().length)return 'Sin plantilla';if(ids.length===all.length&&ids.every(x=>all.some(y=>String(y)===String(x))))return `Todo el grupo · ${ids.length}`;return `${ids.length} jugador${ids.length===1?'':'es'}`}
function openExercisePlayers(id){exercisePlayersTargetId=id;ensureSessionRoster();const current=exercisePlayerIds(id);const box=$('exercise-player-options');box.innerHTML=selectedSessionPlayers().map(p=>`<label class="player-option"><input type="checkbox" value="${esc(p.id)}" ${current.some(x=>String(x)===String(p.id))?'checked':''}><span><b>${p.number?esc('#'+p.number+' '):''}${esc(p.name)}</b><small>${esc(p.position||'')}</small></span></label>`).join('')||'<div class="empty">Selecciona primero los jugadores convocados de la sesión.</div>';$('exercise-players-modal').classList.add('open')}
function closeExercisePlayers(){$('exercise-players-modal')?.classList.remove('open');exercisePlayersTargetId=null}
function saveExercisePlayers(){if(exercisePlayersTargetId==null)return;ensureSessionRoster();const ids=[...document.querySelectorAll('#exercise-player-options input:checked')].map(x=>x.value);const all=meta.playerIds||[];const same=ids.length===all.length&&ids.every(x=>all.some(y=>String(y)===String(x)));if(same)delete meta.exercisePlayers[String(exercisePlayersTargetId)];else meta.exercisePlayers[String(exercisePlayersTargetId)]=ids;save();closeExercisePlayers();renderizarSesion()}

function renderPlayers(){
  if(!$('jugadores'))return;
  if($('players-team-name'))$('players-team-name').textContent=EQUIPOS[equipoActivo].nombre;
  const aps=activePlayers(),stats=aps.map(p=>playerStats(p.id));
  const due=stats.filter(s=>!s.latest||(daysSince(s.latest.date)||0)>35).length;
  const activeGoals=playerGoals.filter(g=>g.status!=='Completado'&&players.some(p=>String(p.id)===String(g.playerId)&&p.status!=='Baja')).length;
  const att=stats.map(s=>s.attendance.pct).filter(Number.isFinite);const avgAtt=att.length?Math.round(avg(att)):null;
  if($('players-count'))$('players-count').textContent=aps.length;
  if($('players-eval-due'))$('players-eval-due').textContent=due;
  if($('players-active-goals'))$('players-active-goals').textContent=activeGoals;
  if($('players-attendance'))$('players-attendance').textContent=avgAtt===null?'—':avgAtt+'%';
  renderTeamPlayerAlerts();filterPlayers();
  renderSessionRoster();
}
function renderTeamPlayerAlerts(){
  const box=$('player-alerts');if(!box)return;const alerts=[];
  activePlayers().forEach(p=>playerAlerts(p.id).forEach(a=>alerts.push({...a,player:p})));
  const rank={high:0,mid:1,low:2};alerts.sort((a,b)=>rank[a.level]-rank[b.level]);
  box.innerHTML=alerts.length?alerts.slice(0,8).map(a=>`<button class="auto-alert ${a.level}" onclick="openPlayerProfile('${a.player.id}')"><span class="alert-player">${a.player.number?'#'+esc(a.player.number)+' · ':''}${esc(a.player.name)}</span><span>${esc(a.text)}</span><span class="alert-arrow">→</span></button>`).join(''):'<div class="good-state">✓ No hay alertas prioritarias con los datos registrados.</div>';
}
function filterPlayers(){
  const box=$('players-list');if(!box)return;const q=String($('players-search')?.value||'').trim().toLowerCase(),pos=$('players-position-filter')?.value||'Todos';
  const list=activePlayers().filter(p=>(pos==='Todos'||p.position===pos)&&(!q||`${p.name} ${p.number||''} ${p.position||''}`.toLowerCase().includes(q)));
  if(!list.length){box.innerHTML='<div class="empty">No hay jugadores que coincidan con el filtro.</div>';return}
  box.innerHTML=list.map(p=>{const st=playerStats(p.id),priority=playerPriority(p.id);return `<article class="player-card"><div class="player-card-main"><div class="player-avatar">${esc(playerInitials(p.name))}</div><div class="player-identity"><div class="player-name-line"><b>${p.number?esc('#'+p.number+' '):''}${esc(p.name)}</b><span class="player-status status-${String(p.status||'Disponible').toLowerCase().replace(/[^a-z]+/g,'-')}">${esc(p.status||'Disponible')}</span></div><div class="small">${esc(p.position||'Sin posición')}${p.secondaryPosition?' · '+esc(p.secondaryPosition):''}${p.birthYear?' · '+esc(p.birthYear):''}</div></div></div><div class="player-kpis"><span><small>Nivel actual</small><b>${scoreLabel(st.latestAvg)}</b></span><span><small>Tendencia</small><b class="trend-${trendClass(st.delta)}">${esc(trendLabel(st.delta))}</b></span><span><small>Asistencia</small><b>${st.attendance.pct===null?'—':st.attendance.pct+'%'}</b></span><span><small>Trabajo 30 d</small><b>${Math.round(st.work30.minutes)} min</b></span></div><div class="player-priority"><small>Prioridad automática</small><b>${esc(priority)}</b></div><div class="player-card-actions"><button class="ghost" onclick="openPlayerProfile('${p.id}')">Ver ficha</button><button class="primary" onclick="openEvaluationModal('${p.id}')">Evaluar</button><button class="ghost" onclick="openGoalModal('${p.id}')">+ Objetivo</button></div></article>`}).join('');
}
function playerPriority(id){const p=playerById(id),goals=playerGoalsFor(id,true);if(goals.length)return PLAYER_SKILLS[goals[0].skill]?.label||goals[0].title||'Objetivo activo';const ev=playerEvaluationsFor(id)[0];if(!ev)return 'Realizar evaluación inicial';const scored=playerSkillKeys(p).map(k=>({k,v:clampScore(ev.metrics?.[k])})).filter(x=>Number.isFinite(x.v)).sort((a,b)=>a.v-b.v);return scored.length?PLAYER_SKILLS[scored[0].k].label:'Completar evaluación'}

function openPlayerModal(id=null){
  const p=id?playerById(id):null;$('player-form-id').value=p?.id||'';$('player-form-title').textContent=p?'Editar jugador':'Nuevo jugador';$('player-name').value=p?.name||'';$('player-number').value=p?.number||'';$('player-position').value=p?.position||'Receptor';$('player-secondary-position').value=p?.secondaryPosition||'';$('player-birth-year').value=p?.birthYear||'';$('player-height').value=p?.height||'';$('player-hand').value=p?.hand||'Diestro';$('player-status').value=p?.status||'Disponible';$('player-notes').value=p?.notes||'';$('player-delete-btn').classList.toggle('hidden',!p);$('player-modal').classList.add('open')
}
function closePlayerModal(){$('player-modal')?.classList.remove('open')}
function savePlayer(){
  const id=$('player-form-id').value,name=$('player-name').value.trim();if(!name){alert('Escribe el nombre del jugador.');return}
  const data={name,number:$('player-number').value.trim(),position:$('player-position').value,secondaryPosition:$('player-secondary-position').value,birthYear:$('player-birth-year').value.trim(),height:$('player-height').value.trim(),hand:$('player-hand').value,status:$('player-status').value,notes:$('player-notes').value.trim(),updatedAt:new Date().toISOString()};
  if(id){const i=players.findIndex(p=>String(p.id)===String(id));if(i>=0)players[i]={...players[i],...data}}else players.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),...data,createdAt:new Date().toISOString()});
  save();closePlayerModal();renderPlayers();renderizarSesion();
}
function deletePlayer(){const id=$('player-form-id').value;if(!id||!confirm('¿Dar de baja a este jugador? Su historial de evaluaciones se conservará.'))return;const p=playerById(id);if(p){p.status='Baja';p.updatedAt=new Date().toISOString()}save();closePlayerModal();renderPlayers();renderizarSesion()}

function openEvaluationModal(id){
  const p=playerById(id);if(!p)return;playerEvaluationId=id;$('evaluation-player-name').textContent=(p.number?'#'+p.number+' · ':'')+p.name;$('evaluation-date').value=new Date().toISOString().slice(0,10);const prev=playerEvaluationsFor(id)[0];const keys=playerSkillKeys(p);$('evaluation-metrics').innerHTML=keys.map(k=>{const old=clampScore(prev?.metrics?.[k]);return `<label class="evaluation-metric"><span><b>${esc(PLAYER_SKILLS[k].label)}</b><small>${old===null?'Sin valoración previa':'Anterior: '+scoreLabel(old)}</small></span><input type="number" min="1" max="10" step="0.5" data-skill="${k}" placeholder="1–10"></label>`}).join('');$('evaluation-notes').value='';$('evaluation-modal').classList.add('open')
}
function closeEvaluationModal(){$('evaluation-modal')?.classList.remove('open');playerEvaluationId=null}
function saveEvaluation(){if(!playerEvaluationId)return;const metrics={};document.querySelectorAll('#evaluation-metrics input[data-skill]').forEach(i=>{const n=clampScore(i.value);if(Number.isFinite(n))metrics[i.dataset.skill]=n});if(!Object.keys(metrics).length){alert('Valora al menos un aspecto.');return}playerEvaluations.push({id:'e'+Date.now().toString(36),playerId:playerEvaluationId,date:$('evaluation-date').value||new Date().toISOString().slice(0,10),metrics,notes:$('evaluation-notes').value.trim(),createdAt:new Date().toISOString()});save();closeEvaluationModal();renderPlayers();if(playerProfileId)renderPlayerProfile(playerProfileId)}

function openGoalModal(id){const p=playerById(id);if(!p)return;playerGoalId=id;$('goal-player-name').textContent=(p.number?'#'+p.number+' · ':'')+p.name;$('goal-skill').innerHTML=playerSkillKeys(p).map(k=>`<option value="${k}">${esc(PLAYER_SKILLS[k].label)}</option>`).join('');$('goal-description').value='';$('goal-target-score').value='';$('goal-start-date').value=new Date().toISOString().slice(0,10);const target=new Date();target.setDate(target.getDate()+42);$('goal-target-date').value=target.toISOString().slice(0,10);$('goal-modal').classList.add('open')}
function closeGoalModal(){$('goal-modal')?.classList.remove('open');playerGoalId=null}
function saveGoal(){if(!playerGoalId)return;const skill=$('goal-skill').value,description=$('goal-description').value.trim();playerGoals.push({id:'g'+Date.now().toString(36),playerId:playerGoalId,skill,description:description||`Mejorar ${PLAYER_SKILLS[skill]?.label||skill}`,targetScore:clampScore($('goal-target-score').value),startDate:$('goal-start-date').value||new Date().toISOString().slice(0,10),targetDate:$('goal-target-date').value,status:'Activo',createdAt:new Date().toISOString()});save();closeGoalModal();renderPlayers();if(playerProfileId)renderPlayerProfile(playerProfileId)}
function completeGoal(id){const g=playerGoals.find(x=>String(x.id)===String(id));if(!g)return;g.status='Completado';g.completedAt=new Date().toISOString();save();renderPlayers();if(playerProfileId)renderPlayerProfile(playerProfileId)}
function deleteGoal(id){if(!confirm('¿Eliminar este objetivo?'))return;playerGoals=playerGoals.filter(g=>String(g.id)!==String(id));save();renderPlayers();if(playerProfileId)renderPlayerProfile(playerProfileId)}

function openPlayerProfile(id){playerProfileId=id;renderPlayerProfile(id);$('player-profile-modal').classList.add('open')}
function closePlayerProfile(){$('player-profile-modal')?.classList.remove('open');playerProfileId=null}
function renderPlayerProfile(id){
  const p=playerById(id),box=$('player-profile-content');if(!p||!box)return;const st=playerStats(id),alerts=playerAlerts(id),evs=playerEvaluationsFor(id),goals=playerGoalsFor(id,false),work=st.work30.byFoundation,maxWork=Math.max(1,...Object.values(work));
  const skillBars=playerSkillKeys(p).map(k=>{const v=st.latest?clampScore(st.latest.metrics?.[k]):null;return `<div class="skill-row"><span>${esc(PLAYER_SKILLS[k].label)}</span><div class="skill-track"><i style="width:${Number.isFinite(v)?v*10:0}%"></i></div><b>${scoreLabel(v)}</b></div>`}).join('');
  const workload=Object.entries(work).sort((a,b)=>b[1]-a[1]).map(([f,v])=>`<div class="skill-row workload-row"><span>${esc(f)}</span><div class="skill-track"><i style="width:${v/maxWork*100}%"></i></div><b>${Math.round(v)}m</b></div>`).join('')||'<div class="empty compact-empty">Aún no hay trabajo individual registrado en los últimos 30 días.</div>';
  const goalHtml=goals.length?goals.map(g=>{const current=latestSkillScore(id,g.skill),workMin=goalWorkMinutes(g),target=Number.isFinite(Number(g.targetScore))?Number(g.targetScore):null;let progress=null;if(target!==null&&Number.isFinite(current)){const first=playerEvaluationsFor(id).slice().reverse().find(ev=>Number.isFinite(clampScore(ev.metrics?.[g.skill])));const startScore=clampScore(first?.metrics?.[g.skill]);if(Number.isFinite(startScore)&&target>startScore)progress=Math.max(0,Math.min(100,(current-startScore)/(target-startScore)*100))}return `<div class="goal-card ${g.status==='Completado'?'completed':''}"><div><b>${esc(PLAYER_SKILLS[g.skill]?.label||g.skill)}</b><p>${esc(g.description||'')}</p><small>${workMin} min de trabajo desde ${fmtDate(g.startDate)}${target!==null?' · objetivo '+scoreLabel(target)+'/10':''}${g.targetDate?' · fecha '+fmtDate(g.targetDate):''}</small>${progress!==null?`<div class="goal-progress"><i style="width:${progress}%"></i></div>`:''}</div><div class="goal-actions">${g.status!=='Completado'?`<button class="success" onclick="completeGoal('${g.id}')">✓</button>`:''}<button class="danger" onclick="deleteGoal('${g.id}')">×</button></div></div>`}).join(''):'<div class="empty compact-empty">Sin objetivos registrados.</div>';
  const evalHtml=evs.length?evs.slice(0,6).map(ev=>`<div class="evaluation-history-row"><span>${fmtDate(ev.date)}</span><b>${scoreLabel(evaluationAverage(ev,p))}/10</b><span>${esc(ev.notes||'')}</span></div>`).join(''):'<div class="empty compact-empty">Todavía no hay evaluaciones.</div>';
  box.innerHTML=`<div class="profile-head"><div class="player-avatar large">${esc(playerInitials(p.name))}</div><div><div class="profile-name">${p.number?esc('#'+p.number+' '):''}${esc(p.name)}</div><div class="small">${esc(p.position||'Sin posición')}${p.secondaryPosition?' · '+esc(p.secondaryPosition):''} · ${esc(p.status||'Disponible')}</div></div><div class="profile-head-actions"><button class="ghost" onclick="openPlayerModal('${p.id}')">Editar</button><button class="primary" onclick="openEvaluationModal('${p.id}')">Nueva evaluación</button><button class="ghost" onclick="openGoalModal('${p.id}')">+ Objetivo</button></div></div><div class="profile-kpis"><div><small>Nivel actual</small><b>${scoreLabel(st.latestAvg)}</b></div><div><small>Tendencia</small><b class="trend-${trendClass(st.delta)}">${esc(trendLabel(st.delta))}</b></div><div><small>Asistencia</small><b>${st.attendance.pct===null?'—':st.attendance.pct+'%'}</b></div><div><small>Sesiones 30 d</small><b>${st.work30.sessions}</b></div><div><small>Minutos 30 d</small><b>${Math.round(st.work30.minutes)}</b></div></div>${alerts.length?`<div class="profile-alerts">${alerts.map(a=>`<div class="profile-alert ${a.level}">${esc(a.text)}</div>`).join('')}</div>`:''}<div class="profile-grid"><section><h3>Perfil técnico</h3>${skillBars}<h3>Trabajo real · 30 días</h3>${workload}</section><section><div class="profile-section-head"><h3>Objetivos</h3><button class="ghost" onclick="openGoalModal('${p.id}')">+ Añadir</button></div>${goalHtml}<h3>Evaluaciones recientes</h3>${evalHtml}</section></div>${p.notes?`<div class="muted-box"><b>Notas del entrenador</b><div style="margin-top:5px">${esc(p.notes)}</div></div>`:''}`;
}

function openTrainingClose(){
  ensureSessionRoster();const ids=meta.playerIds||[],box=$('training-close-players');
  box.innerHTML=ids.length?ids.map(id=>{const p=playerById(id);if(!p)return '';return `<div class="close-player-row" data-player-id="${esc(p.id)}"><div><b>${p.number?esc('#'+p.number+' '):''}${esc(p.name)}</b><small>${esc(p.position||'')}</small></div><select class="close-attendance"><option>Presente</option><option>Parcial</option><option>Ausente</option><option>Lesionado</option></select><select class="close-checkin"><option value="Normal">Normal</option><option value="Destacado">Destacado</option><option value="A revisar">A revisar</option></select><input class="close-note" placeholder="Nota rápida (opcional)"></div>`}).join(''):'<div class="empty">No hay jugadores convocados. El entrenamiento se guardará sin seguimiento individual.</div>';
  $('training-close-modal').classList.add('open')
}
function closeTrainingClose(){$('training-close-modal')?.classList.remove('open')}
function trainingCloseData(){return [...document.querySelectorAll('#training-close-players .close-player-row')].map(row=>({playerId:row.dataset.playerId,status:row.querySelector('.close-attendance').value,checkin:row.querySelector('.close-checkin').value,note:row.querySelector('.close-note').value.trim()}))}

function reconcilePlayerState(){
  players=Array.isArray(players)?players:[];playerEvaluations=Array.isArray(playerEvaluations)?playerEvaluations:[];playerGoals=Array.isArray(playerGoals)?playerGoals:[];
  ensureSessionRoster();
}
