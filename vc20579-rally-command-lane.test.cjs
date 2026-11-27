'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const compiled=()=>import('./vc2055-domain-core.mjs');

function fixture(){
 const match={id:7,status:'live',currentSet:1},set={number:1,scoreUs:0,scoreOpponent:0,rallies:[]};
 match.sets=[set];
 let current=match,dispatches=0;
 const port={
  current:()=>({match:current,set:current?.sets?.[0]||null}),
  read:()=>({score:{us:set.scoreUs,op:set.scoreOpponent},rallies:set.rallies.length}),
  dispatch:()=>{dispatches++;set.scoreUs++;set.rallies.push({id:dispatches})}
 };
 return {match,set,port,select:m=>{current=m},count:()=>dispatches};
}
function command(f,kind='point',winner='ours'){
 return {kind,winner,expectedMatch:f.match,expectedSet:f.set,before:f.port.read(),port:f.port};
}
function nativeHarness(){
 const start=source.indexOf('/* V20.5.79: typed command lane owns');
 const end=source.indexOf('/* Professional rally editor',start);
 assert.ok(start>=0&&end>start);
 const m={id:1,status:'live',currentSet:1,sets:[]};
 const s={number:1,scoreUs:0,scoreOpponent:0,rallies:[]};m.sets=[s];
 let active=m,points=0,undos=0;
 const statuses=[],errors=[];
 const win={
  scoutAwardPoint(winner){points++;if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;s.rallies.push({winner})},
  scoutUndoRally(){undos++;const r=s.rallies.pop();if(!r)return;if(r.winner==='ours')s.scoreUs--;else s.scoreOpponent--}
 };
 const context={window:win,v857PointBusy:false,v857UndoBusy:false,
  scoutActive:()=>active,scoutSet:x=>x?.sets?.[0]||null,
  v857SelectedMatch:()=>active,v857Set:x=>x?.sets?.[0]||null,
  v857RallyCount:x=>x?.rallies?.length||0,
  v857Score:x=>({us:Number(x?.scoreUs)||0,op:Number(x?.scoreOpponent)||0}),
  v857Status:(msg,type)=>statuses.push({msg,type}),v857Refresh:()=>{},
  setTimeout:fn=>fn(),console:{error:(...args)=>errors.push(args)}};
 vm.runInNewContext(source.slice(start,end),context,{filename:'vc20579-historical-wrapper.js'});
 return {win,m,s,statuses,errors,select:x=>{active=x},get points(){return points},get undos(){return undos}};
}

test('V20.5.79 exports an immutable native-only bridge, without a second writer',async()=>{
 const mod=await compiled(),host={},api=mod.installRallyCommandLane(host);
 assert.equal(api.VERSION,'20.5.79');assert.equal(api.nativeOnly,true);
 assert.equal(api.singleNativeWriter,true);assert.ok(Object.isFrozen(api));
 assert.equal(host.VC_RALLY_COMMAND_LANE_20579,api);
 assert.equal(mod.installRallyCommandLane(host),api);
 const typed=read('src/domain/scout-rally-command-lane.ts')+read('src/domain/scout-rally-command-runtime.ts');
 for(const forbidden of ['scoutSave(', 'localStorage','indexedDB','supabase','fetch(',
  '.scoreUs++','.scoreOpponent++','.rallies.push(','.rallies.pop('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('50 native point commands run exactly once each and retain the same match/set',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture();
 for(let i=0;i<50;i++){
  const result=run(command(f));
  assert.equal(result.ok,true);assert.equal(result.reason,'committed');
  assert.equal(result.dispatched,true);assert.equal(result.after.score.us,i+1);
 }
 assert.equal(f.count(),50);assert.equal(f.set.scoreUs,50);assert.equal(f.set.rallies.length,50);
});

test('opponent point has its own +1 verification, not a shortcut on rally count',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture();
 f.port.dispatch=()=>{f.set.scoreOpponent++;f.set.rallies.push({winner:'opponent'})};
 assert.equal(run(command(f,'point','opponent')).ok,true);
 assert.equal(f.set.scoreUs,0);assert.equal(f.set.scoreOpponent,1);
});

test('undo delegates once and verifies rally removal without reimplementing the native score restore',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture();
 f.set.scoreUs=3;f.set.rallies.push({id:1},{id:2},{id:3});
 f.port.dispatch=()=>{f.set.rallies.pop();f.set.scoreUs=2};
 const result=run(command(f,'undo'));
 assert.equal(result.ok,true);assert.equal(result.after.rallies,2);
 assert.equal(result.after.score.us,2);
});

test('stale match or set blocks dispatch, even when IDs look identical',async()=>{
 const run=(await compiled()).executeNativeRallyCommand;
 for(const change of ['match','set']){
  const f=fixture();
  if(change==='match')f.select({...f.match});
  else f.match.sets=[{...f.set}];
  const result=run(command(f));
  assert.equal(result.ok,false);assert.equal(result.reason,'stale-before');
  assert.equal(result.dispatched,false);assert.equal(f.count(),0);
 }
});

test('invalid winner, negative counters and empty undo refuse dispatch',async()=>{
 const run=(await compiled()).executeNativeRallyCommand;
 for(const modify of [c=>{c.winner='other'},c=>{c.before={score:{us:-1,op:0},rallies:0}},
  c=>{c.kind='undo'},c=>{c.before={score:{us:0,op:0},rallies:NaN}}]){
  const f=fixture(),c=command(f);modify(c);
  const out=run(c);assert.equal(out.reason,'invalid');assert.equal(f.count(),0);
 }
});

test('a native throw after a valid commit is successful, without a second attempt',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture(),base=f.port.dispatch;
 f.port.dispatch=()=>{base();throw Error('after commit')};
 const out=run(command(f));
 assert.equal(out.ok,true);assert.equal(out.reason,'committed');
 assert.equal(f.count(),1);assert.equal(f.set.rallies.length,1);
});

test('native partial mutation plus throw never retries and is reported as failed',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture();
 let calls=0;f.port.dispatch=()=>{calls++;f.set.scoreUs++;throw Error('partial')};
 const out=run(command(f));
 assert.equal(out.ok,false);assert.equal(out.reason,'native-error');
 assert.equal(out.dispatched,true);assert.equal(calls,1);assert.equal(f.set.scoreUs,1);
});

test('changed active match after one dispatch is rejected without retry',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture(),base=f.port.dispatch;
 f.port.dispatch=()=>{base();f.select({id:99,sets:[f.set]})};
 const out=run(command(f));
 assert.equal(out.reason,'stale-after');assert.equal(out.dispatched,true);
 assert.equal(f.count(),1);
});

test('a native set closure remains valid, even when it selects another set after commit',async()=>{
 const run=(await compiled()).executeNativeRallyCommand,f=fixture(),base=f.port.dispatch;
 f.port.dispatch=()=>{base();f.match.sets[0]={number:2,rallies:[]}};
 const out=run(command(f));
 assert.equal(out.ok,true);assert.equal(f.count(),1);
});

test('historical point and undo wrappers invoke the typed bridge once per command',async()=>{
 const api=(await compiled()).installRallyCommandLane({}),h=nativeHarness();
 h.win.VC_RALLY_COMMAND_LANE_20579=api;
 for(let i=0;i<25;i++)assert.equal(h.win.scoutAwardPoint('ours'),true);
 for(let i=0;i<10;i++)assert.equal(h.win.scoutUndoRally(),true);
 assert.equal(h.points,25);assert.equal(h.undos,10);
 assert.equal(h.s.scoreUs,15);assert.equal(h.s.rallies.length,15);
});

test('historical wrappers fall back once if bridge is absent or throws before dispatch',()=>{
 const h=nativeHarness();
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 h.win.VC_RALLY_COMMAND_LANE_20579={VERSION:'20.5.79',nativeOnly:true,
  singleNativeWriter:true,run:()=>{throw Error('bridge unavailable')}};
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 assert.equal(h.points,2);
});

test('historical wrapper refuses stale selection before its native write',async()=>{
 const api=(await compiled()).installRallyCommandLane({}),h=nativeHarness();
 h.win.VC_RALLY_COMMAND_LANE_20579=api;
 const other={id:h.m.id,sets:[h.s],status:'live'};h.select(other);
 // Selected match and current scope both switch to another instance;
 // a write can still run against that selected match, but never the old one.
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 assert.equal(h.points,1);
 const stale=nativeHarness();
 stale.win.VC_RALLY_COMMAND_LANE_20579={...api,run:input=>{
  stale.select({id:2,sets:[stale.s]});return api.run(input);
 }};
 assert.equal(stale.win.scoutAwardPoint('ours'),false);
 assert.equal(stale.points,0);
});

test('historical wrapper never falls back after the bridge already invoked native',()=>{
 const h=nativeHarness();
 h.win.VC_RALLY_COMMAND_LANE_20579={VERSION:'20.5.79',nativeOnly:true,
  singleNativeWriter:true,run:input=>{input.port.dispatch();throw Error('late')}};
 assert.equal(h.win.scoutAwardPoint('ours'),false);
 assert.equal(h.points,1);assert.equal(h.s.scoreUs,1);
 assert.equal(h.win.scoutUndoRally(),false);
 assert.equal(h.undos,1);assert.equal(h.s.scoreUs,0);
});

test('versioned shell, typed export, service worker and foundation suite are wired',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.5.80');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20579-rally-command-lane.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.80'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.5.80'));
 assert.ok(read('service-worker.js').includes('rally-command-lane-20.5.79'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRallyCommandLane(window)'));
 assert.ok(source.includes("v20579RunRallyCommand('point'"));
 assert.ok(source.includes("v20579RunRallyCommand('undo'"));
});
