/* V20.5.52 · Pure V8.6.1 manual set/final-result projection.
 * Activated only where the historical V8.6.1 wrapper was installed.
 */
export interface ManualSetOverlay{
 manualFinished:boolean;
 manualFinishedAt:string|null;
 manualScorePrevious:{us:number;opponent:number}|null;
}
export interface ManualFinalResult{
 active:boolean;
 us:number;
 opponent:number;
 savedAt:string|null;
 finalizedAt:string|null;
 clearedAt:string|null;
}
export interface MatchManualResultOverlay{
 sets:ManualSetOverlay[];
 manualFinalResult:ManualFinalResult|null;
}

const array=(value:unknown):any[]=>Array.isArray(value)?value:[];

export function normalizeMatchManualResult(input:unknown,normalized:unknown):MatchManualResultOverlay{
 const m=input as Record<string,any>|null|undefined;
 const x=normalized as Record<string,any>|null|undefined;
 const rawSets=array(m?.sets);
 const sets=array(x?.sets).map((s,i)=>{
  const raw=rawSets.find(r=>Number(r?.number)===Number(s.number))||rawSets[i]||{};
  return {
   manualFinished:!!raw?.manualFinished,
   manualFinishedAt:raw?.manualFinishedAt?String(raw.manualFinishedAt):null,
   manualScorePrevious:raw?.manualScorePrevious&&typeof raw.manualScorePrevious==='object'
    ?{us:Number(raw.manualScorePrevious.us)||0,opponent:Number(raw.manualScorePrevious.opponent)||0}
    :null
  };
 });
 const manualFinalResult=m?.manualFinalResult&&typeof m.manualFinalResult==='object'
  ?{
   active:!!m.manualFinalResult.active,
   us:Math.max(0,Number(m.manualFinalResult.us)||0),
   opponent:Math.max(0,Number(m.manualFinalResult.opponent)||0),
   savedAt:m.manualFinalResult.savedAt?String(m.manualFinalResult.savedAt):null,
   finalizedAt:m.manualFinalResult.finalizedAt?String(m.manualFinalResult.finalizedAt):null,
   clearedAt:m.manualFinalResult.clearedAt?String(m.manualFinalResult.clearedAt):null
  }
  :null;
 return {sets,manualFinalResult};
}
