/* Volley Coach V16.4.3 · Training Pro 3.0
   Session preparation workspace. Reads the existing session/catalog without altering
   their persistence or PDF formats. Adds exercises only through añadirASesion(). */
(()=>{
'use strict';
if(window.VC_TRAINING_PRO_1643)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const stages=[['activacion','Activación'],['tecnica','Técnica'],['especifico','Específico'],['aplicado','Juego aplicado'],['juego','Juego real']];
const aliases={controles:'tecnica',analiticos:'tecnica',especificos:'especifico',desarrollo:'aplicado',reducidos:'aplicado'};
const validStages=new Set(stages.map(([k])=>k));
function skills(e){
 const raw=Array.isArray(e?.fundamentos)?e.fundamentos:Array.isArray(e?.fundamento)?e.fundamento:typeof e?.fundamento==='string'?[e.fundamento]:[];
 return [...new Set(raw.map(x=>String(x||'').trim()).filter(Boolean))];
}
function minutes(e){const n=Number(e?.tiempo);return Number.isFinite(n)&&n>0?n:0}
function naturalStage(e){
 if(e?.fase==='Calentamiento')return 'activacion';
 if(e?.tipo==='Analítico'||skills(e).includes('Control'))return 'tecnica';
 if(e?.tipo==='Puesta en juego'||e?.tipo==='Juego reducido')return 'aplicado';
 if(e?.tipo==='Juego')return 'juego';
 return 'especifico';
}
function readModel(raw){
 const ids=arr(raw?.ids),catalog=arr(raw?.catalog),meta=raw?.meta&&typeof raw.meta==='object'?raw.meta:{};
 const byId=new Map(catalog.filter(e=>e&&e.id!=null).map(e=>[String(e.id),e]));
 const exercises=[],missingIds=[];
 for(const id of ids){const e=byId.get(String(id));if(e)exercises.push({...e,sessionStage:String(meta.seccionesEjercicios?.[String(id)]||'')});else missingIds.push(String(id))}
 const rows=stages.map(([id,label])=>({id,label,exercises:[],minutes:0}));
 const stageMap=new Map(rows.map(r=>[r.id,r]));
 const skillMinutes=new Map(),materialSet=new Set(),intensityMinutes=new Map();
 let total=0,unclassified=0,zeroTime=0,missingSkills=0;
 for(const e of exercises){
  const t=minutes(e),fs=skills(e),override=aliases[e.sessionStage]||e.sessionStage;
  const stage=validStages.has(override)?override:naturalStage(e);
  const group=stageMap.get(stage);group.exercises.push(e);group.minutes+=t;
  total+=t;
  if(!t)zeroTime++;
  if(!fs.length){missingSkills++;unclassified+=t}else for(const f of fs)skillMinutes.set(f,(skillMinutes.get(f)||0)+t/fs.length);
  if(String(e.material||'').trim())for(const token of String(e.material).split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean))materialSet.add(token);
  const intensity=String(e.intensidad||'Sin indicar');intensityMinutes.set(intensity,(intensityMinutes.get(intensity)||0)+t);
 }
 const target=Number(meta.duracionObjetivo),goal=Number.isFinite(target)&&target>0?target:0;
 const attended=Number(meta.jugadores),numberAttending=Number.isFinite(attended)&&attended>0?attended:0;
 const rosterIds=arr(meta.playerIds).filter(v=>v!==''&&v!=null);
 const checks=[
  {id:'objective',label:'Objetivo principal definido',ok:!!String(meta.objetivo||'').trim()},
  {id:'duration',label:'Duración objetivo indicada',ok:goal>0},
  {id:'exercises',label:'Hay ejercicios en la sesión',ok:exercises.length>0},
  {id:'times',label:'Todos los ejercicios tienen duración',ok:exercises.length>0&&zeroTime===0},
  {id:'skills',label:'Todos los ejercicios tienen fundamentos',ok:exercises.length>0&&missingSkills===0},
  {id:'roster',label:'Participantes indicados',ok:rosterIds.length>0||numberAttending>0}
 ];
 const focus=[...skillMinutes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es'));
 const planned=arr(raw?.planned),done=arr(raw?.done);
 return {team:String(raw?.team||meta.equipo||'Equipo'),date:String(meta.fecha||''),goal,total,delta:goal?total-goal:null,
  count:exercises.length,objective:String(meta.objetivo||''),rosterCount:rosterIds.length||numberAttending,
  planCount:planned.length,historyCount:done.length,stages:rows,exercises,missingIds,zeroTime,missingSkills,
  focus,unclassified,materials:[...materialSet].sort((a,b)=>a.localeCompare(b,'es')),
  intensities:[...intensityMinutes].sort((a,b)=>b[1]-a[1]),checks,ready:checks.filter(x=>x.ok).length,catalog};
}
function takeSnapshot(){
 // The core training script declares these in the global classic-script scope.
 // Read them directly: never clone, reassign or persist their values.
 if(typeof sesionActual==='undefined'||typeof baseDeDatos==='undefined'||typeof meta==='undefined')return null;
 return readModel({ids:sesionActual,catalog:baseDeDatos,meta,team:typeof EQUIPOS!=='undefined'?EQUIPOS[equipoActivo]?.nombre:'',
  planned:typeof planificacion!=='undefined'?planificacion:[],done:typeof historial!=='undefined'?historial:[]});
}
let root=null,observer=null,renderQueued=false,lastSnapshot=null;
function formatMin(n){return Number(n).toLocaleString('es-ES',{maximumFractionDigits:1})}
function metric(label,value,sub){return `<div class="vc1643-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></div>`}
function renderSummary(){
 if(!root)return;
 const model=takeSnapshot();if(!model){$('vc1643-status').textContent='El núcleo de entrenamiento todavía no está disponible.';return}
 lastSnapshot=model;
 const durationText=model.goal?`${formatMin(model.total)} / ${formatMin(model.goal)} min`:`${formatMin(model.total)} min`;
 const deltaText=model.delta==null?'Define duración objetivo':model.delta>0?`${formatMin(model.delta)} min por encima del objetivo`:model.delta<0?`${formatMin(-model.delta)} min pendientes hasta el objetivo`:'Duración prevista alcanzada';
 $('vc1643-summary').innerHTML=`${metric('Tiempo previsto',durationText,deltaText)}${metric('Ejercicios',model.count,`${model.stages.filter(s=>s.exercises.length).length} fases con trabajo`)}${metric('Fundamentos',model.focus.length,model.missingSkills?`${model.missingSkills} sin clasificar`:'Cobertura completa')}${metric('Preparación',`${model.ready}/${model.checks.length}`,model.ready===model.checks.length?'Campos básicos completos':'Revisa las indicaciones')}`;
 $('vc1643-context').textContent=`${model.team} · ${model.date||'Sin fecha'} · ${model.rosterCount?model.rosterCount+' participantes indicados':'Participantes pendientes'}`;
 const phaseMax=Math.max(1,model.total);
 $('vc1643-phases').innerHTML=model.stages.map(s=>`<button type="button" class="vc1643-phase" data-action="phase" data-id="${s.id}" ${s.exercises.length?'':'disabled'}><span><b>${esc(s.label)}</b><small>${s.exercises.length} ej. · ${formatMin(s.minutes)} min</small></span><span class="vc1643-track"><i style="width:${Math.max(0,Math.min(100,s.minutes/phaseMax*100))}%"></i></span></button>`).join('');
 const max=Math.max(1,...model.focus.map(x=>x[1]));
 $('vc1643-focus').innerHTML=model.focus.length?model.focus.map(([name,mins])=>`<div class="vc1643-focusrow"><span>${esc(name)}</span><span class="vc1643-track"><i style="width:${Math.min(100,mins/max*100)}%"></i></span><strong>${formatMin(mins)} min</strong></div>`).join(''):'<p class="vc1643-muted">Añade ejercicios con fundamentos para calcular su distribución.</p>';
 const missing=model.checks.filter(c=>!c.ok);
 $('vc1643-checks').innerHTML=missing.length?missing.map(c=>`<button class="vc1643-task" type="button" data-action="task" data-id="${esc(c.id)}"><span class="vc1643-taskmark">!</span><span>${esc(c.label)}</span><b>Revisar</b></button>`).join(''):'<p class="vc1643-ok">Los seis campos básicos de preparación están completados.</p>';
 if(model.missingIds.length) $('vc1643-checks').insertAdjacentHTML('beforeend',`<p class="vc1643-alert">${model.missingIds.length} ejercicios no encontrados en la biblioteca. Revisa los datos antes de finalizar.</p>`);
 $('vc1643-materials').innerHTML=model.materials.length?model.materials.map(m=>`<span>${esc(m)}</span>`).join(''):'<span>Sin material indicado en los ejercicios</span>';
 $('vc1643-status').textContent='Lectura de la sesión actual · sin modificar los datos guardados';
 renderLibrary();
}
function renderLibrary(){
 if(!root)return;
 const model=lastSnapshot;if(!model)return;
 const q=String($('vc1643-search')?.value||'').toLocaleLowerCase('es-ES').trim();
 const present=new Set(model.exercises.map(e=>String(e.id)));
 const pool=model.catalog.filter(e=>e&&e.id!=null&&!present.has(String(e.id)));
 let matches=pool;
 if(q)matches=pool.filter(e=>[e.nombre,e.objetivo,e.descripcion,...skills(e)].join(' ').toLocaleLowerCase('es-ES').includes(q));
 else matches=[...pool].sort((a,b)=>Number(!!b.favorito)-Number(!!a.favorito)||String(a.nombre||'').localeCompare(String(b.nombre||''),'es'));
 const shown=matches.slice(0,6);
 $('vc1643-results').innerHTML=shown.map(e=>`<div class="vc1643-libraryrow"><div><b>${esc(e.nombre||'Ejercicio')}</b><small>${formatMin(minutes(e))} min · ${esc(skills(e).join(' + ')||'Sin fundamento')} ${e.favorito?'· Favorito':''}</small></div><button type="button" data-action="add" data-id="${esc(String(e.id))}" aria-label="Añadir ${esc(e.nombre||'ejercicio')} a la sesión">Añadir</button></div>`).join('')||`<p class="vc1643-muted">${q?'No hay coincidencias en la biblioteca.':'Todos los ejercicios disponibles están en la sesión.'}</p>`;
 $('vc1643-match-count').textContent=`${matches.length} disponibles`;
}
function activate(action,id){
 switch(action){
  case 'phase':{const target=$('stage-'+id);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});break}
  case 'task':{
   const targetMap={objective:'sesion-objetivo',duration:'sesion-duracion-objetivo',roster:'session-roster-summary',exercises:'vc1643-search',times:'lista-sesion',skills:'lista-sesion'};
   const el=$(targetMap[id]);if(el){if(id==='roster'){const r=el.closest('details');if(r)r.open=true}el.scrollIntoView({behavior:'smooth',block:'center'});if(['objective','duration','exercises'].includes(id))el.focus?.()}break;
  }
  case 'add':{
   const model=lastSnapshot,match=model?.catalog.find(e=>String(e.id)===String(id));
   if(!match||model.exercises.some(e=>String(e.id)===String(id)))return;
   if(typeof añadirASesion==='function')añadirASesion(match.id);scheduleRefresh();break;
  }
  case 'library':if(typeof abrirBibliotecaNormal==='function')abrirBibliotecaNormal(typeof botonVista==='function'?botonVista('ejercicios'):null);break;
  case 'plan':if(typeof guardarSesionEnPlanificacion==='function')guardarSesionEnPlanificacion(false);break;
  case 'pdf':{
   const existing=document.querySelector('#entrenamiento .session-action-primary button.primary');if(existing)existing.click();break;
  }
  case 'template':if(typeof abrirModalPlantillas==='function')abrirModalPlantillas('usar');break;
 }
}
function scheduleRefresh(){
 if(renderQueued)return;renderQueued=true;
 const raf=typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>Promise.resolve().then(fn);
 raf(()=>{renderQueued=false;try{renderSummary()}catch(err){console.warn('Training Pro 3.0',err);if($('vc1643-status'))$('vc1643-status').textContent='No se ha podido actualizar el panel; la sesión original sigue disponible.'}});
}
function mount(){
 if(root)return true;
 const view=$('entrenamiento'),before=view?.querySelector('.session-workspace');if(!view||!before)return false;
 const style=document.createElement('style');style.id='vc1643-training-style';style.textContent=CSS;document.head.appendChild(style);
 root=document.createElement('section');root.id='vc1643-training-pro';root.className='vc1643-shell';
 root.innerHTML=`<div class="vc1643-hero"><div><span>TRAINING PRO · V16.4.3</span><h3>Preparación de la sesión</h3><p id="vc1643-context">Cargando datos del equipo…</p></div><div class="vc1643-actions"><button type="button" data-action="library">Biblioteca</button><button type="button" data-action="template">Plantillas</button><button type="button" data-action="plan">Guardar planificación</button><button type="button" class="vc1643-primary" data-action="pdf">PDF original</button></div></div>
 <div class="vc1643-content"><div id="vc1643-summary" class="vc1643-metrics"></div><div class="vc1643-grid"><div class="vc1643-card"><div class="vc1643-cardhead"><h4>Fases del entrenamiento</h4><small>Selecciona una fase para ir a sus ejercicios</small></div><div id="vc1643-phases" class="vc1643-phases"></div></div><div class="vc1643-card"><div class="vc1643-cardhead"><h4>Distribución por fundamento</h4><small>Minutos equivalentes repartidos entre los fundamentos de cada ejercicio</small></div><div id="vc1643-focus" class="vc1643-focus"></div></div></div>
 <div class="vc1643-grid vc1643-bottom"><div class="vc1643-card"><div class="vc1643-cardhead"><h4>Preparación y material</h4><small>Puntos pendientes antes de iniciar la sesión</small></div><div id="vc1643-checks" class="vc1643-checks"></div><div class="vc1643-material-title">Material previsto</div><div id="vc1643-materials" class="vc1643-materials"></div></div><div class="vc1643-card"><div class="vc1643-cardhead"><h4>Añadir desde la biblioteca</h4><small>Utiliza el botón de añadir original, sin duplicar ejercicios</small></div><div class="vc1643-search"><input type="search" id="vc1643-search" placeholder="Buscar por nombre o fundamento…" aria-label="Buscar ejercicios en la biblioteca"><span id="vc1643-match-count"></span></div><div id="vc1643-results" class="vc1643-results"></div></div></div><p id="vc1643-status" class="vc1643-status"></p></div>`;
 before.parentNode.insertBefore(root,before);
 root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&root.contains(b))activate(b.dataset.action,b.dataset.id||'')});
 $('vc1643-search').addEventListener('input',renderLibrary);
 const list=$('lista-sesion');if(list&&typeof MutationObserver!=='undefined'){
  observer=new MutationObserver(scheduleRefresh);observer.observe(list,{childList:true,subtree:false});
 }
 const teamLabel=$('team-active-name');if(teamLabel&&typeof MutationObserver!=='undefined'){
  new MutationObserver(scheduleRefresh).observe(teamLabel,{childList:true,subtree:true,characterData:true});
 }
 view.addEventListener('input',e=>{if(!root.contains(e.target))scheduleRefresh()});
 view.addEventListener('change',e=>{if(!root.contains(e.target))scheduleRefresh()});
 scheduleRefresh();return true;
}
const CSS=`
#vc1643-training-pro,#vc1643-training-pro *{box-sizing:border-box}
#vc1643-training-pro{margin:14px 0 20px;font:500 12px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#1d3a54;border:1px solid #d5e3ed;border-radius:16px;overflow:hidden;background:#f5f9fc;box-shadow:0 5px 20px rgba(16,46,71,.06)}
#vc1643-training-pro .vc1643-hero{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:13px;padding:18px 20px;background:linear-gradient(115deg,#102e49,#1f5f86);color:#fff}
#vc1643-training-pro .vc1643-hero span{display:block;color:#98d4f4;font-weight:900;letter-spacing:.1em;font-size:10px}
#vc1643-training-pro .vc1643-hero h3{margin:2px 0!important;font:850 19px/1.25 system-ui!important;color:#fff!important}
#vc1643-training-pro .vc1643-hero p{margin:3px 0 0;color:#d5e6f1;font-size:11px}
#vc1643-training-pro .vc1643-actions{display:flex;flex-wrap:wrap;gap:6px}
#vc1643-training-pro button{font:750 11px system-ui;min-height:34px;border-radius:8px;cursor:pointer}
#vc1643-training-pro button:focus-visible,#vc1643-training-pro input:focus-visible{outline:3px solid #78bdf0;outline-offset:2px}
#vc1643-training-pro .vc1643-actions button{border:1px solid #7097b0;background:#244f70;color:#fff;padding:8px 11px}
#vc1643-training-pro .vc1643-actions .vc1643-primary{background:#fff;color:#164a71;border-color:#fff}
#vc1643-training-pro .vc1643-content{padding:15px;display:grid;gap:13px}
#vc1643-training-pro .vc1643-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
#vc1643-training-pro .vc1643-metric{display:grid;gap:3px;min-width:0;background:#fff;border:1px solid #dce7ee;border-radius:10px;padding:12px}
#vc1643-training-pro .vc1643-metric>span{font-size:10px;color:#60809a;font-weight:800;text-transform:uppercase}
#vc1643-training-pro .vc1643-metric>strong{font-size:21px;color:#123c5a;line-height:1.2;font-variant-numeric:tabular-nums}
#vc1643-training-pro .vc1643-metric>small{font-size:10px;color:#6a879b;line-height:1.4}
#vc1643-training-pro .vc1643-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#vc1643-training-pro .vc1643-card{min-width:0;background:#fff;border:1px solid #dbe7ef;border-radius:12px;padding:15px}
#vc1643-training-pro .vc1643-cardhead{margin-bottom:12px}
#vc1643-training-pro .vc1643-card h4{margin:0 0 3px!important;color:#173c59!important;font:850 14px system-ui!important}
#vc1643-training-pro .vc1643-cardhead small{font-size:10px;color:#738b9e}
#vc1643-training-pro .vc1643-phases,#vc1643-training-pro .vc1643-focus{display:grid;gap:8px}
#vc1643-training-pro .vc1643-phase{border:1px solid #e1eaf1;background:#f9fcff;display:grid;grid-template-columns:minmax(120px,1fr) minmax(60px,1.1fr);gap:10px;text-align:left;align-items:center;padding:8px 10px;color:#264e69}
#vc1643-training-pro .vc1643-phase:disabled{opacity:.5;cursor:default}
#vc1643-training-pro .vc1643-phase span:first-child{display:grid;gap:1px}
#vc1643-training-pro .vc1643-phase b{font-size:11px}
#vc1643-training-pro .vc1643-phase small{font-size:10px;color:#738ea0}
#vc1643-training-pro .vc1643-track{display:block;height:8px;border-radius:8px;overflow:hidden;background:#e3eef5}
#vc1643-training-pro .vc1643-track i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#347ca7,#175780)}
#vc1643-training-pro .vc1643-focusrow{display:grid;grid-template-columns:minmax(84px,1fr) minmax(60px,1.4fr) 55px;gap:8px;align-items:center;font-size:11px}
#vc1643-training-pro .vc1643-focusrow>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#vc1643-training-pro .vc1643-focusrow strong{text-align:right;font-variant-numeric:tabular-nums;font-size:10px}
#vc1643-training-pro .vc1643-task{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:#fffaf1;border:1px solid #f0dfbd;color:#745529;padding:9px}
#vc1643-training-pro .vc1643-taskmark{display:grid;place-items:center;border-radius:50%;background:#edc778;color:#56401d;width:17px;height:17px;flex:none;font-weight:900}
#vc1643-training-pro .vc1643-task span:nth-child(2){flex:1}
#vc1643-training-pro .vc1643-task b{font-size:10px}
#vc1643-training-pro .vc1643-checks{display:grid;gap:6px}
#vc1643-training-pro .vc1643-ok{padding:10px;color:#236953;background:#eaf7f1;border-radius:8px;margin:0}
#vc1643-training-pro .vc1643-alert{padding:9px;border-left:3px solid #b76f42;background:#fff5ee;color:#8c562c;margin:0}
#vc1643-training-pro .vc1643-material-title{font-size:10px;color:#648198;font-weight:800;text-transform:uppercase;margin:13px 0 6px}
#vc1643-training-pro .vc1643-materials{display:flex;flex-wrap:wrap;gap:5px}
#vc1643-training-pro .vc1643-materials span{font-size:10px;background:#eef5fb;border:1px solid #d6e6f1;border-radius:6px;padding:5px 7px;color:#38627d}
#vc1643-training-pro .vc1643-search{display:flex;gap:8px;align-items:center;margin-bottom:8px}
#vc1643-training-pro .vc1643-search input{flex:1;min-width:0;font:500 12px system-ui;border:1px solid #cbdde9;border-radius:8px;height:37px;padding:8px 10px;background:#fff}
#vc1643-training-pro .vc1643-search span{white-space:nowrap;font-size:10px;color:#67869c}
#vc1643-training-pro .vc1643-results{display:grid;gap:5px;max-height:340px;overflow:auto}
#vc1643-training-pro .vc1643-libraryrow{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #e5edf3;border-radius:8px;padding:9px 10px;background:#fbfdff}
#vc1643-training-pro .vc1643-libraryrow>div{min-width:0}
#vc1643-training-pro .vc1643-libraryrow b{display:block;font-size:11px;color:#29485f}
#vc1643-training-pro .vc1643-libraryrow small{display:block;font-size:10px;color:#74899b}
#vc1643-training-pro .vc1643-libraryrow button{border:1px solid #bfd9ec;background:#e8f4fc;color:#1d608c;padding:7px 10px;flex:none}
#vc1643-training-pro .vc1643-muted{font-size:11px;color:#728ca1;margin:0}
#vc1643-training-pro .vc1643-status{font-size:10px;color:#7690a4;margin:0}
@media(max-width:1050px){#vc1643-training-pro .vc1643-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc1643-training-pro .vc1643-grid{grid-template-columns:1fr}}
@media(max-width:560px){#vc1643-training-pro .vc1643-content{padding:10px}#vc1643-training-pro .vc1643-hero{padding:16px 12px}#vc1643-training-pro .vc1643-actions{width:100%}#vc1643-training-pro .vc1643-actions button{flex:1}#vc1643-training-pro .vc1643-metric>strong{font-size:17px}#vc1643-training-pro .vc1643-phase{grid-template-columns:1fr 1fr}}
`;
window.VC_TRAINING_PRO_1643={version:'16.4.3',mount,refresh:scheduleRefresh,compute:readModel,snapshot:takeSnapshot};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
