/* V20.5.45 · Pure scouting-contact and video-time metadata projections.
 * No camera, match, journal, storage or user-interface writes here.
 */
type RecordLike=Record<string,any>;
function baseToken(token:unknown):string{
 return String(token||'').match(/[1-9]/)?.[0]||'';
}
function subToken(token:unknown):string{
 return String(token||'').toUpperCase().match(/[A-D]/)?.[0]||'';
}

/** Mirrors the V8.8 Data Volley overlay, reading the rally without mutating it. */
export function projectDataVolleyFields(action:unknown,match:unknown):Record<string,unknown>{
 const a=action as RecordLike|null|undefined,m=match as RecordLike|null|undefined;
 const skill=a?.skill||'',start=String(a?.startZone||''),end=String(a?.endZone||'');
 const contact=String(a?.contactZone||((skill==='R'||skill==='D')?(end||start):'')||'');
 let dvStart=baseToken(a?.dvStartZone||start),dvEnd=baseToken(a?.dvEndZone||end),
  dvEndSub=subToken(a?.dvEndSubzone||end),sourceId=a?.dvSourceActionId!=null?Number(a.dvSourceActionId):null;
 if(skill==='R'||skill==='D'){
  const wanted=skill==='R'?'S':'A',other=a?.team==='ours'?'opponent':'ours';
  const actions=Array.isArray(m?.liveRally?.actions)?m.liveRally.actions:[];
  const prev=[...actions].reverse().find(item=>item.team===other&&item.skill===wanted);
  if(prev){
   dvStart=baseToken(prev.startZone);dvEnd=baseToken(prev.endZone);
   dvEndSub=subToken(prev.endZone);sourceId=Number(prev.id)||null;
  }
 }
 const serving=m?.servingTeam==='opponent'?'opponent':'ours';
 const pointPhase=a?.team===serving?'Breakpoint':'Sideout';
 const dvPhase=skill==='S'?'Serve':(a?.phase==='K1'?'Reception':'Transition');
 let attackPhase='';
 if(skill==='A')attackPhase=a?.phase==='K1'?'Reception':
  (pointPhase==='Breakpoint'?'Transition breakpoint':'Transition sideout');
 return {contactZone:contact,dvStartZone:dvStart,dvEndZone:a?.endCone?'':dvEnd,
  dvEndSubzone:a?.endCone?'':dvEndSub,
  dvEndCone:a?.endCone?Number(a.endCone):null,dvSourceActionId:sourceId,
  dvPointPhase:pointPhase,dvPhase,dvAttackPhase:attackPhase};
}

/** V13.2 historical rendering priority; rejects negative or invalid video time. */
export function readActionVideoTime(action:unknown):number|null{
 const a=action as RecordLike|null|undefined;
 for(const key of ['videoTimestamp','liveVideoTime','videoAction','videoTime']){
  const raw=a?.[key];
  if(raw==null||raw==='')continue;
  const n=Number(raw);
  if(Number.isFinite(n)&&n>=0)return n;
 }
 return null;
}

/** V13.2 normalization priority: raw timestamp, live time, action, video. */
export function normalizeActionVideoTimestamp(rawAction:unknown,normalizedAction:unknown):number|null{
 const raw=(rawAction||{}) as RecordLike,x=normalizedAction as RecordLike;
 const vals=[raw.videoTimestamp,raw.liveVideoTime,x.videoAction,raw.videoAction,
  x.videoTime,raw.videoTime].filter(v=>v!=null&&v!=='').map(Number);
 const time=vals.find(Number.isFinite);
 return Number.isFinite(time)?Math.max(0,time as number):null;
}
