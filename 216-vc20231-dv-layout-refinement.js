/* Volley Coach V20.2.3.1 · Data Volley Layout Refinement.
 * VISUAL ONLY: collapsible global sidebar + collapsible native scouting panel.
 * No secondary code entry, scoring engine, video instance or synchronization writes.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});else api.boot();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const VERSION='20.2.3.1';
 const PANEL_MODES=Object.freeze(['open','compact','hidden']);
 const NAV_KEY='vc20231.nav.collapsed';
 const PANEL_KEY='vc20231.scouting.panel';
 const $=id=>root?.document?.getElementById?.(id)||null;
 const isDesktop=()=>!!(root?.matchMedia?.('(min-width: 861px)').matches);
 const isScouting=()=>!!$('scout-match-mode')?.classList?.contains('active');
 let userNavPreference=false, navCollapsed=false, panelMode='open', booted=false, lastScouting=false;
 function getPref(key){try{return root?.localStorage?.getItem(key)||null}catch(_){return null}}
 function putPref(key,value){try{root?.localStorage?.setItem(key,value)}catch(_){}}
 function validPanel(v){return PANEL_MODES.includes(v)?v:'open'}
 function setNav(collapsed,save){
  navCollapsed=!!collapsed;
  const body=root?.document?.body;
  if(body)body.classList.toggle('vc20231-nav-collapsed',navCollapsed);
  const toggle=root?.document?.querySelector?.('.v11-menu-toggle');
  if(toggle){
    if(isDesktop()){
      const label=navCollapsed?'Mostrar navegación lateral':'Ocultar navegación lateral';
      toggle.setAttribute('aria-label',label);toggle.title=label;
      toggle.setAttribute('aria-expanded',String(!navCollapsed));
      toggle.textContent=navCollapsed?'☰':'⇤';
    }else{
      toggle.setAttribute('aria-label','Abrir navegación');toggle.title='Abrir navegación';
      toggle.textContent='☰';
    }
  }
  if(save){userNavPreference=true;putPref(NAV_KEY,navCollapsed?'1':'0')}
  return navCollapsed;
 }
 function setPanel(value,save){
  panelMode=validPanel(value);
  const view=$('scout-match-mode'),drawer=$('v112-video-drawer');
  if(view)view.dataset.vc20231Panel=panelMode;
  if(drawer)drawer.dataset.vc20231Panel=panelMode;
  const group=$('vc20231-panel-controls');
  if(group)for(const button of group.querySelectorAll('[data-vc20231-panel]')){
   const selected=button.dataset.vc20231Panel===panelMode;
   button.setAttribute('aria-pressed',String(selected));button.classList.toggle('is-active',selected);
  }
  const status=$('vc20231-panel-status');
  if(status)status.textContent=panelMode==='open'?'Código y pista visibles':panelMode==='compact'?'Panel compacto · pista disponible':'Solo vídeo · abrir panel para codificar';
  if(save)putPref(PANEL_KEY,panelMode);
  return panelMode;
 }
 function ensureToolbar(){
  const drawer=$('v112-video-drawer');
  if(!drawer||$('vc20231-layoutbar'))return !!$('vc20231-layoutbar');
  const bar=root.document.createElement('div');bar.id='vc20231-layoutbar';bar.className='vc20231-layoutbar';
  bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Disposición del Scouting Pro');
  // Buttons only change CSS. They never call registration, scoring, recording or cloud APIs.
  bar.innerHTML='<div class="vc20231-layout-label"><b>SCOUTING PRO</b><small id="vc20231-panel-status">Código y pista visibles</small></div>'+
   '<div class="vc20231-panel-controls" id="vc20231-panel-controls">'+
   '<button type="button" data-vc20231-panel="open" aria-pressed="true" aria-label="Mostrar vídeo, código y pista" title="Vídeo, código y pista">▣ <span>Vídeo + scouting</span></button>'+
   '<button type="button" data-vc20231-panel="compact" aria-pressed="false" aria-label="Mostrar panel de scouting compacto" title="Panel derecho compacto">◧ <span>Compacto</span></button>'+
   '<button type="button" data-vc20231-panel="hidden" aria-pressed="false" aria-label="Ocultar panel derecho y maximizar vídeo" title="Ocultar panel derecho y maximizar vídeo">▢ <span>Solo vídeo</span></button>'+
   '</div>';
  drawer.prepend(bar);
  bar.addEventListener('click',event=>{
   const button=event.target.closest?.('[data-vc20231-panel]');
   if(button)setPanel(button.dataset.vc20231Panel,true);
  });
  return true;
 }
 function refine(){
  if(!isScouting())return false;
  ensureToolbar();setPanel(panelMode,false);
  const versionBadge=$('vc2023-menubar')?.querySelector('.vc2023-readonly');
  if(versionBadge&&versionBadge.textContent!=='V20.2.3.1')versionBadge.textContent='V20.2.3.1';
  const body=root?.document?.body;
  if(body)body.classList.add('vc20231-scouting-active');
  return true;
 }
 function refresh(){
  const current=isScouting();
  root?.document?.body?.classList.toggle('vc20231-scouting-active',current);
  if(current&&!lastScouting&&!userNavPreference&&isDesktop())setNav(true,false);
  if(current)refine();
  lastScouting=current;
  return current;
 }
 function clickNav(event){
  if(!isDesktop())return; // preserve the original mobile sidebar drawer and overlay
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  setNav(!navCollapsed,true);
 }
 function boot(){
  if(booted)return true;
  const toggle=root?.document?.querySelector?.('.v11-menu-toggle');
  if(!toggle||!$('v11-sidebar'))return false;
  booted=true;
  const prior=getPref(NAV_KEY);userNavPreference=prior==='1'||prior==='0';
  navCollapsed=userNavPreference?prior==='1':isScouting()&&isDesktop();
  panelMode=validPanel(getPref(PANEL_KEY)||'open');
  setNav(navCollapsed,false);
  toggle.addEventListener('click',clickNav,true);
  root?.addEventListener?.('resize',()=>setNav(navCollapsed,false),{passive:true});
  const match=$('scout-match-mode');
  if(match&&root.MutationObserver){const observer=new root.MutationObserver(refresh);observer.observe(match,{attributes:true,attributeFilter:['class']});}
  const originalSetMode=root?.vc52SetMode;
  // Listen to the existing view attribute rather than wrapping operational routing functions.
  const shell=$('v800-shell');
  if(shell&&root.MutationObserver){const observer=new root.MutationObserver(()=>{if(isScouting())refine()});observer.observe(shell,{attributes:true,attributeFilter:['data-vc52-mode']});}
  refresh();
  root.VC20231_LAYOUT=Object.freeze({VERSION,MODES:PANEL_MODES,setNav,setPanel,refresh,diagnostics:()=>({version:VERSION,navCollapsed,panelMode,scoutingActive:isScouting(),toolbarMounted:!!$('vc20231-layoutbar'),videoRetained:!!$('v800-video-frame'),codeRetained:!!$('v113-video-code'),courtRetained:!!$('vc1613-board'),scoreRetained:!!$('v800-score-us'),usingNativeRouter:root?.vc52SetMode===originalSetMode})});
  return true;
 }
 return {VERSION,PANEL_MODES,validPanel,boot,refresh,setNav,setPanel,ensureToolbar,diagnostics:()=>root?.VC20231_LAYOUT?.diagnostics?.()||{version:VERSION,booted}};
});
