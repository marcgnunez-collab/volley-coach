/* ===== V5.11.4 · PDF DE PARTIDOS + PARTICIPANTES INTELIGENTES ===== */

function vcMatchParticipantSnapshot(ids,teamId=equipoActivo){
  return vcParticipantSnapshot((ids||[]).map(Number),teamId);
}
function vcMatchParticipantLabels(m,teamId=equipoActivo){
  if(Array.isArray(m?.participantSnapshot)&&m.participantSnapshot.length)return m.participantSnapshot.map(vcSnapshotLabel);
  const ids=Array.isArray(m?.playerIds)?m.playerIds.map(Number):[],set=new Set(ids),players=vcTeamPlayers(teamId),found=players.filter(p=>set.has(Number(p.id))).map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`),foundIds=new Set(players.filter(p=>set.has(Number(p.id))).map(p=>Number(p.id)));
  ids.filter(id=>!foundIds.has(Number(id))).forEach(id=>found.push(`Jugador ${id}`));
  return found;
}

/* Normalización compatible con partidos antiguos y snapshot nominal para los nuevos. */
normalizarPartidos=function(list){
  return Array.isArray(list)?list.filter(Boolean).map(m=>({
    id:Number(m.id)||Date.now(),
    date:String(m.date||''),
    time:String(m.time||''),
    competition:String(m.competition||''),
    round:String(m.round||''),
    opponent:String(m.opponent||''),
    venue:String(m.venue||'Casa'),
    status:String(m.status||'Programado'),
    setsFor:m.setsFor===''?'':Number(m.setsFor||0),
    setsAgainst:m.setsAgainst===''?'':Number(m.setsAgainst||0),
    setDetail:String(m.setDetail||''),
    notes:String(m.notes||''),
    focus:Array.isArray(m.focus)?m.focus:[],
    playerIds:Array.isArray(m.playerIds)?m.playerIds.map(Number):[],
    participantSnapshot:Array.isArray(m.participantSnapshot)?clonar(m.participantSnapshot):[]
  })):[];
};

/* Migra partidos ya existentes mientras los jugadores siguen disponibles. */
(function vcMigrateMatchSnapshots(){
  ['infantil','cadete'].forEach(teamId=>{
    const team=equiposData?.[teamId];if(!team||!Array.isArray(team.partidos))return;
    team.partidos=normalizarPartidos(team.partidos).map(m=>{
      if(!m.participantSnapshot.length&&m.playerIds.length)m.participantSnapshot=vcMatchParticipantSnapshot(m.playerIds,teamId);
      return m;
    });
  });
  partidosEquipo=normalizarPartidos(equiposData?.[equipoActivo]?.partidos||partidosEquipo).map(m=>{
    if(!m.participantSnapshot.length&&m.playerIds.length)m.participantSnapshot=vcMatchParticipantSnapshot(m.playerIds,equipoActivo);
    return m;
  });
  if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=partidosEquipo;
  try{guardarEstadoLocalSinCloud()}catch{}
})();

/* Guardado de partido con copia nominal de la convocatoria. */
guardarPartido=function(){
  const id=Number($('match-id').value)||Date.now(),date=$('match-date').value,opponent=String($('match-opponent').value||'').trim(),status=$('match-status').value;
  if(!date||!opponent){alert('Añade al menos la fecha y el rival.');return}
  const playerIds=[...document.querySelectorAll('input[name="match-player"]:checked')].map(x=>Number(x.value));
  const rec={
    id,date,
    time:$('match-time').value||'',
    competition:String($('match-competition').value||'').trim(),
    round:String($('match-round').value||'').trim(),
    opponent,
    venue:$('match-venue').value,
    status,
    setsFor:status==='Jugado'?Number($('match-sets-for').value||0):'',
    setsAgainst:status==='Jugado'?Number($('match-sets-against').value||0):'',
    setDetail:String($('match-set-detail').value||'').trim(),
    notes:String($('match-notes').value||'').trim(),
    focus:[...document.querySelectorAll('input[name="match-focus"]:checked')].map(x=>x.value),
    playerIds,
    participantSnapshot:vcMatchParticipantSnapshot(playerIds,equipoActivo)
  };
  const i=partidosEquipo.findIndex(x=>Number(x.id)===id);
  if(i>=0)partidosEquipo[i]=rec;else partidosEquipo.push(rec);
  guardarPartidos();cerrarPartidoModal();renderCompetition();renderStats();renderDashboardCompetition();renderPlanificacion();
};

function vcMatchFromModal(){
  const existing=partidosEquipo.find(x=>Number(x.id)===Number($('match-id')?.value));
  const playerIds=[...document.querySelectorAll('input[name="match-player"]:checked')].map(x=>Number(x.value));
  return {
    id:Number($('match-id')?.value)||Date.now(),
    date:$('match-date')?.value||fechaLocalISO(),
    time:$('match-time')?.value||'',
    competition:String($('match-competition')?.value||'').trim(),
    round:String($('match-round')?.value||'').trim(),
    opponent:String($('match-opponent')?.value||'').trim()||'Rival',
    venue:$('match-venue')?.value||'Casa',
    status:$('match-status')?.value||'Programado',
    setsFor:$('match-status')?.value==='Jugado'?Number($('match-sets-for')?.value||0):'',
    setsAgainst:$('match-status')?.value==='Jugado'?Number($('match-sets-against')?.value||0):'',
    setDetail:String($('match-set-detail')?.value||'').trim(),
    notes:String($('match-notes')?.value||'').trim(),
    focus:[...document.querySelectorAll('input[name="match-focus"]:checked')].map(x=>x.value),
    playerIds,
    participantSnapshot:playerIds.length?vcMatchParticipantSnapshot(playerIds,equipoActivo):(existing?.participantSnapshot||[])
  };
}
function exportarPDFPartidoActual(){
  const m=vcMatchFromModal();
  generarPDFPartido(m,equipoActivo);
}
function exportarPDFPartido(id,teamId=equipoActivo){
  let list=teamId===equipoActivo?partidosEquipo:(equiposData?.[teamId]?.partidos||[]);
  const m=(list||[]).find(x=>Number(x.id)===Number(id));
  if(!m){alert('No se ha encontrado el partido.');return}
  generarPDFPartido(m,teamId);
}
function generarPDFPartido(m,teamId=equipoActivo){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=16,FOOT=14,LH=5;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[155,166,176];
    let y=16;
    const normal=(size=9.7,color=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const bold=(size=9.7,color=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const page=()=>{pdf.addPage();y=16};
    const ensure=(h=6)=>{if(y+h>H-FOOT)page()};
    const field=(label,value,after=1.5)=>{
      const txt=limpiarTextoPDF(value)||'-';bold(9.6);const lab=label+':',lw=pdf.getTextWidth(lab+' '),x=M,vx=x+lw,maxW=W-M-vx;
      normal(9.6);const lines=pdf.splitTextToSize(txt,Math.max(35,maxW));
      lines.forEach((t,i)=>{ensure(LH+1);if(i===0){bold(9.6);pdf.text(lab,x,y);normal(9.6);pdf.text(t,vx,y)}else{normal(9.6);pdf.text(t,vx,y)}y+=LH});y+=after;
    };
    const section=t=>{ensure(12);y+=1;bold(13);pdf.text(t,M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=6};
    bold(18);pdf.text('VOLLEY COACH',M,y);y+=8;
    bold(12.5);pdf.text('Ficha de partido',M,y);y+=5;
    pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=6;
    const teamName=EQUIPOS[teamId]?.nombre||'Equipo';
    field('Equipo',teamName,1);
    field('Fecha',m.date||'-',1);
    if(m.time)field('Hora',m.time,1);
    field('Rival',m.opponent||'-',1);
    field('Competición',m.competition||'-',1);
    field('Jornada / fase',m.round||'-',1);
    field('Condición',m.venue||'-',1);
    field('Estado',m.status||'Programado',2);
    if(m.status==='Jugado'){
      section('Resultado');
      field('Resultado',`${Number(m.setsFor)||0} – ${Number(m.setsAgainst)||0}`,1);
      if(limpiarTextoPDF(m.setDetail))field('Marcadores de sets',m.setDetail,2);
    }
    section('Convocatoria');
    const roster=vcMatchParticipantLabels(m,teamId);
    field(`Convocados (${roster.length||m.playerIds?.length||0})`,roster.length?roster.join(' · '):'No registrados',3);
    if(Array.isArray(m.focus)&&m.focus.length){
      section('Prioridades detectadas');
      field('Trabajar',m.focus.join(' · '),3);
    }
    if(limpiarTextoPDF(m.notes)){
      section('Notas / lectura del partido');
      normal(9.7);const ls=pdf.splitTextToSize(limpiarTextoPDF(m.notes),W-M*2);
      ls.forEach(t=>{ensure(LH);pdf.text(t,M,y);y+=LH});
    }
    const total=pdf.getNumberOfPages(),fecha=limpiarTextoPDF(m.date)||fechaLocalISO();
    for(let i=1;i<=total;i++){pdf.setPage(i);normal(8,muted);pdf.text(`Volley Coach · Partido · ${fecha} · Página ${i}/${total}`,M,H-7)}
    const rival=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');
    pdf.save(`Partido_${rival}_${fecha}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.')}
}

/* Añade PDF a las tarjetas de Competición. */
const _matchCardV5114=matchCard;
matchCard=function(m){
  let h=_matchCardV5114(m);
  h=h.replace('<button class="ghost" onclick="abrirPartidoModal',`<button class="ghost" onclick="exportarPDFPartido(${m.id})">PDF</button><button class="ghost" onclick="abrirPartidoModal`);
  return h;
};

/* Añade PDF también a los partidos visibles desde Planificación. */
const _tarjetaPartidoPlanHTMLV5114=tarjetaPartidoPlanHTML;
tarjetaPartidoPlanHTML=function(m,hoy){
  let h=_tarjetaPartidoPlanHTMLV5114(m,hoy);
  h=h.replace('<button class="ghost" onclick="abrirPartidoModal',`<button class="ghost" onclick="exportarPDFPartido(${m.id})">PDF</button><button class="ghost" onclick="abrirPartidoModal`);
  return h;
};

renderCompetition();renderPlanificacion();
