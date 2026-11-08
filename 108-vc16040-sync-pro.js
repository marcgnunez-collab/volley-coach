/* Volley Coach V16.0.4.0 · Sync Pro (first safe release)
   Presence is informational, writes remain owned by V15.3.3 CAS engine.
   No Supabase credentials are stored, no new database tables are required. */
(()=>{
'use strict';
const VERSION='16.0.4.0',POLL_MS=3500;
const $=id=>document.getElementById(id);
const device=()=>window.VC_DEVICE_SYNC?.diagnostics?.()||{};
const cloud=()=>window.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};
const now=()=>Date.now();
let opened=false,manualBusy=false,lastConnect=0,lastPresenceRefresh=0,lastDisplay='',lastDiagnostic='',lastSample='',logs=[];
const formatTime=t=>t?new Date(Number(t)).toLocaleString('es-ES',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):'Sin confirmar';
const label=(c,d)=>{
 if(!c.connected)return {state:'offline',text:'Solo guardado local',detail:'Inicia sesión en Supabase para compartir cambios.'};
 if(c.lastSyncError)return {state:'error',text:'Error al sincronizar',detail:String(c.lastSyncError).slice(0,160)};
 if(c.dirty)return {state:'pending',text:c.syncing?'Enviando cambios…':'Cambios pendientes de nube',detail:'No cierres este dispositivo hasta comprobar el guardado.'};
 if(c.syncing)return {state:'pending',text:'Comprobando nube…',detail:'Consultando cambios de otros dispositivos.'};
 if(c.lastWriteAt)return {state:'online',text:'Última subida confirmada',detail:'Confirmada '+formatTime(c.lastWriteAt)};
 return {state:'pending',text:'Conectado · sin subida confirmada',detail:'Puedes comprobar la nube con Sincronizar ahora.'};
};
function connectedDevices(d){
 if(d.realtimeState!=='SUBSCRIBED')return null;
 const peers=Array.isArray(d.presencePeers)?d.presencePeers:[];
 const byId=new Map();
 for(const p of peers){const id=String(p?.deviceId||'');if(id&&!byId.has(id))byId.set(id,p)}
 return [...byId.values()];
}
function node(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n}
function ensure(){
 let modal=$('vc16040-sync-modal');
 if(!modal){
   modal=node('div','vc16040-modal');modal.id='vc16040-sync-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Sync Pro: dispositivos y sincronización');modal.hidden=true;
   modal.innerHTML=`<section class="vc16040-card"><header><div><small>VOLLEY COACH · SYNC PRO</small><h2>Dispositivos y nube</h2></div><button type="button" id="vc16040-close" aria-label="Cerrar">Cerrar</button></header><div class="vc16040-grid"><div><label>DISPOSITIVOS EN LÍNEA</label><strong id="vc16040-count">—</strong><small id="vc16040-presence-state">Comprobando presencia</small></div><div><label>ESTADO DE LOS DATOS</label><strong id="vc16040-cloud-state">—</strong><small id="vc16040-cloud-detail"></small></div></div><h3>Sesiones detectadas</h3><ul id="vc16040-devices"></ul><div class="vc16040-foot"><button type="button" id="vc16040-sync-now">Sincronizar ahora</button><button type="button" id="vc1631-conflicts-open">Revisar conflictos</button><button type="button" id="vc16040-backup">Descargar copia JSON</button><button type="button" id="vc16040-copy">Copiar diagnóstico</button><button type="button" id="vc16040-legacy">Historial de actividad</button></div><p id="vc16040-action-message" role="status"></p><p id="vc1631-sync-warning" role="alert" hidden></p><p class="vc16040-note">Dispositivos conectados mide presencia en Realtime, no confirma que los cambios estén guardados. Varias pestañas del mismo navegador se cuentan como un dispositivo. No edites el mismo rally simultáneamente desde dos equipos sin comprobar después el resultado.</p></section>`;
   document.body.appendChild(modal);
   $('vc16040-close').addEventListener('click',close);
   modal.addEventListener('click',e=>{if(e.target===modal)close()});
   $('vc16040-sync-now').addEventListener('click',manualSync);
   $('vc1631-conflicts-open')?.addEventListener('click',()=>window.VC_SYNC_SAFETY_1631?.open?.());
   $('vc16040-backup').addEventListener('click',backup);
   $('vc16040-copy').addEventListener('click',copyDiagnostic);
   $('vc16040-legacy').addEventListener('click',()=>{close();window.v154OpenCollaboration?.()});
 }
 const old=$('vc154-presence-button');
 if(old&&!old.dataset.vc16040){
   old.dataset.vc16040='1';old.title='Ver dispositivos conectados y estado de guardado';
   old.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true);
 }
 return modal;
}
function open(){ensure().hidden=false;opened=true;draw(true)}
function close(){const m=$('vc16040-sync-modal');if(m)m.hidden=true;opened=false}
function setText(id,text){const el=$(id);if(el&&el.textContent!==String(text))el.textContent=String(text)}
function showAction(message){setText('vc16040-action-message',message)}
function draw(force=false){
 if(!document.body)return;
 const d=device(),c=cloud(),p=connectedDevices(d),s=label(c,d),guard=window.VC_SYNC_SAFETY_1631?.status?.();
 if(guard?.blocked){s.state='error';s.text=`Conflicto en ${guard.conflicts} scouting(s)`;s.detail='Revisa las copias antes de permitir nuevas subidas.';}
 const status=p===null?'Presencia no conectada':p.length===0?'Verificando dispositivos…':`${p.length} dispositivo${p.length===1?'':'s'} en línea`;
 const button=$('vc154-presence-button');const oldLabel=$('vc154-presence-count');
 if(button){button.classList.toggle('online',p!==null&&p.length>0);button.classList.toggle('offline',p===null);button.setAttribute('aria-label',status+'. '+s.text)}
 if(oldLabel)setText('vc154-presence-count',status);
 if(!opened&&!force)return;
 ensure();
 setText('vc16040-count',p===null?'—':String(p.length));
 setText('vc16040-presence-state',p===null?'Realtime desconectado':p.length?'Presencia confirmada':'Esperando confirmación de presencia');
 setText('vc16040-cloud-state',s.text);
 setText('vc16040-cloud-detail',s.detail);
 const warn=$('vc1631-sync-warning');if(warn){warn.hidden=!guard?.blocked;warn.textContent=guard?.blocked?`Sincronización pausada: ${guard.conflicts} scouting(s) por resolver.`:''}
 const conflictBtn=$('vc1631-conflicts-open');if(conflictBtn)conflictBtn.textContent=guard?.blocked?`Revisar ${guard.conflicts} conflicto(s)`:'Revisar conflictos';
 const parent=$('vc16040-devices');
 const info=(p||[]).map(x=>({id:String(x.deviceId||''),name:String(x.name||'Dispositivo'),type:String(x.type||'').toLowerCase(),team:String(x.teamId||'')}));
 const signature=JSON.stringify(info);
 if(parent&&(force||signature!==lastDisplay)){
   lastDisplay=signature;parent.replaceChildren();
   if(!p)parent.appendChild(node('li','vc16040-empty','Sin datos de presencia. La sincronización de nube funciona de forma independiente.'));
   else if(!p.length)parent.appendChild(node('li','vc16040-empty','El canal está conectado, pero todavía no ha confirmado dispositivos activos.'));
   else for(const x of info){const li=node('li','vc16040-device');const title=node('strong','',x.name+(x.id===String(d.deviceId||'')?' · este dispositivo':''));const sub=node('small','',(x.type==='mobile'?'Móvil':x.type==='desktop'?'Portátil / PC':'Dispositivo')+(x.team?' · equipo '+x.team:''));li.append(title,sub);parent.append(li)}
 }
 const syncing=$('vc16040-sync-now');if(syncing){syncing.disabled=manualBusy;syncing.textContent=manualBusy?'Sincronizando…':'Sincronizar ahora'}
}
function safeDiag(){
 const c=cloud(),d=device();const p=connectedDevices(d);
 return {version:VERSION,at:new Date().toISOString(),online:navigator.onLine,realtime:d.realtimeState||'sin datos',devicesConfirmed:p===null?null:p.length,cloudConnected:!!c.connected,dirty:!!c.dirty,syncing:!!c.syncing,lastWriteAt:c.lastWriteAt||null,lastReadAt:c.lastReadAt||null,conflicts:c.conflictCount||0,errors:c.failureCount||0,errorMessage:String(c.lastSyncError||'').slice(0,180),conflictGuard:window.VC_SYNC_SAFETY_1631?.status?.()||null,fastChangesProtected:d.protectedLocalChanges||0,fastStaleDiscarded:d.staleFastMessages||0,recentTransitions:logs.slice(-40)};
}
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function backup(){
 try{
  const state=window.estadoLocal?.();if(!state||typeof state!=='object')throw Error('No se ha podido leer el estado local.');
  download('volley-coach-copia-'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  showAction('Copia JSON generada. Guárdala en un lugar privado: contiene datos de tus equipos.');
 }catch(e){showAction('No se ha podido generar la copia: '+String(e?.message||e))}
}
async function copyDiagnostic(){
 const t=JSON.stringify(safeDiag(),null,2);
 try{await navigator.clipboard.writeText(t);showAction('Diagnóstico copiado (sin identificadores de cuenta ni claves).')}
 catch(_){window.prompt('Copia este diagnóstico:',t)}
}
async function manualSync(){
 if(manualBusy)return;
 const engine=window.VC_V962_CLOUD_EFFICIENT;
 if(!engine?.sync||!cloud().connected){showAction('La nube no está conectada; los cambios permanecen en este dispositivo.');return}
 if(window.VC_SYNC_SAFETY_1631?.hasConflicts?.()){window.VC_SYNC_SAFETY_1631.open();showAction('Sincronización bloqueada hasta resolver los conflictos.');return}
 manualBusy=true;draw(true);
 try{await engine.sync({reason:'vc16040-manual',manual:false,allowWrite:true});const guard=window.VC_SYNC_SAFETY_1631?.status?.();if(guard?.blocked){showAction('Conflictos pendientes. No se han enviado cambios. Abre Revisar conflictos.');return}const s=label(cloud(),device());showAction(s.text+'. '+s.detail)}
 catch(e){showAction('Error de sincronización: '+String(e?.message||e))}
 finally{manualBusy=false;draw(true)}
}
function sample(){
 const c=cloud(),d=device(),p=connectedDevices(d);
 const current={cloud:!!c.connected,realtime:String(d.realtimeState||''),devices:p===null?null:p.length,dirty:!!c.dirty,syncing:!!c.syncing,error:!!c.lastSyncError};
 const key=JSON.stringify(current);
 if(key!==lastSample){lastSample=key;logs.push({at:new Date().toISOString(),...current});if(logs.length>60)logs=logs.slice(-60)}
}
function tick(){
 const d=device(),c=cloud(),t=now();
 // Supabase loads asynchronously after initial render; don't wait 30 s for the old polling loop.
 if(document.visibilityState==='visible'&&navigator.onLine&&c.connected&&d.realtimeState!=='SUBSCRIBED'&&t-lastConnect>12000){
  lastConnect=t;try{window.VC_DEVICE_SYNC?.connect?.()}catch(_){ }
 }
 if(document.visibilityState==='visible'&&d.realtimeState==='SUBSCRIBED'&&t-lastPresenceRefresh>75000){
  lastPresenceRefresh=t;try{void window.VC_DEVICE_SYNC?.refreshPresence?.()}catch(_){ }
 }
 sample();draw();
}
function boot(){ensure();tick();setInterval(tick,POLL_MS);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)close()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick()});window.addEventListener('online',tick);window.addEventListener('vc:teamchange',()=>{if(now()-lastPresenceRefresh>5000){lastPresenceRefresh=now();try{void window.VC_DEVICE_SYNC?.refreshPresence?.()}catch(_){}}});}
window.VC_SYNC_PRO={version:VERSION,open,close,diagnostics:safeDiag,refresh:tick,connectedDevices:()=>connectedDevices(device())};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
