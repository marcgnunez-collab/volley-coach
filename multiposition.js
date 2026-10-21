(function(){
  const uniqPositions=list=>{
    const seen=new Set(),out=[];
    (Array.isArray(list)?list:[]).forEach(v=>{
      const s=String(v||'').trim();
      if(s && !seen.has(s)){seen.add(s);out.push(s)}
    });
    return out;
  };

  function playerPositionsForMatch(p){
    try{return uniqPositions(typeof ppPositions==='function'?ppPositions(p):[p?.position,p?.secondaryPosition])}
    catch(_){return uniqPositions([p?.position,p?.secondaryPosition])}
  }

  function ensureCadetePositionNote(){
    const roster=$('match-roster-list');
    if(!roster)return;
    let note=document.getElementById('match-position-note');
    if(!note){
      note=document.createElement('div');
      note.id='match-position-note';
      note.className='match-position-note';
      note.textContent='Cadete · si un jugador tiene varias posiciones, selecciona la posición con la que irá convocado en este partido.';
      const legend=document.getElementById('match-roster-legend');
      if(legend)legend.after(note); else roster.before(note);
    }
    note.classList.toggle('show',equipoActivo==='cadete');
  }

  /* Conserva la posición elegida al normalizar convocatorias antiguas/nuevas. */
  vcNormalizeMatchRosterStatus=function(m,teamId=equipoActivo){
    const raw=vcSafeArray(m?.rosterStatus);
    if(raw.length){
      return raw.map(r=>({
        id:Number(r.id)||0,
        status:String(r.status||'No convocado'),
        reason:String(r.reason||''),
        name:String(r.name||''),
        number:r.number??'',
        positions:uniqPositions(r.positions),
        matchPosition:String(r.matchPosition||r.selectedPosition||'')
      })).sort(typeof vcPlayerNumberCompare==='function'?vcPlayerNumberCompare:()=>0);
    }
    const called=new Set(vcUniqueNumbers(m?.playerIds));
    return vcTeamPlayers(teamId).map(p=>{
      const positions=playerPositionsForMatch(p);
      return {
        id:Number(p.id),
        status:called.has(Number(p.id))?'Convocado':'No convocado',
        reason:'',
        name:String(p.name||''),
        number:p.number??'',
        positions,
        matchPosition:teamId==='cadete'?(positions[0]||''):''
      };
    }).sort(typeof vcPlayerNumberCompare==='function'?vcPlayerNumberCompare:()=>0);
  };

  vcMatchRosterStatusChange=function(sel){
    const row=sel.closest('.match-roster-pro-row');
    if(!row)return;
    const reason=row.querySelector('.match-roster-reason');
    if(reason){
      reason.classList.toggle('hidden',sel.value!=='No disponible');
      if(sel.value!=='No disponible')reason.value='';
    }
    const pos=row.querySelector('.match-player-position');
    if(pos)pos.disabled=sel.value!=='Convocado';
  };

  matchRosterOptions=function(selected=[],rosterStatus=[]){
    const box=$('match-roster-list');if(!box)return;
    ensureCadetePositionNote();
    const selectedSet=new Set((selected||[]).map(Number));
    const state=new Map((Array.isArray(rosterStatus)?rosterStatus:[]).map(r=>[Number(r.id),r]));
    const players=typeof vcSortPlayersByNumber==='function'?vcSortPlayersByNumber(jugadoresEquipo||[]):(jugadoresEquipo||[]);

    box.innerHTML=players.map(p=>{
      const old=state.get(Number(p.id));
      const status=old?.status||(selectedSet.has(Number(p.id))?'Convocado':'No convocado');
      const reason=old?.reason||'';
      const positions=playerPositionsForMatch(p);
      let chosen=String(old?.matchPosition||old?.selectedPosition||'').trim();
      if(chosen && !positions.includes(chosen))positions.unshift(chosen);
      if(!chosen)chosen=positions[0]||'';
      const allPos=positions.join(' · ')||'Sin posición';

      let posField='';
      let rowClass='match-roster-pro-row';
      if(equipoActivo==='cadete'){
        rowClass+=' has-match-position';
        if(positions.length>1){
          posField=`<label class="match-player-position-wrap">
            <span>Posición en este partido</span>
            <select class="match-player-position" ${status==='Convocado'?'':'disabled'}>
              ${positions.map(pos=>`<option value="${esc(pos)}" ${pos===chosen?'selected':''}>${esc(pos)}</option>`).join('')}
            </select>
          </label>`;
        }else{
          posField=`<div class="match-player-position-wrap">
            <span>Posición en este partido</span>
            <div class="match-player-position-static">${esc(chosen||'Sin posición')}</div>
            <input type="hidden" class="match-player-position" value="${esc(chosen)}">
          </div>`;
        }
      }

      return `<div class="${rowClass}" data-player-id="${p.id}">
        <div class="match-roster-pro-player">
          <b>${p.number!==''&&p.number!=null?`#${esc(p.number)} · `:''}${esc(p.name)}</b>
          <small>${esc(allPos)}</small>
        </div>
        <select class="match-player-status" onchange="vcMatchRosterStatusChange(this)">
          <option ${status==='Convocado'?'selected':''}>Convocado</option>
          <option ${status==='No disponible'?'selected':''}>No disponible</option>
          <option ${status==='No convocado'?'selected':''}>No convocado</option>
        </select>
        ${posField}
        <input class="match-roster-reason ${status==='No disponible'?'':'hidden'}" value="${esc(reason)}" placeholder="Motivo de la ausencia">
      </div>`;
    }).join('')||'<div class="match-empty">Primero añade jugadores a este equipo.</div>';
  };

  vcReadMatchRoster=function(){
    const rows=[...document.querySelectorAll('#match-roster-list .match-roster-pro-row')];
    const status=rows.map(row=>{
      const id=Number(row.dataset.playerId);
      const p=(jugadoresEquipo||[]).find(x=>Number(x.id)===id);
      const st=row.querySelector('.match-player-status')?.value||'No convocado';
      const reason=String(row.querySelector('.match-roster-reason')?.value||'').trim();
      const positions=playerPositionsForMatch(p);
      const matchPosition=equipoActivo==='cadete'
        ? String(row.querySelector('.match-player-position')?.value||positions[0]||'').trim()
        : '';
      return {
        id,status:st,reason,
        name:String(p?.name||''),
        number:p?.number??'',
        positions,
        matchPosition
      };
    });
    return {
      rosterStatus:status,
      playerIds:status.filter(x=>x.status==='Convocado').map(x=>x.id),
      unavailable:status.filter(x=>x.status==='No disponible')
    };
  };

  /* PDF, valoración individual y cualquier lectura del partido usan la posición elegida. */
  const prevRosterForPDF=vcMatchRosterForPDF;
  vcMatchRosterForPDF=function(m,teamId=equipoActivo){
    return (prevRosterForPDF(m,teamId)||[]).map(r=>{
      const selected=String(r.matchPosition||r.selectedPosition||'').trim();
      if(teamId==='cadete' && selected){
        return {...r,matchPosition:selected,allPositions:uniqPositions(r.positions),positions:[selected]};
      }
      return {...r,matchPosition:selected};
    }).sort(typeof vcPlayerNumberCompare==='function'?vcPlayerNumberCompare:()=>0);
  };

  vcMatchPlayerLine=function(r){
    const left=`${r.number!==''&&r.number!=null?'#'+r.number+' · ':''}${r.name||'Jugador'}`;
    const selected=String(r.matchPosition||'').trim();
    const pos=selected || uniqPositions(r.positions).join(' / ');
    return pos?`${left} · ${pos}`:left;
  };

  /* Migra en memoria: para convocatorias cadete antiguas usa la primera posición como valor inicial. */
  try{
    const cad=equiposData?.cadete;
    if(cad && Array.isArray(cad.partidos)){
      cad.partidos.forEach(m=>{
        const byId=new Map((cad.jugadores||[]).map(p=>[Number(p.id),p]));
        if(Array.isArray(m.rosterStatus)){
          m.rosterStatus.forEach(r=>{
            const p=byId.get(Number(r.id));
            const positions=uniqPositions(r.positions?.length?r.positions:playerPositionsForMatch(p));
            r.positions=positions;
            if(!r.matchPosition)r.matchPosition=positions[0]||'';
          });
        }
      });
    }
  }catch(err){console.warn('No se pudo inicializar la posición de partido en históricos cadete',err)}

  try{
    if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=partidosEquipo;
    guardarEstadoLocalSinCloud();
  }catch(_){}
})();
