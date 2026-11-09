/* Volley Coach V16.3.1 · Sync Pro 2.0 · conservative conflict gate
   Protects edits/deletions from richness-based merges. Does not change Supabase
   schema, does not store scouting contents persistently, never auto-resolves
   divergent versions. Compare-and-set writer remains V15.3.3. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document&&!root.VC_SYNC_SAFETY_1631){root.VC_SYNC_SAFETY_1631=api;api.install(root)}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='16.3.1';
 const omit=new Set(['updatedAt','manualSavedAt','remoteUpdatedAt','cloudUpdatedAt','lastViewedAt']);
 const arr=v=>Array.isArray(v)?v:[];
 const copy=v=>JSON.parse(JSON.stringify(v));
 function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>!omit.has(k)&&value[k]!==undefined).sort().map(k=>[k,canonical(value[k])]));
  return value;
 }
 function digest(value){
  const src=JSON.stringify(canonical(value));
  let a=2166136261,b=5381;
  for(let i=0;i<src.length;i++){const c=src.charCodeAt(i);a=Math.imul(a^c,16777619);b=((b<<5)+b+c)>>>0}
  return `${(a>>>0).toString(16).padStart(8,'0')}${(b>>>0).toString(16).padStart(8,'0')}:${src.length}`;
 }
 function mapMatches(list){const map=new Map();for(const m of arr(list))if(m&&m.id!=null)map.set(String(m.id),m);return map}
 function resolve(local,remote,base){
  if(!local&&!remote)return {choice:'none'};
  if(!local)return {choice:'remote',reason:'solo-nube'};
  if(!remote)return {choice:'local',reason:'solo-local'};
  const lh=digest(local),rh=digest(remote);
  if(lh===rh)return {choice:'local',reason:'iguales',hash:lh};
  if(base&&lh===base&&rh!==base)return {choice:'remote',reason:'actualizado-en-nube'};
  if(base&&rh===base&&lh!==base)return {choice:'local',reason:'actualizado-en-dispositivo'};
  return {choice:'conflict',reason:base?'ambos-modificados':'sin-version-comun',localHash:lh,remoteHash:rh};
 }
 function teamEntries(state){
  const teams=state?.equiposData&&typeof state.equiposData==='object'?state.equiposData:{};
  const index=state?.scoutingSyncIndex&&typeof state.scoutingSyncIndex==='object'?state.scoutingSyncIndex:{};
  const ids=new Set([...Object.keys(teams),...Object.keys(index)]),out={};
  for(const id of ids){
   const fromMain=mapMatches(teams[id]?.scoutingMatches),fromIndex=mapMatches(index[id]);
   const combined=new Map(fromMain);
   for(const [key,m] of fromIndex)if(!combined.has(key))combined.set(key,m);
   out[id]=combined;
  }
  return out;
 }
 function tombstones(state,team){
  const list=arr(state?.equiposData?.[team]?.v956DeletedScoutIds),out=new Map();
  for(const t of list){const id=String(t?.id??t??'');if(!id)continue;out.set(id,Math.max(out.get(id)||0,Number(t?.at)||0))}
  return out;
 }
 function changedAt(m){return Math.max(0,...[m?.updatedAt,m?.manualSavedAt,m?.endedAt,m?.createdAt].map(t=>Date.parse(t||'')||0))}
 function evaluate(localState,remoteState,baselines={}){
  const local=teamEntries(localState),remote=teamEntries(remoteState);
  const teamIds=new Set([...Object.keys(local),...Object.keys(remote)]),plans={},conflicts=[],remoteHashes={};
  for(const team of teamIds){
   const a=local[team]||new Map(),b=remote[team]||new Map();
   const lt=tombstones(localState,team),rt=tombstones(remoteState,team);
   const ids=new Set([...a.keys(),...b.keys()]);
   plans[team]=new Map();
   for(const id of ids){
    const key=`${team}:${id}`,lm=a.get(id)||null,rm=b.get(id)||null;
    let decision=resolve(lm,rm,baselines[key]);
    // Explicit deletion markers take precedence over the old "more actions
    // wins" heuristic. If the survivor has also changed, require a choice.
    const remoteDeleted=!!lm&&(!rm||rt.get(id)>=changedAt(rm))&&!!rt.get(id);
    const localDeleted=!!rm&&(!lm||lt.get(id)>=changedAt(lm))&&!!lt.get(id);
    if(remoteDeleted||localDeleted){
     const survivor=remoteDeleted?lm:rm,prior=baselines[key];
     decision=prior&&digest(survivor)===prior?{choice:'drop',reason:'borrado-confirmado'}:{choice:'conflict',reason:'eliminacion-simultanea',localHash:lm?digest(lm):null,remoteHash:rm?digest(rm):null};
    }
    plans[team].set(id,{...decision,local:lm,remote:rm,key,team,id});
    if(rm)remoteHashes[key]=digest(rm);
    if(decision.choice==='conflict')conflicts.push({...decision,key,team,id,local:lm,remote:rm});
   }
  }
  return {plans,conflicts,remoteHashes,hasLocalOnly:Object.values(plans).some(m=>[...m.values()].some(x=>x.choice==='local'&&!x.remote))};
 }
 function combine(plan){const out={};for(const [team,items] of Object.entries(plan.plans))out[team]=[...items.values()].filter(x=>x.choice!=='none'&&x.choice!=='conflict'&&x.choice!=='drop').map(x=>copy(x.choice==='remote'?x.remote:x.local));return out}
 let win=null,tracked={},account='',pending=new Map(),lastRemote=null,lastReport=null,lastNotice='',wrapperInstalled=false;
 const memoryKey=id=>`vc1631_sync_base_${id}`;
 function currentUser(){try{return typeof cloudUser!=='undefined'&&cloudUser?.id?String(cloudUser.id):''}catch(_){return ''}}
 function ensureAccount(){
  const id=currentUser();if(account===id)return;
  account=id;pending.clear();lastRemote=null;tracked={};
  if(id){try{const raw=JSON.parse(win.localStorage.getItem(memoryKey(id))||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))tracked=raw}catch(_){}}
 }
 function persist(){if(!account)return;try{const rows=Object.entries(tracked).slice(-1500);win.localStorage.setItem(memoryKey(account),JSON.stringify(Object.fromEntries(rows)))}catch(e){lastNotice='No se pudo guardar la referencia local; las copias siguen disponibles.'}}
 function prepare(local,remote){ensureAccount();const report=evaluate(local,remote,tracked);lastReport=report;lastRemote=remote;
  pending.clear();for(const item of report.conflicts)pending.set(item.key,item);
  updateStatus();return report;
 }
 function hasConflicts(){return pending.size>0}
 // V16.5.2: older versions sometimes persisted a new remote baseline before
 // actually installing its scouting. A clean local copy differing from that
 // baseline must be offered for manual recovery, not silently treated as an edit.
 function flagUntrackedLocal(plan){
  if(!plan?.plans)return 0;
  for(const group of Object.values(plan.plans))for(const item of group.values()){
   if(item.reason!=='actualizado-en-dispositivo'||!item.remote||!item.local)continue;
   pending.set(item.key,{...item,choice:'conflict',reason:'copia-local-no-confirmada',localHash:digest(item.local),remoteHash:digest(item.remote)});
  }
  if(pending.size){lastNotice='Hay copias locales distintas de la nube sin una edición pendiente registrada. Descarga ambas copias y selecciona cuál conservar.';updateStatus()}
  return pending.size;
 }
 function confirmRemote(remote){ensureAccount();const remoteMaps=teamEntries(remote);for(const [team,map] of Object.entries(remoteMaps))for(const [id,m] of map)tracked[`${team}:${id}`]=digest(m);persist();}
 function confirmWritten(sent){ensureAccount();const maps=teamEntries(sent);for(const [team,map] of Object.entries(maps))for(const [id,m] of map)tracked[`${team}:${id}`]=digest(m);persist();}
 function reconcile(listPlan){return combine(listPlan)}
 function applyResolved(plan){
  if(!win||!plan||plan.conflicts.length)return false;
  const lists=combine(plan);let changed=false;
  for(const [team,list] of Object.entries(lists)){
   const target=win.equiposData?.[team] || (typeof equiposData!=='undefined'?equiposData?.[team]:null);
   if(!target)continue;
   if(digest(arr(target.scoutingMatches))===digest(list))continue;
   target.scoutingMatches=copy(list);changed=true;
   const active=typeof equipoActivo!=='undefined'?String(equipoActivo):'';
   if(String(team)===active){
    const activeId=typeof scoutingActiveId!=='undefined'?scoutingActiveId:null;
    try{if(typeof scoutingMatches!=='undefined')scoutingMatches=copy(list)}catch(_){}
    try{win.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches?.(copy(list),activeId)}catch(err){console.warn('Sync Pro 2.0: refresco del scouting',err)}
   }
  }
  if(changed){try{win.guardarEstadoLocalSinCloud?.()}catch(_){}}
  return changed;
 }
 function installApplyGuard(){
  if(wrapperInstalled||!win)return;
  const original=win.aplicarEstadoCloud;
  if(typeof original!=='function')return;
  const wrapped=function(remote){
   if(!remote||typeof remote!=='object')return original.apply(this,arguments);
   let plan;
   try{const local=win.estadoLocal?.();plan=prepare(local,remote)}catch(e){lastNotice='No se pudo verificar el conflicto. No se aplicó la nube.';updateStatus();return false}
   if(plan.conflicts.length){lastNotice=`${plan.conflicts.length} scouting(s) tienen versiones incompatibles. No se ha aplicado la nube.`;updateStatus();return false}
   const output=original.apply(this,arguments);
   // The legacy richness-based merge may choose an older copy that contains
   // more actions. Restore the decision taken from confirmed local baselines.
   applyResolved(plan);
   confirmRemote(remote);updateStatus();
   return output;
  };
  wrapped.__vc1631=true;wrapped.__vc1631Base=original;
  win.aplicarEstadoCloud=wrapped;try{aplicarEstadoCloud=wrapped}catch(_){}
  wrapperInstalled=true;
 }
 function allowRealtime(){
  // Broadcast is unconfirmed and may be out of order. Receive durable changes
  // via Postgres/CAS instead. Presence and the counter remain untouched.
  return false;
 }
 function status(){ensureAccount();return {version:VERSION,connected:!!account,blocked:pending.size>0,conflicts:pending.size,baselineCount:Object.keys(tracked).length,notice:lastNotice};}
 function updateStatus(){
  if(!win?.document)return;
  const b=win.document.getElementById('vc1631-conflict-count');if(b)b.textContent=pending.size?`${pending.size} pendiente(s)`:'Sin conflictos';
  const btn=win.document.getElementById('vc1631-conflicts-open');if(btn){btn.classList.toggle('has-conflicts',pending.size>0);btn.textContent=pending.size?`Revisar ${pending.size} conflicto(s)`:'Revisar conflictos'}
  const strip=win.document.getElementById('vc1631-sync-warning');if(strip){strip.hidden=!pending.size;strip.textContent=pending.size?`${pending.size} conflicto(s) de scouting: la nube está bloqueada hasta resolverlos.`:''}
  if(win.document.getElementById('vc1631-safety-modal')?.dataset.open==='true')render();
 }
 function download(name,obj){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));const a=win.document.createElement('a');a.href=url;a.download=name;win.document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000)}
 function backups(kind){
  try{
   const data=kind==='local'?win.estadoLocal?.():lastRemote;
   if(!data)throw Error('No hay una copia disponible en este momento.');
   download(`volley-coach-v1631-${kind}-${new Date().toISOString().slice(0,10)}.json`,data);
   lastNotice=`Copia ${kind==='local'?'local':'de la nube'} descargada. Conservar en privado.`;
  }catch(e){lastNotice=String(e?.message||e)}updateStatus();
 }
 function resolveConflict(key,choice){
  ensureAccount();const item=pending.get(key);if(!item||!lastRemote)return false;
  const live=win.estadoLocal?.();const match=teamEntries(live)?.[item.team]?.get(item.id)||null;
  if(digest(match)!==digest(item.local)){
   lastNotice='El scouting local cambió mientras revisabas el conflicto. Sincroniza de nuevo para revisarlo.';updateStatus();return false;
  }
  if(choice==='local'){
   tracked[key]=item.remoteHash;pending.delete(key);persist();
   lastNotice='Has elegido tu copia local. Queda pendiente de confirmación en nube.';
   try{win.VC_V962_CLOUD_EFFICIENT?.markDirty?.('vc1631-resuelto-local')}catch(_){}
  }else if(choice==='remote'){
   const t=(typeof equiposData!=='undefined'?equiposData?.[item.team]:win.equiposData?.[item.team]);
   if(!t){lastNotice='No se pudo localizar el equipo local.';return false}
   t.scoutingMatches=arr(t.scoutingMatches).filter(m=>String(m.id)!==item.id).concat(copy(item.remote));
   if(String(item.team)===String(typeof equipoActivo!=='undefined'?equipoActivo:'')){
    try{scoutingMatches=copy(t.scoutingMatches)}catch(_){}
    try{win.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches?.(copy(t.scoutingMatches),typeof scoutingActiveId!=='undefined'?scoutingActiveId:null)}catch(_){}
   }
   try{win.guardarEstadoLocalSinCloud?.()}catch(e){lastNotice='No se pudo guardar el partido elegido: '+String(e?.message||e);return false}
   tracked[key]=item.remoteHash;pending.delete(key);persist();
   lastNotice='Se ha conservado la copia de la nube localmente. Comprueba el scouting antes de continuar.';
  }else return false;
  // Other conflicts may still exist; do not authorize a bulk sync until all
  // are individually reviewed.
  updateStatus();return true;
 }
 function ensureModal(){
  let m=win.document.getElementById('vc1631-safety-modal');if(m)return m;
  m=win.document.createElement('div');m.id='vc1631-safety-modal';m.className='vc1631-modal';m.hidden=true;
  m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Conflictos de sincronización');
  m.innerHTML=`<section class="vc1631-card"><header><div><small>VOLLEY COACH · SYNC PRO 2.0</small><h2>Protección de conflictos</h2></div><button type="button" data-action="close">Cerrar</button></header><p class="vc1631-explain">Si dos dispositivos modifican el mismo scouting de forma incompatible, la aplicación conserva las copias y detiene la subida automática. Guarda las dos copias antes de elegir.</p><div class="vc1631-actions"><button type="button" data-action="local-backup">Descargar copia local</button><button type="button" data-action="remote-backup">Descargar copia nube</button></div><label class="vc1631-ack"><input type="checkbox" id="vc1631-ack"/> Confirmo que he guardado las copias antes de resolver los conflictos.</label><div id="vc1631-conflict-rows"></div><p id="vc1631-note" role="status"></p></section>`;
  win.document.body.appendChild(m);
  m.addEventListener('click',e=>{
   if(e.target===m){close();return}
   const b=e.target.closest('button[data-action]');if(!b)return;
   const action=b.dataset.action;
   if(action==='close'){close();return}
   if(action==='local-backup'||action==='remote-backup'){backups(action==='local-backup'?'local':'remote');render();return}
   if(!win.document.getElementById('vc1631-ack')?.checked)return;
   if(action==='choose-local'||action==='choose-remote'){
    const key=b.dataset.key;
    resolveConflict(key,action==='choose-local'?'local':'remote');render();
   }
  });
  m.addEventListener('change',e=>{if(e.target.id==='vc1631-ack')render()});
  win.document.addEventListener('keydown',e=>{if(e.key==='Escape'&&m.dataset.open==='true')close()});
  return m;
 }
 function render(){const m=ensureModal(),rows=win.document.getElementById('vc1631-conflict-rows');rows.replaceChildren();
  const ok=!!win.document.getElementById('vc1631-ack')?.checked;
  if(!pending.size){const p=win.document.createElement('p');p.textContent='No hay conflictos pendientes. Los cambios confirmados se reciben mediante la nube.';rows.append(p)}
  else for(const item of pending.values()){
   const card=win.document.createElement('article');card.className='vc1631-conflict';
   const heading=win.document.createElement('h3');heading.textContent=`Equipo ${item.team} · Scouting ${item.id}`;card.append(heading);
   const detail=win.document.createElement('p');detail.textContent=`Dos versiones distintas (${item.reason}). No se aplicará ninguna automáticamente.`;card.append(detail);
   for(const [action,label] of [['choose-local','Conservar este dispositivo'],['choose-remote','Conservar la nube']]){
    const b=win.document.createElement('button');b.type='button';b.dataset.action=action;b.dataset.key=item.key;b.textContent=label;b.disabled=!ok;card.append(b)
   }
   rows.append(card);
  }
  const status=win.document.getElementById('vc1631-note');if(status)status.textContent=lastNotice||'El contador de dispositivos sigue disponible en Sync Pro.';
 }
 function open(){const m=ensureModal();m.hidden=false;m.dataset.open='true';render()}
 function close(){const m=win?.document?.getElementById('vc1631-safety-modal');if(m){m.hidden=true;m.dataset.open='false'}}
 function install(root){
  win=root;installApplyGuard();
  const css=win.document.createElement('style');css.id='vc1631-safety-style';css.textContent=`
 .vc1631-modal[hidden]{display:none!important}.vc1631-modal{position:fixed;inset:0;z-index:2147483600;background:rgba(12,30,48,.68);display:grid;place-items:center;padding:16px}.vc1631-card{width:min(700px,96vw);max-height:92vh;overflow:auto;background:#fff;color:#15354e;border-radius:16px;padding:22px;font:13px/1.5 system-ui;box-shadow:0 18px 60px #0a1c3044}.vc1631-card header{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #dce6ed;padding-bottom:10px}.vc1631-card header small{font-size:10px;letter-spacing:.1em;color:#5a8ba9;font-weight:800}.vc1631-card h2{font-size:21px;margin:3px 0;color:#15354e}.vc1631-card button{cursor:pointer;border:1px solid #c9dce8;background:#f2f8fc;color:#195b84;padding:9px 12px;border-radius:8px;font-weight:750;margin:4px}.vc1631-card button:disabled{opacity:.4;cursor:not-allowed}.vc1631-explain{line-height:1.55;color:#56758b}.vc1631-actions{display:flex;flex-wrap:wrap;gap:8px}.vc1631-ack{display:flex;gap:10px;align-items:flex-start;padding:12px 0;color:#23506f}.vc1631-ack input{margin-top:3px;flex:none}.vc1631-conflict{margin:8px 0;border:1px solid #e5d0ba;background:#fff9f2;padding:12px;border-radius:10px}.vc1631-conflict h3{margin:0 0 5px;font-size:14px;color:#67472d}.vc1631-conflict p{margin:0 0 10px;color:#80634b}#vc1631-note{min-height:18px;color:#53758c}`;win.document.head.appendChild(css);
  const ready=()=>{ensureModal();updateStatus()};if(win.document.readyState==='loading')win.document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 }
 return {version:VERSION,installed:true,resolve,evaluate,digest,canonical,teamEntries,prepare,flagUntrackedLocal,confirmRemote,confirmWritten,hasConflicts,status,open,close,allowRealtime,install,applyResolved,resolveConflict,diagnostics:status};
});
