/* Volley Coach V17.7.0 · Vídeo Pro
 * Extiende exclusivamente la vista de scouting sobre vídeo existente.
 * Nunca crea media, cambia la fuente, altera el scouting ni escribe en almacenamiento.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){
  const ready=()=>api.mount(root);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.7.0';
 const ID='vc1770-video-pro';
 const isEditable=el=>!!el?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"]');
 const isReplaySource=s=>s==='local'||s==='youtube';
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  const shell=()=>$('v800-shell'),drawer=()=>$('v112-video-drawer');
  if(!shell()||!drawer())return false;
  let layout='balanced', mounted=0, seeks=0, toggles=0, shortcutCount=0;
  let pending=false;
  const open=()=>!!shell()?.classList.contains('v112-video-open')&&!!$('scout-match-mode')?.classList.contains('active');
  const theater=()=>!!drawer()?.classList.contains('vc1644-theater');
  const selectedSource=()=>{
   for(const s of ['local','youtube','delay','live']){
    const tab=$('v802-source-'+s);
    if(tab?.classList.contains('active')||tab?.getAttribute('aria-selected')==='true')return s;
   }
   const label=($('v116-source-label')?.textContent||'').trim().toUpperCase();
   if(label.includes('YOUTUBE'))return 'youtube';
   if(label.includes('ARCHIVO')||label.includes('LOCAL'))return 'local';
   if(label.includes('DELAY'))return 'delay';
   return 'live';
  };
  const ready=()=>{
   const s=selectedSource();
   if(s==='local'){
    const video=$('v802-local-video');
    return !!video?.getAttribute('src')||!!video?.currentSrc;
   }
   if(s==='youtube'){
    const box=$('v802-youtube-player');
    return !!box?.querySelector('iframe')||!!box?.getAttribute('data-ready');
   }
   return false;
  };
  const activeTransport=()=>open()&&isReplaySource(selectedSource())&&ready();
  const css=`
/* Mobile and desktop video view: keep one original player and original coding. */
#scout-match-mode #v112-video-drawer .vc1770-toolbar{display:none!important;min-width:0;gap:7px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:8px 10px;margin:0;background:#0b2640;border:1px solid #365671;border-radius:9px;color:#f2f7ff;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button{appearance:none!important;border:1px solid #4e7390!important;background:#24465f!important;border-radius:7px!important;color:#f7fbff!important;font:750 12px/1.2 system-ui,sans-serif!important;min-height:35px!important;padding:7px 10px!important;cursor:pointer!important;white-space:nowrap!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button[disabled]{opacity:.45!important;cursor:not-allowed!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button[aria-pressed="true"]{background:#e9f3ff!important;color:#173a65!important;border-color:#c6e4ff!important;}
#scout-match-mode #v112-video-drawer .vc1770-toolbar button:focus-visible{outline:3px solid #7abaf8!important;outline-offset:2px!important;}
#scout-match-mode #v112-video-drawer .vc1770-transport,#scout-match-mode #v112-video-drawer .vc1770-layout{display:flex;gap:5px;align-items:center;flex-wrap:wrap;}
#scout-match-mode #v112-video-drawer .vc1770-transport{flex:1 1 auto;}
#scout-match-mode #v112-video-drawer .vc1770-source{font:650 11px/1.3 system-ui,sans-serif;color:#d1e3f4;flex:1 1 100%;min-width:0;}
#scout-match-mode #v112-video-drawer .vc1770-source strong{color:#fff;}
body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready{grid-template-columns:minmax(0,1fr) clamp(305px,28vw,440px)!important;}
body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready.vc1770-video-focus{grid-template-columns:minmax(0,1fr) clamp(300px,22vw,335px)!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>.vc1770-toolbar{display:flex!important;order:2!important;grid-column:auto!important;grid-row:auto!important;flex:0 0 auto!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>#v802-playback{order:3!important;}
body.v11-shell.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater>.v112-video-card>.v800-video-actions{order:4!important;}
@media(max-width:820px){
 body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready,
 body.v11-shell.vc54-match-active.vc1644-theater-lock #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer.vc1644-theater.vc1770-video-pro-ready.vc1770-video-focus{display:flex!important;flex-direction:column!important;grid-template-columns:none!important;}
 #scout-match-mode #v112-video-drawer .vc1770-toolbar{padding:7px!important;}
 #scout-match-mode #v112-video-drawer .vc1770-toolbar button{min-height:38px!important;}
}
@media(max-width:460px){
 #scout-match-mode #v112-video-drawer .vc1770-transport{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));width:100%;}
 #scout-match-mode #v112-video-drawer .vc1770-transport button{min-width:0!important;padding:8px 3px!important;font-size:11px!important;}
 #scout-match-mode #v112-video-drawer .vc1770-layout{width:100%;justify-content:space-between;}
}
@media(prefers-reduced-motion:reduce){#scout-match-mode #v112-video-drawer .vc1770-toolbar button{transition:none!important;}}
`;
  function installCss(){if($('vc1770-video-style'))return;
   const style=doc.createElement('style');style.id='vc1770-video-style';style.textContent=css;doc.head.appendChild(style);
  }
  function ensure(){
   const d=drawer(),card=d?.querySelector(':scope > .v112-video-card');
   if(!card)return false;
   let el=$(ID);
   if(!el){
    el=doc.createElement('div');el.id=ID;el.className='vc1770-toolbar';
    el.setAttribute('role','group');el.setAttribute('aria-label','Controles de Vídeo Pro');
    el.innerHTML=`<div class="vc1770-source" aria-live="polite" id="vc1770-source">Repetición: sin vídeo cargado</div>
    <div class="vc1770-transport" role="group" aria-label="Repetición de vídeo">
      <button type="button" data-vc1770="back" title="Retroceder 8 segundos (Shift + flecha izquierda)">−8 s</button>
      <button type="button" data-vc1770="play" title="Pausar o reproducir (Shift + espacio)">▶ / ❚❚</button>
      <button type="button" data-vc1770="forward" title="Avanzar 5 segundos (Shift + flecha derecha)">+5 s</button>
      <button type="button" data-vc1770="focus" title="Ir al campo de código rápido">⌨ Código</button>
    </div>
    <div class="vc1770-layout" role="group" aria-label="Distribución de pantalla">
      <button type="button" data-vc1770="balanced" aria-pressed="true" title="Más espacio para codificar">Equilibrada</button>
      <button type="button" data-vc1770="big" aria-pressed="false" title="Dar más espacio al vídeo manteniendo el panel de código">Vídeo +</button>
    </div>`;
    el.addEventListener('click',click);
    mounted++;
   }
   if(el.parentElement!==card){
    const playback=$('v802-playback');
    if(playback?.parentElement===card)card.insertBefore(el,playback);
    else card.appendChild(el);
   }
   d.classList.add('vc1770-video-pro-ready');
   d.classList.toggle('vc1770-video-focus',layout==='big');
   update();
   return true;
  }
  function update(){
   const el=$(ID);if(!el)return;
   const source=selectedSource(),loaded=ready();
   const state=$('vc1770-source');
   if(state){
    const message=source==='local'?'Archivo':source==='youtube'?'YouTube':source==='delay'?'Delay':'Directo';
    const tip=isReplaySource(source)?loaded?'Control de repetición disponible':'Abre el vídeo para activar la repetición':'Usa los controles originales de Live / Delay';
    const label=message+' · '+tip;
    if(state.textContent!==label)state.textContent=label;
   }
   for(const name of ['back','play','forward']){
    const btn=el.querySelector('[data-vc1770="'+name+'"]');
    if(btn)btn.disabled=!activeTransport();
   }
   for(const name of ['balanced','big']){
    const btn=el.querySelector('[data-vc1770="'+name+'"]');
    if(btn)btn.setAttribute('aria-pressed',String(layout===(name==='big'?'big':'balanced')));
   }
  }
  function seek(seconds){
   if(!activeTransport()||typeof root.v802Jump!=='function')return false;
   root.v802Jump(seconds);seeks++;return true;
  }
  function play(){
   if(!activeTransport()||typeof root.v802TogglePlay!=='function')return false;
   root.v802TogglePlay();toggles++;return true;
  }
  function setLayout(which){
   if(!['big','balanced'].includes(which))return false;
   layout=which;drawer()?.classList.toggle('vc1770-video-focus',layout==='big');update();return true;
  }
  function focusCode(){return !!root.VC_SCOUT_VIDEO_UX_1644?.focusCode?.()}
  function click(e){
   const button=e.target.closest('button[data-vc1770]');if(!button)return;
   const action=button.dataset.vc1770;
   if(action==='back')seek(-8);
   else if(action==='forward')seek(5);
   else if(action==='play')play();
   else if(action==='focus')focusCode();
   else if(action==='big'||action==='balanced')setLayout(action);
   update();
  }
  function handleKey(event){
   if(!open()||!theater()||isEditable(event.target))return;
   if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!event.shiftKey)return;
   let success=false;
   if(event.key==='ArrowLeft')success=seek(-8);
   if(event.key==='ArrowRight')success=seek(5);
   if(event.code==='Space')success=play();
   if(success){event.preventDefault();shortcutCount++;update();}
  }
  function schedule(){if(pending)return;
   pending=true;root.requestAnimationFrame(()=>{pending=false;ensure()});
  }
  installCss();ensure();
  doc.addEventListener('keydown',handleKey,true);
  const observer=new MutationObserver(schedule);
  observer.observe(drawer(),{childList:true,subtree:true});
  const stateObserver=new MutationObserver(schedule);
  for(const id of ['v800-shell','v112-video-drawer','v802-source-local','v802-source-youtube','v802-source-live','v802-source-delay']){
   const el=$(id);if(el)stateObserver.observe(el,{attributes:true,attributeFilter:['class','aria-selected']});
  }
  for(const id of ['v802-local-video']){
   const el=$(id);if(!el)continue;
   ['loadedmetadata','emptied','loadstart'].forEach(name=>el.addEventListener(name,schedule));
  }
  // React to the original source selectors; do not replace their handlers.
  drawer().addEventListener('click',e=>{
   if(e.target.closest?.('.v116-source-tabs button,.v802-source-tabs button'))schedule();
  });
  root.VC_VIDEO_PRO_1770={version:VERSION,setLayout,seek,play,refresh:ensure,
   diagnostics:()=>({version:VERSION,mounted,layout,theater:theater(),source:selectedSource(),replayEnabled:activeTransport(),seeks,toggles,shortcuts:shortcutCount,videoNodes:drawer()?.querySelectorAll('video').length||0})};
  return true;
 }
 return {VERSION,mount,isReplaySource,isEditable};
});
