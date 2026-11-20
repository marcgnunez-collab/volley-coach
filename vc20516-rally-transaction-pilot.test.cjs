'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const POS=['p1','p2','p3','p4','p5','p6'];
const lineup=()=>({ours:Object.fromEntries(POS.map((p,i)=>[p,i+1])),
 opponent:Object.fromEntries(POS.map((p,i)=>[p,i+11]))});
const fixture=()=>({id:'PRIVATE-MATCH',status:'live',currentSet:1,servingTeam:'opponent',rotationNo:1,opponentRotationNo:3,
 lineup:lineup(),sets:[{number:1,scoreUs:0,scoreOpponent:0,finished:false,rallies:[]}],
 liveRally:{id:'PRIVATE-LIVE',actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}],startSnapshot:null}});
function portFor(match){
 let points=0,undos=0,id=0;
 const pointResult=Object.freeze({native:true,operation:'point'}),undoResult=Object.freeze({native:true,operation:'undo'});
 return {readCurrent:()=>match,
  async awardPoint(winner){
   points++;
   const set=match.sets[0];
   const before={us:set.scoreUs,opponent:set.scoreOpponent};
   const r={id:'PRIVATE-RALLY-'+(++id),winner,servingBefore:match.servingTeam,
    rotationBefore:match.rotationNo,opponentRotationBefore:match.opponentRotationNo,
    scoreBefore:before,scoreAfter:{us:before.us+(winner==='ours'?1:0),opponent:before.opponent+(winner==='opponent'?1:0)},
    lineupBefore:structuredClone(match.lineup),actions:structuredClone(match.liveRally.actions)};
   set.rallies.push(r);set.scoreUs=r.scoreAfter.us;set.scoreOpponent=r.scoreAfter.opponent;
   if(match.servingTeam!==winner){
    if(winner==='ours')match.rotationNo=match.rotationNo===1?6:match.rotationNo-1;
    else match.opponentRotationNo=match.opponentRotationNo===1?6:match.opponentRotationNo-1;
   }
   match.servingTeam=winner;match.liveRally={id:'next-live-'+id,actions:[],startSnapshot:null};
   return pointResult;
  },
  async undoRally(){
   undos++;
   const set=match.sets[0],r=set.rallies.pop();
   set.scoreUs=r.scoreBefore.us;set.scoreOpponent=r.scoreBefore.opponent;
   match.servingTeam=r.servingBefore;match.rotationNo=r.rotationBefore;match.opponentRotationNo=r.opponentRotationBefore;
   match.liveRally={id:r.id,actions:r.actions};match.lineup=structuredClone(r.lineupBefore);
   return undoResult;
  },
  counts:()=>({points,undos}),pointResult,undoResult};
}

test('opt-in coordinator delegates point and undo once and returns the exact native results',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture(),port=portFor(match);
 const original=JSON.stringify(match),pilot=createRallyTransactionPilot(port);
 assert.equal(pilot.installedInLiveUI,false);
 assert.equal(JSON.stringify(match),original,'creation does not modify original scoring');
 assert.strictEqual(await pilot.awardPoint('ours'),port.pointResult);
 assert.equal(match.sets[0].scoreUs,1);assert.equal(match.rotationNo,6);
 assert.strictEqual(await pilot.undoRally(),port.undoResult);
 assert.equal(match.sets[0].scoreUs,0);assert.equal(match.rotationNo,1);
 assert.deepEqual(port.counts(),{points:1,undos:1});
 const report=pilot.report();
 assert.equal(report.submitted,2);assert.equal(report.completed,2);
 assert.equal(report.agree,2,JSON.stringify(report));assert.equal(report.difference,0);
 assert.equal(report.installedInLiveUI,false);
 assert.equal(Object.isFrozen(report),true);
 assert.equal(Object.isFrozen(report.recent),true);
 for(const forbidden of ['PRIVATE-MATCH','PRIVATE-CODE','PRIVATE-PLAYER','PRIVATE-RALLY'])
  assert.equal(JSON.stringify(report).includes(forbidden),false);
});

test('native execution stays FIFO with rapid point calls, without merging or losing a point',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture(),port=portFor(match);
 const calls=[],continuations=[];
 const native=port.awardPoint;
 const pilot=createRallyTransactionPilot({...port,awardPoint:winner=>{
  calls.push(winner);
  return new Promise(resolve=>continuations.push(async()=>resolve(await native(winner))));
 }});
 const first=pilot.awardPoint('ours'),second=pilot.awardPoint('opponent');
 await Promise.resolve();await Promise.resolve();
 assert.deepEqual(calls,['ours']);assert.equal(pilot.report().pending,2);
 await continuations.shift()();await first;
 await Promise.resolve();await Promise.resolve();
 assert.deepEqual(calls,['ours','opponent']);
 await continuations.shift()();await second;
 assert.deepEqual(port.counts(),{points:2,undos:0});
 assert.equal(match.sets[0].scoreUs,1);assert.equal(match.sets[0].scoreOpponent,1);
 assert.equal(pilot.report().pending,0);
});

test('a native CAS conflict is propagated unchanged, not retried, and later operations can continue',async()=>{
 const {createRallyTransactionPilot}=await compiled();
 const cloud={revision:0},a=fixture(),b=fixture();
 let callsA=0,callsB=0;
 const write=(match,localRev,callback)=>async()=>{
  callback();if(localRev!==cloud.revision)throw new Error('CAS-conflict');
  cloud.revision++;
  match.sets[0].scoreUs++;
  return true;
 };
 const pilotA=createRallyTransactionPilot({readCurrent:()=>a,awardPoint:write(a,0,()=>callsA++),undoRally:()=>false});
 const pilotB=createRallyTransactionPilot({readCurrent:()=>b,awardPoint:write(b,0,()=>callsB++),undoRally:()=>false});
 assert.equal(await pilotA.awardPoint('ours'),true);
 await assert.rejects(()=>pilotB.awardPoint('ours'),/CAS-conflict/);
 assert.equal(cloud.revision,1);
 assert.equal(callsA,1);assert.equal(callsB,1,'the failed CAS write is never retried');
 assert.equal(pilotB.report().nativeRejected,1);
 assert.equal(await pilotB.undoRally(),false,'the FIFO survives a rejection');
 assert.equal(pilotB.report().nativeDeclined,1);
});

test('a missing or invalid typed projection never blocks the existing native command',async()=>{
 const {createRallyTransactionPilot}=await compiled();
 let calls=0;
 const pilot=createRallyTransactionPilot({readCurrent(){throw Error('reader unavailable')},
  awardPoint(){calls++;return 'native-success'},undoRally(){calls++;return false}});
 assert.equal(await pilot.awardPoint('ours'),'native-success');
 assert.equal(pilot.report().unverified,1);
 assert.equal(await pilot.undoRally(),false);
 assert.equal(pilot.report().nativeDeclined,1);
 assert.equal(calls,2);
});

test('a finished match still relies on native readonly enforcement and cannot trigger retries',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();match.status='finished';
 const error=new Error('Este scouting está finalizado y es solo lectura.');
 let calls=0;
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,
  awardPoint(){calls++;throw error},undoRally(){calls++;throw error}});
 await assert.rejects(()=>pilot.awardPoint('ours'),err=>err===error);
 await assert.rejects(()=>pilot.undoRally(),err=>err===error);
 assert.equal(calls,2);assert.equal(pilot.report().nativeRejected,2);
 assert.equal(match.sets[0].scoreUs,0);
});

test('disable blocks new pilot commands without undoing or aborting a native command in progress',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture(),native=portFor(match);
 let release;
 const pilot=createRallyTransactionPilot({...native,
  awardPoint:winner=>new Promise(resolve=>{release=()=>native.awardPoint(winner).then(resolve)})});
 const running=pilot.awardPoint('ours');await Promise.resolve();await Promise.resolve();
 pilot.disable();
 await assert.rejects(()=>pilot.awardPoint('ours'),/desactivado/);
 await release();await running;
 assert.equal(native.counts().points,1);
 assert.equal(pilot.report().completed,1);
});

test('pilot retains only a bounded, anonymous record of discrepancies',async()=>{
 const {createRallyTransactionPilot}=await compiled(),match=fixture();
 const pilot=createRallyTransactionPilot({readCurrent:()=>match,awardPoint:()=>false,undoRally:()=>false});
 for(let index=0;index<53;index++)await pilot.awardPoint('ours');
 assert.equal(pilot.report().nativeDeclined,53);
 assert.equal(pilot.report().recent.length,40);
 assert.equal(JSON.stringify(pilot.report()).includes('PRIVATE'),false);
});

test('source release exports the pilot but never mounts a second production writer',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),pkg=require('./package.json');
 assert.equal(pkg.version,'20.5.44');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20516-rally-transaction-pilot.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.44'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.44'));
 assert.ok(sw.includes('transaction-pilot-20.5.16'));
 const module=read('src/domain/rally-transaction-pilot.ts');
 const entry=read('src/vc2055-entry.ts');
 assert.ok(entry.includes("export {createRallyTransactionPilot}"));
 assert.equal(entry.includes('createRallyTransactionPilot(window)'),false);
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase',
  'cloudClient.', 'window.', 'document.', 'getSnapshot(', 'v121AwardPoint='])
  assert.equal(module.includes(forbidden),false,forbidden);
});
