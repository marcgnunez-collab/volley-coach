/* Volley Coach V19.3.0 · Mesa de preparación de rivales.
 * Lectura exclusivamente de scoutings cerrados del motor Analysis Intelligence.
 * No escribe en los partidos, en la nube ni en el reproductor.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_TACTICAL_RIVALS_1930=api;if(root.document)api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.2';
 const arr=v=>Array.isArray(v)?v:[];
 const text=v=>String(v??'').trim();
 const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/\s+/g,' ');
 const safe=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(a,b)=>b>0?Math.round(a*1000/b)/10:null;
 const fmt=v=>v==null?'—':`${v.toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const int=v=>{const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=6?n:0};
 const finished=m=>m?.status==='finished'||m?.resultComplete===true||m?.manualFinalResult?.active===true;
 const date=m=>text(m?.date||m?.createdAt).slice(0,10);
 const unknownOpponent=name=>!name||['rival','sin rival','sin registrar','desconocido'].includes(norm(name));
 const phase=r=>r?.serving==='ours'?'K1':r?.serving==='opponent'?'K2':''; // fases del rival
 function source(matches,extract){
  const rows=[],failures=[];
  for(const match of arr(matches)){
   if(!match||match.id==null)continue;
   try{
    const data=extract(match)||{};
    const rallies=arr(data.rallies);
    for(const r of rallies){
     if(r?.winning!=='ours'&&r?.winning!=='opponent')continue;
     rows.push({match,id:text(match.id),date:date(match),opponent:text(match.opponent),
      set:r.set,rally:r.id,index:r.index,rotation:int(r.opponentRotation),ownRotation:int(r.rotation),
      winner:r.winning,serving:r.serving,phase:phase(r),actions:arr(r.actions),raw:r});
    }
   }catch(_){failures.push(text(match.id));}
  }
  return {rows,failures};
 }
 function rivals(matches){
  const map=new Map();
  for(const m of arr(matches)){
   if(m?.id==null||unknownOpponent(m.opponent))continue;
   const key=norm(m.opponent);
   if(!map.has(key))map.set(key,{key,name:text(m.opponent),matches:0});
   map.get(key).matches++;
  }
  return [...map.values()].sort((a,b)=>b.matches-a.matches||a.name.localeCompare(b.name,'es'));
 }
 function count(rows){return {n:rows.length,w:rows.filter(r=>r.winner==='opponent').length,pct:pct(rows.filter(r=>r.winner==='opponent').length,rows.length)};}
 function attacks(rows){
  return arr(rows).flatMap(r=>arr(r.actions).filter(a=>a?.team==='opponent'&&a?.skill==='A').map(a=>({r,action:a,ev:text(a.ev),player:text(a.player||a.a?.playerNameSnapshot||'Sin identificar'),combo:text(a.a?.attackCombo),direction:text(a.a?.attackDirection)})));
 }
 function attackSummary(items){
  const n=items.length,k=items.filter(a=>a.ev==='#').length,e=items.filter(a=>a.ev==='=').length,b=items.filter(a=>a.ev==='/').length;
  return {n,k,e,b,eff:pct(k-e-b,n),kill:pct(k,n)};
 }
 function reception(rows){
  const list=[];
  for(const r of rows){const rec=r.actions.find(a=>a?.team==='opponent'&&a?.skill==='R');if(rec)list.push(rec)}
  const positive=list.filter(a=>a.ev==='#'||a.ev==='+').length;
  return {n:list.length,positive,pct:pct(positive,list.length),notCoded:rows.length-list.length};
 }
 function zone(v){
  const m=text(v).toUpperCase().match(/^Z?([1-9])(?:[A-D])?$/);
  return m?m[1]:'';
 }
 function rivalActs(r,skill){return arr(r?.actions).filter(x=>x?.team==='opponent'&&x?.skill===skill)}
 function rivalReception(r){return rivalActs(r,'R')[0]||null}
 function receptionCode(r){return text(rivalReception(r)?.ev)}
 function attackHasZone(r,kind,value){return rivalActs(r,'A').some(x=>zone(x?.a?.[kind])===value)}
 // All cells use explicit rotations. Unknown rotation never becomes R1.
 function rotationMatchups(rows){
  return [1,2,3,4,5,6].map(own=>[1,2,3,4,5,6].map(rival=>{
   const entries=arr(rows).filter(r=>r.ownRotation===own&&r.rotation===rival);
   const wins=entries.filter(r=>r.winner==='opponent').length;
   return {own,rival,n:entries.length,wins,pct:pct(wins,entries.length),entries};
  }));
 }
 function zoneDistribution(rows,field){
  const actions=attacks(rows),coded=actions.filter(x=>zone(x.action?.a?.[field]));
  return {total:actions.length,coded:coded.length,missing:actions.length-coded.length,
   values:[1,2,3,4,5,6,7,8,9].map(i=>{
    const list=coded.filter(x=>zone(x.action.a[field])===String(i));
    return {zone:i,n:list.length,pct:pct(list.length,coded.length),rallies:list.map(x=>x.r)};
   })};
 }
 // Setter-to-attack is linked only within the same uninterrupted team possession.
 function setterSequences(rows){
  const sequences=[];
  for(const r of arr(rows)){
   const acts=arr(r.actions);
   for(let i=0;i<acts.length;i++){
    const set=acts[i];if(set?.team!=='opponent'||set.skill!=='E')continue;
    let attack=null;
    for(let j=i+1;j<acts.length;j++){
     const next=acts[j];if(next?.team!=='opponent'||next.skill==='E')break;
     if(next.skill==='A'){attack=next;break}
    }
    let rec=null;
    for(let j=i-1;j>=0;j--){
     const prev=acts[j];if(prev?.team!=='opponent')break;
     if(prev.skill==='R'){rec=prev;break}
    }
    sequences.push({r,set,attack,rec,player:text(set.player)||'Sin identificar',
     target:zone(set.a?.setTarget)||zone(attack?.a?.startZone),
     setTargetCoded:!!zone(set.a?.setTarget),
     tempo:text(set.a?.setTempo||attack?.a?.attackTempo),
     call:text(set.a?.setterCall),recEval:text(rec?.ev)});
   }
  }
  return sequences;
 }
 function setterDistribution(rows){
  const seq=setterSequences(rows);
  return {total:seq.length,withAttack:seq.filter(x=>x.attack).length,withZone:seq.filter(x=>x.target).length,
   byPlayer:groups(seq,x=>x.player).map(g=>({name:g.name,n:g.n,
    attacks:g.entries.filter(x=>x.attack).length,
    zones:groups(g.entries.filter(x=>x.target),x=>'Z'+x.target).map(z=>({name:z.name,n:z.n,pct:pct(z.n,g.entries.filter(x=>x.target).length)})),
    tempos:groups(g.entries.filter(x=>x.tempo),x=>x.tempo),
    calls:groups(g.entries.filter(x=>x.call),x=>x.call),
    codedTarget:g.entries.filter(x=>x.setTargetCoded).length
   }))};
 }
 // Reception-to-attack pairs: no attribution across a change of possession.
 function receptionsToAttack(rows){
  const list=[];
  for(const r of arr(rows)){
   const acts=arr(r.actions);
   for(let i=0;i<acts.length;i++){
    const rec=acts[i];if(rec?.team!=='opponent'||rec.skill!=='R')continue;
    let attack=null;
    for(let j=i+1;j<acts.length;j++){
     const next=acts[j];if(next?.team!=='opponent')break;
     if(next.skill==='R')break;
     if(next.skill==='A'){attack=next;break}
    }
    if(attack)list.push({r,rec,attack,ev:text(rec.ev),zone:zone(attack.a?.startZone)});
   }
  }
  return list;
 }
 function receptionAttackMatrix(rows){
  const list=receptionsToAttack(rows);
  const codes=['#','+','!','-','/','='];
  return {total:list.length,conditions:codes.map(code=>{
   const subset=list.filter(x=>x.ev===code),stats=attackSummary(subset.map(x=>({ev:x.attack.ev})));
   const zones=[1,2,3,4,5,6].map(no=>({zone:no,n:subset.filter(x=>x.zone===String(no)).length}));
   return {code,n:subset.length,stats,zones,knownZone:subset.filter(x=>x.zone).length};
  })};
 }
 function groups(items,key){
  const map=new Map();
  for(const x of arr(items)){const name=text(key(x));if(!name)continue;if(!map.has(name))map.set(name,[]);map.get(name).push(x);}
  return [...map].map(([name,entries])=>({name,entries,n:entries.length})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'));
 }
 function report(matches,extracted,filters={}){
  const key=norm(filters.rival),includeLive=filters.scope==='all';
  const eligible=arr(matches).filter(m=>m?.id!=null&&(!key||norm(m.opponent)===key)&&(includeLive||finished(m)));
  const ids=new Set(eligible.map(m=>text(m.id)));
  const raw=arr(extracted?.rows).filter(r=>ids.has(text(r.id)));
  const missingServing=raw.filter(r=>!r.phase).length;
  const missingRotation=raw.filter(r=>!r.rotation).length;
  const selected=raw.filter(r=>(!filters.phase||r.phase===filters.phase)
   &&(!int(filters.rotation)||r.rotation===int(filters.rotation))
   &&(!int(filters.ownRotation)||r.ownRotation===int(filters.ownRotation))
   &&(!filters.reception||receptionCode(r)===filters.reception)
   &&(!zone(filters.attackStart)||attackHasZone(r,'startZone',zone(filters.attackStart)))
   &&(!zone(filters.attackEnd)||attackHasZone(r,'endZone',zone(filters.attackEnd))));
  const known=selected.filter(r=>r.phase);const k1=count(known.filter(r=>r.phase==='K1'));const k2=count(known.filter(r=>r.phase==='K2'));
  const aa=attacks(selected),rec=reception(selected),byRotation=[1,2,3,4,5,6].map(no=>{
   const r=selected.filter(x=>x.rotation===no),withPhase=r.filter(x=>x.phase);
   return {no,n:r.length,k1:count(withPhase.filter(x=>x.phase==='K1')),k2:count(withPhase.filter(x=>x.phase==='K2')),attack:attackSummary(attacks(r)),evidence:r};
  });
  const byPlayer=groups(aa,x=>x.player).map(g=>({...g,...attackSummary(g.entries)}));
  const combos=groups(aa.filter(a=>a.combo),a=>a.combo);
  const directions=groups(aa.filter(a=>a.direction),a=>a.direction);
  const ordered=eligible.slice().sort((a,b)=>date(a).localeCompare(date(b))||text(a.id).localeCompare(text(b.id)));
  const last=ordered.slice(-3);const prev=ordered.slice(-6,-3);
  const sliceReport=ms=>{const set=new Set(ms.map(m=>text(m.id))),r=selected.filter(x=>set.has(text(x.id))),k=r.filter(x=>x.phase==='K1');return {matches:ms.length,n:k.length,w:k.filter(x=>x.winner==='opponent').length,pct:pct(k.filter(x=>x.winner==='opponent').length,k.length)};};
  const trend={recent:sliceReport(last),previous:sliceReport(prev)};
  const min=Math.min(100,Math.max(3,Number.isFinite(Number(filters.minSample))?Number(filters.minSample):8));
  const qualified=byRotation.filter(x=>x.k1.n>=min);
  const fragile=qualified.slice().sort((a,b)=>a.k1.pct-b.k1.pct||b.k1.n-a.k1.n)[0]||null;
  const strongest=qualified.slice().sort((a,b)=>b.k1.pct-a.k1.pct||b.k1.n-a.k1.n)[0]||null;
  return {key,eligible,all:raw,selected,k1,k2,attacks:attackSummary(aa),reception:rec,
   byRotation,byPlayer,combos,directions,missingServing,missingRotation,trend,fragile,strongest,
   matchups:rotationMatchups(selected),startingZones:zoneDistribution(selected,'startZone'),endingZones:zoneDistribution(selected,'endZone'),
   setter: setterDistribution(selected),recAttack:receptionAttackMatrix(selected),
   sample:min,issues:arr(extracted?.failures).filter(id=>ids.has(text(id))),
   videoPossible:selected.filter(x=>x.rally!=null).length};
 }
 function csvSafe(v){let s=text(v);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function exportCSV(rows){
  const heading=['Partido ID','Fecha','Rival','Set','Rally ID','Rally número','Rotación rival','Rotación propia','Fase rival','Ganador','Recepción rival','Zonas origen ataque rival','Zonas destino ataque rival','Colocadores rivales'];
  return '\ufeff'+[heading,...arr(rows).map(r=>[r.id,r.date,r.opponent,r.set,r.rally??'',r.index,r.rotation||'',r.ownRotation||'',r.phase||'',r.winner,receptionCode(r),rivalActs(r,'A').map(x=>zone(x.a?.startZone)).filter(Boolean).join(','),rivalActs(r,'A').map(x=>zone(x.a?.endZone)).filter(Boolean).join(','),rivalActs(r,'E').map(x=>text(x.player)).filter(Boolean).join(',')])].map(row=>row.map(csvSafe).join(';')).join('\r\n');
 }
 const sample=(n,min)=>n===0?'Sin datos':n<min?`Muestra limitada (${n} < ${min})`:`n=${n}`;
 const buttonEvidence=(items)=>`<button type="button" data-vc1930-focus="${safe(items)}">Ver rallies</button>`;
 function markup(){return `<section class="vc1930-desk" id="vc1930-desk" aria-label="Preparación táctica del rival" hidden>
  <header class="vc1930-head"><div><small>V19.3 · TACTICAL INTELLIGENCE</small><h2>Preparación de rivales</h2><p>Análisis cruzado de rotaciones, colocación, recepción y zonas. Solo datos codificados, con evidencia.</p></div><button type="button" data-vc1930-close>Volver al análisis</button></header>
  <div class="vc1930-filters"><label>Rival<select id="vc1930-rival"><option value="">Todos los rivales</option></select></label><label>Partidos<select id="vc1930-scope"><option value="finished">Solo finalizados</option><option value="all">Incluir en curso</option></select></label><label>Fase del rival<select id="vc1930-phase"><option value="">K1 y K2</option><option value="K1">K1 · recibe</option><option value="K2">K2 · saca</option></select></label><label>Rotación rival<select id="vc1930-rotation"><option value="">R1–R6</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Rotación propia<select id="vc1932-own-rotation"><option value="">R1–R6 propias</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n} propia</option>`).join('')}</select></label><label>Recepción rival<select id="vc1932-reception"><option value="">Todas las calidades</option><option value="#">Perfecta #</option><option value="+">Positiva +</option><option value="!">! codificada</option><option value="-">- codificada</option><option value="/">/ codificada</option><option value="=">= codificada</option></select></label><label>Origen del ataque rival<select id="vc1932-attack-start"><option value="">Todas las zonas</option>${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">Zona ${n}</option>`).join('')}</select></label><label>Destino del ataque rival<select id="vc1932-attack-end"><option value="">Todos los destinos</option>${[1,2,3,4,5,6,7,8,9].map(n=>`<option value="${n}">Zona ${n}</option>`).join('')}</select></label><label>Muestra mínima<select id="vc1930-min"><option value="8">8 rallies</option><option value="5">5 rallies</option><option value="12">12 rallies</option></select></label><div class="vc1930-actions"><button type="button" data-vc1930-refresh>Actualizar resultados</button><button type="button" data-vc1932-reset>Limpiar filtros</button><button type="button" data-vc1930-csv>Exportar evidencia CSV</button></div></div>
  <div class="vc1930-notice" id="vc1930-notice" role="status"></div>
  <div id="vc1930-results"></div>
 </section>`;}
 function renderAdvanced(d){
  const matchups=arr(d.matchups),starts=d.startingZones||{total:0,coded:0,values:[]},ends=d.endingZones||{total:0,coded:0,values:[]};
  const setter=d.setter||{total:0,withAttack:0,withZone:0,byPlayer:[]};
  const cond=d.recAttack||{total:0,conditions:[]};
  const spread=matchups.flat().filter(x=>x.n>0).length;
  const cells=(r)=>arr(r).map(x=>`<td class="vc1932-matrix-cell"><button type="button" data-vc1932-own="${x.own}" data-vc1932-rival="${x.rival}" ${x.n?'':'disabled'} title="R${x.own} propia · R${x.rival} rival: ${x.wins}/${x.n} rallies ganados por el rival"><strong>${x.n?fmt(x.pct):'—'}</strong><small>n=${x.n}</small></button></td>`).join('');
  const table=(heads,body)=>`<div class="vc1930-scroll"><table><thead><tr>${heads.map(x=>`<th>${safe(x)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
  const matrix=table(['Propia / Rival','R1 rival','R2 rival','R3 rival','R4 rival','R5 rival','R6 rival'],matchups.map((row,i)=>`<tr><th>R${i+1} propia</th>${cells(row)}</tr>`).join('')||'<tr><td colspan="7">Sin información de rotaciones enfrentadas.</td></tr>');
  const setterRows=arr(setter.byPlayer).slice(0,15).map(g=>`<tr><td>${safe(g.name)}</td><td>${g.n}</td><td>${g.attacks}</td><td>${g.zones.length?g.zones.slice(0,4).map(z=>`${safe(z.name)}: ${z.n} (${fmt(z.pct)})`).join(' · '):'Sin zona'}</td><td>${safe(g.tempos[0]?.name||'—')}</td><td>${safe(g.calls[0]?.name||'—')}</td></tr>`).join('');
  const receptions=table(['Recepción','Ataques posteriores','Kill %','EFF %','Origen de ataque codificado','Consultar'],arr(cond.conditions).map(c=>`<tr><td><b>${safe(c.code)}</b></td><td>${c.n}</td><td>${fmt(c.stats.kill)}</td><td>${fmt(c.stats.eff)}</td><td>${c.knownZone}/${c.n}</td><td><button type="button" data-vc1932-receive="${safe(c.code)}" ${c.n?'':'disabled'}>Filtrar</button></td></tr>`).join(''));
  function court(data,name,kind){
   const byZone=no=>arr(data.values).find(x=>x.zone===no)||{zone:no,n:0,pct:null};
   return `<article class="vc1930-card vc1932-court-card"><h4>${name}</h4><p>${data.coded}/${data.total} ataques con esta zona codificada. Porcentaje sobre los ${data.coded} ataques con zona conocida.</p><div class="vc1932-court" role="group" aria-label="${safe(name)}">${[4,3,2,5,6,1].map(no=>{const x=byZone(no);return `<button type="button" data-vc1932-zone="${no}" data-vc1932-zone-kind="${kind}" ${x.n?'':'disabled'} aria-label="Zona ${no}: ${x.n} ataques"><b>Z${no}</b><strong>${x.n}</strong><small>${fmt(x.pct)}</small></button>`}).join('')}</div><small class="vc1932-extra">${[7,8,9].map(no=>`Z${no}: ${byZone(no).n}`).join(' · ')} · Sin zona: ${data.missing}</small></article>`;
  }
  return `<div class="vc1930-section-heading"><h3>Laboratorio táctico · distribución y filtros cruzados</h3><span>Referencia funcional: búsquedas avanzadas por rotación y calidad de recepción</span></div>
  <article class="vc1930-card"><h3>Matriz R1–R6 · nuestra rotación frente a la rival</h3><p>Porcentaje de rallies ganados por el rival para cada enfrentamiento de rotaciones (no es K1 ni K2). Cada celda muestra su propia muestra. Pulsa una celda para filtrar y abrir su evidencia. Cruces con datos: ${spread}/36.</p>${matrix}</article>
  <div class="vc1930-grid">${court(starts,'Origen de los ataques rivales','start')}${court(ends,'Destino de los ataques rivales','end')}</div>
  <article class="vc1930-card"><h3>Distribución del colocador rival</h3><p>${setter.total} colocaciones · ${setter.withAttack} con ataque posterior en la misma posesión · ${setter.withZone} con zona explícita. Las zonas se extraen del destino codificado de la colocación o del origen del ataque posterior, nunca de una posición supuesta.</p>${table(['Colocador','Colocaciones','Ataques enlazados','Zonas del ataque','Tempo principal','Llamada principal'],setterRows||'<tr><td colspan="6">Faltan colocaciones codificadas del rival. Para obtener distribución, registra acciones E y A del contrario.</td></tr>')}</article>
  <article class="vc1930-card"><h3>Ataque rival según calidad de recepción</h3><p>Solo se vincula una recepción con el ataque siguiente de la misma posesión, sin acciones intermedias de nuestro equipo. ${cond.total} secuencias verificables. La escala #, +, !, -, /, = se muestra sin reinterpretar sus valores.</p>${receptions}</article>`;
 }
 function render(d){
  if(!d.eligible.length)return '<p class="vc1930-empty">No hay partidos de ese rival en el periodo seleccionado. Revisa el filtro de Temporada o incluye partidos en curso.</p>';
  const v=(s,rate)=>`<strong${rate==null?' class="vc1930-na"':''}>${rate==null?'Sin datos':fmt(rate)}</strong><small>${s}</small>`;
  const cell=(x)=>`${fmt(x.pct)}<small>${x.w}/${x.n} · ${sample(x.n,d.sample)}</small>`;
  const table=(headers,rows)=>`<div class="vc1930-scroll"><table><thead><tr>${headers.map(x=>`<th>${safe(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const rot=table(['Rotación rival','Rallies','K1 · Side-out','K2 · Break','Ataque EFF','Evidencia'],d.byRotation.map(r=>`<tr><td><b>R${r.no}</b></td><td>${r.n}</td><td>${cell(r.k1)}</td><td>${cell(r.k2)}</td><td>${fmt(r.attack.eff)}<small>n=${r.attack.n}</small></td><td>${buttonEvidence('R'+r.no)}</td></tr>`).join(''));
  const players=d.byPlayer.slice(0,15).map(p=>`<tr><td>${safe(p.name)}</td><td>${p.n}</td><td>${p.k} / ${p.e} / ${p.b}</td><td>${fmt(p.eff)}</td><td>${sample(p.n,d.sample)}</td></tr>`).join('');
  const attacksTable=table(['Atacante rival','Intentos','Puntos / errores / bloqueados','Eficiencia','Muestra'],players||'<tr><td colspan="5">No hay ataques del equipo rival codificados en estos scoutings.</td></tr>');
  const patterns=(groups,title,total)=>`<article class="vc1930-card"><h4>${title}</h4><p>${groups.reduce((s,x)=>s+x.n,0)}/${total} ataques con esta información</p>${groups.length?groups.slice(0,8).map(g=>`<div class="vc1930-pattern"><span>${safe(g.name)}</span><b>${g.n}</b></div>`).join(''):'<p>Sin datos codificados.</p>'}</article>`;
  const note=d.strongest?`R${d.strongest.no} presenta el side-out rival más alto entre las rotaciones con al menos ${d.sample} K1: ${d.strongest.k1.w}/${d.strongest.k1.n} (${fmt(d.strongest.k1.pct)}). Es una tendencia descriptiva, no una predicción.`:'No hay suficientes rallies de K1 por rotación para destacar tendencias con el umbral seleccionado.';
  const trend=d.trend.previous.matches?`Últimos ${d.trend.recent.matches} partidos: K1 rival ${fmt(d.trend.recent.pct)} (${d.trend.recent.w}/${d.trend.recent.n}); anteriores ${d.trend.previous.matches}: ${fmt(d.trend.previous.pct)} (${d.trend.previous.w}/${d.trend.previous.n}). Las muestras no se ajustan por rival ni alineación.`:'Tendencia histórica: hacen falta al menos cuatro partidos del rival en el periodo seleccionado para comparar bloques.';
  const evidence=table(['Partido','Set / rally','Rotación','Fase','Ganador','Abrir'],d.selected.slice().sort((a,b)=>b.date.localeCompare(a.date)||Number(b.set)-Number(a.set)||Number(b.index)-Number(a.index)).slice(0,100).map((r)=>`<tr><td>${safe(r.date)} · ${safe(r.opponent)}</td><td>S${safe(r.set)} · ${safe(r.index)}</td><td>${r.rotation?'R'+r.rotation:'Sin dato'}</td><td>${safe(r.phase||'Sin dato')}</td><td>${r.winner==='opponent'?'Rival':'Nuestro'}</td><td><button type="button" data-vc1930-match="${safe(r.id)}">Partido</button>${r.rally!=null?`<button type="button" data-vc1930-video="${safe(r.id)}" data-vc1930-set="${safe(r.set)}" data-vc1930-rally="${safe(r.rally)}">Vídeo*</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">Sin rallies cerrados.</td></tr>');
  return `<div class="vc1930-section-heading"><h3>Indicadores del rival</h3><span>Calculados sobre las acciones realmente registradas</span></div><div class="vc1930-kpis"><article><span>Partidos</span><b>${d.eligible.length}</b><small>${d.selected.length} rallies cerrados filtrados</small></article><article><span>K1 rival · recibe</span>${v(`${d.k1.w}/${d.k1.n} · ${sample(d.k1.n,d.sample)}`,d.k1.pct)}</article><article><span>K2 rival · saca</span>${v(`${d.k2.w}/${d.k2.n} · ${sample(d.k2.n,d.sample)}`,d.k2.pct)}</article><article><span>Ataque rival · EFF</span>${v(`n=${d.attacks.n} · (${d.attacks.k}−${d.attacks.e}−${d.attacks.b})/n`,d.attacks.eff)}</article><article><span>Recepción rival #/+</span>${v(`${d.reception.positive}/${d.reception.n} codificadas`,d.reception.pct)}</article></div>
  ${d.attacks.n===0&&d.reception.n===0?'<div class="vc1930-data-warning" role="note"><strong>Faltan acciones del rival:</strong> los rallies permiten estudiar el resultado de K1/K2, pero no identificar atacantes, combinaciones ni calidad de recepción. Para completar ese análisis, codifica también las acciones del equipo contrario durante el scouting.</div>':''}<div class="vc1930-grid"><article class="vc1930-card"><h3>Lectura táctica verificable</h3><p>${safe(note)}</p><p>${safe(trend)}</p></article><article class="vc1930-card"><h3>Calidad de datos</h3><p>${d.missingServing} rallies sin servidor conocido; ${d.missingRotation} sin rotación rival; ${d.reception.notCoded} sin recepción rival en el filtro actual.</p><p>No se interpretan los campos vacíos como errores. ${d.issues.length?'No se han podido procesar '+d.issues.length+' scoutings.':''}</p></article></div>
  <article class="vc1930-card"><h3>K1/K2 por rotación del rival</h3><p>Ganados por el rival / oportunidades con servidor conocido. No se infiere rotación si no está codificada.</p>${rot}</article>
  ${renderAdvanced(d)}
  <article class="vc1930-card"><h3>Principales atacantes del rival</h3><p>Eficiencia = (ataques # − errores = − bloqueados /) / ataques codificados.</p>${attacksTable}</article>
  <div class="vc1930-grid">${patterns(d.combos,'Combinaciones de ataque',d.attacks.n)}${patterns(d.directions,'Direcciones de ataque',d.attacks.n)}</div>
  <article class="vc1930-card" id="vc1930-evidence"><h3>Evidencia · rallies originales</h3><p>Se muestran hasta 100 de ${d.selected.length} rallies. El CSV incluye todos. *El vídeo solo se abrirá si existe una grabación vinculada y disponible.</p>${evidence}</article>`;
 }
 function mount(root){
  const doc=root.document;if(!doc)return;
  const start=()=>{
   const view=doc.getElementById('scout-analysis');if(!view||doc.getElementById('vc1930-desk'))return;
   const workspace=doc.getElementById('vc1730-workspace');
   if(!workspace)return;
   workspace.insertAdjacentHTML('afterend',markup());
   const panel=doc.getElementById('vc1930-desk');const native=view.querySelector('.scout-analysis-shell');
   const actions=workspace.querySelector('.vc1730-head-actions');
   if(!actions)return;
   const launch=doc.createElement('button');launch.type='button';launch.id='vc1930-open';launch.textContent='Preparación de rivales';actions.prepend(launch);
   const $=id=>doc.getElementById(id);
   let current=null,filtered=null,opened=false;
   const matches=()=>{try{return arr(root.VC_V151_SEASON?.matches?.())}catch(_){return[]}};
   function refresh(){
    const ms=matches(),old=$('vc1930-rival').value;
    const options=rivals(ms);
    $('vc1930-rival').innerHTML='<option value="">Todos los rivales</option>'+options.map(x=>`<option value="${safe(x.key)}">${safe(x.name)} (${x.matches})</option>`).join('');
    $('vc1930-rival').value=options.some(x=>x.key===old)?old:'';
    const extract=root.VC_ANALYSIS_INTELLIGENCE_1614?.extract;
    if(typeof extract!=='function'){$('vc1930-results').innerHTML='<p class="vc1930-empty">No está disponible el motor de análisis. Comprueba que se han cargado los scripts.</p>';return;}
    current=source(ms,m=>extract(m,root.VC_SCOUT_REPORT_BRIDGE));
    filtered=report(ms,current,{rival:$('vc1930-rival').value,scope:$('vc1930-scope').value,phase:$('vc1930-phase').value,rotation:$('vc1930-rotation').value,ownRotation:$('vc1932-own-rotation').value,reception:$('vc1932-reception').value,attackStart:$('vc1932-attack-start').value,attackEnd:$('vc1932-attack-end').value,minSample:$('vc1930-min').value});
    $('vc1930-notice').textContent=`Periodo: el seleccionado en Temporada · ${ms.length} scoutings accesibles · ${filtered.eligible.length} partidos seleccionados. Solo rallies con ganador conocido.`;
    $('vc1930-results').innerHTML=render(filtered);
   }
   function open(){opened=true;panel.hidden=false;if(native)native.hidden=true;view.classList.add('vc1930-active');refresh();panel.scrollIntoView?.({block:'start',behavior:'instant'});}
   function close(){opened=false;panel.hidden=true;if(native)native.hidden=false;view.classList.remove('vc1930-active');}
   launch.addEventListener('click',()=>opened?close():open());
   panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-vc1930-close')){close();return}
    if(b.hasAttribute('data-vc1930-refresh')){refresh();return}
    if(b.hasAttribute('data-vc1932-reset')){
     ['vc1930-rival','vc1930-phase','vc1930-rotation','vc1932-own-rotation','vc1932-reception','vc1932-attack-start','vc1932-attack-end'].forEach(id=>$(id).value='');$('vc1930-scope').value='finished';$('vc1930-min').value='8';refresh();return;
    }
    if(b.hasAttribute('data-vc1932-own')){
     $('vc1932-own-rotation').value=b.dataset.vc1932Own;
     $('vc1930-rotation').value=b.dataset.vc1932Rival;
     refresh();$('vc1930-evidence')?.scrollIntoView?.({block:'start'});return;
    }
    if(b.hasAttribute('data-vc1932-zone')){
     $(b.dataset.vc1932ZoneKind==='end'?'vc1932-attack-end':'vc1932-attack-start').value=b.dataset.vc1932Zone;
     refresh();$('vc1930-evidence')?.scrollIntoView?.({block:'start'});return;
    }
    if(b.hasAttribute('data-vc1932-receive')){
     $('vc1932-reception').value=b.dataset.vc1932Receive;refresh();$('vc1930-evidence')?.scrollIntoView?.({block:'start'});return;
    }
    if(b.hasAttribute('data-vc1930-csv')){
     const csv=exportCSV(filtered?.selected||[]);const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=doc.createElement('a');a.href=url;a.download='volley_coach_v1930_evidencia_rival.csv';doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),1200);return;
    }
    if(b.hasAttribute('data-vc1930-focus')){
     const code=b.dataset.vc1930Focus;if(code?.startsWith('R')){$('vc1930-rotation').value=code.slice(1);refresh();$('vc1930-evidence')?.scrollIntoView?.({block:'start'});}return;
    }
    if(b.hasAttribute('data-vc1930-match')){
     const id=b.dataset.vc1930Match;if(Number.isSafeInteger(Number(id))&&typeof root.v151OpenMatch==='function'){close();root.v151OpenMatch(Number(id));}return;
    }
    if(b.hasAttribute('data-vc1930-video')){
     const id=b.dataset.vc1930Video;const rally=b.dataset.vc1930Rally,set=b.dataset.vc1930Set;
     const entry=filtered?.selected.find(r=>text(r.id)===id&&text(r.set)===set&&text(r.rally)===rally);
     if(entry&&typeof root.VC_V159_STATS_VIDEO?.openExact==='function')root.VC_V159_STATS_VIDEO.openExact(entry.match.id,entry.set,entry.rally);
     else root.alert?.('Vídeo no disponible: falta un vínculo válido con esa jugada.');
    }
   });
   panel.querySelectorAll('select').forEach(el=>el.addEventListener('change',refresh));
   workspace.addEventListener('click',e=>{if(opened&&e.target.closest('button')!==launch)close()},true);
   doc.addEventListener('vc:matchstatechange',()=>{if(opened)refresh()});
   root.VC_TACTICAL_RIVALS_1930.open=open;
   root.VC_TACTICAL_RIVALS_1930.close=close;
   root.VC_TACTICAL_RIVALS_1930.refresh=refresh;
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>root.setTimeout(start,0),{once:true});else root.setTimeout(start,0);
 }
 return {VERSION,source,rivals,count,attacks,attackSummary,reception,report,exportCSV,render,markup,mount,
  zone,rotationMatchups,zoneDistribution,setterSequences,setterDistribution,receptionsToAttack,receptionAttackMatrix,renderAdvanced};
});
