import {asRecord,asScore,isTeam,asList,type InspectionState,type Score,type Team,type RallyRecord} from './model';

export interface TraceResult{
 readonly state:InspectionState;
 readonly before:Score|null;
 readonly after:Score|null;
 readonly winner:Team|null;
}
/** Matches V20.5.2 score-trace semantics; never creates a missing score. */
export function verifyRallyScore(rally:unknown):Readonly<TraceResult>{
 const row=asRecord(rally),before=asScore(row?.scoreBefore),after=asScore(row?.scoreAfter);
 const winner=isTeam(row?.winner)?row.winner:null;
 if(!before||!after||!winner)return Object.freeze({state:'unknown',before,after,winner});
 const valid=winner==='ours'?after.us===before.us+1&&after.opponent===before.opponent:
  after.opponent===before.opponent+1&&after.us===before.us;
 return Object.freeze({state:valid?'verified':'inconsistent',before,after,winner});
}

export interface ScoreAudit{readonly verified:number;readonly inconsistent:number;readonly unknown:number;readonly rallies:number;}
export function auditMatchScores(match:unknown):Readonly<ScoreAudit>{
 const sets=asList(asRecord(match)?.sets);
 let verified=0,inconsistent=0,unknown=0,rallies=0;
 for(const set of sets)for(const rally of asList(asRecord(set)?.rallies)){
  if(!asRecord(rally))continue;
  rallies++;
  const state=verifyRallyScore(rally as RallyRecord).state;
  if(state==='verified')verified++;
  else if(state==='inconsistent')inconsistent++;
  else unknown++;
 }
 return Object.freeze({verified,inconsistent,unknown,rallies});
}
