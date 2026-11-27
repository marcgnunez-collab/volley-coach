'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const club=()=>({version:5.8,equiposData:{cadete:{jugadores:[
 {id:'44',nombre:'PRIVADA'}, {id:'7',nombre:'OTRA'}]}}});
function replica(plan){
 const dbRows=new Map(plan.rows.map(row=>[row.key,clone(row)]));
 const manifest={key:'current',schema:1,revision:'test',teamIds:[...plan.teamIds],
  keys:plan.rows.map(row=>row.key),order:plan.order,present:plan.present,
  totalChars:plan.totalChars,pendingIds:plan.pendingIds};
 const stores=new Map([['playerRows',dbRows],['playerManifest',new Map([['current',manifest]])]]);
 const ops=[];
 const db={objectStoreNames:{contains:key=>stores.has(key)},close(){ops.push('close')},
  transaction(keys,mode){
   assert.equal(mode,'readonly','a cold check must never write player rows');
   ops.push('readonly');let pending=0,scheduled=false;
   const tx={error:null,oncomplete:null,onerror:null,onabort:null,abort(){throw Error('aborted')},
    objectStore(key){
     assert.ok(keys.includes(key));const data=stores.get(key);
     return {get(id){
      pending++;const req={result:undefined,error:null,onsuccess:null,onerror:null};
      queueMicrotask(()=>{
       req.result=data.has(id)?clone(data.get(id)):undefined;
       try{req.onsuccess?.()}finally{pending--;schedule()}
      });return req;
     }};
    }};
   const schedule=()=>{
    if(scheduled)return;scheduled=true;
    setTimeout(()=>{if(pending){scheduled=false;schedule();return}tx.oncomplete?.()},0);
   };
   return tx;
  }};
 const factory={open(_name,version){
  assert.equal(version,undefined,'read-only checks must not upgrade databases');
  const req={result:null,onupgradeneeded:null,onerror:null,onsuccess:null};
  queueMicrotask(()=>{req.result=db;req.onsuccess?.()});return req;
 },deleteDatabase(){throw Error('readonly cold audit must not delete the replica')}};
 return {factory,dbRows,ops};
}
function locks(){
 let busy=false;
 return {request(_name,_options,fn){
  if(busy)return Promise.resolve(fn(null));
  busy=true;return Promise.resolve(fn({exclusive:true})).finally(()=>{busy=false});
 }};
}
function localStore(raw){
 const data=new Map([['volleyCoachStateV43',raw]]);
 return {data,getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
}
function view(factory,localStorage,lock){
 const button=()=>({disabled:true,events:new Map(),
  addEventListener(t,fn){this.events.set(t,fn)},
  removeEventListener(t){this.events.delete(t)}});
 const elements={};
 for(const id of ['vc20567-arm-players','vc20567-pause-players',
  'vc20567-check-players','vc20567-erase-players','vc20569-download-players',
  'vc20570-reopen-players','vc20571-prepare-cold','vc20571-verify-cold',
  'vc20571-cancel-cold'])elements[id]=button();
 for(const id of ['vc20567-player-shadow-status','vc20570-reopen-status',
  'vc20571-cold-status'])elements[id]={textContent:''};
 const win={document:{getElementById:id=>elements[id]||null},
  indexedDB:factory,navigator:{locks:lock},crypto:webcrypto,localStorage,
  location:{reload(){}},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},
  confirm:()=>true};
 return {win,elements};
}

test('V20.5.71 cold ticket survives new window, contains no players and verifies a fresh IndexedDB read',async()=>{
 const mod=await compiled(),raw=JSON.stringify(club()),mem=replica(mod.planPlayerShadow(raw,'initial'));
 const local=localStore(raw),lock=locks(),first=view(mem.factory,local,lock);
 const api=mod.mountPlayerShadowPanel(first.win);
 assert.equal(first.elements['vc20571-prepare-cold'].disabled,false);
 await api.prepareCold();
 assert.equal(first.elements['vc20571-verify-cold'].disabled,false);
 const stored=local.getItem(mod.PLAYER_COLD_REOPEN_KEY);
 assert.equal(stored.includes('PRIVADA'),false);
 assert.equal(stored.includes('equiposData'),false);
 assert.equal(JSON.parse(stored).records,2);
 api.dispose();await api.whenIdle();
 const reopened=view(mem.factory,local,lock),after=mod.mountPlayerShadowPanel(reopened.win);
 assert.match(reopened.elements['vc20571-cold-status'].textContent,/pendiente/);
 const checked=await after.verifyCold();
 assert.equal(checked.status,'verified');assert.equal(checked.records,2);
 assert.equal(local.getItem(mod.PLAYER_COLD_REOPEN_KEY),null);
 assert.match(reopened.elements['vc20571-cold-status'].textContent,/Verificación posterior al cierre/);
 assert.ok(mem.ops.filter(op=>op==='readonly').length>=2);
 assert.equal(local.getItem('volleyCoachStateV43'),raw);
 after.dispose();
});

test('cold verification rejects a changed main club and consumes the one-time marker only',async()=>{
 const mod=await compiled(),raw=JSON.stringify(club()),mem=replica(mod.planPlayerShadow(raw,'initial'));
 const local=localStore(raw),lock=locks(),first=view(mem.factory,local,lock),api=mod.mountPlayerShadowPanel(first.win);
 await api.prepareCold();api.dispose();await api.whenIdle();
 local.setItem('volleyCoachStateV43',raw.replace('PRIVADA','ACTUALIZADA'));
 const second=view(mem.factory,local,lock),next=mod.mountPlayerShadowPanel(second.win);
 assert.equal((await next.verifyCold()).status,'different');
 assert.equal(local.getItem(mod.PLAYER_COLD_REOPEN_KEY),null);
 assert.equal(local.getItem('volleyCoachStateV43').includes('ACTUALIZADA'),true);
 next.dispose();
});

test('outdated proof is rejected and cancel only deletes the metadata key',async()=>{
 const mod=await compiled(),raw=JSON.stringify(club()),mem=replica(mod.planPlayerShadow(raw,'initial'));
 const local=localStore(raw),lock=locks(),one=view(mem.factory,local,lock),api=mod.mountPlayerShadowPanel(one.win);
 await api.prepareCold();
 const ticket=JSON.parse(local.getItem(mod.PLAYER_COLD_REOPEN_KEY));
 ticket.createdAt=Date.now()-(25*60*60*1000);
 local.setItem(mod.PLAYER_COLD_REOPEN_KEY,JSON.stringify(ticket));
 assert.equal((await api.verifyCold()).status,'expired');
 await api.prepareCold();
 await api.cancelCold();
 assert.equal(local.getItem(mod.PLAYER_COLD_REOPEN_KEY),null);
 assert.equal(local.getItem('volleyCoachStateV43'),raw);
 api.dispose();
});

test('concurrent tab lock blocks creating or checking a proof without losing it',async()=>{
 const mod=await compiled(),raw=JSON.stringify(club()),mem=replica(mod.planPlayerShadow(raw,'initial'));
 const local=localStore(raw),lock=locks(),one=view(mem.factory,local,lock),api=mod.mountPlayerShadowPanel(one.win);
 const occupied=await mod.tryAcquirePlayerShadowLock(lock);
 await assert.rejects(api.prepareCold(),/Otra pestaña/);
 assert.equal(local.getItem(mod.PLAYER_COLD_REOPEN_KEY),null);
 occupied.release();await occupied.released;
 await api.prepareCold();
 const held=await mod.tryAcquirePlayerShadowLock(lock);
 await assert.rejects(api.verifyCold(),/Otra pestaña/);
 assert.ok(local.getItem(mod.PLAYER_COLD_REOPEN_KEY));
 held.release();await held.released;
 await api.cancelCold();api.dispose();
});

test('V20.5.71 manual cold recovery remains installed after V20.5.72',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.1');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20571-player-shadow-cold-recovery.test.cjs'));
 assert.ok(html.includes('id="vc20571-prepare-cold" disabled'));
 assert.ok(html.includes('id="vc20571-verify-cold" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('service-worker.js').includes('player-shadow-cold-recovery-20.5.71'));
 assert.ok(read('src/vc2055-entry.ts').includes('verifyPlayerColdReopen'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
