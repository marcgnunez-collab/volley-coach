(()=>{
'use strict';
if(window.VC_1613_ZONE_BOARD)return;
const VERSION='16.1.3';
const $=id=>document.getElementById(id);
const INPUT_IDS=new Set(['v113-video-code','v800-code','scout-code-input']);
const state={open:false,zone:'',sub:'',lastApplied:''};
const ORDER=[4,3,2,7,8,9,5,6,1];

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function token(zone=state.zone,sub=state.sub){return zone?`${zone}${sub||''}`:''}
function tokenLabel(){return state.zone?`Z${state.zone}${state.sub||''}`:'Sin marcar'}
function openVideoPanelVisible(){
  const panel=$('v113-video-code-panel');
  if(!panel)return false;
  const cs=getComputedStyle(panel);
  return cs.display!=='none' && cs.visibility!=='hidden';
}
function activeInput(){
  const a=document.activeElement;
  if(a&&INPUT_IDS.has(a.id))return a;
  if(openVideoPanelVisible() && $('v113-video-code'))return $('v113-video-code');
  return $('v800-code')||$('scout-code-input')||$('v113-video-code')||null;
}
function status(text,level='info'){
  const box=$('vc1613-board-status');
  if(box){box.textContent=text;box.dataset.level=level;}
  const hint=$('vc1613-zone-hint');
  if(hint){hint.textContent=text;hint.dataset.level=level;}
}
function applyLocationToCode(raw,dest){
  let code=String(raw||'').trim().toUpperCase();
  if(!code)return '';
  const delimChars=['~',':','%','|','*','^','@','&','?','$'];
  let split=code.length;
  for(const ch of delimChars){const i=code.indexOf(ch);if(i!==-1&&i<split)split=i;}
  let prefix=code.slice(0,split);
  const suffix=code.slice(split);
  const dot=prefix.indexOf('.');
  if(dot===-1)return `${prefix}.${dest}${suffix}`;
  const base=prefix.slice(0,dot);
  const loc=prefix.slice(dot+1);
  if(!loc)return `${base}.${dest}${suffix}`;
  if(loc.includes('>')){
    const parts=loc.split('>');
    return `${base}.${parts[0]||''}>${dest}${suffix}`;
  }
  return `${base}.${dest}${suffix}`;
}
function syncInputPreview(){
  const out=$('vc1613-current-token');
  if(out)out.textContent=tokenLabel();
  const btn=$('vc1613-apply-btn');
  const input=activeInput();
  if(btn)btn.disabled=!state.zone || !String(input?.value||'').trim();
}
function selectZone(zone,sub=''){
  state.zone=String(zone||'');
  state.sub=String(sub||'');
  document.querySelectorAll('#vc1613-board [data-zone][data-sub]').forEach(el=>{
    el.classList.toggle('active',el.dataset.zone===state.zone && (el.dataset.sub||'')===state.sub);
  });
  document.querySelectorAll('#vc1613-board [data-zone-main]').forEach(el=>{
    el.classList.toggle('active',el.dataset.zoneMain===state.zone && !state.sub);
  });
  syncInputPreview();
  status(`Destino seleccionado: ${tokenLabel()}.`, 'ok');
}
function clearSelection(){
  state.zone='';state.sub='';state.lastApplied='';
  document.querySelectorAll('#vc1613-board .active').forEach(el=>el.classList.remove('active'));
  syncInputPreview();
  status('Selecciona una zona o subzona y aplícala al código actual.', 'info');
}
function applySelection(){
  if(!state.zone){status('Primero selecciona una zona o subzona.', 'warn');return false;}
  const input=activeInput();
  if(!input){status('No encuentro el campo de código activo.', 'bad');return false;}
  const raw=String(input.value||'').trim();
  if(!raw){
    input.focus({preventScroll:true});
    status('Escribe primero el código base (por ejemplo 7A#) y luego aplica el destino.', 'warn');
    return false;
  }
  const next=applyLocationToCode(raw,token());
  input.value=next;
  state.lastApplied=token();
  syncInputPreview();
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.focus({preventScroll:true});
  status(`Destino ${tokenLabel()} aplicado al código.`, 'ok');
  return true;
}
function boardHtml(){
  const cards=ORDER.map(z=>`<div class="vc1613-zone-card"><button type="button" class="vc1613-zone-main" data-zone-main="${z}">Z${z}</button><div class="vc1613-zone-quads"><button type="button" data-zone="${z}" data-sub="A">A</button><button type="button" data-zone="${z}" data-sub="B">B</button><button type="button" data-zone="${z}" data-sub="C">C</button><button type="button" data-zone="${z}" data-sub="D">D</button></div></div>`).join('');
  return `<div id="vc1613-board" class="vc1613-board" hidden>
    <div class="vc1613-board-head">
      <div><span>PIZARRA INTERACTIVA</span><h4>Marca el destino del balón</h4></div>
      <button type="button" class="vc1613-close" aria-label="Cerrar pizarra">✕</button>
    </div>
    <p class="vc1613-copy">Selecciona la zona o una subzona A–D. La pizarra flota sobre el vídeo y no reduce el tamaño del reproductor.</p>
    <div class="vc1613-current"><span>Destino actual</span><strong id="vc1613-current-token">Sin marcar</strong><button type="button" id="vc1613-apply-btn">Aplicar al código</button></div>
    <div class="vc1613-grid-wrap">
      <div class="vc1613-grid-head"><b>Pista DataVolley 9×4</b><small>9 zonas · 4 subzonas</small></div>
      <div class="vc1613-grid">${cards}</div>
      <div class="vc1613-grid-foot"><span>Si pulsas Z4, Z3… marcas solo la zona.</span><span>A–D = subzonas</span></div>
    </div>
    <div id="vc1613-board-status" class="vc1613-board-status" data-level="info">Selecciona una zona o subzona y aplícala al código actual.</div>
    <div class="vc1613-actions"><button type="button" class="ghost" id="vc1613-clear-btn">Limpiar</button><button type="button" class="ghost" id="vc1613-focus-code-btn">Ir al código</button><button type="button" class="primary" id="vc1613-apply-close-btn">Aplicar y cerrar</button></div>
  </div>`;
}
function injectStyles(){
  if($('vc1613-zone-board-style'))return;
  const style=document.createElement('style');
  style.id='vc1613-zone-board-style';
  style.textContent=`
#scout-match-mode .vc1613-zone-fab{position:absolute;top:10px;right:10px;z-index:7;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(153,198,244,.95)!important;background:rgba(16,51,86,.88)!important;color:#f3f8ff!important;padding:8px 11px!important;border-radius:999px!important;font:800 11px/1 system-ui,sans-serif!important;backdrop-filter:blur(10px);box-shadow:0 8px 24px rgba(3,18,35,.28)!important}
#scout-match-mode .vc1613-zone-fab:hover{background:rgba(22,70,116,.94)!important}
#scout-match-mode .vc1613-zone-hint{margin-top:6px;padding:7px 9px;border-radius:8px;background:#f6faff;border:1px solid #d9e8f4;color:#557086;font:700 10px/1.35 system-ui,sans-serif}
#scout-match-mode .vc1613-zone-hint[data-level="ok"]{background:#edf8f1;color:#266846;border-color:#cae8d7}
#scout-match-mode .vc1613-zone-hint[data-level="warn"]{background:#fff7e8;color:#8d641d;border-color:#edd7ad}
#scout-match-mode .vc1613-zone-hint[data-level="bad"]{background:#fff0ef;color:#9a423b;border-color:#edc1bc}
#scout-match-mode .vc1613-board{position:absolute;top:54px;right:10px;z-index:8;width:min(420px,calc(100% - 20px));max-height:calc(100% - 64px);overflow:auto;background:rgba(255,255,255,.985);border:1px solid #d6e3ee;border-radius:16px;padding:14px;box-shadow:0 24px 60px rgba(7,27,48,.34)}
#scout-match-mode .vc1613-board-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
#scout-match-mode .vc1613-board-head span{display:block;color:#3b7cb2;font-size:10px;font-weight:900;letter-spacing:.09em}
#scout-match-mode .vc1613-board-head h4{margin:3px 0 0!important;color:#153652!important;font-size:18px!important;line-height:1.2}
#scout-match-mode .vc1613-close{min-height:32px!important;min-width:32px!important;padding:0!important;border-radius:999px!important;background:#eff5fb!important;color:#456983!important;border:1px solid #d7e5f0!important;font-weight:900!important}
#scout-match-mode .vc1613-copy{margin:8px 0 10px;color:#6a8093;font-size:11px;line-height:1.45}
#scout-match-mode .vc1613-current{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding:10px;border:1px solid #dce8f2;background:#f7fbff;border-radius:10px;margin-bottom:10px}
#scout-match-mode .vc1613-current span{font-size:10px;font-weight:800;color:#6f8799;text-transform:uppercase;letter-spacing:.06em}
#scout-match-mode .vc1613-current strong{font-size:16px;color:#173b5f}
#scout-match-mode .vc1613-current button,#scout-match-mode .vc1613-actions button{min-height:36px!important;border-radius:9px!important;padding:8px 12px!important;font:800 11px/1.1 system-ui,sans-serif!important;border:1px solid #c7d9ea!important;cursor:pointer}
#scout-match-mode .vc1613-current button:disabled{opacity:.45;cursor:not-allowed}
#scout-match-mode .vc1613-current button,#scout-match-mode .vc1613-actions .primary{background:#195faa!important;color:#fff!important;border-color:#195faa!important}
#scout-match-mode .vc1613-actions .ghost{background:#f5f8fb!important;color:#446581!important;border-color:#d7e3ee!important}
#scout-match-mode .vc1613-grid-wrap{border:1px solid #dbe7f1;border-radius:12px;padding:10px;background:#fbfdff}
#scout-match-mode .vc1613-grid-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:#4d6b84}
#scout-match-mode .vc1613-grid-head b{font-size:12px;color:#193a5f}
#scout-match-mode .vc1613-grid-head small{font-size:10px}
#scout-match-mode .vc1613-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#scout-match-mode .vc1613-zone-card{border:1px solid #cfdce7;border-radius:10px;padding:5px;background:#fff;display:grid;gap:5px}
#scout-match-mode .vc1613-zone-main{min-height:30px!important;border-radius:8px!important;background:#eef5fb!important;color:#295271!important;border:1px solid #d5e4ef!important;font:900 13px/1 system-ui,sans-serif!important}
#scout-match-mode .vc1613-zone-main.active{background:#195faa!important;border-color:#195faa!important;color:#fff!important}
#scout-match-mode .vc1613-zone-quads{display:grid;grid-template-columns:1fr 1fr;gap:4px}
#scout-match-mode .vc1613-zone-quads button{min-height:31px!important;border-radius:8px!important;background:#fff!important;color:#567089!important;border:1px solid #d7e3ee!important;font:850 11px/1 system-ui,sans-serif!important}
#scout-match-mode .vc1613-zone-quads button.active{background:#2e86d7!important;border-color:#2e86d7!important;color:#fff!important;box-shadow:inset 0 -2px rgba(0,0,0,.12)}
#scout-match-mode .vc1613-grid-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:8px;color:#708597;font-size:10px}
#scout-match-mode .vc1613-board-status{margin-top:10px;padding:9px 10px;border-radius:10px;background:#f4f8fc;color:#42627c;font:700 11px/1.45 system-ui,sans-serif}
#scout-match-mode .vc1613-board-status[data-level="ok"]{background:#ebf7ef;color:#256845}
#scout-match-mode .vc1613-board-status[data-level="warn"]{background:#fff7e8;color:#8b621c}
#scout-match-mode .vc1613-board-status[data-level="bad"]{background:#fff0ef;color:#9b433c}
#scout-match-mode .vc1613-actions{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:6px;margin-top:10px}
body.v11-shell #scout-match-mode #v112-video-drawer.vc1644-theater .vc1613-board{width:min(450px,calc(100% - 20px));top:58px;right:12px;max-height:calc(100% - 72px);z-index:20}
body.v11-shell #scout-match-mode #v112-video-drawer.vc1644-theater .vc1613-zone-fab{z-index:21}
@media(max-width:900px){#scout-match-mode .vc1613-board{left:10px;right:10px;width:auto}#scout-match-mode .vc1613-current{grid-template-columns:1fr;align-items:start}#scout-match-mode .vc1613-actions{grid-template-columns:1fr 1fr}#scout-match-mode .vc1613-actions .primary{grid-column:1/-1}}
@media(max-width:620px){#scout-match-mode .vc1613-zone-fab{padding:7px 9px!important;font-size:10px!important}#scout-match-mode .vc1613-board{position:fixed;left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:70dvh}body.v11-shell #scout-match-mode #v112-video-drawer.vc1644-theater .vc1613-board{left:8px;right:8px;top:auto;bottom:8px;max-height:70dvh}#scout-match-mode .vc1613-grid{gap:5px}#scout-match-mode .vc1613-zone-card{padding:4px}}
`;
  document.head.appendChild(style);
}
function toggle(force){
  const board=$('vc1613-board');
  const btn=$('vc1613-zone-toggle');
  if(!board||!btn)return false;
  state.open=typeof force==='boolean'?force:!state.open;
  board.hidden=!state.open;
  btn.setAttribute('aria-expanded',String(state.open));
  btn.textContent=state.open?'Ocultar zonas':'🎯 Zonas';
  if(state.open){syncInputPreview();status(state.zone?`Destino seleccionado: ${tokenLabel()}.`:'Selecciona una zona o subzona y aplícala al código actual.','info');}
  return state.open;
}
function focusCode(){const input=activeInput();if(input)input.focus({preventScroll:true});}
function bindBoard(){
  const board=$('vc1613-board');if(!board||board.dataset.bound==='1')return;
  board.dataset.bound='1';
  board.addEventListener('click',ev=>{
    const zoneBtn=ev.target.closest('[data-zone-main]');
    if(zoneBtn){selectZone(zoneBtn.dataset.zoneMain,'');return;}
    const subBtn=ev.target.closest('[data-zone][data-sub]');
    if(subBtn){selectZone(subBtn.dataset.zone,subBtn.dataset.sub);return;}
    if(ev.target.closest('.vc1613-close')){toggle(false);return;}
  });
  $('vc1613-apply-btn')?.addEventListener('click',applySelection);
  $('vc1613-apply-close-btn')?.addEventListener('click',()=>{if(applySelection())toggle(false)});
  $('vc1613-clear-btn')?.addEventListener('click',clearSelection);
  $('vc1613-focus-code-btn')?.addEventListener('click',focusCode);
}
function ensureUI(){
  injectStyles();
  const frame=$('v800-video-frame');
  if(!frame)return false;
  if(!$('vc1613-zone-toggle')){
    const b=document.createElement('button');
    b.id='vc1613-zone-toggle';b.type='button';b.className='vc1613-zone-fab';b.textContent='🎯 Zonas';
    b.setAttribute('aria-expanded','false');
    b.addEventListener('click',()=>toggle());
    frame.appendChild(b);
  }
  if(!$('vc1613-board'))frame.insertAdjacentHTML('beforeend',boardHtml());
  bindBoard();
  const entry=document.querySelector('#v113-video-code-panel .v113-video-code-entry');
  if(entry && !$('vc1613-zone-hint')){
    const hint=document.createElement('div');
    hint.id='vc1613-zone-hint';hint.className='vc1613-zone-hint';
    hint.textContent='Pizarra disponible: abre “🎯 Zonas” para marcar el destino del balón sin reducir la pantalla de vídeo.';
    entry.appendChild(hint);
  }
  document.querySelectorAll('#v113-video-code, #v800-code, #scout-code-input').forEach(input=>{
    if(input.dataset.vc1613Bound==='1')return;
    input.dataset.vc1613Bound='1';
    input.addEventListener('input',syncInputPreview);
    input.addEventListener('focus',syncInputPreview);
  });
  syncInputPreview();
  return true;
}

const mo=new MutationObserver(()=>ensureUI());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI,{once:true});
else ensureUI();
mo.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',syncInputPreview,{passive:true});
window.VC_1613_ZONE_BOARD={version:VERSION,ensureUI,toggle,applySelection,clearSelection,diagnostics:()=>({open:state.open,token:token(),activeInput:activeInput()?.id||null})};
})();
