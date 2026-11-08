/* Volley Coach V16.3.0 · Core Reliability
   Safe baseline: read-only integrity report and on-demand manual backup.
   NEVER writes matches, cloud state, scoring, IndexedDB or localStorage.
   Pure validator also runs in Node without a browser. */
(function(root,factory){
 'use strict';
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 if(root&&root.document){
  if(root.VC_CORE_RELIABILITY_1630)return;
  root.VC_CORE_RELIABILITY_1630=core;
  core.install(root);
 }
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='16.3.0';
 const list=x=>Array.isArray(x)?x:[];
 const numeric=x=>typeof x==='number'&&Number.isFinite(x)&&Number.isInteger(x)&&x>=0;
 const limit=70;
 function auditState(state){
  const issues=[];
  const summary={teams:0,matches:0,sets:0,rallies:0,actions:0,liveActions:0,finished:0,errors:0,warnings:0};
  const add=(level,code,location,detail)=>{
   if(level==='error')summary.errors++;else summary.warnings++;
   if(issues.length<limit)issues.push({level,code,location,detail});
  };
  if(!state||typeof state!=='object'||Array.isArray(state)){
   add('error','STATE_INVALID','Aplicación','El estado de la aplicación no es un objeto.');
   return {version:VERSION,summary,issues,truncated:false};
  }
  const teams=state.equiposData;
  if(!teams||typeof teams!=='object'||Array.isArray(teams)){
   add('error','TEAMS_MISSING','Aplicación','Falta el contenedor equiposData.');
   return {version:VERSION,summary,issues,truncated:false};
  }
  for(const [teamId,team] of Object.entries(teams)){
   if(!team||typeof team!=='object'||Array.isArray(team))continue;
   summary.teams++;
   const seenMatches=new Set();
   if(team.scoutingMatches!=null&&!Array.isArray(team.scoutingMatches)){
    add('error','MATCH_LIST_INVALID',String(teamId),'El listado de scoutings no es un array.');continue;
   }
   for(const match of list(team.scoutingMatches)){
    if(!match||typeof match!=='object'){
     add('error','MATCH_INVALID',String(teamId),'Un elemento del listado de scoutings no es válido.');continue;
    }
    summary.matches++;
    const mId=String(match.id??'');
    const where='Equipo '+teamId+' · Scouting '+(mId||'sin ID');
    if(!mId){add('error','MATCH_ID_MISSING',where,'Falta el identificador de scouting.');}
    else if(seenMatches.has(mId))add('error','DUPLICATE_MATCH_ID',where,'Hay dos scoutings con el mismo ID dentro del equipo.');
    seenMatches.add(mId);
    if(match.status==='finished')summary.finished++;
    if(!Array.isArray(match.sets)){
     add('error','SETS_MISSING',where,'Falta la lista de sets.');continue;
    }
    if(!match.sets.length)add('warning','EMPTY_MATCH',where,'Este scouting no tiene sets.');
    const seenSets=new Set();
    for(const [setIndex,set] of match.sets.entries()){
     if(!set||typeof set!=='object'){
      add('error','SET_INVALID',where,'Se ha encontrado un set no válido.');continue;
     }
     summary.sets++;
     const setNo=String(set.number??setIndex+1),setWhere=where+' · Set '+setNo;
     if(seenSets.has(setNo))add('error','DUPLICATE_SET',setWhere,'Se repite el número de set.');
     seenSets.add(setNo);
     if(!numeric(set.scoreUs)||!numeric(set.scoreOpponent))add('error','INVALID_SET_SCORE',setWhere,'El marcador del set no contiene dos enteros no negativos.');
     if(!Array.isArray(set.rallies)){
      add('error','RALLIES_MISSING',setWhere,'El listado de rallies no es válido.');continue;
     }
     const seenRallies=new Set();
     for(const [rIndex,rally] of set.rallies.entries()){
      if(!rally||typeof rally!=='object'){
       add('error','RALLY_INVALID',setWhere,'Hay un rally no válido.');continue;
      }
      summary.rallies++;
      const rId=String(rally.id??'');
      const rWhere=setWhere+' · Rally '+(rIndex+1);
      if(rId){if(seenRallies.has(rId))add('error','DUPLICATE_RALLY_ID',rWhere,'Se repite el identificador del rally.');seenRallies.add(rId);}
      if(!Array.isArray(rally.actions))add('warning','ACTIONS_MISSING',rWhere,'El rally no incluye una lista de acciones válida.');
      else summary.actions+=rally.actions.length;
      const before=rally.scoreBefore,after=rally.scoreAfter;
      if(before&&after&&['us','opponent'].every(k=>numeric(before[k])&&numeric(after[k]))){
       const du=after.us-before.us,dv=after.opponent-before.opponent;
       if(!((du===1&&dv===0)||(du===0&&dv===1)))add('warning','RALLY_SCORE_JUMP',rWhere,'El resultado registrado no suma exactamente un punto. Puede deberse a una corrección manual.');
       else if((du===1&&rally.winner==='opponent')||(dv===1&&rally.winner==='ours'))add('warning','RALLY_WINNER_MISMATCH',rWhere,'El ganador del rally no coincide con el cambio de marcador.');
      }else add('warning','RALLY_SCORE_MISSING',rWhere,'No hay un marcador antes/después válido para verificar el rally.');
     }
     if(set.finished&&set.winner&&numeric(set.scoreUs)&&numeric(set.scoreOpponent)){
      if(set.scoreUs===set.scoreOpponent)add('warning','SET_FINISHED_TIED',setWhere,'Set cerrado con empate. Puede existir una corrección manual pendiente.');
      else if((set.scoreUs>set.scoreOpponent&&set.winner==='opponent')||(set.scoreOpponent>set.scoreUs&&set.winner==='ours'))add('warning','SET_WINNER_MISMATCH',setWhere,'El ganador del set no coincide con el marcador.');
     }
    }
    if(Array.isArray(match.liveRally?.actions))summary.liveActions+=match.liveRally.actions.length;
   }
  }
  return {version:VERSION,summary,issues,truncated:(summary.errors+summary.warnings)>issues.length};
 }
 function safeDiagnostics(win){
  const tryGet=fn=>{try{return fn()}catch(_){return null}};
  const journal=tryGet(()=>win.scoutV902PerformanceDiagnostics?.());
  const cloud=tryGet(()=>win.VC_V962_CLOUD_EFFICIENT?.diagnostics?.());
  const devices=tryGet(()=>win.VC_SYNC_PRO?.diagnostics?.());
  return {
   at:new Date().toISOString(),online:win.navigator?.onLine??null,
   journal:{available:!!journal,pending:!!journal?.commitPending,busy:!!journal?.commitBusy,failures:journal?.journalFailures??null,hasError:!!journal?.lastJournalError},
   cloud:{connected:!!cloud?.connected,dirty:!!cloud?.dirty,syncing:!!cloud?.syncing,hasError:!!cloud?.lastSyncError},
   presence:{connected:!!devices?.realtime,confirmedDevices:devices?.devicesConfirmed??null},
   modules:{scouting:!!win.VC_SCOUT_VIDEO_BRIDGE,analysis:!!win.VC_ANALYSIS_INTELLIGENCE_1614,video:!!win.VC_VIDEO_ANALYTICS_1612,sync:!!win.VC_SYNC_PRO}
  };
 }
 function install(win){
  const doc=win.document;
  if(!doc)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let last=null;
  const createButton=()=>{
   const bar=doc.querySelector('#vc16040-sync-modal .vc16040-foot');
   if(!bar||doc.getElementById('vc1630-integrity-launcher'))return !!bar;
   const b=doc.createElement('button');b.id='vc1630-integrity-launcher';b.type='button';b.textContent='Verificar integridad';
   b.title='Diagnóstico de solo lectura: no modifica partidos ni sincronización';
   bar.append(b);b.addEventListener('click',()=>open());return true;
  };
  const modal=doc.createElement('div');modal.id='vc1630-modal';modal.hidden=true;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Integridad y copias · Core Reliability');
  modal.innerHTML=`<section class="vc1630-card"><header><div><small>VOLLEY COACH · CORE RELIABILITY 16.3.0</small><h2>Integridad y copias de seguridad</h2><p>Diagnóstico local de solo lectura. No altera el marcador, los scoutings, el PDF ni la nube.</p></div><button type="button" id="vc1630-close">Cerrar</button></header><div id="vc1630-summary" aria-live="polite">Pulsa «Comprobar datos» para analizar el estado actual.</div><div id="vc1630-issues"></div><div class="vc1630-actions"><button id="vc1630-run">Comprobar datos</button><button id="vc1630-backup">Descargar copia completa JSON</button><button id="vc1630-report">Descargar diagnóstico</button><button id="vc1630-existing">Auditoría avanzada</button></div><p class="vc1630-warning">La copia contiene información de tus equipos y jugadores. Guárdala en privado. No sustituye las pruebas de sincronización entre dispositivos ni confirma una copia en la nube.</p><p id="vc1630-status" role="status"></p></section>`;
  const css=doc.createElement('style');css.id='vc1630-style';css.textContent=`
#vc1630-modal[hidden]{display:none!important}#vc1630-modal{position:fixed;inset:0;z-index:55000;background:rgba(7,25,41,.73);display:grid;place-items:center;padding:16px;font:13px/1.5 system-ui,sans-serif;color:#183b55}
#vc1630-modal *{box-sizing:border-box}#vc1630-modal .vc1630-card{width:min(800px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #cbddea;border-radius:16px;padding:22px;box-shadow:0 22px 80px #0005}
#vc1630-modal header{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #e2edf4;padding-bottom:14px}#vc1630-modal h2{font-size:22px!important;color:#113e5d!important;margin:4px 0!important}#vc1630-modal header small{font-size:10px;letter-spacing:.08em;font-weight:800;color:#296f9b}#vc1630-modal header p{color:#607a8c;font-size:12px;margin:5px 0}#vc1630-modal button{cursor:pointer!important;min-height:36px!important;font:700 12px system-ui!important;background:#f5f9fc!important;color:#165880!important;border:1px solid #c9deea!important;border-radius:9px!important;padding:9px 12px!important}
#vc1630-modal .vc1630-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#vc1630-modal #vc1630-backup{background:#19618f!important;color:#fff!important;border-color:#19618f!important}
#vc1630-modal #vc1630-summary{background:#edf5fa;border:1px solid #d8e7f1;border-radius:11px;padding:15px;margin:14px 0;font-size:12px}#vc1630-modal .vc1630-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}#vc1630-modal .vc1630-results>span{background:#fff;border-radius:8px;padding:9px;display:grid;gap:3px;font-size:11px;color:#53718a}#vc1630-modal .vc1630-results b{font-size:20px;color:#153d59}#vc1630-modal .vc1630-issue{padding:9px 11px;border-bottom:1px solid #e7eff4;font-size:12px}#vc1630-modal .vc1630-issue strong{display:block;font-size:11px;color:#255b7d}#vc1630-modal .vc1630-issue.warn{border-left:3px solid #cb983d}#vc1630-modal .vc1630-issue.error{border-left:3px solid #c85d5d}#vc1630-modal .vc1630-warning{border-top:1px solid #e9eff4;margin-top:10px;padding-top:12px;color:#647e91;font-size:11px!important}#vc1630-modal #vc1630-status{font-size:12px;color:#21668e;min-height:17px}
@media(max-width:560px){#vc1630-modal .vc1630-card{padding:14px}#vc1630-modal .vc1630-results{grid-template-columns:repeat(2,minmax(0,1fr))}#vc1630-modal header{flex-direction:column}}`;
  function status(s){const el=doc.getElementById('vc1630-status');if(el)el.textContent=s;}
  function readState(){
   const fn=win.estadoLocal;
   if(typeof fn!=='function')throw new Error('El motor de estado local no está disponible.');
   const state=fn();
   if(!state||!state.equiposData)throw new Error('No se ha obtenido un estado de equipos válido.');
   return state;
  }
  function check(){
   try{
    last={audit:auditState(readState()),runtime:safeDiagnostics(win)};
    const s=last.audit.summary;
    const verdict=s.errors?'Posibles problemas de integridad':s.warnings?'Revisión recomendada':'Sin incidencias estructurales detectadas';
    const summary=doc.getElementById('vc1630-summary');
    summary.innerHTML=`<strong>${esc(verdict)}</strong><div class="vc1630-results">${[['Equipos',s.teams],['Scoutings',s.matches],['Sets',s.sets],['Rallies',s.rallies],['Acciones',s.actions],['Avisos y errores',s.errors+s.warnings]].map(([k,v])=>`<span>${esc(k)}<b>${v}</b></span>`).join('')}</div>`;
    const issues=doc.getElementById('vc1630-issues');
    issues.replaceChildren();
    if(!last.audit.issues.length)issues.textContent='No se han detectado inconsistencias en la estructura revisada. Esto no verifica los cálculos, la nube o la reproducción de vídeo.';
    else for(const issue of last.audit.issues){const row=doc.createElement('div');row.className='vc1630-issue '+(issue.level==='error'?'error':'warn');const title=doc.createElement('strong');title.textContent=issue.code+' · '+issue.location;const description=doc.createElement('span');description.textContent=issue.detail;row.append(title,description);issues.append(row)}
    status('Revisión local completada. El resultado no modifica los datos.');
    return last;
   }catch(error){status('No se ha podido analizar el estado: '+String(error?.message||error));return null}
  }
  function download(name,value){
   const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'});
   const u=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=u;a.download=name;doc.body.append(a);a.click();a.remove();
   win.setTimeout(()=>win.URL.revokeObjectURL(u),20000);
  }
  function backup(){
   try{
    const state=readState();
    // Raw estadoLocal format remains compatible with the existing Sync Pro JSON backup.
    download('volley-coach-copia-local-'+new Date().toISOString().slice(0,10)+'.json',state);
    status('Descarga iniciada. Conserva esta copia fuera del dispositivo y comprueba que el archivo existe.');
   }catch(error){status('No se ha podido descargar la copia: '+String(error?.message||error))}
  }
  function report(){
   if(!last)check();if(!last)return;
   download('volley-coach-diagnostico-16.3.0.json',last);
   status('Descarga del diagnóstico iniciada. No incluye nombres de jugadores ni códigos de scouting.');
  }
  function close(){modal.hidden=true;}
  function open(){
   if(!modal.isConnected)doc.body.append(modal);
   modal.hidden=false;check();
  }
  function boot(){
   doc.head.append(css);
   doc.body.append(modal);
   doc.getElementById('vc1630-close').addEventListener('click',close);
   doc.getElementById('vc1630-run').addEventListener('click',check);
   doc.getElementById('vc1630-backup').addEventListener('click',backup);
   doc.getElementById('vc1630-report').addEventListener('click',report);
   doc.getElementById('vc1630-existing').addEventListener('click',()=>{close();win.vc16158OpenAudit?.()});
   modal.addEventListener('click',e=>{if(e.target===modal)close()});
   doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
   if(!createButton()){
    const observer=new MutationObserver(()=>{if(createButton())observer.disconnect()});
    observer.observe(doc.body,{childList:true,subtree:true});
   }
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  coreExtra.open=open;coreExtra.check=check;coreExtra.downloadBackup=backup;
 }
 const coreExtra={version:VERSION,auditState,safeDiagnostics,install};
 return coreExtra;
});
