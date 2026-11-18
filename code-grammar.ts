import {type Evaluation,type Skill,type Team} from './model';

export type CodeState='empty'|'candidate'|'unsupported';
export interface CodeShape{
 readonly state:CodeState;
 readonly normalized:string;
 readonly team:Team|null;
 readonly dorsal:string|null;
 readonly skill:Skill|null;
 readonly evaluation:Evaluation|null;
 readonly startZone:string|null;
 readonly endZone:string|null;
 readonly advanced:string;
 readonly reason:string;
}

const HEAD=/^(R?)(\d+)([SREABDFC])([#+!\-/=]?)(.*)$/;
const ZONES=/^\.([1-9][A-D]?)(?:>([1-9][A-D]?|C[1-8]))?/;
const ADVANCED= /^(?:(?:~[A-Z0-9]{1,6})|(?:::?[A-Z0-9]{1,10})|(?:\*[A-Z0-9]{1,3})|(?:\^[A-Z0-9]{1,3})|(?:@[0-3])|(?:&\d{1,3})|(?:%[A-Z0-9]{1,8})|(?:\|[A-Z0-9]{1,3})|(?:\?[A-Z0-9]{1,10})|(?:\$[A-Z0-9]{1,5}))*$/;

/** Syntax-level only. A candidate is NOT a legal/native-accepted action. */
export function inspectCodeShape(input:unknown):Readonly<CodeShape>{
 const normalized=String(input??'').trim().toUpperCase().replace(/\s+/g,'');
 const empty=():Readonly<CodeShape>=>Object.freeze({state:'empty',normalized,team:null,dorsal:null,skill:null,evaluation:null,startZone:null,endZone:null,advanced:'',reason:'Sin código.'});
 if(!normalized)return empty();
 const head=normalized.match(HEAD);
 if(!head||normalized.length>160)return Object.freeze({state:'unsupported',normalized,team:null,dorsal:null,skill:null,evaluation:null,startZone:null,endZone:null,advanced:'',reason:'No coincide con la sintaxis de un código nativo.'});
 const team:Team=head[1]?'opponent':'ours',dorsal=head[2],skill=head[3] as Skill,evaluation=(head[4]||'!') as Evaluation;
 let suffix=head[5],startZone:string|null=null,endZone:string|null=null;
 const zones=suffix.match(ZONES);
 if(zones){startZone=zones[1];endZone=zones[2]||null;suffix=suffix.slice(zones[0].length);}
 // Reception, defense and block may have one contact zone. Serve, attack,
 // setting and free-ball need a pair when a zone suffix is provided.
 const invalidSingle=!!startZone&&!endZone&&!['R','D','B'].includes(skill);
 const invalidCone=!!endZone&&endZone.startsWith('C')&&skill!=='A';
 const advancedOk=ADVANCED.test(suffix);
 const candidate=!invalidSingle&&!invalidCone&&advancedOk&&!(suffix.startsWith('.'));
 return Object.freeze({state:candidate?'candidate':'unsupported',normalized,team,dorsal,skill,evaluation,
  startZone,endZone,advanced:suffix,
  reason:candidate?'Estructura reconocida; la plantilla y las reglas siguen pendientes del parser original.':
   invalidSingle?'El fundamento requiere origen y destino; solo R, D y B admiten una zona única.':
   invalidCone?'El destino en cono solo corresponde a un ataque.':'Hay un sufijo que requiere el validador original.'});
}

/** Optional differential diagnostic; cannot modify the native result. */
export function compareNativeCode(input:unknown,nativeResult:unknown):Readonly<{state:'agree'|'disagree'|'unknown';reason:string}>{
 const shape=inspectCodeShape(input);
 const parsed=typeof nativeResult==='object'&&nativeResult!==null?nativeResult as Record<string,unknown>:null;
 if(shape.state!=='candidate'||!parsed)return Object.freeze({state:'unknown',reason:'Comparación no disponible.'});
 const action=parsed.action&&typeof parsed.action==='object'?parsed.action as Record<string,unknown>:null;
 if(!action)return Object.freeze({state:'unknown',reason:'El motor original rechazó el código o no devolvió una acción.'});
 // Compare ONLY the fields encoded in the head. Native owns all other fields.
 const same=action.team===shape.team&&action.skill===shape.skill&&action.evaluation===shape.evaluation&&
  String(action.playerNumberSnapshot??'')===shape.dorsal;
 return Object.freeze({state:same?'agree':'disagree',reason:same?'Coinciden los campos básicos con el motor original.':'Diferencia en equipo, dorsal, fundamento o valoración.'});
}
