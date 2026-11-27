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
const historicBase=read('test-audit/fixtures/v20552-base-rally-normalizer.txt');
const historicWrapper=read('test-audit/fixtures/v20552-rally-video-normalizer.txt');
const begin=source.indexOf('/* V20.5.53 · One rally normalizer');
const finish=source.indexOf('function scoutEmptyLineup()',begin);
const first=source.indexOf('function scoutNormalizeRally(r)');
const last=source.indexOf('function scoutNormalizeSet(',first);
assert.ok(begin>0&&finish>begin&&first>finish&&last>first);
const modernPrelude=source.slice(begin,finish);
const modernRally=source.slice(first,last);
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({
  window:mode==='new'&&bridge?{VC_SCOUT_RALLY_VIDEO_20553:bridge}:{},
  scoutArr:x=>Array.isArray(x)?x:[],scoutNow:()=> '2026-11-20T10:00:00.000Z',
  scoutNormalizeLineup:x=>({...x}),scoutNormalizeLibero:x=>({...x}),
  scoutNormalizeRoles:x=>({...x}),scoutNormalizeAction:x=>({...x})
 });
 vm.runInContext(mode==='new'?modernPrelude+'\n'+modernRally:historicBase,context,{timeout:5000});
 return {
  normalize:r=>context.scoutNormalizeRally(r),context,
  advance:()=>vm.runInContext(mode==='new'?'v20553RallyVideoReady=true;':historicWrapper,
   context,{timeout:5000}),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_RALLY_VIDEO_DIAGNOSTICS_20553()):null
 };
}

test('V20.5.53 publishes one immutable pure rally-video bridge',async()=>{
 const domain=await compiled(),holder={},api=domain.installRallyVideoBoundsBridge(holder);
 assert.equal(api.VERSION,'20.5.53');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_RALLY_VIDEO_20553,api);
 assert.strictEqual(domain.installRallyVideoBoundsBridge(holder),api);
 const source={id:3,videoStart:'8.5',videoEnd:null};
 assert.deepStrictEqual(json(domain.normalizeRallyVideoBounds(source)),{
  videoStart:8.5,videoEnd:null});
 assert.equal(source.videoStart,'8.5');
});

test('rally video fields become normalized at V7.0, not during early match recovery',async()=>{
 const api=(await compiled()).installRallyVideoBoundsBridge({});
 const old=harness('old'),current=harness('new',api);
 const input={id:17,setNumber:2,videoStart:'7.75',videoEnd:'13.5',
  actions:[{id:1,code:'12S#'}],lineupBefore:{ours:{}},scoreBefore:{us:4,opponent:3}};
 const firstOld=old.normalize(input),firstNew=current.normalize(input);
 assert.deepStrictEqual(json(firstNew),json(firstOld));
 assert.equal(firstNew.videoStart,'7.75');
 assert.deepStrictEqual(current.diagnostics(),{
  typed:0,native:0,mismatches:0,exceptions:0,videoEnabled:false});
 old.advance();current.advance();
 const secondOld=old.normalize(input),secondNew=current.normalize(input);
 assert.deepStrictEqual(json(secondNew),json(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew),Object.keys(secondOld));
 assert.equal(secondNew.videoStart,7.75);
 assert.equal(secondNew.videoEnd,13.5);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:1,native:0,mismatches:0,exceptions:0,videoEnabled:true});
});

test('1,000 stored rallies exactly retain timing, action fields and property order',async()=>{
 const api=(await compiled()).installRallyVideoBoundsBridge({});
 const old=harness('old'),current=harness('new',api);
 old.advance();current.advance();
 let total=0;
 for(const videoStart of [null,undefined,'',0,'0','7.5',-4,NaN,Infinity,'bad'])
 for(const videoEnd of [null,undefined,'',0,'8.5',-1,NaN,Infinity,'bad',12.5])
 for(const mode of [0,1,2,3,4])
 for(const archived of [false,true]){
  const input={id:12+mode,setNumber:1,videoStart,videoEnd,
   servingBefore:mode%2?'opponent':'ours',rotationBefore:mode+1,
   scoreBefore:{us:mode,opponent:0},scoreAfter:{us:mode+1,opponent:0},
   actions:[{id:5,code:'10A#',videoStart:3}],lineupBefore:{ours:{p1:8}}};
  if(archived)input.extraField={clipId:'c1'};
  const before=JSON.stringify(input),a=old.normalize(input),b=current.normalize(input);
  assert.deepStrictEqual(json(b),json(a));
  assert.deepStrictEqual(Object.keys(b),Object.keys(a));
  assert.equal(Object.is(b.videoStart,a.videoStart),true);
  assert.equal(Object.is(b.videoEnd,a.videoEnd),true);
  assert.equal(JSON.stringify(input),before);
  total++;
 }
 assert.equal(total,1000);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:total,native:0,mismatches:0,exceptions:0,videoEnabled:true});
});

test('absent, incompatible, malformed and throwing bridge leaves V7.0 result intact',async()=>{
 const good=(await compiled()).installRallyVideoBoundsBridge({});
 for(const bridge of [null,
  {VERSION:'20.5.52',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.53',pureOnly:true,normalize:()=>null},
  {VERSION:'20.5.53',pureOnly:true,normalize:()=>({videoStart:999,videoEnd:12})},
  {VERSION:'20.5.53',pureOnly:true,normalize:()=>({videoStart:4})},
  {VERSION:'20.5.53',pureOnly:true,normalize:()=>{throw Error('bundle unavailable')}}]){
  const old=harness('old'),current=harness('new',bridge);
  old.advance();current.advance();
  const input={id:25,videoStart:'3.5',videoEnd:'17.25',actions:[]};
  assert.deepStrictEqual(json(current.normalize(input)),json(old.normalize(input)));
  assert.equal(current.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.53')assert.ok(current.diagnostics().mismatches+current.diagnostics().exceptions>0);
 }
});

test('video timestamp getters are read only as often as in V20.5.52',async()=>{
 const bridge=(await compiled()).installRallyVideoBoundsBridge({});
 const old=harness('old'),current=harness('new',bridge);
 old.advance();current.advance();
 function input(counter){return {id:80,actions:[],get videoStart(){counter.start++;return '2.5'},
  get videoEnd(){counter.end++;return '12.25'}};}
 const before={start:0,end:0},after={start:0,end:0};
 assert.deepStrictEqual(json(current.normalize(input(after))),json(old.normalize(input(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(current.diagnostics().native,1);
});

test('V20.5.53 removes only the V7.0 rally wrapper, not video mapping or scoring',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.7.2');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20553-rally-video-consolidation.test.cjs'));
 for(const file of ['021-core-scouting-v150-monolithic.js',
  '213-vc2021-scouting-speed-pro.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(file+'?v=20.7.0'),file);
 assert.ok(sw.includes('rally-video-20.5.53'));
 assert.ok(!source.includes('const v700NormRallyBase=scoutNormalizeRally'));
 assert.ok(source.includes('v20553RallyVideoReady=true'));
 assert.ok(source.includes('function scoutNormalizeRally(r){const x='));
 assert.ok(source.includes('scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);scoutingMatches.forEach(m=>{if(m.video?.syncOffset!=null)v700ApplyMapping(m)});'));
 assert.ok(source.includes('const v700SaveBase=scoutSave'));
 assert.ok(source.includes('const v861SetsScoreBase=scoutSetsScore'));
 assert.ok(source.includes('v20552ManualResultReady=true'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRallyVideoBoundsBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20553RallyVideo'));
 const pure=read('src/domain/scout-rally-video-bounds.ts'),
  runtime=read('src/domain/scout-rally-video-bounds-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.ok(!pure.includes(forbidden)&&!runtime.includes(forbidden),forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
