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
window.VC_VIDEO_ANALYTICS_1612={version:'16.1.2',collect:(m,f)=>selectActions(allActions(m),f),preview,openSelection,playOne,playlist,saveClips,diagnostics:()=>({matchId:state.matchId,selected:state.selected.length,plays:state.plays,openCount:state.openCount,previewCount:state.previewCount})};
})();
