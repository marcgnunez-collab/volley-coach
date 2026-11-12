/* Volley Coach V19.1.5 · Conflictos por registro y recuperación conservadora.
 * Esta capa solo usa el motor CAS V19.1.4; nunca escribe en Supabase por sí misma.
 * Una copia IndexedDB se confirma ANTES de aplicar una restauración JSON.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api.pure;
 if(root&&root.document){root.VC_V1915_RELIABILITY=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION='19.1.5',TYPES=['planificacion','historial','jugadores','scoutingMatches'];
 const MAX_FILE=25*1024*1024,MAX_MANIFEST=400*1024;
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const arr=v=>Array.isArray(v)?v:[];
 const clone=v=>JSON.parse(JSON.stringify(v));
 const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
 function stable(v){
   if(Array.isArray(v))return '['+v.map(x=>stable(x)??'null').join(',')+']';
   if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
   return JSON.stringify(v);
 }
 function digest(v){
   const source=stable(v);let h=2166136261;
   for(let i=0;i<source.length;i++){h^=source.charCodeAt(i);h=Math.imul(h,16777619)}
   return (h>>>0).toString(16).padStart(8,'0')+':'+source.length;
 }
 function recordId(record){const v=record?.id;return v===undefined||v===null||String(v)===''?null:String(v)}
 function indexed(list){
   const map=new Map();
   for(const r of arr(list)){const id=recordId(r);if(id!==null&&!map.has(id))map.set(id,r)}
   return map;
 }
 function makeManifest(state){
   const records={};
   for(const [team,data] of Object.entries(obj(state?.equiposData))){
     records[team]={};
     for(const type of TYPES){
       const items={};
       for(const [id,r] of indexed(data[type]))items[id]=digest(r);
       records[team][type]=items;
     }
   }
   return {schema:'vc1915-record-manifest',version:VERSION,records};
 }
 const conflictKey=(team,type,id)=>JSON.stringify([team,type,id]);
 function planMerge(local,remote,baseline={},choices={}){
   const base=obj(baseline.records),selected=obj(choices),operations=[],conflicts=[];
   const teams=new Set([...Object.keys(obj(local?.equiposData)),...Object.keys(obj(remote?.equiposData))]);
   for(const team of teams){
     for(const type of TYPES){
       const lm=indexed(local?.equiposData?.[team]?.[type]),rm=indexed(remote?.equiposData?.[team]?.[type]);
       const prior=obj(base[team]?.[type]);
       for(const [id,l] of lm){
         if(!rm.has(id))continue;
         const r=rm.get(id),lh=digest(l),rh=digest(r),bh=prior[id];
         if(lh===rh)continue;
         const localChanged=!bh||lh!==bh,remoteChanged=!bh||rh!==bh;
         const key=conflictKey(team,type,id),choice=selected[key];
         const valid=choice&&choice.local===lh&&choice.remote===rh&&['local','remote'].includes(choice.use);
         if(localChanged&&remoteChanged&&!valid){
           conflicts.push({key,team,type,id,local:lh,remote:rh,label:String(l?.nombre||l?.titulo||l?.opponent||r?.nombre||r?.titulo||r?.opponent||id).slice(0,120),uncertain:!bh});
           continue;
         }
         const takeLocal=valid?choice.use==='local':localChanged&&!remoteChanged;
         operations.push({team,type,id,takeLocal,local:lh,remote:rh});
       }
     }
   }
   return {conflicts,operations};
 }
 function mergeGuarded(local,remote,plan,legacy){
   if(plan.conflicts.length)throw Error('Conflictos de edición sin resolver; no se han mezclado los registros.');
   const merged=legacy?legacy.mergePending(local,remote):clone(remote);
   const scoutOverrides={};
   for(const op of plan.operations){
     const localItems=indexed(local?.equiposData?.[op.team]?.[op.type]);
     const remoteItems=indexed(remote?.equiposData?.[op.team]?.[op.type]);
     const source=op.takeLocal?localItems.get(op.id):remoteItems.get(op.id);
     if(!source)continue;
     if(!merged.equiposData)merged.equiposData={};
     if(!merged.equiposData[op.team])merged.equiposData[op.team]={};
     const dest=merged.equiposData[op.team],list=arr(dest[op.type]).slice();
     const idx=list.findIndex(x=>recordId(x)===op.id);
     if(idx>=0)list[idx]=clone(source);else list.push(clone(source));
     dest[op.type]=list;
     // El motor de scoutings conserva su fusión histórica. Solo se permite
     // sustituir ese resultado tras una decisión explícita registrada aquí.
     if(op.type==='scoutingMatches'){
       if(!scoutOverrides[op.team])scoutOverrides[op.team]={};
       scoutOverrides[op.team][op.id]=clone(source);
     }
   }
   if(Object.keys(scoutOverrides).length)merged.__vc1915ScoutOverrides=scoutOverrides;
   return merged;
 }
 function validateImport(parsed){
   const state=parsed?.schema==='volley-coach-recovery'?parsed.state:parsed;
   if(!state||!state.equiposData||typeof state.equiposData!=='object'||Array.isArray(state.equiposData))throw Error('No es una copia de estado compatible: falta equiposData.');
   const teams=Object.entries(state.equiposData);
   if(!teams.length)throw Error('La copia no contiene equipos.');
   for(const [name,value] of teams){
     if(!name||['__proto__','prototype','constructor'].includes(name)||!value||typeof value!=='object'||Array.isArray(value))throw Error('Equipo inválido en la copia.');
     for(const key of TYPES.concat(['plantillas','sesionActual'])){
       if(value[key]!==undefined&&!Array.isArray(value[key]))throw Error('Campo '+name+'.'+key+' no tiene formato de lista.');
     }
     for(const type of TYPES){
       const seen=new Set();
       for(const item of arr(value[type])){
         const id=recordId(item);
         if(id===null)continue;
         if(seen.has(id))throw Error('La copia contiene ID duplicado en '+name+'/'+type+': '+id);
         seen.add(id);
       }
     }
   }
   return state;
 }
 function recoveryPreview(current,backup){
   const rows=[];
   for(const [team,data] of Object.entries(obj(backup?.equiposData))){
     for(const type of TYPES){
       const local=indexed(current?.equiposData?.[team]?.[type]);let added=0,replaced=0;
       for(const [id,value] of indexed(data[type])){
         if(!local.has(id))added++;else if(digest(local.get(id))!==digest(value))replaced++;
       }
       if(added||replaced)rows.push({team,type,added,replaced});
     }
   }
   return rows;
 }
 function mergeBackup(current,backup){
   const result=clone(current);
   result.equiposData=obj(result.equiposData);
   for(const [team,from] of Object.entries(obj(backup.equiposData))){
     const existing=obj(result.equiposData[team]);
     const restored={...existing,...clone(from)};
     for(const type of TYPES){
       const merged=arr(existing[type]).map(clone);
       const indexes=new Map(merged.map((r,i)=>[recordId(r),i]).filter(([id])=>id!==null));
       for(const record of arr(from[type])){
         const id=recordId(record);
         if(id===null){merged.push(clone(record));continue}
         if(!indexes.has(id)){indexes.set(id,merged.length);merged.push(clone(record))}
         else if(type!=='scoutingMatches'){merged[indexes.get(id)]=clone(record)}
         // Las coincidencias de scouting se conservan en estado local. Para
         // reemplazarlas debe usarse la recuperación específica del scouting.
       }
       restored[type]=merged;
     }
     result.equiposData[team]=restored;
   }
   // No tocar la biblioteca actual salvo cuando esté vacía: la restauración
   // completa de biblioteca la gestiona su importador específico.
   if(!arr(result.bibliotecaCompartida).length&&arr(backup.bibliotecaCompartida).length)
     result.bibliotecaCompartida=clone(backup.bibliotecaCompartida);
   delete result.__vc1915ScoutOverrides;
   return result;
 }
 const pure={VERSION,TYPES,digest,recordId,makeManifest,planMerge,mergeGuarded,validateImport,recoveryPreview,mergeBackup,conflictKey};
 const context={lastConflicts:[],lastPreview:null,lastImport:null,lastError:'',account:'',remoteStamp:''};
 function install(win){
   const store=win.localStorage, doc=win.document;
   const user=()=>String(win.cloudUser?.id||'');
   const baselineKey=id=>'v1915_manifest_'+id;
   const decisionsKey=id=>'v1915_decisions_'+id;
   function readJSON(key){try{return JSON.parse(store.getItem(key)||'null')}catch(_){return null}}
   function getBaseline(){return readJSON(baselineKey(user()))||{records:{}}}
   function getChoices(){return obj(readJSON(decisionsKey(user())))}
   function writeJSON(key,data,max=MAX_MANIFEST){const raw=JSON.stringify(data);if(raw.length>max)throw Error('El manifiesto excede el espacio seguro para guardar versiones.');store.setItem(key,raw);if(store.getItem(key)!==raw)throw Error('La versión de sincronización no se guardó correctamente.');}
   function captureBaseline(state){
     if(!user())return false;
     writeJSON(baselineKey(user()),makeManifest(state));
     store.removeItem(decisionsKey(user()));
     context.lastConflicts=[];notify();return true;
   }
   function notify(){try{win.dispatchEvent(new win.CustomEvent('vc1915:change'))}catch(_){} }
   function prepare(local,remote,remoteStamp=''){
     if(!user())throw Error('No hay una cuenta identificada para comparar versiones.');
     const plan=planMerge(local,remote,getBaseline(),getChoices());
     context.lastConflicts=plan.conflicts;context.remoteStamp=remoteStamp;context.account=user();notify();
     return plan;
   }
   function decide(key,use,local,remote){
     if(!['local','remote'].includes(use))throw Error('Resolución inválida.');
     const conflict=context.lastConflicts.find(c=>c.key===key&&c.local===local&&c.remote===remote);
     if(!conflict||context.account!==user())throw Error('El conflicto ya no corresponde al estado actual. Repite la sincronización.');
     const choices=getChoices();choices[key]={use,local,remote};
     writeJSON(decisionsKey(user()),choices,100*1024);
     context.lastConflicts=context.lastConflicts.filter(c=>c.key!==key);notify();
     return true;
   }
   function status(){return {version:VERSION,conflicts:context.lastConflicts.map(x=>({...x})),lastError:context.lastError,hasPreview:!!context.lastPreview};}
   const api={version:VERSION,prepare,mergeGuarded:(local,remote,plan)=>mergeGuarded(local,remote,plan,win.VC_V191_RELIABILITY),captureBaseline,status,decide,pure};
   win.VC_V1915_RELIABILITY=api;
   function element(tag,text){const el=doc.createElement(tag);if(text!==undefined)el.textContent=String(text);return el;}
   let wrapper=null,summary=null,list=null,preview=null,fileInput=null;
   function row(parent,text){const p=element('p',text);parent.append(p);return p;}
   function render(){
     if(!wrapper)return;
     list.replaceChildren();const cs=context.lastConflicts;
     summary.textContent=cs.length?cs.length+' edición(es) requieren revisión antes de sincronizar. La nube no se ha sobrescrito.':'Sin conflictos pendientes detectados en esta sesión.';
     for(const c of cs){
       const line=element('div');line.className='vc1915-item';
       row(line,c.team+' · '+c.type+' · '+c.label+' (ID '+c.id+')');
       row(line,c.uncertain?'Sin versión común conocida: no se puede decidir automáticamente.':'Ambos dispositivos han cambiado este registro.');
       for(const [title,choice] of [['Conservar mi versión','local'],['Aceptar versión de nube','remote']]){
         const btn=element('button',title);btn.type='button';btn.addEventListener('click',()=>{
           try{decide(c.key,choice,c.local,c.remote);win.VC_V962_CLOUD_EFFICIENT?.sync?.({reason:'v1915-manual-resolution',allowWrite:true});}
           catch(err){context.lastError=String(err.message||err);render()}
         });line.append(btn);
       }
       list.append(line);
     }
     if(context.lastError)row(list,'Aviso: '+context.lastError);
   }
   function openRecovery(event){
     const file=event.target.files?.[0];context.lastImport=null;context.lastPreview=null;preview.replaceChildren();
     if(!file)return;
     if(file.size>MAX_FILE){row(preview,'El archivo supera el máximo de 25 MB.');return}
     file.text().then(raw=>{
       const imported=validateImport(JSON.parse(raw));
       const current=win.estadoLocal?.();
       if(!current?.equiposData)throw Error('No se ha podido comprobar el estado local antes de restaurar.');
       const changes=recoveryPreview(current,imported);
       context.lastImport=imported;context.lastPreview=changes;
       row(preview,'Restauración conservadora: se añaden registros ausentes y la copia prevalece en planes, historial y jugadores con el mismo ID. Los scoutings existentes no se reemplazan.');
       for(const c of changes)row(preview,c.team+' · '+c.type+' · '+c.added+' nuevos · '+c.replaced+' diferentes');
       if(!changes.length)row(preview,'No hay diferencias de registros identificadas; pueden existir metadatos de sesión distintos.');
       const btn=element('button','Confirmar restauración protegida');btn.type='button';btn.addEventListener('click',async()=>{
         btn.disabled=true;
         try{
           if(!win.confirm('Se guardará primero una copia local en IndexedDB. Después se fusionarán los registros de la copia. ¿Continuar?'))return;
           const safety=win.VC_V179_SYNC_SAFETY;
           if(typeof safety?.manualBackup!=='function')throw Error('La protección IndexedDB no está disponible. Restauración cancelada.');
           await safety.manualBackup();
           const merged=mergeBackup(win.estadoLocal(),imported);
           if(typeof win.aplicarEstadoCloud!=='function')throw Error('Motor local no disponible.');
           win.aplicarEstadoCloud(merged);
           if(typeof win.guardarEstadoLocalSinCloud!=='function')throw Error('No puede confirmarse el guardado local.');
           win.guardarEstadoLocalSinCloud();
           win.VC_V962_CLOUD_EFFICIENT?.markDirty?.('v1915-protected-recovery');
           row(preview,'Restauración aplicada y guardada localmente. Queda pendiente confirmar la nube y verificar registros.');
           context.lastImport=null;context.lastPreview=null;
         }catch(err){row(preview,'Restauración detenida: '+String(err.message||err));}
         finally{btn.disabled=false}
       });preview.append(btn);
     }).catch(err=>row(preview,'Copia no válida: '+String(err.message||err)));
     fileInput.value='';
   }
   function attach(){
     if(wrapper?.isConnected)return true;
     const host=doc.getElementById('vc191-data-panel')||doc.getElementById('v11-management');
     if(!host)return false;
     if(!doc.getElementById('vc1915-style')){
       const css=element('style');css.id='vc1915-style';css.textContent='#vc1915-panel{padding:14px;margin:12px 0;border:1px solid #c6d9ea;border-radius:11px;background:#f7fbfe;color:#1d4057;font:12px/1.5 system-ui}#vc1915-panel h4{margin:0 0 8px;font-size:15px}#vc1915-panel button{margin:5px 6px 4px 0;padding:9px 12px;border:1px solid #b4cfe2;border-radius:8px;background:white;color:#195377;font-size:12px;font-weight:700;cursor:pointer}#vc1915-panel .vc1915-item{border-top:1px solid #d3e3ee;padding:10px 0}#vc1915-panel p{margin:5px 0}';doc.head.append(css);
     }
     wrapper=element('section');wrapper.id='vc1915-panel';wrapper.append(element('h4','V19.1.5 · Conflictos y restauración JSON'));
     summary=element('p');list=element('div');preview=element('div');fileInput=element('input');fileInput.type='file';fileInput.accept='.json,application/json';fileInput.hidden=true;fileInput.addEventListener('change',openRecovery);
     const select=element('button','Examinar copia JSON');select.type='button';select.addEventListener('click',()=>fileInput.click());
     wrapper.append(summary,list,element('p','La restauración requiere una copia previa en IndexedDB. Guarda también una copia JSON en otro dispositivo.'),select,fileInput,preview);
     host.append(wrapper);render();return true;
   }
   win.addEventListener('vc1915:change',render);
   if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{
     if(!attach()){const timer=win.setInterval(()=>{if(attach())win.clearInterval(timer)},2000)}
   },{once:true});else if(!attach()){const timer=win.setInterval(()=>{if(attach())win.clearInterval(timer)},2000)}
 }
 return {pure,install};
});
