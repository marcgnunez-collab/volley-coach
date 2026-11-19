/* V20.5.21 · Vite/TypeScript owns the former V20.1.2 browser diagnostic UI.
 * Legacy 211 is retained as an immutable parity fixture, but not loaded.
 * No CAS, IndexedDB mutation, scouting command or timer-driven storage write.
 */
import {reportDeviceValidation,parseDeviceValidation,compareDeviceValidation,
 MULTI_DEVICE_SCHEMA,MULTI_DEVICE_VERSION,type DeviceReportInput} from './multi-device-validation';

interface SyncDiagnosticPort{
 readonly diagnostics?:()=>unknown;
 readonly getAccountId?:()=>string;
}
interface JournalDiagnosticPort{
 readonly inspect?:(accountId:string)=>Promise<unknown>;
}
type DeviceWindow=Window&{
 VC_V962_CLOUD_EFFICIENT?:SyncDiagnosticPort;
 VC_DEVICE_SYNC?:SyncDiagnosticPort;
 VC_SYNC_2011_JOURNAL?:JournalDiagnosticPort;
 VC_SYNC_2012?:Readonly<DeviceValidationAPI>;
};
export interface DeviceValidationAPI{
 readonly VERSION:typeof MULTI_DEVICE_VERSION;
 readonly SCHEMA:typeof MULTI_DEVICE_SCHEMA;
 readonly report:typeof reportDeviceValidation;
 readonly parseReport:typeof parseDeviceValidation;
 readonly compareReports:typeof compareDeviceValidation;
 readonly mount:(win:DeviceWindow)=>Readonly<DevicePanelMount>|null;
}
export interface DevicePanelMount{
 readonly version:'20.5.21';
 readonly readOnly:true;
 readonly refresh:()=>Promise<void>;
 readonly dispose:()=>void;
}
const mounts=new WeakMap<Window,Readonly<DevicePanelMount>>();
const API:Readonly<DeviceValidationAPI>=Object.freeze({
 VERSION:MULTI_DEVICE_VERSION,SCHEMA:MULTI_DEVICE_SCHEMA,
 report:reportDeviceValidation,parseReport:parseDeviceValidation,
 compareReports:compareDeviceValidation,mount:mountMultiDevicePanel
});

/** Preserves the historic window.VC_SYNC_2012 consumer API without a classic script. */
export function installMultiDeviceAPI(win:DeviceWindow):Readonly<DeviceValidationAPI>{
 win.VC_SYNC_2012=API;return API;
}

export function mountMultiDevicePanel(win:DeviceWindow):Readonly<DevicePanelMount>|null{
 const existing=mounts.get(win);if(existing)return existing;
 const doc=win.document;if(!doc)return null;
 const $=(id:string)=>doc.getElementById(id);
 const node=(tag:string,value='')=>{
  const el=doc.createElement(tag);el.textContent=value;return el;
 };
 let panel:HTMLElement|null=null,owned=false,disposed=false,busy=false,peer:unknown=null,feedback='';
 let observer:MutationObserver|null=null;
 const getCurrent=async()=>{
  const cloud=win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};
  const device=win.VC_DEVICE_SYNC?.diagnostics?.()||{};
  const account=win.VC_V962_CLOUD_EFFICIENT?.getAccountId?.()||'';
  const journal=await win.VC_SYNC_2011_JOURNAL?.inspect?.(account)||
   {pendingCount:null,lastError:'Diario sin comprobar'};
  return reportDeviceValidation({cloud,device,journal});
 };
 const render=async()=>{
  if(disposed||busy||!ensure())return;
  busy=true;
  try{
   const current=await getCurrent();
   if(disposed)return;
   const put=(id:string,value:string)=>{
    const el=$(id);if(el&&el.textContent!==value)el.textContent=value;
   };
   put('vc2012-observed',current.lastObservedRemoteStamp||'Sin lectura confirmada');
   put('vc2012-applied',current.lastAppliedRemoteStamp||'Sin recepción procesada');
   put('vc2012-uploaded',current.lastConfirmedWriteStamp||'Sin subida confirmada');
   put('vc2012-pending',current.pendingJournal===null?'Sin comprobar':String(current.pendingJournal));
   const result=peer?compareDeviceValidation(current,peer):null;
   const status=$('vc2012-feedback');
   if(status){status.textContent=result?result.message:feedback||'Sin comparación. No se han modificado datos.';
    status.dataset.status=result?.status||'idle';}
  }catch(_){
   if(!disposed){const status=$('vc2012-feedback');
    if(status)status.textContent='No se pudo leer el estado de validación. Comprueba la conexión y el diario.';}
  }finally{busy=false;}
 };
 const onRefresh=()=>void render();
 const onExport=async()=>{
  if(disposed)return;
  try{
   const content=JSON.stringify(await getCurrent(),null,2);
   if(disposed)return;
   const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
   const link=doc.createElement('a');link.href=url;
   link.download='volley-coach-validacion-dispositivo-v20.1.2.json';
   doc.body.append(link);link.click();link.remove();
   win.setTimeout(()=>URL.revokeObjectURL(url),5000);
   feedback='Informe descargado. Conserva una copia en cada dispositivo.';
  }catch(_){feedback='No se pudo descargar el informe. Comprueba el diario local.';}
  void render();
 };
 const onExportClick=()=>void onExport();
 const onFile=async(event:Event)=>{
  if(disposed)return;
  const file=(event.target as HTMLInputElement|null)?.files?.[0];
  if(!file)return;
  if(file.size>65536){feedback='Archivo demasiado grande para un informe de validación.';void render();return;}
  try{peer=parseDeviceValidation(await file.text());feedback='Informe del segundo dispositivo cargado para comparar.';}
  catch(_){peer=null;feedback='El archivo no es un informe V20.1.2 válido.';}
  void render();
 };
 function ensure():boolean{
  if(disposed)return false;
  if(panel?.isConnected)return true;
  const old=$('vc2012-multi-validation');
  if(old){panel=old;owned=false;return true;}
  const container=$('vc16040-sync-modal')?.querySelector('.vc16040-card');
  if(!container)return false;
  panel=node('section');panel.id='vc2012-multi-validation';
  panel.className='vc2012-validation';
  panel.innerHTML=`<div class="vc2012-heading"><div><small>V20.1.2 · VALIDACIÓN PC + MÓVIL</small><h3>Comprobar la entrega entre dispositivos</h3></div><span>Solo lectura</span></div>
    <p>Supabase debe confirmar el envío y el otro dispositivo debe aplicar la misma versión. Realtime conectado no demuestra la recepción.</p>
    <div class="vc2012-versions"><div><span>Última versión vista en la nube</span><b id="vc2012-observed">—</b></div><div><span>Última versión procesada aquí</span><b id="vc2012-applied">—</b></div><div><span>Última versión subida aquí</span><b id="vc2012-uploaded">—</b></div><div><span>Diario local pendiente</span><b id="vc2012-pending">—</b></div></div>
    <p class="vc2012-instructions">1. Usa un scouting de prueba. 2. Edita y sincroniza en PC. 3. Abre el mismo partido en móvil y comprueba la edición. 4. Descarga un informe en cada dispositivo. 5. Importa aquí el del otro dispositivo para comparar las versiones.</p>
    <div class="vc2012-actions"><button id="vc2012-export" type="button">Descargar informe local</button><label class="vc2012-import">Comparar con informe del otro dispositivo<input id="vc2012-file" type="file" accept=".json,application/json"/></label><button id="vc2012-refresh" type="button">Actualizar estado</button></div>
    <p id="vc2012-feedback" class="vc2012-result" role="status">Sin comparación. No se han modificado datos.</p>
    <p class="vc2012-privacy">No incluye nombres, scoutings, IDs, claves ni vídeos. Comprueba que ambos dispositivos usan la misma cuenta. Un informe no reemplaza la prueba con dos dispositivos físicos.</p>`;
  owned=true;
  const anchor=$('vc2011-journal-panel')||$('vc200-sync-reliability');
  if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',panel);
  else container.appendChild(panel);
  $('vc2012-refresh')?.addEventListener('click',onRefresh);
  $('vc2012-export')?.addEventListener('click',onExportClick);
  $('vc2012-file')?.addEventListener('change',onFile);
  return true;
 }
 const onStatus=()=>void render();
 const onDocumentClick=(event:MouseEvent)=>{
  if((event.target as Element|null)?.closest?.('#vc154-presence-button,#vc16040-sync-modal'))
   win.setTimeout(()=>void render(),20);
 };
 const start=()=>{
  if(disposed)return;
  void render();
  if(!panel&&typeof MutationObserver==='function'&&doc.body){
   const nextObserver=new MutationObserver(()=>{
    if(ensure()){observer?.disconnect();observer=null;void render();}
   });
   observer=nextObserver;nextObserver.observe(doc.body,{childList:true,subtree:true});
  }
  win.addEventListener('vc200:sync-state',onStatus);
  win.addEventListener('vc2011:journal',onStatus);
  doc.addEventListener('click',onDocumentClick,true);
 };
 let bootPending=false;
 if(doc.readyState==='loading'){
  bootPending=true;doc.addEventListener('DOMContentLoaded',start,{once:true});
 }else start();
 const mounted:Readonly<DevicePanelMount>=Object.freeze({
  version:'20.5.21',readOnly:true,refresh:render,
  dispose(){
   if(disposed)return;disposed=true;
   if(bootPending)doc.removeEventListener('DOMContentLoaded',start);
   observer?.disconnect();observer=null;
   win.removeEventListener('vc200:sync-state',onStatus);
   win.removeEventListener('vc2011:journal',onStatus);
   doc.removeEventListener('click',onDocumentClick,true);
   $('vc2012-refresh')?.removeEventListener('click',onRefresh);
   $('vc2012-export')?.removeEventListener('click',onExportClick);
   $('vc2012-file')?.removeEventListener('change',onFile);
   if(owned)panel?.remove();
   panel=null;peer=null;mounts.delete(win);
  }
 });
 mounts.set(win,mounted);
 return mounted;
}
