/* VC20714_BUNDLE: original source files in runtime execution order; do not reorder. */
/* VC20714_SOURCE_BEGIN:135-vc1650-custom-worksheets.js */
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

/* VC20714_SOURCE_END:135-vc1650-custom-worksheets.js */

;
/* VC20714_SOURCE_BEGIN:136-vc1651-tactical-laboratory.js */
/* Volley Coach V16.5.1 — shared Tactical Laboratory engine.
 * Pure, read-only transformations of the canonical studio sequence rows.
 * No writes, network access or derived scouting persistence. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VC_TACTICAL_LAB_1651=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const clean=v=>String(v==null?'':v).trim();
 const zone=v=>{const m=clean(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?m[1]:'';};
 const blank=()=>({reception:'all',setter:'',attacker:'',tempo:'',outcome:'',destination:''});
 function sanitize(input){
  const x=input&&typeof input==='object'?input:{};
  const f=blank();
  f.reception=['all','positive','other','missing','unknown'].includes(x.reception)?x.reception:'all';
  f.outcome=['','point','error','ongoing','unknown','missing'].includes(x.outcome)?x.outcome:'';
  for(const k of ['setter','attacker','tempo'])f[k]=clean(x[k]).slice(0,160);
  f.destination=/^[1-9]$/.test(clean(x.destination))?clean(x.destination):'';
  return f;
 }
 function apply(items,input){
  const f=sanitize(input);return (Array.isArray(items)?items:[]).filter(row=>
   (f.reception==='all'||row.recClass===f.reception)&&
   (!f.setter||row.setter===f.setter)&&
   (!f.attacker||row.attacker===f.attacker)&&
   (!f.tempo||row.tempo===f.tempo)&&
   (!f.outcome||row.outcome===f.outcome)&&
   (!f.destination||zone(row.attack?.a?.endZone)===f.destination)
  );
 }
 function uniqueKeys(rows){return [...new Set(rows.flatMap(r=>Array.isArray(r.keys)?r.keys:[]).filter(Boolean))]}
 function groups(rows,mapper){
  const out=new Map();
  for(const item of rows){const k=clean(mapper(item))||'Sin registrar';if(!out.has(k))out.set(k,[]);out.get(k).push(item)}
  return [...out].map(([name,items])=>({name,items,n:items.length,keys:uniqueKeys(items)})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'));
 }
 function rating(rows){
  const scored=rows.filter(x=>x.attack&&['#','+','!','-','=','/'].includes(x.attack.ev));
  const k=scored.filter(x=>x.attack.ev==='#').length,
        e=scored.filter(x=>x.attack.ev==='=').length,
        blocked=scored.filter(x=>x.attack.ev==='/').length;
  return {n:scored.length,k,e,blocked,eff:scored.length?Math.round((k-e-blocked)/scored.length*1000)/10:null};
 }
 function summarize(items){
  const rows=Array.isArray(items)?items:[];
  const linked=rows.filter(x=>x.attack),complete=rows.filter(x=>x.rec&&x.attack);
  const trajectory=rows.filter(x=>x.attack&&zone(x.attack.a?.startZone)&&zone(x.attack.a?.endZone));
  const setterTargets=rows.filter(x=>zone(x.pair?.set?.a?.setTarget));
  const routes=groups(trajectory,x=>`Z${zone(x.attack.a.startZone)} → Z${zone(x.attack.a.endZone)}`);
  const destinations=groups(setterTargets,x=>`Z${zone(x.pair.set.a.setTarget)}`);
  const patterns=groups(rows,x=>JSON.stringify([x.reception,x.setter,x.attacker,x.tempo,x.combo]));
  return {rows,n:rows.length,linked:linked.length,complete:complete.length,trajectories:trajectory.length,setterTargets:setterTargets.length,
   stats:rating(rows),routes,destinations,patterns,attackers:groups(rows,x=>x.attacker),setters:groups(rows,x=>x.setter),keys:uniqueKeys(rows)};
 }
 return Object.freeze({version:'16.5.1',blank,sanitize,apply,summarize,zone,rating,uniqueKeys});
});

/* VC20714_SOURCE_END:136-vc1651-tactical-laboratory.js */

;
/* VC20714_SOURCE_BEGIN:167-vc1880-analysis-pro.js */
/* Volley Coach V18.8.0 · Analysis Pro Tactical Extensions
 * Read-only analytical views built on VC_ANALYSIS_INTELLIGENCE_1614.model.
 * No scouting writes, score changes, cloud access, or independent persistence.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_PRO_1880=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const EVALS=['#','+','!','-','/','='];
 const LABELS={'#':'Punto / perfecta','+':'Positiva','!':'Intermedia','-':'Negativa','/':'Muy negativa','=':'Error'};
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const norm=x=>str(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b?Math.round((a/b)*1000)/10:null;
 const fmt=x=>x==null?'—':`${Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const signed=x=>num(x)>0?`+${num(x)}`:String(num(x));
 const zone=x=>{const m=str(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 const rowKey=r=>str(r?.key);
 const rallyKey=r=>`${r?.set??''}/${r?.id??r?.index??''}`;
 function group(rows,getter){
  const map=new Map();
  for(const row of arr(rows)){const label=str(getter(row))||'Sin codificar';if(!map.has(label))map.set(label,[]);map.get(label).push(row)}
  return [...map].map(([name,items])=>({name,items})).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es'));
 }
 function evalStats(rows){
  const counts=Object.fromEntries(EVALS.map(k=>[k,0]));
  for(const r of arr(rows)){const ev=str(r?.ev);if(Object.prototype.hasOwnProperty.call(counts,ev))counts[ev]++}
  const n=arr(rows).length,positive=counts['#']+counts['+'];
  return {n,counts,positive,positivePct:pct(positive,n),perfect:counts['#'],errors:counts['='],killPct:pct(counts['#'],n),eff:pct(counts['#']-counts['=']-counts['/'],n),blocked:counts['/'],intermediate:counts['!'],negative:counts['-']};
 }
 function groupStats(rows,field){
  return group(rows,r=>field(r)).map(g=>({name:g.name,items:g.items,stats:evalStats(g.items)}));
 }
 function keys(rows){return [...new Set(arr(rows).map(rowKey).filter(Boolean))]}
 let windowTools={pickButton:(label)=>`<button type="button" disabled>${esc(label)}</button>`};
 function setTools(tools){windowTools={...windowTools,...(tools||{})}}
 function panelHead(kicker,title,copy,tag=''){
  return `<header class="vc1880-panelhead"><div><span>${esc(kicker)}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>${tag?`<b class="vc1880-tag">${esc(tag)}</b>`:''}</header>`;
 }
 function kpi(label,value,detail,kind=''){
  return `<article class="vc1880-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small>${kind?`<em>${esc(kind)}</em>`:''}</article>`;
 }
 function panel(title,copy,body,tag=''){
  return `<section class="vc1880-panel">${panelHead('DESGLOSE Y EVIDENCIA',title,copy,tag)}${body}</section>`;
 }
 function evalStrip(stats){
  return `<div class="vc1880-evals">${EVALS.map(k=>`<div><b>${k}</b><strong>${stats.counts[k]||0}</strong><small>${LABELS[k]}</small></div>`).join('')}</div>`;
 }
 function empty(msg){return `<div class="vc1880-empty">${esc(msg)}</div>`}
 function table(tools,headers,rows){
  return tools.table?tools.table(headers,rows,'vc1880-table'): `<div class="vc1880-tablewrap"><table class="vc1880-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">Sin datos para los filtros actuales.</td></tr>`}</tbody></table></div>`;
 }
 function serveReceive(data,tools={}){
  setTools(tools);
  const target=data?.target==='opponent'?'opponent':'ours';
  const serves=arr(data?.actions).filter(x=>x.skill==='S');
  const receives=arr(data?.actions).filter(x=>x.skill==='R');
  const ss=evalStats(serves),rs=evalStats(receives);
  const serveLinks=[];
  for(const r of arr(data?.rallies)){
   if(!r?.winning||r.serving!==target)continue;
   const serve=arr(r.actions).find(a=>a.team===target&&a.skill==='S');
   if(!serve)continue;
   const receive=arr(r.actions).find(a=>a.team!==target&&a.skill==='R'&&num(a.index)>num(serve.index))||null;
   serveLinks.push({r,serve,receive});
  }
  const linked=serveLinks.filter(x=>x.receive);
  const linkQuality=group(linked,x=>str(x.receive.ev)||'Sin valoración');
  const linkByServeType=group(linked,x=>`${str(x.serve.a?.serveType)||'Saque sin tipo'} → ${str(x.receive.ev)||'Sin valoración'}`);
  const linkTypeRows=linkByServeType.map(g=>{const pos=g.items.filter(x=>['#','+'].includes(x.receive.ev)).length;return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${pos}/${g.items.length}</td><td>${fmt(pct(pos,g.items.length))}</td><td>${windowTools.pickButton('Ver',keys(g.items.map(x=>x.serve)),`Saque y recepción · ${g.name}`)}</td></tr>`}).join('');
  const qualityRows=linkQuality.map(g=>{
   const pos=g.items.filter(x=>['#','+'].includes(x.receive.ev)).length;
   return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${pos}/${g.items.length}</td><td>${fmt(pct(pos,g.items.length))}</td><td>${windowTools.pickButton('Ver saque',keys(g.items.map(x=>x.serve)),`Saque propio · recepción rival ${g.name}`)}</td></tr>`;
  }).join('');
  const k1=arr(data?.chains);
  const k1Groups=group(k1,x=>str(x.rec?.ev)||'Sin valoración');
  const k1Rows=k1Groups.map(g=>{
   const won=g.items.filter(x=>x.outcome===true).length;
   const attacks=g.items.map(x=>x.attack).filter(Boolean);
   const aStats=evalStats(attacks);
   const linkKeys=g.items.flatMap(x=>[x.rec?.key,x.setter?.key,x.attack?.key]).filter(Boolean);
   return `<tr><td>${esc(g.name)}</td><td>${g.items.length}</td><td>${won}/${g.items.length}</td><td>${fmt(pct(won,g.items.length))}</td><td>${aStats.counts['#']}/${aStats.n}</td><td>${fmt(aStats.eff)}</td><td>${windowTools.pickButton('Ver',linkKeys,`K1 según recepción ${g.name}`)}</td></tr>`;
  }).join('');
  const servePlayers=groupStats(serves,x=>x.player);
  const serveTypes=groupStats(serves,x=>x.a?.serveType);
  const serveZones=groupStats(serves,x=>zone(x.a?.endZone)||'Sin destino'),serveRotations=groupStats(serves,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const receivePlayers=groupStats(receives,x=>x.player);
  const receiveTypes=groupStats(receives,x=>x.a?.receivedServeType);
  const receiveZones=groupStats(receives,x=>zone(x.a?.contactZone||x.a?.endZone)||'Sin zona'),receiveRotations=groupStats(receives,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const serveRows=(groups)=>groups.slice(0,10).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['=']}</td><td>${g.stats.counts['+']}</td><td>${fmt(g.stats.positivePct)}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Saque · ${g.name}`)}</td></tr>`).join('');
  const receiveRows=(groups)=>groups.slice(0,10).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['+']}</td><td>${g.stats.counts['!']+g.stats.counts['-']+g.stats.counts['/']+g.stats.counts['=']}</td><td>${fmt(g.stats.positivePct)}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Recepción · ${g.name}`)}</td></tr>`).join('');
  const serveTypeRows=serveRows(serveTypes),servePlayerRows=serveRows(servePlayers),serveZoneRows=serveRows(serveZones),serveRotationRows=serveRows(serveRotations);
  const receivePlayerRows=receiveRows(receivePlayers),receiveTypeRows=receiveRows(receiveTypes),receiveZoneRows=receiveRows(receiveZones),receiveRotationRows=receiveRows(receiveRotations);
  const body=`<div class="vc1880-kpis">${kpi('Saques registrados',ss.n,`${ss.counts['#']} aces · ${ss.counts['=']} errores`)}${kpi('Saques positivos #/+',`${ss.positive}/${ss.n}`,fmt(ss.positivePct))}${kpi('Recepciones registradas',rs.n,`${rs.counts['#']} perfectas · ${rs.counts['+']} positivas`)}${kpi('Recepción positiva #/+',`${rs.positive}/${rs.n}`,fmt(rs.positivePct))}</div>
  <div class="vc1880-grid2">${panel('Saque por jugador','Aces y errores directos se muestran separados de las valoraciones positivas.',table(tools,['Sacador','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],servePlayerRows),'SAQUE')}${panel('Recepción por jugador','La recepción positiva agrupa únicamente # y +. Las valoraciones !, -, / y = se mantienen separadas.',table(tools,['Receptor','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receivePlayerRows),'RECEPCIÓN')}</div>
  <div class="vc1880-grid2">${panel('Saque por tipo','Distribución según el tipo de saque codificado.',table(tools,['Tipo','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],serveTypeRows))}${panel('Recepción por saque recibido','Tipo de saque registrado en la acción de recepción.',table(tools,['Tipo recibido','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receiveTypeRows))}</div>
  <div class="vc1880-grid2">${panel('Destino del saque','Solo incluye zonas registradas en el destino del saque.',table(tools,['Destino','Intentos','Aces #','Errores =','+','Positivas #/+','Acciones'],serveZoneRows))}${panel('Zona de contacto de recepción','No se asigna una zona cuando el scouting no la ha codificado.',table(tools,['Zona','Intentos','Perfectas #','Positivas +','Otras / errores','Positivas #/+','Acciones'],receiveZoneRows))}</div>
  ${panel('Saque del equipo analizado frente a la recepción contraria','Vinculación dentro del mismo rally: saque del equipo seleccionado y primera recepción contraria posterior. Los rallies sin recepción codificada no se interpretan como ace.',table(tools,['Evaluación de recepción','Recepciones vinculadas','Positivas #/+','% positivas','Evidencia'],qualityRows),`${linked.length}/${serveLinks.length} vinculados`)}
  ${panel('Conversión K1 según calidad de recepción del equipo analizado','Solo se consideran la primera recepción registrada en cada K1 y el resultado real del rally. No demuestra causalidad.',table(tools,['Recepción','Rallies K1','Ganados','Side-out','Ataques #/T','EFF ataque','Evidencias'],k1Rows),`${k1.length} K1 con recepción`)}`;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · SAQUE Y RECEPCIÓN</span><h3>Control del primer contacto</h3><p>Analiza el saque y la recepción del equipo seleccionado, y su respuesta frente al adversario, con denominadores visibles. Los resultados se basan en acciones codificadas y rallies cerrados.</p></div>${body}<p class="vc1880-method">Definiciones: aces = evaluación # en saque; errores directos = evaluación =; recepción positiva = # + +. La recepción contraria vinculada se usa solo cuando existe una acción de recepción posterior al saque en el mismo rally.</p></div>`;
 }
 function attack(data,tools={}){
  setTools(tools);
  const rows=arr(data?.attacks),s=evalStats(rows);
  const byPlayer=groupStats(rows,x=>x.player),byTempo=groupStats(rows,x=>x.a?.attackTempo),byCombo=groupStats(rows,x=>x.a?.attackCombo),byDirection=groupStats(rows,x=>x.a?.attackDirection),byZone=groupStats(rows,x=>zone(x.a?.endZone)||'Sin destino'),byRotation=groupStats(rows,x=>x.rotation?`R${x.rotation}`:'Sin rotación');
  const linked=arr(data?.pairs).filter(p=>p.attack).map(p=>({...p.attack,linkedSetter:p.set?.player||'Sin colocador vinculado',linkedReception:p.recEval||'Sin recepción enlazada'}));
  const bySetter=groupStats(linked,x=>x.linkedSetter),byReception=groupStats(linked,x=>x.linkedReception);
  const renderAttackRows=groups=>groups.slice(0,12).map(g=>`<tr><td><b>${esc(g.name)}</b></td><td>${g.stats.n}</td><td>${g.stats.counts['#']}</td><td>${g.stats.counts['=']}</td><td>${g.stats.counts['/']}</td><td>${fmt(g.stats.killPct)}</td><td>${fmt(g.stats.eff)}</td><td>${g.stats.n<8?'Muestra pequeña':`n=${g.stats.n}`}</td><td>${windowTools.pickButton('Ver',keys(g.items),`Ataque · ${g.name}`)}</td></tr>`).join('');
  const rowsTable=(groups,label)=>table(tools,[label,'Intentos','Kill #','Error =','Bloqueado /','Kill %','EFF %','Muestra','Jugadas'],renderAttackRows(groups));
  const coverage=[
   ['Tempo',rows.filter(x=>str(x.a?.attackTempo)).length],
   ['Combinación',rows.filter(x=>str(x.a?.attackCombo)).length],
   ['Dirección',rows.filter(x=>str(x.a?.attackDirection)).length],
   ['Zona destino',rows.filter(x=>zone(x.a?.endZone)).length],
   ['Bloqueadores',rows.filter(x=>str(x.a?.blockers)).length]
  ];
  const kpis=`<div class="vc1880-kpis">${kpi('Ataques',s.n,`# ${s.counts['#']} · + ${s.counts['+']}`)}${kpi('Puntos directos',s.counts['#'],fmt(s.killPct))}${kpi('Errores + bloqueados',s.counts['=']+s.counts['/'],`${s.counts['=']} errores · ${s.counts['/']} bloqueados`)}${kpi('Eficiencia de ataque',fmt(s.eff),`(# − = − /) / ${s.n} intentos`)}</div>`;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · ATAQUE</span><h3>Rendimiento y distribución ofensiva</h3><p>Desglosa los ataques por jugador, tempo, combinación, dirección, destino y rotación. Cada cifra permite abrir las acciones que la componen.</p></div>${kpis}
   <div class="vc1880-grid2">${panel('Ataque por jugador','Ordenado por volumen de intentos; la muestra se muestra en cada fila.',rowsTable(byPlayer,'Atacante'))}${panel('Ataque por tempo','Solo se utilizan los valores attackTempo registrados.',rowsTable(byTempo,'Tempo'))}</div>
   <div class="vc1880-grid2">${panel('Combinaciones','El código attackCombo no se sustituye por el destino de zona.',rowsTable(byCombo,'Combinación'))}${panel('Dirección del ataque','Solo direcciones explícitamente codificadas.',rowsTable(byDirection,'Dirección'))}</div>
   <div class="vc1880-grid2">${panel('Destino de ataque','Distribución por zona de destino; los valores sin zona quedan separados.',rowsTable(byZone,'Destino'))}${panel('Ataque por rotación','La rotación corresponde a la posición registrada al inicio del rally.',rowsTable(byRotation,'Rotación'))}</div>
   <div class="vc1880-grid2">${panel('Ataque tras cada colocador','Solo ataques vinculados a una colocación dentro de la misma posesión.',rowsTable(bySetter,'Colocador'))}${panel('Ataque según recepción previa','La recepción se muestra solo cuando existe una acción previa vinculada.',rowsTable(byReception,'Recepción previa'))}</div>
   ${panel('Profundidad de codificación','Cobertura de los campos que permiten analizar la táctica ofensiva.',`<div class="vc1880-coverage">${coverage.map(([label,n])=>`<div><span>${esc(label)}</span><div><i style="width:${rows.length?Math.round(n/rows.length*100):0}%"></i></div><b>${n}/${rows.length} · ${fmt(pct(n,rows.length))}</b></div>`).join('')}</div>`)}
   <p class="vc1880-method">EFF = (# − = − /) / intentos de ataque. Kill % = # / intentos. Los porcentajes no sustituyen al volumen: revisa siempre el denominador. Las muestras inferiores a ocho intentos se señalan como pequeñas.</p></div>`;
 }
 function blockDefense(data,tools={}){
  setTools(tools);
  const blocks=arr(data?.actions).filter(x=>x.skill==='B'),defenses=arr(data?.actions).filter(x=>x.skill==='D');
  const b=evalStats(blocks),d=evalStats(defenses);
  const blockGroups=[
   ['Bloqueador',x=>x.player],['Zona',x=>zone(x.a?.contactZone||x.a?.startZone)||'Sin zona'],['N.º bloqueadores',x=>str(x.a?.blockers)||'Sin codificar'],['Atacante objetivo',x=>str(x.a?.blockTargetNumber)||'Sin codificar'],['Tipo de bloqueo',x=>str(x.a?.skillSubtype)||'Sin codificar']
  ];
  const defenseGroups=[['Defensor',x=>x.player],['Zona de contacto',x=>zone(x.a?.contactZone||x.a?.endZone)||'Sin zona'],['Tipo de defensa',x=>str(x.a?.skillSubtype)||'Sin codificar']];
  const renderRows=(groups,kind)=>groups.slice(0,12).map(g=>{
   const s=g.stats;
   return `<tr><td><b>${esc(g.name)}</b></td><td>${s.n}</td><td>${s.counts['#']}</td><td>${s.counts['+']}</td><td>${s.counts['!']}</td><td>${s.counts['-']}</td><td>${s.counts['/']}</td><td>${s.counts['=']}</td><td>${windowTools.pickButton('Ver',keys(g.items),`${kind} · ${g.name}`)}</td></tr>`;
  }).join('');
  const makeGroups=(rows,defs)=>defs.map(([label,getter])=>({label,groups:groupStats(rows,getter)}));
  const bg=makeGroups(blocks,blockGroups),dg=makeGroups(defenses,defenseGroups);
  const rallyOutcome=rows=>{
   const map=new Map();
   for(const x of rows){const key=rallyKey(x.r);if(!map.has(key))map.set(key,x.r?.winning===data.target)}
   const n=map.size,w=[...map.values()].filter(Boolean).length;
   return {n,w,pct:pct(w,n)};
  };
  const combinedRally=rallyOutcome([...blocks,...defenses]);
  const groupPanels=(groups,kind)=>groups.map(g=>panel(`${kind} por ${g.label.toLowerCase()}`,`Distribución de acciones de ${kind.toLowerCase()} según ${g.label.toLowerCase()}.`,table(tools,['Categoría','Acciones','#','+','!','-','/','=','Jugadas'],renderRows(g.groups,kind))));
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>FUNDAMENTOS · BLOQUEO Y DEFENSA</span><h3>Acciones de contención</h3><p>Separa el resultado de la acción individual del resultado del rally. No se atribuyen puntos de equipo a un jugador por aparecer en una secuencia.</p></div>
   <div class="vc1880-kpis">${kpi('Bloqueos',b.n,`${b.counts['#']} puntos directos · ${b.counts['=']} errores`)}${kpi('Puntos de bloqueo',b.counts['#'],fmt(pct(b.counts['#'],b.n)))}${kpi('Defensas',d.n,`${d.positive} positivas #/+`)}${kpi('Rallies ganados con bloqueo/defensa',`${combinedRally.w}/${combinedRally.n}`,'Presencia de la acción en el rally, no atribución causal')}</div>
   <div class="vc1880-grid2">${panel('Evaluación del bloqueo','Distribución de los códigos registrados.',evalStrip(b))}${panel('Evaluación de la defensa','Distribución de los códigos registrados.',evalStrip(d))}</div>
   <div class="vc1880-grid2">${groupPanels(bg,'Bloqueo').join('')}${groupPanels(dg,'Defensa').join('')}</div>
   <p class="vc1880-method">Los rallies ganados se cuentan una vez por grupo de acción y no representan puntos causados por el bloqueo o la defensa. Los valores sin codificar no se interpretan como ausencia de bloqueo o de defensa.</p></div>`;
 }
 function quality(data,tools={}){
  setTools(tools);
  const rows=arr(data?.quality),skills=Object.entries(SKILLS).map(([code,name])=>{
   const fields=rows.filter(x=>x.skill===code);
   const total=fields[0]?.total||0,complete=fields.reduce((sum,x)=>sum+num(x.n),0),denom=fields.reduce((sum,x)=>sum+num(x.total),0);
   return {code,name,fields,total,complete,denom};
  }).filter(x=>x.fields.length);
  const actions=arr(data?.actions),rallies=arr(data?.rallies);
  const unknownRot=rallies.filter(r=>!(data.target==='opponent'?r.opponentRotation:r.rotation)).length;
  const covered=rows.filter(x=>x.pct!=null);const avgCoverage=covered.length?Math.round(covered.reduce((sum,x)=>sum+num(x.pct),0)/covered.length):null;
  const coveragePanels=skills.map(s=>panel(`${s.name} · campos tácticos`,`${s.fields.length} campos comprobados sobre ${s.fields[0]?.total||0} acciones del fundamento.`, `<div class="vc1880-coverage">${s.fields.map(f=>`<div><span>${esc(f.field)}</span><div><i style="width:${f.pct==null?0:Math.max(0,Math.min(100,f.pct))}%"></i></div><b>${f.n}/${f.total} · ${fmt(f.pct)}</b></div>`).join('')}</div>`,`${s.code} · ${s.fields[0]?.total||0}`));
  const allRows=arr(data?.extracted?.rallies),open=allRows.filter(r=>!r.winning).length;
  return `<div class="vc1880-root"><div class="vc1880-intro"><span>CONTROL DE CALIDAD · SCOUTING</span><h3>Fiabilidad y profundidad del registro</h3><p>Esta pantalla mide la cobertura de codificación y los datos pendientes. No es una valoración del rendimiento deportivo.</p></div>
   <div class="vc1880-kpis">${kpi('Rallies analizados',data?.points?.rallies||0,'Rallies cerrados y válidos')}${kpi('Acciones del equipo',actions.length,'Acciones cerradas del filtro actual')}${kpi('Rallies sin resultado',open,'En el scouting completo; no entran en métricas')}${kpi('Acciones con referencia de vídeo',data?.videoCount||0,`De ${actions.length} acciones analizadas`)}</div>
   <div class="vc1880-grid2">${panel('Estado del registro','Indicadores de integridad del scouting seleccionado.',`<div class="vc1880-statusgrid"><div><span>Rallies con saque no identificado</span><b>${num(data?.unknownServe)}</b></div><div><span>Rallies con rotación no identificada</span><b>${unknownRot}</b></div><div><span>Acciones de todos los fundamentos</span><b>${arr(data?.extracted?.actions).length}</b></div><div><span>Campos de codificación comprobados</span><b>${rows.length}</b></div></div>`)}${panel('Cobertura global de campos','Media descriptiva de los campos comprobados; no equivale a calidad del rendimiento.',`<div class="vc1880-coverage"><div><span>Completitud media</span><div><i style="width:${avgCoverage==null?0:Math.max(0,Math.min(100,avgCoverage))}%"></i></div><b>${fmt(avgCoverage)}</b></div></div><p class="vc1880-help">La media se calcula sobre campos con denominador disponible. Consulta el detalle por fundamento para interpretar cada valor.</p>`)}</div>
   <div class="vc1880-quality-grid">${coveragePanels.join('')}</div>
   <p class="vc1880-method">Las acciones del análisis proceden de rallies cerrados. Los rallies sin resultado permanecen en el scouting y se excluyen de los denominadores. Un campo vacío significa «no codificado», no que la acción no haya ocurrido.</p></div>`;
 }
 const CSS=`
 #vc157-studio .vc1880-root{display:grid;gap:13px;min-width:0;color:#18364f}
 #vc157-studio .vc1880-intro{padding:18px 20px;border:1px solid #d8e5ef;border-radius:14px;background:linear-gradient(115deg,#f3f8fd,#fff);display:grid;gap:5px}
 #vc157-studio .vc1880-intro>span{font:900 9px/1.4 system-ui;letter-spacing:.13em;color:#2b72a7}
 #vc157-studio .vc1880-intro h3{margin:0!important;font:850 20px/1.25 system-ui!important;color:#123c5d!important}
 #vc157-studio .vc1880-intro p{margin:0!important;color:#68839a;font:500 11px/1.55 system-ui;max-width:900px}
 #vc157-studio .vc1880-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
 #vc157-studio .vc1880-kpi{border:1px solid #dbe6ef;border-radius:12px;background:#fff;padding:13px;min-width:0;display:grid;gap:4px;align-content:start}
 #vc157-studio .vc1880-kpi>span{font:850 9px/1.35 system-ui;color:#67839a;text-transform:uppercase;letter-spacing:.045em}
 #vc157-studio .vc1880-kpi>strong{font:850 24px/1.15 system-ui;color:#143e60;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 #vc157-studio .vc1880-kpi>small{font:500 10px/1.4 system-ui;color:#7890a3}
 #vc157-studio .vc1880-kpi>em{font:800 9px system-ui;color:#3676a6;font-style:normal}
 #vc157-studio .vc1880-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
 #vc157-studio .vc1880-quality-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
 #vc157-studio .vc1880-panel{border:1px solid #dce6ee;border-radius:13px;background:#fff;padding:15px;min-width:0;box-shadow:0 5px 17px rgba(17,54,82,.035)}
 #vc157-studio .vc1880-panelhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}
 #vc157-studio .vc1880-panelhead>div{min-width:0}
 #vc157-studio .vc1880-panelhead span{font:900 8px/1.3 system-ui;letter-spacing:.12em;color:#6391b2}
 #vc157-studio .vc1880-panelhead h3{font:850 15px/1.3 system-ui!important;color:#173f5f!important;margin:3px 0!important}
 #vc157-studio .vc1880-panelhead p{font:500 10px/1.5 system-ui;color:#6e879b;margin:0!important}
 #vc157-studio .vc1880-tag{flex:none;padding:5px 8px;border:1px solid #d9e7f2;border-radius:100px;background:#f1f7fc;color:#356d95;font:800 9px system-ui}
 #vc157-studio .vc1880-tablewrap{width:100%;overflow:auto}
 #vc157-studio .vc1880-table{width:100%;min-width:540px;border-collapse:separate;border-spacing:0;font:500 10px/1.4 system-ui}
 #vc157-studio .vc1880-table th{padding:8px 7px;background:#f3f7fa;color:#58758d;text-align:left;font-weight:850;white-space:nowrap;border-bottom:1px solid #dce7ef}
 #vc157-studio .vc1880-table td{padding:8px 7px;color:#365a75;border-bottom:1px solid #edf2f6;vertical-align:middle}
 #vc157-studio .vc1880-table td b{color:#1a4567}
 #vc157-studio .vc1880-table small{display:block;color:#8195a6}
 #vc157-studio .vc1880-table button{min-height:28px!important;padding:5px 8px!important;font:800 9px system-ui!important}
 #vc157-studio .vc1880-sample{font-size:9px;color:#9a6c32}
 #vc157-studio .vc1880-evals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
 #vc157-studio .vc1880-evals>div{display:grid;gap:3px;padding:9px 5px;border-radius:8px;background:#f5f8fb;text-align:center}
 #vc157-studio .vc1880-evals b{font:900 15px system-ui;color:#1b5682}
 #vc157-studio .vc1880-evals strong{font:850 18px system-ui;color:#173e5c}
 #vc157-studio .vc1880-evals small{font:500 8px system-ui;color:#7890a3}
 #vc157-studio .vc1880-coverage{display:grid;gap:10px}
 #vc157-studio .vc1880-coverage>div{display:grid;grid-template-columns:minmax(100px,150px) minmax(60px,1fr) auto;align-items:center;gap:9px;font:700 10px system-ui;color:#5e7c94}
 #vc157-studio .vc1880-coverage>div>div{height:8px;border-radius:20px;background:#e6eef4;overflow:hidden}
 #vc157-studio .vc1880-coverage i{display:block;height:100%;background:linear-gradient(90deg,#1d67a4,#39a0cf);border-radius:20px}
 #vc157-studio .vc1880-coverage b{font-variant-numeric:tabular-nums;color:#244e6d;white-space:nowrap}
 #vc157-studio .vc1880-statusgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 #vc157-studio .vc1880-statusgrid>div{padding:10px;border-radius:9px;background:#f5f8fb;display:grid;gap:4px}
 #vc157-studio .vc1880-statusgrid span{font:650 9px system-ui;color:#71889b}
 #vc157-studio .vc1880-statusgrid b{font:850 18px system-ui;color:#1a4668}
 #vc157-studio .vc1880-help{font:500 10px/1.5 system-ui;color:#72899b;margin:10px 0 0}
 #vc157-studio .vc1880-empty{padding:16px;border:1px dashed #cbdce8;border-radius:10px;color:#6f879a;background:#f8fbfd;font:600 11px/1.5 system-ui}
 #vc157-studio .vc1880-method{padding:10px 12px;border-left:3px solid #8eb9d8;background:#f4f8fb;color:#647f94;font:500 10px/1.5 system-ui;margin:0;border-radius:0 8px 8px 0}
 @media(max-width:1150px){#vc157-studio .vc1880-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1880-grid2,#vc157-studio .vc1880-quality-grid{grid-template-columns:1fr}}
 @media(max-width:650px){#vc157-studio .vc1880-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#vc157-studio .vc1880-kpi{padding:9px}#vc157-studio .vc1880-kpi>strong{font-size:20px}#vc157-studio .vc1880-panel{padding:11px}#vc157-studio .vc1880-coverage>div{grid-template-columns:90px minmax(40px,1fr);gap:6px}#vc157-studio .vc1880-coverage b{grid-column:2}#vc157-studio .vc1880-evals{grid-template-columns:repeat(3,minmax(0,1fr))}}
 `;
 function installStyle(doc){const d=doc||(typeof document!=='undefined'?document:null);if(!d||d.getElementById('vc1880-analysis-css'))return;const s=d.createElement('style');s.id='vc1880-analysis-css';s.textContent=CSS;d.head.appendChild(s)}
 function renderServeReceive(data,tools){installStyle();return serveReceive(data,tools)}
 function renderAttack(data,tools){installStyle();return attack(data,tools)}
 function renderBlockDefense(data,tools){installStyle();return blockDefense(data,tools)}
 function renderQuality(data,tools){installStyle();return quality(data,tools)}
 return {version:'18.8.0',evalStats,serveReceive,attack,blockDefense,quality,renderServeReceive,renderAttack,renderBlockDefense,renderQuality,installStyle,css:CSS};
});

/* VC20714_SOURCE_END:167-vc1880-analysis-pro.js */

;
/* VC20714_SOURCE_BEGIN:168-vc1881-setter-pro.js */
/* Volley Coach V18.8.1 · Setter & Offensive Systems Pro
 * Read-only extension over the canonical VC_ANALYSIS_INTELLIGENCE_1614 model.
 * Uses only explicitly coded actions and same-match video timestamps.
 * No scouting writes, score changes, persistence, cloud access or sync hooks.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_SETTER_PRO_1881=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const EVALS=['#','+','!','-','/','='];
 const EVAL_LABELS={'#':'Punto / perfecta','+':'Positiva','!':'Intermedia','-':'Negativa','/':'Muy negativa','=':'Error'};
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const pct=(a,b)=>b?Math.round((a/b)*1000)/10:null;
 const fmt=x=>x==null?'—':`${Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`Z${m[1]}${m[2]||''}`:''};
 const median=values=>{const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
 const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const fmtSec=x=>x==null?'—':`${x.toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})} s`;
 const keyOfRally=r=>`${r?.set??''}/${r?.id??r?.index??''}`;
 const group=(rows,fn)=>{const m=new Map();for(const x of arr(rows)){const k=txt(fn(x))||'Sin registrar';if(!m.has(k))m.set(k,[]);m.get(k).push(x)}return [...m].map(([name,items])=>({name,items})).sort((a,b)=>b.items.length-a.items.length||a.name.localeCompare(b.name,'es'))};
 const stats=rows=>{const a=arr(rows).filter(Boolean),n=a.length,k=a.filter(x=>x.ev==='#').length,e=a.filter(x=>x.ev==='=').length,b=a.filter(x=>x.ev==='/').length;return {n,k,e,b,kill:pct(k,n),eff:pct(k-e-b,n)}};
 const phaseLabels={K1:'K1 · recepción',K2:'K2 · saque',TR:'Transición',FB:'Freeball'};
 function phaseInfo(pair,target){
  const raw=txt(pair?.set?.a?.phase||pair?.attack?.a?.phase).toUpperCase();
  if(Object.prototype.hasOwnProperty.call(phaseLabels,raw))return {code:raw,label:phaseLabels[raw],source:'Codificada'};
  const serving=pair?.r?.serving;
  if(serving==='ours'||serving==='opponent'){
   const code=serving===target?'K2':'K1';
   return {code,label:phaseLabels[code],source:'Derivada del equipo que sirve'};
  }
  return {code:'UNK',label:'Sin fase identificada',source:'Sin dato'};
 }
 function videoStamp(action){
  const a=action?.a||{};
  const mapped=Number(a.videoAction);
  if(a.videoAction!==null&&a.videoAction!==undefined&&a.videoAction!==''&&Number.isFinite(mapped)&&mapped>=0)
   return {seconds:mapped,kind:'mapped',source:txt(a.videoSource)};
  const direct=Number(a.videoTime);
  if(a.videoTime!==null&&a.videoTime!==undefined&&a.videoTime!==''&&Number.isFinite(direct)&&direct>=0)
   return {seconds:direct,kind:'direct',source:txt(a.videoSource)};
  return null;
 }
 function compatibleDelta(first,second,maxSeconds=30){
  const a=videoStamp(first),b=videoStamp(second);
  if(!a||!b||a.kind!==b.kind)return null;
  if(a.source&&b.source&&a.source!==b.source)return null;
  const d=b.seconds-a.seconds;
  return Number.isFinite(d)&&d>=0&&d<=maxSeconds?d:null;
 }
 function findReception(pair,target){
  const rows=arr(pair?.r?.actions),ix=rows.findIndex(x=>x?.key===pair?.set?.key);
  if(ix<0)return null;
  for(let i=ix-1;i>=0;i--){
   const x=rows[i];
   if(x?.team!==target||['S','E','A'].includes(x?.skill))break;
   if(x?.skill==='R')return x;
  }
  return null;
 }
 function buildRows(data){
  const target=data?.target==='opponent'?'opponent':'ours';
  return arr(data?.pairs).map(pair=>{
   const set=pair?.set||null,attack=pair?.attack||null,rec=findReception(pair,target);
   const phase=phaseInfo(pair,target),r=pair?.r||{};
   const rotation=target==='opponent'?num(r.opponentRotation):num(r.rotation);
   const tempo=txt(set?.a?.setTempo)||'Sin registrar';
   const attackTempo=txt(attack?.a?.attackTempo)||'Sin registrar';
   const combo=txt(set?.a?.attackCombo||attack?.a?.attackCombo)||'Sin registrar';
   const destination=txt(set?.a?.setTarget)||'Sin registrar';
   const setterCall=txt(set?.a?.setterCall)||'Sin registrar';
   const setType=txt(set?.a?.dvSetType)||'Sin registrar';
   const attacker=attack?.player||'Sin ataque vinculado';
   const reception=rec?({'#':'Perfecta (#)','+':'Positiva (+)','!':'Intermedia (!)','-':'Negativa (-)','/':'Muy negativa (/)','=':'Error (=)'}[rec.ev]||'Sin valoración estándar'):'Sin recepción vinculada';
   const keys=[rec?.key,set?.key,attack?.key].filter(Boolean);
   return {pair,set,attack,rec,phase,rotation,tempo,attackTempo,combo,destination,setterCall,setType,setter:set?.player||'Sin identificar',attacker,reception,keys,
    rallyKey:keyOfRally(r),rallyWon:r.winning===target,
    recToSet:rec&&set?compatibleDelta(rec,set):null,
    setToAttack:set&&attack?compatibleDelta(set,attack):null};
  });
 }
 function applyFilters(rows,state={}){
  return rows.filter(x=>(!state.setterPlayer||x.setter===state.setterPlayer)&&
   (!state.setterReception||x.receptionClass===state.setterReception)&&
   (!state.setterTempo||x.tempo===state.setterTempo));
 }
 function enrich(rows){
  return rows.map(x=>({...x,receptionClass:!x.rec?'Sin recepción registrada':['#','+'].includes(x.rec.ev)?'Positiva / perfecta':'Otra recepción'}));
 }
 function makeTools(tools={}){
  const pick=typeof tools.pickButton==='function'?tools.pickButton:(label,keys,title)=>`<button type="button" disabled>${esc(label)}</button>`;
  const table=typeof tools.table==='function'?tools.table:(headers,rows)=>`<div class="vc1881-tablewrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">Sin datos para los filtros actuales.</td></tr>`}</tbody></table></div>`;
  return {pick,table};
 }
 function kpi(label,value,detail){return `<article class="vc1881-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`}
 function panel(title,copy,body,tag=''){return `<section class="vc1881-panel"><header><div><span>ANÁLISIS TÁCTICO</span><h3>${esc(title)}</h3><p>${esc(copy)}</p></div>${tag?`<b>${esc(tag)}</b>`:''}</header>${body}</section>`}
 function sample(n){return n<5?'<em class="vc1881-small-sample">Muestra pequeña · N &lt; 5</em>':''}
 function render(data,state={},tools={}){
  const {pick,table}=makeTools(tools),all=enrich(buildRows(data)),rows=applyFilters(all,state),total=rows.length;
  const setters=group(rows,x=>x.setter),linked=rows.filter(x=>x.attack),attackStats=stats(linked.map(x=>x.attack));
  const withTarget=rows.filter(x=>x.destination!=='Sin registrar').length,withTempo=rows.filter(x=>x.tempo!=='Sin registrar').length;
  const recTimes=rows.map(x=>x.recToSet).filter(x=>x!=null),setTimes=rows.map(x=>x.setToAttack).filter(x=>x!=null);
  const medianRec=median(recTimes),medianSet=median(setTimes);
  const videoCoverage=rows.filter(x=>x.recToSet!=null||x.setToAttack!=null).length;
  const filterPlayers=[...new Set([...all.map(x=>x.setter),...(state.setterPlayer?[state.setterPlayer]:[])])].sort((a,b)=>a.localeCompare(b,'es'));
  const filterTempos=[...new Set([...all.map(x=>x.tempo),...(state.setterTempo?[state.setterTempo]:[])])].sort((a,b)=>a.localeCompare(b,'es'));
  const filters=`<div class="vc1881-filters"><label>Colocador<select id="vc1621-setter-player"><option value="">Todos los colocadores</option>${filterPlayers.map(x=>`<option value="${esc(x)}" ${state.setterPlayer===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Recepción previa<select id="vc1621-setter-reception"><option value="">Todas / K1 y transición</option>${['Positiva / perfecta','Otra recepción','Sin recepción registrada'].map(x=>`<option value="${esc(x)}" ${state.setterReception===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Tempo colocación<select id="vc1621-setter-tempo"><option value="">Todos los tempos</option>${filterTempos.map(x=>`<option value="${esc(x)}" ${state.setterTempo===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>`;
  const setterRows=setters.map(g=>{
   const linkedRows=g.items.filter(x=>x.attack),st=stats(linkedRows.map(x=>x.attack));
   const dest=g.items.filter(x=>x.destination!=='Sin registrar').length,tempo=g.items.filter(x=>x.tempo!=='Sin registrar').length;
   const keys=[...new Set(g.items.flatMap(x=>x.keys))];
   return `<tr><td><b>${esc(g.name)}</b>${sample(g.items.length)}</td><td>${g.items.length}</td><td>${fmt(pct(g.items.length,total))}</td><td>${dest}/${g.items.length} · ${fmt(pct(dest,g.items.length))}</td><td>${tempo}/${g.items.length} · ${fmt(pct(tempo,g.items.length))}</td><td>${linkedRows.length}/${g.items.length}</td><td>${st.k}/${st.n}</td><td>${fmt(st.eff)}</td><td>${pick('Ver',keys,`Colocador ${g.name}`)}</td></tr>`;
  }).join('');
  const rotationGroups=group(rows,x=>`${x.rotation||'?' }|${x.phase.code}|${x.setter}`)
   .map(g=>{const f=g.items[0],st=stats(g.items.filter(x=>x.attack).map(x=>x.attack)),dest=group(g.items,x=>x.destination)[0]?.name||'Sin registrar';return {...g,rotation:f.rotation,phase:f.phase,setter:f.setter,st,dest}})
   .sort((a,b)=>num(a.rotation)-num(b.rotation)||a.phase.localeCompare(b.phase)||b.items.length-a.items.length);
  const matrixSetters=[...new Set(rows.map(x=>x.setter))].sort((a,b)=>a.localeCompare(b,'es'));
  const matrixRows=matrixSetters.map(name=>{
   const own=rows.filter(x=>x.setter===name),cells=[1,2,3,4,5,6].map(rot=>{
    const n=own.filter(x=>x.rotation===rot).length,den=rows.filter(x=>x.rotation===rot).length;
    return `<td>${n?`${n} <small>${fmt(pct(n,den))}</small>`:'—'}</td>`;
   }).join('');
   return `<tr><td><b>${esc(name)}</b></td>${cells}<td><b>${own.length}</b></td></tr>`;
  }).join('');
  const rotationRows=rotationGroups.map(g=>`<tr><td><b>${g.rotation?`R${g.rotation}`:'—'}</b></td><td>${esc(g.phase)}</td><td>${esc(g.setter)}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.dest)}</td><td>${pick('Jugadas',[...new Set(g.items.flatMap(x=>x.keys))],`R${g.rotation} · ${g.phase} · ${g.setter}`)}</td></tr>`).join('');
  const setterAttacker=group(rows,x=>`${x.setter}|||${x.attacker}`).map(g=>{
   const first=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack));
   const tempos=group(g.items,x=>x.tempo),dest=group(g.items,x=>x.destination);
   return {...g,setter:first.setter,attacker:first.attacker,st,tempo:tempos[0]?.name||'Sin registrar',destination:dest[0]?.name||'Sin registrar'};
  });
  const setterAttackerRows=setterAttacker.map(g=>`<tr><td>${esc(g.setter)}</td><td><b>${esc(g.attacker)}</b></td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.kill)}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.tempo)}</td><td>${esc(g.destination)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],`${g.setter} → ${g.attacker}`)}</td></tr>`).join('');
  const systemGroups=group(rows,x=>`${x.tempo}|||${x.setterCall}|||${x.setType}|||${x.combo}|||${x.attacker}|||${x.attackTempo}`).map(g=>{
   const f=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack));
   return {...g,tempo:f.tempo,setterCall:f.setterCall,setType:f.setType,combo:f.combo,attacker:f.attacker,attackTempo:f.attackTempo,st};
  });
  const systemRows=systemGroups.map(g=>`<tr><td>${esc(g.tempo)}</td><td>${esc(g.setterCall)}</td><td>${esc(g.setType)}</td><td>${esc(g.combo)}</td><td>${esc(g.attacker)}</td><td>${esc(g.attackTempo)}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],`${g.tempo} · ${g.combo} · ${g.attacker}`)}</td></tr>`).join('');
  const phases=group(rows,x=>`${x.phase.code}|||${x.phase.label}|||${x.phase.source}`).map(g=>{
   const f=g.items[0],att=g.items.filter(x=>x.attack),st=stats(att.map(x=>x.attack)),rallies=new Set(g.items.map(x=>x.rallyKey));
   return {...g,code:f.phase.code,label:f.phase.label,source:f.phase.source,st,rallies:rallies.size};
  }).sort((a,b)=>['K1','K2','TR','FB','UNK'].indexOf(a.code)-['K1','K2','TR','FB','UNK'].indexOf(b.code));
  const phaseRows=phases.map(g=>`<tr><td><b>${esc(g.label)}</b></td><td>${g.rallies}</td><td>${g.items.length}</td><td>${g.items.filter(x=>x.attack).length}</td><td>${g.st.k}/${g.st.n}</td><td>${fmt(g.st.eff)}</td><td>${esc(g.source)}</td><td>${pick('Ver',[...new Set(g.items.flatMap(x=>x.keys))],g.label)}</td></tr>`).join('');
  const evalCounts=Object.fromEntries(EVALS.map(k=>[k,rows.filter(x=>x.set?.ev===k).length]));
  const evalStrip=`<div class="vc1881-evals">${EVALS.map(k=>`<div><b>${k}</b><strong>${evalCounts[k]}</strong><small>${EVAL_LABELS[k]}</small></div>`).join('')}</div>`;
  const timeRows=`<div class="vc1881-timegrid"><div><span>Recepción → colocación</span><strong>${fmtSec(medianRec)}</strong><small>Mediana · N=${recTimes.length}</small></div><div><span>Colocación → ataque</span><strong>${fmtSec(medianSet)}</strong><small>Mediana · N=${setTimes.length}</small></div><div><span>Secuencias con marcas de vídeo</span><strong>${videoCoverage}/${total}</strong><small>${fmt(pct(videoCoverage,total))} de la muestra</small></div></div>`;
  const noRows=total? '' : '<div class="vc1881-empty">No hay colocaciones que coincidan con los filtros actuales. Comprueba el equipo, set, rotación y fase seleccionados en la cabecera del análisis.</div>';
  return `<div class="vc1881-root"><section class="vc1881-hero"><div><span>VOLLEY COACH · ANALYSIS PRO 3.1 · V18.8.1</span><h3>Colocador Pro y sistemas ofensivos</h3><p>Distribución por rotación y fase, conexiones colocador–atacante, combinaciones y tiempos entre marcas de vídeo verificables.</p></div><b>${total} colocaciones</b></section>${filters}
   <div class="vc1881-kpis">${kpi('Colocaciones',total,`De ${arr(data?.pairs).length} del filtro actual`)}${kpi('Ataques vinculados',`${linked.length}/${total}`,fmt(pct(linked.length,total)))}${kpi('Destino registrado',`${withTarget}/${total}`,fmt(pct(withTarget,total)))}${kpi('Tempo registrado',`${withTempo}/${total}`,fmt(pct(withTempo,total)))}${kpi('Ataque · kill',`${attackStats.k}/${attackStats.n}`,fmt(attackStats.kill))}${kpi('Ataque · EFF',fmt(attackStats.eff),`${attackStats.n} ataques valorados`)}</div>
   ${noRows}
   ${panel('Matriz de colocaciones por rotación','Cada celda muestra colocaciones y porcentaje del volumen de esa rotación. La matriz respeta los filtros activos del encabezado.',table(['Colocador','R1','R2','R3','R4','R5','R6','Total'],matrixRows))}
   ${panel('Qué colocador organiza cada rotación','Una fila por rotación, fase y colocador identificado. El volumen cuenta colocaciones, no rallies ni puntos.',table(['Rotación','Fase','Colocador','Coloc.','Atq. enlaz.','Kill/T','EFF','Destino más usado','Evidencia'],rotationRows),'R1–R6')}
   ${panel('Perfil de cada colocador','Uso, completitud de codificación y rendimiento de los ataques realmente vinculados. EFF no es una puntuación individual del colocador.',table(['Colocador','Coloc.','Uso','Destino','Tempo','Atq. enlaz.','Kill/T','EFF','Evidencia'],setterRows))}
   <div class="vc1881-grid2">${panel('Conexión colocador → atacante','Permite detectar qué parejas aparecen y qué resultados tienen sus ataques enlazados.',table(['Colocador','Atacante','Coloc.','Atq. enlaz.','Kill/T','Kill %','EFF','Tempo más usado','Destino más usado','Evidencia'],setterAttackerRows))}${panel('Sistemas ofensivos','Agrupa tempo de colocación, combinación registrada y atacante. Los códigos no se infieren cuando faltan.',table(['Tempo coloc.','Setter call','Tipo DV','Combinación','Atacante','Tempo ataque','Coloc.','Atq. enlaz.','Kill/T','EFF','Evidencia'],systemRows))}</div>
   ${panel('K1, K2 y transiciones','Se usa la fase explícita de la acción cuando existe; si falta, K1/K2 se deriva del equipo que servía al inicio del rally. TR y FB solo se muestran si están codificados.',table(['Fase','Rallies','Coloc.','Atq. enlaz.','Kill/T','EFF','Origen fase','Evidencia'],phaseRows))}
   <div class="vc1881-grid2">${panel('Valoración registrada de la colocación','Distribución literal de la evaluación codificada. No se interpreta como calidad técnica sin una escala definida.',evalStrip)}${panel('Análisis temporal con vídeo','Solo se calcula cuando colocación y ataque tienen marcas de vídeo compatibles en el mismo partido.',timeRows+`<p class="vc1881-note">Los intervalos son diferencias entre marcas de vídeo guardadas en el scouting. No miden la velocidad del balón ni el tiempo biomecánico de vuelo. Se excluyen marcas incompatibles, negativas o separadas por más de 30 segundos.</p>`)}</div>
   <p class="vc1881-method">Método: los ataques se enlazan dentro del mismo rally y hasta la siguiente interrupción por acción rival u otra colocación. Kill = # / ataques vinculados; EFF = (# − = − /) / ataques valorados. Los denominadores se muestran en todas las tablas. Una colocación puede no tener ataque enlazado; no se rellena con una inferencia.</p></div>`;
 }
 const CSS=`
 #vc157-studio .vc1881-root{display:grid;gap:12px;min-width:0;color:#193d59}
 #vc157-studio .vc1881-hero{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 19px;border:1px solid #d6e5f0;border-radius:14px;background:linear-gradient(112deg,#f0f6fc,#fff)}
 #vc157-studio .vc1881-hero span{font:900 9px/1.4 system-ui;letter-spacing:.12em;color:#2870a5}
 #vc157-studio .vc1881-hero h3{margin:4px 0!important;font:850 20px/1.25 system-ui!important;color:#143d5e!important}
 #vc157-studio .vc1881-hero p{margin:0!important;font:500 11px/1.5 system-ui;color:#6a8499}
 #vc157-studio .vc1881-hero>b{flex:none;padding:8px 11px;border-radius:9px;background:#e4f0fa;color:#1b5b8e;font:850 11px system-ui}
 #vc157-studio .vc1881-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:12px;border:1px solid #dce7ef;border-radius:12px;background:#f7fafc}
 #vc157-studio .vc1881-filters label{display:grid;gap:5px;font:800 9px system-ui;color:#5c7890}
 #vc157-studio .vc1881-filters select{width:100%;min-width:0;min-height:37px;border:1px solid #cbdce9;border-radius:8px;padding:7px 9px;background:#fff;color:#244e6d;font:650 11px system-ui}
 #vc157-studio .vc1881-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
 #vc157-studio .vc1881-kpi{min-width:0;display:grid;gap:4px;align-content:start;padding:11px;border:1px solid #dce7ef;border-radius:11px;background:#fff}
 #vc157-studio .vc1881-kpi span{font:850 8px/1.35 system-ui;color:#70889c;text-transform:uppercase;letter-spacing:.04em}
 #vc157-studio .vc1881-kpi strong{font:850 21px/1.2 system-ui;color:#153f60;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 #vc157-studio .vc1881-kpi small{font:500 9px/1.4 system-ui;color:#7890a3}
 #vc157-studio .vc1881-panel{min-width:0;padding:14px;border:1px solid #dce6ee;border-radius:12px;background:#fff;box-shadow:0 4px 15px #123b5908}
 #vc157-studio .vc1881-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
 #vc157-studio .vc1881-panel>header>div{min-width:0}
 #vc157-studio .vc1881-panel>header span{font:900 8px system-ui;letter-spacing:.12em;color:#6b91ad}
 #vc157-studio .vc1881-panel>header h3{margin:3px 0!important;font:850 14px/1.3 system-ui!important;color:#194665!important}
 #vc157-studio .vc1881-panel>header p{margin:0!important;font:500 10px/1.45 system-ui;color:#71899d}
 #vc157-studio .vc1881-panel>header>b{flex:none;padding:5px 8px;border-radius:20px;background:#f0f6fb;color:#3b6d92;font:800 9px system-ui}
 #vc157-studio .vc1881-panel .vc157-tablewrap{width:100%;overflow:auto}
 #vc157-studio .vc1881-panel table{width:100%;min-width:640px;border-collapse:separate;border-spacing:0;font:500 9px/1.4 system-ui}
 #vc157-studio .vc1881-panel th{padding:8px 7px;background:#f3f7fa;color:#5a768d;text-align:left;white-space:nowrap;font-weight:850;border-bottom:1px solid #dce7ef}
 #vc157-studio .vc1881-panel td{padding:8px 7px;color:#3b5c75;border-bottom:1px solid #edf2f6;vertical-align:middle}
 #vc157-studio .vc1881-panel td b{color:#1a4667}
 #vc157-studio .vc1881-panel td button{min-height:26px!important;padding:4px 7px!important;font:800 9px system-ui!important}
 #vc157-studio .vc1881-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:start}
 #vc157-studio .vc1881-evals{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
 #vc157-studio .vc1881-evals>div{display:grid;gap:3px;padding:8px 4px;text-align:center;border-radius:8px;background:#f4f8fb}
 #vc157-studio .vc1881-evals b{font:900 14px system-ui;color:#24628f}
 #vc157-studio .vc1881-evals strong{font:850 17px system-ui;color:#183f5d}
 #vc157-studio .vc1881-evals small{font:500 8px system-ui;color:#7890a3}
 #vc157-studio .vc1881-timegrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
 #vc157-studio .vc1881-timegrid>div{display:grid;gap:5px;padding:10px;border-radius:9px;background:#f4f8fb}
 #vc157-studio .vc1881-timegrid span{font:800 9px system-ui;color:#6a8499}
 #vc157-studio .vc1881-timegrid strong{font:850 19px system-ui;color:#194765}
 #vc157-studio .vc1881-timegrid small{font:500 9px system-ui;color:#7c91a2}
 #vc157-studio .vc1881-note,#vc157-studio .vc1881-method{margin:9px 0 0;padding:9px 11px;border-left:3px solid #8fb8d5;background:#f4f8fb;color:#647f94;font:500 9px/1.5 system-ui;border-radius:0 7px 7px 0}
 #vc157-studio .vc1881-small-sample{display:block;margin-top:3px;color:#9a713d;font:700 8px system-ui;font-style:normal}
 #vc157-studio .vc1881-empty{padding:14px;border:1px dashed #cbdce8;border-radius:9px;background:#f8fbfd;color:#6f879a;font:600 10px/1.5 system-ui}
 @media(max-width:1150px){#vc157-studio .vc1881-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:850px){#vc157-studio .vc1881-grid2{grid-template-columns:1fr}}
 @media(max-width:620px){#vc157-studio .vc1881-filters{grid-template-columns:1fr}#vc157-studio .vc1881-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#vc157-studio .vc1881-kpi{padding:9px}#vc157-studio .vc1881-kpi strong{font-size:18px}#vc157-studio .vc1881-panel{padding:10px}#vc157-studio .vc1881-evals{grid-template-columns:repeat(3,minmax(0,1fr))}#vc157-studio .vc1881-timegrid{grid-template-columns:1fr}}
 `;
 function installStyle(doc){const d=doc||(typeof document!=='undefined'?document:null);if(!d||d.getElementById('vc1881-setter-pro-css'))return;const s=d.createElement('style');s.id='vc1881-setter-pro-css';s.textContent=CSS;d.head.appendChild(s)}
 function renderPage(data,state,tools){installStyle();return render(data,state,tools)}
 return {version:'18.8.1',buildRows,enrich,applyFilters,phaseInfo,videoStamp,compatibleDelta,render,renderPage,installStyle,css:CSS};
});

/* VC20714_SOURCE_END:168-vc1881-setter-pro.js */
