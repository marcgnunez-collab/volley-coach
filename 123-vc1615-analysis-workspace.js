/* Volley Coach V16.1.5 — Professional Analysis Workspace.
 * Reorganizes the EXISTING Analysis Intelligence Pro renderer and filter controls.
 * Does not redefine metrics, mutate match data, replace reports, or create a second statistics engine.
 */
(()=>{
  'use strict';
  if(window.VC_ANALYSIS_WORKSPACE_1615)return;
  const VERSION='16.1.5';
  const $=id=>document.getElementById(id);
  const sections={
    overview:{title:'Panorama del partido',desc:'Indicadores esenciales, interpretación táctica y evidencia disponible en vídeo.',tabs:[['summary','Lectura del partido']]},
    players:{title:'Jugadores y fundamentos',desc:'Hoja por jugador y fundamentos: volumen, valoración, rendimiento y acceso a las jugadas.',tabs:[['skills','Rendimiento individual']]},
    rotations:{title:'Rotaciones y complejos',desc:'K1/side-out, K2/break y G–P de rallies con oportunidades y denominadores.',tabs:[['rotations','Seis rotaciones']]},
    distribution:{title:'Distribución y secuencias',desc:'De la recepción a la colocación y el ataque. Frecuencias, tempos y códigos de contexto.',tabs:[['sequences','Secuencia de juego'],['advanced','Códigos de juego']]},
    zones:{title:'Zonas y direcciones',desc:'Destinos del ataque y relación entre dirección, bloqueo y resultado.',tabs:[['zones','Mapa de ataque']]},
    explorer:{title:'Explorador técnico',desc:'Completitud de datos, evolución punto a punto y variables DataVolley avanzadas.',tabs:[['quality','Calidad de datos'],['play','Punto a punto'],['advanced','Variables avanzadas']]}
  };
  let active='overview',selectedSub={distribution:'sequences',explorer:'quality'},mode='workspace';
  let originalMatchPosition=null;
  const css=`
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] .scout-analysis-shell{display:block!important;min-width:0!important}
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] .scout-analysis-shell> :is(.scout-analysis-header,.v961-data-integrity,.scout-analysis-kpis,.scout-v750-pro-panel,.scout-analysis-grid,.v115-analysis-nav,.v115-section-intro,.v114-analysis-tabs,.v114-matchboard,.v114-summary-strip,.v135-decision-cockpit,#vc1612-analytics,#vc1614-view-switch){display:none!important}
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] #vc1614-intelligence{display:block!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#23445e!important}
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] #vc1614-intelligence>.vc1614-heading,
body.v11-shell #scout-analysis #vc1614-view-switch,
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] #vc1614-intelligence>.vc1614-tabs,
body.v11-shell #scout-analysis[data-vc1615-mode="workspace"] #vc1614-intelligence>.vc1614-footer{display:none!important}
body.v11-shell #scout-analysis[data-vc1615-mode="technical"] #vc1614-intelligence{display:none!important}
#scout-analysis #vc1615-back{display:none;margin:0 0 12px;background:#e9f2fb;border:1px solid #b7d3ea;color:#194d79;padding:10px 15px;border-radius:9px;font:800 12px system-ui;cursor:pointer}
#scout-analysis[data-vc1615-mode="technical"] #vc1615-back{display:inline-flex!important}
#vc1615-workspace{min-width:0;color:#1b3d5b;font:500 13px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
#vc1615-workspace *{box-sizing:border-box}
#vc1615-workspace .vc1615-hero{display:flex;justify-content:space-between;align-items:center;gap:18px;background:linear-gradient(115deg,#0b2843,#153e64 65%,#1c507c);color:#fff;border-radius:15px 15px 0 0;padding:21px 24px}
#vc1615-workspace .vc1615-kicker{display:block;font-size:10px;letter-spacing:.12em;font-weight:850;color:#9fc9e8}
#vc1615-workspace .vc1615-hero h2{font:850 clamp(20px,2vw,27px)/1.2 system-ui!important;color:#fff!important;margin:5px 0 4px!important;letter-spacing:-.02em}
#vc1615-workspace .vc1615-hero p{font:500 12px/1.5 system-ui;color:#c8ddec;margin:0;max-width:720px}
#vc1615-workspace .vc1615-head-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#vc1615-workspace button{cursor:pointer}
#vc1615-workspace .vc1615-technical-btn{border:1px solid rgba(196,219,239,.5)!important;background:rgba(255,255,255,.10)!important;color:#fff!important;border-radius:9px!important;padding:9px 12px!important;font:750 12px/1.25 system-ui!important;min-height:40px!important;white-space:nowrap}
#vc1615-workspace .vc1615-context{display:grid;grid-template-columns:minmax(200px,1fr) minmax(0,3.7fr);gap:10px 15px;align-items:end;background:#fff;padding:16px 20px 12px;border:1px solid #d8e5f0;border-top:0}
#vc1615-workspace .vc1615-match{display:grid;gap:5px;min-width:0}
#vc1615-workspace .vc1615-match>span{font-size:10px;font-weight:850;color:#52738d;text-transform:uppercase;letter-spacing:.08em}
body.v11-shell #scout-analysis #vc1615-workspace :is(select){min-width:0!important;width:100%!important;max-width:none!important;min-height:40px!important;height:40px!important;font:700 12px system-ui!important;color:#1d4567!important;background:#fff!important;border:1px solid #c8dbea!important;border-radius:9px!important;padding:7px 11px!important;box-shadow:none!important}
#vc1615-workspace .vc1614-toolbar{display:flex!important;flex-wrap:wrap;align-items:end;gap:10px!important;margin:0!important;min-width:0}
#vc1615-workspace .vc1614-toolbar label{flex:1 1 100px;min-width:100px;gap:5px;font-size:10px!important;color:#52738d!important;letter-spacing:.05em;text-transform:uppercase}
#vc1615-workspace .vc1614-sample{flex:1 1 100%;margin:1px 0 0!important;padding:7px 10px!important;border-radius:7px!important;background:#edf5fc!important;color:#3e6485!important;font:700 11px system-ui!important}
#vc1615-workspace .vc1615-commandbar{display:flex;gap:9px;align-items:center;justify-content:space-between;padding:10px 20px;border:1px solid #d8e5f0;border-top:0;background:#f7fafd;flex-wrap:wrap}
#vc1615-workspace .vc1615-commandbar small{font-size:11px;color:#627e96}
#vc1615-workspace .vc1615-exports{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
#vc1615-workspace .vc1615-exports button{border:1px solid #cbddeb!important;border-radius:8px!important;padding:7px 11px!important;min-height:34px!important;background:#fff!important;color:#275984!important;font:750 11px system-ui!important}
#vc1615-workspace .vc1615-exports #vc1614-csv{background:#165b9b!important;border-color:#165b9b!important;color:white!important}
#vc1615-workspace .vc1615-nav{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;padding:7px;background:#eaf1f8;border:1px solid #d3e2ee;border-top:0}
#vc1615-workspace .vc1615-nav button{border:1px solid transparent!important;background:transparent!important;display:grid;gap:3px;align-content:center;min-height:61px!important;padding:9px 7px!important;border-radius:9px!important;font:800 12px/1.2 system-ui!important;color:#527089!important;min-width:0;white-space:normal!important}
#vc1615-workspace .vc1615-nav button small{font-size:10px;color:inherit;font-weight:550}
#vc1615-workspace .vc1615-nav button[aria-selected="true"]{background:#fff!important;border-color:#c4d9ec!important;color:#154e83!important;box-shadow:0 2px 9px rgba(30,76,118,.08)}
#vc1615-workspace .vc1615-nav button:focus-visible,#vc1615-workspace button:focus-visible{outline:3px solid #7ab9f4!important;outline-offset:1px!important}
#vc1615-workspace .vc1615-stage{background:#fff;border:1px solid #d8e5f0;border-top:0;border-radius:0 0 15px 15px;padding:18px 20px 22px;min-width:0;min-height:360px}
#vc1615-workspace .vc1615-stage-heading{display:flex;justify-content:space-between;align-items:start;gap:15px;flex-wrap:wrap;margin-bottom:12px}
#vc1615-workspace .vc1615-stage-heading h3{color:#173e62!important;font:850 21px/1.25 system-ui!important;margin:0 0 5px!important;letter-spacing:-.02em}
#vc1615-workspace .vc1615-stage-heading p{color:#6b8297;font:500 12px/1.5 system-ui;margin:0;max-width:790px}
#vc1615-workspace .vc1615-subnav{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
#vc1615-workspace .vc1615-subnav[hidden]{display:none!important}
#vc1615-workspace .vc1615-subnav button{padding:8px 12px!important;min-height:35px!important;border-radius:8px!important;border:1px solid #d5e3ed!important;background:#f6f9fc!important;color:#526f89!important;font:750 11px system-ui!important}
#vc1615-workspace .vc1615-subnav button[aria-pressed="true"]{background:#e5f1fe!important;border-color:#9fc6ee!important;color:#145893!important}
#vc1615-workspace #vc1614-body{display:grid!important;gap:13px!important;margin-top:9px!important;min-width:0!important}
#vc1615-workspace #vc1614-body :is(.vc1614-card,.vc1614-metric){background:#fff!important;border:1px solid #dce7f0!important;border-radius:12px!important;box-shadow:0 2px 12px rgba(30,65,100,.035);padding:15px!important}
#vc1615-workspace #vc1614-body .vc1614-card h4{font:850 15px/1.35 system-ui!important;color:#193f64!important;margin:0 0 9px!important}
#vc1615-workspace #vc1614-body .vc1614-card p{font-size:12px!important;line-height:1.5!important;color:#59758e!important}
#vc1615-workspace #vc1614-body .vc1614-metric>strong{font-size:clamp(21px,2vw,30px)!important}
#vc1615-workspace #vc1614-body .vc1614-table-wrap{overflow-x:auto;max-width:100%}
#vc1615-workspace #vc1614-body table{font-size:12px!important}
#vc1615-workspace #vc1614-body th{font-size:11px!important;background:#eef4fa!important;color:#496a86!important}
#vc1615-workspace #vc1614-body td{font-size:12px!important}
#vc1615-workspace #vc1614-body :is(.vc1614-method,.vc1614-footer){font-size:11px!important;color:#68839a!important}
#vc1615-workspace #vc1614-body .vc1614-insight{padding:13px!important;border-radius:9px!important}
#vc1615-workspace #vc1614-body .vc1614-insight>b{font-size:13px!important}
#vc1615-workspace #vc1614-body .vc1614-insight p{font-size:12px!important}
#vc1615-workspace #vc1614-body button.vc1614-drill{font:800 11px system-ui!important;min-height:34px!important;padding:7px 11px!important}
#vc1615-workspace .vc1615-method{margin-top:14px;color:#6b8397;font-size:11px;line-height:1.5;border-top:1px solid #e4edf4;padding-top:10px}
@media(max-width:1220px){#vc1615-workspace .vc1615-nav{grid-template-columns:repeat(3,minmax(0,1fr))}#vc1615-workspace .vc1615-context{grid-template-columns:minmax(170px,.8fr) minmax(0,2fr)}}
@media(max-width:720px){#vc1615-workspace .vc1615-hero{padding:16px;flex-direction:column;align-items:flex-start;gap:12px}#vc1615-workspace .vc1615-context{grid-template-columns:1fr;padding:12px}#vc1615-workspace .vc1614-toolbar label{flex:1 1 95px}#vc1615-workspace .vc1615-commandbar{padding:10px 12px;align-items:flex-start}#vc1615-workspace .vc1615-nav{grid-template-columns:repeat(2,minmax(0,1fr))}#vc1615-workspace .vc1615-nav button{min-height:56px!important;font-size:11px!important}#vc1615-workspace .vc1615-stage{padding:12px}#vc1615-workspace .vc1615-stage-heading h3{font-size:18px!important}#vc1615-workspace .vc1614-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}#vc1615-workspace #vc1614-body .vc1614-card{padding:10px!important}}
`;
  const info={
    overview:['Panorama','Resultado y explicaciones'],
    players:['Jugadores','Fundamentos y rendimiento'],
    rotations:['Rotaciones','K1, K2 y G–P'],
    distribution:['Distribución','Secuencias de juego'],
    zones:['Zonas','Mapa y direcciones'],
    explorer:['Explorador','Calidad y trazabilidad']
  };
  function setSection(key,sub){
    if(!sections[key])return;
    active=key;
    const item=sections[key];
    const selected=sub||selectedSub[key]||item.tabs[0][0];
    const valid=item.tabs.some(x=>x[0]===selected)?selected:item.tabs[0][0];
    selectedSub[key]=valid;
    const original=$('vc1614-tabs')?.querySelector(`[data-tab="${valid}"]`);
    original?.click();
    const title=$('vc1615-section-title');if(title)title.textContent=item.title;
    const subtitle=$('vc1615-section-description');if(subtitle)subtitle.textContent=item.desc;
    document.querySelectorAll('#vc1615-nav [data-section]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.section===key)));
    const subbar=$('vc1615-subnav');
    if(subbar){
      subbar.hidden=item.tabs.length<2;
      subbar.replaceChildren(...item.tabs.map(([id,label])=>{
        const b=document.createElement('button');b.type='button';b.dataset.subtab=id;b.textContent=label;b.setAttribute('aria-pressed',String(valid===id));return b;
      }));
    }
  }
  function setMode(next){
    mode=next==='technical'?'technical':'workspace';
    const view=$('scout-analysis'),select=$('scout-analysis-match');
    if(!view)return;
    if(mode==='technical'){
      if(originalMatchPosition?.parentNode && select)originalMatchPosition.parentNode.insertBefore(select,originalMatchPosition.nextSibling);
    }else{
      const target=$('vc1615-match-slot');if(select&&target&&select.parentNode!==target)target.appendChild(select);
    }
    view.dataset.vc1615Mode=mode;
    const v14=$('vc1614-view-switch')?.querySelector(`[data-mode="${mode==='workspace'?'intelligence':'technical'}"]`);
    v14?.click();
    if(mode==='workspace')setSection(active);
  }
  function mount(){
    const root=$('vc1614-intelligence'),view=$('scout-analysis'),header=view?.querySelector('.scout-analysis-header');
    if(!root||!header||$('vc1615-workspace'))return !!$('vc1615-workspace');
    const select=$('scout-analysis-match');
    if(!select||!$('vc1614-body')||!$('vc1614-tabs')||!$('vc1614-view-switch'))return false;
    const cssNode=document.createElement('style');cssNode.id='vc1615-workspace-style';cssNode.textContent=css;document.head.appendChild(cssNode);
    originalMatchPosition=document.createComment('vc1615: original match selector');select.parentNode.insertBefore(originalMatchPosition,select);
    const shell=document.createElement('div');shell.id='vc1615-workspace';
    shell.innerHTML=`<div class="vc1615-hero"><div><span class="vc1615-kicker">VOLLEY COACH · PROFESSIONAL ANALYSIS</span><h2>Analysis Center Pro</h2><p>De la codificación a la interpretación: cada resultado conserva su muestra y puede enlazar con sus jugadas.</p></div><div class="vc1615-head-actions"><button type="button" class="vc1615-technical-btn" id="vc1615-technical">Análisis técnico completo</button></div></div>
    <div class="vc1615-context"><label class="vc1615-match"><span>Partido</span><span id="vc1615-match-slot"></span></label><div id="vc1615-filters"></div></div>
    <div class="vc1615-commandbar"><small>Datos del partido seleccionado · Solo lectura · Rallies cerrados</small><div class="vc1615-exports" id="vc1615-exports"></div></div>
    <div id="vc1615-nav" class="vc1615-nav" role="tablist" aria-label="Áreas del análisis profesional">${Object.entries(info).map(([id,[name,desc]])=>`<button type="button" role="tab" data-section="${id}" aria-selected="false">${name}<small>${desc}</small></button>`).join('')}</div>
    <div class="vc1615-stage"><div class="vc1615-stage-heading"><div><h3 id="vc1615-section-title">Panorama del partido</h3><p id="vc1615-section-description"></p></div><div id="vc1615-subnav" class="vc1615-subnav" hidden></div></div><div id="vc1615-results"></div><div class="vc1615-method">Interpretación descriptiva basada en acciones registradas. Sin rally abierto; una muestra pequeña no permite conclusiones firmes. El análisis técnico histórico continúa disponible.</div></div>`;
    root.prepend(shell);
    $('vc1615-filters').appendChild(root.querySelector('.vc1614-toolbar'));
    const buttons=root.querySelector('.vc1614-heading-actions');if(buttons)$('vc1615-exports').append(...Array.from(buttons.children));
    $('vc1615-results').appendChild($('vc1614-body'));
    const back=document.createElement('button');back.type='button';back.id='vc1615-back';back.textContent='← Volver a Analysis Center Pro';
    header.before(back);back.addEventListener('click',()=>setMode('workspace'));
    $('vc1615-technical').addEventListener('click',()=>setMode('technical'));
    $('vc1615-nav').addEventListener('click',ev=>{const btn=ev.target.closest('[data-section]');if(btn)setSection(btn.dataset.section)});
    $('vc1615-subnav').addEventListener('click',ev=>{const btn=ev.target.closest('[data-subtab]');if(btn)setSection(active,btn.dataset.subtab)});
    $('vc1615-nav').addEventListener('keydown',ev=>{
      if(ev.key!=='ArrowRight'&&ev.key!=='ArrowLeft')return;
      const keys=Object.keys(info),index=keys.indexOf(active),next=(index+(ev.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
      ev.preventDefault();setSection(keys[next]);$('vc1615-nav').querySelector(`[data-section="${keys[next]}"]`)?.focus();
    });
    setMode('workspace');
    return true;
  }
  if(!mount()){
    document.addEventListener('DOMContentLoaded',mount,{once:true});
    let attempts=0;
    const retry=()=>{if(mount()||++attempts>12)return;setTimeout(retry,100)};
    retry();
  }
  window.VC_ANALYSIS_WORKSPACE_1615={version:VERSION,mount,setSection,setMode,diagnostics:()=>({section:active,mode,tab:selectedSub[active]||sections[active].tabs[0][0],sameRenderer:!!$('vc1614-body')?.closest('#vc1615-workspace')})};
})();
