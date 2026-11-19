/* V20.5.9 · Read-only, selector-based projection of the canonical MatchState.
 * This is not a second match model, state writer, or persistence layer.
 */
import {asList,asRecord,isRotation,isTeam,type Rotation,type Team} from '../domain/model';

export type ObservableTopic='score'|'court'|'rally'|'status'|'change';
export interface ObservableMatchSnapshot{
 readonly score:Readonly<{set:number|null;us:number|null;opponent:number|null}>;
 readonly court:Readonly<{serving:Team|null;rotationUs:Rotation|null;rotationOpponent:Rotation|null}>;
 readonly rally:Readonly<{completed:number|null;liveActions:number|null}>;
 readonly status:Readonly<{matchAvailable:boolean;phase:'live'|'finished'|null}>;
}
export interface ObservableDiagnostics{
 readonly readOnly:true;
 readonly signals:number;
 readonly updates:number;
 readonly notifications:number;
 readonly subscribers:number;
}
export interface ObservableMatchStore{
 readonly version:'20.5.9';
 readonly readOnly:true;
 getSnapshot:()=>Readonly<ObservableMatchSnapshot>;
 subscribe:(topic:ObservableTopic,callback:(snapshot:Readonly<ObservableMatchSnapshot>)=>void)=>()=>void;
 refresh:()=>Readonly<ObservableMatchSnapshot>;
 diagnostics:()=>Readonly<ObservableDiagnostics>;
 dispose:()=>void;
}
interface MatchReader{
 getActive?:()=>unknown;
 getSet?:(match?:unknown)=>unknown;
 subscribe?:(callback:()=>void)=>(()=>void)|void;
}
export type ObservableWindow=Window&{
 MatchState?:MatchReader;
 VC_MATCH_STATE?:MatchReader;
 VC_SCOUT_VIDEO_BRIDGE?:MatchReader;
 VC_SCOUT_REPORT_BRIDGE?:MatchReader;
 VC_STATE_2059?:Readonly<ObservableMatchStore>;
};

const integer=(value:unknown):number|null=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:null;
const positive=(value:unknown):number|null=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0?value:null;
const same=(a:Readonly<Record<string,unknown>>,b:Readonly<Record<string,unknown>>)=>
 Object.keys(a).every(key=>Object.is(a[key],b[key]));

/** O(1) in rally history size; only short-lived references to the legacy match. */
export function projectObservableMatch(match:unknown,currentSet?:unknown):Readonly<ObservableMatchSnapshot>{
 const m=asRecord(match),setNumber=positive(m?.currentSet),sets=asList(m?.sets);
 const set=asRecord(currentSet)||asRecord(sets.find(item=>asRecord(item)?.number===setNumber));
 const phase=m?.status==='live'||m?.status==='finished'?m.status:null;
 return Object.freeze({
  score:Object.freeze({set:setNumber,us:integer(set?.scoreUs),opponent:integer(set?.scoreOpponent)}),
  court:Object.freeze({serving:isTeam(m?.servingTeam)?m.servingTeam:null,
   rotationUs:isRotation(m?.rotationNo)?m.rotationNo:null,
   rotationOpponent:isRotation(m?.opponentRotationNo)?m.opponentRotationNo:null}),
  rally:Object.freeze({completed:set?asList(set.rallies).length:null,
   liveActions:asRecord(m?.liveRally)?asList(asRecord(m?.liveRally)?.actions).length:null}),
  status:Object.freeze({matchAvailable:!!m,phase})
 });
}

export function createObservableMatchStore(win:ObservableWindow):Readonly<ObservableMatchStore>{
 const selectors:Exclude<ObservableTopic,'change'>[]=['score','court','rally','status'];
 const topics:ObservableTopic[]=[...selectors,'change'];
 const handlers=new Map(topics.map(topic=>[topic,new Set<(s:Readonly<ObservableMatchSnapshot>)=>void>()]));
 const readers=()=>[win.MatchState,win.VC_MATCH_STATE,win.VC_SCOUT_VIDEO_BRIDGE,win.VC_SCOUT_REPORT_BRIDGE];
 const sample=()=>{
  for(const reader of readers()){
   try{
    const active=reader?.getActive?.();
    if(!asRecord(active))continue;
    let set:unknown;
    try{set=reader?.getSet?.(active);}catch(_){/* Use the numbered set. */}
    return projectObservableMatch(active,set);
   }catch(_){/* The next pre-existing reader may still be available. */}
  }
  return projectObservableMatch(null);
 };
 let current=sample(),disposed=false,pending=false,signalled=false;
 let signals=0,updates=0,notifications=0;
 const publish=(forceChange=false)=>{
  if(disposed)return;
  const next=sample();
  const changed:ObservableTopic[]=selectors.filter(topic=>!same(current[topic] as unknown as Record<string,unknown>,next[topic] as unknown as Record<string,unknown>));
  if(changed.length){current=next;updates++;}
  if(forceChange||changed.length)changed.push('change');
  for(const topic of changed)for(const subscriber of handlers.get(topic)||[]){
   notifications++;
   try{subscriber(current);}catch(_){/* An observer must not interrupt live scouting. */}
  }
 };
 const signal=()=>{
  if(disposed)return;
  signals++;signalled=true;
  if(pending)return;
  pending=true;
  Promise.resolve().then(()=>{pending=false;const force=signalled;signalled=false;publish(force);});
 };
 const refresh=()=>{publish();return current;};
 const reader=win.MatchState||win.VC_MATCH_STATE;
 let unsubscribeNative=()=>{};
 try{const stop=reader?.subscribe?.(signal);if(typeof stop==='function')unsubscribeNative=stop;}
 catch(_){/* Keep document event as the fallback. */}
 win.document.addEventListener('vc:matchstatechange',signal);
 const api:Readonly<ObservableMatchStore>=Object.freeze({
  version:'20.5.9',readOnly:true,
  getSnapshot:()=>current,
  subscribe(topic:ObservableTopic,callback:(snapshot:Readonly<ObservableMatchSnapshot>)=>void){
   if(disposed||!handlers.has(topic)||typeof callback!=='function')return()=>{};
   const group=handlers.get(topic)!;group.add(callback);
   return()=>{group.delete(callback);};
  },
  refresh,
  diagnostics:()=>Object.freeze({readOnly:true as const,signals,updates,notifications,
   subscribers:[...handlers.values()].reduce((total,group)=>total+group.size,0)}),
  dispose(){
   if(disposed)return;
   disposed=true;unsubscribeNative();win.document.removeEventListener('vc:matchstatechange',signal);
   for(const group of handlers.values())group.clear();
  }
 });
 return api;
}
