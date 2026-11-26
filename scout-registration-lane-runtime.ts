/* V20.5.75 · One typed call lane, with no second scorer or action writer. */
import {registerNativeScoutingAction} from './scout-registration-lane';

export interface ScoutRegistrationLaneBridge{
 readonly VERSION:'20.5.75';readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly register:typeof registerNativeScoutingAction;
}
type LaneHost=Window&{VC_SCOUT_REG_LANE_20575?:Readonly<ScoutRegistrationLaneBridge>};
const installed=new WeakMap<Window,Readonly<ScoutRegistrationLaneBridge>>();
export function installScoutRegistrationLane(win:LaneHost):Readonly<ScoutRegistrationLaneBridge>{
 const old=installed.get(win);if(old)return old;
 const api:Readonly<ScoutRegistrationLaneBridge>=Object.freeze({
  VERSION:'20.5.75',nativeOnly:true,singleNativeWriter:true,
  register:registerNativeScoutingAction
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_REG_LANE_20575)win.VC_SCOUT_REG_LANE_20575=api;
 return api;
}
