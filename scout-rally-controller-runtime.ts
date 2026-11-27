/* V20.5.80 · Vite-owned controller factory; historical native writer is injected. */
import {createLiveRallyController} from './scout-rally-controller';

export interface LiveRallyControllerBridge{
 readonly VERSION:'20.5.80';
 readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly create:typeof createLiveRallyController;
}
type Host=Window&{VC_RALLY_CONTROLLER_20580?:Readonly<LiveRallyControllerBridge>};
const installed=new WeakMap<Window,Readonly<LiveRallyControllerBridge>>();
export function installLiveRallyController(win:Host):Readonly<LiveRallyControllerBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<LiveRallyControllerBridge>=Object.freeze({
  VERSION:'20.5.80',nativeOnly:true,singleNativeWriter:true,create:createLiveRallyController
 });
 installed.set(win,bridge);
 if(!win.VC_RALLY_CONTROLLER_20580)win.VC_RALLY_CONTROLLER_20580=bridge;
 return bridge;
}
