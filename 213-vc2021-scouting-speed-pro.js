/* Volley Coach V20.2.1 · Scouting Speed Pro, with V20.5.32 typed draft bridge.
 * An input-only enhancement to the existing code entry fields and court.
 * Never submits actions, changes points, saves matches or writes to cloud.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){
  if(root.VC_SCOUT_SPEED_2021)return;
  root.VC_SCOUT_SPEED_2021=api;
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});
  else api.boot();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.2.1';
 const SKILLS=Object.freeze([['S','Saque'],['R','Recepción'],['E','Colocación'],['A','Ataque'],['B','Bloqueo'],['D','Defensa'],['F','Freeball'],['C','Control']]);
 const EVALS=Object.freeze(['#','+','!','-','/','=']);
 const INPUTS=Object.freeze([{input:'v800-code',team:'v800-code-team',number:'v800-code-number',keyboard:'vc1645-direct'},
  {input:'v113-video-code',team:'v113-video-team-select',number:'v113-video-number',keyboard:'vc1645-video'}]);
 const CODE=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
 const VALID_START=/^[.:~^@|*%&?$]/;
 const doc=()=>root?.document;
 const byId=id=>doc()?.getElementById(id)||null;
 const text=x=>String(x??'');
 const clean=x=>text(x).trim().toUpperCase().replace(/\s+/g,'');
 const safeHtml=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let mounted=false,observer=null,revision=null,codeInputId='',recentIndex=-1,updates=0;
 const draftBridgeStats={accepted:0,classic:0,differences:0,errors:0};
 const stats={skillEdits:0,ratingEdits:0,repeats:0,undos:0,uppercases:0};
 function draftBridge(){
  const api=root?.VC_SCOUT_DRAFT_20532;
  return api?.VERSION==='20.5.32'&&api?.inputOnly===true?api:null;
 }
 // Always compare against the proven V20.2.1 result before using a typed value.
 // If Vite is absent, incomplete or disagrees, the classic input stays intact.
 function typedOrClassic(method,args,legacy){
  const result=legacy(),api=draftBridge();
  if(!api||typeof api[method]!=='function'){draftBridgeStats.classic++;return result;}
  try{
   const candidate=api[method](...args);
   if(JSON.stringify(candidate)===JSON.stringify(result)){
    draftBridgeStats.accepted++;return candidate;
   }
   draftBridgeStats.differences++;
  }catch(_){draftBridgeStats.errors++;}
  draftBridgeStats.classic++;return result;
 }
 function parseHeadLegacy(raw){
  const code=clean(raw),m=code.match(CODE);
  if(!m)return null;
  // Never rewrite unknown/malformed text following the recognized header.
  if(m[5]&&!VALID_START.test(m[5]))return null;
  return {code,side:m[1],number:m[2],skill:m[3],rating:m[4],tail:m[5]};
 }
 function contextPrefixLegacy(context){
  const number=text(context?.number||'').trim();
  if(!/^\d{1,3}$/.test(number))return null;
  if(context?.team!=='ours'&&context?.team!=='opponent')return null;
  return (context.team==='opponent'?'R':'')+number;
 }
 function applySkillLegacy(raw,skill,context){
  if(!SKILLS.some(x=>x[0]===skill))return null;
  const code=clean(raw);
  if(!code){const prefix=contextPrefixLegacy(context);return prefix?prefix+skill:null;}
  const head=parseHeadLegacy(code);if(!head)return null;
  return head.side+head.number+skill+(head.rating||'')+head.tail;
 }
 function applyRatingLegacy(raw,rating){
  if(!EVALS.includes(rating))return null;
  const head=parseHeadLegacy(raw);if(!head||!head.skill)return null;
  return head.side+head.number+head.skill+rating+head.tail;
 }
 function cycleRatingLegacy(raw,step=1){
  const head=parseHeadLegacy(raw);if(!head||!head.skill)return null;
  const i=EVALS.indexOf(head.rating);
  const next=EVALS[(i+(step>0?1:EVALS.length-1)+EVALS.length)%EVALS.length];
  return applyRatingLegacy(raw,next);
 }
 function recentCodesLegacy(match,limit=8){
  if(!match)return [];
  const result=[];
  const collect=list=>{
   for(let i=(Array.isArray(list)?list.length:0)-1;i>=0&&result.length<limit;i--){
    const code=clean(list[i]?.code);
    if(code.length<=140&&parseHeadLegacy(code)?.skill&&!result.includes(code))result.push(code);
   }
  };
  collect(match.liveRally?.actions);
  const sets=Array.isArray(match.sets)?match.sets:[];
  for(let si=sets.length-1;si>=0&&result.length<limit;si--){
   const rallies=Array.isArray(sets[si]?.rallies)?sets[si].rallies:[];
   for(let ri=rallies.length-1;ri>=0&&result.length<limit;ri--)collect(rallies[ri]?.actions);
  }
  return result;
 }
 function parseHead(raw){return typedOrClassic('parseHead',[raw],()=>parseHeadLegacy(raw));}
 function applySkill(raw,skill,context){return typedOrClassic('applySkill',[raw,skill,context],()=>applySkillLegacy(raw,skill,context));}
 function applyRating(raw,rating){return typedOrClassic('applyRating',[raw,rating],()=>applyRatingLegacy(raw,rating));}
 function cycleRating(raw,step=1){return typedOrClassic('cycleRating',[raw,step],()=>cycleRatingLegacy(raw,step));}
 function recentCodes(match,limit=8){return typedOrClassic('recentCodes',[match,limit],()=>recentCodesLegacy(match,limit));}
 function getMatch(){try{return root?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||root?.VC_SCOUT_REPORT_BRIDGE?.getActive?.()||null}catch(_){return null}}
 function active(){return !!byId('scout-match-mode')?.classList?.contains('active')}
 function isFinished(){return getMatch()?.status==='finished'}
 function focusedTarget(){return INPUTS.find(t=>byId(t.input)===doc()?.activeElement)||null}
 function mode(){return text(byId('v800-shell')?.dataset?.vc52Mode)}
 function visibleField(node){
  if(!node||!node.isConnected||node.disabled||node.readOnly)return false;
  return typeof node.getClientRects==='function'?!!node.getClientRects().length:true;
 }
 function selectedTarget(){
  const focused=focusedTarget();if(focused&&visibleField(byId(focused.input)))return focused;
  const first=mode()==='video'?INPUTS[1]:INPUTS[0],second=mode()==='video'?INPUTS[0]:INPUTS[1];
  return visibleField(byId(first.input))?first:visibleField(byId(second.input))?second:null;
 }
 function contextFor(target){return {team:byId(target.team)?.value,number:byId(target.number)?.value}}
 function canDraft(){return active()&&!!getMatch()&&!isFinished()}
 function notify(message,kind='info'){
  const node=byId('vc2021-status');if(!node)return;
  node.textContent=message;node.dataset.kind=kind;
 }
 function setDraft(target,value,reason){
  if(!target||!canDraft()){notify('Selecciona un partido activo antes de editar un borrador.','warning');return false;}
  const input=byId(target.input);if(!visibleField(input))return false;
  if(value==null){notify('Falta el dorsal o el código todavía no tiene un formato reconocido.','warning');return false;}
  const before=text(input.value);if(before===value){notify('El borrador ya tiene ese valor.');return true;}
  revision={matchId:text(getMatch()?.id),input:target.input,before,after:value};
  input.value=value;
  try{input.focus({preventScroll:true});input.setSelectionRange(value.length,value.length)}catch(_){input.focus?.()}
  input.dispatchEvent(new root.Event('input',{bubbles:true}));
  notify(`${reason} · ${value}. Pulsa Añadir o Enter para registrar.`, 'success');
  refresh();return true;
 }
 function changeSkill(skill){const target=selectedTarget();if(!target)return false;
  const input=byId(target.input);const changed=setDraft(target,applySkill(input?.value,skill,contextFor(target)),'Fundamento '+skill);
  if(changed)stats.skillEdits++;return changed;
 }
 function changeRating(rating){const target=selectedTarget();if(!target)return false;
  const changed=setDraft(target,applyRating(byId(target.input)?.value,rating),'Valoración '+rating);
  if(changed)stats.ratingEdits++;return changed;
 }
 function repeatCode(index=0){const target=selectedTarget();if(!target||!canDraft())return false;
  const codes=recentCodes(getMatch());const code=codes[index];
  if(!code){notify('No hay un código anterior válido en este partido.','warning');return false;}
  const changed=setDraft(target,code,'Código anterior recuperado');
  if(changed){recentIndex=index;stats.repeats++;}return changed;
 }
 function undoDraft(){const target=selectedTarget();const input=target&&byId(target.input);
  if(!canDraft()||!revision||!input||revision.input!==target.input||revision.matchId!==text(getMatch()?.id)||input.value!==revision.after){
   notify('No es posible deshacer: el borrador ha cambiado o pertenece a otro partido.','warning');return false;
  }
  const before=revision.before;revision=null;input.value=before;
  input.dispatchEvent(new root.Event('input',{bubbles:true}));
  try{input.focus({preventScroll:true});input.setSelectionRange(before.length,before.length)}catch(_){input.focus?.()}
  stats.undos++;notify('Última edición del borrador deshecha. No se ha cambiado el scouting.','success');refresh();return true;
 }
 function focusCode(){const target=selectedTarget();const input=target&&byId(target.input);
  if(!input){notify('Abre Código directo o Vídeo + scouting para escribir.','warning');return false;}
  try{input.focus({preventScroll:true})}catch(_){input.focus()}
  return true;
 }
 function focusCourt(){const board=byId('vc1613-board');const key=board?.querySelector?.('[data-zone]');
  if(!visibleField(board)||!key){notify('Abre la pista interactiva para elegir una zona.','warning');return false;}
  try{key.focus({preventScroll:true})}catch(_){key.focus()}
  return true;
 }
 function openMacroConfig(){const target=selectedTarget(),config=target&&byId(target.keyboard)?.querySelector?.('.vc1645-config-toggle');
  if(!config){notify('Abre el panel de código para configurar Alt+1–8.','warning');return false;}
  config.click();return true;
 }
 function markup(){return `<section id="vc2021-dock" class="vc2021-dock" aria-label="Scouting Speed Pro">
   <div class="vc2021-head"><div><strong>SCOUTING SPEED PRO</strong><small>Completar borrador · nunca registra automáticamente</small><small id="vc2021-draft-engine">Borrador clásico (respaldo)</small><small id="vc2021-register-guard">Precondiciones clásicas</small><small id="vc2021-preparation-engine">Preparación nativa</small><small id="vc2021-lexer-engine">Sintaxis nativa</small><small id="vc2021-extensions-engine">Extensiones nativas</small></div>
   <div class="vc2021-head-actions"><button type="button" data-vc2021-command="focus">Foco código</button><button type="button" data-vc2021-command="court">Ir a pista</button><button type="button" data-vc2021-command="macros">Atajos</button></div></div>
   <div class="vc2021-grid"><div class="vc2021-group" role="group" aria-label="Fundamentos rápidos"><span>FUNDAMENTO</span><div>${SKILLS.map(([id,label])=>`<button type="button" data-vc2021-skill="${id}" title="${safeHtml(label)} · Solo borrador">${id}</button>`).join('')}</div></div>
   <div class="vc2021-group" role="group" aria-label="Valoraciones rápidas"><span>VALORACIÓN</span><div>${EVALS.map(code=>`<button type="button" data-vc2021-rating="${code}" title="Valorar como ${code} · Solo borrador">${code}</button>`).join('')}</div></div></div>
   <div class="vc2021-bottom"><button type="button" data-vc2021-command="repeat">Repetir último código</button><button type="button" data-vc2021-command="undo">Deshacer borrador</button>
    <span id="vc2021-target">Código directo</span><code id="vc2021-preview">—</code></div>
   <details class="vc2021-sequence" id="vc2021-sequence-check"><summary>Comprobar secuencia de rally · experimental · solo lectura</summary>
    <div class="vc2021-sequence-row"><label for="vc2021-sequence-input">Códigos separados por espacios</label>
    <input id="vc2021-sequence-input" type="text" maxlength="512" autocomplete="off" spellcheck="false" placeholder="*12S+ .04R+ *10A#">
    <button type="button" data-vc2021-command="sequence">Comprobar secuencia</button></div>
    <p id="vc2021-sequence-status" role="status" aria-live="polite">Usa * para equipo propio y . para rival. No registra acciones ni aplica puntos.</p>
   </details>
   <p id="vc2021-status" role="status" aria-live="polite">Alt+1–8: macros existentes · Alt+↑: recuperar código · Alt+.: siguiente valoración.</p>
  </section>`;}
 function checkSequence(){
  const field=byId('vc2021-sequence-input'),status=byId('vc2021-sequence-status');
  if(!field||!status)return false;
  const inspect=draftBridge()?.inspectSequence;
  if(typeof inspect!=='function'){
   status.dataset.state='unavailable';
   status.textContent='El comprobador TypeScript no está disponible. No se ha modificado ningún dato.';
   return false;
  }
  try{
   const result=inspect(field.value);
   if(!result||!['empty','ready','review','invalid'].includes(result.status)||!result.counts||!Array.isArray(result.issues))throw Error('invalid-result');
   status.dataset.state=result.status;
   const summary=result.status==='empty'?'Secuencia vacía.':
    `${result.counts.contacts} contactos · ${result.counts.warnings} avisos · ${result.counts.errors} errores.`;
   status.textContent=summary+' '+result.advice+' '+result.issues.map(item=>item.reason).join(' ');
   return true;
  }catch(_){
   status.dataset.state='unavailable';
   status.textContent='No se ha podido comprobar la secuencia. El scouting original sigue disponible.';
   return false;
  }
 }
 function refresh(){
  if(!mounted||!active())return false;
  const target=selectedTarget(),input=target&&byId(target.input),ready=!!target&&canDraft();
  const dock=byId('vc2021-dock');if(!dock)return false;
  if(target?.input!==codeInputId){codeInputId=target?.input||'';revision=null;recentIndex=-1;}
  dock.dataset.editable=String(ready);
  dock.querySelectorAll?.('[data-vc2021-skill],[data-vc2021-rating],[data-vc2021-command="repeat"],[data-vc2021-command="undo"]').forEach(b=>{
   if(b.dataset.vc2021Command==='undo')b.disabled=!ready||!revision||revision.input!==target?.input||revision.matchId!==text(getMatch()?.id)||revision.after!==input?.value;
   else b.disabled=!ready;
  });
  const val=clean(input?.value);const label=target?.input==='v113-video-code'?'Vídeo + código':'Código directo';
  const preview=byId('vc2021-preview'),at=byId('vc2021-target');
  const engine=byId('vc2021-draft-engine'),typed=!!draftBridge();
  dock.dataset.vc20532Draft=typed?'typescript':'classic';
  if(engine)engine.textContent=typed?'Borrador TypeScript (comprobación de equivalencia)':'Borrador clásico (respaldo)';
  const guard=byId('vc2021-register-guard'),typedGuard=root?.VC_SCOUT_REG_GUARD_20535;
  const hasTypedGuard=typedGuard?.VERSION==='20.5.35'&&typedGuard?.preconditionsOnly===true;
  dock.dataset.vc20535Guard=hasTypedGuard?'typescript':'classic';
  if(guard)guard.textContent=hasTypedGuard?'Precondiciones TypeScript · registro nativo':'Precondiciones clásicas · registro nativo';
  const preparation=byId('vc2021-preparation-engine'),preparationApi=root?.VC_SCOUT_PREPARE_20536;
  const typedPreparation=preparationApi?.VERSION==='20.5.36'&&preparationApi?.nativeOnly===true;
  dock.dataset.vc20536Preparation=typedPreparation?'typescript':'classic';
  if(preparation)preparation.textContent=typedPreparation?'Preparación TypeScript · parser y escritura nativos':'Preparación nativa (respaldo)';
  const lexer=byId('vc2021-lexer-engine'),lexerApi=root?.VC_SCOUT_LEXER_20537;
  const typedLexer=lexerApi?.VERSION==='20.5.37'&&lexerApi?.syntaxOnly===true;
  dock.dataset.vc20537Lexer=typedLexer?'typescript':'classic';
  if(lexer)lexer.textContent=typedLexer?'Sintaxis TypeScript · jugadores y escritura nativos':'Sintaxis nativa (respaldo)';
  const extensions=byId('vc2021-extensions-engine'),extensionApi=root?.VC_SCOUT_EXTENSIONS_20538;
  const typedExtensions=extensionApi?.VERSION==='20.5.38'&&extensionApi?.grammarOnly===true;
  dock.dataset.vc20538Extensions=typedExtensions?'typescript':'classic';
  if(extensions)extensions.textContent=typedExtensions?'Subzonas, conos y modificadores TypeScript':'Extensiones nativas (respaldo)';
  if(preview&&preview.textContent!==(val||'—'))preview.textContent=val||'—';
  if(at&&at.textContent!==label)at.textContent=label;
  updates++;return true;
 }
 function click(event){const button=event.target?.closest?.('[data-vc2021-skill],[data-vc2021-rating],[data-vc2021-command]');
  if(!button||!byId('vc2021-dock')?.contains(button)||button.disabled)return;
  if(button.dataset.vc2021Skill)changeSkill(button.dataset.vc2021Skill);
  else if(button.dataset.vc2021Rating)changeRating(button.dataset.vc2021Rating);
  else if(button.dataset.vc2021Command==='focus')focusCode();
  else if(button.dataset.vc2021Command==='court')focusCourt();
  else if(button.dataset.vc2021Command==='macros')openMacroConfig();
  else if(button.dataset.vc2021Command==='repeat')repeatCode();
  else if(button.dataset.vc2021Command==='undo')undoDraft();
  else if(button.dataset.vc2021Command==='sequence')checkSequence();
 }
 function onInput(event){
  if(event.target?.id==='vc2021-sequence-input'){
   const status=byId('vc2021-sequence-status');
   if(status){status.dataset.state='empty';status.textContent='Secuencia modificada. Pulsa Comprobar secuencia para revisar.';}
   return;
  }
  if(!INPUTS.some(t=>t.input===event.target?.id)||!active())return;
  const input=event.target;
  if(!event.isComposing&&text(input.value)!==text(input.value).toUpperCase()){
   const start=input.selectionStart,end=input.selectionEnd;
   input.value=text(input.value).toUpperCase();
   try{if(start!=null&&end!=null)input.setSelectionRange(start,end)}catch(_){}
   stats.uppercases++;
  }
  if(revision&&revision.input===input.id&&revision.after!==input.value)revision=null;
  refresh();
 }
 function editingOtherField(element){
  return !!element?.closest?.('input:not(#v800-code):not(#v113-video-code),textarea,select,[contenteditable="true"],dialog,[role="dialog"]');
 }
 function onKey(event){
  if(!active()||event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||!event.altKey)return;
  const target=focusedTarget();if(!target||editingOtherField(event.target))return;
  if(event.code==='ArrowUp'){
   const count=recentCodes(getMatch()).length;if(!count||!canDraft())return;
   const next=(recentIndex+1)%count;if(repeatCode(next)){event.preventDefault();event.stopPropagation();}
  }else if(event.code==='Period'){
   const next=cycleRating(byId(target.input)?.value, event.shiftKey?-1:1);
   if(next&&setDraft(target,next,'Valoración rápida')){event.preventDefault();event.stopPropagation();stats.ratingEdits++;}
  }else if(event.code==='Backspace'&&event.shiftKey){
   if(undoDraft()){event.preventDefault();event.stopPropagation();}
  }
 }
 function boot(){
  const matchbar=byId('vc2020-matchbar');if(!matchbar||!byId('scout-match-mode'))return false;
  let dock=byId('vc2021-dock');
  if(!dock){const wrapper=doc().createElement('div');wrapper.innerHTML=markup();dock=wrapper.firstElementChild;
   const bottom=matchbar.querySelector('.vc2020-secondary');
   if(bottom)matchbar.insertBefore(dock,bottom);else matchbar.append(dock);
   dock.addEventListener('click',click);
   dock.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target?.id==='vc2021-sequence-input'){
     event.preventDefault();event.stopPropagation();checkSequence();
    }
   });
  }
  if(!mounted){
   mounted=true;
   doc().addEventListener('input',onInput,true);
   doc().addEventListener('keydown',onKey,true);
   for(const id of ['v800-code','v113-video-code'])byId(id)?.addEventListener('focus',refresh);
   doc().addEventListener('vc:matchstatechange',refresh);
   root.addEventListener?.('vc:matchstatechange',refresh);
   if(root.MutationObserver){
    observer=new root.MutationObserver(refresh);
    const shell=byId('v800-shell'),view=byId('scout-match-mode');
    if(shell)observer.observe(shell,{attributes:true,attributeFilter:['data-vc52-mode']});
    if(view)observer.observe(view,{attributes:true,attributeFilter:['class']});
   }
  }
  refresh();return true;
 }
 function diagnostics(){return {version:VERSION,mounted,target:codeInputId,updates,stats:{...stats},draftEngine:draftBridge()?'typescript':'classic',draftBridge:{...draftBridgeStats},legacyKeyboardPresent:!!byId('vc1645-video'),originalCourtPresent:!!byId('vc1613-board')}}
 return {VERSION,SKILLS,EVALS,parseHead,applySkill,applyRating,cycleRating,recentCodes,markup,boot,refresh,changeSkill,changeRating,repeatCode,undoDraft,checkSequence,diagnostics};
});
