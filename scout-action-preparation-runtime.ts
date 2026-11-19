/* V20.5.36 · Typed orchestration, never a second action writer. */
import {prepareNativeScoutingAction,inspectNativePreparation} from './scout-action-preparation';

export interface NativePreparationBridge{
 readonly VERSION:'20.5.36';readonly nativeOnly:true;
 readonly prepare:typeof prepareNativeScoutingAction;
 readonly inspect:typeof inspectNativePreparation;
}
export type NativePreparationWindow=Window&{VC_SCOUT_PREPARE_20536?:Readonly<NativePreparationBridge>};
const installed=new WeakMap<Window,Readonly<NativePreparationBridge>>();

export function installScoutingPreparationBridge(win:NativePreparationWindow):Readonly<NativePreparationBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<NativePreparationBridge>=Object.freeze({VERSION:'20.5.36',nativeOnly:true,
  prepare:prepareNativeScoutingAction,inspect:inspectNativePreparation});
 installed.set(win,api);
 if(!win.VC_SCOUT_PREPARE_20536)win.VC_SCOUT_PREPARE_20536=api;
 return api;
}
