/* Volley Coach V16.4.0 · Scouting Pro Cockpit
   UI coordination only: no alternative point, action, storage or sync engine.
   Uses existing V8/V9/V11 video + the V16.1.7 9×4 zone board.
   In particular, never creates new scoring or action-recording handlers. */
(()=>{
 'use strict';
 if(window.VC_SCOUT_COCKPIT_1640)return;
 const $=id=>document.getElementById(id);
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const POS_FRONT=['p4','p3','p2'],POS_BACK=['p5','p6','p1'];
 const POS_RIVAL_FRONT=['p2','p3','p4'],POS_RIVAL_BACK=['p1','p6','p5'];
 const modes=new Set(['video','directo','revisar','analizar','visual']);
 const $match=()=>{
  const bridge=window.VC_SCOUT_VIDEO_BRIDGE;
  const active=bridge?.getActive?.();if(active)return active;
  const selected=$('v800-match-select')?.value;
  return selected?(bridge?.getMatches?.()||[]).find(m=>String(m?.id)===String(selected))||null:null;
 };
 const activeView=()=>!!$('scout-match-mode')?.classList.contains('active');
 let mounted=false,activated=false,pending=false,lastSignature='',rendered=0,switches=0,lastError='';
 let rosterCache=[];
 let refreshObservers=[];
 function rememberPreference(mode){try{localStorage.setItem('vc1640_preferred_mode',mode)}catch(_){}}
 function preferred(){try{const value=localStorage.getItem('vc1640_preferred_mode');if(modes.has(value))return value}catch(_){}return 'video'}
 function invoke(name){const fn=window[name];if(typeof fn!=='function'){lastError=`No disponible: ${name}`;announce(lastError);return false}try{fn();return true}catch(err){lastError=String(err?.message||err);console.warn('[VC1640] Control no disponible',name,err);announce('No se ha podido completar esta acción');return false}}
 function announce(s){const el=$('vc1640-feedback');if(el)el.textContent=s}
 function currentMode(){return $('v800-shell')?.dataset.vc52Mode||'visual'}
 function selectMode(mode,userInitiated=false){
  if(!modes.has(mode))return false;
  if(typeof window.vc52SetMode!=='function'){announce('El modo partido todavía no está preparado');return false}
  try{window.vc52SetMode(mode);switches++;if(userInitiated)rememberPreference(mode);refresh();return true}
  catch(err){lastError=String(err?.message||err);announce('No se ha podido cambiar la vista');return false}
 }
 function isFinished(){return $match()?.status==='finished'}
 function playerLabel(raw,ours=true){
  if(!ours)return String(raw||'—');
  const id=Number(raw);if(!Number.isFinite(id)||id<=0)return '—';
  const p=rosterCache.find(x=>Number(x?.id)===id);
  if(!p)return `ID ${id}`;
  const number=p.number??p.dorsal??'';
  return number!==''?`#${number}`:(p.name?String(p.name).slice(0,11):`ID ${id}`);
 }
 function miniCourt(lineup,ours,positions){
  const rows=[positions[0],positions[1]];
  const htmlCells=rows.flatMap((row,i)=>row.map(pos=>{
   const who=playerLabel(lineup?.[pos],ours);
   return `<div class="vc1640-slot" title="${escapeHtml(`${pos.toUpperCase()}: ${who}`)}"><small>${escapeHtml(pos.toUpperCase())}</small><b>${escapeHtml(who)}</b></div>`;
  })).join('');
  return `<div class="vc1640-mini-court" aria-label="Alineación de ${ours?'nuestro equipo':'equipo rival'}">${htmlCells}</div>`;
 }
 function build(){
  const live=$('v800-live'),nav=$('vc52-modes'),code=$('v113-video-code-panel');
  if(!live||!nav||!code)return false;
  if(!$('vc1640-commandbar')){
   const host=document.createElement('section');host.id='vc1640-commandbar';host.setAttribute('aria-label','Centro de control Scouting Pro 3.0');
   host.innerHTML=`<div class="vc1640-heading"><strong>SCOUTING PRO 3.0</strong><span>Una sola sesión de partido · vídeo, código, zonas y rotaciones</span><small>V16.4.0</small></div><div class="vc1640-commandrow"><div class="vc1640-tabs" role="group" aria-label="Vistas de trabajo">
      <button type="button" data-vc1640-mode="video">▶ Partido Pro</button>
      <button type="button" data-vc1640-mode="directo">⌨ Sin vídeo</button>
      <button type="button" data-vc1640-mode="revisar">≡ Revisar rallies</button>
      <button type="button" data-vc1640-mode="analizar">▥ Lectura</button>
     </div><div class="vc1640-quicktools" role="group" aria-label="Herramientas de partido">
      <button type="button" data-vc1640-tool="code">Ir al código</button>
      <button type="button" data-vc1640-tool="lineup">Alineación</button>
      <button type="button" data-vc1640-tool="changes">Cambios</button>
      <button type="button" data-vc1640-tool="finish">Finalizar set</button>
      <details id="vc1640-extra"><summary>Más opciones</summary><div class="vc1640-extra-actions">
       <button type="button" data-vc1640-tool="newset">Nuevo set</button>
       <button type="button" data-vc1640-tool="note">Nota vídeo</button>
       <button type="button" data-vc1640-tool="save">Guardar ahora</button>
       <button type="button" data-vc1640-tool="undo">Deshacer punto</button>
       <button type="button" data-vc1640-tool="restore">Actualizar panel</button>
      </div><div id="vc1640-legacy-slot"><span>Modos adicionales</span></div></details>
     </div></div>
     <div class="vc1640-context"><span id="vc1640-phase">Partido preparado</span><span id="vc1640-rotation">Rotaciones: —</span><span id="vc1640-serving">Saque: —</span><span id="vc1640-rail-rally">Rally: —</span><span id="vc1640-libero">Líbero: —</span><span id="vc1640-safe">Guardado: —</span><span id="vc1640-feedback" role="status" aria-live="polite">Usa los controles originales de registro y puntuación.</span></div>`;
   nav.parentNode?.insertBefore(host,nav);
   $('vc1640-legacy-slot')?.appendChild(nav);
   host.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!host.contains(b))return;
    if(b.dataset.vc1640Mode){selectMode(b.dataset.vc1640Mode,true);return}
    if(b.dataset.vc52Mode&&modes.has(b.dataset.vc52Mode))rememberPreference(b.dataset.vc52Mode);
    const tool=b.dataset.vc1640Tool;
    if(!tool)return;
    if(tool==='code'){
      const isVideo=currentMode()==='video';const input=$(isVideo?'v113-video-code':'v800-code')||$('v113-video-code');
      if(input?.getClientRects()?.length){input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'auto'})}
      else{selectMode('video',true);requestAnimationFrame(()=>$('v113-video-code')?.focus({preventScroll:true}))}
      return;
    }
    if(tool==='restore'){refresh(true);announce('Contexto actualizado.');return}
    const calls={lineup:'scoutOpenLineup',changes:'v120OpenChanges',finish:'v120OpenFinishSet',newset:'v121OpenNewSet',note:'v851OpenVideoNote',save:'v117ProSave',undo:'v121UndoRally'};
    if(isFinished()&&['changes','finish','newset','undo'].includes(tool)){announce('Partido finalizado · solo lectura.');return}
    if(calls[tool])invoke(calls[tool]);
   });
  }
  if(!$('vc1640-lineups')){
   const details=document.createElement('details');details.id='vc1640-lineups';
   details.innerHTML='<summary><b>Rotaciones y alineación</b><span id="vc1640-lineup-summary">Nuestro R— · Rival R—</span></summary><div class="vc1640-lineups-grid"><div><strong>NUESTRO EQUIPO</strong><div id="vc1640-own-court"></div></div><div><strong>RIVAL</strong><div id="vc1640-rival-court"></div></div></div><p>Vista de posiciones registradas. Para cambiarlas, utiliza «Alineación»; esta pista no modifica el scouting.</p>';
   const entry=code.querySelector('.v113-video-code-entry');
   if(entry)entry.insertAdjacentElement('afterend',details);else code.insertBefore(details,code.firstChild);
  }
  mounted=true;return true;
 }
 function refresh(force=false){
  if(!mounted)return false;
  const m=$match(),mode=currentMode(),status=$('vc1640-feedback');
  document.querySelectorAll('#vc1640-commandbar [data-vc1640-mode]').forEach(b=>{
   const current=mode===b.dataset.vc1640Mode;b.classList.toggle('active',current);b.setAttribute('aria-pressed',String(current));
  });
  const disabled=!m||m.status==='finished';
  for(const btn of document.querySelectorAll('#vc1640-commandbar [data-vc1640-tool]')){
   btn.disabled=disabled&&['changes','finish','newset','undo'].includes(btn.dataset.vc1640Tool);
  }
  const set=m?.sets?.find(s=>Number(s.number)===Number(m.currentSet))||null;
  const libero=m?.libero||{};
  try{rosterCache=window.VC_SCOUT_VIDEO_BRIDGE?.getPlayers?.()||[]}catch(_){rosterCache=[]}
  const liberoLabel=libero.enabled?`Líbero ${playerLabel(libero.activePlayerId||libero.playerId)}`:'Sin líbero activo';
  const teamLabel=m?.servingTeam==='opponent'?'Rival':'Nuestro';
  const rallyIndex=(set?.rallies?.length||0)+1;
  const videoState=String($('v802-sync-badge')?.textContent||'').trim();
  const saveState=String($('v117-pro-save-state')?.textContent||'').trim();
  const sig=JSON.stringify([m?.id,m?.updatedAt,m?.status,m?.currentSet,m?.rotationNo,m?.opponentRotationNo,m?.servingTeam,m?.lineup,m?.libero?.activePlayerId,m?.libero?.pendingReason,set?.rallies?.length,m?.liveRally?.actions?.length,saveState,videoState]);
  if(sig!==lastSignature||force){
   lastSignature=sig;rendered++;
   const values={
    'vc1640-phase':!m?'Sin partido':m.status==='finished'?'Partido finalizado':`Set ${m.currentSet||1} · En juego`,
    'vc1640-rotation':m?`Rotación: R${m.rotationNo||1} / Rival R${m.opponentRotationNo||1}`:'Rotación: —',
    'vc1640-serving':m?`Saque: ${teamLabel}`:'Saque: —',
    'vc1640-rail-rally':m?`Rally ${rallyIndex} · ${(m.liveRally?.actions||[]).length} acciones`:'Rally: —',
    'vc1640-libero':m?liberoLabel:'Líbero: —',
    'vc1640-safe':`Guardado: ${saveState||'estado no disponible'}`,
    'vc1640-lineup-summary':m?`Nuestro R${m.rotationNo||1} · Rival R${m.opponentRotationNo||1}`:'Sin partido'
   };
   Object.entries(values).forEach(([key,value])=>{const el=$(key);if(el&&el.textContent!==value)el.textContent=value});
   const own=$('vc1640-own-court'),rival=$('vc1640-rival-court');
   const ownMarkup=miniCourt(m?.lineup?.ours,true,[POS_FRONT,POS_BACK]);
   const oppMarkup=miniCourt(m?.lineup?.opponent,false,[POS_RIVAL_FRONT,POS_RIVAL_BACK]);
   if(own&&own.innerHTML!==ownMarkup)own.innerHTML=ownMarkup;
   if(rival&&rival.innerHTML!==oppMarkup)rival.innerHTML=oppMarkup;
  }
  if(status&&isFinished())status.textContent='Partido finalizado: los controles de edición de este panel están bloqueados.';
  return true;
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;ensurePreferred()})}
 function ensurePreferred(){
  if(!activeView()){activated=false;return}
  const m=$match();if(!m){activated=false;refresh();return}
  if(!activated&&m.status!=='finished'){activated=true;const p=preferred();if(p!==currentMode())selectMode(p);}
  refresh();
 }
 function observe(node,opts){if(!node)return;const obs=new MutationObserver(schedule);obs.observe(node,opts);refreshObservers.push(obs)}
 function boot(){
  if(!build())return;
  observe($('v800-score-us'),{childList:true,characterData:true,subtree:true});
  observe($('v800-score-op'),{childList:true,characterData:true,subtree:true});
  observe($('v800-title'),{childList:true,characterData:true,subtree:true});
  observe($('v800-rotation-title'),{childList:true,characterData:true,subtree:true});
  observe($('v113-video-rally-actions'),{childList:true,subtree:true});
  observe($('v117-pro-save-state'),{childList:true,characterData:true,subtree:true});
  observe($('v800-shell'),{attributes:true,attributeFilter:['data-vc52-mode']});
  $('v800-match-select')?.addEventListener('change',schedule);
  if($('scout-match-mode')){
   const obs=new MutationObserver(ensurePreferred);obs.observe($('scout-match-mode'),{attributes:true,attributeFilter:['class']});refreshObservers.push(obs);
  }
  const store=window.MatchState;
  try{if(typeof store?.subscribe==='function')store.subscribe(schedule)}catch(err){console.warn('VC1640: state subscription unavailable',err)}
  ensurePreferred();
 }
 const STYLE=`
 body.v11-shell #scout-match-mode #vc1640-commandbar{position:relative;margin:11px 0 9px;padding:12px 14px;background:#fff;border:1px solid #dbe6ee;border-radius:14px;box-shadow:0 5px 17px #102a4810;color:#17344f;font:600 12px/1.4 system-ui,sans-serif}
 body.v11-shell #scout-match-mode #vc1640-commandbar *{box-sizing:border-box}
 #scout-match-mode #vc1640-commandbar .vc1640-heading{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px;color:#2b6389}#scout-match-mode #vc1640-commandbar .vc1640-heading strong{font-size:11px;font-weight:900;letter-spacing:.09em;color:#124876}#scout-match-mode #vc1640-commandbar .vc1640-heading span{font-size:10px;color:#6d879d}#scout-match-mode #vc1640-commandbar .vc1640-heading small{margin-left:auto;font-size:10px;font-weight:900;color:#497797}
 #scout-match-mode #vc1640-commandbar .vc1640-commandrow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 #scout-match-mode #vc1640-commandbar .vc1640-tabs{display:flex;gap:6px;flex-wrap:wrap;flex:1 1 460px}
 body.v11-shell #scout-match-mode #vc1640-commandbar button{min-height:36px!important;padding:8px 11px!important;border-radius:8px!important;border:1px solid #cad9e6!important;background:#f7faff!important;color:#254c69!important;font:750 11px/1.2 system-ui,sans-serif!important;white-space:nowrap!important;box-shadow:none!important}
 body.v11-shell #scout-match-mode #vc1640-commandbar button.active{background:#145a91!important;color:#fff!important;border-color:#145a91!important}
 body.v11-shell #scout-match-mode #vc1640-commandbar button:disabled{opacity:.45!important;cursor:not-allowed}
 #scout-match-mode #vc1640-commandbar .vc1640-quicktools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
 body.v11-shell #scout-match-mode #vc1640-commandbar [data-vc1640-tool="code"]{background:#e8f4fb!important;border-color:#adcee5!important;color:#185b86!important}
 #scout-match-mode #vc1640-commandbar .vc1640-context{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid #e5edf3;color:#426481;font-size:10px;font-weight:750}
 #scout-match-mode #vc1640-commandbar .vc1640-context span{border-radius:7px;border:1px solid #e0e9f1;padding:5px 8px;background:#f6f9fc}
 #scout-match-mode #vc1640-commandbar #vc1640-feedback{flex:1 1 240px;color:#6b8395;background:transparent;border-style:dashed}
 #scout-match-mode #vc1640-commandbar #vc1640-extra{position:relative;z-index:32}
 #scout-match-mode #vc1640-commandbar #vc1640-extra>summary{cursor:pointer;list-style:none;min-height:36px;padding:9px 12px;border-radius:8px;background:#f3f8fc;border:1px solid #d5e3ee;color:#335c7a;font-weight:750;font-size:11px}
 #scout-match-mode #vc1640-commandbar #vc1640-extra>summary::-webkit-details-marker{display:none}
 #scout-match-mode #vc1640-commandbar #vc1640-extra[open]{flex:0 0 100%}
 #scout-match-mode #vc1640-commandbar .vc1640-extra-actions{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0}
 #scout-match-mode #vc1640-commandbar #vc1640-legacy-slot>span{display:block;margin:4px 0;font-size:10px;color:#71879a}
 body.v11-shell #scout-match-mode #vc1640-commandbar #vc52-modes{display:flex!important;gap:5px;position:static!important;background:#f4f8fb!important;border:1px solid #e2eaf2!important;border-radius:8px!important;padding:7px!important;margin:0!important;overflow-x:auto;max-width:100%}
 body.v11-shell #scout-match-mode #vc1640-commandbar #vc52-modes button{min-width:110px!important;flex:1!important}
 body.v11-shell #scout-match-mode #v113-video-score{display:none!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater){grid-template-columns:minmax(0,1.58fr) minmax(318px,.82fr)!important;gap:14px!important;align-items:start!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>.v112-video-card{min-width:0!important;grid-column:1!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>#v113-video-code-panel{grid-column:2!important;position:relative!important;top:auto!important;max-height:none!important;overflow:visible!important}
 body.v11-shell #scout-match-mode #v113-video-code-panel #vc1640-lineups{margin:10px 0;border:1px solid #cdddea;border-radius:10px;background:#f6faff;padding:10px;color:#294961;min-width:0}
 #scout-match-mode #vc1640-lineups summary{cursor:pointer;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:11px;list-style:none}
 #scout-match-mode #vc1640-lineups summary::-webkit-details-marker{display:none}
 #scout-match-mode #vc1640-lineups summary span{color:#557993;font-size:10px;font-weight:750}
 #scout-match-mode #vc1640-lineups .vc1640-lineups-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:11px}
 #scout-match-mode #vc1640-lineups .vc1640-lineups-grid>div>strong{display:block;text-align:center;color:#29567a;font-size:9px;letter-spacing:.05em;margin-bottom:5px}
 #scout-match-mode #vc1640-lineups .vc1640-mini-court{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;border:2px solid #a7bfcd;border-radius:6px;padding:5px;background:linear-gradient(90deg,#d8e8f6 0%,#f5fafc 100%)}
 #scout-match-mode #vc1640-lineups .vc1640-slot{min-width:0;background:#fff;border:1px solid #cadde9;border-radius:5px;min-height:37px;padding:4px 1px;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:2px}
 #scout-match-mode #vc1640-lineups .vc1640-slot small{font-size:8px;color:#698ba5}
 #scout-match-mode #vc1640-lineups .vc1640-slot b{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#193c5e}
 #scout-match-mode #vc1640-lineups p{font-size:9px;color:#6b859c;line-height:1.4;margin:8px 0 0}
 @media(max-width:1100px){body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater){grid-template-columns:minmax(0,1fr)!important}body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>.v112-video-card,body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>#v113-video-code-panel{grid-column:1!important;grid-row:auto!important;position:static!important}body.v11-shell #scout-match-mode #vc1640-commandbar{padding:10px}}
 @media(max-width:650px){#scout-match-mode #vc1640-commandbar .vc1640-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));flex-basis:100%}#scout-match-mode #vc1640-commandbar .vc1640-quicktools{flex:1 1 100%}#scout-match-mode #vc1640-lineups .vc1640-lineups-grid{grid-template-columns:1fr}}
 @media(prefers-reduced-motion:reduce){#scout-match-mode #vc1640-commandbar button{transition:none!important}}
 `;
 function installStyle(){if($('vc1640-style'))return;const el=document.createElement('style');el.id='vc1640-style';el.textContent=STYLE;document.head.appendChild(el)}
 function start(){installStyle();boot()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.VC_SCOUT_COCKPIT_1640={version:'16.4.0',mount:()=>{installStyle();return build()},refresh:()=>refresh(true),mode:selectMode,diagnostics:()=>({mounted,mode:currentMode(),active:activeView(),matchId:$match()?.id||null,scoreEngineUnchanged:true,codeEngineUnchanged:true,updates:rendered,switches,observers:refreshObservers.length,lastError,zoneBoard:!!$('vc1613-board'),deviceCount:($('vc52-peer-count')?.textContent||'').trim()})};
})();
