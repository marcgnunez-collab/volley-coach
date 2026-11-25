/* V20.5.66 · Gestión: manual dry-run, never a live-state restoration. */
import {planClubEntities} from './club-entity-plan';
import {planClubPartitions,sameClubPartitionPlan} from './club-partitions';
import {rehearseClubEntityRecovery,type ClubRehydrationReport} from './club-entity-rehydration';

type RehydrationWindow=Window&{
 VC_V1917_TEAM_STATE?:()=>unknown;
 VC_CLUB_REHYDRATION_20566?:Readonly<RehydrationAPI>;
};
export interface RehydrationAPI{
 readonly VERSION:'20.5.66';readonly manualOnly:true;readonly authoritative:false;
 readonly rehearse:()=>Promise<ClubRehydrationReport>;readonly dispose:()=>void;
}
const mounted=new WeakMap<Window,Readonly<RehydrationAPI>>();
let serial=0;
const revision=()=>`rehydrate-${Date.now().toString(36)}-${(++serial).toString(36)}`;

export function mountClubRehydrationPanel(win:RehydrationWindow):Readonly<RehydrationAPI>|null{
 const button=win.document?.getElementById('vc20566-rehearse-recovery') as HTMLButtonElement|null;
 const status=win.document?.getElementById('vc20566-rehydration-status');
 if(!button||!status)return null;
 const prior=mounted.get(win);if(prior)return prior;
 const supported=typeof win.indexedDB?.open==='function';
 let busy=false,disposed=false;
 button.disabled=!supported;
 status.textContent=supported?'Sin ensayar. Primero actualiza la réplica incremental V20.5.64.':
  'Este navegador no permite la comprobación de IndexedDB.';
 const show=(text:string)=>{if(!disposed)status.textContent=text};
 const rehearse=async()=>{
  if(!supported||busy||disposed)throw Error('Ensayo de recuperación no disponible');
  busy=true;button.disabled=true;
  show('Leyendo y reconstruyendo las entidades en memoria, sin guardar cambios…');
  try{
   const source=win.VC_V1917_TEAM_STATE?.();
   const before=planClubPartitions(source,revision());
   const plan=planClubEntities(source,revision());
   const result=await rehearseClubEntityRecovery({factory:win.indexedDB,plan,source});
   const after=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   if(!sameClubPartitionPlan(before,after)){
    show('Los datos del club cambiaron durante el ensayo. Repítelo con el club estable.');
    return Object.freeze({...result,status:'different' as const});
   }
   switch(result.status){
    case 'ready':show(`Reconstrucción en memoria coincidente: ${result.records} registros de ${result.teams} equipos. Se conservaron orden y presencia de campos. No se restauró nada.`);break;
    case 'incomplete':show(`Reconstrucción detenida: quedan ${result.pendingIds} incidencias de IDs o datos históricos. Conserva el guardado original.`);break;
    case 'missing':show('No existe réplica incremental. Ejecuta antes el ensayo de cambios parciales.');break;
    case 'incompatible':show('La réplica necesita metadatos de orden. Repite «Ensayar cambios parciales» y vuelve a intentarlo.');break;
    case 'different':show('La réplica no coincide con los datos actuales. No se ha sustituido ni restaurado información.');break;
   }
   return result;
  }catch(error){show('No pudo completarse la reconstrucción en memoria. Los datos originales están intactos.');throw error}
  finally{busy=false;if(!disposed)button.disabled=!supported}
 };
 const onClick=()=>{void rehearse().catch(()=>{})};
 button.addEventListener('click',onClick);
 const api:Readonly<RehydrationAPI>=Object.freeze({VERSION:'20.5.66',manualOnly:true,
  authoritative:false,rehearse,dispose(){
   if(disposed)return;disposed=true;
   button.removeEventListener('click',onClick);button.disabled=true;
   mounted.delete(win);
   if(win.VC_CLUB_REHYDRATION_20566===api)delete win.VC_CLUB_REHYDRATION_20566;
  }});
 mounted.set(win,api);win.VC_CLUB_REHYDRATION_20566=api;return api;
}
