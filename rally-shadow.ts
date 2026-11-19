/* V20.5.15 · Passive comparisons of native-confirmed point/undo outcomes.
 * One active set, one last rally, no persistence, player data or native calls.
 */
import {asList,asRecord,asScore,isRotation,isTeam,type Score,type Team} from './model';
import {projectPoint} from './rotation';
import {verifyRallyScore} from './scoring';
import {projectSetBoundary,inspectRallyRestoration} from './rally-boundaries';
import {planUndoLastRally,type RallyPointState} from './rally-transition';

export type ShadowVerdict='agree'|'difference'|'unverified';
export type ShadowOperation='point'|'undo';
export type ShadowArea='score'|'service'|'rotation'|'set'|'match'|'actions'|'lineup'|'video'|'missing-data'|'not-native-undo';
export interface ShadowObservation{
 readonly operation:ShadowOperation;
 readonly verdict:ShadowVerdict;
 readonly areas:readonly ShadowArea[];
}
export interface RallyShadowCounters{
 readonly observed:number;
 readonly points:number;
 readonly undos:number;
 readonly agree:number;
 readonly difference:number;
 readonly unverified:number;
 readonly skipped:number;
}
export interface RallyShadowReport{
 readonly version:'20.5.15';
 readonly mode:'passive-last-rally-only';
 readonly readOnly:true;
 readonly counters:Readonly<RallyShadowCounters>;
 readonly recent:readonly ShadowObservation[];
 readonly limitations:readonly string[];
}

const MAX_RECENT=40;
const POS=['p1','p2','p3','p4','p5','p6'];
const videoKeys=['liveVideoSessionId','liveVideoStart','liveVideoEnd','liveVideoLinkedAt'];
const sameScore=(a:Score,b:Score)=>a.us===b.us&&a.opponent===b.opponent;
const result=(operation:ShadowOperation,issues:ShadowArea[],unknown=false):Readonly<ShadowObservation>=>
 Object.freeze({operation,verdict:issues.length?'difference':unknown?'unverified':'agree',areas:Object.freeze(issues.length?[...issues]:unknown?['missing-data' as const]:[])});
const setOf=(match:Record<string,unknown>)=>asList(match.sets).map(asRecord)
 .find(set=>set&&Number(set.number)===Number(match.currentSet)&&Number.isInteger(Number(match.currentSet)))||null;
const hasCompleteLineup=(value:unknown)=>{
 const lineup=asRecord(value),ours=asRecord(lineup?.ours),opponent=asRecord(lineup?.opponent);
 return !!ours&&!!opponent&&POS.every(pos=>Object.hasOwn(ours,pos)&&Object.hasOwn(opponent,pos));
};
const sameLineup=(a:unknown,b:unknown)=>{
 const x=asRecord(a),y=asRecord(b),xOwn=asRecord(x?.ours),yOwn=asRecord(y?.ours),xOpp=asRecord(x?.opponent),yOpp=asRecord(y?.opponent);
 return !!xOwn&&!!yOwn&&!!xOpp&&!!yOpp&&POS.every(pos=>
  Object.is(xOwn[pos],yOwn[pos])&&Object.is(xOpp[pos],yOpp[pos]));
};

/** Compares only recorded primitives and their immediate native post-point state. */
export function compareConfirmedPoint(matchInput:unknown,setInput:unknown,rallyInput:unknown):Readonly<ShadowObservation>{
 const match=asRecord(matchInput),set=asRecord(setInput),rally=asRecord(rallyInput);
 const issues:ShadowArea[]=[];
 if(!match||!set||!rally)return result('point',issues,true);
 const trace=verifyRallyScore(rally);
 if(!trace.before||!trace.after||!isTeam(rally.winner)||!isTeam(rally.servingBefore)||
  !isRotation(rally.rotationBefore)||!isRotation(rally.opponentRotationBefore))return result('point',issues,true);
 const predicted=projectPoint({score:trace.before,serving:rally.servingBefore,
  rotationUs:rally.rotationBefore,rotationOpponent:rally.opponentRotationBefore},rally.winner);
 if(predicted.state!=='projected'||!predicted.score)return result('point',issues,true);
 if(trace.state==='inconsistent'||!sameScore(predicted.score,trace.after))issues.push('score');
 const now=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
 let unknown=!now;
 if(now&&!sameScore(now,trace.after)&&!issues.includes('score'))issues.push('score');
 const live=asRecord(match.liveRally);
 // Current court may already have changed if a new action has begun; do not accuse it.
 if(live&&asList(live.actions).length===0&&!asRecord(live.startSnapshot)){
  if(isTeam(match.servingTeam)&&match.servingTeam!==predicted.serving)issues.push('service');
  else if(!isTeam(match.servingTeam))unknown=true;
  if(isRotation(match.rotationNo)&&isRotation(match.opponentRotationNo)){
   if(match.rotationNo!==predicted.rotationUs||match.opponentRotationNo!==predicted.rotationOpponent)issues.push('rotation');
  }else unknown=true;
 }
 const boundary=projectSetBoundary(match,trace.after);
 if(boundary.state==='projected'){
  if(typeof set.finished==='boolean'&&set.finished!==boundary.setFinished)issues.push('set');
  else if(typeof set.finished!=='boolean')unknown=true;
  if(boundary.setFinished&&isTeam(set.winner)&&set.winner!==boundary.setWinner)issues.push('set');
  else if(boundary.setFinished&&!isTeam(set.winner))unknown=true;
  if(boundary.matchFinished===true&&match.status!=='finished')issues.push('match');
 }else unknown=true;
 // Restore coverage is informative only, never a false accusation of corruption.
 const coverage=inspectRallyRestoration(rally);
 if(coverage.lineup==='missing'||coverage.actionsCaptured===false)unknown=true;
 return result('point',[...new Set(issues)],unknown);
}

interface Frame{
 readonly match:Record<string,unknown>;
 readonly set:Record<string,unknown>;
 readonly count:number;
 readonly lastId:unknown;
 readonly lastRally:Record<string,unknown>|null;
 readonly expectedUndo:Readonly<RallyPointState>|null;
}
const capture=(match:Record<string,unknown>,set:Record<string,unknown>):Frame=>{
 const rallies=asList(set.rallies),lastRally=asRecord(rallies.at(-1));
 const undo=planUndoLastRally(match);
 return {match,set,count:rallies.length,lastId:lastRally?.id,lastRally,
  expectedUndo:undo.state==='projected'?undo.after:null};
};
function compareNativeUndo(before:Frame,match:Record<string,unknown>,set:Record<string,unknown>):Readonly<ShadowObservation>{
 const issues:ShadowArea[]=[];
 const reopened=asRecord(match.liveRally),last=before.lastRally,expected=before.expectedUndo;
 if(!last||!reopened||!expected||last.id===undefined||reopened.id!==last.id)return result('undo',issues,true);
 const now=asScore({us:set.scoreUs,opponent:set.scoreOpponent});
 let unknown=!now;
 if(now&&!sameScore(now,expected.score))issues.push('score');
 if(isTeam(match.servingTeam)){
  if(match.servingTeam!==expected.serving)issues.push('service');
 }else unknown=true;
 if(isRotation(match.rotationNo)&&isRotation(match.opponentRotationNo)){
  if(match.rotationNo!==expected.rotationUs||match.opponentRotationNo!==expected.rotationOpponent)issues.push('rotation');
 }else unknown=true;
 if(Array.isArray(last.actions)&&Array.isArray(reopened.actions)){
  if(last.actions.length!==reopened.actions.length)issues.push('actions');
 }else unknown=true;
 if(hasCompleteLineup(last.lineupBefore)&&hasCompleteLineup(match.lineup)){
  if(!sameLineup(last.lineupBefore,match.lineup))issues.push('lineup');
 }else unknown=true;
 const expectedVideo=videoKeys.filter(key=>last[key]!==undefined&&last[key]!==null);
 if(expectedVideo.length){
  if(expectedVideo.some(key=>!Object.is(last[key],reopened[key])))issues.push('video');
 }
 return result('undo',[...new Set(issues)],unknown);
}

/** O(1) in rally-history size, bounded privacy-safe findings, one active match. */
export function createRallyShadowSession(){
 let previous:Frame|null=null,disposed=false;
 let observed=0,points=0,undos=0,agree=0,difference=0,unverified=0,skipped=0;
 const recent:ShadowObservation[]=[];
 const record=(finding:Readonly<ShadowObservation>)=>{
  observed++;
  if(finding.operation==='point')points++;else undos++;
  if(finding.verdict==='agree')agree++;
  else if(finding.verdict==='difference')difference++;
  else unverified++;
  if(finding.verdict!=='agree'){
   recent.push(finding);if(recent.length>MAX_RECENT)recent.shift();
  }
  return finding;
 };
 const snapshot=():Readonly<RallyShadowReport>=>Object.freeze({
  version:'20.5.15',mode:'passive-last-rally-only',readOnly:true,
  counters:Object.freeze({observed,points,undos,agree,difference,unverified,skipped}),
  recent:Object.freeze([...recent]),
  limitations:Object.freeze([
   'Solo compara cambios detectados mientras esta sesión está abierta; no revisa todo el historial.',
   'La comparación se aplaza y no ejecuta ni sustituye los comandos reales.',
   'Una edición manual, cambio de partido o salto de varios rallies no demuestra un error.',
   'No se almacenan códigos, dorsales, jugadores, identificadores de partidos ni enlaces de vídeo.',
   'No confirma la nube ni la sincronización entre dispositivos.'
  ])
 });
 return Object.freeze({
  observe(input:unknown):Readonly<ShadowObservation>|null{
   if(disposed)return null;
   const match=asRecord(input),set=match&&setOf(match);
   if(!match||!set){previous=null;return null;}
   const next=capture(match,set),before=previous;
   previous=next;
   if(!before)return null;
   if(before.match!==match||before.set!==set){skipped++;return null;}
   if(next.count===before.count)return null;
   if(next.count===before.count+1)return record(compareConfirmedPoint(match,set,next.lastRally));
   if(next.count===before.count-1){
    // A delete/reorder is not necessarily the native undo command.
    if(before.lastId===undefined||asRecord(match.liveRally)?.id!==before.lastId){skipped++;return null;}
    return record(compareNativeUndo(before,match,set));
   }
   skipped++;return null;
  },
  snapshot,
  clear(){observed=points=undos=agree=difference=unverified=skipped=0;recent.length=0;},
  dispose(){disposed=true;previous=null;recent.length=0;}
 });
}
