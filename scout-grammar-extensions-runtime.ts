/* V20.5.38 · Pure grammar selectors. Writer and match remain native-owned. */
import {scanSubzoneExtension,scanConeExtension,scanAdvancedExtension}
 from './scout-grammar-extensions';

export interface ScoutingExtensionsBridge{
 readonly VERSION:'20.5.38';
 readonly grammarOnly:true;
 readonly subzone:typeof scanSubzoneExtension;
 readonly advanced:typeof scanAdvancedExtension;
 readonly cone:typeof scanConeExtension;
}
export type ScoutingExtensionsWindow=Window&{
 VC_SCOUT_EXTENSIONS_20538?:Readonly<ScoutingExtensionsBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutingExtensionsBridge>>();
export function installScoutingExtensionsBridge(win:ScoutingExtensionsWindow):Readonly<ScoutingExtensionsBridge>{
 const existing=installed.get(win);if(existing)return existing;
 const bridge:Readonly<ScoutingExtensionsBridge>=Object.freeze({
  VERSION:'20.5.38',grammarOnly:true,
  subzone:scanSubzoneExtension,advanced:scanAdvancedExtension,cone:scanConeExtension
 });
 installed.set(win,bridge);
 if(!win.VC_SCOUT_EXTENSIONS_20538)win.VC_SCOUT_EXTENSIONS_20538=bridge;
 return bridge;
}
