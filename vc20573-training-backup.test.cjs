'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const copy=x=>JSON.parse(JSON.stringify(x));
const fixture=()=>({version:5.8,bibliotecaCompartida:[{nombre:'PRIVADA-BIBLIOTECA'}],
 equiposData:{
  infantil:{sesionActual:[{id:2,nombre:'PASE'},{uuid:'ex-1',nombre:'RECEPCION'}],
   historial:[{id:'h1',ejercicios:[]}],planificacion:[{id:8,nombre:'SEMANA'}],
   plantillas:[],meta:{fecha:'2026-11-26',notas:'PERSONAL-ENTRENO'},
   jugadores:[{id:2,nombre:'PRIVADA-JUGADORA'}],
   scoutingMatches:[{id:8,rallies:[{code:'*12S#',videoTime:25}]}]},
  cadete:{sesionActual:[],historial:[],meta:{objetivo:'Bloqueo'}}
 }});

function memory({corrupt=false,onRead}={}){
 const databases=new Map(),operations=[];
 const factory={open(name,version){
  operations.push({kind:'open',version});let aborted=false;
  const request={result:null,error:null,onupgradeneeded:null,onerror:null,onsuccess:null,
   transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),fresh=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){},__stores:stores,
     transaction(names,mode){
      operations.push({kind:'transaction',mode});
      const staged=new Map([...stores].map(([key,entry])=>[key,{keyPath:entry.keyPath,
       rows:new Map([...entry.rows].map(([id,row])=>[id,copy(row)]))}]));
      let pending=0,scheduled=false,finished=false,cancelled=false;
      const schedule=()=>{
       if(scheduled)return;scheduled=true;
       setTimeout(()=>{
        scheduled=false;if(cancelled||finished)return;
        if(pending){schedule();return}
        finished=true;
        if(mode==='readwrite')for(const [key,entry] of staged)stores.get(key).rows=entry.rows;
        tx.oncomplete?.();
       },0);
      };
      const tx={error:null,oncomplete:null,onabort:null,onerror:null,
       abort(){cancelled=true;queueMicrotask(()=>tx.onabort?.())},
       objectStore(key){
        assert.ok(names.includes(key));const current=staged.get(key);
        const get=callback=>{
         pending++;const req={result:undefined,error:null,onsuccess:null,onerror:null};
         queueMicrotask(()=>{
          onRead?.(mode,key);
          let value=callback();
          if(corrupt&&mode==='readonly'&&key==='trainingRows'&&!Array.isArray(value)&&value)
           value={...value,dataJson:'{INVALID'};
          req.result=value===undefined?undefined:copy(value);
          try{req.onsuccess?.()}finally{pending--;schedule()}
         });return req;
        };
        return {
         get(id){return get(()=>current.rows.get(id))},
         getAllKeys(){return get(()=>[...current.rows.keys()])},
         put(row){assert.equal(mode,'readwrite');operations.push({kind:'put',key});
          current.rows.set(row[current.keyPath],copy(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');operations.push({kind:'delete',key});
          current.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     }};
   }
   if(fresh||(version!==undefined&&version>db.version)){
    request.result=db;request.onupgradeneeded?.();
    if(aborted){request.error=Error('AbortError');request.onerror?.();return}
    db.version=version??1;databases.set(name,db);
   }
   request.result=db;request.onsuccess?.();
  });return request;
 },deleteDatabase(){throw Error('La recuperación nunca debe borrar bases de datos')}};
 return {factory,databases,operations};
}
function locks(){
 const held=new Set();
 return {request(name,options,fn){
  if(held.has(name))return Promise.resolve(fn(null));
  assert.equal(options.ifAvailable,true);held.add(name);
  return Promise.resolve(fn({name})).finally(()=>held.delete(name));
 }};
}
function view(mem,lock,raw){
 const elements={},events=new Map(),state=new Map([['volleyCoachStateV43',raw]]);
 for(const id of ['vc20572-arm-training','vc20572-pause-training',
  'vc20572-check-training','vc20572-erase-training','vc20573-export-training'])
  elements[id]={disabled:true,handlers:new Map(),
   addEventListener(event,handler){this.handlers.set(event,handler)},
   removeEventListener(event){this.handlers.delete(event)}};
 for(const id of ['vc20572-training-status','vc20573-export-status'])
  elements[id]={textContent:''};
 const win={document:{getElementById:id=>elements[id]||null},indexedDB:mem.factory,
  navigator:{locks:lock},localStorage:{getItem:id=>state.get(id)??null},
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
  confirm:()=>true};
 return {win,state,elements,events};
}
const plan=(mod,source)=>mod.planTrainingShadow(JSON.stringify(source),'test');

test('V20.5.73 rebuilds sessions and metadata in original order, preserving absent versus empty',async()=>{
 const mod=await compiled(),src=fixture(),mem=memory(),raw=JSON.stringify(src);
 const p=plan(mod,src);
 await mod.writeTrainingShadow({factory:mem.factory,plan:p});
 const backup=await mod.prepareTrainingShadowBackup({factory:mem.factory,plan:p,originalRaw:raw});
 assert.equal(backup.status,'ready');assert.equal(backup.readOnly,true);
 assert.equal(backup.authoritative,false);assert.equal(backup.records,6);
 const payload=JSON.parse(backup.json);
 assert.equal(payload.schema,'volley-coach-training-backup');
 assert.equal(payload.scope,'entrenamientos');
 assert.deepEqual(payload.teams.infantil.sesionActual,src.equiposData.infantil.sesionActual);
 assert.deepEqual(payload.teams.infantil.historial,src.equiposData.infantil.historial);
 assert.deepEqual(payload.teams.infantil.plantillas,[]);
 assert.equal(Object.hasOwn(payload.teams.cadete,'plantillas'),false);
 assert.equal(JSON.stringify(payload).includes('PRIVADA-JUGADORA'),false);
 assert.equal(JSON.stringify(payload).includes('PRIVADA-BIBLIOTECA'),false);
 assert.equal(JSON.stringify(payload).includes('*12S#'),false);
 assert.equal(JSON.stringify(payload).includes('videoTime'),false);
});

test('no database, no IDs, changed source or extra rows never produce an export',async()=>{
 const mod=await compiled(),mem=memory(),src=fixture(),p=plan(mod,src),raw=JSON.stringify(src);
 assert.equal((await mod.prepareTrainingShadowBackup({factory:mem.factory,plan:p,originalRaw:raw})).status,'missing');
 assert.equal(mem.databases.size,0);
 const legacy=fixture();legacy.equiposData.infantil.historial.push({nombre:'SIN-ID'});
 const incomplete=await mod.prepareTrainingShadowBackup({factory:mem.factory,
  plan:plan(mod,legacy),originalRaw:JSON.stringify(legacy)});
 assert.equal(incomplete.status,'incomplete');assert.equal(incomplete.json,undefined);
 await mod.writeTrainingShadow({factory:mem.factory,plan:p});
 src.equiposData.infantil.sesionActual.reverse();
 const altered=await mod.prepareTrainingShadowBackup({factory:mem.factory,
  plan:plan(mod,src),originalRaw:JSON.stringify(src)});
 assert.equal(altered.status,'different');assert.equal(altered.json,undefined);
 src.equiposData.infantil.sesionActual.reverse();
 const rows=mem.databases.get(mod.TRAINING_SHADOW_DB).__stores.get('trainingRows').rows;
 rows.set('extra',{key:'extra',teamId:'cadete',field:'historial',dataJson:'{}'});
 const extra=await mod.prepareTrainingShadowBackup({factory:mem.factory,
  plan:p,originalRaw:raw});
 assert.equal(extra.status,'different');assert.equal(extra.json,undefined);
});

test('corrupt row and malformed historical layout cannot masquerade as verified',async()=>{
 const mod=await compiled(),src=fixture(),raw=JSON.stringify(src),mem=memory();
 const p=plan(mod,src);await mod.writeTrainingShadow({factory:mem.factory,plan:p});
 const row=mem.databases.get(mod.TRAINING_SHADOW_DB).__stores.get('trainingRows').rows;
 const key=p.rows[0].key;row.set(key,{...row.get(key),dataJson:'{}'});
 assert.equal((await mod.prepareTrainingShadowBackup({factory:mem.factory,
  plan:p,originalRaw:raw})).status,'different');
 const wrong={...p,layout:{...p.layout,cadete:{...p.layout.cadete,
  present:{...p.layout.cadete.present,plantillas:true}}}};
 assert.throws(()=>mod.reconstructTrainingsForBackup(wrong,new Map(p.rows.map(r=>[r.key,r]))),/Orden histórico/);
});

test('successful export is read-only after the initial opt-in mirror',async()=>{
 const mod=await compiled(),src=fixture(),mem=memory(),p=plan(mod,src),raw=JSON.stringify(src);
 await mod.writeTrainingShadow({factory:mem.factory,plan:p});
 const before=mem.operations.filter(x=>x.kind==='put'||x.kind==='delete').length;
 const recovered=await mod.prepareTrainingShadowBackup({factory:mem.factory,
  plan:p,originalRaw:raw});
 assert.equal(recovered.status,'ready');
 assert.equal(mem.operations.filter(x=>x.kind==='put'||x.kind==='delete').length,before);
 assert.ok(mem.operations.filter(x=>x.kind==='transaction').slice(-1)
  .every(x=>x.mode==='readonly'));
 assert.equal(mem.operations.filter(x=>x.kind==='open').at(-1).version,undefined);
 assert.deepEqual(src,fixture());
});

test('Gestión pauses the opt-in writer and exports only after an exclusive check',async()=>{
 const mod=await compiled(),raw=JSON.stringify(fixture()),mem=memory(),lock=locks();
 const ui=view(mem,lock,raw),api=mod.mountTrainingShadowPanel(ui.win);
 assert.ok(api);assert.equal(ui.elements['vc20573-export-training'].disabled,false);
 assert.equal(mem.databases.size,0);
 await api.arm();await api.whenIdle();
 assert.equal(api.enabled(),true);
 const backup=await api.backup();
 assert.equal(backup.status,'ready');assert.equal(api.enabled(),false);
 assert.match(ui.elements['vc20573-export-status'].textContent,/Exportación verificada/);
 assert.equal(ui.state.get('volleyCoachStateV43'),raw);
 api.dispose();
});

test('a competing tab and a main-club change during backup block the download',async()=>{
 const mod=await compiled(),raw=JSON.stringify(fixture()),lock=locks(),ui=view(memory(),lock,raw);
 const api=mod.mountTrainingShadowPanel(ui.win);
 const locked=await mod.tryAcquirePlayerShadowLock(lock,mod.TRAINING_SHADOW_LOCK);
 await assert.rejects(api.backup(),/Otra pestaña/);
 locked.release();await locked.released;api.dispose();
 let changed=false,enable=false;
 const late=memory({onRead:(mode,key)=>{
  if(enable&&mode==='readonly'&&key==='trainingRows'&&!changed){
   changed=true;ui2.state.set('volleyCoachStateV43',raw.replace('RECEPCION','MODIFICADA'));
  }
 }});
 const ui2=view(late,locks(),raw),second=mod.mountTrainingShadowPanel(ui2.win);
 await second.arm();await second.whenIdle();
 // A separate tab changes the original while the backup transaction is open.
 enable=true;
 const result=await second.backup();
 assert.equal(result.status,'different');assert.equal(result.json,undefined);
 second.dispose();
});

test('V20.5.73 release retains original single writer and publishes export UI',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.6.1');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20573-training-backup.test.cjs'));
 assert.ok(html.includes('id="vc20573-export-training" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.1'));
 assert.ok(read('service-worker.js').includes('training-backup-20.5.73'));
 assert.ok(read('src/vc2055-entry.ts').includes('prepareTrainingShadowBackup'));
 const original=read('002-core-training-v150-monolithic.js');
 assert.equal((original.match(/vc1531WriteState\(APP_STORAGE_KEY,raw\)/g)||[]).length,1);
 assert.ok(!read('src/state/training-shadow-backup.ts').includes('localStorage.setItem'));
 assert.ok(!read('src/state/training-shadow-backup.ts').includes('supabase'));
});
