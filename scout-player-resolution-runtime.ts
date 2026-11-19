/* V20.5.40 · Roster resolution selection, no writes or globals read. */
import {resolveOwnScoutingPlayer} from './scout-player-resolution';
export interface ScoutPlayerResolverBridge{
 readonly VERSION:'20.5.40';
 readonly pureOnly:true;
 readonly resolveOwn:typeof resolveOwnScoutingPlayer;
}
export type ScoutPlayerResolverWindow=Window&{
 VC_SCOUT_PLAYER_RESOLVER_20540?:Readonly<ScoutPlayerResolverBridge>;
};
const installed=new WeakMap<Window,Readonly<ScoutPlayerResolverBridge>>();
export function installScoutPlayerResolverBridge(win:ScoutPlayerResolverWindow):Readonly<ScoutPlayerResolverBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const api:Readonly<ScoutPlayerResolverBridge>=Object.freeze({
  VERSION:'20.5.40',pureOnly:true,resolveOwn:resolveOwnScoutingPlayer
 });
 installed.set(win,api);
 if(!win.VC_SCOUT_PLAYER_RESOLVER_20540)win.VC_SCOUT_PLAYER_RESOLVER_20540=api;
 return api;
}
