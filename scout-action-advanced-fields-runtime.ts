/* V20.5.48 · Read-only bridge for the advanced scouting normalizer. */
import {normalizeAdvancedScoutingFields} from './scout-action-advanced-fields';

export interface ScoutAdvancedFieldsBridge{
 readonly VERSION:'20.5.48';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeAdvancedScoutingFields;
}
export type ScoutAdvancedFieldsWindow=Window&{
 VC_SCOUT_ADVANCED_FIELDS_20548?:Readonly<ScoutAdvancedFieldsBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutAdvancedFieldsBridge>>();
export function installScoutAdvancedFieldsBridge(win:ScoutAdvancedFieldsWindow):Readonly<ScoutAdvancedFieldsBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutAdvancedFieldsBridge>=Object.freeze({
  VERSION:'20.5.48',pureOnly:true,normalize:normalizeAdvancedScoutingFields
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_ADVANCED_FIELDS_20548)win.VC_SCOUT_ADVANCED_FIELDS_20548=api;
 return api;
}
