/* V20.5.42 · Read-only code/contact decisions, writers remain native. */
import {normalizeContactMetadata,buildScoutCodeV830} from './scout-code-format';

export interface ScoutCodeFormatBridge{
 readonly VERSION:'20.5.42';
 readonly pureOnly:true;
 readonly contact:typeof normalizeContactMetadata;
 readonly buildCode:typeof buildScoutCodeV830;
}
export type ScoutCodeFormatWindow=Window&{VC_SCOUT_CODE_FORMAT_20542?:Readonly<ScoutCodeFormatBridge>};
const installed=new WeakMap<Window,Readonly<ScoutCodeFormatBridge>>();
export function installScoutCodeFormatBridge(win:ScoutCodeFormatWindow):Readonly<ScoutCodeFormatBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutCodeFormatBridge>=Object.freeze({
  VERSION:'20.5.42',pureOnly:true,contact:normalizeContactMetadata,buildCode:buildScoutCodeV830
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_CODE_FORMAT_20542)win.VC_SCOUT_CODE_FORMAT_20542=api;
 return api;
}
