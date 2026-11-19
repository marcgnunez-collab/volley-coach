/* V20.5.25 · Read-only bridge for Data Engine filtering, evaluation and coverage.
 * Instrumentation contains numbers only; it never keeps native scouting data.
 */
import {filterAnalysis,evaluateAnalysisContacts,calculateAnalysisPoints,
 inspectAnalysisCoverage,reconcileAnalysisPoints,type AnalysisEngineFilters,
 type FilteredAnalysis,type EvaluationSummary,type PointsSummary,
 type CoverageSummary,type PointsReconciliation} from './analysis-operations';
import type {NormalizedAnalysis,NormalizedContact,NormalizedRally} from './analysis-normalizer';

type Operation='filter'|'evaluate'|'points'|'coverage'|'reconcile';
export interface AnalysisOperationDiagnostics{
 readonly readOnly:true;readonly operations:number;readonly filters:number;
 readonly evaluations:number;readonly points:number;readonly coverage:number;
 readonly reconciliations:number;readonly failures:number;readonly slowOperations:number;
 readonly lastMs:number;readonly averageMs:number;readonly maxMs:number;
 readonly budgetMs:16;
}
export interface AnalysisOperationsBridge{
 readonly VERSION:'20.5.25';readonly readOnly:true;
 readonly filter:(data:NormalizedAnalysis,filters?:AnalysisEngineFilters)=>FilteredAnalysis;
 readonly evaluate:(contacts:readonly NormalizedContact[]|null|undefined,skill?:string)=>EvaluationSummary;
 readonly points:(rallies:readonly NormalizedRally[]|null|undefined,teamId:unknown)=>PointsSummary|null;
 readonly coverage:(data:NormalizedAnalysis)=>CoverageSummary;
 readonly reconcile:(data:Pick<NormalizedAnalysis,'rallies'>,previous:unknown,teamId:unknown)=>PointsReconciliation|null;
 readonly diagnostics:()=>Readonly<AnalysisOperationDiagnostics>;
}
export type AnalysisOperationsWindow=Window&{
 VC_ANALYSIS_OPERATIONS_20525?:Readonly<AnalysisOperationsBridge>;
};
const bridges=new WeakMap<Window,Readonly<AnalysisOperationsBridge>>();

export function installAnalysisOperationsBridge(win:AnalysisOperationsWindow):Readonly<AnalysisOperationsBridge>{
 const existing=bridges.get(win);if(existing)return existing;
 let operations=0,filters=0,evaluations=0,points=0,coverage=0,reconciliations=0;
 let failures=0,slowOperations=0,lastMs=0,averageMs=0,maxMs=0;
 const clock=()=>{
  try{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();}
  catch(_){return Date.now();}
 };
 const measure=<T>(kind:Operation,operation:()=>T):T=>{
  const start=clock();
  try{return operation();}
  catch(error){failures++;throw error;}
  finally{
   const elapsed=clock()-start;
   lastMs=Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*100)/100:0;
   operations++;averageMs+=(lastMs-averageMs)/operations;
   maxMs=Math.max(maxMs,lastMs);if(lastMs>16)slowOperations++;
   if(kind==='filter')filters++;
   else if(kind==='evaluate')evaluations++;
   else if(kind==='points')points++;
   else if(kind==='coverage')coverage++;
   else reconciliations++;
  }
 };
 const bridge:Readonly<AnalysisOperationsBridge>=Object.freeze({
  VERSION:'20.5.25',readOnly:true,
  filter:(data:NormalizedAnalysis,filters:AnalysisEngineFilters={})=>measure('filter',()=>filterAnalysis(data,filters)),
  evaluate:(contacts:readonly NormalizedContact[]|null|undefined,skill='A')=>
   measure('evaluate',()=>evaluateAnalysisContacts(contacts,skill)),
  points:(rallies:readonly NormalizedRally[]|null|undefined,teamId:unknown)=>
   measure('points',()=>calculateAnalysisPoints(rallies,teamId)),
  coverage:(data:NormalizedAnalysis)=>measure('coverage',()=>inspectAnalysisCoverage(data)),
  reconcile:(data:Pick<NormalizedAnalysis,'rallies'>,previous:unknown,teamId:unknown)=>
   measure('reconcile',()=>reconcileAnalysisPoints(data,previous,teamId)),
  diagnostics:()=>Object.freeze({readOnly:true as const,operations,filters,evaluations,points,
   coverage,reconciliations,failures,slowOperations,lastMs,
   averageMs:Math.round(averageMs*100)/100,maxMs,budgetMs:16 as const})
 });
 bridges.set(win,bridge);win.VC_ANALYSIS_OPERATIONS_20525=bridge;
 return bridge;
}
