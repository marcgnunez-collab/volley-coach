'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const json=value=>JSON.parse(JSON.stringify(value));

function formatHarness(legacy,bridge){
 const source=read('021-core-scouting-v150-monolithic.js');
 const part=(a,b)=>{
  const first=source.indexOf(a),last=source.indexOf(b,first+a.length);
  assert.ok(first>=0&&last>first,'extract '+a);return source.slice(first,last);
 };
 const snippets=legacy
  ?read('test-audit/fixtures/v20541-normalize-code.txt')
  :[part('const v6108FormatStats=','// Code builder: R/D can use'),
    part('function v830NativeBuildCode(a,ownPlayer){','/* V20.5.40 · The V8.3 directional parser wrapper')].join('\n');
 let playerReads=0,nativeNormCalls=0;
 const context={
  window:bridge?{VC_SCOUT_CODE_FORMAT_20542:bridge}:{},
  scoutNormalizeAction:a=>{nativeNormCalls++;return {...a};},
  scoutBuildCode:()=>'',scoutPlayer:id=>{playerReads++;return id===999?null:{number:id===8?'08':id}},
  scoutV6108IsContactSkill:skill=>skill==='R'||skill==='D',
  scoutV6108ContactZone:a=>String(a?.contactZone||((a?.skill==='R'||a?.skill==='D')?
   (a?.endZone||a?.startZone||''):'')||'')
 };
 vm.runInNewContext(snippets,context,{timeout:2000});
 return {normalize:a=>json(context.scoutNormalizeAction({...a})),
  build:a=>String(context.scoutBuildCode({...a})),
  playerReads:()=>playerReads,nativeNormCalls:()=>nativeNormCalls,
  stats:()=>legacy?null:json(context.window.VC_SCOUT_CODE_FORMAT_DIAGNOSTICS_20542())};
}

test('TypeScript contact metadata keeps exact zones, source and inferred source ID',async()=>{
 const {normalizeContactMetadata}=await compiled();
 const samples=[
  [{skill:'R',startZone:'',endZone:'6'}, {skill:'R',startZone:'',endZone:'6'}],
  [{skill:'D',startZone:'5',endZone:''}, {skill:'D',startZone:'5',endZone:''}],
  [{skill:'A',startZone:'4',endZone:'6'}, {skill:'A',startZone:'4',endZone:'6'}],
  [{skill:'R',startZone:'1A',endZone:'6B',sourceZone:'1A',zoneInferred:true,sourceActionId:'12'},
   {skill:'R',startZone:'1A',endZone:'6B'}],
  [{skill:'R',contactZone:'6',sourceZone:'2',sourceActionId:0},
   {skill:'R',startZone:'',endZone:''}],
  [{skill:'R',contactZone:'6',sourceActionId:null}, {skill:'R',startZone:'',endZone:''}]
 ];
 for(const [input,normalized] of samples){
  const observed=normalizeContactMetadata(input,normalized);
  const want={contactZone:String(input.contactZone||((normalized.skill==='R'||normalized.skill==='D')?
   (normalized.endZone||normalized.startZone||''):'')||''),
   sourceZone:String(input.sourceZone||((normalized.skill==='R'||normalized.skill==='D')&&
    normalized.startZone&&normalized.endZone?normalized.startZone:'')||''),
   zoneInferred:!!input.zoneInferred,
   sourceActionId:input.sourceActionId!=null?Number(input.sourceActionId):null,
   migratedEndZone:(normalized.skill==='R'||normalized.skill==='D')&&
    (input.contactZone||normalized.endZone||normalized.startZone)&&!normalized.endZone&&!normalized.startZone
    ?String(input.contactZone||''):null};
  assert.deepStrictEqual(observed,want);
 }
});

test('typed builder exactly matches live V8.3 grammar for player numbers, skills and tactical modifiers',async()=>{
 const {buildScoutCodeV830}=await compiled();
 const native=formatHarness(true);
 const cases=[
  {team:'ours',playerId:8,playerNumberSnapshot:'08',skill:'A',evaluation:'#',startZone:'4B',endZone:'5D'},
  {team:'opponent',playerLabel:'#12 · Rival',skill:'S',evaluation:'+',startZone:'1',endZone:'6'},
  {team:'ours',playerId:999,playerNumberSnapshot:'07',skill:'R',evaluation:'+',contactZone:'6A'},
  {team:'ours',playerId:3,skill:'E',evaluation:'!',setTarget:'PIPE',phase:'K1'},
  {team:'ours',playerId:3,skill:'A',evaluation:'#',attackDirection:'DC',blockers:2,attackCombo:'31',phase:'TR',serveType:'JF'},
  {team:'opponent',playerLabel:'LIBERO',playerNumberSnapshot:'12',skill:'D',evaluation:'/',contactZone:'5C',receivedServeType:'U'}
 ];
 for(const action of cases){
  const lookup=action.team==='opponent'?null:action.playerId===999?null:{number:action.playerId===8?'08':action.playerId};
  assert.equal(buildScoutCodeV830(action,lookup),native.build(action),JSON.stringify(action));
 }
 const skills=['S','R','A','D','E','B'],ratings=['#','+','-','/','='],
  zones=['','4B','6C'],ends=['','1D','5D'];
 let checked=0;
 for(const team of ['ours','opponent'])for(const skill of skills)
 for(const evaluation of ratings)for(const startZone of zones)for(const endZone of ends){
  const action={team,skill,evaluation,playerId:8,playerLabel:'#11 · Rival',
   playerNumberSnapshot:'08',startZone,endZone,
   contactZone:skill==='R'||skill==='D'?(endZone||startZone):'',
   serveType:'F',receivedServeType:'JP',setTarget:'',attackCombo:'PIPE',
   attackDirection:'LIN',phase:'K2',blockers:2};
  const own=team==='opponent'?null:{number:'08'};
  assert.equal(buildScoutCodeV830(action,own),native.build(action));checked++;
 }
 assert.ok(checked>=500);
});

test('native normalization and code builder match V20.5.41 fixtures with typed bridge installed',async()=>{
 const bridge=(await compiled()).installScoutCodeFormatBridge({});
 assert.equal(bridge.VERSION,'20.5.42');assert.ok(Object.isFrozen(bridge));
 const modern=formatHarness(false,bridge),old=formatHarness(true);
 const codes=['R','D','S','A','B','E'];
 for(const skill of codes){
  for(const startZone of ['','4','4B'])for(const endZone of ['','5','5D']){
   const input={skill,startZone,endZone,sourceActionId:42,zoneInferred:true,
    contactZone:skill==='R'||skill==='D'?endZone:'',
    playerId:8,playerNumberSnapshot:'08',team:'ours',evaluation:'#',
    attackDirection:'DC',serveType:'JF',attackCombo:'PIPE',blockers:2};
   assert.deepStrictEqual(modern.normalize(input),old.normalize(input));
   assert.equal(modern.build(input),old.build(input));
  }
 }
 assert.equal(modern.stats().mismatches,0);
 assert.equal(modern.stats().exceptions,0);
 assert.ok(modern.stats().typedContact>0);
 assert.ok(modern.stats().typedCode>0);
 assert.equal(modern.playerReads(),old.playerReads(),'no second player lookup');
 assert.equal(modern.nativeNormCalls(),old.nativeNormCalls());
});

test('missing, mismatching and throwing typed formatter revert to original outputs',async()=>{
 const valid=(await compiled()).installScoutCodeFormatBridge({});
 const corrupted=[undefined,
  {VERSION:'20.5.42',pureOnly:true,contact:()=>({contactZone:'WRONG'}),buildCode:()=> 'WRONG'},
  {VERSION:'20.5.42',pureOnly:true,contact:()=>{throw Error('offline');},
   buildCode:()=>{throw Error('offline');}},
  {VERSION:'20.5.41',pureOnly:true,contact:valid.contact,buildCode:valid.buildCode}
 ];
 const action={skill:'R',team:'ours',playerId:8,playerNumberSnapshot:'08',
  evaluation:'#',startZone:'',endZone:'6B',receivedServeType:'JP',sourceZone:'1A',sourceActionId:12};
 for(const bridge of corrupted){
  const modern=formatHarness(false,bridge),previous=formatHarness(true);
  assert.deepStrictEqual(modern.normalize(action),previous.normalize(action));
  assert.equal(modern.build(action),previous.build(action));
  assert.equal(modern.playerReads(),1);
  assert.equal(modern.nativeNormCalls(),1);
  assert.ok(modern.stats().native>=2);
 }
});

test('old action video metadata is unchanged by formatting and no user data appears in diagnostics',async()=>{
 const bridge=(await compiled()).installScoutCodeFormatBridge({});
 const modern=formatHarness(false,bridge),previous=formatHarness(true);
 const video={videoTime:14.25,videoExactSourceKey:'PRIVATE-VIDEO'};
 const action={team:'ours',skill:'R',evaluation:'+',playerId:8,
  startZone:'',endZone:'5D',contactZone:'5D',
  sourceZone:'1B',sourceActionId:33,playerNameSnapshot:'PRIVADO',video};
 const before=JSON.stringify(action);
 assert.deepStrictEqual(modern.normalize(action),previous.normalize(action));
 assert.equal(modern.build(action),previous.build(action));
 assert.equal(JSON.stringify(action),before);
 assert.doesNotMatch(JSON.stringify(modern.stats()),/PRIVATE|PRIVADO|5D/);
});

test('V20.5.42 loads typed effective code formatter without a second writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.71');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20542-code-format-migration.test.cjs'));
 for(const filename of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(filename+'?v=20.5.71'));
 assert.ok(sw.includes('typed-action-normalizer-20.5.42'));
 const source=read('021-core-scouting-v150-monolithic.js');
 assert.ok(source.includes('v6108SelectFormat(\'contact\''));
 assert.ok(source.includes('v6108SelectFormat(\'code\''));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutCodeFormatBridge(window)'));
 const pure=read('src/domain/scout-code-format.ts'),
  runtime=read('src/domain/scout-code-format-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'v121AwardPoint','scoutPlayer('])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
