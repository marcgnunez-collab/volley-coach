/* V20.5.79 · Synchronous command arbitration around the one historical writer.
 * No score mutations, storage access, timers or second dispatch are permitted. */
export type RallyCommandKind='point'|'undo';
export type RallyWinner='ours'|'opponent';
export interface RallyCommandFrame{
 readonly score:Readonly<{us:number;op:number}>;
 readonly rallies:number;
}
export interface RallyCommandScope<M=unknown,S=unknown>{
 readonly match:M|null;
 readonly set:S|null;
}
export interface NativeRallyCommandPort<M=unknown,S=unknown>{
 current:()=>RallyCommandScope<M,S>;
 dispatch:()=>unknown;
 read:()=>RallyCommandFrame;
}
export interface NativeRallyCommand<M=unknown,S=unknown>{
 readonly kind:RallyCommandKind;
 readonly winner?:RallyWinner;
 readonly expectedMatch:M;
 readonly expectedSet:S;
 readonly before:RallyCommandFrame;
 readonly port:NativeRallyCommandPort<M,S>;
}
export type RallyCommandReason='committed'|'stale-before'|'stale-after'|'invalid'|'native-error'|'unverified';
export interface RallyCommandOutcome{
 readonly ok:boolean;
 readonly dispatched:boolean;
 readonly reason:RallyCommandReason;
 readonly before:RallyCommandFrame;
 readonly after:RallyCommandFrame;
 readonly error?:unknown;
}

function validFrame(frame:RallyCommandFrame):boolean{
 return !!frame&&Number.isSafeInteger(frame.rallies)&&frame.rallies>=0&&
  Number.isSafeInteger(frame.score?.us)&&frame.score.us>=0&&
  Number.isSafeInteger(frame.score?.op)&&frame.score.op>=0;
}
function sameMatch<M,S>(scope:RallyCommandScope<M,S>,command:NativeRallyCommand<M,S>):boolean{
 return !!scope&&scope.match===command.expectedMatch;
}
function verified(before:RallyCommandFrame,after:RallyCommandFrame,kind:RallyCommandKind,winner?:RallyWinner):boolean{
 if(!validFrame(after))return false;
 if(kind==='undo')return after.rallies===before.rallies-1;
 return after.rallies===before.rallies+1&&
  after.score.us===before.score.us+(winner==='ours'?1:0)&&
  after.score.op===before.score.op+(winner==='opponent'?1:0);
}

/** Native dispatch is invoked at most once. Throwing AFTER mutation never triggers a retry. */
export function executeNativeRallyCommand<M,S>(command:NativeRallyCommand<M,S>):RallyCommandOutcome{
 const {before,kind,winner,port}=command;
 const outcome=(reason:RallyCommandReason,dispatched=false,after=before,error?:unknown):RallyCommandOutcome=>
  Object.freeze({ok:reason==='committed',dispatched,reason,before,after,...(error===undefined?{}:{error})});
 if(!validFrame(before)||
  (kind!=='point'&&kind!=='undo')||
  (kind==='point'&&winner!=='ours'&&winner!=='opponent')||
  (kind==='undo'&&before.rallies===0))return outcome('invalid');
 let pre:RallyCommandScope<M,S>;
 try{pre=port.current()}catch(error){return outcome('stale-before',false,before,error)}
 if(!sameMatch(pre,command)||pre.set!==command.expectedSet)return outcome('stale-before');
 let error:unknown;
 try{port.dispatch()}catch(cause){error=cause}
 let after=before;
 try{after=port.read()}catch(cause){return outcome('unverified',true,before,cause)}
 let post:RallyCommandScope<M,S>;
 try{post=port.current()}catch(cause){return outcome('stale-after',true,after,cause)}
 // A valid point can close a set, so the selected set may change while the
 // native chain runs. The match itself must still be the same object.
 if(!sameMatch(post,command))return outcome('stale-after',true,after,error);
 if(verified(before,after,kind,winner))return outcome('committed',true,after,error);
 return outcome(error===undefined?'unverified':'native-error',true,after,error);
}
