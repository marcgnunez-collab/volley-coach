
(()=>{
'use strict';
const VERSION='15.5.0', $=id=>document.getElementById(id), B=()=>window.VC_SCOUT_VIDEO_BRIDGE||null;
const arr=x=>Array.isArray(x)?x:[];
const pct=(w,n)=>n?`${Math.round(100*w/n)}%`:'—';
const number=x=>Number.isFinite(Number(x))?Number(x):0;
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lastSelector='',lastSignature='',lastTeam='',viewReady=false;
function analyse(m){
  const sets=arr(m?.sets),cur=sets.find(s=>number(s.number)===number(m?.currentSet))||sets.at(-1)||null;
  const all=sets.flatMap(s=>arr(s?.rallies).filter(r=>r?.winner==='ours'||r?.winner==='opponent').map(r=>({...r,__set:number(s.number)})));
  const current=arr(cur?.rallies).filter(r=>r?.winner==='ours'||r?.winner==='opponent');
  const side=all.filter(r=>r.servingBefore==='opponent'),breaks=all.filter(r=>r.servingBefore==='ours');
  const soWins=side.filter(r=>r.winner==='ours').length,bpWins=breaks.filter(r=>r.winner==='ours').length;
  const rot=Number(m?.rotationNo)||1;
  const rotations=Array.from({length:6},(_,i)=>{const r=i+1,rallies=side.filter(x=>number(x.rotationBefore)===r);return {rotation:r,total:rallies.length,wins:rallies.filter(x=>x.winner==='ours').length}});
  const own=current.filter(r=>r.winner==='ours').length,opp=current.length-own;
  const recent=current.slice(-5),recentWon=recent.filter(r=>r.winner==='ours').length;
  let losses=0;for(let i=current.length-1;i>=0&&current[i]?.winner==='opponent';i--)losses++;
  const alerts=[];
  if(losses>=3)alerts.push({level:'danger',title:`${losses} puntos consecutivos del rival`,detail:'Revisar la secuencia de recepción y la rotación antes de decidir un ajuste.'});
  const rotation=rotations.find(x=>x.rotation===rot);
  if(rotation&&rotation.total>=5&&rotation.wins/rotation.total<.45)alerts.push({level:'warning',title:`K1 bajo en R${rot}: ${pct(rotation.wins,rotation.total)}`,detail:`${rotation.wins} de ${rotation.total} side-outs ganados en esta rotación. Conviene contrastar con el vídeo.`});
  const rec=all.flatMap(r=>arr(r.actions)).filter(a=>a?.team==='ours'&&a?.skill==='R').slice(-12);
  const bad=rec.filter(a=>['-','/','='].includes(a.evaluation)).length;
  if(rec.length>=6&&bad/rec.length>=.5)alerts.push({level:'warning',title:'Recepción negativa en las últimas acciones',detail:`${bad} de ${rec.length} recepciones evaluadas como negativas, muy negativas o error.`});
  if(cur&&Math.max(number(cur.scoreUs),number(cur.scoreOpponent))>=20&&Math.abs(number(cur.scoreUs)-number(cur.scoreOpponent))<=2&&m?.status!=='finished')alerts.push({level:'info',title:'Final de set igualado',detail:`Marcador ${number(cur.scoreUs)}–${number(cur.scoreOpponent)}: comprobar saque, orden de rotación y próximos enfrentamientos.`});
  return {cur,all,current,side,breaks,soWins,bpWins,rot,rotations,rotation,recent,recentWon,losses,alerts,own,opp,sets};
}
function selected(){const all=arr(B()?.getMatches?.()).filter(x=>x&&x.id),wanted=String($('vc155-match')?.value||'');return all.find(x=>String(x.id)===wanted)||B()?.getActive?.()||all.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]||null}
function chooseMatches(force=false){
  const select=$('vc155-match');if(!select)return;
  const all=arr(B()?.getMatches?.()).filter(m=>m&&m.id).slice().sort((a,b)=>String(b.updatedAt||b.date||'').localeCompare(String(a.updatedAt||a.date||'')));
  const key=all.map(m=>[m.id,m.updatedAt?.slice(0,10),m.opponent,m.status].join(':')).join('|');
  if(!force&&key===lastSelector)return;
  const old=select.value,active=String(B()?.getActiveId?.()||''),want=old&&all.some(m=>String(m.id)===old)?old:(active&&all.some(m=>String(m.id)===active)?active:String(all[0]?.id||''));
  select.replaceChildren();
  if(!all.length){const opt=document.createElement('option');opt.textContent='Sin partidos';opt.value='';select.appendChild(opt)}
  all.forEach(m=>{const option=document.createElement('option');option.value=String(m.id);option.textContent=`${m.date||''} · ${m.opponent||'Rival'} · ${m.status==='finished'?'Finalizado':'En curso'}`;select.appendChild(option)});
  select.value=want;lastSelector=key;
}
function set(id,value){const el=$(id);if(el)el.textContent=String(value??'')}
function connection(){
  const el=$('vc155-connection');if(!el)return;
  let state='';try{state=String(window.VC_DEVICE_SYNC?.diagnostics?.()?.realtimeState||'')}catch(_){}
  const online=typeof navigator.onLine==='boolean'?navigator.onLine:true;
  el.classList.toggle('connected',online&&state==='SUBSCRIBED');el.classList.toggle('offline',!online);
  el.textContent=!online?'Sin conexión · datos locales':state==='SUBSCRIBED'?'Realtime conectado · lectura':'Datos disponibles · nube sin confirmar';
}
function render(force=false){
  const root=$('vc155-bench');if(!root||(!root.classList.contains('active')&&!force))return;
  chooseMatches(force);connection();
  const m=selected();$('vc155-no-match').hidden=!!m;$('vc155-main').hidden=!m;if(!m)return;
  const team=String(B()?.getTeamId?.()||'');
  const key=JSON.stringify([team,m.id,m.updatedAt,m.status,m.currentSet,m.rotationNo,m.servingTeam,arr(m.sets).map(s=>[s.number,s.scoreUs,s.scoreOpponent,s.finished,arr(s.rallies).length,arr(s.rallies).slice(-5).map(r=>[r.id,r.winner,r.editedAt,arr(r.actions).length])]),arr(m.liveRally?.actions).length]);
  if(!force&&key===lastSignature)return;lastSignature=key;lastTeam=team;
  const d=analyse(m),s=d.cur;
  set('vc155-us-name',B()?.teamName?.()||'Nuestro equipo');set('vc155-op-name',m.opponent||'Rival');
  set('vc155-us-score',s?.scoreUs??0);set('vc155-opp-score',s?.scoreOpponent??0);set('vc155-set',`SET ${s?.number||m.currentSet||1}${m.status==='finished'?' · FINALIZADO':''}`);
  const won=d.sets.filter(x=>x.finished&&x.winner==='ours').length,lost=d.sets.filter(x=>x.finished&&x.winner==='opponent').length;
  set('vc155-sets',`Sets ${won}–${lost}`);set('vc155-rotation',`Rotación R${d.rot}`);set('vc155-serve',m.servingTeam==='ours'?'Saque nuestro':'Saque rival');set('vc155-rallies',`${d.all.length} rallies cerrados`);
  set('vc155-so',pct(d.soWins,d.side.length));set('vc155-so-sub',`${d.soWins}/${d.side.length} · K1`);
  set('vc155-bp',pct(d.bpWins,d.breaks.length));set('vc155-bp-sub',`${d.bpWins}/${d.breaks.length} · K2`);
  set('vc155-rots',pct(d.rotation?.wins||0,d.rotation?.total||0));set('vc155-rots-sub',`R${d.rot} · ${d.rotation?.wins||0}/${d.rotation?.total||0} · ${d.rotation?.total<5?'muestra pequeña':'muestra observada'}`);
  set('vc155-recent',d.recent.length?`${d.recentWon}–${d.recent.length-d.recentWon}`:'—');set('vc155-recent-sub',`${d.recent.length} rallies · ganados–perdidos`);
  const alertBox=$('vc155-alerts');alertBox.replaceChildren();
  const alerts=d.alerts.length?d.alerts:[{level:'info',title:d.all.length<5?'Muestra insuficiente':'Sin alertas automáticas',detail:d.all.length<5?'Registra al menos cinco rallies cerrados para obtener una primera lectura fiable.':'No se han alcanzado los umbrales definidos para avisos tácticos.'}];
  alerts.forEach(a=>{const div=document.createElement('div');div.className='vc155-alert is-'+a.level;const b=document.createElement('b');b.textContent=a.title;const small=document.createElement('small');small.textContent=a.detail;div.append(b,small);alertBox.appendChild(div)});
  const rotations=$('vc155-rotation-list');rotations.replaceChildren();
  d.rotations.forEach(r=>{const div=document.createElement('div');div.className='vc155-rotation'+(r.rotation===d.rot?' current':'');const name=document.createElement('strong');name.textContent='R'+r.rotation;const bar=document.createElement('div');bar.className='vc155-track';const fill=document.createElement('i');fill.style.width=r.total?(r.wins/r.total*100)+'%':'0%';bar.appendChild(fill);const val=document.createElement('em');val.textContent=`${pct(r.wins,r.total)} · ${r.wins}/${r.total}${r.total>0&&r.total<5?' *':''}`;div.append(name,bar,val);rotations.appendChild(div)});
  const recent=$('vc155-recent-list');recent.replaceChildren();
  if(!d.current.length){const p=document.createElement('p');p.textContent='Todavía no hay rallies cerrados en este set.';recent.appendChild(p)}
  d.current.slice(-7).reverse().forEach(r=>{const div=document.createElement('div');div.className='vc155-rally'+(r.winner==='opponent'?' lost':'');const score=document.createElement('b');score.textContent=`${number(r.scoreAfter?.us)}–${number(r.scoreAfter?.opponent)}`;const detail=document.createElement('span');detail.textContent=`R${r.rotationBefore||'?'} · ${r.servingBefore==='ours'?'Saque nuestro':'Recepción nuestra'} · ${arr(r.actions).length} acciones`;const result=document.createElement('strong');result.textContent=r.winner==='ours'?'GANADO':'PERDIDO';div.append(score,detail,result);recent.appendChild(div)});
}
function go(destination){window.v11Navigate?.(destination)}
function followMatch(destination){const m=selected();go(destination);if(!m)return;
 if(destination==='analysis'){setTimeout(()=>{const sel=$('scout-analysis-match');if(sel){sel.value=String(m.id);try{window.scoutRenderAnalysis?.()}catch(_){}}},90)}
 if(destination==='video'){setTimeout(()=>{const sel=$('v780-match');if(sel){sel.value=String(m.id);try{window.v780MatchChanged?.()}catch(_){}}},120)}
}
function copyLink(){let u;try{u=new URL(location.href);u.searchParams.set('banquillo','1');u.searchParams.set('modo','consulta');u.hash='';}catch(_){return}
  const text=u.toString();const b=$('vc155-copy-link');if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>{b.textContent='Enlace copiado';setTimeout(()=>{if(b)b.textContent='Copiar enlace de consulta'},1600)},()=>window.prompt('Copia este enlace:',text))}else window.prompt('Copia este enlace:',text)
}
function cleanStrayText(){
  /* Earlier monolithic releases have escaped newline-only text nodes after sections. */
  [...document.body.childNodes].forEach(n=>{if(n.nodeType===3&&/^(?:\s|\\n)+$/.test(n.textContent||''))n.remove()});
}
function init(){if(viewReady)return;viewReady=true;cleanStrayText();
  $('vc155-match')?.addEventListener('change',()=>{lastSignature='';render(true)});
  const role=$('vc155-role');if(role){try{role.value=localStorage.getItem('vc155_bench_role')||'coach'}catch(_){role.value='coach'}$('vc155-bench').dataset.vc155Role=role.value;role.addEventListener('change',()=>{const value=['coach','assistant','analyst'].includes(role.value)?role.value:'coach';$('vc155-bench').dataset.vc155Role=value;try{localStorage.setItem('vc155_bench_role',value)}catch(_){}})}
  [['vc155-copy-link',copyLink],['vc155-to-match',()=>go('match')],['vc155-go-analysis',()=>followMatch('analysis')],['vc155-go-season',()=>go('season')],['vc155-go-video',()=>followMatch('video')],['vc155-go-scouter',()=>go('scouting')]].forEach(([id,fn])=>$(id)?.addEventListener('click',fn));
  const nav=window.v11Navigate;
  if(typeof nav==='function'&&!nav.__vc155){const wrapped=function(target){if(target!=='bench')return nav.apply(this,arguments);try{window.openWorkspace?.('scouting')}catch(_){}
      window.showView?.('vc155-bench',null);document.querySelectorAll('[data-v11-nav]').forEach(b=>b.classList.toggle('active',b.dataset.v11Nav==='bench'));
      set('v11-breadcrumb','SCOUTING / BANQUILLO');set('v11-page-title','Banquillo Pro');try{window.v11ToggleSidebar?.(false)}catch(_){}
      lastSignature='';render(true);return true};wrapped.__vc155=true;window.v11Navigate=wrapped}
  window.addEventListener('focus',()=>render(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden)render(true)});
  setInterval(()=>{if($('vc155-bench')?.classList.contains('active'))render()},1300);
  try{const params=new URL(location.href).searchParams;if(params.get('banquillo')==='1')setTimeout(()=>window.v11Navigate?.('bench'),900)}catch(_){}
}
window.VC_V155_BENCH={version:VERSION,analyse,render,diagnostics:()=>({version:VERSION,viewActive:!!$('vc155-bench')?.classList.contains('active'),hasBridge:!!B(),selectedMatchId:selected()?.id||null})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
