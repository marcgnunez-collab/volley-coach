(function(){
  const scoreLabels={1:'1 · Muy bajo',2:'2 · Bajo',3:'3 · Correcto',4:'4 · Bueno',5:'5 · Excelente'};
  const scoreOptions=value=>`<option value="">Sin valorar</option>`+[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(value)===n?'selected':''}>${scoreLabels[n]}</option>`).join('');

  function cloneSafe(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}
  function normalizeTeamEval(v){
    v=v&&typeof v==='object'?v:{};
    return {
      overall:v.overall===''?'':Number(v.overall||0)||'',
      technique:v.technique===''?'':Number(v.technique||0)||'',
      tactics:v.tactics===''?'':Number(v.tactics||0)||'',
      attitude:v.attitude===''?'':Number(v.attitude||0)||'',
      notes:String(v.notes||'')
    };
  }
  function normalizePlayerEvals(list){
    return Array.isArray(list)?list.filter(Boolean).map(r=>({
      id:Number(r.id)||0,
      played:r.played!==false,
      rating:r.rating===''?'':Number(r.rating||0)||'',
      note:String(r.note||''),
      name:String(r.name||''),
      number:r.number??'',
      positions:Array.isArray(r.positions)?r.positions:[]
    })):[];
  }

  const previousNormalizer=normalizarPartidos;
  normalizarPartidos=function(list){
    const rawById=new Map((Array.isArray(list)?list:[]).filter(Boolean).map(m=>[Number(m.id),m]));
    return previousNormalizer(list).map(m=>{
      const raw=rawById.get(Number(m.id))||{};
      return {
        ...m,
        matchEvaluation:normalizeTeamEval(raw.matchEvaluation||m.matchEvaluation),
        playerEvaluations:normalizePlayerEvals(raw.playerEvaluations||m.playerEvaluations)
      };
    });
  };

  if(typeof vcBuildMatchRecord==='function'){
    const previousBuild=vcBuildMatchRecord;
    vcBuildMatchRecord=function(existing=null){
      const rec=previousBuild(existing);
      rec.matchEvaluation=normalizeTeamEval(existing?.matchEvaluation);
      rec.playerEvaluations=normalizePlayerEvals(existing?.playerEvaluations);
      return rec;
    };
  }

  function collectiveAverage(m){
    const e=normalizeTeamEval(m?.matchEvaluation);
    const vals=[e.overall,e.technique,e.tactics,e.attitude].map(Number).filter(n=>n>0);
    return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
  }

  window.abrirResultadoPartido=function(id){
    const m=partidosEquipo.find(x=>Number(x.id)===Number(id));
    if(!m){alert('No se ha encontrado el partido.');return}
    $('postmatch-id').value=m.id;
    $('postmatch-title').textContent=`${m.status==='Jugado'?'Resultado / valoración':'Añadir resultado'} · ${m.opponent||'Rival'}`;
    $('postmatch-subtitle').textContent=[m.date?matchDateLabel(m.date):'',m.competition,m.round].filter(Boolean).join(' · ');
    $('postmatch-sets-for').value=m.setsFor!==''&&m.setsFor!=null?m.setsFor:'';
    $('postmatch-sets-against').value=m.setsAgainst!==''&&m.setsAgainst!=null?m.setsAgainst:'';
    $('postmatch-set-detail').value=m.setDetail||'';

    const ev=normalizeTeamEval(m.matchEvaluation);
    ['overall','technique','tactics','attitude'].forEach(k=>{
      const el=$(`postmatch-team-${k}`);
      if(el)el.innerHTML=scoreOptions(ev[k]);
    });
    $('postmatch-team-notes').value=ev.notes||'';

    const previous=new Map(normalizePlayerEvals(m.playerEvaluations).map(r=>[Number(r.id),r]));
    const roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,equipoActivo):[]).filter(r=>r.status==='Convocado');
    const box=$('postmatch-player-list');
    box.innerHTML=roster.length?roster.map(r=>{
      const old=previous.get(Number(r.id))||{},played=old.played!==false,positions=(r.positions||[]).filter(Boolean).join(' · ')||'Sin posición';
      return `<div class="postmatch-player-row" data-player-id="${r.id}">
        <div class="postmatch-player-copy"><b>${r.number!==''&&r.number!=null?`#${esc(r.number)} · `:''}${esc(r.name||'Jugador')}</b><small>${esc(positions)}</small></div>
        <select class="postmatch-player-played" onchange="vcPostmatchPlayerToggle(this)"><option ${played?'selected':''}>Jugó</option><option ${!played?'selected':''}>No jugó</option></select>
        <select class="postmatch-player-rating" ${played?'':'disabled'}>${scoreOptions(old.rating)}</select>
        <input class="postmatch-player-note" value="${esc(old.note||'')}" placeholder="${played?'Observación individual':'Motivo / observación'}">
      </div>`;
    }).join(''):'<div class="match-empty">No hay jugadores convocados registrados para este partido.</div>';

    $('postmatch-modal').classList.add('open');
  };

  window.cerrarResultadoPartido=function(){$('postmatch-modal')?.classList.remove('open')};

  window.vcPostmatchPlayerToggle=function(sel){
    const row=sel.closest('.postmatch-player-row'),rating=row?.querySelector('.postmatch-player-rating'),played=sel.value==='Jugó';
    if(rating){rating.disabled=!played;if(!played)rating.value=''}
  };

  window.guardarResultadoPartido=function(){
    const id=Number($('postmatch-id')?.value),m=partidosEquipo.find(x=>Number(x.id)===id);
    if(!m){alert('No se ha encontrado el partido.');return}
    const sf=$('postmatch-sets-for')?.value,sa=$('postmatch-sets-against')?.value;
    if(sf===''||sa===''){alert('Introduce los sets a favor y en contra.');return}
    m.status='Jugado';
    m.setsFor=Number(sf);
    m.setsAgainst=Number(sa);
    m.setDetail=String($('postmatch-set-detail')?.value||'').trim();
    m.matchEvaluation={
      overall:$('postmatch-team-overall')?.value===''?'':Number($('postmatch-team-overall')?.value),
      technique:$('postmatch-team-technique')?.value===''?'':Number($('postmatch-team-technique')?.value),
      tactics:$('postmatch-team-tactics')?.value===''?'':Number($('postmatch-team-tactics')?.value),
      attitude:$('postmatch-team-attitude')?.value===''?'':Number($('postmatch-team-attitude')?.value),
      notes:String($('postmatch-team-notes')?.value||'').trim()
    };
    const roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,equipoActivo):[]);
    const rosterById=new Map(roster.map(r=>[Number(r.id),r]));
    m.playerEvaluations=[...document.querySelectorAll('#postmatch-player-list .postmatch-player-row')].map(row=>{
      const pid=Number(row.dataset.playerId),r=rosterById.get(pid)||{},played=row.querySelector('.postmatch-player-played')?.value!=='No jugó';
      const rating=row.querySelector('.postmatch-player-rating')?.value;
      return {
        id:pid,played,
        rating:played&&rating!==''?Number(rating):'',
        note:String(row.querySelector('.postmatch-player-note')?.value||'').trim(),
        name:String(r.name||''),number:r.number??'',positions:Array.isArray(r.positions)?cloneSafe(r.positions):[]
      };
    });
    guardarPartidos();
    cerrarResultadoPartido();
    renderCompetition();
    renderStats();
    renderDashboardCompetition();
    renderPlanificacion();
  };

  matchCard=function(m){
    const r=matchResult(m),score=m.status==='Jugado'?`${Number(m.setsFor)||0}–${Number(m.setsAgainst)||0}`:'—';
    const statusClass=r==='won'?'won':r==='lost'?'lost':'';
    const roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,equipoActivo):[]).filter(x=>x.status==='Convocado');
    const unavailable=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,equipoActivo):[]).filter(x=>x.status==='No disponible');
    const avg=collectiveAverage(m);
    return `<article class="match-card">
      <div class="match-card-top"><div>
        <div class="match-date">${esc(matchDateLabel(m.date))}${m.time?' · '+esc(m.time):''}</div>
        <div class="match-opponent">${m.venue==='Casa'?'vs':'@'} ${esc(m.opponent)}</div>
        <div class="match-meta">${esc([m.competition,m.round,m.venue].filter(Boolean).join(' · ')||'Partido')}</div>
        ${m.callTime?`<div class="match-meta">Convocatoria: ${esc(m.callTime)}</div>`:''}
        ${m.focus?.length?`<div class="match-meta"><b>Prioridades:</b> ${m.focus.map(esc).join(' · ')}</div>`:''}
        ${roster.length?`<div class="match-meta">Convocados: ${roster.length}${unavailable.length?` · ${unavailable.length} no disponible${unavailable.length===1?'':'s'}`:''}</div>`:''}
        ${avg?`<span class="match-rating-badge">Valoración colectiva · ${avg.toFixed(1)}/5</span>`:''}
      </div><div style="text-align:right"><div class="match-score">${score}</div><span class="match-status ${statusClass}">${esc(m.status)}</span></div></div>
      <div class="match-actions">
        <button class="ghost" onclick="exportarPDFPartido(${m.id})">PDF</button>
        <button class="ghost" onclick="abrirPartidoModal(${m.id})">Editar</button>
        <button class="${m.status==='Jugado'?'ghost':'match-result-primary'}" onclick="abrirResultadoPartido(${m.id})">${m.status==='Jugado'?'Resultado / valoración':'Añadir resultado'}</button>
        ${m.focus?.length?`<button class="ghost" onclick="matchToSeasonFocus(${m.id})">Llevar a semana</button>`:''}
      </div>
    </article>`;
  };

  /* PDF de partido: solo portada-resumen, sin segunda página. */
  generarPDFPartido=function(m,teamId=equipoActivo){
    try{
      if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
      const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15;
      const navy=[16,43,67],muted=[102,116,128],light=[245,247,249],navy2=[28,66,96],orange=[233,154,50],green=[63,124,99];
      const normal=(s=9.5,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const bold=(s=9.5,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const txt=v=>(typeof limpiarTextoPDF==='function'?limpiarTextoPDF(v):String(v==null?'':v).replace(/\s+/g,' ').trim());
      let y=55;

      const roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,teamId):[]);
      const called=roster.filter(r=>r.status==='Convocado');
      const unavailable=roster.filter(r=>r.status==='No disponible');
      const playerLine=r=>typeof vcMatchPlayerLine==='function'?vcMatchPlayerLine(r):`${r.number!==''&&r.number!=null?'#'+r.number+' · ':''}${r.name||'Jugador'}`;

      const twoColumns=(labels,startY)=>{
        const gap=6,colW=(W-M*2-gap)/2,rowH=5;
        let yy=startY;
        labels.forEach((label,i)=>{
          const col=i%2,row=Math.floor(i/2),x=M+col*(colW+gap),ry=yy+row*rowH;
          pdf.setFillColor(...light);pdf.roundedRect(x,ry-3.2,colW,4.2,1.2,1.2,'F');
          normal(8.3,navy);const line=pdf.splitTextToSize(txt(label),colW-3);pdf.text(line,x+1.5,ry);
        });
        return yy+Math.ceil(labels.length/2)*rowH;
      };

      pdf.setFillColor(...navy);pdf.rect(0,0,W,43,'F');
      bold(8,[210,221,230]);pdf.text('VOLLEY COACH · DOSSIER DE PARTIDO',M,14);
      bold(23,[255,255,255]);pdf.text(txt(EQUIPOS[teamId]?.nombre||'Equipo'),M,25);
      normal(10,[210,221,230]);pdf.text(txt(m.date)||fechaLocalISO(),M,33);

      bold(9,muted);pdf.text('PARTIDO',M,y);y+=6;
      bold(15,navy);const rival=pdf.splitTextToSize(`vs ${txt(m.opponent)||'Rival'}`,W-M*2);pdf.text(rival,M,y);y+=rival.length*6+7;

      const metrics=[['Convocatoria',txt(m.callTime)||'—'],['Hora partido',txt(m.time)||'—'],['Estado',txt(m.status)||'Programado'],['Convocados',String(called.length)]];
      const gap=3,cw=(W-M*2-gap*3)/4;
      metrics.forEach(([a,b],i)=>{const x=M+i*(cw+gap);pdf.setFillColor(...light);pdf.roundedRect(x,y,cw,20,2,2,'F');normal(7.5,muted);pdf.text(a.toUpperCase(),x+4,y+6);bold(12,navy);pdf.text(String(b),x+4,y+14)});
      y+=28;

      bold(9,muted);pdf.text('RESUMEN DEL PARTIDO',M,y);y+=7;
      const rows=[
        ['Competición',txt(m.competition)||'—'],
        ['Jornada / fase',txt(m.round)||'—'],
        ['Condición',txt(m.venue)||'—'],
        ['Resultado',m.status==='Jugado'?`${Number(m.setsFor)||0} - ${Number(m.setsAgainst)||0}`:'Pendiente']
      ];
      rows.forEach(([lab,val])=>{normal(9,navy);pdf.text(lab,M,y);bold(9,navy);pdf.text(String(val),W-M,y,{align:'right'});y+=6.2});
      if(m.status==='Jugado'&&txt(m.setDetail)){normal(8.3,muted);pdf.text(`Sets: ${txt(m.setDetail)}`,M,y);y+=5.5}

      const ev=normalizeTeamEval(m.matchEvaluation),evVals=[ev.overall,ev.technique,ev.tactics,ev.attitude].map(Number).filter(n=>n>0);
      if(evVals.length){
        y+=1;bold(9,muted);pdf.text('VALORACIÓN COLECTIVA',M,y);y+=6;
        const vals=[['Global',ev.overall],['Técnica',ev.technique],['Táctica',ev.tactics],['Actitud',ev.attitude]];
        const cg=3,ccw=(W-M*2-cg*3)/4;
        vals.forEach(([lab,val],i)=>{const x=M+i*(ccw+cg);pdf.setFillColor(...light);pdf.roundedRect(x,y,ccw,13,1.5,1.5,'F');normal(7,muted);pdf.text(lab.toUpperCase(),x+3,y+4.5);bold(10.5,navy2);pdf.text(val?`${val}/5`:'—',x+3,y+10)});
        y+=18;
      }

      bold(9,muted);pdf.text(`CONVOCATORIA · ${called.length}`,M,y);y+=7;
      if(called.length)y=twoColumns(called.map(playerLine),y);
      else{normal(9,muted);pdf.text('No hay convocados registrados.',M,y);y+=7}

      if(unavailable.length&&y<250){
        y+=3;bold(9,muted);pdf.text('NO DISPONIBLES',M,y);y+=6;
        unavailable.forEach((r,i)=>{
          if(y>265)return;
          normal(8.5,navy);const line=`${i+1}. ${playerLine(r)}${r.reason?` · ${r.reason}`:''}`;
          const ls=pdf.splitTextToSize(line,W-M*2);pdf.text(ls,M,y);y+=ls.length*4.3;
        });
      }

      if(Array.isArray(m.focus)&&m.focus.length&&y<266){
        y+=2;bold(8.5,muted);pdf.text('PRIORIDADES',M,y);y+=5;normal(8.4,navy);const ls=pdf.splitTextToSize(m.focus.join(' · '),W-M*2);pdf.text(ls,M,y);y+=ls.length*4.2;
      }

      normal(7.7,muted);pdf.text(`Volley Coach · ${txt(EQUIPOS[teamId]?.nombre||'Equipo')} · ${txt(m.date)||fechaLocalISO()}`,M,H-7);
      const clean=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');
      pdf.save(`Partido_${clean}_${txt(m.date)||fechaLocalISO()}.pdf`);
    }catch(err){console.error(err);alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.')}
  };

  partidosEquipo=normalizarPartidos(partidosEquipo||[]);
  if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=cloneSafe(partidosEquipo);
  try{guardarEstadoLocalSinCloud()}catch(_){}
  renderCompetition();
})();
