/* Volley Coach V19.2.5 — Local videoteca diagnostics.
   Read-only inspection of the EXISTING V7.7 IndexedDB store. Existing
   Recording Pro remains the only exporter; no second player or recorder. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document)api.mount(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='19.2.5',DB='VolleyCoachRecordingsV770',MB=1048576;
 const fmt=n=>{n=Number(n);return Number.isFinite(n)&&n>=0? n>=1073741824?(n/1073741824).toFixed(2)+' GB':(n/MB).toFixed(1)+' MB':'—'};
 const kind=s=>s?.training?'training':s?.match?'matches':'unlinked';
 const label=s=>kind(s)==='training'?`Entrenamiento · ${s.training.team||'Equipo'}`:kind(s)==='matches'?`Partido · ${s.match.opponent||'Rival'}`:'Sin vincular';
 function quotaInfo(estimate,bitrate=3500000){
  const quota=Number(estimate?.quota),used=Number(estimate?.usage);
  if(!Number.isFinite(quota)||quota<=0||!Number.isFinite(used)||used<0)return{known:false,free:null,risk:'unknown',minutes:null};
  const free=Math.max(0,quota-used),risk=free<150*MB?'critical':(free<500*MB||free/quota<0.1)?'low':'ok';
  const bps=Number(bitrate)>0?Number(bitrate):3500000;
  return{known:true,free,quota,used,risk,minutes:Math.floor(free/(bps/8*1.15)/60)};
 }
 function auditIndices(keys,record){
  let count=0,firstGap=null,previous=-1;
  for(const index of keys){
   if(!Number.isSafeInteger(index)||index<0){if(firstGap===null)firstGap=count;break}
   if(index!==previous+1&&firstGap===null)firstGap=previous+1;
   previous=index;count++;
  }
  const missingExpected=Number.isSafeInteger(Number(record?.chunkCount))&&Number(record.chunkCount)>count;
  return{count,firstGap,missingExpected,contiguous:firstGap===null&&!missingExpected};
 }
 function classify(record,check,activeId){
  if(!record)return{status:'missing',text:'Sesión no disponible'};
  if(String(record.id)===String(activeId||'')&&activeId)return{status:'active',text:'REC en curso; comprobar después de detener'};
  if(record.mode==='disk')return{status:'external',text:'Archivo externo: verificar su existencia y reproducción manualmente'};
  if(!check||typeof check.count!=='number')return{status:'unknown',text:'Verificación no ejecutada'};
  if(check.count===0)return{status:'empty',text:'No hay fragmentos recuperables'};
  if(!check.contiguous)return{status:'damaged',text:`Fragmentos discontinuos (primer hueco: ${check.firstGap??'sin identificar'}). No borrar; intentar recuperación técnica.`};
  if(!record.completed)return{status:'recoverable',text:`Sesión interrumpida · ${check.count} fragmentos continuos recuperables; comprobar reproducción tras exportar`};
  return{status:'available',text:`${check.count} fragmentos continuos. La integridad estructural no garantiza que el códec se reproduzca.`};
 }
 async function inspectChunks(id,storage,Range){
  if(!id)throw Error('Selecciona una grabación.');
  if(!storage||!Range)throw Error('Este navegador no permite inspeccionar IndexedDB.');
  const db=await new Promise((resolve,reject)=>{
   const req=storage.open(DB,1);
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||Error('No se puede abrir la videoteca'));
   req.onupgradeneeded=()=>{req.transaction.abort();}; // Never create an empty database as part of inspection.
  });
  try{return await new Promise((resolve,reject)=>{
   let count=0,firstGap=null,previous=-1;
   const tx=db.transaction('chunks','readonly');
   const store=tx.objectStore('chunks'),idx=store.index('sessionId');
   const req=idx.openKeyCursor(Range.only(String(id)));
   req.onsuccess=()=>{
    const cursor=req.result;if(!cursor)return;
    const key=String(cursor.primaryKey),prefix=String(id)+':';
    const suffix=key.startsWith(prefix)?key.slice(prefix.length):'';
    const number=/^\d+$/.test(suffix)?Number(suffix):NaN;
    if(!Number.isSafeInteger(number)||number!==previous+1){if(firstGap===null)firstGap=previous+1;}
    previous=number;count++;cursor.continue();
   };
   req.onerror=()=>reject(req.error||Error('Error leyendo índices de fragmentos'));
   tx.oncomplete=()=>resolve({count,firstGap,contiguous:firstGap===null});
   tx.onerror=()=>reject(tx.error||Error('Error consultando la videoteca'));
   tx.onabort=()=>reject(tx.error||Error('La inspección ha sido cancelada'));
  });}finally{db.close()}
 }
 function mount(root){
  const doc=root.document;if(!doc)return false;
  let attempts=0;
  function install(){
   const header=doc.getElementById('vc183-library-heading'),studio=doc.getElementById('scout-video-hub');
   if(!header||!studio||typeof root.VC_RECORDING_PRO?.list!=='function')return false;
   if(doc.getElementById('vc1925-health'))return true;
   const panel=doc.createElement('section');panel.id='vc1925-health';panel.setAttribute('aria-label','Estado y recuperación de la videoteca');
   panel.innerHTML='<div class="vc1925-heading"><strong>Salud de la videoteca</strong><span id="vc1925-storage">Comprobar almacenamiento</span></div><p id="vc1925-help">Los vídeos permanecen en este dispositivo. Haz una copia exportando los archivos importantes.</p><div class="vc1925-actions"><button type="button" id="vc1925-refresh">Comprobar espacio</button><button type="button" id="vc1925-persist">Proteger almacenamiento</button><label>Grabación a verificar <select id="vc1925-select"><option value="">Selecciona una grabación</option></select></label><button type="button" id="vc1925-verify">Verificar fragmentos</button></div><p id="vc1925-result" role="status" aria-live="polite">Elige una grabación para comprobar que sus fragmentos están presentes y ordenados.</p>';
   header.appendChild(panel);
   const $=id=>doc.getElementById(id);
   let records=[],busy=false,lastCheck=null;
   const say=(s,bad=false)=>{const n=$('vc1925-result');if(n){n.textContent=String(s);n.dataset.error=bad?'true':'false'}};
   async function refresh(){
    if(busy)return false;busy=true;
    try{
     records=await root.VC_RECORDING_PRO.list();
     const previous=$('vc1925-select').value,select=$('vc1925-select');select.replaceChildren();
     const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='Selecciona una grabación';select.append(placeholder);
     for(const item of records){const option=doc.createElement('option');option.value=String(item.id);option.textContent=`${item.filename||item.id} · ${label(item)} · ${item.completed?'Finalizada':'Interrumpida'}`;select.append(option)}
     if(records.some(x=>String(x.id)===previous))select.value=previous;
     let estimate=null;try{estimate=await root.navigator?.storage?.estimate?.()}catch(_){}
     const status=quotaInfo(estimate,root.vcRecordingDiagnostics?.()?.recordingBitrate);
     let persisted=false;try{persisted=!!(await root.navigator?.storage?.persisted?.())}catch(_){}
     $('vc1925-storage').textContent=status.known?`${fmt(status.free)} libres · ${status.minutes} min aprox. · ${persisted?'Protegido':'Sin protección garantizada'}`:`Cuota desconocida · ${persisted?'Protegido':'Sin protección garantizada'}`;
     $('vc1925-storage').dataset.level=status.risk;
     $('vc1925-help').textContent=`${records.length} sesiones locales · ${records.filter(x=>!x.completed).length} interrumpidas · ${records.filter(x=>x.mode==='disk').length} guardadas en disco externo. Los vídeos no se sincronizan automáticamente.`;
     if(status.risk==='critical')say('Espacio disponible crítico: exporta grabaciones y no empieces REC recuperable sin liberar espacio.',true);
     lastCheck={count:records.length,storage:status,persisted};return true;
    }catch(err){say('No se pudo consultar la videoteca: '+String(err?.message||err),true);return false}
    finally{busy=false}
   }
   async function verify(){
    if(busy)return false;
    const id=$('vc1925-select').value,rec=records.find(x=>String(x.id)===String(id));
    if(!rec){say('Selecciona una grabación.',true);return false}
    const activeId=root.vcRecordingDiagnostics?.()?.active?root.vcRecordingDiagnostics?.()?.sessionId:null;
    if(rec.mode==='disk'||String(id)===String(activeId||'')){
     const result=classify(rec,null,activeId);say(result.text,result.status==='active');return false;
    }
    busy=true;say('Comprobando los índices de fragmentos sin cargar el vídeo en memoria…');
    try{
     const scan=await inspectChunks(id,root.indexedDB,root.IDBKeyRange);
     const integrity={...scan,missingExpected:Number(rec.chunkCount||0)>scan.count};
     integrity.contiguous=integrity.contiguous&&!integrity.missingExpected;
     const status=classify(rec,integrity,activeId);
     say(status.text,['damaged','empty'].includes(status.status));
     return status.status==='available'||status.status==='recoverable';
    }catch(err){say('No se pudo comprobar la grabación: '+String(err?.message||err),true);return false}
    finally{busy=false}
   }
   $('vc1925-refresh').addEventListener('click',()=>{void refresh()});
   $('vc1925-verify').addEventListener('click',()=>{void verify()});
   $('vc1925-persist').addEventListener('click',async()=>{
    try{if(typeof root.navigator?.storage?.persist!=='function'){say('El navegador no permite solicitar almacenamiento persistente; exporta las grabaciones.',true);return}
     const ok=await root.navigator.storage.persist();say(ok?'Protección de almacenamiento concedida. Mantén igualmente copias exportadas.':'El navegador no concedió persistencia. Mantén copias exportadas.',!ok);
     await refresh();
    }catch(err){say('No se pudo solicitar protección: '+String(err?.message||err),true)}
   });
   if(typeof root.MutationObserver==='function'){
    const observer=new root.MutationObserver(()=>{
     if(studio.dataset.vc183Screen==='biblioteca')void refresh();
    });
    observer.observe(studio,{attributes:true,attributeFilter:['data-vc183-screen']});
   }
   const api={version:VERSION,refresh,verify,diagnostics:()=>({version:VERSION,records:records.length,storage:lastCheck,readOnly:true,recorderReplaced:false})};
   root.VC_LIBRARY_HEALTH_1925=api;
   if(studio.dataset.vc183Screen==='biblioteca')void refresh();
   return true;
  }
  function boot(){if(install())return;if(++attempts<60)root.setTimeout?.(boot,250)}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  return true;
 }
 return {VERSION,fmt,kind,label,quotaInfo,auditIndices,classify,inspectChunks,mount};
});
