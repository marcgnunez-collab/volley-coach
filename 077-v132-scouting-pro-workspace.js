/* V16.0.6.2 · Scouting rendering optimizations (no state or save changes). */

(()=>{
'use strict';
const VERSION='13.2.0', $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const POS=['p4','p3','p2','p5','p6','p1'];
let editRef=null, courtMode='origin', renderQueued=false, courtRenderKey='';
const vc162Perf={renderCount:0,renderMs:0,lastRenderMs:0,recentVisited:0,recentBuilt:0,historyDomWrites:0,historyDomSkipped:0,playerDomWrites:0,playerDomSkipped:0,courtDomSkipped:0,courtDomWrites:0};
window.VC_V162_SCOUT_DIAGNOSTICS=()=>({...vc162Perf});
function State(){return window.MatchState||window.VC_MATCH_STATE}
function match(){return State()?.getActive?.()||window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}
function setOf(m=match()){return State()?.getSet?.(m)||window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)||null}
function players(){try{return window.VC_SCOUT_VIDEO_BRIDGE?.getPlayers?.()||[]}catch(_){return[]}}
function teamName(){try{return window.VC_SCOUT_VIDEO_BRIDGE?.teamName?.()||'Nuestro equipo'}catch(_){return'Nuestro equipo'}}
function playerLabel(a){try{return window.VC_SCOUT_VIDEO_BRIDGE?.playerLabel?.(a)||String(a?.playerLabel||a?.playerNameSnapshot||a?.playerNumberSnapshot||'Jugador')}catch(_){return String(a?.playerLabel||'Jugador')}}
function fmtVideo(sec){const n=Number(sec);if(!Number.isFinite(n)||n<0)return'—';const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=Math.floor(n%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`}
function actionTime(a){for(const k of['videoTimestamp','liveVideoTime','videoAction','videoTime']){const raw=a?.[k];if(raw==null||raw==='')continue;const n=Number(raw);if(Number.isFinite(n)&&n>=0)return n}return null}
function readonly(){return !!State()?.isReadonly?.()}
function buildCockpit(){
  if($('v132-cockpit'))return;
  const live=$('v900-live'),anchor=$('v120-match-management')||live?.firstElementChild;if(!live||!anchor)return;
  const node=document.createElement('section');node.id='v132-cockpit';node.className='v132-cockpit';node.innerHTML=`
    <article class="v132-cockpit-card"><div class="v132-cockpit-head"><span>JUGADOR / EQUIPO ACTIVO</span><b id="v132-active-copy">Listo</b></div><div class="v132-cockpit-body"><div class="v132-active-grid"><label><span>Equipo</span><select id="v132-team" onchange="v132SetTeam(this.value)"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label><span>Jugador</span><select id="v132-player" onchange="v132SetPlayer(this.value)"></select></label></div><div class="v132-live-note"><div><span>Rotación</span><b id="v132-rotation">R1 · Rival R1</b></div><div><span>Fase</span><b id="v132-phase">K2 · Break</b></div></div></div></article>
    <article class="v132-cockpit-card"><div class="v132-cockpit-head"><span>CÓDIGO SIEMPRE VISIBLE</span><b>ENTER · registrar</b></div><div class="v132-cockpit-body"><div class="v132-quick-code"><input id="v132-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ej. 8A#.4B>5D::X5~T%HSP" oninput="v132Translate()" onkeydown="if(event.key==='Enter'){event.preventDefault();v132RegisterCode()}"><button type="button" class="primary" onclick="v132RegisterCode()">Registrar</button></div><div id="v132-code-hint" class="v132-code-hint">Código DataVolley · usa el mismo parser de Scouting Pro.</div><div class="v132-quick-skills">${Object.entries(SKILLS).map(([k,v])=>`<button type="button" data-v132-skill="${k}" onclick="v132SetSkill('${k}')"><b>${k}</b><span>${v}</span></button>`).join('')}</div></div></article>
    <article class="v132-cockpit-card tools"><div class="v132-cockpit-head"><span>TRABAJO EN PARTIDO</span><b id="v132-save-copy">MatchState ✓</b></div><div class="v132-cockpit-body"><div class="v132-live-tools"><button type="button" class="primary wide" onclick="v132OpenVideo()">▶ Vídeo + código</button><button type="button" class="ghost" onclick="v121OpenRallyEditor()">Editar rallies</button><button type="button" class="ghost" onclick="v119OpenLineup()">Alineación</button><button type="button" class="ghost" onclick="v122OpenMatchSwitcher()">Cambiar scouting</button><button type="button" class="ghost" onclick="v119SaveAll(true)">Guardar todo</button></div><div class="v132-live-note"><div><span>Marcador</span><b id="v132-score">0–0</b></div><div><span>Último vídeo</span><b id="v132-last-video">—</b></div></div></div></article>`;
  anchor.insertAdjacentElement('afterend',node);
}
function buildRecent(){
  if($('v132-recent-card'))return;
  const col=document.querySelector('#v900-phase-scout .v111-intel-column');if(!col)return;
  const node=document.createElement('article');node.id='v132-recent-card';node.className='v132-recent-card';node.innerHTML='<div class="v132-recent-head"><div><span>HISTORIAL INMEDIATO</span><b>Últimas acciones · clic para corregir</b></div><button type="button" class="ghost" onclick="v121OpenRallyEditor()">Todos los rallies</button></div><div id="v132-recent-list" class="v132-recent-list"></div>';
  col.prepend(node);
}
function buildCourt(){
  const area=$('v900-location-area');if(!area)return;
  let box=$('v132-court-wrap');if(!box){box=document.createElement('div');box.id='v132-court-wrap';area.prepend(box)}
  const st=window.VC_V900_STATE||{}, skill=st.skill||'R';
  if(['R','D'].includes(skill))courtMode='destination';if(skill==='B')courtMode='origin';
  const modes=(skill==='R'||skill==='D')?['destination']:(skill==='B'?['origin']:['origin','destination']);
  if(!modes.includes(courtMode))courtMode=modes[0];
  const currentZone=courtMode==='origin'?String(st.origin||''):String(st.destination||''),currentSub=courtMode==='origin'?String(st.originSub||''):String(st.destinationSub||'');
  const order=[4,3,2,7,8,9,5,6,1];
  const signature=[skill,courtMode,currentZone,currentSub].join('|');
  if(signature===courtRenderKey&&box.querySelector('.v132-court-9x4')){vc162Perf.courtDomSkipped++;return;}
  courtRenderKey=signature;vc162Perf.courtDomWrites++;
  box.innerHTML=`<div class="v132-court-title"><div><b>Pista DataVolley 9×4</b><small>${skill==='R'||skill==='D'?'Marca contacto':skill==='B'?'Marca zona de bloqueo':'Marca origen y destino'}</small></div><div class="v132-court-mode">${modes.map(x=>`<button type="button" class="ghost ${courtMode===x?'active':''}" onclick="v132CourtMode('${x}')">${x==='origin'?'Origen':'Destino'}</button>`).join('')}</div></div><div class="v132-court-9x4">${order.map(z=>`<div class="v132-zone" data-zone="${z}">${['A','B','C','D'].map(sub=>`<button type="button" class="${currentZone===String(z)&&currentSub===sub?'active':''}" title="Z${z}${sub}" onclick="v132SelectCourt('${courtMode}','${z}','${sub}')">${sub}</button>`).join('')}</div>`).join('')}</div><div class="v132-court-legend"><span><b>${courtMode==='origin'?'ORIGEN':'DESTINO'}:</b> ${currentZone?`Z${currentZone}${currentSub}`:'sin marcar'}</span><span>A–D = subzonas</span></div>`;
}
function setPlayers(){
  const st=window.VC_V900_STATE||{},m=match(),team=$('v132-team'),sel=$('v132-player');if(!team||!sel||!m)return;
  const teamValue=st.team==='opponent'?'opponent':'ours';
  if(team.value!==teamValue)team.value=teamValue;
  let rows=[];
  if(team.value==='ours')rows=players().map(p=>({v:String(p.id),l:`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`}));
  else rows=POS.map(pos=>String(m.lineup?.opponent?.[pos]||'').trim()).filter(Boolean).map(v=>({v,l:v}));
  const seen=new Set();rows=rows.filter(x=>x.v&&!seen.has(x.v)&&seen.add(x.v));
  const markup=rows.length?rows.map(x=>`<option value="${esc(x.v)}">${esc(x.l)}</option>`).join(''):'<option value="">Sin jugador</option>';
  if(sel.innerHTML!==markup){sel.innerHTML=markup;vc162Perf.playerDomWrites++;}else vc162Perf.playerDomSkipped++;
  if(rows.some(x=>String(x.v)===String(st.player)))sel.value=String(st.player);else if(rows[0])sel.value=rows[0].v;
  const active=rows.find(x=>String(x.v)===String(sel.value));$('v132-active-copy').textContent=active?.l||'Selecciona jugador';
}
/* Read only the latest 18 actions. Previous code rebuilt the entire match history
   on every UI update, even when only one new action had been recorded. */
function allRecent(){
  const m=match();if(!m)return[];
  const out=[],limit=18,s=setOf(m);
  const live=m.liveRally?.actions||[];
  for(let i=live.length-1;i>=0&&out.length<limit;i--){
    const a=live[i];vc162Perf.recentVisited++;
    out.push({a,live:true,setNo:Number(m.currentSet)||1,rallyId:Number(m.liveRally?.id)||0,index:i,score:`${s?.scoreUs||0}–${s?.scoreOpponent||0}`,rotation:Number(m.rotationNo)||1});
  }
  const sets=m.sets||[];
  for(let si=sets.length-1;si>=0&&out.length<limit;si--){
    const set=sets[si],rallies=set.rallies||[];
    for(let ri=rallies.length-1;ri>=0&&out.length<limit;ri--){
      const r=rallies[ri],actions=r.actions||[];
      for(let ai=actions.length-1;ai>=0&&out.length<limit;ai--){
        vc162Perf.recentVisited++;
        out.push({a:actions[ai],live:false,setNo:Number(set.number)||1,rallyId:Number(r.id)||0,index:ai,score:`${r.scoreAfter?.us??0}–${r.scoreAfter?.opponent??0}`,rotation:Number(r.rotationBefore)||1});
      }
    }
  }
  vc162Perf.recentBuilt++;
  return out;
}
function renderRecent(rows=allRecent()){
  const box=$('v132-recent-list');if(!box)return;
  const markup=rows.length?rows.map((x,idx)=>{const t=actionTime(x.a),key=x.live?'':`a:${x.setNo}:${x.rallyId}:${x.a.id}`;return `<div class="v132-action-row"><div class="v132-action-context"><span>S${x.setNo} · R${x.rotation}</span><b>${esc(x.score)}</b></div><div class="v132-action-main"><code>${esc(x.a.code||'—')}</code><span>${esc(playerLabel(x.a))} · ${esc(SKILLS[x.a.skill]||x.a.skill||'Acción')}${t!=null?` · <i class="v132-video-time">▶ ${fmtVideo(t)}</i>`:''}</span></div><div class="v132-action-tools">${key?`<button type="button" class="ghost" onclick="v132PlayAction('${key}')" title="Abrir vídeo">▶</button>`:''}<button type="button" class="ghost" onclick="v132OpenActionEditor(${idx})">Editar</button></div></div>`}).join(''):'<div class="v132-no-actions">Todavía no hay acciones. El historial aparecerá aquí mientras scouteas.</div>';
  if(box.innerHTML!==markup){box.innerHTML=markup;vc162Perf.historyDomWrites++;}else vc162Perf.historyDomSkipped++;
  window.__v132Recent=rows;
}
function renderCockpit(){
  const started=performance.now();
  buildCockpit();buildRecent();setPlayers();buildCourt();
  const recent=allRecent();renderRecent(recent);
  const st=window.VC_V900_STATE||{},m=match(),s=setOf(m);
  if(m){
    $('v132-rotation').textContent=`R${m.rotationNo||1} · Rival R${m.opponentRotationNo||1}`;
    $('v132-phase').textContent=m.servingTeam==='opponent'?'K1 · Side-out':'K2 · Break';
    $('v132-score').textContent=`${s?.scoreUs||0}–${s?.scoreOpponent||0}`;
    document.querySelectorAll('[data-v132-skill]').forEach(b=>b.classList.toggle('active',b.dataset.v132Skill===st.skill));
    const withVideo=recent.find(x=>actionTime(x.a)!=null),t=withVideo?actionTime(withVideo.a):null;
    $('v132-last-video').textContent=t!=null?fmtVideo(t):'Sin vínculo';
    $('v132-save-copy').textContent=readonly()?'Solo lectura':'MatchState ✓';
  }
  vc162Perf.renderCount++;vc162Perf.lastRenderMs=performance.now()-started;vc162Perf.renderMs+=vc162Perf.lastRenderMs;
}
function queueRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;try{renderCockpit()}catch(e){console.error('V13.2 render',e)}})}
window.v132SetTeam=function(t){window.v900SetTeam?.(t);setTimeout(queueRender,0)};
window.v132SetPlayer=function(v){window.v900SelectPlayer?.(v);setTimeout(queueRender,0)};
window.v132SetSkill=function(k){window.v900SetSkill?.(k);setTimeout(queueRender,0)};
window.v132Translate=function(){const raw=String($('v132-code')?.value||'');const hidden=$('v900-code-input');if(hidden){hidden.value=raw;window.v900TranslateCode?.();$('v132-code-hint').textContent=$('v900-code-translation')?.textContent||'Código DataVolley'} };
window.v132RegisterCode=async function(){if(readonly())return alert('Este partido está finalizado y está abierto en modo solo lectura.');const raw=String($('v132-code')?.value||'').trim();if(!raw)return;$('v900-code-input').value=raw;try{await Promise.resolve(window.v900RegisterCode?.());$('v132-code').value='';$('v132-code-hint').textContent='Acción registrada · guardado automático';queueRender()}catch(e){console.error(e)}};
window.v132CourtMode=function(m){courtMode=m==='destination'?'destination':'origin';buildCourt()};
window.v132SelectCourt=function(mode,z,sub){window.v900SetZone?.(mode,z);window.v900SetSubzone?.(mode,sub);courtMode=mode;setTimeout(buildCourt,0)};
window.v132OpenVideo=function(){try{window.v11Navigate?.('match')}catch(_){}setTimeout(()=>{try{window.v910SetMatchView?.('video')}catch(_){}try{window.v112ToggleVideo?.(true)}catch(_){}},50)};
window.v132PlayAction=function(key){try{window.v11Navigate?.('video')}catch(_){}setTimeout(()=>{try{window.v780Select?.(key);window.v780PlayKey?.(key)}catch(e){console.error(e)}},80)};
function refAction(ref){const m=match();if(!m||!ref)return null;if(ref.live)return m.liveRally?.actions?.[ref.index]||null;const s=(m.sets||[]).find(x=>Number(x.number)===Number(ref.setNo)),r=(s?.rallies||[]).find(x=>Number(x.id)===Number(ref.rallyId));return r?.actions?.[ref.index]||null}
function option(v,l,sel){return `<option value="${esc(v)}" ${String(v)===String(sel)?'selected':''}>${esc(l)}</option>`}
function editPlayerOptions(a,teamOverride=null){const team=teamOverride||(a.team==='opponent'?'opponent':'ours');if(team==='ours')return players().map(p=>option(p.id,`${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`,a.playerId)).join('');const vals=[...new Set(POS.map(p=>String(match()?.lineup?.opponent?.[p]||'').trim()).filter(Boolean).concat(a.playerLabel?[a.playerLabel]:[]))];return vals.map(v=>option(v,v,a.playerLabel)).join('')}
function zoneValue(a,which){return String(which==='start'?a.startZone||'':a.endZone||'')}
window.v132OpenActionEditor=function(index){if(readonly())return alert('Partido finalizado · solo lectura.');const ref=window.__v132Recent?.[Number(index)];if(!ref)return;editRef={...ref};const a=refAction(editRef);if(!a)return;const grid=$('v132-edit-grid');$('v132-edit-title').textContent=`${ref.live?'Rally actual':`Set ${ref.setNo} · ${ref.score}`} · ${a.code||'Acción'}`;grid.innerHTML=`<label><span>Equipo</span><select id="v132-edit-team" onchange="v132EditTeamChanged()">${option('ours','Nuestro',a.team)}${option('opponent','Rival',a.team)}</select></label><label><span>Jugador</span><select id="v132-edit-player">${editPlayerOptions(a)}</select></label><label><span>Fundamento</span><select id="v132-edit-skill">${Object.entries(SKILLS).map(([k,v])=>option(k,v,a.skill)).join('')}</select></label><label><span>Evaluación</span><select id="v132-edit-eval">${['#','+','!','-','/','='].map(x=>option(x,x,a.evaluation)).join('')}</select></label><label><span>Zona origen</span><input id="v132-edit-start" value="${esc(zoneValue(a,'start'))}" placeholder="4A"></label><label><span>Zona destino</span><input id="v132-edit-end" value="${esc(zoneValue(a,'end'))}" placeholder="5D"></label><label><span>Fase</span><select id="v132-edit-phase">${['','K1','K2','FB','TR'].map(x=>option(x,x||'Auto',a.phase||'' )).join('')}</select></label><label><span>Vídeo</span><input value="${actionTime(a)!=null?fmtVideo(actionTime(a)):'Sin timestamp'}" disabled></label><label class="v132-edit-code"><span>Código completo</span><input id="v132-edit-code" value="${esc(a.code||'')}" spellcheck="false" placeholder="Código DataVolley"></label>`;
  $('v132-edit-meta').innerHTML=`<span>ID ${esc(a.id)}</span><span>${ref.live?'Rally actual':'Rally '+ref.rallyId}</span><span>S${ref.setNo}</span><span>R${ref.rotation}</span>${actionTime(a)!=null?`<span>Vídeo ${fmtVideo(actionTime(a))}</span>`:''}`;$('v132-action-edit-modal').classList.add('open');$('v132-action-edit-modal').setAttribute('aria-hidden','false')};
window.v132EditTeamChanged=function(){const a=refAction(editRef);if(!a)return;const team=$('v132-edit-team').value;const sel=$('v132-edit-player');sel.innerHTML=editPlayerOptions(a,team)};
window.v132CloseActionEditor=function(){editRef=null;$('v132-action-edit-modal')?.classList.remove('open');$('v132-action-edit-modal')?.setAttribute('aria-hidden','true')};
function preserveVideo(src,dst){['id','uid','seq','createdAt','scoutMs','videoTime','videoSource','videoStart','videoAction','videoEnd','liveVideoTime','liveVideoSessionId','liveVideoLinkedAt','videoTimestamp','clipId'].forEach(k=>{if(src?.[k]!==undefined)dst[k]=src[k]})}
function saveDirect(a){try{window.VC_SCOUT_VIDEO_BRIDGE?.save?.()}catch(_){}try{State()?.sync?.('v13.2:action-edit')}catch(_){}try{window.v900Render?.()}catch(_){}queueRender()}
window.v132SaveActionEdit=function(){if(!editRef||readonly())return;const old=refAction(editRef);if(!old)return;const raw=String($('v132-edit-code')?.value||'').trim();let next={...old};if(raw&&raw!==String(old.code||'')){const parsed=window.VC_SCOUT_CORE?.parse?.(raw,match(),old);if(parsed?.error||!parsed?.action)return alert(parsed?.error||'Código no válido.');next={...old,...parsed.action};preserveVideo(old,next)}else{next.team=$('v132-edit-team').value==='opponent'?'opponent':'ours';const pv=$('v132-edit-player').value;if(next.team==='ours'){const p=players().find(x=>String(x.id)===String(pv));next.playerId=p?Number(p.id):null;next.playerLabel='';if(p){next.playerNumberSnapshot=p.number??'';next.playerNameSnapshot=p.name||''}}else{next.playerId=null;next.playerLabel=pv;next.playerNumberSnapshot='';next.playerNameSnapshot=''}next.skill=$('v132-edit-skill').value;next.evaluation=$('v132-edit-eval').value;next.startZone=String($('v132-edit-start').value||'').trim().toUpperCase();next.endZone=String($('v132-edit-end').value||'').trim().toUpperCase();next.phase=$('v132-edit-phase').value;try{next.code=window.scoutBuildCode?.(next)||next.code}catch(_){}}const m=match();if(editRef.live)m.liveRally.actions[editRef.index]=next;else{const s=(m.sets||[]).find(x=>Number(x.number)===Number(editRef.setNo)),r=(s?.rallies||[]).find(x=>Number(x.id)===Number(editRef.rallyId));if(!r)return;r.actions[editRef.index]=next;r.editedAt=new Date().toISOString();r.editCount=(Number(r.editCount)||0)+1}m.updatedAt=new Date().toISOString();saveDirect(next);v132CloseActionEditor()};
window.v132DeleteEditedAction=function(){if(!editRef||readonly())return;if(!confirm('¿Eliminar esta acción del scouting? El marcador del rally no cambiará.'))return;const m=match();if(editRef.live)m.liveRally.actions.splice(editRef.index,1);else{const s=(m.sets||[]).find(x=>Number(x.number)===Number(editRef.setNo)),r=(s?.rallies||[]).find(x=>Number(x.id)===Number(editRef.rallyId));if(!r)return;r.actions.splice(editRef.index,1);r.editedAt=new Date().toISOString();r.editCount=(Number(r.editCount)||0)+1}m.updatedAt=new Date().toISOString();saveDirect();v132CloseActionEditor()};
/* Persist a normalized video timestamp on every newly recorded action. Existing video fields remain authoritative. */
try{if(typeof window.scoutNormalizeAction==='function'&&!window.scoutNormalizeAction.__v132){const base=window.scoutNormalizeAction;window.scoutNormalizeAction=function(a){const x=base(a);const raw=a||{};const vals=[raw.videoTimestamp,raw.liveVideoTime,x.videoAction,raw.videoAction,x.videoTime,raw.videoTime].filter(v=>v!=null&&v!=='').map(Number);const t=vals.find(Number.isFinite);x.videoTimestamp=Number.isFinite(t)?Math.max(0,t):null;return x};window.scoutNormalizeAction.__v132=true}}catch(e){console.warn('V13.2 normalize wrapper',e)}
try{if(typeof window.scoutPushAction==='function'&&!window.scoutPushAction.__v132){const base=window.scoutPushAction;window.scoutPushAction=function(action){const m=match(),before=m?.liveRally?.actions?.length||0,out=base(action),mm=match(),arr=mm?.liveRally?.actions||[];if(arr.length>before){const a=arr[arr.length-1],t=actionTime(a);a.videoTimestamp=t==null?null:t;mm.updatedAt=new Date().toISOString()}setTimeout(queueRender,0);return out};window.scoutPushAction.__v132=true;if(window.VC_SCOUT_CORE)window.VC_SCOUT_CORE.push=a=>window.scoutPushAction(a)}}catch(e){console.warn('V13.2 action wrapper',e)}
const oldRender=window.v900Render;if(typeof oldRender==='function'&&!oldRender.__v132){const wrapped=function(...args){const out=oldRender.apply(this,args);setTimeout(queueRender,0);return out};wrapped.__v132=true;window.v900Render=wrapped}
const unsub=State()?.subscribe?.(()=>queueRender())||(()=>{});
function boot(){document.body.classList.add('v132-scouting-pro');try{window.v900SetPhase?.('scout')}catch(_){}buildCockpit();buildRecent();queueRender();const modal=$('v132-action-edit-modal');modal?.addEventListener('click',e=>{if(e.target===modal)v132CloseActionEditor()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('open'))v132CloseActionEditor()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.VC_V132={version:VERSION,render:queueRender,openActionEditor:window.v132OpenActionEditor,dispose:unsub};
if(State()){State().version=VERSION;State().schema='vc.match-state/13.2'}
})();
