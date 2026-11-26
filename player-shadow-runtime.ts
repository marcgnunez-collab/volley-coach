/* V20.5.67 · Session-only opt-in player mirror after confirmed original saves.
 * Failed mirror writes NEVER retry or alter the canonical local/cloud writer.
 */
import {planPlayerShadow,writePlayerShadow,inspectPlayerShadow,deletePlayerShadow,
 type PlayerShadowCheck,type PlayerShadowReceipt} from './player-shadow';
import {tryAcquirePlayerShadowLock,type ShadowLease,type ShadowLockPort} from './player-shadow-lock';
import {preparePlayerShadowBackup,type PlayerBackupResult} from './player-shadow-backup';

type PlayerWindow=Window&{
 VC_STORAGE_QUOTA_1531?:{unpack?:(v:string)=>string};
 VC_PLAYER_SHADOW_20567?:Readonly<PlayerShadowAPI>;
};
export interface PlayerShadowAPI{
 readonly VERSION:'20.5.67';readonly manualOnly:true;readonly authoritative:false;
 readonly crossTabSafe:true;
 readonly enabled:()=>boolean;readonly arm:()=>Promise<void>;readonly pause:()=>void;
 readonly onConfirmedWrite:(raw:string)=>void;
 readonly inspect:()=>Promise<PlayerShadowCheck>;
 readonly backup:()=>Promise<PlayerBackupResult>;
 readonly erase:()=>Promise<true>;
 readonly whenIdle:()=>Promise<void>;readonly dispose:()=>void;
}
const mounted=new WeakMap<Window,Readonly<PlayerShadowAPI>>();
let sequence=0;
const revision=()=>`player-shadow-${Date.now().toString(36)}-${(++sequence).toString(36)}`;
const MAIN_KEY='volleyCoachStateV43';

export function mountPlayerShadowPanel(win:PlayerWindow):Readonly<PlayerShadowAPI>|null{
 const doc=win.document;
 const armButton=doc?.getElementById('vc20567-arm-players') as HTMLButtonElement|null;
 const pauseButton=doc?.getElementById('vc20567-pause-players') as HTMLButtonElement|null;
 const checkButton=doc?.getElementById('vc20567-check-players') as HTMLButtonElement|null;
 const eraseButton=doc?.getElementById('vc20567-erase-players') as HTMLButtonElement|null;
 const backupButton=doc?.getElementById('vc20569-download-players') as HTMLButtonElement|null;
 const status=doc?.getElementById('vc20567-player-shadow-status');
 if(!armButton||!pauseButton||!checkButton||!eraseButton||!backupButton||!status)return null;
 const old=mounted.get(win);if(old)return old;
 const available=typeof win.indexedDB?.open==='function'&&
  typeof win.indexedDB?.deleteDatabase==='function'&&!!win.localStorage;
 const locks=win.navigator?.locks as unknown as ShadowLockPort|undefined;
 const canWrite=available&&typeof locks?.request==='function';
 let active=false,arming=false,disposed=false,processing=false,scheduled=false;
 let lease:ShadowLease|null=null,releasing:Promise<void>|null=null;
 let queued:string|null=null,ongoing:Promise<void>|null=null;
 const show=(text:string)=>{if(!disposed)status.textContent=text};
 const update=()=>{
  armButton.disabled=!canWrite||active||arming||!!lease||!!releasing||disposed;
  pauseButton.disabled=!active||disposed;
  checkButton.disabled=!available||disposed;
  eraseButton.disabled=!canWrite||disposed;
  backupButton.disabled=!canWrite||disposed;
 };
 update();
 show(canWrite?'Copia paralela apagada. V20.5.68 protege la sesión con un bloqueo exclusivo entre pestañas.':
  'La copia paralela requiere IndexedDB y Web Locks para impedir escrituras simultáneas. La inspección de solo lectura puede seguir disponible.');

 const readRaw=()=>{
  const stored=win.localStorage.getItem(MAIN_KEY);
  if(!stored)throw Error('No hay un guardado local principal confirmado');
  if(stored.startsWith('VC-LZW16-1:')){
   const unpack=win.VC_STORAGE_QUOTA_1531?.unpack;
   if(typeof unpack!=='function')throw Error('Estado compacto no disponible para lectura');
   return unpack(stored);
  }
  return stored;
 };
 const drain=async()=>{
  if(processing||disposed||!active)return;
  processing=true;
  try{
   while(active&&queued!==null){
    const raw=queued;queued=null;
    const plan=planPlayerShadow(raw,revision());
    if(!plan.complete)throw Error(`IDs pendientes: ${plan.pendingIds}`);
    const receipt:PlayerShadowReceipt=await writePlayerShadow({factory:win.indexedDB,plan});
    show(`Copia paralela verificada: ${receipt.records} jugadores. ${receipt.added} nuevos, ${receipt.changed} actualizados, ${receipt.removed} eliminados de la copia. El guardado original continúa activo.`);
   }
  }catch(_){
   // One failure pauses the experimental writer: never attempt to repair by
   // retrying the canonical storage path, inventing IDs or replaying data.
   active=false;queued=null;
   show('Copia paralela detenida por una incompatibilidad o fallo local. El guardado principal no se ha modificado. Revisa los IDs y la copia JSON.');
  }finally{processing=false;ongoing=null;update();if(!active)void releaseAfterIdle()}
 };
 const schedule=()=>{
  if(scheduled||processing||disposed||!active)return;
  scheduled=true;
  setTimeout(()=>{scheduled=false;if(active&&!disposed)ongoing=drain()},0);
 };
 const onConfirmedWrite=(raw:string)=>{
  if(!active||disposed)return;
  if(typeof raw!=='string'||!raw||raw.length>12000000){
   pause();
   show('Copia paralela pausada: el estado confirmado supera los límites de prueba.');
   return;
  }
  queued=raw;schedule();
 };
 const whenWritesSettled=async()=>{
  while(scheduled||processing||ongoing){
   if(ongoing)await ongoing;
   else await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
 };
 const releaseAfterIdle=()=>{
  if(releasing)return releasing;
  releasing=(async()=>{
   await whenWritesSettled();
   const held=lease;lease=null;held?.release();
   releasing=null;update();
  })();
  return releasing;
 };
 const whenIdle=async()=>{
  await whenWritesSettled();
  if(releasing)await releasing;
 };
 const arm=async()=>{
  if(!canWrite||disposed||active||arming||lease||releasing)
   throw Error('No se puede activar: copia ocupada o bloqueo no disponible');
  // This is the original committed JSON, not mutable editor state.
  const raw=readRaw();
  const preview=planPlayerShadow(raw,revision());
  if(!preview.complete)throw Error(`Hay ${preview.pendingIds} identidades pendientes`);
  arming=true;update();
  try{
   const acquired=await tryAcquirePlayerShadowLock(locks);
   if(!acquired)throw Error('Otra pestaña ya tiene activada la copia paralela');
   if(disposed||!arming){acquired.release();return}
   lease=acquired;active=true;
   show('Copia paralela protegida para esta sesión. Comprobando el último guardado confirmado…');
   onConfirmedWrite(raw);
  }finally{arming=false;update()}
 };
 const pause=()=>{
  active=false;arming=false;queued=null;update();
  void releaseAfterIdle();
  show(processing?'Copia paralela pausada. La transacción ya iniciada finalizará antes de liberar el bloqueo.':
   'Copia paralela desactivada. El bloqueo de esta sesión se ha liberado y el guardado principal sigue activo.');
 };
 const inspect=async()=>{
  if(!available||disposed)throw Error('Inspección de jugadores no disponible');
  const raw=readRaw();
  const plan=planPlayerShadow(raw,revision());
  const result=await inspectPlayerShadow({factory:win.indexedDB,plan});
  if(readRaw()!==raw){
   show('El guardado principal cambió durante la lectura. Repite la comprobación.');
   return Object.freeze({...result,status:'different' as const});
  }
  const descriptions={verified:`Coincidencia de ${result.records} jugadores con el último guardado local. No implica sincronización remota.`,
   missing:'No existe todavía copia paralela de jugadores.',
   different:'La copia paralela y el guardado local no coinciden.',
   incomplete:`Hay ${result.pendingIds} identidades incompletas o duplicadas; no se puede certificar la copia.`};
  show(descriptions[result.status]);return result;
 };
 const erase=async()=>{
  if(!canWrite||disposed)throw Error('Borrado protegido no disponible');
  pause();await whenIdle();
  const exclusive=await tryAcquirePlayerShadowLock(locks);
  if(!exclusive)throw Error('Otra pestaña está usando la copia; no se elimina');
  try{
   const result=await deletePlayerShadow(win.indexedDB);
   show('Se eliminó únicamente la copia paralela de jugadores. El club original no cambió.');
   return result;
  }finally{exclusive.release()}
 };
 const backup=async()=>{
  if(!canWrite||disposed)throw Error('Exportación protegida no disponible');
  pause();await whenIdle();
  const exclusive=await tryAcquirePlayerShadowLock(locks);
  if(!exclusive)throw Error('Otra pestaña tiene activa la copia de jugadores');
  try{
   const raw=readRaw(),plan=planPlayerShadow(raw,revision());
   const result=await preparePlayerShadowBackup({factory:win.indexedDB,plan});
   if(readRaw()!==raw){
    show('El club cambió durante la preparación de la copia. Repite el ensayo.');
    return Object.freeze({...result,status:'different' as const,json:undefined});
   }
   const messages={ready:`Copia comprobada: ${result.records} jugadores. La descarga contiene únicamente las plantillas.`,
    missing:'No existe una copia paralela que se pueda exportar.',
    different:'La copia paralela no coincide con el guardado principal. No se descarga información antigua.',
    incomplete:`La copia está bloqueada por ${result.pendingIds} identidades pendientes.`};
   show(messages[result.status]);return result;
  }finally{exclusive.release()}
 };
 const onArm=()=>{if(win.confirm('La réplica opcional guardará datos de jugadores en este dispositivo. ¿Tienes copia JSON de seguridad y deseas activarla solo para esta sesión?'))
  void arm().catch(()=>show('No se pudo activar: otra pestaña puede estar usando la copia, o hay IDs de jugadores pendientes.'))};
 const onPause=()=>pause();
 const onCheck=()=>{void inspect().catch(()=>show('No se pudo comprobar la copia de jugadores.'))};
 const onErase=()=>{if(win.confirm('¿Eliminar solo la réplica de jugadores V20.5.67? No se borrará el club principal.'))
  void erase().catch(()=>show('No se ha eliminado la copia. Otra pestaña puede estar utilizándola.'))};
 const onBackup=()=>{
  if(!win.confirm('Esta descarga contiene datos personales de jugadores. ¿Quieres crear una copia JSON solo de plantilla, verificada y para guardar en un lugar protegido?'))return;
  void backup().then(found=>{
   if(found.status!=='ready'||!found.json)return;
   const blob=new Blob([found.json],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   try{
    const link=doc.createElement('a');link.href=url;
    link.download='Volley_Coach_Jugadores_'+new Date().toISOString().slice(0,10)+'.json';
    link.click();
   }finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }).catch(()=>show('No se pudo preparar la descarga segura de jugadores. No se modificaron los datos.'));
 };
 const onExternalState=(event:StorageEvent)=>{
  if(event.key===MAIN_KEY&&(active||arming)){
   pause();show('Copia paralela detenida: otra pestaña modificó el guardado principal. Vuelve a comprobar los datos antes de activarla.');
  }
 };
 const onPageHide=()=>{if(active||arming)pause()};
 armButton.addEventListener('click',onArm);pauseButton.addEventListener('click',onPause);
 checkButton.addEventListener('click',onCheck);eraseButton.addEventListener('click',onErase);
 backupButton.addEventListener('click',onBackup);
 win.addEventListener?.('storage',onExternalState);
 win.addEventListener?.('pagehide',onPageHide);
 const api:Readonly<PlayerShadowAPI>=Object.freeze({VERSION:'20.5.67',manualOnly:true,
  authoritative:false,crossTabSafe:true,enabled:()=>active,arm,pause,onConfirmedWrite,inspect,backup,erase,whenIdle,
  dispose(){if(disposed)return;pause();disposed=true;
   armButton.removeEventListener('click',onArm);pauseButton.removeEventListener('click',onPause);
   checkButton.removeEventListener('click',onCheck);eraseButton.removeEventListener('click',onErase);
   backupButton.removeEventListener('click',onBackup);
   win.removeEventListener?.('storage',onExternalState);
   win.removeEventListener?.('pagehide',onPageHide);
   update();mounted.delete(win);
   if(win.VC_PLAYER_SHADOW_20567===api)delete win.VC_PLAYER_SHADOW_20567;
  }});
 mounted.set(win,api);win.VC_PLAYER_SHADOW_20567=api;return api;
}
