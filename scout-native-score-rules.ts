/* V20.5.81 · Pure native scoring rules shared by the LIVE point writer.
 * No writes, no rotation side effects, no DOM, no video, no storage. */
export type ScoreWinner='ours'|'opponent';
export interface HistoricalSetScore{
 readonly number?:unknown;
 readonly scoreUs?:unknown;
 readonly scoreOpponent?:unknown;
 readonly finished?:unknown;
 readonly winner?:unknown;
}
export interface HistoricalMatchSets{readonly sets?:readonly HistoricalSetScore[]|null}
export interface WonSets{readonly us:number;readonly opponent:number}

/** The deciding fifth set is played to 15, all earlier sets to 25. */
export function nativeSetTarget(setNo:unknown):15|25{
 return Number(setNo)===5?15:25;
}

/** The set ends on target AND at least two points of difference. */
export function nativeSetHasWinner(set:HistoricalSetScore):boolean{
 const target=nativeSetTarget(set.number);
 const us=Number(set.scoreUs),opponent=Number(set.scoreOpponent);
 return (us>=target||opponent>=target)&&Math.abs(us-opponent)>=2;
}

/** Only sets actually marked finished count; a missing winner counts for neither team. */
export function nativeCountWonSets(match:HistoricalMatchSets|null|undefined):Readonly<WonSets>{
 const done=Array.isArray(match?.sets)?match.sets.filter(set=>set?.finished):[];
 return Object.freeze({
  us:done.filter(set=>set.winner==='ours').length,
  opponent:done.filter(set=>set.winner==='opponent').length
 });
}

/** Preserve native P1..P6 order and direction; caller alone applies new values. */
export function nativeRotateValues<T>(values:readonly T[],direction:unknown=1):ReadonlyArray<T>{
 const rotated=Number(direction)>=0?
  values.slice(1).concat(values[0]):
  [values[5],...values.slice(0,5)];
 return Object.freeze(rotated);
}
