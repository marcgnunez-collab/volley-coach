'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const native=read('021-core-scouting-v150-monolithic.js');
const begin=native.indexOf('let v931JournalDBPromise=null;');
const end=native.indexOf('function v902FastRender(',begin);
const initial=native.slice(native.indexOf('const V902_JOURNAL_DB='),native.indexOf('function v902MutationState('));
const code=initial+native.slice(begin,end);
const clone=value=>JSON.parse(JSON.stringify(value));

/* Asynchronous IDB event simulator: staged writes commit together, abort discards all.
 * This tests transaction ordering but is NOT a real-browser / process-crash guarantee.
 */
function journalDisk({failCommit=false}={}){
 const disk=new Map(),stats={transactions:0,commits:0,aborts:0,puts:0,deletes:0};
 let fail=failCommit;
 const getStore=name=>disk.get(name)||new Map();
 const db={
  objectStoreNames:{contains:name=>disk.has(name)},
  createObjectStore(name){disk.set(name,new Map())},
  transaction(names,mode){
   stats.transactions++;
   const list=Array.isArray(names)?names:[names];
   const staged=new Map(list.map(name=>[name,new Map([...getStore(name)].map(([key,value])=>[key,clone(value)]))]));
   let pending=0,aborted=false,committed=false;
   const tx={error:null,oncomplete:null,onerror:null,onabort:null,
    abort(){if(aborted||committed)return;aborted=true;stats.aborts++;queueMicrotask(()=>tx.onabort?.())},
    objectStore(name){
     if(!staged.has(name))throw Error('PRIVATE-WRONG-STORE');
     const rows=staged.get(name);
     const request=operation=>{
      const req={result:undefined,error:null,onsuccess:null,onerror:null};pending++;
      queueMicrotask(()=>{
       if(aborted)return;
       try{req.result=operation();req.onsuccess?.()}catch(error){req.error=error;req.onerror?.();tx.abort()}
       finally{pending--;queueMicrotask(complete)}
      });
      return req;
     };
     return {
      get:key=>request(()=>clone(rows.get(key)||null)),
      getAll:()=>request(()=>[...rows.values()].map(clone)),
      put:value=>request(()=>{if(mode!=='readwrite')throw Error('Readonly');stats.puts++;rows.set(value.key,clone(value));return value.key}),
      delete:key=>request(()=>{if(mode!=='readwrite')throw Error('Readonly');stats.deletes++;rows.delete(key);return undefined})
     };
    }
   };
   function complete(){
    if(aborted||committed||pending)return;
    if(fail){fail=false;tx.error=Error('PRIVATE-QUOTA');tx.onerror?.();tx.abort();return}
    committed=true;for(const [name,rows] of staged)disk.set(name,rows);
    stats.commits++;tx.oncomplete?.();
   }
   return tx;
  }
 };
 const indexedDB={open(){
  const request={result:db,onsuccess:null,onerror:null,onupgradeneeded:null};
  queueMicrotask(()=>{request.onupgradeneeded?.();request.onsuccess?.()});return request;
 }};
 return {db,indexedDB,stats,rows:name=>[...getStore(name).values()].map(clone),
  set:(name,key,value)=>{if(!disk.has(name))disk.set(name,new Map());disk.get(name).set(key,clone(value))},
  failNext:()=>{fail=true}};
}

function fixture({bridge,disk=journalDisk()}={}){
 const logs=[];let m={id:101,currentSet:1,status:'live',servingTeam:'ours',
  sets:[{number:1,scoreUs:8,scoreOpponent:7,finished:false,rallies:[]}],
  liveRally:{id:50,actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-NAME'}]}};
 const win={indexedDB:disk.indexedDB,...(bridge?{VC_SCOUT_INDEXED_JOURNAL_20560:bridge}:{})};
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-20T12:00:00.000Z']))}}
 const context=vm.createContext({window:win,indexedDB:disk.indexedDB,Date:FixedDate,
  equipoActivo:'cadete',Number,String,Promise,Map,
  scoutClone:clone,scoutNow:()=>new Date('2026-11-20T12:00:00.000Z').toISOString(),
  console:{warn:()=>logs.push('failed')}});
 vm.runInContext(code,context,{timeout:2500});
 return {win,disk,logs,getMatch:()=>m,setMatch:x=>{m=x},
  write:reason=>vm.runInContext(`v902JournalWrite(${JSON.stringify(m)},${JSON.stringify(reason)})`,context),
  read:()=>win.scoutV902JournalReadAll(),
  stats:()=>clone(vm.runInContext('({typedCheckpoints:v20560TypedCheckpoints,typedDeltas:v20560TypedDeltas,nativeCheckpoints:v20560NativeCheckpoints,nativeDeltas:v20560NativeDeltas,typedFailures:v20560TypedFailures,journalFailures:v902JournalFailures})',context))};
}
const full='liveMatches',live='liveRallies',key='cadete:101';
const payload=(savedAt='2026-11-20T12:00:00.000Z')=>({key,version:'9.2.0',teamId:'cadete',matchId:101,
 savedAt,reason:'action-delta',currentSet:1,status:'live',
 liveRally:{id:50,actions:[{code:'PRIVATE-CODE'}]}});
const options=(disk,mode,extra={})=>({db:disk.db,fullStore:full,liveStore:live,key,mode,
 payload:payload(),captureAnchor:()=>({savedAt:payload().savedAt,
  liveRally:{id:50,actions:[{code:'PRIVATE-CODE'}]},currentSet:1,status:'live',
  match:{id:101,sets:[],liveRally:{id:50,actions:[{code:'PRIVATE-CODE'}]}}}),...extra});

test('V20.5.60 bridge exposes exactly one typed existing-store transaction writer',async()=>{
 const mod=await compiled(),host={},api=mod.installScoutIndexedJournalBridge(host);
 assert.equal(api.VERSION,'20.5.60');assert.equal(api.ownsDatabase,false);
 assert.equal(api.usesExistingStores,true);assert.strictEqual(host.VC_SCOUT_INDEXED_JOURNAL_20560,api);
 assert.strictEqual(mod.installScoutIndexedJournalBridge(host),api);
 assert.strictEqual(api.write,mod.writeScoutJournalTransaction);
 assert.ok(Object.isFrozen(api));
});

test('checkpoint upserts full match and removes prior live delta in ONE committed transaction',async()=>{
 const {writeScoutJournalTransaction}=await compiled(),disk=journalDisk();
 disk.set(full,key,{key,match:{id:101,sets:[]}});
 disk.set(live,key,{...payload(),savedAt:'2026-11-20T11:00:00.000Z'});
 const checkpoint={...payload(),reason:'point',match:{id:101,sets:[{scoreUs:9}]}};
 const pending=writeScoutJournalTransaction(options(disk,'checkpoint',{payload:checkpoint}));
 assert.equal(disk.stats.commits,0,'put returning is not transaction completion');
 assert.equal(await pending,true);
 assert.equal(disk.stats.transactions,1);assert.equal(disk.stats.commits,1);
 assert.equal(disk.rows(full)[0].match.sets[0].scoreUs,9);
 assert.equal(disk.rows(live).length,0);
});

test('first action creates matching base and delta atomically without extra writer',async()=>{
 const mod=await compiled(),disk=journalDisk();let anchors=0;
 const current=options(disk,'action-delta',{captureAnchor:()=>{
  anchors++;return {savedAt:'2026-11-20T12:01:00.000Z',currentSet:2,status:'live',
   liveRally:{id:99,actions:[{code:'PRIVATE-LATEST'}]},
   match:{id:101,currentSet:2,liveRally:{id:99,actions:[{code:'PRIVATE-LATEST'}]}}};
 }});
 await mod.writeScoutJournalTransaction(current);
 assert.equal(anchors,1);assert.equal(disk.stats.transactions,1);
 assert.equal(disk.rows(full)[0].reason,'initial-action-anchor');
 assert.equal(disk.rows(full)[0].match.currentSet,2);
 assert.equal(disk.rows(live)[0].liveRally.actions[0].code,'PRIVATE-LATEST');
 assert.equal(disk.rows(full)[0].savedAt,disk.rows(live)[0].savedAt);
});

test('old action never overwrites a newer checkpoint or newer live delta',async()=>{
 const {writeScoutJournalTransaction}=await compiled(),disk=journalDisk();
 disk.set(full,key,{key,savedAt:'2026-11-20T12:10:00.000Z',match:{id:101}});
 await writeScoutJournalTransaction(options(disk,'action-delta'));
 assert.equal(disk.rows(live).length,0);
 disk.set(full,key,{key,savedAt:'2026-11-20T11:00:00.000Z',match:{id:101}});
 disk.set(live,key,{...payload(),savedAt:'2026-11-20T12:08:00.000Z'});
 await writeScoutJournalTransaction(options(disk,'action-delta'));
 assert.equal(disk.rows(live)[0].savedAt,'2026-11-20T12:08:00.000Z');
 await writeScoutJournalTransaction(options(disk,'action-delta',{
  payload:payload('2026-11-20T12:12:00.000Z')}));
 assert.equal(disk.rows(live)[0].savedAt,'2026-11-20T12:12:00.000Z');
});

test('abort rejects without a second write or partial persisted delta',async()=>{
 const {writeScoutJournalTransaction}=await compiled(),disk=journalDisk();
 disk.set(full,key,{key,savedAt:'2026-11-20T11:00:00.000Z',match:{id:101}});
 disk.failNext();
 await assert.rejects(writeScoutJournalTransaction(options(disk,'checkpoint')),/PRIVATE-QUOTA/);
 assert.equal(disk.stats.transactions,1);assert.equal(disk.stats.commits,0);
 assert.equal(disk.stats.aborts,1);assert.equal(disk.rows(full)[0].savedAt,'2026-11-20T11:00:00.000Z');
 assert.equal(disk.rows(live).length,0);
});

test('invalid contracts decline before opening any transaction',async()=>{
 const {writeScoutJournalTransaction}=await compiled(),disk=journalDisk();
 for(const extra of [{fullStore:live},{key:''},{payload:{key:'WRONG'}},
  {mode:'wrong'},{captureAnchor:undefined,mode:'action-delta'}]){
  await assert.rejects(writeScoutJournalTransaction(options(disk,'checkpoint',extra)));
 }
 assert.equal(disk.stats.transactions,0);
});

test('V9.3.1 native and V20.5.60 typed path produce identical saved data and recovery records',async()=>{
 const bridge=(await compiled()).installScoutIndexedJournalBridge({});
 const old=fixture(),typed=fixture({bridge});
 for(const app of [old,typed]){
  assert.equal(await app.write('action'),true);
  const second=clone(app.getMatch());second.liveRally.actions.push({code:'PRIVATE-SECOND'});
  app.setMatch(second);
  assert.equal(await app.write('action'),true);
  const point=clone(app.getMatch());point.sets[0].scoreUs++;
  point.sets[0].rallies.push({id:50,winner:'ours',actions:point.liveRally.actions});
  point.liveRally={id:51,actions:[]};app.setMatch(point);
  assert.equal(await app.write('point'),true);
  assert.equal(await app.write('action'),true);
 }
 assert.deepEqual(typed.disk.rows(full),old.disk.rows(full));
 assert.deepEqual(typed.disk.rows(live),old.disk.rows(live));
 assert.deepEqual(clone(await typed.read()),clone(await old.read()));
 assert.deepEqual(typed.stats(),{typedCheckpoints:1,typedDeltas:3,nativeCheckpoints:0,
  nativeDeltas:0,typedFailures:0,journalFailures:0});
 assert.deepEqual(old.stats(),{typedCheckpoints:0,typedDeltas:0,nativeCheckpoints:1,
  nativeDeltas:3,typedFailures:0,journalFailures:0});
 assert.equal(typed.disk.stats.transactions,old.disk.stats.transactions);
});

test('a typed transaction rejection is reported once and NEVER retried natively',async()=>{
 const bridge=(await compiled()).installScoutIndexedJournalBridge({}),disk=journalDisk();
 const app=fixture({bridge,disk});disk.failNext();
 assert.equal(await app.write('point'),false);
 assert.deepEqual(app.stats(),{typedCheckpoints:0,typedDeltas:0,nativeCheckpoints:0,
  nativeDeltas:0,typedFailures:1,journalFailures:1});
 assert.equal(disk.stats.transactions,1);
 assert.equal(app.logs.length,1);
 assert.equal(disk.rows(full).length,0);
});

test('a fresh window can read the same journal after a typed checkpoint and undo-like delta',async()=>{
 const bridge=(await compiled()).installScoutIndexedJournalBridge({}),disk=journalDisk();
 const first=fixture({bridge,disk});
 await first.write('point');
 const undo=clone(first.getMatch());undo.liveRally.actions=[{code:'PRIVATE-UNDO'}];
 first.setMatch(undo);await first.write('action');
 const restored=fixture({disk});
 const rows=await restored.read();
 assert.equal(rows.length,1);assert.equal(rows[0].match.liveRally.actions[0].code,'PRIVATE-UNDO');
 assert.equal(rows[0].reason,'action-delta');
});

test('release includes typed journal entry with the same native DB, store names and no duplicate write',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.66');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20560-indexed-journal-migration.test.cjs'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutIndexedJournalBridge(window)'));
 assert.ok(native.includes("const V902_JOURNAL_DB='VolleyCoachScoutJournalV902'"));
 assert.ok(native.includes("V920_JOURNAL_LIVE_STORE='liveRallies'"));
 assert.ok(native.includes("mode:liveOnly?'action-delta':'checkpoint'"));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.66'));
 assert.ok(sw.includes('indexed-journal-20.5.60'));
});
