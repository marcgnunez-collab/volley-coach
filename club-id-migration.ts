/* V20.5.65 · Identity proposals for a DRY RUN only.
 * Never mutates the input, never assigns real player IDs, never persists.
 * Every proposed row carries an exact preflight guard for future migration.
 */
import {planClubEntities} from './club-entity-plan';

const ARRAY_FIELDS=['jugadores','historial','planificacion','plantillas','sesionActual','temporadas'] as const;
const OTHER_FIELDS=['meta','temporada','temporadaActual','season','seasonName'] as const;
const MAX_PROPOSALS=500;
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const own=(v:Record<string,unknown>,k:string)=>Object.prototype.hasOwnProperty.call(v,k);
const idOf=(row:unknown):string|null=>{
 if(!obj(row))return null;
 for(const key of ['id','uuid','_id']){
  const id=row[key];
  if((typeof id==='string'&&id.trim())||
   (typeof id==='number'&&Number.isSafeInteger(id)))return String(id).trim();
 }
 return null;
};
export interface HistoricIdProposal{
 readonly teamId:string;readonly field:string;readonly index:number;
 readonly beforeJson:string;readonly proposedId:string;
}
export interface HistoricIdPreview{
 readonly schema:1;readonly dryRun:true;readonly authoritative:false;
 readonly proposals:readonly HistoricIdProposal[];
 readonly conflicts:number;readonly invalid:number;
 readonly alreadyIdentified:number;
}

/** Requires a cryptographically random ID supplier; no index-based 'stable' IDs. */
export function previewHistoricIds(raw:unknown,createId:()=>string):Readonly<HistoricIdPreview>{
 if(!obj(raw)||typeof createId!=='function')throw Error('Club o generador de IDs no disponible');
 const proposals:HistoricIdProposal[]=[],generated=new Set<string>();
 let conflicts=0,invalid=0,alreadyIdentified=0;
 for(const teamId of Object.keys(raw).sort()){
  const team=raw[teamId];if(!obj(team))throw Error('Equipo histórico no compatible');
  for(const field of ARRAY_FIELDS){
   if(!own(team,field))continue;
   const list=team[field];if(!Array.isArray(list)){invalid++;continue}
   const allIds=list.map(v=>field==='temporadas'&&typeof v==='string'?v.trim():idOf(v));
   const counts=new Map<string,number>();
   for(const id of allIds)if(id)counts.set(id,(counts.get(id)||0)+1);
   for(let index=0;index<list.length;index++){
    const row=list[index],existing=allIds[index];
    if(existing){
     if((counts.get(existing)||0)>1)conflicts++;
     else alreadyIdentified++;
     continue;
    }
    if(!obj(row)){invalid++;continue}
    if(proposals.length>=MAX_PROPOSALS)throw Error('Demasiadas identidades para un solo ensayo');
    const rawId=createId();
    if(typeof rawId!=='string'||!rawId||rawId.length>128)
     throw Error('Generador de identidad no válido');
    const proposedId='vc-historic-'+rawId;
    if(generated.has(proposedId)||counts.has(proposedId))
     throw Error('Identidad propuesta duplicada');
    generated.add(proposedId);
    const beforeJson=JSON.stringify(row);
    if(typeof beforeJson!=='string'){invalid++;continue}
    proposals.push(Object.freeze({teamId,field,index,beforeJson,proposedId}));
   }
  }
 }
 return Object.freeze({schema:1 as const,dryRun:true as const,authoritative:false as const,
  proposals:Object.freeze(proposals),conflicts,invalid,alreadyIdentified});
}

/** Rehearse against a stripped JSON clone, with guards; nothing is saved. */
export function rehearseHistoricIds(raw:unknown,preview:HistoricIdPreview):Readonly<{
 readonly dryRun:true;readonly applied:number;readonly remaining:number;
 readonly projected:Readonly<Record<string,unknown>>;
}>{
 if(!obj(raw)||preview?.schema!==1||preview.dryRun!==true)
  throw Error('Ensayo de identidades no válido');
 // Copy ONLY the relevant club partitions; exclude scouting, video and secrets.
 const projected:Record<string,unknown>=Object.create(null);
 for(const teamId of Object.keys(raw)){
  const team=raw[teamId];if(!obj(team))throw Error('Equipo incompatible');
  const trimmed:Record<string,unknown>={};
  for(const field of [...ARRAY_FIELDS,...OTHER_FIELDS]){
   if(!own(team,field))continue;
   const json=JSON.stringify(team[field]);
   if(typeof json!=='string')throw Error('Datos históricos no convertibles');
   trimmed[field]=JSON.parse(json);
  }
  Object.defineProperty(projected,teamId,{value:trimmed,enumerable:true,configurable:true,writable:true});
 }
 const seen=new Set<string>();
 // Check every guard before modifying even the temporary clone.
 for(const row of preview.proposals){
  const team=projected[row.teamId];
  if(!obj(team)||!ARRAY_FIELDS.some(f=>f===row.field))throw Error('Ubicación histórica modificada');
  const items=team[row.field];
  if(!Array.isArray(items)||!obj(items[row.index])||
   JSON.stringify(items[row.index])!==row.beforeJson||idOf(items[row.index])!==null)
   throw Error('Los datos originales cambiaron: genera un ensayo nuevo');
  if(seen.has(row.proposedId))throw Error('Identidad propuesta repetida');
  seen.add(row.proposedId);
 }
 for(const row of preview.proposals){
  const team=projected[row.teamId] as Record<string,unknown>;
  (team[row.field] as Record<string,unknown>[])[row.index].id=row.proposedId;
 }
 const after=planClubEntities(projected,'rehearsal-only');
 return Object.freeze({dryRun:true as const,applied:preview.proposals.length,
  remaining:after.missingIds+after.duplicatedIds+after.invalidRecords,
  projected:Object.freeze(projected)});
}
