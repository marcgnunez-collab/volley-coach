/* VC20714_BUNDLE: original source files in runtime execution order; do not reorder. */
/* VC20714_SOURCE_BEGIN:118-vc1611-video-sync-assistant.js */
(()=>{
'use strict';
/* V16.1.1 · Asistente de sincronización de vídeo.
   UI efímera; reutiliza V7.8, el estado canónico del partido y SU persistencia. */
if(window.VC_VIDEO_SYNC_ASSISTANT)return;
const $=id=>document.getElementById(id);
const hub=$('scout-video-hub');
const videoPanel=hub?.querySelector('.v780-video-panel');
const existing=hub?.querySelector('.v780-sync-actions');
if(!hub||!videoPanel||!existing)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>{t=Number(t);if(!Number.isFinite(t))return '—';const s=Math.max(0,t);return `${Math.floor(s/3600)?String(Math.floor(s/3600)).padStart(2,'0')+':':''}${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}.${String(Math.floor(s%1*10))}`};
const videoInfo=()=>{try{return window.v780Diagnostics?.()||{}}catch(_){return {}}};
const rows=()=>{try{return window.VC_VIDEO_REVIEW_API?.timeline?.()||[]}catch(_){return []}};
const timed=r=>{
 if(!r)return false;
 const n=Number(r.ms);
 if(!Number.isFinite(n)||n<0)return false;
 // An absent scout timestamp is represented as 0 in the legacy timeline.
 if(r.type==='action')return r.a?.scoutMs!=null&&r.a?.scoutMs!=='';
 return r.r?.scoutStartMs!=null||r.r?.actions?.some?.(a=>a.scoutMs!=null);
};
const activeMatchId=()=>String($('v780-match')?.value||videoInfo().match||'');
const state={open:false,step:1,matchId:'',anchorKey:'',anchorVideoTime:null,verificationKey:'',verificationTime:null,errorSec:null,warningAcknowledged:false,cached:[],query:'',verifyQuery:''};
const opener=document.createElement('button');opener.id='vc1611-open';opener.type='button';opener.className='ghost';opener.textContent='Asistente guiado';opener.setAttribute('aria-expanded','false');opener.setAttribute('aria-controls','vc1611-wizard');
existing.prepend(opener);
const wizard=document.createElement('section');wizard.id='vc1611-wizard';wizard.hidden=true;wizard.setAttribute('aria-label','Asistente para sincronizar vídeo y scouting');
wizard.innerHTML=`
 <header class="vc1611-head"><div><span>VIDEO REVIEW · SINCRONIZACIÓN</span><h3>Ajustar vídeo con las jugadas</h3><p>Una referencia común para todas las acciones con tiempo de scouting.</p></div><button type="button" id="vc1611-close" aria-label="Cerrar asistente">✕</button></header>
 <div class="vc1611-steps" aria-label="Progreso del asistente"><span data-step="1">1. Jugada</span><span data-step="2">2. Momento</span><span data-step="3">3. Comprobar</span></div>
 <div class="vc1611-body">
  <div data-vc1611-page="1"><p class="vc1611-info">1. Selecciona el partido y carga el vídeo desde <b>Reproductor</b>. En esta pantalla elige una acción que puedas reconocer fácilmente, por ejemplo el primer saque.</p>
   <div class="vc1611-current"><span>Partido y vídeo actuales</span><strong id="vc1611-source">—</strong></div>
   <label class="vc1611-field">Buscar acción <input id="vc1611-search" type="search" placeholder="Dorsal, código, set o rally" autocomplete="off"/></label>
   <label class="vc1611-field">Acción de referencia <select id="vc1611-anchor"><option value="">Selecciona una acción</option></select></label>
   <p id="vc1611-count" class="vc1611-hint"></p>
   <button type="button" id="vc1611-to-player">Abrir pestaña Reproductor para cargar vídeo</button>
  </div>
  <div data-vc1611-page="2" hidden><p class="vc1611-info">2. Reproduce el vídeo y <b>paúsalo en el instante exacto</b> de la acción seleccionada. Después captura la posición actual.</p>
   <div class="vc1611-readout"><span>Jugada elegida</span><strong id="vc1611-primary-label">—</strong><span>Reloj del scouting</span><strong id="vc1611-primary-scout">—</strong><span>Vídeo en este momento</span><strong id="vc1611-current-video">—</strong></div>
   <button type="button" id="vc1611-capture-primary" class="vc1611-primary">Marcar este instante del vídeo</button>
   <p id="vc1611-anchor-status" class="vc1611-hint">El vídeo debe estar cargado y disponible para pausarlo.</p>
  </div>
  <div data-vc1611-page="3" hidden><p class="vc1611-info">3. Comprueba una segunda acción del mismo vídeo. Es opcional, pero permite detectar cortes o relojes desajustados <b>antes de guardar</b>.</p>
   <div class="vc1611-readout"><span>Desfase propuesto</span><strong id="vc1611-proposed">—</strong><span>Acciones con tiempo de scouting</span><strong id="vc1611-eligible">—</strong></div>
   <label class="vc1611-field">Buscar segunda jugada <input id="vc1611-search-verify" type="search" placeholder="Código, dorsal o set" autocomplete="off"/></label>
   <label class="vc1611-field">Segunda jugada para verificar <select id="vc1611-verify"><option value="">Sin segunda jugada (omitir)</option></select></label>
   <button type="button" id="vc1611-capture-verify">Comparar con la posición actual del vídeo</button>
   <p id="vc1611-check-result" class="vc1611-result" role="status">Puedes guardar sin comprobación, aunque es recomendable verificar una segunda jugada.</p>
   <label id="vc1611-risk-container" class="vc1611-ack" hidden><input id="vc1611-risk" type="checkbox"/> El vídeo podría tener cortes o cambios de reloj; quiero guardar igualmente este desfase.</label>
   <button type="button" id="vc1611-save" class="vc1611-primary">Guardar sincronización del partido</button>
   <p class="vc1611-hint">El vídeo no se sube a la nube. El desfase se conserva con los datos del partido y puede cambiar si utilizas otra grabación.</p>
  </div>
  <p id="vc1611-message" class="vc1611-message" role="status" aria-live="polite"></p>
 </div>
 <footer class="vc1611-footer"><button type="button" id="vc1611-prev">Atrás</button><button type="button" id="vc1611-next" class="vc1611-primary">Siguiente</button></footer>`;
const syncPanel=videoPanel.querySelector('.v780-sync-panel');
if(syncPanel)syncPanel.parentNode.insertBefore(wizard,syncPanel);else videoPanel.appendChild(wizard);
const msg=(str,bad=false)=>{const e=$('vc1611-message');e.textContent=str||'';e.dataset.error=bad?'1':'0'};
function actualRows(){return rows().filter(timed).sort((a,b)=>Number(a.ms)-Number(b.ms))}
function rowFor(key){return state.cached.find(x=>String(x.key)===String(key))||null}
function populate(select,data,selected,placeholder){const keep=String(selected||'');select.replaceChildren(new Option(placeholder,''));data.forEach(r=>{const text=`${r.set?'Set '+r.set+' · ':''}${r.label} · ${fmt(Number(r.ms)/1000)} (scouting)`;select.add(new Option(text,String(r.key)))});if(data.some(r=>String(r.key)===keep))select.value=keep;else select.value=''}
function fill(){const match=activeMatchId();if(state.matchId!==match){state.matchId=match;state.anchorKey='';state.verificationKey='';state.anchorVideoTime=null;state.verificationTime=null;state.errorSec=null;state.step=1;state.query='';state.verifyQuery='';$('vc1611-search').value='';$('vc1611-search-verify').value=''}
 state.cached=actualRows();const q=state.query.toLocaleLowerCase();const opts=state.cached.filter(r=>!q||`${r.label} ${r.copy||''} ${r.player||''} ${r.set}`.toLocaleLowerCase().includes(q)).slice(0,150);
 populate($('vc1611-anchor'),opts,state.anchorKey,'Selecciona una acción');
 const vq=state.verifyQuery.toLocaleLowerCase();const verifies=state.cached.filter(r=>String(r.key)!==String(state.anchorKey)&&(!vq||`${r.label} ${r.copy||''} ${r.player||''} ${r.set}`.toLocaleLowerCase().includes(vq))).slice(0,150);
 populate($('vc1611-verify'),verifies,state.verificationKey,'Sin segunda jugada (omitir)');
 $('vc1611-count').textContent=`${state.cached.length} acciones/rallies con marca de scouting; mostrando ${opts.length}${state.cached.length>150?' (usa Buscar para acotar)':''}.`;
}
function offset(){const row=rowFor(state.anchorKey);return row&&state.anchorVideoTime!=null?state.anchorVideoTime-Number(row.ms)/1000:null}
function source(){const d=videoInfo();const sel=$('v780-match');const name=sel?.selectedOptions?.[0]?.textContent?.trim()||'Sin partido';const ready=!!d.videoLoaded&&String(d.match)===activeMatchId();const type=d.mediaType==='youtube'?'YouTube':'archivo/grabación';$('vc1611-source').textContent=`${name} · ${ready?type+' cargado':'sin vídeo listo'}`;return ready}
function current(){const d=videoInfo();return source()&&Number.isFinite(Number(d.currentTime))?Number(d.currentTime):null}
function render(){if(!state.open)return;const ready=source();
 for(const pg of wizard.querySelectorAll('[data-vc1611-page]'))pg.hidden=Number(pg.dataset.vc1611Page)!==state.step;
 for(const b of wizard.querySelectorAll('.vc1611-steps span'))b.classList.toggle('active',Number(b.dataset.step)===state.step);
 $('vc1611-prev').hidden=state.step===1;$('vc1611-next').hidden=state.step===3;
 const anchor=rowFor(state.anchorKey);$('vc1611-primary-label').textContent=anchor?.label||'—';$('vc1611-primary-scout').textContent=anchor?fmt(Number(anchor.ms)/1000):'—';$('vc1611-current-video').textContent=ready?fmt(videoInfo().currentTime):'Sin vídeo';
 $('vc1611-anchor-status').textContent=state.anchorVideoTime===null?'Pausa el vídeo en la jugada y marca ese instante.':`Instante capturado: ${fmt(state.anchorVideoTime)} · desfase ${offset()?.toFixed(2)} s`;
 $('vc1611-proposed').textContent=offset()==null?'—':`${offset()>=0?'+':''}${offset().toFixed(2)} segundos`;
 $('vc1611-eligible').textContent=String(state.cached.length);
 $('vc1611-capture-primary').disabled=!ready||!anchor;
 $('vc1611-capture-verify').disabled=!ready||!rowFor(state.verificationKey);
 $('vc1611-save').disabled=offset()===null||(state.errorSec!==null&&Math.abs(state.errorSec)>3&&!state.warningAcknowledged);
 $('vc1611-risk-container').hidden=!(state.errorSec!==null&&Math.abs(state.errorSec)>3);
}
function checkLabel(){const e=$('vc1611-check-result');if(!state.verificationKey){e.textContent='Sin segunda acción. Puedes guardar, pero conviene verificar otra jugada.';e.dataset.level='normal';return}
 if(state.verificationTime===null){e.textContent='Pausa el vídeo cuando aparezca esta segunda jugada y pulsa Comparar.';e.dataset.level='normal';return}
 const expected=Number(rowFor(state.verificationKey)?.ms)/1000+offset();const delta=state.verificationTime-expected;state.errorSec=delta;
 e.dataset.level=Math.abs(delta)<=1.5?'ok':Math.abs(delta)<=3?'warn':'danger';
 e.textContent=`Vídeo esperado: ${fmt(expected)} · marcado: ${fmt(state.verificationTime)} · diferencia ${delta>=0?'+':''}${delta.toFixed(2)} s. ${Math.abs(delta)<=1.5?'Coincidencia adecuada.':Math.abs(delta)<=3?'Revisa el momento: hay una pequeña diferencia.':'Diferencia importante: comprueba posibles cortes de la grabación o pausas del reloj.'}`;
}
function resetCheck(){state.verificationTime=null;state.errorSec=null;state.warningAcknowledged=false;$('vc1611-risk').checked=false;checkLabel()}
function open(){state.open=true;wizard.hidden=false;opener.setAttribute('aria-expanded','true');fill();render();wizard.scrollIntoView?.({block:'nearest',behavior:'smooth'})}
function close(){state.open=false;wizard.hidden=true;opener.setAttribute('aria-expanded','false');msg('')}
opener.addEventListener('click',()=>state.open?close():open());$('vc1611-close').addEventListener('click',close);
$('vc1611-search').addEventListener('input',e=>{state.query=e.target.value;fill();render()});
$('vc1611-search-verify').addEventListener('input',e=>{state.verifyQuery=e.target.value;fill();render()});
$('vc1611-anchor').addEventListener('change',e=>{state.anchorKey=e.target.value;state.anchorVideoTime=null;state.verificationKey='';resetCheck();window.v780Select?.(state.anchorKey);fill();render()});
$('vc1611-verify').addEventListener('change',e=>{state.verificationKey=e.target.value;resetCheck();render()});
$('vc1611-next').addEventListener('click',()=>{if(state.step===1){if(!state.anchorKey){msg('Selecciona una acción codificada.',true);return}if(!source()){msg('Carga primero el vídeo de este partido desde Reproductor.',true);return}}if(state.step===2&&state.anchorVideoTime===null){msg('Marca el instante del vídeo antes de continuar.',true);return}msg('');state.step=Math.min(3,state.step+1);render()});
$('vc1611-prev').addEventListener('click',()=>{state.step=Math.max(1,state.step-1);msg('');render()});
$('vc1611-to-player').addEventListener('click',()=>{window.vc58SetVideoTab?.('player');msg('Carga el vídeo y vuelve a Análisis de vídeo. La jugada seleccionada se mantiene.')});
$('vc1611-capture-primary').addEventListener('click',()=>{const t=current();if(t===null){msg('No hay vídeo disponible para marcar el instante.',true);return}state.anchorVideoTime=t;resetCheck();msg(`Marcado ${fmt(t)}. Puedes afinar la posición y marcar de nuevo.`);render()});
$('vc1611-capture-verify').addEventListener('click',()=>{const t=current();if(t===null){msg('No hay vídeo disponible para verificar.',true);return}state.verificationTime=t;state.warningAcknowledged=false;$('vc1611-risk').checked=false;checkLabel();render()});
$('vc1611-risk').addEventListener('change',e=>{state.warningAcknowledged=e.target.checked;render()});
$('vc1611-save').addEventListener('click',()=>{const off=offset();if(off===null){msg('Todavía no has marcado la jugada.',true);return}if(!source()){msg('El vídeo ya no está cargado. Vuelve a cargarlo antes de guardar.',true);return}
 if(state.errorSec!==null&&Math.abs(state.errorSec)>3&&!state.warningAcknowledged){msg('Confirma la diferencia entre las dos jugadas antes de guardar.',true);return}
 const result=window.v780SyncFromAnchor?.({key:state.anchorKey,videoTime:state.anchorVideoTime});
 if(!result?.ok){msg(result?.error||'No se pudo guardar el desfase.',true);return}
 msg(`Desfase aplicado al partido · ${off>=0?'+':''}${off.toFixed(2)} s. Comprueba el estado de guardado y nube antes de cerrar.`);state.step=3;render();
});
// Sync with match/source changes only while the wizard is open, with no background timers.
$('v780-match')?.addEventListener('change',()=>{if(state.open){fill();render()}});
window.VC_VIDEO_SYNC_ASSISTANT={version:'16.1.1',open,close,diagnostics:()=>({match:state.matchId,step:state.step,anchor:state.anchorKey,videoTime:state.anchorVideoTime,offset:offset(),verifyKey:state.verificationKey,errorSec:state.errorSec})};
})();

/* VC20714_SOURCE_END:118-vc1611-video-sync-assistant.js */

;
/* VC20714_SOURCE_BEGIN:119-vc1612-video-analytics.js */
/* Volley Coach V16.1.2 · Video Analytics Pro
   Read-only statistical selection from the canonical scouting match. The ONLY
   playback engine is V7.8; no camera, score, rally or cloud changes on browsing.
*/
(()=>{
'use strict';
if(window.VC_VIDEO_ANALYTICS_1612)return;
const $=id=>document.getElementById(id), arr=x=>Array.isArray(x)?x:[];
const report=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const videoBridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||null;
const clean=x=>String(x??'').trim(), norm=x=>clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const hasTime=(a,m)=>{
 for(const k of ['videoTimestamp','liveVideoTime','videoAction','videoTime']){
  if(a?.[k]!=null&&a[k]!==''&&Number.isFinite(Number(a[k]))&&Number(a[k])>=0)return true;
 }
 return m?.video?.syncOffset!=null&&m.video.syncOffset!==''&&Number.isFinite(Number(m.video.syncOffset))&&a?.scoutMs!=null&&a.scoutMs!==''&&Number.isFinite(Number(a.scoutMs));
};
const state={selected:[],matchId:'',filters:null,plays:0,loads:0,previewCount:0,openCount:0,signature:''};
const skillNames={S:'Saque',R:'Recepción',A:'Ataque',B:'Bloqueo',D:'Defensa',E:'Colocación',F:'Freeball',C:'Cobertura'};
const canUse=()=>!!$('scout-analysis')&&!!$('scout-video-hub')&&!!report()&&!!videoBridge();
function match(){
 const id=clean($('scout-analysis-match')?.value);
 const ms=arr(report()?.getMatches?.());
 return ms.find(m=>String(m.id)===id)||report()?.getMatchForAnalysis?.()||null;
}
function allActions(m){
 if(!m)return[];
 const items=[];
 for(const s of arr(m.sets))for(const r of arr(s.rallies))for(const a of arr(r.actions)){
  const player=clean(videoBridge()?.playerLabel?.(a)||a.playerNameSnapshot||a.playerLabel||a.playerNumberSnapshot||'Jugador');
  items.push({key:`a:${s.number}:${r.id}:${a.id}`,set:Number(s.number)||1,team:a.team==='opponent'?'opponent':'ours',
   rotation:Number(r.rotationBefore)||1,skill:clean(a.skill),evaluation:clean(a.evaluation),player,
   code:clean(a.code)||`${a.skill||''}${a.evaluation||''}`,scoutMs:Number(a.scoutMs)||0,hasVideo:hasTime(a,m),a,r});
 }
 return items;
}
function selectActions(items,f){return items.filter(a=>(!f.team||a.team===f.team)&&(!f.set||a.set===Number(f.set))&&
 (!f.rotation||a.rotation===Number(f.rotation))&&(!f.player||norm(a.player)===norm(f.player))&&
 (!f.skill||a.skill===f.skill)&&(!f.rating||(
  f.rating==='negative' ? ['-','!','='].includes(a.evaluation) :
  f.rating==='attackerror' ? ['=','/'].includes(a.evaluation) :
  f.rating==='positive' ? ['+','#'].includes(a.evaluation) : a.evaluation===f.rating)));
}
function option(sel,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;sel.append(o)}
function fillOptions(id,values,selected){const s=$(id);if(!s)return;
 const before=selected??s.value;s.replaceChildren();option(s,'','Todos');
 for(const [value,label] of values)option(s,value,label);
 s.value=[...s.options].some(o=>o.value===String(before))?String(before):'';
}
function filters(){return {team:$('vc1612-team')?.value||'',set:$('vc1612-set')?.value||'',player:$('vc1612-player')?.value||'',
 skill:$('vc1612-skill')?.value||'',rating:$('vc1612-rating')?.value||'',rotation:$('vc1612-rotation')?.value||''}}
function countText(value){return `${value} ${value===1?'jugada':'jugadas'}`}
function message(msg,error=false){for(const id of ['vc1612-status','vc1612-video-status']){const el=$(id);if(el){el.textContent=msg;el.dataset.error=error?'1':'0'}}}
function refreshSelects(force=false){const m=match();if(!m)return;
 const id=String(m.id),ms=allActions(m);
 if(force||state.matchId!==id){
  state.matchId=id;
  fillOptions('vc1612-set',arr(m.sets).map(s=>[String(s.number),`Set ${s.number}`]),'');
  fillOptions('vc1612-player',[...new Set(ms.map(a=>a.player).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')).map(s=>[s,s]),'');
  fillOptions('vc1612-rotation',Array.from({length:6},(_,i)=>[String(i+1),`R${i+1}`]),'');
  $('vc1612-team').value='ours';$('vc1612-skill').value='';$('vc1612-rating').value='';
 }
}
function preview(){const m=match();if(!m){$('vc1612-preview').textContent='Selecciona un partido para ver jugadas.';return []}
 refreshSelects();const sel=selectActions(allActions(m),filters());state.previewCount++;
 const linked=sel.filter(a=>a.hasVideo).length;
 $('vc1612-count').textContent=countText(sel.length);
 $('vc1612-linked').textContent=`${linked} con marca temporal · ${sel.length-linked} sin sincronizar`;
 const list=$('vc1612-preview');list.replaceChildren();
 if(!sel.length){list.textContent='Sin acciones para esta combinación de filtros.';return sel}
 for(const a of sel.slice(0,12)){
  const row=document.createElement('div');row.className='vc1612-action';
  const label=document.createElement('span');label.textContent=`Set ${a.set} · R${a.rotation} · ${a.player} · ${a.code}`;
  const badge=document.createElement('small');badge.textContent=a.hasVideo?'Vídeo disponible':'Sin marca';badge.className=a.hasVideo?'linked':'missing';
  row.append(label,badge);list.append(row);
 }
 if(sel.length>12){const more=document.createElement('p');more.className='vc1612-more';more.textContent=`Mostrando 12 de ${sel.length} jugadas. El resto estará disponible en Análisis de vídeo.`;list.append(more)}
 return sel;
}
function applyPreset(which){
 const presets={receiveBad:['R','negative'],attackWins:['A','#'],attackErrors:['A','attackerror'],serves:['S','#'],blocks:['B','#'],all:['','']};
 const pair=presets[which];if(!pair)return;
 $('vc1612-skill').value=pair[0];$('vc1612-rating').value=pair[1];preview();
}
function selectVideoMatch(id){
 const sel=$('v780-match');if(!sel)return false;
 if(![...sel.options].some(o=>o.value===String(id)))window.v780Open?.();
 if(![...sel.options].some(o=>o.value===String(id)))return false;
 if(String(sel.value)!==String(id)){sel.value=String(id);window.v780MatchChanged?.();}
 return true;
}
function drawTray(){
 const panel=$('vc1612-video-selection');if(!panel)return;
 const m=arr(videoBridge()?.getMatches?.()).find(x=>String(x.id)===state.matchId);
 $('vc1612-video-count').textContent=countText(state.selected.length);
 $('vc1612-video-context').textContent=m?`${m.opponent||'Rival'} · ${m.date||'sin fecha'} · jugadas filtradas desde Análisis Pro`:'Sin selección';
 const list=$('vc1612-video-list');list.replaceChildren();
 let available=0;
 for(const a of state.selected.slice(0,120)){
  const row=document.createElement('div');row.className='vc1612-clip-row';
  const span=document.createElement('span');span.textContent=`Set ${a.set} · ${a.player} · ${a.code}`;
  const btn=document.createElement('button');btn.type='button';btn.textContent=a.hasVideo?'▶ Ver':'Sin tiempo';btn.disabled=!a.hasVideo;
  if(a.hasVideo){available++;btn.addEventListener('click',()=>playOne(a.key))}
  row.append(span,btn);list.append(row);
 }
 if(state.selected.length>120){const note=document.createElement('p');note.className='vc1612-more';note.textContent=`Primeras 120 de ${state.selected.length} jugadas; la playlist incluye toda la selección.`;list.append(note)}
 $('vc1612-play-all').disabled=!state.selected.some(a=>a.hasVideo);
 $('vc1612-save-clips').disabled=!state.selected.some(a=>a.hasVideo);
 message(`${state.selected.length} jugadas del partido · ${state.selected.filter(a=>a.hasVideo).length} con referencias temporales. Carga el vídeo si todavía no está abierto.`);
 panel.hidden=false;
}
function openSelection(){
 const m=match(),picked=preview();if(!m||!picked.length){message('No hay jugadas para abrir.',true);return false}
 state.selected=picked;state.matchId=String(m.id);state.filters=filters();state.openCount++;
 try{window.v11Navigate?.('video')}catch(e){console.warn('Navegación vídeo',e)}
 // The video selector may be populated on navigation. Reuse the existing
 // player, and never call v780MatchChanged if the correct match is selected.
 if(!selectVideoMatch(m.id)){message('El partido no aparece todavía en Video Review.',true);return false}
 window.VC_VIDEO_WORKSPACE?.openAnalysis?.();
 window.v780SetKind?.('action');
 // Use only filters supported by V7.8; the custom selection retains the
 // evaluation filter without affecting the canonical Video Review timeline.
 for(const [id,val] of [['v780-set',state.filters.set],['v780-team',state.filters.team],['v780-skill',state.filters.skill],['v780-player',state.filters.player],['v781-rotation',state.filters.rotation]]){
  const s=$(id);if(!s)continue;
  const exists=[...s.options].some(o=>o.value===String(val||''));s.value=exists?String(val||''):'';
 }
 window.v780FiltersChanged?.();drawTray();
 $('vc1612-video-selection')?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 return true;
}
/* V16.1.4 · Open an exact read-only subset from tactical metrics.
   Keeps the shared player and only changes the temporary selection. */
function openKeys(matchId,keys){
 const m=arr(report()?.getMatches?.()).find(x=>String(x.id)===String(matchId));
 if(!m){message('No se encuentra el partido para la selección táctica.',true);return false}
 const wanted=new Set(arr(keys).map(String));
 const found=allActions(m).filter(a=>wanted.has(String(a.key)));
 if(!found.length){message('Las acciones no se encuentran en este partido.',true);return false}
 state.selected=found;state.matchId=String(m.id);state.filters={team:'',set:'',skill:'',rotation:'',player:'',rating:''};state.openCount++;
 try{window.v11Navigate?.('video')}catch(err){console.warn('Navigation to video',err)}
 if(!selectVideoMatch(m.id)){message('Abre este partido en Video Review para cargar las acciones.',true);return false}
 window.VC_VIDEO_WORKSPACE?.openAnalysis?.();window.v780SetKind?.('action');
 for(const id of ['v780-set','v780-team','v780-skill','v780-player','v781-rotation']){
  const el=$(id);if(el)el.value='';
 }
 window.v780FiltersChanged?.();drawTray();
 $('vc1612-video-selection')?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 return true;
}
function validSelection(){const id=clean($('v780-match')?.value);if(id!==state.matchId){message('Selecciona el partido correspondiente en Video Review.',true);return false}return true}
function playOne(key){
 if(!validSelection())return false;
 const api=window.VC_SMART_VIDEO_CORE;
 const ok=api?.playKey?.(key)??window.VC_VIDEO_REVIEW_API?.play?.(key);
 if(ok===false){message('Carga el vídeo o sincroniza este partido para reproducir la acción.',true);return false}
 state.plays++;return true;
}
function playlist(){if(!validSelection())return false;
 const keys=state.selected.filter(a=>a.hasVideo).map(a=>a.key);
 const ok=window.VC_V159_VIDEO_ENGINE?.playlist?.(keys,'Video Analytics Pro')||false;
 message(ok?`Reproduciendo una playlist de ${keys.length} jugadas.`:'Carga y sincroniza el vídeo de este partido antes de reproducir la playlist.',!ok);
 return ok;
}
function saveClips(){if(!validSelection())return 0;
 const keys=state.selected.filter(a=>a.hasVideo).map(a=>a.key);
 if(!keys.length){message('Las acciones seleccionadas no tienen tiempo de vídeo válido.',true);return 0}
 if(typeof window.VC_V159_VIDEO_ENGINE?.clips!=='function'){message('El catálogo de clips no está disponible.',true);return 0}
 const n=window.VC_V159_VIDEO_ENGINE.clips(keys);
 message(n?`${n} referencias de clip añadidas al catálogo del partido.`:'No se han creado nuevos clips (es posible que ya existan).');return n;
}
function mount(){if(!canUse())return false;const view=$('scout-analysis');if($('vc1612-analytics'))return true;
 const host=document.createElement('section');host.id='vc1612-analytics';host.setAttribute('aria-label','Video Analytics Pro');
 host.innerHTML=`<div class="vc1612-head"><div><span>VIDEO ANALYTICS PRO · V16.1.2</span><h3>De la estadística a la jugada</h3><p>Filtra las acciones codificadas y revisa los vídeos sin crear datos duplicados.</p></div><span id="vc1612-count" class="vc1612-total">0 jugadas</span></div>
 <div class="vc1612-presets"><button type="button" data-preset="receiveBad">Recepciones negativas</button><button type="button" data-preset="attackWins">Ataques punto</button><button type="button" data-preset="attackErrors">Errores de ataque</button><button type="button" data-preset="serves">Aces</button><button type="button" data-preset="blocks">Bloqueos punto</button><button type="button" data-preset="all">Todas</button></div>
 <div class="vc1612-filters"><label>Equipo<select id="vc1612-team"><option value="ours">Nuestro</option><option value="opponent">Rival</option><option value="">Ambos</option></select></label><label>Set<select id="vc1612-set"></select></label><label>Jugador<select id="vc1612-player"></select></label><label>Fundamento<select id="vc1612-skill"><option value="">Todos</option><option value="S">Saque</option><option value="R">Recepción</option><option value="A">Ataque</option><option value="B">Bloqueo</option><option value="D">Defensa</option><option value="E">Colocación</option></select></label><label>Valoración<select id="vc1612-rating"><option value="">Todas</option><option value="#">#</option><option value="+">+</option><option value="!">!</option><option value="-">−</option><option value="=">=</option><option value="/">/</option><option value="positive">Positivas (+/#)</option><option value="negative">Recepciones negativas (−/!/ =)</option><option value="attackerror">Ataque error/bloqueado (=/)</option></select></label><label>Rotación<select id="vc1612-rotation"></select></label></div>
 <div class="vc1612-result"><div><strong id="vc1612-linked">—</strong><p id="vc1612-status" role="status">Selecciona una estadística o ajusta los filtros.</p></div><button type="button" id="vc1612-open" class="vc1612-primary">▶ Ver jugadas en vídeo</button></div><div id="vc1612-preview" class="vc1612-preview"></div>`;
 const first=view.querySelector('#vc1643-pro')||view.querySelector('.scout-analysis-header');
 if(first)first.after(host);else view.prepend(host);
 const video=$('scout-video-hub');const tray=document.createElement('section');tray.id='vc1612-video-selection';tray.hidden=true;
 tray.innerHTML=`<div class="vc1612-head"><div><span>SELECCIÓN DESDE ANÁLISIS PRO</span><h3>Jugadas para revisar</h3><p id="vc1612-video-context">—</p></div><span id="vc1612-video-count" class="vc1612-total">—</span></div><div class="vc1612-video-actions"><button type="button" id="vc1612-play-all" class="vc1612-primary">▶ Reproducir selección</button><button type="button" id="vc1612-save-clips">＋ Guardar clips</button><button type="button" id="vc1612-back">Volver a Análisis</button></div><p id="vc1612-video-status" role="status"></p><div id="vc1612-video-list" class="vc1612-video-list"></div>`;
 const anchor=video.querySelector('#vc1610-smart-panel')||video.querySelector('.v780-timeline-panel');
 if(anchor)anchor.after(tray);else video.append(tray);
 host.addEventListener('change',()=>preview());
 host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.preset)applyPreset(b.dataset.preset);if(b.id==='vc1612-open')openSelection()});
 $('vc1612-play-all').addEventListener('click',playlist);
 $('vc1612-save-clips').addEventListener('click',saveClips);
 $('vc1612-back').addEventListener('click',()=>window.v11Navigate?.('analysis'));
 $('scout-analysis-match')?.addEventListener('change',()=>{state.matchId='';refreshSelects(true);preview()});
 // Offer a contextual route from the existing statistical tables. No HTML
 // replacement: the real statistical calculations and cells remain intact.
 const table=$('vc1643-content');if(table){
  const enhance=()=>{
   const rows=[...table.querySelectorAll('tbody tr')];for(const tr of rows){if(tr.querySelector('[data-vc1612-stat]'))continue;
    const cell=tr.cells?.[0],last=tr.cells?.[tr.cells.length-1];if(!cell||!last)continue;
    const first=clean(cell.innerText||cell.textContent);if(!first)continue;
    const btn=document.createElement('button');btn.type='button';btn.dataset.vc1612Stat='1';btn.className='vc1612-row-link';btn.textContent='▶ Vídeo';btn.title=`Ver jugadas de ${first}`;
    btn.addEventListener('click',e=>{e.stopPropagation();const m=match();if(!m)return;refreshSelects();
     const panel=$('vc1643-pro');const active=panel?.querySelector('[data-vc1643-tab][aria-pressed="true"]')?.dataset.vc1643Tab;
     const team=$('vc1643-team')?.value||'ours',set=$('vc1643-set')?.value||'all';
     $('vc1612-team').value=team;$('vc1612-set').value=set==='all'?'':set;
     $('vc1612-player').value='';$('vc1612-rotation').value='';$('vc1612-skill').value='';$('vc1612-rating').value='';
     if(active==='rotations')$('vc1612-rotation').value=String(first.match(/R([1-6])/i)?.[1]||'');
     else if(active==='sets')$('vc1612-set').value=String(first.match(/(\d+)/)?.[1]||'');
     else if(active==='players'){
      const choices=[...$('vc1612-player').options].filter(o=>o.value);
      let found=choices.find(o=>norm(o.value)===norm(first));
      if(!found){
       const dorsal=first.match(/(?:^|\s)#?(\d{1,2})(?=\s|\b|\s*[·-])/u)?.[1];
       if(dorsal){const candidates=choices.filter(o=>new RegExp('(^|\\D)#?'+dorsal+'(\\D|$)').test(o.value));if(candidates.length===1)found=candidates[0]}
      }
      if(!found){message('No he podido relacionar esa fila con una jugadora codificada. Selecciona el dorsal en los filtros.',true);return}
      $('vc1612-player').value=found.value;
     }
     preview();openSelection();
    });
    last.appendChild(btn);
   }
  };
  const observer=new MutationObserver(()=>{if(view.classList.contains('active'))enhance()});
  observer.observe(table,{childList:true,subtree:true});enhance();
 }
 const observe=new MutationObserver(()=>{if(view.classList.contains('active')){refreshSelects();if(state.matchId!==String(match()?.id||''))preview()}});
 observe.observe(view,{attributes:true,attributeFilter:['class']});
 // Do not calculate the entire match during Home startup. This panel is lazy.
 if(view.classList.contains('active')){refreshSelects(true);preview()}
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.VC_VIDEO_ANALYTICS_1612={version:'16.1.4-bridge',openKeys,collect:(m,f)=>selectActions(allActions(m),f),preview,openSelection,playOne,playlist,saveClips,selection:()=>({matchId:state.matchId,keys:state.selected.map(a=>String(a.key))}),diagnostics:()=>({matchId:state.matchId,selected:state.selected.length,plays:state.plays,openCount:state.openCount,previewCount:state.previewCount})};
})();

/* VC20714_SOURCE_END:119-vc1612-video-analytics.js */

;
/* VC20714_SOURCE_BEGIN:120-vc1613-zone-board.js */
/* Volley Coach V16.1.7 — Inline DataVolley zone keypad, below quick code.
   One board in the existing coding panel. Changes the draft code only;
   neither adds actions nor writes match data. No global subtree observers. */
(()=>{
'use strict';
if(window.VC_1613_ZONE_BOARD)return;
const $=id=>document.getElementById(id);
const ZONES=[4,3,2,7,8,9,5,6,1];
const state={zone:'',sub:'',mode:'destination',manualMode:false,lastSkill:'',lastInput:null,updates:0};

function codeInput(){
 const panel=$('v113-video-code-panel'),input=$('v113-video-code');
 if(input&&panel&&panel.getClientRects().length)return input;
 if(state.lastInput?.isConnected&&state.lastInput.getClientRects().length)return state.lastInput;
 return $('v800-code')||input||$('scout-code-input')||null;
}
function skillOf(code){return String(code||'').trim().toUpperCase().match(/^(?:R)?\d+([SRAEBDFC])/)?.[1]||''}
function labelForMode(){
 const skill=skillOf(codeInput()?.value);
 return state.mode==='origin'?'Origen':(['R','D'].includes(skill)?'Contacto':'Destino');
}
function token(){return state.zone?`${state.zone}${state.sub}`:''}
function label(){return state.zone?`Z${token()}`:'Sin zona'}
function setStatus(msg,kind=''){const el=$('vc1613-board-status');if(el){if(el.textContent!==msg)el.textContent=msg;el.dataset.kind=kind;}}

/* Do not edit any trailing Data Volley modifiers, such as tempo, serve type,
   set/attack code, phase, blockers or custom code. Location syntax is .O>D,
   or .D for a single destination/contact point. */
function replaceLocation(code,zone,mode='destination',previousMode=''){
 const raw=String(code||'').trim().toUpperCase().replace(/\s+/g,'');
 if(!raw||!zone)return raw;
 const idx=raw.search(/[~:%|*^@&?$]/);
 const head=idx<0?raw:raw.slice(0,idx),tail=idx<0?'':raw.slice(idx);
 const p=head.indexOf('.'),base=p<0?head:head.slice(0,p);
 const loc=p<0?'':head.slice(p+1);
 if(!base)return raw;
 let updated='';
 if(mode==='origin'){
   if(loc.includes('>'))updated=`${zone}>${loc.split('>').slice(1).join('>')}`;
   else if(loc&&previousMode==='destination')updated=`${zone}>${loc}`;
   else updated=zone;
 }else{
   if(loc.includes('>'))updated=`${loc.split('>')[0]}>${zone}`;
   else if(loc&&previousMode==='origin')updated=`${loc}>${zone}`;
   else updated=zone;
 }
 return `${base}.${updated}${tail}`;
}
function detectContext(){
 const input=codeInput();if(!input)return;
 const skill=skillOf(input.value);
 if(skill!==state.lastSkill){
  state.lastSkill=skill;
  if(!state.manualMode)state.mode=skill==='B'?'origin':'destination';
 }
 const heading=$('vc1613-mode-desc');
 if(heading)heading.textContent=`${labelForMode()} del balón · clic para completar el código`;
 const selected=$('vc1613-current-token');if(selected)selected.textContent=label();
 const modeLabels=$('vc1613-modes');
 if(modeLabels){
  for(const button of modeLabels.querySelectorAll('[data-location-mode]')){
    const selectedMode=button.dataset.locationMode===state.mode;
    button.classList.toggle('selected',selectedMode);button.setAttribute('aria-pressed',String(selectedMode));
    if(button.dataset.locationMode==='destination')button.textContent=['R','D'].includes(skill)?'Contacto':'Destino';
  }
 }
}
function applyZone(zone,sub=''){
 const input=codeInput(),previousMode=state.lastMode;
 state.zone=String(zone);state.sub=String(sub);
 document.querySelectorAll('#vc1613-board [data-zone]').forEach(btn=>{
  const on=btn.dataset.zone===state.zone&&(btn.dataset.sub||'')===state.sub;
  btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));
 });
 detectContext();
 if(!input || !input.value.trim()){
  setStatus(`${label()} elegida. Escribe primero el dorsal, fundamento y valoración.`, 'hint');
  return false;
 }
 const before=input.value,after=replaceLocation(before,token(),state.mode,previousMode);
 if(before!==after){
  input.value=after;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  state.updates++;
 }
 state.lastMode=state.mode;
 window.dispatchEvent(new CustomEvent('vc1752:zone-applied',{detail:{zone:state.zone,sub:state.sub,token:token(),mode:state.mode,before,after}}));
 state.lastInput=input;
 detectContext();
 setStatus(`${label()} aplicada · ${after} · pulsa Enter o Añadir cuando esté listo.`, 'ok');
 try{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}catch(_){}
 return true;
}
function reset(){
 state.zone='';state.sub='';state.lastMode='';
 document.querySelectorAll('#vc1613-board [data-zone].selected').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});
 detectContext();setStatus('Sin zona seleccionada. El código existente no se ha borrado.');
}
function boardMarkup(){
 return `<section id="vc1613-board" class="vc1613-inline-board" aria-label="Teclado de zonas DataVolley">
 <header class="vc1613-header"><div><strong>PISTA INTERACTIVA · 9×4</strong><small id="vc1613-mode-desc">Destino del balón · clic para completar el código</small></div><span id="vc1613-current-token">Sin zona</span></header>
 <div id="vc1613-modes" class="vc1613-modes" role="group" aria-label="Tipo de localización"><button type="button" data-location-mode="destination" aria-pressed="true">Destino</button><button type="button" data-location-mode="origin" aria-pressed="false">Origen</button><button type="button" id="vc1613-clear-selection">Limpiar selección</button></div>
 <div class="vc1613-orientation" aria-label="Orientación de subzonas">RED ARRIBA · C-B / D-A · FONDO ABAJO</div>
 <div class="vc1613-court-grid" aria-label="Zonas y subzonas de la pista">${ZONES.map(z=>`<div class="vc1613-cell"><button type="button" class="vc1613-zone" data-zone="${z}" data-sub="" aria-pressed="false" aria-label="Zona ${z}">Z${z}</button><div class="vc1613-quads">${['C','B','D','A'].map(sub=>`<button type="button" data-zone="${z}" data-sub="${sub}" aria-pressed="false" aria-label="Zona ${z}, subzona ${sub}: ${({C:"arriba izquierda",B:"arriba derecha",D:"abajo izquierda",A:"abajo derecha"})[sub]}">${sub}</button>`).join('')}</div></div>`).join('')}</div>
 <p class="vc1613-status" id="vc1613-board-status" role="status">Escribe el código y pulsa una zona. No guarda hasta pulsar Añadir.</p>
 </section>`;
}
function injectStyle(){
 if($('vc1613-zone-board-style'))return;
 const s=document.createElement('style');s.id='vc1613-zone-board-style';s.textContent=`
/* Scoped to the existing right-side coding panel. The video grid is untouched. */
#scout-match-mode #vc54-code-keypad{display:none!important}
#scout-match-mode #vc1613-board{display:block!important;position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;box-shadow:none!important;background:#f6faff!important;border:1px solid #ccdae9!important;border-radius:11px!important;padding:9px!important;margin:10px 0!important;box-sizing:border-box!important;color:#233e5d!important;flex:none!important;order:0!important}
#scout-match-mode #vc1613-board *{box-sizing:border-box!important}
#scout-match-mode .vc1613-header{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:7px}
#scout-match-mode .vc1613-header strong{display:block;color:#174776;font:850 10px/1.2 system-ui,sans-serif!important;letter-spacing:.06em}
#scout-match-mode .vc1613-header small{display:block;color:#6a8199;font:600 9px/1.25 system-ui,sans-serif!important;margin-top:3px}
#scout-match-mode #vc1613-current-token{font:850 11px system-ui,sans-serif!important;white-space:nowrap;background:#dbeaf8!important;color:#154877!important;border-radius:99px;padding:5px 8px}
#scout-match-mode .vc1613-modes{display:grid;grid-template-columns:1fr 1fr auto;gap:4px;margin-bottom:7px}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-modes button{background:#fff!important;color:#45677f!important;border:1px solid #cbdbea!important;font:750 10px/1.1 system-ui,sans-serif!important;border-radius:6px!important;min-height:29px!important;min-width:0!important;padding:5px 7px!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-modes button.selected{background:#185b9b!important;color:white!important;border-color:#185b9b!important}
#scout-match-mode .vc1613-orientation{font:800 9px/1.3 system-ui,sans-serif;color:#577a99;text-align:center;letter-spacing:.05em;margin:0 0 6px}
#scout-match-mode .vc1613-court-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;min-width:0!important}
#scout-match-mode .vc1613-cell{background:#fff!important;display:grid!important;gap:3px!important;padding:3px!important;border:1px solid #ccdae8!important;border-radius:7px!important;min-width:0!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-zone{min-height:22px!important;padding:2px!important;font:850 11px/1 system-ui,sans-serif!important;border:0!important;background:#eaf2fb!important;color:#2a577f!important;border-radius:4px!important}
#scout-match-mode .vc1613-quads{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:2px!important}
body.v11-shell #scout-match-mode #vc1613-board .vc1613-quads button{min-width:0!important;min-height:25px!important;padding:3px 1px!important;border:1px solid #dfebf5!important;background:#fff!important;color:#547089!important;border-radius:4px!important;font:800 10px/1.1 system-ui,sans-serif!important}
body.v11-shell #scout-match-mode #vc1613-board button.selected:not([data-location-mode]){background:#226bb0!important;color:white!important;border-color:#226bb0!important}
body.v11-shell #scout-match-mode #vc1613-board button:focus-visible{outline:3px solid #92bfe9!important;outline-offset:1px!important}
#scout-match-mode #vc1613-board .vc1613-status{min-height:16px;margin:6px 0 0!important;color:#647e97;font:650 9px/1.4 system-ui,sans-serif!important;overflow-wrap:anywhere}
#scout-match-mode #vc1613-board .vc1613-status[data-kind="ok"]{color:#257144!important}
#scout-match-mode #vc1613-board .vc1613-status[data-kind="hint"]{color:#966c28!important}
@media(max-width:680px){#scout-match-mode #vc1613-board{padding:7px!important}body.v11-shell #scout-match-mode #vc1613-board .vc1613-quads button{min-height:30px!important}}
`;
 document.head.appendChild(s);
}
function mount(){
 const panel=$('v113-video-code-panel');if(!panel)return false;
 injectStyle();
 const keypad=$('vc54-code-keypad'),entry=panel.querySelector('.v113-video-code-entry');
 let board=$('vc1613-board');
 if(!board){
   const d=document.createElement('div');d.innerHTML=boardMarkup();board=d.firstElementChild;
 }
 // Put the interactive court directly under the quick-code input/status,
 // before the Pro keyboard and recent actions. Reuse the same board node
 // so zone selection and registered listeners are preserved.
 if(entry){
  const keyboard=entry.querySelector('#vc1645-video');
  const status=entry.querySelector('#v113-video-code-status');
  if(keyboard){
   if(board.parentElement!==entry||board.nextElementSibling!==keyboard)entry.insertBefore(board,keyboard);
  }else if(status){
   if(board.previousElementSibling!==status)status.insertAdjacentElement('afterend',board);
  }else if(board.parentElement!==entry){
   entry.appendChild(board);
  }
 }else if(keypad&&keypad.parentElement===panel){
  if(board.previousElementSibling!==keypad)keypad.insertAdjacentElement('afterend',board);
 }
 if(board.dataset.bound!=='1'){
  board.dataset.bound='1';
  board.addEventListener('click',e=>{
   const z=e.target.closest('[data-zone]');
   if(z){applyZone(z.dataset.zone,z.dataset.sub||'');return;}
   const mode=e.target.closest('[data-location-mode]');
   if(mode){state.mode=mode.dataset.locationMode;state.manualMode=true;detectContext();window.dispatchEvent(new CustomEvent('vc1752:zone-mode-manual',{detail:{mode:state.mode}}));return;}
   if(e.target.closest('#vc1613-clear-selection'))reset();
  });
 }
 for(const id of ['v113-video-code','v800-code','scout-code-input']){
  const input=$(id);if(!input||input.dataset.vc16157Bound)continue;
  input.dataset.vc16157Bound='1';
  input.addEventListener('focus',()=>{state.lastInput=input;detectContext()});
  input.addEventListener('input',()=>{state.lastInput=input;detectContext()});
 }
 detectContext();
 return true;
}
// The original keypad is mounted by the existing match workspace on demand.
// Observe only direct additions in its coding panel, not the full app, to avoid
// reintroducing the MutationObserver startup loop fixed in V16.1.5.4.
function attach(){
 const panel=$('v113-video-code-panel');if(!panel)return;
 mount();
 const observer=new MutationObserver(records=>{
  if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.id==='vc54-code-keypad')))mount();
 });
 observer.observe(panel,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
window.VC_1613_ZONE_BOARD={version:'17.5.3',ensureUI:mount,toggle:()=>true,applySelection:()=>state.zone?applyZone(state.zone,state.sub):false,applyToken:(zone,sub='')=>/^[1-9]$/.test(String(zone))&&/^[ABCD]?$/.test(String(sub).toUpperCase())?applyZone(zone,String(sub).toUpperCase()):false,setMode:(mode)=>{if(!['origin','destination'].includes(mode))return false;state.mode=mode;state.manualMode=true;detectContext();return true},restoreModeContext:(previous,current)=>{if(!['origin','destination'].includes(previous)||!['origin','destination'].includes(current))return false;state.lastMode=previous;state.mode=current;state.manualMode=true;detectContext();return true},clearSelection:reset,replaceLocation,diagnostics:()=>({mounted:!!$('vc1613-board'),inline:!!$('vc1613-board')?.closest('#v113-video-code-panel'),code:codeInput()?.value||'',zone:token(),mode:state.mode,updates:state.updates})};
})();

/* VC20714_SOURCE_END:120-vc1613-zone-board.js */

;
/* VC20714_SOURCE_BEGIN:130-vc1640-scouting-pro-cockpit.js */
/* Volley Coach V16.4.0 · Scouting Pro Cockpit
   UI coordination only: no alternative point, action, storage or sync engine.
   Uses existing V8/V9/V11 video + the V16.1.7 9×4 zone board.
   In particular, never creates new scoring or action-recording handlers. */
(()=>{
 'use strict';
 if(window.VC_SCOUT_COCKPIT_1640)return;
 const $=id=>document.getElementById(id);
 const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const POS_FRONT=['p4','p3','p2'],POS_BACK=['p5','p6','p1'];
 const POS_RIVAL_FRONT=['p2','p3','p4'],POS_RIVAL_BACK=['p1','p6','p5'];
 const modes=new Set(['video','directo','revisar','analizar','visual']);
 const $match=()=>{
  const bridge=window.VC_SCOUT_VIDEO_BRIDGE;
  const active=bridge?.getActive?.();if(active)return active;
  const selected=$('v800-match-select')?.value;
  return selected?(bridge?.getMatches?.()||[]).find(m=>String(m?.id)===String(selected))||null:null;
 };
 const activeView=()=>!!$('scout-match-mode')?.classList.contains('active');
 let mounted=false,activated=false,pending=false,lastSignature='',rendered=0,switches=0,lastError='';
 let rosterCache=[];
 let refreshObservers=[];
 function rememberPreference(mode){try{localStorage.setItem('vc1640_preferred_mode',mode)}catch(_){}}
 function preferred(){try{const value=localStorage.getItem('vc1640_preferred_mode');if(modes.has(value))return value}catch(_){}return 'video'}
 function invoke(name){const fn=window[name];if(typeof fn!=='function'){lastError=`No disponible: ${name}`;announce(lastError);return false}try{fn();return true}catch(err){lastError=String(err?.message||err);console.warn('[VC1640] Control no disponible',name,err);announce('No se ha podido completar esta acción');return false}}
 function announce(s){const el=$('vc1640-feedback');if(el)el.textContent=s}
 function currentMode(){return $('v800-shell')?.dataset.vc52Mode||'visual'}
 function selectMode(mode,userInitiated=false){
  if(!modes.has(mode))return false;
  if(typeof window.vc52SetMode!=='function'){announce('El modo partido todavía no está preparado');return false}
  try{window.vc52SetMode(mode);switches++;if(userInitiated)rememberPreference(mode);refresh();return true}
  catch(err){lastError=String(err?.message||err);announce('No se ha podido cambiar la vista');return false}
 }
 function isFinished(){return $match()?.status==='finished'}
 function playerLabel(raw,ours=true){
  if(!ours)return String(raw||'—');
  const id=Number(raw);if(!Number.isFinite(id)||id<=0)return '—';
  const p=rosterCache.find(x=>Number(x?.id)===id);
  if(!p)return `ID ${id}`;
  const number=p.number??p.dorsal??'';
  return number!==''?`#${number}`:(p.name?String(p.name).slice(0,11):`ID ${id}`);
 }
 function miniCourt(lineup,ours,positions){
  const rows=[positions[0],positions[1]];
  const htmlCells=rows.flatMap((row,i)=>row.map(pos=>{
   const who=playerLabel(lineup?.[pos],ours);
   return `<div class="vc1640-slot" title="${escapeHtml(`${pos.toUpperCase()}: ${who}`)}"><small>${escapeHtml(pos.toUpperCase())}</small><b>${escapeHtml(who)}</b></div>`;
  })).join('');
  return `<div class="vc1640-mini-court" aria-label="Alineación de ${ours?'nuestro equipo':'equipo rival'}">${htmlCells}</div>`;
 }
 function build(){
  const live=$('v800-live'),nav=$('vc52-modes'),code=$('v113-video-code-panel');
  if(!live||!nav||!code)return false;
  if(!$('vc1640-commandbar')){
   const host=document.createElement('section');host.id='vc1640-commandbar';host.setAttribute('aria-label','Centro de control Scouting Pro 3.0');
   host.innerHTML=`<div class="vc1640-heading"><strong>SCOUTING PRO 3.0</strong><span>Una sola sesión de partido · vídeo, código, zonas y rotaciones</span><small>V16.4.0</small></div><div class="vc1640-commandrow"><div class="vc1640-tabs" role="group" aria-label="Vistas de trabajo">
      <button type="button" data-vc1640-mode="video">▶ Partido Pro</button>
      <button type="button" data-vc1640-mode="directo">⌨ Sin vídeo</button>
      <button type="button" data-vc1640-mode="revisar">≡ Revisar rallies</button>
      <button type="button" data-vc1640-mode="analizar">▥ Lectura</button>
     </div><div class="vc1640-quicktools" role="group" aria-label="Herramientas de partido">
      <button type="button" data-vc1640-tool="code">Ir al código</button>
      <button type="button" data-vc1640-tool="lineup">Alineación</button>
      <button type="button" data-vc1640-tool="changes">Cambios</button>
      <button type="button" data-vc1640-tool="finish">Finalizar set</button>
      <details id="vc1640-extra"><summary>Más opciones</summary><div class="vc1640-extra-actions">
       <button type="button" data-vc1640-tool="newset">Nuevo set</button>
       <button type="button" data-vc1640-tool="note">Nota vídeo</button>
       <button type="button" data-vc1640-tool="save">Guardar ahora</button>
       <button type="button" data-vc1640-tool="undo">Deshacer punto</button>
       <button type="button" data-vc1640-tool="restore">Actualizar panel</button>
      </div><div id="vc1640-legacy-slot"><span>Modos adicionales</span></div></details>
     </div></div>
     <div class="vc1640-context"><span id="vc1640-phase">Partido preparado</span><span id="vc1640-rotation">Rotaciones: —</span><span id="vc1640-serving">Saque: —</span><span id="vc1640-rail-rally">Rally: —</span><span id="vc1640-libero">Líbero: —</span><span id="vc1640-safe">Guardado: —</span><span id="vc1640-feedback" role="status" aria-live="polite">Usa los controles originales de registro y puntuación.</span></div>`;
   nav.parentNode?.insertBefore(host,nav);
   $('vc1640-legacy-slot')?.appendChild(nav);
   host.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||!host.contains(b))return;
    if(b.dataset.vc1640Mode){selectMode(b.dataset.vc1640Mode,true);return}
    if(b.dataset.vc52Mode&&modes.has(b.dataset.vc52Mode))rememberPreference(b.dataset.vc52Mode);
    const tool=b.dataset.vc1640Tool;
    if(!tool)return;
    if(tool==='code'){
      const isVideo=currentMode()==='video';const input=$(isVideo?'v113-video-code':'v800-code')||$('v113-video-code');
      if(input?.getClientRects()?.length){input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'auto'})}
      else{selectMode('video',true);requestAnimationFrame(()=>$('v113-video-code')?.focus({preventScroll:true}))}
      return;
    }
    if(tool==='restore'){refresh(true);announce('Contexto actualizado.');return}
    const calls={lineup:'scoutOpenLineup',changes:'v120OpenChanges',finish:'v120OpenFinishSet',newset:'v121OpenNewSet',note:'v851OpenVideoNote',save:'v117ProSave',undo:'v121UndoRally'};
    if(isFinished()&&['changes','finish','newset','undo'].includes(tool)){announce('Partido finalizado · solo lectura.');return}
    if(calls[tool])invoke(calls[tool]);
   });
  }
  if(!$('vc1640-lineups')){
   const details=document.createElement('details');details.id='vc1640-lineups';
   details.innerHTML='<summary><b>Rotaciones y alineación</b><span id="vc1640-lineup-summary">Nuestro R— · Rival R—</span></summary><div class="vc1640-lineups-grid"><div><strong>NUESTRO EQUIPO</strong><div id="vc1640-own-court"></div></div><div><strong>RIVAL</strong><div id="vc1640-rival-court"></div></div></div><p>Vista de posiciones registradas. Para cambiarlas, utiliza «Alineación»; esta pista no modifica el scouting.</p>';
   const entry=code.querySelector('.v113-video-code-entry');
   if(entry)entry.insertAdjacentElement('afterend',details);else code.insertBefore(details,code.firstChild);
  }
  mounted=true;return true;
 }
 function refresh(force=false){
  if(!mounted)return false;
  const m=$match(),mode=currentMode(),status=$('vc1640-feedback');
  document.querySelectorAll('#vc1640-commandbar [data-vc1640-mode]').forEach(b=>{
   const current=mode===b.dataset.vc1640Mode;b.classList.toggle('active',current);b.setAttribute('aria-pressed',String(current));
  });
  const disabled=!m||m.status==='finished';
  for(const btn of document.querySelectorAll('#vc1640-commandbar [data-vc1640-tool]')){
   btn.disabled=disabled&&['changes','finish','newset','undo'].includes(btn.dataset.vc1640Tool);
  }
  const set=m?.sets?.find(s=>Number(s.number)===Number(m.currentSet))||null;
  const libero=m?.libero||{};
  try{rosterCache=window.VC_SCOUT_VIDEO_BRIDGE?.getPlayers?.()||[]}catch(_){rosterCache=[]}
  const liberoLabel=libero.enabled?`Líbero ${playerLabel(libero.activePlayerId||libero.playerId)}`:'Sin líbero activo';
  const teamLabel=m?.servingTeam==='opponent'?'Rival':'Nuestro';
  const rallyIndex=(set?.rallies?.length||0)+1;
  const videoState=String($('v802-sync-badge')?.textContent||'').trim();
  const saveState=String($('v117-pro-save-state')?.textContent||'').trim();
  const sig=JSON.stringify([m?.id,m?.updatedAt,m?.status,m?.currentSet,m?.rotationNo,m?.opponentRotationNo,m?.servingTeam,m?.lineup,m?.libero?.activePlayerId,m?.libero?.pendingReason,set?.rallies?.length,m?.liveRally?.actions?.length,saveState,videoState]);
  if(sig!==lastSignature||force){
   lastSignature=sig;rendered++;
   const values={
    'vc1640-phase':!m?'Sin partido':m.status==='finished'?'Partido finalizado':`Set ${m.currentSet||1} · En juego`,
    'vc1640-rotation':m?`Rotación: R${m.rotationNo||1} / Rival R${m.opponentRotationNo||1}`:'Rotación: —',
    'vc1640-serving':m?`Saque: ${teamLabel}`:'Saque: —',
    'vc1640-rail-rally':m?`Rally ${rallyIndex} · ${(m.liveRally?.actions||[]).length} acciones`:'Rally: —',
    'vc1640-libero':m?liberoLabel:'Líbero: —',
    'vc1640-safe':`Guardado: ${saveState||'estado no disponible'}`,
    'vc1640-lineup-summary':m?`Nuestro R${m.rotationNo||1} · Rival R${m.opponentRotationNo||1}`:'Sin partido'
   };
   Object.entries(values).forEach(([key,value])=>{const el=$(key);if(el&&el.textContent!==value)el.textContent=value});
   const own=$('vc1640-own-court'),rival=$('vc1640-rival-court');
   const ownMarkup=miniCourt(m?.lineup?.ours,true,[POS_FRONT,POS_BACK]);
   const oppMarkup=miniCourt(m?.lineup?.opponent,false,[POS_RIVAL_FRONT,POS_RIVAL_BACK]);
   if(own&&own.innerHTML!==ownMarkup)own.innerHTML=ownMarkup;
   if(rival&&rival.innerHTML!==oppMarkup)rival.innerHTML=oppMarkup;
  }
  if(status&&isFinished())status.textContent='Partido finalizado: los controles de edición de este panel están bloqueados.';
  return true;
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;ensurePreferred()})}
 function ensurePreferred(){
  if(!activeView()){activated=false;return}
  const m=$match();if(!m){activated=false;refresh();return}
  if(!activated&&m.status!=='finished'){activated=true;const p=preferred();if(p!==currentMode())selectMode(p);}
  refresh();
 }
 function observe(node,opts){if(!node)return;const obs=new MutationObserver(schedule);obs.observe(node,opts);refreshObservers.push(obs)}
 function boot(){
  if(!build())return;
  observe($('v800-score-us'),{childList:true,characterData:true,subtree:true});
  observe($('v800-score-op'),{childList:true,characterData:true,subtree:true});
  observe($('v800-title'),{childList:true,characterData:true,subtree:true});
  observe($('v800-rotation-title'),{childList:true,characterData:true,subtree:true});
  observe($('v113-video-rally-actions'),{childList:true,subtree:true});
  observe($('v117-pro-save-state'),{childList:true,characterData:true,subtree:true});
  observe($('v800-shell'),{attributes:true,attributeFilter:['data-vc52-mode']});
  $('v800-match-select')?.addEventListener('change',schedule);
  if($('scout-match-mode')){
   const obs=new MutationObserver(ensurePreferred);obs.observe($('scout-match-mode'),{attributes:true,attributeFilter:['class']});refreshObservers.push(obs);
  }
  const store=window.MatchState;
  try{if(typeof store?.subscribe==='function')store.subscribe(schedule)}catch(err){console.warn('VC1640: state subscription unavailable',err)}
  ensurePreferred();
 }
 const STYLE=`
 body.v11-shell #scout-match-mode #vc1640-commandbar{position:relative;margin:11px 0 9px;padding:12px 14px;background:#fff;border:1px solid #dbe6ee;border-radius:14px;box-shadow:0 5px 17px #102a4810;color:#17344f;font:600 12px/1.4 system-ui,sans-serif}
 body.v11-shell #scout-match-mode #vc1640-commandbar *{box-sizing:border-box}
 #scout-match-mode #vc1640-commandbar .vc1640-heading{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px;color:#2b6389}#scout-match-mode #vc1640-commandbar .vc1640-heading strong{font-size:11px;font-weight:900;letter-spacing:.09em;color:#124876}#scout-match-mode #vc1640-commandbar .vc1640-heading span{font-size:10px;color:#6d879d}#scout-match-mode #vc1640-commandbar .vc1640-heading small{margin-left:auto;font-size:10px;font-weight:900;color:#497797}
 #scout-match-mode #vc1640-commandbar .vc1640-commandrow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
 #scout-match-mode #vc1640-commandbar .vc1640-tabs{display:flex;gap:6px;flex-wrap:wrap;flex:1 1 460px}
 body.v11-shell #scout-match-mode #vc1640-commandbar button{min-height:36px!important;padding:8px 11px!important;border-radius:8px!important;border:1px solid #cad9e6!important;background:#f7faff!important;color:#254c69!important;font:750 11px/1.2 system-ui,sans-serif!important;white-space:nowrap!important;box-shadow:none!important}
 body.v11-shell #scout-match-mode #vc1640-commandbar button.active{background:#145a91!important;color:#fff!important;border-color:#145a91!important}
 body.v11-shell #scout-match-mode #vc1640-commandbar button:disabled{opacity:.45!important;cursor:not-allowed}
 #scout-match-mode #vc1640-commandbar .vc1640-quicktools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
 body.v11-shell #scout-match-mode #vc1640-commandbar [data-vc1640-tool="code"]{background:#e8f4fb!important;border-color:#adcee5!important;color:#185b86!important}
 #scout-match-mode #vc1640-commandbar .vc1640-context{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid #e5edf3;color:#426481;font-size:10px;font-weight:750}
 #scout-match-mode #vc1640-commandbar .vc1640-context span{border-radius:7px;border:1px solid #e0e9f1;padding:5px 8px;background:#f6f9fc}
 #scout-match-mode #vc1640-commandbar #vc1640-feedback{flex:1 1 240px;color:#6b8395;background:transparent;border-style:dashed}
 #scout-match-mode #vc1640-commandbar #vc1640-extra{position:relative;z-index:32}
 #scout-match-mode #vc1640-commandbar #vc1640-extra>summary{cursor:pointer;list-style:none;min-height:36px;padding:9px 12px;border-radius:8px;background:#f3f8fc;border:1px solid #d5e3ee;color:#335c7a;font-weight:750;font-size:11px}
 #scout-match-mode #vc1640-commandbar #vc1640-extra>summary::-webkit-details-marker{display:none}
 #scout-match-mode #vc1640-commandbar #vc1640-extra[open]{flex:0 0 100%}
 #scout-match-mode #vc1640-commandbar .vc1640-extra-actions{display:flex;flex-wrap:wrap;gap:6px;margin:11px 0}
 #scout-match-mode #vc1640-commandbar #vc1640-legacy-slot>span{display:block;margin:4px 0;font-size:10px;color:#71879a}
 body.v11-shell #scout-match-mode #vc1640-commandbar #vc52-modes{display:flex!important;gap:5px;position:static!important;background:#f4f8fb!important;border:1px solid #e2eaf2!important;border-radius:8px!important;padding:7px!important;margin:0!important;overflow-x:auto;max-width:100%}
 body.v11-shell #scout-match-mode #vc1640-commandbar #vc52-modes button{min-width:110px!important;flex:1!important}
 body.v11-shell #scout-match-mode #v113-video-score{display:none!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater){grid-template-columns:minmax(0,1.58fr) minmax(318px,.82fr)!important;gap:14px!important;align-items:start!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>.v112-video-card{min-width:0!important;grid-column:1!important}
 body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>#v113-video-code-panel{grid-column:2!important;position:relative!important;top:auto!important;max-height:none!important;overflow:visible!important}
 body.v11-shell #scout-match-mode #v113-video-code-panel #vc1640-lineups{margin:10px 0;border:1px solid #cdddea;border-radius:10px;background:#f6faff;padding:10px;color:#294961;min-width:0}
 #scout-match-mode #vc1640-lineups summary{cursor:pointer;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:11px;list-style:none}
 #scout-match-mode #vc1640-lineups summary::-webkit-details-marker{display:none}
 #scout-match-mode #vc1640-lineups summary span{color:#557993;font-size:10px;font-weight:750}
 #scout-match-mode #vc1640-lineups .vc1640-lineups-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:11px}
 #scout-match-mode #vc1640-lineups .vc1640-lineups-grid>div>strong{display:block;text-align:center;color:#29567a;font-size:9px;letter-spacing:.05em;margin-bottom:5px}
 #scout-match-mode #vc1640-lineups .vc1640-mini-court{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;border:2px solid #a7bfcd;border-radius:6px;padding:5px;background:linear-gradient(90deg,#d8e8f6 0%,#f5fafc 100%)}
 #scout-match-mode #vc1640-lineups .vc1640-slot{min-width:0;background:#fff;border:1px solid #cadde9;border-radius:5px;min-height:37px;padding:4px 1px;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:2px}
 #scout-match-mode #vc1640-lineups .vc1640-slot small{font-size:8px;color:#698ba5}
 #scout-match-mode #vc1640-lineups .vc1640-slot b{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#193c5e}
 #scout-match-mode #vc1640-lineups p{font-size:9px;color:#6b859c;line-height:1.4;margin:8px 0 0}
 @media(max-width:1100px){body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater){grid-template-columns:minmax(0,1fr)!important}body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>.v112-video-card,body.v11-shell #scout-match-mode #v800-shell.v112-video-open #v112-video-drawer:not(.vc1644-theater)>#v113-video-code-panel{grid-column:1!important;grid-row:auto!important;position:static!important}body.v11-shell #scout-match-mode #vc1640-commandbar{padding:10px}}
 @media(max-width:650px){#scout-match-mode #vc1640-commandbar .vc1640-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));flex-basis:100%}#scout-match-mode #vc1640-commandbar .vc1640-quicktools{flex:1 1 100%}#scout-match-mode #vc1640-lineups .vc1640-lineups-grid{grid-template-columns:1fr}}
 @media(prefers-reduced-motion:reduce){#scout-match-mode #vc1640-commandbar button{transition:none!important}}
 `;
 function installStyle(){if($('vc1640-style'))return;const el=document.createElement('style');el.id='vc1640-style';el.textContent=STYLE;document.head.appendChild(el)}
 function start(){installStyle();boot()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.VC_SCOUT_COCKPIT_1640={version:'16.4.0',mount:()=>{installStyle();return build()},refresh:()=>refresh(true),mode:selectMode,diagnostics:()=>({mounted,mode:currentMode(),active:activeView(),matchId:$match()?.id||null,scoreEngineUnchanged:true,codeEngineUnchanged:true,updates:rendered,switches,observers:refreshObservers.length,lastError,zoneBoard:!!$('vc1613-board'),deviceCount:($('vc52-peer-count')?.textContent||'').trim()})};
})();

/* VC20714_SOURCE_END:130-vc1640-scouting-pro-cockpit.js */

;
/* VC20714_SOURCE_BEGIN:131-vc1641-code-assistant.js */
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

/* VC20714_SOURCE_END:131-vc1641-code-assistant.js */

;
/* VC20714_SOURCE_BEGIN:121-vc16131-clip-studio-pro.js */
/* Volley Coach V16.1.3.1 · Clip Studio Pro
   Persistent per-match tactical playlists, based on existing Smart Clips references.
   No new video player, copies of recordings, or scoring/state engines. */
(()=>{
  'use strict';
  if(window.VC_16131_CLIP_STUDIO)return;
  const VERSION='19.2.4', $=id=>document.getElementById(id), arr=x=>Array.isArray(x)?x:[];
  const root=$('scout-video-hub'), anchor=$('vc-clip33');
  if(!root||!anchor)return;
  const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||{};
  const clipsApi=()=>window.VC_SCOUT_CLIPS_PRO||{};
  const mediaApi=()=>window.VC_VIDEO_REVIEW_API||{};
  const state={matchId:'',selectedId:'',selectedKeys:new Set(),filter:'',skill:'',player:'',set:'',status:'',playing:false,playIndex:0,queue:[],timer:null,busy:false,lastRender:0};
  const LIMIT=250;
  const norm=s=>String(s??'').trim().toLocaleLowerCase('es');
  const safe=s=>String(s??'').slice(0,140);
  function match(){const id=String($('v780-match')?.value||'');return arr(bridge().getMatches?.()).find(m=>String(m.id)===id)||null}
  function library(m=match()){return arr(m?.clipPlaylists)}
  function current(m=match()){return library(m).find(p=>String(p.id)===state.selectedId)||null}
  function keyOf(c){return c.virtual&&c.sourceKey?`a:${String(c.sourceKey)}`:c.id?`c:${String(c.id)}`:c.sourceKey?`a:${String(c.sourceKey)}`:''}
  function label(c){return safe(c?.name||c?.label||c?.sourceKey||'Jugada')}
  function itemOf(c){return c?.virtual&&c.sourceKey?{kind:'action',key:String(c.sourceKey)}:{kind:'clip',id:String(c.id)}}
  function itemId(x){return x?.kind==='action'?`a:${x.key}`:x?.kind==='clip'?`c:${x.id}`:''}
  function available(){try{return arr(clipsApi().available?.())}catch(err){console.warn('Clip Studio: catálogo',err);return []}}
  function byItem(catalogue){return new Map(catalogue.map(c=>[keyOf(c),c]).filter(x=>x[0]))}
  function notify(message,error=false){state.status=message;const el=$('vc16131-status');if(el){el.textContent=message;el.dataset.error=error?'1':'0'}}
  // The existing bridge is the only persistence route. Never create another storage layer.
  function commit(m,apply){
    if(!m){notify('Selecciona un partido antes de editar una playlist.',true);return false}
    if(state.busy)return false;
    // Store alongside the match, not inside m.video: legacy v700Meta() rebuilds
    // m.video and would silently drop custom fields such as playlists.
    const old=m.clipPlaylists;
    const before=old===undefined?undefined:JSON.parse(JSON.stringify(old));
    try{
      state.busy=true;
      const copy=old===undefined?[]:JSON.parse(JSON.stringify(arr(old)));
      const next=apply(copy);
      if(next===false){state.busy=false;return false}
      m.clipPlaylists=copy;
      const save=bridge().save;
      if(typeof save!=='function')throw Error('El guardado de scouting no está disponible');
      const result=save();
      if(result&&typeof result.then==='function'){
        result.catch(err=>{
          m.clipPlaylists=before;
          notify('Error al guardar cambios en la playlist: '+String(err?.message||err),true);
          render();
        });
      }
      state.busy=false;
      return true;
    }catch(err){
      if(before===undefined)delete m.clipPlaylists;else m.clipPlaylists=before;
      state.busy=false;
      notify('No se ha podido guardar: '+String(err?.message||err),true);
      return false;
    }
  }
  function uid(){return 'pl_'+Date.now()+'_'+Math.random().toString(36).slice(2,9)}
  function create(name,goal=''){const m=match(),n=safe(name).trim(),g=safe(goal).trim();if(!n){notify('Escribe un nombre para la playlist.',true);return false}if(library(m).length>=50){notify('Se ha alcanzado el límite de 50 playlists por partido.',true);return false}
    const p={id:uid(),name:n,goal:g,entries:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(!commit(m,list=>list.push(p)))return false;
    state.selectedId=p.id;state.selectedKeys.clear();notify(`Playlist «${n}» creada. Guardado solicitado.`);render();return p.id;
  }
  function rename(id,name,goal){const m=match(),n=safe(name).trim();if(!n){notify('El nombre no puede quedar vacío.',true);return false}
    const ok=commit(m,list=>{const p=list.find(v=>String(v.id)===String(id));if(!p)return false;p.name=n;p.goal=safe(goal).trim();p.updatedAt=new Date().toISOString()});
    if(ok){notify('Playlist actualizada. Guardado solicitado.');render()}return ok;
  }
  function deletePlaylist(id){const m=match();if(!library(m).some(p=>String(p.id)===String(id)))return false;
    if(state.playing)stop();const ok=commit(m,list=>{const i=list.findIndex(p=>String(p.id)===String(id));if(i<0)return false;list.splice(i,1)});
    if(ok){state.selectedId=library(m)[0]?.id||'';notify('Playlist eliminada. Las referencias originales permanecen.');render()}return ok;
  }
  function addEntries(ids){const m=match(),p=current(m),keys=new Set(arr(ids).map(String).filter(Boolean));if(!p){notify('Crea o elige una playlist.',true);return 0}
    if(!keys.size){notify('Selecciona una o más jugadas del catálogo.',true);return 0}
    const cats=available(),selected=cats.filter(c=>keys.has(keyOf(c)));let added=0;
    const ok=commit(m,list=>{const dest=list.find(x=>String(x.id)===String(p.id));if(!dest)return false;
      dest.entries=arr(dest.entries);const seen=new Set(dest.entries.map(itemId));
      for(const c of selected){const ref=itemOf(c),k=itemId(ref);if(!k||seen.has(k)||dest.entries.length>=LIMIT)continue;dest.entries.push(ref);seen.add(k);added++}
      if(!added)return false;dest.updatedAt=new Date().toISOString()});
    if(ok){state.selectedKeys.clear();notify(`${added} jugadas añadidas sin duplicar vídeos. Guardado solicitado.`);render();return added}
    notify('Las jugadas seleccionadas ya estaban incluidas o se alcanzó el límite.');return 0;
  }
  // Reuse the existing Video Analytics selection; no parallel query or action store.
  function addAnalyticsSelection(){
    const selection=window.VC_VIDEO_ANALYTICS_1612?.selection?.();
    if(!selection||String(selection.matchId)!==String(match()?.id)){
      notify('Selecciona primero jugadas del mismo partido en Análisis Pro.',true);return 0;
    }
    const keys=new Set(arr(selection.keys).map(String));
    const availableIds=available().filter(c=>c.sourceKey&&keys.has(String(c.sourceKey))).map(keyOf);
    if(!availableIds.length){notify('Las jugadas elegidas no tienen referencias de vídeo. Sincroniza la grabación.',true);return 0}
    return addEntries(availableIds);
  }
  function removeEntry(index){const m=match(),p=current(m);if(!p)return false;
    const ok=commit(m,list=>{const dest=list.find(x=>String(x.id)===String(p.id));if(!dest||index<0||index>=arr(dest.entries).length)return false;dest.entries.splice(index,1);dest.updatedAt=new Date().toISOString()});
    if(ok){if(state.playing)stop();notify('Jugada quitada de la playlist. El clip original no se ha borrado.');render()}return ok;
  }
  function moveEntry(index,delta){const m=match(),p=current(m);if(!p)return false;
    const ok=commit(m,list=>{const dest=list.find(x=>String(x.id)===String(p.id));const items=arr(dest?.entries);const j=index+delta;if(j<0||j>=items.length)return false;[items[index],items[j]]=[items[j],items[index]];dest.updatedAt=new Date().toISOString()});
    if(ok){if(state.playing)stop();render()}return ok;
  }
  function resolve(ref,map){return map.get(itemId(ref))||null}
  function stop(){if(state.timer){clearInterval(state.timer);state.timer=null}state.playing=false;state.queue=[];state.playIndex=0;
    try{window.v780StopPlaylist?.()}catch(_){};
    renderPlayStatus();
  }
  function renderPlayStatus(){const btn=$('vc16131-stop'),out=$('vc16131-play-state');if(btn)btn.disabled=!state.playing;
    if(out)out.textContent=state.playing?`Reproduciendo ${state.playIndex+1}/${state.queue.length}`:'Ninguna playlist en reproducción.';
  }
  function playEntry(idx){
    const currentItem=state.queue[idx];if(!currentItem){stop();notify('Playlist terminada.');return false}
    const {clip}=currentItem;
    if(clip.orphaned||clip.unlinked){state.playIndex++;return playEntry(state.playIndex)}
    if(typeof window.v780OpenAt!=='function'){stop();notify('El reproductor del partido no está disponible.',true);return false}
    const start=Number(clip.start),end=Number(clip.end);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){state.playIndex++;return playEntry(state.playIndex)}
    const ok=window.v780OpenAt?.(Math.max(0,start),'',{pre:0,post:Math.max(.15,end-start)});
    if(ok===false){stop();notify('Carga y sincroniza el vídeo del partido antes de reproducir la playlist.',true);return false}
    state.playIndex=idx;renderPlayStatus();return true;
  }
  function playPlaylist(){
    const m=match(),p=current(m);
    if(!m||!p){notify('Selecciona una playlist.',true);return false}
    const diag=window.v780Diagnostics?.()||{};
    if(!mediaApi().loaded?.()||diag.match&&String(diag.match)!==String(m.id)){notify('Carga primero la grabación correspondiente a este partido.',true);return false}
    const map=byItem(available());const sequence=arr(p.entries).map(r=>({ref:r,clip:resolve(r,map)})).filter(x=>x.clip&&!x.clip.orphaned&&!x.clip.unlinked&&Number.isFinite(Number(x.clip.start))&&Number.isFinite(Number(x.clip.end))&&Number(x.clip.end)>Number(x.clip.start));
    if(!sequence.length){notify('La playlist no contiene jugadas con tiempos válidos. Sincroniza el vídeo.',true);return false}
    stop();state.queue=sequence;state.playIndex=0;state.playing=true;
    if(!playEntry(0))return false;
    state.timer=setInterval(()=>{
      if(!state.playing)return;
      if(String(match()?.id)!==String(m.id)){stop();notify('Reproducción detenida al cambiar de partido.');return}
      const item=state.queue[state.playIndex];if(!item){stop();return}
      const now=Number(mediaApi().currentTime?.());if(!Number.isFinite(now))return;
      if(now>=Number(item.clip.end)-.15){state.playIndex++;playEntry(state.playIndex)}
    },220);
    notify(`Playlist «${p.name}» en reproducción (${sequence.length} jugadas).`);renderPlayStatus();return true;
  }
  function exportPlaylist(){const p=current(),m=match();if(!p||!m){notify('Selecciona una playlist para exportar.',true);return false}
    const data={format:'volley-coach-playlist-refs',version:1,matchId:String(m.id),matchDate:String(m.date||''),opponent:String(m.opponent||''),playlist:{id:p.id,name:p.name,goal:p.goal,entries:arr(p.entries)}};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`playlist_${String(p.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,44)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Referencias de playlist exportadas. El archivo no incluye vídeo.');return true;
  }
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
  function button(label,callback,cls='',disabled=false){const b=el('button',cls,label);b.type='button';b.disabled=disabled;b.addEventListener('click',callback);return b}
  function build(){if($('vc16131-studio'))return;
    const s=el('section','vc16131-studio');s.id='vc16131-studio';s.setAttribute('aria-label','Clip Studio Pro');
    s.innerHTML=`<header class="vc16131-heading"><div><span>CLIP STUDIO PRO · V19.2.4</span><h3>Playlists tácticas</h3><p>Guarda selecciones de jugadas por partido, sin duplicar clips ni vídeos.</p></div><span id="vc16131-counter">0 playlists</span></header>
    <div class="vc16131-create"><label>Nombre de playlist<input id="vc16131-name" maxlength="140" placeholder="Ej. Recepciones difíciles · Set 2"></label><label>Objetivo táctico<input id="vc16131-goal" maxlength="140" placeholder="Qué quieres revisar o entrenar"></label><button type="button" id="vc16131-create">Crear playlist</button></div>
    <div class="vc16131-layout"><div class="vc16131-library"><h4>Playlists guardadas</h4><div id="vc16131-playlists"></div><div id="vc16131-selected-controls" hidden><label>Nombre<input id="vc16131-edit-name" maxlength="140"></label><label>Objetivo<input id="vc16131-edit-goal" maxlength="140"></label><div class="vc16131-actions"><button type="button" id="vc16131-update">Guardar cambios</button><button type="button" id="vc16131-delete">Eliminar playlist</button></div></div><p id="vc16131-play-state">Ninguna playlist en reproducción.</p><div class="vc16131-actions"><button type="button" id="vc16131-play">▶ Reproducir seguida</button><button type="button" id="vc16131-stop" disabled>■ Detener</button><button type="button" id="vc16131-export">Exportar referencias JSON</button></div></div>
    <div class="vc16131-browser"><div class="vc16131-topline"><h4>Explorar jugadas</h4><button type="button" id="vc16131-refresh">Actualizar</button></div><div class="vc16131-filters"><label>Buscar<input id="vc16131-search" type="search" placeholder="Jugador, código o fundamento"></label><label>Fundamento<select id="vc16131-skill"><option value="">Todos</option><option value="S">Saque</option><option value="R">Recepción</option><option value="A">Ataque</option><option value="B">Bloqueo</option><option value="D">Defensa</option><option value="E">Colocación</option></select></label><label>Set<select id="vc16131-set"><option value="">Todos</option></select></label></div><div id="vc16131-candidates" class="vc16131-items"></div><div class="vc16131-actions"><button id="vc16131-add" type="button">＋ Añadir seleccionadas</button><button id="vc16131-add-filtered" type="button">＋ Añadir las del filtro</button></div><small>La selección usa las referencias de Smart Clips. Solo son reproducibles si el vídeo del partido está cargado y sincronizado.</small></div></div>
    <div class="vc16131-sequence"><div class="vc16131-topline"><h4>Orden de reproducción</h4><span id="vc16131-order-count">0 jugadas</span></div><div id="vc16131-order"></div></div><p class="vc16131-status" id="vc16131-status" role="status" aria-live="polite">Selecciona un partido y crea una playlist.</p>`;
    anchor.insertAdjacentElement('afterend',s);
    $('vc16131-create').addEventListener('click',()=>create($('vc16131-name').value,$('vc16131-goal').value));
    $('vc16131-update').addEventListener('click',()=>rename(state.selectedId,$('vc16131-edit-name').value,$('vc16131-edit-goal').value));
    $('vc16131-delete').addEventListener('click',()=>{const p=current();if(p&&window.confirm(`¿Eliminar la playlist «${p.name}»? Los clips originales se conservarán.`))deletePlaylist(p.id)});
    $('vc16131-add').addEventListener('click',()=>addEntries([...state.selectedKeys]));
    $('vc16131-add-filtered').addEventListener('click',()=>addEntries(filteredClips().slice(0,LIMIT).map(keyOf)));
    $('vc16131-play').addEventListener('click',playPlaylist);$('vc16131-stop').addEventListener('click',stop);
    $('vc16131-export').addEventListener('click',exportPlaylist);
    $('vc16131-refresh').addEventListener('click',render);
    for(const id of ['vc16131-search','vc16131-skill','vc16131-set'])$(id).addEventListener(id==='vc16131-search'?'input':'change',renderCandidates);
    const quick=document.querySelector('.v780-playlists .v780-section-head');
    if(quick&&!$('vc16131-open')){
      const go=button('Abrir Clip Studio Pro',()=>{root.dataset.vc58Tab='analysis';render();$('vc16131-studio')?.scrollIntoView({behavior:'smooth',block:'start'});},'');
      go.id='vc16131-open';quick.append(go);
    }
    $('v780-match')?.addEventListener('change',()=>queueMicrotask(()=>{stop();state.selectedId='';state.selectedKeys.clear();render()}));
  }
  function ensureAnalyticsShortcut(){
    const analyticsActions=document.querySelector('#vc1612-video-selection .vc1612-video-actions');
    if(analyticsActions&&!$('vc16131-from-analytics')){
      const save=button('＋ Añadir a playlist permanente',()=>{
        if(!current()){notify('Crea primero una playlist en Clip Studio Pro.',true);$('vc16131-studio')?.scrollIntoView({behavior:'smooth',block:'start'});return}
        addAnalyticsSelection();$('vc16131-studio')?.scrollIntoView({behavior:'smooth',block:'start'});
      });save.id='vc16131-from-analytics';analyticsActions.append(save);
    }
  }
  function filteredClips(){const q=norm($('vc16131-search')?.value),skill=$('vc16131-skill')?.value||'',set=$('vc16131-set')?.value||'';
    return available().filter(c=>(!skill||String(c.skill||'')===skill)&&(!set||String(c.set||'')===set)&&(!q||norm([c.name,c.player,c.skill,c.evaluation,c.note].join(' ')).includes(q))).sort((a,b)=>Number(a.start||0)-Number(b.start||0));
  }
  function renderPlaylists(){const m=match(),l=library(m),host=$('vc16131-playlists');host.replaceChildren();$('vc16131-counter').textContent=`${l.length} playlist${l.length===1?'':'s'}`;
    for(const p of l){host.append(button(`${p.name} · ${arr(p.entries).length} jugadas`,()=>{if(state.playing)stop();state.selectedId=p.id;state.selectedKeys.clear();render()},p.id===state.selectedId?'selected':''))}
    if(!l.length)host.append(el('p','vc16131-empty','No hay playlists guardadas en este partido.'));
    if(state.selectedId&&!l.some(p=>String(p.id)===state.selectedId))state.selectedId=l[0]?.id||'';
    const p=current(m);$('vc16131-selected-controls').hidden=!p;
    if(p){$('vc16131-edit-name').value=p.name||'';$('vc16131-edit-goal').value=p.goal||''}
  }
  function renderCandidates(){const host=$('vc16131-candidates');if(!host)return;host.replaceChildren();const c=filteredClips();const p=current();
    const seen=new Set(arr(p?.entries).map(itemId));
    for(const clip of c.slice(0,80)){
      const k=keyOf(clip);if(!k)continue;const row=el('label','vc16131-clip-row');const cb=document.createElement('input');cb.type='checkbox';cb.checked=state.selectedKeys.has(k);cb.disabled=seen.has(k);cb.addEventListener('change',()=>{if(cb.checked)state.selectedKeys.add(k);else state.selectedKeys.delete(k)});
      const info=el('span','',`${label(clip)} · ${Number(clip.start||0).toFixed(1)} s${clip.set?' · S'+clip.set:''}`);const tag=el('small','',seen.has(k)?'Incluida':clip.virtual?'Auto':'Guardada');row.append(cb,info,tag);host.append(row);
    }
    if(!c.length)host.append(el('p','vc16131-empty',!match()?'Selecciona un partido.':'No hay clips para este filtro. Las acciones necesitan una marca temporal válida.'));
    if(c.length>80)host.append(el('p','vc16131-empty',`Mostrando 80 de ${c.length}. Filtra o usa «Añadir las del filtro».`));
  }
  function renderOrder(){const host=$('vc16131-order');host.replaceChildren();const p=current(),map=byItem(available()),list=arr(p?.entries);$('vc16131-order-count').textContent=`${list.length} jugada${list.length===1?'':'s'}`;
    if(!p){host.append(el('p','vc16131-empty','Elige una playlist para ordenar sus jugadas.'));return}
    if(!list.length){host.append(el('p','vc16131-empty','Añade jugadas desde el catálogo y se mostrarán aquí.'));return}
    for(let i=0;i<Math.min(list.length,LIMIT);i++){
      const c=resolve(list[i],map),row=el('div','vc16131-order-row');row.append(el('b','',String(i+1)),el('span','',c?label(c):'Referencia no disponible (acción eliminada o clip ausente)'));
      const controls=el('div','vc16131-order-actions');controls.append(button('↑',()=>moveEntry(i,-1),'',i===0),button('↓',()=>moveEntry(i,1),'',i===list.length-1),button('Quitar',()=>removeEntry(i)));row.append(controls);host.append(row);
    }
  }
  function render(){build();const m=match();if(state.playing&&state.matchId&&String(m?.id||'')!==state.matchId)stop();
    state.matchId=String(m?.id||'');
    if(!state.selectedId||!library(m).some(x=>String(x.id)===state.selectedId))state.selectedId=library(m)[0]?.id||'';
    const opts=$('vc16131-set'),prev=opts.value;opts.replaceChildren();opts.append(new Option('Todos',''));
    for(const s of arr(m?.sets))opts.append(new Option('Set '+s.number,String(s.number)));
    if([...opts.options].some(o=>o.value===prev))opts.value=prev;
    renderPlaylists();renderCandidates();renderOrder();renderPlayStatus();
    if(state.status)notify(state.status);
  }
  const styles=`
#scout-video-hub[data-vc58-tab="player"] #vc16131-studio{display:none!important}
#scout-video-hub .vc16131-studio{margin:14px 0;padding:16px;background:#fff;border:1px solid #d8e5ef;border-radius:14px;color:#193c5c;font:500 12px/1.45 system-ui,sans-serif;box-shadow:0 5px 22px #123b5912}
#scout-video-hub .vc16131-studio *{box-sizing:border-box}
#scout-video-hub .vc16131-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;border-bottom:1px solid #e4edf5;padding-bottom:12px}
#scout-video-hub .vc16131-heading span{font-size:10px;letter-spacing:.1em;font-weight:850;color:#4b86b7}
#scout-video-hub .vc16131-heading h3{font-size:20px!important;margin:2px 0!important;color:#163a5c!important}
#scout-video-hub .vc16131-heading p{font-size:12px;color:#71869a;margin:0}
#scout-video-hub #vc16131-counter{background:#e9f4fc;padding:6px 10px;border-radius:20px;white-space:nowrap}
#scout-video-hub .vc16131-create{display:grid;grid-template-columns:1.15fr 1fr auto;gap:9px;align-items:end;margin:14px 0}
#scout-video-hub .vc16131-studio label{min-width:0;display:grid;gap:5px;font-weight:700;font-size:11px;color:#607b94}
#scout-video-hub .vc16131-studio input,#scout-video-hub .vc16131-studio select{width:100%;min-height:38px!important;padding:8px 9px!important;background:#fff!important;border:1px solid #ccdae7!important;border-radius:8px!important;color:#193a5a!important;font:500 12px system-ui,sans-serif!important}
#scout-video-hub .vc16131-studio button{border:1px solid #ccdcea!important;background:#eff5fb!important;color:#24547d!important;border-radius:8px!important;padding:8px 10px!important;font:750 11px/1.3 system-ui,sans-serif!important;min-height:35px!important;cursor:pointer!important;box-shadow:none!important}
#scout-video-hub .vc16131-studio button:disabled{opacity:.45;cursor:not-allowed!important}
#scout-video-hub .vc16131-create button,#scout-video-hub #vc16131-add,#scout-video-hub #vc16131-play{background:#165ba4!important;color:#fff!important;border-color:#165ba4!important}
#scout-video-hub .vc16131-layout{display:grid;grid-template-columns:minmax(250px,.9fr) minmax(0,1.4fr);gap:12px}
#scout-video-hub .vc16131-library,#scout-video-hub .vc16131-browser,#scout-video-hub .vc16131-sequence{padding:12px;border-radius:11px;background:#f8fbfe;border:1px solid #e0eaf3;min-width:0}
#scout-video-hub .vc16131-studio h4{font-size:13px!important;margin:0 0 10px!important;color:#17395c!important}
#scout-video-hub #vc16131-playlists{display:grid;gap:5px;max-height:200px;overflow:auto}
#scout-video-hub #vc16131-playlists button{text-align:left!important;white-space:normal!important}
#scout-video-hub #vc16131-playlists button.selected{border-color:#276ca9!important;background:#d9eaf9!important;color:#124f82!important}
#scout-video-hub #vc16131-selected-controls{margin:10px 0;display:grid;gap:7px}
#scout-video-hub #vc16131-selected-controls[hidden]{display:none!important}
#scout-video-hub .vc16131-topline{display:flex;justify-content:space-between;align-items:center;gap:9px}
#scout-video-hub .vc16131-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}
#scout-video-hub #vc16131-play-state{margin:10px 0 0;padding:8px;border-radius:7px;background:#e9f2fa;font-size:11px;color:#456681}
#scout-video-hub .vc16131-filters{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(110px,.7fr) minmax(85px,.4fr);gap:7px;margin-bottom:10px}
#scout-video-hub .vc16131-items{max-height:250px;overflow:auto;display:grid;gap:4px}
#scout-video-hub .vc16131-clip-row{display:flex!important;align-items:center;gap:8px;padding:7px 9px;border:1px solid #e0eaf2;border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
#scout-video-hub .vc16131-clip-row input{width:15px!important;min-height:15px!important;height:15px!important;margin:0}
#scout-video-hub .vc16131-clip-row span{flex:1;min-width:0;overflow-wrap:anywhere;color:#315874}
#scout-video-hub .vc16131-clip-row small{font-size:9px;color:#7990a5}
#scout-video-hub .vc16131-sequence{margin-top:12px}
#scout-video-hub #vc16131-order{display:grid;gap:5px;max-height:280px;overflow:auto}
#scout-video-hub .vc16131-order-row{display:flex;align-items:center;gap:10px;padding:6px 8px;background:#fff;border:1px solid #e1eaf2;border-radius:7px}
#scout-video-hub .vc16131-order-row>b{width:20px;text-align:center;color:#3f6b8e}
#scout-video-hub .vc16131-order-row>span{flex:1;min-width:0;overflow-wrap:anywhere}
#scout-video-hub .vc16131-order-actions{display:flex;gap:4px}
#scout-video-hub .vc16131-order-actions button{min-height:27px!important;padding:5px 7px!important}
#scout-video-hub .vc16131-empty{margin:6px 0;color:#7790a4;font-size:11px}
#scout-video-hub .vc16131-browser>small{display:block;margin-top:9px;color:#71869a;font-size:10px}
#scout-video-hub .vc16131-status{margin:11px 0 0;padding:9px 12px;border-radius:9px;background:#eef6fc;color:#396686;font-size:11px}
#scout-video-hub .vc16131-status[data-error="1"]{background:#fff0ed;color:#9e463d}
@media(max-width:900px){#scout-video-hub .vc16131-layout{grid-template-columns:1fr}#scout-video-hub .vc16131-create{grid-template-columns:1fr 1fr}#scout-video-hub .vc16131-create button{grid-column:1/-1}#scout-video-hub .vc16131-filters{grid-template-columns:1fr 1fr}#scout-video-hub .vc16131-filters label:first-child{grid-column:1/-1}}
@media(max-width:500px){#scout-video-hub .vc16131-studio{padding:10px}#scout-video-hub .vc16131-create{grid-template-columns:1fr}#scout-video-hub .vc16131-create button{grid-column:auto}#scout-video-hub .vc16131-order-row{flex-wrap:wrap}#scout-video-hub .vc16131-order-actions{margin-left:auto}}
`;
  const style=document.createElement('style');style.id='vc16131-clip-studio-style';style.textContent=styles;document.head.append(style);
  build();render();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureAnalyticsShortcut,{once:true});
  else ensureAnalyticsShortcut();
  window.VC_16131_CLIP_STUDIO={version:VERSION,create,rename,delete:deletePlaylist,addEntries,removeEntry,moveEntry,play:playPlaylist,stop,refresh:render,exportPlaylist,addAnalyticsSelection,list:()=>library().map(p=>JSON.parse(JSON.stringify(p))),diagnostics:()=>({matchId:match()?.id||null,selectedId:state.selectedId,playlists:library().length,playing:state.playing,queue:state.queue.length})};
})();

/* VC20714_SOURCE_END:121-vc16131-clip-studio-pro.js */

;
/* VC20714_SOURCE_BEGIN:132-vc1642-video-studio-pro.js */
/* Volley Coach V16.4.2 · Video Studio Pro
 * Three workspaces over the existing V7.8 / V16 video engine.
 * Does not create, replace or clone a media element, recording, match or clip.
 * All media actions delegate to the existing user-facing engine.
 */
(()=>{
 'use strict';
 if(window.VC_VIDEO_STUDIO_1642)return;
 const VERSION='16.4.3';
 const $=id=>document.getElementById(id);
 const root=$('scout-video-hub'),hub=root?.querySelector('.v780-hub');
 if(!root||!hub)return;
 const allowed=['capture','review','clips'];
 const state={mode:'capture',changes:0,lastError:'',mounted:false};
 let pending=false;
 const command=document.createElement('section');
 command.id='vc1642-command';
 command.className='vc1642-command';
 command.setAttribute('aria-label','Video Studio Pro · controles unificados');
 command.innerHTML=`
  <div class="vc1642-header">
   <div class="vc1642-heading"><span>VOLLEY COACH · VIDEO STUDIO PRO 3.0</span><strong>Captura, revisión y clips</strong><small>Un único reproductor y el mismo scouting, sin copias paralelas</small></div>
   <div class="vc1642-indicators" role="status" aria-live="polite"><span id="vc1642-source-state">Fuente: —</span><span id="vc1642-sync-state">Sincronización: —</span><span id="vc1642-clip-state">Clips: —</span></div>
  </div>
  <nav class="vc1642-modes" aria-label="Espacios de vídeo">
   <button type="button" data-vc1642-mode="capture" aria-pressed="true"><b>01 · Captura</b><small>Fuentes, directo, delay y grabación</small></button>
   <button type="button" data-vc1642-mode="review" aria-pressed="false"><b>02 · Revisión</b><small>Rallies, rotaciones, análisis y playlists</small></button>
   <button type="button" data-vc1642-mode="clips" aria-pressed="false"><b>03 · Clips</b><small>Marcas IN/OUT, catálogo y montajes</small></button>
  </nav>
  <div class="vc1642-actions" aria-label="Acciones rápidas del espacio de vídeo">
   <div class="vc1642-review-buttons" aria-label="Atajos de revisión">
    <button type="button" data-vc1642-action="back" title="Retroceder 8 segundos">−8 s</button>
    <button type="button" data-vc1642-action="play" title="Reproducir o pausar">Reproducir / Pausa</button>
    <button type="button" data-vc1642-action="forward" title="Avanzar 5 segundos">+5 s</button>
    <button type="button" data-vc1642-action="selected">Reproducir selección</button>
    <button type="button" data-vc1642-action="go-clips" class="vc1642-primary">Ir a Clip Studio</button>
   </div>
   <div class="vc1642-clip-buttons" aria-label="Atajos de clips">
    <span>Los clips son referencias temporales; no duplican el vídeo.</span>
    <button type="button" data-vc1642-action="new-clip" class="vc1642-primary">Clip de la selección</button>
    <button type="button" data-vc1642-action="export-clips">Catálogo CSV</button>
    <button type="button" data-vc1642-action="go-review">Volver a revisión</button>
   </div>
  </div>
  <p id="vc1642-feedback" class="vc1642-feedback" aria-live="polite">Selecciona una fuente para grabar o revisar el partido.</p>`;
 const css=document.createElement('style');
 css.id='vc1642-style';
 css.textContent=`
 #scout-video-hub .vc1642-command{order:1;min-width:0;display:grid;gap:10px;background:#fff;border:1px solid #cadce8;border-radius:16px;padding:15px 16px;color:#153a57;font:500 12px/1.4 system-ui, sans-serif;box-shadow:0 7px 20px rgba(13,43,66,.05)}
 #scout-video-hub .vc1642-command *{box-sizing:border-box}
 #scout-video-hub .vc1642-header{display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap}
 #scout-video-hub .vc1642-heading{display:grid;gap:2px}
 #scout-video-hub .vc1642-heading>span{font-size:9px;letter-spacing:.13em;color:#547c97;font-weight:850}
 #scout-video-hub .vc1642-heading strong{font-size:18px;line-height:1.25;color:#153e5f}
 #scout-video-hub .vc1642-heading small{color:#66859d;font-size:11px}
 #scout-video-hub .vc1642-indicators{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
 #scout-video-hub .vc1642-indicators span{background:#eef5f9;border:1px solid #d7e6ef;border-radius:99px;padding:5px 9px;color:#456a83;font-weight:750;font-size:10px}
 #scout-video-hub .vc1642-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:5px;background:#edf3f8;border:1px solid #dce8f0;border-radius:12px}
 #scout-video-hub .vc1642-modes button{display:grid!important;justify-items:start;gap:4px;min-width:0!important;min-height:62px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;padding:10px 12px!important;text-align:left!important;color:#466d8a!important;box-shadow:none!important;cursor:pointer}
 #scout-video-hub .vc1642-modes button b{font-size:12px;font-weight:850;color:inherit}
 #scout-video-hub .vc1642-modes button small{font-size:10px;color:inherit;opacity:.8;line-height:1.35;white-space:normal}
 #scout-video-hub .vc1642-modes button[aria-pressed="true"]{background:#174e7c!important;border-color:#174e7c!important;color:#fff!important;box-shadow:0 4px 10px rgba(23,78,124,.2)!important}
 #scout-video-hub .vc1642-actions>div{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
 #scout-video-hub .vc1642-actions>div>span{color:#678197;font-size:10px;font-weight:750;margin-right:3px}
 #scout-video-hub .vc1642-actions button{min-height:36px!important;border:1px solid #cbdde9!important;background:#f7fbfe!important;color:#225c84!important;padding:7px 11px!important;border-radius:8px!important;font:750 11px system-ui!important;cursor:pointer}
 #scout-video-hub .vc1642-actions button.vc1642-primary{background:#1e6096!important;color:white!important;border-color:#1e6096!important}
 #scout-video-hub .vc1642-actions button:disabled{opacity:.48!important;cursor:not-allowed!important}
 #scout-video-hub .vc1642-feedback{margin:0;color:#6b8398;font:500 10px/1.4 system-ui}
 #scout-video-hub .vc1642-feedback[data-error="true"]{color:#a3433d}
 #scout-video-hub.vc1642-ready .vc58-tabbar{display:none!important}
 #scout-video-hub.vc1642-ready .v780-hero-actions{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .v117-review-source-tabs{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .v117-review-sourcebar{min-height:70px}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-actions{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-review-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="capture"] .vc1642-clip-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .vc1642-source-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .vc1642-clip-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-source-buttons,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-review-buttons{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-toolbar,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-status-grid,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc58-analysis-heading,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-timeline-panel,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v781-set-map-panel,
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-side{display:none!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hub{grid-template-columns:minmax(0,1fr) minmax(320px,.9fr)!important;grid-template-areas:'hero hero' 'command command' 'context context' 'player clips'!important;gap:12px!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hero{grid-area:hero!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc1642-command{grid-area:command!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .vc58-context-bar{grid-area:context!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-main{grid-area:player!important;grid-template-columns:minmax(0,1fr)!important;min-width:0!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] #vc-clip33{grid-area:clips!important;min-width:0!important;margin:0!important}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] #vc-clip33 .vc-clip33-head{flex-wrap:wrap}
 #scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .v780-main{grid-template-columns:minmax(0,1.45fr) minmax(260px,.75fr)!important}
 @media(max-width:1100px){#scout-video-hub.vc1642-ready[data-vc1642-mode="clips"] .v780-hub{grid-template-columns:minmax(0,1fr)!important;grid-template-areas:'hero' 'command' 'context' 'player' 'clips'!important}#scout-video-hub.vc1642-ready[data-vc1642-mode="review"] .v780-main{grid-template-columns:minmax(0,1fr)!important}}
 @media(max-width:640px){#scout-video-hub .vc1642-command{padding:10px;gap:8px}#scout-video-hub .vc1642-modes{gap:3px}#scout-video-hub .vc1642-modes button{padding:9px 7px!important;min-height:62px!important}#scout-video-hub .vc1642-modes button b{font-size:10px}#scout-video-hub .vc1642-modes button small{font-size:9px}#scout-video-hub .vc1642-heading strong{font-size:15px}#scout-video-hub .vc1642-indicators{justify-content:flex-start}#scout-video-hub .vc1642-actions>div{gap:4px}#scout-video-hub .vc1642-actions button{flex:1 0 auto;font-size:10px!important;padding:8px!important}}
 @media(prefers-reduced-motion:reduce){#scout-video-hub .vc1642-modes button{transition:none!important}}
 `;
 function say(message,error=false){state.lastError=error?message:'';const out=$('vc1642-feedback');if(out){out.textContent=message;out.dataset.error=error?'true':'false'}}
 const safeCall=(name,...args)=>{const fn=window[name];if(typeof fn!=='function'){say(`La función «${name}» no está disponible en esta pantalla.`,true);return false}try{fn(...args);return true}catch(err){console.warn('VC1642',name,err);say('No se pudo completar la operación. Comprueba la fuente de vídeo.',true);return false}};
 function setMode(next,{focus=false}={}){
  if(!allowed.includes(next))return false;
  const tab=next==='capture'?'player':'analysis';
  // The original two-tab controller only toggles visibility; no media reload.
  if(typeof window.vc58SetVideoTab!=='function'){say('El espacio de vídeo todavía no ha terminado de cargarse.',true);return false}
  state.mode=next;root.dataset.vc1642Mode=next;state.changes++;
  window.vc58SetVideoTab(tab);
  for(const button of command.querySelectorAll('[data-vc1642-mode]')){
   const isActive=button.dataset.vc1642Mode===next;
   button.setAttribute('aria-pressed',String(isActive));
   if(focus&&isActive)button.focus();
  }
  say(next==='capture'?'Usa los controles superiores y el panel principal para elegir fuente, LIVE, DELAY y grabación.':next==='review'?'Selecciona un rally o una acción. El reproductor se mantiene cargado al cambiar de espacio.':'Selecciona o crea clips y playlists; la fuente de vídeo sigue siendo la del partido actual.');
  schedule();return true;
 }
 function refresh(){
  if(!state.mounted)return;
  const dg=window.v780Diagnostics?.()||{};
  const source=$('v117-review-source-label')?.textContent?.trim()||dg.mediaType||'Sin fuente';
  const baseVideo=$('v780-video-state')?.textContent?.trim()||'Sin vídeo';
  const liveStatus=$('v117-review-live-copy')?.textContent?.trim();
  const vid=/^(LIVE|DELAY)$/i.test(source)?(liveStatus||'Cámara sin iniciar'):baseVideo;
  const sync=$('v780-sync-state')?.textContent?.trim()||'Pendiente';
  const count=$('vc-clip33-count')?.textContent?.trim()||'Sin catálogo';
  const fields={'vc1642-source-state':`Fuente: ${source} · ${vid}`,'vc1642-sync-state':`Sincronización: ${sync}`,'vc1642-clip-state':`Clips: ${count}`};
  Object.entries(fields).forEach(([id,value])=>{const el=$(id);if(el&&el.textContent!==value)el.textContent=value});
  const canPlay=!!dg.videoLoaded;
  for(const name of ['back','play','forward','selected']){
   const btn=command.querySelector(`[data-vc1642-action="${name}"]`);if(btn)btn.disabled=!canPlay;
  }
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})}
 function action(name){
  if(name==='file'){
   if(!setMode('capture'))return;
   const input=$('v780-file');if(!input){say('No está disponible el selector de archivo.',true);return}input.click();return;
  }
  if(name==='recordings'){if(setMode('capture'))safeCall('v780OpenRecordingPicker');return}
  if(name==='youtube'){if(setMode('capture'))safeCall('v117ReviewSetSource','youtube');return}
  if(name==='live'||name==='delay'){
   if(setMode('capture'))safeCall('v117ReviewSetSource',name);
   // Switching source never starts or stops a camera on behalf of the user.
   return;
  }
  if(name==='back'||name==='forward'){
   const dg=window.v780Diagnostics?.()||{};if(!dg.videoLoaded){say('Carga un vídeo correspondiente a este scouting para navegar.',true);return}
   safeCall('v780Jump',name==='back'?-8:5);return;
  }
  if(name==='play'){
   const dg=window.v780Diagnostics?.()||{};if(!dg.videoLoaded){say('Carga primero el vídeo.',true);return}
   safeCall('v780TogglePlay');return;
  }
  if(name==='selected'){
   const title=$('v780-selected-title')?.textContent?.trim();if(!title||title==='Ningún elemento'){say('Selecciona primero una jugada en la línea temporal.',true);return}
   safeCall('v780PlaySelected');return;
  }
  if(name==='new-clip'){
   // The original Clip Studio validates match/timecode and owns the save.
   const btn=$('vc-clip33-selected');if(!btn){say('Clip Studio no está disponible.',true);return}
   btn.click();schedule();return;
  }
  if(name==='export-clips'){
   const btn=$('vc-clip33-csv');if(!btn){say('No está disponible el exportador de clips.',true);return}
   btn.click();return;
  }
  if(name==='go-clips'){setMode('clips');return}
  if(name==='go-review'){setMode('review');return}
 }
 function mount(){
  if(state.mounted)return true;
  document.head.appendChild(css);
  hub.insertBefore(command,hub.querySelector('.vc58-tabbar'));
  root.classList.add('vc1642-ready');state.mounted=true;
  command.addEventListener('click',event=>{
   const btn=event.target.closest('button');if(!btn||!command.contains(btn)||btn.disabled)return;
   if(btn.dataset.vc1642Mode){setMode(btn.dataset.vc1642Mode);return}
   if(btn.dataset.vc1642Action)action(btn.dataset.vc1642Action);
  });
  // Watch only existing counters and source states; our labels are outside these targets.
  for(const id of ['v780-video-state','v780-sync-state','v117-review-source-label','v117-review-live-copy','vc-clip33-count']){
   const el=$(id);if(el)new MutationObserver(schedule).observe(el,{childList:true,characterData:true,subtree:true});
  }
  const match=$('v780-match');match?.addEventListener('change',schedule);
  const player=$('v780-player-video');
  for(const evt of ['loadedmetadata','emptied','playing','pause','durationchange','error'])player?.addEventListener(evt,schedule);
  root.addEventListener('click',event=>{
   if(event.target.closest('.v117-review-source-tabs button,.v780-hero-actions button,#vc-clip33 button,.vc58-tabbar button'))schedule();
  });
  new MutationObserver(()=>{
   const active=root.dataset.vc58Tab==='player'?'capture':'review';
   if(root.dataset.vc58Tab==='player'&&state.mode!=='capture'){state.mode='capture';root.dataset.vc1642Mode='capture';for(const b of command.querySelectorAll('[data-vc1642-mode]'))b.setAttribute('aria-pressed',String(b.dataset.vc1642Mode==='capture'))}
   else if(root.dataset.vc58Tab==='analysis'&&state.mode==='capture'){state.mode=active;root.dataset.vc1642Mode=active;for(const b of command.querySelectorAll('[data-vc1642-mode]'))b.setAttribute('aria-pressed',String(b.dataset.vc1642Mode===active))}
   schedule();
  }).observe(root,{attributes:true,attributeFilter:['data-vc58-tab']});
  // Do not change source or replay media on first mount.
  setMode('capture');return true;
 }
 function diagnostics(){return {version:VERSION,mounted:state.mounted,mode:state.mode,changes:state.changes,mediaElements:root.querySelectorAll('#v780-player-video').length,liveStreamElements:root.querySelectorAll('#v117-review-stream').length,hasOriginalClipStudio:!!$('vc-clip33'),hasOriginalRecorder:!!$('vc-rec34-strip'),lastError:state.lastError};}
 window.VC_VIDEO_STUDIO_1642={version:VERSION,mount,setMode,refresh,diagnostics};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* VC20714_SOURCE_END:132-vc1642-video-studio-pro.js */
