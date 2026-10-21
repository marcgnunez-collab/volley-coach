/* ===== V5.10 · TEMPORADA + CARGA INDIVIDUAL POR EJERCICIO ===== */
let seasonPlan=[];
let seasonConfig=null;
let seasonViewOffset=0;
const SEASON_FOUNDATIONS=['Recepción','Saque','Ataque','Bloqueo','Defensa','Colocación','Control','Reconstrucción','Juegos'];

function seasonDefaultConfig(){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  const startYear=m>=7?y:y-1,endYear=startYear+1;
  return {name:`Temporada ${startYear}/${String(endYear).slice(-2)}`,start:`${startYear}-09-01`,end:`${endYear}-06-30`,goal:''};
}
function seasonNormalizeConfig(c){const d=seasonDefaultConfig();c=c&&typeof c==='object'?c:{};return {name:String(c.name||d.name),start:String(c.start||d.start),end:String(c.end||d.end),goal:String(c.goal||'')}}
function seasonNormalizePlan(list){return Array.isArray(list)?list.filter(x=>x&&x.weekStart).map(x=>({...x,weekStart:String(x.weekStart),fundamentals:Array.isArray(x.fundamentals)?x.fundamentals:[]})):[]}

const _estadoEquipoV510=estadoEquipoVacio;
estadoEquipoVacio=function(id){const s=_estadoEquipoV510(id);s.seasonPlan=[];s.seasonConfig=seasonDefaultConfig();if(!s.meta.exercisePlayerIds)s.meta.exercisePlayerIds={};return s};
const _limpiarEquipoV510=limpiarEquipo;
limpiarEquipo=function(raw,id){const s=_limpiarEquipoV510(raw,id);s.seasonPlan=seasonNormalizePlan(raw?.seasonPlan);s.seasonConfig=seasonNormalizeConfig(raw?.seasonConfig);if(!s.meta.exercisePlayerIds||typeof s.meta.exercisePlayerIds!=='object')s.meta.exercisePlayerIds={};return s};
const _guardarEquipoV510=guardarEquipoEnMemoria;
guardarEquipoEnMemoria=function(){_guardarEquipoV510();if(!equiposData[equipoActivo])equiposData[equipoActivo]={};equiposData[equipoActivo].seasonPlan=clonar(seasonPlan);equiposData[equipoActivo].seasonConfig=clonar(seasonConfig||seasonDefaultConfig())};
const _cargarEquipoV510=cargarEquipoEnVariables;
cargarEquipoEnVariables=function(id){_cargarEquipoV510(id);seasonPlan=seasonNormalizePlan(equiposData?.[id]?.seasonPlan);seasonConfig=seasonNormalizeConfig(equiposData?.[id]?.seasonConfig);seasonViewOffset=0;if(!meta.exercisePlayerIds||typeof meta.exercisePlayerIds!=='object')meta.exercisePlayerIds={}};
seasonPlan=seasonNormalizePlan(equiposData?.[equipoActivo]?.seasonPlan);
seasonConfig=seasonNormalizeConfig(equiposData?.[equipoActivo]?.seasonConfig);
if(!meta.exercisePlayerIds||typeof meta.exercisePlayerIds!=='object')meta.exercisePlayerIds={};

function seasonSave(){guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();programarSubidaCloud();if($('save-indicator'))$('save-indicator').textContent='✓ Temporada guardada y sincronizable'}
function seasonShiftIso(iso,years){const d=new Date(iso+'T12:00:00');d.setFullYear(d.getFullYear()+years);return fechaLocalISO(d)}
function seasonRange(){const c=seasonNormalizeConfig(seasonConfig);return {start:seasonShiftIso(c.start,seasonViewOffset),end:seasonShiftIso(c.end,seasonViewOffset)}}
function seasonWeekMonday(iso){return isoDate(lunesDeSemana(new Date(iso+'T12:00:00')))}
function seasonWeekEnd(weekStart){const d=new Date(weekStart+'T12:00:00');d.setDate(d.getDate()+6);return isoDate(d)}
function seasonWeekRecord(ws){return seasonPlan.find(x=>x.weekStart===ws)||null}
function seasonWeekPlans(ws){const end=seasonWeekEnd(ws);return planificacion.filter(p=>p.fecha>=ws&&p.fecha<=end)}
function seasonWeekHistory(ws){const end=seasonWeekEnd(ws);return historial.filter(h=>h.fecha>=ws&&h.fecha<=end)}
function seasonMinutesSessions(list){return (list||[]).reduce((a,x)=>a+(Number(x.duracion)||minutosListaEjercicios((x.ejercicios||[]).map(enriquecerEjercicioGuardado))),0)}
function seasonWeekStats(ws){
  const rec=seasonWeekRecord(ws),plans=seasonWeekPlans(ws),done=seasonWeekHistory(ws);
  const calendarSessions=plans.length,calendarMinutes=seasonMinutesSessions(plans),realSessions=done.length,realMinutes=seasonMinutesSessions(done);
  const targetSessions=Number(rec?.targetSessions)||calendarSessions,targetMinutes=Number(rec?.targetMinutes)||calendarMinutes;
  const cSessions=targetSessions?Math.min(100,Math.round(realSessions/targetSessions*100)):(realSessions?100:0),cMinutes=targetMinutes?Math.min(100,Math.round(realMinutes/targetMinutes*100)):(realMinutes?100:0);
  const compliance=targetMinutes?cMinutes:(targetSessions?cSessions:0);
  return {rec,plans,done,calendarSessions,calendarMinutes,realSessions,realMinutes,targetSessions,targetMinutes,compliance};
}
function seasonWeeksInRange(){
  const r=seasonRange(),first=lunesDeSemana(new Date(r.start+'T12:00:00')),last=new Date(r.end+'T12:00:00'),out=[];
  for(let d=new Date(first);d<=last;d.setDate(d.getDate()+7))out.push(isoDate(d));
  return out;
}
function seasonHumanRange(ws){const a=new Date(ws+'T12:00:00'),b=new Date(a);b.setDate(a.getDate()+6);return `${a.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} — ${b.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}`}
function seasonMonthLabel(ws){return new Date(ws+'T12:00:00').toLocaleDateString('es-ES',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function seasonCurrentWeek(){return isoDate(lunesDeSemana(new Date()))}

function guardarConfigTemporada(){
  const name=String($('season-name')?.value||'').trim(),start=$('season-start')?.value||'',end=$('season-end')?.value||'',goal=String($('season-goal')?.value||'').trim();
  if(!start||!end){alert('Selecciona la fecha de inicio y final de la temporada.');return}if(start>end){alert('La fecha final debe ser posterior a la fecha de inicio.');return}
  seasonConfig={name:name||seasonDefaultConfig().name,start,end,goal};seasonViewOffset=0;seasonSave();renderPlanificacion();
}
function renderTemporada(){
  const wrap=$('season-grid'),list=$('season-week-list');if(!wrap||!list)return;const c=seasonNormalizeConfig(seasonConfig),r=seasonRange(),weeks=seasonWeeksInRange(),current=seasonCurrentWeek();
  $('season-name').value=seasonViewOffset?`${c.name} · vista ${new Date(r.start+'T12:00:00').getFullYear()}`:c.name;$('season-start').value=seasonViewOffset?r.start:c.start;$('season-end').value=seasonViewOffset?r.end:c.end;$('season-goal').value=c.goal||'';
  const stats=weeks.map(seasonWeekStats),defined=stats.filter(s=>s.rec&&(s.rec.objective||s.rec.fundamentals?.length||s.rec.targetSessions||s.rec.targetMinutes)).length;
  const targetSessions=stats.reduce((a,s)=>a+s.targetSessions,0),realSessions=stats.reduce((a,s)=>a+s.realSessions,0),targetMinutes=stats.reduce((a,s)=>a+s.targetMinutes,0),realMinutes=stats.reduce((a,s)=>a+s.realMinutes,0),comp=targetMinutes?Math.min(100,Math.round(realMinutes/targetMinutes*100)):(targetSessions?Math.min(100,Math.round(realSessions/targetSessions*100)):0);
  $('season-kpi-weeks').textContent=defined;$('season-kpi-total-weeks').textContent=`de ${weeks.length} semanas`;$('season-kpi-target-sessions').textContent=targetSessions;$('season-kpi-real-sessions').textContent=`${realSessions} realizadas`;$('season-kpi-target-min').textContent=targetMinutes;$('season-kpi-real-min').textContent=`${realMinutes} realizados`;$('season-kpi-compliance').textContent=comp+'%';$('season-progress-bar').style.width=Math.min(100,comp)+'%';$('season-progress-label').textContent=comp+'%';$('season-range-label').textContent=`${c.name}${seasonViewOffset?` · ${new Date(r.start+'T12:00:00').getFullYear()}`:''} · ${new Date(r.start+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})} — ${new Date(r.end+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}`;
  let lastMonth='';let html='';stats.forEach(s=>{const ws=s.rec?.weekStart||weeks[stats.indexOf(s)],month=seasonMonthLabel(ws);if(month!==lastMonth){html+=`<div class="season-month-label">${esc(month)}</div>`;lastMonth=month}const rec=s.rec||{},focus=(rec.fundamentals||[]).map(f=>`<span class="season-focus-chip">${esc(f)}</span>`).join(''),klass=ws===current?' current':'';const status=s.compliance>=80&&s.realSessions?' good':(s.targetSessions&&ws<current&&s.compliance<60?' warn':'');html+=`<article class="season-week-row${klass}${status}"><div class="season-week-date"><strong>${esc(seasonHumanRange(ws))}</strong><span>${ws===current?'Semana actual':seasonMatchesLabel(ws,rec)}</span></div><div class="season-week-objective"><strong>${esc(rec.objective||'Sin objetivo semanal')}</strong><small>${rec.intensity?`Intensidad ${esc(rec.intensity)}`:'Define el microciclo para orientar el trabajo.'}</small><div class="season-focus-chips">${focus}</div></div><div class="season-week-stat"><span>Objetivo</span><b>${s.targetSessions} ses. · ${s.targetMinutes} min</b></div><div class="season-week-stat calendar"><span>En calendario</span><b>${s.calendarSessions} ses. · ${s.calendarMinutes} min</b></div><div class="season-week-stat"><span>Realizado</span><b>${s.realSessions} ses. · ${s.realMinutes} min</b></div><div class="season-week-compliance"><div class="season-week-compliance-track"><i style="width:${Math.min(100,s.compliance)}%"></i></div><b>${s.compliance}%</b></div><div class="season-week-actions"><button class="ghost" onclick="abrirSemanaTemporada('${ws}')">${s.rec?'Editar':'Definir'}</button></div></article>`});
  list.innerHTML=html||'<div class="dashboard-empty">No hay semanas en el rango de temporada.</div>';
}
function abrirSemanaTemporada(ws){
  const rec=seasonWeekRecord(ws)||{weekStart:ws,objective:'',fundamentals:[],targetSessions:'',targetMinutes:'',intensity:'Media',match:'',notes:''};$('season-week-start').value=ws;$('season-week-title').textContent=`Semana · ${seasonHumanRange(ws)}`;$('season-week-subtitle').textContent='Objetivo, carga y prioridades del microciclo.';$('season-week-objective').value=rec.objective||'';$('season-week-sessions').value=rec.targetSessions??'';$('season-week-minutes').value=rec.targetMinutes??'';$('season-week-intensity').value=rec.intensity||'Media';$('season-week-match').value=rec.match||'';$('season-week-notes').value=rec.notes||'';$('season-week-foundations').innerHTML=SEASON_FOUNDATIONS.map(f=>`<label><input type="checkbox" value="${esc(f)}" ${(rec.fundamentals||[]).includes(f)?'checked':''}> ${esc(f)}</label>`).join('');$('season-week-delete').style.visibility=seasonWeekRecord(ws)?'visible':'hidden';$('season-week-modal').classList.add('open');
}
function cerrarSemanaTemporada(){$('season-week-modal')?.classList.remove('open')}
function guardarSemanaTemporada(){
  const ws=$('season-week-start').value;if(!ws)return;const foundations=[...document.querySelectorAll('#season-week-foundations input:checked')].map(x=>x.value),rec={weekStart:ws,objective:String($('season-week-objective').value||'').trim(),fundamentals:foundations,targetSessions:Math.max(0,Number($('season-week-sessions').value)||0),targetMinutes:Math.max(0,Number($('season-week-minutes').value)||0),intensity:$('season-week-intensity').value||'Media',match:String($('season-week-match').value||'').trim(),notes:String($('season-week-notes').value||'').trim(),updatedAt:new Date().toISOString()};const i=seasonPlan.findIndex(x=>x.weekStart===ws);if(i>=0)seasonPlan[i]={...seasonPlan[i],...rec};else seasonPlan.push(rec);seasonSave();cerrarSemanaTemporada();renderPlanificacion();
}
function borrarSemanaTemporada(){const ws=$('season-week-start').value;if(!ws||!seasonWeekRecord(ws))return;if(!confirm('¿Eliminar el objetivo de esta semana? Los entrenamientos del calendario y el historial no se borrarán.'))return;seasonPlan=seasonPlan.filter(x=>x.weekStart!==ws);seasonSave();cerrarSemanaTemporada();renderPlanificacion()}

const _renderPlanificacionV510=renderPlanificacion;
renderPlanificacion=function(){
  const week=$('week-grid'),month=$('month-grid'),season=$('season-grid');
  $('plan-view-week')?.classList.toggle('active',vistaPlanificacion==='semana');$('plan-view-month')?.classList.toggle('active',vistaPlanificacion==='mes');$('plan-view-season')?.classList.toggle('active',vistaPlanificacion==='temporada');
  if(vistaPlanificacion==='temporada'){week?.classList.add('hidden');month?.classList.add('hidden');season?.classList.remove('hidden');$('week-label').textContent=seasonNormalizeConfig(seasonConfig).name;renderTemporada();renderAvisoPlanHoy();return}
  season?.classList.add('hidden');_renderPlanificacionV510();$('plan-view-season')?.classList.remove('active');
};
setVistaPlanificacion=function(v){vistaPlanificacion=['semana','mes','temporada'].includes(v)?v:'semana';renderPlanificacion()};
cambiarPeriodoPlan=function(dir){if(vistaPlanificacion==='temporada'){seasonViewOffset+=dir;renderPlanificacion();return}if(vistaPlanificacion==='mes')semanaBase.setMonth(semanaBase.getMonth()+dir,1);else semanaBase.setDate(semanaBase.getDate()+dir*7);renderPlanificacion()};
irHoyPlanificacion=function(){if(vistaPlanificacion==='temporada')seasonViewOffset=0;semanaBase=new Date();renderPlanificacion()};

/* --- Asignación de jugadores a cada ejercicio --- */
function exerciseRosterMap(){if(!meta.exercisePlayerIds||typeof meta.exercisePlayerIds!=='object')meta.exercisePlayerIds={};return meta.exercisePlayerIds}
function exerciseRosterHasOwn(id){return Object.prototype.hasOwnProperty.call(exerciseRosterMap(),String(id))}
function exerciseAssignedIds(id){const map=exerciseRosterMap(),key=String(id);return exerciseRosterHasOwn(id)?(Array.isArray(map[key])?map[key].map(Number):[]):(meta.playerIds||[]).map(Number)}
function exerciseRosterNames(ids){const set=new Set((ids||[]).map(Number));return jugadoresEquipo.filter(p=>set.has(Number(p.id))).map(p=>`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name}`)}
function abrirRosterEjercicio(id){
  const roster=(meta.playerIds||[]).map(Number);if(!roster.length){alert('Primero selecciona los jugadores presentes en “Plantilla de la sesión”.');return}const e=baseDeDatos.find(x=>Number(x.id)===Number(id));if(!e)return;$('exercise-roster-id').value=id;$('exercise-roster-title').textContent=`Jugadores · ${e.nombre}`;const selected=new Set(exerciseAssignedIds(id));const rosterSet=new Set(roster);$('exercise-roster-list').innerHTML=jugadoresEquipo.filter(p=>rosterSet.has(Number(p.id))).map(p=>`<label class="exercise-roster-item"><input type="checkbox" value="${p.id}" ${selected.has(Number(p.id))?'checked':''}><span>${p.number!==''&&p.number!=null?`#${ppSafe(p.number)} · `:''}${ppSafe(p.name)} <small>· ${ppSafe(ppPositionText(p,' / '))}</small></span></label>`).join('');$('exercise-roster-info').textContent=exerciseRosterHasOwn(id)?'Asignación específica activa. Solo los seleccionados acumularán este ejercicio.':'Este ejercicio hereda toda la plantilla seleccionada para la sesión.';$('exercise-roster-modal').classList.add('open');
}
function cerrarRosterEjercicio(){$('exercise-roster-modal')?.classList.remove('open')}
function marcarRosterEjercicio(all){document.querySelectorAll('#exercise-roster-list input[type=checkbox]').forEach(x=>x.checked=!!all)}
function heredarRosterEjercicio(){const id=Number($('exercise-roster-id').value);if(!id)return;delete exerciseRosterMap()[String(id)];save();cerrarRosterEjercicio();renderizarSesion();if($('save-indicator'))$('save-indicator').textContent='✓ El ejercicio usa toda la plantilla de la sesión'}
function guardarRosterEjercicio(){const id=Number($('exercise-roster-id').value);if(!id)return;exerciseRosterMap()[String(id)]=[...document.querySelectorAll('#exercise-roster-list input:checked')].map(x=>Number(x.value));save();cerrarRosterEjercicio();renderizarSesion();if($('save-indicator'))$('save-indicator').textContent='✓ Jugadores del ejercicio guardados'}
function depurarRosterEjercicios(){const allowed=new Set((meta.playerIds||[]).map(Number)),map=exerciseRosterMap();Object.keys(map).forEach(k=>{map[k]=(Array.isArray(map[k])?map[k]:[]).map(Number).filter(id=>allowed.has(id))})}

const _guardarRosterSesionV510=guardarRosterSesion;
guardarRosterSesion=function(){_guardarRosterSesionV510();depurarRosterEjercicios();save();renderizarSesion()};
const _seleccionarRosterSesionV510=seleccionarRosterSesion;
seleccionarRosterSesion=function(all){_seleccionarRosterSesionV510(all);depurarRosterEjercicios();save();renderizarSesion()};

const _snapshotEjercicioV510=snapshotEjercicioCompleto;
snapshotEjercicioCompleto=function(e){const snap=_snapshotEjercicioV510(e);if(!snap)return snap;if(Array.isArray(e?.playerIds)){snap.playerIds=clonar(e.playerIds);return snap}const map=exerciseRosterMap(),key=String(e?.id);if(Object.prototype.hasOwnProperty.call(map,key))snap.playerIds=clonar(map[key]);return snap};

const _tarjetaSesionV510=tarjetaSesionCompactaHTML;
tarjetaSesionCompactaHTML=function(e,numero,slug){let h=_tarjetaSesionV510(e,numero,slug),ids=exerciseAssignedIds(e.id),total=(meta.playerIds||[]).length,explicit=exerciseRosterHasOwn(e.id),label=total?(explicit?`👥 ${ids.length}/${total}`:`👥 Todos · ${total}`):'👥 Sin plantilla';const chip=`<span class="session-mini-chip player-assignment-chip">${label}</span>`;h=h.replace(/(<div class="session-exercise-meta">.*?)(<\/div><\/div><div class="session-exercise-controls">)/,`$1${chip}$2`);h=h.replace('<button class="danger-menu"',`<button onclick="abrirRosterEjercicio(${e.id});this.closest('details').removeAttribute('open')">👥 Jugadores del ejercicio</button><button class="danger-menu"`);return h};

const _fichaEjercicioV510=fichaEjercicioHTML;
fichaEjercicioHTML=function(origen,numero,acciones=''){let h=_fichaEjercicioV510(origen,numero,acciones);if(Array.isArray(origen?.playerIds)){const names=exerciseRosterNames(origen.playerIds),copy=names.length?names.join(' · '):'Sin jugadores asignados',extra=`<div class="session-exercise-detail wide history-player-assignment"><b>Jugadores de este ejercicio</b><span>${esc(copy)}</span></div>`,pos=h.lastIndexOf('</div></div>');if(pos>=0)h=h.slice(0,pos)+extra+h.slice(pos)}return h};

const _usarPlanV510=usarPlan;
usarPlan=function(id){const p=planificacion.find(x=>Number(x.id)===Number(id));_usarPlanV510(id);if(!p)return;const map={};(p.ejercicios||[]).forEach(e=>{if(Array.isArray(e.playerIds))map[String(e.id)]=clonar(e.playerIds)});meta.exercisePlayerIds=map;save();renderizarSesion();renderSessionRoster()};
const _repetirSesionEquipoV510=repetirSesionEquipo;
repetirSesionEquipo=function(team,id){_repetirSesionEquipoV510(team,id);const h=historial.find(x=>Number(x.id)===Number(id));if(!h)return;meta.playerIds=clonar(h.playerIds||[]);const map={};(h.ejercicios||[]).forEach(e=>{if(Array.isArray(e.playerIds))map[String(e.id)]=clonar(e.playerIds)});meta.exercisePlayerIds=map;save();cargarMeta();renderizarSesion()};

ppWorkload=function(p,days=30){
  const cutoff=days?new Date(Date.now()-days*86400000):null,c={};let total=0,sessions=0;
  (historial||[]).forEach(h=>{const hRoster=(h.playerIds||[]).map(Number);if(!hRoster.includes(Number(p.id)))return;const d=h.fecha?new Date(h.fecha+'T12:00:00'):null;if(cutoff&&d&&d<cutoff)return;sessions++;(h.ejercicios||[]).forEach(e=>{const assigned=Array.isArray(e.playerIds)?e.playerIds.map(Number):hRoster;if(!assigned.includes(Number(p.id)))return;const fs=normalizarFundamentos(e),m=Number(e.tiempo)||0;if(!fs.length){total+=m;return}fs.forEach(f=>c[f]=(c[f]||0)+m/fs.length);total+=m})});return {byFoundation:c,total,sessions};
};
const _eliminarJugadorV510=eliminarJugador;
eliminarJugador=function(id){_eliminarJugadorV510(id);if(ppPlayer(id))return;const map=exerciseRosterMap();Object.keys(map).forEach(k=>map[k]=(map[k]||[]).map(Number).filter(x=>x!==Number(id)));save();renderizarSesion()};

renderPlanificacion();
