
(()=>{
'use strict';
const VERSION='9.0.0';
const SKILL_NAMES={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'};
const REC_SUB={L:'On left · izquierda',R:'On right · derecha',LOW:'Low · baja',OH:'Overhand · dedos',MID:'Middle line'};
const ATK_SUB={HSP:'Hard spike',SSP:'Soft spike / topspin',TIP:'Tip · finta'};
const SET_SUB={'1H':'1 hand','2H':'2 hands',BUMP:'Bump set',UND:'Underhand',OTH:'Other'};
const DEF_SUB={COV:'Spike cover',AB:'After block',EMG:'Emergency',TIP:'Tip',SOFT:'Soft spike'};
const BLOCK_SUB={AST:'Block assist',ATT:'Block attempt',SOFT:'Soft spike'};
const TEMPO={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
const SETTYPE={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};
const SERVE={F:'Flotante',JF:'Jump float',JP:'Jump spin',U:'Bajo / seguridad'};
const COMBO={Z4:'Zona 4',Z2:'Zona 2',Z1:'Zona 1',Z6:'Zona 6','1T':'Primer tiempo','31':'31',BACK:'Primer tiempo detrás',PIPE:'Pipe','2T':'Segundo toque',OTR:'Otra'};
const POS=['p4','p3','p2','p5','p6','p1'];

const state={
  phase:localStorage.getItem('v900_phase')||'scout',
  mode:localStorage.getItem('v900_mode')||'visual',
  team:'ours',player:'',playerLabel:'',skill:'R',evaluation:'!',
  origin:'',originSub:'',destination:'',destinationSub:'',
  serveType:'',phaseCode:'',combo:'',dvCode:'',tempo:'',setType:'',
  subtype:'',direction:'',blockers:'',blockTarget:'',special:'',custom:'',
  locationMode:'zones',cone:''
};
window.VC_V900_STATE=state;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function bridge(){return window.VC_SCOUT_VIDEO_BRIDGE||null}
function active(){try{return bridge()?.getActive?.()||null}catch(_){return null}}
function players(){try{return bridge()?.getPlayers?.()||[]}catch(_){return[]}}
function teamName(){try{return bridge()?.teamName?.()||'Equipo'}catch(_){return 'Equipo'}}
function currentSet(m){return m?.sets?.find(s=>Number(s.number)===Number(m.currentSet))||null}
function allActions(m){if(!m)return[];const closed=(m.sets||[]).flatMap(s=>(s.rallies||[]).flatMap(r=>(r.actions||[]).map(a=>({...a,_set:s.number,_winner:r.winner}))));return closed.concat((m.liveRally?.actions||[]).map(a=>({...a,_set:m.currentSet,_winner:null})))}
/* V12.5 removed unreachable function: setActions */
function setsScore(m){const done=(m?.sets||[]).filter(s=>s.finished);if(m?.manualResult?.active)return{us:Number(m.manualResult.us)||0,opponent:Number(m.manualResult.opponent)||0};return{us:done.filter(s=>s.winner==='ours').length,opponent:done.filter(s=>s.winner==='opponent').length}}
function pct(n,d){return d?Math.round(Number(n||0)*100/d):0}
function playerById(id){return players().find(p=>Number(p.id)===Number(id))||null}
function playerLabel(a){try{return bridge()?.playerLabel?.(a)||a?.playerLabel||'Jugador'}catch(_){return a?.playerLabel||'Jugador'}}
function ownLabel(id){const p=playerById(id);if(!p)return '—';return `${p.number!==''&&p.number!=null?'#'+p.number+' · ':''}${p.name||'Jugador'}`}
function opponentLabel(v,pos){return String(v||'').trim()||`Rival ${String(pos||'').toUpperCase()}`}
function token(zone,sub){return String(zone||'')+String(sub||'')}
/* V12.5 removed unreachable function: setVal */
function safeText(id,text){const el=$(id);if(el)el.textContent=text}

function ensurePlayer(){
  const m=active();if(!m)return;
  if(state.team==='ours'){
    const ids=POS.map(p=>Number(m.lineup?.ours?.[p])).filter(Boolean);
    if(!ids.includes(Number(state.player)))state.player=ids[0]?String(ids[0]):'';
    state.playerLabel=state.player?ownLabel(state.player):'';
  }else{
    const vals=POS.map(p=>opponentLabel(m.lineup?.opponent?.[p],p));
    if(!vals.includes(state.player))state.player=vals[0]||'';
    state.playerLabel=state.player;
  }
}
function locationRules(){
  const s=state.skill;
  if(s==='R'||s==='D')return{origin:false,destination:true,destLabel:'Contacto físico'};
  if(s==='B')return{origin:true,destination:false,originLabel:'Zona de bloqueo'};
  if(s==='A'&&state.locationMode==='cones')return{origin:true,destination:false,originLabel:'Origen ataque',cone:true};
  return{origin:true,destination:true,originLabel:'Origen',destLabel:'Destino'};
}
function dynamicOptions(){
  const s=state.skill,fields=[];
  if(s==='S')fields.push(['serveType','Tipo de saque',SERVE]);
  if(s==='R'){fields.push(['subtype','Tipo de recepción',REC_SUB],['serveType','Saque recibido',SERVE])}
  if(s==='E'){fields.push(['dvCode','Set code','text'],['tempo','Tempo',TEMPO],['setType','Set type',SETTYPE],['subtype','Gesto',SET_SUB],['combo','Destino / combinación',COMBO])}
  if(s==='A'){fields.push(['dvCode','Attack code','text'],['tempo','Tempo',TEMPO],['subtype','Tipo de ataque',ATK_SUB],['setType','Set type',SETTYPE],['combo','Combinación VC',COMBO],['direction','Dirección VC',{LIN:'Línea',DC:'Diagonal corta',DL:'Diagonal larga'}],['blockers','Bloqueadores',{0:'0 · sin bloqueo',1:'1',2:'2 · doble',3:'3 · triple'}],['locationMode','Destino DV',{zones:'Zonas / subzonas',cones:'Conos 1–8'}])}
  if(s==='B'){fields.push(['subtype','Tipo de bloqueo',BLOCK_SUB],['blockers','Tamaño',{0:'0',1:'1',2:'2 · doble',3:'3 · triple'}],['blockTarget','Atacante objetivo','text'])}
  if(s==='D')fields.push(['subtype','Tipo de defensa',DEF_SUB]);
  if(['S','R','E','A','B','D'].includes(s))fields.push(['phaseCode','Fase',{K1:'K1 · Side-out',K2:'K2 · Break',FB:'Freeball',TR:'Transición'}]);
  fields.push(['special','Special code','text'],['custom','Custom DV','text']);
  return fields;
}
function fieldHtml([key,label,opts]){
  if(opts==='text')return `<label class="v900-field"><span>${esc(label)}</span><input value="${esc(state[key]||'')}" oninput="v900SetField('${key}',this.value)" maxlength="${key==='custom'?5:10}"></label>`;
  return `<label class="v900-field"><span>${esc(label)}</span><select onchange="v900SetField('${key}',this.value)"><option value="">—</option>${Object.entries(opts).map(([v,l])=>`<option value="${esc(v)}" ${String(state[key])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
}
function zoneGrid(which){
  const zone=which==='origin'?state.origin:state.destination,sub=which==='origin'?state.originSub:state.destinationSub;
  const order=[4,3,2,7,8,9,5,6,1];
  return `<div class="v900-zone-grid">${order.map(z=>`<button type="button" class="${String(zone)===String(z)?'active':''}" onclick="v900SetZone('${which}','${z}')">Z${z}</button>`).join('')}</div>
  <div class="v900-subzone-row"><button type="button" class="${!sub?'active':''}" onclick="v900SetSubzone('${which}','')">—</button>${['A','B','C','D'].map(s=>`<button type="button" class="${sub===s?'active':''}" onclick="v900SetSubzone('${which}','${s}')">${s}</button>`).join('')}</div>`;
}
function renderLocations(){
  const box=$('v900-location-area');if(!box)return;const r=locationRules();
  if(r.cone){
    box.innerHTML=`<div class="v900-location-block"><div class="v900-location-card"><h4>${esc(r.originLabel||'Origen')}</h4>${zoneGrid('origin')}</div><div class="v900-location-card"><h4>Cono DataVolley</h4><div class="v900-cone-grid">${[1,2,3,4,5,6,7,8].map(c=>`<button type="button" class="${Number(state.cone)===c?'active':''}" onclick="v900SetField('cone','${c}')">C${c}</button>`).join('')}</div></div></div>`;return;
  }
  const parts=[];
  if(r.origin)parts.push(`<div class="v900-location-card"><h4>${esc(r.originLabel||'Origen')}</h4>${zoneGrid('origin')}</div>`);
  if(r.destination)parts.push(`<div class="v900-location-card"><h4>${esc(r.destLabel||'Destino')}</h4>${zoneGrid('destination')}</div>`);
  box.innerHTML=`<div class="v900-location-block">${parts.join('')}</div>`;
}
function renderBuilder(){
  document.querySelectorAll('#v900-team-ours,#v900-team-opponent').forEach(b=>b.classList.remove('active'));
  $(`v900-team-${state.team}`)?.classList.add('active');
  document.querySelectorAll('#v900-phase-scout [data-skill]').forEach(b=>b.classList.toggle('active',b.dataset.skill===state.skill));
  document.querySelectorAll('#v900-phase-scout [data-eval]').forEach(b=>b.classList.toggle('active',b.dataset.eval===state.evaluation));
  const dyn=$('v900-dynamic-fields');if(dyn)dyn.innerHTML=dynamicOptions().map(fieldHtml).join('');
  renderPlayers();renderLocations();updatePreview();renderIntel();
}
function renderPlayers(){
  const box=$('v900-player-buttons');if(!box)return;ensurePlayer();const m=active();if(!m){box.innerHTML='';return}
  let arr=[];
  if(state.team==='ours'){
    const seen=new Set();
    arr=POS.map(pos=>Number(m.lineup?.ours?.[pos])).filter(id=>id&&!seen.has(id)&&(seen.add(id),true)).map(id=>({value:String(id),label:ownLabel(id)}));
  }else{
    arr=POS.map(pos=>({value:opponentLabel(m.lineup?.opponent?.[pos],pos),label:opponentLabel(m.lineup?.opponent?.[pos],pos)}));
  }
  box.innerHTML=arr.map(x=>`<button type="button" class="${String(state.player)===String(x.value)?'active':''}" onclick="v900SelectPlayer('${esc(String(x.value)).replace(/'/g,"\\'")}')">${esc(x.label)}</button>`).join('');
  safeText('v900-player-selected',state.playerLabel||'—');
}
function renderCourt(target,team,prep=false){
  const box=$(target),m=active();if(!box||!m)return;
  box.innerHTML=POS.map(pos=>{
    const isOurs=team==='ours',value=isOurs?m.lineup?.ours?.[pos]:m.lineup?.opponent?.[pos],label=isOurs?ownLabel(value):opponentLabel(value,pos);
    const selected=state.team===team&&String(state.player)===String(isOurs?Number(value)||'':label);
    const role=isOurs?(m.lineupRoles?.ours?.[pos]||''):m.lineupRoles?.opponent?.[pos]||'';
    const click=prep?'':`onclick="v900SelectCourtPlayer('${team}','${esc(String(isOurs?Number(value)||'':label)).replace(/'/g,"\\'")}')"`;
    return `<button type="button" style="grid-area:${pos}" class="v900-court-slot ${selected?'selected':''}" ${click}><small>${pos.toUpperCase()}</small><b>${esc(label)}</b><span>${esc(role||'')}</span></button>`;
  }).join('');
}
function renderCourts(){
  renderCourt('v900-own-court','ours');renderCourt('v900-rival-court','opponent');renderCourt('v900-prep-own-court','ours',true);renderCourt('v900-prep-rival-court','opponent',true);
}
/* V12.5 removed unreachable function: syncLegacy */
function buildPreview(){
  const p=state.team==='opponent'?'R':'';
  let num='';
  if(state.team==='ours'){const pl=playerById(state.player);num=pl?.number??''}
  else num=String(state.player||'').match(/\d+/)?.[0]||'';
  let code=`${p}${num||'?'}${state.skill}${state.evaluation}`;
  const r=locationRules(),o=token(state.origin,state.originSub),d=token(state.destination,state.destinationSub);
  if(r.cone&&o&&state.cone)code+=`.${o}>C${state.cone}`;
  else if(r.origin&&r.destination&&o&&d)code+=`.${o}>${d}`;
  else if(state.skill==='B'&&o)code+=`.${o}`;
  else if((state.skill==='R'||state.skill==='D')&&d)code+=`.${d}`;
  if(state.serveType)code+=`~${state.serveType}`;
  if(state.combo)code+=`:${state.combo}`;
  if(state.dvCode)code+=`::${String(state.dvCode).toUpperCase()}`;
  if(state.tempo)code+=`~${state.tempo}`;
  if(state.subtype)code+=`%${state.subtype}`;
  if(state.setType)code+=`|${state.setType}`;
  if(state.direction)code+=`*${state.direction}`;
  if(state.phaseCode)code+=`^${state.phaseCode}`;
  if(state.blockers!=='')code+=`@${state.blockers}`;
  if(state.skill==='B'&&state.blockTarget)code+=`&${state.blockTarget}`;
  if(state.special)code+=`?${String(state.special).toUpperCase()}`;
  if(state.custom)code+=`$${String(state.custom).toUpperCase()}`;
  return code;
}
function meaning(){
  const bits=[state.playerLabel||'Jugador',SKILL_NAMES[state.skill]||state.skill,`valoración ${state.evaluation}`];
  if(state.skill==='R'&&state.subtype)bits.push(REC_SUB[state.subtype]||state.subtype);
  if(state.skill==='A'&&state.subtype)bits.push(ATK_SUB[state.subtype]||state.subtype);
  if(state.tempo)bits.push(TEMPO[state.tempo]||state.tempo);
  if(state.dvCode)bits.push((state.skill==='E'?'set code ':'attack code ')+state.dvCode);
  if(state.skill==='A'&&state.locationMode==='cones'&&state.cone)bits.push('cono C'+state.cone);
  return bits.join(' · ');
}
function updatePreview(){safeText('v900-code-preview',buildPreview());safeText('v900-code-meaning',meaning())}

function metricGroup(rows,getter){
  const map=new Map();rows.forEach(a=>{const k=String(getter(a)||'').trim();if(k)map.set(k,(map.get(k)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}
function intelFor(rows,skill){
  const total=rows.length,perfect=rows.filter(a=>a.evaluation==='#').length,positive=rows.filter(a=>['#','+'].includes(a.evaluation)).length,errors=rows.filter(a=>a.evaluation==='=').length,blocked=rows.filter(a=>a.evaluation==='/').length;
  if(skill==='R'){
    const groups=metricGroup(rows,a=>a.skillSubtype).slice(0,5);
    return {kpis:[['Pos%',`${pct(positive,total)}%`,`${positive}/${total}`],['Exc%',`${pct(perfect,total)}%`,`${perfect}/${total}`],['Errores',errors,`${pct(errors,total)}%`],['Muestra',total,'recepciones']],rows:groups.map(([k,n])=>[REC_SUB[k]||k,n,pct(n,total)+'%'])};
  }
  if(skill==='A'){
    const eff=total?Math.round((perfect-errors-blocked)*100/total):0,groups=metricGroup(rows,a=>a.attackTempo||'Sin tempo').slice(0,6);
    return {kpis:[['Kill%',`${pct(perfect,total)}%`,`${perfect}/${total}`],['EFF',`${eff}%`,`G-P técnico ${perfect-errors-blocked>=0?'+':''}${perfect-errors-blocked}`],['Errores',errors,'ataque'],['Bloqueados',blocked,'ataque']],rows:groups.map(([k,n])=>[TEMPO[k]||k,n,pct(n,total)+'%'])};
  }
  if(skill==='S'){
    return {kpis:[['Aces',perfect,`${pct(perfect,total)}%`],['Errores',errors,`${pct(errors,total)}%`],['Positivos',positive,`${pct(positive,total)}%`],['Saques',total,'total']],rows:metricGroup(rows,a=>a.serveType||'Sin tipo').slice(0,5).map(([k,n])=>[SERVE[k]||k,n,pct(n,total)+'%'])};
  }
  if(skill==='E'){
    return {kpis:[['Pos/#',`${pct(positive,total)}%`,`${positive}/${total}`],['Perfectas',perfect,`${pct(perfect,total)}%`],['Errores',errors,'colocación'],['Total',total,'colocaciones']],rows:metricGroup(rows,a=>a.setTempo||'Sin tempo').slice(0,6).map(([k,n])=>[TEMPO[k]||k,n,pct(n,total)+'%'])};
  }
  if(skill==='B'){
    return {kpis:[['Puntos',perfect,'bloqueo'],['Errores',errors,'bloqueo'],['Positivos',positive,'acciones'],['Total',total,'bloqueos']],rows:metricGroup(rows,a=>a.skillSubtype||'Sin tipo').slice(0,5).map(([k,n])=>[BLOCK_SUB[k]||k,n,pct(n,total)+'%'])};
  }
  return {kpis:[['Pos/#',`${pct(positive,total)}%`,`${positive}/${total}`],['Perfectas',perfect,'#'],['Errores',errors,'='],['Total',total,'acciones']],rows:metricGroup(rows,a=>a.skillSubtype||'Sin subtipo').slice(0,5).map(([k,n])=>[k,n,pct(n,total)+'%'])};
}
function renderIntel(){
  const box=$('v900-intel'),m=active();if(!box||!m)return;
  const rows=allActions(m).filter(a=>a.team===state.team&&a.skill===state.skill),d=intelFor(rows,state.skill);
  safeText('v900-intel-title',SKILL_NAMES[state.skill]||state.skill);
  box.innerHTML=`<div class="v900-intel-kpis">${d.kpis.map(([l,v,s])=>`<div><span>${esc(l)}</span><b>${esc(v)}</b><small>${esc(s)}</small></div>`).join('')}</div><div class="v900-intel-list">${d.rows.length?d.rows.map(([l,n,p])=>`<div class="v900-intel-row"><b>${esc(l)}</b><span>${n}</span><span>${esc(p)}</span></div>`).join(''):'<div class="v900-prep-copy">Todavía no hay muestra codificada para este fundamento.</div>'}</div>`;
}
function renderLiveActions(m){
  const box=$('v900-live-actions'),arr=m?.liveRally?.actions||[];if(!box)return;
  safeText('v900-rally-title',`Rally actual · ${arr.length} ${arr.length===1?'acción':'acciones'}`);
  box.innerHTML=arr.length?arr.map(a=>`<div class="v900-action-chip"><code>${esc(a.code||'—')}</code><span>${esc(playerLabel(a))} · ${esc(SKILL_NAMES[a.skill]||a.skill)}</span></div>`).join(''):'<div class="v900-prep-copy">Añade acciones y cierra el rally con Punto nuestro / Punto rival.</div>';
}
function renderReview(m){
  const box=$('v900-review-rallies'),s=currentSet(m);if(!box||!s)return;
  const rr=[...(s.rallies||[])].slice(-15).reverse();
  box.innerHTML=rr.length?rr.map(r=>`<div class="v900-review-rally"><strong>${r.scoreAfter?.us??0}–${r.scoreAfter?.opponent??0}</strong><div><b>R${r.rotationBefore||m.rotationNo} · ${(r.actions||[]).length} acciones</b><small>${esc((r.actions||[]).map(a=>a.code).join('  ')||'Sin códigos')}</small></div><span class="${r.winner==='ours'?'win':'loss'}">${r.winner==='ours'?'Punto nuestro':'Punto rival'}</span></div>`).join(''):'<div class="v900-prep-copy">Todavía no hay rallies cerrados en este set.</div>';
  safeText('v900-review-save',$('scout-save-badge')?.textContent||'Guardado local activo');
}
function analysisBlock(rows,kind){
  const total=rows.length,p=rows.filter(a=>a.evaluation==='#').length,pos=rows.filter(a=>['#','+'].includes(a.evaluation)).length,err=rows.filter(a=>a.evaluation==='=').length,blk=rows.filter(a=>a.evaluation==='/').length;
  if(kind==='R')return [['Recepciones',total],['Pos%',pct(pos,total)+'%'],['Exc%',pct(p,total)+'%'],['Errores',err]];
  if(kind==='A')return [['Ataques',total],['Kill%',pct(p,total)+'%'],['Errores',err],['Bloqueados',blk],['EFF',total?Math.round((p-err-blk)*100/total)+'%':'—']];
  if(kind==='S')return [['Saques',total],['Aces',p],['Errores',err],['Ace%',pct(p,total)+'%']];
  return [];
}
function renderAnalysis(m){
  const rows=allActions(m),ours=rows.filter(a=>a.team==='ours'),closed=(m.sets||[]).flatMap(s=>s.rallies||[]),ss=setsScore(m);
  const rec=ours.filter(a=>a.skill==='R'),atk=ours.filter(a=>a.skill==='A'),srv=ours.filter(a=>a.skill==='S');
  const side=closed.filter(r=>r.servingBefore==='opponent'),br=closed.filter(r=>r.servingBefore==='ours');
  const sideWon=side.filter(r=>r.winner==='ours').length,brWon=br.filter(r=>r.winner==='ours').length;
  const k=$('v900-analysis-kpis');if(k)k.innerHTML=[
    ['Sets',`${ss.us}–${ss.opponent}`,'resultado'],['Rallies',closed.length,'cerrados'],['Acciones',rows.length,'codificadas'],
    ['Side-out',side.length?pct(sideWon,side.length)+'%':'—',`${sideWon}/${side.length}`],['Break',br.length?pct(brWon,br.length)+'%':'—',`${brWon}/${br.length}`],['G-P rally',`${closed.filter(r=>r.winner==='ours').length-closed.filter(r=>r.winner==='opponent').length>=0?'+':''}${closed.filter(r=>r.winner==='ours').length-closed.filter(r=>r.winner==='opponent').length}`,'partido']
  ].map(([l,v,s])=>`<div><span>${l}</span><b>${v}</b><small>${s}</small></div>`).join('');
  const fill=(id,data)=>{const b=$(id);if(b)b.innerHTML=`<div class="v900-metric-table">${data.map(([l,v])=>`<div class="v900-metric-row"><b>${esc(l)}</b><span>${esc(v)}</span></div>`).join('')}</div>`};
  fill('v900-analysis-reception',analysisBlock(rec,'R'));fill('v900-analysis-attack',analysisBlock(atk,'A'));fill('v900-analysis-serve',analysisBlock(srv,'S'));
  const dv=[
    ['Recepción con subtype',`${rec.filter(a=>a.skillSubtype).length}/${rec.length}`],
    ['Ataque con tempo',`${atk.filter(a=>a.attackTempo).length}/${atk.length}`],
    ['Attack codes',new Set(atk.map(a=>a.attackCode).filter(Boolean)).size],
    ['Ataques por conos',atk.filter(a=>a.endCone).length],
    ['Coordenadas exactas',rows.filter(a=>a.startCoordinate||a.endCoordinate||a.contactCoordinate).length]
  ];
  fill('v900-analysis-dv',dv);
}
async function renderSafety(){
  safeText('v900-save','LOCAL ✓');
  safeText('v900-video',$('scout-v740-video-badge')?.textContent?.replace('VÍDEO ','')||$('v800-video-status')?.textContent||'OFF');
  safeText('v900-vault','Journal + nube');
  safeText('v900-prep-vault','Activo');
}
function renderStatus(m){
  const s=currentSet(m),ss=setsScore(m);
  safeText('v900-match-title',`${teamName()} vs ${m.opponent||'Rival'}`);
  safeText('v900-match-meta',[m.date,m.competition,m.status==='finished'?'Finalizado':'En curso'].filter(Boolean).join(' · '));
  safeText('v900-team-name',teamName());safeText('v900-opponent-name',m.opponent||'Rival');safeText('v900-score',`${s?.scoreUs||0}–${s?.scoreOpponent||0}`);
  safeText('v900-set',String(m.currentSet||1));safeText('v900-sets',`${ss.us}–${ss.opponent} sets`);safeText('v900-rotation',`R${m.rotationNo||1}`);safeText('v900-rival-rotation',`Rival R${m.opponentRotationNo||1}`);
  safeText('v900-service',m.servingTeam==='ours'?'NUESTRO':'RIVAL');safeText('v900-phase',m.servingTeam==='ours'?'K2 · Break':'K1 · Side-out');
  const prep=$('v900-prep-match');if(prep)prep.innerHTML=`<b>${esc(teamName())} vs ${esc(m.opponent||'Rival')}</b><br>${esc(m.date||'Sin fecha')}${m.competition?' · '+esc(m.competition):''}<br>Set ${m.currentSet||1} · R${m.rotationNo||1} vs R${m.opponentRotationNo||1} · ${m.servingTeam==='ours'?'sacamos':'saca el rival'}`;
}
let v900LastSafetyAt=0;
function render(){
  const view=$('scout-workspace-v900');if(!view)return;const m=active(),none=$('v900-no-match'),live=$('v900-live');
  if(!m){none?.classList.remove('hidden');live?.classList.add('hidden');safeText('v900-match-title','Scouting profesional');safeText('v900-match-meta','Partido → Directo → Revisar → Analizar');return}
  none?.classList.add('hidden');live?.classList.remove('hidden');ensurePlayer();renderStatus(m);

  /* V9.0.2: render only the active workspace phase.
     Exhaustive analysis is still computed in full when Analyze is open. */
  if(state.phase==='prepare'){renderCourts()}
  else if(state.phase==='scout'){renderCourts();renderBuilder();renderLiveActions(m)}
  else if(state.phase==='review'){renderReview(m)}
  else if(state.phase==='analyze'){renderAnalysis(m)}

  if(Date.now()-v900LastSafetyAt>5000){v900LastSafetyAt=Date.now();void renderSafety()}
}
function inputMode(mode){state.mode=mode==='code'?'code':'visual';localStorage.setItem('v900_mode',state.mode);$('v900-visual-builder')?.classList.toggle('hidden',state.mode!=='visual');$('v900-code-builder')?.classList.toggle('hidden',state.mode!=='code');$('v900-mode-visual')?.classList.toggle('active',state.mode==='visual');$('v900-mode-code')?.classList.toggle('active',state.mode==='code');if(state.mode==='code')setTimeout(()=>$('v900-code-input')?.focus(),30)}
function phase(p){state.phase=['prepare','scout','review','analyze'].includes(p)?p:'scout';localStorage.setItem('v900_phase',state.phase);document.querySelectorAll('[data-v900-phase]').forEach(b=>b.classList.toggle('active',b.dataset.v900Phase===state.phase));['prepare','scout','review','analyze'].forEach(x=>$(`v900-phase-${x}`)?.classList.toggle('hidden',x!==state.phase));render()}

window.v900SetPhase=phase;
window.v900SetInputMode=inputMode;
window.v900SetTeam=function(t){state.team=t==='opponent'?'opponent':'ours';state.player='';ensurePlayer();renderBuilder();renderCourts()};
window.v900SelectPlayer=function(v){state.player=String(v);state.playerLabel=state.team==='ours'?ownLabel(v):String(v);renderPlayers();renderCourts();updatePreview()};
window.v900SelectCourtPlayer=function(t,v){state.team=t==='opponent'?'opponent':'ours';state.player=String(v);state.playerLabel=state.team==='ours'?ownLabel(v):String(v);renderBuilder();renderCourts()};
window.v900SetSkill=function(s){if(!SKILL_NAMES[s])return;state.skill=s;state.subtype='';state.dvCode='';state.tempo='';state.setType='';state.combo='';state.blockers='';state.blockTarget='';state.locationMode='zones';state.cone='';renderBuilder()};
window.v900SetEval=function(e){state.evaluation=e;document.querySelectorAll('#v900-phase-scout [data-eval]').forEach(b=>b.classList.toggle('active',b.dataset.eval===e));updatePreview()};
window.v900SetField=function(k,v){if(!(k in state))return;state[k]=String(v??'');if(k==='locationMode'){state.destination='';state.destinationSub='';state.cone=''}renderBuilder()};
window.v900SetZone=function(which,v){if(which==='origin')state.origin=String(v);else state.destination=String(v);renderLocations();updatePreview()};
window.v900SetSubzone=function(which,v){if(which==='origin')state.originSub=String(v);else state.destinationSub=String(v);renderLocations();updatePreview()};
window.v900RegisterVisual=function(){
  const m=active();if(!m)return alert('No hay un scouting activo.');
  ensurePlayer();if(!state.player)return alert('Selecciona un jugador.');
  const r=locationRules();if(state.skill==='A'&&state.locationMode==='cones'&&(!state.origin||!state.cone))return alert('En ataque por conos selecciona origen y cono.');
  const start=token(state.origin,state.originSub),end=token(state.destination,state.destinationSub);
  const action={
    team:state.team,playerId:state.team==='ours'?Number(state.player)||null:null,playerLabel:state.team==='opponent'?String(state.playerLabel||state.player||''):'',
    skill:state.skill,evaluation:state.evaluation,
    startZone:r.origin?start:'',endZone:r.destination?end:'',
    contactZone:(state.skill==='R'||state.skill==='D')?end:(state.skill==='B'?start:''),
    sourceZone:(state.skill==='R'||state.skill==='D')?start:'',zoneInferred:false,
    serveType:state.skill==='S'?state.serveType:'',receivedServeType:state.skill==='R'?state.serveType:'',
    phase:state.phaseCode,setTarget:state.skill==='E'?state.combo:'',attackCombo:state.skill==='A'?state.combo:'',
    attackCode:state.skill==='A'?String(state.dvCode||'').toUpperCase():'',setterCall:state.skill==='E'?String(state.dvCode||'').toUpperCase():'',
    attackTempo:state.skill==='A'?state.tempo:'',setTempo:state.skill==='E'?state.tempo:'',dvSetType:(state.skill==='A'||state.skill==='E')?state.setType:'',
    skillSubtype:state.subtype,specialCode:String(state.special||'').toUpperCase(),customCode:String(state.custom||'').toUpperCase(),
    attackDirection:state.skill==='A'?state.direction:'',blockers:(state.skill==='A'||state.skill==='B')?String(state.blockers??''):'',
    blockTargetNumber:state.skill==='B'?String(state.blockTarget||'').replace(/\D/g,'').slice(0,3):'',
    locationMode:state.skill==='A'?state.locationMode:'zones',endCone:state.skill==='A'&&state.locationMode==='cones'?Number(state.cone)||null:null
  };
  if(state.skill==='A'&&state.locationMode==='cones')action.endZone='';
  try{
    const core=window.VC_SCOUT_CORE;if(!core?.push)throw new Error('Core profesional no disponible');
    const ok=core.push(action);if(ok===false)throw new Error('La acción no se ha añadido');
    safeText('v119-save-state','Guardado automático');
    window.VC_SCOUT_RENDER_V92?.requestFast?.('v119-visual-action');
  }catch(err){console.error(err);alert('No se pudo registrar la acción: '+String(err?.message||err));}
};
window.v900RegisterCode=function(){
  const input=$('v900-code-input'),raw=String(input?.value||'').trim();if(!raw)return;
  try{
    const core=window.VC_SCOUT_CORE;if(!core?.register)throw new Error('Parser profesional no disponible');
    const result=core.register(raw,active());if(!result?.ok)throw new Error(result?.error||'No se ha podido registrar el código');
    input.value='';safeText('v900-code-translation','Código registrado directamente en Scouting Pro.');safeText('v119-save-state','Guardado automático');
    window.VC_SCOUT_RENDER_V92?.requestFast?.('v119-code-action');input.focus();
  }catch(err){console.error(err);alert('No se pudo registrar el código: '+String(err?.message||err));}
};
window.v900TranslateCode=function(){
  const raw=String($('v900-code-input')?.value||'').trim().toUpperCase(),box=$('v900-code-translation');if(!box)return;if(!raw){box.textContent='Escribe un código para ver su lectura.';return}
  const m=raw.match(/^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?/);if(!m){box.textContent='Código todavía incompleto o no reconocido.';return}
  const parts=[m[1]?'Rival':'Nuestro',`#${m[2]}`,SKILL_NAMES[m[3]]||m[3],`valoración ${m[4]||'!'}`];
  const st=raw.match(/%(L|R|LOW|OH|MID|HSP|SSP|TIP|1H|2H|BUMP|UND|OTH|COV|AB|EMG|SOFT|AST|ATT)/)?.[1];if(st)parts.push(REC_SUB[st]||ATK_SUB[st]||SET_SUB[st]||DEF_SUB[st]||BLOCK_SUB[st]||st);
  const tempo=raw.match(/~(Q|T|M|H|O)(?=$|[%|*^@?$])/)?.[1];if(tempo)parts.push(TEMPO[tempo]);
  const cone=raw.match(/>C([1-8])/i)?.[1];if(cone)parts.push('cono '+cone);
  box.textContent=parts.join(' · ');
};
window.v900Open=function(){phase(state.phase);inputMode(state.mode);render()};
window.v900Render=render;
window.v900RenderFast=function(){
  const m=active();if(!m)return;
  renderStatus(m);
  if(state.phase==='scout'){renderLiveActions(m);renderIntel()}
};

/* Shared engines remain the source of truth. We only refresh this UI after them. */
if(typeof window.scoutRender==='function'){
  const base=window.scoutRender;
  window.scoutRender=function(...args){const out=base.apply(this,args);if($('scout-workspace-v900')?.classList.contains('active'))try{render()}catch(err){console.warn('V9 workspace render',err)}return out};
}
if(typeof window.scoutOpenSaved==='function'){
  const base=window.scoutOpenSaved;
  window.scoutOpenSaved=function(id){const out=base.apply(this,arguments);setTimeout(()=>{try{showView('scout-workspace-v900',botonVista('scout-workspace-v900'))}catch(_){}},0);return out};
}
if(typeof window.scoutCreateMatch==='function'){
  const base=window.scoutCreateMatch;
  window.scoutCreateMatch=function(...args){const out=base.apply(this,args);setTimeout(()=>{if(active())try{showView('scout-workspace-v900',botonVista('scout-workspace-v900'))}catch(_){}},0);return out};
}
if(typeof window.showView==='function'){
  const base=window.showView;
  window.showView=function(id,btn){const out=base.apply(this,arguments);if(id==='scout-workspace-v900')setTimeout(()=>window.v900Open(),0);return out};
}

/* Safety baseline: checkpoint existing matches before first V9 use. */
if(!localStorage.getItem('v900_safety_baseline_done')){
  localStorage.setItem('v900_safety_baseline_done','1');
}

window.VC_V900_WORKSPACE={
  version:VERSION,
  render,
  state:()=>({...state}),
  diagnostics:()=>({
    version:VERSION,
    active:!!active(),
    bridge:!!bridge(),
    legacyManual:typeof window.scoutAddManualAction==='function',
    legacyCode:typeof window.scoutAddCode==='function',
    pointEngine:typeof window.scoutAwardPoint==='function',
    vault:typeof window.scoutV893CheckpointAll==='function',
    pdf:typeof window.scoutV752ExportAnalysisPDF==='function'
  })
};
})();
