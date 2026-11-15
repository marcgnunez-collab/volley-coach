/* Volley Coach V19.3.16 · Smart Scouting & Match Reliability.
 * Read-only evidence from canonical 1938 projection; editor helpers update
 * only V19.3.15's DRAFT. No second match store, rally writes or points.
 */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_SMART_SCOUTING_19316=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.16',arr=x=>Array.isArray(x)?x:[],str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const GRADES=['#','+','!','-','/','='];
 const ZONE_ORDER=[4,3,2,7,8,9,5,6,1];
 const SUBZONE_ORDER=['C','B','D','A']; // C top-left, B top-right, D bottom-left, A bottom-right
 const CODE=/^((?:R)?(?:\d+|P)(?:S|R|E|A|B|D|F|C))([#+!\-/=])((?:\.[1-9][A-D]?(?:>(?:[1-9][A-D]?|C[1-8]))?)?)(.*)$/;
 const ZONE=/^[1-9][A-D]$/;
 function codeParts(code){const m=str(code).toUpperCase().replace(/\s+/g,'').match(CODE);return m?{prefix:m[1],evaluation:m[2],location:m[3],suffix:m[4]}:null;}
 function changeEvaluation(code,grade){const p=codeParts(code);if(!p||!GRADES.includes(grade))return null;return p.prefix+grade+p.location+p.suffix;}
 function parseLocation(location){const m=str(location).match(/^\.([1-9][A-D]?)(?:>([1-9][A-D]?|C[1-8]))?$/);return m?{origin:m[1],destination:m[2]||''}:{origin:'',destination:''};}
 function changeZone(code,zone,mode,skill){
  const p=codeParts(code);if(!p||!ZONE.test(str(zone)))return {error:'Código o subzona no reconocidos.'};
  if(/>C[1-8]$/.test(p.location))return {error:'Esta acción usa destino por cono. Cambia primero al modo zonas en el editor original.'};
  if(p.suffix.includes('.'))return {error:'El código contiene una localización no reconocida; compruébala manualmente.'};
  const t=str(skill).toUpperCase(),loc=parseLocation(p.location);
  let origin=loc.origin,destination=loc.destination;
  if(t==='R'||t==='D'){origin=str(zone);destination='';}
  else if(t==='B'){origin=str(zone);destination='';}
  else if(mode==='origin'){origin=str(zone);}
  else if(mode==='destination'){destination=str(zone);if(!origin)return {error:'Marca primero una zona de origen.'};}
  else return {error:'Selecciona origen o destino.'};
  const codeOut=p.prefix+p.evaluation+'.'+origin+(destination?'>'+destination:'')+p.suffix;
  return {code:codeOut,origin,destination};
 }
 function selectMode(work,action){if(action?.skill==='R'||action?.skill==='D')return 'contacto';if(action?.skill==='B')return 'origen';return work?.vc19316Mode||'origen';}
 function editorPanel(work,action){
  const mode=selectMode(work,action),item=arr(work?.draft)[work?.selected],p=codeParts(item?.code),location=parseLocation(p?.location);
  const marks=action?.skill==='R'||action?.skill==='D'?'contacto':action?.skill==='B'?'origen':'origen / destino';
  return `<section class="vc19316-editor" aria-label="Herramientas rápidas de scouting"><div class="vc19316-panel-heading"><div><strong>V19.3.16 · Codificación rápida</strong><p>Evalúa sin reescribir el código · Alt + 1…6 · Alt + ↑/↓ para contactos</p></div><span>Modo ${esc(marks)}</span></div>
   <div class="vc19316-grades" aria-label="Valoración rápida">${GRADES.map((g,i)=>`<button type="button" data-vc19316-grade="${esc(g)}" title="Alt + ${i+1}" class="${action?.evaluation===g?'is-current':''}" aria-label="Valoración ${esc(g)}">${esc(g)}</button>`).join('')}</div>
   <div class="vc19316-board-heading"><strong>Pista interactiva · 9 zonas × 4 cuadrantes</strong><div><button type="button" data-vc19316-mode="origen" ${mode==='origen'?'aria-pressed="true"':''} ${action?.skill==='R'||action?.skill==='D'?'disabled':''}>Origen</button><button type="button" data-vc19316-mode="destino" ${mode==='destino'?'aria-pressed="true"':''} ${['R','D','B'].includes(action?.skill)?'disabled':''}>Destino</button></div></div>
   <div class="vc19316-court" role="group" aria-label="Subzonas de pista, orientación C B D A">${ZONE_ORDER.map(n=>`<div class="vc19316-zone" data-vc19316-zone-container="${n}">${SUBZONE_ORDER.map(q=>{const token=String(n)+q,active=location.origin===token||location.destination===token;return `<button type="button" data-vc19316-zone="${token}" class="${active?'is-marked':''}" title="Zona ${n}, cuadrante ${q}" aria-label="Zona ${n} cuadrante ${q}">${q}</button>`;}).join('')}<span>Z${n}</span></div>`).join('')}</div>
   <p class="vc19316-court-status">${mode==='contacto'?'Marca la zona de contacto.':mode==='origen'?'Marca el origen; después podrás elegir el destino.':'Marca el destino.'} Actual: ${esc(location.origin||'—')}${location.destination?' → '+esc(location.destination):''}. Cambios pendientes hasta pulsar Guardar.</p></section>`;
 }
 function editorAction({button,work,win,parseCode}){
  if(!button||!work)return {handled:false};
  const grade=button.dataset?.vc19316Grade,zone=button.dataset?.vc19316Zone,mode=button.dataset?.vc19316Mode;
  if(grade===undefined&&zone===undefined&&mode===undefined)return {handled:false};
  const item=arr(work.draft)[work.selected];if(!item)return {handled:true,error:'Selecciona un contacto.'};
  const old=arr(work.original)[item.originIndex]||null;
  const parsed=parseCode(win,item.code,old,win?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.());
  if(parsed.error)return {handled:true,error:parsed.error};
  if(mode!==undefined){if(!['origen','destino'].includes(mode))return {handled:true,error:'Modo no reconocido.'};
   if(['R','D','B'].includes(parsed.action.skill)&&mode==='destino')return {handled:true,error:'Este fundamento no admite ese destino en la pista.'};
   work.vc19316Mode=mode;return {handled:true,changed:true};}
  let candidate;
  if(grade!==undefined){candidate=changeEvaluation(item.code,grade);if(!candidate)return {handled:true,error:'El código no tiene un prefijo compatible para valoración rápida.'};}
  else{
   const effective=selectMode(work,parsed.action);
   const output=changeZone(item.code,zone,effective==='destino'?'destination':'origin',parsed.action.skill);
   if(output.error)return {handled:true,error:output.error};candidate=output.code;
  }
  const valid=parseCode(win,candidate,old,win?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.());
  if(valid.error)return {handled:true,error:'La pista no puede aplicar este código: '+valid.error};
  item.code=candidate;
  if(zone!==undefined)work.vc19316Mode=selectMode(work,parsed.action)==='origen'&&!['R','D','B'].includes(parsed.action.skill)?'destino':'origen';
  return {handled:true,changed:true,code:candidate};
 }
 function keyboard({event,work,win,parseCode}){
  if(!event?.altKey||event.ctrlKey||event.metaKey||!work)return {handled:false};
  if(event.key==='ArrowUp'||event.key==='ArrowDown'){
   const index=Math.min(arr(work.draft).length-1,Math.max(0,work.selected+(event.key==='ArrowUp'?-1:1)));
   if(index<0)return {handled:true};work.selected=index;work.vc19316Mode=null;return {handled:true,changed:true,focus:true};
  }
  const ix=Number(event.key)-1;
  if(!/^[1-6]$/.test(event.key))return {handled:false};
  return {...editorAction({button:{dataset:{vc19316Grade:GRADES[ix]}},work,win,parseCode}),focus:true};
 }
 const opposite=team=>team==='ours'?'opponent':team==='opponent'?'ours':null;
 function association(rally){
  const contacts=arr(rally?.contacts),links=[],warnings=[];
  if(!contacts.length)return {links,warnings};
  if(contacts.some(c=>!c.team))warnings.push('Hay contactos sin equipo: no se vinculan automáticamente.');
  for(let i=0;i<contacts.length;i++){
   const c=contacts[i];if(!c.team||!c.skill)continue;
   let target=null,type='';
   if(c.skill==='S'){
    for(let j=i+1;j<contacts.length;j++){const n=contacts[j];if(!n.team||!n.skill||n.skill==='S')break;if(n.skill==='R'){if(n.team===opposite(c.team))target=n;break;}if(n.team!==c.team&&n.skill!=='R')break;}
    type='S→R';
   }else if(c.skill==='R'||c.skill==='E'){
    const to=c.skill==='R'?'E':'A';type=c.skill+'→'+to;
    for(let j=i+1;j<contacts.length;j++){const n=contacts[j];if(!n.team||n.team!==c.team||n.skill===c.skill||n.skill==='S')break;
     if(n.skill===to){target=n;break;}if(c.skill==='R'&&n.skill==='A')break;
    }
   }else if(c.skill==='A'){
    type='A→B';for(let j=i+1;j<contacts.length;j++){const n=contacts[j];if(!n.team||n.skill==='S'||n.skill==='A')break;
     if(n.skill==='B'){if(n.team===opposite(c.team))target=n;break;}if(n.team!==c.team)break;
    }
   }
   if(target)links.push({type,from:c.key,to:target.key,fromCode:c.code,toCode:target.code,set:rally.set,rallyKey:rally.key,stable:!!(c.source?.stableId&&target.source?.stableId),verified:'orden de contactos'});
  }
  return {links,warnings};
 }
 function scoreValid(raw){
  if(!raw?.winner)return null;
  const before=raw.scoreBefore,after=raw.scoreAfter;
  if(!before||!after)return null;
  const values=[before.us,before.opponent,after.us,after.opponent];
  if(values.some(v=>!/^(0|[1-9]\d*)$/.test(str(v))))return null;
  const ours=Number(after.us)-Number(before.us),op=Number(after.opponent)-Number(before.opponent);
  return raw.winner==='ours'?(ours===1&&op===0):raw.winner==='opponent'?(ours===0&&op===1):null;
 }
 function auditMatch(match,engine){
  const projection=engine?.normalize?.(match);if(!projection)return {error:'Motor de datos no disponible.'};
  const issues=[...arr(projection.issues).map(e=>({type:e.type,message:e.message,set:e.set,key:e.key}))];
  let checkedScores=0;
  for(const set of arr(match?.sets))for(const [i,rally] of arr(set?.rallies).entries()){
   const validity=scoreValid(rally);
   if(validity!==null){checkedScores++;if(validity===false)issues.push({type:'score-discrepancy',set:set?.number,index:i+1,message:'El incremento de marcador no coincide con el ganador registrado.'});}
   const actions=arr(rally?.actions);
   for(let j=1;j<actions.length;j++){
    const before=actions[j-1]?.scoutMs,after=actions[j]?.scoutMs;
    if(before!=null&&after!=null&&Number.isFinite(Number(before))&&Number.isFinite(Number(after))&&Number(after)<Number(before))issues.push({type:'time-order',set:set?.number,index:i+1,message:'Marcas originales de scouting fuera de orden.'});
   }
  }
  return {rallies:projection.count.rallies,contacts:projection.count.contacts,checkedScores,issues,valid:issues.length===0};
 }
 function selectionHtml(rally){
  const result=association(rally);
  return `<div class="vc19316-selection"><h4>Smart Rally · relaciones por secuencia</h4>${result.links.length?`<div class="vc19316-links">${result.links.slice(0,15).map(l=>`<div><strong>${esc(l.type)}</strong><span>${esc(l.fromCode||'—')} → ${esc(l.toCode||'—')}</span>${!l.stable?'<small>ID incompleto</small>':''}</div>`).join('')}</div>`:'<p>No hay parejas de contactos comprobables en esta jugada.</p>'}${result.links.length>15?`<p>Mostrando 15 de ${result.links.length} relaciones.</p>`:''}${result.warnings.map(w=>`<p class="vc19316-warning">${esc(w)}</p>`).join('')}<p>Relaciones sugeridas por orden y equipo: no se inventan contactos, puntos ni resultados. Revisa los casos ambiguos en el editor.</p></div>`;
 }
 function updateSelection(root,rally){const node=root?.querySelector?.('#vc19316-chain-panel');if(node)node.innerHTML=selectionHtml(rally);}
 function syncReadiness(win,match){
  const bridge=win?.VC_SCOUT_VIDEO_BRIDGE,active=bridge?.getActive?.();
  return {storage:typeof bridge?.save==='function',flush:typeof win?.scoutV902Flush==='function',sameMatch:!!match&&!!active&&str(active.id)===str(match.id),
    cloudVerified:false,otherDeviceVerified:false};
 }
 function updateAudit(root,match,engine,win){const node=root?.querySelector?.('#vc19316-audit-panel');if(!node)return;
  const a=auditMatch(match,engine);if(a.error){node.textContent=a.error;return;}
  const readiness=win?syncReadiness(win,match):null;
  node.innerHTML=`<div class="vc19316-audit-head"><strong>Auditoría local de partido</strong><span>${a.issues.length?a.issues.length+' advertencias':'Sin incidencias detectadas'}</span></div><p>${a.rallies} rallies · ${a.contacts} contactos · ${a.checkedScores} tanteos comprobables</p>${readiness?`<p class="vc19316-readiness">Guardado local: ${readiness.storage?'motor disponible':'no disponible'} · Sincronización: ${readiness.flush?'función disponible':'función no disponible'} · Partido activo: ${readiness.sameMatch?'coincidente':'distinto o no seleccionado'}</p>`:''}<div class="vc19316-audit-issues">${a.issues.length?a.issues.slice(0,12).map(x=>`<p>Set ${esc(x.set||'—')} · ${esc(x.message)}</p>`).join(''):'<p>Las comprobaciones locales de esquema y tanteo no han detectado discrepancias.</p>'}${a.issues.length>12?`<p>Y ${a.issues.length-12} incidencias más.</p>`:''}</div><p class="vc19316-audit-note">Solo lectura. No verifica envío a nube, recepción en otro dispositivo ni la autenticidad del vídeo.</p>`;
 }
 return Object.freeze({VERSION,ZONE_ORDER,SUBZONE_ORDER,codeParts,changeEvaluation,changeZone,editorPanel,editorAction,keyboard,association,scoreValid,auditMatch,syncReadiness,selectionHtml,updateSelection,updateAudit});
});
