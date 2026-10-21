(function(){
  const ATTENDANCE_STATUSES=['Sin registrar','Presente','Parcial','Ausencia justificada','Ausencia','Lesionado'];
  const PRESENT_STATUSES=new Set(['Presente','Parcial']);
  const intensityFactor=v=>({Baja:1,Media:2,Alta:3}[String(v||'Media')]||2);
  const uniqNums=list=>[...new Set((Array.isArray(list)?list:[]).map(Number).filter(Number.isFinite))];
  const safeArray=v=>Array.isArray(v)?v:[];
  const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};

  /* ---------- ASISTENCIA DE ENTRENAMIENTO ---------- */
  function vcPlayerSnapshotById(id){
    const p=(jugadoresEquipo||[]).find(x=>Number(x.id)===Number(id));
    return {id:Number(id)||0,name:String(p?.name||''),number:p?.number??'',positions:p&&typeof ppPositions==='function'?ppPositions(p):[]};
  }
  function vcNormalizeAttendance(raw,fallbackIds=[]){
    const list=safeArray(raw).filter(Boolean).map(r=>({
      id:Number(r.id)||0,
      status:ATTENDANCE_STATUSES.includes(r.status)?r.status:'Sin registrar',
      name:String(r.name||''),number:r.number??'',positions:safeArray(r.positions)
    })).filter(r=>r.id);
    const byId=new Map(list.map(r=>[r.id,r]));
    uniqNums(fallbackIds).forEach(id=>{
      if(!byId.has(id)){const s=vcPlayerSnapshotById(id);byId.set(id,{...s,status:'Presente'});}
    });
    return [...byId.values()];
  }
  function vcCurrentAttendanceMap(){
    const arr=vcNormalizeAttendance(meta?.attendanceStatus,meta?.playerIds||[]);
    return new Map(arr.map(r=>[Number(r.id),r]));
  }
  function vcAttendanceClass(status){return status==='Presente'?'status-present':status==='Parcial'?'status-partial':(status==='Ausencia'||status==='Ausencia justificada')?'status-absent':status==='Lesionado'?'status-injured':''}
  function vcAttendanceOptions(status){return ATTENDANCE_STATUSES.map(s=>`<option value="${esc(s)}" ${s===status?'selected':''}>${esc(s)}</option>`).join('')}
  function vcReadAttendanceUI(){
    return [...document.querySelectorAll('#session-roster-grid .vc-attendance-row')].map(row=>{
      const id=Number(row.dataset.playerId),p=(jugadoresEquipo||[]).find(x=>Number(x.id)===id),status=row.querySelector('select')?.value||'Sin registrar';
      return {id,status,name:String(p?.name||''),number:p?.number??'',positions:p&&typeof ppPositions==='function'?ppPositions(p):[]};
    });
  }
  function vcApplyAttendance(arr,doSave=true){
    meta.attendanceStatus=vcNormalizeAttendance(arr,[]);
    meta.playerIds=meta.attendanceStatus.filter(r=>PRESENT_STATUSES.has(r.status)).map(r=>Number(r.id));
    meta.jugadores=String(meta.playerIds.length||'');
    const input=$('sesion-jugadores');if(input)input.value=meta.playerIds.length||'';
    if(doSave)save();
  }
  window.rosterSeleccionados=function(){
    const rows=[...document.querySelectorAll('#session-roster-grid .vc-attendance-row')];
    if(rows.length)return rows.filter(row=>PRESENT_STATUSES.has(row.querySelector('select')?.value||'')).map(row=>Number(row.dataset.playerId));
    return uniqNums(meta?.playerIds||[]);
  };
  window.renderSessionRoster=function(){
    const grid=$('session-roster-grid'),sum=$('session-roster-summary');if(!grid||!sum)return;
    const players=(jugadoresEquipo||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    if(!players.length){grid.innerHTML='<div class="session-roster-empty">Añade jugadores en la pestaña Jugadores para registrar asistencia y carga individual.</div>';sum.textContent='Asistencia · sin plantilla';return}
    const map=vcCurrentAttendanceMap();
    grid.innerHTML=players.map(p=>{
      let status=map.get(Number(p.id))?.status||'Sin registrar';
      const pos=typeof ppPositions==='function'?ppPositions(p).join(' · '):'';
      return `<div class="vc-attendance-row" data-player-id="${p.id}"><div class="vc-attendance-player"><b>${p.number!==''&&p.number!=null?`#${esc(p.number)} · `:''}${esc(p.name||'Jugador')}</b><small>${esc(pos||p.status||'Jugador')}</small></div><select class="vc-attendance-select ${vcAttendanceClass(status)}" onchange="guardarRosterSesion()">${vcAttendanceOptions(status)}</select></div>`;
    }).join('');
    const vals=players.map(p=>map.get(Number(p.id))?.status||'Sin registrar'),present=vals.filter(x=>x==='Presente').length,partial=vals.filter(x=>x==='Parcial').length,abs=vals.filter(x=>x==='Ausencia').length,just=vals.filter(x=>x==='Ausencia justificada').length,inj=vals.filter(x=>x==='Lesionado').length;
    sum.textContent=`Asistencia · ${present} presentes${partial?` · ${partial} parciales`:''}${abs+just?` · ${abs+just} ausencias`:''}${inj?` · ${inj} lesionados`:''}`;
    const old=grid.parentElement?.querySelector('.vc-attendance-summary');if(old)old.remove();
    const pills=document.createElement('div');pills.className='vc-attendance-summary';pills.innerHTML=`<span class="vc-attendance-pill good">${present} presentes</span>${partial?`<span class="vc-attendance-pill warn">${partial} parciales</span>`:''}${just?`<span class="vc-attendance-pill">${just} justificadas</span>`:''}${abs?`<span class="vc-attendance-pill bad">${abs} ausencias</span>`:''}${inj?`<span class="vc-attendance-pill bad">${inj} lesionados</span>`:''}`;grid.insertAdjacentElement('afterend',pills);
  };
  window.guardarRosterSesion=function(){
    const arr=vcReadAttendanceUI();vcApplyAttendance(arr,true);renderSessionRoster();
    if($('save-indicator'))$('save-indicator').textContent='✓ Asistencia guardada';
  };
  window.seleccionarRosterSesion=function(all){
    const arr=(jugadoresEquipo||[]).map(p=>{
      let status='Sin registrar';
      if(all){if(p.status==='Disponible'||p.status==='Recuperación')status='Presente';else if(p.status==='Lesionado')status='Lesionado';}
      const s=vcPlayerSnapshotById(p.id);return {...s,status};
    });
    vcApplyAttendance(arr,true);renderSessionRoster();
  };

  const prevConstruirPlan=construirPlanSesion;
  construirPlanSesion=function(id){const out=prevConstruirPlan(id);out.attendanceStatus=clone(vcNormalizeAttendance(meta?.attendanceStatus,meta?.playerIds||[]));return out};

  const prevUsarPlan=usarPlan;
  usarPlan=function(id){const p=planificacion.find(x=>Number(x.id)===Number(id));const out=prevUsarPlan(id);if(p){meta.attendanceStatus=p.realizado?[]:clone(vcNormalizeAttendance(p.attendanceStatus,p.playerIds||[]));vcApplyAttendance(meta.attendanceStatus,false);save();renderSessionRoster()}return out};

  if(typeof marcarPlanRealizado==='function'){
    const prevMarcarRealizado=marcarPlanRealizado;
    marcarPlanRealizado=function(id){const p=planificacion.find(x=>Number(x.id)===Number(id));const attendance=clone(vcNormalizeAttendance(p?.attendanceStatus,p?.playerIds||[]));const out=prevMarcarRealizado(id);const p2=planificacion.find(x=>Number(x.id)===Number(id));const h=p2?.historialId?historial.find(x=>Number(x.id)===Number(p2.historialId)):null;if(h&&attendance.length){h.attendanceStatus=attendance;guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();programarSubidaCloud()}return out};
  }

  function vcNormalizeLoadedAttendance(){
    meta.attendanceStatus=vcNormalizeAttendance(meta?.attendanceStatus,meta?.playerIds||[]);
    (historial||[]).forEach(h=>h.attendanceStatus=vcNormalizeAttendance(h.attendanceStatus,h.playerIds||[]));
    (planificacion||[]).forEach(p=>p.attendanceStatus=vcNormalizeAttendance(p.attendanceStatus,p.playerIds||[]));
  }
  const prevLoadTeamAttendance=cargarEquipoEnVariables;
  cargarEquipoEnVariables=function(id){const out=prevLoadTeamAttendance(id);vcNormalizeLoadedAttendance();return out};
  vcNormalizeLoadedAttendance();

  function vcSessionAttendanceRecord(h,pid){
    const list=vcNormalizeAttendance(h?.attendanceStatus,h?.playerIds||[]),found=list.find(r=>Number(r.id)===Number(pid));
    if(found)return found;
    if(uniqNums(h?.playerIds||[]).includes(Number(pid)))return {id:Number(pid),status:'Presente'};
    return {id:Number(pid),status:'Sin registrar'};
  }
  function vcPlayerPerformance(pid,list){
    const counts={'Presente':0,'Parcial':0,'Ausencia justificada':0,'Ausencia':0,'Lesionado':0,'Sin registrar':0};let minutes=0,load=0,worked=0,recorded=0;
    (list||[]).forEach(h=>{
      const ar=vcSessionAttendanceRecord(h,pid),st=ar.status||'Sin registrar';counts[st]=(counts[st]||0)+1;if(st!=='Sin registrar')recorded++;
      let sessionWorked=false;
      (h.ejercicios||[]).forEach(e=>{
        const ids=Array.isArray(e.playerIds)?uniqNums(e.playerIds):uniqNums(h.playerIds||[]);
        if(ids.includes(Number(pid))){const m=Number(e.tiempo)||0;minutes+=m;load+=m*intensityFactor(h.intensidad);if(m>0)sessionWorked=true;}
      });
      if(sessionWorked)worked++;
    });
    const attended=(counts['Presente']||0)+(counts['Parcial']||0),attendancePct=recorded?Math.round(attended/recorded*100):null;
    return {minutes,load,worked,recorded,attendancePct,counts};
  }
  function vcScopeSessions(){const scope=$('stats-player-scope')?.value||'all';if(scope!=='period')return historial||[];const r=typeof statsRange==='function'?statsRange():null;return r?(historial||[]).filter(h=>String(h.fecha||'')>=r.start&&String(h.fecha||'')<=r.end):(historial||[])}
  function vcRenderPlayerLoadStats(){
    const box=$('stats-v2-players');if(!box)return;const list=vcScopeSessions();let players=(jugadoresEquipo||[]).slice();if(typeof vcSortPlayersByNumber==='function')players=vcSortPlayersByNumber(players);
    const rows=players.map(p=>({p,...vcPlayerPerformance(p.id,list)})).sort((a,b)=>b.load-a.load||b.minutes-a.minutes);
    const scope=$('stats-player-scope')?.value||'all';box.innerHTML=`<div class="vc-stats-scope-note"><span><b>${scope==='all'?'Acumulado histórico':'Periodo seleccionado'}</b><br>Carga = minutos asignados × intensidad (1/2/3)</span><span>${rows.filter(r=>r.load>0).length} jugadores con carga</span></div><div class="vc-player-stats-list">${rows.map(r=>{
      const p=r.p,pos=typeof ppPositions==='function'?ppPositions(p).join(' · '):'',name=`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`,att=r.attendancePct==null?'—':r.attendancePct+'%';
      return `<details class="vc-player-stat"><summary class="vc-load-summary"><div class="vc-player-main"><b>${esc(name)}</b><small>${esc(pos||'Sin posición')}</small></div><div class="vc-player-metric"><span>Minutos</span><b>${Math.round(r.minutes)}</b></div><div class="vc-player-metric"><span>Carga</span><b>${Math.round(r.load)}</b></div><div class="vc-player-metric vc-hide-tablet"><span>Sesiones</span><b>${r.worked}</b></div><div class="vc-player-metric vc-hide-tablet"><span>Asistencia</span><b>${att}</b></div><div class="vc-player-chevron">⌄</div></summary><div class="vc-player-detail"><div class="vc-attendance-breakdown"><span>Presente ${r.counts['Presente']||0}</span><span>Parcial ${r.counts['Parcial']||0}</span><span>Justificada ${r.counts['Ausencia justificada']||0}</span><span>Ausencia ${r.counts['Ausencia']||0}</span><span>Lesionado ${r.counts['Lesionado']||0}</span></div><div class="small" style="margin-top:9px">${r.recorded?`Asistencia registrada en ${r.recorded} sesiones. ${att} de presencia.`:'Aún no hay sesiones con asistencia registrada para este jugador.'}</div></div></details>`;
    }).join('')}</div>${rows.length?'':'<div class="match-empty">No hay jugadores en este equipo.</div>'}`;
  }
  const prevTrainingStats=window.vcRenderTrainingStatsDetail;
  window.vcRenderTrainingStatsDetail=function(){if(typeof prevTrainingStats==='function')prevTrainingStats();vcRenderPlayerLoadStats()};

  const prevOpenProfile=abrirPerfilJugador;
  abrirPerfilJugador=function(id){const out=prevOpenProfile(id),p=ppPlayer(id),grid=$('pp-tab-summary')?.querySelector('.pp-grid');if(p&&grid){grid.querySelector('.vc-performance-card')?.remove();const cutoff=new Date(Date.now()-30*86400000),list=(historial||[]).filter(h=>!h.fecha||new Date(h.fecha+'T12:00:00')>=cutoff),r=vcPlayerPerformance(id,list),att=r.attendancePct==null?'—':r.attendancePct+'%';const card=document.createElement('div');card.className='pp-card wide vc-performance-card';card.innerHTML=`<h3>Carga + asistencia · 30 días</h3><div class="vc-performance-kpis"><div class="vc-performance-kpi"><span>Minutos asignados</span><b>${Math.round(r.minutes)}</b></div><div class="vc-performance-kpi"><span>Carga interna</span><b>${Math.round(r.load)}</b></div><div class="vc-performance-kpi"><span>Sesiones trabajadas</span><b>${r.worked}</b></div><div class="vc-performance-kpi"><span>Asistencia</span><b>${att}</b></div></div><div class="vc-attendance-breakdown"><span>Presente ${r.counts['Presente']||0}</span><span>Parcial ${r.counts['Parcial']||0}</span><span>Justificada ${r.counts['Ausencia justificada']||0}</span><span>Ausencia ${r.counts['Ausencia']||0}</span><span>Lesionado ${r.counts['Lesionado']||0}</span></div><div class="small" style="margin-top:8px">La carga usa los minutos de los ejercicios realmente asignados al jugador y el factor de intensidad de la sesión.</div>`;grid.appendChild(card)}return out};

  /* ---------- PARTICIPACIÓN POR SET ---------- */
  function vcNormalizeSetParticipation(v){return safeArray(v).filter(Boolean).map((s,i)=>({set:Number(s.set)||i+1,playerIds:uniqNums(s.playerIds),participantsSnapshot:safeArray(s.participantsSnapshot).map(x=>({id:Number(x.id)||0,name:String(x.name||''),number:x.number??'',positions:safeArray(x.positions)}))})).filter(s=>s.set>0)}
  const prevMatchNormalizer=normalizarPartidos;
  normalizarPartidos=function(list){const rawById=new Map(safeArray(list).filter(Boolean).map(m=>[Number(m.id),m]));return prevMatchNormalizer(list).map(m=>{const raw=rawById.get(Number(m.id))||m;return {...m,setParticipation:vcNormalizeSetParticipation(raw?.setParticipation||m?.setParticipation)}})};
  if(typeof vcBuildMatchRecord==='function'){
    const prevBuildMatch=vcBuildMatchRecord;
    vcBuildMatchRecord=function(existing=null){const rec=prevBuildMatch(existing);rec.setParticipation=vcNormalizeSetParticipation(existing?.setParticipation);return rec};
  }
  function vcPostmatchSection(){
    let sec=$('postmatch-set-participation');if(sec)return sec;const modal=$('postmatch-modal')?.querySelector('.match-post-card');if(!modal)return null;sec=document.createElement('section');sec.id='postmatch-set-participation';sec.className='postmatch-section vc-set-participation';sec.innerHTML='<div class="vc-set-participation-head"><div><span class="pro-kicker">ROTACIÓN / PARTICIPACIÓN</span><h3>Jugadores que participaron en cada set</h3><p>Marca quién disputó cada set. Puedes copiar la selección del set anterior.</p></div></div><div id="postmatch-set-list" class="vc-set-list"></div>';const first=modal.querySelector('.postmatch-section');first?first.insertAdjacentElement('beforebegin',sec):modal.querySelector('.player-form-actions')?.insertAdjacentElement('beforebegin',sec);return sec;
  }
  function vcReadSetParticipationUI(){
    const id=Number($('postmatch-id')?.value),m=partidosEquipo.find(x=>Number(x.id)===id),roster=typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m||{},equipoActivo):[],byId=new Map(roster.map(r=>[Number(r.id),r]));
    return [...document.querySelectorAll('#postmatch-set-list .vc-set-card')].map(card=>{const set=Number(card.dataset.set),ids=[...card.querySelectorAll('input[type=checkbox]:checked')].map(x=>Number(x.value));return {set,playerIds:ids,participantsSnapshot:ids.map(pid=>{const r=byId.get(pid)||vcPlayerSnapshotById(pid);return {id:pid,name:String(r?.name||''),number:r?.number??'',positions:safeArray(r?.positions)}})}});
  }
  function vcSetTotalFromUI(m){const sf=Number($('postmatch-sets-for')?.value||0),sa=Number($('postmatch-sets-against')?.value||0),detail=String($('postmatch-set-detail')?.value||'').split(/[,;]+/).map(x=>x.trim()).filter(Boolean).length;return Math.max(sf+sa,detail,vcNormalizeSetParticipation(m?.setParticipation).length)}
  function vcRenderSetParticipation(id,preserve=null){
    const sec=vcPostmatchSection(),box=$('postmatch-set-list');if(!sec||!box)return;const m=partidosEquipo.find(x=>Number(x.id)===Number(id));if(!m)return;const total=vcSetTotalFromUI(m),roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,equipoActivo):[]).filter(r=>r.status==='Convocado');
    if(!total){box.innerHTML='<div class="vc-set-empty">Introduce el resultado para generar los sets y poder registrar la participación.</div>';return}
    const source=vcNormalizeSetParticipation(preserve||m.setParticipation),bySet=new Map(source.map(s=>[Number(s.set),new Set(s.playerIds.map(Number))]));
    box.innerHTML=Array.from({length:Math.min(9,total)},(_,i)=>i+1).map(setNo=>{const selected=bySet.get(setNo)||new Set();return `<div class="vc-set-card" data-set="${setNo}"><div class="vc-set-card-head"><strong>Set ${setNo} · ${selected.size} jugador${selected.size===1?'':'es'}</strong><div class="vc-set-actions"><button type="button" class="ghost" onclick="vcSetPlayers(${setNo},true)">Todos</button><button type="button" class="ghost" onclick="vcSetPlayers(${setNo},false)">Ninguno</button>${setNo>1?`<button type="button" class="ghost" onclick="vcCopyPreviousSet(${setNo})">Copiar set anterior</button>`:''}</div></div><div class="vc-set-player-grid">${roster.length?roster.map(r=>`<label class="vc-set-player"><input type="checkbox" value="${r.id}" ${selected.has(Number(r.id))?'checked':''} onchange="vcRefreshSetCount(${setNo})"><span>${r.number!==''&&r.number!=null?`#${esc(r.number)} · `:''}${esc(r.name||'Jugador')}</span></label>`).join(''):'<div class="vc-set-empty">No hay jugadores convocados. Añade primero la convocatoria del partido.</div>'}</div></div>`}).join('');
  }
  window.vcRefreshSetCount=function(setNo){const c=document.querySelector(`#postmatch-set-list .vc-set-card[data-set="${setNo}"]`);if(!c)return;const n=c.querySelectorAll('input:checked').length,strong=c.querySelector('strong');if(strong)strong.textContent=`Set ${setNo} · ${n} jugador${n===1?'':'es'}`};
  window.vcSetPlayers=function(setNo,all){const c=document.querySelector(`#postmatch-set-list .vc-set-card[data-set="${setNo}"]`);if(!c)return;c.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=!!all);vcRefreshSetCount(setNo)};
  window.vcCopyPreviousSet=function(setNo){const prev=document.querySelector(`#postmatch-set-list .vc-set-card[data-set="${setNo-1}"]`),cur=document.querySelector(`#postmatch-set-list .vc-set-card[data-set="${setNo}"]`);if(!prev||!cur)return;const ids=new Set([...prev.querySelectorAll('input:checked')].map(x=>Number(x.value)));cur.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=ids.has(Number(x.value)));vcRefreshSetCount(setNo)};
  const prevOpenPost=window.abrirResultadoPartido;
  window.abrirResultadoPartido=function(id){const out=prevOpenPost(id);vcRenderSetParticipation(id);setTimeout(()=>{['postmatch-sets-for','postmatch-sets-against','postmatch-set-detail'].forEach(fid=>{const el=$(fid);if(el&&!el.dataset.vcSetBound){el.dataset.vcSetBound='1';el.addEventListener('input',()=>{const keep=vcReadSetParticipationUI();vcRenderSetParticipation(Number($('postmatch-id')?.value),keep)})}})},0);return out};
  const prevSavePost=window.guardarResultadoPartido;
  window.guardarResultadoPartido=function(){const id=Number($('postmatch-id')?.value),sets=vcReadSetParticipationUI();const out=prevSavePost();const m=partidosEquipo.find(x=>Number(x.id)===id);if(m){m.setParticipation=sets;const playedIds=new Set(sets.flatMap(s=>s.playerIds||[]).map(Number));if(playedIds.size&&Array.isArray(m.playerEvaluations))m.playerEvaluations=m.playerEvaluations.map(r=>({...r,played:playedIds.has(Number(r.id))}));guardarPartidos();renderCompetition();renderStats();renderPlanificacion()}return out};

  /* ---------- OBJETIVOS DE EQUIPO CONECTADOS A PLANIFICACIÓN ---------- */
  function vcNormalizeGoals(list){return safeArray(list).filter(Boolean).map(g=>({id:Number(g.id)||Date.now(),title:String(g.title||''),foundation:String(g.foundation||''),metric:g.metric==='sessions'?'sessions':'minutes',target:Math.max(1,Number(g.target)||1),start:String(g.start||''),end:String(g.end||''),status:g.status==='done'?'done':'active',notes:String(g.notes||''),createdAt:String(g.createdAt||''),updatedAt:String(g.updatedAt||'')}))}
  let vcTeamGoals=vcNormalizeGoals(equiposData?.[equipoActivo]?.teamGoals||[]);
  const prevEmptyTeam=estadoEquipoVacio;
  estadoEquipoVacio=function(id){const s=prevEmptyTeam(id);if(!Array.isArray(s.teamGoals))s.teamGoals=[];return s};
  const prevCleanTeam=limpiarEquipo;
  limpiarEquipo=function(raw,id){const s=prevCleanTeam(raw,id);s.teamGoals=vcNormalizeGoals(raw?.teamGoals||s.teamGoals||[]);return s};
  const prevSaveTeamMemory=guardarEquipoEnMemoria;
  guardarEquipoEnMemoria=function(){prevSaveTeamMemory();if(!equiposData[equipoActivo])equiposData[equipoActivo]={};equiposData[equipoActivo].teamGoals=clone(vcTeamGoals)};
  const prevLoadTeamGoals=cargarEquipoEnVariables;
  cargarEquipoEnVariables=function(id){const out=prevLoadTeamGoals(id);vcTeamGoals=vcNormalizeGoals(equiposData?.[id]?.teamGoals||[]);vcNormalizeLoadedAttendance();return out};
  function vcSaveGoals(){guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();programarSubidaCloud();renderTeamGoals();if($('save-indicator'))$('save-indicator').textContent='✓ Objetivos de equipo guardados'}
  function vcEnsureGoalsPanel(){
    const season=$('season-grid');if(!season)return;let panel=$('team-goals-panel');if(!panel){panel=document.createElement('div');panel.id='team-goals-panel';panel.className='team-goals-panel';panel.innerHTML='<div class="team-goals-head"><div><span class="pro-kicker">OBJETIVOS DEL EQUIPO</span><h3>Objetivos conectados con la planificación</h3><p>Define metas de temporada y llévalas directamente al microciclo semanal.</p></div><button class="primary" onclick="vcOpenTeamGoal()">+ Nuevo objetivo</button></div><div id="team-goals-list" class="team-goals-list"></div>';const cfg=season.querySelector('.season-config-panel');cfg?cfg.insertAdjacentElement('afterend',panel):season.prepend(panel)}
    const weekForm=$('season-week-modal')?.querySelector('.season-week-form');if(weekForm&&!$('season-week-team-goal')){const label=document.createElement('label');label.className='wide';label.innerHTML='<span>Objetivo de equipo vinculado</span><select id="season-week-team-goal" onchange="vcTeamGoalWeekChanged()"><option value="">Sin vínculo</option></select>';weekForm.prepend(label)}
    const f=$('team-goal-foundation');if(f&&!f.options.length)f.innerHTML='<option value="">General</option>'+SEASON_FOUNDATIONS.map(x=>`<option>${esc(x)}</option>`).join('');
  }
  function vcGoalValue(g){
    const start=g.start||'0000-01-01',end=g.end||'9999-12-31',sessions=(historial||[]).filter(h=>String(h.fecha||'')>=start&&String(h.fecha||'')<=end);if(g.metric==='sessions')return sessions.filter(h=>!g.foundation||(h.ejercicios||[]).some(e=>normalizarFundamentos(e).includes(g.foundation))).length;
    let minutes=0;sessions.forEach(h=>{if(!g.foundation){minutes+=typeof statsSessionMinutes==='function'?statsSessionMinutes(h):Number(h.duracion)||0;return}(h.ejercicios||[]).forEach(e=>{if(normalizarFundamentos(e).includes(g.foundation))minutes+=Number(e.tiempo)||0})});return minutes;
  }
  window.renderTeamGoals=function(){vcEnsureGoalsPanel();const box=$('team-goals-list');if(!box)return;const goals=vcTeamGoals.slice().sort((a,b)=>(a.status==='done')-(b.status==='done')||String(a.end||'9999').localeCompare(String(b.end||'9999')));box.innerHTML=goals.length?goals.map(g=>{const val=vcGoalValue(g),pct=Math.min(100,Math.round(val/g.target*100)),unit=g.metric==='sessions'?'sesiones':'min';return `<article class="team-goal-card ${g.status==='done'?'done':''}"><div class="team-goal-top"><div><div class="team-goal-title">${esc(g.title||'Objetivo de equipo')}</div><div class="team-goal-meta">${esc(g.foundation||'General')} · ${g.start?esc(g.start):'Sin inicio'} → ${g.end?esc(g.end):'Sin fecha límite'}</div></div><span class="team-goal-badge ${g.status==='done'?'done':''}">${g.status==='done'?'Completado':'Activo'}</span></div><div class="team-goal-progress"><span style="width:${pct}%"></span></div><div class="team-goal-copy"><span>${Math.round(val)} / ${Math.round(g.target)} ${unit}</span><b>${pct}%</b></div>${g.notes?`<div class="small" style="margin-top:7px">${esc(g.notes)}</div>`:''}<div class="team-goal-actions"><button class="ghost" onclick="vcPlanTeamGoal(${g.id})">Llevar a semana actual</button><button class="ghost" onclick="vcOpenTeamGoal(${g.id})">Editar</button></div></article>`}).join(''):'<div class="match-empty">Todavía no hay objetivos de equipo. Crea uno para conectar temporada, planificación y trabajo realizado.</div>'};
  window.vcOpenTeamGoal=function(id=null){vcEnsureGoalsPanel();const g=id?vcTeamGoals.find(x=>Number(x.id)===Number(id)):null,c=seasonNormalizeConfig(seasonConfig);$('team-goal-id').value=g?.id||'';$('team-goal-modal-title').textContent=g?'Editar objetivo':'Nuevo objetivo';$('team-goal-title').value=g?.title||'';$('team-goal-foundation').value=g?.foundation||'';$('team-goal-metric').value=g?.metric||'minutes';$('team-goal-target').value=g?.target||'';$('team-goal-status').value=g?.status||'active';$('team-goal-start').value=g?.start||c.start||fechaLocalISO();$('team-goal-end').value=g?.end||c.end||'';$('team-goal-notes').value=g?.notes||'';$('team-goal-delete').classList.toggle('hidden',!g);$('team-goal-modal').classList.add('open')};
  window.vcCloseTeamGoal=function(){$('team-goal-modal')?.classList.remove('open')};
  window.vcSaveTeamGoal=function(){const title=String($('team-goal-title')?.value||'').trim(),target=Number($('team-goal-target')?.value||0);if(!title||target<=0){alert('Escribe el objetivo y un valor objetivo mayor que 0.');return}const id=Number($('team-goal-id')?.value)||Date.now(),old=vcTeamGoals.find(x=>Number(x.id)===id),rec={...(old||{}),id,title,foundation:$('team-goal-foundation')?.value||'',metric:$('team-goal-metric')?.value==='sessions'?'sessions':'minutes',target,start:$('team-goal-start')?.value||'',end:$('team-goal-end')?.value||'',status:$('team-goal-status')?.value==='done'?'done':'active',notes:String($('team-goal-notes')?.value||'').trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};const i=vcTeamGoals.findIndex(x=>Number(x.id)===id);if(i>=0)vcTeamGoals[i]=rec;else vcTeamGoals.push(rec);vcSaveGoals();vcCloseTeamGoal()};
  window.vcDeleteTeamGoal=function(){const id=Number($('team-goal-id')?.value),g=vcTeamGoals.find(x=>Number(x.id)===id);if(!g)return;if(!confirm(`¿Eliminar el objetivo “${g.title}”?`))return;vcTeamGoals=vcTeamGoals.filter(x=>Number(x.id)!==id);seasonPlan.forEach(w=>{if(Number(w.teamGoalId)===id)delete w.teamGoalId});seasonSave();vcSaveGoals();vcCloseTeamGoal()};
  window.vcPlanTeamGoal=function(id){const g=vcTeamGoals.find(x=>Number(x.id)===Number(id));if(!g)return;const ws=seasonWeekMonday(fechaLocalISO()),old=seasonWeekRecord(ws),rec=old?clone(old):{weekStart:ws,objective:'',fundamentals:[],targetSessions:0,targetMinutes:0,intensity:'Media',match:'',notes:''};rec.teamGoalId=g.id;if(!String(rec.objective||'').trim())rec.objective=g.title;if(g.foundation)rec.fundamentals=[...new Set([...(rec.fundamentals||[]),g.foundation])];const marker=`Objetivo de equipo: ${g.title}`;if(!String(rec.notes||'').includes(marker))rec.notes=[String(rec.notes||'').trim(),marker].filter(Boolean).join('\n');const i=seasonPlan.findIndex(x=>x.weekStart===ws);if(i>=0)seasonPlan[i]=rec;else seasonPlan.push(rec);seasonSave();renderTeamGoals();showView('planificacion',botonVista('planificacion'));setVistaPlanificacion('temporada')};
  function vcPopulateWeekGoal(rec){const sel=$('season-week-team-goal');if(!sel)return;sel.innerHTML='<option value="">Sin vínculo</option>'+vcTeamGoals.filter(g=>g.status!=='done'||Number(g.id)===Number(rec?.teamGoalId)).map(g=>`<option value="${g.id}" ${Number(g.id)===Number(rec?.teamGoalId)?'selected':''}>${esc(g.title)}</option>`).join('')}
  window.vcTeamGoalWeekChanged=function(){const id=Number($('season-week-team-goal')?.value),g=vcTeamGoals.find(x=>Number(x.id)===id);if(!g)return;const obj=$('season-week-objective');if(obj&&!String(obj.value||'').trim())obj.value=g.title;if(g.foundation)document.querySelectorAll('#season-week-foundations input').forEach(x=>{if(x.value===g.foundation)x.checked=true})};
  const prevOpenWeek=abrirSemanaTemporada;
  abrirSemanaTemporada=function(ws){const out=prevOpenWeek(ws),rec=seasonWeekRecord(ws);vcEnsureGoalsPanel();vcPopulateWeekGoal(rec);return out};
  const prevSaveWeek=guardarSemanaTemporada;
  guardarSemanaTemporada=function(){const ws=$('season-week-start')?.value,gid=Number($('season-week-team-goal')?.value)||null;const out=prevSaveWeek();const rec=seasonWeekRecord(ws);if(rec){if(gid)rec.teamGoalId=gid;else delete rec.teamGoalId;seasonSave()}renderTeamGoals();return out};

  const prevRenderPlanning=renderPlanificacion;
  renderPlanificacion=function(){const out=prevRenderPlanning();renderTeamGoals();return out};
  function vcDecorateSeasonWeekGoals(){document.querySelectorAll('#season-week-list .season-week-row').forEach(row=>{const btn=row.querySelector('.season-week-actions button[onclick*="abrirSemanaTemporada"]');const m=btn?.getAttribute('onclick')?.match(/abrirSemanaTemporada\('([^']+)'\)/);if(!m)return;const rec=seasonWeekRecord(m[1]),g=vcTeamGoals.find(x=>Number(x.id)===Number(rec?.teamGoalId));const obj=row.querySelector('.season-week-objective');obj?.querySelector('.vc-week-goal-link')?.remove();if(g&&obj){const chip=document.createElement('div');chip.className='season-focus-chip vc-week-goal-link';chip.style.marginTop='5px';chip.textContent='Objetivo de equipo · '+g.title;obj.appendChild(chip)}})}
  if(typeof renderTemporada==='function'){
    const prevRenderSeason=renderTemporada;
    renderTemporada=function(){const out=prevRenderSeason();renderTeamGoals();vcDecorateSeasonWeekGoals();return out};
  }
  const prevChangeTeam=window.cambiarEquipo;
  window.cambiarEquipo=function(id){const out=prevChangeTeam(id);vcTeamGoals=vcNormalizeGoals(equiposData?.[equipoActivo]?.teamGoals||[]);vcNormalizeLoadedAttendance();renderTeamGoals();renderSessionRoster();return out};

  /* Inicialización / migración segura. */
  try{
    ['infantil','cadete'].forEach(t=>{if(equiposData?.[t]){equiposData[t].teamGoals=vcNormalizeGoals(equiposData[t].teamGoals||[]);equiposData[t].partidos=normalizarPartidos(equiposData[t].partidos||[])}});
    partidosEquipo=normalizarPartidos(equiposData?.[equipoActivo]?.partidos||partidosEquipo||[]);if(equiposData?.[equipoActivo]){equiposData[equipoActivo].partidos=partidosEquipo;equiposData[equipoActivo].teamGoals=clone(vcTeamGoals)};
    guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();vcEnsureGoalsPanel();renderTeamGoals();renderSessionRoster();if($('stats-v2-players'))window.vcRenderTrainingStatsDetail();
  }catch(err){console.warn('V5.12.0: no se pudo completar la migración inicial',err)}
})();
