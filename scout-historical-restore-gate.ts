/* V20.5.78 · Ephemeral, read-only guard across asynchronous history restore.
 * These tickets are NOT stored or logged. The native owner still performs
 * the only match replacement, save, journal and cloud synchronization.
 */
export interface HistoricalRestoreView<Match=unknown>{
 readonly teamKey:unknown;
 readonly activeId:unknown;
 readonly activeMatch:Match|null;
 readonly matches:readonly Match[];
}
export interface HistoricalRestoreTicket<Match=unknown>{
 readonly teamKey:unknown;
 readonly activeId:unknown;
 readonly activeMatch:Match|null;
 readonly matches:readonly Match[];
 readonly signature:string;
}

function serializeMatches(matches:readonly unknown[]):string|null{
 if(!Array.isArray(matches))return null;
 try{
  const json=JSON.stringify(matches);
  return typeof json==='string'?json:null;
 }catch(_){return null}
}

function finishedOrAbsent(activeMatch:unknown):boolean{
 return !activeMatch||
  (typeof activeMatch==='object'&&
   (activeMatch as {status?:unknown}).status==='finished');
}

export function captureHistoricalRestoreTicket<Match>(
 view:HistoricalRestoreView<Match>):Readonly<HistoricalRestoreTicket<Match>>|null{
 if(!finishedOrAbsent(view.activeMatch))return null;
 const signature=serializeMatches(view.matches);
 if(signature===null)return null;
 return Object.freeze({teamKey:view.teamKey,activeId:view.activeId,
  activeMatch:view.activeMatch,matches:view.matches,signature});
}

/** A team switch, selection change or any local history edit invalidates the
 * entire pending restore. Never call the original writer on stale evidence. */
export function isHistoricalRestoreTicketCurrent<Match>(
 ticket:HistoricalRestoreTicket<Match>|null|undefined,
 view:HistoricalRestoreView<Match>):boolean{
 return !!ticket&&finishedOrAbsent(view.activeMatch)&&
  view.teamKey===ticket.teamKey&&view.activeId===ticket.activeId&&
  view.activeMatch===ticket.activeMatch&&view.matches===ticket.matches&&
  serializeMatches(view.matches)===ticket.signature;
}
