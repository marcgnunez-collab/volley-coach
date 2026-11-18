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
