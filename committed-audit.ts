/* V20.5.7 · Pure inspection of actions already present in canonical scouting.
 * Never invokes the native parser, registers an action, or claims cloud delivery.
 */
import {asList,asRecord,isTeam} from './model';
import {inspectCodeShape,compareNativeCode} from './code-grammar';
import {inspectClosedRally} from './rally-transition';

export type StoredActionKind='agree'|'difference'|'coverage-gap'|'unverified'|'no-code';
export type CommittedFindingKind=Exclude<StoredActionKind,'agree'>|'score'|'score-sequence'|'rotation';
export interface CommittedFinding{
 readonly kind:CommittedFindingKind;
 readonly location:string;
 readonly skill:string;
 readonly reason:string;
}
export interface CommittedCounters{
 readonly actions:number;
 readonly agree:number;
 readonly difference:number;
 readonly coverageGap:number;
 readonly unverified:number;
 readonly noCode:number;
 readonly rallies:number;
 readonly scoreVerified:number;
 readonly scoreInconsistent:number;
 readonly scoreUnknown:number;
 readonly scoreLinksChecked:number;
 readonly scoreLinksMismatch:number;
 readonly rotationsChecked:number;
 readonly rotationsMismatch:number;
}
export interface CommittedAuditReport{
 readonly version:'20.5.7';
 readonly mode:'canonical-local-read-only';
 readonly matchAvailable:boolean;
 readonly truncated:boolean;
 readonly counters:Readonly<CommittedCounters>;
 readonly recent:readonly CommittedFinding[];
 readonly limitations:readonly string[];
}

const MAX_RALLIES=20000,MAX_ACTIONS=60000,MAX_FINDINGS=80;
const SKILLS=new Set(['S','R','E','A','B','D','F','C']);
const labelSkill=(value:unknown)=>typeof value==='string'&&SKILLS.has(value)?value:'—';
const reason:Record<CommittedFindingKind,string>={
 difference:'El código guardado y los campos de la acción no coinciden.',
 'coverage-gap':'El código guardado utiliza sintaxis todavía no cubierta por TypeScript.',
 unverified:'Faltan campos del registro para comprobarlo con seguridad.',
 'no-code':'La acción está registrada sin código original.',
 score:'El ganador no concuerda con el cambio de marcador registrado.',
 'score-sequence':'El tanteo final y el inicial del siguiente rally no coinciden.',
 rotation:'La siguiente rotación o el turno de saque no concuerdan con la proyección básica.'
};

/** Compares a stored action with its own code; no re-parsing with the native writer. */
export function classifyStoredAction(input:unknown):Readonly<{kind:StoredActionKind;skill:string}>{
 const action=asRecord(input),skill=labelSkill(action?.skill);
 if(!action)return Object.freeze({kind:'unverified',skill});
 const code=typeof action.code==='string'?action.code.trim():'';
 if(!code)return Object.freeze({kind:'no-code',skill});
 const shape=inspectCodeShape(code);
 if(shape.state!=='candidate')return Object.freeze({kind:'coverage-gap',skill:labelSkill(shape.skill)||skill});
 if(!isTeam(action.team)||!SKILLS.has(String(action.skill))||
  !['#','+','!','-','/','='].includes(String(action.evaluation))||
  action.playerNumberSnapshot===null||action.playerNumberSnapshot===undefined||
  String(action.playerNumberSnapshot).trim()==='')
  return Object.freeze({kind:'unverified',skill:labelSkill(shape.skill)});
 const result=compareNativeCode(code,{action});
 return Object.freeze({kind:result.state==='agree'?'agree':result.state==='disagree'?'difference':'unverified',
  skill:labelSkill(shape.skill)});
}

/** Explicit, bounded, read-only audit. The report cannot expose names or player numbers. */
export function auditCommittedMatch(input:unknown):Readonly<CommittedAuditReport>{
 const match=asRecord(input);
 const counts={actions:0,agree:0,difference:0,coverageGap:0,unverified:0,noCode:0,
  rallies:0,scoreVerified:0,scoreInconsistent:0,scoreUnknown:0,
  scoreLinksChecked:0,scoreLinksMismatch:0,rotationsChecked:0,rotationsMismatch:0};
 const findings:CommittedFinding[]=[];
 let truncated=false;
 const add=(kind:CommittedFindingKind,location:string,skill='—')=>{
  findings.push(Object.freeze({kind,location,skill:labelSkill(skill),reason:reason[kind]}));
  if(findings.length>MAX_FINDINGS)findings.shift();
 };
 const inspectAction=(action:unknown,location:string)=>{
  if(counts.actions>=MAX_ACTIONS){truncated=true;return false;}
  counts.actions++;
  const fact=classifyStoredAction(action);
  if(fact.kind==='agree')counts.agree++;
  else if(fact.kind==='difference')counts.difference++;
  else if(fact.kind==='coverage-gap')counts.coverageGap++;
  else if(fact.kind==='no-code')counts.noCode++;
  else counts.unverified++;
  if(fact.kind!=='agree')add(fact.kind,location,fact.skill);
  return true;
 };
 const sets=asList(match?.sets);
 main:for(let si=0;si<sets.length;si++){
  const set=asRecord(sets[si]);
  if(!set)continue;
  const rallies=asList(set.rallies);
  for(let ri=0;ri<rallies.length;ri++){
   if(counts.rallies>=MAX_RALLIES){truncated=true;break main;}
   const rally=asRecord(rallies[ri]);if(!rally)continue;
   counts.rallies++;
   const prefix=`S${si+1} · R${ri+1}`;
   const next=asRecord(rallies[ri+1]);
   const result=inspectClosedRally(rally,next);
   if(result.score.state==='verified')counts.scoreVerified++;
   else if(result.score.state==='inconsistent'){counts.scoreInconsistent++;add('score',prefix);}
   else counts.scoreUnknown++;
   for(const [ai,action] of asList(rally.actions).entries()){
    if(!inspectAction(action,`${prefix} · A${ai+1}`))break main;
   }
   if(!next)continue;
   if(result.scoreLink!=='unknown'){
    counts.scoreLinksChecked++;
    if(result.scoreLink==='mismatch'){
     counts.scoreLinksMismatch++;add('score-sequence',`${prefix} → R${ri+2}`);
    }
   }
   if(result.rotationLink!=='unknown'){
    counts.rotationsChecked++;
    if(result.rotationLink==='mismatch'){
     counts.rotationsMismatch++;add('rotation',`${prefix} → R${ri+2}`);
    }
   }
  }
 }
 if(!truncated&&match){
  for(const [ai,action] of asList(asRecord(match.liveRally)?.actions).entries()){
   if(!inspectAction(action,`En curso · A${ai+1}`))break;
  }
 }
 return Object.freeze({version:'20.5.7',mode:'canonical-local-read-only',matchAvailable:!!match,truncated,
  counters:Object.freeze({...counts}),recent:Object.freeze([...findings]),
  limitations:Object.freeze([
   'Examina el estado local del partido abierto; no demuestra escritura en IndexedDB ni recepción en otro dispositivo.',
   'Los cotejos de rotación son estructurales, no sanciones oficiales ni verificación completa de sustituciones.',
   'La sintaxis todavía no soportada y los datos ausentes se separan de las diferencias demostradas.',
   'No se exportan códigos, dorsales, jugadores, identificadores de partido ni vídeos.',
   'Se comprueban como máximo 20 000 rallies y 60 000 acciones en un informe.'
  ])});
}
