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
