/* Volley Coach V16.4.1 · Code Assistant & Rally Review
 * Read-only rally timeline; code suggestions only modify editor text.
 * Never awards points, calls Add, saves a match, or changes the shared match state.
 */
(()=>{
 'use strict';
 if(window.VC_SCOUT_ASSIST_1641)return;
 const $=id=>document.getElementById(id);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const skillNames={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
 const evalNames={'#':'Punto / perfecto','+':'Positivo','!':'Neutro','-':'Negativo','/':'Bloqueado / malo','=':'Error'};
 const targets=[{id:'v113-video-code',host:'.v113-video-code-entry',suffix:'video'},
                {id:'v800-code',host:'.v112-code-block',suffix:'direct'}];
 const stats={mounted:0,previews:0,evaluationEdits:0,reviewsOpened:0,editorOpens:0};
 let scheduled=false,lastReviewSignature='';
 function match(){
  const bridge=window.VC_SCOUT_VIDEO_BRIDGE;
  const active=bridge?.getActive?.();if(active)return active;
  const selected=$('v800-match-select')?.value;
  return selected?(bridge?.getMatches?.()||[]).find(m=>String(m?.id)===String(selected))||null:null;
 }
 const activeView=()=>!!$('scout-match-mode')?.classList.contains('active');
 const compact=raw=>String(raw??'').trim().toUpperCase().replace(/\s+/g,'');
 const pattern=/^(R)?(\d{1,3})([SREABDFC])([#+!\-/=])?(?:\.([1-9][ABCD]?)(?:>([1-9][ABCD]?))?)?(.*)$/;
 function parse(raw){
  const code=compact(raw);
  if(!code)return {kind:'empty',code,message:'Escribe dorsal y fundamento. Los botones no registran acciones.'};
  const p=code.match(pattern);
  if(!p){
   const partial=/^(R)?\d{0,3}$/.test(code)||/^(R)?\d{1,3}[SREABDFC]?\.[1-9]?$/.test(code);
   return {kind:partial?'partial':'invalid',code,message:partial?'Completa el fundamento o la dirección.':'El formato todavía no coincide con la sintaxis de scouting.'};
  }
  let rest=p[7]||'';
  const serve=rest.match(/~(JF|JP|F|U)/)?.[1]||'';rest=rest.replace(/~(JF|JP|F|U)/,'');
  const combo=rest.match(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/)?.[1]||'';rest=rest.replace(/:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/,'');
  const phase=rest.match(/\^(K1|K2|FB|TR)/)?.[1]||'';rest=rest.replace(/\^(K1|K2|FB|TR)/,'');
  const blockers=rest.match(/@([0-3])/)?.[1]||'';rest=rest.replace(/@([0-3])/,'');
  if(rest)return {kind:'invalid',code,message:`Sufijo sin reconocer: ${rest.slice(0,30)}. Revisa la chuleta de códigos.`};
  const ev=p[4]||'!';
  return {kind:'ready',code,team:p[1]?'opponent':'ours',number:p[2],skill:p[3],evaluation:ev,
   startZone:p[5]||'',endZone:p[6]||'',serve,combo,phase,blockers,
   message:`${p[1]?'Rival':'Nuestro'} #${p[2]} · ${skillNames[p[3]]} · ${evalNames[ev]}${p[4]?'':' (valoración por defecto)'}${p[5]?(p[6]?` · Z${p[5]} → Z${p[6]}`:` · Z${p[5]}`):''}${combo?` · ${combo}`:''}${phase?` · ${phase}`:''}`};
 }
 function withEvaluation(raw,value){
  if(!Object.prototype.hasOwnProperty.call(evalNames,value))return null;
  const code=compact(raw),p=code.match(/^(R?\d{1,3}[SREABDFC])([#+!\-/=])?/);
  if(!p)return null;
  return p[1]+value+code.slice(p[0].length);
 }
 function renderPreview(t){
  const input=$(t.id),root=$(`vc1641-${t.suffix}`);if(!root||!input)return;
  const info=parse(input.value),status=root.querySelector('[data-vc1641-status]');
  status.textContent=info.message;status.dataset.kind=info.kind;
  const finished=match()?.status==='finished';
  const ready=info.kind==='ready'&&!finished;
  root.querySelectorAll('[data-vc1641-eval]').forEach(btn=>{
   btn.disabled=!ready;
   btn.classList.toggle('selected',ready&&info.evaluation===btn.dataset.vc1641Eval);
   btn.setAttribute('aria-pressed',String(ready&&info.evaluation===btn.dataset.vc1641Eval));
  });
  const safety=root.querySelector('[data-vc1641-safety]');
  safety.textContent=finished?'Partido finalizado · edición deshabilitada.':'Asistencia visual: no se registra nada hasta pulsar Añadir o Enter.';
  stats.previews++;
 }
 function applyEvaluation(t,ev){
  const input=$(t.id),m=match();if(!input||m?.status==='finished')return false;
  const out=withEvaluation(input.value,ev);
  if(out==null)return false;
  input.value=out;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  try{input.focus({preventScroll:true});input.setSelectionRange(out.length,out.length)}catch(_){input.focus()}
  stats.evaluationEdits++;renderPreview(t);return true;
 }
 function ensureAssistant(t){
  const parent=document.querySelector(t.host),input=$(t.id);if(!parent||!input)return false;
  if($(`vc1641-${t.suffix}`)){renderPreview(t);return true}
  const box=document.createElement('section');box.id=`vc1641-${t.suffix}`;box.className='vc1641-assistant';box.setAttribute('aria-label','Asistente de código');
  box.innerHTML=`<div class="vc1641-assisthead"><strong>ASISTENTE DE CÓDIGO</strong><span>Vista previa antes de registrar</span></div>
   <p data-vc1641-status role="status" aria-live="polite"></p>
   <div class="vc1641-evaluations" role="group" aria-label="Completar valoración">${Object.entries(evalNames).map(([code,label])=>`<button type="button" data-vc1641-eval="${escape(code)}" aria-label="Valoración ${escape(label)}" title="${escape(label)}">${escape(code)}</button>`).join('')}</div>
   <small data-vc1641-safety>Asistencia visual: no se registra nada hasta pulsar Añadir o Enter.</small>`;
  // Preserve quick code → 9×4 court → Pro keyboard order. Insert the assistant below them.
  parent.appendChild(box);
  box.addEventListener('click',e=>{
   const btn=e.target.closest('[data-vc1641-eval]');
   if(btn&&!btn.disabled)applyEvaluation(t,btn.dataset.vc1641Eval);
  });
  input.addEventListener('input',()=>renderPreview(t));
  input.addEventListener('change',()=>renderPreview(t));
  input.addEventListener('focus',()=>renderPreview(t));
  stats.mounted++;renderPreview(t);return true;
 }
 function recentRallies(m){
  if(!m)return [];
  const sets=Array.isArray(m.sets)?m.sets:[],all=[];
  for(const s of sets){for(const r of (Array.isArray(s?.rallies)?s.rallies:[])){
   if(r)all.push({set:Number(s.number)||0,rally:r});
  }}
  return all.slice(-12).reverse();
 }
 function renderReview(force=false){
  const details=$('vc1641-review'),content=$('vc1641-review-body');if(!details||!content||!details.open)return;
  const m=match();const rows=recentRallies(m);
  const signature=JSON.stringify([m?.id,m?.status,m?.updatedAt,rows.map(({set,rally})=>[set,rally.id,rally.winner,rally.actions?.length,rally.editedAt,(rally.actions||[]).map(a=>a?.code||a?.evaluation||'').join('|')])]);
  if(!force&&signature===lastReviewSignature)return;
  lastReviewSignature=signature;
  const finished=m?.status==='finished';
  content.innerHTML=rows.length?rows.map(({set,rally})=>{
   const actions=Array.isArray(rally.actions)?rally.actions:[];
   const code=actions.slice(-8).map(a=>a?.code||`${a?.playerNumberSnapshot||''}${a?.skill||''}${a?.evaluation||''}`).filter(Boolean).join(' · ');
   const after=rally.scoreAfter||{};
   const score=Number.isFinite(Number(after.us))&&Number.isFinite(Number(after.opponent))?`${after.us}–${after.opponent}`:'Marcador no registrado';
   const editAllowed=!finished&&Number.isFinite(Number(rally.id))&&typeof window.scoutV680OpenRallyEditor==='function';
   return `<div class="vc1641-rallyrow"><div class="vc1641-rallytop"><b>Set ${set} · ${escape(score)}</b><span>${rally.winner==='ours'?'Punto nuestro':rally.winner==='opponent'?'Punto rival':'Ganador sin registrar'}</span><small>${actions.length} acc.</small></div><div class="vc1641-rallycodes">${escape(code||'Sin acciones codificadas')}</div><button type="button" data-vc1641-edit data-set="${set}" data-rally="${Number(rally.id)}" ${editAllowed?'':'disabled'}>${finished?'Finalizado · solo lectura':'Abrir editor original'}</button></div>`;
  }).join(''):'<p class="vc1641-empty">Todavía no hay rallies cerrados en el partido seleccionado.</p>';
  const note=$('vc1641-review-note');if(note)note.textContent=finished?'Partido finalizado: la revisión rápida es de solo lectura.':'Editar abre el editor original; conserva las protecciones de marcador y rotaciones.';
 }
 function ensureReview(){
  const bar=$('vc1640-commandbar');if(!bar)return false;
  if($('vc1641-review'))return true;
  const button=document.createElement('button');button.type='button';button.id='vc1641-review-toggle';button.textContent='Últimos rallies';button.setAttribute('aria-expanded','false');
  const tools=bar.querySelector('.vc1640-quicktools');if(!tools)return false;
  tools.insertBefore(button,tools.querySelector('#vc1640-extra'));
  const panel=document.createElement('details');panel.id='vc1641-review';panel.innerHTML=`<summary>REVISIÓN RÁPIDA · 12 RALLIES RECIENTES <small>(sin modificar el partido)</small></summary><div class="vc1641-review-actions"><button type="button" data-vc1641-refresh>Actualizar lista</button></div><div id="vc1641-review-body" class="vc1641-reviewgrid"></div><p id="vc1641-review-note"></p>`;
  bar.appendChild(panel);
  const toggle=open=>{panel.open=!!open;button.setAttribute('aria-expanded',String(panel.open));if(panel.open){stats.reviewsOpened++;renderReview(true)}};
  button.addEventListener('click',()=>toggle(!panel.open));
  panel.addEventListener('toggle',()=>{button.setAttribute('aria-expanded',String(panel.open));if(panel.open)renderReview(true)});
  panel.addEventListener('click',e=>{
   if(e.target.closest('[data-vc1641-refresh]')){renderReview(true);return}
   const row=e.target.closest('[data-vc1641-edit]');if(!row||row.disabled)return;
   const m=match();if(!m||m.status==='finished')return;
   const set=Number(row.dataset.set),rally=Number(row.dataset.rally);
   const s=(m.sets||[]).find(x=>Number(x?.number)===set);
   if(!s?.rallies?.some(x=>Number(x?.id)===rally))return;
   const editor=window.scoutV680OpenRallyEditor;if(typeof editor!=='function')return;
   try{editor(set,rally);stats.editorOpens++}catch(err){console.warn('V16.4.1 editor',err)}
  });
  return true;
 }
 function sync(){scheduled=false;if(!activeView())return;
  targets.forEach(ensureAssistant);ensureReview();
  if($('vc1641-review')?.open)renderReview();
  targets.forEach(renderPreview);
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
 const STYLE=`
 #scout-match-mode .vc1641-assistant{margin:10px 0 0;padding:10px;background:#f9fbff;border:1px solid #d4e3f0;border-radius:11px;color:#234866;font:600 11px/1.4 system-ui;min-width:0}
 #scout-match-mode .vc1641-assisthead{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
 #scout-match-mode .vc1641-assisthead strong{font-size:10px;letter-spacing:.07em;color:#1e537b}
 #scout-match-mode .vc1641-assisthead span{font-size:9px;color:#6d8aa1}
 #scout-match-mode .vc1641-assistant [data-vc1641-status]{margin:8px 0!important;padding:8px 9px;background:#edf5fc;border:1px solid #d7e7f5;border-radius:7px;color:#285879;font-size:11px;white-space:normal;overflow-wrap:anywhere}
 #scout-match-mode .vc1641-assistant [data-kind="ready"]{background:#ebf6ef;border-color:#cce5d6;color:#236947}
 #scout-match-mode .vc1641-assistant [data-kind="invalid"]{background:#fff1eb;border-color:#ecd2c5;color:#a14d3b}
 #scout-match-mode .vc1641-evaluations{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;margin:8px 0}
 body.v11-shell #scout-match-mode .vc1641-evaluations button{min-width:0!important;min-height:32px!important;padding:5px!important;background:#fff!important;border:1px solid #ccdeeb!important;color:#245b83!important;border-radius:7px!important;font:bold 14px system-ui!important}
 body.v11-shell #scout-match-mode .vc1641-evaluations button.selected{background:#1f6598!important;color:#fff!important;border-color:#1f6598!important}
 body.v11-shell #scout-match-mode .vc1641-evaluations button:disabled{opacity:.35!important;cursor:not-allowed}
 #scout-match-mode .vc1641-assistant [data-vc1641-safety]{display:block;margin-top:4px;color:#7891a5;font-size:9px}
 #scout-match-mode #vc1641-review{margin-top:12px;padding:10px;border:1px solid #cdddea;border-radius:10px;background:#f7fbff}
 #scout-match-mode #vc1641-review summary{font-size:10px;font-weight:850;letter-spacing:.05em;color:#275b81;cursor:pointer;list-style:none}
 #scout-match-mode #vc1641-review summary small{font-size:10px;color:#7690a2;letter-spacing:0}
 #scout-match-mode #vc1641-review .vc1641-review-actions{display:flex;justify-content:flex-end;margin:8px 0}
 body.v11-shell #scout-match-mode #vc1641-review button{min-height:30px!important;padding:6px 10px!important;background:#fff!important;border:1px solid #cbdcea!important;color:#205d89!important;border-radius:8px!important;font:750 10px system-ui!important}
 body.v11-shell #scout-match-mode #vc1641-review button:disabled{opacity:.4!important;cursor:not-allowed!important}
 #scout-match-mode .vc1641-reviewgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:350px;overflow:auto}
 #scout-match-mode .vc1641-rallyrow{padding:10px;border:1px solid #d7e5ee;background:white;border-radius:9px;min-width:0}
 #scout-match-mode .vc1641-rallytop{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#2d5a78;font-size:10px}
 #scout-match-mode .vc1641-rallytop span{color:#66859c}
 #scout-match-mode .vc1641-rallytop small{margin-left:auto;color:#7a95a7}
 #scout-match-mode .vc1641-rallycodes{padding:5px 0 8px;color:#254a6d;font:750 10px ui-monospace,Consolas,monospace;overflow-wrap:anywhere}
 #scout-match-mode #vc1641-review-note{color:#708ba2;font-size:10px;margin:9px 0 0}
 #scout-match-mode .vc1641-empty{font-size:11px;color:#718ca1;grid-column:1/-1}
 @media(max-width:700px){#scout-match-mode .vc1641-reviewgrid{grid-template-columns:1fr}}
 `;
 function boot(){
  if(!$('scout-match-mode'))return;
  if(!$('vc1641-style')){const s=document.createElement('style');s.id='vc1641-style';s.textContent=STYLE;document.head.appendChild(s)}
  sync();
  const view=$('scout-match-mode');
  const obs=new MutationObserver(schedule);obs.observe(view,{attributes:true,attributeFilter:['class']});
  const shell=$('v800-shell');if(shell)new MutationObserver(schedule).observe(shell,{attributes:true,attributeFilter:['data-vc52-mode']});
  for(const id of ['vc1640-rail-rally','v800-score-us','v800-title']){
   const node=$(id);if(node)new MutationObserver(schedule).observe(node,{childList:true,subtree:false,characterData:true});
  }
  $('v800-match-select')?.addEventListener('change',schedule);
  document.addEventListener('vc:matchstatechange',schedule);
  window.addEventListener('vc:matchstatechange',schedule);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.VC_SCOUT_ASSIST_1641={version:'16.4.1',parse,withEvaluation,refresh:schedule,review:()=>{ensureReview();const p=$('vc1641-review');if(p){p.open=true;renderReview(true)}},diagnostics:()=>({...stats,assistants:targets.filter(x=>!!$(`vc1641-${x.suffix}`)).length,reviewMounted:!!$('vc1641-review'),matchId:match()?.id??null})};
})();
