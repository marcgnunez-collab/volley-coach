/* V20.5.77 · Typed coordination, no duplicate rally/point writer. */
import {captureRallyEditorScope,isRallyEditorScopeCurrent,syncRallyEditorDraftCodes,
 changeRallyEditorDraft,prepareRallyCorrection} from './rally-editor-lane';

export interface RallyEditorLaneBridge{
 readonly VERSION:'20.5.77';readonly nativeOnly:true;readonly singleNativeWriter:true;
 readonly capture:typeof captureRallyEditorScope;
 readonly current:typeof isRallyEditorScopeCurrent;
 readonly syncCodes:typeof syncRallyEditorDraftCodes;
 readonly draft:typeof changeRallyEditorDraft;
 readonly prepare:typeof prepareRallyCorrection;
}
type Host=Window&{VC_RALLY_EDITOR_LANE_20577?:Readonly<RallyEditorLaneBridge>};
const installed=new WeakMap<Window,Readonly<RallyEditorLaneBridge>>();
export function installRallyEditorLane(win:Host):Readonly<RallyEditorLaneBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<RallyEditorLaneBridge>=Object.freeze({
  VERSION:'20.5.77',nativeOnly:true,singleNativeWriter:true,
  capture:captureRallyEditorScope,current:isRallyEditorScopeCurrent,
  syncCodes:syncRallyEditorDraftCodes,
  draft:changeRallyEditorDraft,prepare:prepareRallyCorrection
 });
 installed.set(win,bridge);
 if(!win.VC_RALLY_EDITOR_LANE_20577)win.VC_RALLY_EDITOR_LANE_20577=bridge;
 return bridge;
}
