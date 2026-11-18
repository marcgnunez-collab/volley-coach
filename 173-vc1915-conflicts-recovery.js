/* Volley Coach V19.1.5 · Conflictos por registro y recuperación conservadora.
 * Esta capa solo usa el motor CAS V19.1.4; nunca escribe en Supabase por sí misma.
 * Una copia IndexedDB se confirma ANTES de aplicar una restauración JSON.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api.pure;
 if(root&&root.document){root.VC_V1915_RELIABILITY=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION='20.3.3.1',TYPES=['planificacion','historial','jugadores','scoutingMatches','partidos',
  'plantillas','seasonPlan','teamGoals','scoutingGamePlans','scoutLineupTemplatesV690','scoutRivalProfilesV6100'];
 const MAX_FILE=25*1024*1024,MAX_MANIFEST=400*1024;
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const arr=v=>Array.isArray(v)?v:[];
 const clone=v=>JSON.parse(JSON.stringify(v));
 const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
 function stable(v){
   if(Array.isArray(v))return '['+v.map(x=>stable(x)??'null').join(',')+']';
   if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
   return JSON.stringify(v);
 }
 function digest(v){
   const source=stable(v);let h=2166136261;
   for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}
   return (h>>>0).toString(16).padStart(8,'0')+':'+source.length;
 }
 function recordId(record,type=''){
   const v=record?.id;
   if(v!==undefined&&v!==null&&String(v)!=='')return String(v);
   if(type==='seasonPlan'&&record?.weekStart)return 'week:'+String(record.weekStart);
   if(type==='scoutRivalProfilesV6100'&&record?.key)return 'rival:'+String(record.key);
   return null;
 }
 function indexed(list,type=''){
   const map=new Map();
   for(const r of arr(list)){const id=recordId(r,type);if(id!==null&&!map.has(id))map.set(id,r)}
   return map;
 }
 // Los manifiestos anteriores solo tenían un hash por registro. Guardar también
 // hashes por campo permite fusionar ediciones INDEPENDIENTES sin elegir a ciegas
 // entre dos versiones del mismo entrenamiento, jugador o scouting.
 // Nunca almacenamos los valores sensibles de los registros en localStorage.
 const FIELDS_BUDGET=260*1024;
 const META_FIELDS=new Set(['updatedAt','modifiedAt','syncModifiedAt','manualSavedAt','lastEditedAt']);
 const absent='@vc1919:missing';
 const valueHash=(record,key)=>own(record,key)&&record[key]!==undefined?digest(record[key]):absent;
 const semFields=record=>Object.keys(obj(record)).filter(key=>!META_FIELDS.has(key));
 const semanticDigest=record=>{
   const essential={};for(const key of semFields(record))essential[key]=record[key];
   return digest(essential);
 };
 function makeManifest(state){
   const records={},fields={};
   for(const [team,data] of Object.entries(obj(state?.equiposData))){
     records[team]={};fields[team]={};
     for(const type of TYPES){
       const items={},fieldItems={};
       for(const [id,r] of indexed(data[type],type)){
         items[id]=digest(r);
         fieldItems[id]=Object.fromEntries(Object.keys(obj(r)).map(key=>[key,valueHash(r,key)]));
       }
       records[team][type]=items;fields[team][type]=fieldItems;
     }
   }
   const manifest={schema:'vc1915-record-manifest',version:VERSION,records,fields};
   // Un equipo muy grande puede exceder el presupuesto de localStorage: el
   // modo de seguridad anterior sigue funcionando sin los hashes por campo.
   if(JSON.stringify(manifest).length>FIELDS_BUDGET)delete manifest.fields;
   return manifest;
 }
 function mergeIndependentFields(local,remote,baselineFields){
   if(!baselineFields||typeof baselineFields!=='object')return null;
   const before=obj(baselineFields),lhs=obj(local),rhs=obj(remote);
   const keys=new Set([...Object.keys(before),...Object.keys(lhs),...Object.keys(rhs)]);
   const merged=clone(rhs);let mergedChanges=0;
   for(const key of keys){
     // El ID jamás se mezcla a partir de registros con distinta identidad.
     if(key==='id')continue;
     const previous=own(before,key)?before[key]:absent;
     const lHash=valueHash(lhs,key),rHash=valueHash(rhs,key);
     const lChanged=lHash!==previous,rChanged=rHash!==previous;
     if(lChanged&&rChanged&&lHash!==rHash){
       // Si solo difiere la hora de guardado, no se considera una edición
       // independiente de contenido: se toma el valor remoto y se sigue.
       if(META_FIELDS.has(key))continue;
       return null;
     }
     if(lChanged&&!rChanged){
       if(own(lhs,key))merged[key]=clone(lhs[key]);else delete merged[key];
       mergedChanges++;
     }
   }
   return {merged,mergedChanges};
 }
 function previewValue(value){
   if(value===undefined)return 'sin valor';
   if(value===null)return 'vacío';
   if(Array.isArray(value)){
     if(value.some(item=>Array.isArray(item?.rallies))){
       const rallies=value.reduce((n,set)=>n+arr(set?.rallies).length,0);
       return value.length+' sets · '+rallies+' rallies';
     }
     return value.length+' elementos';
   }
   if(typeof value==='object')return Object.keys(value).length+' propiedades';
   return String(value).slice(0,140);
 }
 function conflictPreview(local,remote,fields){
   return (fields||[]).map(key=>({field:key,local:previewValue(local?.[key]),remote:previewValue(remote?.[key])}));
 }
 function conflictFields(local,remote){
   const fields=new Set([...Object.keys(obj(local)),...Object.keys(obj(remote))]);
   return [...fields].filter(k=>!META_FIELDS.has(k)&&valueHash(obj(local),k)!==valueHash(obj(remote),k)).sort().slice(0,80);
 }

 const conflictKey=(team,type,id)=>JSON.stringify([team,type,id]);
 // V19.1.6: una reversión verificable del último rally NO es una pérdida de
 // datos. Si el rival remoto ha añadido más rallies entretanto, NO se aplica.
 function isMatchingUndo(local,remote){
   const intent=obj(local?.vc1916UndoIntent),setNumber=Number(intent.setNumber);
   if(!intent.rallyId||!setNumber||!Number.isInteger(Number(intent.previousCount)))return false;
   if(String(local?.id)!==String(remote?.id)||Number(local?.currentSet)!==Number(remote?.currentSet))return false;
   const ls=arr(local?.sets),rs=arr(remote?.sets);
   if(ls.length!==rs.length)return false;
   for(let i=0;i<rs.length;i++){
     if(Number(rs[i]?.number)!==Number(ls[i]?.number))return false;
     if(Number(rs[i]?.number)!==setNumber&&digest(rs[i])!==digest(ls[i]))return false;
   }
   const a=ls.find(s=>Number(s.number)===setNumber),b=rs.find(s=>Number(s.number)===setNumber);
   if(!a||!b)return false;
   const al=arr(a.rallies),bl=arr(b.rallies);
   if(bl.length!==Number(intent.previousCount)||al.length!==Number(intent.afterCount)||al.length+1!==bl.length)return false;
   const removed=bl[bl.length-1];
   if(!removed||String(removed.id)!==String(intent.rallyId)||String(local?.liveRally?.id)!==String(removed.id))return false;
   if(!al.every((r,i)=>digest(r)===digest(bl[i])))return false;
   if(!removed.scoreBefore||Number(a.scoreUs)!==Number(removed.scoreBefore.us)||Number(a.scoreOpponent)!==Number(removed.scoreBefore.opponent))return false;
   if(digest(arr(local.liveRally.actions))!==digest(arr(removed.actions)))return false;
   const otherEvents=x=>arr(x?.events).filter(e=>e?.type!=='libero_auto'||String(e.rallyId)!==String(removed.id));
   if(digest(otherEvents(local))!==digest(otherEvents(remote)))return false;
   // El resto de campos de identidad y planificación no se debe sustituir.
   for(const k of ['date','opponent','competition','linkedMatchId','currentSet']){
     if(stable(local?.[k]??null)!==stable(remote?.[k]??null))return false;
   }
   return true;
 }
 function planMerge(local,remote,baseline={},choices={}){
   const base=obj(baseline.records),baseFields=obj(baseline.fields);
   const selected=obj(choices),operations=[],conflicts=[];
   const teams=new Set([...Object.keys(obj(local?.equiposData)),...Object.keys(obj(remote?.equiposData))]);
   for(const team of teams){
     for(const type of TYPES){
       const lm=indexed(local?.equiposData?.[team]?.[type],type),rm=indexed(remote?.equiposData?.[team]?.[type],type);
       const prior=obj(base[team]?.[type]);
       const priorFields=obj(baseFields[team]?.[type]);
       for(const [id,l] of lm){
         if(!rm.has(id))continue;
         const r=rm.get(id),lh=digest(l),rh=digest(r),bh=prior[id];
         if(lh===rh)continue;
         const localChanged=!bh||lh!==bh,remoteChanged=!bh||rh!==bh;
         const key=conflictKey(team,type,id),choice=selected[key];
         // A manual choice is bound to the exact SEMANTIC record on each side.
         // Timestamps and save bookkeeping can change between clicking and the
         // next CAS read. Their changes must not invalidate a legitimate choice;
         // changes to ANY actual training/scouting field still invalidate it.
         const valid=!!(choice&&['local','remote'].includes(choice.use)&&(
           (choice.local===lh&&choice.remote===rh)||
           (choice.localSemantic&&choice.remoteSemantic&&choice.localSemantic===semanticDigest(l)&&choice.remoteSemantic===semanticDigest(r))));
         const causalUndo=type==='scoutingMatches'&&!valid&&isMatchingUndo(l,r);
         // Los datos deportivos son idénticos: los sellos internos de guardado
         // no deben bloquear una sesión con dos dispositivos conectados.
         if(!valid&&!causalUndo&&semanticDigest(l)===semanticDigest(r)){
           operations.push({team,type,id,takeLocal:false,local:lh,remote:rh,metadataOnly:true});
           continue;
         }
         let mergedFields=null;
         if(localChanged&&remoteChanged&&!valid&&!causalUndo){
           mergedFields=mergeIndependentFields(l,r,priorFields[id]);
           if(!mergedFields){
             conflicts.push({key,team,type,id,local:lh,remote:rh,
               localSemantic:semanticDigest(l),remoteSemantic:semanticDigest(r),
               staleDecision:!!choice,
               label:String(l?.nombre||l?.titulo||l?.opponent||r?.nombre||r?.titulo||r?.opponent||id).slice(0,120),
               uncertain:!bh,fields:conflictFields(l,r),preview:conflictPreview(l,r,conflictFields(l,r))});
             continue;
           }
         }
         const takeLocal=valid?choice.use==='local':causalUndo||(localChanged&&!remoteChanged);
         operations.push({team,type,id,takeLocal,local:lh,remote:rh,
           ...(valid?{manualDecision:{key,use:choice.use,expectedSemantic:choice.use==='local'?semanticDigest(l):semanticDigest(r)}}:{}),
           ...(mergedFields?{merged:mergedFields.merged,autoMerged:true}:{})});
       }
     }
   }
   return {conflicts,operations};
 }
 // Choosing one of several conflicts is NOT a CAS-acknowledged resolution.
 // Every independent decision must be collected before attempting one safe
 // write. A previous, now-stale decision is never counted as reviewed.
 function decisionProgress(conflicts=[],deletions=[],choices={}){
   const selected=obj(choices);
   const unreviewed=arr(conflicts).filter(c=>{
     const x=selected[c.key];return !x||!['local','remote'].includes(x.use)||
       !((x.local===c.local&&x.remote===c.remote)||
         (x.localSemantic&&x.remoteSemantic&&x.localSemantic===c.localSemantic&&x.remoteSemantic===c.remoteSemantic));
   });
   const unreviewedDeletions=arr(deletions).filter(c=>{
     const x=selected[c.key];return !x||!['edited','deleted'].includes(x.use)||
       x.editedDigest!==c.editedDigest||x.deletedAt!==c.deletedAt||x.where!==c.where;
   });
   return {unresolved:unreviewed.length+unreviewedDeletions.length,
     chosen:arr(conflicts).length+arr(deletions).length-unreviewed.length-unreviewedDeletions.length,
     total:arr(conflicts).length+arr(deletions).length};
 }

 function mergeGuarded(local,remote,plan,legacy){
   if(plan.conflicts.length)throw Error('Conflictos de edición sin resolver; no se han mezclado los registros.');
   const merged=legacy?legacy.mergePending(local,remote):clone(remote);
   const scoutOverrides={};
   for(const op of plan.operations){
     const localItems=indexed(local?.equiposData?.[op.team]?.[op.type],op.type);
     const remoteItems=indexed(remote?.equiposData?.[op.team]?.[op.type],op.type);
     const source=op.merged||(op.takeLocal?localItems.get(op.id):remoteItems.get(op.id));
     if(!source)continue;
     if(!merged.equiposData)merged.equiposData={};
     if(!merged.equiposData[op.team])merged.equiposData[op.team]={};
     const dest=merged.equiposData[op.team],list=arr(dest[op.type]).slice();
     const idx=list.findIndex(x=>recordId(x,op.type)===op.id);
     if(idx>=0)list[idx]=clone(source);else list.push(clone(source));
     dest[op.type]=list;
     // El motor de scoutings conserva su fusión histórica. Solo se permite
     // sustituir ese resultado tras una decisión explícita registrada aquí.
     if(op.type==='scoutingMatches'){
       if(!scoutOverrides[op.team])scoutOverrides[op.team]={};
       scoutOverrides[op.team][op.id]=clone(source);
     }
   }
   if(Object.keys(scoutOverrides).length)merged.__vc1915ScoutOverrides=scoutOverrides;
   return merged;
 }
 function validateImport(parsed){
   const state=parsed?.schema==='volley-coach-recovery'?parsed.state:parsed;
   if(!state||!state.equiposData||typeof state.equiposData!=='object'||Array.isArray(state.equiposData))throw Error('No es una copia de estado compatible: falta equiposData.');
   const teams=Object.entries(state.equiposData);
   if(!teams.length)throw Error('La copia no contiene equipos.');
   for(const [name,value] of teams){
     if(!name||['__proto__','prototype','constructor'].includes(name)||!value||typeof value!=='object'||Array.isArray(value))throw Error('Equipo inválido en la copia.');
     for(const key of TYPES.concat(['plantillas','sesionActual'])){
       if(value[key]!==undefined&&!Array.isArray(value[key]))throw Error('Campo '+name+'.'+key+' no tiene formato de lista.');
     }
     for(const type of TYPES){
       const seen=new Set();
       for(const item of arr(value[type])){
         const id=recordId(item,type);
         if(id===null)continue;
         if(seen.has(id))throw Error('La copia contiene ID duplicado en '+name+'/'+type+': '+id);
         seen.add(id);
       }
     }
   }
   return state;
 }
 function recoveryPreview(current,backup){
   const rows=[];
   for(const [team,data] of Object.entries(obj(backup?.equiposData))){
     for(const type of TYPES){
       const local=indexed(current?.equiposData?.[team]?.[type],type);let added=0,replaced=0;
       for(const [id,value] of indexed(data[type],type)){
         if(!local.has(id))added++;else if(digest(local.get(id))!==digest(value))replaced++;
       }
       if(added||replaced)rows.push({team,type,added,replaced});
     }
   }
   return rows;
 }
 function mergeBackup(current,backup){
   const result=clone(current);
   result.equiposData=obj(result.equiposData);
   for(const [team,from] of Object.entries(obj(backup.equiposData))){
     const existing=obj(result.equiposData[team]);
     const restored={...existing,...clone(from)};
     for(const type of TYPES){
       const merged=arr(existing[type]).map(clone);
       const indexes=new Map(merged.map((r,i)=>[recordId(r,type),i]).filter(([id])=>id!==null));
       for(const record of arr(from[type])){
         const id=recordId(record,type);
         if(id===null){merged.push(clone(record));continue}
         if(!indexes.has(id)){indexes.set(id,merged.length);merged.push(clone(record))}
         else if(type!=='scoutingMatches'){merged[indexes.get(id)]=clone(record)}
         // Las coincidencias de scouting se conservan en estado local. Para
         // reemplazarlas debe usarse la recuperación específica del scouting.
       }
       restored[type]=merged;
     }
     result.equiposData[team]=restored;
   }
   // No tocar la biblioteca actual salvo cuando esté vacía: la restauración
   // completa de biblioteca la gestiona su importador específico.
   if(!arr(result.bibliotecaCompartida).length&&arr(backup.bibliotecaCompartida).length)
     result.bibliotecaCompartida=clone(backup.bibliotecaCompartida);
   delete result.__vc1915ScoutOverrides;
   return result;
 }
 const pure={VERSION,TYPES,digest,recordId,makeManifest,planMerge,decisionProgress,isMatchingUndo,mergeGuarded,mergeIndependentFields,semanticDigest,conflictFields,conflictPreview,validateImport,recoveryPreview,mergeBackup,conflictKey};
 const context={lastConflicts:[],lastDeletionConflicts:[],pendingResolutions:[],lastPreview:null,lastImport:null,lastError:'',account:'',remoteStamp:'',remoteState:null};
 function install(win){
   const store=win.localStorage, doc=win.document;
   // V19.1.8: cloudUser vive en el ámbito léxico del núcleo, no en window.
   // Consultar únicamente la sesión verificada por el motor CAS (sin usar cachés
   // o IDs de localStorage que podrían pertenecer a otra cuenta).
   const user=()=>String(win.VC_V962_CLOUD_EFFICIENT?.getAccountId?.()||'');
   const baselineKey=id=>'v1915_manifest_'+id;
   const decisionsKey=id=>'v1915_decisions_'+id;
   const pendingKey=id=>'v20252_resolution_pending_'+id;
   function readJSON(key){try{return JSON.parse(store.getItem(key)||'null')}catch(_){return null}}
   function getBaseline(){return readJSON(baselineKey(user()))||{records:{}}}
   function getChoices(){return obj(readJSON(decisionsKey(user())))}
   function getPending(){return arr(readJSON(pendingKey(user()))).filter(p=>p&&p.key&&p.expectedSemantic&&p.team&&p.type&&p.id!==undefined).slice(0,100)}
   function writeJSON(key,data,max=MAX_MANIFEST){const raw=JSON.stringify(data);if(raw.length>max)throw Error('El manifiesto excede el espacio seguro para guardar versiones.');store.setItem(key,raw);if(store.getItem(key)!==raw)throw Error('La versión de sincronización no se guardó correctamente.');}
   function savePending(items){writeJSON(pendingKey(user()),items,100*1024);}
   function captureBaseline(state){
     if(!user())return false;
     writeJSON(baselineKey(user()),makeManifest(state));
     store.removeItem(decisionsKey(user()));
     // The CAS ACK does not replace read-back verification of the specific
     // chosen record. Survive a reload/network failure with a durable marker.
     const pending=getPending();
     context.lastConflicts=[];context.lastDeletionConflicts=[];context.pendingResolutions=pending;
     if(!pending.length)context.remoteState=null;
     notify();return true;
   }
   function finishConfirmedResolution({key,expectedSemantic}){
     if(!user()||!key||!expectedSemantic)throw Error('Resolución sin identidad autenticada.');
     const pending=getPending();
     if(!pending.some(p=>p.key===key&&p.expectedSemantic===expectedSemantic))
       throw Error('La elección ha cambiado y debe verificarse de nuevo.');
     const remaining=pending.filter(p=>!(p.key===key&&p.expectedSemantic===expectedSemantic));
     savePending(remaining);context.pendingResolutions=remaining;
     if(!remaining.length)context.remoteState=null;
     notify();return true;
   }
   function notify(){try{win.dispatchEvent(new win.CustomEvent('vc1915:change'))}catch(_){} }
   function prepare(local,remote,remoteStamp=''){
     if(!user())throw Error('La cuenta de nube no está autenticada o el motor de identidad no está disponible. Vuelve a abrir Conexión nube; no se han aplicado cambios.');
     const baseline=getBaseline(),choices=getChoices();
     const plan=planMerge(local,remote,baseline,choices);
     const deletionIssues=win.VC_V1917_UNIVERSAL?.deletionConflicts?.(local,remote,baseline,digest)||[];
     const deletionDecisions=[],deletionConflicts=[];
     for(const issue of deletionIssues){
       const choice=choices[issue.key];
       if(choice&&['edited','deleted'].includes(choice.use)&&choice.editedDigest===issue.editedDigest&&
           choice.deletedAt===issue.deletedAt&&choice.where===issue.where){
         deletionDecisions.push({...issue,use:choice.use});
       }else deletionConflicts.push(issue);
     }
     plan.deletionDecisions=deletionDecisions;plan.deletionConflicts=deletionConflicts;
     context.lastConflicts=plan.conflicts;context.lastDeletionConflicts=deletionConflicts;
     // A resolved comparison is NOT yet a confirmed cloud upload. Keep its
     // identity visible and retryable until a fresh authenticated read verifies
     // that both copies contain the chosen version.
     const savedPending=getPending();
     const retained=savedPending.filter(p=>!plan.conflicts.some(c=>c.key===p.key));
     const active=plan.operations.filter(op=>op.manualDecision).map(op=>({team:op.team,type:op.type,id:op.id,...op.manualDecision}));
     context.pendingResolutions=[...new Map([...retained,...active].map(p=>[p.key,p])).values()];
     // Migrate valid decisions saved by V20.2.5.1, and discard stale ones.
     if(JSON.stringify(savedPending)!==JSON.stringify(context.pendingResolutions))savePending(context.pendingResolutions);
     context.remoteStamp=remoteStamp;context.account=user();
     context.remoteState=(plan.conflicts.length||deletionConflicts.length||context.pendingResolutions.length)?clone(remote):null;notify();
     return plan;
   }
   function decide(key,use,local,remote){
     if(!['local','remote'].includes(use))throw Error('Resolución inválida.');
     const conflict=context.lastConflicts.find(c=>c.key===key&&c.local===local&&c.remote===remote);
     if(!conflict||context.account!==user())throw Error('El conflicto ya no corresponde al estado actual. Repite la sincronización.');
     const choices=getChoices();choices[key]={use,local,remote,localSemantic:conflict.localSemantic,remoteSemantic:conflict.remoteSemantic};
     writeJSON(decisionsKey(user()),choices,100*1024);
     const chosen={key,team:conflict.team,type:conflict.type,id:conflict.id,use,
       expectedSemantic:use==='local'?conflict.localSemantic:conflict.remoteSemantic};
     const pending=getPending().filter(p=>p.key!==key);pending.push(chosen);
     savePending(pending);context.pendingResolutions=pending;
     // Keep the review visible until the cloud has really confirmed the CAS.
     // A failed upload must not make the only remaining resolution controls
     // disappear before the user can retry safely.
     notify();
     return true;
   }
   function decideDeletion(key,use,editedDigest,deletedAt,where){
     if(!['edited','deleted'].includes(use))throw Error('Elige conservar la edición o confirmar la eliminación.');
     const conflict=context.lastDeletionConflicts.find(c=>c.key===key&&c.editedDigest===editedDigest&&c.deletedAt===deletedAt&&c.where===where);
     if(!conflict||context.account!==user())throw Error('Las versiones del conflicto han cambiado. Sincroniza y revisa de nuevo.');
     const choices=getChoices();choices[key]={use,editedDigest,deletedAt,where};
     writeJSON(decisionsKey(user()),choices,100*1024);
     context.lastDeletionConflicts=context.lastDeletionConflicts.filter(c=>c.key!==key);notify();
     return true;
   }
   function mergeWithDeletionDecisions(local,remote,plan){
     if(plan.deletionConflicts?.length)throw Error('Hay eliminaciones concurrentes sin resolver.');
     const decisions=arr(plan.deletionDecisions);
     if(!decisions.length)return mergeGuarded(local,remote,plan,win.VC_V191_RELIABILITY);
     const universal=win.VC_V1917_UNIVERSAL;
     if(typeof universal?.applyDeletionDecisions!=='function')throw Error('Protección de borrados no disponible.');
     const parts=universal.applyDeletionDecisions(local,remote,decisions);
     const merged=mergeGuarded(parts.local,parts.remote,plan,win.VC_V191_RELIABILITY);
     if(!merged.equiposData)merged.equiposData={};
     // El viejo mergePending no incluye altas locales de scoutingMatches.
     // Preservarlas explícitamente evita que resolver UN conflicto descarte
     // otros scoutings nuevos del mismo equipo. Las bajas con tombstone se
     // siguen filtrando por el motor universal.
     for(const [team,localTeam] of Object.entries(obj(parts.local.equiposData))){
       const destination=merged.equiposData[team]||{};
       merged.equiposData[team]=destination;
       const matches=arr(destination.scoutingMatches).slice();
       const ids=new Set(matches.map(recordId));
       const tombs=universal.tombMap(universal.tombstones(destination,'scoutingMatches'));
       for(const entry of arr(localTeam.scoutingMatches)){
         const id=recordId(entry);
         if(id===null||ids.has(id)||tombs.has(Number(id)))continue;
         matches.push(clone(entry));ids.add(id);
       }
       destination.scoutingMatches=matches;
     }
     for(const decision of decisions){
       const {team,type,id,where,use}=decision;
       const mt=merged.equiposData[team]||{};
       merged.equiposData[team]=mt;
       const list=arr(mt[type]).filter(x=>recordId(x,type)!==String(id));
       if(use==='edited'){
         const from=where==='nube'?parts.local.equiposData[team]:parts.remote.equiposData[team];
         const edited=arr(from?.[type]).find(x=>recordId(x,type)===String(id));
         if(!edited)throw Error('No se encuentra la versión editada. Resolución cancelada.');
         universal.revive(mt,type,id);
         list.push(clone(edited));
         if(type==='scoutingMatches'){
           merged.__vc1915ScoutOverrides=merged.__vc1915ScoutOverrides||{};
           merged.__vc1915ScoutOverrides[team]=merged.__vc1915ScoutOverrides[team]||{};
           merged.__vc1915ScoutOverrides[team][String(id)]=clone(edited);
         }
       }else{
         // Una marca verificable impide que el merge del core reintroduzca
         // este registro desde el estado local que aún no se ha aplicado.
         const deletedAt=Math.max(0,...[parts.local,parts.remote].map(st=>universal.tombMap(universal.tombstones(st.equiposData[team],type)).get(Number(id))||0));
         universal.mark(mt,type,id,deletedAt);
         if(type==='scoutingMatches'&&Number(mt.scoutingActiveId)===Number(id))mt.scoutingActiveId=null;
       }
       mt[type]=list;
     }
     return merged;
   }
   function status(){return {version:VERSION,conflicts:context.lastConflicts.map(x=>({...x})),deletionConflicts:context.lastDeletionConflicts.map(x=>({...x})),pendingResolutions:context.pendingResolutions.map(x=>({...x})),lastError:context.lastError,hasPreview:!!context.lastPreview};}
   const api={version:VERSION,prepare,getBaseline,mergeGuarded:mergeWithDeletionDecisions,captureBaseline,finishConfirmedResolution,status,decide,decideDeletion,pure};
   win.VC_V1915_RELIABILITY=api;
   function element(tag,text){const el=doc.createElement(tag);if(text!==undefined)el.textContent=String(text);return el;}
   let wrapper=null,summary=null,list=null,preview=null,fileInput=null,cloudReview=null;
   function row(parent,text){const p=element('p',text);parent.append(p);return p;}
   function render(){
     if(cloudReview){
       const progress=decisionProgress(context.lastConflicts,context.lastDeletionConflicts,getChoices());
       // Chosen conflicts remain in the comparison until CAS confirmation;
       // count each once even when it also has a durable pending receipt.
       const keys=new Set([...context.lastConflicts,...context.lastDeletionConflicts,...context.pendingResolutions].map(x=>x.key));
       for(const [key,choice] of Object.entries(getChoices())){
         if(choice?.use==='deleted'||choice?.use==='edited')keys.add(key);
       }
       const total=keys.size;
       cloudReview.hidden=!total;
       cloudReview.textContent=total?progress.unresolved?
         'Revisar '+progress.unresolved+' conflicto'+(progress.unresolved===1?'':'s')+' · '+progress.chosen+' elección(es) guardada(s)':
         'Confirmar '+total+' elección'+(total===1?'':'es')+' de sincronización':'';
     }
     if(!wrapper)return;
     list.replaceChildren();const cs=context.lastConflicts,ds=context.lastDeletionConflicts;
     summary.textContent=cs.length||ds.length?(cs.length+ds.length)+' conflicto(s) requieren revisión. No se han sobrescrito datos en la nube.':context.pendingResolutions.length?'Elección guardada; pendiente de comprobar en la nube.':'Sin conflictos pendientes detectados en esta sesión.';
     for(const c of cs){
       const line=element('div');line.className='vc1915-item';
       row(line,c.team+' · '+c.type+' · '+c.label+' (ID '+c.id+')');
       row(line,c.staleDecision?'La versión de datos cambió desde la última elección. Comprueba las dos copias y vuelve a decidir.':c.uncertain?'Sin versión común conocida: es necesario elegir la versión correcta.':'Ambos dispositivos han cambiado este registro.');
       if(c.fields?.length)row(line,'Campos diferentes: '+c.fields.join(', '));
       for(const item of c.preview||[])row(line,item.field+' · este dispositivo: '+item.local+' · nube: '+item.remote);
       for(const [title,choice] of [['Conservar mi versión','local'],['Aceptar versión de nube','remote']]){
         const btn=element('button',title);btn.type='button';btn.addEventListener('click',()=>{
           try{decide(c.key,choice,c.local,c.remote);render();}
           catch(err){context.lastError=String(err.message||err);render()}
         });line.append(btn);
       }
       list.append(line);
     }
     for(const c of ds){
       const line=element('div');line.className='vc1915-item';
       row(line,'EDICIÓN / ELIMINACIÓN · '+c.team+' · '+c.type+' · '+c.label+' (ID '+c.id+')');
       row(line,c.where==='nube'?'La edición está EN ESTE DISPOSITIVO; la nube contiene la eliminación.':'La edición está EN LA NUBE; este dispositivo contiene la eliminación.');
       row(line,'No se decidirá por fecha. Abre «Conexión nube» para crear copias de ambos estados y resolver.');
       list.append(line);
     }
     if(context.lastError)row(list,'Aviso: '+context.lastError);
     if(cs.length||ds.length){
       const progress=decisionProgress(cs,ds,getChoices());
       row(list,progress.unresolved?
         `Elecciones guardadas: ${progress.chosen}. Pendientes: ${progress.unresolved}. Elige todos los registros antes de confirmar la nube.`:
         'Todas las elecciones están registradas. Abre «Conexión nube» y pulsa «Confirmar todas las elecciones».');
     }
   }
   function openRecovery(event){
     const file=event.target.files?.[0];context.lastImport=null;context.lastPreview=null;preview.replaceChildren();
     if(!file)return;
     if(file.size>MAX_FILE){row(preview,'El archivo supera el máximo de 25 MB.');return}
     file.text().then(raw=>{
       const imported=validateImport(JSON.parse(raw));
       const current=win.estadoLocal?.();
       if(!current?.equiposData)throw Error('No se ha podido comprobar el estado local antes de restaurar.');
       const changes=recoveryPreview(current,imported);
       context.lastImport=imported;context.lastPreview=changes;
       row(preview,'Restauración conservadora: se añaden registros ausentes y la copia prevalece en planes, historial y jugadores con el mismo ID. Los scoutings existentes no se reemplazan.');
       for(const c of changes)row(preview,c.team+' · '+c.type+' · '+c.added+' nuevos · '+c.replaced+' diferentes');
       if(!changes.length)row(preview,'No hay diferencias de registros identificadas; pueden existir metadatos de sesión distintos.');
       const btn=element('button','Confirmar restauración protegida');btn.type='button';btn.addEventListener('click',async()=>{
         btn.disabled=true;
         try{
           if(!win.confirm('Se guardará primero una copia local en IndexedDB. Después se fusionarán los registros de la copia. ¿Continuar?'))return;
           const safety=win.VC_V179_SYNC_SAFETY;
           if(typeof safety?.manualBackup!=='function')throw Error('La protección IndexedDB no está disponible. Restauración cancelada.');
           await safety.manualBackup();
           const merged=mergeBackup(win.estadoLocal(),imported);
           if(typeof win.aplicarEstadoCloud!=='function')throw Error('Motor local no disponible.');
           win.aplicarEstadoCloud(merged);
           if(typeof win.guardarEstadoLocalSinCloud!=='function')throw Error('No puede confirmarse el guardado local.');
           win.guardarEstadoLocalSinCloud();
           win.VC_V962_CLOUD_EFFICIENT?.markDirty?.('v1915-protected-recovery');
           row(preview,'Restauración aplicada y guardada localmente. Queda pendiente confirmar la nube y verificar registros.');
           context.lastImport=null;context.lastPreview=null;
         }catch(err){row(preview,'Restauración detenida: '+String(err.message||err));}
         finally{btn.disabled=false}
       });preview.append(btn);
     }).catch(err=>row(preview,'Copia no válida: '+String(err.message||err)));
     fileInput.value='';
   }
   function attach(){
     if(wrapper?.isConnected)return true;
     const host=doc.getElementById('vc191-data-panel')||doc.getElementById('v11-management');
     if(!host)return false;
     if(!doc.getElementById('vc1915-style')){
       const css=element('style');css.id='vc1915-style';css.textContent='#vc1915-panel{padding:14px;margin:12px 0;border:1px solid #c6d9ea;border-radius:11px;background:#f7fbfe;color:#1d4057;font:12px/1.5 system-ui}#vc1915-panel h4{margin:0 0 8px;font-size:15px}#vc1915-panel button{margin:5px 6px 4px 0;padding:9px 12px;border:1px solid #b4cfe2;border-radius:8px;background:white;color:#195377;font-size:12px;font-weight:700;cursor:pointer}#vc1915-panel .vc1915-item{border-top:1px solid #d3e3ee;padding:10px 0}#vc1915-panel p{margin:5px 0}';doc.head.append(css);
     }
     wrapper=element('section');wrapper.id='vc1915-panel';wrapper.append(element('h4','V20.2.5.3 · Conflictos protegidos y restauración JSON'));
     summary=element('p');list=element('div');preview=element('div');fileInput=element('input');fileInput.type='file';fileInput.accept='.json,application/json';fileInput.hidden=true;fileInput.addEventListener('change',openRecovery);
     const select=element('button','Examinar copia JSON');select.type='button';select.addEventListener('click',()=>fileInput.click());
     const cloudStatus=doc.getElementById('cloud-status');
     if(cloudStatus&&!doc.getElementById('vc1919-cloud-review')){
       cloudReview=element('button','Revisar conflictos de sincronización');
       cloudReview.id='vc1919-cloud-review';cloudReview.type='button';cloudReview.hidden=true;
       function downloadStateCopy(state,label){
         if(!state?.equiposData)throw Error('No hay un estado completo que descargar.');
         const content=JSON.stringify({schema:'volley-coach-recovery',version:VERSION,exportedAt:new Date().toISOString(),state},null,2);
         const url=win.URL.createObjectURL(new win.Blob([content],{type:'application/json;charset=utf-8'}));
         const link=element('a');link.href=url;link.download='volley-coach-'+label+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
         doc.body.appendChild(link);link.click();link.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);
       }
       async function protectBothCopies(){
         const safety=win.VC_V179_SYNC_SAFETY;
         if(typeof safety?.manualBackup!=='function'||typeof safety?.backupRemoteState!=='function')
           throw Error('No se pueden respaldar las versiones. No se ha enviado ningún cambio.');
         await safety.manualBackup();
         const latest=await win.VC_V962_CLOUD_EFFICIENT?.readOnlyRemoteSnapshot?.();
         if(!latest?.state)throw Error('No es posible descargar la versión actual de la nube. La operación se ha detenido.');
         await safety.backupRemoteState(latest.state,latest.stamp);
       }
       async function confirmChosenRecord({team,type,id,expectedSemantic}){
         const cloud=win.VC_V962_CLOUD_EFFICIENT;
         if(typeof cloud?.sync!=='function'||typeof cloud.verifyRecord!=='function')
           throw Error('Falta la verificación de lectura de nube V20.2.5.3. Recarga la versión completa de la aplicación.');
         const key=conflictKey(team,type,id);
         // Once CAS has acknowledged the choice, the old decision is removed.
         // Never start a new write with that obsolete choice if either side
         // has since diverged. A read-back can finish it without another write.
         if(!getChoices()[key]){
           const previous=await cloud.verifyRecord({team,type,id,expectedSemantic});
           if(previous.confirmed){finishConfirmedResolution({key,expectedSemantic});return true;}
           if(!previous.localMatches||!previous.remoteMatches)
             throw Error('Una versión cambió después de guardar la elección. Se requiere una nueva comparación antes de escribir de nuevo.');
         }
         let lastProof=null;
         // A local migration may schedule one more protected save while the
         // first CAS write is in flight. Bounded follow-ups are allowed; a
         // missing ACK, altered choice or remote mismatch never counts as OK.
         for(let attempt=0;attempt<3;attempt++){
           await cloud.sync({reason:'v1919-resolve',allowWrite:true,bypassBackoff:true});
           const diagnostics=cloud.diagnostics?.()||{};
           if(diagnostics.lastSyncError)throw Error(String(diagnostics.lastSyncError));
           lastProof=await cloud.verifyRecord({team,type,id,expectedSemantic});
           if(lastProof.confirmed){
             finishConfirmedResolution({key,expectedSemantic});
             return true;
           }
           if(!lastProof.localMatches||!lastProof.remoteMatches)
             throw Error('La versión elegida no coincide con ambos dispositivos. No se hará otra escritura sin revisar los datos.');
           if(!lastProof.dirty)break;
         }
         const status=lastProof?.dirty?'Todavía quedan cambios locales pendientes.':'Los registros no coinciden con la versión elegida.';
         throw Error(status+' La elección está guardada y las copias siguen protegidas; usa «Reintentar confirmación» después de revisar el estado.');
       }
       async function confirmDecisionBatch(){
         const progress=decisionProgress(context.lastConflicts,context.lastDeletionConflicts,getChoices());
         if(progress.unresolved)throw Error(`Quedan ${progress.unresolved} registros sin elegir. Las decisiones ya tomadas están guardadas; elige los restantes antes de subir nada.`);
         const cloud=win.VC_V962_CLOUD_EFFICIENT;
         if(typeof cloud?.sync!=='function'||typeof cloud.verifyRecord!=='function')
           throw Error('El motor de confirmación de nube no está disponible. Recarga todos los módulos de esta versión.');
         const pending=getPending();
         // Exactly one CAS attempt for the whole set of choices. A single
         // record must never be uploaded while sibling conflicts are open.
         const result=await cloud.sync({reason:'v1919-resolve-batch',allowWrite:true,bypassBackoff:true});
         const d=cloud.diagnostics?.()||{};
         if(d.lastSyncError||d.blockedReason)throw Error(String(d.lastSyncError||d.blockedReason));
         if(d.dirty)throw Error('Todavía hay cambios pendientes; no se han confirmado todas las elecciones.');
         if(!pending.length&&result!==true)throw Error('No se ha obtenido confirmación de la nube para las eliminaciones elegidas.');
         const failures=[];let confirmed=0;
         for(const item of pending){
           const proof=await cloud.verifyRecord({team:item.team,type:item.type,id:item.id,expectedSemantic:item.expectedSemantic});
           if(proof?.confirmed){finishConfirmedResolution(item);confirmed++}
           else failures.push(`${item.team}/${item.type} · ID ${item.id}`);
         }
         if(failures.length)throw Error(`${confirmed} de ${pending.length} elecciones verificadas. Sin confirmar: ${failures.join('; ')}. Las copias se mantienen y los avisos no se han eliminado.`);
         return {confirmed,hadDeletions:!pending.length};
       }
       cloudReview.addEventListener('click',()=>{
         // El panel de Gestión también permanece disponible, pero en móviles
         // la revisión debe estar a un toque dentro de Conexión nube.
         const holder=doc.getElementById('vc1919-cloud-conflicts');
         if(holder){holder.hidden=false;holder.replaceChildren();
           holder.append(element('h3','Revisar y confirmar la sincronización'));
           holder.append(element('p',context.lastConflicts.length||context.lastDeletionConflicts.length?
             'La cuenta está conectada, pero existen cambios incompatibles sin resolver. Revisa las dos versiones; no se elegirán por fecha.':
             'No hay un conflicto nuevo detectado, pero queda una confirmación antigua pendiente. La nube puede estar ya al día; verifica el contenido antes de cerrar el aviso.'));
           const backups=element('div');backups.className='vc1919-conflict-actions';
           for(const [label,side] of [['Descargar JSON de este dispositivo','local'],['Descargar JSON de la nube','remote']]){
             const btn=element('button',label);btn.type='button';btn.addEventListener('click',async()=>{
               try{
                 const latest=side==='remote'?await win.VC_V962_CLOUD_EFFICIENT?.readOnlyRemoteSnapshot?.():null;
                 downloadStateCopy(side==='local'?win.estadoLocal?.():latest?.state,side+'-conflicto');
               }
               catch(error){win.alert('No se ha descargado la copia: '+String(error?.message||error));}
             });backups.append(btn);
           }
           holder.append(backups);
           const batchBar=element('div');batchBar.className='vc20331-batch-bar';
           const batchNote=element('p');batchNote.setAttribute('role','status');batchNote.setAttribute('aria-live','polite');
           const batchButton=element('button','Confirmar todas las elecciones');batchButton.type='button';
           function refreshBatchControls(){
             const progress=decisionProgress(context.lastConflicts,context.lastDeletionConflicts,getChoices());
             const pending=getPending().length;
             const hasDeletionChoice=Object.values(getChoices()).some(x=>x?.use==='deleted'||x?.use==='edited');
             batchNote.textContent=progress.unresolved?
               `${progress.chosen} elecciones guardadas. Faltan ${progress.unresolved}. No se enviará nada todavía.`:
               pending||hasDeletionChoice?'Todas las elecciones están listas. Confírmalas juntas para sincronizar y comprobar los registros.':'No quedan elecciones nuevas que confirmar.';
             batchButton.disabled=progress.unresolved>0||!(pending||hasDeletionChoice);
           }
           batchButton.addEventListener('click',async()=>{
             if(batchButton.disabled)return;
             if(!win.confirm('¿Confirmar todas las elecciones guardadas? Se volverán a proteger ambas versiones antes de una única subida y después se comprobarán los registros.'))return;
             batchButton.disabled=true;
             try{
               await protectBothCopies();
               const confirmed=await confirmDecisionBatch();
               win.alert(`Sincronización confirmada. ${confirmed.confirmed} elección(es) verificadas por lectura real de nube.`);
               holder.hidden=true;holder.replaceChildren();
             }catch(error){
               win.alert('La sincronización sigue pendiente. Las decisiones y las copias de seguridad se conservan. '+String(error?.message||error));
               // A failed CAS attempt may have found a newer cloud version.
               // Rebuild from the freshly checked conflict list, not the old
               // on-screen comparison that could invite a futile retry.
               cloudReview.click();
             }
           });
           batchBar.append(batchNote,batchButton);holder.append(batchBar);
           for(const c of context.lastConflicts){
             const rowEl=element('section');rowEl.className='vc1919-conflict-row';
             rowEl.append(element('strong',c.team+' · '+c.type+' · '+c.label));
             if(c.staleDecision)rowEl.append(element('p','La versión cambió después de elegir. Debes revisar de nuevo; ninguna decisión anterior se aplicará sin coincidencia de datos.'));
             rowEl.append(element('p','Campos diferentes: '+(c.fields?.join(', ')||'contenido del registro')));
             for(const item of c.preview||[])rowEl.append(element('p',item.field+' · Este dispositivo: '+item.local+' · Nube: '+item.remote));
             const choiceNote=element('p');choiceNote.className='vc20331-chosen-note';
             function updateChoiceNote(){
               const chosen=getChoices()[c.key];
               choiceNote.textContent=chosen&&decisionProgress([c],[],{[c.key]:chosen}).unresolved===0?
                 `✓ Elección guardada: ${chosen.use==='local'?'este dispositivo':'nube'}. Todavía no se ha subido.`:'';
             }
             updateChoiceNote();rowEl.append(choiceNote);
             const actions=element('div');actions.className='vc1919-conflict-actions';
             for(const [title,choice] of [['Conservar este dispositivo','local'],['Aceptar nube','remote']]){
               const button=element('button',title);button.type='button';button.addEventListener('click',async()=>{
                 if(!win.confirm('Se conservarán copias de seguridad antes de aplicar esta elección. ¿Continuar?'))return;
                 button.disabled=true;
                 try{
                   await protectBothCopies();
                   decide(c.key,choice,c.local,c.remote);
                   updateChoiceNote();refreshBatchControls();
                 }catch(error){win.alert('La resolución no se ha confirmado. Las copias de seguridad permanecen guardadas. '+String(error?.message||error));}
                 finally{button.disabled=false;}
               });actions.append(button);
             }
             rowEl.append(actions);holder.append(rowEl);
           }
           for(const pending of context.pendingResolutions){
             if(context.lastConflicts.some(c=>c.key===pending.key))continue;
             const line=element('section');line.className='vc1919-conflict-row';
             line.append(element('strong','Elección registrada · '+pending.team+' / '+pending.type+' · ID '+pending.id));
             line.append(element('p','Pendiente de confirmación por lectura real de la nube. La decisión se mantiene y no hay que elegir otra vez mientras las versiones no cambien.'));
             const retry=element('button','Reintentar confirmación');retry.type='button';retry.addEventListener('click',async()=>{
               retry.disabled=true;
               try{
                 await protectBothCopies();
                 await confirmDecisionBatch();
                 win.alert('Todas las decisiones pendientes se han comprobado en este dispositivo y en la nube.');
                 const holder=doc.getElementById('vc1919-cloud-conflicts');
                 if(holder){holder.hidden=true;holder.replaceChildren();}
               }catch(error){win.alert('La resolución sigue pendiente. Los respaldos permanecen guardados. '+String(error?.message||error));}
               finally{retry.disabled=false;}
             });line.append(retry);holder.append(line);
             const check=element('button','Comparar estados actuales');check.type='button';check.addEventListener('click',async()=>{
               check.disabled=true;
               try{
                 const proof=await win.VC_V962_CLOUD_EFFICIENT?.compareCurrentRecord?.(pending);
                 if(!proof)throw Error('No está disponible el comprobador V20.2.5.3. Actualiza todos los archivos.');
                 if(proof.dirty||proof.lastSyncError)
                   throw Error(proof.lastSyncError||'Todavía hay cambios locales sin confirmar. No se puede cerrar el aviso.');
                 if(!proof.identical&&!proof.equivalentAfterNormalization)
                   throw Error('Los registros actuales todavía difieren: '+(proof.changedFields||[]).join(', ')+'. Revisa las copias JSON.');
                 const details=proof.summary||{};
                 const info='Entrenamiento actual: '+(details.ejercicios??'?')+' ejercicios, '+(details.jugadores??'?')+
                   ' jugadores y '+(details.duracion??'?')+' minutos.';
                 const message='Se ha comprobado en la nube que los registros actuales '+
                   (proof.identical?'son idénticos.':'contienen los mismos datos tras normalizar campos de visualización.')+
                   '\n\n'+info+'\n\nEsto SOLO cerrará el aviso de confirmación antiguo. NO modificará ni subirá datos. '+
                   'Revisa los JSON de seguridad si esperabas cifras diferentes. ¿Cerrar este aviso?';
                 if(!win.confirm(message))return;
                 await protectBothCopies();
                 finishConfirmedResolution({key:pending.key,expectedSemantic:pending.expectedSemantic});
                 win.alert('Confirmación antigua cerrada tras comparar el contenido actual. No se ha modificado la nube.');
                 const holder=doc.getElementById('vc1919-cloud-conflicts');
                 if(holder){holder.hidden=true;holder.replaceChildren();}
               }catch(error){win.alert('No se ha cerrado el aviso. '+String(error?.message||error));}
               finally{check.disabled=false;}
             });line.append(check);
           }
           for(const c of context.lastDeletionConflicts){
             const card=element('section');card.className='vc1919-conflict-row vc19110-delete-conflict';
             card.append(element('strong','Edición frente a eliminación · '+c.team+' / '+c.type+' · '+c.label+' · ID '+c.id));
             card.append(element('p',c.where==='nube'?'ESTE DISPOSITIVO conserva la edición. LA NUBE contiene la eliminación.':'LA NUBE conserva la edición. ESTE DISPOSITIVO contiene la eliminación.'));
             card.append(element('p',c.uncertain?'No se ha identificado una versión común anterior. Debes decidir tras revisar las copias.':'El registro editado difiere de la última versión confirmada.'));
             const actions=element('div');actions.className='vc1919-conflict-actions';
             for(const [label,use] of [['Conservar edición / recuperar','edited'],['Confirmar eliminación','deleted']]){
               const btn=element('button',label);btn.type='button';btn.addEventListener('click',async()=>{
                 const message=use==='deleted'?'¿Confirmar la ELIMINACIÓN del registro seleccionado? Se guardarán copias de ambos estados antes.':'¿Conservar la EDICIÓN y restaurar el registro seleccionado? Se guardarán copias de ambos estados antes.';
                 if(!win.confirm(message))return;
                 btn.disabled=true;
                 try{
                   const safety=win.VC_V179_SYNC_SAFETY;
                   if(typeof safety?.manualBackup!=='function'||typeof safety?.backupRemoteState!=='function'||!context.remoteState)throw Error('Falta la protección de ambas versiones. Operación cancelada.');
                   await safety.manualBackup();
                   await safety.backupRemoteState(context.remoteState,context.remoteStamp);
                   decideDeletion(c.key,use,c.editedDigest,c.deletedAt,c.where);
                   card.append(element('p','✓ Elección guardada. Se aplicará junto con las restantes al confirmar el lote.'));
                   actions.querySelectorAll('button').forEach(b=>b.disabled=true);
                   refreshBatchControls();
                 }catch(error){win.alert('La nube no confirmó la resolución: '+String(error?.message||error));}
                 finally{btn.disabled=false;}
               });actions.append(btn);
             }
             card.append(actions);holder.append(card);
           }
           refreshBatchControls();
         }
         holder?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
       });
       cloudStatus.insertAdjacentElement('afterend',cloudReview);
       const holder=element('div');holder.id='vc1919-cloud-conflicts';holder.hidden=true;
       cloudReview.insertAdjacentElement('afterend',holder);
       const style=element('style');style.id='vc1919-cloud-style';
       style.textContent='#vc1919-cloud-review{display:block;width:100%;min-height:44px;margin:10px 0;border:1px solid #af6d37;background:#fff4e5;color:#693c1e;border-radius:9px;font:700 13px system-ui;padding:10px}#vc1919-cloud-review[hidden],#vc1919-cloud-conflicts[hidden]{display:none!important}#vc1919-cloud-conflicts{margin:8px 0;padding:12px;border-radius:10px;border:1px solid #d5e1ea;background:#f7fbff;color:#1e405b;font:12px/1.5 system-ui}#vc1919-cloud-conflicts h3{font-size:16px;margin:4px 0 8px}#vc1919-cloud-conflicts p{margin:5px 0 10px}#vc1919-cloud-conflicts .vc1919-conflict-row{border-top:1px solid #d5e1ea;padding:10px 0}#vc1919-cloud-conflicts .vc19110-delete-conflict{background:#fff8ef;border:1px solid #e8c7a1;border-radius:9px;padding:12px;margin:12px 0}#vc1919-cloud-conflicts .vc19110-delete-conflict strong{color:#793f1b}#vc1919-cloud-conflicts .vc1919-conflict-actions{display:flex;flex-wrap:wrap;gap:8px}#vc1919-cloud-conflicts button{min-height:44px;min-width:130px;padding:9px;border-radius:7px;border:1px solid #aec7d8;background:white;color:#1c4563;font:700 12px system-ui}#vc1919-cloud-conflicts button:disabled{opacity:.6;cursor:not-allowed}#vc1919-cloud-conflicts .vc20331-batch-bar{position:sticky;top:0;z-index:4;background:#e8f5ff;border:1px solid #b5d5ee;border-radius:9px;padding:10px;margin:10px 0}#vc1919-cloud-conflicts .vc20331-batch-bar p{font-weight:700;color:#225479}#vc1919-cloud-conflicts .vc20331-batch-bar button{width:100%;background:#1472bd;color:white;border-color:#1472bd}#vc1919-cloud-conflicts .vc20331-chosen-note{color:#216c49;font-weight:800}';
       doc.head.append(style);
     }
     wrapper.append(summary,list,element('p','La restauración requiere una copia previa en IndexedDB. Guarda también una copia JSON en otro dispositivo.'),select,fileInput,preview);
     host.append(wrapper);render();return true;
   }
   win.addEventListener('vc1915:change',render);
   win.addEventListener('vc200:sync-state',()=>{
     if(!user())return;
     if(context.account!==user()){
       context.account=user();context.lastConflicts=[];context.lastDeletionConflicts=[];
       context.pendingResolutions=getPending();context.remoteState=null;
     }
     render();
   });
   if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{
     if(!attach()){const timer=win.setInterval(()=>{if(attach())win.clearInterval(timer)},2000)}
   },{once:true});else if(!attach()){const timer=win.setInterval(()=>{if(attach())win.clearInterval(timer)},2000)}
 }
 return {pure,install};
});
