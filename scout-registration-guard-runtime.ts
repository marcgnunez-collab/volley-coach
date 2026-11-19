/* V20.5.35 · The only browser contract is a pure guard function.
 * Registration, parser invocation, storage and scoring remain native.
 */
import {inspectRegistrationConditions} from './scout-registration-guard';

export interface RegistrationGuardBridge{
 readonly VERSION:'20.5.35';readonly preconditionsOnly:true;
 readonly inspect:typeof inspectRegistrationConditions;
}
export type RegistrationGuardWindow=Window&{VC_SCOUT_REG_GUARD_20535?:Readonly<RegistrationGuardBridge>};
const installed=new WeakMap<Window,Readonly<RegistrationGuardBridge>>();

export function installRegistrationGuardBridge(win:RegistrationGuardWindow):Readonly<RegistrationGuardBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<RegistrationGuardBridge>=Object.freeze({VERSION:'20.5.35',
  preconditionsOnly:true,inspect:inspectRegistrationConditions});
 installed.set(win,api);
 if(!win.VC_SCOUT_REG_GUARD_20535)win.VC_SCOUT_REG_GUARD_20535=api;
 return api;
}
