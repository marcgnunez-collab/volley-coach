/* V20.5.62 · An optional serializer; the classic code retains write ownership. */
import {serializeClubSnapshot,serializeClubIndependentLibrary} from './club-snapshot';

export interface ClubSnapshotBridge{
 readonly VERSION:'20.5.62';
 readonly usesExistingPayload:true;
 readonly serialize:typeof serializeClubSnapshot;
 readonly serializeLibrary:typeof serializeClubIndependentLibrary;
}
type Host={VC_CLUB_SNAPSHOT_20562?:Readonly<ClubSnapshotBridge>};
const installed=new WeakMap<object,Readonly<ClubSnapshotBridge>>();
export function installClubSnapshotBridge(win:object):Readonly<ClubSnapshotBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<ClubSnapshotBridge>=Object.freeze({
  VERSION:'20.5.62',usesExistingPayload:true,
  serialize:serializeClubSnapshot,serializeLibrary:serializeClubIndependentLibrary
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_CLUB_SNAPSHOT_20562)host.VC_CLUB_SNAPSHOT_20562=bridge;
 return bridge;
}
