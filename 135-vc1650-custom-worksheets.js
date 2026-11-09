/* Volley Coach V16.5.0 · Analysis Pro 3.0 — Custom Worksheets.
 * Read-only analysis of already-normalized scouting actions. Storage contains
 * layout preferences ONLY (never match data or player lists).
 */
(()=>{
'use strict';
if(window.VC_CUSTOM_WORKSHEETS_1650)return;
const VERSION='16.5.0', STORAGE='volley-coach-analysis-views-v1650';
const SKILLS={A:'Ataque',R:'Recepción',S:'Saque',B:'Bloqueo',E:'Colocación',D:'Defensa',F:'Freeball',C:'Cobertura'};
const GROUPS={player:'Jugador',rotation:'Rotación',set:'Set',zone:'Zona codificada'};
const SORTS={count:'Más acciones',label:'Nombre / zona',eff:'Mayor eficiencia',quality:'Calidad positiva',gp:'G-P acciones'};
const FIELDS={count:'Acciones',kills:'Puntos #',errors:'Errores =',blocked:'Bloq. /',positive:'Valoraciones #/+',quality:'Calidad #/+ %',gp:'G-P acciones',eff:'Ataque EFF',video:'Con vídeo'};
const DEFAULT={skill:'A',group:'player',reception:'all',sort:'count',columns:['count','kills','errors','blocked','gp','eff','video']};
const text=v=>String(v??'').trim();
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percentage=(n,d)=>d>0?Math.round(n/d*1000)/10:null;
const fmt=v=>v===null||v===undefined?'—':Number(v).toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
const identity=s=>Object.prototype.hasOwnProperty.call(s,'x')?s.x:s;
function sanitize(source){
 const x=source&&typeof source==='object'?source:{};
 const skill=SKILLS[x.skill]?x.skill:DEFAULT.skill;
 const group=GROUPS[x.group]?x.group:DEFAULT.group;
 const reception=(skill==='A'||skill==='E')&&['positive','negative','all'].includes(x.reception)?x.reception:'all';
 const sort=SORTS[x.sort]?x.sort:'count';
 const columns=Array.isArray(x.columns)?[...new Set(x.columns.filter(c=>FIELDS[c]))].slice(0,9):[...DEFAULT.columns];
 return {skill,group,reception,sort,columns:columns.length?columns:[...DEFAULT.columns]};
}
function zoneOf(row){
 const a=row.a||{};const skill=row.skill;
 const raw=skill==='A'||skill==='S'?a.endZone:skill==='E'?a.setTarget:skill==='R'?(a.contactZone||a.endZone):(a.contactZone||a.startZone||a.endZone);
 const m=text(raw).toUpperCase().match(/^Z?([1-9])([A-D])?$/);
 return m?`Z${m[1]}${m[2]||''}`:'Sin registrar';
}
function groupOf(row,group){
 if(group==='player')return text(row.player)||'Sin identificar';
 if(group==='set')return Number(row.set)>0?`Set ${row.set}`:'Sin registrar';
 if(group==='rotation')return Number(row.rotation)>0&&Number(row.rotation)<=6?`R${row.rotation}`:'Sin registrar';
 return zoneOf(row);
}
function isNegative(s){return ['-','/','='].includes(s)}
function build(data,option){
 const o=sanitize(option),rows=Array.isArray(data?.actions)?data.actions:[];
 const skillRows=rows.filter(r=>r.skill===o.skill);
 let filtered=skillRows,contextTotal=null;
 if(o.reception!=='all'){
  const keys=new Set();const pairs=Array.isArray(data?.pairs)?data.pairs:[];
  for(const pair of pairs){const val=String(pair.recEval||'');if(!(o.reception==='positive'?['#','+'].includes(val):isNegative(val)))continue;
   const target=o.skill==='E'?pair.set:pair.attack;
   if(target?.key)keys.add(target.key);
  }
  filtered=skillRows.filter(r=>keys.has(r.key));
  contextTotal=skillRows.length;
 }
 const groups=new Map();
 for(const r of filtered){
  const key=groupOf(r,o.group);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(r);
 }
 const output=[...groups].map(([label,actions])=>{
  const n=actions.length,counts=Object.fromEntries(['#','+','!','-','/','='].map(ev=>[ev,actions.filter(r=>r.ev===ev).length]));
  const applicable=['S','A','B'].includes(o.skill),eff=o.skill==='A'?percentage(counts['#']-counts['=']-counts['/'],n):null;
  return {label,actions,keys:actions.map(a=>a.key),n,count:n,counts,kills:applicable?counts['#']:null,errors:counts['='],blocked:o.skill==='A'?counts['/']:null,positive:counts['#']+counts['+'],quality:percentage(counts['#']+counts['+'],n),gp:applicable?counts['#']-counts['=']-(o.skill==='A'?counts['/']:0):null,eff,video:actions.filter(r=>r.video).length};
 });
 const cmp=(a,b)=>o.sort==='label'?a.label.localeCompare(b.label,'es'):o.sort==='eff'?(b.eff??-Infinity)-(a.eff??-Infinity):o.sort==='quality'?(b.quality??-Infinity)-(a.quality??-Infinity):o.sort==='gp'?(b.gp??-Infinity)-(a.gp??-Infinity):b.n-a.n;
 output.sort((a,b)=>cmp(a,b)||a.label.localeCompare(b.label,'es'));
 return {rows:output,options:o,total:filtered.length,eligible:skillRows.length,contextTotal,video:filtered.filter(r=>r.video).length,missingZone:o.group==='zone'?filtered.filter(r=>zoneOf(r)==='Sin registrar').length:null};
}
function selectOptions(dict,active){return Object.entries(dict).map(([k,v])=>`<option value="${escape(k)}" ${k===active?'selected':''}>${escape(v)}</option>`).join('')}
function views(){
 try{
  const v=JSON.parse(localStorage.getItem(STORAGE)||'[]');
  if(!Array.isArray(v))return [];
  return v.filter(x=>x&&typeof x.name==='string'&&x.name.trim().length>0&&x.name.length<=50).slice(0,20).map(x=>({name:x.name,config:sanitize(x.config)}));
 }catch(_){return []}
}
function saveView(name,config){
 const n=text(name).slice(0,50);if(!n)return {ok:false,message:'Escribe un nombre para la vista.'};
 try{
  const old=views().filter(x=>x.name.toLocaleLowerCase('es')!==n.toLocaleLowerCase('es'));
  old.push({name:n,config:sanitize(config)});
  localStorage.setItem(STORAGE,JSON.stringify(old.slice(-20)));
  return {ok:true,message:`Vista «${n}» guardada en este navegador.`};
 }catch(_){return {ok:false,message:'No se ha podido guardar la vista localmente.'}}
}
function removeView(name){
 const old=views(),list=old.filter(v=>v.name!==name);
 if(list.length===old.length)return {ok:false,message:'Vista no encontrada.'};
 try{localStorage.setItem(STORAGE,JSON.stringify(list));return {ok:true,message:'Vista eliminada.'}}
 catch(_){return {ok:false,message:'No se ha podido actualizar el almacenamiento local.'}}
}
function csvSafe(s){
 let value=String(s??'');
 // Avoid spreadsheet formula execution, including leading spaces/control chars.
 if(/^[\s\u0000-\u001f]*[=+\-@]/.test(value))value="'"+value;
 return '"'+value.replace(/"/g,'""')+'"';
}
function csv(data,option){
 const out=build(data,option),cols=out.options.columns;
 const lines=[[GROUPS[out.options.group],...cols.map(c=>FIELDS[c])],...out.rows.map(r=>[r.label,...cols.map(c=>r[c]===null||r[c]===undefined?'':r[c])])];
 return '\ufeff'+lines.map(row=>row.map(csvSafe).join(';')).join('\r\n');
}
function render(data,option,utils={}){
 const result=build(data,option),o=result.options, saved=views();
 const chosen=utils.savedName||'';
 const opts=['<option value="">Vista sin guardar</option>',...saved.map(v=>`<option value="${escape(v.name)}" ${v.name===chosen?'selected':''}>${escape(v.name)}</option>`)].join('');
 const colControls=Object.entries(FIELDS).map(([k,label])=>`<label class="vc1650-check"><input type="checkbox" data-vc1650-col="${k}" ${o.columns.includes(k)?'checked':''}><span>${escape(label)}</span></label>`).join('');
 const colHeaders=o.columns.map(c=>`<th>${escape(FIELDS[c])}</th>`).join('');
 const dataRows=result.rows.slice(0,150).map(r=>{
  const values=o.columns.map(c=>`<td class="vc1650-num">${c==='quality'||c==='eff'?fmt(r[c]):r[c]===null?'—':escape(r[c])}</td>`).join('');
  const button=utils.pickButton?utils.pickButton('Jugadas',r.keys,`Hoja personalizada · ${r.label}`):'';
  return `<tr><th scope="row" class="vc1650-group">${escape(r.label)}</th>${values}<td>${button}</td></tr>`;
 }).join('');
 const note=o.reception!=='all'?`Solo se cuentan ${o.reception==='positive'?'recepciones previas #/+':'recepciones previas - / ='} enlazadas con una colocación registrada en la misma posesión. ${result.total}/${result.eligible} acciones de ${SKILLS[o.skill]} incluidas.`:'No se infiere la calidad de recepción previa cuando no existe un enlace codificado.';
 return `<section class="vc157-panel vc1650-sheet"><div class="vc157-panelhead"><div><span class="vc1650-eyebrow">HOJAS PERSONALIZADAS · ANÁLISIS PRO 3.0</span><h3>Constructor de estadísticas</h3><p>Configura qué quieres analizar. Los filtros comunes de equipo, partido, set, rotación y K1/K2 se aplican automáticamente.</p></div><span class="vc157-tag">${result.total} acciones</span></div>
 <div class="vc1650-config"><label>Fundamento<select id="vc1650-skill">${selectOptions(SKILLS,o.skill)}</select></label><label>Agrupar por<select id="vc1650-group">${selectOptions(GROUPS,o.group)}</select></label><label>Recepción previa<select id="vc1650-reception" ${['A','E'].includes(o.skill)?'':'disabled title="Solo disponible para ataque y colocación"'}>${selectOptions({all:'Todas / no filtrar',positive:'Positiva y perfecta (#/+)',negative:'Negativa (- / =)'},o.reception)}</select></label><label>Orden<select id="vc1650-sort">${selectOptions(SORTS,o.sort)}</select></label></div>
 <div class="vc1650-columnpanel"><div class="vc1650-columnhead"><b>Columnas visibles</b><span>Selecciona las estadísticas que quieres mostrar</span></div><div class="vc1650-checks">${colControls}</div></div>
 <div class="vc1650-savebar"><label>Vistas guardadas en este dispositivo<select id="vc1650-views">${opts}</select></label><label>Nombre de la vista<input id="vc1650-name" maxlength="50" placeholder="Ej. Ataque por rotación" value="${escape(chosen)}"></label><button id="vc1650-save" type="button">Guardar vista</button><button id="vc1650-delete" type="button" ${chosen?'':'disabled'}>Eliminar</button><button id="vc1650-export" type="button">Exportar CSV</button></div>
 <div class="vc1650-summary"><span><strong>${result.rows.length}</strong> grupos</span><span><strong>${result.total}</strong> acciones</span><span><strong>${result.video}</strong> con vídeo</span>${result.missingZone!==null?`<span><strong>${result.missingZone}</strong> sin zona codificada</span>`:''}</div>
 <div class="vc157-tablewrap vc1650-tablewrap"><table class="vc157-table vc1650-table"><thead><tr><th>${escape(GROUPS[o.group])}</th>${colHeaders}<th>Evidencias</th></tr></thead><tbody>${dataRows||`<tr><td colspan="${o.columns.length+2}" class="vc157-muted">No hay acciones para esta combinación de filtros. Cambia los criterios o revisa la codificación del scouting.</td></tr>`}</tbody></table></div>${result.rows.length>150?'<p class="vc157-note">Vista limitada a 150 filas; el CSV incluye todos los grupos.</p>':''}
 <p class="vc157-note">${note} G-P acciones = puntos # menos errores = (y ataques bloqueados /); es un diferencial de acciones, no el G-P oficial por rallies. EFF = (# − = − /) / intentos de ataque. Los porcentajes sin denominador se muestran «—». Para detalles oficiales, utiliza la Hoja por jugador.</p><p id="vc1650-message" class="vc1650-message" aria-live="polite">Las vistas se guardan solo en este navegador; no se sincronizan ni modifican partidos.</p></section>`;
}
window.VC_CUSTOM_WORKSHEETS_1650={version:VERSION,SKILLS,GROUPS,FIELDS,DEFAULT,sanitize,zoneOf,build,views,saveView,removeView,csv,render};
})();
