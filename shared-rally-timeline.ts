/* V20.6.2 · Typed, read-only rally traversal shared by effective match UIs.
 * All row records are derived; sets, rallies and actions retain their identity.
 * No timestamps, scores or video positions are synthesized. */
import {asList,asRecord} from '../domain/model';

export interface ClosedRallyReference{
 readonly set:unknown;
 readonly rally:unknown;
 readonly setIndex:number;
 readonly rallyIndex:number;
}
export interface ReviewRallyRow{
 readonly key:string;
 readonly setIndex:number;
 readonly rallyIndex:number;
 readonly setNo:unknown;
 readonly rallyNo:number;
 readonly id:unknown;
 readonly rally:unknown;
 readonly actions:readonly unknown[];
 readonly winner:unknown;
 readonly rotation:unknown;
 readonly before:unknown;
 readonly after:unknown;
}
export interface RecentRallySummary{
 readonly set:number;
 readonly index:number;
 readonly winner:string;
 readonly skill:string;
 readonly code:string;
 readonly actions:number;
}
const list=(v:unknown)=>asList(v);
const str=(v:unknown)=>String(v??'').trim();
const validNumber=(v:unknown)=>v!==''&&v!=null&&Number.isInteger(Number(v))&&Number(v)>0;

/** Identical set order and rally order to native flatMap; never touches storage. */
export function listClosedRallyRefs(matchInput:unknown):readonly ClosedRallyReference[]{
 const sets=list(asRecord(matchInput)?.sets),output:ClosedRallyReference[]=[];
 for(let si=0;si<sets.length;si++){
  if(!(si in sets))continue;
  const set=sets[si],rallies=list(asRecord(set)?.rallies);
  for(let ri=0;ri<rallies.length;ri++){
   if(ri in rallies)output.push({set,rally:rallies[ri],setIndex:si,rallyIndex:ri});
  }
 }
 return output;
}

/** O(number of trailing empty sets), without flattening a full video history. */
export function lastClosedRallyRef(matchInput:unknown):ClosedRallyReference|null{
 const sets=list(asRecord(matchInput)?.sets);
 for(let si=sets.length-1;si>=0;si--){
  if(!(si in sets))continue;
  const set=sets[si],rallies=list(asRecord(set)?.rallies);
  for(let ri=rallies.length-1;ri>=0;ri--){
   if(ri in rallies)return {set,rally:rallies[ri],setIndex:si,rallyIndex:ri};
  }
 }
 return null;
}

/** Source identities only; safe for existing Scouting and Match Mode consumers. */
export function listClosedRallies(matchInput:unknown):readonly unknown[]{
 return listClosedRallyRefs(matchInput).map(item=>item.rally);
}

/** Exactly the source row schema of Rally Review Pro, including missing fields. */
export function projectRallyReviewRows(matchInput:unknown):readonly ReviewRallyRow[]{
 return listClosedRallyRefs(matchInput).map(item=>{
  const set=asRecord(item.set),rally=asRecord(item.rally);
  const {setIndex:si,rallyIndex:ri}=item;
  return {key:`${si}:${ri}:${str(rally?.id??'')}`,setIndex:si,rallyIndex:ri,
   setNo:set?.number??si+1,rallyNo:ri+1,id:rally?.id,rally:item.rally,
   actions:list(rally?.actions),winner:rally?.winner||null,
   rotation:rally?.rotationBefore??null,before:rally?.scoreBefore,after:rally?.scoreAfter};
 });
}

/** The small newest-first preview used by Match Workspace (max five by default). */
export function projectRecentRallies(matchInput:unknown,limit=5):readonly RecentRallySummary[]{
 const sets=list(asRecord(matchInput)?.sets),out:RecentRallySummary[]=[];
 const max=Number.isInteger(limit)&&limit>=0?Math.min(limit,50):5;
 for(let si=sets.length-1;si>=0&&out.length<max;si--){
  const set=asRecord(sets[si]),rallies=list(set?.rallies);
  for(let ri=rallies.length-1;ri>=0&&out.length<max;ri--){
   const rally=asRecord(rallies[ri]);if(!rallies[ri])continue;
   const winner=rally?.winner==='ours'?'Punto propio':rally?.winner==='opponent'?'Punto rival':'Sin resultado';
   const actions=list(rally?.actions),last=asRecord(actions[actions.length-1]);
   out.push({set:validNumber(set?.number)?Number(set?.number):si+1,index:ri+1,
    winner,skill:str(last?.skill)||'',code:str(last?.code)||'',actions:actions.length});
  }
 }
 return out;
}
