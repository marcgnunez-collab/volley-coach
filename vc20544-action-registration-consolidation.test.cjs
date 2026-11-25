'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const source=read('021-core-scouting-v150-monolithic.js');
const json=value=>JSON.parse(JSON.stringify(value));
function part(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Cannot extract ${start}`);
 return source.slice(a,b);
}
const helpers=[part('function scoutV6108IsContactSkill','// Preserve the new zone metadata'),
 part('function v830InferReceptionMeta','/* V20.5.44 · Reception'),
 part('function v840InferBlockTarget','/* V20.5.44 · One preparation wrapper')].join('\n');
const modernWrapper=part('/* V20.5.44 · One preparation wrapper','/* V20.5.43 · Block code preparation');

function makeHarness(mode,bridge,previous=[],options={}){
 const match=options.withoutMatch?null:{status:'live',liveRally:{actions:json(previous)}};
 const calls={push:0};let last=null;
 const context={window:mode==='modern'?{VC_SCOUT_REGISTRATION_20544:bridge}:{},
  scoutActive:()=>match,scoutArr:v=>Array.isArray(v)?v:[],arr830:v=>Array.isArray(v)?v:[],
  a84:v=>Array.isArray(v)?v:[],
  scoutActionPlayerLabel:a=>String(a.playerLabel||a.playerNumberSnapshot||'?'),
  scoutPushAction(action){calls.push++;last=action;
   if(options.decline||!match)return false;
   match.liveRally.actions.push(action);return true;
  }};
 const original=read('test-audit/fixtures/v20543-registration-wrappers.txt');
 vm.runInNewContext(helpers+'\n'+(mode==='modern'?modernWrapper:original),context,{timeout:3000});
 return {run:action=>context.scoutPushAction(action),calls,match,
  last:()=>last,stats:()=>mode==='modern'?json(context.window.VC_SCOUT_REGISTRATION_DIAGNOSTICS_20544()):null};
}

test('V20.5.44 typed contact preparation is immutable and preserves explicit source values',async()=>{
 const domain=await compiled(),holder={},bridge=domain.installScoutRegistrationBridge(holder);
 assert.equal(bridge.VERSION,'20.5.44');assert.equal(bridge.pureOnly,true);
 assert.ok(Object.isFrozen(bridge));
 assert.equal(bridge,domain.installScoutRegistrationBridge(holder));
 assert.equal(holder.VC_SCOUT_REGISTRATION_20544,bridge);
 const samples=[
  [{skill:'R',startZone:'4A',endZone:'5D'},
   {startZone:'4A',endZone:'5D',contactZone:'5D',sourceZone:'4A',zoneInferred:false}],
  [{skill:'D',startZone:'',endZone:'6B',contactZone:'6B'},
   {startZone:'',endZone:'6B',contactZone:'6B',sourceZone:'',zoneInferred:false}],
  [{skill:'R',startZone:'4',endZone:'',contactZone:'',sourceZone:''},
   {startZone:'',endZone:'4',contactZone:'4',sourceZone:'',zoneInferred:false}],
  [{skill:'R',startZone:'4',endZone:'6',contactZone:'CUSTOM',sourceZone:'SOURCE'},
   {startZone:'4',endZone:'6',contactZone:'CUSTOM',sourceZone:'SOURCE',zoneInferred:false}]
 ];
 for(const [input,want] of samples){
  const before=JSON.stringify(input);
  assert.deepStrictEqual(bridge.prepareContact(input),want);
  assert.equal(JSON.stringify(input),before);
 }
});

test('consolidated preparation matches three V20.5.43 wrappers across reception and defense zones',async()=>{
 const bridge=(await compiled()).installScoutRegistrationBridge({});
 const serves=[{team:'opponent',skill:'S',startZone:'1',serveType:'JF',id:22},
  {team:'ours',skill:'A',startZone:'4B',endZone:'5D',id:18}];
 const starts=['','1','4B','6D'],ends=['','3','5D'],contact=['','5D','6B'];
 let checked=0;
 for(const skill of ['R','D'])for(const team of ['ours','opponent'])
 for(const startZone of starts)for(const endZone of ends)for(const contactZone of contact){
  const input={team,skill,evaluation:'+',startZone,endZone,contactZone,playerId:8,
   playerLabel:'#12 · Rival',videoTime:12.3,sourceActionId:null};
  const historic=makeHarness('legacy',null,serves),modern=makeHarness('modern',bridge,serves);
  const oldAction=json(input),newAction=json(input);
  assert.equal(modern.run(newAction),historic.run(oldAction));
  assert.deepStrictEqual(json(modern.last()),json(historic.last()),JSON.stringify(input));
  assert.deepStrictEqual(newAction,oldAction,'original caller action has the same mutations');
  assert.equal(modern.calls.push,1);assert.equal(historic.calls.push,1);
  assert.strictEqual(modern.last(),modern.match.liveRally.actions.at(-1));
  assert.deepStrictEqual(modern.stats(),{typed:1,native:0,mismatches:0,exceptions:0});
  checked++;
 }
 assert.equal(checked,144);
});

test('blocking target, serve inheritance and phase metadata retain historical effects',async()=>{
 const bridge=(await compiled()).installScoutRegistrationBridge({});
 const previous=[
  {team:'opponent',skill:'S',id:11,startZone:'1',serveType:'JP',playerLabel:'Rival #5'},
  {team:'opponent',skill:'A',id:12,startZone:'4',endZone:'5D',playerNumberSnapshot:'15',playerLabel:'Rival #15'},
  {team:'ours',skill:'S',id:13,startZone:'1',serveType:'U',playerNumberSnapshot:9},
  {team:'ours',skill:'A',id:14,startZone:'4',endZone:'6',playerNumberSnapshot:8}];
 const actions=[
  {team:'ours',skill:'R',evaluation:'+',contactZone:'6',videoTime:5.35},
  {team:'opponent',skill:'R',evaluation:'#',contactZone:'4',sourceZone:'manual'},
  {team:'ours',skill:'B',evaluation:'#',startZone:'3',blockTargetNumber:'',videoExactTime:6.789},
  {team:'opponent',skill:'B',evaluation:'!',startZone:'2'},
  {team:'ours',skill:'B',evaluation:'+',startZone:'3',blockTargetNumber:'7'},
  {team:'ours',skill:'A',evaluation:'=',startZone:'4',endZone:'3',attackTempo:'T',videoSource:'clip-01'},
  {team:'ours',skill:'S',evaluation:'=',phase:'K2'}];
 for(const input of actions){
  const old=makeHarness('legacy',null,previous),modern=makeHarness('modern',bridge,previous);
  const a=json(input),b=json(input);
  assert.equal(modern.run(b),old.run(a));
  assert.deepStrictEqual(json(modern.last()),json(old.last()));
  assert.deepStrictEqual(b,a);
  assert.equal(modern.calls.push,1);
 }
});

test('missing, mismatching or throwing TypeScript bridge uses the historical contact fields',async()=>{
 const bridge=(await compiled()).installScoutRegistrationBridge({});
 const broken=[null,
  {VERSION:'20.5.43',pureOnly:true,prepareContact:bridge.prepareContact},
  {VERSION:'20.5.44',pureOnly:true,prepareContact:()=>{throw Error('typed unavailable');}},
  {VERSION:'20.5.44',pureOnly:true,prepareContact:()=>({startZone:'wrong'})},
  {VERSION:'20.5.44',pureOnly:true,prepareContact:()=>null}];
 const previous=[{team:'opponent',skill:'S',startZone:'1',serveType:'JF',id:12}];
 for(const invalid of broken){
  const old=makeHarness('legacy',null,previous),modern=makeHarness('modern',invalid,previous);
  const action={team:'ours',skill:'R',evaluation:'#',contactZone:'6',playerId:8};
  assert.equal(modern.run(json(action)),old.run(json(action)));
  assert.deepStrictEqual(json(modern.last()),json(old.last()));
  assert.equal(modern.calls.push,1);
  assert.equal(modern.stats().native,1);
  if(invalid?.VERSION==='20.5.44')assert.ok(modern.stats().exceptions+modern.stats().mismatches>0);
 }
});

test('write rejection and missing match preserve native return value and no phantom action',async()=>{
 const bridge=(await compiled()).installScoutRegistrationBridge({});
 for(const options of [{decline:true},{withoutMatch:true}]){
  const old=makeHarness('legacy',null,[],options),modern=makeHarness('modern',bridge,[],options);
  const action={team:'ours',skill:'D',evaluation:'+',startZone:'3',endZone:'5D'};
  assert.equal(modern.run(json(action)),false);
  assert.equal(modern.run(json(action)),old.run(json(action)));
  assert.deepStrictEqual(json(modern.last()),json(old.last()));
  assert.equal(modern.calls.push,2);
  assert.equal(modern.match?.liveRally.actions.length||0,0);
 }
});

test('V20.5.44 replaces three scouting preparation wrappers with one, leaving writers intact',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.66');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20544-action-registration-consolidation.test.cjs'));
 for(const asset of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(asset+'?v=20.5.66'));
 assert.ok(sw.includes('registration-preparation-consolidation-20.5.44'));
 assert.ok(!source.includes('const v6108PushActionBase='));
 assert.ok(!source.includes('const v830PushBase='));
 assert.ok(!source.includes('const v840PushBase='));
 assert.ok(source.includes('const v20544PushBase=scoutPushAction'));
 assert.equal((source.match(/scoutPushAction=function\(action\)/g)||[]).length,3);
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutRegistrationBridge(window)'));
 const pure=read('src/domain/scout-action-registration.ts'),
  runtime=read('src/domain/scout-action-registration-runtime.ts');
 for(const forbidden of ['localStorage','indexedDB','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'scoutPlayer(', 'v121AwardPoint'])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
