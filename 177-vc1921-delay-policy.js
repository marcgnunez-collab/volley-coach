/* Volley Coach V19.2.1 — stable delay buffering policy.
 * Browser-independent calculations: the actual MediaRecorder/MediaSource engines
 * remain the existing modules. No new capture/REC pipeline is created here.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_VIDEO_DELAY_POLICY_1921=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='19.2.1';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function lastRange(ranges){
  if(!ranges||!Number.isInteger(ranges.length)||ranges.length<1)return null;
  // The sum of all buffered ranges is NOT continuous media. After a source
  // interruption the player can only seek within the latest contiguous range.
  try{
   for(let i=ranges.length-1;i>=0;i--){
    const start=Number(ranges.start(i)),end=Number(ranges.end(i));
    if(finite(start)&&finite(end)&&end>start)return {start,end,span:end-start,disconnected:i>0};
   }
  }catch(_){}
  return null;
 }
 function getTarget(range,delaySeconds){
  if(!range||!finite(range.start)||!finite(range.end)||range.end<=range.start)return null;
  const d=Math.max(1,Math.min(180,Number(delaySeconds)||10));
  const decodeMargin=d<=3?.28:d<=5?.38:.55;
  // Require at least 0.85 seconds beyond the configured delay for decoding.
  // Never point playback into gaps or at the very end of an MSE range.
  const required=Math.max(1.8,d+.85);
  if(range.span<required)return null;
  const target=Math.max(range.start+.15,Math.min(range.end-decodeMargin,range.end-d));
  return finite(target)?target:null;
 }
 function canvasSize(sourceWidth,sourceHeight,profile={}){
  const sw=Math.max(2,Number(sourceWidth)||1280),sh=Math.max(2,Number(sourceHeight)||720);
  const maxLong=Math.max(160,Math.min(1920,Number(profile.width)||1280));
  const maxShort=Math.max(90,Math.min(1080,Number(profile.height)||720));
  const long=Math.max(sw,sh),short=Math.min(sw,sh);
  const ratio=Math.min(1,maxLong/long,maxShort/short);
  const even=n=>Math.max(2,Math.round(n/2)*2);
  return {width:even(sw*ratio),height:even(sh*ratio),fps:Math.max(12,Math.min(30,Number(profile.fps)||30))};
 }
 function seekDecision({initial=false,outOfRange=false,seriousDrift=false,stalled=false,noProgress=false,seeking=false,now=0,lastSeekAt=0}={}){
  const needed=initial||outOfRange||seriousDrift||stalled||noProgress;
  // Throttle seeks; repeated seeks often cause decoded-video starvation.
  return needed&&!seeking&&(initial||now-lastSeekAt>=5000);
 }
 function playbackRate(diff){
  if(!finite(diff)||Math.abs(diff)<.4)return 1;
  // Recover small delay drift smoothly (maximum ±5%, instead of oscillating
  // playback position through seeks on each MediaRecorder fragment).
  return Math.max(.95,Math.min(1.05,1+diff*.025));
 }
 return Object.freeze({VERSION,lastRange,getTarget,canvasSize,seekDecision,playbackRate});
});
