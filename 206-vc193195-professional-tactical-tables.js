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
