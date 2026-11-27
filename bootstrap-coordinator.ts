/* V20.6.3 · Single ordered Vite startup for the existing Volley Coach engine.
 * This coordinator owns no match state, actions, persistence or media sources.
 * It only prevents duplicate setup when the entry is loaded more than once. */

export type BootstrapPhase='created'|'installing'|'waiting'|'mounting'|'ready'|'failed';
export interface BootstrapDiagnostics{
 readonly version:'20.6.3';
 readonly phase:BootstrapPhase;
 readonly bridgeRuns:number;
 readonly mountRuns:number;
 readonly listenerPending:boolean;
 readonly failures:number;
 readonly lastError:string|null;
}
export interface BootstrapSteps{
 readonly installBridges:()=>void;
 readonly mountUi:()=>void;
}
export interface BootstrapCoordinator{
 readonly VERSION:'20.6.3';
 readonly singleInstance:true;
 readonly nativeWritersPreserved:true;
 readonly start:()=>boolean;
 readonly diagnostics:()=>Readonly<BootstrapDiagnostics>;
}
export type BootstrapWindow=Window&{VC_APP_BOOTSTRAP_2063?:Readonly<BootstrapCoordinator>};
const local=new WeakMap<Window,Readonly<BootstrapCoordinator>>();

const trusted=(v:BootstrapCoordinator|undefined):v is Readonly<BootstrapCoordinator>=>
 !!v&&v.VERSION==='20.6.3'&&v.singleInstance===true&&
 v.nativeWritersPreserved===true&&Object.isFrozen(v)&&
 typeof v.start==='function'&&typeof v.diagnostics==='function';

/** A second entry (even in a separately loaded bundle) reuses the first one. */
export function installBootstrapCoordinator(win:BootstrapWindow,steps:BootstrapSteps):Readonly<BootstrapCoordinator>{
 const shared=win.VC_APP_BOOTSTRAP_2063;
 if(trusted(shared))return shared;
 const old=local.get(win);if(old)return old;
 let phase:BootstrapPhase='created',bridgeRuns=0,mountRuns=0,failures=0;
 let listenerPending=false,lastError:string|null=null;
 const failure=(error:unknown)=>{
  failures++;phase='failed';listenerPending=false;
  lastError=error instanceof Error?error.message:String(error);
 };
 const mount=()=>{
  if(phase!=='waiting'&&phase!=='installing')return;
  listenerPending=false;phase='mounting';mountRuns++;
  try{steps.mountUi();phase='ready';}
  catch(err){failure(err);throw err;}
 };
 const start=()=>{
  if(phase!=='created')return phase==='installing'||phase==='waiting'||phase==='mounting'||phase==='ready';
  phase='installing';bridgeRuns++;
  try{
   steps.installBridges();
   if(win.document.readyState==='loading'){
    phase='waiting';listenerPending=true;
    win.document.addEventListener('DOMContentLoaded',mount,{once:true});
   }else mount();
   return true;
  }catch(err){if(failures===0)failure(err);throw err;}
 };
 const api:Readonly<BootstrapCoordinator>=Object.freeze({
  VERSION:'20.6.3',singleInstance:true,nativeWritersPreserved:true,
  start,diagnostics:()=>Object.freeze({version:'20.6.3' as const,phase,
   bridgeRuns,mountRuns,listenerPending,failures,lastError})
 });
 // Install before invoking any legacy adapter to protect reentrant imports.
 local.set(win,api);win.VC_APP_BOOTSTRAP_2063=api;
 return api;
}
