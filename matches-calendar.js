/* ===== V5.11.2 · PARTIDOS DENTRO DE PLANIFICACIÓN ===== */
function actualizarFormularioPlanificacionTipo(){
  const tipo=$('plan-item-type')?.value||'training',match=tipo==='match';
  $('plan-training-fields')?.classList.toggle('hidden',match);
  $('plan-match-fields')?.classList.toggle('hidden',!match);
  if($('plan-create-btn'))$('plan-create-btn').textContent=match?'Crear partido':'Crear entrenamiento';
  if($('plan-create-hint'))$('plan-create-hint').textContent=match?'El partido aparecerá aquí y también en Competición, usando un único registro.':'Crea un entrenamiento y continúa preparándolo en el workspace.';
}
function limpiarFormularioPartidoPlan(){
  ['plan-match-time','plan-match-opponent','plan-match-competition','plan-match-round'].forEach(id=>{if($(id))$(id).value=''});
  if($('plan-match-venue'))$('plan-match-venue').value='Casa';
}
function abrirCreadorPlanificacion(fecha='',tipo='training'){
  const d=document.querySelector('.planning-quick-create');if(!d)return;d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'});
  if($('plan-fecha')&&fecha)$('plan-fecha').value=fecha;
  if($('plan-equipo'))$('plan-equipo').value=EQUIPOS[equipoActivo].nombre;
  if($('plan-item-type'))$('plan-item-type').value=tipo;
  actualizarFormularioPlanificacionTipo();
  setTimeout(()=>{if(tipo==='match')$('plan-match-opponent')?.focus();else $('plan-objetivo')?.focus()},30);
}
function crearPartidoDesdePlanificacion(){
  const date=$('plan-fecha')?.value||'',opponent=String($('plan-match-opponent')?.value||'').trim();
  if(!date){alert('Selecciona una fecha.');return false}
  if(!opponent){alert('Escribe el rival.');$('plan-match-opponent')?.focus();return false}
  const rec={id:Date.now(),date,time:$('plan-match-time')?.value||'',competition:String($('plan-match-competition')?.value||'').trim(),round:String($('plan-match-round')?.value||'').trim(),opponent,venue:$('plan-match-venue')?.value||'Casa',status:'Programado',setsFor:'',setsAgainst:'',setDetail:'',notes:'',focus:[],playerIds:[]};
  partidosEquipo.push(rec);guardarPartidos();
  limpiarFormularioPartidoPlan();if($('plan-fecha'))$('plan-fecha').value='';
  document.querySelector('.planning-quick-create')?.removeAttribute('open');
  renderPlanificacion();renderCompetition();renderDashboardCompetition();renderStats();
  if($('save-indicator'))$('save-indicator').textContent='✓ Partido añadido a Planificación y Competición';
  return true;
}
function guardarItemPlanificacion(){return ($('plan-item-type')?.value||'training')==='match'?crearPartidoDesdePlanificacion():crearSesionDesdePlanificacion('')}
crearSesionDiaPlanificacion=function(fecha){abrirCreadorPlanificacion(fecha,'training')};
function abrirEventoDiaPlanificacion(fecha){abrirCreadorPlanificacion(fecha,'training')}
function planMatchStatus(m,hoy){if(m.status==='Jugado')return {clase:'played',texto:'Partido · Jugado'};if(m.date<hoy)return {clase:'played',texto:'Partido · Pendiente de resultado'};return {clase:'',texto:'Partido · Programado'}}
function tarjetaPartidoPlanHTML(m,hoy){
  const st=planMatchStatus(m,hoy),meta=[m.time||'',m.competition||'',m.round||'',m.venue||''].filter(Boolean);
  const score=m.status==='Jugado'?` · ${Number(m.setsFor)||0}-${Number(m.setsAgainst)||0}`:'';
  return `<article class="plan-pro-card match ${st.clase}" onclick="abrirPartidoModal(${m.id})"><div class="plan-pro-status">${st.texto}${score}</div><div class="plan-pro-title">vs ${esc(m.opponent||'Rival')}</div><div class="plan-pro-match-meta">${meta.map(x=>`<span class="plan-pro-match-chip">${esc(x)}</span>`).join('')}</div><div class="plan-pro-actions" onclick="event.stopPropagation()"><button class="ghost" onclick="abrirPartidoModal(${m.id})">Abrir partido</button><button class="danger" onclick="eliminarPartidoDesdePlanificacion(${m.id})">×</button></div></article>`
}
function monthMatchHTML(m){const played=m.status==='Jugado';return `<button class="month-plan match ${played?'played':''}" onclick="abrirPartidoModal(${m.id})" title="Partido vs ${esc(m.opponent||'Rival')}">🏐 ${esc(m.opponent||'Rival')}${m.time?' · '+esc(m.time):''}</button>`}
function eliminarPartidoDesdePlanificacion(id){
  const m=partidosEquipo.find(x=>Number(x.id)===Number(id));if(!m)return;
  if(!confirm(`¿Eliminar de la planificación el partido contra ${m.opponent}? También se eliminará de Competición.`))return;
  partidosEquipo=partidosEquipo.filter(x=>Number(x.id)!==Number(id));guardarPartidos();renderPlanificacion();renderCompetition();renderDashboardCompetition();renderStats();
}
function seasonMatchesLabel(ws,rec={}){
  const a=new Date(ws+'T12:00:00'),b=new Date(a);b.setDate(a.getDate()+6);const end=fechaLocalISO(b);
  const matches=partidosEquipo.filter(m=>m.date>=ws&&m.date<=end).sort((x,y)=>String(x.date+x.time).localeCompare(String(y.date+y.time)));
  if(matches.length){const names=matches.map(m=>m.opponent).filter(Boolean).join(' · ');return `Partido${matches.length>1?'s':''}: ${esc(names)}`}
  return rec.match?`Partido: ${esc(rec.match)}`:'';
}
const _renderPlanificacionV5112Base=renderPlanificacion;
renderPlanificacion=function(){
  if(vistaPlanificacion==='temporada'){_renderPlanificacionV5112Base();return}
  const hoy=fechaLocalISO(),week=$('week-grid'),month=$('month-grid');if(!week||!month)return;
  $('plan-view-week')?.classList.toggle('active',vistaPlanificacion==='semana');$('plan-view-month')?.classList.toggle('active',vistaPlanificacion==='mes');$('plan-view-season')?.classList.remove('active');$('season-grid')?.classList.add('hidden');
  if(vistaPlanificacion==='semana'){
    const lunes=lunesDeSemana(semanaBase),fin=new Date(lunes);fin.setDate(lunes.getDate()+6);
    $('week-label').textContent=`${lunes.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} — ${fin.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}`;week.classList.remove('hidden');month.classList.add('hidden');
    const dias=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    week.innerHTML=dias.map((nom,i)=>{const d=new Date(lunes);d.setDate(lunes.getDate()+i);const fecha=isoDate(d),trainings=planificacion.filter(p=>p.fecha===fecha).sort((a,b)=>a.id-b.id),matches=partidosEquipo.filter(m=>m.date===fecha).sort((a,b)=>String(a.time).localeCompare(String(b.time))),has=trainings.length||matches.length;return `<div class="planning-day${fecha===hoy?' is-today':''}"><div class="planning-day-head"><strong>${nom}</strong><div class="planning-day-date"><b>${d.getDate()}</b><button class="plan-day-add" onclick="event.stopPropagation();abrirEventoDiaPlanificacion('${fecha}')" title="Añadir evento este día">+</button></div></div><div class="planning-day-events">${matches.map(m=>tarjetaPartidoPlanHTML(m,hoy)).join('')}${trainings.map(p=>tarjetaPlanProHTML(p,hoy)).join('')}${!has?'<div class="planning-event-empty">Sin eventos</div>':''}</div></div>`}).join('');
  }else{
    const base=new Date(semanaBase.getFullYear(),semanaBase.getMonth(),1),year=base.getFullYear(),mon=base.getMonth();$('week-label').textContent=base.toLocaleDateString('es-ES',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());week.classList.add('hidden');month.classList.remove('hidden');
    const lunesCab=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(x=>`<div class="month-weekday">${x}</div>`).join(''),first=lunesDeSemana(base),last=new Date(year,mon+1,0),end=lunesDeSemana(last);end.setDate(end.getDate()+6);let cells='';
    for(let d=new Date(first);d<=end;d.setDate(d.getDate()+1)){const fecha=isoDate(d),outside=d.getMonth()!==mon,trainings=planificacion.filter(p=>p.fecha===fecha),matches=partidosEquipo.filter(m=>m.date===fecha).sort((a,b)=>String(a.time).localeCompare(String(b.time)));cells+=`<div class="month-cell${outside?' outside':''}${fecha===hoy?' today':''}"><div class="month-day-head"><div class="month-day-num">${d.getDate()}</div><button class="month-day-add" onclick="event.stopPropagation();abrirEventoDiaPlanificacion('${fecha}')" title="Añadir evento este día">+</button></div>${matches.map(monthMatchHTML).join('')}${trainings.map(p=>{const st=estadoPlanificacion(p,hoy);return `<button class="month-plan ${st.clase}" onclick="editarEntrenamientoPlanificacion(${p.id})" title="Editar: ${esc(p.objetivo||'Sesión')}">${esc(p.objetivo||'Sesión')} · ${Number(p.duracion)||0}m</button>`}).join('')}</div>`}
    month.innerHTML=lunesCab+cells;
  }
  renderAvisoPlanHoy();
};
const _guardarPartidoV5112=guardarPartido;guardarPartido=function(){const r=_guardarPartidoV5112();renderPlanificacion();return r};
const _eliminarPartidoActualV5112=eliminarPartidoActual;eliminarPartidoActual=function(){const r=_eliminarPartidoActualV5112();renderPlanificacion();return r};
quickPlanificar=function(){toggleQuickActions(false);showView('planificacion',botonVista('planificacion'));setTimeout(()=>abrirCreadorPlanificacion('','training'),30)};
setTimeout(()=>{if($('plan-equipo'))$('plan-equipo').value=EQUIPOS[equipoActivo].nombre;actualizarFormularioPlanificacionTipo()},0);
