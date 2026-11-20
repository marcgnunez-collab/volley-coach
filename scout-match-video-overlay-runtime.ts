/* V20.5.51 · Read-only bridge for the original V7.0 video metadata overlay. */
import {normalizeMatchVideoOverlay} from './scout-match-video-overlay';

export interface MatchVideoOverlayBridge{
 readonly VERSION:'20.5.51';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeMatchVideoOverlay;
}
export type MatchVideoOverlayWindow=Window&{
 VC_SCOUT_VIDEO_OVERLAY_20551?:Readonly<MatchVideoOverlayBridge>;
};
const installed=new WeakMap<Window,Readonly<MatchVideoOverlayBridge>>();
export function installMatchVideoOverlayBridge(win:MatchVideoOverlayWindow):Readonly<MatchVideoOverlayBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<MatchVideoOverlayBridge>=Object.freeze({
  VERSION:'20.5.51',pureOnly:true,normalize:normalizeMatchVideoOverlay
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_VIDEO_OVERLAY_20551)win.VC_SCOUT_VIDEO_OVERLAY_20551=api;
 return api;
}
