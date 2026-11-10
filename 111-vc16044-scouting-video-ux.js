(()=>{
  'use strict';
  const VERSION='17.5.3';
  const INPUT_IDS=new Set(['v800-code','v113-video-code','scout-code-input']);
  const $=id=>document.getElementById(id);
  const drawer=()=>$('v112-video-drawer');
  const shell=()=>$('v800-shell');
  const mainView=()=>$('scout-match-mode');
  const isMatchVisible=()=>!!mainView()?.classList.contains('active');
  let composing=new WeakSet();
  const diagnostics={normalizations:0,openTheater:0,focusCount:0};
  function canonicalize(el){
    if(!el||!INPUT_IDS.has(el.id)||composing.has(el))return false;
    const before=el.value,after=before.toUpperCase();
    if(before===after)return false;
    const start=el.selectionStart,end=el.selectionEnd,dir=el.selectionDirection;
    el.value=after;
    try{if(start!=null&&end!=null){
      const newStart=before.slice(0,start).toUpperCase().length;
      const newEnd=before.slice(0,end).toUpperCase().length;
      el.setSelectionRange(newStart,newEnd,dir||'none');
    }}catch(_){}
    diagnostics.normalizations++;return true;
  }
  document.addEventListener('compositionstart',event=>{
    if(INPUT_IDS.has(event.target?.id))composing.add(event.target);
  },true);
  document.addEventListener('compositionend',event=>{
    if(INPUT_IDS.has(event.target?.id)){composing.delete(event.target);canonicalize(event.target)}
  },true);
  document.addEventListener('input',event=>{
    if(INPUT_IDS.has(event.target?.id))canonicalize(event.target);
  },true);
  // Before existing inline Enter/click handlers execute, normalize paste/programmatic input too.
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&INPUT_IDS.has(event.target?.id))canonicalize(event.target);
    if(event.key==='Escape'&&drawer()?.classList.contains('vc1644-theater')){
      event.preventDefault();setTheater(false);
    }
    if(event.altKey&&!event.ctrlKey&&!event.metaKey&&event.code==='KeyK'&&isMatchVisible()){
      event.preventDefault();focusCode();
    }
  },true);
  document.addEventListener('click',event=>{
    const trigger=event.target?.closest?.('#v113-video-code + button, #v857-add-code-btn');
    if(trigger){canonicalize($(trigger.id==='v857-add-code-btn'?'v800-code':'v113-video-code'))}
  },true);
  function focusCode(){
    const viewing=!!shell()?.classList.contains('v112-video-open');
    const input=$(viewing?'v113-video-code':'v800-code');
    if(!input)return false;
    try{input.focus({preventScroll:true})}catch(_){input.focus()}
    diagnostics.focusCount++;return true;
  }
  function setTheater(open){
    const el=drawer();if(!el)return false;
    const allowed=open&&isMatchVisible()&&!!shell()?.classList.contains('v112-video-open');
    el.classList.toggle('vc1644-theater',!!allowed);
    document.body.classList.toggle('vc1644-theater-lock',!!allowed);
    const button=$('vc1644-theater-btn');
    if(button){button.textContent=allowed?'⤢ Salir de pantalla grande':'⤢ Pantalla grande';button.setAttribute('aria-pressed',String(!!allowed));}
    if(allowed)diagnostics.openTheater++;
    ensureControls();
    return allowed;
  }
  function ensureControls(){
    const d=drawer();
    // The old header is often replaced by the later cockpit/workspace scripts.
    // Keep controls on the video card itself, which is visible during scouting.
    const topHead=d?.querySelector('.v112-video-drawer-head');
    const videoHead=d?.querySelector('.v112-video-card > .v800-card-head');
    const active=!!d?.classList.contains('vc1644-theater');
    // Normal view: next to 'Cerrar vídeo'. Theater: inside the video card,
    // because the outer drawer heading is hidden in the fullscreen layout.
    const head=(active?videoHead:topHead)||(videoHead||topHead);
    if(!head)return false;
    let holder=$('vc55-video-controls');
    if(!holder){holder=document.createElement('div');holder.id='vc55-video-controls';holder.className='vc55-video-controls';}
    if(holder.parentElement!==head){
      const close=!active?topHead?.querySelector('button[onclick*="v112ToggleVideo"]'):null;
      if(close&&close.parentElement===head)head.insertBefore(holder,close);
      else head.appendChild(holder);
    }
    let focus=$('vc1644-focus-code');
    if(!focus){
      focus=document.createElement('button');focus.type='button';focus.id='vc1644-focus-code';
      focus.textContent='⌨ Escribir código';focus.addEventListener('click',focusCode);
    }
    if(focus.parentElement!==holder)holder.appendChild(focus);
    let expand=$('vc1644-theater-btn');
    if(!expand){
      expand=document.createElement('button');expand.type='button';expand.id='vc1644-theater-btn';
      expand.addEventListener('click',()=>setTheater(!drawer()?.classList.contains('vc1644-theater')));
    }
    if(expand.parentElement!==holder)holder.appendChild(expand);
    expand.setAttribute('aria-pressed',String(active));
    const text=active?'⤢ Salir de pantalla grande':'⤢ Pantalla grande';
    if(expand.textContent!==text)expand.textContent=text;
    expand.title=active?'Volver a la vista normal (Esc)':'Ampliar el vídeo conservando la codificación (Esc para cerrar)';
    const entry=d.querySelector('.v113-video-code-entry');
    if(entry&&!entry.querySelector('.vc1644-code-tip')){
      const hint=document.createElement('p');hint.className='vc1644-code-tip';hint.textContent='Escribe sin Shift: 7a# se convierte en 7A#. Enter guarda la acción.';
      entry.appendChild(hint);
    }
    INPUT_IDS.forEach(id=>{$(id)?.setAttribute('spellcheck','false');$(id)?.setAttribute('autocapitalize','characters')});
    return true;
  }
  // Watch the video drawer only: re-rendered heads must regain the button.
  function reconcile(){
    if(drawer()?.classList.contains('vc1644-theater')&&(!isMatchVisible()||!shell()?.classList.contains('v112-video-open'))){setTheater(false)}
  }
  ensureControls();
  let pending=false,observedDrawer=null;
  const restoreObserver=new MutationObserver(scheduleRestore);
  function watchDrawer(){
    const current=drawer();
    if(current===observedDrawer)return;
    restoreObserver.disconnect();observedDrawer=current;
    if(current)restoreObserver.observe(current,{childList:true,subtree:true});
  }
  function scheduleRestore(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;watchDrawer();ensureControls();reconcile()});
  }
  watchDrawer();
  // Only the shell's immediate children, to recover if the whole drawer is recreated.
  if(shell())new MutationObserver(scheduleRestore).observe(shell(),{childList:true});
  const observer=new MutationObserver(reconcile);
  if(shell())observer.observe(shell(),{attributes:true,attributeFilter:['class']});
  if(mainView())observer.observe(mainView(),{attributes:true,attributeFilter:['class']});
  window.VC_SCOUT_VIDEO_UX_1644={version:VERSION,focusCode,setTheater,canonicalize,diagnostics:()=>({...diagnostics,theater:!!drawer()?.classList.contains('vc1644-theater'),matchActive:isMatchVisible()})};
})();