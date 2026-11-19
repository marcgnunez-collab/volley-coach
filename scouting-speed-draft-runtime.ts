/* V20.5.32 · Defensive bridge for the historical input-only helper.
 * Exposes pure draft transforms; original scouting owns all validation and writes.
 */
import {parseScoutingDraftHead,applyScoutingDraftSkill,applyScoutingDraftRating,
 cycleScoutingDraftRating,recentScoutingDraftCodes} from './scouting-speed-draft';
import {inspectScoutingSequence} from './scouting-sequence-check';

export interface ScoutingDraftBridge{
 readonly VERSION:'20.5.32';readonly inputOnly:true;
 readonly parseHead:typeof parseScoutingDraftHead;
 readonly applySkill:typeof applyScoutingDraftSkill;
 readonly applyRating:typeof applyScoutingDraftRating;
 readonly cycleRating:typeof cycleScoutingDraftRating;
 readonly recentCodes:typeof recentScoutingDraftCodes;
 readonly inspectSequence:typeof inspectScoutingSequence;
}
export type ScoutingDraftWindow=Window&{VC_SCOUT_DRAFT_20532?:Readonly<ScoutingDraftBridge>};
const installed=new WeakMap<Window,Readonly<ScoutingDraftBridge>>();

export function installScoutingDraftBridge(win:ScoutingDraftWindow):Readonly<ScoutingDraftBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<ScoutingDraftBridge>=Object.freeze({
  VERSION:'20.5.32',inputOnly:true,
  parseHead:parseScoutingDraftHead,applySkill:applyScoutingDraftSkill,
  applyRating:applyScoutingDraftRating,cycleRating:cycleScoutingDraftRating,
  recentCodes:recentScoutingDraftCodes,inspectSequence:inspectScoutingSequence
 });
 installed.set(win,bridge);
 // Existing pages may already have another bridge. Never replace unknown code.
 if(!win.VC_SCOUT_DRAFT_20532)win.VC_SCOUT_DRAFT_20532=bridge;
 return bridge;
}
