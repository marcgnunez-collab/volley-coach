/* V20.5.48 · Pure V8.7/V8.8 advanced action fields.
 * Preserves historical ordering, conversions and coordinate cloning without
 * reading match state, changing a rally or writing persistent data.
 */
type RecordLike=Record<string,any>;
const TEMPOS:Record<string,string>={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
const SET_TYPES:Record<string,string>={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};
const SUBTYPES:Record<string,Record<string,string>>={
 A:{HSP:'Hard spike',SSP:'Soft spike/topspin',TIP:'Tip'},
 E:{'1H':'1 hand set','2H':'2 hands set',BUMP:'Bump set',UND:'Underhand set',OTH:'Other set'},
 R:{L:'On left',R:'On right',LOW:'Low',OH:'Overhand',MID:'Middle line'},
 B:{AST:'Block assist',ATT:'Block attempt',SOFT:'Block on soft spike'},
 D:{COV:'Spike cover',AB:'After block',EMG:'Emergency',TIP:'Tip',SOFT:'Soft spike'}
};
const LEGACY_TEMPOS:Record<string,string>={RAP:'T',MED:'M',ALT:'H'};
const cleanToken=(v:unknown,max=10)=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,max);
const cloneCoordinate=(c:any)=>c&&Number.isFinite(Number(c.x))&&Number.isFinite(Number(c.y))?
 {x:Number(c.x),y:Number(c.y)}:null;

export function normalizeAdvancedScoutingFields(input:unknown,normalized:unknown){
 const a=input as RecordLike|null|undefined,x=normalized as RecordLike;
 // V8.7 · The original base attackTempo is considered before any new fields.
 const rawTempo=cleanToken(a?.attackTempo||a?.setTempo||x.attackTempo||'',3);
 const tempo=TEMPOS[rawTempo]?rawTempo:(LEGACY_TEMPOS[rawTempo]||'');
 const attackTempo=x.skill==='A'?tempo:'';
 const setTempo=x.skill==='E'?tempo:'';
 const attackCode=x.skill==='A'?cleanToken(a?.attackCode||'',6):'';
 const setterCall=x.skill==='E'?cleanToken(a?.setterCall||'',6):'';
 const dvSetType=(x.skill==='A'||x.skill==='E')&&SET_TYPES[String(a?.dvSetType||'').toUpperCase()]?
  String(a?.dvSetType).toUpperCase():'';
 const subtype=cleanToken(a?.skillSubtype||'',8);
 const skillSubtype=SUBTYPES[x.skill]?.[subtype]?subtype:'';
 const specialCode=cleanToken(a?.specialCode||'',10);
 const customCode=cleanToken(a?.customCode||'',5);
 // V8.8 · The preceding native contact normalization remains the source.
 const locationMode=a?.locationMode==='cones'?'cones':'zones';
 const endCone=a?.endCone!=null&&/^[1-8]$/.test(String(a.endCone))?Number(a.endCone):null;
 const startCoordinate=cloneCoordinate(a?.startCoordinate);
 const endCoordinate=cloneCoordinate(a?.endCoordinate);
 const contactCoordinate=cloneCoordinate(a?.contactCoordinate);
 const contactZone=String(a?.contactZone||x.contactZone||'');
 const dvStartZone=String(a?.dvStartZone||'');
 const dvEndZone=String(a?.dvEndZone||'');
 const dvEndSubzone=String(a?.dvEndSubzone||'');
 const dvEndCone=a?.dvEndCone!=null&&Number.isFinite(Number(a.dvEndCone))?Number(a.dvEndCone):null;
 const dvSourceActionId=a?.dvSourceActionId!=null?Number(a.dvSourceActionId):null;
 const dvPointPhase=String(a?.dvPointPhase||'');
 const dvPhase=String(a?.dvPhase||'');
 const dvAttackPhase=String(a?.dvAttackPhase||'');
 return {attackTempo,setTempo,attackCode,setterCall,dvSetType,skillSubtype,specialCode,customCode,
  locationMode,endCone,startCoordinate,endCoordinate,contactCoordinate,contactZone,
  dvStartZone,dvEndZone,dvEndSubzone,dvEndCone,dvSourceActionId,dvPointPhase,dvPhase,dvAttackPhase};
}
