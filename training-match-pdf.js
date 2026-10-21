/* ===== V5.11.5 · FIX PDF ENTRENAMIENTO + PDF PARTIDO PROFESIONAL ===== */

function vcSafeArray(v){return Array.isArray(v)?v:[]}
function vcUniqueNumbers(v){return [...new Set(vcSafeArray(v).map(Number).filter(Number.isFinite))]}
function vcUniqueStrings(v){return [...new Set(vcSafeArray(v).map(x=>String(x||'').trim()).filter(Boolean))]}
function vcRosterLabelFromPlayer(p){return `${p?.number!==''&&p?.number!=null?'#'+p.number+' · ':''}${String(p?.name||'Jugador')}`}
function vcRosterSnapshotForIds(ids,teamId=equipoActivo){
  const set=new Set(vcUniqueNumbers(ids)),players=vcTeamPlayers(teamId);
  return players.filter(p=>set.has(Number(p.id))).map(p=>({id:Number(p.id),name:String(p.name||''),number:p.number??'',positions:typeof ppPositions==='function'?ppPositions(p):[p.position,p.secondaryPosition].filter(Boolean)}));
}
function vcRosterLabelsForIds(ids,teamId=equipoActivo){
  const wanted=vcUniqueNumbers(ids),players=vcTeamPlayers(teamId),byId=new Map(players.map(p=>[Number(p.id),p]));
  return wanted.map(id=>byId.has(id)?vcRosterLabelFromPlayer(byId.get(id)):`Jugador ${id}`);
}
function vcResolvedSessionRoster(h,teamId=equipoActivo){
  let snapshot=vcSafeArray(h?.participantSnapshot).filter(Boolean).map(x=>({...x}));
  let ids=vcUniqueNumbers(h?.playerIds);
  if(!ids.length&&snapshot.length)ids=vcUniqueNumbers(snapshot.map(x=>x.id));
  // Sesión abierta: tomar directamente los checks visibles, que son la fuente más reciente.
  try{
    const domIds=typeof rosterSeleccionados==='function'?vcUniqueNumbers(rosterSeleccionados()):[];
    const belongsToCurrent=h?.__vcCurrentPdf===true;
    if(belongsToCurrent&&domIds.length){ids=domIds;snapshot=vcRosterSnapshotForIds(ids,teamId)}
  }catch{}
  // Respaldo desde la planificación enlazada.
  if(!ids.length&&h?.planificacionId){
    const p=(planificacion||[]).find(x=>Number(x.id)===Number(h.planificacionId));
    if(p){ids=vcUniqueNumbers(p.playerIds);if(!snapshot.length)snapshot=vcSafeArray(p.participantSnapshot).map(x=>({...x}))}
  }
  let labels=snapshot.length?snapshot.map(vcSnapshotLabel):vcRosterLabelsForIds(ids,teamId);
  if(!snapshot.length&&ids.length)snapshot=vcRosterSnapshotForIds(ids,teamId);
  return {ids,labels:vcUniqueStrings(labels),snapshot};
}
function vcResolvedExerciseRoster(e,h,teamId,sessionRoster){
  const hasExplicitIds=Array.isArray(e?.playerIds),hasExplicitSnap=Array.isArray(e?.participantSnapshot)&&e.participantSnapshot.length>0;
  let ids=hasExplicitIds?vcUniqueNumbers(e.playerIds):(hasExplicitSnap?vcUniqueNumbers(e.participantSnapshot.map(x=>x.id)):sessionRoster.ids.slice());
  let labels=hasExplicitSnap?e.participantSnapshot.map(vcSnapshotLabel):(ids.length?vcRosterLabelsForIds(ids,teamId):[]);
  if(!hasExplicitIds&&!hasExplicitSnap){ids=sessionRoster.ids.slice();labels=sessionRoster.labels.slice()}
  labels=vcUniqueStrings(labels);
  const a=new Set(ids.map(Number)),b=new Set(sessionRoster.ids.map(Number));
  let all=sessionRoster.ids.length>0&&a.size===b.size&&[...a].every(x=>b.has(x));
  if(!sessionRoster.ids.length&&sessionRoster.labels.length){
    const la=new Set(labels.map(x=>x.toLowerCase())),lb=new Set(sessionRoster.labels.map(x=>x.toLowerCase()));
    all=la.size===lb.size&&[...la].every(x=>lb.has(x));
  }
  // Si el ejercicio no tenía asignación explícita, hereda a todos siempre.
  if(!hasExplicitIds&&!hasExplicitSnap)all=true;
  return {ids,labels,all,count:labels.length||ids.length||0};
}

/* Asegura que el PDF de la sesión abierta recoja los checks actuales aunque meta todavía no se hubiera serializado. */
const _datosSesionActualParaPDFV5115=datosSesionActualParaPDF;
datosSesionActualParaPDF=function(){
  guardarSesionMeta();
  const h=_datosSesionActualParaPDFV5115();
  const ids=typeof rosterSeleccionados==='function'?vcUniqueNumbers(rosterSeleccionados()):vcUniqueNumbers(meta?.playerIds);
  h.__vcCurrentPdf=true;
  if(ids.length){h.playerIds=ids;h.jugadores=String(ids.length);h.participantSnapshot=vcRosterSnapshotForIds(ids,equipoActivo)}
  return h;
};

/* PDF de entrenamiento: asistentes arriba y nombres por ejercicio solo para subgrupos. */
generarPDFEntrenamiento=function(h,equipoNombre){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.6;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[130,145,160];
    const teamId=vcTeamIdFromName(equipoNombre),sessionRoster=vcResolvedSessionRoster(h,teamId);
    let y=15;
    const normal=(size=9.6,color=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const bold=(size=9.6,color=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const page=()=>{pdf.addPage();y=15};
    const ensure=(height=6)=>{if(y+height>H-FOOT)page()};
    const rule=()=>{pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=5};
    const field=(label,value,op={})=>{
      const txt=limpiarTextoPDF(value)||'-',size=op.size||9.5,indent=op.indent||0;
      bold(size);const lab=label+':',x=M+indent,lw=pdf.getTextWidth(lab+' '),vx=x+lw,right=Number.isFinite(op.right)?op.right:(W-M),maxW=Math.max(25,right-vx);
      normal(size);const lines=pdf.splitTextToSize(txt,maxW);
      lines.forEach((t,i)=>{ensure(LH+1);if(i===0){bold(size);pdf.text(lab,x,y);normal(size);pdf.text(t,vx,y)}else{normal(size);pdf.text(t,vx,y)}y+=LH});y+=op.after==null?1.2:op.after;
    };
    const section=title=>{ensure(11);bold(13.5);pdf.text(limpiarTextoPDF(title),M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=5.5};
    const blockNote=txt=>{if(limpiarTextoPDF(txt))field('Notas del bloque',txt,{size:9,after:2})};
    const court=(x,yy,w=40,hc=20)=>{pdf.setDrawColor(125,139,153);pdf.setLineWidth(.28);pdf.rect(x,yy,w,hc);const c=x+w/2,a=w/6;pdf.setLineWidth(.48);pdf.line(c,yy,c,yy+hc);pdf.setLineWidth(.22);pdf.line(c-a,yy,c-a,yy+hc);pdf.line(c+a,yy,c+a,yy+hc);pdf.setDrawColor(185,194,203);pdf.setLineWidth(.18);pdf.line(x,yy+hc/2,x+w,yy+hc/2);normal(5.8,muted);pdf.text('CAMPO',x+w/2,yy+hc+3,{align:'center'})};
    const exercise=(e0,n)=>{
      const e=enriquecerEjercicioGuardado(e0),name=limpiarTextoPDF(e.nombre)||'Ejercicio',minutes=Number(e.tiempo)||0,roster=vcResolvedExerciseRoster(e0,h,teamId,sessionRoster);
      const courtW=40,courtH=20,courtGap=5;ensure(36);
      pdf.setFillColor(...light);pdf.rect(M,y-4,W-M*2,7,'F');bold(10.5);pdf.text(`${n}. ${name}`,M+2,y);normal(9.3);pdf.text(`${minutes} min${roster.count?` · ${roster.count} jug.`:''}`,W-M-2,y,{align:'right'});y+=7;
      const cx=W-M-courtW,cy=y+1,right=cx-courtGap,pageNo=pdf.getCurrentPageInfo().pageNumber;court(cx,cy,courtW,courtH);
      field('Función',e.objetivo,{size:9.3,right});field('Desarrollo',e.descripcion,{size:9.3,right});
      const org=[e.formato?`Formato: ${limpiarTextoPDF(e.formato)}`:'',e.jugadores?`Organización: ${limpiarTextoPDF(e.jugadores)}`:'',e.material?`Material: ${limpiarTextoPDF(e.material)}`:''].filter(Boolean).join(' · ');
      field('Organización',org||'-',{size:9.3,right});
      if(!roster.all)field('Participantes',roster.labels.length?roster.labels.join(' · '):'Sin jugadores asignados',{size:9.3,right});
      field('Claves / correcciones',e.errores||'-',{size:9.3,right});if(limpiarTextoPDF(e.variantes))field('Variantes',e.variantes,{size:9.3,right});
      if(pdf.getCurrentPageInfo().pageNumber===pageNo)y=Math.max(y,cy+courtH+5);ensure(6);normal(8.5,muted);pdf.text(limpiarTextoPDF([fundamentosTexto(e),e.tipo||'',e.fase||'Parte principal',e.intensidad||'Media'].filter(Boolean).join(' · ')),M,y);y+=7;
    };
    bold(18);pdf.text('VOLLEY COACH',M,y);y+=8;bold(12.5);pdf.text('Ficha de entrenamiento',M,y);y+=8;rule();
    field('Equipo',equipoNombre||h.equipo||'Equipo',{after:1});field('Fecha',h.fecha||'-',{after:1});field('Duración',`${Number(h.duracion)||0} min`,{after:1});
    const attendeeText=sessionRoster.labels.length?sessionRoster.labels.join(' · '):(Number(h.jugadores)?`${Number(h.jugadores)} jugadores (sin nombres registrados)`:'No registrados');
    field(`Asistentes (${sessionRoster.labels.length||Number(h.jugadores)||0})`,attendeeText,{after:1});
    field('Intensidad',h.intensidad||'Media',{after:1});field('Objetivo',h.objetivo||'-',{after:1});if(Number(h.duracionObjetivo)||0)field('Objetivo de tiempo',`${Number(h.duracionObjetivo)} min`,{after:3});
    const groups=ejerciciosPorBloques(h.ejercicios||[]),notes=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');let counter=0;
    ORDEN_SECCIONES_ENTRENO.forEach(slug=>{const items=groups[slug]||[],note=limpiarTextoPDF(notes[slug]);if(!items.length&&!note)return;section(`${SECCIONES_ENTRENO[slug]?.numero||''} ${SECCIONES_ENTRENO[slug]?.titulo||slug}`.trim());blockNote(note);items.forEach(e=>exercise(e,++counter))});
    if(limpiarTextoPDF(h.notas)){section('Notas del entrenador');normal(9.4);pdf.splitTextToSize(limpiarTextoPDF(h.notas),W-M*2).forEach(t=>{ensure(LH);pdf.text(t,M,y);y+=LH})}
    const pages=pdf.getNumberOfPages(),date=limpiarTextoPDF(h.fecha)||fechaLocalISO();for(let i=1;i<=pages;i++){pdf.setPage(i);normal(8,muted);pdf.text(`Volley Coach · ${date} · Página ${i}/${pages}`,M,H-7)}
    const safe=String(equipoNombre||h.equipo||'Equipo').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');pdf.save(`Entrenamiento_${safe}_${date}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF. Comprueba la conexión e inténtalo de nuevo.')}
};

/* Campo de hora de convocatoria añadido sin alterar el formulario existente. */
(function vcAddCallTimeField(){
  if($('match-call-time'))return;
  const time=$('match-time');if(!time)return;
  const label=document.createElement('label');label.id='match-call-time-field';label.innerHTML='<span>Hora de convocatoria</span><input id="match-call-time" type="time">';
  time.closest('label')?.insertAdjacentElement('afterend',label);
  const roster=$('match-roster-list');if(roster&&!document.getElementById('match-roster-legend')){const legend=document.createElement('div');legend.id='match-roster-legend';legend.className='match-roster-legend';legend.innerHTML='<span>Convocado · aparece en la lista del partido</span><span>No disponible · permite indicar motivo</span><span>No convocado · queda fuera de la convocatoria</span>';roster.before(legend)}
})();

function vcNormalizeMatchRosterStatus(m,teamId=equipoActivo){
  const raw=vcSafeArray(m?.rosterStatus);
  if(raw.length)return raw.map(r=>({id:Number(r.id)||0,status:String(r.status||'No convocado'),reason:String(r.reason||''),name:String(r.name||''),number:r.number??'',positions:vcSafeArray(r.positions)}));
  const called=new Set(vcUniqueNumbers(m?.playerIds));
  return vcTeamPlayers(teamId).map(p=>({id:Number(p.id),status:called.has(Number(p.id))?'Convocado':'No convocado',reason:'',name:String(p.name||''),number:p.number??'',positions:typeof ppPositions==='function'?ppPositions(p):[]}));
}
function vcMatchRosterStateMap(m,teamId=equipoActivo){return new Map(vcNormalizeMatchRosterStatus(m,teamId).map(r=>[Number(r.id),r]))}
function vcMatchRosterStatusChange(sel){const row=sel.closest('.match-roster-pro-row'),input=row?.querySelector('.match-roster-reason');if(!input)return;input.classList.toggle('hidden',sel.value!=='No disponible');if(sel.value!=='No disponible')input.value=''}
function matchRosterOptions(selected=[],rosterStatus=[]){
  const box=$('match-roster-list');if(!box)return;const selectedSet=new Set(vcUniqueNumbers(selected)),state=new Map(vcSafeArray(rosterStatus).map(r=>[Number(r.id),r]));
  box.innerHTML=(jugadoresEquipo||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(p=>{const old=state.get(Number(p.id)),status=old?.status||(selectedSet.has(Number(p.id))?'Convocado':'No convocado'),reason=old?.reason||'',pos=ppPositions(p).join(' · ')||'Sin posición';return `<div class="match-roster-pro-row" data-player-id="${p.id}"><div class="match-roster-pro-player"><b>${p.number!==''&&p.number!=null?`#${esc(p.number)} · `:''}${esc(p.name)}</b><small>${esc(pos)}</small></div><select class="match-player-status" onchange="vcMatchRosterStatusChange(this)"><option ${status==='Convocado'?'selected':''}>Convocado</option><option ${status==='No disponible'?'selected':''}>No disponible</option><option ${status==='No convocado'?'selected':''}>No convocado</option></select><input class="match-roster-reason ${status==='No disponible'?'':'hidden'}" value="${esc(reason)}" placeholder="Motivo de la ausencia"></div>`}).join('')||'<div class="match-empty">Primero añade jugadores a este equipo.</div>';
}
function vcReadMatchRoster(){
  const rows=[...document.querySelectorAll('#match-roster-list .match-roster-pro-row')];
  const status=rows.map(row=>{const id=Number(row.dataset.playerId),p=(jugadoresEquipo||[]).find(x=>Number(x.id)===id),st=row.querySelector('.match-player-status')?.value||'No convocado',reason=String(row.querySelector('.match-roster-reason')?.value||'').trim();return {id,status:st,reason,name:String(p?.name||''),number:p?.number??'',positions:typeof ppPositions==='function'&&p?ppPositions(p):[]}});
  return {rosterStatus:status,playerIds:status.filter(x=>x.status==='Convocado').map(x=>x.id),unavailable:status.filter(x=>x.status==='No disponible')};
}

normalizarPartidos=function(list){
  return Array.isArray(list)?list.filter(Boolean).map(m=>{
    const base={id:Number(m.id)||Date.now(),date:String(m.date||''),time:String(m.time||''),callTime:String(m.callTime||''),competition:String(m.competition||''),round:String(m.round||''),opponent:String(m.opponent||''),venue:String(m.venue||'Casa'),status:String(m.status||'Programado'),setsFor:m.setsFor===''?'':Number(m.setsFor||0),setsAgainst:m.setsAgainst===''?'':Number(m.setsAgainst||0),setDetail:String(m.setDetail||''),notes:String(m.notes||''),focus:Array.isArray(m.focus)?m.focus:[],playerIds:vcUniqueNumbers(m.playerIds),participantSnapshot:Array.isArray(m.participantSnapshot)?clonar(m.participantSnapshot):[],rosterStatus:vcSafeArray(m.rosterStatus).map(r=>({...r,positions:vcSafeArray(r.positions)}))};
    if(!base.rosterStatus.length&&base.playerIds.length){
      const snaps=new Map(base.participantSnapshot.map(x=>[Number(x.id),x]));
      base.rosterStatus=base.playerIds.map(id=>{const x=snaps.get(Number(id));return {id:Number(id),status:'Convocado',reason:'',name:String(x?.name||''),number:x?.number??'',positions:vcSafeArray(x?.positions)}});
    }
    return base;
  }):[];
};

abrirPartidoModal=function(id=null){
  const m=id?partidosEquipo.find(x=>Number(x.id)===Number(id)):null;$('match-id').value=m?.id||'';$('match-modal-title').textContent=m?'Editar partido':'Nuevo partido';$('match-date').value=m?.date||fechaLocalISO();$('match-time').value=m?.time||'';if($('match-call-time'))$('match-call-time').value=m?.callTime||'';$('match-competition').value=m?.competition||'';$('match-round').value=m?.round||'';$('match-opponent').value=m?.opponent||'';$('match-venue').value=m?.venue||'Casa';$('match-status').value=m?.status||'Programado';$('match-sets-for').value=m?.setsFor??'';$('match-sets-against').value=m?.setsAgainst??'';$('match-set-detail').value=m?.setDetail||'';$('match-notes').value=m?.notes||'';matchFocusOptions();const fs=new Set(m?.focus||[]);document.querySelectorAll('input[name="match-focus"]').forEach(x=>x.checked=fs.has(x.value));matchRosterOptions(m?.playerIds||[],m?.rosterStatus||[]);$('match-delete-btn').classList.toggle('hidden',!m);matchToggleResult();$('match-modal').classList.add('open')
};
function vcBuildMatchRecord(existing=null){
  const roster=vcReadMatchRoster(),status=$('match-status')?.value||'Programado',playerIds=roster.playerIds;
  return {id:Number($('match-id')?.value)||Date.now(),date:$('match-date')?.value||fechaLocalISO(),time:$('match-time')?.value||'',callTime:$('match-call-time')?.value||'',competition:String($('match-competition')?.value||'').trim(),round:String($('match-round')?.value||'').trim(),opponent:String($('match-opponent')?.value||'').trim()||'Rival',venue:$('match-venue')?.value||'Casa',status,setsFor:status==='Jugado'?Number($('match-sets-for')?.value||0):'',setsAgainst:status==='Jugado'?Number($('match-sets-against')?.value||0):'',setDetail:String($('match-set-detail')?.value||'').trim(),notes:String($('match-notes')?.value||'').trim(),focus:[...document.querySelectorAll('input[name="match-focus"]:checked')].map(x=>x.value),playerIds,participantSnapshot:vcMatchParticipantSnapshot(playerIds,equipoActivo),rosterStatus:roster.rosterStatus};
}
guardarPartido=function(){
  const existing=partidosEquipo.find(x=>Number(x.id)===Number($('match-id')?.value)),rec=vcBuildMatchRecord(existing);if(!rec.date||!String(rec.opponent||'').trim()){alert('Añade al menos la fecha y el rival.');return}const i=partidosEquipo.findIndex(x=>Number(x.id)===Number(rec.id));if(i>=0)partidosEquipo[i]=rec;else partidosEquipo.push(rec);guardarPartidos();cerrarPartidoModal();renderCompetition();renderStats();renderDashboardCompetition();renderPlanificacion();
};
vcMatchFromModal=function(){const existing=partidosEquipo.find(x=>Number(x.id)===Number($('match-id')?.value));return vcBuildMatchRecord(existing)};

function vcMatchRosterForPDF(m,teamId=equipoActivo){
  let states=vcNormalizeMatchRosterStatus(m,teamId);const current=vcTeamPlayers(teamId),byId=new Map(current.map(p=>[Number(p.id),p]));
  states=states.map(r=>{const p=byId.get(Number(r.id));return {...r,name:r.name||p?.name||`Jugador ${r.id}`,number:r.number!==''&&r.number!=null?r.number:(p?.number??''),positions:vcSafeArray(r.positions).length?r.positions:(p&&typeof ppPositions==='function'?ppPositions(p):[])}});
  // Añade convocados históricos que ya no existan en la plantilla actual.
  vcSafeArray(m?.participantSnapshot).forEach(s=>{if(!states.some(r=>Number(r.id)===Number(s.id)))states.push({id:Number(s.id)||0,status:'Convocado',reason:'',name:s.name||'Jugador',number:s.number??'',positions:vcSafeArray(s.positions)})});
  return states;
}
function vcMatchPlayerLine(r){const left=`${r.number!==''&&r.number!=null?'#'+r.number+' · ':''}${r.name||'Jugador'}`,pos=vcSafeArray(r.positions).filter(Boolean).join(' / ');return pos?`${left} · ${pos}`:left}

generarPDFPartido=function(m,teamId=equipoActivo){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.8;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[130,145,160];let y=15;
    const normal=(s=9.6,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)},bold=(s=9.6,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)},page=()=>{pdf.addPage();y=15},ensure=(h=6)=>{if(y+h>H-FOOT)page()};
    const rule=()=>{pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=5};
    const field=(label,value,after=1.2)=>{const txt=limpiarTextoPDF(value)||'-';bold(9.5);const lab=label+':',lw=pdf.getTextWidth(lab+' '),vx=M+lw,maxW=W-M-vx;normal(9.5);const ls=pdf.splitTextToSize(txt,Math.max(25,maxW));ls.forEach((t,i)=>{ensure(LH+1);if(i===0){bold(9.5);pdf.text(lab,M,y);normal(9.5);pdf.text(t,vx,y)}else{normal(9.5);pdf.text(t,vx,y)}y+=LH});y+=after};
    const section=t=>{ensure(11);bold(13.5);pdf.text(t,M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=5.5};
    const listRow=(text,index,sub='')=>{ensure(sub?11:7);pdf.setFillColor(...light);pdf.rect(M,y-3.7,W-M*2,sub?9:6.7,'F');bold(9.3);pdf.text(`${index}.`,M+2,y);normal(9.3);const main=pdf.splitTextToSize(limpiarTextoPDF(text),W-M*2-12);pdf.text(main,M+8,y);y+=main.length*LH;if(sub){normal(8.8,muted);const sl=pdf.splitTextToSize(limpiarTextoPDF(sub),W-M*2-8);pdf.text(sl,M+8,y);y+=sl.length*4.2}y+=2.5};
    bold(18);pdf.text('VOLLEY COACH',M,y);y+=8;bold(12.5);pdf.text('Ficha de partido',M,y);y+=8;rule();
    field('Equipo',EQUIPOS[teamId]?.nombre||'Equipo',1);field('Fecha',m.date||'-',1);if(m.callTime)field('Hora de convocatoria',m.callTime,1);if(m.time)field('Hora del partido',m.time,1);field('Rival',m.opponent||'-',1);field('Competición',m.competition||'-',1);field('Jornada / fase',m.round||'-',1);field('Condición',m.venue||'-',1);field('Estado',m.status||'Programado',3);
    if(m.status==='Jugado'){section('Resultado');field('Resultado',`${Number(m.setsFor)||0} – ${Number(m.setsAgainst)||0}`,1);if(limpiarTextoPDF(m.setDetail))field('Marcadores de sets',m.setDetail,3)}
    const roster=vcMatchRosterForPDF(m,teamId),called=roster.filter(r=>r.status==='Convocado'),unavailable=roster.filter(r=>r.status==='No disponible');
    section(`Convocatoria · ${called.length} jugador${called.length===1?'':'es'}`);
    if(called.length)called.forEach((r,i)=>listRow(vcMatchPlayerLine(r),i+1));else{normal(9.4,muted);pdf.text('No hay jugadores convocados registrados.',M,y);y+=8}
    if(unavailable.length){section('No disponibles');unavailable.forEach((r,i)=>listRow(vcMatchPlayerLine(r),i+1,r.reason?`Motivo: ${r.reason}`:'Motivo no indicado'))}
    if(vcSafeArray(m.focus).length){section('Prioridades detectadas');field('Trabajar',m.focus.join(' · '),3)}
    if(limpiarTextoPDF(m.notes)){section('Notas / lectura del partido');normal(9.5);pdf.splitTextToSize(limpiarTextoPDF(m.notes),W-M*2).forEach(t=>{ensure(LH);pdf.text(t,M,y);y+=LH})}
    const pages=pdf.getNumberOfPages(),date=limpiarTextoPDF(m.date)||fechaLocalISO();for(let i=1;i<=pages;i++){pdf.setPage(i);normal(8,muted);pdf.text(`Volley Coach · Partido · ${date} · Página ${i}/${pages}`,M,H-7)}const rival=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');pdf.save(`Partido_${rival}_${date}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.')}
};

/* Actualiza visualmente tarjetas para mostrar convocatoria cuando exista. */
const _matchCardV5115=matchCard;
matchCard=function(m){let h=_matchCardV5115(m);const unavailable=vcNormalizeMatchRosterStatus(m,equipoActivo).filter(r=>r.status==='No disponible').length,call=m.callTime?`Conv. ${esc(m.callTime)}`:'';if(call||unavailable)h=h.replace('<div class="match-actions">',`<div class="match-meta">${call}${call&&unavailable?' · ':''}${unavailable?`${unavailable} no disponible${unavailable===1?'':'s'}`:''}</div><div class="match-actions">`);return h};

/* Migra en memoria partidos existentes para que los nuevos campos entren en la nube/local. */
(function vcMigrateV5115(){
  ['infantil','cadete'].forEach(t=>{if(equiposData?.[t])equiposData[t].partidos=normalizarPartidos(equiposData[t].partidos||[])});partidosEquipo=normalizarPartidos(equiposData?.[equipoActivo]?.partidos||partidosEquipo||[]);if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=partidosEquipo;try{guardarEstadoLocalSinCloud()}catch{};renderCompetition();renderPlanificacion();
})();
