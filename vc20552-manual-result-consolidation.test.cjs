'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const json=value=>JSON.parse(JSON.stringify(value));
const source=read('021-core-scouting-v150-monolithic.js');
const archived=read('test-audit/fixtures/v20551-manual-result-normalizer.txt');
const archivedFinalizer=read('test-audit/fixtures/v20553-match-normalizer-wrappers.txt');
const first=source.indexOf('/* V20.5.51 · V6.10.2 finalization');
const last=source.indexOf('/* V20.5.54 · Preserve V6.10.2',first);
assert.ok(first>=0&&last>first);
const modern=source.slice(first,last)+'\n'+
 archivedFinalizer.slice(archivedFinalizer.indexOf('const v6102NormMatchBase=scoutNormalizeMatch;'));
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({
  window:mode==='new'&&bridge?{VC_SCOUT_MANUAL_RESULT_20552:bridge}:{},
  calls:0,lastBase:null,
  scoutArr:value=>Array.isArray(value)?value:[],
  V6102_VERSION:'6.10.7',V700_VERSION:'7.0.1',V861_VERSION:'8.6.1'
 });
 const base=`var scoutNormalizeMatch=function(m){calls++;
  const video=m?.video;
  const x={...(m||{}),dataVersion:'6.10.1',
    sets:Array.isArray(m?.sets)?m.sets.map((s,i)=>({
      ...s,number:Number(s?.number)||i+1,rallies:Array.isArray(s?.rallies)?s.rallies.map(r=>({...r})):[]})):[],
    video:{syncOffset:video?.syncOffset==null?null:Number(video.syncOffset),
      source:String(video?.source||''),clips:Array.isArray(video?.clips)?video.clips:[]},
    baseMarker:'preserved'};
  lastBase=x;return x;};`;
 vm.runInContext(base+'\n'+modern,context,{timeout:5000});
 return {
  normalize:m=>context.scoutNormalizeMatch(m),context,
  video:()=>vm.runInContext('v20551VideoOverlayVersion=V700_VERSION;v20551VideoOverlayReady=true;',context),
  advance:()=>vm.runInContext(mode==='new'
   ?'v20552ManualResultVersion=V861_VERSION;v20552ManualResultReady=true;'
   :archived,context,{timeout:5000}),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_MANUAL_RESULT_DIAGNOSTICS_20552()):null
 };
}

test('V20.5.52 exposes one immutable pure projection without modifying saved scouting',async()=>{
 const domain=await compiled(),holder={},api=domain.installMatchManualResultBridge(holder);
 assert.equal(api.VERSION,'20.5.52');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_MANUAL_RESULT_20552,api);
 assert.strictEqual(domain.installMatchManualResultBridge(holder),api);
 const input={sets:[{number:1,manualFinished:true,manualFinishedAt:'2026-11-20',
  manualScorePrevious:{us:'22',opponent:20}}],manualFinalResult:{active:true,us:'3',opponent:1}};
 const original=JSON.stringify(input),result=domain.normalizeMatchManualResult(input,{sets:[{number:1}]});
 assert.deepStrictEqual(json(result),{sets:[{manualFinished:true,manualFinishedAt:'2026-11-20',
  manualScorePrevious:{us:22,opponent:20}}],manualFinalResult:{active:true,us:3,opponent:1,
  savedAt:null,finalizedAt:null,clearedAt:null}});
 assert.equal(JSON.stringify(input),original);
});

test('manual result overlay activates only at original V8.6.1 phase, after V7.0',async()=>{
 const bridge=(await compiled()).installMatchManualResultBridge({});
 const old=harness('old'),current=harness('new',bridge);
 const input={id:15,sets:[{number:1,manualFinished:true,
  manualScorePrevious:{us:25,opponent:21}}],manualFinalResult:{active:true,us:3,opponent:0},
  video:{source:'rec',clips:[{id:1}]},resultComplete:true};
 old.video();current.video();
 const firstOld=old.normalize(input),firstNew=current.normalize(input);
 assert.deepStrictEqual(json(firstNew),json(firstOld));
 assert.equal(firstNew.dataVersion,'7.0.1');
 assert.equal(firstNew.sets[0].manualFinished,true,'base metadata is not overridden early');
 assert.deepStrictEqual(current.diagnostics(),{
  typed:0,native:0,mismatches:0,exceptions:0,manualEnabled:false});
 old.advance();current.advance();
 const secondOld=old.normalize(input),secondNew=current.normalize(input);
 assert.deepStrictEqual(json(secondNew),json(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew),Object.keys(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew.sets[0]),Object.keys(secondOld.sets[0]));
 assert.equal(secondNew.dataVersion,'8.6.1');
 assert.strictEqual(secondNew,current.context.lastBase);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:1,native:0,mismatches:0,exceptions:0,manualEnabled:true});
 assert.equal(old.context.calls,2);assert.equal(current.context.calls,2);
});

test('1,200 saved-match combinations retain manual scores and set-number lookup',async()=>{
 const bridge=(await compiled()).installMatchManualResultBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.video();current.video();old.advance();current.advance();
 let count=0;
 for(const finished of [false,true,0,1,'yes'])
 for(const at of [null,'',0,'2026-11-20',true])
 for(const previous of [null,{us:'22',opponent:'19'},{us:NaN,opponent:-3},[]])
 for(const final of [null,{}, {active:true,us:'3',opponent:'1'},
  {active:false,us:-4,opponent:Infinity}])
 for(const order of [0,1,2]){
  const raw={number:order===2?'2':2,manualFinished:finished,manualFinishedAt:at,
   manualScorePrevious:previous};
  const sets=order===1?[{number:1,manualFinished:false},raw]:
   order===2?[raw,{number:1,manualFinished:false}]:[raw];
  const input={id:19,sets,manualFinalResult:final,video:{clips:[{id:3}]},status:'finished'};
  const before=JSON.stringify(input),historical=old.normalize(input),typed=current.normalize(input);
  assert.deepStrictEqual(json(typed),json(historical));
  assert.deepStrictEqual(Object.keys(typed),Object.keys(historical));
  for(let i=0;i<typed.sets.length;i++){
   assert.deepStrictEqual(Object.keys(typed.sets[i]),Object.keys(historical.sets[i]));
  }
  assert.equal(JSON.stringify(input),before);
  count++;
 }
 assert.equal(count,1200);
 assert.equal(current.context.calls,count);
 assert.equal(old.context.calls,count);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:count,native:0,mismatches:0,exceptions:0,manualEnabled:true});
});

test('missing, mismatched and throwing TypeScript bridges use historic manual results',async()=>{
 const good=(await compiled()).installMatchManualResultBridge({});
 const bridges=[null,
  {VERSION:'20.5.51',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.52',pureOnly:true,normalize:()=>null},
  {VERSION:'20.5.52',pureOnly:true,normalize:()=>({sets:[],manualFinalResult:null})},
  {VERSION:'20.5.52',pureOnly:true,normalize:()=>{throw Error('bundle failure')}},
  {VERSION:'20.5.52',pureOnly:true,normalize:()=>({sets:[{
   manualFinished:true,manualFinishedAt:null,manualScorePrevious:null}],manualFinalResult:null})}];
 for(const bridge of bridges){
  const old=harness('old'),current=harness('new',bridge);
  old.advance();current.advance();
  const input={sets:[{number:1,manualFinished:false,manualScorePrevious:{us:24,opponent:20}}],
   manualFinalResult:{active:true,us:3,opponent:2}};
  assert.deepStrictEqual(json(current.normalize(input)),json(old.normalize(input)));
  assert.equal(current.context.calls,1);
  assert.equal(current.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.52')assert.ok(current.diagnostics().mismatches+current.diagnostics().exceptions>0);
 }
});

test('accessor-backed manual scores stay native with no additional getter reads',async()=>{
 const bridge=(await compiled()).installMatchManualResultBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.advance();current.advance();
 function input(counter){return {id:42,sets:[{number:1,manualFinished:true,
  manualScorePrevious:{get us(){counter.reads++;return 25},opponent:22}}],
  manualFinalResult:{active:true,us:3,opponent:1}};}
 const previous={reads:0},next={reads:0};
 assert.deepStrictEqual(json(current.normalize(input(next))),json(old.normalize(input(previous))));
 assert.deepStrictEqual(next,previous);
 assert.equal(current.diagnostics().native,1);
});

test('root accessors do not cause extra match or final-result property reads',async()=>{
 const bridge=(await compiled()).installMatchManualResultBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.advance();current.advance();
 function input(counter){return {id:90,
  get sets(){counter.sets++;return [{number:1,manualFinished:true}]},
  get manualFinalResult(){counter.result++;return {active:true,us:3,opponent:1}}};}
 const before={sets:0,result:0},after={sets:0,result:0};
 assert.deepStrictEqual(json(current.normalize(input(after))),json(old.normalize(input(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(current.diagnostics().native,1);
});

test('V20.5.52 removes only V8.6.1 normalization wrapper and keeps manual score writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.70');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20552-manual-result-consolidation.test.cjs'));
 for(const name of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(name+'?v=20.5.70'),name);
 assert.ok(sw.includes('manual-result-20.5.52'));
 assert.ok(!source.includes('const v861NormBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20552ManualResultVersion=V861_VERSION'));
 assert.ok(source.includes('v20552ManualResultReady=true'));
 assert.ok(source.includes('const v861SetsScoreBase=scoutSetsScore'));
 assert.ok(source.includes('window.scoutV861OpenFinishSet=function()'));
 assert.ok(!source.includes('const v700NormRallyBase=scoutNormalizeRally'));
 assert.ok(source.includes('v20553RallyVideoReady=true'));
 assert.ok(source.includes('const v700SaveBase=scoutSave'));
 assert.ok(!source.includes('const v6102NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20554FinalizationReady=true'));
 assert.ok(read('src/vc2055-entry.ts').includes('installMatchManualResultBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20552ManualResult'));
 const pure=read('src/domain/scout-match-manual-result.ts'),runtime=read('src/domain/scout-match-manual-result-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.ok(!pure.includes(forbidden)&&!runtime.includes(forbidden),forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
