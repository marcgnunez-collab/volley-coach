/* Volley Coach 16.0.4.5 · Scouting Keyboard Pro.
 * Presentation-only helper: never calls point/scouting mutations automatically.
 * Codes are submitted exclusively by the existing Add/Enter handlers.
 */
(()=>{
'use strict';
if(window.VC_SCOUT_KEYBOARD_1645)return;
const VERSION='16.0.4.5',KEY='vc1645_keyboard_templates';
const DEFAULT=['A#','A=','R+','R-','S#','S=','B#','D+'];
const $=id=>document.getElementById(id);
const MATCH=()=>!!$('scout-match-mode')?.classList.contains('active');
const targets=[{input:'v800-code',host:'.v112-code-block',number:'v800-code-number',team:'v800-code-team',prefix:'direct'},
               {input:'v113-video-code',host:'.v113-video-code-entry',number:'v113-video-number',team:'v113-video-team-select',prefix:'video'}];
let templates=DEFAULT.slice(),scheduled=false;
const counts={inserted:0,autocompletions:0,saved:0,refreshes:0};
try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(value)&&value.length===8&&value.every(v=>typeof v==='string'&&/^[A-Za-z0-9#!+=\/.:>~^@-]{1,12}$/.test(v)))templates=value.map(v=>v.toUpperCase())}catch(_){}
const codeRx=/^[A-Z0-9#!+=\/.:>~^@-]{1,12}$/;
function escape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getTarget(el){return targets.find(t=>t.input===el?.id)}
function numberPrefix(t){const n=String($(t.number)?.value||'').trim();if(!/^\d{1,3}$/.test(n))return null;return `${$(t.team)?.value==='opponent'?'R':''}${n}`}
function pushSnippet(t,i){
 const input=$(t.input);if(!input)return false;
 const snippet=templates[i],value=input.value.toUpperCase();let newValue='',caret=0,start=input.selectionStart??value.length,end=input.selectionEnd??value.length;
 if(!value.trim()){
   const p=numberPrefix(t);
   if(!p){const n=$(t.number);n?.focus();const status=$(`vc1645-${t.prefix}-status`);if(status)status.textContent='Selecciona primero el dorsal para completar el código.';return false}
   newValue=p+snippet;caret=newValue.length;
 }else{
   const prefix=value.slice(0,start),selected=value.slice(start,end),suffix=value.slice(end);
   // When the user typed "7A", choosing A# should finish "7A#", not "7AA#".
   const last=prefix.slice(-1),add=prefix.match(/^(?:R)?\d{1,3}[SREABDFC]$/)&&last===snippet[0]?snippet.slice(1):snippet;
   newValue=prefix+add+suffix;caret=prefix.length+add.length;
 }
 input.value=newValue;
 try{input.focus({preventScroll:true});input.setSelectionRange(caret,caret)}catch(_){input.focus()}
 input.dispatchEvent(new Event('input',{bubbles:true}));counts.inserted++;return true;
}
function chooseCode(t,code){const input=$(t.input);if(!input)return;input.value=code;input.dispatchEvent(new Event('input',{bubbles:true}));try{input.focus({preventScroll:true});input.setSelectionRange(code.length,code.length)}catch(_){input.focus()};counts.autocompletions++}
function currentCodes(){
 const m=window.VC_SCOUT_REPORT_BRIDGE?.getActive?.();if(!m)return [];
 const sets=Array.isArray(m.sets)?m.sets:[],out=[];
 const add=a=>{const code=String(a?.code||((a?.playerNumberSnapshot||'')+(a?.skill||'')+(a?.evaluation||''))).trim().toUpperCase();if(/^R?\d{1,3}[SREABDFC]/.test(code)&&code.length<=48)out.push(code)};
 const live=Array.isArray(m.liveRally?.actions)?m.liveRally.actions:[];
 [...live].reverse().forEach(add);
 for(let si=sets.length-1;si>=0&&out.length<10;si--){const rallies=Array.isArray(sets[si]?.rallies)?sets[si].rallies:[];
   for(let ri=rallies.length-1;ri>=0&&out.length<10;ri--){const actions=Array.isArray(rallies[ri]?.actions)?rallies[ri].actions:[];[...actions].reverse().forEach(add)}
 }
 return out.slice(0,8);
}
function refreshRecent(){scheduled=false;if(!MATCH())return;
 const codes=currentCodes();for(const t of targets){const box=$(`vc1645-${t.prefix}-recent`);if(!box)continue;
  const signature=codes.join('|');if(box.dataset.signature===signature)continue;box.dataset.signature=signature;
  box.replaceChildren();if(!codes.length){const small=document.createElement('span');small.textContent='Las últimas acciones del partido aparecerán aquí.';box.append(small);continue}
  for(const code of codes){const b=document.createElement('button');b.type='button';b.className='vc1645-recent-code';b.textContent=code;b.title='Colocar '+code+' en el editor, sin registrar todavía';b.addEventListener('click',()=>chooseCode(t,code));box.append(b)}
 }counts.refreshes++;
}
function schedule(){if(scheduled||!MATCH())return;scheduled=true;requestAnimationFrame(refreshRecent)}
function suggestions(t){const input=$(t.input),host=$(`vc1645-${t.prefix}-suggest`);if(!host||!input)return;
 const value=input.value.trim().toUpperCase();host.replaceChildren();if(value.length<2)return;
 const prefix=numberPrefix(t)||'';
 const options=[...new Set([...currentCodes(),...templates.map(x=>prefix+x)])].filter(x=>x!==value&&x.startsWith(value)).slice(0,4);
 if(!options.length)return;
 const span=document.createElement('small');span.textContent='Completar:';host.append(span);
 options.forEach(code=>{const b=document.createElement('button');b.type='button';b.textContent=code;b.addEventListener('click',()=>chooseCode(t,code));host.append(b)});
}
function build(t){const parent=document.querySelector(t.host);if(!parent||$(`vc1645-${t.prefix}`))return;
 const section=document.createElement('section');section.className='vc1645-keyboard';section.id=`vc1645-${t.prefix}`;
 section.innerHTML=`<div class="vc1645-head"><strong>TECLADO PRO</strong><span>Alt + 1–8 con el cursor en el código · Enter confirma</span><button type="button" class="vc1645-config-toggle" aria-expanded="false">Configurar</button></div><div class="vc1645-macros" role="group" aria-label="Atajos rápidos"></div><div class="vc1645-suggest" id="vc1645-${t.prefix}-suggest"></div><div class="vc1645-recents-head"><strong>ÚLTIMAS ACCIONES</strong><small>Pulsa una para reutilizar su código</small></div><div class="vc1645-recents" id="vc1645-${t.prefix}-recent"></div><div class="vc1645-config" hidden><p>Personaliza el fragmento de código de cada atajo. Se guarda solo en este navegador. No se envía a la nube.</p><div class="vc1645-config-grid"></div><div class="vc1645-config-actions"><button type="button" data-action="save">Guardar atajos</button><button type="button" data-action="reset">Restaurar predeterminados</button><span class="vc1645-config-message" role="status"></span></div></div><span class="vc1645-status" id="vc1645-${t.prefix}-status" role="status"></span>`;
 const row=section.querySelector('.vc1645-macros'),config=section.querySelector('.vc1645-config'),grid=section.querySelector('.vc1645-config-grid');
 for(let i=0;i<8;i++){
  const b=document.createElement('button');b.type='button';b.className='vc1645-macro';b.innerHTML=`<small>Alt+${i+1}</small><b>${escape(templates[i])}</b>`;b.title='Insertar fragmento, no guardar acción';b.addEventListener('click',()=>pushSnippet(t,i));row.append(b);
  const label=document.createElement('label');label.textContent=`Alt+${i+1}`;const input=document.createElement('input');input.name=`shortcut-${i}`;input.value=templates[i];input.maxLength=12;input.autocapitalize='characters';input.spellcheck=false;label.append(input);grid.append(label)
 }
 section.querySelector('.vc1645-config-toggle').addEventListener('click',e=>{const open=config.hidden;config.hidden=!open;e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.textContent=open?'Cerrar ajustes':'Configurar'});
 section.querySelector('[data-action="save"]').addEventListener('click',()=>{
  const next=[...grid.querySelectorAll('input')].map(e=>e.value.trim().toUpperCase());const msg=section.querySelector('.vc1645-config-message');
  if(!next.every(x=>codeRx.test(x))){msg.textContent='Usa fragmentos de 1 a 12 caracteres válidos para códigos.';return}
  templates=next;try{localStorage.setItem(KEY,JSON.stringify(templates))}catch(_){msg.textContent='No se pudo guardar en este navegador.';return}counts.saved++;repaint();msg.textContent='Atajos guardados.';
 });
 section.querySelector('[data-action="reset"]').addEventListener('click',()=>{templates=DEFAULT.slice();try{localStorage.removeItem(KEY)}catch(_){}repaint();section.querySelector('.vc1645-config-message').textContent='Restaurados.'});
 $(t.input)?.addEventListener('input',()=>suggestions(t));
 parent.append(section);
}
function repaint(){for(const t of targets){const root=$(`vc1645-${t.prefix}`);if(!root)continue;root.querySelectorAll('.vc1645-macro b').forEach((b,i)=>b.textContent=templates[i]);root.querySelectorAll('.vc1645-config-grid input').forEach((input,i)=>input.value=templates[i]);suggestions(t)}}
function boot(){targets.forEach(build);schedule();
 document.addEventListener('keydown',ev=>{
  if(!MATCH()||!ev.altKey||ev.ctrlKey||ev.metaKey||ev.repeat||ev.isComposing)return;
  const target=getTarget(document.activeElement);if(!target)return;
  const m=/^(?:Digit|Numpad)([1-8])$/.exec(ev.code);if(!m)return;
  ev.preventDefault();ev.stopPropagation();pushSnippet(target,Number(m[1])-1);
 },true);
 document.addEventListener('vc:matchstatechange',schedule);window.addEventListener('vc:matchstatechange',schedule);
 for(const id of ['v855-live-actions','v800-last-rally']){const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,subtree:false})}
 $('scout-match-mode')&&new MutationObserver(schedule).observe($('scout-match-mode'),{attributes:true,attributeFilter:['class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.VC_SCOUT_KEYBOARD_1645={version:VERSION,insert:(slot,input='v800-code')=>{const t=targets.find(x=>x.input===input);return t&&Number.isInteger(slot)&&slot>=1&&slot<=8?pushSnippet(t,slot-1):false},recent:currentCodes,refresh:schedule,diagnostics:()=>({...counts,templates:templates.slice()})};
})();
