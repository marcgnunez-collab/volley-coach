/* V20.5.79 · Immutable native-only command bridge. */
import {executeNativeRallyCommand} from './scout-rally-command-lane';

export interface RallyCommandBridge{
 readonly VERSION:'20.5.79';
 readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly run:typeof executeNativeRallyCommand;
}
type Host=Window&{VC_RALLY_COMMAND_LANE_20579?:Readonly<RallyCommandBridge>};
const installed=new WeakMap<Window,Readonly<RallyCommandBridge>>();
export function installRallyCommandLane(win:Host):Readonly<RallyCommandBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<RallyCommandBridge>=Object.freeze({
  VERSION:'20.5.79',nativeOnly:true,singleNativeWriter:true,run:executeNativeRallyCommand
 });
 installed.set(win,bridge);
 if(!win.VC_RALLY_COMMAND_LANE_20579)win.VC_RALLY_COMMAND_LANE_20579=bridge;
 return bridge;
}
