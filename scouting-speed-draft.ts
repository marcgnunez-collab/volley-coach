/* V20.5.32 · Pure Scouting Speed Pro draft operations.
 * Byte-for-byte behavioral parity with the V20.2.1 input helper is the goal.
 * This module never submits an action, awards a point or persists a match.
 */

export interface DraftHead{
 readonly code:string;readonly side:string;readonly number:string;
 readonly skill:string|undefined;readonly rating:string|undefined;readonly tail:string;
}
export interface DraftContext{readonly number?:unknown;readonly team?:unknown}
interface RecordedAction{readonly code?:unknown}
interface RecordedRally{readonly actions?:ReadonlyArray<RecordedAction>}
interface RecordedSet{readonly rallies?:ReadonlyArray<RecordedRally>}
export interface RecordedMatch{
 readonly liveRally?:RecordedRally;readonly sets?:ReadonlyArray<RecordedSet>;
}

const SKILLS=['S','R','E','A','B','D','F','C'] as const;
const RATINGS=['#','+','!','-','/','='] as const;
const CODE=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
const VALID_START=/^[.:~^@|*%&?$]/;
const string=(value:unknown)=>String(value??'');
const clean=(value:unknown)=>string(value).trim().toUpperCase().replace(/\s+/g,'');

/** A partial header is valid for drafting; it is NOT native-code approval. */
export function parseScoutingDraftHead(raw:unknown):DraftHead|null{
 const code=clean(raw),match=code.match(CODE);
 if(!match)return null;
 if(match[5]&&!VALID_START.test(match[5]))return null;
 return {code,side:match[1],number:match[2],skill:match[3],rating:match[4],tail:match[5]};
}

function contextPrefix(context:DraftContext|null|undefined):string|null{
 const number=string(context?.number||'').trim();
 if(!/^\d{1,3}$/.test(number))return null;
 if(context?.team!=='ours'&&context?.team!=='opponent')return null;
 return (context.team==='opponent'?'R':'')+number;
}

export function applyScoutingDraftSkill(raw:unknown,skill:unknown,context?:DraftContext|null):string|null{
 if(!SKILLS.some(value=>value===skill))return null;
 const code=clean(raw);
 if(!code){const prefix=contextPrefix(context);return prefix?prefix+skill:null;}
 const head=parseScoutingDraftHead(code);if(!head)return null;
 return head.side+head.number+skill+(head.rating||'')+head.tail;
}

export function applyScoutingDraftRating(raw:unknown,rating:unknown):string|null{
 if(!RATINGS.some(value=>value===rating))return null;
 const head=parseScoutingDraftHead(raw);if(!head||!head.skill)return null;
 return head.side+head.number+head.skill+rating+head.tail;
}

export function cycleScoutingDraftRating(raw:unknown,step=1):string|null{
 const head=parseScoutingDraftHead(raw);if(!head||!head.skill)return null;
 const i=RATINGS.findIndex(value=>value===head.rating);
 const next=RATINGS[(i+(step>0?1:RATINGS.length-1)+RATINGS.length)%RATINGS.length];
 return applyScoutingDraftRating(raw,next);
}

/** Recent codes are read from the active match, never modified or cached. */
export function recentScoutingDraftCodes(match:RecordedMatch|null|undefined,limit=8):string[]{
 if(!match)return [];
 const result:string[]=[];
 const collect=(list:ReadonlyArray<RecordedAction>|undefined)=>{
  for(let i=(Array.isArray(list)?list.length:0)-1;i>=0&&result.length<limit;i--){
   const code=clean(list?.[i]?.code);
   if(code.length<=140&&parseScoutingDraftHead(code)?.skill&&!result.includes(code))result.push(code);
  }
 };
 collect(match.liveRally?.actions);
 const sets=Array.isArray(match.sets)?match.sets:[];
 for(let si=sets.length-1;si>=0&&result.length<limit;si--){
  const rallies=Array.isArray(sets[si]?.rallies)?sets[si].rallies:[];
  for(let ri=rallies.length-1;ri>=0&&result.length<limit;ri--)collect(rallies[ri]?.actions);
 }
 return result;
}
