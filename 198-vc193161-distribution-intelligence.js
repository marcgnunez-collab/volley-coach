/* Volley Coach V19.3.16.1 · Distribution Intelligence Pro
 * Data Volley-inspired functional workflows: Consecutive Distribution and Setter Calls.
 * The only source of truth is VC_DATA_ENGINE_1938 (read-only projection of the
 * original scouting). No guessed receptions, attacker positions, scores or paths.
 * Data Project / Data Volley trademarks and artwork are not reproduced.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_DISTRIBUTION_193161=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.16.1',EVALS=new Set(['#','+','!','-','/','=']);
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const pct=(n,d)=>d?Math.round(n*1000/d)/10:null;
 const fmt=v=>v==null?'—':Number(v).toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
 const unique=x=>[...new Set(x.map(val).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
 const safeZone=z=>z&&Number.isInteger(Number(z.zone))&&Number(z.zone)>=1&&Number(z.zone)<=6?Number(z.zone):null;
 const layout=[4,3,2,5,6,1];
 const DEFAULT={mode:'consecutive',phase:'all',setter:'',reception:'',attacker:'',tempo:'',combo:'',call:'',attackType:'',rotation:'',zone:'',group:'zone',callLayout:'both',flip:false,help:false};
 function ensureState(state){if(!state.vc193161)state.vc193161={...DEFAULT};return state.vc193161;}
 function chronology(a,b){return a.set-b.set||a.rallyIndex-b.rallyIndex||a.actionIndex-b.actionIndex;}
 function coverage(entries){return {
  total:entries.length,withAttack:entries.filter(x=>x.attack).length,
  withOrigin:entries.filter(x=>x.attack&&x.attackZone).length,
  withReception:entries.filter(x=>x.phase==='reception'&&x.receptionEval).length,
  withCall:entries.filter(x=>x.callCode).length,
  withoutCall:entries.filter(x=>!x.callCode).length,
  withSetter:entries.filter(x=>x.setter).length,
  withTime:entries.filter(x=>x.scoutMs!==null).length
 };}
 /* One E is linked to at most one next A by the canonical engine. To classify
    phase, inspect ONLY contacts after the preceding E/A in the same possession.
    A prior reception in the same rally is not necessarily a preceding reception. */
 function preceding(setter,possessions){
  const p=possessions.get(setter?.possessionKey);if(!p)return {phase:'unknown',reception:null};
  const index=p.contacts.findIndex(c=>c.key===setter.key);if(index<0)return {phase:'unknown',reception:null};
  const before=p.contacts.slice(0,index);let boundary=-1;
  for(let i=before.length-1;i>=0;i--)if(['E','A'].includes(before[i].skill)){boundary=i;break;}
  const relevant=before.slice(boundary+1);
  for(let i=relevant.length-1;i>=0;i--){
   if(relevant[i].skill==='R')return {phase:'reception',reception:relevant[i]};
   if(relevant[i].skill==='D')return {phase:'transition',reception:null};
  }
  return {phase:'unknown',reception:null};
 }
 function makeEntries(projection,team){
  const base=projection?.base;if(!base)return [];
  const rallies=new Map(arr(base.rallies).map(r=>[r.key,r]));
  const possessions=new Map(arr(base.possessions).map(p=>[p.key,p]));
  return arr(base.chains).filter(c=>c.team===team&&rallies.has(c.rallyKey)).map(c=>{
   const r=rallies.get(c.rallyKey),before=preceding(c.setter,possessions);
   // The shared model pairs E with the first A before the next E. Guard an
   // intervening new reception (R): it indicates a distinct attacking phase
   // and must not be presented as the immediate outcome of this set.
   const possession=possessions.get(c.possessionKey),contacts=arr(possession?.contacts);
   const si=contacts.findIndex(x=>x.key===c.setter?.key),ai=contacts.findIndex(x=>x.key===c.attack?.key);
   const interrupted=si>=0&&ai>si&&contacts.slice(si+1,ai).some(x=>x.skill==='R'||x.skill==='E');
   const attack=interrupted?null:(c.attack||null);
   const ownRotation=team==='ours'?r.ownRotation:r.rivalRotation;
   const start=safeZone(attack?.fields?.startZone),target=safeZone(c.setter?.fields?.setTarget);
   const evaluation=EVALS.has(attack?.evaluation)?attack.evaluation:'';
   return {key:c.key,rallyKey:c.rallyKey,set:r.set,rallyIndex:r.index,actionIndex:c.setter?.actionIndex??0,rotation:ownRotation,
    team,phase:before.phase,receptionEval:EVALS.has(before.reception?.evaluation)?before.reception.evaluation:'',
    receptionCode:before.reception?.code||'',receptionPlayer:before.reception?.player||'',
    setter:c.setter?.player||'',setterCode:c.setter?.code||'',setterTarget:target,tempo:val(c.tempo),
    callCode:val(c.setter?.fields?.setterCall).toUpperCase(),combo:val(c.combo),
    attackType:['F','C','B','P','S'].includes(val(attack?.fields?.dvSetType||c.setter?.fields?.dvSetType).toUpperCase())?val(attack?.fields?.dvSetType||c.setter?.fields?.dvSetType).toUpperCase():'',
    attack,attackCode:attack?.code||'',attacker:attack?.player||'',attackEval:evaluation,
    attackZone:start,attackQuadrant:attack?.fields?.startZone?.quadrant||'',
    scoutMs:Number.isFinite(c.setter?.scoutMs)?c.setter.scoutMs:null,
    scoreAfter:r.scoreAfter||null,serving:r.serving,winner:r.winner,stableRally:!!r.nativeId};
  }).sort(chronology);
 }
 function select(entries,filters={}){
  const f={...DEFAULT,...filters};
  return arr(entries).filter(e=>(!f.phase||f.phase==='all'||e.phase===f.phase)
   &&(!f.setter||e.setter===f.setter)&&(!f.reception||e.receptionEval===f.reception)
   &&(!f.attacker||e.attacker===f.attacker)&&(!f.tempo||e.tempo===f.tempo)
   &&(!f.combo||e.combo===f.combo)&&(!f.call||e.callCode===f.call)&&(!f.attackType||e.attackType===f.attackType)
   &&(!f.rotation||(f.rotation==='unknown'?e.rotation==null:Number(e.rotation)===Number(f.rotation)))
   &&(!f.zone||(f.group==='setterTarget'?e.setterTarget:e.attackZone)===Number(f.zone)));
 }
 function metrics(list){
  const source=arr(list),attacks=source.filter(e=>e.attack),rated=attacks.filter(e=>EVALS.has(e.attackEval));
  const kills=rated.filter(e=>e.attackEval==='#').length,errors=rated.filter(e=>e.attackEval==='=').length,blocked=rated.filter(e=>e.attackEval==='/').length;
  return {n:source.length,attack:attacks.length,rated:rated.length,kills,errors,blocked,
   kill:pct(kills,rated.length),eff:pct(kills-errors-blocked,rated.length)};
 }
 function group(entries,fn){const map=new Map();for(const e of entries){const key=val(fn(e))||'Sin codificar';if(!map.has(key))map.set(key,[]);map.get(key).push(e);}
  return [...map].map(([key,list])=>({key,list,metrics:metrics(list)})).sort((a,b)=>b.list.length-a.list.length||a.key.localeCompare(b.key,'es',{numeric:true}));}
 function readScore(score,team){if(!score)return null;const a=score.us,b=score.opponent;if(![a,b].every(x=>Number.isInteger(Number(x))&&Number(x)>=0&&val(x)!==''))return null;
  return team==='ours'?`${a}–${b}`:`${b}–${a}`;}
 function options(values,current,label='Todos'){return `<option value="">${esc(label)}</option>`+values.map(x=>{const a=Array.isArray(x)?x:[x,x];return `<option value="${esc(a[0])}"${val(a[0])===val(current)?' selected':''}>${esc(a[1])}</option>`;}).join('');}
 function selectTag(name,key,values,f,label='Todos'){return `<label>${esc(name)}<select data-vc193161-filter="${esc(key)}">${options(values,f[key],label)}</select></label>`;}
 const phaseLabel=x=>x==='reception'?'Tras recepción':x==='transition'?'Transición tras defensa':'Fase no identificada';
 function dateShort(ms){if(ms==null)return '—';const sec=Math.floor(ms/1000);return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
 function itemHTML(e){const score=readScore(e.scoreAfter,e.team),attack=e.attack;
  return `<button type="button" data-vc19310-rally="${esc(e.rallyKey)}" class="vc193161-hit" title="Seleccionar el rally original; pulsa Abrir vídeo si tiene grabación" aria-label="Set ${e.set} rally ${e.rallyIndex} ataque ${esc(e.attackEval||'sin valoración')}">
   <span class="vc193161-hit-head"><b>S${e.set} · #${e.rallyIndex}</b><small>${esc(dateShort(e.scoutMs))}</small></span>
   <span class="vc193161-hit-meta">${esc(e.receptionEval?'R'+e.receptionEval:'R—')} · ${esc(e.setter||'E—')} → ${esc(e.attacker||'A—')}</span>
   <span class="vc193161-hit-bottom"><span>${esc(e.attackZone?'Z'+e.attackZone:'Z?')}${e.combo?' · '+esc(e.combo):''}</span><strong class="vc193161-grade">${esc(attack?(e.attackEval||'s/v'):'sin A')}</strong><small>${esc(score||'marcador —')}</small></span>
  </button>`;
 }
 function consecutive(entries,f){
  const series=[1,2,3,4,5,6].map(rotation=>({rotation,list:entries.filter(e=>e.rotation===rotation)}));
  const unidentified=entries.filter(e=>e.rotation==null);
  const sections=series.concat(unidentified.length?[{rotation:null,list:unidentified}]:[]).filter(row=>!f.rotation||Number(row.rotation)===Number(f.rotation));
  return `<section class="vc193161-seq"><header class="vc193161-band"><div><strong>DISTRIBUCIÓN CONSECUTIVA · PUNTO A PUNTO</strong><small>Orden real por set, rally y contacto · filas vinculadas al scouting</small></div><span>${entries.length} colocaciones</span></header>
   <div class="vc193161-seq-grid">${sections.map(({rotation,list})=>{const m=metrics(list);return `<article class="vc193161-rotation"><div class="vc193161-rotation-head"><button type="button" data-vc193161-rotation="${rotation||'unknown'}" aria-label="${rotation?'Filtrar rotación P'+rotation:'Mostrar rotaciones desconocidas'}"><strong>${rotation?'P'+rotation:'Rot. ?'}</strong></button><span><b>${m.n}</b> E · ${m.attack} A</span></div>
    <div class="vc193161-tiny"><span>Kill ${fmt(m.kill)}</span><span>EFF ${fmt(m.eff)}</span><small>${m.rated} val.</small></div><div class="vc193161-scrollhits">${list.slice(-100).map(itemHTML).join('')||'<p class="vc193161-empty">Sin secuencias registradas.</p>'}</div>${list.length>100?`<p class="vc193161-hint">Últimas 100 de ${list.length}. Los totales usan todas las acciones.</p>`:''}</article>`;}).join('')}</div></section>`;
 }
 const COURT_POS={4:[.165,.29],3:[.5,.29],2:[.835,.29],5:[.165,.64],6:[.5,.64],1:[.835,.64]};
 function court(entries,filters={},small=false){
  const mode=filters.group==='setterTarget'?'setterTarget':'attackZone',good=entries.filter(e=>mode==='setterTarget'?e.setterTarget:e.attack&&e.attackZone),tot=good.length;
  const byZone=new Map(layout.map(z=>[z,good.filter(e=>(mode==='setterTarget'?e.setterTarget:e.attackZone)===z)]));
  const current=filters.zone||'',max=Math.max(1,...[...byZone.values()].map(x=>x.length));
  const mirror=!!filters.flip;
  const paths=layout.filter(z=>byZone.get(z).length).map((z,i)=>{
   const end=COURT_POS[z],X=Math.round(end[0]*600),Y=Math.round(end[1]*370),cx=300+(X-300)*.35,cy=Math.min(210,Y+65);const n=byZone.get(z).length;
   return `<path d="M300 332 Q${Math.round(cx)} ${Math.round(cy)} ${X} ${Y}" stroke="${i===0?'#f18a3d':'#236eb6'}" stroke-width="${Math.min(13,2+n/Math.max(1,tot)*18)}" fill="none" marker-end="url(#vc193161-arr)" opacity=".84"/>`;
  }).join('');
  return `<div class="vc193161-court ${small?'is-mini':''}" data-court="${esc(mode)}"><div class="vc193161-net">RED · ${mode==='setterTarget'?'DESTINO EXPLÍCITO DE COLOCACIÓN':'ORIGEN EXPLÍCITO DE ATAQUE'}</div><div class="vc193161-court-board ${mirror?'is-flipped':''}"><div class="vc193161-zonegrid">${layout.map(z=>{const n=byZone.get(z).length;return `<button type="button" data-vc193161-zone="${z}" aria-pressed="${String(current===String(z))}" class="${String(current)===String(z)?'is-selected':''}" style="--heat:${(.07+n/max*.38).toFixed(3)}"><b>Z${z}</b><strong>${n||'—'}</strong><span>${fmt(pct(n,tot))}</span></button>`;}).join('')}</div><svg class="vc193161-arrows" viewBox="0 0 600 370" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="vc193161-arr" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#236eb6"/></marker></defs>${paths}</svg><div class="vc193161-hub">E</div></div><p class="vc193161-hint">${tot} acciones con ${mode==='setterTarget'?'destino E':'origen A'} codificado · ${entries.length-tot} sin ese dato. Flechas = frecuencia esquemática, nunca trayectorias reales.</p></div>`;
 }
 function breakdown(entries,kind,filters){const metric=kind==='zone'?e=>e.attack&&e.attackZone?'Z'+e.attackZone:'Sin origen A':kind==='setterTarget'?e=>e.setterTarget?'Z'+e.setterTarget:'Sin destino E':kind==='attacker'?e=>e.attacker||'Sin atacante':e=>e.combo||'Sin combinación';
  const groups=group(entries,metric);return `<div class="vc193161-table"><table><thead><tr><th>${kind==='attacker'?'Atacante':kind==='zone'?'Origen ataque':kind==='setterTarget'?'Destino colocación':'Combinación'}</th><th>E</th><th>Uso</th><th>A val.</th><th>Kill</th><th>EFF</th></tr></thead><tbody>${groups.map(g=>{let filter='';const z=g.key.match(/^Z([1-6])$/);if(z&&(kind==='zone'||kind==='setterTarget'))filter=`data-vc193161-zone="${z[1]}"`;else if(kind==='attacker'&&g.key!=='Sin atacante')filter=`data-vc193161-attacker="${esc(g.key)}"`;else if(kind==='combo'&&g.key!=='Sin combinación')filter=`data-vc193161-combo="${esc(g.key)}"`;
   return `<tr><td>${filter?`<button type="button" ${filter}>${esc(g.key)}</button>`:esc(g.key)}</td><td>${g.metrics.n}</td><td>${fmt(pct(g.metrics.n,entries.length))}</td><td>${g.metrics.rated}/${g.metrics.attack}</td><td>${fmt(g.metrics.kill)}</td><td>${fmt(g.metrics.eff)}</td></tr>`;}).join('')||'<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table></div>`;}
 const DV_TYPES=[['F','Delantero / Front'],['C','Central / Middle'],['B','Zaguero / Back'],['P','Pipe'],['S','Ataque del colocador']];
 function attackTypes(entries){const withType=entries.filter(e=>e.attackType),total=withType.length;
  return `<div class="vc193161-call-types"><h4>Opciones ofensivas explícitas (F / C / B / P / S)</h4><div class="vc193161-types">${DV_TYPES.map(([key,label])=>{const n=withType.filter(e=>e.attackType===key).length;return `<button type="button" data-vc193161-type="${key}" aria-label="${esc(label)}: ${n} acciones"><strong>${key}</strong><b>${n}</b><small>${fmt(pct(n,total))}</small></button>`;}).join('')}</div><p class="vc193161-hint">${total} ataques con tipo F/C/B/P/S codificado; ${entries.length-total} sin ese detalle. No se asigna un tipo basándose solo en la zona de ataque.</p></div>`;}
 function callsView(entries,filters){
  const calls=group(entries,e=>e.callCode||'Sin llamada'),known=entries.filter(e=>e.callCode),grouped=group(known,e=>e.callCode),showCombined=filters.callLayout==='both'||filters.callLayout==='combined',showIndividual=filters.callLayout==='both'||filters.callLayout==='perCall';
  return `<section class="vc193161-calls"><div class="vc193161-band"><div><strong>DISTRIBUCIÓN POR LLAMADAS DEL COLOCADOR</strong><small>Llamadas K registradas en la acción E · agrupadas por llamada, zona y atacante</small></div><span>${known.length}/${entries.length} con llamada</span></div>
   <div class="vc193161-call-main">${showCombined?`<article class="vc193161-card"><h4>Conjunto de llamadas codificadas</h4>${court(known,filters)}${attackTypes(known)}${breakdown(known,filters.group==='setterTarget'?'setterTarget':'zone',filters)}</article>`:''}<article class="vc193161-card"><h4>Llamadas registradas</h4><div class="vc193161-table"><table><thead><tr><th>Llamada</th><th>E</th><th>Uso</th><th>A</th><th>EFF</th></tr></thead><tbody>${calls.map(g=>`<tr><td>${g.key!=='Sin llamada'?`<button type="button" data-vc193161-call="${esc(g.key)}">${esc(g.key)}</button>`:esc(g.key)}</td><td>${g.metrics.n}</td><td>${fmt(pct(g.metrics.n,entries.length))}</td><td>${g.metrics.attack}</td><td>${fmt(g.metrics.eff)}</td></tr>`).join('')}</tbody></table></div><p class="vc193161-hint">Sin llamada no se asigna a K0 ni a un código predeterminado. Los movimientos de los centrales solo se pueden dibujar si se registran explícitamente.</p></article></div>
   ${showIndividual?`<div class="vc193161-call-grids">${grouped.slice(0,24).map(g=>`<article class="vc193161-call-card"><div><button type="button" data-vc193161-call="${esc(g.key)}"><strong>${esc(g.key)}</strong></button><span>${g.metrics.n} · EFF ${fmt(g.metrics.eff)}</span></div>${court(g.list,filters,true)}</article>`).join('')||'<p class="vc193161-empty">No se han codificado llamadas del colocador. Añádelas desde Scouting Editor Pro.</p>'}</div>`:''}
   <p class="vc193161-hint">El catálogo de movimientos/recorridos del central de Data Volley no está contenido en estos contactos; no se crean dibujos ficticios. Selecciona una llamada o zona para acceder a sus rallies.</p></section>`;
 }
 function evidence(rallies){return `<aside class="vc19310-panel vc19310-evidence vc193161-evidence"><div class="vc19310-panelhead"><strong>RALLIES DE LA SELECCIÓN</strong><span>${rallies.length} jugadas</span></div><div class="vc19310-rallies">${rallies.slice(-100).reverse().map(r=>`<button type="button" class="vc19310-rally" data-vc19310-rally="${esc(r.key)}"><b>S${r.set} · #${r.index}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin resultado'} · ${r.serving==='ours'?'Saque propio':r.serving==='opponent'?'Saque rival':'Saque —'}</span></button>`).join('')||'<p class="vc193161-hint">Ningún rally coincide con los filtros.</p>'}</div><div class="vc19310-video-box"><p data-vc19310-detail>Selecciona un rally para consultar sus acciones y el vídeo asociado.</p><button type="button" data-vc19310-command="play" disabled>Abrir rally en vídeo</button><button type="button" data-vc193161-action="video-workspace">Ir a Video Analysis</button></div></aside>`;}
 function guidance(){return `<details class="vc193161-guide"><summary>Guía rápida · ¿cómo funciona este análisis?</summary><ol><li>Selecciona un partido, equipo, set y fase en los filtros generales de Análisis.</li><li>En <b>Consecutiva</b>, compara P1–P6 y lee cada ataque en orden real. La letra R indica calidad de recepción previa solo cuando existe un contacto R comprobable.</li><li>Elige colocador, calidad R, tempo y rotación. Pulsa una acción para mostrar su rally original y abrir el vídeo si existe.</li><li>En <b>Llamadas</b>, examina códigos K explícitos y los ataques asociados. Agrupa por origen del ataque, o por destino E si está codificado.</li><li>Las acciones sin campo de origen, llamada o valoración quedan identificadas como incompletas; los porcentajes usan denominadores visibles.</li><li>Para corregir un dato, entra en Scouting Editor Pro, guarda y vuelve a actualizar Análisis. No edites resultados desde esta vista.</li></ol><p>Manual extendido incluido: GUIA_DISTRIBUTION_INTELLIGENCE_V19.3.16.1.md.</p></details>`;}
 function filtersHtml(entries,f){const o=unique(entries.map(e=>e.setter)),a=unique(entries.map(e=>e.attacker)),tempo=unique(entries.map(e=>e.tempo)),combo=unique(entries.map(e=>e.combo)),calls=unique(entries.map(e=>e.callCode));
  return `<div class="vc193161-tabs" role="group" aria-label="Tipo de distribución">${[['consecutive','Distribución consecutiva'],['calls','Llamadas del colocador']].map(([k,t])=>`<button type="button" data-vc193161-mode="${k}" aria-pressed="${f.mode===k}" class="${f.mode===k?'is-current':''}">${t}</button>`).join('')}</div>
   <div class="vc193161-toolbar">${selectTag('Rotación','rotation',[...[1,2,3,4,5,6].map(x=>[String(x),'P'+x]),['unknown','Rotación desconocida']],f)}${selectTag('Tipo de secuencia','phase',[['reception','Tras recepción'],['transition','Tras defensa (transición)'],['unknown','Sin fase identificable']],f,'Todas')}
   ${selectTag('Colocador','setter',o,f)}${selectTag('Calidad recepción','reception',['#','+','!','-','/','='],f)}${selectTag('Tempo E','tempo',tempo,f)}${selectTag('Atacante','attacker',a,f)}${selectTag('Combinación','combo',combo,f)}${selectTag('Llamada K','call',calls,f)}${selectTag('Tipo F/C/B/P/S','attackType',DV_TYPES,f)}
   <button type="button" data-vc193161-action="clear">Limpiar filtros</button></div>`;
 }
 function render({space,ctx,projection,state}){
  if(space!=='distribution')return null;
  const f=ensureState(state),all=makeEntries(projection,ctx.team),selected=select(all,f),cov=coverage(selected),stat=metrics(selected);
  const allByRally=new Map(arr(projection.base.rallies).map(r=>[r.key,r]));
  const keys=new Set(selected.map(e=>e.rallyKey));const rallies=[...keys].map(k=>allByRally.get(k)).filter(Boolean);
  const config=`<div class="vc193161-options">${selectTag('Agrupar pista','group',[['zone','Origen del ataque'],['setterTarget','Destino de colocación']],f)}${f.mode==='calls'?selectTag('Vista de llamadas','callLayout',[['both','Conjunta + por llamada'],['combined','Pista conjunta'],['perCall','Pistas individuales']],f):''}<label class="vc193161-check"><input type="checkbox" data-vc193161-toggle="flip" ${f.flip?'checked':''}/> Girar pista 180°</label><button type="button" data-vc193161-action="export">Exportar secuencias CSV</button><button type="button" data-vc193161-action="guide">${f.help?'Ocultar':'Mostrar'} ayuda</button></div>`;
  const html=`<div class="vc193161-root"><div class="vc193161-head"><div><small>V${VERSION} · DISTRIBUTION INTELLIGENCE PRO</small><h3>Distribución táctica del colocador</h3><p>Flujo de análisis inspirado en Data Volley 4; solo acciones verificables del scouting actual.</p></div><span class="vc193161-readonly">SOLO LECTURA · DATOS REALES</span></div>
   ${filtersHtml(all,f)}${config}<div class="vc193161-metrics"><div><small>Colocaciones</small><strong>${stat.n}</strong><span>${all.length} antes del filtro local</span></div><div><small>Ataques relacionados</small><strong>${stat.attack}</strong><span>${cov.withOrigin} con origen A</span></div><div><small>Kill de ataque</small><strong>${fmt(stat.kill)}</strong><span>${stat.kills}/${stat.rated} evaluados</span></div><div><small>Eficiencia ofensiva</small><strong>${fmt(stat.eff)}</strong><span>(# − = − /) / ${stat.rated} evaluados</span></div><div><small>Llamadas explícitas</small><strong>${cov.withCall}</strong><span>${cov.withoutCall} sin codificar</span></div></div>
   <div class="vc193161-main"><div class="vc193161-content">${f.mode==='consecutive'?consecutive(selected,f):callsView(selected,f)}<div class="vc193161-bottom"><article class="vc193161-card"><h4>${f.group==='setterTarget'?'Distribución por destino de E':'Distribución por origen real de A'}</h4>${court(selected,f)}${breakdown(selected,f.group==='setterTarget'?'setterTarget':'zone',f)}</article><article class="vc193161-card"><h4>Detalle de atacantes y combinaciones</h4>${breakdown(selected,'attacker',f)}${breakdown(selected,'combo',f)}</article></div>${f.help?guidance():''}<p class="vc193161-disclaimer">No se atribuyen contactos a otro equipo ni se infieren trayectorias, llamada K, origen de ataque, calidad de recepción o marcador. El movimiento del central requiere un catálogo de recorridos codificados que no está en este archivo.</p></div>${evidence(rallies)}</div></div>`;
  return {html,rallies};
 }
 function csvEscape(x){let s=val(x);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function toCSV(entries){const head=['Set','Rally','Rotacion','Equipo','Fase comprobada','Colocador','Codigo E','Llamada K','Destino E','Tempo','Recepcion','Codigo R','Atacante','Codigo A','Origen A','Combinacion','Tipo F/C/B/P/S','Valoracion A','Marca scouting ms','Resultado registrado'];
  const rows=entries.map(e=>[e.set,e.rallyIndex,e.rotation||'',e.team,e.phase,e.setter,e.setterCode,e.callCode,e.setterTarget?'Z'+e.setterTarget:'',e.tempo,e.receptionEval,e.receptionCode,e.attacker,e.attackCode,e.attackZone?'Z'+e.attackZone+(e.attackQuadrant||''):'',e.combo,e.attackType,e.attackEval,e.scoutMs??'',e.winner||'']);
  return '\ufeff'+[head,...rows].map(line=>line.map(csvEscape).join(';')).join('\r\n');}
 function exportCSV(win,data,filename){if(!win?.Blob||!win.URL?.createObjectURL)return false;const blob=new win.Blob([data],{type:'text/csv;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=win.document.createElement('a');a.href=url;a.download=filename;win.document.body.appendChild(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1500);return true;}
 function handleClick({button,state,ctx,projection,win,status}){
  const ds=button?.dataset||{},f=ensureState(state),mode=ds.vc193161Mode,cmd=ds.vc193161Action,zone=ds.vc193161Zone,rotation=ds.vc193161Rotation,call=ds.vc193161Call,attacker=ds.vc193161Attacker,combo=ds.vc193161Combo,attackType=ds.vc193161Type;
  if(![mode,cmd,zone,rotation,call,attacker,combo,attackType].some(x=>x!==undefined))return {handled:false};
  if(mode!==undefined){if(['consecutive','calls'].includes(mode))f.mode=mode;f.zone='';return {handled:true,repaint:true};}
  if(zone!==undefined){f.zone=f.zone===zone?'':zone;return {handled:true,repaint:true};}
  if(rotation!==undefined){f.rotation=f.rotation===rotation?'':rotation;return {handled:true,repaint:true};}
  if(call!==undefined){f.call=f.call===call?'':call;return {handled:true,repaint:true};}
  if(attacker!==undefined){f.attacker=f.attacker===attacker?'':attacker;return {handled:true,repaint:true};}
  if(combo!==undefined){f.combo=f.combo===combo?'':combo;return {handled:true,repaint:true};}
  if(attackType!==undefined){f.attackType=f.attackType===attackType?'':attackType;return {handled:true,repaint:true};}
  if(cmd==='clear'){Object.assign(f,{...DEFAULT,mode:f.mode});return {handled:true,repaint:true};}
  if(cmd==='guide'){f.help=!f.help;return {handled:true,repaint:true};}
  if(cmd==='video-workspace'){win?.VC_PRO_ANALYSIS_19310_STATE?.show?.('video');return {handled:true};}
  if(cmd==='export'){
   const records=select(makeEntries(projection,ctx.team),f),out=exportCSV(win,toCSV(records),'volley-coach-distribution-v19.3.16.1.csv');
   status?.(out?'Distribución exportada a CSV.':'No se pudo exportar el archivo CSV.');return {handled:true};
  }
  return {handled:false};
 }
 function handleChange({target,state}){const k=target?.dataset?.vc193161Filter,toggle=target?.dataset?.vc193161Toggle;
  if(k===undefined&&toggle===undefined)return false;const f=ensureState(state);
  if(k!==undefined&&Object.prototype.hasOwnProperty.call(DEFAULT,k)){
   f[k]=target.value;
   if(k==='group')f.zone='';
  }else if(toggle==='flip')f.flip=!!target.checked;
  return true;
 }
 return Object.freeze({VERSION,DEFAULT,ensureState,preceding,makeEntries,select,metrics,group,coverage,readScore,consecutive,court,callsView,toCSV,render,handleClick,handleChange});
});
