/* V20.5.17 · Explicit, opt-in transaction pilot with partial native failure detection.
 * NOT installed in the live UI. No storage, cloud, DOM, global overrides or retry.
 * Its only mutation is a caller-supplied ORIGINAL native command, once per task.
 */
import {asList,asRecord,asScore,isRotation,isTeam,type Score,type Team} from './model';
import {planAwardPoint,planUndoLastRally,type RallyCommandPlan} from './rally-transition';
import {compareConfirmedPoint,type ShadowArea,type ShadowVerdict} from './rally-shadow';

export interface NativeRallyPort{
 readonly readCurrent:()=>unknown;
 readonly awardPoint:(winner:Team)=>unknown|Promise<unknown>;
 readonly undoRally:()=>unknown|Promise<unknown>;
}
export type PilotOperation='point'|'undo';
export type PilotVerdict=ShadowVerdict|'native-rejected'|'native-declined';
export interface PilotFinding{
 readonly operation:PilotOperation;
 readonly verdict:PilotVerdict;
 readonly areas:readonly ShadowArea[];
}
export interface PilotReport{
 readonly version:'20.5.17';
 readonly mode:'explicit-native-delegation-only';
 readonly installedInLiveUI:false;
 readonly submitted:number;
 readonly completed:number;
 readonly agree:number;
 readonly difference:number;
 readonly unverified:number;
 readonly nativeRejected:number;
 readonly nativeDeclined:number;
 /** Proven in-memory change after a rejected or declined native command. */
 readonly partialMutations:number;
 /** Failed commands whose state could not be inspected safely afterwards. */
 readonly uninspectedFailures:number;
 readonly pending:number;
 readonly recent:readonly PilotFinding[];
}

const MAX_FINDINGS=40;
const sameScore=(a:Score,b:Score)=>a.us===b.us&&a.opponent===b.opponent;
const currentSet=(match:unknown)=>{
 const m=asRecord(match);
 return m?asList(m.sets).map(asRecord).find(s=>s&&Number(s.number)===Number(m.currentSet)&&Number.isInteger(Number(m.currentSet)))||null:null;
};
const verdict=(operation:PilotOperation,result:PilotVerdict,areas:readonly ShadowArea[]=[]):Readonly<PilotFinding>=>
 Object.freeze({operation,verdict:result,areas:Object.freeze([...areas])});

/** Compact, detached pre-command fingerprint; never retained in diagnostics.
 * Only the active set and live rally are inspected, never historical seasons.
 * An unreadable field is excluded: absence of a warning is not proof of a rollback.
 */
type SafetyArea=Extract<ShadowArea,'score'|'service'|'rotation'|'set'|'match'|'actions'|'lineup'|'video'>;
type SafetyFrame=Readonly<Partial<Record<SafetyArea,string>>>;
const safeStringify=(value:unknown):string|undefined=>{
 try{return JSON.stringify(value);}catch(_){return undefined;}
};
const safetyFrame=(match:unknown):SafetyFrame|null=>{
 const m=asRecord(match);
 if(!m)return null;
 const s=currentSet(match),rallies=s&&Array.isArray(s.rallies)?s.rallies:null;
 const live=asRecord(m.liveRally),last=asRecord(rallies?.at(-1));
 const frames:Partial<Record<SafetyArea,string>>={
  score:s?safeStringify([s.scoreUs,s.scoreOpponent]):undefined,
  service:safeStringify(m.servingTeam),
  rotation:safeStringify([m.rotationNo,m.opponentRotationNo]),
  set:safeStringify([m.currentSet,asList(m.sets).length,s?.finished,s?.winner]),
  match:safeStringify(m.status),
  actions:rallies?safeStringify([rallies.length,last?.id,last?.actions,live?.id,live?.actions]):undefined,
  lineup:safeStringify([m.lineup,m.baseLineup,m.lineupRoles,m.libero]),
  video:safeStringify([last?.liveVideoSessionId,last?.liveVideoStart,last?.liveVideoEnd,
   last?.liveVideoLinkedAt,live?.liveVideoSessionId,live?.liveVideoStart,live?.liveVideoEnd])
 };
 return Object.freeze(frames);
};
const changedAfterFailure=(before:SafetyFrame|null,after:SafetyFrame|null):readonly ShadowArea[]=>{
 if(!before||!after)return Object.freeze(['missing-data']);
 const areas:ShadowArea[]=[];
 const keys:SafetyArea[]=['score','service','rotation','set','match','actions','lineup','video'];
 for(const key of keys)if(before[key]!==undefined&&after[key]!==undefined&&before[key]!==after[key])areas.push(key);
 return Object.freeze(areas);
};
const compare=(operation:PilotOperation,plan:Readonly<RallyCommandPlan>,before:unknown,after:unknown,
 previousSet:Record<string,unknown>|null,previousRally:Record<string,unknown>|null,previousCount:number):Readonly<PilotFinding>=>{
 const match=asRecord(after),set=currentSet(after);
 if(plan.state!=='projected'||!plan.after||!match||!set||!previousSet||
  match!==before||set!==previousSet)return verdict(operation,'unverified',['missing-data']);
 const count=asList(set.rallies).length;
 if(operation==='point'){
  if(count!==previousCount+1)return verdict(operation,'unverified',['missing-data']);
  const confirmed=compareConfirmedPoint(match,set,asList(set.rallies).at(-1));
  const issues=[...confirmed.areas];
  const score=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
  if(score&&!sameScore(score,plan.after.score)&&!issues.includes('score'))issues.push('score');
  return verdict('point',issues.length?'difference':confirmed.verdict,issues);
 }
 const live=asRecord(match.liveRally);
 if(count!==previousCount-1||!previousRally||previousRally.id===undefined||live?.id!==previousRally.id)
  return verdict('undo','unverified',['missing-data']);
 const issues:ShadowArea[]=[];
 const score=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
 let missing=!score;
 if(score&&!sameScore(score,plan.after.score))issues.push('score');
 if(isTeam(match.servingTeam)){
  if(match.servingTeam!==plan.after.serving)issues.push('service');
 }else missing=true;
 if(isRotation(match.rotationNo)&&isRotation(match.opponentRotationNo)){
  if(match.rotationNo!==plan.after.rotationUs||match.opponentRotationNo!==plan.after.rotationOpponent)issues.push('rotation');
 }else missing=true;
 if(Array.isArray(previousRally.actions)&&Array.isArray(live.actions)){
  if(previousRally.actions.length!==live.actions.length)issues.push('actions');
 }else missing=true;
 return verdict('undo',issues.length?'difference':missing?'unverified':'agree',issues.length?issues:missing?['missing-data']:[]);
};

/** The caller must inject native commands; creating this API never patches or runs them. */
export function createRallyTransactionPilot(port:NativeRallyPort){
 let chain:Promise<unknown>=Promise.resolve(),closed=false;
 let submitted=0,completed=0,agree=0,difference=0,unverified=0,nativeRejected=0,nativeDeclined=0,partialMutations=0,uninspectedFailures=0,pending=0;
 const recent:PilotFinding[]=[];
 const record=(finding:Readonly<PilotFinding>)=>{
  completed++;
  if(finding.verdict==='agree')agree++;
  else if(finding.verdict==='difference')difference++;
  else if(finding.verdict==='native-rejected')nativeRejected++;
  else if(finding.verdict==='native-declined')nativeDeclined++;
  else unverified++;
  if(finding.verdict==='native-rejected'||finding.verdict==='native-declined'){
   if(finding.areas.some(area=>area!=='missing-data'))partialMutations++;
   if(finding.areas.includes('missing-data'))uninspectedFailures++;
  }
  if(finding.verdict!=='agree'){
   recent.push(finding);if(recent.length>MAX_FINDINGS)recent.shift();
  }
 };
 const safeRead=()=>{try{return port.readCurrent();}catch(_){return null;}};
 const safeFrame=()=>{try{return safetyFrame(safeRead());}catch(_){return null;}};
 const execute=async(operation:PilotOperation,winner?:Team):Promise<unknown>=>{
  const before=safeRead(),set=currentSet(before),rallies=asList(set?.rallies);
  const safetyBefore=(()=>{try{return safetyFrame(before);}catch(_){return null;}})();
  const countBefore=rallies.length,last=asRecord(rallies.at(-1));
  let planned:Readonly<RallyCommandPlan>|null=null;
  try{planned=operation==='point'?planAwardPoint(before,winner):planUndoLastRally(before);}
  catch(_){/* A failed TS projection must never block the original writer. */}
  let nativeResult:unknown;
  try{
   // Exactly one dispatch. Never retry on a rejected or uncertain native result.
   nativeResult=operation==='point'?await port.awardPoint(winner!):await port.undoRally();
  }catch(error){
   record(verdict(operation,'native-rejected',changedAfterFailure(safetyBefore,safeFrame())));
   throw error;
  }
  if(nativeResult===false){
   record(verdict(operation,'native-declined',changedAfterFailure(safetyBefore,safeFrame())));
   return nativeResult;
  }
  try{
   record(planned?compare(operation,planned,before,safeRead(),set,last,countBefore):
    verdict(operation,'unverified',['missing-data']));
  }catch(_){record(verdict(operation,'unverified',['missing-data']));}
  return nativeResult;
 };
 const submit=(operation:PilotOperation,winner?:Team)=>{
  if(closed)return Promise.reject(new Error('El piloto ya está desactivado.'));
  submitted++;pending++;
  const run=chain.then(()=>execute(operation,winner));
  // A failure does not poison the FIFO; the next task still runs exactly once.
  chain=run.then(()=>undefined,()=>undefined);
  return run.finally(()=>{pending--;});
 };
 const snapshot=():Readonly<PilotReport>=>Object.freeze({
  version:'20.5.17',mode:'explicit-native-delegation-only',installedInLiveUI:false,
  submitted,completed,agree,difference,unverified,nativeRejected,nativeDeclined,partialMutations,uninspectedFailures,pending,
  recent:Object.freeze([...recent])
 });
 return Object.freeze({
  readonlyVersion:'20.5.17' as const,installedInLiveUI:false as const,
  awardPoint:(winner:Team)=>submit('point',winner),
  undoRally:()=>submit('undo'),
  report:snapshot,
  disable(){closed=true;}
 });
}
