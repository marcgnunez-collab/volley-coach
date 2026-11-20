/* V20.5.47 · Pure V8.3/V8.4 action metadata after the native base normalizer.
 * No writes, state lookups, dates, camera or cloud operations.
 */
export interface TacticalActionFields{
 readonly attackDirection:string;
 readonly receivedServeType:string;
 readonly serveType:unknown;
 readonly blockTargetNumber:string;
 readonly blockTargetLabel:string;
}

/** V8.3 direction/reception then V8.4 block target, in the original order. */
export function normalizeTacticalActionFields(input:unknown,normalized:unknown):TacticalActionFields{
 const a=(input||{}) as Record<string,any>;
 const x=normalized as Record<string,any>;
 const attackDirection=['LIN','DC','DL'].includes(String(a?.attackDirection||''))
  ?String(a.attackDirection):'';
 let receivedServeType=['F','JF','JP','U'].includes(String(a?.receivedServeType||''))
  ?String(a.receivedServeType):'';
 if(x.skill==='R'&&!receivedServeType&&['F','JF','JP','U'].includes(String(a?.serveType||'')))
  receivedServeType=String(a.serveType);
 const serveType=x.skill==='R'?'':x.serveType;
 let blockTargetNumber=String(a?.blockTargetNumber||'').replace(/\D/g,'').slice(0,3);
 let blockTargetLabel=String(a?.blockTargetLabel||'');
 if(x.skill!=='B'){blockTargetNumber='';blockTargetLabel='';}
 return {attackDirection,receivedServeType,serveType,blockTargetNumber,blockTargetLabel};
}
