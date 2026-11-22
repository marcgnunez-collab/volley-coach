/* V20.5.61 · Opt-in writer adapter; V15.3.1 keeps payload and fallback ownership. */
import {writeClubLocalState} from './club-local-store';
export interface ClubLocalStoreBridge{
 readonly VERSION:'20.5.61';
 readonly usesExistingKey:true;
 readonly keepsNativeCodec:true;
 readonly write:typeof writeClubLocalState;
}
type Host={VC_CLUB_LOCAL_STORE_20561?:Readonly<ClubLocalStoreBridge>};
const installed=new WeakMap<object,Readonly<ClubLocalStoreBridge>>();
export function installClubLocalStoreBridge(win:object):Readonly<ClubLocalStoreBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<ClubLocalStoreBridge>=Object.freeze({
  VERSION:'20.5.61',usesExistingKey:true,keepsNativeCodec:true,write:writeClubLocalState
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_CLUB_LOCAL_STORE_20561)host.VC_CLUB_LOCAL_STORE_20561=bridge;
 return bridge;
}
