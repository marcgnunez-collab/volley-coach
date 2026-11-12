/* Volley Coach V19.2.3 · A single clock for REC and scouting.
 * Pure, source-aware mapping; no media, DOM, cloud or match mutations.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VC_VIDEO_TIMELINE_1923=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='19.2.3';
  const valid=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
  const parse=v=>typeof v==='number'&&Number.isFinite(v)?v:Date.parse(String(v||''));
  const matchStart=m=>parse(m?.clockStartedAt||m?.createdAt);
  const recordingStart=r=>parse(r?.startedAt);
  function windows(rec){
    const start=recordingStart(rec),end=parse(rec?.endedAt);
    if(!Number.isFinite(start))return [];
    return (Array.isArray(rec?.pauseWindows)?rec.pauseWindows:[]).map(w=>({
      start:parse(w.startAt),end:parse(w.endAt)
    })).filter(w=>Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.end>w.start&&w.start>=start&&(!Number.isFinite(end)||w.end<=end+1000)).sort((a,b)=>a.start-b.start);
  }
  function wallAtScoutMs(match,scoutMs){
    const start=matchStart(match);
    if(!Number.isFinite(start)||!valid(scoutMs)||Number(scoutMs)<0)return null;
    return start+Number(scoutMs);
  }
  function mediaTime(match,scoutMs,rec,correction=0){
    const wall=wallAtScoutMs(match,scoutMs),start=recordingStart(rec);
    if(wall===null||!Number.isFinite(start)||!valid(correction)||wall<start)return null;
    if(rec?.match?.id!=null&&match?.id!=null&&String(rec.match.id)!==String(match.id))return null;
    const end=parse(rec?.endedAt);
    if(Number.isFinite(end)&&wall>end)return null;
    let paused=0,lastEnd=start;
    for(const w of windows(rec)){
      // A stopped recorder has no frames within its pause window.
      if(wall>=w.start&&wall<w.end)return null;
      const clipped=Math.max(w.start,lastEnd);
      if(wall>=w.end)paused+=Math.max(0,w.end-clipped);
      lastEnd=Math.max(lastEnd,w.end);
    }
    const seconds=(wall-start-paused)/1000+Number(correction);
    if(!Number.isFinite(seconds)||seconds<0)return null;
    const duration=Number(rec?.durationMs);
    if(rec?.completed===true&&valid(rec.durationMs)&&duration>0&&seconds>duration/1000+1)return null;
    return seconds;
  }
  function scoutMsAtMediaTime(match,videoTime,rec,correction=0){
    const scoutStart=matchStart(match),start=recordingStart(rec);
    if(!Number.isFinite(scoutStart)||!Number.isFinite(start)||!valid(videoTime)||!valid(correction))return null;
    const elapsed=(Number(videoTime)-Number(correction))*1000;
    if(elapsed<0)return null;
    let wall=start+elapsed;
    for(const w of windows(rec)){
      if(w.start<=wall)wall+=w.end-w.start;
    }
    const ms=wall-scoutStart;
    return Number.isFinite(ms)&&ms>=0?ms:null;
  }
  function liveKeys(match){
    const keys=new Set();
    (Array.isArray(match?.sets)?match.sets:[]).forEach(s=>(Array.isArray(s.rallies)?s.rallies:[]).forEach(r=>{
      keys.add(`r:${s.number}:${r.id}`);
      (Array.isArray(r.actions)?r.actions:[]).forEach(a=>keys.add(`a:${s.number}:${r.id}:${a.id}`));
    }));
    const live=match?.liveRally;
    if(live){(Array.isArray(live.actions)?live.actions:[]).forEach(a=>keys.add(`a:${match.currentSet}:${live.id}:${a.id}`));}
    return keys;
  }
  function staleClips(match){const keys=liveKeys(match);return (Array.isArray(match?.video?.clips)?match.video.clips:[]).filter(c=>c.scoutingLinked&&String(c.sourceKey||'').match(/^[ar]:/)&&!keys.has(String(c.sourceKey)));}
  return Object.freeze({VERSION,matchStart,recordingStart,windows,wallAtScoutMs,mediaTime,scoutMsAtMediaTime,liveKeys,staleClips});
});
