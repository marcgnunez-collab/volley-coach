/* Volley Coach V16.5.3 · Planificación entre dispositivos.
   Recuperación conservadora de sesiones por ID. Nunca sustituye el estado completo,
   ni resuelve a ciegas ediciones divergentes, ni cambia la sincronización del scouting. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document&&!root.VC_TRAINING_SYNC_1653){root.VC_TRAINING_SYNC_1653=api;api.install(root)}
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='16.5.3', TEAMS=['infantil','cadete'];
 const list=x=>Array.isArray(x)?x:[];
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 const clone=x=>JSON.parse(JSON.stringify(x));
 const key=x=>x?.id==null?'':String(x.id);
 const omit=new Set(['updatedAt','guardadoPlanificacionEn','actualizadoEnSesion','historialGuardadoEn']);
 function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>!omit.has(k)).map(k=>[k,stable(value[k])]));
  return value;
 }
 function digest(v){
  // Compact non-cryptographic fingerprint for divergence checks; no user content
  // is copied into the per-account baseline in localStorage.
  const str=JSON.stringify(stable(v));let h=0xcbf29ce484222325n;
  for(let i=0;i<str.length;i++){h^=BigInt(str.charCodeAt(i));h=(h*0x100000001b3n)&0xffffffffffffffffn}
  return h.toString(16).padStart(16,'0');
 }
 function mergePlans(localPlans,remotePlans,base={},localDeleted=[],remoteDeleted=[]){
  const l=new Map(list(localPlans).filter(x=>key(x)).map(x=>[key(x),x]));
  const r=new Map(list(remotePlans).filter(x=>key(x)).map(x=>[key(x),x]));
  const tombLocal=new Set(list(localDeleted).map(String)),tombRemote=new Set(list(remoteDeleted).map(String));
  const out=new Map(l),added=[],updated=[],conflicts=[];
  for(const [id,p] of r){
   if(tombLocal.has(id)){
    if(digest(p)!==base[id])conflicts.push({id,kind:'eliminación-local-con-edición-remota'});
    continue;
   }
   const own=l.get(id);
   if(!own){if(tombRemote.has(id))continue;out.set(id,clone(p));added.push(id);continue}
   const a=digest(own),b=digest(p);
   if(a===b)continue;
   const prev=base[id];
   if(prev&&a===prev){out.set(id,clone(p));updated.push(id)}
   else if(prev&&b===prev){/* Keep our locally edited copy; no blind remote overwrite. */}
   else conflicts.push({id,kind:prev?'edición-simultánea':'sin-versión-común'});
  }
  for(const id of tombRemote){
   if(!out.has(id)||tombLocal.has(id))continue;
   const local=out.get(id),prev=base[id];
   if(prev&&digest(local)===prev){out.delete(id);updated.push(id)}
   else conflicts.push({id,kind:'borrado-remoto-sin-confirmar'});
  }
  return {plans:[...out.values()].sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||''))||String(a.id).localeCompare(String(b.id))),added,updated,conflicts};
 }
 let win=null,baseline={},scope='',last={at:0,received:0,updated:0,conflicts:[],teams:{},lastMessage:'Sin comprobación de planificación'};
 function account(){try{return String(typeof cloudUser!=='undefined'?cloudUser?.id||'':'')}catch(_){return ''}}
 function selectScope(){const uid=account();if(uid===scope)return;scope=uid;baseline={};if(!uid)return;try{const old=JSON.parse(win.localStorage.getItem('vc1653_planning_baseline_'+uid)||'{}');baseline=object(old)}catch(_){baseline={}}}
 function baselineFor(team){selectScope();return object(baseline[team])}
 function confirm(state){
  if(!win)return;selectScope();if(!scope)return;const teams=object(state?.equiposData);
  for(const team of TEAMS){const plans=list(teams[team]?.planificacion);baseline[team]=Object.fromEntries(plans.filter(p=>key(p)).map(p=>[key(p),digest(p)]))}
  try{win.localStorage.setItem('vc1653_planning_baseline_'+scope,JSON.stringify(baseline))}catch(e){console.warn('V16.5.3 baseline',e)}
  observe(state);
 }
 function observe(state){
  if(!state?.equiposData)return;
  last.at=Date.now();last.teams=Object.fromEntries(TEAMS.map(t=>[t,{remote:list(state.equiposData?.[t]?.planificacion).length,local:list(typeof equiposData!=='undefined'?equiposData?.[t]?.planificacion:[]).length,received:0}]));
  last.lastMessage='Nube consultada. Compara los recuentos por equipo.';
 }
 function inspect(local,remote){
  const l=object(local?.equiposData),r=object(remote?.equiposData),teams={};let received=0,updated=0;const conflicts=[];
  for(const team of TEAMS){const ls=object(l[team]),rs=object(r[team]);const result=mergePlans(ls.planificacion,rs.planificacion,baselineFor(team),ls.planningDeletedIds,rs.planningDeletedIds);teams[team]=result;received+=result.added.length;updated+=result.updated.length;for(const c of result.conflicts)conflicts.push({team,...c})}
  return {teams,received,updated,conflicts};
 }
 function pullSafe(remote){
  if(!win||!remote||!remote.equiposData)return {received:0,updated:0,conflicts:[]};
  let local;
  try{
   if(typeof guardarEquipoEnMemoria==='function')guardarEquipoEnMemoria();
   local=typeof estadoLocal==='function'?estadoLocal():null;
  }catch(e){console.warn('V16.5.3 state read',e);return {received:0,updated:0,conflicts:[{kind:'lectura-local-fallida'}]}}
  if(!local)return {received:0,updated:0,conflicts:[]};
  const result=inspect(local,remote);
  const changed=result.received+result.updated>0;
  if(changed){
   try{
    for(const team of TEAMS){const t=typeof equiposData!=='undefined'?equiposData?.[team]:null;if(!t)continue;const m=result.teams[team];if(!m.added.length&&!m.updated.length)continue;
     t.planificacion=clone(m.plans);
     t.planningDeletedIds=[...new Set([...list(t.planningDeletedIds),...list(remote.equiposData?.[team]?.planningDeletedIds)].map(String))];
     if(typeof equipoActivo!=='undefined'&&String(equipoActivo)===team){planificacion=clone(m.plans);if(typeof meta!=='undefined'&&meta?.planificacionId){const found=m.plans.find(p=>String(p.id)===String(meta.planificacionId));if(!found)meta.planificacionId=null}}
    }
    if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
    if(typeof renderPlanificacion==='function'&&win.document.getElementById('planificacion')?.classList.contains('active'))renderPlanificacion();
    if(typeof renderDashboard==='function'&&win.document.getElementById('dashboard')?.classList.contains('active'))renderDashboard();
    if(typeof renderAvisoPlanHoy==='function')renderAvisoPlanHoy();
   }catch(e){console.warn('V16.5.3 apply',e);return {received:0,updated:0,conflicts:[{kind:'aplicación-fallida'}]}}
  }
  last={at:Date.now(),received:result.received,updated:result.updated,conflicts:result.conflicts,teams:Object.fromEntries(TEAMS.map(t=>[t,{remote:list(remote.equiposData?.[t]?.planificacion).length,local:list(local.equiposData?.[t]?.planificacion).length,received:result.teams[t].added.length}])),lastMessage:result.conflicts.length?`${result.conflicts.length} sesión(es) con cambios incompatibles; no se han sobrescrito.`:changed?`${result.received} sesión(es) nueva(s) y ${result.updated} actualizada(s) recibidas.`:'No hay nuevas sesiones que recuperar.'};
  try{win.dispatchEvent(new CustomEvent('vc:planning-sync',{detail:{received:result.received,updated:result.updated,conflicts:result.conflicts.length}}))}catch(_){ }
  return {received:result.received,updated:result.updated,conflicts:result.conflicts};
 }
 function prepareUpload(local,remote){
  if(!remote||!remote.equiposData)return {state:null,added:0,updated:0,conflicts:[]};
  const output=clone(remote),lt=object(local?.equiposData),rt=object(remote.equiposData);
  let added=0,updated=0;const conflicts=[];
  for(const team of TEAMS){
   const a=object(rt[team]),b=object(lt[team]);
   // Keep EVERY other remote field (scoutings, training drafts, players, etc.).
   const merge=mergePlans(a.planificacion,b.planificacion,baselineFor(team),a.planningDeletedIds,b.planningDeletedIds);
   for(const issue of merge.conflicts)conflicts.push({team,...issue});
   if(merge.added.length||merge.updated.length){
    output.equiposData[team]=output.equiposData[team]||{};
    output.equiposData[team].planificacion=clone(merge.plans);
    output.equiposData[team].planningDeletedIds=[...new Set([...list(a.planningDeletedIds),...list(b.planningDeletedIds)].map(String))];
    added+=merge.added.length;updated+=merge.updated.length;
   }
  }
  // A conflicting edit of the same session cannot be resolved with a timestamp.
  // Do not write any changes while that remains ambiguous.
  return {state:conflicts.length?null:(added+updated?output:null),added,updated,conflicts};
 }
 function confirmPartial(state){
  // Only the planning archive was acknowledged, not the rest of the local state.
  if(!win||!state)return;selectScope();if(!scope)return;
  for(const team of TEAMS){const found=list(state.equiposData?.[team]?.planificacion);const item=baseline[team]=object(baseline[team]);for(const p of found)if(key(p))item[key(p)]=digest(p)}
  try{win.localStorage.setItem('vc1653_planning_baseline_'+scope,JSON.stringify(baseline))}catch(_){}
  const current=Object.fromEntries(TEAMS.map(t=>[t,{remote:list(state.equiposData?.[t]?.planificacion).length,local:list(typeof equiposData!=='undefined'?equiposData?.[t]?.planificacion:[]).length}]));
  last={...last,at:Date.now(),teams:current,lastMessage:'Sesiones de Planificación confirmadas en nube; otras modificaciones pueden seguir pendientes.'};
 }
 function markDeleted(team,id){if(!win||!key({id}))return;const t=typeof equiposData!=='undefined'?equiposData?.[team]:null;if(!t)return;t.planningDeletedIds=[...new Set([...list(t.planningDeletedIds),String(id)])]}
 function diagnostics(){
  const teams=Object.fromEntries(TEAMS.map(t=>[t,{...object(last.teams?.[t]),local:list(typeof equiposData!=='undefined'?equiposData?.[t]?.planificacion:[]).length}]));
  return {version:VERSION,...last,teams,accountConnected:!!scope}
 }
 function install(w){win=w;selectScope()}
 return {version:VERSION,mergePlans,inspect,confirm,observe,pullSafe,prepareUpload,confirmPartial,markDeleted,diagnostics,install};
});
