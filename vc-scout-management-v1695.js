/* Volley Coach 16.9.5 — Gestión / Scoutings */
(()=>{
'use strict';
if(window.VC_SCOUT_MANAGEMENT)return;
const $=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let selectedTeam='',copies=[],busy=false;
const sync=()=>window.VC_SYNC_V1680;
function teams(){return typeof equiposData==='object'?equiposData||{}:{}}
function current(){return teams()[selectedTeam]||{}}
function exists(id){return arr(current().scoutingMatches).some(m=>String(m.id)===String(id))}
function deleted(id){return !!current().scoutingDeleted?.[String(id)]}
function state(){const d=sync()?.diagnostics?.()||{};return d}
function mount(){
 const grid=document.querySelector('#v11-management .v11-management-grid');
 if(!grid)return false;
 if(!$('vcmg-entry')){
  const b=document.createElement('button');b.id='vcmg-entry';b.type='button';
  b.innerHTML='<span>▤</span><div><b>Scoutings</b><small>Consultar, eliminar y recuperar partidos</small></div><strong>→</strong>';
  b.onclick=()=>window.VC_SCOUT_MANAGEMENT.open();grid.append(b);
 }
 if(!$('vcmg-modal')){
  const style=document.createElement('style');style.textContent=`
  #vcmg-modal{position:fixed;inset:0;z-index:2147483001;background:#071d3599;display:none;align-items:center;justify-content:center;padding:12px}
  #vcmg-modal.open{display:flex}#vcmg-pane{width:min(1100px,98vw);max-height:91vh;overflow:hidden;display:flex;flex-direction:column;background:#fff;color:#183047;border-radius:15px;box-shadow:0 18px 50px #0005;font:13px Arial}
  #vcmg-head{display:flex;align-items:center;justify-content:space-between;padding:15px 19px;border-bottom:1px solid #dde5eb}
  #vcmg-head h2{margin:0;font:800 19px Arial}#vcmg-toolbar{padding:12px 17px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-bottom:1px solid #e3eaf0}
  #vcmg-toolbar select{max-width:250px}#vcmg-body{padding:15px 17px;overflow:auto;flex:1}
  .vcmg-row{display:grid;grid-template-columns:minmax(190px,1fr) auto;align-items:center;gap:12px;padding:12px;border:1px solid #e1e7ec;border-radius:10px;margin-bottom:8px;background:#fff}
  .vcmg-row small{display:block;color:#657a8a;margin-top:5px}.vcmg-actions{display:flex;flex-wrap:wrap;gap:6px}
  .vcmg-actions button{padding:8px 9px!important;font-size:11px!important;text-transform:none!important}
  .vcmg-alert{padding:11px;background:#fff8e7;border:1px solid #e7cd8d;border-radius:9px;margin:9px 0}
  #vcmg-status{font-size:11px;color:#526a7d;max-width:470px;overflow-wrap:anywhere}
  @media(max-width:640px){.vcmg-row{grid-template-columns:1fr}.vcmg-actions{justify-content:flex-start}}
  `;document.head.append(style);
  const modal=document.createElement('div');modal.id='vcmg-modal';modal.innerHTML=`<section id="vcmg-pane" role="dialog" aria-modal="true" aria-label="Gestión de scoutings"><header id="vcmg-head"><h2>Gestión de scoutings</h2><button class="ghost" id="vcmg-close">Cerrar</button></header><div id="vcmg-toolbar"><label>Equipo <select id="vcmg-team"></select></label><button class="ghost" id="vcmg-refresh">Actualizar</button><button class="ghost" id="vcmg-cloud">Consultar nube</button><button class="ghost" id="vcmg-export">Exportar copias</button><span id="vcmg-status"></span></div><div id="vcmg-body"></div></section>`;
  document.body.append(modal);
  $('vcmg-close').onclick=()=>modal.classList.remove('open');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
  $('vcmg-team').onchange=()=>{selectedTeam=$('vcmg-team').value;void load(false)};
  $('vcmg-refresh').onclick=()=>void load(false);
  $('vcmg-cloud').onclick=()=>void load(true);
  $('vcmg-export').onclick=()=>sync()?.exportProtected?.();
  $('vcmg-body').addEventListener('click',onClick);
 }
 return true;
}
function listRows(){
 const t=current(),existing=arr(t.scoutingMatches).map(m=>({team:selectedTeam,match:m,kind:'current'}));
 const out=new Map(existing.map(x=>[String(x.match.id),x]));
 for(const c of copies){if(String(c.team)!==selectedTeam||!c.match?.id)continue;const id=String(c.match.id);if(!out.has(id))out.set(id,{team:selectedTeam,match:c.match,kind:'copy',source:c.source})}
 return [...out.values()].sort((a,b)=>String(b.match?.updatedAt||b.match?.date||'').localeCompare(String(a.match?.updatedAt||a.match?.date||'')));
}
function paint(){
 const d=state();$('vcmg-status').textContent=d.outboxHold?'Sincronización bloqueada: exporta copias y revisa conflictos':!d.connected?'Sin sesión en nube':d.pending?'Cambios pendientes de nube':d.status||'Estado no disponible';
 const rows=listRows();$('vcmg-body').innerHTML=`<p style="margin:0 0 12px">Partidos activos, finalizados y copias recuperables del equipo seleccionado. La eliminación guarda una copia protegida; la recuperación crea otro registro para evitar conflictos.</p>${d.outboxHold?'<div class="vcmg-alert">Hay un conflicto de sincronización. Las operaciones destructivas están bloqueadas para proteger tus datos.</div>':''}${rows.map(x=>{const m=x.match,id=String(m.id),gone=deleted(id),active=exists(id);const desc=gone?'Eliminado · recuperable':active?(m.status==='finished'?'Finalizado':'Activo / guardado'):'Copia histórica';return `<article class="vcmg-row"><div><b>${safe(m.date||'Sin fecha')} · ${safe(m.opponent||'Rival')}</b><small>${safe(selectedTeam)} · ID ${safe(id)} · ${desc} · ${arr(m.sets).length} sets</small><small>${safe(x.source||'Datos del equipo')}</small></div><div class="vcmg-actions"><button class="ghost" data-act="view" data-id="${safe(id)}">Consultar</button>${active&&!gone?`<button class="danger" data-act="delete" data-id="${safe(id)}">Eliminar</button>`:''}${!active||gone?`<button class="primary" data-act="recover" data-id="${safe(id)}">Recuperar copia</button>`:''}</div></article>`}).join('')||'<p>No hay scoutings disponibles para este equipo.</p>'}`;
}
async function load(fromCloud=false){
 if(busy)return;
 const cloudItems=fromCloud;
 $('vcmg-status').textContent='Consultando registros…';
 try{
  if(window.VC_ARCHIVE?.collect){copies=await window.VC_ARCHIVE.collect(cloudItems)}
  paint();
 }catch(e){$('vcmg-status').textContent='Error al consultar copias: '+String(e?.message||e)}
}
async function onClick(e){
 const b=e.target.closest('button[data-act]');if(!b||busy)return;
 const id=b.dataset.id,action=b.dataset.act,record=listRows().find(x=>String(x.match.id)===id);
 if(!record)return;
 if(action==='view'){window.VC_SCOUT_MANAGEMENT.close();await window.VC_ARCHIVE?.openMatch?.(selectedTeam,id);return}
 if(!sync())return alert('El motor de sincronización no está disponible.');
 if(action==='delete'&&!confirm('¿Eliminar este scouting del equipo? Se guardará una copia antes de sincronizar el borrado.'))return;
 if(action==='recover'&&!confirm('¿Recuperar esta copia como un scouting nuevo? Se conserva el registro de eliminación anterior.'))return;
 busy=true;b.disabled=true;
 try{
  if(action==='delete')await sync().deleteScouting(selectedTeam,id);
  else if(action==='recover')await sync().recoverScouting(selectedTeam,record.match);
  await load(false);
  paint();
  alert('Cambio protegido localmente. Comprueba la confirmación de nube en el indicador.');
 }catch(err){alert('No se ha confirmado la operación: '+String(err?.message||err));paint()}
 finally{busy=false;b.disabled=false}
}
async function open(){
 if(!mount())throw Error('Gestión no disponible');
 const keys=Object.keys(teams());const select=$('vcmg-team');
 selectedTeam=keys.includes(String(typeof equipoActivo!=='undefined'?equipoActivo:''))?String(equipoActivo):keys[0]||'';
 select.innerHTML=keys.map(k=>`<option value="${safe(k)}">${safe(typeof EQUIPOS!=='undefined'&&EQUIPOS[k]?.nombre||k)}</option>`).join('');
 select.value=selectedTeam;$('vcmg-modal').classList.add('open');await load(false);
}
function close(){$('vcmg-modal')?.classList.remove('open')}
window.VC_SCOUT_MANAGEMENT={version:'16.9.5',open,close,refresh:()=>load(false)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();