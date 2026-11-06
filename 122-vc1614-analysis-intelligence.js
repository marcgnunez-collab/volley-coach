/* Volley Coach V16.1.4 · Analysis Intelligence Pro
   Conservative, read-only statistics on CLOSED rallies. No score or sync writes.
   Compatible with the existing Data Sheet, PDF, video analytics and Clip Studio.
*/
(()=>{
'use strict';
if(window.VC_ANALYSIS_INTELLIGENCE_1614)return;
const VERSION='16.1.4';
const $=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[];
const txt=v=>String(v??'').trim();
const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const skills={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const evals=['#','+','!','-','/','='];
const pct=(n,d)=>d?Math.round(n*1000/d)/10:null;
const fmt=v=>v==null?'—':`${Number(v).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
const signed=n=>n>0?`+${n}`:String(n);
const zone=v=>{const m=txt(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?m[1]:''};
const zoneFull=v=>{const m=txt(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?`${m[1]}${m[2]||''}`:''};
const has=v=>v!==null&&v!==undefined&&txt(v)!=='';
const team=v=>v==='opponent'?'opponent':'ours';
function actionVideo(a,m){
 return ['videoTime','videoTimestamp','liveVideoTime','videoAction'].some(k=>has(a?.[k])&&Number.isFinite(Number(a[k]))&&Number(a[k])>=0)||
  (has(m?.video?.syncOffset)&&Number.isFinite(Number(m.video.syncOffset))&&has(a?.scoutMs)&&Number.isFinite(Number(a.scoutMs)));
}
function playerLabel(a,bridge){
 try{const s=bridge?.playerLabel?.(a);if(has(s)&&s!=='Jugador')return txt(s)}catch(_){}
 return txt(a.playerNameSnapshot||a.playerLabel||a.playerNumberSnapshot||(a.playerId?`#${a.playerId}`:''))||'Sin identificar';
}
function extract(m,bridge){
 const rallies=[],actions=[];
 for(const s of arr(m?.sets))for(let i=0;i<arr(s.rallies).length;i++){
  const r=s.rallies[i];if(!r)continue;
  const serving=['ours','opponent'].includes(r.servingBefore)?r.servingBefore:null,winner=team(r.winner),set=Number(s.number)||1;
  // A rally with an unknown winner is excluded from point denominators, not silently counted as ours.
  const validWinner=r.winner==='ours'||r.winner==='opponent';
  const rr={set,index:i+1,id:r.id,serving,winning:validWinner?winner:null,
   rotation:Number(r.rotationBefore)||0,opponentRotation:Number(r.opponentRotationBefore)||0,
   scoreBefore:r.scoreBefore||{},scoreAfter:r.scoreAfter||{},actions:[],raw:r};
  rallies.push(rr);
  for(let j=0;j<arr(r.actions).length;j++){
   const a=r.actions[j];if(!a)continue;
   const row={a,r:rr,index:j,team:team(a.team),skill:txt(a.skill).toUpperCase(),ev:txt(a.evaluation),
    player:playerLabel(a,bridge),set,code:txt(a.code),video:actionVideo(a,m),
    key:`a:${s.number}:${r.id}:${a.id}`,rotation:team(a.team)==='ours'?rr.rotation:rr.opponentRotation};
   rr.actions.push(row);actions.push(row);
  }
 }
 return {rallies,actions};
}
function skillsFor(rows){
 const groups={};
 for(const r of rows){if(!skills[r.skill])continue;
  const g=groups[r.skill]||(groups[r.skill]={n:0,kills:0,errors:0,blocked:0,positive:0,perfect:0,byEval:{}});
  g.n++;g.byEval[r.ev]=(g.byEval[r.ev]||0)+1;
  if(r.ev==='#'){g.perfect++;if(['S','A','B'].includes(r.skill))g.kills++}
  if(['#','+'].includes(r.ev))g.positive++;
  if(r.ev==='=')g.errors++;
  if(r.skill==='A'&&r.ev==='/')g.blocked++;
 }
 for(const [s,g] of Object.entries(groups)){
  g.positivePct=pct(g.positive,g.n);g.perfectPct=pct(g.perfect,g.n);
  g.killPct=['S','A','B'].includes(s)?pct(g.kills,g.n):null;
  g.eff=s==='A'?pct(g.kills-g.errors-g.blocked,g.n):null;
 }
 return groups;
}
function pointsFor(rallies,target){
 const valid=rallies.filter(r=>r.winning);
 const k1=valid.filter(r=>r.serving&&r.serving!==target),k2=valid.filter(r=>r.serving===target);
 const w1=k1.filter(r=>r.winning===target).length,w2=k2.filter(r=>r.winning===target).length;
 return {rallies:valid.length,k1:{n:k1.length,w:w1,pct:pct(w1,k1.length)},k2:{n:k2.length,w:w2,pct:pct(w2,k2.length)},won:valid.filter(r=>r.winning===target).length};
}
function rotationsFor(rallies,target){return [1,2,3,4,5,6].map(n=>{
 const items=rallies.filter(r=>(target==='ours'?r.rotation:r.opponentRotation)===n&&r.winning);
 return {rotation:n,...pointsFor(items,target)};
})}
function groupBy(rows,getter){const m=new Map();for(const item of rows){const key=txt(getter(item))||'Sin codificar';let list=m.get(key);if(!list)m.set(key,list=[]);list.push(item)}return [...m].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es'))}
function receptionChains(rallies,target){
 const out=[];
 for(const r of rallies){if(!r.winning||!r.serving||r.serving===target)continue;
  const rows=r.actions.filter(a=>a.team===target);
  const rec=rows.find(x=>x.skill==='R');if(!rec)continue;
  const setter=rows.find(x=>x.skill==='E'&&x.index>rec.index)||null;
  const attack=rows.find(x=>x.skill==='A'&&x.index>(setter?.index??rec.index))||null;
  out.push({r,rec,setter,attack,positive:['#','+'].includes(rec.ev),
   outcome:r.winning===target,target:txt(setter?.a.setTarget||setter?.a.attackCombo||attack?.a.attackCombo)||'Sin codificar'});
 }
 return out;
}
function setterPairs(rallies,target){
 const out=[];
 for(const r of rallies){const aa=r.actions;
  for(let i=0;i<aa.length;i++){
   if(aa[i].team!==target||aa[i].skill!=='E')continue;
   // Match only an attack in the same possession. An opponent touch ends it.
   let next=null;
   for(let j=i+1;j<aa.length;j++){
    if(aa[j].team!==target||aa[j].skill==='E')break;
    if(aa[j].skill==='A'){next=aa[j];break}
   }
   let rec=null;
   for(let j=i-1;j>=0;j--){
    if(aa[j].team!==target)break;
    if(aa[j].skill==='R'){rec=aa[j];break}
   }
   const set=aa[i];
   out.push({r,set,attack:next,recEval:rec?.ev||'',target:txt(set.a.setTarget||set.a.attackCombo||next?.a.attackCombo)||'Sin codificar'});
  }
 }
 return out;
}
const checks=[
 {skill:'S',fields:[['Tipo de saque',a=>has(a.serveType)],['Origen',a=>!!zone(a.startZone)],['Destino',a=>!!zone(a.endZone)],['Código especial',a=>has(a.specialCode)]]},
 {skill:'R',fields:[['Zona de contacto',a=>!!zone(a.contactZone||a.endZone)],['Tipo de recepción',a=>has(a.skillSubtype)],['Saque recibido',a=>has(a.receivedServeType)],['Coordenada contacto',a=>has(a.contactCoordinate)]]},
 {skill:'E',fields:[['Destino colocación',a=>has(a.setTarget)],['Tempo',a=>has(a.setTempo)],['Setter call',a=>has(a.setterCall)],['Tipo de colocación DV',a=>has(a.dvSetType)],['Gesto',a=>has(a.skillSubtype)]]},
 {skill:'A',fields:[['Origen',a=>!!zone(a.startZone)],['Destino / cono',a=>!!zone(a.endZone)||has(a.endCone)],['Tempo',a=>has(a.attackTempo)],['Combinación',a=>has(a.attackCombo)],['Dirección',a=>has(a.attackDirection)],['Bloqueadores',a=>has(a.blockers)],['Attack code',a=>has(a.attackCode)],['Tipo ataque',a=>has(a.skillSubtype)],['Set type DV',a=>has(a.dvSetType)],['Coordenada origen',a=>has(a.startCoordinate)],['Coordenada destino',a=>has(a.endCoordinate)]]},
 {skill:'B',fields:[['Zona',a=>!!zone(a.contactZone||a.startZone)],['Bloqueadores',a=>has(a.blockers)],['Objetivo',a=>has(a.blockTargetNumber)],['Subtipo',a=>has(a.skillSubtype)]]},
 {skill:'D',fields:[['Zona de contacto',a=>!!zone(a.contactZone||a.endZone)],['Tipo defensa',a=>has(a.skillSubtype)],['Coordenada contacto',a=>has(a.contactCoordinate)]]}
];
function coverageFor(rows){return checks.flatMap(check=>{
 const relevant=rows.filter(r=>r.skill===check.skill);
 return check.fields.map(([label,fn])=>{let n=0;for(const x of relevant)if(fn(x.a))n++;
  return {skill:check.skill,field:label,n,total:relevant.length,pct:pct(n,relevant.length)};
 })
});}
function playByPlay(rallies,target){
 const list=[];let cumulative=0;
 for(const r of rallies)if(r.winning){cumulative+=r.winning===target?1:-1;list.push({r,diff:cumulative})}
 return list;
}
function model(m,bridge,filters={}){
 const target=filters.team==='opponent'?'opponent':'ours';
 const extracted=extract(m,bridge);
 const rr=extracted.rallies.filter(r=>r.winning&&(!filters.set||r.set===Number(filters.set))&&(!filters.rotation||(target==='ours'?r.rotation:r.opponentRotation)===Number(filters.rotation)));
 const acts=rr.flatMap(r=>r.actions).filter(a=>a.team===target);
 const sk=skillsFor(acts),points=pointsFor(rr,target),rotations=rotationsFor(rr,target);
 const chains=receptionChains(rr,target),pairs=setterPairs(rr,target);
 const att=acts.filter(a=>a.skill==='A'),receives=acts.filter(a=>a.skill==='R');
 const zoneCounts=groupBy(att.filter(a=>zone(a.a.endZone)),a=>zone(a.a.endZone));
 const playerGroups=groupBy(acts,a=>a.player).map(([name,rows])=>({name,n:rows.length,skills:skillsFor(rows)}));
 const quality=coverageFor(acts),timeline=playByPlay(rr,target);
 return {match:m?.id||'',target,filters,extracted,invalidRallies:extracted.rallies.filter(r=>!r.winning).length,unknownServe:rr.filter(r=>!r.serving).length,rallies:rr,actions:acts,skills:sk,points,rotations,chains,pairs,
  attacks:att,receives,zoneCounts,playerGroups,quality,timeline,videoCount:acts.filter(a=>a.video).length};
}
function insights(data){
 const out=[];const {points,skills:sk,rotations,chains,pairs,attacks,receives,quality,videoCount,actions}=data;
 const min=8;
 const smallest=rotations.filter(r=>r.k1.n>=min).sort((a,b)=>a.k1.pct-b.k1.pct)[0];
 if(smallest){out.push({kind:'warn',title:`Revisar side-out en R${smallest.rotation}`,
  detail:`${smallest.k1.w}/${smallest.k1.n} rallies (${fmt(smallest.k1.pct)}). Es la rotación con menor conversión entre las que tienen al menos ${min} oportunidades.`,
  how:'Comparar recepción, destino de colocación y ataque; la rotación no demuestra la causa.',drill:{rotation:String(smallest.rotation),context:'k1lost'}})}
 const rec=sk.R;if(rec&&rec.n>=min&&rec.positivePct<50){out.push({kind:'warn',title:'Calidad de recepción baja',
  detail:`${rec.positive}/${rec.n} recepciones positivas o perfectas (${fmt(rec.positivePct)}).`,
  how:'Revisar tipos de saque, receptor y zona de contacto.',drill:{skill:'R',rating:'negative'}})}
 const atk=sk.A;if(atk&&atk.n>=min&&atk.eff<0){out.push({kind:'warn',title:'Ataque con eficiencia negativa',
  detail:`${atk.kills} puntos, ${atk.errors} errores y ${atk.blocked} bloqueos en ${atk.n} ataques (EFF ${fmt(atk.eff)}).`,
  how:'Cruzar rotación, tempo, combinación y número de bloqueadores.',drill:{skill:'A',rating:'attackerror'}})}
 const positives=chains.filter(x=>x.positive),bad=chains.filter(x=>!x.positive),pwin=positives.filter(x=>x.outcome).length,bwin=bad.filter(x=>x.outcome).length;
 if(positives.length>=min&&bad.length>=min){out.push({kind:'info',title:'Comparativa según la primera recepción',
  detail:`Side-out tras recepción +/#: ${pwin}/${positives.length} (${fmt(pct(pwin,positives.length))}); tras otras valoraciones: ${bwin}/${bad.length} (${fmt(pct(bwin,bad.length))}).`,
  how:'Asociación observada dentro del rally, no prueba causal.',drill:{skill:'R'}})}
 const setterMissing=pairs.filter(x=>x.target==='Sin codificar').length;
 if(pairs.length>=min&&setterMissing/pairs.length>0.5){out.push({kind:'data',title:'Distribución del colocador poco codificada',
  detail:`${setterMissing}/${pairs.length} colocaciones no tienen destino/combinación explícita.`,
  how:'Añadir destino DataVolley y setter calls durante el análisis de vídeo.',drill:{skill:'E'}})}
 if(actions.length&&videoCount<actions.length/2){out.push({kind:'data',title:'Referencias de vídeo incompletas',
  detail:`${videoCount}/${actions.length} acciones tienen tiempo de vídeo explícito o calculable.`,
  how:'Usar el asistente de sincronización para vincular el partido.',drill:{}})}
 if(!out.length){out.push({kind:'info',title:'Sin alertas tácticas con muestra suficiente',detail:`${points.rallies} rallies cerrados y ${actions.length} acciones codificadas para este filtro.`,how:'Explora los desgloses y completa los campos con cobertura baja.',drill:{}})}
 return out;
}
function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`}
function csv(rows){return rows.map(r=>r.map(csvCell).join(';')).join('\r\n')+'\r\n'}
function rowsExport(data){
 const header=['set','rally','equipo_saque','ganador','rotacion','rotacion_rival','equipo_accion','jugador','fundamento','valoracion','codigo','origen','destino','contacto','cono','tipo_saque','tipo_saque_recibido','tipo_accion','tempo_colocacion','tempo_ataque','setter_call','set_target','attack_combo','attack_code','direccion','bloqueadores','atacante_objetivo','video_time','scout_ms'];
 const rows=[header];
 for(const r of data.rallies)for(const x of r.actions){const a=x.a;
  rows.push([r.set,r.index,r.serving,r.winning,r.rotation,r.opponentRotation,x.team,x.player,x.skill,x.ev,x.code,a.startZone,a.endZone,a.contactZone,a.endCone,a.serveType,a.receivedServeType,a.skillSubtype,a.setTempo,a.attackTempo,a.setterCall,a.setTarget,a.attackCombo,a.attackCode,a.attackDirection,a.blockers,a.blockTargetNumber,a.videoTime,a.scoutMs]);}
 return csv(rows);
}
const state={team:'ours',set:'',rotation:'',tab:'summary',lastId:'',refreshCount:0,working:false};
const dataGet=()=>window.VC_SCOUT_REPORT_BRIDGE;
const videoGet=()=>window.VC_SCOUT_VIDEO_BRIDGE;
function currentMatch(){
 const id=txt($('scout-analysis-match')?.value),list=arr(dataGet()?.getMatches?.());
 return list.find(m=>String(m.id)===id)||dataGet()?.getMatchForAnalysis?.()||null;
}
function linkProps(props){return Object.entries(props||{}).filter(([,v])=>has(v)).map(([k,v])=>`data-drill-${esc(k)}="${esc(v)}"`).join(' ')}
const drillBtn=(label,props)=>`<button type="button" class="vc1614-drill" ${linkProps(props)}>${esc(label)} <span aria-hidden="true">▶</span></button>`;
const metric=(name,big,sub,props)=>`<div class="vc1614-metric"><span>${esc(name)}</span><strong>${esc(big)}</strong><small>${esc(sub)}</small>${props?drillBtn('Ver jugadas',props):''}</div>`;
function summaryHtml(data){
 const {skills:sk,points:p,attacks,receives,actions}=data;
 const a=sk.A||{n:0,kills:0,errors:0,blocked:0,eff:null},r=sk.R||{n:0,positive:0,positivePct:null};
 return `<div class="vc1614-metrics">${metric('K1 · Side-out',fmt(p.k1.pct),`${p.k1.w}/${p.k1.n} oportunidades`,{context:'k1'})}
  ${metric('K2 · Break',fmt(p.k2.pct),`${p.k2.w}/${p.k2.n} oportunidades`,{context:'k2'})}
  ${metric('Recepción positiva +/#',fmt(r.positivePct),`${r.positive}/${r.n} acciones`,{skill:'R',rating:'positive'})}
  ${metric('Eficiencia de ataque',fmt(a.eff),`${a.kills} puntos · ${a.errors} err. · ${a.blocked} bloq. / ${a.n} ataques`,{skill:'A'})}</div>
  <p class="vc1614-method">K1/K2 se calculan sobre <b>rallies cerrados</b> según el saque al inicio. Recepción y ataque utilizan <b>acciones codificadas</b>; no se confunden sus denominadores. No se incluye el rally abierto.</p>
  <div class="vc1614-grid-two"><div class="vc1614-card"><h4>Lectura táctica basada en evidencias</h4><div class="vc1614-insights">${insights(data).map(o=>`<div class="vc1614-insight ${o.kind}"><b>${esc(o.title)}</b><p>${esc(o.detail)}</p><small>${esc(o.how)}</small>${drillBtn('Abrir evidencia',o.drill)}</div>`).join('')}</div></div>
  <div class="vc1614-card"><h4>Volumen y muestra</h4><p>${p.rallies} rallies resueltos · ${actions.length} acciones del equipo · ${attacks.length} ataques · ${receives.length} recepciones.</p>
  <div class="vc1614-kv"><span>Puntos ganados</span><b>${p.won}/${p.rallies}</b></div><div class="vc1614-kv"><span>Acciones con vídeo</span><b>${data.videoCount}/${actions.length}</b></div>
  <div class="vc1614-kv"><span>Fuentes de datos</span><b>Scouting de este partido</b></div>
  <p class="vc1614-method">${data.invalidRallies?`${data.invalidRallies} rallies sin ganador se excluyen. `:''}${data.unknownServe?`${data.unknownServe} rallies sin saque inicial no entran en K1/K2. `:''}Con menos de 8 oportunidades, no se generan alertas sobre una rotación. Los patrones son descriptivos, no recomendaciones automáticas concluyentes.</p></div></div>`;
}
function rotationsHtml(data){return `<div class="vc1614-card"><h4>K1, K2 y resultado por rotación</h4><div class="vc1614-table-wrap"><table><thead><tr><th>Rotación</th><th>K1 Side-out</th><th>K2 Break</th><th>Rallies</th><th>G-P rallies</th><th>Vídeo</th></tr></thead><tbody>${data.rotations.map(r=>`<tr><td><b>R${r.rotation}</b></td><td>${fmt(r.k1.pct)} <small>(${r.k1.w}/${r.k1.n})</small></td><td>${fmt(r.k2.pct)} <small>(${r.k2.w}/${r.k2.n})</small></td><td>${r.rallies}</td><td>${signed(2*r.won-r.rallies)}</td><td>${drillBtn('Jugadas',{rotation:r.rotation})}</td></tr>`).join('')}</tbody></table></div><p class="vc1614-method">G-P rallies = rallies ganados − rallies perdidos. No es el G-P técnico de una jugadora.</p></div>`}
function sequencesHtml(data){
 const ch=data.chains,pairs=data.pairs;
 const recGroups=[['Recepción # o +',ch.filter(x=>x.positive)],['Recepción restante',ch.filter(x=>!x.positive)]];
 const contexts=recGroups.map(([label,items])=>{const w=items.filter(x=>x.outcome).length,att=items.filter(x=>x.attack).length,kills=items.filter(x=>x.attack?.ev==='#').length;
  return `<tr><td>${esc(label)}</td><td>${items.length}</td><td>${w}/${items.length} <b>${fmt(pct(w,items.length))}</b></td><td>${att}/${items.length}</td><td>${att?`${kills}/${att}`:'—'}</td></tr>`}).join('');
 const groups=groupBy(pairs,p=>p.target).slice(0,12);
 const pairsHtml=groups.map(([label,items])=>{const attacks=items.filter(x=>x.attack).map(x=>x.attack),n=attacks.length,kill=attacks.filter(x=>x.ev==='#').length,err=attacks.filter(x=>x.ev==='=').length,blocked=attacks.filter(x=>x.ev==='/').length;
  return `<tr><td>${esc(label)}</td><td>${items.length}</td><td>${fmt(pct(items.length,pairs.length))}</td><td>${n}</td><td>${fmt(pct(kill,n))}</td><td>${fmt(pct(kill-err-blocked,n))}</td></tr>`}).join('');
 return `<div class="vc1614-card"><h4>Recepción → colocación → ataque → rally</h4><p>Se usa la primera recepción del equipo por rally y las acciones posteriores, cuando están presentes. Cada rally se cuenta una sola vez para el side-out.</p><div class="vc1614-table-wrap"><table><thead><tr><th>Recepción</th><th>Rallies</th><th>Rally ganado</th><th>Con ataque registrado</th><th>Ataque # / intentos</th></tr></thead><tbody>${contexts}</tbody></table></div><p class="vc1614-method">La clasificación describe asociaciones. En una transición posterior dentro del mismo rally puede haber acciones adicionales que no aparecen en esta primera cadena.</p></div>
 <div class="vc1614-card"><h4>Distribución del colocador y ataque posterior</h4><p>${pairs.length} colocaciones registradas. Destino declarado cuando existe; no se infiere el destino si falta.</p><div class="vc1614-table-wrap"><table><thead><tr><th>Destino/combinación</th><th>Uso</th><th>Frecuencia</th><th>Ataques vinculados</th><th>Kill</th><th>EFF</th></tr></thead><tbody>${pairsHtml||'<tr><td colspan="6">Sin colocaciones codificadas.</td></tr>'}</tbody></table></div></div>`;
}
function skillsHtml(data){
 const rows=Object.entries(skills).map(([code,label])=>{const g=data.skills[code];if(!g?.n)return'';
  return `<tr><td>${esc(label)}</td><td>${g.n}</td><td>${g.perfect}</td><td>${g.positive}</td><td>${g.errors}</td><td>${code==='A'?g.blocked:'—'}</td><td>${fmt(g.positivePct)}</td><td>${code==='A'?fmt(g.eff):'—'}</td><td>${drillBtn('Vídeo',{skill:code})}</td></tr>`}).join('');
 const byPlayer=data.playerGroups.slice(0,20).map(p=>`<tr><td>${esc(p.name)}</td><td>${p.n}</td><td>${p.skills.S?.n||0}</td><td>${p.skills.R?.n||0}</td><td>${p.skills.A?.n||0}</td><td>${p.skills.B?.n||0}</td><td>${drillBtn('Jugadas',{player:p.name})}</td></tr>`).join('');
 return `<div class="vc1614-card"><h4>Desglose completo por fundamento</h4><div class="vc1614-table-wrap"><table><thead><tr><th>Fundamento</th><th>Total</th><th>#</th><th>#/+</th><th>=</th><th>Bloqueado /</th><th>% positivo</th><th>EFF ataque</th><th>Vídeo</th></tr></thead><tbody>${rows||'<tr><td colspan="9">Sin acciones codificadas.</td></tr>'}</tbody></table></div><p class="vc1614-method">El símbolo # tiene diferente interpretación por fundamento. EFF se muestra solo para ataque: (# − = − /)/total. Los demás fundamentos usan su distribución de evaluaciones.</p></div>
 <div class="vc1614-card"><h4>Contribución por jugadora / jugador</h4><div class="vc1614-table-wrap"><table><thead><tr><th>Jugador</th><th>Acciones</th><th>Saques</th><th>Recepciones</th><th>Ataques</th><th>Bloqueos</th><th>Vídeo</th></tr></thead><tbody>${byPlayer||'<tr><td colspan="7">Sin jugadores identificados.</td></tr>'}</tbody></table></div></div>`;
}
function zonesHtml(data){
 const n=data.zoneCounts.reduce((a,[,items])=>a+items.length,0),map=new Map(data.zoneCounts);
 const grid=[4,3,2,7,8,9,5,6,1].map(z=>{const items=map.get(String(z))||[],count=items.length,percent=pct(count,n),opacity=n?(0.1+count/Math.max(...data.zoneCounts.map(([,x])=>x.length),1)*0.7):0.1;
 return `<button type="button" data-drill-skill="A" data-zone="${z}" title="${count} ataques registrados con destino Z${z}"><span>Z${z}</span><strong>${count}</strong><small>${fmt(percent)}</small><i style="opacity:${opacity}"></i></button>`}).join('');
 const attackByBlocker=groupBy(data.attacks,a=>has(a.a.blockers)?String(a.a.blockers):'Sin registrar').map(([count,items])=>{
  const kills=items.filter(x=>x.ev==='#').length,errors=items.filter(x=>x.ev==='=').length,blocked=items.filter(x=>x.ev==='/').length;
  return `<tr><td>${esc(count)}</td><td>${items.length}</td><td>${fmt(pct(kills,items.length))}</td><td>${fmt(pct(kills-errors-blocked,items.length))}</td></tr>`}).join('');
 const types=groupBy(data.attacks,a=>a.a.attackDirection).slice(0,8).map(([dir,items])=>`<tr><td>${esc(dir)}</td><td>${items.length}</td><td>${fmt(pct(items.filter(x=>x.ev==='#').length,items.length))}</td></tr>`).join('');
 return `<div class="vc1614-grid-two"><div class="vc1614-card"><h4>Mapa de destino del ataque · 9 zonas DV</h4><p>Cuenta solo ataques con zona de destino explícita (${n}/${data.attacks.length}). La superficie de color indica frecuencia.</p><div class="vc1614-court">${grid}</div><p class="vc1614-method">Las subzonas A-D se conservan en los datos y CSV. El mapa principal agrupa por zona para ofrecer una primera lectura.</p></div>
 <div class="vc1614-card"><h4>Condicionantes del ataque</h4><p>Rendimiento según número de bloqueadores <b>registrado</b>.</p><div class="vc1614-table-wrap"><table><thead><tr><th>Bloqueadores</th><th>Ataques</th><th>Kill</th><th>EFF</th></tr></thead><tbody>${attackByBlocker||'<tr><td colspan="4">No hay ataques.</td></tr>'}</tbody></table></div><h4>Dirección codificada</h4><div class="vc1614-table-wrap"><table><thead><tr><th>Dirección</th><th>Ataques</th><th>Kill</th></tr></thead><tbody>${types||'<tr><td colspan="3">No hay ataques con dirección.</td></tr>'}</tbody></table></div></div></div>`;
}
function advancedHtml(data){
 const {actions}=data;
 const configs=[
  {name:'Saque · tipo de servicio',skill:'S',get:a=>a.serveType},
  {name:'Recepción · saque recibido',skill:'R',get:a=>a.receivedServeType},
  {name:'Recepción · gesto',skill:'R',get:a=>a.skillSubtype},
  {name:'Colocación · tempo',skill:'E',get:a=>a.setTempo},
  {name:'Colocación · setter call',skill:'E',get:a=>a.setterCall},
  {name:'Colocación · tipo DV',skill:'E',get:a=>a.dvSetType},
  {name:'Ataque · tempo',skill:'A',get:a=>a.attackTempo},
  {name:'Ataque · combinación',skill:'A',get:a=>a.attackCombo},
  {name:'Ataque · código DV',skill:'A',get:a=>a.attackCode},
  {name:'Ataque · gesto',skill:'A',get:a=>a.skillSubtype},
  {name:'Ataque · cono final',skill:'A',get:a=>a.endCone},
  {name:'Bloqueo · tipo',skill:'B',get:a=>a.skillSubtype},
  {name:'Defensa · tipo',skill:'D',get:a=>a.skillSubtype}
 ];
 const cards=configs.map(cfg=>{
  const rows=actions.filter(x=>x.skill===cfg.skill),valid=rows.filter(x=>has(cfg.get(x.a))),groups=groupBy(valid,x=>cfg.get(x.a));
  if(!rows.length)return'';
  const table=groups.slice(0,10).map(([value,items])=>{
   const kill=items.filter(x=>x.ev==='#').length,errors=items.filter(x=>x.ev==='=').length,blocked=items.filter(x=>x.skill==='A'&&x.ev==='/').length;
   return `<tr><td>${esc(value)}</td><td>${items.length}</td><td>${fmt(pct(items.length,valid.length))}</td><td>${fmt(pct(kill,items.length))}</td><td>${cfg.skill==='A'?fmt(pct(kill-errors-blocked,items.length)):'—'}</td></tr>`
  }).join('');
  return `<div class="vc1614-card"><h4>${esc(cfg.name)}</h4><p>${valid.length}/${rows.length} acciones con este dato explícito.</p><div class="vc1614-table-wrap"><table><thead><tr><th>Valor registrado</th><th>Acciones</th><th>Uso</th><th>#</th><th>EFF ataque</th></tr></thead><tbody>${table||'<tr><td colspan="5">Sin valores codificados.</td></tr>'}</tbody></table></div></div>`
 }).filter(Boolean);
 return `<p class="vc1614-method">Análisis de códigos extendidos realmente introducidos. Los valores son los códigos originales de Volley Coach/DataVolley, no nombres inventados. Consulta el catálogo de campos en «Calidad de datos».</p><div class="vc1614-grid-two">${cards.join('')||'<div class="vc1614-card">No hay fundamentos codificados para este filtro.</div>'}</div>`;
}
function qualityHtml(data){
 const list=data.quality.filter(x=>x.total>0).sort((a,b)=>(a.pct??0)-(b.pct??0));
 return `<div class="vc1614-card"><h4>Calidad y cobertura de codificación</h4><p>No se deducen velocidades, trayectorias o datos no introducidos. Cada porcentaje se calcula solo sobre el fundamento al que corresponde el campo.</p>
 <div class="vc1614-coverage">${list.map(x=>`<div class="vc1614-coverage-row"><span>${esc(skills[x.skill])} · ${esc(x.field)}</span><div class="vc1614-track"><i style="width:${x.pct??0}%"></i></div><b>${x.n}/${x.total} · ${fmt(x.pct)}</b></div>`).join('')||'<p>Sin datos avanzados para el filtro elegido.</p>'}</div>
 <p class="vc1614-method">Vídeo vinculado: ${data.videoCount}/${data.actions.length}. Si un campo tiene cobertura baja, no interpretes las distribuciones como representativas de todo el partido.</p></div>`;
}
function playHtml(data){
 let currentSet=0;
 const items=data.timeline.slice(-180).map(x=>{
  const note=x.r.set!==currentSet?`Set ${x.r.set} · `:'';currentSet=x.r.set;
  return `<div class="vc1614-score-chip ${x.r.winning===data.target?'win':'loss'}" title="${esc(note+'Rally '+x.r.index)}"><small>${x.r.winning===data.target?'G':'P'}</small><b>${signed(x.diff)}</b></div>`
 }).join('');
 return `<div class="vc1614-card"><h4>Play-by-play · tendencia del marcador</h4><p>Los últimos ${Math.min(180,data.timeline.length)} rallies cerrados. Verde: ganado. Rojo: perdido. G-P acumulado del filtro.</p><div class="vc1614-playbar">${items||'<p>Sin rallies cerrados.</p>'}</div><p class="vc1614-method">La tendencia es descriptiva; la selección por set y rotación puede omitir rallies intermedios.</p></div>`;
}
function renderTab(data){
 switch(state.tab){case 'rotations':return rotationsHtml(data);case 'sequences':return sequencesHtml(data);case 'skills':return skillsHtml(data);case 'zones':return zonesHtml(data);case 'quality':return qualityHtml(data);case 'advanced':return advancedHtml(data);case 'play':return playHtml(data);default:return summaryHtml(data)}
}
function download(name,content,type='text/plain;charset=utf-8'){
 const b=new Blob([content],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);
}
function exportCurrent(format){
 const m=currentMatch();if(!m)return;
 const data=model(m,videoGet(),{team:state.team,set:state.set,rotation:state.rotation});
 const name=`volley-coach-analysis-${m.id||'partido'}-${state.team}-${state.set||'todo'}`;
 if(format==='csv')download(name+'.csv',rowsExport(data),'text/csv;charset=utf-8');
 else download(name+'.json',JSON.stringify({version:VERSION,matchId:m.id,filter:{team:state.team,set:state.set,rotation:state.rotation},
  generatedAt:new Date().toISOString(),metrics:{points:data.points,skills:data.skills,rotations:data.rotations,coverage:data.quality,insights:insights(data)},
  dictionary:{k1:'Rallies ganados al recibir / rallies en recepción',k2:'Rallies ganados al sacar / rallies en saque',effAttack:'(# − = − /) / ataques ×100',gpRallies:'Rallies ganados − rallies perdidos',receptionPositive:'(# + +) / recepciones ×100'},
  note:'No exporta archivos de vídeo. No incluye el rally abierto.'},null,2),'application/json;charset=utf-8');
}
function refresh(){
 const panel=$('vc1614-intelligence'),view=$('scout-analysis');
 if(!panel||!view?.classList.contains('active')||state.working)return;
 state.working=true;
 try{
  const m=currentMatch();if(!m){$('vc1614-body').innerHTML='<p>No hay un scouting seleccionado. Abre un partido para calcular el análisis.</p>';return}
  const id=String(m.id);
  if(state.lastId!==id){state.lastId=id;state.set='';state.rotation='';}
  const sets=arr(m.sets).map(s=>String(s.number));
  const setSel=$('vc1614-set');
  const previous=state.set;
  const wanted=['',...sets];
  if(setSel.options.length!==wanted.length||[...setSel.options].some((o,i)=>o.value!==wanted[i])){
    setSel.replaceChildren(...wanted.map(v=>{const op=document.createElement('option');op.value=v;op.textContent=v?'Set '+v:'Todos los sets';return op}));
  }
  state.set=sets.includes(previous)?previous:'';setSel.value=state.set;
  $('vc1614-team').value=state.team;$('vc1614-rotation').value=state.rotation;
  const data=model(m,videoGet(),{team:state.team,set:state.set,rotation:state.rotation});
  $('vc1614-sample').textContent=`${data.points.rallies} rallies cerrados · ${data.actions.length} acciones · ${data.videoCount} con tiempo de vídeo`;
  $('vc1614-body').innerHTML=renderTab(data);
  document.querySelectorAll('#vc1614-tabs [data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===state.tab)));
  state.refreshCount++;
 }catch(err){console.error('VC1614 analysis error',err);const body=$('vc1614-body');if(body)body.textContent='No se ha podido calcular el análisis: '+String(err.message||err)}
 finally{state.working=false}
}
function goVideo(props){
 const api=window.VC_VIDEO_ANALYTICS_1612;
 if(!api?.openKeys){alert('Video Analytics no está disponible con el enlace de evidencia actualizado.');return false}
 const m=currentMatch();if(!m)return false;
 const f={team:state.team,set:state.set,rotation:state.rotation,...props};
 const data=model(m,videoGet(),{team:f.team,set:f.set,rotation:f.rotation});
 const rows=data.rallies.filter(r=>{
   if(f.context==='k1')return !!r.serving&&r.serving!==f.team;
   if(f.context==='k2')return r.serving===f.team;
   if(f.context==='k1lost')return !!r.serving&&r.serving!==f.team&&r.winning&&r.winning!==f.team;
   return true;
 }).flatMap(r=>r.actions).filter(a=>{
   if(a.team!==f.team)return false;
   if(f.skill&&a.skill!==f.skill)return false;
   if(f.player&&a.player!==f.player)return false;
   if(f.zone&&zone(a.a.endZone)!==String(f.zone))return false;
   if(f.rating){
     if(f.rating==='negative'&&!['!','-','/','='].includes(a.ev))return false;
     else if(f.rating==='attackerror'&&!['=','/'].includes(a.ev))return false;
     else if(f.rating==='positive'&&!['#','+'].includes(a.ev))return false;
     else if(!['negative','attackerror','positive'].includes(f.rating)&&f.rating!==a.ev)return false;
   }
   return true;
 });
 if(!rows.length){alert('No hay acciones codificadas para abrir esta evidencia. Revisa la selección o completa el scouting.');return false}
 return !!api.openKeys(m.id,rows.map(x=>x.key));
}
function mount(){
 if($('vc1614-intelligence'))return;
 const view=$('scout-analysis');if(!view)return;
 const root=document.createElement('section');root.id='vc1614-intelligence';root.setAttribute('aria-label','Analysis Intelligence Pro');
 root.innerHTML=`<div class="vc1614-heading"><div><span>ANALYSIS INTELLIGENCE PRO · V16.1.4</span><h3>Del código a la decisión táctica</h3><p>K1/K2, secuencias, rotaciones, distribución, zonas y calidad del scouting, sin estadísticas inventadas.</p></div><div class="vc1614-heading-actions"><button type="button" id="vc1614-csv">Exportar CSV</button><button type="button" id="vc1614-json">Informe JSON</button></div></div>
 <div class="vc1614-toolbar"><label>Equipo<select id="vc1614-team"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label>Set<select id="vc1614-set"><option value="">Todos los sets</option></select></label><label>Rotación<select id="vc1614-rotation"><option value="">R1–R6</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><span id="vc1614-sample" class="vc1614-sample">Sin datos</span></div>
 <div class="vc1614-tabs" id="vc1614-tabs" role="tablist" aria-label="Áreas del análisis">${[['summary','Resumen'],['rotations','Rotaciones'],['sequences','Secuencias'],['skills','Jugadores y acciones'],['zones','Zonas y dirección'],['advanced','DataVolley avanzado'],['quality','Calidad de datos'],['play','Punto a punto']].map(([k,v])=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${String(k==='summary')}">${v}</button>`).join('')}</div>
 <div id="vc1614-body" class="vc1614-body" aria-live="polite"></div><p class="vc1614-footer">Datos reales del scouting. Sin medidas biomecánicas ni seguimiento automático del balón. Para profundizar utiliza «Análisis técnico».</p>`;
 const after=view.querySelector('.scout-analysis-header');if(after)after.after(root);else view.prepend(root);
 const switcher=document.createElement('div');switcher.id='vc1614-view-switch';switcher.innerHTML='<button type="button" data-mode="intelligence" aria-pressed="true">Lectura inteligente</button><button type="button" data-mode="technical" aria-pressed="false">Análisis técnico completo</button>';
 root.before(switcher);
 function mode(next){view.dataset.vc1614View=next;switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));if(next==='intelligence')refresh()}
 switcher.addEventListener('click',ev=>{const b=ev.target.closest('[data-mode]');if(b)mode(b.dataset.mode)});
 root.addEventListener('change',ev=>{const id=ev.target.id;
  if(id==='vc1614-team')state.team=ev.target.value;
  if(id==='vc1614-set')state.set=ev.target.value;
  if(id==='vc1614-rotation')state.rotation=ev.target.value;
  refresh();
 });
 root.addEventListener('click',ev=>{
  const tab=ev.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;refresh();return}
  const drill=ev.target.closest('[data-drill-skill], [data-drill-player], [data-drill-rating], [data-drill-rotation], .vc1614-drill');
  if(drill){const props={};for(const [k,v] of Object.entries(drill.dataset))if(k.startsWith('drill')){props[k.charAt(5).toLowerCase()+k.slice(6)]=v}goVideo(props);return}
  if(ev.target.closest('#vc1614-csv'))exportCurrent('csv');
  if(ev.target.closest('#vc1614-json'))exportCurrent('json');
 });
 $('scout-analysis-match')?.addEventListener('change',()=>{state.lastId='';requestAnimationFrame(refresh)});
 new MutationObserver(()=>{if(view.classList.contains('active'))requestAnimationFrame(refresh)}).observe(view,{attributes:true,attributeFilter:['class']});
 // Existing analysis functions are left untouched. Only refresh our separate, read-only panel.
 const base=window.scoutRenderAnalysis;
 if(typeof base==='function'&&!base.__vc1614){const wrapped=function(...args){const out=base.apply(this,args);if(view.classList.contains('active'))queueMicrotask(refresh);return out};wrapped.__vc1614=true;window.scoutRenderAnalysis=wrapped}
 mode('intelligence');
}
function installStyle(){if($('vc1614-style'))return;const style=document.createElement('style');style.id='vc1614-style';style.textContent=`
#scout-analysis[data-vc1614-view="intelligence"] :is(.scout-analysis-kpis,.scout-v750-pro-panel,.scout-analysis-grid,#vc1612-analytics){display:none!important}
#scout-analysis[data-vc1614-view="technical"] :is(#vc1614-intelligence){display:none!important}
#scout-analysis #vc1614-view-switch{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
#scout-analysis #vc1614-view-switch button{padding:10px 13px!important;border-radius:9px!important;border:1px solid #cddfeb!important;background:#f6faff!important;color:#406c8d!important;font:750 12px system-ui!important}
#scout-analysis #vc1614-view-switch button[aria-pressed="true"]{color:white!important;background:#174f8b!important;border-color:#174f8b!important}
#vc1614-intelligence{background:#fff;border:1px solid #d6e3ed;border-radius:16px;padding:18px;margin:10px 0 20px;box-shadow:0 8px 28px rgba(18,55,88,.06);font:500 12px/1.5 system-ui,sans-serif;color:#284863;min-width:0}
#vc1614-intelligence *{box-sizing:border-box}
#vc1614-intelligence .vc1614-heading{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}
#vc1614-intelligence .vc1614-heading span{font-size:10px;font-weight:850;letter-spacing:.11em;color:#4b8cbf}
#vc1614-intelligence .vc1614-heading h3{font-size:21px!important;color:#163954!important;margin:4px 0!important}
#vc1614-intelligence .vc1614-heading p{color:#68829a;font-size:12px;margin:0}
#vc1614-intelligence .vc1614-heading-actions{display:flex;gap:6px}
#vc1614-intelligence button{cursor:pointer}
#vc1614-intelligence .vc1614-heading-actions button{background:#eef5fc!important;border:1px solid #cedfec!important;color:#2a628e!important;border-radius:8px!important;min-height:36px!important;font:750 11px system-ui!important;padding:7px 10px!important}
#vc1614-intelligence .vc1614-toolbar{margin:16px 0 11px;display:flex;align-items:end;gap:9px;flex-wrap:wrap}
#vc1614-intelligence .vc1614-toolbar label{display:grid;gap:3px;color:#658097;font-size:10px;font-weight:850}
#vc1614-intelligence .vc1614-toolbar select{min-width:130px;min-height:37px;background:#fff;border:1px solid #d3e1ec;border-radius:8px;color:#1f4b70;font:700 12px system-ui;padding:6px 9px}
#vc1614-intelligence .vc1614-sample{margin-left:auto;background:#eef5fb;color:#315f81;font-size:11px;border-radius:8px;padding:8px 10px;font-weight:750}
#vc1614-intelligence .vc1614-tabs{display:flex;gap:4px;overflow-x:auto;padding:5px 0 9px;border-bottom:1px solid #e0e9f1}
#vc1614-intelligence .vc1614-tabs button{flex:0 0 auto;border:0!important;border-radius:8px!important;padding:9px 12px!important;background:transparent!important;color:#61809a!important;font:750 11px system-ui!important;white-space:nowrap}
#vc1614-intelligence .vc1614-tabs button[aria-selected="true"]{background:#e8f2ff!important;color:#17568f!important}
#vc1614-intelligence .vc1614-body{display:grid;gap:14px;margin-top:13px}
#vc1614-intelligence .vc1614-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
#vc1614-intelligence .vc1614-metric,#vc1614-intelligence .vc1614-card{background:#fbfdff;border:1px solid #dfe9f2;border-radius:12px;padding:13px;min-width:0}
#vc1614-intelligence .vc1614-metric{display:flex;flex-direction:column;gap:3px}
#vc1614-intelligence .vc1614-metric>span{font-size:10px;color:#67839a;font-weight:750}
#vc1614-intelligence .vc1614-metric>strong{font-size:25px;color:#183f64;font-variant-numeric:tabular-nums;line-height:1.2}
#vc1614-intelligence .vc1614-metric>small{font-size:10px;color:#70889b;min-height:27px}
#vc1614-intelligence .vc1614-drill{margin-top:auto;align-self:start;min-height:30px!important;border:1px solid #cbdfee!important;background:#edf5fd!important;color:#235f91!important;border-radius:7px!important;font:750 10px system-ui!important;padding:6px 9px!important}
#vc1614-intelligence .vc1614-drill span{font-size:9px}
#vc1614-intelligence .vc1614-grid-two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px}
#vc1614-intelligence .vc1614-card h4{font-size:14px!important;color:#194569!important;margin:0 0 9px!important}
#vc1614-intelligence .vc1614-card p{color:#657f95;margin:3px 0 12px}
#vc1614-intelligence .vc1614-insights{display:grid;gap:8px}
#vc1614-intelligence .vc1614-insight{border-left:3px solid #5485af;background:#f1f7fc;padding:9px 11px;border-radius:7px}
#vc1614-intelligence .vc1614-insight.warn{border-left-color:#c18a3a;background:#fff9ed}
#vc1614-intelligence .vc1614-insight.data{border-left-color:#a1a7ac;background:#f7f8fa}
#vc1614-intelligence .vc1614-insight>b{font-size:12px;color:#214866}
#vc1614-intelligence .vc1614-insight p{margin:5px 0;color:#46647b;font-size:11px}
#vc1614-intelligence .vc1614-insight>small{display:block;color:#71899d;font-size:10px;margin-bottom:7px}
#vc1614-intelligence .vc1614-method,#vc1614-intelligence .vc1614-footer{font-size:10px;color:#758da0;line-height:1.5;margin:6px 0 0}
#vc1614-intelligence .vc1614-kv{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #e1ebf2;padding:8px 0}
#vc1614-intelligence .vc1614-table-wrap{overflow-x:auto;max-width:100%}
#vc1614-intelligence table{border-collapse:collapse;width:100%;font-size:11px;white-space:nowrap}
#vc1614-intelligence td,#vc1614-intelligence th{border-bottom:1px solid #e3ebf2;padding:9px 10px;text-align:left;color:#365772}
#vc1614-intelligence th{background:#eef5fb;color:#5d7991;font-size:10px}
#vc1614-intelligence td small{color:#7c92a4;font-size:10px}
#vc1614-intelligence .vc1614-coverage{display:grid;gap:8px}
#vc1614-intelligence .vc1614-coverage-row{display:grid;grid-template-columns:180px minmax(0,1fr) 90px;gap:9px;align-items:center;font-size:10px}
#vc1614-intelligence .vc1614-coverage-row>b{text-align:right;font-size:10px}
#vc1614-intelligence .vc1614-track{height:8px;border-radius:10px;overflow:hidden;background:#e3edf4}
#vc1614-intelligence .vc1614-track i{display:block;background:#377db1;height:100%;border-radius:10px}
#vc1614-intelligence .vc1614-court{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:8px;background:#e4b478;border:3px solid #c79557;border-radius:10px}
#vc1614-intelligence .vc1614-court button{position:relative;overflow:hidden;min-height:66px;display:grid;place-content:center;gap:2px;background:#fffcf7!important;border:1px solid rgba(110,79,42,.45)!important;border-radius:7px!important;color:#234d69!important;font:750 11px system-ui!important}
#vc1614-intelligence .vc1614-court button>i{position:absolute;inset:0;background:#3f8bd8;pointer-events:none}
#vc1614-intelligence .vc1614-court button>span,#vc1614-intelligence .vc1614-court button>strong,#vc1614-intelligence .vc1614-court button>small{position:relative;z-index:1}
#vc1614-intelligence .vc1614-court button strong{font-size:19px;color:#143b5b}
#vc1614-intelligence .vc1614-playbar{display:flex;flex-wrap:wrap;gap:3px}
#vc1614-intelligence .vc1614-score-chip{border-radius:6px;padding:6px;min-width:32px;text-align:center;display:grid;gap:1px}
#vc1614-intelligence .vc1614-score-chip.win{background:#e3f4ea;color:#246743}
#vc1614-intelligence .vc1614-score-chip.loss{background:#fff0eb;color:#a04e43}
@media(max-width:1000px){#vc1614-intelligence .vc1614-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc1614-intelligence .vc1614-grid-two{grid-template-columns:1fr}}
@media(max-width:650px){#vc1614-intelligence{padding:10px}#vc1614-intelligence .vc1614-metrics{gap:5px}#vc1614-intelligence .vc1614-metric{padding:9px}#vc1614-intelligence .vc1614-metric>strong{font-size:21px}#vc1614-intelligence .vc1614-toolbar{gap:6px}#vc1614-intelligence .vc1614-toolbar select{min-width:90px}#vc1614-intelligence .vc1614-sample{margin-left:0;width:100%}#vc1614-intelligence .vc1614-coverage-row{grid-template-columns:110px minmax(0,1fr) 74px;gap:5px}}
`;
 document.head.appendChild(style);
}
installStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.VC_ANALYSIS_INTELLIGENCE_1614={version:VERSION,extract,model,insights,coverageFor,rowsExport,refresh,diagnostics:()=>({...state})};
})();
