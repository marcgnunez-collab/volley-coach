/* V20.6.0 · Immutable, native-only bridge for point and undo plans. */
import {nativeNextRotationNo,planNativePoint,planNativeUndo}
 from './scout-native-rally-plan';
export interface NativeRallyPlanBridge{
 readonly VERSION:'20.6.0';
 readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly nextRotation:typeof nativeNextRotationNo;
 readonly point:typeof planNativePoint;
 readonly undo:typeof planNativeUndo;
}
type Host=Window&{VC_NATIVE_RALLY_PLAN_2060?:Readonly<NativeRallyPlanBridge>};
const installed=new WeakMap<Window,Readonly<NativeRallyPlanBridge>>();
export function installNativeRallyPlan(win:Host):Readonly<NativeRallyPlanBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<NativeRallyPlanBridge>=Object.freeze({
  VERSION:'20.6.0',nativeOnly:true,singleNativeWriter:true,
  nextRotation:nativeNextRotationNo,point:planNativePoint,undo:planNativeUndo
 });
 installed.set(win,bridge);
 if(!win.VC_NATIVE_RALLY_PLAN_2060)win.VC_NATIVE_RALLY_PLAN_2060=bridge;
 return bridge;
}
