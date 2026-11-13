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
 const VERSION='19.3.10';
 const SPACES=[['match','Match Analysis','Tablas y K1/K2'],['distribution','Distribution','Colocador y ataque'],['court','Court Analysis','Zonas y trayectorias'],['search','Rally Search','Búsquedas tácticas'],['video','Video Analysis','Rallies y vídeo'],['worksheets','Worksheets','Hojas e informes']];
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
  const node=doc.createElement('section');node.id='vc19310-workspace';node.className='vc19310-workspace';node.innerHTML=`<header class="vc19310-head"><div><small>VOLLEY COACH PROFESSIONAL · V${VERSION}</small><h2>Analysis Pro</h2><p>Estadísticas, distribuciones, pistas, búsquedas y vídeo · mismo scouting</p></div><div class="vc19310-actions"><button data-vc19310-command="refresh">Actualizar</button><button data-vc19310-command="official">PDF oficial</button><button data-vc19310-command="advanced">Herramientas originales</button></div></header><nav class="vc19310-nav" aria-label="Espacios de análisis">${SPACES.map(([id,title,description],i)=>`<button type="button" role="tab" data-vc19310-space="${id}" aria-selected="${i===0}"><strong>${title}</strong><small>${description}</small></button>`).join('')}</nav><div class="vc19310-subbar"><span id="vc19310-match-label">Sin scouting seleccionado</span><span id="vc19310-sample" aria-live="polite">Selecciona un partido para comenzar</span></div><div id="vc19310-body" role="tabpanel"></div><div class="vc19310-status" role="status" aria-live="polite"></div>`;
  return node;
 }
 function initialState(){return {space:'match',advanced:false,zone:null,courtSkill:'A',courtMode:'destination',searchMode:'codes',search:{status:'closed'},searchPreset:'',searchResults:[],selected:null,sort:'count'};}
 function tableHtml(columns,rows){return `<div class="vc19310-scroll"><table><thead><tr>${columns.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${columns.length}">Sin datos codificados para este filtro</td></tr>`}</tbody></table></div>`;}
 function filterCourtRallies(rallies,contacts,skill,kind,zoneNo){if(!zoneNo)return rallies;const zoneField=kind==='origin'?'startZone':kind==='destination'?'endZone':skill==='E'?'setTarget':skill==='R'?'contactZone':'endZone';const keys=new Set(contacts.filter(c=>c.skill===skill&&c.fields?.[zoneField]?.zone===zoneNo).map(c=>c.rallyKey));return rallies.filter(r=>keys.has(r.key));}
 function evidenceHtml(rallies){const subset=rallies.slice(-80).reverse();return `<aside class="vc19310-panel vc19310-evidence"><div class="vc19310-panelhead"><strong>JUGADAS Y EVIDENCIA</strong><span>${rallies.length} rallies</span></div><div class="vc19310-rallies">${subset.map(r=>`<button type="button" class="vc19310-rally" data-vc19310-rally="${esc(r.key)}"><b>S${r.set} · #${r.index}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.serving==='ours'?'Saque propio':r.serving==='opponent'?'Saque rival':'Saque desconocido'}</span></button>`).join('')||'<p class="vc19310-note">No hay rallies con estos filtros.</p>'}</div><div class="vc19310-video-box"><div class="vc19310-screen"><span>▶</span><strong>VÍDEO VINCULADO</strong><small>Se abre en el reproductor de Video Studio</small></div><p data-vc19310-detail>Selecciona una jugada.</p><button type="button" data-vc19310-command="play" disabled>Abrir rally en vídeo</button></div></aside>`;}
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
  function findContext(){try{return win.VC_ANALYSIS_MAIN_1937?.selectContext?.(win)||null;}catch(e){setStatus('No se pudo acceder al contexto del partido.');return null}}
  function toggleLegacy(value){
   state.advanced=!!value;view.classList.toggle('vc19310-legacy',state.advanced);
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
  function paint(){if(!view.classList.contains('active'))return;if(!build())return;if(view.classList.contains('vc1930-active'))return;
   ctx=findContext();if(!ctx||!ctx.match){node.querySelector('#vc19310-body').innerHTML='<div class="vc19310-panel"><p>Selecciona un scouting en la barra superior para comenzar.</p></div>';return;}
   projection=baseProjection(win.VC_DATA_ENGINE_1938,ctx.match,ctx);if(!projection){setStatus('Motor de datos no disponible');return;}
   const opts=ctx.team==='ours'?'Nuestro equipo':'Rival';node.querySelector('#vc19310-match-label').textContent=`${val(ctx.match.name||ctx.match.title||ctx.match.opponentName||ctx.match.id)} · ${opts}`;
   node.querySelector('#vc19310-sample').textContent=`${projection.base.rallies.length} rallies · ${projection.base.contacts.length} contactos · sin alterar el scouting`;
   node.querySelectorAll('[data-vc19310-space]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.vc19310Space===state.space)));
   const body=node.querySelector('#vc19310-body');
   if(state.space==='match')body.innerHTML=matchView(ctx,projection);
   else if(state.space==='distribution')body.innerHTML=distributionView(ctx,projection);
   else if(state.space==='court')body.innerHTML=courtView(ctx,projection,state);
   else if(state.space==='search')body.innerHTML=searchView(ctx,projection,state,win.VC_RALLY_SEARCH_1939);
   else if(state.space==='video')body.innerHTML=videoView(ctx,projection);
   else body.innerHTML=worksheetsView(ctx,projection);
   const source=state.space==='search'?(win.VC_RALLY_SEARCH_1939?.query?.(projection.model,{...state.search,team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase})?.rallies||[]):projection.base.rallies;
   const filtered=state.space==='court'?filterCourtRallies(source,projection.base.contacts.filter(c=>c.team===ctx.team),state.courtSkill,state.courtMode,state.zone):source;
   filteredRallies=filtered;legacyRallies=evidenceCandidates(ctx,filtered);const choice=filtered.find(r=>r.key===state.selected);if(choice)selectRally(choice.key);
   else if(filtered.length)selectRally(filtered[filtered.length-1].key);
   else state.selected=null;
  }
  function selectRally(key){const r=filteredRallies.find(x=>x.key===key);if(!r)return;state.selected=key;node.querySelectorAll('[data-vc19310-rally]').forEach(b=>b.classList.toggle('is-selected',b.dataset.vc19310Rally===key));
   const legacy=legacyRallies.find(x=>x.set===r.set&&(r.nativeId!=null&&String(x.id)===String(r.nativeId)||x.index===r.index));
   const actionKeys=arr(legacy?.actions).filter(a=>a.video&&a.key).map(a=>a.key),videoApi=win.VC_VIDEO_ANALYTICS_1612;
   const play=node.querySelector('[data-vc19310-command="play"]');if(play){play.disabled=!actionKeys.length||typeof videoApi?.openKeys!=='function';play.dataset.keys=actionKeys.join(',');}
   const target=node.querySelector('[data-vc19310-detail]');if(target)target.textContent=`Set ${r.set} · Rally #${r.index} · ${r.contacts.length} contactos · ${actionKeys.length} acciones con vídeo`;
   node._vc19310VideoKeys=actionKeys;
  }
  view.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!node?.contains(b))return;
   if(b.dataset.vc19310Space){state.space=b.dataset.vc19310Space;state.zone=null;toggleLegacy(false);paint();return;}
   if(b.dataset.vc19310Rot){const s=doc.getElementById('vc157-rotation');if(s){s.value=b.dataset.vc19310Rot;s.dispatchEvent(new win.Event('change',{bubbles:true}));delay();}return;}
   if(b.dataset.vc19310Zone){const n=Number(b.dataset.vc19310Zone);state.zone=state.zone===n?null:n;paint();return;}
   if(b.dataset.vc19310Rally){selectRally(b.dataset.vc19310Rally);return;}
   if(b.dataset.vc19310Select){selectRally(b.dataset.vc19310Select);return;}
   if(b.dataset.vc19310SearchMode){state.searchMode=b.dataset.vc19310SearchMode;state.search={status:'closed'};paint();return;}
   if(b.dataset.vc19310LegacyPage){const [page,sub='']=b.dataset.vc19310LegacyPage.split(':');toggleLegacy(true);win.VC173_ANALYSIS_WORKSPACE?.selectPage?.(page,sub);return;}
   switch(b.dataset.vc19310Command){
    case 'refresh':doc.getElementById('vc157-refresh-matches')?.click();delay();break;
    case 'advanced':toggleLegacy(!state.advanced);break;
    case 'official':doc.getElementById('vc157-official')?.click();break;
    case 'play':{const keys=node._vc19310VideoKeys;if(keys?.length&&ctx?.match?.id!=null)win.VC_VIDEO_ANALYTICS_1612?.openKeys?.(ctx.match.id,keys);break;}
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
  view.addEventListener('change',e=>{const t=e.target;if(!t)return;
   if(['vc157-match','vc157-team','vc157-set','vc157-phase','vc157-rotation'].includes(t.id)){state.zone=null;state.selected=null;delay();return;}
   if(t.dataset?.vc19310Preset!==undefined&&node?.contains(t)){state.searchPreset=t.value;return;}
   if(!node?.contains(t)||!t.dataset?.vc19310Filter)return;
   if(t.dataset.vc19310Filter==='Fundamento'){state.courtSkill=t.value;state.zone=null;paint();}
   if(t.dataset.vc19310Filter==='Mapa'){state.courtMode=t.value;state.zone=null;paint();}
   const mappings={'Fundamento':'skill','Jugador':'player','Valoración':'evaluation','Resultado':'outcome','Rotación propia':'ownRotation','Rotación rival':'rivalRotation','Recepción previa':'reception','Colocador':'setter','Atacante':'attacker','Tempo':'tempo','Combinación':'combo','Zona origen':'startZone','Zona destino':'endZone'};
   if(state.space==='search'&&mappings[t.dataset.vc19310Filter])state.search[mappings[t.dataset.vc19310Filter]]=t.value;
  },true);
  const observe=new win.MutationObserver(()=>{if(view.classList.contains('active')&&!initialized)delay();else if(view.classList.contains('active')&&initialized&&!view.classList.contains('vc1930-active'))delay();});
  observe.observe(view,{attributes:true,attributeFilter:['class','data-vc157-mode']});
  if(view.classList.contains('active'))delay();
  win.VC_PRO_ANALYSIS_19310_STATE={get space(){return state.space},get mounted(){return initialized},show:space=>{if(SPACES.some(x=>x[0]===space)){state.space=space;toggleLegacy(false);paint();}},refresh:delay};
 }
 return {VERSION,SPACES,initialState,baseProjection,pointSummary,rotationReport,groupContacts,attackEff,collectZones,distribution,filterCourtRallies,evidenceCandidates,reportTable,distributionSvg,createShell,mount};
});
