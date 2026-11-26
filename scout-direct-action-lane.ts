/* V20.5.76 · A typed gate for actions assembled by the manual form/court.
 * The historical native writer remains the only owner of state and side effects.
 * Match and set must still be the same objects immediately before dispatch.
 */
export interface NativeDirectActionPort<Action, Match, Set>{
 readonly current:()=>{readonly match:Match|null;readonly set:Set|null;readonly open:boolean};
 readonly push:(action:Action)=>unknown;
}

export function dispatchNativeDirectAction<Action,Match,Set>(input:{
 readonly action:Action;
 readonly expectedMatch:Match|null;
 readonly expectedSet:Set|null;
 readonly port:NativeDirectActionPort<Action,Match,Set>;
}):unknown{
 const {action,expectedMatch,expectedSet,port}=input;
 const current=port.current();
 if(!current.open||!expectedMatch||!expectedSet||
    current.match!==expectedMatch||current.set!==expectedSet)return false;
 return port.push(action);
}
