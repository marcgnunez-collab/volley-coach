/* V20.5.43 · Read-only code-building decisions with native parity fallback. */
import {prepareScoutingCodeInput,finishScoutingCode} from './scout-code-builder';

export interface ScoutCodeBuilderBridge{
 readonly VERSION:'20.5.43';
 readonly pureOnly:true;
 readonly prepare:typeof prepareScoutingCodeInput;
 readonly finish:typeof finishScoutingCode;
}
export type ScoutCodeBuilderWindow=Window&{
 VC_SCOUT_CODE_BUILDER_20543?:Readonly<ScoutCodeBuilderBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutCodeBuilderBridge>>();
export function installScoutCodeBuilderBridge(win:ScoutCodeBuilderWindow):Readonly<ScoutCodeBuilderBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const api:Readonly<ScoutCodeBuilderBridge>=Object.freeze({
  VERSION:'20.5.43',pureOnly:true,
  prepare:prepareScoutingCodeInput,finish:finishScoutingCode
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_CODE_BUILDER_20543)win.VC_SCOUT_CODE_BUILDER_20543=api;
 return api;
}
