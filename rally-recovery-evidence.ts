/* V20.5.18 · Read-only recovery evidence for an interrupted native rally write.
 * Never touches storage, global state, the DOM, or the existing CAS writer.
 * Caller-provided snapshots are transient, never included in public reports.
 */
import {asList,asRecord} from './model';
import type {ShadowArea} from './rally-shadow';

export type RecoveryArea=Extract<ShadowArea,'score'|'service'|'rotation'|'set'|'match'|'actions'|'lineup'|'video'>;
export type RecoveryEvidence='not-checked'|'not-configured'|'unreadable'|'unchanged-observed'|
 'durable-before'|'durable-after'|'divergent';

const FIELDS:readonly RecoveryArea[]=Object.freeze(['score','service','rotation','set','match','actions','lineup','video']);
/** Opaque evidence only: it may contain player names and IDs. Do not log or persist it. */
export interface RecoveryFrame{
 readonly identity:string|undefined;
 readonly fields:Readonly<Partial<Record<RecoveryArea,string>>>;
}
const serial=(value:unknown):string|undefined=>{
 try{return JSON.stringify(value);}catch(_){return undefined;}
};
const currentSet=(match:Record<string,unknown>)=>
 asList(match.sets).map(asRecord).find(s=>s&&Number(s.number)===Number(match.currentSet)&&
  Number.isInteger(Number(match.currentSet)))||null;

export function captureRecoveryFrame(input:unknown):Readonly<RecoveryFrame>|null{
 try{
  const m=asRecord(input);
  if(!m)return null;
  const s=currentSet(m),rallies=s&&Array.isArray(s.rallies)?s.rallies:null;
  const last=asRecord(rallies?.at(-1)),live=asRecord(m.liveRally);
  const identity=(typeof m.id==='string'&&m.id.length>0||typeof m.id==='number'&&Number.isFinite(m.id))?
   serial([m.id,m.currentSet]):undefined;
  const fields:Partial<Record<RecoveryArea,string>>={
   score:s?serial([s.scoreUs,s.scoreOpponent]):undefined,
   service:serial(m.servingTeam),
   rotation:serial([m.rotationNo,m.opponentRotationNo]),
   set:s?serial([m.currentSet,asList(m.sets).map(item=>{
    const row=asRecord(item);
    return row?[row.number,row.scoreUs,row.scoreOpponent,row.finished,row.winner]:null;
   })]):undefined,
   match:serial(m.status),
   actions:rallies?serial([rallies.length,last?.id,last?.actions,live?.id,live?.actions]):undefined,
   lineup:serial([m.lineup,m.baseLineup,m.lineupRoles,m.libero]),
   video:serial([last?.liveVideoSessionId,last?.liveVideoStart,last?.liveVideoEnd,
    last?.liveVideoLinkedAt,live?.liveVideoSessionId,live?.liveVideoStart,live?.liveVideoEnd])
  };
  return Object.freeze({identity,fields:Object.freeze(fields)});
 }catch(_){return null;}
}

export function changedRecoveryAreas(before:RecoveryFrame|null,after:RecoveryFrame|null):readonly ShadowArea[]{
 if(!before||!after)return Object.freeze(['missing-data']);
 const areas:ShadowArea[]=[];
 let incomplete=false;
 for(const field of FIELDS){
  if(before.fields[field]===undefined||after.fields[field]===undefined)incomplete=true;
  else if(before.fields[field]!==after.fields[field])areas.push(field);
 }
 if(incomplete)areas.push('missing-data');
 return Object.freeze(areas);
}

/** Equality requires a stable match ID and all eight fields; no partial confirmation. */
export function equalRecoveryFrames(left:RecoveryFrame|null,right:RecoveryFrame|null):boolean{
 return !!left&&!!right&&!!left.identity&&left.identity===right.identity&&
  FIELDS.every(field=>left.fields[field]!==undefined&&right.fields[field]!==undefined&&
   left.fields[field]===right.fields[field]);
}

/** Matches only a LOCAL durable snapshot injected by the original persistence owner.
 * It does not verify remote cloud delivery, durability of a pending journal, or CAS.
 */
export function classifyRecoveryEvidence(before:RecoveryFrame|null,after:RecoveryFrame|null,
 durable:RecoveryFrame|null):RecoveryEvidence{
 if(!before||!after||!durable||!before.identity||!after.identity||!durable.identity||
  before.identity!==after.identity||before.identity!==durable.identity||
  [...FIELDS].some(field=>before.fields[field]===undefined||after.fields[field]===undefined||
   durable.fields[field]===undefined))return 'unreadable';
 if(equalRecoveryFrames(before,after))
  return equalRecoveryFrames(before,durable)?'unchanged-observed':'divergent';
 if(equalRecoveryFrames(durable,after))return 'durable-after';
 if(equalRecoveryFrames(durable,before))return 'durable-before';
 return 'divergent';
}
