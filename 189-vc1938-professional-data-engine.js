/* Volley Coach V19.3.8 · Professional Data Engine
 * Canonical, read-only projection of the existing scouting schema.
 * A projection is deliberately NOT a migration or second source of truth.
 * All provenance points back to the original match/set/rally/action indexes.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_DATA_ENGINE_1938=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.8',SKILLS=new Set(['S','R','E','A','B','D','F','C']);
 const EVALS=new Set(['#','+','!','-','/','=']);
 const arr=x=>Array.isArray(x)?x:[];
 const val=x=>String(x??'').trim();
 const esc=x=>val(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const team=x=>x==='ours'||x==='opponent'?x:null;
 const zone=x=>{const match=val(x).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);return match?{zone:Number(match[1]),quadrant:match[2]||null,code:'Z'+match[1]+(match[2]||'')}:null};
 const pct=(n,d)=>d?Math.round(1000*n/d)/10:null;
 const present=x=>x!==null&&x!==undefined&&val(x)!=='';
 const idPart=x=>encodeURIComponent(val(x));
 const getPlayer=a=>val(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||a?.playerId||a?.playerNumber);
 function normalize(match){
  const issues=[],rallies=[],contacts=[],possessions=[],chains=[];
  const matchId=val(match?.id),setKeys=new Set();
  for(const [si,set] of arr(match?.sets).entries()){
   const setNumber=Number(set?.number);
   const setId=Number.isInteger(setNumber)&&setNumber>0?setNumber:si+1;
   if(setKeys.has(setId))issues.push({type:'duplicate-set',set:setId,message:'Número de set duplicado'});
   setKeys.add(setId);
   const rallyIds=new Set();
   for(const [ri,raw] of arr(set?.rallies).entries()){
    if(!raw)continue;
    const nativeRallyId=present(raw.id)?val(raw.id):null;
    if(nativeRallyId&&rallyIds.has(nativeRallyId))issues.push({type:'duplicate-rally',set:setId,index:ri+1,message:'Identificador de rally repetido'});
    if(nativeRallyId)rallyIds.add(nativeRallyId);
    const key=[idPart(matchId),setId,nativeRallyId?'id:'+idPart(nativeRallyId):'pos:'+ri].join('|');
    const serving=team(raw.servingBefore),winner=team(raw.winner);
    const ownRotation=Number(raw.rotationBefore),rivalRotation=Number(raw.opponentRotationBefore);
    const rally={key,matchId,set:setId,index:ri+1,nativeId:nativeRallyId,
     serving,winner,closed:!!winner,ownRotation:Number.isInteger(ownRotation)&&ownRotation>=1&&ownRotation<=6?ownRotation:null,
     rivalRotation:Number.isInteger(rivalRotation)&&rivalRotation>=1&&rivalRotation<=6?rivalRotation:null,
     contacts:[],possessions:[],scoreBefore:raw.scoreBefore||null,scoreAfter:raw.scoreAfter||null,
     provenance:{setIndex:si,rallyIndex:ri,stableId:!!nativeRallyId}};
    if(!winner)issues.push({type:'unknown-winner',key,message:'Ganador de rally sin registrar'});
    if(!serving)issues.push({type:'unknown-serve',key,message:'Equipo al saque no identificado'});
    const actionIds=new Set();
    for(const [ai,a] of arr(raw.actions).entries()){
     if(!a)continue;
     const t=team(a.team),skill=val(a.skill).toUpperCase(),evaluation=val(a.evaluation);
     const actionId=present(a.id)?val(a.id):null;
     if(actionId&&actionIds.has(actionId))issues.push({type:'duplicate-action',key,index:ai,message:'Acción duplicada dentro del rally'});
     if(actionId)actionIds.add(actionId);
     const fields={startZone:zone(a.startZone),endZone:zone(a.endZone),contactZone:zone(a.contactZone),setTarget:zone(a.setTarget),
      tempo:val(a.setTempo),attackTempo:val(a.attackTempo),combo:val(a.attackCombo),setterCall:val(a.setterCall),
      direction:val(a.attackDirection),blockers:present(a.blockers)?val(a.blockers):'',serveType:val(a.serveType),
      subtype:val(a.skillSubtype),receivedServeType:val(a.receivedServeType),
      dvSetType:val(a.dvSetType),attackCode:val(a.attackCode),endCone:val(a.endCone),
      specialCode:val(a.specialCode),blockTargetNumber:val(a.blockTargetNumber),
      startCoordinate:present(a.startCoordinate)?a.startCoordinate:null,
      endCoordinate:present(a.endCoordinate)?a.endCoordinate:null,
      contactCoordinate:present(a.contactCoordinate)?a.contactCoordinate:null};
     const videoFields=['videoTime','videoTimestamp','liveVideoTime','videoAction'];
     const video=videoFields.some(field=>present(a[field])&&Number.isFinite(Number(a[field]))&&Number(a[field])>=0);
     const contact={key:key+'|'+(actionId?'id:'+idPart(actionId):'pos:'+ai),rallyKey:key,matchId,set:setId,rallyIndex:ri+1,
      actionIndex:ai,nativeId:actionId,team:t,code:val(a.code),skill:SKILLS.has(skill)?skill:null,skillRaw:skill,evaluation:EVALS.has(evaluation)?evaluation:null,
      evaluationRaw:evaluation,player:getPlayer(a)||null,fields,video,scoutMs:Number.isFinite(Number(a.scoutMs))&&present(a.scoutMs)?Number(a.scoutMs):null,
      source:{matchId,setIndex:si,rallyIndex:ri,actionIndex:ai,stableId:!!actionId}};
     if(!t)issues.push({type:'unknown-team',key:contact.key,message:'Acción sin equipo identificado'});
     if(!contact.skill)issues.push({type:'unknown-skill',key:contact.key,message:'Fundamento desconocido'});
     if(evaluation&&!contact.evaluation)issues.push({type:'unknown-evaluation',key:contact.key,message:'Valoración no reconocida'});
     for(const field of ['startZone','endZone','contactZone','setTarget'])if(present(a[field])&&!fields[field])
      issues.push({type:'invalid-zone',key:contact.key,field,message:'Zona no reconocida'});
     contacts.push(contact);rally.contacts.push(contact);
    }
    // Each possession is a contiguous run of contacts from the SAME known team.
    // An unknown team is a boundary, never assigned to either team.
    let group=null;
    for(const c of rally.contacts){
     if(!group||!c.team||group.team!==c.team){
      if(!c.team){group=null;continue;}
      group={key:rally.key+'|pos:'+rally.possessions.length,rallyKey:rally.key,team:c.team,contacts:[],set:rally.set,rotation:c.team==='ours'?rally.ownRotation:rally.rivalRotation,
       serving:rally.serving,winner:rally.winner};
      rally.possessions.push(group);possessions.push(group);
     }
     group.contacts.push(c);c.possessionKey=group.key;
    }
    // Pair a set only with its next attack BEFORE another set or any team change.
    // Reception is the most recent contact R within the same possession before E.
    for(const p of rally.possessions){
     for(const [pi,c] of p.contacts.entries()){
      if(c.skill!=='E')continue;
      let attack=null,rec=null;
      for(let i=pi+1;i<p.contacts.length;i++){const next=p.contacts[i];if(next.skill==='E')break;if(next.skill==='A'){attack=next;break;}}
      for(let i=pi-1;i>=0;i--)if(p.contacts[i].skill==='R'){rec=p.contacts[i];break;}
      chains.push({key:c.key,team:p.team,rallyKey:rally.key,possessionKey:p.key,rotation:p.rotation,setter:c,attack,reception:rec,
       target:c.fields.setTarget,tempo:c.fields.tempo,combo:c.fields.combo||attack?.fields.combo||'',explicitTarget:!!c.fields.setTarget});
     }
    }
    rallies.push(rally);
   }
  }
  return {version:VERSION,matchId,rallies,contacts,possessions,chains,issues,
   count:{rallies:rallies.length,closed:rallies.filter(x=>x.closed).length,contacts:contacts.length,possessions:possessions.length,chains:chains.length}};
 }
 function filter(data,f={}){
  const target=team(f.team),set=present(f.set)?Number(f.set):null,rotation=present(f.rotation)?Number(f.rotation):null;
  const phase=val(f.phase).toUpperCase(),skill=val(f.skill).toUpperCase(),evalCode=val(f.evaluation),player=val(f.player).toLocaleLowerCase('es');
  const start=zone(f.startZone),end=zone(f.endZone),setter=val(f.setter).toLocaleLowerCase('es');
  const rallyBase=data.rallies.filter(r=>r.closed&&(!set||r.set===set)&&(!rotation||(!target?false:(target==='ours'?r.ownRotation:r.rivalRotation)===rotation))&&
   (!phase||!!r.serving&&(!target?false:phase==='K1'?r.serving!==target:phase==='K2'?r.serving===target:false)));
  const candidates=new Set(rallyBase.map(r=>r.key));
  const actionFiltered=!!(skill||evalCode||player||start||end||f.video===true);
  const contacts=data.contacts.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&(!skill||c.skill===skill)&&
   (!evalCode||c.evaluation===evalCode)&&(!player||c.player?.toLocaleLowerCase('es')===player)&&
   (!start||c.fields.startZone?.code===start.code)&&(!end||c.fields.endZone?.code===end.code)&&
   (f.video!==true||c.video));
  const chains=data.chains.filter(c=>candidates.has(c.rallyKey)&&(!target||c.team===target)&&(!setter||c.setter.player?.toLocaleLowerCase('es')===setter));
  // A setter + action combination must match one possession, not two unrelated
  // contacts inside the same rally. Action filters themselves match ONE contact.
  const allowedPossessions=setter?new Set(chains.map(c=>c.possessionKey)):null;
  const matchingContacts=allowedPossessions?contacts.filter(c=>allowedPossessions.has(c.possessionKey)):contacts;
  const chosen=new Set(actionFiltered?matchingContacts.map(c=>c.rallyKey):setter?chains.map(c=>c.rallyKey):rallyBase.map(r=>r.key));
  const rallies=rallyBase.filter(r=>chosen.has(r.key));
  const keys=new Set(rallies.map(r=>r.key));
  return {rallies,contacts:matchingContacts.filter(c=>keys.has(c.rallyKey)),possessions:data.possessions.filter(p=>keys.has(p.rallyKey)&&(!target||p.team===target)&&(!allowedPossessions||allowedPossessions.has(p.key))),
   chains:chains.filter(c=>keys.has(c.rallyKey)),target,filters:f};
 }
 function evaluate(contacts,skill='A'){
  const rows=arr(contacts).filter(c=>c.skill===skill),rated=rows.filter(c=>c.evaluation),kills=rated.filter(c=>c.evaluation==='#').length,
   errors=rated.filter(c=>c.evaluation==='=').length,blocked=rated.filter(c=>c.evaluation==='/').length;
  return {recorded:rows.length,rated:rated.length,missing:rows.length-rated.length,kills,errors,blocked,
   killPct:pct(kills,rated.length),efficiency:skill==='A'?pct(kills-errors-blocked,rated.length):null};
 }
 function points(rows,teamId){
  const target=team(teamId);if(!target)return null;
  const valid=arr(rows).filter(r=>r.closed),k1=valid.filter(r=>r.serving&&r.serving!==target),k2=valid.filter(r=>r.serving===target);
  const calc=list=>({n:list.length,won:list.filter(r=>r.winner===target).length,pct:pct(list.filter(r=>r.winner===target).length,list.length)});
  return {closed:valid.length,unknownServe:valid.filter(r=>!r.serving).length,k1:calc(k1),k2:calc(k2)};
 }
 function coverage(data){
  const all=data.contacts,bySkill=[];
  for(const s of ['S','R','E','A','B','D']){
   const rows=all.filter(c=>c.skill===s),n=rows.length;
   const properties={team:rows.filter(c=>c.team).length,player:rows.filter(c=>c.player).length,evaluation:rows.filter(c=>c.evaluation).length,
    zone:rows.filter(c=>c.fields.contactZone||c.fields.startZone||c.fields.endZone||(s==='E'&&c.fields.setTarget)).length,
    video:rows.filter(c=>c.video).length};
   if(s==='E'){properties.tempo=rows.filter(c=>c.fields.tempo).length;properties.target=rows.filter(c=>c.fields.setTarget).length;}
   if(s==='A'){properties.direction=rows.filter(c=>c.fields.direction).length;properties.attackTempo=rows.filter(c=>c.fields.attackTempo).length;}
   bySkill.push({skill:s,n,properties});
  }
  return {bySkill,missingIDs:data.contacts.filter(c=>!c.nativeId).length,unknownTeams:data.contacts.filter(c=>!c.team).length,
   invalidValues:data.issues.filter(i=>['invalid-zone','unknown-evaluation','unknown-skill','duplicate-action','duplicate-rally','duplicate-set'].includes(i.type)).length};
 }
 function reconcile(data,legacy,teamId){
  const target=team(teamId),ours=points(data.rallies,target),previous=legacy?.points;
  if(!ours||!previous)return null;
  return {oldK1:previous.k1?.n,newK1:ours.k1.n,oldK2:previous.k2?.n,newK2:ours.k2.n,
   agrees:previous.k1?.n===ours.k1.n&&previous.k2?.n===ours.k2.n,
   note:'La comparación es de denominadores, no sustituye los cálculos oficiales.'};
 }
 function csvEscape(x){let text=val(x);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(text.trim()))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
 function toCSV(data){const header=['Partido','Set','Rally','ID rally estable','Posesión','Acción','ID acción estable','Equipo','Fundamento','Jugador','Evaluación','Zona origen','Zona destino','Zona contacto','Destino E','Tempo E','Combinación','Referencia vídeo'];
  const rByKey=new Map(data.rallies.map(r=>[r.key,r]));
  const rows=data.contacts.map(c=>{const r=rByKey.get(c.rallyKey);return [data.matchId,c.set,c.rallyIndex,r?.nativeId||'',c.possessionKey||'',c.actionIndex+1,c.nativeId||'',c.team||'',c.skill||c.skillRaw,c.player||'',c.evaluation||'',c.fields.startZone?.code||'',c.fields.endZone?.code||'',c.fields.contactZone?.code||'',c.fields.setTarget?.code||'',c.fields.tempo,c.fields.combo,c.video?'Sí':'No']});
  return '\ufeff'+[header,...rows].map(row=>row.map(csvEscape).join(';')).join('\r\n');
 }
 function panelHTML(data,selection,legacy){
  const c=coverage(data),stats=evaluate(selection.contacts),comparison=reconcile({rallies:selection.rallies},legacy,selection.target);
  const rows=c.bySkill.map(row=>`<tr><td><b>${esc(row.skill)}</b></td><td>${row.n}</td><td>${row.properties.team}/${row.n}</td><td>${row.properties.player}/${row.n}</td><td>${row.properties.evaluation}/${row.n}</td><td>${row.properties.zone}/${row.n}</td><td>${row.properties.video}/${row.n}</td></tr>`).join('');
  const chains=selection.chains.slice(-45).reverse().map(link=>`<tr><td>${esc(link.setter.set)} · ${esc(link.setter.rallyIndex)}</td><td>${esc(link.setter.player||'—')}</td><td>${esc(link.reception?.evaluation||'—')}</td><td>${esc(link.target?.code||'—')}</td><td>${esc(link.tempo||'—')}</td><td>${esc(link.attack?.player||'Sin ataque')}</td><td>${esc(link.attack?.evaluation||'—')}</td></tr>`).join('');
  return {left:`<div class="vc1938-audit"><h3>Professional Data Engine · Contactos</h3><p>Modelo común de solo lectura. Los contactos sin equipo o valoración se mantienen como desconocidos, sin asignaciones automáticas.</p><div class="vc1938-filters"><label>Fundamento<select data-vc1938-filter="skill"><option value="">Todos</option>${['S','R','E','A','B','D','F','C'].map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label><label>Valoración<select data-vc1938-filter="evaluation"><option value="">Todas</option>${['#','+','!','-','/','='].map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${selection.rallies.length}</strong>rallies filtrados</span><span><strong>${selection.contacts.length}</strong>contactos filtrados</span><span><strong>${selection.possessions.length}</strong>posesiones</span><span><strong>${selection.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${rows}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
   center:`<div class="vc1938-audit"><h3>Posesión → colocación → ataque</h3><p>Solo se emparejan contactos consecutivos del mismo equipo; un contacto rival o sin equipo separa posesiones.</p><div class="vc1938-scroll"><table><thead><tr><th>Set / rally</th><th>Colocador</th><th>Recep.</th><th>Destino</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${chains||'<tr><td colspan="7">No hay colocaciones en esta selección.</td></tr>'}</tbody></table></div><div class="vc1938-note">Ataques evaluados: ${stats.rated}/${stats.recorded}; EFF ataque: ${stats.efficiency==null?'sin muestra':stats.efficiency+' %'}. ${comparison?(comparison.agrees?'K1/K2 coincide en número de oportunidades.':'Revisar diferencias de denominadores K1/K2 con el motor anterior.'):'Sin comparación disponible.'}</div></div>`,
   notice:`${data.count.rallies} rallies totales · ${data.count.closed} cerrados · ${c.unknownTeams} contactos sin equipo · ${c.missingIDs} contactos sin ID · ${c.invalidValues} incidencias de integridad · ${data.issues.length} observaciones`,
   badges:[['Rallies',data.count.rallies],['Contactos',data.count.contacts],['Posesiones',data.count.possessions],['Colocaciones',data.count.chains],['Rallies abiertos',data.count.rallies-data.count.closed]]
  };
 }
 function decorate(panel,ctx,tab){
  if(tab!=='data'||!ctx?.match)return;
  const original=ctx.match,api=panel.ownerDocument.defaultView?.VC_DATA_ENGINE_1938;
  const data=api?.normalize(original);if(!data)return;
  const state=panel._vc1938||{skill:'',evaluation:''};
  const f={team:ctx.team,set:ctx.set,rotation:ctx.rotation,phase:ctx.phase,skill:state.skill,evaluation:state.evaluation};
  const selection=filter(data,f),visual=panelHTML(data,selection,ctx.data);
  const left=panel.querySelector('.vc1937-left-body'),center=panel.querySelector('.vc1937-courtbody');
  if(!left||!center)return;
  left.innerHTML=visual.left;center.innerHTML=visual.center;
  const leftHead=panel.querySelector('.vc1937-left>header strong');if(leftHead)leftHead.textContent='AUDITORÍA DE CONTACTOS';
  const centerHead=panel.querySelector('.vc1937-center>header strong');if(centerHead)centerHead.textContent='POSESIONES Y SECUENCIAS';
  const reset=panel.querySelector('.vc1937-center>header [data-vc1937-reset]');if(reset)reset.hidden=true;
  const legacyHint=panel.querySelector('.vc1937-details-hint');if(legacyHint)legacyHint.hidden=true;
  const timeline=panel.querySelector('.vc1937-timeline');if(timeline)timeline.hidden=true;
  const metrics=panel.querySelector('.vc1937-kpis');if(metrics)metrics.innerHTML=visual.badges.map(([k,n])=>`<div class="vc1937-kpi"><span>${esc(k)}</span><strong>${n}</strong></div>`).join('');
  const note=panel.querySelector('.vc1937-courtnote');if(note)note.textContent=visual.notice;
  for(const select of panel.querySelectorAll('[data-vc1938-filter]'))select.value=state[select.dataset.vc1938Filter]||'';
  const matching=new Set(selection.rallies.map(r=>`${r.set}:${r.nativeId}`));
  const mapped=ctx.data.rallies.filter(r=>matching.has(`${r.set}:${r.id}`));
  panel._vc1937VisibleRallies=mapped;
  const list=panel.querySelector('.vc1937-rallies');if(list){
   list.innerHTML=mapped.slice(-100).reverse().map(r=>`<button type="button" class="vc1937-rally" data-vc1937-rally="${esc(r.set+':'+r.id)}" role="option" aria-selected="false"><b>S${r.set} · #${r.index}</b><span>${esc(r.winning||'Sin ganador')}</span></button>`).join('')||'<p class="vc1937-empty">Sin rallies con estos filtros o sin ID estable.</p>';
   panel.querySelector('.vc1937-rally-count').textContent=`${mapped.length} rallies con referencia original`;
  }
  panel._vc1938={...state,data,ctx,selection};
  if(!panel.dataset.vc1938Bound){
   panel.dataset.vc1938Bound='yes';
   panel.addEventListener('change',event=>{
    const el=event.target;if(!el?.dataset?.vc1938Filter)return;
    const s=panel._vc1938;if(!s)return;s[el.dataset.vc1938Filter]=el.value;decorate(panel,s.ctx,'data');
   });
   panel.addEventListener('click',event=>{
    const b=event.target.closest?.('[data-vc1938-export]');if(!b)return;
    const s=panel._vc1938;if(!s)return;
    const source=toCSV({...s.data,contacts:s.selection.contacts}),win=panel.ownerDocument.defaultView;
    const blob=new win.Blob([source],{type:'text/csv;charset=utf-8'});
    const url=win.URL.createObjectURL(blob),link=panel.ownerDocument.createElement('a');link.href=url;link.download='volley-coach-contactos-'+s.data.matchId.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';
    panel.ownerDocument.body.append(link);link.click();link.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
   });
  }
 }
 return {VERSION,SKILLS,EVALS,zone,team,normalize,filter,evaluate,points,coverage,reconcile,toCSV,panelHTML,decorate};
});
