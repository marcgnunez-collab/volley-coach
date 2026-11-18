/* V20.5.6 · Pure differential checks over the EXISTING native preflight.
 * No parser invocation, match reference, storage or network call.
 */
import {asRecord} from './model';
import {inspectCodeShape,compareNativeCode,type CodeShape} from './code-grammar';

export type ShadowKind='agree'|'difference'|'coverage-gap'|'native-reject'|'unverified';
export type SafeSource='directo'|'video'|'otro';
export interface ShadowFinding{
 readonly kind:ShadowKind;
 readonly source:SafeSource;
 readonly skill:string;
 readonly advanced:boolean;
 readonly reason:string;
}
export interface ShadowCounters{
 readonly total:number;
 readonly agree:number;
 readonly difference:number;
 readonly coverageGap:number;
 readonly nativeReject:number;
 readonly unverified:number;
}
export interface ShadowSnapshot{
 readonly version:'20.5.6';
 readonly mode:'in-memory-read-only';
 readonly counters:Readonly<ShadowCounters>;
 readonly recent:readonly ShadowFinding[];
 readonly limitations:readonly string[];
}

const LIMIT=80;
const sourceOf=(value:unknown):SafeSource=>value==='v800-code'?'directo':value==='v113-video-code'?'video':'otro';
const shapeOf=(value:unknown):CodeShape=>inspectCodeShape(value);

/** Compare preflight results already produced by V20.5.1; no second parse. */
export function classifyPreflight(detail:unknown):Readonly<ShadowFinding>{
 const envelope=asRecord(detail),shape=shapeOf(envelope?.code);
 const source=sourceOf(envelope?.source),native=asRecord(envelope?.nativeShape);
 const common={source,skill:shape.skill||'—',advanced:!!shape.advanced};
 if(native){
  if(shape.state!=='candidate')return Object.freeze({kind:'coverage-gap',...common,
   reason:'El motor original reconoce una sintaxis aún no cubierta por el módulo TS.'});
  const comparison=compareNativeCode(envelope?.code,{action:native});
  if(comparison.state==='agree')return Object.freeze({kind:'agree',...common,reason:'Coinciden equipo, dorsal, fundamento y valoración.'});
  if(comparison.state==='disagree')return Object.freeze({kind:'difference',...common,reason:'Difieren campos básicos frente al parser nativo.'});
 }
 if(envelope?.state==='error')return Object.freeze({kind:'native-reject',...common,
  reason:'El motor original no aceptó el borrador; puede faltar un jugador o un campo.'});
 return Object.freeze({kind:'unverified',...common,reason:'No hay dos resultados completos para comparar.'});
}

/** Only coarse categories and summaries are retained, never the original code. */
export function createShadowSession(){
 let total=0,agree=0,difference=0,coverageGap=0,nativeReject=0,unverified=0;
 const recent:ShadowFinding[]=[];
 const snapshot=():Readonly<ShadowSnapshot>=>Object.freeze({
  version:'20.5.6',mode:'in-memory-read-only',
  counters:Object.freeze({total,agree,difference,coverageGap,nativeReject,unverified}),
  recent:Object.freeze([...recent]),
  limitations:Object.freeze([
   'Solo compara borradores vistos por la previsualización nativa; no acredita que se hayan registrado.',
   'Una diferencia de sintaxis no prueba un error de puntuación.',
   'No incluye códigos, dorsales, nombres, identificadores de partido ni datos de nube.'
  ])
 });
 return Object.freeze({
  record(detail:unknown):Readonly<ShadowFinding>{
   const finding=classifyPreflight(detail);
   total++;
   if(finding.kind==='agree')agree++;
   else if(finding.kind==='difference')difference++;
   else if(finding.kind==='coverage-gap')coverageGap++;
   else if(finding.kind==='native-reject')nativeReject++;
   else unverified++;
   if(finding.kind!=='agree'){
    recent.push(finding);
    if(recent.length>LIMIT)recent.shift();
   }
   return finding;
  },
  snapshot,
  clear(){total=0;agree=0;difference=0;coverageGap=0;nativeReject=0;unverified=0;recent.length=0;}
 });
}
