
(()=>{
'use strict';
const VERSION='15.4.0',LOG_KEY='vc154_activity',DEVICE=window.VC_DEVICE_SYNC?.deviceId||'unknown',NAME=window.VC_DEVICE_SYNC?.deviceName||'Dispositivo';
const $=id=>document.getElementById(id);
let logs=[],lastLogKey='',lastLogAt=0;
try{logs=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');if(!Array.isArray(logs))logs=[]}catch(_){logs=[]}
function persist(){logs=logs.filter(x=>x&&x.id&&x.at).sort((a,b)=>String(a.at).localeCompare(String(b.at))).slice(-90);try{localStorage.setItem(LOG_KEY,JSON.stringify(logs))}catch(_){}}
function mergeActivity(remote){const map=new Map();[...logs,...(Array.isArray(remote)?remote:[])].forEach(e=>{if(e?.id&&e?.at)map.set(String(e.id),{id:String(e.id),at:String(e.at),device:String(e.device||''),name:String(e.name||''),team:String(e.team||''),category:String(e.category||''),detail:String(e.detail||'')})});logs=[...map.values()];persist();if($('vc154-collab-modal')?.classList.contains('open'))render()}
function record(category,detail='Cambio guardado localmente'){
  if(typeof cloudApplying!=='undefined'&&cloudApplying)return;
  const key=category+':'+detail,now=Date.now();if(key===lastLogKey&&now-lastLogAt<7000)return;
  lastLogKey=key;lastLogAt=now;const id=`${DEVICE}:${now}:${Math.random().toString(36).slice(2,8)}`;
  logs.push({id,at:new Date(now).toISOString(),device:DEVICE,name:NAME,team:String(typeof equipoActivo!=='undefined'?equipoActivo:''),category:String(category||'general'),detail:String(detail||'Modificación').slice(0,150)});
  persist();if($('vc154-collab-modal')?.classList.contains('open'))render();
}
/* Cloud state is augmented without changing existing persisted training structures. */
const baseExport=window.estadoLocal;
if(typeof baseExport==='function'){const wrapped=function(){const out=baseExport.apply(this,arguments)||{};out.v154Activity=logs.slice(-90);return out};window.estadoLocal=wrapped;try{estadoLocal=wrapped}catch(_){}}
const baseApply=window.aplicarEstadoCloud;
if(typeof baseApply==='function'){const wrapped=function(state){const out=baseApply.apply(this,arguments);mergeActivity(state?.v154Activity);return out};window.aplicarEstadoCloud=wrapped;try{aplicarEstadoCloud=wrapped}catch(_){}}
const baseSchedule=window.programarSubidaCloud;
if(typeof baseSchedule==='function'){const wrapped=function(){record(document.querySelector('.view.active')?.id||'entrenamiento','Solicitud de guardado local');return baseSchedule.apply(this,arguments)};window.programarSubidaCloud=wrapped;try{programarSubidaCloud=wrapped}catch(_){}}
try{window.MatchState?.subscribe?.(e=>{const r=String(e?.reason||'Acción de partido');if(!/^(boot|init|startup|migration|subscribe)/i.test(r))record('scouting',r)})}catch(_){ }
function peers(){const d=window.VC_DEVICE_SYNC?.diagnostics?.()||{};return {online:d.realtimeState==='SUBSCRIBED',people:Array.isArray(d.presencePeers)?d.presencePeers:[],state:d.realtimeState||'no disponible'}}
function ensureUI(){
  if(!$('vc154-presence-button')){
    const host=document.querySelector('#v11-topbar .v11-topbar-actions')||document.querySelector('#v11-topbar')||document.querySelector('#v138-device-strip');
    if(host){const b=document.createElement('button');b.id='vc154-presence-button';b.type='button';b.onclick=()=>window.v154OpenCollaboration();b.innerHTML='<span id="vc154-presence-dot"></span><span id="vc154-presence-count">Equipo conectado</span>';host.appendChild(b)}
  }
  if(!$('vc154-collab-modal')){
    const modal=document.createElement('div');modal.id='vc154-collab-modal';modal.innerHTML='<div id="vc154-collab-card"><header><h3>Colaboración · V15.4</h3><button type="button" id="vc154-collab-close">Cerrar</button></header><p>Dispositivos conectados a la misma cuenta de Supabase. Presencia en tiempo real; no sustituye usuarios y permisos independientes.</p><div id="vc154-collab-info"></div><h4>En línea</h4><ul id="vc154-peers"></ul><h4>Historial reciente de actividad</h4><ul id="vc154-activity"></ul></div>';
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});document.body.appendChild(modal);$('vc154-collab-close').onclick=()=>modal.classList.remove('open');
  }
}
function row(parent,title,subtitle){const li=document.createElement('li');li.textContent=title;const sub=document.createElement('small');sub.textContent=subtitle;li.appendChild(sub);parent.appendChild(li)}
function render(){ensureUI();const d=peers(),b=$('vc154-presence-button'),label=$('vc154-presence-count');if(b){b.classList.toggle('online',d.online);b.classList.toggle('offline',!d.online)}if(label)label.textContent=d.online?(d.people.length?`${d.people.length} dispositivo(s) en línea`:'Verificando dispositivos…'):'Presencia no conectada';
  const info=$('vc154-collab-info');if(info)info.textContent=`Realtime: ${d.state} · ${d.people.length} dispositivo(s) detectado(s). Los cambios se guardan por separado en Supabase.`;
  const ul=$('vc154-peers');if(ul){ul.replaceChildren();if(!d.people.length)row(ul,'Sin datos de presencia',d.online?'Otro dispositivo puede no haber actualizado todavía':'Revisa la sesión de nube y la conexión');else d.people.forEach(p=>row(ul,(p.deviceId===DEVICE?'Este dispositivo · ':'')+p.name,`${p.type||'dispositivo'} · equipo ${p.teamId||'sin seleccionar'} · ${p.deviceId.slice(0,10)}`))}
  const hist=$('vc154-activity');if(hist){hist.replaceChildren();logs.slice(-35).reverse().forEach(x=>row(hist,`${x.name||'Dispositivo'} · ${x.category||'actividad'}`,`${x.detail} · ${new Date(x.at).toLocaleString('es-ES')}`));if(!logs.length)row(hist,'Todavía no hay cambios registrados','Se empezará a registrar actividad local en esta versión')}
}
window.v154OpenCollaboration=()=>{render();$('vc154-collab-modal')?.classList.add('open')};
window.VC_V154_COLLAB={version:VERSION,render,record,mergeActivity,diagnostics:()=>({version:VERSION,presence:peers(),activityCount:logs.length})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();setInterval(render,15000)},{once:true});else{render();setInterval(render,15000)}
})();
