/* V20.5.13 · Typed, reversible projections for the legacy scouting commands.
 * This module has no access to native writers, the DOM, IndexedDB or cloud.
 * All projections are advisory: player lineups, libero, video and persistence
 * remain exclusively owned by the original command adapters.
 */
import {asList,asRecord,asScore,isRotation,isTeam,type Rotation,type Score,type Team} from './model';
import {projectPoint} from './rotation';
import {verifyRallyScore,type TraceResult} from './scoring';

export interface RallyPointState{
 readonly score:Score;
 readonly serving:Team;
 readonly rotationUs:Rotation;
 readonly rotationOpponent:Rotation;
}
export type CommandPlanKind='award-point'|'undo-last-rally';
export type CommandPlanState='projected'|'unknown'|'blocked';
export type CommandPlanReason='ready'|'no-match'|'no-set'|'no-rallies'|'finished'|'invalid-data'|'stale-score';
export interface RallyCommandPlan{
 readonly kind:CommandPlanKind;
 readonly state:CommandPlanState;
 readonly reason:CommandPlanReason;
 readonly before:Readonly<RallyPointState>|null;
 readonly after:Readonly<RallyPointState>|null;
 readonly includesLineups:false;
 readonly readOnly:true;
}

const pointState=(score:unknown,serving:unknown,rotationUs:unknown,rotationOpponent:unknown):Readonly<RallyPointState>|null=>{
 const parsed=asScore(score);
 return parsed&&isTeam(serving)&&isRotation(rotationUs)&&isRotation(rotationOpponent)?
  Object.freeze({score:parsed,serving,rotationUs,rotationOpponent}):null;
};
const plan=(kind:CommandPlanKind,reason:CommandPlanReason,before:Readonly<RallyPointState>|null=null,after:Readonly<RallyPointState>|null=null):Readonly<RallyCommandPlan>=>
 Object.freeze({kind,state:reason==='ready'?'projected':reason==='finished'?'blocked':'unknown',reason,before,after,includesLineups:false,readOnly:true});
const activeSet=(match:Record<string,unknown>)=>
 asList(match.sets).map(asRecord).find(set=>set&&Number(set.number)===Number(match.currentSet)&&Number.isInteger(Number(match.currentSet)))||null;
const sameScore=(a:Score,b:Score)=>a.us===b.us&&a.opponent===b.opponent;

/** Dry-run only. Captures snapshot semantics of scoutAwardPoint without invoking it. */
export function planAwardPoint(input:unknown,winner:unknown):Readonly<RallyCommandPlan>{
 const match=asRecord(input);
 if(!match)return plan('award-point','no-match');
 if(match.status==='finished')return plan('award-point','finished');
 const set=activeSet(match);
 if(!set)return plan('award-point','no-set');
 if(set.finished===true)return plan('award-point','finished');
 const score=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
 const start=asRecord(asRecord(match.liveRally)?.startSnapshot);
 const before=pointState(score,start?start.servingBefore:match.servingTeam,
  start?start.rotationBefore:match.rotationNo,start?start.opponentRotationBefore:match.opponentRotationNo);
 if(!before||!isTeam(winner))return plan('award-point','invalid-data');
 // A stale rally-start snapshot is not safe to certify as a real command outcome.
 if(start){
  const startScore=asScore(start.scoreBefore);
  if(!startScore||!sameScore(startScore,before.score)||
   start.servingBefore!==match.servingTeam||start.rotationBefore!==match.rotationNo||
   start.opponentRotationBefore!==match.opponentRotationNo)return plan('award-point','stale-score',before);
 }
 const projected=projectPoint({score:before.score,serving:before.serving,
  rotationUs:before.rotationUs,rotationOpponent:before.rotationOpponent},winner);
 const after=pointState(projected.score,projected.serving,projected.rotationUs,projected.rotationOpponent);
 return after?plan('award-point','ready',before,after):plan('award-point','invalid-data',before);
}

/** Dry-run only. Models scoutUndoRally's restoration of the last closed rally. */
export function planUndoLastRally(input:unknown):Readonly<RallyCommandPlan>{
 const match=asRecord(input);
 if(!match)return plan('undo-last-rally','no-match');
 if(match.status==='finished')return plan('undo-last-rally','finished');
 const set=activeSet(match);
 if(!set)return plan('undo-last-rally','no-set');
 const rallies=asList(set.rallies),last=asRecord(rallies[rallies.length-1]);
 if(!last)return plan('undo-last-rally','no-rallies');
 const currentScore=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
 const before=pointState(currentScore,match.servingTeam,match.rotationNo,match.opponentRotationNo);
 const after=pointState(last.scoreBefore,last.servingBefore,last.rotationBefore,last.opponentRotationBefore);
 if(!before||!after||verifyRallyScore(last).state!=='verified')return plan('undo-last-rally','invalid-data',before);
 const recordedAfter=asScore(last.scoreAfter);
 if(!recordedAfter||!sameScore(recordedAfter,before.score))return plan('undo-last-rally','stale-score',before);
 return plan('undo-last-rally','ready',before,after);
}

export type LinkState='match'|'mismatch'|'unknown';
export interface ClosedRallyInspection{
 readonly score:Readonly<TraceResult>;
 readonly scoreLink:LinkState;
 readonly rotationLink:LinkState;
 readonly undoTo:Readonly<RallyPointState>|null;
}

/** Shared audit projection for consecutive, already-closed rallies. */
export function inspectClosedRally(rallyInput:unknown,nextInput:unknown=null):Readonly<ClosedRallyInspection>{
 const rally=asRecord(rallyInput),next=asRecord(nextInput);
 const score=verifyRallyScore(rally);
 let scoreLink:LinkState='unknown',rotationLink:LinkState='unknown';
 const nextBefore=asScore(next?.scoreBefore);
 if(score.after&&nextBefore)scoreLink=sameScore(score.after,nextBefore)?'match':'mismatch';
 const restored=pointState(rally?.scoreBefore,rally?.servingBefore,rally?.rotationBefore,rally?.opponentRotationBefore);
 if(restored&&next){
  const projected=projectPoint({score:restored.score,serving:restored.serving,
   rotationUs:restored.rotationUs,rotationOpponent:restored.rotationOpponent},rally?.winner);
  if(projected.state==='projected'&&isTeam(next.servingBefore)&&isRotation(next.rotationBefore)&&isRotation(next.opponentRotationBefore)){
   rotationLink=projected.serving===next.servingBefore&&projected.rotationUs===next.rotationBefore&&
    projected.rotationOpponent===next.opponentRotationBefore?'match':'mismatch';
  }
 }
 return Object.freeze({score,scoreLink,rotationLink,undoTo:restored});
}
