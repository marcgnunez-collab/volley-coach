/* V20.5.76 · No native writer, parser, clock, store or media owned here. */
import {dispatchNativeDirectAction} from './scout-direct-action-lane';

export interface ScoutDirectActionBridge{
 readonly VERSION:'20.5.76';readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly dispatch:typeof dispatchNativeDirectAction;
}
type Host=Window&{VC_SCOUT_DIRECT_LANE_20576?:Readonly<ScoutDirectActionBridge>};
const installed=new WeakMap<Window,Readonly<ScoutDirectActionBridge>>();
export function installScoutDirectActionLane(win:Host):Readonly<ScoutDirectActionBridge>{
 const old=installed.get(win);if(old)return old;
 const api:Readonly<ScoutDirectActionBridge>=Object.freeze({
  VERSION:'20.5.76',nativeOnly:true,singleNativeWriter:true,
  dispatch:dispatchNativeDirectAction
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_DIRECT_LANE_20576)win.VC_SCOUT_DIRECT_LANE_20576=api;
 return api;
}
