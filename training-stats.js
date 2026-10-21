(function(){
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function uniqueNums(list){
    const s=new Set(),out=[];
    (Array.isArray(list)?list:[]).forEach(v=>{const n=Number(v);if(Number.isFinite(n)&&!s.has(n)){s.add(n);out.push(n)}});
    return out;
  }
  function enrichExercise(e){
    try{
      if(e!=null && (typeof e==='number'||typeof e==='string')){
        return baseDeDatos.find(x=>Number(x.id)===Number(e)) || {id:Number(e)};
      }
      return typeof enriquecerEjercicioGuardado==='function' ? enriquecerEjercicioGuardado(e) : (e||{});
    }catch(_){return e||{}}
  }
  function foundationsOf(e){
    const ex=enrichExercise(e);
    try{
      const fs=typeof normalizarFundamentos==='function' ? normalizarFundamentos(ex) : [];
      return [...new Set((fs||[]).map(x=>String(x||'').trim()).filter(Boolean))];
    }catch(_){
      if(Array.isArray(ex.fundamentos))return [...new Set(ex.fundamentos.filter(Boolean))];
      return ex.fundamento?[String(ex.fundamento)]:[];
    }
  }
  function exerciseMinutes(e){
    const ex=enrichExercise(e);
    return Math.max(0,num(ex.tiempo));
  }
  function sessionRosterIds(h){
    let ids=[];
    if(Array.isArray(h?.playerIds))ids=h.playerIds;
    if(!ids.length && Array.isArray(h?.participantSnapshot))ids=h.participantSnapshot.map(x=>x.id);
    return uniqueNums(ids);
  }
  function exerciseRosterIds(e,h){
    if(Array.isArray(e?.playerIds))return uniqueNums(e.playerIds);
    if(Array.isArray(e?.participantSnapshot)&&e.participantSnapshot.length)return uniqueNums(e.participantSnapshot.map(x=>x.id));
    return sessionRosterIds(h);
  }
  function scopeSessions(which){
    const all=(historial||[]).filter(Boolean);
    if(which==='all')return all;
    const r=statsRange();
    return statsFilter(all,r.start,r.end);
  }
  function sessionLabelForScope(which,list){
    if(which==='all'){
      if(!list.length)return 'Histórico completo · sin sesiones';
      const dates=list.map(h=>h.fecha).filter(Boolean).sort();
      const first=dates[0],last=dates[dates.length-1];
      const range=first&&last
        ? `${new Date(first+'T12:00:00').toLocaleDateString('es-ES')} — ${new Date(last+'T12:00:00').toLocaleDateString('es-ES')}`
        : 'Histórico completo';
      return `${range} · ${list.length} sesiones`;
    }
    const r=statsRange();
    return `${new Date(r.start+'T12:00:00').toLocaleDateString('es-ES')} — ${new Date(r.end+'T12:00:00').toLocaleDateString('es-ES')} · ${list.length} sesiones`;
  }

  function foundationStats(list){
    const by={},sessionsBy={},exerciseCountBy={};
    let classifiedMinutes=0,unclassifiedMinutes=0,totalExerciseMinutes=0;
    (list||[]).forEach(h=>{
      (h.ejercicios||[]).forEach(raw=>{
        const m=exerciseMinutes(raw);
        if(!(m>0))return;
        totalExerciseMinutes+=m;
        const fs=foundationsOf(raw);
        if(!fs.length){unclassifiedMinutes+=m;return}
        classifiedMinutes+=m;
        const share=m/fs.length;
        fs.forEach(f=>{
          by[f]=(by[f]||0)+share;
          if(!sessionsBy[f])sessionsBy[f]=new Set();
          sessionsBy[f].add(h.id);
          exerciseCountBy[f]=(exerciseCountBy[f]||0)+1;
        });
      });
    });
    const totalFoundationMinutes=Object.values(by).reduce((a,b)=>a+num(b),0);
    return {by,sessionsBy,exerciseCountBy,totalFoundationMinutes,classifiedMinutes,unclassifiedMinutes,totalExerciseMinutes};
  }

  function currentPlayersSorted(){
    let players=Array.isArray(jugadoresEquipo)?jugadoresEquipo.slice():[];
    if(typeof vcSortPlayersByNumber==='function')players=vcSortPlayersByNumber(players);
    return players;
  }
  function playerStats(list){
    const players=currentPlayersSorted();
    const map={};
    players.forEach(p=>map[Number(p.id)]={
      p,total:0,by:{},workedSessions:new Set(),attendedSessions:new Set(),exerciseCount:0
    });

    (list||[]).forEach(h=>{
      const sessionIds=sessionRosterIds(h);
      sessionIds.forEach(id=>{if(map[id])map[id].attendedSessions.add(h.id)});
      (h.ejercicios||[]).forEach(raw=>{
        const m=exerciseMinutes(raw);
        if(!(m>0))return;
        const ids=exerciseRosterIds(raw,h);
        if(!ids.length)return;
        const fs=foundationsOf(raw);
        ids.forEach(id=>{
          const rec=map[id];if(!rec)return;
          rec.total+=m;
          rec.workedSessions.add(h.id);
          rec.exerciseCount++;
          if(fs.length){
            const share=m/fs.length;
            fs.forEach(f=>rec.by[f]=(rec.by[f]||0)+share);
          }
        });
      });
    });
    return Object.values(map);
  }

  function renderFoundations(){
    const box=$('stats-v2-foundations');if(!box)return;
    const scope=$('stats-foundation-scope')?.value||'all';
    const list=scopeSessions(scope),stats=foundationStats(list);
    const entries=Object.entries(stats.by).sort((a,b)=>b[1]-a[1]);
    const denom=stats.totalFoundationMinutes||1;

    let html=`<div class="vc-stats-scope-note"><span><b>${esc(scope==='all'?'Acumulado histórico':'Periodo seleccionado')}</b><br>${esc(sessionLabelForScope(scope,list))}</span><span>${Math.round(stats.totalFoundationMinutes)} min clasificados</span></div>`;
    if(!entries.length){
      html+='<div class="match-empty">Todavía no hay minutos de ejercicios con fundamentos registrados.</div>';
    }else{
      html+=entries.map(([f,m])=>{
        const pct=m/denom*100;
        const sessionCount=stats.sessionsBy[f]?.size||0;
        const exCount=stats.exerciseCountBy[f]||0;
        return `<div class="vc-foundation-row">
          <div><div class="vc-foundation-name">${esc(f)}</div><div class="vc-foundation-sub">${sessionCount} ses. · ${exCount} ejercicios</div></div>
          <div class="vc-foundation-track"><i style="width:${Math.max(1,Math.min(100,pct))}%"></i></div>
          <div class="vc-foundation-value"><b>${pct.toFixed(1)}%</b><br>${Math.round(m)} min</div>
        </div>`;
      }).join('');
    }
    if(stats.unclassifiedMinutes>0){
      html+=`<div class="vc-stats-warning"><b>${Math.round(stats.unclassifiedMinutes)} min sin fundamento definido.</b> Estos minutos no entran en el cálculo porcentual. Edita esos ejercicios en la Biblioteca si quieres que el reparto llegue a reflejar todo el trabajo.</div>`;
    }
    box.innerHTML=html;
  }

  function playerFoundationRows(rec){
    const entries=Object.entries(rec.by).sort((a,b)=>b[1]-a[1]);
    if(!entries.length)return '<div class="vc-player-empty">No hay fundamentos registrados en los ejercicios asignados a este jugador.</div>';
    const total=entries.reduce((a,x)=>a+num(x[1]),0)||1;
    return `<div class="vc-player-foundations">${entries.map(([f,m])=>{
      const pct=m/total*100;
      return `<div class="vc-player-foundation">
        <span>${esc(f)}</span>
        <div class="track"><i style="width:${Math.max(1,Math.min(100,pct))}%"></i></div>
        <strong>${Math.round(m)} min · ${pct.toFixed(1)}%</strong>
      </div>`;
    }).join('')}</div>`;
  }

  function renderPlayers(){
    const box=$('stats-v2-players');if(!box)return;
    const scope=$('stats-player-scope')?.value||'all';
    const list=scopeSessions(scope),rows=playerStats(list);

    let html=`<div class="vc-stats-scope-note"><span><b>${esc(scope==='all'?'Acumulado histórico':'Periodo seleccionado')}</b><br>${esc(sessionLabelForScope(scope,list))}</span><span>${rows.filter(x=>x.total>0).length} jugadores con trabajo registrado</span></div>`;
    html+=`<div class="vc-player-stats-list">${rows.map(rec=>{
      const p=rec.p,positions=typeof ppPositions==='function'?ppPositions(p).join(' · '):'';
      const name=`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`;
      return `<details class="vc-player-stat">
        <summary>
          <div class="vc-player-main"><b>${esc(name)}</b><small>${esc(positions||'Sin posición')}</small></div>
          <div class="vc-player-metric"><span>Minutos</span><b>${Math.round(rec.total)}</b></div>
          <div class="vc-player-metric"><span>Sesiones trabajadas</span><b>${rec.workedSessions.size}</b></div>
          <div class="vc-player-metric"><span>Asistencias registradas</span><b>${rec.attendedSessions.size}</b></div>
          <div class="vc-player-chevron">⌄</div>
        </summary>
        <div class="vc-player-detail">
          ${rec.total>0?playerFoundationRows(rec):'<div class="vc-player-empty">Este jugador todavía no tiene minutos asignados en ejercicios guardados en Historial.</div>'}
        </div>
      </details>`;
    }).join('')}</div>`;
    if(!rows.length)html+='<div class="match-empty">No hay jugadores en este equipo.</div>';
    box.innerHTML=html;
  }

  window.vcRenderTrainingStatsDetail=function(){
    renderFoundations();
    renderPlayers();
  };

  /* Mantiene el resto de Estadísticas V2 y sustituye únicamente estos cálculos por los robustos. */
  const previousStatsV2=renderStatsV2;
  renderStatsV2=function(){
    previousStatsV2();
    vcRenderTrainingStatsDetail();
  };

  /* Recalcula cuando cambia de equipo o se guarda una sesión. */
  if(typeof cambiarEquipo==='function'){
    const previousChangeTeam=cambiarEquipo;
    cambiarEquipo=function(id){
      const out=previousChangeTeam(id);
      setTimeout(()=>{if($('stats-v2-foundations'))vcRenderTrainingStatsDetail()},0);
      return out;
    };
  }

  try{vcRenderTrainingStatsDetail()}catch(err){console.warn('No se pudieron renderizar las nuevas estadísticas',err)}
})();
