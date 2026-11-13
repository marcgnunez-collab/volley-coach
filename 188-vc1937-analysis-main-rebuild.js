/* Volley Coach V19.3.7 · Analysis Main Workspace Rebuild
 * Main entry to #scout-analysis: same scouting bridge, statistical model and video links.
 * Read-only presentation adapter. The original Analyst Studio, official exports,
 * worksheets, comparisons and opponent analysis remain mounted and accessible.
 */
(function(root,factory){
 'use strict';
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){root.VC_ANALYSIS_MAIN_1937=api;api.mount(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.7',SKILLS={A:'Ataque',R:'Recepción',S:'Saque',E:'Distribución',B:'Bloqueo',D:'Defensa'};
 const TABS=[['overview','Resumen'],['rotations','Rotaciones'],['distribution','Colocador'],['attack','Ataque'],['reception','Recepción'],['serve','Saque'],['defense','Defensa'],['video','Vídeo y rallies']];
 const $=(doc,id)=>doc.getElementById(id);
 const arr=v=>Array.isArray(v)?v:[];
 const txt=v=>String(v??'').trim();
 const esc=v=>txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const zone=v=>{const m=txt(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?{n:Number(m[1]),q:m[2]||''}:null};
 const pct=(n,d)=>d?Math.round(n/d*1000)/10:null;
 const fmt=n=>n==null?'—':n.toLocaleString('es-ES',{maximumFractionDigits:1})+' %';
 const effort=(rows)=>{const scored=arr(rows).filter(x=>['#','+','!','-','=','/'].includes(x.ev));const k=scored.filter(x=>x.ev==='#').length,e=scored.filter(x=>x.ev==='=').length,b=scored.filter(x=>x.ev==='/').length;return {count:rows.length,scored:scored.length,k,e,b,eff:pct(k-e-b,scored.length)};};
 const phaseFor=(r,team)=>!r.serving?'Sin saque':r.serving===team?'K2':'K1';
 function selectContext(win){
  const doc=win.document,sel=$ (doc,'vc157-match');const id=txt(sel?.value||$(doc,'scout-analysis-match')?.value);
  const bridges=[win.VC_SCOUT_REPORT_BRIDGE,win.VC_SCOUT_VIDEO_BRIDGE];
  let matches=[];
  for(const bridge of bridges){try{matches.push(...arr(bridge?.getMatches?.()));}catch(_){}}
  const found=matches.find(m=>String(m?.id)===id)||(!id?matches[0]:null);
  if(!found)return null;
  const team=$(doc,'vc157-team')?.value==='opponent'?'opponent':'ours',set=txt($(doc,'vc157-set')?.value),rotation=txt($(doc,'vc157-rotation')?.value),phase=txt($(doc,'vc157-phase')?.value);
  const match=phase?{...found,sets:arr(found.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===(team==='ours'?(phase==='K1'?'opponent':'ours'):(phase==='K1'?'ours':'opponent')))}))}:found;
  const model=win.VC_ANALYSIS_INTELLIGENCE_1614?.model;
  if(!model)return null;
  return {match:found,team,set,rotation,phase,data:model(match,win.VC_SCOUT_VIDEO_BRIDGE||win.VC_SCOUT_REPORT_BRIDGE,{team,set,rotation})};
 }
 function courtData(data,tab='attack',team='ours'){
  const skill=tab==='distribution'?'E':tab==='reception'?'R':tab==='serve'?'S':tab==='defense'?'D':'A';
  let rows=data.actions.filter(x=>x.skill===skill&&x.team===team),key=skill==='A'?'endZone':skill==='E'?'setTarget':skill==='S'?'endZone':skill==='R'?'contactZone':'contactZone';
  const values=rows.map(x=>({row:x,zone:zone(x.a?.[key]||(skill==='R'?x.a?.endZone:null))}));
  const coded=values.filter(x=>x.zone);const counts=new Map();
  for(const {zone:z} of coded){const val=counts.get(z.n)||{n:0,sub:{A:0,B:0,C:0,D:0}};val.n++;if(z.q)val.sub[z.q]++;counts.set(z.n,val)}
  const total=coded.length;
  return {skill,rows,values,coded:total,missing:rows.length-total,counts:[1,2,3,4,5,6].map(n=>({zone:n,n:counts.get(n)?.n||0,pct:pct(counts.get(n)?.n||0,total),sub:counts.get(n)?.sub||{A:0,B:0,C:0,D:0}}))};
 }
 function tableFor(ctx,tab){
  const data=ctx.data;
  if(tab==='overview'||tab==='rotations'||tab==='video'){
   const headers='<th>Rot.</th><th>Rallies</th><th>K1 Side-out</th><th>K2 Break</th><th>G-P</th><th>Jugadas</th>';
   const body=data.rotations.map(r=>`<tr><td><button class="vc1937-link" data-vc1937-rotation="${r.rotation}">R${r.rotation}</button></td><td>${r.rallies}</td><td>${fmt(r.k1.pct)}<small>${r.k1.w}/${r.k1.n}</small></td><td>${fmt(r.k2.pct)}<small>${r.k2.w}/${r.k2.n}</small></td><td>${2*r.won-r.rallies>0?'+':''}${2*r.won-r.rallies}</td><td><button class="vc1937-link" data-vc1937-rotation="${r.rotation}">Ver</button></td></tr>`).join('');
   return {title:'Rotaciones · K1/K2',subtitle:'Puntos ganados / oportunidades por rotación',headers,body};
  }
  if(tab==='distribution'){
   const groups=new Map();for(const x of data.pairs){const key=txt(x.target)||'Sin codificar';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}
   const body=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([k,list])=>{const s=effort(list.map(x=>x.attack).filter(Boolean));return `<tr><td>${esc(k)}</td><td>${list.length}</td><td>${fmt(pct(list.length,data.pairs.length))}</td><td>${s.count}</td><td>${fmt(s.eff)}</td></tr>`}).join('');
   return {title:'Distribución del colocador',subtitle:`${data.pairs.length} colocaciones · destino declarado`,headers:'<th>Destino / combinación</th><th>Coloc.</th><th>Uso</th><th>Ataques</th><th>EFF</th>',body};
  }
  const skill=({attack:'A',reception:'R',serve:'S',defense:'D'})[tab]||'A';
  const rows=data.actions.filter(x=>skill==='D'?['D','B'].includes(x.skill):x.skill===skill);
  const groups=new Map();for(const x of rows){const k=x.player||'Sin identificar';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
  const body=[...groups].sort((a,b)=>b[1].length-a[1].length).map(([name,items])=>{const s=effort(items),pos=items.filter(x=>['#','+'].includes(x.ev)).length;return `<tr><td>${esc(name)}</td><td>${s.count}</td><td>${s.scored}</td><td>${skill==='A'?s.k:pos}</td><td>${s.e}</td><td>${skill==='A'?fmt(s.eff):fmt(pct(pos,s.scored))}</td></tr>`}).join('');
  return {title:(skill==='D'?'Defensa y bloqueo':SKILLS[skill])+' · por jugador',subtitle:'Acciones codificadas; sin valoración fuera del denominador',headers:`<th>Jugador</th><th>Acc.</th><th>Evaluadas</th><th>${skill==='A'?'Puntos':'Positivas'}</th><th>Errores</th><th>${skill==='A'?'EFF':'% positivo'}</th>`,body};
 }
 function courtHtml(model,focus){
  const nums=[4,3,2,5,6,1],max=Math.max(1,...model.counts.map(x=>x.n));
  const cards=nums.map(n=>{const c=model.counts.find(x=>x.zone===n),intensity=c.n/max;
   return `<button type="button" data-vc1937-zone="${n}" class="vc1937-zone${focus===n?' is-selected':''}" style="--heat:${(0.10+intensity*.60).toFixed(3)}" aria-pressed="${focus===n}" title="Zona ${n}; ${c.n} acciones con zona registrada"><b>Z${n}</b><strong>${c.n||'—'}</strong><small>${c.pct==null?'Sin datos':fmt(c.pct)}</small><span class="vc1937-subs" aria-label="A/B/C/D">${['C','B','D','A'].map(k=>`<em>${k}<sup>${c.sub[k]||''}</sup></em>`).join('')}</span></button>`}).join('');
  return `<div class="vc1937-court-caption">RED · CAMPO ANALIZADO</div><div class="vc1937-court">${cards}</div><div class="vc1937-court-legend"><span>${model.coded} zonas registradas</span><span>${model.missing} sin zona</span></div>`;
 }
 function makeOverview(ctx){const d=ctx.data,at=effort(d.attacks),recs=arr(d.receives).filter(a=>['#','+','!','-','/','='].includes(a.ev));const reception=fmt(pct(recs.filter(x=>['#','+'].includes(x.ev)).length,recs.length));return [
  ['K1 · Side-out',fmt(d.points.k1.pct),`${d.points.k1.w}/${d.points.k1.n} oportunidades`],
  ['K2 · Break',fmt(d.points.k2.pct),`${d.points.k2.w}/${d.points.k2.n} oportunidades`],
  ['Ataque · EFF',fmt(at.eff),`${at.scored}/${at.count} valorados`],
  ['Recepción +/#',reception,`${recs.length} valoradas`],
  ['Rallies válidos',String(d.points.rallies),`${d.actions.length} acciones`]
 ].map(([label,value,note])=>`<div class="vc1937-kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('')}
 function traceSvg(data){const list=data.timeline||[];if(!list.length)return '<p>Sin rallies cerrados.</p>';
  const sampled=list.length>400?list.filter((_,i)=>i%Math.ceil(list.length/400)===0||i===list.length-1):list;
  const min=Math.min(-2,...sampled.map(p=>p.diff)),max=Math.max(2,...sampled.map(p=>p.diff));
  const pts=sampled.map((x,i)=>`${(i/(sampled.length-1||1)*100).toFixed(2)},${(30-(x.diff-min)/(max-min||1)*28).toFixed(2)}`).join(' ');
  return `<svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-label="Evolución de diferencia de puntos en rallies cerrados"><line x1="0" y1="30" x2="100" y2="30" stroke="#dbe7f3" stroke-width=".5"/><polyline points="${pts}" fill="none" stroke="#2874ca" stroke-width="1.15" vector-effect="non-scaling-stroke"/></svg>`;
 }
 function build(doc){const root=doc.createElement('section');root.id='vc1937-pro';root.className='vc1937-pro';root.innerHTML=`<nav class="vc1937-tabs" aria-label="Análisis Pro">${TABS.map(([id,t])=>`<button type="button" data-vc1937-tab="${id}" aria-pressed="false">${t}</button>`).join('')}</nav><div class="vc1937-kpis"></div><div class="vc1937-timeline"><div><b>EVOLUCIÓN DE PUNTOS</b><span>Diferencia acumulada · rallies cerrados</span></div><div class="vc1937-graph"></div></div><div class="vc1937-columns"><section class="vc1937-left"><header><strong>ESTADÍSTICAS</strong><span>Tabla táctica principal</span></header><div class="vc1937-left-body"></div><div class="vc1937-details-hint">Selecciona una rotación para filtrar todo el análisis. Las tablas completas siguen disponibles en «Herramientas avanzadas».</div></section><section class="vc1937-center"><header><strong>PISTA TÁCTICA</strong><button data-vc1937-reset type="button">Todas las zonas</button></header><div class="vc1937-courtbody"></div><p class="vc1937-courtnote">A/B/C/D: A abajo derecha, B arriba derecha, C arriba izquierda, D abajo izquierda. Solo zonas codificadas, sin estimaciones.</p></section><aside class="vc1937-right"><header><strong>EVIDENCIA Y VÍDEO</strong><span class="vc1937-rally-count"></span></header><div class="vc1937-rallies" role="listbox" aria-label="Jugadas con los filtros aplicados"></div><div class="vc1937-videobox"><div class="vc1937-video-placeholder"><span>▶</span><strong>Revisión de jugada</strong><small>Reproductor original de Video Studio</small></div><div class="vc1937-rally-detail" aria-live="polite">Selecciona una jugada de la lista.</div><button class="vc1937-open-video" type="button" disabled>Abrir vídeo vinculado</button></div></aside></div><p class="vc1937-source">Solo lectura · Datos derivados del scouting y su registro de rallies. La grabación original no se modifica.</p>`;return root}
 function mount(win){const doc=win.document,view=$(doc,'scout-analysis');if(!view)return;
  let state={tab:'overview',zone:null,selectedRally:null,advanced:false};let attached=false,renderQueued=false,observer=null,matchObserver=null;
  function sync(){const studio=$(doc,'vc157-studio');if(!studio||!view.classList.contains('active')||view.classList.contains('vc1930-active'))return;
   if(!attached){attached=true;view.classList.add('vc1937-primary');const bar=doc.createElement('header');bar.id='vc1937-head';bar.className='vc1937-head';bar.innerHTML='<div><small>VOLLEY COACH · V19.3.7</small><h2>ANALYSIS PRO WORKSPACE</h2><p>Datos · rotaciones · pista · rallies · vídeo</p></div><div class="vc1937-actions"><button type="button" data-vc1937-action="rival">Preparación de rivales</button><button type="button" data-vc1937-action="official">PDF oficial</button><button type="button" data-vc1937-action="csv">Exportar CSV</button><button type="button" data-vc1937-action="advanced">Herramientas avanzadas</button><label class="vc1937-tool-label">Sección avanzada <select id="vc1937-tool"><option value="overview:">Resumen del partido</option><option value="players:builder">Hojas configurables</option><option value="players:sheet">Hoja oficial</option><option value="lab:rotations">Rotaciones K1/K2</option><option value="lab:distribution">Distribución del colocador</option><option value="lab:zones">Zonas y direcciones</option><option value="lab:sequences">Secuencias</option><option value="athletes:profile">Ficha individual</option><option value="comparisons:matches">Comparar partidos</option><option value="reports:">Informes Pro</option></select></label></div>';studio.querySelector('.vc157-toolbar')?.before(bar);
    const work=studio.querySelector('.vc157-work');if(work)work.prepend(build(doc));
    const sample=$(doc,'vc157-sample');if(sample){matchObserver=new win.MutationObserver(queue);matchObserver.observe(sample,{childList:true,characterData:true,subtree:true});}
    const switcher=$(doc,'vc157-tabs');if(switcher){const obs=new win.MutationObserver(()=>{if(!state.advanced)return;});obs.observe(switcher,{childList:true});}
   }
   view.dataset.vc1937Mode=state.advanced?'advanced':'pro';
   if(!state.advanced)paint();
  }
  function queue(){if(renderQueued)return;renderQueued=true;win.setTimeout(()=>{renderQueued=false;sync()},40)}
  function paint(){const panel=$(doc,'vc1937-pro');if(!panel)return;let ctx;
   try{ctx=selectContext(win);}catch(err){console.warn('Analysis Main V19.3.7: solo lectura',err);}
   if(!ctx){panel.querySelector('.vc1937-kpis').innerHTML='<p class="vc1937-empty">Selecciona un scouting para empezar el análisis.</p>';panel.querySelector('.vc1937-left-body').innerHTML='';panel.querySelector('.vc1937-courtbody').innerHTML='';panel.querySelector('.vc1937-rallies').innerHTML='';return}
   panel.querySelectorAll('[data-vc1937-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc1937Tab===state.tab)));
   panel.querySelector('.vc1937-kpis').innerHTML=makeOverview(ctx);panel.querySelector('.vc1937-graph').innerHTML=traceSvg(ctx.data);
   const t=tableFor(ctx,state.tab);panel.querySelector('.vc1937-left-body').innerHTML=`<h3>${esc(t.title)}</h3><p>${esc(t.subtitle)}</p><div class="vc1937-table-scroll"><table><thead><tr>${t.headers}</tr></thead><tbody>${t.body||`<tr><td colspan="7">Sin acciones codificadas para este filtro.</td></tr>`}</tbody></table></div>`;
   const cmap=courtData(ctx.data,state.tab,ctx.team);panel.querySelector('.vc1937-courtbody').innerHTML=courtHtml(cmap,state.zone);
   const selected=ctx.data.rallies.filter(r=>!state.zone||r.actions.some(a=>a.team===ctx.team&&a.skill===cmap.skill&&zone(a.a?.[cmap.skill==='E'?'setTarget':cmap.skill==='R'?'contactZone':cmap.skill==='D'?'contactZone':'endZone'])?.n===state.zone));
   const list=panel.querySelector('.vc1937-rallies');const rows=selected.slice(-150).reverse();
   list.innerHTML=rows.length?rows.map((r,i)=>`<button type="button" class="vc1937-rally${state.selectedRally===`${r.set}:${r.id}`?' is-selected':''}" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="${state.selectedRally===`${r.set}:${r.id}`}"><b>#${r.index} · Set ${r.set}</b><span>R${ctx.team==='ours'?r.rotation||'?':r.opponentRotation||'?'} · ${phaseFor(r,ctx.team)}</span><em class="${r.winning===ctx.team?'win':'lose'}">${r.winning===ctx.team?'Ganado':'Perdido'}</em></button>`).join(''):'<p class="vc1937-empty">Sin rallies con estos filtros y zona.</p>';
   panel.querySelector('.vc1937-rally-count').textContent=`${selected.length} rallies`;
   panel._vc1937Ctx=ctx;panel._vc1937VisibleRallies=selected;
   const chosen=selected.find(r=>`${r.set}:${r.id}`===state.selectedRally)||selected[selected.length-1]||null;
   if(chosen){state.selectedRally=`${chosen.set}:${chosen.id}`;showRally(panel,ctx,chosen)}else{state.selectedRally=null;panel.querySelector('.vc1937-rally-detail').textContent='No hay jugadas en la selección.';panel.querySelector('.vc1937-open-video').disabled=true}
   const current=list.querySelector(`[data-vc1937-rally="${win.CSS?.escape?.(state.selectedRally||'')||''}"]`);if(current){current.classList.add('is-selected');current.setAttribute('aria-selected','true')}
  }
  function showRally(panel,ctx,r){const actions=r.actions.filter(a=>a.team===ctx.team),playable=actions.filter(a=>a.video&&a.key);
   panel.querySelector('.vc1937-rally-detail').textContent=`Set ${r.set} · Rally ${r.index} · ${phaseFor(r,ctx.team)} · ${r.winning===ctx.team?'Punto nuestro':'Punto rival'} · ${actions.length} acciones · ${playable.length} con vídeo`;
   panel.querySelector('.vc1937-open-video').disabled=!playable.length||!win.VC_VIDEO_ANALYTICS_1612?.openKeys;
   panel._vc1937Video={id:ctx.match.id,keys:playable.map(a=>a.key)};
  }
  view.addEventListener('click',event=>{const panel=$(doc,'vc1937-pro');const b=event.target.closest('button');if(!b||!view.contains(b))return;
   if(b.dataset.vc1937Action){event.preventDefault();const action=b.dataset.vc1937Action;if(action==='advanced'){state.advanced=!state.advanced;b.textContent=state.advanced?'Volver al Workspace':'Herramientas avanzadas';sync();return;}
    if(action==='rival'){$(doc,'vc1930-open')?.click();return}
    if(action==='official'){$(doc,'vc157-official')?.click();return}
    if(action==='csv'){$(doc,'vc157-csv')?.click();return}
   }
   if(b.dataset.vc1937Tab&&panel){state.tab=b.dataset.vc1937Tab;state.zone=null;state.selectedRally=null;paint();return}
   if(b.dataset.vc1937Rotation){const select=$(doc,'vc157-rotation');if(select){select.value=b.dataset.vc1937Rotation;select.dispatchEvent(new win.Event('change',{bubbles:true}));queue()}return}
   if(b.dataset.vc1937Zone){state.zone=state.zone===Number(b.dataset.vc1937Zone)?null:Number(b.dataset.vc1937Zone);state.selectedRally=null;paint();return}
   if(b.hasAttribute('data-vc1937-reset')){state.zone=null;state.selectedRally=null;paint();return}
   if(b.dataset.vc1937Rally&&panel){state.selectedRally=b.dataset.vc1937Rally;const ctx=panel._vc1937Ctx,r=arr(panel._vc1937VisibleRallies).find(r=>`${r.set}:${r.id}`===state.selectedRally);if(ctx&&r){panel.querySelectorAll('[data-vc1937-rally]').forEach(x=>{const a=x===b;x.classList.toggle('is-selected',a);x.setAttribute('aria-selected',String(a))});showRally(panel,ctx,r)}return}
   if(b.classList.contains('vc1937-open-video')&&panel){const ref=panel._vc1937Video;if(!ref?.keys?.length)return;try{win.VC_VIDEO_ANALYTICS_1612?.openKeys?.(ref.id,ref.keys);}catch(e){console.warn('Video vinculado V19.3.7',e)}return}
  });
  view.addEventListener('change',e=>{if(e.target.id==='vc1937-tool'){const [page,sub='']=e.target.value.split(':');const api=win.VC173_ANALYSIS_WORKSPACE;if(api?.selectPage){api.selectPage(page,sub);}else{$(doc,'vc157-tabs')?.querySelector(`[data-section="${page}"]`)?.click();if(sub)$(doc,'vc1620-subtabs')?.querySelector(`[data-subpage="${sub}"]`)?.click();}return}if(['vc157-match','vc157-team','vc157-set','vc157-rotation','vc157-phase'].includes(e.target.id)){state.zone=null;state.selectedRally=null;queue()}},true);
  const watcher=new win.MutationObserver(()=>{if(view.classList.contains('active'))queue();});watcher.observe(view,{attributes:true,attributeFilter:['class','data-vc157-mode']});
  if(view.classList.contains('active'))queue();
  const childObserver=new win.MutationObserver(()=>{if(!attached&&$(doc,'vc157-studio'))queue()});childObserver.observe(view,{childList:true,subtree:true});
  win.addEventListener('focus',()=>{if(view.classList.contains('active'))queue()});
  win.VC_ANALYSIS_MAIN_1937?.__setMounted?.(true);
 }
 let mounted=false;const __setMounted=x=>{mounted=x};
 return {VERSION,TABS,SKILLS,zone,pct,fmt,effort,phaseFor,courtData,tableFor,makeOverview,traceSvg,selectContext,mount,__setMounted,get mounted(){return mounted}};
});
