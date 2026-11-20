/* V20.5.49 · Pure identity/video field bridge; native match loading remains. */
import {normalizeScoutingIdentityFields} from './scout-action-identity-fields';

export interface ScoutIdentityFieldsBridge{
 readonly VERSION:'20.5.49';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeScoutingIdentityFields;
}
export type ScoutIdentityFieldsWindow=Window&{
 VC_SCOUT_IDENTITY_FIELDS_20549?:Readonly<ScoutIdentityFieldsBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutIdentityFieldsBridge>>();
export function installScoutIdentityFieldsBridge(win:ScoutIdentityFieldsWindow):Readonly<ScoutIdentityFieldsBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutIdentityFieldsBridge>=Object.freeze({
  VERSION:'20.5.49',pureOnly:true,normalize:normalizeScoutingIdentityFields
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_IDENTITY_FIELDS_20549)win.VC_SCOUT_IDENTITY_FIELDS_20549=api;
 return api;
}
