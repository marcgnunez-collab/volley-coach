/* V20.5.18 · Opt-in native pilot with read-only recovery evidence and gated resumption.
 * NOT installed in the live UI. No storage, cloud, DOM, global overrides or retry.
 * Its only mutation is a caller-supplied ORIGINAL native command, once per task.
 */
import {asList,asRecord,asScore,isRotation,isTeam,type Score,type Team} from './model';
import {planAwardPoint,planUndoLastRally,type RallyCommandPlan} from './rally-transition';
import {compareConfirmedPoint,type ShadowArea,type ShadowVerdict} from './rally-shadow';
import {captureRecoveryFrame,changedRecoveryAreas,classifyRecoveryEvidence,equalRecoveryFrames,
 type RecoveryEvidence} from './rally-recovery-evidence';

export interface NativeRallyPort{
 readonly readCurrent:()=>unknown;
 readonly awardPoint:(winner:Team)=>unknown|Promise<unknown>;
 readonly undoRally:()=>unknown|Promise<unknown>;
 /** Optional authoritative LOCAL persisted read, supplied by the existing storage owner. */
 readonly readDurableLocal?:()=>unknown|Promise<unknown>;
}
export interface PilotOptions{
 /** Off by default. An observed native failure blocks all further native commands. */
 readonly requireRecoveryAfterNativeFailure?:boolean;
 /** A caller may restore a pending flag from the EXISTING durable journal after reload. */
 readonly startBlockedForPendingRecovery?:boolean;
}
export type PilotOperation='point'|'undo';
export type PilotVerdict=ShadowVerdict|'native-rejected'|'native-declined'|'recovery-blocked';
export interface PilotFinding{
 readonly operation:PilotOperation;
 readonly verdict:PilotVerdict;
 readonly areas:readonly ShadowArea[];
 readonly durability:RecoveryEvidence;
}
export interface PilotReport{
 readonly version:'20.5.18';
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
 readonly blockedCommands:number;
 readonly recoveryGuard:Readonly<{
  enabled:boolean;
  blocked:boolean;
  lastEvidence:RecoveryEvidence;
 }>;
 readonly pending:number;
 readonly recent:readonly PilotFinding[];
}

const MAX_FINDINGS=40;
const sameScore=(a:Score,b:Score)=>a.us===b.us&&a.opponent===b.opponent;
const currentSet=(match:unknown)=>{
 const m=asRecord(match);
 return m?asList(m.sets).map(asRecord).find(s=>s&&Number(s.number)===Number(m.currentSet)&&Number.isInteger(Number(m.currentSet)))||null:null;
};
const verdict=(operation:PilotOperation,result:PilotVerdict,areas:readonly ShadowArea[]=[],
 durability:RecoveryEvidence='not-checked'):Readonly<PilotFinding>=>
 Object.freeze({operation,verdict:result,areas:Object.freeze([...areas]),durability});
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
export function createRallyTransactionPilot(port:NativeRallyPort,options:PilotOptions={}){
 let chain:Promise<unknown>=Promise.resolve(),closed=false;
 const gated=options.requireRecoveryAfterNativeFailure===true;
 let blocked=gated&&options.startBlockedForPendingRecovery===true;
 let lastEvidence:RecoveryEvidence='not-checked';
 let submitted=0,completed=0,agree=0,difference=0,unverified=0,nativeRejected=0,nativeDeclined=0,partialMutations=0,uninspectedFailures=0,blockedCommands=0,pending=0;
 const recent:PilotFinding[]=[];
 const record=(finding:Readonly<PilotFinding>)=>{
  completed++;
  if(finding.verdict==='agree')agree++;
  else if(finding.verdict==='difference')difference++;
  else if(finding.verdict==='native-rejected')nativeRejected++;
  else if(finding.verdict==='native-declined')nativeDeclined++;
  else if(finding.verdict==='recovery-blocked')blockedCommands++;
  else unverified++;
  if(finding.verdict==='native-rejected'||finding.verdict==='native-declined'){
   lastEvidence=finding.durability;
   if(finding.areas.some(area=>area!=='missing-data'))partialMutations++;
   if(finding.areas.includes('missing-data'))uninspectedFailures++;
  }
  if(finding.verdict!=='agree'){
   recent.push(finding);if(recent.length>MAX_FINDINGS)recent.shift();
  }
 };
 const safeRead=()=>{try{return port.readCurrent();}catch(_){return null;}};
 const safeFrame=()=>captureRecoveryFrame(safeRead());
 const inspectDurable=async(before:ReturnType<typeof captureRecoveryFrame>,
  after:ReturnType<typeof captureRecoveryFrame>):Promise<RecoveryEvidence>=>{
  if(!port.readDurableLocal)return 'not-configured';
  try{return classifyRecoveryEvidence(before,after,captureRecoveryFrame(await port.readDurableLocal()));}
  catch(_){return 'unreadable';}
 };
 const execute=async(operation:PilotOperation,winner?:Team):Promise<unknown>=>{
  if(blocked){
   record(verdict(operation,'recovery-blocked'));
   throw new Error('Recuperación pendiente: comprueba el partido y el guardado local antes de continuar.');
  }
  const before=safeRead(),set=currentSet(before),rallies=asList(set?.rallies);
  const safetyBefore=captureRecoveryFrame(before);
  const countBefore=rallies.length,last=asRecord(rallies.at(-1));
  let planned:Readonly<RallyCommandPlan>|null=null;
  try{planned=operation==='point'?planAwardPoint(before,winner):planUndoLastRally(before);}
  catch(_){/* A failed TS projection must never block the original writer. */}
  let nativeResult:unknown;
  try{
   // Exactly one dispatch. Never retry on a rejected or uncertain native result.
   nativeResult=operation==='point'?await port.awardPoint(winner!):await port.undoRally();
  }catch(error){
   if(gated)blocked=true;
   const safetyAfter=safeFrame();
   const durable=await inspectDurable(safetyBefore,safetyAfter);
   record(verdict(operation,'native-rejected',changedRecoveryAreas(safetyBefore,safetyAfter),durable));
   throw error;
  }
  if(nativeResult===false){
   if(gated)blocked=true;
   const safetyAfter=safeFrame();
   const durable=await inspectDurable(safetyBefore,safetyAfter);
   record(verdict(operation,'native-declined',changedRecoveryAreas(safetyBefore,safetyAfter),durable));
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
  version:'20.5.18',mode:'explicit-native-delegation-only',installedInLiveUI:false,
  submitted,completed,agree,difference,unverified,nativeRejected,nativeDeclined,
  partialMutations,uninspectedFailures,blockedCommands,pending,
  recoveryGuard:Object.freeze({enabled:gated,blocked,lastEvidence}),
  recent:Object.freeze([...recent])
 });
 return Object.freeze({
  readonlyVersion:'20.5.18' as const,installedInLiveUI:false as const,
  awardPoint:(winner:Team)=>submit('point',winner),
  undoRally:()=>submit('undo'),
  report:snapshot,
  /** Opt-in operator step after reloading from the existing local persistence owner.
   * Both independently read frames must match, including the real match identity.
   * Cloud delivery still requires separate CAS/sync verification.
   */
  async resumeAfterVerifiedReload(){
   if(!gated||!blocked||closed||pending!==0||!port.readDurableLocal)return false;
   try{
    const live=safeFrame(),durable=captureRecoveryFrame(await port.readDurableLocal());
    if(!equalRecoveryFrames(live,durable))return false;
    blocked=false;return true;
   }catch(_){return false;}
  },
  disable(){closed=true;}
 });
}
