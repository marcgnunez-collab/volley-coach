/* V20.5.68 · Fail-closed Web Locks guard for the non-authoritative player replica.
 * A lock is held for the whole opt-in session and released after in-flight work.
 */
export const PLAYER_SHADOW_LOCK='volley-coach-players-shadow-20.5.68';
export interface ShadowLockPort{
 request:(name:string,options:{mode:'exclusive';ifAvailable:true},
  callback:(lock:unknown|null)=>Promise<void>)=>Promise<unknown>;
}
export interface ShadowLease{
 readonly release:()=>void;
 /** Settles only after the browser's lock-request callback has finished. */
 readonly released:Promise<void>;
}

/** Returns null immediately if a competing tab owns the lock. Never queues. */
export function tryAcquirePlayerShadowLock(locks:ShadowLockPort|undefined,
 name=PLAYER_SHADOW_LOCK):Promise<ShadowLease|null>{
 if(!locks||typeof locks.request!=='function')
  return Promise.reject(Error('El navegador no ofrece bloqueo seguro entre pestañas'));
 return new Promise((resolve,reject)=>{
  let finished=false;
  const succeed=(lease:ShadowLease|null)=>{if(!finished){finished=true;resolve(lease)}};
  const fail=(error:unknown)=>{if(!finished){finished=true;reject(error)}};
  let markReleased:()=>void=()=>{};
  const releasedPromise=new Promise<void>(resolveDone=>{markReleased=resolveDone});
  try{
   void Promise.resolve(locks.request(name,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock){succeed(null);return}
    let unlock:()=>void=()=>{};
    const held=new Promise<void>(done=>{unlock=done});
    let released=false;
    succeed(Object.freeze({release:()=>{if(!released){released=true;unlock()}},
     released:releasedPromise}));
    await held;
   })).then(markReleased,error=>{markReleased();fail(error)});
  }catch(error){fail(error)}
 });
}
