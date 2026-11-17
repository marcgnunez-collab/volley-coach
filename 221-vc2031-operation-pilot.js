/* Volley Coach V20.3.1 — guarded, opt-in entity-command pilot.
 * Deliberately isolated from the legacy CAS writer and its automatic sync.
 * Running the SQL is a separate administrator action; no live migration here.
 */
(()=>{
 'use strict';
 const VERSION='20.3.1',core=window.VC2031_ENTITY_COMMANDS,doc=document;
 const $=id=>doc.getElementById(id);
 let available=false,lastCapability='No comprobado',busy=false,outbox=null;
 const text=v=>String(v??'');
 const account=()=>{try{return text(cloudUser?.id||'')}catch(_){return ''}};
 const client=()=>{try{return cloudClient||null}catch(_){return null}};
 const cloud=()=>window.VC_V962_CLOUD_EFFICIENT;
 const snapshot=()=>{try{return {equiposData}}catch(_){return null}};
 const unique=()=>{if(!window.crypto?.randomUUID)throw Error('Este navegador no permite generar identificadores criptográficos.');return crypto.randomUUID()};
 function report(message,kind='info'){
  const el=$('vc2031-pilot-message');if(!el)return;
  el.textContent=message;el.dataset.kind=kind;
 }
 async function rpc(name,args){
  const c=client();if(!c||!account())throw Error('Inicia sesión en tu cuenta de Supabase.');
  const {data,error}=await c.rpc(name,args||{});
  if(error)throw Error(error.message||String(error));
  if(!data||typeof data!=='object')throw Error('Respuesta de servidor sin comprobación JSON.');
  return data;
 }
 function openDB(){
  return new Promise((resolve,reject)=>{
   if(!window.indexedDB)return reject(Error('IndexedDB no disponible. No se guardará ninguna operación.'));
   const request=indexedDB.open('vc2031-pilot-command-outbox',1);
   request.onupgradeneeded=()=>{
    const db=request.result;if(!db.objectStoreNames.contains('commands'))db.createObjectStore('commands',{keyPath:'key'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('No se ha podido abrir IndexedDB.'));
  });
 }
 async function transact(mode,runner){
  const db=await openDB();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('commands',mode),store=tx.objectStore('commands');
    let payload;
    tx.oncomplete=()=>resolve(payload);
    tx.onerror=()=>reject(tx.error||Error('Error de IndexedDB.'));
    tx.onabort=()=>reject(tx.error||Error('Escritura local cancelada.'));
    const req=runner(store);
    req.onsuccess=()=>{payload=req.result};
    req.onerror=()=>reject(req.error||Error('Error de lectura en IndexedDB.'));
   });
  }finally{db.close()}
 }
 const store={
  get:key=>transact('readonly',s=>s.get(key)),
  put:row=>transact('readwrite',s=>s.put(row)),
  list:()=>transact('readonly',s=>s.getAll())
 };
 const transport={accountId:account,
  apply:p=>rpc('vc2031_apply_entity_command',p),
  status:commandId=>rpc('vc2031_command_status',{p_command_id:commandId})};
 const engine=()=>outbox||(outbox=core.createOutbox({store,transport}));
 async function capabilities(){
  available=false;
  try{
   const data=await rpc('vc2031_capabilities');
   if(data.version!==VERSION||data.status!=='ready'||data.scope!=='owner-only'||data.idempotent!==true)
    throw Error('El servidor no cumple el contrato de seguridad V20.3.1.');
   await store.list(); // Proof that the durable command journal works BEFORE any write.
   available=true;lastCapability='Esquema piloto disponible · operaciones manuales';
  }catch(err){lastCapability='Piloto no instalado/no disponible: '+text(err.message).slice(0,200)}
  const target=$('vc2031-capability');if(target)target.textContent=lastCapability;
  report(available?'Comprobación correcta. Ningún dato se ha migrado.':lastCapability,available?'ok':'warning');
  await refresh();return {ready:available,description:lastCapability};
 }
 function options(){
  const sel=$('vc2031-plan-select');if(!sel)return;
  const previous=sel.value;
  const plans=[];
  for(const [teamKey,team] of Object.entries(snapshot()?.equiposData||{})){
   for(const record of Array.isArray(team?.planificacion)?team.planificacion:[]){
    if(record?.id===undefined||record?.id===null)continue;
    const id=text(record.id),label=text(record.nombre||record.titulo||record.title||'Entrenamiento');
    try{core.recordFrom(snapshot(),{team:teamKey,type:'planificacion',id})}
    catch(_){continue} // Duplicate or invalid IDs are never proposed for writing.
    plans.push({teamKey,id,label});
   }
  }
  sel.replaceChildren();
  const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='Selecciona un entrenamiento…';sel.append(placeholder);
  for(const p of plans){const option=doc.createElement('option');
   option.value=JSON.stringify([p.teamKey,p.id]);
   option.textContent=`${p.teamKey} · ${p.label} · ${p.id}`.slice(0,210);sel.append(option);
  }
  if([...sel.options].some(x=>x.value===previous))sel.value=previous;
 }
 function selection(){
  const raw=$('vc2031-plan-select')?.value||'';
  if(!raw)throw Error('Elige primero un entrenamiento con ID estable.');
  const [team,id]=JSON.parse(raw);
  return core.recordFrom(snapshot(),{team,type:'planificacion',id});
 }
 async function stageRecord({team,id}={}){
  if(!available)throw Error('Comprueba primero el esquema SQL del piloto.');
  const user=account(),c=cloud(),diag=c?.diagnostics?.()||{};
  if(!user||!client())throw Error('Conecta Supabase antes de preparar una copia.');
  if(diag.dirty||diag.syncing||diag.blockedReason||diag.pendingAccountMismatch||diag.lastSyncError)
   throw Error('La sincronización principal tiene cambios pendientes o protegidos. No se permite preparar la copia.');
  const picked=core.recordFrom(snapshot(),{team,type:'planificacion',id});
  const duplicate=(await engine().pending(user)).find(row=>row.command.teamKey===picked.teamKey&&
   row.command.entityType===picked.entityType&&row.command.entityId===picked.entityId);
  if(duplicate)return duplicate;
  if(typeof c?.compareCurrentRecord!=='function')throw Error('El comparador de nube no está disponible.');
  const proof=await c.compareCurrentRecord({team:picked.teamKey,type:'planificacion',id:picked.entityId});
  if(proof.dirty||proof.lastSyncError||!proof.identical)
   throw Error('El entrenamiento no es idéntico en este dispositivo y en la nube principal. Sin copia piloto.');
  const after=core.recordFrom(snapshot(),{team,type:'planificacion',id});
  if(JSON.stringify(after)!==JSON.stringify(picked)||account()!==user)
   throw Error('El entrenamiento o la sesión cambiaron durante la comparación. Inténtalo otra vez.');
  const command=core.makeCommand({...picked,accountId:user,expectedRevision:0,operation:'put',commandId:unique()});
  // If IndexedDB write is unavailable, stop without calling any cloud mutation.
  const row=await engine().stage(command);
  report('Copia preparada y guardada en IndexedDB con ID '+row.command.commandId+'. No enviada a Supabase.','ok');
  await refresh();return row;
 }
 async function stage(){const picked=selection();return stageRecord({team:picked.teamKey,id:picked.entityId})}
 async function send(commandId){
  if(!available)throw Error('El servidor piloto no está comprobado.');
  const user=account();if(!user)throw Error('Falta sesión autenticada.');
  const row=await store.get(user+':'+commandId);
  if(!row||row.status!=='pending')throw Error('El comando ya no está pendiente en este dispositivo.');
  const diag=cloud()?.diagnostics?.()||{};
  if(diag.dirty||diag.syncing||diag.blockedReason||diag.pendingAccountMismatch||diag.lastSyncError)
   throw Error('La nube principal tiene operaciones sin confirmar. Se conserva el comando local.');
  const current=core.recordFrom(snapshot(),{team:row.command.teamKey,type:'planificacion',id:row.command.entityId});
  if(JSON.stringify(current.document)!==JSON.stringify(row.command.document))
   throw Error('El entrenamiento cambió desde que se preparó. No se enviará una copia antigua.');
  const comparison=await cloud()?.compareCurrentRecord?.({team:row.command.teamKey,type:'planificacion',id:row.command.entityId});
  if(!comparison?.identical||comparison.dirty||comparison.lastSyncError||account()!==user)
   throw Error('La nube principal ya no confirma la misma versión. Se conserva el comando local sin enviarlo.');
  const result=await engine().send({accountId:user,commandId});
  report(result.status==='acknowledged'?'Comando confirmado por el servidor (revisión '+result.revision+'). La sincronización principal no se ha modificado.':
   result.status==='conflict'?'Conflicto de revisión: el servidor ya tiene otra versión. No se sobrescribió.':
   'Comando pendiente o no confirmado. Se conserva en IndexedDB para reintentar con el mismo ID.',
   result.status==='acknowledged'?'ok':'warning');
  await refresh();return result;
 }
 async function reconcile(commandId){
  const result=await engine().reconcile({accountId:account(),commandId});
  report(result.status==='acknowledged'?'El servidor confirma que esta operación ya se aplicó. Diario local actualizado.':
   result.status==='conflict'?'Conflicto confirmado por el servidor. Sin sobrescritura.':
   'El servidor todavía no confirma esta operación. La copia local permanece pendiente.',
   result.status==='acknowledged'?'ok':'warning');
  await refresh();return result;
 }
 async function refresh(){
  options();
  const el=$('vc2031-outbox'),btn=$('vc2031-stage');if(!el)return;
  if(btn)btn.disabled=!available||busy;
  const rows=await engine().pending(account()).catch(()=>[]);
  el.replaceChildren();
  if(!rows.length){el.textContent='Sin operaciones piloto pendientes en este dispositivo.';return;}
  for(const row of rows){
   const item=doc.createElement('div');item.className='vc2031-item';
   const note=doc.createElement('span');note.textContent=`${row.command.teamKey} · ${row.command.entityId} · ${row.command.commandId.slice(0,8)} · intentos ${row.attempts}`;
   const button=doc.createElement('button');button.type='button';button.textContent='Confirmar envío / Reintentar';
   const check=doc.createElement('button');check.type='button';check.textContent='Comprobar servidor';
   button.disabled=!available||busy;
   check.disabled=!available||busy;
   check.addEventListener('click',()=>action(()=>reconcile(row.command.commandId)));
   button.addEventListener('click',()=>{
    if(!confirm('V20.3.1 PILOTO: se escribirá UNA COPIA INDEPENDIENTE de este entrenamiento en las nuevas tablas. No modifica el entrenamiento normal ni activa la migración. ¿Continuar?'))return;
    action(()=>send(row.command.commandId));
   });
   item.append(note,check,button);el.append(item);
  }
 }
 async function action(work){
  if(busy)return;busy=true;
  try{await work()}catch(err){report(text(err?.message||err),'error')}
  finally{busy=false;try{await refresh()}catch(_){}}
 }
 function ensure(){
  const base=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return false;
  if($('vc2031-pilot'))return true;
  const section=doc.createElement('section');section.id='vc2031-pilot';
  section.innerHTML=`<div class="vc2031-heading"><small>V20.3.1 · OPERACIONES POR REGISTRO</small><strong>Piloto aislado y seguro</strong></div>
  <p>La sincronización normal continúa siendo la principal. Este piloto no migra ni sobrescribe automáticamente entrenamientos, scouting o vídeos.</p>
  <div class="vc2031-actions"><button type="button" id="vc2031-check">Comprobar esquema SQL</button><button type="button" id="vc2031-inventory">Inventario local (solo lectura)</button></div>
  <p id="vc2031-capability">Piloto sin activar · esquema no comprobado</p>
  <label for="vc2031-plan-select">Primer ensayo: una copia separada de un entrenamiento</label>
  <select id="vc2031-plan-select"><option value="">Selecciona un entrenamiento…</option></select>
  <div class="vc2031-actions"><button type="button" id="vc2031-stage" disabled>Preparar copia local, sin enviar</button></div>
  <p id="vc2031-pilot-message" role="status">Ejecuta el SQL piloto manualmente solo tras guardar un respaldo. La comprobación no escribe datos.</p>
  <h4>Operaciones preparadas (confirmación individual)</h4><div id="vc2031-outbox">Sin operaciones piloto pendientes.</div>
  <p class="vc2031-warning">No es aún la edición colaborativa final. Para activar la transición hará falta probar dos dispositivos, permisos por club y compatibilidad de registros. No ejecutes el SQL sin copia de seguridad.</p>`;
  const style=doc.createElement('style');style.id='vc2031-style';style.textContent=`
  #vc2031-pilot{border:1px solid #c5d9e8;border-radius:12px;padding:15px;background:#f5faff;margin:12px 0;font:12px/1.5 system-ui,sans-serif;color:#23465e}
  #vc2031-pilot .vc2031-heading{display:grid;gap:3px}#vc2031-pilot .vc2031-heading small{font-size:10px;color:#3a7598;font-weight:800;letter-spacing:.08em}
  #vc2031-pilot .vc2031-heading strong{font-size:16px}#vc2031-pilot p{margin:9px 0;font-size:11px}
  #vc2031-pilot label{display:block;font-weight:700;margin:12px 0 5px}
  #vc2031-pilot select{width:100%;border:1px solid #abc8dc;border-radius:8px;padding:9px;background:#fff;color:#23465e}
  #vc2031-pilot .vc2031-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  #vc2031-pilot button{background:#fff;border:1px solid #95b8d1;color:#255a7d;padding:9px 12px}
  #vc2031-pilot #vc2031-capability{padding:8px;background:#fff;border:1px solid #d5e4ee;border-radius:7px}
  #vc2031-pilot #vc2031-pilot-message[data-kind="error"]{color:#9a3d30;font-weight:750}
  #vc2031-pilot #vc2031-pilot-message[data-kind="ok"]{color:#247354;font-weight:750}
  #vc2031-pilot #vc2031-pilot-message[data-kind="warning"]{color:#996323}
  #vc2031-pilot h4{font-size:12px;margin:14px 0 5px}
  #vc2031-pilot .vc2031-item{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;border:1px solid #d6e5ef;padding:9px;border-radius:8px;margin-bottom:6px;overflow-wrap:anywhere}
  #vc2031-pilot .vc2031-item span{min-width:0}#vc2031-pilot .vc2031-warning{color:#755c4c;font-size:10px}
  @media(max-width:620px){#vc2031-pilot .vc2031-item{display:grid}}`;
  doc.head.append(style);
  const anchor=$('vc2030-sync-evidence');if(anchor?.parentElement===base)anchor.insertAdjacentElement('afterend',section);else base.append(section);
  $('vc2031-check').addEventListener('click',()=>action(capabilities));
  $('vc2031-inventory').addEventListener('click',()=>action(async()=>{
   const data=core.manifest(snapshot());
   const count=data.teams.reduce((a,t)=>a+Object.values(t.counts).reduce((b,c)=>b+c.total,0),0);
   report(`Inventario local: ${data.teams.length} equipos, ${count} registros; ${data.issues.length} incidencias de ID. Nada enviado.`,data.issues.length?'warning':'ok');
  }));
  $('vc2031-stage').addEventListener('click',()=>action(stage));
  refresh().catch(err=>report(err.message,'error'));
  return true;
 }
 function boot(){
  if(!core){console.warn('V20.3.1: módulo de comandos ausente. Piloto desactivado.');return}
  ensure();
  const observer=new MutationObserver(()=>{if(!$('vc2031-pilot'))ensure()});
  observer.observe(doc.body,{childList:true,subtree:true});
  window.addEventListener('vc200:sync-state',()=>{if($('vc2031-pilot'))refresh().catch(()=>{})});
  doc.addEventListener('click',event=>{if(event.target?.closest?.('#vc16040-sync-modal'))setTimeout(()=>refresh().catch(()=>{}),80)},true);
 }
 window.VC2031_PILOT={version:VERSION,capabilities,manifest:()=>core.manifest(snapshot()),
  status:async()=>({ready:available,description:lastCapability,...await engine().inspect(account())}),
  stage,stageRecord,send,reconcile,refresh};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
