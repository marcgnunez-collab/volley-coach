import {asList,asRecord,isRotation} from './model';
import {auditMatchScores} from './scoring';
import {nextRotation} from './rotation';
import {sideOutBreakPoint,attackEfficiency} from './statistics';
import {inspectCodeShape} from './code-grammar';
import {inspectSubstitution} from './substitutions';
import type {ObservableMatchStore} from '../state/match-observable';
import {readCanonicalMatch,type CanonicalMatchWindow} from '../state/match-state-contract';

export interface DomainOverview{
 readonly matchAvailable:boolean;
 readonly score:ReturnType<typeof auditMatchScores>;
 readonly rotation:string;
 readonly sideOutPct:number|null;
 readonly breakPointPct:number|null;
 readonly attackEfficiencyPct:number|null;
}

/** A view projection. It never computes or writes a new official score. */
export function inspectMatchDomain(match:unknown):Readonly<DomainOverview>{
 const record=asRecord(match),score=auditMatchScores(match);
 const allRallies:unknown[]=[],ourAttacks:unknown[]=[];
 for(const set of asList(record?.sets))for(const item of asList(asRecord(set)?.rallies)){
  const rally=asRecord(item);if(!rally)continue;
  allRallies.push(rally);
  for(const action of asList(rally.actions)){
   const candidate=asRecord(action);if(candidate?.skill==='A'&&candidate.team==='ours')ourAttacks.push(candidate);
  }
 }
 const rotation=isRotation(record?.rotationNo)&&isRotation(record?.opponentRotationNo)?
  `R${record.rotationNo} · Rival R${record.opponentRotationNo}`:'Sin datos suficientes';
 const phases=sideOutBreakPoint(allRallies);
 return Object.freeze({matchAvailable:!!record,score,rotation,
  sideOutPct:phases.sideOut.percent,
  breakPointPct:phases.breakPoint.percent,
  attackEfficiencyPct:attackEfficiency(ourAttacks).efficiencyPct});
}

type LegacyWindow=CanonicalMatchWindow&{
 VC_DOMAIN_2055?:Readonly<DomainAPI>;
 VC_STATE_2059?:Readonly<ObservableMatchStore>;
};
interface DomainAPI{
 readonly version:string;
 readonly readOnly:true;
 inspectCodeShape:typeof inspectCodeShape;
 inspectSubstitution:typeof inspectSubstitution;
 nextRotation:typeof nextRotation;
 inspectCurrent:()=>Readonly<DomainOverview>;
 dispose:()=>void;
}

export function mountDomainDiagnostic(win:LegacyWindow):Readonly<DomainAPI>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_DOMAIN_2055)return win.VC_DOMAIN_2055;
 const node=(tag:string,className='',content='')=>{
  const element=doc.createElement(tag);
  element.className=className;
  element.textContent=content;
  return element;
 };
 const section=node('section','vc2055-domain');section.id='vc2055-domain';
 const heading=node('div','vc2055-heading');
 const title=node('div');title.append(node('small','','MOTOR DE DOMINIO · V20.5.5'),node('h3','','Reglas TypeScript · diagnóstico'));
 heading.append(title,node('span','','Solo lectura'));
 const description=node('p','','Puntuación, rotaciones, códigos y estadísticas tipadas. El registro, marcador y nube siguen utilizando el motor original.');
 const status=node('p','vc2055-status','Sin datos comprobados');status.setAttribute('role','status');
 const metrics=node('div','vc2055-metrics');
 const fields:[string,string][]=[['verified','Trazas verificadas'],['inconsistent','Inconsistencias'],['unknown','Trazas sin datos'],['rotation','Rotaciones'],['so','Side-Out propio'],['bp','Break Point propio'],['attack','Eficiencia ataque']];
 const output=new Map<string,HTMLElement>();
 for(const [key,label] of fields){
  const item=node('div');item.append(node('small','',label));
  const value=node('strong','','—');item.append(value);metrics.append(item);output.set(key,value);
 }
 const button=node('button','vc2055-refresh','Comprobar reglas');button.setAttribute('type','button');
 const note=node('p','vc2055-note','Una traza sin datos no es un error. Las comprobaciones no sustituyen la validación oficial de líberos y sustituciones ni confirman la sincronización en otro dispositivo.');
 section.append(heading,description,status,metrics,button,note);
 const anchor=doc.getElementById('vc2053-modular-core');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.insertAdjacentElement('afterbegin',section);

 const inspectCurrent=()=>inspectMatchDomain(readCanonicalMatch(win));
 const format=(value:number|null)=>value===null?'—':`${value}%`;
 const render=()=>{
  const data=inspectCurrent();
  status.textContent=data.matchAvailable?'Datos del partido original examinados':'Sin partido activo';
  section.dataset.state=data.matchAvailable?'available':'waiting';
  const values:Record<string,string>={
   verified:String(data.score.verified),inconsistent:String(data.score.inconsistent),unknown:String(data.score.unknown),
   rotation:data.rotation,so:format(data.sideOutPct),bp:format(data.breakPointPct),attack:format(data.attackEfficiencyPct)
  };
  for(const [key,value] of Object.entries(values)){
   const target=output.get(key);if(target&&target.textContent!==value)target.textContent=value;
  }
 };
 let pending=false,disposed=false;
 const schedule=()=>{
  if(disposed||pending||!host.classList.contains('active'))return;
  pending=true;
  Promise.resolve().then(()=>{pending=false;if(!disposed)render();});
 };
 button.addEventListener('click',render);
 let unsubscribe=()=>{};
 let legacyDom=false;
 if(win.VC_STATE_2059){
  const stops=[win.VC_STATE_2059.subscribe('score',schedule),win.VC_STATE_2059.subscribe('court',schedule),
   win.VC_STATE_2059.subscribe('rally',schedule),win.VC_STATE_2059.subscribe('status',schedule)];
  unsubscribe=()=>stops.forEach(stop=>stop());
 }else{
  legacyDom=true;doc.addEventListener('vc:matchstatechange',schedule);
  try{const stop=win.MatchState?.subscribe?.(schedule);if(typeof stop==='function')unsubscribe=stop;}catch(_){/* DOM event fallback. */}
 }
 const observer=typeof MutationObserver==='function'?new MutationObserver(schedule):null;
 observer?.observe(host,{attributes:true,attributeFilter:['class']});
 if(host.classList.contains('active'))render();
 const api=Object.freeze({version:'20.5.5',readOnly:true as const,inspectCodeShape,inspectSubstitution,nextRotation,inspectCurrent,
  dispose(){if(disposed)return;disposed=true;observer?.disconnect();unsubscribe();if(legacyDom)doc.removeEventListener('vc:matchstatechange',schedule);section.remove();if(win.VC_DOMAIN_2055===api)delete win.VC_DOMAIN_2055;}});
 win.VC_DOMAIN_2055=api;
 return api;
}
