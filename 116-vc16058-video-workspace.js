(()=>{
'use strict';
/* V16.0.5.8 Video Workspace. Controls visibility only; never creates/replaces a media
   element, starts/stops tracks, changes video currentTime, or writes to match storage. */
const root=document.getElementById('scout-video-hub');
if(!root)return;
const $=id=>document.getElementById(id);
const options=['player','analysis'];
let changeCount=0;
let movedMatch=false;
function attachMatchSelector(){
 if(movedMatch)return;
 const origin=root.querySelector('.v780-toolbar'),slot=$('vc58-match-slot');
 const label=origin?.querySelector('label');
 if(!label||!slot||!label.contains($('v780-match')))return;
 slot.appendChild(label);movedMatch=true; // only moves the SELECT once; media DOM remains untouched
}
function setTab(next,{focus=false}={}){
 const tab=options.includes(next)?next:'player';
 if(root.dataset.vc58Tab!==tab){root.dataset.vc58Tab=tab;changeCount++}
 const player=$('vc58-tab-player'),analysis=$('vc58-tab-analysis');
 for(const [name,btn] of [['player',player],['analysis',analysis]]){
  if(!btn)continue;
  const active=name===tab;
  btn.setAttribute('aria-selected',active?'true':'false');btn.tabIndex=active?0:-1;
 }
 if(focus)(tab==='player'?player:analysis)?.focus();
 const help=$('vc58-context-copy');
 if(help)help.textContent=tab==='player'
  ?'Configura cámara, QR, archivo, grabación y delay sin salir del reproductor.'
  :'Filtra las acciones, abre una jugada y guarda o exporta sus referencias de vídeo.';
 return tab;
}
function toggleMap(){
 const map=root.querySelector('.v781-set-map-panel'),btn=$('vc58-map-toggle');
 if(!map||!btn)return false;
 const shown=!map.classList.contains('vc58-map-open');
 map.classList.toggle('vc58-map-open',shown);btn.setAttribute('aria-expanded',shown?'true':'false');
 btn.textContent=shown?'Ocultar mapa de sets':'▤ Mapa de sets';
 return shown;
}
function bindKeys(){
 const tabs=root.querySelector('.vc58-tabbar');
 tabs?.addEventListener('keydown',e=>{
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  if(!e.target?.closest('[role="tab"]'))return;
  e.preventDefault();setTab(root.dataset.vc58Tab==='player'?'analysis':'player',{focus:true});
 });
}
attachMatchSelector();bindKeys();
// On every new navigation into Vídeo default to player only when explicitly requested,
// but tab switches preserve their own current state and never reopen the video.
setTab('player');
window.vc58SetVideoTab=(tab)=>setTab(tab);
window.vc58ToggleMap=toggleMap;
window.VC_VIDEO_WORKSPACE={version:'16.0.5.8',setTab,openPlayer:()=>setTab('player'),openAnalysis:()=>setTab('analysis'),diagnostics:()=>({tab:root.dataset.vc58Tab,changes:changeCount,mediaElementCount:root.querySelectorAll('#v780-player-video').length,streamElementCount:root.querySelectorAll('#v117-review-stream').length,videoContainer:!!$('v780-video-frame'),matchSelectorMoved:movedMatch})};
})();
