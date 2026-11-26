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
const archive=read('test-audit/fixtures/v20553-match-normalizer-wrappers.txt');
function between(text,start,end){
 const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'extract '+start);return text.slice(a,b);
}
const v690Prelude=between(source,'/* V20.5.50 · V6.9 workflow','const v690NormMatchBase=scoutNormalizeMatch;');
const modernFirst=between(source,'const v690NormMatchBase=scoutNormalizeMatch;',
 'window.VC_SCOUT_MATCH_VIDEO_DIAGNOSTICS_20550=');
const oldFirst=between(archive,'const v690NormMatchBase=scoutNormalizeMatch;',
 'const v6102NormMatchBase=scoutNormalizeMatch;');
const oldSecond=archive.slice(archive.indexOf('const v6102NormMatchBase=scoutNormalizeMatch;'));
const v6102Prelude=between(source,'/* V20.5.51 · V6.10.2 finalization',
 '/* V20.5.54 · Preserve V6.10.2');
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({
  window:mode==='new'&&bridge?{VC_SCOUT_MATCH_FINALIZATION_20554:bridge}:{},
  scoutArr:v=>Array.isArray(v)?v:[],
  V690_VERSION:'6.9.0',V6100_VERSION:'6.10.1',V6102_VERSION:'6.10.7',
  V700_VERSION:'7.0.1',V861_VERSION:'8.6.1',
  v690NormalizeWorkflow:v=>({...(v||{}),normalized:true}),
  calls:0,lastBase:null
 });
 const base=`var scoutNormalizeMatch=function(m){calls++;
  const video=m?.video;
  const x={...(m||{}),dataVersion:'6.8.0',
   sets:Array.isArray(m?.sets)?m.sets.map(s=>({...s,rallies:Array.isArray(s.rallies)?
     s.rallies.map(r=>({...r})):[]})):[],
   video:video&&typeof video==='object'?{...video}:video,
   baseMarker:'preserved'};
  lastBase=x;return x;};`;
 vm.runInContext(base+'\n'+v690Prelude+'\n'+(mode==='new'?modernFirst:oldFirst)+'\n'+
  v6102Prelude,context,{timeout:5000});
 return {
  normalize:m=>context.scoutNormalizeMatch(m),context,
  videoContainer:()=>vm.runInContext('v20550MatchVideoReady=true;',context),
  finalization:()=>vm.runInContext(mode==='new'?'v20554FinalizationReady=true;':oldSecond,
   context,{timeout:5000}),
  videoOverlay:()=>vm.runInContext('v20551VideoOverlayVersion=V700_VERSION;v20551VideoOverlayReady=true;',context),
  manualResult:()=>vm.runInContext('v20552ManualResultVersion=V861_VERSION;v20552ManualResultReady=true;',context),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_MATCH_FINALIZATION_DIAGNOSTICS_20554()):null
 };
}

test('V20.5.54 exposes a single immutable finalization projection',async()=>{
 const module=await compiled(),holder={},api=module.installMatchFinalizationBridge(holder);
 assert.equal(api.VERSION,'20.5.54');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_MATCH_FINALIZATION_20554,api);
 assert.strictEqual(module.installMatchFinalizationBridge(holder),api);
 const input={manualSavedAt:'2026-11-20',reopenedAt:'',finalizedByUser:1,
  resultComplete:0,resultCompleteAt:'2026-11-20T17:00:00Z'};
 const before=JSON.stringify(input),value=module.normalizeMatchFinalizationFields(input);
 assert.deepStrictEqual(json(value),{manualSavedAt:'2026-11-20',reopenedAt:null,
  finalizedByUser:true,resultComplete:false,resultCompleteAt:'2026-11-20T17:00:00Z'});
 assert.equal(JSON.stringify(input),before);
});

test('one match normalizer preserves all five historical activation boundaries',async()=>{
 const bridge=(await compiled()).installMatchFinalizationBridge({});
 const old=harness('old'),current=harness('new',bridge);
 const input={id:91,manualSavedAt:'2026-11-20',reopenedAt:'2026-11-20T12:00:00Z',
  finalizedByUser:true,resultComplete:true,resultCompleteAt:'2026-11-20T12:05:00Z',
  workflow:{setLineups:{}},sets:[{number:1,rallies:[{id:7,videoStart:'3.5',videoEnd:'8.2'}],
   manualFinished:true,manualFinishedAt:'2026-11-20',manualScorePrevious:{us:25,opponent:21}}],
  manualFinalResult:{active:true,us:3,opponent:0},
  video:{source:'cam',syncOffset:'7.5',preRoll:3,clips:[{id:'c1'}]}};
 function compare(expectedVersion){
  const a=old.normalize(input),b=current.normalize(input);
  assert.deepStrictEqual(json(b),json(a));
  assert.deepStrictEqual(Object.keys(b),Object.keys(a));
  assert.deepStrictEqual(Object.keys(b.video),Object.keys(a.video));
  assert.deepStrictEqual(Object.keys(b.sets[0]),Object.keys(a.sets[0]));
  assert.equal(b.dataVersion,expectedVersion);
  assert.strictEqual(b,current.context.lastBase);
 }
 compare('6.9.0');
 current.videoContainer();old.videoContainer();compare('6.10.1');
 assert.equal(current.diagnostics().finalizationEnabled,false);
 current.finalization();old.finalization();compare('6.10.7');
 current.videoOverlay();old.videoOverlay();compare('7.0.1');
 current.manualResult();old.manualResult();compare('8.6.1');
 assert.deepStrictEqual(current.diagnostics(),{
  typed:3,native:0,mismatches:0,exceptions:0,finalizationEnabled:true});
 assert.equal(current.context.calls,5);assert.equal(old.context.calls,5);
});

test('1,280 persisted combinations retain finalization, video and manual scores',async()=>{
 const bridge=(await compiled()).installMatchFinalizationBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.videoContainer();current.videoContainer();old.finalization();current.finalization();
 old.videoOverlay();current.videoOverlay();old.manualResult();current.manualResult();
 let total=0;
 for(const manualSavedAt of [null,'',0,'2026-11-20',true])
 for(const reopenedAt of [null,'2026',0,''])
 for(const finalizedByUser of [false,true,0,'yes'])
 for(const resultComplete of [false,true,'',null])
 for(const resultCompleteAt of [null,'2026',1,0]){
  const input={id:33,manualSavedAt,reopenedAt,finalizedByUser,resultComplete,resultCompleteAt,
   workflow:{events:[]},video:{syncOffset:2.5,preRoll:2,postRoll:3,clips:[{id:4}]},
   sets:[{number:1,finished:true,scoreUs:25,scoreOpponent:22,manualFinished:true,
    manualScorePrevious:{us:'24',opponent:22},rallies:[{id:3,videoStart:'5.5',videoEnd:'9.5'}]}],
   manualFinalResult:{active:true,us:3,opponent:1}};
  const before=JSON.stringify(input),a=old.normalize(input),b=current.normalize(input);
  assert.deepStrictEqual(json(b),json(a));
  assert.deepStrictEqual(Object.keys(b),Object.keys(a));
  assert.deepStrictEqual(Object.keys(b.video),Object.keys(a.video));
  assert.deepStrictEqual(Object.keys(b.sets[0]),Object.keys(a.sets[0]));
  assert.strictEqual(b.video.clips,input.video.clips);
  assert.equal(JSON.stringify(input),before);
  total++;
 }
 assert.equal(total,1280);
 assert.equal(current.context.calls,total);assert.equal(old.context.calls,total);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:total,native:0,mismatches:0,exceptions:0,finalizationEnabled:true});
});

test('incompatible, missing, incorrect and throwing bridge retains the archived writer',async()=>{
 const good=(await compiled()).installMatchFinalizationBridge({});
 for(const bridge of [null,
  {VERSION:'20.5.53',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.54',pureOnly:true,normalize:()=>null},
  {VERSION:'20.5.54',pureOnly:true,normalize:()=>({manualSavedAt:'bad'})},
  {VERSION:'20.5.54',pureOnly:true,normalize:()=>{throw Error('Vite unavailable')}},
  {VERSION:'20.5.54',pureOnly:true,normalize:()=>({...good.normalize({}),manualSavedAt:'wrong'})}]){
  const old=harness('old'),current=harness('new',bridge);
  old.finalization();current.finalization();
  const input={id:6,manualSavedAt:'2026-11-20',finalizedByUser:true,resultComplete:true};
  assert.deepStrictEqual(json(current.normalize(input)),json(old.normalize(input)));
  assert.equal(current.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.54')assert.ok(current.diagnostics().mismatches+current.diagnostics().exceptions>0);
 }
});

test('finalization getters preserve historical read counts with native fallback',async()=>{
 const bridge=(await compiled()).installMatchFinalizationBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.finalization();current.finalization();
 function input(counter){return {id:50,manualSavedAt:'2026-11-20',
  get reopenedAt(){counter.reads++;return '2026-11-20T12:00:00Z'},
  finalizedByUser:true,sets:[]};}
 const before={reads:0},after={reads:0};
 assert.deepStrictEqual(json(current.normalize(input(after))),json(old.normalize(input(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(current.diagnostics().native,1);
});

test('V20.5.54 keeps score, video and cloud writers without secondary match wrapper',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.68');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20554-match-finalization-unification.test.cjs'));
 for(const file of ['021-core-scouting-v150-monolithic.js',
  '213-vc2021-scouting-speed-pro.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(file+'?v=20.5.68'),file);
 assert.ok(sw.includes('match-finalization-20.5.54'));
 assert.equal((source.match(/scoutNormalizeMatch=function\(/g)||[]).length,1);
 assert.ok(source.includes('v20554FinalizationReady=true'));
 assert.ok(!source.includes('const v6102NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('const v690NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20551VideoOverlayReady=true'));
 assert.ok(source.includes('v20552ManualResultReady=true'));
 assert.ok(source.includes('v20553RallyVideoReady=true'));
 assert.ok(source.includes('const v700SaveBase=scoutSave'));
 assert.ok(source.includes('const v861SetsScoreBase=scoutSetsScore'));
 assert.ok(read('src/vc2055-entry.ts').includes('installMatchFinalizationBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20554MatchFinalize'));
 const pure=read('src/domain/scout-match-finalization-fields.ts'),
  runtime=read('src/domain/scout-match-finalization-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.ok(!pure.includes(forbidden)&&!runtime.includes(forbidden),forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
