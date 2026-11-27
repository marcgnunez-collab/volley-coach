'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const copy=v=>JSON.parse(JSON.stringify(v));

function fakeIDB(){
 const databases=new Map(),ops=[];
 const factory={open(name,version){
  ops.push({kind:'open',version});let aborted=false;
  const request={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,
   onblocked:null,transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),fresh=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){ops.push({kind:'close'})},
     transaction(keys,mode){
      ops.push({kind:'transaction',mode});
      const staged=new Map([...stores].map(([key,entry])=>[key,{keyPath:entry.keyPath,
       rows:new Map([...entry.rows].map(([k,v])=>[k,copy(v)]))}]));
      let pending=0,scheduled=false,cancelled=false;
      const tx={error:null,oncomplete:null,onabort:null,onerror:null,
       abort(){cancelled=true;queueMicrotask(()=>tx.onabort?.())},
       objectStore(key){
        assert.ok(keys.includes(key));const store=staged.get(key);assert.ok(store);
        const schedule=()=>{
         if(scheduled)return;scheduled=true;
         setTimeout(()=>{
          if(cancelled)return;
          if(pending){scheduled=false;schedule();return}
          if(mode==='readwrite')for(const [name,entry] of staged)stores.get(name).rows=entry.rows;
          tx.oncomplete?.();
         },0);
        };
        return {
         get(id){pending++;const r={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{r.result=store.rows.has(id)?copy(store.rows.get(id)):undefined;
           try{r.onsuccess?.()}finally{pending--;schedule()}});return r},
         put(row){assert.equal(mode,'readwrite');ops.push({kind:'put',store:key});
          store.rows.set(row[store.keyPath],copy(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');ops.push({kind:'delete',store:key});
          store.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     },__records:stores};
   }
   if(fresh||(version!==undefined&&version>db.version)){
    request.result=db;request.onupgradeneeded?.();
    if(aborted){request.error=Error('AbortError');request.onerror?.();return}
    db.version=version??1;databases.set(name,db);
   }
   request.result=db;request.onsuccess?.();
  });return request;
  },deleteDatabase(name){databases.delete(name);const req={onsuccess:null};
   queueMicrotask(()=>req.onsuccess?.());return req}
 };
 return {factory,databases,ops};
}
function sharedLocks(){
 let held=false;
 return {request(_name,_opt,cb){
  if(held)return Promise.resolve(cb(null));
  held=true;return Promise.resolve(cb({exclusive:true})).finally(()=>{held=false});
 }};
}
const fixture=()=>({version:5.8,bibliotecaCompartida:[{nombre:'BIBLIOTECA-PRIVADA'}],
 equiposData:{infantil:{jugadores:[{id:'z9',nombre:'JUGADORA-PRIVADA'},
  {uuid:'a1',numero:1}],scoutingMatches:[{rallies:[{code:'*12S#'}]}]},
  cadete:{jugadores:[]},juvenil:{historial:[]}}});
const plan=(mod,source,revision='v69')=>mod.planPlayerShadow(JSON.stringify(source),revision);

test('V20.5.69 reads player rows and rebuilds ordered player-only JSON without writes',async()=>{
 const mod=await compiled(),source=fixture(),before=copy(source),mem=fakeIDB();
 await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'written')});
 const putCount=mem.ops.filter(op=>op.kind==='put').length;
 const report=await mod.preparePlayerShadowBackup({factory:mem.factory,
  plan:plan(mod,source,'new-connection')});
 assert.equal(report.status,'ready');assert.equal(report.readOnly,true);
 assert.equal(report.authoritative,false);assert.equal(report.records,2);
 const data=JSON.parse(report.json);
 assert.equal(data.schema,'volley-coach-player-backup');assert.equal(data.scope,'jugadores');
 assert.deepEqual(data.teams.infantil.jugadores.map(p=>p.id||p.uuid),['z9','a1']);
 assert.deepEqual(data.teams.cadete.jugadores,[]);
 assert.equal(Object.hasOwn(data.teams.juvenil,'jugadores'),false);
 assert.equal(JSON.stringify(data).includes('*12S#'),false);
 assert.equal(JSON.stringify(data).includes('BIBLIOTECA-PRIVADA'),false);
 assert.equal(mem.ops.filter(op=>op.kind==='put').length,putCount);
 assert.equal(mem.ops.at(-2).mode,'readonly');
 assert.deepEqual(source,before);
});

test('missing replica does not create an IndexedDB database or export anything',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 const report=await mod.preparePlayerShadowBackup({factory:mem.factory,plan:plan(mod,source)});
 assert.equal(report.status,'missing');assert.equal(report.json,undefined);
 assert.equal(mem.databases.size,0);
});

test('partial IDs, stale player state and tampered rows refuse the backup',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'ok')});
 source.equiposData.infantil.jugadores.reverse();
 assert.equal((await mod.preparePlayerShadowBackup({factory:mem.factory,
  plan:plan(mod,source,'reordered')})).status,'different');
 source.equiposData.infantil.jugadores.reverse();
 const db=mem.databases.get(mod.PLAYER_SHADOW_DB);
 const row=db.__records.get('playerRows').rows.values().next().value;
 row.dataJson='CORRUPTED';
 assert.equal((await mod.preparePlayerShadowBackup({factory:mem.factory,
  plan:plan(mod,source,'corrupted')})).status,'different');
 db.__records.get('playerManifest').rows.clear();
 assert.equal((await mod.preparePlayerShadowBackup({factory:mem.factory,
  plan:plan(mod,source,'no-catalog')})).status,'different');
 source.equiposData.infantil.jugadores.push({nombre:'SIN-ID'});
 assert.equal((await mod.preparePlayerShadowBackup({factory:mem.factory,
  plan:plan(mod,source,'missing-id')})).status,'incomplete');
});

test('Gestion export is manual, pauses writer and checks the exact saved original',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture(),initial=JSON.stringify(source);
 await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'seed')});
 const button=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const arm=button(),pause=button(),check=button(),erase=button(),backup=button(),reopen=button();
 const status={textContent:''};
 const elements={'vc20567-arm-players':arm,'vc20567-pause-players':pause,
  'vc20567-check-players':check,'vc20567-erase-players':erase,
  'vc20569-download-players':backup,'vc20570-reopen-players':reopen,
  'vc20570-reopen-status':{textContent:''},
  'vc20571-prepare-cold':button(),'vc20571-verify-cold':button(),
  'vc20571-cancel-cold':button(),'vc20571-cold-status':{textContent:''},
  'vc20567-player-shadow-status':status};
 const local={state:initial,getItem(key){return key==='volleyCoachStateV43'?this.state:null}};
 const win={document:{getElementById:id=>elements[id]||null},
  navigator:{locks:sharedLocks()},indexedDB:mem.factory,localStorage:local,
  confirm:()=>true};
 const api=mod.mountPlayerShadowPanel(win);
 const startOpens=mem.ops.length;
 assert.equal(api.enabled(),false);assert.equal(mem.ops.length,startOpens);
 const result=await api.backup();
 assert.equal(result.status,'ready');assert.equal(api.enabled(),false);
 assert.ok(!status.textContent.includes('JUGADORA-PRIVADA'));
 assert.equal(local.state,initial);
 const modified=fixture();modified.equiposData.infantil.jugadores[0].nombre='CAMBIADA';
 local.state=JSON.stringify(modified);
 const stale=await api.backup();assert.equal(stale.status,'different');
 assert.equal(stale.json,undefined);
 api.dispose();assert.equal(backup.disabled,true);
});

test('release V69 includes export button and retains the original cloud and club writers',()=>{
 const html=read('index.html'),pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.0');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20569-player-shadow-backup.test.cjs'));
 assert.ok(html.includes('id="vc20569-download-players" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('preparePlayerShadowBackup'));
 assert.ok(read('service-worker.js').includes('player-shadow-backup-20.5.69'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
