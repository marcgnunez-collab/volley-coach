/* Volley Coach V20.5.1 · Scouting Expert preflight.
 * No writing, parsing replacement, scoreboard changes or cloud traffic.
 * The existing native code registrar remains the only action writer.
 */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  if(root.VC_SCOUT_EXPERT_2051)return;
  root.VC_SCOUT_EXPERT_2051=api;
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.mount,{once:true});
  else api.mount();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.5.1';
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const GRADES=new Set(['#','+','!','-','/','=']);
 const HEAD=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
 const IDS=['v800-code','v113-video-code'];
 const clean=x=>String(x??'').trim().toUpperCase().replace(/\s+/g,'');
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=x=>String(x??'').slice(0,180);
 const byId=id=>root?.document?.getElementById(id)||null;
 function inspect(raw,match,nativeParser){
  const code=clean(raw);
  if(!code)return {state:'idle',message:'Escribe un código: 7A# · 3R+ · R12S=.',code};
  if(code.length>140)return {state:'error',message:'Código demasiado largo para previsualizar.',code};
  if(!match)return {state:'warning',message:'Abre un scouting activo.',code};
  if(match.status==='finished')return {state:'warning',message:'El scouting está finalizado. Reábrelo para editar.',code};
  const m=code.match(HEAD);
  if(!m)return {state:'error',message:'Empieza por el dorsal (7A#) o R+dorsal rival (R7A#).',code};
  if(!m[3])return {state:'draft',message:`Dorsal ${m[2]} reconocido · falta fundamento (S/R/E/A/B/D/F/C).`,code};
  const side=m[1]?'Rival':'Nuestro',skill=SKILLS[m[3]],rating=m[4];
  const summary=`${side} · #${m[2]} · ${skill}${rating?' · '+rating:''}`;
  if(typeof nativeParser!=='function')return {state:'warning',message:`${summary} · motor de validación no disponible.`,code};
  try{
   const parsed=nativeParser(code,match,null);
   if(!parsed||parsed.error||!parsed.action)
    return {state:'error',message:label(parsed?.error||'Código no reconocido por el motor de scouting.'),code,summary};
   const a=parsed.action;
   const extras=[];
   if(a.startZone)extras.push(`origen ${a.startZone}`);
   if(a.endZone)extras.push(`destino ${a.endZone}`);
   if(a.tempo)extras.push(`tempo ${a.tempo}`);
   const grade=GRADES.has(a.evaluation)?a.evaluation:(rating||'—');
   return {state:rating?'ok':'caution',code,summary:`${side} · #${m[2]} · ${skill} · ${grade}`,
    message:rating?'Código aceptado por el motor. Pulsa Enter o Añadir para registrarlo.':
     'El motor acepta el código, pero falta una valoración explícita. Comprueba el resultado antes de añadir.',
    extras,playerKnown:!!a.playerId||!!a.playerLabel||!!a.playerNumberSnapshot,
    // V20.5.6: the shadow module reuses this existing preview result. No second
    // native parser call, player name, object reference or match data is sent.
    nativeShape:Object.freeze({team:a.team,skill:a.skill,evaluation:a.evaluation,
     playerNumberSnapshot:a.playerNumberSnapshot??'',startZone:a.startZone||'',endZone:a.endZone||''})};
  }catch(_){return {state:'warning',message:'No se pudo comprobar el borrador. El registro original sigue disponible.',code,summary};}
 }
 function mount(){
  const doc=root?.document,view=byId('scout-match-mode');
  if(!doc||!view)return false;
  for(const id of IDS){
   const input=byId(id);if(!input||byId('vc2051-'+id))continue;
   const host=doc.createElement('div');host.id='vc2051-'+id;host.className='vc2051-preflight';
   host.setAttribute('role','status');host.setAttribute('aria-live','polite');
   host.innerHTML='<span class="vc2051-indicator"></span><span class="vc2051-message">Previsualización antes de registrar</span>';
   const row=input.closest('.v800-code-row, .v113-video-code-row')||input.parentElement;
   row?.insertAdjacentElement('afterend',host);
  }
  if(!byId('vc2051-native-actions')){
   const original=byId('vc2021-dock');
   const bar=doc.createElement('div');bar.id='vc2051-native-actions';bar.className='vc2051-actions';
   bar.innerHTML='<span>SCOUTING EXPERT · V20.5.1</span><button type="button" data-vc2051-action="substitution">⇄ Sustitución</button><small>Alt+Mayús+S: abrir control de sustituciones · No registra acciones automáticamente</small>';
   const anchor=original||byId('vc2020-matchbar');
   anchor?.insertAdjacentElement('afterend',bar);
   bar.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-vc2051-action="substitution"]'))openSubstitution();
   });
  }
  if(mount.started)return true;
  mount.started=true;
  let pending=null;
  const published=new Map();
  const refresh=()=>{
   if(!view.classList.contains('active'))return;
   const match=(()=>{try{return root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||root.VC_SCOUT_REPORT_BRIDGE?.getActive?.()||null}catch(_){return null}})();
   const parser=typeof root.v680ParseCode==='function'?root.v680ParseCode:null;
   for(const id of IDS){
    const input=byId(id),status=byId('vc2051-'+id);
    if(!input||!status)continue;
    const result=inspect(input.value,match,parser);
    status.dataset.state=result.state;
    status.querySelector('.vc2051-message').textContent=result.summary?`${result.summary} · ${result.message}`:result.message;
    // Publish a bounded preflight fact, not a scouting action. Only complete
    // head drafts are relevant; reset the dedupe key when an input is emptied.
    if(!result.code){published.delete(id);continue;}
    if(!/^(?:R)?\d+[SREABDFC]/.test(result.code)||result.code.length>140)continue;
    const signature=JSON.stringify([match?.id??null,result.code,result.state,result.nativeShape||null]);
    if(signature===published.get(id))continue;
    published.set(id,signature);
    try{
     if(typeof root.CustomEvent==='function')doc.dispatchEvent(new root.CustomEvent('vc:scout-code-preflight',{
      detail:{source:id,code:result.code,state:result.state,nativeShape:result.nativeShape||null}
     }));
    }catch(_){/* Diagnostic events must never affect the original registrar. */}
   }
  };
  const schedule=()=>{if(pending)root.clearTimeout(pending);pending=root.setTimeout(()=>{pending=null;refresh()},140);};
  doc.addEventListener('input',event=>{if(IDS.includes(event.target?.id))schedule()},true);
  doc.addEventListener('focusin',event=>{if(IDS.includes(event.target?.id))schedule()},true);
  doc.addEventListener('vc:matchstatechange',schedule);
  doc.addEventListener('keydown',event=>{
   if(!view.classList.contains('active')||event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey)return;
   if(event.altKey&&event.shiftKey&&event.code==='KeyS'){
    if(event.target?.closest?.('input:not(#v800-code):not(#v113-video-code),textarea,select,[contenteditable="true"],[role="dialog"]'))return;
    if(openSubstitution()){event.preventDefault();event.stopPropagation();}
   }
  },true);
  if(root.MutationObserver)new root.MutationObserver(schedule).observe(view,{attributes:true,attributeFilter:['class']});
  refresh();return true;
 }
 function openSubstitution(){
  if(!byId('scout-match-mode')?.classList.contains('active'))return false;
  const match=(()=>{try{return root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||root.VC_SCOUT_REPORT_BRIDGE?.getActive?.()||null}catch(_){return null}})();
  if(!match||match.status==='finished')return false;
  if(typeof root.v120OpenChanges==='function'){root.v120OpenChanges();return true;}
  if(typeof root.scoutOpenSubstitution==='function'){root.scoutOpenSubstitution();return true;}
  return false;
 }
 return {VERSION,inspect,mount,openSubstitution};
});
