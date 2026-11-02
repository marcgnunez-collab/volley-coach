
(()=>{
'use strict';

const V710_VERSION='7.1.0';
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const state={selectedKey:'',lastMatchId:null};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return Number(bridge()?.getActiveId?.())||0}catch(_){return 0}}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function label(a){try{return bridge()?.playerLabel?.(a)||fallbackLabel(a)}catch(_){return fallbackLabel(a)}}
function fallbackLabel(a){const n=a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot;return String(n||'Jugador')}
function currentMatch(){const id=Number($('scout-v700-match')?.value)||activeId();return matches().find(m=>Number(m.id)===id)||null}
function video(){return $('scout-v700-player')}
function meta(m){const x=m?.video;return x&&typeof x==='object'?x:null}
function fmt(s){if(s==null||!Number.isFinite(Number(s)))return '—';s=Math.max(0,Number(s));const mm=Math.floor(s/60),ss=s-mm*60;return `${String(mm).padStart(2,'0')}:${ss.toFixed(1).padStart(4,'0')}`}
function pct(n,d){return d?Math.round((Number(n)||0)*100/d):0}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function actionPlayerKey(a){if(a?.team==='ours')return `ours:${a.playerId??a.playerNumberSnapshot??a.playerNameSnapshot??a.playerLabel??''}`;return `opponent:${a.playerLabel??a.playerNumberSnapshot??a.playerNameSnapshot??''}`}
function rallyStartMs(r){const aa=arr(r?.actions);return aa.length?(Number(aa[0].scoutMs)||Number(r?.scoutStartMs)||0):(Number(r?.scoutStartMs)||0)}
function rallyEndMs(r){const aa=arr(r?.actions);return aa.length?(Number(aa[aa.length-1].scoutMs)||Number(r?.scoutEndMs)||rallyStartMs(r)):(Number(r?.scoutEndMs)||rallyStartMs(r))}
function mapped(m,ms){const x=meta(m);return x?.syncOffset==null?null:Math.max(0,(Number(ms)||0)/1000+Number(x.syncOffset))}

function allItems(m){
  const out=[];
  arr(m?.sets).forEach(s=>arr(s.rallies).forEach((r,ri)=>{
    out.push({
      key:`r:${s.number}:${r.id}`,type:'rally',ms:rallyStartMs(r),endMs:rallyEndMs(r),set:Number(s.number)||1,
      team:r.winner==='ours'?'ours':'opponent',label:`Set ${s.number} · Rally ${ri+1} · ${r.scoreAfter?.us??0}–${r.scoreAfter?.opponent??0}`,
      copy:`R${r.rotationBefore||1} vs R${r.opponentRotationBefore||1} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'} · ${arr(r.actions).length} acciones`,
      rally:r,actions:arr(r.actions)
    });
    arr(r.actions).forEach(a=>out.push({
      key:`a:${s.number}:${r.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(s.number)||1,
      team:a.team==='opponent'?'opponent':'ours',skill:a.skill,evaluation:a.evaluation,playerKey:actionPlayerKey(a),
      playerLabel:label(a),label:String(a.code||SKILLS[a.skill]||'Acción'),
      copy:`S${s.number} · Rally ${ri+1} · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${label(a)}`,
      action:a,rally:r
    }));
  }));
  const cs=arr(m?.sets).find(s=>Number(s.number)===Number(m?.currentSet));
  const li=arr(cs?.rallies).length+1;
  arr(m?.liveRally?.actions).forEach(a=>out.push({
    key:`a:${m.currentSet}:${m.liveRally.id}:${a.id}`,type:'action',ms:Number(a.scoutMs)||0,set:Number(m.currentSet)||1,
    team:a.team==='opponent'?'opponent':'ours',skill:a.skill,evaluation:a.evaluation,playerKey:actionPlayerKey(a),
    playerLabel:label(a),label:String(a.code||SKILLS[a.skill]||'Acción'),
    copy:`S${m.currentSet} · Rally ${li} en curso · ${a.team==='ours'?'Nuestro equipo':'Rival'} · ${label(a)}`,
    action:a,rally:m.liveRally,live:true
  }));
  arr(m?.workflow?.events).forEach(e=>out.push({
    key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:Number(e.setNumber)||1,
    label:String(e.type||'Evento'),copy:`S${e.setNumber||'?'} · ${e.scoreUs??0}–${e.scoreOpponent??0}${e.note?' · '+e.note:''}`,event:e
  }));
  arr(m?.events).forEach(e=>out.push({
    key:`e:${String(e.uid||e.id)}`,type:'event',ms:Number(e.scoutMs)||0,set:Number(e.setNumber)||1,
    label:e.type==='libero_auto'?'Líbero automático':'Cambio',
    copy:`S${e.setNumber||'?'} · ${e.scoreUs??0}–${e.scoreOpponent??0} · ${e.outLabel||'—'} → ${e.inLabel||'—'}`,event:e
  }));
  return out.sort((a,b)=>a.ms-b.ms||String(a.key).localeCompare(String(b.key)));
}

function filterState(){
  return {
    kind:$('scout-v700-kind')?.value||'all',
    set:$('scout-v710-set')?.value||'',
    team:$('scout-v710-team')?.value||'',
    player:$('scout-v710-player')?.value||'',
    skill:$('scout-v700-skill')?.value||'',
    evaluation:$('scout-v710-eval')?.value||'',
    q:String($('scout-v700-search')?.value||'').trim().toLowerCase()
  };
}
function actionMatches(item,f){
  if(item.type!=='action')return false;
  if(f.set&&String(item.set)!==f.set)return false;
  if(f.team&&item.team!==f.team)return false;
  if(f.player&&item.playerKey!==f.player)return false;
  if(f.skill&&item.skill!==f.skill)return false;
  if(f.evaluation&&item.evaluation!==f.evaluation)return false;
  if(f.q&&!`${item.label} ${item.copy} ${item.playerLabel||''} ${SKILLS[item.skill]||''} ${item.set}`.toLowerCase().includes(f.q))return false;
  return true;
}
function itemMatches(item,f){
  if(f.kind!=='all'&&item.type!==f.kind)return false;
  if(f.set&&String(item.set)!==f.set)return false;

  const actionSpecific=!!(f.team||f.player||f.skill||f.evaluation);
  if(item.type==='action')return actionMatches(item,f);
  if(item.type==='rally'&&actionSpecific){
    const actions=arr(item.actions).map(a=>({
      type:'action',set:item.set,team:a.team==='opponent'?'opponent':'ours',playerKey:actionPlayerKey(a),
      skill:a.skill,evaluation:a.evaluation,label:String(a.code||''),copy:label(a),playerLabel:label(a)
    }));
    if(!actions.some(x=>actionMatches(x,{...f,kind:'action',set:''})))return false;
  }
  if(item.type==='event'&&actionSpecific)return false;
  if(f.q&&!`${item.label} ${item.copy} ${item.set}`.toLowerCase().includes(f.q))return false;
  return true;
}
function filteredItems(m){const f=filterState();return allItems(m).filter(x=>itemMatches(x,f))}
function filteredActions(m){
  const f=filterState();
  return allItems(m).filter(x=>x.type==='action'&&actionMatches(x,{...f,kind:'action'}));
}

function populateDynamicFilters(m){
  if(!m)return;
  const setSel=$('scout-v710-set');
  if(setSel){
    const old=setSel.value;
    const sets=[...new Set(arr(m.sets).map(s=>Number(s.number)).filter(Boolean))].sort((a,b)=>a-b);
    setSel.innerHTML='<option value="">Todos los sets</option>'+sets.map(n=>`<option value="${n}">Set ${n}</option>`).join('');
    if(sets.map(String).includes(old))setSel.value=old;
  }
  populatePlayers(m);
}
function populatePlayers(m){
  const sel=$('scout-v710-player');if(!sel||!m)return;
  const old=sel.value,team=$('scout-v710-team')?.value||'';
  const map=new Map();
  allItems(m).filter(x=>x.type==='action'&&(!team||x.team===team)).forEach(x=>{
    if(!map.has(x.playerKey))map.set(x.playerKey,{label:x.playerLabel||'Jugador',team:x.team});
  });
  const rows=[...map.entries()].sort((a,b)=>{
    if(a[1].team!==b[1].team)return a[1].team==='ours'?-1:1;
    return String(a[1].label).localeCompare(String(b[1].label),'es',{numeric:true});
  });
  sel.innerHTML='<option value="">Todos los jugadores</option>'+rows.map(([k,v])=>`<option value="${esc(k)}">${v.team==='ours'?'Nuestro':'Rival'} · ${esc(v.label)}</option>`).join('');
  if(rows.some(([k])=>k===old))sel.value=old;
}

function metrics(m){
  const rows=filteredActions(m),g=rows.filter(x=>x.evaluation==='#').length,p=rows.filter(x=>x.evaluation==='=').length,
        pos=rows.filter(x=>x.evaluation==='#'||x.evaluation==='+').length,
        neg=rows.filter(x=>['-','/','='].includes(x.evaluation)).length;
  return {rows,total:rows.length,g,p,gp:g-p,pos,neg,posPct:pct(pos,rows.length),errPct:pct(p,rows.length)};
}

function filterSummary(){
  const f=filterState(),parts=[];
  if(f.set)parts.push(`Set ${f.set}`);
  if(f.team)parts.push(f.team==='ours'?teamName():'Rival');
  if(f.player)parts.push($('scout-v710-player')?.selectedOptions?.[0]?.textContent||'Jugador');
  if(f.skill)parts.push(SKILLS[f.skill]||f.skill);
  if(f.evaluation)parts.push(`Valoración ${f.evaluation}`);
  if(f.q)parts.push(`“${f.q}”`);
  return parts.length?parts.join(' · '):'Todas las acciones';
}
function renderMetrics(m){
  const k=$('scout-v710-kpis'),breakdown=$('scout-v710-skill-breakdown');
  if(!k||!breakdown)return;
  if(!m){k.innerHTML='';breakdown.innerHTML='';return}
  const x=metrics(m);
  $('scout-v710-filter-summary').textContent=filterSummary();
  k.innerHTML=`
    <div class="scout-v710-kpi"><span>Acciones</span><b>${x.total}</b><small>muestra filtrada</small></div>
    <div class="scout-v710-kpi good"><span>G · #</span><b>${x.g}</b><small>ganancias</small></div>
    <div class="scout-v710-kpi bad"><span>P · =</span><b>${x.p}</b><small>pérdidas/error</small></div>
    <div class="scout-v710-kpi gp"><span>G-P</span><b>${x.gp>0?'+':''}${x.gp}</b><small># menos =</small></div>
    <div class="scout-v710-kpi"><span>Positivas</span><b>${x.posPct}%</b><small># / +</small></div>`;
  const groups=Object.keys(SKILLS).map(skill=>{
    const r=x.rows.filter(a=>a.skill===skill),g=r.filter(a=>a.evaluation==='#').length,p=r.filter(a=>a.evaluation==='=').length,pos=r.filter(a=>['#','+'].includes(a.evaluation)).length;
    return {skill,n:r.length,g,p,gp:g-p,pos:pct(pos,r.length)};
  }).filter(r=>r.n);
  breakdown.innerHTML=groups.length?`
    <div class="scout-v710-skill-row head"><span>Fundamento</span><span>Acc.</span><span>G</span><span>P</span><span>G-P</span><span>+/#</span></div>
    ${groups.map(r=>`<div class="scout-v710-skill-row"><b>${esc(SKILLS[r.skill])}</b><span>${r.n}</span><span>${r.g}</span><span>${r.p}</span><span>${r.gp>0?'+':''}${r.gp}</span><span>${r.pos}%</span></div>`).join('')}`:
    '<div class="scout-v710-empty">No hay acciones que cumplan los filtros.</div>';
}

function renderTimeline(){
  const box=$('scout-v700-timeline'),m=currentMatch();if(!box)return;
  if(!m){box.innerHTML='<div class="match-empty">No hay scouting seleccionado.</div>';renderMetrics(null);return}
  populateDynamicFilters(m);
  const rows=filteredItems(m);
  box.innerHTML=rows.length?rows.map(x=>{
    const t=mapped(m,x.ms),play=t!=null,pill=x.type==='rally'?'RALLY':x.type==='action'?(SKILLS[x.skill]||x.skill):'EVENTO';
    const evalBadge=x.type==='action'&&x.evaluation?`<span class="v710-eval-badge ${['#','+'].includes(x.evaluation)?'good':['=','/','-'].includes(x.evaluation)?'bad':''}">${esc(x.evaluation)}</span>`:'';
    return `<div class="scout-v700-item ${x.key===state.selectedKey?'active':''}" data-key="${esc(x.key)}">
      <div class="time">${play?fmt(t):fmt((Number(x.ms)||0)/1000)}</div>
      <div><span class="scout-v700-pill ${x.team==='ours'?'ours':x.team==='opponent'?'opponent':''}">${esc(pill)}</span>${evalBadge}<strong>${esc(x.label)}</strong><small>${esc(x.copy||'')}</small></div>
      <div class="actions"><button class="ghost" onclick="scoutV700SyncKey('${esc(x.key)}')">Sincronizar aquí</button><button class="${play?'primary':'ghost'}" ${play?'':'disabled'} onclick="scoutV700PlayKey('${esc(x.key)}')">▶</button></div>
    </div>`;
  }).join(''):'<div class="match-empty">No hay elementos para estos filtros.</div>';
  renderMetrics(m);
}

function setCurrentLabel(key){
  const m=currentMatch();if(!m)return;
  const item=allItems(m).find(x=>x.key===key);if(!item)return;
  state.selectedKey=key;
  const el=$('scout-v700-current-label');if(el)el.textContent=item.label;
  const ov=$('scout-v710-overlay');if(ov)ov.innerHTML=`<b>${item.type==='rally'?'RALLY':item.type==='action'?(SKILLS[item.skill]||'ACCIÓN'):'EVENTO'}</b><span>${esc(item.label)} · ${esc(item.copy||'')}</span>`;
}
function nearestItemByVideoTime(m,t){
  if(!m||meta(m)?.syncOffset==null)return null;
  const rows=filteredItems(m).filter(x=>mapped(m,x.ms)!=null);
  if(!rows.length)return null;
  let best=rows[0],bestD=Math.abs(mapped(m,best.ms)-t);
  rows.forEach(x=>{const d=Math.abs(mapped(m,x.ms)-t);if(d<bestD){best=x;bestD=d}});
  return best;
}
function move(dir){
  const m=currentMatch();if(!m)return;
  const rows=filteredItems(m).filter(x=>mapped(m,x.ms)!=null);
  if(!rows.length){alert('No hay elementos sincronizados con los filtros actuales.');return}
  let idx=rows.findIndex(x=>x.key===state.selectedKey);
  if(idx<0){
    const near=nearestItemByVideoTime(m,Number(video()?.currentTime)||0);
    idx=near?rows.findIndex(x=>x.key===near.key):(dir>0?-1:0);
  }
  idx=Math.max(0,Math.min(rows.length-1,idx+dir));
  window.scoutV700PlayKey?.(rows[idx].key);
}
window.scoutV710Previous=()=>move(-1);
window.scoutV710Next=()=>move(1);
window.scoutV710Seek=function(delta){const v=video();if(!v?.src)return;const max=Number.isFinite(v.duration)?v.duration:Infinity;v.currentTime=Math.max(0,Math.min(max,(Number(v.currentTime)||0)+Number(delta||0)))};
window.scoutV710TogglePlay=function(){const v=video();if(!v?.src)return;if(v.paused)v.play().catch(()=>{});else v.pause()};
window.scoutV710SetSpeed=function(rate){const v=video();if(!v)return;const r=Math.max(.25,Math.min(3,Number(rate)||1));v.playbackRate=r;try{localStorage.setItem('volley_v710_playback_rate',String(r))}catch(_){}};
window.scoutV710ResetFilters=function(){
  ['scout-v710-set','scout-v710-team','scout-v710-player','scout-v700-skill','scout-v710-eval'].forEach(id=>{if($(id))$(id).value=''});
  if($('scout-v700-kind'))$('scout-v700-kind').value='all';
  if($('scout-v700-search'))$('scout-v700-search').value='';
  populatePlayers(currentMatch());
  renderTimeline();
};
window.scoutV710FilterChanged=function(){populatePlayers(currentMatch());renderTimeline()};

const baseOpen=window.scoutV700OpenVideo;
window.scoutV700OpenVideo=function(context=''){
  const out=baseOpen?.(context);
  const m=currentMatch();
  populateDynamicFilters(m);
  const saved=Number(localStorage.getItem('volley_v710_playback_rate'))||1;
  if($('scout-v710-speed'))$('scout-v710-speed').value=String(saved);
  if(video())video().playbackRate=saved;
  setTimeout(renderTimeline,0);
  return out;
};

const baseChanged=window.scoutV700MatchChanged;
window.scoutV700MatchChanged=function(){
  state.selectedKey='';
  const out=baseChanged?.();
  const m=currentMatch();
  state.lastMatchId=m?.id||null;
  populateDynamicFilters(m);
  setTimeout(renderTimeline,0);
  return out;
};

const basePlay=window.scoutV700PlayKey;
window.scoutV700PlayKey=function(key){
  setCurrentLabel(key);
  const out=basePlay?.(key);
  setTimeout(renderTimeline,0);
  return out;
};

['scoutV700SyncKey','scoutV700Nudge','scoutV700ClearSync','scoutV700RangeChanged','scoutV700DetachFile'].forEach(name=>{
  const base=window[name];
  if(typeof base!=='function')return;
  window[name]=function(...args){
    const out=base.apply(this,args);
    setTimeout(renderTimeline,0);
    return out;
  };
});

const baseLoad=window.scoutV700LoadFile;
window.scoutV700LoadFile=function(ev){
  const out=baseLoad?.(ev);
  const v=video();
  if(v)v.addEventListener('loadedmetadata',()=>renderTimeline(),{once:true});
  setTimeout(renderTimeline,0);
  return out;
};

window.scoutV700RenderTimeline=renderTimeline;

const v=video();
if(v&&!v.dataset.v710Bound){
  v.dataset.v710Bound='1';
  v.addEventListener('timeupdate',()=>{
    const m=currentMatch();if(!m||meta(m)?.syncOffset==null)return;
    const rows=allItems(m).filter(x=>mapped(m,x.ms)!=null);
    if(!rows.length)return;
    let current=rows[0];
    for(const x of rows){if(mapped(m,x.ms)<=v.currentTime+.15)current=x;else break}
    const ov=$('scout-v710-overlay');
    if(ov&&current)ov.innerHTML=`<b>${current.type==='rally'?'RALLY':current.type==='action'?(SKILLS[current.skill]||'ACCIÓN'):'EVENTO'}</b><span>${esc(current.label)} · ${esc(current.copy||'')}</span>`;
  });
}

document.addEventListener('keydown',e=>{
  const modal=$('scout-v700-video-modal');
  if(!modal?.classList.contains('open'))return;
  const tag=String(e.target?.tagName||'').toLowerCase();
  if(['input','select','textarea'].includes(tag))return;
  if(e.code==='Space'){e.preventDefault();window.scoutV710TogglePlay()}
  else if(e.key==='ArrowLeft'){e.preventDefault();window.scoutV710Seek(e.shiftKey?-5:-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();window.scoutV710Seek(e.shiftKey?5:1)}
  else if(e.key==='ArrowUp'){e.preventDefault();window.scoutV710Previous()}
  else if(e.key==='ArrowDown'){e.preventDefault();window.scoutV710Next()}
});

window.scoutV710Diagnostics=function(){
  const m=currentMatch(),x=m?metrics(m):null;
  return {
    version:V710_VERSION,
    matchId:m?.id||null,
    videoLoaded:!!video()?.src,
    synchronized:meta(m)?.syncOffset!=null,
    filteredItems:m?filteredItems(m).length:0,
    filteredActions:x?.total||0,
    gains:x?.g||0,
    losses:x?.p||0,
    gp:x?.gp||0
  };
};

setTimeout(()=>{const m=currentMatch();if(m){populateDynamicFilters(m);renderTimeline()}},0);
})();
