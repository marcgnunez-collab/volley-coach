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
