/* Volley Coach V17.2.0 · Match Workspace.
 * Non-mutating navigation/context layer. It never writes a match, a rally, a
 * score, a training session, media, localStorage or cloud state.
 * The existing match-mode and bench remain the ONLY operational controls.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.2.0';
 const MODES=[
  {id:'prepare',title:'Preparar',subtitle:'Agenda y estrategia',primary:'scout-dashboard',views:['scout-dashboard','competicion','scout-plan','scout-matchup'],links:[['scout-dashboard','Centro de partidos'],['competicion','Calendario'],['scout-plan','Plan de partido'],['scout-matchup','Match-up']]},
  {id:'live',title:'En directo',subtitle:'Registro y codificación',primary:'scout-match-mode',views:['scout-match-mode','scout-workspace-v900'],links:[['scout-match-mode','Modo Partido'],['scout-workspace-v900','Scouting Pro']]},
  {id:'bench',title:'Banquillo',subtitle:'Lectura en tiempo real',primary:'vc155-bench',views:['vc155-bench'],links:[['vc155-bench','Banquillo Pro']]}
 ];
 const MATCH_VIEWS=MODES.flatMap(m=>m.views);
 const modeForView=view=>MODES.find(mode=>mode.views.includes(view))||null;
 const asArray=value=>Array.isArray(value)?value:[];
 const normal=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
 const safe=value=>normal(value).slice(0,160);
 const escapeHTML=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const currentSetFor=m=>asArray(m?.sets).find(s=>Number(s.number)===Number(m?.currentSet))||asArray(m?.sets).at(-1)||null;
 function readMatchContext(bridge,view,selectedId){
  const matches=asArray(bridge?.getMatches?.());
  const activeId=bridge?.getActiveId?.();
  const explicitId=(view==='vc155-bench'||view==='scout-match-mode'||view==='scout-workspace-v900')?selectedId:null;
  const selected=explicitId!=null&&String(explicitId)!==''?matches.find(m=>String(m.id)===String(explicitId)):null;
  const active=matches.find(m=>String(m.id)===String(activeId))||bridge?.getActive?.()||null;
  // Never silently call activateMatch, save, or overwrite bench's separate selection.
  const match=selected||active||null;
  const set=currentSetFor(match);
  const closed=asArray(set?.rallies).filter(r=>r?.winner==='ours'||r?.winner==='opponent').length;
  const finished=match?.status==='finished';
  return {
   id:match?.id??null,opponent:safe(match?.opponent)||'Sin partido seleccionado',
   team:safe(bridge?.teamName?.())||'Equipo activo',date:safe(match?.date)||'—',
   status:match?(finished?'Finalizado':'En curso'):'Sin scouting',
   set:match?(Number(set?.number)||Number(match.currentSet)||1):null,
   rotation:match?(Number(match.rotationNo)||null):null,
   rallies:match?closed:null,
   selectedDifferent:!!(match&&active&&String(match.id)!==String(active.id)),
   localLabel:'Datos visibles en este dispositivo',
   matchCount:matches.length,
   isFinished:!!finished
  };
 }
 const CSS=`
body.vc1720-match-active #vc17-context{display:none!important}
body.vc1720-shell #v11-sidebar [data-vc17-view="competicion"],body.vc1720-shell #v11-sidebar [data-vc17-view="scout-plan"],body.vc1720-shell #v11-sidebar [data-vc17-view="scout-workspace-v900"]{display:none!important}
body.vc1720-shell .vc1720-workspace{min-width:0;max-width:100%;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#183950;background:#fff;border:1px solid #d8e5ef;border-radius:17px;box-shadow:0 7px 23px #0a28450c;overflow:hidden;margin:2px 0 18px}
body.vc1720-shell .vc1720-head{background:linear-gradient(115deg,#0e294a,#17446f);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;padding:18px 22px;color:#fff}
body.vc1720-shell .vc1720-kicker{display:block;font-size:10px;letter-spacing:.1em;font-weight:800;color:#a7d5ff;margin-bottom:5px}
body.vc1720-shell .vc1720-head h2{margin:0!important;color:#fff!important;font:800 22px/1.2 system-ui,sans-serif!important;letter-spacing:-.025em}
body.vc1720-shell .vc1720-head p{font-size:11px;line-height:1.5;color:#ccdef1;margin:6px 0 0}
body.vc1720-shell .vc1720-head-right{display:flex;align-items:center;gap:10px;min-width:0}
body.vc1720-shell .vc1720-status{font-size:10px;font-weight:800;letter-spacing:.01em;padding:8px 11px;border:1px solid #ffffff45;border-radius:10px;background:#ffffff16;color:#fff;white-space:nowrap}
body.vc1720-shell .vc1720-status[data-finished="true"]{background:#66778b38;color:#d9e6ef}
body.vc1720-shell .vc1720-context{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:13px 19px;background:#f6f9fd;border-bottom:1px solid #e0e9f2}
body.vc1720-shell .vc1720-match-label{min-width:0;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
body.vc1720-shell .vc1720-match-label small{font-size:10px;font-weight:850;color:#7491a9}
body.vc1720-shell .vc1720-match-label strong{font-size:15px;font-weight:850;color:#123c63;max-width:290px;overflow-wrap:anywhere}
body.vc1720-shell .vc1720-match-label em{font-size:10px;font-style:normal;color:#5d7b94}
body.vc1720-shell .vc1720-facts{display:flex;gap:7px;flex-wrap:wrap}
body.vc1720-shell .vc1720-fact{font-size:11px;color:#335a78;background:#fff;border:1px solid #dce6f0;border-radius:8px;padding:6px 9px;white-space:nowrap}
body.vc1720-shell .vc1720-fact b{font-weight:850;color:#144b7c}
body.vc1720-shell .vc1720-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:11px 13px;border-bottom:1px solid #e5edf3}
body.vc1720-shell button.vc1720-mode{display:flex!important;align-items:center;text-align:left;gap:10px;min-width:0;min-height:61px;border:1px solid #dce7f1!important;border-radius:11px!important;background:#fff!important;color:#315873!important;padding:10px 12px!important;box-shadow:none!important;font:inherit!important;letter-spacing:normal!important;white-space:normal}
body.vc1720-shell .vc1720-num{display:grid;place-items:center;width:31px;height:31px;flex:none;border-radius:9px;background:#edf4fb;color:#2168a8;font-weight:850;font-size:13px}
body.vc1720-shell .vc1720-mode b{display:block;color:inherit;font-size:13px;font-weight:850;line-height:1.3}
body.vc1720-shell .vc1720-mode small{display:block;color:#7890a3;font-size:10px;line-height:1.3;margin-top:2px}
body.vc1720-shell button.vc1720-mode[aria-current="step"]{background:#e7f2ff!important;border-color:#80b6e7!important;color:#114a8a!important;box-shadow:inset 0 0 0 1px #b1d4f0!important}
body.vc1720-shell button.vc1720-mode[aria-current="step"] .vc1720-num{background:#1667ba;color:#fff}
body.vc1720-shell .vc1720-tools{padding:9px 17px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-height:50px}
body.vc1720-shell .vc1720-tools-label{font-size:10px;font-weight:850;color:#7b96a7;margin-right:6px}
body.vc1720-shell .vc1720-tools button,body.vc1720-shell .vc1720-related button{width:auto!important;min-height:34px!important;padding:7px 11px!important;background:transparent!important;border:1px solid transparent!important;border-radius:8px!important;box-shadow:none!important;color:#3c6685!important;font:700 11px/1.3 system-ui,sans-serif!important}
body.vc1720-shell .vc1720-tools button[aria-current="page"]{background:#184b7c!important;color:#fff!important;border-color:#184b7c!important}
body.vc1720-shell .vc1720-related{padding:8px 17px;border-top:1px solid #edf2f6;background:#fcfdff;display:flex;gap:9px;align-items:center;flex-wrap:wrap}
body.vc1720-shell .vc1720-related span{color:#8193a6;font-size:10px;font-weight:700;margin-right:3px}
body.vc1720-shell .vc1720-related button{color:#235b91!important;border-color:#dce9f3!important;background:#fff!important}
body.vc1720-shell .vc1720-note{padding:8px 17px;background:#f6f9fd;color:#688198;font-size:10px;line-height:1.4;border-top:1px solid #e8eef4}
body.vc1720-shell .vc1720-tools button:focus-visible,body.vc1720-shell button.vc1720-mode:focus-visible{outline:3px solid #62a8f1!important;outline-offset:2px}
@media(max-width:840px){body.vc1720-shell .vc1720-head{padding:15px 16px}body.vc1720-shell .vc1720-context{padding:10px 13px}body.vc1720-shell .vc1720-tools{padding:8px 12px}}
@media(max-width:580px){body.vc1720-shell .vc1720-head{grid-template-columns:1fr;gap:10px}body.vc1720-shell .vc1720-head h2{font-size:19px!important}body.vc1720-shell .vc1720-status{padding:5px 8px}body.vc1720-shell .vc1720-modes{gap:5px;padding:6px}body.vc1720-shell button.vc1720-mode{min-height:84px;flex-direction:column;justify-content:center;text-align:center;padding:8px 3px!important;gap:6px}body.vc1720-shell .vc1720-mode small{font-size:9px}body.vc1720-shell .vc1720-mode b{font-size:11.5px}body.vc1720-shell .vc1720-fact{font-size:10px;padding:5px 7px}body.vc1720-shell .vc1720-tools{gap:3px}body.vc1720-shell .vc1720-tools button{font-size:10px!important;padding:7px 8px!important}body.vc1720-shell .vc1720-related{padding:7px 12px}}
 `;
 function markup(){return `<div class="vc1720-head"><div><span class="vc1720-kicker">MATCH WORKSPACE · V${VERSION}</span><h2>Centro de partidos</h2><p>Un único partido de referencia. Prepara, registra y consulta desde los controles que ya conoces.</p></div><div class="vc1720-head-right"><span class="vc1720-status" data-vc1720-status>Sin scouting</span></div></div>
<div class="vc1720-context" aria-label="Contexto del partido"><div class="vc1720-match-label"><small>PARTIDO</small><strong data-vc1720-opponent>Sin partido seleccionado</strong><em data-vc1720-date>—</em></div><div class="vc1720-facts"><span class="vc1720-fact"><b data-vc1720-set>—</b> · Set</span><span class="vc1720-fact"><b data-vc1720-rotation>—</b> · Rotación</span><span class="vc1720-fact"><b data-vc1720-rallies>—</b> · Rallies del set</span></div></div>
<nav class="vc1720-modes" aria-label="Flujo del partido">${MODES.map((m,i)=>`<button class="vc1720-mode" type="button" data-vc1720-mode="${m.id}"><span class="vc1720-num">0${i+1}</span><span><b>${m.title}</b><small>${m.subtitle}</small></span></button>`).join('')}</nav>
<div class="vc1720-tools" data-vc1720-tools aria-label="Herramientas del modo"></div>
<div class="vc1720-related"><span>REVISIÓN</span><button type="button" data-vc1720-related="scout-analysis">Análisis y estadísticas</button><button type="button" data-vc1720-related="scout-video-hub">Vídeo y clips</button></div>
<div class="vc1720-note" data-vc1720-note>Los datos se leen en este dispositivo. Los dispositivos presentes no equivalen a una sincronización confirmada.</div>`;}
 function mount(root){
  const doc=root.document;if(!doc||doc.getElementById('vc1720-workspace'))return;
  const start=()=>{
   if(doc.getElementById('vc1720-workspace'))return;
   if(!MATCH_VIEWS.every(id=>doc.getElementById(id)))return;
   const css=doc.createElement('style');css.id='vc1720-match-css';css.textContent=CSS;doc.head.appendChild(css);
   const shell=doc.createElement('section');shell.id='vc1720-workspace';shell.className='vc1720-workspace';shell.setAttribute('aria-label','Match Workspace');shell.innerHTML=markup();
   const $=id=>doc.getElementById(id);
   const view=()=>MATCH_VIEWS.find(id=>$(id)?.classList.contains('active'))||null;
   function navigate(target){if(!doc.getElementById(target))return false;
    try{if(typeof root.showView!=='function')return false;
       root.showView(target,root.botonVista?.(target)||null);
    }catch(_){return false}
    render();return true;}
   function selectedIdFor(v){const id={"vc155-bench":"vc155-match","scout-match-mode":"v800-match-select","scout-workspace-v900":"v123-match-select"}[v];return id?$(id)?.value:null;}
   function render(){const v=view();doc.body.classList.toggle('vc1720-match-active',!!v);if(!v){shell.remove();return;}
    const host=$(v);if(shell.parentElement!==host)host.insertBefore(shell,host.firstChild);
    const mode=modeForView(v);shell.querySelectorAll('[data-vc1720-mode]').forEach(button=>{if(button.dataset.vc1720Mode===mode.id)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current')});
    const links=shell.querySelector('[data-vc1720-tools]');
    const currentLink=links.querySelector('[aria-current="page"]')?.dataset.vc1720View;
    if(links.dataset.mode!==mode.id||currentLink!==v){
     links.dataset.mode=mode.id;
     links.innerHTML=`<span class="vc1720-tools-label">${escapeHTML(mode.title)}</span>${mode.links.map(([id,label])=>`<button type="button" data-vc1720-view="${id}" ${id===v?'aria-current="page"':''}>${escapeHTML(label)}</button>`).join('')}`;
    }
    let info;try{info=readMatchContext(root.VC_SCOUT_VIDEO_BRIDGE,v,selectedIdFor(v));}catch(_){info=readMatchContext(null,v,null)}
    const fields={status:info.status,opponent:info.opponent,date:info.date,set:info.set==null?'—':String(info.set),rotation:info.rotation==null?'—':`R${info.rotation}`,rallies:info.rallies==null?'—':String(info.rallies)};
    for(const [key,val] of Object.entries(fields)){const field=shell.querySelector(`[data-vc1720-${key}]`);if(field&&field.textContent!==val)field.textContent=val;}
    shell.querySelector('[data-vc1720-status]').dataset.finished=String(info.isFinished);
    const note=info.selectedDifferent?'Estás consultando un partido distinto del scouting activo. Cambiar de vista no lo activa ni sobrescribe.':info.isFinished?'Scouting finalizado: consulta sus datos sin abrirlo para edición.':'Datos locales de este dispositivo. La presencia de otros dispositivos no confirma la recepción de cambios.';
    const label=shell.querySelector('[data-vc1720-note]');if(label.textContent!==note)label.textContent=note;
   }
   shell.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||!shell.contains(button))return;
    const targetMode=MODES.find(x=>x.id===button.dataset.vc1720Mode);
    if(targetMode)navigate(targetMode.primary);
    else if(button.dataset.vc1720View)navigate(button.dataset.vc1720View);
    else if(button.dataset.vc1720Related)navigate(button.dataset.vc1720Related);
   });
   doc.body.classList.add('vc1720-shell');
   const observer=new root.MutationObserver(()=>render());
   for(const id of MATCH_VIEWS)observer.observe($(id),{attributes:true,attributeFilter:['class']});
   for(const id of ['v800-title','v800-score-us','v800-score-opponent','v800-set-label','vc155-us-score','vc155-opp-score','team-active-name']){const e=$(id);if(e)observer.observe(e,{childList:true,characterData:true,subtree:true});}
   for(const id of ['vc155-match','v800-match-select','v123-match-select'])$(id)?.addEventListener('change',render);
   root.addEventListener('focus',render);
   doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)render()});
   // Poll current match ONLY while a match view is visible: supports remote updates
   // and save state changes without touching the classic sync engine.
   root.setInterval(()=>{if(!doc.hidden&&view())render()},4000);
   render();
   root.VC172_MATCH_WORKSPACE={version:VERSION,modeForView,navigate,refresh:render,readCurrent:()=>readMatchContext(root.VC_SCOUT_VIDEO_BRIDGE,view(),selectedIdFor(view())),readonly:true};
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 return {VERSION,MODES,MATCH_VIEWS,modeForView,readMatchContext,escapeHTML,markup,mount};
});
