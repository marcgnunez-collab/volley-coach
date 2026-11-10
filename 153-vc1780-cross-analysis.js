/* Volley Coach V17.8.0 · Cruces Pro (Analysis Pro)
 * READ ONLY. Reuses the current Analyst Studio selectors and the existing
 * VC_ANALYSIS_INTELLIGENCE_1614 extraction/model. Does not mutate scouting,
 * rankings, ratings, official PDFs, cloud state, video or storage.
 */
(function(root, factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.8.0';
 const TYPES=[['setters','Colocador → atacante'],['receives','Recepción → ataque'],['rotations','Rotaciones y ataque'],['routes','Rutas de ataque'],['players','Individual G-P']];
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const num=x=>Number.isFinite(+x)?+x:0;
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const zone=x=>{const v=str(x).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return v?`${v[1]}${v[2]||''}`:'';};
 const pct=(n,d)=>d?`${(100*n/d).toLocaleString('es-ES',{maximumFractionDigits:1})}%`:'—';
 const signed=n=>n>0?`+${n}`:String(n);
 const group=(items,fn)=>{const map=new Map();for(const item of items){const key=str(fn(item))||'Sin codificar';if(!map.has(key))map.set(key,[]);map.get(key).push(item)}return [...map].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'es'));};
 const evalAttack=(items,get=x=>x)=>{const xs=items.map(get).filter(Boolean),n=xs.length,k=xs.filter(x=>x.ev==='#').length,e=xs.filter(x=>x.ev==='=').length,b=xs.filter(x=>x.ev==='/').length;return {n,k,e,b,gp:k-e-b,eff:n?(k-e-b)/n:null};};
 const fmtEff=x=>x==null?'—':`${(x*100).toLocaleString('es-ES',{maximumFractionDigits:1})}%`;
 const rowSorter=(a,b)=>b.n-a.n||str(a.label).localeCompare(str(b.label),'es');
 function compute(data){
  const pairs=arr(data?.pairs),chains=arr(data?.chains),attacks=arr(data?.attacks),actions=arr(data?.actions),rallies=arr(data?.rallies),team=data?.target==='opponent'?'opponent':'ours';
  const linked=pairs.filter(p=>p.attack);
  const setters=group(linked,p=>`${str(p.set?.player)||'Sin identificar'} → ${str(p.attack?.player)||'Sin identificar'}`).map(([label,ps])=>{
   const a=evalAttack(ps,p=>p.attack),[setter,attacker]=label.split(' → ');
   const tempos=group(ps,p=>p.attack?.a?.attackTempo||p.set?.a?.setTempo)[0];
   const targets=group(ps,p=>p.set?.a?.setTarget||p.set?.a?.attackCombo)[0];
   return {label,setter,attacker,...a,tempo:tempos?.[0]||'Sin codificar',target:targets?.[0]||'Sin codificar'};
  }).sort(rowSorter);
  const recType=ev=>['#','+'].includes(ev)?'Positiva (# / +)':ev==='!'?'Neutra (!)':['-','/','='].includes(ev)?'Negativa (-, /, =)':'Sin valorar';
  const receives=group(chains,c=>recType(c.rec?.ev)).map(([label,ps])=>{
   const a=evalAttack(ps,p=>p.attack),won=ps.filter(p=>p.outcome).length;
   return {label,chains:ps.length,won,attacks:a.n,...a,k1pct:ps.length?won/ps.length:null};
  });
  const rotations=Array.from({length:6},(_,i)=>{
   const no=i+1,aa=attacks.filter(a=>a.rotation===no),r=rallies.filter(x=>(team==='ours'?x.rotation:x.opponentRotation)===no&&x.winning),k1=r.filter(x=>x.serving&&x.serving!==team),k2=r.filter(x=>x.serving===team),a=evalAttack(aa);
   return {label:`R${no}`,rotation:no,...a,k1n:k1.length,k1w:k1.filter(x=>x.winning===team).length,k2n:k2.length,k2w:k2.filter(x=>x.winning===team).length,rallies:r.length};
  });
  const validRoutes=attacks.filter(x=>zone(x.a?.startZone)&&zone(x.a?.endZone));
  const routes=group(validRoutes,a=>`${zone(a.a.startZone)} → ${zone(a.a.endZone)}`).map(([label,aa])=>({label,...evalAttack(aa)}));
  const players=group(actions,a=>a.player).map(([label,aa])=>{
   const atk=aa.filter(a=>a.skill==='A'),recs=aa.filter(a=>a.skill==='R'),s=aa.filter(a=>a.skill==='S'),sets=aa.filter(a=>a.skill==='E'),st=evalAttack(atk);
   return {label,n:aa.length,attack:st.n,k:st.k,e:st.e,b:st.b,gp:st.gp,eff:st.eff,receives:recs.length,positive:recs.filter(a=>['#','+'].includes(a.ev)).length,serves:s.length,aces:s.filter(a=>a.ev==='#').length,sets:sets.length};
  }).sort(rowSorter);
  return {setters,receives,rotations,routes,players,sample:{rallies:rallies.length,actions:actions.length,attacks:attacks.length,sets:pairs.length,linked:linked.length,chains:chains.length,validRoutes:validRoutes.length,unresolvedPairs:pairs.length-linked.length,attackZoneMissing:attacks.length-validRoutes.length}};
 }
 function dataForMatch(match, bridge, intel, filters){
  const phase=filters.phase;
  let m=match;
  if(phase==='K1'||phase==='K2'){
   const expected=phase==='K1'?(filters.team==='opponent'?'ours':'opponent'):(filters.team==='opponent'?'opponent':'ours');
   m={...match,sets:arr(match.sets).map(s=>({...s,rallies:arr(s.rallies).filter(r=>r?.servingBefore===expected)}))};
  }
  return intel.model(m,bridge,{team:filters.team,set:filters.set,rotation:filters.rotation});
 }
 function td(val,attrs=''){return `<td ${attrs}>${esc(val)}</td>`;}
 function mini(value,n){return `<div class="vc1780-rate"><span>${pct(value,n)}</span><i style="width:${n?Math.max(0,Math.min(100,value*100/n)):0}%"></i></div>`;}
 function table(headers,rows,empty='No hay datos codificados para esta selección.'){
  return `<div class="vc1780-overflow"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(c=>`<tr>${c}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="vc1780-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
 }
 function note(text){return `<p class="vc1780-footnote">${esc(text)}</p>`;}
 function viewHtml(tab,data){
  const {setters,receives,rotations,routes,players,sample}=data;
  if(tab==='setters')return `<h3>Relación colocador–atacante</h3><p>Asocia cada colocación al ataque siguiente de la misma posesión. No asigna ataques si interviene el rival o falta un registro válido.</p>`+
   table(['Colocador → atacante','Ataques','Puntos (#)','Errores (=)','Bloqueos (/)','G-P','EFF','Tempo más frecuente','Destino más frecuente'],setters.map(x=>[td(x.label),td(x.n),td(x.k),td(x.e),td(x.b),td(signed(x.gp),'class="vc1780-number"'),td(fmtEff(x.eff)),td(x.tempo),td(x.target)].join('')))+
   note(`${sample.sets} colocaciones registradas; ${sample.linked} vinculadas con un ataque; ${sample.unresolvedPairs} sin ataque vinculado. El tempo y el destino solo se muestran si fueron codificados.`);
  if(tab==='receives')return `<h3>Cadena recepción → colocación → ataque</h3><p>Cadenas de K1 agrupadas por valoración de recepción. El side-out es el rally ganado; el punto de ataque (#) es una valoración de una acción y se cuenta por separado.</p>`+
   table(['Recepción','Cadenas K1','Side-out G','Side-out %','Ataques ligados','Puntos de ataque','Errores','Bloqueos','EFF ataque'],receives.map(x=>[td(x.label),td(x.chains),td(x.won),`<td>${mini(x.won,x.chains)}</td>`,td(x.attacks),td(x.k),td(x.e),td(x.b),td(fmtEff(x.eff))].join('')))+
   note(`${sample.chains} cadenas con recepción. Sin recepción codificada no es posible atribuir calidad de pase. Los ataques se vinculan solo si están en el mismo rally y después de la recepción.`);
  if(tab==='rotations')return `<h3>Rotaciones · K1/K2 y finalización</h3><p>Compara la conversión del rally con el ataque codificado en cada rotación. Las muestras pequeñas requieren revisión de vídeo antes de interpretar diferencias.</p>`+
   table(['Rotación','Rallies','K1 G/N','K1 %','K2 G/N','K2 %','Ataques','G-P ataque','EFF ataque'],rotations.map(x=>[td(x.label),td(x.rallies),td(`${x.k1w}/${x.k1n}`),`<td>${mini(x.k1w,x.k1n)}</td>`,td(`${x.k2w}/${x.k2n}`),`<td>${mini(x.k2w,x.k2n)}</td>`,td(x.n),td(signed(x.gp)),td(fmtEff(x.eff))].join('')))+
   note('K1: rallies ganados al recibir / rallies con saque rival conocido. K2: rallies ganados al sacar / rallies con saque propio conocido. Las acciones incompletas no crean rallies adicionales.');
  if(tab==='routes')return `<h3>Rutas de ataque · zonas y subzonas A/B/C/D</h3><p>Relación de origen y destino explícitamente codificados. Una subzona forma parte de su zona numerada; no se infieren trayectorias ausentes.</p>`+
   table(['Origen → destino','Ataques','Frecuencia del total codificado','Puntos (#)','Errores (=)','Bloqueos (/)','G-P','EFF'],routes.slice(0,30).map(x=>[td(x.label),td(x.n),`<td>${mini(x.n,sample.validRoutes)}</td>`,td(x.k),td(x.e),td(x.b),td(signed(x.gp)),td(fmtEff(x.eff))].join('')))+
   note(`Rutas completas ${sample.validRoutes}/${sample.attacks} ataques. ${sample.attackZoneMissing} sin origen y destino válidos. Se muestran hasta 30 rutas, ordenadas por frecuencia.`);
  return `<h3>Rendimiento individual · conteos reales</h3><p>G-P corresponde a puntos directos de ataque (#) menos errores (=) y bloqueos recibidos (/). No equivale al saldo completo de puntos del partido.</p>`+
   table(['Jugador','Acciones','Ataques','Puntos A','Errores A','Bloqueos /','G-P ataque','EFF A','Recep. +/#','Saques ace','Colocaciones'],players.map(x=>[td(x.label),td(x.n),td(x.attack),td(x.k),td(x.e),td(x.b),td(signed(x.gp)),td(fmtEff(x.eff)),td(`${x.positive}/${x.receives}`),td(`${x.aces}/${x.serves}`),td(x.sets)].join('')))+
   note('Solo se contabilizan acciones vinculadas a rallies cerrados. Sin identificación de jugador, las acciones se agrupan como «Sin identificar».');
 }
 function sheetRows(tab,data){
  const d=data;
  if(tab==='setters')return [['Colocador','Atacante','Ataques','Puntos','Errores','Bloqueos','G-P','EFF','Tempo','Destino'],...d.setters.map(x=>[x.setter,x.attacker,x.n,x.k,x.e,x.b,x.gp,fmtEff(x.eff),x.tempo,x.target])];
  if(tab==='receives')return [['Recepción','Cadenas','Sideout ganados','Sideout %','Ataques','Puntos','Errores','Bloqueos','EFF'],...d.receives.map(x=>[x.label,x.chains,x.won,pct(x.won,x.chains),x.attacks,x.k,x.e,x.b,fmtEff(x.eff)])];
  if(tab==='rotations')return [['Rotación','Rallies','K1 ganados','K1 total','K2 ganados','K2 total','Ataques','Puntos','Errores','Bloqueos','G-P','EFF'],...d.rotations.map(x=>[x.label,x.rallies,x.k1w,x.k1n,x.k2w,x.k2n,x.n,x.k,x.e,x.b,x.gp,fmtEff(x.eff)])];
  if(tab==='routes')return [['Ruta','Ataques','Porcentaje del total de rutas','Puntos','Errores','Bloqueos','G-P','EFF'],...d.routes.map(x=>[x.label,x.n,pct(x.n,d.sample.validRoutes),x.k,x.e,x.b,x.gp,fmtEff(x.eff)])];
  return [['Jugador','Acciones','Ataques','Puntos ataque','Errores ataque','Bloqueos','G-P ataque','EFF','Recepciones','Recepciones positivas','Saques','Aces','Colocaciones'],...d.players.map(x=>[x.label,x.n,x.attack,x.k,x.e,x.b,x.gp,fmtEff(x.eff),x.receives,x.positive,x.serves,x.aces,x.sets])];
 }
 function csvCells(rows){
  return '\ufeff'+rows.map(r=>r.map(v=>{
   let s=str(v);if(typeof v==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';
  }).join(';')).join('\r\n')+'\r\n';
 }
 const CSS=`
 #scout-analysis[data-vc1780-view="cross"] #vc157-studio .vc157-work{display:none!important}
 #vc1780-cross-panel[hidden]{display:none!important}
 #vc1780-cross-panel{background:#f6f9fd;padding:18px;display:grid;gap:13px;color:#173c5d;font:400 12px/1.5 system-ui,-apple-system,sans-serif}
 #vc1780-cross-panel *{box-sizing:border-box}
 #vc1780-cross-panel .vc1780-title{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #d9e5f0;padding-bottom:14px}
 #vc1780-cross-panel .vc1780-kicker{font-weight:850;font-size:10px;letter-spacing:.09em;color:#2774b7}
 #vc1780-cross-panel h2{margin:3px 0 4px!important;font:850 22px/1.15 system-ui!important;color:#133a60!important}
 #vc1780-cross-panel h3{margin:0 0 5px!important;font:850 16px/1.2 system-ui!important;color:#153e66!important}
 #vc1780-cross-panel p{margin:0;color:#58758d;font-size:12px;line-height:1.55}
 #vc1780-cross-panel .vc1780-actions{display:flex;flex-wrap:wrap;gap:6px}
 #vc1780-cross-panel button{background:white!important;border:1px solid #c7d9e9!important;color:#205882!important;min-height:37px!important;border-radius:8px!important;padding:8px 11px!important;font:750 11px/1.2 system-ui!important;cursor:pointer}
 #vc1780-cross-panel button:hover{background:#e8f3ff!important}
 #vc1780-cross-panel button:focus-visible{outline:3px solid #7db9f6!important;outline-offset:2px}
 #vc1780-cross-panel .vc1780-tabs{display:flex;gap:7px;flex-wrap:wrap}
 #vc1780-cross-panel .vc1780-tabs button[aria-pressed="true"]{background:#174d85!important;color:#fff!important;border-color:#174d85!important}
 #vc1780-cross-panel .vc1780-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
 #vc1780-cross-panel .vc1780-kpi{background:#fff;border:1px solid #dce7f0;border-radius:10px;padding:12px 14px;display:grid;gap:2px}
 #vc1780-cross-panel .vc1780-kpi small{font:800 10px/1.3 system-ui;color:#718ba0}
 #vc1780-cross-panel .vc1780-kpi strong{font:850 24px/1.2 system-ui;color:#133e6a}
 #vc1780-cross-panel .vc1780-kpi span{font-size:10px;color:#718ba0}
 #vc1780-cross-panel .vc1780-card{background:#fff;border:1px solid #dce7f0;border-radius:13px;padding:14px;min-width:0}
 #vc1780-cross-panel .vc1780-context{font-size:11px;color:#648198;line-height:1.5;margin-bottom:10px}
 #vc1780-cross-panel .vc1780-overflow{max-width:100%;overflow:auto;overscroll-behavior-x:contain;border-radius:8px;border:1px solid #e1eaf1}
 #vc1780-cross-panel table{width:100%;min-width:740px;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:11px;white-space:nowrap}
 #vc1780-cross-panel th{text-align:left;background:#ebf3fa;color:#325e82;font-size:10px;letter-spacing:.01em;padding:11px 9px;border-bottom:1px solid #d7e6f2;position:sticky;top:0}
 #vc1780-cross-panel td{padding:10px 9px;color:#294c68;border-bottom:1px solid #edf2f7}
 #vc1780-cross-panel tbody tr:nth-child(even){background:#f9fbfd}
 #vc1780-cross-panel .vc1780-number{font-weight:850;color:#15507d}
 #vc1780-cross-panel .vc1780-rate{position:relative;display:inline-flex;min-width:64px;padding-bottom:4px;font-weight:750;color:#295976}
 #vc1780-cross-panel .vc1780-rate i{position:absolute;bottom:0;left:0;height:3px;background:#3386c6;max-width:100%;border-radius:2px}
 #vc1780-cross-panel .vc1780-empty{text-align:center;color:#738da2;padding:28px}
 #vc1780-cross-panel .vc1780-footnote{font-size:10.5px;color:#6c8297;margin-top:11px;line-height:1.5}
 #vc1780-cross-panel .vc1780-notice{border-left:3px solid #76a8d4;padding:9px 11px;background:#edf6ff;border-radius:6px;font-size:11px;color:#3b6383}
 #scout-analysis .vc1730-links [data-vc1780-open]{background:#eaf4ff!important;border-color:#9ac3e7!important;color:#16558c!important;font-weight:850!important}
 #scout-analysis .vc1730-links [data-vc1780-open][aria-current="page"]{background:#174d85!important;color:#fff!important}
 @media(max-width:850px){#vc1780-cross-panel{padding:11px}#vc1780-cross-panel .vc1780-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:460px){#vc1780-cross-panel .vc1780-kpis{gap:5px}#vc1780-cross-panel .vc1780-kpi{padding:9px}#vc1780-cross-panel .vc1780-kpi strong{font-size:19px}#vc1780-cross-panel .vc1780-tabs{display:grid;grid-template-columns:1fr 1fr}#vc1780-cross-panel .vc1780-title{align-items:flex-start}}
 `;
 function mount(root){
  const doc=root.document,state={open:false,tab:'setters',data:null,signature:'',renders:0};
  const $=id=>doc.getElementById(id);
  const analysis=()=> $('scout-analysis');
  const active=()=>!!analysis()?.classList.contains('active');
  function selected(){
   const el=$('vc157-match'),id=str(el?.value),bridge=root.VC_SCOUT_VIDEO_BRIDGE||root.VC_SCOUT_REPORT_BRIDGE;
   if(!bridge)return {error:'No está disponible el motor de lectura de scoutings.'};
   const all=new Map();
   for(const source of [root.VC_SCOUT_REPORT_BRIDGE,root.VC_SCOUT_VIDEO_BRIDGE]){
    try{for(const m of arr(source?.getMatches?.()))if(m&&m.id!=null)all.set(String(m.id),m);}catch(e){console.warn('V17.8 · lectura de scoutings:',e)}
   }
   const match=id?all.get(id):null;
   if(!id||!match)return {error:'Selecciona un scouting válido en el selector superior. No se sustituirá por otro automáticamente.'};
   const filters={team:$('vc157-team')?.value==='opponent'?'opponent':'ours',set:$('vc157-set')?.value||'',rotation:$('vc157-rotation')?.value||'',phase:$('vc157-phase')?.value||''};
   const intel=root.VC_ANALYSIS_INTELLIGENCE_1614;
   if(!intel?.model)return {error:'El motor de análisis aún no se ha cargado.'};
   return {match,filters,bridge,intel,label:str(el.selectedOptions?.[0]?.textContent)||'Scouting seleccionado'};
  }
  function paint(){
   if(!state.open||!active())return;
   const panel=$('vc1780-cross-panel');if(!panel)return;
   state.renders++;
   const one=selected();
   if(one.error){state.data=null;panel.querySelector('[data-vc1780-info]').textContent=one.error;panel.querySelector('[data-vc1780-kpis]').innerHTML='';panel.querySelector('[data-vc1780-body]').innerHTML=`<div class="vc1780-notice">${esc(one.error)}</div>`;return;}
   const f=one.filters;let result;
   try{result=compute(dataForMatch(one.match,one.bridge,one.intel,f));}
   catch(e){console.warn('V17.8 Cross Analysis · lectura fallida:',e);state.data=null;panel.querySelector('[data-vc1780-body]').innerHTML='<div class="vc1780-notice">No se han podido calcular los cruces de este scouting. Las estadísticas originales no se han modificado.</div>';return;}
   state.data=result;
   const sample=result.sample;
   panel.querySelector('[data-vc1780-info]').textContent=`${one.label} · ${f.team==='opponent'?'Rival':'Nuestro equipo'} · ${f.set?'Set '+f.set:'Todos los sets'} · ${f.rotation?'R'+f.rotation:'Todas las rotaciones'} · ${f.phase||'K1 + K2'}`;
   panel.querySelector('[data-vc1780-kpis]').innerHTML=[['Rallies cerrados',sample.rallies,'Con resultado válido'],['Acciones',sample.actions,'Del equipo y filtro'],['Ataques',sample.attacks,'Codificados'],['Colocación → ataque',`${sample.linked}/${sample.sets}`,'Vinculadas / registradas']].map(([label,value,detail])=>`<div class="vc1780-kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></div>`).join('');
   panel.querySelectorAll('[data-vc1780-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc1780Tab===state.tab)));
   panel.querySelector('[data-vc1780-body]').innerHTML=(sample.rallies>0&&sample.rallies<8?'<div class="vc1780-notice" style="margin-bottom:11px">Muestra reducida: menos de 8 rallies cerrados con los filtros actuales. Evita interpretar estas diferencias como tendencias.</div>':'')+viewHtml(state.tab,result);
  }
  function close(){state.open=false;analysis()?.removeAttribute('data-vc1780-view');const p=$('vc1780-cross-panel');if(p)p.hidden=true;const b=$('vc1780-nav');if(b)b.setAttribute('aria-current','false');}
  function open(){
   if(!$('vc1780-cross-panel'))attachPanel();
   if(!$('vc1780-cross-panel'))return false;
   state.open=true;analysis()?.setAttribute('data-vc1780-view','cross');$('vc1780-cross-panel').hidden=false;
   $('vc1780-nav')?.setAttribute('aria-current','page');paint();return true;
  }
  function csvExport(){
   if(!state.data)return;
   const lines=sheetRows(state.tab,state.data),blob=new root.Blob([csvCells(lines)],{type:'text/csv;charset=utf-8'}),url=root.URL.createObjectURL(blob),a=doc.createElement('a');
   a.href=url;a.download=`Volley_Coach_V17.8_${state.tab}.csv`;doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),2000);
  }
  function attachPanel(){
   const studio=$('vc157-studio'),toolbar=studio?.querySelector('.vc157-toolbar');if(!studio||!toolbar)return false;
   if($('vc1780-cross-panel'))return true;
   const style=doc.createElement('style');style.id='vc1780-style';style.textContent=CSS;doc.head.appendChild(style);
   const section=doc.createElement('section');section.id='vc1780-cross-panel';section.hidden=true;section.setAttribute('aria-label','Cruces avanzados del scouting');
   section.innerHTML=`<div class="vc1780-title"><div><span class="vc1780-kicker">ANÁLISIS PRO · V${VERSION} · SOLO LECTURA</span><h2>Cruces avanzados</h2><p>Relaciones entre acciones codificadas, fases del rally y rendimiento.</p></div><div class="vc1780-actions"><button type="button" data-vc1780-refresh>↻ Actualizar</button><button type="button" data-vc1780-export>Exportar CSV</button><button type="button" data-vc1780-close>Cerrar cruces</button></div></div><div class="vc1780-context" data-vc1780-info>Utiliza los filtros compartidos de arriba.</div><div class="vc1780-kpis" data-vc1780-kpis></div><nav class="vc1780-tabs" aria-label="Vistas de cruces avanzados">${TYPES.map(([id,label])=>`<button type="button" data-vc1780-tab="${id}" aria-pressed="false">${esc(label)}</button>`).join('')}</nav><div class="vc1780-card" data-vc1780-body></div><p class="vc1780-notice">Muestra y trazabilidad: únicamente rallies cerrados y acciones registradas. EFF de ataque = (# − = − /) / ataques. Los datos sin codificar se señalan; nunca se infieren automáticamente. Estas tablas son auxiliares y no modifican el PDF oficial.</p>`;
   toolbar.insertAdjacentElement('afterend',section);
   section.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-vc1780-close'))close();else if(b.hasAttribute('data-vc1780-refresh'))paint();else if(b.hasAttribute('data-vc1780-export'))csvExport();else if(b.dataset.vc1780Tab){state.tab=b.dataset.vc1780Tab;paint();}});
   return true;
  }
  function addLink(){
   const nav=$('vc1730-workspace')?.querySelector('[data-vc1730-links]');if(!nav||nav.dataset.mode!=='tactics')return;
   if(nav.querySelector('[data-vc1780-open]'))return;
   const b=doc.createElement('button');b.id='vc1780-nav';b.type='button';b.dataset.vc1780Open='';b.setAttribute('aria-current',state.open?'page':'false');b.textContent='Cruces Pro';nav.appendChild(b);
  }
  function init(){
   const view=analysis();if(!view)return;
   attachPanel();addLink();
   const nav=$('vc1730-workspace')?.querySelector('[data-vc1730-links]');
   if(nav){const observer=new root.MutationObserver(()=>addLink());observer.observe(nav,{childList:true});}
   // Dynamic Analista Studio: only wait for initial mount, not for live DOM churn.
   if(!$('vc1780-cross-panel')){
    const watcher=new root.MutationObserver(()=>{if(attachPanel())watcher.disconnect();});watcher.observe(view,{childList:true,subtree:true});
   }
   doc.addEventListener('click',e=>{
    const b=e.target.closest?.('button');if(!b)return;
    if(b.hasAttribute('data-vc1780-open')){open();return;}
    if(state.open&&b.closest('#vc1730-workspace')&&
      (b.hasAttribute('data-vc1730-mode')||b.hasAttribute('data-vc1730-page')||b.hasAttribute('data-vc1730-view')))close();
   },true);
   doc.addEventListener('change',e=>{if(state.open&&['vc157-match','vc157-team','vc157-set','vc157-rotation','vc157-phase'].includes(e.target?.id))root.setTimeout(paint,0)},true);
   view.addEventListener('click',e=>{if(state.open&&e.target?.id==='vc157-refresh-matches')root.setTimeout(paint,0)},true);
   const activeObserver=new root.MutationObserver(()=>{if(state.open&&!active())close();});activeObserver.observe(view,{attributes:true,attributeFilter:['class']});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const api={version:VERSION,open,close,refresh:paint,diagnostics:()=>({open:state.open,tab:state.tab,renders:state.renders,sample:state.data?.sample||null,readOnly:true})};
  root.VC178_CROSS_ANALYSIS=api;
 }
 return {VERSION,TYPES,compute,dataForMatch,viewHtml,sheetRows,csvCells,mount};
});
