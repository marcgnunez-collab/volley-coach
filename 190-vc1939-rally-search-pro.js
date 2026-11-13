/* Volley Coach V19.3.9 · Rally Search Pro
 * Read-only multi-criteria rally search using VC_DATA_ENGINE_1938 canonical
 * rally/contact/possession projections. No new scouting or cloud persistence.
 * All selected evidence is resolved back to original match/set/rally IDs.
 */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_RALLY_SEARCH_1939=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.9',STORAGE_KEY='vc1939:search-presets:1';
 const val=x=>String(x??'').trim();
 const arr=x=>Array.isArray(x)?x:[];
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lc=x=>val(x).toLocaleLowerCase('es');
 const validTeam=t=>t==='ours'||t==='opponent'?t:null;
 const option=(x,label=x)=>`<option value="${esc(x)}">${esc(label)}</option>`;
 const FILTERS=['code','skill','player','evaluation','ownRotation','rivalRotation','reception','setter','attacker','tempo','combo','startZone','endZone','outcome','video','status'];
 const skillLabels={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const selectors={
  skill:[['','Todos los fundamentos'],...Object.entries(skillLabels)],
  evaluation:[['','Todas las valoraciones'],...['#','+','!','-','/','='].map(x=>[x,x])],
  ownRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
  rivalRotation:[['','Todas'],...[1,2,3,4,5,6].map(x=>[String(x),'R'+x])],
  reception:[['','Cualquier recepción'],...['#','+','!','-','/','='].map(x=>[x,x])],
  outcome:[['','Todos'],['ours','Punto nuestro'],['opponent','Punto rival']],
  video:[['','Todos'],['yes','Con marca de vídeo'],['no','Sin marca de vídeo']],
  status:[['closed','Solo cerrados'],['all','Cerrados y abiertos'],['open','Solo abiertos']]
 };
 const normFilters=f=>Object.fromEntries(FILTERS.map(k=>[k,val(f?.[k]).slice(0,k==='code'?100:80)]));
 function query(data,filters={}){
  const f=normFilters(filters),target=validTeam(filters.team),set=val(filters.set),rotation=val(filters.rotation),phase=val(filters.phase).toUpperCase();
  const code=lc(f.code),actionRequired=!!(code||f.skill||f.player||f.evaluation||f.startZone||f.endZone||f.video);
  const chainRequired=!!(f.setter||f.attacker||f.tempo||f.combo);
  const sequenceRequired=chainRequired||!!f.reception;
  const selectedRallies=[],contactByKey=new Map(),chainByKey=new Map();
  const chainsByRally=new Map();for(const chain of arr(data?.chains)){if(!chainsByRally.has(chain.rallyKey))chainsByRally.set(chain.rallyKey,[]);chainsByRally.get(chain.rallyKey).push(chain)}
  const checkContact=c=>c&&(!target||c.team===target)&&(!f.skill||c.skill===f.skill)&&(!f.evaluation||c.evaluation===f.evaluation)&&
   (!f.player||lc(c.player)===lc(f.player))&&(!code||[c.code,c.skillRaw,c.fields?.attackCode,c.fields?.specialCode,c.fields?.startZone?.code,c.fields?.endZone?.code,c.fields?.setTarget?.code,c.fields?.contactZone?.code,c.fields?.combo,c.fields?.direction].some(s=>lc(s).includes(code)))&&
   (!f.startZone||c.fields?.startZone?.code===f.startZone.toUpperCase().replace(/^([^Z])/, 'Z$1'))&&
   (!f.endZone||c.fields?.endZone?.code===f.endZone.toUpperCase().replace(/^([^Z])/, 'Z$1'))&&
   (!f.video||(f.video==='yes'?!!c.video:!c.video));
  const chainMatches=c=>c&&(!target||c.team===target)&&(!f.setter||lc(c.setter?.player)===lc(f.setter))&&
   (!f.attacker||lc(c.attack?.player)===lc(f.attacker))&&
   (!f.tempo||lc(c.tempo||c.attack?.fields?.attackTempo)===lc(f.tempo))&&
   (!f.combo||lc(c.combo)===lc(f.combo))&&(!f.reception||c.reception?.evaluation===f.reception);
  for(const r of arr(data?.rallies)){
   if(f.status!=='all'&&((f.status==='open')!==!r.closed))continue;
   if(set&&String(r.set)!==set)continue;
   if(f.ownRotation&&String(r.ownRotation||'')!==f.ownRotation)continue;
   if(f.rivalRotation&&String(r.rivalRotation||'')!==f.rivalRotation)continue;
   if(rotation&&String((target==='opponent'?r.rivalRotation:r.ownRotation)||'')!==rotation)continue;
   if(phase){if(!target||!r.serving)continue;const actual=r.serving===target?'K2':'K1';if(actual!==phase)continue;}
   if(f.outcome&&r.winner!==f.outcome)continue;
   const inTeam=r.contacts.filter(c=>!target||c.team===target);
   const matchedChains=(chainsByRally.get(r.key)||[]).filter(chainMatches);
   let candidates;
   if(sequenceRequired){
    const allowedKeys=new Set();
    for(const chain of matchedChains){for(const c of [chain.reception,chain.setter,chain.attack])if(c)allowedKeys.add(c.key)}
    // A reception-only query can find receptions even if no setter follows.
    if(f.reception&&!chainRequired)for(const c of inTeam)if(c.skill==='R'&&c.evaluation===f.reception)allowedKeys.add(c.key);
    const possessionKeys=new Set([...matchedChains.map(c=>c.possessionKey)]);
    if(f.reception&&!chainRequired)for(const c of inTeam)if(c.skill==='R'&&c.evaluation===f.reception&&c.possessionKey)possessionKeys.add(c.possessionKey);
    // For mixed contact + sequence criteria, match one contact that belongs to the
    // matched possession; if a specific contact type is selected, check it directly.
    candidates=inTeam.filter(c=>possessionKeys.has(c.possessionKey)&&(!actionRequired||checkContact(c))&&
     (!actionRequired||!f.skill||allowedKeys.has(c.key)));
    if(!actionRequired)candidates=inTeam.filter(c=>allowedKeys.has(c.key));
   }else candidates=inTeam.filter(checkContact);
   if((actionRequired||sequenceRequired)&&!candidates.length)continue;
   selectedRallies.push(r);
   for(const c of candidates)contactByKey.set(c.key,c);
   for(const chain of matchedChains)if(!actionRequired||candidates.some(c=>c.possessionKey&&c.possessionKey===chain.possessionKey))chainByKey.set(chain.key,chain);
  }
  const contacts=[...contactByKey.values()],chains=[...chainByKey.values()];
  const bySkill=new Map(),byPlayer=new Map();
  for(const c of contacts){const skill=c.skill||'?',player=c.player||'Sin identificar';bySkill.set(skill,(bySkill.get(skill)||0)+1);byPlayer.set(player,(byPlayer.get(player)||0)+1)}
  const ratedAttacks=contacts.filter(c=>c.skill==='A'&&c.evaluation),kills=ratedAttacks.filter(c=>c.evaluation==='#').length,
   errors=ratedAttacks.filter(c=>c.evaluation==='=').length,blocked=ratedAttacks.filter(c=>c.evaluation==='/').length;
  const eff=ratedAttacks.length?Math.round((kills-errors-blocked)/ratedAttacks.length*1000)/10:null;
  const statistics={rallies:selectedRallies.length,contacts:contacts.length,chains:chains.length,videoContacts:contacts.filter(c=>c.video).length,
   missingEvaluation:contacts.filter(c=>!c.evaluation).length,attackRated:ratedAttacks.length,kills,errors,blocked,efficiency:eff,
   bySkill:[...bySkill].sort((a,b)=>b[1]-a[1]),byPlayer:[...byPlayer].sort((a,b)=>b[1]-a[1])};
  return {rallies:selectedRallies,contacts,chains,statistics,filters:f,target,matchId:val(data?.matchId)};
 }
 function csvEscape(x){let s=val(x);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function toCSV(result){const header=['Partido','Set','Rally','ID rally','Índice acción','ID acción','Equipo','Jugador','Fundamento','Código','Evaluación','Zona origen','Zona destino','Posesión','Vídeo'];
  const match=new Map(result.rallies.map(r=>[r.key,r]));
  const records=result.contacts.map(c=>{const r=match.get(c.rallyKey);return [result.matchId,c.set,c.rallyIndex,r?.nativeId||'',c.actionIndex+1,c.nativeId||'',c.team||'',c.player||'',c.skill||c.skillRaw,c.code,c.evaluation||'',c.fields?.startZone?.code||'',c.fields?.endZone?.code||'',c.possessionKey||'',c.video?'Sí':'No']});
  return '\ufeff'+[header,...records].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 function readPresets(storage){try{const list=JSON.parse(storage?.getItem(STORAGE_KEY)||'[]');return arr(list).filter(x=>x&&typeof x.name==='string'&&x.name.length<=40&&x.filters&&typeof x.filters==='object').slice(-15).map(x=>({name:x.name,filters:normFilters(x.filters)}));}catch(_){return []}}
 function catalog(data){const unique=(values)=>[...new Set(values.map(val).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).slice(0,250);
  const contacts=arr(data?.contacts),chains=arr(data?.chains);
  return {players:unique(contacts.map(x=>x.player)),setters:unique(chains.map(x=>x.setter?.player)),attackers:unique(chains.map(x=>x.attack?.player)),
   tempos:unique(chains.map(x=>x.tempo||x.attack?.fields?.attackTempo)),combos:unique(chains.map(x=>x.combo)),
   startZones:unique(contacts.map(x=>x.fields?.startZone?.code)),endZones:unique(contacts.map(x=>x.fields?.endZone?.code))};
 }
 function field(label,id,items,active=''){return `<label>${esc(label)}<select data-vc1939-filter="${id}">${items.map(([k,v])=>option(k,v)).join('')}</select></label>`;}
 function renderPanel(data,result,filters){const c=catalog(data),f=normFilters(filters),selectOptions=(choices)=>[['','Todos'],...choices.map(x=>[x,x])];
  const filterBlock=`<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${field('Fundamento','skill',selectors.skill)}${field('Jugador','player',selectOptions(c.players))}${field('Valoración','evaluation',selectors.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${field('Rotación propia','ownRotation',selectors.ownRotation)}${field('Rotación rival','rivalRotation',selectors.rivalRotation)}
  ${field('Recepción anterior','reception',selectors.reception)}${field('Colocador','setter',selectOptions(c.setters))}
  ${field('Atacante tras colocación','attacker',selectOptions(c.attackers))}${field('Tempo','tempo',selectOptions(c.tempos))}
  ${field('Combinación','combo',selectOptions(c.combos))}${field('Origen','startZone',selectOptions(c.startZones))}
  ${field('Destino','endZone',selectOptions(c.endZones))}${field('Ganador del rally','outcome',selectors.outcome)}
  ${field('Marca temporal','video',selectors.video)}${field('Estado del rally','status',selectors.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`;
  const summary=result.statistics,stats=`<div class="vc1939-metrics"><div><strong>${summary.rallies}</strong><span>Rallies</span></div><div><strong>${summary.contacts}</strong><span>Contactos</span></div><div><strong>${summary.chains}</strong><span>Colocaciones</span></div><div><strong>${summary.videoContacts}</strong><span>Marcas vídeo</span></div></div>`;
  const skills=summary.bySkill.map(([key,n])=>`<tr><td>${esc(skillLabels[key]||key)}</td><td>${n}</td><td>${summary.contacts?Math.round(n/summary.contacts*1000)/10:0} %</td></tr>`).join('');
  const players=summary.byPlayer.slice(0,10).map(([key,n])=>`<tr><td>${esc(key)}</td><td>${n}</td></tr>`).join('');
  const left=`<div class="vc1939-left"><h3>Buscador de rallies</h3>${filterBlock}${stats}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${skills||'<tr><td colspan="3">Sin acciones con esta selección.</td></tr>'}</tbody></table></div></div>`;
  const seqRows=result.chains.slice(0,50).map(c=>`<tr><td>S${c.setter?.set} · R${c.setter?.rallyIndex}</td><td>${esc(c.reception?.evaluation||'—')}</td><td>${esc(c.setter?.player||'—')}</td><td>${esc(c.tempo||'—')}</td><td>${esc(c.attack?.player||'—')}</td><td>${esc(c.attack?.evaluation||'—')}</td></tr>`).join('');
  const center=`<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${summary.attackRated} · Eficiencia: ${summary.efficiency==null?'Sin muestra':summary.efficiency.toLocaleString('es-ES')+' %'} · Sin valoración: ${summary.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${players||'<tr><td colspan="2">Sin jugadores codificados.</td></tr>'}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${seqRows||'<tr><td colspan="6">No hay secuencias completas con estos filtros.</td></tr>'}</tbody></table></div></div>`;
  return {left,center};
 }
 function decorate(panel,ctx,tab){if(tab!=='search'||!ctx?.match)return;
  const win=panel.ownerDocument.defaultView,api=win?.VC_DATA_ENGINE_1938;const normalized=api?.normalize?.(ctx.match);if(!normalized)return;
  const session=panel._vc1939&&panel._vc1939.matchId===normalized.matchId?panel._vc1939:{matchId:normalized.matchId,filters:{status:'closed'},active:false};
  const currentInput=panel.ownerDocument.activeElement;const activeFilter=currentInput?.dataset?.vc1939Filter||'';const cursor=activeFilter&&currentInput.tagName==='INPUT'?currentInput.selectionStart:null;
  const advancedOpen=panel.querySelector('.vc1939-advanced')?.open||false;
  const merged={...session.filters,team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase};
  const result=query(normalized,merged),html=renderPanel(normalized,result,session.filters);
  const left=panel.querySelector('.vc1937-left-body'),center=panel.querySelector('.vc1937-courtbody');if(!left||!center)return;
  left.innerHTML=html.left;center.innerHTML=html.center;
  const advanced=panel.querySelector('.vc1939-advanced');if(advanced)advanced.open=advancedOpen;
  const leftHead=panel.querySelector('.vc1937-left>header strong');if(leftHead)leftHead.textContent='BÚSQUEDA TÁCTICA';
  const centerHead=panel.querySelector('.vc1937-center>header strong');if(centerHead)centerHead.textContent='RESULTADOS DE LA BÚSQUEDA';
  const reset=panel.querySelector('.vc1937-center>header [data-vc1937-reset]');if(reset)reset.hidden=true;
  const detail=panel.querySelector('.vc1937-details-hint');if(detail)detail.hidden=true;
  const timeline=panel.querySelector('.vc1937-timeline');if(timeline)timeline.hidden=true;
  const badges=panel.querySelector('.vc1937-kpis');if(badges)badges.innerHTML=[['Rallies',result.statistics.rallies],['Contactos',result.statistics.contacts],['Con vídeo',result.statistics.videoContacts],['Colocaciones',result.statistics.chains],['Sin evaluar',result.statistics.missingEvaluation]].map(([k,n])=>`<div class="vc1937-kpi"><span>${k}</span><strong>${n}</strong></div>`).join('');
  const note=panel.querySelector('.vc1937-courtnote');if(note)note.textContent='Resultados procedentes del scouting original. No se infieren jugadores, posesiones, tiempos ni rotaciones ausentes.';
  for(const input of panel.querySelectorAll('[data-vc1939-filter]')){const name=input.dataset.vc1939Filter;input.value=session.filters[name]||((name==='status')?'closed':'');}
  if(activeFilter){const next=panel.querySelector('[data-vc1939-filter="'+activeFilter+'"]');if(next){next.focus();if(cursor!=null&&next.setSelectionRange)next.setSelectionRange(cursor,cursor);}}
  const presets=panel.querySelector('[data-vc1939-preset]');if(presets){const old=session.preset||'';let saved=[];try{saved=readPresets(win.localStorage)}catch(_){}presets.innerHTML='<option value="">Búsquedas guardadas</option>'+saved.map(p=>option(p.name)).join('');presets.value=[...presets.options].some(o=>o.value===old)?old:'';}
  // Preserve source IDs: never map a synthetic index to a different rally.
  const selectedKeys=new Set(result.rallies.filter(r=>r.nativeId!=null).map(r=>`${r.set}:${r.nativeId}`));
  const mapped=ctx.data.rallies.filter(r=>r.id!=null&&selectedKeys.has(`${r.set}:${r.id}`));
  panel._vc1937VisibleRallies=mapped;
  const list=panel.querySelector('.vc1937-rallies');if(list){list.innerHTML=mapped.slice(-150).reverse().map(r=>`<button type="button" class="vc1937-rally" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="false"><b>Set ${r.set} · #${r.index}</b><span>${esc(r.winning==='ours'?'Punto nuestro':r.winning==='opponent'?'Punto rival':'Sin resultado')}</span></button>`).join('')||'<p class="vc1937-empty">Sin rallies con ID válido, o sin coincidencias.</p>';
   panel.querySelector('.vc1937-rally-count').textContent=`${mapped.length} rallies con referencia · ${result.rallies.length} encontrados`;
  }
  session.matchId=normalized.matchId;session.data=normalized;session.result=result;session.ctx=ctx;session.active=true;panel._vc1939=session;
  if(!panel.dataset.vc1939Bound){panel.dataset.vc1939Bound='yes';panel.addEventListener('change',event=>{
   const x=event.target;if(x.matches('select[data-vc1939-filter]')){const s=panel._vc1939;if(!s)return;s.filters[x.dataset.vc1939Filter]=x.value;win.clearTimeout(panel._vc1939Timer);panel._vc1939Timer=win.setTimeout(()=>{if(panel._vc1939?.ctx)decorate(panel,panel._vc1939.ctx,'search')},0);}
   if(x.matches('[data-vc1939-preset]')){panel._vc1939.preset=x.value;}
  });panel.addEventListener('input',event=>{
   const x=event.target;if(!x.matches('input[data-vc1939-filter]'))return;const s=panel._vc1939;if(!s)return;s.filters[x.dataset.vc1939Filter]=x.value;
   win.clearTimeout(panel._vc1939Timer);panel._vc1939Timer=win.setTimeout(()=>{if(panel._vc1939?.ctx)decorate(panel,panel._vc1939.ctx,'search')},350);
  });panel.addEventListener('click',event=>{
   const b=event.target.closest('button');if(!b)return;const s=panel._vc1939;if(!s?.ctx)return;
   if(b.hasAttribute('data-vc1939-clear')){s.filters={status:'closed'};decorate(panel,s.ctx,'search');return;}
   if(b.hasAttribute('data-vc1939-export')){try{const source=toCSV(s.result),blob=new win.Blob([source],{type:'text/csv;charset=utf-8'}),url=win.URL.createObjectURL(blob),a=panel.ownerDocument.createElement('a');a.href=url;a.download='volley-coach-rally-search-'+s.matchId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';panel.ownerDocument.body.append(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}catch(_){/* blocked download: source data unchanged */}return;}
   if(b.hasAttribute('data-vc1939-save')){const name=win.prompt?.('Nombre de la búsqueda (máximo 40 caracteres)');if(!val(name))return;try{const storage=win.localStorage,all=readPresets(storage).filter(x=>x.name!==val(name).slice(0,40));all.push({name:val(name).slice(0,40),filters:normFilters(s.filters)});storage?.setItem(STORAGE_KEY,JSON.stringify(all.slice(-15)));s.preset=val(name).slice(0,40);decorate(panel,s.ctx,'search');}catch(_){}return;}
   if(b.hasAttribute('data-vc1939-load')){const item=readPresets(win.localStorage).find(x=>x.name===s.preset);if(item){s.filters={...item.filters};decorate(panel,s.ctx,'search');}return;}
   if(b.hasAttribute('data-vc1939-delete')){try{win.localStorage?.setItem(STORAGE_KEY,JSON.stringify(readPresets(win.localStorage).filter(x=>x.name!==s.preset)));s.preset='';decorate(panel,s.ctx,'search');}catch(_){}return;}
  });}
 }
 return {VERSION,FILTERS,query,catalog,renderPanel,toCSV,normFilters,readPresets,decorate};
});
