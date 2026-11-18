import {asScore,isRotation,isTeam,type Rotation,type Score,type Team} from './model';

/** Identical valid-range rotation order to scoutV6107NextRotation. */
export function nextRotation(value:unknown,direction:1|-1=1):Rotation|null{
 if(!isRotation(value))return null;
 return (((value-1+(direction===1?-1:1)+6)%6)+1) as Rotation;
}

export interface PointContext{
 readonly score:unknown;
 readonly serving:unknown;
 readonly rotationUs:unknown;
 readonly rotationOpponent:unknown;
}
export interface PointProjection{
 readonly state:'projected'|'unknown';
 readonly score:Score|null;
 readonly serving:Team|null;
 readonly rotationUs:Rotation|null;
 readonly rotationOpponent:Rotation|null;
 readonly sideOut:boolean|null;
}
/** Hypothetical projection ONLY; never used to commit a point or rotate players. */
export function projectPoint(context:PointContext,winner:unknown):Readonly<PointProjection>{
 const score=asScore(context.score);
 const serving=isTeam(context.serving)?context.serving:null;
 const us=isRotation(context.rotationUs)?context.rotationUs:null;
 const opponent=isRotation(context.rotationOpponent)?context.rotationOpponent:null;
 if(!score||!serving||!us||!opponent||!isTeam(winner))
  return Object.freeze({state:'unknown',score,serving,rotationUs:us,rotationOpponent:opponent,sideOut:null});
 const sideOut=winner!==serving;
 return Object.freeze({
  state:'projected',
  score:Object.freeze({us:score.us+(winner==='ours'?1:0),opponent:score.opponent+(winner==='opponent'?1:0)}),
  serving:winner,
  rotationUs:sideOut&&winner==='ours'?nextRotation(us)!:us,
  rotationOpponent:sideOut&&winner==='opponent'?nextRotation(opponent)!:opponent,
  sideOut
 });
}
