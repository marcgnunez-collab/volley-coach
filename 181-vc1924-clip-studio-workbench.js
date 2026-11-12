/* Volley Coach V19.2.4 · Clip Studio workbench.
 * Presentation/controller over the canonical VC_SCOUT_CLIPS_PRO catalogue and
 * existing per-match VC_16131_CLIP_STUDIO playlists. No separate video store.
 */
(()=>{
'use strict';
if(window.VC_1924_CLIP_STUDIO)return;
const $=id=>document.getElementById(id);
const root=$('scout-video-hub'),panel=$('vc-clip33');
const catalog=()=>window.VC_SCOUT_CLIPS_PRO||{};
const playlists=()=>window.VC_16131_CLIP_STUDIO||{};
if(!root||!panel||!$('vc-clip33-list'))return;
const state={pane:'catalog',matchId:'',lastCount:-1};
const mk=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
const button=(label,fn,cls='')=>{const n=mk('button',cls,label);n.type='button';n.addEventListener('click',fn);return n};
const items=()=>catalog().available?.()||[];
const match=()=>String(catalog().diagnostics?.()?.matchId??'');
// The playlist module used to be rendered after the clip panel, where the
// V18.3 Clip screen rules hid it. Move the original DOM, never clone its editor.
const cataloguePane=mk('div','vc1924-catalogue');cataloguePane.id='vc1924-catalogue';
const head=panel.querySelector('.vc-clip33-head');
[...panel.children].filter(node=>node!==head).forEach(node=>cataloguePane.appendChild(node));
const tabs=mk('nav','vc1924-tabs');tabs.setAttribute('aria-label','Herramientas de Clip Studio');
const catalogButton=button('Catálogo y recortes',()=>switchPane('catalog'));
const playlistButton=button('Playlists tácticas',()=>switchPane('playlist'));
catalogButton.id='vc1924-catalog-button';playlistButton.id='vc1924-playlist-button';
tabs.append(catalogButton,playlistButton);
panel.append(tabs,cataloguePane);
const playlistPane=$('vc16131-studio');
if(playlistPane){panel.appendChild(playlistPane);playlistPane.classList.add('vc1924-playlist-pane')}
else{const warning=mk('p','vc1924-warning','Las playlists antiguas no han cargado. El catálogo sigue disponible.');warning.id='vc1924-playlist-warning';panel.append(warning)}
function switchPane(which){
 state.pane=which==='playlist'?'playlist':'catalog';panel.dataset.vc1924Pane=state.pane;
 catalogButton.setAttribute('aria-selected',String(state.pane==='catalog'));
 playlistButton.setAttribute('aria-selected',String(state.pane==='playlist'));
 playlistButton.disabled=!playlistPane;
 if(state.pane==='playlist')playlists().refresh?.();else catalog().refresh?.();
}
// Filter values are drawn from canonical clip references; no independent index.
const adv=mk('div','vc1924-filters');adv.id='vc1924-filters';
const defs=[['vc1924-skill','Fundamento'],['vc1924-player','Jugador/a'],['vc1924-set','Set'],['vc1924-eval','Valoración']];
for(const [id,label] of defs){
 const wrap=mk('label','',label),sel=mk('select');sel.id=id;sel.append(new Option('Todos',''));sel.addEventListener('change',()=>catalog().refresh?.());wrap.append(sel);adv.append(wrap);
}
const originalFilters=cataloguePane.querySelector('.vc-clip33-filters');
if(originalFilters)originalFilters.insertAdjacentElement('afterend',adv);
const selection=mk('div','vc1924-bulk');selection.id='vc1924-bulk';
const status=mk('span','vc1924-selection-text','0 seleccionados');status.id='vc1924-selection-text';
selection.append(status,
 button('Guardar automáticos',()=>{const ids=selected(),n=catalog().saveVirtualBatch?.(ids)||0;catalog().clearSelection?.();message(n?`${n} referencias guardadas.`:'No hay referencias automáticas seleccionadas.',!n)}),
 button('Añadir a playlist',()=>{
  const chosen=new Set(selected()),catalogue=items();
  const keys=catalogue.filter(c=>chosen.has(String(c.id))).map(c=>c.virtual&&c.sourceKey?'a:'+String(c.sourceKey):'c:'+String(c.id));
  const added=playlists().addEntries?.(keys)||0;
  if(added){catalog().clearSelection?.();message(`${added} jugadas incorporadas a la playlist.`)}
  else{switchPane('playlist');message('Crea o selecciona una playlist y vuelve al catálogo para añadir jugadas.',true)}
 }),
 button('Eliminar guardados',()=>{
  const ids=new Set(selected());const saved=items().filter(c=>ids.has(String(c.id))&&!c.virtual);
  if(!saved.length){message('No hay clips guardados seleccionados.',true);return}
  if(!window.confirm(`¿Eliminar ${saved.length} referencias guardadas? Las grabaciones originales no se borrarán.`))return;
  const n=catalog().removeSavedBatch?.(saved.map(c=>c.id))||0;
  if(n){catalog().clearSelection?.();message(`${n} referencias eliminadas. La grabación continúa intacta.`)}
  else message('No se pudo completar la operación.',true);
 }),
 button('Deseleccionar',()=>catalog().clearSelection?.()));
const toolbar=cataloguePane.querySelector('.vc-clip33-toolbar');
if(toolbar)toolbar.insertAdjacentElement('afterend',selection);
const exportJSON=button('↓ Catálogo JSON',()=>catalog().exportJSON?.());
exportJSON.id='vc1924-json';toolbar?.append(exportJSON);
function selected(){return catalog().selectedIds?.()||[]}
function message(text,error=false){const el=$('vc-clip33-status');if(el){el.textContent=text;el.dataset.bad=error?'1':'0'}}
function updateSelects(){
 const data=items();const inMatch=match();
 if(inMatch!==state.matchId){state.matchId=inMatch;for(const [id] of defs)if($(id))$(id).value=''}
 for(const [id,label] of defs){const el=$(id);if(!el)continue;const attr=id==='vc1924-skill'?'skill':id==='vc1924-player'?'player':id==='vc1924-set'?'set':'evaluation';
  const values=[...new Set(data.map(c=>String(c[attr]??'').trim()).filter(Boolean))].sort((a,b)=>id==='vc1924-set'?(Number(a)-Number(b)):a.localeCompare(b,'es',{numeric:true}));
  const previous=el.value;el.replaceChildren(new Option('Todos',''));
  for(const value of values)el.add(new Option(id==='vc1924-set'?'Set '+value:value,value));
  el.value=values.includes(previous)?previous:'';
 }
}
function updateSelection(){const all=items();const live=new Set(all.map(x=>String(x.id)));const ids=selected().filter(x=>live.has(x));
 status.textContent=`${ids.length} seleccionada${ids.length===1?'':'s'}`;
 // Selection only applies to this match; the core clears it on match change.
}
let queued=false;
function sync(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;updateSelects();updateSelection()})}
document.addEventListener('vc1924:render',sync);
document.addEventListener('vc1924:selection',updateSelection);
$('v780-match')?.addEventListener('change',()=>{state.matchId='';catalog().clearSelection?.();sync()});
// Single native edit dialog; only saved metadata is editable, not source action IDs.
const backdrop=mk('div','vc1924-dialog');backdrop.id='vc1924-dialog';backdrop.hidden=true;
const form=mk('form','vc1924-dialog-card');form.innerHTML=`<h3>Editar clip guardado</h3><p>Modifica la referencia; no se recorta ni se cambia el vídeo original.</p>
<label>Nombre<input name="name" maxlength="120" required></label>
<label>Etiqueta<select name="tag"><option value="general">General</option><option value="technical">Técnica</option><option value="opponent">Rival</option><option value="highlight">Destacado</option><option value="training">Entrenamiento</option></select></label>
<label>Notas<textarea name="note" maxlength="500" rows="3"></textarea></label>
<div class="vc1924-dialog-actions"><button type="button" id="vc1924-cancel">Cancelar</button><button type="submit" class="vc1924-primary">Guardar</button></div>`;
backdrop.append(form);document.body.append(backdrop);
let editingId=null;const editName=form.elements.namedItem('name'),editTag=form.elements.namedItem('tag'),editNote=form.elements.namedItem('note');
function close(){backdrop.hidden=true;editingId=null;}
$('vc1924-cancel').addEventListener('click',close);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});
backdrop.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
form.addEventListener('submit',e=>{e.preventDefault();if(!editingId)return;
 const ok=catalog().updateSaved?.(editingId,{name:editName.value,tag:editTag.value,note:editNote.value});
 if(ok){close();message('Clip actualizado y guardado en el partido.')}else message('No se ha podido guardar el clip.',true);
});
function edit(id){const c=catalog().list?.().find(x=>String(x.id)===String(id));if(!c){message('La referencia ya no existe en este partido.',true);return false}
 editingId=String(id);editName.value=c.name||'';editNote.value=c.note||'';editTag.value=[...editTag.options].some(o=>o.value===c.tag)?c.tag:'general';
 backdrop.hidden=false;editName.focus();return true;
}
window.VC_1924_CLIP_STUDIO={version:'19.2.4',edit,switchPane,refresh:sync,diagnostics:()=>({matchId:match(),pane:state.pane,selection:selected().length,playlists:playlists().list?.().length||0,catalogue:items().length})};
switchPane('catalog');sync();
})();
