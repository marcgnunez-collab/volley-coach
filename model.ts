/** V20.5.5: immutable match-domain contracts, separate from the legacy writer. */
export type Team='ours'|'opponent';
export type Skill='S'|'R'|'E'|'A'|'B'|'D'|'F'|'C';
export type Evaluation='#'|'+'|'!'|'-'|'/'|'=';
export type Rotation=1|2|3|4|5|6;
export type InspectionState='verified'|'inconsistent'|'unknown';

export interface Score {readonly us:number;readonly opponent:number;}
export interface ActionRecord{
 readonly skill?:unknown;
 readonly evaluation?:unknown;
 readonly code?:unknown;
}
export interface RallyRecord{
 readonly winner?:unknown;
 readonly servingBefore?:unknown;
 readonly rotationBefore?:unknown;
 readonly opponentRotationBefore?:unknown;
 readonly scoreBefore?:unknown;
 readonly scoreAfter?:unknown;
 readonly actions?:unknown;
}
export interface SetRecord{readonly rallies?:unknown;readonly number?:unknown;}
export interface MatchRecord{
 readonly status?:unknown;
 readonly sets?:unknown;
 readonly rotationNo?:unknown;
 readonly opponentRotationNo?:unknown;
 readonly servingTeam?:unknown;
}

export function asRecord(value:unknown):Record<string,unknown>|null{
 return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
}
export function asList(value:unknown):readonly unknown[]{return Array.isArray(value)?value:[];}
export function isTeam(value:unknown):value is Team{return value==='ours'||value==='opponent';}
export function isRotation(value:unknown):value is Rotation{
 return typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=6;
}
export function asScore(value:unknown):Score|null{
 const row=asRecord(value);
 return row&&typeof row.us==='number'&&Number.isInteger(row.us)&&row.us>=0&&
  typeof row.opponent==='number'&&Number.isInteger(row.opponent)&&row.opponent>=0?
  Object.freeze({us:row.us,opponent:row.opponent}):null;
}
