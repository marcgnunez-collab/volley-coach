/* V20.6.0 · Pure plans for the REAL V6.10.7 native rally scorer and V6.3 undo.
 * The host JS writer compares every field with its historical result before
 * applying a typed plan. No mutations, DOM, recording, journal or cloud here. */
export interface NativePointPlanInput{
 readonly winner:unknown;
 readonly scoreUs:unknown;
 readonly scoreOpponent:unknown;
 readonly servingBefore:unknown;
 readonly rotationNo:unknown;
 readonly opponentRotationNo:unknown;
}
export interface NativePointPlan{
 readonly scoreUs:unknown;
 readonly scoreOpponent:unknown;
 readonly winner:'ours'|'opponent';
 readonly servingTeam:'ours'|'opponent';
 readonly rotateOurs:boolean;
 readonly rotateOpponent:boolean;
 readonly rotationNo:unknown;
 readonly opponentRotationNo:unknown;
}
export interface NativeUndoPlan{
 readonly scoreUs:number;
 readonly scoreOpponent:number;
 readonly servingTeam:unknown;
 readonly rotationNo:unknown;
 readonly opponentRotationNo:unknown;
}
export interface NativeUndoPlanSource{
 readonly scoreBefore?:{readonly us?:unknown;readonly opponent?:unknown}|null;
 readonly servingBefore?:unknown;
 readonly rotationBefore?:unknown;
 readonly opponentRotationBefore?:unknown;
}

/** Regulatory rotation labels: R1 -> R6 -> R5 -> ... -> R2 -> R1. */
export function nativeNextRotationNo(value:unknown,direction:unknown=1):number{
 const rotation=Math.min(6,Math.max(1,Number(value)||1));
 return ((rotation-1+(Number(direction)>=0?-1:1)+6)%6)+1;
}

/** Only a proposed state delta. The LIVE scorer remains the one writer. */
export function planNativePoint(input:NativePointPlanInput):Readonly<NativePointPlan>{
 const ours=input.winner==='ours';
 const rotateOurs=ours&&input.servingBefore==='opponent';
 const rotateOpponent=!ours&&input.servingBefore==='ours';
 return Object.freeze({
  scoreUs:ours?Number(input.scoreUs)+1:input.scoreUs,
  scoreOpponent:ours?input.scoreOpponent:Number(input.scoreOpponent)+1,
  winner:input.winner==='opponent'?'opponent':'ours',
  servingTeam:ours?'ours':'opponent',rotateOurs,rotateOpponent,
  rotationNo:rotateOurs?nativeNextRotationNo(input.rotationNo,1):input.rotationNo,
  opponentRotationNo:rotateOpponent?nativeNextRotationNo(input.opponentRotationNo,1):input.opponentRotationNo
 });
}

/** Only a proposed numeric/rotation restoration; no rally is popped here. */
export function planNativeUndo(source:NativeUndoPlanSource):Readonly<NativeUndoPlan>{
 const before=source.scoreBefore;
 return Object.freeze({
  scoreUs:Number(before?.us)||0,
  scoreOpponent:Number(before?.opponent)||0,
  servingTeam:source.servingBefore,
  rotationNo:source.rotationBefore,
  opponentRotationNo:source.opponentRotationBefore||1
 });
}
