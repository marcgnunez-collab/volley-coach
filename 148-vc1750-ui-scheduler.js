/* Volley Coach V17.5.0 · UI scheduler.
 * Display-only: groups redundant DOM observer notifications into one animation
 * frame. No networking, match/training mutations, timers that poll data or sync.
 * Explicit button actions still call their existing handlers synchronously.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document&&!root.VC175_UI_SCHEDULER){
  const raf=typeof root.requestAnimationFrame==='function'?root.requestAnimationFrame.bind(root):cb=>root.setTimeout(cb,16);
  root.VC175_UI_SCHEDULER=api.createScheduler({raf,now:()=>root.performance?.now?.()??Date.now()});
  root.VC175_UI_SCHEDULER.version=api.VERSION;
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.5.0';
 function createScheduler({raf,now}={}){
  if(typeof raf!=='function')throw new TypeError('raf es necesario');
  const clock=typeof now==='function'?now:()=>Date.now();
  const jobs=new Map();let pending=false;
  const stats={frames:0,callbacks:0,coalesced:0,errors:0,maxQueue:0,totalCallbackMs:0,maxCallbackMs:0};
  function flush(){
   pending=false;
   const batch=[...jobs.entries()];jobs.clear();
   if(!batch.length)return;
   stats.frames++;
   for(const [key,fn] of batch){
    const start=clock();
    try{fn();}
    catch(err){stats.errors++;if(typeof console!=='undefined')console.error('[VC17.5 UI]',key,err)}
    finally{
     const duration=Math.max(0,clock()-start);
     stats.callbacks++;
     stats.totalCallbackMs+=duration;
     stats.maxCallbackMs=Math.max(stats.maxCallbackMs,duration);
    }
   }
  }
  function schedule(key,fn){
   if(typeof fn!=='function')return false;
   const name=String(key||'ui');
   if(jobs.has(name))stats.coalesced++;
   jobs.set(name,fn);
   stats.maxQueue=Math.max(stats.maxQueue,jobs.size);
   if(!pending){pending=true;raf(flush)}
   return true;
  }
  function diagnostics(){
   return {version:VERSION,frames:stats.frames,callbacks:stats.callbacks,
    coalesced:stats.coalesced,errors:stats.errors,maxQueue:stats.maxQueue,
    pendingKeys:[...jobs.keys()],averageCallbackMs:stats.callbacks?Math.round(100*stats.totalCallbackMs/stats.callbacks)/100:0,
    maxCallbackMs:Math.round(100*stats.maxCallbackMs)/100,
    readonly:true};
  }
  return {schedule,diagnostics};
 }
 return {VERSION,createScheduler};
});
