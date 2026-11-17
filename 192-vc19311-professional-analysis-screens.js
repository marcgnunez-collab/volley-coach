/* Volley Coach V19.3.11 · Professional Analysis Screens.
 * Read-only analytical surfaces: setter distribution, direction zones, and worksheets.
 * Scouting/Sync/REC/PDF remain the sole original data owners.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_SCREENS_19311=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.11.3',SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const PREF_KEY='vc19311:worksheet-layouts:v1';
 const DEFAULTS=[{name:'Eficiencia de ataque',formula:'100*(POINT-ERROR-BLOCKED)/EVAL',group:'player',skill:'A'},
  {name:'Recepción positiva',formula:'100*POSITIVE/EVAL',group:'player',skill:'R'},
  {name:'Puntos de saque',formula:'100*POINT/EVAL',group:'player',skill:'S'}];
 const VARS=['N','EVAL','POINT','HASH','PLUS','ERROR','BLOCKED','POSITIVE','NEGATIVE','NOT_RATED'];
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(n,d)=>d?Math.round(n/d*1000)/10:null;
 const num=x=>Number.isFinite(x)?x.toLocaleString('es-ES',{maximumFractionDigits:1}):'—';
 const percentage=x=>x==null?'—':num(x)+' %';
 const known=(x)=>x!==null&&x!==undefined&&val(x)!=='';
 const zoneOf=(c,kind,skill)=>{
  const f=c?.fields||{};
  if(kind==='origin')return f.startZone||(skill==='R'?f.contactZone:null);
  if(kind==='destination')return skill==='E'?f.setTarget:(f.endZone||(skill==='R'?f.contactZone:null));
  return null;
 };
 function ensureState(state){
  if(!state.vc19311)state.vc19311={dist:{setter:'',reception:'',tempo:'',attacker:'',target:'',combo:''},
   court:{skill:'A',kind:'destination',evaluation:'',player:'',zone:null,quad:'',path:'',expanded:false},
   ws:{skill:'A',group:'player',formula:DEFAULTS[0].formula,label:'Eficiencia de ataque',selected:'',focus:''}};
  return state.vc19311;
 }
 function optionList(values,current='',label='Todos'){
  const opts=[['',label],...values.map(x=>Array.isArray(x)?x:[x,x])];
  return opts.map(([id,name])=>`<option value="${esc(id)}"${val(id)===val(current)?' selected':''}>${esc(name)}</option>`).join('');
 }
 function filterLabel(name,key,opts,value){return `<label>${esc(name)}<select data-vc19311-filter="${esc(key)}">${optionList(opts,value)}</select></label>`;}
 function unique(items){return [...new Set(items.map(x=>val(x)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));}
 function teamRallies(base,keys){return arr(base.rallies).filter(r=>keys.has(r.key));}
 function evidence(rallies,title='RALLIES VINCULADOS'){
  const list=arr(rallies).slice(-120).reverse().map(r=>`<button class="vc19310-rally" type="button" data-vc19310-rally="${esc(r.key)}"><b>S${esc(r.set)} · #${esc(r.index)}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.serving==='ours'?'Saque propio':r.serving==='opponent'?'Saque rival':'Saque —'}</span></button>`).join('');
  return `<aside class="vc19310-panel vc19310-evidence"><div class="vc19310-panelhead"><strong>${esc(title)}</strong><span>${rallies.length} rallies</span></div><div class="vc19310-rallies">${list||'<p class="vc19310-note">No hay rallies que cumplan estos filtros.</p>'}</div><div class="vc19310-video-box"><div class="vc19310-screen"><strong>VIDEO STUDIO</strong><small>Selecciona el rally para abrir su vídeo vinculado</small></div><p data-vc19310-detail>Selecciona una jugada</p><button type="button" data-vc19310-command="play" disabled>Abrir vídeo del rally</button></div></aside>`;
 }
 function attackOutcome(chains){const a=chains.map(x=>x.attack).filter(Boolean),rated=a.filter(x=>x.evaluation),win=rated.filter(x=>x.evaluation==='#').length,err=rated.filter(x=>x.evaluation==='=').length,blocked=rated.filter(x=>x.evaluation==='/').length;
  return {attacks:a.length,rated:rated.length,win,err,blocked,eff:pct(win-err-blocked,rated.length)};
 }
 function matchChains(chains,f){return arr(chains).filter(c=>(!f.setter||c.setter?.player===f.setter)&&(!f.reception||c.reception?.evaluation===f.reception)
  &&(!f.tempo||val(c.tempo||c.attack?.fields?.attackTempo)===f.tempo)&&(!f.attacker||c.attack?.player===f.attacker)
  &&(!f.target||c.target?.code===f.target||(/^Z[1-9]$/.test(f.target)&&c.target?.zone===Number(f.target.slice(1))))&&(!f.combo||val(c.combo)===f.combo));}
 function distributionModel(projection,team,f){
  const chains=projection.base.chains.filter(c=>c.team===team),selected=matchChains(chains,f),coded=selected.filter(c=>c.target?.zone>=1&&c.target.zone<=9);
  const groups=new Map();
  for(const c of coded){const key=c.target.code,entry=groups.get(key)||{key,zone:c.target.zone,quadrant:c.target.quadrant||'',chains:[]};entry.chains.push(c);groups.set(key,entry);}
  const zones=Array.from({length:9},(_,i)=>({zone:i+1,chains:coded.filter(c=>c.target.zone===i+1)}));
  const perSetter=[...new Set(selected.map(c=>c.setter?.player||'Sin identificar'))].map(name=>({name,chains:selected.filter(c=>(c.setter?.player||'Sin identificar')===name)}));
  const keys=new Set(selected.map(c=>c.rallyKey));
  return {all:chains,selected,coded,unknown:selected.length-coded.length,zones,groups:[...groups.values()].sort((a,b)=>b.chains.length-a.chains.length),perSetter,keys,outcome:attackOutcome(selected)};
 }
 function rotationCells(base,team,selected){return Array.from({length:6},(_,i)=>{
  const n=i+1,rallies=base.rallies.filter(r=>(team==='ours'?r.ownRotation:r.rivalRotation)===n),keys=new Set(rallies.map(r=>r.key)),count=selected.filter(c=>keys.has(c.rallyKey)).length,
   k1=rallies.filter(r=>r.serving&&r.serving!==team),k2=rallies.filter(r=>r.serving===team);
  const ratio=rs=>rs.length?percentage(pct(rs.filter(r=>r.winner===team).length,rs.length)):'—';
  return `<button type="button" data-vc19310-rot="${n}"><strong>R${n}</strong><span>${count} colocaciones</span><small>K1 ${ratio(k1)} · K2 ${ratio(k2)}</small></button>`;
 }).join('');}
 const COURT_POS={4:[.18,.18],3:[.50,.18],2:[.82,.18],5:[.18,.50],6:[.50,.50],1:[.82,.50],7:[.18,.82],8:[.50,.82],9:[.82,.82]};
 const DIST_HUB=[.50,.88];
 function directionSvg(paths,options={}){
  const max=Math.max(1,...paths.map(x=>x.count));
  const mode=options.mode==='distribution'?'distribution':'court';
  const width=mode==='distribution'?700:900;
  const height=mode==='distribution'?430:640;
  const markerId='vc19311-arrow-'+mode;
  const visible=paths.slice(0,mode==='distribution'?6:12);
  const renderPath=(from,to,count,index)=>{
   const source=mode==='distribution'?DIST_HUB:(COURT_POS[from]||DIST_HUB);
   const target=COURT_POS[to];
   if(!source||!target)return '';
   const X=Math.round(source[0]*width),Y=Math.round(source[1]*height),x2=Math.round(target[0]*width),y2=Math.round(target[1]*height);
   const bend=index%2?-1:1;
   const curve=Math.min(90,25+index*8);
   const cx=Math.round((X+x2)/2 + bend*curve);
   const cy=Math.round((Y+y2)/2 - (mode==='distribution'?70:40));
   const active=options.activePath&&options.activePath===`${from}→${to}`;
   const primary=index===0||active;
   const stroke=primary?'#f08a37':'#2f6db0';
   const opacity=active?1:(primary?.92:.76);
   const sw=(mode==='distribution'?5.5:4)+(count/max)*(mode==='distribution'?5:4.5);
   return `<path d="M ${X} ${Y} Q ${cx} ${cy} ${x2} ${y2}" stroke="${stroke}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" opacity="${opacity}" fill="none" marker-end="url(#${markerId})"/>`;
  };
  return `<svg class="vc19311-direction-overlay ${mode==='distribution'?'is-distribution':'is-court'}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#2f6db0"/></marker><marker id="${markerId}-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#f08a37"/></marker></defs>${visible.map((x,i)=>{
    const from=mode==='distribution'?6:x.from;
    return renderPath(from,x.to,x.count,i).replace(`url(#${markerId})`,`url(#${i===0||(options.activePath&&options.activePath===`${from}→${x.to}`)?markerId+'-hot':markerId})`);
  }).join('')}</svg>`;
 }
 function distributionCourt(model){
  const totals=model.coded.length,zoneCounts=new Map(model.zones.map(x=>[x.zone,x.chains.length]));const top=Math.max(1,...zoneCounts.values());
  const pathways=model.zones.filter(z=>z.chains.length).map(z=>({from:6,to:z.zone,count:z.chains.length}));
  const topTargets=model.groups.slice(0,5).map((g,i)=>`<div class="vc19311-mini-stat ${i===0?'is-top':''}"><span>${esc(g.key||('Z'+g.zone))}</span><strong>${g.chains.length}</strong><small>${percentage(pct(g.chains.length,totals))}</small></div>`).join('');
  return `<div class="vc19311-dist-shell"><div class="vc19311-dist-court" role="group" aria-label="Distribución a zonas de colocación"><div class="vc19311-dist-label">RED · DISTRIBUCIÓN DE COLOCACIÓN</div><div class="vc19311-court-grid">${[4,3,2,5,6,1].map(z=>{
   const n=zoneCounts.get(z)||0;return `<button type="button" data-vc19311-dist-zone="Z${z}" class="vc19311-cell" style="--intensity:${(n/top*.52+.09).toFixed(2)}"><small>Z${z}</small><strong>${n||'—'}</strong><span>${percentage(pct(n,totals))}</span></button>`;
  }).join('')}</div><div class="vc19311-setter-hub"><span>SET</span><strong>Z6</strong></div>${directionSvg(pathways,{mode:'distribution'})}</div><div class="vc19311-dist-side"><div class="vc19311-side-head"><strong>Resumen visual</strong><span>${totals} destinos codificados</span></div><div class="vc19311-mini-grid">${topTargets||'<p class="vc19311-help">Sin destinos codificados.</p>'}</div><p class="vc19311-help">Las flechas muestran la frecuencia de colocación desde la zona de distribución hacia el destino final. No representan una trayectoria física real.</p></div></div>`;
 }
 function distributionView(ctx,projection,state){
  const f=ensureState(state).dist,base=projection.base,model=distributionModel(projection,ctx.team,f);
  const fields=`${filterLabel('Colocador','dist.setter',unique(model.all.map(c=>c.setter?.player)),f.setter)}${filterLabel('Recepción previa','dist.reception',['#','+','!','-','/','='],f.reception)}${filterLabel('Tempo','dist.tempo',unique(model.all.map(c=>c.tempo||c.attack?.fields?.attackTempo)),f.tempo)}${filterLabel('Atacante','dist.attacker',unique(model.all.map(c=>c.attack?.player)),f.attacker)}${filterLabel('Combinación','dist.combo',unique(model.all.map(c=>c.combo)),f.combo)}${filterLabel('Destino','dist.target',unique([...Array.from({length:9},(_,i)=>'Z'+(i+1)),...model.all.map(c=>c.target?.code)]),f.target)}`;
  const rows=model.zones.filter(z=>z.chains.length).map(z=>{const s=attackOutcome(z.chains);return `<tr><td><button type="button" data-vc19311-dist-zone="Z${z.zone}">Z${z.zone}</button></td><td>${z.chains.length}</td><td>${percentage(pct(z.chains.length,model.coded.length))}</td><td>${s.rated}/${s.attacks}</td><td>${percentage(s.eff)}</td></tr>`}).join('');
  const setterRows=model.perSetter.sort((a,b)=>b.chains.length-a.chains.length).map(x=>{const s=attackOutcome(x.chains);return `<tr><td>${esc(x.name)}</td><td>${x.chains.length}</td><td>${s.attacks}</td><td>${percentage(s.eff)}</td></tr>`}).join('');
  const rotationRow=rotationCells(base,ctx.team,model.selected),hasUnknown=!!model.unknown;
  const html=`<div class="vc19311-title"><div><small>SETTER DISTRIBUTION · PROFESSIONAL</small><h3>Distribución del colocador</h3><span>Datos vinculados a posesión y a los contactos reales</span></div><button type="button" data-vc19311-command="dist-clear">Reiniciar filtros</button></div><div class="vc19311-filterbar">${fields}</div>
  <div class="vc19310-rot-cards vc19311-rot-row">${rotationRow}</div><div class="vc19311-metrics"><div><small>Colocaciones filtradas</small><strong>${model.selected.length}</strong></div><div><small>Destinos conocidos</small><strong>${model.coded.length}</strong></div><div><small>Sin destino codificado</small><strong>${model.unknown}</strong></div><div><small>EFF ataque posterior</small><strong>${percentage(model.outcome.eff)}</strong><span>${model.outcome.rated} ataques valorados</span></div></div>
  <div class="vc19311-workspace vc19311-dist-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>DISTRIBUCIÓN POR ZONA</strong><span>${model.coded.length} destinos válidos</span></div>${distributionCourt(model)}</section><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>FRECUENCIAS Y EFICIENCIA</strong><span>Por destino / por colocador</span></div><h3>Zonas de colocación</h3><div class="vc19310-scroll"><table><thead><tr><th>Zona</th><th>E</th><th>Uso</th><th>A val.</th><th>EFF A</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sin destinos codificados</td></tr>'}</tbody></table></div><h3>Colocadores</h3><div class="vc19310-scroll"><table><thead><tr><th>Colocador</th><th>E</th><th>A</th><th>EFF A</th></tr></thead><tbody>${setterRows||'<tr><td colspan="4">Sin colocaciones</td></tr>'}</tbody></table></div><p class="vc19311-help">EFF A = (# − = − /) / ataques valorados. Se excluyen ataques sin valoración. ${hasUnknown?'Hay destinos sin codificar.':''}</p></section>${evidence(teamRallies(base,model.keys),'RALLIES DEL FILTRO')}</div>`;
  return {html,rallies:teamRallies(base,model.keys)};
 }
 function courtModel(projection,team,filters){
  const all=projection.base.contacts.filter(c=>c.team===team&&c.skill===filters.skill);
  const chosen=all.filter(c=>(!filters.evaluation||c.evaluation===filters.evaluation)&&(!filters.player||c.player===filters.player));
  const located=chosen.map(c=>({c,z:zoneOf(c,filters.kind,filters.skill)})).filter(x=>x.z?.zone>=1&&x.z.zone<=9),missing=chosen.length-located.length;
  const byZone=Array.from({length:9},(_,i)=>({zone:i+1,items:located.filter(x=>x.z.zone===i+1)}));
  const pathItems=chosen.map(c=>({c,from:c.fields?.startZone?.zone,to:c.fields?.endZone?.zone})).filter(x=>x.from>=1&&x.from<=9&&x.to>=1&&x.to<=9);
  const paths=new Map();for(const x of pathItems){const id=x.from+'→'+x.to,entry=paths.get(id)||{id,from:x.from,to:x.to,count:0,keys:new Set()};entry.count++;entry.keys.add(x.c.rallyKey);paths.set(id,entry);}
  const visible=located.filter(x=>(!filters.zone||x.z.zone===filters.zone)&&(!filters.quad||x.z.quadrant===filters.quad)
   &&(!filters.path||(filters.path===val(x.c.fields?.startZone?.zone)+'→'+val(x.c.fields?.endZone?.zone))));
  return {all,chosen,located,missing,byZone,paths:[...paths.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id)),visible,
   rallyKeys:new Set((filters.zone||filters.quad||filters.path?visible.map(x=>x.c):chosen).map(c=>c.rallyKey))};
 }
 const quadOrder=['C','B','D','A'];
 function courtCells(model,f){const len=f.expanded?9:6,zones=(f.expanded?[4,3,2,5,6,1,7,8,9]:[4,3,2,5,6,1]);
  const max=Math.max(1,...model.byZone.map(x=>x.items.length));
  const topZones=model.byZone.filter(z=>(f.expanded||z.zone<=6)&&z.items.length).sort((a,b)=>b.items.length-a.items.length).slice(0,4).map(z=>`<div class="vc19311-zone-pill"><strong>Z${z.zone}</strong><span>${z.items.length}</span><small>${percentage(pct(z.items.length,model.located.length))}</small></div>`).join('');
  return `<div class="vc19311-analysis-shell"><div class="vc19311-analysis-court"><div class="vc19311-court-top">${f.kind==='destination'?'DESTINO DE ACCIONES':'ORIGEN DE ACCIONES'} · RED / NET</div><div class="vc19311-court-grid ${len===9?'is-nine':''}">${zones.map(n=>{
   const z=model.byZone[n-1],active=f.zone===n,quads=quadOrder.map(q=>{const count=z.items.filter(x=>x.z.quadrant===q).length;return `<button type="button" data-vc19311-quadrant="${n}:${q}" class="${active&&f.quad===q?'is-active':''}" aria-label="Zona ${n}, subzona ${q}: ${count} acciones"><span>${q}</span><small>${count||'—'}</small></button>`;}).join('');
   return `<div class="vc19311-court-zone ${active?'is-selected':''}" style="--intensity:${(z.items.length/max*.52+.08).toFixed(2)}"><button type="button" class="vc19311-zone-action" data-vc19311-zone="${n}" aria-pressed="${active}"><strong>Z${n}</strong><b>${z.items.length||'—'}</b><small>${percentage(pct(z.items.length,model.located.length))}</small></button><div class="vc19311-quad-grid">${quads}</div></div>`;
  }).join('')}</div></div><aside class="vc19311-court-summary"><div class="vc19311-side-head"><strong>Lectura rápida</strong><span>${model.located.length} acciones con zona</span></div><div class="vc19311-mini-grid">${topZones||'<p class="vc19311-help">Sin zonas explícitas.</p>'}</div><p class="vc19311-help">A: abajo derecha · B: arriba derecha · C: arriba izquierda · D: abajo izquierda. ${f.expanded?'Z7–Z9 son zonas adicionales de codificación, no posiciones reglamentarias.':''}</p></aside></div>`;
 }
 function courtView(ctx,projection,state){const f=ensureState(state).court,base=projection.base,model=courtModel(projection,ctx.team,f),skillOptions=Object.entries(SKILLS).map(([k,x])=>[k,x]);
  const bar=`${filterLabel('Fundamento','court.skill',skillOptions,f.skill)}${filterLabel('Jugador','court.player',unique(base.contacts.filter(c=>c.team===ctx.team&&c.skill===f.skill).map(c=>c.player)),f.player)}${filterLabel('Valoración','court.evaluation',['#','+','!','-','/','='],f.evaluation)}${filterLabel('Mapa','court.kind',[['origin','Origen'],['destination','Destino']],f.kind)}<label>Visualización<select data-vc19311-filter="court.expanded"><option value="false"${!f.expanded?' selected':''}>6 zonas oficiales</option><option value="true"${f.expanded?' selected':''}>9 zonas ampliadas</option></select></label><button type="button" data-vc19311-command="court-clear">Quitar selección</button>`;
  const counts=model.byZone.filter(z=>f.expanded||z.zone<=6).map(z=>`<tr><td><button type="button" data-vc19311-zone="${z.zone}">Z${z.zone}</button></td><td>${z.items.length}</td><td>${percentage(pct(z.items.length,model.located.length))}</td><td>${z.items.filter(x=>x.z.quadrant).length}</td></tr>`).join('');
  const routeRows=model.paths.slice(0,20).map(x=>`<tr><td><button type="button" data-vc19311-path="${esc(x.id)}">Z${x.from} → Z${x.to}</button></td><td>${x.count}</td><td>${percentage(pct(x.count,model.pathItems||model.paths.reduce((n,x)=>n+x.count,0)))}</td></tr>`).join('');
  const keyset=model.rallyKeys;const rallies=teamRallies(base,keyset);
  const activeLabel=f.path?f.path:(f.zone?`Z${f.zone}${f.quad?` · ${f.quad}`:''}`:'Todas las zonas');
  const html=`<div class="vc19311-title"><div><small>COURT & DIRECTION ANALYSIS</small><h3>Mapas de zonas y trayectorias</h3><span>Selecciona una zona, subzona o dirección para revisar los rallies</span></div><button type="button" data-vc19311-command="court-clear">Limpiar mapa</button></div><div class="vc19311-filterbar">${bar}</div><div class="vc19311-metrics"><div><small>Acciones del filtro</small><strong>${model.chosen.length}</strong></div><div><small>Con zona explícita</small><strong>${model.located.length}</strong></div><div><small>Sin zona registrada</small><strong>${model.missing}</strong></div><div><small>Con origen y destino</small><strong>${model.paths.reduce((n,x)=>n+x.count,0)}</strong></div></div>
   <div class="vc19311-workspace vc19311-court-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>PISTA INTERACTIVA</strong><span>${activeLabel} · ${model.paths.length} direcciones</span></div>${courtCells(model,f)}<div class="vc19311-direction-bar"><strong>Mapa de trayectorias codificadas</strong><span>${model.paths.reduce((n,x)=>n+x.count,0)} pares origen–destino</span></div><div class="vc19311-direction-board">${directionSvg(model.paths,{mode:'court',activePath:f.path})}<small>Mapa de frecuencias entre origen y destino. Solo usa pares explícitamente codificados.</small></div></section><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>ANÁLISIS DE DESTINOS</strong><span>${rallies.length} rallies seleccionados</span></div><h3>Frecuencias por zona</h3><div class="vc19310-scroll"><table><thead><tr><th>Zona</th><th>N</th><th>Uso</th><th>Subzonas</th></tr></thead><tbody>${counts}</tbody></table></div><h3>Direcciones codificadas</h3><div class="vc19310-scroll"><table><thead><tr><th>Origen → destino</th><th>N</th><th>%</th></tr></thead><tbody>${routeRows||'<tr><td colspan="3">Sin pares explícitos</td></tr>'}</tbody></table></div><p class="vc19311-help">No se infieren zonas ausentes. Los porcentajes de zona utilizan solo acciones con zona conocida, y las direcciones solo los rallies que tienen origen y destino codificados.</p></section>${evidence(rallies,'EVIDENCIA DE ZONAS')}</div>`;
  return {html,rallies};
 }
 // Restricted arithmetic interpreter: no eval, no Function, no arbitrary identifiers.
 function compileFormula(text){
  const expression=val(text).toUpperCase();if(!expression||expression.length>128)throw Error('La fórmula debe contener entre 1 y 128 caracteres.');
  let pos=0,depth=0;const tokens=[];
  while(pos<expression.length){const rem=expression.slice(pos),ws=rem.match(/^\s+/);if(ws){pos+=ws[0].length;continue;}
   const m=rem.match(/^(\d+(?:\.\d+)?|[A-Z_][A-Z0-9_]*|[()+*/-])/);
   if(!m)throw Error('La fórmula contiene símbolos no permitidos.');tokens.push(m[0]);pos+=m[0].length;if(tokens.length>96)throw Error('Fórmula demasiado extensa.');
  }
  let at=0;
  function primary(){const t=tokens[at++];if(!t)throw Error('Fórmula incompleta.');
   if(t==='+'||t==='-'){const fn=primary();return m=>{const n=fn(m);return n==null?null:t==='-'?-n:n;};}
   if(t==='('){if(++depth>20)throw Error('Demasiados paréntesis.');const inner=expr();depth--;if(tokens[at++]!==')')throw Error('Falta cerrar un paréntesis.');return inner;}
   if(/^\d/.test(t)){const n=Number(t);return ()=>n;}
   if(!VARS.includes(t))throw Error('Variable no permitida: '+t+'.');
   return m=>{const n=Number(m[t]);return Number.isFinite(n)?n:0;};
  }
  function term(){let a=primary();while(tokens[at]==='*'||tokens[at]==='/'){
   const op=tokens[at++],b=primary(),left=a;a=m=>{const x=left(m),y=b(m);if(x==null||y==null||(op==='/'&&y===0))return null;const z=op==='*'?x*y:x/y;return Number.isFinite(z)?z:null;};
  }return a;}
  function expr(){let a=term();while(tokens[at]==='+'||tokens[at]==='-'){
   const op=tokens[at++],b=term(),left=a;a=m=>{const x=left(m),y=b(m);if(x==null||y==null)return null;const z=op==='+'?x+y:x-y;return Number.isFinite(z)?z:null;};
  }return a;}
  const fn=expr();if(at!==tokens.length)throw Error('La fórmula tiene operadores o paréntesis sobrantes.');
  return (metrics)=>{const n=fn(metrics);return n!=null&&Number.isFinite(n)?Math.round(n*100)/100:null;};
 }
 function worksheetMetrics(rows){const rated=arr(rows).filter(c=>c.evaluation);
  const count=code=>rated.filter(c=>c.evaluation===code).length;
  return {N:rows.length,EVAL:rated.length,POINT:count('#'),HASH:count('#'),PLUS:count('+'),ERROR:count('='),BLOCKED:count('/'),POSITIVE:count('#')+count('+'),NEGATIVE:count('-')+count('=')+count('/'),NOT_RATED:rows.length-rated.length};
 }
 function worksheetRows(projection,team,ws){
  const base=projection.base,contacts=base.contacts.filter(c=>c.team===team&&(!ws.skill||c.skill===ws.skill));
  const rMap=new Map(base.rallies.map(r=>[r.key,r]));
  const groupKey=c=>ws.group==='skill'?SKILLS[c.skill]||'Sin fundamento':ws.group==='rotation'?((rMap.get(c.rallyKey)?.[team==='ours'?'ownRotation':'rivalRotation'])?'R'+rMap.get(c.rallyKey)[team==='ours'?'ownRotation':'rivalRotation']:'Sin rotación'):c.player||'Sin jugador';
  const groups=new Map();for(const c of contacts){const k=groupKey(c);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);}
  let evaluator=null,error='';try{evaluator=compileFormula(ws.formula);}catch(e){error=e.message;}
  const rows=[...groups].map(([name,list])=>({name,contacts:list,metrics:worksheetMetrics(list),value:evaluator?evaluator(worksheetMetrics(list)):null})).sort((a,b)=>b.metrics.N-a.metrics.N||a.name.localeCompare(b.name,'es',{numeric:true}));
  return {contacts,rows,error,formula:ws.formula,valid:!!evaluator};
 }
 function sanitizePreset(x){if(!x||typeof x.name!=='string'||x.name.length>45)return null;
  const skill=val(x.skill).toUpperCase(),group=val(x.group),formula=val(x.formula);if(skill&&!SKILLS[skill])return null;if(!['player','skill','rotation'].includes(group))return null;
  try{compileFormula(formula);}catch(_){return null;}return {name:x.name.slice(0,45),skill,group,formula};
 }
 function safeStorage(win){try{return win?.localStorage||null;}catch(_){return null;}}
 function readPresets(storage){try{const parsed=JSON.parse(storage?.getItem(PREF_KEY)||'[]');return arr(parsed).slice(0,24).map(sanitizePreset).filter(Boolean);}catch(_){return []}}
 function csvEscape(value){let s=val(value);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function worksheetCSV(data,ws){const head=['Grupo','N','Evaluadas','Valoración #','Positivas #/+','Errores =','Bloqueos /','Fórmula '+ws.formula],rows=data.rows.map(r=>[r.name,r.metrics.N,r.metrics.EVAL,r.metrics.POINT,r.metrics.POSITIVE,r.metrics.ERROR,r.metrics.BLOCKED,r.value==null?'':r.value]);
  return '\ufeff'+[head,...rows].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 function worksheetsView(ctx,projection,state,win){
  const ws=ensureState(state).ws,base=projection.base,data=worksheetRows(projection,ctx.team,ws),all=base.contacts.filter(c=>c.team===ctx.team),presets=readPresets(safeStorage(win)),matching=new Set((ws.focus?data.rows.find(r=>r.name===ws.focus)?.contacts||[]:data.contacts).map(c=>c.rallyKey)),rallies=teamRallies(base,matching);
  const rows=data.rows.map(r=>{const m=r.metrics;return `<tr class="${ws.focus===r.name?'vc19311-selected':''}"><td><button type="button" data-vc19311-ws-focus="${esc(r.name)}">${esc(r.name)}</button></td><td>${m.N}</td><td>${m.EVAL}</td><td>${m.POINT}</td><td>${m.POSITIVE}</td><td>${m.ERROR}</td><td>${m.BLOCKED}</td><td>${num(r.value)}</td></tr>`;}).join('');
  const html=`<div class="vc19311-title"><div><small>CUSTOM WORKSHEETS · PROFESSIONAL</small><h3>Hojas estadísticas configurables</h3><span>Métricas y fórmulas locales calculadas sobre los contactos codificados</span></div><button type="button" data-vc19311-command="ws-export">Exportar hoja CSV</button></div><div class="vc19311-filterbar vc19311-ws-toolbar"><label>Fundamento<select data-vc19311-filter="ws.skill">${optionList(Object.entries(SKILLS).map(([k,n])=>[k,n]),ws.skill)}</select></label><label>Agrupar por<select data-vc19311-filter="ws.group">${optionList([['player','Jugador'],['skill','Fundamento'],['rotation','Rotación']],ws.group,'Agrupación')}</select></label><label>Fórmula personalizada<input type="text" id="vc19311-formula" maxlength="128" value="${esc(ws.formula)}" spellcheck="false" aria-label="Fórmula personalizada"/></label><button type="button" data-vc19311-command="ws-apply">Aplicar fórmula</button></div>
  <div class="vc19311-ws-presets"><label>Plantilla<select data-vc19311-filter="ws.selected"><option value="">Seleccionar plantilla</option>${[...DEFAULTS,...presets].map(p=>`<option value="${esc(p.name)}"${ws.selected===p.name?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button type="button" data-vc19311-command="ws-load">Aplicar plantilla</button><button type="button" data-vc19311-command="ws-save">Guardar hoja</button><button type="button" data-vc19311-command="ws-delete">Eliminar guardada</button><span>${presets.length} plantillas locales guardadas</span></div><p class="vc19311-ws-legend">Variables permitidas: <code>${VARS.join(' · ')}</code>. Usa + − * / y paréntesis; para porcentajes multiplica por 100. Ejemplo: <code>100*(POINT-ERROR-BLOCKED)/EVAL</code>. POINT y HASH cuentan valoraciones #, que no equivalen necesariamente a puntos en todos los fundamentos. La división entre cero produce «—».</p>
  ${data.error?`<p class="vc19311-error" role="alert">${esc(data.error)}</p>`:''}<div class="vc19311-metrics"><div><small>Contactos filtrados</small><strong>${data.contacts.length}</strong></div><div><small>Grupos</small><strong>${data.rows.length}</strong></div><div><small>Evaluadas</small><strong>${data.contacts.filter(c=>c.evaluation).length}</strong></div><div><small>Sin valoración</small><strong>${data.contacts.filter(c=>!c.evaluation).length}</strong></div></div><div class="vc19311-workspace vc19311-ws-layout"><section class="vc19310-panel"><div class="vc19310-panelhead"><strong>HOJA PERSONALIZADA</strong><span>${esc(ws.formula)} · ${data.rows.length} filas</span></div><div class="vc19310-scroll"><table><thead><tr><th>Grupo</th><th>N</th><th>Eval.</th><th>#</th><th>#+</th><th>=</th><th>/</th><th>Fórmula</th></tr></thead><tbody>${rows||'<tr><td colspan="8">No hay contactos para estos filtros</td></tr>'}</tbody></table></div><p class="vc19311-help">Los resultados de la columna Fórmula son valores numéricos. Usa «100*» en la fórmula si deseas un porcentaje. Solo se incluyen contactos registrados, sin completar datos ausentes.</p><div class="vc19310-work-buttons"><button type="button" data-vc19310-legacy-page="players:builder">Hojas anteriores</button><button type="button" data-vc19310-legacy-page="players:sheet">Hoja oficial</button><button type="button" data-vc19310-legacy-page="reports:">Informes Pro</button></div></section>${evidence(rallies,ws.focus?'RALLIES · '+ws.focus:'EVIDENCIA DE LA HOJA')}</div>`;
  return {html,rallies};
 }
 function render({space,ctx,projection,state,win}){
  if(space==='distribution')return distributionView(ctx,projection,state);
  if(space==='court')return courtView(ctx,projection,state);
  if(space==='worksheets')return worksheetsView(ctx,projection,state,win);
  return null;
 }
 function downloadCSV(win,filename,csv){if(!win?.Blob||!win.URL?.createObjectURL)return false;const doc=win.document,blob=new win.Blob([csv],{type:'text/csv;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=filename;doc.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),2000);return true;}
 function handleClick({button,state,node,ctx,projection,win,status}){
  const cmd=button.dataset.vc19311Command,zone=button.dataset.vc19311DistZone,area=button.dataset.vc19311Zone,quad=button.dataset.vc19311Quadrant,path=button.dataset.vc19311Path,focus=button.dataset.vc19311WsFocus;
  if(!cmd&&zone===undefined&&area===undefined&&quad===undefined&&path===undefined&&focus===undefined)return {handled:false};
  const f=ensureState(state);
  if(zone!==undefined){f.dist.target=f.dist.target===zone?'':zone;return {handled:true,repaint:true};}
  if(area!==undefined){f.court.zone=f.court.zone===Number(area)?null:Number(area);f.court.quad='';f.court.path='';return {handled:true,repaint:true};}
  if(quad!==undefined){const [z,q]=quad.split(':');if(f.court.zone===Number(z)&&f.court.quad===q){f.court.zone=null;f.court.quad='';}else{f.court.zone=Number(z);f.court.quad=q;}f.court.path='';return {handled:true,repaint:true};}
  if(path!==undefined){f.court.path=f.court.path===path?'':path;f.court.zone=null;f.court.quad='';return {handled:true,repaint:true};}
  if(focus!==undefined){f.ws.focus=f.ws.focus===focus?'':focus;return {handled:true,repaint:true};}
  if(cmd==='dist-clear'){f.dist={setter:'',reception:'',tempo:'',attacker:'',target:'',combo:''};return {handled:true,repaint:true};}
  if(cmd==='court-clear'){f.court.zone=null;f.court.quad='';f.court.path='';return {handled:true,repaint:true};}
  if(cmd==='ws-apply'){f.ws.formula=val(node.querySelector('#vc19311-formula')?.value).slice(0,128);return {handled:true,repaint:true};}
  if(cmd==='ws-export'){const data=worksheetRows(projection,ctx.team,f.ws);if(!data.valid){status?.(data.error);return {handled:true};}
   const ok=downloadCSV(win,'volley-coach-hoja-v19311.csv',worksheetCSV(data,f.ws));status?.(ok?'Hoja descargada en CSV.':'Exportación no disponible.');return {handled:true};}
  if(cmd==='ws-save'){
   const name=val(win.prompt?.('Nombre de la hoja (máx. 45 caracteres)')).slice(0,45);if(!name)return {handled:true};
   const draft=sanitizePreset({name,skill:f.ws.skill,group:f.ws.group,formula:val(node.querySelector('#vc19311-formula')?.value||f.ws.formula)});
   if(!draft){status?.('La fórmula o los campos de la hoja no son válidos.');return {handled:true};}
   try{const store=safeStorage(win);if(!store)throw Error('No hay almacenamiento local');const presets=readPresets(store).filter(p=>p.name!==name);presets.push(draft);store.setItem(PREF_KEY,JSON.stringify(presets.slice(-24)));f.ws.selected=name;f.ws.formula=draft.formula;status?.('Hoja guardada en este dispositivo.');return {handled:true,repaint:true};}catch(_){status?.('No se pudo guardar esta hoja.');return {handled:true};}
  }
  if(cmd==='ws-load'){const chosen=[...DEFAULTS,...readPresets(safeStorage(win))].find(p=>p.name===f.ws.selected);if(chosen){f.ws.skill=chosen.skill;f.ws.group=chosen.group;f.ws.formula=chosen.formula;f.ws.focus='';return {handled:true,repaint:true};}return {handled:true};}
  if(cmd==='ws-delete'){try{const store=safeStorage(win);if(!store)throw Error('No hay almacenamiento local');store.setItem(PREF_KEY,JSON.stringify(readPresets(store).filter(p=>p.name!==f.ws.selected)));f.ws.selected='';status?.('Plantilla local eliminada.');return {handled:true,repaint:true};}catch(_){status?.('No se pudo eliminar la plantilla.');return {handled:true};}}
  return {handled:false};
 }
 function handleChange({target,state}){
  const key=target?.dataset?.vc19311Filter;if(!key)return false;
  const [section,field]=key.split('.'),s=ensureState(state);if(!s[section]||!(field in s[section]))return false;
  s[section][field]=field==='zone'?Number(target.value):(field==='expanded'?target.value==='true':target.value);
  if(section==='court'&&field!=='expanded'){s.court.zone=null;s.court.quad='';s.court.path='';}
  if(section==='ws'&&field!=='selected')s.ws.focus='';
  return true;
 }
 return {VERSION,PREF_KEY,SKILLS,VARS,DEFAULTS,ensureState,compileFormula,worksheetMetrics,worksheetRows,worksheetCSV,readPresets,sanitizePreset,csvEscape,
  matchChains,distributionModel,courtModel,distributionView,courtView,worksheetsView,render,handleClick,handleChange};
});
