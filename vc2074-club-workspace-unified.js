/* Volley Coach V20.7.4 · Club and workspace read-only UI, original deferred-script order preserved. */
/* VC2074_SOURCE_BEGIN:202-vc193191-data-contract.js */
/* Volley Coach V19.3.19.1 · Canonical read-only data contract.
 * This layer never migrates, writes to storage or changes the Supabase/sync engine.
 * Legacy source identifiers remain untouched; index-based refs are explicitly unstable.
 */
(function(root,factory){
 'use strict'; const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC193191_DATA_CONTRACT=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.1',SCHEMA='volley-coach-recovery';
 const isObject=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
 const list=o=>Array.isArray(o)?o:[];
 const string=o=>String(o??'').trim();
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const stableId=o=>{const id=o?.id??o?.uuid??null;return id!==null&&string(id)!==''?string(id):null;};
 const counts=(v)=>({items:list(v).length});
 function indexRecords(items,teamId,kind,issues){
  const seen=new Set();
  return list(items).map((item,index)=>{
   const original=stableId(item),raw=original===null?'index:'+index:'id:'+encodeURIComponent(original);
   if(original!==null){if(seen.has(original))issues.push({severity:'warn',teamId,kind,code:'duplicate-id',index,message:'ID repetido dentro de '+kind});seen.add(original);}
   return {ref:'team:'+encodeURIComponent(teamId)+'/'+kind+'/'+raw,legacyId:original,index,stable:original!==null,
    // Counts are metadata, never copies of the original records.
    sets:kind==='scoutingMatches'?list(item?.sets).length:undefined};
  });
 }
 function projectState(state){
  if(!isObject(state)||!isObject(state.equiposData))throw Error('El estado no contiene equiposData. No se modificó ningún dato.');
  const issues=[],teams=[];
  for(const [teamId,data] of Object.entries(state.equiposData)){
   if(!isObject(data)){issues.push({severity:'warn',teamId,code:'invalid-team',message:'El equipo no es un objeto'});continue;}
   const records={players:indexRecords(data.jugadores,teamId,'jugadores',issues),
    matches:indexRecords(data.scoutingMatches,teamId,'scoutingMatches',issues),
    trainings:indexRecords(data.historial,teamId,'historial',issues),
    plans:indexRecords(data.planificacion,teamId,'planificacion',issues)};
   const matches=list(data.scoutingMatches);
   let sets=0,rallies=0,contacts=0,missingActionIds=0;
   for(const match of matches){for(const set of list(match?.sets)){
    sets++;for(const rally of list(set?.rallies)){
     rallies++;const actions=list(rally?.actions);contacts+=actions.length;
     missingActionIds+=actions.filter(action=>stableId(action)===null).length;
    }
   }}
   teams.push({teamId,records,counts:{players:records.players.length,matches:records.matches.length,
    trainings:records.trainings.length,plans:records.plans.length,sets,rallies,contacts},missingActionIds});
  }
  const total={teams:teams.length,players:0,matches:0,trainings:0,plans:0,sets:0,rallies:0,contacts:0};
  for(const team of teams)for(const key of Object.keys(total))if(key!=='teams')total[key]+=team.counts[key]||0;
  return {schema:'volley-coach-data-projection',version:VERSION,sourceVersion:state.version??null,sourceUpdatedAt:state.updatedAt||null,
   teams,total,issues,readOnly:true,identityPolicy:'IDs originales o referencias posicionales provisionales; no se migran registros'};
 }
 function validateBackup(raw){
  const document=isObject(raw)?raw:null;
  if(!document)return {ok:false,error:'El JSON no contiene un objeto válido.'};
  if(own(document,'schema')&&document.schema!==SCHEMA)return {ok:false,error:'Esquema de copia no reconocido.'};
  const state=own(document,'state')?document.state:document;
  try{const projection=projectState(state);return {ok:true,projection,format:own(document,'state')?'envelope':'legacy',
   warning:'Validación de estructura y conteos; no es una restauración ni verifica la nube.'};}
  catch(err){return {ok:false,error:String(err?.message||err)};}
 }
 function compareProjections(current,candidate){
  if(!current||!candidate)return null;
  const keys=['teams','players','matches','trainings','plans','sets','rallies','contacts'];
  return keys.map(key=>({entity:key,current:current.total[key]||0,candidate:candidate.total[key]||0,
   delta:(candidate.total[key]||0)-(current.total[key]||0)}));
 }
 return {VERSION,SCHEMA,projectState,validateBackup,compareProjections,indexRecords};
});
/* VC2074_SOURCE_END:202-vc193191-data-contract.js */
;
/* VC2074_SOURCE_BEGIN:203-vc193191-unified-workspace.js */
/* Volley Coach V19.3.19.1 · Unified workspace presentation and safe data audit.
 * Only links to existing views, reads exported state on explicit user action,
 * and downloads a backup file. Never replaces the scouting/sync/video engines.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.1';
 const ROUTES=Object.freeze([
  ['Club y equipos','jugadores'],['Entrenamientos','planificacion'],['Partidos','scout-dashboard'],
  ['Análisis','scout-analysis'],['Video Studio','scout-video-hub'],['Configuración','v11-management']]);
 const MATCH_ROUTES=Object.freeze([
  ['Preparación','scout-plan'],['Scouting','scout-match-mode'],['Vídeo','scout-video-hub'],
  ['Análisis','scout-analysis'],['Banquillo','vc155-bench'],['Informes','v11-reports']]);
 function route(root,view){
  if(!root?.document?.getElementById(view)?.classList?.contains('view'))return false;
  if(root?.VC19_UNIFIED_WORKFLOW?.route)return root.VC19_UNIFIED_WORKFLOW.route(view)===true;
  if(root?.VC17_WORKSPACE?.route)return root.VC17_WORKSPACE.route(view)===true;
  return false;
 }
 function readProjection(root){
  const api=root?.VC193191_DATA_CONTRACT;
  if(typeof root?.estadoLocal!=='function'||!api?.projectState)throw Error('El estado local no está disponible. No se ha realizado ningún cambio.');
  return api.projectState(root.estadoLocal());
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  let home=doc.getElementById('vc193191-home'),match=doc.getElementById('vc193191-match'),audit=doc.getElementById('vc193191-audit');
  function section(id,cls,html){const el=doc.createElement('section');el.id=id;el.className=cls;el.innerHTML=html;return el;}
  function ensure(){
   if(!home){const dash=doc.getElementById('dashboard');if(dash){
    const original=doc.getElementById('vc17-dashboard');
    const overview=original
     ? `<div class="vc193191-intro"><small>V19.3.19.1 · PROFESSIONAL WORKSPACE</small><h3>Una sola navegación, datos protegidos</h3><p>El menú superior ya contiene las áreas de trabajo. Los módulos originales y los datos no se han migrado. Antes de actualizar, revisa y exporta una copia verificable.</p></div><div class="vc193191-links is-single"><button type="button" data-vc193191-route="v11-management"><strong>Auditoría y respaldo</strong><span>Verificar estructura · Descargar copia JSON</span></button></div>`
     : `<div class="vc193191-intro"><small>V19.3.19.1 · PROFESSIONAL WORKSPACE</small><h3>Espacios de trabajo conectados</h3><p>Una única navegación para entrenamientos, partidos, análisis y vídeo. Los datos se conservan en sus módulos originales.</p></div><div class="vc193191-links">${ROUTES.map(([label,view])=>`<button type="button" data-vc193191-route="${view}"><strong>${label}</strong><span>Acceder al espacio</span></button>`).join('')}</div>`;
    home=section('vc193191-home','vc193191-home',overview);
    if(original)original.insertAdjacentElement('afterend',home);else dash.insertBefore(home,dash.firstChild);
   }}
   if(!match){const host=doc.getElementById('scout-match-mode');if(host){
    match=section('vc193191-match','vc193191-match',`<div class="vc193191-match-title"><strong>Match Workspace</strong><span>Un partido · Scouting · Vídeo · Estadísticas</span></div><nav aria-label="Herramientas del partido">${MATCH_ROUTES.map(([label,view])=>`<button type="button" data-vc193191-route="${view}" ${view==='scout-match-mode'?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`);
    host.insertBefore(match,host.firstChild);
   }}
   if(!audit){const host=doc.getElementById('v11-management');if(host){
    audit=section('vc193191-audit','vc193191-audit',`<div class="vc193191-audit-title"><div><small>CONTROL DE CALIDAD · SOLO LECTURA</small><h3>Arquitectura y seguridad de datos</h3><p>Comprobación de equipos, jugadores, scoutings y contactos originales. No ejecuta migraciones ni sincronizaciones.</p></div></div><div class="vc193191-audit-actions"><button type="button" data-vc193191-action="inspect">Revisar datos</button><button type="button" data-vc193191-action="backup">Exportar copia JSON</button><label class="vc193191-file">Validar copia (sin importar)<input id="vc193191-file" type="file" accept=".json,application/json"></label></div><div class="vc193191-audit-output" id="vc193191-report" role="status" aria-live="polite">No se ha realizado ninguna comprobación.</div><p class="vc193191-note">La exportación utiliza el formato original de respaldo. La validación no restaura ni modifica ningún registro. Para una actualización de versión, guarda una copia externa antes de desplegar.</p>`);
    const first=host.querySelector('.v11-page-head');if(first)first.insertAdjacentElement('afterend',audit);else host.insertBefore(audit,host.firstChild);
   }}
   return !!(home&&match&&audit);
  }
  function message(msg){const e=doc.getElementById('vc193191-report');if(e)e.textContent=msg;}
  function describe(p){return `${p.total.teams} equipos · ${p.total.players} jugadores · ${p.total.matches} scoutings · ${p.total.rallies} rallies · ${p.total.contacts} contactos.\n`+
   p.teams.map(t=>`${t.teamId}: ${t.counts.players} jugadores, ${t.counts.matches} partidos, ${t.counts.trainings} entrenamientos, ${t.counts.plans} planes.`).join('\n')+
   `\n${p.issues.length} advertencia(s) de identificadores o estructura. `+
   `Las referencias sin ID son provisionales. Estado de nube y presencia de dispositivos: consultar indicadores existentes.`;
  }
  function backup(){
   if(typeof root.estadoLocal!=='function')throw Error('Estado local no disponible.');
   const state=root.estadoLocal();const api=root.VC193191_DATA_CONTRACT;
   api.projectState(state); // reject malformed payload rather than exporting it silently
   const contents=JSON.stringify({schema:api.SCHEMA,version:VERSION,exportedAt:new Date().toISOString(),state});
   const blob=new root.Blob([contents],{type:'application/json;charset=utf-8'});
   const url=root.URL.createObjectURL(blob),a=doc.createElement('a');
   try{a.href=url;a.download='volley-coach-backup-v193191-'+new Date().toISOString().slice(0,10)+'.json';doc.body.appendChild(a);a.click();}
   finally{a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),30000);}
   return blob.size;
  }
  async function validateFile(file){
   if(!file)return;
   if(file.size>60*1024*1024){message('El archivo supera 60 MB. No se ha importado ni modificado ningún dato.');return;}
   try{
    const payload=JSON.parse(await file.text()),api=root.VC193191_DATA_CONTRACT;
    const candidate=api.validateBackup(payload);
    if(!candidate.ok){message('Copia no válida: '+candidate.error);return;}
    let current=null;try{current=readProjection(root)}catch(_){ }
    const diff=api.compareProjections(current,candidate.projection);
    const lines=diff?diff.map(x=>`${x.entity}: actual ${x.current} / copia ${x.candidate} (${x.delta>=0?'+':''}${x.delta})`).join('\n'):'No hay datos locales comparables.';
    message('Estructura de copia reconocida. No se han restaurado datos.\n'+lines+'\nVerifica también contenidos y vídeos en el dispositivo de origen.');
   }catch(err){message('No se pudo leer el archivo JSON: '+String(err?.message||err));}
  }
  doc.addEventListener('click',e=>{
   const btn=e.target?.closest?.('[data-vc193191-route],[data-vc193191-action]');if(!btn)return;
   if(btn.dataset.vc193191Route){const view=btn.dataset.vc193191Route;if(!route(root,view))message('No se pudo abrir la vista '+view+'.');return;}
   const action=btn.dataset.vc193191Action;
   if(action==='inspect'){
    try{message(describe(readProjection(root)));}
    catch(err){message('Auditoría no disponible: '+String(err?.message||err));}
   }else if(action==='backup'){
    try{const size=backup();message(`Se ha iniciado la descarga de ${Math.round(size/1024)} KB. Comprueba el archivo descargado antes de actualizar.`);}
    catch(err){message('No se ha generado la copia: '+String(err?.message||err));}
   }
  });
  doc.addEventListener('change',e=>{if(e.target?.id==='vc193191-file')void validateFile(e.target.files?.[0]);});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  root.VC193191_WORKSPACE={VERSION,ROUTES,MATCH_ROUTES,route:view=>route(root,view),inspect:()=>readProjection(root),ensure};
  return true;
 }
 return {VERSION,ROUTES,MATCH_ROUTES,route,readProjection,mount};
});
/* VC2074_SOURCE_END:203-vc193191-unified-workspace.js */
;
/* VC2074_SOURCE_BEGIN:204-vc193192-domain-adapters.js */
/* Volley Coach V19.3.19.2 - Domain adapters for the legacy team store.
 * Read-only projection, without migration, IDs persisted or extra sync writer.
 * Seasons and club IDs are only exposed if explicitly present in source data.
 */
(function(root,factory){
 'use strict'; const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC193192_DOMAINS=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.2';
 const arr=x=>Array.isArray(x)?x:[];
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const str=x=>String(x??'').trim();
 const present=x=>x!==undefined&&x!==null&&str(x)!=='';
 const identity=x=>present(x?.id)?str(x.id):present(x?.uuid)?str(x.uuid):null;
 const teamName=(id,raw,registry={})=>str(raw?.nombre||raw?.name||registry?.[id]?.nombre||raw?.meta?.equipo||id);
 const seasonLabel=(raw,source={})=>str(raw?.temporada||raw?.season||raw?.seasonName||raw?.meta?.temporada||raw?.meta?.season||source?.temporadaActual||source?.seasonCurrent||'');
 function project(raw,options={}){
  if(!obj(raw)||!obj(raw.equiposData))throw new Error('No hay datos de equipos compatibles.');
  const registry=obj(options.registry)?options.registry:{},teams=[],issues=[];
  const club=raw.club||raw.clubConfig||raw.organizacion||null;
  const clubId=identity(club),clubName=str(club?.nombre||club?.name||'');
  for(const [id,record] of Object.entries(raw.equiposData)){
   if(!obj(record)){issues.push({teamId:id,code:'invalid-team',message:'El registro de equipo no es un objeto'});continue;}
   const players=arr(record.jugadores),matches=arr(record.scoutingMatches),training=arr(record.historial),plans=arr(record.planificacion);
   const playerIds=new Set(),numbers=new Set(),roster=[];
   for(const [index,p] of players.entries()){
    if(!obj(p)){issues.push({teamId:id,code:'invalid-player',index,message:'Registro de jugador incompleto'});continue;}
    const idValue=identity(p),number=str(p.number??p.numero??'');
    if(!idValue)issues.push({teamId:id,code:'provisional-player-id',index,message:'Jugador sin ID estable'});
    if(idValue&&playerIds.has(idValue))issues.push({teamId:id,code:'duplicate-player-id',index,message:'ID de jugador duplicado'});
    if(idValue)playerIds.add(idValue);
    if(number&&numbers.has(number))issues.push({teamId:id,code:'duplicate-shirt-number',index,message:'Dorsal repetido en la plantilla'});
    if(number)numbers.add(number);
    const position=str(p.position||p.posicion||arr(p.positions)[0]||'');
    roster.push({id:idValue,number,name:str(p.name||p.nombre||p.playerName||''),position,status:str(p.status||p.estado||''),
     // Position is only a link to the original record, never a replacement ID.
     sourceIndex:index,identityStable:!!idValue});
   }
   let sets=0,rallies=0,actions=0;
   for(const m of matches)for(const s of arr(m?.sets)){
    sets++;for(const r of arr(s?.rallies)){rallies++;actions+=arr(r?.actions).length;}
   }
   const season=seasonLabel(record,raw),name=teamName(id,record,registry);
   teams.push({id,name,season:season||null,seasonExplicit:!!season,roster,
    counts:{players:players.length,matches:matches.length,training:training.length,plans:plans.length,sets,rallies,actions},
    lastMatches:matches.slice(-3).reverse().map((m,index)=>({id:identity(m),label:str(m?.name||m?.opponent||m?.opponentName||m?.title||'Partido sin nombre'),status:str(m?.status||''),sourceIndex:matches.length-index-1})),
    legacySource:'equiposData.'+id});
  }
  const activeTeamId=str(options.activeTeamId||''),active=teams.find(t=>t.id===activeTeamId)||null;
  const seasonNames=[...new Set(teams.map(t=>t.season).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const total={teams:teams.length,players:0,matches:0,training:0,plans:0,sets:0,rallies:0,actions:0};
  for(const t of teams)for(const key of Object.keys(t.counts))total[key]+=t.counts[key];
  return {version:VERSION,schema:'volley-coach-domain-projection',readOnly:true,club:{id:clubId,name:clubName||null},
   seasons:seasonNames.map(name=>({label:name,teamIds:teams.filter(t=>t.season===name).map(t=>t.id)})),
   teams,total,issues,activeTeamId:active?.id||null,active,unassignedSeasons:teams.filter(t=>!t.season).length,
   note:'Vista derivada del registro legado. No crea clubes, temporadas, IDs ni permisos.'};
 }
 function readLive(root){
  const teams=root?.VC_V1917_TEAM_STATE?.();
  if(obj(teams))return {equiposData:teams};
  if(typeof root?.estadoLocal==='function')return root.estadoLocal();
  throw new Error('Los datos del equipo no están disponibles todavía.');
 }
 function activeFrom(root){
  try{
   const saved=root?.localStorage?.getItem('volleyCoachActiveTeamV43')||root?.localStorage?.getItem('volleyCoachActiveTeamV42');
   if(saved)return str(saved);
  }catch(_){}
  return str(root?.equipoActivo||'');
 }
 function inspect(root){return project(readLive(root),{activeTeamId:activeFrom(root),registry:root?.EQUIPOS});}
 return {VERSION,project,readLive,activeFrom,inspect,identity,seasonLabel};
});
/* VC2074_SOURCE_END:204-vc193192-domain-adapters.js */
;
/* VC2074_SOURCE_BEGIN:205-vc193192-club-desk.js */
/* Volley Coach V19.3.19.2 · Professional Club Desk.
 * Presentation-only facade over existing club/team/player and scouting writers.
 * Uses the original navigation and the original cambiarEquipo flow.
 */
(function(root,factory){
 'use strict'; const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC193192_CLUB_DESK=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.2',ui={tab:'overview',search:'',message:''};
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function route(root,id){const fn=root?.VC19_UNIFIED_WORKFLOW?.route||root?.VC17_WORKSPACE?.route;return typeof fn==='function'&&fn(id)===true;}
 function snapshot(root){return root?.VC193192_DOMAINS?.inspect(root)||null;}
 function card(t,active){const canSwitch=t.id==='infantil'||t.id==='cadete',isActive=t.id===active;
  return `<button type="button" class="vc193192-team-card ${isActive?'is-active':''}" data-vc193192-team="${esc(t.id)}" aria-pressed="${isActive}" ${!canSwitch&&!isActive?'disabled title="Equipo en lectura; migración multiclub pendiente"':''}><span class="vc193192-team-leading">${esc(t.name.slice(0,2).toUpperCase())}</span><span class="vc193192-team-copy"><strong>${esc(t.name)}</strong><small>${esc(t.season||'Temporada no registrada')} · ${t.counts.players} jugadores</small></span><span class="vc193192-team-tag">${isActive?'Activo':canSwitch?'Cambiar':'Consulta'}</span></button>`;
 }
 function overview(data){const t=data.active||data.teams[0]||null;if(!t)return '<div class="vc193192-empty">Todavía no hay equipos registrados.</div>';
  return `<div class="vc193192-detail-heading"><div><small>EQUIPO SELECCIONADO</small><h3>${esc(t.name)}</h3><p>${esc(t.season||'Sin temporada asignada')} · Los registros siguen en su formato original.</p></div><button type="button" data-vc193192-action="roster">Abrir plantilla</button></div>
   <div class="vc193192-statgrid">${[['Jugadores',t.counts.players],['Scoutings',t.counts.matches],['Entrenamientos',t.counts.training],['Planes',t.counts.plans],['Rallies',t.counts.rallies],['Contactos',t.counts.actions]].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('')}</div>
   <div class="vc193192-bottomgrid"><section><div class="vc193192-subhead"><h4>Plantilla reciente</h4><button type="button" data-vc193192-action="roster">Ver todos</button></div><div class="vc193192-compact-list">${t.roster.slice(0,6).map(p=>`<div><b>${esc(p.number?'#'+p.number:'—')}</b><span>${esc(p.name||'Sin nombre')}</span><small>${esc(p.position||'Sin posición')}</small></div>`).join('')||'<p>Sin jugadores registrados.</p>'}</div></section>
   <section><div class="vc193192-subhead"><h4>Últimos scoutings</h4><button type="button" data-vc193192-route="scout-dashboard">Abrir partidos</button></div><div class="vc193192-compact-list">${t.lastMatches.map(m=>`<div><b>●</b><span>${esc(m.label)}</span><small>${esc(m.status||'Estado no indicado')}</small></div>`).join('')||'<p>Sin scoutings registrados.</p>'}</div></section></div>`;
 }
 function roster(data,q){const t=data.active||data.teams[0];if(!t)return '<div class="vc193192-empty">No hay equipo seleccionado.</div>';
  const term=str(q).toLocaleLowerCase('es');const rows=t.roster.filter(p=>!term||[p.name,p.number,p.position].some(v=>str(v).toLocaleLowerCase('es').includes(term)));
  return `<div class="vc193192-detail-heading"><div><small>PLANTILLA · LECTURA</small><h3>${esc(t.name)}</h3><p>La edición permanece en el gestor original de jugadores, debajo de este panel.</p></div><button type="button" data-vc193192-action="legacy-roster">Gestionar jugadores</button></div>
  <label class="vc193192-search">Buscar en plantilla<input id="vc193192-search" type="search" placeholder="Nombre, dorsal o posición" value="${esc(q)}" autocomplete="off"></label>
  <div class="vc193192-table-scroll"><table><thead><tr><th>Dorsal</th><th>Jugador</th><th>Posición</th><th>Estado</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.number||'—')}</td><td>${esc(p.name||'Sin nombre')}</td><td>${esc(p.position||'—')}</td><td>${esc(p.status||'No indicado')}</td></tr>`).join('')||'<tr><td colspan="4">No hay jugadores para este filtro.</td></tr>'}</tbody></table></div>`;
 }
 function seasons(data){const recorded=data.seasons.length?data.seasons.map(s=>`<article class="vc193192-season"><strong>${esc(s.label)}</strong><span>${s.teamIds.length} equipos con temporada explícita</span></article>`).join(''):'<p>No existe una temporada global registrada en los datos actuales. No se ha creado ninguna automáticamente.</p>';
  return `<div class="vc193192-detail-heading"><div><small>MODELO DE TEMPORADA</small><h3>Temporadas y equipos</h3><p>Vista de los campos que ya existen; no es una migración ni un nuevo calendario.</p></div><button type="button" data-vc193192-route="scout-season">Análisis de temporada</button></div><div class="vc193192-seasons">${recorded}</div><p class="vc193192-note">${data.unassignedSeasons} equipo(s) sin temporada explícita. El futuro modelo club → temporada → equipo necesitará una migración reversible y autorización por club.</p>`;
 }
 function html(data){
  return `<div class="vc193192-heading"><div><span class="vc193192-kicker">CLUB · TEAMS · ROSTER</span><h2>Centro del club</h2><p>Equipos, plantilla y actividad desde una única vista. Conservamos las fuentes originales de scouting, entrenamientos y nube.</p></div><div class="vc193192-heading-actions"><span class="vc193192-readonly">Datos originales · Solo lectura</span><button type="button" data-vc193192-route="v11-management">Copias y auditoría</button></div></div>
   <div class="vc193192-overviewstats"><div><small>Equipos</small><strong>${data.total.teams}</strong></div><div><small>Jugadores</small><strong>${data.total.players}</strong></div><div><small>Scoutings guardados</small><strong>${data.total.matches}</strong></div><div><small>Rallies</small><strong>${data.total.rallies}</strong></div></div>
   <div class="vc193192-columns"><aside class="vc193192-team-list"><div class="vc193192-listhead"><h3>Equipos</h3><small>${data.teams.length} registrados</small></div><div class="vc193192-team-cards">${data.teams.map(t=>card(t,data.active?.id)).join('')||'<p>Sin equipos disponibles</p>'}</div><div class="vc193192-warning">No se crean clubes o equipos nuevos hasta que la migración multiclub y los permisos del servidor estén validados.</div></aside>
   <div class="vc193192-main"><nav class="vc193192-tabs" aria-label="Vista del club">${[['overview','Resumen'],['roster','Plantilla'],['seasons','Temporadas']].map(([id,name])=>`<button type="button" data-vc193192-tab="${id}" aria-pressed="${ui.tab===id}">${name}</button>`).join('')}</nav><div class="vc193192-content">${ui.tab==='roster'?roster(data,ui.search):ui.tab==='seasons'?seasons(data):overview(data)}</div></div></div>
   <div class="vc193192-foot"><span role="status" id="vc193192-status">${esc(ui.message||`${data.issues.length} advertencia(s) de estructura; datos sin modificar.`)}</span><button type="button" data-vc193192-action="refresh">Actualizar datos</button></div>`;
 }
 function mount(root){const doc=root.document;if(!doc)return false;
  function ensure(){
   const host=doc.getElementById('jugadores');if(!host)return false;
   let shell=doc.getElementById('vc193192-club');if(!shell){shell=doc.createElement('section');shell.id='vc193192-club';shell.className='vc193192-club';host.insertBefore(shell,host.firstChild);}
   return refresh();
  }
  function refresh(){const host=doc.getElementById('jugadores'),shell=doc.getElementById('vc193192-club');if(!host||!shell)return false;
   try{const data=snapshot(root);if(!data)throw Error('Adaptadores no disponibles');shell.innerHTML=html(data);host.dataset.vc193192Mode=ui.tab;return true;}
   catch(err){shell.innerHTML='<div class="vc193192-empty" role="status">No se pudo consultar el centro del club: '+esc(err?.message||err)+'. Los datos no se modificaron.</div>';return false;}
  }
  function status(msg){ui.message=msg;const el=doc.getElementById('vc193192-status');if(el)el.textContent=msg;}
  doc.addEventListener('click',e=>{
   const control=e.target?.closest?.('[data-vc193192-action],[data-vc193192-tab],[data-vc193192-team],[data-vc193192-route]');if(!control)return;
   if(!doc.getElementById('vc193192-club')?.contains(control))return;
   if(control.dataset.vc193192Tab){ui.tab=control.dataset.vc193192Tab;ui.message='';refresh();return;}
   if(control.dataset.vc193192Route){if(!route(root,control.dataset.vc193192Route))status('No se pudo abrir el módulo solicitado.');return;}
   if(control.dataset.vc193192Team){const id=control.dataset.vc193192Team;
    if(id===root?.VC193192_DOMAINS?.activeFrom(root)){status('Este equipo ya está activo.');return;}
    if(!['cadete','infantil'].includes(id)||typeof root.cambiarEquipo!=='function'){status('El equipo no se puede cambiar desde el motor actual.');return;}
    try{const result=root.cambiarEquipo(id);
     if(result&&typeof result.then==='function')result.then(()=>{status('Cambio solicitado. Comprueba la nube antes de editar.');refresh();}).catch(err=>status('Cambio no confirmado: '+str(err?.message||err)));
     else {status('Cambio solicitado. Comprueba la nube antes de editar.');root.setTimeout?.(refresh,100);}
    }catch(err){status('No se cambió el equipo: '+str(err?.message||err));}return;
   }
   const action=control.dataset.vc193192Action;
   if(action==='refresh')refresh();
   if(action==='roster'){ui.tab='roster';refresh();}
   if(action==='legacy-roster'){
    const target=doc.querySelector('#jugadores .players-pro-shell');if(target){target.scrollIntoView?.({block:'start',behavior:'smooth'});target.querySelector('input')?.focus?.({preventScroll:true});}
   }
  });
  doc.addEventListener('input',e=>{if(e.target?.id==='vc193192-search'){ui.search=str(e.target.value);const rows=doc.querySelector('#vc193192-club .vc193192-table-scroll');
   // Only update the table to preserve input focus and cursor position.
   try{const data=snapshot(root);if(rows){const parsed=roster(data,ui.search),tmp=doc.createElement('div');tmp.innerHTML=parsed;rows.innerHTML=tmp.querySelector('.vc193192-table-scroll')?.innerHTML||'';}}catch(_){}
  }});
  root.addEventListener?.('vc:teamchange',()=>{ui.message='';root.setTimeout?.(refresh,0);});
  doc.addEventListener('click',e=>{const routeTarget=e.target?.closest?.('[data-vc17-link],[data-vc17-view],[data-vc193191-route]');if(routeTarget?.dataset?.vc17Link==='jugadores'||routeTarget?.dataset?.vc17View==='jugadores'||routeTarget?.dataset?.vc193191Route==='jugadores')root.setTimeout?.(refresh,0);});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  return {VERSION,refresh,ensure};
 }
 return {VERSION,html,overview,roster,seasons,card,route,snapshot,mount};
});
/* VC2074_SOURCE_END:205-vc193192-club-desk.js */
;
