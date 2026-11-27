/* Volley Coach V20.7.2 · Three independent read-only tactical modules in their original order. */
/* VC2072_SOURCE_BEGIN:227-vc2041-statistical-integrity.js */
/* Volley Coach V20.4.1 · Statistical Integrity.
 * Independent, read-only verification of the scouting evidence. No corrections,
 * writes, server requests or inferred scores are performed by this module.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_STAT_INTEGRITY_2041=api;if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.mount(root),{once:true});
  else api.mount(root);
 }}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.4.1';
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>x!=null&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=0?Number(x):null;
 const rot=x=>x!=null&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=6;
 const rated=new Set(['#','+','!','-','/','=']);
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function checkMatch(match){
  const result={id:match?.id??null,opponent:String(match?.opponent||'Rival sin identificar'),sets:0,rallies:0,closed:0,actions:0,
   withScoreTrace:0,missingScoreTrace:0,unknownWinner:0,unknownServe:0,unknownRotation:0,unknownTeam:0,
   graded:{S:0,R:0,A:0},total:{S:0,R:0,A:0},issues:[]};
  const issue=(type,set,rally,msg)=>result.issues.push({type,set,rally,message:msg,matchId:result.id});
  for(const set of arr(match?.sets)){
   result.sets++;
   const seen=new Set();const rallies=arr(set?.rallies);
   for(let i=0;i<rallies.length;i++){
    const r=rallies[i];if(!r)continue;
    const setNo=set?.number??'?';const no=r?.id??i+1;
    result.rallies++;
    if(r.id!=null){const key=String(r.id);if(seen.has(key))issue('inconsistencia',setNo,no,'ID de rally duplicado dentro del set');seen.add(key);}
    const winner=r.winner==='ours'||r.winner==='opponent'?r.winner:null;
    if(winner)result.closed++;else result.unknownWinner++;
    if(r.servingBefore!=='ours'&&r.servingBefore!=='opponent')result.unknownServe++;
    if(!rot(r.rotationBefore))result.unknownRotation++;
    const before=r.scoreBefore,after=r.scoreAfter;
    const bUs=val(before?.us),bOp=val(before?.opponent),aUs=val(after?.us),aOp=val(after?.opponent);
    if(bUs!=null&&bOp!=null&&aUs!=null&&aOp!=null&&winner){
     result.withScoreTrace++;
     const good=winner==='ours'?aUs===bUs+1&&aOp===bOp:aOp===bOp+1&&aUs===bUs;
     if(!good)issue('inconsistencia',setNo,no,`Marcador antes/después no coincide con ganador registrado (${bUs}-${bOp} → ${aUs}-${aOp})`);
    }else result.missingScoreTrace++;
    const actionIds=new Set();
    for(const a of arr(r.actions)){
     if(!a)continue;result.actions++;
     if(a.team!=='ours'&&a.team!=='opponent')result.unknownTeam++;
     if(a.team==='ours'&&Object.hasOwn(result.total,a.skill)){
      result.total[a.skill]++;if(rated.has(a.evaluation))result.graded[a.skill]++;
     }
     if(a.id!=null){const key=String(a.id);if(actionIds.has(key))issue('inconsistencia',setNo,no,'ID de acción duplicado en el rally');actionIds.add(key);}
    }
   }
   // A completed set can be checked against the final recorded rally score.
   if(set?.finished===true&&rallies.length){
    const last=rallies.at(-1),u=val(last?.scoreAfter?.us),o=val(last?.scoreAfter?.opponent);
    const finalU=val(set?.scoreUs),finalO=val(set?.scoreOpponent);
    if(u!=null&&o!=null&&finalU!=null&&finalO!=null&&(u!==finalU||o!==finalO)){
     issue('revisar',set?.number??'?',last?.id??rallies.length,`Último tanteo registrado ${u}-${o}; cierre del set ${finalU}-${finalO}. Revisar si hubo una corrección manual.`);
    }
   }
  }
  return result;
 }
 function audit(matches){
  const entries=arr(matches).filter(m=>m&&typeof m==='object').map(checkMatch);
  const sums={matches:entries.length,sets:0,rallies:0,closed:0,actions:0,withScoreTrace:0,missingScoreTrace:0,
   unknownWinner:0,unknownServe:0,unknownRotation:0,unknownTeam:0,issues:[],graded:{S:0,R:0,A:0},total:{S:0,R:0,A:0}};
  for(const e of entries){
   for(const k of ['sets','rallies','closed','actions','withScoreTrace','missingScoreTrace','unknownWinner','unknownServe','unknownRotation','unknownTeam'])sums[k]+=e[k];
   for(const skill of ['S','R','A']){sums.graded[skill]+=e.graded[skill];sums.total[skill]+=e.total[skill];}
   sums.issues.push(...e.issues.map(i=>({...i,opponent:e.opponent})));
  }
  return {...sums,entries};
 }
 function render(d){
  const coverage=skill=>`${d.graded[skill]}/${d.total[skill]}`;
  const warning=d.issues.length?`<span class="vc2041-tag danger">${d.issues.length} comprobaciones para revisar</span>`:'<span class="vc2041-tag">Sin incoherencias detectadas en campos verificables</span>';
  const detail=d.issues.slice(0,12).map(x=>`<li><strong>${safe(x.opponent)}</strong> · S${safe(x.set)} / rally ${safe(x.rally)}: ${safe(x.message)}</li>`).join('');
  return `<div class="vc2041-heading"><div><small>DATA TRUST · V20.4.1</small><h3>Auditoría de precisión estadística</h3><p>Compara registros originales. Las ausencias se muestran como datos desconocidos; no se sustituyen por cero.</p></div>${warning}</div>
   <div class="vc2041-metrics"><div><b>${d.matches}</b><small>partidos · ${d.sets} sets</small></div><div><b>${d.closed}/${d.rallies}</b><small>rallies con ganador conocido</small></div><div><b>${d.withScoreTrace}</b><small>rallies con marcador antes/después verificable</small></div><div><b>${d.unknownServe}</b><small>sin servidor registrado</small></div><div><b>${d.unknownRotation}</b><small>sin rotación propia</small></div><div><b>${d.unknownTeam}</b><small>acciones sin equipo válido</small></div></div>
   <p class="vc2041-coverage">Cobertura de valoraciones propias: <b>saque ${coverage('S')}</b> · <b>recepción ${coverage('R')}</b> · <b>ataque ${coverage('A')}</b>. Los porcentajes de estas acciones deben usar únicamente valoraciones válidas.</p>
   <details class="vc2041-details"><summary>Ver calidad de evidencia y ${d.issues.length} avisos</summary><p>${d.missingScoreTrace} rallies sin trazabilidad completa de marcador; ${d.unknownWinner} sin ganador. Una ausencia no implica un error. Esta auditoría no prueba por sí sola la exactitud de cualquier estadística no codificada ni modifica el scouting.</p>${detail?`<ul>${detail}</ul>`:'<p>No se detectaron incoherencias en los campos comparables.</p>'}${d.issues.length>12?`<p>Se muestran 12 de ${d.issues.length} avisos.</p>`:''}</details>`;
 }
 function mount(root){
  const doc=root.document,host=doc?.querySelector?.('#scout-season .v790-hero');if(!host)return false;
  if(doc.getElementById('vc2041-integrity'))return true;
  const section=doc.createElement('section');section.id='vc2041-integrity';section.className='vc2041-audit';
  section.setAttribute('aria-label','Auditoría estadística');
  section.innerHTML='<div id="vc2041-content"></div><button type="button" class="vc2041-refresh">Recalcular auditoría</button>';
  host.insertAdjacentElement('afterend',section);
  const refresh=()=>{
   let ms=[];try{ms=arr(root.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.())}catch(_){}
   doc.getElementById('vc2041-content').innerHTML=render(audit(ms));
  };
  section.querySelector('button').addEventListener('click',refresh);
  doc.addEventListener('vc:matchstatechange',()=>{if(doc.getElementById('scout-season')?.classList.contains('active'))refresh()});
  refresh();return true;
 }
 return {VERSION,checkMatch,audit,render,mount};
});
/* VC2072_SOURCE_END:227-vc2041-statistical-integrity.js */
;
/* VC2072_SOURCE_BEGIN:228-vc2042-rival-intelligence.js */
/* Volley Coach V20.4.2 · Rival Intelligence Pro
 * Adds a tactical match brief to the EXISTING rival desk (V19.3).
 * Every proposed pattern comes from the same filtered, finished scouting rows.
 * Existing controls remain responsible for opening match and video evidence.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_RIVAL_INTELLIGENCE_2042=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.4.2';
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const safe=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>Number.isFinite(x)?`${Math.round(x*10)/10}%`:'—';
 const n=x=>Number.isFinite(Number(x))?Number(x):0;
 function build(d){
  const required=Math.max(5,n(d?.sample)||8);
  const finished=arr(d?.eligible);
  const selected=arr(d?.selected);
  const scoped=!!txt(d?.key);
  const cards=[];
  const add=(kind,title,detail,hypothesis,evidence,filter)=>cards.push({kind,title,detail,hypothesis,evidence,filter});
  if(scoped){
   const vulnerable=d?.fragile;
   if(vulnerable?.k1?.n>=required){
    add('rotacion',`R${vulnerable.no} · side-out rival observado`,`${vulnerable.k1.w}/${vulnerable.k1.n} rallies K1 ganados (${fmt(vulnerable.k1.pct)})`,
     'Hipótesis a contrastar: preparar un saque que complique la construcción en esta rotación. No implica causalidad.',
     arr(vulnerable.evidence).filter(r=>r.phase==='K1'),{type:'rotation',value:vulnerable.no});
   }
   for(const [field,kind,name] of [['startingZones','origen','Origen de ataque'],['endingZones','destino','Destino de ataque']]){
    const data=d?.[field];const sorted=arr(data?.values).filter(z=>z.n>0).sort((a,b)=>b.n-a.n||a.zone-b.zone);
    const top=sorted[0];
    if(top&&data.coded>=required&&top.n>=required&&top.pct>=45){
     const prop=kind==='origen'?'startZone':'endZone';
     add(kind,`${name} rival: zona ${top.zone}`,`${top.n}/${data.coded} ataques con zona codificada (${fmt(top.pct)}). Cobertura ${data.coded}/${data.total}.`,
       kind==='origen'?'Hipótesis a contrastar: revisar la organización del bloqueo ante esta zona de ataque.':'Hipótesis a contrastar: revisar la defensa de campo en este destino.',
       selected.filter(r=>arr(r.actions).some(a=>a?.team==='opponent'&&a.skill==='A'&&new RegExp('^Z?'+top.zone+'(?:[A-D])?$','i').test(txt(a?.a?.[prop])))),
       {type:'zone',kind:kind==='origen'?'start':'end',value:top.zone});
    }
   }
   const rec=d?.reception;
   if(rec?.rated>=required&&rec.pct!=null){
    const weak=rec.pct<=45;
    add('recepcion',weak?'Recepción rival con baja proporción positiva':'Calidad de recepción del rival',
     `${rec.positive}/${rec.rated} recepciones +/# (${fmt(rec.pct)}) · ${rec.n} registradas`,
     weak?'Hipótesis a contrastar: probar variantes de saque. La zona objetivo solo puede decidirse con saques codificados.':'Referencia de preparación: ajustar objetivos de saque después de observar recepción y colocación. No se deduce una zona vulnerable.',
     selected.filter(r=>arr(r.actions).some(a=>a?.team==='opponent'&&a.skill==='R')),null);
   }
  }
  const examples=selected.filter(x=>x?.rally!=null&&x.id!=null).slice().sort((a,b)=>txt(b.date).localeCompare(txt(a.date))||n(b.set)-n(a.set)||n(b.index)-n(a.index)).slice(0,5);
  return {scoped,required,matches:finished.length,rallies:selected.length,cards,examples,
   coverage:{serve:Math.max(0,selected.length-n(d?.missingServing)),rotation:Math.max(0,selected.length-n(d?.missingRotation)),
    attacks:n(d?.attacks?.n),ratedAttacks:n(d?.attacks?.rated)},
   unavailable:!scoped?'Selecciona un rival concreto para preparar un partido sin mezclar varios equipos.':
    !finished.length?'No hay partidos finalizados del rival en este periodo.':
    !cards.length?`No hay tendencias con una muestra mínima de ${required} observaciones. Se mantienen disponibles las tablas y vídeos reales.`:''};
 }
 function render(data){
  const d=build(data);
  const cards=d.cards.map(c=>{
   const focus=c.filter?.type==='rotation'?`<button type="button" data-vc1930-focus="R${c.filter.value}">Filtrar R${c.filter.value}</button>`:
    c.filter?.type==='zone'?`<button type="button" data-vc1932-zone="${c.filter.value}" data-vc1932-zone-kind="${c.filter.kind}">Filtrar zona ${c.filter.value}</button>`:'';
   return `<article class="vc2042-card"><span class="vc2042-type">${safe(c.kind)}</span><h4>${safe(c.title)}</h4><strong>${safe(c.detail)}</strong><p>${safe(c.hypothesis)}</p><div class="vc2042-actions"><small>${c.evidence.length} rallies relacionados, no necesariamente vídeos disponibles</small>${focus}</div></article>`;
  }).join('');
  const examples=d.examples.map(r=>`<div class="vc2042-evidence-row"><span>${safe(r.date)} · S${safe(r.set)} / rally ${safe(r.index)} · ${r.rotation?'R'+safe(r.rotation):'Rotación no codificada'}</span><div><button type="button" data-vc1930-match="${safe(r.id)}">Abrir partido</button><button type="button" data-vc1930-video="${safe(r.id)}" data-vc1930-set="${safe(r.set)}" data-vc1930-rally="${safe(r.rally)}">Intentar ver vídeo</button></div></div>`).join('');
  return `<section class="vc2042-brief" aria-label="Rival Intelligence Pro"><div class="vc2042-heading"><div><small>RIVAL INTELLIGENCE PRO · V20.4.2</small><h3>Informe para preparar el partido</h3><p>${d.matches} partidos seleccionados · ${d.rallies} rallies filtrados · muestra mínima ${d.required}. Hipótesis descriptivas, nunca predicciones.</p></div><span class="vc2042-badge">Scouting real</span></div>
   ${d.unavailable?`<div class="vc2042-empty" role="note">${safe(d.unavailable)}</div>`:''}
   ${cards?`<div class="vc2042-grid">${cards}</div>`:''}
   <div class="vc2042-footer"><div><h4>Fiabilidad de este informe</h4><p>${d.coverage.serve}/${d.rallies} rallies con saque conocido · ${d.coverage.rotation}/${d.rallies} con rotación rival · ${d.coverage.ratedAttacks}/${d.coverage.attacks} ataques valorados. Si falta una codificación, no se estima.</p></div><div><h4>Juegos y vídeos de referencia</h4><p>La vinculación al vídeo solo se confirma al abrir la grabación original.</p>${examples||'<p>Sin rallies con referencia disponible en el filtro actual.</p>'}</div></div>
  </section>`;
 }
 return {VERSION,build,render};
});
/* VC2072_SOURCE_END:228-vc2042-rival-intelligence.js */
;
/* VC2072_SOURCE_BEGIN:229-vc2043-live-tactical-assistant.js */
/* Volley Coach V20.4.3 · Live Tactical Assistant
 * Read-only tactical hints from actual, completed match rallies. Never changes
 * scores, actions, scouting, cloud state, player rotations or media transport.
 */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_LIVE_TACTICAL_2043=api;if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.mount,{once:true});
  else api.mount();
 }}
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.4.3';
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const safe=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const grades=new Set(['#','+','!','-','/','=']);
 const zone=x=>{const m=txt(x).toUpperCase().match(/^Z?([1-9])(?:[A-D])?$/);return m?Number(m[1]):null;};
 const validRot=x=>x!=null&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=6;
 function analyze(match,windowSize=24){
  if(!match||typeof match!=='object')return {matchId:null,rallies:0,known:0,recent:0,rotation:null,alerts:[],coverage:{receiving:0,attacking:0,serving:0},message:'Abre un partido para ver recomendaciones basadas en sus rallies.'};
  const sets=arr(match.sets);const all=sets.flatMap(s=>arr(s?.rallies)).filter(Boolean);
  const count=Math.max(8,Math.min(100,Number.isInteger(windowSize)?windowSize:24));
  const recent=all.slice(-count),closed=recent.filter(r=>r.winner==='ours'||r.winner==='opponent');
  const alerts=[];
  const add=(level,title,detail,note,used)=>alerts.push({level,title,detail,note,sample:used});
  const rotation=validRot(match.rotationNo)?Number(match.rotationNo):validRot(match.rotation)?Number(match.rotation):null;
  let streak=0;
  for(let i=all.length-1;i>=0;i--){if(all[i]?.winner!=='opponent')break;streak++;}
  if(streak>=3)add('attention','Racha de puntos del rival',`${streak} rallies consecutivos perdidos`,
   'Revisar el último tramo de juego y las rotaciones. La secuencia no identifica por sí sola la causa.',streak);
  const k1=closed.filter(r=>r.servingBefore==='opponent');
  const k1Won=k1.filter(r=>r.winner==='ours').length;
  if(k1.length>=5&&k1Won/k1.length<=.4)add('attention','Side-out propio bajo',
   `${k1Won}/${k1.length} K1 ganados (${Math.round(k1Won/k1.length*100)}%)`,
   `Revisar recepción y primera construcción en los últimos ${recent.length} rallies. Solo saques rivales conocidos.`,k1.length);
  const ownReception=closed.flatMap(r=>arr(r.actions)).filter(a=>a?.team==='ours'&&a.skill==='R');
  const ratedReception=ownReception.filter(a=>grades.has(a.evaluation)),positive=ratedReception.filter(a=>a.evaluation==='#'||a.evaluation==='+').length;
  if(ratedReception.length>=5&&positive/ratedReception.length<=.4)add('attention','Recepción propia por debajo del 40%',
   `${positive}/${ratedReception.length} recepciones #/+ (${Math.round(positive/ratedReception.length*100)}%)`,
   'Comprobar estabilidad de recepción y distribución. No se atribuye la causa a un jugador sin evidencias.',ratedReception.length);
  const rivalAttacks=closed.flatMap(r=>arr(r.actions)).filter(a=>a?.team==='opponent'&&a.skill==='A');
  const origin=rivalAttacks.map(a=>zone(a.startZone)).filter(Boolean);
  const distribution=new Map();for(const z of origin)distribution.set(z,(distribution.get(z)||0)+1);
  const top=[...distribution].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
  if(origin.length>=5&&top&&top[1]>=5&&top[1]/origin.length>=.6){
   add('pattern','Origen de ataque rival dominante',`Zona ${top[0]} · ${top[1]}/${origin.length} orígenes codificados (${Math.round(top[1]/origin.length*100)}%)`,
    'Revisar organización de bloqueo ante esa zona. Porcentaje condicionado a los ataques con origen registrado.',origin.length);
  }
  const rivalServes=closed.flatMap(r=>arr(r.actions)).filter(a=>a?.team==='opponent'&&a.skill==='S');
  const servedTo=rivalServes.map(a=>zone(a.endZone)).filter(Boolean);
  const destinations=new Map();for(const z of servedTo)destinations.set(z,(destinations.get(z)||0)+1);
  const frequent=[...destinations].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
  if(servedTo.length>=5&&frequent&&frequent[1]>=5&&frequent[1]/servedTo.length>=.6){
   add('pattern','Destino de saque rival frecuente',`Zona ${frequent[0]} · ${frequent[1]}/${servedTo.length} destinos registrados (${Math.round(frequent[1]/servedTo.length*100)}%)`,
    'Revisar la recepción de esta zona. No confundir destino de saque con origen de ataque.',servedTo.length);
  }
  return {matchId:match.id??null,rallies:all.length,known:closed.length,recent:recent.length,rotation,alerts,
   coverage:{receiving:ratedReception.length,attacking:origin.length,serving:servedTo.length},
   message:!closed.length?'Aún no hay rallies terminados con ganador conocido.':
    !alerts.length?'No hay señales que superen el umbral de muestra. Sigue codificando y revisa el partido cuando lo necesites.':''};
 }
 function render(d){
  const cards=d.alerts.map(x=>`<article class="vc2043-card ${x.level==='attention'?'attention':'pattern'}"><small>${x.level==='attention'?'REVISAR':'PATRÓN CODIFICADO'} · n=${x.sample}</small><h4>${safe(x.title)}</h4><strong>${safe(x.detail)}</strong><p>${safe(x.note)}</p></article>`).join('');
  return `<div class="vc2043-facts"><span>${d.rallies} rallies totales</span><span>${d.known}/${d.recent} cerrados en la ventana reciente</span><span>Rotación: ${d.rotation?'R'+d.rotation:'sin dato'}</span><span>Recepciones evaluadas: ${d.coverage.receiving}</span></div>
  ${d.message?`<p class="vc2043-empty">${safe(d.message)}</p>`:''}${cards?`<div class="vc2043-grid">${cards}</div>`:''}
  <div class="vc2043-foot"><span>Lectura descriptiva de hasta 24 rallies recientes. Muestras mínimas: 5 acciones válidas. Sin IA externa ni cambios automáticos.</span><button type="button" data-vc2043-review>Revisar rallies</button></div>`;
 }
 let started=false,heartbeat=null,last='',mountAttempts=0;
 function visible(){return !!root?.document?.getElementById('scout-match-mode')?.classList.contains('active');}
 function active(){try{return root?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
 function refresh(){
  const doc=root?.document,details=doc?.getElementById('vc2043-assistant');if(!details||!visible())return false;
  const result=analyze(active()),signature=JSON.stringify(result);
  if(signature===last)return true;
  last=signature;
  const count=details.querySelector('[data-vc2043-count]');if(count)count.textContent=result.alerts.length?`${result.alerts.length} observaciones`:'Sin alertas verificadas';
  const out=doc.getElementById('vc2043-output');if(out)out.innerHTML=render(result);
  return true;
 }
 function mount(){
  const doc=root?.document;
  let anchor=doc?.getElementById('vc2020-matchbar');
  if(!anchor){
   try{root?.VC_MATCH_WORKSPACE_2020?.boot?.();}catch(_){}
   anchor=doc?.getElementById('vc2020-matchbar');
  }
  if(!anchor){if(mountAttempts++<10)root?.setTimeout?.(mount,900);return false;}
  if(doc.getElementById('vc2043-assistant'))return true;
  const panel=doc.createElement('details');panel.id='vc2043-assistant';panel.className='vc2043-assistant';panel.open=true;
  panel.innerHTML='<summary><span><b>LIVE TACTICAL ASSISTANT</b><small>Solo scouting real · V20.4.3</small></span><em data-vc2043-count>Analizando rallies…</em></summary><div id="vc2043-output" aria-live="polite"></div>';
  anchor.insertAdjacentElement('afterend',panel);
  panel.addEventListener('click',event=>{if(!event.target?.closest?.('[data-vc2043-review]'))return;
   if(typeof root?.VC_MATCH_WORKSPACE_2020?.navigate==='function')root.VC_MATCH_WORKSPACE_2020.navigate('revisar');
   else if(typeof root?.vc52SetMode==='function')root.vc52SetMode('revisar');});
  if(!started){started=true;
   doc.addEventListener('vc:matchstatechange',()=>{last='';refresh()});
   if(typeof root?.setInterval==='function')heartbeat=root.setInterval(()=>{if(!doc.hidden&&visible())refresh()},2500);
   if(root?.MutationObserver){const view=doc.getElementById('scout-match-mode');if(view)new root.MutationObserver(()=>{last='';refresh()}).observe(view,{attributes:true,attributeFilter:['class']});}
  }
  refresh();return true;
 }
 return {VERSION,analyze,render,refresh,mount,diagnostics:()=>({mounted:!!root?.document?.getElementById('vc2043-assistant'),heartbeat:!!heartbeat})};
});
/* VC2072_SOURCE_END:229-vc2043-live-tactical-assistant.js */
;
