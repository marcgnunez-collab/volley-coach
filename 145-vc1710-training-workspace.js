/* Volley Coach V17.1.0 · Training Workspace.
 * Presentation-only adapter for existing training/planning/history views.
 * The training data model, saving, scouting and classic Supabase sync are untouched.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.mount(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
'use strict';
const VERSION='17.1.0';
const AREAS=[
 {id:'plan',title:'Planificar',description:'Calendario y biblioteca',primary:'planificacion',views:['planificacion','ejercicios'],links:[['planificacion','Calendario'],['ejercicios','Biblioteca de ejercicios']]},
 {id:'direct',title:'Dirigir',description:'Sesión y ejercicios actuales',primary:'entrenamiento',views:['entrenamiento'],links:[['entrenamiento','Sesión actual']]},
 {id:'review',title:'Evaluar',description:'Historial y seguimiento',primary:'historial',views:['historial','estadisticas'],links:[['historial','Historial'],['estadisticas','Seguimiento']]}
];
const ALL_VIEWS=AREAS.flatMap(a=>a.views);
const modeForView=view=>AREAS.find(a=>a.views.includes(view))||null;
const cleanText=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
const safeText=value=>cleanText(value).slice(0,140);
function sessionSummaryFromDOM(doc){
 const get=id=>doc.getElementById(id);
 const date=cleanText(get('sesion-fecha')?.value);
 const minutes=safeText(get('tiempo-total')?.textContent)||'—';
 const exercises=safeText(get('num-ejercicios')?.textContent)||'—';
 const objective=safeText(get('sesion-objetivo')?.value)||'Objetivo sin definir';
 const team=safeText(get('team-active-name')?.textContent||get('v11-team-name')?.textContent)||'Equipo activo';
 return{date: /^\d{4}-\d\d-\d\d$/.test(date)?date:'—',minutes,exercises,objective,team};
}
function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const STYLE=`
body.vc1710-shell #v11-sidebar [data-vc17-view="ejercicios"],body.vc1710-shell #v11-sidebar [data-vc17-view="estadisticas"]{display:none!important}
body.vc1710-shell .vc1710-workspace{font:inherit;color:#17354e;border:1px solid #dbe7f2;background:#fff;border-radius:17px;box-shadow:0 7px 26px rgba(16,51,90,.065);overflow:hidden;margin:2px 0 19px;max-width:100%}
body.vc1710-shell .vc1710-head{background:linear-gradient(113deg,#0d2442,#133c67);padding:20px 23px 17px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#fff}
body.vc1710-shell .vc1710-kicker{display:block;font:800 10px/1.3 system-ui,sans-serif;letter-spacing:.09em;color:#b5d7f4;margin-bottom:6px}
body.vc1710-shell .vc1710-head h2{font:750 23px/1.15 system-ui,sans-serif!important;letter-spacing:-.02em;color:#fff!important;margin:0!important}
body.vc1710-shell .vc1710-head p{font:400 11px/1.5 system-ui,sans-serif;color:#c5d9ee;margin:7px 0 0;max-width:700px}
body.vc1710-shell .vc1710-team{font:750 11px/1.3 system-ui,sans-serif;background:rgba(255,255,255,.11);color:#fff;padding:10px 13px;border:1px solid rgba(255,255,255,.25);border-radius:9px;flex:0 1 auto;max-width:230px;text-align:right;overflow-wrap:anywhere}
body.vc1710-shell .vc1710-modes{padding:11px 13px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;background:#f5f8fc;border-bottom:1px solid #dfe9f2}
body.vc1710-shell .vc1710-mode{display:flex!important;gap:11px;align-items:center;justify-content:flex-start;text-align:left;min-height:62px;padding:11px 12px!important;background:#fff!important;border:1px solid #dbe6f0!important;border-radius:11px!important;color:#254665!important;box-shadow:none!important;letter-spacing:normal!important;font-family:system-ui,sans-serif!important;white-space:normal}
body.vc1710-shell .vc1710-mode-number{font-size:13px;font-weight:850;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#eef4fc;color:#2362aa;flex:none}
body.vc1710-shell .vc1710-mode b{display:block;font-size:13px;line-height:1.25;color:inherit}
body.vc1710-shell .vc1710-mode small{display:block;color:#6d8297;font-size:10px;line-height:1.3;margin-top:3px}
body.vc1710-shell .vc1710-mode[aria-current="step"]{background:#e6f1ff!important;border-color:#6da7eb!important;color:#113e75!important;box-shadow:inset 0 0 0 1px #a9c8ef!important}
body.vc1710-shell .vc1710-mode[aria-current="step"] .vc1710-mode-number{color:white;background:#1c66c2}
body.vc1710-shell .vc1710-subnav{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:9px 17px;border-bottom:1px solid #edf1f5;min-height:54px}
body.vc1710-shell .vc1710-subnav-label{font-size:10px;color:#7891a4;font-weight:800;margin-right:5px}
body.vc1710-shell .vc1710-subnav button{width:auto;min-height:35px!important;padding:7px 12px!important;border-radius:8px!important;background:transparent!important;border:1px solid transparent!important;box-shadow:none!important;color:#486b86!important;font:700 11px/1.3 system-ui,sans-serif!important}
body.vc1710-shell .vc1710-subnav button[aria-current="page"]{background:#153c67!important;color:#fff!important;border-color:#153c67!important}
body.vc1710-shell .vc1710-session-strip{display:grid;grid-template-columns:1.05fr .7fr .7fr 2fr;gap:12px;padding:12px 19px;background:#fff}
body.vc1710-shell .vc1710-session-strip>div{min-width:0;border-right:1px solid #e4edf4;padding-right:9px}
body.vc1710-shell .vc1710-session-strip>div:last-child{border:0}
body.vc1710-shell .vc1710-session-strip small{display:block;color:#7a91a5;font:750 9px/1.3 system-ui,sans-serif;letter-spacing:.03em;margin-bottom:3px}
body.vc1710-shell .vc1710-session-strip strong{display:block;color:#173e65;font:750 12px/1.4 system-ui,sans-serif;overflow-wrap:anywhere}
body.vc1710-shell .vc1710-session-strip strong[data-vc1710-objective]{font-size:11px;font-weight:600}
body.vc1710-shell .vc1710-notice{padding:8px 18px;background:#f9fbfd;color:#72889a;font:400 10px/1.4 system-ui,sans-serif;border-top:1px solid #eaf0f6}
body.vc1710-shell .vc1710-mode:focus-visible,body.vc1710-shell .vc1710-subnav button:focus-visible{outline:3px solid #70afe9;outline-offset:2px}
@media(max-width:900px){body.vc1710-shell .vc1710-head{padding:16px}body.vc1710-shell .vc1710-team{max-width:170px}body.vc1710-shell .vc1710-session-strip{grid-template-columns:repeat(2,minmax(0,1fr))}body.vc1710-shell .vc1710-session-strip>div:nth-child(2){border:0}}
@media(max-width:620px){body.vc1710-shell .vc1710-head{align-items:flex-start;flex-direction:column;gap:9px}body.vc1710-shell .vc1710-head h2{font-size:20px!important}body.vc1710-shell .vc1710-team{max-width:100%;text-align:left;padding:7px 9px}body.vc1710-shell .vc1710-modes{gap:5px;padding:7px}body.vc1710-shell .vc1710-mode{flex-direction:column;gap:5px;align-items:center;justify-content:center;text-align:center;padding:9px 4px!important;min-height:91px}body.vc1710-shell .vc1710-mode b{font-size:12px}body.vc1710-shell .vc1710-mode small{font-size:9px}body.vc1710-shell .vc1710-subnav{padding:8px 9px}body.vc1710-shell .vc1710-session-strip{padding:12px;gap:10px}body.vc1710-shell .vc1710-session-strip strong{font-size:11px}body.vc1710-shell .vc1710-notice{padding:8px 12px}}
`;
function markup(){return `<div class="vc1710-head"><div><span class="vc1710-kicker">TRAINING WORKSPACE · V${VERSION}</span><h2>Entrenamientos</h2><p>Un único espacio para preparar, utilizar y revisar las sesiones. Conserva el guardado y las herramientas originales.</p></div><div class="vc1710-team" data-vc1710-team>Equipo activo</div></div>
<div class="vc1710-modes" role="group" aria-label="Modos de entrenamiento">${AREAS.map((a,i)=>`<button type="button" class="vc1710-mode" data-vc1710-mode="${a.id}"><span class="vc1710-mode-number">0${i+1}</span><span><b>${a.title}</b><small>${a.description}</small></span></button>`).join('')}</div>
<div class="vc1710-subnav" data-vc1710-subnav aria-label="Herramientas del modo"></div>
<div class="vc1710-session-strip" aria-label="Resumen de la sesión actual"><div><small>FECHA DE LA SESIÓN</small><strong data-vc1710-date>—</strong></div><div><small>MINUTOS DE EJERCICIOS</small><strong data-vc1710-minutes>—</strong></div><div><small>EJERCICIOS</small><strong data-vc1710-exercises>—</strong></div><div><small>OBJETIVO</small><strong data-vc1710-objective>—</strong></div></div>
<div class="vc1710-notice">Resumen del borrador de sesión de este dispositivo. No confirma la subida a la nube. Cambia de modo sin duplicar ni guardar datos automáticamente.</div>`;}
function mount(root){
 const doc=root.document;if(!doc||doc.getElementById('vc1710-workspace'))return;
 const start=()=>{
  if(doc.getElementById('vc1710-workspace'))return;
  if(!ALL_VIEWS.every(id=>doc.getElementById(id)))return;
  const style=doc.createElement('style');style.id='vc1710-training-css';style.textContent=STYLE;doc.head.appendChild(style);
  const shell=doc.createElement('section');shell.id='vc1710-workspace';shell.className='vc1710-workspace';shell.setAttribute('aria-label','Centro de entrenamientos');shell.innerHTML=markup();
  const $=(id)=>doc.getElementById(id);
  function activeView(){return ALL_VIEWS.find(id=>$(id)?.classList.contains('active'))||null;}
  function route(view){if(!ALL_VIEWS.includes(view))return false;
    try{root.openWorkspace?.('training');}catch(_){}
    try{if(typeof root.showView==='function')root.showView(view,root.botonVista?.(view)||null);else return false;}
    catch(_){return false;}
    sync();return true;
  }
  function sync(){const view=activeView();if(!view){shell.remove();return;}
    const host=$(view);if(shell.parentElement!==host)host.insertBefore(shell,host.firstChild);
    const mode=modeForView(view);
    shell.querySelectorAll('[data-vc1710-mode]').forEach(btn=>{
      if(btn.dataset.vc1710Mode===mode.id)btn.setAttribute('aria-current','step');else btn.removeAttribute('aria-current');
    });
    const nav=shell.querySelector('[data-vc1710-subnav]');
    nav.innerHTML=`<span class="vc1710-subnav-label">${mode.title}</span>${mode.links.map(([target,label])=>`<button type="button" data-vc1710-view="${target}" ${view===target?'aria-current="page"':''}>${escapeHtml(label)}</button>`).join('')}`;
    const summary=sessionSummaryFromDOM(doc);
    for(const [id,value] of Object.entries({team:summary.team,date:summary.date,minutes:summary.minutes,exercises:summary.exercises,objective:summary.objective})){
      const node=shell.querySelector(`[data-vc1710-${id}]`);if(node&&node.textContent!==value)node.textContent=value;
    }
  }
  shell.addEventListener('click',e=>{const button=e.target.closest('button');if(!button||!shell.contains(button))return;
    const mode=button.dataset.vc1710Mode,view=button.dataset.vc1710View;
    if(mode){const a=AREAS.find(x=>x.id===mode);if(a)route(a.primary);}
    else if(view)route(view);
  });
  doc.body.classList.add('vc1710-shell');
  const observer=new root.MutationObserver(()=>{const q=root.VC175_UI_SCHEDULER;q?q.schedule("vc17-training",sync):sync()});
  for(const id of ALL_VIEWS)observer.observe($(id),{attributes:true,attributeFilter:['class']});
  // Read-only listeners: never call the existing guardarSesionMeta/save/sync methods.
  ['sesion-fecha','sesion-objetivo','sesion-jugadores','sesion-duracion-objetivo'].forEach(id=>{
    const input=$(id);if(input){input.addEventListener('input',sync);input.addEventListener('change',sync);}
  });
  ['tiempo-total','num-ejercicios','team-active-name','v11-team-name'].forEach(id=>{const n=$(id);if(n)observer.observe(n,{childList:true,characterData:true,subtree:true});});
  sync();
  root.VC171_TRAINING={version:VERSION,modeForView,sessionSummary:()=>sessionSummaryFromDOM(doc),navigate:route,refresh:sync,readonly:true};
 };
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return {VERSION,AREAS,ALL_VIEWS,modeForView,sessionSummaryFromDOM,escapeHtml,markup,mount};
});
