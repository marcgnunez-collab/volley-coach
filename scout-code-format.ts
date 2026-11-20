/* V20.5.42 · Pure contact metadata and effective V8.3 code formatting.
 * No player lookups, mutable match, rally writes, video or cloud calls.
 */
export interface ContactMetadata{
 readonly contactZone:string;
 readonly sourceZone:string;
 readonly zoneInferred:boolean;
 readonly sourceActionId:number|null;
 readonly migratedEndZone:string|null;
}
export function normalizeContactMetadata(
 input:unknown,normalized:unknown):ContactMetadata{
 const a=(input||{}) as Record<string,unknown>;
 const x=(normalized||{}) as Record<string,unknown>;
 const contactSkill=x.skill==='R'||x.skill==='D';
 const contact=String(a.contactZone||((contactSkill)?(x.endZone||x.startZone||''):'')||'');
 const source=String(a.sourceZone||((contactSkill&&x.startZone&&x.endZone)?x.startZone:'')||'');
 const migrate=contactSkill&&!!contact&&!x.endZone&&!x.startZone;
 return {contactZone:contact,sourceZone:source,zoneInferred:!!a.zoneInferred,
  sourceActionId:a.sourceActionId!=null?Number(a.sourceActionId):null,
  migratedEndZone:migrate?contact:null};
}
/** The canonical builder in the V8.3 chain, before block/DV wrappers. */
export function buildScoutCodeV830(action:unknown,ownPlayer:unknown):string{
 const a=action as Record<string,unknown>;
 let token='';
 if(a.team==='opponent'){
  const n=String(a.playerLabel||'').match(/\d+/)?.[0]||
   String(a.playerNumberSnapshot||'').match(/\d+/)?.[0]||
   String(a.playerLabel||'').replace(/\s+/g,'').slice(0,4)||'?';
  token='R'+n;
 }else{
  const p=ownPlayer as {number?:unknown}|null|undefined;
  token=p?.number!==''&&p?.number!=null?String(p.number):
   (a.playerNumberSnapshot!==''&&a.playerNumberSnapshot!=null?String(a.playerNumberSnapshot):'P');
 }
 token+=String(a.skill)+(a.evaluation||'!');
 if(a.startZone&&a.endZone)token+=`.${a.startZone}>${a.endZone}`;
 else if((a.skill==='R'||a.skill==='D')){
  const contact=String(a.contactZone||(a.endZone||a.startZone||'')||'');
  if(contact)token+=`.${contact}`;
 }
 const serveMeta=a.skill==='R'?a.receivedServeType:a.serveType;
 if(serveMeta)token+=`~${serveMeta}`;
 const combo=a.setTarget||a.attackCombo;if(combo)token+=`:${combo}`;
 if(a.skill==='A'&&a.attackDirection)token+=`*${a.attackDirection}`;
 if(a.phase)token+=`^${a.phase}`;
 if(a.blockers!==''&&a.blockers!=null)token+=`@${a.blockers}`;
 return token;
}
