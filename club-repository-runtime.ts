/* V20.5.63 · The only trigger for the pilot is a deliberate Gestión button click. */
import {planClubPartitions,sameClubPartitionPlan} from './club-partitions';
import {pilotClubPartitions,removeClubPilot,type ClubPilotReceipt} from './club-repository';

type PilotWindow=Window&{
 VC_V1917_TEAM_STATE?:()=>unknown;
 VC_CLUB_PILOT_20563?:Readonly<ClubPilotAPI>;
};
export interface ClubPilotAPI{
 readonly VERSION:'20.5.63';
 readonly authoritative:false;
 readonly manualOnly:true;
 readonly run:()=>Promise<ClubPilotReceipt>;
 readonly removeReplica:()=>Promise<true>;
 readonly dispose:()=>void;
}
const mounts=new WeakMap<Window,Readonly<ClubPilotAPI>>();
let sequence=0;
const revision=()=>`pilot-${Date.now().toString(36)}-${(++sequence).toString(36)}`;

export function mountClubPilotPanel(win:PilotWindow):Readonly<ClubPilotAPI>|null{
 const old=mounts.get(win);if(old)return old;
 const doc=win.document,button=doc?.getElementById('vc20563-run-pilot') as HTMLButtonElement|null;
 const status=doc?.getElementById('vc20563-pilot-status');
 const removeButton=doc?.getElementById('vc20563-remove-pilot') as HTMLButtonElement|null;
 if(!button||!removeButton||!status)return null;
 let busy=false,disposed=false;
 const ready=typeof win.indexedDB?.open==='function';
 const show=(message:string)=>{if(!disposed)status.textContent=message};
 button.disabled=!ready;removeButton.disabled=!ready;
 show(ready?'Sin ejecutar. El piloto no modifica los datos originales ni la nube.':
  'IndexedDB no está disponible en este navegador. No se han modificado datos.');
 const run=async()=>{
  if(disposed||busy||!ready)throw Error('Piloto ocupado o no disponible');
  busy=true;button.disabled=true;removeButton.disabled=true;
  show('Preparando copia local de prueba. No cierres esta pestaña hasta ver el resultado.');
  try{
   const source=win.VC_V1917_TEAM_STATE?.();
   const plan=planClubPartitions(source,revision());
   const receipt=await pilotClubPartitions({factory:win.indexedDB,plan});
   // A later UI edit does not become verified merely because an older snapshot passed.
   const latest=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   if(!sameClubPartitionPlan(plan,latest)){
    show('Réplica de prueba comprobada, pero los datos han cambiado durante la operación. Repite la prueba.');
   }else{
    show(`Réplica piloto verificada: ${receipt.teamCount} equipos, ${receipt.recordCount} registros y ${receipt.totalChars.toLocaleString('es-ES')} caracteres. El guardado principal sigue intacto.`);
   }
   return receipt;
  }catch(_){
   show('No se ha podido verificar la réplica. El guardado habitual sigue funcionando; no borres datos.');
   throw _;
  }finally{busy=false;if(!disposed){button.disabled=!ready;removeButton.disabled=!ready}}
 };
 const onClick=()=>{void run().catch(()=>{});};
 const removeReplica=async()=>{
  if(disposed||busy||!ready)throw Error('Limpieza piloto no disponible');
  busy=true;button.disabled=true;removeButton.disabled=true;
  show('Eliminando únicamente las colecciones piloto de V20.5.63/V20.5.64…');
  try{await removeClubPilot(win.indexedDB);show('Réplica piloto eliminada. Los datos originales del club siguen intactos.');return true as const}
  catch(error){show('La eliminación no se ha confirmado. Si otra pestaña la bloquea, podría completarse más tarde. Comprueba el estado antes de reintentar.');throw error}
  finally{busy=false;if(!disposed){button.disabled=!ready;removeButton.disabled=!ready}}
 };
 const onRemove=()=>{
  if(!win.confirm('¿Eliminar únicamente los repositorios piloto de V20.5.63 y V20.5.64? El club original y la nube no se modificarán.'))return;
  void removeReplica().catch(()=>{});
 };
 button.addEventListener('click',onClick);
 removeButton.addEventListener('click',onRemove);
 const api:Readonly<ClubPilotAPI>=Object.freeze({VERSION:'20.5.63',
  authoritative:false,manualOnly:true,run,removeReplica,
  dispose(){if(disposed)return;disposed=true;button.removeEventListener('click',onClick);
   removeButton.removeEventListener('click',onRemove);
   button.disabled=true;removeButton.disabled=true;mounts.delete(win);
   if(win.VC_CLUB_PILOT_20563===api)delete win.VC_CLUB_PILOT_20563;}
 });
 win.VC_CLUB_PILOT_20563=api;mounts.set(win,api);return api;
}
