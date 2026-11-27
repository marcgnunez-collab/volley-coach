'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function fixture(){return {
 id:'PRIVATE-55',status:'live',currentSet:1,servingTeam:'opponent',rotationNo:1,opponentRotationNo:3,
 lineup:{ours:{p1:1},opponent:{p1:11}},baseLineup:{ours:{p1:1}},libero:{enabled:false},
 sets:[{number:1,scoreUs:4,scoreOpponent:2,rallies:[],finished:false}],
 liveRally:{id:'PRIVATE-LIVE',actions:[{code:'SECRET-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}],startSnapshot:null}
};}
function harness({bridge,match=fixture(),point=()=>true,undo=()=>true}={}){
 const events=[],state={getActive:()=>match,isReadonly:()=>match.status==='finished',
  getSnapshot:()=>null,sync:reason=>{events.push(reason)},subscribe:()=>()=>{},diagnostics:()=>({native:true})};
 const window={MatchState:state,v121AwardPoint:point,v121UndoRally:undo,
  ...(bridge?{VC_RALLY_WRITER_20555:bridge}:{})};
 const document={readyState:'loading',getElementById:()=>null,querySelector:()=>null,
  addEventListener:()=>{},body:{classList:{add:()=>{}}}};
 const warnings=[];
 vm.runInNewContext(read('234-vc20512-match-state-adapters.js'),{
  window,document,console:{warn:(...xs)=>warnings.push(xs),error:(...xs)=>warnings.push(xs)},
  setTimeout,requestAnimationFrame:callback=>callback(),Promise
 },{timeout:1500});
 return {window,state,match,events,warnings};
}

test('V20.5.55 exposes a stable typed bridge but creates no writer until bound',async()=>{
 const module=await compiled(),win={},bridge=module.installLiveRallyWriterBridge(win);
 assert.equal(bridge.VERSION,'20.5.55');
 assert.equal(bridge.singleNativeWriter,true);
 assert.strictEqual(bridge,win.VC_RALLY_WRITER_20555);
 assert.strictEqual(module.installLiveRallyWriterBridge(win),bridge);
 assert.ok(Object.isFrozen(bridge));
 assert.throws(()=>bridge.create({}),/escritores nativos originales/);
});

test('real MatchState adapter queues rapid points and undo, keeping one native writer and one save per command',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const calls=[],releases=[];let saved=0;
 const m=fixture();
 function writePoint(winner){
  calls.push('point:'+winner);
  return new Promise(resolve=>{releases.push(()=>{
   const set=m.sets[0],before={us:set.scoreUs,opponent:set.scoreOpponent};
   set.rallies.push({id:'R'+(set.rallies.length+1),winner,scoreBefore:before,
    scoreAfter:{us:before.us+(winner==='ours'?1:0),opponent:before.opponent+(winner==='opponent'?1:0)},
    servingBefore:m.servingTeam,rotationBefore:m.rotationNo,opponentRotationBefore:m.opponentRotationNo,
    lineupBefore:structuredClone(m.lineup),actions:structuredClone(m.liveRally.actions)});
   set.scoreUs+=winner==='ours'?1:0;set.scoreOpponent+=winner==='opponent'?1:0;
   if(m.servingTeam!==winner){if(winner==='ours')m.rotationNo=6;else m.opponentRotationNo=2;}
   m.servingTeam=winner;m.liveRally={id:'NEXT',actions:[],startSnapshot:null};
   saved++;resolve(true);
  })});
 }
 function undo(){calls.push('undo');const s=m.sets[0],r=s.rallies.pop();
  s.scoreUs=r.scoreBefore.us;s.scoreOpponent=r.scoreBefore.opponent;
  m.servingTeam=r.servingBefore;m.rotationNo=r.rotationBefore;m.opponentRotationNo=r.opponentRotationBefore;
  m.liveRally={id:r.id,actions:r.actions};saved++;return true;}
 const {window,state,events}=harness({bridge,match:m,point:writePoint,undo});
 const first=window.v121AwardPoint('ours'),second=window.v121AwardPoint('opponent'),third=window.v121UndoRally();
 await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.deepEqual(calls,['point:ours'],'no second native call before first finishes');
 releases.shift()();assert.equal(await first,true);
 await Promise.resolve();await Promise.resolve();
 assert.deepEqual(calls,['point:ours','point:opponent']);
 releases.shift()();assert.equal(await second,true);assert.equal(await third,true);
 assert.deepEqual(calls,['point:ours','point:opponent','undo']);
 assert.equal(saved,3,'no shadow score, journal or duplicate persistence write');
 assert.equal(m.sets[0].scoreUs,5);assert.equal(m.sets[0].scoreOpponent,2);
 assert.equal(m.servingTeam,'ours');assert.equal(m.rotationNo,6);
 assert.equal(events.length,3);
 const status=state.diagnostics().rallyCoordinator;
 assert.equal(status.status,'active');assert.equal(status.report.installedInLiveUI,true);
 assert.equal(status.report.submitted,3);assert.equal(status.report.completed,3);
 assert.equal(status.report.pending,0);assert.equal(status.report.nativeRejected,0);
 assert.equal(JSON.stringify(status).includes('PRIVATE-PLAYER'),false);
 assert.equal(JSON.stringify(status).includes('SECRET-CODE'),false);
});

test('missing module falls back once; late module activation never replays the old write',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 let nativeCalls=0;
 const {window,state}=harness({point:()=>{nativeCalls++;return true;},undo:()=>{nativeCalls++;return false;}});
 assert.equal(await window.v121AwardPoint('ours'),true);
 assert.equal(nativeCalls,1);
 assert.equal(state.diagnostics().rallyCoordinator.status,'awaiting-module');
 window.VC_RALLY_WRITER_20555=bridge;
 assert.equal(await window.v121AwardPoint('ours'),true);
 assert.equal(nativeCalls,2);
 assert.equal(state.diagnostics().rallyCoordinator.status,'active');
 assert.equal(state.diagnostics().rallyCoordinator.report.submitted,1);
 assert.equal(await window.v121UndoRally(),false,'a cancelled undo stays a native decline');
 assert.equal(nativeCalls,3);
 assert.equal(state.diagnostics().rallyCoordinator.report.nativeDeclined,1);
});

test('a rejected native writer is propagated exactly once; remaining commands preserve FIFO',async()=>{
 const bridge=(await compiled()).installLiveRallyWriterBridge({});
 const error=new Error('private storage conflict');let calls=0;
 const {window,state,events}=harness({bridge,point:()=>{calls++;if(calls===1)throw error;return true;}});
 await assert.rejects(window.v121AwardPoint('ours'),caught=>caught===error);
 assert.equal(await window.v121AwardPoint('ours'),true);
 assert.equal(calls,2);assert.equal(events.length,1);
 const report=state.diagnostics().rallyCoordinator.report;
 assert.equal(report.nativeRejected,1);assert.equal(report.submitted,2);
 assert.equal(report.completed,2);assert.equal(report.pending,0);
 assert.equal(JSON.stringify(report).includes('private storage conflict'),false);
});

test('incompatible or throwing bridge can only fall back before a native dispatch',async()=>{
 for(const bad of [{VERSION:'20.5.54',singleNativeWriter:true,create:()=>{}},
  {VERSION:'20.5.55',singleNativeWriter:true,create(){throw Error('unavailable')}}]){
  let points=0;
  const {window,state}=harness({bridge:bad,point:()=>{points++;return 'original';}});
  assert.equal(await window.v121AwardPoint('ours'),'original');assert.equal(points,1);
  assert.notEqual(state.diagnostics().rallyCoordinator.status,'active');
 }
 const bridge={VERSION:'20.5.55',singleNativeWriter:true,create:()=>({
  awardPoint:()=>Promise.reject(new Error('failed after dispatch')),undoRally:()=>false,report:()=>({})})};
 let originals=0;
 const {window}=harness({bridge,point:()=>{originals++;return true;}});
 await assert.rejects(window.v121AwardPoint('ours'),/failed after dispatch/);
 assert.equal(originals,0,'a failed dispatched command must never fall back and duplicate a point');
});

test('release retains original scorer and V12.1 saves, with only the adapter as live entry point',()=>{
 const pkg=require('./package.json'),html=read('index.html'),adapter=read('234-vc20512-match-state-adapters.js');
 assert.equal(pkg.version,'20.6.1');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20555-live-rally-writer.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.1'));
 assert.ok(adapter.includes('getRallyCoordinator()'));
 assert.ok(adapter.includes('awardPoint:captured.point,undoRally:captured.undo'));
 assert.equal(adapter.includes('window.scoutAwardPoint='),false);
 assert.equal(adapter.includes('window.scoutUndoRally='),false);
 const ts=read('src/domain/rally-writer-runtime.ts');
 for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(', 'window.scoutAwardPoint=','window.scoutUndoRally='])
  assert.equal(ts.includes(forbidden),false,forbidden);
});
