/* Volley Coach V19.3.19.1 · Unified workspace presentation and safe data audit.
 * Only links to existing views, reads exported state on explicit user action,
 * and downloads a backup file. Never replaces the scouting/sync/video engines.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document)api.mount(root);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.1';
 const ROUTES=Object.freeze([
  ['Club y equipos','jugadores'],['Entrenamientos','planificacion'],['Partidos','scout-dashboard'],
  ['Análisis','scout-analysis'],['Video Studio','scout-video-hub'],['Configuración','v11-management']]);
 const MATCH_ROUTES=Object.freeze([
  ['Preparación','scout-plan'],['Scouting','scout-match-mode'],['Vídeo','scout-video-hub'],
  ['Análisis','scout-analysis'],['Banquillo','vc155-bench'],['Informes','v11-reports']]);
 function route(root,view){
  if(!root?.document?.getElementById(view)?.classList?.contains('view'))return false;
  if(root?.VC19_UNIFIED_WORKFLOW?.route)return root.VC19_UNIFIED_WORKFLOW.route(view)===true;
  if(root?.VC17_WORKSPACE?.route)return root.VC17_WORKSPACE.route(view)===true;
  return false;
 }
 function readProjection(root){
  const api=root?.VC193191_DATA_CONTRACT;
  if(typeof root?.estadoLocal!=='function'||!api?.projectState)throw Error('El estado local no está disponible. No se ha realizado ningún cambio.');
  return api.projectState(root.estadoLocal());
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  let home=doc.getElementById('vc193191-home'),match=doc.getElementById('vc193191-match'),audit=doc.getElementById('vc193191-audit');
  function section(id,cls,html){const el=doc.createElement('section');el.id=id;el.className=cls;el.innerHTML=html;return el;}
  function ensure(){
   if(!home){const dash=doc.getElementById('dashboard');if(dash){
    const original=doc.getElementById('vc17-dashboard');
    const overview=original
     ? `<div class="vc193191-intro"><small>V19.3.19.1 · PROFESSIONAL WORKSPACE</small><h3>Una sola navegación, datos protegidos</h3><p>El menú superior ya contiene las áreas de trabajo. Los módulos originales y los datos no se han migrado. Antes de actualizar, revisa y exporta una copia verificable.</p></div><div class="vc193191-links is-single"><button type="button" data-vc193191-route="v11-management"><strong>Auditoría y respaldo</strong><span>Verificar estructura · Descargar copia JSON</span></button></div>`
     : `<div class="vc193191-intro"><small>V19.3.19.1 · PROFESSIONAL WORKSPACE</small><h3>Espacios de trabajo conectados</h3><p>Una única navegación para entrenamientos, partidos, análisis y vídeo. Los datos se conservan en sus módulos originales.</p></div><div class="vc193191-links">${ROUTES.map(([label,view])=>`<button type="button" data-vc193191-route="${view}"><strong>${label}</strong><span>Acceder al espacio</span></button>`).join('')}</div>`;
    home=section('vc193191-home','vc193191-home',overview);
    if(original)original.insertAdjacentElement('afterend',home);else dash.insertBefore(home,dash.firstChild);
   }}
   if(!match){const host=doc.getElementById('scout-match-mode');if(host){
    match=section('vc193191-match','vc193191-match',`<div class="vc193191-match-title"><strong>Match Workspace</strong><span>Un partido · Scouting · Vídeo · Estadísticas</span></div><nav aria-label="Herramientas del partido">${MATCH_ROUTES.map(([label,view])=>`<button type="button" data-vc193191-route="${view}" ${view==='scout-match-mode'?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`);
    host.insertBefore(match,host.firstChild);
   }}
   if(!audit){const host=doc.getElementById('v11-management');if(host){
    audit=section('vc193191-audit','vc193191-audit',`<div class="vc193191-audit-title"><div><small>CONTROL DE CALIDAD · SOLO LECTURA</small><h3>Arquitectura y seguridad de datos</h3><p>Comprobación de equipos, jugadores, scoutings y contactos originales. No ejecuta migraciones ni sincronizaciones.</p></div></div><div class="vc193191-audit-actions"><button type="button" data-vc193191-action="inspect">Revisar datos</button><button type="button" data-vc193191-action="backup">Exportar copia JSON</button><label class="vc193191-file">Validar copia (sin importar)<input id="vc193191-file" type="file" accept=".json,application/json"></label></div><div class="vc193191-audit-output" id="vc193191-report" role="status" aria-live="polite">No se ha realizado ninguna comprobación.</div><p class="vc193191-note">La exportación utiliza el formato original de respaldo. La validación no restaura ni modifica ningún registro. Para una actualización de versión, guarda una copia externa antes de desplegar.</p>`);
    const first=host.querySelector('.v11-page-head');if(first)first.insertAdjacentElement('afterend',audit);else host.insertBefore(audit,host.firstChild);
   }}
   return !!(home&&match&&audit);
  }
  function message(msg){const e=doc.getElementById('vc193191-report');if(e)e.textContent=msg;}
  function describe(p){return `${p.total.teams} equipos · ${p.total.players} jugadores · ${p.total.matches} scoutings · ${p.total.rallies} rallies · ${p.total.contacts} contactos.\n`+
   p.teams.map(t=>`${t.teamId}: ${t.counts.players} jugadores, ${t.counts.matches} partidos, ${t.counts.trainings} entrenamientos, ${t.counts.plans} planes.`).join('\n')+
   `\n${p.issues.length} advertencia(s) de identificadores o estructura. `+
   `Las referencias sin ID son provisionales. Estado de nube y presencia de dispositivos: consultar indicadores existentes.`;
  }
  function backup(){
   if(typeof root.estadoLocal!=='function')throw Error('Estado local no disponible.');
   const state=root.estadoLocal();const api=root.VC193191_DATA_CONTRACT;
   api.projectState(state); // reject malformed payload rather than exporting it silently
   const contents=JSON.stringify({schema:api.SCHEMA,version:VERSION,exportedAt:new Date().toISOString(),state});
   const blob=new root.Blob([contents],{type:'application/json;charset=utf-8'});
   const url=root.URL.createObjectURL(blob),a=doc.createElement('a');
   try{a.href=url;a.download='volley-coach-backup-v193191-'+new Date().toISOString().slice(0,10)+'.json';doc.body.appendChild(a);a.click();}
   finally{a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),30000);}
   return blob.size;
  }
  async function validateFile(file){
   if(!file)return;
   if(file.size>60*1024*1024){message('El archivo supera 60 MB. No se ha importado ni modificado ningún dato.');return;}
   try{
    const payload=JSON.parse(await file.text()),api=root.VC193191_DATA_CONTRACT;
    const candidate=api.validateBackup(payload);
    if(!candidate.ok){message('Copia no válida: '+candidate.error);return;}
    let current=null;try{current=readProjection(root)}catch(_){ }
    const diff=api.compareProjections(current,candidate.projection);
    const lines=diff?diff.map(x=>`${x.entity}: actual ${x.current} / copia ${x.candidate} (${x.delta>=0?'+':''}${x.delta})`).join('\n'):'No hay datos locales comparables.';
    message('Estructura de copia reconocida. No se han restaurado datos.\n'+lines+'\nVerifica también contenidos y vídeos en el dispositivo de origen.');
   }catch(err){message('No se pudo leer el archivo JSON: '+String(err?.message||err));}
  }
  doc.addEventListener('click',e=>{
   const btn=e.target?.closest?.('[data-vc193191-route],[data-vc193191-action]');if(!btn)return;
   if(btn.dataset.vc193191Route){const view=btn.dataset.vc193191Route;if(!route(root,view))message('No se pudo abrir la vista '+view+'.');return;}
   const action=btn.dataset.vc193191Action;
   if(action==='inspect'){
    try{message(describe(readProjection(root)));}
    catch(err){message('Auditoría no disponible: '+String(err?.message||err));}
   }else if(action==='backup'){
    try{const size=backup();message(`Se ha iniciado la descarga de ${Math.round(size/1024)} KB. Comprueba el archivo descargado antes de actualizar.`);}
    catch(err){message('No se ha generado la copia: '+String(err?.message||err));}
   }
  });
  doc.addEventListener('change',e=>{if(e.target?.id==='vc193191-file')void validateFile(e.target.files?.[0]);});
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
  root.VC193191_WORKSPACE={VERSION,ROUTES,MATCH_ROUTES,route:view=>route(root,view),inspect:()=>readProjection(root),ensure};
  return true;
 }
 return {VERSION,ROUTES,MATCH_ROUTES,route,readProjection,mount};
});
