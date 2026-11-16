const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const Journal=require('../210-vc2011-durable-sync-journal.js');
const policy=require('../209-vc2001-sync-reliability.js');
const state=(value=1)=>({equiposData:{cadete:{jugadores:[{id:1,value}],scoutingMatches:[]}}});
const memoryStore=()=>{
 const map=new Map();let failPut=false,failDelete=false;
 return {map,list:async()=>[...map.values()],put:async x=>{if(failPut)throw Error('QUOTA');map.set(x.id,structuredClone(x));},removeMany:async ids=>{if(failDelete)throw Error('TRANSACTION_ABORT');ids.forEach(id=>map.delete(id));},failWrite:v=>failPut=v,failDelete:v=>failDelete=v};
};
function journal(store,clk=()=>10000){let id=0;return Journal.createJournal({store,now:clk,makeId:()=>String(++id)});}
function localStorage(seed={}){const map=new Map(Object.entries(seed));return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
function cas({db=null,local=null,store=null,account='club-1',writable=true,localData=state(1)}={}){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),match=html.match(/<script id="v962-cloud-efficient-runtime">([\s\S]*?)<\/script>/);
 assert.ok(match,'one CAS writer');
 db=db||{remote:null,reads:0,writes:0};local=local||localStorage();store=store||memoryStore();
 const j=journal(store,(()=>{let t=100;return ()=>++t;})());
 const doc={visibilityState:'visible',addEventListener(){},querySelector(){return null;},getElementById(){return null;}};
 const win={VC_SYNC_200_POLICY:policy,VC_SYNC_2011_JOURNAL:j,VC_DEVICE_SYNC:{notifyWorkspaceChanged(){}},document:doc,dispatchEvent(){}};
 const response={from(){return {
  select(){return {eq(){return {maybeSingle:async()=>{db.reads++;return {data:db.remote,error:null};}}}}},
  insert(body){return {select(){return {maybeSingle:async()=>{db.writes++;if(db.beforeWrite)db.beforeWrite();db.remote={state:structuredClone(body.state),updated_at:body.updated_at};return {data:{updated_at:body.updated_at},error:null};}}}}},
  update(body){return {eq(){return {eq(){return {select(){return {maybeSingle:async()=>{db.writes++;if(db.beforeWrite)db.beforeWrite();db.remote={state:structuredClone(body.state),updated_at:body.updated_at};return {data:{updated_at:body.updated_at},error:null};}}}}}}}}}
 };}};
 const context={window:win,document:doc,console:{warn(){}},navigator:{onLine:true},Date,CustomEvent:class{constructor(type){this.type=type;}},
  localStorage:local,sessionStorage:localStorage(),cloudClient:response,cloudUser:{id:account},cloudApplying:false,
  estadoLocal(){return localData;},aplicarEstadoCloud(){},setCloudUI(){},
  setTimeout(){return 1},clearTimeout(){},setInterval(){},alert(){}};
 vm.runInNewContext(match[1],context,{timeout:1000});
 return {api:win.VC_V962_CLOUD_EFFICIENT,win,db,local,store,account,setState:s=>localData=s};
}
test('serializes only structured local state and refuses unsafe or huge snapshots',()=>{
 assert.deepEqual(JSON.parse(Journal.serialize(state(2))),state(2));
 assert.throws(()=>Journal.serialize({hola:'world'}),/estructura/);
 assert.throws(()=>Journal.serialize({equiposData:null}),/estructura/);
});
test('coalesces identical pending batches while retaining an acknowledged history boundary',async()=>{
 const store=memoryStore(),j=journal(store,(()=>{let t=100;return ()=>++t;})());
 const a=await j.prepare({accountId:'A',revision:1,state:state(1)});
 const same=await j.prepare({accountId:'A',revision:2,state:state(1)});
 assert.equal(a.id,same.id);assert.equal((await j.inspect('A')).pendingCount,1);
 const next=await j.prepare({accountId:'A',revision:3,state:state(2)});
 assert.notEqual(next.id,a.id);assert.equal((await j.inspect('A')).pendingCount,2);
 await j.acknowledge({accountId:'A',id:a.id});assert.equal((await j.inspect('A')).pendingCount,1);
 assert.equal(JSON.parse((await j.newest('A')).stateJson).equiposData.cadete.jugadores[0].value,2);
 await j.acknowledge({accountId:'A',id:next.id});assert.equal((await j.inspect('A')).pendingCount,0);
});
test('generated root updatedAt does not create a new unconfirmed copy on every retry',async()=>{
 const store=memoryStore(),j=journal(store);
 const first=await j.prepare({accountId:'A',state:{...state(1),updatedAt:'2026-11-16T12:00:01.000Z'}});
 const second=await j.prepare({accountId:'A',state:{...state(1),updatedAt:'2026-11-16T12:00:02.000Z'}});
 assert.equal(first.id,second.id);
 assert.equal((await j.inspect('A')).pendingCount,1);
 const third=await j.prepare({accountId:'A',state:{...state(2),updatedAt:'2026-11-16T12:00:03.000Z'}});
 assert.notEqual(first.id,third.id);
});
test('offline rolling draft overwrites only its own slot, never an in-flight upload',async()=>{
 const store=memoryStore(),j=journal(store,(()=>{let t=100;return ()=>++t;})());
 const first=await j.prepare({accountId:'A',revision:1,state:state(1),mode:'draft'});
 const staged=await j.prepare({accountId:'A',revision:1,state:state(1),mode:'upload'});
 assert.notEqual(first.id,staged.id);
 const next=await j.prepare({accountId:'A',revision:2,state:state(2),mode:'draft'});
 assert.equal(first.id,next.id,'offline drafts share one bounded IndexedDB slot');
 await j.acknowledge({accountId:'A',id:staged.id});
 assert.equal((await j.inspect('A')).pendingCount,1,'a newer offline edit remains pending');
 assert.equal(JSON.parse((await j.newest('A')).stateJson).equiposData.cadete.jugadores[0].value,2);
});
test('account boundaries and orphaned batches block implicit cloud pulls',async()=>{
 const store=memoryStore(),j=journal(store);
 await j.prepare({accountId:'A',state:state(1)});
 assert.equal((await j.inspect('B')).pendingCount,0);assert.equal((await j.inspect('B')).hasOtherAccounts,true);
 assert.equal(await j.guardCleanPull('A',true),true);
 await assert.rejects(j.guardCleanPull('A',false),e=>e.code==='VC2011_ORPHAN');
 assert.equal(await j.guardCleanPull('B',false),true);
 assert.equal(await j.newest('B'),null);
});
test('IndexedDB quota and cancelled transactions fail closed without deleting batches',async()=>{
 const store=memoryStore(),j=journal(store);
 store.failWrite(true);
 await assert.rejects(j.prepare({accountId:'A',state:state(1)}),e=>e.code==='VC2011_JOURNAL');
 store.failWrite(false);const batch=await j.prepare({accountId:'A',state:state(1)});
 store.failDelete(true);await assert.rejects(j.acknowledge({accountId:'A',id:batch.id}),e=>e.code==='VC2011_JOURNAL');
 assert.equal((await j.inspect('A')).pendingCount,1);
});
test('CAS writer stages pending snapshot before server write and removes only after ACK',async()=>{
 const store=memoryStore(),env=cas({store});env.api.markDirty('edit');
 const origPut=store.put;store.put=async entry=>{await origPut(entry);assert.equal(env.db.writes,0,'durable copy precedes network write');};
 const ok=await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(ok,true);assert.equal(env.db.writes,1);assert.equal(env.api.diagnostics().dirty,false);
 assert.equal((await env.win.VC_SYNC_2011_JOURNAL.inspect('club-1')).pendingCount,0);
});
test('failed journal write blocks CAS; dirty edits remain visible and can retry',async()=>{
 const store=memoryStore(),env=cas({store});store.failWrite(true);env.api.markDirty('edit');
 const result=await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(result,false);assert.equal(env.db.writes,0);assert.equal(env.api.diagnostics().dirty,true);assert.equal(env.api.diagnostics().blockedCategory,'protection');
 store.failWrite(false);await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(env.db.writes,1);assert.equal(env.api.diagnostics().dirty,false);
});
test('failure in local acknowledgement never clears pending even after cloud ACK',async()=>{
 const store=memoryStore(),env=cas({store});store.failDelete(true);env.api.markDirty('edit');
 const result=await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(result,false);assert.equal(env.db.writes,1);assert.equal(env.api.diagnostics().dirty,true);
 assert.equal((await env.win.VC_SYNC_2011_JOURNAL.inspect('club-1')).pendingCount,1);
});
test('pending checkpoint survives reload and CAS confirms it without rewriting a newer version',async()=>{
 const store=memoryStore(),sharedDb={remote:null,reads:0,writes:0},local=localStorage();
 let x=cas({db:sharedDb,local,store});x.api.markDirty('offline-contact');
 await x.win.VC_SYNC_2011_JOURNAL.prepare({accountId:'club-1',state:state(1),revision:1});
 assert.equal((await x.win.VC_SYNC_2011_JOURNAL.inspect('club-1')).pendingCount,1);
 x=cas({db:sharedDb,local,store});assert.equal(x.api.diagnostics().dirty,true);
 await x.api.sync({reason:'startup',bypassBackoff:true});
 assert.equal(x.api.diagnostics().dirty,false);assert.equal((await x.win.VC_SYNC_2011_JOURNAL.inspect('club-1')).pendingCount,0);
});
test('orphaned checkpoint blocks a clean pull; missing module blocks all cloud writes',async()=>{
 const store=memoryStore(),env=cas({store});
 await env.win.VC_SYNC_2011_JOURNAL.prepare({accountId:'club-1',state:state(1),revision:2});
 assert.equal(await env.api.sync({reason:'startup',bypassBackoff:true}),false);
 assert.equal(env.db.reads,0);assert.equal(env.api.diagnostics().blockedCategory,'protection');
 const env2=cas();env2.win.VC_SYNC_2011_JOURNAL=null;env2.api.markDirty('edit');
 assert.equal(await env2.api.sync({reason:'manual',bypassBackoff:true}),false);assert.equal(env2.db.writes,0);
});
test('a new edit while upload is in flight stays locally dirty and can be checkpointed next',async()=>{
 const env=cas();env.api.markDirty('first');let second=false;
 env.db.beforeWrite=()=>{if(!second){second=true;env.setState(state(2));env.api.markDirty('second');}};
 await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(env.api.diagnostics().dirty,true);
 assert.equal(env.api.diagnostics().localRevision,2);
 await env.api.sync({reason:'manual',bypassBackoff:true});
 assert.equal(env.api.diagnostics().dirty,false);
 assert.equal(env.db.remote.state.equiposData.cadete.jugadores[0].value,2);
});
test('HTML and service worker load journal before embedded CAS and cache updated assets',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.ok(html.indexOf('210-vc2011-durable-sync-journal.js')<html.indexOf('id="v962-cloud-efficient-runtime"'));
 assert.match(html,/service-worker\.js\?v=20\.1\.2/);assert.match(sw,/durable-journal-20\.1\.1/);
 assert.match(sw,/\.\/210-vc2011-durable-sync-journal\.js/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'210-vc2011-durable-sync-journal.js'),'utf8'),/\.from\(['"]volley_state/);
});
