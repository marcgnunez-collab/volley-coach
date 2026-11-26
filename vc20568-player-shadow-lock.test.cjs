'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function sharedLocks(){
 let current=false;
 const port={request(_name,options,callback){
  assert.equal(options.mode,'exclusive');assert.equal(options.ifAvailable,true);
  if(current)return Promise.resolve(callback(null));
  current=true;
  return Promise.resolve(callback({name:'exclusive'})).finally(()=>{current=false});
 }};
 return {port,isHeld:()=>current};
}
const json=JSON.stringify({version:5.8,equiposData:{infantil:{jugadores:[{id:'12'}]}}});
function fakeWindow(locks,hasLocks=true){
 const button=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const arm=button(),pause=button(),check=button(),erase=button(),backup=button(),reopen=button(),status={textContent:''};
 const elements={'vc20567-arm-players':arm,'vc20567-pause-players':pause,
  'vc20567-check-players':check,'vc20567-erase-players':erase,
  'vc20569-download-players':backup,
  'vc20570-reopen-players':reopen,'vc20570-reopen-status':{textContent:''},
  'vc20571-prepare-cold':button(),'vc20571-verify-cold':button(),
  'vc20571-cancel-cold':button(),'vc20571-cold-status':{textContent:''},
  'vc20567-player-shadow-status':status};
 const listeners=new Map(),ops=[];
 const win={document:{getElementById:id=>elements[id]||null},
  navigator:hasLocks?{locks}:{},
  indexedDB:{open(){ops.push('open');throw Error('SHOULD-NOT-OPEN')},
   deleteDatabase(){ops.push('delete');throw Error('SHOULD-NOT-DELETE')}},
  localStorage:{getItem(key){return key==='volleyCoachStateV43'?json:null}},
  confirm:()=>true,
  addEventListener(type,fn){listeners.set(type,fn)},
  removeEventListener(type){listeners.delete(type)}
 };
 return {win,arm,pause,check,erase,status,listeners,ops};
}

test('V20.5.68 Web Locks are exclusive, fail closed and release only on request',async()=>{
 const mod=await compiled(),locks=sharedLocks();
 const first=await mod.tryAcquirePlayerShadowLock(locks.port);
 assert.ok(first);assert.equal(locks.isHeld(),true);
 assert.equal(await mod.tryAcquirePlayerShadowLock(locks.port),null);
 first.release();first.release();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(locks.isHeld(),false);
 const second=await mod.tryAcquirePlayerShadowLock(locks.port);
 assert.ok(second);second.release();
 await assert.rejects(mod.tryAcquirePlayerShadowLock(undefined),/bloqueo seguro/);
});

test('a second window cannot arm or erase while the first holds the player shadow lock',async()=>{
 const mod=await compiled(),locks=sharedLocks();
 const one=fakeWindow(locks.port),two=fakeWindow(locks.port);
 const a=mod.mountPlayerShadowPanel(one.win),b=mod.mountPlayerShadowPanel(two.win);
 assert.ok(a);assert.ok(b);
 assert.equal(a.enabled(),false);assert.equal(b.enabled(),false);
 assert.equal(one.ops.length,0);assert.equal(two.ops.length,0);
 await a.arm();assert.equal(a.enabled(),true);
 await assert.rejects(b.arm(),/Otra pestaña/);
 assert.equal(b.enabled(),false);
 await assert.rejects(b.erase(),/Otra pestaña/);
 assert.equal(one.ops.length,0);assert.equal(two.ops.length,0);
 a.pause();await a.whenIdle();
 assert.equal(locks.isHeld(),false);
 await b.arm();assert.equal(b.enabled(),true);
 b.pause();await b.whenIdle();
 a.dispose();b.dispose();
});

test('other-tab canonical changes and pagehide pause the mirror and release the lease',async()=>{
 const mod=await compiled(),locks=sharedLocks(),view=fakeWindow(locks.port);
 const api=mod.mountPlayerShadowPanel(view.win);
 await api.arm();assert.equal(locks.isHeld(),true);
 view.listeners.get('storage')({key:'not-the-club'});
 assert.equal(api.enabled(),true);
 view.listeners.get('storage')({key:'volleyCoachStateV43'});
 assert.equal(api.enabled(),false);
 await api.whenIdle();assert.equal(locks.isHeld(),false);
 assert.ok(view.status.textContent.includes('otra pestaña'));
 await api.arm();assert.equal(api.enabled(),true);
 view.listeners.get('pagehide')({});
 await api.whenIdle();assert.equal(api.enabled(),false);
 assert.equal(locks.isHeld(),false);
 assert.equal(view.ops.length,0,'no secondary write began after the safety pause');
 api.dispose();
 assert.equal(view.listeners.has('storage'),false);
});

test('without native Web Locks the mirror remains disabled but read-only check is available',async()=>{
 const mod=await compiled(),view=fakeWindow({},false);
 const api=mod.mountPlayerShadowPanel(view.win);
 assert.equal(view.arm.disabled,true);assert.equal(view.erase.disabled,true);
 assert.equal(view.check.disabled,false);
 await assert.rejects(api.arm(),/bloqueo no disponible/);
 assert.equal(view.ops.length,0);
 api.dispose();
});

test('release V68 retains all original writers and publishes cross-tab guard',()=>{
 const html=read('index.html'),pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.73');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20568-player-shadow-lock.test.cjs'));
 assert.ok(html.includes('V20.5.68 · PROTECCIÓN ENTRE PESTAÑAS'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.73'));
 assert.ok(read('src/vc2055-entry.ts').includes('tryAcquirePlayerShadowLock'));
 assert.ok(read('service-worker.js').includes('player-shadow-tab-lock-20.5.68'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
