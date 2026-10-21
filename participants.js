/* ===== V5.11.1 · PARTICIPANTES VISIBLES EN PLANIFICACIÓN / HISTORIAL / PDF ===== */
function vcTeamIdFromName(name){
  const s=String(name||'').toLowerCase();
  if(s.includes('cadete'))return 'cadete';
  if(s.includes('infantil'))return 'infantil';
  return equipoActivo;
}
function vcTeamPlayers(teamId){
  if(teamId===equipoActivo)return Array.isArray(jugadoresEquipo)?jugadoresEquipo:[];
  return Array.isArray(equiposData?.[teamId]?.jugadores)?equiposData[teamId].jugadores:[];
}
function vcParticipantSnapshot(ids,teamId=equipoActivo){
  const set=new Set((ids||[]).map(Number)),players=vcTeamPlayers(teamId);
  return players.filter(p=>set.has(Number(p.id))).map(p=>({id:Number(p.id),name:String(p.name||''),number:p.number??'',positions:typeof ppPositions==='function'?ppPositions(p):[p.position,p.secondaryPosition].filter(Boolean)}));
}
function vcSnapshotLabel(p){return `${p?.number!==''&&p?.number!=null?'#'+p.number+' · ':''}${String(p?.name||'Jugador')}`}
function vcSessionParticipantIds(h){return Array.isArray(h?.playerIds)?h.playerIds.map(Number):[]}
function vcSessionParticipantLabels(h,teamId=equipoActivo){
  if(Array.isArray(h?.participantSnapshot)&&h.participantSnapshot.length)return h.participantSnapshot.map(vcSnapshotLabel);
  const ids=vcSessionParticipantIds(h),set=new Set(ids),players=vcTeamPlayers(teamId),found=players.filter(p=>set.has(Number(p.id))).map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`),foundIds=new Set(players.filter(p=>set.has(Number(p.id))).map(p=>Number(p.id)));
  ids.filter(id=>!foundIds.has(Number(id))).forEach(id=>found.push(`Jugador ${id}`));
  return found;
}
function vcExerciseParticipantIds(e,h){
  if(Array.isArray(e?.playerIds))return e.playerIds.map(Number);
  return vcSessionParticipantIds(h);
}
function vcExerciseParticipantLabels(e,h={},teamId=equipoActivo){
  if(Array.isArray(e?.participantSnapshot)&&e.participantSnapshot.length)return e.participantSnapshot.map(vcSnapshotLabel);
  const ids=vcExerciseParticipantIds(e,h),set=new Set(ids),players=vcTeamPlayers(teamId),foundPlayers=players.filter(p=>set.has(Number(p.id))),labels=foundPlayers.map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`),foundIds=new Set(foundPlayers.map(p=>Number(p.id)));
  ids.filter(id=>!foundIds.has(Number(id))).forEach(id=>labels.push(`Jugador ${id}`));
  return labels;
}
function vcParticipantChips(labels,empty='No registrado'){
  return labels.length?`<div class="vc-participant-chips">${labels.map(n=>`<span class="vc-participant-chip">${esc(n)}</span>`).join('')}</div>`:`<div class="small">${esc(empty)}</div>`;
}

/* Al guardar, cada ejercicio conserva SIEMPRE la asignación resuelta y una copia de nombres. */
const _snapshotEjercicioV5111=snapshotEjercicioCompleto;
snapshotEjercicioCompleto=function(e){
  if(!e)return _snapshotEjercicioV5111(e);
  let source=e;
  if(!Array.isArray(e.playerIds)){
    const ids=(typeof exerciseAssignedIds==='function')?exerciseAssignedIds(e.id):(meta.playerIds||[]).map(Number);
    source={...e,playerIds:clonar(ids)};
  }
  const snap=_snapshotEjercicioV5111(source);if(!snap)return snap;
  const ids=Array.isArray(snap.playerIds)?snap.playerIds.map(Number):[];
  snap.playerIds=ids;
  snap.participantSnapshot=Array.isArray(e.participantSnapshot)&&e.participantSnapshot.length?clonar(e.participantSnapshot):vcParticipantSnapshot(ids,equipoActivo);
  return snap;
};

/* Si una planificación antigua solo tenía la plantilla general, la hereda al pasar a historial. */
const _ejerciciosHistorialV5111=ejerciciosHistorialDesdePlan;
ejerciciosHistorialDesdePlan=function(p){
  const teamId=vcTeamIdFromName(p?.equipo),sessionIds=Array.isArray(p?.playerIds)?p.playerIds.map(Number):[];
  const copy={...p,ejercicios:(p?.ejercicios||[]).map(e=>{
    if(Array.isArray(e.playerIds))return e;
    return {...e,playerIds:clonar(sessionIds),participantSnapshot:vcParticipantSnapshot(sessionIds,teamId)};
  })};
  return _ejerciciosHistorialV5111(copy);
};

/* Modal profesional para ver participantes desde Planificación. */
function vcOpenPlanParticipants(id){
  const p=planificacion.find(x=>Number(x.id)===Number(id));if(!p)return;
  const teamId=vcTeamIdFromName(p.equipo),sessionLabels=vcSessionParticipantLabels(p,teamId),items=(p.ejercicios||[]);
  $('vc-plan-participants-title').textContent=p.objetivo||'Jugadores por ejercicio';
  $('vc-plan-participants-subtitle').textContent=`${p.fecha||'Sin fecha'} · ${p.equipo||EQUIPOS[teamId]?.nombre||'Equipo'} · ${items.length} ejercicio${items.length===1?'':'s'}`;
  const roster=`<div class="vc-roster-summary"><b>Plantilla de la sesión · ${sessionLabels.length||Number(p.jugadores)||0} jugador${(sessionLabels.length||Number(p.jugadores)||0)===1?'':'es'}</b>${vcParticipantChips(sessionLabels,'No se registró una plantilla nominal en esta sesión.')}</div>`;
  const exercises=items.length?items.map((e,i)=>{const labels=vcExerciseParticipantLabels(e,p,teamId),explicit=Array.isArray(e.playerIds);return `<div class="vc-plan-exercise-roster"><div class="vc-plan-exercise-roster-head"><strong>${i+1}. ${esc(e.nombre||'Ejercicio')}</strong><span>${Number(e.tiempo)||0} min · ${labels.length} jugador${labels.length===1?'':'es'}${explicit?'':' · plantilla general'}</span></div>${vcParticipantChips(labels,explicit?'Sin jugadores asignados':'No registrado')}</div>`}).join(''):'<div class="empty">Esta planificación todavía no tiene ejercicios guardados.</div>';
  $('vc-plan-participants-content').innerHTML=roster+exercises;
  $('vc-plan-participants-modal').classList.add('open');
}
function vcClosePlanParticipants(){$('vc-plan-participants-modal')?.classList.remove('open')}

const _tarjetaPlanProV5111=tarjetaPlanProHTML;
tarjetaPlanProHTML=function(p,hoy){
  let h=_tarjetaPlanProV5111(p,hoy),count=Array.isArray(p.playerIds)?p.playerIds.length:(Number(p.jugadores)||0);
  h=h.replace(/(<div class="plan-pro-meta">)(.*?)(<\/div>)/,(_,a,b,c)=>`${a}${b}${count?` <span class="vc-plan-player-count">· ${count} jug.</span>`:''}${c}`);
  h=h.replace('<button class="danger" onclick="eliminarPlan',`<button class="ghost vc-plan-roster-btn" onclick="event.stopPropagation();vcOpenPlanParticipants(${p.id})">👥 Jugadores</button><button class="danger" onclick="eliminarPlan`);
  return h;
};

/* Historial: muestra participantes por ejercicio sin depender del equipo actualmente seleccionado. */
const _entrenamientoEstructuradoV5111=entrenamientoEstructuradoHTML;
entrenamientoEstructuradoHTML=function(h,accionesPorEjercicio=null){
  const teamId=vcTeamIdFromName(h?.equipo),sessionIds=Array.isArray(h?.playerIds)?h.playerIds.map(Number):[];
  const copy={...h,ejercicios:(h?.ejercicios||[]).map(e=>({...e,__vcTeamId:teamId,__vcSessionPlayerIds:sessionIds}))};
  return _entrenamientoEstructuradoV5111(copy,accionesPorEjercicio);
};
const _fichaEjercicioV5111=fichaEjercicioHTML;
fichaEjercicioHTML=function(origen,numero,acciones=''){
  let h=_fichaEjercicioV5111(origen,numero,acciones);
  h=h.replace(/<div class="session-exercise-detail wide history-player-assignment">[\s\S]*?<\/div>/,'');
  const hasContext=Array.isArray(origen?.playerIds)||Array.isArray(origen?.__vcSessionPlayerIds)||Array.isArray(origen?.participantSnapshot);
  if(!hasContext)return h;
  const session={playerIds:Array.isArray(origen?.__vcSessionPlayerIds)?origen.__vcSessionPlayerIds:[]},teamId=origen?.__vcTeamId||equipoActivo,labels=vcExerciseParticipantLabels(origen,session,teamId),empty=Array.isArray(origen?.playerIds)?'Sin jugadores asignados':'No registrado';
  const extra=`<div class="exercise-explain-section wide vc-participant-section"><div class="exercise-explain-label">Jugadores del ejercicio · ${labels.length}</div><details><summary>Ver jugadores</summary>${vcParticipantChips(labels,empty)}</details></div>`;
  const pos=h.lastIndexOf('</div></div>');if(pos>=0)h=h.slice(0,pos)+extra+h.slice(pos);
  return h;
};

/* Añade snapshot nominal de la plantilla general a nuevas planificaciones e historiales. */
const _construirPlanSesionV5111=construirPlanSesion;
construirPlanSesion=function(id){const p=_construirPlanSesionV5111(id);p.participantSnapshot=vcParticipantSnapshot(p.playerIds||[],equipoActivo);return p};

renderPlanificacion();renderHistorial();
