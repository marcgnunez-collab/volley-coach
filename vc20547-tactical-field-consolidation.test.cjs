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
const old=read('test-audit/fixtures/v20546-direction-block-normalizers.txt');
const from=source.indexOf('/* V20.5.47 · One normalized-field pass');
const to=source.indexOf('function v840InferBlockTarget(',from);
assert.ok(from>=0&&to>from,'canonical V20.5.47 wrapper exists');
const replacement=source.slice(from,to);
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context={window:mode==='new'&&bridge?{VC_SCOUT_TACTICAL_FIELDS_20547:bridge}: {},calls:0};
 const base=`var scoutNormalizeAction=function(a){calls++;return {
   ...(a||{}), skill:a?.skill||'S', serveType:a?.serveType||'',
   untouchedMarker:'preserved'
 };};`;
 vm.runInNewContext(base+'\n'+(mode==='new'?replacement:old),context,{timeout:3000});
 return {normalize:action=>context.scoutNormalizeAction(action),context,
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_TACTICAL_FIELDS_DIAGNOSTICS_20547()):null};
}

test('V20.5.47 installs an immutable pure TypeScript tactical field bridge once',async()=>{
 const domain=await compiled(),holder={},api=domain.installScoutTacticalFieldsBridge(holder);
 assert.equal(api.VERSION,'20.5.47');
 assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_TACTICAL_FIELDS_20547,api);
 assert.strictEqual(domain.installScoutTacticalFieldsBridge(holder),api);
});

test('TypeScript field projection agrees with both archived historical wrappers over 1,800 combinations',async()=>{
 const domain=await compiled(),historical=harness('old');
 let count=0;
 for(const skill of ['R','S','B','A','D'])
 for(const serveType of ['','F','JF','JP','U','INVALID'])
 for(const receivedServeType of ['','F','JF','WRONG'])
 for(const attackDirection of ['','LIN','DC','DL','WRONG'])
 for(const blockTargetNumber of ['','08','a12?345']){
  const input={skill,serveType,receivedServeType,attackDirection,blockTargetNumber,
   blockTargetLabel:'Rival 7',evaluation:'#',other:'keep'};
  const before=JSON.stringify(input);
  const historic=historical.normalize(input);
  const projected=domain.normalizeTacticalActionFields(input,{
   skill:historic.skill,serveType:input.serveType});
  for(const key of Object.keys(projected))assert.deepStrictEqual(projected[key],historic[key],key+' '+JSON.stringify(input));
  assert.equal(JSON.stringify(input),before,'the projection does not modify action input');
  count++;
 }
 assert.equal(count,1800);
 assert.equal(historical.context.calls,count,'historical base invoked once per action');
});

test('single normalizer preserves complete historical action fields and reference identity',async()=>{
 const bridge=(await compiled()).installScoutTacticalFieldsBridge({});
 const historical=harness('old'),current=harness('new',bridge);
 const inputs=[null,{},
  {skill:'R',serveType:'JF',receivedServeType:'',attackDirection:'LIN',blockTargetNumber:'987',videoTime:10.2},
  {skill:'B',serveType:'JP',blockTargetNumber:'07AB23',blockTargetLabel:'2/10',team:'opponent'},
  {skill:'A',attackDirection:'DC',blockTargetLabel:'not-block',sourceActionId:14,uid:'private'},
  {skill:'S',attackDirection:'wrong',receivedServeType:'X',blockTargetNumber:'01',evaluation:'#'}];
 for(const input of inputs){
  assert.deepStrictEqual(json(current.normalize(input)),json(historical.normalize(input)));
 }
 assert.equal(current.context.calls,inputs.length);
 assert.equal(historical.context.calls,inputs.length);
 assert.deepStrictEqual(current.diagnostics(),{typed:inputs.length,native:0,mismatches:0,exceptions:0});
});

test('wrong, absent and throwing bridge automatically fall back to exact native behavior',async()=>{
 const good=(await compiled()).installScoutTacticalFieldsBridge({});
 const bad=[null,{VERSION:'20.5.46',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.47',pureOnly:true,normalize:()=>({attackDirection:'BAD'})},
  {VERSION:'20.5.47',pureOnly:true,normalize:()=>{throw new Error('failure');}},
  {VERSION:'20.5.47',pureOnly:true,normalize:()=>null}];
 for(const bridge of bad){
  const native=harness('old'),current=harness('new',bridge);
  const input={skill:'R',serveType:'JF',receivedServeType:'',attackDirection:'LIN',
   blockTargetNumber:'011',blockTargetLabel:'Rival 1'};
  assert.deepStrictEqual(json(current.normalize(input)),json(native.normalize(input)));
  assert.equal(current.context.calls,1);
  assert.equal(current.diagnostics().native,1);
  assert.equal(current.diagnostics().typed,0);
  if(bridge?.VERSION==='20.5.47')assert.ok(current.diagnostics().mismatches+current.diagnostics().exceptions>0);
 }
});

test('accessor-bearing historical actions use native projection with unchanged getter reads',async()=>{
 const bridge=(await compiled()).installScoutTacticalFieldsBridge({});
 const historical=harness('old'),current=harness('new',bridge);
 function accessorAction(counter){return {skill:'R',serveType:'JF',evaluation:'+',
  get attackDirection(){counter.reads++;return 'LIN';},blockTargetNumber:'007'};}
 const before={reads:0},after={reads:0};
 assert.deepStrictEqual(json(current.normalize(accessorAction(after))),json(historical.normalize(accessorAction(before))));
 assert.equal(after.reads,before.reads,'no extra getter access in the canonical wrapper');
 assert.equal(current.diagnostics().native,1);
});

test('legacy reception fallback and blocking target cleanup remain in normalizing order',async()=>{
 const bridge=(await compiled()).installScoutTacticalFieldsBridge({});
 const current=harness('new',bridge);
 const reception=current.normalize({skill:'R',serveType:'JF',blockTargetNumber:'123',attackDirection:'DL'});
 assert.equal(reception.receivedServeType,'JF');
 assert.equal(reception.serveType,'');
 assert.equal(reception.blockTargetNumber,'');
 assert.equal(reception.attackDirection,'DL');
 const block=current.normalize({skill:'B',blockTargetNumber:'0a12-99',blockTargetLabel:'Rival 10'});
 assert.equal(block.blockTargetNumber,'012');
 assert.equal(block.blockTargetLabel,'Rival 10');
 assert.equal(block.untouchedMarker,'preserved');
});

test('V20.5.47 only removes V8.3/V8.4 field wrappers and leaves original writers intact',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.79');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20547-tactical-field-consolidation.test.cjs'));
 const html=read('index.html'),sw=read('service-worker.js');
 for(const asset of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(asset+'?v=20.5.79'),asset);
 assert.ok(sw.includes('tactical-fields-consolidation-20.5.47'));
 assert.ok(source.includes('const v20547NormBase=scoutNormalizeAction'));
 assert.ok(!source.includes('const v830NormalizeBase=scoutNormalizeAction'));
 assert.ok(!source.includes('const v840NormBase=scoutNormalizeAction'));
 assert.ok(source.includes('function v830InferReceptionMeta('));
 assert.ok(source.includes('function v840InferBlockTarget('));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutTacticalFieldsBridge(window)'));
 const speed=read('213-vc2021-scouting-speed-pro.js');
 assert.ok(speed.includes('vc20547Tactical'));
 const pure=read('src/domain/scout-action-tactical-fields.ts'),
  runtime=read('src/domain/scout-action-tactical-fields-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase','scoutPushAction(',
  'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
