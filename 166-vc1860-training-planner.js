/* Volley Coach V18.6.1 · Preparación Profesional de Entrenamientos
 * Vista sobre la sesión y biblioteca EXISTENTES. Sin segunda base de datos, sin temporizador,
 * sin pizarra, sin cambios en scouting, cloud o motores de vídeo.
 */
(function (root, factory) {
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.6.1';
 const STYLES = "/* V18.6.1 · Training Planner: only the new planner is visually active. Legacy controls remain in DOM for their original engines. */\n#entrenamiento.vc186-active #export-area,#entrenamiento.vc186-active #vc1710-workspace{display:none!important}\n#entrenamiento.vc186-active{font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#173554}\n#vc186-planner{--v186-border:#d9e5f1;--v186-blue:#075bd1;--v186-navy:#0e2c4a;--v186-subtle:#f4f8fd;display:grid;gap:15px;max-width:100%;font:500 13px/1.5 system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#173554}\n#vc186-planner *{box-sizing:border-box}\n#vc186-planner h2,#vc186-planner h3,#vc186-planner h4{font-family:inherit!important;border:0!important;margin:0!important;color:#122a49!important;letter-spacing:-.025em!important;padding:0!important}\n#vc186-planner h2{font-size:clamp(23px,2.5vw,31px)!important;font-weight:850!important;line-height:1.15!important}\n#vc186-planner h3{font-size:18px!important;font-weight:850!important}\n#vc186-planner h4{font-size:15px!important;font-weight:800!important}\n#vc186-planner p{margin:0;font-size:12px;color:#6a8098;line-height:1.55}\n#vc186-planner button{background:#fff!important;color:#24527c!important;border:1px solid #cbddec!important;border-radius:9px!important;padding:10px 13px!important;font:750 12px/1.2 system-ui,sans-serif!important;box-shadow:none!important;white-space:normal;cursor:pointer;min-height:38px}\n#vc186-planner button:hover{background:#edf5fe!important;border-color:#8bbae9!important}\n#vc186-planner button:focus-visible,#vc186-planner input:focus-visible,#vc186-planner select:focus-visible,#vc186-planner textarea:focus-visible{outline:3px solid #62a7e9!important;outline-offset:2px}\n#vc186-planner button.vc186-primary{background:#0b60d5!important;color:white!important;border-color:#0b60d5!important}\n#vc186-planner label{font-size:11px;font-weight:800;color:#2a5073;display:grid;gap:6px;min-width:0}\n#vc186-planner label input,#vc186-planner label select,#vc186-planner label textarea{font:550 12px/1.5 system-ui,sans-serif!important;color:#203954!important;border-radius:9px!important;border:1px solid #cbdced!important;background:#fff!important;box-shadow:none!important;padding:10px 12px!important;min-width:0!important;width:100%!important;max-width:100%!important;resize:vertical}\n#vc186-planner .vc186-header{position:static!important;padding:17px 19px!important;border:1px solid var(--v186-border)!important;border-radius:16px!important;background:#fff!important;box-shadow:0 3px 14px rgba(14,45,77,.035)!important;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}\n#vc186-planner .vc186-kicker{font-size:10px;color:#166bc4;font-weight:900;letter-spacing:.09em;display:block;margin-bottom:5px}\n#vc186-planner .vc186-title p{margin-top:5px;color:#6584a0;font-size:12px}\n#vc186-planner .vc186-actions{display:flex;gap:8px;flex-wrap:wrap}\n#vc186-planner .vc186-layout{display:grid;grid-template-columns:minmax(265px,.84fr) minmax(0,1.46fr);gap:14px;align-items:start;min-width:0}\n#vc186-planner .vc186-outline,#vc186-planner .vc186-editor,#vc186-planner .vc186-bottom{background:#fff;border:1px solid var(--v186-border);border-radius:16px;box-shadow:0 3px 17px rgba(11,53,94,.035);min-width:0}\n#vc186-planner .vc186-outline{padding:16px;display:grid;gap:14px}\n#vc186-planner .vc186-session-card{background:#f6f9fd;border:1px solid #dfeaf4;border-radius:13px;padding:13px;display:grid;gap:12px}\n#vc186-planner .vc186-session-head{display:flex;justify-content:space-between;align-items:start;gap:8px}\n#vc186-planner .vc186-session-head strong{font-size:16px;color:#122e4b;line-height:1.25}\n#vc186-planner .vc186-session-head span{background:#e7f1fb;color:#2167a8;padding:4px 6px;border-radius:9px;font-size:9px;font-weight:850;white-space:nowrap}\n#vc186-planner .vc186-meta-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n#vc186-planner .vc186-stages-head{display:flex;align-items:center;justify-content:space-between;gap:10px}\n#vc186-planner .vc186-stages-head span{color:#6e86a0;font-size:11px}\n#vc186-planner .vc186-stages{display:grid;gap:9px;max-height:720px;overflow:auto;padding-right:2px}\n#vc186-planner .vc186-stage{border:1px solid #d8e4ee;border-left:3px solid var(--stage-color);border-radius:10px;overflow:hidden;background:#fff;min-width:0}\n#vc186-planner .vc186-stage-head{display:flex;justify-content:space-between;gap:8px;align-items:center;background:#f3f7fb;padding:10px 11px;min-width:0}\n#vc186-planner .vc186-stage-head b{font-size:13px;color:#173652;display:block}\n#vc186-planner .vc186-stage-head small{font-size:10px;color:#6584a0}\n#vc186-planner .vc186-stage-head button{padding:4px 9px!important;min-height:30px!important;font-size:19px!important}\n#vc186-planner .vc186-ex-row{display:flex;align-items:center;gap:8px;padding:10px 8px;background:#fff;border-top:1px solid #eef2f6;cursor:pointer;min-width:0}\n#vc186-planner .vc186-ex-row.is-selected{background:#e7f1ff;border-left:3px solid #146fd3;padding-left:5px}\n#vc186-planner .vc186-drag{color:#95abc1;font-size:17px;cursor:grab;flex:none}\n#vc186-planner .vc186-ex-row-main{min-width:0;flex:1;display:grid;gap:2px}\n#vc186-planner .vc186-ex-row-main b{font-size:11px;color:#254666;overflow-wrap:anywhere;line-height:1.25}\n#vc186-planner .vc186-ex-row-main small{font-size:10px;color:#758ca1}\n#vc186-planner .vc186-row-tools{display:flex;gap:3px;flex:none}\n#vc186-planner .vc186-row-tools button{min-width:24px;min-height:27px!important;padding:2px!important;font-size:12px!important}\n#vc186-planner .vc186-stage-empty{font-size:10px;color:#8ba0b2;padding:11px}\n#vc186-planner .vc186-outline-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}\n#vc186-planner .vc186-outline-actions button:first-child{border-style:dashed!important;background:#f4f9fe!important;color:#1769c3!important}\n#vc186-planner .vc186-editor{overflow:hidden}\n#vc186-planner .vc186-editor-top{background:#f5f9fd;border-bottom:1px solid #dfeaf4;padding:15px 18px;display:flex;gap:14px;justify-content:space-between;align-items:center;flex-wrap:wrap}\n#vc186-planner #vc186-stage-tag{display:block;font-size:9px;font-weight:900;letter-spacing:.1em;color:#367bac;margin-bottom:4px}\n#vc186-planner .vc186-editor-tools{display:flex;gap:7px;flex-wrap:wrap}\n#vc186-planner .vc186-detail-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,1.02fr);gap:16px;padding:19px;align-items:start}\n#vc186-planner .vc186-details{display:grid;gap:13px;min-width:0}\n#vc186-planner .vc186-details textarea[data-field=\"descripcion\"]{min-height:138px}\n#vc186-planner .vc186-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n#vc186-planner .vc186-details-bottom{display:flex;gap:7px;flex-wrap:wrap;margin-top:4px}\n#vc186-planner .vc186-library-hint{font-size:10px;color:#768b9f;line-height:1.5}\n#vc186-planner .vc186-media{border-left:1px solid #e2ebf3;padding-left:16px;display:grid;gap:13px;min-width:0;position:sticky;top:14px;align-self:start;background:#f7fbff;border-radius:14px;padding:14px 14px 14px 16px;box-shadow:inset 0 0 0 1px #e2edf7}\n#vc186-planner .vc186-media-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n#vc186-planner .vc186-media-head span{font-size:10px;color:#296ba9;background:#eaf3fc;padding:5px 8px;border-radius:25px}\n#vc186-planner .vc186-iframe{width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#0d2a45;box-shadow:0 10px 26px rgba(7,31,57,.16)}\n#vc186-planner iframe{width:100%;height:100%;border:0;display:block}\n#vc186-planner .vc186-video-placeholder{aspect-ratio:16/9;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:14px;text-align:center;background:linear-gradient(125deg,#0e2842,#1b4e7f);color:#fff;border-radius:11px}\n#vc186-planner .vc186-video-placeholder span{font-size:36px;color:#fff}\n#vc186-planner .vc186-video-placeholder p{font-size:11px;color:#c6d9e9}\n#vc186-planner .vc186-video-placeholder a{color:#fff;text-decoration:underline;font-size:12px}\n#vc186-planner .vc186-media-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}\n#vc186-planner .vc186-media-actions a{font-size:11px;color:#1767bb;overflow-wrap:anywhere}\n#vc186-planner .vc186-media-actions .vc186-video-link{display:inline-flex;align-items:center;min-height:38px;padding:8px 12px;border:1px solid #cbddec;border-radius:9px;background:#fff;color:#1767bb;text-decoration:none;font:750 12px/1.2 system-ui,sans-serif}\n#vc186-planner .vc186-video-note{font-size:10px;color:#6c849b;line-height:1.45}\n#vc186-planner .vc186-video-modal[hidden]{display:none!important}\n#vc186-planner .vc186-video-modal{position:fixed;inset:0;z-index:100120;background:rgba(4,19,36,.84);display:grid;place-items:center;padding:22px}\n#vc186-planner .vc186-video-modal-sheet{width:min(1200px,96vw);max-height:92vh;overflow:auto;background:#071f37;border-radius:18px;box-shadow:0 26px 80px rgba(3,13,24,.45);padding:16px;border:1px solid rgba(255,255,255,.08)}\n#vc186-planner .vc186-video-modal-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 4px 12px}\n#vc186-planner .vc186-video-modal-top div{display:grid;gap:2px}\n#vc186-planner .vc186-video-modal-top span{font-size:10px;font-weight:900;letter-spacing:.12em;color:#84bdf5}\n#vc186-planner .vc186-video-modal-top h4{color:#fff!important;font-size:20px!important}\n#vc186-planner .vc186-video-modal-top p{color:#b8cee3;font-size:12px}\n#vc186-planner .vc186-video-modal-actions{display:flex;gap:8px;flex-wrap:wrap}\n#vc186-planner .vc186-video-modal-actions button,#vc186-planner .vc186-video-modal-actions a{min-height:38px;border-radius:9px!important}\n#vc186-planner .vc186-video-modal-actions a{display:inline-flex;align-items:center;padding:0 12px;background:#fff;color:#123f66;text-decoration:none;border:1px solid #cbddec;font:750 12px/1.2 system-ui,sans-serif}\n#vc186-planner .vc186-video-modal-frame{width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;box-shadow:0 14px 36px rgba(0,0,0,.26)}\n#vc186-planner .vc186-video-modal-frame iframe{width:100%;height:100%;border:0;display:block}\n#vc186-planner .vc186-video-modal-empty{aspect-ratio:16/9;border-radius:14px;display:grid;place-items:center;text-align:center;padding:22px;background:linear-gradient(125deg,#0e2842,#1b4e7f);color:#fff}\n#vc186-planner .vc186-video-modal-empty p{color:#d4e4f2;font-size:13px;max-width:640px}\n#vc186-planner .vc186-attachment{padding:13px;background:#f4f8fd;border:1px solid #e3ecf3;border-radius:11px}\n#vc186-planner .vc186-attachment b{color:#254c74;font-size:11px}\n#vc186-planner .vc186-attachment p{margin-top:4px;font-size:10px}\n#vc186-planner .vc186-empty{margin:20px;padding:44px 20px;background:#f7faff;border:1px dashed #b8d4ec;border-radius:10px;text-align:center;display:grid;justify-items:center;gap:13px}\n#vc186-planner .vc186-empty strong{font-size:18px;color:#143d65}\n#vc186-planner .vc186-notes{padding:14px 19px 19px;border-top:1px solid #e7edf5}\n#vc186-planner .vc186-bottom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:15px 18px}\n#vc186-planner .vc186-summary>b{font-size:14px;color:#153452}\n#vc186-planner .vc186-metrics{display:flex;gap:20px;align-items:start;margin-top:9px;flex-wrap:wrap}\n#vc186-planner .vc186-metrics span{font-size:10px;color:#667f97;display:grid;gap:2px}\n#vc186-planner .vc186-metrics strong{font-size:14px;color:#102e4f;font-weight:850}\n#vc186-planner .vc186-footer-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}\n#vc186-planner .vc186-note{padding:0 5px 10px;font-size:10px!important;color:#7b8da0!important}\n#vc186-planner .vc186-note[data-error=\"true\"]{color:#b43c39!important}\n#vc186-planner .vc186-preview[hidden]{display:none!important}\n#vc186-planner .vc186-preview{position:fixed;inset:0;z-index:100090;display:grid;place-items:center;overflow-y:auto;padding:20px;background:#071d35b8}\n#vc186-planner .vc186-preview-sheet{background:#fff;border-radius:16px;padding:25px;max-width:860px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 25px 75px #051b3790}\n#vc186-planner .vc186-preview-top{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap;border-bottom:1px solid #e0e8f0;padding-bottom:14px;margin-bottom:12px}\n#vc186-planner .vc186-preview-top span{font-size:10px;font-weight:900;letter-spacing:.12em;color:#236bb6}\n#vc186-planner .vc186-preview-top>div:last-child{display:flex;gap:7px}\n#vc186-planner .vc186-print-meta h4{font-size:18px!important}\n#vc186-planner .vc186-print-meta p{margin-top:6px}\n#vc186-planner .vc186-print-stage{margin-top:18px;border-top:2px solid #e3ecf4;padding-top:10px}\n#vc186-planner .vc186-print-stage h5{margin:0 0 8px;color:#15518b;font-size:13px}\n#vc186-planner .vc186-print-stage article{padding:10px 0;border-bottom:1px solid #edf1f5;break-inside:avoid}\n#vc186-planner .vc186-print-stage strong{font-size:13px;color:#153754}\n#vc186-planner .vc186-print-stage p{margin-top:6px;font-size:11px;color:#465b70}\n#vc186-planner .vc186-print-stage a{color:#165ca5;overflow-wrap:anywhere}\n@media(max-width:1250px){#vc186-planner .vc186-detail-grid{grid-template-columns:1fr}#vc186-planner .vc186-media{position:static;border-left:0;border-top:1px solid #e2ebf3;padding:14px 0 0;background:transparent;box-shadow:none;border-radius:0}}\n@media(max-width:900px){#vc186-planner .vc186-layout{grid-template-columns:1fr}#vc186-planner .vc186-stages{max-height:none;grid-template-columns:repeat(2,minmax(0,1fr))}#vc186-planner .vc186-bottom{grid-template-columns:1fr}}\n@media(max-width:600px){#vc186-planner .vc186-header{padding:14px!important}#vc186-planner .vc186-actions{width:100%}#vc186-planner .vc186-actions button{flex:1 1 130px}#vc186-planner .vc186-outline{padding:11px}#vc186-planner .vc186-stages{grid-template-columns:1fr}#vc186-planner .vc186-detail-grid{padding:13px}#vc186-planner .vc186-two{grid-template-columns:1fr}#vc186-planner .vc186-editor-top{padding:12px}#vc186-planner .vc186-footer-actions button{flex:1 1 90px}#vc186-planner .vc186-metrics{gap:14px}}\n@media print{body.vc186-print #v11-sidebar,body.vc186-print header:not(#vc186-planner .vc186-header),body.vc186-print #vc186-planner>:not(.vc186-preview){display:none!important}body.vc186-print #vc186-planner .vc186-preview{position:static!important;display:block!important;background:#fff!important;padding:0!important}body.vc186-print #vc186-planner .vc186-preview-sheet{box-shadow:none!important;max-height:none!important;padding:0!important;overflow:visible!important}body.vc186-print #vc186-planner .vc186-preview-top>div:last-child{display:none!important}}\n";
 const PHASES=[
  {id:'activacion',name:'Calentamiento',subtitle:'Activación y preparación',color:'#ed8662'},
  {id:'tecnica',name:'Técnica',subtitle:'Trabajo técnico',color:'#e9a54f'},
  {id:'especifico',name:'Táctica / Sistema',subtitle:'Objetivo específico',color:'#4f93d7'},
  {id:'aplicado',name:'Juego aplicado',subtitle:'Situaciones reducidas',color:'#547bc0'},
  {id:'juego',name:'Juego real',subtitle:'Transferencia a competición',color:'#32a68a'}
 ];
 const clean=x=>String(x??'').trim();
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
 function safeVideoUrl(url){
  try{const u=new URL(clean(url));return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return ''}
 }
 function embedUrl(url){
  const safe=safeVideoUrl(url);if(!safe)return '';
  try{
   const u=new URL(safe),h=u.hostname.toLowerCase().replace(/^www\./,'');
   let id='';if(h==='youtu.be')id=u.pathname.slice(1).split('/')[0];
   else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(h)){
    id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]||'';
   }
   if(/^[a-zA-Z0-9_-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;
   if(h==='vimeo.com'||h==='player.vimeo.com'){
    const m=u.pathname.match(/(?:\/video)?\/(\d+)/);if(m)return 'https://player.vimeo.com/video/'+m[1];
   }
  }catch(_){}
  return '';
 }
 function stateSnapshot(){
  // The legacy core owns these globals. This module only reads them.
  if(typeof sesionActual==='undefined'||typeof baseDeDatos==='undefined'||typeof meta==='undefined')return null;
  const library=Array.isArray(baseDeDatos)?baseDeDatos:[],ids=Array.isArray(sesionActual)?sesionActual:[];
  const items=ids.map(id=>library.find(e=>Number(e.id)===Number(id))).filter(Boolean);
  const stageMap=meta.seccionesEjercicios||{};
  const groups=PHASES.map(phase=>({
   ...phase,
   items:items.filter(e=>{
    if(typeof seccionEjercicioSesion==='function')return seccionEjercicioSesion(e.id,e)===phase.id;
    return stageMap[String(e.id)]===phase.id;
   })
  }));
  const groupIds=new Set(groups.flatMap(g=>g.items.map(e=>Number(e.id))));
  const missing=items.filter(e=>!groupIds.has(Number(e.id)));
  if(missing.length)groups[2].items.push(...missing);
  const total=items.reduce((sum,e)=>sum+(Number(e.tiempo)||0),0);
  return {items,groups,total,meta:{...meta},team:typeof EQUIPOS!=='undefined'?EQUIPOS[typeof equipoActivo!=='undefined'?equipoActivo:'']?.nombre||'Equipo activo':'Equipo activo'};
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC186_TRAINING_PLANNER)return true;
   const host=doc.getElementById('entrenamiento'),old=doc.getElementById('export-area');
   if(!host||!old||!stateSnapshot())return false;
   const css=doc.createElement('style');css.id='vc186-training-style';css.textContent=STYLES;doc.head.append(css);
   const shell=doc.createElement('section');shell.id='vc186-planner';shell.className='vc186-planner';
   shell.innerHTML=`
    <header class="vc186-header">
     <div class="vc186-title"><span class="vc186-kicker">ENTRENAMIENTOS / PLANIFICACIÓN PROFESIONAL</span><h2>Planificar entrenamiento</h2><p>Diseña, organiza y prepara tus sesiones. Reutiliza tus ejercicios y acompáñalos con vídeos explicativos.</p></div>
     <div class="vc186-actions"><button type="button" data-act="library">Biblioteca de ejercicios</button><button type="button" data-act="templates">Plantillas</button><button type="button" class="vc186-primary" data-act="new">＋ Nueva sesión</button></div>
    </header>
    <div class="vc186-layout">
     <aside class="vc186-outline">
      <div class="vc186-session-card"><div class="vc186-session-head"><strong id="vc186-session-name">Sesión</strong><span id="vc186-summary-state">Borrador local</span></div>
       <div class="vc186-meta-fields"><label>Fecha <input id="vc186-date" type="date"></label><label>Duración objetivo <input id="vc186-target" type="number" min="0" step="5" placeholder="90" aria-label="Duración objetivo en minutos"></label></div>
       <label class="vc186-field">Objetivo principal <textarea id="vc186-objective" rows="2" placeholder="¿Qué trabajarás en esta sesión?"></textarea></label>
      </div>
      <div class="vc186-stages-head"><h3>Plan de sesión</h3><span id="vc186-count">0 ejercicios</span></div>
      <div id="vc186-stages" class="vc186-stages"></div>
      <div class="vc186-outline-actions"><button type="button" data-act="add-block">＋ Añadir ejercicios</button><button type="button" data-act="plan-calendar">Abrir calendario</button></div>
     </aside>
     <main class="vc186-editor">
      <div class="vc186-editor-top"><div><span id="vc186-stage-tag">EJERCICIO</span><h3 id="vc186-ex-name">Selecciona un ejercicio</h3></div><div class="vc186-editor-tools"><button type="button" data-act="preview">Vista previa</button><button type="button" data-act="edit-full">Editar ficha completa</button></div></div>
      <div id="vc186-editor-body"></div>
     </main>
    </div>
    <div class="vc186-bottom"><div class="vc186-summary"><b>Resumen del entrenamiento</b><div class="vc186-metrics"><span>Duración de ejercicios <strong id="vc186-minutes">0 min</strong></span><span>Ejercicios <strong id="vc186-number">0</strong></span><span>Vídeos vinculados <strong id="vc186-videos">0</strong></span><span>Equipo <strong id="vc186-team">—</strong></span></div></div><div class="vc186-footer-actions"><button type="button" data-act="preview">Vista previa</button><button type="button" data-act="pdf">Exportar PDF</button><button type="button" class="vc186-primary" data-act="save-plan">Guardar entrenamiento</button></div></div>
    <p class="vc186-note" id="vc186-feedback" role="status" aria-live="polite">Se utiliza el guardado de sesión y la biblioteca original. Los vídeos externos requieren conexión a Internet.</p>
    <div id="vc186-preview" class="vc186-preview" hidden role="dialog" aria-modal="true" aria-label="Vista previa de la sesión"><div class="vc186-preview-sheet"><div class="vc186-preview-top"><div><span>VOLLEY COACH · SESIÓN PREPARADA</span><h3>Vista previa del entrenamiento</h3></div><div><button data-act="print" type="button">Imprimir</button><button data-act="close-preview" type="button">Cerrar</button></div></div><div id="vc186-preview-content"></div></div></div>
    <div id="vc186-video-modal" class="vc186-video-modal" hidden role="dialog" aria-modal="true" aria-label="Vídeo de referencia ampliado"><div class="vc186-video-modal-sheet"><div class="vc186-video-modal-top"><div><span>VOLLEY COACH · VÍDEO DE REFERENCIA</span><h4 id="vc186-video-modal-title">Vídeo del ejercicio</h4><p id="vc186-video-modal-subtitle">Vista ampliada para explicar el ejercicio.</p></div><div class="vc186-video-modal-actions"><a id="vc186-video-modal-link" href="#" target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a><button data-act="close-video-preview" type="button">Cerrar</button></div></div><div id="vc186-video-modal-body"></div></div></div>`;
   old.before(shell);host.classList.add('vc186-active');
   const $=id=>doc.getElementById(id);
   const ui={selected:null,preview:false,videoPreview:false,dragId:null,updates:0,lastSignature:'',error:'',dirty:false};
   const renderText=(text)=>escape(text).replace(/\n/g,'<br>');
   function setFeedback(text,error=false){const el=$('vc186-feedback');if(el){el.textContent=text;el.dataset.error=error?'true':'false'}ui.error=error?text:''}
   function select(id){const snap=stateSnapshot();const next=snap?.items.some(e=>Number(e.id)===Number(id))?Number(id):snap?.items[0]?.id??null;
    if(ui.dirty&&next!==ui.selected&&!root.confirm('Hay cambios sin guardar en este ejercicio. ¿Descartarlos?'))return false;
    ui.dirty=false;ui.selected=next;render();return true;}
   function current(snap){return snap?.items.find(e=>Number(e.id)===Number(ui.selected))||null;}
   function syncFields(snap){
    const entries={ 'vc186-date':snap.meta.fecha||'', 'vc186-target':snap.meta.duracionObjetivo||'', 'vc186-objective':snap.meta.objetivo||''};
    for(const [id,val] of Object.entries(entries)){
     const input=$(id);if(input&&doc.activeElement!==input&&String(input.value)!==String(val))input.value=val;
    }
   }
   function render(){
    const snap=stateSnapshot();if(!snap)return false;
    ui.updates++;if(!snap.items.some(e=>Number(e.id)===Number(ui.selected)))ui.selected=snap.items[0]?.id??null;
    syncFields(snap);
    const selected=current(snap);
    $('vc186-session-name').textContent=clean(snap.meta.objetivo)||'Nueva sesión de entrenamiento';
    $('vc186-count').textContent=snap.items.length+' ejercicio'+(snap.items.length===1?'':'s');
    $('vc186-team').textContent=snap.team;
    $('vc186-minutes').textContent=snap.total+' min';$('vc186-number').textContent=String(snap.items.length);
    $('vc186-videos').textContent=String(snap.items.filter(e=>safeVideoUrl(e.video)).length);
    $('vc186-summary-state').textContent=snap.meta.planificacionId?'Planificación vinculada':'Borrador actual';
    $('vc186-stages').innerHTML=snap.groups.map(phase=>{
     const minutes=phase.items.reduce((a,e)=>a+(Number(e.tiempo)||0),0);
     return `<section class="vc186-stage" style="--stage-color:${phase.color}" data-phase="${phase.id}"><div class="vc186-stage-head"><div><b>${escape(phase.name)}</b><small>${minutes} min · ${phase.items.length} ejercicios</small></div><button type="button" data-act="add-exercise" data-phase="${phase.id}" aria-label="Añadir ejercicio en ${escape(phase.name)}">＋</button></div>
      ${phase.items.map(e=>`<div class="vc186-ex-row ${selected?.id===e.id?'is-selected':''}" data-ex="${Number(e.id)}" draggable="true" tabindex="0" role="button" aria-label="Abrir ${escape(e.nombre||'Ejercicio')}"><span class="vc186-drag" aria-hidden="true">⋮⋮</span><span class="vc186-ex-row-main"><b>${escape(e.nombre||'Ejercicio')}</b><small>${Number(e.tiempo)||0} min ${safeVideoUrl(e.video)?'· Vídeo':''}</small></span><span class="vc186-row-tools"><button type="button" data-act="up" data-id="${Number(e.id)}" title="Subir ejercicio">↑</button><button type="button" data-act="down" data-id="${Number(e.id)}" title="Bajar ejercicio">↓</button></span></div>`).join('')||'<p class="vc186-stage-empty">Sin ejercicios</p>'}</section>`;
    }).join('');
    $('vc186-stage-tag').textContent=selected?PHASES.find(p=>snap.groups.find(g=>g.id===p.id)?.items.includes(selected))?.id=== 'activacion'?'CALENTAMIENTO':'EJERCICIO DE LA SESIÓN':'PREPARACIÓN DE SESIÓN';
    $('vc186-ex-name').textContent=selected?.nombre||'Selecciona o añade un ejercicio';
    const body=$('vc186-editor-body');
    if(!selected){body.innerHTML=`<div class="vc186-empty"><strong>Empieza a preparar el entrenamiento</strong><p>Selecciona «＋» en un bloque para elegir un ejercicio de la biblioteca o crear uno nuevo. No necesitas dibujar una pista ni activar un cronómetro.</p><button type="button" data-act="add-exercise" data-phase="tecnica">Añadir el primer ejercicio</button></div><div class="vc186-notes"><label>Notas del entrenador<textarea id="vc186-notes" rows="3" placeholder="Consignas generales, material, adaptaciones…">${escape(snap.meta.notas||'')}</textarea></label></div>`;return true}
    const source=safeVideoUrl(selected.video),embed=embedUrl(source);
    const activePhase=snap.groups.find(g=>g.items.some(e=>Number(e.id)===Number(selected.id)))?.id||'especifico';
    body.innerHTML=`<div class="vc186-detail-grid"><div class="vc186-details">
     <label>Objetivo del ejercicio <textarea data-field="objetivo" rows="2" placeholder="Qué se quiere trabajar">${escape(selected.objetivo||'')}</textarea></label>
     <label>Descripción y desarrollo <textarea data-field="descripcion" rows="5" placeholder="Cómo se realiza, consignas y organización…">${escape(selected.descripcion||'')}</textarea></label>
     <div class="vc186-two"><label>Duración (min) <input data-field="tiempo" type="number" min="0" max="600" step="1" value="${Math.max(0,Number(selected.tiempo)||0)}"></label><label>Jugadores / organización <input data-field="jugadores" value="${escape(selected.jugadores||'')}" placeholder="6 vs 6, grupo completo…"></label></div>
     <div class="vc186-two"><label>Material <input data-field="material" value="${escape(selected.material||'')}" placeholder="Balones, conos, red…"></label><label>Fase de la sesión <select data-act="phase-change" data-id="${Number(selected.id)}">${PHASES.map(p=>`<option value="${p.id}" ${p.id===activePhase?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label></div>
     <label>Variantes y progresiones <textarea data-field="variantes" rows="2" placeholder="Cómo adaptar o aumentar la dificultad">${escape(selected.variantes||'')}</textarea></label>
     <label>Correcciones y consignas <textarea data-field="errores" rows="2" placeholder="Qué observar durante el ejercicio">${escape(selected.errores||'')}</textarea></label>
     <div class="vc186-details-bottom"><button type="button" class="vc186-primary" data-act="save-exercise">Guardar cambios del ejercicio</button><button type="button" data-act="remove-exercise" data-id="${Number(selected.id)}">Quitar de esta sesión</button></div>
     <p class="vc186-library-hint">La ficha pertenece a la biblioteca. Si la editas, también se actualizará cuando la reutilices en otras sesiones.</p>
    </div><aside class="vc186-media"><div class="vc186-media-head"><h4>Vídeo de referencia</h4><span>${source?'Vinculado':'Sin vídeo'}</span></div>
     ${embed?`<div class="vc186-iframe"><iframe src="${escape(embed)}" title="Vídeo explicativo del ejercicio" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`:source?`<div class="vc186-video-placeholder"><span>▶</span><p>Vídeo vinculado. Ábrelo para explicar el ejercicio o pásalo a pantalla grande.</p><a href="${escape(source)}" target="_blank" rel="noopener noreferrer">Abrir vídeo</a></div>`:`<div class="vc186-video-placeholder"><span>▶</span><p>Añade un vídeo para mostrar el ejercicio al equipo.</p></div>`}
     <label>Enlace de vídeo (YouTube, Vimeo o HTTPS)<input data-field="video" type="url" value="${escape(selected.video||'')}" placeholder="https://www.youtube.com/watch?v=…"></label>
     <div class="vc186-media-actions"><button type="button" data-act="save-video">Vincular vídeo</button>${(source||clean(selected.video||''))?`<button type="button" data-act="video-preview">Pantalla grande</button>`:''}${source?`<a class="vc186-video-link" href="${escape(source)}" target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a>`:''}</div>
     <p class="vc186-video-note">Si introduces un enlace válido, podrás ampliarlo para enseñarlo mejor al grupo.</p>
     <div class="vc186-attachment"><b>Preparación sin complicaciones</b><p>Utiliza tu pizarra física. El vídeo y la descripción sustituyen a un editor de pista.</p></div>
    </aside></div><div class="vc186-notes"><label>Notas generales del entrenador<textarea id="vc186-notes" rows="3" placeholder="Observaciones para toda la sesión">${escape(snap.meta.notas||'')}</textarea></label></div>`;
    return true;
   }
   function editorVideoSource(){const input=doc.querySelector('#vc186-editor-body [data-field="video"]');return safeVideoUrl(input?.value)||null}
   function setVideoPreview(show){ui.videoPreview=!!show;const modal=$('vc186-video-modal');if(!modal)return false;modal.hidden=!show;if(!show)return true;const snap=stateSnapshot(),item=current(snap);const source=editorVideoSource()||safeVideoUrl(item?.video)||null;const embed=embedUrl(source);$('vc186-video-modal-title').textContent=item?.nombre||'Vídeo del ejercicio';$('vc186-video-modal-subtitle').textContent=source?'Vista ampliada para explicar el ejercicio.':'Añade un enlace válido para mostrar el vídeo en grande.';const link=$('vc186-video-modal-link');if(link){if(source){link.hidden=false;link.href=source}else{link.hidden=true;link.removeAttribute('href')}}$('vc186-video-modal-body').innerHTML=embed?`<div class="vc186-video-modal-frame"><iframe src="${escape(embed)}" title="Vídeo de referencia ampliado" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`:source?`<div class="vc186-video-modal-empty"><div><h4>Vídeo listo para abrir</h4><p>Este proveedor no permite incrustación directa, pero puedes abrirlo en una pestaña nueva y enseñarlo a pantalla completa desde el navegador.</p></div></div>`:`<div class="vc186-video-modal-empty"><div><h4>Sin vídeo vinculado</h4><p>Pega un enlace de YouTube, Vimeo o un vídeo HTTPS en la ficha del ejercicio y pulsa «Vincular vídeo».</p></div></div>`;return true}
   function saveMetaField(source,hidden){const input=$(source),target=$(hidden);if(!input||!target)return false;
    target.value=input.value;target.dispatchEvent(new root.Event('input',{bubbles:true}));
    // Avoid replacing focused inputs while user is typing.
    const snap=stateSnapshot();if(snap)$('vc186-session-name').textContent=clean(snap.meta.objetivo)||'Nueva sesión de entrenamiento';
    return true;
   }
   function saveNotes(){const source=$('vc186-notes'),target=$('sesion-notas');if(!source||!target)return false;target.value=source.value;target.dispatchEvent(new root.Event('input',{bubbles:true}));return true}
   function saveExercise(videoOnly=false){
    const snap=stateSnapshot(),item=current(snap);if(!item){setFeedback('Selecciona un ejercicio.',true);return false}
    const body=$('vc186-editor-body');const patch={};
    const fields=videoOnly?['video']:['objetivo','descripcion','tiempo','jugadores','material','variantes','errores','video'];
    for(const key of fields){const input=body.querySelector(`[data-field="${key}"]`);if(!input)continue;patch[key]=key==='tiempo'?Math.max(0,Math.min(600,Number(input.value)||0)):clean(input.value)}
    if('video' in patch&&patch.video&&!safeVideoUrl(patch.video)){setFeedback('El vídeo debe ser un enlace HTTPS o HTTP válido.',true);return false}
    if(patch.video&&patch.video.length>2048){setFeedback('El enlace es demasiado largo.',true);return false}
    for(const [key,val] of Object.entries(patch))item[key]=val;
    ui.dirty=false;
    if(typeof save==='function')save();
    if(typeof renderizarSesion==='function')renderizarSesion();
    render();setFeedback(videoOnly?'Vídeo vinculado a la ficha de ejercicio original.':'Cambios guardados en la biblioteca original.');
    return true;
   }
   function move(id,offset){if(typeof moverSesionEnBloque==='function')moverSesionEnBloque(Number(id),offset);select(id)}
   function applyStage(id,phase){if(!PHASES.some(p=>p.id===phase))return;
    if(ui.dirty&&Number(id)===Number(ui.selected)&&!saveExercise(false))return false;
    if(typeof moverEjercicioAFase==='function')moverEjercicioAFase(Number(id),phase);select(id)}
   function setPreview(show){ui.preview=!!show;const modal=$('vc186-preview');modal.hidden=!show;
    if(show){const snap=stateSnapshot();$('vc186-preview-content').innerHTML=`<div class="vc186-print-meta"><h4>${escape(snap.meta.objetivo||'Sesión de entrenamiento')}</h4><p>${escape(snap.team)} · ${escape(snap.meta.fecha||'Fecha pendiente')} · ${snap.total} min de ejercicios · ${snap.items.length} ejercicios</p></div>${snap.groups.map(p=>p.items.length?`<section class="vc186-print-stage"><h5>${escape(p.name)}</h5>${p.items.map((e,i)=>`<article><strong>${i+1}. ${escape(e.nombre||'Ejercicio')} · ${Number(e.tiempo)||0} min</strong><p><b>Objetivo:</b> ${renderText(e.objetivo||'—')}</p><p><b>Desarrollo:</b> ${renderText(e.descripcion||'—')}</p><p><b>Material:</b> ${renderText(e.material||'—')} · <b>Organización:</b> ${renderText(e.jugadores||'—')}</p>${safeVideoUrl(e.video)?`<p>Vídeo: <a href="${escape(safeVideoUrl(e.video))}" target="_blank" rel="noopener noreferrer">${escape(e.video)}</a></p>`:''}</article>`).join('')}</section>`:'').join('')}<div class="vc186-print-stage"><h5>Notas del entrenador</h5><p>${renderText(snap.meta.notas||'Sin observaciones')}</p></div>`;}
   }
   function goToEditor(){const item=current(stateSnapshot());if(!item)return;
    if(typeof showView==='function')showView('ejercicios',typeof botonVista==='function'?botonVista('ejercicios'):null);
    if(typeof fillForm==='function')fillForm(item);
   }
   function mainAction(action,button){
    const phase=button?.dataset.phase||'tecnica',id=Number(button?.dataset.id);
    switch(action){
     case 'library':case 'add-block':case 'add-exercise':return typeof abrirBibliotecaParaSeccion==='function'?abrirBibliotecaParaSeccion(phase):false;
     case 'templates':return typeof abrirModalPlantillas==='function'?abrirModalPlantillas('usar'):false;
     case 'new':if(ui.dirty&&!root.confirm('Hay cambios sin guardar en el ejercicio. ¿Descartarlos y crear otra sesión?'))return false;ui.dirty=false;return typeof nuevaSesionVacia==='function'?nuevaSesionVacia():false;
     case 'plan-calendar':return typeof showView==='function'?showView('planificacion',typeof botonVista==='function'?botonVista('planificacion'):null):false;
     case 'edit-full':return goToEditor();
     case 'save-exercise':return saveExercise(false);
     case 'save-video':return saveExercise(ui.dirty?false:true);
     case 'remove-exercise':{
      if(ui.dirty&&!root.confirm('Hay cambios sin guardar. ¿Quitar el ejercicio de la sesión de todos modos?'))return false;
      ui.dirty=false;const item=current(stateSnapshot());if(!item)return false;
      if(!root.confirm(`¿Quitar «${item.nombre}» de esta sesión? El ejercicio seguirá en la biblioteca.`))return false;
      if(typeof quitarDeSesionId==='function')quitarDeSesionId(item.id);select(null);return true;
     }
     case 'up':return move(id,-1);
     case 'down':return move(id,1);
     case 'save-plan':{
      if(ui.dirty){setFeedback('Guarda primero los cambios del ejercicio seleccionado.',true);return false}
      if(typeof vcTrainingFlushDraft==='function')vcTrainingFlushDraft();
      const ok=typeof guardarSesionEnPlanificacion==='function'?guardarSesionEnPlanificacion(false):false;
      setFeedback(ok===false?'No se ha guardado la planificación. Comprueba que tenga ejercicios y fecha.':'Entrenamiento guardado mediante Planificación original.',ok===false);render();return ok;
     }
     case 'pdf':return typeof exportarPDF==='function'?exportarPDF():false;
     case 'preview':if(ui.dirty){setFeedback('Guarda los cambios del ejercicio antes de abrir la vista previa.',true);return false}return setPreview(true);
     case 'close-preview':return setPreview(false);
     case 'video-preview':return setVideoPreview(true);
     case 'close-video-preview':return setVideoPreview(false);
     case 'print':doc.body.classList.add('vc186-print');root.addEventListener?.('afterprint',()=>doc.body.classList.remove('vc186-print'),{once:true});return root.print?.();
    }
   }
   shell.addEventListener('click',event=>{
    const button=event.target.closest('button[data-act]');
    if(button){if(button.closest('#vc186-preview')||shell.contains(button))mainAction(button.dataset.act,button);return}
    const row=event.target.closest('.vc186-ex-row[data-ex]');if(row&&shell.contains(row))select(row.dataset.ex);
   });
   shell.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.vc186-ex-row')){event.preventDefault();select(event.target.dataset.ex)}if(event.key==='Escape'){if(ui.videoPreview)setVideoPreview(false);else if(ui.preview)setPreview(false)}});
   shell.addEventListener('input',event=>{
    if(event.target.matches('[data-field]')){ui.dirty=true;setFeedback('Cambios pendientes. Pulsa «Guardar cambios del ejercicio» para conservarlos.');}
    if(event.target.id==='vc186-date')saveMetaField('vc186-date','sesion-fecha');
    if(event.target.id==='vc186-target')saveMetaField('vc186-target','sesion-duracion-objetivo');
    if(event.target.id==='vc186-objective')saveMetaField('vc186-objective','sesion-objetivo');
    if(event.target.id==='vc186-notes')saveNotes();
   });
   shell.addEventListener('change',event=>{
    const t=event.target;if(t.matches('[data-act="phase-change"]'))applyStage(t.dataset.id,t.value);
    if(['vc186-date','vc186-target','vc186-objective','vc186-notes'].includes(t.id)){root.vcTrainingFlushDraft?.();render()}
   });
   shell.addEventListener('dragstart',event=>{const row=event.target.closest('.vc186-ex-row[data-ex]');if(!row)return;ui.dragId=Number(row.dataset.ex);event.dataTransfer?.setData('text/plain',String(ui.dragId));if(event.dataTransfer)event.dataTransfer.effectAllowed='move'});
   shell.addEventListener('dragover',event=>{const row=event.target.closest('.vc186-ex-row[data-ex]');if(row&&ui.dragId&&Number(row.dataset.ex)!==ui.dragId)event.preventDefault()});
   shell.addEventListener('drop',event=>{
    const row=event.target.closest('.vc186-ex-row[data-ex]');const from=ui.dragId,to=Number(row?.dataset.ex);ui.dragId=null;
    if(!row||!validId(from)||!validId(to)||from===to)return;event.preventDefault();
    const snap=stateSnapshot(),src=snap.groups.find(g=>g.items.some(e=>Number(e.id)===from)),dest=snap.groups.find(g=>g.items.some(e=>Number(e.id)===to));
    if(src?.id!==dest?.id){applyStage(from,dest.id);setFeedback('Ejercicio movido de bloque. Para ajustar el orden usa las flechas.');return}
    const ids=src.items.map(e=>Number(e.id));let a=ids.indexOf(from),b=ids.indexOf(to);let steps=0;
    while(a!==b&&steps++<ids.length){if(typeof moverSesionEnBloque==='function')moverSesionEnBloque(from,Math.sign(b-a));a+=Math.sign(b-a)}
    select(from);
   });
   shell.addEventListener('dragend',()=>{ui.dragId=null});
   const observer=new root.MutationObserver(()=>{if(host.classList.contains('active'))schedule()});
   const legacyList=$('lista-sesion');if(legacyList)observer.observe(legacyList,{childList:true});
   observer.observe(host,{attributes:true,attributeFilter:['class']});
   const team=$('v11-team-name');if(team)observer.observe(team,{childList:true,subtree:true});
   let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;root.requestAnimationFrame?.(()=>{scheduled=false;render()})||queueMicrotask(()=>{scheduled=false;render()})}
   render();
   root.VC186_TRAINING_PLANNER={version:VERSION,refresh:render,setSelected:select,preview:setPreview,diagnostics:()=>({version:VERSION,mounted:!!$('vc186-planner'),team:stateSnapshot()?.team,items:stateSnapshot()?.items.length,selected:ui.selected,updates:ui.updates,legacySessionPreserved:!!$('export-area'),scoutingEngineModified:false,syncEngineModified:false,lastError:ui.error,videoPreview:ui.videoPreview})};
   return true;
  }
  let attempts=0;
  function bootstrap(){if(start())return;if(++attempts<35)root.setTimeout?.(bootstrap,250)}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootstrap,{once:true});else bootstrap();return true;
 }
 return {VERSION,PHASES,safeVideoUrl,embedUrl,mount,stateSnapshot};
});
