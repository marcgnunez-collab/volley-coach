/* Volley Coach V20.2.2 · Match Intelligence Pro: strictly read-only projections. */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){if(root.VC_MATCH_INTELLIGENCE_2022)return;root.VC_MATCH_INTELLIGENCE_2022=api;
 if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});else api.boot();}
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';const VERSION='20.2.2',doc=()=>root?.document,byId=id=>doc()?.getElementById(id),list=x=>Array.isArray(x)?x:[];
 let timer=null,mounted=false,last='',selected='all';
 const validRotation=x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=6;
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function match(){try{return root?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
 function project(m,rotationFilter='all'){
  const sets=list(m?.sets),all=[];let missing=0;
  for(const s of sets)for(const [i,r] of list(s?.rallies).entries()){
   if(!r)continue;
   const rot=validRotation(r.rotationNo??r.rotation)?Number(r.rotationNo??r.rotation):null;
   if(rotationFilter!=='all'&&rot!==Number(rotationFilter))continue;
   const actions=list(r.actions);let setter=null,attacks=0,graded=0,positive=0;
   for(const a of actions){
    const skill=String(a?.skill||'').toUpperCase();const code=String(a?.code||'').toUpperCase();
    const explicit=skill==='E'||(!skill&&/^\d{1,3}E[#+!\-/=]?/.test(code));
    if(explicit){const number=a?.number??a?.playerNumber??(/^\d{1,3}/.exec(code)?.[0]);if(number!=null&&/^\d{1,3}$/.test(String(number)))setter=String(number);}
    if(skill==='A'||(!skill&&/^\d{1,3}A[#+!\-/=]?/.test(code))){attacks++;
     const ev=String(a?.evaluation??a?.eval??a?.rating??(/^\d{1,3}A([#+!\-/=])/.exec(code)?.[1])??'');
     if(['#','+','!','-','/','='].includes(ev)){graded++;if(ev==='#')positive++;}
    }
   }
   if(rot===null)missing++;
   all.push({set:s?.number??'—',index:i+1,rotation:rot,setter,attacks,graded,positive,actions:actions.length,winner:r.winner||null});
  }
  const rotations=Array.from({length:6},(_,i)=>{const rs=all.filter(x=>x.rotation===i+1);return {rotation:i+1,rallies:rs.length,attacks:rs.reduce((n,x)=>n+x.attacks,0),graded:rs.reduce((n,x)=>n+x.graded,0),kills:rs.reduce((n,x)=>n+x.positive,0)};});
  const setters={};for(const r of all)if(r.setter)setters[r.setter]=(setters[r.setter]||0)+1;
  return {rallies:all.length,missing,rotations,setters,latest:all.slice(-5).reverse(),knownAttackGrades:rotations.reduce((n,x)=>n+x.graded,0)};
 }
 function template(){return `<section id="vc2022-intelligence" class="vc2022-intelligence" aria-label="Inteligencia táctica del partido"><header><div><small>V20.2.2 · SOLO LECTURA</small><strong>Match Intelligence</strong><span>Rotaciones, colocadores y contactos verificados</span></div><label>Rotación <select id="vc2022-rotation"><option value="all">Todas</option>${Array.from({length:6},(_,i)=>`<option value="${i+1}">P${i+1}</option>`).join('')}</select></label></header><div id="vc2022-content" aria-live="polite">Selecciona un partido para consultar sus datos.</div><footer>Los datos no registrados aparecen como desconocidos. No se deducen colocadores, zonas ni tanteos.</footer></section>`}
 function render(){if(!mounted||!byId('scout-match-mode')?.classList.contains('active'))return false;
  const data=project(match(),selected),sig=JSON.stringify(data);if(sig===last)return true;last=sig;
  const el=byId('vc2022-content');if(!el)return false;
  if(!match()){el.textContent='No hay partido activo.';return true;}
  const setters=Object.entries(data.setters).sort((a,b)=>b[1]-a[1]);
  el.innerHTML=`<div class="vc2022-kpis"><div><small>Rallies analizados</small><strong>${data.rallies}</strong></div><div><small>Rotación sin registrar</small><strong>${data.missing}</strong></div><div><small>Ataques valorados</small><strong>${data.knownAttackGrades}</strong></div></div><div class="vc2022-columns"><div><h4>Distribución por rotación</h4><div class="vc2022-tablewrap"><table><thead><tr><th>Rot.</th><th>Rallies</th><th>Ataques</th><th>Kill / valorados</th></tr></thead><tbody>${data.rotations.map(x=>`<tr><th>P${x.rotation}</th><td>${x.rallies}</td><td>${x.attacks}</td><td>${x.graded?`${x.kills}/${x.graded}`:'—'}</td></tr>`).join('')}</tbody></table></div></div><div><h4>Colocadores explícitos</h4>${setters.length?`<div class="vc2022-setters">${setters.map(([n,count])=>`<div><strong>#${safe(n)}</strong><span>${count} rallies con colocación identificada</span></div>`).join('')}</div>`:'<p>Sin colocadores identificables en los contactos.</p>'}<h4>Últimos rallies</h4><div class="vc2022-recent">${data.latest.map(x=>`<div><strong>S${safe(x.set)} · #${x.index}</strong><span>${x.rotation?'P'+x.rotation:'Rot. —'} · ${x.actions} contactos · ${x.winner==='ours'?'Punto propio':x.winner==='opponent'?'Punto rival':'Resultado —'}</span></div>`).join('')||'<p>Sin rallies registrados.</p>'}</div><button type="button" id="vc2022-open-review">Abrir revisión original</button></div></div>`;
  byId('vc2022-open-review')?.addEventListener('click',()=>root?.VC_MATCH_WORKSPACE_2020?.navigate?.('revisar'));
  return true;
 }
 function boot(){const parent=byId('vc2020-matchbar');if(!parent)return false;
  if(!byId('vc2022-intelligence')){parent.insertAdjacentHTML('afterend',template());byId('vc2022-rotation')?.addEventListener('change',e=>{selected=e.target.value;last='';render()});}
  if(!mounted){mounted=true;if(typeof root?.setInterval==='function')timer=root.setInterval(()=>{if(!doc()?.hidden)render()},2500);}
  render();return true;
 }
 return {VERSION,project,template,boot,render,diagnostics:()=>({mounted,hasTimer:!!timer,selected})};
});
