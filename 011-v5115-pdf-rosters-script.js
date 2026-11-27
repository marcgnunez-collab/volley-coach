/* VC2078_SCOUT_REPORT_LAYOUT_BEGIN: exact V7.5.7 HTML bodies, read-only. */
;(()=>{
"use strict";
/* VC2079_SCOUT_REPORT_HELPERS_BEGIN: 26 original read-only declarations */
function v2079CreateReportHelpers(ctx){
const {scoutArr,EQUIPOS,equipoActivo,scoutActionRows,scoutPlayerKey,scoutV61010FullStats,scoutSkillMetric,esc}=ctx;
/* VC2079_HELPER_BEGIN:v757Pct */
function v757Pct(n,d){return d?Math.round((Number(n)||0)*100/(Number(d)||0)):0}
/* VC2079_HELPER_END:v757Pct */

/* VC2079_HELPER_BEGIN:v757Gp */
function v757Gp(n){n=Number(n)||0;return `${n>0?'+':''}${n}`}
/* VC2079_HELPER_END:v757Gp */

/* VC2079_HELPER_BEGIN:v757Rows */
function v757Rows(m,team){return scoutActionRows(m,false).filter(a=>a.team===team)}
/* VC2079_HELPER_END:v757Rows */

/* VC2079_HELPER_BEGIN:v757SkillRows */
function v757SkillRows(rows,skill){
  const a=rows.filter(x=>x.skill===skill),c={'#':0,'+':0,'!':0,'-':0,'/':0,'=':0};
  a.forEach(x=>c[x.evaluation]=(c[x.evaluation]||0)+1);
  const total=a.length,perfect=c['#']||0,positive=perfect+(c['+']||0),error=c['=']||0,blocked=c['/']||0;
  return {total,perfect,positive,error,blocked,posPct:v757Pct(positive,total),excPct:v757Pct(perfect,total),ptsPct:v757Pct(perfect,total),effPct:total?Math.round((perfect-error-blocked)*100/total):0};
}
/* VC2079_HELPER_END:v757SkillRows */

/* VC2079_HELPER_BEGIN:v757Impact */
function v757Impact(m,team,key=null){
  const all=scoutActionRows(m,false),scope=a=>!key||scoutPlayerKey(a)===key,groups=new Map(),gains=[],losses=[];
  all.forEach(a=>{const k=`${a.set}:${a.rallyIndex}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a)});
  groups.forEach(g=>{
    g.sort((a,b)=>(Number(a.actionIndex)||0)-(Number(b.actionIndex)||0));
    const winner=g.find(a=>a.winner)?.winner||'',mine=g.filter(a=>a.team===team);
    if(winner===team){
      const point=[...mine].reverse().find(a=>a.evaluation==='#'&&['S','A','B'].includes(a.skill));
      if(point&&scope(point))gains.push(point);
    }else if(winner&&winner!==team){
      const last=mine[mine.length-1];
      if(last&&scope(last)&&(last.evaluation==='='||(last.skill==='A'&&last.evaluation==='/')))losses.push(last);
    }
  });
  return {won:gains.length,lost:losses.length,gp:gains.length-losses.length,fp:gains.filter(a=>a.servingBefore===team).length};
}
/* VC2079_HELPER_END:v757Impact */

/* VC2079_HELPER_BEGIN:v757PlayerStats */
function v757PlayerStats(m,team){
  /* V9.6.1: player rows and team totals share the same CLOSED-rally dataset. */
  const data=scoutV61010FullStats(m,team,false);
  return data.players.map(st=>{
    const s=scoutSkillMetric(st,'S'),r=scoutSkillMetric(st,'R'),a=scoutSkillMetric(st,'A'),b=scoutSkillMetric(st,'B'),d=scoutSkillMetric(st,'D'),e=scoutSkillMetric(st,'E'),p=v757Impact(m,team,st.key);
    return {...st,_s:s,_r:r,_a:a,_b:b,_d:d,_e:e,_p:p};
  });
}
/* VC2079_HELPER_END:v757PlayerStats */

/* VC2079_HELPER_BEGIN:v757PhaseAttack */
function v757PhaseAttack(seqRows,kind){
  let rows=[];
  if(kind==='positive')rows=seqRows.filter(x=>x.phase==='K1'&&['#','+'].includes(x.receptionEval)&&x.attackEval);
  if(kind==='negative')rows=seqRows.filter(x=>x.phase==='K1'&&!['#','+'].includes(x.receptionEval)&&x.attackEval);
  if(kind==='counter')rows=seqRows.filter(x=>x.phase==='K2'&&x.attackEval);
  const pts=rows.filter(x=>x.attackEval==='#').length,err=rows.filter(x=>x.attackEval==='=').length,blq=rows.filter(x=>x.attackEval==='/').length;
  return {total:rows.length,pts,err,blq,pct:v757Pct(pts,rows.length),eff:rows.length?Math.round((pts-err-blq)*100/rows.length):0};
}
/* VC2079_HELPER_END:v757PhaseAttack */

/* VC2079_HELPER_BEGIN:v757SetStats */
function v757SetStats(m,team,setNo){
  const rows=v757Rows(m,team).filter(a=>Number(a.set)===Number(setNo));
  return {s:v757SkillRows(rows,'S'),r:v757SkillRows(rows,'R'),a:v757SkillRows(rows,'A'),b:v757SkillRows(rows,'B')};
}
/* VC2079_HELPER_END:v757SetStats */

/* VC2079_HELPER_BEGIN:v757Safe */
function v757Safe(v){return esc(String(v??''))}
/* VC2079_HELPER_END:v757Safe */

/* VC2079_HELPER_BEGIN:v757TableTeam */
function v757TableTeam(m,team){
  const name=team==='ours'?EQUIPOS[equipoActivo].nombre:(m.opponent||'Rival'),players=v757PlayerStats(m,team),rows=v757Rows(m,team),tot=v757Impact(m,team),
    ts=v757SkillRows(rows,'S'),tr=v757SkillRows(rows,'R'),ta=v757SkillRows(rows,'A'),tb=v757SkillRows(rows,'B');
  const body=players.map(st=>`<tr>
    <td class="name">${v757Safe(st.label)}</td>
    <td>${st._p.won||'·'}</td><td>${st._p.fp||'·'}</td><td class="gp">${v757Gp(st._p.gp)}</td>
    <td>${st._s.total||'·'}</td><td>${st._s.total?st._s.error:'·'}</td><td>${st._s.total?st._s.perfect:'·'}</td>
    <td>${st._r.total||'·'}</td><td>${st._r.total?st._r.error:'·'}</td><td>${st._r.total?st._r.posPct+'%':'·'}</td><td>${st._r.total?'('+st._r.perfPct+'%)':'·'}</td>
    <td>${st._a.total||'·'}</td><td>${st._a.total?st._a.error:'·'}</td><td>${st._a.total?st._a.veryNegative:'·'}</td><td>${st._a.total?st._a.perfect:'·'}</td><td>${st._a.total?st._a.perfPct+'%':'·'}</td>
    <td>${st._b.total?st._b.perfect:'·'}</td>
  </tr>`).join('');
  const sets=scoutArr(m.sets).map(set=>{
    const x=v757SetStats(m,team,set.number);
    const sr=scoutArr(set.rallies),won=sr.filter(r=>r.winner===team);
    const serve=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='S'&&a.evaluation==='#')).length;
    const attack=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='A'&&a.evaluation==='#')).length;
    const block=won.filter(r=>scoutArr(r.actions).some(a=>a.team===team&&a.skill==='B'&&a.evaluation==='#')).length;
    const oppErr=Math.max(0,won.length-serve-attack-block);
    return `<tr><td><b>Set ${set.number}</b></td><td>${serve||'·'}</td><td>${attack||'·'}</td><td>${block||'·'}</td><td>${oppErr||'·'}</td><td>${x.s.total||'·'}</td><td>${x.s.error||'·'}</td><td>${x.s.perfect||'·'}</td><td>${x.r.total||'·'}</td><td>${x.r.error||'·'}</td><td>${x.r.total?x.r.posPct+'%':'·'}</td><td>${x.r.total?'('+x.r.excPct+'%)':'·'}</td><td>${x.a.total||'·'}</td><td>${x.a.error||'·'}</td><td>${x.a.blocked||'·'}</td><td>${x.a.perfect||'·'}</td><td>${x.a.total?x.a.ptsPct+'%':'·'}</td><td>${x.b.perfect||'·'}</td></tr>`;
  }).join('');
  return `<section class="v757-team"><h2>${v757Safe(name)}</h2>
  <table><thead><tr><th rowspan="2" class="name">Jugador</th><th colspan="3">Puntos</th><th colspan="3">Saque</th><th colspan="4">Recepción</th><th colspan="5">Ataque</th><th>BLQ</th></tr>
  <tr><th>Tot</th><th>FP</th><th>G-P</th><th>Tot</th><th>Err</th><th>Pts</th><th>Tot</th><th>Err</th><th>Pos%</th><th>Exc%</th><th>Tot</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>Pts</th></tr></thead>
  <tbody>${body}<tr class="total"><td class="name">Totales jugadores</td><td>${tot.won}</td><td>${tot.fp}</td><td class="gp">${v757Gp(tot.gp)}</td><td>${ts.total}</td><td>${ts.error}</td><td>${ts.perfect}</td><td>${tr.total}</td><td>${tr.error}</td><td>${tr.total?tr.posPct+'%':'·'}</td><td>${tr.total?'('+tr.excPct+'%)':'·'}</td><td>${ta.total}</td><td>${ta.error}</td><td>${ta.blocked}</td><td>${ta.perfect}</td><td>${ta.total?ta.ptsPct+'%':'·'}</td><td>${tb.perfect}</td></tr></tbody></table>
  <table class="sets"><thead><tr><th></th><th>Saq</th><th>Att</th><th>BLQ</th><th>Er.Ad.</th><th>Saq T</th><th>Err</th><th>Pts</th><th>Rec T</th><th>Err</th><th>Pos%</th><th>Exc%</th><th>Atq T</th><th>Err</th><th>Blq</th><th>Pts</th><th>Pts%</th><th>BLQ</th></tr></thead><tbody>${sets}</tbody></table>
  </section>`;
}
/* VC2079_HELPER_END:v757TableTeam */

/* VC2079_HELPER_BEGIN:v890PdfRows */
function v890PdfRows(m,team,skill){return scoutActionRows(m,false).filter(a=>a.team===team&&(!skill||a.skill===skill))}
/* VC2079_HELPER_END:v890PdfRows */

/* VC2079_HELPER_BEGIN:v890PdfPct */
function v890PdfPct(n,d){return d?Math.round(Number(n||0)*100/d):0}
/* VC2079_HELPER_END:v890PdfPct */

/* VC2079_HELPER_BEGIN:v890PdfTop */
function v890PdfTop(rows,getter){
  const map=new Map();rows.forEach(a=>{const k=String(getter(a)||'').trim();if(k)map.set(k,(map.get(k)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
}
/* VC2079_HELPER_END:v890PdfTop */

/* VC2079_HELPER_BEGIN:v890PdfOutcome */
function v890PdfOutcome(rows){
  const pts=rows.filter(a=>a.evaluation==='#').length,err=rows.filter(a=>a.evaluation==='=').length,blk=rows.filter(a=>a.evaluation==='/').length;
  return {pts,err,blk,kill:v890PdfPct(pts,rows.length),eff:rows.length?Math.round((pts-err-blk)*100/rows.length):0};
}
/* VC2079_HELPER_END:v890PdfOutcome */

/* VC2079_HELPER_BEGIN:v890PdfRecSubtype */
function v890PdfRecSubtype(m,team){
  const rows=v890PdfRows(m,team,'R'),labels={L:'On left',R:'On right',LOW:'Low',OH:'Overhand',MID:'Middle line','':'Sin tipo'};
  return ['L','R','LOW','OH','MID',''].map(k=>{
    const rr=rows.filter(a=>String(a.skillSubtype||'')===k),pos=rr.filter(a=>['#','+'].includes(a.evaluation)).length,
      exc=rr.filter(a=>a.evaluation==='#').length,err=rr.filter(a=>a.evaluation==='=').length,so=rr.filter(a=>a.winner===team).length;
    return {key:k,label:labels[k],total:rr.length,pos:v890PdfPct(pos,rr.length),exc:v890PdfPct(exc,rr.length),err,so:v890PdfPct(so,rr.length),
      contact:v890PdfTop(rr,a=>a.contactZone||a.endZone||a.startZone),source:v890PdfTop(rr,a=>a.dvStartZone)};
  }).filter(x=>x.total);
}
/* VC2079_HELPER_END:v890PdfRecSubtype */

/* VC2079_HELPER_BEGIN:v890PdfSetTempo */
function v890PdfSetTempo(m,team){
  const rows=v890PdfRows(m,team,'E'),labs={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other','':'Sin tempo'};
  return ['Q','U','T','M','H','O',''].map(k=>{
    const rr=rows.filter(a=>String(a.setTempo||'')===k),good=rr.filter(a=>['#','+'].includes(a.evaluation)).length,bad=rr.filter(a=>['-','/','='].includes(a.evaluation)).length;
    return {key:k,label:k?`${k} · ${labs[k]}`:labs[k],total:rr.length,use:v890PdfPct(rr.length,rows.length),gp:good-bad,
      call:v890PdfTop(rr,a=>a.setterCall),target:v890PdfTop(rr,a=>a.setTarget),type:v890PdfTop(rr,a=>a.dvSetType)};
  }).filter(x=>x.total);
}
/* VC2079_HELPER_END:v890PdfSetTempo */

/* VC2079_HELPER_BEGIN:v890PdfAttackTempo */
function v890PdfAttackTempo(m,team){
  const rows=v890PdfRows(m,team,'A'),labs={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other','':'Sin tempo'};
  return ['Q','U','T','M','H','O',''].map(k=>{
    const rr=rows.filter(a=>String(a.attackTempo||'')===k),o=v890PdfOutcome(rr);
    return {key:k,label:k?`${k} · ${labs[k]}`:labs[k],total:rr.length,use:v890PdfPct(rr.length,rows.length),...o,
      code:v890PdfTop(rr,a=>a.attackCode),sub:v890PdfTop(rr,a=>a.skillSubtype),dest:v890PdfTop(rr,a=>a.endCone?`C${a.endCone}`:(a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone))};
  }).filter(x=>x.total);
}
/* VC2079_HELPER_END:v890PdfAttackTempo */

/* VC2079_HELPER_BEGIN:v890PdfAttackCodes */
function v890PdfAttackCodes(m,team){
  const rows=v890PdfRows(m,team,'A'),map=new Map();rows.forEach(a=>{const k=String(a.attackCode||'Sin code');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890PdfPct(rr.length,rows.length),...v890PdfOutcome(rr),
    tempo:v890PdfTop(rr,a=>a.attackTempo),sub:v890PdfTop(rr,a=>a.skillSubtype),dest:v890PdfTop(rr,a=>a.endCone?`C${a.endCone}`:(a.startZone&&a.endZone?`${a.startZone}→${a.endZone}`:a.endZone))})).sort((a,b)=>b.total-a.total);
}
/* VC2079_HELPER_END:v890PdfAttackCodes */

/* VC2079_HELPER_BEGIN:v890PdfSimpleGroups */
function v890PdfSimpleGroups(m,team,skill,field){
  const rows=v890PdfRows(m,team,skill),map=new Map();rows.forEach(a=>{const k=String(a?.[field]||'Sin dato');if(!map.has(k))map.set(k,[]);map.get(k).push(a)});
  return [...map.entries()].map(([key,rr])=>({key,total:rr.length,use:v890PdfPct(rr.length,rows.length),...v890PdfOutcome(rr)})).sort((a,b)=>b.total-a.total);
}
/* VC2079_HELPER_END:v890PdfSimpleGroups */

/* VC2079_HELPER_BEGIN:v961Rows */
function v961Rows(m,team,skill=''){return scoutActionRows(m,false).filter(a=>a.team===team&&(!skill||a.skill===skill))}
/* VC2079_HELPER_END:v961Rows */

/* VC2079_HELPER_BEGIN:v961Pct */
function v961Pct(n,d){return d?Math.round(Number(n||0)*100/Number(d||0)):0}
/* VC2079_HELPER_END:v961Pct */

/* VC2079_HELPER_BEGIN:v961Group */
function v961Group(rows,getter){
  const map=new Map();scoutArr(rows).forEach(a=>{const key=String(getter(a)||'').trim()||'Sin dato';if(!map.has(key))map.set(key,[]);map.get(key).push(a)});
  return [...map.entries()].map(([key,rr])=>{const pts=rr.filter(a=>a.evaluation==='#').length,err=rr.filter(a=>a.evaluation==='=').length,blk=rr.filter(a=>a.evaluation==='/').length;return {key,total:rr.length,pct:v961Pct(rr.length,rows.length),pts,err,blk,eff:rr.length?Math.round((pts-err-blk)*100/rr.length):0}}).sort((a,b)=>b.total-a.total)
}
/* VC2079_HELPER_END:v961Group */

/* VC2079_HELPER_BEGIN:v961Coverage */
function v961Coverage(m,team){
  const all=v961Rows(m,team),spec=[
    ['Código visible',all,a=>a.code],['Jugador identificado',all,a=>a.playerId||a.playerLabel||a.playerNameSnapshot],['Zona/contacto',all,a=>a.contactZone||a.startZone||a.endZone],['Coordenadas exactas',all,a=>a.startCoordinate||a.endCoordinate||a.contactCoordinate],['Fase VC',all,a=>a.phase],['Fase DataVolley',all,a=>a.dvPhase||a.dvPointPhase||a.dvAttackPhase],
    ['Recepción subtype',all.filter(a=>a.skill==='R'),a=>a.skillSubtype],['Saque recibido',all.filter(a=>a.skill==='R'),a=>a.receivedServeType],['Origen recepción DV',all.filter(a=>a.skill==='R'),a=>a.dvStartZone],
    ['Setter call',all.filter(a=>a.skill==='E'),a=>a.setterCall],['Tempo colocación',all.filter(a=>a.skill==='E'),a=>a.setTempo],['Set type',all.filter(a=>a.skill==='E'),a=>a.dvSetType],['Gesto colocación',all.filter(a=>a.skill==='E'),a=>a.skillSubtype],
    ['Attack code',all.filter(a=>a.skill==='A'),a=>a.attackCode],['Tempo ataque',all.filter(a=>a.skill==='A'),a=>a.attackTempo],['Tipo ataque',all.filter(a=>a.skill==='A'),a=>a.skillSubtype],['Dirección ataque',all.filter(a=>a.skill==='A'),a=>a.attackDirection],['Destino zona/cono',all.filter(a=>a.skill==='A'),a=>a.endCone||a.dvEndCone||a.dvEndSubzone||a.endZone],
    ['Bloqueo subtype',all.filter(a=>a.skill==='B'),a=>a.skillSubtype],['Tamaño bloqueo',all.filter(a=>a.skill==='B'),a=>a.blockers],['Atacante objetivo',all.filter(a=>a.skill==='B'),a=>a.blockTargetNumber||a.blockTargetLabel],['Vídeo enlazado',all,a=>a.videoTime!=null||a.videoAction!=null||a.videoStart!=null]
  ];
  return spec.map(([label,rows,getter])=>{const total=rows.length,coded=rows.filter(a=>!!getter(a)).length;return {label,total,coded,pct:v961Pct(coded,total)}})
}
/* VC2079_HELPER_END:v961Coverage */

/* VC2079_HELPER_BEGIN:v961Integrity */
function v961Integrity(m){
  const closed=scoutActionRows(m,false),all=scoutActionRows(m,true),live=all.filter(a=>a.live),issues=[];
  const rawClosed=scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s?.rallies).reduce((x,r)=>x+scoutArr(r?.actions).length,0),0);
  if(closed.length!==rawClosed)issues.push(`Acciones cerradas: filas ${closed.length} ≠ datos ${rawClosed}.`);
  ['ours','opponent'].forEach(team=>{const rows=closed.filter(a=>a.team===team),data=scoutV61010FullStats(m,team,false),playerTotal=data.players.reduce((n,p)=>n+Number(p.total||0),0);if(data.rows.length!==rows.length)issues.push(`${team}: motor análisis ${data.rows.length} ≠ filas ${rows.length}.`);if(playerTotal!==rows.length)issues.push(`${team}: suma jugadores ${playerTotal} ≠ filas ${rows.length}.`)});
  const ids=closed.map(a=>String(a.uid||a.id||'')).filter(Boolean),duplicates=ids.length-new Set(ids).size;if(duplicates)issues.push(`${duplicates} identificadores de acción duplicados.`);
  const invalid=closed.filter(a=>!['ours','opponent'].includes(a.team)||!['S','R','E','A','B','D','F','C'].includes(a.skill)||!['#','+','!','-','/','='].includes(a.evaluation));if(invalid.length)issues.push(`${invalid.length} acciones con team/skill/evaluation inválido.`);
  return {closedActions:closed.length,liveActions:live.length,rallies:scoutArr(m?.sets).reduce((n,s)=>n+scoutArr(s?.rallies).length,0),issues,ok:issues.length===0,ours:v961Coverage(m,'ours'),opponent:v961Coverage(m,'opponent')}
}
/* VC2079_HELPER_END:v961Integrity */

/* VC2079_HELPER_BEGIN:v961CoverageTable */
function v961CoverageTable(rows){return `<table class="tbl"><thead><tr><th>Campo</th><th>Cod.</th><th>Tot</th><th>Cobertura</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.coded}</td><td>${x.total}</td><td>${x.total?x.pct+'%':'—'}</td></tr>`).join('')}</tbody></table>`}
/* VC2079_HELPER_END:v961CoverageTable */

/* VC2079_HELPER_BEGIN:v961GroupTable */
function v961GroupTable(rows,label){return `<table class="tbl"><thead><tr><th>${v757Safe(label)}</th><th>Tot</th><th>Uso</th><th>Pts</th><th>Err</th><th>Blq</th><th>EFF</th></tr></thead><tbody>${rows.slice(0,12).map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.pct}%</td><td>${x.pts}</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td></tr>`).join('')||'<tr><td colspan="7">Sin datos codificados.</td></tr>'}</tbody></table>`}
/* VC2079_HELPER_END:v961GroupTable */
return {v757Pct,v757Gp,v757Rows,v757SkillRows,v757Impact,v757PlayerStats,v757PhaseAttack,v757SetStats,v757Safe,v757TableTeam,v890PdfRows,v890PdfPct,v890PdfTop,v890PdfOutcome,v890PdfRecSubtype,v890PdfSetTempo,v890PdfAttackTempo,v890PdfAttackCodes,v890PdfSimpleGroups,v961Rows,v961Pct,v961Group,v961Coverage,v961Integrity,v961CoverageTable,v961GroupTable};
}
/* VC2079_SCOUT_REPORT_HELPERS_END */
/* VC2078_FN_BEGIN:v757OfficialHTML */
function v757OfficialHTML(m,ctx){const {scoutAnalysis,scoutSetsScore,scoutSequenceSummary,scoutArr,scoutDistributionRows,v757Safe,v757TableTeam,v757Gp,v757Rows,v757SkillRows,v757Pct,v757PhaseAttack,v757PlayerStats,v757SetStats,v961Group,v961Rows,v961GroupTable,v961CoverageTable,v961Integrity,v890PdfSimpleGroups,v890PdfRecSubtype,v890PdfSetTempo,v890PdfAttackTempo,v890PdfAttackCodes,EQUIPOS,equipoActivo}={...ctx,...v2079CreateReportHelpers(ctx)};

  const score=scoutSetsScore(m),a=scoutAnalysis(m),ours=scoutSequenceSummary(m,'ours'),opp=scoutSequenceSummary(m,'opponent'),
    op=v757PhaseAttack(ours.rows,'positive'),on=v757PhaseAttack(ours.rows,'negative'),oc=v757PhaseAttack(ours.rows,'counter'),
    rp=v757PhaseAttack(opp.rows,'positive'),rn=v757PhaseAttack(opp.rows,'negative'),rc=v757PhaseAttack(opp.rows,'counter');
  return `<div class="v757-report official"><style>
    .v757-report{box-sizing:border-box;width:1180px;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;padding:24px;font-size:9px}
    .v757-head{display:grid;grid-template-columns:1fr 430px;gap:12px}.v757-title h1{font-size:24px;margin:0 0 4px}.v757-title .report{font-size:18px;font-weight:900;border-top:1px solid #555;padding-top:8px;margin-top:12px}
    .v757-info{border:1px solid #555;padding:8px;margin-top:8px;display:grid;grid-template-columns:85px 1fr 85px 1fr;gap:4px 7px}.v757-score{border:1px solid #555}.v757-score .team{display:flex;justify-content:space-between;padding:7px 9px;font-size:15px;font-weight:900;border-bottom:1px solid #aaa}
    .v757-score table,.v757-team table,.phase table{width:100%;border-collapse:collapse;table-layout:fixed}.v757-score th,.v757-score td,.v757-team th,.v757-team td,.phase th,.phase td{border:1px solid #aaa;padding:2.4px;text-align:center}
    .v757-score th,.v757-team th,.phase th{background:#e4e6e7;font-weight:900}.v757-team{border:1px solid #555;margin-top:7px}.v757-team h2{margin:0;padding:4px 6px;background:#d8dadb;font-size:13px}.v757-team table{font-size:7px}.v757-team .name{text-align:left;width:185px;overflow:hidden}.v757-team .total td{font-weight:900;background:#e4e6e7}.v757-team .sets{margin-top:3px;font-size:6.7px}.gp{font-weight:900}
    .phase{display:grid;grid-template-columns:150px 1fr 150px;gap:5px;margin-top:7px}.side,.center{border:1px solid #555;padding:6px}.side h3,.center h3{text-align:center;font-size:9px;margin:0 0 5px}.side .kv{display:grid;grid-template-columns:1fr auto;gap:3px}.rot{display:grid;grid-template-columns:1fr 1fr;margin-top:5px}.rot span{border:1px solid #ccc;padding:2px;display:flex;justify-content:space-between}.phase table{font-size:7px}
    .legend{border:1px solid #777;margin-top:7px;padding:5px;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;font-size:6.5px}.foot{margin-top:5px;font-size:6.5px;color:#666;display:flex;justify-content:space-between}
  </style>
  <div class="v757-head"><div class="v757-title"><h1>${v757Safe(m.competition||'Volley Coach · Informe de partido')}</h1><div>${v757Safe(m.date||'')} ${m.venue?'· '+v757Safe(m.venue):''}</div><div class="report">Informe</div><div class="v757-info"><b>Partido</b><span>VC-${m.id}</span><b>Fecha</b><span>${v757Safe(m.date||'—')}</span><b>Rival</b><span>${v757Safe(m.opponent||'Rival')}</span><b>Estado</b><span>${m.status==='finished'?'Finalizado':'Guardado'}</span></div></div>
  <div class="v757-score"><div class="team"><span>${v757Safe(EQUIPOS[equipoActivo].nombre)}</span><b>${score.us}</b></div><div class="team"><span>${v757Safe(m.opponent||'Rival')}</span><b>${score.opponent}</b></div>
  <table><thead><tr><th>Set</th><th>Marcador</th><th>Ganador</th></tr></thead><tbody>${scoutArr(m.sets).map(s=>`<tr><td>${s.number}</td><td><b>${s.scoreUs}-${s.scoreOpponent}</b></td><td>${s.finished?(s.winner==='ours'?v757Safe(EQUIPOS[equipoActivo].nombre):v757Safe(m.opponent||'Rival')):'—'}</td></tr>`).join('')}</tbody></table></div></div>
  ${v757TableTeam(m,'ours')}${v757TableTeam(m,'opponent')}
  <div class="phase"><div class="side"><h3>${v757Safe(EQUIPOS[equipoActivo].nombre)}</h3><div class="kv"><span>Recepciones</span><b>${ours.k1.length}</b><span>Puntos SO</span><b>${ours.k1Won}</b><span>Cada</span><b>${ours.k1Won?(ours.k1.length/ours.k1Won).toFixed(2):'·'}</b><span>Saques</span><b>${ours.k2.length}</b><span>Puntos FP</span><b>${ours.k2Won}</b></div><div class="rot">${a.rotations.map(r=>`<span><i>R${r.no}</i><b>${r.total?v757Gp(r.won-(r.total-r.won)):'·'}</b></span>`).join('')}</div></div>
  <div class="center"><h3>CAMBIO DE SAQUE / FASE PUNTO</h3><table><thead><tr><th>Situación</th><th colspan="4">${v757Safe(EQUIPOS[equipoActivo].nombre)}</th><th colspan="4">${v757Safe(m.opponent||'Rival')}</th></tr><tr><th></th><th>Tot</th><th>Pts</th><th>Err/Blq</th><th>Pts%</th><th>Tot</th><th>Pts</th><th>Err/Blq</th><th>Pts%</th></tr></thead><tbody>
  <tr><td>1er ataque tras REC +/#</td><td>${op.total}</td><td>${op.pts}</td><td>${op.err}/${op.blq}</td><td>${op.pct}%</td><td>${rp.total}</td><td>${rp.pts}</td><td>${rp.err}/${rp.blq}</td><td>${rp.pct}%</td></tr>
  <tr><td>1er ataque tras REC negativa</td><td>${on.total}</td><td>${on.pts}</td><td>${on.err}/${on.blq}</td><td>${on.pct}%</td><td>${rn.total}</td><td>${rn.pts}</td><td>${rn.err}/${rn.blq}</td><td>${rn.pct}%</td></tr>
  <tr><td>Contraataque (K2)</td><td>${oc.total}</td><td>${oc.pts}</td><td>${oc.err}/${oc.blq}</td><td>${oc.pct}%</td><td>${rc.total}</td><td>${rc.pts}</td><td>${rc.err}/${rc.blq}</td><td>${rc.pct}%</td></tr></tbody></table></div>
  <div class="side"><h3>${v757Safe(m.opponent||'Rival')}</h3><div class="kv"><span>Recepciones</span><b>${opp.k1.length}</b><span>Puntos SO</span><b>${opp.k1Won}</b><span>Cada</span><b>${opp.k1Won?(opp.k1.length/opp.k1Won).toFixed(2):'·'}</b><span>Saques</span><b>${opp.k2.length}</b><span>Puntos FP</span><b>${opp.k2Won}</b></div><div class="rot">${a.opponentRotations.map(r=>`<span><i>R${r.no}</i><b>${r.total?v757Gp(r.won-(r.total-r.won)):'·'}</b></span>`).join('')}</div></div></div>
  <div class="legend"><span><b>FP</b> Fase punto</span><span><b>G-P</b> Ganados - perdidos</span><span><b>Pos%</b> Recepción +/#</span><span><b>Exc%</b> Recepción #</span><span><b>Pts%</b> Puntos / intentos</span></div>
  <div class="foot"><span>Volley Coach V7.5.7 · Hoja estadística</span><span>Datos calculados desde las acciones registradas.</span></div></div>`;
}
/* VC2078_FN_END:v757OfficialHTML */
/* VC2078_FN_BEGIN:v757ProPages */
function v757ProPages(m,ctx){const {scoutAnalysis,scoutSetsScore,scoutSequenceSummary,scoutArr,scoutDistributionRows,v757Safe,v757TableTeam,v757Gp,v757Rows,v757SkillRows,v757Pct,v757PhaseAttack,v757PlayerStats,v757SetStats,v961Group,v961Rows,v961GroupTable,v961CoverageTable,v961Integrity,v890PdfSimpleGroups,v890PdfRecSubtype,v890PdfSetTempo,v890PdfAttackTempo,v890PdfAttackCodes,EQUIPOS,equipoActivo}={...ctx,...v2079CreateReportHelpers(ctx)};

  const a=scoutAnalysis(m),score=scoutSetsScore(m),ours=v757Rows(m,'ours'),rival=v757Rows(m,'opponent'),
    os=v757SkillRows(ours,'S'),or=v757SkillRows(ours,'R'),oa=v757SkillRows(ours,'A'),ob=v757SkillRows(ours,'B'),
    rs=v757SkillRows(rival,'S'),rr=v757SkillRows(rival,'R'),ra=v757SkillRows(rival,'A'),rb=v757SkillRows(rival,'B'),
    seqO=scoutSequenceSummary(m,'ours'),seqR=scoutSequenceSummary(m,'opponent'),
    po=v757PlayerStats(m,'ours'),pr=v757PlayerStats(m,'opponent');
  const best=[...a.rotations].filter(r=>r.total>=3).sort((x,y)=>(y.won/y.total)-(x.won/x.total))[0];
  const worst=[...a.rotations].filter(r=>r.total>=3).sort((x,y)=>(x.won/x.total)-(y.won/y.total))[0];
  const leader=[...po].filter(x=>x.total>=3).sort((x,y)=>y._p.gp-x._p.gp)[0];
  const insights=[
    `Side-out: ${a.sideTotal?a.sidePct+'% ('+a.sideWon+'/'+a.sideTotal+')':'sin muestra suficiente'}.`,
    `Break point: ${a.breakTotal?a.breakPct+'% ('+a.breakWon+'/'+a.breakTotal+')':'sin muestra suficiente'}.`,
    `Recepción propia: ${or.total?or.posPct+'% positiva y '+or.perfPct+'% perfecta sobre '+or.total:'sin datos'}. Rival: ${rr.total?rr.posPct+'% positiva sobre '+rr.total:'sin datos'}.`,
    `Ataque propio: ${oa.total?oa.perfPct+'% de punto, EFF '+oa.effPct+'% ('+oa.perfect+'/'+oa.total+')':'sin datos'}. Rival: ${ra.total?ra.perfPct+'% de punto, EFF '+ra.effPct+'%':'sin datos'}.`,
    best?`Rotación más eficaz con muestra ≥3: R${best.no}, ${v757Pct(best.won,best.total)}% (${best.won}/${best.total}).`:'No hay ninguna rotación con muestra mínima de 3 rallies.',
    worst&&best&&worst.no!==best.no?`Rotación más exigida: R${worst.no}, ${v757Pct(worst.won,worst.total)}% (${worst.won}/${worst.total}).`:'',
    leader?`Mayor G-P individual: ${leader.label}, ${v757Gp(leader._p.gp)}.`:''
  ].filter(Boolean);
  const common=`<style>.v757-pro{box-sizing:border-box;width:1120px;min-height:1500px;background:#fff;color:#17324d;font-family:Arial,Helvetica,sans-serif;padding:42px}.head{display:flex;justify-content:space-between;border-bottom:4px solid #102b43;padding-bottom:14px}.head h1{font-size:28px;margin:4px 0}.k{font-size:9px;font-weight:900;letter-spacing:.12em;color:#718394}.score{text-align:right}.score b{display:block;font-size:28px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.card{border:1px solid #dfe5e9;background:#f8fafb;padding:12px}.card span{display:block;font-size:8px;text-transform:uppercase;color:#72818d;font-weight:900}.card b{display:block;font-size:21px;margin:4px 0}.card small{font-size:8px;color:#7d8993}h2{font-size:16px;border-bottom:2px solid #294d69;padding-bottom:6px;margin-top:20px}.tbl{width:100%;border-collapse:collapse;font-size:9px}.tbl th,.tbl td{border-bottom:1px solid #e2e7ea;padding:6px;text-align:center}.tbl th{background:#edf2f5;font-size:8px}.tbl th:first-child,.tbl td:first-child{text-align:left}.ins{display:grid;gap:7px}.ins div{border:1px solid #dfe5e9;border-left:4px solid #597b95;padding:9px;background:#fafbfc;font-size:10px}.twocol{display:grid;grid-template-columns:1fr 1fr;gap:12px}.foot{margin-top:25px;border-top:1px solid #dfe5e9;padding-top:7px;color:#788793;font-size:8px;display:flex;justify-content:space-between}</style>`;
  const totalPages=7;
  const head=(title,page)=>`<div class="head"><div><div class="k">VOLLEY COACH · PROFESSIONAL MATCH REPORT · V8.9</div><h1>${v757Safe(title)}</h1><div>${v757Safe(EQUIPOS[equipoActivo].nombre)} vs ${v757Safe(m.opponent||'Rival')} · ${v757Safe(m.date||'')}</div></div><div class="score"><b>${score.us}-${score.opponent}</b><span>${page}/${totalPages}</span></div></div>`;
  const playerTable=(list)=>`<table class="tbl"><thead><tr><th>Jugador</th><th>PTS</th><th>FP</th><th>G-P</th><th>SAQ #/=</th><th>REC</th><th>POS%</th><th>EXC%</th><th>ATQ</th><th>PTS</th><th>EFF%</th><th>BLQ</th></tr></thead><tbody>${list.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x._p.won}</td><td>${x._p.fp}</td><td><b>${v757Gp(x._p.gp)}</b></td><td>${x._s.perfect}/${x._s.error}</td><td>${x._r.total||'·'}</td><td>${x._r.total?x._r.posPct+'%':'·'}</td><td>${x._r.total?x._r.perfPct+'%':'·'}</td><td>${x._a.total||'·'}</td><td>${x._a.perfect||'·'}</td><td>${x._a.total?x._a.effPct+'%':'·'}</td><td>${x._b.perfect||'·'}</td></tr>`).join('')}</tbody></table>`;
  const rotTable=(rot)=>`<table class="tbl"><thead><tr><th>Rot.</th><th>Rallies</th><th>Ganados</th><th>Global%</th><th>Side-out</th><th>Break</th></tr></thead><tbody>${rot.map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.total}</td><td>${r.won}</td><td>${r.total?v757Pct(r.won,r.total)+'%':'·'}</td><td>${r.sideTotal?v757Pct(r.sideWon,r.sideTotal)+'% ('+r.sideWon+'/'+r.sideTotal+')':'·'}</td><td>${r.breakTotal?v757Pct(r.breakWon,r.breakTotal)+'% ('+r.breakWon+'/'+r.breakTotal+')':'·'}</td></tr>`).join('')}</tbody></table>`;
  const page1=`<div class="v757-pro">${common}${head('Informe técnico del partido',1)}<div class="cards">
  <div class="card"><span>K1 Side-out</span><b>${a.sideTotal?a.sidePct+'%':'—'}</b><small>${a.sideWon}/${a.sideTotal}</small></div>
  <div class="card"><span>K2 Break</span><b>${a.breakTotal?a.breakPct+'%':'—'}</b><small>${a.breakWon}/${a.breakTotal}</small></div>
  <div class="card"><span>Recepción +/#</span><b>${or.total?or.posPct+'%':'—'}</b><small>${or.total} recepciones · Exc ${or.total?or.perfPct+'%':'—'}</small></div>
  <div class="card"><span>Ataque</span><b>${oa.total?oa.perfPct+'%':'—'}</b><small>EFF ${oa.total?oa.effPct+'%':'—'} · ${oa.perfect}/${oa.total}</small></div></div>
  <h2>Lectura ejecutiva</h2><div class="ins">${insights.map(x=>`<div>${v757Safe(x)}</div>`).join('')}</div>
  <h2>Evolución por set</h2><table class="tbl"><thead><tr><th>Set</th><th>Marcador</th><th>SAQ ace/err</th><th>REC Pos</th><th>REC Exc</th><th>ATQ Pts</th><th>ATQ EFF</th><th>BLQ</th></tr></thead><tbody>${scoutArr(m.sets).map(s=>{const x=v757SetStats(m,'ours',s.number);return `<tr><td><b>S${s.number}</b></td><td>${s.scoreUs}-${s.scoreOpponent}</td><td>${x.s.perfect}/${x.s.error}</td><td>${x.r.total?x.r.posPct+'%':'·'}</td><td>${x.r.total?x.r.excPct+'%':'·'}</td><td>${x.a.total?x.a.ptsPct+'%':'·'}</td><td>${x.a.total?x.a.effPct+'%':'·'}</td><td>${x.b.perfect}</td></tr>`}).join('')}</tbody></table><div class="foot"><span>${a.rallies.length} rallies · ${a.actions.length} acciones</span><span>Página 1 · Resumen ejecutivo</span></div></div>`;
  const page2=`<div class="v757-pro">${common}${head('Rendimiento individual',2)}<h2>${v757Safe(EQUIPOS[equipoActivo].nombre)}</h2>${playerTable(po)}<h2>${v757Safe(m.opponent||'Rival')}</h2>${playerTable(pr)}<div class="foot"><span>G-P = puntos directos - pérdidas terminales atribuibles.</span><span>Página 2 · Jugadores</span></div></div>`;
  const pO=[v757PhaseAttack(seqO.rows,'positive'),v757PhaseAttack(seqO.rows,'negative'),v757PhaseAttack(seqO.rows,'counter')],pR=[v757PhaseAttack(seqR.rows,'positive'),v757PhaseAttack(seqR.rows,'negative'),v757PhaseAttack(seqR.rows,'counter')],labs=['1er ataque tras recepción +/#','1er ataque tras recepción negativa','Contraataque (K2)'];
  const page3=`<div class="v757-pro">${common}${head('K1, K2 y rotaciones',3)}<div class="twocol"><div><h2>Nuestras rotaciones</h2>${rotTable(a.rotations)}</div><div><h2>Rotaciones rival</h2>${rotTable(a.opponentRotations)}</div></div><h2>Ataque según fase</h2><table class="tbl"><thead><tr><th>Fase</th><th>N Tot</th><th>N Pts</th><th>N Err</th><th>N Blq</th><th>N Pts%</th><th>R Tot</th><th>R Pts</th><th>R Err</th><th>R Blq</th><th>R Pts%</th></tr></thead><tbody>${labs.map((l,i)=>`<tr><td><b>${v757Safe(l)}</b></td><td>${pO[i].total}</td><td>${pO[i].pts}</td><td>${pO[i].err}</td><td>${pO[i].blq}</td><td>${pO[i].pct}%</td><td>${pR[i].total}</td><td>${pR[i].pts}</td><td>${pR[i].err}</td><td>${pR[i].blq}</td><td>${pR[i].pct}%</td></tr>`).join('')}</tbody></table><h2>K1 por calidad de recepción</h2><table class="tbl"><thead><tr><th>Recepción</th><th>Rallies</th><th>K1 ganados</th><th>Side-out</th></tr></thead><tbody>${seqO.byReception.map(x=>`<tr><td><b>${x.ev}</b></td><td>${x.total}</td><td>${x.won}</td><td>${x.total?x.pct+'%':'·'}</td></tr>`).join('')}</tbody></table><div class="foot"><span>K1 = recepción · K2 = saque.</span><span>Página 3 · Fases y rotaciones</span></div></div>`;
  const dist=scoutDistributionRows(m,'ours',''),counts={};dist.forEach(x=>{const k=x.target||'Sin destino';counts[k]=(counts[k]||0)+1});
  const page4=`<div class="v757-pro">${common}${head('Distribución y calidad de datos',4)}<div class="twocol"><div><h2>Distribución del colocador</h2><table class="tbl"><thead><tr><th>Destino / combinación</th><th>Total</th><th>Uso</th></tr></thead><tbody>${Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td><b>${v757Safe(k)}</b></td><td>${v}</td><td>${dist.length?v757Pct(v,dist.length):0}%</td></tr>`).join('')||'<tr><td colspan="3">Sin distribución codificada.</td></tr>'}</tbody></table></div><div><h2>Comparativa de fundamentos</h2><table class="tbl"><thead><tr><th>Fundamento</th><th>Nosotros</th><th>Rival</th></tr></thead><tbody><tr><td><b>Saque ace/error</b></td><td>${os.perfect}/${os.error}</td><td>${rs.perfect}/${rs.error}</td></tr><tr><td><b>Recepción Pos%</b></td><td>${or.total?or.posPct+'%':'·'}</td><td>${rr.total?rr.posPct+'%':'·'}</td></tr><tr><td><b>Recepción Exc%</b></td><td>${or.total?or.perfPct+'%':'·'}</td><td>${rr.total?rr.perfPct+'%':'·'}</td></tr><tr><td><b>Ataque Pts%</b></td><td>${oa.total?oa.perfPct+'%':'·'}</td><td>${ra.total?ra.perfPct+'%':'·'}</td></tr><tr><td><b>Ataque EFF%</b></td><td>${oa.total?oa.effPct+'%':'·'}</td><td>${ra.total?ra.effPct+'%':'·'}</td></tr><tr><td><b>Bloqueos punto</b></td><td>${ob.perfect}</td><td>${rb.perfect}</td></tr></tbody></table></div></div><h2>Calidad de la muestra</h2><div class="ins"><div>Rallies cerrados: <b>${a.rallies.length}</b>. Acciones registradas: <b>${a.actions.length}</b>.</div><div>Las cifras que no tienen acciones registradas se muestran como “·” o “—”; no se convierten en cero.</div><div>Para interpretar rotaciones se recomienda una muestra mínima de 3 rallies y, preferiblemente, varias repeticiones por set.</div></div><div class="foot"><span>Informe descriptivo basado en el scouting registrado.</span><span>Página 4 · Distribución y metodología</span></div></div>`;
  const recO=v890PdfRecSubtype(m,'ours'),recR=v890PdfRecSubtype(m,'opponent'),
    setO=v890PdfSetTempo(m,'ours'),setR=v890PdfSetTempo(m,'opponent'),
    atkO=v890PdfAttackTempo(m,'ours'),atkR=v890PdfAttackTempo(m,'opponent'),
    codeO=v890PdfAttackCodes(m,'ours'),codeR=v890PdfAttackCodes(m,'opponent'),
    atkTypeO=v890PdfSimpleGroups(m,'ours','A','skillSubtype'),atkTypeR=v890PdfSimpleGroups(m,'opponent','A','skillSubtype'),
    setGestureO=v890PdfSimpleGroups(m,'ours','E','skillSubtype'),setGestureR=v890PdfSimpleGroups(m,'opponent','E','skillSubtype'),
    blockO=v890PdfSimpleGroups(m,'ours','B','skillSubtype'),blockR=v890PdfSimpleGroups(m,'opponent','B','skillSubtype');

  const recTable=(rows)=>`<table class="tbl"><thead><tr><th>Tipo recepción</th><th>Tot</th><th>Pos%</th><th>Exc%</th><th>Err</th><th>SO%</th><th>Contacto</th><th>Origen DV</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.pos}%</td><td>${x.exc}%</td><td>${x.err}</td><td>${x.so}%</td><td>${x.contact==='—'?'—':'Z'+v757Safe(x.contact)}</td><td>${x.source==='—'?'—':'Z'+v757Safe(x.source)}</td></tr>`).join('')||'<tr><td colspan="8">Sin subtype de recepción codificado.</td></tr>'}</tbody></table>`;
  const setTempoTable=(rows)=>`<table class="tbl"><thead><tr><th>Tempo</th><th>Tot</th><th>Uso</th><th>G-P téc.</th><th>Set code</th><th>Destino VC</th><th>Set type</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${v757Gp(x.gp)}</td><td>${v757Safe(x.call)}</td><td>${v757Safe(x.target)}</td><td>${v757Safe(x.type)}</td></tr>`).join('')||'<tr><td colspan="7">Sin tempo de colocación codificado.</td></tr>'}</tbody></table>`;
  const attackTempoTable=(rows)=>`<table class="tbl"><thead><tr><th>Tempo</th><th>Tot</th><th>Uso</th><th>Kill%</th><th>Err</th><th>Blq</th><th>EFF</th><th>Code</th><th>Tipo</th><th>Destino</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.label)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.kill}%</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td><td>${v757Safe(x.code)}</td><td>${v757Safe(x.sub)}</td><td>${v757Safe(x.dest)}</td></tr>`).join('')||'<tr><td colspan="10">Sin tempo de ataque codificado.</td></tr>'}</tbody></table>`;
  const codeTable=(rows)=>`<table class="tbl"><thead><tr><th>Attack code</th><th>Tot</th><th>Uso</th><th>Kill%</th><th>Err</th><th>Blq</th><th>EFF</th><th>Tempo</th><th>Tipo</th><th>Destino</th></tr></thead><tbody>${rows.slice(0,14).map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.kill}%</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td><td>${v757Safe(x.tempo)}</td><td>${v757Safe(x.sub)}</td><td>${v757Safe(x.dest)}</td></tr>`).join('')||'<tr><td colspan="10">Sin attack_code codificado.</td></tr>'}</tbody></table>`;
  const simpleTable=(rows,label)=>`<table class="tbl"><thead><tr><th>${v757Safe(label)}</th><th>Tot</th><th>Uso</th><th>Pts</th><th>Err</th><th>Blq</th><th>EFF</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${v757Safe(x.key)}</b></td><td>${x.total}</td><td>${x.use}%</td><td>${x.pts}</td><td>${x.err}</td><td>${x.blk}</td><td>${x.eff}%</td></tr>`).join('')||'<tr><td colspan="7">Sin datos codificados.</td></tr>'}</tbody></table>`;

  const page5=`<div class="v757-pro">${common}${head('DataVolley · recepción y colocación',5)}
    <h2>${v757Safe(EQUIPOS[equipoActivo].nombre)} · tipo de recepción</h2>${recTable(recO)}
    <h2>${v757Safe(m.opponent||'Rival')} · tipo de recepción</h2>${recTable(recR)}
    <div class="twocol"><div><h2>Nuestra colocación · tempo</h2>${setTempoTable(setO)}</div><div><h2>Colocación rival · tempo</h2>${setTempoTable(setR)}</div></div>
    <div class="twocol"><div><h2>Nuestro gesto de colocación</h2>${simpleTable(setGestureO,'Gesto')}</div><div><h2>Gesto rival</h2>${simpleTable(setGestureR,'Gesto')}</div></div>
    <div class="foot"><span>Recepción: subtype + contacto físico + origen DataVolley.</span><span>Página 5 · Recepción y colocación</span></div></div>`;

  const page6=`<div class="v757-pro">${common}${head('DataVolley · ataque, bloqueo y destino',6)}
    <div class="twocol"><div><h2>Nuestro ataque · tempo</h2>${attackTempoTable(atkO)}</div><div><h2>Ataque rival · tempo</h2>${attackTempoTable(atkR)}</div></div>
    <h2>Nuestros attack codes</h2>${codeTable(codeO)}
    <h2>Attack codes rival</h2>${codeTable(codeR)}
    <div class="twocol"><div><h2>Tipo de ataque propio</h2>${simpleTable(atkTypeO,'Skill subtype')}</div><div><h2>Tipo de ataque rival</h2>${simpleTable(atkTypeR,'Skill subtype')}</div></div>
    <div class="twocol"><div><h2>Bloqueo propio · subtype</h2>${simpleTable(blockO,'Block subtype')}</div><div><h2>Bloqueo rival · subtype</h2>${simpleTable(blockR,'Block subtype')}</div></div>
    <div class="ins"><div><b>Destinos:</b> los ataques por zonas conservan origen→destino y los ataques por conos aparecen como C1–C8.</div><div><b>Campos no codificados:</b> se muestran como “Sin dato”; Volley Coach no los infiere artificialmente.</div></div>
    <div class="foot"><span>Tempo Q/U/T/M/H/O · attack_code · skill_subtype · zonas/conos.</span><span>Página 6 · Ataque y bloqueo DataVolley</span></div></div>`;
  const audit=v961Integrity(m),dirsO=v961Group(v961Rows(m,'ours','A'),a=>a.attackDirection),dirsR=v961Group(v961Rows(m,'opponent','A'),a=>a.attackDirection),locO=v961Group(v961Rows(m,'ours','A'),a=>a.endCone?`Cono C${a.endCone}`:(a.dvEndCone?`Cono C${a.dvEndCone}`:(a.dvEndSubzone?`Z${a.dvEndZone||a.endZone}${a.dvEndSubzone}`:(a.endZone?`Z${a.endZone}`:'')))),locR=v961Group(v961Rows(m,'opponent','A'),a=>a.endCone?`Cono C${a.endCone}`:(a.dvEndCone?`Cono C${a.dvEndCone}`:(a.dvEndSubzone?`Z${a.dvEndZone||a.endZone}${a.dvEndSubzone}`:(a.endZone?`Z${a.endZone}`:'')))),blkComboO=v961Group(v961Rows(m,'ours','B'),a=>`${a.skillSubtype||'Sin subtype'} · ${a.blockers?`${a.blockers}B`:'sin tamaño'} · ${a.blockTargetNumber?`vs #${a.blockTargetNumber}`:(a.blockTargetLabel?`vs ${a.blockTargetLabel}`:'sin objetivo')}`),blkComboR=v961Group(v961Rows(m,'opponent','B'),a=>`${a.skillSubtype||'Sin subtype'} · ${a.blockers?`${a.blockers}B`:'sin tamaño'} · ${a.blockTargetNumber?`vs #${a.blockTargetNumber}`:(a.blockTargetLabel?`vs ${a.blockTargetLabel}`:'sin objetivo')}`),phaseO=v961Group(v961Rows(m,'ours'),a=>[a.dvPointPhase,a.dvPhase,a.dvAttackPhase].filter(Boolean).join(' / ')),phaseR=v961Group(v961Rows(m,'opponent'),a=>[a.dvPointPhase,a.dvPhase,a.dvAttackPhase].filter(Boolean).join(' / '));
  const page7=`<div class="v757-pro">${common}${head('Trazabilidad y cobertura técnica',7)}<div class="cards"><div class="card"><span>Rallies cerrados</span><b>${audit.rallies}</b><small>base oficial</small></div><div class="card"><span>Acciones cerradas</span><b>${audit.closedActions}</b><small>análisis + PDF</small></div><div class="card"><span>Rally en curso</span><b>${audit.liveActions}</b><small>pendientes</small></div><div class="card"><span>Integridad</span><b>${audit.ok?'OK':'REVISAR'}</b><small>${audit.issues.length} incidencias</small></div></div><div class="twocol"><div><h2>${v757Safe(EQUIPOS[equipoActivo].nombre)} · cobertura</h2>${v961CoverageTable(audit.ours)}</div><div><h2>${v757Safe(m.opponent||'Rival')} · cobertura</h2>${v961CoverageTable(audit.opponent)}</div></div><div class="twocol"><div><h2>Dirección de ataque propia</h2>${v961GroupTable(dirsO,'Dirección')}</div><div><h2>Dirección de ataque rival</h2>${v961GroupTable(dirsR,'Dirección')}</div></div><div class="twocol"><div><h2>Destino zona / subzona / cono</h2>${v961GroupTable(locO,'Destino')}</div><div><h2>Destino rival</h2>${v961GroupTable(locR,'Destino')}</div></div><div class="twocol"><div><h2>Bloqueo subtype / tamaño / objetivo</h2>${v961GroupTable(blkComboO,'Bloqueo')}</div><div><h2>Bloqueo rival</h2>${v961GroupTable(blkComboR,'Bloqueo')}</div></div><div class="twocol"><div><h2>Fases DataVolley</h2>${v961GroupTable(phaseO,'Point / Phase / Attack')}</div><div><h2>Fases rival</h2>${v961GroupTable(phaseR,'Point / Phase / Attack')}</div></div><div class="ins">${audit.issues.length?audit.issues.map(x=>`<div><b>REVISAR:</b> ${v757Safe(x)}</div>`).join(''):`<div><b>Integridad verificada:</b> scouting, análisis individual y PDF comparten la misma base de acciones cerradas.</div>`}<div><b>Criterio:</b> el rally en curso se conserva en Scouting/JSON/CSV acciones, pero no entra en cifras oficiales hasta cerrar el punto.</div></div><div class="foot"><span>Código · zonas · coordenadas · subtype · tempo · set/attack code · dirección · conos · bloqueo · fases · vídeo.</span><span>Página 7 · Trazabilidad</span></div></div>`;
  return [page1,page2,page3,page4,page5,page6,page7];
}
/* VC2078_FN_END:v757ProPages */
window.VC_SCOUT_REPORT_LAYOUT_2078=Object.freeze({VERSION:"20.7.8",pureOnly:true,officialHTML:v757OfficialHTML,proPages:v757ProPages});
})();
/* VC2078_SCOUT_REPORT_LAYOUT_END */


/* ===== V5.11.5 · FIX PDF ENTRENAMIENTO + PDF PARTIDO PROFESIONAL ===== */

function vcSafeArray(v){return Array.isArray(v)?v:[]}
function vcUniqueNumbers(v){return [...new Set(vcSafeArray(v).map(Number).filter(Number.isFinite))]}
function vcUniqueStrings(v){return [...new Set(vcSafeArray(v).map(x=>String(x||'').trim()).filter(Boolean))]}
function vcRosterLabelFromPlayer(p){return `${p?.number!==''&&p?.number!=null?'#'+p.number+' · ':''}${String(p?.name||'Jugador')}`}
function vcRosterSnapshotForIds(ids,teamId=equipoActivo){
  const set=new Set(vcUniqueNumbers(ids)),players=vcTeamPlayers(teamId);
  return players.filter(p=>set.has(Number(p.id))).map(p=>({id:Number(p.id),name:String(p.name||''),number:p.number??'',positions:typeof ppPositions==='function'?ppPositions(p):[p.position,p.secondaryPosition].filter(Boolean)}));
}
function vcRosterLabelsForIds(ids,teamId=equipoActivo){
  const wanted=vcUniqueNumbers(ids),players=vcTeamPlayers(teamId),byId=new Map(players.map(p=>[Number(p.id),p]));
  return wanted.map(id=>byId.has(id)?vcRosterLabelFromPlayer(byId.get(id)):`Jugador ${id}`);
}
function vcResolvedSessionRoster(h,teamId=equipoActivo){
  let snapshot=vcSafeArray(h?.participantSnapshot).filter(Boolean).map(x=>({...x}));
  let ids=vcUniqueNumbers(h?.playerIds);
  if(!ids.length&&snapshot.length)ids=vcUniqueNumbers(snapshot.map(x=>x.id));
  // Sesión abierta: tomar directamente los checks visibles, que son la fuente más reciente.
  try{
    const domIds=typeof rosterSeleccionados==='function'?vcUniqueNumbers(rosterSeleccionados()):[];
    const belongsToCurrent=h?.__vcCurrentPdf===true;
    if(belongsToCurrent&&domIds.length){ids=domIds;snapshot=vcRosterSnapshotForIds(ids,teamId)}
  }catch{}
  // Respaldo desde la planificación enlazada.
  if(!ids.length&&h?.planificacionId){
    const p=(planificacion||[]).find(x=>Number(x.id)===Number(h.planificacionId));
    if(p){ids=vcUniqueNumbers(p.playerIds);if(!snapshot.length)snapshot=vcSafeArray(p.participantSnapshot).map(x=>({...x}))}
  }
  let labels=snapshot.length?snapshot.map(vcSnapshotLabel):vcRosterLabelsForIds(ids,teamId);
  if(!snapshot.length&&ids.length)snapshot=vcRosterSnapshotForIds(ids,teamId);
  return {ids,labels:vcUniqueStrings(labels),snapshot};
}
function vcResolvedExerciseRoster(e,h,teamId,sessionRoster){
  const hasExplicitIds=Array.isArray(e?.playerIds),hasExplicitSnap=Array.isArray(e?.participantSnapshot)&&e.participantSnapshot.length>0;
  let ids=hasExplicitIds?vcUniqueNumbers(e.playerIds):(hasExplicitSnap?vcUniqueNumbers(e.participantSnapshot.map(x=>x.id)):sessionRoster.ids.slice());
  let labels=hasExplicitSnap?e.participantSnapshot.map(vcSnapshotLabel):(ids.length?vcRosterLabelsForIds(ids,teamId):[]);
  if(!hasExplicitIds&&!hasExplicitSnap){ids=sessionRoster.ids.slice();labels=sessionRoster.labels.slice()}
  labels=vcUniqueStrings(labels);
  const a=new Set(ids.map(Number)),b=new Set(sessionRoster.ids.map(Number));
  let all=sessionRoster.ids.length>0&&a.size===b.size&&[...a].every(x=>b.has(x));
  if(!sessionRoster.ids.length&&sessionRoster.labels.length){
    const la=new Set(labels.map(x=>x.toLowerCase())),lb=new Set(sessionRoster.labels.map(x=>x.toLowerCase()));
    all=la.size===lb.size&&[...la].every(x=>lb.has(x));
  }
  // Si el ejercicio no tenía asignación explícita, hereda a todos siempre.
  if(!hasExplicitIds&&!hasExplicitSnap)all=true;
  return {ids,labels,all,count:labels.length||ids.length||0};
}

/* Asegura que el PDF de la sesión abierta recoja los checks actuales aunque meta todavía no se hubiera serializado. */
const _datosSesionActualParaPDFV5115=datosSesionActualParaPDF;
datosSesionActualParaPDF=function(){
  guardarSesionMeta();
  const h=_datosSesionActualParaPDFV5115();
  const ids=typeof rosterSeleccionados==='function'?vcUniqueNumbers(rosterSeleccionados()):vcUniqueNumbers(meta?.playerIds);
  h.__vcCurrentPdf=true;
  if(ids.length){h.playerIds=ids;h.jugadores=String(ids.length);h.participantSnapshot=vcRosterSnapshotForIds(ids,equipoActivo)}
  return h;
};

/* PDF de entrenamiento: asistentes arriba y nombres por ejercicio solo para subgrupos. */
generarPDFEntrenamiento=function(h,equipoNombre){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.6;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[130,145,160];
    const teamId=vcTeamIdFromName(equipoNombre),sessionRoster=vcResolvedSessionRoster(h,teamId);
    let y=15;
    const normal=(size=9.6,color=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const bold=(size=9.6,color=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const page=()=>{pdf.addPage();y=15};
    const ensure=(height=6)=>{if(y+height>H-FOOT)page()};
    const rule=()=>{pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=5};
    const field=(label,value,op={})=>{
      const txt=limpiarTextoPDF(value)||'-',size=op.size||9.5,indent=op.indent||0;
      bold(size);const lab=label+':',x=M+indent,lw=pdf.getTextWidth(lab+' '),vx=x+lw,right=Number.isFinite(op.right)?op.right:(W-M),maxW=Math.max(25,right-vx);
      normal(size);const lines=pdf.splitTextToSize(txt,maxW);
      lines.forEach((t,i)=>{ensure(LH+1);if(i===0){bold(size);pdf.text(lab,x,y);normal(size);pdf.text(t,vx,y)}else{normal(size);pdf.text(t,vx,y)}y+=LH});y+=op.after==null?1.2:op.after;
    };
    const section=title=>{ensure(11);bold(13.5);pdf.text(limpiarTextoPDF(title),M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=5.5};
    const blockNote=txt=>{if(limpiarTextoPDF(txt))field('Notas del bloque',txt,{size:9,after:2})};
    const court=(x,yy,w=40,hc=20)=>{pdf.setDrawColor(125,139,153);pdf.setLineWidth(.28);pdf.rect(x,yy,w,hc);const c=x+w/2,a=w/6;pdf.setLineWidth(.48);pdf.line(c,yy,c,yy+hc);pdf.setLineWidth(.22);pdf.line(c-a,yy,c-a,yy+hc);pdf.line(c+a,yy,c+a,yy+hc);pdf.setDrawColor(185,194,203);pdf.setLineWidth(.18);pdf.line(x,yy+hc/2,x+w,yy+hc/2);normal(5.8,muted);pdf.text('CAMPO',x+w/2,yy+hc+3,{align:'center'})};
    const exercise=(e0,n)=>{
      const e=enriquecerEjercicioGuardado(e0),name=limpiarTextoPDF(e.nombre)||'Ejercicio',minutes=Number(e.tiempo)||0,roster=vcResolvedExerciseRoster(e0,h,teamId,sessionRoster);
      const courtW=40,courtH=20,courtGap=5;ensure(36);
      pdf.setFillColor(...light);pdf.rect(M,y-4,W-M*2,7,'F');bold(10.5);pdf.text(`${n}. ${name}`,M+2,y);normal(9.3);pdf.text(`${minutes} min${roster.count?` · ${roster.count} jug.`:''}`,W-M-2,y,{align:'right'});y+=7;
      const cx=W-M-courtW,cy=y+1,right=cx-courtGap,pageNo=pdf.getCurrentPageInfo().pageNumber;court(cx,cy,courtW,courtH);
      field('Función',e.objetivo,{size:9.3,right});field('Desarrollo',e.descripcion,{size:9.3,right});
      const org=[e.formato?`Formato: ${limpiarTextoPDF(e.formato)}`:'',e.jugadores?`Organización: ${limpiarTextoPDF(e.jugadores)}`:'',e.material?`Material: ${limpiarTextoPDF(e.material)}`:''].filter(Boolean).join(' · ');
      field('Organización',org||'-',{size:9.3,right});
      if(!roster.all)field('Participantes',roster.labels.length?roster.labels.join(' · '):'Sin jugadores asignados',{size:9.3,right});
      field('Claves / correcciones',e.errores||'-',{size:9.3,right});if(limpiarTextoPDF(e.variantes))field('Variantes',e.variantes,{size:9.3,right});
      if(pdf.getCurrentPageInfo().pageNumber===pageNo)y=Math.max(y,cy+courtH+5);ensure(6);normal(8.5,muted);pdf.text(limpiarTextoPDF([fundamentosTexto(e),e.tipo||'',e.fase||'Parte principal',e.intensidad||'Media'].filter(Boolean).join(' · ')),M,y);y+=7;
    };
    bold(18);pdf.text('VOLLEY COACH',M,y);y+=8;bold(12.5);pdf.text('Ficha de entrenamiento',M,y);y+=8;rule();
    field('Equipo',equipoNombre||h.equipo||'Equipo',{after:1});field('Fecha',h.fecha||'-',{after:1});field('Duración',`${Number(h.duracion)||0} min`,{after:1});
    const attendeeText=sessionRoster.labels.length?sessionRoster.labels.join(' · '):(Number(h.jugadores)?`${Number(h.jugadores)} jugadores (sin nombres registrados)`:'No registrados');
    field(`Asistentes (${sessionRoster.labels.length||Number(h.jugadores)||0})`,attendeeText,{after:1});
    field('Intensidad',h.intensidad||'Media',{after:1});field('Objetivo',h.objetivo||'-',{after:1});if(Number(h.duracionObjetivo)||0)field('Objetivo de tiempo',`${Number(h.duracionObjetivo)} min`,{after:3});
    const groups=ejerciciosPorBloques(h.ejercicios||[]),notes=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');let counter=0;
    ORDEN_SECCIONES_ENTRENO.forEach(slug=>{const items=groups[slug]||[],note=limpiarTextoPDF(notes[slug]);if(!items.length&&!note)return;section(`${SECCIONES_ENTRENO[slug]?.numero||''} ${SECCIONES_ENTRENO[slug]?.titulo||slug}`.trim());blockNote(note);items.forEach(e=>exercise(e,++counter))});
    if(limpiarTextoPDF(h.notas)){section('Notas del entrenador');normal(9.4);pdf.splitTextToSize(limpiarTextoPDF(h.notas),W-M*2).forEach(t=>{ensure(LH);pdf.text(t,M,y);y+=LH})}
    const pages=pdf.getNumberOfPages(),date=limpiarTextoPDF(h.fecha)||fechaLocalISO();for(let i=1;i<=pages;i++){pdf.setPage(i);normal(8,muted);pdf.text(`Volley Coach · ${date} · Página ${i}/${pages}`,M,H-7)}
    const safe=String(equipoNombre||h.equipo||'Equipo').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');pdf.save(`Entrenamiento_${safe}_${date}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF. Comprueba la conexión e inténtalo de nuevo.')}
};

/* Campo de hora de convocatoria añadido sin alterar el formulario existente. */
(function vcAddCallTimeField(){
  if($('match-call-time'))return;
  const time=$('match-time');if(!time)return;
  const label=document.createElement('label');label.id='match-call-time-field';label.innerHTML='<span>Hora de convocatoria</span><input id="match-call-time" type="time">';
  time.closest('label')?.insertAdjacentElement('afterend',label);
  const roster=$('match-roster-list');if(roster&&!document.getElementById('match-roster-legend')){const legend=document.createElement('div');legend.id='match-roster-legend';legend.className='match-roster-legend';legend.innerHTML='<span>Convocado · aparece en la lista del partido</span><span>No disponible · permite indicar motivo</span><span>No convocado · queda fuera de la convocatoria</span>';roster.before(legend)}
})();

function vcNormalizeMatchRosterStatus(m,teamId=equipoActivo){
  const raw=vcSafeArray(m?.rosterStatus);
  if(raw.length)return raw.map(r=>({id:Number(r.id)||0,status:String(r.status||'No convocado'),reason:String(r.reason||''),name:String(r.name||''),number:r.number??'',positions:vcSafeArray(r.positions)}));
  const called=new Set(vcUniqueNumbers(m?.playerIds));
  return vcTeamPlayers(teamId).map(p=>({id:Number(p.id),status:called.has(Number(p.id))?'Convocado':'No convocado',reason:'',name:String(p.name||''),number:p.number??'',positions:typeof ppPositions==='function'?ppPositions(p):[]}));
}
/* V12.5 removed unreachable function: vcMatchRosterStateMap */
function vcMatchRosterStatusChange(sel){const row=sel.closest('.match-roster-pro-row'),input=row?.querySelector('.match-roster-reason');if(!input)return;input.classList.toggle('hidden',sel.value!=='No disponible');if(sel.value!=='No disponible')input.value=''}
function matchRosterOptions(selected=[],rosterStatus=[]){
  const box=$('match-roster-list');if(!box)return;const selectedSet=new Set(vcUniqueNumbers(selected)),state=new Map(vcSafeArray(rosterStatus).map(r=>[Number(r.id),r]));
  box.innerHTML=(jugadoresEquipo||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).map(p=>{const old=state.get(Number(p.id)),status=old?.status||(selectedSet.has(Number(p.id))?'Convocado':'No convocado'),reason=old?.reason||'',pos=ppPositions(p).join(' · ')||'Sin posición';return `<div class="match-roster-pro-row" data-player-id="${p.id}"><div class="match-roster-pro-player"><b>${p.number!==''&&p.number!=null?`#${esc(p.number)} · `:''}${esc(p.name)}</b><small>${esc(pos)}</small></div><select class="match-player-status" onchange="vcMatchRosterStatusChange(this)"><option ${status==='Convocado'?'selected':''}>Convocado</option><option ${status==='No disponible'?'selected':''}>No disponible</option><option ${status==='No convocado'?'selected':''}>No convocado</option></select><input class="match-roster-reason ${status==='No disponible'?'':'hidden'}" value="${esc(reason)}" placeholder="Motivo de la ausencia"></div>`}).join('')||'<div class="match-empty">Primero añade jugadores a este equipo.</div>';
}
function vcReadMatchRoster(){
  const rows=[...document.querySelectorAll('#match-roster-list .match-roster-pro-row')];
  const status=rows.map(row=>{const id=Number(row.dataset.playerId),p=(jugadoresEquipo||[]).find(x=>Number(x.id)===id),st=row.querySelector('.match-player-status')?.value||'No convocado',reason=String(row.querySelector('.match-roster-reason')?.value||'').trim();return {id,status:st,reason,name:String(p?.name||''),number:p?.number??'',positions:typeof ppPositions==='function'&&p?ppPositions(p):[]}});
  return {rosterStatus:status,playerIds:status.filter(x=>x.status==='Convocado').map(x=>x.id),unavailable:status.filter(x=>x.status==='No disponible')};
}

normalizarPartidos=function(list){
  return Array.isArray(list)?list.filter(Boolean).map(m=>{
    const base={id:Number(m.id)||Date.now(),date:String(m.date||''),time:String(m.time||''),callTime:String(m.callTime||''),competition:String(m.competition||''),round:String(m.round||''),opponent:String(m.opponent||''),venue:String(m.venue||'Casa'),status:String(m.status||'Programado'),setsFor:m.setsFor===''?'':Number(m.setsFor||0),setsAgainst:m.setsAgainst===''?'':Number(m.setsAgainst||0),setDetail:String(m.setDetail||''),notes:String(m.notes||''),focus:Array.isArray(m.focus)?m.focus:[],playerIds:vcUniqueNumbers(m.playerIds),participantSnapshot:Array.isArray(m.participantSnapshot)?clonar(m.participantSnapshot):[],rosterStatus:vcSafeArray(m.rosterStatus).map(r=>({...r,positions:vcSafeArray(r.positions)}))};
    if(!base.rosterStatus.length&&base.playerIds.length){
      const snaps=new Map(base.participantSnapshot.map(x=>[Number(x.id),x]));
      base.rosterStatus=base.playerIds.map(id=>{const x=snaps.get(Number(id));return {id:Number(id),status:'Convocado',reason:'',name:String(x?.name||''),number:x?.number??'',positions:vcSafeArray(x?.positions)}});
    }
    return base;
  }):[];
};

abrirPartidoModal=function(id=null){
  const m=id?partidosEquipo.find(x=>Number(x.id)===Number(id)):null;$('match-id').value=m?.id||'';$('match-modal-title').textContent=m?'Editar partido':'Nuevo partido';$('match-date').value=m?.date||fechaLocalISO();$('match-time').value=m?.time||'';if($('match-call-time'))$('match-call-time').value=m?.callTime||'';$('match-competition').value=m?.competition||'';$('match-round').value=m?.round||'';$('match-opponent').value=m?.opponent||'';$('match-venue').value=m?.venue||'Casa';$('match-status').value=m?.status||'Programado';$('match-sets-for').value=m?.setsFor??'';$('match-sets-against').value=m?.setsAgainst??'';$('match-set-detail').value=m?.setDetail||'';$('match-notes').value=m?.notes||'';matchFocusOptions();const fs=new Set(m?.focus||[]);document.querySelectorAll('input[name="match-focus"]').forEach(x=>x.checked=fs.has(x.value));matchRosterOptions(m?.playerIds||[],m?.rosterStatus||[]);$('match-delete-btn').classList.toggle('hidden',!m);matchToggleResult();$('match-modal').classList.add('open')
};
function vcBuildMatchRecord(existing=null){
  const roster=vcReadMatchRoster(),status=$('match-status')?.value||'Programado',playerIds=roster.playerIds;
  return {id:Number($('match-id')?.value)||Date.now(),date:$('match-date')?.value||fechaLocalISO(),time:$('match-time')?.value||'',callTime:$('match-call-time')?.value||'',competition:String($('match-competition')?.value||'').trim(),round:String($('match-round')?.value||'').trim(),opponent:String($('match-opponent')?.value||'').trim()||'Rival',venue:$('match-venue')?.value||'Casa',status,setsFor:status==='Jugado'?Number($('match-sets-for')?.value||0):'',setsAgainst:status==='Jugado'?Number($('match-sets-against')?.value||0):'',setDetail:String($('match-set-detail')?.value||'').trim(),notes:String($('match-notes')?.value||'').trim(),focus:[...document.querySelectorAll('input[name="match-focus"]:checked')].map(x=>x.value),playerIds,participantSnapshot:vcMatchParticipantSnapshot(playerIds,equipoActivo),rosterStatus:roster.rosterStatus};
}
guardarPartido=function(){
  const existing=partidosEquipo.find(x=>Number(x.id)===Number($('match-id')?.value)),rec=vcBuildMatchRecord(existing);if(!rec.date||!String(rec.opponent||'').trim()){alert('Añade al menos la fecha y el rival.');return}const i=partidosEquipo.findIndex(x=>Number(x.id)===Number(rec.id));if(i>=0)partidosEquipo[i]=rec;else partidosEquipo.push(rec);guardarPartidos();cerrarPartidoModal();renderCompetition();renderStats();renderDashboardCompetition();renderPlanificacion();
};
vcMatchFromModal=function(){const existing=partidosEquipo.find(x=>Number(x.id)===Number($('match-id')?.value));return vcBuildMatchRecord(existing)};

function vcMatchRosterForPDF(m,teamId=equipoActivo){
  let states=vcNormalizeMatchRosterStatus(m,teamId);const current=vcTeamPlayers(teamId),byId=new Map(current.map(p=>[Number(p.id),p]));
  states=states.map(r=>{const p=byId.get(Number(r.id));return {...r,name:r.name||p?.name||`Jugador ${r.id}`,number:r.number!==''&&r.number!=null?r.number:(p?.number??''),positions:vcSafeArray(r.positions).length?r.positions:(p&&typeof ppPositions==='function'?ppPositions(p):[])}});
  // Añade convocados históricos que ya no existan en la plantilla actual.
  vcSafeArray(m?.participantSnapshot).forEach(s=>{if(!states.some(r=>Number(r.id)===Number(s.id)))states.push({id:Number(s.id)||0,status:'Convocado',reason:'',name:s.name||'Jugador',number:s.number??'',positions:vcSafeArray(s.positions)})});
  return states;
}
function vcMatchPlayerLine(r){const left=`${r.number!==''&&r.number!=null?'#'+r.number+' · ':''}${r.name||'Jugador'}`,pos=vcSafeArray(r.positions).filter(Boolean).join(' / ');return pos?`${left} · ${pos}`:left}

generarPDFPartido=function(m,teamId=equipoActivo){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.8;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[130,145,160];let y=15;
    const normal=(s=9.6,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)},bold=(s=9.6,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)},page=()=>{pdf.addPage();y=15},ensure=(h=6)=>{if(y+h>H-FOOT)page()};
    const rule=()=>{pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=5};
    const field=(label,value,after=1.2)=>{const txt=limpiarTextoPDF(value)||'-';bold(9.5);const lab=label+':',lw=pdf.getTextWidth(lab+' '),vx=M+lw,maxW=W-M-vx;normal(9.5);const ls=pdf.splitTextToSize(txt,Math.max(25,maxW));ls.forEach((t,i)=>{ensure(LH+1);if(i===0){bold(9.5);pdf.text(lab,M,y);normal(9.5);pdf.text(t,vx,y)}else{normal(9.5);pdf.text(t,vx,y)}y+=LH});y+=after};
    const section=t=>{ensure(11);bold(13.5);pdf.text(t,M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=5.5};
    const listRow=(text,index,sub='')=>{ensure(sub?11:7);pdf.setFillColor(...light);pdf.rect(M,y-3.7,W-M*2,sub?9:6.7,'F');bold(9.3);pdf.text(`${index}.`,M+2,y);normal(9.3);const main=pdf.splitTextToSize(limpiarTextoPDF(text),W-M*2-12);pdf.text(main,M+8,y);y+=main.length*LH;if(sub){normal(8.8,muted);const sl=pdf.splitTextToSize(limpiarTextoPDF(sub),W-M*2-8);pdf.text(sl,M+8,y);y+=sl.length*4.2}y+=2.5};
    bold(18);pdf.text('VOLLEY COACH',M,y);y+=8;bold(12.5);pdf.text('Ficha de partido',M,y);y+=8;rule();
    field('Equipo',EQUIPOS[teamId]?.nombre||'Equipo',1);field('Fecha',m.date||'-',1);if(m.callTime)field('Hora de convocatoria',m.callTime,1);if(m.time)field('Hora del partido',m.time,1);field('Rival',m.opponent||'-',1);field('Competición',m.competition||'-',1);field('Jornada / fase',m.round||'-',1);field('Condición',m.venue||'-',1);field('Estado',m.status||'Programado',3);
    if(m.status==='Jugado'){section('Resultado');field('Resultado',`${Number(m.setsFor)||0} – ${Number(m.setsAgainst)||0}`,1);if(limpiarTextoPDF(m.setDetail))field('Marcadores de sets',m.setDetail,3)}
    const roster=vcMatchRosterForPDF(m,teamId),called=roster.filter(r=>r.status==='Convocado'),unavailable=roster.filter(r=>r.status==='No disponible');
    section(`Convocatoria · ${called.length} jugador${called.length===1?'':'es'}`);
    if(called.length)called.forEach((r,i)=>listRow(vcMatchPlayerLine(r),i+1));else{normal(9.4,muted);pdf.text('No hay jugadores convocados registrados.',M,y);y+=8}
    if(unavailable.length){section('No disponibles');unavailable.forEach((r,i)=>listRow(vcMatchPlayerLine(r),i+1,r.reason?`Motivo: ${r.reason}`:'Motivo no indicado'))}
    if(vcSafeArray(m.focus).length){section('Prioridades detectadas');field('Trabajar',m.focus.join(' · '),3)}
    if(limpiarTextoPDF(m.notes)){section('Notas / lectura del partido');normal(9.5);pdf.splitTextToSize(limpiarTextoPDF(m.notes),W-M*2).forEach(t=>{ensure(LH);pdf.text(t,M,y);y+=LH})}
    const pages=pdf.getNumberOfPages(),date=limpiarTextoPDF(m.date)||fechaLocalISO();for(let i=1;i<=pages;i++){pdf.setPage(i);normal(8,muted);pdf.text(`Volley Coach · Partido · ${date} · Página ${i}/${pages}`,M,H-7)}const rival=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');pdf.save(`Partido_${rival}_${date}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.')}
};

/* Actualiza visualmente tarjetas para mostrar convocatoria cuando exista. */
const _matchCardV5115=matchCard;
matchCard=function(m){let h=_matchCardV5115(m);const unavailable=vcNormalizeMatchRosterStatus(m,equipoActivo).filter(r=>r.status==='No disponible').length,call=m.callTime?`Conv. ${esc(m.callTime)}`:'';if(call||unavailable)h=h.replace('<div class="match-actions">',`<div class="match-meta">${call}${call&&unavailable?' · ':''}${unavailable?`${unavailable} no disponible${unavailable===1?'':'s'}`:''}</div><div class="match-actions">`);return h};

/* Migra en memoria partidos existentes para que los nuevos campos entren en la nube/local. */
(function vcMigrateV5115(){
  ['infantil','cadete'].forEach(t=>{if(equiposData?.[t])equiposData[t].partidos=normalizarPartidos(equiposData[t].partidos||[])});partidosEquipo=normalizarPartidos(equiposData?.[equipoActivo]?.partidos||partidosEquipo||[]);if(equiposData?.[equipoActivo])equiposData[equipoActivo].partidos=partidosEquipo;try{guardarEstadoLocalSinCloud()}catch{};renderCompetition();renderPlanificacion();
})();
