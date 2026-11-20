/* V20.5.59 · Read-only, opt-in bridge; the native save remains the sole writer. */
import {captureLocalMatchSnapshot,verifyStoredLocalMatch}
 from './scout-local-readback';
export interface LocalReadbackBridge{
 readonly VERSION:'20.5.59';
 readonly readOnly:true;
 readonly capture:typeof captureLocalMatchSnapshot;
 readonly verify:typeof verifyStoredLocalMatch;
}
type Host={VC_LOCAL_READBACK_20559?:Readonly<LocalReadbackBridge>};
const installed=new WeakMap<object,Readonly<LocalReadbackBridge>>();
export function installLocalReadbackBridge(win:object):Readonly<LocalReadbackBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<LocalReadbackBridge>=Object.freeze({
  VERSION:'20.5.59',readOnly:true,capture:captureLocalMatchSnapshot,verify:verifyStoredLocalMatch
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_LOCAL_READBACK_20559)host.VC_LOCAL_READBACK_20559=bridge;
 return bridge;
}
