/* Volley Coach V18.4.5 · Final visual consolidation of Video Studio.
 * Presentation only: reuses current controls and video elements, does not start/stop
 * camera, change scouting state, record clips, write cloud data or alter IndexedDB.
 */
(function(root, factory){
 'use strict';
 const api=factory();
 if(typeof module==='object' && module.exports) module.exports=api;
 if(root && root.document) api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.4.5';
 const text=v=>String(v??'').trim();
 function createGroup(doc,name,title,subtitle){
  const group=doc.createElement('section');
  group.className='vc1845-capture-group';group.dataset.vc1845Group=name;
  const heading=doc.createElement('div');heading.className='vc1845-group-heading';
  const label=doc.createElement('strong');label.textContent=title;heading.append(label);
  if(subtitle){const sub=doc.createElement('small');sub.textContent=subtitle;heading.append(sub)}
  group.append(heading);return group;
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   const $=id=>doc.getElementById(id),studio=$('scout-video-hub');
   if(!studio || !studio.classList.contains('vc183-ready') || !root.VC_VIDEO_WORKSPACES_1830) return false;
   if(root.VC_VIDEO_POLISH_1845) return true;
   const capture=$('vc183-capture-side'),nav=$('vc183-navigation');
   if(!capture||!nav||!$('v780-video-frame'))return false;
   const versionLabel=nav.querySelector('.vc183-nav-caption');
   if(versionLabel)versionLabel.textContent='VIDEO STUDIO PRO · V18.4.5 · 4 ESPACIOS';
   // Move EXISTING controls without cloning: listeners on capture and video stay intact.
   const source=createGroup(doc,'source','Fuente de vídeo','Una cámara compartida para Live y Delay');
   const delay=createGroup(doc,'delay','Delay continuo','Revisa sin detener la captura');
   const recording=createGroup(doc,'record','Grabación local','Se guarda en este dispositivo');
   const advanced=doc.createElement('div');advanced.className='vc1845-advanced';
   const move=(node,parent)=>{if(node)parent.append(node)};
   move(capture.querySelector('.vc183-headline'),source);
   move(capture.querySelector('.vc183-source-select'),source);
   move(capture.querySelector('.vc183-capture-buttons'),source);
   move(capture.querySelector('.vc183-signal'),source);
   const actions=capture.querySelector('.vc183-capture-actions');
   if(actions){
    const config=actions.querySelector('[data-vc183-action="configure"]');
    const returnDelay=actions.querySelector('[data-vc183-action="return"]');
    const oldLibrary=actions.querySelector('[data-vc183-action="recordings"]');
    if(config){const wrap=doc.createElement('div');wrap.className='vc1845-inline-actions';wrap.append(config);source.append(wrap)}
    move(returnDelay,delay);
    if(oldLibrary)oldLibrary.hidden=true; // Videoteca has its own main navigation tab.
    actions.remove();
   }
   move(capture.querySelector('.vc183-linked-switch'),delay);
   move(capture.querySelector('.vc183-delay-presets'),delay);
   // Keep controls in a logical order regardless of their previous DOM placement.
   const returnButton=delay.querySelector('[data-vc183-action="return"]');
   if(returnButton)delay.append(returnButton);
   move(capture.querySelector('.vc183-record-controls'),recording);
   move(capture.querySelector('#vc183-note'),advanced);
   for(const node of Array.from(capture.children))advanced.append(node);
   capture.replaceChildren(source,delay,recording,advanced);
   const chrome=$('vc181-chrome');
   if(chrome){chrome.dataset.vc1845='polished'}
   const heading=$('vc183-screen-heading');
   if(heading)heading.classList.add('vc1845-screen-heading');
   // Existing review navigation already has Open Clips, file, YouTube and filters.
   // Add a contextual, functional return to scouting only when that route exists.
   const reviewActions=$('vc183-review-actions');
   if(reviewActions && !reviewActions.querySelector('[data-vc1845-action]')){
    const button=doc.createElement('button');button.type='button';
    button.textContent='Volver al scouting';button.dataset.vc1845Action='scouting';
    reviewActions.append(button);
    button.addEventListener('click',()=>{
      const route=root.VC17_WORKSPACE?.route;
      if(typeof route==='function'){
       try{route('scout-match-mode','matches')}catch(_){/* route unavailable for this workspace */}
      }
    });
    function refreshRoute(){button.hidden=typeof root.VC17_WORKSPACE?.route!=='function'}
    refreshRoute();
    const onNav=()=>refreshRoute();nav.addEventListener('click',onNav);
   }
   // Keep the actual local catalog; filter its existing rows, not a parallel store.
   const libraryHeading=$('vc183-library-heading'),rowsContainer=$('vc17100-library-list');
   let applyLibrary=()=>{};
   if(libraryHeading && rowsContainer){
    const wrap=doc.createElement('div');wrap.className='vc1845-library-search';
    const label=doc.createElement('label');label.htmlFor='vc1845-library-query';label.textContent='Buscar grabación';
    const input=doc.createElement('input');input.type='search';input.id='vc1845-library-query';
    input.placeholder='Nombre, equipo, fecha…';input.autocomplete='off';
    const count=doc.createElement('span');count.id='vc1845-library-count';count.setAttribute('aria-live','polite');
    wrap.append(label,input,count);libraryHeading.append(wrap);
    applyLibrary=()=>{
      const query=text(input.value).toLocaleLowerCase('es');
      const items=Array.from(rowsContainer.querySelectorAll('.vc17100-recording'));
      let visible=0;
      for(const item of items){const matches=!query||item.textContent.toLocaleLowerCase('es').includes(query);item.hidden=!matches;if(matches)visible++}
      const label=`${visible} de ${items.length} grabaciones`;if(count.textContent!==label)count.textContent=label;
    };
    input.addEventListener('input',applyLibrary);
    if(root.MutationObserver)new root.MutationObserver(applyLibrary).observe(rowsContainer,{childList:true});
    applyLibrary();
   }
   studio.classList.add('vc1845-ready');
   studio.dataset.vc1845Version=VERSION;
   root.VC_VIDEO_POLISH_1845={version:VERSION,refreshLibrary:applyLibrary,diagnostics:()=>({
    version:VERSION,ready:studio.classList.contains('vc1845-ready'),
    screens:nav.querySelectorAll('[data-vc183-screen]').length,
    captureGroups:capture.querySelectorAll('[data-vc1845-group]').length,
    playerCount:studio.querySelectorAll('#v780-player-video').length,
    liveCount:studio.querySelectorAll('#v117-review-stream').length,
    recordersReplaced:false,syncEngineModified:false
   })};
   return true;
  }
  let attempts=0;
  function bootstrap(){if(start())return;if(++attempts<80)root.setTimeout?.(bootstrap,250)}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();
  return true;
 }
 return {VERSION,createGroup,mount};
});
