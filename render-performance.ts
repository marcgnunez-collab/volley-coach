/* V20.5.28 · Read-only visual render gates and aggregate, numeric-only metrics.
 * Does not subscribe to native state, intercept scoring, or schedule any work.
 */
export type RenderArea='scouting-live'|'scouting-boxscore'|'data-engine'|'rally-search';
export type RenderOutcome='render'|'skip'|'error';
export interface RenderAreaDiagnostics{
 readonly requests:number;readonly rendered:number;readonly skipped:number;
 readonly failures:number;readonly lastMs:number;readonly maxMs:number;
 readonly averageMs:number;
}
export interface RenderDiagnostics{
 readonly readOnly:true;readonly areas:Readonly<Record<RenderArea,RenderAreaDiagnostics>>;
}
export interface RenderMetricsBridge{
 readonly VERSION:'20.5.28';readonly readOnly:true;
 readonly observe:(area:RenderArea,outcome:RenderOutcome,elapsedMs?:number)=>void;
 readonly diagnostics:()=>RenderDiagnostics;
}
export type RenderMetricsWindow=Window&{VC_RENDER_METRICS_20528?:Readonly<RenderMetricsBridge>};

type Counters={requests:number;rendered:number;skipped:number;failures:number;
 lastMs:number;maxMs:number;averageMs:number};
const AREAS:readonly RenderArea[]=['scouting-live','scouting-boxscore','data-engine','rally-search'];
const bridges=new WeakMap<Window,Readonly<RenderMetricsBridge>>();
const fresh=():Counters=>({requests:0,rendered:0,skipped:0,failures:0,
 lastMs:0,maxMs:0,averageMs:0});
const cleanMs=(ms:number)=>Number.isFinite(ms)&&ms>=0?Math.round(ms*100)/100:0;

export function installRenderMetricsBridge(win:RenderMetricsWindow):Readonly<RenderMetricsBridge>{
 const previous=bridges.get(win);if(previous)return previous;
 const counters=new Map<RenderArea,Counters>(AREAS.map(area=>[area,fresh()]));
 const api:Readonly<RenderMetricsBridge>=Object.freeze({
  VERSION:'20.5.28',readOnly:true,
  observe(area:RenderArea,outcome:RenderOutcome,elapsedMs=0){
   const row=counters.get(area);if(!row)return;
   row.requests++;
   if(outcome==='skip'){row.skipped++;return;}
   if(outcome==='error'){row.failures++;return;}
   row.rendered++;row.lastMs=cleanMs(elapsedMs);
   row.averageMs+=(row.lastMs-row.averageMs)/row.rendered;
   row.maxMs=Math.max(row.maxMs,row.lastMs);
  },
  diagnostics:()=>{
   const areas={} as Record<RenderArea,RenderAreaDiagnostics>;
   for(const area of AREAS){const row=counters.get(area)!;
    areas[area]=Object.freeze({...row,averageMs:Math.round(row.averageMs*100)/100});
   }
   return Object.freeze({readOnly:true as const,areas:Object.freeze(areas)});
  }
 });
 bridges.set(win,api);win.VC_RENDER_METRICS_20528=api;return api;
}

export interface ReadOnlyRenderGate{
 readonly render:(signature:string,paint:()=>void,force?:boolean)=>boolean;
 readonly invalidate:()=>void;
 readonly diagnostics:()=>Readonly<RenderAreaDiagnostics>;
}

/** Retains the exact last rendered signature only in this component instance. */
export function createReadOnlyRenderGate(options:{
 readonly now:()=>number;readonly staleAfterMs?:number;
 readonly report?:(outcome:RenderOutcome,elapsedMs:number)=>void;
}):ReadOnlyRenderGate{
 let signature:string|null=null,lastAt=-Infinity;
 const counts=fresh(),staleAfterMs=options.staleAfterMs??5000;
 const clock=()=>{const n=options.now();return Number.isFinite(n)?n:Date.now();};
 return Object.freeze({
  render(next:string,paint:()=>void,force=false){
   const start=clock();counts.requests++;
   if(!force&&signature===next&&start-lastAt<staleAfterMs){
    counts.skipped++;options.report?.('skip',0);return false;
   }
   try{
    paint();signature=next;lastAt=clock();counts.rendered++;
    counts.lastMs=cleanMs(lastAt-start);counts.maxMs=Math.max(counts.maxMs,counts.lastMs);
    counts.averageMs+=(counts.lastMs-counts.averageMs)/counts.rendered;
    options.report?.('render',counts.lastMs);return true;
   }catch(error){signature=null;counts.failures++;options.report?.('error',0);throw error;}
  },
  invalidate(){signature=null;lastAt=-Infinity;},
  diagnostics:()=>Object.freeze({...counts,averageMs:Math.round(counts.averageMs*100)/100})
 });
}
