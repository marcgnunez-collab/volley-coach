/* Volley Coach V16.1.5.7 — Inline DataVolley zone keypad.
   One board in the existing coding panel. Changes the draft code only;
   neither adds actions nor writes match data. No global subtree observers. */
(()=>{
'use strict';
if(window.VC_1613_ZONE_BOARD)return;
const $=id=>document.getElementById(id);
const ZONES=[4,3,2,7,8,9,5,6,1];
const state={zone:'',sub:'',mode:'destination',manualMode:false,lastSkill:'',lastInput:null,updates:0};

function codeInput(){
 const panel=$('v113-video-code-panel'),input=$('v113-video-code');
 if(input&&panel&&panel.getClientRects().length)return input;
 if(state.lastInput?.isConnected&&state.lastInput.getClientRects().length)return state.lastInput;
 return $('v800-code')||input||$('scout-code-input')||null;
}
function skillOf(code){return String(code||'').trim().toUpperCase().match(/^(?:R)?\d+([SRAEBDFC])/)?.[1]||''}
function labelForMode(){
 const skill=skillOf(codeInput()?.value);
 return state.mode==='origin'?'Origen':(['R','D'].includes(skill)?'Contacto':'Destino');
}
function token(){return state.zone?`${state.zone}${state.sub}`:''}
function label(){return state.zone?`Z${token()}`:'Sin zona'}
function setStatus(msg,kind=''){const el=$('vc1613-board-status');if(el){if(el.textContent!==msg)el.textContent=msg;el.dataset.kind=kind;}}

/* Do not edit any trailing Data Volley modifiers, such as tempo, serve type,
   set/attack code, phase, blockers or custom code. Location syntax is .O>D,
   or .D for a single destination/contact point. */
function replaceLocation(code,zone,mode='destination',previousMode=''){
 const raw=String(code||'').trim().toUpperCase().replace(/\s+/g,'');
 if(!raw||!zone)return raw;
 const idx=raw.search(/[~:%|*^@&?$]/);
 const head=idx<0?raw:raw.slice(0,idx),tail=idx<0?'':raw.slice(idx);
 const p=head.indexOf('.'),base=p<0?head:head.slice(0,p);
 const loc=p<0?'':head.slice(p+1);
 if(!base)return raw;
 let updated='';
 if(mode==='origin'){
   if(loc.includes('>'))updated=`${zone}>${loc.split('>').slice(1).join('>')}`;
   else if(loc&&previousMode==='destination')updated=`${zone}>${loc}`;
   else updated=zone;
 }else{
   if(loc.includes('>'))updated=`${loc.split('>')[0]}>${zone}`;
   else if(loc&&previousMode==='origin')updated=`${loc}>${zone}`;
   else updated=zone;
 }
 return `${base}.${updated}${tail}`;
}
function detectContext(){
 const input=codeInput();if(!input)return;
 const skill=skillOf(input.value);
 if(skill!==state.lastSkill){
  state.lastSkill=skill;state.manualMode=false;
  state.mode=skill==='B'?'origin':'destination';
 }
 const heading=$('vc1613-mode-desc');
 if(heading)heading.textContent=`${labelForMode()} del balón · clic para completar el código`;
 const selected=$('vc1613-current-token');if(selected)selected.textContent=label();
 const modeLabels=$('vc1613-modes');
 if(modeLabels){
  for(const button of modeLabels.querySelectorAll('[data-location-mode]')){
    const selectedMode=button.dataset.locationMode===state.mode;
    button.classList.toggle('selected',selectedMode);button.setAttribute('aria-pressed',String(selectedMode));
    if(button.dataset.locationMode==='destination')button.textContent=['R','D'].includes(skill)?'Contacto':'Destino';
  }
 }
}
function applyZone(zone,sub=''){
 const input=codeInput(),previousMode=state.lastMode;
 state.zone=String(zone);state.sub=String(sub);
 document.querySelectorAll('#vc1613-board [data-zone]').forEach(btn=>{
  const on=btn.dataset.zone===state.zone&&(btn.dataset.sub||'')===state.sub;
  btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));
 });
 detectContext();
 if(!input || !input.value.trim()){
  setStatus(`${label()} elegida. Escribe primero el dorsal, fundamento y valoración.`, 'hint');
  return false;
 }
 const before=input.value,after=replaceLocation(before,token(),state.mode,previousMode);
 if(before!==after){
  input.value=after;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  state.updates++;
 }
 state.lastMode=state.mode;
 state.lastInput=input;
 detectContext();
 setStatus(`${label()} aplicada · ${after} · pulsa Enter o Añadir cuando esté listo.`, 'ok');
 try{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}catch(_){}
 return true;
}
function reset(){
 state.zone='';state.sub='';state.lastMode='';
 document.querySelectorAll('#vc1613-board [data-zone].selected').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});
 detectContext();setStatus('Sin zona seleccionada. El código existente no se ha borrado.');
}
function boardMarkup(){
 return `<section id="vc1613-board" class="vc1613-inline-board" aria-label="Teclado de zonas DataVolley">
 <header class="vc1613-header"><div><strong>PISTA INTERACTIVA · 9×4</strong><small id="vc1613-mode-desc">Destino del balón · clic para completar el código</small></div><span id="vc1613-current-token">Sin zona</span></header>
 <div id="vc1613-modes" class="vc1613-modes" role="group" aria-label="Tipo de localización"><button type="button" data-location-mode="destination" aria-pressed="true">Destino</button><button type="button" data-location-mode="origin" aria-pressed="false">Origen</button><button type="button" id="vc1613-clear-selection">Limpiar selección</button></div>
 <div class="vc1613-court-grid" aria-label="Zonas y subzonas de la pista">${ZONES.map(z=>`<div class="vc1613-cell"><button type="button" class="vc1613-zone" data-zone="${z}" data-sub="" aria-pressed="false" aria-label="Zona ${z}">Z${z}</button><div class="vc1613-quads">${['A','B','C','D'].map(sub=>`<button type="button" data-zone="${z}" data-sub="${sub}" aria-pressed="false" aria-label="Zona ${z}, subzona ${sub}">${sub}</button>`).join('')}</div></div>`).join('')}</div>
 <p class="vc1613-status" id="vc1613-board-status" role="status">Escribe el código y pulsa una zona. No guarda hasta pulsar Añadir.</p>
 </section>`;
}
function injectStyle(){
 if($('vc1613-zone-board-style'))return;
 const s=document.createElement('style');s.id='vc1613-zone-board-style';s.textContent=`
/* Scoped to the existing right-side coding panel. The video grid is untouched. */
#scout-match-mode #vc54-code-keypad{display:none!important}
#scout-match-mode #vc1613-board{display:block!important;position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;background:#f6faff!important;border:1px solid #ccdae9!important;border-radius:11px!important;padding:9px!important;margin:10px 0!important;box-sizing:border-box!important;color:#233e5d!important;flex:none!important;order:0!important}
#scout-match-mode #vc1613-board *{box-sizing:border-box!important}
#scout-match-mode .vc1613-header{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:7px}
#scout-match-mode .vc1613-header strong{display:block;color:#174776;font:850 10px/1.2 system-ui,sans-serif!important;letter-spacing:.06em}
#scout-match-mode .vc1613-header small{display:block;color:#6a8199;font:600 9px/1.25 system-ui,sans-serif!important;margin-top:3px}
#scout-match-mode #vc1613-current-token{font:850 11px system-ui,sans-serif!important;white-space:nowrap;background:#dbeaf8!important;color:#154877!important;border-radius:99px;padding:5px 8px}
#scout-match-mode .vc1613-modes{display:grid;grid-template-columns:1fr 1fr auto;gap:4px;margin-bottom:7px}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-modes button{background:#fff!important;color:#45677f!important;border:1px solid #cbdbea!important;font:750 10px/1.1 system-ui,sans-serif!important;border-radius:6px!important;min-height:29px!important;min-width:0!important;padding:5px 7px!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-modes button.selected{background:#185b9b!important;color:white!important;border-color:#185b9b!important}
#scout-match-mode .vc1613-court-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;min-width:0!important}
#scout-match-mode .vc1613-cell{background:#fff!important;display:grid!important;gap:3px!important;padding:3px!important;border:1px solid #ccdae8!important;border-radius:7px!important;min-width:0!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-zone{min-height:22px!important;padding:2px!important;font:850 11px/1 system-ui,sans-serif!important;border:0!important;background:#eaf2fb!important;color:#2a577f!important;border-radius:4px!important}
#scout-match-mode .vc1613-quads{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:2px!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-quads button{min-width:0!important;min-height:25px!important;padding:3px 1px!important;border:1px solid #dfebf5!important;background:#fff!important;color:#547089!important;border-radius:4px!important;font:800 10px/1.1 system-ui,sans-serif!important}
body.v11-shell #scout-match-mode #vc1613-board button.selected:not([data-location-mode]){background:#226bb0!important;color:white!important;border-color:#226bb0!important}
body.v11-shell #scout-match-mode #vc1613-board button:focus-visible{outline:3px solid #92bfe9!important;outline-offset:1px!important}
#scout-match-mode #vc1613-board .vc1613-status{min-height:16px;margin:6px 0 0!important;color:#647e97;font:650 9px/1.4 system-ui,sans-serif!important;overflow-wrap:anywhere}
#scout-match-mode #vc1613-board .vc1613-status[data-kind="ok"]{color:#257144!important}
#scout-match-mode #vc1613-board .vc1613-status[data-kind="hint"]{color:#966c28!important}
@media(max-width:680px){#scout-match-mode #vc1613-board{padding:7px!important}body.v11-shell #scout-match-mode #vc1613-board .vc1613-quads button{min-height:30px!important}}
`;
 document.head.appendChild(s);
}
function mount(){
 const panel=$('v113-video-code-panel');if(!panel)return false;
 injectStyle();
 const keypad=$('vc54-code-keypad'),entry=panel.querySelector('.v113-video-code-entry');
 let board=$('vc1613-board');
 if(!board){
   const d=document.createElement('div');d.innerHTML=boardMarkup();board=d.firstElementChild;
 }
 if(entry){
  if(board.previousElementSibling!==entry)entry.insertAdjacentElement('afterend',board);
 }else if(keypad&&keypad.parentElement===panel){
  if(board.previousElementSibling!==keypad)keypad.insertAdjacentElement('afterend',board);
 }
 if(board.dataset.bound!=='1'){
  board.dataset.bound='1';
  board.addEventListener('click',e=>{
   const z=e.target.closest('[data-zone]');
   if(z){applyZone(z.dataset.zone,z.dataset.sub||'');return;}
   const mode=e.target.closest('[data-location-mode]');
   if(mode){state.mode=mode.dataset.locationMode;state.manualMode=true;detectContext();return;}
   if(e.target.closest('#vc1613-clear-selection'))reset();
  });
 }
 for(const id of ['v113-video-code','v800-code','scout-code-input']){
  const input=$(id);if(!input||input.dataset.vc16157Bound)return;
  input.dataset.vc16157Bound='1';
  input.addEventListener('focus',()=>{state.lastInput=input;detectContext()});
  input.addEventListener('input',()=>{state.lastInput=input;detectContext()});
 }
 detectContext();
 return true;
}
// The original keypad is mounted by the existing match workspace on demand.
// Observe only direct additions in its coding panel, not the full app, to avoid
// reintroducing the MutationObserver startup loop fixed in V16.1.5.4.
function attach(){
 const panel=$('v113-video-code-panel');if(!panel)return;
 mount();
 const observer=new MutationObserver(records=>{
  if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.id==='vc54-code-keypad')))mount();
 });
 observer.observe(panel,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.VC_1613_ZONE_BOARD={version:'16.1.6',ensureUI:mount,toggle:()=>true,applySelection:()=>state.zone?applyZone(state.zone,state.sub):false,clearSelection:reset,replaceLocation,diagnostics:()=>({mounted:!!$('vc1613-board'),inline:!!$('vc1613-board')?.closest('#v113-video-code-panel'),code:codeInput()?.value||'',zone:token(),mode:state.mode,updates:state.updates})};
})();
