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
const old=read('test-audit/fixtures/v20550-finalization-video-normalizers.txt');
function part(text,start,end){
 const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'extract '+start);
 return text.slice(a,b);
}
const modern=part(source,'/* V20.5.51 · V6.10.2 finalization',
 'scoutingMatches=scoutingMatches.map(scoutNormalizeMatch);');
const oldFirst=part(old,'const v6102NormMatchBase=scoutNormalizeMatch;',
 '/* V7.0 · Historical video overlay');
const oldSecond=old.slice(old.indexOf('const v700NormMatchBase=scoutNormalizeMatch;'));
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({
  window:mode==='new'&&bridge?{VC_SCOUT_VIDEO_OVERLAY_20551:bridge}:{},
  calls:0,lastBase:null,
  scoutArr:v=>Array.isArray(v)?v:[],
  V6102_VERSION:'6.10.7',V700_VERSION:'7.0.1'
 });
 const base=`var scoutNormalizeMatch=function(m){calls++;
   const video=m?.video;
   const x={...(m||{}),dataVersion:'6.10.1',
     video:{syncOffset:video?.syncOffset==null?null:Number(video.syncOffset),
       source:String(video?.source||''),clips:Array.isArray(video?.clips)?video.clips:[]},
     baseMarker:'preserved'};
   lastBase=x;return x;};`;
 vm.runInContext(base+'\n'+(mode==='new'?modern:oldFirst),context,{timeout:5000});
 return {normalize:m=>context.scoutNormalizeMatch(m),context,
  advance:()=>vm.runInContext(mode==='new'
   ?'v20551VideoOverlayVersion=V700_VERSION;v20551VideoOverlayReady=true;'
   :oldSecond,context,{timeout:5000}),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_VIDEO_OVERLAY_DIAGNOSTICS_20551()):null};
}

test('V20.5.51 publishes an immutable pure video overlay with clip and anchor identity',async()=>{
 const domain=await compiled(),holder={},api=domain.installMatchVideoOverlayBridge(holder);
 assert.equal(api.VERSION,'20.5.51');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_VIDEO_OVERLAY_20551,api);
 assert.strictEqual(domain.installMatchVideoOverlayBridge(holder),api);
 const anchor={scoutMs:3500,time:12},clips=[{id:3}];
 const input={video:{syncOffset:'7.25',source:'camera',anchor,clips,preRoll:'3',postRoll:2}};
 const result=domain.normalizeMatchVideoOverlay(input,{video:{source:'old',clips}});
 assert.equal(result.syncOffset,7.25);
 assert.equal(result.preRoll,3);
 assert.strictEqual(result.anchor,anchor);
 assert.strictEqual(result.clips,clips);
 assert.equal(JSON.stringify(input.video.anchor),JSON.stringify(anchor));
});

test('historical V6.10.2 finalization remains distinct from later V7.0 video initialization',async()=>{
 const bridge=(await compiled()).installMatchVideoOverlayBridge({});
 const historical=harness('old'),modern=harness('new',bridge);
 const input={id:90,manualSavedAt:'2026-11-19',reopenedAt:'',finalizedByUser:true,
  resultComplete:true,resultCompleteAt:'2026-11-20',
  video:{source:'camera',syncOffset:'5.5',fileSize:4096,lastModified:100,
   mimeType:'video/mp4',duration:'70.5',preRoll:3,postRoll:2,clips:[{id:5}]}};
 const firstOld=historical.normalize(input),firstNew=modern.normalize(input);
 assert.deepStrictEqual(json(firstNew),json(firstOld));
 assert.equal(firstNew.dataVersion,'6.10.7');
 assert.equal(firstNew.video.fileSize,undefined,'V7.0 overlay is not applied early');
 assert.deepStrictEqual(modern.diagnostics(),{
  typed:0,native:0,mismatches:0,exceptions:0,videoEnabled:false});
 historical.advance();modern.advance();
 const secondOld=historical.normalize(firstOld),secondNew=modern.normalize(firstNew);
 assert.deepStrictEqual(json(secondNew),json(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew),Object.keys(secondOld));
 assert.deepStrictEqual(Object.keys(secondNew.video),Object.keys(secondOld.video));
 assert.equal(secondNew.dataVersion,'7.0.1');
 assert.equal(secondNew.video.fileSize,0,'the earlier container has no file size to infer');
 assert.equal(secondNew.finalizedByUser,true);
 assert.strictEqual(secondNew,modern.context.lastBase);
 assert.deepStrictEqual(modern.diagnostics(),{
  typed:1,native:0,mismatches:0,exceptions:0,videoEnabled:true});
});

test('1,200 archived metadata combinations retain exact V7.0 clips, timings and defaults',async()=>{
 const api=(await compiled()).installMatchVideoOverlayBridge({});
 const historical=harness('old'),modern=harness('new',api);
 historical.advance();modern.advance();
 let count=0;
 for(const syncOffset of [null,'',0,'0','3.5',NaN,-4,Infinity,'bad',12.5])
 for(const duration of [null,'',0,'10.75',NaN])
 for(const preRoll of [null,0,2,'5.25',-3,NaN])
 for(const anchor of [null,{}, {scoutMs:2000,videoTime:8},'wrong']){
  const input={id:7,video:{syncOffset,source:count%2?'cam-a':'',
    duration,preRoll,postRoll:count%3?2:'bad',anchor,
    fileSize:count%2?1024:'invalid',lastModified:count%2?20:-5,
    mimeType:'video/mp4',syncedAt:count%3?'2026-11-20':'',
    clips:count%2?[{id:12}]:[]},manualSavedAt:count%4?'2026-11-19':null,
    finalizedByUser:count%2===0,videoSource:'sensitive',
    resultComplete:count%5===0};
  const before=JSON.stringify(input);
  const oldResult=historical.normalize(input),newResult=modern.normalize(input);
  assert.deepStrictEqual(json(newResult),json(oldResult));
  assert.equal(Object.is(newResult.video.syncOffset,oldResult.video.syncOffset),true);
  assert.equal(Object.is(newResult.video.duration,oldResult.video.duration),true);
  assert.equal(Object.is(newResult.video.preRoll,oldResult.video.preRoll),true);
  assert.equal(JSON.stringify(input),before);
  assert.strictEqual(newResult.video.clips,input.video.clips);
  count++;
 }
 assert.equal(count,1200);
 assert.equal(historical.context.calls,count);
 assert.equal(modern.context.calls,count);
 assert.deepStrictEqual(modern.diagnostics(),{
  typed:count,native:0,mismatches:0,exceptions:0,videoEnabled:true});
});

test('absent, corrupt and throwing bridge always keeps the original V7.0 overlay',async()=>{
 const good=(await compiled()).installMatchVideoOverlayBridge({});
 const invalid=[null,
  {VERSION:'20.5.50',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.51',pureOnly:true,normalize:()=>({source:'WRONG'})},
  {VERSION:'20.5.51',pureOnly:true,normalize:()=>{throw Error('bundle unavailable')}},
  {VERSION:'20.5.51',pureOnly:true,normalize:()=>null},
  {VERSION:'20.5.51',pureOnly:true,normalize:(m,x)=>({...good.normalize(m,x),preRoll:99})}];
 for(const bridge of invalid){
  const historic=harness('old'),current=harness('new',bridge);
  historic.advance();current.advance();
  const input={id:70,video:{syncOffset:7,source:'video',fileSize:1000,
   preRoll:3,postRoll:2,anchor:{videoTime:7},clips:[{id:1}]}};
  assert.deepStrictEqual(json(current.normalize(input)),json(historic.normalize(input)));
  assert.equal(current.context.calls,1);
  assert.equal(current.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.51')assert.ok(current.diagnostics().mismatches+current.diagnostics().exceptions>0);
 }
});

test('accessor-backed video inputs stay native with the same getter access count',async()=>{
 const bridge=(await compiled()).installMatchVideoOverlayBridge({});
 const historical=harness('old'),modern=harness('new',bridge);
 historical.advance();modern.advance();
 function input(counter){return {id:55,video:{source:'cam',
  get preRoll(){counter.count++;return 4},postRoll:2,
  syncOffset:7,clips:[]},resultComplete:true};}
 const before={count:0},after={count:0};
 assert.deepStrictEqual(json(modern.normalize(input(after))),json(historical.normalize(input(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(modern.diagnostics().native,1);
});

test('V20.5.51 removes only the V7.0 match wrapper, preserving V7.0 video and score paths',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.51');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20551-video-overlay-consolidation.test.cjs'));
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(file+'?v=20.5.51'),file);
 assert.ok(sw.includes('match-video-overlay-20.5.51'));
 assert.ok(source.includes('const v6102NormMatchBase=scoutNormalizeMatch'));
 assert.ok(!source.includes('const v700NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('v20551VideoOverlayVersion=V700_VERSION'));
 assert.ok(source.includes('v20551VideoOverlayReady=true'));
 assert.ok(source.includes('const v700NormRallyBase=scoutNormalizeRally'));
 assert.ok(source.includes('const v700SaveBase=scoutSave'));
 assert.ok(source.includes('const v861NormBase=scoutNormalizeMatch'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installMatchVideoOverlayBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20551VideoOverlay'));
 const pure=read('src/domain/scout-match-video-overlay.ts'),
  runtime=read('src/domain/scout-match-video-overlay-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
