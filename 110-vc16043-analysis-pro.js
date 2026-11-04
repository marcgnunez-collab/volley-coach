/* Volley Coach V16.0.4.3 · Análisis Pro.
 * Independent, read-only analytical dashboard: uses the existing official
 * report bridge. Never mutates matches, scores, scouting, cloud or video.
 * Metrics are based only on CLOSED rallies and coded actions.
 */
(()=>{
'use strict';
if(window.VC_ANALYSIS_PRO_1643)return;
const VERSION='16.0.4.3';
const $=id=>document.getElementById(id),arr=v=>Array.isArray(v)?v:[];
const bridge=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=(a,b)=>b?`${Math.round(100*a/b)}%`:'—';
const gp=v=>`${v>0?'+':''}${v}`;
const fmt=(w,l)=>`${w} / ${l}`;
const state={team:'ours',set:'all',tab:'rotations',matchId:null,requests:0,renders:0,skips:0,errors:0,lastMs:0,lastRallies:0,signature:'',scheduled:false,expanded:true};
function active(){return !!$('scout-analysis')?.classList.contains('active')}
function selectedMatch(){
 const b=bridge();if(!b)return null;
 const id=Number($('scout-analysis-match')?.value)||0;
 return arr(b.getMatches?.()).find(m=>Number(m.id)===id)||b.getMatchForAnalysis?.()||null;
}
function readModel(m){
 const b=bridge();if(!m||!b?.rallies||!b?.actionRows)return null;
 const set=state.set==='all'?null:Number(state.set),team=state.team;
 const allR=arr(b.rallies(m,team,false)),rr=set?allR.filter(x=>Number(x.set)===set):allR;
 const allRows=arr(b.actionRows(m,false)),rows=allRows.filter(a=>a.team===team&&(!set||Number(a.set)===set));
 const k1=rr.filter(x=>x.phase==='K1'),k2=rr.filter(x=>x.phase==='K2');
 const won=rr.filter(x=>x.win).length,lost=rr.length-won;
 const group=xs=>({won:xs.filter(x=>x.win).length,total:xs.length});
 const k1s=group(k1),k2s=group(k2);
 const rotations=Array.from({length:6},(_,i)=>{
   const no=i+1,one=rr.filter(x=>Number(x.rotation)===no),a=one.filter(x=>x.phase==='K1'),b=one.filter(x=>x.phase==='K2');
   return {no,total:one.length,won:one.filter(x=>x.win).length,k1:group(a),k2:group(b)};
 });
 const sets=arr(m.sets).map(s=>{
   const sr=allR.filter(x=>Number(x.set)===Number(s.number));
   const a=sr.filter(x=>x.phase==='K1'),b=sr.filter(x=>x.phase==='K2');
   return {number:s.number,total:sr.length,won:sr.filter(x=>x.win).length,k1:group(a),k2:group(b),actions:allRows.filter(x=>Number(x.set)===Number(s.number)&&x.team===team).length};
 });
 // The existing source-of-point classification is the same one used by the PDF.
 const breakdown=b.breakdown?.(rr,team)||{serve:0,attack:0,block:0,oppErr:0,total:0};
 return {m,team,set,rr,allR,rows,allRows,k1:k1s,k2:k2s,won,lost,rotations,sets,breakdown};
}
function playerRows(model){
 const b=bridge(),{m,team,rows}=model,all=b?.fullStats?.(m,team,false);
 const keys=new Map();
 for(const a of rows){const key=b?.playerKey?.(a);if(!key)continue;let x=keys.get(key);if(!x){x={key,actions:0,recep:0,recGood:0,attack:0,kills:0,attErrors:0,blocked:0,serves:0,aces:0};keys.set(key,x)}
  x.actions++;if(a.skill==='R'){x.recep++;if(a.evaluation==='#'||a.evaluation==='+')x.recGood++}
  if(a.skill==='A'){x.attack++;if(a.evaluation==='#')x.kills++;if(a.evaluation==='=')x.attErrors++;if(a.evaluation==='/')x.blocked++}
  if(a.skill==='S'){x.serves++;if(a.evaluation==='#')x.aces++}
 }
 return arr(all?.players).filter(st=>keys.has(st.key)).map(st=>{
   const x=keys.get(st.key),p=b?.pointMetrics?.(m,team,st.key,rows)||{won:0,lost:0,gp:0};
   return {...x,label:st.label||st.key,won:num(p.won),lost:num(p.lost),gp:num(p.gp)};
 }).sort((a,b)=>b.gp-a.gp||b.actions-a.actions||a.label.localeCompare(b.label,'es'));
}
function checkIntegrity(model){
 const {m,rr,rows,allR}=model,notes=[];
 if(!allR.length)notes.push({level:'info',text:'Todavía no hay rallies cerrados. Las acciones en curso no se contabilizan.'});
 arr(m.sets).forEach(s=>{
   const rallies=arr(s.rallies),us=rallies.filter(r=>r.winner==='ours').length,them=rallies.filter(r=>r.winner==='opponent').length;
   // Manual score corrections are valid but require explicit contextualization.
   if(num(s.scoreUs)!==us||num(s.scoreOpponent)!==them)notes.push({level:'warn',text:`Set ${s.number}: marcador ${num(s.scoreUs)}–${num(s.scoreOpponent)}, rallies cerrados ${us}–${them}. Puede existir ajuste manual o registro incompleto.`});
   rallies.forEach((r,i)=>{
     if(!['ours','opponent'].includes(r.winner))notes.push({level:'warn',text:`Set ${s.number}, rally ${i+1}: falta ganador.`});
     if(!['ours','opponent'].includes(r.servingBefore))notes.push({level:'warn',text:`Set ${s.number}, rally ${i+1}: falta el equipo al saque.`});
   });
 });
 return {notes,closedRallies:rr.length,closedActions:rows.length,allClosed:allR.length,liveActions:arr(m.liveRally?.actions).length};
}
function accuracyLabel(obj){return `${obj.won}/${obj.total} · ${pct(obj.won,obj.total)}`}
function makePills(model){
 const {rr,k1,k2,won,lost,rows,breakdown}=model,linked=rows.filter(a=>{
   // Number(null) === 0, so explicitly reject missing timestamps.
   const valid=['videoTimestamp','liveVideoTime','videoAction','videoTime','videoStart'].some(k=>a[k]!==''&&a[k]!=null&&Number.isFinite(Number(a[k]))&&Number(a[k])>=0);
   if(valid)return true;
   return model.m.video?.syncOffset!=null&&a.scoutMs!=null&&Number.isFinite(Number(a.scoutMs));
 }).length;
 const items=[
  ['Rallies cerrados',rr.length,'Partido/set seleccionado'],
  ['Side-out · K1',pct(k1.won,k1.total),accuracyLabel(k1)],
  ['Break · K2',pct(k2.won,k2.total),accuracyLabel(k2)],
  ['G-P rallies',gp(won-lost),`${won} ganados · ${lost} perdidos`],
  ['Acciones codificadas',rows.length,'Solo rallies cerrados'],
  ['Puntos clasificados',num(breakdown.total),`Saq ${num(breakdown.serve)} · Atq ${num(breakdown.attack)} · Blq ${num(breakdown.block)}`],
  ['Vídeo enlazado',`${linked}/${rows.length}`,rows.length?pct(linked,rows.length):'Sin acciones']
 ];
 return items.map(([label,value,note])=>`<article class="vc1643-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`).join('');
}
function phasesCell(x){if(!x.total)return '<span class="vc1643-muted">—</span>';return `<strong>${x.won}/${x.total-x.won}</strong><small>${pct(x.won,x.total)} · G-P ${gp(2*x.won-x.total)}</small>`}
function viewRotations(d){
 let html='<div class="vc1643-table-scroll"><table class="vc1643-table"><thead><tr><th>Rotación</th><th>Rallies</th><th>K1 · G/P</th><th>K2 · G/P</th><th>G-P total</th></tr></thead><tbody>';
 for(const r of d.rotations){const loss=r.total-r.won;html+=`<tr><td><b>R${r.no}</b></td><td>${r.total}</td><td>${phasesCell(r.k1)}</td><td>${phasesCell(r.k2)}</td><td><strong class="${r.won-loss<0?'vc1643-negative':''}">${r.total?gp(r.won-loss):'—'}</strong><small>${r.won}/${loss}</small></td></tr>`}
 html+='</tbody></table></div><p class="vc1643-footnote">K1 = recepción; K2 = saque. G-P de rotación = rallies ganados menos perdidos. Sin muestra no se muestra porcentaje.</p>';
 return html;
}
function viewSets(d){
 let html='<div class="vc1643-table-scroll"><table class="vc1643-table"><thead><tr><th>Set</th><th>Rallies</th><th>K1 · ganados/total</th><th>K2 · ganados/total</th><th>G-P rallies</th><th>Acciones</th></tr></thead><tbody>';
 for(const s of d.sets){html+=`<tr><td><b>Set ${esc(s.number)}</b></td><td>${s.total}</td><td>${accuracyLabel(s.k1)}</td><td>${accuracyLabel(s.k2)}</td><td><strong>${s.total?gp(2*s.won-s.total):'—'}</strong></td><td>${s.actions}</td></tr>`}
 html+='</tbody></table></div><p class="vc1643-footnote">Solo se cuentan rallies cerrados. Los sets sin rallies no tienen porcentaje; los marcadores corregidos manualmente pueden diferir del recuento.</p>';
 return html;
}
function viewPlayers(d){
 const ps=playerRows(d);let html='<div class="vc1643-table-scroll"><table class="vc1643-table"><thead><tr><th>Jugador/a</th><th>Acc.</th><th>PTS G/P</th><th>G-P</th><th>SAQ puntos</th><th>REC positivas</th><th>ATQ puntos</th><th>ATQ errores/bloq.</th></tr></thead><tbody>';
 for(const p of ps){html+=`<tr><td><b>${esc(p.label)}</b></td><td>${p.actions}</td><td>${fmt(p.won,p.lost)}</td><td><strong class="${p.gp<0?'vc1643-negative':''}">${gp(p.gp)}</strong></td><td>${p.aces}/${p.serves}</td><td>${p.recGood}/${p.recep} <small>${pct(p.recGood,p.recep)}</small></td><td>${p.kills}/${p.attack} <small>${pct(p.kills,p.attack)}</small></td><td>${p.attErrors}/${p.blocked}</td></tr>`}
 html+='</tbody></table></div><p class="vc1643-footnote">G-P individual usa el motor oficial: puntos directos (# de saque, ataque o bloqueo) menos pérdidas terminales (= y ataque bloqueado /). REC positiva = + o #. Los jugadores sin acciones codificadas en el filtro no aparecen.</p>';
 if(!ps.length)html='<div class="vc1643-empty">No hay acciones individuales en esta selección.</div>';
 return html;
}
function viewQuality(d){
 const q=checkIntegrity(d),level=q.notes.some(x=>x.level==='warn')?'warn':'ok';
 let html=`<div class="vc1643-quality ${level}"><strong>${level==='ok'?'Sin discrepancias básicas de marcador detectadas':'Hay datos para revisar'}</strong><span>${q.allClosed} rallies cerrados · ${q.closedActions} acciones filtradas · ${q.liveActions} acciones en curso excluidas</span></div>`;
 if(q.notes.length)html+='<ul class="vc1643-notes">'+q.notes.slice(0,40).map(n=>`<li>${esc(n.text)}</li>`).join('')+'</ul>'+(q.notes.length>40?`<p>${q.notes.length-40} avisos adicionales no mostrados.</p>`:'');
 else html+='<p class="vc1643-footnote">Esta comprobación básica no sustituye la auditoría estadística completa. Comprueba también los rallies, las evaluaciones y los PDF antes de utilizar el informe oficialmente.</p>';
 html+='<button type="button" class="vc1643-action" data-vc1643-action="audit">Abrir auditoría estadística completa</button>';
 return html;
}
function safeCSVText(v){const x=String(v??'');return /^[\s]*[=+@\-\t\r]/.test(x)?"'"+x:x}
function csvCell(v){const text=typeof v==='number'&&Number.isFinite(v)?String(v):safeCSVText(v);return '"'+text.replace(/"/g,'""')+'"'}
function csvData(model){
 const heading=['tipo','equipo','set','rotacion','jugador','rallies','K1_ganados','K1_total','K2_ganados','K2_total','puntos_ganados','puntos_perdidos','G_menos_P','acciones','saques_puntos','ataques_puntos','bloqueos_puntos','errores_rival'];
 const b=model.breakdown,rows=[heading];
 rows.push(['RESUMEN',model.team,model.set??'Todos','', '',model.rr.length,model.k1.won,model.k1.total,model.k2.won,model.k2.total,model.won,model.lost,model.won-model.lost,model.rows.length,num(b.serve),num(b.attack),num(b.block),num(b.oppErr)]);
 for(const r of model.rotations)rows.push(['ROTACION',model.team,model.set??'Todos',r.no,'',r.total,r.k1.won,r.k1.total,r.k2.won,r.k2.total,r.won,r.total-r.won,2*r.won-r.total,'','','','','']);
 for(const s of (model.set==null?model.sets:model.sets.filter(s=>Number(s.number)===model.set)))rows.push(['SET',model.team,s.number,'','',s.total,s.k1.won,s.k1.total,s.k2.won,s.k2.total,s.won,s.total-s.won,2*s.won-s.total,s.actions,'','','','']);
 for(const p of playerRows(model))rows.push(['JUGADOR',model.team,model.set??'Todos','',p.label,'','','','','',p.won,p.lost,p.gp,p.actions,p.aces,p.kills,'','']);
 return '\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
function csvDownload(){
 const m=selectedMatch(),d=readModel(m);if(!d)return;
 const name='Volley_Coach_Analisis_Pro_'+String(m?.date||'partido').replace(/[^a-zA-Z0-9_-]/g,'-')+'_'+String(m?.id||'').replace(/[^a-zA-Z0-9_-]/g,'')+'.csv';
 const url=URL.createObjectURL(new Blob([csvData(d)],{type:'text/csv;charset=utf-8'}));
 try{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()}finally{setTimeout(()=>URL.revokeObjectURL(url),2000)}
}
function mount(){
 const view=$('scout-analysis');if(!view||$('vc1643-pro'))return;
 const host=document.createElement('section');host.id='vc1643-pro';host.className='vc1643-panel';host.setAttribute('aria-label','Análisis Pro por set, rotación y jugador');
 host.innerHTML=`<div class="vc1643-head"><div><span class="vc1643-kicker">ANÁLISIS PRO · RESUMEN</span><h3>Resumen estadístico</h3><p>Comparativa verificable por set, rotación y jugadora. Solo rallies cerrados.</p></div><div class="vc1643-head-actions"><button type="button" data-vc1643-action="csv">Exportar CSV</button><button type="button" data-vc1643-action="pdf">PDF análisis</button><button type="button" data-vc1643-action="toggle" aria-expanded="true">Ocultar panel</button></div></div><div id="vc1643-body"><div class="vc1643-filters"><label>Equipo<select id="vc1643-team"><option value="ours">Nuestro equipo</option><option value="opponent">Rival</option></select></label><label>Periodo<select id="vc1643-set"><option value="all">Todos los sets</option></select></label><span id="vc1643-context" class="vc1643-context">—</span></div><div id="vc1643-kpis" class="vc1643-kpis"></div><div class="vc1643-workspace"><nav class="vc1643-tabs" aria-label="Secciones de Análisis Pro"><button type="button" data-vc1643-tab="rotations" aria-pressed="true">Rotaciones</button><button type="button" data-vc1643-tab="sets">Comparar sets</button><button type="button" data-vc1643-tab="players">Jugadoras · G-P</button><button type="button" data-vc1643-tab="quality">Calidad de datos</button></nav><div id="vc1643-content" class="vc1643-content" aria-live="polite"></div></div></div>`;
 const header=view.querySelector('.scout-analysis-header');(header||view.querySelector('.scout-analysis-shell')?.firstChild)?.after(host);
 host.addEventListener('change',e=>{if(e.target.id==='vc1643-set'){state.set=e.target.value;render(true)}else if(e.target.id==='vc1643-team'){state.team=e.target.value;render(true)}});
 host.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;
  if(btn.dataset.vc1643Tab){state.tab=btn.dataset.vc1643Tab;render(true);return}
  if(btn.dataset.vc1643Action==='csv'){csvDownload();return}
  if(btn.dataset.vc1643Action==='pdf'){const fn=window.scoutV752ExportAnalysisPDF;if(typeof fn==='function')Promise.resolve().then(()=>fn()).catch(err=>console.warn('PDF análisis Pro',err));else window.alert('El generador PDF no está disponible.');return}
  if(btn.dataset.vc1643Action==='toggle'){state.expanded=!state.expanded;$('vc1643-body').hidden=!state.expanded;btn.textContent=state.expanded?'Ocultar panel':'Mostrar panel';btn.setAttribute('aria-expanded',String(state.expanded));if(state.expanded)render(true);return}
  if(btn.dataset.vc1643Action==='audit')window.v134OpenStatAudit?.();
 });
}
function render(force=false){
 state.requests++;if(!active())return false;
 mount();const root=$('vc1643-pro');if(!root||!state.expanded)return false;
 // The unified summary is the only place where this duplicated model is needed.
 // Do not recalculate while the user reads the official detailed sections.
 if($('scout-analysis')?.classList.contains('vc1645-analysis-unified')&&$('scout-analysis')?.dataset.v115Tab!=='summary'){state.skips++;return false;}
 const m=selectedMatch();if(!m){$('vc1643-content').innerHTML='<div class="vc1643-empty">Selecciona un scouting para ver Análisis Pro.</div>';$('vc1643-kpis').replaceChildren();state.signature='';state.matchId=null;return false;}
 if(Number(m.id)!==Number(state.matchId)){state.set='all';state.matchId=m.id;state.signature='';}
 const setSel=$('vc1643-set');const values=arr(m.sets).map(s=>String(s.number));
 if(state.set!=='all'&&!values.includes(state.set))state.set='all';
 const options=['<option value="all">Todos los sets</option>',...values.map(n=>`<option value="${esc(n)}">Set ${esc(n)}</option>`)].join('');
 if(setSel.innerHTML!==options)setSel.innerHTML=options;
 if(setSel.value!==state.set)setSel.value=state.set;
 if($('vc1643-team').value!==state.team)$('vc1643-team').value=state.team;
 const t=performance.now();let d;
 try{d=readModel(m)}catch(err){state.errors++;console.warn('Análisis Pro',err);$('vc1643-content').textContent='No se pudo calcular el panel. Las estadísticas anteriores siguen disponibles.';return false;}
 if(!d)return false;
 const section=state.tab==='rotations'?viewRotations(d):state.tab==='sets'?viewSets(d):state.tab==='players'?viewPlayers(d):viewQuality(d);
 const kpis=makePills(d),context=`${m.opponent||'Rival'} · ${m.date||'Sin fecha'} · ${state.set==='all'?'Partido completo':'Set '+state.set}`;
 const signature=[String(m.id),state.team,state.set,state.tab,kpis,section,context].join('|');
 if(!force&&signature===state.signature){state.skips++;return true;}
 $('vc1643-kpis').innerHTML=kpis;
 $('vc1643-content').innerHTML=section;
 $('vc1643-context').textContent=context;
 root.querySelectorAll('[data-vc1643-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vc1643Tab===state.tab)));
 state.signature=signature;state.renders++;state.lastMs=Math.round((performance.now()-t)*10)/10;state.lastRallies=d.rr.length;return true;
}
function schedule(){if(state.scheduled||!active())return;state.scheduled=true;setTimeout(()=>{state.scheduled=false;render()},90)}
function boot(){
 mount();
 // Existing analysis renderer has several wrappers. Only schedule our update
 // after they have completed, and coalesce all requests in the same frame.
 const base=window.scoutRenderAnalysis;
 if(typeof base==='function'&&!base.__vc1643){const wrapped=function(...args){const value=base.apply(this,args);schedule();return value};wrapped.__vc1643=true;window.scoutRenderAnalysis=wrapped;}
 // Navigation can reveal a previously hidden view without rebuilding it.
 const view=$('scout-analysis');if(view){const ob=new MutationObserver(()=>{if(active())schedule()});ob.observe(view,{attributes:true,attributeFilter:['class','data-v115-tab']});}
 const match=$('scout-analysis-match');match?.addEventListener('change',()=>{state.matchId=null;schedule()});
 document.addEventListener('vc:matchstatechange',schedule);
 window.addEventListener('vc:matchstatechange',schedule);
 window.addEventListener('pageshow',schedule);
 if(active())schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.VC_ANALYSIS_PRO_1643=Object.freeze({version:VERSION,render:()=>render(true),build:readModel,integrity:checkIntegrity,players:playerRows,csv:csvData,diagnostics:()=>({version:VERSION,team:state.team,set:state.set,tab:state.tab,matchId:state.matchId,requests:state.requests,renders:state.renders,skips:state.skips,errors:state.errors,lastMs:state.lastMs,lastRallies:state.lastRallies,expanded:state.expanded})});
})();
