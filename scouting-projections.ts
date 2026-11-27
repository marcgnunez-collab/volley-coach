/* V20.5.22 · One read-only query gateway for Scouting LIVE and player analysis.
 * All canonical writes and notifications remain owned by the historic MatchState.
 * Cache entries are bounded derived reports, never raw match references.
 */
import {inspectLiveSetStatistics,type LiveSetStatistics} from './live-statistics';
import {inspectPlayerBoxscore,type BoxscoreFilters,type PlayerBoxscore} from './player-boxscore';
import {readSharedMatch} from './shared-match-context-runtime';
import type {ObservableMatchStore,ObservableWindow,ObservableMatchSnapshot,ObservableTopic} from './match-observable';
import {isRotation,type Team} from '../domain/model';

const MAX_FILTERED_REPORTS=8;
export interface ScoutingProjectionDiagnostics{
 readonly readOnly:true;
 readonly generation:number;
 readonly calculations:number;
 readonly cacheHits:number;
 readonly invalidations:number;
 readonly playerCacheEntries:number;
 readonly hasLiveCache:boolean;
}
export interface ScoutingProjectionStore{
 readonly version:'20.5.22';
 readonly readOnly:true;
 getSnapshot:()=>Readonly<ObservableMatchSnapshot>;
 subscribe:(topic:ObservableTopic,callback:(snapshot:Readonly<ObservableMatchSnapshot>)=>void)=>()=>void;
 getLiveStatistics:()=>Readonly<LiveSetStatistics>;
 getPlayerBoxscore:(filters:BoxscoreFilters)=>Readonly<PlayerBoxscore>;
 invalidate:()=>void;
 diagnostics:()=>Readonly<ScoutingProjectionDiagnostics>;
 dispose:()=>void;
}
export type ScoutingProjectionWindow=ObservableWindow&{
 VC_SCOUT_PROJECTIONS_20522?:Readonly<ScoutingProjectionStore>;
};

/** A single hub subscriber invalidates all computed read-only selector caches. */
export function createScoutingProjectionStore(win:ScoutingProjectionWindow,
 observable:Readonly<ObservableMatchStore>):Readonly<ScoutingProjectionStore>{
 let live:Readonly<LiveSetStatistics>|null=null;
 const players=new Map<string,Readonly<PlayerBoxscore>>();
 const externalStops=new Set<()=>void>();
 let generation=0,calculations=0,cacheHits=0,invalidations=0,disposed=false;
 const invalidate=()=>{
  if(disposed)return;
  generation++;invalidations++;live=null;players.clear();
 };
 const unsubscribe=observable.subscribe('change',invalidate);
 const store:Readonly<ScoutingProjectionStore>=Object.freeze({
  version:'20.5.22',readOnly:true,
  getSnapshot:()=>observable.getSnapshot(),
  subscribe:(topic:ObservableTopic,callback:(snapshot:Readonly<ObservableMatchSnapshot>)=>void)=>{
   if(disposed)return()=>{};
   const stop=observable.subscribe(topic,callback);
   externalStops.add(stop);
   return()=>{stop();externalStops.delete(stop);};
  },
  getLiveStatistics(){
   if(disposed)throw Error('La vista de scouting está cerrada.');
   if(live){cacheHits++;return live;}
   live=inspectLiveSetStatistics(readSharedMatch(win));calculations++;return live;
  },
  getPlayerBoxscore(filters:BoxscoreFilters){
   if(disposed)throw Error('La vista de scouting está cerrada.');
   const team:Team=filters.team==='opponent'?'opponent':'ours';
   const scope=filters.scope==='match'?'match':'current';
   const rotation=isRotation(filters.rotation)?filters.rotation:null;
   const key=`${team}:${scope}:${rotation??0}`;
   const existing=players.get(key);
   if(existing){cacheHits++;return existing;}
   const report=inspectPlayerBoxscore(readSharedMatch(win),{team,scope,rotation});
   calculations++;
   if(players.size>=MAX_FILTERED_REPORTS){
    const oldest=players.keys().next().value;
    if(oldest!==undefined)players.delete(oldest);
   }
   players.set(key,report);return report;
  },
  invalidate,
  diagnostics:()=>Object.freeze({readOnly:true as const,generation,calculations,cacheHits,
   invalidations,playerCacheEntries:players.size,hasLiveCache:live!==null}),
  dispose(){
   if(disposed)return;disposed=true;unsubscribe();
   for(const stop of externalStops)stop();externalStops.clear();
   live=null;players.clear();
   if(win.VC_SCOUT_PROJECTIONS_20522===store)delete win.VC_SCOUT_PROJECTIONS_20522;
  }
 });
 return store;
}

/** Install after the V20.5.9 observable hub; never creates a second native subscription. */
export function mountScoutingProjectionStore(win:ScoutingProjectionWindow):Readonly<ScoutingProjectionStore>|null{
 if(win.VC_SCOUT_PROJECTIONS_20522)return win.VC_SCOUT_PROJECTIONS_20522;
 const hub=win.VC_STATE_2059;if(!hub)return null;
 const store=createScoutingProjectionStore(win,hub);
 win.VC_SCOUT_PROJECTIONS_20522=store;
 return store;
}
