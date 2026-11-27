/* V20.5.80 · Production point/undo controller, migrated from the V8.5.7 wrapper.
 * The only score mutation is the one injected historical writer invocation.
 * No DOM, storage, sync, video, scoring algorithm or alternate writer here. */
import {executeNativeRallyCommand,RallyCommandFrame,RallyCommandKind,
 RallyCommandOutcome,RallyWinner} from './scout-rally-command-lane';

export interface LiveRallyMatch{readonly status?:string}
export interface LiveRallySet{readonly finished?:boolean}
export type RallyFeedbackLevel='ok'|'warn'|'bad';
export interface LiveRallyControllerPort<M extends LiveRallyMatch,S extends LiveRallySet>{
 selectedMatch:()=>M|null;
 activeMatch:()=>M|null;
 selectedSet:(match:M)=>S|null;
 activeSet:(match:M)=>S|null;
 score:(set:S)=>Readonly<{us:number;op:number}>;
 rallies:(set:S)=>number;
 nativePoint:(winner:RallyWinner)=>unknown;
 nativeUndo:()=>unknown;
 status:(message:string,level:RallyFeedbackLevel)=>void;
 refresh:()=>void;
 scheduleUnlock:(callback:()=>void)=>void;
 logError:(...args:unknown[])=>void;
}
export type RallyControllerReason='idle'|'busy'|'no-open-set'|'no-scouting'|
 'nothing-to-undo'|'controller-error'|RallyCommandOutcome['reason'];
export interface RallyControllerDiagnostics{
 readonly pointAttempts:number;
 readonly undoAttempts:number;
 readonly nativeDispatches:number;
 readonly committed:number;
 readonly rejected:number;
 readonly busyRejected:number;
 readonly lastReason:RallyControllerReason;
 readonly pointBusy:boolean;
 readonly undoBusy:boolean;
}
export interface LiveRallyController{
 readonly awardPoint:(winner:string)=>boolean;
 readonly undoRally:()=>boolean;
 readonly diagnostics:()=>Readonly<RallyControllerDiagnostics>;
}

export function createLiveRallyController<M extends LiveRallyMatch,S extends LiveRallySet>(
 port:LiveRallyControllerPort<M,S>):Readonly<LiveRallyController>{
 let pointBusy=false,undoBusy=false,pointAttempts=0,undoAttempts=0;
 let nativeDispatches=0,committed=0,rejected=0,busyRejected=0;
 let lastReason:RallyControllerReason='idle';

 function feedback(message:string,level:RallyFeedbackLevel):void{
  try{port.status(message,level)}catch(error){port.logError('V20.5.80 status failed',error)}
 }
 function refresh():void{
  try{port.refresh()}catch(error){port.logError('V20.5.80 refresh failed',error)}
 }
 function reject(reason:RallyControllerReason,message:string,level:RallyFeedbackLevel,rerender=false):false{
  lastReason=reason;rejected++;feedback(message,level);
  if(rerender)refresh();
  return false;
 }
 function perform(kind:RallyCommandKind,winner:RallyWinner='ours'):boolean{
  if(kind==='point')pointAttempts++;else undoAttempts++;
  if(kind==='point'?pointBusy:undoBusy){
   lastReason='busy';busyRejected++;rejected++;return false;
  }
  if(kind==='point')pointBusy=true;else undoBusy=true;
  try{
   const match=port.selectedMatch();
   const set=match?port.selectedSet(match):null;
   if(kind==='point'&&(!match||!set||match.status==='finished'||set.finished))
    return reject('no-open-set','No hay un set abierto para añadir el punto.','warn');
   if(!match||!set)return reject('no-scouting','No hay un scouting activo.','bad');
   const before:RallyCommandFrame={score:port.score(set),rallies:port.rallies(set)};
   if(kind==='undo'&&before.rallies===0)
    return reject('nothing-to-undo','No hay rallies cerrados para deshacer.','warn');
   const result=executeNativeRallyCommand({
    kind,winner,expectedMatch:match,expectedSet:set,before,
    port:{
     current:()=>({match:port.activeMatch(),set:port.activeSet(match)}),
     dispatch:()=>{
      nativeDispatches++;
      return kind==='point'?port.nativePoint(winner):port.nativeUndo();
     },
     read:()=>({score:port.score(set),rallies:port.rallies(set)})
    }
   });
   if(!result.ok){
    port.logError('V20.5.80 rally command failed',result.reason,result.error,
     {kind,before,after:result.after,dispatched:result.dispatched});
    const stale=result.reason==='stale-before';
    return reject(result.reason,stale?'El partido o set ha cambiado; no se ejecutó la orden.':
     kind==='point'?'No se ha podido guardar el punto correctamente. No se hará un segundo intento automático.':
      'No se ha podido deshacer el rally correctamente. No se hará un segundo intento automático.',
     stale?'warn':'bad',true);
   }
   committed++;lastReason='committed';
   if(kind==='point')feedback(`✓ Punto guardado ${result.after.score.us}-${result.after.score.op} · rally ${result.after.rallies}.`,'ok');
   else feedback(`↶ Rally deshecho · ${before.score.us}-${before.score.op} → ${result.after.score.us}-${result.after.score.op}.`,'ok');
   refresh();
   return true;
  }catch(error){
   port.logError('V20.5.80 controller exception',kind,error);
   return reject('controller-error',kind==='point'?
    'No se ha podido procesar el punto. No se hará un segundo intento automático.':
    'No se ha podido procesar Deshacer. No se hará un segundo intento automático.','bad',true);
  }finally{
   const unlock=()=>{if(kind==='point')pointBusy=false;else undoBusy=false};
   try{port.scheduleUnlock(unlock)}catch(error){
    port.logError('V20.5.80 command cooldown failed',error);unlock();
   }
  }
 }
 return Object.freeze({
  awardPoint:(winner:string)=>perform('point',winner==='opponent'?'opponent':'ours'),
  undoRally:()=>perform('undo'),
  diagnostics:()=>Object.freeze({pointAttempts,undoAttempts,nativeDispatches,
   committed,rejected,busyRejected,lastReason,pointBusy,undoBusy})
 });
}
