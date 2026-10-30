/* Volley Coach V16.9 — read-only forensic recovery center.
   No automatic restore, deletion, overwrite or remote write on scan.
   Explicit restore is additive (only matches absent by ID), with pre-restore archive.
*/
(()=>{
'use strict';
const VERSION='16.9.0';
const SOURCES=[
 {db:'VolleyCoachSyncV1680',store:'records'},
 {db:'VolleyCoachProtectedScoutingV1674',store:'versions'},
 {db:'VolleyCoachScoutingVaultV893',store:'versions'},
 {db:'VolleyCoachScoutJournalV902',store:'liveMatches'},
 {db:'volley-coach-match-recovery-v680',store:'snapshots'},
 {db:'vc-v1605-backups',store:'history'},
 {db:'vc-v1602-recovery',store:'snapshots'}
];
const arr=x=>Array.isArray(x)?x:[];
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const clone=x=>JSON.parse(JSON.stringify(x));
const count=m=>({sets:arr(m?.sets).length,rallies:arr(m?.sets).reduce((t,s)=>t+arr(s?.rallies).length,0),actions:arr(m?.sets).reduce((t,s)=>t+arr(s?.rallies).reduce((n,r)=>n+arr(r?.actions).length,0),0)+arr(m?.liveRally?.actions).length});
const stamp=m=>Date.parse(m?.updatedAt||m?.manualSavedAt||m?.endedAt||m?.createdAt||'')||0;
const hash=s=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(36)+'-'+s.length};
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let found=[],lastScan='',lastErrors=[],imported=[],busy=false;
async function readDb(name,store){
 if(!('indexedDB'in window))return [];
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name);let created=false;
  // If it did not exist, abort creation rather than modifying the user's storage.
  req.onupgradeneeded=e=>{created=true;try{req.transaction.abort()}catch(_){}};
  req.onerror=()=>{if(created)resolve([]);else reject(req.error||new Error(name))};
  req.onsuccess=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(store)){db.close();resolve([]);return}
   let tx;try{tx=db.transaction(store,'readonly')}catch(e){db.close();reject(e);return}
   const q=tx.objectStore(store).getAll();
   q.onsuccess=()=>resolve(arr(q.result));q.onerror=()=>reject(q.error);
   tx.oncomplete=()=>db.close();tx.onabort=()=>db.close();
  };
 });
}
function stateCandidates(st,label,add){
 if(!isObj(st))return;
 if(isObj(st.equiposData))for(const [team,td] of Object.entries(st.equiposData)){
  arr(td?.scoutingMatches).forEach(m=>add(team,m,label));
  if(isObj(td?.scoutingSafeCloud))Object.values(td.scoutingSafeCloud).forEach(x=>add(team,x?.match,label+' · espejo'));
 }
 if(isObj(st.scoutingSyncIndex))for(const [team,list] of Object.entries(st.scoutingSyncIndex))arr(list).forEach(m=>add(team,m,label+' · índice'));
}
function rowCandidates(row,label,add){
 if(!isObj(row))return;
 if(row.match&&row.teamId)add(row.teamId,row.match,label);
 if(row.value?.match)add(row.value.teamId||row.teamId,row.value.match,label+' · recuperación');
 stateCandidates(row.state,label+' · estado',add);
 stateCandidates(row.local,label+' · local',add);
 stateCandidates(row.remote,label+' · remoto',add);
 stateCandidates(row.value?.state,label+' · valor',add);
 if(row.kind==='pending'&&row.state)stateCandidates(row.state,label+' · pendiente',add);
}
async function scan({includeCloud=false}={}){
 if(busy)throw Error('Ya hay una búsqueda en curso');busy=true;lastErrors=[];
 const candidates=new Map();
 function add(team,m,source){
  if(!isObj(m)||!Array.isArray(m.sets)||!Number.isFinite(Number(m.id))||Number(m.id)<=0)return;
  const teamId=String(team||'');if(!teamId)return;
  const k=teamId+':'+m.id;
  const signature=hash(JSON.stringify([m.id,m.status,m.sets,m.liveRally,m.events,m.video,m.updatedAt]));
  const key=k+':'+signature,old=candidates.get(key);
  if(old){if(!old.sources.includes(source))old.sources.push(source);return}
  candidates.set(key,{key,teamId,match:clone(m),signature,sources:[source],counts:count(m),stamp:stamp(m)});
 }
 try{
  // Live state remains authoritative for the current in-progress match.
  try{if(typeof equiposData!=='undefined')stateCandidates({equiposData},'Memoria activa',add)}catch(e){lastErrors.push('Memoria: '+e.message)}
  try{
   const team=String(typeof equipoActivo!=='undefined'?equipoActivo:'');
   const list=window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.();
   if(team&&Array.isArray(list))list.forEach(m=>add(team,m,'Motor scouting activo'));
  }catch(e){lastErrors.push('Motor scouting: '+e.message)}
  for(const s of SOURCES){
   try{const rows=await readDb(s.db,s.store);for(const row of rows)rowCandidates(row,s.db,add)}
   catch(e){lastErrors.push(s.db+': '+String(e?.message||e))}
  }
  // Fall-back local-storage snapshots used in older versions.
  try{
   for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!(/volley|vc1675|scout|backup/i.test(k)))continue;
    const str=localStorage.getItem(k);if(!str||str.length>18_000_000)continue;
    if(!str.startsWith('{')&&!str.startsWith('['))continue;
    try{rowCandidates(JSON.parse(str),'Almacenamiento local · '+k,add)}catch(_){}
   }
  }catch(e){lastErrors.push('Almacenamiento local: '+e.message)}
  // Previously imported JSON is held in memory until the user explicitly restores it.
  for(const row of imported)rowCandidates(row,'Archivo JSON importado',add);
  if(includeCloud){
   try{
    const uid=typeof cloudUser!=='undefined'?cloudUser?.id:null;
    if(uid&&typeof cloudClient!=='undefined'&&cloudClient){
     const {data,error}=await cloudClient.from('volley_state').select('state').eq('user_id',uid).maybeSingle();
     if(error)throw error;stateCandidates(data?.state,'Supabase · solo lectura',add);
    }
   }catch(e){lastErrors.push('Supabase: '+String(e?.message||e))}
  }
  found=[...candidates.values()].sort((a,b)=>b.counts.rallies-a.counts.rallies||b.counts.actions-a.counts.actions||b.stamp-a.stamp);
  lastScan=new Date().toISOString();render();return report();
 }finally{busy=false}
}
function report(){
 const current=new Set();try{for(const [team,t] of Object.entries(equiposData||{}))arr(t?.scoutingMatches).forEach(m=>current.add(team+':'+m.id))}catch(_){}
 const unique=new Set(found.map(x=>x.teamId+':'+x.match.id));
 return {version:VERSION,at:lastScan,variants:found.length,distinctMatches:unique.size,missing:[...unique].filter(k=>!current.has(k)).length,errors:lastErrors.slice(),sources:SOURCES.length};
}
function exportFile(payload,name){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),4000)}
function exportAll(){if(!found.length)throw Error('Busca primero las copias');exportFile({type:'VolleyCoachRecoveryCandidates',version:VERSION,at:lastScan,variants:found},'VolleyCoach_scoutings_copias_encontradas_V169.json')}
async function importFile(file){
 if(!file)throw Error('Selecciona un JSON');if(file.size>90*1024*1024)throw Error('Archivo superior a 90 MB');
 const d=JSON.parse(await file.text());if(!isObj(d))throw Error('El archivo no contiene un objeto JSON');
 if(d.type==='VolleyCoachRecoveryCandidates'&&Array.isArray(d.variants)){
  imported.push(...d.variants.map(v=>({teamId:v.teamId,match:v.match})));
 }else if(Array.isArray(d.rows)){imported.push(...d.rows)}
 else if(isObj(d.state)||isObj(d.equiposData)||isObj(d.match)){imported.push(d)}
 else throw Error('Formato no reconocido. No se han modificado los datos.');
 return scan();
}
function missingCandidates(){
 const exists=new Set();
 try{for(const [team,t] of Object.entries(equiposData||{}))arr(t?.scoutingMatches).forEach(m=>exists.add(team+':'+m.id))}catch(_){}
 const selected=new Map();
 for(const x of found){const k=x.teamId+':'+x.match.id;if(!exists.has(k)&&!selected.has(k))selected.set(k,x)}
 return [...selected.values()];
}
async function restoreMissing(){
 const selected=missingCandidates();if(!selected.length){alert('No hay partidos faltantes que añadir. Puedes exportar las versiones alternativas para examinarlas.');return}
 if(!confirm('Se añadirán '+selected.length+' scoutings faltantes. No se modificará ningún partido existente. ¿Continuar?'))return;
 const sync=window.VC_SYNC_V1680;
 if(!sync?.restoreMissing)throw Error('Motor de sincronización profesional no disponible');
 // Export locally BEFORE applying anything. This export is independent from the cloud.
 exportAll();
 const result=await sync.restoreMissing(selected.map(x=>({teamId:x.teamId,match:x.match})));
 await scan();alert('Restauración aditiva: '+result.added+' partidos recuperados; '+result.skipped+' omitidos. Comprueba los partidos antes de confirmar la nube.');
}
function ensurePanel(){
 if(document.getElementById('vc169-recovery-panel'))return;
 const anchor=document.getElementById('vc1680-panel')||document.querySelector('#scout-workspace-v900 .v900-shell')||document.getElementById('scout-workspace-v900');if(!anchor)return;
 const el=document.createElement('section');el.id='vc169-recovery-panel';el.style.cssText='padding:13px;background:#fff;border:1px solid #d9e2ec;border-radius:9px;margin:12px 0;font:12px Arial;';
 el.innerHTML='<strong>Centro de recuperación de scoutings · V16.9</strong><p style="margin:7px 0">Busca copias históricas sin modificar los partidos. La restauración solo añade partidos que no existan.</p><div id="vc169-recovery-summary">Sin examinar</div><div id="vc169-recovery-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"></div><div id="vc169-recovery-results" style="max-height:360px;overflow:auto"></div>';
 if(anchor.id==='vc1680-panel')anchor.after(el);else anchor.prepend(el);
 const actions=el.querySelector('#vc169-recovery-actions');
 function btn(label,fn){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=label;b.onclick=()=>{b.disabled=true;Promise.resolve().then(fn).catch(e=>alert('Recuperación: '+String(e?.message||e))).finally(()=>b.disabled=false)};actions.appendChild(b)}
 btn('Buscar copias locales',()=>scan());btn('Consultar nube (solo lectura)',()=>scan({includeCloud:true}));btn('Exportar todas las copias',()=>exportAll());
 btn('Añadir solo partidos faltantes',()=>restoreMissing());
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.maxWidth='240px';input.title='Importar copia JSON para revisar';
 input.onchange=()=>{if(input.files?.[0])void importFile(input.files[0]).catch(e=>alert(e.message))};actions.appendChild(input);
}
function render(){ensurePanel();const el=document.getElementById('vc169-recovery-panel');if(!el)return;const r=report();
 el.querySelector('#vc169-recovery-summary').textContent=`${r.distinctMatches} partidos únicos · ${r.variants} versiones · ${r.missing} partidos faltantes · ${r.errors.length} advertencias`;
 const box=el.querySelector('#vc169-recovery-results');
 box.innerHTML=found.slice(0,140).map(x=>{
  const exists=arr((typeof equiposData!=='undefined'?equiposData[x.teamId]:null)?.scoutingMatches).some(m=>Number(m.id)===Number(x.match.id));
  return `<div style="border-top:1px solid #e6ebf0;padding:8px 0"><b>${esc(x.teamId)} · ${esc(x.match.date||'')} · ${esc(x.match.opponent||'Rival')}</b> · ${exists?'existente':'FALTANTE'}<div>${x.counts.sets} sets · ${x.counts.rallies} rallies · ${x.counts.actions} acciones · ${esc(x.match.status||'')}</div><small>${esc(x.sources.slice(0,4).join(' / '))}</small></div>`;
 }).join('')+(found.length>140?`<p>Se muestran 140 de ${found.length} versiones. Exporta todas para examinarlas.</p>`:'');
}
window.VC_RECOVERY_V169=Object.freeze({scan,report,restoreMissing,exportAll,importFile,missingCandidates,diagnostics:()=>({version:VERSION,lastScan,errors:lastErrors.slice(),candidates:found.length})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensurePanel,{once:true});else ensurePanel();
})();
