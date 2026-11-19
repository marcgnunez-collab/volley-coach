/* V20.5.12 · One typed contract for the existing V13 match-state publisher.
 * It never replaces the publisher, clones matches or creates write commands.
 */
import {asRecord} from '../domain/model';

export interface CanonicalMatchReader{
 readonly getActive?:()=>unknown;
 readonly getSet?:(match?:unknown)=>unknown;
 readonly subscribe?:(listener:()=>void)=>(()=>void)|void;
}
export type CanonicalMatchWindow=Window&{
 MatchState?:CanonicalMatchReader;
 VC_MATCH_STATE?:CanonicalMatchReader;
 VC_SCOUT_VIDEO_BRIDGE?:CanonicalMatchReader;
 VC_SCOUT_REPORT_BRIDGE?:CanonicalMatchReader;
};

/** Ordered fallbacks from the existing engine; no snapshots or storage reads. */
export function canonicalReaders(win:CanonicalMatchWindow):readonly (CanonicalMatchReader|undefined)[]{
 return [win.MatchState,win.VC_MATCH_STATE,win.VC_SCOUT_VIDEO_BRIDGE,win.VC_SCOUT_REPORT_BRIDGE];
}

export function readCanonicalMatch(win:CanonicalMatchWindow):Record<string,unknown>|null{
 for(const reader of canonicalReaders(win)){
  try{const match=asRecord(reader?.getActive?.());if(match)return match;}
  catch(_){/* Continue with an already-existing fallback. */}
 }
 return null;
}
