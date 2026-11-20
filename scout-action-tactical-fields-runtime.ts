/* V20.5.47 · Read-only direction, reception and blocking normalization. */
import {normalizeTacticalActionFields} from './scout-action-tactical-fields';

export interface ScoutTacticalFieldsBridge{
 readonly VERSION:'20.5.47';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeTacticalActionFields;
}
export type ScoutTacticalFieldsWindow=Window&{
 VC_SCOUT_TACTICAL_FIELDS_20547?:Readonly<ScoutTacticalFieldsBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutTacticalFieldsBridge>>();
export function installScoutTacticalFieldsBridge(win:ScoutTacticalFieldsWindow):Readonly<ScoutTacticalFieldsBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutTacticalFieldsBridge>=Object.freeze({
  VERSION:'20.5.47',pureOnly:true,normalize:normalizeTacticalActionFields
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_TACTICAL_FIELDS_20547)win.VC_SCOUT_TACTICAL_FIELDS_20547=api;
 return api;
}
