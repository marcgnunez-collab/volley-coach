'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const fixture=id=>({id,status:'live',currentSet:1,servingTeam:'opponent',rotationNo:1,opponentRotationNo:1,
 lineup:{ours:{p1:id},opponent:{p1:id+100}},libero:{enabled:false},
 sets:[{number:1,scoreUs:0,scoreOpponent:0,finished:false,rallies:[]}],
 liveRally:{id:'R'+id,actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}]}});
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};

function canonicalBrowser({point,undo,bridge}){
 const matches=[fixture(101),fixture(202)];let activeId=101;
 const alerts=[],saves=[],errors=[];
 const window={v121AwardPoint:point||(()=>true),v121UndoRally:undo||(()=>false),
  VC_RALLY_WRITER_20555:bridge,alert:message=>alerts.push(message),
  scoutV902Flush:async()=>true,VC_SCOUT_VIDEO_BRIDGE:{activateMatch:id=>{
   activeId=id;return matches.find(m=>m.id===id)||null;
  }}};
 const document={readyState:'loading',getElementById:()=>null,querySelector:()=>null,
  querySelectorAll:()=>[],dispatchEvent:()=>{},addEventListener:()=>{},
  body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}}};
 const context=vm.createContext({window,document,CustomEvent:class{constructor(_type,options){this.detail=options?.detail}},
  EventTarget,Promise,Date,Number,structuredClone,
  setTimeout,requestAnimationFrame:fn=>fn(),
  console:{warn:()=>{},error:(...args)=>errors.push(args)},
  scoutingMatches:matches,scoutActive:()=>matches.find(m=>m.id===activeId)||null,
  scoutSet:m=>m?.sets.find(s=>s.number===m.currentSet)||null,
  scoutSetsScore:()=>({us:0,opponent:0}),scoutActionCount:m=>m?.sets[0].rallies.length||0,
  scoutClone:structuredClone,scoutNow:()=>new Date(0).toISOString(),
  equipoActivo:'team',equiposData:{team:{scoutingMatches:matches}},
  guardarEstadoLocalSinCloud:()=>saves.push(activeId)});
 vm.runInContext(read('233-vc20512-match-state-core.js'),context,{timeout:1500});
 vm.runInContext(read('234-vc20512-match-state-adapters.js'),context,{timeout:1500});
 return {window,matches,alerts,errors,saves,state:window.MatchState,
  active:()=>matches.find(m=>m.id===activeId),select:id=>window.MatchState.select(id,{saveCurrent:false,openWorkspace:false})};
}

test('selection waits for the active point save, discards queued points and never scores another match',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const releases=[],writes=[];
 let app;
 app=canonicalBrowser({bridge,point:winner=>{
  const m=app.active();writes.push({matchId:m.id,winner});
  return new Promise(resolve=>releases.push(()=>{m.sets[0].scoreUs++;resolve(true)}));
 }});
 const first=app.window.v121AwardPoint('ours');
 const second=app.window.v121AwardPoint('ours');
 await flush();
 assert.equal(writes.length,1);
 const switchPromise=app.select(202);
 await flush();
 assert.equal(app.active().id,101,'switch stays behind the pending save');
 assert.equal(app.state.diagnostics().rallyCoordinator.report.selectionPending,true);
 releases.shift()();
 assert.equal(await first,true);
 assert.equal(await second,false,'queued point is discarded, not retargeted');
 await switchPromise;
 assert.equal(app.active().id,202);
 assert.equal(app.matches[0].sets[0].scoreUs,1);
 assert.equal(app.matches[1].sets[0].scoreUs,0);
 assert.equal(writes.length,1,'only one native write happened');
 const report=app.state.diagnostics().rallyCoordinator.report;
 assert.equal(report.contextDiscarded,1);
 assert.equal(report.selectionPending,false);
 assert.equal(report.pending,0);
 assert.equal(app.alerts.length,1,'the operator sees a warning for the discarded point');
 assert.equal(JSON.stringify(report).includes('PRIVATE-PLAYER'),false);
 assert.equal(JSON.stringify(report).includes('PRIVATE-CODE'),false);
 const third=app.window.v121AwardPoint('ours');
 await flush();
 assert.equal(writes[1].matchId,202,'the new match can accept a fresh command');
 releases.shift()();await third;
 assert.equal(app.matches[1].sets[0].scoreUs,1);
});

test('a restored match object with the same ID cannot receive an earlier queued point',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const match=fixture(5),current={value:match};
 let resolveFirst,calls=0;
 const pilot=bridge.create({readCurrent:()=>current.value,
  awardPoint:()=>{calls++;if(calls===1)return new Promise(resolve=>{resolveFirst=resolve});return true},
  undoRally:()=>false});
 const first=pilot.awardPoint('ours'),second=pilot.awardPoint('ours');
 await flush();assert.equal(calls,1);
 current.value=structuredClone(match);
 resolveFirst(true);assert.equal(await first,true);
 assert.equal(await second,false);
 assert.equal(calls,1);
 assert.equal(pilot.report().contextDiscarded,1);
});

test('selection barrier is idempotently released and rejects new score commands until completion',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const match=fixture(7);let calls=0;
 const pilot=bridge.create({readCurrent:()=>match,awardPoint:()=>{calls++;return true},undoRally:()=>false});
 const release=await pilot.beginMatchSelection();
 assert.equal(pilot.report().selectionPending,true);
 assert.equal(await pilot.awardPoint('ours'),false);
 assert.equal(calls,0);
 release();release();
 assert.equal(pilot.report().selectionPending,false);
 assert.equal(await pilot.awardPoint('ours'),true);
 assert.equal(calls,1);
 assert.equal(pilot.report().contextDiscarded,1);
});

test('a failed native save is never retried and does not leave selection locked',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const error=new Error('PRIVATE-STORAGE-ERROR');let calls=0;
 const app=canonicalBrowser({bridge,point:()=>{calls++;throw error}});
 await assert.rejects(app.window.v121AwardPoint('ours'),caught=>caught===error);
 await app.select(202);
 assert.equal(app.active().id,202);
 assert.equal(calls,1);
 assert.equal(app.state.diagnostics().rallyCoordinator.report.selectionPending,false);
 assert.equal(app.state.diagnostics().rallyCoordinator.report.nativeRejected,1);
});

test('a point pressed while selection is pending is rejected without opening another native write',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 let releaseNative,writes=0;
 const app=canonicalBrowser({bridge,point:()=>{writes++;return new Promise(resolve=>{releaseNative=()=>resolve(true)})}});
 const inFlight=app.window.v121AwardPoint('ours');await flush();
 const changing=app.select(202);await flush();
 const late=app.window.v121AwardPoint('ours');
 assert.equal(await late,false);
 assert.equal(writes,1);
 releaseNative();await inFlight;await changing;
 assert.equal(app.active().id,202);
 assert.equal(app.state.diagnostics().rallyCoordinator.report.contextDiscarded,1);
});

test('a failed match switch releases the lock and preserves the active match',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 let writes=0;
 const app=canonicalBrowser({bridge,point:()=>{writes++;return true}});
 app.window.VC_SCOUT_VIDEO_BRIDGE.activateMatch=()=>{throw new Error('PRIVATE-SELECTION-FAILURE')};
 await assert.rejects(app.select(202),/PRIVATE-SELECTION-FAILURE/);
 assert.equal(app.active().id,101);
 assert.equal(app.state.diagnostics().rallyCoordinator.report.selectionPending,false);
 assert.equal(await app.window.v121AwardPoint('ours'),true);
 assert.equal(writes,1);
});

test('cancelled undo and original opt-in detached pilots preserve their previous behavior',async()=>{
 const module=await compiled();
 const app=canonicalBrowser({bridge:module.installLiveRallyWriterBridge({}),undo:()=>false});
 assert.equal(await app.window.v121UndoRally(),false);
 assert.equal(app.alerts.length,0);
 assert.equal(app.state.diagnostics().rallyCoordinator.report.contextDiscarded,0);
 const detached=module.createRallyTransactionPilot({readCurrent:()=>null,awardPoint:()=>true,undoRally:()=>false});
 assert.equal(await detached.awardPoint('ours'),true);
 assert.equal(detached.report().installedInLiveUI,false);
 assert.equal(detached.report().selectionPending,false);
});

test('V20.5.56 release wires selection to the one writer without touching CAS or IndexedDB',()=>{
 const pkg=require('./package.json'),adapter=read('234-vc20512-match-state-adapters.js'),
  state=read('233-vc20512-match-state-core.js'),html=read('index.html');
 assert.equal(pkg.version,'20.7.1');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20556-rally-selection-safety.test.cjs'));
 assert.ok(adapter.includes('prepareMatchSwitch:async()=>'));
 assert.ok(state.includes('releaseSelection=await prepare()'));
 assert.ok(state.includes('}finally{try{releaseSelection()}catch(_){}}'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 const typed=read('src/domain/rally-transaction-pilot.ts');
 for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(', 'window.scoutAwardPoint='])
  assert.equal(typed.includes(forbidden),false,forbidden);
});
