/* V20.5.23 · Typed, pure tactical rally search.
 * Extracted from the proven VC_RALLY_SEARCH_1939 query. Native data engine and UI
 * continue owning their projections, presets, video jumps and exports.
 */

interface SearchZone{readonly code?:unknown;}
interface SearchFields{
 readonly attackCode?:unknown;
 readonly specialCode?:unknown;
 readonly startZone?:SearchZone|null;
 readonly endZone?:SearchZone|null;
 readonly setTarget?:SearchZone|null;
 readonly contactZone?:SearchZone|null;
 readonly combo?:unknown;
 readonly direction?:unknown;
 readonly attackTempo?:unknown;
}
export interface SearchContact{
 readonly key:string;
 readonly rallyKey:string;
 readonly possessionKey?:string|null;
 readonly team?:unknown;
 readonly skill?:unknown;
 readonly skillRaw?:unknown;
 readonly evaluation?:unknown;
 readonly code?:unknown;
 readonly player?:unknown;
 readonly video?:unknown;
 readonly fields?:SearchFields;
}
export interface SearchChain{
 readonly key:string;
 readonly rallyKey:string;
 readonly possessionKey?:string|null;
 readonly team?:unknown;
 readonly setter?:SearchContact|null;
 readonly attack?:SearchContact|null;
 readonly reception?:SearchContact|null;
 readonly tempo?:unknown;
 readonly combo?:unknown;
}
export interface SearchRally{
 readonly key:string;
 readonly set?:unknown;
 readonly closed?:unknown;
 readonly serving?:unknown;
 readonly winner?:unknown;
 readonly ownRotation?:unknown;
 readonly rivalRotation?:unknown;
 readonly contacts:readonly SearchContact[];
}
export interface SearchData{
 readonly matchId?:unknown;
 readonly rallies?:readonly SearchRally[];
 readonly chains?:readonly SearchChain[];
}
export interface SearchFilters extends Readonly<Record<string,unknown>>{
 readonly team?:unknown;
 readonly set?:unknown;
 readonly rotation?:unknown;
 readonly phase?:unknown;
}
export type SearchFilterKey='code'|'skill'|'player'|'evaluation'|'ownRotation'|'rivalRotation'|'reception'|
 'setter'|'attacker'|'tempo'|'combo'|'startZone'|'endZone'|'outcome'|'video'|'status';
export const SEARCH_FILTERS:readonly SearchFilterKey[]=Object.freeze(['code','skill','player','evaluation',
 'ownRotation','rivalRotation','reception','setter','attacker','tempo','combo',
 'startZone','endZone','outcome','video','status']);

export interface SearchStatistics{
 readonly rallies:number;
 readonly contacts:number;
 readonly chains:number;
 readonly videoContacts:number;
 readonly missingEvaluation:number;
 readonly attackRated:number;
 readonly kills:number;
 readonly errors:number;
 readonly blocked:number;
 readonly efficiency:number|null;
 readonly bySkill:readonly (readonly [string,number])[];
 readonly byPlayer:readonly (readonly [string,number])[];
}
export interface SearchResult{
 readonly rallies:readonly SearchRally[];
 readonly contacts:readonly SearchContact[];
 readonly chains:readonly SearchChain[];
 readonly statistics:SearchStatistics;
 readonly filters:Readonly<Record<SearchFilterKey,string>>;
 readonly target:'ours'|'opponent'|null;
 readonly matchId:string;
}
const val=(x:unknown):string=>String(x??'').trim();
const arr=<T>(x:readonly T[]|undefined|null):readonly T[]=>Array.isArray(x)?x:[];
const lc=(x:unknown):string=>val(x).toLocaleLowerCase('es');
const validTeam=(x:unknown):'ours'|'opponent'|null=>x==='ours'||x==='opponent'?x:null;
export function normalizeRallySearchFilters(filters:Readonly<Record<string,unknown>>|null|undefined):Readonly<Record<SearchFilterKey,string>>{
 const f=filters||{};
 return Object.fromEntries(SEARCH_FILTERS.map(key=>[key,val(f[key]).slice(0,key==='code'?100:80)])) as Record<SearchFilterKey,string>;
}

/** Same semantics as legacy V19.3.9, with explicitly typed input/output. */
export function queryRallies(data:SearchData|null|undefined,filters:SearchFilters={}):SearchResult{
 const f=normalizeRallySearchFilters(filters),target=validTeam(filters.team),set=val(filters.set),
  rotation=val(filters.rotation),phase=val(filters.phase).toUpperCase();
 const code=lc(f.code),actionRequired=!!(code||f.skill||f.player||f.evaluation||f.startZone||f.endZone||f.video);
 const chainRequired=!!(f.setter||f.attacker||f.tempo||f.combo);
 const sequenceRequired=chainRequired||!!f.reception;
 const selectedRallies:SearchRally[]=[],contactByKey=new Map<string,SearchContact>(),chainByKey=new Map<string,SearchChain>();
 const chainsByRally=new Map<string,SearchChain[]>();
 for(const chain of arr(data?.chains)){
  if(!chainsByRally.has(chain.rallyKey))chainsByRally.set(chain.rallyKey,[]);
  chainsByRally.get(chain.rallyKey)!.push(chain);
 }
 const checkContact=(c:SearchContact)=>c&&(!target||c.team===target)&&(!f.skill||c.skill===f.skill)&&
  (!f.evaluation||c.evaluation===f.evaluation)&&(!f.player||lc(c.player)===lc(f.player))&&
  (!code||[c.code,c.skillRaw,c.fields?.attackCode,c.fields?.specialCode,c.fields?.startZone?.code,
   c.fields?.endZone?.code,c.fields?.setTarget?.code,c.fields?.contactZone?.code,c.fields?.combo,
   c.fields?.direction].some(value=>lc(value).includes(code)))&&
  (!f.startZone||c.fields?.startZone?.code===f.startZone.toUpperCase().replace(/^([^Z])/,'Z$1'))&&
  (!f.endZone||c.fields?.endZone?.code===f.endZone.toUpperCase().replace(/^([^Z])/,'Z$1'))&&
  (!f.video||(f.video==='yes'?!!c.video:!c.video));
 const chainMatches=(c:SearchChain)=>c&&(!target||c.team===target)&&
  (!f.setter||lc(c.setter?.player)===lc(f.setter))&&
  (!f.attacker||lc(c.attack?.player)===lc(f.attacker))&&
  (!f.tempo||lc(c.tempo||c.attack?.fields?.attackTempo)===lc(f.tempo))&&
  (!f.combo||lc(c.combo)===lc(f.combo))&&
  (!f.reception||c.reception?.evaluation===f.reception);
 for(const rally of arr(data?.rallies)){
  if(f.status!=='all'&&((f.status==='open')!==!rally.closed))continue;
  if(set&&String(rally.set)!==set)continue;
  if(f.ownRotation&&String(rally.ownRotation||'')!==f.ownRotation)continue;
  if(f.rivalRotation&&String(rally.rivalRotation||'')!==f.rivalRotation)continue;
  if(rotation&&String((target==='opponent'?rally.rivalRotation:rally.ownRotation)||'')!==rotation)continue;
  if(phase){
   if(!target||!rally.serving)continue;
   const actual=rally.serving===target?'K2':'K1';
   if(actual!==phase)continue;
  }
  if(f.outcome&&rally.winner!==f.outcome)continue;
  const inTeam=rally.contacts.filter(c=>!target||c.team===target);
  const matchedChains=(chainsByRally.get(rally.key)||[]).filter(chainMatches);
  let candidates:SearchContact[];
  if(sequenceRequired){
   const allowedKeys=new Set<string>();
   for(const chain of matchedChains)for(const contact of [chain.reception,chain.setter,chain.attack])
    if(contact)allowedKeys.add(contact.key);
   if(f.reception&&!chainRequired)for(const c of inTeam)
    if(c.skill==='R'&&c.evaluation===f.reception)allowedKeys.add(c.key);
   const possessionKeys=new Set(matchedChains.map(c=>c.possessionKey));
   if(f.reception&&!chainRequired)for(const c of inTeam)
    if(c.skill==='R'&&c.evaluation===f.reception&&c.possessionKey)possessionKeys.add(c.possessionKey);
   candidates=inTeam.filter(c=>possessionKeys.has(c.possessionKey)&&(!actionRequired||checkContact(c))&&
    (!actionRequired||!f.skill||allowedKeys.has(c.key)));
   if(!actionRequired)candidates=inTeam.filter(c=>allowedKeys.has(c.key));
  }else candidates=inTeam.filter(checkContact);
  if((actionRequired||sequenceRequired)&&!candidates.length)continue;
  selectedRallies.push(rally);
  for(const c of candidates)contactByKey.set(c.key,c);
  for(const chain of matchedChains)
   if(!actionRequired||candidates.some(c=>c.possessionKey&&c.possessionKey===chain.possessionKey))
    chainByKey.set(chain.key,chain);
 }
 const contacts=[...contactByKey.values()],chains=[...chainByKey.values()];
 const bySkill=new Map<string,number>(),byPlayer=new Map<string,number>();
 for(const c of contacts){
  const skill=val(c.skill)||'?',player=val(c.player)||'Sin identificar';
  bySkill.set(skill,(bySkill.get(skill)||0)+1);
  byPlayer.set(player,(byPlayer.get(player)||0)+1);
 }
 const ratedAttacks=contacts.filter(c=>c.skill==='A'&&c.evaluation),
  kills=ratedAttacks.filter(c=>c.evaluation==='#').length,
  errors=ratedAttacks.filter(c=>c.evaluation==='=').length,
  blocked=ratedAttacks.filter(c=>c.evaluation==='/').length;
 const efficiency=ratedAttacks.length?Math.round((kills-errors-blocked)/ratedAttacks.length*1000)/10:null;
 const statistics:SearchStatistics={
  rallies:selectedRallies.length,contacts:contacts.length,chains:chains.length,
  videoContacts:contacts.filter(c=>c.video).length,
  missingEvaluation:contacts.filter(c=>!c.evaluation).length,
  attackRated:ratedAttacks.length,kills,errors,blocked,efficiency,
  bySkill:[...bySkill].sort((a,b)=>b[1]-a[1]),
  byPlayer:[...byPlayer].sort((a,b)=>b[1]-a[1])
 };
 return {rallies:selectedRallies,contacts,chains,statistics,filters:f,target,matchId:val(data?.matchId)};
}
