/* Volley Coach V20.3.2 — conservative migration & authenticated read-only entity observer.
 * No shadow writes, no mutation of legacy equiposData, no automatic cutover.
 */
(()=>{
 'use strict';
 const VERSION='20.3.2',doc=document,$=id=>doc.getElementById(id),planner=window.VC2032_MIGRATION_PLANNER;
 const LIMIT=10,PAGE=100,MAX=500;
 let last=null,lastMirror=[],lastReadAt=0,busy=false,channel=null,channelClient=null,subscribedAccount='',channelState='No iniciado',pendingRefresh=null;
 const account=()=>{try{return String(cloudUser?.id||'')}catch(_){return ''}};
 const client=()=>{try{return cloudClient||null}catch(_){return null}};
 const cloud=()=>window.VC_V962_CLOUD_EFFICIENT;
 const pilot=()=>window.VC2031_PILOT;
 const snapshot=()=>{try{return {equiposData}}catch(_){return null}};
 function message(value,kind='info'){
  const el=$('vc2032-message');if(el){el.textContent=String(value);el.dataset.kind=kind}
 }
 function activeTeam(){return $('vc2032-team')?.value||''}
 const versionSignature=rows=>JSON.stringify(rows.map(row=>[row.entity_id,row.revision,row.deleted,row.updated_at]));
 function validAccount(){
  const id=account();if(!id||!client()||!cloud()?.diagnostics?.().connected)throw Error('Conecta tu cuenta en Supabase.');
  return id;
 }
 async function readEntities(team){
  const owner=validAccount(),db=client(),rows=[];
  // Ordered pages prevent Supabase's default result cap from silently skipping rows.
  for(let offset=0;offset<=MAX;offset+=PAGE){
   const {data,error}=await db.from('vc2031_entities')
    .select('owner_id,team_key,entity_type,entity_id,revision,document,deleted,updated_at')
    .eq('owner_id',owner).eq('team_key',team).eq('entity_type','training_plan')
    .order('entity_id',{ascending:true}).range(offset,offset+PAGE-1);
   if(error)throw Error('No se pueden leer las entidades (¿está instalado el SQL V20.3.1?): '+error.message);
   if(!Array.isArray(data))throw Error('Respuesta de entidad incompleta.');
   if(account()!==owner)throw Error('La cuenta cambió durante la descarga.');
   if(rows.length+data.length>MAX)throw Error('Se supera el límite de lectura segura. No se migrará ningún registro.');
   for(const row of data){if(row.owner_id!==owner)throw Error('Lectura de otra cuenta bloqueada.');rows.push(row)}
   if(data.length<PAGE)return rows;
  }
  throw Error('Límite de páginas excedido. No se migrará.');
 }
 function teams(){
  const select=$('vc2032-team');if(!select)return;
  const previous=select.value;select.replaceChildren();
  const first=doc.createElement('option');first.value='';first.textContent='Selecciona un equipo…';select.append(first);
  for(const team of Object.keys(snapshot()?.equiposData||{}).sort()){
   const option=doc.createElement('option');option.value=team;option.textContent=team;select.append(option);
  }
  if([...select.options].some(o=>o.value===previous))select.value=previous;
 }
 function render(){
  if(!$('vc2032-panel'))return;
  teams();
  const result=last?.result,info=$('vc2032-summary');
  if(info)info.textContent=result&&last.team===activeTeam()?
   `Nube actual y dispositivo comparados · listos ${result.totals.ready} · comprobados ${result.totals.confirmed} · conflictos ${result.totals.legacyConflict+result.totals.pilotConflict} · solo en piloto ${result.totals.orphanPilot} · incidencias ID ${result.issues.length}`:
   'Pendiente de comparar las tres copias. No se modifican registros.';
  const count=$('vc2032-count');if(count)count.textContent=`${lastMirror.length} entidades leídas · ${lastReadAt?new Date(lastReadAt).toLocaleTimeString('es-ES'):'—'}`;
  const rt=$('vc2032-realtime');if(rt)rt.textContent=`Lectura entre dispositivos: ${channelState}. Consulta de respaldo cada 25 s mientras este panel esté abierto.`;
  const mirrorList=$('vc2032-mirror');if(mirrorList){mirrorList.replaceChildren();
   if(!lastMirror.length)mirrorList.textContent='Todavía no hay registros para este equipo en las nuevas tablas.';
   for(const row of [...lastMirror].sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||''))).slice(0,10)){
    const item=doc.createElement('li');item.textContent=`${row.entity_id} · revisión ${row.revision} · ${row.deleted?'eliminación registrada':'guardado'}`;
    mirrorList.append(item);
   }
  }
  const button=$('vc2032-stage');if(button)button.disabled=busy||!result||last.team!==activeTeam()||result.blocked||!result.readyIds.length;
  const list=$('vc2032-issues');if(list){list.replaceChildren();
   const bad=result?.entries.filter(e=>e.status!=='ready'&&e.status!=='confirmed')||[];
   if(!bad.length)list.textContent='Sin diferencias para revisar en la última comparación.';
   for(const item of bad.slice(0,25)){
    const el=doc.createElement('li');el.textContent=`ID ${item.id} · ${item.status} · revisión piloto ${item.serverRevision}`;list.append(el);
   }
   if(bad.length>25){const extra=doc.createElement('li');extra.textContent=`…y ${bad.length-25} diferencias adicionales`;list.append(extra)}
  }
 }
 async function preview(){
  const owner=validAccount(),team=activeTeam(),diag=cloud()?.diagnostics?.()||{};
  if(!team)throw Error('Selecciona un equipo para comparar.');
  if(diag.dirty||diag.syncing||diag.blockedReason||diag.pendingAccountMismatch||diag.lastSyncError)
   throw Error('La nube principal tiene cambios pendientes o conflictos. Termina de sincronizar primero.');
  const remote=await cloud().readOnlyRemoteSnapshot();
  if(!remote?.state?.equiposData)throw Error('No se ha podido leer la nube original completa.');
  const mirror=await readEntities(team);
  const currentDiag=cloud()?.diagnostics?.()||{};
  if(account()!==owner||currentDiag.dirty||currentDiag.syncing||currentDiag.blockedReason||currentDiag.lastSyncError)
   throw Error('El estado cambió durante la comparación. No se preparará ninguna operación.');
  if(activeTeam()!==team)throw Error('Se cambió de equipo durante la comparación. Repite la lectura.');
  const result=planner.compare({localState:snapshot(),legacyCloudState:remote.state,
   serverRecords:mirror,teamKey:team,type:'planificacion'});
  last={owner,team,result,cloudStamp:remote.stamp,readAt:Date.now()};
  lastMirror=mirror;lastReadAt=Date.now();render();
  message(result.blocked?'Identificadores duplicados o inválidos. No se puede preparar la migración.':
   `Comparación terminada: ${result.totals.ready} listos, ${result.totals.confirmed} ya confirmados. No se ha escrito nada.`,
   result.blocked?'warning':'ok');
  return result;
 }
 async function checkMirror(){
  const team=activeTeam();if(!team)return;
  const owner=account(),rows=await readEntities(team),oldSignature=versionSignature(lastMirror);
  if(account()!==owner||activeTeam()!==team)throw Error('La sesión o el equipo cambiaron durante la lectura.');
  lastMirror=rows;lastReadAt=Date.now();
  if(last&&last.team===team&&oldSignature!==versionSignature(rows))last=null;
  render();return rows;
 }
 async function stageBatch(){
  const owner=validAccount();
  if(!last||last.owner!==owner||last.team!==activeTeam()||last.result.blocked||!last.result.readyIds.length)
   throw Error('Falta una comparación válida y sin incidencias.');
  const fresh=await preview();
  if(fresh.blocked||!fresh.readyIds.length){message('Ya no hay registros aptos. Sin cambios.','warning');return}
  const selected=fresh.readyIds.slice(0,LIMIT);
  const team=activeTeam();
  if(!confirm(`Preparar hasta ${selected.length} COPIAS LOCALES para el piloto V20.3.2? Se guardarán en IndexedDB, sin enviar ni sobrescribir datos. El envío posterior requiere confirmación individual.`))return;
  const svc=pilot();if(typeof svc?.stageRecord!=='function')throw Error('El piloto V20.3.1 no está disponible.');
  const capability=await svc.capabilities();if(!capability.ready)throw Error('El SQL piloto no está disponible. No se ha preparado nada.');
  let prepared=0;const errors=[];
  for(const id of selected){
   if(account()!==owner)throw Error('Cuenta cambiada durante la preparación. Los comandos ya guardados siguen protegidos.');
   if(activeTeam()!==team)throw Error('El equipo cambió durante la preparación. Operación detenida.');
   try{await svc.stageRecord({team,id});prepared++}
   catch(err){errors.push(`${id}: ${String(err?.message||err)}`);break}
  }
  message(`${prepared} copias preparadas en el diario local; 0 enviadas automáticamente. ${errors.length?errors[0]:'Usa la sección V20.3.1 para confirmar cada envío.'}`,
   errors.length?'warning':'ok');
  return {prepared,errors};
 }
 async function run(work){
  if(busy)return;busy=true;render();
  try{await work()}catch(err){message(String(err?.message||err),'error')}
  finally{busy=false;render()}
 }
 function scheduleMirror(){
  if(pendingRefresh)clearTimeout(pendingRefresh);
  if(last&&last.team===activeTeam())last=null;render();
  pendingRefresh=setTimeout(()=>{pendingRefresh=null;
   if(doc.visibilityState==='visible'&&$('vc2032-panel')&&activeTeam()&&account())run(checkMirror);
  },350);
 }
 function connect(){
  const owner=account(),db=client();
  if(owner===subscribedAccount&&channel)return;
  if(channel){try{channelClient?.removeChannel?.(channel)}catch(_){}channel=null;channelClient=null}
  subscribedAccount=owner;last=null;lastMirror=[];
  if(!owner||!db?.channel){channelState='Sin sesión';render();return}
  try{
   channelClient=db;channel=db.channel('vc2032-entities-'+owner.slice(0,8)+'-'+Math.random().toString(36).slice(2,7))
    .on('postgres_changes',{event:'*',schema:'public',table:'vc2031_entities',filter:'owner_id=eq.'+owner},
     ()=>{if(account()===owner)scheduleMirror()})
    .subscribe(status=>{channelState=status==='SUBSCRIBED'?'Canal conectado (RLS)':status;
     render()});
  }catch(err){channelState='Solo consulta periódica';console.warn('V20.3.2 read observer',err)}
 }
 function ensure(){
  const base=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return false;
  if($('vc2032-panel'))return true;
  const section=doc.createElement('section');section.id='vc2032-panel';
  section.innerHTML=`<div class="vc2032-head"><small>V20.3.2 · MIGRACIÓN CONTROLADA</small><strong>Comparar las 3 copias de tus entrenamientos</strong></div>
  <p>La nube actual sigue siendo la fuente principal. La nueva tabla solo almacena copias independientes confirmadas; no sustituye todavía la edición simultánea de la aplicación.</p>
  <label for="vc2032-team">Equipo</label><select id="vc2032-team"><option value="">Selecciona un equipo…</option></select>
  <div class="vc2032-buttons"><button id="vc2032-preview" type="button">Comparar dispositivo, nube y entidades</button><button id="vc2032-refresh" type="button">Consultar entidades en nube</button></div>
  <p id="vc2032-summary">Pendiente de comparar las tres copias. No se modifican registros.</p>
  <p id="vc2032-count">Sin lectura del servidor.</p><p id="vc2032-realtime">Preparando observador…</p>
  <h4>Últimas entidades confirmadas en el servidor</h4><ul id="vc2032-mirror"><li>Sin lectura todavía.</li></ul>
  <div class="vc2032-buttons"><button id="vc2032-stage" type="button" disabled>Preparar hasta 10 copias pendientes</button></div>
  <p id="vc2032-message" role="status">Solo se preparan entrenamientos idénticos en ambos sistemas originales y aún ausentes en el piloto.</p>
  <h4>Registros que necesitan revisión</h4><ul id="vc2032-issues"><li>Realiza una comparación.</li></ul>
  <p class="vc2032-note">La suscripción Realtime actualiza esta vista mediante una nueva lectura del servidor; nunca copia datos directamente a tu entrenamiento ni cambia el marcador.</p>`;
  const css=doc.createElement('style');css.id='vc2032-style';css.textContent=`
  #vc2032-panel{background:#f7f9fd;border:1px solid #bbd3e4;border-radius:12px;padding:15px;margin:12px 0;color:#23465e;font:12px/1.5 system-ui,sans-serif}
  #vc2032-panel .vc2032-head{display:grid;gap:3px}#vc2032-panel .vc2032-head small{color:#397a9c;font-weight:800;font-size:10px;letter-spacing:.08em}
  #vc2032-panel .vc2032-head strong{font-size:16px}#vc2032-panel p{font-size:11px;line-height:1.5;margin:8px 0}
  #vc2032-panel label{display:block;font-weight:700;margin:8px 0 4px}#vc2032-panel select{width:100%;border:1px solid #bdd2e0;border-radius:8px;background:#fff;color:#23465e;padding:9px}
  #vc2032-panel .vc2032-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}#vc2032-panel button{background:#fff;color:#235875;border:1px solid #a2c0d5;padding:10px}
  #vc2032-panel button:disabled{opacity:.5}#vc2032-panel #vc2032-summary{background:#fff;border:1px solid #dbe7ef;padding:9px;border-radius:7px}
  #vc2032-panel #vc2032-message[data-kind="error"]{color:#a34334;font-weight:700}#vc2032-panel #vc2032-message[data-kind="warning"]{color:#996328;font-weight:700}
  #vc2032-panel #vc2032-message[data-kind="ok"]{color:#277453;font-weight:700}#vc2032-panel h4{font-size:12px;margin:12px 0 5px}
  #vc2032-panel ul{margin:6px 0;padding-left:20px;max-height:190px;overflow:auto}#vc2032-panel li{font-size:11px;margin:4px 0;overflow-wrap:anywhere}
  #vc2032-panel .vc2032-note{font-size:10px;color:#6b8596}`;
  doc.head.append(css);
  const anchor=$('vc2031-pilot');if(anchor?.parentElement===base)anchor.insertAdjacentElement('afterend',section);else base.append(section);
  $('vc2032-preview').addEventListener('click',()=>run(preview));
  $('vc2032-refresh').addEventListener('click',()=>run(checkMirror));
  $('vc2032-stage').addEventListener('click',()=>run(stageBatch));
  $('vc2032-team').addEventListener('change',()=>{last=null;lastMirror=[];render()});
  render();return true;
 }
 function boot(){
  if(!planner){console.warn('V20.3.2 planner missing; migration disabled.');return}
  ensure();new MutationObserver(()=>{if(!$('vc2032-panel'))ensure()}).observe(doc.body,{subtree:true,childList:true});
  connect();window.setInterval(()=>{connect();
   const parent=$('vc16040-sync-modal');
   if(parent&&!parent.hidden&&activeTeam()&&!busy&&account())run(checkMirror);
  },25000);
  window.addEventListener('online',()=>{connect();if(activeTeam())scheduleMirror()});
  doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='visible'&&activeTeam())scheduleMirror()});
  window.addEventListener('vc200:sync-state',render);
 }
 window.VC2032_CONTROLLED_MIGRATION={version:VERSION,preview,readEntities,
  diagnostics:()=>({version:VERSION,observerState:channelState,readAt:lastReadAt,
   rows:lastMirror.length,comparisonReady:!!last,automaticLegacyWrite:false,automaticPilotWrite:false})};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
