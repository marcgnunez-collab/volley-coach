/* Volley Coach V19.3.19.6 · Match & Video Workspace.
 * Presentation-only adapter over the existing V8/V9/V11 and V16.0.5.4 cockpit.
 * Does NOT write MatchState, scoring, rally, video or sync records.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){
  if(root.VC_MATCH_WORKSPACE_193196)return;
  root.VC_MATCH_WORKSPACE_193196=api;
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});
  else api.boot();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='19.3.19.6';
 const KEY='vc193196:match-layout:v1';
 const LAYOUTS=['balanced','video','coding'];
 const LAYOUT_LABELS={balanced:'Equilibrada',video:'Vídeo grande',coding:'Código grande'};
 const MODE_LABELS={visual:'Codificación visual',directo:'Directo y pista',video:'Vídeo + código',revisar:'Revisión de rallies',analizar:'Análisis de partido'};
 let current='balanced',observer=null,viewObserver=null,mounted=false,refreshCount=0,commands=0;
 const doc=()=>root?.document;
 const byId=id=>doc()?.getElementById(id)||null;
 function normalizedLayout(value){return LAYOUTS.includes(value)?value:'balanced'}
 function currentMode(shell){const raw=String(shell?.dataset?.vc52Mode||'');return Object.hasOwn(MODE_LABELS,raw)?raw:'visual'}
 function readPreference(){try{return normalizedLayout(root?.localStorage?.getItem(KEY))}catch(_){return 'balanced'}}
 function writePreference(value){try{root?.localStorage?.setItem(KEY,value)}catch(_){}}
 function visible(){return !!byId('scout-match-mode')?.classList?.contains('active')}
 function videoMode(){const shell=byId('v800-shell');return !!shell&&currentMode(shell)==='video'&&shell.classList.contains('v112-video-open')}
 function commandBarHTML(){
  return `<div class="vc196-head"><div><span class="vc196-eyebrow">V19.3.19.6 · MATCH WORKSPACE</span><strong>Espacio operativo del partido</strong><small id="vc196-mode-label">Vista de partido</small></div><span class="vc196-nondata-note">Sin duplicar el scouting</span></div>
   <div class="vc196-controls">
    <div class="vc196-view-options" role="group" aria-label="Disposición de vídeo y codificación">
     ${LAYOUTS.map(layout=>`<button type="button" data-vc196-layout="${layout}" aria-pressed="false">${LAYOUT_LABELS[layout]}</button>`).join('')}
    </div>
    <div class="vc196-quick-actions" role="group" aria-label="Accesos rápidos del partido">
     <button type="button" data-vc196-command="video" title="Abrir el reproductor y el código original">Ver vídeo</button>
     <button type="button" data-vc196-command="focus" title="Alt + K: enfocar el código original">Enfocar código</button>
     <button type="button" data-vc196-command="court" title="Ir a la pista interactiva original">Ver pista</button>
     <button type="button" data-vc196-command="rallies" title="Consultar las últimas acciones sin crear copias">Últimos rallies</button>
     <button type="button" data-vc196-command="source" title="Usar la configuración del reproductor original">Fuente de vídeo</button>
    </div>
   </div>`;
 }
 function scrollToElement(node){
  if(!node)return false;
  try{node.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_){try{node.scrollIntoView()}catch(_){return false}}
  return true;
 }
 function focusCode(){
  if(!visible())return false;
  const focusApi=root?.VC_SCOUT_VIDEO_UX_1644;
  if(typeof focusApi?.focusCode==='function')return !!focusApi.focusCode();
  const candidate=videoMode()?byId('v113-video-code'):byId('v800-code')||byId('scout-code-input');
  if(!candidate)return false;
  try{candidate.focus({preventScroll:true})}catch(_){candidate.focus()}
  return true;
 }
 function ensureRallyDock(){
  // Legacy vc54 expects an element with id=v113-video-rally, whereas the
  // current native rally widget is class-only and stays in the coding panel.
  // Never reparent that native widget: its owner can rerender it in place.
  const host=byId('vc54-rally-slot');if(!host)return false;
  const existing=byId('vc196-rally-shortcut');
  if(host.querySelector('.v113-video-rally')){existing?.remove();return true;}
  if(existing)return true;
  const card=doc().createElement('section');card.id='vc196-rally-shortcut';card.className='vc196-rally-shortcut';
  const heading=doc().createElement('strong');heading.textContent='Historial de rallies';
  const description=doc().createElement('p');description.textContent='El rally actual permanece junto al código. Consulta y corrige los anteriores en Revisión.';
  const button=doc().createElement('button');button.type='button';button.textContent='Abrir revisión de rallies';
  button.addEventListener('click',()=>command('rallies'));
  card.append(heading,description,button);host.append(card);return true;
 }
 function refresh(){
  const shell=byId('v800-shell'),panel=byId('vc196-commandbar');if(!shell||!panel)return false;
  const video=videoMode(),mode=currentMode(shell);
  panel.dataset.vc196Video=String(video);
  ensureRallyDock();
  shell.dataset.vc196Layout=current;
  const label=byId('vc196-mode-label');if(label)label.textContent=MODE_LABELS[mode];
  panel.querySelectorAll('[data-vc196-layout]').forEach(b=>{
   b.disabled=!video;b.setAttribute('aria-pressed',String(b.dataset.vc196Layout===current));
  });
  panel.querySelectorAll('[data-vc196-command]').forEach(b=>{
   const action=b.dataset.vc196Command;
   b.disabled=(action==='source'&&!video);
   if(action==='video')b.hidden=video;
  });
  refreshCount++;return true;
 }
 function setLayout(layout,{persist=true}={}){
  current=normalizedLayout(layout);
  if(persist)writePreference(current);
  refresh();return current;
 }
 function command(action){
  if(!visible())return false;
  commands++;
  const mode=currentMode(byId('v800-shell'));
  if(action==='video'){
   if(typeof root?.vc52SetMode!=='function')return false;
   root.vc52SetMode('video');refresh();return true;
  }
  if(action==='focus')return focusCode();
  if(action==='source'){
   if(!videoMode())return false;
   const settings=byId('vc54-video-settings');if(!settings)return false;
   settings.open=true;scrollToElement(settings);
   return true;
  }
  if(action==='court'){
   const court=videoMode()?byId('vc54-court-slot')?.querySelector('.v800-court-card'):
    mode==='visual'?doc()?.querySelector('#vc52-pro-host .v900-courts-column')||doc()?.querySelector('#vc52-pro-host .v900-court-card'):
    doc()?.querySelector('#v800-live > .v800-live-grid .v800-court-card');
   if(court&&!court.closest('[hidden],.hidden'))return scrollToElement(court);
   // In the video cockpit the original court is moved to a dedicated slot.
   if(mode==='revisar'||mode==='analizar'){
    root?.vc52SetMode?.('directo');return true;
   }
   return false;
  }
  if(action==='rallies'){
   if(videoMode()){
    const history=byId('vc54-rally-slot')||byId('vc54-bottom');
    if(history?.querySelector('.v113-video-rally'))return scrollToElement(history);
   }
   if(typeof root?.vc52SetMode!=='function')return false;
   root.vc52SetMode('revisar');refresh();return true;
  }
  return false;
 }
 function click(event){
  const button=event.target?.closest?.('[data-vc196-layout],[data-vc196-command]');
  if(!button||!byId('vc196-commandbar')?.contains(button))return;
  if(button.disabled)return;
  if(button.dataset.vc196Layout){if(!videoMode())return;setLayout(button.dataset.vc196Layout);return}
  command(button.dataset.vc196Command);
 }
 function boot(){
  const modes=byId('vc52-modes'),shell=byId('v800-shell'),live=byId('v800-live');
  if(!modes||!shell||!live)return false;
  let panel=byId('vc196-commandbar');
  if(!panel){
   panel=doc().createElement('section');panel.id='vc196-commandbar';panel.className='vc196-commandbar';
   panel.setAttribute('aria-label','Herramientas de disposición del Match Workspace');
   panel.innerHTML=commandBarHTML();
   modes.insertAdjacentElement('afterend',panel);
   panel.addEventListener('click',click);
  }
  if(!mounted){
   current=readPreference();
   if(root?.MutationObserver){
    observer=new root.MutationObserver(refresh);
    observer.observe(shell,{attributes:true,attributeFilter:['class','data-vc52-mode']});
    const view=byId('scout-match-mode');
    if(view){viewObserver=new root.MutationObserver(refresh);viewObserver.observe(view,{attributes:true,attributeFilter:['class']})}
   }
   mounted=true;
  }
  refresh();return true;
 }
 function diagnostics(){return {version:VERSION,mounted,layout:current,mode:currentMode(byId('v800-shell')),video:videoMode(),matchVisible:visible(),nativeVideo:!!byId('v800-video-frame'),nativeCode:!!byId('v113-video-code'),nativeCourt:!!byId('vc54-court-slot'),presence:!!byId('vc52-peer-count'),refreshCount,commands}}
 return {VERSION,LAYOUTS,LAYOUT_LABELS,normalizedLayout,currentMode,commandBarHTML,boot,refresh,setLayout,command,focusCode,diagnostics};
});
