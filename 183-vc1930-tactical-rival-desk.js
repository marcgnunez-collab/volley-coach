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
 const VERSION='19.3.1';
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
  const selected=raw.filter(r=>(!filters.phase||r.phase===filters.phase)&&(!int(filters.rotation)||r.rotation===int(filters.rotation)));
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
   sample:min,issues:arr(extracted?.failures).filter(id=>ids.has(text(id))),
   videoPossible:selected.filter(x=>x.rally!=null).length};
 }
 function csvSafe(v){let s=text(v);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function exportCSV(rows){
  const heading=['Partido ID','Fecha','Rival','Set','Rally ID','Rally número','Rotación rival','Rotación propia','Fase rival','Ganador'];
  return '\ufeff'+[heading,...arr(rows).map(r=>[r.id,r.date,r.opponent,r.set,r.rally??'',r.index,r.rotation||'',r.ownRotation||'',r.phase||'',r.winner])].map(row=>row.map(csvSafe).join(';')).join('\r\n');
 }
 const sample=(n,min)=>n===0?'Sin datos':n<min?`Muestra limitada (${n} < ${min})`:`n=${n}`;
 const buttonEvidence=(items)=>`<button type="button" data-vc1930-focus="${safe(items)}">Ver rallies</button>`;
 function markup(){return `<section class="vc1930-desk" id="vc1930-desk" aria-label="Preparación táctica del rival" hidden>
  <header class="vc1930-head"><div><small>V19.3 · TACTICAL INTELLIGENCE</small><h2>Preparación de rivales</h2><p>Rallies cerrados, rotaciones y evidencia contrastable. Sin modificar los datos de scouting.</p></div><button type="button" data-vc1930-close>Volver al análisis</button></header>
  <div class="vc1930-filters"><label>Rival<select id="vc1930-rival"><option value="">Todos los rivales</option></select></label><label>Partidos<select id="vc1930-scope"><option value="finished">Solo finalizados</option><option value="all">Incluir en curso</option></select></label><label>Fase del rival<select id="vc1930-phase"><option value="">K1 y K2</option><option value="K1">K1 · recibe</option><option value="K2">K2 · saca</option></select></label><label>Rotación rival<select id="vc1930-rotation"><option value="">R1–R6</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Muestra mínima<select id="vc1930-min"><option value="8">8 rallies</option><option value="5">5 rallies</option><option value="12">12 rallies</option></select></label><div class="vc1930-actions"><button type="button" data-vc1930-refresh>Actualizar resultados</button><button type="button" data-vc1930-csv>Exportar evidencia CSV</button></div></div>
  <div class="vc1930-notice" id="vc1930-notice" role="status"></div>
  <div id="vc1930-results"></div>
 </section>`;}
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
    filtered=report(ms,current,{rival:$('vc1930-rival').value,scope:$('vc1930-scope').value,phase:$('vc1930-phase').value,rotation:$('vc1930-rotation').value,minSample:$('vc1930-min').value});
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
 return {VERSION,source,rivals,count,attacks,attackSummary,reception,report,exportCSV,render,markup,mount};
});
