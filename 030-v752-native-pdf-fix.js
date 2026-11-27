/* VC20711_REPORTS_BUNDLE: original classic scripts and inline report fixes, same order */
/* VC20711_SOURCE_BEGIN:029-v750-professional-reports-module.js */

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

/* VC20711_SOURCE_END:029-v750-professional-reports-module.js */
;

/* VC20711_SOURCE_BEGIN:030-v752-native-pdf-fix.js */

(()=>{
'use strict';

const VERSION='7.5.2';
const A4={portrait:[595.28,841.89],landscape:[841.89,595.28]};
const B=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const R=()=>window.VC_V750_REPORTS||null;
const arr=v=>Array.isArray(v)?v:[];
const safeName=v=>(B()?.safeFilename?.(v)||String(v||'reporte').replace(/[\\/:*?"<>|]+/g,'_'));
const teamName=()=>B()?.teamName?.()||'Equipo';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=(n,d)=>d?Math.round((Number(n)||0)*100/(Number(d)||0)):null;
const gp=v=>{v=Number(v)||0;return v>0?`+${v}`:`${v}`};

function notify(on,text=''){
  try{
    if(B()?.exportNotice){B().exportNotice(on,text);return}
  }catch(_){}
  let el=document.getElementById('v751-pdf-status');
  if(!el){
    el=document.createElement('div');el.id='v751-pdf-status';
    el.style.cssText='position:fixed;right:18px;bottom:18px;z-index:60000;background:#102b43;color:#fff;padding:10px 12px;border-radius:8px;font:700 10px Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.22)';
    document.body.appendChild(el);
  }
  el.textContent=text||'Generando PDF…';
  el.style.display=on?'block':'none';
}
function alertErr(title,err){
  console.error(title,err);
  alert(`${title}\n\n${String(err?.message||err||'Error desconocido')}`);
}

/* ---------- CP1252 / PDF helpers ---------- */
function cp1252Hex(input){
  let s=String(input??'')
    .replace(/[–—]/g,'-').replace(/…/g,'...')
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/→/g,'>').replace(/←/g,'<').replace(/·/g,' - ')
    .replace(/≥/g,'>=').replace(/≤/g,'<=');
  let out='';
  for(const ch of s){
    let c=ch.codePointAt(0),b=63;
    if(c<=255)b=c;
    else{
      const map={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
      b=map[c]??63;
    }
    out+=b.toString(16).padStart(2,'0').toUpperCase();
  }
  return out;
}
function pdfColor(c){
  if(!c)return [0,0,0];
  if(Array.isArray(c))return c.map(x=>Math.max(0,Math.min(255,Number(x)||0)));
  const h=String(c).replace('#','');
  if(h.length===6)return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  return [0,0,0];
}
function rgbCmd(c,stroke=false){
  const [r,g,b]=pdfColor(c).map(x=>(x/255).toFixed(3));
  return `${r} ${g} ${b} ${stroke?'RG':'rg'}`;
}
function approxWidth(text,size,bold=false){
  let n=0;
  for(const ch of String(text??'')){
    if('ilI1.,:;|!'.includes(ch)) n+=.28;
    else if('MW@#%'.includes(ch)) n+=.86;
    else if(ch===' ') n+=.28;
    else n+=bold?.58:.53;
  }
  return n*size;
}
function wrap(text,maxW,size=8,bold=false){
  const words=String(text??'').split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(approxWidth(test,size,bold)<=maxW||!line)line=test;
    else{lines.push(line);line=w}
  }
  if(line)lines.push(line);
  return lines.length?lines:[''];
}
class NativePDF{
  constructor(){this.pages=[];this.page=null}
  addPage(orientation='portrait'){
    const [w,h]=A4[orientation]||A4.portrait;
    this.page={w,h,ops:[]};this.pages.push(this.page);return this.page;
  }
  op(s){this.page.ops.push(s)}
  rect(x,y,w,h,opt={}){
    const py=this.page.h-y-h;
    if(opt.fill)this.op(`${rgbCmd(opt.fill)} ${x.toFixed(2)} ${py.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    if(opt.stroke!==false){
      this.op(`${rgbCmd(opt.stroke||'#000000',true)} ${(opt.lineWidth||.5).toFixed(2)} w ${x.toFixed(2)} ${py.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
  }
  line(x1,y1,x2,y2,opt={}){
    const py1=this.page.h-y1,py2=this.page.h-y2;
    this.op(`${rgbCmd(opt.color||'#000000',true)} ${(opt.width||.5).toFixed(2)} w ${x1.toFixed(2)} ${py1.toFixed(2)} m ${x2.toFixed(2)} ${py2.toFixed(2)} l S`);
  }
  text(text,x,y,opt={}){
    const size=opt.size||8,font=opt.font||'F1',color=opt.color||'#000000';
    let tx=x;
    const width=approxWidth(text,size,font==='F2');
    if(opt.align==='center')tx=x-width/2;
    if(opt.align==='right')tx=x-width;
    const py=this.page.h-y-size*.82;
    this.op(`${rgbCmd(color)} BT /${font} ${size.toFixed(2)} Tf 1 0 0 1 ${tx.toFixed(2)} ${py.toFixed(2)} Tm <${cp1252Hex(text)}> Tj ET`);
  }
  textBox(text,x,y,w,opt={}){
    const size=opt.size||8,leading=opt.leading||size*1.25,lines=wrap(text,w,size,opt.font==='F2'),max=opt.maxLines||999;
    lines.slice(0,max).forEach((l,i)=>this.text(l,x,y+i*leading,opt));
    return Math.min(lines.length,max)*leading;
  }
  save(filename){
    const objs=[];
    const font1=3,font2=4,font3=5;
    const pageStart=6;
    const pageRefs=[];
    this.pages.forEach((p,i)=>pageRefs.push(pageStart+i*2));
    objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objs[2]=`<< /Type /Pages /Count ${this.pages.length} /Kids [${pageRefs.map(n=>`${n} 0 R`).join(' ')}] >>`;
    objs[font1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[font2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objs[font3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
    this.pages.forEach((p,i)=>{
      const pageObj=pageStart+i*2,contentObj=pageObj+1,stream=p.ops.join('\n');
      objs[pageObj]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w.toFixed(2)} ${p.h.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObj} 0 R >>`;
      objs[contentObj]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    const max=objs.length-1;
    let pdf='%PDF-1.4\n%VC751\n',offsets=[0];
    for(let i=1;i<=max;i++){
      offsets[i]=pdf.length;
      pdf+=`${i} 0 obj\n${objs[i]||'<<>>'}\nendobj\n`;
    }
    const xref=pdf.length;
    pdf+=`xref\n0 ${max+1}\n0000000000 65535 f \n`;
    for(let i=1;i<=max;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    pdf+=`trailer\n<< /Size ${max+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob=new Blob([pdf],{type:'application/pdf'});
    if(typeof window.scoutV753DeliverPDF==='function'){
      window.scoutV753DeliverPDF(blob,filename);
      return;
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
}

/* ---------- Drawing helpers ---------- */
function header(pdf,title,subtitle,pageNo,total){
  const p=pdf.page,W=p.w,M=28;
  pdf.rect(M,24,W-M*2,46,{fill:'#102b43',stroke:'#102b43'});
  pdf.text('VOLLEY COACH · PROFESSIONAL REPORTS · V7.5.2',M+12,35,{size:7,font:'F2',color:'#B9CBD8'});
  pdf.text(title,M+12,48,{size:17,font:'F2',color:'#FFFFFF'});
  pdf.text(subtitle,M+12,62,{size:7.5,color:'#D6E1E8'});
  pdf.text(`${pageNo}/${total}`,W-M-12,48,{size:8,font:'F2',color:'#FFFFFF',align:'right'});
}
function footer(pdf,text=''){
  const p=pdf.page,M=28,y=p.h-24;
  pdf.line(M,y,p.w-M,y,{color:'#D5DEE4',width:.5});
  pdf.text(text||'Volley Coach V7.5.2',M,y+7,{size:6.5,color:'#72818D'});
  pdf.text('Datos calculados solo a partir de acciones registradas.',p.w-M,y+7,{size:6.5,color:'#72818D',align:'right'});
}
function card(pdf,x,y,w,h,label,value,note=''){
  pdf.rect(x,y,w,h,{fill:'#F7F9FA',stroke:'#D9E2E7'});
  pdf.text(label.toUpperCase(),x+7,y+8,{size:6,font:'F2',color:'#72818D'});
  pdf.text(value,x+7,y+19,{size:15,font:'F2',color:'#17324D'});
  if(note)pdf.textBox(note,x+7,y+38,w-14,{size:6.2,color:'#788792',leading:7.2,maxLines:2});
}
function table(pdf,x,y,width,headers,rows,widths,opt={}){
  const headH=opt.headH||14,rowH=opt.rowH||11,size=opt.size||6.3;
  const totalW=widths.reduce((a,b)=>a+b,0),scale=width/totalW,ws=widths.map(v=>v*scale);
  pdf.rect(x,y,width,headH,{fill:'#E8EDF0',stroke:'#B7C2CA'});
  let cx=x;
  headers.forEach((h,i)=>{
    const align=i===0?'left':'center';
    pdf.text(String(h),align==='left'?cx+3:cx+ws[i]/2,y+4.2,{size:5.5,font:'F2',color:'#314B5F',align});
    cx+=ws[i];
  });
  let cy=y+headH;
  rows.forEach((r,ri)=>{
    if(ri%2)pdf.rect(x,cy,width,rowH,{fill:'#FAFBFC',stroke:false});
    pdf.line(x,cy+rowH,x+width,cy+rowH,{color:'#DCE3E7',width:.35});
    cx=x;
    r.forEach((v,i)=>{
      const align=i===0?'left':'center',font=(opt.boldFirst&&i===0)?'F2':'F1';
      let txt=String(v??'');
      const maxW=ws[i]-5;
      while(txt.length>1&&approxWidth(txt,size,font==='F2')>maxW)txt=txt.slice(0,-1);
      if(txt!==String(v??''))txt=txt.slice(0,-1)+'…';
      pdf.text(txt,align==='left'?cx+3:cx+ws[i]/2,cy+3.3,{size,font,color:'#243D50',align});
      cx+=ws[i];
    });
    cy+=rowH;
  });
  return cy;
}
function sectionTitle(pdf,text,x,y,w){
  pdf.text(text,x,y,{size:10,font:'F2',color:'#17324D'});
  pdf.line(x,y+12,x+w,y+12,{color:'#294D69',width:1});
  return y+18;
}
function selectedMatch(id){
  const b=B();
  return b?.getExportMatch?.(id)||b?.getMatchForAnalysis?.()||R()?.selectedMatch?.(id)||null;
}
function score(m){
  const b=B();
  if(b?.setsScore)return b.setsScore(m);
  const sets=arr(m?.sets),us=sets.filter(s=>s.finished&&s.winner==='ours').length,opponent=sets.filter(s=>s.finished&&s.winner==='opponent').length;
  return {us,opponent};
}

/* ---------- OFFICIAL SHEET ---------- */
function teamOfficial(pdf,m,team,y){
  const rr=R(),data=rr.stats(m,team),name=team==='ours'?teamName():(m.opponent||'Rival'),M=20,W=pdf.page.w-40;
  pdf.rect(M,y,W,15,{fill:'#D8DADB',stroke:'#666666'});
  pdf.text(name,M+4,y+3.7,{size:8.5,font:'F2',color:'#111111'});
  y+=15;

  const headers=['Jugador','S1','S2','S3','S4','S5','Tot','FP','G-P','Saq','Err','Ace','Rec','Err','Pos%','Exc%','Atq','Err','Blq','Pts','Pts%','BLQ'];
  const widths=[122,13,13,13,13,13,18,18,20,18,17,17,18,17,20,20,18,17,17,17,21,18];
  const rows=data.players.map(st=>{
    const s=B().skill(st,'S'),r=B().reception(st),a=B().attack(st),b=B().skill(st,'B'),
      p=B().pointMetrics(m,team,st.key,data.rows),
      forms=[1,2,3,4,5].map(n=>B().initialPos(m,team,st,n)||'');
    const label=String(st.label||'Jugador').replace(/^#(\d+)\s*·\s*/,(_,n)=>`${n} `);
    return [label,...forms,p.won||'.',p.fp||'.',gp(p.gp),s.total||'.',s.total?(s.error||'.'):'.',s.total?(s.perfect||'.'):'.',r.total||'.',r.total?(r.error||'.'):'.',r.total?`${r.posPct}%`:'.',r.total?`${r.excPct}%`:'.',a.total||'.',a.total?(a.error||'.'):'.',a.total?(a.blocked||'.'):'.',a.total?(a.perfect||'.'):'.',a.total?`${a.ptsPct}%`:'.',b.total?(b.perfect||'.'):'.'];
  });
  const st=data.teamStat,s=B().skill(st,'S'),rec=B().reception(st),att=B().attack(st),bl=B().skill(st,'B'),pm=B().pointMetrics(m,team,'team',data.rows);
  rows.push(['TOTALES','','','','','',pm.won,pm.fp,gp(pm.gp),s.total,s.error,s.perfect,rec.total,rec.error,rec.total?`${rec.posPct}%`:'.',rec.total?`${rec.excPct}%`:'.',att.total,att.error,att.blocked,att.perfect,att.total?`${att.ptsPct}%`:'.',bl.perfect]);
  y=table(pdf,M,y,W,headers,rows,widths,{headH:12,rowH:7.4,size:4.45,boldFirst:true});

  const setRows=arr(m.sets).slice(0,5).map(set=>{
    const x=B().setStat(m,team,set.number);
    return [`Set ${set.number}`,x.bd.serve,x.bd.attack,x.bd.block,x.bd.oppErr,x.s.total,x.s.error,x.s.perfect,x.r.total,x.r.error,x.r.total?`${x.r.posPct}%`:'.',x.r.total?`${x.r.excPct}%`:'.',x.a.total,x.a.error,x.a.blocked,x.a.perfect,x.a.total?`${x.a.ptsPct}%`:'.',x.b.perfect];
  });
  y+=3;
  y=table(pdf,M+110,y,W-110,['Set','Saq','Att','BLQ','Er.Ad.','Saq T','Err','Pts','Rec T','Err','Pos%','Exc%','Atq T','Err','Blq','Pts','Pts%','BLQ'],setRows,[32,18,18,18,23,22,18,18,22,18,22,22,22,18,18,18,22,18],{headH:10,rowH:6.7,size:4.4,boldFirst:true});
  return y+4;
}
function drawOfficial(pdf,m){
  pdf.addPage('portrait');
  const rr=R(),meta=rr.meta(m),sc=score(m),M=20,W=pdf.page.w-40;
  pdf.text(meta.competition||'Partido',M,22,{size:13,font:'F2'});
  pdf.text(meta.round||'',M,38,{size:8,color:'#555555'});
  pdf.text('INFORME',M,53,{size:10,font:'F2'});
  pdf.line(M,66,M+210,66,{color:'#555555',width:1});

  pdf.rect(M,74,250,64,{stroke:'#555555'});
  const info=[['Partido',meta.matchCode||'—'],['Fecha',meta.date||'—'],['Hora',meta.time||'—'],['Pabellón',meta.pavilion||'—'],['Ciudad',meta.city||'—']];
  info.forEach((r,i)=>{pdf.text(r[0],M+6,80+i*11,{size:6,font:'F2'});pdf.text(r[1],M+55,80+i*11,{size:6})});
  pdf.rect(M+260,20,W-260,52,{stroke:'#555555'});
  pdf.text(teamName(),M+267,30,{size:8.2,font:'F2'});pdf.text(String(sc.us),M+W-7,30,{size:9,font:'F2',align:'right'});
  pdf.text(m.opponent||'Rival',M+267,45,{size:8.2,font:'F2'});pdf.text(String(sc.opponent),M+W-7,45,{size:9,font:'F2',align:'right'});

  const setHeaders=['Set','Dur.','P1','P2','P3','Resultado'];
  const setRows=arr(m.sets).slice(0,5).map(s=>{
    const cps=rr.checkpoints(s),dur=rr.setDurSeconds(s);
    return [s.number,dur==null?'.':`${Math.floor(dur/60)}.${String(Math.round(dur%60)).padStart(2,'0')}`,cps[0],cps[1],cps[2],`${num(s.scoreUs)}-${num(s.scoreOpponent)}`];
  });
  table(pdf,M+260,76,W-260,setHeaders,setRows,[25,38,42,42,42,55],{headH:12,rowH:8,size:5.4});

  pdf.rect(M,144,W,16,{fill:'#F0F1F2',stroke:'#777777'});
  pdf.text(`Árbitros / observaciones: ${meta.referees||'—'}`,M+5,149,{size:5.5});

  let y=166;
  y=teamOfficial(pdf,m,'ours',y);
  y=teamOfficial(pdf,m,'opponent',y);

  const po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent');
  if(y>720)y=720;
  pdf.rect(M,y,W,14,{fill:'#D8DADB',stroke:'#666666'});
  pdf.text(`${teamName()}                         CAMBIO DE SAQUE / FASE PUNTO                         ${m.opponent||'Rival'}`,M+5,y+4,{size:6.2,font:'F2'});
  y+=17;
  const phaseRows=[
    ['Recepciones / SO',`${po.receptionTotal} / ${po.sideOut}`,`${pr.receptionTotal} / ${pr.sideOut}`],
    ['Cada recepción por punto',po.recPerPoint?po.recPerPoint.toFixed(2):'.',pr.recPerPoint?pr.recPerPoint.toFixed(2):'.'],
    ['Saques / FP',`${po.serveTotal} / ${po.breakPoint}`,`${pr.serveTotal} / ${pr.breakPoint}`],
    ['Cada saque por break',po.servePerPoint?po.servePerPoint.toFixed(2):'.',pr.servePerPoint?pr.servePerPoint.toFixed(2):'.'],
    ['1er ataque tras REC +/#',`${po.positive.pts}/${po.positive.total} · ${po.positive.pct??'.'}%`,`${pr.positive.pts}/${pr.positive.total} · ${pr.positive.pct??'.'}%`],
    ['1er ataque tras REC !/-',`${po.negative.pts}/${po.negative.total} · ${po.negative.pct??'.'}%`,`${pr.negative.pts}/${pr.negative.total} · ${pr.negative.pct??'.'}%`],
    ['Contraataque',`${po.counter.pts}/${po.counter.total} · ${po.counter.pct??'.'}%`,`${pr.counter.pts}/${pr.counter.total} · ${pr.counter.pct??'.'}%`]
  ];
  table(pdf,M,y,W,['Indicador',teamName(),m.opponent||'Rival'],phaseRows,[190,175,175],{headH:11,rowH:8,size:5.1,boldFirst:true});
  pdf.text('FP = fase punto · G-P = ganados - perdidos · Pos% = recepción +/# · Exc% = recepción # · Pts% = ataques # / total',M,pdf.page.h-25,{size:5.2,color:'#555555'});
  pdf.text('Volley Coach V7.5.2 · Hoja estadística',M,pdf.page.h-15,{size:5,color:'#777777'});
}

/* ---------- PROFESSIONAL ANALYSIS ---------- */
function insightBox(pdf,x,y,w,tag,text,kind='info'){
  const color=kind==='good'?'#3F7C63':kind==='warn'?'#D28B2E':'#597B95';
  const lines=wrap(text,w-74,7,false),h=Math.max(28,lines.length*9+10);
  pdf.rect(x,y,w,h,{fill:'#FAFBFC',stroke:'#DEE5E9'});
  pdf.rect(x,y,4,h,{fill:color,stroke:false});
  pdf.text(tag.toUpperCase(),x+10,y+8,{size:6,font:'F2',color:'#526B7D'});
  lines.forEach((l,i)=>pdf.text(l,x+72,y+7+i*9,{size:7,color:'#405565'}));
  return h;
}
function analysisPage1(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Informe técnico del partido',`${teamName()} vs ${m.opponent||'Rival'} · ${m.date||''}`,1,total);
  const rr=R(),po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent'),ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2'),
    os=rr.stats(m,'ours'),ors=B().reception(os.teamStat),oas=B().attack(os.teamStat),bd=rr.terminalBreakdown(m,'ours'),sc=score(m);
  const M=28,g=7,w=(pdf.page.w-M*2-g*3)/4,y=88;
  [
    ['Resultado',`${sc.us}-${sc.opponent}`,arr(m.sets).map(s=>`${s.scoreUs}-${s.scoreOpponent}`).join(' · ')],
    ['K1 Side-out',ok1.length?`${pct(po.sideOut,ok1.length)}%`:'—',`${po.sideOut}/${ok1.length} · rival ${rk1.length?pct(pr.sideOut,rk1.length)+'%':'—'}`],
    ['K2 Break',ok2.length?`${pct(po.breakPoint,ok2.length)}%`:'—',`${po.breakPoint}/${ok2.length} · rival ${rk2.length?pct(pr.breakPoint,rk2.length)+'%':'—'}`],
    ['G-P rallies',gp(bd.won-bd.lost),`${bd.won} ganados / ${bd.lost} perdidos`]
  ].forEach((c,i)=>card(pdf,M+i*(w+g),y,w,57,c[0],c[1],c[2]));
  const y2=153;
  [
    ['Recepción +/#',ors.total?`${ors.posPct}%`:'—',ors.total?`Exc ${ors.excPct}% · ${ors.total} rec.`:'Sin muestra'],
    ['Ataque punto',oas.total?`${oas.ptsPct}%`:'—',oas.total?`${oas.perfect}/${oas.total} · G-P ${gp(oas.gp)}`:'Sin muestra'],
    ['Puntos propios',String(bd.serve+bd.attack+bd.block),`Saq ${bd.serve} · Atq ${bd.attack} · Blq ${bd.block}`],
    ['Error rival',String(bd.oppErr),'puntos por error adversario']
  ].forEach((c,i)=>card(pdf,M+i*(w+g),y2,w,57,c[0],c[1],c[2]));

  let y3=sectionTitle(pdf,'Lectura ejecutiva',M,229,pdf.page.w-M*2);
  rr.insights(m).slice(0,7).forEach(ins=>{const h=insightBox(pdf,M,y3,pdf.page.w-M*2,ins.tag,ins.text,ins.kind);y3+=h+6});
  y3=sectionTitle(pdf,'Evolución por set',M,y3+3,pdf.page.w-M*2);
  const rows=rr.setTrend(m,'ours').map(x=>[`S${x.set}`,x.score,x.k1==null?'—':`${x.k1}% (${x.k1n})`,x.k2==null?'—':`${x.k2}% (${x.k2n})`,x.recN?`${x.recPos}%`:'—',x.recN?`${x.recExc}%`:'—',x.attN?`${x.att}%`:'—',`${x.ace}/${x.serveErr}`,x.block]);
  table(pdf,M,y3,pdf.page.w-M*2,['Set','Marc.','K1','K2','REC Pos','REC Exc','ATQ Pts','Ace/Err','BLQ'],rows,[35,48,60,60,55,55,55,55,35],{headH:14,rowH:12,size:6.3,boldFirst:true});
  footer(pdf,'Página 1 · Resumen ejecutivo');
}
function analysisPage2(pdf,m,total){
  pdf.addPage('landscape');header(pdf,'Rendimiento por jugador','Impacto individual y fundamentos',2,total);
  const M=24,W=pdf.page.w-M*2;
  let y=88;
  const drawPlayers=(team,title)=>{
    y=sectionTitle(pdf,title,M,y,W);
    const rows=R().playerRows(m,team).map(x=>[x.label,x.pts,x.fp,gp(x.gp),`${x.ace}/${x.serveErr}`,x.recTotal||'.',x.recTotal?`${x.recPos}%`:'.',x.recTotal?`${x.recExc}%`:'.',x.attTotal||'.',x.attTotal?x.kill:'.',x.attTotal?`${x.attPct}%`:'.',x.attTotal?gp(x.attGp):'.',x.block||'.']);
    y=table(pdf,M,y,W,['Jugador','PTS','FP','G-P','SAQ A/E','REC','POS%','EXC%','ATQ','PTS','PTS%','ATQ G-P','BLQ'],rows,[150,35,35,40,52,35,42,42,35,35,43,50,35],{headH:15,rowH:10.5,size:6,boldFirst:true});
    y+=10;
  };
  drawPlayers('ours',teamName());
  drawPlayers('opponent',m.opponent||'Rival');
  footer(pdf,'Página 2 · Estadística individual');
}
function analysisPage3(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'K1, K2 y rotaciones','Eficacia de las fases del juego',3,total);
  const rr=R(),po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent'),M=28,W=pdf.page.w-M*2;
  let y=88;
  const ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2');
  const cw=(W-14)/4;
  [
    ['Recepciones / SO',po.recPerPoint?po.recPerPoint.toFixed(2):'—',`${po.receptionTotal} rec. · ${po.sideOut} SO`],
    ['Saques / BP',po.servePerPoint?po.servePerPoint.toFixed(2):'—',`${po.serveTotal} saq. · ${po.breakPoint} BP`],
    ['Rival K1',rk1.length?`${pct(pr.sideOut,rk1.length)}%`:'—',`${pr.sideOut}/${rk1.length}`],
    ['Rival K2',rk2.length?`${pct(pr.breakPoint,rk2.length)}%`:'—',`${pr.breakPoint}/${rk2.length}`]
  ].forEach((c,i)=>card(pdf,M+i*(cw+14/3),y,cw,57,c[0],c[1],c[2]));
  y=sectionTitle(pdf,'Ataque según fase',M,158,W);
  const phaseRows=[
    ['1er ataque tras recepción +/#',po.positive.total,po.positive.pts,po.positive.err,po.positive.blq,po.positive.pct==null?'—':`${po.positive.pct}%`,pr.positive.total,pr.positive.pts,pr.positive.pct==null?'—':`${pr.positive.pct}%`],
    ['1er ataque tras recepción !/-',po.negative.total,po.negative.pts,po.negative.err,po.negative.blq,po.negative.pct==null?'—':`${po.negative.pct}%`,pr.negative.total,pr.negative.pts,pr.negative.pct==null?'—':`${pr.negative.pct}%`],
    ['Contraataque',po.counter.total,po.counter.pts,po.counter.err,po.counter.blq,po.counter.pct==null?'—':`${po.counter.pct}%`,pr.counter.total,pr.counter.pts,pr.counter.pct==null?'—':`${pr.counter.pct}%`]
  ];
  y=table(pdf,M,y,W,['Fase','Tot','Pts','Err','Blq','Pts%','Rival T','Rival Pts','Rival %'],phaseRows,[170,40,40,40,40,45,48,48,50],{headH:14,rowH:13,size:6.2,boldFirst:true})+13;
  y=sectionTitle(pdf,'Rotaciones R1-R6',M,y,W);
  const ro=rr.rotationStats(m,'ours'),rp=rr.rotationStats(m,'opponent');
  const rows=ro.map((x,i)=>[`R${x.no}`,x.total,`${x.k1Won}/${x.k1Total}`,x.k1Pct==null?'—':`${x.k1Pct}%`,`${x.k2Won}/${x.k2Total}`,x.k2Pct==null?'—':`${x.k2Pct}%`,gp(x.gp),`R${rp[i].no}`,`${rp[i].k1Won}/${rp[i].k1Total}`,rp[i].k1Pct==null?'—':`${rp[i].k1Pct}%`,`${rp[i].k2Won}/${rp[i].k2Total}`,rp[i].k2Pct==null?'—':`${rp[i].k2Pct}%`,gp(rp[i].gp)]);
  table(pdf,M,y,W,['Rot.','Rallies','K1 G/T','K1%','K2 G/T','K2%','G-P','Rival','K1 G/T','K1%','K2 G/T','K2%','G-P'],rows,[38,43,50,44,50,44,40,38,50,44,50,44,40],{headH:14,rowH:12,size:5.8,boldFirst:true});
  footer(pdf,'Página 3 · Fases y rotaciones');
}
function analysisPage4(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Zonas y distribución','Recepción, saque, ataque y colocación',4,total);
  const rr=R(),M=28,W=pdf.page.w-M*2,half=(W-12)/2;
  let y=88;
  y=sectionTitle(pdf,'Recepción por zona de contacto',M,y,half);
  const rz=rr.receptionZones(m,'ours').slice(0,10).map(x=>[`Z${x.zone}`,x.total,x.pos,`${x.posPct}%`,`${x.excPct}%`,x.err]);
  let yL=table(pdf,M,y,half,['Zona','Tot','Pos','Pos%','Exc%','Err'],rz.length?rz:[['Sin datos','','','','','']],[65,45,45,55,55,40],{headH:14,rowH:12,size:6.2,boldFirst:true});
  let yR=sectionTitle(pdf,'Saque por zona destino',M+half+12,88,half);
  const sz=rr.serveZones(m,'ours').slice(0,10).map(x=>[`Z${x.zone}`,x.total,x.ace,x.err,`${x.pressure} (${x.pressurePct}%)`]);
  yR=table(pdf,M+half+12,yR,half,['Zona','Tot','Ace','Err','Presión #/+'],sz.length?sz:[['Sin datos','','','','']],[65,45,45,45,95],{headH:14,rowH:12,size:6.2,boldFirst:true});
  y=Math.max(yL,yR)+18;
  y=sectionTitle(pdf,'Direcciones de ataque',M,y,half);
  const ad=rr.attackDirections(m,'ours').slice(0,12).map(x=>[x.direction,x.total,x.pts,`${x.ptsPct}%`,x.err,x.blq,`${x.effPct}%`]);
  yL=table(pdf,M,y,half,['Dirección','Tot','Pts','Pts%','Err','Blq','EFF%'],ad.length?ad:[['Sin datos','','','','','','']],[100,35,35,45,35,35,45],{headH:14,rowH:11,size:5.8,boldFirst:true});
  yR=sectionTitle(pdf,'Distribución del colocador',M+half+12,y,half);
  const ds=rr.distribution(m,'ours').slice(0,14).map(x=>[x.label,x.total,`${x.pct}%`]);
  table(pdf,M+half+12,yR,half,['Destino / combinación','Tot','Uso'],ds.length?ds:[['Sin datos','','']],[180,45,50],{headH:14,rowH:11,size:6,boldFirst:true});
  footer(pdf,'Página 4 · Zonas y distribución');
}
function analysisPage5(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Metodología y calidad de muestra','Qué significan las métricas y cuánta información las sostiene',5,total);
  const rr=R(),q=rr.dataQuality(m),M=28,W=pdf.page.w-M*2,g=8,cw=(W-g*3)/4;
  [
    ['Rallies',q.rallies,'cerrados'],
    ['Con acciones',q.codedRallies,`${q.codedPct}% de cobertura`],
    ['Acciones',q.actions,'codificadas'],
    ['Alertas',q.issues.length,q.issues.length?'revisar muestra':'sin alertas graves']
  ].forEach((c,i)=>card(pdf,M+i*(cw+g),88,cw,57,c[0],String(c[1]),c[2]));
  let y=sectionTitle(pdf,'Definiciones',M,165,W);
  const defs=[
    ['G-P','Puntos directos ganados menos pérdidas terminales atribuibles. En ataque, un balón bloqueado "/" cuenta como pérdida terminal.'],
    ['FP / Break point','Punto conseguido en un rally que comenzó con el equipo al saque.'],
    ['Side-out / K1','Rally ganado después de comenzar en recepción.'],
    ['Recepción Pos%','Recepciones # o + dividido por recepciones totales.'],
    ['Recepción Exc%','Recepciones # dividido por recepciones totales.'],
    ['Ataque Pts%','Ataques # dividido por ataques totales.'],
    ['EFF ataque','(Puntos - errores - bloqueados) / ataques totales.']
  ];
  defs.forEach(d=>{
    const h=insightBox(pdf,M,y,W,d[0],d[1],'info');y+=h+6;
  });
  y=sectionTitle(pdf,'Advertencias automáticas',M,y+3,W);
  if(q.issues.length)q.issues.forEach(t=>{const h=insightBox(pdf,M,y,W,'Muestra',t,'warn');y+=h+6});
  else y+=insightBox(pdf,M,y,W,'Muestra','No se han detectado déficits graves con los umbrales automáticos. Esto no garantiza que todas las acciones estén codificadas correctamente.','good')+6;
  y=sectionTitle(pdf,'Interpretación',M,y+3,W);
  pdf.textBox('Este informe es descriptivo y depende de la calidad del scouting. Las cifras con muestras pequeñas deben utilizarse como indicios, no como tendencias consolidadas. Volley Coach no rellena acciones ausentes ni transforma un dato desconocido en cero.',M,y,W,{size:7.5,leading:10,color:'#405565'});
  footer(pdf,'Página 5 · Metodología');
}

/* ---------- Public exports ---------- */
window.scoutV752ExportOfficialPDF=function(id){
  const m=selectedMatch(id);
  if(!m){alert('No hay scouting seleccionado para exportar.');return false}
  if(!B()){alert('El núcleo de scouting no está disponible para el PDF. Recarga la aplicación con Ctrl+F5.');return false}
  if(!R()){alert('El módulo estadístico V7.5 no está disponible. Recarga la aplicación con Ctrl+F5.');return false}
  notify(true,'Generando PDF hoja oficial…');
  try{
    const pdf=new NativePDF();drawOfficial(pdf,m);
    pdf.save(`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Hoja_Oficial_V752.pdf`);
  }catch(err){alertErr('No se ha podido generar la hoja oficial.',err)}
  finally{notify(false)}
  return false;
};
window.scoutV752ExportAnalysisPDF=function(id){
  const m=selectedMatch(id);
  if(!m){alert('No hay scouting seleccionado para exportar.');return false}
  if(!B()){alert('El núcleo de scouting no está disponible para el PDF. Recarga la aplicación con Ctrl+F5.');return false}
  if(!R()){alert('El módulo estadístico V7.5 no está disponible. Recarga la aplicación con Ctrl+F5.');return false}
  notify(true,'Generando PDF análisis Pro…');
  try{
    const pdf=new NativePDF(),total=5;
    analysisPage1(pdf,m,total);analysisPage2(pdf,m,total);analysisPage3(pdf,m,total);analysisPage4(pdf,m,total);analysisPage5(pdf,m,total);
    pdf.save(`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Analisis_Pro_V752.pdf`);
  }catch(err){alertErr('No se ha podido generar el análisis Pro.',err)}
  finally{notify(false)}
  return false;
};


/* V7.5.6 · Direct PDF core.
   Receives an already-resolved match object. It never searches for the match. */
window.VC_V752_PDF_CORE={
  exportOfficialMatch:function(m){
    if(!m)throw new Error('VC_V752_PDF_CORE: falta el objeto de partido.');
    if(!B())throw new Error('VC_V752_PDF_CORE: el puente del scouting no está disponible.');
    if(!R())throw new Error('VC_V752_PDF_CORE: el módulo estadístico no está disponible.');
    notify(true,'Generando PDF hoja oficial…');
    try{
      const pdf=new NativePDF();
      drawOfficial(pdf,m);
      const filename=`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Hoja_Oficial_V756.pdf`;
      pdf.save(filename);
      return {ok:true,filename};
    }finally{
      notify(false);
    }
  },
  exportAnalysisMatch:function(m){
    if(!m)throw new Error('VC_V752_PDF_CORE: falta el objeto de partido.');
    if(!B())throw new Error('VC_V752_PDF_CORE: el puente del scouting no está disponible.');
    if(!R())throw new Error('VC_V752_PDF_CORE: el módulo estadístico no está disponible.');
    notify(true,'Generando PDF análisis Pro…');
    try{
      const pdf=new NativePDF(),total=5;
      analysisPage1(pdf,m,total);
      analysisPage2(pdf,m,total);
      analysisPage3(pdf,m,total);
      analysisPage4(pdf,m,total);
      analysisPage5(pdf,m,total);
      const filename=`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Analisis_Pro_V756.pdf`;
      pdf.save(filename);
      return {ok:true,filename};
    }finally{
      notify(false);
    }
  }
};

/* Compatibility aliases so old places in the app also use the repaired exporter. */
window.scoutExportPDF=window.scoutV752ExportOfficialPDF;
window.scoutExportAnalysisPDF=window.scoutV752ExportAnalysisPDF;

/* Repair any buttons generated later by old render functions. */
function repairButtons(root=document){
  (root.matches?.('button')?[root,...root.querySelectorAll('button')]:root.querySelectorAll?.('button')||[]).forEach(b=>{
    const txt=(b.textContent||'').trim().toLowerCase(),oc=b.getAttribute('onclick')||'';
    if(txt.includes('pdf hoja')||txt==='pdf'){
      if(/scoutV752ExportOfficialPDF/.test(oc)){
        // Ya usa el exportador reparado; conserva un posible id de partido.
      }else if(/scoutExportPDF/.test(oc)){
        const arg=(oc.match(/scoutExportPDF\(([^)]*)\)/)||[])[1]||'';
        b.setAttribute('onclick',`return scoutV752ExportOfficialPDF(${arg})`);
      }
    }
    if(txt.includes('pdf análisis pro')||txt.includes('descargar análisis pro')){
      b.setAttribute('onclick','return scoutV752ExportAnalysisPDF()');
    }
  });
}
repairButtons();
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&(n.matches?.('button')||n.querySelector?.('button')))repairButtons(n)}))).observe(document.body,{childList:true,subtree:true});

window.scoutV752PDFDiagnostics=function(){
  return {
    version:VERSION,
    officialFunction:typeof window.scoutV752ExportOfficialPDF,
    analysisFunction:typeof window.scoutV752ExportAnalysisPDF,
    nativeEngine:true,
    html2canvasRequired:false,
    jsPDFRequired:false,
    reportBridge:!!B(),
    reportHelpers:!!R(),
    officialButtons:[...document.querySelectorAll('button')].filter(b=>(b.textContent||'').toLowerCase().includes('pdf hoja')).length,
    analysisButtons:[...document.querySelectorAll('button')].filter(b=>(b.textContent||'').toLowerCase().includes('análisis pro')).length
  };
};
})();

/* VC20711_SOURCE_END:030-v752-native-pdf-fix.js */
;

/* VC20711_SOURCE_BEGIN:v753-pdf-delivery-fix */

(()=>{
'use strict';

const VERSION='7.5.3';
let currentUrl=null;

function cleanupUrl(){
  if(currentUrl){try{URL.revokeObjectURL(currentUrl)}catch(_){} currentUrl=null}
}
function removeModal(){
  const el=document.getElementById('v753-pdf-modal');
  if(el)el.remove();
  cleanupUrl();
}
function esc753(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function modalBase(){
  let el=document.getElementById('v753-pdf-modal');
  if(el)el.remove();
  el=document.createElement('div');
  el.id='v753-pdf-modal';
  el.className='v753-pdf-modal';
  el.addEventListener('click',e=>{if(e.target===el)removeModal()});
  document.body.appendChild(el);
  return el;
}

window.scoutV753DeliverPDF=function(blob,filename){
  cleanupUrl();
  const url=URL.createObjectURL(blob);
  currentUrl=url;

  const modal=modalBase();
  modal.innerHTML=`<div class="v753-pdf-card">
    <h3>PDF listo</h3>
    <p>El informe se ha generado correctamente. Si el navegador bloquea la descarga automática, utiliza uno de los dos botones siguientes.</p>
    <div class="v753-pdf-file">${esc753(filename)} · ${Math.max(1,Math.round(blob.size/1024))} KB</div>
    <div class="v753-pdf-actions">
      <a id="v753-pdf-download" class="v753-pdf-download" href="${url}" download="${esc753(filename)}">Descargar PDF</a>
      <a id="v753-pdf-open" class="v753-pdf-open" href="${url}" target="_blank" rel="noopener">Abrir PDF</a>
      <button id="v753-pdf-close" class="v753-pdf-close" type="button">Cerrar</button>
    </div>
    <p class="v753-pdf-note">El archivo permanece disponible mientras esta ventana esté abierta. Esto evita que Safari, una PWA o el navegador bloqueen silenciosamente la descarga.</p>
  </div>`;

  document.getElementById('v753-pdf-close')?.addEventListener('click',removeModal);

  // Intento automático. Si el navegador lo bloquea, los enlaces manuales siguen activos.
  try{
    const a=document.getElementById('v753-pdf-download');
    if(a){
      setTimeout(()=>{try{a.click()}catch(_){}},0);
    }
  }catch(_){}
  return {url,filename,size:blob.size};
};

window.scoutV753ShowPDFError=function(title,error){
  const modal=modalBase();
  modal.innerHTML=`<div class="v753-pdf-card">
    <h3>${esc753(title||'Error al generar PDF')}</h3>
    <p>El botón sí se ha ejecutado, pero el informe ha encontrado un error.</p>
    <div class="v753-pdf-error">${esc753(error?.message||error||'Error desconocido')}</div>
    <div class="v753-pdf-actions"><button id="v753-pdf-close" class="v753-pdf-close" type="button">Cerrar</button></div>
  </div>`;
  document.getElementById('v753-pdf-close')?.addEventListener('click',removeModal);
};

function matchIdFromButton(btn){
  const oc=btn?.getAttribute?.('onclick')||'';
  const m=oc.match(/(?:scoutV752ExportOfficialPDF|scoutV753ExportOfficialPDF|scoutExportPDF)\((\d+)\)/);
  return m?Number(m[1]):undefined;
}
function roleOfButton(btn){
  if(!btn)return '';
  const txt=String(btn.textContent||'').trim().toLowerCase();
  const oc=String(btn.getAttribute?.('onclick')||'');
  if(txt.includes('pdf análisis pro')||txt.includes('descargar análisis pro')||/scoutV752ExportAnalysisPDF|scoutExportAnalysisPDF/.test(oc))return 'analysis';
  if((txt.includes('pdf hoja')||txt==='pdf')&&/scoutV752ExportOfficialPDF|scoutExportPDF/.test(oc))return 'official';
  return '';
}

/* Capture-phase delegation: executes before old inline onclick handlers and before
   any legacy PDF handler can swallow the click. */
document.addEventListener('click',function(e){
  const btn=e.target?.closest?.('button');
  const role=roleOfButton(btn);
  if(!role)return;

  e.preventDefault();
  e.stopPropagation();
  if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();

  try{
    if(role==='analysis'){
      if(typeof window.scoutV752ExportAnalysisPDF!=='function')throw new Error('No se ha cargado scoutV752ExportAnalysisPDF.');
      window.scoutV752ExportAnalysisPDF();
    }else{
      if(typeof window.scoutV752ExportOfficialPDF!=='function')throw new Error('No se ha cargado scoutV752ExportOfficialPDF.');
      window.scoutV752ExportOfficialPDF(matchIdFromButton(btn));
    }
  }catch(err){
    console.error('V7.5.3 PDF click',err);
    window.scoutV753ShowPDFError('No se ha podido crear el PDF',err);
  }
},true);

/* Wrap both existing exporters so runtime errors always become visible. */
const baseOfficial=window.scoutV752ExportOfficialPDF;
const baseAnalysis=window.scoutV752ExportAnalysisPDF;

window.scoutV753ExportOfficialPDF=function(event,id){
  try{
    if(event){event.preventDefault?.();event.stopPropagation?.()}
    if(typeof baseOfficial!=='function')throw new Error('El exportador de hoja oficial no está disponible.');
    return baseOfficial(id);
  }catch(err){window.scoutV753ShowPDFError('Error en PDF hoja oficial',err);return false}
};
window.scoutV753ExportAnalysisPDF=function(event,id){
  try{
    if(event){event.preventDefault?.();event.stopPropagation?.()}
    if(typeof baseAnalysis!=='function')throw new Error('El exportador de análisis Pro no está disponible.');
    return baseAnalysis(id);
  }catch(err){window.scoutV753ShowPDFError('Error en PDF análisis Pro',err);return false}
};

/* Legacy aliases point to the same fixed path. */
window.scoutExportPDF=(id)=>window.scoutV753ExportOfficialPDF(null,id);
window.scoutExportAnalysisPDF=(id)=>window.scoutV753ExportAnalysisPDF(null,id);

/* Add a visual loaded marker even if an old render replaces the toolbar. */
function markReady(){
  const toolbar=document.querySelector('#scout-analysis .scout-analysis-toolbar');
  if(toolbar&&!document.getElementById('scout-v753-pdf-ready')){
    const s=document.createElement('span');s.id='scout-v753-pdf-ready';s.textContent='PDF 7.5.7 ✓';s.title='Módulo PDF cargado';toolbar.appendChild(s);
  }
}
markReady();
new MutationObserver(records=>{
  if(records.some(r=>r.target?.closest?.('#scout-analysis') || [...r.addedNodes].some(n=>n.nodeType===1 && (n.id==='scout-analysis'||n.querySelector?.('#scout-analysis'))))) markReady();
}).observe(document.body,{childList:true,subtree:true});

window.scoutV753PDFDiagnostics=function(){
  return {
    version:VERSION,
    loaded:true,
    official:typeof window.scoutV752ExportOfficialPDF,
    analysis:typeof window.scoutV752ExportAnalysisPDF,
    bridge:!!window.VC_SCOUT_REPORT_BRIDGE,
    helpers:!!window.VC_V750_REPORTS,
    delivery:typeof window.scoutV753DeliverPDF,
    readyBadge:!!document.getElementById('scout-v753-pdf-ready')
  };
};
})();

/* VC20711_SOURCE_END:v753-pdf-delivery-fix */
;

/* VC20711_SOURCE_BEGIN:v754-report-bridge-fix */

(()=>{
'use strict';

const VERSION='7.5.4';
const B=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const arr=v=>Array.isArray(v)?v:[];
const pct=(n,d)=>d?Math.round((Number(n)||0)*100/(Number(d)||0)):null;
const gp=n=>{n=Number(n)||0;return `${n>0?'+':''}${n}`};
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const teamName=team=>team==='ours'?(B()?.teamName?.()||'Nuestro equipo'):'Rival';

function selectedMatch(id){
  const b=B();
  if(!b)return null;
  return b.getExportMatch?.(id) || b.getMatchForAnalysis?.() || b.getActive?.() || null;
}
function rallies(m,team){
  const b=B(); return b?.rallies?.(m,team,false)||[];
}
function stats(m,team){
  const b=B();
  return b?.fullStats?.(m,team,false) || b?.stats630?.(m,team) || {rows:[],players:[],teamStat:{skills:{},total:0}};
}
function perf(m,team){
  const b=B(); return b?.performance?.(m,team,false)||{
    rallies:[],sideOut:0,breakPoint:0,receptionTotal:0,serveTotal:0,recPerPoint:null,servePerPoint:null,
    positive:{total:0,pts:0,err:0,blq:0,pct:null},negative:{total:0,pts:0,err:0,blq:0,pct:null},
    counter:{total:0,pts:0,err:0,blq:0,pct:null},rot:[]
  };
}
function setDurSeconds(s){
  const a=Date.parse(s?.startedAt||''),b=Date.parse(s?.endedAt||'');
  return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?(b-a)/1000:null;
}
function checkpoints(set){
  const thresholds=Number(set?.number)===5?[5,10,12]:[8,16,21];
  const rs=arr(set?.rallies);
  return thresholds.map(t=>{
    const r=rs.find(x=>Math.max(num(x?.scoreAfter?.us),num(x?.scoreAfter?.opponent))>=t);
    return r?`${num(r.scoreAfter.us)}-${num(r.scoreAfter.opponent)}`:'·';
  });
}
function linkedMatch(m){return B()?.linkedMatch?.(m)||null}
function meta(m){
  const linked=linkedMatch(m);
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
function terminalBreakdown(m,team){
  const rr=rallies(m,team),bd=B()?.breakdown?.(rr,team)||{serve:0,attack:0,block:0,oppErr:0,total:0};
  return {...bd,rallies:rr.length,won:rr.filter(x=>x.win).length,lost:rr.filter(x=>!x.win).length};
}
function rotationStats(m,team){
  const rr=rallies(m,team);
  return Array.from({length:6},(_,i)=>{
    const no=i+1,rows=rr.filter(x=>Number(x.rotation)===no),
      k1=rows.filter(x=>x.phase==='K1'),k2=rows.filter(x=>x.phase==='K2'),
      k1w=k1.filter(x=>x.win).length,k2w=k2.filter(x=>x.win).length,won=rows.filter(x=>x.win).length;
    return {no,total:rows.length,won,lost:rows.length-won,gp:won-(rows.length-won),
      k1Total:k1.length,k1Won:k1w,k1Pct:pct(k1w,k1.length),
      k2Total:k2.length,k2Won:k2w,k2Pct:pct(k2w,k2.length)};
  });
}
function setTrend(m,team){
  return arr(m?.sets).map(s=>{
    const x=B()?.setStat?.(m,team,s.number) || {r:{total:0,posPct:null,excPct:null},a:{total:0,ptsPct:null},s:{perfect:0,error:0},b:{perfect:0}},
      rr=rallies(m,team).filter(r=>Number(r.set)===Number(s.number)),
      k1=rr.filter(r=>r.phase==='K1'),k2=rr.filter(r=>r.phase==='K2'),
      k1w=k1.filter(r=>r.win).length,k2w=k2.filter(r=>r.win).length;
    return {set:s.number,score:`${num(s.scoreUs)}-${num(s.scoreOpponent)}`,
      k1:pct(k1w,k1.length),k1n:k1.length,k2:pct(k2w,k2.length),k2n:k2.length,
      recPos:x.r.posPct,recExc:x.r.excPct,recN:x.r.total,att:x.a.ptsPct,attN:x.a.total,
      ace:x.s.perfect,serveErr:x.s.error,block:x.b.perfect};
  });
}
function contactZone(a){return String(a?.contactZone||a?.endZone||a?.startZone||'').replace(/^Z/i,'')}
function receptionZones(m,team){
  const rows=(B()?.actionRows?.(m,false)||[]).filter(a=>a.team===team&&a.skill==='R'&&contactZone(a));
  return [...new Set(rows.map(contactZone))].map(zone=>{
    const a=rows.filter(x=>contactZone(x)===zone),pos=a.filter(x=>['#','+'].includes(x.evaluation)).length,
      exc=a.filter(x=>x.evaluation==='#').length,err=a.filter(x=>x.evaluation==='=').length;
    return {zone,total:a.length,pos,exc,err,posPct:pct(pos,a.length),excPct:pct(exc,a.length),errPct:pct(err,a.length)}
  }).sort((a,b)=>b.total-a.total);
}
function serveZones(m,team){
  const rows=(B()?.actionRows?.(m,false)||[]).filter(a=>a.team===team&&a.skill==='S'&&String(a.endZone||''));
  return [...new Set(rows.map(a=>String(a.endZone)))].map(zone=>{
    const a=rows.filter(x=>String(x.endZone)===zone),ace=a.filter(x=>x.evaluation==='#').length,
      err=a.filter(x=>x.evaluation==='=').length,pressure=a.filter(x=>['#','+'].includes(x.evaluation)).length;
    return {zone,total:a.length,ace,err,pressure,acePct:pct(ace,a.length),pressurePct:pct(pressure,a.length)}
  }).sort((a,b)=>b.total-a.total);
}
function attackDirections(m,team){
  const rows=(B()?.actionRows?.(m,false)||[]).filter(a=>a.team===team&&a.skill==='A'&&(a.endZone||a.startZone));
  const key=a=>a.startZone&&a.endZone?`Z${a.startZone} > Z${a.endZone}`:(a.endZone?`> Z${a.endZone}`:`Z${a.startZone}`);
  return [...new Set(rows.map(key))].map(k=>{
    const a=rows.filter(x=>key(x)===k),pts=a.filter(x=>x.evaluation==='#').length,
      err=a.filter(x=>x.evaluation==='=').length,blq=a.filter(x=>x.evaluation==='/').length;
    return {direction:k,total:a.length,pts,err,blq,ptsPct:pct(pts,a.length),effPct:a.length?Math.round((pts-err-blq)*100/a.length):null}
  }).sort((a,b)=>b.total-a.total);
}
function distribution(m,team){
  const rows=B()?.distributionRows?.(m,team,'')||[],map=new Map();
  rows.forEach(x=>{const k=String(x.target||'Sin destino');if(!map.has(k))map.set(k,[]);map.get(k).push(x)});
  return [...map.entries()].map(([key,a])=>({key,label:B()?.comboLabel?.(key)||key,total:a.length,pct:pct(a.length,rows.length)})).sort((a,b)=>b.total-a.total);
}
function playerRows(m,team){
  const data=stats(m,team),b=B();
  return arr(data.players).map(st=>{
    const s=b?.skill?.(st,'S')||{},r=b?.reception?.(st)||{},a=b?.attack?.(st)||{},bl=b?.skill?.(st,'B')||{},
      p=b?.pointMetrics?.(m,team,st.key,data.rows)||{won:0,fp:0,gp:0};
    return {label:st.label,total:st.total,pts:p.won,fp:p.fp,gp:p.gp,serveTotal:s.total||0,ace:s.perfect||0,serveErr:s.error||0,
      recTotal:r.total||0,recErr:r.error||0,recPos:r.posPct,recExc:r.excPct,
      attTotal:a.total||0,kill:a.perfect||0,attErr:a.error||0,blocked:a.blocked||0,attPct:a.ptsPct,attGp:a.gp||0,block:bl.perfect||0};
  });
}
function dataQuality(m){
  const rs=arr(m?.sets).flatMap(s=>arr(s.rallies)),actions=rs.flatMap(r=>arr(r.actions)),coded=rs.filter(r=>arr(r.actions).length).length,issues=[];
  if(rs.length&&coded/rs.length<.7)issues.push(`Solo ${pct(coded,rs.length)}% de los rallies tienen acciones codificadas.`);
  ['ours','opponent'].forEach(team=>{
    const k1=rallies(m,team).filter(x=>x.phase==='K1'),
      withRec=k1.filter(x=>arr(x.r?.actions).some(a=>a.team===team&&a.skill==='R')).length;
    if(k1.length&&withRec/k1.length<.65)issues.push(`${teamName(team)}: recepción registrada en ${pct(withRec,k1.length)}% de los rallies K1.`);
  });
  return {rallies:rs.length,actions:actions.length,codedRallies:coded,codedPct:pct(coded,rs.length)||0,issues};
}
function bestRotation(rot,key,min=3,dir='max'){
  const rows=rot.filter(x=>Number(x[key+'Total'])>=min&&x[key+'Pct']!=null);
  if(!rows.length)return null;
  return rows.slice().sort((a,b)=>dir==='max'?b[key+'Pct']-a[key+'Pct']:a[key+'Pct']-b[key+'Pct'])[0];
}
function insights(m){
  const b=B(),ours=perf(m,'ours'),opp=perf(m,'opponent'),
    ok1=ours.rallies.filter(x=>x.phase==='K1'),ok2=ours.rallies.filter(x=>x.phase==='K2'),
    rk1=opp.rallies.filter(x=>x.phase==='K1'),rk2=opp.rallies.filter(x=>x.phase==='K2'),
    so=pct(ours.sideOut,ok1.length),bp=pct(ours.breakPoint,ok2.length),rso=pct(opp.sideOut,rk1.length),rbp=pct(opp.breakPoint,rk2.length),
    os=stats(m,'ours'),rs=stats(m,'opponent'),or=b?.reception?.(os.teamStat)||{},rr=b?.reception?.(rs.teamStat)||{},
    oa=b?.attack?.(os.teamStat)||{},ra=b?.attack?.(rs.teamStat)||{},rot=rotationStats(m,'ours'),
    bestK1=bestRotation(rot,'k1'),worstK1=bestRotation(rot,'k1',3,'min'),bestK2=bestRotation(rot,'k2'),
    players=playerRows(m,'ours'),gpLeader=players.filter(x=>x.total>=3).sort((a,b)=>b.gp-a.gp)[0],
    killLeader=players.filter(x=>x.attTotal>=3).sort((a,b)=>b.kill-a.kill)[0],
    recLeader=players.filter(x=>x.recTotal>=5).sort((a,b)=>(b.recPos||0)-(a.recPos||0))[0],
    q=dataQuality(m),out=[];
  if(so!=null&&rso!=null)out.push({kind:so>=rso?'good':'warn',tag:'K1',text:`Side-out: ${so}% (${ours.sideOut}/${ok1.length}) frente a ${rso}% del rival (${opp.sideOut}/${rk1.length}). Diferencia ${so-rso>0?'+':''}${so-rso} pp.`});
  if(bp!=null&&rbp!=null)out.push({kind:bp>=rbp?'good':'warn',tag:'K2',text:`Break point: ${bp}% (${ours.breakPoint}/${ok2.length}) frente a ${rbp}% del rival (${opp.breakPoint}/${rk2.length}). Diferencia ${bp-rbp>0?'+':''}${bp-rbp} pp.`});
  if(or.total||rr.total)out.push({kind:(or.posPct||0)>=(rr.posPct||0)?'good':'info',tag:'Recepción',text:`Recepción positiva ${or.total?or.posPct+'% ('+or.positive+'/'+or.total+')':'—'}; excelente ${or.total?or.excPct+'%':'—'}. Rival: ${rr.total?rr.posPct+'% positiva y '+rr.excPct+'% excelente':'sin muestra suficiente'}.`});
  if(oa.total||ra.total)out.push({kind:(oa.ptsPct||0)>=(ra.ptsPct||0)?'good':'warn',tag:'Ataque',text:`Ataque: ${oa.total?oa.ptsPct+'% de punto ('+oa.perfect+'/'+oa.total+')':'—'}, G-P ${oa.total?gp(oa.gp):'—'}. Rival: ${ra.total?ra.ptsPct+'%, G-P '+gp(ra.gp):'—'}.`});
  if(bestK1)out.push({kind:'good',tag:'Rotación',text:`Mejor K1 con muestra >=3: R${bestK1.no}, ${bestK1.k1Pct}% (${bestK1.k1Won}/${bestK1.k1Total}).${worstK1&&worstK1.no!==bestK1.no?` La más exigida fue R${worstK1.no}: ${worstK1.k1Pct}% (${worstK1.k1Won}/${worstK1.k1Total}).`:''}`});
  if(bestK2)out.push({kind:'info',tag:'Break',text:`Rotación con mayor conversión K2 (muestra >=3): R${bestK2.no}, ${bestK2.k2Pct}% (${bestK2.k2Won}/${bestK2.k2Total}).`});
  if(gpLeader)out.push({kind:'info',tag:'Impacto',text:`Mayor G-P individual: ${gpLeader.label}, ${gp(gpLeader.gp)}.${killLeader?` Ataque: ${killLeader.label}, ${killLeader.kill}/${killLeader.attTotal} puntos (${killLeader.attPct}%).`:''}`});
  if(recLeader)out.push({kind:'info',tag:'Recepción',text:`Mejor recepción positiva con al menos 5 intentos: ${recLeader.label}, ${recLeader.recPos}% (${recLeader.recTotal} recepciones).`});
  if(ours.positive?.total||ours.negative?.total||ours.counter?.total)out.push({kind:'info',tag:'Fases',text:`Ataque: tras recepción +/# ${ours.positive.total?ours.positive.pct+'% ('+ours.positive.pts+'/'+ours.positive.total+')':'—'}; tras recepción !/-/ ${ours.negative.total?ours.negative.pct+'% ('+ours.negative.pts+'/'+ours.negative.total+')':'—'}; contraataque ${ours.counter.total?ours.counter.pct+'% ('+ours.counter.pts+'/'+ours.counter.total+')':'—'}.`});
  out.push(q.issues.length?{kind:'warn',tag:'Muestra',text:q.issues.join(' ')}:{kind:'good',tag:'Muestra',text:`Cobertura: ${q.codedPct}% de ${q.rallies} rallies con acciones (${q.actions} acciones).`});
  return out;
}

window.VC_V750_REPORTS={
  version:VERSION,
  selectedMatch,stats,perf,meta,setDurSeconds,checkpoints,terminalBreakdown,rotationStats,setTrend,
  receptionZones,serveZones,attackDirections,distribution,playerRows,dataQuality,insights
};

/* Make the PDF buttons resolve a match through the bridge before doing anything else. */
const oldOfficial=window.scoutV752ExportOfficialPDF;
const oldAnalysis=window.scoutV752ExportAnalysisPDF;
window.scoutV754ExportOfficialPDF=function(id){
  const m=selectedMatch(id);
  if(!m){window.scoutV753ShowPDFError?.('No se ha podido crear el PDF',new Error('No hay ningún scouting seleccionado.'));return false}
  return oldOfficial?.(m.id);
};
window.scoutV754ExportAnalysisPDF=function(id){
  const m=selectedMatch(id);
  if(!m){window.scoutV753ShowPDFError?.('No se ha podido crear el PDF',new Error('No hay ningún scouting seleccionado.'));return false}
  return oldAnalysis?.(m.id);
};

/* Final aliases. */
window.scoutV752ExportOfficialPDF=window.scoutV754ExportOfficialPDF;
window.scoutV752ExportAnalysisPDF=window.scoutV754ExportAnalysisPDF;
window.scoutExportPDF=window.scoutV754ExportOfficialPDF;
window.scoutExportAnalysisPDF=window.scoutV754ExportAnalysisPDF;

const badge=document.getElementById('scout-v753-pdf-ready');
if(badge){badge.id='scout-v754-pdf-ready';badge.textContent='PDF 7.5.7 ✓';badge.title='PDF V7.5.6 cargado y conectado al puente del scouting'}

window.scoutV754PDFDiagnostics=function(){
  return {
    version:VERSION,
    bridge:!!B(),
    match: selectedMatch()?.id||null,
    reportHelpers:!!window.VC_V750_REPORTS,
    official:typeof window.scoutV754ExportOfficialPDF,
    analysis:typeof window.scoutV754ExportAnalysisPDF
  };
};
})();

/* VC20711_SOURCE_END:v754-report-bridge-fix */
;

/* VC20711_SOURCE_BEGIN:v755-match-selection-fix */

(()=>{
'use strict';

const VERSION='7.5.5';

function allMatches(){
  const lists=[];
  try{
    const x=window.VC_SCOUT_REPORT_BRIDGE?.getMatches?.();
    if(Array.isArray(x))lists.push(...x);
  }catch(_){}
  try{
    const x=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.();
    if(Array.isArray(x))lists.push(...x);
  }catch(_){}
  const map=new Map();
  lists.forEach(m=>{
    const id=Number(m?.id);
    if(id&&!map.has(id))map.set(id,m);
  });
  return [...map.values()];
}
function selectedId(explicitId){
  let id=Number(explicitId)||0;
  if(!id){
    try{id=Number(document.getElementById('scout-analysis-match')?.value)||0}catch(_){}
  }
  if(!id){
    try{id=Number(window.VC_SCOUT_REPORT_BRIDGE?.getActiveId?.())||0}catch(_){}
  }
  if(!id){
    try{id=Number(window.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.())||0}catch(_){}
  }
  return id;
}
function findSelectedMatch(explicitId){
  const list=allMatches();
  const id=selectedId(explicitId);
  if(id){
    const hit=list.find(m=>Number(m?.id)===id);
    if(hit)return hit;
  }
  if(list.length){
    return list.slice().sort((a,b)=>
      String(b?.updatedAt||b?.date||'').localeCompare(String(a?.updatedAt||a?.date||''))
      || Number(b?.id||0)-Number(a?.id||0)
    )[0];
  }
  return null;
}
function errorNoMatch(explicitId){
  const list=allMatches(),id=selectedId(explicitId);
  const select=document.getElementById('scout-analysis-match');
  const optionCount=select?.options?.length||0;
  const msg=`No se ha podido localizar el partido para exportar.
ID seleccionado: ${id||'ninguno'}
Scoutings visibles para el módulo PDF: ${list.length}
Opciones del selector de Análisis: ${optionCount}

Vuelve a Scouting > Análisis y selecciona el partido.`;
  window.scoutV753ShowPDFError?.('No se ha podido crear el PDF',new Error(msg));
}
function installReportSelector(){
  if(!window.VC_V750_REPORTS)return;
  window.VC_V750_REPORTS.selectedMatch=findSelectedMatch;
}
installReportSelector();

const nativeOfficial=window.scoutV752ExportOfficialPDF;
const nativeAnalysis=window.scoutV752ExportAnalysisPDF;

window.scoutV755ExportOfficialPDF=function(id){
  installReportSelector();
  const m=findSelectedMatch(id);
  if(!m){errorNoMatch(id);return false}
  if(typeof nativeOfficial!=='function'){
    window.scoutV753ShowPDFError?.('No se ha podido crear el PDF',new Error('El generador de hoja oficial no está cargado.'));
    return false;
  }
  return nativeOfficial(Number(m.id));
};

window.scoutV755ExportAnalysisPDF=function(id){
  installReportSelector();
  const m=findSelectedMatch(id);
  if(!m){errorNoMatch(id);return false}
  if(typeof nativeAnalysis!=='function'){
    window.scoutV753ShowPDFError?.('No se ha podido crear el PDF',new Error('El generador de análisis Pro no está cargado.'));
    return false;
  }
  return nativeAnalysis(Number(m.id));
};

window.scoutV752ExportOfficialPDF=window.scoutV755ExportOfficialPDF;
window.scoutV752ExportAnalysisPDF=window.scoutV755ExportAnalysisPDF;
window.scoutV754ExportOfficialPDF=window.scoutV755ExportOfficialPDF;
window.scoutV754ExportAnalysisPDF=window.scoutV755ExportAnalysisPDF;
window.scoutExportPDF=window.scoutV755ExportOfficialPDF;
window.scoutExportAnalysisPDF=window.scoutV755ExportAnalysisPDF;

const oldBadge=document.getElementById('scout-v754-pdf-ready')||document.getElementById('scout-v753-pdf-ready');
if(oldBadge){
  oldBadge.id='scout-v755-pdf-ready';
  oldBadge.textContent='PDF 7.5.7 ✓';
  oldBadge.title='PDF V7.5.6: selección directa desde la lista de scoutings';
}

window.scoutV755PDFDiagnostics=function(){
  const list=allMatches(),id=selectedId(),m=findSelectedMatch();
  return {
    version:VERSION,
    selectedId:id||null,
    matches:list.map(x=>({id:x.id,date:x.date,opponent:x.opponent})),
    resolvedMatch:m?{id:m.id,date:m.date,opponent:m.opponent}:null,
    selectorValue:document.getElementById('scout-analysis-match')?.value||null,
    selectorOptions:document.getElementById('scout-analysis-match')?.options?.length||0,
    reportBridge:!!window.VC_SCOUT_REPORT_BRIDGE,
    videoBridge:!!window.VC_SCOUT_VIDEO_BRIDGE,
    reports:!!window.VC_V750_REPORTS
  };
};
})();

/* VC20711_SOURCE_END:v755-match-selection-fix */
;

/* VC20711_SOURCE_BEGIN:v756-direct-pdf-route */

(()=>{
'use strict';

const VERSION='7.5.6';
const reportBridge=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const videoBridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||null;

function asArray(v){return Array.isArray(v)?v:[]}
function idEq(a,b){return String(a??'')===String(b??'')}

function collectMatches(){
  const out=[];
  const add=list=>asArray(list).forEach(m=>{
    if(!m||m.id==null)return;
    if(!out.some(x=>idEq(x.id,m.id)))out.push(m);
  });

  try{add(reportBridge()?.getMatches?.())}catch(err){console.warn('V756 report getMatches',err)}
  try{add(videoBridge()?.getMatches?.())}catch(err){console.warn('V756 video getMatches',err)}

  /* These are exported by the scouting module itself. They are fallback
     access paths, not wrappers from previous PDF versions. */
  try{
    const m=window.scoutMatchForAnalysis?.();
    if(m)add([m]);
  }catch(err){console.warn('V756 scoutMatchForAnalysis',err)}
  try{
    const m=videoBridge()?.getActive?.();
    if(m)add([m]);
  }catch(_){}

  return out;
}

function selectorId(){
  const sel=document.getElementById('scout-analysis-match');
  return sel?.value!=null&&String(sel.value)!==''?String(sel.value):'';
}
function activeId(){
  try{
    const x=reportBridge()?.getActiveId?.();
    if(x!=null&&String(x)!=='')return String(x);
  }catch(_){}
  try{
    const x=videoBridge()?.getActiveId?.();
    if(x!=null&&String(x)!=='')return String(x);
  }catch(_){}
  return '';
}

function directLookupById(id){
  if(id==null||String(id)==='')return null;

  /* First: direct list lookup. */
  const list=collectMatches();
  let hit=list.find(m=>idEq(m.id,id));
  if(hit)return hit;

  /* Second: the scouting module's exported lookup, with an EXPLICIT id. */
  try{
    hit=window.scoutExportMatch?.(id);
    if(hit&&idEq(hit.id,id))return hit;
  }catch(err){console.warn('V756 scoutExportMatch',err)}

  /* Third: bridge lookup, again with an explicit id. */
  try{
    hit=reportBridge()?.getExportMatch?.(id);
    if(hit&&idEq(hit.id,id))return hit;
  }catch(err){console.warn('V756 bridge getExportMatch',err)}

  return null;
}

function resolveMatch(explicitId){
  /* Priority 1: id explicitly provided by a saved-match button. */
  if(explicitId!=null&&String(explicitId)!==''){
    const m=directLookupById(explicitId);
    if(m)return m;
  }

  /* Priority 2: exact party visible in the Analysis dropdown. */
  const sid=selectorId();
  if(sid){
    const m=directLookupById(sid);
    if(m)return m;
  }

  /* Priority 3: active scouting. */
  const aid=activeId();
  if(aid){
    const m=directLookupById(aid);
    if(m)return m;
  }

  /* Priority 4: the analysis helper itself. */
  try{
    const m=window.scoutMatchForAnalysis?.();
    if(m)return m;
  }catch(_){}

  /* Priority 5: most recently updated saved scouting. */
  const list=collectMatches();
  if(list.length){
    return list.slice().sort((a,b)=>
      String(b?.updatedAt||b?.date||'').localeCompare(String(a?.updatedAt||a?.date||''))
      || Number(b?.id||0)-Number(a?.id||0)
    )[0];
  }
  return null;
}

function noMatchError(explicitId){
  const list=collectMatches();
  const sel=document.getElementById('scout-analysis-match');
  return new Error(
`No se ha encontrado un scouting para el PDF.
ID del botón: ${explicitId??'—'}
ID del selector de Análisis: ${selectorId()||'—'}
ID activo: ${activeId()||'—'}
Scoutings accesibles: ${list.length}
Opciones del selector: ${sel?.options?.length||0}

Si ves partidos en el desplegable pero "Scoutings accesibles" es 0, el navegador está ejecutando módulos de versiones distintas.`
  );
}

function core(){
  return window.VC_V752_PDF_CORE||null;
}

function run(kind,explicitId){
  try{
    const m=resolveMatch(explicitId);
    if(!m)throw noMatchError(explicitId);

    const c=core();
    if(!c)throw new Error('El núcleo directo del PDF (VC_V752_PDF_CORE) no está cargado.');

    if(kind==='analysis'){
      if(typeof c.exportAnalysisMatch!=='function')throw new Error('Falta exportAnalysisMatch en el núcleo PDF.');
      return c.exportAnalysisMatch(m);
    }

    if(typeof c.exportOfficialMatch!=='function')throw new Error('Falta exportOfficialMatch en el núcleo PDF.');
    return c.exportOfficialMatch(m);
  }catch(err){
    console.error(`V7.5.6 ${kind} PDF`,err);
    if(typeof window.scoutV753ShowPDFError==='function'){
      window.scoutV753ShowPDFError('No se ha podido crear el PDF',err);
    }else{
      alert(`No se ha podido crear el PDF.\n\n${err?.message||err}`);
    }
    return false;
  }
}

window.scoutV756ExportOfficialPDF=id=>run('official',id);
window.scoutV756ExportAnalysisPDF=id=>run('analysis',id);

/* Final aliases: every legacy/capture/inline route ends here. */
window.scoutV752ExportOfficialPDF=window.scoutV756ExportOfficialPDF;
window.scoutV752ExportAnalysisPDF=window.scoutV756ExportAnalysisPDF;
window.scoutV753ExportOfficialPDF=window.scoutV756ExportOfficialPDF;
window.scoutV753ExportAnalysisPDF=window.scoutV756ExportAnalysisPDF;
window.scoutV754ExportOfficialPDF=window.scoutV756ExportOfficialPDF;
window.scoutV754ExportAnalysisPDF=window.scoutV756ExportAnalysisPDF;
window.scoutV755ExportOfficialPDF=window.scoutV756ExportOfficialPDF;
window.scoutV755ExportAnalysisPDF=window.scoutV756ExportAnalysisPDF;
window.scoutExportPDF=window.scoutV756ExportOfficialPDF;
window.scoutExportAnalysisPDF=window.scoutV756ExportAnalysisPDF;

/* The V7.5.3 capture listener dynamically invokes scoutV752..., so the
   aliases above are sufficient. Rewire inline handlers too for clarity. */
function rewire(root=document){
  (root.matches?.('button')?[root,...root.querySelectorAll('button')]:root.querySelectorAll?.('button')||[]).forEach(btn=>{
    const text=String(btn.textContent||'').toLowerCase();
    const oc=String(btn.getAttribute('onclick')||'');
    if(text.includes('pdf análisis pro')||text.includes('descargar análisis pro')){
      btn.setAttribute('onclick','return scoutV756ExportAnalysisPDF()');
      return;
    }
    if(text.includes('pdf hoja')||text==='pdf'){
      const m=oc.match(/\((\d+)\)/);
      btn.setAttribute('onclick',m?`return scoutV756ExportOfficialPDF(${m[1]})`:'return scoutV756ExportOfficialPDF()');
    }
  });
}
rewire();
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&(n.matches?.('button')||n.querySelector?.('button')))rewire(n)}))).observe(document.body,{childList:true,subtree:true});

const badge=document.getElementById('scout-v755-pdf-ready')
  ||document.getElementById('scout-v754-pdf-ready')
  ||document.getElementById('scout-v753-pdf-ready');
if(badge){
  badge.id='scout-v756-pdf-ready';
  badge.textContent='PDF 7.5.7 ✓';
  badge.title='Ruta PDF directa: selector → partido → núcleo PDF';
}

window.scoutV756PDFDiagnostics=function(){
  const list=collectMatches(),m=resolveMatch();
  return {
    version:VERSION,
    selectorId:selectorId()||null,
    activeId:activeId()||null,
    accessibleMatches:list.map(x=>({id:x.id,date:x.date,opponent:x.opponent})),
    resolvedMatch:m?{id:m.id,date:m.date,opponent:m.opponent}:null,
    coreLoaded:!!core(),
    reportBridge:!!reportBridge(),
    videoBridge:!!videoBridge(),
    officialFunction:typeof window.scoutV756ExportOfficialPDF,
    analysisFunction:typeof window.scoutV756ExportAnalysisPDF
  };
};
})();

/* VC20711_SOURCE_END:v756-direct-pdf-route */
;

/* VC20711_SOURCE_BEGIN:v757-final-pdf-router */

(()=>{
'use strict';
const official=window.scoutV757ExportOfficialPDF;
const analysis=window.scoutV757ExportAnalysisPDF;

if(typeof official==='function'){
  window.scoutExportPDF=official;
  window.scoutV752ExportOfficialPDF=official;
  window.scoutV753ExportOfficialPDF=official;
  window.scoutV754ExportOfficialPDF=official;
  window.scoutV755ExportOfficialPDF=official;
  window.scoutV756ExportOfficialPDF=official;
}
if(typeof analysis==='function'){
  window.scoutExportAnalysisPDF=analysis;
  window.scoutV752ExportAnalysisPDF=analysis;
  window.scoutV753ExportAnalysisPDF=analysis;
  window.scoutV754ExportAnalysisPDF=analysis;
  window.scoutV755ExportAnalysisPDF=analysis;
  window.scoutV756ExportAnalysisPDF=analysis;
}

function rewire(root=document){
  (root.matches?.('button')?[root,...root.querySelectorAll('button')]:root.querySelectorAll?.('button')||[]).forEach(btn=>{
    const txt=String(btn.textContent||'').trim().toLowerCase(),oc=String(btn.getAttribute('onclick')||'');
    if(txt.includes('pdf análisis pro')||txt.includes('descargar análisis pro')){
      btn.setAttribute('onclick','return scoutV757ExportAnalysisPDF()');
    }else if(txt.includes('pdf hoja')||txt==='pdf'){
      const id=(oc.match(/\((\d+)\)/)||[])[1];
      btn.setAttribute('onclick',id?`return scoutV757ExportOfficialPDF(${id})`:'return scoutV757ExportOfficialPDF()');
    }
  });
}
rewire();
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&(n.matches?.('button')||n.querySelector?.('button')))rewire(n)}))).observe(document.body,{childList:true,subtree:true});

const badge=document.getElementById('scout-v756-pdf-ready')||document.getElementById('scout-v755-pdf-ready')||document.getElementById('scout-v754-pdf-ready')||document.getElementById('scout-v753-pdf-ready');
if(badge){
  badge.id='scout-v757-pdf-ready';
  badge.textContent='PDF 7.5.7 DIRECT ✓';
  badge.title='Exportadores PDF ejecutados dentro del motor de scouting';
}
window.scoutV757FinalDiagnostics=function(){
  return {
    version:'7.5.7',
    directOfficial:typeof window.scoutV757ExportOfficialPDF,
    directAnalysis:typeof window.scoutV757ExportAnalysisPDF,
    finalScoutExportPDF:window.scoutExportPDF===window.scoutV757ExportOfficialPDF,
    finalAnalysisPDF:window.scoutExportAnalysisPDF===window.scoutV757ExportAnalysisPDF,
    directDiagnostics:window.scoutV757PDFDirectDiagnostics?.()||null
  };
};
})();

/* VC20711_SOURCE_END:v757-final-pdf-router */
;
