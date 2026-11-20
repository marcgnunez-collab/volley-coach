/* V20.5.52 · Read-only TypeScript bridge for V8.6.1 manual results. */
import {normalizeMatchManualResult} from './scout-match-manual-result';

export interface MatchManualResultBridge{
 readonly VERSION:'20.5.52';
 readonly pureOnly:true;
 readonly normalize:typeof normalizeMatchManualResult;
}
export type MatchManualResultWindow=Window&{
 VC_SCOUT_MANUAL_RESULT_20552?:Readonly<MatchManualResultBridge>;
};
const installed=new WeakMap<Window,Readonly<MatchManualResultBridge>>();
export function installMatchManualResultBridge(win:MatchManualResultWindow):Readonly<MatchManualResultBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<MatchManualResultBridge>=Object.freeze({
  VERSION:'20.5.52',pureOnly:true,normalize:normalizeMatchManualResult
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_MANUAL_RESULT_20552)win.VC_SCOUT_MANUAL_RESULT_20552=api;
 return api;
}
