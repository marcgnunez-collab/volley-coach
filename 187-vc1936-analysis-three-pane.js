/* Volley Coach V19.3.6 · Professional Three-Pane Analysis
 * Presentation-only extension of the existing V19.3.5 and V19.3.0 engines.
 * Does NOT write scoutings, recordings, cloud records or match state.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_ANALYSIS_WORKSPACE_1936=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const v=x=>String(x??'').trim();
 const escape=x=>v(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ZONES=[2,3,4,1,6,5];
 // Relative to the bench: rival is above the net, our court below it.
 const START_POS={1:[0.17,0.14],6:[0.5,0.14],5:[0.83,0.14],2:[0.17,0.39],3:[0.5,0.39],4:[0.83,0.39]};
 const END_POS={4:[0.17,0.61],3:[0.5,0.61],2:[0.83,0.61],5:[0.17,0.86],6:[0.5,0.86],1:[0.83,0.86]};
 const parseZone=input=>{const m=v(input).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);return m?{zone:Number(m[1]),quadrant:m[2]||''}:null;};
 const ratio=(count,total)=>total?Math.round(1000*count/total)/10:null;
 function courtModel(rows,team='opponent'){
  const attacks=[];
  for(const r of Array.isArray(rows)?rows:[]){
   for(const a of Array.isArray(r?.actions)?r.actions:[]){if(a?.skill==='A'&&a?.team===team)attacks.push({r,a,start:parseZone(a.a?.startZone),end:parseZone(a.a?.endZone)});}
  }
  const collect=key=>{
   const coded=attacks.filter(x=>x[key]);
   return {coded:coded.length,missing:attacks.length-coded.length,zones:[1,2,3,4,5,6,7,8,9].map(zone=>{
    const entries=coded.filter(x=>x[key].zone===zone),quad=Object.fromEntries(['A','B','C','D'].map(q=>[q,entries.filter(x=>x[key].quadrant===q).length]));
    return {zone,n:entries.length,pct:ratio(entries.length,coded.length),quadrants:quad,quadrantCoded:Object.values(quad).reduce((s,n)=>s+n,0)};
   })};
  };
  const paths=new Map();
  for(const x of attacks){if(!x.start||!x.end||!START_POS[x.start.zone]||!END_POS[x.end.zone])continue;
   const key=x.start.zone+'-'+x.end.zone;
   const entry=paths.get(key)||{from:x.start.zone,to:x.end.zone,n:0};entry.n++;paths.set(key,entry);
  }
  return {total:attacks.length,origin:collect('start'),destination:collect('end'),
   paths:[...paths.values()].sort((a,b)=>b.n-a.n||a.from-b.from||a.to-b.to), paired:attacks.filter(x=>x.start&&x.end).length,team};
 }
 function courtView(model,mode='origin'){
  const origin=mode!=='destination';const info=origin?model.origin:model.destination;
  const zoneData=n=>info.zones.find(x=>x.zone===n)||{zone:n,n:0,pct:null,quadrants:{},quadrantCoded:0};
  const max=Math.max(1,...info.zones.map(x=>x.n));
  // Canvas-based model is independent of scouting: all percentages come from coded attacks.
  const zoneCell=(no,side)=>{
   const applicable=side===(origin?'top':'bottom');const x=applicable?zoneData(no):null;
   const quadrants=x?['C','B','D','A'].map(q=>`<span title="Subzona ${q}: ${x.quadrants[q]} ataques">${q}${x.quadrants[q]?' · '+x.quadrants[q]:''}</span>`).join(''):'';
   const intensity=x&&x.n?Math.max(0.09,Math.min(0.67,x.n/max*.60)):0;
   const label=x?`Zona ${no}: ${x.n} ataques, ${x.pct}% de las zonas conocidas`:`Zona ${no} (lado ${side==='top'?'rival':'propio'})`;
   const filter=applicable?'data-vc1932-zone="'+no+'" data-vc1932-zone-kind="'+(origin?'start':'end')+'"':'';
   return `<button type="button" class="vc1936-zone${applicable?' is-active':''}" ${filter} ${!applicable||!x?.n?'disabled':''} aria-label="${escape(label)}" style="--vc1936-heat:${intensity}"><b>Z${no}</b>${applicable?`<strong>${x.n||'—'}</strong><small>${x.pct!=null?x.pct.toLocaleString('es-ES')+' %':'Sin datos'}</small><div class="vc1936-subzones" aria-label="Subzonas">${quadrants}</div>`:''}</button>`;
  };
  const top=[1,6,5,2,3,4].map(no=>zoneCell(no,'top')).join('');
  const bottom=[4,3,2,5,6,1].map(no=>zoneCell(no,'bottom')).join('');
  const lines=model.paths.slice(0,6).map((p,i)=>{
   const a=START_POS[p.from],b=END_POS[p.to];const x=a[0]*600,y=a[1]*620,X=b[0]*600,Y=b[1]*620;
   const bend=(i%2?1:-1)*Math.min(35,9*i);
   return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x+X)/2+bend} 310 ${X.toFixed(1)} ${Y.toFixed(1)}" stroke="${i===0?'#ed8425':'#185d98'}" stroke-width="${Math.min(7,2+p.n)}" fill="none" stroke-linecap="round" marker-end="url(#vc1936-head)" opacity=".72"/>`;
  }).join('');
  return `<div class="vc1936-court" role="group" aria-label="Pista táctica interactiva, ${origin?'origen':'destino'} de ataques"><div class="vc1936-court-label">RIVAL · LADO SUPERIOR</div><div class="vc1936-court-half rival">${top}</div><div class="vc1936-net"><span>RED</span></div><div class="vc1936-court-half own">${bottom}</div><div class="vc1936-court-label">NUESTRO CAMPO · LADO INFERIOR</div>${model.paths.length?`<svg class="vc1936-paths" viewBox="0 0 600 620" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="vc1936-head" markerWidth="5" markerHeight="5" refX="3" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4" fill="none" stroke="#165a97" stroke-width="1.5"/></marker></defs>${lines}</svg>`:''}</div>`;
 }
 function quickFilters(panel){
  const toolbar=panel.querySelector('#vc1935-toolbar');if(!toolbar)return;
  let quick=toolbar.querySelector('.vc1936-quick');if(quick)return;
  quick=panel.ownerDocument.createElement('div');quick.className='vc1936-quick';quick.setAttribute('aria-label','Filtros tácticos principales');
  for(const id of ['vc1930-rival','vc1930-scope','vc1930-phase','vc1930-rotation','vc1932-own-rotation','vc1932-reception']){
   const field=panel.querySelector('#'+id);const label=field?.closest('label');if(label)quick.append(label);
  }
  toolbar.querySelector('.vc1935-tabs')?.before(quick);
  toolbar.querySelector('.vc1935-toolbar-top strong').textContent='VOLLEY COACH · ANALYSIS PRO';
  const hint=toolbar.querySelector('.vc1935-toolbar-top span');if(hint)hint.textContent='Tablas · Pista · Evidencia en una sola vista';
 }
 function miniEvidence(panel,selected){
  const side=panel.querySelector('.vc1935-evidence');if(!side)return;
  side.querySelector('.vc1935-evidence-hint')?.remove();
  side.querySelector('.vc1935-evidence-mini')?.remove();
  side.querySelector('.vc1935-evidence-count')?.remove();
  side.querySelector('.vc1936-review')?.remove();
  const doc=panel.ownerDocument;
  const section=doc.createElement('div');section.className='vc1936-review';
  section.innerHTML='<div class="vc1936-review-title"><strong>Rallies filtrados</strong><span data-vc1936-rally-count></span></div><div class="vc1936-rally-list" role="listbox" aria-label="Rallies filtrados"></div><div class="vc1936-review-preview"><div class="vc1936-preview-screen"><span aria-hidden="true">▶</span><strong>Vídeo del rally</strong><small>Se abre en el reproductor vinculado de Video Studio</small></div><div class="vc1936-rally-meta" aria-live="polite"></div><button type="button" class="vc1936-play" disabled>Selecciona un rally</button></div>';
  const list=section.querySelector('.vc1936-rally-list'),preview=section.querySelector('.vc1936-review-preview'),count=section.querySelector('[data-vc1936-rally-count]');
  const entries=(Array.isArray(selected)?selected:[]).slice().reverse().slice(0,100);
  count.textContent=`${entries.length} de ${selected?.length||0}`;
  entries.forEach((r,i)=>{
   const b=doc.createElement('button');b.type='button';b.className='vc1936-rally-item';b.setAttribute('role','option');b.setAttribute('aria-selected','false');
   const text=doc.createElement('span');text.textContent=`S${r.set??'?'} · #${r.index??r.rally??'?'} · ${r.phase||'—'} · ${r.rotation?'R'+r.rotation:'Rot. —'}`;
   const result=doc.createElement('b');result.textContent=r.winner==='opponent'?'Punto rival':'Punto nuestro';
   b.append(text,result);
   b.addEventListener('click',()=>{
    list.querySelectorAll('[role=option]').forEach(x=>x.setAttribute('aria-selected','false'));b.setAttribute('aria-selected','true');
    const details=preview.querySelector('.vc1936-rally-meta');details.textContent=`${r.opponent||'Rival'} · ${r.date||''} · Set ${r.set||'—'} · Rally ${r.index??r.rally??'—'}`;
    const play=preview.querySelector('.vc1936-play');const eligible=r.id!=null&&r.rally!=null&&r.set!=null;
    play.disabled=!eligible;play.textContent=eligible?'Abrir vídeo de este rally':'Sin enlace a vídeo';
    if(eligible){play.dataset.vc1930Video=String(r.id);play.dataset.vc1930Set=String(r.set);play.dataset.vc1930Rally=String(r.rally);}
    else{delete play.dataset.vc1930Video;delete play.dataset.vc1930Set;delete play.dataset.vc1930Rally;}
   });list.append(b);
  });
  if(!entries.length){const p=doc.createElement('p');p.className='vc1936-empty';p.textContent='No hay rallies cerrados con los filtros actuales.';list.append(p);}
  side.querySelector('.vc1935-evidence-head')?.after(section);
 }
 function renderCenter(doc,model){
  const center=doc.createElement('div');center.className='vc1936-center';
  center.innerHTML=`<div class="vc1936-center-head"><div><strong>PISTA TÁCTICA</strong><span>${model.total} ataques registrados · ${model.origin.coded} con origen · ${model.destination.coded} con destino</span></div><div class="vc1936-switch" role="group" aria-label="Tipo de mapa"><button type="button" data-vc1936-mode="origin" class="is-selected">Origen</button><button type="button" data-vc1936-mode="destination">Destino</button></div></div><div class="vc1936-court-host"></div><div class="vc1936-court-summary"><div><strong>${model.total}</strong><span>Ataques</span></div><div><strong>${model.paired}</strong><span>Trayectorias con ambos extremos</span></div><div><strong>${model.origin.missing}</strong><span>Sin origen codificado</span></div></div><p class="vc1936-court-note">Porcentajes sobre ataques con la zona codificada. A/B/C/D: A abajo derecha, B arriba derecha, C arriba izquierda, D abajo izquierda. La flecha solo representa pares origen-destino registrados; no es una trayectoria medida del balón.</p>`;
  const host=center.querySelector('.vc1936-court-host');let mode='origin';
  const apply=()=>{host.innerHTML=courtView(model,mode);center.querySelectorAll('[data-vc1936-mode]').forEach(b=>b.classList.toggle('is-selected',b.dataset.vc1936Mode===mode));};
  center.querySelectorAll('[data-vc1936-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.vc1936Mode;apply();}));
  apply();return center;
 }
 function afterRender(panel,data){
  if(!panel?.querySelector?.('.vc1935-split'))return;
  panel.classList.add('vc1936-ready');quickFilters(panel);
  const split=panel.querySelector('.vc1935-split'),main=split.querySelector(':scope > .vc1935-main'),side=split.querySelector(':scope > .vc1935-evidence');
  if(!main||!side)return;
  const doc=panel.ownerDocument;const model=courtModel(data?.selected,panel.querySelector('#vc1933-team')?.value==='ours'?'ours':'opponent');
  const center=renderCenter(doc,model);
  const left=doc.createElement('div');left.className='vc1936-left';left.append(main);
  const label=doc.createElement('div');label.className='vc1936-left-head';label.innerHTML='<strong>ANÁLISIS ESTADÍSTICO</strong><span>Tablas y resultados · selección actual</span>';left.prepend(label);
  split.replaceChildren(left,center,side);split.classList.add('vc1936-three');
  miniEvidence(panel,data?.selected||[]);
  const active=panel._vc1935?.active||'overview';switchLayout(panel,active);
 }
 function switchLayout(panel,tab){
  if(!panel?.classList?.contains('vc1936-ready'))return;
  panel.dataset.vc1936Tab=tab;
  const center=panel.querySelector('.vc1936-center');if(center)center.hidden=tab==='evidence';
  const left=panel.querySelector('.vc1936-left');if(left)left.hidden=tab==='evidence';
  const side=panel.querySelector('.vc1935-evidence');if(side){side.classList.remove('vc1935-evidence-full');}
 }
 function showEvidence(panel){
  // Existing event handlers update the shared filters; stay in the tripanel workspace.
  if(panel?.classList?.contains('vc1936-ready')){
   const aside=panel.querySelector('.vc1935-evidence');aside?.scrollIntoView?.({block:'nearest',behavior:'instant'});
   aside?.classList.add('vc1936-attention');return true;
  }
  return false;
 }
 return {VERSION:'19.3.6',ZONES,parseZone,ratio,courtModel,courtView,afterRender,switchLayout,showEvidence};
});
