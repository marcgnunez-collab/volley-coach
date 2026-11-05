(()=>{
'use strict';
/* Smart Video V16.1.0. Uses V7.8's ONLY video player and canonical scouting timeline.
   No camera/MediaRecorder, score, rally or sync writes; only the explicit Save Clip action persists. */
if(window.VC_SMART_VIDEO_CORE)return;
const $=id=>document.getElementById(id);
const hub=$('scout-video-hub'),videoPanel=hub?.querySelector('.v780-video-panel');
if(!hub||!videoPanel)return;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=n=>(n===null||n===undefined||n==='')?null:(Number.isFinite(Number(n))?Number(n):null);
const api=()=>window.VC_VIDEO_REVIEW_API||{};
const clips=()=>window.VC_SCOUT_CLIPS_PRO||{};
const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||{};
const matches=()=>{try{return bridge().getMatches?.()||[]}catch(_){return []}};
const match=()=>{const id=String($('v780-match')?.value||bridge().getActiveId?.()||'');return matches().find(x=>String(x.id)===id)||null};
const rows=()=>{try{return api().timeline?.()||[]}catch(_){return []}};
const rangeOf=rowOrKey=>{try{return typeof rowOrKey==='object'?clips().rangeForRow?.(rowOrKey)||null:clips().rangeForKey?.(rowOrKey)||null}catch(_){return null}};
const status=(s,bad=false)=>{const el=$('vc1610-status');if(el){el.textContent=s;el.dataset.error=bad?'1':'0'}};
const settingsKey='volleyCoachSmartVideoWindowV1610';
let initial={};try{initial=JSON.parse(localStorage.getItem(settingsKey)||'{}')||{}}catch(_){ }
const state={pre:clamp(finite(initial.pre)??8,0,30),post:clamp(finite(initial.post)??5,1,30),selected:'',lastSig:'',lastRows:[],eligible:new Set(),previewCount:0,playCount:0};
const timeFmt=t=>{if(!Number.isFinite(Number(t)))return '—';t=Math.max(0,Number(t));return `${Math.floor(t/3600)?String(Math.floor(t/3600)).padStart(2,'0')+':':''}${String(Math.floor(t%3600/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`};
function actionRow(row){return row?.type==='action'&&row.a}
function classify(row){
 if(row.type==='rally')return 'rally';
 if(row.skill==='S')return 'serve';if(row.skill==='R')return 'receive';
 if(row.skill==='A')return 'attack';if(row.skill==='B')return 'block';
 if(row.skill==='D')return 'defend';return 'other';
}
const panel=document.createElement('section');panel.id='vc1610-smart-panel';panel.setAttribute('aria-label','Smart Video · Accesos a jugadas');
panel.innerHTML=`
 <div class="vc1610-head"><div><span class="vc1610-kicker">SMART VIDEO · V16.1.0</span><h3>Jugada directa</h3><p>Busca una acción y abre su tramo en el reproductor actual.</p></div><span class="vc1610-count" id="vc1610-count">—</span></div>
 <div class="vc1610-shortcuts">
  <button type="button" data-vc1610="rally">▶ Último rally</button>
  <button type="button" data-vc1610="action">▶ Última acción</button>
  <button type="button" data-vc1610="error">▶ Último error</button>
  <button type="button" data-vc1610="opponent">▶ Punto rival</button>
 </div>
 <div class="vc1610-options">
  <div class="vc1610-window"><label for="vc1610-pre">Segundos antes</label><select id="vc1610-pre"><option value="3">3 s</option><option value="5">5 s</option><option value="8">8 s</option><option value="10">10 s</option><option value="15">15 s</option><option value="20">20 s</option></select></div>
  <div class="vc1610-window"><label for="vc1610-post">Segundos después</label><select id="vc1610-post"><option value="3">3 s</option><option value="5">5 s</option><option value="8">8 s</option><option value="10">10 s</option><option value="15">15 s</option></select></div>
  <button id="vc1610-save" type="button">＋ Guardar clip seleccionado</button>
 </div>
 <p class="vc1610-status" id="vc1610-status" role="status" aria-live="polite">Selecciona una jugada o pulsa un acceso rápido.</p>
 <div class="vc1610-legend" aria-label="Colores de las marcas de la línea temporal"><span><i class="serve"></i>Saque</span><span><i class="receive"></i>Recepción</span><span><i class="attack"></i>Ataque</span><span><i class="block"></i>Bloqueo</span><span><i class="defend"></i>Defensa</span><span><i class="rally"></i>Rally</span></div>`;
const ruler=videoPanel.querySelector('.v780-ruler-wrap');
if(ruler)ruler.parentNode.insertBefore(panel,ruler);else videoPanel.appendChild(panel);
for(const [name,val] of [['pre',state.pre],['post',state.post]]){const sel=$('vc1610-'+name);if(sel){sel.value=String(val);sel.addEventListener('change',()=>{state[name]=clamp(Number(sel.value),name==='pre'?0:1,30);try{localStorage.setItem(settingsKey,JSON.stringify({pre:state.pre,post:state.post}))}catch(_){}status(`Intervalo: −${state.pre} s / +${state.post} s`)})}}
function loaded(){const m=match(),d=window.v780Diagnostics?.()||{};return !!m&&!!d.videoLoaded&&String(d.match)===String(m.id)}
function cachedRows(force=false){
 const m=match(), sig=m?`${m.id}/${m.updatedAt??''}/${m.currentSet??''}/${m.liveRally?.actions?.length??0}`:'';
 if(force||sig!==state.lastSig){state.lastRows=rows();state.eligible=new Set(state.lastRows.filter(r=>!!rangeOf(r)).map(r=>String(r.key)));state.lastSig=sig;state.previewCount++}
 return state.lastRows;
}
function refresh(force=false){
 const r=cachedRows(force),withVideo=state.eligible.size;
 const count=$('vc1610-count');if(count)count.textContent=`${withVideo} referencias`;
 const predicates={
  rally:r=>r.type==='rally',action:actionRow,
  error:r=>actionRow(r)&&r.team==='ours'&&(r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/')),
  opponent:r=>r.type==='rally'&&r.winner==='opponent'
 };
 for(const [name,pred] of Object.entries(predicates)){
  const btn=panel.querySelector(`[data-vc1610="${name}"]`);
  if(!btn)continue;
  btn.disabled=!r.some(row=>pred(row)&&state.eligible.has(String(row.key)));
 }
 return r;
}
function last(kind){
 const candidates=refresh();const pred={rally:r=>r.type==='rally',action:actionRow,error:r=>actionRow(r)&&r.team==='ours'&&(r.evaluation==='='||(r.skill==='A'&&r.evaluation==='/')),opponent:r=>r.type==='rally'&&r.winner==='opponent'}[kind];
 if(!pred)return null;
 for(let i=candidates.length-1;i>=0;i--){const r=candidates[i];if(pred(r)&&state.eligible.has(String(r.key)))return r}
 return null;
}
function playKey(key){
 const r=cachedRows().find(x=>String(x.key)===String(key)),tr=rangeOf(key);
 if(!r||!tr){status('Esta acción no tiene tiempo de vídeo válido. Sincroniza el partido.',true);return false}
 state.selected=String(key);
 window.v780Select?.(String(key));
 if(!loaded()){status('Jugada seleccionada. Abre el archivo, la grabación o YouTube correspondiente para reproducirla.',true);return false}
 const isAction=r.type==='action';
 const start=isAction?tr.center:tr.start;
 const opts=isAction?{pre:state.pre,post:state.post}:{pre:0,post:Math.max(.2,tr.end-tr.start)};
 const ok=window.v780OpenAt?.(start,String(key),opts);
 if(ok===false){status('El reproductor no ha podido abrir la jugada.',true);return false}
 state.playCount++;
 status(`${r.label} · ${timeFmt(Math.max(0,start-opts.pre))} → ${timeFmt(start+opts.post)}`);return true;
}
function playLast(kind){const r=last(kind);if(!r){status('No hay una jugada con tiempo de vídeo para este acceso.',true);return false}return playKey(r.key)}
function saveSelected(){
 const selected=hub.querySelector('#v780-timeline .v780-row.selected')?.dataset.key||state.selected;
 const row=cachedRows(true).find(x=>String(x.key)===String(selected));
 if(!row){status('Selecciona antes una acción en la lista de jugadas.',true);return false}
 if(!actionRow(row)){status('El clip configurable requiere una acción. Para guardar rallies completos usa el catálogo de clips.',true);return false}
 const ok=clips().createWindowForKey?.(row.key,state.pre,state.post);
 if(ok===true){status(`Referencia guardada · −${state.pre} / +${state.post} s`);return true}
 status('No se ha podido guardar. Comprueba la marca temporal o si el clip ya existe.',true);return false;
}
panel.addEventListener('click',event=>{const b=event.target?.closest?.('[data-vc1610]');if(b)playLast(b.dataset.vc1610)});
$('vc1610-save')?.addEventListener('click',saveSelected);
// One-click playback of the existing canonical timeline. No replacement timeline or second video element.
$('v780-timeline')?.addEventListener('click',e=>{
 if(e.target.closest('button,a,input,select'))return;
 const row=e.target.closest('.v780-row[data-key]');if(row)playKey(row.dataset.key);
});
// Ruler markers are already interactive; make skill colours legible, without creating extra markers.
const gallery=$('v780-ruler');gallery?.setAttribute('aria-label','Línea temporal: pulsa una marca para reproducir su jugada');
const oldMatchChange=window.v780MatchChanged;
if(typeof oldMatchChange==='function')window.v780MatchChanged=function(...args){state.selected='';state.lastSig='';const ret=oldMatchChange.apply(this,args);refresh(true);return ret};
const oldRender=window.v780Render;
if(typeof oldRender==='function')window.v780Render=function(...args){const ret=oldRender.apply(this,args);refresh();return ret};
// Entry from theater into this ONE analysis workspace; never move or clone its media element.
const controls=$('vc55-video-controls')||$('v112-video-drawer')?.querySelector('.v112-video-card .v800-card-head');
if(controls&&!$('vc1610-open-analysis')){
 const open=document.createElement('button');open.id='vc1610-open-analysis';open.type='button';open.textContent='Smart Video';open.title='Abrir Análisis de vídeo y sus jugadas';
 open.addEventListener('click',()=>{try{window.v11Navigate?.('video')}catch(_){}window.vc58SetVideoTab?.('analysis');window.v780Open?.();refresh(true)});
 controls.appendChild(open);
}
window.VC_SMART_VIDEO_CORE={version:'16.1.0',playKey,playLast,refresh,saveSelected,setWindow(pre,post){state.pre=clamp(Number(pre)||0,0,30);state.post=clamp(Number(post)||5,1,30);$('vc1610-pre').value=String(state.pre);$('vc1610-post').value=String(state.post)},diagnostics:()=>({version:'16.1.0',matchId:match()?.id||null,videoLoaded:loaded(),references:$('vc1610-count')?.textContent||'',pre:state.pre,post:state.post,plays:state.playCount,timelineRenders:state.previewCount})};
refresh(true);
})();
