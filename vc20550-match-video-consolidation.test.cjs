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
const old=read('test-audit/fixtures/v20549-match-video-normalizers.txt');
function part(text,start,end){
 const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'extract '+start);
 return text.slice(a,b);
}
const modern=part(source,'/* V20.5.50 · V6.9 workflow','scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);');
const oldFirst=part(old,'const v690NormMatchBase=scoutNormalizeMatch;',
 '/* V6.10.0 · Historical video/rally');
const oldSecond=old.slice(old.indexOf('const v6100NormMatchBase=scoutNormalizeMatch;'));
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({
  window:mode==='new'&&bridge?{VC_SCOUT_MATCH_VIDEO_20550:bridge}:{},
  calls:0,lastBase:null,
  scoutArr:v=>Array.isArray(v)?v:[],
  V690_VERSION:'6.9.0',V6100_VERSION:'6.10.1',
  v690NormalizeWorkflow:raw=>({...(raw||{}),workflowNormalized:true})
 });
 const base=`var scoutNormalizeMatch=function(m){calls++;
   const x={...(m||{}),dataVersion:'6.8.0',sets:Array.isArray(m?.sets)?m.sets.map(s=>({
    ...s,rallies:Array.isArray(s?.rallies)?s.rallies.map(r=>({...r})):[]})):[],
    video:m?.video&&typeof m.video==='object'?{...m.video}:m?.video,
    baseMarker:'preserved'};
   lastBase=x;return x;};`;
 vm.runInContext(base+'\n'+(mode==='new'?modern:oldFirst),context,{timeout:5000});
 return {normalize:m=>context.scoutNormalizeMatch(m),context,
  advance:()=>vm.runInContext(mode==='new'?'v20550MatchVideoReady=true;':oldSecond,context,{timeout:5000}),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_MATCH_VIDEO_DIAGNOSTICS_20550()):null};
}

test('V20.5.50 installs the immutable pure TypeScript match-video bridge once',async()=>{
 const domain=await compiled(),holder={},api=domain.installScoutMatchVideoContainerBridge(holder);
 assert.equal(api.VERSION,'20.5.50');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_MATCH_VIDEO_20550,api);
 assert.strictEqual(domain.installScoutMatchVideoContainerBridge(holder),api);
 const clips=[{id:'clip'}],original={video:{syncOffset:'3.25',source:'camera',clips}};
 const projection=domain.normalizeScoutingMatchVideoContainer(original);
 assert.deepStrictEqual(json(projection),{syncOffset:3.25,source:'camera',clips:[{id:'clip'}]});
 assert.strictEqual(projection.clips,clips,'do not copy stored clips');
 assert.deepStrictEqual(original.video,{syncOffset:'3.25',source:'camera',clips});
});

test('saved matches retain exact V6.9 then V6.10.0 normalization boundaries',async()=>{
 const good=(await compiled()).installScoutMatchVideoContainerBridge({});
 const historical=harness('old'),current=harness('new',good);
 const input={id:101,workflow:{events:[{id:1}],setLineups:{}},
  video:{syncOffset:'7.25',source:'camera A',clips:[{id:12}]},
  sets:[{number:1,rallies:[{id:3,videoStart:'1.5',videoEnd:'4.25',scoreUs:5}]},
    {number:2,rallies:[{id:4,videoStart:null,videoEnd:'invalid'}]}]};
 const firstOld=historical.normalize(input),firstNew=current.normalize(input);
 assert.deepStrictEqual(json(firstNew),json(firstOld));
 assert.equal(firstNew.dataVersion,'6.9.0');
 assert.equal(firstNew.sets[0].rallies[0].videoStart,'1.5','not converted before V6.10.0');
 assert.deepStrictEqual(current.diagnostics(),{
  typed:0,native:0,mismatches:0,exceptions:0,videoEnabled:false});
 historical.advance();current.advance();
 const secondOld=historical.normalize(firstOld),secondNew=current.normalize(firstNew);
 assert.deepStrictEqual(json(secondNew),json(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew),Object.keys(secondOld),'property order unchanged');
 assert.equal(secondNew.dataVersion,'6.10.1');
 assert.equal(secondNew.sets[0].rallies[0].videoStart,1.5);
 assert.equal(secondNew.sets[0].rallies[0].videoEnd,4.25);
 assert.equal(secondNew.sets[1].rallies[0].videoEnd,Number('invalid'));
 assert.strictEqual(secondNew.video.clips,input.video.clips);
 assert.strictEqual(secondNew,current.context.lastBase);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:1,native:0,mismatches:0,exceptions:0,videoEnabled:true});
 assert.equal(current.context.calls,2);assert.equal(historical.context.calls,2);
});

test('1,200 combinations preserve every video field and rally timestamp after match reload',async()=>{
 const bridge=(await compiled()).installScoutMatchVideoContainerBridge({});
 const native=harness('old'),typed=harness('new',bridge);
 native.advance();typed.advance();
 let count=0;
 for(const syncOffset of [null,'',0,'0',-1,3.5,NaN,Infinity,'bad',12.5])
 for(const source of ['camera','',null,'video-1',123,' local '])
 for(const clips of [undefined,null,[],[{id:'c-1'}]])
 for(const videoStart of [null,'',-3,'7.25',NaN]){
  const match={id:42,video:{syncOffset,source,clips},workflow:{events:[]},
   sets:[{number:1,rallies:[{id:1,videoStart,videoEnd:'8.5',videoExactSourceKey:'private'},
    {id:2,videoStart:'invalid',videoEnd:null}]}]};
  const before=JSON.stringify(match),was=native.normalize(match),now=typed.normalize(match);
  assert.deepStrictEqual(json(now),json(was));
  assert.equal(Object.is(now.video.syncOffset,was.video.syncOffset),true);
  assert.equal(Object.is(now.sets[0].rallies[0].videoStart,was.sets[0].rallies[0].videoStart),true);
  assert.equal(JSON.stringify(match),before,'original match stays unchanged');
  assert.equal(now.baseMarker,'preserved');
  count++;
 }
 assert.equal(count,1200);
 assert.equal(native.context.calls,count);
 assert.equal(typed.context.calls,count);
 assert.deepStrictEqual(typed.diagnostics(),{
  typed:count,native:0,mismatches:0,exceptions:0,videoEnabled:true});
});

test('missing, incompatible, corrupt and throwing bridges always use native match video',async()=>{
 const good=(await compiled()).installScoutMatchVideoContainerBridge({});
 const invalid=[null,
  {VERSION:'20.5.49',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.50',pureOnly:true,normalize:()=>({source:'WRONG',clips:[],syncOffset:8})},
  {VERSION:'20.5.50',pureOnly:true,normalize:()=>{throw Error('bundle failed')}},
  {VERSION:'20.5.50',pureOnly:true,normalize:()=>null}];
 for(const bridge of invalid){
  const oldRun=harness('old'),newRun=harness('new',bridge);
  oldRun.advance();newRun.advance();
  const match={id:9,video:{source:'video',syncOffset:4.5,clips:[{id:20}]},
   sets:[{number:1,rallies:[{videoStart:'8.5',videoEnd:10}]}]};
  assert.deepStrictEqual(json(newRun.normalize(match)),json(oldRun.normalize(match)));
  assert.equal(newRun.diagnostics().native,1);
  assert.equal(newRun.context.calls,1);
  if(bridge?.VERSION==='20.5.50')assert.ok(newRun.diagnostics().mismatches+newRun.diagnostics().exceptions>0);
 }
});

test('nested video accessors keep native read counts with no extra TypeScript access',async()=>{
 const bridge=(await compiled()).installScoutMatchVideoContainerBridge({});
 const oldRun=harness('old'),newRun=harness('new',bridge);
 oldRun.advance();newRun.advance();
 function input(counter){return {id:71,video:{
  get syncOffset(){counter.reads++;return '5.75'},source:'camera',clips:[]},
  sets:[{number:1,rallies:[{id:1,videoStart:'1',videoEnd:'2'}]}]};}
 const before={reads:0},after={reads:0};
 assert.deepStrictEqual(json(newRun.normalize(input(after))),json(oldRun.normalize(input(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(newRun.diagnostics().native,1);
});

test('V20.5.50 removes only the duplicate match wrapper and preserves score/video writers',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.5');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20550-match-video-consolidation.test.cjs'));
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(file+'?v=20.6.5'),file);
 assert.ok(sw.includes('match-video-container-20.5.50'));
 assert.ok(source.includes('const v690NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20550MatchVideoReady=true'));
 assert.ok(!source.includes('const v6100NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20551VideoOverlayVersion=V700_VERSION'));
 assert.ok(!source.includes('const v700NormMatchBase=scoutNormalizeMatch'));
 assert.ok(!source.includes('const v861NormBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20552ManualResultReady=true'));
 assert.ok(source.includes('const v6100PushBase=scoutPushAction'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutMatchVideoContainerBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20550MatchVideo'));
 const pure=read('src/domain/scout-match-video-container.ts'),
  runtime=read('src/domain/scout-match-video-container-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
