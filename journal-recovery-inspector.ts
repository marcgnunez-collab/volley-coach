/* V20.5.19 · Read-only bridge to the existing V20.1.1 IndexedDB journal.
 * Pending checkpoints are recovery COPIES, not proof of native match commit,
 * CAS delivery, or remote receipt. This module never writes or restores data.
 */
import {asList,asRecord} from './model';
import {captureRecoveryFrame,classifyRecoveryEvidence} from './rally-recovery-evidence';

export interface ExistingJournalReader{
 readonly inspect:(accountId:string)=>Promise<unknown>;
 readonly newest:(accountId:string)=>Promise<unknown>;
}
export type JournalRecoveryStatus='no-checkpoint'|'unavailable'|'ambiguous'|'missing-match'|
 'checkpoint-before'|'checkpoint-after'|'checkpoint-unchanged'|'checkpoint-divergent';
export interface JournalRecoveryReport{
 readonly version:'20.5.19';
 readonly source:'existing-v2011-pending-checkpoint';
 readonly status:JournalRecoveryStatus;
 readonly pendingCount:number|null;
 readonly requiresManualReview:true;
 readonly autoResumeAllowed:false;
}
export interface JournalRecoveryRequest{
 readonly journal:ExistingJournalReader;
 readonly accountId:string;
 readonly teamId:string;
 readonly matchId:string|number;
 readonly before:unknown;
 readonly after:unknown;
}
const LIMIT=26*1024*1024;
const report=(status:JournalRecoveryStatus,pendingCount:number|null):Readonly<JournalRecoveryReport>=>
 Object.freeze({version:'20.5.19',source:'existing-v2011-pending-checkpoint',
  status,pendingCount,requiresManualReview:true,autoResumeAllowed:false});

/** The journal's existing newest() method is the only persistence accessor.
 * Never interpret a pending draft/upload as a confirmed local state or cloud ACK.
 */
export async function inspectJournalRecovery(input:JournalRecoveryRequest):Promise<Readonly<JournalRecoveryReport>>{
 if(!input||!input.journal||typeof input.journal.inspect!=='function'||
  typeof input.journal.newest!=='function'||!input.accountId||!input.teamId||
  input.matchId===null||input.matchId===undefined||!String(input.matchId))
  return report('unavailable',null);
 const account=String(input.accountId).trim(),teamId=String(input.teamId);
 if(!account)return report('unavailable',null);
 let pendingCount:number|null=null;
 try{
  const info=asRecord(await input.journal.inspect(account));
  const count=info?.pendingCount;
  if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0)return report('unavailable',null);
  pendingCount=count;
  if(count===0)return report('no-checkpoint',0);
  // Multiple pending revisions or other accounts cannot establish an authoritative ordering.
  if(count!==1||info?.hasOtherAccounts===true||info?.lastError)return report('ambiguous',count);
  const entry=asRecord(await input.journal.newest(account));
  if(!entry||entry.accountId!==account||entry.status!=='pending'||
   (entry.mode!=='draft'&&entry.mode!=='upload')||
   typeof entry.stateJson!=='string'||entry.stateJson.length===0||entry.stateJson.length>LIMIT)
   return report('unavailable',count);
  const state=asRecord(JSON.parse(entry.stateJson));
  const equipos=asRecord(state?.equiposData),team=asRecord(equipos?.[teamId]);
  if(!team||!Array.isArray(team.scoutingMatches))return report('missing-match',count);
  const candidates=asList(team.scoutingMatches).map(asRecord).filter(match=>
   match&&String(match.id)===String(input.matchId));
  if(candidates.length!==1)return report(candidates.length?'ambiguous':'missing-match',count);
  const evidence=classifyRecoveryEvidence(captureRecoveryFrame(input.before),
   captureRecoveryFrame(input.after),captureRecoveryFrame(candidates[0]));
  const status:JournalRecoveryStatus=evidence==='durable-before'?'checkpoint-before':
   evidence==='durable-after'?'checkpoint-after':
   evidence==='unchanged-observed'?'checkpoint-unchanged':
   evidence==='divergent'?'checkpoint-divergent':'unavailable';
  return report(status,count);
 }catch(_){return report('unavailable',pendingCount);}
}
