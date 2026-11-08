/* Volley Coach V16.3.2 · Team Switch Pro
 * Saves the outgoing team once, swaps the canonical state synchronously, then
 * renders only the active view. Supabase and scouting/video engines are unchanged.
 * Does not alter, delete or rename stored team keys.
 */
(()=>{
'use strict';
if(window.VC_TEAM_SWITCH_PRO)return;
const VERSION='16.3.2';
const byId=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,menuOpen=false,changed=0,lastDurationMs=0,lastError='',renderCount=0,saveCount=0;
let lastSaveMs=0,lastRestoreMs=0,lastRenderMs=0,studioSwitches=0;
const valid=id=>typeof EQUIPOS!=='undefined'&&Object.prototype.hasOwnProperty.call(EQUIPOS,id);
const active=()=>String(typeof equipoActivo==='undefined'?'':equipoActivo);
const teamName=id=>valid(id)?EQUIPOS[id].nombre:id;
function invoke(name,...args){const fn=window[name];return typeof fn==='function'?fn(...args):undefined}
function persistOutgoingTeam(){
  // Save pending text edits before touching the current team.
  invoke('vcTrainingFlushDraft');
  invoke('guardarEquipoEnMemoria');
  const id=active();
  const team=(typeof equiposData!=='undefined'&&equiposData)?equiposData[id]:null;
  if(team){
    if(typeof scoutingMatches!=='undefined'&&Array.isArray(scoutingMatches)){
      team.scoutingMatches=JSON.parse(JSON.stringify(scoutingMatches));
      team.scoutingActiveId=(typeof scoutingActiveId!=='undefined'&&scoutingActiveId)?Number(scoutingActiveId):null;
    }
    if(typeof scoutingGamePlans!=='undefined'&&Array.isArray(scoutingGamePlans)){
      team.scoutingGamePlans=JSON.parse(JSON.stringify(scoutingGamePlans));
    }
    if(typeof partidosEquipo!=='undefined'&&Array.isArray(partidosEquipo)){
      team.partidos=JSON.parse(JSON.stringify(partidosEquipo));
    }
  }
  // One canonical synchronous save. A failed write aborts the team switch.
  if(typeof guardarEstadoLocalSinCloud!=='function')throw new Error('Guardado local no disponible.');
  guardarEstadoLocalSinCloud();saveCount++;
}
function restoreIncoming(id){
  equipoActivo=id;
  localStorage.setItem(ACTIVE_TEAM_KEY,id);
  cargarEquipoEnVariables(id); // original wrappers initialize goals and attendance too
  const team=equiposData?.[id]||{};
  if(typeof partidosEquipo!=='undefined'){
    const src=team.partidos||[];
    partidosEquipo=typeof normalizarPartidos==='function'?normalizarPartidos(src):JSON.parse(JSON.stringify(src));
  }
  if(typeof scoutingMatches!=='undefined'){
    const src=Array.isArray(team.scoutingMatches)?team.scoutingMatches:[];
    scoutingMatches=src.map(m=>typeof scoutNormalizeMatch==='function'?scoutNormalizeMatch(m):JSON.parse(JSON.stringify(m)));
    scoutingActiveId=Number(team.scoutingActiveId)||null;
  }
  if(typeof scoutingGamePlans!=='undefined'){
    const src=Array.isArray(team.scoutingGamePlans)?team.scoutingGamePlans:[];
    scoutingGamePlans=src.map(p=>typeof scoutV660NormalizePlan==='function'?scoutV660NormalizePlan(p):JSON.parse(JSON.stringify(p)));
  }
  invoke('actualizarSelectorEquipo');
}
function refreshActiveView(){
  const id=document.querySelector('.view.active')?.id||'dashboard';
  const run=(name,...args)=>{try{if(typeof window[name]==='function'){window[name](...args);renderCount++}}catch(err){console.warn('Team Switch Pro: '+name,err)}};
  // Avoid rebuilding 20+ hidden screens. The normal navigation router refreshes
  // each screen when opened, so there is no need to render it here.
  if(id==='dashboard'){
    run('renderDashboard');run('renderDashboardPlayers');
  }else if(id==='entrenamiento'){
    run('cargarMeta');run('renderizarSesion');run('renderSessionRoster');
  }else if(id==='ejercicios'){
    run('filtrarEjercicios');
  }else if(id==='planificacion'){
    run('renderPlanificacion');
  }else if(id==='historial'){
    run('renderHistorial');
  }else if(id==='estadisticas'){
    run('renderStats');
  }else if(id==='jugadores'){
    run('renderPlayers');
  }else if(id==='scout-analysis'){
    const studio=window.VC_ANALYST_STUDIO_16155;
    const diag=studio?.diagnostics?.();
    if(studio?.onTeamChanged && diag?.loaded && !diag.technical){
      // Don't rebuild hidden legacy tables. Clear the old match selection
      // and refresh exactly the modern workspace once after changing team.
      try{studio.onTeamChanged();studioSwitches++;renderCount++}catch(err){console.warn('Team Switch Pro: studio',err)}
    }else run('scoutRenderAnalysis');
  }else if(id==='scout-match-mode'){
    run('v800Render');
  }else if(id==='scout-dashboard'){
    run('scoutRenderHome');
  }else if(id==='scout-workspace-v900'){
    run('scoutRender');
  }else if(id==='scout-plan'){
    run('scoutV660Render');
  }else if(id==='scout-matchup'){
    run('scoutV670Render');
  }else if(id==='scout-video-hub'){
    run('v780Render');
  }else if(id==='v11-management'){
    run('v11RefreshManagement');
  }
  run('v11RefreshShell');
}
function paintSelection(){
  const current=active();
  document.body.dataset.vcTeam=current;
  const trigger=byId('vc16041-team-trigger');
  if(trigger){
    const label=trigger.querySelector('.vc16041-team-label');
    if(label)label.textContent=teamName(current);
    trigger.setAttribute('aria-label','Cambiar equipo. Actual: '+teamName(current));
  }
  const title=byId('vc16041-current-name');if(title)title.textContent=teamName(current);
  const sidebarName=byId('v11-team-name');if(sidebarName)sidebarName.textContent=teamName(current);
  const subtitle=byId('vc16041-current-meta');
  if(subtitle){const t=typeof equiposData!=='undefined'?equiposData?.[current]:null;subtitle.textContent=`${Array.isArray(t?.jugadores)?t.jugadores.length:0} jugadores · ${Array.isArray(t?.scoutingMatches)?t.scoutingMatches.length:0} scoutings`;}
  for(const id of ['infantil','cadete']){
    const b=byId('vc16041-select-'+id);
    if(b){b.classList.toggle('selected',id===current);b.setAttribute('aria-pressed',String(id===current));}
    const side=byId('v11-team-'+id);
    if(side){side.classList.toggle('active',id===current);side.setAttribute('aria-pressed',String(id===current));}
  }
}
function setBusy(on,label){
  busy=on;
  const overlay=byId('vc16041-team-overlay');
  if(overlay){overlay.hidden=!on;overlay.querySelector('strong').textContent=label||'Preparando equipo…';}
  document.body.classList.toggle('vc16041-switching',on);
  ['infantil','cadete'].forEach(id=>{const b=byId('v11-team-'+id);if(b)b.disabled=on;const m=byId('vc16041-select-'+id);if(m)m.disabled=on;});
}
function notifyFailure(err){
  lastError=String(err?.message||err);
  console.error('Team Switch Pro:',err);
  const indicator=byId('save-indicator');if(indicator)indicator.textContent='⚠ No se ha cambiado de equipo · revisa el almacenamiento local';
  const status=byId('vc16041-error');if(status){status.textContent=lastError;status.hidden=false;}
}
function switchSync(target,fromUi=false){
  target=String(target||'');
  if(!valid(target))return false;
  if(busy&&!fromUi&&target!==active())return false;
  if(active()===target){paintSelection();return true}
  const previous=active();const start=performance.now();lastError='';
  try{
    let checkpoint=performance.now();
    persistOutgoingTeam();lastSaveMs=performance.now()-checkpoint;
    checkpoint=performance.now();restoreIncoming(target);lastRestoreMs=performance.now()-checkpoint;
    // Broadcast only after the canonical state belongs to the new team.
    try{window.MatchState?.touch?.('team:changed',{teamId:target,source:VERSION})}catch(err){console.warn('Team Switch Pro: MatchState',err)}
    try{window.dispatchEvent(new CustomEvent('vc:teamchange',{detail:{teamId:target,previousTeamId:previous,version:VERSION}}))}catch(_){ }
    const renderStart=performance.now();refreshActiveView();lastRenderMs=performance.now()-renderStart;
    paintSelection();changed++;
    lastDurationMs=performance.now()-start;
    const indicator=byId('save-indicator');if(indicator)indicator.textContent='✓ '+teamName(target)+' · equipo activo';
    // Preserve existing cloud scheduler, without replacing its implementation.
    try{invoke('programarSubidaCloud')}catch(err){console.warn('Team Switch Pro: cloud scheduling',err)}
    return true;
  }catch(err){
    // If a disk write fails before the switch, leave the original team untouched.
    // After an unexpected error, recover the previous canonical team from memory.
    if(active()!==previous){
      try{restoreIncoming(previous)}catch(recoveryError){console.error('Team Switch Pro: recovery',recoveryError)}
    }
    notifyFailure(err);paintSelection();return false;
  }
}
function positionMenu(){
  const m=byId('vc16041-team-menu'),trigger=byId('vc16041-team-trigger');
  if(!m||!trigger)return;
  const r=trigger.getBoundingClientRect();const w=window.innerWidth;
  const menuWidth=w<=800?Math.min(366,w-24):360;
  m.style.position='fixed';m.style.width=menuWidth+'px';m.style.right='auto';
  m.style.left=Math.max(12,Math.min(r.right-menuWidth,w-menuWidth-12))+'px';
  m.style.top=Math.min(r.bottom+8,window.innerHeight-70)+'px';
}
function setMenu(open){
  menuOpen=!!open;
  const m=byId('vc16041-team-menu');if(m){m.hidden=!menuOpen;if(menuOpen)positionMenu();}
  byId('vc16041-team-trigger')?.setAttribute('aria-expanded',String(menuOpen));
  if(menuOpen)paintSelection();
}
function nextPaint(){return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)))}
async function selectFromUi(target){
  target=String(target||'');if(!valid(target)||busy)return false;
  setMenu(false);
  if(target===active()){paintSelection();return true}
  setBusy(true,'Cargando '+teamName(target)+'…');
  await nextPaint();
  // switchSync allows the busy state set by this UI, but rejects other requests.
  const result=switchSync(target,true);
  setBusy(false);
  paintSelection();return result;
}
function buildUi(){
  if(byId('vc16041-team-trigger'))return;
  const top=byId('v11-topbar');if(!top)return;
  const wrapper=document.createElement('div');wrapper.className='vc16041-team-control';
  wrapper.innerHTML=`<button type="button" id="vc16041-team-trigger" aria-haspopup="true" aria-expanded="false"><span class="vc16041-team-dot"></span><span class="vc16041-team-text"><small>EQUIPO ACTIVO</small><b class="vc16041-team-label">Equipo</b></span><span class="vc16041-chevron">⌄</span></button>
    <div id="vc16041-team-menu" class="vc16041-team-menu" hidden role="group" aria-label="Seleccionar equipo"><div class="vc16041-menu-heading"><b>Cambiar de equipo</b><small>Datos y scouting independientes</small></div>
    <button type="button" id="vc16041-select-infantil" data-team="infantil"><span class="vc16041-team-avatar">IN</span><span><b>Infantil</b><small>Entrenamientos · Scouting · Jugadores</small></span><span class="vc16041-check">✓</span></button>
    <button type="button" id="vc16041-select-cadete" data-team="cadete"><span class="vc16041-team-avatar">CA</span><span><b>Cadete</b><small>Entrenamientos · Scouting · Jugadores</small></span><span class="vc16041-check">✓</span></button>
    <p class="vc16041-menu-note">Se conserva la información de ambos equipos. Solo se actualiza la pantalla abierta.</p><p id="vc16041-error" role="alert" hidden></p></div>`;
  top.insertBefore(wrapper,top.querySelector('.v11-topbar-actions'));
  wrapper.querySelector('#vc16041-team-trigger').addEventListener('click',()=>setMenu(!menuOpen));
  wrapper.querySelectorAll('[data-team]').forEach(b=>b.addEventListener('click',()=>void selectFromUi(b.dataset.team)));
  const menu=byId('vc16041-team-menu');if(menu)document.body.appendChild(menu); // outside header's stacking context
  document.addEventListener('click',e=>{if(menuOpen&&!wrapper.contains(e.target)&&!menu?.contains(e.target))setMenu(false)});
  window.addEventListener('resize',()=>{if(menuOpen)positionMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
  const banner=document.createElement('div');banner.id='vc16041-team-context';banner.setAttribute('aria-live','polite');
  banner.innerHTML='<span class="vc16041-banner-icon">VC</span><span><small>TRABAJANDO CON</small><b id="vc16041-current-name">—</b></span><span id="vc16041-current-meta"></span>';
  const dashboard=byId('dashboard');if(dashboard)dashboard.insertBefore(banner,dashboard.firstChild);
  const overlay=document.createElement('div');overlay.id='vc16041-team-overlay';overlay.hidden=true;
  overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');overlay.innerHTML='<div class="vc16041-overlay-card"><span class="vc16041-loader"></span><div><strong>Preparando equipo…</strong><small>Protegiendo los datos y actualizando la pantalla</small></div></div>';
  document.body.appendChild(overlay);
  paintSelection();
}
// Route existing buttons through the new switcher without changing source modules.
window.cambiarEquipo=switchSync;
window.v1524SwitchTeam=switchSync;
window.v11SetTeam=id=>{void selectFromUi(id);return true};
// The v1524 implementation attached direct onclick closures to these buttons.
// They call the updated v11SetTeam global, so both legacy controls still work.
function boot(){buildUi();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.VC_TEAM_SWITCH_PRO={version:VERSION,switchNow:switchSync,select:selectFromUi,diagnostics:()=>({version:VERSION,activeTeam:active(),changes:changed,lastDurationMs:Math.round(lastDurationMs),lastSaveMs:Math.round(lastSaveMs),lastRestoreMs:Math.round(lastRestoreMs),lastRenderMs:Math.round(lastRenderMs),studioSwitches,saved:saveCount,viewRenders:renderCount,busy,lastError})};
})();
