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
