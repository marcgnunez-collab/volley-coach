/* Volley Coach V19.2.3 · Video Studio / scouting review bridge.
 * Reuses the canonical V7.8 player, original rally IDs and existing save path.
 */
(()=>{
'use strict';
if(window.VC_VIDEO_SCOUT_LINKS_1923)return;
const $=id=>document.getElementById(id);
const bridge=()=>window.VC_SCOUT_VIDEO_BRIDGE||{};
const api=()=>window.VC_VIDEO_REVIEW_API||{};
const current=()=>{const id=String($('v780-match')?.value||bridge().getActiveId?.()||'');return (bridge().getMatches?.()||[]).find(m=>String(m.id)===id)||null};
const view=$('scout-video-hub');const container=view?.querySelector('.v780-video-panel');
if(!container)return;
const section=document.createElement('section');section.id='vc1923-links';section.setAttribute('aria-label','Vínculos de scouting y vídeo');
section.innerHTML=`<div class="vc1923-head"><div><span>VIDEO STUDIO · V19.2.3</span><h3>Vídeo vinculado al scouting</h3></div><strong id="vc1923-health">Sin grabación</strong></div><p id="vc1923-detail" role="status">Selecciona el partido y abre su grabación para consultar rallies y acciones.</p><div class="vc1923-controls"><button type="button" id="vc1923-last">Reproducir último rally</button><button type="button" id="vc1923-action">Última acción</button><button type="button" id="vc1923-recordings">Buscar grabación</button><button type="button" id="vc1923-refresh">Actualizar vínculos</button></div><small id="vc1923-note">Los enlaces son referencias temporales; el vídeo permanece en el dispositivo donde se grabó. Para archivos externos, utiliza el asistente de sincronización.</small>`;
container.insertBefore(section,container.querySelector('.v780-sync-panel')||container.firstChild);
function visibleRows(){return api().timeline?.()||[];}
function lastKey(kind){const rows=visibleRows();for(let i=rows.length-1;i>=0;i--){if(rows[i].type===kind&&api().rangeForRow?.(rows[i]))return rows[i].key;}return null;}
function play(kind){const key=lastKey(kind);if(!key){message('No hay '+(kind==='rally'?'rallies':'acciones')+' con referencia válida en la fuente actual. Abre una grabación o sincroniza el archivo.');return;}if(!api().loaded?.()){message('El tiempo está calculado, pero debes cargar la grabación en este dispositivo.');return;}window.v780Select?.(key);window.v780PlayKey?.(key);}
function message(t){$('vc1923-detail').textContent=t;}
function render(){
 const match=current(),diag=window.v780Diagnostics?.()||{},rows=visibleRows();
 const playable=rows.filter(r=>!!api().rangeForRow?.(r));
 const rallies=playable.filter(r=>r.type==='rally').length,actions=playable.filter(r=>r.type==='action').length;
 const orphaned=window.VC_VIDEO_TIMELINE_1923?.staleClips?.(match).length||0;
 const mode=diag.recording?'Grabación REC':diag.mediaType==='youtube'?'YouTube':diag.videoLoaded?'Archivo local':'Sin vídeo cargado';
 $('vc1923-health').textContent=diag.videoLoaded?`${rallies} rallies · ${actions} acciones`:'Vídeo pendiente';
 message(`${mode} · ${rallies} rallies y ${actions} acciones vinculados${orphaned?` · ${orphaned} clips guardados con acciones eliminadas o modificadas`:''}.`);
 $('vc1923-last').disabled=!rallies;
 $('vc1923-action').disabled=!actions;
}
$('vc1923-last').onclick=()=>play('rally');$('vc1923-action').onclick=()=>play('action');
$('vc1923-recordings').onclick=()=>window.v780OpenRecordingPicker?.();
$('vc1923-refresh').onclick=()=>{window.v780Render?.();render()};
const oldOpen=window.v780Open;window.v780Open=function(...args){const out=oldOpen?.apply(this,args);render();return out};
const oldChanged=window.v780MatchChanged;window.v780MatchChanged=function(...args){const out=oldChanged?.apply(this,args);render();return out};
const oldRender=window.v780Render;window.v780Render=function(...args){const out=oldRender?.apply(this,args);render();return out};
const video=$('v780-player-video');video?.addEventListener('loadedmetadata',render);
// The returned key always comes from the live/canonical rally tree: undo and
// corrections cannot revive a deleted timecode from a secondary index.
window.VC_VIDEO_SCOUT_LINKS_1923={version:'19.2.3',refresh:render,lastKey,play,diagnostics:()=>({matchId:current()?.id||null,recording:window.v780Diagnostics?.().recording||null,rallies:visibleRows().filter(r=>r.type==='rally'&&api().rangeForRow?.(r)).length,staleClips:window.VC_VIDEO_TIMELINE_1923?.staleClips?.(current()).length||0})};
render();
})();
