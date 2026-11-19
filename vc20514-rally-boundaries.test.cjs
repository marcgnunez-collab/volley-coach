'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const monolith=read('021-core-scouting-v150-monolithic.js');
const video=read('028-v740-live-scout-video-module.js');
const nativeLines=monolith.split('\n');
const exact=(marker,guard='')=>nativeLines.find(line=>line.startsWith(marker)&&line.includes(guard));
const nativeCore=[
 exact('function scoutSetTarget('),exact('function scoutSetHasWinner('),exact('function scoutSetsScore('),
 monolith.slice(monolith.indexOf(' function vcApplyAutoLibero(m,record=false){'),monolith.indexOf('function vcRotateBase(m,dir=1)')),
 exact('function vcRotateBase('),
 exact('window.scoutAwardPoint=function(winner){','vcApplyAutoLibero'),
 exact('window.scoutUndoRally=function(){','scoutNormalizeRoles')
].join('\n');
const nativeVideo=[
 video.slice(video.indexOf('function lastClosedRally(m=active()){'),video.indexOf('function lastAction(m=active()){')),
 video.slice(video.indexOf('function linkRally(r,m,start,end){'),video.indexOf('function rangeAvailable(start,end){')),
 video.slice(video.indexOf('const baseAward=window.scoutAwardPoint;'),video.indexOf('// Render wrapper:'))
].join('\n');
const POS=['p1','p2','p3','p4','p5','p6'];
const slots=(offset=0)=>Object.fromEntries(POS.map((pos,i)=>[pos,offset+i+1]));
const cloning=value=>structuredClone(value);

function fixture(setNo=1,us=24,opponent=23,serving='opponent',previous=[]){
 const ours=slots(),rival=slots(10);
 return {status:'live',currentSet:setNo,servingTeam:serving,rotationNo:1,opponentRotationNo:3,
  lineup:{ours:cloning(ours),opponent:cloning(rival)},baseLineup:{ours:cloning(ours),opponent:cloning(rival)},
  lineupRoles:{ours:slots(30),opponent:slots(40)},
  libero:{auto:false,enabled:true,mode:'single',playerId:99,activePlayerId:99,activeForId:6,activePosition:'p6'},
  sets:[...previous,{number:setNo,scoreUs:us,scoreOpponent:opponent,finished:false,rallies:[]}],
  liveRally:{id:828,actions:[{code:'PRIVATE-CODE',skill:'A'}],startedAt:'2026-01-01',scoutStartMs:0}};
}
function harness(match,{withVideo=false}={}){
 const window={},saves=[],competition=[];
 const set=match.sets.find(s=>s.number===match.currentSet);
 const snapshot=()=>({servingBefore:match.servingTeam,rotationBefore:match.rotationNo,
  opponentRotationBefore:match.opponentRotationNo,lineupBefore:cloning(match.lineup),
  scoreBefore:{us:set.scoreUs,opponent:set.scoreOpponent}});
 const session={id:'private-video-id',ralliesLinked:0};
 const context={window,SCOUT_POS:POS,VC_BACK_POS:['p1','p5','p6'],
  scoutActive:()=>match,scoutSet:()=>set,scoutArr:value=>Array.isArray(value)?value:[],
  vcEnsureProMatch:()=>{},vcPlayerRole:()=>'Central',
  scoutNormalizeLineup:value=>cloning(value),scoutNormalizeLibero:value=>cloning(value),
  scoutNormalizeRoles:value=>cloning(value),
  scoutEnsureRallyStart:()=>{if(!match.liveRally.startSnapshot)match.liveRally.startSnapshot=snapshot()},
  scoutCurrentRallySnapshot:snapshot,scoutClone:cloning,
  scoutRotateTeamLineup:lineup=>lineup,
  scoutResetLiveRally:()=>{match.liveRally={id:829,actions:[],startSnapshot:null}},
  scoutSave:()=>saves.push('native-write'),scoutNow:()=>new Date(0).toISOString(),scoutElapsed:()=>1500,
  scoutSyncCompetition:()=>competition.push('native-competition-write'),
  vcAutoLiberoTarget:()=>null,vcLiberoRalliesCompleted:()=>0,vcRecordLiberoTransition:()=>{},
  active:()=>match,currentSession:()=>session,liveRunning:()=>true,videoNow:()=>12,
  arr:value=>Array.isArray(value)?value:[],save:()=>saves.push('native-video-write'),
  render:()=>{},setTimeout:()=>0,$:()=>null,VERSION:'test-video',
  Date,Math,Number,Array,Object};
 vm.runInNewContext(nativeCore,context,{timeout:1500});
 if(withVideo)vm.runInNewContext(nativeVideo,context,{timeout:1500});
 return {window,context,saves,competition,session};
}

test('set boundary projections match native closure at 25, 15, deuce, and non-terminal scores',async()=>{
 const {planAwardPoint,projectSetBoundary}=await compiled();
 const scenarios=[
  {set:1,us:24,opp:23,winner:'ours',finished:true},
  {set:1,us:24,opp:24,winner:'ours',finished:false},
  {set:1,us:25,opp:25,winner:'ours',finished:false},
  {set:1,us:26,opp:25,winner:'ours',finished:true},
  {set:5,us:14,opp:13,winner:'ours',finished:true},
  {set:5,us:14,opp:14,winner:'ours',finished:false},
  {set:5,us:16,opp:16,winner:'opponent',finished:false},
  {set:5,us:14,opp:15,winner:'opponent',finished:true}
 ];
 for(const scenario of scenarios){
  const match=fixture(scenario.set,scenario.us,scenario.opp);
  const native=harness(match),projection=planAwardPoint(match,scenario.winner);
  assert.equal(projection.state,'projected');
  assert.equal(projection.setBoundary.state,'projected');
  assert.equal(projection.setBoundary.target,scenario.set===5?15:25);
  assert.equal(projection.setBoundary.setFinished,scenario.finished);
  assert.equal(JSON.stringify(match).includes('finished":true'),false,'dry run did not finish a set');
  native.window.scoutAwardPoint(scenario.winner);
  assert.equal(match.sets.at(-1).finished,projection.setBoundary.setFinished,JSON.stringify(scenario));
  assert.equal(native.saves.includes('native-write'),true);
 }
 assert.equal(projectSetBoundary(null,{us:25,opponent:0}).state,'unknown');
 assert.equal(projectSetBoundary({currentSet:6,sets:[{number:6}]},{us:25,opponent:0}).state,'unknown');
});

test('third set won closes the match only when the native historical sets are finished',async()=>{
 const {planAwardPoint}=await compiled();
 const history=[{number:1,finished:true,winner:'ours'},{number:2,finished:true,winner:'ours'}];
 const match=fixture(3,24,23,'opponent',history),native=harness(match);
 const planned=planAwardPoint(match,'ours');
 assert.equal(planned.setBoundary.setFinished,true);
 assert.equal(planned.setBoundary.matchFinished,true);
 assert.equal(planned.setBoundary.setWinner,'ours');
 native.window.scoutAwardPoint('ours');
 assert.equal(match.status,'finished');
 assert.equal(native.competition.length,1);
 const incomplete=fixture(3,24,23,'opponent',[{number:1,finished:true,winner:'ours'},
  {number:2,finished:true,winner:null}]);
 assert.equal(planAwardPoint(incomplete,'ours').setBoundary.state,'unknown');
});

test('native undo restores real captured lineup, base lineup, libero, roles and actions',async()=>{
 const {planUndoLastRally,inspectRallyRestoration}=await compiled();
 const match=fixture(2,16,14,'opponent'),native=harness(match);
 native.context.vcApplyAutoLibero(match,false);
 const original={lineup:cloning(match.lineup),baseLineup:cloning(match.baseLineup),
  libero:cloning(match.libero),roles:cloning(match.lineupRoles),actions:cloning(match.liveRally.actions)};
 native.window.scoutAwardPoint('ours');
 const rally=match.sets.at(-1).rallies.at(-1);
 const coverage=inspectRallyRestoration(rally);
 assert.deepEqual({lineup:coverage.lineup,base:coverage.baseLineup,libero:coverage.libero,roles:coverage.roles},
  {lineup:'captured',base:'captured',libero:'captured',roles:'captured'});
 assert.equal(coverage.actionsCaptured,true);
 assert.equal(Object.isFrozen(coverage),true);
 assert.equal(planUndoLastRally(match).restoration.libero,'captured');
 native.window.scoutUndoRally();
 assert.deepEqual(match.lineup,original.lineup);
 assert.deepEqual(match.baseLineup,original.baseLineup);
 assert.deepEqual(match.libero,original.libero);
 assert.deepEqual(match.lineupRoles,original.roles);
 assert.deepEqual(match.liveRally.actions,original.actions);
 assert.equal(native.saves.filter(x=>x==='native-write').length,2);
});

test('the original auto-libero branch restores its active replacement after side-out and undo',async()=>{
 const {inspectRallyRestoration}=await compiled();
 const match=fixture(2,7,8,'opponent'),native=harness(match);
 match.libero.auto=true;match.libero.activeForId=null;match.libero.activePosition='';match.libero.activePlayerId=null;
 native.context.vcAutoLiberoTarget=()=>({pos:'p5',centralId:5,liberoId:99});
 native.context.vcApplyAutoLibero(match,false);
 const before={lineup:cloning(match.lineup),base:cloning(match.baseLineup),libero:cloning(match.libero)};
 assert.equal(match.lineup.ours.p5,99);
 native.window.scoutAwardPoint('ours');
 assert.equal(inspectRallyRestoration(match.sets.at(-1).rallies.at(-1)).libero,'captured');
 native.window.scoutUndoRally();
 assert.deepEqual(match.lineup,before.lineup);
 assert.deepEqual(match.baseLineup,before.base);
 assert.deepEqual(match.libero,before.libero);
 assert.equal(match.libero.activePosition,'p5');
});

test('old rallies without full snapshots report native fallback without exposing their sensitive fields',async()=>{
 const {inspectRallyRestoration}=await compiled();
 const legacy={lineupBefore:{ours:{p1:'PRIVATE-PLAYER'},opponent:{}},
  actions:[{code:'PRIVATE-CODE'}],liveVideoSessionId:'PRIVATE-VIDEO'};
 const before=JSON.stringify(legacy);
 const coverage=inspectRallyRestoration(legacy);
 assert.equal(coverage.lineup,'captured');
 assert.equal(coverage.baseLineup,'native-fallback');
 assert.equal(coverage.libero,'native-fallback');
 assert.equal(coverage.roles,'native-fallback');
 assert.equal(coverage.video,'partial');
 assert.equal(JSON.stringify(coverage).includes('PRIVATE'),false);
 assert.equal(JSON.stringify(legacy),before);
 assert.equal(inspectRallyRestoration({}).lineup,'missing');
 assert.equal(inspectRallyRestoration({}).video,'not-linked');
});

test('actual V7.4 video wrappers retain the closed clip markers after native undo',async()=>{
 const {planUndoLastRally,inspectRallyRestoration}=await compiled();
 const match=fixture(1,12,11,'ours'),native=harness(match,{withVideo:true});
 match.liveRally.liveVideoSessionId=native.session.id;
 match.liveRally.liveVideoStart=7;
 native.window.scoutAwardPoint('ours');
 const rally=match.sets.at(-1).rallies.at(-1);
 const expected={liveVideoSessionId:rally.liveVideoSessionId,liveVideoStart:rally.liveVideoStart,
  liveVideoEnd:rally.liveVideoEnd,liveVideoLinkedAt:rally.liveVideoLinkedAt};
 assert.equal(inspectRallyRestoration(rally).video,'linked');
 assert.equal(planUndoLastRally(match).restoration.video,'linked');
 assert.equal(native.session.ralliesLinked,1);
 native.window.scoutUndoRally();
 for(const [key,value] of Object.entries(expected))assert.equal(match.liveRally[key],value,key);
 assert.ok(native.saves.includes('native-video-write'));
 assert.equal(match.sets.at(-1).rallies.length,0);
});

test('V20.5.14 keeps native writers untouched, including the extracted V13 scripts',async()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.28');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20514-rally-boundaries.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.28'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.28'));
 assert.ok(sw.includes('rally-boundaries-20.5.14'));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
 for(const name of ['src/domain/rally-boundaries.ts','src/domain/rally-transition.ts']){
  const source=read(name);
  for(const forbidden of ['scoutSave(', 'localStorage', 'indexedDB', 'supabase', 'window.', 'document.', 'getSnapshot('])
   assert.equal(source.includes(forbidden),false,`${name}: ${forbidden}`);
 }
});
