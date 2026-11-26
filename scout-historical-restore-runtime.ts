/* V20.5.78 · No mutable state, DOM, storage or alternate recovery writer. */
import {captureHistoricalRestoreTicket,isHistoricalRestoreTicketCurrent}
 from './scout-historical-restore-gate';

export interface HistoricalRestoreBridge{
 readonly VERSION:'20.5.78';readonly nativeOnly:true;
 readonly singleNativeWriter:true;
 readonly capture:typeof captureHistoricalRestoreTicket;
 readonly current:typeof isHistoricalRestoreTicketCurrent;
}
type Host=Window&{VC_HISTORICAL_RESTORE_LANE_20578?:Readonly<HistoricalRestoreBridge>};
const installed=new WeakMap<Window,Readonly<HistoricalRestoreBridge>>();
export function installHistoricalRestoreLane(win:Host):Readonly<HistoricalRestoreBridge>{
 const previous=installed.get(win);if(previous)return previous;
 const bridge:Readonly<HistoricalRestoreBridge>=Object.freeze({
  VERSION:'20.5.78',nativeOnly:true,singleNativeWriter:true,
  capture:captureHistoricalRestoreTicket,current:isHistoricalRestoreTicketCurrent
 });
 installed.set(win,bridge);
 if(!win.VC_HISTORICAL_RESTORE_LANE_20578)win.VC_HISTORICAL_RESTORE_LANE_20578=bridge;
 return bridge;
}
