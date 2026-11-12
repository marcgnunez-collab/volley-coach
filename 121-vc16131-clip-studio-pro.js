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
