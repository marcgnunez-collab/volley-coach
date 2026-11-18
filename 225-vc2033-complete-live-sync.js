/* Volley Coach V20.3.3 · Universal change tracking + live view refresh.
 * The v962 CAS engine remains the ONLY Supabase writer. This module catches
 * legacy local saves with no cloud notification, and refreshes visible views
 * only after the canonical engine applies a server-confirmed state.
 * It never transmits private app data over Broadcast or performs blind merges.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api.pure;
 if(root&&root.document){root.VC2033_LIVE_SYNC=api;api.install(root)}
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION='20.3.3';
 function hashJson(value){
  const source=JSON.stringify(value);if(typeof source!=='string')return '';
  let h=2166136261;for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16)+':'+source.length;
 }
 function createCoordinator({fingerprint,markDirty,diagnostics=()=>({}),onRemote=()=>{}}={}){
  if(typeof fingerprint!=='function'||typeof markDirty!=='function')throw Error('Missing safe sync dependencies');
  let baseline=fingerprint(),remoteApplications=0,localChanges=0,autoScheduled=0;
  function saved(){
   const current=fingerprint();if(!current||current===baseline)return false;
   baseline=current;localChanges++;
   // Even if a previous batch is already dirty, this is a NEW revision.
   // Skipping it would let an in-flight CAS request acknowledge an older
   // snapshot and erroneously clear the dirty marker for the newer edit.
   // The canonical writer coalesces these signals into one bounded batch.
   markDirty('universal-local-save');autoScheduled++;
   return true;
  }
  function applied(event){baseline=fingerprint();remoteApplications++;onRemote(event);return true}
  function acknowledge(){baseline=fingerprint()}
  return {saved,applied,acknowledge,diagnostics:()=>({version:VERSION,localChanges,autoScheduled,remoteApplications,baseline})};
 }
 const pure={VERSION,hashJson,createCoordinator};
 function install(win){
  const doc=win.document;
  let coalesced=null,remoteInProgress=false,remoteViewTimer=null,localSaveHooks=false;
  function snapshot(){
   try{
    // The app's canonical state is lexical (`let equiposData`, `let baseDeDatos`).
    // Reading it directly avoids estadoLocal(), which flushes and normalizes
    // records and must not run merely to detect whether a save changed data.
    const teams=typeof equiposData==='object'?equiposData:null;
    const library=typeof baseDeDatos!=='undefined'?baseDeDatos:null;
    if(!teams)return null;
    return hashJson([teams,library]);
   }catch(err){win.console?.warn?.('V20.3.3 change fingerprint',err);return null}
  }
  const engine=()=>win.VC_V962_CLOUD_EFFICIENT;
  function invoke(name){
   const fn=win[name];if(typeof fn!=='function')return false;
   try{fn()}catch(err){win.console?.warn?.('V20.3.3 refresh '+name,err)}
   return true;
  }
  const extraViews={
   'scout-dashboard':['scoutRenderHome','scoutRender'],
   'scout-season':['scoutRenderSeason','scoutRenderHome'],
   'scout-plan':['scoutV660RenderPlans','scoutV660Render'],
   'scout-matchup':['scoutRenderMatchup'],
   'scout-video-hub':['scoutRenderVideoHub'],
   'v11-reports':['v11RenderReports'],
   'v11-management':['v11RenderManagement']
  };
  function refreshView({stamp=''}={}){
   const view=doc.querySelector('.view.active')?.id||'';
   // The canonical renderVisible() already handles the main seven modules and
   // the scouting workspaces. This supplemental list covers older screens.
   for(const name of extraViews[view]||[])invoke(name);
   // Derived counters outside the active view are cheap, and are never a form.
   if(view!=='competicion')invoke('renderDashboardCompetition');
   try{win.dispatchEvent(new win.CustomEvent('vc2033:remote-applied',{detail:{stamp,view}}))}catch(_){}
  }
  const coordinator=createCoordinator({fingerprint:snapshot,
   markDirty:reason=>engine()?.markDirty?.(reason),
   diagnostics:()=>engine()?.diagnostics?.()||{},
   onRemote:event=>{clearTimeout(remoteViewTimer);remoteViewTimer=setTimeout(()=>refreshView(event),0)}
  });
  function isReceiving(){
   return remoteInProgress||win.VC_SYNC_RECEIVING_CLOUD===true||
    (typeof cloudApplying!=='undefined'&&cloudApplying===true);
  }
  function notifyLocalSave(){
   clearTimeout(coalesced);
   if(isReceiving()){coordinator.acknowledge();return}
   coalesced=setTimeout(()=>{
    coalesced=null;
    if(isReceiving()){coordinator.acknowledge();return}
    try{coordinator.saved()}catch(err){win.console?.warn?.('V20.3.3 safe change notification',err)}
   },100);
  }
  function installHooks(){
   const saver=win.guardarEstadoLocalSinCloud;
   if(typeof saver!=='function'||saver.__vc2033)return localSaveHooks;
   const wrappedSave=function(){
    const result=saver.apply(this,arguments);
    notifyLocalSave();return result;
   };
   wrappedSave.__vc2033=true;
   win.guardarEstadoLocalSinCloud=wrappedSave;
   try{guardarEstadoLocalSinCloud=wrappedSave}catch(_){}
   localSaveHooks=true;
   const applier=win.aplicarEstadoCloud;
   if(typeof applier==='function'&&!applier.__vc2033){
    const wrappedApply=function(){
     remoteInProgress=true;clearTimeout(coalesced);coalesced=null;
     try{return applier.apply(this,arguments)}finally{
      coordinator.acknowledge();remoteInProgress=false;
     }
    };
    wrappedApply.__vc2033=true;win.aplicarEstadoCloud=wrappedApply;
    try{aplicarEstadoCloud=wrappedApply}catch(_){}
   }
   return true;
  }
  function remoteApplied(event={}){coordinator.applied(event)}
  function ensureNotice(){
   const base=doc.getElementById('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return;
   if(doc.getElementById('vc2033-live-note'))return;
   const n=doc.createElement('section');n.id='vc2033-live-note';n.style.cssText='border:1px solid #a5c8df;background:#f1f9ff;color:#244a64;border-radius:10px;padding:12px;margin:10px 0;font:12px/1.4 system-ui';
   const strong=doc.createElement('strong');strong.textContent='V20.3.3 · Sincronización de datos entre dispositivos';
   const p=doc.createElement('p');p.textContent='Los cambios guardados se envían por el motor seguro y se reflejan tras recibir la versión confirmada. Sin conexión se conservan pendientes. La cámara, el vídeo local y el cursor no se transmiten como datos de club.';
   n.append(strong,p);base.append(n);
  }
  function ensureGlobalStatus(){
   if(doc.getElementById('vc2033-global-status'))return true;
   const target=doc.querySelector('.v11-topbar-actions');if(!target)return false;
   const label=doc.createElement('div');label.id='vc2033-global-status';
   label.setAttribute('role','status');label.setAttribute('aria-live','polite');
   label.style.cssText='display:flex;align-items:center;gap:6px;max-width:300px;padding:7px 9px;background:#eff6fc;border:1px solid #c8dfec;border-radius:8px;color:#31556c;font:700 10px/1.25 system-ui;flex-shrink:1';
   const status=doc.createElement('span');status.id='vc2033-cloud-label';
   const peers=doc.createElement('small');peers.id='vc2033-peers-label';peers.style.cssText='color:#648394;font-size:9px';
   label.append(status,peers);target.prepend(label);
   return true;
  }
  function renderStatus(){
   if(!ensureGlobalStatus())return;
   const d=engine()?.diagnostics?.()||{},p=win.VC_DEVICE_SYNC?.diagnostics?.()||{};
   const label=doc.getElementById('vc2033-cloud-label'),peers=doc.getElementById('vc2033-peers-label');
   if(label){
    label.textContent=!d.connected?'○ Sin cuenta':d.blockedReason?'⚠ Revisar conflicto':d.lastSyncError?'⚠ Error de nube':d.dirty||d.syncing?'◷ Enviando cambios':
     d.lastAppliedRemoteStamp||d.lastConfirmedWriteStamp?'✓ Datos guardados':'● Nube conectada';
    label.style.color=d.blockedReason||d.lastSyncError?'#9a5129':d.dirty||d.syncing?'#8a6b2d':d.connected?'#26724f':'#697f8d';
   }
   if(peers)peers.textContent=p.realtimeState==='SUBSCRIBED'?
    `${(Number(p.liveOtherDeviceCount)||0)+1} disp.`:'Presencia pendiente';
  }
  function boot(){
   installHooks();ensureNotice();ensureGlobalStatus();renderStatus();
   // Cloud sync widgets are created on demand, so mount the notice later too.
   const observer=new win.MutationObserver(()=>{if(!doc.getElementById('vc2033-live-note'))ensureNotice()});
   observer.observe(doc.body,{subtree:true,childList:true});
   win.addEventListener('vc200:sync-state',renderStatus);
   win.addEventListener('vc2030:receipt',renderStatus);
   win.addEventListener('online',renderStatus);
   win.addEventListener('offline',renderStatus);
   win.setInterval(renderStatus,3000);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  return {version:VERSION,remoteApplied,installHooks,diagnostics:()=>({...coordinator.diagnostics(),hooksInstalled:localSaveHooks,cloudWriter:'v962-CAS'})};
 }
 return {pure,install};
});
