/* Volley Coach V20.7.5 · Analysis UI modules, original deferred execution order preserved. */
/* VC2075_SOURCE_BEGIN:206-vc193195-professional-tactical-tables.js */
/* Volley Coach V19.3.19.5 · Professional Tables & Tactical Views
 * Read-only tactical projection over V19.3.8 canonical match data.
 * No persisted state, guessed contact data, duplicated scouting or video player.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_TACTICAL_TABLES_193195=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.5';
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const pct=(n,d)=>d>0?Math.round(n*1000/d)/10:null;
 const format=x=>x==null?'—':Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
 const num=x=>Number.isFinite(x)?x.toLocaleString('es-ES'):'—';
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const ZONES=[4,3,2,5,6,1],QUADS=['C','B','D','A'],EVALS=['#','+','!','-','/','='];
 const FIELDS=[['startZone','Origen del contacto'],['endZone','Destino del contacto'],['contactZone','Zona de contacto'],['setTarget','Destino de la colocación']];
 const DEFAULT=Object.freeze({skill:'A',field:'',player:'',evaluation:'',zone:null,quadrant:'',rotation:'',table:'zones',focus:null,order:'count'});
 function ensureState(state){
  if(!state.vc193195||typeof state.vc193195!=='object')state.vc193195={...DEFAULT};
  return state.vc193195;
 }
 function defaultField(skill){return skill==='R'?'contactZone':skill==='E'?'setTarget':skill==='A'?'startZone':'endZone';}
 function fieldFor(f){return FIELDS.some(x=>x[0]===f.field)?f.field:defaultField(f.skill);}
 function rotationOf(contact,byRally){
  const rally=byRally.get(contact.rallyKey);
  if(!rally)return null;
  const r=contact.team==='ours'?rally.ownRotation:rally.rivalRotation;
  return Number.isInteger(r)&&r>=1&&r<=6?r:null;
 }
 function evaluate(contacts,skill){
  const rated=contacts.filter(c=>EVALS.includes(c.evaluation)),total=contacts.length;
  const positives=rated.filter(c=>['#','+'].includes(c.evaluation)).length;
  const kills=rated.filter(c=>c.evaluation==='#').length;
  const errors=rated.filter(c=>c.evaluation==='=').length;
  const blocked=rated.filter(c=>c.evaluation==='/').length;
  return {total,rated:rated.length,missing:total-rated.length,positive:positives,positivePct:pct(positives,rated.length),killPct:pct(kills,rated.length),eff:skill==='A'?pct(kills-errors-blocked,rated.length):null,kills,errors,blocked};
 }
 function courtModel(projection,team,filters={}){
  const f={...DEFAULT,...filters},base=projection?.base||{contacts:[],rallies:[]},field=fieldFor(f);
  const byRally=new Map(arr(base.rallies).map(r=>[r.key,r]));
  const all=arr(base.contacts).filter(c=>c.team===team&&c.skill===f.skill);
  const players=[...new Set(all.map(c=>c.player).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const observed=all.filter(c=>(!f.player||c.player===f.player)&&(!f.evaluation||c.evaluation===f.evaluation)&&
   (!f.rotation||(f.rotation==='unknown'?rotationOf(c,byRally)==null:rotationOf(c,byRally)===Number(f.rotation))));
  const zone=c=>{
   const z=c.fields?.[field];
   return z&&Number.isInteger(z.zone)&&z.zone>=1&&z.zone<=6?{zone:z.zone,quadrant:QUADS.includes(z.quadrant)?z.quadrant:''}:null;
  };
  const tagged=observed.map(c=>({contact:c,location:zone(c),rotation:rotationOf(c,byRally)}));
  const located=tagged.filter(x=>x.location),unknown=tagged.length-located.length;
  const area=tagged.filter(x=>(!f.zone||x.location?.zone===Number(f.zone))&&(!f.quadrant||x.location?.quadrant===f.quadrant));
  const keyOf=(x,kind)=>kind==='players'?x.contact.player||'Sin identificar':kind==='rotations'?x.rotation?'P'+x.rotation:'Sin rotación':kind==='evaluations'?x.contact.evaluation||'Sin valorar':x.location?'Z'+x.location.zone:'Sin zona';
  const filtered=area.filter(x=>!f.focus||keyOf(x,f.focus.kind)===f.focus.key);
  const rallyKeys=new Set(filtered.map(x=>x.contact.rallyKey));
  const rallies=arr(base.rallies).filter(r=>rallyKeys.has(r.key));
  const groups=kind=>{
   const rows=new Map();
   for(const x of (kind==='zones'?tagged:area)){
    const key=keyOf(x,kind),row=rows.get(key)||{key,items:[]};row.items.push(x);rows.set(key,row);
   }
   if(kind==='zones')for(const z of ZONES)if(!rows.has('Z'+z))rows.set('Z'+z,{key:'Z'+z,items:[]});
   return [...rows.values()].map(r=>({...r,stats:evaluate(r.items.map(x=>x.contact),f.skill)})).sort((a,b)=>f.order==='name'?a.key.localeCompare(b.key,'es',{numeric:true}):b.items.length-a.items.length||a.key.localeCompare(b.key,'es',{numeric:true}));
  };
  const zoneGroups=ZONES.map(z=>({zone:z,items:located.filter(x=>x.location.zone===z)}));
  return {team,all,players,observed,tagged,located,unknown,area,filtered,rallies,field,groups,zoneGroups,stats:evaluate(filtered.map(x=>x.contact),f.skill),overall:evaluate(observed,f.skill)};
 }
 const choose=(values,current,label='Todos')=>`<option value="">${esc(label)}</option>`+values.map(x=>{const [id,name]=Array.isArray(x)?x:[x,x];return `<option value="${esc(id)}"${val(id)===val(current)?' selected':''}>${esc(name)}</option>`;}).join('');
 const filter=(label,key,values,current,blank='Todos')=>`<label>${esc(label)}<select data-vc193195-filter="${esc(key)}">${choose(values,current,blank)}</select></label>`;
 function courtGrid(model,f){
  const max=Math.max(1,...model.zoneGroups.map(g=>g.items.length)),total=model.located.length;
  const zones=model.zoneGroups.map(g=>{
   const n=g.items.length,stats=evaluate(g.items.map(x=>x.contact),f.skill),isActive=f.zone===g.zone;
   const quads=QUADS.map(q=>{const count=g.items.filter(x=>x.location.quadrant===q).length;
    return `<button type="button" class="vc193195-quad ${isActive&&f.quadrant===q?'is-active':''}" data-vc193195-quad="${g.zone}:${q}" aria-label="Z${g.zone}${q}: ${count} acciones" aria-pressed="${isActive&&f.quadrant===q}"><b>${q}</b><small>${count||'—'}</small></button>`;}).join('');
   return `<div class="vc193195-zone ${isActive?'is-active':''}" style="--heat:${(.07+.36*n/max).toFixed(2)}"><button type="button" data-vc193195-zone="${g.zone}" aria-pressed="${isActive}" class="vc193195-zone-main"><span>Z${g.zone}</span><strong>${n||'—'}</strong><small>${format(pct(n,total))}</small></button><div class="vc193195-quads">${quads}</div><div class="vc193195-zone-eff">${f.skill==='A'?'EFF':'Positivas'} ${format(f.skill==='A'?stats.eff:stats.positivePct)}</div></div>`;
  }).join('');
  return `<div class="vc193195-court"><div class="vc193195-net">RED / NET</div><div class="vc193195-zonegrid">${zones}</div></div><p class="vc193195-micro">A abajo derecha · B arriba derecha · C arriba izquierda · D abajo izquierda. Zona explícita: ${total}/${model.observed.length} contactos.</p>`;
 }
 function tableHTML(model,f){
  const views=[['zones','Zonas'],['players','Jugadores'],['rotations','Rotaciones'],['evaluations','Valoraciones']];
  const kind=views.some(v=>v[0]===f.table)?f.table:'zones',groups=model.groups(kind),denom=kind==='zones'?model.observed.length:model.area.length;
  const positiveHeading=f.skill==='A'?'Kill %':'Positivas %';
  const rows=groups.map(g=>{
   const active=f.focus?.kind===kind&&f.focus.key===g.key || kind==='zones'&&f.zone&&g.key==='Z'+f.zone;
   const loc=kind==='zones'&&/^Z[1-6]$/.test(g.key)?`data-vc193195-zone="${esc(g.key.slice(1))}"`:`data-vc193195-focus="${esc(kind)}" data-vc193195-focus-key="${esc(g.key)}"`;
   return `<tr class="${active?'is-selected':''}"><th scope="row"><button type="button" ${loc} aria-pressed="${!!active}">${esc(g.key)}</button></th><td>${num(g.stats.total)}</td><td>${format(pct(g.stats.total,denom))}</td><td>${g.stats.rated}/${g.stats.total}</td><td>${format(f.skill==='A'?g.stats.killPct:g.stats.positivePct)}</td><td>${f.skill==='A'?format(g.stats.eff):'—'}</td></tr>`;
  }).join('');
  return `<div class="vc193195-table-panel"><div class="vc193195-table-tabs" role="group" aria-label="Tabla táctica">${views.map(([id,name])=>`<button type="button" data-vc193195-table="${id}" aria-pressed="${kind===id}">${name}</button>`).join('')}</div><div class="vc193195-table-actions"><span>Selecciona una fila para filtrar sus rallies</span>${filter('Orden','order',[['count','Mayor volumen'],['name','Nombre / clave']],f.order,'Orden')}</div><div class="vc193195-table-scroll"><table class="vc193195-table"><thead><tr><th scope="col">${kind==='zones'?'Zona':kind==='players'?'Jugador':kind==='rotations'?'Rotación':'Valoración'}</th><th scope="col">N</th><th scope="col">Uso</th><th scope="col">Eval.</th><th scope="col">${positiveHeading}</th><th scope="col">EFF A</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Sin acciones para los filtros seleccionados.</td></tr>'}</tbody></table></div><p class="vc193195-micro">Los porcentajes se calculan con denominadores visibles. EFF A = (# − = − /) / ataques valorados. Si no hay valoración se muestra —.</p></div>`;
 }
 function evidenceHTML(model,f){
  const last=model.rallies.slice(-45).reverse(),from=new Map();
  for(const item of model.filtered){const key=item.contact.rallyKey;if(!from.has(key))from.set(key,[]);from.get(key).push(item.contact);}
  return `<section class="vc193195-evidence"><header><div><h4>Rallies vinculados</h4><p>${model.rallies.length} rallies · ${model.filtered.length} contactos cumplen la selección</p></div><button type="button" data-vc193195-action="clear-focus">Quitar selección</button></header><div class="vc193195-evidence-table"><table class="vc193195-table"><thead><tr><th>Set / Rally</th><th>Rotación</th><th>Contactos coincidentes</th><th>Resultado</th><th>Revisión</th></tr></thead><tbody>${last.map(r=>{
   const contacts=from.get(r.key)||[],rotation=model.team==='ours'?r.ownRotation:r.rivalRotation;
   return `<tr><td><button type="button" data-vc19310-rally="${esc(r.key)}">S${r.set} · #${r.index}</button></td><td>${esc(rotation==='unknown'?'—':rotation)}</td><td>${contacts.length} · ${esc(contacts.slice(0,2).map(c=>(c.player||'?')+' '+(c.skill||'?')+(c.evaluation||'')).join(', '))}</td><td>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin resultado'}</td><td><button type="button" data-vc193195-video-rally="${esc(r.key)}" title="Abrir el rally en el reproductor existente">Vídeo</button></td></tr>`;
  }).join('')||'<tr><td colspan="5">No hay rallies para esta selección.</td></tr>'}</tbody></table></div>${model.rallies.length>45?'<p class="vc193195-micro">Se muestran los últimos 45 rallies; las estadísticas incluyen toda la muestra.</p>':''}</section>`;
 }
 function render({space,ctx,projection,state}){
  if(space!=='court')return null;
  const f=ensureState(state),model=courtModel(projection,ctx.team,f),fields=FIELDS.map(([id,name])=>[id,name]);
  const filters=`${filter('Fundamento','skill',Object.entries(SKILLS),f.skill,'Fundamento')}${filter('Zona representada','field',fields,model.field,'Zona')}${filter('Jugador','player',model.players,f.player)}${filter('Valoración','evaluation',EVALS,f.evaluation)}${filter('Rotación local','rotation',[...Array.from({length:6},(_,i)=>[String(i+1),'P'+(i+1)]),['unknown','Desconocida']],f.rotation)}`;
  const selected=f.focus?` · ${esc(f.focus.key)}`:'';
  const html=`<section class="vc193195-root" aria-label="Court Analysis Pro"><header class="vc193195-heading"><div><small>VOLLEY COACH PRO · V${VERSION}</small><h3>Análisis táctico de pista</h3><p>Datos del scouting actual · pista, tablas y rallies vinculados</p></div><button type="button" data-vc193195-action="clear">Limpiar filtros</button></header>
   <div class="vc193195-controls">${filters}</div><div class="vc193195-metrics"><div><small>Contactos filtrados</small><strong>${model.observed.length}</strong></div><div><small>Con zona explícita</small><strong>${model.located.length}</strong><span>${model.unknown} sin zona</span></div><div><small>Selección actual</small><strong>${model.filtered.length}</strong><span>${f.zone?'Z'+f.zone+(f.quadrant||''):''}${selected}</span></div><div><small>${f.skill==='A'?'Eficiencia ataque':'Recepción/valoración positiva'}</small><strong>${format(f.skill==='A'?model.stats.eff:model.stats.positivePct)}</strong><span>${model.stats.rated}/${model.stats.total} valorados</span></div></div>
   <div class="vc193195-workbench"><article class="vc193195-card vc193195-map-panel"><div class="vc193195-panel-head"><strong>Mapa de frecuencias</strong><span>6 zonas · 4 cuadrantes por zona</span></div>${courtGrid(model,f)}</article><article class="vc193195-card vc193195-stats-panel"><div class="vc193195-panel-head"><strong>Tablas tácticas</strong><span>${model.area.length} contactos en el área seleccionada</span></div>${tableHTML(model,f)}</article></div>
   ${evidenceHTML(model,f)}<p class="vc193195-footnote">No se infieren zonas, resultados ni marcas de vídeo. Los filtros globales de partido, equipo, set, rotación y fase se respetan sin crear una segunda base de datos.</p></section>`;
  return {html,rallies:model.rallies};
 }
 function handleClick({button,state}){
  const d=button?.dataset||{},f=ensureState(state),zone=d.vc193195Zone,quad=d.vc193195Quad,table=d.vc193195Table,kind=d.vc193195Focus,key=d.vc193195FocusKey,action=d.vc193195Action,video=d.vc193195VideoRally;
  if(![zone,quad,table,kind,action,video].some(x=>x!==undefined))return {handled:false};
  if(video!==undefined)return {handled:true,navigateVideo:video};
  if(zone!==undefined){const z=Number(zone);if(!ZONES.includes(z))return {handled:true};f.zone=f.zone===z?null:z;f.quadrant='';f.focus=null;return {handled:true,repaint:true};}
  if(quad!==undefined){const [z,q]=val(quad).split(':'),number=Number(z);if(!ZONES.includes(number)||!QUADS.includes(q))return {handled:true};if(f.zone===number&&f.quadrant===q){f.zone=null;f.quadrant='';}else{f.zone=number;f.quadrant=q;}f.focus=null;return {handled:true,repaint:true};}
  if(table!==undefined){if(['zones','players','rotations','evaluations'].includes(table)){f.table=table;f.focus=null;}return {handled:true,repaint:true};}
  if(kind!==undefined){if(['zones','players','rotations','evaluations'].includes(kind)){f.focus=f.focus?.kind===kind&&f.focus.key===key?null:{kind,key:val(key)};}return {handled:true,repaint:true};}
  if(action==='clear'){Object.assign(f,{...DEFAULT});return {handled:true,repaint:true};}
  if(action==='clear-focus'){f.focus=null;f.zone=null;f.quadrant='';return {handled:true,repaint:true};}
  return {handled:true};
 }
 function handleChange({target,state}){
  const field=target?.dataset?.vc193195Filter;
  if(field===undefined)return false;
  const f=ensureState(state);
  if(['skill','field','player','evaluation','rotation','order'].includes(field)){
   const value=val(target.value);
   if(field==='skill'&&!Object.hasOwn(SKILLS,value))return true;
   if(field==='field'&&value&&!FIELDS.some(x=>x[0]===value))return true;
   if(field==='order'&&!['count','name'].includes(value))return true;
   if(field==='skill'){f.field='';f.player='';f.evaluation='';}
   f[field]=value;
   if(field!=='order'){f.zone=null;f.quadrant='';f.focus=null;}
  }
  return true;
 }
 return Object.freeze({VERSION,DEFAULT,ensureState,defaultField,rotationOf,evaluate,courtModel,courtGrid,tableHTML,render,handleClick,handleChange});
});
/* VC2075_SOURCE_END:206-vc193195-professional-tactical-tables.js */
;
/* VC2075_SOURCE_BEGIN:191-vc19310-professional-analysis-architecture.js */
/* Volley Coach V19.3.10 · Professional Analysis Architecture
 * Entry point for six professional screens. READ ONLY: uses existing bridge,
 * 1938 canonical projection, 1939 query, 1614 legacy statistics and Video Analytics.
 * Historical views remain accessible through an explicit legacy-tools action.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_PRO_ANALYSIS_19310=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.4',WORKSPACE_VERSION='19.3.19.5';
 const SPACES=[['skills','Fundamentos','Acciones y jugadores'],['match','Match Analysis','Tablas y K1/K2'],['distribution','Distribution','Colocador y ataque'],['court','Court Analysis','Zonas y trayectorias'],['search','Rally Search','Búsquedas tácticas'],['video','Video Analysis','Rallies y vídeo'],['montage','Video Montage','Clips y anotaciones'],['worksheets','Worksheets','Hojas e informes']];
 const GROUPS=[
  {id:'overview',title:'Resumen',description:'Partido y rotaciones',spaces:['match']},
  {id:'skills',title:'Fundamentos',description:'Jugadores y acciones',spaces:['skills']},
  {id:'tactics',title:'Análisis táctico',description:'Colocadores y pistas',spaces:['distribution','court']},
  {id:'review',title:'Búsqueda y vídeo',description:'Rallies y clips',spaces:['search','video','montage']},
  {id:'reports',title:'Hojas e informes',description:'Estadísticas a medida',spaces:['worksheets']}
 ];
 const GROUP_DEFAULT={overview:'match',skills:'skills',tactics:'distribution',review:'search',reports:'worksheets'};
 const GROUP_FOR_SPACE=Object.fromEntries(GROUPS.flatMap(group=>group.spaces.map(space=>[space,group.id])));
 const SUBTAB_LABELS={distribution:'Distribución',court:'Análisis de pista',search:'Buscar rallies',video:'Vídeo y contactos',montage:'Video Montage'};
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arr=x=>Array.isArray(x)?x:[];
 const pct=(a,b)=>b?Math.round(a/b*1000)/10:null;
 const format=x=>x==null?'—':Number(x).toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
 const rot=x=>Number(x)>=1&&Number(x)<=6?Number(x):null;
 const safeZone=x=>{const m=val(x).match(/^Z?([1-9])([ABCD])?$/i);return m?{zone:Number(m[1]),quad:m[2]?.toUpperCase()||null,code:'Z'+m[1]+(m[2]?.toUpperCase()||'')}:null;};
 const sel=(key,entries,current='')=>`<label>${esc(key)}<select data-vc19310-filter="${esc(key)}">${entries.map(([id,label])=>`<option value="${esc(id)}"${String(id)===String(current)?' selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
 const skillOptions=[['','Todos los fundamentos'],...Object.entries(SKILLS)];
 const ratings=[['','Cualquier valoración'],...['#','+','!','-','/','='].map(x=>[x,x])];
 const rotations=[['','R1–R6'],...[1,2,3,4,5,6].map(i=>[String(i),'R'+i])];
 function baseProjection(api,match,options){
  const model=api?.normalize?.(match);if(!model)return null;
  const out=api.filter(model,{team:options.team,set:options.set,rotation:options.rotation,phase:options.phase});
  return {model,base:out};
 }
 function pointSummary(rallies,team){
  const valid=arr(rallies).filter(r=>r.closed),k1=valid.filter(r=>r.serving&&r.serving!==team),k2=valid.filter(r=>r.serving===team);
  const row=items=>({n:items.length,w:items.filter(r=>r.winner===team).length,pct:pct(items.filter(r=>r.winner===team).length,items.length)});
  return {k1:row(k1),k2:row(k2),closed:valid.length,unknownServe:valid.filter(r=>!r.serving).length};
 }
 function rotationReport(rallies,team){
  const all=[];for(let i=1;i<=6;i++){
   const subset=arr(rallies).filter(r=>(team==='ours'?r.ownRotation:r.rivalRotation)===i);
   const points=pointSummary(subset,team);all.push({rotation:i,n:subset.length,...points});
  }return all;
 }
 function groupContacts(contacts,key){const map=new Map();for(const c of contacts){const name=val(key(c))||'Sin identificar';if(!map.has(name))map.set(name,[]);map.get(name).push(c)}return [...map].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es'));}
 function attackEff(contacts){const actions=arr(contacts).filter(c=>c.skill==='A'),rated=actions.filter(c=>c.evaluation),won=rated.filter(c=>c.evaluation==='#').length,err=rated.filter(c=>c.evaluation==='=').length,blocked=rated.filter(c=>c.evaluation==='/').length;return {total:actions.length,rated:rated.length,won,err,blocked,eff:pct(won-err-blocked,rated.length)};}
 function collectZones(contacts,skill,kind){
  const field=kind==='origin'?'startZone':kind==='destination'?'endZone':skill==='E'?'setTarget':skill==='R'?'contactZone':'endZone';
  const rows=arr(contacts).filter(c=>c.skill===skill);const coded=rows.map(c=>({contact:c,zone:c.fields?.[field]})).filter(x=>x.zone&&x.zone.zone<=6);
  const counts=new Map([1,2,3,4,5,6].map(n=>[n,{zone:n,count:0,quadrants:{A:0,B:0,C:0,D:0}}]));
  for(const entry of coded){const cell=counts.get(entry.zone.zone);cell.count++;if(entry.zone.quadrant)cell.quadrants[entry.zone.quadrant]++;}
  return {field,coded:coded.length,missing:rows.length-coded.length,total:rows.length,zones:[...counts.values()].map(z=>({...z,share:pct(z.count,coded.length)}))};
 }
 function distribution(contacts,chains){
  const usable=arr(chains).filter(c=>c.setter&&c.target?.zone&&c.target.zone<=6),out=new Map();
  for(const c of usable){const z=c.target.zone,k=String(z);if(!out.has(k))out.set(k,{zone:z,count:0,attacks:[]});const item=out.get(k);item.count++;if(c.attack)item.attacks.push(c.attack);}
  return {total:arr(chains).length,coded:usable.length,missing:arr(chains).length-usable.length,zones:[...out.values()].sort((a,b)=>b.count-a.count)};
 }
 function evidenceCandidates(ctx,filtered){
  // The legacy video engine is keyed by original action keys, not synthetic IDs.
  const set=new Set(arr(filtered).map(r=>r.key));
  return arr(ctx?.data?.rallies).filter(r=>set.has(r.key)||arr(filtered).some(x=>x.set===r.set&&x.nativeId!=null&&String(x.nativeId)===String(r.id)));
 }
 function reportTable(rows){return `<div class="vc19310-scroll"><table><thead><tr><th>Rot.</th><th>Rallies</th><th>K1</th><th>K2</th><th>Evidencia</th></tr></thead><tbody>${rows.map(r=>`<tr><th>R${r.rotation}</th><td>${r.n}</td><td>${format(r.k1.pct)} <small>${r.k1.w}/${r.k1.n}</small></td><td>${format(r.k2.pct)} <small>${r.k2.w}/${r.k2.n}</small></td><td><button type="button" data-vc19310-rot="${r.rotation}">Ver rallies</button></td></tr>`).join('')}</tbody></table></div>`;}
 function courtMarkup(contacts,skill,kind,selected){
  const model=collectZones(contacts,skill,kind),max=Math.max(1,...model.zones.map(z=>z.count)),zoneBy=n=>model.zones.find(x=>x.zone===n);
  const rows=[4,3,2,5,6,1].map(n=>{const z=zoneBy(n);const subs=['C','B','D','A'].map(q=>`<span title="${q}: ${z.quadrants[q]}">${q}${z.quadrants[q]?' '+z.quadrants[q]:''}</span>`).join('');return `<button type="button" class="vc19310-zone ${selected===n?'is-selected':''}" data-vc19310-zone="${n}" style="--intensity:${(0.1+0.55*z.count/max).toFixed(3)}" aria-pressed="${selected===n}"><b>Z${n}</b><strong>${z.count||'—'}</strong><small>${format(z.share)}</small><span class="vc19310-quads">${subs}</span></button>`}).join('');
  return `<div class="vc19310-court"><div class="vc19310-net">RED / NET</div><div class="vc19310-zone-grid">${rows}</div></div><p class="vc19310-note">${model.coded} acciones con zona ${kind==='origin'?'de origen':kind==='destination'?'de destino':''} · ${model.missing} sin zona. Subzonas: A abajo derecha, B arriba derecha, C arriba izquierda, D abajo izquierda.</p>`;
 }
 function planePositions(){return {1:[.83,.84],6:[.5,.84],5:[.17,.84],2:[.83,.2],3:[.5,.2],4:[.17,.2]};}
 function distributionSvg(chains){
  const stats=distribution([],chains),p=planePositions(),lines=stats.zones.map(z=>{const end=p[z.zone];if(!end)return '';const width=Math.min(8,2+z.count/Math.max(1,stats.coded)*18);return `<path d="M 200 190 Q ${200+(end[0]*400-200)*.40} 80 ${Math.round(end[0]*400)} ${Math.round(end[1]*250)}" fill="none" stroke="#146bb8" stroke-width="${width.toFixed(1)}" stroke-linecap="round" marker-end="url(#vc19310-arrow)" opacity=".85"/>`;}).join('');
  return `<svg class="vc19310-dist-svg" viewBox="0 0 400 250" role="img" aria-label="Distribución explícita del colocador a las zonas codificadas"><defs><marker id="vc19310-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5" fill="none" stroke="#146bb8" stroke-width="1.5"/></marker></defs><rect x="4" y="4" width="392" height="242" rx="4" fill="#f0c38e" stroke="#fff" stroke-width="3"/><path d="M4 82 H396 M4 164 H396 M135 4 V246 M265 4 V246" stroke="#fff" stroke-width="2"/>${lines}<circle cx="200" cy="190" r="16" fill="#133b65"/><text x="200" y="194" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">E</text>${stats.zones.map(z=>{const q=p[z.zone];return `<text x="${Math.round(q[0]*400)}" y="${Math.round(q[1]*250)+5}" font-size="11" text-anchor="middle" font-weight="700" fill="#153c60">Z${z.zone}</text>`}).join('')}</svg><p class="vc19310-note">Solo flechas con destino de colocación explícito: ${stats.coded}/${stats.total}. El grosor representa volumen, no trayectoria medida.</p>`;
 }
 function createShell(doc){
  const node=doc.createElement('section');node.id='vc19310-workspace';node.className='vc19310-workspace vc193194-workspace';
  node.innerHTML=`<header class="vc19310-head vc193194-head"><div class="vc193194-heading"><small>VOLLEY COACH PRO · V${WORKSPACE_VERSION}</small><h2>Centro de análisis</h2><p>El mismo scouting, del resumen al vídeo y a los informes.</p></div><div class="vc19310-actions"><button type="button" data-vc19310-command="refresh">Actualizar datos</button><button type="button" data-vc19310-command="official">PDF oficial</button><button type="button" data-vc19310-command="advanced">Herramientas anteriores</button></div></header>
   <nav class="vc19310-nav vc193194-main-nav" role="tablist" aria-label="Áreas del centro de análisis">${GROUPS.map((group,i)=>`<button type="button" role="tab" data-vc193194-group="${group.id}" aria-selected="${i===0}" aria-controls="vc19310-body"><strong>${group.title}</strong><small>${group.description}</small></button>`).join('')}</nav>
   <nav class="vc193194-subnav" role="tablist" aria-label="Herramientas del área" hidden></nav>
   <div class="vc19310-subbar vc193194-contextbar"><div><strong id="vc19310-match-label">Sin scouting seleccionado</strong><span id="vc19310-sample" aria-live="polite">Selecciona un partido para comenzar</span></div><span class="vc193194-readonly">Consulta en vivo del scouting · sin copias de estadísticas</span></div>
   <div class="vc193194-selection-dock" aria-label="Jugada seleccionada"><div><small>JUGADA SELECCIONADA</small><strong id="vc193194-current-rally" aria-live="polite">Ninguna</strong></div><button type="button" data-vc193194-action="open-video" disabled>Consultar vídeo de la jugada</button></div>
   <div id="vc19310-body" role="tabpanel"></div><div class="vc19310-status" role="status" aria-live="polite"></div>`;
  return node;
 }
 function initialState(){return {space:'match',skill:'A',lastByGroup:{},selections:{},advanced:false,zone:null,courtSkill:'A',courtMode:'destination',searchMode:'codes',search:{status:'closed'},searchPreset:'',searchResults:[],selected:null,sort:'count'};}
 function tableHtml(columns,rows){return `<div class="vc19310-scroll"><table><thead><tr>${columns.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${columns.length}">Sin datos codificados para este filtro</td></tr>`}</tbody></table></div>`;}
 function filterCourtRallies(rallies,contacts,skill,kind,zoneNo){if(!zoneNo)return rallies;const zoneField=kind==='origin'?'startZone':kind==='destination'?'endZone':skill==='E'?'setTarget':skill==='R'?'contactZone':'endZone';const keys=new Set(contacts.filter(c=>c.skill===skill&&c.fields?.[zoneField]?.zone===zoneNo).map(c=>c.rallyKey));return rallies.filter(r=>keys.has(r.key));}
 function evidenceHtml(rallies){const subset=rallies.slice(-80).reverse();return `<aside class="vc19310-panel vc19310-evidence"><div class="vc19310-panelhead"><strong>JUGADAS Y EVIDENCIA</strong><span>${rallies.length} rallies</span></div><div class="vc19310-rallies">${subset.map(r=>`<button type="button" class="vc19310-rally" data-vc19310-rally="${esc(r.key)}"><b>S${r.set} · #${r.index}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.serving==='ours'?'Saque propio':r.serving==='opponent'?'Saque rival':'Saque desconocido'}</span></button>`).join('')||'<p class="vc19310-note">No hay rallies con estos filtros.</p>'}</div><div class="vc19310-video-box"><div class="vc19310-screen"><span>▶</span><strong>VÍDEO VINCULADO</strong><small>Se abre en el reproductor de Video Studio</small></div><p data-vc19310-detail>Selecciona una jugada.</p><button type="button" data-vc19310-command="play" disabled>Abrir rally en vídeo</button></div></aside>`;}
 function skillsView(ctx,projection,state){
  const base=projection.base,skill=SKILLS[state.skill]?state.skill:'A',contacts=base.contacts.filter(c=>c.team===ctx.team&&c.skill===skill);
  const rated=contacts.filter(c=>c.evaluation),counts=Object.fromEntries(['#','+','!','-','/','='].map(e=>[e,contacts.filter(c=>c.evaluation===e).length]));
  const positive=contacts.filter(c=>['#','+'].includes(c.evaluation)).length;
  const attack=attackEff(contacts);
  const groups=groupContacts(contacts,c=>c.player||'Sin identificar');
  const items=groups.map(([name,list])=>{
   const n=list.length,e=list.filter(c=>c.evaluation),p=list.filter(c=>['#','+'].includes(c.evaluation)).length,k=list.filter(c=>c.evaluation==='#').length,err=list.filter(c=>c.evaluation==='='||c.evaluation==='/').length;
   const eff=skill==='A'?attackEff(list).eff:null;
   return `<tr><th>${esc(name)}</th><td>${n}</td><td>${e.length}</td><td>${k}</td><td>${p}</td><td>${err}</td><td>${format(pct(p,e.length))}</td><td>${skill==='A'?format(eff):'—'}</td></tr>`;
  });
  const keys=new Set(contacts.map(c=>c.rallyKey));const rallies=base.rallies.filter(r=>keys.has(r.key));
  const buttons=Object.entries(SKILLS).map(([id,title])=>`<button type="button" data-vc193194-skill="${id}" aria-pressed="${id===skill}" class="${id===skill?'is-active':''}"><b>${id}</b>${title}</button>`).join('');
  const html=`<section class="vc193194-skills"><header class="vc193194-section-heading"><div><small>ANÁLISIS POR FUNDAMENTO</small><h3>${esc(SKILLS[skill])}</h3><p>Consulta los contactos originales del scouting. Los datos sin valoración no cuentan como errores.</p></div><span>${contacts.length} contactos</span></header>
   <div class="vc193194-skills-nav" aria-label="Seleccionar fundamento">${buttons}</div>
   <div class="vc19310-kpis vc193194-kpis"><div><small>Contactos</small><strong>${contacts.length}</strong></div><div><small>Evaluados</small><strong>${rated.length}</strong><span>${contacts.length-rated.length} sin valorar</span></div><div><small>Positivas (#/+)</small><strong>${format(pct(positive,rated.length))}</strong><span>${positive}/${rated.length}</span></div><div><small>${skill==='A'?'Eficiencia de ataque':'Valoración #'}</small><strong>${skill==='A'?format(attack.eff):counts['#']}</strong><span>${skill==='A'?'(# − = − /) / evaluados':'Contactos valorados #'}</span></div></div>
   <div class="vc193194-data-grid"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>RENDIMIENTO POR JUGADOR</strong><span>${groups.length} grupos</span></div>${tableHtml(['Jugador','N','Eval.','#','#+','=/','% #+','EFF A'],items)}<p class="vc19310-note">El indicador de eficiencia solo se calcula para ataques. Para otros fundamentos, #/+ es un recuento descriptivo, no una equivalencia de puntos.</p><div class="vc193194-eval-row">${Object.entries(counts).map(([code,n])=>`<span><b>${esc(code)}</b>${n}</span>`).join('')}</div></section>${evidenceHtml(rallies)}</div></section>`;
  return {html,rallies};
 }
 function matchView(ctx,projection){
  const {base}=projection,points=pointSummary(base.rallies,ctx.team),summary=attackEff(base.contacts.filter(c=>c.team===ctx.team)),rotations=rotationReport(base.rallies,ctx.team),out=[];
  for(const [name,rows] of groupContacts(base.contacts.filter(c=>c.team===ctx.team&&c.skill==='A'),c=>c.player).slice(0,12)){
   const eff=attackEff(rows);out.push(`<tr><td>${esc(name)}</td><td>${rows.length}</td><td>${eff.rated}</td><td>${eff.won}</td><td>${eff.err}</td><td>${format(eff.eff)}</td></tr>`);
  }
  return `<div class="vc19310-kpis">${[['K1 · Side-out',format(points.k1.pct),`${points.k1.w}/${points.k1.n}`],['K2 · Break',format(points.k2.pct),`${points.k2.w}/${points.k2.n}`],['Eficiencia ataque',format(summary.eff),`${summary.rated} evaluados`],['Rallies cerrados',points.closed,`${points.unknownServe} sin saque conocido`]].map(([k,v,n])=>`<div><small>${k}</small><strong>${v}</strong><span>${n}</span></div>`).join('')}</div><div class="vc19310-grid vc19310-grid-match"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>K1 / K2 POR ROTACIÓN</strong><span>R1–R6 · clicar para filtrar</span></div>${reportTable(rotations)}<h3>Ataque por jugador</h3>${tableHtml(['Jugador','Intentos','Valorados','Puntos','Errores','EFF'],out)}<p class="vc19310-note">EFF = (puntos − errores − bloqueos) / ataques valorados. Sin valoración, no entra en el denominador.</p></section><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>MAPA DE ATAQUE</strong><span>Destino codificado</span></div>${courtMarkup(base.contacts.filter(c=>c.team===ctx.team),'A','destination',null)}</section>${evidenceHtml(base.rallies)}</div>`;
 }
 function distributionView(ctx,projection){
  const base=projection.base,chains=base.chains.filter(c=>c.team===ctx.team),dist=distribution(base.contacts,chains),r=rotationReport(base.rallies,ctx.team),items=groupContacts(chains,c=>c.setter?.player);
  const bySetter=items.map(([name,list])=>{const rated=attackEff(list.map(c=>c.attack).filter(Boolean));return `<tr><td>${esc(name)}</td><td>${list.length}</td><td>${list.filter(c=>!!c.attack).length}</td><td>${rated.rated}</td><td>${format(rated.eff)}</td></tr>`});
  const byZones=dist.zones.map(z=>`<tr><th>Z${z.zone}</th><td>${z.count}</td><td>${format(pct(z.count,dist.coded))}</td><td>${z.attacks.length}</td><td>${format(attackEff(z.attacks).eff)}</td></tr>`);
  return `<div class="vc19310-rot-cards">${r.map(row=>`<button type="button" data-vc19310-rot="${row.rotation}"><b>R${row.rotation}</b><span>K1 ${format(row.k1.pct)}</span><span>K2 ${format(row.k2.pct)}</span><small>n=${row.n}</small></button>`).join('')}</div><div class="vc19310-grid vc19310-grid-dist"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>DISTRIBUCIÓN DEL COLOCADOR</strong><span>Destinos conocidos, no inferidos</span></div>${distributionSvg(chains)}<p class="vc19310-note">Con destino conocido: ${dist.coded} de ${dist.total} colocaciones.</p></section><section class="vc19310-panel"><h3>Destinos de colocación</h3>${tableHtml(['Zona','Coloc.','Uso','Ataques','EFF'],byZones)}<h3>Por colocador</h3>${tableHtml(['Colocador','Coloc.','Ataques','Evaluados','EFF'],bySetter)}</section>${evidenceHtml(base.rallies)}</div>`;
 }
 function courtView(ctx,projection,state){const base=projection.base,contacts=base.contacts.filter(c=>c.team===ctx.team),c=collectZones(contacts,state.courtSkill,state.courtMode),rallies=filterCourtRallies(base.rallies,contacts,state.courtSkill,state.courtMode,state.zone),rows=c.zones.map(z=>`<tr><th><button type="button" data-vc19310-zone="${z.zone}">Z${z.zone}</button></th><td>${z.count}</td><td>${format(z.share)}</td><td>${Object.entries(z.quadrants).filter(([,n])=>n).map(([k,n])=>k+': '+n).join(' · ')||'—'}</td></tr>`);
  return `<div class="vc19310-court-tools">${sel('Fundamento',[['A','Ataque'],['S','Saque'],['R','Recepción'],['E','Colocación'],['D','Defensa'],['B','Bloqueo']],state.courtSkill)}${sel('Mapa',[['destination','Destino'],['origin','Origen']],state.courtMode)}<button type="button" data-vc19310-command="clear-zone">Quitar filtro de zona</button></div><div class="vc19310-grid vc19310-grid-court"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>COURT ANALYSIS · ${esc(SKILLS[state.courtSkill])}</strong><span>${c.coded}/${c.total} zonas conocidas</span></div>${courtMarkup(contacts,state.courtSkill,state.courtMode,state.zone)}<h3>Frecuencias por zona</h3>${tableHtml(['Zona','Acciones','%','Cuadrantes'],rows)}</section>${evidenceHtml(rallies)}</div>`;
 }
 function searchView(ctx,projection,state,searchApi){
  const list=searchApi?.query?.(projection.model,{...state.search,team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase})||{rallies:[],contacts:[],chains:[],statistics:{rallies:0,contacts:0,attackRated:0,efficiency:null}};
  const cat=searchApi?.catalog?.(projection.model)||{players:[],setters:[],attackers:[],tempos:[],combos:[],startZones:[],endZones:[]};
  const options=(values)=>[['','Todos'],...values.map(x=>[x,x])];
  const mode=state.searchMode,fields=mode==='codes'?`<label>Código<input data-vc19310-search="code" value="${esc(state.search.code||'')}" placeholder="Ej.: A4#, Z4, E2+" /></label>${sel('Fundamento',skillOptions,state.search.skill||'')}${sel('Jugador',options(cat.players),state.search.player||'')}${sel('Valoración',ratings,state.search.evaluation||'')}`:
   mode==='stats'?`${sel('Fundamento',skillOptions,state.search.skill||'')}${sel('Jugador',options(cat.players),state.search.player||'')}${sel('Valoración',ratings,state.search.evaluation||'')}${sel('Resultado',[['','Todos'],['ours','Punto propio'],['opponent','Punto rival']],state.search.outcome||'')}`:
   mode==='rotation'?`${sel('Rotación propia',rotations,state.search.ownRotation||'')}${sel('Rotación rival',rotations,state.search.rivalRotation||'')}${sel('Resultado',[['','Todos'],['ours','Punto propio'],['opponent','Punto rival']],state.search.outcome||'')}`:
   `${sel('Recepción previa',ratings,state.search.reception||'')}${sel('Colocador',options(cat.setters),state.search.setter||'')}${sel('Atacante',options(cat.attackers),state.search.attacker||'')}${sel('Tempo',options(cat.tempos),state.search.tempo||'')}${sel('Combinación',options(cat.combos),state.search.combo||'')}${sel('Zona origen',options(cat.startZones),state.search.startZone||'')}${sel('Zona destino',options(cat.endZones),state.search.endZone||'')}`;
  const presets=searchApi?.readPresets?.(typeof window!=='undefined'?(()=>{try{return window.localStorage}catch(_){return null}})():null)||[];
  return `<div class="vc19310-search-modes">${[['codes','Códigos'],['stats','Estadísticas'],['rotation','Rotaciones'],['advanced','Avanzada']].map(([k,v])=>`<button type="button" data-vc19310-search-mode="${k}" class="${mode===k?'is-current':''}">${v}</button>`).join('')}</div><div class="vc19310-filterrow vc19310-search-filters">${fields}<button type="button" data-vc19310-command="apply-search">Buscar</button><button type="button" data-vc19310-command="clear-search">Limpiar</button></div><div class="vc19310-presets"><select data-vc19310-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option>${presets.map(p=>`<option value="${esc(p.name)}" ${p.name===state.searchPreset?'selected':''}>${esc(p.name)}</option>`).join('')}</select><button type="button" data-vc19310-command="search-save">Guardar búsqueda</button><button type="button" data-vc19310-command="search-load">Aplicar guardada</button><button type="button" data-vc19310-command="search-delete">Eliminar guardada</button></div><div class="vc19310-kpis">${[['Rallies',list.statistics.rallies],['Contactos',list.statistics.contacts],['Cadenas',list.statistics.chains],['Ataque EFF',format(list.statistics.efficiency)]].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('')}</div><div class="vc19310-grid vc19310-grid-search"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>RESULTADOS DE LA BÚSQUEDA</strong><span>Una misma posesión para secuencias</span></div>${tableHtml(['Set','Rally','Rot.','Resultado'],list.rallies.slice(0,200).map(r=>`<tr><td>${r.set}</td><td><button type="button" data-vc19310-select="${esc(r.key)}">#${r.index}</button></td><td>R${ctx.team==='ours'?(r.ownRotation||'—'):(r.rivalRotation||'—')}</td><td>${r.winner==='ours'?'Nuestro':r.winner==='opponent'?'Rival':'—'}</td></tr>`))}<p class="vc19310-note">Resultados limitados a 200 filas en la tabla. La búsqueda conserva la referencia original y la lista de rallies completa.</p></section>${evidenceHtml(list.rallies)}</div>`;
 }
 function videoView(ctx,projection){const base=projection.base,contacts=base.contacts.filter(c=>c.team===ctx.team),linked=contacts.filter(c=>c.video),byRally=new Set(linked.map(c=>c.rallyKey));const rows=contacts.slice(-140).reverse().map(c=>`<tr><td>S${c.set} · #${c.rallyIndex}</td><td>${esc(c.code||c.skill||'?')}</td><td>${esc(c.player||'—')}</td><td>${esc(c.evaluation||'—')}</td><td>${c.video?'Marca':'—'}</td></tr>`);
  return `<div class="vc19310-video-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>REVISIÓN DE VÍDEO</strong><span>${byRally.size} rallies con marcas de vídeo</span></div><div class="vc19310-large-video"><strong>VIDEO ANALYSIS</strong><p>Selecciona un rally a la derecha y ábrelo en el reproductor original de Volley Coach.</p><p>El vídeo no se duplica ni se almacena en esta pantalla.</p></div><h3>Códigos del partido</h3>${tableHtml(['Rally','Código','Jugador','Eval.','Vídeo'],rows)}<p class="vc19310-note">Reproductor incrustado y marcador histórico: fase V19.3.12, después de validar vínculos y tiempos.</p></section>${evidenceHtml(base.rallies)}</div>`;
 }
 function worksheetsView(ctx,projection){const base=projection.base,contacts=base.contacts.filter(c=>c.team===ctx.team),rows=Object.keys(SKILLS).map(skill=>{const r=contacts.filter(c=>c.skill===skill);const rated=r.filter(c=>c.evaluation);return `<tr><th>${esc(SKILLS[skill])}</th><td>${r.length}</td><td>${rated.length}</td><td>${r.filter(c=>['#','+'].includes(c.evaluation)).length}</td><td>${format(pct(r.filter(c=>['#','+'].includes(c.evaluation)).length,rated.length))}</td></tr>`});
  return `<div class="vc19310-grid vc19310-grid-worksheets"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>HOJAS DE ANÁLISIS</strong><span>Vista compacta · solo lectura</span></div>${tableHtml(['Fundamento','Acciones','Evaluadas','Positivas','% positivo'],rows)}<p class="vc19310-note">Las hojas configurables y el editor de informes existentes siguen disponibles sin modificar su almacenamiento.</p><div class="vc19310-work-buttons"><button type="button" data-vc19310-legacy-page="players:builder">Abrir hojas configurables</button><button type="button" data-vc19310-legacy-page="players:sheet">Hoja oficial</button><button type="button" data-vc19310-legacy-page="reports:">Informes Pro</button><button type="button" data-vc19310-command="official">PDF oficial</button></div></section><section class="vc19310-panel"><h3>Base de las hojas</h3><p>Equipo: ${ctx.team==='ours'?'nuestro':'rival'}</p><p>${base.rallies.length} rallies · ${contacts.length} contactos</p><p>Los cálculos heredados se conservan para comparación y se validarán antes de sustituirlos por fórmulas configurables.</p></section></div>`;
 }
 function mount(win){const doc=win.document;const view=doc.getElementById('scout-analysis');if(!view||view.dataset.vc19310Mounted)return;
  view.dataset.vc19310Mounted='1';const state=initialState();let node=null,initialized=false,paintTimer=null,ctx=null,projection=null,filteredRallies=[],legacyRallies=[],watcher=null;
  const delay=()=>{win.clearTimeout(paintTimer);paintTimer=win.setTimeout(paint,80)};
  function setStatus(msg){const target=node?.querySelector('.vc19310-status');if(target)target.textContent=msg;}
  function showNavigation(){
   const group=GROUP_FOR_SPACE[state.space]||'overview';
   node.querySelectorAll('[data-vc193194-group]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.vc193194Group===group)));
   const entries=GROUPS.find(g=>g.id===group)?.spaces||[];
   const sub=node.querySelector('.vc193194-subnav');if(!sub)return;
   sub.hidden=entries.length<2;
   if(entries.length>=2)sub.innerHTML=entries.map(id=>`<button type="button" role="tab" data-vc19310-space="${id}" aria-selected="${id===state.space}" aria-controls="vc19310-body">${esc(SUBTAB_LABELS[id]||SPACES.find(s=>s[0]===id)?.[1]||id)}</button>`).join('');
   else sub.innerHTML='';
  }
  function switchSpace(space){
   if(!SPACES.some(s=>s[0]===space))return;
   state.selections[state.space]=state.selected;
   state.lastByGroup[GROUP_FOR_SPACE[space]||'overview']=space;
   state.space=space;state.selected=state.selections[space]||null;
   toggleLegacy(false);paint();
  }
  function selectionDock(){
   const r=filteredRallies.find(x=>x.key===state.selected);
   const el=node?.querySelector('#vc193194-current-rally'),button=node?.querySelector('[data-vc193194-action="open-video"]');
   if(el)el.textContent=r?`Set ${r.set} · Rally ${r.index}${r.closed?'':' · sin cerrar'}`:'Ninguna';
   if(button)button.disabled=!r;
  }
  function findContext(){try{return win.VC_ANALYSIS_MAIN_1937?.selectContext?.(win)||null;}catch(e){setStatus('No se pudo acceder al contexto del partido.');return null}}
  function toggleLegacy(value){
   state.advanced=!!value;if(state.advanced){win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);win.VC_INTEGRATED_VIDEO_19314?.park?.(win);}view.classList.toggle('vc19310-legacy',state.advanced);
   const btn=node?.querySelector('[data-vc19310-command="advanced"]');
   if(btn)btn.textContent=state.advanced?'Volver al Análisis Pro':'Herramientas originales';
   view.dataset.vc1937Mode=state.advanced?'advanced':'pro';
   const back=doc.getElementById('vc19310-return');if(back)back.hidden=!state.advanced;
  }
  function build(){if(initialized)return true;const studio=doc.getElementById('vc157-studio');if(!studio||!win.VC_DATA_ENGINE_1938||!win.VC_ANALYSIS_MAIN_1937)return false;
   node=createShell(doc);const toolbar=studio.querySelector('.vc157-toolbar');
   if(toolbar){toolbar.after(node);
    const back=doc.createElement('button');back.type='button';back.id='vc19310-return';back.textContent='← Volver a Analysis Pro';back.hidden=true;
    back.addEventListener('click',()=>{toggleLegacy(false);paint()});toolbar.append(back);
   }else studio.prepend(node);
   initialized=true;view.classList.add('vc19310-active');
   const source=doc.getElementById('vc157-sample');if(source){watcher=new win.MutationObserver(delay);watcher.observe(source,{childList:true,subtree:true,characterData:true});}
   return true;}
  function paint(){if(!view.classList.contains('active')){win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);win.VC_INTEGRATED_VIDEO_19314?.park?.(win);return;}if(!build())return;if(state.advanced||view.classList.contains('vc1930-active')){win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);win.VC_INTEGRATED_VIDEO_19314?.park?.(win);return;}
   ctx=findContext();if(!ctx||!ctx.match){win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);win.VC_INTEGRATED_VIDEO_19314?.park?.(win);node.querySelector('#vc19310-body').innerHTML='<div class="vc19310-panel"><p>Selecciona un scouting en la barra superior para comenzar.</p></div>';filteredRallies=[];state.selected=null;selectionDock();showNavigation();return;}
   projection=baseProjection(win.VC_DATA_ENGINE_1938,ctx.match,ctx);if(!projection){setStatus('Motor de datos no disponible');return;}
   const opts=ctx.team==='ours'?'Nuestro equipo':'Rival';node.querySelector('#vc19310-match-label').textContent=`${val(ctx.match.name||ctx.match.title||ctx.match.opponentName||ctx.match.id)} · ${opts}`;
   node.querySelector('#vc19310-sample').textContent=`${projection.base.rallies.length} rallies · ${projection.base.contacts.length} contactos · sin alterar el scouting`;
   showNavigation();
   const body=node.querySelector('#vc19310-body');
   // Avoid undocking an active player on unrelated re-renders or clocks.
   // Rebuild only when the selection or the underlying scouting data changes.
   const sig=['video','montage'].includes(state.space)?[state.space,ctx.match.id,ctx.team,ctx.set,ctx.rotation,ctx.phase,
     projection.base.rallies.length,projection.base.contacts.length,ctx.match.updatedAt||'',
     ...projection.base.rallies.slice(-5).map(r=>[r.key,r.scoreAfter?.us,r.scoreAfter?.opponent,r.contacts.length].join(':'))].join('|'):'';
   const videoHost=body.querySelector('#vc19314-player-host');
   if(['video','montage'].includes(state.space)&&sig===body.dataset.vc19314Signature&&videoHost?.contains(doc.getElementById('v780-video-frame')))return;
   // Restore the ONE native Video Review player before replacing an Analysis view.
   // Otherwise innerHTML would destroy the playing media element and its handlers.
   win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);
   win.VC_INTEGRATED_VIDEO_19314?.park?.(win);
   // V19.3.11 replaces only the professional views, not their data engines.
   // Fall back safely to V19.3.10 when an optional asset is unavailable.
   let tactical=null,enhanced=null;
   if(state.space==='court'){
    try{tactical=win.VC_TACTICAL_TABLES_193195?.render?.({space:state.space,ctx,projection,state,win})||null;}
    catch(e){setStatus('No se pudo cargar Court Analysis Pro; se utiliza la vista anterior.');}
   }
   // Only render the legacy tactical view if the new one is unavailable.
   // Avoid calculating two full court/statistical surfaces per refresh.
   if(!tactical)try{enhanced=(state.space==='distribution'?win.VC_DISTRIBUTION_193161?.render?.({space:state.space,ctx,projection,state,win}):null)||(state.space==='worksheets'?win.VC_WORKSHEETS_19318?.render?.({space:state.space,ctx,projection,state,win}):null)||win.VC_ANALYSIS_SCREENS_19311?.render?.({space:state.space,ctx,projection,state,win})||null;}
   catch(e){setStatus('La vista profesional no ha podido cargarse; se utiliza la vista anterior.');}
   const skills=state.space==='skills'?skillsView(ctx,projection,state):null;
   if(tactical)body.innerHTML=tactical.html;
   else if(enhanced)body.innerHTML=enhanced.html;
   else if(skills)body.innerHTML=skills.html;
   else if(state.space==='match')body.innerHTML=matchView(ctx,projection);
   else if(state.space==='distribution')body.innerHTML=distributionView(ctx,projection);
   else if(state.space==='court')body.innerHTML=courtView(ctx,projection,state);
   else if(state.space==='search')body.innerHTML=searchView(ctx,projection,state,win.VC_RALLY_SEARCH_1939);
   else if(state.space==='video')body.innerHTML=win.VC_INTEGRATED_VIDEO_19314?.render?.(ctx,projection)||win.VC_VIDEO_SCORE_19312?.renderAnalysis?.(ctx,projection)||videoView(ctx,projection);
   else if(state.space==='montage')body.innerHTML=win.VC_VIDEO_MONTAGE_19317?.render?.()?.html||'<p>No se ha cargado Video Montage Pro. Comprueba los archivos de V19.3.17.</p>';
   else body.innerHTML=worksheetsView(ctx,projection);
   body.dataset.vc19314Signature=sig;
   const source=state.space==='search'?(win.VC_RALLY_SEARCH_1939?.query?.(projection.model,{...state.search,team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase})?.rallies||[]):projection.base.rallies;
   const filtered=tactical?.rallies||enhanced?.rallies||skills?.rallies||(state.space==='court'?filterCourtRallies(source,projection.base.contacts.filter(c=>c.team===ctx.team),state.courtSkill,state.courtMode,state.zone):source);
   filteredRallies=filtered;legacyRallies=evidenceCandidates(ctx,filtered);if(['video','montage'].includes(state.space))win.VC_INTEGRATED_VIDEO_19314?.attach?.(win,node,ctx.match);if(state.space==='montage')win.VC_VIDEO_MONTAGE_19317?.mount?.(win,node.querySelector('.vc19317-shell'),ctx,projection);if(state.space==='video')win.VC_SMART_SCOUTING_19316?.updateAudit?.(node,ctx.match,win.VC_DATA_ENGINE_1938,win);const choice=filtered.find(r=>r.key===state.selected);if(choice)selectRally(choice.key);
   else if(filtered.length)selectRally(filtered[filtered.length-1].key);
   else state.selected=null;selectionDock();
  }
  function selectRally(key,{play:autoplay=false}={}){const r=filteredRallies.find(x=>x.key===key);if(!r)return;state.selected=key;node.querySelectorAll('[data-vc19310-rally]').forEach(b=>b.classList.toggle('is-selected',b.dataset.vc19310Rally===key));
   const legacy=legacyRallies.find(x=>x.set===r.set&&(r.nativeId!=null&&String(x.id)===String(r.nativeId)||x.index===r.index));
   const actionKeys=arr(legacy?.actions).filter(a=>a.video&&a.key).map(a=>a.key),videoApi=win.VC_VIDEO_ANALYTICS_1612;
   const play=node.querySelector('[data-vc19310-command="play"]');if(play){
    const canRally=state.space==='video'&&r.nativeId!=null&&typeof win.VC_VIDEO_SCORE_19312?.openRally==='function';
    play.disabled=!canRally&&(!actionKeys.length||typeof videoApi?.openKeys!=='function');play.dataset.keys=actionKeys.join(',');
   }
   const target=node.querySelector('[data-vc19310-detail]');if(target)target.textContent=`Set ${r.set} · Rally #${r.index} · ${r.contacts.length} contactos · ${actionKeys.length} acciones con vídeo`;
   state.selections[state.space]=key;selectionDock();
   node._vc19310VideoKeys=actionKeys;
   if(state.space==='video'){win.VC_VIDEO_SCORE_19312?.updatePreview?.(node,r);if(win.VC_INTEGRATED_VIDEO_19314){const result=win.VC_INTEGRATED_VIDEO_19314.select?.(win,ctx?.match,r,{play:autoplay});win.VC_INTEGRATED_VIDEO_19314.selectionFeedback?.(node,r,result||{ok:false});}}
  }
  view.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!node?.contains(b))return;
   if(state.space==='montage'&&b.dataset.vc19317Act!==undefined){win.VC_VIDEO_MONTAGE_19317?.click?.(win,b);return;}
   if(state.space==='video'){
    const editing=win.VC_SCOUTING_EDITOR_19315?.handleAnalysisClick?.(win,b,{ctx,projection,node,state});
    if(editing?.handled)return;
    const integrated=win.VC_INTEGRATED_VIDEO_19314?.handleClick?.(win,b,{ctx,projection,node,state,selectRally});
    if(integrated?.handled)return;
   }
   if(state.space==='court'){
    const tacticalAction=win.VC_TACTICAL_TABLES_193195?.handleClick?.({button:b,state,ctx,projection,win,status:setStatus});
    if(tacticalAction?.handled){
     if(tacticalAction.navigateVideo){
      const key=tacticalAction.navigateVideo;
      if(!filteredRallies.some(r=>r.key===key)){setStatus('El rally ya no pertenece a la selección.');return;}
      state.selected=key;state.selections.video=key;state.space='video';toggleLegacy(false);paint();selectRally(key,{play:true});return;
     }
     if(tacticalAction.repaint)paint();return;
    }
   }
   if(b.dataset.vc193194Group){const group=b.dataset.vc193194Group;switchSpace(state.lastByGroup[group]||GROUP_DEFAULT[group]);return;}
   if(b.dataset.vc193194Skill){state.skill=b.dataset.vc193194Skill;paint();return;}
   if(b.dataset.vc193194Action==='open-video'){
    const key=state.selected;if(!key||!filteredRallies.some(r=>r.key===key)){setStatus('No hay un rally seleccionado.');return;}
    if(state.space==='video'){selectRally(key,{play:true});return;}
    state.selections[state.space]=key;state.selections.video=key;state.space='video';toggleLegacy(false);paint();selectRally(key,{play:true});return;
   }
   const distributionAction=state.space==='distribution'?win.VC_DISTRIBUTION_193161?.handleClick?.({button:b,state,node,ctx,projection,win,status:setStatus}):null;
   if(distributionAction?.handled){
    if(distributionAction.navigateVideo){
     const key=distributionAction.navigateVideo;
     if(!filteredRallies.some(r=>r.key===key)){setStatus('Rally no disponible en esta selección.');return;}
     state.selected=key;state.selections.video=key;state.space='video';toggleLegacy(false);paint();
     selectRally(key,{play:true});return;
    }
    if(distributionAction.repaint)paint();return;
   }
   const wsAction=state.space==='worksheets'?win.VC_WORKSHEETS_19318?.handleClick?.({button:b,state,node,ctx,projection,win,status:setStatus}):null;
   if(wsAction?.handled){
    if(wsAction.navigateVideo){
     const key=wsAction.navigateVideo;
     if(!filteredRallies.some(r=>r.key===key)){setStatus('El rally ya no pertenece al filtro actual.');return;}
     state.selected=key;state.space='video';toggleLegacy(false);paint();selectRally(key,{play:true});return;
    }
    if(wsAction.repaint)paint();return;
   }
   const enhancedAction=win.VC_ANALYSIS_SCREENS_19311?.handleClick?.({button:b,state,node,ctx,projection,win,status:setStatus});
   if(enhancedAction?.handled){if(enhancedAction.repaint)paint();return;}
   if(b.dataset.vc19310Space){switchSpace(b.dataset.vc19310Space);return;}
   if(b.dataset.vc19310Rot){const s=doc.getElementById('vc157-rotation');if(s){s.value=b.dataset.vc19310Rot;s.dispatchEvent(new win.Event('change',{bubbles:true}));delay();}return;}
   if(b.dataset.vc19310Zone){const n=Number(b.dataset.vc19310Zone);state.zone=state.zone===n?null:n;paint();return;}
   if(b.dataset.vc19310Rally){selectRally(b.dataset.vc19310Rally,{play:state.space==='video'});return;}
   if(b.dataset.vc19310Select){selectRally(b.dataset.vc19310Select,{play:state.space==='video'});return;}
   if(b.dataset.vc19310SearchMode){state.searchMode=b.dataset.vc19310SearchMode;state.search={status:'closed'};paint();return;}
   if(b.dataset.vc19310LegacyPage){const [page,sub='']=b.dataset.vc19310LegacyPage.split(':');toggleLegacy(true);win.VC173_ANALYSIS_WORKSPACE?.selectPage?.(page,sub);return;}
   switch(b.dataset.vc19310Command){
    case 'refresh':doc.getElementById('vc157-refresh-matches')?.click();delay();break;
    case 'advanced':toggleLegacy(!state.advanced);break;
    case 'official':doc.getElementById('vc157-official')?.click();break;
    case 'play':{
     const rally=filteredRallies.find(r=>r.key===state.selected);
     if(state.space==='video'&&win.VC_VIDEO_SCORE_19312?.openRally?.(win,ctx?.match,rally)){break;}
     const keys=node._vc19310VideoKeys;
     if(keys?.length&&ctx?.match?.id!=null)win.VC_VIDEO_ANALYTICS_1612?.openKeys?.(ctx.match.id,keys);
     break;}
    case 'clear-zone':state.zone=null;paint();break;
    case 'apply-search':{node.querySelectorAll('[data-vc19310-search]').forEach(i=>{state.search[i.dataset.vc19310Search]=i.value;});paint();break;}
    case 'clear-search':state.search={status:'closed'};state.searchPreset='';paint();break;
    case 'search-save':{const name=val(win.prompt?.('Nombre de la búsqueda (máx. 40 caracteres)')).slice(0,40);if(!name)break;
     try{const key='vc1939:search-presets:1',stored=win.VC_RALLY_SEARCH_1939.readPresets(win.localStorage).filter(x=>x.name!==name);
      node.querySelectorAll('[data-vc19310-search]').forEach(i=>{state.search[i.dataset.vc19310Search]=i.value;});
      stored.push({name,filters:win.VC_RALLY_SEARCH_1939.normFilters(state.search)});win.localStorage.setItem(key,JSON.stringify(stored.slice(-15)));
      state.searchPreset=name;paint();setStatus('Búsqueda guardada localmente.');}catch(_){setStatus('No se pudo guardar la búsqueda en este dispositivo.');}break;}
    case 'search-load':{try{const saved=win.VC_RALLY_SEARCH_1939.readPresets(win.localStorage).find(x=>x.name===state.searchPreset);if(saved){state.search={...saved.filters};paint();}}catch(_){}break;}
    case 'search-delete':{try{const key='vc1939:search-presets:1',saved=win.VC_RALLY_SEARCH_1939.readPresets(win.localStorage).filter(x=>x.name!==state.searchPreset);win.localStorage.setItem(key,JSON.stringify(saved));state.searchPreset='';paint();}catch(_){}break;}

   }
  });
  view.addEventListener('toggle',e=>{if(state.space==='distribution'&&e.target?.matches?.('.vc193161-advanced')){
   const container=state.vc193161;if(container)container.advanced=e.target.open;
  }},true);
  view.addEventListener('input',e=>{if(state.space==='video'&&e.target?.matches?.('[data-vc19314-search]'))win.VC_INTEGRATED_VIDEO_19314?.filterCodes?.(node,e.target.value);});
  view.addEventListener('change',e=>{const t=e.target;if(!t)return;
   if(node?.contains(t)&&state.space==='worksheets'&&t.dataset?.vc19318Import!==undefined){win.VC_WORKSHEETS_19318?.handleFile?.({target:t,state,win,status:setStatus});return;}
   if(['vc157-match','vc157-team','vc157-set','vc157-phase','vc157-rotation'].includes(t.id)){state.zone=null;state.selected=null;delay();return;}
   if(t.dataset?.vc19310Preset!==undefined&&node?.contains(t)){state.searchPreset=t.value;return;}
   if(node?.contains(t)&&state.space==='montage'&&t.dataset?.vc19317Input!==undefined){win.VC_VIDEO_MONTAGE_19317?.change?.(win,t);return;}
   if(node?.contains(t)&&state.space==='worksheets'&&win.VC_WORKSHEETS_19318?.handleChange?.({target:t,state})){paint();return;}
   if(node?.contains(t)&&state.space==='court'&&win.VC_TACTICAL_TABLES_193195?.handleChange?.({target:t,state})){paint();return;}
   if(node?.contains(t)&&state.space==='distribution'&&win.VC_DISTRIBUTION_193161?.handleChange?.({target:t,state})){paint();return;}
   if(node?.contains(t)&&win.VC_ANALYSIS_SCREENS_19311?.handleChange?.({target:t,state})){paint();return;}
   if(!node?.contains(t)||!t.dataset?.vc19310Filter)return;
   if(t.dataset.vc19310Filter==='Fundamento'){state.courtSkill=t.value;state.zone=null;paint();}
   if(t.dataset.vc19310Filter==='Mapa'){state.courtMode=t.value;state.zone=null;paint();}
   const mappings={'Fundamento':'skill','Jugador':'player','Valoración':'evaluation','Resultado':'outcome','Rotación propia':'ownRotation','Rotación rival':'rivalRotation','Recepción previa':'reception','Colocador':'setter','Atacante':'attacker','Tempo':'tempo','Combinación':'combo','Zona origen':'startZone','Zona destino':'endZone'};
   if(state.space==='search'&&mappings[t.dataset.vc19310Filter])state.search[mappings[t.dataset.vc19310Filter]]=t.value;
  },true);
  const observe=new win.MutationObserver(()=>{if(!view.classList.contains('active')){win.VC_VIDEO_MONTAGE_19317?.unmount?.(win);win.VC_INTEGRATED_VIDEO_19314?.park?.(win);return;}if(!initialized)delay();else if(!view.classList.contains('vc1930-active'))delay();});
  observe.observe(view,{attributes:true,attributeFilter:['class','data-vc157-mode']});
  if(view.classList.contains('active'))delay();
  win.VC_PRO_ANALYSIS_19310_STATE={get space(){return state.space},get mounted(){return initialized},show:space=>{if(SPACES.some(x=>x[0]===space)){state.space=space;toggleLegacy(false);paint();}},refresh:delay};
 }
 return {VERSION,SPACES,GROUPS,GROUP_DEFAULT,GROUP_FOR_SPACE,skillsView,initialState,baseProjection,pointSummary,rotationReport,groupContacts,attackEff,collectZones,distribution,filterCourtRallies,evidenceCandidates,reportTable,distributionSvg,createShell,mount};
});
/* VC2075_SOURCE_END:191-vc19310-professional-analysis-architecture.js */
;
