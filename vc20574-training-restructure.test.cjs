'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const fixture=()=>({version:5.8,equiposData:{infantil:{
 sesionActual:[{id:1,nombre:'PASE'}],historial:[{uuid:'H1',ejercicios:[]}],
 planificacion:[],plantillas:[],meta:{notas:'ENTRENO_PRIVADO'},
 jugadores:[{id:1,nombre:'JUGADORA_PRIVADA'}],scoutingMatches:[{id:6,code:'PRIVADO_SCOUT'}]
}}});
function memory(){
 const databases=new Map(),operations=[];
 const factory={open(name,version){
  operations.push({op:'open',version});let aborted=false;
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
      operations.push({op:'transaction',mode});
      const staged=new Map([...stores].map(([name,store])=>[name,{keyPath:store.keyPath,
       rows:new Map([...store.rows].map(([id,data])=>[id,copy(data)]))}]));
      let pending=0,scheduled=false,finished=false,cancelled=false;
      const schedule=()=>{
       if(scheduled)return;scheduled=true;
       setTimeout(()=>{
        scheduled=false;if(cancelled||finished)return;
        if(pending){schedule();return}
        finished=true;
        if(mode==='readwrite')for(const [key,store] of staged)stores.get(key).rows=store.rows;
        tx.oncomplete?.();
       },0);
      };
      const tx={error:null,oncomplete:null,onerror:null,onabort:null,
       abort(){cancelled=true;queueMicrotask(()=>tx.onabort?.())},
       objectStore(name){
        assert.ok(names.includes(name));const store=staged.get(name);
        const get=selector=>{
         pending++;const req={result:undefined,error:null,onsuccess:null,onerror:null};
         queueMicrotask(()=>{req.result=copy(selector());
          try{req.onsuccess?.()}finally{pending--;schedule()}});
         return req;
        };
        return {
         get(id){return get(()=>store.rows.get(id))},
         getAllKeys(){return get(()=>[...store.rows.keys()])},
         put(row){assert.equal(mode,'readwrite');store.rows.set(row[store.keyPath],copy(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');store.rows.delete(id);schedule();return {}}
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
 },deleteDatabase(){throw Error('La verificación no puede borrar la réplica')}};
 return {databases,factory,operations};
}
function locks(){
 let locked=false;
 const port={request(_name,options,callback){
  assert.equal(options.ifAvailable,true);
  if(locked)return Promise.resolve(callback(null));
  locked=true;return Promise.resolve(callback({name:'exclusive'})).finally(()=>{locked=false});
 }};
 return {port,occupy:()=>port.request('manual',{mode:'exclusive',ifAvailable:true},
  ()=>new Promise(resolve=>{port.release=resolve})),release:()=>port.release?.()};
}
function localStore(raw){
 const data=new Map([['volleyCoachStateV43',raw]]);
 return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
}
function view(factory,store,lock){
 const elements={};for(const id of ['vc20572-arm-training','vc20572-pause-training',
  'vc20572-check-training','vc20572-erase-training','vc20573-export-training',
  'vc20574-prepare-training-cold','vc20574-verify-training-cold',
  'vc20574-cancel-training-cold'])elements[id]={disabled:true,events:new Map(),
   addEventListener(t,fn){this.events.set(t,fn)},removeEventListener(t){this.events.delete(t)}};
 for(const id of ['vc20572-training-status','vc20573-export-status',
  'vc20574-training-cold-status'])elements[id]={textContent:''};
 const win={document:{getElementById:id=>elements[id]??null},indexedDB:factory,
  localStorage:store,navigator:{locks:lock},crypto:webcrypto,confirm:()=>true,
  addEventListener(){},removeEventListener(){}};
 return {win,elements};
}

test('V20.5.74 pure planning dates and weekday use local calendar, never UTC conversion',async()=>{
 const mod=await compiled();
 for(const iso of ['2026-11-23T22:30:00','2026-03-29T01:30:00','2026-10-25T02:30:00']){
  const d=new Date(iso),start=mod.startOfTrainingWeek(d);
  assert.equal(start.getDay(),1);assert.equal(start.getHours(),0);
  assert.equal(mod.formatTrainingLocalDate(d).length,10);
  assert.equal(d.getTime(),new Date(iso).getTime(),'pure logic never changes its date argument');
 }
 assert.equal(mod.formatTrainingLocalDate(new Date(2026,0,1)),'2026-01-01');
});

test('legacy planning calls TypeScript bridge for dates, weeks and all plan status priorities',async()=>{
 const mod=await compiled(),source=read('002-core-training-v150-monolithic.js');
 const fragments=[['function fechaLocalISO(', 'let equipoActivo='],
  ['function minutosListaEjercicios(', 'function fundamentosConMinutos('],
  ['function lunesDeSemana(', 'function isoDate('],
  ['function estadoPlanificacion(', 'function editarEntrenamientoPlanificacion(']];
 const ctx={window:{},meta:{planificacionId:42},Date};
 for(const [start,end] of fragments){const a=source.indexOf(start),b=source.indexOf(end,a);
  assert.ok(a>0&&b>a);vm.runInNewContext(source.slice(a,b),ctx)}
 const plans=[{id:42,fecha:'2026-01-01',realizado:true},
  {id:42,fecha:'2026-01-01'},{id:8,historialId:50,fecha:'2027-01-01'},
  {id:8,fecha:'2026-02-01'},{id:8,fecha:'2027-05-01'}];
 const before=plans.map(plan=>JSON.stringify(ctx.estadoPlanificacion(plan,'2026-11-26')));
 const bridge=mod.installTrainingPlanningBridge(ctx.window);
 assert.equal(bridge.VERSION,'20.5.74');assert.equal(bridge.pureOnly,true);
 const after=plans.map(plan=>JSON.stringify(ctx.estadoPlanificacion(plan,'2026-11-26')));
 assert.deepEqual(after,before);
 assert.deepEqual(after,plans.map(plan=>JSON.stringify(mod.classifyTrainingPlan(plan,42,'2026-11-26'))));
 assert.equal(ctx.fechaLocalISO(new Date(2026,10,26)),'2026-11-26');
 assert.equal(ctx.lunesDeSemana(new Date(2026,10,26)).getDate(),23);
 for(const exercises of [[],[{tiempo:20},{tiempo:'15'},{tiempo:null}],
  [{tiempo:0},{tiempo:'no válido'},{tiempo:-2}]]){
  assert.equal(ctx.minutosListaEjercicios(exercises),mod.totalTrainingMinutes(exercises));
 }
 // A compatible bridge is invoked; this is a real replacement of the read path.
 assert.ok(Object.isFrozen(bridge));
});

test('cold ticket contains only SHA-256/count and survives a new runtime instance',async()=>{
 const mod=await compiled(),src=fixture(),raw=JSON.stringify(src),mem=memory(),lock=locks();
 await mod.writeTrainingShadow({factory:mem.factory,plan:mod.planTrainingShadow(raw,'first')});
 const store=localStore(raw),first=view(mem.factory,store,lock.port);
 const api=mod.mountTrainingShadowPanel(first.win);await api.prepareCold();
 const marker=store.getItem(mod.TRAINING_COLD_REOPEN_KEY);
 assert.ok(marker);assert.equal(marker.includes('ENTRENO_PRIVADO'),false);
 assert.equal(marker.includes('JUGADORA_PRIVADA'),false);
 assert.equal(marker.includes('equiposData'),false);
 assert.equal(JSON.parse(marker).records,3);
 assert.equal(first.elements['vc20574-verify-training-cold'].disabled,false);
 api.dispose();await api.whenIdle();
 const second=view(mem.factory,store,lock.port),next=mod.mountTrainingShadowPanel(second.win);
 assert.match(second.elements['vc20574-training-cold-status'].textContent,/pendiente/);
 const result=await next.verifyCold();
 assert.equal(result.status,'verified');assert.equal(result.records,3);
 assert.equal(result.readOnly,true);assert.equal(result.authoritative,false);
 assert.equal(store.getItem(mod.TRAINING_COLD_REOPEN_KEY),null);
 assert.equal(store.getItem('volleyCoachStateV43'),raw);
 assert.ok(mem.operations.filter(op=>op.mode==='readonly').length>=2);
 next.dispose();
});

test('changed source, damaged replica, missing replica, invalid and expired tickets fail closed',async()=>{
 const mod=await compiled(),src=fixture(),raw=JSON.stringify(src),mem=memory();
 const plan=mod.planTrainingShadow(raw,'before');
 await mod.writeTrainingShadow({factory:mem.factory,plan});
 const ticket=await mod.prepareTrainingColdReopen({raw,factory:mem.factory,subtle:webcrypto.subtle,now:Date.now()});
 const base={ticket,raw,factory:mem.factory,subtle:webcrypto.subtle,now:Date.now()};
 assert.equal((await mod.verifyTrainingColdReopen({...base,raw:raw.replace('PASE','CAMBIADO')})).status,'different');
 const db=mem.databases.get(mod.TRAINING_SHADOW_DB);
 const first=plan.rows[0];db.__stores.get('trainingRows').rows.set(first.key,{...copy(first),dataJson:'{}'});
 assert.equal((await mod.verifyTrainingColdReopen(base)).status,'different');
 assert.equal((await mod.verifyTrainingColdReopen({...base,factory:memory().factory})).status,'missing');
 assert.equal((await mod.verifyTrainingColdReopen({...base,ticket:'{bad'})).status,'invalid');
 const expired=JSON.parse(ticket);expired.createdAt-=25*60*60*1000;
 assert.equal((await mod.verifyTrainingColdReopen({...base,ticket:JSON.stringify(expired)})).status,'expired');
 const invalid=fixture();invalid.equiposData.infantil.historial.push({nombre:'NO_ID'});
 await assert.rejects(mod.prepareTrainingColdReopen({...base,raw:JSON.stringify(invalid)}),/incomplete/);
});

test('locked second tab cannot consume cold marker and cancellation touches marker only',async()=>{
 const mod=await compiled(),src=fixture(),raw=JSON.stringify(src),mem=memory(),lock=locks();
 await mod.writeTrainingShadow({factory:mem.factory,plan:mod.planTrainingShadow(raw,'first')});
 const store=localStore(raw),page=view(mem.factory,store,lock.port),api=mod.mountTrainingShadowPanel(page.win);
 const occupancy=lock.occupy();await Promise.resolve();
 await assert.rejects(api.prepareCold(),/Otra pestaña/);
 assert.equal(store.getItem(mod.TRAINING_COLD_REOPEN_KEY),null);
 lock.release();await occupancy;
 await api.prepareCold();assert.ok(store.getItem(mod.TRAINING_COLD_REOPEN_KEY));
 const occupancy2=lock.occupy();await Promise.resolve();
 await assert.rejects(api.verifyCold(),/Otra pestaña/);
 assert.ok(store.getItem(mod.TRAINING_COLD_REOPEN_KEY),'blocked verification preserves marker');
 lock.release();await occupancy2;
 await api.cancelCold();assert.equal(store.getItem(mod.TRAINING_COLD_REOPEN_KEY),null);
 assert.equal(store.getItem('volleyCoachStateV43'),raw);
 api.dispose();
});

test('V20.5.74 release preserves classic writer and exposes only manual read-only cold controls',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.5.78');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20574-training-restructure.test.cjs'));
 assert.ok(html.includes('id="vc20574-prepare-training-cold" disabled'));
 assert.ok(html.includes('id="vc20574-verify-training-cold" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.78'));
 assert.ok(read('service-worker.js').includes('training-cold-20.5.74-planning-core'));
 assert.ok(read('src/vc2055-entry.ts').includes('installTrainingPlanningBridge(window)'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(read('002-core-training-v150-monolithic.js').includes('window.VC_TRAINING_PLANNING_20574'));
 assert.ok(read('021-core-scouting-v150-monolithic.js').includes('function'));
});
