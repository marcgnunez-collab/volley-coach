/* V20.5.55 · One live command lane, keeping the historical scoring writer authoritative.
 * The bridge only constructs typed coordinators when the canonical adapter requests one.
 * No storage, DOM, scoring mutation, cloud write, or monkey-patched global commands here.
 */
import {createRallyTransactionPilot,type NativeRallyPort} from './rally-transaction-pilot';

export const RALLY_WRITER_VERSION='20.5.55' as const;
export type LiveRallyCoordinator=ReturnType<typeof createRallyTransactionPilot>;
export interface LiveRallyWriterBridge{
 readonly VERSION:typeof RALLY_WRITER_VERSION;
 readonly singleNativeWriter:true;
 readonly create:(port:NativeRallyPort)=>LiveRallyCoordinator;
}
type BridgeHost={VC_RALLY_WRITER_20555?:Readonly<LiveRallyWriterBridge>};
const installed=new WeakMap<object,Readonly<LiveRallyWriterBridge>>();

export function installLiveRallyWriterBridge(win:object):Readonly<LiveRallyWriterBridge>{
 const old=installed.get(win);if(old)return old;
 const bridge:Readonly<LiveRallyWriterBridge>=Object.freeze({
  VERSION:RALLY_WRITER_VERSION,singleNativeWriter:true,
  create(port:NativeRallyPort){
   if(!port||typeof port.readCurrent!=='function'||typeof port.awardPoint!=='function'||typeof port.undoRally!=='function')
    throw new TypeError('El coordinador requiere los escritores nativos originales.');
   // Observation first. Never retry or substitute the native writer; recovery blocking
   // remains separately opt-in until a durable, acknowledged recovery UI is available.
   return createRallyTransactionPilot(port,{installedInLiveUI:true});
  }
 });
 installed.set(win,bridge);
 const host=win as BridgeHost;
 if(!host.VC_RALLY_WRITER_20555)host.VC_RALLY_WRITER_20555=bridge;
 return bridge;
}
