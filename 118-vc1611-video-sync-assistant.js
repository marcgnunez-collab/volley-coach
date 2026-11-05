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
