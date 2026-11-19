/* V20.5.40 · Pure selection of an already looked-up own roster member.
 * It never searches a roster, writes a rally, or stores identifying fields.
 */
export interface OwnPlayerResolution<T>{
 readonly found:boolean;
 readonly fromPreviousAction:boolean;
 readonly player:T|Readonly<{id:unknown;name:unknown;number:string}>|null;
}
export function resolveOwnScoutingPlayer<T>(
 number:string,candidate:T|null|undefined,oldAction:unknown):OwnPlayerResolution<T>{
 if(candidate)return {found:true,fromPreviousAction:false,player:candidate};
 if(oldAction&&typeof oldAction==='object'){
  const old=oldAction as Record<string,unknown>;
  if(String(old.playerNumberSnapshot)===String(number)){
   return {found:true,fromPreviousAction:true,
    player:{id:old.playerId,name:old.playerNameSnapshot,number}};
  }
 }
 return {found:false,fromPreviousAction:false,player:null};
}
