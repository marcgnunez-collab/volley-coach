/* V20.5.41 · Pure construction of a scouting action draft.
 * It does NOT parse a code, look up players, normalize actions or write points.
 * The input snapshots are already read by the original native parser.
 */
export interface ScoutingBaseParts{
 readonly rival:boolean;
 readonly skill:string;
 readonly evaluation:string;
 readonly zones:Readonly<Record<string,unknown>>;
 readonly serve:string;
 readonly phase:string;
 readonly combo:string;
 readonly blockers:string;
}
export interface ScoutingOwnFields{
 readonly playerId:unknown;
 readonly playerLabel:'';
 readonly playerNameSnapshot:unknown;
 readonly playerNumberSnapshot:unknown;
}
export interface ScoutingOpponentFields{
 readonly playerId:null;
 readonly playerLabel:unknown;
 readonly playerNumberSnapshot:string;
 readonly playerNameSnapshot:unknown;
}
/** Creates the same new, shallow action draft as the historical parser. */
export function buildScoutingActionBase(oldAction:unknown,parts:ScoutingBaseParts):Record<string,unknown>{
 return {...((oldAction||{}) as Record<string,unknown>),
  team:parts.rival?'opponent':'ours',skill:parts.skill,evaluation:parts.evaluation,
  ...parts.zones,serveType:parts.serve,phase:parts.phase,
  setTarget:parts.skill==='E'?parts.combo:'',
  attackCombo:parts.skill==='A'?parts.combo:'',
  blockers:parts.skill==='A'?parts.blockers:'',validationWarnings:[]};
}
export function ownScoutingPlayerFields(
 player:unknown,currentName:unknown,number:string):ScoutingOwnFields{
 const p=player as {id?:unknown;name?:unknown;number?:unknown};
 return {playerId:p.id,playerLabel:'',
  playerNameSnapshot:p.name||currentName||'',playerNumberSnapshot:p.number??number};
}
export function opponentScoutingPlayerFields(
 playerLabel:unknown,currentName:unknown,number:string):ScoutingOpponentFields{
 return {playerId:null,playerLabel,playerNumberSnapshot:number,
  playerNameSnapshot:currentName||String(playerLabel||'').replace(/^#?\d+\s*[·-]?\s*/,'')};
}
