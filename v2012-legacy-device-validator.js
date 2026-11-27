/* Volley Coach V20.1.2 · Two-device validation / read-only telemetry.
 * No cloud writes, no local match mutations, no token/account/device IDs in exports.
 * Reports compare observed/applied CAS versions; they cannot prove byte-level equality.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_SYNC_2012=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.1.2',SCHEMA='vc-multi-device-validation';
 const text=x=>String(x??'').trim();
 const validStamp=x=>{const s=text(x);return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s))?s:'';};
 const posInt=x=>{const v=Number(x);return Number.isSafeInteger(v)&&v>=0?v:0;};
 function report({cloud={},device={},journal={},now=Date.now()}={}){
  const c=cloud||{},d=device||{},j=journal||{};
  return {schema:SCHEMA,version:VERSION,createdAt:new Date(now).toISOString(),
   connected:!!c.connected,dirty:!!c.dirty,blocked:!!c.blockedReason,
   realtimeSubscribed:d.realtimeState==='SUBSCRIBED',
   lastReadAt:posInt(c.lastReadAt),lastWriteAt:posInt(c.lastWriteAt),
   lastReadErrorAt:posInt(c.lastReadErrorAt),
   lastObservedRemoteStamp:validStamp(c.lastObservedRemoteStamp),
   lastAppliedRemoteStamp:validStamp(c.lastAppliedRemoteStamp),
   lastConfirmedWriteStamp:validStamp(c.lastConfirmedWriteStamp),
   pendingJournal:typeof j.pendingCount==='number'?posInt(j.pendingCount):null,
   journalError:!!j.lastError,
   // Deliberately no URLs, tokens, account IDs, device IDs, scouting data or names.
   warning:'Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo.'};
 }
 function parseReport(input){
  const raw=typeof input==='string'?JSON.parse(input):input;
  if(!raw||raw.schema!==SCHEMA||raw.version!==VERSION)throw Error('Informe incompatible: deben ser diagnósticos V20.1.2.');
  if(!Number.isFinite(Date.parse(raw.createdAt)))throw Error('Informe sin fecha válida.');
  for(const key of ['connected','dirty','blocked','realtimeSubscribed'])if(typeof raw[key]!=='boolean')throw Error('Campo inválido: '+key);
  if(raw.pendingJournal!==null&&(!Number.isInteger(raw.pendingJournal)||raw.pendingJournal<0))throw Error('Diario inválido.');
  return report({cloud:raw,device:{realtimeState:raw.realtimeSubscribed?'SUBSCRIBED':''},journal:{pendingCount:raw.pendingJournal,lastError:raw.journalError},now:Date.parse(raw.createdAt)});
 }
 function compareReports(a,b){
  const lhs=parseReport(a),rhs=parseReport(b);
  const ready=x=>x.connected&&!x.dirty&&!x.blocked&&!x.journalError&&x.pendingJournal===0;
  if(!ready(lhs)||!ready(rhs))return {status:'review',message:'Alguno de los dispositivos tiene cambios pendientes, está bloqueado o no puede comprobar su diario. No se confirma una entrega.'};
  const hits=[];
  if(lhs.lastConfirmedWriteStamp&&lhs.lastConfirmedWriteStamp===rhs.lastAppliedRemoteStamp)hits.push('La versión subida por el primer dispositivo figura como procesada en el segundo.');
  if(rhs.lastConfirmedWriteStamp&&rhs.lastConfirmedWriteStamp===lhs.lastAppliedRemoteStamp)hits.push('La versión subida por el segundo dispositivo figura como procesada en el primero.');
  if(hits.length)return {status:'matched',message:hits.join(' ')+' Comparación de marcas, no del contenido ni prueba de la versión más reciente.'};
  return {status:'unproven',message:'No hay una marca de subida de un dispositivo que coincida con una versión procesada en el otro. Realiza una edición de prueba y comprueba ambos informes.'};
 }
 function mount(win){
  const doc=win.document;if(!doc)return;
  const $=id=>doc.getElementById(id);
  let peer=null,feedback='',busy=false;
  const getCurrent=async()=>{
   const cloud=win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};
   const device=win.VC_DEVICE_SYNC?.diagnostics?.()||{};
   const journal=await win.VC_SYNC_2011_JOURNAL?.inspect?.(win.VC_V962_CLOUD_EFFICIENT?.getAccountId?.()||'')||{pendingCount:null,lastError:'Diario sin comprobar'};
   return report({cloud,device,journal});
  };
  function ensure(){
   if($('vc2012-multi-validation'))return true;
   const container=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!container)return false;
   const panel=doc.createElement('section');panel.id='vc2012-multi-validation';panel.className='vc2012-validation';
   panel.innerHTML=`<div class="vc2012-heading"><div><small>V20.1.2 · VALIDACIÓN PC + MÓVIL</small><h3>Comprobar la entrega entre dispositivos</h3></div><span>Solo lectura</span></div>
    <p>Supabase debe confirmar el envío y el otro dispositivo debe aplicar la misma versión. Realtime conectado no demuestra la recepción.</p>
    <div class="vc2012-versions"><div><span>Última versión vista en la nube</span><b id="vc2012-observed">—</b></div><div><span>Última versión procesada aquí</span><b id="vc2012-applied">—</b></div><div><span>Última versión subida aquí</span><b id="vc2012-uploaded">—</b></div><div><span>Diario local pendiente</span><b id="vc2012-pending">—</b></div></div>
    <p class="vc2012-instructions">1. Usa un scouting de prueba. 2. Edita y sincroniza en PC. 3. Abre el mismo partido en móvil y comprueba la edición. 4. Descarga un informe en cada dispositivo. 5. Importa aquí el del otro dispositivo para comparar las versiones.</p>
    <div class="vc2012-actions"><button id="vc2012-export" type="button">Descargar informe local</button><label class="vc2012-import">Comparar con informe del otro dispositivo<input id="vc2012-file" type="file" accept=".json,application/json"/></label><button id="vc2012-refresh" type="button">Actualizar estado</button></div>
    <p id="vc2012-feedback" class="vc2012-result" role="status">Sin comparación. No se han modificado datos.</p>
    <p class="vc2012-privacy">No incluye nombres, scoutings, IDs, claves ni vídeos. Comprueba que ambos dispositivos usan la misma cuenta. Un informe no reemplaza la prueba con dos dispositivos físicos.</p>`;
   const place=$('vc2011-journal-panel')||$('vc200-sync-reliability');if(place?.parentNode)place.insertAdjacentElement('afterend',panel);else container.appendChild(panel);
   $('vc2012-refresh').addEventListener('click',()=>void render());
   $('vc2012-export').addEventListener('click',async()=>{
    try{const content=JSON.stringify(await getCurrent(),null,2),url=win.URL.createObjectURL(new win.Blob([content],{type:'application/json'}));
      const a=doc.createElement('a');a.href=url;a.download='volley-coach-validacion-dispositivo-v20.1.2.json';doc.body.appendChild(a);a.click();a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),5000);
      feedback='Informe descargado. Conserva una copia en cada dispositivo.';
    }catch(_){feedback='No se pudo descargar el informe. Comprueba el diario local.';}void render();
   });
   $('vc2012-file').addEventListener('change',async event=>{
    const file=event.target?.files?.[0];if(!file)return;
    if(file.size>65536){feedback='Archivo demasiado grande para un informe de validación.';void render();return;}
    try{peer=parseReport(await file.text());feedback='Informe del segundo dispositivo cargado para comparar.';}
    catch(_){peer=null;feedback='El archivo no es un informe V20.1.2 válido.';}
    void render();
   });
   return true;
  }
  async function render(){if(busy||!ensure())return;busy=true;
   try{
    const current=await getCurrent();
    const put=(id,value)=>{const x=$(id);if(x&&x.textContent!==value)x.textContent=value;};
    put('vc2012-observed',current.lastObservedRemoteStamp||'Sin lectura confirmada');
    put('vc2012-applied',current.lastAppliedRemoteStamp||'Sin recepción procesada');
    put('vc2012-uploaded',current.lastConfirmedWriteStamp||'Sin subida confirmada');
    put('vc2012-pending',current.pendingJournal===null?'Sin comprobar':String(current.pendingJournal));
    const comparison=peer?compareReports(current,peer):null,el=$('vc2012-feedback');
    if(el){el.textContent=comparison?comparison.message:feedback||'Sin comparación. No se han modificado datos.';el.dataset.status=comparison?.status||'idle';}
   }catch(_){const el=$('vc2012-feedback');if(el)el.textContent='No se pudo leer el estado de validación. Comprueba la conexión y el diario.';}
   finally{busy=false;}
  }
  function boot(){
   void render();
   if(!$('vc2012-multi-validation')&&win.MutationObserver){
    const obs=new win.MutationObserver(()=>{if(ensure()){obs.disconnect();void render();}});obs.observe(doc.body,{childList:true,subtree:true});
   }
   win.addEventListener('vc200:sync-state',()=>void render());
   win.addEventListener('vc2011:journal',()=>void render());
   doc.addEventListener('click',e=>{if(e.target?.closest?.('#vc154-presence-button,#vc16040-sync-modal'))win.setTimeout(()=>void render(),20);},true);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 }
 return {VERSION,SCHEMA,report,parseReport,compareReports,mount};
});
