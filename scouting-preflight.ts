/* V20.5.34 · Stateless classification of one EXISTING native scouting preview.
 * The classic controller obtains the native parser result exactly once.
 * This module never calls a parser, registers a code, or changes match state.
 */
export interface PreflightAction{
 readonly team?:unknown;readonly skill?:unknown;readonly evaluation?:unknown;
 readonly playerNumberSnapshot?:unknown;readonly playerId?:unknown;
 readonly playerLabel?:unknown;readonly startZone?:unknown;readonly endZone?:unknown;
 readonly tempo?:unknown;
}
export interface PreflightNativeResult{
 readonly error?:unknown;readonly action?:PreflightAction|null;
}
export interface PreflightShape{
 readonly team:unknown;readonly skill:unknown;readonly evaluation:unknown;
 readonly playerNumberSnapshot:unknown;readonly startZone:unknown;readonly endZone:unknown;
}
export interface PreflightResult{
 readonly state:'idle'|'error'|'warning'|'draft'|'ok'|'caution';
 readonly message:string;readonly code:string;
 readonly summary?:string;readonly extras?:string[];
 readonly playerKnown?:boolean;readonly nativeShape?:Readonly<PreflightShape>;
}

const SKILLS:Readonly<Record<string,string>>={S:'Saque',R:'Recepción',E:'Colocación',
 A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const GRADES=new Set(['#','+','!','-','/','=']);
const HEAD=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
const clean=(value:unknown)=>String(value??'').trim().toUpperCase().replace(/\s+/g,'');
const label=(value:unknown)=>String(value??'').slice(0,180);

/** Mirrors Scouting Expert's existing messages; no legality assertion. */
export function classifyScoutingPreflight(
 raw:unknown,matchPresent:boolean,matchStatus:unknown,parserAvailable:boolean,
 nativeResult?:PreflightNativeResult|null,parserThrew=false):PreflightResult{
 const code=clean(raw);
 if(!code)return {state:'idle',message:'Escribe un código: 7A# · 3R+ · R12S=.',code};
 if(code.length>140)return {state:'error',message:'Código demasiado largo para previsualizar.',code};
 if(!matchPresent)return {state:'warning',message:'Abre un scouting activo.',code};
 if(matchStatus==='finished')return {state:'warning',message:'El scouting está finalizado. Reábrelo para editar.',code};
 const match=code.match(HEAD);
 if(!match)return {state:'error',message:'Empieza por el dorsal (7A#) o R+dorsal rival (R7A#).',code};
 if(!match[3])return {state:'draft',message:`Dorsal ${match[2]} reconocido · falta fundamento (S/R/E/A/B/D/F/C).`,code};
 const side=match[1]?'Rival':'Nuestro',skill=SKILLS[match[3]],rating=match[4];
 const summary=`${side} · #${match[2]} · ${skill}${rating?' · '+rating:''}`;
 if(!parserAvailable)return {state:'warning',message:`${summary} · motor de validación no disponible.`,code};
 if(parserThrew)return {state:'warning',message:'No se pudo comprobar el borrador. El registro original sigue disponible.',code,summary};
 const parsed=nativeResult;
 if(!parsed||parsed.error||!parsed.action)
  return {state:'error',message:label(parsed?.error||'Código no reconocido por el motor de scouting.'),code,summary};
 const action=parsed.action,extras:string[]=[];
 if(action.startZone)extras.push(`origen ${action.startZone}`);
 if(action.endZone)extras.push(`destino ${action.endZone}`);
 if(action.tempo)extras.push(`tempo ${action.tempo}`);
 const grade=GRADES.has(String(action.evaluation))?action.evaluation:(rating||'—');
 return {state:rating?'ok':'caution',code,summary:`${side} · #${match[2]} · ${skill} · ${grade}`,
  message:rating?'Código aceptado por el motor. Pulsa Enter o Añadir para registrarlo.':
   'El motor acepta el código, pero falta una valoración explícita. Comprueba el resultado antes de añadir.',
  extras,playerKnown:!!action.playerId||!!action.playerLabel||!!action.playerNumberSnapshot,
  nativeShape:Object.freeze({team:action.team,skill:action.skill,evaluation:action.evaluation,
   playerNumberSnapshot:action.playerNumberSnapshot??'',startZone:action.startZone||'',endZone:action.endZone||''})};
}
