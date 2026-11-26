/* V20.5.72 · Separate experimental training mirror.
 * Opt-in per session, one writer per browser origin, never feeds club state.
 */
import {planTrainingShadow,writeTrainingShadow,inspectTrainingShadow,
 deleteTrainingShadow,type TrainingCheck} from './training-shadow';
import {prepareTrainingShadowBackup,type TrainingBackupResult} from './training-shadow-backup';
import {TRAINING_COLD_REOPEN_KEY,prepareTrainingColdReopen,
 verifyTrainingColdReopen,type TrainingColdResult} from './training-shadow-cold-recovery';
import {tryAcquirePlayerShadowLock,type ShadowLease,type ShadowLockPort} from './player-shadow-lock';

export const TRAINING_SHADOW_LOCK='volley-coach-training-shadow-20.5.72';
const MAIN_KEY='volleyCoachStateV43';
type TrainingWindow=Window&{
 VC_STORAGE_QUOTA_1531?:{unpack?:(packed:string)=>string};
 VC_TRAINING_SHADOW_20572?:Readonly<TrainingShadowAPI>;
};
export interface TrainingShadowAPI{
 readonly VERSION:'20.5.72';readonly manualOnly:true;readonly authoritative:false;
 readonly enabled:()=>boolean;readonly arm:()=>Promise<void>;
 readonly pause:()=>void;readonly onConfirmedWrite:(raw:string)=>void;
 readonly inspect:()=>Promise<TrainingCheck>;readonly erase:()=>Promise<true>;
 readonly backup:()=>Promise<TrainingBackupResult>;
 readonly prepareCold:()=>Promise<void>;readonly verifyCold:()=>Promise<TrainingColdResult>;
 readonly cancelCold:()=>Promise<void>;
 readonly whenIdle:()=>Promise<void>;readonly dispose:()=>void;
}
const mounted=new WeakMap<Window,Readonly<TrainingShadowAPI>>();
let serial=0;
const revision=()=>`training-${Date.now().toString(36)}-${(++serial).toString(36)}`;

export function mountTrainingShadowPanel(win:TrainingWindow):Readonly<TrainingShadowAPI>|null{
 const doc=win.document;
 const armButton=doc?.getElementById('vc20572-arm-training') as HTMLButtonElement|null;
 const pauseButton=doc?.getElementById('vc20572-pause-training') as HTMLButtonElement|null;
 const checkButton=doc?.getElementById('vc20572-check-training') as HTMLButtonElement|null;
 const eraseButton=doc?.getElementById('vc20572-erase-training') as HTMLButtonElement|null;
 const backupButton=doc?.getElementById('vc20573-export-training') as HTMLButtonElement|null;
 const backupStatus=doc?.getElementById('vc20573-export-status');
 const prepareColdButton=doc?.getElementById('vc20574-prepare-training-cold') as HTMLButtonElement|null;
 const verifyColdButton=doc?.getElementById('vc20574-verify-training-cold') as HTMLButtonElement|null;
 const cancelColdButton=doc?.getElementById('vc20574-cancel-training-cold') as HTMLButtonElement|null;
 const coldStatus=doc?.getElementById('vc20574-training-cold-status');
 const status=doc?.getElementById('vc20572-training-status');
 if(!armButton||!pauseButton||!checkButton||!eraseButton||!status)return null;
 const earlier=mounted.get(win);if(earlier)return earlier;
 let available=false;
 try{available=typeof win.indexedDB?.open==='function'&&
  typeof win.indexedDB?.deleteDatabase==='function'&&
  typeof win.localStorage?.getItem==='function'}catch(_){/* storage disabled */}
 const locks=win.navigator?.locks as unknown as ShadowLockPort|undefined;
 const canWrite=available&&typeof locks?.request==='function';
 const canCold=canWrite&&typeof win.crypto?.subtle?.digest==='function'&&
  typeof win.localStorage?.setItem==='function'&&typeof win.localStorage?.removeItem==='function';
 let active=false,arming=false,processing=false,scheduled=false,disposed=false,backupBusy=false,coldBusy=false;
 let lease:ShadowLease|null=null,releasing:Promise<void>|null=null;
 let queued:string|null=null,ongoing:Promise<void>|null=null;
 const show=(message:string)=>{if(!disposed)status.textContent=message};
 const showBackup=(message:string)=>{if(!disposed&&backupStatus)backupStatus.textContent=message;show(message)};
 const showCold=(message:string)=>{if(!disposed&&coldStatus)coldStatus.textContent=message;show(message)};
 const coldTicket=()=>{try{return win.localStorage.getItem(TRAINING_COLD_REOPEN_KEY)}catch(_){return null}};
 const update=()=>{
  armButton.disabled=!canWrite||active||arming||backupBusy||coldBusy||!!lease||!!releasing||disposed;
  pauseButton.disabled=!active||disposed;
  checkButton.disabled=!available||disposed||backupBusy||coldBusy;
  eraseButton.disabled=!canWrite||disposed||backupBusy||coldBusy;
  if(backupButton)backupButton.disabled=!canWrite||disposed||backupBusy||coldBusy||arming;
  const coldLocked=!canCold||disposed||coldBusy||backupBusy||arming;
  if(prepareColdButton)prepareColdButton.disabled=coldLocked||!!coldTicket();
  if(verifyColdButton)verifyColdButton.disabled=coldLocked||!coldTicket();
  if(cancelColdButton)cancelColdButton.disabled=coldLocked||!coldTicket();
 };
 const readRaw=()=>{
  const stored=win.localStorage.getItem(MAIN_KEY);
  if(!stored)throw Error('No existe un guardado local confirmado');
  if(stored.startsWith('VC-LZW16-1:')){
   const unpack=win.VC_STORAGE_QUOTA_1531?.unpack;
   if(typeof unpack!=='function')throw Error('No se puede verificar el estado compacto');
   return unpack(stored);
  }
  return stored;
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
   if(held)await held.released;
   releasing=null;update();
  })();return releasing;
 };
 const whenIdle=async()=>{await whenWritesSettled();if(releasing)await releasing};
 const pause=()=>{
  active=false;arming=false;queued=null;update();void releaseAfterIdle();
  show(processing?'Copia detenida. La operación ya iniciada finalizará antes de liberar el bloqueo.':
   'Copia de entrenamientos desactivada. El guardado original continúa activo.');
 };
 const drain=async()=>{
  if(processing||disposed||!active)return;
  processing=true;
  try{
   while(active&&queued!==null){
    const raw=queued;queued=null;
    if(readRaw()!==raw)throw Error('El club cambió antes de escribir');
    const plan=planTrainingShadow(raw,revision());
    if(!plan.complete)throw Error(`Entrenamientos sin identidad: ${plan.pendingIds}`);
    const receipt=await writeTrainingShadow({factory:win.indexedDB,plan});
    if(readRaw()!==raw)throw Error('El club cambió durante la comparación');
    show(`Copia verificada: ${receipt.records} registros de entrenamiento; ${receipt.added} nuevos, ${receipt.changed} modificados, ${receipt.removed} eliminados de la réplica. El club original no cambia.`);
   }
  }catch(_){
   active=false;queued=null;
   show('Copia detenida: IDs ausentes o duplicados, datos modificados o fallo de IndexedDB. No se ha modificado el club. Comprueba el guardado principal antes de continuar.');
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
   pause();show('Copia detenida: guardado principal fuera de los límites de ensayo.');return;
  }
  queued=raw;schedule();
 };
 const arm=async()=>{
  if(!canWrite||disposed||active||arming||lease||releasing||backupBusy||coldBusy)
   throw Error('Copia de entrenamientos no disponible o bloqueada');
  const raw=readRaw(),preview=planTrainingShadow(raw,revision());
  if(!preview.complete)throw Error(`Hay ${preview.pendingIds} entrenamientos con IDs pendientes`);
  arming=true;update();
  try{
   const acquired=await tryAcquirePlayerShadowLock(locks,TRAINING_SHADOW_LOCK);
   if(!acquired)throw Error('Otra pestaña usa la copia de entrenamientos');
   if(disposed||!arming){acquired.release();await acquired.released;return}
   lease=acquired;
   if(readRaw()!==raw)throw Error('El club cambió mientras se solicitaba el bloqueo');
   active=true;
   show('Guardando entrenamientos en paralelo. Solo lectura para la aplicación.');
   onConfirmedWrite(raw);
  }catch(error){
   active=false;queued=null;
   if(lease){const held=lease;lease=null;held.release();await held.released}
   throw error;
  }finally{arming=false;update()}
 };
 const inspect=async()=>{
  if(!available||disposed||backupBusy||coldBusy)throw Error('Inspección no disponible');
  await whenWritesSettled();
  const raw=readRaw(),plan=planTrainingShadow(raw,revision());
  const result=await inspectTrainingShadow({factory:win.indexedDB,plan});
  if(readRaw()!==raw){show('El club cambió durante la lectura: repite la prueba.');
   return Object.freeze({...result,status:'different' as const})}
  const descriptions={verified:`Coinciden ${result.records} registros con el último guardado local; no implica sincronización entre dispositivos.`,
   missing:'Todavía no existe réplica de entrenamientos.',
   different:'La réplica y los entrenamientos guardados no coinciden. No se restauró nada.',
   incomplete:`Hay ${result.pendingIds} registros sin identidad fiable; no se escribió ni certificó la réplica.`};
  show(descriptions[result.status]);return result;
 };
 const erase=async()=>{
  if(!canWrite||disposed||backupBusy||coldBusy)throw Error('Borrado no disponible');
  pause();await whenIdle();
  const exclusive=await tryAcquirePlayerShadowLock(locks,TRAINING_SHADOW_LOCK);
  if(!exclusive)throw Error('Otra pestaña tiene activada la réplica');
  try{const result=await deleteTrainingShadow(win.indexedDB);
   show('Eliminada solo la réplica de entrenamientos. El club original, el vídeo y el scouting siguen intactos.');
   return result;
  }finally{exclusive.release();await exclusive.released}
 };
 const backup=async():Promise<TrainingBackupResult>=>{
  if(!canWrite||disposed||backupBusy||arming||coldBusy)throw Error('Exportación no disponible');
  backupBusy=true;update();
  try{
   pause();await whenIdle();
   const exclusive=await tryAcquirePlayerShadowLock(locks,TRAINING_SHADOW_LOCK);
   if(!exclusive)throw Error('Otra pestaña tiene activada la copia de entrenamientos');
   try{
    const raw=readRaw(),plan=planTrainingShadow(raw,revision());
    const result=await prepareTrainingShadowBackup({factory:win.indexedDB,
     plan,originalRaw:raw});
    if(readRaw()!==raw){
     showBackup('El club original cambió durante la reconstrucción: se ha cancelado la descarga.');
     return Object.freeze({...result,status:'different' as const,json:undefined});
    }
    const messages={
     ready:`Exportación verificada: ${result.records} registros de entrenamiento coinciden exactamente con el último guardado local. La descarga no modifica el club.`,
     missing:'No existe réplica de entrenamientos para exportar. Actívala y compruébala primero.',
     different:'La réplica o su orden difieren del guardado principal. No se permite descargar datos antiguos.',
     incomplete:`Exportación bloqueada: ${result.pendingIds} registros sin identidad estable. No se inventan IDs.`,
     incompatible:'No se pudo reconstruir de forma íntegra la copia: datos o estructura incompatibles.'};
    showBackup(messages[result.status]);return result;
   }finally{exclusive.release();await exclusive.released}
  }finally{backupBusy=false;update()}
 };
 const prepareCold=async()=>{
  if(!canCold||disposed||coldBusy||backupBusy||arming||coldTicket())
   throw Error('Prueba pendiente o no disponible');
  coldBusy=true;update();
  try{
   pause();await whenIdle();
   const exclusive=await tryAcquirePlayerShadowLock(locks,TRAINING_SHADOW_LOCK);
   if(!exclusive)throw Error('Otra pestaña utiliza la réplica de entrenamientos');
   try{
    const raw=readRaw(),ticket=await prepareTrainingColdReopen({raw,
     factory:win.indexedDB,subtle:win.crypto.subtle,now:Date.now()});
    if(readRaw()!==raw)throw Error('El club cambió durante la comprobación');
    if(coldTicket())throw Error('Ya existe otra prueba pendiente');
    win.localStorage.setItem(TRAINING_COLD_REOPEN_KEY,ticket);
    showCold('Prueba preparada. Cierra todas las pestañas y vuelve a abrir Volley Coach; después pulsa «Verificar». El marcador no contiene entrenamientos.');
   }finally{exclusive.release();await exclusive.released}
  }finally{coldBusy=false;update()}
 };
 const verifyCold=async():Promise<TrainingColdResult>=>{
  if(!canCold||disposed||coldBusy||backupBusy||arming||!coldTicket())
   throw Error('No existe una prueba pendiente');
  coldBusy=true;update();
  try{
   pause();await whenIdle();
   const exclusive=await tryAcquirePlayerShadowLock(locks,TRAINING_SHADOW_LOCK);
   if(!exclusive)throw Error('Otra pestaña utiliza la réplica; se conserva el marcador');
   try{
    const ticket=coldTicket();if(!ticket)throw Error('Desapareció la prueba pendiente');
    const raw=readRaw();let result=await verifyTrainingColdReopen({ticket,raw,
     factory:win.indexedDB,subtle:win.crypto.subtle,now:Date.now()});
    if(readRaw()!==raw)result=Object.freeze({...result,status:'different' as const});
    if(coldTicket()===ticket)win.localStorage.removeItem(TRAINING_COLD_REOPEN_KEY);
    const messages={
     verified:`Verificación posterior a la reapertura: ${result.records} registros coinciden. No demuestra resistencia a un apagón o cierre forzado.`,
     missing:'No existe ya la réplica de entrenamientos. No se ha restaurado nada.',
     different:'Los entrenamientos del guardado original ya no coinciden. No se ha restaurado nada.',
     incomplete:'La comprobación no puede certificarse: faltan IDs estables.',
     incompatible:'La réplica no puede reconstruirse íntegramente; no se ha restaurado nada.',
     expired:'Marcador caducado. Prepara una prueba nueva.',
     invalid:'Marcador inválido. No se ha modificado el club.'};
    showCold(messages[result.status]);return result;
   }finally{exclusive.release();await exclusive.released}
  }finally{coldBusy=false;update()}
 };
 const cancelCold=async()=>{
  if(!canCold||disposed||coldBusy||backupBusy||arming)throw Error('Cancelación no disponible');
  win.localStorage.removeItem(TRAINING_COLD_REOPEN_KEY);
  showCold('Prueba cancelada: solo se eliminó el marcador. No se borraron entrenamientos ni copias.');
  update();
 };
 const onArm=()=>{
  if(win.confirm('Esta prueba creará una copia local adicional de los entrenamientos. ¿Has descargado antes una copia JSON completa y quieres activarla solo durante esta sesión?'))
   void arm().catch(error=>show(`No se activó la réplica: ${error instanceof Error?error.message:'revisa los IDs y las pestañas'}.`));
 };
 const onPause=()=>pause();
 const onCheck=()=>{void inspect().catch(()=>show('No se pudieron comprobar los entrenamientos. El club no se modificó.'))};
 const onErase=()=>{
  if(win.confirm('¿Eliminar SOLO la base experimental de entrenamientos? El club real y la copia de jugadores no se tocarán.'))
   void erase().catch(()=>show('No se eliminó la réplica. Comprueba que las otras pestañas estén cerradas.'));
 };
 const onBackup=()=>{
  if(!win.confirm('Esta exportación contiene información de sesiones y posibles datos personales de participantes. ¿Descargar una copia JSON verificada y guardarla en un lugar protegido?'))return;
  void backup().then(result=>{
   if(result.status!=='ready'||!result.json)return;
   const blob=new Blob([result.json],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   try{
    const link=doc.createElement('a');link.href=url;
    link.download='Volley_Coach_Entrenamientos_'+new Date().toISOString().slice(0,10)+'.json';
    link.click();
   }finally{setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }).catch(()=>showBackup('La exportación no pudo verificarse. No se ha descargado ni modificado ningún entrenamiento.'));
 };
 const onPrepareCold=()=>{
  if(win.confirm('La prueba guardará solo una huella digital y el número de entrenamientos. ¿Prepararla para verificar tras cerrar y volver a abrir la aplicación?'))
   void prepareCold().catch(error=>showCold(`No se preparó la prueba: ${error instanceof Error?error.message:'fallo al verificar'}.`));
 };
 const onVerifyCold=()=>{void verifyCold().catch(error=>showCold(`Prueba detenida: ${error instanceof Error?error.message:'no se pudo verificar'}. El marcador se conserva si la base estaba bloqueada.`))};
 const onCancelCold=()=>{void cancelCold().catch(()=>showCold('No se pudo cancelar la prueba.'))};
 const onStorage=(event:StorageEvent)=>{
  if(event.key===MAIN_KEY&&(active||arming)){
   pause();show('Copia detenida: otra pestaña modificó el guardado principal. Comprueba antes de reactivarla.');
  }
 };
 const onPageHide=()=>{if(active||arming)pause()};
 armButton.addEventListener('click',onArm);
 pauseButton.addEventListener('click',onPause);
 checkButton.addEventListener('click',onCheck);
 eraseButton.addEventListener('click',onErase);
 backupButton?.addEventListener('click',onBackup);
 prepareColdButton?.addEventListener('click',onPrepareCold);
 verifyColdButton?.addEventListener('click',onVerifyCold);
 cancelColdButton?.addEventListener('click',onCancelCold);
 win.addEventListener?.('storage',onStorage);
 win.addEventListener?.('pagehide',onPageHide);
 const api:Readonly<TrainingShadowAPI>=Object.freeze({VERSION:'20.5.72',manualOnly:true,
  authoritative:false,enabled:()=>active,arm,pause,onConfirmedWrite,inspect,erase,backup,
  prepareCold,verifyCold,cancelCold,whenIdle,
  dispose(){if(disposed)return;pause();disposed=true;
   armButton.removeEventListener('click',onArm);
   pauseButton.removeEventListener('click',onPause);
   checkButton.removeEventListener('click',onCheck);
   eraseButton.removeEventListener('click',onErase);
   backupButton?.removeEventListener('click',onBackup);
   prepareColdButton?.removeEventListener('click',onPrepareCold);
   verifyColdButton?.removeEventListener('click',onVerifyCold);
   cancelColdButton?.removeEventListener('click',onCancelCold);
   win.removeEventListener?.('storage',onStorage);
   win.removeEventListener?.('pagehide',onPageHide);
   update();mounted.delete(win);
   if(win.VC_TRAINING_SHADOW_20572===api)delete win.VC_TRAINING_SHADOW_20572;
  }});
 mounted.set(win,api);win.VC_TRAINING_SHADOW_20572=api;
 show(canWrite?'Réplica de entrenamientos apagada. Requiere IDs únicos y activación manual.':
  'Para escribir la réplica se necesitan IndexedDB y Web Locks. No se activa automáticamente.');
 if(coldStatus)coldStatus.textContent=coldTicket()?
  'Hay una prueba pendiente. Pulsa «Verificar tras volver a abrir» o cancélala.':
  'Sin prueba pendiente. Primero activa, comprueba y prepara la réplica.';
 update();return api;
}
