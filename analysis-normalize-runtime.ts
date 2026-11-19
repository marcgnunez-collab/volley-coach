/* V20.5.24 · Read-only Vite bridge for the historical Data Engine normalizer.
 * No storage, native subscriptions, background work or independent scoring.
 */
import {normalizeAnalysisMatch,type NormalizedAnalysis} from './analysis-normalizer';

export interface NormalizationDiagnostics{
 readonly readOnly:true;
 readonly normalizations:number;
 readonly failures:number;
 readonly slowNormalizations:number;
 readonly lastMs:number;
 readonly averageMs:number;
 readonly maxMs:number;
 readonly budgetMs:16;
}
export interface AnalysisNormalizeBridge{
 readonly VERSION:'20.5.24';
 readonly readOnly:true;
 readonly normalize:(match:unknown)=>NormalizedAnalysis;
 readonly diagnostics:()=>Readonly<NormalizationDiagnostics>;
}
export type AnalysisNormalizeWindow=Window&{
 VC_ANALYSIS_NORMALIZE_20524?:Readonly<AnalysisNormalizeBridge>;
};
const bridges=new WeakMap<Window,Readonly<AnalysisNormalizeBridge>>();

/** Safe to install before historic deferred scripts finish loading. */
export function installAnalysisNormalizeBridge(win:AnalysisNormalizeWindow):Readonly<AnalysisNormalizeBridge>{
 const existing=bridges.get(win);if(existing)return existing;
 let normalizations=0,failures=0,slowNormalizations=0,lastMs=0,averageMs=0,maxMs=0;
 const clock=()=>{
  try{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();}
  catch(_){return Date.now();}
 };
 const bridge:Readonly<AnalysisNormalizeBridge>=Object.freeze({
  VERSION:'20.5.24',readOnly:true,
  normalize(match:unknown){
   const start=clock();
   try{return normalizeAnalysisMatch(match);}
   catch(error){failures++;throw error;}
   finally{
    const elapsed=clock()-start;
    lastMs=Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*100)/100:0;
    normalizations++;averageMs+=(lastMs-averageMs)/normalizations;
    maxMs=Math.max(maxMs,lastMs);if(lastMs>16)slowNormalizations++;
   }
  },
  diagnostics:()=>Object.freeze({readOnly:true as const,normalizations,failures,slowNormalizations,
   lastMs,averageMs:Math.round(averageMs*100)/100,maxMs,budgetMs:16 as const})
 });
 bridges.set(win,bridge);win.VC_ANALYSIS_NORMALIZE_20524=bridge;
 return bridge;
}
