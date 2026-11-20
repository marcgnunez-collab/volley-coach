/* V20.5.46 · Core action normalization without a new writer or clock.
 * The existing native engine supplies the one generated id/createdAt so a
 * comparison never requests a second generated ID or clock timestamp.
 */
type ActionRecord=Record<string,any>;
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',
 D:'Defensa',F:'Freeball',C:'Cobertura'};
const RATINGS=['#','+','!','-','/','='];
const SERVES=['F','JF','JP','U'];
const PHASES=['K1','K2','FB','TR'];
const COMBOS=['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'];

/** Exact base V6.8 field projection; historical extensions run afterwards. */
export function normalizeScoutingActionBase(
 input:unknown,generatedId:number,generatedAt:string):Record<string,unknown>{
 const a=(input||{}) as ActionRecord;
 return {
  ...(input&&typeof input==='object'&&!Array.isArray(input)?input:{}),
  id:generatedId,
  seq:Number(a?.seq)||1,
  team:a?.team==='opponent'?'opponent':'ours',
  playerId:a?.playerId!=null&&a?.playerId!==''?Number(a.playerId):null,
  playerLabel:String(a?.playerLabel||''),
  playerNameSnapshot:String(a?.playerNameSnapshot||''),
  playerNumberSnapshot:a?.playerNumberSnapshot??'',
  skill:(SKILLS as Record<string,string>)[a?.skill]?a.skill:'S',
  evaluation:RATINGS.includes(a?.evaluation)?a.evaluation:'!',
  startZone:String(a?.startZone||''),endZone:String(a?.endZone||''),
  serveType:SERVES.includes(a?.serveType)?a.serveType:'',
  phase:PHASES.includes(a?.phase)?a.phase:'',
  setTarget:COMBOS.includes(a?.setTarget)?a.setTarget:'',
  attackCombo:COMBOS.includes(a?.attackCombo)?a.attackCombo:'',
  attackTempo:['RAP','MED','ALT'].includes(a?.attackTempo)?a.attackTempo:'',
  blockers:['0','1','2','3'].includes(String(a?.blockers))?String(a.blockers):'',
  code:String(a?.code||''),
  validationWarnings:(Array.isArray(a?.validationWarnings)?a.validationWarnings:[]).map(String).slice(0,8),
  createdAt:generatedAt,
  scoutMs:Math.max(0,Number(a?.scoutMs)||0),
  videoTime:a?.videoTime==null?null:Number(a.videoTime),
  videoSource:String(a?.videoSource||'')
 };
}
