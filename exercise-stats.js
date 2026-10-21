(function(){
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
  function uniqueNums(list){
    const seen=new Set(),out=[];
    (Array.isArray(list)?list:[]).forEach(v=>{
      const x=Number(v);
      if(Number.isFinite(x)&&!seen.has(x)){seen.add(x);out.push(x)}
    });
    return out;
  }
  function enrichExercise(e){
    try{
      if(e!=null&&(typeof e==='number'||typeof e==='string')){
        return baseDeDatos.find(x=>Number(x.id)===Number(e))||{id:Number(e)};
      }
      return typeof enriquecerEjercicioGuardado==='function'?enriquecerEjercicioGuardado(e):(e||{});
    }catch(_){return e||{}}
  }
  function foundationsOf(e){
    const ex=enrichExercise(e);
    try{
      const fs=typeof normalizarFundamentos==='function'?normalizarFundamentos(ex):[];
      return [...new Set((fs||[]).map(x=>String(x||'').trim()).filter(Boolean))];
    }catch(_){
      if(Array.isArray(ex.fundamentos))return [...new Set(ex.fundamentos.map(String).filter(Boolean))];
      return ex.fundamento?[String(ex.fundamento)]:[];
    }
  }
  function sessionRosterIds(h){
    if(Array.isArray(h?.playerIds)&&h.playerIds.length)return uniqueNums(h.playerIds);
    if(Array.isArray(h?.participantSnapshot)&&h.participantSnapshot.length)return uniqueNums(h.participantSnapshot.map(x=>x.id));
    return [];
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
  function scopeLabel(which,list){
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

  /*
    Cada ejercicio = 1 unidad.
    Si contiene N fundamentos, reparte 1/N a cada uno.
    Así los porcentajes representan el reparto de TODOS los ejercicios y suman 100%.
  */
  function foundationExerciseStats(list){
    const weighted={},actualCount={},sessionsBy={};
    let totalExercises=0,classifiedExercises=0,unclassifiedExercises=0;

    (list||[]).forEach(h=>{
      (h.ejercicios||[]).forEach(raw=>{
        if(!raw)return;
        totalExercises++;
        const fs=foundationsOf(raw);
        if(!fs.length){unclassifiedExercises++;return}
        classifiedExercises++;
        const share=1/fs.length;
        fs.forEach(f=>{
          weighted[f]=(weighted[f]||0)+share;
          actualCount[f]=(actualCount[f]||0)+1;
          if(!sessionsBy[f])sessionsBy[f]=new Set();
          sessionsBy[f].add(h.id);
        });
      });
    });

    const totalWeighted=Object.values(weighted).reduce((a,b)=>a+n(b),0);
    return {weighted,actualCount,sessionsBy,totalExercises,classifiedExercises,unclassifiedExercises,totalWeighted};
  }

  function sortedPlayers(){
    let players=Array.isArray(jugadoresEquipo)?jugadoresEquipo.slice():[];
    if(typeof vcSortPlayersByNumber==='function')players=vcSortPlayersByNumber(players);
    return players;
  }

  function playerExerciseStats(list){
    const map={};
    sortedPlayers().forEach(p=>{
      map[Number(p.id)]={
        p,
        exercises:0,
        weighted:{},
        actualCount:{},
        workedSessions:new Set(),
        attendedSessions:new Set(),
        unclassifiedExercises:0
      };
    });

    (list||[]).forEach(h=>{
      const sessionIds=sessionRosterIds(h);
      sessionIds.forEach(id=>{if(map[id])map[id].attendedSessions.add(h.id)});

      (h.ejercicios||[]).forEach(raw=>{
        if(!raw)return;
        const ids=exerciseRosterIds(raw,h);
        if(!ids.length)return;

        const fs=foundationsOf(raw);
        ids.forEach(id=>{
          const rec=map[id];
          if(!rec)return;
          rec.exercises++;
          rec.workedSessions.add(h.id);

          if(!fs.length){
            rec.unclassifiedExercises++;
            return;
          }
          const share=1/fs.length;
          fs.forEach(f=>{
            rec.weighted[f]=(rec.weighted[f]||0)+share;
            rec.actualCount[f]=(rec.actualCount[f]||0)+1;
          });
        });
      });
    });

    return Object.values(map);
  }

  function renderFoundations(){
    const box=$('stats-v2-foundations');if(!box)return;
    const scope=$('stats-foundation-scope')?.value||'all';
    const list=scopeSessions(scope),stats=foundationExerciseStats(list);
    const entries=Object.entries(stats.weighted).sort((a,b)=>b[1]-a[1]);
    const denom=stats.totalWeighted||1;

    let html=`<div class="vc-stats-scope-note">
      <span><b>${esc(scope==='all'?'Acumulado histórico':'Periodo seleccionado')}</b><br>${esc(scopeLabel(scope,list))}</span>
      <span>${stats.totalExercises} ejercicios realizados</span>
    </div>`;

    if(!entries.length){
      html+='<div class="match-empty">Todavía no hay ejercicios realizados con fundamentos registrados.</div>';
    }else{
      html+=entries.map(([f,weight])=>{
        const pct=weight/denom*100;
        const actual=stats.actualCount[f]||0;
        const sessions=stats.sessionsBy[f]?.size||0;
        return `<div class="vc-foundation-row">
          <div>
            <div class="vc-foundation-name">${esc(f)}</div>
            <div class="vc-foundation-sub">${sessions} ses. · presente en ${actual} ejercicios</div>
          </div>
          <div class="vc-foundation-track"><i style="width:${Math.max(1,Math.min(100,pct))}%"></i></div>
          <div class="vc-foundation-value"><b>${pct.toFixed(1)}%</b><br>${actual} ej.</div>
        </div>`;
      }).join('');
    }

    if(stats.unclassifiedExercises>0){
      html+=`<div class="vc-stats-warning">
        <b>${stats.unclassifiedExercises} ejercicio${stats.unclassifiedExercises===1?'':'s'} sin fundamento definido.</b>
        ${stats.unclassifiedExercises===1?'Este ejercicio no entra':'Estos ejercicios no entran'} en el reparto porcentual hasta que tengan un fundamento asignado.
      </div>`;
    }
    box.innerHTML=html;
  }

  function playerFoundationRows(rec){
    const entries=Object.entries(rec.weighted).sort((a,b)=>b[1]-a[1]);
    if(!entries.length){
      return '<div class="vc-player-empty">No hay fundamentos registrados en los ejercicios realizados por este jugador.</div>';
    }
    const total=entries.reduce((a,x)=>a+n(x[1]),0)||1;

    return `<div class="vc-player-foundations">${entries.map(([f,weight])=>{
      const pct=weight/total*100;
      const actual=rec.actualCount[f]||0;
      return `<div class="vc-player-foundation">
        <span>${esc(f)}</span>
        <div class="track"><i style="width:${Math.max(1,Math.min(100,pct))}%"></i></div>
        <strong>${actual} ej. · ${pct.toFixed(1)}%</strong>
      </div>`;
    }).join('')}</div>
    ${rec.unclassifiedExercises>0?`<div class="vc-stats-warning"><b>${rec.unclassifiedExercises} ejercicio${rec.unclassifiedExercises===1?'':'s'} sin fundamento.</b> No ${rec.unclassifiedExercises===1?'entra':'entran'} en su reparto porcentual.</div>`:''}`;
  }

  function renderPlayers(){
    const box=$('stats-v2-players');if(!box)return;
    const scope=$('stats-player-scope')?.value||'all';
    const list=scopeSessions(scope),rows=playerExerciseStats(list);

    let html=`<div class="vc-stats-scope-note">
      <span><b>${esc(scope==='all'?'Acumulado histórico':'Periodo seleccionado')}</b><br>${esc(scopeLabel(scope,list))}</span>
      <span>${rows.filter(x=>x.exercises>0).length} jugadores con trabajo registrado</span>
    </div>`;

    html+=`<div class="vc-player-stats-list">${rows.map(rec=>{
      const p=rec.p;
      const positions=typeof ppPositions==='function'?ppPositions(p).join(' · '):'';
      const name=`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`;
      return `<details class="vc-player-stat">
        <summary>
          <div class="vc-player-main"><b>${esc(name)}</b><small>${esc(positions||'Sin posición')}</small></div>
          <div class="vc-player-metric"><span>Ejercicios</span><b>${rec.exercises}</b></div>
          <div class="vc-player-metric"><span>Sesiones trabajadas</span><b>${rec.workedSessions.size}</b></div>
          <div class="vc-player-metric"><span>Asistencias registradas</span><b>${rec.attendedSessions.size}</b></div>
          <div class="vc-player-chevron">⌄</div>
        </summary>
        <div class="vc-player-detail">
          ${rec.exercises>0
            ? playerFoundationRows(rec)
            : '<div class="vc-player-empty">Este jugador todavía no tiene ejercicios asignados en entrenamientos guardados en Historial.</div>'}
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

  try{vcRenderTrainingStatsDetail()}catch(err){console.warn('No se pudieron recalcular las estadísticas por ejercicios',err)}
})();
