'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const Journal=require('./210-vc2011-durable-sync-journal.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const clone=value=>structuredClone(value);
const match=()=>({
 id:12345,status:'live',currentSet:1,servingTeam:'ours',rotationNo:1,opponentRotationNo:2,
 lineup:{ours:{p1:1},opponent:{p1:11}},
 baseLineup:{ours:{p1:1},opponent:{p1:11}},lineupRoles:{},libero:{},
 sets:[{number:1,scoreUs:8,scoreOpponent:7,rallies:[],finished:false}],
 liveRally:{id:89,actions:[{code:'PRIVATE-SCOUT-CODE'}],liveVideoSessionId:'PRIVATE-VIDEO'}
});
const state=items=>({equiposData:{cadete:{scoutingMatches:items}}});
const entry=items=>({id:'PRIVATE-BATCH',accountId:'club-test',mode:'draft',status:'pending',
 stateJson:JSON.stringify(state(items))});
const journal=(row,info={pendingCount:1,hasOtherAccounts:false,lastError:null})=>{
 const calls=[];
 return {calls,async inspect(account){calls.push(['inspect',account]);return info;},
  async newest(account){calls.push(['newest',account]);return row;}};
};
const request=(j,before,after)=>({journal:j,accountId:'club-test',teamId:'cadete',
 matchId:12345,before,after});

test('existing pending journal checkpoint matches the pre-failure match without claiming success',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before);
 after.sets[0].scoreUs++;
 const j=journal(entry([before])),r=await inspectJournalRecovery(request(j,before,after));
 assert.equal(r.status,'checkpoint-before');
 assert.equal(r.pendingCount,1);
 assert.equal(r.autoResumeAllowed,false);
 assert.equal(r.requiresManualReview,true);
 assert.deepEqual(j.calls,[['inspect','club-test'],['newest','club-test']]);
 assert.equal(Object.isFrozen(r),true);
});

test('checkpoint-after means a pending copy exists, not that CAS has acknowledged it',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before);
 after.sets[0].scoreUs++;
 const r=await inspectJournalRecovery(request(journal(entry([after])),before,after));
 assert.equal(r.status,'checkpoint-after');
 assert.equal(r.source,'existing-v2011-pending-checkpoint');
 assert.equal(r.autoResumeAllowed,false);
});

test('divergent checkpoint is never applied or silently called recovered',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before),different=clone(before);
 after.sets[0].scoreUs++;different.sets[0].scoreOpponent+=3;
 const r=await inspectJournalRecovery(request(journal(entry([different])),before,after));
 assert.equal(r.status,'checkpoint-divergent');
 assert.equal(r.requiresManualReview,true);
});

test('unchanged observations do not prove that a remote client received a rally',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match();
 const r=await inspectJournalRecovery(request(journal(entry([before])),before,clone(before)));
 assert.equal(r.status,'checkpoint-unchanged');
 assert.equal(r.autoResumeAllowed,false);
});

test('no pending checkpoint short-circuits the journal without a second read',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),j=journal(null,{pendingCount:0});
 const r=await inspectJournalRecovery(request(j,before,before));
 assert.equal(r.status,'no-checkpoint');
 assert.deepEqual(j.calls,[['inspect','club-test']]);
});

test('multiple pending batches or another account forbid certainty about order',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before);
 after.sets[0].scoreUs++;
 for(const info of [{pendingCount:2},{pendingCount:1,hasOtherAccounts:true},
  {pendingCount:1,lastError:'PRIVATE-READ-ERROR'}]){
  const j=journal(entry([after]),info);
  const r=await inspectJournalRecovery(request(j,before,after));
  assert.equal(r.status,'ambiguous');
  assert.equal(j.calls.length,1,'an ambiguous journal is never probed further');
 }
});

test('missing, duplicate and incorrect match identities never match another scouting',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before);
 after.sets[0].scoreUs++;
 for(const candidates of [[],[{...before,id:3456}],[before,clone(before)]]){
  const r=await inspectJournalRecovery(request(journal(entry(candidates)),before,after));
  assert.equal(r.status,candidates.length===2?'ambiguous':'missing-match');
 }
});

test('malformed JSON, invalid account, missing state and unreadable browser journal fail closed',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match();
 const cases=[
  journal({...entry([before]),stateJson:'{invalid'}),
  journal({...entry([before]),accountId:'other-account'}),
  journal({...entry([before]),mode:'not-a-journal-record'}),
  {inspect:async()=>{throw new Error('PRIVATE-DISK');},newest:async()=>null},
  {inspect:async()=>({pendingCount:1}),newest:async()=>{throw Error('PRIVATE-IDB-FAILURE')}}
 ];
 for(const j of cases)assert.equal((await inspectJournalRecovery(request(j,before,before))).status,'unavailable');
 assert.equal((await inspectJournalRecovery({...request(journal(entry([before])),before,before),accountId:''})).status,'unavailable');
});

test('a missing match ID or wrong team cannot borrow another club checkpoint',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match();
 const j=journal(entry([before]));
 assert.equal((await inspectJournalRecovery({...request(j,before,before),matchId:99})).status,'missing-match');
 assert.equal((await inspectJournalRecovery({...request(j,before,before),teamId:'infantil'})).status,'missing-match');
});

test('inspector reports contain no codes, players, account IDs, checkpoint IDs or video identifiers',async()=>{
 const {inspectJournalRecovery}=await compiled(),before=match(),after=clone(before);
 after.sets[0].scoreUs++;
 const report=await inspectJournalRecovery(request(journal(entry([after])),before,after));
 for(const forbidden of ['PRIVATE','club-test','cadete','12345','89'])
  assert.equal(JSON.stringify(report).includes(forbidden),false,forbidden);
});

test('original createBrowserJournal IndexedDB path survives a simulated window restart',async()=>{
 const {inspectJournalRecovery}=await compiled(),disk=new Map();
 // A small IndexedDB event shim: exercises V20.1.1 open/getAll/put and a fresh window.
 // This is NOT a claim that a real Chromium or physical power loss was tested.
 const indexedDB={
  open(){
   const request={};
   queueMicrotask(()=>{
    const db={
     objectStoreNames:{contains:name=>disk.has(name)},
     createObjectStore(name){disk.set(name,new Map());},
     transaction(name){
      const tx={};
      tx.objectStore=()=>{
       const items=disk.get(name);
       return {
        put(row){items.set(row.id,clone(row));queueMicrotask(()=>tx.oncomplete?.());return {result:row.id};},
        delete(id){items.delete(id);queueMicrotask(()=>tx.oncomplete?.());},
        getAll(){const req={};queueMicrotask(()=>{req.result=[...items.values()].map(clone);req.onsuccess?.();});return req;}
       };
      };
      return tx;
     }
    };
    request.result=db;
    if(!disk.has('checkpoints'))request.onupgradeneeded?.();
    request.onsuccess?.();
   });
   return request;
  }
 };
 const win=()=>({indexedDB,dispatchEvent(){},CustomEvent:class{},setTimeout(){},clearTimeout(){}});
 const before=match(),after=clone(before);after.sets[0].scoreUs++;
 const first=Journal.createBrowserJournal(win());
 await first.prepare({accountId:'club-test',revision:3,mode:'draft',state:state([before])});
 const second=Journal.createBrowserJournal(win());
 assert.equal((await second.inspect('club-test')).pendingCount,1);
 const result=await inspectJournalRecovery(request(second,before,after));
 assert.equal(result.status,'checkpoint-before');
 await assert.rejects(()=>second.guardCleanPull('club-test',false),error=>error.code==='VC2011_ORPHAN');
});

test('V20.5.19 is strictly read-only and keeps the original IndexedDB/CAS files',()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.67');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20519-journal-recovery.test.cjs'));
 assert.ok(pkg.scripts['test:browser-recovery']);
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.67'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.67'));
 assert.ok(sw.includes('journal-inspector-20.5.19'));
 assert.ok(!html.includes('inspectJournalRecovery('));
 assert.ok(read('src/vc2055-entry.ts').includes('inspectJournalRecovery'));
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
 for(const source of ['src/domain/journal-recovery-inspector.ts','src/domain/rally-recovery-evidence.ts']){
  const body=read(source);
  for(const forbidden of ['scoutSave(', 'localStorage', '.put(', '.delete(', 'removeMany(', '.acknowledge(',
   'window.', 'document.', 'getSnapshot(', 'v121AwardPoint='])
   assert.equal(body.includes(forbidden),false,`${source}: ${forbidden}`);
 }
});
