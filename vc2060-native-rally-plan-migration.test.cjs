'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const json=value=>JSON.parse(JSON.stringify(value));
const clone=structuredClone;
const POS=['p1','p2','p3','p4','p5','p6'];
const lineup=(start=1)=>Object.fromEntries(POS.map((p,i)=>[p,start+i]));

const helperStart=source.indexOf('/* V20.5.57 · Typed rally record parity');
const helperEnd=source.indexOf('const vcSubRefreshBase=',helperStart);
const pointMarker=source.indexOf('// Cierre de rally: corregimos');
const pointStart=source.indexOf('window.scoutAwardPoint=function(winner){',pointMarker);
const pointEnd=source.indexOf('\n};',pointStart)+3;
const rotationStart=source.indexOf('function scoutV6107NextRotation(value,dir=1){');
const rotationEnd=source.indexOf('function scoutV6107OpponentHasData(',rotationStart);
const pointSource=source.slice(pointStart,pointEnd);
const helperSource=source.slice(helperStart,helperEnd);
const rotationSource=source.slice(rotationStart,rotationEnd);

function fixture({serving='opponent',rotation=1,score=8,actions=3,number=1}={}){
 return {id:'PRIVATE-MATCH',status:'live',currentSet:number,servingTeam:serving,
  rotationNo:rotation,opponentRotationNo:rotation,
  lineup:{ours:lineup(),opponent:lineup(11)},
  baseLineup:{ours:lineup(),opponent:lineup(11)},
  lineupRoles:{ours:{},opponent:{}},libero:{auto:false},events:[],
  sets:[{number,scoreUs:score,scoreOpponent:score-1,finished:false,rallies:[]}],
  liveRally:{id:'PRIVATE-LIVE',actions:Array.from({length:actions},(_,i)=>({code:'PRIVATE-'+i,
   skill:'A',videoTime:15+i})),startedAt:'2026-11-20',scoutStartMs:9.5,startSnapshot:null}
 };
}

function nativeHarness(match,{plan=null,record=null,scoreRules=null}={}){
 let writes=0;
 const window={};
 if(plan)window.VC_NATIVE_RALLY_PLAN_2060=plan;
 if(record)window.VC_RALLY_RECORDS_20557=record;
 if(scoreRules)window.VC_NATIVE_SCORE_RULES_20581=scoreRules;
 const set=match.sets[0];
 const snapshot=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:clone(match.lineup),
  scoreBefore:{us:set.scoreUs,opponent:set.scoreOpponent}});
 const ctx=vm.createContext({window,Date,Number,Math,Array,Object,structuredClone,
  scoutActive:()=>match,scoutSet:()=>set,scoutClone:clone,
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=snapshot()},
  scoutCurrentRallySnapshot:snapshot,vcEnsureProMatch:()=>{},scoutV6107SyncOpponentLineup:()=>{},
  vcApplyAutoLibero:(m,record)=>{if(record)m.events.push({type:'libero_auto',rallyId:null})},
  vcRotateBase:()=>{},scoutRotateTeamLineup:x=>x,
  scoutArr:x=>Array.isArray(x)?x:[],
  scoutResetLiveRally:()=>{match.liveRally={id:'NEXT',actions:[],startSnapshot:null}},
  scoutSetHasWinner:s=>s.scoreUs>=25&&s.scoreUs-s.scoreOpponent>=2,
  scoutSetsScore:()=>({us:0,opponent:0}),
  scoutNow:()=>new Date(0).toISOString(),scoutElapsed:()=>1500,
  scoutSave:()=>{writes++},scoutNormalizeLineup:clone,
  scoutNormalizeLibero:clone,scoutNormalizeRoles:clone,V6107_VERSION:'6.10.7'});
 vm.runInContext(rotationSource+'\n'+helperSource+'\n'+pointSource,ctx,{timeout:2500});
 return {window,match,get writes(){return writes}};
}

test('V20.6.0 exports pure, frozen plans and a single native-only Vite bridge',async()=>{
 const mod=await compiled(),host={},bridge=mod.installNativeRallyPlan(host);
 assert.equal(bridge.VERSION,'20.6.0');assert.equal(bridge.nativeOnly,true);
 assert.equal(bridge.singleNativeWriter,true);assert.ok(Object.isFrozen(bridge));
 assert.equal(host.VC_NATIVE_RALLY_PLAN_2060,bridge);
 assert.equal(mod.installNativeRallyPlan(host),bridge);
 for(const name of ['nextRotation','point','undo'])assert.equal(typeof bridge[name],'function');
 const typed=read('src/domain/scout-native-rally-plan.ts')+
  read('src/domain/scout-native-rally-plan-runtime.ts');
 for(const forbidden of ['scoutSave(', 'localStorage','indexedDB','supabase','fetch(',
  '.scoreUs++','.scoreOpponent++','.rallies.push(','.rallies.pop('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('rotation labels match native R1 to R6 for both directions and malformed input',async()=>{
 const mod=await compiled();
 for(const value of [null,undefined,0,1,2,3,4,5,6,7,20,-2,'4','bad'])
 for(const dir of [-3,-1,0,1,4]){
  const oldR=Math.min(6,Math.max(1,Number(value)||1));
  const expected=((oldR-1+(dir>=0?-1:1)+6)%6)+1;
  assert.equal(mod.nativeNextRotationNo(value,dir),expected);
 }
});

test('2,000+ point plans exactly represent score, service and both rotation decisions',async()=>{
 const mod=await compiled();let checks=0;
 for(const winner of ['ours','opponent','unexpected'])for(const servingBefore of ['ours','opponent'])
 for(let rotationNo=1;rotationNo<=6;rotationNo++)for(let opponentRotationNo=1;opponentRotationNo<=6;opponentRotationNo++)for(let score=0;score<35;score+=2){
  const before={winner,scoreUs:score,scoreOpponent:score-1,
   servingBefore,rotationNo,opponentRotationNo};
  const old=JSON.stringify(before),plan=mod.planNativePoint(before);
  assert.ok(Object.isFrozen(plan));assert.equal(JSON.stringify(before),old);
  assert.equal(plan.scoreUs,score+(winner==='ours'?1:0));
  assert.equal(plan.scoreOpponent,score-1+(winner==='ours'?0:1));
  assert.equal(plan.rotateOurs,winner==='ours'&&servingBefore==='opponent');
  assert.equal(plan.rotateOpponent,winner!=='ours'&&servingBefore==='ours');
  assert.equal(plan.servingTeam,winner==='ours'?'ours':'opponent');
  if(plan.rotateOurs)assert.equal(plan.rotationNo,mod.nativeNextRotationNo(rotationNo));
  if(plan.rotateOpponent)assert.equal(plan.opponentRotationNo,mod.nativeNextRotationNo(opponentRotationNo));
  checks++;
 }
 assert.ok(checks>=2000);
});

test('undo plans restore exact native snapshot values without changing source',async()=>{
 const mod=await compiled();
 for(const rotationBefore of [0,1,3,6,null])for(const opponentRotationBefore of [0,1,3,6,null]){
  const input={scoreBefore:{us:'17',opponent:16},servingBefore:'ours',
   rotationBefore,opponentRotationBefore};
  const original=JSON.stringify(input),out=mod.planNativeUndo(input);
  assert.equal(out.scoreUs,17);assert.equal(out.scoreOpponent,16);
  assert.equal(out.rotationNo,rotationBefore);
  assert.equal(out.opponentRotationNo,opponentRotationBefore||1);
  assert.equal(out.servingTeam,'ours');assert.ok(Object.isFrozen(out));
  assert.equal(JSON.stringify(input),original);
 }
});

test('actual effective V6.10.7 point writer and native undo use the typed plan',async()=>{
 const mod=await compiled(),base=mod.installNativeRallyPlan({});
 const hits={point:0,undo:0,nextRotation:0},bridge={...base};
 for(const key of Object.keys(hits)){
  const old=base[key];bridge[key]=(...args)=>{hits[key]++;return old(...args)};
 }
 const match=fixture({serving:'opponent',score:24}),native=nativeHarness(match,{plan:bridge});
 native.window.scoutAwardPoint('ours');
 assert.equal(match.sets[0].scoreUs,25);assert.equal(match.sets[0].rallies.length,1);
 assert.equal(native.writes,1);assert.equal(match.rotationNo,6);
 native.window.scoutUndoRally();
 assert.equal(match.sets[0].scoreUs,24);assert.equal(match.sets[0].rallies.length,0);
 assert.equal(native.writes,2);
 for(const key of Object.keys(hits))assert.ok(hits[key]>0,key);
});

test('96 effective writer sequences are byte-equivalent with and without typed plans',async()=>{
 const mod=await compiled(),plan=mod.installNativeRallyPlan({}),
  record=mod.installRallyRecordBridge({}),scoreRules=mod.installNativeScoreRules({});
 let count=0;
 for(const serving of ['ours','opponent'])for(const winner of ['ours','opponent'])
 for(let rotation=1;rotation<=6;rotation++)for(const score of [0,17,24,25]){
  const native=nativeHarness(fixture({serving,rotation,score}));
  const typed=nativeHarness(fixture({serving,rotation,score}),{plan,record,scoreRules});
  native.window.scoutAwardPoint(winner);typed.window.scoutAwardPoint(winner);
  assert.deepEqual(json(typed.match),json(native.match),`point ${serving}/${winner}/R${rotation}/${score}`);
  native.window.scoutUndoRally();typed.window.scoutUndoRally();
  assert.deepEqual(json(typed.match),json(native.match),`undo ${serving}/${winner}/R${rotation}/${score}`);
  assert.equal(native.writes,2);assert.equal(typed.writes,2);
  count++;
 }
 assert.equal(count,96);
});

test('end-to-end typed controller -> real point writer -> real undo saves once each',async()=>{
 const mod=await compiled(),match=fixture({serving:'opponent',score:24}),
  native=nativeHarness(match,{plan:mod.installNativeRallyPlan({}),
   record:mod.installRallyRecordBridge({}),scoreRules:mod.installNativeScoreRules({})});
 const messages=[];
 const controller=mod.createLiveRallyController({
  selectedMatch:()=>match,activeMatch:()=>match,
  selectedSet:m=>m.sets[0],activeSet:m=>m.sets[0],
  score:s=>({us:s.scoreUs,op:s.scoreOpponent}),rallies:s=>s.rallies.length,
  nativePoint:w=>native.window.scoutAwardPoint(w),
  nativeUndo:()=>native.window.scoutUndoRally(),
  status:(message,level)=>messages.push({message,level}),
  refresh:()=>{},scheduleUnlock:callback=>callback(),logError:()=>{}
 });
 assert.equal(controller.awardPoint('ours'),true);
 assert.equal(match.sets[0].scoreUs,25);assert.equal(match.sets[0].rallies.length,1);
 assert.equal(match.sets[0].finished,true);assert.equal(match.rotationNo,6);
 assert.equal(native.writes,1);
 assert.equal(controller.undoRally(),true);
 assert.equal(match.sets[0].scoreUs,24);assert.equal(match.sets[0].rallies.length,0);
 assert.equal(match.sets[0].finished,false);assert.equal(match.rotationNo,1);
 assert.equal(native.writes,2);assert.equal(controller.diagnostics().nativeDispatches,2);
 assert.deepEqual(messages.map(x=>x.level),['ok','ok']);
});

test('incorrect point/undo plans are rejected; the historic writer still saves once',async()=>{
 const mod=await compiled(),base=mod.installNativeRallyPlan({});
 const wrong={...base,point:()=>({scoreUs:999,scoreOpponent:999}),
  undo:()=>({scoreUs:999,scoreOpponent:999}),nextRotation:()=>999};
 const old=nativeHarness(fixture({serving:'opponent',score:24}));
 const candidate=nativeHarness(fixture({serving:'opponent',score:24}),{plan:wrong});
 old.window.scoutAwardPoint('ours');candidate.window.scoutAwardPoint('ours');
 assert.deepEqual(json(candidate.match),json(old.match));
 old.window.scoutUndoRally();candidate.window.scoutUndoRally();
 assert.deepEqual(json(candidate.match),json(old.match));
 assert.equal(candidate.writes,2);
});

test('a throwing or absent plan bridge cannot cause any second native dispatch',async()=>{
 const mod=await compiled(),base=mod.installNativeRallyPlan({});
 const scenarios=[null,{...base,point:()=>{throw Error('unavailable')},
  undo:()=>{throw Error('unavailable')},nextRotation:()=>{throw Error('unavailable')}},
  {...base,VERSION:'20.5.81'}];
 for(const plan of scenarios){
  const match=fixture({serving:'ours'}),native=nativeHarness(match,{plan});
  native.window.scoutAwardPoint('opponent');native.window.scoutUndoRally();
  assert.equal(native.writes,2);assert.equal(match.sets[0].rallies.length,0);
  assert.equal(match.sets[0].scoreUs,8);assert.equal(match.sets[0].scoreOpponent,7);
 }
});

test('V20.6.0 source, build and shell wire the plans without replacing sync owners',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.6.2');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2060-native-rally-plan-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.2'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.6.2'));
 assert.ok(read('service-worker.js').includes('native-rally-plan-20.6.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('installNativeRallyPlan(window)'));
 assert.ok(pointSource.includes('nativePlanBridge.point('));
 assert.ok(helperSource.includes('undoBridge.undo(r)'));
 assert.ok(source.includes('scoutSyncCompetition(m)'));
});
