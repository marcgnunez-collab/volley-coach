import {asList,asRecord,isTeam,type Team} from './model';

export interface AttackSummary{
 readonly attempts:number;readonly kills:number;readonly errors:number;
 readonly blocked:number;readonly efficiencyPct:number|null;
}
/** Mirrors the legacy formula (kills - direct errors - blocked) / attempts. */
export function attackEfficiency(actions:unknown):Readonly<AttackSummary>{
 const attacks=asList(actions).map(asRecord).filter((action):action is Record<string,unknown>=>!!action&&action.skill==='A');
 const kills=attacks.filter(a=>a.evaluation==='#').length;
 const errors=attacks.filter(a=>a.evaluation==='=').length;
 const blocked=attacks.filter(a=>a.evaluation==='/').length;
 return Object.freeze({attempts:attacks.length,kills,errors,blocked,
  efficiencyPct:attacks.length?Math.round((kills-errors-blocked)/attacks.length*100):null});
}

export interface PhaseRate{readonly attempts:number;readonly won:number;readonly percent:number|null;readonly unknown:number;}
export interface PhaseSummary{readonly sideOut:PhaseRate;readonly breakPoint:PhaseRate;}
export function sideOutBreakPoint(rallies:unknown,team:Team='ours'):Readonly<PhaseSummary>{
 let soAttempts=0,soWon=0,bpAttempts=0,bpWon=0,soUnknown=0,bpUnknown=0;
 for(const item of asList(rallies)){
  const rally=asRecord(item);if(!rally)continue;
  const serving=rally.servingBefore,winner=rally.winner;
  if(!isTeam(serving))continue;
  const side=serving!==team;
  if(!isTeam(winner)){if(side)soUnknown++;else bpUnknown++;continue;}
  if(side){soAttempts++;if(winner===team)soWon++;}
  else{bpAttempts++;if(winner===team)bpWon++;}
 }
 const rate=(attempts:number,won:number,unknown:number):Readonly<PhaseRate>=>
  Object.freeze({attempts,won,percent:attempts?Math.round(won/attempts*100):null,unknown});
 return Object.freeze({sideOut:rate(soAttempts,soWon,soUnknown),breakPoint:rate(bpAttempts,bpWon,bpUnknown)});
}
