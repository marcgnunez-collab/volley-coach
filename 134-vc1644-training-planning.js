/* Volley Coach V16.4.4 · Training & Planning Integration
   Read-only cross-checks of the existing training / planning / attendance models.
   All writes delegate to the ORIGINAL app actions. This module does not persist data. */
(()=>{
'use strict';
if(window.VC_TRAINING_PLANNING_1644)return;
const $=id=>document.getElementById(id), arr=v=>Array.isArray(v)?v:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0};
const norm=v=>String(v??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
const fs=e=>[...new Set((Array.isArray(e?.fundamentos)?e.fundamentos:Array.isArray(e?.fundamento)?e.fundamento:typeof e?.fundamento==='string'?[e.fundamento]:[]).map(v=>String(v||'').trim()).filter(Boolean))];
const fmt=v=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:1});
const dateOnly=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
const dayBack=(today,days)=>{const date=new Date(today+'T12:00:00');if(Number.isNaN(date.getTime()))return '';date.setDate(date.getDate()-days+1);return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')};
function analyzePDF(exercises){
 const bySkill=new Map();let total=0,unclassified=0,missing=0,zero=0,multiple=0;
 const rows=arr(exercises).map(e=>{
  const minutes=number(e?.tiempo),list=fs(e);total+=minutes;
  if(!minutes)zero++;
  if(!list.length){missing++;unclassified+=minutes}else{
   if(list.length>1)multiple++;
   for(const name of list)bySkill.set(name,(bySkill.get(name)||0)+minutes/list.length);
  }
  return {id:String(e?.id??''),name:String(e?.nombre||'Ejercicio'),minutes,skills:list,alloc:list.length?minutes/list.length:0};
 });
 return {rows,total,unclassified,missing,zero,multiple,bySkill:[...bySkill].sort((a,b)=>b[1]-a[1])};
}
function analyzePlans({plans=[],meta={},exerciseIds=[],today='',limit=5}={}){
 const list=arr(plans).filter(p=>p&&p.id!=null);
 const linkId=String(meta?.planificacionId??'').trim();
 const linked=linkId?list.find(p=>String(p.id)===linkId)||null:null;
 const broken=!!linkId&&!linked;
 const now=String(today||'');
 const future=list.filter(p=>!p.realizado).sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))||String(a.id).localeCompare(String(b.id)));
 const pendingHistory=future.filter(p=>p.historialId&&!p.realizado);
 const upcoming=future.filter(p=>!now||String(p.fecha||'')>=now).slice(0,limit);
 let changed=false;
 if(linked){
  const a=arr(exerciseIds).map(String).join('|');
  const b=arr(linked.ejercicios).map(e=>String(e?.id??e)).join('|');
  changed=a!==b||String(meta.objetivo||'').trim()!==String(linked.objetivo||'').trim()||String(meta.fecha||'')!==String(linked.fecha||'');
 }
 return {linked,broken,changed,upcoming,pendingHistory,planningCount:list.length,completed:list.filter(p=>p.realizado).length};
}
function analyzePlayerLoad({players=[],history=[],days=28,today=''}={}){
 const end=dateOnly(today),start=end?dayBack(end,Math.max(1,Math.min(365,Math.floor(Number(days)||28)))):'';
 const seen=new Set();
 const sessions=arr(history).filter(h=>{
  if(!h||!dateOnly(h.fecha))return false;
  if(start&&(h.fecha<start||h.fecha>end))return false;
  const key=h.id!=null?String(h.id):null;
  if(key&&seen.has(key))return false;
  if(key)seen.add(key);
  return true;
 });
 const rows=arr(players).filter(p=>p?.id!=null&&String(p.id)!=='').map(p=>{
  const id=String(p.id),name=String(p.name||p.nombre||`Jugador ${id}`),needle=norm(name);
  let present=0,partial=0,unverified=0,minutes=0;
  for(const h of sessions){
   const a=arr(h.attendanceStatus).filter(r=>String(r?.id)===id);
   if(a.length!==1){if(arr(h.playerIds).some(x=>String(x)===id)||a.length>1)unverified++;continue}
   const entry=a[0];
   // Same ID is not enough when different players may reuse it between seasons.
   if(!entry.name||!needle||norm(entry.name)!==needle){unverified++;continue}
   if(entry.status==='Presente'){
    present++;
    const duration=number(h.duracion)||arr(h.ejercicios).reduce((sum,e)=>sum+number(e?.tiempo),0);
    minutes+=duration;
   }else if(entry.status==='Parcial'){partial++}
  }
  return {id,name,present,partial,unverified,minutes};
 });
 return {days:Math.floor(Number(days)||28),from:start,to:end,sessions:sessions.length,rows};
}
function liveSnapshot(){
 // Global classic-script variables of the existing core. Access only, never reassign.
 if(typeof planificacion==='undefined'||typeof historial==='undefined'||typeof meta==='undefined'||typeof jugadoresEquipo==='undefined')return null;
 const session=window.VC_TRAINING_PRO_1643?.snapshot?.();
 if(!session)return null;
 const today=new Date(),iso=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 return {session,plans:arr(planificacion),history:arr(historial),meta,players:arr(jugadoresEquipo),today:iso};
}
let root=null,observer=null,queued=false,days=28,selectedPlayer='',showPdf=false;
function planTitle(p){return `${esc(p?.fecha||'Sin fecha')} · ${esc(p?.objetivo||'Sin objetivo')}`}
function statusLabel(p){return p?.realizado?'Realizado':p?.historialId?'En historial · pendiente de confirmar':'Pendiente'}
function render(){
 if(!root)return;
 const raw=liveSnapshot();if(!raw){const status=$('vc1644-status');if(status)status.textContent='Los datos de entrenamiento todavía no están disponibles.';return}
 const {session,plans,history,meta,players,today}=raw;
 const plan=analyzePlans({plans,meta,exerciseIds:session.exercises.map(e=>e.id),today});
 const pdf=analyzePDF(session.exercises),load=analyzePlayerLoad({players,history,days,today});
 const link=plan.linked?`<strong>${planTitle(plan.linked)}</strong><span class="vc1644-chip">${esc(statusLabel(plan.linked))}</span>${plan.changed?'<p class="vc1644-warn">La sesión abierta tiene cambios respecto al plan guardado. Usa «Guardar planificación» para actualizarlos.</p>':''}`:
  plan.broken?'<p class="vc1644-warn">El identificador de planificación de esta sesión no existe en el equipo activo. No se enlaza automáticamente con otra sesión.</p>':'<p>Esta sesión todavía no está vinculada a un registro de Planificación.</p>';
 $('vc1644-link').innerHTML=link;
 $('vc1644-plans').innerHTML=plan.upcoming.length?plan.upcoming.map(p=>`<div class="vc1644-plan"><div><strong>${planTitle(p)}</strong><small>${arr(p.ejercicios).length} ejercicios · ${fmt(number(p.duracion)||arr(p.ejercicios).reduce((s,e)=>s+number(e?.tiempo),0))} min</small></div><button type="button" data-action="open" data-id="${esc(p.id)}">Abrir</button></div>`).join(''):'<p class="vc1644-muted">No hay próximas sesiones pendientes.</p>';
 $('vc1644-pending').innerHTML=plan.pendingHistory.length?`<p class="vc1644-warn">${plan.pendingHistory.length} sesión(es) están en Historial pero aún no se han marcado como realizadas en Planificación.</p>`:'';
 $('vc1644-pdf-status').innerHTML=`<b>${pdf.rows.length} ejercicios</b> · ${pdf.multiple} con varios fundamentos · ${fmt(pdf.total)} min previstos${pdf.missing||pdf.zero?`<p class="vc1644-warn">${pdf.missing} ejercicios sin fundamentos · ${pdf.zero} sin minutos</p>`:''}`;
 const table=$('vc1644-pdf-table');table.hidden=!showPdf;
 if(showPdf)table.innerHTML=`<div class="vc1644-scroll"><table><thead><tr><th>Ejercicio</th><th>Fundamentos incluidos</th><th>Minutos</th></tr></thead><tbody>${pdf.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.skills.map(esc).join(' + ')||'Sin registrar'}</td><td>${fmt(r.minutes)}</td></tr>`).join('')}</tbody></table></div><small>La vista previa muestra los fundamentos completos que el generador PDF recibe de cada ejercicio. No sustituye la revisión del PDF descargado.</small>`;
 $('vc1644-pdf-toggle').textContent=showPdf?'Ocultar comprobación':'Comprobar contenido PDF';
 const chooser=$('vc1644-player'),ids=load.rows.map(r=>r.id);
 if(!ids.includes(selectedPlayer))selectedPlayer=ids[0]||'';
 chooser.innerHTML=load.rows.map(r=>`<option value="${esc(r.id)}" ${r.id===selectedPlayer?'selected':''}>${esc(r.name)}</option>`).join('');
 chooser.disabled=!load.rows.length;
 $('vc1644-days').value=String(days);
 const row=load.rows.find(r=>r.id===selectedPlayer);
 $('vc1644-load').innerHTML=row?`<div class="vc1644-stats"><div><span>Asistencias completas</span><strong>${row.present}</strong></div><div><span>Minutos de sesiones asistidas</span><strong>${fmt(row.minutes)}</strong></div><div><span>Asistencias parciales</span><strong>${row.partial}</strong></div><div><span>Registros sin verificar</span><strong>${row.unverified}</strong></div></div>`:'<p class="vc1644-muted">Añade jugadores a la plantilla y registra su asistencia para consultar el seguimiento.</p>';
 $('vc1644-status').textContent=`${load.sessions} sesiones de Historial entre ${load.from||'—'} y ${load.to||'—'} · ${plan.planningCount} sesiones planificadas.`;
}
function refresh(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;try{render()}catch(err){console.error('Training Planning Pro',err);if($('vc1644-status'))$('vc1644-status').textContent='No se pudo actualizar el panel. El entrenamiento original sigue disponible.'}})}
function activate(action,id){
 if(action==='refresh'){refresh();return}
 if(action==='pdf'){showPdf=!showPdf;refresh();return}
 if(action==='planning'){
  if(typeof showView==='function')showView('planificacion',typeof botonVista==='function'?botonVista('planificacion'):null);
  return;
 }
 if(action==='save'){
  if(typeof guardarSesionEnPlanificacion==='function'){
   const result=guardarSesionEnPlanificacion(false);
   if(result)refresh();
  }
  return;
 }
 if(action==='open'){
  const raw=liveSnapshot(),plan=raw?.plans.find(p=>String(p.id)===String(id));
  if(!plan)return;
  if(raw.session.count>0||String(raw.meta.objetivo||'').trim()){
   if(!confirm('Abrir esta sesión sustituirá la sesión de trabajo actual. Antes guarda los cambios en Planificación o descarga una copia. ¿Continuar?'))return;
  }
  if(typeof usarPlan==='function'){usarPlan(Number(id));refresh()}
 }
}
function mount(){
 if(root)return true;
 const panel=$('vc1643-training-pro'),target=panel?.querySelector('.vc1643-content');if(!target||!window.VC_TRAINING_PRO_1643)return false;
 const style=document.createElement('style');style.id='vc1644-style';style.textContent=CSS;document.head.appendChild(style);
 root=document.createElement('section');root.id='vc1644-training-planning';root.innerHTML=`<div class="vc1644-head"><div><span>TRAINING + PLANNING · V16.4.4</span><h4>Planificación y seguimiento</h4><p>Consulta la sesión, comprueba el PDF y revisa la asistencia registrada.</p></div><button type="button" data-action="refresh">Actualizar</button></div><div class="vc1644-body"><div class="vc1644-grid"><article class="vc1644-card"><div class="vc1644-title"><h5>Vínculo con planificación</h5><button type="button" data-action="planning">Ver calendario</button></div><div id="vc1644-link"></div><div class="vc1644-actions"><button type="button" data-action="save">Guardar planificación</button></div><div id="vc1644-pending"></div><h6>Próximas sesiones</h6><div id="vc1644-plans"></div></article><article class="vc1644-card"><div class="vc1644-title"><h5>Control del PDF</h5><button type="button" id="vc1644-pdf-toggle" data-action="pdf">Comprobar contenido PDF</button></div><p id="vc1644-pdf-status"></p><div id="vc1644-pdf-table" hidden></div><p class="vc1644-muted">Utiliza «PDF original» del panel de preparación para generar el documento. Aquí solo se revisan los fundamentos incluidos.</p></article></div><article class="vc1644-card vc1644-load"><div class="vc1644-title"><div><h5>Seguimiento individual</h5><p>Minutos de sesiones con asistencia «Presente», no carga física medida.</p></div><div class="vc1644-selectors"><label>Periodo<select id="vc1644-days"><option value="7">7 días</option><option value="28">28 días</option><option value="56">56 días</option></select></label><label>Jugador<select id="vc1644-player"></select></label></div></div><div id="vc1644-load"></div><p class="vc1644-muted">Las asistencias parciales no suman minutos: se desconoce su duración. Los registros antiguos sin nombre o con una identidad distinta se muestran como no verificados.</p></article><p id="vc1644-status" class="vc1644-status"></p></div>`;
 const first=target.querySelector('.vc1643-grid');if(first)target.insertBefore(root,first);else target.appendChild(root);
 root.addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(btn&&root.contains(btn))activate(btn.dataset.action,btn.dataset.id||'')});
 $('vc1644-days').addEventListener('change',e=>{days=Number(e.target.value)||28;refresh()});
 $('vc1644-player').addEventListener('change',e=>{selectedPlayer=e.target.value;refresh()});
 // Training Pro already observes changes to the original session; observe its
 // summary so this panel refreshes without wrapping core functions or storage.
 const summary=$('vc1643-summary');if(summary&&typeof MutationObserver!=='undefined'){
  observer=new MutationObserver(refresh);observer.observe(summary,{childList:true});
 }
 const view=$('entrenamiento');if(view&&typeof MutationObserver!=='undefined'){
  new MutationObserver(()=>{if(view.classList.contains('active'))refresh()}).observe(view,{attributes:true,attributeFilter:['class']});
 }
 refresh();return true;
}
const CSS=`
#vc1644-training-planning,#vc1644-training-planning *{box-sizing:border-box}
#vc1644-training-planning{border:1px solid #d5e2eb;border-radius:14px;background:#f5f9fc;overflow:hidden;color:#24455e;font:500 12px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;min-width:0}
#vc1644-training-planning .vc1644-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;background:#eaf3f9;border-bottom:1px solid #d8e6ef}
#vc1644-training-planning .vc1644-head span{font-size:9px;letter-spacing:.12em;font-weight:900;color:#467e9e}
#vc1644-training-planning .vc1644-head h4{font:850 17px system-ui!important;color:#153e5c!important;margin:2px 0!important}
#vc1644-training-planning .vc1644-head p{margin:0;font-size:11px;color:#6b869a}
#vc1644-training-planning button{cursor:pointer;min-height:31px!important;border:1px solid #c5dce9!important;border-radius:8px!important;padding:7px 11px!important;color:#1c5f88!important;background:#fff!important;font:800 10px system-ui!important;white-space:normal!important}
#vc1644-training-planning button:focus-visible,#vc1644-training-planning select:focus-visible{outline:3px solid #8ac2e8;outline-offset:2px}
#vc1644-training-planning .vc1644-body{padding:13px;display:grid;gap:12px;min-width:0}
#vc1644-training-planning .vc1644-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#vc1644-training-planning .vc1644-card{min-width:0;border:1px solid #dce7ef;background:#fff;border-radius:11px;padding:13px;display:grid;align-content:start;gap:9px}
#vc1644-training-planning .vc1644-title{display:flex;justify-content:space-between;gap:9px;align-items:start;flex-wrap:wrap}
#vc1644-training-planning h5{color:#174562!important;font:850 13px system-ui!important;margin:1px 0 4px!important}
#vc1644-training-planning h6{color:#607f97!important;font:800 10px system-ui!important;margin:9px 0 0!important}
#vc1644-training-planning p{margin:0;line-height:1.5}
#vc1644-training-planning #vc1644-link{display:grid;gap:6px}
#vc1644-training-planning .vc1644-chip{width:max-content;color:#24694f;border-radius:5px;background:#eaf7f0;padding:4px 7px;font-size:10px;font-weight:800}
#vc1644-training-planning .vc1644-plan{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid #edf2f6;padding:8px 0}
#vc1644-training-planning .vc1644-plan>div{min-width:0;display:grid;gap:3px}
#vc1644-training-planning .vc1644-plan strong{font-size:11px;font-weight:750}
#vc1644-training-planning .vc1644-plan small{font-size:10px;color:#8198a8}
#vc1644-training-planning .vc1644-warn{padding:9px;border-radius:7px;background:#fff5e6;color:#805c2e;border:1px solid #f1dfc0;font-size:11px}
#vc1644-training-planning .vc1644-muted{font-size:10px;color:#70899e}
#vc1644-training-planning .vc1644-actions{display:flex;gap:8px}
#vc1644-training-planning .vc1644-scroll{max-width:100%;overflow:auto;border:1px solid #e1eaf1;border-radius:8px}
#vc1644-training-planning table{border-collapse:collapse;min-width:330px;width:100%;font-size:11px}
#vc1644-training-planning th,#vc1644-training-planning td{padding:8px 9px;text-align:left;border-bottom:1px solid #e9eff4}
#vc1644-training-planning th{background:#f0f6fa;color:#3d6782}
#vc1644-training-planning .vc1644-load .vc1644-title p{font-size:10px;color:#718b9e}
#vc1644-training-planning .vc1644-selectors{display:flex;gap:8px;flex-wrap:wrap}
#vc1644-training-planning label{display:grid;gap:4px;color:#68869b;font-size:10px;font-weight:800}
#vc1644-training-planning select{min-height:34px!important;min-width:130px;max-width:230px;border:1px solid #cbdce8!important;background:#fff!important;border-radius:7px;padding:6px 7px;color:#24506e;font:700 11px system-ui!important}
#vc1644-training-planning .vc1644-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
#vc1644-training-planning .vc1644-stats>div{display:grid;gap:4px;background:#f5faff;border:1px solid #dfebf3;border-radius:9px;padding:9px;min-width:0}
#vc1644-training-planning .vc1644-stats span{font-size:10px;color:#67839a;font-weight:700}
#vc1644-training-planning .vc1644-stats strong{font-size:20px;color:#154b73;font-variant-numeric:tabular-nums}
#vc1644-training-planning .vc1644-status{color:#8197a7;font-size:10px}
@media(max-width:950px){#vc1644-training-planning .vc1644-grid{grid-template-columns:1fr}#vc1644-training-planning .vc1644-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){#vc1644-training-planning .vc1644-head{padding:12px}#vc1644-training-planning .vc1644-body{padding:9px}#vc1644-training-planning .vc1644-selectors{width:100%}#vc1644-training-planning .vc1644-selectors label{flex:1}#vc1644-training-planning select{min-width:0;max-width:100%;width:100%}}
`;
window.VC_TRAINING_PLANNING_1644={version:'16.4.4',mount,refresh,analyzePDF,analyzePlans,analyzePlayerLoad};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
