/* V20.5.59 · Pure, bounded read-after-write verification of the existing local store.
 * No writes, no JSON payloads in reports, no cloud or IndexedDB confirmation.
 */
export type LocalReadbackStatus='matched'|'different'|'missing'|'invalid'|'unverified'|'too-large';
export interface LocalReadbackInput{
 readonly raw:unknown;
 readonly snapshot:unknown;
 readonly matchId:unknown;
 readonly teamId:unknown;
 readonly unpack?:(packed:string)=>string;
}
export interface LocalReadbackResult{
 readonly version:'20.5.59';
 readonly state:LocalReadbackStatus;
 readonly scope:'primary-local-only';
 readonly journal:'not-confirmed';
 readonly cloud:'not-confirmed';
}
export const MAX_STORED_STATE_CHARS=6*1024*1024;
export const MAX_LOCAL_MATCH_CHARS=2*1024*1024;
export const MAX_PACKED_STATE_CHARS=512*1024;
const PREFIX='VC-LZW16-1:';
const result=(state:LocalReadbackStatus):Readonly<LocalReadbackResult>=>
 Object.freeze({version:'20.5.59',state,scope:'primary-local-only',
  journal:'not-confirmed',cloud:'not-confirmed'});

/** Captured at the instant the original writer reports success, before the next event. */
export function captureLocalMatchSnapshot(match:unknown):string|null{
 try{
  if(!match||typeof match!=='object'||Array.isArray(match))return null;
  const data=JSON.stringify(match);
  return typeof data==='string'&&data.length<=MAX_LOCAL_MATCH_CHARS?data:null;
 }catch(_){return null}
}

export function verifyStoredLocalMatch(input:LocalReadbackInput):Readonly<LocalReadbackResult>{
 try{
  if(typeof input?.snapshot!=='string'||!input.snapshot||
   input.snapshot.length>MAX_LOCAL_MATCH_CHARS||
   typeof input.teamId!=='string'||!(/^[a-zA-Z0-9_-]{1,64}$/).test(input.teamId)||
   (typeof input.matchId!=='string'&&typeof input.matchId!=='number')||
   !String(input.matchId).trim())return result('unverified');
  if(input.raw==null||input.raw==='')return result('missing');
  if(typeof input.raw!=='string')return result('invalid');
  let raw=input.raw;
  if(raw.startsWith(PREFIX)){
   if(raw.length>MAX_PACKED_STATE_CHARS)return result('too-large');
   if(typeof input.unpack!=='function')return result('unverified');
   try{raw=input.unpack(raw)}catch(_){return result('invalid')}
   if(typeof raw!=='string')return result('invalid');
  }
  if(raw.length>MAX_STORED_STATE_CHARS)return result('too-large');
  let data:unknown;
  try{data=JSON.parse(raw)}catch(_){return result('invalid')}
  if(!data||typeof data!=='object'||Array.isArray(data))return result('invalid');
  const teams=(data as Record<string,unknown>).equiposData;
  if(!teams||typeof teams!=='object'||Array.isArray(teams))return result('invalid');
  const team=(teams as Record<string,unknown>)[input.teamId];
  if(!team||typeof team!=='object'||Array.isArray(team))return result('missing');
  const matches=(team as Record<string,unknown>).scoutingMatches;
  if(!Array.isArray(matches))return result('missing');
  const selected=matches.filter(match=>!!match&&typeof match==='object'&&
   String((match as Record<string,unknown>).id)===String(input.matchId));
  if(selected.length===0)return result('missing');
  if(selected.length!==1)return result('invalid');
  return result(JSON.stringify(selected[0])===input.snapshot?'matched':'different');
 }catch(_){return result('unverified')}
}
