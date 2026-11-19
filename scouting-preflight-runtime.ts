/* V20.5.34 · Pure, single-parser-call preflight classification API. */
import {classifyScoutingPreflight} from './scouting-preflight';

export interface PreflightBridge{
 readonly VERSION:'20.5.34';readonly previewOnly:true;
 readonly classify:typeof classifyScoutingPreflight;
}
export type PreflightWindow=Window&{VC_SCOUT_PREFLIGHT_20534?:Readonly<PreflightBridge>};
const installed=new WeakMap<Window,Readonly<PreflightBridge>>();

export function installScoutingPreflightBridge(win:PreflightWindow):Readonly<PreflightBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<PreflightBridge>=Object.freeze({VERSION:'20.5.34',previewOnly:true,
  classify:classifyScoutingPreflight});
 installed.set(win,api);
 if(!win.VC_SCOUT_PREFLIGHT_20534)win.VC_SCOUT_PREFLIGHT_20534=api;
 return api;
}
