/* Volley Coach V20.2.4.1 — Data Volley Layout Refinement
 * Pure UI shell adapter. Does not create a score, rally, video stream, or scouting record.
 * Reuses #v11-sidebar, #v11-main, #v11-topbar, #v112-video-drawer,
 * #v113-video-code-panel, #vc1613-board and the native scoreboard.
 */
(function(root, make){
 'use strict';
 const api=make(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(!root?.document)return;
 if(root.VC_DV_LAYOUT_20241)return;
 root.VC_DV_LAYOUT_20241=api;
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});
 else api.boot();
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.2.4.1';
 const KEY='vc20241.suggestedWorkspace';
 const defaults=Object.freeze({leftHidden:true,globalLeftHidden:false,right:'full',sourceOpen:false});
 const safeRight=x=>['full','compact','hidden'].includes(x)?x:'full';
 function normalize(settings){const s=settings&&typeof settings==='object'?settings:{};
  return {leftHidden:typeof s.leftHidden==='boolean'?s.leftHidden:defaults.leftHidden,
   globalLeftHidden:typeof s.globalLeftHidden==='boolean'?s.globalLeftHidden:defaults.globalLeftHidden,
   right:safeRight(s.right),sourceOpen:typeof s.sourceOpen==='boolean'?s.sourceOpen:defaults.sourceOpen};
 }
 let settings=normalize(),booted=false,observer=null,menuObserver=null,sidebarObserver=null;
 const doc=()=>root?.document;
 const byId=id=>doc()?.getElementById(id)||null;
 const active=()=>!!byId('scout-match-mode')?.classList.contains('active');
 const desktop=()=>!!root?.matchMedia?.('(min-width:861px)')?.matches;
 const leftHidden=()=>active()?settings.leftHidden:settings.globalLeftHidden;
 function read(){try{const raw=root?.localStorage?.getItem(KEY);return normalize(raw?JSON.parse(raw):null)}catch(_){return normalize()}}
 function persist(){try{root?.localStorage?.setItem(KEY,JSON.stringify(settings))}catch(_){} }
 function sync(){const d=doc(),body=d?.body;if(!body)return false;
  const enabled=active(),wide=desktop(),left=wide&&leftHidden();
  body.classList.toggle('vc20241-workspace',enabled);
  body.classList.toggle('vc20241-left-hidden',left);
  for(const mode of ['full','compact','hidden'])body.classList.toggle('vc20241-right-'+mode,enabled&&settings.right===mode);
  body.classList.toggle('vc20241-source-open',enabled&&settings.sourceOpen);
  const side=byId('v11-sidebar'),overlay=byId('v11-sidebar-overlay');
  if(wide&&side?.classList.contains('open')){
   side.classList.remove('open');overlay?.classList.remove('open');
  }
  const mobileOpen=!!side?.classList.contains('open');
  const toggle=d.querySelector('#v11-topbar .v11-menu-toggle');
  if(toggle){
   toggle.setAttribute('aria-controls','v11-sidebar');
   toggle.setAttribute('aria-expanded',String(wide?!left:mobileOpen));
   toggle.setAttribute('aria-label',wide?(left?'Mostrar navegación principal':'Ocultar navegación principal'):(mobileOpen?'Cerrar navegación principal':'Abrir navegación principal'));
   toggle.title=wide?(left?'Mostrar menú principal':'Ocultar menú principal'):(mobileOpen?'Cerrar menú principal':'Abrir menú principal');
  }
  const hide=byId('vc20241-hide-nav');if(hide){hide.title='Ocultar barra izquierda';hide.setAttribute('aria-label','Ocultar barra lateral izquierda');}
  const panel=byId('v113-video-code-panel');
  if(panel){if(enabled&&settings.right==='hidden'){
    if(panel.contains(d.activeElement))d.querySelector('#vc20241-right-toggle')?.focus?.();
    panel.setAttribute('aria-hidden','true');panel.setAttribute('inert','');
   }else{panel.removeAttribute('aria-hidden');panel.removeAttribute('inert');}}
  const rightLabels={full:'Panel: completo',compact:'Panel: compacto',hidden:'Mostrar código y pista'};
  d.querySelectorAll('[data-vc20241-right]').forEach(button=>{
   button.textContent=rightLabels[settings.right];
   button.title=settings.right==='hidden'?'Volver a mostrar el código rápido y la pista':`Cambiar panel derecho (${settings.right==='full'?'compacto':'oculto'})`;
   button.setAttribute('aria-label',button.title);
  });
  d.querySelectorAll('[data-vc20241-source]').forEach(button=>{
   button.textContent=settings.sourceOpen?'Ocultar fuentes':'Fuente / cámara';
   button.setAttribute('aria-expanded',String(settings.sourceOpen));
  });
  d.querySelectorAll('[data-vc20241-max]').forEach(button=>{
   button.textContent=settings.right==='hidden'?'Restaurar scouting':'Vídeo máximo';
   button.setAttribute('aria-pressed',String(settings.right==='hidden'));
  });
  return enabled;
 }
 function setLeftHidden(value){if(active())settings.leftHidden=!!value;else settings.globalLeftHidden=!!value;
  persist();sync();return leftHidden();}
 function setRight(value){settings.right=safeRight(value);persist();sync();return settings.right;}
 function cycleRight(){return setRight({full:'compact',compact:'hidden',hidden:'full'}[settings.right]);}
 function toggleMax(){return setRight(settings.right==='hidden'?'full':'hidden');}
 function setSourceOpen(value){settings.sourceOpen=!!value;persist();sync();return settings.sourceOpen;}
 function inject(){const d=doc();if(!d)return false;
  const brand=d.querySelector('#v11-sidebar .vc17-brand')||d.querySelector('#v11-sidebar .v11-brand');
  if(brand&&!byId('vc20241-hide-nav')){
   const b=d.createElement('button');b.type='button';b.id='vc20241-hide-nav';b.className='vc20241-hide-nav';
   b.textContent='❮';b.title='Ocultar barra izquierda';b.setAttribute('aria-label','Ocultar barra lateral izquierda');brand.append(b);
  }
  const menu=byId('vc2023-menubar');
  if(menu&&!byId('vc20241-workspace-controls')){
   const c=d.createElement('div');c.id='vc20241-workspace-controls';c.className='vc20241-workspace-controls';
   c.innerHTML='<button id="vc20241-right-toggle" type="button" data-vc20241-right aria-label="Cambiar panel derecho">Panel: completo</button><button type="button" data-vc20241-max aria-label="Alternar vídeo máximo">Vídeo máximo</button>';
   const restore=menu.querySelector('.vc2023-return');menu.insertBefore(c,restore||null);
  }
  const card=d.querySelector('#v112-video-drawer>.v112-video-card');
  if(card&&!byId('vc20241-video-tools')){
   const c=d.createElement('div');c.id='vc20241-video-tools';c.className='vc20241-video-tools';
   c.innerHTML='<span>REPRODUCTOR · CÓDIGO SOBRE VÍDEO</span><div><button type="button" data-vc20241-source aria-expanded="false">Fuente / cámara</button><button type="button" data-vc20241-max>Vídeo máximo</button></div>';
   card.querySelector('.v116-source-selector')?.before(c);
  }
  sync();return !!(menu&&card&&brand);
 }
 function onClick(e){const el=e.target?.closest?.('[data-vc20241-right],[data-vc20241-max],[data-vc20241-source],#vc20241-hide-nav,#v11-topbar .v11-menu-toggle');
  if(!el)return;
  if(el.matches('#v11-topbar .v11-menu-toggle')){
   if(!desktop())return; // Preserve native overlay navigation on phones/tablets.
   e.preventDefault();e.stopImmediatePropagation();setLeftHidden(!leftHidden());return;
  }
  if(el.id==='vc20241-hide-nav'&&desktop()){e.preventDefault();e.stopImmediatePropagation();setLeftHidden(true);dFocusMenu();return;}
  if(!active())return;
  if(el.hasAttribute('data-vc20241-right')){e.preventDefault();e.stopImmediatePropagation();cycleRight();return;}
  if(el.hasAttribute('data-vc20241-max')){e.preventDefault();e.stopImmediatePropagation();toggleMax();return;}
  if(el.hasAttribute('data-vc20241-source')){e.preventDefault();e.stopImmediatePropagation();setSourceOpen(!settings.sourceOpen);}
 }
 function dFocusMenu(){doc()?.querySelector('#v11-topbar .v11-menu-toggle')?.focus?.()}
 function onKey(e){if((!e.altKey||!e.shiftKey)||e.ctrlKey||e.metaKey)return;
  if(e.code==='KeyM'&&desktop()){e.preventDefault();setLeftHidden(!leftHidden())}
  if(e.code==='KeyP'&&active()){e.preventDefault();cycleRight()}
 }
 function boot(){if(!doc())return false;settings=read();inject();
  if(!booted){booted=true;
   // Capture is needed because the original hamburger uses an inline handler.
   doc().addEventListener('click',onClick,true);doc().addEventListener('keydown',onKey);
   const view=byId('scout-match-mode');
   if(view&&root.MutationObserver){observer=new root.MutationObserver(()=>{inject();sync()});observer.observe(view,{attributes:true,attributeFilter:['class']});}
   if(root.MutationObserver&&byId('v800-live')){
    menuObserver=new root.MutationObserver(()=>{if(!byId('vc20241-workspace-controls')||!byId('vc20241-video-tools'))inject()});
    menuObserver.observe(byId('v800-live'),{childList:true,subtree:false});
   }
   if(root.MutationObserver&&byId('v11-sidebar')){
    sidebarObserver=new root.MutationObserver(sync);
    sidebarObserver.observe(byId('v11-sidebar'),{attributes:true,attributeFilter:['class']});
   }
   root?.matchMedia?.('(min-width:861px)')?.addEventListener?.('change',sync);
  }
  return true;
 }
 function diagnostics(){return {version:VERSION,active:active(),desktop:desktop(),leftHidden:desktop()&&leftHidden(),settings:{...settings},mounted:!!byId('vc20241-workspace-controls'),hasVideo:!!byId('v800-video-frame'),hasCode:!!byId('v113-video-code'),hasCourt:!!byId('vc1613-board'),hasOriginalScore:!!byId('v800-score-us'),changesScouting:false,changesSync:false}}
 return {VERSION,normalize,boot,inject,sync,setLeftHidden,setRight,cycleRight,toggleMax,setSourceOpen,diagnostics};
});
