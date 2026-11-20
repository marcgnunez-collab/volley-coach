/* V20.5.54 · Read-only bridge for V6.10.2 finalization normalizer. */
import {normalizeMatchFinalizationFields} from './scout-match-finalization-fields';

export interface ScoutMatchFinalizationBridge{
 readonly VERSION:'20.5.54';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeMatchFinalizationFields;
}
export type ScoutMatchFinalizationWindow=Window&{
 VC_SCOUT_MATCH_FINALIZATION_20554?:Readonly<ScoutMatchFinalizationBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutMatchFinalizationBridge>>();
export function installMatchFinalizationBridge(win:ScoutMatchFinalizationWindow):Readonly<ScoutMatchFinalizationBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutMatchFinalizationBridge>=Object.freeze({
  VERSION:'20.5.54',pureOnly:true,normalize:normalizeMatchFinalizationFields
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_MATCH_FINALIZATION_20554)win.VC_SCOUT_MATCH_FINALIZATION_20554=api;
 return api;
}
