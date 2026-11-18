/* Volley Coach V20.4.0 · Training Pro 2.0
 * One canonical training session: the existing meta, planning, history, roster and
 * exercise catalogue. New evaluation fields are optional and never migrated at boot.
 * All user writes use the existing local save + protected cloud publisher.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='20.4.0';
 const ATTENDANCE=['Sin registrar','Presente','Parcial','Ausencia justificada','Ausencia','Lesionado'];
 const EXERCISE_STATES=['Pendiente','Hecho','Parcial','No hecho'];
 const RESULTS=['Pendiente','Sí','Parcialmente','No'];
 const arr=x=>Array.isArray(x)?x:[];
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 const clean=(value,max=3000)=>String(value??'').slice(0,max).trim();
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
 function normalizePro(raw){
  const data=obj(raw),goals=obj(data.playerGoals),exercises=obj(data.exerciseStatus);
  return {goal:clean(data.goal,500),success:clean(data.success,900),playerGoals:Object.fromEntries(Object.entries(goals).filter(([id])=>validId(id)).map(([id,value])=>[String(id),clean(value,700)])),
   exerciseStatus:Object.fromEntries(Object.entries(exercises).filter(([id])=>validId(id)).map(([id,entry])=>[String(id),{status:EXERCISE_STATES.includes(entry?.status)?entry.status:'Pendiente',notes:clean(entry?.notes,700)}])),
   evaluation:{result:RESULTS.includes(data.evaluation?.result)?data.evaluation.result:'Pendiente',review:clean(data.evaluation?.review,2000),next:clean(data.evaluation?.next,900)}};
 }
 function updatePro(raw,field,value,id=''){
  const pro=normalizePro(raw),v=clean(value,field==='review'?2000:900),key=String(id);
  if(field==='goal')pro.goal=v.slice(0,500);
  else if(field==='success')pro.success=v;
  else if(field==='player-goal'&&validId(key))pro.playerGoals[key]=v.slice(0,700);
  else if(field==='exercise-status'&&validId(key))pro.exerciseStatus[key]={...pro.exerciseStatus[key],status:EXERCISE_STATES.includes(v)?v:'Pendiente'};
  else if(field==='exercise-note'&&validId(key))pro.exerciseStatus[key]={...pro.exerciseStatus[key],notes:v.slice(0,700),status:pro.exerciseStatus[key]?.status||'Pendiente'};
  else if(field==='result')pro.evaluation.result=RESULTS.includes(v)?v:'Pendiente';
  else if(field==='review')pro.evaluation.review=v;
  else if(field==='next')pro.evaluation.next=v;
  else return null;
  return pro;
 }
 function safeVideo(url){try{const u=new URL(String(url||''));return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}}
 function report(exercises,attendance,raw){
  const pro=normalizePro(raw),statuses=arr(attendance).map(x=>String(x?.status||'Sin registrar'));
  const present=statuses.filter(x=>x==='Presente').length,partial=statuses.filter(x=>x==='Parcial').length;
  const exerciseList=arr(exercises).filter(x=>x&&validId(x.id));
  const finished=exerciseList.filter(x=>pro.exerciseStatus[String(x.id)]?.status==='Hecho').length;
  const partialExercises=exerciseList.filter(x=>pro.exerciseStatus[String(x.id)]?.status==='Parcial').length;
  const confirmed=statuses.filter(x=>x!=='Sin registrar').length;
  return {present,partial,confirmed,roster:statuses.length,finished,partialExercises,totalExercises:exerciseList.length,missingExercises:exerciseList.length-finished-partialExercises};
 }
 function summarizeHistory(history){
  const entries=arr(history).filter(h=>h&&validId(h.id)),ids=new Set();
  let reviewed=0,fullyCompleted=0,attendanceConfirmed=0;
  for(const h of entries){
   if(ids.has(String(h.id)))continue;ids.add(String(h.id));
   const pro=normalizePro(h.trainingPro),r=report(h.ejercicios,h.attendanceStatus,pro);
   if(pro.evaluation.result!=='Pendiente')reviewed++;
   fullyCompleted+=r.finished;attendanceConfirmed+=r.confirmed;
  }
  return {sessions:ids.size,reviewed,fullyCompleted,attendanceConfirmed};
 }
 function options(values,current){return values.map(v=>`<option value="${escape(v)}"${v===current?' selected':''}>${escape(v)}</option>`).join('')}
 function state(){
  if(typeof meta==='undefined'||typeof sesionActual==='undefined'||typeof baseDeDatos==='undefined'||typeof jugadoresEquipo==='undefined'||typeof historial==='undefined')return null;
  const library=arr(baseDeDatos),byId=new Map(library.filter(e=>e&&validId(e.id)).map(e=>[String(e.id),e]));
  const exercises=arr(sesionActual).map(id=>byId.get(String(id))).filter(Boolean);
  const players=arr(jugadoresEquipo).filter(p=>p&&validId(p.id)).slice().sort((a,b)=>{
   const na=Number(a.number),nb=Number(b.number);return Number.isFinite(na)&&Number.isFinite(nb)&&String(a.number)!==''&&String(b.number)!==''?na-nb:String(a.name||'').localeCompare(String(b.name||''),'es');
  });
  return {meta,exercises,players,history:arr(historial),plans:typeof planificacion!=='undefined'?arr(planificacion):[],team:typeof equipoActivo==='undefined'?'':String(equipoActivo)};
 }
 function attendanceRows(data){
  const rows=arr(data.meta.attendanceStatus);
  return data.players.map(p=>{
   const matches=rows.filter(r=>String(r?.id)===String(p.id)),row=matches.length===1?matches[0]:null;
   const conflict=matches.length>1||!!(row?.name&&clean(row.name)!==clean(p.name));
   const planned=arr(data.meta.playerIds).some(id=>String(id)===String(p.id));
   // Being on the planned player list never proves a player actually attended.
   return {id:String(p.id),name:clean(p.name,150),number:p.number,status:conflict?'Sin registrar':ATTENDANCE.includes(row?.status)?row.status:'Sin registrar',conflict,planned};
  });
 }
 let shell=null,historyBox=null,mode='plan',historyId='',lastTeam='',lastHistoryTeam='',notice='',refreshQueued=false;
 const $=id=>document.getElementById(id);
 function summaryHtml(r){return `<div class="vc2040-metrics"><div><small>Presentes</small><strong>${r.present}</strong><span>${r.partial} parciales · ${r.confirmed} estados registrados</span></div><div><small>Ejercicios hechos</small><strong>${r.finished}/${r.totalExercises}</strong><span>${r.partialExercises} parciales</span></div><div><small>Sin verificar</small><strong>${Math.max(0,r.roster-r.confirmed)}</strong><span>Jugadores sin asistencia registrada</span></div></div>`}
 function exerciseList(data,pro){
  if(!data.exercises.length)return '<p class="vc2040-empty">No hay ejercicios en esta sesión. Añádelos en Planificar.</p>';
  return data.exercises.map((e,i)=>{
   const id=String(e.id),record=pro.exerciseStatus[id]||{},video=safeVideo(e.video)||arr(e.videosReferencia).map(safeVideo).find(Boolean)||'';
   return `<div class="vc2040-exercise"><div class="vc2040-exercise-head"><div><b>${i+1}. ${escape(e.nombre||'Ejercicio')}</b><small>${Number(e.tiempo)||0} min previstos · ${escape(e.tipo||e.fase||'Trabajo técnico')}</small></div>${video?`<a href="${escape(video)}" rel="noopener noreferrer" target="_blank">▶ Vídeo</a>`:'<span class="vc2040-unlinked">Sin vídeo</span>'}</div><div class="vc2040-exercise-fields"><label>Estado<select data-vc2040-field="exercise-status" data-vc2040-id="${escape(id)}">${options(EXERCISE_STATES,record.status||'Pendiente')}</select></label><label>Observación<input data-vc2040-field="exercise-note" data-vc2040-id="${escape(id)}" value="${escape(record.notes||'')}" placeholder="Qué funcionó o qué mejorar"></label></div></div>`;
  }).join('');
 }
 function playerGoalsHtml(data,pro){return data.players.length?data.players.map(row=>`<label class="vc2040-goal"><span>${escape(row.number==null||row.number===''?'':('#'+row.number+' · '))}${escape(row.name||'Jugador')}</span><input data-vc2040-field="player-goal" data-vc2040-id="${escape(row.id)}" value="${escape(pro.playerGoals[String(row.id)]||'')}" maxlength="700" placeholder="Consigna individual"></label>`).join(''):'<p class="vc2040-empty">Añade jugadores para definir objetivos individuales.</p>'}
 function renderCurrent(){
  if(!shell)return;
  const data=state();if(!data)return;
  if(data.team!==lastTeam){lastTeam=data.team;mode='plan';}
  const pro=normalizePro(data.meta.trainingPro),row=attendanceRows(data),r=report(data.exercises,row,pro);
  const plan=data.plans.find(p=>String(p.id)===String(data.meta.planificacionId||''));
  shell.querySelectorAll('[data-vc2040-tab]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.vc2040Tab===mode?'true':'false')});
  ['plan','live','review'].forEach(name=>{const view=$('vc2040-'+name);if(view)view.hidden=name!==mode});
  const planner=$('vc186-planner');if(planner){planner.classList.remove('vc2040-mode-plan','vc2040-mode-live','vc2040-mode-review');planner.classList.add('vc2040-mode-'+mode)}
  $('vc2040-context').textContent=`${data.meta.fecha||'Sin fecha'} · ${data.exercises.length} ejercicios · ${plan?(plan.realizado?'Plan realizado':'Planificación vinculada'):'Borrador sin planificación'}`;
  $('vc2040-plan').innerHTML=`<div class="vc2040-block"><div class="vc2040-block-head"><div><h3>Objetivos de trabajo</h3><p>Conectados con esta sesión y su planificación, sin modificar los ejercicios originales.</p></div><span class="vc2040-pill">PASO 1 / 3</span></div><div class="vc2040-two"><label>Objetivo colectivo específico<textarea maxlength="500" rows="2" data-vc2040-field="goal" placeholder="Qué habilidad queremos conseguir">${escape(pro.goal)}</textarea></label><label>Criterio para valorar el éxito<textarea maxlength="900" rows="2" data-vc2040-field="success" placeholder="Qué observarás en la sesión">${escape(pro.success)}</textarea></label></div><details><summary>Objetivos individuales (${data.players.length} jugadores)</summary><div class="vc2040-goal-grid">${playerGoalsHtml(data,pro)}</div></details></div>`;
  $('vc2040-live').innerHTML=`<div class="vc2040-block"><div class="vc2040-block-head"><div><h3>Registro rápido del entrenamiento</h3><p>El vídeo del ejercicio seleccionado permanece arriba. A la derecha tienes la asistencia original.</p></div><span class="vc2040-pill">${r.finished}/${r.totalExercises} hechos</span></div><div class="vc2040-exercises">${exerciseList(data,pro)}</div><details><summary>Objetivos individuales y consignas</summary><div class="vc2040-goal-grid">${playerGoalsHtml(data,pro)}</div></details><div class="vc2040-actions"><button type="button" data-vc2040-action="review" class="vc2040-primary">Ir a Evaluar →</button></div></div>`;
  $('vc2040-review').innerHTML=`${summaryHtml(r)}<div class="vc2040-columns"><article class="vc2040-block"><h3>Evaluación del entrenador</h3><p class="vc2040-help">La planificación y los hechos registrados permanecen separados.</p><div class="vc2040-two"><label>Objetivo conseguido<select data-vc2040-field="result">${options(RESULTS,pro.evaluation.result)}</select></label><label>Criterio previsto<textarea rows="2" data-vc2040-field="success">${escape(pro.success)}</textarea></label></div><label>Valoración de esta sesión<textarea rows="4" data-vc2040-field="review" maxlength="2000" placeholder="Qué ha funcionado y por qué">${escape(pro.evaluation.review)}</textarea></label><label>Qué trabajar a continuación<textarea rows="3" data-vc2040-field="next" maxlength="900" placeholder="Propuesta para la siguiente sesión">${escape(pro.evaluation.next)}</textarea></label></article><article class="vc2040-block"><h3>Comprobación antes del cierre</h3><div class="vc2040-check">${r.totalExercises?'✓':'!'} ${r.totalExercises} ejercicios planificados, ${r.finished} confirmados como hechos</div><div class="vc2040-check">${r.confirmed===r.roster?'✓':'!'} ${r.confirmed} de ${r.roster} asistencias verificadas</div><div class="vc2040-check">${pro.evaluation.result!=='Pendiente'?'✓':'!'} Valoración del objetivo: ${escape(pro.evaluation.result)}</div><p class="vc2040-help">Finalizar utiliza el guardado original de Historial. Si existe un plan pendiente, tendrás que marcarlo «Realizado» en el calendario, como hasta ahora.</p><div class="vc2040-actions"><button type="button" data-vc2040-action="finish" class="vc2040-primary">Finalizar y guardar en Historial</button><button type="button" data-vc2040-action="calendar">Ver calendario</button></div></article></div>`;
  $('vc2040-notice').textContent=notice||'Los cambios de campos y selectores se guardan localmente al salir del campo. El estado real de nube se consulta en el indicador original de sincronización.';
 }
 function saveCurrentField(field,id,value){
  const data=state();if(!data)return;
  const next=updatePro(data.meta.trainingPro,field,value,id);if(!next)return;
  data.meta.trainingPro=next;
  if(typeof save==='function')save();
  notice='Seguimiento guardado en la sesión actual.';
  renderCurrent();
 }
 function saveHistoryField(field,value){
  const data=state(),h=data?.history.find(x=>String(x.id)===historyId);if(!h)return;
  const next=updatePro(h.trainingPro,field,value);if(!next)return;
  h.trainingPro=next;h.updatedAt=new Date().toISOString();
  // History edits should NOT call save(), which also rewrites a currently linked plan.
  if(typeof guardarEquipoEnMemoria==='function')guardarEquipoEnMemoria();
  if(typeof equiposData!=='undefined'&&typeof equipoActivo!=='undefined'&&equiposData?.[equipoActivo])equiposData[equipoActivo].trainingUpdatedAt=h.updatedAt;
  if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
  if(typeof programarSubidaCloud==='function')programarSubidaCloud();
  notice='Evaluación del historial guardada localmente. Comprueba la nube en su indicador oficial.';
  renderHistory();
 }
 function renderHistory(){
  if(!historyBox)return;
  const data=state();if(!data)return;
  if(data.team!==lastHistoryTeam){historyId='';lastHistoryTeam=data.team;}
  const histories=data.history.slice().filter(h=>h&&validId(h.id)).sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||''))||Number(b.id)-Number(a.id));
  const trend=summarizeHistory(histories),trendBox=$('vc2040-history-trend');
  if(trendBox)trendBox.innerHTML=`<div><strong>${trend.sessions}</strong><span>Sesiones en Historial</span></div><div><strong>${trend.reviewed}</strong><span>Objetivos evaluados</span></div><div><strong>${trend.fullyCompleted}</strong><span>Ejercicios «Hecho»</span></div><div><strong>${trend.attendanceConfirmed}</strong><span>Estados de asistencia registrados</span></div>`;
  if(!histories.some(x=>String(x.id)===historyId))historyId=histories.length?String(histories[0].id):'';
  const record=histories.find(x=>String(x.id)===historyId);
  const picker=$('vc2040-history-picker');if(picker)picker.innerHTML=histories.map(h=>`<option value="${escape(h.id)}"${String(h.id)===historyId?' selected':''}>${escape(h.fecha||'Sin fecha')} · ${escape(clean(h.objetivo,90)||'Entrenamiento')} · ${escape(h.id)}</option>`).join('');
  const details=$('vc2040-history-detail');if(!details)return;
  if(!record){details.innerHTML='<p class="vc2040-empty">Finaliza un entrenamiento para consultar su evaluación y evolución en el historial.</p>';return}
  const pro=normalizePro(record.trainingPro),attendance=arr(record.attendanceStatus),r=report(record.ejercicios,attendance,pro);
  const played=arr(record.ejercicios).filter(e=>pro.exerciseStatus[String(e?.id)]?.status==='Hecho');
  details.innerHTML=`${summaryHtml(r)}<div class="vc2040-history-columns"><div><h4>${escape(record.objetivo||'Sesión sin objetivo')}</h4><p class="vc2040-help">${escape(record.fecha||'Sin fecha')} · ${Number(record.duracion)||0} minutos planificados · ${record.planificacionId?'Vinculado a Planificación':'Sin plan vinculado'}</p><p><b>Objetivo específico:</b> ${escape(pro.goal||'No registrado')}</p><p><b>Criterio:</b> ${escape(pro.success||'No registrado')}</p><p><b>Ejercicios marcados como hechos:</b> ${played.length?played.map(x=>escape(x.nombre||'Ejercicio')).join(' · '):'Sin confirmar'}</p></div><div><label>Resultado del objetivo<select data-vc2040-history="result">${options(RESULTS,pro.evaluation.result)}</select></label><label>Valoración<textarea data-vc2040-history="review" rows="3" maxlength="2000">${escape(pro.evaluation.review)}</textarea></label><label>Próximo objetivo<textarea data-vc2040-history="next" rows="2" maxlength="900">${escape(pro.evaluation.next)}</textarea></label></div></div>`;
 }
 function navigate(view){if(typeof showView==='function')showView(view,typeof botonVista==='function'?botonVista(view):null)}
 function schedule(){if(refreshQueued)return;refreshQueued=true;const callback=()=>{refreshQueued=false;renderCurrent();renderHistory()};if(typeof requestAnimationFrame==='function')requestAnimationFrame(callback);else queueMicrotask(callback)}
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(shell)return true;
   const host=doc.getElementById('vc186-planner'),history=doc.getElementById('historial-list');if(!host||!history)return false;
   const layout=host.querySelector('.vc186-layout'),editor=host.querySelector('.vc186-editor'),attendance=host.querySelector('#vc186-attendance');
   const canonicalRoster=doc.querySelector('#entrenamiento .session-roster');
   if(!layout||!editor||!attendance||!canonicalRoster||!canonicalRoster.querySelector('#session-roster-grid'))return false;
   shell=doc.createElement('section');shell.id='vc2040-shell';shell.innerHTML=`<div class="vc2040-top"><div><span>VOLLEY COACH · TRAINING PERFORMANCE CENTER · V${VERSION}</span><h2>Entrenamientos profesionales</h2><p id="vc2040-context">Sesión actual</p></div><div class="vc2040-top-right"><div class="vc2040-actions-nav"><button type="button" data-vc2040-action="calendar">Calendario</button><button type="button" data-vc2040-action="library">Biblioteca</button><button type="button" data-vc2040-action="templates">Plantillas</button><button type="button" data-vc2040-action="new">＋ Nueva sesión</button></div><div class="vc2040-tabs" role="tablist" aria-label="Fases del entrenamiento"><button type="button" role="tab" data-vc2040-tab="plan">01 Preparar</button><button type="button" role="tab" data-vc2040-tab="live">02 Modo directo</button><button type="button" role="tab" data-vc2040-tab="review">03 Evaluar</button></div></div></div><section id="vc2040-plan" class="vc2040-panel"></section><section id="vc2040-live" class="vc2040-panel" hidden></section><section id="vc2040-review" class="vc2040-panel" hidden></section><p id="vc2040-notice" class="vc2040-notice" role="status"></p>`;
   const oldHeader=host.querySelector('.vc186-header');if(oldHeader)oldHeader.after(shell);else host.prepend(shell);
   // Keep the ORIGINAL planner/editor/roster nodes (and their delegated events).
   // Only relocate the one canonical attendance component into a third column.
   const inspector=doc.createElement('aside');inspector.id='vc2040-inspector';inspector.innerHTML='<div class="vc2040-inspector-title"><strong>Jugadores y objetivos</strong><small>Asistencia verificada · registro original</small><button type="button" data-act="manage-players">Gestionar jugadores</button></div>';
   inspector.appendChild(canonicalRoster);
   canonicalRoster.open=true;
   // V18.6 selection checkboxes remain available in DOM for their old code,
   // but never show a SECOND attendance control that could disagree.
   inspector.appendChild($('vc2040-plan'));
   layout.appendChild(inspector);
   editor.appendChild($('vc2040-live'));
   host.classList.add('vc2040-ready');
   if(typeof renderSessionRoster==='function')renderSessionRoster();
   historyBox=doc.createElement('section');historyBox.id='vc2040-history';historyBox.innerHTML=`<div class="vc2040-history-head"><div><span>TRAINING CENTER · HISTORIAL</span><h3>Evaluación de entrenamientos</h3><p>Consulta datos registrados en el equipo activo, sin estimar resultados que no se anotaron.</p></div><label>Entrenamiento guardado<select id="vc2040-history-picker"></select></label></div><div id="vc2040-history-trend" class="vc2040-trend" aria-label="Evolución registrada del equipo"></div><div id="vc2040-history-detail"></div>`;
   history.before(historyBox);
   host.addEventListener('click',event=>{
    const tab=event.target.closest('[data-vc2040-tab]');if(tab){mode=tab.dataset.vc2040Tab;renderCurrent();return}
    const action=event.target.closest('[data-vc2040-action]')?.dataset.vc2040Action;
    if(action==='review'){mode='review';renderCurrent();}
    if(action==='calendar')navigate('planificacion');
    if(action==='library')navigate('ejercicios');
    if(action==='templates'&&typeof abrirModalPlantillas==='function')abrirModalPlantillas('usar');
    if(action==='new'&&typeof nuevaSesionVacia==='function')nuevaSesionVacia();
    if(action==='finish'&&typeof finalizarEntrenamiento==='function'){
     const data=state(),oldMeta=data?.meta;
     finalizarEntrenamiento();
     if(state()?.meta!==oldMeta){mode='plan';navigate('historial')}
     schedule();
    }
   });
   host.addEventListener('change',event=>{
    const target=event.target,field=target.dataset.vc2040Field;
    if(field)saveCurrentField(field,target.dataset.vc2040Id||'',target.value);
   });
   historyBox.addEventListener('change',event=>{
    if(event.target.id==='vc2040-history-picker'){historyId=event.target.value;renderHistory();return}
    const field=event.target.dataset.vc2040History;if(field)saveHistoryField(field,event.target.value);
   });
   const list=doc.getElementById('lista-sesion');if(list&&root.MutationObserver)new root.MutationObserver(schedule).observe(list,{childList:true});
   const originalAttendance=doc.getElementById('vc186-attendance-summary');if(originalAttendance&&root.MutationObserver)new root.MutationObserver(schedule).observe(originalAttendance,{childList:true,characterData:true,subtree:true});
   if(root.MutationObserver){
    new root.MutationObserver(()=>{if(doc.getElementById('entrenamiento')?.classList.contains('active')||doc.getElementById('historial')?.classList.contains('active'))schedule()}).observe(doc.getElementById('entrenamiento'),{attributes:true,attributeFilter:['class']});
    new root.MutationObserver(schedule).observe(history,{childList:true});
   }
   const teamName=doc.getElementById('v11-team-name');if(teamName&&root.MutationObserver)new root.MutationObserver(schedule).observe(teamName,{childList:true,characterData:true,subtree:true});
   renderCurrent();renderHistory();
   root.VC2040_TRAINING_PRO={version:VERSION,refresh:schedule,diagnostics:()=>({version:VERSION,mode,historyId,team:state()?.team,hasCanonicalRoster:!!doc.getElementById('session-roster-grid')})};
   return true;
  }
  let tries=0;function retry(){if(start())return;if(++tries<40)root.setTimeout(retry,200)}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',retry,{once:true});else retry();
  return true;
 }
 return {VERSION,ATTENDANCE,EXERCISE_STATES,RESULTS,normalizePro,updatePro,safeVideo,report,summarizeHistory,mount};
});
