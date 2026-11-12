
(()=>{
'use strict';
const VERSION='16.5.4-legacy',DEVICE_KEY='vc_v138_device_id',DEVICE_NAME_KEY='vc_v138_device_name',POLL_ACTIVE_MS=18000,POLL_IDLE_MS=30000,FAST_EVENT='match_patch';
const $=id=>document.getElementById(id),now=()=>Date.now(),clone=v=>{try{return structuredClone(v)}catch(_){try{return JSON.parse(JSON.stringify(v))}catch(__){return v}}};
const isMobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||matchMedia('(pointer:coarse)').matches;
function makeId(){try{return crypto.randomUUID()}catch(_){return 'dev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10)}}
const deviceId=localStorage.getItem(DEVICE_KEY)||makeId();localStorage.setItem(DEVICE_KEY,deviceId);const defaultName=isMobile()?'Móvil':'Portátil / PC',deviceName=localStorage.getItem(DEVICE_NAME_KEY)||defaultName;localStorage.setItem(DEVICE_NAME_KEY,deviceName);
let seq=Number(localStorage.getItem('vc_v138_device_seq'))||0,lastChangedAt=Number(localStorage.getItem('vc_v138_device_changed'))||0,channel=null,channelUser='',rtState='offline',lastRemoteAt=0,lastRemoteDevice='',lastRemoteName='',lastPullAt=0,pollTimer=null,remoteSyncTimer=null,fastTimer=null,fastApplying=false,localPersistTimer=null,knownDevices={};
try{knownDevices=JSON.parse(localStorage.getItem('vc_v138_known_devices')||'{}')||{}}catch(_){knownDevices={}}
function active(){try{return window.MatchState?.getActive?.()||window.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
function currentSet(m=active()){try{return window.MatchState?.getSet?.(m)||window.VC_SCOUT_VIDEO_BRIDGE?.getCurrentSet?.(m)||null}catch(_){return null}}
function cloudConnected(){try{return !!cloudClient&&!!cloudUser}catch(_){return false}}
function persistKnown(){try{localStorage.setItem('vc_v138_known_devices',JSON.stringify(knownDevices))}catch(_){}}
function touchMeta(reason='change'){seq++;lastChangedAt=now();try{localStorage.setItem('vc_v138_device_seq',String(seq));localStorage.setItem('vc_v138_device_changed',String(lastChangedAt))}catch(_){};knownDevices[deviceId]={id:deviceId,name:deviceName,type:isMobile()?'mobile':'desktop',lastSeen:lastChangedAt,seq,reason};persistKnown();render();return seq}
function ingestMeta(meta){if(!meta||typeof meta!=='object')return;const devices=meta.devices&&typeof meta.devices==='object'?meta.devices:{};Object.entries(devices).forEach(([id,d])=>{const prev=knownDevices[id]||{};if(Number(d?.lastSeen||0)>=Number(prev.lastSeen||0))knownDevices[id]={...prev,...d,id}});if(meta.deviceId){const prev=knownDevices[meta.deviceId]||{};knownDevices[meta.deviceId]={...prev,id:meta.deviceId,name:meta.deviceName||prev.name||'Otro dispositivo',type:meta.deviceType||prev.type||'',lastSeen:Number(meta.changedAt)||Number(prev.lastSeen)||0,seq:Number(meta.seq)||Number(prev.seq)||0}}persistKnown()}
function buildMeta(base={}){const devices={...(base.devices||{}),...knownDevices};devices[deviceId]={id:deviceId,name:deviceName,type:isMobile()?'mobile':'desktop',lastSeen:lastChangedAt||now(),seq,activeMatchId:Number(active()?.id)||null};return{version:VERSION,deviceId,deviceName,deviceType:isMobile()?'mobile':'desktop',seq,changedAt:lastChangedAt||0,activeMatchId:Number(active()?.id)||null,devices}}
function installStateMeta(){const base=window.estadoLocal;if(typeof base==='function'&&!base.__v138){const wrapped=function(){const st=base.apply(this,arguments)||{};st.v138SyncMeta=buildMeta(st.v138SyncMeta||{});return st};wrapped.__v138=true;window.estadoLocal=wrapped;try{estadoLocal=wrapped}catch(_){}}const apply=window.aplicarEstadoCloud;if(typeof apply==='function'&&!apply.__v138){const wrapped=function(state){try{ingestMeta(state?.v138SyncMeta)}catch(_){}const out=apply.apply(this,arguments);setTimeout(render,0);return out};wrapped.__v138=true;window.aplicarEstadoCloud=wrapped;try{aplicarEstadoCloud=wrapped}catch(_){}}}
function ensureUI(){if($('v138-device-strip'))return true;const save=$('v137-save-strip'),shell=document.querySelector('#scout-workspace-v900 .v900-shell');if(!save&&!shell)return false;const n=document.createElement('div');n.id='v138-device-strip';n.className='v138-device-strip';n.innerHTML=`<div class="v138-device-cell" id="v138-this-cell"><span>Este dispositivo</span><b id="v138-this-main">${deviceName}</b><small id="v138-this-sub">${isMobile()?'móvil':'portátil / PC'} · ${deviceId.slice(0,8)}</small></div><div class="v138-device-cell" id="v138-live-cell"><span>Sincronización en vivo</span><b id="v138-live-main" class="v138-mobile-sync-badge">Preparando…</b><small id="v138-live-sub">Broadcast inmediato + nube segura</small></div><div class="v138-device-cell" id="v138-peer-cell"><span>Otro dispositivo</span><b id="v138-peer-main">—</b><small id="v138-peer-sub">abre la app con la misma cuenta</small></div><div class="v138-device-cell" id="v138-remote-cell"><span>Último cambio remoto</span><b id="v138-remote-main">—</b><small id="v138-remote-sub">sin cambios recibidos</small></div>`;if(save)save.insertAdjacentElement('afterend',n);else shell.prepend(n);return true}
function age(t){if(!t)return'—';const s=Math.max(0,Math.round((now()-Number(t))/1000));return s<2?'ahora':s<60?`hace ${s} s`:s<3600?`hace ${Math.floor(s/60)} min`:new Date(Number(t)).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
function setCell(prefix,state,main,sub){const c=$(`v138-${prefix}-cell`),b=$(`v138-${prefix}-main`),s=$(`v138-${prefix}-sub`);if(c)c.dataset.state=state||'';if(b)b.textContent=main;if(s)s.textContent=sub||''}
function peer(){return Object.values(knownDevices).filter(d=>d&&d.id!==deviceId).sort((a,b)=>Number(b.lastSeen||0)-Number(a.lastSeen||0))[0]||null}
function render(){if(!ensureUI())return;const p=peer();setCell('this','ok',deviceName,`${isMobile()?'Móvil':'Portátil / PC'} · ${deviceId.slice(0,8)}`);if(!cloudConnected())setCell('live','pending','Nube no conectada','inicia sesión en ambos dispositivos');else if(rtState==='SUBSCRIBED')setCell('live','ok','Tiempo real inmediato ✓','Broadcast activo · guardado durable en segundo plano');else if(rtState==='CHANNEL_ERROR'||rtState==='TIMED_OUT'||rtState==='CLOSED')setCell('live','pending','Reconectando…','los datos locales siguen protegidos');else setCell('live','pending','Conectando…','preparando canal Realtime');if(p)setCell('peer',now()-Number(p.lastSeen||0)<120000?'ok':'',p.name||'Otro dispositivo',`${p.type==='mobile'?'Móvil':'PC'} · ${age(p.lastSeen)}`);else setCell('peer','','—','abre la app con la misma cuenta');if(lastRemoteAt)setCell('remote','ok',age(lastRemoteAt),`${lastRemoteName||lastRemoteDevice||'otro dispositivo'} · actualización instantánea`);else setCell('remote','','—','sin cambios recibidos en esta sesión')}
function scheduleLocalPersist(){clearTimeout(localPersistTimer);localPersistTimer=setTimeout(()=>{try{guardarEstadoLocalSinCloud?.()}catch(_){}},1400)}
function findLocalMatch(teamId,matchId){const t=equiposData?.[teamId],list=Array.isArray(t?.scoutingMatches)?t.scoutingMatches:[];return list.find(m=>Number(m?.id)===Number(matchId))||null}
function applyPatchToMatch(m,p){if(!m||!p)return false;const reserved=new Set(['set','setIndex','setSummaries','updatedAt','remoteUpdatedAt']);Object.keys(p).forEach(k=>{if(!reserved.has(k)&&p[k]!==undefined)m[k]=clone(p[k])});if(p.set){m.sets=Array.isArray(m.sets)?m.sets:[];const idx=Math.max(0,Number(p.setIndex)||0);m.sets[idx]=clone(p.set)}if(Array.isArray(p.setSummaries)){m.sets=Array.isArray(m.sets)?m.sets:[];p.setSummaries.forEach((s,i)=>{if(!s)return;if(!m.sets[i])m.sets[i]={};['scoreUs','scoreOpponent','finished','winner','number','setNo'].forEach(k=>{if(s[k]!==undefined)m.sets[i][k]=clone(s[k])})})}return true}
function refreshFastUi(){try{window.MatchState?.sync?.('remote-fast')}catch(_){};try{window.v900RenderFast?.();window.VC_V121?.render?.();window.VC_V123?.render?.();window.v119RefreshPro?.()}catch(_){};if(document.getElementById('scout-match-mode')?.classList.contains('active'))try{window.v800Render?.()}catch(_){} }
function localCloudDirty(){try{return window.VC_V962_CLOUD_EFFICIENT?.diagnostics?.().dirty===true||localStorage.getItem('v1523_cloud_dirty')==='1'}catch(_){return localStorage.getItem('v1523_cloud_dirty')==='1'}}
const lastFastSequence=new Map();let protectedLocalChanges=0,staleFastMessages=0;
function applyFastPatch(payload){
 if(!payload||payload.deviceId===deviceId)return false;
 const teamId=String(payload.teamId||'');
 if(!teamId||typeof equiposData==='undefined')return false;
 // V16.0.4.0: never apply a transient broadcast over local unconfirmed changes.
 // The version-checked Supabase merge is the safe fallback, also while offline.
 const orderKey=String(payload.deviceId||'')+'|'+teamId+'|'+String(payload.matchId||payload.match?.id||'');
 const incomingSeq=Number(payload.seq)||0;
 if(incomingSeq>0 && lastFastSequence.has(orderKey)&&incomingSeq<=lastFastSequence.get(orderKey)){
   staleFastMessages++;
   return false;
 }
 if(localCloudDirty()){
   // Remember the sequence too: a delayed duplicate must not replay after cloud reconciliation.
   if(incomingSeq>0)lastFastSequence.set(orderKey,incomingSeq);
   protectedLocalChanges++;
   clearTimeout(remoteSyncTimer);
   remoteSyncTimer=setTimeout(()=>void syncRemote('protected-local-edits'),350);
   return false;
 }
 fastApplying=true;try{if(!equiposData[teamId]&&typeof estadoEquipoVacio==='function')equiposData[teamId]=estadoEquipoVacio(teamId);const team=equiposData[teamId];let target=findLocalMatch(teamId,payload.matchId||payload.match?.id);if(payload.mode==='full'&&payload.match){const local=Array.isArray(team.scoutingMatches)?team.scoutingMatches:[];if(!localCloudDirty()){team.scoutingMatches=[...local.filter(m=>Number(m?.id)!==Number(payload.match.id)),clone(payload.match)]}else{team.scoutingMatches=typeof fusionarScoutingsSeguros==='function'?fusionarScoutingsSeguros(local,[payload.match]):local}target=findLocalMatch(teamId,payload.match.id)}else if(target&&payload.patch)applyPatchToMatch(target,payload.patch);else{setTimeout(()=>syncRemote('missing-fast'),60);return false}if(teamId===String(equipoActivo)){try{scoutingMatches=typeof scoutClone==='function'?scoutClone(team.scoutingMatches):clone(team.scoutingMatches)}catch(_){};if(Number(scoutingActiveId)===Number(target?.id))refreshFastUi()}if(incomingSeq>0)lastFastSequence.set(orderKey,incomingSeq);scheduleLocalPersist();lastRemoteAt=now();lastRemoteDevice=String(payload.deviceId||'');lastRemoteName=String(payload.deviceName||'Otro dispositivo');knownDevices[lastRemoteDevice]={...(knownDevices[lastRemoteDevice]||{}),id:lastRemoteDevice,name:lastRemoteName,type:payload.deviceType||'',lastSeen:lastRemoteAt,seq:Number(payload.seq)||0};persistKnown();render();clearTimeout(remoteSyncTimer);remoteSyncTimer=setTimeout(()=>void syncRemote('fast-followup'),1700);return true}finally{fastApplying=false}}
function onFast(message){try{applyFastPatch(message?.payload||message)}catch(err){console.warn('V15.2.6 fast patch',err)}}
function buildFastPayload(reason){const m=active();if(!m)return null;const s=currentSet(m),setIndex=Math.max(0,(Number(m.currentSet)||1)-1),why=String(reason||'');const full=/reconnect|selected|new|create|boot|result|final|rally:edit|rally-edit|undo|restore|import/i.test(why)||!s;const base={version:VERSION,deviceId,deviceName,deviceType:isMobile()?'mobile':'desktop',seq,changedAt:now(),teamId:String(equipoActivo||''),matchId:Number(m.id)||0,mode:full?'full':'patch'};if(full){base.match=clone(m);return base}const top=clone(m);delete top.sets;delete top.updatedAt;base.patch={...top,remoteUpdatedAt:m.updatedAt,setIndex,set:clone(s),setSummaries:(Array.isArray(m.sets)?m.sets:[]).map(x=>x?{number:x.number,setNo:x.setNo,scoreUs:x.scoreUs,scoreOpponent:x.scoreOpponent,finished:x.finished,winner:x.winner}:null)};return base}
function queueFast(reason='matchstate'){if(fastApplying||rtState!=='SUBSCRIBED'||!channel||!cloudConnected())return;clearTimeout(fastTimer);fastTimer=setTimeout(async()=>{if(rtState!=='SUBSCRIBED'||!channel)return;touchMeta(reason);const payload=buildFastPayload(reason);if(!payload)return;try{await channel.send({type:'broadcast',event:FAST_EVENT,payload})}catch(err){console.warn('V15.2.6 broadcast',err)}},45)}
async function syncRemote(reason='fallback'){if(!cloudConnected())return false;if(remoteSyncTimer){clearTimeout(remoteSyncTimer);remoteSyncTimer=null}try{lastPullAt=now();await window.VC_V962_CLOUD_EFFICIENT?.sync?.({reason:`v138-${reason}`,manual:false,allowWrite:false,pullOnly:true});render();return true}catch(err){console.warn('V15.2.6 remote sync',err);return false}}
function onRemote(payload){try{const meta=payload?.new?.state?.v138SyncMeta||null;ingestMeta(meta);if(meta?.deviceId===deviceId)return;clearTimeout(remoteSyncTimer);const recentFast=meta?.deviceId&&meta.deviceId===lastRemoteDevice&&now()-lastRemoteAt<6000;remoteSyncTimer=setTimeout(()=>void syncRemote(recentFast?'db-complete-after-fast':'db-change'),recentFast?700:350)}catch(err){console.warn('V15.2.6 postgres event',err)}}
let presencePeers=[];
function syncPresence(){
  try{
    const state=channel?.presenceState?.()||{};
    const seen=new Map();
    Object.values(state).forEach(values=>(Array.isArray(values)?values:[]).forEach(p=>{
      const k=String(p.deviceId||p.presence_ref||'');if(k)seen.set(k,{deviceId:k,name:String(p.name||'Entrenador'),type:String(p.type||''),teamId:String(p.teamId||''),view:String(p.view||'')});
    }));
    presencePeers=[...seen.values()];
  }catch(err){console.warn('VC Presence',err);presencePeers=[]}
  try{window.VC_V154_COLLAB?.render?.()}catch(_){}
}
async function trackPresence(){
  if(!channel||rtState!=='SUBSCRIBED')return;
  try{await channel.track({deviceId,name:deviceName,type:isMobile()?'mobile':'desktop',teamId:String(equipoActivo||''),view:document.querySelector('.view.active')?.id||'',joinedAt:new Date().toISOString()})}
  catch(err){console.warn('VC Presence track',err)}
}
function disconnectRealtime(){if(channel&&cloudClient){try{cloudClient.removeChannel(channel)}catch(_){try{channel.unsubscribe?.()}catch(__){}}}channel=null;channelUser='';rtState='disconnected';presencePeers=[];render();syncPresence()}
/* V19.1.7: señal sin datos privados; el receptor lee la versión CAS confirmada. */
const WORKSPACE_EVENT='workspace_changed';
let lastWorkspaceSignal=0;
async function notifyWorkspaceChanged({stamp='',revision=0,reason='change'}={}){
 if(!channel||rtState!=='SUBSCRIBED'||!cloudConnected())return false;
 try{
   const result=await channel.send({type:'broadcast',event:WORKSPACE_EVENT,
     payload:{version:'19.1.7',deviceId,userId:String(cloudUser.id),stamp:String(stamp),revision:Number(revision)||0,reason:String(reason).slice(0,50)}});
   return result==='ok';
 }catch(e){console.warn('V19.1.7 realtime wakeup',e);return false;}
}
function onWorkspaceChanged(message){
 const p=message?.payload||message||{};
 if(!cloudConnected()||String(p.userId)!==String(cloudUser.id)||String(p.deviceId)===deviceId)return;
 const current=now();if(current-lastWorkspaceSignal<120)return;lastWorkspaceSignal=current;
 clearTimeout(remoteSyncTimer);remoteSyncTimer=setTimeout(()=>void syncRemote('workspace-changed'),140);
}
function onBenchNote(message){try{window.VC_V158_BENCH?.receiveNote?.(message?.payload||message)}catch(err){console.warn('VC bench message',err)}}
async function sendBenchNote(payload){
 if(!channel||rtState!=='SUBSCRIBED'||!cloudConnected())return {ok:false,reason:'Realtime no conectado'};
 if(!payload||payload.userId!==String(cloudUser?.id||'')||String(payload.teamId||'')!==String(equipoActivo||''))return {ok:false,reason:'Cuenta o equipo no coinciden'};
 try{const result=await channel.send({type:'broadcast',event:'bench_note',payload});return {ok:result==='ok',reason:result==='ok'?'':String(result||'sin confirmación del canal')}}catch(error){return {ok:false,reason:String(error?.message||error)}}
}
function connectRealtime(){if(!cloudConnected()){disconnectRealtime();return false}const uid=String(cloudUser?.id||'');if(!uid)return false;if(channel&&channelUser===uid&&(rtState==='SUBSCRIBED'||rtState==='SUBSCRIBING'||rtState==='connecting'))return true;disconnectRealtime();channelUser=uid;rtState='connecting';render();try{channel=cloudClient.channel(`vc-matchstate-${uid}`,{config:{broadcast:{self:false},presence:{key:deviceId}}}).on('broadcast',{event:FAST_EVENT},onFast).on('broadcast',{event:WORKSPACE_EVENT},onWorkspaceChanged).on('broadcast',{event:'bench_note'},onBenchNote).on('postgres_changes',{event:'*',schema:'public',table:'volley_state',filter:`user_id=eq.${uid}`},onRemote).on('presence',{event:'sync'},syncPresence).subscribe(status=>{rtState=String(status||'');render();if(rtState==='SUBSCRIBED'){queueFast('reconnect');void trackPresence()}if(rtState==='CHANNEL_ERROR'||rtState==='TIMED_OUT'||rtState==='CLOSED')setTimeout(()=>{if(document.visibilityState==='visible'&&cloudConnected())connectRealtime()},1800)});return true}catch(err){console.warn('V15.2.6 realtime',err);rtState='CHANNEL_ERROR';render();setTimeout(()=>{if(document.visibilityState==='visible'&&cloudConnected())connectRealtime()},2200);return false}}
function poll(){clearTimeout(pollTimer);const delay=active()?POLL_ACTIVE_MS:POLL_IDLE_MS;pollTimer=setTimeout(async()=>{if(document.visibilityState==='visible'&&cloudConnected()&&now()-lastPullAt>=delay)await syncRemote('safety');poll()},delay)}
function hardenTouch(){if(!isMobile())return;document.documentElement.classList.add('v138-touch');document.querySelectorAll('[onclick]:not(button):not(input):not(select):not(textarea):not(a):not(summary)').forEach(el=>{if(!el.hasAttribute('role'))el.setAttribute('role','button');if(!el.hasAttribute('tabindex'))el.tabIndex=0})}
async function resumeSync(reason='resume'){try{if((typeof cloudClient==='undefined'||!cloudClient||typeof cloudUser==='undefined'||!cloudUser)&&typeof window.actualizarEstadoCloud==='function')await window.actualizarEstadoCloud()}catch(_){}connectRealtime();setTimeout(()=>syncRemote(reason),300);render()}
function boot(){installStateMeta();ensureUI();hardenTouch();touchMeta('device-start');try{window.MatchState?.subscribe?.(d=>{render();queueFast(d?.reason||'matchstate');if(!fastApplying)window.VC_V962_CLOUD_EFFICIENT?.markDirty?.('matchstate')})}catch(_){};window.addEventListener('online',()=>resumeSync('online'));window.addEventListener('focus',()=>resumeSync('focus'));window.addEventListener('pageshow',()=>resumeSync('pageshow'));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resumeSync('visible')});setInterval(()=>{if(document.visibilityState==='visible'&&(!channel||rtState!=='SUBSCRIBED'))connectRealtime()},30000);setTimeout(()=>resumeSync('startup'),250);poll();render()}
window.v138SyncNow=()=>syncRemote('manual');window.VC_DEVICE_SYNC={version:VERSION,deviceId,deviceName,sendBenchNote,notifyWorkspaceChanged,connect:connectRealtime,refreshPresence:trackPresence,sync:syncRemote,broadcast:queueFast,render,diagnostics:()=>({protectedLocalChanges,staleFastMessages,version:VERSION,deviceId,deviceName,realtimeState:rtState,cloudConnected:cloudConnected(),lastRemoteAt,lastRemoteDevice,lastRemoteName,lastPullAt,activeMatchId:Number(active()?.id)||null,knownDevices:Object.values(knownDevices),fallbackPollingMs:active()?POLL_ACTIVE_MS:POLL_IDLE_MS,fastBroadcast:true,compactPatches:true,durableCompletion:true,allTopLevelMatchFields:true,presencePeers:presencePeers.slice()})};try{if(window.MatchState){window.MatchState.version=VERSION;window.MatchState.schema='vc.match-state/15.2.6'}}catch(_){}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
