/* V20.5.30 · Read-only bridge for Rally Search presentation.
 * Numeric timings only; never retains search terms, scouting or player data.
 */
import {renderRallySearchView,type RallySearchView} from './rally-search-view';
import type {NormalizedAnalysis} from './analysis-normalizer';
import type {SearchResult} from './analysis-query';

export interface RallySearchViewDiagnostics{
 readonly readOnly:true;readonly renders:number;readonly failures:number;
 readonly slowRenders:number;readonly lastMs:number;readonly averageMs:number;
 readonly maxMs:number;readonly budgetMs:16;
}
export interface RallySearchViewBridge{
 readonly VERSION:'20.5.30';readonly readOnly:true;
 readonly render:(data:NormalizedAnalysis,result:SearchResult,
  filters?:Readonly<Record<string,unknown>>)=>RallySearchView;
 readonly diagnostics:()=>Readonly<RallySearchViewDiagnostics>;
}
export type RallySearchViewWindow=Window&{
 VC_RALLY_VIEW_20530?:Readonly<RallySearchViewBridge>;
};
const installed=new WeakMap<Window,Readonly<RallySearchViewBridge>>();

export function installRallySearchViewBridge(win:RallySearchViewWindow):Readonly<RallySearchViewBridge>{
 const previous=installed.get(win);if(previous)return previous;
 let renders=0,failures=0,slowRenders=0,lastMs=0,averageMs=0,maxMs=0;
 const clock=()=>{try{const n=win.performance?.now?.();return Number.isFinite(n)?n!:Date.now();}
  catch(_){return Date.now();}};
 const api:Readonly<RallySearchViewBridge>=Object.freeze({
  VERSION:'20.5.30',readOnly:true,
  render(data:NormalizedAnalysis,result:SearchResult,filters:Readonly<Record<string,unknown>>={}){
   const start=clock();
   try{return renderRallySearchView(data,result,filters);}
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
 installed.set(win,api);win.VC_RALLY_VIEW_20530=api;return api;
}
