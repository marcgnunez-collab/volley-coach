'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const clone=value=>JSON.parse(JSON.stringify(value));
const source=read('021-core-scouting-v150-monolithic.js');
function part(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,`Cannot extract ${start}`);
 return source.slice(a,b);
}
const newCode=[part('const V870_TEMPO=','const V870_SUBTYPE='),
 part('function v870CleanToken(','function v870SkillFromRaw('),
 part('/* V20.5.43 · Consolidated V8.4','function v880LegacyExtension(')].join('\n');

async function harness(mode,bridge){
 const {buildScoutCodeV830}=await compiled();
 let baseCalls=0;
 const context={window:mode==='modern'?{VC_SCOUT_CODE_BUILDER_20543:bridge}:{},
  scoutBuildCode(action){
   baseCalls++;
   const player=action.team==='opponent'?null:
    {number:action.playerId===8?'08':action.playerId||'7'};
   return buildScoutCodeV830(action,player);
  }};
 const script=mode==='modern'?newCode:read('test-audit/fixtures/v20542-builder-wrappers.txt');
 vm.runInNewContext(script,context,{timeout:3000});
 return {build:action=>context.scoutBuildCode(action),
  calls:()=>baseCalls,
  diagnostics:()=>mode==='modern'?clone(context.window.VC_SCOUT_CODE_BUILDER_DIAGNOSTICS_20543()):null};
}

test('V20.5.43 TypeScript bridge is pure, immutable and installs once',async()=>{
 const domain=await compiled(),win={};
 const bridge=domain.installScoutCodeBuilderBridge(win);
 assert.equal(bridge.VERSION,'20.5.43');
 assert.equal(bridge.pureOnly,true);
 assert.ok(Object.isFrozen(bridge));
 assert.equal(bridge,domain.installScoutCodeBuilderBridge(win));
 assert.equal(win.VC_SCOUT_CODE_BUILDER_20543,bridge);
 const block={skill:'B',startZone:'',contactZone:'3',endZone:'5',videoTime:2.5};
 const prepared=bridge.prepare(block);
 assert.deepStrictEqual(clone(prepared),{...block,startZone:'3',endZone:'3'});
 assert.deepStrictEqual(block,{skill:'B',startZone:'',contactZone:'3',endZone:'5',videoTime:2.5});
 const other={skill:'A',startZone:'4'};
 assert.equal(bridge.prepare(other),other);
});

test('one consolidated builder equals all three V20.5.42 wrappers across evaluation and zone matrix',async()=>{
 const bridge=(await compiled()).installScoutCodeBuilderBridge({});
 const old=await harness('legacy'),modern=await harness('modern',bridge);
 const zones=['','1','4B','6D'],ends=['','3','5C','8'];
 let checked=0;
 for(const team of ['ours','opponent'])for(const skill of ['B','A','E','R','D','S'])
 for(const evalCode of ['#','+','-','/','='])for(const zone of zones)
 for(const dest of ends){
  const action={team,skill,evaluation:evalCode,playerId:8,playerLabel:'#12 · Rival',
   startZone:zone,endZone:dest,contactZone:dest||'2',
   blockTargetNumber:'0087',attackCode:'hsp-7',setterCall:'2hand',
   attackTempo:'Q',setTempo:'M',skillSubtype:'soft+',dvSetType:'P',
   specialCode:'a!-7',customCode:'m01!',endCone:skill==='A'?3:null,
   attackDirection:'LIN',phase:'K2',blockers:2,attackCombo:'31'};
  const snapshot=JSON.stringify(action);
  assert.equal(modern.build(action),old.build(action),JSON.stringify(action));
  assert.equal(JSON.stringify(action),snapshot,'builder does not mutate the input');
  checked++;
 }
 assert.ok(checked>=900);
 assert.equal(old.calls(),checked);
 assert.equal(modern.calls(),checked,'the V8.3 base builder runs once per code');
 assert.deepStrictEqual(modern.diagnostics(),{typed:checked,native:0,mismatches:0,exceptions:0});
});

test('blocking target and cone destinations preserve historical formatting and modifier order',async()=>{
 const bridge=(await compiled()).installScoutCodeBuilderBridge({});
 const old=await harness('legacy'),modern=await harness('modern',bridge);
 const examples=[
  {team:'ours',skill:'B',evaluation:'#',playerId:8,startZone:'',contactZone:'3',endZone:'4',blockTargetNumber:17},
  {team:'ours',skill:'B',evaluation:'+',playerId:8,startZone:'2',endZone:'9',blockTargetNumber:'26b'},
  {team:'opponent',skill:'A',evaluation:'#',playerLabel:'12',startZone:'4B',endZone:'',endCone:5,
   attackCode:' HSP-2 ',attackTempo:'Q',skillSubtype:'TIP',dvSetType:'F',specialCode:'S1',customCode:'T1'},
  {team:'ours',skill:'A',evaluation:'=',playerId:8,startZone:'4B',endZone:'6C',endCone:8,attackCode:'A/B'},
  {team:'ours',skill:'E',evaluation:'+',playerId:8,setTempo:'T',setterCall:'2 H',dvSetType:'P'},
  {team:'ours',skill:'A',evaluation:'+',playerId:8,attackTempo:'RAP',dvSetType:'invalid',endCone:0}
 ];
 for(const input of examples)assert.equal(modern.build(input),old.build(input));
 assert.ok(modern.build(examples[0]).includes('.3&17'));
 assert.ok(modern.build(examples[2]).includes('.4B>C5'));
 assert.ok(modern.build(examples[2]).includes('::HSP2~Q%TIP|F?S1$T1'));
 assert.equal(modern.calls(),examples.length+3);
});

test('missing, erroneous and disagreeing TypeScript extensions preserve native code',async()=>{
 const correct=(await compiled()).installScoutCodeBuilderBridge({});
 const invalid=[undefined,
  {VERSION:'20.5.42',pureOnly:true,prepare:correct.prepare,finish:correct.finish},
  {VERSION:'20.5.43',pureOnly:true,prepare:()=>{throw Error('offline');},finish:()=>{throw Error('offline');}},
  {VERSION:'20.5.43',pureOnly:true,prepare:()=>({skill:'A'}),finish:()=> 'WRONG'},
  {VERSION:'20.5.43',pureOnly:true,prepare:correct.prepare,finish:()=> 'WRONG'}];
 const examples=[
  {team:'ours',skill:'B',evaluation:'+',playerId:8,startZone:'',contactZone:'2',blockTargetNumber:'15'},
  {team:'opponent',skill:'A',evaluation:'#',playerLabel:'12',startZone:'4',endCone:8,
   attackTempo:'Q',skillSubtype:'HSP'},
  {team:'ours',skill:'R',evaluation:'-',playerId:8,endZone:'5',receivedServeType:'JF'}];
 for(const bad of invalid){
  const old=await harness('legacy'),modern=await harness('modern',bad);
  for(const action of examples)assert.equal(modern.build(action),old.build(action));
  assert.equal(modern.calls(),examples.length);
  assert.equal(old.calls(),examples.length);
  if(bad?.VERSION==='20.5.43')assert.ok(modern.diagnostics().mismatches+modern.diagnostics().exceptions>0);
  else assert.equal(modern.diagnostics().native,examples.length);
 }
});

test('complex modifier tokens and malformed values match original wrappers',async()=>{
 const bridge=(await compiled()).installScoutCodeBuilderBridge({});
 const old=await harness('legacy'),modern=await harness('modern',bridge);
 for(const skill of ['A','B','E','S'])for(const tempo of ['Q','U','T','M','H','O','RAP','bad',''])
 for(const type of ['F','C','B','P','S','bad','']){
  const a={team:'ours',skill,playerId:8,evaluation:'/',startZone:'3',endZone:'6',endCone:7,
   blockTargetNumber:'abc 028 x',attackCode:' T#AZ! 12',setterCall:' X Y Z ',
   attackTempo:tempo,setTempo:tempo,skillSubtype:'s-ub 1+!',
   dvSetType:type,specialCode:'HOLA MUNDO?',customCode:'A/B C'};
  assert.equal(modern.build(a),old.build(a));
 }
 assert.deepStrictEqual(modern.diagnostics(),{typed:252,native:0,mismatches:0,exceptions:0});
});

test('V20.5.43 publishes one final wrapper, no replacement of action writes or match state',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.46');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20543-code-builder-consolidation.test.cjs'));
 for(const filename of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(filename+'?v=20.5.46'));
 assert.ok(sw.includes('code-builder-consolidation-20.5.43'));
 assert.ok(!source.includes('const v840BuildBase='));
 assert.ok(!source.includes('const v870BuildBase='));
 assert.ok(!source.includes('const v880BuildBase='));
 // Original V6, effective V8.3 and one final V20.5.43 wrapper.
 assert.equal((source.match(/scoutBuildCode=function\(a\)/g)||[]).length,3);
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutCodeBuilderBridge(window)'));
 const pure=read('src/domain/scout-code-builder.ts'),
  runtime=read('src/domain/scout-code-builder-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'scoutPlayer(', 'v121AwardPoint'])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
