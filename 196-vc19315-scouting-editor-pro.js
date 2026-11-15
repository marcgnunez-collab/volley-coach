/* Volley Coach V19.3.15 · Scouting Editor Pro
 * Edits the ORIGINAL scouting actions; no parallel store, scoring, or sync engine.
 * The review-player time mark is source-specific and never rewrites scoutMs.
 */
(function(root,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){root.VC_SCOUTING_EDITOR_19315=api;if(root.document)api.install(root);}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.16',SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const EVALS=['#','+','!','-','/','='];
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const copy=x=>JSON.parse(JSON.stringify(x));
 const same=(a,b)=>String(a)===String(b);
 const editableFields=['code','team','playerId','playerLabel','playerNumberSnapshot','playerNameSnapshot','skill','evaluation','startZone','endZone','contactZone','setTarget','setTempo','setterCall','dvSetType','attackTempo','attackDirection','attackCombo','attackCode','blockers','phase','videoExactTime','videoExactSourceKey'];
 const signature=actions=>JSON.stringify(arr(actions).map(a=>[a?.id,...editableFields.map(k=>a?.[k]??null)]));
 function locate(match,ref){
  if(!match||!ref||!same(match.id,ref.matchId))return {error:'Partido distinto del seleccionado.'};
  const si=Number(ref.setIndex),ri=Number(ref.rallyIndex);
  if(!Number.isInteger(si)||si<0||!Number.isInteger(ri)||ri<0)return {error:'Referencia del rally incompleta.'};
  const set=arr(match.sets)[si],rally=arr(set?.rallies)[ri];
  if(!set||!rally||!same(set.number,ref.set)||!same(rally.id,ref.rallyId))return {error:'El rally se ha movido o sustituido. Vuelve a seleccionarlo.'};
  return {set,rally};
 }
 function reference(match,projectionRally){
  if(!match||!projectionRally||projectionRally.nativeId==null)return null;
  const p=projectionRally.provenance;
  const set=arr(match.sets)[p?.setIndex],rally=arr(set?.rallies)[p?.rallyIndex];
  if(!rally||!same(rally.id,projectionRally.nativeId)||!same(set?.number,projectionRally.set))return null;
  return {matchId:String(match.id),setIndex:p.setIndex,rallyIndex:p.rallyIndex,set:projectionRally.set,rallyId:String(rally.id)};
 }
 function parseCode(win,raw,old,match){
  const code=str(raw).toUpperCase().replace(/\s+/g,'');
  if(!code)return {error:'No puede guardarse una acción con código vacío.'};
  const parser=win?.VC_SCOUT_CORE?.parse||win?.v680ParseCode;
  if(typeof parser!=='function')return {error:'El parser de scouting no está disponible.'};
  try{const value=parser(code,match,old||null);if(value?.error||!value?.action)return {error:value?.error||'Código no reconocido.'};return {action:value.action};}
  catch(e){return {error:'Código inválido: '+String(e?.message||e)};}
 }
 const advancedFields={E:['setTarget','setTempo','setterCall','dvSetType'],A:['attackCombo','attackTempo','attackDirection','attackCode','blockers','dvSetType']};
 const allowed={setTarget:['','Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'],attackCombo:['','Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'],
  setTempo:['','Q','U','T','M','H','O'],attackTempo:['','Q','U','T','M','H','O'],attackDirection:['','LIN','DC','DL'],blockers:['','0','1','2','3'],dvSetType:['','F','C','B','P','S']};
 const captions={setTarget:'Destino colocación',setTempo:'Tempo colocación',setterCall:'Código colocador',dvSetType:'Tipo de colocación/ataque',attackCombo:'Combinación ataque',attackTempo:'Tempo ataque',attackDirection:'Dirección ataque',attackCode:'Código ataque',blockers:'Bloqueadores'};
 function applyAdvanced(win,action,patch){
  if(!patch||!Object.keys(patch).length)return {action};
  const permitted=advancedFields[action.skill]||[];
  const next={...action};
  for(const [key,raw] of Object.entries(patch)){
   if(!permitted.includes(key))return {error:'El campo '+key+' no corresponde al fundamento '+action.skill+'.'};
   const value=str(raw).toUpperCase();
   if(allowed[key]){if(!allowed[key].includes(value))return {error:'Valor no válido para '+key+'.'};}
   else if(!/^[A-Z0-9]{0,6}$/.test(value))return {error:'El código '+key+' solo admite hasta 6 letras o números.'};
   next[key]=value;
  }
  try{if(typeof win?.scoutBuildCode!=='function')return {error:'No está disponible el generador oficial de códigos.'};next.code=win.scoutBuildCode(next);}
  catch(e){return {error:String(e?.message||e)}}
  return {action:next};
 }
 function validateDraft(win,match,original,draft){
  if(!Array.isArray(draft)||draft.length>300)return {error:'Número de acciones no permitido (máximo 300).'};
  const ids=new Set(),out=[];
  for(const [i,item] of draft.entries()){
   const old=item.originIndex==null?null:arr(original)[item.originIndex];
   if(item.originIndex!=null&&(!old||!same(item.originId,old.id)))return {error:'La identidad de la acción '+(i+1)+' ha cambiado.'};
   const changed=!old||str(item.code).toUpperCase()!==str(old.code).toUpperCase()||Object.keys(item.advanced||{}).length>0;
   let next;
   if(changed){const parsed=parseCode(win,item.code,old,match);if(parsed.error)return {error:'Acción '+(i+1)+': '+parsed.error};next={...(old||{}),...parsed.action};}
   else next={...old};
   const adv=applyAdvanced(win,next,item.advanced);if(adv.error)return {error:'Acción '+(i+1)+': '+adv.error};next=adv.action;
   // Never give a new action a fabricated scout clock or video reference.
   if(!old){next.id=item.newId;next.createdAt=item.createdAt;next.scoutMs=null;next.videoTime=null;next.videoTimestamp=null;next.videoAction=null;next.videoExactTime=null;next.videoExactSourceKey=null;}
   else{
    next.id=old.id;next.createdAt=old.createdAt;
    // Parser must not remap old video evidence or its original timestamp.
    for(const key of ['scoutMs','videoTime','videoTimestamp','videoAction','videoStart','videoEnd','videoSource','liveVideoTime','liveVideoSessionId','liveVideoLinkedAt','videoExactTime','videoExactSourceKey','videoExact','clipId','uid']){
     if(Object.prototype.hasOwnProperty.call(old,key))next[key]=old[key];else delete next[key];
    }
   }
   if(item.videoMark){next.videoExactTime=item.videoMark.time;next.videoExactSourceKey=item.videoMark.sourceKey;next.videoTimestamp=item.videoMark.time;next.videoExact=true;}
   if(ids.has(String(next.id)))return {error:'Identificadores de acción repetidos.'};ids.add(String(next.id));
   next.seq=i+1;out.push(next);
  }
  return {actions:out};
 }
 function draftFrom(actions){return arr(actions).map((a,i)=>({originIndex:i,originId:a.id,code:str(a.code),advanced:{},videoMark:null}));}
 function scoreGuard(before,after){
  for(const k of ['scoreBefore','scoreAfter','winner','servingBefore','rotationBefore','opponentRotationBefore','scoutStartMs','scoutEndMs','liveVideoSessionId','liveVideoStart','liveVideoEnd']){
   if(JSON.stringify(before[k])!==JSON.stringify(after[k]))return false;
  }return true;
 }
 function newActionId(draft,stamp){const used=new Set(arr(draft).map(d=>String(d.originId??d.newId)));let id=stamp;while(used.has(String(id)))id++;return id;}
 function stats(model,team){const contacts=arr(model?.contacts).filter(c=>!team||c.team===team);const attacks=contacts.filter(c=>c.skill==='A');const rated=attacks.filter(c=>c.evaluation);const k=rated.filter(c=>c.evaluation==='#').length,e=rated.filter(c=>['=','/'].includes(c.evaluation)).length;
  const closed=arr(model?.rallies).filter(r=>r.closed),k1=closed.filter(r=>r.serving&&r.serving!==team),k2=closed.filter(r=>r.serving===team);
  return {actions:contacts.length,attacks:attacks.length,kills:k,attackErrors:e,efficiency:rated.length?Math.round(1000*(k-e)/rated.length)/10:null,
   k1:{won:k1.filter(r=>r.winner===team).length,total:k1.length},k2:{won:k2.filter(r=>r.winner===team).length,total:k2.length}};
 }
 function calculate(win,match,team){return stats(win?.VC_DATA_ENGINE_1938?.normalize?.(match),team||'ours');}
 function exactMark(win,match){
  const review=win?.VC_VIDEO_REVIEW_API,diag=win?.v780Diagnostics?.();
  if(!review?.loaded?.()||!diag||!same(diag.match,match?.id)||!same(diag.fileMatchId,match?.id))return {error:'Carga en Video Review una grabación del mismo partido.'};
  const sourceKey=str(match?.video?.sourceKey),position=review.currentTime?.();
  if(!sourceKey||!Number.isFinite(position)||position<0)return {error:'No hay una fuente de vídeo identificada o tiempo válido.'};
  return {time:Math.round(position*1000)/1000,sourceKey};
 }
 function videoTime(action,match,legacy){
  const t=action?.videoExactTime,k=str(action?.videoExactSourceKey);
  return t!=null&&Number.isFinite(Number(t))&&Number(t)>=0&&k&&k===str(match?.video?.sourceKey)?Number(t):legacy;
 }
 let work=null,busy=false,winRef=null;
 const active=win=>win?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null;
 function getCurrent(){const m=active(winRef);if(!work||!m||!same(m.id,work.ref.matchId))return {error:'El partido activo ha cambiado. No se guardará.'};if(str(m.status)==='finished')return {error:'Reabre el scouting finalizado desde Gestión antes de editar.'};const found=locate(m,work.ref);if(found.error)return found;
  if(signature(found.rally.actions)!==work.initialSignature)return {error:'El rally cambió desde que se abrió el editor. Ciérralo y vuelve a abrirlo para evitar sobrescribir cambios.'};
  if(str(m.updatedAt||'')!==str(work.revision||''))return {error:'El partido ha cambiado mientras editabas. Reabre el rally y comprueba los datos antes de guardar.'};
  if(!scoreGuard(work.protectedRally,found.rally))return {error:'El marcador o el reloj del rally cambió. Reabre para no sobrescribirlo.'};return {...found,match:m};
 }
 function getModal(){return winRef?.document?.getElementById('vc19315-modal')}
 function note(value,error=false){const n=getModal()?.querySelector('[data-vc19315-note]');if(n){n.textContent=value;n.classList.toggle('is-error',error)}}
 function renderRows(){const modal=getModal();if(!modal||!work)return;const list=modal.querySelector('[data-vc19315-actions]');if(!list)return;
  list.innerHTML=work.draft.map((a,i)=>`<div class="vc19315-action${i===work.selected?' selected':''}" data-vc19315-index="${i}"><span class="vc19315-idx">${i+1}</span><input aria-label="Código de acción ${i+1}" data-vc19315-code="${i}" spellcheck="false" maxlength="100" value="${esc(a.code)}"><button type="button" data-vc19315-cmd="pick" data-index="${i}">Avanzado</button><button type="button" data-vc19315-cmd="up" data-index="${i}" title="Subir acción" ${i===0?'disabled':''}>↑</button><button type="button" data-vc19315-cmd="down" data-index="${i}" title="Bajar acción" ${i===work.draft.length-1?'disabled':''}>↓</button><button type="button" data-vc19315-cmd="delete" data-index="${i}" title="Quitar acción">×</button>${a.videoMark?'<small>Vídeo '+a.videoMark.time.toFixed(2)+' s</small>':''}</div>`).join('')||'<p>Este rally no tiene acciones. Añade un código si necesitas reconstruirlo.</p>';
  renderAdvanced();
 }
 function renderAdvanced(){const panel=getModal()?.querySelector('[data-vc19315-advanced]');if(!panel||!work)return;const item=work.draft[work.selected];if(!item){panel.innerHTML='<span>Selecciona un contacto para editar los detalles técnicos.</span>';return;}
  const parsed=parseCode(winRef,item.code,arr(work.original)[item.originIndex]||null,active(winRef));
  if(parsed.error){panel.textContent='Corrige el código para activar los campos técnicos: '+parsed.error;return;}
  const action=parsed.action,fields=advancedFields[action.skill]||[];
  panel.innerHTML=`<div class="vc19315-advanced-title"><strong>Contacto ${work.selected+1} · ${esc(SKILLS[action.skill]||action.skill)}</strong><button type="button" data-vc19315-cmd="video">Usar fotograma actual</button></div><p>La marca de vídeo se aplica solo al archivo o grabación actual; el tiempo original del scouting se conserva.</p>`+
   (fields.length?`<div class="vc19315-fields">${fields.map(k=>{const current=item.advanced?.[k]??action[k]??'';return `<label>${esc(captions[k]||k)}${allowed[k]?`<select data-vc19315-field="${esc(k)}">${allowed[k].map(v=>`<option value="${esc(v)}"${v===String(current)?' selected':''}>${esc(v||'—')}</option>`).join('')}</select>`:`<input data-vc19315-field="${esc(k)}" maxlength="6" value="${esc(current)}">`}</label>`}).join('')}</div>`:'<p>Este fundamento no dispone de campos avanzados específicos.</p>');
  panel.insertAdjacentHTML('beforeend',winRef?.VC_SMART_SCOUTING_19316?.editorPanel?.(work,action)||'');
 }
 function show(){const modal=getModal();if(!modal||!work)return;const m=active(winRef);modal.hidden=false;modal.setAttribute('aria-hidden','false');modal.querySelector('[data-vc19315-title]').textContent=`Scouting Editor Pro · Set ${work.ref.set} / Rally ${work.ref.rallyIndex+1}`;
  modal.querySelector('[data-vc19315-cmd="save"]')?.removeAttribute('disabled');
  const s=work.score,desc=[`Marcador ${s.before?.us??'—'}–${s.before?.opponent??'—'} → ${s.after?.us??'—'}–${s.after?.opponent??'—'}`,`Ganador: ${s.winner==='ours'?'nuestro':s.winner==='opponent'?'rival':'sin registrar'}`,`Rotación R${s.rotation??'—'}`];modal.querySelector('[data-vc19315-context]').textContent=desc.join(' · ')+' · puntuación bloqueada';
  renderRows();const data=calculate(winRef,m,work.team);modal.querySelector('[data-vc19315-stats]').textContent=`Ataques: ${data.attacks} · Kills: ${data.kills} · EFF: ${data.efficiency??'—'} % · K1: ${data.k1.won}/${data.k1.total} · K2: ${data.k2.won}/${data.k2.total}`;
  note('Edición local del rally original. Guarda para recalcular las estadísticas.');
 }
 function open(win,match,projectionRally,contactKey=null,team='ours'){
  winRef=win;const ref=reference(match,projectionRally);
  if(!ref)return {ok:false,error:'Este rally no tiene una referencia verificable para editar.'};
  if(!same(active(win)?.id,match.id))return {ok:false,error:'Activa este partido desde Gestión de scoutings antes de editarlo. No se modificará otro partido.'};
  if(str(match.status)==='finished')return {ok:false,error:'Reabre el scouting finalizado desde Gestión para poder editarlo.'};
  const found=locate(match,ref);if(found.error)return {ok:false,error:found.error};
  const original=copy(arr(found.rally.actions));let selected=0;
  if(contactKey){const c=projectionRally.contacts?.find(c=>c.key===contactKey);if(c){const ix=c.source.actionIndex;if(same(original[ix]?.id,c.nativeId))selected=ix;}}
  work={ref,initialSignature:signature(found.rally.actions),protectedRally:copy(found.rally),original,draft:draftFrom(original),selected,team,score:{before:copy(found.rally.scoreBefore||{}),after:copy(found.rally.scoreAfter||{}),winner:found.rally.winner,rotation:found.rally.rotationBefore},revision:match.updatedAt||''};
  show();return {ok:true};
 }
 function close(){if(busy)return;const modal=getModal();if(modal){modal.hidden=true;modal.setAttribute('aria-hidden','true')}work=null;}
 async function commit(){if(busy||!work)return {ok:false,error:'No hay una edición disponible.'};const cur=getCurrent();if(cur.error)return {ok:false,error:cur.error};
  const validated=validateDraft(winRef,cur.match,work.original,work.draft);if(validated.error)return {ok:false,error:validated.error};
  const before=copy(cur.rally),pre=calculate(winRef,cur.match,work.team);busy=true;
  try{
   // Best-effort checkpoint BEFORE mutation, using the pre-existing recovery system.
   if(typeof winRef.scoutV680Backup==='function')await winRef.scoutV680Backup('before-v19315-edit',true);
   const again=getCurrent();if(again.error)return {ok:false,error:again.error};
   const time=new Date().toISOString();
   again.rally.actions=validated.actions;again.rally.editedAt=time;again.rally.editCount=(Number(again.rally.editCount)||0)+1;again.match.updatedAt=time;
   if(!scoreGuard(before,again.rally))throw Error('Se ha alterado información protegida del marcador.');
   try{const save=winRef.VC_SCOUT_VIDEO_BRIDGE?.save;if(typeof save!=='function')throw Error('Motor de guardado no disponible.');const result=await Promise.resolve(save.call(winRef.VC_SCOUT_VIDEO_BRIDGE));if(result===false)throw Error('El guardado devolvió un error.');}
   catch(err){again.rally.actions=before.actions;again.rally.editedAt=before.editedAt;again.rally.editCount=before.editCount;again.match.updatedAt=work.revision;throw err;}
   try{await winRef.scoutV902Flush?.()}catch(err){/* Local save already succeeded. Never report cloud upload success. */winRef.console?.warn?.('V19.3.15: flush pendiente',err)}
   const post=calculate(winRef,again.match,work.team);
   work=null;const modal=getModal();if(modal){modal.hidden=true;modal.setAttribute('aria-hidden','true')}
   try{winRef.v910InvalidateMatchCaches?.();winRef.v900Render?.();winRef.scoutRender?.();winRef.v780Render?.();winRef.VC_PRO_ANALYSIS_19310_STATE?.refresh?.();winRef.VC_VIDEO_SCORE_19312_STATE?.refresh?.();}catch(_){}
   const out={ok:true,before:pre,after:post,savedLocally:true};winRef.document?.dispatchEvent(new winRef.CustomEvent('vc19315:edited',{detail:{matchId:String(again.match.id),set:Number(again.set.number),rallyId:String(again.rally.id),before:pre,after:post}}));return out;
  }catch(e){return {ok:false,error:String(e?.message||e)}}finally{busy=false}
 }
 function onClick(event){const b=event.target.closest?.('[data-vc19315-cmd], [data-vc19316-grade], [data-vc19316-zone], [data-vc19316-mode]');if(!b)return;const cmd=b.dataset.vc19315Cmd;event.preventDefault();
  if(cmd==='close'){close();return;}if(!work||busy)return;
  const smart=winRef?.VC_SMART_SCOUTING_19316?.editorAction?.({button:b,work,win:winRef,parseCode});
  if(smart?.handled){if(smart.changed)renderRows();if(smart.error)note(smart.error,true);else if(smart.changed)note('Cambio aplicado al borrador; confirma con Guardar.');return;}
  const i=Number(b.dataset.index);
  if(cmd==='pick'&&Number.isInteger(i)){work.selected=i;work.vc19316Mode=null;renderRows();return;}
  if(cmd==='delete'&&Number.isInteger(i)){work.draft.splice(i,1);work.selected=Math.max(0,Math.min(work.selected,work.draft.length-1));renderRows();return;}
  if((cmd==='up'||cmd==='down')&&Number.isInteger(i)){const to=i+(cmd==='up'?-1:1);if(to<0||to>=work.draft.length)return;const [x]=work.draft.splice(i,1);work.draft.splice(to,0,x);work.selected=to;renderRows();return;}
  if(cmd==='add'){const input=getModal().querySelector('[data-vc19315-new]'),code=str(input?.value);if(!code)return;const result=parseCode(winRef,code,null,active(winRef));if(result.error){note(result.error,true);return;}
   const id=newActionId(work.draft,Date.now()+Math.floor(Math.random()*1000));work.draft.push({originIndex:null,originId:null,newId:id,createdAt:new Date().toISOString(),code,advanced:{},videoMark:null});work.selected=work.draft.length-1;work.vc19316Mode=null;input.value='';renderRows();note('Acción añadida al borrador, sin marca de tiempo inventada.');return;}
  if(cmd==='video'){const d=getCurrent();if(d.error){note(d.error,true);return;}const mark=exactMark(winRef,d.match);if(mark.error){note(mark.error,true);return;}const item=work.draft[work.selected];if(!item)return;item.videoMark=mark;renderRows();note('Fotograma vinculado a '+mark.sourceKey+' · '+mark.time.toFixed(3)+' s. Guarda para aplicar.');return;}
  if(cmd==='save'){b.disabled=true;commit().then(out=>{if(!out.ok){note(out.error,true);b.disabled=false;}else{const s=winRef?.document?.querySelector('#vc19314-status');if(s)s.textContent=`Rally corregido. Ataque EFF: ${out.before.efficiency??'—'} % → ${out.after.efficiency??'—'} %. Estadísticas recalculadas desde el scouting.`;}}).catch(e=>{note(String(e),true);b.disabled=false});return;}
 }
 function install(win){winRef=win;const doc=win.document;if(doc.getElementById('vc19315-modal'))return;
  const node=doc.createElement('section');node.id='vc19315-modal';node.className='vc19315-modal';node.hidden=true;node.setAttribute('aria-hidden','true');node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label','Scouting Editor Pro');
  node.innerHTML=`<div class="vc19315-dialog"><header><div><small>VOLLEY COACH · V${VERSION}</small><h2 data-vc19315-title>Scouting Editor Pro</h2><p data-vc19315-context></p></div><button type="button" data-vc19315-cmd="close" aria-label="Cerrar editor">×</button></header><div class="vc19315-body"><div class="vc19315-help">Corrige un código, reordena, elimina o añade contactos. Las puntuaciones y rotaciones permanecen bloqueadas.</div><div class="vc19315-actions" data-vc19315-actions></div><div class="vc19315-insert"><input data-vc19315-new maxlength="100" placeholder="Nuevo código de scouting"><button type="button" data-vc19315-cmd="add">Añadir</button></div><section class="vc19315-advanced" data-vc19315-advanced></section><p class="vc19315-stats" data-vc19315-stats></p><p class="vc19315-message" data-vc19315-note role="status"></p></div><footer><button type="button" data-vc19315-cmd="close">Cancelar</button><button type="button" class="primary" data-vc19315-cmd="save">Guardar y recalcular</button></footer></div>`;
  doc.body.append(node);node.addEventListener('click',onClick);node.addEventListener('input',e=>{const target=e.target,idx=target.dataset?.vc19315Code;if(idx!==undefined&&work?.draft[Number(idx)]){target.value=target.value.toUpperCase();work.draft[Number(idx)].code=target.value;return;}if(target.dataset?.vc19315Field!==undefined&&work?.draft[work.selected]){work.draft[work.selected].advanced[target.dataset.vc19315Field]=target.value.toUpperCase();}});
  node.addEventListener('change',e=>{const t=e.target;if(t.dataset?.vc19315Field!==undefined&&work?.draft[work.selected])work.draft[work.selected].advanced[t.dataset.vc19315Field]=t.value.toUpperCase();});
  node.addEventListener('click',e=>{if(e.target===node)close()});
  doc.addEventListener('keydown',e=>{if(getModal()?.hidden)return;
   const quick=winRef?.VC_SMART_SCOUTING_19316?.keyboard?.({event:e,work,win:winRef,parseCode});
   if(quick?.handled){e.preventDefault();if(quick.changed)renderRows();if(quick.error)note(quick.error,true);if(quick.focus){getModal()?.querySelector(`[data-vc19315-code="${work.selected}"]`)?.focus?.();}return;}
   if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();node.querySelector('[data-vc19315-cmd="save"]')?.click();}else if(e.key==='Enter'&&e.target?.matches?.('[data-vc19315-new]')){e.preventDefault();node.querySelector('[data-vc19315-cmd="add"]')?.click();}});
 }
 function handleAnalysisClick(win,button,{ctx,projection,node,state}={}){
  const contactKey=button?.dataset?.vc19315EditContact,command=button?.dataset?.vc19315Open;
  if(contactKey===undefined&&command===undefined)return {handled:false};
  const contact=arr(projection?.base?.contacts).find(c=>c.key===contactKey);
  const rally=contact?arr(projection?.base?.rallies).find(r=>r.key===contact.rallyKey):arr(projection?.base?.rallies).find(r=>r.key===state?.selected);
  const result=open(win,ctx?.match,rally,contact?.key,ctx?.team||'ours');
  if(!result.ok){const status=node?.querySelector('#vc19314-status');if(status)status.textContent=result.error;}
  return {handled:true};
 }
 return Object.freeze({VERSION,reference,locate,signature,parseCode,applyAdvanced,validateDraft,draftFrom,scoreGuard,stats,calculate,exactMark,videoTime,open,close,commit,install,handleAnalysisClick});
});
