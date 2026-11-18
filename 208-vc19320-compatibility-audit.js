/* Volley Coach V19.3.20 - Compatibility & Final Audit.
 * Pure, read-only inspectors + a safe diagnostic UI. DVW inspection is NOT
 * DVW import. No write to scouting, IndexedDB, localStorage or Supabase.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_COMPAT_AUDIT_19320=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.20',MAX_DVW=8*1024*1024,MAX_LINES=120000;
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const EVALS=new Set(['#','+','!','-','/','=']);
 const SKILLS=new Set(['S','R','E','A','B','D','F','C']);
 const zone=x=>x===null||x===undefined||str(x)===''?true:/^Z?[1-9][A-D]?$/i.test(str(x));
 function inspectDVW(input){
  const text=String(input??'');
  if(text.length>MAX_DVW)throw Error('Archivo demasiado grande para inspección DVW (8 MB).');
  if(text.includes('\0'))throw Error('Contenido binario: no corresponde a un DVW de texto reconocido.');
  const lines=text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/);
  if(lines.length>MAX_LINES)throw Error('Demasiadas líneas para inspección segura.');
  const sections=Object.create(null);let current='';
  for(const line of lines){
   const tag=line.trim().match(/^\[([\w-]{1,55})\]$/);
   if(tag){current=tag[1].toUpperCase();if(!sections[current])sections[current]=[];continue;}
   if(current&&line.trim())sections[current].push(line);
  }
  if(!sections['3DATAVOLLEYSCOUT']||!sections['3MATCH']||!sections['3TEAMS']){
   throw Error('No se reconocen las secciones mínimas [3DATAVOLLEYSCOUT], [3MATCH] y [3TEAMS].');
  }
  const teams=arr(sections['3TEAMS']).slice(0,2).map(row=>str(row.split(';')[1])).filter(Boolean);
  const scout=arr(sections['3SCOUT']);
  const codes=scout.map(row=>str(row.split(';')[0])).filter(Boolean);
  const contacts=codes.filter(code=>/^[*a]\d{1,2}[SREABDFC]/i.test(code));
  const unknown=codes.filter(code=>!/^([*a]\d{1,2}[SREABDFC]|[*a][PpzT])/i.test(code));
  const warnings=[];
  if(!scout.length)warnings.push('No se ha encontrado la sección [3SCOUT] con contactos.');
  if(teams.length<2)warnings.push('Falta el nombre de uno o ambos equipos.');
  if(unknown.length)warnings.push(`${unknown.length} líneas de scouting no clasificadas: comprobar con Data Volley.`);
  return {format:'dvw',version:VERSION,sections:Object.keys(sections),teams,scoutLines:scout.length,
   recognizedContacts:contacts.length,unclassified:unknown.length,
   codesSample:codes.slice(0,12),warnings,readOnly:true,importable:false,
   note:'Inspección orientativa de DVW; NO convierte, reproduce ni importa la estructura completa del partido.'};
 }
 function inspectExchange(input){
  const data=typeof input==='string'?JSON.parse(input):input;
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('La copia debe ser un objeto JSON.');
  const isVcx=data.type==='volley-coach-exchange',isBackup=!!data.match||Array.isArray(data.matches);
  if(!isVcx&&!isBackup)throw Error('El JSON no es un intercambio VCX ni una copia de scouting reconocida.');
  const matches=arr(data.matches).length?data.matches:data.match?[data.match]:[];
  if(matches.length>5000)throw Error('La copia supera el límite de auditoría de partidos.');
  return {format:isVcx?'vcx':'json',matchCount:matches.length,scheme:str(data.schema)||null,
   matches:matches.slice(0,500).map(x=>({id:str(x?.id),sets:arr(x?.sets).length,opponent:str(x?.opponent)})),
   warnings:matches.length>500?['Solo se muestran los primeros 500 partidos del archivo.']:[],
   readOnly:true,importable:'requiere el importador existente y su validación de seguridad'};
 }
 function inspectCSV(text){
  const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  if(lines.length>MAX_LINES)throw Error('Demasiadas líneas para previsualizar el CSV.');
  const header=str(lines[0]||'');
  const delim=(header.match(/;/g)||[]).length>(header.match(/,/g)||[]).length?';':',';
  // The header is enough for a safe coverage inspection; never pretend this is a full CSV parser.
  const names=header.split(delim).map(x=>x.replace(/^"|"$/g,'').trim());
  const structured=['match_id','set','rally','skill','evaluation'].every(k=>names.includes(k));
  return {format:'csv',delimiter:delim,estimatedRows:Math.max(0,lines.length-1),columns:names.slice(0,70),
   structured,readOnly:true,importable:false,
   warnings:structured?['El CSV de acciones permite análisis, pero no recupera un partido completo en Volley Coach.']:['Columnas insuficientes para identificar un CSV de acciones Volley Coach.']};
 }
 function auditMatch(match){
  if(!match||typeof match!=='object')return {present:false,sets:0,rallies:0,contacts:0,issues:[{kind:'missing-match',detail:'No hay scouting seleccionado'}],coverage:{}};
  const issues=[],counters={sets:0,rallies:0,contacts:0,closed:0,unknownWinner:0,unknownServe:0,missingPlayer:0,missingEvaluation:0,invalidZone:0,missingVideo:0,duplicateAction:0};
  const bySkill=Object.fromEntries([...SKILLS].map(k=>[k,0]));
  const seenSet=new Set();
  for(const [si,set] of arr(match.sets).entries()){
   if(!set)continue;counters.sets++;
   const setId=str(set.number||si+1);
   if(seenSet.has(setId))issues.push({kind:'duplicate-set',detail:`Set ${setId} repetido`});seenSet.add(setId);
   const rallyIDs=new Set();
   for(const [ri,r] of arr(set.rallies).entries()){
    if(!r)continue;counters.rallies++;
    if(str(r.id)){if(rallyIDs.has(str(r.id)))issues.push({kind:'duplicate-rally',detail:`Set ${setId}, rally ${ri+1}: ID repetido`});rallyIDs.add(str(r.id));}
    if(r.winner==='ours'||r.winner==='opponent')counters.closed++;else counters.unknownWinner++;
    if(!['ours','opponent'].includes(r.servingBefore))counters.unknownServe++;
    const ids=new Set();
    for(const [ai,a] of arr(r.actions).entries()){
     if(!a)continue;counters.contacts++;
     if(!str(a.playerId||a.playerNameSnapshot||a.playerLabel||a.playerNumberSnapshot))counters.missingPlayer++;
     if(!EVALS.has(str(a.evaluation)))counters.missingEvaluation++;
     for(const field of ['startZone','endZone','contactZone','setTarget'])if(!zone(a[field]))counters.invalidZone++;
     if(str(a.id)){if(ids.has(str(a.id)))counters.duplicateAction++;ids.add(str(a.id));}
     if(SKILLS.has(str(a.skill).toUpperCase()))bySkill[str(a.skill).toUpperCase()]++;
    }
   }
  }
  if(counters.unknownWinner)issues.push({kind:'unknown-winner',detail:`${counters.unknownWinner} rallies sin ganador explícito`});
  if(counters.unknownServe)issues.push({kind:'unknown-serve',detail:`${counters.unknownServe} rallies sin saque explícito`});
  if(counters.invalidZone)issues.push({kind:'invalid-zone',detail:`${counters.invalidZone} zonas no reconocidas`});
  if(counters.duplicateAction)issues.push({kind:'duplicate-action',detail:`${counters.duplicateAction} IDs de acciones repetidos dentro de un rally`});
  return {present:true,matchId:str(match.id),opponent:str(match.opponent),...counters,bySkill,issues,
   coverage:{closedRallies:counters.rallies?Number((100*counters.closed/counters.rallies).toFixed(1)):null,
    evaluatedActions:counters.contacts?Number((100*(counters.contacts-counters.missingEvaluation)/counters.contacts).toFixed(1)):null}};
 }
 const CAPABILITIES=[
  ['Scouting y edición de contactos','implementado','Editor y código rápido; probar con partido real'],
  ['Distribución consecutiva y llamadas','implementado','Datos explícitos, filtros y rallies asociados'],
  ['Análisis por zonas y rotaciones','implementado','Seis zonas y cuadrantes codificados'],
  ['Hojas estadísticas personalizables','implementado','Plantillas y fórmulas locales'],
  ['Montaje y exportación de clips','parcial','WebM condicionado por navegador y fuente local'],
  ['Bench Client y datos en directo','parcial','No hay validación PC–móvil con Supabase real'],
  ['Importación y exportación VCX','implementado','Formato propio; copia de seguridad antes de importar'],
  ['Importación de archivos Data Volley .dvw','no implementado','Solo inspección de estructura en lectura'],
  ['Exportación nativa DV4/2007 .dvw','no implementado','La lista TXT de códigos NO es .dvw'],
  ['Exportación VIS de competición','no implementado','Requiere especificación y validación'],
  ['Compatibilidad vídeo entre dispositivos','no verificado','Las referencias de vídeo no transfieren necesariamente los archivos'],
  ['Sincronización y recuperación multiclub','no verificado','Requiere pruebas reales de permisos y conflictos']
 ];
 function decodeDVW(buffer){
  const bytes=new Uint8Array(buffer);
  if(bytes.length>MAX_DVW)throw Error('El DVW supera 8 MB.');
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch(_){
   try{return new TextDecoder('windows-1252').decode(bytes)}catch(_2){throw Error('No se ha podido decodificar el archivo como texto.')}}
 }
 function exportJSON(data,filename,win){
  const blob=new win.Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=win.URL.createObjectURL(blob),a=win.document.createElement('a');
  a.href=url;a.download=filename;win.document.body.appendChild(a);a.click();a.remove();
  win.setTimeout(()=>win.URL.revokeObjectURL(url),2000);
 }
 // V20.5.0.3: the eleven legacy CSS names never existed in repository history;
 // their dead HTML/SW references were removed. Do not report them as deployed 404s.
 const assetIssues=[];
 function getMatch(win){try{return win.MatchState?.getActive?.()||win.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||win.VC_SCOUT_CORE?.getActive?.()||null}catch(_){return null}}
 function renderSummary(win,box,external){
  const a=auditMatch(getMatch(win));
  const status=a.present?`<div class="vc19320-stats"><span><b>${a.sets}</b> Sets</span><span><b>${a.rallies}</b> Rallies</span><span><b>${a.contacts}</b> Contactos</span><span><b>${a.issues.length}</b> Avisos</span></div>`:'<p>No hay un scouting activo. Abre un partido para auditarlo.</p>';
  const features=CAPABILITIES.map(([name,state,detail])=>`<tr><td>${esc(name)}</td><td><span class="vc19320-status" data-state="${esc(state)}">${esc(state)}</span></td><td>${esc(detail)}</td></tr>`).join('');
  const ext=external?`<article class="vc19320-inspect"><strong>Archivo analizado · ${esc(external.filename||'')}</strong><pre>${esc(JSON.stringify(external.result,null,2))}</pre></article>`:'';
  box.innerHTML=`<div class="vc19320-head"><div><span>V19.3.20 · AUDITORÍA DE COMPATIBILIDAD</span><h3>Diagnóstico de intercambio y Data Volley</h3><p>Lectura solamente. No cambia el scouting, los puntos ni la nube.</p></div><button type="button" data-vc19320-refresh>Actualizar</button></div>
   ${status}<div class="vc19320-actions"><button type="button" data-vc19320-export>Descargar informe JSON</button><label class="vc19320-file">Inspeccionar DVW / VCX / CSV <input type="file" accept=".dvw,.vcx,.json,.csv,.txt" data-vc19320-file hidden></label></div>
   <p class="vc19320-note">TXT de códigos y CSV no son exportaciones nativas DVW. Este lector DVW solo muestra estructura y cobertura, no importa partidos.</p>
   <div class="vc19320-table"><table><thead><tr><th>Funcionalidad</th><th>Estado</th><th>Observación</th></tr></thead><tbody>${features}</tbody></table></div>
   <details><summary>Recursos estáticos pendientes (${assetIssues.length})</summary><p>Los 11 enlaces CSS históricos inexistentes se retiraron en V20.5.0.3 tras comprobar el historial de GitHub. Usa Gestión → Integridad de instalación para verificar los archivos publicados.</p></details>${ext}<p class="vc19320-statusline" role="status"></p>`;
 }
 function mount(dialog,win=typeof window==='undefined'?null:window){
  if(!dialog||!win||dialog.querySelector('#vc19320-compat'))return false;
  const body=dialog.querySelector('.v152-exchange-body')||dialog;
  const section=win.document.createElement('section');section.id='vc19320-compat';section.className='vc19320-compat';
  body.appendChild(section);let external=null;
  const refresh=()=>renderSummary(win,section,external);
  section.addEventListener('click',e=>{
   if(e.target.closest('[data-vc19320-refresh]')){refresh();return;}
   if(e.target.closest('[data-vc19320-export]')){
    const report={version:VERSION,generatedAt:new Date().toISOString(),match:auditMatch(getMatch(win)),
     compatibility:CAPABILITIES.map(([name,state,detail])=>({name,state,detail})),missingAssetsInPackagedZIP:assetIssues,
     inspectedFile:external};
    try{exportJSON(report,`VolleyCoach_Auditoria_${VERSION}.json`,win)}catch(err){section.querySelector('.vc19320-statusline').textContent=`No se pudo descargar: ${str(err?.message)}`;}
   }
  });
  section.addEventListener('change',async e=>{
   const input=e.target.closest('[data-vc19320-file]');if(!input)return;
   const f=input.files?.[0];if(!f)return;
   const line=section.querySelector('.vc19320-statusline');
   if(f.size>MAX_DVW){line.textContent='Archivo demasiado grande para inspección (máximo 8 MB).';return;}
   try{
    let result;
    if(/\.dvw$/i.test(f.name))result=inspectDVW(decodeDVW(await f.arrayBuffer()));
    else if(/\.(vcx|json)$/i.test(f.name))result=inspectExchange(await f.text());
    else if(/\.(csv|txt)$/i.test(f.name))result=inspectCSV(await f.text());
    else throw Error('Solo DVW, VCX, JSON y CSV/TXT.');
    external={filename:f.name,result};refresh();
   }catch(err){external=null;refresh();section.querySelector('.vc19320-statusline').textContent=`Archivo rechazado sin modificar datos: ${str(err?.message)}`;}
   input.value='';
  });
  refresh();return true;
 }
 function boot(win){const dialog=win.document.getElementById('v152-exchange-modal');if(dialog)mount(dialog,win)}
 if(typeof window!=='undefined'){
  if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',()=>boot(window),{once:true});else boot(window);
 }
 return Object.freeze({VERSION,inspectDVW,inspectExchange,inspectCSV,decodeDVW,auditMatch,assetIssues,CAPABILITIES,mount});
});
