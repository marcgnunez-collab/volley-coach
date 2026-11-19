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
}
const indexes=new WeakMap<NormalizedAnalysis,SnapshotIndex>();
let builds=0,hits=0,invalidations=0,unsupported=0;

function buildIndex(data:NormalizedAnalysis):SnapshotIndex{
 const order=new Map<string,number>();let canonical=true;
 for(const [position,r] of data.rallies.entries()){
  if(order.has(r.key))canonical=false; // Duplicate native IDs: preserve legacy scan order.
  order.set(r.key,position);
 }
 const contacts=new Map<string,NormalizedContact[]>(),
  possessions=new Map<string,NormalizedPossession[]>(),
  chains=new Map<string,NormalizedChain[]>(),
  contactsByPossession=new Map<string,NormalizedContact[]>();
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
 for(const contact of data.contacts)if(contact.possessionKey){
  const group=contactsByPossession.get(contact.possessionKey);
  if(group)group.push(contact);else contactsByPossession.set(contact.possessionKey,[contact]);
 }
 builds++;if(!canonical)unsupported++;
 return {contactsRef:data.contacts,ralliesRef:data.rallies,
  possessionsRef:data.possessions,chainsRef:data.chains,
  lengths:[data.rallies.length,data.contacts.length,data.possessions.length,data.chains.length],
  canonical,contacts,possessions,chains,contactsByPossession};
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
 const index=indexFor(data);
 if(!index.canonical)return null;
 return {contacts:gather(rallies,index.contacts),
  possessions:gather(rallies,index.possessions),chains:gather(rallies,index.chains)};
}

/** Call after directly changing structural keys or reordering an old projection. */
export function invalidateAnalysisIndex(data:NormalizedAnalysis):void{
 if(indexes.delete(data))invalidations++;
}

export interface AnalysisIndexDiagnostics{
 readonly readOnly:true;readonly builds:number;readonly hits:number;
 readonly invalidations:number;readonly unsupported:number;
}
export function inspectAnalysisIndexDiagnostics():Readonly<AnalysisIndexDiagnostics>{
 return Object.freeze({readOnly:true,builds,hits,invalidations,unsupported});
}
