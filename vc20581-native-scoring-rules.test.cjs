'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const lines=source.split('\n');
const exact=(marker,guard='')=>lines.find(line=>line.startsWith(marker)&&line.includes(guard));
const compiled=()=>import('./vc2055-domain-core.mjs');
const POS=['p1','p2','p3','p4','p5','p6'];
const slots=(start=1)=>Object.fromEntries(POS.map((p,i)=>[p,start+i]));
const clone=v=>structuredClone(v);
const equalJson=(left,right)=>assert.equal(JSON.stringify(left),JSON.stringify(right));
const rules=[exact('function scoutSetTarget('),exact('function scoutSetHasWinner('),
 exact('function scoutSetsScore('),exact('function scoutRotateTeamLineup('),
 exact('function vcRotateBase(')].join('\n');

function ruleHarness(bridge){
 const window={};if(bridge)window.VC_NATIVE_SCORE_RULES_20581=bridge;
 const ctx={window,SCOUT_POS:POS,scoutArr:x=>Array.isArray(x)?x:[],
  scoutNormalizeLineup:clone,vcEnsureProMatch:()=>{},vcPlayerRole:n=>`role:${n}`,
  Number,Math,Object,Array};
 vm.runInNewContext(rules,ctx,{timeout:1200});
 return vm.runInNewContext('({scoutSetTarget,scoutSetHasWinner,scoutSetsScore,scoutRotateTeamLineup,vcRotateBase})',ctx);
}

function matchFixture(setNo=1,us=24,opponent=23,serving='opponent',previous=[]){
 const ours=slots(),rival=slots(11);
 return {id:99,status:'live',currentSet:setNo,servingTeam:serving,
  rotationNo:1,opponentRotationNo:2,
  lineup:{ours:clone(ours),opponent:clone(rival)},
  baseLineup:{ours:clone(ours),opponent:clone(rival)},
  lineupRoles:{ours:slots(30),opponent:slots(40)},
  libero:{auto:false,enabled:true,mode:'single',playerId:99,
   activePlayerId:99,activeForId:6,activePosition:'p6'},
  sets:[...previous,{number:setNo,scoreUs:us,scoreOpponent:opponent,finished:false,rallies:[]}],
  liveRally:{id:91,actions:[{code:'PRIVATE-CODE',skill:'A',videoTime:22.3}],
   startedAt:'2026-01-01',scoutStartMs:0}
 };
}

function nativeHarness(match,bridge){
 const window={};if(bridge)window.VC_NATIVE_SCORE_RULES_20581=bridge;
 const saves=[],competition=[];
 const set=match.sets.find(s=>s.number===match.currentSet);
 const snapshot=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:clone(match.lineup),
  scoreBefore:{us:set.scoreUs,opponent:set.scoreOpponent}});
 const ctx={window,SCOUT_POS:POS,VC_BACK_POS:['p1','p5','p6'],
  scoutActive:()=>match,scoutSet:()=>set,
  scoutArr:v=>Array.isArray(v)?v:[],vcEnsureProMatch:()=>{},
  vcPlayerRole:()=> 'Central',scoutNormalizeLineup:clone,
  scoutNormalizeLibero:clone,scoutNormalizeRoles:clone,
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=snapshot()},
  scoutCurrentRallySnapshot:snapshot,scoutClone:clone,
  scoutResetLiveRally:()=>{match.liveRally={id:92,actions:[],startSnapshot:null}},
  scoutSave:()=>saves.push('native-write'),scoutNow:()=>new Date(0).toISOString(),
  scoutElapsed:()=>2500,scoutSyncCompetition:()=>competition.push('competition'),
  vcAutoLiberoTarget:()=>null,vcLiberoRalliesCompleted:()=>0,
  vcRecordLiberoTransition:()=>{},Date,Math,Number,Object,Array};
 const nativeCore=[
  exact('function scoutSetTarget('),exact('function scoutSetHasWinner('),
  exact('function scoutSetsScore('),exact('function scoutRotateTeamLineup('),
  source.slice(source.indexOf(' function vcApplyAutoLibero(m,record=false){'),source.indexOf('function vcRotateBase(m,dir=1)')),
  exact('function vcRotateBase('),
  exact('window.scoutAwardPoint=function(winner){','vcApplyAutoLibero'),
  exact('window.scoutUndoRally=function(){','scoutNormalizeRoles')
 ].join('\n');
 vm.runInNewContext(nativeCore,ctx,{timeout:1200});
 return {window,saves,competition};
}

test('V20.5.81 frozen bridge exports only pure rules; Vite installs it once',async()=>{
 const mod=await compiled(),host={},bridge=mod.installNativeScoreRules(host);
 assert.equal(bridge.VERSION,'20.5.81');assert.equal(bridge.nativeOnly,true);
 assert.equal(bridge.singleNativeWriter,true);assert.ok(Object.isFrozen(bridge));
 assert.equal(host.VC_NATIVE_SCORE_RULES_20581,bridge);
 assert.equal(mod.installNativeScoreRules(host),bridge);
 for(const method of ['target','hasWinner','countWonSets','rotateValues'])
  assert.equal(typeof bridge[method],'function');
 const typed=read('src/domain/scout-native-score-rules.ts')+
  read('src/domain/scout-native-score-rules-runtime.ts');
 for(const forbidden of ['scoutSave(', 'localStorage','indexedDB',
  'supabase','fetch(','.scoreUs++','.scoreOpponent++','.rallies.push('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('15/25 target and two-point margin match native under 1000 score cases',async()=>{
 const mod=await compiled(),fallback=ruleHarness();
 for(const number of [1,2,3,4,5,6,'5',null,undefined]){
  assert.equal(mod.nativeSetTarget(number),fallback.scoutSetTarget(number));
  for(let us=0;us<=35;us+=2)for(let opponent=0;opponent<=35;opponent+=2){
   const set={number,scoreUs:us,scoreOpponent:opponent};
   assert.equal(mod.nativeSetHasWinner(set),fallback.scoutSetHasWinner(set),JSON.stringify(set));
  }
 }
 assert.equal(mod.nativeSetHasWinner({number:5,scoreUs:15,scoreOpponent:14}),false);
 assert.equal(mod.nativeSetHasWinner({number:5,scoreUs:16,scoreOpponent:14}),true);
 assert.equal(mod.nativeSetHasWinner({number:1,scoreUs:25,scoreOpponent:24}),false);
 assert.equal(mod.nativeSetHasWinner({number:1,scoreUs:26,scoreOpponent:24}),true);
});

test('finished-set count matches native, excluding incomplete and undecided records',async()=>{
 const mod=await compiled(),fallback=ruleHarness();
 for(let size=0;size<30;size++){
  const sets=Array.from({length:size},(_,i)=>({number:i+1,
   finished:i%3!==0,winner:i%5===0?null:i%2?'opponent':'ours'}));
  const match={sets};
  equalJson(mod.nativeCountWonSets(match),fallback.scoutSetsScore(match));
 }
 equalJson(mod.nativeCountWonSets(null),{us:0,opponent:0});
});

test('directional rotation is identical to native, immutable and preserves identity',async()=>{
 const mod=await compiled(),native=ruleHarness();
 for(const direction of [1,-1,0,4,-4,'1','-1']){
  const input={ours:slots(),opponent:slots(11)},before=clone(input);
  const rotated=mod.nativeRotateValues(POS.map(p=>input.ours[p]),direction);
  assert.ok(Object.isFrozen(rotated));equalJson(input,before);
  const output=native.scoutRotateTeamLineup(input,'ours',direction);
  equalJson(Object.fromEntries(POS.map((p,i)=>[p,rotated[i]])),output.ours);
  equalJson(input,before);
 }
});

test('the actual native helper functions call TypeScript when valid and keep parity',async()=>{
 const mod=await compiled(),base=mod.installNativeScoreRules({});
 const hits={target:0,hasWinner:0,countWonSets:0,rotateValues:0};
 const bridge={...base};
 for(const name of Object.keys(hits)){
  const original=base[name];
  bridge[name]=(...args)=>{hits[name]++;return original(...args)};
 }
 const native=ruleHarness(bridge),match={sets:[{finished:true,winner:'ours'}]};
 assert.equal(native.scoutSetTarget(5),15);
 assert.equal(native.scoutSetHasWinner({number:1,scoreUs:25,scoreOpponent:23}),true);
 equalJson(native.scoutSetsScore(match),{us:1,opponent:0});
 native.scoutRotateTeamLineup({ours:slots(),opponent:slots(11)},'opponent',1);
 const rotated={baseLineup:{ours:slots()},lineupRoles:{ours:{}}};
 native.vcRotateBase(rotated,1);
 for(const name of Object.keys(hits))assert.ok(hits[name]>0,name);
});

test('mismatched rule results are rejected in favor of the original scorer',async()=>{
 const mod=await compiled(),base=mod.installNativeScoreRules({});
 const old=ruleHarness(),bad=ruleHarness({...base,
  target:()=>15,hasWinner:()=>false,
  countWonSets:()=>({us:99,opponent:99}),rotateValues:()=>[0,0,0,0,0,0]});
 for(const n of [1,3,5])assert.equal(bad.scoutSetTarget(n),old.scoutSetTarget(n));
 for(const s of [{number:1,scoreUs:25,scoreOpponent:23},
  {number:5,scoreUs:15,scoreOpponent:14},
  {number:5,scoreUs:16,scoreOpponent:14}])
  assert.equal(bad.scoutSetHasWinner(s),old.scoutSetHasWinner(s));
 equalJson(bad.scoutSetsScore({sets:[{finished:true,winner:'ours'}]}),
  old.scoutSetsScore({sets:[{finished:true,winner:'ours'}]}));
 const lineup={ours:slots(),opponent:slots(11)};
 equalJson(bad.scoutRotateTeamLineup(lineup,'opponent',1),
  old.scoutRotateTeamLineup(lineup,'opponent',1));
 const a={baseLineup:{ours:slots()},lineupRoles:{ours:{}}},b=clone(a);
 bad.vcRotateBase(a,-1);old.vcRotateBase(b,-1);equalJson(a,b);
});

test('bridge failure before any mutation falls back to the exact old rules',async()=>{
 const mod=await compiled(),base=mod.installNativeScoreRules({});
 const broken=ruleHarness({...base,target:()=>{throw Error('x')},
  hasWinner:()=>{throw Error('x')},countWonSets:()=>{throw Error('x')},
  rotateValues:()=>{throw Error('x')}}),old=ruleHarness();
 assert.equal(broken.scoutSetTarget(5),old.scoutSetTarget(5));
 assert.equal(broken.scoutSetHasWinner({number:1,scoreUs:25,scoreOpponent:23}),true);
 equalJson(broken.scoutSetsScore({sets:[{finished:true,winner:'ours'}]}),
  old.scoutSetsScore({sets:[{finished:true,winner:'ours'}]}));
 equalJson(broken.scoutRotateTeamLineup({ours:slots(),opponent:slots(11)}),
  old.scoutRotateTeamLineup({ours:slots(),opponent:slots(11)}));
});

test('actual native point closure uses typed set and rotation rules without a second writer',async()=>{
 const mod=await compiled(),base=mod.installNativeScoreRules({});
 const hits={hasWinner:0,countWonSets:0,rotateValues:0};
 const bridge={...base};
 for(const name of Object.keys(hits)){
  const original=base[name];bridge[name]=(...args)=>{hits[name]++;return original(...args)};
 }
 const match=matchFixture(1,24,23),native=nativeHarness(match,bridge);
 native.window.scoutAwardPoint('ours');
 const set=match.sets.at(-1);
 assert.equal(set.scoreUs,25);assert.equal(set.scoreOpponent,23);
 assert.equal(set.rallies.length,1);assert.equal(set.finished,true);
 assert.equal(set.winner,'ours');assert.equal(match.rotationNo,6);
 assert.equal(native.saves.length,1,'the historic scorer alone saves the point');
 for(const name of Object.keys(hits))assert.ok(hits[name]>0,name);
 native.window.scoutUndoRally();
 assert.equal(set.scoreUs,24);assert.equal(set.scoreOpponent,23);
 assert.equal(set.rallies.length,0);assert.equal(set.finished,false);
 assert.equal(native.saves.length,2,'the historic undo alone saves the restoration');
});

test('typed native and fallback native produce identical match state across set boundaries',async()=>{
 const mod=await compiled(),bridge=mod.installNativeScoreRules({});
 const scenarios=[
  [1,24,23,'ours','opponent'],[1,24,24,'ours','opponent'],
  [1,25,25,'ours','opponent'],[1,24,25,'opponent','ours'],
  [5,14,13,'ours','opponent'],[5,14,14,'opponent','ours'],
  [5,16,16,'opponent','ours']
 ];
 for(const [no,us,opp,winner,serve] of scenarios){
  const plain=matchFixture(no,us,opp,serve),typed=clone(plain);
  const old=nativeHarness(plain),current=nativeHarness(typed,bridge);
  old.window.scoutAwardPoint(winner);current.window.scoutAwardPoint(winner);
  equalJson(typed,plain);equalJson(current.saves,old.saves);
  old.window.scoutUndoRally();current.window.scoutUndoRally();
  equalJson(typed,plain);equalJson(current.saves,old.saves);
 }
});

test('third won set still finalizes match and invokes only the old competition writer',async()=>{
 const mod=await compiled(),bridge=mod.installNativeScoreRules({});
 const history=[{number:1,finished:true,winner:'ours'},
  {number:2,finished:true,winner:'ours'}];
 const match=matchFixture(3,24,23,'opponent',history),native=nativeHarness(match,bridge);
 native.window.scoutAwardPoint('ours');
 assert.equal(match.status,'finished');assert.equal(native.competition.length,1);
 assert.equal(native.saves.length,1);
 native.window.scoutUndoRally();
 assert.equal(match.status,'live');assert.equal(native.competition.length,1);
 assert.equal(native.saves.length,2);
});

test('published shell, source bridge and service worker are updated without changing V20.5.80 controller',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,require('./scripts/retained-legacy-assets.json').updatedIn);
 assert.ok(pkg.scripts['test:foundation'].includes('vc20581-native-scoring-rules.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.7.0'));
 assert.ok(read('service-worker.js').includes('native-score-rules-20.5.81'));
 assert.ok(read('src/vc2055-entry.ts').includes('installNativeScoreRules(window)'));
 assert.ok(source.includes('VC_RALLY_CONTROLLER_20580'));
});
