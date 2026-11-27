/* Volley Coach V20.2.0 · Match Workspace Pro
 * Read-only match context + a single visible workflow navigation on top of
 * the existing scouting router. Does not mutate scouting, scores, media or sync.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){
  if(root.VC_MATCH_WORKSPACE_2020)return;
  root.VC_MATCH_WORKSPACE_2020=api;
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});
  else api.boot();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.2.0';
 const MODES=[
  {id:'visual',title:'Pista y acciones',hint:'Selección visual de contactos'},
  {id:'directo',title:'Código directo',hint:'Marcador y código rápido'},
  {id:'video',title:'Vídeo + scouting',hint:'Reproductor y codificación'},
  {id:'revisar',title:'Revisar rallies',hint:'Historial y correcciones'},
  {id:'analizar',title:'Datos en directo',hint:'Resumen de partido'}
 ];
 let mounted=false,updating=false,updates=0,interval=null,lastSignature='',observers=[];
 const doc=()=>root?.document;
 const byId=id=>doc()?.getElementById(id)||null;
 const arr=x=>Array.isArray(x)?x:[];
 const txt=x=>String(x??'').trim();
 const validRotation=x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=6;
 function activeMatch(){try{return root?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
 function currentSet(match){
  if(!match)return null;
  try{const own=root?.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(match);if(own)return own;}catch(_){}
  const sets=arr(match.sets),number=Number(match.currentSet);
  if(Number.isInteger(number)&&number>0)return sets.find(s=>Number(s?.number)===number)||null;
  return null;
 }
 // Pure, read-only projection. Invalid or missing facts remain explicitly unknown.
 function summarizeMatch(match,teamName=''){
  if(!match)return {opponent:'Sin partido activo',team:txt(teamName)||'Nuestro equipo',status:'Sin scouting',set:'—',rotation:'—',rallies:'—',currentActions:'—',recent:[]};
  const sets=arr(match.sets);
  const active=(()=>{
   const n=Number(match.currentSet);
   return Number.isInteger(n)&&n>0?sets.find(s=>Number(s?.number)===n)||null:null;
  })();
  const lastRallies=[];
  // Traverse backwards and only inspect five rallies; no big analysis on each heartbeat.
  for(let si=sets.length-1;si>=0&&lastRallies.length<5;si--){
   const set=sets[si],rallies=arr(set?.rallies);
   for(let ri=rallies.length-1;ri>=0&&lastRallies.length<5;ri--){
    const rally=rallies[ri];if(!rally)continue;
    const winner=rally.winner==='ours'?'Punto propio':rally.winner==='opponent'?'Punto rival':'Sin resultado';
    const actions=arr(rally.actions);
    const last=actions.at(-1);
    lastRallies.push({set:validNumber(set?.number)?Number(set.number):si+1,index:ri+1,winner,
     skill:txt(last?.skill)||'',code:txt(last?.code)||'',actions:actions.length});
   }
  }
  const bridge=root?.VC_RALLY_TIMELINE_2062;
  let recent=lastRallies;
  if(bridge?.VERSION==='20.6.2'&&bridge.readOnly===true&&bridge.canonicalReferences===true&&typeof bridge.recent==='function'){
   try{const typed=bridge.recent(match,5);if(Array.isArray(typed)&&JSON.stringify(typed)===JSON.stringify(lastRallies))recent=typed}catch(_){}
  }
  const rotation=match.rotationNo??match.rotation??null;
  const live=arr(match.liveRally?.actions);
  return {team:txt(teamName)||'Nuestro equipo',opponent:txt(match.opponent)||'Rival sin identificar',
   status:match.status==='finished'?'Finalizado':match.status==='active'||match.status==='live'||match.status==='in_progress'?'En curso':'Estado no registrado',
   set:validNumber(active?.number)?String(active.number):'—',
   rotation:validRotation(rotation)?`R${rotation}`:'—',
   rallies:active?String(arr(active.rallies).length):'—',
   currentActions:match.liveRally?String(live.length):'—',recent};
 }
 function validNumber(x){return x!==''&&x!=null&&Number.isInteger(Number(x))&&Number(x)>0}
 function markup(){
  return `<section id="vc2020-matchbar" class="vc2020-matchbar" aria-label="Centro de trabajo del partido">
   <div class="vc2020-heading"><div class="vc2020-identity"><span class="vc2020-mark" aria-hidden="true">VC</span><div><small>MATCH WORKSPACE · V20.2</small><strong id="vc2020-title">Partido en curso</strong><span id="vc2020-match-state">Conectado al scouting original</span></div></div><div class="vc2020-facts" aria-label="Contexto del partido">
    <div><small>SET</small><strong id="vc2020-set">—</strong></div><div><small>ROTACIÓN</small><strong id="vc2020-rotation">—</strong></div><div><small>RALLIES DEL SET</small><strong id="vc2020-rallies">—</strong></div><div><small>ACCIONES ACTUALES</small><strong id="vc2020-actions">—</strong></div>
   </div></div>
   <nav class="vc2020-modes" aria-label="Fases de trabajo del partido">${MODES.map((m,i)=>`<button type="button" data-vc2020-mode="${m.id}" aria-pressed="false" title="${m.hint}"><span class="vc2020-stage">0${i+1}</span><span>${m.title}</span></button>`).join('')}</nav>
   <div class="vc2020-secondary"><span class="vc2020-safety">Marcador, vídeo, pista y contactos originales · la presencia de dispositivos no confirma una subida</span><details id="vc2020-history"><summary>Últimos 5 rallies <span id="vc2020-history-count"></span></summary><div id="vc2020-history-items" class="vc2020-history-items"></div><button type="button" data-vc2020-review="true">Abrir Revisión</button></details></div>
  </section>`;
 }
 function matchMode(){const value=txt(byId('v800-shell')?.dataset?.vc52Mode);return MODES.some(x=>x.id===value)?value:'visual'}
 function setText(id,value){const node=byId(id),text=txt(value);if(node&&node.textContent!==text)node.textContent=text}
 function visible(){return !!byId('scout-match-mode')?.classList?.contains('active')}
 function updateHistory(entries){
  const host=byId('vc2020-history-items');if(!host)return;
  const signature=JSON.stringify(entries);
  if(host.dataset.signature===signature)return;
  host.dataset.signature=signature;
  host.replaceChildren();
  if(!entries.length){const node=doc().createElement('p');node.textContent='Todavía no hay rallies registrados.';host.appendChild(node);return;}
  for(const r of entries){
   const line=doc().createElement('div');line.className='vc2020-history-row';
   const reference=doc().createElement('strong');reference.textContent=`S${r.set} · Rally ${r.index}`;
   const result=doc().createElement('span');result.textContent=r.winner;
   const action=doc().createElement('small');action.textContent=r.code||r.skill?`Última acción: ${r.code||r.skill}`:'Sin código de contacto';
   line.append(reference,result,action);host.append(line);
  }
 }
 function refresh(){
  if(!mounted||!visible()||updating)return false;
  updating=true;
  try{
   const match=activeMatch();
   let team='';try{team=txt(root?.VC_SCOUT_VIDEO_BRIDGE?.teamName?.())}catch(_){}
   const current=currentSet(match),data=summarizeMatch(match,team);
   // Prefer the same current-set accessor as the existing V8 video engine.
   if(current&&validNumber(current.number)){data.set=String(current.number);data.rallies=String(arr(current.rallies).length)}
   const mode=matchMode();
   const signature=JSON.stringify([data,mode]);
   if(signature===lastSignature)return true;
   lastSignature=signature;
   setText('vc2020-title',data.team+' · '+data.opponent);
   setText('vc2020-match-state',data.status);
   setText('vc2020-set',data.set);setText('vc2020-rotation',data.rotation);
   setText('vc2020-rallies',data.rallies);setText('vc2020-actions',data.currentActions);
   setText('vc2020-history-count',data.recent.length?`(${data.recent.length})`:'');
   updateHistory(data.recent);
   byId('vc2020-matchbar')?.querySelectorAll('[data-vc2020-mode]').forEach(button=>{
    const selected=button.dataset.vc2020Mode===mode;
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-current',selected?'page':'false');
   });
   const panel=byId('vc2020-matchbar');if(panel)panel.dataset.vc2020Mode=mode;
   updates++;return true;
  }finally{updating=false}
 }
 function navigate(mode){
  if(!MODES.some(x=>x.id===mode)||!visible()||typeof root?.vc52SetMode!=='function')return false;
  let ok=false;try{ok=root.vc52SetMode(mode)!==false}catch(_){return false}
  lastSignature='';refresh();return ok;
 }
 function click(event){
  const button=event.target?.closest?.('[data-vc2020-mode],[data-vc2020-review]');
  if(!button||!byId('vc2020-matchbar')?.contains(button))return;
  if(button.dataset.vc2020Mode)navigate(button.dataset.vc2020Mode);
  else if(button.dataset.vc2020Review)navigate('revisar');
 }
 function boot(){
  const live=byId('v800-live'),score=live?.querySelector('.v800-scoreboard'),shell=byId('v800-shell');
  if(!live||!score||!shell||!byId('vc52-modes'))return false;
  if(!byId('vc2020-matchbar')){
   const wrapper=doc().createElement('div');wrapper.innerHTML=markup();
   const panel=wrapper.firstElementChild;score.insertAdjacentElement('afterend',panel);
   panel.addEventListener('click',click);
  }
  if(!mounted){
   mounted=true;
   if(root?.MutationObserver){
    const obs=new root.MutationObserver(()=>{lastSignature='';refresh()});
    obs.observe(shell,{attributes:true,attributeFilter:['data-vc52-mode']});
    observers.push(obs);
    const view=byId('scout-match-mode');
    if(view){const o=new root.MutationObserver(()=>{lastSignature='';refresh()});o.observe(view,{attributes:true,attributeFilter:['class']});observers.push(o)}
   }
   // A low-frequency read-only heartbeat also covers remote data received via Supabase.
   if(typeof root?.setInterval==='function')interval=root.setInterval(()=>{if(!doc()?.hidden&&visible())refresh()},2200);
   doc()?.addEventListener?.('visibilitychange',()=>{if(!doc().hidden){lastSignature='';refresh()}});
  }
  byId('scout-match-mode')?.classList?.add('vc2020-ready');
  lastSignature='';refresh();return true;
 }
 function diagnostics(){return {version:VERSION,mounted,updates,mode:matchMode(),hasMatch:!!activeMatch(),hasOriginalPlayer:!!byId('v800-video-frame'),hasOriginalCode:!!byId('v113-video-code'),hasOriginalScore:!!byId('v800-score-us'),hasOriginalModes:!!byId('vc52-modes'),observers:observers.length,heartbeat:!!interval}}
 return {VERSION,MODES,summarizeMatch,markup,matchMode,boot,refresh,navigate,diagnostics};
});
