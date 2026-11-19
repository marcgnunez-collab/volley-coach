/* V20.5.26 · Ephemeral indexes scoped to ONE normalized read-only projection.
 * No match ID cache, storage, background work or native write subscription.
 * A post-rally correction creates a fresh projection and therefore a fresh index.
 */
import type {NormalizedAnalysis,NormalizedContact,NormalizedRally,
 NormalizedPossession,NormalizedChain} from './analysis-normalizer';

type RallyRows={
 readonly contacts:NormalizedContact[];readonly possessions:NormalizedPossession[];
 readonly chains:NormalizedChain[];
};
interface SnapshotIndex{
 readonly contactsRef:NormalizedAnalysis['contacts'];readonly ralliesRef:NormalizedAnalysis['rallies'];
 readonly possessionsRef:NormalizedAnalysis['possessions'];readonly chainsRef:NormalizedAnalysis['chains'];
 readonly lengths:readonly [number,number,number,number];readonly canonical:boolean;
 readonly contacts:Map<string,NormalizedContact[]>;
 readonly possessions:Map<string,NormalizedPossession[]>;
 readonly chains:Map<string,NormalizedChain[]>;
 readonly contactsByPossession:Map<string,NormalizedContact[]>;
 readonly byTeam:Map<string,NormalizedContact[]>;
 readonly bySkill:Map<string,NormalizedContact[]>;
 readonly byEvaluation:Map<string,NormalizedContact[]>;
 readonly byPlayer:Map<string,NormalizedContact[]>;
 readonly byStartZone:Map<string,NormalizedContact[]>;
 readonly byEndZone:Map<string,NormalizedContact[]>;
 readonly videoContacts:NormalizedContact[];
 readonly estimatedReferenceBytes:number;
}
const indexes=new WeakMap<NormalizedAnalysis,SnapshotIndex>();
let builds=0,hits=0,invalidations=0,unsupported=0;
let dimensionUses=0,avoidedContactScans=0,lastEstimatedBytes=0,peakEstimatedBytes=0,
 skippedMemoryLimit=0;
// This is an indexing cap, not a limit on scouting size or match data.
export const MAX_INDEXED_CONTACTS=40000;

function buildIndex(data:NormalizedAnalysis):SnapshotIndex{
 const order=new Map<string,number>();let canonical=true;
 for(const [position,r] of data.rallies.entries()){
  if(order.has(r.key))canonical=false; // Duplicate native IDs: preserve legacy scan order.
  order.set(r.key,position);
 }
 const contacts=new Map<string,NormalizedContact[]>(),
  possessions=new Map<string,NormalizedPossession[]>(),
  chains=new Map<string,NormalizedChain[]>(),
  contactsByPossession=new Map<string,NormalizedContact[]>(),
  byTeam=new Map<string,NormalizedContact[]>(),bySkill=new Map<string,NormalizedContact[]>(),
  byEvaluation=new Map<string,NormalizedContact[]>(),byPlayer=new Map<string,NormalizedContact[]>(),
  byStartZone=new Map<string,NormalizedContact[]>(),byEndZone=new Map<string,NormalizedContact[]>(),
  videoContacts:NormalizedContact[]=[];
 let estimatedReferences=0;
 const add=(map:Map<string,NormalizedContact[]>,key:string|undefined|null,contact:NormalizedContact)=>{
  if(!key)return;
  const group=map.get(key);
  if(group)group.push(contact);else map.set(key,[contact]);
  estimatedReferences++;
 };
 const collect=<T extends {readonly rallyKey:string}>(rows:readonly T[],map:Map<string,T[]>)=>{
  let last=-1;
  for(const row of rows){
   const position=order.get(row.rallyKey);
   if(position===undefined||position<last){canonical=false;}
   else last=position;
   const group=map.get(row.rallyKey);
   if(group)group.push(row);else map.set(row.rallyKey,[row]);
  }
 };
 collect(data.contacts,contacts);collect(data.possessions,possessions);collect(data.chains,chains);
 for(const contact of data.contacts){
  add(contactsByPossession,contact.possessionKey,contact);
  add(byTeam,contact.team,contact);
  add(bySkill,contact.skill,contact);
  add(byEvaluation,contact.evaluation,contact);
  add(byPlayer,contact.player?.toLocaleLowerCase('es'),contact);
  add(byStartZone,contact.fields.startZone?.code,contact);
  add(byEndZone,contact.fields.endZone?.code,contact);
  if(contact.video){videoContacts.push(contact);estimatedReferences++;}
 }
 // Existing per-rally references, plus the optional dimension lists above.
 estimatedReferences+=data.contacts.length+data.possessions.length+data.chains.length;
 const estimatedReferenceBytes=estimatedReferences*8;
 lastEstimatedBytes=estimatedReferenceBytes;
 peakEstimatedBytes=Math.max(peakEstimatedBytes,estimatedReferenceBytes);
 builds++;if(!canonical)unsupported++;
 return {contactsRef:data.contacts,ralliesRef:data.rallies,
  possessionsRef:data.possessions,chainsRef:data.chains,
  lengths:[data.rallies.length,data.contacts.length,data.possessions.length,data.chains.length],
  canonical,contacts,possessions,chains,contactsByPossession,
  byTeam,bySkill,byEvaluation,byPlayer,byStartZone,byEndZone,videoContacts,
  estimatedReferenceBytes};
}
function indexFor(data:NormalizedAnalysis):SnapshotIndex{
 const existing=indexes.get(data);
 if(existing&&existing.contactsRef===data.contacts&&existing.ralliesRef===data.rallies&&
  existing.possessionsRef===data.possessions&&existing.chainsRef===data.chains&&
  existing.lengths[0]===data.rallies.length&&existing.lengths[1]===data.contacts.length&&
  existing.lengths[2]===data.possessions.length&&existing.lengths[3]===data.chains.length){
  hits++;return existing;
 }
 if(existing){invalidations++;indexes.delete(data);}
 const next=buildIndex(data);indexes.set(data,next);return next;
}

function gather<T>(rallies:readonly NormalizedRally[],index:Map<string,T[]>):T[]{
 const result:T[]=[];
 for(const rally of rallies){const list=index.get(rally.key);if(list)for(const row of list)result.push(row);}
 return result;
}

/** Selective indexes only; full-set queries keep their proven streaming path. */
export function readIndexedRallies(data:NormalizedAnalysis,rallies:readonly NormalizedRally[]):RallyRows|null{
 if(data.rallies.length<40||rallies.length*2>data.rallies.length)return null;
 if(data.contacts.length>MAX_INDEXED_CONTACTS){skippedMemoryLimit++;return null;}
 const index=indexFor(data);
 if(!index.canonical)return null;
 return {contacts:gather(rallies,index.contacts),
  possessions:gather(rallies,index.possessions),chains:gather(rallies,index.chains)};
}

export interface AnalysisContactConstraints{
 readonly team?:string|null;readonly skill?:string;readonly evaluation?:string;
 readonly player?:string;readonly startZone?:string|null;readonly endZone?:string|null;
 readonly video?:boolean;
}

/** Smallest ordered candidate bucket. Remaining predicates still run unchanged. */
export function readIndexedContactCandidates(data:NormalizedAnalysis,
 constraints:AnalysisContactConstraints,baselineSize:number):readonly NormalizedContact[]|null{
 if(data.contacts.length<80||data.contacts.length>MAX_INDEXED_CONTACTS){
  if(data.contacts.length>MAX_INDEXED_CONTACTS)skippedMemoryLimit++;
  return null;
 }
 if(!constraints.team&&!constraints.skill&&!constraints.evaluation&&!constraints.player&&
  !constraints.startZone&&!constraints.endZone&&!constraints.video)return null;
 const index=indexFor(data);
 if(!index.canonical)return null;
 const options:readonly (readonly NormalizedContact[])[]=[
  ...(constraints.team?[index.byTeam.get(constraints.team)||[]]:[]),
  ...(constraints.skill?[index.bySkill.get(constraints.skill)||[]]:[]),
  ...(constraints.evaluation?[index.byEvaluation.get(constraints.evaluation)||[]]:[]),
  ...(constraints.player?[index.byPlayer.get(constraints.player)||[]]:[]),
  ...(constraints.startZone?[index.byStartZone.get(constraints.startZone)||[]]:[]),
  ...(constraints.endZone?[index.byEndZone.get(constraints.endZone)||[]]:[]),
  ...(constraints.video?[index.videoContacts]:[])
 ];
 let smallest:readonly NormalizedContact[]|null=null;
 for(const candidate of options)if(candidate.length<baselineSize&&
  (!smallest||candidate.length<smallest.length))smallest=candidate;
 if(smallest){dimensionUses++;avoidedContactScans+=baselineSize-smallest.length;}
 return smallest;
}

/** Call after directly changing structural keys or reordering an old projection. */
export function invalidateAnalysisIndex(data:NormalizedAnalysis):void{
 if(indexes.delete(data))invalidations++;
}

export interface AnalysisIndexDiagnostics{
 readonly readOnly:true;readonly builds:number;readonly hits:number;
 readonly invalidations:number;readonly unsupported:number;
 readonly dimensionUses:number;readonly avoidedContactScans:number;
 readonly lastEstimatedReferenceBytes:number;readonly peakEstimatedReferenceBytes:number;
 readonly maxIndexedContacts:number;readonly skippedMemoryLimit:number;
}
export function inspectAnalysisIndexDiagnostics():Readonly<AnalysisIndexDiagnostics>{
 return Object.freeze({readOnly:true,builds,hits,invalidations,unsupported,
  dimensionUses,avoidedContactScans,lastEstimatedReferenceBytes:lastEstimatedBytes,
  peakEstimatedReferenceBytes:peakEstimatedBytes,
  maxIndexedContacts:MAX_INDEXED_CONTACTS,skippedMemoryLimit});
}
