/* Volley Coach V20.3.2 — READ-ONLY, deterministic three-way migration planner.
 * The legacy cloud copy remains canonical. Never overwrites either copy.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC2032_MIGRATION_PLANNER=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.3.2',KINDS=Object.freeze({planificacion:'training_plan',historial:'training_session',scoutingMatches:'scouting_match'});
 const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const id=x=>String(x??'').trim();
 function normalizedJSON(value){
  const plain=clone(value);
  function sorted(x){
   if(Array.isArray(x))return x.map(sorted);
   if(isObject(x)){const result={};for(const k of Object.keys(x).sort())result[k]=sorted(x[k]);return result}
   return x;
  }
  return JSON.stringify(sorted(plain));
 }
 function index(items,label){
  const rows=new Map(),issues=[];
  if(!Array.isArray(items)){issues.push({source:label,issue:'not-an-array'});return {rows,issues}}
  for(const item of items){
   if(!isObject(item)){issues.push({source:label,issue:'invalid-object'});continue}
   const key=id(item.id);
   if(!key||key.startsWith('index:')||key.length>160||['__proto__','prototype','constructor'].includes(key)||/[\u0000-\u001f]/.test(key)){
    issues.push({source:label,issue:'missing-or-unstable-id'});continue;
   }
   if(rows.has(key)){issues.push({source:label,issue:'duplicate-id',id:key});continue}
   rows.set(key,item);
  }
  return {rows,issues};
 }
 function compare({localState,legacyCloudState,serverRecords=[],teamKey,type='planificacion'}={}){
  if(!Object.prototype.hasOwnProperty.call(KINDS,type))throw Error('Tipo no permitido para la migración.');
  const team=id(teamKey);
  if(!team||team.length>160)throw Error('Equipo inválido.');
  if(!isObject(localState?.equiposData)||!isObject(legacyCloudState?.equiposData))throw Error('Falta estado local o nube principal.');
  const local=index(localState.equiposData[team]?.[type]||[],'dispositivo');
  const cloud=index(legacyCloudState.equiposData[team]?.[type]||[],'nube-principal');
  if(!Array.isArray(serverRecords))throw Error('La lectura de entidades no es una lista completa.');
  const pilotRows=new Map(),issues=[...local.issues,...cloud.issues];
  for(const row of serverRecords){
   if(!isObject(row)||id(row.entity_id)===''||row.team_key!==team||row.entity_type!==KINDS[type]||
      !Number.isSafeInteger(row.revision)||row.revision<1){
    issues.push({source:'nube-entidades',issue:'invalid-server-record'});continue;
   }
   const key=id(row.entity_id);
   if(pilotRows.has(key)){issues.push({source:'nube-entidades',issue:'duplicate-id',id:key});continue}
   pilotRows.set(key,row);
  }
  const all=[...new Set([...local.rows.keys(),...cloud.rows.keys(),...pilotRows.keys()])].sort();
  const entries=[];const totals={ready:0,confirmed:0,legacyConflict:0,pilotConflict:0,orphanPilot:0};
  for(const key of all){
   const a=local.rows.get(key),b=cloud.rows.get(key),c=pilotRows.get(key);
   let status;
   if(!a||!b)status=c&&!a&&!b?'orphanPilot':'legacyConflict';
   else if(normalizedJSON(a)!==normalizedJSON(b))status='legacyConflict';
   else if(!c)status='ready';
   else if(c.deleted===true||!isObject(c.document)||normalizedJSON(a)!==normalizedJSON(c.document))status='pilotConflict';
   else status='confirmed';
   totals[status]++;
   entries.push({id:key,status,serverRevision:c?.revision||0});
  }
  return {version:VERSION,teamKey:team,type,readOnly:true,complete:true,
   issues,blocked:issues.length>0,totals,entries,
   readyIds:issues.length?[]:entries.filter(e=>e.status==='ready').map(e=>e.id)};
 }
 return Object.freeze({VERSION,KINDS,normalizedJSON,compare});
});
