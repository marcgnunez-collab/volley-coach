/* Volley Coach V18.5.1 · Centro de partidos profesional.
 * Vista de solo lectura sobre el calendario de competición y el scouting existente.
 * No crea una segunda base de datos ni escribe en nube, partidos o rallies.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='18.5.1', arr=x=>Array.isArray(x)?x:[], tidy=x=>String(x??'').replace(/\s+/g,' ').trim();
 const validDay=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||''));
 const localDay=(date=new Date())=>{const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const dateText=iso=>validDay(iso)?new Date(String(iso)+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):'Sin fecha';
 const fullDate=iso=>validDay(iso)?new Date(String(iso)+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}):'Fecha por confirmar';
 const statusOf=(calendar,scout)=>{
  const s=String(scout?.status||'').toLowerCase(),c=String(calendar?.status||'').toLowerCase();
  if(scout&&(s==='live'||s==='in_progress'||s==='playing'||s==='en curso'))return 'live';
  if(scout&&s==='finished'||c==='jugado')return 'finished';
  if(c==='cancelado'||c==='aplazado')return 'other';
  return 'pending';
 };
 function makeRecords(calendar,scouts,today=localDay()){
  const linked=new Set(),rows=[];
  for(const m of arr(calendar)){
   if(!m||m.id==null)continue;
   const scout=arr(scouts).find(s=>s&&s.linkedMatchId!=null&&String(s.linkedMatchId)===String(m.id))||null;
   if(scout)linked.add(String(scout.id));
   const status=statusOf(m,scout);
   rows.push({key:'match:'+m.id,id:String(m.id),source:'match',calendar:m,scout,date:tidy(m.date),time:tidy(m.time),opponent:tidy(m.opponent)||'Rival por confirmar',competition:tidy(m.competition)||'Sin competición',round:tidy(m.round),status,rawStatus:tidy(m.status),score:m.status==='Jugado'&&m.setsFor!==''&&m.setsAgainst!==''&&m.setsFor!=null&&m.setsAgainst!=null?`${m.setsFor}–${m.setsAgainst}`:'—',sort:tidy(m.date)+' '+tidy(m.time)});
  }
  for(const s of arr(scouts)){
   if(!s||s.id==null||linked.has(String(s.id)))continue;
   rows.push({key:'scout:'+s.id,id:String(s.id),source:'scout',calendar:null,scout:s,date:tidy(s.date).slice(0,10),time:'',opponent:tidy(s.opponent)||'Rival por confirmar',competition:tidy(s.competition)||'Scouting independiente',round:'',status:statusOf(null,s),rawStatus:tidy(s.status),score:'—',sort:tidy(s.date)});
  }
  const rank={live:0,pending:1,finished:2,other:3};
  rows.sort((a,b)=>rank[a.status]-rank[b.status]||(a.status==='pending'?a.sort.localeCompare(b.sort):b.sort.localeCompare(a.sort)));
  const upcoming=rows.filter(x=>x.status==='pending'&&validDay(x.date)&&x.date>=today).sort((a,b)=>a.sort.localeCompare(b.sort));
  const live=rows.filter(x=>x.status==='live');
  const completed=rows.filter(x=>x.status==='finished');
  const withScores=completed.filter(x=>x.calendar&&x.score!=='—').sort((a,b)=>b.sort.localeCompare(a.sort));
  const needsScouting=rows.filter(x=>x.calendar&&x.status==='pending'&&!x.scout).length;
  return {rows,upcoming,live,completed,latestResult:withScores[0]||null,needsScouting,hero:live[0]||upcoming[0]||null};
 }
 function filteredRows(rows,tab='all',text=''){
  const q=tidy(text).toLocaleLowerCase('es-ES');return arr(rows).filter(x=>(tab==='all'||x.status===tab)&&(!q||[x.opponent,x.competition,x.round,x.date,x.rawStatus].join(' ').toLocaleLowerCase('es-ES').includes(q)));
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  function start(){
   if(root.VC_MATCH_CENTER_1851)return true;
   const host=doc.getElementById('scout-dashboard');
   if(!host||!root.VC_SCOUT_VIDEO_BRIDGE||!root.VC17_WORKSPACE)return false;
   const shell=doc.createElement('section');shell.id='vc1851-center';shell.setAttribute('aria-label','Centro de partidos');
   shell.innerHTML=`
    <div class="vc1851-head"><div><span class="vc1851-eyebrow">PARTIDOS / CENTRO DE CONTROL</span><h2>Centro de partidos</h2><p>Agenda, seguimiento y scoutings del equipo activo en un solo lugar.</p></div><div class="vc1851-head-actions"><button type="button" class="vc1851-quiet" data-vc1851-action="calendar">▦ Ver calendario</button><button type="button" class="vc1851-primary" data-vc1851-action="new-match">＋ Nuevo partido</button></div></div>
    <div class="vc1851-kpis" aria-label="Resumen de partidos">
     <article><span class="vc1851-kpi-icon blue">▣</span><div><small>Próximos partidos</small><strong id="vc1851-kpi-upcoming">—</strong></div></article>
     <article><span class="vc1851-kpi-icon red">◉</span><div><small>Scouting en directo</small><strong id="vc1851-kpi-live">—</strong></div></article>
     <article><span class="vc1851-kpi-icon violet">▤</span><div><small>Sin scouting preparado</small><strong id="vc1851-kpi-pending">—</strong></div></article>
     <article><span class="vc1851-kpi-icon green">♜</span><div><small>Último resultado</small><strong id="vc1851-kpi-last">—</strong></div></article>
    </div>
    <section class="vc1851-hero" aria-label="Partido destacado"><div class="vc1851-hero-content"><span class="vc1851-hero-tag" id="vc1851-hero-tag">PRÓXIMO PARTIDO</span><h3 id="vc1851-hero-title">Sin próximo partido</h3><p id="vc1851-hero-meta">Programa un encuentro para prepararlo desde aquí.</p><div class="vc1851-hero-actions"><button type="button" class="vc1851-primary" data-vc1851-action="hero-main">Abrir partidos</button><button type="button" class="vc1851-hero-outline" data-vc1851-action="hero-prepare">Preparar scouting</button></div></div><div class="vc1851-hero-art" aria-hidden="true"><svg viewBox="0 0 310 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vc1851-ball-fill" cx=".35" cy=".27" r=".72"><stop offset="0" stop-color="#ffdf84"/><stop offset="1" stop-color="#e6a51b"/></radialGradient></defs><circle cx="196" cy="110" r="84" fill="url(#vc1851-ball-fill)" stroke="#fce8b0" stroke-width="3"/><g fill="none" stroke="#234c9e" stroke-width="8" stroke-linecap="round"><path d="M132 53Q178 106 143 182"/><path d="M192 28Q159 111 241 173"/><path d="M270 69Q208 93 205 192"/><path d="M126 121Q193 135 274 114"/><path d="M159 35Q199 77 277 88"/></g><g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"><path d="M10 160L112 50L284 70L209 190Z"/><path d="M75 92L249 134M112 50L209 190"/></g></svg></div></section>
    <div class="vc1851-content"><section class="vc1851-table-card"><div class="vc1851-section-head"><div><h3>Partidos de la temporada</h3><p>Abre las fichas y los scoutings existentes sin duplicarlos.</p></div><button type="button" class="vc1851-link" data-vc1851-action="calendar">Calendario →</button></div><div class="vc1851-controls"><div class="vc1851-tabs" role="group" aria-label="Filtrar partidos"><button type="button" data-vc1851-tab="all" aria-pressed="true">Todos <span data-vc1851-tab-count="all">0</span></button><button type="button" data-vc1851-tab="live" aria-pressed="false">En directo <span data-vc1851-tab-count="live">0</span></button><button type="button" data-vc1851-tab="pending" aria-pressed="false">Pendientes <span data-vc1851-tab-count="pending">0</span></button><button type="button" data-vc1851-tab="finished" aria-pressed="false">Finalizados <span data-vc1851-tab-count="finished">0</span></button></div><label class="vc1851-search"><span class="vc1851-visually-hidden">Buscar partidos</span><input id="vc1851-search" type="search" placeholder="Buscar rival o competición" autocomplete="off"></label></div><div class="vc1851-table-wrap"><table class="vc1851-table"><thead><tr><th>Fecha</th><th>Rival</th><th>Competición</th><th>Estado</th><th>Resultado</th><th>Acciones</th></tr></thead><tbody id="vc1851-rows"></tbody></table></div><div class="vc1851-table-footer" id="vc1851-count" aria-live="polite">Consultando registros…</div></section>
     <aside class="vc1851-side"><section class="vc1851-side-card"><h3>Acciones rápidas</h3><div class="vc1851-quick"><button type="button" class="vc1851-primary" data-vc1851-action="new-match">＋ Nuevo partido</button><button type="button" data-vc1851-action="new-scout">▤ Crear scouting</button><button type="button" data-vc1851-action="recovery">↶ Recuperar scouting</button><button type="button" data-vc1851-action="video">▷ Abrir Video Studio</button><button type="button" data-vc1851-action="analysis">▥ Analizar partidos</button></div></section><section class="vc1851-side-card"><h3>Actividad reciente</h3><div class="vc1851-recent" id="vc1851-recent"></div></section></aside>
    </div><p class="vc1851-footnote">El estado del scouting procede de los datos del equipo activo. «Dispositivos conectados» no garantiza que los cambios ya estén sincronizados.</p>`;
   host.prepend(shell);host.classList.add('vc1851-ready');
   const $=id=>doc.getElementById(id),set=(id,value)=>{const n=$(id);if(n&&n.textContent!==String(value))n.textContent=String(value)};
   const state={tab:'all',query:'',hero:null,records:[],signature:'',refreshes:0};
   const route=(view,group='matches')=>{try{return root.VC17_WORKSPACE?.route?.(view,group)!==false}catch(_){return false}};
   const read=()=>{const b=root.VC_SCOUT_VIDEO_BRIDGE;let calendar=[],scouts=[];try{calendar=arr(b?.getPlannedMatches?.())}catch(_){}try{scouts=arr(b?.getMatches?.())}catch(_){}let name='Equipo activo';try{name=tidy(b?.teamName?.())||name}catch(_){}return {calendar,scouts,name}};
   function activity(data){const activity=[...data.scouts.map(s=>({label:'Scouting · '+tidy(s.opponent||'Rival'),date:String(s.updatedAt||s.date||'').slice(0,10),kind:'scout',id:s.id})),...data.calendar.filter(m=>m.status==='Jugado').map(m=>({label:'Partido finalizado · '+tidy(m.opponent||'Rival'),date:String(m.date||'').slice(0,10),kind:'match',id:m.id}))].filter(x=>validDay(x.date)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
    const box=$('vc1851-recent');if(!box)return;box.replaceChildren();if(!activity.length){const p=doc.createElement('p');p.className='vc1851-empty-recent';p.textContent='Sin actividad registrada todavía.';box.append(p);return;}
    for(const x of activity){const b=doc.createElement('button');b.type='button';b.dataset.vc1851Activity=x.kind;b.dataset.vc1851Id=String(x.id);const i=doc.createElement('span');i.className='vc1851-recent-icon';i.textContent=x.kind==='scout'?'▤':'✓';const c=doc.createElement('span');const title=doc.createElement('strong');title.textContent=x.label;const time=doc.createElement('small');time.textContent=dateText(x.date);c.append(title,time);b.append(i,c);box.append(b)}
   }
   const statusLabel=x=>x.status==='live'?'En directo':x.status==='pending'?'Pendiente':x.status==='finished'?'Finalizado':x.rawStatus||'Otro';
   function drawRows(rows){const target=$('vc1851-rows');target.replaceChildren();
    if(!rows.length){const tr=doc.createElement('tr'),td=doc.createElement('td');td.colSpan=6;td.className='vc1851-empty';td.textContent=state.query?'No hay partidos que coincidan con la búsqueda.':'No hay registros en este estado.';tr.append(td);target.append(tr);}
    for(const record of rows.slice(0,100)){
     const tr=doc.createElement('tr');tr.dataset.status=record.status;
     function cell(cls,value){const td=doc.createElement('td');td.className=cls;td.textContent=value;tr.append(td);return td;}
     const date=cell('vc1851-date',dateText(record.date));if(record.time){const time=doc.createElement('small');time.textContent=record.time;date.append(time)}
     const opponent=cell('vc1851-opponent',record.opponent);if(record.source==='scout'){const sub=doc.createElement('small');sub.textContent='Scouting sin ficha de calendario';opponent.append(sub)}
     cell('vc1851-competition',record.competition+(record.round?' · '+record.round:''));
     const status=cell('vc1851-status','');const pill=doc.createElement('span');pill.className='vc1851-pill '+record.status;pill.textContent=statusLabel(record);status.append(pill);
     const result=cell('vc1851-result',record.score);if(record.score!=='—'&&record.calendar&&Number(record.calendar.setsFor)>Number(record.calendar.setsAgainst))result.classList.add('won');
     const actions=cell('vc1851-row-actions','');
     const btn=(action,label,primary=false)=>{const b=doc.createElement('button');b.type='button';b.dataset.vc1851RowAction=action;b.dataset.vc1851Key=record.key;b.className=primary?'vc1851-row-primary':'vc1851-row-secondary';b.textContent=label;actions.append(b)};
     if(record.scout)btn('scout',record.status==='finished'?'Revisar scouting':'Abrir scouting',true);
     else if(record.calendar&&record.status!=='finished')btn('prepare','Preparar scouting',true);
     if(record.calendar)btn('detail','Ficha');
     tr.append();target.append(tr);
    }
    set('vc1851-count',rows.length===state.records.length?`${rows.length} registros del equipo`:`${rows.length} de ${state.records.length} registros`);
   }
   function render(force=false){if(!host.classList.contains('active'))return false;const d=read(),model=makeRecords(d.calendar,d.scouts);
    const signature=JSON.stringify({team:root.VC_SCOUT_VIDEO_BRIDGE?.getTeamId?.(),calendar:d.calendar.map(x=>[x.id,x.date,x.time,x.opponent,x.status,x.setsFor,x.setsAgainst]),scouts:d.scouts.map(x=>[x.id,x.date,x.status,x.opponent,x.linkedMatchId,x.updatedAt]),tab:state.tab,query:state.query});
    if(!force&&signature===state.signature)return false;state.signature=signature;state.refreshes++;state.records=model.rows;state.hero=model.hero;
    set('vc1851-kpi-upcoming',model.upcoming.length);set('vc1851-kpi-live',model.live.length);set('vc1851-kpi-pending',model.needsScouting);set('vc1851-kpi-last',model.latestResult?.score||'—');
    const hero=model.hero;set('vc1851-hero-tag',hero?.status==='live'?'SCOUTING EN DIRECTO':'PRÓXIMO PARTIDO');set('vc1851-hero-title',hero?`${d.name} vs ${hero.opponent}`:'Sin próximo partido');set('vc1851-hero-meta',hero?[fullDate(hero.date),hero.time,hero.competition,hero.round].filter(Boolean).join('  ·  '):'Programa un encuentro desde el Centro de partidos.');
    const primary=shell.querySelector('[data-vc1851-action="hero-main"]'),prepare=shell.querySelector('[data-vc1851-action="hero-prepare"]');primary.textContent=hero?.scout?'Abrir scouting':hero?.calendar?'Abrir ficha del partido':'Nuevo partido';prepare.hidden=!hero?.calendar||!!hero.scout||hero.status==='finished';
    for(const filter of ['all','live','pending','finished']){const count=filter==='all'?model.rows.length:model.rows.filter(x=>x.status===filter).length;setTabCount(filter,count);}
    shell.querySelectorAll('[data-vc1851-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.vc1851Tab===state.tab)));
    drawRows(filteredRows(model.rows,state.tab,state.query));activity(d);return true;
   }
   function setTabCount(tab,value){const el=shell.querySelector(`[data-vc1851-tab-count="${tab}"]`);if(el)el.textContent=String(value)}
   const recordByKey=key=>state.records.find(x=>x.key===key)||null;
   function prepare(record){if(!record?.calendar||typeof root.scoutOpenNewMatch!=='function')return false;root.scoutOpenNewMatch();const select=$('scout-new-linked');if(select&&Array.from(select.options).some(o=>String(o.value)===String(record.calendar.id))){select.value=String(record.calendar.id);select.dispatchEvent(new root.Event('change',{bubbles:true}));if(typeof root.scoutLinkedMatchChanged==='function')root.scoutLinkedMatchChanged();}return true;}
   function openRecord(record,what){if(!record)return false;if(what==='detail'&&record.calendar){root.abrirPartidoModal?.(Number(record.calendar.id));return true}if(what==='prepare')return prepare(record);if(what==='scout'&&record.scout){root.scoutOpenSaved?.(Number(record.scout.id));return true}return false;}
   function act(kind){
    if(kind==='new-match'){if(typeof root.abrirPartidoModal==='function')root.abrirPartidoModal();else if(route('competicion'))root.abrirPartidoModal?.();return;}
    if(kind==='calendar')return route('competicion');
    if(kind==='new-scout')return root.scoutOpenNewMatch?.();
    if(kind==='recovery'){if(typeof root.scoutV892OpenRecoveryCenter==='function')return root.scoutV892OpenRecoveryCenter();return route('scout-dashboard');}
    if(kind==='video'){if(route('scout-video-hub'))root.VC_VIDEO_WORKSPACES_1830?.setScreen?.('camara');return;}
    if(kind==='analysis')return route('scout-analysis','analysis');
    if(kind==='hero-main'){const h=state.hero;if(!h)return act('new-match');if(h.scout)return openRecord(h,'scout');if(h.calendar)return openRecord(h,'detail');return act('new-match')}
    if(kind==='hero-prepare')return prepare(state.hero);
   }
   shell.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!shell.contains(b))return;if(b.dataset.vc1851Tab){state.tab=b.dataset.vc1851Tab;render(true);return}if(b.dataset.vc1851RowAction){openRecord(recordByKey(b.dataset.vc1851Key),b.dataset.vc1851RowAction);return}if(b.dataset.vc1851Action){act(b.dataset.vc1851Action);return}if(b.dataset.vc1851Activity){const key=(b.dataset.vc1851Activity==='match'?'match:':'scout:')+b.dataset.vc1851Id;openRecord(recordByKey(key),b.dataset.vc1851Activity==='match'?'detail':'scout');}});
   $('vc1851-search')?.addEventListener('input',e=>{state.query=e.target.value;render(true)});
   if(root.MutationObserver)new root.MutationObserver(()=>{if(host.classList.contains('active'))render(true)}).observe(host,{attributes:true,attributeFilter:['class']});
   // Read-only polling when visible also reflects changes made by the existing forms and cloud engine.
   root.setInterval?.(()=>{if(!doc.hidden&&host.classList.contains('active'))render()},4000);
   render(true);root.VC_MATCH_CENTER_1851={version:VERSION,refresh:()=>render(true),diagnostics:()=>({version:VERSION,visible:host.classList.contains('active'),records:state.records.length,refreshes:state.refreshes,scoutingEngineModified:false,syncEngineModified:false})};return true;
  }
  let tries=0;function boot(){if(start())return;if(++tries<60)root.setTimeout?.(boot,250)}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();return true;
 }
 return {VERSION,localDay,dateText,statusOf,makeRecords,filteredRows,mount};
});
