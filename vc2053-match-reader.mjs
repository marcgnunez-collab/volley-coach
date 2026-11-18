/* V20.5.3 · ES module adapter over the existing canonical match.
 * Read only: no second match store, no writer, no cloud or browser storage.
 */
import {projectMatch} from './vc2052-match-contract.mjs';

export const READER_VERSION='20.5.3';

export function getCanonicalMatch(win){
 for(const source of [win?.MatchState,win?.VC_MATCH_STATE,win?.VC_SCOUT_VIDEO_BRIDGE,win?.VC_SCOUT_REPORT_BRIDGE]){
  try{
   const match=source?.getActive?.();
   if(match&&typeof match==='object')return match;
  }catch(_){/* A failed adapter must not prevent the next source from being read. */}
 }
 return null;
}

export function readMatchProjection(win){
 // Return only frozen aggregate values; never expose the mutable match object.
 return projectMatch(getCanonicalMatch(win));
}

export function createMatchReader(win){
 if(!win)throw new TypeError('Es necesaria la ventana de Volley Coach.');
 const listeners=new Set();
 const doc=win.document;
 const state=win.MatchState||win.VC_MATCH_STATE;
 let disposed=false,pending=false,updates=0,projection=readMatchProjection(win);
 let signature=JSON.stringify(projection);

 const refresh=()=>{
  if(disposed)return projection;
  const next=readMatchProjection(win);
  const nextSignature=JSON.stringify(next);
  if(nextSignature!==signature){
   projection=next;signature=nextSignature;updates++;
   for(const listener of Array.from(listeners)){
    try{listener(projection)}catch(error){win.console?.warn?.('VC20.5.3 subscriber',error)}
   }
  }
  return projection;
 };
 const schedule=()=>{
  if(disposed||pending)return;
  pending=true;
  Promise.resolve().then(()=>{pending=false;refresh()});
 };
 const visibility=()=>{if(!doc?.hidden)schedule()};
 doc?.addEventListener?.('vc:matchstatechange',schedule);
 doc?.addEventListener?.('visibilitychange',visibility);
 win.addEventListener?.('focus',schedule);
 // MatchState.subscribe is the canonical event source. The DOM event is a
 // compatibility path for older callers; scheduling coalesces duplicate events.
 let unsubscribe=()=>{};
 try{
  if(typeof state?.subscribe==='function'){
   const stop=state.subscribe(schedule);
   if(typeof stop==='function')unsubscribe=stop;
  }
 }catch(_){/* DOM events remain usable. */}
 return Object.freeze({
  getSnapshot:()=>projection,
  refresh,
  subscribe(listener){
   if(disposed||typeof listener!=='function')return()=>{};
   listeners.add(listener);
   listener(projection);
   return()=>listeners.delete(listener);
  },
  diagnostics:()=>Object.freeze({version:READER_VERSION,disposed,subscribers:listeners.size,updates,source:'canonical-read-only'}),
  dispose(){
   if(disposed)return;
   disposed=true;listeners.clear();
   doc?.removeEventListener?.('vc:matchstatechange',schedule);
   doc?.removeEventListener?.('visibilitychange',visibility);
   win.removeEventListener?.('focus',schedule);
   try{unsubscribe()}catch(_){}
  }
 });
}
