/* V20.5.50 · Read-only video container bridge for saved scouting matches. */
import {normalizeScoutingMatchVideoContainer} from './scout-match-video-container';

export interface ScoutMatchVideoContainerBridge{
 readonly VERSION:'20.5.50';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeScoutingMatchVideoContainer;
}
export type ScoutMatchVideoContainerWindow=Window&{
 VC_SCOUT_MATCH_VIDEO_20550?:Readonly<ScoutMatchVideoContainerBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutMatchVideoContainerBridge>>();
export function installScoutMatchVideoContainerBridge(win:ScoutMatchVideoContainerWindow):Readonly<ScoutMatchVideoContainerBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutMatchVideoContainerBridge>=Object.freeze({
  VERSION:'20.5.50',pureOnly:true,normalize:normalizeScoutingMatchVideoContainer
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_MATCH_VIDEO_20550)win.VC_SCOUT_MATCH_VIDEO_20550=api;
 return api;
}
