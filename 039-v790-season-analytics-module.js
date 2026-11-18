
(()=>{
'use strict';
const VERSION='7.9.0';
const STATS_INTEGRITY_VERSION='20.4.1';
const EVALUATIONS=new Set(['#','+','!','-','/','=']);
const $=id=>document.getElementById(id);
const arr=v=>Array.isArray(v)?v:[];
const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const BACKUP_KEY='volley_v790_last_backup_at';
const state={selectedPlayer:'',lastBackup:null};

function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function roster(){try{return arr(bridge()?.getPlayers?.())}catch(_){return []}}
function teamId(){try{return String(bridge()?.getTeamId?.()||'equipo')}catch(_){return 'equipo'}}
function teamName(){try{return String(bridge()?.teamName?.()||'Equipo')}catch(_){return 'Equipo'}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pct(n,d){return d?Math.round((Number(n)||0)*100/(Number(d)||0)):0}
function isoDate(v){const d=new Date(v||0);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):''}
function fmtDate(v){const d=new Date(v||0);if(!Number.isFinite(d.getTime()))return '—';return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'})}
function matchDate(m){return String(m?.date||isoDate(m?.createdAt)||'')}
function playerKey(a){
  if(a?.playerId!=null&&String(a.playerId)!=='')return `id:${a.playerId}`;
  const num=String(a?.playerNumberSnapshot??'').trim(),name=String(a?.playerNameSnapshot||a?.playerLabel||'').trim();
  return num?`num:${num}`:`name:${name.toLowerCase()}`;
}
function playerName(a){
  try{return bridge()?.playerLabel?.(a)||String(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||'Jugador')}catch(_){return String(a?.playerNameSnapshot||a?.playerLabel||'Jugador')}
}
function allRallies(m){return arr(m?.sets).flatMap(s=>arr(s?.rallies).map(r=>({m,set:s,r})))}
function allActions(m){return allRallies(m).flatMap(x=>arr(x.r?.actions).map(a=>({...x,a})))}

function periodBounds(){
  const p=$('v790-period')?.value||'all',today=new Date(),to=new Date(today.getFullYear(),today.getMonth(),today.getDate(),23,59,59,999);
  if(p==='all')return {from:null,to:null};
  if(p==='30'||p==='90'){const from=new Date(to);from.setDate(from.getDate()-Number(p)+1);from.setHours(0,0,0,0);return {from,to}}
  if(p==='year'){return {from:new Date(today.getFullYear(),0,1),to}}
  if(p==='custom'){
    const f=$('v790-from')?.value,t=$('v790-to')?.value;
    return {from:f?new Date(`${f}T00:00:00`):null,to:t?new Date(`${t}T23:59:59`):null};
  }
  return {from:null,to:null};
}
function periodMatches(){
  const {from,to}=periodBounds();
  return matches().filter(m=>{
    const d=new Date(`${matchDate(m)}T12:00:00`);
    if(!Number.isFinite(d.getTime()))return !from&&!to;
    return (!from||d>=from)&&(!to||d<=to);
  }).sort((a,b)=>matchDate(a).localeCompare(matchDate(b))||Number(a.id)-Number(b.id));
}
function matchResult(m){
  let won=0,lost=0;
  arr(m?.sets).forEach(s=>{
    // A live set's partial score cannot be recorded as a won/lost set.
    if(s?.finished!==true)return;
    const usRaw=s?.scoreUs??s?.score?.us,opRaw=s?.scoreOpponent??s?.score?.opponent;
    if(usRaw==null||opRaw==null||usRaw===''||opRaw==='')return;
    const us=Number(usRaw),op=Number(opRaw);
    if(!Number.isInteger(us)||!Number.isInteger(op)||us<0||op<0||us===op)return;
    if((s.winner==='ours'&&us<op)||(s.winner==='opponent'&&op<us))return;
    if(us>op)won++;else lost++;
  });
  // A match cannot be called a victory merely because it leads 1–0 in sets.
  const finished=m?.status==='finished';
  return {won,lost,result:finished&&won>lost?'W':finished&&lost>won?'L':'—'};
}
function summarizeActions(items){
  const actions=items.map(x=>x.a||x).filter(Boolean);
  const ours=actions.filter(a=>a.team==='ours');
  const g=ours.filter(a=>a.evaluation==='#').length;
  const p=ours.filter(a=>a.evaluation==='=').length;
  const rec=ours.filter(a=>a.skill==='R'),recRated=rec.filter(a=>EVALUATIONS.has(a.evaluation)),recPos=recRated.filter(a=>['#','+'].includes(a.evaluation)).length,recExc=recRated.filter(a=>a.evaluation==='#').length;
  const att=ours.filter(a=>a.skill==='A'),attRated=att.filter(a=>EVALUATIONS.has(a.evaluation)),attPts=attRated.filter(a=>a.evaluation==='#').length,attErr=attRated.filter(a=>a.evaluation==='=').length,attBlk=attRated.filter(a=>a.evaluation==='/').length;
  const serve=ours.filter(a=>a.skill==='S'),serveRated=serve.filter(a=>EVALUATIONS.has(a.evaluation)),aces=serveRated.filter(a=>a.evaluation==='#').length,serveErr=serveRated.filter(a=>a.evaluation==='=').length;
  const blocks=ours.filter(a=>a.skill==='B'&&a.evaluation==='#').length;
  return {
    actions:ours.length,g,p,gp:g-p,
    rec:rec.length,recRated:recRated.length,recPos,recExc,recPosPct:pct(recPos,recRated.length),recExcPct:pct(recExc,recRated.length),
    att:att.length,attRated:attRated.length,attPts,attErr,attBlk,attEff:attRated.length?Math.round((attPts-attErr-attBlk)*100/attRated.length):0,
    serve:serve.length,serveRated:serveRated.length,aces,serveErr,serveEff:serveRated.length?Math.round((aces-serveErr)*100/serveRated.length):0,
    blocks
  };
}
function filteredActionItems(){
  const ms=periodMatches(),player=$('v790-player')?.value||state.selectedPlayer||'',skill=$('v790-skill')?.value||'';
  return ms.flatMap(allActions).filter(x=>{
    if(x.a?.team!=='ours')return false;
    if(player&&playerKey(x.a)!==player)return false;
    if(skill&&x.a?.skill!==skill)return false;
    return true;
  });
}
function seasonSummary(){
  const ms=periodMatches(),actions=filteredActionItems(),stats=summarizeActions(actions);
  let setsWon=0,setsLost=0,matchesWon=0,matchesLost=0;
  ms.forEach(m=>{const r=matchResult(m);setsWon+=r.won;setsLost+=r.lost;if(r.result==='W')matchesWon++;if(r.result==='L')matchesLost++});
  return {...stats,matches:ms.length,matchesWon,matchesLost,sets:setsWon+setsLost,setsWon,setsLost};
}
function populatePlayers(){
  const sel=$('v790-player');if(!sel)return;
  const old=sel.value||state.selectedPlayer||'';
  const map=new Map();
  roster().forEach(p=>{
    const k=p?.id!=null?`id:${p.id}`:(p?.number!=null?`num:${p.number}`:`name:${String(p?.name||'').toLowerCase()}`);
    map.set(k,{key:k,name:String(p?.name||'Jugador'),number:p?.number??''});
  });
  periodMatches().flatMap(allActions).filter(x=>x.a?.team==='ours').forEach(x=>{
    const k=playerKey(x.a);if(!map.has(k)){
      map.set(k,{key:k,name:String(x.a?.playerNameSnapshot||x.a?.playerLabel||'Jugador'),number:x.a?.playerNumberSnapshot??''});
    }
  });
  const list=[...map.values()].sort((a,b)=>Number(a.number||999)-Number(b.number||999)||a.name.localeCompare(b.name));
  sel.innerHTML='<option value="">Todos</option>'+list.map(p=>`<option value="${esc(p.key)}">${p.number!==''?'#'+esc(p.number)+' · ':''}${esc(p.name)}</option>`).join('');
  if(old&&list.some(p=>p.key===old))sel.value=old;else if(state.selectedPlayer&&list.some(p=>p.key===state.selectedPlayer))sel.value=state.selectedPlayer;
}
function rotationSummary(no){
  const rotation=Number(no);
  if(!Number.isInteger(rotation)||rotation<1||rotation>6)return null;
  // Unknown or invalid rotations must remain unknown, never R1 by default.
  const rs=periodMatches().flatMap(allRallies).filter(x=>x.r?.rotationBefore!=null&&x.r.rotationBefore!==''&&Number(x.r.rotationBefore)===rotation);
  const decided=rs.filter(x=>x.r?.winner==='ours'||x.r?.winner==='opponent');
  const won=decided.filter(x=>x.r.winner==='ours').length,lost=decided.filter(x=>x.r.winner==='opponent').length;
  const k1=rs.filter(x=>x.r?.servingBefore==='opponent'),k1Decided=k1.filter(x=>x.r?.winner==='ours'||x.r?.winner==='opponent'),k1w=k1Decided.filter(x=>x.r.winner==='ours').length;
  // Unknown serve possession is NOT a break-point opportunity.
  const k2=rs.filter(x=>x.r?.servingBefore==='ours'),k2Decided=k2.filter(x=>x.r?.winner==='ours'||x.r?.winner==='opponent'),k2w=k2Decided.filter(x=>x.r.winner==='ours').length;
  return {no:rotation,total:rs.length,decided:decided.length,unknown:rs.length-decided.length,won,lost,gp:won-lost,winPct:pct(won,decided.length),k1:k1.length,k1Decided:k1Decided.length,k1w,k1Pct:pct(k1w,k1Decided.length),k2:k2.length,k2Decided:k2Decided.length,k2w,k2Pct:pct(k2w,k2Decided.length),unknownServe:rs.length-k1.length-k2.length};
}
function renderKPIs(){
  const s=seasonSummary();
  $('v790-kpi-matches').textContent=String(s.matches);
  $('v790-kpi-record').textContent=`${s.matchesWon}–${s.matchesLost}`;
  $('v790-kpi-sets').textContent=String(s.sets);
  $('v790-kpi-sets-record').textContent=`${s.setsWon}–${s.setsLost}`;
  $('v790-kpi-gp').textContent=(s.gp>0?'+':'')+String(s.gp);
  $('v790-kpi-actions').textContent=`${s.actions} acciones propias · códigos # ${s.g} / = ${s.p} (no tanteo)`;
  $('v790-kpi-rec').textContent=s.recRated?`${s.recPosPct}%`:'—';
  $('v790-kpi-rec-exc').textContent=s.recRated?`# ${s.recExcPct}% · ${s.recRated}/${s.rec} val.`:`${s.rec} rec. · sin evaluar`;
  $('v790-kpi-att').textContent=s.attRated?`${s.attEff}%`:'—';
  $('v790-kpi-att-points').textContent=`${s.attPts} puntos · ${s.attRated}/${s.att} ataques valorados`;
  $('v790-kpi-serve').textContent=s.serveRated?`${s.serveEff}%`:'—';
  $('v790-kpi-serve-copy').textContent=`${s.aces} ace · ${s.serveErr} err · ${s.serveRated}/${s.serve} val.`;
}
function renderTrend(){
  const box=$('v790-trend');if(!box)return;
  const player=$('v790-player')?.value||state.selectedPlayer||'',skill=$('v790-skill')?.value||'';
  const rows=periodMatches().map(m=>{
    let items=allActions(m).filter(x=>x.a?.team==='ours');
    if(player)items=items.filter(x=>playerKey(x.a)===player);
    if(skill)items=items.filter(x=>x.a?.skill===skill);
    const s=summarizeActions(items),res=matchResult(m);
    return {m,s,res,value:s.gp};
  });
  const max=Math.max(1,...rows.map(x=>Math.abs(x.value)));
  box.innerHTML=rows.length?rows.map(x=>{
    const h=Math.max(4,Math.abs(x.value)/max*72),positive=x.value>=0;
    const style=positive?`height:${h}px;margin-bottom:80px`:`height:${h}px;margin-top:80px`;
    const valStyle=positive?'bottom:100%':'top:100%';
    return `<div class="v790-trend-item" onclick="v790OpenMatch(${Number(x.m.id)})">
      <div class="v790-trend-bar-wrap"><i class="v790-trend-zero"></i><div class="v790-trend-bar ${positive?'':'neg'}" style="${style}"><span class="v790-trend-value" style="${valStyle}">${x.value>0?'+':''}${x.value}</span></div></div>
      <div class="v790-trend-copy"><b>${esc(x.m.opponent||'Rival')}</b><small>${fmtDate(matchDate(x.m))} · ${x.res.won}-${x.res.lost}</small></div>
    </div>`;
  }).join(''):'<div class="match-empty">No hay partidos en este periodo.</div>';
}
function renderRotations(){
  const box=$('v790-rotations');if(!box)return;
  box.innerHTML=[1,2,3,4,5,6].map(n=>{
    const r=rotationSummary(n);
    return `<article class="v790-rotation"><div class="v790-rotation-head"><b>R${n}</b><strong>${r.decided?r.winPct+'%':'—'}</strong></div><small>${r.won}/${r.decided} rallies decididos · ${r.total} registrados${r.unknown?` · ${r.unknown} sin resultado`:''} · G-P ${r.gp>0?'+':''}${r.gp}</small><div class="v790-mini-bar"><i style="width:${r.decided?r.winPct:0}%"></i></div><small>K1 ${r.k1Decided?r.k1Pct+'%':'—'} (${r.k1Decided}) · K2 ${r.k2Decided?r.k2Pct+'%':'—'} (${r.k2Decided})${r.unknownServe?` · ${r.unknownServe} sin saque`:''}</small></article>`;
  }).join('');
}
function allPlayerRows(){
  const map=new Map();
  periodMatches().flatMap(allActions).filter(x=>x.a?.team==='ours').forEach(x=>{
    const key=playerKey(x.a);
    if(!map.has(key))map.set(key,{key,name:playerName(x.a),number:x.a?.playerNumberSnapshot??'',items:[]});
    map.get(key).items.push(x);
  });
  roster().forEach(p=>{
    const key=p?.id!=null?`id:${p.id}`:(p?.number!=null?`num:${p.number}`:`name:${String(p?.name||'').toLowerCase()}`);
    if(!map.has(key))map.set(key,{key,name:String(p?.name||'Jugador'),number:p?.number??'',items:[]});
  });
  return [...map.values()].map(p=>({...p,stats:summarizeActions(p.items)})).sort((a,b)=>Number(a.number||999)-Number(b.number||999)||a.name.localeCompare(b.name));
}
function renderPlayerTable(){
  const box=$('v790-player-table');if(!box)return;
  const players=allPlayerRows(),active=$('v790-player')?.value||state.selectedPlayer||'';
  box.innerHTML=`<table><thead><tr><th>Jugador</th><th>Acc.</th><th>G</th><th>P</th><th>G-P</th><th>S ACE</th><th>S ERR</th><th>REC +/#</th><th>REC #</th><th>ATQ PTS</th><th>ATQ EFF</th><th>BLQ</th></tr></thead><tbody>${players.map(p=>{
    const s=p.stats;
    return `<tr class="${active===p.key?'active':''}" onclick="v790SelectPlayer('${esc(p.key)}')"><td><div class="v790-player-name"><span class="v790-player-number">${p.number!==''?esc(p.number):'–'}</span><b>${esc(p.name)}</b></div></td><td>${s.actions}</td><td>${s.g}</td><td>${s.p}</td><td><b>${s.gp>0?'+':''}${s.gp}</b></td><td>${s.aces}</td><td>${s.serveErr}</td><td>${s.recRated?s.recPosPct+'%':'—'}</td><td>${s.recRated?s.recExcPct+'%':'—'}</td><td>${s.attPts}</td><td>${s.attRated?s.attEff+'%':'—'}</td><td>${s.blocks}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function selectedPlayerRow(){
  const key=$('v790-player')?.value||state.selectedPlayer||'';
  return allPlayerRows().find(p=>p.key===key)||null;
}
function renderPlayerDetail(){
  const box=$('v790-player-detail'),title=$('v790-player-title');if(!box||!title)return;
  const p=selectedPlayerRow();
  if(!p){
    const s=seasonSummary();title.textContent=teamName();
    box.innerHTML=`<div class="v790-detail-kpis"><div><span>Acciones</span><b>${s.actions}</b></div><div><span>G-P</span><b>${s.gp>0?'+':''}${s.gp}</b></div><div><span>REC +/#</span><b>${s.recRated?s.recPosPct+'%':'—'}</b></div><div><span>ATQ EFF</span><b>${s.attRated?s.attEff+'%':'—'}</b></div></div><div class="v790-skill-grid"><div class="v790-skill-card"><strong>Saque</strong><small>${s.serve} acciones · ${s.aces} ace · ${s.serveErr} error · ${s.serveRated} valorados</small></div><div class="v790-skill-card"><strong>Recepción</strong><small>${s.rec} acciones · ${s.recRated} valoradas · +/# ${s.recRated?s.recPosPct+'%':'—'} · # ${s.recRated?s.recExcPct+'%':'—'}</small></div><div class="v790-skill-card"><strong>Ataque</strong><small>${s.att} acciones · ${s.attRated} valorados · ${s.attPts} pts · ${s.attErr} err · ${s.attBlk} blq</small></div><div class="v790-skill-card"><strong>Bloqueo</strong><small>${s.blocks} puntos de bloqueo</small></div></div>`;
    return;
  }
  const s=p.stats;title.textContent=`${p.number!==''?'#'+p.number+' · ':''}${p.name}`;
  box.innerHTML=`<div class="v790-detail-kpis"><div><span>Acciones</span><b>${s.actions}</b></div><div><span>G-P</span><b>${s.gp>0?'+':''}${s.gp}</b></div><div><span>REC +/#</span><b>${s.recRated?s.recPosPct+'%':'—'}</b></div><div><span>ATQ EFF</span><b>${s.attRated?s.attEff+'%':'—'}</b></div></div><div class="v790-skill-grid"><div class="v790-skill-card"><strong>Saque</strong><small>${s.serve} · ${s.serveRated} valorados · ${s.aces} ace · ${s.serveErr} error · índice ${s.serveRated?s.serveEff+'%':'—'}</small></div><div class="v790-skill-card"><strong>Recepción</strong><small>${s.rec} · ${s.recRated} valoradas · +/# ${s.recRated?s.recPosPct+'%':'—'} · excelente ${s.recRated?s.recExcPct+'%':'—'}</small></div><div class="v790-skill-card"><strong>Ataque</strong><small>${s.att} · ${s.attRated} valorados · ${s.attPts} pts · ${s.attErr} err · ${s.attBlk} blq · eff ${s.attRated?s.attEff+'%':'—'}</small></div><div class="v790-skill-card"><strong>Bloqueo</strong><small>${s.blocks} puntos directos</small></div></div>`;
}
function renderMatchList(){
  const box=$('v790-match-list');if(!box)return;
  const player=$('v790-player')?.value||state.selectedPlayer||'',skill=$('v790-skill')?.value||'';
  box.innerHTML=periodMatches().slice().reverse().map(m=>{
    let items=allActions(m).filter(x=>x.a?.team==='ours');
    if(player)items=items.filter(x=>playerKey(x.a)===player);
    if(skill)items=items.filter(x=>x.a?.skill===skill);
    const s=summarizeActions(items),r=matchResult(m);
    return `<article class="v790-match-row"><time>${fmtDate(matchDate(m))}</time><div><strong>${esc(teamName())} ${r.won}-${r.lost} ${esc(m.opponent||'Rival')}</strong><small>${items.length} acciones · G-P ${s.gp>0?'+':''}${s.gp} · REC ${s.recRated?s.recPosPct+'%':'—'} · ATQ ${s.attRated?s.attEff+'%':'—'}${r.result==='—'?' · Resultado pendiente':''}</small></div><button class="ghost" onclick="v790OpenMatch(${Number(m.id)})">Abrir</button></article>`;
  }).join('')||'<div class="match-empty">No hay partidos en este periodo.</div>';
}
window.v790SelectPlayer=function(key){state.selectedPlayer=String(key||'');const s=$('v790-player');if(s)s.value=state.selectedPlayer;window.v790RenderSeason()};
window.v790ClearPlayer=function(){state.selectedPlayer='';const s=$('v790-player');if(s)s.value='';window.v790RenderSeason()};
window.v790OpenMatch=function(id){
  try{
    const btn=document.querySelector('.tab-btn[data-view="scout-video-hub"]');
    showView('scout-video-hub',btn);
    setTimeout(()=>{
      const sel=$('v780-match');if(sel){sel.value=String(id);window.v780MatchChanged?.()}
    },50);
  }catch(err){console.error('V7.9 open match',err)}
};
function updateBackupStatus(){
  const x=localStorage.getItem(BACKUP_KEY),el=$('v790-backup-status');if(!el)return;
  if(!x){el.textContent='Todavía no se ha exportado una copia desde este navegador.';return}
  const d=new Date(x);el.textContent=Number.isFinite(d.getTime())?`Última copia exportada: ${d.toLocaleString('es-ES')}`:`Última copia: ${x}`;
}
window.v790RenderSeason=function(){
  const custom=$('v790-period')?.value==='custom';
  document.querySelectorAll('#scout-season .v790-custom').forEach(x=>x.style.opacity=custom?'1':'.45');
  populatePlayers();renderKPIs();renderTrend();renderRotations();renderPlayerTable();renderPlayerDetail();renderMatchList();updateBackupStatus();
};
window.v790Open=function(){window.v790RenderSeason()};

/* ---------- Backup ---------- */
function backupStorageKeys(){
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i)||'';
    const lower=k.toLowerCase();
    const appOwned=/^(volleycoach|volley_|volleyv)/i.test(k);
    const sensitive=/supabase|auth|token|anon|cloud-url|cloud-key/i.test(lower);
    if(appOwned&&!sensitive)out.push(k);
  }
  return [...new Set(out)].sort();
}
function cleanForJSON(value){
  try{
    return JSON.parse(JSON.stringify(value,(k,v)=>{
      if(k==='fileHandle')return undefined;
      if(typeof Blob!=='undefined'&&v instanceof Blob)return {__type:'Blob',size:v.size,type:v.type};
      if(typeof FileSystemHandle!=='undefined'&&v instanceof FileSystemHandle)return undefined;
      return v;
    }));
  }catch(_){return null}
}
function openKnownDB(name){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(name,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(name==='VolleyCoachScoutingV702'&&!db.objectStoreNames.contains('scoutingByTeam'))db.createObjectStore('scoutingByTeam',{keyPath:'teamId'});
      if(name==='volley-coach-match-recovery-v680'&&!db.objectStoreNames.contains('snapshots'))db.createObjectStore('snapshots',{keyPath:'key'});
      if(name==='VolleyCoachRecordingsV770'&&!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'});
      if(name==='VolleyCoachScoutingVaultV893'&&!db.objectStoreNames.contains('versions'))db.createObjectStore('versions',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error(`No se pudo abrir ${name}`));
  });
}
async function readStore(name,store){
  try{
    const db=await openKnownDB(name);
    if(!db.objectStoreNames.contains(store)){db.close();return []}
    const rows=await new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly'),r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});
    db.close();return cleanForJSON(rows)||[];
  }catch(err){console.warn('V7.9 backup read',name,store,err);return []}
}
async function writeStore(name,store,rows){
  const db=await openKnownDB(name);
  if(!db.objectStoreNames.contains(store)){db.close();return false}
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'),st=tx.objectStore(store);st.clear();arr(rows).forEach(r=>st.put(r));
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  db.close();return true;
}
async function buildBackup(){
  const storage={};backupStorageKeys().forEach(k=>storage[k]=localStorage.getItem(k));
  const scouting=await readStore('VolleyCoachScoutingV702','scoutingByTeam');
  const recovery=await readStore('volley-coach-match-recovery-v680','snapshots');
  const recordings=await readStore('VolleyCoachRecordingsV770','sessions');
  const vault=await readStore('VolleyCoachScoutingVaultV893','versions');
  return {
    type:'volley-coach-backup',version:VERSION,createdAt:new Date().toISOString(),
    teamId:teamId(),teamName:teamName(),
    scope:{
      localStorage:'Datos de Volley Coach, preferencias y estado de equipos',
      scoutingIndexedDB:'Copias independientes de scoutings',
      recoveryIndexedDB:'Snapshots de recuperación de partido',
      recordingMetadata:'Metadatos de Recording Studio, sin archivos de vídeo ni chunks',
      scoutingVault:'Historial versionado de la Caja fuerte de scoutings V8.9.3'
    },
    localStorage:storage,
    indexedDB:{
      VolleyCoachScoutingV702:{scoutingByTeam:scouting},
      'volley-coach-match-recovery-v680':{snapshots:recovery},
      VolleyCoachRecordingsV770:{sessions:recordings},
      VolleyCoachScoutingVaultV893:{versions:vault}
    }
  };
}
function downloadJSON(obj,name){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
window.v790ExportBackup=async function(){
  const btn=document.activeElement;if(btn?.tagName==='BUTTON')btn.disabled=true;
  try{
    const backup=await buildBackup();
    const stamp=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
    downloadJSON(backup,`Volley_Coach_Backup_${stamp}.json`);
    const now=new Date().toISOString();localStorage.setItem(BACKUP_KEY,now);updateBackupStatus();
  }catch(err){alert('No se ha podido crear la copia de seguridad.\n\n'+String(err?.message||err))}
  finally{if(btn?.tagName==='BUTTON')btn.disabled=false}
};
window.v790InspectBackup=function(){
  document.getElementById('v790-backup-modal')?.remove();
  const modal=document.createElement('div');modal.id='v790-backup-modal';modal.className='v790-backup-modal';
  modal.innerHTML=`<div class="v790-backup-card"><span class="pro-kicker">COPIA DE SEGURIDAD</span><h3>Qué incluye</h3><p>La copia está diseñada para reconstruir los datos de Volley Coach sin guardar credenciales de nube ni tokens de sesión.</p><ul><li>Equipos, jugadores, biblioteca, planificación, historial y entrenamientos.</li><li>Partidos, scoutings, rallies, acciones, estadísticas, clips y enlaces/referencias de vídeo.</li><li>Preferencias propias de Volley Coach.</li><li>Snapshots de recuperación, copia independiente de scouting y Caja fuerte versionada V8.9.3.</li><li>Metadatos de Recording Studio.</li></ul><p><b>No incluye los archivos de vídeo ni los chunks de grabaciones.</b> Esos archivos deben conservarse aparte porque pueden ocupar varios GB.</p><div class="actions"><button class="ghost" id="v790-backup-close">Cerrar</button><button class="primary" id="v790-backup-now">Exportar copia</button></div></div>`;
  document.body.appendChild(modal);modal.onclick=e=>{if(e.target===modal)modal.remove()};$('v790-backup-close').onclick=()=>modal.remove();$('v790-backup-now').onclick=()=>{modal.remove();v790ExportBackup()};
};
function validateBackup(x){
  if(!x||x.type!=='volley-coach-backup')throw new Error('El archivo no es una copia de Volley Coach.');
  if(!x.localStorage||typeof x.localStorage!=='object')throw new Error('La copia no contiene el bloque principal de datos.');
  return true;
}
window.v790RestoreBackup=async function(ev){
  const file=ev?.target?.files?.[0];if(!file)return;
  try{
    const raw=await file.text(),backup=JSON.parse(raw);validateBackup(backup);
    const created=backup.createdAt?new Date(backup.createdAt).toLocaleString('es-ES'):'fecha desconocida';
    if(!confirm(`Restaurar esta copia de seguridad?\n\nCreada: ${created}\nEquipo: ${backup.teamName||'—'}\n\nSe reemplazarán los datos de Volley Coach de este navegador. Los vídeos no se modifican.`))return;

    /* Remove only app-owned, non-sensitive state before restore. */
    backupStorageKeys().forEach(k=>localStorage.removeItem(k));
    Object.entries(backup.localStorage||{}).forEach(([k,v])=>{if(v!=null)localStorage.setItem(k,String(v))});

    const db=backup.indexedDB||{};
    await writeStore('VolleyCoachScoutingV702','scoutingByTeam',db.VolleyCoachScoutingV702?.scoutingByTeam||[]);
    await writeStore('volley-coach-match-recovery-v680','snapshots',db['volley-coach-match-recovery-v680']?.snapshots||[]);
    await writeStore('VolleyCoachRecordingsV770','sessions',db.VolleyCoachRecordingsV770?.sessions||[]);
    await writeStore('VolleyCoachScoutingVaultV893','versions',db.VolleyCoachScoutingVaultV893?.versions||[]);

    alert('Copia restaurada. Volley Coach se recargará ahora.');
    location.reload();
  }catch(err){alert('No se ha podido restaurar la copia.\n\n'+String(err?.message||err))}
  finally{if(ev?.target)ev.target.value=''}
};

/* Open a specific match directly in Video Hub. */
window.v790Diagnostics=()=>({
  version:VERSION,teamId:teamId(),matches:matches().length,players:allPlayerRows().length,
  periodMatches:periodMatches().length,selectedPlayer:$('v790-player')?.value||null,
  backupKeys:backupStorageKeys()
});
// Explicit read-only statistic projectors for invariant/regression tests.
window.VC790_STAT_INTEGRITY=Object.freeze({version:STATS_INTEGRITY_VERSION,matchResult,summarizeActions,rotationSummary});
})();
