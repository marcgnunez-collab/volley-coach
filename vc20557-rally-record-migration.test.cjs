'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const monolith=read('021-core-scouting-v150-monolithic.js');
const helperStart=monolith.indexOf('/* V20.5.57 · Typed rally record parity');
const helperEnd=monolith.indexOf('const vcSubRefreshBase=',helperStart);
const pointMarker=monolith.indexOf('// Cierre de rally: corregimos');
const pointStart=monolith.indexOf('window.scoutAwardPoint=function(winner){',pointMarker);
const pointEnd=monolith.indexOf('\n};',pointStart)+3;
const helperSource=monolith.slice(helperStart,helperEnd);
const pointSource=monolith.slice(pointStart,pointEnd);
const clone=structuredClone;
const originalJSON=value=>JSON.parse(JSON.stringify(value));
const pos=['p1','p2','p3','p4','p5','p6'];
const lineup=(offset=0)=>Object.fromEntries(pos.map((p,i)=>[p,i+1+offset]));
function fixture({serving='opponent',rotation=1,score=8,actions=3,number=1}={}){
 return {id:'PRIVATE-RALLY-ID',status:'live',currentSet:number,servingTeam:serving,
  rotationNo:rotation,opponentRotationNo:rotation,
  lineup:{ours:lineup(),opponent:lineup(10)},baseLineup:{ours:lineup(),opponent:lineup(10)},
  lineupRoles:{ours:{},opponent:{}},libero:{auto:false},events:[],
  sets:[{number,scoreUs:score,scoreOpponent:score-1,finished:false,rallies:[]}],
  liveRally:{id:'PRIVATE-LIVE',actions:Array.from({length:actions},(_,i)=>({code:'PRIVATE-CODE-'+i,skill:'A'})),
   startedAt:'2026-11-20T12:00:00Z',scoutStartMs:'9.5',startSnapshot:null}
 };
}
function nativeHarness(match,bridge){
 let writes=0;const window={...(bridge?{VC_RALLY_RECORDS_20557:bridge}:{})};
 const set=match.sets[0];
 const snapshot=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:clone(match.lineup),
  scoreBefore:{us:set.scoreUs,opponent:set.scoreOpponent}});
 const context=vm.createContext({window,Date,Number,structuredClone,
  scoutActive:()=>match,scoutSet:()=>set,scoutClone:clone,
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=snapshot()},
  scoutCurrentRallySnapshot:snapshot,
  vcEnsureProMatch:()=>{},scoutV6107SyncOpponentLineup:()=>{},
  vcApplyAutoLibero:(m,record)=>{if(record)m.events.push({type:'libero_auto',rallyId:null})},
  vcRotateBase:()=>{},scoutV6107NextRotation:rot=>rot===1?6:rot-1,
  scoutRotateTeamLineup:part=>part,scoutArr:value=>Array.isArray(value)?value:[],
  scoutResetLiveRally:()=>{match.liveRally={id:'PRIVATE-NEXT',actions:[],startSnapshot:null}},
  scoutSetHasWinner:s=>s.scoreUs>=25&&s.scoreUs-s.scoreOpponent>=2,
  scoutSetsScore:()=>({us:0,opponent:0}),scoutNow:()=>new Date(0).toISOString(),
  scoutElapsed:()=>1500,scoutSave:()=>{writes++},
  scoutNormalizeLineup:clone,scoutNormalizeLibero:clone,scoutNormalizeRoles:clone,
  V6107_VERSION:'6.10.7'});
 vm.runInContext(helperSource+'\n'+pointSource,context,{timeout:2500});
 return {window,match,writes:()=>writes,diagnostics:()=>originalJSON(window.VC_RALLY_RECORD_DIAGNOSTICS_20557())};
}

test('V20.5.57 publishes frozen pure constructors and preserves supplied snapshots by reference',async()=>{
 const module=await compiled(),host={},bridge=module.installRallyRecordBridge(host);
 assert.equal(bridge.VERSION,'20.5.57');assert.equal(bridge.pureRecordOnly,true);
 assert.strictEqual(module.installRallyRecordBridge(host),bridge);
 assert.strictEqual(host.VC_RALLY_RECORDS_20557,bridge);
 assert.ok(Object.isFrozen(bridge));
 const live={id:91,startedAt:'start',scoutStartMs:'7.5'},before={servingBefore:'opponent',rotationBefore:3,
  opponentRotationBefore:5},actions=[{code:'PRIVATE-CODE'}],lineupBefore={ours:{p1:'PRIVATE'}};
 const seed={live,before,setNumber:2,baseBefore:{},liberoBefore:{},rolesBefore:{},lineupBefore,
  scoreBefore:{us:17,opponent:16},scoreUs:18,scoreOpponent:16,winner:'ours',actions,endedAt:'end',scoutEndMs:3400};
 const old=JSON.stringify(seed),record=module.assembleClosedRally(seed);
 assert.equal(JSON.stringify(seed),old);
 assert.strictEqual(record.actions,actions);
 assert.strictEqual(record.lineupBefore,lineupBefore);
 assert.deepEqual(Object.keys(record),['id','setNumber','servingBefore','rotationBefore',
  'opponentRotationBefore','lineupBefore','baseLineupBefore','liberoBefore','lineupRolesBefore',
  'scoreBefore','scoreAfter','winner','actions','startedAt','endedAt','scoutStartMs','scoutEndMs']);
 assert.equal(record.scoutStartMs,7.5);
 const undo=module.assembleRestoredLiveRally({rally:record,actions,scoreBefore:seed.scoreBefore,lineupBefore});
 assert.deepEqual(originalJSON(undo),{id:91,actions,startedAt:'start',scoutStartMs:7.5,
  startSnapshot:{servingBefore:'opponent',rotationBefore:3,opponentRotationBefore:5,
   lineupBefore,scoreBefore:seed.scoreBefore}});
 assert.strictEqual(undo.startSnapshot.scoreBefore,seed.scoreBefore);
 assert.equal(module.assembleClosedRally(null),null);
 assert.equal(module.assembleRestoredLiveRally([]),null);
});

test('all service and rotation combinations preserve identical native closed/undo records',async()=>{
 const bridge=(await compiled()).installRallyRecordBridge({});let count=0;
 for(const serving of ['ours','opponent'])for(const winner of ['ours','opponent'])
 for(let rotation=1;rotation<=6;rotation++)for(const score of [0,17,24,25]){
  const original=nativeHarness(fixture({serving,rotation,score}));
  const current=nativeHarness(fixture({serving,rotation,score}),bridge);
  original.window.scoutAwardPoint(winner);current.window.scoutAwardPoint(winner);
  assert.deepEqual(originalJSON(current.match),originalJSON(original.match),`point ${serving}/${winner}/P${rotation}/${score}`);
  assert.equal(current.diagnostics().closeTyped,1);
  current.window.scoutUndoRally();original.window.scoutUndoRally();
  assert.deepEqual(originalJSON(current.match),originalJSON(original.match),`undo ${serving}/${winner}/P${rotation}/${score}`);
  assert.equal(current.diagnostics().restoreTyped,1);
  assert.equal(current.writes(),2);assert.equal(original.writes(),2);
  assert.equal(current.diagnostics().mismatches,0);
  count++;
 }
 assert.equal(count,96);
});

test('720 record variants retain score, actions, lineups and time fields without duplicates',async()=>{
 const module=await compiled();let count=0;
 for(const id of [1,16,'PRIVATE-17'])for(const scoreUs of [0,1,18,24,27])
 for(const scoreOpponent of [0,9,18,24])for(const scoutStartMs of [0,'8.4',null,''])
 for(const winner of ['ours','opponent','unknown']){
  const live={id,startedAt:'START',scoutStartMs},before={servingBefore:winner,rotationBefore:1,opponentRotationBefore:5};
  const actions=[{code:'PRIVATE-CODE'}],lineupBefore={ours:{p1:'PRIVATE'}},scoreBefore={us:scoreUs,opponent:scoreOpponent};
  const seed={live,before,setNumber:1,baseBefore:{},liberoBefore:{},rolesBefore:{},
   lineupBefore,scoreBefore,scoreUs,scoreOpponent,winner,actions,endedAt:'END',scoutEndMs:550};
  const record=module.assembleClosedRally(seed);
  const historical={id,setNumber:1,servingBefore:winner,rotationBefore:1,opponentRotationBefore:5,
   lineupBefore,baseLineupBefore:seed.baseBefore,liberoBefore:seed.liberoBefore,
   lineupRolesBefore:seed.rolesBefore,scoreBefore,scoreAfter:{us:scoreUs,opponent:scoreOpponent},
   winner:winner==='opponent'?'opponent':'ours',actions,startedAt:'START',endedAt:'END',
   scoutStartMs:Number(scoutStartMs)||0,scoutEndMs:550};
  assert.equal(module.sameRallyRecord(historical,record),true);
  const restored=module.assembleRestoredLiveRally({rally:record,actions,lineupBefore,scoreBefore});
  assert.equal(restored.scoutStartMs,Number(scoutStartMs)||0);
  assert.strictEqual(restored.actions,actions);
  count++;
 }
 assert.equal(count,720);
});

test('missing, incompatible, inaccurate and throwing Vite bridges preserve native point and undo once',async()=>{
 const good=(await compiled()).installRallyRecordBridge({});
 const bad=[null,
  {VERSION:'20.5.56',pureRecordOnly:true,close:good.close,restore:good.restore,equivalent:good.equivalent},
  {VERSION:'20.5.57',pureRecordOnly:true,close:()=>({}),restore:()=>({}),equivalent:good.equivalent},
  {VERSION:'20.5.57',pureRecordOnly:true,close:()=>{throw Error('missing module')},restore:()=>{throw Error('missing module')},equivalent:good.equivalent},
  {VERSION:'20.5.57',pureRecordOnly:true,close:()=>null,restore:()=>null,equivalent:good.equivalent},
  {VERSION:'20.5.57',pureRecordOnly:true,close:x=>({...good.close(x),unwanted:true}),restore:good.restore,equivalent:good.equivalent}];
 for(const bridge of bad){
  const native=nativeHarness(fixture()),candidate=nativeHarness(fixture(),bridge);
  native.window.scoutAwardPoint('ours');candidate.window.scoutAwardPoint('ours');
  candidate.window.scoutUndoRally();native.window.scoutUndoRally();
  assert.deepEqual(originalJSON(candidate.match),originalJSON(native.match));
  assert.equal(candidate.writes(),2);
  assert.equal(candidate.diagnostics().closeTyped,0);
  assert.equal(candidate.diagnostics().closeNative,1);
  if(bridge?.VERSION==='20.5.57')assert.ok(candidate.diagnostics().mismatches+candidate.diagnostics().exceptions>0);
 }
});

test('the exact shape comparison rejects reordered, missing, extra and getter-backed fields',async()=>{
 const {sameRallyRecord}=await compiled();
 const record={id:1,actions:[1,2],startSnapshot:{scoreBefore:{us:0}}};
 assert.equal(sameRallyRecord(record,{id:1,actions:record.actions,startSnapshot:{scoreBefore:{us:0}}}),true);
 assert.equal(sameRallyRecord(record,{actions:record.actions,id:1,startSnapshot:{scoreBefore:{us:0}}}),false);
 assert.equal(sameRallyRecord(record,{id:1,actions:record.actions,startSnapshot:{scoreBefore:{us:0}},extra:true}),false);
 assert.equal(sameRallyRecord(record,{id:1,actions:[1,2],startSnapshot:{scoreBefore:{us:0}}}),false);
 assert.equal(sameRallyRecord(record,{id:1,startSnapshot:{scoreBefore:{us:0}}}),false);
 const getter=Object.defineProperty({id:1,actions:record.actions,startSnapshot:{scoreBefore:{us:0}}},'secret',{get(){return 'PRIVATE'}});
 assert.equal(sameRallyRecord(record,getter),false);
});

test('release publishes the typed record bridge without changing scoring, storage or video owner',()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.58');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20557-rally-record-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.58'));
 assert.ok(sw.includes('rally-record-20.5.57'));
 assert.ok(monolith.includes("scoutV20557SelectRecord('close',closeSource,nativeRally)"));
 assert.ok(monolith.includes("scoutV20557SelectRecord('restore'"));
 assert.ok(monolith.includes('const vcIntegrityEventsBefore=scoutArr(m.events).length'));
 assert.ok(monolith.includes('scoutSave();'));
 const pure=read('src/domain/rally-record.ts'),runtime=read('src/domain/rally-record-runtime.ts');
 for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(', 'scoutAwardPoint(', 'scoutUndoRally('])
  assert.ok(!pure.includes(forbidden)&&!runtime.includes(forbidden),forbidden);
});
