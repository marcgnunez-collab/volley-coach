/* V20.5.73 · Strict, read-only reconstruction of an opt-in training mirror.
 * Export is available only if EVERY stored row, key, order, field presence and
 * source value agrees with the last confirmed canonical club JSON.
 * Never restores or writes to the club, scouting journal or cloud.
 */
import {openExistingTrainingShadow,TRAINING_FIELDS,
 type TrainingPlan,type TrainingRow} from './training-shadow';

export interface TrainingBackupResult{
 readonly status:'ready'|'missing'|'different'|'incomplete'|'incompatible';
 readonly readOnly:true;readonly authoritative:false;
 readonly records:number;readonly pendingIds:number;
 readonly json?:string;
}
interface TrainingReplicaSnapshot{
 readonly manifest:unknown;
 readonly keys:readonly string[];
 readonly rows:ReadonlyMap<string,TrainingRow|undefined>;
}
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const object=(value:unknown):value is Record<string,unknown>=>
 !!value&&typeof value==='object'&&!Array.isArray(value);
const report=(status:TrainingBackupResult['status'],plan:TrainingPlan,
 records=0,json?:string):TrainingBackupResult=>Object.freeze({
 status,readOnly:true,authoritative:false,records,pendingIds:plan.pendingIds,
 ...(json===undefined?{}:{json})
});

/** Reads manifest, all keys and all expected rows from ONE read-only transaction. */
function readSnapshot(db:IDBDatabase,plan:TrainingPlan):Promise<TrainingReplicaSnapshot>{
 return new Promise((resolve,reject)=>{
  let tx:IDBTransaction,manifest:unknown,keys:readonly string[]=[];
  const rows=new Map<string,TrainingRow|undefined>();
  let done=false,failed=false;
  const fail=(reason:unknown)=>{if(!done){done=true;reject(reason||Error('Lectura de entrenamientos incompleta'))}};
  try{tx=db.transaction(['trainingManifest','trainingRows'],'readonly')}
  catch(error){reject(error);return}
  tx.onerror=()=>fail(tx.error);tx.onabort=()=>fail(tx.error);
  tx.oncomplete=()=>{if(!done){done=true;
   if(failed)reject(Error('Lectura de entrenamientos fallida'));
   else resolve({manifest,keys,rows});
  }};
  try{
   const catalog=tx.objectStore('trainingManifest').get('current');
   catalog.onsuccess=()=>{manifest=catalog.result};catalog.onerror=()=>{failed=true};
   const store=tx.objectStore('trainingRows'),all=store.getAllKeys();
   all.onsuccess=()=>{keys=all.result.map(String)};all.onerror=()=>{failed=true};
   for(const expected of plan.rows){
    const item=store.get(expected.key);
    item.onsuccess=()=>rows.set(expected.key,item.result as TrainingRow|undefined);
    item.onerror=()=>{failed=true};
   }
  }catch(error){try{tx.abort()}catch(_){}fail(error)}
 });
}

const manifestMatches=(saved:unknown,plan:TrainingPlan):boolean=>{
 if(!object(saved))return false;
 return saved.schema===1&&saved.pendingIds===0&&saved.totalChars===plan.totalChars&&
  JSON.stringify(saved.teams)===JSON.stringify(plan.teams)&&
  JSON.stringify(saved.keys)===JSON.stringify(plan.rows.map(row=>row.key))&&
  JSON.stringify(saved.layout)===JSON.stringify(plan.layout);
};

/** Rebuilds ONLY training fields, in the original order, without a write. */
export function reconstructTrainingsForBackup(plan:TrainingPlan,
 stored:ReadonlyMap<string,TrainingRow|undefined>):Readonly<Record<string,unknown>>{
 if(plan.schema!==1||!plan.complete)throw Error('Registros de entrenamiento incompletos');
 const teams:Record<string,unknown>=Object.create(null),used=new Set<string>();
 for(const teamId of plan.teams){
  const layout=plan.layout[teamId];
  if(!layout||!object(layout.present)||!object(layout.order))
   throw Error('Distribución de entrenamiento incompatible');
  const fields:Record<string,unknown>=Object.create(null);
  for(const field of TRAINING_FIELDS){
   if(layout.present[field]!==true){
    if(layout.present[field]!==false||own(layout.order,field))
     throw Error('Campo de entrenamiento ausente e inconsistente');
    continue;
   }
   const order=layout.order[field];
   if(!Array.isArray(order))throw Error('Orden histórico no disponible');
   const entries:unknown[]=[];
   for(const key of order){
    if(typeof key!=='string'||used.has(key))throw Error('Clave repetida o inválida');
    used.add(key);
    let parts:unknown;
    try{parts=JSON.parse(key)}catch(_){throw Error('Clave de entrenamiento inválida')}
    if(!Array.isArray(parts)||parts.length!==3||parts[0]!==teamId||
     parts[1]!==field||typeof parts[2]!=='string'||!parts[2])
     throw Error('Clave de entrenamiento incompatible');
    const row=stored.get(key);
    if(!row||row.key!==key||row.teamId!==teamId||row.field!==field||
     typeof row.dataJson!=='string')throw Error('Registro de entrenamiento ausente');
    const value=JSON.parse(row.dataJson);
    if(!object(value))throw Error('Registro de entrenamiento no válido');
    entries.push(value);
   }
   Object.defineProperty(fields,field,{value:entries,enumerable:true});
  }
  if(layout.present.meta===true){
   const key=JSON.stringify([teamId,'meta','singleton']);
   if(used.has(key))throw Error('Metadatos duplicados');used.add(key);
   const row=stored.get(key);
   if(!row||row.key!==key||row.teamId!==teamId||row.field!=='meta'||
    typeof row.dataJson!=='string')throw Error('Metadatos de entrenamiento ausentes');
   Object.defineProperty(fields,'meta',{value:JSON.parse(row.dataJson),enumerable:true});
  }else if(layout.present.meta!==false)throw Error('Presencia de metadatos inválida');
  Object.defineProperty(teams,teamId,{value:fields,enumerable:true});
 }
 if(used.size!==plan.rows.length)throw Error('Hay registros sin correspondencia');
 return Object.freeze(teams);
}

/** Comparison is value-exact and preserves [] versus absent fields. */
function expectedTrainingFields(raw:string,plan:TrainingPlan):Readonly<Record<string,unknown>>{
 const source=JSON.parse(raw);
 if(!object(source)||!object(source.equiposData))throw Error('Club original no válido');
 if(JSON.stringify(Object.keys(source.equiposData).sort())!==JSON.stringify(plan.teams))
  throw Error('Los equipos originales no coinciden');
 const teams:Record<string,unknown>=Object.create(null);
 for(const teamId of plan.teams){
  const team=source.equiposData[teamId];
  if(!object(team))throw Error('Equipo incompatible');
  const fields:Record<string,unknown>=Object.create(null);
  for(const field of [...TRAINING_FIELDS,'meta'])if(own(team,field))
   Object.defineProperty(fields,field,{value:team[field],enumerable:true});
  Object.defineProperty(teams,teamId,{value:fields,enumerable:true});
 }
 return teams;
}

/** A corrupt, outdated or partial mirror never yields a downloadable JSON. */
export async function prepareTrainingShadowBackup(input:{
 readonly factory:Pick<IDBFactory,'open'>;readonly plan:TrainingPlan;
 readonly originalRaw:string;
}):Promise<TrainingBackupResult>{
 if(!input?.factory||typeof input.factory.open!=='function'||input.plan?.schema!==1||
  typeof input.originalRaw!=='string')throw Error('Recuperación de entrenamientos no disponible');
 const {plan}=input;
 if(!plan.complete)return report('incomplete',plan);
 // Never trust a caller-supplied plan to describe a different canonical club.
 try{
  const fresh=JSON.stringify(expectedTrainingFields(input.originalRaw,plan));
  if(fresh.length>6000000)throw Error('Datos originales excesivos');
 }catch(_){return report('different',plan)}
 const db=await openExistingTrainingShadow(input.factory);
 if(!db)return report('missing',plan);
 try{
  const snapshot=await readSnapshot(db,plan);
  if(!manifestMatches(snapshot.manifest,plan))return report('different',plan);
  if(JSON.stringify([...snapshot.keys].sort())!==
   JSON.stringify(plan.rows.map(row=>row.key).sort()))return report('different',plan);
  for(const expected of plan.rows){
   const saved=snapshot.rows.get(expected.key);
   if(saved?.key!==expected.key||saved?.teamId!==expected.teamId||
    saved?.field!==expected.field||saved?.dataJson!==expected.dataJson)
    return report('different',plan);
  }
  try{
   const recovered=reconstructTrainingsForBackup(plan,snapshot.rows);
   const expected=expectedTrainingFields(input.originalRaw,plan);
   if(JSON.stringify(recovered)!==JSON.stringify(expected))return report('different',plan);
   const json=JSON.stringify({schema:'volley-coach-training-backup',version:1,
    scope:'entrenamientos',authoritative:false,
    exportedAt:new Date().toISOString(),teams:recovered});
   if(json.length>6500000)throw Error('Exportación de entrenamiento demasiado grande');
   return report('ready',plan,plan.rows.length,json);
  }catch(_){return report('incompatible',plan)}
 }finally{db.close()}
}
