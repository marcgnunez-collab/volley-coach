/* V20.5.67 · Session-only opt-in player mirror after confirmed original saves.
 * Failed mirror writes NEVER retry or alter the canonical local/cloud writer.
 */
import {planPlayerShadow,writePlayerShadow,inspectPlayerShadow,deletePlayerShadow,
 type PlayerShadowCheck,type PlayerShadowReceipt} from './player-shadow';

type PlayerWindow=Window&{
 VC_STORAGE_QUOTA_1531?:{unpack?:(v:string)=>string};
 VC_PLAYER_SHADOW_20567?:Readonly<PlayerShadowAPI>;
};
export interface PlayerShadowAPI{
 readonly VERSION:'20.5.67';readonly manualOnly:true;readonly authoritative:false;
 readonly enabled:()=>boolean;readonly arm:()=>void;readonly pause:()=>void;
 readonly onConfirmedWrite:(raw:string)=>void;
 readonly inspect:()=>Promise<PlayerShadowCheck>;
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
 const status=doc?.getElementById('vc20567-player-shadow-status');
 if(!armButton||!pauseButton||!checkButton||!eraseButton||!status)return null;
 const old=mounted.get(win);if(old)return old;
 const available=typeof win.indexedDB?.open==='function'&&
  typeof win.indexedDB?.deleteDatabase==='function'&&!!win.localStorage;
 let active=false,disposed=false,processing=false,scheduled=false;
 let queued:string|null=null,ongoing:Promise<void>|null=null;
 const show=(text:string)=>{if(!disposed)status.textContent=text};
 const update=()=>{
  armButton.disabled=!available||active||disposed;
  pauseButton.disabled=!active||disposed;
  checkButton.disabled=!available||disposed;
  eraseButton.disabled=!available||disposed;
 };
 update();
 show(available?'Copia paralela apagada. Solo se activa manualmente para esta sesión.':
  'Este navegador no permite la prueba aislada de jugadores.');

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
  }finally{processing=false;ongoing=null;update()}
 };
 const schedule=()=>{
  if(scheduled||processing||disposed||!active)return;
  scheduled=true;
  setTimeout(()=>{scheduled=false;if(active&&!disposed)ongoing=drain()},0);
 };
 const onConfirmedWrite=(raw:string)=>{
  if(!active||disposed)return;
  if(typeof raw!=='string'||!raw||raw.length>12000000){
   active=false;queued=null;update();
   show('Copia paralela pausada: el estado confirmado supera los límites de prueba.');
   return;
  }
  queued=raw;schedule();
 };
 const arm=()=>{
  if(!available||disposed)throw Error('No se puede activar esta réplica');
  // Capture the actual last committed local JSON; never clone transient editor state.
  const raw=readRaw();
  const preview=planPlayerShadow(raw,revision());
  if(!preview.complete)throw Error(`Hay ${preview.pendingIds} identidades pendientes`);
  active=true;update();
  show('Copia paralela activa para esta sesión. Preparando la lectura del último guardado confirmado…');
  onConfirmedWrite(raw);
 };
 const pause=()=>{
  active=false;queued=null;update();
  show(processing?'Copia paralela pausada. La transacción ya iniciada puede finalizar.':
   'Copia paralela desactivada. Se mantiene el guardado principal.');
 };
 const whenIdle=async()=>{
  while(scheduled||processing||ongoing){
   if(ongoing)await ongoing;
   else await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
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
  if(!available||disposed)throw Error('Borrado de réplica no disponible');
  pause();await whenIdle();
  const result=await deletePlayerShadow(win.indexedDB);
  show('Se eliminó únicamente la copia paralela de jugadores. El club original no cambió.');
  return result;
 };
 const onArm=()=>{if(win.confirm('La réplica opcional guardará datos de jugadores en este dispositivo. ¿Tienes copia JSON de seguridad y deseas activarla solo para esta sesión?'))
  try{arm()}catch(_){show('No se pudo activar: revisa los IDs de jugadores, el guardado principal y la copia JSON.')}};
 const onPause=()=>pause();
 const onCheck=()=>{void inspect().catch(()=>show('No se pudo comprobar la copia de jugadores.'))};
 const onErase=()=>{if(win.confirm('¿Eliminar solo la réplica de jugadores V20.5.67? No se borrará el club principal.'))
  void erase().catch(()=>show('No pudo eliminarse la copia paralela. Cierra otras pestañas e inténtalo de nuevo.'))};
 armButton.addEventListener('click',onArm);pauseButton.addEventListener('click',onPause);
 checkButton.addEventListener('click',onCheck);eraseButton.addEventListener('click',onErase);
 const api:Readonly<PlayerShadowAPI>=Object.freeze({VERSION:'20.5.67',manualOnly:true,
  authoritative:false,enabled:()=>active,arm,pause,onConfirmedWrite,inspect,erase,whenIdle,
  dispose(){if(disposed)return;pause();disposed=true;
   armButton.removeEventListener('click',onArm);pauseButton.removeEventListener('click',onPause);
   checkButton.removeEventListener('click',onCheck);eraseButton.removeEventListener('click',onErase);
   update();mounted.delete(win);
   if(win.VC_PLAYER_SHADOW_20567===api)delete win.VC_PLAYER_SHADOW_20567;
  }});
 mounted.set(win,api);win.VC_PLAYER_SHADOW_20567=api;return api;
}
