/* Volley Coach V16.1.5.8 · Auditoría local de scoutings.
   Loaded only from Gestión. Read-only unless the user explicitly requests
   the existing save/backup actions. No cloud writes or match normalization. */
(()=>{
 'use strict';
 if(window.VC_DATA_RELIABILITY_16158)return;
 const VERSION='16.1.5.8';
 const $=id=>document.getElementById(id);
 const arr=x=>Array.isArray(x)?x:[];
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE;
 const now=()=>new Date().toISOString();
 function auditMatch(m){
   const issues=[];let rallies=0,actions=0,video=0;
   const problem=(severity,code,detail)=>issues.push({severity,code,detail});
   if(!m||m.id==null)return {id:null,opponent:'',rallies:0,actions:0,video:0,issues:[{severity:'error',code:'MISSING_MATCH',detail:'Scouting no disponible'}]};
   const sets=arr(m.sets),seenSets=new Set(),actionIds=new Set();
   if(!sets.length)problem('error','NO_SETS','No hay sets registrados');
   if(!['live','finished'].includes(m.status))problem('warning','STATUS','Estado del scouting no reconocido');
   for(const [si,s] of sets.entries()){
     const no=Number(s.number)||si+1;
     if(seenSets.has(no))problem('error','DUP_SET',`Set ${no} aparece dos veces`);
     seenSets.add(no);
     let us=0,op=0;
     for(const [ri,r] of arr(s.rallies).entries()){
       rallies++;
       const before=r?.scoreBefore||{},after=r?.scoreAfter||{};
       if(Number(before.us)!==us||Number(before.opponent)!==op)
         problem('error','CHAIN',`Set ${no}, rally ${ri+1}: marcador inicial no encadenado (${before.us}–${before.opponent}; se esperaba ${us}–${op})`);
       const du=Number(after.us)-Number(before.us),dv=Number(after.opponent)-Number(before.opponent);
       if(!((du===1&&dv===0)||(du===0&&dv===1)))
         problem('error','POINT_DELTA',`Set ${no}, rally ${ri+1}: no se registra exactamente un punto`);
       if((r.winner==='ours'&&du!==1)||(r.winner==='opponent'&&dv!==1))
         problem('error','WINNER',`Set ${no}, rally ${ri+1}: ganador y marcador no coinciden`);
       for(const [ai,a] of arr(r.actions).entries()){
         actions++;
         if(a?.videoTime!=null&&Number.isFinite(Number(a.videoTime)))video++;
         if(a?.id!=null){const k=String(a.id);if(actionIds.has(k))problem('warning','DUP_ACTION_ID',`Set ${no}, rally ${ri+1}: ID de acción repetido`);actionIds.add(k)}
         if(!['S','R','E','A','B','D','F','C'].includes(a?.skill))problem('error','SKILL',`Set ${no}, rally ${ri+1}, acción ${ai+1}: fundamento inválido`);
         if(!['#','+','!','-','/','='].includes(a?.evaluation))problem('error','EVALUATION',`Set ${no}, rally ${ri+1}, acción ${ai+1}: valoración inválida`);
         if(a?.videoTime!=null&&!Number.isFinite(Number(a.videoTime)))problem('warning','VIDEO_TIME',`Set ${no}, rally ${ri+1}: marca de vídeo no numérica`);
       }
       us=Number(after.us)||0;op=Number(after.opponent)||0;
     }
     if((Number(s.scoreUs)||0)!==us||(Number(s.scoreOpponent)||0)!==op)
       problem('error','SET_SCORE',`Set ${no}: marcador ${s.scoreUs}–${s.scoreOpponent} distinto de los rallies ${us}–${op}`);
   }
   const liveActions=arr(m.liveRally?.actions);
   for(const a of liveActions){actions++;if(a?.videoTime!=null&&Number.isFinite(Number(a.videoTime)))video++}
   if(m.status==='finished'&&liveActions.length)problem('warning','OPEN_RALLY','El partido finalizado todavía tiene acciones en el rally abierto');
   if(!rallies&&!liveActions.length)problem('info','EMPTY','El scouting todavía no tiene acciones ni rallies');
   try{JSON.stringify(m)}catch(_){problem('error','SERIALIZATION','El scouting no puede exportarse a JSON')}
   return {id:m.id,opponent:String(m.opponent||'Rival'),date:String(m.date||''),status:String(m.status||''),sets:sets.length,rallies,actions,video,issues};
 }
 function auditAll(){
   let matches=[];try{matches=arr(bridge()?.getMatches?.())}catch(_){ }
   const reports=matches.map(auditMatch);
   let cloud={};try{const d=window.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};cloud={connected:!!d.connected,pending:!!d.dirty,syncing:!!d.syncing,error:!!d.lastSyncError,conflicts:Number(d.conflictCount)||0}}catch(_){ }
   const journal=window.scoutV902PerformanceDiagnostics?.()||{};
   return {version:VERSION,checkedAt:now(),teamId:String(bridge()?.getTeamId?.()||'equipo'),count:reports.length,totals:{rallies:reports.reduce((n,x)=>n+x.rallies,0),actions:reports.reduce((n,x)=>n+x.actions,0),errors:reports.reduce((n,x)=>n+x.issues.filter(i=>i.severity==='error').length,0),warnings:reports.reduce((n,x)=>n+x.issues.filter(i=>i.severity==='warning').length,0)},cloud,journal:{failures:Number(journal.journalFailures)||0,lastError:String(journal.lastJournalError||'').slice(0,180),commitPending:!!journal.commitPending},reports};
 }
 const state={last:null,selected:''};
 const css=`#vc158-audit{border:1px solid #d9e5f0;background:#fff;padding:16px;margin-top:14px;border-radius:14px;color:#17364f;font:13px/1.5 system-ui,sans-serif}#vc158-audit[hidden]{display:none!important}#vc158-audit *{box-sizing:border-box}#vc158-audit h3{font-size:19px;color:#173d5f;margin:0 0 4px}#vc158-audit p{margin:5px 0;color:#627b92}#vc158-audit .vc158-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}#vc158-audit button{min-height:36px!important;padding:8px 12px!important;border-radius:9px!important;background:#eaf3fd!important;border:1px solid #bcd5eb!important;color:#1b5083!important;font-size:12px!important;font-weight:750!important}#vc158-audit button.vc158-primary{background:#1a5d9d!important;color:white!important}#vc158-audit button:disabled{opacity:.5}#vc158-audit .vc158-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:12px 0}#vc158-audit .vc158-kpi{background:#f3f8fc;border:1px solid #d9e6f0;border-radius:10px;padding:10px}#vc158-audit .vc158-kpi span{display:block;font-size:11px;color:#657f98}#vc158-audit .vc158-kpi b{font-size:20px;color:#183a5a}#vc158-audit .vc158-table-wrap{overflow-x:auto}#vc158-audit table{width:100%;border-collapse:collapse;min-width:520px}#vc158-audit th,#vc158-audit td{text-align:left;padding:9px 8px;border-bottom:1px solid #e4edf5;font-size:12px}#vc158-audit th{background:#f4f8fc;color:#516b85}#vc158-audit .vc158-alert{padding:8px 10px;margin-top:7px;background:#fff7e8;color:#815e28;border-radius:7px;border:1px solid #efdcb5}#vc158-audit .vc158-error{background:#fff0ee;border-color:#edc5c1;color:#913a34}#vc158-audit .vc158-ok{background:#edf7f0;border-color:#cae8d6;color:#1d6640}#vc158-audit .vc158-help{font-size:11px;color:#627e95}#vc158-audit select{min-height:36px;max-width:100%;padding:6px 8px;border:1px solid #cadceb;border-radius:8px;color:#18466e}#vc158-audit #vc158-message{font-weight:700;color:#235a85}@media(max-width:650px){#vc158-audit .vc158-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
 function template(){return `<div class="vc158-row" style="justify-content:space-between"><div><h3>Data Reliability · Auditoría de scoutings</h3><p>Validación local y no destructiva. No cambia puntos, rallies ni estadísticas.</p></div><button type="button" id="vc158-close">Cerrar</button></div><div class="vc158-grid"><div class="vc158-kpi"><span>Scoutings</span><b id="vc158-count">—</b></div><div class="vc158-kpi"><span>Rallies</span><b id="vc158-rallies">—</b></div><div class="vc158-kpi"><span>Errores</span><b id="vc158-errors">—</b></div><div class="vc158-kpi"><span>Avisos</span><b id="vc158-warnings">—</b></div></div><div class="vc158-row"><button type="button" class="vc158-primary" id="vc158-refresh">Revisar scoutings</button><button type="button" id="vc158-report">Exportar diagnóstico</button><button type="button" id="vc158-backup">Copia JSON de todos los scoutings</button></div><div class="vc158-table-wrap"><table><thead><tr><th>Scouting</th><th>Estado</th><th>Rallies</th><th>Acciones</th><th>Errores / Avisos</th></tr></thead><tbody id="vc158-body"></tbody></table></div><div class="vc158-row"><label for="vc158-select">Examinar partido</label><select id="vc158-select"></select><button type="button" id="vc158-native-export">Exportar scouting (formato existente)</button></div><div id="vc158-detail"></div><p id="vc158-message" role="status"></p><p class="vc158-help">La auditoría comprueba memoria local del equipo activo. No certifica Supabase ni la sincronización con otro dispositivo. Las copias JSON contienen información privada del club; guárdalas en un lugar seguro. No uses los diagnósticos como importación automática.</p>`}
 function setup(){
   const parent=$('v11-management');if(!parent)return false;
   if(!$('vc158-audit')){
     const st=document.createElement('style');st.id='vc158-style';st.textContent=css;document.head.appendChild(st);
     const section=document.createElement('section');section.id='vc158-audit';section.hidden=true;section.innerHTML=template();parent.appendChild(section);
     $('vc158-close').addEventListener('click',()=>{section.hidden=true});
     $('vc158-refresh').addEventListener('click',render);
     $('vc158-report').addEventListener('click',()=>download('volley-coach-auditoria-'+Date.now()+'.json',state.last||auditAll()));
     $('vc158-backup').addEventListener('click',backup);
     $('vc158-select').addEventListener('change',e=>{state.selected=String(e.target.value);detail()});
     $('vc158-native-export').addEventListener('click',()=>{const chosen=state.last?.reports.find(x=>String(x.id)===state.selected);if(chosen)window.scoutExportJSON?.(chosen.id)});
   }
   return true;
 }
 function detail(){
   const box=$('vc158-detail'),rec=state.last?.reports.find(x=>String(x.id)===state.selected);
   if(!box)return;
   box.replaceChildren();if(!rec)return;
   for(const i of rec.issues.slice(0,40)){
     const item=document.createElement('div');item.className='vc158-alert'+(i.severity==='error'?' vc158-error':'');
     item.textContent=`${i.severity==='error'?'Error':i.severity==='warning'?'Aviso':'Información'} · ${i.detail}`;box.appendChild(item);
   }
   if(!rec.issues.length){const p=document.createElement('p');p.className='vc158-alert vc158-ok';p.textContent='No se han detectado incoherencias en este scouting.';box.appendChild(p)}
 }
 function render(){if(!setup())return false;
   state.last=auditAll();const r=state.last;
   [['count',r.count],['rallies',r.totals.rallies],['errors',r.totals.errors],['warnings',r.totals.warnings]].forEach(([id,v])=>{$('vc158-'+id).textContent=String(v)});
   const b=$('vc158-body');b.replaceChildren();
   const s=$('vc158-select');s.replaceChildren();
   for(const m of r.reports){
     const tr=document.createElement('tr');
     for(const t of [m.date+' · '+m.opponent,m.status==='finished'?'Finalizado':'En curso',m.rallies,m.actions,`${m.issues.filter(i=>i.severity==='error').length} / ${m.issues.filter(i=>i.severity==='warning').length}`]){
       const td=document.createElement('td');td.textContent=String(t);tr.appendChild(td);
     }b.appendChild(tr);
     s.appendChild(new Option(`${m.date} · ${m.opponent}`,String(m.id)));
   }
   if(!r.count){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='No se han encontrado scoutings en el equipo actual.';tr.appendChild(td);b.appendChild(tr)}
   if(!r.reports.some(x=>String(x.id)===state.selected))state.selected=String(r.reports[0]?.id||'');
   s.value=state.selected;$('vc158-native-export').disabled=!state.selected;
   detail();
   $('vc158-message').textContent=r.journal.failures?'El diario local ha notificado errores. Descarga una copia de los scoutings y comprueba el almacenamiento del navegador.':r.cloud.pending?'La nube informa de cambios pendientes. Guarda una copia antes de utilizar otro dispositivo.':r.totals.errors?'Se han detectado errores en el registro. Exporta el diagnóstico antes de editar.':'Revisión local completada. Comprueba también la nube y otro dispositivo.';
   return true;
 }
 function download(filename,payload){
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 function backup(){
   const all=arr(bridge()?.getMatches?.());
   download('volley-coach-scoutings-'+new Date().toISOString().slice(0,10)+'.json',{format:'Volley Coach Data Reliability - backup de consulta',version:VERSION,exportedAt:now(),teamId:bridge()?.getTeamId?.()||null,scoutings:JSON.parse(JSON.stringify(all))});
   $('vc158-message').textContent=`Copia de ${all.length} scoutings descargada. No sustituye el importador nativo de scoutings.`;
 }
 function open(){if(!setup())return false;const box=$('vc158-audit');box.hidden=false;render();box.scrollIntoView({block:'start',behavior:'smooth'});return true}
 window.VC_DATA_RELIABILITY_16158={version:VERSION,auditMatch,auditAll,open,render,backup};
})();
