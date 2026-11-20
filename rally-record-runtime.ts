/* V20.5.57 · Purely-shaped record bridge. Native writers retain all side effects. */
import {assembleClosedRally,assembleRestoredLiveRally,sameRallyRecord} from './rally-record';

export interface RallyRecordBridge{
 readonly VERSION:'20.5.57';
 readonly pureRecordOnly:true;
 readonly close:typeof assembleClosedRally;
 readonly restore:typeof assembleRestoredLiveRally;
 readonly equivalent:typeof sameRallyRecord;
}
type Host={VC_RALLY_RECORDS_20557?:Readonly<RallyRecordBridge>};
const installed=new WeakMap<object,Readonly<RallyRecordBridge>>();

export function installRallyRecordBridge(win:object):Readonly<RallyRecordBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<RallyRecordBridge>=Object.freeze({
  VERSION:'20.5.57',pureRecordOnly:true,
  close:assembleClosedRally,restore:assembleRestoredLiveRally,equivalent:sameRallyRecord
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_RALLY_RECORDS_20557)host.VC_RALLY_RECORDS_20557=bridge;
 return bridge;
}
