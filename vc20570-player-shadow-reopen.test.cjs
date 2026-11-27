'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const fixture=()=>({version:5.8,equiposData:{infantil:{jugadores:[{id:'7',nombre:'PRIVADO'}]}}});

function fakeIDB(){
 const databases=new Map(),ops=[];
 const factory={open(name,version){
  ops.push({kind:'open',version});let aborted=false;
  const req={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,
   transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),fresh=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){ops.push({kind:'close'})},
     transaction(keys,mode){
      ops.push({kind:'transaction',mode});
      const staged=new Map([...stores].map(([key,s])=>[key,{keyPath:s.keyPath,
       rows:new Map([...s.rows].map(([k,v])=>[k,clone(v)]))}]));
      let pending=0,scheduled=false,aborted=false;
      const tx={error:null,oncomplete:null,onerror:null,onabort:null,
       abort(){aborted=true;queueMicrotask(()=>tx.onabort?.())},
       objectStore(key){
        assert.ok(keys.includes(key));const store=staged.get(key);assert.ok(store);
        const schedule=()=>{
         if(scheduled)return;scheduled=true;
         setTimeout(()=>{
          if(aborted)return;
          if(pending){scheduled=false;schedule();return}
          if(mode==='readwrite')for(const [k,s] of staged)stores.get(k).rows=s.rows;
          tx.oncomplete?.();
         },0);
        };
        return {
         get(id){pending++;const r={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{r.result=store.rows.has(id)?clone(store.rows.get(id)):undefined;
           try{r.onsuccess?.()}finally{pending--;schedule()}});return r},
         put(row){assert.equal(mode,'readwrite');ops.push({kind:'put'});
          store.rows.set(row[store.keyPath],clone(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');store.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     },__records:stores};
   }
   if(fresh||(version!==undefined&&version>db.version)){
    req.result=db;req.onupgradeneeded?.();
    if(aborted){req.error=Error('AbortError');req.onerror?.();return}
    db.version=version??1;databases.set(name,db);
   }
   req.result=db;req.onsuccess?.();
  });return req;
 },deleteDatabase(name){databases.delete(name);const req={onsuccess:null};
  queueMicrotask(()=>req.onsuccess?.());return req}};
 return {factory,databases,ops};
}
function sharedLocks(){
 let held=false;
 return {request(_name,_opt,fn){
  if(held)return Promise.resolve(fn(null));
  held=true;return Promise.resolve(fn({exclusive:true})).finally(()=>{held=false});
 }};
}
function fakeSession(){
 const data=new Map();return {data,
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
}
function view(mem,source,session,locks){
 const button=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const elements={};
 for(const id of ['vc20567-arm-players','vc20567-pause-players',
  'vc20567-check-players','vc20567-erase-players','vc20569-download-players',
  'vc20570-reopen-players','vc20571-prepare-cold',
  'vc20571-verify-cold','vc20571-cancel-cold'])elements[id]=button();
 const status={textContent:''};elements['vc20567-player-shadow-status']=status;
 elements['vc20570-reopen-status']={textContent:''};
 elements['vc20571-cold-status']={textContent:''};
 let reloads=0;
 const win={document:{getElementById:id=>elements[id]||null},indexedDB:mem.factory,
  navigator:{locks},crypto:webcrypto,sessionStorage:session,localStorage:source,
  location:{reload(){reloads++}},confirm:()=>true};
 return {win,status,elements,reloads:()=>reloads};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,25));

test('V20.5.70 ticket contains only digest and metadata, never player names or club JSON',async()=>{
 const mod=await compiled(),mem=fakeIDB(),raw=JSON.stringify(fixture());
 await mod.writePlayerShadow({factory:mem.factory,plan:mod.planPlayerShadow(raw,'seed')});
 const ticket=await mod.preparePlayerReopenTicket({raw,factory:mem.factory,
  subtle:webcrypto.subtle,now:10000});
 assert.equal(JSON.parse(ticket).records,1);
 assert.equal(ticket.includes('PRIVADO'),false);
 assert.ok(!ticket.includes('equiposData'));
 assert.equal((await mod.verifyPlayerReopenTicket({ticket,raw,factory:mem.factory,
  subtle:webcrypto.subtle,now:10001})).status,'verified');
 assert.equal(mem.ops.filter(o=>o.kind==='put').length,2);
 assert.equal(mem.ops.at(-2).mode,'readonly');
});

test('expired, forged, changed main-club and missing databases fail closed',async()=>{
 const mod=await compiled(),mem=fakeIDB(),raw=JSON.stringify(fixture());
 await mod.writePlayerShadow({factory:mem.factory,plan:mod.planPlayerShadow(raw,'seed')});
 const ticket=await mod.preparePlayerReopenTicket({raw,factory:mem.factory,
  subtle:webcrypto.subtle,now:10000});
 const verify=(t,r,now=10001)=>mod.verifyPlayerReopenTicket({ticket:t,raw:r,
  factory:mem.factory,subtle:webcrypto.subtle,now});
 assert.equal((await verify(ticket,raw,610001)).status,'expired');
 assert.equal((await verify('{',raw)).status,'invalid');
 assert.equal((await verify(ticket,raw.replace('PRIVADO','CAMBIO'))).status,'different');
 mem.databases.clear();
 assert.equal((await verify(ticket,raw)).status,'missing');
 assert.equal(mem.databases.size,0,'readonly missing check must not create a DB');
});

test('Gestion performs an actual reload handoff and verifies via a fresh DB connection',async()=>{
 const mod=await compiled(),mem=fakeIDB(),original=JSON.stringify(fixture());
 await mod.writePlayerShadow({factory:mem.factory,plan:mod.planPlayerShadow(original,'seed')});
 const source={state:original,getItem(key){return key==='volleyCoachStateV43'?this.state:null}};
 const session=fakeSession(),locks=sharedLocks();
 const first=view(mem,source,session,locks),api=mod.mountPlayerShadowPanel(first.win);
 assert.equal(first.elements['vc20570-reopen-players'].disabled,false);
 assert.equal(api.enabled(),false);
 await api.reopen();assert.equal(first.reloads(),1);
 assert.equal(session.data.size,1);
 assert.equal(session.data.values().next().value.includes('PRIVADO'),false);
 api.dispose();
 const second=view(mem,source,session,locks),restored=mod.mountPlayerShadowPanel(second.win);
 await settle();
 assert.equal(session.data.size,0,'ticket consumed before verification');
 assert.match(second.elements['vc20570-reopen-status'].textContent,/Reapertura comprobada: 1 jugadores/);
 assert.equal(restored.enabled(),false);
 assert.equal(mem.ops.filter(o=>o.kind==='put').length,2);
 assert.equal(source.state,original);
 restored.dispose();
});

test('Gestion refuses certification if the main state changes between reloads',async()=>{
 const mod=await compiled(),mem=fakeIDB(),raw=JSON.stringify(fixture());
 await mod.writePlayerShadow({factory:mem.factory,plan:mod.planPlayerShadow(raw,'seed')});
 const source={state:raw,getItem(){return this.state}},session=fakeSession(),locks=sharedLocks();
 const one=view(mem,source,session,locks),api=mod.mountPlayerShadowPanel(one.win);
 await api.reopen();api.dispose();
 source.state=raw.replace('PRIVADO','ACTUALIZADO');
 const two=view(mem,source,session,locks),next=mod.mountPlayerShadowPanel(two.win);
 await settle();
 assert.match(two.elements['vc20570-reopen-status'].textContent,/Prueba no superada/);
 assert.equal(next.enabled(),false);
 assert.equal(session.data.size,0);
 next.dispose();
});

test('V70 published UI is opt-in and leaves the canonical club writer unchanged',()=>{
 const html=read('index.html'),pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.0');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20570-player-shadow-reopen.test.cjs'));
 assert.ok(html.includes('id="vc20570-reopen-players" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('verifyPlayerReopenTicket'));
 assert.ok(read('service-worker.js').includes('player-shadow-reopen-20.5.70'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
