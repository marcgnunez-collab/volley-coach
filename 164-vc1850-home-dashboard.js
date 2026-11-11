/* Volley Coach V18.9.0 · Home Dashboard Pro · visual refresh.
 * Read-only projection of existing competitions, training, scouting and clip data.
 * No new local/cloud persistence or changes to match/scout/media engines.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.9.0';
const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
const arr=x=>Array.isArray(x)?x:[];
function localISO(date=new Date()){
  const d=new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function dateLabel(iso,opts={weekday:'short',day:'numeric',month:'short'}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||'')))return 'Fecha sin indicar';
  const d=new Date(iso+'T12:00:00');return Number.isFinite(d.getTime())?d.toLocaleDateString('es-ES',opts):'Fecha sin indicar';
}
function upcomingMatches(matches,today){return arr(matches).filter(x=>x&&x.status!=='Jugado'&&String(x.date||'')>=today&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.date||''))).slice().sort((a,b)=>String(a.date+(a.time||'')).localeCompare(String(b.date+(b.time||''))));}
function upcomingSessions(plans,today){return arr(plans).filter(x=>x&&!x.realizado&&String(x.fecha||'')>=today&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha||''))).slice().sort((a,b)=>String(a.fecha+(a.hora||'')).localeCompare(String(b.fecha+(b.hora||''))));}
function playedMatches(matches){return arr(matches).filter(x=>x&&x.status==='Jugado'&&Number.isFinite(Number(x.setsFor))&&Number.isFinite(Number(x.setsAgainst))&&x.setsFor!==''&&x.setsAgainst!=='').slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));}
function results(matches){const played=playedMatches(matches),wins=played.filter(m=>Number(m.setsFor)>Number(m.setsAgainst)).length;return {played,wins,losses:played.length-wins,winPct:played.length?Math.round(100*wins/played.length):null};}
function recentActivity(matches,history,scoutings){
 const rows=[];
 for(const m of arr(matches))if(m?.date)rows.push({type:'match',date:m.date,time:m.time||'',label:'Partido · '+clean(m.opponent||'Rival'),detail:m.status==='Jugado'?`Resultado ${m.setsFor??'—'}–${m.setsAgainst??'—'} en sets`:'Partido programado',id:m.id});
 for(const h of arr(history))if(h?.fecha)rows.push({type:'training',date:h.fecha,time:'',label:'Entrenamiento · '+clean(h.objetivo||'Sesión'),detail:'Sesión registrada en el historial',id:h.id});
 if(!rows.length)for(const m of arr(scoutings)){
   const date=String(m?.date||m?.matchDate||'').slice(0,10);
   if(/^\d{4}-\d{2}-\d{2}$/.test(date))rows.push({type:'scouting',date,time:'',label:'Scouting · '+clean(m.opponent||'Rival'),detail:'Scouting guardado',id:m.id});
 }
 return rows.sort((a,b)=>String(b.date+' '+b.time).localeCompare(String(a.date+' '+a.time))).slice(0,4);
}
function snapshotData(root){
 // These bindings are declared by the pre-existing classic training scripts.
 // We read the active team's in-memory state only; never write or clone it.
 let teamId='';let teamName='Equipo activo',matches=[],plans=[],history=[];
 try{if(typeof equipoActivo!=='undefined')teamId=clean(equipoActivo)}catch(_){}
 try{if(typeof EQUIPOS!=='undefined'&&EQUIPOS?.[teamId]?.nombre)teamName=clean(EQUIPOS[teamId].nombre)}catch(_){}
 try{if(typeof partidosEquipo!=='undefined')matches=arr(partidosEquipo)}catch(_){}
 try{if(typeof planificacion!=='undefined')plans=arr(planificacion)}catch(_){}
 try{if(typeof historial!=='undefined')history=arr(historial)}catch(_){}
 let scouts=[];try{scouts=arr(root.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.())}catch(_){}
 let clips=null;try{const value=root.VC_SCOUT_CLIPS_PRO?.list?.();if(Array.isArray(value))clips=value.length}catch(_){}
 const today=localISO(),game=upcomingMatches(matches,today)[0]||null,session=upcomingSessions(plans,today)[0]||null;
 return {teamId,teamName,game,session,matches,plans,history,scouts,clips,stats:results(matches),activity:recentActivity(matches,history,scouts)};
}
function svgLineData(played){
 const last=arr(played).slice(-6).filter(x=>Number(x.setsFor)+Number(x.setsAgainst)>0);
 return last.map((m,i)=>({label:dateLabel(m.date,{day:'2-digit',month:'short'}),name:clean(m.opponent||'Rival'),setsFor:Number(m.setsFor),setsAgainst:Number(m.setsAgainst),percent:Math.round(Number(m.setsFor)/(Number(m.setsFor)+Number(m.setsAgainst))*100),index:i}));
}
function mount(root){
 const doc=root.document;if(!doc)return false;
 function start(){
  if(root.VC_HOME_DASHBOARD_1850)return true;
  const dashboard=doc.getElementById('dashboard');if(!dashboard||!doc.getElementById('v11-topbar')||!root.VC17_WORKSPACE)return false;
  const shell=doc.createElement('section');shell.id='vc1850-home';shell.setAttribute('aria-label','Centro de control Volley Coach');
  shell.innerHTML=`
   <div class="vc1850-welcome">
    <div><span class="vc1850-eyebrow">VOLLEY COACH · HOME PRO</span><h2>Centro de control</h2><p>Tu equipo, preparado para competir.</p></div>
    <div class="vc1850-welcome-actions"><button type="button" class="vc1850-primary" data-vc1850-action="new-match">＋ Nuevo partido</button><button type="button" class="vc1850-outline" data-vc1850-action="new-training">▦ Planificar entrenamiento</button></div>
   </div>
   <div class="vc1850-feature-row">
    <article class="vc1850-match-hero" aria-label="Próximo partido">
     <div class="vc1850-match-copy"><div class="vc1850-feature-label">◷ PRÓXIMO PARTIDO</div><h3 id="vc1850-next-match">Sin partido programado</h3><p id="vc1850-match-details">Programa tu siguiente encuentro para verlo aquí.</p><button type="button" data-vc1850-action="open-match">Abrir partidos <span aria-hidden="true">→</span></button></div>
     <div class="vc1850-court" aria-hidden="true"><img src="./assets/vc1850-court-premium.png" alt="" loading="lazy" decoding="async"></div>
    </article>
    <article class="vc1850-training-feature"><div class="vc1850-feature-label">◉ PRÓXIMO ENTRENAMIENTO</div><h3 id="vc1850-next-training">Sin sesión programada</h3><div id="vc1850-training-details">Planifica el próximo entrenamiento del equipo.</div><button type="button" data-vc1850-action="open-training">Abrir planificación <span aria-hidden="true">→</span></button></article>
   </div>
   <section class="vc1850-kpis" aria-label="Indicadores del equipo">
    <div class="vc1850-kpi"><span class="vc1850-kpi-icon blue">▣</span><span class="vc1850-kpi-label">Partidos jugados</span><strong id="vc1850-kpi-games">—</strong><small>Con resultado registrado</small></div>
    <div class="vc1850-kpi"><span class="vc1850-kpi-icon green">♜</span><span class="vc1850-kpi-label">Victorias</span><strong id="vc1850-kpi-wins">—</strong><small>Partidos con resultado</small></div>
    <div class="vc1850-kpi"><span class="vc1850-kpi-icon orange">◇</span><span class="vc1850-kpi-label">Entrenamientos</span><strong id="vc1850-kpi-training">—</strong><small>Sesiones completadas</small></div>
    <div class="vc1850-kpi"><span class="vc1850-kpi-icon violet">▷</span><span class="vc1850-kpi-label">Clips guardados</span><strong id="vc1850-kpi-clips">—</strong><small>Scouting seleccionado</small></div>
   </section>
   <div class="vc1850-content-row">
    <section class="vc1850-panel vc1850-activity"><div class="vc1850-panel-head"><h3>Actividad reciente</h3><button type="button" data-vc1850-action="go-activity">Ver partidos →</button></div><div id="vc1850-activity-list" class="vc1850-activity-list" aria-live="polite"></div></section>
    <section class="vc1850-panel vc1850-performance"><div class="vc1850-panel-head"><div><h3>Resultados recientes</h3><p>Porcentaje de sets ganados por partido</p></div><span>Últimos 6 partidos</span></div><div class="vc1850-chart" id="vc1850-chart" role="img" aria-label="Resultados recientes"></div><div class="vc1850-result-summary"><div><small>Victorias</small><strong id="vc1850-results-wins">—</strong></div><div><small>Derrotas</small><strong id="vc1850-results-losses">—</strong></div><div><small>Porcentaje de victorias</small><strong id="vc1850-results-pct">—</strong></div></div></section>
   </div>
   <section class="vc1850-shortcuts"><h3>Accesos rápidos</h3><div class="vc1850-shortcut-grid"><button type="button" data-vc1850-action="scouting"><span class="vc1850-shortcut-icon">⌁</span><span><strong>Scouting en directo</strong><small>Registra y analiza el partido</small></span><b aria-hidden="true">›</b></button><button type="button" data-vc1850-action="camera"><span class="vc1850-shortcut-icon">▹</span><span><strong>Cámara + Delay</strong><small>Captura, revisa y graba con retraso</small></span><b aria-hidden="true">›</b></button><button type="button" data-vc1850-action="analysis"><span class="vc1850-shortcut-icon">▥</span><span><strong>Análisis de partido</strong><small>Estadísticas, tendencias y rotaciones</small></span><b aria-hidden="true">›</b></button></div></section>
   <p class="vc1850-footnote">Los indicadores se calculan con los registros del equipo activo. Las grabaciones de vídeo y la presencia de dispositivos son independientes del guardado del scouting.</p>`;
  dashboard.prepend(shell);dashboard.classList.add('vc1850-ready');
  let nextMatchId=null,needsUpdate=true,lastSignature='';let scheduled=false;let refreshes=0;
  const $=id=>doc.getElementById(id);
  const set=(id,value)=>{const el=$(id);if(el&&el.textContent!==String(value))el.textContent=String(value)};
  function drawActivity(rows){
   const list=$('vc1850-activity-list');if(!list)return;list.replaceChildren();
   if(!rows.length){const empty=doc.createElement('div');empty.className='vc1850-empty';empty.textContent='Todavía no hay actividad registrada. Crea un partido o guarda un entrenamiento para comenzar.';list.append(empty);return;}
   for(const item of rows){
    const btn=doc.createElement('button');btn.type='button';btn.className='vc1850-activity-item';btn.dataset.vc1850Open=item.type;btn.dataset.vc1850Id=String(item.id??'');
    const icon=doc.createElement('span');icon.className='vc1850-activity-icon '+item.type;icon.textContent=item.type==='training'?'◇':item.type==='scouting'?'⌁':'▣';
    const body=doc.createElement('span');body.className='vc1850-activity-text';const name=doc.createElement('strong');name.textContent=item.label;const detail=doc.createElement('small');detail.textContent=item.detail;body.append(name,detail);
    const time=doc.createElement('time');time.textContent=dateLabel(item.date,{day:'2-digit',month:'short'});btn.append(icon,body,time);list.append(btn);
   }
  }
  function drawChart(data){
   const host=$('vc1850-chart');if(!host)return;host.replaceChildren();
   const rows=svgLineData(data);if(!rows.length){const empty=doc.createElement('div');empty.className='vc1850-chart-empty';empty.textContent='Sin resultados suficientes para mostrar la evolución.';host.append(empty);host.setAttribute('aria-label','Sin resultados registrados');return;}
   const NS='http://www.w3.org/2000/svg';const svg=doc.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 580 190');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
   const make=(tag,attrs,text)=>{const node=doc.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=String(text);svg.append(node);return node};
   for(const pct of [0,25,50,75,100]){const y=152-pct*1.18;make('line',{x1:42,y1:y,x2:557,y2:y,stroke:'#dbe5f2','stroke-width':1});make('text',{x:3,y:y+4,fill:'#667b94','font-size':11},pct+'%')}
   const n=rows.length;const pts=rows.map((p,i)=>({x:n===1?301:52+i*493/(n-1),y:152-p.percent*1.18,p}));
   const path=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
   if(pts.length>1){const first=pts[0],last=pts[pts.length-1];make('path',{d:path+` L ${last.x} 152 L ${first.x} 152 Z`,fill:'#d9edff',opacity:'.78'});make('path',{d:path,fill:'none',stroke:'#146bd2','stroke-width':3.6,'stroke-linecap':'round','stroke-linejoin':'round'});}
   for(const p of pts){const c=make('circle',{cx:p.x,cy:p.y,r:5.3,fill:'#146bd2',stroke:'#fff','stroke-width':2.2});const t=doc.createElementNS(NS,'title');t.textContent=`${p.p.name}: ${p.p.setsFor}–${p.p.setsAgainst} sets (${p.p.percent}%)`;c.append(t);make('text',{x:p.x,y:178,'text-anchor':'middle',fill:'#61758c','font-size':11},p.p.label)}
   host.setAttribute('aria-label','Porcentaje de sets ganados: '+rows.map(p=>p.name+' '+p.percent+'%').join(', '));host.append(svg);
  }
  function update(){
   if(!dashboard.classList.contains('active')){needsUpdate=true;return false;}
   const data=snapshotData(root),signature=JSON.stringify({team:data.teamId,game:data.game,session:data.session,stats:data.stats,history:data.history.map(x=>[x.id,x.fecha,x.objetivo]),clips:data.clips,activity:data.activity});
   if(!needsUpdate&&signature===lastSignature)return false;needsUpdate=false;lastSignature=signature;refreshes++;
   const m=data.game,p=data.session;nextMatchId=m?.id??null;
   set('vc1850-next-match',m?`${data.teamName} vs ${clean(m.opponent||'Rival')}`:'Sin partido programado');
   set('vc1850-match-details',m?[dateLabel(m.date),m.time||'',m.competition||'',m.venue||''].filter(Boolean).join(' · '):'Programa el próximo encuentro desde Partidos.');
   const mButton=shell.querySelector('[data-vc1850-action="open-match"]');if(mButton)mButton.firstChild.textContent=m?'Preparar partido ':'Abrir partidos ';
   set('vc1850-next-training',p?dateLabel(p.fecha,{weekday:'long',day:'numeric',month:'short'}):'Sin sesión programada');
   set('vc1850-training-details',p?[p.objetivo||'Entrenamiento',p.hora||'',p.duracion?`${p.duracion} min`:''].filter(Boolean).join(' · '):'Organiza tu siguiente sesión desde la planificación.');
   set('vc1850-kpi-games',data.stats.played.length);set('vc1850-kpi-wins',data.stats.wins);set('vc1850-kpi-training',data.history.length);set('vc1850-kpi-clips',data.clips===null?'—':data.clips);
   set('vc1850-results-wins',data.stats.wins);set('vc1850-results-losses',data.stats.losses);set('vc1850-results-pct',data.stats.winPct===null?'—':data.stats.winPct+'%');
   drawChart(data.stats.played);drawActivity(data.activity);
   return true;
  }
  function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||setTimeout)(()=>{scheduled=false;update()});}
  function route(view,group){return root.VC17_WORKSPACE?.route?.(view,group)!==false;}
  function action(name,id){
   if(name==='new-match'){if(route('competicion','matches'))root.abrirPartidoModal?.();return;}
   if(name==='new-training'){if(!route('planificacion','training'))return;root.abrirCreadorPlanificacion?.('', 'training');return;}
   if(name==='open-match'){if(!nextMatchId)return route('scout-dashboard','matches');if(!route('competicion','matches'))return;root.abrirPartidoModal?.(nextMatchId);return;}
   if(name==='open-training')return route('planificacion','training');
   if(name==='scouting')return route(root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()?'scout-match-mode':'scout-dashboard','matches');
   if(name==='camera'){if(route('scout-video-hub','training'))root.VC_VIDEO_WORKSPACES_1830?.setScreen?.('camara');return;}
   if(name==='analysis')return route('scout-analysis','analysis');
   if(name==='go-activity')return route('competicion','matches');
   if(name==='match'){if(route('competicion','matches')&&id)root.abrirPartidoModal?.(Number(id));return;}
   if(name==='training')return route('historial','training');
  }
  shell.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button||!shell.contains(button))return;
   if(button.dataset.vc1850Action)action(button.dataset.vc1850Action);
   else if(button.dataset.vc1850Open)action(button.dataset.vc1850Open,button.dataset.vc1850Id);
  });
  function onVisibility(){const active=dashboard.classList.contains('active');doc.body.classList.toggle('vc1850-home-active',active);if(active){needsUpdate=true;schedule();}}
  if(root.MutationObserver)new root.MutationObserver(onVisibility).observe(dashboard,{attributes:true,attributeFilter:['class']});
  const priorRender=root.renderDashboard;
  if(typeof priorRender==='function'&&!priorRender.__vc1850){const wrapped=function(...args){const r=priorRender.apply(this,args);needsUpdate=true;schedule();return r};wrapped.__vc1850=true;root.renderDashboard=wrapped;}
  const priorSwitch=root.cambiarEquipo;
  if(typeof priorSwitch==='function'&&!priorSwitch.__vc1850){const wrapped=function(...args){const r=priorSwitch.apply(this,args);needsUpdate=true;schedule();return r};wrapped.__vc1850=true;root.cambiarEquipo=wrapped;}
  doc.addEventListener('visibilitychange',()=>{if(!doc.hidden){needsUpdate=true;schedule()}});
  root.setInterval?.(()=>{if(!doc.hidden&&dashboard.classList.contains('active')){needsUpdate=true;schedule()}},15000);
  onVisibility();root.VC_HOME_DASHBOARD_1850={version:VERSION,refresh:()=>{needsUpdate=true;return update()},diagnostics:()=>({version:VERSION,visible:dashboard.classList.contains('active'),refreshes,oldDashboardPreserved:!!doc.getElementById('dash-next-plan'),cloudEngineModified:false,mediaEngineModified:false})};
  return true;
 }
 let attempts=0;function boot(){if(start())return;if(++attempts<60)root.setTimeout?.(boot,250)}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();return true;
}
return {VERSION,localISO,dateLabel,upcomingMatches,upcomingSessions,playedMatches,results,recentActivity,svgLineData,mount};
});
