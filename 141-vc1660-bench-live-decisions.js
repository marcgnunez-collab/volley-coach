/* Volley Coach V16.6.0 · Bench Live Decision Center.
 * Only reads canonical matches and diagnostics. Uses existing Video Analytics
 * for an explicit action opening; never writes scouting, Supabase or clips. */
(function (root) {
  'use strict';
  const arr = value => Array.isArray(value) ? value : [];
  const finished = rally => rally && (rally.winner === 'ours' || rally.winner === 'opponent');
  const rate = (wins,total) => total ? Math.round(100 * wins / total) + '%' : '—';
  const validWindow = value => [5,10,15].includes(Number(value)) ? Number(value) : 10;
  const aggregate = rallies => ({total:rallies.length,wins:rallies.filter(r=>r.winner==='ours').length});
  function pulse(match, windowSize=10) {
    const sets=arr(match?.sets);
    const current=sets.find(s=>Number(s.number)===Number(match?.currentSet))||sets.at(-1)||null;
    const all=arr(current?.rallies).filter(finished);
    const recent=all.slice(-validWindow(windowSize));
    const phase=(rows,serving)=>aggregate(rows.filter(r=>r.servingBefore===serving));
    const recentResult=aggregate(recent),setResult=aggregate(all);
    const k1=phase(recent,'opponent'),k2=phase(recent,'ours');
    const allK1=phase(all,'opponent'),allK2=phase(all,'ours');
    let streak=0,who='';
    for(let i=all.length-1;i>=0;i--){if(!who)who=all[i].winner;if(all[i].winner!==who)break;streak++}
    const rotation=Number(match?.rotationNo)||1;
    const rotationRows=all.filter(r=>Number(r.rotationBefore)===rotation&&r.servingBefore==='opponent');
    const rotationK1=aggregate(rotationRows);
    const unknown=recent.length-k1.total-k2.total;
    return {current,all,recent,window:validWindow(windowSize),setResult,recentResult,k1,k2,allK1,allK2,rotation,rotationK1,unknown,streak,who,
      recentPct:rate(recentResult.wins,recentResult.total),setPct:rate(setResult.wins,setResult.total),k1Pct:rate(k1.wins,k1.total),k2Pct:rate(k2.wins,k2.total)};
  }
  function cues(p) {
    if(!p?.recent.length)return [{kind:'neutral',title:'Sin rallies cerrados',detail:'El pulso aparece cuando se cierran jugadas.'}];
    const result=[];
    if(p.streak>=3&&p.who==='opponent')result.push({kind:'warn',title:`Rival: ${p.streak} puntos seguidos`,detail:'Revisa el patrón y la rotación. No se propone una sustitución automática.'});
    if(p.k1.total>=5&&p.k1.wins/p.k1.total<.4)result.push({kind:'warn',title:`K1 reciente: ${p.k1Pct}`,detail:`${p.k1.wins}/${p.k1.total} rallies en recepción. Comparar con el set completo (${p.allK1.wins}/${p.allK1.total}).`});
    if(p.k2.total>=5&&p.k2.wins/p.k2.total<.4)result.push({kind:'warn',title:`K2 reciente: ${p.k2Pct}`,detail:`${p.k2.wins}/${p.k2.total} rallies al saque. Contrastar con los rivales y la muestra.`});
    if(p.rotationK1.total>=5&&p.rotationK1.wins/p.rotationK1.total<.4)result.push({kind:'watch',title:`R${p.rotation} bajo en recepción`,detail:`Side-out ${p.rotationK1.wins}/${p.rotationK1.total} en el set. Analiza vídeo antes de decidir.`});
    if(p.unknown)result.push({kind:'neutral',title:'Fase sin identificar',detail:`${p.unknown} rally(s) sin servidor previo reconocido; no forman parte de K1/K2.`});
    if(!result.length)result.push({kind:'neutral',title:p.recent.length<5?'Muestra todavía pequeña':'Sin señales por umbral',detail:`Últimos ${p.recentResult.total} rallies: ${p.recentResult.wins} ganados. Indicadores descriptivos, no predicciones.`});
    return result;
  }
  function rallyKeys(set,rally){
    const sn=String(set?.number??'');
    const rid=String(rally?.id??'');
    if(!sn||!rid)return [];
    return arr(rally.actions).filter(a=>a&&a.id!==null&&a.id!==undefined&&String(a.id)!=='').map(a=>`a:${sn}:${rid}:${a.id}`);
  }
  function freshness(match,diag,cloud,online=true,now=Date.now()){
    if(!online)return {kind:'warn',summary:'Sin conexión · lectura local',details:'Los cambios de otros dispositivos no se han confirmado aquí.'};
    const stamps=[];
    for(const [label,value] of [['Partido local',match?.updatedAt],['Última lectura de nube',cloud?.lastReadAt]]){
      const ts=Date.parse(String(value||''));
      if(Number.isFinite(ts)&&ts>0&&ts<=now+120000){const age=Math.floor(Math.max(0,now-ts)/60000);stamps.push(`${label}: ${age<1?'hace menos de 1 min':`hace ${age} min`}`)}
    }
    const subscribed=diag?.realtimeState==='SUBSCRIBED';
    return {kind:subscribed?'ok':'neutral',summary:subscribed?'Canal Realtime conectado · datos locales':'Nube no confirmada · datos locales',
      details:(stamps.length?stamps.join(' · '):'Sin marcas horarias confirmadas')+'. La presencia de dispositivos no demuestra que este partido esté actualizado.'};
  }
  const api={version:'16.6.0',pulse,cues,rallyKeys,freshness};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root?.document)return;
  if(root.VC_BENCH_LIVE_1660)return;
  const $=id=>root.document.getElementById(id);
  const bridge=()=>root.VC_SCOUT_VIDEO_BRIDGE;
  let lastSignature='',visibleRows=[],windowSize=10,initialized=false,lastError='';
  function selected(){const matchId=String($('vc155-match')?.value||'');const matches=arr(bridge()?.getMatches?.());return matches.find(m=>String(m.id)===matchId)||matches.find(m=>String(m.id)===String(bridge()?.getActiveId?.()))||null}
  function el(tag,className,text){const e=root.document.createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=String(text);return e}
  function metric(label,big,details){const node=el('div','vc1660-metric');node.append(el('small','',label),el('strong','',big),el('span','',details));return node}
  function render(force=false){
    const panel=$('vc1660-bench');if(!panel||!$('vc155-bench')?.classList.contains('active')||root.document.hidden)return;
    const m=selected();
    if(!m){panel.hidden=true;lastSignature='';return}panel.hidden=false;
    const p=pulse(m,windowSize),diag=root.VC_DEVICE_SYNC?.diagnostics?.()||{},cloud=root.VC_V962_CLOUD_EFFICIENT?.diagnostics?.()||{};
    const fr=freshness(m,diag,cloud,root.navigator?.onLine!==false);
    const signature=JSON.stringify([String(bridge()?.getTeamId?.()||''),m.id,m.updatedAt,m.currentSet,m.rotationNo,windowSize,Math.floor(Date.now()/60000),cloud.lastReadAt,root.navigator?.onLine,p.all.map(r=>[r.id,r.winner,r.servingBefore,r.rotationBefore,arr(r.actions).map(a=>a.id).join(',')]),fr.kind,fr.summary]);
    if(!force&&signature===lastSignature)return;
    lastSignature=signature;
    $('vc1660-state').textContent=fr.summary;$('vc1660-state').dataset.kind=fr.kind;
    $('vc1660-freshness').textContent=fr.details;
    $('vc1660-period').textContent=`Set ${p.current?.number||m.currentSet||'—'} · últimos ${p.recentResult.total} de ${p.setResult.total} rallies cerrados`;
    const metrics=$('vc1660-metrics');metrics.replaceChildren(
      metric('Ganados · ventana',p.recentPct,`${p.recentResult.wins}/${p.recentResult.total} · set ${p.setPct} (${p.setResult.wins}/${p.setResult.total})`),
      metric('K1 · recepción',p.k1Pct,`${p.k1.wins}/${p.k1.total} · set ${rate(p.allK1.wins,p.allK1.total)} (${p.allK1.wins}/${p.allK1.total})`),
      metric('K2 · saque',p.k2Pct,`${p.k2.wins}/${p.k2.total} · set ${rate(p.allK2.wins,p.allK2.total)} (${p.allK2.wins}/${p.allK2.total})`),
      metric('Side-out rotación R'+p.rotation,rate(p.rotationK1.wins,p.rotationK1.total),`${p.rotationK1.wins}/${p.rotationK1.total} · set actual`)
    );
    const alerts=$('vc1660-cues');alerts.replaceChildren();for(const item of cues(p)){
      const div=el('article','vc1660-cue vc1660-'+item.kind);div.append(el('b','',item.title),el('small','',item.detail));alerts.appendChild(div)}
    const timeline=$('vc1660-timeline');timeline.replaceChildren();visibleRows=p.recent.slice().reverse().map(r=>({set:p.current,r}));
    if(!visibleRows.length)timeline.append(el('p','vc1660-empty','Sin jugadas cerradas en el set seleccionado.'));
    visibleRows.forEach(({set,r},i)=>{const row=el('div','vc1660-rally '+(r.winner==='ours'?'vc1660-win':'vc1660-loss'));
      const point=`${r.scoreAfter?.us??'—'}–${r.scoreAfter?.opponent??'—'}`;
      const label=el('div','vc1660-rally-info');label.append(el('strong','',`${point} · ${r.winner==='ours'?'Punto nuestro':'Punto rival'}`),el('small','',`R${r.rotationBefore||'—'} · ${r.servingBefore==='opponent'?'K1':r.servingBefore==='ours'?'K2':'fase sin registrar'} · ${arr(r.actions).length} acciones`));row.append(label);
      const keys=rallyKeys(set,r);const button=el('button','vc1660-review','Ver acciones / vídeo');button.type='button';button.dataset.vc1660Index=String(i);button.disabled=!keys.length||root.document.body.classList.contains('v158-view-only');button.setAttribute('aria-label',`Revisar ${point} en Video Analytics`);row.append(button);timeline.appendChild(row)})
    $('vc1660-note').textContent=p.recentResult.total<5?'Muestra preliminar: menos de cinco rallies cerrados.':'Comparación descriptiva: la ventana reciente forma parte del total del set; no son grupos independientes.';
  }
  function review(index){
    if(root.document.body.classList.contains('v158-view-only'))return false;
    const {set,r}=visibleRows[index]||{},m=selected();if(!m||!r)return false;
    const keys=rallyKeys(set,r);if(!keys.length){$('vc1660-action-status').textContent='La jugada no tiene acciones codificadas para revisar.';return false}
    if(typeof root.VC_VIDEO_ANALYTICS_1612?.openKeys!=='function'){$('vc1660-action-status').textContent='Video Analytics no está disponible.';return false}
    const ok=root.VC_VIDEO_ANALYTICS_1612.openKeys(m.id,keys);
    $('vc1660-action-status').textContent=ok?'Acciones abiertas en Video Studio. Carga el archivo o el vídeo correspondiente si es necesario.':'No se pudieron abrir las acciones. Comprueba la selección del partido.';
    return !!ok;
  }
  function install(){if(initialized)return false;const bench=$('vc155-bench'),main=$('vc155-main'),kpis=main?.querySelector('.vc155-kpis');if(!bench||!main||!kpis)return false;initialized=true;
    const style=el('style');style.id='vc1660-bench-style';style.textContent=`
#vc155-bench #vc1660-bench{background:#fff;border:1px solid #cbdce8;border-radius:15px;padding:17px;display:grid;gap:13px;box-shadow:0 6px 18px #1b385610;min-width:0}
#vc1660-bench[hidden]{display:none!important}#vc1660-bench .vc1660-head{display:flex;align-items:start;justify-content:space-between;gap:10px;flex-wrap:wrap}
#vc1660-bench .vc1660-head small{font-size:10px;font-weight:850;color:#3882ad;letter-spacing:.08em}
#vc1660-bench h3{font-size:19px!important;color:#173e59!important;border:0!important;padding:0!important;margin:4px 0!important}
#vc1660-bench p{font-size:11px;color:#607c8f;margin:0;line-height:1.55}
#vc1660-bench label{font-size:10px;color:#486b80;display:grid;gap:4px;font-weight:800}
#vc1660-bench select{font-size:12px;padding:7px 10px;min-height:37px;border:1px solid #c6d7e1;border-radius:8px;background:#f5f9fc;color:#15415e}
#vc1660-bench #vc1660-state{display:inline-block;font-size:10px;font-weight:850;padding:6px 9px;border-radius:12px;color:#6a7b8c;background:#f1f4f7}
#vc1660-bench #vc1660-state[data-kind=ok]{background:#edf8f1;color:#166e4e}#vc1660-bench #vc1660-state[data-kind=warn]{background:#fff3e7;color:#875a1b}
#vc1660-bench .vc1660-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
#vc1660-bench .vc1660-metric{min-width:0;border:1px solid #deebf2;background:#f7fbfe;border-radius:11px;padding:13px;display:grid;gap:7px}
#vc1660-bench .vc1660-metric small{font-size:10px;color:#668092;font-weight:850}#vc1660-bench .vc1660-metric strong{font-size:27px;color:#145786;font-variant-numeric:tabular-nums}
#vc1660-bench .vc1660-metric span{font-size:10px;color:#587788;line-height:1.35}
#vc1660-bench .vc1660-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:11px}
#vc1660-bench .vc1660-box{border:1px solid #e0ebf1;border-radius:11px;padding:11px;min-width:0}
#vc1660-bench .vc1660-box h4{font-size:13px;color:#244e6a;margin:0 0 9px}#vc1660-bench .vc1660-cues,#vc1660-bench .vc1660-timeline{display:grid;gap:7px;max-height:292px;overflow:auto}
#vc1660-bench .vc1660-cue{border:1px solid #e5edf2;border-left:3px solid #91aabd;border-radius:8px;padding:10px;display:grid;gap:5px}
#vc1660-bench .vc1660-cue.vc1660-warn{border-left-color:#d38a4f;background:#fffaf4}#vc1660-bench .vc1660-cue b{font-size:11px;color:#304f63}#vc1660-bench .vc1660-cue small{font-size:10px;color:#6c8494;line-height:1.5}
#vc1660-bench .vc1660-rally{display:flex;gap:8px;align-items:center;justify-content:space-between;border:1px solid #e3ebf0;padding:9px;border-radius:8px}
#vc1660-bench .vc1660-rally.vc1660-win{border-left:3px solid #319970}#vc1660-bench .vc1660-rally.vc1660-loss{border-left:3px solid #c97761}
#vc1660-bench .vc1660-rally-info{display:grid;gap:4px;min-width:0}#vc1660-bench .vc1660-rally-info strong{font-size:11px;color:#284a61}#vc1660-bench .vc1660-rally-info small{font-size:10px;color:#748e9c}
#vc1660-bench button.vc1660-review{font-size:10px!important;padding:6px 8px!important;min-height:33px!important;background:#eaf5fc!important;color:#23658e!important;border:1px solid #cbdfea!important;flex-shrink:0}
#vc1660-bench button:disabled{opacity:.4!important;cursor:not-allowed!important}
body.v158-view-only #vc1660-bench .vc1660-review{display:none!important}
@media(max-width:1000px){#vc1660-bench .vc1660-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#vc1660-bench .vc1660-grid{grid-template-columns:1fr}}
@media(max-width:520px){#vc155-bench #vc1660-bench{padding:10px}#vc1660-bench .vc1660-rally{flex-wrap:wrap}#vc1660-bench .vc1660-metric strong{font-size:23px}}
`;
    root.document.head.appendChild(style);
    const panel=el('section');panel.id='vc1660-bench';panel.hidden=true;panel.setAttribute('aria-label','Centro de decisiones en directo');
    panel.innerHTML='<div class="vc1660-head"><div><small>BENCH PRO · V16.6.0</small><h3>Centro de decisiones</h3><p id="vc1660-period">Esperando rallies cerrados</p></div><label>Ventana reciente<select id="vc1660-window"><option value="5">5 rallies</option><option value="10" selected>10 rallies</option><option value="15">15 rallies</option></select></label></div><div><span id="vc1660-state">Datos locales</span><p id="vc1660-freshness">Presencia y sincronización no equivalen.</p></div><div id="vc1660-metrics" class="vc1660-metrics"></div><div class="vc1660-grid"><section class="vc1660-box"><h4>Señales para revisar</h4><div id="vc1660-cues" class="vc1660-cues"></div></section><section class="vc1660-box"><h4>Jugadas recientes</h4><div id="vc1660-timeline" class="vc1660-timeline"></div></section></div><p id="vc1660-note"></p><p id="vc1660-action-status" role="status" aria-live="polite"></p>';
    kpis.insertAdjacentElement('afterend',panel);
    $('vc1660-window').addEventListener('change',e=>{windowSize=validWindow(e.target.value);lastSignature='';render(true)});
    $('vc1660-timeline').addEventListener('click',e=>{const button=e.target.closest('button[data-vc1660-index]');if(button)review(Number(button.dataset.vc1660Index))});
    $('vc155-match')?.addEventListener('change',()=>{lastSignature='';render(true)});
    root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)render(true)});
    root.addEventListener('focus',()=>render(true));
    root.setInterval(()=>{if($('vc155-bench')?.classList.contains('active')){try{render()}catch(e){const msg=String(e?.message||e);if(lastError!==msg){lastError=msg;console.warn('Bench decision center',e)}}}},2200);
    render(true);return true;
  }
  root.VC_BENCH_LIVE_1660={...api,render,review,diagnostics:()=>({version:api.version,initialized,window:windowSize,visible:visibleRows.length,rendered:!!$('vc1660-bench')})};
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(typeof window!=='undefined'?window:null);
