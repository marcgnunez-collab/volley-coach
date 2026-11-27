/* V20.5.81 · Immutable rule bridge; the JS native scorer stays the only writer. */
import {nativeSetTarget,nativeSetHasWinner,nativeCountWonSets,nativeRotateValues}
 from './scout-native-score-rules';

export interface NativeScoreRulesBridge{
 readonly VERSION:'20.5.81';
 readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly target:typeof nativeSetTarget;
 readonly hasWinner:typeof nativeSetHasWinner;
 readonly countWonSets:typeof nativeCountWonSets;
 readonly rotateValues:typeof nativeRotateValues;
}
type Host=Window&{VC_NATIVE_SCORE_RULES_20581?:Readonly<NativeScoreRulesBridge>};
const installed=new WeakMap<Window,Readonly<NativeScoreRulesBridge>>();
export function installNativeScoreRules(win:Host):Readonly<NativeScoreRulesBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<NativeScoreRulesBridge>=Object.freeze({
  VERSION:'20.5.81',nativeOnly:true,singleNativeWriter:true,
  target:nativeSetTarget,hasWinner:nativeSetHasWinner,
  countWonSets:nativeCountWonSets,rotateValues:nativeRotateValues
 });
 installed.set(win,bridge);
 if(!win.VC_NATIVE_SCORE_RULES_20581)win.VC_NATIVE_SCORE_RULES_20581=bridge;
 return bridge;
}
