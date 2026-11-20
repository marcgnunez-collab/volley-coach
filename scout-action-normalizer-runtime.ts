/* V20.5.46 · Pure normalization bridge, native writers and clocks preserved. */
import {normalizeScoutingActionBase} from './scout-action-normalizer';

export interface ScoutActionNormalizerBridge{
 readonly VERSION:'20.5.46';
 readonly pureOnly:true;
 readonly normalizeBase:typeof normalizeScoutingActionBase;
}
export type ScoutActionNormalizerWindow=Window&{
 VC_SCOUT_ACTION_NORMALIZER_20546?:Readonly<ScoutActionNormalizerBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutActionNormalizerBridge>>();
export function installScoutActionNormalizerBridge(win:ScoutActionNormalizerWindow):Readonly<ScoutActionNormalizerBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutActionNormalizerBridge>=Object.freeze({
  VERSION:'20.5.46',pureOnly:true,normalizeBase:normalizeScoutingActionBase
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_ACTION_NORMALIZER_20546)win.VC_SCOUT_ACTION_NORMALIZER_20546=api;
 return api;
}
