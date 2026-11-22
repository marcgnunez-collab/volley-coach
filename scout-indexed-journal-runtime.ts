/* V20.5.60 · Opt-in transactional adapter. V9.3.1 owns the database and fallback. */
import {writeScoutJournalTransaction} from './scout-indexed-journal';
export interface ScoutIndexedJournalBridge{
 readonly VERSION:'20.5.60';
 readonly ownsDatabase:false;
 readonly usesExistingStores:true;
 readonly write:typeof writeScoutJournalTransaction;
}
type Host={VC_SCOUT_INDEXED_JOURNAL_20560?:Readonly<ScoutIndexedJournalBridge>};
const installed=new WeakMap<object,Readonly<ScoutIndexedJournalBridge>>();
export function installScoutIndexedJournalBridge(win:object):Readonly<ScoutIndexedJournalBridge>{
 const prior=installed.get(win);if(prior)return prior;
 const bridge:Readonly<ScoutIndexedJournalBridge>=Object.freeze({
  VERSION:'20.5.60',ownsDatabase:false,usesExistingStores:true,
  write:writeScoutJournalTransaction
 });
 installed.set(win,bridge);
 const host=win as Host;
 if(!host.VC_SCOUT_INDEXED_JOURNAL_20560)host.VC_SCOUT_INDEXED_JOURNAL_20560=bridge;
 return bridge;
}
