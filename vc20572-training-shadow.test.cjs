'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));

function fakeIDB({failPut=false,corruptRead=false}={}){
 const databases=new Map(),ops=[];
 const factory={
  open(name,version){
   ops.push({action:'open',name,version});let aborted=false;
   const req={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,
    transaction:{abort(){aborted=true}}};
   queueMicrotask(()=>{
    let db=databases.get(name),fresh=!db;
    if(!db){
     const stores=new Map();
     db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
      createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
      close(){ops.push({action:'close'})},
      transaction(keys,mode){
       ops.push({action:'transaction',mode});
       const staged=new Map([...stores].map(([key,v])=>[key,{keyPath:v.keyPath,
        rows:new Map([...v.rows].map(([id,row])=>[id,clone(row)]))}]));
       let pending=0,scheduled=false,abortedTx=false,completed=false;
       const schedule=()=>{
        if(scheduled)return;scheduled=true;
        setTimeout(()=>{
         scheduled=false;
         if(abortedTx||completed)return;
         if(pending){schedule();return}
         completed=true;
         if(mode==='readwrite')for(const [key,v] of staged)stores.get(key).rows=v.rows;
         tx.oncomplete?.();
        },0);
       };
       const tx={error:null,oncomplete:null,onerror:null,onabort:null,
        abort(){abortedTx=true;queueMicrotask(()=>tx.onabort?.())},
        objectStore(key){
         assert.ok(keys.includes(key));const target=staged.get(key);
         const asyncRead=fetch=>{
          pending++;const request={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{
           let value=fetch();
           if(corruptRead&&mode==='readonly'&&key==='trainingRows'&&value&&
            !Array.isArray(value))value={...value,dataJson:'CORRUPTED'};
           request.result=value===undefined?undefined:clone(value);
           try{request.onsuccess?.()}finally{pending--;schedule()}
          });return request;
         };
         return {
          get(id){return asyncRead(()=>target.rows.get(id))},
          getAllKeys(){return asyncRead(()=>[...target.rows.keys()])},
          put(row){assert.equal(mode,'readwrite');
           if(failPut)throw Error('PRIVATE-DISK-FAILURE');
           ops.push({action:'put',store:key});target.rows.set(row[target.keyPath],clone(row));
           schedule();return {};
          },
          delete(id){assert.equal(mode,'readwrite');ops.push({action:'delete',store:key});
           target.rows.delete(id);schedule();return {};
          }
         };
        }
       };return tx;
      },
      __records:stores};
    }
    if(fresh||(version!==undefined&&version>db.version)){
     req.result=db;req.onupgradeneeded?.();
     if(aborted){req.error=Error('AbortError');req.onerror?.();return}
     db.version=version??1;databases.set(name,db);
    }
    req.result=db;req.onsuccess?.();
   });return req;
  },
  deleteDatabase(name){databases.delete(name);ops.push({action:'deleteDatabase',name});
   const req={onsuccess:null,onerror:null,error:null};queueMicrotask(()=>req.onsuccess?.());return req}
 };
 return {factory,databases,ops};
}
function fakeLocks(){
 const held=new Set();
 return {request(name,options,callback){
  assert.equal(options.ifAvailable,true);
  if(held.has(name))return Promise.resolve(callback(null));
  held.add(name);return Promise.resolve(callback({name})).finally(()=>{held.delete(name)});
 }};
}
const club=()=>({version:5.8,bibliotecaCompartida:[{id:1,nombre:'LIBRO PRIVADO'}],
 equiposData:{
  infantil:{sesionActual:[{id:'a2',nombre:'PASE'},{uuid:'b1',nombre:'RECEPCIÓN'}],
   historial:[{id:8,objetivo:'SAQUE'}],planificacion:[{id:'plan1',fecha:'2026-11-26'}],
   plantillas:[],meta:{fecha:'2026-11-26',playerIds:[9,10]},
   jugadores:[{id:9,nombre:'JUGADORA PRIVADA'}],
   scoutingMatches:[{rallies:[{code:'*12S#',videoTime:120}]}]},
  cadete:{sesionActual:[],historial:[],planificacion:[],plantillas:[],meta:{objetivo:'Defensa'}}
 }});
const plan=(mod,source,revision='test')=>mod.planTrainingShadow(JSON.stringify(source),revision);
function mockView(mem,locks,raw){
 const elements={},events=new Map();
 const button=()=>({disabled:true,handlers:new Map(),
  addEventListener(name,fn){this.handlers.set(name,fn)},
  removeEventListener(name){this.handlers.delete(name)}});
 for(const id of ['vc20572-arm-training','vc20572-pause-training',
  'vc20572-check-training','vc20572-erase-training'])elements[id]=button();
 elements['vc20572-training-status']={textContent:''};
 const state=new Map([['volleyCoachStateV43',raw]]);
 const win={document:{getElementById:key=>elements[key]||null},indexedDB:mem.factory,
  navigator:{locks},localStorage:{getItem:key=>state.get(key)??null},confirm:()=>true,
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 return {win,elements,events,state};
}

test('plans only training entities, preserving field presence, ID types and order',async()=>{
 const mod=await compiled(),source=club(),original=clone(source),p=plan(mod,source);
 assert.equal(p.complete,true);assert.equal(p.rows.length,6);
 assert.deepEqual(p.layout.infantil.order.sesionActual.map(key=>JSON.parse(key).at(-1)),['a2','b1']);
 assert.equal(p.layout.infantil.present.plantillas,true);
 assert.equal(p.layout.infantil.present.meta,true);
 assert.equal(JSON.stringify(p).includes('scoutingMatches'),false);
 assert.equal(JSON.stringify(p).includes('JUGADORA PRIVADA'),false);
 assert.equal(JSON.stringify(p).includes('LIBRO PRIVADO'),false);
 assert.equal(JSON.stringify(p).includes('*12S#'),false);
 assert.deepEqual(source,original);
});

test('historical missing and duplicate IDs refuse all training writes',async()=>{
 const mod=await compiled(),source=club(),mem=fakeIDB();
 source.equiposData.infantil.historial.push({fecha:'2026-01-01'});
 source.equiposData.infantil.sesionActual.push({id:'a2',nombre:'DUPLICADA'});
 const p=plan(mod,source);
 assert.equal(p.complete,false);assert.equal(p.pendingIds,3);
 await assert.rejects(mod.writeTrainingShadow({factory:mem.factory,plan:p}),/IDs pendientes/);
 assert.equal(mem.databases.size,0);
 assert.equal((await mod.inspectTrainingShadow({factory:mem.factory,plan:p})).status,'incomplete');
 assert.equal(mem.ops.length,0);
});

test('incremental mirror writes, verifies, retains unchanged entities and deletes obsolete rows',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=club();
 const first=await mod.writeTrainingShadow({factory:mem.factory,plan:plan(mod,source,'first')});
 assert.equal(first.status,'verified');assert.equal(first.records,6);assert.equal(first.added,6);
 const putCount=()=>mem.ops.filter(op=>op.action==='put'&&op.store==='trainingRows').length;
 assert.equal(putCount(),6);
 const same=await mod.writeTrainingShadow({factory:mem.factory,plan:plan(mod,source,'second')});
 assert.equal(same.unchanged,6);assert.equal(putCount(),6);
 source.equiposData.infantil.sesionActual[0].nombre='CAMBIADA';
 source.equiposData.infantil.historial=[];
 const next=await mod.writeTrainingShadow({factory:mem.factory,plan:plan(mod,source,'third')});
 assert.equal(next.changed,1);assert.equal(next.removed,1);assert.equal(next.added,0);
 assert.equal(putCount(),7);
 assert.equal((await mod.inspectTrainingShadow({factory:mem.factory,plan:plan(mod,source)})).status,'verified');
 assert.equal(source.equiposData.infantil.scoutingMatches[0].rallies[0].code,'*12S#');
});

test('read-only checks never create missing stores and detect order, tampering and orphan rows',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=club();
 assert.equal((await mod.inspectTrainingShadow({factory:mem.factory,plan:plan(mod,source)})).status,'missing');
 assert.equal(mem.databases.size,0);
 await mod.writeTrainingShadow({factory:mem.factory,plan:plan(mod,source)});
 const readOps=()=>mem.ops.filter(op=>op.action==='put'||op.action==='delete').length;
 const initial=readOps();
 source.equiposData.infantil.sesionActual.reverse();
 assert.equal((await mod.inspectTrainingShadow({factory:mem.factory,plan:plan(mod,source)})).status,'different');
 source.equiposData.infantil.sesionActual.reverse();
 const store=mem.databases.get(mod.TRAINING_SHADOW_DB).__records.get('trainingRows').rows;
 store.set('orphan',{key:'orphan',teamId:'infantil',field:'historial',dataJson:'{}'});
 assert.equal((await mod.inspectTrainingShadow({factory:mem.factory,plan:plan(mod,source)})).status,'different');
 assert.equal(readOps(),initial);
});

test('disk errors and corrupted verification never become a successful receipt',async()=>{
 const mod=await compiled(),src=club();
 await assert.rejects(mod.writeTrainingShadow({factory:fakeIDB({failPut:true}).factory,
  plan:plan(mod,src)}),/PRIVATE-DISK-FAILURE/);
 await assert.rejects(mod.writeTrainingShadow({factory:fakeIDB({corruptRead:true}).factory,
  plan:plan(mod,src)}),/no coincide/);
});

test('manual UI never writes before opt-in; lock blocks second tab and pauses external changes',async()=>{
 const mod=await compiled(),mem=fakeIDB(),locks=fakeLocks(),raw=JSON.stringify(club());
 const first=mockView(mem,locks,raw),second=mockView(mem,locks,raw);
 const a=mod.mountTrainingShadowPanel(first.win),b=mod.mountTrainingShadowPanel(second.win);
 assert.ok(a&&b);assert.equal(a.authoritative,false);assert.equal(a.enabled(),false);
 assert.equal(mem.databases.size,0);
 await a.arm();await a.whenIdle();
 assert.equal(a.enabled(),true);
 assert.equal((await a.inspect()).status,'verified');
 await assert.rejects(b.arm(),/Otra pestaña/);
 assert.equal(mem.databases.size,1);
 first.events.get('storage')({key:'volleyCoachStateV43'});
 await a.whenIdle();assert.equal(a.enabled(),false);
 await b.arm();await b.whenIdle();
 assert.equal((await b.inspect()).status,'verified');
 b.pause();await b.whenIdle();
 a.dispose();b.dispose();
});

test('opt-in reads compact canonical saves using the existing decompressor, without rewriting them',async()=>{
 const mod=await compiled(),mem=fakeIDB(),raw=JSON.stringify(club());
 const view=mockView(mem,fakeLocks(),'VC-LZW16-1:EXISTING-COMPRESSED-PAYLOAD');
 let unpacked=0;
 view.win.VC_STORAGE_QUOTA_1531={unpack:p=>{
  assert.equal(p,'VC-LZW16-1:EXISTING-COMPRESSED-PAYLOAD');unpacked++;return raw;
 }};
 const api=mod.mountTrainingShadowPanel(view.win);
 await api.arm();await api.whenIdle();
 assert.equal((await api.inspect()).status,'verified');
 assert.ok(unpacked>=2);
 assert.equal(view.state.get('volleyCoachStateV43'),'VC-LZW16-1:EXISTING-COMPRESSED-PAYLOAD');
 api.dispose();await api.whenIdle();
});

test('isolated deletion preserves canonical state, player replica and scouting',async()=>{
 const mod=await compiled(),mem=fakeIDB(),locks=fakeLocks(),raw=JSON.stringify(club());
 const view=mockView(mem,locks,raw),api=mod.mountTrainingShadowPanel(view.win);
 await api.arm();await api.whenIdle();
 const player=mem.factory.open(mod.PLAYER_SHADOW_DB,1);
 await new Promise(resolve=>{player.onupgradeneeded=()=>player.result.createObjectStore('sentinel',{keyPath:'key'});
  player.onsuccess=()=>{player.result.close();resolve()}});
 assert.equal(mem.databases.size,2);
 assert.equal(await api.erase(),true);
 assert.equal(mem.databases.size,1);
 assert.ok(mem.databases.has(mod.PLAYER_SHADOW_DB));
 assert.equal(view.state.get('volleyCoachStateV43'),raw);
 api.dispose();
});

test('V20.5.72 release installs training mirror only after original confirmed save',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.5.73');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20572-training-shadow.test.cjs'));
 assert.ok(html.includes('id="vc20572-arm-training" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.73'));
 assert.ok(read('service-worker.js').includes('training-shadow-20.5.72'));
 const writer=read('002-core-training-v150-monolithic.js');
 assert.ok(writer.includes('VC_TRAINING_SHADOW_20572'));
 assert.ok(writer.indexOf('vc1531WriteState(APP_STORAGE_KEY,raw)')<
  writer.indexOf('VC_TRAINING_SHADOW_20572'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountTrainingShadowPanel(window)'));
 assert.ok(!read('src/state/training-shadow-runtime.ts').includes('supabase'));
});
