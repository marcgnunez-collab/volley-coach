'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const positions=['p1','p2','p3','p4','p5','p6'];
const lineup=offset=>Object.fromEntries(positions.map((pos,index)=>[pos,index+1+offset]));
const fixture=()=>({
 id:'PRIVATE-MATCH',status:'live',currentSet:1,servingTeam:'opponent',
 rotationNo:1,opponentRotationNo:3,
 lineup:{ours:lineup(0),opponent:lineup(10)},baseLineup:{ours:lineup(0),opponent:lineup(10)},
 lineupRoles:{ours:{},opponent:{}},libero:{auto:false},
 sets:[{number:1,scoreUs:4,scoreOpponent:3,rallies:[],finished:false}],
 liveRally:{id:'PRIVATE-LIVE',actions:[{code:'PRIVATE-CODE'}],startedAt:'2026-01-01',scoutStartMs:0,startSnapshot:null}
});
const clone=value=>structuredClone(value);
const nativeLine=read('021-core-scouting-v150-monolithic.js').split('\n')
 .find(line=>line.startsWith('window.scoutAwardPoint=function(winner){')&&line.includes('vcApplyAutoLibero'));

/** Real native scorer running against a simulated original persistence owner.
 * savePhase:'before' fails without committing; 'after' commits then throws.
 */
function nativeHarness(initial,savePhase){
 let current=initial,durable=clone(initial),writes=0;
 const failure=new Error('PRIVATE-NATIVE-STORAGE-ERROR'),window={};
 const snapshot=()=>({servingBefore:current.servingTeam,rotationBefore:current.rotationNo,
  opponentRotationBefore:current.opponentRotationNo,lineupBefore:clone(current.lineup),
  scoreBefore:{us:current.sets[0].scoreUs,opponent:current.sets[0].scoreOpponent}});
 const context={window,Number,scoutActive:()=>current,scoutSet:()=>current.sets[0],
  vcEnsureProMatch:()=>{},vcApplyAutoLibero:()=>{},
  scoutEnsureRallyStart:()=>{if(!current.liveRally.startSnapshot)current.liveRally.startSnapshot=snapshot()},
  scoutCurrentRallySnapshot:snapshot,scoutClone:clone,
  vcRotateBase:()=>{},scoutRotateTeamLineup:line=>line,
  scoutResetLiveRally:()=>{current.liveRally={id:'NEXT-PRIVATE',actions:[],startSnapshot:null}},
  scoutSetHasWinner:()=>false,scoutSetsScore:()=>({us:0,opponent:0}),scoutSyncCompetition:()=>{},
  scoutNow:()=>new Date(0).toISOString(),scoutElapsed:()=>1200,
  scoutSave:()=>{
   writes++;
   if(savePhase==='before')throw failure;
   durable=clone(current);
   if(savePhase==='after')throw failure;
  }
 };
 assert.ok(nativeLine,'the original native scorer must be present');
 vm.runInNewContext(nativeLine,context,{timeout:1500});
 return {readCurrent:()=>current,readDurableLocal:()=>clone(durable),
  awardPoint:winner=>window.scoutAwardPoint(winner),undoRally:()=>false,
  reloadFromDisk:()=>{current=clone(durable);},calls:()=>writes,error:failure,
  durable:()=>durable,current:()=>current};
}

test('native score mutated, storage crashed before commit: durable-before and opt-in gate',async()=>{
 const {createRallyTransactionPilot}=await compiled(),native=nativeHarness(fixture(),'before');
 const pilot=createRallyTransactionPilot(native,{requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===native.error);
 assert.equal(native.calls(),1,'the native save never retries');
 assert.equal(native.current().sets[0].scoreUs,5);
 assert.equal(native.durable().sets[0].scoreUs,4);
 const report=pilot.report();
 assert.equal(report.recoveryGuard.enabled,true);
 assert.equal(report.recoveryGuard.blocked,true);
 assert.equal(report.recoveryGuard.lastEvidence,'durable-before');
 assert.equal(report.partialMutations,1);
 assert.equal(report.recent[0].durability,'durable-before');
 await assert.rejects(()=>pilot.awardPoint('ours'),/Recuperación pendiente/);
 assert.equal(native.calls(),1,'blocked command cannot reach native writer');
 assert.equal(pilot.report().blockedCommands,1);
});

test('native writer commits then raises an error: durable-after is detected without a retry',async()=>{
 const {createRallyTransactionPilot}=await compiled(),native=nativeHarness(fixture(),'after');
 const pilot=createRallyTransactionPilot(native,{requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===native.error);
 assert.equal(native.calls(),1);
 assert.equal(native.durable().sets[0].scoreUs,5);
 assert.equal(pilot.report().recoveryGuard.lastEvidence,'durable-after');
 assert.equal(pilot.report().recoveryGuard.blocked,true);
 assert.equal(pilot.report().partialMutations,1);
});

test('operator can resume only after loading a matching original locally persisted record',async()=>{
 const {createRallyTransactionPilot}=await compiled(),native=nativeHarness(fixture(),'before');
 const pilot=createRallyTransactionPilot(native,{requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===native.error);
 assert.equal(await pilot.resumeAfterVerifiedReload(),false,'stale in-memory partial score must not unblock');
 native.reloadFromDisk();
 assert.equal(native.current().sets[0].scoreUs,4);
 assert.equal(await pilot.resumeAfterVerifiedReload(),true,'explicit operator action verifies both local reads');
 assert.equal(pilot.report().recoveryGuard.blocked,false);
 assert.equal(await pilot.resumeAfterVerifiedReload(),false,'second acknowledgement cannot be reused');
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===native.error);
 assert.equal(native.calls(),2,'next legitimate native command runs once');
 assert.equal(pilot.report().recoveryGuard.blocked,true,'another failed save blocks again');
});

test('simulated page restart restores a pending block from the existing journal without a new writer',async()=>{
 const {createRallyTransactionPilot}=await compiled();
 let active=fixture(),durable=clone(active),calls=0;
 // The original journal owner already knows there was a pending write; the pilot never saves this flag.
 const restarted=createRallyTransactionPilot({readCurrent:()=>active,
  readDurableLocal:()=>clone(durable),awardPoint:()=>{calls++;return true;},undoRally:()=>false},
  {requireRecoveryAfterNativeFailure:true,startBlockedForPendingRecovery:true});
 assert.equal(restarted.report().recoveryGuard.blocked,true);
 await assert.rejects(()=>restarted.awardPoint('ours'),/Recuperación pendiente/);
 assert.equal(calls,0);
 active.sets[0].scoreUs=5;
 assert.equal(await restarted.resumeAfterVerifiedReload(),false);
 active=clone(durable);
 assert.equal(await restarted.resumeAfterVerifiedReload(),true);
 assert.equal(await restarted.awardPoint('ours'),true);
 assert.equal(calls,1);
});

test('a different durable score is divergent and cannot be silently interpreted as a success',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const durable=clone(match);durable.sets[0].scoreUs=17;
 const error=new Error('disk conflict');
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,readDurableLocal:()=>durable,
  awardPoint:()=>{match.sets[0].scoreUs=5;throw error;},undoRally:()=>false},
  {requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(pilot.report().recoveryGuard.lastEvidence,'divergent');
 assert.equal(await pilot.resumeAfterVerifiedReload(),false);
 assert.equal(pilot.report().recoveryGuard.blocked,true);
});

test('storage read failure preserves the original native error and stays blocked',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const error=new Error('native write aborted');
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  readDurableLocal:()=>{throw new Error('IndexedDB reader unavailable');},
  awardPoint:()=>{match.sets[0].scoreUs++;throw error;},undoRally:()=>false},
  {requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'),caught=>caught===error);
 assert.equal(pilot.report().recoveryGuard.lastEvidence,'unreadable');
 assert.equal(await pilot.resumeAfterVerifiedReload(),false);
 assert.equal(pilot.report().recoveryGuard.blocked,true);
});

test('no persistence reader means not-configured, not false confirmation of durable safety',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,awardPoint:()=>false,undoRally:()=>false},
  {requireRecoveryAfterNativeFailure:true});
 assert.strictEqual(await pilot.awardPoint('ours'),false);
 assert.equal(pilot.report().recoveryGuard.lastEvidence,'not-configured');
 assert.equal(await pilot.resumeAfterVerifiedReload(),false);
 await assert.rejects(()=>pilot.undoRally(),/Recuperación pendiente/);
});

test('read-only evidence cannot confuse different match IDs or incomplete identity',async()=>{
 const {captureRecoveryFrame,classifyRecoveryEvidence,equalRecoveryFrames}=await compiled();
 const before=fixture(),after=clone(before),durable=clone(before);
 after.sets[0].scoreUs++;durable.sets[0].scoreUs++;
 assert.equal(classifyRecoveryEvidence(captureRecoveryFrame(before),
  captureRecoveryFrame(after),captureRecoveryFrame(durable)),'durable-after');
 durable.id='PRIVATE-OTHER-MATCH';
 assert.equal(equalRecoveryFrames(captureRecoveryFrame(after),captureRecoveryFrame(durable)),false);
 assert.equal(classifyRecoveryEvidence(captureRecoveryFrame(before),
  captureRecoveryFrame(after),captureRecoveryFrame(durable)),'unreadable');
 delete durable.id;
 assert.equal(classifyRecoveryEvidence(captureRecoveryFrame(before),
  captureRecoveryFrame(after),captureRecoveryFrame(durable)),'unreadable');
});

test('an unmodified frame is observationally unchanged, not proof of cloud delivery',async()=>{
 const {captureRecoveryFrame,classifyRecoveryEvidence}=await compiled(),match=fixture();
 const frame=captureRecoveryFrame(match),fresh=captureRecoveryFrame(clone(match));
 assert.equal(classifyRecoveryEvidence(frame,fresh,captureRecoveryFrame(clone(match))),'unchanged-observed');
 assert.ok(Object.isFrozen(frame));
 assert.ok(Object.isFrozen(frame.fields));
});

test('queued commands after the first failed save are held without touching the original scorer',async()=>{
 const {createRallyTransactionPilot}=await compiled(),native=nativeHarness(fixture(),'before');
 const pilot=createRallyTransactionPilot(native,{requireRecoveryAfterNativeFailure:true});
 const a=pilot.awardPoint('ours'),b=pilot.awardPoint('opponent'),c=pilot.undoRally();
 await assert.rejects(a,caught=>caught===native.error);
 await assert.rejects(b,/Recuperación pendiente/);
 await assert.rejects(c,/Recuperación pendiente/);
 assert.equal(native.calls(),1);
 assert.equal(pilot.report().submitted,3);
 assert.equal(pilot.report().completed,3);
 assert.equal(pilot.report().blockedCommands,2);
 assert.equal(pilot.report().pending,0);
});

test('default disabled gate preserves previous native pilot behavior and no second writer',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 let calls=0;
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,awardPoint:()=>{
  calls++;return false;
 },undoRally:()=>{calls++;return false;}});
 assert.equal(await pilot.awardPoint('ours'),false);
 assert.equal(await pilot.undoRally(),false);
 assert.equal(calls,2);
 assert.equal(pilot.report().recoveryGuard.enabled,false);
 assert.equal(pilot.report().recoveryGuard.blocked,false);
});

test('failed proof never reveals match IDs, players, codes or storage details in reports',async()=>{
 const {createRallyTransactionPilot}=await compiled(),native=nativeHarness(fixture(),'before');
 const pilot=createRallyTransactionPilot(native,{requireRecoveryAfterNativeFailure:true});
 await assert.rejects(()=>pilot.awardPoint('ours'));
 const diagnostic=JSON.stringify(pilot.report());
 for(const secret of ['PRIVATE-MATCH','PRIVATE-CODE','PRIVATE-LIVE','PRIVATE-NATIVE-STORAGE-ERROR'])
  assert.equal(diagnostic.includes(secret),false);
 assert.equal(Object.isFrozen(pilot.report().recoveryGuard),true);
});

test('V20.5.18 is exported but remains offline in UI; CAS/native sources are byte-identical',()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.34');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20518-recovery-guard.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.34'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.34'));
 assert.ok(sw.includes('recovery-guard-20.5.18'));
 assert.ok(!html.includes('createRallyTransactionPilot('));
 assert.ok(read('src/vc2055-entry.ts').includes('classifyRecoveryEvidence'));
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
 for(const file of ['src/domain/rally-recovery-evidence.ts','src/domain/rally-transaction-pilot.ts']){
  const src=read(file);
  for(const forbidden of ['scoutSave(', 'localStorage', 'indexedDB', 'supabase',
   'window.', 'document.', 'getSnapshot(', 'v121AwardPoint='])
   assert.equal(src.includes(forbidden),false,`${file}: ${forbidden}`);
 }
});
