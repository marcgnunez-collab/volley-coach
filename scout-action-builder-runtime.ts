/* V20.5.41 · Pure action building. No native writer or roster access. */
import {buildScoutingActionBase,ownScoutingPlayerFields,opponentScoutingPlayerFields}
 from './scout-action-builder';

export interface ScoutActionBuilderBridge{
 readonly VERSION:'20.5.41';
 readonly pureOnly:true;
 readonly buildBase:typeof buildScoutingActionBase;
 readonly ownFields:typeof ownScoutingPlayerFields;
 readonly opponentFields:typeof opponentScoutingPlayerFields;
}
export type ScoutActionBuilderWindow=Window&{
 VC_SCOUT_ACTION_BUILDER_20541?:Readonly<ScoutActionBuilderBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutActionBuilderBridge>>();
export function installScoutActionBuilderBridge(win:ScoutActionBuilderWindow):Readonly<ScoutActionBuilderBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<ScoutActionBuilderBridge>=Object.freeze({
  VERSION:'20.5.41',pureOnly:true,buildBase:buildScoutingActionBase,
  ownFields:ownScoutingPlayerFields,opponentFields:opponentScoutingPlayerFields
 });
 installed.set(win,bridge);
 if(!win.VC_SCOUT_ACTION_BUILDER_20541)win.VC_SCOUT_ACTION_BUILDER_20541=bridge;
 return bridge;
}
