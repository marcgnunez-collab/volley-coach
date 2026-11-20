/* V20.5.53 · Read-only Vite bridge for historical rally video timestamps. */
import {normalizeRallyVideoBounds} from './scout-rally-video-bounds';

export interface RallyVideoBoundsBridge{
 readonly VERSION:'20.5.53';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeRallyVideoBounds;
}
export type RallyVideoBoundsWindow=Window&{
 VC_SCOUT_RALLY_VIDEO_20553?:Readonly<RallyVideoBoundsBridge>;
};
const installed=new WeakMap<Window,Readonly<RallyVideoBoundsBridge>>();
export function installRallyVideoBoundsBridge(win:RallyVideoBoundsWindow):Readonly<RallyVideoBoundsBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<RallyVideoBoundsBridge>=Object.freeze({
  VERSION:'20.5.53',pureOnly:true,normalize:normalizeRallyVideoBounds
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_RALLY_VIDEO_20553)win.VC_SCOUT_RALLY_VIDEO_20553=api;
 return api;
}
