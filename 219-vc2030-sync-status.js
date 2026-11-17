/* Volley Coach V20.3.0 — independent evidence for cloud write and peer read.
 * Presentation only; never modifies scouting data or resolves a conflict.
 */
(()=>{
 'use strict';
 const VERSION='20.3.0',doc=document,$=id=>doc.getElementById(id);
 let lastMessage='';
 const cloud=()=>window.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};
 const device=()=>window.VC_DEVICE_SYNC?.diagnostics?.()||{};
 function fmt(ms){return ms?new Date(ms).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—'}
 function ensure(){
  const base=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return null;
  if($('vc2030-sync-evidence'))return $('vc2030-sync-evidence');
  const el=doc.createElement('section');el.id='vc2030-sync-evidence';
  el.setAttribute('aria-label','Confirmaciones entre dispositivos');
  el.innerHTML=`<div class="vc2030-header"><span>V20.3.0 · SINCRONIZACIÓN VERIFICABLE</span><strong>Quién ha confirmado cada paso</strong></div>
  <div class="vc2030-grid"><div><small>Guardado en Supabase</small><b id="vc2030-saved">—</b></div>
  <div><small>Otros dispositivos en línea</small><b id="vc2030-peers">—</b></div>
  <div><small>Recepción por otro dispositivo</small><b id="vc2030-received">—</b></div></div>
  <p id="vc2030-explanation" role="status">Comprobando…</p>
  <p class="vc2030-note">Una conexión Realtime no demuestra que la nube haya guardado los cambios. Una confirmación de recepción indica que otro dispositivo aplicó una versión de nube, no que alguien revisó su contenido.</p>`;
  const style=doc.createElement('style');style.id='vc2030-sync-style';style.textContent=`
  #vc2030-sync-evidence{border:1px solid #cbdeed;border-radius:12px;background:#f5faff;padding:14px;margin:12px 0;color:#244860}
  #vc2030-sync-evidence .vc2030-header{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}
  #vc2030-sync-evidence .vc2030-header span{font-size:9px;color:#39769e;font-weight:900;letter-spacing:.11em}
  #vc2030-sync-evidence .vc2030-header strong{font-size:15px}
  #vc2030-sync-evidence .vc2030-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  #vc2030-sync-evidence .vc2030-grid>div{padding:10px;border-radius:9px;background:#fff;border:1px solid #d6e7f3;min-width:0}
  #vc2030-sync-evidence .vc2030-grid small{display:block;font-size:10px;line-height:1.3;color:#648197;margin-bottom:6px}
  #vc2030-sync-evidence .vc2030-grid b{font-size:12px;overflow-wrap:anywhere}
  #vc2030-sync-evidence p{font-size:11px;line-height:1.45;margin:9px 0 0}
  #vc2030-sync-evidence .vc2030-note{color:#6c8494;font-size:10px}
  @media(max-width:620px){#vc2030-sync-evidence .vc2030-grid{grid-template-columns:1fr}}`;
  doc.head.appendChild(style);
  const anchor=$('vc200-sync-reliability')||base.querySelector('.vc16040-note');
  if(anchor?.parentElement===base)anchor.insertAdjacentElement('afterend',el);else base.appendChild(el);
  return el;
 }
 function render(){
  if(!ensure())return;
  const c=cloud(),d=device();
  const put=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
  const connected=!!c.connected,online=d.realtimeState==='SUBSCRIBED';
  put('vc2030-saved',!connected?'Sin sesión':c.dirty||c.syncing?'Cambios pendientes':c.lastSyncError?'No confirmado':c.lastConfirmedWriteStamp?'Confirmado '+fmt(c.lastWriteAt):'Sin subida confirmada');
  put('vc2030-peers',online?String(Number(d.liveOtherDeviceCount)||0):'Sin presencia');
  const n=connected?Number(d.receiptCount)||0:0;
  put('vc2030-received',n?`${n} dispositivo${n===1?'':'s'} · ${fmt(d.lastPeerReceiptAt)}`:'Sin confirmación de lectura');
  lastMessage=!connected?'Inicia sesión en ambos dispositivos.':c.blockedReason?'Sincronización protegida: revisa el conflicto pendiente.':c.dirty?'Los cambios siguen protegidos localmente; aún no están confirmados por el servidor.':c.lastSyncError?'No se pudo confirmar esta sincronización.':n?'Otro dispositivo ha confirmado que aplicó la versión publicada.':'El servidor puede haber confirmado el guardado, pero todavía no consta confirmación de otro dispositivo.';
  put('vc2030-explanation',lastMessage);
 }
 function boot(){render();window.addEventListener('vc200:sync-state',render);window.addEventListener('vc2030:receipt',render);doc.addEventListener('click',e=>{if(e.target?.closest?.('#vc16040-sync-modal,#vc154-presence-button'))setTimeout(render,20)},true);window.setInterval(()=>{if($('vc16040-sync-modal')&&!$('vc16040-sync-modal').hidden)render()},3500)}
 window.VC2030_SYNC_STATUS={version:VERSION,render,diagnostics:()=>({version:VERSION,message:lastMessage})};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
