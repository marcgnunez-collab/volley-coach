/* V20.5.25 · Pure, typed Data Engine operations from the V19.3.8 contract.
 * The normalized projection remains read-only. No native writes or subscriptions.
 */
import type {Team} from '../domain/model';
import {normalizeAnalysisZone,type NormalizedAnalysis,type NormalizedContact,
 type NormalizedRally,type NormalizedPossession,type NormalizedChain} from './analysis-normalizer';

const val=(x:unknown)=>String(x??'').trim();
const present=(x:unknown)=>x!==null&&x!==undefined&&val(x)!=='';
const team=(x:unknown):Team|null=>x==='ours'||x==='opponent'?x:null;
const arr=<T>(value:readonly T[]|null|undefined):readonly T[]=>Array.isArray(value)?value:[];
const pct=(n:number,d:number):number|null=>d?Math.round(1000*n/d)/10:null;

export interface AnalysisEngineFilters extends Readonly<Record<string,unknown>>{
 readonly team?:unknown;readonly set?:unknown;readonly rotation?:unknown;
 readonly phase?:unknown;readonly skill?:unknown;readonly evaluation?:unknown;
 readonly player?:unknown;readonly startZone?:unknown;readonly endZone?:unknown;
 readonly setter?:unknown;readonly video?:unknown;
}
export interface FilteredAnalysis{
 readonly rallies:NormalizedRally[];readonly contacts:NormalizedContact[];
 readonly possessions:NormalizedPossession[];readonly chains:NormalizedChain[];
 readonly target:Team|null;readonly filters:AnalysisEngineFilters;
}
export interface EvaluationSummary{
 readonly recorded:number;readonly rated:number;readonly missing:number;
 readonly kills:number;readonly errors:number;readonly blocked:number;
 readonly killPct:number|null;readonly efficiency:number|null;
}
export interface PointRate{readonly n:number;readonly won:number;readonly pct:number|null;}
export interface PointsSummary{
 readonly closed:number;readonly unknownServe:number;
 readonly k1:PointRate;readonly k2:PointRate;
}
export interface SkillCoverage{
 readonly skill:string;readonly n:number;
 readonly properties:{team:number;player:number;evaluation:number;zone:number;video:number;
  tempo?:number;target?:number;direction?:number;attackTempo?:number};
}
export interface CoverageSummary{
 readonly bySkill:SkillCoverage[];readonly missingIDs:number;
 readonly unknownTeams:number;readonly invalidValues:number;
}
export interface PointsReconciliation{
 readonly oldK1:unknown;readonly newK1:number;readonly oldK2:unknown;
 readonly newK2:number;readonly agrees:boolean;readonly note:string;
}

/** Exact equivalent of VC_DATA_ENGINE_1938.filter (not the later Rally Search query). */
export function filterAnalysis(data:NormalizedAnalysis,f:AnalysisEngineFilters={}):FilteredAnalysis{
 const target=team(f.team),set=present(f.set)?Number(f.set):null,
  rotation=present(f.rotation)?Number(f.rotation):null;
 const phase=val(f.phase).toUpperCase(),skill=val(f.skill).toUpperCase(),
  evalCode=val(f.evaluation),player=val(f.player).toLocaleLowerCase('es');
 const start=normalizeAnalysisZone(f.startZone),end=normalizeAnalysisZone(f.endZone),
  setter=val(f.setter).toLocaleLowerCase('es');
 const rallyBase=data.rallies.filter(r=>r.closed&&(!set||r.set===set)&&
  (!rotation||(!target?false:(target==='ours'?r.ownRotation:r.rivalRotation)===rotation))&&
  (!phase||!!r.serving&&(!target?false:phase==='K1'?r.serving!==target:phase==='K2'?r.serving===target:false)));
 const candidates=new Set(rallyBase.map(r=>r.key));
 const actionFiltered=!!(skill||evalCode||player||start||end||f.video===true);
 const contacts=data.contacts.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&
  (!skill||c.skill===skill)&&(!evalCode||c.evaluation===evalCode)&&
  (!player||c.player?.toLocaleLowerCase('es')===player)&&
  (!start||c.fields.startZone?.code===start.code)&&(!end||c.fields.endZone?.code===end.code)&&
  (f.video!==true||c.video));
 const chains=data.chains.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&
  (!setter||c.setter.player?.toLocaleLowerCase('es')===setter));
 // A setter AND action must belong to the same possession.
 const allowedPossessions=setter?new Set(chains.map(c=>c.possessionKey)):null;
 const matchingContacts=allowedPossessions?contacts.filter(c=>allowedPossessions.has(c.possessionKey!)):contacts;
 const chosen=new Set(actionFiltered?matchingContacts.map(c=>c.rallyKey):
  setter?chains.map(c=>c.rallyKey):rallyBase.map(r=>r.key));
 const rallies=rallyBase.filter(r=>chosen.has(r.key)),keys=new Set(rallies.map(r=>r.key));
 return {rallies,contacts:matchingContacts.filter(c=>keys.has(c.rallyKey)),
  possessions:data.possessions.filter(p=>keys.has(p.rallyKey)&&(!target||p.team===target)&&
   (!allowedPossessions||allowedPossessions.has(p.key))),
  chains:chains.filter(c=>keys.has(c.rallyKey)),target,filters:f};
}

export function evaluateAnalysisContacts(contacts:readonly NormalizedContact[]|null|undefined,skill='A'):EvaluationSummary{
 const rows=arr(contacts).filter(c=>c.skill===skill),rated=rows.filter(c=>c.evaluation),
  kills=rated.filter(c=>c.evaluation==='#').length,
  errors=rated.filter(c=>c.evaluation==='=').length,
  blocked=rated.filter(c=>c.evaluation==='/').length;
 return {recorded:rows.length,rated:rated.length,missing:rows.length-rated.length,
  kills,errors,blocked,killPct:pct(kills,rated.length),
  efficiency:skill==='A'?pct(kills-errors-blocked,rated.length):null};
}

export function calculateAnalysisPoints(rows:readonly NormalizedRally[]|null|undefined,teamId:unknown):PointsSummary|null{
 const target=team(teamId);if(!target)return null;
 const valid=arr(rows).filter(r=>r.closed),k1=valid.filter(r=>r.serving&&r.serving!==target),
  k2=valid.filter(r=>r.serving===target);
 const calc=(list:readonly NormalizedRally[]):PointRate=>{
  const won=list.filter(r=>r.winner===target).length;
  return {n:list.length,won,pct:pct(won,list.length)};
 };
 return {closed:valid.length,unknownServe:valid.filter(r=>!r.serving).length,k1:calc(k1),k2:calc(k2)};
}

export function inspectAnalysisCoverage(data:NormalizedAnalysis):CoverageSummary{
 const all=data.contacts,bySkill:SkillCoverage[]=[];
 for(const s of ['S','R','E','A','B','D']){
  const rows=all.filter(c=>c.skill===s),n=rows.length;
  const properties:SkillCoverage['properties']={
   team:rows.filter(c=>c.team).length,player:rows.filter(c=>c.player).length,
   evaluation:rows.filter(c=>c.evaluation).length,
   zone:rows.filter(c=>c.fields.contactZone||c.fields.startZone||c.fields.endZone||
    (s==='E'&&c.fields.setTarget)).length,
   video:rows.filter(c=>c.video).length
  };
  if(s==='E'){
   properties.tempo=rows.filter(c=>c.fields.tempo).length;
   properties.target=rows.filter(c=>c.fields.setTarget).length;
  }
  if(s==='A'){
   properties.direction=rows.filter(c=>c.fields.direction).length;
   properties.attackTempo=rows.filter(c=>c.fields.attackTempo).length;
  }
  bySkill.push({skill:s,n,properties});
 }
 return {bySkill,missingIDs:data.contacts.filter(c=>!c.nativeId).length,
  unknownTeams:data.contacts.filter(c=>!c.team).length,
  invalidValues:data.issues.filter(issue=>['invalid-zone','unknown-evaluation','unknown-skill',
   'duplicate-action','duplicate-rally','duplicate-set'].includes(issue.type)).length};
}

export function reconcileAnalysisPoints(data:Pick<NormalizedAnalysis,'rallies'>,
 legacy:unknown,teamId:unknown):PointsReconciliation|null{
 const target=team(teamId),ours=calculateAnalysisPoints(data.rallies,target);
 const previous=(legacy&&typeof legacy==='object'?('points' in legacy?
  (legacy as {points?:unknown}).points:undefined):undefined) as Record<string,unknown>|null|undefined;
 if(!ours||!previous)return null;
 const oldK1=(previous.k1 as {n?:unknown}|null|undefined)?.n;
 const oldK2=(previous.k2 as {n?:unknown}|null|undefined)?.n;
 return {oldK1,newK1:ours.k1.n,oldK2,newK2:ours.k2.n,
  agrees:oldK1===ours.k1.n&&oldK2===ours.k2.n,
  note:'La comparación es de denominadores, no sustituye los cálculos oficiales.'};
}
