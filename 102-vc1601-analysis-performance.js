
(()=>{
  'use strict';
  const view=()=>document.getElementById('scout-analysis');
  const visible=()=>!!view()?.classList.contains('active');
  const allTab=()=>String(view()?.dataset.v115Tab||'summary');
  const counts={requests:0,executed:0,skipped:0,tabChanges:0};
  // Keep calculations precise: no durable cache of mutable rallies or actions.
  window.VC_PERF_TAB_ENABLED=function(group){
    if(!visible())return false;
    const tab=allTab();
    return tab==='all'||tab===group;
  };
  // Individual tables and phase analysis are expensive. Render only the selected tab.
  function guard(property,groups){
    const original=window[property];
    if(typeof original!=='function'||original.__vc1601)return;
    const wrapped=function(...args){
      counts.requests++;
      if(!visible()||(!groups.includes(allTab())&&allTab()!=='all')){counts.skipped++;return;}
      counts.executed++;
      return original.apply(this,args);
    };
    wrapped.__vc1601=true;
    window[property]=wrapped;
  }
  guard('scoutRenderPlayerAnalytics',['players']);
  // Avoid hiding tactical panels in mixed tabs; v830/v840 already gate their subpanels.
  // Refresh current tab on demand: otherwise panels skipped while hidden could be stale.
  const old=window.v115SetAnalysisTab;
  let scheduled=false;
  if(typeof old==='function'&&!old.__vc1601){
    const wrapped=function(tab){
      const before=allTab(),out=old.apply(this,arguments),after=allTab();
      if(visible()&&before!==after&&!scheduled){
        counts.tabChanges++; scheduled=true;
        requestAnimationFrame(()=>{scheduled=false;try{window.scoutRenderAnalysis?.()}catch(e){console.warn('Análisis V16.0.1',e)}});
      }
      return out;
    };
    wrapped.__vc1601=true;window.v115SetAnalysisTab=wrapped;
  }
  window.VC_ANALYSIS_PERFORMANCE={version:'16.0.1',diagnostics:()=>({...counts,tab:allTab(),active:visible()})};
})();
