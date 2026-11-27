/* V20.6.1 · Single read-only context over existing MatchState/video readers. */
import {asList,asRecord} from '../domain/model';
import {canonicalReaders,readCanonicalMatch,type CanonicalMatchWindow}
 from './match-state-contract';
import {captureSharedMatchFrame,isSharedMatchFrameCurrent,selectSharedAnalysisMatch}
 from './shared-match-context';

export interface SharedMatchContextBridge{
 readonly VERSION:'20.6.1';
 readonly readOnly:true;
 readonly singleNativeSource:true;
 readonly getActive:()=>Record<string,unknown>|null;
 readonly getSet:(match:unknown)=>Record<string,unknown>|null;
 readonly capture:typeof captureSharedMatchFrame;
 readonly current:typeof isSharedMatchFrameCurrent;
 readonly selectAnalysisMatch:typeof selectSharedAnalysisMatch;
}
export type SharedMatchContextWindow=CanonicalMatchWindow&{
 VC_MATCH_CONTEXT_2061?:Readonly<SharedMatchContextBridge>;
};
const installed=new WeakMap<Window,Readonly<SharedMatchContextBridge>>();

export function installSharedMatchContext(win:SharedMatchContextWindow):Readonly<SharedMatchContextBridge>{
 const old=installed.get(win);if(old)return old;
 const getSet=(input:unknown)=>{
  const match=asRecord(input);
  if(!match)return null;
  const sets=asList(match.sets);
  for(const reader of canonicalReaders(win)){
   try{
    const set=asRecord(reader?.getSet?.(match));
    if(set&&sets.includes(set))return set;
   }catch(_){/* Keep the original numbered-set fallback. */}
  }
  return asRecord(sets.find(item=>asRecord(item)&&Number(asRecord(item)?.number)===Number(match.currentSet)));
 };
 const bridge:Readonly<SharedMatchContextBridge>=Object.freeze({
  VERSION:'20.6.1',readOnly:true,singleNativeSource:true,
  getActive:()=>readCanonicalMatch(win),getSet,
  capture:captureSharedMatchFrame,current:isSharedMatchFrameCurrent,
  selectAnalysisMatch:selectSharedAnalysisMatch
 });
 installed.set(win,bridge);
 if(!win.VC_MATCH_CONTEXT_2061)win.VC_MATCH_CONTEXT_2061=bridge;
 return bridge;
}

/** Safe read-through: a different reference never replaces the original match. */
export function readSharedMatch(win:SharedMatchContextWindow):Record<string,unknown>|null{
 const native=readCanonicalMatch(win);
 const bridge=win.VC_MATCH_CONTEXT_2061;
 if(bridge?.VERSION==='20.6.1'&&bridge.readOnly===true&&bridge.singleNativeSource===true){
  try{const candidate=bridge.getActive();if(candidate===native)return candidate}
  catch(_){/* Source owner unchanged. */}
 }
 return native;
}
