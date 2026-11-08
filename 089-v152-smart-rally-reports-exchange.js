
(()=>{
'use strict';
const VERSION='15.2.1',$=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[],B=()=>window.VC_SCOUT_REPORT_BRIDGE||null,V=()=>window.VC_SCOUT_VIDEO_BRIDGE||null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v)||0,pct=(n,d)=>d?Math.round(num(n)*100/num(d)):null,fmt=v=>v==null?'—':`${Math.round(v)}%`,gp=v=>`${num(v)>0?'+':''}${num(v)}`;
function active(){try{return window.MatchState?.getActive?.()||V()?.getActive?.()||window.VC_SCOUT_CORE?.getActive?.()||null}catch(_){return null}}
function setOf(m=active()){return arr(m?.sets).find(s=>Number(s.number)===Number(m?.currentSet))||null}
function rows(m){try{return arr(B()?.actionRows?.(m,false))}catch(_){return[]}}
function playerKey(a){return a?.team==='ours'?`ours:${Number(a?.playerId)||0}`:`opponent:${String(a?.playerId||a?.playerLabel||'')}`}
function other(t){return t==='opponent'?'ours':'opponent'}
function skillName(k){return({S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'}[k]||k||'Acción')}

/* ---------- SMART RALLY ENGINE ---------- */
const SMART_KEY='vc_v152_smart_rally_mode';
let smartMode=localStorage.getItem(SMART_KEY)||'assist',smartPending=null,autoClosing=false;
if(!['auto','assist','manual'].includes(smartMode))smartMode='assist';
function liveActions(m=active()){return arr(m?.liveRally?.actions)}
function inferredPhase(team,m){if(!m)return'';return team==='ours'?(m.servingTeam==='opponent'?'K1':'K2'):(m.servingTeam==='ours'?'K1':'K2')}
function expectedFrom(action,m){const list=liveActions(m),last=action||list[list.length-1];if(!last)return{team:m?.servingTeam==='opponent'?'opponent':'ours',skill:'S',label:'Saque'};const t=last.team==='opponent'?'opponent':'ours',o=other(t),e=String(last.evaluation||'');if(terminal(last))return null;switch(last.skill){case'S':return{team:o,skill:'R',label:'Recepción'};case'R':return{team:t,skill:'E',label:'Colocación'};case'E':return{team:t,skill:'A',label:'Ataque'};case'A':return{team:o,skill:'D',label:'Bloqueo / defensa'};case'B':return{team:o,skill:'D',label:'Defensa'};case'D':return{team:t,skill:'E',label:'Colocación'};case'F':return{team:t,skill:'E',label:'Colocación'};case'C':return{team:t,skill:'A',label:'Ataque'};default:return{team:o,skill:'D',label:'Continuación'}}}
function terminal(a){if(!a)return null;const t=a.team==='opponent'?'opponent':'ours',o=other(t),s=String(a.skill||'').toUpperCase(),e=String(a.evaluation||'');if(s==='S'&&e==='#')return{winner:t,confidence:'alta',reason:'ace'};if(s==='S'&&e==='=')return{winner:o,confidence:'alta',reason:'error de saque'};if(s==='R'&&e==='=')return{winner:o,confidence:'alta',reason:'error de recepción'};if(s==='A'&&e==='#')return{winner:t,confidence:'alta',reason:'ataque punto'};if(s==='A'&&(e==='='||e==='/'))return{winner:o,confidence:'alta',reason:e==='/'?'ataque bloqueado':'error de ataque'};if(s==='B'&&e==='#')return{winner:t,confidence:'alta',reason:'bloqueo punto'};if(s==='B'&&e==='=')return{winner:o,confidence:'media',reason:'error de bloqueo'};if(s==='D'&&e==='=')return{winner:o,confidence:'media',reason:'defensa no controlada'};return null}
function enrichAction(action){const m=active(),x={...(action||{})};if(!['ours','opponent'].includes(x.team)){const exp=expectedFrom(null,m);x.team=exp?.team||'ours';x.smartTeamInferred=true}if(!x.phase){x.phase=inferredPhase(x.team,m);x.smartPhaseInferred=true}const s=setOf(m);x.smartRally={version:VERSION,mode:smartMode,scoreBefore:{us:num(s?.scoreUs),opponent:num(s?.scoreOpponent)},rotation:num(m?.rotationNo)||1,opponentRotation:num(m?.opponentRotationNo)||1,servingBefore:m?.servingTeam||'ours',capturedAt:new Date().toISOString()};return x}
function renderSmart(){ensureSmartUI();const m=active(),list=liveActions(m),last=list[list.length-1],exp=expectedFrom(last,m);document.querySelectorAll('[data-v152-mode]').forEach(b=>b.classList.toggle('active',b.dataset.v152Mode===smartMode));const modeCopy=$('v152-smart-mode-copy');if(modeCopy)modeCopy.textContent=smartMode==='auto'?'AUTO · completa contexto y cierra terminales':smartMode==='assist'?'ASISTIDO · propone y confirma':'MANUAL · solo informa';const next=$('v152-smart-next');if(next){if(exp)next.innerHTML=`<strong>${exp.team==='ours'?'Nuestro':'Rival'} · ${esc(exp.label)}</strong><small>${last?`Después de ${skillName(last.skill)} ${esc(last.evaluation||'')}`:'Inicio del rally'} · fase ${esc(inferredPhase(exp.team,m)||'—')}</small>`;else next.innerHTML='<strong>Rally terminal detectado</strong><small>Registra/confirma el punto para continuar.</small>'}const prep=$('v152-smart-prepare');if(prep){prep.disabled=!exp;prep.dataset.team=exp?.team||'';prep.dataset.skill=exp?.skill||''}const p=$('v152-smart-pending');if(p){p.className='v152-smart-card v152-smart-pending'+(smartPending?(smartPending.winner==='ours'?' good':' bad'):'');p.innerHTML=smartPending?`<span>CIERRE DE RALLY DETECTADO</span><strong>${smartPending.winner==='ours'?'Punto nuestro':'Punto rival'} · ${esc(smartPending.reason)}</strong><p>Confianza ${esc(smartPending.confidence)}. ${smartMode==='assist'?'Confirma antes de mover el marcador.':'Modo actual: '+smartMode+'.'}</p><div class="v152-smart-actions"><button type="button" class="primary" onclick="v152ConfirmSmartPoint()">Confirmar punto</button><button type="button" class="ghost" onclick="v152DismissSmartPoint()">Seguir rally</button></div>`:`<span>LECTURA DEL RALLY</span><strong>${list.length} acciones · ${m?.servingTeam==='opponent'?'K1 / Side-out':'K2 / Break Point'}</strong><p>El motor infiere equipo, fase y siguiente fundamento sin modificar datos explícitos.</p><span class="v152-smart-confidence">Contexto ${smartMode==='manual'?'informativo':'activo'}</span>`}}
function ensureSmartUI(){if($('v152-smart-strip'))return;const host=$('v132-cockpit')||$('v121-live-control');if(!host)return;const n=document.createElement('section');n.id='v152-smart-strip';n.className='v152-smart-strip';n.innerHTML=`<article class="v152-smart-card"><span>SMART RALLY ENGINE</span><b id="v152-smart-mode-copy">Asistido</b><div class="v152-smart-modes"><button type="button" data-v152-mode="auto" onclick="v152SetSmartMode('auto')">AUTO</button><button type="button" data-v152-mode="assist" onclick="v152SetSmartMode('assist')">ASISTIDO</button><button type="button" data-v152-mode="manual" onclick="v152SetSmartMode('manual')">MANUAL</button></div></article><article class="v152-smart-card"><span>SIGUIENTE ACCIÓN PROBABLE</span><div class="v152-smart-main"><div class="v152-smart-icon">→</div><div id="v152-smart-next"><strong>Preparando contexto…</strong><small>—</small></div></div><div class="v152-smart-actions"><button id="v152-smart-prepare" type="button" class="ghost" onclick="v152PrepareSuggestion()">Preparar acción</button></div></article><article id="v152-smart-pending" class="v152-smart-card v152-smart-pending"></article>`;host.insertAdjacentElement('afterend',n)}
window.v152SetSmartMode=function(mode){if(!['auto','assist','manual'].includes(mode))return;smartMode=mode;localStorage.setItem(SMART_KEY,mode);smartPending=null;renderSmart()};
window.v152PrepareSuggestion=function(){const b=$('v152-smart-prepare');if(!b||b.disabled)return;try{window.v132SetTeam?.(b.dataset.team);window.v132SetSkill?.(b.dataset.skill)}catch(_){}renderSmart()};
window.v152ConfirmSmartPoint=async function(){if(!smartPending||autoClosing)return;const p=smartPending;smartPending=null;autoClosing=true;try{await window.v121AwardPoint?.(p.winner)}finally{autoClosing=false;setTimeout(renderSmart,0)}};
window.v152DismissSmartPoint=function(){smartPending=null;renderSmart()};
function afterSmartPush(){const m=active(),list=liveActions(m),a=list[list.length-1];if(!a){renderSmart();return}const t=terminal(a);if(t){smartPending={...t,actionId:a.id||null,at:Date.now()};if(smartMode==='auto'&&t.confidence==='alta'){setTimeout(()=>window.v152ConfirmSmartPoint(),40)}else renderSmart();return}smartPending=null;const exp=expectedFrom(a,m);if(smartMode==='auto'&&exp)setTimeout(()=>{try{window.v132SetTeam?.(exp.team);window.v132SetSkill?.(exp.skill)}catch(_){}renderSmart()},35);else renderSmart()}
try{const base=window.scoutPushAction;if(typeof base==='function'&&!base.__v152){const wrapped=function(action){const out=base.call(this,enrichAction(action));setTimeout(afterSmartPush,0);return out};wrapped.__v152=true;wrapped.__v152Base=base;window.scoutPushAction=wrapped;if(window.VC_SCOUT_CORE)window.VC_SCOUT_CORE.push=a=>window.scoutPushAction(a)}}catch(e){console.warn('V15.2 Smart Rally wrapper',e)}
try{window.MatchState?.subscribe?.(()=>setTimeout(renderSmart,0))}catch(_){}

/* ---------- ADVANCED INDIVIDUAL REPORTS ---------- */
function selectedPlayer(){const key=$('v151-player')?.value||'';const p=arr(window.VC_V151_SEASON?.players?.()).find(x=>String(x.key)===String(key));return p||null}
function seasonMatches(){return arr(window.VC_V151_SEASON?.matches?.())}
function playerRows(m,key){return rows(m).filter(a=>a.team==='ours'&&playerKey(a)===key)}
function evalCounts(rr){const c={'#':0,'+':0,'!':0,'-':0,'/':0,'=':0};rr.forEach(a=>{const e=String(a.evaluation||'');if(e in c)c[e]++});return c}
function rowMetric(rr,skill){const x=rr.filter(a=>a.skill===skill),c=evalCounts(x);if(skill==='R')return{n:x.length,main:x.length?pct(c['#']+c['+'],x.length):null,aux:x.length?pct(c['#'],x.length):null};if(skill==='A')return{n:x.length,main:x.length?pct(c['#'],x.length):null,aux:x.length?Math.round((c['#']-c['=']-c['/'])*100/x.length):null};if(skill==='S')return{n:x.length,main:x.length?Math.round((c['#']-c['='])*100/x.length):null,aux:c['#']};return{n:x.length,main:null,aux:null}}
function advancedData(p){if(!p)return null;const ms=seasonMatches(),all=[];ms.forEach(m=>playerRows(m,p.key).forEach(a=>all.push({...a,__m:m})));const recentMatches=ms.slice(-5),recent=[];recentMatches.forEach(m=>playerRows(m,p.key).forEach(a=>recent.push({...a,__m:m})));const rotations=Array.from({length:6},(_,i)=>{const rr=all.filter(a=>num(a.rotation)===i+1);return{r:i+1,n:rr.length,rec:rowMetric(rr,'R'),att:rowMetric(rr,'A'),serve:rowMetric(rr,'S')}});const phases=['K1','K2'].map(ph=>{const rr=all.filter(a=>String(a.phase||'')===ph);return{phase:ph,n:rr.length,rec:rowMetric(rr,'R'),att:rowMetric(rr,'A'),serve:rowMetric(rr,'S')}});const season={rec:rowMetric(all,'R'),att:rowMetric(all,'A'),serve:rowMetric(all,'S')},recent5={rec:rowMetric(recent,'R'),att:rowMetric(recent,'A'),serve:rowMetric(recent,'S')},video=all.filter(a=>[a.videoTimestamp,a.liveVideoTime,a.videoAction,a.videoTime].some(v=>Number.isFinite(Number(v)))).length;return{all,recent,rotations,phases,season,recent5,video,videoPct:all.length?pct(video,all.length):null}}
function delta(a,b){return a==null||b==null?null:Math.round(a-b)}
function deltaHTML(d){if(d==null)return'<i>—</i>';return`<i class="${d>0?'up':d<0?'down':''}">${d>0?'+':''}${d} pp</i>`}
function insights(d){const out=[];const dr=delta(d.recent5.rec.main,d.season.rec.main),da=delta(d.recent5.att.aux,d.season.att.aux),ds=delta(d.recent5.serve.main,d.season.serve.main);if(dr!=null)out.push({c:dr>=5?'good':dr<=-5?'bad':'',t:`Recepción últimos 5: ${dr>0?'+':''}${dr} pp respecto a la temporada.`});if(da!=null)out.push({c:da>=5?'good':da<=-5?'bad':'',t:`Eficiencia de ataque últimos 5: ${da>0?'+':''}${da} pp.`});if(ds!=null)out.push({c:ds>=5?'good':ds<=-5?'bad':'',t:`Eficiencia de saque últimos 5: ${ds>0?'+':''}${ds} pp.`});const ra=d.rotations.filter(x=>x.att.n>=3).sort((a,b)=>(b.att.aux??-999)-(a.att.aux??-999));if(ra[0])out.push({c:'good',t:`Mejor rotación ofensiva con muestra ≥3: R${ra[0].r} · ${fmt(ra[0].att.aux)} eficiencia.`});if(ra.at(-1)&&ra.length>1)out.push({c:'warn',t:`Rotación ofensiva a revisar: R${ra.at(-1).r} · ${fmt(ra.at(-1).att.aux)} eficiencia.`});out.push({c:d.videoPct>=70?'good':d.videoPct<40?'warn':'',t:`Cobertura de vídeo individual: ${d.video}/${d.all.length} acciones (${fmt(d.videoPct)}).`});return out}
function enhanceReport(){const box=$('v151-player-report');if(!box)return;box.querySelector('#v152-player-advanced')?.remove();const p=selectedPlayer();if(!p)return;const d=advancedData(p);if(!d)return;const n=document.createElement('section');n.id='v152-player-advanced';n.className='v152-adv-report';n.innerHTML=`<div class="v152-adv-head"><div><span>INFORME INDIVIDUAL PRO · V15.2</span><h3>Contexto, rotaciones y tendencia reciente</h3><p>Compara la temporada con los últimos 5 partidos y separa rendimiento por rotación y fase.</p></div><button type="button" class="primary" onclick="v152PrintAdvancedPlayer()">Informe completo PDF</button></div><div class="v152-adv-grid"><article class="v152-adv-card"><header><span>ÚLTIMOS 5 vs TEMPORADA</span><b>Tendencia individual</b></header><div class="v152-adv-body"><div class="v152-metric-compare"><span>Métrica</span><b>Temporada</b><b>Últ. 5</b><i>Δ</i></div><div class="v152-metric-compare"><span>Recepción positiva</span><b>${fmt(d.season.rec.main)}</b><b>${fmt(d.recent5.rec.main)}</b>${deltaHTML(delta(d.recent5.rec.main,d.season.rec.main))}</div><div class="v152-metric-compare"><span>Ataque eficiencia</span><b>${fmt(d.season.att.aux)}</b><b>${fmt(d.recent5.att.aux)}</b>${deltaHTML(delta(d.recent5.att.aux,d.season.att.aux))}</div><div class="v152-metric-compare"><span>Saque eficiencia</span><b>${fmt(d.season.serve.main)}</b><b>${fmt(d.recent5.serve.main)}</b>${deltaHTML(delta(d.recent5.serve.main,d.season.serve.main))}</div></div></article><article class="v152-adv-card"><header><span>LECTURA PARA STAFF</span><b>Indicadores relevantes</b></header><div class="v152-adv-body v152-insights">${insights(d).map(x=>`<div class="v152-insight ${x.c}">${esc(x.t)}</div>`).join('')}</div></article></div><div class="v152-adv-grid"><article class="v152-adv-card"><header><span>R1–R6</span><b>Rendimiento por rotación</b></header><div class="v152-adv-body"><table class="v152-mini-table"><thead><tr><th>Rot.</th><th>REC +</th><th>n</th><th>ATQ Eff</th><th>n</th><th>SAQ Eff</th><th>n</th></tr></thead><tbody>${d.rotations.map(r=>`<tr><td><b>R${r.r}</b></td><td>${fmt(r.rec.main)}</td><td>${r.rec.n}</td><td>${fmt(r.att.aux)}</td><td>${r.att.n}</td><td>${fmt(r.serve.main)}</td><td>${r.serve.n}</td></tr>`).join('')}</tbody></table></div></article><article class="v152-adv-card"><header><span>FASES DE JUEGO</span><b>K1 / K2 individual</b></header><div class="v152-adv-body"><table class="v152-mini-table"><thead><tr><th>Fase</th><th>REC +</th><th>ATQ Pts</th><th>ATQ Eff</th><th>SAQ Eff</th><th>Acc.</th></tr></thead><tbody>${d.phases.map(x=>`<tr><td><b>${x.phase}</b></td><td>${fmt(x.rec.main)}</td><td>${fmt(x.att.main)}</td><td>${fmt(x.att.aux)}</td><td>${fmt(x.serve.main)}</td><td>${x.n}</td></tr>`).join('')}</tbody></table></div></article></div>`;box.querySelector('.v151-report')?.appendChild(n)}
function printAdvanced(){const p=selectedPlayer();if(!p)return alert('Selecciona una jugadora.');const d=advancedData(p);if(!d)return;const w=window.open('','_blank');if(!w)return alert('Permite ventanas emergentes para generar el informe.');const rot=d.rotations.map(r=>`<tr><td>R${r.r}</td><td>${fmt(r.rec.main)} (${r.rec.n})</td><td>${fmt(r.att.main)} / ${fmt(r.att.aux)} (${r.att.n})</td><td>${fmt(r.serve.main)} (${r.serve.n})</td></tr>`).join('');const ph=d.phases.map(x=>`<tr><td>${x.phase}</td><td>${fmt(x.rec.main)}</td><td>${fmt(x.att.main)}</td><td>${fmt(x.att.aux)}</td><td>${fmt(x.serve.main)}</td></tr>`).join('');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Informe ${esc(p.label)}</title><style>@page{size:A4;margin:13mm}body{font-family:Arial;color:#18384f;font-size:10px}h1{font-size:22px;margin:0}h2{font-size:13px;margin:18px 0 7px;border-bottom:1px solid #ccd9e1;padding-bottom:5px}.hero{display:flex;justify-content:space-between;border-bottom:2px solid #173b55;padding-bottom:10px}.hero b{font-size:30px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}.k{border:1px solid #dce5ea;padding:8px;border-radius:6px}.k span{font-size:8px;color:#728692}.k b{display:block;font-size:17px;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e1e8ec;padding:6px;text-align:center}th{background:#eef3f6;font-size:8px}th:first-child,td:first-child{text-align:left}.ins{padding:6px 8px;border-left:3px solid #5c89a5;background:#f6f9fb;margin:5px 0}.foot{margin-top:20px;font-size:8px;color:#82919a}</style></head><body><div class="hero"><div><small>VOLLEY COACH · INFORME INDIVIDUAL V15.2</small><h1>${esc(p.label)}</h1><div>${p.matches} partidos · ${p.actions} acciones</div></div><b>${gp(p.gp)}<small style="display:block;font-size:8px">G-P</small></b></div><div class="kpis"><div class="k"><span>Recepción positiva</span><b>${fmt(p.recPosPct)}</b></div><div class="k"><span>Ataque eficiencia</span><b>${fmt(p.attEff)}</b></div><div class="k"><span>Saque eficiencia</span><b>${fmt(p.serveEff)}</b></div><div class="k"><span>Bloqueos</span><b>${p.blocks}</b></div></div><h2>Tendencia últimos 5 vs temporada</h2><table><tr><th>Métrica</th><th>Temporada</th><th>Últimos 5</th><th>Diferencia</th></tr><tr><td>Recepción positiva</td><td>${fmt(d.season.rec.main)}</td><td>${fmt(d.recent5.rec.main)}</td><td>${deltaHTML(delta(d.recent5.rec.main,d.season.rec.main)).replace(/<[^>]+>/g,'')}</td></tr><tr><td>Ataque eficiencia</td><td>${fmt(d.season.att.aux)}</td><td>${fmt(d.recent5.att.aux)}</td><td>${deltaHTML(delta(d.recent5.att.aux,d.season.att.aux)).replace(/<[^>]+>/g,'')}</td></tr><tr><td>Saque eficiencia</td><td>${fmt(d.season.serve.main)}</td><td>${fmt(d.recent5.serve.main)}</td><td>${deltaHTML(delta(d.recent5.serve.main,d.season.serve.main)).replace(/<[^>]+>/g,'')}</td></tr></table><h2>Rotaciones</h2><table><tr><th>Rotación</th><th>Recepción +</th><th>Ataque Pts / Eff</th><th>Saque Eff</th></tr>${rot}</table><h2>Fases</h2><table><tr><th>Fase</th><th>Recepción +</th><th>Ataque Pts</th><th>Ataque Eff</th><th>Saque Eff</th></tr>${ph}</table><h2>Lectura para staff</h2>${insights(d).map(x=>`<div class="ins">${esc(x.t)}</div>`).join('')}<div class="foot">Generado por Volley Coach V15.2 · cobertura de vídeo ${d.video}/${d.all.length} (${fmt(d.videoPct)}).</div><script>setTimeout(()=>window.print(),150)<\/script></body></html>`);w.document.close()}
window.v152PrintAdvancedPlayer=printAdvanced;window.v151PrintCurrentPlayer=printAdvanced;
['v151Tab','v151PlayerChanged','v151SelectPlayer','v151PeriodChanged','v151CustomChanged'].forEach(name=>{const base=window[name];if(typeof base==='function'&&!base.__v152){const wrapped=function(...args){const out=base.apply(this,args);setTimeout(enhanceReport,0);return out};wrapped.__v152=true;window[name]=wrapped}});

/* ---------- PROFESSIONAL EXCHANGE CENTER ---------- */
let importPayload=null;
function download(name,content,type='application/octet-stream'){const blob=content instanceof Blob?content:new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},30000)}
function cleanName(s){return String(s||'volley').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'volley'}
function allMatches(){return arr(V()?.getMatches?.())}
function currentMatch(){return active()}
function exchangePayload(scope='season'){const ms=scope==='current'?(currentMatch()?[currentMatch()]:[]):allMatches();return{type:'volley-coach-exchange',schema:'vcx/1.0',appVersion:VERSION,exportedAt:new Date().toISOString(),scope,matchCount:ms.length,source:{app:'Volley Coach',statisticsEngine:window.VC_STATS_ENGINE?.version||null,matchState:window.MatchState?.schema||null},matches:(typeof structuredClone==='function'?structuredClone(ms):JSON.parse(JSON.stringify(ms)))}}
function csvCell(v){return window.VC_EXCHANGE_SAFETY_1633?.csvCell(v)??String(v??'')}
function actionsCSV(ms){
 const helper=window.VC_EXCHANGE_SAFETY_1633;
 if(!helper?.csvRows)throw Error('El exportador CSV seguro no está disponible.');
 const head=['match_id','date','opponent','set','rally','score_us','score_opponent','rotation','opponent_rotation','phase','serving','team','player_id','player','skill','evaluation','start_zone','end_zone','code','video_seconds'];
 const result=[head];
 ms.forEach(m=>rows(m).forEach(a=>result.push([
  m.id,m.date??'',m.opponent??'',a.set??'',a.rallyIndex??a.rallyId??'',
  a.scoreUs??a.scoreAfter?.us??'',a.scoreOpponent??a.scoreAfter?.opponent??'',
  a.rotation??'',a.opponentRotation??'',a.phase??'',a.servingBefore??'',a.team??'',
  a.playerId??'',a.playerNameSnapshot??a.playerLabel??'',a.skill??'',a.evaluation??'',
  a.startZone??'',a.endZone??'',a.code??'',
  a.videoTimestamp??a.liveVideoTime??a.videoAction??a.videoTime??''
 ])));
 return helper.csvRows(result);
}
function dvCodes(ms){const out=['# Volley Coach V15.2 · DataVolley code exchange','# One action code per line. Metadata lines start with #.'];ms.forEach(m=>{out.push(`# MATCH ${m.id||''} | ${m.date||''} | ${m.opponent||'Rival'}`);let lastSet=null;rows(m).forEach(a=>{if(a.set!==lastSet){lastSet=a.set;out.push(`# SET ${lastSet||''}`)}if(a.code)out.push(String(a.code).trim())})});return out.join('\n')}
window.v152Export=function(kind,scope='season'){
 try{
  const ms=scope==='current'?(currentMatch()?[currentMatch()]:[]):allMatches();
  if(!ms.length)return alert('No hay scoutings para exportar.');
  const base=scope==='current'?cleanName(`${ms[0].date||''}_${ms[0].opponent||'partido'}`):`temporada_${new Date().toISOString().slice(0,10)}`;
  if(kind==='vcx')download(`${base}.vcx`,JSON.stringify(exchangePayload(scope),null,2),'application/json');
  else if(kind==='json')download(`${base}_backup.json`,JSON.stringify({type:'volley-coach-scout-backup',match:ms[0]||null,matches:ms,exportedAt:new Date().toISOString()},null,2),'application/json');
  else if(kind==='csv')download(`${base}_acciones.csv`,actionsCSV(ms),'text/csv;charset=utf-8');
  else if(kind==='dvcodes')download(`${base}_datavolley_codes.txt`,dvCodes(ms),'text/plain;charset=utf-8');
  else throw Error('Formato de exportación no soportado.');
 }catch(err){console.error('Exchange export',err);alert(`No se pudo preparar la descarga: ${err?.message||err}`)}
};
window.v1633CheckExport=function(){
 const check={scouting:!!currentMatch(),puente:!!B()?.actionRows,pdfOficial:typeof window.scoutV114ExportOfficialPDF==='function',libreriaPDF:!!window.jspdf?.jsPDF,libreriaHTML:!!window.html2canvas,pdfNativo:typeof window.VC_V752_PDF_CORE?.exportOfficialMatch==='function',csv:!!window.VC_EXCHANGE_SAFETY_1633?.csvRows};
 alert(`Diagnóstico de exportación (no genera archivos):\n${Object.entries(check).map(([k,v])=>`${k}: ${v?'Disponible':'No cargado'}`).join('\n')}\n\nSi las librerías PDF no están cargadas, utiliza su carga bajo demanda o el PDF alternativo nativo. La descarga final requiere una prueba manual.`);
 return check;
};
window.v1633NativePDF=function(){
 const m=currentMatch();if(!m)return alert('Abre un scouting antes de exportar.');
 const core=window.VC_V752_PDF_CORE;
 if(typeof core?.exportOfficialMatch!=='function')return alert('El exportador nativo no está disponible en esta instalación.');
 try{core.exportOfficialMatch(m)}catch(err){console.error('PDF nativo',err);alert(`No se pudo generar el PDF alternativo: ${err?.message||err}`)}
};
function extractCodes(text){return window.VC_EXCHANGE_SAFETY_1633?.extractCodes(text)||[]}
function selectedTeam(){return String(V()?.getTeamId?.()||'')}
function importMatchList(payload){return payload.kind==='vcx'?payload.data?.matches:(Array.isArray(payload.data?.matches)?payload.data.matches:payload.data?.match?[payload.data.match]:[])}
function safePlan(ms){
 const helper=window.VC_EXCHANGE_SAFETY_1633;
 if(!helper?.planImport)throw Error('No se ha cargado la protección de importación V16.3.3.');
 return helper.planImport(ms,allMatches(),{normalize:typeof window.scoutNormalizeMatch==='function'?window.scoutNormalizeMatch:null});
}
function previewImport(file,text){
 let kind='unknown',summary='',data=null,codes=[],plan=null,error='';
 const helper=window.VC_EXCHANGE_SAFETY_1633;
 if(!helper){error='No está disponible el módulo de seguridad V16.3.3.'}
 else if(/\.dvw$/i.test(file.name)){error='Los archivos DVW binarios no son importables como texto. Exporta códigos de texto o un archivo VCX.'}
 else try{
  try{
   const json=JSON.parse(text);
   if(json?.type==='volley-coach-exchange'&&Array.isArray(json.matches)){kind='vcx';data=json}
   else if(json?.match||Array.isArray(json?.matches)){kind='json';data=json}
  }catch(_){}
  if(kind==='vcx'||kind==='json'){
   plan=safePlan(importMatchList({kind,data}));
   summary=`${kind.toUpperCase()} · ${plan.total} scoutings · ${plan.additions.length} por añadir · ${plan.forked} con ID nuevo · ${plan.skipped} idénticos omitidos.`;
  }else{
   codes=extractCodes(text);
   if(codes.length){kind='codes';summary=`Códigos de texto · ${codes.length} acciones, incluidas las repeticiones.`}
   else error='Formato no reconocido o CSV de acciones. Para restaurar un partido usa VCX/JSON, no el CSV de estadísticas.';
  }
 }catch(e){error=String(e?.message||e);kind='unknown'}
 importPayload={file,kind,data,codes,team:selectedTeam(),error};
 const box=$('v152-import-preview');box?.classList.add('open');
 if(box){
  const details=kind==='codes'?codes.slice(0,20).join(' · '):
   plan?importMatchList({kind,data}).slice(0,20).map(m=>`${m.date||'Sin fecha'} · ${m.opponent||'Rival'} · ID ${m.id} · ${arr(m.sets).length} sets`).join('\n'):'';
  box.innerHTML=`<b>${esc(file.name)}</b><div class="v152-import-status">${esc(error||summary)}</div>${details?`<pre>${esc(details)}</pre>`:''}<p class="v152-import-status">No se sustituirán scoutings existentes. Las copias divergentes se guardarán con otro identificador. Se solicitará descargar una copia local antes de importar.</p><div class="v152-smart-actions"><button type="button" class="primary" onclick="v152CommitImport()" ${error||kind==='unknown'?'disabled':''}>Importar con protección</button><button type="button" class="ghost" onclick="v152ClearImport()">Cancelar</button></div>`;
 }
}
window.v152ChooseImport=function(){const input=$('v152-import-file');input?.click()};
window.v152ImportSelected=function(ev){
 const f=ev?.target?.files?.[0];if(!f)return;
 if(f.size>25*1024*1024){alert('Archivo demasiado grande. Límite de importación: 25 MB.');return}
 const r=new FileReader();r.onload=()=>previewImport(f,String(r.result||''));
 r.onerror=()=>alert('No se ha podido leer el archivo. No se han modificado datos.');r.readAsText(f);
};
window.v152ClearImport=function(){importPayload=null;const box=$('v152-import-preview');box?.classList.remove('open');if(box)box.innerHTML='';const f=$('v152-import-file');if(f)f.value=''};
function requireSafeBackup(){
 let body,kind='estado';
 try{
  const get=window.estadoLocal;
  if(typeof get==='function'){const state=get();if(state&&typeof state==='object')body=JSON.stringify(state,null,2)}
  if(!body){kind='scoutings';body=JSON.stringify(exchangePayload('season'),null,2)}
  if(!body||body.length<20)throw Error('No hay una copia válida para exportar.');
  download(`VolleyCoach_PreImport_${kind}_${new Date().toISOString().replace(/[:.]/g,'-')}.json`,body,'application/json');
 }catch(err){alert(`No se ha podido crear la copia previa: ${err?.message||err}. La importación se ha cancelado.`);return false}
 return confirm('Se ha solicitado la descarga de una copia local. Comprueba que la has guardado correctamente y que puedes abrir el archivo JSON. ¿Confirmas que tienes la copia y deseas continuar?');
}
async function protectBeforeImport(){
 if(window.VC_SYNC_SAFETY_1631?.status?.().blocked)throw Error('Hay conflictos de sincronización pendientes. Resuélvelos antes de importar.');
 if(typeof window.v137SaveNow==='function')await window.v137SaveNow();
 if(typeof window.VC_SAVE_STATE?.snapshot==='function')await window.VC_SAVE_STATE.snapshot();
}
async function importMatchesSafely(incoming){
 const bridge=V(),target=bridge?.getMatches?.();
 if(!Array.isArray(target))throw Error('No está disponible el almacén de scoutings del equipo actual.');
 const plan=safePlan(incoming);
 if(!plan.additions.length)return { ...plan, saved:true };
 if(typeof bridge?.save!=='function'||typeof window.scoutV902Flush!=='function')throw Error('El guardado confirmado del scouting no está disponible. No se ha aplicado la importación.');
 const old=target.slice();
 try{
  target.push(...plan.additions);
  bridge.save();
  let saved=await window.scoutV902Flush();
  if(saved===false)saved=await window.scoutV902Flush();
  if(saved!==true)throw Error('El guardado local no ha confirmado la importación.');
  return {...plan,saved:true};
 }catch(err){
  target.splice(0,target.length,...old);
  try{bridge.save();await window.scoutV902Flush()}catch(rollbackError){console.error('Error al revertir importación',rollbackError)}
  throw err;
 }
}
window.v152CommitImport=async function(){
 const p=importPayload;if(!p||p.error)return;
 if(!window.VC_EXCHANGE_SAFETY_1633)return alert('No está disponible el control de seguridad de importación.');
 if(p.team!==selectedTeam())return alert('Se ha cambiado de equipo. Vuelve a seleccionar el archivo para evitar importar en el equipo equivocado.');
 const button=$('v152-import-preview')?.querySelector('.primary');if(button?.disabled)return;
 if(button)button.disabled=true;
 try{
  if(p.kind==='vcx'||p.kind==='json'){
   const ms=importMatchList(p),plan=safePlan(ms);
   if(!plan.additions.length)return alert('Estos scoutings ya existen sin cambios. No es necesario importarlos.');
   if(!requireSafeBackup())return;
   if(!confirm(`Se añadirán ${plan.additions.length} scoutings (${plan.forked} con ID distinto para conservar versiones). No se reemplazará ningún partido existente. ¿Continuar?`))return;
   await protectBeforeImport();
   const res=await importMatchesSafely(ms);
   alert(`Importación guardada localmente: ${res.additions.length} añadidos, ${res.forked} IDs nuevos y ${res.skipped} duplicados idénticos omitidos. Comprueba la nube antes de borrar cualquier copia.`);
   window.v152ClearImport();try{window.v122RenderSwitcher?.()}catch(_){}return;
  }
  if(p.kind==='codes'){
   const m=currentMatch();if(!m)return alert('Abre primero un scouting para importar códigos.');
   if(m.status==='finished')return alert('El scouting está finalizado: reábrelo desde Partidos guardados antes de modificarlo.');
   if(typeof window.VC_SCOUT_CORE?.register!=='function'||typeof V()?.save!=='function')return alert('El motor de scouting no está disponible.');
   if(!requireSafeBackup())return;
   if(!confirm(`Se añadirán ${p.codes.length} códigos al rally activo, respetando los repetidos. Esta operación no es atómica: revisa los resultados antes de confirmar puntos. ¿Continuar?`))return;
   await protectBeforeImport();
   let ok=0,fail=0;const previous=smartMode;if(smartMode==='auto')smartMode='assist';
   try{for(const c of p.codes){try{const result=window.VC_SCOUT_CORE.register(c,m);if(result?.ok===false)fail++;else ok++}catch(_){fail++}}}finally{smartMode=previous}
   V().save();let persisted=await window.scoutV902Flush?.();if(persisted===false)persisted=await window.scoutV902Flush?.();
   alert(`Códigos procesados: ${ok}. Rechazados: ${fail}. ${persisted===true?'Guardado local confirmado.':'No se ha confirmado el guardado local: conserva la copia y verifica el scouting.'}`);
   window.v152ClearImport();renderSmart();return;
  }
 }catch(err){console.error('Importación protegida',err);alert(`No se pudo finalizar la importación: ${err?.message||err}. Comprueba la copia local descargada.`)}
 finally{if(button?.isConnected)button.disabled=false}
};
function ensureExchange(){if($('v152-exchange-modal'))return;const m=document.createElement('div');m.id='v152-exchange-modal';m.className='v152-exchange-modal';m.innerHTML=`<div class="v152-exchange-card" role="dialog" aria-modal="true"><div class="v152-exchange-head"><div><span>INTERCAMBIO SEGURO · V16.3.3</span><h2>Importar / Exportar</h2><p>Copias previas, importación no destructiva, CSV seguro y exportación PDF alternativa.</p></div><button type="button" class="ghost" onclick="v152CloseExchange()">Cerrar ×</button></div><div class="v152-exchange-body"><div class="v152-exchange-grid"><section class="v152-exchange-section"><header><span>EXPORTAR</span><b>Partido actual</b></header><div class="v152-exchange-list"><div class="v152-exchange-option"><span>VCX</span><div><b>Volley Coach Exchange</b><small>Partido completo y recuperable, con rallies, vídeo, alineaciones y metadatos.</small></div><button onclick="v152Export('vcx','current')">Exportar</button></div><div class="v152-exchange-option"><span>CSV</span><div><b>Acciones estructuradas</b><small>Una fila por acción, preparada para Excel/R/Python.</small></div><button onclick="v152Export('csv','current')">Exportar</button></div><div class="v152-exchange-option"><span>DV</span><div><b>Códigos DataVolley</b><small>Una acción/código por línea para intercambio y revisión.</small></div><button onclick="v152Export('dvcodes','current')">Exportar</button></div></div></section><section class="v152-exchange-section"><header><span>EXPORTAR</span><b>Temporada / histórico</b></header><div class="v152-exchange-list"><div class="v152-exchange-option"><span>VCX</span><div><b>Backup de temporada</b><small>Todos los scoutings actuales en un único archivo versionado.</small></div><button onclick="v152Export('vcx','season')">Exportar</button></div><div class="v152-exchange-option"><span>CSV</span><div><b>Dataset completo</b><small>Todas las acciones de todos los partidos.</small></div><button onclick="v152Export('csv','season')">Exportar</button></div><div class="v152-exchange-option"><span>DV</span><div><b>Códigos de temporada</b><small>Códigos agrupados por partido y set.</small></div><button onclick="v152Export('dvcodes','season')">Exportar</button></div></div></section></div><div class="v152-smart-actions"><button type="button" class="ghost" onclick="v1633CheckExport()">Verificar exportaciones</button><button type="button" class="ghost" onclick="v1633NativePDF()" title="Formato alternativo que no sustituye la hoja oficial habitual">PDF alternativo (nativo)</button></div><section class="v152-exchange-section"><header><span>IMPORTAR</span><b>Previsualización y protección antes de aplicar</b></header><div class="v152-exchange-list"><div class="v152-import-drop"><b>VCX · JSON · TXT/CSV de códigos</b><p>Importa copias completas VCX/JSON o códigos de texto. DVW binario y CSV estadístico no se importan como partidos.</p><button type="button" class="primary" onclick="v152ChooseImport()">Seleccionar archivo</button><input id="v152-import-file" type="file" hidden accept=".vcx,.json,.txt,.csv,application/json,text/plain,text/csv" onchange="v152ImportSelected(event)"></div><div id="v152-import-preview" class="v152-import-preview"></div></div></section></div></div>`;m.addEventListener('click',e=>{if(e.target===m)window.v152CloseExchange()});document.body.appendChild(m)}
window.v152OpenExchange=function(){ensureExchange();const m=$('v152-exchange-modal');m?.classList.add('open');m?.querySelector('button')?.focus()};window.v152CloseExchange=function(){$('v152-exchange-modal')?.classList.remove('open');window.v152ClearImport?.()};
function addExchangeEntrypoints(){ensureExchange();const tools=$('v140-tools-sheet')?.querySelector('.v140-tools-list');if(tools&&!tools.querySelector('[data-v152-exchange]')){const b=document.createElement('button');b.type='button';b.dataset.v152Exchange='1';b.innerHTML='<span>⇄</span><div><b>Importar / Exportar Pro <em class="v152-tools-badge">V15.2</em></b><small>VCX, CSV, códigos DataVolley y lector DVW experimental.</small></div>';b.onclick=()=>{document.getElementById('v140-tools-sheet')?.classList.remove('open');window.v152OpenExchange()};tools.appendChild(b)}const h=document.querySelector('#v151-season-root .v151-head-actions');if(h&&!h.querySelector('[data-v152-exchange]')){const b=document.createElement('button');b.type='button';b.className='ghost';b.dataset.v152Exchange='1';b.textContent='⇄ Intercambio';b.onclick=window.v152OpenExchange;h.insertBefore(b,h.firstChild)}}
const oldTools=window.v140OpenTools;if(typeof oldTools==='function'&&!oldTools.__v152){const w=function(...args){const out=oldTools.apply(this,args);setTimeout(addExchangeEntrypoints,0);return out};w.__v152=true;window.v140OpenTools=w}

/* Boot / integration */
function boot(){ensureSmartUI();renderSmart();ensureExchange();addExchangeEntrypoints();setTimeout(enhanceReport,80);let moTimer=0;const mo=new MutationObserver(()=>{clearTimeout(moTimer);moTimer=setTimeout(()=>{if(document.querySelector('#v151-player-report .v151-report')&&!document.querySelector('#v152-player-advanced'))enhanceReport();addExchangeEntrypoints();if(!document.getElementById('v152-smart-strip')){ensureSmartUI();renderSmart()}},180)});mo.observe(document.body,{childList:true,subtree:true});window.VC_V152={version:'15.2.6',smart:{get mode(){return smartMode},setMode:window.v152SetSmartMode,render:renderSmart},reports:{enhance:enhanceReport,print:printAdvanced},exchange:{open:window.v152OpenExchange,export:window.v152Export},diagnostics:()=>({version:'15.2.6',smartMode,smartVisible:!!$('v152-smart-strip'),exchangeReady:!!$('v152-exchange-modal'),reportEnhanced:!!$('v152-player-advanced')})};try{if(window.MatchState){window.MatchState.version='15.2.4';window.MatchState.schema='vc.match-state/15.2.5'}}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
