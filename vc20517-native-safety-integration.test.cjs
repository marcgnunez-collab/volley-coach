'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const nativeLines=read('021-core-scouting-v150-monolithic.js').split('\n');
const nativePoint=nativeLines.find(line=>line.startsWith('window.scoutAwardPoint=function(winner){')&&line.includes('vcApplyAutoLibero'));
const nativeUndo=nativeLines.find(line=>line.startsWith('window.scoutUndoRally=function(){')&&line.includes('scoutNormalizeRoles'));
const videoSource=read('028-v740-live-scout-video-module.js');
const nativeVideo=[
 videoSource.slice(videoSource.indexOf('function lastClosedRally(m=active()){'),videoSource.indexOf('function lastAction(m=active()){')),
 videoSource.slice(videoSource.indexOf('function linkRally(r,m,start,end){'),videoSource.indexOf('function rangeAvailable(start,end){')),
 videoSource.slice(videoSource.indexOf('const baseAward=window.scoutAwardPoint;'),videoSource.indexOf('// Render wrapper:'))
].join('\n');
const positions=['p1','p2','p3','p4','p5','p6'];
const lineup=(offset=0)=>Object.fromEntries(positions.map((pos,index)=>[pos,index+1+offset]));
const fixture=(us=4,opponent=3)=>({
 id:'PRIVATE-MATCH',status:'live',currentSet:1,servingTeam:'opponent',
 rotationNo:1,opponentRotationNo:3,
 lineup:{ours:lineup(),opponent:lineup(10)},
 baseLineup:{ours:lineup(),opponent:lineup(10)},
 lineupRoles:{ours:{},opponent:{}},libero:{enabled:false},
 sets:[{number:1,scoreUs:us,scoreOpponent:opponent,finished:false,rallies:[]}],
 liveRally:{id:'PRIVATE-LIVE',actions:[{code:'PRIVATE-CODE'}],startedAt:'2026-01-01',scoutStartMs:0,startSnapshot:null}
});

/** Runs the V15 source function verbatim; only browser infrastructure is stubbed. */
function nativeHarness(match,{saveFailure=null,videoFailure=null,saveResult=undefined,withVideo=false}={}){
 const window={},writes=[],s=match.sets[0],session={id:'PRIVATE-VIDEO-ID',ralliesLinked:0};
 const capture=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:structuredClone(match.lineup),
  scoreBefore:{us:s.scoreUs,opponent:s.scoreOpponent}});
 const context={window,Number,
  scoutActive:()=>match,scoutSet:()=>s,vcEnsureProMatch:()=>{},vcApplyAutoLibero:()=>{},
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=capture()},
  scoutCurrentRallySnapshot:capture,scoutClone:structuredClone,
  vcRotateBase:()=>{},scoutRotateTeamLineup:line=>line,
  scoutResetLiveRally:()=>{match.liveRally={id:'NEXT-PRIVATE',actions:[],startSnapshot:null}},
  scoutSetHasWinner:()=>Math.max(s.scoreUs,s.scoreOpponent)>=25&&Math.abs(s.scoreUs-s.scoreOpponent)>=2,
  scoutSetsScore:()=>({us:0,opponent:0}),scoutSyncCompetition:()=>{},
  scoutNow:()=>new Date(0).toISOString(),scoutElapsed:()=>1200,
  scoutNormalizeLineup:structuredClone,scoutNormalizeLibero:structuredClone,scoutNormalizeRoles:structuredClone,
  scoutSave:()=>{writes.push('native-save');if(saveFailure)throw saveFailure;return saveResult;},
  active:()=>match,currentSession:()=>session,liveRunning:()=>true,videoNow:()=>12,
  arr:value=>Array.isArray(value)?value:[],
  save:()=>{writes.push('native-video-save');if(videoFailure)throw videoFailure;},
  render:()=>{},setTimeout:()=>0,$:()=>null,VERSION:'native-safety-test',
  Date
 };
 assert.ok(nativePoint&&nativeUndo,'Original native code is present');
 vm.runInNewContext([nativePoint,nativeUndo].join('\n'),context,{timeout:1500});
 if(withVideo)vm.runInNewContext(nativeVideo,context,{timeout:1500});
 return {window,writes,session};
}
const diagnostic=pilot=>pilot.report().recent.at(-1);

test('real native point changes score, rotation and rally before scoutSave throws: unsafe partial is detected',async()=>{
 const {createRallyTransactionPilot}=await compiled();
 const match=fixture(),error=new Error('native disk failure'),native=nativeHarness(match,{saveFailure:error});
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:w=>native.window.scoutAwardPoint(w),undoRally:()=>false});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(native.writes.length,1,'no retry or duplicated save');
 assert.equal(match.sets[0].scoreUs,5);
 assert.equal(match.sets[0].rallies.length,1);
 assert.equal(match.servingTeam,'ours');
 assert.equal(match.rotationNo,6);
 assert.equal(pilot.report().nativeRejected,1);
 assert.equal(pilot.report().partialMutations,1);
 for(const area of ['score','service','rotation','actions'])
  assert.ok(diagnostic(pilot).areas.includes(area),area);
});

test('real native undo after a confirmed rally can fail at save without automatic rollback',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const native=nativeHarness(match);
 native.window.scoutAwardPoint('ours');
 assert.equal(match.sets[0].rallies.length,1);
 const saveError=new Error('native undo persistence rejected');
 const failed=nativeHarness(match,{saveFailure:saveError});
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:()=>false,undoRally:()=>failed.window.scoutUndoRally()});
 await assert.rejects(()=>pilot.undoRally(),caught=>caught===saveError);
 assert.equal(match.sets[0].scoreUs,4);
 assert.equal(match.sets[0].rallies.length,0);
 assert.equal(failed.writes.length,1);
 assert.equal(pilot.report().partialMutations,1);
 assert.ok(diagnostic(pilot).areas.includes('score'));
 assert.ok(diagnostic(pilot).areas.includes('actions'));
});

test('real native terminal set closure is tracked if save fails afterwards',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture(24,23);
 const error=new Error('native set close failed'),native=nativeHarness(match,{saveFailure:error});
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:w=>native.window.scoutAwardPoint(w),undoRally:()=>false});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(match.sets[0].finished,true);
 assert.equal(match.sets[0].winner,'ours');
 assert.ok(diagnostic(pilot).areas.includes('set'));
 assert.equal(pilot.report().partialMutations,1);
});

test('real V7.4 video wrapper can link a clip then fail persisting its metadata',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 match.liveRally.id=828;
 match.liveRally.liveVideoStart=7;
 match.liveRally.liveVideoSessionId='PRIVATE-VIDEO-ID';
 const error=new Error('native video save failure'),native=nativeHarness(match,{withVideo:true,videoFailure:error});
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:w=>native.window.scoutAwardPoint(w),undoRally:()=>false});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 const closed=match.sets[0].rallies[0];
 assert.equal(closed.liveVideoStart,7);
 assert.equal(closed.liveVideoEnd,12);
 assert.deepEqual(native.writes,['native-save','native-video-save'],'both historical writers execute once');
 assert.equal(pilot.report().partialMutations,1);
 assert.ok(diagnostic(pilot).areas.includes('video'));
 assert.ok(diagnostic(pilot).areas.includes('actions'));
});

test('native false after changing lineup and video markers is flagged without changing the false result',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,awardPoint:()=>{
  match.lineup.ours.p2=99;match.liveRally.liveVideoStart=12;return false;
 },undoRally:()=>false});
 assert.strictEqual(await pilot.awardPoint('ours'),false);
 assert.equal(pilot.report().nativeDeclined,1);
 assert.equal(pilot.report().partialMutations,1);
 assert.ok(diagnostic(pilot).areas.includes('lineup'));
 assert.ok(diagnostic(pilot).areas.includes('video'));
 assert.equal(match.lineup.ours.p2,99,'no silent restoration of uncertain native result');
});

test('native CAS rejection without local mutation is never reported as a proven partial write',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const conflict=new Error('CAS-conflict'),pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:()=>{throw conflict;},undoRally:()=>false});
 await assert.rejects(()=>pilot.awardPoint('ours'),error=>error===conflict);
 assert.equal(pilot.report().nativeRejected,1);
 assert.equal(pilot.report().partialMutations,0);
 assert.equal(pilot.report().uninspectedFailures,0);
 assert.deepEqual(diagnostic(pilot).areas,[]);
});

test('unreadable state reports missing evidence, never invents a partial mutation or hides native errors',async()=>{
 const {createRallyTransactionPilot}=await compiled();
 const error=new Error('primary failure'),pilot=createRallyTransactionPilot({readCurrent(){
  throw new Error('reader failure');
 },awardPoint:()=>{throw error;},undoRally:()=>false});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(await pilot.undoRally(),false);
 assert.equal(pilot.report().partialMutations,0);
 assert.equal(pilot.report().uninspectedFailures,2);
 assert.deepEqual(diagnostic(pilot).areas,['missing-data']);
});

test('a reader that becomes unavailable only after the native failure cannot mask the original error',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 let reads=0;
 const error=new Error('native timeout'),pilot=createRallyTransactionPilot({
  readCurrent:()=>++reads===1?match:(()=>{throw Error('post-failure read')})(),
  awardPoint:()=>{match.sets[0].scoreUs++;throw error;},undoRally:()=>false
 });
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(match.sets[0].scoreUs,5);
 assert.equal(pilot.report().uninspectedFailures,1);
 assert.equal(pilot.report().partialMutations,0,'cannot prove change without second readable frame');
});

test('FIFO survives a partial failure and delegates the next native command exactly once',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 let calls=0;
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint:()=>{calls++;match.sets[0].scoreUs++;if(calls===1)throw Error('native failed');return true;},
  undoRally:()=>false});
 const first=pilot.awardPoint('ours'),second=pilot.awardPoint('ours');
 await assert.rejects(first,/native failed/);
 assert.equal(await second,true);
 assert.equal(calls,2);
 assert.equal(match.sets[0].scoreUs,6);
 assert.equal(pilot.report().partialMutations,1);
 assert.equal(pilot.report().completed,2);
 assert.equal(pilot.report().pending,0);
});

test('failure findings are bounded and omit player, rally, match and video identifiers',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 match.liveRally.liveVideoSessionId='PRIVATE-VIDEO-ID';
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,awardPoint:()=>{
  match.sets[0].scoreUs++;return false;
 },undoRally:()=>false});
 for(let i=0;i<43;i++)await pilot.awardPoint('ours');
 const report=pilot.report();
 assert.equal(report.nativeDeclined,43);
 assert.equal(report.partialMutations,43);
 assert.equal(report.recent.length,40);
 assert.equal(Object.isFrozen(report.recent),true);
 for(const forbidden of ['PRIVATE-MATCH','PRIVATE-CODE','PRIVATE-LIVE','PRIVATE-VIDEO-ID'])
  assert.equal(JSON.stringify(report).includes(forbidden),false);
});

test('release retains the historical native writers, deployment separation and opt-in-only pilot',()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.38');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20517-native-safety-integration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.38'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.38'));
 assert.ok(sw.includes('native-safety-20.5.17'));
 assert.ok(!html.includes('createRallyTransactionPilot('));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
 const source=read('src/domain/rally-transaction-pilot.ts');
 for(const forbidden of ['scoutSave(', 'localStorage', 'indexedDB', 'supabase',
  'window.', 'document.', 'getSnapshot(', 'v121AwardPoint='])
  assert.equal(source.includes(forbidden),false,forbidden);
});
