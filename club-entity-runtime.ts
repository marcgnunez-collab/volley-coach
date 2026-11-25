/* V20.5.64 · Explicit entity migration preview and pilot delta buttons. */
import {planClubEntities,sameClubEntityData} from './club-entity-plan';
import {pilotClubEntityDelta,type ClubEntityReceipt} from './club-entity-repository';
import {planClubPartitions,sameClubPartitionPlan} from './club-partitions';

type EntityWindow=Window&{VC_V1917_TEAM_STATE?:()=>unknown;
 VC_CLUB_ENTITY_20564?:Readonly<ClubEntityAPI>};
export interface ClubEntityAPI{
 readonly VERSION:'20.5.64';readonly manualOnly:true;readonly authoritative:false;
 readonly inspect:()=>ReturnType<typeof planClubEntities>;
 readonly run:()=>Promise<ClubEntityReceipt>;
 readonly dispose:()=>void;
}
const mounted=new WeakMap<Window,Readonly<ClubEntityAPI>>();
let serial=0;
const revision=()=>`entities-${Date.now().toString(36)}-${(++serial).toString(36)}`;

export function mountClubEntityPanel(win:EntityWindow):Readonly<ClubEntityAPI>|null{
 const doc=win.document;
 const inspectBtn=doc?.getElementById('vc20564-inspect-ids') as HTMLButtonElement|null;
 const runBtn=doc?.getElementById('vc20564-run-delta') as HTMLButtonElement|null;
 const status=doc?.getElementById('vc20564-entity-status');
 if(!inspectBtn||!runBtn||!status)return null;
 const previous=mounted.get(win);if(previous)return previous;
 let busy=false,disposed=false;
 const ready=typeof win.indexedDB?.open==='function';
 const show=(value:string)=>{if(!disposed)status.textContent=value};
 inspectBtn.disabled=false;runBtn.disabled=!ready;
 show(ready?'Todavía no se han analizado los IDs. Ningún cambio se aplica automáticamente.':
  'Puedes analizar los IDs, pero este navegador no permite ensayar el repositorio.');
 const inspect=()=>planClubEntities(win.VC_V1917_TEAM_STATE?.(),revision());
 const analyse=()=>{
  try{const plan=inspect();const count=plan.rows.playerEntities.length+
   plan.rows.trainingEntities.length+plan.rows.seasonEntities.length;
   show(`IDs revisados: ${count} entidades aptas y ${plan.missingIds+plan.duplicatedIds+plan.invalidRecords} registros pendientes. ${plan.complete?'Cobertura completa del piloto.':'Cobertura parcial; no se migrarán los registros sin ID.'}`);
   return plan;
  }catch(_){show('No se pudo revisar el estado. Abre un equipo y vuelve a intentarlo.');throw _;}
 };
 const run=async()=>{
  if(disposed||busy||!ready)throw Error('Piloto incremental ocupado o no disponible');
  busy=true;runBtn.disabled=true;inspectBtn.disabled=true;
  show('Comparando los registros individuales. No cierres la pestaña hasta el resultado.');
  try{
   const before=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   const plan=inspect(),receipt=await pilotClubEntityDelta({factory:win.indexedDB,plan});
   const current=inspect();
   const after=planClubPartitions(win.VC_V1917_TEAM_STATE?.(),revision());
   if(!sameClubEntityData(plan,current)||!sameClubPartitionPlan(before,after)){
    show('La escritura piloto se verificó, pero el club cambió durante la prueba. Repite la comparación.');
   }else{
    const progress=`${receipt.added} nuevos, ${receipt.changed} actualizados, ${receipt.unchanged} sin cambios, ${receipt.removed} retirados de la réplica.`;
    show(receipt.partial?`Piloto parcial verificado: ${progress} ${receipt.pendingIds} registros no migrados por falta o conflicto de ID.`:
     `Piloto incremental verificado: ${progress} El guardado original sigue intacto.`);
   }
   return receipt;
  }catch(error){show('La prueba incremental no se pudo verificar. El club original sigue siendo la fuente principal.');throw error}
  finally{busy=false;if(!disposed){inspectBtn.disabled=false;runBtn.disabled=!ready}}
 };
 const onInspect=()=>{try{analyse()}catch(_){}};
 const onRun=()=>{void run().catch(()=>{})};
 inspectBtn.addEventListener('click',onInspect);runBtn.addEventListener('click',onRun);
 const api:Readonly<ClubEntityAPI>=Object.freeze({VERSION:'20.5.64',manualOnly:true,
  authoritative:false,inspect,run,dispose(){
   if(disposed)return;disposed=true;
   inspectBtn.removeEventListener('click',onInspect);
   runBtn.removeEventListener('click',onRun);
   inspectBtn.disabled=true;runBtn.disabled=true;
   mounted.delete(win);
   if(win.VC_CLUB_ENTITY_20564===api)delete win.VC_CLUB_ENTITY_20564;
  }});
 win.VC_CLUB_ENTITY_20564=api;mounted.set(win,api);return api;
}
