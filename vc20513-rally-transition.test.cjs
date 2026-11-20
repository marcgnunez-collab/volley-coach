'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');

// Execute the exact two original writer function assignments, not a rewritten oracle.
// Their non-scoring side effects are stubbed: video, lineup, storage, libero and clock.
const originalSource=read('021-core-scouting-v150-monolithic.js');
const nativeFunctions=['window.scoutAwardPoint=function(winner){', 'window.scoutUndoRally=function(){']
 .map(marker=>originalSource.split('\n').find(line=>line.startsWith(marker)&&
  (marker.includes('Undo')?line.includes('scoutNormalizeRoles'):line.includes('vcApplyAutoLibero'))));
function matchFixture(serving='ours',rotation=3,opponentRotation=5){
 return {status:'live',currentSet:1,servingTeam:serving,rotationNo:rotation,
  opponentRotationNo:opponentRotation,lineup:{ours:{},opponent:{}},baseLineup:{ours:{},opponent:{}},
  lineupRoles:{ours:{},opponent:{}},libero:{},sets:[{number:1,scoreUs:14,scoreOpponent:15,rallies:[],finished:false}],
  liveRally:{id:28,startedAt:'2026-01-01',actions:[{skill:'R',evaluation:'+'}]}};
}
function nativeHarness(match){
 const set=match.sets[0],saveCalls=[];
 const window={};
 const snapshot=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:structuredClone(match.lineup),
  scoreBefore:{us:set.scoreUs,opponent:set.scoreOpponent}});
 const context={window,scoutActive:()=>match,scoutSet:()=>set,
  vcEnsureProMatch:()=>{},vcApplyAutoLibero:()=>{},
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=snapshot();},
  scoutCurrentRallySnapshot:snapshot,scoutClone:structuredClone,
  vcRotateBase:()=>{},scoutRotateTeamLineup:lineup=>lineup,
  scoutResetLiveRally:()=>{match.liveRally={id:29,actions:[]};},
  scoutSetHasWinner:()=>false,scoutSetsScore:()=>({us:0,opponent:0}),
  scoutSave:()=>saveCalls.push('saved'),scoutNow:()=>new Date(0).toISOString(),scoutElapsed:()=>0,
  scoutNormalizeLineup:lineup=>lineup,scoutNormalizeLibero:libero=>libero,
  scoutNormalizeRoles:roles=>roles};
 vm.runInNewContext(nativeFunctions.join('\n'),context,{timeout:1000});
 return {window,saveCalls};
}
const observed=match=>({score:{us:match.sets[0].scoreUs,opponent:match.sets[0].scoreOpponent},
 serving:match.servingTeam,rotationUs:match.rotationNo,rotationOpponent:match.opponentRotationNo});

test('typed close and undo previews agree with the actual legacy writers for both teams and all P1–P6',async()=>{
 const {planAwardPoint,planUndoLastRally}=await compiled();
 let checked=0;
 for(const serving of ['ours','opponent'])for(const winner of ['ours','opponent'])for(let rotation=1;rotation<=6;rotation++){
  const match=matchFixture(serving,rotation,rotation);
  const native=nativeHarness(match),original=observed(match);
  const point=planAwardPoint(match,winner);
  assert.equal(point.state,'projected');assert.deepEqual(point.before,original);
  assert.equal(point.includesLineups,false);assert.equal(point.readOnly,true);
  assert.deepEqual(observed(match),original,'planning must not mutate the match');
  native.window.scoutAwardPoint(winner);
  assert.deepEqual(observed(match),point.after,`native point (${serving},${winner},P${rotation})`);
  const undo=planUndoLastRally(match);
  assert.equal(undo.state,'projected');assert.deepEqual(undo.before,point.after);
  assert.deepEqual(undo.after,original);
  native.window.scoutUndoRally();
  assert.deepEqual(observed(match),undo.after,`native undo (${serving},${winner},P${rotation})`);
  assert.equal(match.liveRally.actions.length,1,'native undo restores rally actions');
  assert.equal(native.saveCalls.length,2,'only the original writers persist changes');
  checked++;
 }
 assert.equal(checked,24);
});

test('no active match, missing data, finished status and set boundary never produce executable commands',async()=>{
 const {planAwardPoint,planUndoLastRally}=await compiled();
 assert.equal(planAwardPoint(null,'ours').reason,'no-match');
 assert.equal(planUndoLastRally(null).reason,'no-match');
 const match=matchFixture();
 assert.equal(planUndoLastRally(match).reason,'no-rallies');
 assert.equal(planAwardPoint(match,'unknown').state,'unknown');
 match.status='finished';
 assert.equal(planAwardPoint(match,'ours').state,'blocked');
 assert.equal(planUndoLastRally(match).state,'blocked','V13 wrapper blocks undo of finalized matches');
 match.status='live';match.sets[0].finished=true;
 assert.equal(planAwardPoint(match,'ours').state,'blocked');
 match.sets[0].finished=false;match.sets[0].scoreUs=undefined;
 assert.equal(planAwardPoint(match,'ours').state,'unknown','no synthetic zero score');
 match.sets[0].scoreUs=14;match.currentSet=9;
 assert.equal(planAwardPoint(match,'ours').reason,'no-set');
});

test('stale live snapshots and edited closed scores are not treated as valid transitions',async()=>{
 const {planAwardPoint,planUndoLastRally}=await compiled();
 const match=matchFixture('opponent',1,6),native=nativeHarness(match);
 match.liveRally.startSnapshot={servingBefore:'opponent',rotationBefore:1,opponentRotationBefore:6,
  scoreBefore:{us:13,opponent:15}};
 assert.equal(planAwardPoint(match,'ours').reason,'stale-score');
 match.liveRally.startSnapshot.scoreBefore.us=14;
 assert.equal(planAwardPoint(match,'ours').state,'projected');
 native.window.scoutAwardPoint('ours');
 match.sets[0].scoreUs=30;
 assert.equal(planUndoLastRally(match).reason,'stale-score');
 match.sets[0].scoreUs=15;
 match.sets[0].rallies[0].scoreAfter.us=28;
 assert.equal(planUndoLastRally(match).reason,'invalid-data');
});

test('the last set-winning rally can be previewed for undo while the match itself stays live',async()=>{
 const {planUndoLastRally}=await compiled();
 const match=matchFixture('ours',6,2),native=nativeHarness(match);
 native.window.scoutAwardPoint('ours');
 match.sets[0].finished=true;
 const undo=planUndoLastRally(match);
 assert.equal(undo.state,'projected');
 native.window.scoutUndoRally();
 assert.equal(match.sets[0].finished,false);
 assert.deepEqual(observed(match),undo.after);
});

test('a single typed rally inspection powers prior score and rotation audit semantics',async()=>{
 const {inspectClosedRally,auditCommittedMatch}=await compiled();
 const first={winner:'ours',servingBefore:'opponent',rotationBefore:1,opponentRotationBefore:5,
  scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},actions:[]};
 const next={winner:'opponent',servingBefore:'ours',rotationBefore:6,opponentRotationBefore:5,
  scoreBefore:{us:1,opponent:0},scoreAfter:{us:1,opponent:1},actions:[]};
 const report=inspectClosedRally(first,next);
 assert.equal(report.score.state,'verified');
 assert.equal(report.scoreLink,'match');assert.equal(report.rotationLink,'match');
 assert.deepEqual(report.undoTo,{score:{us:0,opponent:0},serving:'opponent',rotationUs:1,rotationOpponent:5});
 assert.equal(Object.isFrozen(report),true);
 const match={sets:[{rallies:[first,next]}]};
 let audit=auditCommittedMatch(match);
 assert.equal(audit.counters.scoreLinksChecked,1);assert.equal(audit.counters.rotationsChecked,1);
 next.servingBefore='opponent';next.scoreBefore.us=5;
 audit=auditCommittedMatch(match);
 assert.equal(audit.counters.scoreLinksMismatch,1);assert.equal(audit.counters.rotationsMismatch,1);
 assert.equal(inspectClosedRally({},next).scoreLink,'unknown');
 assert.equal(inspectClosedRally(first,{}).rotationLink,'unknown');
});

test('legacy writer adapters and sync boundaries stay unchanged in the V20.5.13 source',async()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.57');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20513-rally-transition.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.57'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.57'));
 assert.ok(html.includes('233-vc20512-match-state-core.js?v=20.5.12'));
 assert.ok(html.includes('234-vc20512-match-state-adapters.js?v=20.5.12'));
 assert.ok(sw.includes('rally-transition-20.5.13'));
 assert.ok(read('src/domain/committed-audit.ts').includes('inspectClosedRally('));
 const source=read('src/domain/rally-transition.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase',
  'cloudClient.', 'window.', 'document.', 'v121AwardPoint=', 'getSnapshot(', 'JSON.parse(JSON.stringify('])
  assert.ok(!source.includes(forbidden),forbidden);
});
