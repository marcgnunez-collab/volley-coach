(()=>{
  'use strict';
  const VERSION='16.0.4.4';
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
    return allowed;
  }
  function ensureControls(){
    const d=drawer(),head=d?.querySelector('.v112-video-drawer-head');
    if(!head||$('vc1644-theater-btn'))return;
    const tools=document.createElement('div');tools.className='vc1644-video-tools';
    const label=document.createElement('span');label.className='vc1644-focus-hint';label.textContent='Códigos: a/A equivalen · Alt+K enfoca';
    const focus=document.createElement('button');focus.type='button';focus.id='vc1644-focus-code';focus.textContent='⌨ Escribir código';focus.addEventListener('click',()=>focusCode());
    const expand=document.createElement('button');expand.type='button';expand.id='vc1644-theater-btn';expand.setAttribute('aria-pressed','false');expand.textContent='⤢ Pantalla grande';expand.addEventListener('click',()=>setTheater(!d.classList.contains('vc1644-theater')));
    tools.append(label,focus,expand);
    const close=head.querySelector('button[onclick*="v112ToggleVideo"]');
    if(close)head.insertBefore(tools,close);else head.append(tools);
    const entry=d.querySelector('.v113-video-code-entry');
    if(entry&&!entry.querySelector('.vc1644-code-tip')){
      const hint=document.createElement('p');hint.className='vc1644-code-tip';hint.textContent='Escribe sin Shift: 7a# se convierte en 7A#. Enter guarda la acción.';
      entry.appendChild(hint);
    }
    INPUT_IDS.forEach(id=>{$(id)?.setAttribute('spellcheck','false');$(id)?.setAttribute('autocapitalize','characters')});
  }
  // Observe only two class attributes. No periodic DOM rewrites or video restarts.
  function reconcile(){
    if(drawer()?.classList.contains('vc1644-theater')&&(!isMatchVisible()||!shell()?.classList.contains('v112-video-open'))){setTheater(false)}
  }
  ensureControls();
  const observer=new MutationObserver(reconcile);
  if(shell())observer.observe(shell(),{attributes:true,attributeFilter:['class']});
  if(mainView())observer.observe(mainView(),{attributes:true,attributeFilter:['class']});
  window.VC_SCOUT_VIDEO_UX_1644={version:VERSION,focusCode,setTheater,canonicalize,diagnostics:()=>({...diagnostics,theater:!!drawer()?.classList.contains('vc1644-theater'),matchActive:isMatchVisible()})};
})();