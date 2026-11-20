'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const path=require('node:path');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');
const coreFile='233-vc20512-match-state-core.js',adapterFile='234-vc20512-match-state-adapters.js';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const hash=value=>crypto.createHash('sha256').update(value.trimEnd()).digest('hex');

test('V20.5.12 extracts the canonical scripts byte-for-byte, without changing their legacy logic',()=>{
 assert.equal(hash(read(coreFile)),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash(read(adapterFile)),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
 assert.ok(read(coreFile).startsWith('(()=>{'));
 assert.ok(read(adapterFile).includes('State.commands=Object.assign'));
});

test('classic scripts load synchronously in original source order before the rest of Scouting',()=>{
 const html=read('index.html');
 const core=`<script id="v130-match-state-core" src="./${coreFile}?v=20.5.12" data-vc-module="true"></script>`;
 const adapters=`<script id="v131-match-state-adapters" src="./${adapterFile}?v=20.5.12" data-vc-module="true"></script>`;
 assert.ok(html.includes(core));assert.ok(html.includes(adapters));
 const a=html.indexOf(core),b=html.indexOf(adapters),c=html.indexOf('id="v132-scouting-pro-workspace"');
 assert.ok(a>0&&a<b&&b<c);
 assert.equal(html.includes('<script id="v130-match-state-core">'),false);
 assert.equal(html.includes('<script id="v131-match-state-adapters">'),false);
 assert.ok(html.indexOf('id="v130-match-state-style"')<a);
 assert.ok(html.indexOf('id="v131-match-state-adapters-style"')>a);
 assert.ok(html.indexOf('id="v131-match-state-adapters-style"')<b);
});

function nativeHarness(){
 const listeners=[],events=[],calls={point:0,undo:0,sync:0};
 const state={id:42,status:'live',currentSet:1,rotationNo:1,opponentRotationNo:2,
  servingTeam:'ours',sets:[{number:1,scoreUs:0,scoreOpponent:0,rallies:[]}],liveRally:{actions:[]}};
 const classList={add(){},remove(){},toggle(){},contains(){return false}};
 const document={readyState:'loading',body:{classList},
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  addEventListener:(topic,fn)=>listeners.push({topic,fn}),dispatchEvent:e=>{events.push(e.type);return true;}};
 const window={
  v121AwardPoint:winner=>{calls.point++;const set=state.sets[0];
   if(winner==='ours')set.scoreUs++;else set.scoreOpponent++;
   set.rallies.push({winner});return winner;},
  v121UndoRally:()=>{calls.undo++;const set=state.sets[0];const rally=set.rallies.pop();
   if(rally?.winner==='ours')set.scoreUs--;else if(rally?.winner==='opponent')set.scoreOpponent--;return rally;}
 };
 const EventCtor=class extends Event{constructor(name,options){super(name);this.detail=options?.detail}};
 const context={window,document,EventTarget,CustomEvent:EventCtor,
  scoutingMatches:[state],scoutActive:()=>state,scoutSet:()=>state.sets[0],
  scoutSetsScore:()=>({us:0,opponent:0}),scoutActionCount:()=>0,
  requestAnimationFrame:()=>0,setTimeout:()=>0,queueMicrotask:()=>{},
  console:{error(){},warn(){}},alert:()=>{},Date,Number,Promise};
 vm.runInNewContext(read(coreFile),context,{timeout:2000});
 const canonical=window.MatchState;
 vm.runInNewContext(read(adapterFile),context,{timeout:2000});
 return {state,canonical,window,document,events,calls,listeners};
}

test('extracted V13 publisher still exposes the same canonical model and read-only guards',()=>{
 const {state,canonical,window}=nativeHarness();
 assert.strictEqual(window.VC_MATCH_STATE,canonical);
 assert.equal(canonical.schema,'vc.match-state/13.1');
 assert.strictEqual(canonical.getActive(),state);
 assert.equal(canonical.getSet(state).number,1);
 assert.equal(canonical.getSnapshot().score.us,0);
 assert.equal(canonical.isReadonly(state),false);
 assert.equal(typeof canonical.subscribe,'function');
 assert.equal(typeof canonical.mutate,'function');
 assert.equal(typeof canonical.select,'function');
 state.status='finished';
 assert.equal(canonical.isReadonly(state),true);
});

test('point and undo commands invoke original handlers once, then synchronize; finished match blocks writes',async()=>{
 const {state,canonical,window,events,calls}=nativeHarness();
 const received=[];const stop=canonical.subscribe(detail=>received.push(detail.reason));
 assert.equal(await window.v121AwardPoint('ours'),'ours');
 assert.equal(state.sets[0].scoreUs,1);assert.equal(calls.point,1);
 assert.equal(canonical.revision,1);assert.ok(received.includes('v13.1:score:point'));
 assert.equal((await window.v121UndoRally()).winner,'ours','underlying undo return is preserved');
 assert.equal(state.sets[0].scoreUs,0);assert.equal(calls.undo,1);
 assert.equal(canonical.revision,2);assert.ok(received.includes('v13.1:score:undo'));
 assert.ok(events.includes('vc:matchstatechange'));
 state.status='finished';
 await assert.rejects(()=>window.v121AwardPoint('ours'),/solo lectura/);
 assert.equal(calls.point,1);
 assert.equal(state.sets[0].scoreUs,0);
 stop();
});

test('readCanonicalMatch centralizes legacy fallbacks without copying or writing original data',async()=>{
 const {readCanonicalMatch,canonicalReaders}=await compiled();
 const match={currentSet:3,sets:[{number:3,scoreUs:0}]};
 let reads=0,deepSnapshots=0;
 const window={MatchState:{getActive(){reads++;throw Error('old reader offline')},getSnapshot(){deepSnapshots++;throw Error('clone')}},
  VC_MATCH_STATE:{getActive:()=>null},VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>match}};
 assert.strictEqual(readCanonicalMatch(window),match);
 assert.equal(canonicalReaders(window).length,4);
 assert.equal(reads,1);assert.equal(deepSnapshots,0);
 assert.equal(readCanonicalMatch({MatchState:{getActive:()=>null}}),null);
 assert.equal(match.sets[0].scoreUs,0);
});

test('all TypeScript scouting consumers use the single safe match-reader contract',()=>{
 for(const file of [
  'src/domain/runtime.ts','src/domain/committed-runtime.ts',
  'src/state/live-statistics-runtime.ts','src/state/player-boxscore-runtime.ts'
 ])assert.ok(read(file).includes('readCanonicalMatch('),file);
 assert.ok(read('src/state/match-observable.ts').includes('canonicalReaders(win)'));
 const contract=read('src/state/match-state-contract.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState=', 'getSnapshot('])
  assert.equal(contract.includes(forbidden),false,forbidden);
});

test('V20.5.12 source, SW, Vite and native script distribution reference the exact external files',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),pkg=require('./package.json');
 assert.equal(pkg.version,'20.5.48');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20512-scouting-consolidation.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.48'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.48'));
 assert.ok(sw.includes('scout-core-extraction-20.5.12'));
 assert.ok(sw.includes("'./233-vc20512-match-state-core.js'"));
 assert.ok(sw.includes("'./234-vc20512-match-state-adapters.js'"));
 const built=read('dist/index.html');
 assert.ok(built.includes(`${coreFile}?v=20.5.12`));
 assert.ok(built.includes(`${adapterFile}?v=20.5.12`));
 for(const file of [coreFile,adapterFile])assert.ok(fs.existsSync(path.join(root,'dist',file)));
});
