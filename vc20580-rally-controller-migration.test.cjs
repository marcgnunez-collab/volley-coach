'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const compiled=()=>import('./vc2055-domain-core.mjs');

function testPort(options={}){
 const set={number:1,scoreUs:0,scoreOpponent:0,rallies:[],finished:false};
 const match={id:17,status:'live',currentSet:1,sets:[set]};
 const statuses=[],errors=[],pending=[];
 let current=match,points=0,undos=0;
 const port={
  selectedMatch:()=>match,
  activeMatch:()=>current,
  selectedSet:m=>m.sets?.find(s=>s.number===m.currentSet)||null,
  activeSet:m=>m.sets?.find(s=>s.number===m.currentSet)||null,
  score:s=>({us:s.scoreUs,op:s.scoreOpponent}),
  rallies:s=>s.rallies.length,
  nativePoint:w=>{points++;if(w==='ours')set.scoreUs++;else set.scoreOpponent++;set.rallies.push({winner:w})},
  nativeUndo:()=>{undos++;const r=set.rallies.pop();if(r?.winner==='ours')set.scoreUs--;else if(r?.winner==='opponent')set.scoreOpponent--},
  status:(msg,level)=>statuses.push({msg,level}),
  refresh:()=>{},
  scheduleUnlock:fn=>{if(options.deferred)pending.push(fn);else fn()},
  logError:(...args)=>errors.push(args)
 };
 return {port,match,set,statuses,errors,pending,
  setActive:m=>{current=m},get points(){return points},get undos(){return undos}};
}
function legacyHarness(){
 const start=source.indexOf('/* V20.5.79: typed command lane owns');
 const end=source.indexOf('/* Professional rally editor',start);
 assert.ok(start>=0&&end>start);
 const set={number:1,scoreUs:0,scoreOpponent:0,rallies:[]},
  match={id:5,status:'live',currentSet:1,sets:[set]};
 let active=match,points=0,undos=0;
 const statuses=[],errors=[],timers=[];
 const win={
  scoutAwardPoint:w=>{points++;if(w==='ours')set.scoreUs++;else set.scoreOpponent++;set.rallies.push({winner:w})},
  scoutUndoRally:()=>{undos++;const r=set.rallies.pop();if(r?.winner==='ours')set.scoreUs--;else if(r)set.scoreOpponent--}
 };
 const ctx={window:win,v857PointBusy:false,v857UndoBusy:false,
  scoutActive:()=>active,scoutSet:m=>m?.sets?.find(s=>s.number===m.currentSet)||null,
  v857SelectedMatch:()=>active,v857Set:m=>m?.sets?.find(s=>s.number===m.currentSet)||null,
  v857RallyCount:s=>s?.rallies.length||0,
  v857Score:s=>({us:Number(s?.scoreUs)||0,op:Number(s?.scoreOpponent)||0}),
  v857Status:(message,level)=>statuses.push({message,level}),v857Refresh:()=>{},
  setTimeout:fn=>{timers.push(fn);return timers.length},console:{error:(...args)=>errors.push(args)}};
 vm.runInNewContext(source.slice(start,end),ctx,{filename:'vc20580-real-wrapper.js'});
 return {win,match,set,statuses,errors,timers,
  flush:()=>{while(timers.length)timers.shift()()},
  select:m=>{active=m},get points(){return points},get undos(){return undos}};
}

test('V20.5.80 native-only controller bridge is immutable and installed once',async()=>{
 const mod=await compiled(),host={},lane=mod.installLiveRallyController(host);
 assert.equal(lane.VERSION,'20.5.80');assert.equal(lane.nativeOnly,true);
 assert.equal(lane.singleNativeWriter,true);assert.ok(Object.isFrozen(lane));
 assert.equal(host.VC_RALLY_CONTROLLER_20580,lane);
 assert.equal(mod.installLiveRallyController(host),lane);
 assert.equal(typeof lane.create,'function');
 const typed=read('src/domain/scout-rally-controller.ts')+
  read('src/domain/scout-rally-controller-runtime.ts');
 for(const forbidden of ['scoutSave(', 'localStorage','indexedDB','supabase','fetch(',
  '.scoreUs++','.scoreOpponent++','.rallies.push(','.rallies.pop('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('full TypeScript controller handles 50 real point/undo callbacks with one native write each',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 const ctrl=create(f.port);
 for(let i=0;i<50;i++)assert.equal(ctrl.awardPoint(i%2?'opponent':'ours'),true);
 for(let i=0;i<15;i++)assert.equal(ctrl.undoRally(),true);
 assert.equal(f.points,50);assert.equal(f.undos,15);
 assert.equal(f.set.rallies.length,35);
 assert.equal(f.set.scoreUs+f.set.scoreOpponent,35);
 assert.equal(ctrl.diagnostics().nativeDispatches,65);
 assert.equal(ctrl.diagnostics().committed,65);
 assert.ok(Object.isFrozen(ctrl));assert.ok(Object.isFrozen(ctrl.diagnostics()));
});

test('rapid repeated point press is blocked while the scheduled unlock is pending',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort({deferred:true});
 const ctrl=create(f.port);
 assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(ctrl.awardPoint('ours'),false);
 assert.equal(f.points,1);assert.equal(ctrl.diagnostics().busyRejected,1);
 assert.equal(ctrl.diagnostics().pointBusy,true);
 f.pending.shift()();
 assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(f.points,2);
});

test('point and undo preserve their separate native cooldowns',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort({deferred:true});
 const ctrl=create(f.port);
 assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(ctrl.undoRally(),true,'the user may undo an immediately added point');
 assert.equal(f.points,1);assert.equal(f.undos,1);
 assert.equal(ctrl.undoRally(),false,'undo itself is still debounced');
 assert.equal(f.set.scoreUs,0);assert.equal(f.set.rallies.length,0);
});

test('finished match, finished set and missing set do not call the writer',async()=>{
 const create=(await compiled()).createLiveRallyController;
 for(const change of [f=>{f.match.status='finished'},f=>{f.set.finished=true},
  f=>{f.match.currentSet=2}]){
  const f=testPort();change(f);const ctrl=create(f.port);
  assert.equal(ctrl.awardPoint('ours'),false);assert.equal(f.points,0);
  assert.equal(ctrl.diagnostics().lastReason,'no-open-set');
 }
});

test('undo on an empty rally list is refused without changing score',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 const ctrl=create(f.port);
 assert.equal(ctrl.undoRally(),false);assert.equal(f.undos,0);
 assert.equal(ctrl.diagnostics().lastReason,'nothing-to-undo');
});

test('selected match is not the active object: fail closed even when id matches',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 f.setActive({...f.match});
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),false);
 assert.equal(ctrl.diagnostics().lastReason,'stale-before');
 assert.equal(f.points,0);assert.equal(f.set.scoreUs,0);
});

test('selected set replaced with an equal-looking set: command never dispatches',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 f.port.activeSet=()=>({...f.set});
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),false);
 assert.equal(f.points,0);assert.equal(ctrl.diagnostics().lastReason,'stale-before');
});

test('native point commits then changes selected set: controller accepts valid closure',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 const base=f.port.nativePoint;
 f.port.nativePoint=w=>{base(w);f.match.currentSet=2;f.match.sets.push({number:2,scoreUs:0,scoreOpponent:0,rallies:[]})};
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(f.points,1);assert.equal(f.set.scoreUs,1);
});

test('native error after full point commit is not retried and reports committed',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort(),base=f.port.nativePoint;
 f.port.nativePoint=w=>{base(w);throw Error('downstream after commit')};
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(f.points,1);assert.equal(f.set.scoreUs,1);
 assert.equal(ctrl.diagnostics().committed,1);
});

test('native partial failure reports an error and does not dispatch again',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 let calls=0;f.port.nativePoint=()=>{calls++;f.set.scoreUs++;throw Error('save interrupted')};
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),false);
 assert.equal(ctrl.diagnostics().lastReason,'native-error');
 assert.equal(ctrl.diagnostics().nativeDispatches,1);
 assert.equal(calls,1);assert.equal(f.set.scoreUs,1);
 assert.equal(f.set.rallies.length,0);
 assert.match(f.statuses.at(-1).msg,/segundo intento/);
});

test('native undo partial failure is rejected with no retry or reconstruction',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 f.set.scoreUs=1;f.set.rallies.push({winner:'ours'});
 let calls=0;f.port.nativeUndo=()=>{calls++;throw Error('partial undo')};
 const ctrl=create(f.port);assert.equal(ctrl.undoRally(),false);
 assert.equal(calls,1);assert.equal(f.set.rallies.length,1);
 assert.equal(ctrl.diagnostics().nativeDispatches,1);
});

test('point writer changes the active match after writing: stale-after, never retried',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort(),base=f.port.nativePoint;
 f.port.nativePoint=w=>{base(w);f.setActive({...f.match})};
 const ctrl=create(f.port);assert.equal(ctrl.awardPoint('ours'),false);
 assert.equal(f.points,1);assert.equal(ctrl.diagnostics().lastReason,'stale-after');
});

test('cooldown scheduler failure cannot leave the controller permanently busy',async()=>{
 const create=(await compiled()).createLiveRallyController,f=testPort();
 f.port.scheduleUnlock=()=>{throw Error('timer blocked')};
 const ctrl=create(f.port);
 assert.equal(ctrl.awardPoint('ours'),true);assert.equal(ctrl.awardPoint('ours'),true);
 assert.equal(f.points,2);assert.equal(ctrl.diagnostics().pointBusy,false);
});

test('legacy V8.5.7 wrapper delegates to TypeScript, not the V20.5.79 fallback',async()=>{
 const mod=await compiled(),h=legacyHarness();
 h.win.VC_RALLY_CONTROLLER_20580=mod.installLiveRallyController({});
 h.win.VC_RALLY_COMMAND_LANE_20579={VERSION:'20.5.79',nativeOnly:true,
  singleNativeWriter:true,run:()=>{throw Error('should not invoke old bridge')}};
 for(let i=0;i<20;i++){assert.equal(h.win.scoutAwardPoint('ours'),true);h.flush()}
 for(let i=0;i<6;i++){assert.equal(h.win.scoutUndoRally(),true);h.flush()}
 assert.equal(h.points,20);assert.equal(h.undos,6);
 assert.equal(h.set.scoreUs,14);assert.equal(h.set.rallies.length,14);
 const diagnostics=h.win.VC_RALLY_CONTROLLER_DIAGNOSTICS_20580();
 assert.equal(diagnostics.nativeDispatches,26);
 assert.equal(diagnostics.committed,26);
});

test('legacy wrapper returns false on repeated click without duplicating score',async()=>{
 const mod=await compiled(),h=legacyHarness();
 h.win.VC_RALLY_CONTROLLER_20580=mod.installLiveRallyController({});
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 assert.equal(h.win.scoutAwardPoint('ours'),false);
 assert.equal(h.points,1);h.flush();
 assert.equal(h.win.scoutAwardPoint('ours'),true);assert.equal(h.points,2);
});

test('legacy fallback still delegates exactly once if V20.5.80 is unavailable',async()=>{
 const mod=await compiled(),h=legacyHarness();
 h.win.VC_RALLY_COMMAND_LANE_20579=mod.installRallyCommandLane({});
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 h.flush();
 h.win.VC_RALLY_CONTROLLER_20580={VERSION:'20.5.80',nativeOnly:true,
  singleNativeWriter:true,create:()=>{throw Error('factory not available')}};
 assert.equal(h.win.scoutAwardPoint('ours'),true);
 assert.equal(h.points,2);assert.equal(h.set.scoreUs,2);
});

test('failed controller invocation never triggers fallback native invocation',()=>{
 const h=legacyHarness();
 let calls=0;
 h.win.VC_RALLY_CONTROLLER_20580={VERSION:'20.5.80',nativeOnly:true,
  singleNativeWriter:true,create:()=>({awardPoint:()=>{calls++;throw Error('failed after dispatch')},
   undoRally:()=>{throw Error('failed after dispatch')},diagnostics:()=>({})})};
 assert.equal(h.win.scoutAwardPoint('ours'),false);
 assert.equal(calls,1);assert.equal(h.points,0);
});

test('versioned shell, build output, old bridge and service worker reference V20.5.80',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.5.80');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20580-rally-controller-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.80'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.5.80'));
 assert.ok(read('service-worker.js').includes('rally-controller-20.5.80'));
 assert.ok(read('src/vc2055-entry.ts').includes('installLiveRallyController(window)'));
 assert.ok(source.includes('v20580LiveController()'));
});
