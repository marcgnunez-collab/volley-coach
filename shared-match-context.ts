/* V20.6.1 · One read-only match scope for Scouting, Analysis and Video.
 * No shadow match model, storage, clones, writers, DOM or alternate scores. */
import {asList,asRecord} from '../domain/model';

export type MatchRow=Record<string,unknown>;
export interface SharedMatchFrame{
 readonly readOnly:true;
 readonly match:MatchRow|null;
 readonly set:MatchRow|null;
 readonly liveActions:readonly unknown[];
 readonly currentSet:unknown;
 readonly phase:unknown;
 readonly serving:unknown;
 readonly rotationUs:unknown;
 readonly rotationOpponent:unknown;
 readonly scoreUs:unknown;
 readonly scoreOpponent:unknown;
 readonly closedRallies:number;
 readonly liveActionCount:number;
 readonly lastRally:unknown;
 readonly lastAction:unknown;
}
const EMPTY=Object.freeze([]) as readonly unknown[];

/** Shares canonical object identity; only this small derived wrapper is frozen. */
export function captureSharedMatchFrame(input:unknown,setInput?:unknown):Readonly<SharedMatchFrame>{
 const match=asRecord(input);
 const set=asRecord(setInput)||asRecord(asList(match?.sets).find(s=>
  asRecord(s)&&Number(asRecord(s)?.number)===Number(match?.currentSet)));
 const live=asRecord(match?.liveRally);
 const liveActions=Array.isArray(live?.actions)?live.actions:EMPTY;
 const rallies=asList(set?.rallies);
 return Object.freeze({
  readOnly:true as const,match,set,liveActions,
  currentSet:match?.currentSet??null,phase:match?.status??null,
  serving:match?.servingTeam??null,rotationUs:match?.rotationNo??null,
  rotationOpponent:match?.opponentRotationNo??null,
  scoreUs:set?.scoreUs??null,scoreOpponent:set?.scoreOpponent??null,
  closedRallies:rallies.length,liveActionCount:liveActions.length,
  lastRally:rallies[rallies.length-1]??null,
  lastAction:liveActions[liveActions.length-1]??null
 });
}

/** A bounded identity and scalar guard for long UI rendering or async work. */
export function isSharedMatchFrameCurrent(
 expected:Readonly<SharedMatchFrame>,actual:Readonly<SharedMatchFrame>):boolean{
 return expected.match===actual.match&&expected.set===actual.set&&
  expected.liveActions===actual.liveActions&&
  Object.is(expected.currentSet,actual.currentSet)&&
  Object.is(expected.phase,actual.phase)&&
  Object.is(expected.serving,actual.serving)&&
  Object.is(expected.rotationUs,actual.rotationUs)&&
  Object.is(expected.rotationOpponent,actual.rotationOpponent)&&
  Object.is(expected.scoreUs,actual.scoreUs)&&
  Object.is(expected.scoreOpponent,actual.scoreOpponent)&&
  expected.closedRallies===actual.closedRallies&&
  expected.liveActionCount===actual.liveActionCount&&
  expected.lastRally===actual.lastRally&&expected.lastAction===actual.lastAction;
}

/** The historical selector's exact precedence: selected -> active -> oldest. */
export function selectSharedAnalysisMatch(
 matches:readonly unknown[],selectedId:unknown,activeId:unknown,activeMatch:unknown):MatchRow|null{
 const id=Number(selectedId)||Number(activeId);
 return asRecord(matches.find(m=>asRecord(m)&&Number(asRecord(m)?.id)===id))||
  asRecord(activeMatch)||asRecord(matches[0])||null;
}
