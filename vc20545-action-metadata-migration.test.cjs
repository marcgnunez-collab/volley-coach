'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const code=read('021-core-scouting-v150-monolithic.js');
const workspace=read('077-v132-scouting-pro-workspace.js');
const json=value=>JSON.parse(JSON.stringify(value));
function part(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'extract '+start);
 return source.slice(a,b);
}
const helpers=part(code,'function v880BaseToken(token){','function v880CoordClone(c){');
const dvSource=part(code,'function v880NativeDataVolleyFields(action',
 '/* V20.5.48 · One field projection replaces');
const timeSource=part(workspace,'/* V20.5.45 · V13.2','function readonly(){');
const legacySource=read('test-audit/fixtures/v20544-action-metadata.txt');

function makeHarness(mode,bridge,match={servingTeam:'ours',liveRally:{actions:[]}}){
 const root=mode==='modern'?{VC_SCOUT_ACTION_METADATA_20545:bridge}:{};
 const context={window:root,scoutArr:v=>Array.isArray(v)?v:[],
  scoutActive:()=>match};
 const script=mode==='modern'?helpers+'\n'+dvSource+'\n'+timeSource:helpers+'\n'+legacySource;
 vm.runInNewContext(script,context,{timeout:4000});
 return {dv:a=>json(context.v880DataVolleyFields(a,match)),
  time:a=>mode==='modern'?context.actionTime(a):context.actionTime(a),
  normalized:(raw,x)=>mode==='modern'?context.v132ChooseTime('normalize',raw,x,context.v132NativeNormalizeTime(raw,x)):
   context.normalizeVideoTimestamp(raw,x),
  stats:()=>mode==='modern'?{dv:json(root.VC_SCOUT_DV_METADATA_DIAGNOSTICS_20545()),
   time:json(root.VC_SCOUT_VIDEO_METADATA_DIAGNOSTICS_20545())}:null};
}

test('V20.5.45 metadata bridge installs once and never mutates a rally or video source',async()=>{
 const lib=await compiled(),holder={},bridge=lib.installScoutActionMetadataBridge(holder);
 assert.equal(bridge.VERSION,'20.5.45');assert.equal(bridge.pureOnly,true);
 assert.ok(Object.isFrozen(bridge));
 assert.equal(bridge,lib.installScoutActionMetadataBridge(holder));
 assert.equal(holder.VC_SCOUT_ACTION_METADATA_20545,bridge);
 const action={team:'ours',skill:'R',evaluation:'+',endZone:'6D',
  videoTime:12.345,videoExact:true,videoExactSourceKey:'private-camera'};
 const match={servingTeam:'opponent',liveRally:{actions:[
  {id:4,team:'opponent',skill:'S',startZone:'1A',endZone:'6D',videoTime:12.0}]}};
 const before=JSON.stringify({action,match});
 assert.deepStrictEqual(json(bridge.dvFields(action,match)),{
  contactZone:'6D',dvStartZone:'1',dvEndZone:'6',dvEndSubzone:'D',dvEndCone:null,
  dvSourceActionId:4,dvPointPhase:'Sideout',dvPhase:'Transition',dvAttackPhase:''});
 assert.equal(bridge.actionTime(action),12.345);
 assert.equal(JSON.stringify({action,match}),before);
});

test('typed DataVolley contacts match archived V20.5.44 fields across skills, phases and cones',async()=>{
 const bridge=(await compiled()).installScoutActionMetadataBridge({});
 const teams=['ours','opponent'],skills=['S','R','D','A','B','E'],
  starts=['','4B','2','8A'],ends=['','6D','1','9B'];
 let checked=0;
 for(const team of teams)for(const skill of skills)for(const startZone of starts)
 for(const endZone of ends)for(const endCone of [null,5]){
  const match={servingTeam:checked%2?'ours':'opponent',liveRally:{actions:[
   {id:21,team:'opponent',skill:'S',startZone:'1B',endZone:'6C'},
   {id:22,team:'ours',skill:'A',startZone:'4A',endZone:'5D'},
   {id:23,team:'ours',skill:'S',startZone:'1C',endZone:'5A'},
   {id:24,team:'opponent',skill:'A',startZone:'2D',endZone:'1A'}]}};
  const a={team,skill,evaluation:'#',startZone,endZone,endCone,
   contactZone:skill==='R'||skill==='D'?(endZone||startZone):'',
   dvStartZone:checked%4?'':'5B',dvEndZone:'',dvEndSubzone:'',
   dvSourceActionId:checked%3?null:10,phase:checked%2?'K1':'K2',
   videoExactSourceKey:'PRIVATE',videoTime:1.3};
  const original=JSON.stringify({a,match});
  const old=makeHarness('legacy',null,match),modern=makeHarness('modern',bridge,match);
  assert.deepStrictEqual(modern.dv(a),old.dv(a),JSON.stringify(a));
  assert.equal(JSON.stringify({a,match}),original);
  assert.deepStrictEqual(modern.stats().dv,{typed:1,native:0,mismatches:0,exceptions:0});
  checked++;
 }
 assert.equal(checked,384);
});

test('typed and historical timestamp priorities agree for invalid, negative and exact video times',async()=>{
 const bridge=(await compiled()).installScoutActionMetadataBridge({});
 const native=makeHarness('legacy'),modern=makeHarness('modern',bridge);
 const values=[undefined,null,'',0,'0',-3,-0.5,'-8','NaN',NaN,Infinity,12.345,'15.5','abc',{},false];
 let count=0;
 for(const a of values)for(const b of values){
  const action={videoTimestamp:a,liveVideoTime:b,videoAction:4.25,videoTime:8.5,
   videoExact:true,clipId:'clip-private'};
  const normalized={videoAction:b,videoTime:6.75};
  assert.equal(modern.time(action),native.time(action));
  assert.equal(modern.normalized(action,normalized),native.normalized(action,normalized));
  count++;
 }
 assert.equal(count,256);
 assert.deepStrictEqual(modern.stats().time,{typedAction:count,typedNormalize:count,
  native:0,mismatches:0,exceptions:0});
});

test('contact overlay recomputes after native registration without overwriting source timestamps',async()=>{
 const bridge=(await compiled()).installScoutActionMetadataBridge({});
 const match={servingTeam:'opponent',liveRally:{actions:[
  {id:10,skill:'S',team:'opponent',startZone:'1',endZone:'6A',videoTime:3.5}]}};
 const action={id:11,skill:'R',team:'ours',contactZone:'6A',endZone:'6A',
  videoTime:4.123,liveVideoTime:4.123,videoTimestamp:4.123,
  videoExactSourceKey:'video-opaque',scoutMs:8000};
 const old=makeHarness('legacy',null,match),modern=makeHarness('modern',bridge,match);
 const before=json(action);
 const originalFirst=old.dv(action),typedFirst=modern.dv(action);
 assert.deepStrictEqual(typedFirst,originalFirst);
 const saved={...action,...typedFirst};match.liveRally.actions.push(saved);
 assert.deepStrictEqual(modern.dv(saved),old.dv(saved));
 assert.equal(saved.videoTime,4.123);
 assert.equal(saved.videoTimestamp,4.123);
 assert.equal(saved.videoExactSourceKey,'video-opaque');
 assert.deepStrictEqual(action,before);
});

test('real V13.2 normalization wrapper calls its native base once and retains video identity',async()=>{
 const bridge=(await compiled()).installScoutActionMetadataBridge({});
 const wrapper=part(workspace,"try{if(typeof window.scoutNormalizeAction==='function'",
  "try{if(typeof window.scoutPushAction==='function'");
 const window={VC_SCOUT_ACTION_METADATA_20545:bridge};
 let calls=0;
 window.scoutNormalizeAction=a=>{calls++;return {...a,videoAction:7.25}};
 const context={window};
 vm.runInNewContext(timeSource+'\n'+wrapper,context,{timeout:3000});
 for(const action of [
  {videoTime:5.5,videoExactSourceKey:'private',clipId:'c-1'},
  {videoTimestamp:-3,videoTime:1.25,liveVideoTime:9.75},
  {videoTimestamp:'',videoTime:2.5,videoAction:null},
  {videoTimestamp:10.125,videoExactTime:10.125,scoutMs:12000}]){
  const normalized=window.scoutNormalizeAction(action);
  assert.equal(normalized.videoTimestamp,bridge.normalizeTime(action,{...action,videoAction:7.25}));
  assert.equal(normalized.videoExactSourceKey,action.videoExactSourceKey);
  assert.equal(normalized.clipId,action.clipId);
  assert.equal(normalized.scoutMs,action.scoutMs);
 }
 assert.equal(calls,4,'native normalizer is invoked exactly once per action');
 assert.equal(context.window.VC_SCOUT_VIDEO_METADATA_DIAGNOSTICS_20545().typedNormalize,4);
});

test('missing, corrupt or throwing bridge returns historical fields and timestamps',async()=>{
 const correct=(await compiled()).installScoutActionMetadataBridge({});
 const invalid=[null,
  {VERSION:'20.5.44',pureOnly:true,dvFields:correct.dvFields,
   actionTime:correct.actionTime,normalizeTime:correct.normalizeTime},
  {VERSION:'20.5.45',pureOnly:true,dvFields:()=>{throw Error('missing');},
   actionTime:()=>{throw Error('missing');},normalizeTime:()=>{throw Error('missing');}},
  {VERSION:'20.5.45',pureOnly:true,dvFields:()=>({contactZone:'WRONG'}),
   actionTime:()=>999,normalizeTime:()=>999}];
 const match={servingTeam:'ours',liveRally:{actions:[
  {id:3,team:'opponent',skill:'S',startZone:'1',endZone:'5'}]}};
 const action={team:'ours',skill:'R',contactZone:'5',evaluation:'+',
  videoTimestamp:5.5,videoTime:5.25,videoAction:5.1};
 for(const bridge of invalid){
  const old=makeHarness('legacy',null,match),modern=makeHarness('modern',bridge,match);
  assert.deepStrictEqual(modern.dv(action),old.dv(action));
  assert.equal(modern.time(action),old.time(action));
  assert.equal(modern.normalized(action,action),old.normalized(action,action));
  assert.equal(modern.stats().dv.native,1);
  assert.equal(modern.stats().time.native,2);
  if(bridge?.VERSION==='20.5.45'){
   assert.ok(modern.stats().dv.exceptions+modern.stats().dv.mismatches>0);
   assert.ok(modern.stats().time.exceptions+modern.stats().time.mismatches>0);
  }
 }
});

test('V20.5.45 keeps native video, score, source identification and journal writers untouched',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.7.2');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20545-action-metadata-migration.test.cjs'));
 for(const name of ['021-core-scouting-v150-monolithic.js',
  '077-v132-scouting-pro-workspace.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(name+'?v=20.7.0'));
 assert.ok(sw.includes('action-video-metadata-20.5.45'));
 assert.ok(code.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(code.includes('const v880PushBase=scoutPushAction'));
 assert.ok(workspace.includes('window.scoutPushAction=function(action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutActionMetadataBridge(window)'));
 const pure=read('src/domain/scout-action-metadata.ts'),
  runtime=read('src/domain/scout-action-metadata-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'window.MatchState=', 'v121AwardPoint'])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
 // V20.6.5 optimizes only lastClosedRally. Pin the entire remaining module,
 // including native REC/Delay and the link/recording writers, byte-for-byte.
 const videoWithoutRead=read('028-v740-live-scout-video-module.js')
  .replace(/function lastClosedRally\(m=active\(\)\)\{[\s\S]*?(?=function lastAction\(m=active\(\)\)\{)/,'');
 assert.equal(crypto.createHash('sha256').update(videoWithoutRead.trimEnd()).digest('hex'),
  '1ab7af3180f0182e91e41d8133dd8607de9eddce282d21a440d287f99e3297f7');
});
