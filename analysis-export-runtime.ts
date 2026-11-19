/* V20.5.26 · CSV bridge and numeric-only analysis index diagnostics.
 * Export is user-triggered in historical UI. No background IO or storage.
 */
import {exportAnalysisCSV,type AnalysisCSVData} from './analysis-export';
import {inspectAnalysisIndexDiagnostics,type AnalysisIndexDiagnostics} from './analysis-index';

export interface AnalysisExportDiagnostics{
 readonly readOnly:true;readonly exports:number;readonly failures:number;
 readonly lastMs:number;readonly averageMs:number;readonly maxMs:number;
 readonly slowExports:number;readonly budgetMs:16;
}
export interface AnalysisExportBridge{
 readonly VERSION:'20.5.26';readonly readOnly:true;
 readonly toCSV:(data:AnalysisCSVData)=>string;
 readonly diagnostics:()=>Readonly<AnalysisExportDiagnostics>;
 readonly indexDiagnostics:()=>Readonly<AnalysisIndexDiagnostics>;
}
export type AnalysisExportWindow=Window&{VC_ANALYSIS_CSV_20526?:Readonly<AnalysisExportBridge>};
const bridges=new WeakMap<Window,Readonly<AnalysisExportBridge>>();

export function installAnalysisExportBridge(win:AnalysisExportWindow):Readonly<AnalysisExportBridge>{
 const old=bridges.get(win);if(old)return old;
 let exports=0,failures=0,lastMs=0,averageMs=0,maxMs=0,slowExports=0;
 const clock=()=>{
  try{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();}
  catch(_){return Date.now();}
 };
 const bridge:Readonly<AnalysisExportBridge>=Object.freeze({
  VERSION:'20.5.26',readOnly:true,
  toCSV(data:AnalysisCSVData){
   const start=clock();
   try{return exportAnalysisCSV(data);}
   catch(error){failures++;throw error;}
   finally{
    const elapsed=clock()-start;
    lastMs=Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*100)/100:0;
    exports++;averageMs+=(lastMs-averageMs)/exports;
    maxMs=Math.max(maxMs,lastMs);if(lastMs>16)slowExports++;
   }
  },
  diagnostics:()=>Object.freeze({readOnly:true as const,exports,failures,lastMs,
   averageMs:Math.round(averageMs*100)/100,maxMs,slowExports,budgetMs:16 as const}),
  indexDiagnostics:inspectAnalysisIndexDiagnostics
 });
 bridges.set(win,bridge);win.VC_ANALYSIS_CSV_20526=bridge;
 return bridge;
}
