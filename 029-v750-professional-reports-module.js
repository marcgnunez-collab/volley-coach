
(()=>{
'use strict';
const V750_VERSION='7.5.2';
const V750_DOT='·';
const v750Arr=v=>Array.isArray(v)?v:[];
const v750Pct=(n,d)=>d?Math.round((Number(n)||0)*100/(Number(d)||0)):null;
const v750Esc=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v750Gp=n=>{n=Number(n)||0;return n>0?`+${n}`:`${n}`};
const v750Num=v=>Number.isFinite(Number(v))?Number(v):0;
const v750TeamName=team=>team==='ours'?(EQUIPOS?.[equipoActivo]?.nombre||'Nuestro equipo'):'Rival';

function v750SelectedMatch(id){
  return scoutExportMatch?.(id)||scoutMatchForAnalysis?.()||null;
}
function v750Rallies(m,team){
  return typeof scoutV61010Rallies==='function'?scoutV61010Rallies(m,team,false):[];
}
function v750Stats(m,team){
  return typeof scoutV61010FullStats==='function'?scoutV61010FullStats(m,team,false):scoutV630Stats(m,team);
}
function v750Perf(m,team){
  return scoutV61010Performance(m,team,false);
}
function v750SetDurSeconds(s){
  const a=Date.parse(s?.startedAt||''),b=Date.parse(s?.endedAt||'');
  return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?(b-a)/1000:null;
}
function v750DurationClock(sec){
  if(sec==null||!Number.isFinite(sec))return V750_DOT;
  const m=Math.floor(sec/60),s=Math.round(sec-m*60);
  return `${m}.${String(s).padStart(2,'0')}`;
}
/* V12.5 removed unreachable function: v750DurationLong */
function v750Checkpoints(set){
  const thresholds=Number(set?.number)===5?[5,10,12]:[8,16,21];
  const rallies=v750Arr(set?.rallies);
  return thresholds.map(t=>{
    const r=rallies.find(x=>Math.max(v750Num(x?.scoreAfter?.us),v750Num(x?.scoreAfter?.opponent))>=t);
    return r?`${v750Num(r.scoreAfter.us)}-${v750Num(r.scoreAfter.opponent)}`:V750_DOT;
  });
}
function v750Linked(m){
  return typeof scoutV61010LinkedMatch==='function'?scoutV61010LinkedMatch(m):null;
}
function v750Meta(m){
  const linked=v750Linked(m);
  return {
    competition:linked?.competition||m?.competition||'Partido',
    round:linked?.round||linked?.jornada||'',
    matchCode:linked?.code||linked?.matchCode||m?.matchCode||`VC-${m?.id||''}`,
    date:m?.date||linked?.date||'',
    time:linked?.time||m?.time||'',
    pavilion:linked?.pavilion||linked?.venueName||m?.pavilion||'',
    city:linked?.city||m?.city||'',
    venue:linked?.venue||m?.venue||'',
    referees:linked?.referees||m?.referees||''
  };
}
function v750TerminalBreakdown(m,team){
  const rr=v750Rallies(m,team),bd=scoutV61010Breakdown(rr,team);
  return {...bd,rallies:rr.length,won:rr.filter(x=>x.win).length,lost:rr.filter(x=>!x.win).length};
}
function v750RotationStats(m,team){
  const rr=v750Rallies(m,team);
  return Array.from({length:6},(_,i)=>{
    const no=i+1,rows=rr.filter(x=>Number(x.rotation)===no),
      k1=rows.filter(x=>x.phase==='K1'),k2=rows.filter(x=>x.phase==='K2'),
      k1w=k1.filter(x=>x.win).length,k2w=k2.filter(x=>x.win).length,won=rows.filter(x=>x.win).length;
    return {no,total:rows.length,won,lost:rows.length-won,gp:won-(rows.length-won),
      k1Total:k1.length,k1Won:k1w,k1Pct:v750Pct(k1w,k1.length),
      k2Total:k2.length,k2Won:k2w,k2Pct:v750Pct(k2w,k2.length)};
  });
}
function v750SetTrend(m,team){
  const sets=v750Arr(m?.sets);
  return sets.map(s=>{
    const x=scoutV61010SetStat(m,team,s.number),rr=v750Rallies(m,team).filter(r=>Number(r.set)===Number(s.number)),
      k1=rr.filter(r=>r.phase==='K1'),k2=rr.filter(r=>r.phase==='K2'),
      k1w=k1.filter(r=>r.win).length,k2w=k2.filter(r=>r.win).length;
    return {set:s.number,score:`${v750Num(s.scoreUs)}-${v750Num(s.scoreOpponent)}`,
      k1:v750Pct(k1w,k1.length),k1n:k1.length,k2:v750Pct(k2w,k2.length),k2n:k2.length,
      recPos:x.r.posPct,recExc:x.r.excPct,recN:x.r.total,att:x.a.ptsPct,attN:x.a.total,
      ace:x.s.perfect,serveErr:x.s.error,block:x.b.perfect};
  });
}
function v750ContactZone(a){return String(a?.contactZone||a?.endZone||a?.startZone||'').replace(/^Z/i,'')}
function v750ReceptionZones(m,team){
  const rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='R'&&v750ContactZone(a));
  return [...new Set(rows.map(v750ContactZone))].map(zone=>{
    const a=rows.filter(x=>v750ContactZone(x)===zone),pos=a.filter(x=>['#','+'].includes(x.evaluation)).length,exc=a.filter(x=>x.evaluation==='#').length,err=a.filter(x=>x.evaluation==='=').length;
    return {zone,total:a.length,pos,exc,err,posPct:v750Pct(pos,a.length),excPct:v750Pct(exc,a.length),errPct:v750Pct(err,a.length)}
  }).sort((a,b)=>b.total-a.total);
}
function v750ServeZones(m,team){
  const rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='S'&&String(a.endZone||''));
  return [...new Set(rows.map(a=>String(a.endZone)))].map(zone=>{
    const a=rows.filter(x=>String(x.endZone)===zone),ace=a.filter(x=>x.evaluation==='#').length,err=a.filter(x=>x.evaluation==='=').length,pressure=a.filter(x=>['#','+'].includes(x.evaluation)).length;
    return {zone,total:a.length,ace,err,pressure,acePct:v750Pct(ace,a.length),pressurePct:v750Pct(pressure,a.length)}
  }).sort((a,b)=>b.total-a.total);
}
function v750AttackDirections(m,team){
  const rows=scoutActionRows(m,false).filter(a=>a.team===team&&a.skill==='A'&&(a.endZone||a.startZone));
  const key=a=>a.startZone&&a.endZone?`Z${a.startZone} > Z${a.endZone}`:(a.endZone?`> Z${a.endZone}`:`Z${a.startZone}`);
  const keys=[...new Set(rows.map(key))];
  return keys.map(k=>{
    const a=rows.filter(x=>key(x)===k),pts=a.filter(x=>x.evaluation==='#').length,err=a.filter(x=>x.evaluation==='=').length,blq=a.filter(x=>x.evaluation==='/').length;
    return {direction:k,total:a.length,pts,err,blq,ptsPct:v750Pct(pts,a.length),effPct:a.length?Math.round((pts-err-blq)*100/a.length):null}
  }).sort((a,b)=>b.total-a.total);
}
function v750Distribution(m,team){
  const rows=scoutDistributionRows(m,team,'');
  const map=new Map();
  rows.forEach(x=>{const k=String(x.target||'Sin destino');if(!map.has(k))map.set(k,[]);map.get(k).push(x)});
  return [...map.entries()].map(([key,a])=>({key,label:window.VC_SCOUT_REPORT_BRIDGE?.comboLabel?.(key)||key,total:a.length,pct:v750Pct(a.length,rows.length)})).sort((a,b)=>b.total-a.total);
}
function v750PlayerRows(m,team){
  const data=v750Stats(m,team);
  return data.players.map(st=>{
    const s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st,'A'),b=scoutV61010Skill(st,'B'),p=scoutV61010PointMetrics(m,team,st.key,data.rows);
    return {label:st.label,total:st.total,pts:p.won,fp:p.fp,gp:p.gp,serveTotal:s.total,ace:s.perfect,serveErr:s.error,
      recTotal:r.total,recErr:r.error,recPos:r.posPct,recExc:r.excPct,
      attTotal:a.total,kill:a.perfect,attErr:a.error,blocked:a.blocked,attPct:a.ptsPct,attGp:a.gp,block:b.perfect};
  });
}
function v750DataQuality(m){
  const rallies=v750Arr(m?.sets).flatMap(s=>v750Arr(s.rallies)),actions=rallies.flatMap(r=>v750Arr(r.actions)),coded=rallies.filter(r=>v750Arr(r.actions).length).length;
  const teams=['ours','opponent'];
  const issues=[];
  if(rallies.length&&coded/rallies.length<.7)issues.push(`Solo ${v750Pct(coded,rallies.length)}% de los rallies tienen acciones codificadas.`);
  teams.forEach(team=>{
    const k1=v750Rallies(m,team).filter(x=>x.phase==='K1'),withRec=k1.filter(x=>v750Arr(x.r.actions).some(a=>a.team===team&&a.skill==='R')).length;
    if(k1.length&&withRec/k1.length<.65)issues.push(`${v750TeamName(team)}: recepción registrada en ${v750Pct(withRec,k1.length)}% de los rallies K1.`);
  });
  return {rallies:rallies.length,actions:actions.length,codedRallies:coded,codedPct:v750Pct(coded,rallies.length)||0,issues};
}
function v750BestRotation(rot,key,min=3,dir='max'){
  const rows=rot.filter(x=>Number(x[key+'Total'])>=min&&x[key+'Pct']!=null);
  if(!rows.length)return null;
  return rows.slice().sort((a,b)=>dir==='max'?b[key+'Pct']-a[key+'Pct']:a[key+'Pct']-b[key+'Pct'])[0];
}
function v750Insights(m){
  const ours=v750Perf(m,'ours'),opp=v750Perf(m,'opponent'),
    ok1=ours.rallies.filter(x=>x.phase==='K1'),ok2=ours.rallies.filter(x=>x.phase==='K2'),
    rk1=opp.rallies.filter(x=>x.phase==='K1'),rk2=opp.rallies.filter(x=>x.phase==='K2'),
    so=v750Pct(ours.sideOut,ok1.length),bp=v750Pct(ours.breakPoint,ok2.length),
    rso=v750Pct(opp.sideOut,rk1.length),rbp=v750Pct(opp.breakPoint,rk2.length),
    oursStats=v750Stats(m,'ours'),oppStats=v750Stats(m,'opponent'),
    or=scoutV61010Reception(oursStats.teamStat),rr=scoutV61010Reception(oppStats.teamStat),
    oa=scoutV61010Attack(oursStats.teamStat),ra=scoutV61010Attack(oppStats.teamStat),
    rot=v750RotationStats(m,'ours'),bestK1=v750BestRotation(rot,'k1',3,'max'),worstK1=v750BestRotation(rot,'k1',3,'min'),
    bestK2=v750BestRotation(rot,'k2',3,'max'),players=v750PlayerRows(m,'ours'),
    gpLeader=players.filter(x=>x.total>=3).sort((a,b)=>b.gp-a.gp)[0],
    killLeader=players.filter(x=>x.attTotal>=3).sort((a,b)=>b.kill-a.kill)[0],
    recLeader=players.filter(x=>x.recTotal>=5).sort((a,b)=>b.recPos-a.recPos)[0],
    q=v750DataQuality(m),out=[];
  if(so!=null&&rso!=null)out.push({kind:so>=rso?'good':'warn',tag:'K1',text:`Side-out: ${so}% (${ours.sideOut}/${ok1.length}) frente a ${rso}% del rival (${opp.sideOut}/${rk1.length}). Diferencia ${so-rso>0?'+':''}${so-rso} pp.`});
  if(bp!=null&&rbp!=null)out.push({kind:bp>=rbp?'good':'warn',tag:'K2',text:`Break point: ${bp}% (${ours.breakPoint}/${ok2.length}) frente a ${rbp}% del rival (${opp.breakPoint}/${rk2.length}). Diferencia ${bp-rbp>0?'+':''}${bp-rbp} pp.`});
  if(or.total||rr.total)out.push({kind:or.posPct>=rr.posPct?'good':'info',tag:'Recepción',text:`Recepción positiva ${or.total?or.posPct+'% ('+or.positive+'/'+or.total+')':'—'}; excelente ${or.total?or.excPct+'%':'—'}. Rival: ${rr.total?rr.posPct+'% positiva y '+rr.excPct+'% excelente':'sin muestra suficiente'}.`});
  if(oa.total||ra.total)out.push({kind:oa.ptsPct>=ra.ptsPct?'good':'warn',tag:'Ataque',text:`Ataque: ${oa.total?oa.ptsPct+'% de punto ('+oa.perfect+'/'+oa.total+')':'—'}, G-P ${oa.total?v750Gp(oa.gp):'—'}. Rival: ${ra.total?ra.ptsPct+'%, G-P '+v750Gp(ra.gp):'—'}.`});
  if(bestK1)out.push({kind:'good',tag:'Rotación',text:`Mejor K1 con muestra >=3: R${bestK1.no}, ${bestK1.k1Pct}% (${bestK1.k1Won}/${bestK1.k1Total}).${worstK1&&worstK1.no!==bestK1.no?` La más exigida fue R${worstK1.no}: ${worstK1.k1Pct}% (${worstK1.k1Won}/${worstK1.k1Total}).`:''}`});
  if(bestK2)out.push({kind:'info',tag:'Break',text:`Rotación con mayor conversión K2 (muestra >=3): R${bestK2.no}, ${bestK2.k2Pct}% de break (${bestK2.k2Won}/${bestK2.k2Total}).`});
  if(gpLeader)out.push({kind:'info',tag:'Impacto',text:`Mayor G-P individual: ${gpLeader.label}, ${v750Gp(gpLeader.gp)} (${gpLeader.pts} puntos directos).${killLeader?` Liderazgo de ataque: ${killLeader.label}, ${killLeader.kill}/${killLeader.attTotal} puntos (${killLeader.attPct}%).`:''}`});
  if(recLeader)out.push({kind:'info',tag:'Recepción',text:`Mejor recepción positiva con al menos 5 intentos: ${recLeader.label}, ${recLeader.recPos}% (${recLeader.recTotal} recepciones).`});
  if(ours.positive.total||ours.negative.total||ours.counter.total)out.push({kind:'info',tag:'Fases',text:`Ataque: tras recepción +/# ${ours.positive.total?ours.positive.pct+'% ('+ours.positive.pts+'/'+ours.positive.total+')':'—'}; tras recepción !/-/ ${ours.negative.total?ours.negative.pct+'% ('+ours.negative.pts+'/'+ours.negative.total+')':'—'}; contraataque ${ours.counter.total?ours.counter.pct+'% ('+ours.counter.pts+'/'+ours.counter.total+')':'—'}.`});
  if(q.issues.length)out.push({kind:'warn',tag:'Muestra',text:q.issues.join(' ')});
  else out.push({kind:'good',tag:'Muestra',text:`Cobertura de codificación: ${q.codedPct}% de los ${q.rallies} rallies tienen al menos una acción registrada (${q.actions} acciones totales).`});
  return out;
}
function v750SetTableHTML(m,team){
  const rows=v750SetTrend(m,team);
  return `<table class="scout-v750-mini-table"><thead><tr><th>Set</th><th>Marc.</th><th>K1</th><th>K2</th><th>REC Pos</th><th>REC Exc</th><th>ATQ Pts</th><th>Ace/Err</th><th>BLQ</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>S${x.set}</b></td><td>${x.score}</td><td>${x.k1==null?'—':x.k1+'%'} <small>(${x.k1n})</small></td><td>${x.k2==null?'—':x.k2+'%'} <small>(${x.k2n})</small></td><td>${x.recN?x.recPos+'%':'—'}</td><td>${x.recN?x.recExc+'%':'—'}</td><td>${x.attN?x.att+'%':'—'}</td><td>${x.ace}/${x.serveErr}</td><td>${x.block}</td></tr>`).join('')}</tbody></table>`;
}
function v750RotationTableHTML(m,team){
  const rows=v750RotationStats(m,team);
  return `<table class="scout-v750-mini-table"><thead><tr><th>Rot.</th><th>K1 G/T</th><th>K1%</th><th>K2 G/T</th><th>K2%</th><th>Global G-P</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.k1Won}/${r.k1Total}</td><td>${r.k1Pct==null?'—':r.k1Pct+'%'}</td><td>${r.k2Won}/${r.k2Total}</td><td>${r.k2Pct==null?'—':r.k2Pct+'%'}</td><td>${r.total?v750Gp(r.gp):'—'}</td></tr>`).join('')}</tbody></table>`;
}
window.scoutV750RenderProfessionalAnalysis=function(){
  const box=document.getElementById('scout-v750-pro-analysis');if(!box)return;
  const m=scoutMatchForAnalysis?.();if(!m){box.innerHTML='<div class="match-empty">Selecciona un scouting para generar la lectura profesional.</div>';return}
  const po=v750Perf(m,'ours'),pr=v750Perf(m,'opponent'),
    ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),
    rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2'),
    o=v750Stats(m,'ours'),r=v750Stats(m,'opponent'),orec=scoutV61010Reception(o.teamStat),rrec=scoutV61010Reception(r.teamStat),
    oatt=scoutV61010Attack(o.teamStat),ratt=scoutV61010Attack(r.teamStat),q=v750DataQuality(m),ins=v750Insights(m);
  box.innerHTML=`<div class="scout-v750-summary-grid">
    <div class="scout-v750-summary-card"><span>K1 Side-out</span><b>${ok1.length?v750Pct(po.sideOut,ok1.length)+'%':'—'}</b><small>${po.sideOut}/${ok1.length} · rival ${rk1.length?v750Pct(pr.sideOut,rk1.length)+'%':'—'}</small></div>
    <div class="scout-v750-summary-card"><span>K2 Break</span><b>${ok2.length?v750Pct(po.breakPoint,ok2.length)+'%':'—'}</b><small>${po.breakPoint}/${ok2.length} · rival ${rk2.length?v750Pct(pr.breakPoint,rk2.length)+'%':'—'}</small></div>
    <div class="scout-v750-summary-card"><span>Recepción +/#</span><b>${orec.total?orec.posPct+'%':'—'}</b><small>${orec.positive}/${orec.total} · Exc ${orec.total?orec.excPct+'%':'—'}</small></div>
    <div class="scout-v750-summary-card"><span>Ataque punto</span><b>${oatt.total?oatt.ptsPct+'%':'—'}</b><small>${oatt.perfect}/${oatt.total} · G-P ${oatt.total?v750Gp(oatt.gp):'—'}</small></div>
    <div class="scout-v750-summary-card"><span>Rival REC +/#</span><b>${rrec.total?rrec.posPct+'%':'—'}</b><small>${rrec.positive}/${rrec.total} · Exc ${rrec.total?rrec.excPct+'%':'—'}</small></div>
    <div class="scout-v750-summary-card"><span>Rival ATQ</span><b>${ratt.total?ratt.ptsPct+'%':'—'}</b><small>${ratt.perfect}/${ratt.total} · G-P ${ratt.total?v750Gp(ratt.gp):'—'}</small></div>
  </div>
  <div class="scout-v750-columns">
    <div class="scout-v750-box"><h4>Lecturas automáticas</h4><div class="scout-v750-box-sub">Descriptivas: cada frase incluye su muestra; no sustituye la lectura del staff.</div><div class="scout-v750-insights">${ins.map(x=>`<div class="scout-v750-insight ${x.kind}"><strong>${v750Esc(x.tag)}</strong><span>${v750Esc(x.text)}</span></div>`).join('')}</div></div>
    <div class="scout-v750-box"><h4>Rotaciones R1-R6</h4>${v750RotationTableHTML(m,'ours')}</div>
  </div>
  <div class="scout-v750-box" style="margin-top:10px"><h4>Evolución por set</h4>${v750SetTableHTML(m,'ours')}</div>
  <div class="scout-v750-quality"><span class="${q.codedPct>=80?'good':'warn'}">Rallies codificados ${q.codedPct}%</span><span>${q.rallies} rallies</span><span>${q.actions} acciones</span><span>${o.players.length} jugadores propios con registro</span><span>${r.players.length} jugadores rivales con registro</span></div>`;
};

/* ----------------- HTML REPORT HELPERS ----------------- */
function v750PdfTableTeam(m,team,data){
  const name=team==='ours'?(EQUIPOS?.[equipoActivo]?.nombre||'Equipo'):(m.opponent||'Rival');
  const playerRows=data.players.map(st=>{
    const s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),
      p=scoutV61010PointMetrics(m,team,st.key,data.rows),form=[1,2,3,4,5].map(n=>scoutV6109InitialPos(m,team,st,n));
    return `<tr><td class="nm">${scoutV61010OfficialName(st,false)}</td>${form.map(x=>`<td>${v750Esc(x||'')}</td>`).join('')}<td>${p.won||V750_DOT}</td><td>${p.fp||V750_DOT}</td><td class="gp">${v750Gp(p.gp)}</td><td>${s.total||V750_DOT}</td><td>${s.total?(s.error||V750_DOT):V750_DOT}</td><td>${s.total?(s.perfect||V750_DOT):V750_DOT}</td><td>${r.total||V750_DOT}</td><td>${r.total?(r.error||V750_DOT):V750_DOT}</td><td>${r.total?r.posPct+'%':V750_DOT}</td><td>${r.total?'('+r.excPct+'%)':V750_DOT}</td><td>${a.total||V750_DOT}</td><td>${a.total?(a.error||V750_DOT):V750_DOT}</td><td>${a.total?(a.blocked||V750_DOT):V750_DOT}</td><td>${a.total?(a.perfect||V750_DOT):V750_DOT}</td><td>${a.total?a.ptsPct+'%':V750_DOT}</td><td>${b.total?(b.perfect||V750_DOT):V750_DOT}</td></tr>`;
  }).join('');
  const st=data.teamStat,s=scoutV61010Skill(st,'S'),r=scoutV61010Reception(st),a=scoutV61010Attack(st),b=scoutV61010Skill(st,'B'),p=scoutV61010PointMetrics(m,team,'team',data.rows);
  const total=`<tr class="total"><td class="nm"><b>Totales jugadores</b></td><td colspan="5"></td><td>${p.won}</td><td>${p.fp}</td><td class="gp">${v750Gp(p.gp)}</td><td>${s.total}</td><td>${s.error}</td><td>${s.perfect}</td><td>${r.total}</td><td>${r.error}</td><td>${r.total?r.posPct+'%':V750_DOT}</td><td>${r.total?'('+r.excPct+'%)':V750_DOT}</td><td>${a.total}</td><td>${a.error}</td><td>${a.blocked}</td><td>${a.perfect}</td><td>${a.total?a.ptsPct+'%':V750_DOT}</td><td>${b.perfect}</td></tr>`;
  const sets=v750Arr(m.sets).map(set=>{
    const x=scoutV61010SetStat(m,team,set.number);
    return `<tr><td><b>Set ${set.number}</b></td><td>${x.bd.serve||V750_DOT}</td><td>${x.bd.attack||V750_DOT}</td><td>${x.bd.block||V750_DOT}</td><td>${x.bd.oppErr||V750_DOT}</td><td>${x.s.total||V750_DOT}</td><td>${x.s.total?(x.s.error||V750_DOT):V750_DOT}</td><td>${x.s.total?(x.s.perfect||V750_DOT):V750_DOT}</td><td>${x.r.total||V750_DOT}</td><td>${x.r.total?(x.r.error||V750_DOT):V750_DOT}</td><td>${x.r.total?x.r.posPct+'%':V750_DOT}</td><td>${x.r.total?'('+x.r.excPct+'%)':V750_DOT}</td><td>${x.a.total||V750_DOT}</td><td>${x.a.total?(x.a.error||V750_DOT):V750_DOT}</td><td>${x.a.total?(x.a.blocked||V750_DOT):V750_DOT}</td><td>${x.a.total?(x.a.perfect||V750_DOT):V750_DOT}</td><td>${x.a.total?x.a.ptsPct+'%':V750_DOT}</td><td>${x.b.total?(x.b.perfect||V750_DOT):V750_DOT}</td></tr>`;
  }).join('');
  return `<section class="dv-team"><h2>${v750Esc(name)}</h2>
    <table class="dv-main"><thead><tr class="groups"><th rowspan="2" class="nm">Jugador</th><th colspan="5">Set</th><th colspan="3">Puntos</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr>
    <tr><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>Tot</th><th>FP</th><th>G-P</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead><tbody>${playerRows}${total}</tbody></table>
    <div class="set-foot"><div class="staff"><b>Resumen por set</b><span>Pts ganados = Saq + Att + BLQ + Er.Ad.</span></div>
    <table class="dv-sets"><thead><tr><th></th><th colspan="4">Pts gan.</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr><tr><th></th><th>Saq</th><th>Att</th><th>BLQ</th><th>Er.Ad.</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>(Exc%)</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead><tbody>${sets}</tbody></table></div>
  </section>`;
}
function v750OfficialPerformance(m){
  const a=v750Perf(m,'ours'),b=v750Perf(m,'opponent'),nameA=EQUIPOS?.[equipoActivo]?.nombre||'Equipo',nameB=m.opponent||'Rival';
  const side=(p,name)=>`<div class="phase-side"><h3>${v750Esc(name)}</h3><div class="kv"><span>Recepción</span><b>${p.receptionTotal}</b><span>Puntos SO</span><b>${p.sideOut}</b><span>Cada</span><b>${p.recPerPoint?p.recPerPoint.toFixed(2):V750_DOT}</b><span>Saque</span><b>${p.serveTotal}</b><span>Puntos FP</span><b>${p.breakPoint}</b><span>Cada</span><b>${p.servePerPoint?p.servePerPoint.toFixed(2):V750_DOT}</b></div><div class="rd">${p.rot.map(r=>`<span><i>R${r.no}</i><b>${r.total?v750Gp(r.gp):V750_DOT}</b></span>`).join('')}</div></div>`;
  const row=(label,x,y)=>`<tr><td>${v750Esc(label)}</td><td>${x.err}</td><td>${x.blq}</td><td>${x.pct==null?V750_DOT:x.pct+'%'}</td><td>${x.total}</td><td>${y.total}</td><td>${y.pct==null?V750_DOT:y.pct+'%'}</td><td>${y.blq}</td><td>${y.err}</td></tr>`;
  return `<div class="phase-grid">${side(a,nameA)}<div class="phase-center"><h3>CAMBIO DE SAQUE</h3><table><thead><tr><th>Situación</th><th>Err</th><th>Blq</th><th>Pts%</th><th>Tot</th><th>Tot</th><th>Pts%</th><th>Blq</th><th>Err</th></tr></thead><tbody>${row('1er ataque tras recepción positiva (+/#)',a.positive,b.positive)}${row('1er ataque tras recepción negativa (!/-/)',a.negative,b.negative)}${row('Contraataque',a.counter,b.counter)}</tbody></table></div>${side(b,nameB)}</div>`;
}
function v750OfficialPage(m){
  const meta=v750Meta(m),ours=v750Stats(m,'ours'),opp=v750Stats(m,'opponent'),score=scoutSetsScore(m),sets=v750Arr(m.sets);
  const totalPoints=sets.reduce((o,s)=>({us:o.us+v750Num(s.scoreUs),op:o.op+v750Num(s.scoreOpponent)}),{us:0,op:0});
  const totalSec=sets.reduce((n,s)=>n+(v750SetDurSeconds(s)||0),0);
  return `<div class="v750-official"><style>
  .v750-official{width:1180px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.08;padding:22px 24px;box-sizing:border-box}
  .dv-head{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.brand{display:grid;grid-template-columns:150px 1fr;gap:12px}.ball{width:105px;height:105px;border:3px solid #777;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:900;color:#777;margin:auto}.brand h1{font-size:24px;margin:2px 0}.brand .round{font-size:17px}.brand .report{font-size:18px;font-weight:900;border-top:1px solid #555;padding-top:8px;margin-top:12px}.info{width:100%;border-collapse:collapse;margin-top:8px}.info td{border:1px solid #777;padding:4px 6px}.score-team{border:1px solid #555;display:flex;justify-content:space-between;gap:8px;padding:6px 9px;font-size:17px;font-weight:900}.set-score{width:100%;border-collapse:collapse;margin-top:3px}.set-score th,.set-score td{border:1px solid #777;padding:3px;text-align:center}.set-score th{background:#e4e5e6}.refs{border:1px solid #777;margin-top:6px;padding:5px 7px}.dv-team{border:1px solid #555;margin-top:7px}.dv-team h2{margin:0;padding:4px 7px;font-size:14px;background:#d7d9da}.dv-main,.dv-sets{width:100%;border-collapse:collapse;table-layout:fixed;font-size:7.4px}.dv-main th,.dv-main td,.dv-sets th,.dv-sets td{border-right:1px solid #bbb;border-bottom:1px solid #c7c7c7;padding:2.1px 2px;text-align:center;white-space:nowrap}.dv-main th,.dv-sets th{font-weight:900;background:#eceeef}.dv-main .nm{width:190px;text-align:left;overflow:hidden;text-overflow:ellipsis}.dv-main tr.total td{font-weight:900;background:#e4e6e7;border-top:2px solid #555}.dv-main .gp{font-weight:900}.set-foot{display:grid;grid-template-columns:205px 1fr}.staff{padding:7px;font-size:8px;display:flex;flex-direction:column;justify-content:flex-end}.staff span{margin-top:3px;color:#555}.dv-sets{font-size:7px}.phase-grid{display:grid;grid-template-columns:150px 1fr 150px;gap:5px;margin-top:8px}.phase-side,.phase-center{border:1px solid #555;padding:5px}.phase-side h3,.phase-center h3{margin:0 0 5px;text-align:center;font-size:10px}.kv{display:grid;grid-template-columns:1fr auto;gap:2px 5px;font-size:7.5px}.rd{display:grid;grid-template-columns:repeat(2,1fr);margin-top:5px}.rd span{border:1px solid #ccc;padding:2px;display:flex;justify-content:space-between}.rd i{font-style:normal}.phase-center table{width:100%;border-collapse:collapse;font-size:7.3px}.phase-center th,.phase-center td{border:1px solid #ccc;padding:3px;text-align:center}.phase-center td:first-child{text-align:left}.legend{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;border:1px solid #777;margin-top:6px;padding:5px;font-size:7px}.foot{display:flex;justify-content:space-between;margin-top:5px;font-size:6.7px;color:#555}
  </style>
  <div class="dv-head"><div>
    <div class="brand"><div class="ball">VOLLEY<br>COACH</div><div><h1>${v750Esc(meta.competition)}</h1><div class="round">${v750Esc(meta.round||'')}</div><div class="report">Informe</div></div></div>
    <table class="info"><tr><td><b>Partido</b></td><td>${v750Esc(meta.matchCode||'—')}</td><td><b>Fecha</b></td><td>${v750Esc(meta.date||'—')}</td></tr><tr><td><b>Hora</b></td><td>${v750Esc(meta.time||'—')}</td><td><b>Pabellón</b></td><td>${v750Esc(meta.pavilion||'—')}</td></tr><tr><td><b>Ciudad</b></td><td>${v750Esc(meta.city||'—')}</td><td><b>Condición</b></td><td>${v750Esc(meta.venue||'—')}</td></tr></table>
    <div class="refs"><b>Árbitros / observaciones oficiales</b> &nbsp; ${v750Esc(meta.referees||'—')}</div>
  </div><div>
    <div class="score-team"><span>${v750Esc(EQUIPOS?.[equipoActivo]?.nombre||'Equipo')}</span><b>${score.us}</b></div><div class="score-team"><span>${v750Esc(m.opponent||'Rival')}</span><b>${score.opponent}</b></div>
    <table class="set-score"><thead><tr><th>Set</th><th>Duración</th><th>Parcial 1</th><th>Parcial 2</th><th>Parcial 3</th><th>Resultado</th></tr></thead><tbody>${sets.map(s=>{const cp=v750Checkpoints(s);return `<tr><td>${s.number}</td><td>${v750DurationClock(v750SetDurSeconds(s))}</td><td>${cp[0]}</td><td>${cp[1]}</td><td>${cp[2]}</td><td><b>${v750Num(s.scoreUs)} - ${v750Num(s.scoreOpponent)}</b></td></tr>`}).join('')}<tr><td colspan="2"><b>${v750DurationClock(totalSec)}</b></td><td colspan="3"></td><td><b>${totalPoints.us} &nbsp; ${totalPoints.op}</b></td></tr></tbody></table>
  </div></div>
  ${v750PdfTableTeam(m,'ours',ours)}
  ${v750PdfTableTeam(m,'opponent',opp)}
  ${v750OfficialPerformance(m)}
  <div class="legend"><span><b>FP</b> Fase Punto</span><span><b>G-P</b> Ganados - Perdidos</span><span><b>Pos%</b> Recepción +/#</span><span><b>Exc%</b> Recepción #</span><span><b>Pts%</b> Ataques # / total</span><span><b>Blq</b> Ataque bloqueado</span><span><b>*</b> Participó sin titularidad inicial</span><span><b>K1</b> Side-out</span><span><b>K2</b> Break point</span><span><b>Er.Ad.</b> Error adversario</span></div>
  <div class="foot"><span>Volley Coach V7.5 · Hoja estadística basada en los códigos registrados.</span><span>Formato inspirado en la organización de una hoja Data Volley; no es un documento oficial de Data Project.</span></div>
  </div>`;
}
function v750AnalysisHeader(m,title,subtitle=''){
  const meta=v750Meta(m),score=scoutSetsScore(m);
  return `<div class="rp-head"><div><div class="kicker">VOLLEY COACH · PROFESSIONAL MATCH REPORT · V7.5</div><h1>${v750Esc(title)}</h1><p>${v750Esc(subtitle||`${EQUIPOS?.[equipoActivo]?.nombre||'Equipo'} vs ${m.opponent||'Rival'}`)}</p></div><div class="rp-score"><span>${v750Esc(meta.date||'')}</span><b>${score.us} - ${score.opponent}</b><small>${v750Esc(meta.competition||'')}</small></div></div>`;
}
function v750AnalysisBaseStyle(){
 return `<style>
 .rp{width:1120px;background:#fff;color:#17324d;font-family:Arial,Helvetica,sans-serif;padding:34px 38px;box-sizing:border-box;font-size:10px}.rp-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #102b43;padding-bottom:13px;margin-bottom:15px}.rp .kicker{font-size:8px;letter-spacing:.15em;font-weight:900;color:#728595}.rp h1{font-size:25px;margin:4px 0 2px;color:#102b43}.rp-head p{margin:0;color:#70808c}.rp-score{text-align:right}.rp-score span,.rp-score small{display:block;color:#788793;font-size:9px}.rp-score b{display:block;font-size:25px;color:#102b43;margin:2px 0}.rp h2{font-size:14px;border-bottom:2px solid #294d69;padding-bottom:5px;margin:14px 0 7px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.card{border:1px solid #dae2e7;padding:9px;background:#f9fbfc}.card span{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.07em;color:#738591;font-weight:900}.card b{display:block;font-size:18px;margin:3px 0;color:#102b43}.card small{font-size:7px;color:#7f8d97}.twocol{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tbl{width:100%;border-collapse:collapse;font-size:8px}.tbl th,.tbl td{padding:4px 4px;border-bottom:1px solid #e3e8eb;text-align:center}.tbl th{background:#edf2f5;font-size:7px;text-transform:uppercase}.tbl th:first-child,.tbl td:first-child{text-align:left}.tbl tr.total td{font-weight:900;background:#f1f4f6}.insights{display:grid;gap:6px}.insight{border:1px solid #dfe5e9;border-left:4px solid #597b95;padding:7px 8px;background:#fafbfc}.insight.good{border-left-color:#3f7c63}.insight.warn{border-left-color:#d28b2e}.insight b{display:block;font-size:7px;text-transform:uppercase;color:#667e90;margin-bottom:2px}.insight span{font-size:9px;line-height:1.35}.bars{display:grid;gap:5px}.bar{display:grid;grid-template-columns:115px 1fr 55px;gap:7px;align-items:center}.bar label{font-size:8px}.track{height:8px;background:#e8edf0;border-radius:999px;overflow:hidden}.track i{display:block;height:100%;background:#496d89;border-radius:999px}.bar strong{text-align:right;font-size:8px}.note{font-size:7.5px;color:#73818d;margin-top:6px}.quality{display:flex;gap:5px;flex-wrap:wrap}.quality span{border:1px solid #dfe5e9;background:#f7f9fa;padding:4px 6px;border-radius:999px;font-size:7px}.footer{margin-top:13px;border-top:1px solid #dfe5e9;padding-top:6px;font-size:7px;color:#788793;display:flex;justify-content:space-between}.compact{font-size:7.5px}.section-box{border:1px solid #dfe5e9;padding:8px}.rank{display:grid;grid-template-columns:28px 1fr repeat(4,65px);gap:5px;padding:5px;border-bottom:1px solid #e5e9ec;align-items:center}.rank.head{font-size:7px;text-transform:uppercase;background:#edf2f5;font-weight:900}.rank strong{font-size:8px}.rank span{text-align:center;font-size:8px}
 </style>`;
}
function v750PlayerAnalysisTable(m,team){
  const rows=v750PlayerRows(m,team);
  return `<table class="tbl"><thead><tr><th>Jugador</th><th>PTS</th><th>FP</th><th>G-P</th><th>SAQ A/E</th><th>REC T</th><th>POS%</th><th>EXC%</th><th>ATQ T</th><th>PTS</th><th>PTS%</th><th>ATQ G-P</th><th>BLQ</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v750Esc(x.label)}</b></td><td>${x.pts}</td><td>${x.fp}</td><td><b>${v750Gp(x.gp)}</b></td><td>${x.ace}/${x.serveErr}</td><td>${x.recTotal||V750_DOT}</td><td>${x.recTotal?x.recPos+'%':V750_DOT}</td><td>${x.recTotal?x.recExc+'%':V750_DOT}</td><td>${x.attTotal||V750_DOT}</td><td>${x.attTotal?x.kill:V750_DOT}</td><td>${x.attTotal?x.attPct+'%':V750_DOT}</td><td>${x.attTotal?v750Gp(x.attGp):V750_DOT}</td><td>${x.block||V750_DOT}</td></tr>`).join('')}</tbody></table>`;
}
function v750RotationAnalysisTable(m,team){
  return `<table class="tbl"><thead><tr><th>Rot.</th><th>Rallies</th><th>K1 G/T</th><th>K1%</th><th>K2 G/T</th><th>K2%</th><th>Global G-P</th></tr></thead><tbody>${v750RotationStats(m,team).map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.total}</td><td>${r.k1Won}/${r.k1Total}</td><td>${r.k1Pct==null?V750_DOT:r.k1Pct+'%'}</td><td>${r.k2Won}/${r.k2Total}</td><td>${r.k2Pct==null?V750_DOT:r.k2Pct+'%'}</td><td><b>${r.total?v750Gp(r.gp):V750_DOT}</b></td></tr>`).join('')}</tbody></table>`;
}
function v750Bars(rows,labelKey,valueKey,total){
  if(!rows.length)return '<div class="note">Sin datos suficientes.</div>';
  const max=Math.max(...rows.map(x=>v750Num(x[valueKey])),1);
  return `<div class="bars">${rows.slice(0,8).map(x=>`<div class="bar"><label>${v750Esc(x[labelKey])}</label><div class="track"><i style="width:${Math.max(2,v750Num(x[valueKey])*100/max)}%"></i></div><strong>${x[valueKey]}${total?` · ${v750Pct(x[valueKey],total)}%`:''}</strong></div>`).join('')}</div>`;
}
function v750AnalysisPages(m){
  const meta=v750Meta(m),score=scoutSetsScore(m),po=v750Perf(m,'ours'),pr=v750Perf(m,'opponent'),
    ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2'),
    ours=v750Stats(m,'ours'),opp=v750Stats(m,'opponent'),orec=scoutV61010Reception(ours.teamStat),rrec=scoutV61010Reception(opp.teamStat),
    oatt=scoutV61010Attack(ours.teamStat),ratt=scoutV61010Attack(opp.teamStat),ob=v750TerminalBreakdown(m,'ours'),rb=v750TerminalBreakdown(m,'opponent'),
    insights=v750Insights(m),q=v750DataQuality(m),sets=v750SetTrend(m,'ours');
  const p1=`<div class="rp">${v750AnalysisBaseStyle()}${v750AnalysisHeader(m,'Informe técnico del partido',`${EQUIPOS?.[equipoActivo]?.nombre||'Equipo'} vs ${m.opponent||'Rival'} · ${meta.date||''}`)}
    <div class="cards">
      <div class="card"><span>Resultado</span><b>${score.us}-${score.opponent}</b><small>${v750Arr(m.sets).map(s=>`${s.scoreUs}-${s.scoreOpponent}`).join(' · ')}</small></div>
      <div class="card"><span>K1 Side-out</span><b>${ok1.length?v750Pct(po.sideOut,ok1.length)+'%':'—'}</b><small>${po.sideOut}/${ok1.length} · rival ${rk1.length?v750Pct(pr.sideOut,rk1.length)+'%':'—'}</small></div>
      <div class="card"><span>K2 Break point</span><b>${ok2.length?v750Pct(po.breakPoint,ok2.length)+'%':'—'}</b><small>${po.breakPoint}/${ok2.length} · rival ${rk2.length?v750Pct(pr.breakPoint,rk2.length)+'%':'—'}</small></div>
      <div class="card"><span>G-P rallies</span><b>${v750Gp(ob.won-ob.lost)}</b><small>${ob.won} ganados / ${ob.lost} perdidos</small></div>
      <div class="card"><span>Recepción +/#</span><b>${orec.total?orec.posPct+'%':'—'}</b><small>Exc ${orec.total?orec.excPct+'%':'—'} · ${orec.total} rec.</small></div>
      <div class="card"><span>Ataque punto</span><b>${oatt.total?oatt.ptsPct+'%':'—'}</b><small>${oatt.perfect}/${oatt.total} · G-P ${oatt.total?v750Gp(oatt.gp):'—'}</small></div>
      <div class="card"><span>Puntos propios</span><b>${ob.serve+ob.attack+ob.block}</b><small>Saq ${ob.serve} · Atq ${ob.attack} · Blq ${ob.block}</small></div>
      <div class="card"><span>Error rival</span><b>${ob.oppErr}</b><small>puntos sin acción # propia terminal</small></div>
    </div>
    <h2>Lectura ejecutiva</h2><div class="insights">${insights.map(x=>`<div class="insight ${x.kind}"><b>${v750Esc(x.tag)}</b><span>${v750Esc(x.text)}</span></div>`).join('')}</div>
    <h2>Evolución por set</h2><table class="tbl"><thead><tr><th>Set</th><th>Marcador</th><th>K1</th><th>K2</th><th>REC Pos</th><th>REC Exc</th><th>ATQ Pts</th><th>Ace</th><th>Error saque</th><th>BLQ</th></tr></thead><tbody>${sets.map(x=>`<tr><td><b>S${x.set}</b></td><td>${x.score}</td><td>${x.k1==null?'—':x.k1+'%'} (${x.k1n})</td><td>${x.k2==null?'—':x.k2+'%'} (${x.k2n})</td><td>${x.recN?x.recPos+'%':'—'}</td><td>${x.recN?x.recExc+'%':'—'}</td><td>${x.attN?x.att+'%':'—'}</td><td>${x.ace}</td><td>${x.serveErr}</td><td>${x.block}</td></tr>`).join('')}</tbody></table>
    <div class="footer"><span>Cobertura: ${q.codedPct}% de rallies codificados · ${q.actions} acciones</span><span>Página 1 · Resumen ejecutivo</span></div></div>`;

  const p2=`<div class="rp">${v750AnalysisBaseStyle()}${v750AnalysisHeader(m,'Rendimiento por jugador','Impacto individual y fundamentos')}
    <h2>${v750Esc(EQUIPOS?.[equipoActivo]?.nombre||'Equipo')}</h2>${v750PlayerAnalysisTable(m,'ours')}
    <h2>${v750Esc(m.opponent||'Rival')}</h2>${v750PlayerAnalysisTable(m,'opponent')}
    <h2>Fuentes de punto</h2><div class="twocol"><div class="section-box"><b>${v750Esc(EQUIPOS?.[equipoActivo]?.nombre||'Equipo')}</b>${v750Bars([{label:'Saque',v:ob.serve},{label:'Ataque',v:ob.attack},{label:'Bloqueo',v:ob.block},{label:'Error rival',v:ob.oppErr}],'label','v',ob.total)}</div><div class="section-box"><b>${v750Esc(m.opponent||'Rival')}</b>${v750Bars([{label:'Saque',v:rb.serve},{label:'Ataque',v:rb.attack},{label:'Bloqueo',v:rb.block},{label:'Error rival',v:rb.oppErr}],'label','v',rb.total)}</div></div>
    <div class="note">G-P individual = puntos directos atribuidos (# en saque, ataque y bloqueo) menos pérdidas terminales atribuibles según la codificación. No se asignan automáticamente al jugador los errores de sistema.</div>
    <div class="footer"><span>Solo se muestran métricas sustentadas por acciones codificadas.</span><span>Página 2 · Jugadores</span></div></div>`;

  const op=po, rp=pr;
  const phaseTable=(a,b)=>`<table class="tbl"><thead><tr><th>Fase de ataque</th><th>${v750Esc(EQUIPOS?.[equipoActivo]?.nombre||'Equipo')} Tot</th><th>Pts</th><th>Err</th><th>Blq</th><th>Pts%</th><th>${v750Esc(m.opponent||'Rival')} Tot</th><th>Pts</th><th>Err</th><th>Blq</th><th>Pts%</th></tr></thead><tbody>${[['1er ataque tras recepción +/#','positive'],['1er ataque tras recepción !/-/','negative'],['Contraataque','counter']].map(([label,k])=>`<tr><td><b>${label}</b></td><td>${a[k].total}</td><td>${a[k].pts}</td><td>${a[k].err}</td><td>${a[k].blq}</td><td>${a[k].pct==null?'—':a[k].pct+'%'}</td><td>${b[k].total}</td><td>${b[k].pts}</td><td>${b[k].err}</td><td>${b[k].blq}</td><td>${b[k].pct==null?'—':b[k].pct+'%'}</td></tr>`).join('')}</tbody></table>`;
  const p3=`<div class="rp">${v750AnalysisBaseStyle()}${v750AnalysisHeader(m,'K1, K2 y rotaciones','Eficacia de las fases del juego')}
    <div class="cards"><div class="card"><span>Recepciones / punto SO</span><b>${op.recPerPoint?op.recPerPoint.toFixed(2):'—'}</b><small>${op.receptionTotal} recepciones · ${op.sideOut} SO</small></div><div class="card"><span>Saques / break</span><b>${op.servePerPoint?op.servePerPoint.toFixed(2):'—'}</b><small>${op.serveTotal} saques · ${op.breakPoint} BP</small></div><div class="card"><span>Rival rec./SO</span><b>${rp.recPerPoint?rp.recPerPoint.toFixed(2):'—'}</b><small>${rp.receptionTotal} recepciones · ${rp.sideOut} SO</small></div><div class="card"><span>Rival saq./BP</span><b>${rp.servePerPoint?rp.servePerPoint.toFixed(2):'—'}</b><small>${rp.serveTotal} saques · ${rp.breakPoint} BP</small></div></div>
    <h2>Ataque según fase</h2>${phaseTable(op,rp)}
    <div class="twocol"><div><h2>Nuestras rotaciones</h2>${v750RotationAnalysisTable(m,'ours')}</div><div><h2>Rotaciones del rival</h2>${v750RotationAnalysisTable(m,'opponent')}</div></div>
    <div class="note">K1 = rally iniciado en recepción. K2 = rally iniciado al saque. Los porcentajes de rotación incluyen el tamaño de la muestra para evitar interpretar como estable una rotación con pocos rallies.</div>
    <div class="footer"><span>Fases calculadas desde el estado de saque al inicio de cada rally.</span><span>Página 3 · Fases y rotaciones</span></div></div>`;

  const rz=v750ReceptionZones(m,'ours'),sz=v750ServeZones(m,'ours'),ad=v750AttackDirections(m,'ours'),dist=v750Distribution(m,'ours');
  const p4=`<div class="rp">${v750AnalysisBaseStyle()}${v750AnalysisHeader(m,'Zonas y distribución','Dónde se producen las acciones y cómo se distribuye el juego')}
    <div class="twocol"><div><h2>Recepción por zona de contacto</h2><table class="tbl"><thead><tr><th>Zona</th><th>Tot</th><th>Pos</th><th>Pos%</th><th>Exc%</th><th>Err</th></tr></thead><tbody>${rz.map(x=>`<tr><td><b>Z${x.zone}</b></td><td>${x.total}</td><td>${x.pos}</td><td>${x.posPct}%</td><td>${x.excPct}%</td><td>${x.err}</td></tr>`).join('')||'<tr><td colspan="6">Sin zonas de recepción codificadas.</td></tr>'}</tbody></table></div>
    <div><h2>Saque por zona destino</h2><table class="tbl"><thead><tr><th>Zona</th><th>Tot</th><th>Ace</th><th>Error</th><th>Presión #/+</th></tr></thead><tbody>${sz.map(x=>`<tr><td><b>Z${x.zone}</b></td><td>${x.total}</td><td>${x.ace}</td><td>${x.err}</td><td>${x.pressure} (${x.pressurePct}%)</td></tr>`).join('')||'<tr><td colspan="5">Sin destinos de saque codificados.</td></tr>'}</tbody></table></div></div>
    <div class="twocol"><div><h2>Direcciones de ataque</h2><table class="tbl"><thead><tr><th>Dirección</th><th>Tot</th><th>Pts</th><th>Pts%</th><th>Err</th><th>Blq</th><th>EFF%</th></tr></thead><tbody>${ad.slice(0,12).map(x=>`<tr><td><b>${v750Esc(x.direction)}</b></td><td>${x.total}</td><td>${x.pts}</td><td>${x.ptsPct}%</td><td>${x.err}</td><td>${x.blq}</td><td>${x.effPct}%</td></tr>`).join('')||'<tr><td colspan="7">Sin direcciones de ataque codificadas.</td></tr>'}</tbody></table></div>
    <div><h2>Distribución del colocador</h2><table class="tbl"><thead><tr><th>Destino / combinación</th><th>Tot</th><th>Uso</th></tr></thead><tbody>${dist.slice(0,14).map(x=>`<tr><td><b>${v750Esc(x.label)}</b></td><td>${x.total}</td><td>${x.pct}%</td></tr>`).join('')||'<tr><td colspan="3">Sin distribución codificada.</td></tr>'}</tbody></table></div></div>
    <div class="note">Las zonas y direcciones solo se muestran cuando fueron codificadas. La ausencia de un dato no se interpreta como cero.</div>
    <div class="footer"><span>Zonas: Z1-Z6 según la codificación de Volley Coach.</span><span>Página 4 · Zonas y distribución</span></div></div>`;

  const q2=v750DataQuality(m);
  const p5=`<div class="rp">${v750AnalysisBaseStyle()}${v750AnalysisHeader(m,'Apéndice metodológico','Calidad de muestra y definición de las métricas')}
    <h2>Cobertura del scouting</h2><div class="cards"><div class="card"><span>Rallies</span><b>${q2.rallies}</b><small>cerrados</small></div><div class="card"><span>Rallies con acciones</span><b>${q2.codedRallies}</b><small>${q2.codedPct}%</small></div><div class="card"><span>Acciones</span><b>${q2.actions}</b><small>codificadas</small></div><div class="card"><span>Incidencias de muestra</span><b>${q2.issues.length}</b><small>${q2.issues.length?'revisar':'sin alertas automáticas'}</small></div></div>
    <h2>Definiciones</h2><table class="tbl"><tbody><tr><td><b>G-P</b></td><td style="text-align:left">Puntos directos ganados menos pérdidas terminales atribuibles. En ataque, un balón bloqueado "/" cuenta como pérdida terminal.</td></tr><tr><td><b>FP / Break point</b></td><td style="text-align:left">Punto conseguido en un rally que comenzó con el equipo al saque.</td></tr><tr><td><b>Side-out / K1</b></td><td style="text-align:left">Rally ganado después de comenzar en recepción.</td></tr><tr><td><b>Recepción Pos%</b></td><td style="text-align:left">Recepciones # o + dividido por recepciones totales.</td></tr><tr><td><b>Recepción Exc%</b></td><td style="text-align:left">Recepciones # dividido por recepciones totales.</td></tr><tr><td><b>Ataque Pts%</b></td><td style="text-align:left">Ataques # dividido por ataques totales.</td></tr><tr><td><b>EFF ataque</b></td><td style="text-align:left">(Puntos - errores - bloqueados) / ataques totales. Solo aparece en el análisis ampliado.</td></tr></tbody></table>
    <h2>Advertencias automáticas</h2><div class="insights">${q2.issues.length?q2.issues.map(x=>`<div class="insight warn"><b>Muestra</b><span>${v750Esc(x)}</span></div>`).join(''):'<div class="insight good"><b>Muestra</b><span>No se han detectado déficits graves de cobertura con los umbrales automáticos utilizados. Esto no garantiza que todas las acciones estén codificadas correctamente.</span></div>'}</div>
    <h2>Interpretación</h2><div class="section-box">Este informe es descriptivo y depende de la calidad del scouting. Las cifras con muestras pequeñas deben utilizarse como indicios, no como tendencias consolidadas. Volley Coach no rellena acciones ausentes ni transforma un dato desconocido en cero.</div>
    <div class="footer"><span>Generado por Volley Coach V7.5.</span><span>Página 5 · Metodología</span></div></div>`;
  return [p1,p2,p3,p4,p5];
}
async function v750CanvasFromHTML(markup,width=1120,scale=1.75){
  const el=document.createElement('div');el.style.cssText=`position:fixed;left:-30000px;top:0;width:${width}px;background:#fff;z-index:-1`;el.innerHTML=markup;document.body.appendChild(el);
  try{return await html2canvas(el.firstElementChild||el,{scale,backgroundColor:'#ffffff',logging:false,useCORS:true})}
  finally{el.remove()}
}
function v750AddCanvasPage(pdf,canvas,newPage=false,orientation='p',margin=5){
  if(newPage)pdf.addPage('a4',orientation);
  const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),maxW=W-margin*2,maxH=H-margin*2,ratio=Math.min(maxW/canvas.width,maxH/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
  pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',(W-w)/2,(H-h)/2,w,h,undefined,'FAST');
}

/* ----------------- OFFICIAL SHEET PDF ----------------- */
window.scoutExportPDF=async function(id){
  const m=v750SelectedMatch(id);if(!m){alert('No hay scouting seleccionado.');return}
  if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}
  scoutExportNotice?.(true,'Generando hoja estadística oficial…');
  try{
    const canvas=await v750CanvasFromHTML(v750OfficialPage(m),1180,2);
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    v750AddCanvasPage(pdf,canvas,false,'p',4);
    pdf.save(`${scoutSafeFilename(m.date+'_'+m.opponent)}_Hoja_Estadistica_V75.pdf`);
  }catch(err){console.error('V7.5 official PDF',err);alert('No se ha podido generar la hoja estadística.')}
  finally{scoutExportNotice?.(false)}
};

/* ----------------- PROFESSIONAL ANALYSIS PDF ----------------- */
window.scoutExportAnalysisPDF=async function(id){
  const m=v750SelectedMatch(id);if(!m){alert('No hay scouting seleccionado.');return}
  if(!window.html2canvas||!window.jspdf?.jsPDF){alert('No se ha podido cargar el motor PDF.');return}
  scoutExportNotice?.(true,'Generando análisis profesional…');
  try{
    const pages=v750AnalysisPages(m),canvases=[];
    for(let i=0;i<pages.length;i++){
      scoutExportNotice?.(true,`Generando análisis profesional · página ${i+1}/${pages.length}…`);
      canvases.push(await v750CanvasFromHTML(pages[i],1120,1.7));
    }
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    canvases.forEach((c,i)=>v750AddCanvasPage(pdf,c,i>0,'p',6));
    pdf.save(`${scoutSafeFilename(m.date+'_'+m.opponent)}_Analisis_Profesional_V75.pdf`);
  }catch(err){console.error('V7.5 analysis PDF',err);alert('No se ha podido generar el análisis profesional.')}
  finally{scoutExportNotice?.(false)}
};

/* Render professional panel every time the analysis view is recalculated. */
const v750RenderAnalysisBase=window.scoutRenderAnalysis;
window.scoutRenderAnalysis=function(...args){
  const out=v750RenderAnalysisBase?.apply(this,args);
  try{window.scoutV750RenderProfessionalAnalysis()}catch(err){console.warn('V7.5 professional panel',err)}
  return out;
};

/* Also refresh it after player filters without changing the full-match professional summary. */
const v750PlayerAnalyticsBase=window.scoutRenderPlayerAnalytics;
window.scoutRenderPlayerAnalytics=function(...args){
  const out=v750PlayerAnalyticsBase?.apply(this,args);
  try{window.scoutV750RenderProfessionalAnalysis()}catch(_){}
  return out;
};


window.VC_V750_REPORTS={
  selectedMatch:v750SelectedMatch,
  stats:v750Stats,
  perf:v750Perf,
  meta:v750Meta,
  setDurSeconds:v750SetDurSeconds,
  checkpoints:v750Checkpoints,
  terminalBreakdown:v750TerminalBreakdown,
  rotationStats:v750RotationStats,
  setTrend:v750SetTrend,
  receptionZones:v750ReceptionZones,
  serveZones:v750ServeZones,
  attackDirections:v750AttackDirections,
  distribution:v750Distribution,
  playerRows:v750PlayerRows,
  dataQuality:v750DataQuality,
  insights:v750Insights
};

window.scoutV750Diagnostics=function(){
  const m=scoutMatchForAnalysis?.()||scoutExportMatch?.();
  if(!m)return {version:V750_VERSION,match:null};
  return {version:V750_VERSION,match:m.id,quality:v750DataQuality(m),insights:v750Insights(m),receptionZones:v750ReceptionZones(m,'ours').length,serveZones:v750ServeZones(m,'ours').length,attackDirections:v750AttackDirections(m,'ours').length,distributionTargets:v750Distribution(m,'ours').length};
};

setTimeout(()=>{try{window.scoutV750RenderProfessionalAnalysis()}catch(_){}},0);
})();
