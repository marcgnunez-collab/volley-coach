/* V20.5.11 · Confirmed player / rotation boxscore. No second scorer.
 * Facts come exclusively from recorded actions and their rally rotations.
 */
import {asList,asRecord,isRotation,isTeam,type Rotation,type Team} from '../domain/model';

const LIMIT_RALLIES=20000,LIMIT_ACTIONS=60000,LIMIT_PLAYERS=80;
const EVALUATIONS=new Set(['#','+','!','-','/','=']);
export interface BoxscoreFilters{
 readonly team:Team;
 readonly scope:'current'|'match';
 readonly rotation:Rotation|null;
}
export interface ServeBox{readonly attempts:number;readonly aces:number;readonly errors:number;}
export interface ReceiveBox{readonly attempts:number;readonly perfect:number;readonly positive:number;readonly positivePct:number|null;readonly perfectPct:number|null;}
export interface AttackBox{readonly attempts:number;readonly kills:number;readonly errors:number;readonly blocked:number;readonly efficiencyPct:number|null;}
export interface PlayerBoxRow{
 readonly key:string;readonly number:string|null;readonly name:string;readonly identified:boolean;
 readonly actions:number;readonly serve:Readonly<ServeBox>;readonly receive:Readonly<ReceiveBox>;
 readonly attack:Readonly<AttackBox>;readonly block:Readonly<{attempts:number;points:number}>;
 readonly digs:number;readonly sets:number;
}
export interface RotationBoxRow{
 readonly rotation:Rotation;
 readonly rallies:number;
 readonly sideOut:Readonly<{attempts:number;won:number;percent:number|null}>;
 readonly breakPoint:Readonly<{attempts:number;won:number;percent:number|null}>;
 readonly attack:Readonly<AttackBox>;
}
export interface PlayerBoxscore{
 readonly available:boolean;readonly filters:Readonly<BoxscoreFilters>;
 readonly players:readonly Readonly<PlayerBoxRow>[];
 readonly rotations:readonly Readonly<RotationBoxRow>[];
 readonly ralliesExamined:number;readonly actionsExamined:number;
 readonly selectedActions:number;readonly unattributedActions:number;
 readonly missingRotationActions:number;readonly pendingActions:number;
 readonly truncated:boolean;readonly playersTruncated:boolean;
}

type MutableSkills={
 actions:number;s:number;aces:number;sErrors:number;r:number;rPerfect:number;rPositive:number;
 a:number;kills:number;aErrors:number;blocked:number;b:number;bPoints:number;d:number;e:number;
};
type MutablePlayer=MutableSkills&{key:string;number:string|null;name:string;identified:boolean};
type MutableRotation=MutableSkills&{rotation:Rotation;rallies:number;so:number;soWon:number;bp:number;bpWon:number};
const zero=():MutableSkills=>({actions:0,s:0,aces:0,sErrors:0,r:0,rPerfect:0,rPositive:0,a:0,kills:0,aErrors:0,blocked:0,b:0,bPoints:0,d:0,e:0});
const pct=(n:number,d:number)=>d?Math.round(n/d*100):null;
const positiveInt=(v:unknown):number|null=>{
 if(typeof v==='number'&&Number.isSafeInteger(v)&&v>0)return v;
 if(typeof v==='string'&&/^\d{1,15}$/.test(v)){const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null;}
 return null;
};
const jersey=(v:unknown):string|null=>{
 const value=typeof v==='number'&&Number.isSafeInteger(v)?String(v):typeof v==='string'?v.trim():'';
 return /^\d{1,3}$/.test(value)?value:null;
};
const label=(v:unknown)=>typeof v==='string'?v.trim().slice(0,50):'';
function identity(action:Record<string,unknown>,team:Team){
 const id=positiveInt(action.playerId),uid=label(action.opponentPlayerUid);
 const snapshot=jersey(action.playerNumberSnapshot),text=label(action.playerLabel);
 const opponentNumber=jersey((text.match(/^#?\s*(\d{1,3})(?:\D|$)/)||[])[1]);
 const number=snapshot||(team==='opponent'?opponentNumber:null);
 const name=label(action.playerNameSnapshot)||text.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/,'')||'';
 const key=team==='ours'&&id!==null?`id:${id}`:
  team==='opponent'&&uid?`uid:${uid}`:number!==null?`num:${number}`:'unidentified';
 return {key,number,name:key==='unidentified'?'Sin identificar':name,identified:key!=='unidentified'};
}
const accumulate=(target:MutableSkills,raw:Record<string,unknown>)=>{
 const skill=raw.skill,evaluation=raw.evaluation;
 if(!EVALUATIONS.has(String(evaluation)))return false;
 if(!['S','R','A','B','D','E'].includes(String(skill)))return false;
 target.actions++;
 if(skill==='S'){target.s++;if(evaluation==='#')target.aces++;if(evaluation==='=')target.sErrors++;}
 else if(skill==='R'){target.r++;if(evaluation==='#')target.rPerfect++;if(evaluation==='#'||evaluation==='+')target.rPositive++;}
 else if(skill==='A'){target.a++;if(evaluation==='#')target.kills++;if(evaluation==='=')target.aErrors++;if(evaluation==='/')target.blocked++;}
 else if(skill==='B'){target.b++;if(evaluation==='#')target.bPoints++;}
 else if(skill==='D')target.d++;
 else if(skill==='E')target.e++;
 return true;
};
const attack=(x:MutableSkills):Readonly<AttackBox>=>Object.freeze({attempts:x.a,kills:x.kills,errors:x.aErrors,
 blocked:x.blocked,efficiencyPct:pct(x.kills-x.aErrors-x.blocked,x.a)});
const rate=(attempts:number,won:number)=>Object.freeze({attempts,won,percent:pct(won,attempts)});

/** Fully recalculates on each explicit observable change, including old edits/undo. */
export function inspectPlayerBoxscore(match:unknown,filters:BoxscoreFilters):Readonly<PlayerBoxscore>{
 const m=asRecord(match),team:Team=filters.team==='opponent'?'opponent':'ours',
  scope=filters.scope==='match'?'match':'current',rotation=isRotation(filters.rotation)?filters.rotation:null;
 const safeFilters:Readonly<BoxscoreFilters>=Object.freeze({team,scope,rotation});
 const currentSet=positiveInt(m?.currentSet),allSets=asList(m?.sets),sets=scope==='match'?allSets:
  allSets.filter(item=>currentSet!==null&&positiveInt(asRecord(item)?.number)===currentSet);
 const available=!!m&&sets.some(item=>!!asRecord(item));
 const players=new Map<string,MutablePlayer>(),rotations=new Map<Rotation,MutableRotation>(),skipped=zero();
 for(const rot of [1,2,3,4,5,6] as Rotation[])rotations.set(rot,{...zero(),rotation:rot,rallies:0,so:0,soWon:0,bp:0,bpWon:0});
 let ralliesExamined=0,actionsExamined=0,selectedActions=0,unattributedActions=0,missingRotationActions=0,truncated=false,playersTruncated=false;
 main:for(const entry of sets){
  const set=asRecord(entry);if(!set)continue;
  for(const rawRally of asList(set.rallies)){
   if(ralliesExamined>=LIMIT_RALLIES){truncated=true;break main;}
   ralliesExamined++;
   const rally=asRecord(rawRally);if(!rally)continue;
   const value=team==='ours'?rally.rotationBefore:rally.opponentRotationBefore,
    rallyRotation=isRotation(value)?value:null;
   if(rallyRotation!==null){
    const row=rotations.get(rallyRotation)!;row.rallies++;
    if(isTeam(rally.servingBefore)&&isTeam(rally.winner)){
     if(rally.servingBefore!==team){row.so++;if(rally.winner===team)row.soWon++;}
     else{row.bp++;if(rally.winner===team)row.bpWon++;}
    }
   }
   for(const rawAction of asList(rally.actions)){
    if(actionsExamined>=LIMIT_ACTIONS){truncated=true;break main;}
    actionsExamined++;
    const action=asRecord(rawAction);if(!action||action.team!==team)continue;
    if(rallyRotation===null)missingRotationActions++;
    if(rallyRotation!==null)accumulate(rotations.get(rallyRotation)!,action);
    if(rotation!==null&&rallyRotation!==rotation)continue;
    const who=identity(action,team),key=who.key;
    let row=players.get(key);
    if(!row&&players.size>=LIMIT_PLAYERS){
     playersTruncated=true;
     if(accumulate(skipped,action)){selectedActions++;if(!who.identified)unattributedActions++;}
     continue;
    }
    if(!row){row={...zero(),...who};players.set(key,row);}
    if(!row.number&&who.number)row.number=who.number;
    if(!row.name&&who.name)row.name=who.name;
    if(!accumulate(row,action))continue;
    selectedActions++;
    if(!row.identified)unattributedActions++;
   }
  }
 }
 const allRows=[...players.values()].filter(row=>row.actions>0).sort((a,b)=>{
  if(a.identified!==b.identified)return a.identified?-1:1;
  const aNum=a.number===null?Infinity:Number(a.number),bNum=b.number===null?Infinity:Number(b.number);
  return aNum-bNum||a.name.localeCompare(b.name,'es')||a.key.localeCompare(b.key);
 });
 const playerRows:Readonly<PlayerBoxRow>[] = allRows.slice(0,LIMIT_PLAYERS).map(p=>Object.freeze({
  key:p.key,number:p.number,name:p.name||'Jugador sin nombre',identified:p.identified,actions:p.actions,
  serve:Object.freeze({attempts:p.s,aces:p.aces,errors:p.sErrors}),
  receive:Object.freeze({attempts:p.r,perfect:p.rPerfect,positive:p.rPositive,
   positivePct:pct(p.rPositive,p.r),perfectPct:pct(p.rPerfect,p.r)}),
  attack:attack(p),block:Object.freeze({attempts:p.b,points:p.bPoints}),digs:p.d,sets:p.e
 }));
 const rotationRows:Readonly<RotationBoxRow>[]=[...rotations.values()].map(r=>Object.freeze({
  rotation:r.rotation,rallies:r.rallies,sideOut:rate(r.so,r.soWon),breakPoint:rate(r.bp,r.bpWon),attack:attack(r)
 }));
 const pendingActions=asList(asRecord(m?.liveRally)?.actions).filter(item=>asRecord(item)?.team===team).length;
 return Object.freeze({available,filters:safeFilters,players:Object.freeze(playerRows),rotations:Object.freeze(rotationRows),
  ralliesExamined,actionsExamined,selectedActions,unattributedActions,missingRotationActions,pendingActions,
  truncated,playersTruncated});
}
