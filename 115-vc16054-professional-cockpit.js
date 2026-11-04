/* Volley Coach V16.0.5.4 · Professional Match Cockpit
   Presentation only: rearranges the real court, video, coding and stats nodes.
   Never changes actions, scores, MatchState, cloud sync or stored rally data.
*/
(()=>{
 'use strict';
 if(window.VC_16054_COCKPIT)return;
 const $=id=>document.getElementById(id);
 const movement=new Map();
 let mounted=false, courtSide='ours', syncScheduled=false, moves=0, restores=0;
 const route=()=>!!$('scout-match-mode')?.classList.contains('active');
 const inVideo=()=>route()&&$('v800-shell')?.dataset.vc52Mode==='video';
 function remember(node){if(!node||movement.has(node))return;const marker=document.createComment('vc54-origin:'+ (node.id||node.className)); node.parentNode?.insertBefore(marker,node);movement.set(node,marker)}
 function to(node,container){if(!node||!container)return;remember(node);if(node.parentElement!==container){container.appendChild(node);moves++}}
 function restoreAll(){movement.forEach((marker,node)=>{if(marker.parentNode && node.parentElement!==marker.parentNode){marker.parentNode.insertBefore(node,marker.nextSibling);restores++}})}
 function mount(){
  const live=$('v800-live'),drawer=$('v112-video-drawer');if(!live||!drawer)return false;
  let op=$('vc54-operation-bar');
  if(!op){
   op=document.createElement('section');op.id='vc54-operation-bar';op.className='vc54-operation-bar';op.setAttribute('aria-label','Estado del partido en directo');
   op.innerHTML=`<div class="vc54-live-indicator"><i aria-hidden="true"></i><span>PARTIDO ACTIVO</span></div>
     <div class="vc54-operation"><small>SET</small><strong id="vc54-set-copy">—</strong></div>
     <div class="vc54-operation"><small>ROTACIÓN</small><strong id="vc54-rotation-copy">—</strong></div>
     <div class="vc54-operation"><small>SAQUE</small><strong id="vc54-service-copy">—</strong></div>
     <div class="vc54-operation"><small>RALLY</small><strong id="vc54-rally-copy">—</strong></div>
     <div class="vc54-operation vc54-clock"><small>TIEMPO</small><strong id="vc54-clock-copy">00:00</strong></div>`;
   const tab=$('vc52-modes');tab?.parentNode?.insertBefore(op,tab);
  }
  let bottom=$('vc54-bottom');
  if(!bottom){
   bottom=document.createElement('section');bottom.id='vc54-bottom';bottom.setAttribute('aria-label','Acciones, estadísticas y controles del partido');
   bottom.innerHTML=`<div class="vc54-bottom-head"><strong>Seguimiento del partido</strong><span>Datos del scouting activo</span></div>
      <div id="vc54-bottom-grid"><div id="vc54-rally-slot" class="vc54-bottom-col"></div><div id="vc54-kpi-slot" class="vc54-bottom-col"></div><div id="vc54-set-slot" class="vc54-bottom-col"></div></div>`;
   drawer.insertAdjacentElement('afterend',bottom);
  }
  let courtSlot=$('vc54-court-slot');
  if(!courtSlot){
   courtSlot=document.createElement('div');courtSlot.id='vc54-court-slot';courtSlot.className='vc54-court-slot';
   const code=$('v113-video-code-panel');if(code)drawer.insertBefore(courtSlot,code);else drawer.appendChild(courtSlot);
  }
  const videoCard=drawer.querySelector('.v800-video-card');
  if(videoCard&&!$('vc54-video-settings')){
   const details=document.createElement('details');details.id='vc54-video-settings';details.className='vc54-video-settings';
   details.innerHTML='<summary>Conectar cámara / cambiar fuente <span>Live · Delay · Archivo · YouTube</span></summary>';
   const frame=$('v800-video-frame');if(frame)frame.insertAdjacentElement('afterend',details);else videoCard.appendChild(details);
  }
  const codePanel=$('v113-video-code-panel');
  if(codePanel&&!$('vc54-code-keypad')){
   const pad=document.createElement('section');pad.id='vc54-code-keypad';pad.className='vc54-code-keypad';
   pad.innerHTML='<div class="vc54-pad-head">JUGADOR <span>Pulsa dorsal + fundamento + valoración</span></div><div id="vc54-number-keys" class="vc54-key-grid"></div><div class="vc54-pad-head">FUNDAMENTO</div><div id="vc54-skill-keys" class="vc54-key-grid"></div><div class="vc54-pad-head">VALORACIÓN</div><div id="vc54-eval-keys" class="vc54-key-grid"></div>';
   const entry=codePanel.querySelector('.v113-video-code-entry');entry?.insertAdjacentElement('beforebegin',pad);
   const make=(area,items,kind)=>{
    const host=$(area);for(const item of items){
     const button=document.createElement('button');button.type='button';button.textContent=item;
     button.dataset.vc54Key=kind;button.dataset.vc54Value=String(item);
     button.addEventListener('click',()=>pickCode(kind,String(item)));
     host?.appendChild(button);
    }
   };
   make('vc54-number-keys',Array.from({length:12},(_,i)=>String(i+1)),'number');
   make('vc54-skill-keys',['S','R','A','B','D','E'],'skill');
   make('vc54-eval-keys',['#','+','=','-','/'],'eval');
   const old=codePanel.querySelector('.v113-video-presets');
   if(old){
    const more=document.createElement('details');more.id='vc54-presets-more';more.className='vc54-presets-more';more.innerHTML='<summary>Atajos de registro inmediato</summary>';
    old.parentNode?.insertBefore(more,old);more.appendChild(old);
   }
  }
  const court=document.querySelector('#scout-match-mode .v800-court-card');
  if(court&&!$('vc54-court-toggle')){
   const head=court.querySelector('.v800-card-head');
   const b=document.createElement('button');b.type='button';b.id='vc54-court-toggle';b.className='vc54-court-toggle';b.textContent='Ver pista rival';
   b.addEventListener('click',()=>{courtSide=courtSide==='ours'?'rival':'ours';updateCourtSide()});head?.appendChild(b);
  }
  mounted=true;return true;
 }
 const draft={number:'',skill:'',eval:''};
 function pickCode(kind,value){
  draft[kind]=value;
  if(kind==='number'){const n=$('v113-video-number');if(n){n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}))}}
  const select=$('v113-video-team-select');
  const number=draft.number||String($('v113-video-number')?.value||'').trim();
  const prefix=select?.value==='opponent'?'R':'';
  const input=$('v113-video-code');
  if(input){input.value=prefix+number+draft.skill+draft.eval;input.dispatchEvent(new Event('input',{bubbles:true}))}
  document.querySelectorAll('#vc54-code-keypad [data-vc54-key]').forEach(el=>{
   el.classList.toggle('active',draft[el.dataset.vc54Key]===el.dataset.vc54Value);
   el.setAttribute('aria-pressed',String(draft[el.dataset.vc54Key]===el.dataset.vc54Value));
  });
 }
 function updateCourtSide(){const court=$('vc54-court-slot');court?.classList.toggle('vc54-show-rival',courtSide==='rival');const b=$('vc54-court-toggle');if(b)b.textContent=courtSide==='rival'?'Ver nuestra pista':'Ver pista rival'}
 function syncReadouts(){
  if(!mounted)return;
  const read=(id)=>($(id)?.textContent||'—').trim();
  const values={
   'vc54-set-copy':read('v800-set-label'),
   'vc54-rotation-copy':read('v800-rotation-title').split('·')[0].trim(),
   'vc54-service-copy':read('v800-service-copy'),
   'vc54-rally-copy':read('v800-rally-chip'),
   'vc54-clock-copy':read('v800-clock')
  };
  for(const [id,value] of Object.entries(values)){const el=$(id);if(el&&el.textContent!==value)el.textContent=value}
 }
 function scheduleReadouts(){if(syncScheduled)return;syncScheduled=true;requestAnimationFrame(()=>{syncScheduled=false;syncReadouts()})}
 function apply(){
  if(!mount())return;
  document.body.classList.toggle('vc54-match-active',route());
  const on=inVideo();const shell=$('v800-shell');shell?.classList.toggle('vc54-cockpit-active',on);
  if(on){
   to(document.querySelector('#scout-match-mode .v800-court-card'),$('vc54-court-slot'));
   for(const id of ['v116-source-selector','v116-delay-tools','v803-mobile-tools','v802-local-tools','v802-youtube-tools','v802-video-help','v800-rec-copy'])to($(id),$('vc54-video-settings'));
   to($('v113-video-rally'),$('vc54-rally-slot'));
   to(document.querySelector('#scout-match-mode .v800-kpi-card'),$('vc54-kpi-slot'));
   to(document.querySelector('#scout-match-mode .v112-set-card'),$('vc54-set-slot'));
   updateCourtSide();
  }else restoreAll();
  scheduleReadouts();
 }
 function boot(){
  if(!mount())return;
  const view=$('scout-match-mode'),shell=$('v800-shell');
  if(view)new MutationObserver(apply).observe(view,{attributes:true,attributeFilter:['class']});
  if(shell)new MutationObserver(apply).observe(shell,{attributes:true,attributeFilter:['class','data-vc52-mode']});
  ['v800-set-label','v800-rotation-title','v800-service-copy','v800-rally-chip','v800-clock'].forEach(id=>{
   const node=$(id);if(node)new MutationObserver(scheduleReadouts).observe(node,{childList:true,characterData:true,subtree:true});
  });
  apply();
 }
 window.VC_16054_COCKPIT={version:'16.0.5.4',apply,diagnostics:()=>({mounted,active:inVideo(),courtMoved:$('vc54-court-slot')?.contains(document.querySelector('.v800-court-card'))||false,presenceCounter:!!$('vc52-peer-count'),moves,restores,route:route()})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
