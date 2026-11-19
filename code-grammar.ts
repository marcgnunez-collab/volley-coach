import {type Evaluation,type Skill,type Team} from './model';

export type CodeState='empty'|'candidate'|'unsupported';
export interface CodeModifiers{
 readonly serveType:string|null;
 readonly combination:string|null;
 readonly dvCall:string|null;
 readonly phase:string|null;
 readonly blockers:string|null;
 readonly blockTarget:string|null;
 readonly direction:string|null;
 readonly tempo:string|null;
 readonly subtype:string|null;
 readonly setType:string|null;
 readonly special:string|null;
 readonly custom:string|null;
}
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
 readonly modifiers:Readonly<CodeModifiers>;
 readonly reason:string;
}

const HEAD=/^(R?)(\d+)([SREABDFC])([#+!\-/=]?)(.*)$/;
const ZONES=/^\.([1-9][A-D]?)(?:>([1-9][A-D]?|C[1-8]))?/;
const COMBOS=new Set(['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR']);
const SERVES=new Set(['JF','JP','F','U']);
const TEMPOS=new Set(['Q','U','T','M','H','O']);
const FIELDS=['serveType','combination','dvCall','phase','blockers','blockTarget',
 'direction','tempo','subtype','setType','special','custom'] as const;
type ModifierKey=typeof FIELDS[number];
const blankModifiers=():Record<ModifierKey,string|null>=>({serveType:null,combination:null,dvCall:null,
 phase:null,blockers:null,blockTarget:null,direction:null,tempo:null,subtype:null,setType:null,
 special:null,custom:null});

/** All modifier groups are bounded and unique. Order is intentionally flexible. */
function inspectModifiers(tail:string,skill:Skill):Readonly<{ok:boolean;values:Readonly<CodeModifiers>}>{
 const values=blankModifiers();
 let rest=tail,valid=true;
 const set=(key:ModifierKey,value:string)=>{
  if(values[key]!==null){valid=false;return;}
  values[key]=value;
 };
 while(valid&&rest){
  let length=0;
  if(rest.startsWith('::')){
   const token=rest.match(/^::([A-Z0-9]{1,6})(?![A-Z0-9])/);
   if(token){set('dvCall',token[1]);length=token[0].length;}
  }else if(rest.startsWith(':')){
   const token=rest.match(/^:([A-Z0-9]{1,6})(?![A-Z0-9])/);
   if(token){
    if(COMBOS.has(token[1]))set('combination',token[1]);
    else if(skill==='A'||skill==='E')set('dvCall',token[1]);
    else valid=false;
    length=token[0].length;
   }
  }else if(rest.startsWith('~')){
   const token=rest.match(/^~([A-Z0-9]{1,6})(?![A-Z0-9])/);
   if(token){
    const value=token[1];
    if((skill==='A'||skill==='E')&&TEMPOS.has(value))set('tempo',value);
    else if(SERVES.has(value))set('serveType',value);
    else valid=false;
    length=token[0].length;
   }
  }else if(rest.startsWith('^')){
   const token=rest.match(/^\^(K1|K2|FB|TR)(?![A-Z0-9])/);
   if(token){set('phase',token[1]);length=token[0].length;}
  }else if(rest.startsWith('@')){
   const token=rest.match(/^@([0-3])(?![A-Z0-9])/);
   if(token){set('blockers',token[1]);length=token[0].length;}
  }else if(rest.startsWith('&')){
   const token=rest.match(/^&(\d{1,3})(?![A-Z0-9])/);
   if(token&&skill==='B'){set('blockTarget',token[1]);length=token[0].length;}
  }else if(rest.startsWith('*')){
   const token=rest.match(/^\*(LIN|DC|DL)(?![A-Z0-9])/);
   if(token&&skill==='A'){set('direction',token[1]);length=token[0].length;}
  }else if(rest.startsWith('%')){
   const token=rest.match(/^%([A-Z0-9]{1,8})(?![A-Z0-9])/);
   if(token){set('subtype',token[1]);length=token[0].length;}
  }else if(rest.startsWith('|')){
   const token=rest.match(/^\|([FCBPS])(?![A-Z0-9])/);
   if(token){set('setType',token[1]);length=token[0].length;}
  }else if(rest.startsWith('?')){
   const token=rest.match(/^\?([A-Z0-9]{1,10})(?![A-Z0-9])/);
   if(token){set('special',token[1]);length=token[0].length;}
  }else if(rest.startsWith('$')){
   const token=rest.match(/^\$([A-Z0-9]{1,5})(?![A-Z0-9])/);
   if(token){set('custom',token[1]);length=token[0].length;}
  }
  if(!length){valid=false;break;}
  rest=rest.slice(length);
 }
 return Object.freeze({ok:valid&&rest.length===0,values:Object.freeze({...values})});
}

/** Syntax-level only. A candidate is NOT a legal/native-accepted action. */
export function inspectCodeShape(input:unknown):Readonly<CodeShape>{
 const normalized=String(input??'').trim().toUpperCase().replace(/\s+/g,'');
 const empty=():Readonly<CodeShape>=>Object.freeze({state:'empty',normalized,team:null,dorsal:null,skill:null,evaluation:null,startZone:null,endZone:null,advanced:'',modifiers:Object.freeze(blankModifiers()),reason:'Sin código.'});
 if(!normalized)return empty();
 const head=normalized.match(HEAD);
 if(!head||normalized.length>160)return Object.freeze({state:'unsupported',normalized,team:null,dorsal:null,skill:null,evaluation:null,startZone:null,endZone:null,advanced:'',modifiers:Object.freeze(blankModifiers()),reason:'No coincide con la estructura de un código nativo.'});
 const team:Team=head[1]?'opponent':'ours',dorsal=head[2],skill=head[3] as Skill,evaluation=(head[4]||'!') as Evaluation;
 let suffix=head[5],startZone:string|null=null,endZone:string|null=null;
 const zones=suffix.match(ZONES);
 if(zones){
  startZone=zones[1];endZone=zones[2]||null;suffix=suffix.slice(zones[0].length);
  // A single R/D zone describes the contact destination, not an origin.
  // Keep block's one-zone location in startZone, as in the native module.
  if(!endZone&&(skill==='R'||skill==='D')){endZone=startZone;startZone=null;}
 }
 // Reception, defense and block may have one contact zone. Serve, attack,
 // setting and free-ball need a pair when a zone suffix is provided.
 const invalidSingle=!!zones&&!zones[2]&&!['R','D','B'].includes(skill);
 const invalidCone=!!endZone&&endZone.startsWith('C')&&skill!=='A';
 const checked=inspectModifiers(suffix,skill);
 const candidate=!invalidSingle&&!invalidCone&&checked.ok&&!(suffix.startsWith('.'));
 return Object.freeze({state:candidate?'candidate':'unsupported',normalized,team,dorsal,skill,evaluation,
  startZone,endZone,advanced:suffix,modifiers:checked.values,
  reason:candidate?'Estructura reconocida; la plantilla y las reglas siguen pendientes del parser original.':
   invalidSingle?'El fundamento requiere origen y destino; solo R, D y B admiten una zona única.':
   invalidCone?'El destino en cono solo corresponde a un ataque.':'El sufijo no está cubierto de forma segura por la gramática TypeScript.'});
}

/** Optional differential diagnostic; cannot modify the native result. */
export function compareNativeCode(input:unknown,nativeResult:unknown):Readonly<{state:'agree'|'disagree'|'unknown';reason:string}>{
 const shape=inspectCodeShape(input);
 const parsed=typeof nativeResult==='object'&&nativeResult!==null?nativeResult as Record<string,unknown>:null;
 if(shape.state!=='candidate'||!parsed)return Object.freeze({state:'unknown',reason:'Comparación no disponible.'});
 const action=parsed.action&&typeof parsed.action==='object'?parsed.action as Record<string,unknown>:null;
 if(!action)return Object.freeze({state:'unknown',reason:'El motor original rechazó el código o no devolvió una acción.'});
 // Compare ONLY the fields encoded in the head. Native owns all other fields.
 const dorsal=(value:unknown)=>String(value??'').trim().replace(/^0+(?=\d)/,'');
 const same=action.team===shape.team&&action.skill===shape.skill&&action.evaluation===shape.evaluation&&
  dorsal(action.playerNumberSnapshot)===dorsal(shape.dorsal);
 return Object.freeze({state:same?'agree':'disagree',reason:same?'Coinciden los campos básicos con el motor original.':'Diferencia en equipo, dorsal, fundamento o valoración.'});
}
