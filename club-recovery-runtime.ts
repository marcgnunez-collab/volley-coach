/* V20.5.65 · Manual browser-reopen audit and in-memory historical ID rehearsal. */
import {planClubEntities} from './club-entity-plan';
import {planClubPartitions,sameClubPartitionPlan} from './club-partitions';
import {inspectClubEntityRecovery,type ClubRecoveryReport} from './club-recovery';
import {previewHistoricIds,rehearseHistoricIds} from './club-id-migration';

type RecoveryWindow=Window&{
 VC_V1917_TEAM_STATE?:()=>unknown;
 VC_CLUB_RECOVERY_20565?:Readonly<ClubRecoveryAPI>;
};
export interface ClubRecoveryAPI{
 readonly VERSION:'20.5.65';readonly manualOnly:true;readonly authoritative:false;
 readonly verify:()=>Promise<ClubRecoveryReport>;
 readonly previewIds:()=>Readonly<{proposed:number;unresolved:number;dryRun:true}>;
 readonly dispose:()=>void;
}
const mounts=new WeakMap<Window,Readonly<ClubRecoveryAPI>>();
let revisionNumber=0;
const revision=()=>`recheck-${Date.now().toString(36)}-${(++revisionNumber).toString(36)}`;

export function mountClubRecoveryPanel(win:RecoveryWindow):Readonly<ClubRecoveryAPI>|null{
 const doc=win.document;
 const checkBtn=doc?.getElementById('vc20565-check-recovery') as HTMLButtonElement|null;
 const previewBtn=doc?.getElementById('vc20565-preview-ids') as HTMLButtonElement|null;
 const checkStatus=doc?.getElementById('vc20565-recovery-status');
 const previewStatus=doc?.getElementById('vc20565-ids-status');
 if(!checkBtn||!previewBtn||!checkStatus||!previewStatus)return null;
 const old=mounts.get(win);if(old)return old;
 const hasDb=typeof win.indexedDB?.open==='function';
 const hasIds=typeof win.crypto?.randomUUID==='function';
 let busy=false,disposed=false;
 const show=(target:HTMLElement,text:string)=>{if(!disposed)target.textContent=text};
 checkBtn.disabled=!hasDb;previewBtn.disabled=!hasIds;
 show(checkStatus,hasDb?'Sin comprobar. Para ensayar una recuperación real, recarga antes la aplicación.':
  'No se puede comprobar la réplica en este navegador.');
 show(previewStatus,hasIds?'No se han propuesto IDs. El ensayo no modifica registros.':
  'Este navegador no ofrece generación segura de identificadores.');
 const verify=async()=>{
  if(disposed||busy||!hasDb)throw Error('Comprobación no disponible');
  busy=true;checkBtn.disabled=true;previewBtn.disabled=true;
  show(checkStatus,'Abriendo la réplica con una conexión nueva y comprobando los datos…');
  try{
   const before=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   const plan=planClubEntities(win.VC_V1917_TEAM_STATE?.(),revision());
   const result=await inspectClubEntityRecovery({factory:win.indexedDB,plan});
   const after=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   if(!sameClubPartitionPlan(before,after)){
    show(checkStatus,'El club cambió durante la lectura. Repite la comprobación: no se puede confirmar esta versión.');
   }else if(result.status==='missing'){
    show(checkStatus,'No existe una réplica incremental comprobable. Ejecuta primero el ensayo de V20.5.64.');
   }else if(result.status==='different'){
    show(checkStatus,'La réplica ya no coincide con el club actual. No se ha restaurado ni sobrescrito ningún dato.');
   }else{
    show(checkStatus,`Lectura tras reapertura coincidente: ${result.records} registros locales. ${result.partial?'Cobertura parcial; hay IDs históricos pendientes.':'Cobertura completa de las entidades seleccionadas.'} No demuestra sincronización en otro dispositivo.`);
   }
   return result;
  }catch(error){show(checkStatus,'No se pudo completar la comprobación. Conserva el guardado original y la copia JSON.');throw error}
  finally{busy=false;if(!disposed){checkBtn.disabled=!hasDb;previewBtn.disabled=!hasIds}}
 };
 const previewIds=()=>{
  if(disposed||busy||!hasIds)throw Error('Ensayo de identidades no disponible');
  try{
   const source=win.VC_V1917_TEAM_STATE?.();
   const plan=previewHistoricIds(source,()=>win.crypto.randomUUID());
   const rehearsal=rehearseHistoricIds(source,plan);
   const unresolved=plan.conflicts+plan.invalid+rehearsal.remaining;
   show(previewStatus,`Ensayo sin guardar: ${rehearsal.applied} IDs propuestos y ${unresolved} incidencias pendientes. Los datos originales no se han modificado.`);
   return Object.freeze({proposed:rehearsal.applied,unresolved,dryRun:true as const});
  }catch(error){show(previewStatus,'No se pudo simular una asignación segura. Los registros originales no se han modificado.');throw error}
 };
 const onCheck=()=>{void verify().catch(()=>{})};
 const onPreview=()=>{try{previewIds()}catch(_){}};
 checkBtn.addEventListener('click',onCheck);previewBtn.addEventListener('click',onPreview);
 const api:Readonly<ClubRecoveryAPI>=Object.freeze({VERSION:'20.5.65',manualOnly:true,
  authoritative:false,verify,previewIds,dispose(){
   if(disposed)return;disposed=true;
   checkBtn.removeEventListener('click',onCheck);
   previewBtn.removeEventListener('click',onPreview);
   checkBtn.disabled=true;previewBtn.disabled=true;mounts.delete(win);
   if(win.VC_CLUB_RECOVERY_20565===api)delete win.VC_CLUB_RECOVERY_20565;
  }});
 win.VC_CLUB_RECOVERY_20565=api;mounts.set(win,api);return api;
}
