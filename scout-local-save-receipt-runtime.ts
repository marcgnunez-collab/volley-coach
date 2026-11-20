/* V20.5.58 · Read-only compatibility bridge for the legacy save caller. */
import {classifyLocalSaveReceipt,type LocalSaveObservation,type LocalSaveReceipt}
 from './scout-local-save-receipt';

export interface LocalSaveReceiptBridge{
 readonly VERSION:'20.5.58';
 readonly readOnly:true;
 readonly classify:(input:LocalSaveObservation)=>Readonly<LocalSaveReceipt>;
}
type Host={VC_LOCAL_SAVE_20558?:Readonly<LocalSaveReceiptBridge>};
const installed=new WeakMap<object,Readonly<LocalSaveReceiptBridge>>();

export function installLocalSaveReceiptBridge(win:object):Readonly<LocalSaveReceiptBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<LocalSaveReceiptBridge>=Object.freeze({
  VERSION:'20.5.58',readOnly:true,classify:classifyLocalSaveReceipt
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_LOCAL_SAVE_20558)host.VC_LOCAL_SAVE_20558=bridge;
 return bridge;
}
