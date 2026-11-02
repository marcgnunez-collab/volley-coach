
(()=>{
'use strict';
const VERSION='15.9.0', $=id=>document.getElementById(id), arr=x=>Array.isArray(x)?x:[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE;
function matches(){try{return arr(bridge()?.getMatches?.())}catch(_){return []}}
function activeId(){try{return String(bridge()?.getActiveId?.()||'')}catch(_){return ''}}
const state={match:'',team:'',kind:'action',skill:'',grade:'',player:'',rotation:'',phase:'',result:'',onlyTimed:false,limit:150,rows:[],lastCount:0};
const names={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
function name(a){try{return String(bridge()?.playerLabel?.(a)||a.playerNameSnapshot||a.playerLabel||a.playerNumberSnapshot||'Sin identificar')}catch(_){return String(a?.playerNameSnapshot||a?.playerLabel||a?.playerNumberSnapshot||'Sin identificar')}}
function positiveNumber(v){if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}
function timeOf(a,m){for(const k of ['videoTimestamp','liveVideoTime','videoAction','videoTime']){const v=positiveNumber(a?.[k]);if(v!==null)return v}
 const off=positiveOffset(m?.video?.syncOffset),ms=positiveNumber(a?.scoutMs);return off===null||ms===null?null:Math.max(0,ms/1000+off)}
function positiveOffset(v){if(v==null||v==='')return null;const x=Number(v);return Number.isFinite(x)?x:null}
function rallyTime(r,m){const times=arr(r?.actions).map(a=>timeOf(a,m)).filter(x=>x!==null);if(times.length)return Math.min(...times);const off=positiveOffset(m?.video?.syncOffset),ms=positiveNumber(r?.scoutStartMs);return off===null||ms===null?null:Math.max(0,ms/1000+off)}
function buildRows(ms){const output=[];for(const m of ms){for(const s of arr(m?.sets)){for(const r of arr(s?.rallies)){if(r?.id==null||r.id==='')continue;
 const set=Number(s.number)||1,own=Number(r.rotationBefore)||0,opp=Number(r.opponentRotationBefore)||0;
 const serving=r.servingBefore==='opponent'?'opponent':'ours',winner=['ours','opponent'].includes(r.winner)?r.winner:'';
 const parent={match:m,mid:String(m.id),set,own,opp,serving,winner,rally:r,phaseOurs:serving==='opponent'?'K1':'K2'};
 if(r.id!=null&&r.id!=='')output.push({...parent,kind:'rally',key:`r:${set}:${r.id}`,team:winner,time:rallyTime(r,m),label:`Set ${set} · Rally ${arr(s.rallies).indexOf(r)+1}`,player:'',skill:'',grade:''});
 for(const a of arr(r?.actions)){if(a.id==null||a.id==='')continue;const team=a.team==='opponent'?'opponent':'ours';output.push({...parent,kind:'action',key:`a:${set}:${r.id}:${a.id}`,team,action:a,time:timeOf(a,m),player:name(a),skill:String(a.skill||'').toUpperCase(),grade:String(a.evaluation||''),label:String(a.code||names[a.skill]||'Acción')})}
 }}}
 return output}
function hasTime(row){return row.time!==null&&Number.isFinite(row.time)}
function filtered(){let rows=buildRows(matches());const s=state;
 return rows.filter(r=>{
 if(s.match&&s.match!=='all'&&r.mid!==s.match)return false;
 if(s.kind!=='all'&&r.kind!==s.kind)return false;
 if(s.team&&r.team!==s.team)return false;
 if(s.skill&&(r.kind!=='action'||r.skill!==s.skill))return false;
 if(s.grade&&(r.kind!=='action'||r.grade!==s.grade))return false;
 if(s.player&&(r.kind!=='action'||r.player!==s.player))return false;
 if(s.rotation&&Number(s.rotation)!==(s.team==='opponent'?r.opp:r.own))return false;
 if(s.phase){const phase=r.team==='opponent'?(r.serving==='ours'?'K1':'K2'):r.phaseOurs;if(phase!==s.phase)return false}
 if(s.result&&r.winner!==s.result)return false;
 if(s.onlyTimed&&!hasTime(r))return false;
 return true
 }).sort((a,b)=>String(b.match.date||'').localeCompare(String(a.match.date||''))||b.set-a.set||Number(b.rally.scoutStartMs||0)-Number(a.rally.scoutStartMs||0))}
function sourceLabel(r){return hasTime(r)?`${Number(r.time).toFixed(1)} s · ${r.action?.videoTimestamp!=null?'marca exacta':'sincronización/tiempo guardado'}`:'sin timestamp; sincroniza el partido'}
function selectOptions(id,options,keep){const el=$(id);if(!el)return;const old=keep?el.value:'';el.replaceChildren();options.forEach(([value,label])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=label;el.appendChild(opt)});if(keep&&options.some(x=>x[0]===old))el.value=old;else if(el.id==='vc159-match'&&state.match&&options.some(x=>x[0]===state.match))el.value=state.match}
function populate(){const ms=matches();selectOptions('vc159-match',[['all','Todos los partidos'],...ms.map(m=>[String(m.id),`${m.date||'Sin fecha'} · ${m.opponent||'Rival'}`])],true);
 const playerSet=new Set();ms.forEach(m=>arr(m.sets).forEach(s=>arr(s.rallies).forEach(r=>arr(r.actions).forEach(a=>playerSet.add(name(a))))));selectOptions('vc159-player',[['','Todos los jugadores'],...[...playerSet].filter(x=>x&&x!=='Sin identificar').sort((a,b)=>a.localeCompare(b)).map(p=>[p,p])],true);
}
function getControls(){for(const prop of ['match','team','kind','skill','grade','player','rotation','phase','result']){const el=$('vc159-'+prop);if(el)state[prop]=el.value}state.onlyTimed=!!$('vc159-only-timed')?.checked}
function setControls(){for(const prop of ['match','team','kind','skill','grade','player','rotation','phase','result']){const el=$('vc159-'+prop);if(el)el.value=state[prop]}if($('vc159-only-timed'))$('vc159-only-timed').checked=state.onlyTimed}
function say(msg){const el=$('vc159-status');if(el)el.textContent=msg}
function render(){if(!$('vc159-studio'))return;populate();setControls();const selected=filtered();state.rows=selected;state.lastCount=selected.length;
 const ready=selected.filter(hasTime).length,from=new Set(selected.map(x=>x.mid)).size;
 $('vc159-total').textContent=String(selected.length);$('vc159-timed').textContent=String(ready);$('vc159-matches').textContent=String(from);
 const box=$('vc159-list');const display=selected.slice(0,state.limit);
 box.innerHTML=display.length?display.map((r,i)=>`<div class="vc159-row" data-vc159-index="${i}"><div><strong>${esc(r.match.date||'Sin fecha')} · ${esc(r.match.opponent||'Rival')} · S${r.set} · ${r.kind==='rally'?'Rally':esc(r.player)} · ${esc(r.label)}</strong><small>${r.team==='opponent'?'Rival':'Nuestro equipo'} · R${r.team==='opponent'?r.opp||'—':r.own||'—'} · ${r.team==='opponent'?(r.serving==='ours'?'K1':'K2'):r.phaseOurs} · ${r.kind==='action'?(esc(names[r.skill]||r.skill)+' '+esc(r.grade)):'Ganador '+(r.winner==='ours'?'nuestro':r.winner==='opponent'?'rival':'sin determinar')} · ${esc(sourceLabel(r))}</small></div><div class="vc159-row-actions"><button type="button" class="primary" data-vc159-play="${i}">▶ Abrir vídeo</button><button type="button" data-vc159-clip="${i}" ${!hasTime(r)?'disabled':''}>＋ Clip</button></div></div>`).join(''):'<div class="vc159-empty">No hay acciones o rallies que cumplan los filtros.</div>';
 $('vc159-more').hidden=selected.length<=state.limit;
 $('vc159-more').textContent=`Mostrar más (${Math.min(selected.length-state.limit,150)} de ${selected.length-state.limit})`;
 say(`${selected.length} resultados en ${from} partidos. ${selected.length-ready} sin referencia temporal. La reproducción automática solo es posible cuando el vídeo del mismo partido está cargado.`);
}
function initPanel(){if($('vc159-studio'))return;const host=$('scout-video-hub')?.querySelector('.v780-hub');if(!host)return;
 const panel=document.createElement('section');panel.id='vc159-studio';panel.innerHTML=`
 <div class="vc159-head"><div><span class="vc159-chip">V15.9 · ESTADÍSTICA ↔ VÍDEO</span><h3>Encontrar jugadas desde estadísticas</h3><p>Combina filtros y abre la acción exacta en Vídeo Review. Compatible con scouting ya guardado.</p></div><button type="button" id="vc159-reset">Limpiar filtros</button></div>
 <div class="vc159-filters">
 <label>Partidos<select id="vc159-match"></select></label>
 <label>Tipo<select id="vc159-kind"><option value="action">Acciones</option><option value="rally">Rallies</option><option value="all">Ambos</option></select></label>
 <label>Equipo<select id="vc159-team"><option value="">Ambos equipos</option><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label>
 <label>Jugador<select id="vc159-player"><option value="">Todos</option></select></label>
 <label>Fundamento<select id="vc159-skill"><option value="">Todos</option>${Object.entries(names).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>
 <label>Valoración<select id="vc159-grade"><option value="">Todas</option>${['#','+','!','-','/','='].map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('')}</select></label>
 <label>Rotación<select id="vc159-rotation"><option value="">R1–R6</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label>
 <label>Fase<select id="vc159-phase"><option value="">K1 + K2</option><option value="K1">K1 · Side-out</option><option value="K2">K2 · Break point</option></select></label>
 <label>Rally ganado por<select id="vc159-result"><option value="">Cualquiera</option><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label>
 </div>
 <div class="vc159-options"><label style="display:flex;align-items:center;gap:6px"><input id="vc159-only-timed" type="checkbox"> Solo referencias temporales disponibles</label></div>
 <div class="vc159-summary"><div class="vc159-stat"><b id="vc159-total">0</b><span>Resultados filtrados</span></div><div class="vc159-stat"><b id="vc159-timed">0</b><span>Con tiempo de vídeo</span></div><div class="vc159-stat"><b id="vc159-matches">0</b><span>Partidos incluidos</span></div></div>
 <div class="vc159-actions"><button class="primary" type="button" id="vc159-playlist">▶ Playlist del partido seleccionado</button><button type="button" id="vc159-clips">＋ Crear clips del partido</button><button type="button" id="vc159-export">Exportar selección CSV</button></div>
 <div id="vc159-status" class="vc159-note" role="status"></div><div id="vc159-list" class="vc159-list"></div><button type="button" id="vc159-more" hidden>Mostrar más</button>
 <p class="vc159-help">Los archivos MP4 locales no se transfieren entre dispositivos. Para reproducirlos tendrás que cargarlos en cada ordenador o móvil. En YouTube se guarda únicamente la referencia al intervalo: no se descarga vídeo. Las referencias temporales no equivalen a un clip multimedia exportado.</p>`;
 const timeline=$('scout-video-hub')?.querySelector('.v780-timeline-panel');if(timeline)timeline.insertAdjacentElement('beforebegin',panel);else host.appendChild(panel);
 panel.addEventListener('change',e=>{if(e.target.closest('select,input')){getControls();state.limit=150;render()}});
 panel.addEventListener('click',e=>{const play=e.target.closest('[data-vc159-play]'),clip=e.target.closest('[data-vc159-clip]');if(play){const row=state.rows[Number(play.dataset.vc159Play)];if(row)openRow(row);return}if(clip){const row=state.rows[Number(clip.dataset.vc159Clip)];if(row)createForRows([row]);return}});
 $('vc159-reset').onclick=()=>{Object.assign(state,{match:'all',team:'',kind:'action',skill:'',grade:'',player:'',rotation:'',phase:'',result:'',onlyTimed:false,limit:150});render()};
 $('vc159-playlist').onclick=playAll;$('vc159-clips').onclick=()=>createForRows(state.rows);$('vc159-export').onclick=exportCSV;
 $('vc159-more').onclick=()=>{state.limit+=150;render()};
 render();
}
function videoSwitch(m){window.v11Navigate?.('video');const sel=$('v780-match');if(!sel)return false;
 const switched=String(sel.value)!==String(m.id);if(switched){sel.value=String(m.id);window.v780MatchChanged?.()}else window.v780Open?.();
 return switched}
function openRow(r){videoSwitch(r.match);window.v780Select?.(r.key);const info=window.v780Diagnostics?.();const loaded=info?.videoLoaded&&String(info.match)===String(r.mid);
 if(!hasTime(r)){say('Abierto el partido. Esta acción todavía no tiene timestamp válido: carga el vídeo y sincronízalo desde Vídeo Review.');return false}
 if(!loaded){say(`Partido seleccionado. Carga el vídeo correspondiente a ${r.match.opponent||'este rival'}; después pulsa ▶ sobre la acción marcada en la lista de Vídeo Review.`);return false}
 const ok=!!window.v780PlayKey?.(r.key);say('Vídeo abierto. Puedes ajustar el intervalo o crear un clip desde la selección.');return ok}
function playAll(){const mid=state.match==='all'?'':state.match;const current=mid||String($('v780-match')?.value||activeId());const rows=state.rows.filter(r=>r.mid===current&&hasTime(r));if(!rows.length){say('Selecciona un partido concreto con acciones sincronizadas para reproducir una playlist.');return}
 const m=rows[0].match;videoSwitch(m);const diag=window.v780Diagnostics?.();if(!diag?.videoLoaded||String(diag.match)!==String(m.id)){say('Selecciona primero el archivo o YouTube de este partido en Vídeo Review. Después vuelve a iniciar la playlist.');return}
 const started=window.VC_V159_VIDEO_ENGINE?.playlist?.(rows.map(r=>r.key),'Selección estadística V15.9');say(started?`Playlist iniciada: ${rows.length} eventos del mismo partido.`:'No hay intervalos reproducibles en esta selección.')}
function createForRows(rows){const mid=rows.length===1?rows[0].mid:(state.match==='all'?'':state.match);const current=mid||String($('v780-match')?.value||activeId());const same=rows.filter(r=>r.mid===current&&r.kind==='action'&&hasTime(r));if(!same.length){say('Para crear clips, selecciona un único partido con acciones y timestamps disponibles.');return}if(same.length>100){say('Hay más de 100 acciones. Limita la selección por partido, jugador o fundamento para evitar generar demasiados clips de golpe.');return}
 const m=same[0].match;videoSwitch(m);const n=window.VC_V159_VIDEO_ENGINE?.clips?.(same.map(r=>r.key))||0;say(`${n} referencias de clip creadas para ${m.opponent||'el rival'}; los duplicados se omiten. Las referencias no contienen el archivo de vídeo.`)}
function exportCSV(){const records=state.rows;if(!records.length){say('No hay resultados para exportar.');return}
 const values=[['fecha','rival','partido_id','set','tipo','equipo','rotacion','fase','jugador','fundamento','valoracion','ganador','video_segundos','video_source','codigo']];for(const r of records){const phase=r.team==='opponent'?(r.serving==='ours'?'K1':'K2'):r.phaseOurs;values.push([r.match.date||'',r.match.opponent||'',r.mid,r.set,r.kind,r.team,r.team==='opponent'?r.opp:r.own,phase,r.player,r.skill,r.grade,r.winner,r.time??'',r.match.video?.source||'',r.label])}
 const csv='\ufeff'+values.map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='volley_coach_v15_9_video_estadisticas.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1300);say(`${records.length} resultados exportados.`)}
function open(opts={}){initPanel();if(!$('vc159-studio'))return false;const options={...opts};if(options.matchId!=null)options.match=String(options.matchId);const allowed=['match','team','kind','skill','grade','player','rotation','phase','result'];allowed.forEach(k=>{if(options[k]!=null)state[k]=String(options[k])});if(options.onlyTimed!=null)state.onlyTimed=!!options.onlyTimed;
 if(!state.match)state.match='all';window.v11Navigate?.('video');window.v780Open?.();render();$('vc159-studio')?.scrollIntoView?.({block:'start',behavior:'auto'});return true}
function openExact(mid,set,rid){const m=matches().find(m=>String(m.id)===String(mid));if(!m)return false;const s=arr(m.sets).find(x=>Number(x.number)===Number(set)),r=arr(s?.rallies).find(x=>String(x.id)===String(rid));if(!r)return false;open({matchId:m.id,kind:'rally',team:'',skill:'',grade:'',player:'',rotation:'',phase:'',result:''});const row=buildRows([m]).find(x=>x.key===`r:${set}:${rid}`);return row?openRow(row):false}
function injectLinks(){if(!$('vc159-studio'))initPanel();const season=$('v151-season-root');if(season&&!$('vc159-season-entry')){const div=document.createElement('div');div.className='vc159-entry';div.id='vc159-season-entry';div.innerHTML='<button type="button">▶ Pasar del análisis al vídeo</button><span>Filtra jugadoras, rotaciones y fundamentos y revisa las acciones en el partido original.</span>';div.querySelector('button').onclick=()=>open({kind:'action'});season.querySelector('.v151-tabs')?.insertAdjacentElement('afterend',div)}
 const bench=$('vc155-bench');if(bench&&!$('vc159-bench-entry')){const btn=document.createElement('button');btn.id='vc159-bench-entry';btn.type='button';btn.className='vc159-link';btn.textContent='▶ Jugadas del partido';btn.onclick=()=>open({matchId:$('vc155-match')?.value||activeId(),kind:'rally'});bench.querySelector('.vc155-head-actions')?.appendChild(btn)}
 const rival=$('v157-opponent');if(rival&&!$('vc159-rival-entry')){const div=document.createElement('div');div.id='vc159-rival-entry';div.className='vc159-entry';div.innerHTML='<button type="button">▶ Revisar vídeo del rival</button><span>Abre las acciones rivales y conserva la selección de partido desde Vídeo Review.</span>';div.querySelector('button').onclick=()=>open({match:'all',team:'opponent',kind:'action'});rival.querySelector('.v157-intro')?.insertAdjacentElement('afterend',div)}
}
function diagnostics(){return{version:VERSION,results:state.lastCount,withTime:state.rows.filter(hasTime).length,readOnly:true,cloudEngineUntouched:true,videoEngine:!!window.VC_V159_VIDEO_ENGINE}}
window.VC_V159_STATS_VIDEO={version:VERSION,open,openExact,render,buildRows,filtered,timeOf,diagnostics,filters:()=>({...state,rows:undefined})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initPanel();injectLinks()},{once:true});else{initPanel();injectLinks()}
const oldNav=window.v11Navigate;if(typeof oldNav==='function'&&!oldNav.__vc159){const wrapped=function(){const out=oldNav.apply(this,arguments);if(['video','season','bench'].includes(arguments[0]))setTimeout(()=>{injectLinks();if(arguments[0]==='video')render()},30);return out};wrapped.__vc159=true;window.v11Navigate=wrapped}
document.addEventListener('vc:matchstatechange',()=>{if($('scout-video-hub')?.classList.contains('active'))render()});
})();
