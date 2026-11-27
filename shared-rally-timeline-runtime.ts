/* V20.6.2 · Bridge adds no writer, cache, subscriptions or shadow match. */
import {listClosedRallyRefs,lastClosedRallyRef,listClosedRallies,
 projectRallyReviewRows,projectRecentRallies} from './shared-rally-timeline';

export interface SharedRallyTimelineBridge{
 readonly VERSION:'20.6.2';
 readonly readOnly:true;
 readonly canonicalReferences:true;
 readonly entries:typeof listClosedRallyRefs;
 readonly last:typeof lastClosedRallyRef;
 readonly rallies:typeof listClosedRallies;
 readonly review:typeof projectRallyReviewRows;
 readonly recent:typeof projectRecentRallies;
}
export type SharedRallyTimelineWindow=Window&{
 VC_RALLY_TIMELINE_2062?:Readonly<SharedRallyTimelineBridge>;
};
const installed=new WeakMap<Window,Readonly<SharedRallyTimelineBridge>>();

export function installSharedRallyTimeline(win:SharedRallyTimelineWindow):Readonly<SharedRallyTimelineBridge>{
 const existing=installed.get(win);if(existing)return existing;
 const bridge:Readonly<SharedRallyTimelineBridge>=Object.freeze({
  VERSION:'20.6.2',readOnly:true,canonicalReferences:true,
  entries:listClosedRallyRefs,last:lastClosedRallyRef,rallies:listClosedRallies,
  review:projectRallyReviewRows,recent:projectRecentRallies
 });
 installed.set(win,bridge);
 if(!win.VC_RALLY_TIMELINE_2062)win.VC_RALLY_TIMELINE_2062=bridge;
 return bridge;
}
