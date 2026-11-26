/* V20.5.67 · Session-only opt-in player mirror after confirmed original saves.
 * Failed mirror writes NEVER retry or alter the canonical local/cloud writer.
 */
import {planPlayerShadow,writePlayerShadow,inspectPlayerShadow,deletePlayerShadow,
 type PlayerShadowCheck,type PlayerShadowReceipt} from './player-shadow';
import {tryAcquirePlayerShadowLock,type ShadowLease,type ShadowLockPort} from './player-shadow-lock';
import {preparePlayerShadowBackup,type PlayerBackupResult} from './player-shadow-backup';
import {PLAYER_REOPEN_TICKET_KEY,preparePlayerReopenTicket,
 verifyPlayerReopenTicket,type PlayerReopenResult} from './player-shadow-reopen';

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
 readonly reopen:()=>Promise<void>;
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
 const reopenButton=doc?.getElementById('vc20570-reopen-players') as HTMLButtonElement|null;
 const reopenStatus=doc?.getElementById('vc20570-reopen-status');
 const status=doc?.getElementById('vc20567-player-shadow-status');
 if(!armButton||!pauseButton||!checkButton||!eraseButton||!backupButton||!reopenButton||!reopenStatus||!status)return null;
 const old=mounted.get(win);if(old)return old;
 const available=typeof win.indexedDB?.open==='function'&&
  typeof win.indexedDB?.deleteDatabase==='function'&&!!win.localStorage;
 const locks=win.navigator?.locks as unknown as ShadowLockPort|undefined;
 const canWrite=available&&typeof locks?.request==='function';
 let hasSession=false;
 try{hasSession=typeof win.sessionStorage?.getItem==='function'&&
  typeof win.sessionStorage?.setItem==='function'&&
  typeof win.sessionStorage?.removeItem==='function'}catch(_){/* disabled */}
 const canReopen=canWrite&&typeof win.crypto?.subtle?.digest==='function'&&
  typeof win.location?.reload==='function'&&hasSession;
 let active=false,arming=false,disposed=false,processing=false,scheduled=false;
 let reopening=false,recovering=false;
 let lease:ShadowLease|null=null,releasing:Promise<void>|null=null;
 let queued:string|null=null,ongoing:Promise<void>|null=null;
 const show=(text:string)=>{if(!disposed)status.textContent=text};
 const showReopen=(text:string)=>{if(!disposed)reopenStatus.textContent=text;show(text)};
 const update=()=>{
  armButton.disabled=!canWrite||active||arming||!!lease||!!releasing||disposed||reopening||recovering;
  pauseButton.disabled=!active||disposed;
  checkButton.disabled=!available||disposed||reopening||recovering;
  eraseButton.disabled=!canWrite||disposed||reopening||recovering;
  backupButton.disabled=!canWrite||disposed||reopening||recovering;
  reopenButton.disabled=!canReopen||disposed||reopening||recovering;
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
   if(held)await held.released;
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
  }finally{exclusive.release();await exclusive.released}
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
  }finally{exclusive.release();await exclusive.released}
 };
 const reopen=async()=>{
  if(!canReopen||disposed||reopening||recovering)throw Error('Prueba de reapertura no disponible');
  reopening=true;update();
  try{
   pause();await whenIdle();
   const exclusive=await tryAcquirePlayerShadowLock(locks);
   if(!exclusive)throw Error('Hay otra pestaña con la copia activa');
   try{
    const raw=readRaw();
    const ticket=await preparePlayerReopenTicket({raw,factory:win.indexedDB,
     subtle:win.crypto.subtle,now:Date.now()});
    if(readRaw()!==raw)throw Error('El club cambió durante la comprobación');
    // sessionStorage is tab-scoped and contains no players, videos or club JSON.
    win.sessionStorage.setItem(PLAYER_REOPEN_TICKET_KEY,ticket);
   }finally{exclusive.release();await exclusive.released}
   showReopen('Copia verificada antes de recargar. Comenzando la prueba de reapertura…');
   try{win.location.reload()}catch(error){
    win.sessionStorage.removeItem(PLAYER_REOPEN_TICKET_KEY);throw error;
   }
  }finally{reopening=false;update()}
 };
 const resumeReopen=async(ticket:string)=>{
  recovering=true;update();
  showReopen('Volviendo a abrir la copia de jugadores desde IndexedDB…');
  try{
   if(!canReopen)throw Error('El navegador no permite verificar esta reapertura');
   const exclusive=await tryAcquirePlayerShadowLock(locks);
   if(!exclusive)throw Error('Otra pestaña mantiene el bloqueo; la reapertura no se ha certificado');
   try{
    const raw=readRaw();
    const result:PlayerReopenResult=await verifyPlayerReopenTicket({
     ticket,raw,factory:win.indexedDB,subtle:win.crypto.subtle,now:Date.now()});
    if(readRaw()!==raw)throw Error('El guardado original cambió durante la reapertura');
    const messages={
     verified:`Reapertura comprobada: ${result.records} jugadores coinciden en una conexión IndexedDB nueva. Solo prueba recarga normal; no garantiza recuperación tras apagón ni sincronización con otro dispositivo.`,
     missing:'Prueba no superada: falta la base IndexedDB después de recargar.',
     different:'Prueba no superada: el club o los registros de IndexedDB cambiaron.',
     incomplete:'Prueba no superada: hay identidades de jugadores pendientes.',
     expired:'Prueba caducada: han pasado más de diez minutos desde su inicio.',
     invalid:'Prueba rechazada: la marca de sesión no es válida.'};
    showReopen(messages[result.status]);
   }finally{exclusive.release();await exclusive.released}
  }catch(_){showReopen('No se pudo certificar la reapertura de jugadores. No se ha modificado el club. Cierra otras pestañas y comprueba la copia de nuevo.')}
  finally{recovering=false;update()}
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
 const onReopen=()=>{
  if(!win.confirm('La página se recargará una vez. Se comparará la réplica de jugadores con el último guardado confirmado antes y después; no se tocarán tus datos. ¿Continuar?'))return;
  void reopen().catch(()=>showReopen('No se pudo iniciar la prueba: comprueba primero que las plantillas estén verificadas y no haya otra pestaña activa.'));
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
 reopenButton.addEventListener('click',onReopen);
 win.addEventListener?.('storage',onExternalState);
 win.addEventListener?.('pagehide',onPageHide);
 const api:Readonly<PlayerShadowAPI>=Object.freeze({VERSION:'20.5.67',manualOnly:true,
  authoritative:false,crossTabSafe:true,enabled:()=>active,arm,pause,onConfirmedWrite,inspect,backup,reopen,erase,whenIdle,
  dispose(){if(disposed)return;pause();disposed=true;
   armButton.removeEventListener('click',onArm);pauseButton.removeEventListener('click',onPause);
   checkButton.removeEventListener('click',onCheck);eraseButton.removeEventListener('click',onErase);
   backupButton.removeEventListener('click',onBackup);
   reopenButton.removeEventListener('click',onReopen);
   win.removeEventListener?.('storage',onExternalState);
   win.removeEventListener?.('pagehide',onPageHide);
   update();mounted.delete(win);
   if(win.VC_PLAYER_SHADOW_20567===api)delete win.VC_PLAYER_SHADOW_20567;
  }});
 mounted.set(win,api);win.VC_PLAYER_SHADOW_20567=api;
 // Consume the one-shot ticket BEFORE opening the database; never auto-retry.
 try{const pending=win.sessionStorage?.getItem(PLAYER_REOPEN_TICKET_KEY);
  if(pending!==null&&pending!==undefined){
   win.sessionStorage.removeItem(PLAYER_REOPEN_TICKET_KEY);
   void resumeReopen(pending);
  }
 }catch(_){showReopen('No se pudo acceder a la marca de reapertura. El club permanece intacto.')}
 return api;
}
