(function(){
  function vcNumOrderValue(v){
    if(v===null || v===undefined || String(v).trim()==='') return Number.POSITIVE_INFINITY;
    const n=Number(v);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }
  function vcPlayerNumberCompare(a,b){
    const an=vcNumOrderValue(a?.number), bn=vcNumOrderValue(b?.number);
    if(an!==bn) return an-bn;
    const aHas=Number.isFinite(an), bHas=Number.isFinite(bn);
    if(aHas!==bHas) return aHas ? -1 : 1;
    return String(a?.name||'').localeCompare(String(b?.name||''),'es',{sensitivity:'base',numeric:true});
  }
  function vcSortPlayersByNumber(list){
    return (Array.isArray(list)?list:[]).slice().sort(vcPlayerNumberCompare);
  }
  function vcSortActivePlayersInPlace(){
    if(Array.isArray(jugadoresEquipo)) jugadoresEquipo.sort(vcPlayerNumberCompare);
    if(equiposData?.[equipoActivo] && Array.isArray(equiposData[equipoActivo].jugadores)){
      equiposData[equipoActivo].jugadores.sort(vcPlayerNumberCompare);
    }
  }
  function vcSnapshotNumberCompare(a,b){
    return vcPlayerNumberCompare(
      {number:a?.number,name:a?.name},
      {number:b?.number,name:b?.name}
    );
  }
  function vcSortSnapshot(list){
    return (Array.isArray(list)?list:[]).slice().sort(vcSnapshotNumberCompare);
  }

  window.vcSortPlayersByNumber=vcSortPlayersByNumber;
  window.vcPlayerNumberCompare=vcPlayerNumberCompare;

  /* Mantiene la plantilla activa ordenada cada vez que se carga o guarda. */
  vcSortActivePlayersInPlace();

  if(typeof cargarEquipoEnVariables==='function'){
    const prevLoadTeam=cargarEquipoEnVariables;
    cargarEquipoEnVariables=function(id){
      const result=prevLoadTeam(id);
      vcSortActivePlayersInPlace();
      return result;
    };
  }
  if(typeof ppSave==='function'){
    const prevPpSave=ppSave;
    ppSave=function(){
      vcSortActivePlayersInPlace();
      return prevPpSave();
    };
  }
  if(typeof renderPlayers==='function'){
    const prevRenderPlayers=renderPlayers;
    renderPlayers=function(){
      vcSortActivePlayersInPlace();
      return prevRenderPlayers();
    };
  }
  if(typeof renderSessionRoster==='function'){
    const prevRenderSessionRoster=renderSessionRoster;
    renderSessionRoster=function(){
      vcSortActivePlayersInPlace();
      return prevRenderSessionRoster();
    };
  }
  if(typeof abrirRosterEjercicio==='function'){
    const prevAbrirRosterEjercicio=abrirRosterEjercicio;
    abrirRosterEjercicio=function(id){
      vcSortActivePlayersInPlace();
      return prevAbrirRosterEjercicio(id);
    };
  }
  if(typeof exportarInformeEquipoJugadores==='function'){
    const prevInformePlantilla=exportarInformeEquipoJugadores;
    exportarInformeEquipoJugadores=function(){
      vcSortActivePlayersInPlace();
      return prevInformePlantilla();
    };
  }

  /* Cualquier acceso de solo lectura a la plantilla devuelve dorsal ascendente. */
  if(typeof vcTeamPlayers==='function'){
    const prevTeamPlayers=vcTeamPlayers;
    vcTeamPlayers=function(teamId){
      return vcSortPlayersByNumber(prevTeamPlayers(teamId));
    };
  }

  /* Los snapshots nuevos también se guardan ya ordenados. */
  if(typeof vcParticipantSnapshot==='function'){
    const prevParticipantSnapshot=vcParticipantSnapshot;
    vcParticipantSnapshot=function(ids,teamId=equipoActivo){
      return vcSortSnapshot(prevParticipantSnapshot(ids,teamId));
    };
  }
  if(typeof vcMatchParticipantSnapshot==='function'){
    const prevMatchSnapshot=vcMatchParticipantSnapshot;
    vcMatchParticipantSnapshot=function(ids,teamId=equipoActivo){
      return vcSortSnapshot(prevMatchSnapshot(ids,teamId));
    };
  }

  /* Entrenamientos e históricos: orden nominal por dorsal incluso si usan snapshots antiguos. */
  if(typeof vcSessionParticipantLabels==='function'){
    vcSessionParticipantLabels=function(h,teamId=equipoActivo){
      if(Array.isArray(h?.participantSnapshot) && h.participantSnapshot.length){
        return vcSortSnapshot(h.participantSnapshot).map(vcSnapshotLabel);
      }
      const ids=Array.isArray(h?.playerIds)?h.playerIds.map(Number):[];
      const idSet=new Set(ids);
      const players=vcSortPlayersByNumber(vcTeamPlayers(teamId).filter(p=>idSet.has(Number(p.id))));
      const foundIds=new Set(players.map(p=>Number(p.id)));
      const labels=players.map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`);
      ids.filter(id=>!foundIds.has(Number(id))).sort((a,b)=>a-b).forEach(id=>labels.push(`Jugador ${id}`));
      return labels;
    };
  }
  if(typeof vcExerciseParticipantLabels==='function'){
    vcExerciseParticipantLabels=function(e,h={},teamId=equipoActivo){
      if(Array.isArray(e?.participantSnapshot) && e.participantSnapshot.length){
        return vcSortSnapshot(e.participantSnapshot).map(vcSnapshotLabel);
      }
      const ids=typeof vcExerciseParticipantIds==='function'
        ? vcExerciseParticipantIds(e,h)
        : (Array.isArray(e?.playerIds)?e.playerIds:(Array.isArray(h?.playerIds)?h.playerIds:[]));
      const idSet=new Set((ids||[]).map(Number));
      const players=vcSortPlayersByNumber(vcTeamPlayers(teamId).filter(p=>idSet.has(Number(p.id))));
      const foundIds=new Set(players.map(p=>Number(p.id)));
      const labels=players.map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`);
      (ids||[]).map(Number).filter(id=>!foundIds.has(id)).sort((a,b)=>a-b).forEach(id=>labels.push(`Jugador ${id}`));
      return labels;
    };
  }

  /* Convocatorias / resultados / PDF de partido. */
  if(typeof vcMatchRosterForPDF==='function'){
    const prevMatchRosterForPDF=vcMatchRosterForPDF;
    vcMatchRosterForPDF=function(m,teamId=equipoActivo){
      return (prevMatchRosterForPDF(m,teamId)||[]).slice().sort(vcPlayerNumberCompare);
    };
  }

  if(typeof matchRosterOptions==='function'){
    matchRosterOptions=function(selected=[],rosterStatus=[]){
      const box=$('match-roster-list'); if(!box)return;
      const selectedSet=new Set((selected||[]).map(Number));
      const state=new Map((Array.isArray(rosterStatus)?rosterStatus:[]).map(r=>[Number(r.id),r]));
      box.innerHTML=vcSortPlayersByNumber(jugadoresEquipo||[]).map(p=>{
        const old=state.get(Number(p.id));
        const status=old?.status||(selectedSet.has(Number(p.id))?'Convocado':'No convocado');
        const reason=old?.reason||'';
        const pos=ppPositions(p).join(' · ')||'Sin posición';
        return `<div class="match-roster-pro-row" data-player-id="${p.id}">
          <div class="match-roster-pro-player"><b>${p.number!==''&&p.number!=null?`#${esc(p.number)} · `:''}${esc(p.name)}</b><small>${esc(pos)}</small></div>
          <select class="match-player-status" onchange="vcMatchRosterStatusChange(this)">
            <option ${status==='Convocado'?'selected':''}>Convocado</option>
            <option ${status==='No disponible'?'selected':''}>No disponible</option>
            <option ${status==='No convocado'?'selected':''}>No convocado</option>
          </select>
          <input class="match-roster-reason ${status==='No disponible'?'':'hidden'}" value="${esc(reason)}" placeholder="Motivo de la ausencia">
        </div>`;
      }).join('')||'<div class="match-empty">Primero añade jugadores a este equipo.</div>';
    };
  }

  /* Nombres de ejercicios y chips individuales respetan el mismo orden. */
  if(typeof exerciseRosterNames==='function'){
    exerciseRosterNames=function(ids){
      const set=new Set((ids||[]).map(Number));
      return vcSortPlayersByNumber((jugadoresEquipo||[]).filter(p=>set.has(Number(p.id))))
        .map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`);
    };
  }

  /* Ordena cualquier snapshot histórico ya cargado en memoria sin cambiar sus dorsales. */
  try{
    ['infantil','cadete'].forEach(team=>{
      const data=equiposData?.[team];
      if(!data)return;
      if(Array.isArray(data.jugadores)) data.jugadores.sort(vcPlayerNumberCompare);
      (data.historial||[]).forEach(h=>{
        if(Array.isArray(h.participantSnapshot)) h.participantSnapshot=vcSortSnapshot(h.participantSnapshot);
        (h.ejercicios||[]).forEach(e=>{if(Array.isArray(e?.participantSnapshot))e.participantSnapshot=vcSortSnapshot(e.participantSnapshot)});
      });
      (data.planificacion||[]).forEach(h=>{
        if(Array.isArray(h.participantSnapshot)) h.participantSnapshot=vcSortSnapshot(h.participantSnapshot);
        (h.ejercicios||[]).forEach(e=>{if(Array.isArray(e?.participantSnapshot))e.participantSnapshot=vcSortSnapshot(e.participantSnapshot)});
      });
      (data.partidos||[]).forEach(m=>{
        if(Array.isArray(m.participantSnapshot))m.participantSnapshot=vcSortSnapshot(m.participantSnapshot);
        if(Array.isArray(m.rosterStatus))m.rosterStatus.sort(vcPlayerNumberCompare);
        if(Array.isArray(m.playerEvaluations))m.playerEvaluations.sort(vcPlayerNumberCompare);
      });
    });
  }catch(err){console.warn('No se pudo ordenar algún histórico por dorsal',err)}

  /* Refresca las vistas visibles con el nuevo criterio. */
  try{
    renderPlayers();
    renderSessionRoster();
    renderCompetition();
  }catch(_){}
})();
