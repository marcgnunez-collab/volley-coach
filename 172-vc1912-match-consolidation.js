/* Volley Coach V19.1.2 · Scouting + Modo Partido: un único workspace operativo.
 * Adapter de presentación y selección EXPLÍCITA. No implementa ni copia
 * el motor de puntos, acciones, sets, PDF, vídeo, Sync Pro o MatchState.
 * Compatibilidad: los IDs heredados permanecen en el DOM para sus consumidores.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='19.1.2',VIEW='scout-match-mode';
 const MODES=Object.freeze(['visual','directo','video','revisar','analizar']);
 const LEGACY=Object.freeze(['scouting','scout-workspace-v900','coding','codificacion','scouting-pro']);
 const arr=value=>Array.isArray(value)?value:[];
 const norm=value=>String(value==null?'':value).trim();
 const idOf=m=>m&&m.id!=null?String(m.id):'';
 function resolveTarget(raw){
  const target=norm(raw);
  return {view:LEGACY.includes(target)||target==='match'?VIEW:target,
   mode:LEGACY.includes(target)?'visual':null,
   legacy:LEGACY.includes(target)||target==='match'};
 }
 function snapshot(bridge){
  let matches=[],activeId='';
  try{matches=arr(bridge?.getMatches?.()).filter(m=>m&&idOf(m))}catch(_){ }
  try{activeId=norm(bridge?.getActiveId?.())}catch(_){ }
  if(!activeId)try{activeId=idOf(bridge?.getActive?.())}catch(_){ }
  const active=matches.find(m=>idOf(m)===activeId)||null;
  return {matches,activeId:active?activeId:'',active,
   readonly:active?.status==='finished',
   count:matches.length};
 }
 function optionsFingerprint(items){
  return JSON.stringify(items.map(m=>[idOf(m),norm(m.opponent),norm(m.date),norm(m.status),norm(m.updatedAt)]));
 }
 function matchLabel(m){
  const status=m.status==='finished'?'FINALIZADO · solo lectura':'En curso';
  return `${norm(m.date)||'Sin fecha'} · ${norm(m.opponent)||'Rival'} · ${status}`;
 }
 async function switchMatch(root,id){
  const selection=norm(id),state=root.MatchState,bridge=root.VC_SCOUT_VIDEO_BRIDGE;
  const current=snapshot(bridge);
  if(!selection||!current.matches.some(m=>idOf(m)===selection))
   throw new Error('El scouting seleccionado no está disponible en el equipo actual.');
  if(selection===current.activeId)return {changed:false,match:current.active};
  // MatchState.select preserves current progress before switching and keeps
  // finished scoutings in read-only mode; do not emulate it with activateMatch.
  if(typeof state?.select==='function'){
   const match=await state.select(selection,{saveCurrent:true,openWorkspace:false});
   if(!match)throw new Error('No se ha confirmado la selección del scouting.');
   return {changed:true,match};
  }
  const target=current.matches.find(m=>idOf(m)===selection);
  if(target.status==='finished')
   throw new Error('La revisión de partidos finalizados requiere el motor MatchState. No se ha reabierto el partido.');
  if(typeof root.v800SelectMatch!=='function')
   throw new Error('El selector de scouting profesional todavía no está disponible.');
  const ok=await root.v800SelectMatch(selection);
  if(ok!==true)throw new Error('No se ha confirmado el cambio de scouting.');
  return {changed:true,match:target};
 }
 function mount(root){
  const doc=root.document;
  if(!doc)return false;
  const boot=()=>{
   if(doc.getElementById('vc19-match-picker'))return true;
   const host=doc.getElementById('vc52-presence-bar');
   if(!host||!doc.getElementById(VIEW))return false;
   const label=doc.createElement('label');
   label.className='vc19-match-picker';label.htmlFor='vc19-match-picker';
   const title=doc.createElement('span');title.textContent='Scouting activo';
   const select=doc.createElement('select');
   select.id='vc19-match-picker';select.setAttribute('aria-label','Seleccionar scouting guardado');
   const feedback=doc.createElement('output');
   feedback.id='vc19-match-state';feedback.className='vc19-match-state';
   feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   label.append(title,select);
   host.insertBefore(label,host.firstChild);host.insertBefore(feedback,label.nextSibling);
   doc.body.classList.add('vc19-match-unified');
   let previousFingerprint='',busy=false,refreshes=0,lastError='';
   function refresh(force=false){
    const data=snapshot(root.VC_SCOUT_VIDEO_BRIDGE);
    const fingerprint=optionsFingerprint(data.matches);
    if((force||previousFingerprint!==fingerprint)&&doc.activeElement!==select){
     previousFingerprint=fingerprint;
     select.replaceChildren();
     const empty=doc.createElement('option');empty.value='';
     empty.textContent='Seleccionar scouting';select.appendChild(empty);
     const ordered=data.matches.slice().sort((a,b)=>norm(b.updatedAt||b.date).localeCompare(norm(a.updatedAt||a.date)));
     for(const m of ordered){
      const option=doc.createElement('option');option.value=idOf(m);option.textContent=matchLabel(m);select.appendChild(option);
     }
    }
    if(!busy){
     if(select.value!==data.activeId)select.value=data.activeId;
     select.disabled=!data.count;
     feedback.dataset.status=lastError?'error':data.readonly?'finished':data.active?'active':'none';
     feedback.textContent=lastError|| (data.readonly?'Finalizado · consulta sin edición':data.active?
      'Seleccionado · registro único del partido':data.count?'Elige un scouting para continuar':'Sin scoutings guardados');
    }
    refreshes++;return data;
   }
   select.addEventListener('blur',()=>refresh(true));
   select.addEventListener('change',async()=>{
    if(busy)return;
    const id=select.value;if(!id){refresh(true);return;}
    lastError='';busy=true;select.disabled=true;feedback.dataset.status='switching';feedback.textContent='Protegiendo el scouting anterior…';
    try{
     await switchMatch(root,id);
     lastError='';
     // Only read/render. MatchState is the one authorized to switch stored data.
     try{root.v800Render?.()}catch(err){console.warn('V19: render Match Mode',err)}
     try{root.v900Render?.()}catch(err){console.warn('V19: render Scouting Pro',err)}
     try{root.VC172_MATCH_WORKSPACE?.refresh?.()}catch(_){ }
    }catch(err){
     console.error('V19: no se pudo seleccionar el scouting',err);
     lastError=String(err?.message||'No se ha cambiado de scouting.');
     feedback.dataset.status='error';feedback.textContent=lastError;
     // Leave the selection in its previous state; do not discard any data.
    }finally{
     busy=false;refresh(true);
    }
   });
   function open(mode){
    const next=MODES.includes(mode)?mode:null;
    const ok=root.VC19_UNIFIED_WORKFLOW?.route?.(VIEW,'matches') ??
      root.VC17_WORKSPACE?.route?.(VIEW,'matches') ??
      (typeof root.showView==='function'?(root.showView(VIEW,root.botonVista?.(VIEW)||null),true):false);
    if(ok===false)return false;
    if(next)root.vc52SetMode?.(next);
    refresh();return true;
   }
   const onVisible=()=>{if(!doc.hidden&&doc.getElementById(VIEW)?.classList.contains('active'))refresh()};
   const unsubscribe=root.MatchState?.subscribe?.(onVisible)||(()=>{});
   root.addEventListener?.('focus',onVisible);
   doc.addEventListener('visibilitychange',onVisible);
   // Read-only refresh while visible; never invokes server, activation or save.
   root.setInterval?.(onVisible,4000);
   refresh(true);
   root.VC19_MATCH_WORKSPACE={version:VERSION,view:VIEW,modes:MODES,open,
    select:id=>switchMatch(root,id),refresh:()=>refresh(true),
    diagnostics:()=>({version:VERSION,canonicalView:VIEW,legacyAliases:LEGACY.slice(),
      embeddedVisual:doc.getElementById('scout-workspace-v900')?.parentElement?.id==='vc52-pro-host',
      selectedId:snapshot(root.VC_SCOUT_VIDEO_BRIDGE).activeId,
      pickerCount:doc.querySelectorAll('#vc19-match-picker').length,
      presencePreserved:!!doc.getElementById('vc52-peer-count'),
      mode:root.VC_16052_UNIFIED?.currentMode?.()||null,refreshes}),
    dispose:unsubscribe};
   return true;
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  return true;
 }
 return {VERSION,VIEW,MODES,LEGACY,resolveTarget,snapshot,matchLabel,optionsFingerprint,switchMatch,mount};
});
