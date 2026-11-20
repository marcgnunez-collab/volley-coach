/* V20.5.44 · Pure registration-zone preparation, no second action writer. */
import {prepareContactRegistration} from './scout-action-registration';

export interface ScoutRegistrationBridge{
 readonly VERSION:'20.5.44';
 readonly pureOnly:true;
 readonly prepareContact:typeof prepareContactRegistration;
}
export type ScoutRegistrationWindow=Window&{
 VC_SCOUT_REGISTRATION_20544?:Readonly<ScoutRegistrationBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutRegistrationBridge>>();
export function installScoutRegistrationBridge(win:ScoutRegistrationWindow):Readonly<ScoutRegistrationBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutRegistrationBridge>=Object.freeze({
  VERSION:'20.5.44',pureOnly:true,prepareContact:prepareContactRegistration
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_REGISTRATION_20544)win.VC_SCOUT_REGISTRATION_20544=api;
 return api;
}
