/* V20.5.45 · Read-only field selectors with historical runtime parity. */
import {projectDataVolleyFields,readActionVideoTime,
 normalizeActionVideoTimestamp} from './scout-action-metadata';

export interface ScoutActionMetadataBridge{
 readonly VERSION:'20.5.45';
 readonly pureOnly:true;
 readonly dvFields:typeof projectDataVolleyFields;
 readonly actionTime:typeof readActionVideoTime;
 readonly normalizeTime:typeof normalizeActionVideoTimestamp;
}
export type ScoutActionMetadataWindow=Window&{
 VC_SCOUT_ACTION_METADATA_20545?:Readonly<ScoutActionMetadataBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutActionMetadataBridge>>();
export function installScoutActionMetadataBridge(win:ScoutActionMetadataWindow):Readonly<ScoutActionMetadataBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutActionMetadataBridge>=Object.freeze({
  VERSION:'20.5.45',pureOnly:true,
  dvFields:projectDataVolleyFields,
  actionTime:readActionVideoTime,normalizeTime:normalizeActionVideoTimestamp
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_ACTION_METADATA_20545)win.VC_SCOUT_ACTION_METADATA_20545=api;
 return api;
}
