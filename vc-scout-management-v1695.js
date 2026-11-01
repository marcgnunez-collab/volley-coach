/* Volley Coach V16.9.6 — Gestión > Scoutings, con borrado y recuperación protegidos. */
(()=>{
'use strict';
if(window.VC_SCOUT_MANAGEMENT?.version==='16.9.6')return;
const $=id=>document.getElementById(id),arr=x=>Array.isArray(x)?x:[];
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let team='',records=[],open=false,working=false;
const api=()=>window.VC_SYNC_V1696;
function data(){return typeof equiposData==='undefined'?{}:equiposData||{}}
function current(){return data()[team]||{}}
function matches(){return arr(current().scoutingMatches)}
function isDeleted(id){return !!current().scoutingDeleted?.[String(id)]}
function hasCurrent(id){return matches().some(m=>String(m.id)===String(id))}
function mount(){
 const grid=document.querySelector('#v11-management .v11-management-grid');if(!grid)return false;
 if(!$('vcm1696-entry')){
  const b=document.createElement('button');b.type='button';b.id='vcm1696-entry';
  b.innerHTML='<span>▤</span><div><b>Scoutings</b><small>Ver, eliminar y recuperar partidos</small></div><strong>→</strong>';
  b.onclick=()=>void show();grid.appendChild(b);
 }
 if($('vcm1696-modal'))return true;
 const css=document.createElement('style');css.textContent=`
 #vcm1696-modal{display:none;position:fixed;inset:0;z-index:2147483001;background:#091e33ad;padding:10px;align-items:center;justify-content:center}
 #vcm1696-modal.open{display:flex}#vcm1696-panel{max-width:1100px;width:100%;max-height:94vh;background:#fff;display:flex;flex-direction:column;border-radius:15px;overflow:hidden;color:#173147;font:13px Arial}
 #vcm1696-head{display:flex;justify-content:space-between;align-items:center;padding:15px;border-bottom:1px solid #e0e9f0}#vcm1696-head h2{font:800 20px Arial;margin:0}
 #vcm1696-bar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;padding:12px 15px;border-bottom:1px solid #e0e9f0}#vcm1696-bar select{width:160px;max-width:100%}
 #vcm1696-list{padding:14px 15px;overflow-y:auto;min-height:130px}#vcm1696-status{font-size:12px;color:#51697b}
 .vcm1696-item{border:1px solid #dce5ed;border-radius:9px;padding:12px;margin:8px 0;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
 .vcm1696-item small{color:#637788;display:block;margin-top:5px}.vcm1696-actions{display:flex;gap:6px;flex-wrap:wrap}
 .vcm1696-actions button{padding:8px 9px!important;font-size:12px!important;text-transform:none!important}
 .vcm1696-warning{background:#fff8e6;border:1px solid #e3ce91;border-radius:9px;padding:10px;margin:10px 0}
 `;document.head.append(css);
 const el=document.createElement('div');el.id='vcm1696-modal';el.innerHTML=`<section role="dialog" aria-modal="true" aria-label="Gestión de scoutings" id="vcm1696-panel"><header id="vcm1696-head"><h2>Gestión de scoutings</h2><button type="button" id="vcm1696-close" class="ghost">Cerrar</button></header><div id="vcm1696-bar"><label>Equipo <select id="vcm1696-team"></select></label><button type="button" class="ghost" id="vcm1696-refresh">Actualizar</button><button type="button" class="ghost" id="vcm1696-cloud">Buscar en nube</button><button type="button" class="ghost" id="vcm1696-export">Exportar copias</button><span id="vcm1696-status"></span></div><main id="vcm1696-list"></main></section>`;
 document.body.append(el);
 $('vcm1696-close').onclick=close;
 el.addEventListener('click',e=>{if(e.target===el)close()});
 $('vcm1696-team').onchange=()=>{team=$('vcm1696-team').value;paint()};
 $('vcm1696-refresh').onclick=()=>void load(false);
 $('vcm1696-cloud').onclick=()=>void load(true);
 $('vcm1696-export').onclick=()=>void Promise.resolve(api()?.exportProtected?.()).catch(e=>alert(String(e)));
 $('vcm1696-list').addEventListener('click',act);
 return true;
}
function uniqueRows(){
 const result=new Map();
 for(const m of matches())if(m?.id!=null)result.set(String(m.id),{team,match:m,source:'Datos actuales'});
 for(const c of records){if(String(c.team)!==team||c.match?.id==null)continue;const id=String(c.match.id);
  if(!result.has(id))result.set(id,c);
 }
 return [...result.values()].sort((a,b)=>String(b.match?.updatedAt||b.match?.date||'').localeCompare(String(a.match?.updatedAt||a.match?.date||'')));
}
function paint(){if(!open)return;
 const d=api()?.diagnostics?.()||{};
 $('vcm1696-status').textContent=d.blocked?'Conflicto: exporta copias y revisa antes de editar':!d.connected?'Sin sesión de nube':d.pending?'Cambios locales pendientes':d.status||'Sin estado';
 const rows=uniqueRows();
 $('vcm1696-list').innerHTML=`<p>Listado del equipo seleccionado. Puedes consultar partidos finalizados y recuperar una copia como un nuevo scouting. El borrado sincronizado conserva una copia histórica.</p>
 ${d.blocked?'<div class="vcm1696-warning">Sincronización bloqueada por diferencias entre copias. Exporta los datos antes de intentar borrar o recuperar.</div>':''}
 ${rows.map(({match:m,source})=>{
 const id=String(m.id),active=hasCurrent(id),gone=isDeleted(id);
 const label=gone?'Eliminado · copia recuperable':active?(m.status==='finished'?'Finalizado':'Guardado / activo'):'Copia histórica';
 return `<div class="vcm1696-item"><div><b>${safe(m.date||'Sin fecha')} · ${safe(m.opponent||m.rival||'Rival')}</b><small>Equipo ${safe(team)} · ID ${safe(id)} · ${safe(label)} · ${arr(m.sets).length} sets</small><small>${safe(source||'Copia')}</small></div><div class="vcm1696-actions"><button class="ghost" data-action="consult" data-id="${safe(id)}">Consultar</button>${active&&!gone?`<button class="danger" data-action="delete" data-id="${safe(id)}">Eliminar</button>`:''}${!active||gone?`<button class="primary" data-action="recover" data-id="${safe(id)}">Recuperar</button>`:''}</div></div>`}).join('')||'<p>No se han encontrado scoutings en este equipo.</p>'}`;
}
async function load(withCloud=false){if(working)return;working=true;
 $('vcm1696-status').textContent='Buscando copias protegidas…';
 try{
  const sources=[];
  if(window.VC_ARCHIVE?.collect)for(const x of await window.VC_ARCHIVE.collect(withCloud))sources.push(x);
  if(api()?.listArchivedScoutings)for(const x of await api().listArchivedScoutings())sources.push(x);
  if(window.VC_SYNC_SAFE?.versions)for(const x of await window.VC_SYNC_SAFE.versions())if(x?.match)sources.push({team:x.teamId,match:x.match,source:'Histórico protegido'});
  records=sources.filter(x=>x&&x.match&&x.team!=null);
 }catch(e){console.error('Gestión scoutings: copias',e);$('vcm1696-status').textContent='Fallo leyendo copias: '+String(e.message||e)}
 finally{working=false;paint()}
}
async function act(e){const b=e.target.closest('button[data-action]');if(!b||working)return;
 const id=b.dataset.id,action=b.dataset.action,match=uniqueRows().find(x=>String(x.match.id)===id)?.match;if(!match)return;
 if(action==='consult'){
  close();if(window.VC_ARCHIVE?.openMatch)await window.VC_ARCHIVE.openMatch(team,id);else alert('La consulta histórica no está disponible');return;
 }
 if(!api())return alert('No se ha cargado el motor de sincronización');
 const question=action==='delete'?'¿Eliminar este scouting del equipo y sincronizar el borrado? Se conservará una copia protegida.':'¿Recuperar esta copia como un nuevo scouting? El original eliminado no reaparecerá.';
 if(!confirm(question))return;
 working=true;b.disabled=true;
 try{
  if(action==='delete')await api().deleteScouting(team,id);
  if(action==='recover')await api().recoverScouting(team,match);
  alert('Cambio protegido localmente. Comprueba que aparezca “Nube confirmada” antes de usar otro dispositivo.');
 }catch(err){alert('No se ha podido confirmar la operación: '+String(err?.message||err))}
 finally{working=false;await load(false)}
}
async function show(){if(!mount())throw Error('No está disponible la sección Gestión');
 const list=Object.keys(data());team=list.includes(String(typeof equipoActivo!=='undefined'?equipoActivo:''))?String(equipoActivo):list[0]||'';
 const el=$('vcm1696-team');el.innerHTML=list.map(k=>`<option value="${safe(k)}">${safe(typeof EQUIPOS!=='undefined'&&EQUIPOS?.[k]?.nombre||k)}</option>`).join('');el.value=team;
 open=true;$('vcm1696-modal').classList.add('open');await load(false);
}
function close(){open=false;$('vcm1696-modal')?.classList.remove('open')}
window.VC_SCOUT_MANAGEMENT={version:'16.9.6',open:show,close,refresh:()=>load(false)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
