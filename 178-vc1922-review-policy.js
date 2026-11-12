/* Volley Coach V19.2.2 — pure review / MSE retention decisions.
 * Kept independent from MediaRecorder, REC and cloud syncing.
 */
(function(root,factory){
  'use strict';
  const policy=factory();
  if(typeof module==='object'&&module.exports)module.exports=policy;
  if(root)root.VC_VIDEO_REVIEW_POLICY_1922=policy;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='19.2.2';
  const finite=n=>Number.isFinite(n);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  function usableRanges(ranges){
    if(!ranges||!Number.isInteger(ranges.length))return [];
    const out=[];
    try{
      for(let i=0;i<ranges.length;i++){
        const start=Number(ranges.start(i)),end=Number(ranges.end(i));
        if(finite(start)&&finite(end)&&end-start>=.15)out.push({start,end,span:end-start,index:i});
      }
    }catch(_){return []}
    return out;
  }
  function reviewRange(ranges,position){
    const chunks=usableRanges(ranges);
    if(!chunks.length)return null;
    const current=Number(position);
    const selected=finite(current)
      ?chunks.find(({start,end})=>current>=start-.05&&current<end+.05)
      :null;
    const r=selected||chunks[chunks.length-1];
    return {start:r.start,end:r.end,span:r.span,disconnected:r.index>0,expired:!selected&&finite(current),latest:r.index===chunks[chunks.length-1].index};
  }
  function reviewSeek(range,value){
    if(!range||!finite(range.start)||!finite(range.end)||range.end-range.start<.4)return null;
    const n=Number(value);
    if(!finite(n))return null;
    return clamp(n,range.start+.05,range.end-.25);
  }
  function prunePlan({start,end,keepSeconds,playbackTime,playbackStarted=false,mode='delay',force=false}={}){
    const length=end-start,keep=clamp(Number(keepSeconds)||120,20,900);
    if(!finite(start)||!finite(end)||length<=5)return null;
    if(!force&&length<=keep+8)return null;
    // Under memory pressure remove some old material, even if the requested
    // retention period has not yet elapsed. Never remove the newest four seconds.
    const natural=Math.max(start,end-keep);
    const emergency=force?start+Math.min(12,Math.max(0,(length-5)*.5)):start;
    const cutoff=clamp(Math.max(natural,emergency),start,end-4);
    if(cutoff<=start+.25)return null;
    const position=Number(playbackTime);
    const safePlayback=playbackStarted&&finite(position);
    const reviewExpired=safePlayback&&mode!=='delay'&&position<cutoff+5;
    const autoOutOfWindow=safePlayback&&mode==='delay'&&position<cutoff+5;
    const needsReturn=reviewExpired||autoOutOfWindow;
    // When returning to automatic mode, the caller moves the playhead BEFORE
    // removing source buffer data. Otherwise retain five seconds behind it.
    const removeEnd=needsReturn||!safePlayback
      ?cutoff:Math.min(cutoff,Math.max(start,position-5));
    if(removeEnd<=start+.25)return null;
    return {removeEnd,reviewExpired,needsReturn,retainedSeconds:end-removeEnd};
  }
  return Object.freeze({VERSION,usableRanges,reviewRange,reviewSeek,prunePlan});
});
