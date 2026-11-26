/* V20.5.75 · The first live registration transaction orchestrated by TypeScript.
 * The original parser and action writer are injected by their historical owner.
 * This module NEVER writes a match, scores, cloud, journal or local storage.
 * Parse once, dispatch once, observe once; no retries after uncertain results.
 */
export interface NativeRegistrationPort<Action=unknown>{
 readonly parse:()=>unknown;
 /** Optional to preserve the V20.5.75 contract for older adapters. */
 readonly isCurrent?:()=>boolean;
 readonly push:(action:Action)=>unknown;
 readonly countAfter:()=>number;
 readonly lastAction:()=>Action|undefined;
}
export type NativeRegistrationOutcome<Action=unknown,Match=unknown>=
 | {readonly ok:false;readonly error:unknown;readonly before:number;readonly after:number}
 | {readonly ok:true;readonly before:number;readonly after:number;
    readonly match:Match;readonly action:Action|undefined;readonly raw:string};

/** Exact V8.5.7 native parse→write semantics, without owning the writer. */
export function registerNativeScoutingAction<Action=unknown,Match=unknown>(input:{
 readonly raw:string;readonly match:Match;readonly before:number;
 readonly port:NativeRegistrationPort<Action>;
}):NativeRegistrationOutcome<Action,Match>{
 const {raw,match,before,port}=input;
 const parsed=port.parse() as {readonly error?:unknown;readonly action?:Action}|null|undefined;
 if(parsed?.error||!parsed?.action)
  return {ok:false,error:parsed?.error||'Código no reconocido.',before,after:before};
 if(port.isCurrent&&!port.isCurrent())
  return {ok:false,error:'El partido o set ha cambiado. Vuelve a registrar la acción.',
   before,after:before};
 const pushed=port.push(parsed.action);
 const after=port.countAfter();
 if(pushed===false||after!==before+1)
  return {ok:false,error:'La acción no se ha añadido al rally.',before,after};
 return {ok:true,before,after,match,action:port.lastAction(),
  raw:String(raw).toUpperCase().replace(/\s+/g,'')};
}
