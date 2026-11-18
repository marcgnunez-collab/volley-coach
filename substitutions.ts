import {asRecord,type InspectionState} from './model';

const POSITIONS=new Set(['p1','p2','p3','p4','p5','p6']);
export interface SubstitutionContext{
 readonly position:unknown;
 readonly outgoingPlayer:unknown;
 readonly incomingPlayer:unknown;
 readonly lineup:unknown;
 readonly liberoActivePosition?:unknown;
 readonly matchStatus?:unknown;
}
export interface SubstitutionCheck{
 readonly state:'plausible'|'blocked'|'unknown';
 readonly reasons:readonly string[];
 readonly officialLegality:'not-evaluated';
}

function playerId(value:unknown):number|null{
 if(typeof value==='number'&&Number.isSafeInteger(value)&&value>0)return value;
 if(typeof value==='string'&&/^\d+$/.test(value)&&Number(value)>0)return Number(value);
 return null;
}
/** Local consistency only; NOT a FIVB substitution-limits or libero ruling. */
export function inspectSubstitution(context:SubstitutionContext):Readonly<SubstitutionCheck>{
 const reasons:string[]=[],position=String(context.position??''),out=playerId(context.outgoingPlayer),incoming=playerId(context.incomingPlayer);
 const lineup=asRecord(context.lineup);
 if(context.matchStatus==='finished')reasons.push('Partido finalizado.');
 if(!POSITIONS.has(position))reasons.push('Posición de pista no reconocida.');
 if(position===context.liberoActivePosition)reasons.push('El líbero ocupa esa posición.');
 if(out!==null&&incoming!==null&&out===incoming)reasons.push('El jugador entrante coincide con el saliente.');
 if(incoming!==null&&lineup)for(const [key,value] of Object.entries(lineup)){
  if(key!==position&&POSITIONS.has(key)&&playerId(value)===incoming){reasons.push('El jugador entrante ya ocupa otra posición.');break;}
 }
 const listed=POSITIONS.has(position)&&lineup?playerId(lineup[position]):null;
 if(out!==null&&listed!==null&&listed!==out)reasons.push('El dorsal saliente no coincide con la posición actual.');
 const state=reasons.length?'blocked':(out===null||incoming===null||!lineup||listed===null)?'unknown':'plausible';
 // This function never asserts compliance with competition substitution limits.
 return Object.freeze({state,reasons:Object.freeze(reasons),officialLegality:'not-evaluated'});
}
