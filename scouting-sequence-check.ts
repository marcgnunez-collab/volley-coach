/* V20.5.33 · Read-only inspection of a typed multi-contact rally draft.
 * The legacy scorer decides acceptance, point/rotation and persistence.
 * Warnings are advisory; incomplete recorded rallies may be legitimate.
 */
import {inspectCodeShape} from '../domain/code-grammar';
import {parseScoutingDraftHead} from './scouting-speed-draft';

export type SequenceStatus='empty'|'ready'|'review'|'invalid';
export type SequenceTeam='ours'|'opponent';
export interface SequenceContact{
 readonly position:number;
 readonly team:SequenceTeam;
 readonly number:string;
 readonly skill:string;
 readonly rating:string|null;
 readonly nativePreview:string;
 readonly status:'ready'|'review'|'invalid';
}
export interface SequenceIssue{
 readonly position:number;
 readonly severity:'warning'|'error';
 readonly reason:string;
}
export interface SequenceInspection{
 readonly status:SequenceStatus;
 readonly contacts:ReadonlyArray<Readonly<SequenceContact>>;
 readonly issues:ReadonlyArray<Readonly<SequenceIssue>>;
 readonly counts:Readonly<{contacts:number;warnings:number;errors:number}>;
 readonly advice:string;
}
export const MAX_SEQUENCE_CHARACTERS=512;
export const MAX_SEQUENCE_CONTACTS=32;

const TERMINAL_SKILLS=new Set(['S','A','B']);
/** A terminal marker is only a plausible end-of-rally, never a point award. */
function likelyTerminal(skill:string,rating:string|null):boolean{
 return (TERMINAL_SKILLS.has(skill)&&rating==='#')||
  ((skill==='S'||skill==='A')&&rating==='=');
}

function result(status:SequenceStatus,contacts:SequenceContact[],issues:SequenceIssue[],advice:string):Readonly<SequenceInspection>{
 return Object.freeze({status,
  contacts:Object.freeze(contacts.map(contact=>Object.freeze({...contact}))),
  issues:Object.freeze(issues.map(issue=>Object.freeze({...issue}))),
  counts:Object.freeze({contacts:contacts.length,warnings:issues.filter(x=>x.severity==='warning').length,
   errors:issues.filter(x=>x.severity==='error').length}),advice
 });
}

/** Supports DV-style *own/.opponent and the existing own/Ropponent shortcuts. */
export function inspectScoutingSequence(raw:unknown):Readonly<SequenceInspection>{
 const input=String(raw??'').trim().toUpperCase();
 if(!input)return result('empty',[],[],'Escribe una secuencia para comprobar su estructura.');
 if(input.length>MAX_SEQUENCE_CHARACTERS)
  return result('invalid',[],[{position:0,severity:'error',reason:'Secuencia demasiado larga (máximo 512 caracteres).'}],
   'Reduce la secuencia; no se ha registrado ninguna acción.');
 const words=input.split(/\s+/);
 if(words.length>MAX_SEQUENCE_CONTACTS)
  return result('invalid',[],[{position:0,severity:'error',reason:'Demasiados contactos (máximo 32).'}],
   'Divide la secuencia; no se ha registrado ninguna acción.');
 const contacts:SequenceContact[]=[],issues:SequenceIssue[]=[];
 const warn=(position:number,reason:string)=>issues.push({position,severity:'warning',reason});
 const error=(position:number,reason:string)=>issues.push({position,severity:'error',reason});
 let prior:SequenceContact|null=null;
 for(const [index,token] of words.entries()){
  const position=index+1,marker=token[0];
  const side:SequenceTeam=marker==='.'||marker==='R'?'opponent':'ours';
  const nativePreview=marker==='*'?token.slice(1):marker==='.'?'R'+token.slice(1):token;
  const head=parseScoutingDraftHead(nativePreview);
  if(!head||!head.skill){
   error(position,`Código ${position}: falta dorsal/fundamento o el prefijo no es válido.`);
   continue;
  }
  const checked=inspectCodeShape(nativePreview),rated=!!head.rating;
  const status:SequenceContact['status']=checked.state==='candidate'&&rated?'ready':'review';
  const contact:SequenceContact={position,team:side,number:head.number,skill:head.skill,
   rating:head.rating||null,nativePreview,status};
  contacts.push(contact);
  if(checked.state!=='candidate')warn(position,`Código ${position}: el sufijo necesita confirmación en el editor original.`);
  if(!rated)warn(position,`Código ${position}: falta valoración explícita.`);
  if(prior){
   if(likelyTerminal(prior.skill,prior.rating))
    warn(position,`Código ${position}: hay un contacto después de una valoración que parece cerrar el punto.`);
   if(prior.team===contact.team&&prior.number===contact.number&&prior.skill!=='B')
    warn(position,`Código ${position}: posible doble contacto del mismo dorsal; revisa la jugada.`);
   if(prior.skill==='S'&&contact.skill==='R'&&prior.team===contact.team)
    warn(position,`Código ${position}: el saque y la recepción se atribuyen al mismo equipo.`);
  }
  prior=contact;
 }
 const status:SequenceStatus=issues.some(x=>x.severity==='error')?'invalid':
  issues.length?'review':'ready';
 return result(status,contacts,issues,status==='ready'?
  'Estructura reconocida. Sin comprobar alineaciones, legalidad ni aceptación del registrador.':
  status==='review'?'Hay avisos orientativos. Revisa los códigos antes de registrar el rally.':
  'Hay errores de sintaxis. Corrige la secuencia; no se ha registrado ninguna acción.');
}
