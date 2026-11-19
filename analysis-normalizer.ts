/* V20.5.24 · Typed and pure replacement for the V19.3.8 canonical projection.
 * Read-only: native MatchState remains the unique source of truth and writer.
 * Preserve exact stable keys, unknown facts, possession boundaries and links.
 */
import {asRecord,asList,isTeam,type Team,type Skill,type Evaluation} from '../domain/model';
import type {SearchData} from './analysis-query';

const SKILLS=new Set(['S','R','E','A','B','D','F','C']);
const EVALS=new Set(['#','+','!','-','/','=']);
const val=(x:unknown)=>String(x??'').trim();
const present=(x:unknown)=>x!==null&&x!==undefined&&val(x)!=='';
const idPart=(x:unknown)=>encodeURIComponent(val(x));

export interface AnalysisZone{readonly zone:number;readonly quadrant:string|null;readonly code:string;}
export interface NormalizedFields{
 readonly startZone:AnalysisZone|null;readonly endZone:AnalysisZone|null;
 readonly contactZone:AnalysisZone|null;readonly setTarget:AnalysisZone|null;
 readonly tempo:string;readonly attackTempo:string;readonly combo:string;readonly setterCall:string;
 readonly direction:string;readonly blockers:string;readonly serveType:string;readonly subtype:string;
 readonly receivedServeType:string;readonly dvSetType:string;readonly attackCode:string;
 readonly endCone:string;readonly specialCode:string;readonly blockTargetNumber:string;
 readonly startCoordinate:unknown;readonly endCoordinate:unknown;readonly contactCoordinate:unknown;
}
export interface NormalizedContact{
 readonly key:string;readonly rallyKey:string;readonly matchId:string;
 readonly set:number;readonly rallyIndex:number;readonly actionIndex:number;
 readonly nativeId:string|null;readonly team:Team|null;
 readonly code:string;readonly skill:Skill|null;readonly skillRaw:string;
 readonly evaluation:Evaluation|null;readonly evaluationRaw:string;
 readonly player:string|null;readonly fields:NormalizedFields;readonly video:boolean;
 readonly scoutMs:number|null;
 readonly source:Readonly<{matchId:string;setIndex:number;rallyIndex:number;actionIndex:number;stableId:boolean}>;
 possessionKey?:string;
}
export interface NormalizedPossession{
 readonly key:string;readonly rallyKey:string;readonly team:Team;
 readonly contacts:NormalizedContact[];readonly set:number;readonly rotation:number|null;
 readonly serving:Team|null;readonly winner:Team|null;
}
export interface NormalizedRally{
 readonly key:string;readonly matchId:string;readonly set:number;readonly index:number;
 readonly nativeId:string|null;readonly serving:Team|null;readonly winner:Team|null;
 readonly closed:boolean;readonly ownRotation:number|null;readonly rivalRotation:number|null;
 readonly contacts:NormalizedContact[];readonly possessions:NormalizedPossession[];
 readonly scoreBefore:unknown;readonly scoreAfter:unknown;
 readonly provenance:Readonly<{setIndex:number;rallyIndex:number;stableId:boolean}>;
}
export interface NormalizedChain{
 readonly key:string;readonly team:Team;readonly rallyKey:string;readonly possessionKey:string;
 readonly rotation:number|null;readonly setter:NormalizedContact;readonly attack:NormalizedContact|null;
 readonly reception:NormalizedContact|null;readonly target:AnalysisZone|null;
 readonly tempo:string;readonly combo:string;readonly explicitTarget:boolean;
}
export interface NormalizationIssue{
 readonly type:string;readonly key?:string;readonly set?:number;readonly index?:number;
 readonly field?:string;readonly message:string;
}
export interface NormalizedAnalysis extends SearchData{
 readonly version:'19.3.8';readonly matchId:string;
 readonly rallies:NormalizedRally[];readonly contacts:NormalizedContact[];
 readonly possessions:NormalizedPossession[];readonly chains:NormalizedChain[];
 readonly issues:NormalizationIssue[];
 readonly count:Readonly<{rallies:number;closed:number;contacts:number;possessions:number;chains:number}>;
}

export function normalizeAnalysisZone(value:unknown):AnalysisZone|null{
 const match=val(value).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);
 return match?{zone:Number(match[1]),quadrant:match[2]||null,code:'Z'+match[1]+(match[2]||'')}:null;
}
const getPlayer=(a:Record<string,unknown>)=>val(a.playerNameSnapshot||a.playerLabel||
 a.playerNumberSnapshot||a.playerId||a.playerNumber);

/** Exact projection parity with historical VC_DATA_ENGINE_1938.normalize. */
export function normalizeAnalysisMatch(match:unknown):NormalizedAnalysis{
 const issues:NormalizationIssue[]=[],rallies:NormalizedRally[]=[],contacts:NormalizedContact[]=[],
  possessions:NormalizedPossession[]=[],chains:NormalizedChain[]=[];
 const m=asRecord(match),matchId=val(m?.id),setKeys=new Set<number>();
 for(const [si,rawSet] of asList(m?.sets).entries()){
  const set=asRecord(rawSet),setNumber=Number(set?.number);
  const setId=Number.isInteger(setNumber)&&setNumber>0?setNumber:si+1;
  if(setKeys.has(setId))issues.push({type:'duplicate-set',set:setId,message:'Número de set duplicado'});
  setKeys.add(setId);
  const rallyIds=new Set<string>();
  for(const [ri,rawRally] of asList(set?.rallies).entries()){
   if(!rawRally)continue;
   const raw=asRecord(rawRally)||{};
   const nativeRallyId=present(raw.id)?val(raw.id):null;
   if(nativeRallyId&&rallyIds.has(nativeRallyId))
    issues.push({type:'duplicate-rally',set:setId,index:ri+1,message:'Identificador de rally repetido'});
   if(nativeRallyId)rallyIds.add(nativeRallyId);
   const key=[idPart(matchId),setId,nativeRallyId?'id:'+idPart(nativeRallyId):'pos:'+ri].join('|');
   const serving=isTeam(raw.servingBefore)?raw.servingBefore:null,
    winner=isTeam(raw.winner)?raw.winner:null;
   const ownRotation=Number(raw.rotationBefore),rivalRotation=Number(raw.opponentRotationBefore);
   const rally:NormalizedRally={key,matchId,set:setId,index:ri+1,nativeId:nativeRallyId,
    serving,winner,closed:!!winner,
    ownRotation:Number.isInteger(ownRotation)&&ownRotation>=1&&ownRotation<=6?ownRotation:null,
    rivalRotation:Number.isInteger(rivalRotation)&&rivalRotation>=1&&rivalRotation<=6?rivalRotation:null,
    contacts:[],possessions:[],scoreBefore:raw.scoreBefore||null,scoreAfter:raw.scoreAfter||null,
    provenance:{setIndex:si,rallyIndex:ri,stableId:!!nativeRallyId}};
   if(!winner)issues.push({type:'unknown-winner',key,message:'Ganador de rally sin registrar'});
   if(!serving)issues.push({type:'unknown-serve',key,message:'Equipo al saque no identificado'});
   const actionIds=new Set<string>();
   for(const [ai,rawAction] of asList(raw.actions).entries()){
    if(!rawAction)continue;
    const a=asRecord(rawAction)||{},t=isTeam(a.team)?a.team:null,
     skill=val(a.skill).toUpperCase(),evaluation=val(a.evaluation);
    const actionId=present(a.id)?val(a.id):null;
    if(actionId&&actionIds.has(actionId))
     issues.push({type:'duplicate-action',key,index:ai,message:'Acción duplicada dentro del rally'});
    if(actionId)actionIds.add(actionId);
    const fields:NormalizedFields={
     startZone:normalizeAnalysisZone(a.startZone),endZone:normalizeAnalysisZone(a.endZone),
     contactZone:normalizeAnalysisZone(a.contactZone),setTarget:normalizeAnalysisZone(a.setTarget),
     tempo:val(a.setTempo),attackTempo:val(a.attackTempo),combo:val(a.attackCombo),
     setterCall:val(a.setterCall),direction:val(a.attackDirection),
     blockers:present(a.blockers)?val(a.blockers):'',serveType:val(a.serveType),
     subtype:val(a.skillSubtype),receivedServeType:val(a.receivedServeType),
     dvSetType:val(a.dvSetType),attackCode:val(a.attackCode),endCone:val(a.endCone),
     specialCode:val(a.specialCode),blockTargetNumber:val(a.blockTargetNumber),
     startCoordinate:present(a.startCoordinate)?a.startCoordinate:null,
     endCoordinate:present(a.endCoordinate)?a.endCoordinate:null,
     contactCoordinate:present(a.contactCoordinate)?a.contactCoordinate:null
    };
    const videoFields=['videoTime','videoTimestamp','liveVideoTime','videoAction'];
    const video=videoFields.some(field=>present(a[field])&&Number.isFinite(Number(a[field]))&&Number(a[field])>=0);
    const contact:NormalizedContact={
     key:key+'|'+(actionId?'id:'+idPart(actionId):'pos:'+ai),rallyKey:key,matchId,set:setId,
     rallyIndex:ri+1,actionIndex:ai,nativeId:actionId,team:t,code:val(a.code),
     skill:SKILLS.has(skill)?skill as Skill:null,skillRaw:skill,
     evaluation:EVALS.has(evaluation)?evaluation as Evaluation:null,
     evaluationRaw:evaluation,player:getPlayer(a)||null,fields,video,
     scoutMs:Number.isFinite(Number(a.scoutMs))&&present(a.scoutMs)?Number(a.scoutMs):null,
     source:{matchId,setIndex:si,rallyIndex:ri,actionIndex:ai,stableId:!!actionId}
    };
    if(!t)issues.push({type:'unknown-team',key:contact.key,message:'Acción sin equipo identificado'});
    if(!contact.skill)issues.push({type:'unknown-skill',key:contact.key,message:'Fundamento desconocido'});
    if(evaluation&&!contact.evaluation)
     issues.push({type:'unknown-evaluation',key:contact.key,message:'Valoración no reconocida'});
    for(const field of ['startZone','endZone','contactZone','setTarget'] as const)
     if(present(a[field])&&!fields[field])
      issues.push({type:'invalid-zone',key:contact.key,field,message:'Zona no reconocida'});
    contacts.push(contact);rally.contacts.push(contact);
   }
   let group:NormalizedPossession|null=null;
   for(const contact of rally.contacts){
    if(!group||!contact.team||group.team!==contact.team){
     if(!contact.team){group=null;continue;}
     group={key:rally.key+'|pos:'+rally.possessions.length,rallyKey:rally.key,team:contact.team,
      contacts:[],set:rally.set,rotation:contact.team==='ours'?rally.ownRotation:rally.rivalRotation,
      serving:rally.serving,winner:rally.winner};
     rally.possessions.push(group);possessions.push(group);
    }
    group.contacts.push(contact);contact.possessionKey=group.key;
   }
   for(const possession of rally.possessions){
    for(const [pi,contact] of possession.contacts.entries()){
     if(contact.skill!=='E')continue;
     let attack:NormalizedContact|null=null,reception:NormalizedContact|null=null;
     for(let i=pi+1;i<possession.contacts.length;i++){
      const next=possession.contacts[i];if(next.skill==='E')break;
      if(next.skill==='A'){attack=next;break;}
     }
     for(let i=pi-1;i>=0;i--)if(possession.contacts[i].skill==='R'){
      reception=possession.contacts[i];break;
     }
     chains.push({key:contact.key,team:possession.team,rallyKey:rally.key,
      possessionKey:possession.key,rotation:possession.rotation,setter:contact,
      attack,reception,target:contact.fields.setTarget,tempo:contact.fields.tempo,
      combo:contact.fields.combo||attack?.fields.combo||'',
      explicitTarget:!!contact.fields.setTarget});
    }
   }
   rallies.push(rally);
  }
 }
 return {version:'19.3.8',matchId,rallies,contacts,possessions,chains,issues,
  count:{rallies:rallies.length,closed:rallies.filter(r=>r.closed).length,
   contacts:contacts.length,possessions:possessions.length,chains:chains.length}};
}
