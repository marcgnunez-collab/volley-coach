'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const fixture=(id=12)=>({id,status:'live',currentSet:1,servingTeam:'ours',rotationNo:2,
 opponentRotationNo:5,sets:[{number:1,scoreUs:10,scoreOpponent:9,rallies:[{id:'r1'}]}],
 liveRally:{actions:[{code:'*12S+',videoTime:7.4}]}});

test('V20.6.1 installs one frozen read-only bridge over existing canonical match',async()=>{
 const mod=await compiled(),match=fixture(),window={MatchState:{getActive:()=>match,getSet:m=>m.sets[0]}};
 const bridge=mod.installSharedMatchContext(window);
 assert.equal(bridge.VERSION,'20.6.1');assert.equal(bridge.readOnly,true);
 assert.equal(bridge.singleNativeSource,true);assert.ok(Object.isFrozen(bridge));
 assert.equal(mod.installSharedMatchContext(window),bridge);
 assert.equal(window.VC_MATCH_CONTEXT_2061,bridge);
 assert.equal(bridge.getActive(),match);assert.equal(bridge.getSet(match),match.sets[0]);
 assert.equal(mod.readSharedMatch(window),match);
 assert.equal(Object.isFrozen(match),false);assert.equal(Object.isFrozen(match.sets),false);
 assert.equal(Object.isFrozen(match.liveRally.actions),false);
});

test('capture only freezes its view and shares match, set, rally and action identity',async()=>{
 const mod=await compiled(),match=fixture(),set=match.sets[0];
 const frame=mod.captureSharedMatchFrame(match,set);
 assert.ok(Object.isFrozen(frame));assert.equal(frame.readOnly,true);
 assert.equal(frame.match,match);assert.equal(frame.set,set);
 assert.equal(frame.liveActions,match.liveRally.actions);
 assert.equal(frame.lastRally,set.rallies[0]);assert.equal(frame.lastAction,match.liveRally.actions[0]);
 assert.equal(frame.scoreUs,10);assert.equal(frame.scoreOpponent,9);
 assert.equal(frame.closedRallies,1);assert.equal(frame.liveActionCount,1);
 assert.equal(frame.rotationUs,2);assert.equal(frame.rotationOpponent,5);
 assert.equal(frame.serving,'ours');assert.equal(frame.phase,'live');
 assert.equal(mod.isSharedMatchFrameCurrent(frame,mod.captureSharedMatchFrame(match)),true);
});

test('scope guards observe in-place scoreboard, rotation, phase, set and rally changes',async()=>{
 const mod=await compiled(),match=fixture(),before=mod.captureSharedMatchFrame(match);
 const fresh=()=>mod.captureSharedMatchFrame(match);
 const variants=[
  m=>{m.sets[0].scoreUs++},m=>{m.sets[0].scoreOpponent++},
  m=>{m.servingTeam='opponent'},m=>{m.rotationNo=3},
  m=>{m.opponentRotationNo=4},m=>{m.status='finished'},
  m=>{m.sets[0].rallies.push({id:'r2'})},
  m=>{m.liveRally.actions.push({videoTime:9})},
  m=>{m.sets.push({number:2,scoreUs:0,scoreOpponent:0,rallies:[]});m.currentSet=2}
 ];
 for(const change of variants){change(match);assert.equal(mod.isSharedMatchFrameCurrent(before,fresh()),false)}
 const after=fresh();assert.equal(mod.isSharedMatchFrameCurrent(after,fresh()),true);
 assert.equal(after.currentSet,2);assert.equal(after.set,match.sets[1]);
});

test('analysis selector retains selected archived match over active match and same fallbacks',async()=>{
 const mod=await compiled(),first=fixture(1),active=fixture(2),archive=fixture(3),matches=[first,active,archive];
 assert.equal(mod.selectSharedAnalysisMatch(matches,'3',2,active),archive);
 assert.equal(mod.selectSharedAnalysisMatch(matches,'',2,active),active);
 assert.equal(mod.selectSharedAnalysisMatch(matches,'999',2,active),active);
 assert.equal(mod.selectSharedAnalysisMatch(matches,'999',0,null),first);
 assert.equal(mod.selectSharedAnalysisMatch([],null,null,null),null);
});

test('canonical reader priority and historical reader fallback retain object reference',async()=>{
 const mod=await compiled(),primary=fixture(1),secondary=fixture(2),window={
  MatchState:{getActive:()=>primary},VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>secondary}
 };
 const bridge=mod.installSharedMatchContext(window);
 assert.equal(bridge.getActive(),primary);assert.equal(mod.readSharedMatch(window),primary);
 window.MatchState.getActive=()=>{throw Error('reader is closing')};
 assert.equal(bridge.getActive(),secondary);assert.equal(mod.readSharedMatch(window),secondary);
 window.VC_SCOUT_VIDEO_BRIDGE.getActive=()=>null;
 assert.equal(bridge.getActive(),null);
});

test('set reader rejects an alien set and uses the match numbered set',async()=>{
 const mod=await compiled(),match=fixture(),alien={number:1,rallies:[]},window={
  MatchState:{getActive:()=>match,getSet:()=>alien}
 };
 const bridge=mod.installSharedMatchContext(window);
 assert.equal(bridge.getSet(match),match.sets[0]);assert.equal(bridge.getSet(null),null);
 match.sets.push({number:2,scoreUs:0,scoreOpponent:0,rallies:[]});match.currentSet=2;
 assert.equal(bridge.getSet(match),match.sets[1]);
});

test('untrusted or incompatible bridges never take ownership of Scouting reads',async()=>{
 const mod=await compiled(),match=fixture(),other=fixture(999),window={
  MatchState:{getActive:()=>match},VC_MATCH_CONTEXT_2061:{VERSION:'20.6.1',readOnly:true,
   singleNativeSource:true,getActive:()=>other}
 };
 assert.equal(mod.readSharedMatch(window),match);
 window.VC_MATCH_CONTEXT_2061.getActive=()=>{throw Error('bridge down')};
 assert.equal(mod.readSharedMatch(window),match);
 window.VC_MATCH_CONTEXT_2061={VERSION:'unsafe',getActive:()=>other};
 assert.equal(mod.readSharedMatch(window),match);
});

const analysisSource=read('021-core-scouting-v150-monolithic.js').split('\n')
 .find(line=>line.startsWith('function scoutMatchForAnalysis()'));
function analysisHarness({matches,selected,activeId,active,bridge}){
 const window={VC_MATCH_CONTEXT_2061:bridge},context=vm.createContext({window,
  scoutingMatches:matches,scoutingActiveId:activeId,$:()=>selected===null?null:{value:selected},
  scoutActive:()=>active});
 vm.runInContext(analysisSource,context,{timeout:1000});
 return vm.runInContext('scoutMatchForAnalysis()',context,{timeout:1000});
}
test('effective Análisis route uses the typed selector only on exact identity parity',async()=>{
 const mod=await compiled(),matches=[fixture(1),fixture(2),fixture(3)],active=matches[1];
 let calls=0;const base=mod.installSharedMatchContext({});
 const bridge={...base,selectAnalysisMatch:(...args)=>{calls++;return base.selectAnalysisMatch(...args)}};
 for(const selected of ['3','',null,'999']){
  const original=analysisHarness({matches,selected,activeId:2,active});
  assert.equal(analysisHarness({matches,selected,activeId:2,active,bridge}),original);
 }
 assert.equal(calls,4);
});

test('effective Análisis selection returns native on mismatch, exception or malformed bridge',()=>{
 const matches=[fixture(1),fixture(2)],active=matches[1],expected=matches[0];
 for(const bridge of [
  {VERSION:'20.6.1',readOnly:true,singleNativeSource:true,selectAnalysisMatch:()=>fixture(999)},
  {VERSION:'20.6.1',readOnly:true,singleNativeSource:true,selectAnalysisMatch:()=>{throw Error('fail')}},
  {VERSION:'old',readOnly:true,singleNativeSource:true,selectAnalysisMatch:()=>active}
 ])assert.equal(analysisHarness({matches,selected:'1',activeId:2,active,bridge}),expected);
});

const videoSource=read('028-v740-live-scout-video-module.js').split('\n');
const videoFunctions=videoSource.find(line=>line.startsWith('function active()'))+'\n'+
 videoSource.find(line=>line.startsWith('function setOf(m)'));
function videoHarness(native,bridge){
 const window={VC_SCOUT_VIDEO_BRIDGE:native,VC_MATCH_CONTEXT_2061:bridge};
 const ctx=vm.createContext({window});vm.runInContext(videoFunctions,ctx,{timeout:1000});
 return {active:()=>vm.runInContext('active()',ctx,{timeout:1000}),
  setOf:m=>{ctx.input=m;return vm.runInContext('setOf(input)',ctx,{timeout:1000})}};
}
test('effective Video reads share identical native match/set without touching video state',async()=>{
 const mod=await compiled(),match=fixture(),set=match.sets[0],native={
  getActive:()=>match,getCurrentSet:()=>set
 },bridge=mod.installSharedMatchContext({VC_SCOUT_VIDEO_BRIDGE:{getActive:native.getActive,
  getSet:()=>set}});
 const video=videoHarness(native,bridge);
 assert.equal(video.active(),match);assert.equal(video.setOf(match),set);
 assert.equal(match.liveRally.actions[0].videoTime,7.4);
});

test('Video retains its original selection if typed reader differs or fails',()=>{
 const match=fixture(),native={getActive:()=>match,getCurrentSet:()=>match.sets[0]};
 for(const bridge of [
  {VERSION:'20.6.1',readOnly:true,singleNativeSource:true,getActive:()=>fixture(9),getSet:()=>({})},
  {VERSION:'20.6.1',readOnly:true,singleNativeSource:true,getActive:()=>{throw Error('fail')},
   getSet:()=>{throw Error('fail')}},
  {VERSION:'old',readOnly:true,singleNativeSource:true,getActive:()=>null,getSet:()=>null}
 ]){
  const video=videoHarness(native,bridge);
  assert.equal(video.active(),match);assert.equal(video.setOf(match),match.sets[0]);
 }
});

test('Scouting projection, LIVE and boxscore all use the shared read-through without alternate writers',()=>{
 const files=['src/state/scouting-projections.ts','src/state/live-statistics-runtime.ts',
  'src/state/player-boxscore-runtime.ts'];
 for(const file of files){const source=read(file);
  assert.ok(source.includes('readSharedMatch(win)'),file);
  assert.ok(!source.includes('readCanonicalMatch(win)'),file);
 }
 const typed=read('src/state/shared-match-context.ts')+
  read('src/state/shared-match-context-runtime.ts');
 for(const forbidden of ['scoutSave(','.rallies.push(','.rallies.pop(',
  'localStorage','indexedDB','supabase','fetch(','getItem(','setItem('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('V20.6.1 shell, build, service worker and scripts register the shared scope',()=>{
 const packageFile=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(packageFile.version,require('./scripts/retained-legacy-assets.json').updatedIn);
 assert.ok(packageFile.scripts['test:foundation'].includes('vc2061-shared-match-context.test.cjs'));
 assert.ok(html.includes('V20.6.1 · ESTADO COMPARTIDO'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(html.includes('028-v740-live-scout-video-module.js?v=20.7.0'));
 assert.ok(read('service-worker.js').includes('shared-match-context-20.6.1'));
 assert.ok(read('src/vc2055-entry.ts').includes('installSharedMatchContext(window)'));
});
