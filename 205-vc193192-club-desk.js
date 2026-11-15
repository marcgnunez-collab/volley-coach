/* Volley Coach V19.3.19.2 · Professional Club Desk.
 * Presentation-only facade over existing club/team/player and scouting writers.
 * Uses the original navigation and the original cambiarEquipo flow.
 */
(function(root,factory){
 'use strict'; const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC193192_CLUB_DESK=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.2',ui={tab:'overview',search:'',message:''};
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function route(root,id){const fn=root?.VC19_UNIFIED_WORKFLOW?.route||root?.VC17_WORKSPACE?.route;return typeof fn==='function'&&fn(id)===true;}
 function snapshot(root){return root?.VC193192_DOMAINS?.inspect(root)||null;}
 function card(t,active){const canSwitch=t.id==='infantil'||t.id==='cadete',isActive=t.id===active;
  return `<button type="button" class="vc193192-team-card ${isActive?'is-active':''}" data-vc193192-team="${esc(t.id)}" aria-pressed="${isActive}" ${!canSwitch&&!isActive?'disabled title="Equipo en lectura; migración multiclub pendiente"':''}><span class="vc193192-team-leading">${esc(t.name.slice(0,2).toUpperCase())}</span><span class="vc193192-team-copy"><strong>${esc(t.name)}</strong><small>${esc(t.season||'Temporada no registrada')} · ${t.counts.players} jugadores</small></span><span class="vc193192-team-tag">${isActive?'Activo':canSwitch?'Cambiar':'Consulta'}</span></button>`;
 }
 function overview(data){const t=data.active||data.teams[0]||null;if(!t)return '<div class="vc193192-empty">Todavía no hay equipos registrados.</div>';
  return `<div class="vc193192-detail-heading"><div><small>EQUIPO SELECCIONADO</small><h3>${esc(t.name)}</h3><p>${esc(t.season||'Sin temporada asignada')} · Los registros siguen en su formato original.</p></div><button type="button" data-vc193192-action="roster">Abrir plantilla</button></div>
   <div class="vc193192-statgrid">${[['Jugadores',t.counts.players],['Scoutings',t.counts.matches],['Entrenamientos',t.counts.training],['Planes',t.counts.plans],['Rallies',t.counts.rallies],['Contactos',t.counts.actions]].map(([k,v])=>`<div><small>${k}</small><strong>${v}</strong></div>`).join('')}</div>
   <div class="vc193192-bottomgrid"><section><div class="vc193192-subhead"><h4>Plantilla reciente</h4><button type="button" data-vc193192-action="roster">Ver todos</button></div><div class="vc193192-compact-list">${t.roster.slice(0,6).map(p=>`<div><b>${esc(p.number?'#'+p.number:'—')}</b><span>${esc(p.name||'Sin nombre')}</span><small>${esc(p.position||'Sin posición')}</small></div>`).join('')||'<p>Sin jugadores registrados.</p>'}</div></section>
   <section><div class="vc193192-subhead"><h4>Últimos scoutings</h4><button type="button" data-vc193192-route="scout-dashboard">Abrir partidos</button></div><div class="vc193192-compact-list">${t.lastMatches.map(m=>`<div><b>●</b><span>${esc(m.label)}</span><small>${esc(m.status||'Estado no indicado')}</small></div>`).join('')||'<p>Sin scoutings registrados.</p>'}</div></section></div>`;
 }
 function roster(data,q){const t=data.active||data.teams[0];if(!t)return '<div class="vc193192-empty">No hay equipo seleccionado.</div>';
  const term=str(q).toLocaleLowerCase('es');const rows=t.roster.filter(p=>!term||[p.name,p.number,p.position].some(v=>str(v).toLocaleLowerCase('es').includes(term)));
  return `<div class="vc193192-detail-heading"><div><small>PLANTILLA · LECTURA</small><h3>${esc(t.name)}</h3><p>La edición permanece en el gestor original de jugadores, debajo de este panel.</p></div><button type="button" data-vc193192-action="legacy-roster">Gestionar jugadores</button></div>
  <label class="vc193192-search">Buscar en plantilla<input id="vc193192-search" type="search" placeholder="Nombre, dorsal o posición" value="${esc(q)}" autocomplete="off"></label>
  <div class="vc193192-table-scroll"><table><thead><tr><th>Dorsal</th><th>Jugador</th><th>Posición</th><th>Estado</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.number||'—')}</td><td>${esc(p.name||'Sin nombre')}</td><td>${esc(p.position||'—')}</td><td>${esc(p.status||'No indicado')}</td></tr>`).join('')||'<tr><td colspan="4">No hay jugadores para este filtro.</td></tr>'}</tbody></table></div>`;
 }
 function seasons(data){const recorded=data.seasons.length?data.seasons.map(s=>`<article class="vc193192-season"><strong>${esc(s.label)}</strong><span>${s.teamIds.length} equipos con temporada explícita</span></article>`).join(''):'<p>No existe una temporada global registrada en los datos actuales. No se ha creado ninguna automáticamente.</p>';
  return `<div class="vc193192-detail-heading"><div><small>MODELO DE TEMPORADA</small><h3>Temporadas y equipos</h3><p>Vista de los campos que ya existen; no es una migración ni un nuevo calendario.</p></div><button type="button" data-vc193192-route="scout-season">Análisis de temporada</button></div><div class="vc193192-seasons">${recorded}</div><p class="vc193192-note">${data.unassignedSeasons} equipo(s) sin temporada explícita. El futuro modelo club → temporada → equipo necesitará una migración reversible y autorización por club.</p>`;
 }
 function html(data){
  return `<div class="vc193192-heading"><div><span class="vc193192-kicker">CLUB · TEAMS · ROSTER</span><h2>Centro del club</h2><p>Equipos, plantilla y actividad desde una única vista. Conservamos las fuentes originales de scouting, entrenamientos y nube.</p></div><div class="vc193192-heading-actions"><span class="vc193192-readonly">Datos originales · Solo lectura</span><button type="button" data-vc193192-route="v11-management">Copias y auditoría</button></div></div>
   <div class="vc193192-overviewstats"><div><small>Equipos</small><strong>${data.total.teams}</strong></div><div><small>Jugadores</small><strong>${data.total.players}</strong></div><div><small>Scoutings guardados</small><strong>${data.total.matches}</strong></div><div><small>Rallies</small><strong>${data.total.rallies}</strong></div></div>
   <div class="vc193192-columns"><aside class="vc193192-team-list"><div class="vc193192-listhead"><h3>Equipos</h3><small>${data.teams.length} registrados</small></div><div class="vc193192-team-cards">${data.teams.map(t=>card(t,data.active?.id)).join('')||'<p>Sin equipos disponibles</p>'}</div><div class="vc193192-warning">No se crean clubes o equipos nuevos hasta que la migración multiclub y los permisos del servidor estén validados.</div></aside>
   <div class="vc193192-main"><nav class="vc193192-tabs" aria-label="Vista del club">${[['overview','Resumen'],['roster','Plantilla'],['seasons','Temporadas']].map(([id,name])=>`<button type="button" data-vc193192-tab="${id}" aria-pressed="${ui.tab===id}">${name}</button>`).join('')}</nav><div class="vc193192-content">${ui.tab==='roster'?roster(data,ui.search):ui.tab==='seasons'?seasons(data):overview(data)}</div></div></div>
   <div class="vc193192-foot"><span role="status" id="vc193192-status">${esc(ui.message||`${data.issues.length} advertencia(s) de estructura; datos sin modificar.`)}</span><button type="button" data-vc193192-action="refresh">Actualizar datos</button></div>`;
 }
 function mount(root){const doc=root.document;if(!doc)return false;
  function ensure(){
   const host=doc.getElementById('jugadores');if(!host)return false;
   let shell=doc.getElementById('vc193192-club');if(!shell){shell=doc.createElement('section');shell.id='vc193192-club';shell.className='vc193192-club';host.insertBefore(shell,host.firstChild);}
   return refresh();
  }
  function refresh(){const host=doc.getElementById('jugadores'),shell=doc.getElementById('vc193192-club');if(!host||!shell)return false;
   try{const data=snapshot(root);if(!data)throw Error('Adaptadores no disponibles');shell.innerHTML=html(data);host.dataset.vc193192Mode=ui.tab;return true;}
   catch(err){shell.innerHTML='<div class="vc193192-empty" role="status">No se pudo consultar el centro del club: '+esc(err?.message||err)+'. Los datos no se modificaron.</div>';return false;}
  }
  function status(msg){ui.message=msg;const el=doc.getElementById('vc193192-status');if(el)el.textContent=msg;}
  doc.addEventListener('click',e=>{
   const control=e.target?.closest?.('[data-vc193192-action],[data-vc193192-tab],[data-vc193192-team],[data-vc193192-route]');if(!control)return;
   if(!doc.getElementById('vc193192-club')?.contains(control))return;
   if(control.dataset.vc193192Tab){ui.tab=control.dataset.vc193192Tab;ui.message='';refresh();return;}
   if(control.dataset.vc193192Route){if(!route(root,control.dataset.vc193192Route))status('No se pudo abrir el módulo solicitado.');return;}
   if(control.dataset.vc193192Team){const id=control.dataset.vc193192Team;
    if(id===root?.VC193192_DOMAINS?.activeFrom(root)){status('Este equipo ya está activo.');return;}
    if(!['cadete','infantil'].includes(id)||typeof root.cambiarEquipo!=='function'){status('El equipo no se puede cambiar desde el motor actual.');return;}
    try{const result=root.cambiarEquipo(id);
     if(result&&typeof result.then==='function')result.then(()=>{status('Cambio solicitado. Comprueba la nube antes de editar.');refresh();}).catch(err=>status('Cambio no confirmado: '+str(err?.message||err)));
     else {status('Cambio solicitado. Comprueba la nube antes de editar.');root.setTimeout?.(refresh,100);}
    }catch(err){status('No se cambió el equipo: '+str(err?.message||err));}return;
   }
   const action=control.dataset.vc193192Action;
   if(action==='refresh')refresh();
   if(action==='roster'){ui.tab='roster';refresh();}
   if(action==='legacy-roster'){
    const target=doc.querySelector('#jugadores .players-pro-shell');if(target){target.scrollIntoView?.({block:'start',behavior:'smooth'});target.querySelector('input')?.focus?.({preventScroll:true});}
   }
  });
  doc.addEventListener('input',e=>{if(e.target?.id==='vc193192-search'){ui.search=str(e.target.value);const rows=doc.querySelector('#vc193192-club .vc193192-table-scroll');
   // Only update the table to preserve input focus and cursor position.
   try{const data=snapshot(root);if(rows){const parsed=roster(data,ui.search),tmp=doc.createElement('div');tmp.innerHTML=parsed;rows.innerHTML=tmp.querySelector('.vc193192-table-scroll')?.innerHTML||'';}}catch(_){}
  }});
  root.addEventListener?.('vc:teamchange',()=>{ui.message='';root.setTimeout?.(refresh,0);});
  doc.addEventListener('click',e=>{const routeTarget=e.target?.closest?.('[data-vc17-link],[data-vc17-view],[data-vc193191-route]');if(routeTarget?.dataset?.vc17Link==='jugadores'||routeTarget?.dataset?.vc17View==='jugadores'||routeTarget?.dataset?.vc193191Route==='jugadores')root.setTimeout?.(refresh,0);});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  return {VERSION,refresh,ensure};
 }
 return {VERSION,html,overview,roster,seasons,card,route,snapshot,mount};
});
