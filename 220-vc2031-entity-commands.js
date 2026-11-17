/* Volley Coach V20.3.1 — idempotent entity command contract + durable outbox core.
 * PURE MODULE: it never touches the legacy cloud writer or sport records.
 * Server writes require an explicit pilot action and a deployed RPC migration.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC2031_ENTITY_COMMANDS=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.3.1',MAX_DOCUMENT_BYTES=8*1024*1024;
 const TYPES=Object.freeze({planificacion:'training_plan',historial:'training_session',scoutingMatches:'scouting_match'});
 const text=v=>String(v??'').trim(),obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const error=(code,message)=>Object.assign(new Error(message),{code});
 function identity(value,label){
  const s=text(value);
  if(!s||s.length>160||s==='__proto__'||s==='prototype'||s==='constructor'||/[\u0000-\u001f]/.test(s))
   throw error('VC2031_INVALID_ID',label+' inválido o inestable. No se migrará automáticamente.');
  if(label==='ID de registro'&&s.startsWith('index:'))throw error('VC2031_UNSTABLE_ID','Registro sin ID persistente; no se puede migrar con seguridad.');
  return s;
 }
 function entityType(legacy){
  if(!Object.prototype.hasOwnProperty.call(TYPES,legacy))throw error('VC2031_INVALID_TYPE','Tipo de registro fuera del piloto.');
  return TYPES[legacy];
 }
 function recordFrom(state,{team,type,id}={}){
  const teamKey=identity(team,'Equipo'),entityId=identity(id,'ID de registro'),kind=entityType(type);
  if(!obj(state?.equiposData)||!obj(state.equiposData[teamKey]))
   throw error('VC2031_MISSING_TEAM','El equipo no existe en la copia local.');
  const records=state.equiposData[teamKey][type];
  if(!Array.isArray(records))throw error('VC2031_INVALID_DATA','La colección no es una lista.');
  const candidates=records.filter(record=>obj(record)&&text(record.id)===entityId);
  if(candidates.length!==1)throw error('VC2031_AMBIGUOUS_RECORD',
   candidates.length?'ID repetido. No se enviará ninguno.':'Registro no encontrado.');
  return {teamKey,entityType:kind,entityId,document:clone(candidates[0])};
 }
 function byteLength(s){
  if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(s).length;
  if(typeof Buffer!=='undefined')return Buffer.byteLength(s,'utf8');
  // Fail closed on unsupported environments.
  throw error('VC2031_NO_ENCODING','No hay codificador para verificar el tamaño del registro.');
 }
 function makeCommand({accountId,teamKey,entityType:kind,entityId,expectedRevision=0,
   operation='put',document=null,commandId,createdAt=Date.now()}={}){
  const account=text(accountId);
  if(!uuid.test(account)||!uuid.test(text(commandId)))throw error('VC2031_INVALID_ID','Cuenta o comando sin UUID válido.');
  const team=identity(teamKey,'Equipo'),id=identity(entityId,'ID de registro');
  if(!Object.values(TYPES).includes(kind))throw error('VC2031_INVALID_TYPE','Tipo no admitido.');
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)
   throw error('VC2031_REVISION','La revisión debe ser un entero no negativo.');
  if(!['put','delete'].includes(operation))throw error('VC2031_OPERATION','Operación no admitida.');
  if(operation==='put'&&!obj(document))throw error('VC2031_DOCUMENT','Se requiere un registro JSON.');
  const copied=operation==='put'?clone(document):null;
  if(copied&&byteLength(JSON.stringify(copied))>MAX_DOCUMENT_BYTES)
   throw error('VC2031_CAPACITY','Registro superior a 8 MiB: conserva el JSON y revisa el tamaño.');
  if(copied&&text(copied.id)!==id)throw error('VC2031_ID_MISMATCH','El contenido no coincide con el ID original.');
  return {schema:'vc2031-command',version:VERSION,accountId:account,commandId:text(commandId),
   teamKey:team,entityType:kind,entityId:id,expectedRevision,operation,
   document:copied,createdAt:Number(createdAt)||Date.now()};
 }
 function commandParams(command){
  return {p_command_id:command.commandId,p_team_key:command.teamKey,
   p_entity_type:command.entityType,p_entity_id:command.entityId,
   p_expected_revision:command.expectedRevision,p_operation:command.operation,
   p_document:command.document};
 }
 function verifyStatus(command,result){
  if(!obj(result)||text(result.commandId)!==command.commandId)return false;
  return result.ok===true&&result.status==='applied'&&
   Number.isSafeInteger(result.revision)&&result.revision===command.expectedRevision+1;
 }
 function makeMemoryStore(){
  const data=new Map();return {async get(key){return data.has(key)?clone(data.get(key)):null},
   async put(row){data.set(row.key,clone(row))},async list(){return [...data.values()].map(clone)}};
 }
 function createOutbox({store,transport,now=()=>Date.now()}={}){
  if(!store||!['get','put','list'].every(k=>typeof store[k]==='function')||
     !transport||!['accountId','apply','status'].every(k=>typeof transport[k]==='function'))
   throw error('VC2031_SETUP','Faltan componentes del diario de operaciones.');
  const inflight=new Map();
  const key=c=>c.accountId+':'+c.commandId;
  async function stage(command){
   const c=makeCommand(command),k=key(c);
   const old=await store.get(k);
   if(old){
    // A command ID is immutable even before it reaches Supabase.
    if(JSON.stringify(old.command)!==JSON.stringify(c))
     throw error('VC2031_DUPLICATE_ID','Un ID de comando ya pertenece a otra solicitud local.');
    return clone(old);
   }
   const row={key:k,accountId:c.accountId,command:c,status:'pending',
    attempts:0,createdAt:now(),lastAttemptAt:null,ack:null,lastErrorCode:null};
   await store.put(row);return clone(row);
  }
  async function send({accountId,commandId}={}){
   const acct=text(accountId),id=text(commandId);
   if(!uuid.test(acct)||!uuid.test(id))throw error('VC2031_INVALID_ID','Cuenta o comando inválido.');
   const k=acct+':'+id;
   if(inflight.has(k))return inflight.get(k);
   const work=(async()=>{
    let row=await store.get(k);
    if(!row)return {status:'missing'};
    if(row.status==='acknowledged'||row.status==='conflict')return {status:row.status,ack:row.ack};
    if(text(transport.accountId())!==acct)return {status:'blocked',reason:'account-mismatch'};
    // Retry the SAME commandId after timeouts. No client-side regenerated ID.
    row.attempts++;row.lastAttemptAt=now();await store.put(row);
    let response;
    try{response=await transport.apply(commandParams(row.command));}
    catch(_){return {status:'pending',reason:'network',attempts:row.attempts};}
    if(response?.ok===false&&response?.status==='conflict'&&
       text(response.commandId)===id&&Number.isSafeInteger(response.currentRevision)){
      row.status='conflict';row.ack={currentRevision:response.currentRevision};
      await store.put(row);return {status:'conflict',currentRevision:response.currentRevision};
    }
    if(!verifyStatus(row.command,response))return {status:'pending',reason:'invalid-apply-response'};
    // An RPC response alone is not a durable receipt. Read back the command
    // result from the immutable server command ledger before acknowledging.
    let proof;
    try{proof=await transport.status(id);}
    catch(_){return {status:'pending',reason:'status-unavailable'};}
    if(proof?.found!==true||!verifyStatus(row.command,proof))
     return {status:'pending',reason:'status-unconfirmed'};
    row.status='acknowledged';row.ack={revision:proof.revision,confirmedAt:now()};
    await store.put(row);return {status:'acknowledged',revision:proof.revision};
   })();
   inflight.set(k,work);
   try{return await work}finally{inflight.delete(k)}
  }
  async function reconcile({accountId,commandId}={}){
   const acct=text(accountId),id=text(commandId);
   if(!uuid.test(acct)||!uuid.test(id))throw error('VC2031_INVALID_ID','Cuenta o comando inválido.');
   const row=await store.get(acct+':'+id);
   if(!row)return {status:'missing'};
   if(row.status!=='pending')return {status:row.status,ack:row.ack};
   if(text(transport.accountId())!==acct)return {status:'blocked',reason:'account-mismatch'};
   let proof;
   try{proof=await transport.status(id)}catch(_){return {status:'pending',reason:'status-unavailable'}}
   if(!proof?.found)return {status:'pending',reason:'command-not-found'};
   if(verifyStatus(row.command,proof)){
    row.status='acknowledged';row.ack={revision:proof.revision,confirmedAt:now()};
    await store.put(row);return {status:'acknowledged',revision:proof.revision};
   }
   if(proof.ok===false&&proof.status==='conflict'&&text(proof.commandId)===id&&
      Number.isSafeInteger(proof.currentRevision)){
    row.status='conflict';row.ack={currentRevision:proof.currentRevision};
    await store.put(row);return {status:'conflict',currentRevision:proof.currentRevision};
   }
   return {status:'pending',reason:'invalid-proof'};
  }
  async function inspect(accountId){
   const acct=text(accountId),all=await store.list(),same=all.filter(x=>x.accountId===acct);
   return {version:VERSION,pending:same.filter(x=>x.status==='pending').length,
    conflicts:same.filter(x=>x.status==='conflict').length,
    acknowledged:same.filter(x=>x.status==='acknowledged').length,
    otherAccountPending:all.some(x=>x.accountId!==acct&&x.status==='pending')};
  }
  async function pending(accountId){return (await store.list()).filter(x=>x.accountId===text(accountId)&&x.status==='pending').sort((a,b)=>a.createdAt-b.createdAt).map(clone)}
  return {version:VERSION,stage,send,reconcile,inspect,pending};
 }
 function manifest(state){
  if(!obj(state?.equiposData))throw error('VC2031_INVALID_DATA','Falta equiposData.');
  const teams=[],issues=[];
  for(const [teamKey,team] of Object.entries(state.equiposData)){
   if(!obj(team)){issues.push({teamKey,issue:'invalid-team'});continue;}
   const counts={};
   for(const kind of Object.keys(TYPES)){
    const items=Array.isArray(team[kind])?team[kind]:[],seen=new Set();let stable=0;
    for(const item of items){const id=text(item?.id);
     try{identity(id,'ID de registro')}catch(_){issues.push({teamKey,type:kind,issue:'missing-or-unstable-id'});continue;}
     if(seen.has(id)){issues.push({teamKey,type:kind,issue:'duplicate-id'});continue;}
     seen.add(id);stable++;
    }
    counts[kind]={total:items.length,stable};
   }
   teams.push({teamKey,counts});
  }
  return {version:VERSION,readOnly:true,teams,issues};
 }
 return Object.freeze({VERSION,TYPES,MAX_DOCUMENT_BYTES,recordFrom,makeCommand,commandParams,
  verifyStatus,makeMemoryStore,createOutbox,manifest});
});
