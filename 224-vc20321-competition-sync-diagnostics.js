/* Volley Coach V20.3.2.1 · Diagnóstico de partidos y resultados.
 * Compara en modo lectura el estado del dispositivo con la nube CAS.
 * No modifica marcadores, equipos, IndexedDB ni Supabase.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api.pure;
 if(root&&root.document){root.VC20321_COMPETITION_SYNC=api;api.install(root)}
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION='20.3.2.1',TYPES=['VC2031_ENTITY_COMMANDS','VC2031_PILOT','VC2032_MIGRATION_PLANNER','VC2032_CONTROLLED_MIGRATION'];
 const list=value=>Array.isArray(value)?value:[];
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const key=rec=>rec?.id===null||rec?.id===undefined||String(rec.id)===''?null:String(rec.id);
 function stable(value){
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 function score(record){return stable([record.status??'',record.setsFor??'',record.setsAgainst??'',record.setDetail??''])}
 function compare(localState,remoteState){
  const lhs=object(localState?.equiposData),rhs=object(remoteState?.equiposData),teams=[];
  const totals={local:0,cloud:0,identical:0,localOnly:0,cloudOnly:0,resultsDifferent:0,detailsDifferent:0,invalidIds:0};
  for(const team of [...new Set([...Object.keys(lhs),...Object.keys(rhs)])].sort()){
   const local=list(lhs[team]?.partidos),cloud=list(rhs[team]?.partidos),lm=new Map(),rm=new Map(),issues=[];
   for(const [side,records,map] of [['dispositivo',local,lm],['nube',cloud,rm]]){
    records.forEach((record,i)=>{
     const id=key(record);
     if(id===null||map.has(id)){totals.invalidIds++;issues.push({id:id??`posición ${i+1}`,kind:'ID vacío o duplicado',side});return}
     map.set(id,record);
    });
   }
   const count={team,local:local.length,cloud:cloud.length,localOnly:0,cloudOnly:0,resultsDifferent:0,detailsDifferent:0,identical:0,issues};
   totals.local+=local.length;totals.cloud+=cloud.length;
   for(const id of new Set([...lm.keys(),...rm.keys()])){
    const a=lm.get(id),b=rm.get(id),label=String(a?.opponent||b?.opponent||id).slice(0,80);
    if(!b){count.localOnly++;totals.localOnly++;issues.push({id,label,kind:'Solo en este dispositivo'});continue}
    if(!a){count.cloudOnly++;totals.cloudOnly++;issues.push({id,label,kind:'Solo en la nube'});continue}
    if(score(a)!==score(b)){
     count.resultsDifferent++;totals.resultsDifferent++;
     issues.push({id,label,kind:'Resultado o estado distinto',local:`${a.status||'—'} ${a.setsFor??'—'}–${a.setsAgainst??'—'}`,cloud:`${b.status||'—'} ${b.setsFor??'—'}–${b.setsAgainst??'—'}`});
    }else if(stable(a)!==stable(b)){
     count.detailsDifferent++;totals.detailsDifferent++;issues.push({id,label,kind:'Otros campos distintos'});
    }else{count.identical++;totals.identical++}
   }
   teams.push(count);
  }
  return {totals,teams,consistent:totals.invalidIds===0&&totals.localOnly===0&&totals.cloudOnly===0&&totals.resultsDifferent===0&&totals.detailsDifferent===0};
 }
 const pure={VERSION,compare,score,stable};
 function install(win){
  const doc=win.document,$=id=>doc.getElementById(id);
  let busy=false,last=null;
  function current(){
   try{
    const data=typeof equiposData==='object'?equiposData:{};
    const active=typeof equipoActivo==='string'?equipoActivo:'';
    if(active&&Array.isArray(partidosEquipo))return {equiposData:{...data,[active]:{...data[active],partidos:partidosEquipo}}};
    return {equiposData:data};
   }catch(_){return null}
  }
  function missingModules(){return TYPES.filter(name=>!win[name])}
  function setText(id,value){const el=$(id);if(el)el.textContent=value}
  function showInstallStatus(){
   const missing=missingModules(),el=$('vc20321-modules');if(!el)return;
   const message=missing.length?
    'AVISO: Migración controlada no disponible. Comprueba que están publicados los archivos 220, 221, 222 y 223 junto con este index.html. Módulos pendientes: '+missing.join(', '):
    'Migración controlada V20.3.2 instalada. Aparece en este mismo panel, debajo del piloto V20.3.1; solo prepara entrenamientos, no altera partidos.';
   if(el.textContent!==message)el.textContent=message;
   const kind=missing.length?'warning':'ok';if(el.dataset.kind!==kind)el.dataset.kind=kind;
  }
  function render(result){
   const box=$('vc20321-result');if(!box)return;
   if(!result){box.textContent='Pulsa «Comparar partidos y resultados» para hacer una lectura autenticada. No se escribirán datos.';return}
   box.replaceChildren();
   const t=result.totals,header=doc.createElement('p');
   header.textContent=`Dispositivo: ${t.local} partidos · Nube: ${t.cloud} · Coinciden: ${t.identical} · Solo local: ${t.localOnly} · Solo nube: ${t.cloudOnly} · Resultados diferentes: ${t.resultsDifferent} · Otros campos: ${t.detailsDifferent}`;
   header.style.fontWeight='700';box.append(header);
   if(t.invalidIds){const warning=doc.createElement('p');warning.textContent=`Atención: ${t.invalidIds} IDs de partido vacíos o duplicados. No uses una sustitución masiva.`;box.append(warning)}
   const msg=doc.createElement('p');msg.textContent=result.consistent?'Las dos copias coinciden en esta comparación. Para confirmar la propagación, comprueba también desde el otro dispositivo.':'Hay diferencias reales entre las dos copias. Mantén ambas, revisa los conflictos y evita sobrescribirlas.';
   box.append(msg);
   for(const team of result.teams){
    if(!team.issues.length)continue;
    const details=doc.createElement('details'),title=doc.createElement('summary');
    title.textContent=`${team.team}: ${team.issues.length} diferencias`;details.append(title);
    const ul=doc.createElement('ul');
    for(const issue of team.issues.slice(0,40)){
     const li=doc.createElement('li');li.textContent=`${issue.label||issue.id} · ${issue.kind}${issue.local?` · Local: ${issue.local} · Nube: ${issue.cloud}`:''}`;ul.append(li);
    }
    if(team.issues.length>40){const li=doc.createElement('li');li.textContent=`Y ${team.issues.length-40} diferencias adicionales`;ul.append(li)}
    details.append(ul);box.append(details);
   }
  }
  async function verify(){
   if(busy)return null;
   const cloud=win.VC_V962_CLOUD_EFFICIENT,diag=cloud?.diagnostics?.()||{},account=cloud?.getAccountId?.();
   if(!diag.connected||!account||typeof cloud?.readOnlyRemoteSnapshot!=='function')throw Error('Inicia sesión en la nube con esta misma cuenta en ambos dispositivos.');
   if(diag.dirty||diag.syncing||diag.blockedReason||diag.pendingAccountMismatch||diag.lastSyncError){
    throw Error('Hay cambios sin confirmar o un conflicto activo. Antes de comparar, revisa el estado de sincronización; no se sobrescribirán partidos.');
   }
   const first=current();if(!first)throw Error('No se puede leer la competición local.');
   busy=true;const button=$('vc20321-verify');if(button)button.disabled=true;
   try{
    const remote=await cloud.readOnlyRemoteSnapshot(),after=cloud.diagnostics?.()||{};
    if(!remote?.state?.equiposData)throw Error('La nube no devolvió datos válidos.');
    if(cloud.getAccountId?.()!==account||after.dirty||after.syncing||after.blockedReason||after.pendingAccountMismatch||after.lastSyncError){
     throw Error('El estado de sincronización cambió durante la lectura. Repite la comprobación.');
    }
    const second=current();if(stable(first)!==stable(second))throw Error('Los partidos locales cambiaron durante la lectura. Repite la comparación.');
    last={readAt:new Date().toISOString(),...compare(second,remote.state)};
    render(last);setText('vc20321-message','Lectura finalizada: ninguna copia ha sido modificada.');return last;
   }finally{busy=false;if(button)button.disabled=false}
  }
  function ensure(){
   const base=$('vc16040-sync-modal')?.querySelector('.vc16040-card');if(!base)return false;
   if($('vc20321-panel')){showInstallStatus();return true}
   const section=doc.createElement('section');section.id='vc20321-panel';section.innerHTML=`
    <strong>V20.3.2.1 · Partido y resultados: diagnóstico de sincronización</strong>
    <p>Compara cada partido y su marcador contra la nube. Solo lectura; nunca reemplaza versiones.</p>
    <div id="vc20321-modules" role="status"></div>
    <button id="vc20321-verify" type="button">Comparar partidos y resultados</button>
    <p id="vc20321-message" role="status"></p><div id="vc20321-result"></div>`;
   const style=doc.createElement('style');style.id='vc20321-style';style.textContent=`
    #vc20321-panel{background:#eef8ff;border:1px solid #96bfda;color:#163d57;border-radius:12px;padding:15px;margin:12px 0;font:12px/1.5 system-ui,sans-serif}
    #vc20321-panel strong{font-size:15px}#vc20321-panel p{margin:9px 0;font-size:12px}#vc20321-panel button{border:1px solid #84aecb;background:#fff;color:#175777;padding:10px 12px;border-radius:8px}
    #vc20321-panel button:disabled{opacity:.55}#vc20321-modules{padding:8px;background:#f1fff6;border-radius:8px;margin:9px 0}
    #vc20321-modules[data-kind=warning]{background:#fff1e6;color:#84401e;font-weight:700}#vc20321-result{overflow-wrap:anywhere}
    #vc20321-result summary{cursor:pointer;font-weight:700}#vc20321-result details{padding:7px 0;border-top:1px solid #cce0ef}
    #vc20321-result ul{max-height:220px;overflow:auto;padding-left:20px}`;
   doc.head.append(style);base.append(section);
   $('vc20321-verify').addEventListener('click',async()=>{
    setText('vc20321-message','Consultando la nube sin modificar datos…');
    try{await verify()}catch(err){setText('vc20321-message',String(err?.message||err))}
   });
   showInstallStatus();render(last);return true;
  }
  function boot(){
   ensure();const observer=new MutationObserver(()=>{if(!$('vc20321-panel'))ensure();else showInstallStatus()});
   observer.observe(doc.body,{childList:true,subtree:true});
   win.addEventListener('vc200:sync-state',showInstallStatus);
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  return {version:VERSION,compare,verify,diagnostics:()=>({version:VERSION,readAt:last?.readAt||null,consistent:last?.consistent??null,missingModules:missingModules()})};
 }
 return {pure,install};
});
