'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const v2012=require('../211-vc2012-multi-device-validation.js');
const journalModule=require('../210-vc2011-durable-sync-journal.js');
const policy=require('../209-vc2001-sync-reliability.js');
const script=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script id="v962-cloud-efficient-runtime">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'must exercise the production CAS writer');
const clone=x=>JSON.parse(JSON.stringify(x));
const state=value=>({equiposData:{cadete:{jugadores:[{id:'p1',number:7,value}],scoutingMatches:[]}},updatedAt:'2026-11-16T08:00:00.000Z'});
const storage=seed=>{const map=new Map(Object.entries(seed||{}));return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,v)=>map.set(key,String(v)),removeItem:key=>map.delete(key)};};
function journalStore(){
 const map=new Map();return {list:async()=>[...map.values()].map(clone),put:async r=>{map.set(r.id,clone(r));},removeMany:async ids=>{ids.forEach(id=>map.delete(id));}};
}
class CasServer{
 constructor(initial=null){this.row=clone(initial);this.reads=0;this.writes=0;this.beforeUpdate=null;this.failRead=null;}
 client(){
  const server=this;
  const read=async()=>{
   server.reads++;
   return server.failRead?{data:null,error:server.failRead}:{data:clone(server.row),error:null};
  };
  return {from(table){
   assert.equal(table,'volley_state');
   return {
    select(){return {eq(){return {maybeSingle:read};}};},
    insert(payload){return {select(){return {maybeSingle:async()=>{
     server.writes++;
     if(server.row)return {data:null,error:{code:'23505',message:'duplicate'}};
     server.row={state:clone(payload.state),updated_at:payload.updated_at};
     return {data:{updated_at:payload.updated_at},error:null};
    }};}};},
    update(payload){
     const conditions=[];
     const maybeSingle=async()=>{
      server.writes++;
      if(server.beforeUpdate){const cb=server.beforeUpdate;server.beforeUpdate=null;await cb();}
      const stamp=conditions.find(x=>x[0]==='updated_at')?.[1]||null;
      if(!server.row||server.row.updated_at!==stamp)return {data:null,error:null};
      server.row={state:clone(payload.state),updated_at:payload.updated_at};
      return {data:{updated_at:payload.updated_at},error:null};
     };
     const query={
      eq(column,value){conditions.push([column,value]);return query;},
      is(column,value){conditions.push([column,value]);return query;},
      select(){return {maybeSingle};}
     };
     return query;
    }
   };
  }};
 }
}

function device(server,{local=state(0),stamp='',noApplier=false,throwsOnApply=false}={}){
 let current=clone(local),baseline=clone(local);
 const values=storage(stamp?{v1523_remote_stamp:stamp}:{});
 const j=journalModule.createJournal({store:journalStore(),now:(()=>{let n=1;return ()=>++n;})(),makeId:(()=>{let n=0;return ()=>String(++n);})()});
 const doc={visibilityState:'visible',addEventListener(){},querySelector(){return null;},getElementById(){return null}};
 const win={VC_SYNC_200_POLICY:policy,VC_SYNC_2011_JOURNAL:j,VC_DEVICE_SYNC:{notifyWorkspaceChanged(){}},
  VC_V179_SYNC_SAFETY:{beforeRemoteApply:async()=>true},VC_V191_RELIABILITY:{assessRemote:()=>({catastrophic:false,requiresSnapshot:false,losses:[]}),mergePending:(l,r)=>clone(l)},
  VC_V1915_RELIABILITY:{prepare(l,r){
    // A conservative mock for one shared roster record: diverging edits after
    // baseline require human review; no automatic last-writer-wins.
    const from=l.equiposData.cadete.jugadores[0].value;
    const to=r.equiposData.cadete.jugadores[0].value;
    const started=baseline.equiposData.cadete.jugadores[0].value;
    return {conflicts:from!==to&&from!==started&&to!==started?[{id:'p1'}]:[],deletionConflicts:[]};
   },mergeGuarded(l,r){return clone(l)},captureBaseline(s){baseline=clone(s)}},dispatchEvent(){}
 };
 if(!noApplier)win.aplicarEstadoCloud=incoming=>{if(throwsOnApply)throw Error('apply crash');current=clone(incoming);};
 const env={window:win,document:doc,console:{warn(){}},navigator:{onLine:true},Date,CustomEvent:class{constructor(type){this.type=type}},
  localStorage:values,sessionStorage:storage(),cloudClient:server.client(),cloudUser:{id:'same-user'},cloudApplying:false,
  estadoLocal:()=>clone(current),setCloudUI(){},setTimeout(){return 1},clearTimeout(){},setInterval(){},alert(){}};
 vm.runInNewContext(script,env,{timeout:3000});
 return {api:win.VC_V962_CLOUD_EFFICIENT,journal:j,win,read:()=>clone(current),edit:v=>{current=state(v);win.VC_V962_CLOUD_EFFICIENT.markDirty('edit')},getBaseline:()=>clone(baseline)};
}

test('successful and failed reads produce distinct telemetry; errors do not claim a delivered version',async()=>{
 const server=new CasServer({state:state(7),updated_at:'2026-11-16T10:00:00.000Z'});
 const d=device(server);server.failRead={code:'NETWORK',message:'offline'};
 assert.equal(await d.api.sync({reason:'manual',bypassBackoff:true,pullOnly:true,allowWrite:false}),false);
 assert.equal(d.api.diagnostics().lastReadAt,null);
 assert.equal(d.api.diagnostics().lastObservedRemoteStamp,'');
 assert.ok(d.api.diagnostics().lastReadErrorAt);
 server.failRead=null;
 assert.equal(await d.api.sync({reason:'manual',bypassBackoff:true,pullOnly:true,allowWrite:false}),true);
 assert.equal(d.api.diagnostics().lastObservedRemoteStamp,'2026-11-16T10:00:00.000Z');
 assert.equal(d.api.diagnostics().lastAppliedRemoteStamp,'2026-11-16T10:00:00.000Z');
 assert.equal(d.read().equiposData.cadete.jugadores[0].value,7);
});

test('malformed Supabase responses do not masquerade as a successful empty read',async()=>{
 const server=new CasServer({state:state(9),updated_at:'2026-11-16T10:00:00.000Z'});
 const genuine=server.client.bind(server);
 // A malformed payload can happen during a partial mock/provider integration.
 server.client=()=>({from(){return {select(){return {eq(){return {maybeSingle:async()=>({message:'invalid'})};}};}};}});
 // Bind a new client directly to the existing VM context through its cloudClient.
 // The production code must reject missing {data,error}, not infer a missing row.
 const d2=device(server);
 assert.equal(await d2.api.sync({reason:'manual',bypassBackoff:true,allowWrite:false,pullOnly:true}),false);
 assert.equal(d2.api.diagnostics().lastReadAt,null);
 assert.equal(d2.api.diagnostics().blockedCategory,'protection');
 assert.equal(server.row.state.equiposData.cadete.jugadores[0].value,9);
 server.client=genuine;
});

test('missing or failing remote-state applier blocks clean pull without falsely claiming applied delivery',async()=>{
 for(const opts of [{noApplier:true},{throwsOnApply:true}]){
  const server=new CasServer({state:state(9),updated_at:'2026-11-16T10:00:00.000Z'});
  const d=device(server,opts);
  assert.equal(await d.api.sync({reason:'manual',bypassBackoff:true,pullOnly:true,allowWrite:false}),false);
  assert.equal(d.read().equiposData.cadete.jugadores[0].value,0);
  assert.equal(d.api.diagnostics().lastAppliedRemoteStamp,'');
  assert.equal(d.api.diagnostics().lastObservedRemoteStamp,'2026-11-16T10:00:00.000Z');
  assert.equal(d.api.diagnostics().blockedCategory,'protection');
 }
});

test('device A uploads and B applies the exact confirmed CAS version without uploading again',async()=>{
 const stamp='2026-11-16T10:00:00.000Z',server=new CasServer({state:state(0),updated_at:stamp});
 const a=device(server,{stamp}),b=device(server,{stamp});
 a.edit(4);
 assert.equal(await a.api.sync({reason:'manual',bypassBackoff:true}),true);
 const uploaded=a.api.diagnostics().lastConfirmedWriteStamp;
 assert.ok(uploaded&&uploaded!==stamp);
 assert.equal(server.row.state.equiposData.cadete.jugadores[0].value,4);
 assert.equal(await b.api.sync({reason:'manual',pullOnly:true,allowWrite:false,bypassBackoff:true}),true);
 assert.equal(b.read().equiposData.cadete.jugadores[0].value,4);
 assert.equal(b.api.diagnostics().lastAppliedRemoteStamp,uploaded);
 assert.equal(b.api.diagnostics().dirty,false);
 assert.equal(server.writes,1);
 assert.equal(v2012.compareReports(v2012.report({cloud:a.api.diagnostics(),journal:{pendingCount:0}}),v2012.report({cloud:b.api.diagnostics(),journal:{pendingCount:0}})).status,'matched');
});

test('two simultaneous edits of the same record cannot silently overwrite the first CAS winner',async()=>{
 const stamp='2026-11-16T10:00:00.000Z',server=new CasServer({state:state(0),updated_at:stamp});
 const a=device(server,{stamp}),b=device(server,{stamp});
 a.edit(1);b.edit(2);
 // B read the old state, A commits during B CAS update.
 server.beforeUpdate=async()=>{await a.api.sync({reason:'manual',bypassBackoff:true});};
 assert.equal(await b.api.sync({reason:'manual',bypassBackoff:true}),false);
 assert.equal(server.row.state.equiposData.cadete.jugadores[0].value,1);
 assert.equal(b.read().equiposData.cadete.jugadores[0].value,2);
 assert.equal(b.api.diagnostics().dirty,true);
 assert.ok(b.api.diagnostics().conflictCount>=1);
 assert.equal(b.api.diagnostics().blockedCategory,'conflict');
 assert.ok((await b.journal.inspect('same-user')).pendingCount>=1);
});

test('offline edit on B remains pending and is not marked received after A syncs',async()=>{
 const stamp='2026-11-16T10:00:00.000Z',server=new CasServer({state:state(0),updated_at:stamp});
 const a=device(server,{stamp}),b=device(server,{stamp});
 b.edit(22);a.edit(11);await a.api.sync({reason:'manual',bypassBackoff:true});
 // B is now stale; must not upload its stale snapshot silently.
 assert.equal(await b.api.sync({reason:'manual',bypassBackoff:true}),false);
 assert.equal(server.row.state.equiposData.cadete.jugadores[0].value,11);
 assert.equal(b.read().equiposData.cadete.jugadores[0].value,22);
 assert.equal(b.api.diagnostics().dirty,true);
});

test('validation reports exclude user/device identifiers, player names and cloud secrets',()=>{
 const r=v2012.report({cloud:{connected:true,dirty:false,lastConfirmedWriteStamp:'2026-11-16T10:00:00.000Z',accountId:'PRIVATE-ACCOUNT',token:'secret',state:state(42)},device:{deviceId:'SECRET-DEVICE',presencePeers:[{name:'Anna'}]},journal:{pendingCount:0}});
 const json=JSON.stringify(r);
 for(const value of ['PRIVATE-ACCOUNT','secret','SECRET-DEVICE','Anna','cadete','jugadores'])assert.equal(json.includes(value),false);
 assert.equal(v2012.parseReport(json).schema,v2012.SCHEMA);
 assert.equal(v2012.report({cloud:{lastObservedRemoteStamp:'2026-11-16T10:00:00.000+00:00'}}).lastObservedRemoteStamp,'2026-11-16T10:00:00.000+00:00');
 assert.throws(()=>v2012.parseReport('{}'),/incompatible/);
 assert.throws(()=>v2012.parseReport(JSON.stringify({...r,pendingJournal:-1})),/Diario inválido/);
});

test('comparison refuses to declare sync success with a dirty, blocked or unverified device',()=>{
 const stamp='2026-11-16T10:00:00.000Z';
 const a=v2012.report({cloud:{connected:true,lastConfirmedWriteStamp:stamp},journal:{pendingCount:0}});
 const b=v2012.report({cloud:{connected:true,lastAppliedRemoteStamp:stamp,dirty:true},journal:{pendingCount:0}});
 assert.equal(v2012.compareReports(a,b).status,'review');
 b.dirty=false;b.pendingJournal=null;
 assert.equal(v2012.compareReports(a,b).status,'review');
 b.pendingJournal=0;b.lastAppliedRemoteStamp='';
 assert.equal(v2012.compareReports(a,b).status,'unproven');
 b.lastAppliedRemoteStamp=stamp;
 assert.equal(v2012.compareReports(a,b).status,'matched');
});

test('V20.1.2 is cache-busted, adds a read-only validation module and keeps one CAS writer',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.match(html,/211-vc2012-multi-device-validation\.js\?v=20\.1\.2/);
 assert.match(html,/vc2012-multi-device-validation\.css\?v=20\.1\.2/);
 assert.match(html,/service-worker\.js\?v=20\.1\.2/);
 assert.match(sw,/two-device-20\.1\.2/);
 assert.match(sw,/\.\/211-vc2012-multi-device-validation\.js/);
 assert.equal((html.match(/id="v962-cloud-efficient-runtime"/g)||[]).length,1);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'211-vc2012-multi-device-validation.js'),'utf8'),/\.from\s*\(\s*['"]volley_state/);
});
