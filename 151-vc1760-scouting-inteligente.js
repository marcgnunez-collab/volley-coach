/* Volley Coach V17.6.0 · Selección rápida de jugador, fundamento y valoración.
 * Sólo prepara el código existente. Nunca registra, puntúa, guarda ni sincroniza.
 * Conecta con la pista 9x4 y mantiene el código avanzado al editar el encabezado.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  const ready=()=>api.mount(root);
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.6.0';
 const SKILLS=[['S','Saque'],['R','Recepción'],['E','Colocación'],['A','Ataque'],['B','Bloqueo'],['D','Defensa'],['F','Freeball'],['C','Cobertura']];
 const EVALS=[['#','Perfecto'],['+','Positivo'],['!','Neutro'],['-','Negativo'],['/','Bloqueado / malo'],['=','Error']];
 const targets=[{id:'v113-video-code',host:'.v113-video-code-entry',anchor:'v113-video-code-status',suffix:'video',number:'v113-video-number',team:'v113-video-team-select'},
                {id:'v800-code',host:'.v112-code-block',anchor:'v852-code-status',suffix:'direct',number:'v800-code-number',team:'v800-code-team'}];
 const compact=s=>String(s??'').trim().toUpperCase().replace(/\s+/g,'');
 const prefixRx=/^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/;
 const dorsalOk=n=>/^\d{1,3}$/.test(String(n||''));
 function withPlayer(raw,team,number){
  if(!dorsalOk(number)||!['ours','opponent'].includes(team))return null;
  const code=compact(raw),base=(team==='opponent'?'R':'')+String(number);
  if(!code)return base;
  const hit=code.match(prefixRx);
  return hit?base+(hit[3]||'')+(hit[4]||'')+(hit[5]||''):null;
 }
 function withSkill(raw,skill){
  if(!SKILLS.some(s=>s[0]===skill))return null;
  const code=compact(raw),hit=code.match(prefixRx);
  if(!hit)return null;
  return hit[1]+hit[2]+skill+(hit[4]||'')+(hit[5]||'');
 }
 function withEvaluation(raw,ev){
  if(!EVALS.some(e=>e[0]===ev))return null;
  const code=compact(raw),hit=code.match(prefixRx);
  if(!hit||!hit[3])return null;
  return hit[1]+hit[2]+hit[3]+ev+(hit[5]||'');
 }
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  if(!$('scout-match-mode'))return false;
  const ctx={video:{team:'ours'},direct:{team:'ours'}};
  const stats={playerSelections:0,skills:0,evaluations:0,registered:0,mounts:0};
  let scheduled=false,matchKey='';
  function match(){return root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}
  function disabled(){const m=match();return !m||m.status==='finished'||!!m.sets?.find(s=>Number(s?.number)===Number(m.currentSet))?.finished}
  function roster(){
   const m=match();
   const a=Array.isArray(m?.rosterSnapshotV136)&&m.rosterSnapshotV136.length?m.rosterSnapshotV136:root.VC_SCOUT_VIDEO_BRIDGE?.getPlayers?.();
   return (Array.isArray(a)?a:[]).filter(p=>p&&dorsalOk(p.number??p.dorsal)).map(p=>({id:Number(p.id),number:String(p.number??p.dorsal),name:String(p.name||'Jugador')}));
  }
  function lineupPlayers(){
   const list=roster(),m=match();
   const positions=['p4','p3','p2','p5','p6','p1'];
   const out=[],seen=new Set();
   for(const pos of positions){const id=Number(m?.lineup?.ours?.[pos]);const player=list.find(p=>p.id===id);if(player&&!seen.has(player.number)){out.push({...player,pos:pos.toUpperCase()});seen.add(player.number)}}
   // Without a complete lineup, offer roster players rather than an empty toolbar.
   for(const p of list){if(out.length>=12)break;if(!seen.has(p.number)){out.push({...p,pos:''});seen.add(p.number)}}
   return out;
  }
  function codeEl(t){return $(t.id)}
  function info(t){return $(`vc1760-${t.suffix}`)}
  function message(t,s){const el=info(t)?.querySelector('[data-vc1760-message]');if(el)el.textContent=s}
  function replace(t,raw){
   if(disabled()){message(t,'No se puede editar: no hay un set activo.');return false}
   const input=codeEl(t);if(!input||raw==null){message(t,'Revisa el código actual antes de continuar: no se ha sobrescrito.');return false}
   if(input.value===raw){render(t);return true}
   input.value=raw;input.dispatchEvent(new Event('input',{bubbles:true}));
   try{input.focus({preventScroll:true});input.setSelectionRange(raw.length,raw.length)}catch(_){}
   render(t);return true;
  }
  function syncBuilder(t,team,num){const n=$(t.number),s=$(t.team);if(n)n.value=num;if(s)s.value=team}
  function render(t){
   const panel=info(t),input=codeEl(t);if(!panel||!input)return;
   const code=compact(input.value),hit=code.match(prefixRx),activeTeam=hit?(hit[1]?'opponent':'ours'):ctx[t.suffix].team;
   if(hit)ctx[t.suffix].team=activeTeam;
   refreshPlayers(t);
   for(const b of panel.querySelectorAll('[data-vc1760-team]'))b.setAttribute('aria-pressed',String(b.dataset.vc1760Team===activeTeam));
   for(const b of panel.querySelectorAll('[data-vc1760-skill]'))b.setAttribute('aria-pressed',String(!!hit&&hit[3]===b.dataset.vc1760Skill));
   for(const b of panel.querySelectorAll('[data-vc1760-eval]'))b.setAttribute('aria-pressed',String(!!hit&&hit[4]===b.dataset.vc1760Eval));
   const closed=disabled();
   panel.querySelectorAll('button,input').forEach(el=>{el.disabled=closed});
   const badge=panel.querySelector('[data-vc1760-preview]');
   if(badge)badge.textContent=code||'Código pendiente · selecciona jugador y fundamento';
   const help=panel.querySelector('[data-vc1760-help]');
   if(help)help.textContent=closed?'Sin set activo o partido finalizado · solo lectura':
      !code?'1. Elige dorsal · 2. Fundamento · 3. Valoración · 4. Zonas · 5. Añadir':
      !hit?'Código manual no reconocido: se conserva sin cambios.':
      !hit[3]?'Selecciona el fundamento para completar el código.':
      !hit[4]?'Sin valoración: el motor aplicará «!» (neutro) si registras.':
      'Código preparado · las acciones solo se registran con Añadir o Enter.';
  }
  function refreshPlayers(t){
   const el=info(t)?.querySelector('[data-vc1760-players]');if(!el)return;
   const rival=ctx[t.suffix].team==='opponent';
   const selected=rival?[]:lineupPlayers(),signature=(rival?'R|':'O|')+selected.map(p=>`${p.id}:${p.number}:${p.pos}`).join('|');
   if(el.dataset.signature===signature)return;
   el.dataset.signature=signature;el.replaceChildren();
   for(const p of selected){const b=doc.createElement('button');b.type='button';b.dataset.vc1760Player=p.number;
    b.textContent='#'+p.number+(p.pos?' · '+p.pos:'');b.title=p.name+(p.pos?' · '+p.pos:'');b.setAttribute('aria-label','Elegir jugador número '+p.number+(p.pos?', posición '+p.pos:''));el.appendChild(b)}
   if(!selected.length){const p=doc.createElement('span');p.textContent=rival?'Rival: introduce el dorsal manual':'Sin plantilla disponible · usa «Dorsal manual»';el.appendChild(p)}
  }
  function build(t){
   const host=doc.querySelector(t.host),anchor=$(t.anchor);if(!host||!anchor||!codeEl(t))return false;
   let panel=info(t);
   if(!panel){
    panel=doc.createElement('section');panel.id=`vc1760-${t.suffix}`;panel.className='vc1760-smart';panel.setAttribute('aria-label','Selector inteligente de scouting');
    panel.innerHTML=`<header><strong>SCOUTING INTELIGENTE</strong><small>Selección rápida · sin registro automático</small></header>
    <div class="vc1760-team" role="group" aria-label="Equipo de la acción"><button type="button" data-vc1760-team="ours" aria-pressed="true">Nuestro equipo</button><button type="button" data-vc1760-team="opponent" aria-pressed="false">Rival</button></div>
    <div class="vc1760-subheading">DORSALES EN PISTA / PLANTILLA</div><div class="vc1760-players" data-vc1760-players role="group" aria-label="Jugadores disponibles"></div>
    <label class="vc1760-manual"><span>Dorsal manual</span><input type="text" inputmode="numeric" maxlength="3" pattern="[0-9]{1,3}" data-vc1760-manual placeholder="N.º (1–3 cifras)" aria-label="Dorsal manual"/><button type="button" data-vc1760-apply>Elegir</button></label>
    <div class="vc1760-subheading">FUNDAMENTO</div><div class="vc1760-skills" role="group" aria-label="Fundamentos">${SKILLS.map(([s,label])=>`<button type="button" data-vc1760-skill="${s}" title="${label}">${s} · ${label}</button>`).join('')}</div>
    <div class="vc1760-subheading">VALORACIÓN</div><div class="vc1760-evals" role="group" aria-label="Valoración">${EVALS.map(([s,label])=>`<button type="button" data-vc1760-eval="${s}" title="${label}" aria-label="${label}">${s}</button>`).join('')}</div>
    <div class="vc1760-preview" data-vc1760-preview aria-live="polite">Código pendiente</div><p data-vc1760-help>Elige dorsal, fundamento y valoración.</p><p data-vc1760-message role="status" aria-live="polite"></p>`;
    panel.addEventListener('click',event=>{
     const button=event.target.closest('button');if(!button||button.disabled)return;
     if(button.dataset.vc1760Team){
      const team=button.dataset.vc1760Team,raw=compact(codeEl(t)?.value),hit=raw.match(prefixRx);
      ctx[t.suffix].team=team;
      if(hit){if(replace(t,withPlayer(raw,team,hit[2])))syncBuilder(t,team,hit[2])}
      else render(t);
     }else if(button.dataset.vc1760Player){
      const num=button.dataset.vc1760Player;const team=ctx[t.suffix].team;
      if(replace(t,withPlayer(codeEl(t)?.value,team,num))){syncBuilder(t,team,num);stats.playerSelections++}
     }else if(button.hasAttribute('data-vc1760-apply')){
      const num=panel.querySelector('[data-vc1760-manual]')?.value.trim();
      if(!dorsalOk(num)){message(t,'Introduce un dorsal de 1 a 3 cifras.');return}
      const team=ctx[t.suffix].team;if(replace(t,withPlayer(codeEl(t)?.value,team,num))){syncBuilder(t,team,num);stats.playerSelections++}
     }else if(button.dataset.vc1760Skill){
      if(replace(t,withSkill(codeEl(t)?.value,button.dataset.vc1760Skill)))stats.skills++;
      else message(t,'Selecciona primero un dorsal válido.');
     }else if(button.hasAttribute('data-vc1760-eval')){
      if(replace(t,withEvaluation(codeEl(t)?.value,button.dataset.vc1760Eval)))stats.evaluations++;
      else message(t,'Selecciona primero dorsal y fundamento.');
     }
    });
    panel.querySelector('[data-vc1760-manual]').addEventListener('keydown',e=>{
     if(e.key==='Enter'){e.preventDefault();panel.querySelector('[data-vc1760-apply]').click()}
    });
    codeEl(t).addEventListener('input',()=>render(t));
    stats.mounts++;
   }
   // Place it just after the existing input/status, before the 9×4 court.
   if(panel.parentElement!==host||panel.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',panel);
   refreshPlayers(t);render(t);return true;
  }
  function refresh(){scheduled=false;const m=match(),key=`${m?.id||'none'}|${m?.status||''}|${m?.currentSet||''}|${m?.updatedAt||''}|${m?.rotationNo||''}`;
   for(const t of targets){build(t);refreshPlayers(t);render(t)}matchKey=key;
  }
  function schedule(){if(scheduled)return;scheduled=true;root.requestAnimationFrame?.(refresh)||refresh()}
  function onRegistered(){stats.registered++;root.dispatchEvent(new CustomEvent('vc1760:registered'));schedule()}
  // Wrap only the authoritative Add method; never invent an alternate save path.
  const nativeAdd=root.v857AddCode;
  if(typeof nativeAdd==='function'&&!nativeAdd.__vc1760){
   const wrapper=function(...args){const out=nativeAdd.apply(this,args);if(out===true)onRegistered();return out};
   wrapper.__vc1760=true;root.v857AddCode=wrapper;
  }
  const css=doc.createElement('style');css.id='vc1760-style';css.textContent=`
 #scout-match-mode .vc1760-smart{display:grid;gap:8px;min-width:0;margin:9px 0 12px;padding:12px;background:#f7fbff;border:1px solid #c4d9ed;border-radius:12px;color:#264d6d;font:650 12px/1.35 system-ui,sans-serif}
 #scout-match-mode .vc1760-smart *{box-sizing:border-box}
 #scout-match-mode .vc1760-smart header{display:flex;align-items:center;justify-content:space-between;gap:7px;flex-wrap:wrap}
 #scout-match-mode .vc1760-smart header strong{font-size:12px;color:#144f83;letter-spacing:.04em}
 #scout-match-mode .vc1760-smart header small{font-size:10px;color:#67849e}
 #scout-match-mode .vc1760-subheading{font-size:10px;font-weight:850;letter-spacing:.07em;color:#64809a;margin:3px 0 -3px}
 #scout-match-mode .vc1760-team,#scout-match-mode .vc1760-evals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
 #scout-match-mode .vc1760-evals{grid-template-columns:repeat(6,minmax(0,1fr))}
 #scout-match-mode .vc1760-players{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
 #scout-match-mode .vc1760-skills{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
 body.v11-shell #scout-match-mode .vc1760-smart button{min-height:36px!important;min-width:0!important;padding:6px 3px!important;border:1px solid #bed1e4!important;border-radius:7px!important;background:#fff!important;color:#255d86!important;font:800 11px/1.2 system-ui,sans-serif!important;white-space:normal!important;box-shadow:none!important}
 body.v11-shell #scout-match-mode .vc1760-smart button[aria-pressed="true"]{background:#1768ac!important;color:white!important;border-color:#1768ac!important}
 body.v11-shell #scout-match-mode .vc1760-smart button:disabled{opacity:.45!important;cursor:not-allowed}
 body.v11-shell #scout-match-mode .vc1760-smart button:focus-visible{outline:3px solid #9bd0fc!important;outline-offset:1px}
 #scout-match-mode .vc1760-manual{display:grid;grid-template-columns:auto 1fr auto;gap:7px;align-items:center;font-size:11px;color:#567997}
 #scout-match-mode .vc1760-manual input{min-width:0!important;width:100%!important;min-height:36px!important;padding:6px 8px!important;border:1px solid #bfd3e5!important;border-radius:7px!important;background:white!important;font-size:12px!important}
 #scout-match-mode .vc1760-preview{padding:8px 10px;border:1px solid #bfdbf0;background:#e7f3fe;border-radius:7px;color:#0e568e;font:850 12px/1.3 ui-monospace,Consolas,monospace;overflow-wrap:anywhere}
 #scout-match-mode .vc1760-smart p{margin:0!important;color:#587d99;font-size:11px;line-height:1.4}
 /* The previous code assistant still validates, but its evaluation buttons are now next to the input. */
 #scout-match-mode #vc1641-video .vc1641-evaluations,#scout-match-mode #vc1641-direct .vc1641-evaluations{display:none!important}
 #scout-match-mode .vc1760-smart [data-vc1760-message]:empty{display:none}
 #scout-match-mode .vc1760-smart [data-vc1760-message]:not(:empty){color:#a05b2b}
 @media(max-width:650px){#scout-match-mode .vc1760-skills{grid-template-columns:repeat(2,minmax(0,1fr))}#scout-match-mode .vc1760-players{grid-template-columns:repeat(3,minmax(0,1fr))}body.v11-shell #scout-match-mode .vc1760-smart button{min-height:42px!important}}
 `;doc.head.appendChild(css);
  targets.forEach(t=>build(t));
  doc.addEventListener('vc:matchstatechange',schedule);
  root.addEventListener('vc:matchstatechange',schedule);
  $('v800-match-select')?.addEventListener('change',schedule);
  $('scout-match-mode')&&new MutationObserver(schedule).observe($('scout-match-mode'),{attributes:true,attributeFilter:['class']});
  const bar=$('vc1640-rail-rally');if(bar)new MutationObserver(schedule).observe(bar,{childList:true,characterData:true,subtree:true});
  root.VC_SCOUT_SMART_1760={version:VERSION,withPlayer,withSkill,withEvaluation,refresh:schedule,diagnostics:()=>({...stats,matchKey,mounted:targets.filter(t=>!!info(t)).length})};
  schedule();return true;
 }
 return {version:VERSION,withPlayer,withSkill,withEvaluation,mount};
});
