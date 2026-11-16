const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const policy=require('../209-vc2001-sync-reliability.js');

function storage(seed={}){const store=new Map(Object.entries(seed));return {getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};}
function casSandbox({readError=null,remote=null,readCount=null,writeCount=null}={}){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const match=html.match(/<script id="v962-cloud-efficient-runtime">([\s\S]*?)<\/script>/);
 assert.ok(match,'Embedded CAS engine must exist');
 const local=storage(remote?.updated_at?{v1523_remote_stamp:String(remote.updated_at)}:{}),session=storage();
 let readCalls=0,writeCalls=0,writeHook=null;
 const engineApi={from(){return {
   select(){return {eq(){return {maybeSingle:async()=>{readCalls++;return readError?{error:readError,data:null}:{error:null,data:remote};}}}}},
   insert(data){return {select(){return {maybeSingle:async()=>{writeCalls++;if(writeHook)writeHook();remote={state:data.state,updated_at:data.updated_at};return {error:null,data:{updated_at:data.updated_at}};}}}}},
   update(data){return {eq(){return {eq(){return {select(){return {maybeSingle:async()=>{writeCalls++;if(writeHook)writeHook();remote={state:data.state,updated_at:data.updated_at};return {error:null,data:{updated_at:data.updated_at}};}}}}}}}}}
 }}};

 const events=[];
 const doc={visibilityState:'visible',addEventListener(){},querySelector(){return null;},getElementById(){return null;}};
 const win={document:doc,VC_SYNC_200_POLICY:policy,VC_SYNC_2011_JOURNAL:{prepare:async()=>({id:'test-batch'}),acknowledge:async()=>({acknowledged:1}),guardCleanPull:async()=>true,noteDirty(){}},VC_DEVICE_SYNC:{notifyWorkspaceChanged(){}},dispatchEvent(e){events.push(e.type)}};
 const timers=[];
 const context={window:win,document:doc,navigator:{onLine:true},localStorage:local,sessionStorage:session,
  CustomEvent:class{constructor(type){this.type=type;}},Date,console:{warn(){}},
  cloudClient:engineApi,cloudUser:{id:'user-1'},cloudApplying:false,
  estadoLocal(){return {equiposData:{cadete:{jugadores:[],scoutingMatches:[]}}};},
  aplicarEstadoCloud(){},setCloudUI(){},setTimeout(callback,ms){timers.push({callback,ms});return timers.length;},
  clearTimeout(){},setInterval(){},alert(){} };
 vm.runInNewContext(match[1],context,{timeout:1000});
 return {api:win.VC_V962_CLOUD_EFFICIENT,env:context,events,timers,reads:()=>readCalls,writes:()=>writeCalls,setReadError(v){readError=v},onWrite(callback){writeHook=callback}};
}

test('retry policy doubles to a capped delay and needs manual review on conflict / permissions / account mismatch',()=>{
 assert.equal(policy.retryPolicy({failures:1,message:'network disconnected'}).delayMs,2000);
 assert.equal(policy.retryPolicy({failures:2,message:'network disconnected'}).delayMs,4000);
 assert.equal(policy.retryPolicy({failures:15,message:'network disconnected'}).delayMs,120000);
 for(const failure of [{code:'VC1915_CONFLICT',message:'records conflict'},{code:'42501',message:'permission denied'},{message:'Hay cambios pendientes de otra cuenta'}]){
  const result=policy.retryPolicy(failure);assert.equal(result.retry,false);assert.equal(result.manualRequired,true);
 }
});
test('status separates remote confirmation, offline changes, Realtime and cross-account block',()=>{
 const state=policy.classify({cloud:{connected:true,dirty:false,lastWriteAt:1234},device:{realtimeState:'TIMED_OUT'},online:true});
 assert.equal(state.key,'confirmed');assert.equal(state.realtime,false);assert.equal(state.devices,null);
 assert.equal(policy.classify({cloud:{connected:true,dirty:true},online:false}).key,'offline');
 assert.equal(policy.classify({cloud:{connected:true,pendingAccountMismatch:true,dirty:true}}).key,'blocked');
 assert.equal(policy.classify({cloud:{connected:true,dirty:true,retryAt:Date.now()+10000}}).key,'retry');
});
test('diagnostics exclude account/device IDs, tokens and scouting content',()=>{
 const out=policy.safeDiagnostics({cloud:{connected:true,dirty:true,accountId:'sensitive',supabaseToken:'secret',lastSyncError:'connection lost'},device:{deviceId:'unique-123',presencePeers:[{deviceId:'hello',player:'Sensitive'}]},now:1700000000000});
 const encoded=JSON.stringify(out);
 for(const secret of ['sensitive','secret','unique-123','hello','Sensitive'])assert.equal(encoded.includes(secret),false);
});
test('automatic CAS retries back off instead of hammering the cloud after a transient error',async()=>{
 const x=casSandbox({readError:{code:'NETWORK',message:'network interrupted'}});
 x.api.markDirty('change');await x.api.sync({reason:'vc200-manual',bypassBackoff:true});
 const first=x.api.diagnostics();assert.equal(first.dirty,true);assert.equal(first.consecutiveFailures,1);assert.ok(first.retryAt>Date.now());
 const prior=x.reads();await x.api.sync({reason:'passive-dirty'});assert.equal(x.reads(),prior);
 x.setReadError(null);await x.api.sync({reason:'vc200-manual',bypassBackoff:true});
 const confirmed=x.api.diagnostics();assert.equal(confirmed.dirty,false);assert.equal(confirmed.consecutiveFailures,0);
 assert.ok(confirmed.lastWriteAt);assert.equal(x.writes(),1);
});
test('blocked permission error stops auto retries but allows deliberate manual validation',async()=>{
 const x=casSandbox({readError:{code:'42501',message:'permission denied by RLS'}});
 x.api.markDirty('change');await x.api.sync({reason:'test',bypassBackoff:true});
 assert.equal(x.api.diagnostics().blockedCategory,'permission');
 const prior=x.reads();await x.api.sync({reason:'passive-dirty'});assert.equal(x.reads(),prior);
 x.setReadError(null);await x.api.sync({reason:'vc200-manual',bypassBackoff:true});
 assert.equal(x.api.diagnostics().blockedCategory,'');assert.equal(x.api.diagnostics().dirty,false);
});
test('a new local edit during HTTP upload remains pending after server acknowledgement',async()=>{
 const x=casSandbox();
 x.api.markDirty('first-edit');
 let inserted=false;
 x.onWrite(()=>{if(!inserted){inserted=true;x.api.markDirty('during-upload');}});
 await x.api.sync({reason:'vc200-manual',bypassBackoff:true});
 assert.equal(x.api.diagnostics().dirty,true,'cannot mark a newer revision as confirmed');
 assert.equal(x.api.diagnostics().localRevision,2);
 assert.equal(x.api.diagnostics().lastConfirmedRevision,1);
});
test('manual force-sync does not mark a clean current revision dirty',async()=>{
 const stamp='2026-11-15T10:00:00.000Z',state={equiposData:{cadete:{jugadores:[]}}};
 const x=casSandbox({remote:{state,updated_at:stamp}});
 await x.api.forceSync('manual');
 const status=x.api.diagnostics();assert.equal(status.dirty,false);assert.equal(x.writes(),0);
});
test('asset links and service worker include reliability dashboard without creating a second writer',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.match(html,/209-vc2001-sync-reliability\.js\?v=20\.1\.0/);
 assert.match(html,/vc2001-sync-reliability\.css\?v=20\.1\.0/);
 assert.match(html,/service-worker\.js\?v=20\.1\.2/);
 assert.match(sw,/sync-reliability-20\.1\.0-durable-journal-20\.1\.1/);
 assert.match(sw,/\.\/209-vc2001-sync-reliability\.js/);
 const module=fs.readFileSync(path.join(root,'209-vc2001-sync-reliability.js'),'utf8');
 assert.doesNotMatch(module,/\.from\s*\(/);
});
