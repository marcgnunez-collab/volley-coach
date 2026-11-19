/* V20.5.10 · Bounded and read-only live statistical projections.
 * Confirmed phase rates use closed rallies; provisional reception/attack may
 * include the current unfinished rally and are always labelled as such.
 */
import {asList,asRecord,isTeam} from '../domain/model';

const MAX_RALLIES=3000,MAX_ACTIONS=25000;
export interface LiveRate{
 readonly attempts:number;
 readonly successes:number;
 readonly percent:number|null;
}
export interface LiveReception{
 readonly attempts:number;
 readonly perfect:number;
 readonly positive:number;
 readonly positivePct:number|null;
 readonly perfectPct:number|null;
}
export interface LiveAttack{
 readonly attempts:number;
 readonly kills:number;
 readonly errors:number;
 readonly blocked:number;
 readonly efficiencyPct:number|null;
}
export interface LiveSetStatistics{
 readonly available:boolean;
 readonly set:number|null;
 readonly completeRallies:number;
 readonly examinedRallies:number;
 readonly examinedActions:number;
 readonly truncated:boolean;
 readonly sideOut:Readonly<LiveRate>;
 readonly breakPoint:Readonly<LiveRate>;
 readonly reception:Readonly<LiveReception>;
 readonly attack:Readonly<LiveAttack>;
 readonly provisional:Readonly<{
  readonly actions:number;
  readonly receptions:number;
  readonly attacks:number;
  readonly reception:Readonly<LiveReception>;
  readonly attack:Readonly<LiveAttack>;
 }>;
}

const pct=(numerator:number,denominator:number)=>denominator?Math.round(numerator/denominator*100):null;
type MutableContacts={receptions:number;perfect:number;positive:number;attacks:number;kills:number;errors:number;blocked:number};
const zeroContacts=():MutableContacts=>({receptions:0,perfect:0,positive:0,attacks:0,kills:0,errors:0,blocked:0});
const addContact=(counter:MutableContacts,raw:unknown)=>{
 const action=asRecord(raw);
 if(action?.team!=='ours')return;
 if(action.skill==='R'){
  if(!['#','+','!','-','/','='].includes(String(action.evaluation)))return;
  counter.receptions++;
  if(action.evaluation==='#')counter.perfect++;
  if(action.evaluation==='#'||action.evaluation==='+')counter.positive++;
 }else if(action.skill==='A'){
  if(!['#','+','!','-','/','='].includes(String(action.evaluation)))return;
  counter.attacks++;
  if(action.evaluation==='#')counter.kills++;
  if(action.evaluation==='=')counter.errors++;
  if(action.evaluation==='/')counter.blocked++;
 }
};
const reception=(v:MutableContacts):Readonly<LiveReception>=>Object.freeze({
 attempts:v.receptions,perfect:v.perfect,positive:v.positive,
 positivePct:pct(v.positive,v.receptions),perfectPct:pct(v.perfect,v.receptions)
});
const attack=(v:MutableContacts):Readonly<LiveAttack>=>Object.freeze({
 attempts:v.attacks,kills:v.kills,errors:v.errors,blocked:v.blocked,
 efficiencyPct:pct(v.kills-v.errors-v.blocked,v.attacks)
});
const rate=(attempts:number,successes:number):Readonly<LiveRate>=>Object.freeze({attempts,successes,percent:pct(successes,attempts)});

/** Works on canonical facts only; no native parser, match writer or global state. */
export function inspectLiveSetStatistics(match:unknown):Readonly<LiveSetStatistics>{
 const m=asRecord(match),setNumber=Number.isSafeInteger(m?.currentSet)&&Number(m?.currentSet)>0?Number(m?.currentSet):null;
 const set=asRecord(asList(m?.sets).find(item=>setNumber!==null&&asRecord(item)?.number===setNumber));
 const rallies=asList(set?.rallies),confirmed=zeroContacts(),pending=zeroContacts();
 let soAttempts=0,soWon=0,bpAttempts=0,bpWon=0,examinedRallies=0,examinedActions=0,truncated=false;
 if(set)for(const item of rallies){
  if(examinedRallies>=MAX_RALLIES){truncated=true;break;}
  const rally=asRecord(item);examinedRallies++;
  if(!rally)continue;
  const winner=rally.winner,server=rally.servingBefore;
  if(isTeam(winner)&&isTeam(server)){
   if(server==='opponent'){soAttempts++;if(winner==='ours')soWon++;}
   else{bpAttempts++;if(winner==='ours')bpWon++;}
  }
  for(const action of asList(rally.actions)){
   if(examinedActions>=MAX_ACTIONS){truncated=true;break;}
   examinedActions++;addContact(confirmed,action);
  }
  if(truncated)break;
 }
 // A rally in progress is never used to infer Side-Out or Break Point.
 const liveActions=asList(asRecord(m?.liveRally)?.actions);
 for(const action of liveActions.slice(0,MAX_ACTIONS))addContact(pending,action);
 if(liveActions.length>MAX_ACTIONS)truncated=true;
 const preview:MutableContacts={
  receptions:confirmed.receptions+pending.receptions,perfect:confirmed.perfect+pending.perfect,
  positive:confirmed.positive+pending.positive,attacks:confirmed.attacks+pending.attacks,
  kills:confirmed.kills+pending.kills,errors:confirmed.errors+pending.errors,blocked:confirmed.blocked+pending.blocked
 };
 return Object.freeze({
  available:!!set,set:set?setNumber:null,completeRallies:rallies.length,examinedRallies,examinedActions,truncated,
  sideOut:rate(soAttempts,soWon),breakPoint:rate(bpAttempts,bpWon),
  reception:reception(confirmed),attack:attack(confirmed),
  provisional:Object.freeze({actions:liveActions.length,receptions:pending.receptions,attacks:pending.attacks,
   reception:reception(preview),attack:attack(preview)})
 });
}
