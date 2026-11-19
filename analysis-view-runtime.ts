/* V20.5.29 · Read-only compatibility bridge for the migrated Data Engine view.
 * Only aggregate timings are retained; no scouting records or player names.
 */
import {renderDataEngineView,type DataEngineViewInput,type DataEngineView} from './analysis-view';

export interface AnalysisViewDiagnostics{
 readonly readOnly:true;readonly renders:number;readonly failures:number;
 readonly slowRenders:number;readonly lastMs:number;readonly averageMs:number;
 readonly maxMs:number;readonly budgetMs:16;
}
export interface AnalysisViewBridge{
 readonly VERSION:'20.5.29';readonly readOnly:true;
 readonly renderDataEngine:(input:DataEngineViewInput)=>DataEngineView;
 readonly diagnostics:()=>Readonly<AnalysisViewDiagnostics>;
}
export type AnalysisViewWindow=Window&{
 VC_ANALYSIS_VIEW_20529?:Readonly<AnalysisViewBridge>;
};
const installed=new WeakMap<Window,Readonly<AnalysisViewBridge>>();

export function installAnalysisViewBridge(win:AnalysisViewWindow):Readonly<AnalysisViewBridge>{
 const previous=installed.get(win);if(previous)return previous;
 let renders=0,failures=0,slowRenders=0,lastMs=0,averageMs=0,maxMs=0;
 const clock=()=>{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();};
 const bridge:Readonly<AnalysisViewBridge>=Object.freeze({
  VERSION:'20.5.29',readOnly:true,
  renderDataEngine(input:DataEngineViewInput){
   const start=clock();
   try{return renderDataEngineView(input);}
   catch(error){failures++;throw error;}
   finally{
    const elapsed=clock()-start;
    lastMs=Number.isFinite(elapsed)&&elapsed>=0?Math.round(elapsed*100)/100:0;
    renders++;averageMs+=(lastMs-averageMs)/renders;
    maxMs=Math.max(maxMs,lastMs);if(lastMs>16)slowRenders++;
   }
  },
  diagnostics:()=>Object.freeze({readOnly:true as const,renders,failures,slowRenders,
   lastMs,averageMs:Math.round(averageMs*100)/100,maxMs,budgetMs:16 as const})
 });
 installed.set(win,bridge);win.VC_ANALYSIS_VIEW_20529=bridge;return bridge;
}
