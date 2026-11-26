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

function parserHarness(previous,bridge){
 const source=read('021-core-scouting-v150-monolithic.js');
 const part=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'historical fragment: '+a);return source.slice(start,end);
 };
 const pieces=[
  part('function v6108NativeLex(raw){','function scoutV6108ParseRaw(raw,m,oldAction=null){'),
  previous?read('test-audit/fixtures/v20540-base-parser.txt'):
   part('function scoutV6108ParseRaw(raw,m,oldAction=null){','// Quick-code console'),
  part('const v20540ParserBase=scoutV6108ParseRaw;','window.v680ParseCode'),
  part('const v20538ExtensionStats=','/* V20.5.39 · This former V8.6 parser wrapper'),
  part('function v870LegacyExtension(original){','/* V20.5.39 · This former V8.7 parser wrapper'),
  part('function v880LegacyExtension(original){','/* V20.5.39 · One canonical extension wrapper'),
  part('const v20539ParserBase=scoutV6108ParseRaw;','window.v680ParseCode')
 ];
 const hits={own:0,opponent:0,normalizations:0};
 const context={
  window:bridge?{VC_SCOUT_ACTION_BUILDER_20541:bridge}:{},
  scoutV6108IsContactSkill:skill=>skill==='R'||skill==='D',
  scoutV6108NormalizeZoneInput:(skill,start,end)=>({startZone:start||'',endZone:end||'',contactZone:end||start||''}),
  scoutV6108InferSource:()=>{},
  scoutFindOwnByNumber:num=>{
   hits.own++;
   return num==='99'?null:{id:Number(num),number:num,name:'Jugadora'};
  },
  scoutFindOpponentByNumber:(_m,num)=>{
   hits.opponent++;return '#'+num+' · Rival';
  },
  scoutNormalizeAction:a=>{hits.normalizations++;return {...a};},
  scoutBuildCode:a=>a.code||'',
  v830InferReceptionMeta:()=>{},v840InferBlockTarget:()=>{},
  v870SkillFromRaw:s=>s.match(/^(?:R)?\d+([SREABDFC])/)?.[1]||'',
  v880DataVolleyFields:()=>({})
 };
 vm.runInNewContext(pieces.join('\n')+'\nthis.parseNative=scoutV6108ParseRaw;',context,{timeout:2000});
 return {parse:(code,old=null)=>json(context.parseNative(code,{id:42,status:'live'},old)),
  stats:()=>json(context.window.VC_SCOUT_ACTION_BUILD_DIAGNOSTICS_20541()),
  hits};
}

test('typed base builder copies previous action shallowly and preserves exact native field order',async()=>{
 const {buildScoutingActionBase}=await compiled();
 const video={videoTime:13.6,videoSourceKey:'PRIVATE'};
 const old={playerId:8,playerNameSnapshot:'PRIVATE',video,uid:'U-1'};
 const parts={rival:false,skill:'A',evaluation:'#',zones:{startZone:'4B',endZone:'5D'},
  serve:'',phase:'K1',combo:'PIPE',blockers:'2'};
 const before=JSON.stringify(old),built=buildScoutingActionBase(old,parts);
 assert.deepStrictEqual(json(built),{
  playerId:8,playerNameSnapshot:'PRIVATE',video,uid:'U-1',team:'ours',
  skill:'A',evaluation:'#',startZone:'4B',endZone:'5D',serveType:'',
  phase:'K1',setTarget:'',attackCombo:'PIPE',blockers:'2',validationWarnings:[]
 });
 assert.strictEqual(built.video,video);
 assert.notStrictEqual(built,old);
 assert.equal(JSON.stringify(old),before);
 assert.deepStrictEqual(buildScoutingActionBase(null,{...parts,rival:true,skill:'E'}).setTarget,'PIPE');
});

test('typed own and rival fields retain player identity and historical snapshot names',async()=>{
 const {ownScoutingPlayerFields,opponentScoutingPlayerFields}=await compiled();
 const own={id:11,name:'Nombre',number:'011'};
 assert.deepStrictEqual(ownScoutingPlayerFields(own,'Old','11'),{
  playerId:11,playerLabel:'',playerNameSnapshot:'Nombre',playerNumberSnapshot:'011'});
 assert.deepStrictEqual(ownScoutingPlayerFields({id:11,name:''},'Old','11'),{
  playerId:11,playerLabel:'',playerNameSnapshot:'Old',playerNumberSnapshot:'11'});
 const label='#15 · Rival';
 assert.deepStrictEqual(opponentScoutingPlayerFields(label,'','15'),{
  playerId:null,playerLabel:label,playerNumberSnapshot:'15',playerNameSnapshot:'Rival'});
 assert.deepStrictEqual(opponentScoutingPlayerFields(label,'Nombre anterior','15'),{
  playerId:null,playerLabel:label,playerNumberSnapshot:'15',playerNameSnapshot:'Nombre anterior'});
});

test('real native parser output matches V20.5.40 across own, opponent and advanced codes',async()=>{
 const api=(await compiled()).installScoutActionBuilderBridge({});
 assert.ok(Object.isFrozen(api));assert.equal(api.VERSION,'20.5.41');
 const modern=parserHarness(false,api),previous=parserHarness(true);
 const originals=['12A#.4B>5D::K1~T','R7R+.6A','12A#.4B>C5','7E+::31~Q|F%RAP?S1$X',
  '12A#.4>5*DC','3B#.4&12','99A#.4>5','12A#.4'];
 let checked=0;
 for(const input of originals){
  assert.deepStrictEqual(modern.parse(input),previous.parse(input),input);checked++;
 }
 for(const rival of ['','R'])for(const n of ['08','12','99'])
 for(const skill of ['S','R','E','A','B','D'])
 for(const rating of ['#','+','='])for(const loc of ['','.4B>5D','.1','.4B>C5','.4>5'])
 for(const meta of ['','~JP','::31~Q|F%TIP?X$Y','^K2@2']){
  const input=rival+n+skill+rating+loc+meta;
  assert.deepStrictEqual(modern.parse(input),previous.parse(input),input);checked++;
 }
 assert.ok(checked>=2000);
 assert.ok(modern.stats().base>0);
 assert.ok(modern.stats().opponent>0);
 assert.ok(modern.stats().own>0);
 assert.equal(modern.stats().mismatches,0);
 assert.equal(modern.stats().exceptions,0);
 assert.equal(modern.hits.own+modern.hits.opponent,previous.hits.own+previous.hits.opponent);
});

test('editing old action preserves video and tactical fields with no additional player lookups',async()=>{
 const bridge=(await compiled()).installScoutActionBuilderBridge({});
 const modern=parserHarness(false,bridge),previous=parserHarness(true);
 const old={playerId:8,playerNumberSnapshot:'08',playerNameSnapshot:'Anterior',
  videoTime:15.4,videoExactTime:15.432,videoExactSourceKey:'review',
  attackDirection:'DC',attackTempo:'T',customCode:'C1',sourceActionId:123,uid:'U-1'};
 const original=JSON.stringify(old);
 for(const code of ['08A#.4B>5D','08A#.4B>C5::K1~T','R7R+.6A',
  '99A#.4>5','08E+::31~Q','08B#.4&13']){
  assert.deepStrictEqual(modern.parse(code,old),previous.parse(code,old),code);
 }
 assert.equal(JSON.stringify(old),original);
 assert.equal(modern.hits.own,previous.hits.own);
 assert.equal(modern.hits.opponent,previous.hits.opponent);
 const saved=modern.parse('08A#.4B>5D',old).action;
 assert.equal(saved.videoTime,15.4);
 assert.equal(saved.videoExactTime,15.432);
 assert.equal(saved.videoExactSourceKey,'review');
});

test('malformed or absent typed builder never prevents native scoring inputs',async()=>{
 const valid=(await compiled()).installScoutActionBuilderBridge({});
 const bad=[
  undefined,
  {VERSION:'20.5.41',pureOnly:true,buildBase:()=>({team:'wrong'}),
   ownFields:()=>({playerId:999}),opponentFields:()=>({playerId:999})},
  {VERSION:'20.5.41',pureOnly:true,buildBase:()=>{throw Error('unavailable');},
   ownFields:()=>{throw Error('unavailable');},opponentFields:()=>{throw Error('unavailable');}},
  {VERSION:'20.5.40',pureOnly:true,buildBase:valid.buildBase,
   ownFields:valid.ownFields,opponentFields:valid.opponentFields}
 ];
 for(const bridge of bad){
  const after=parserHarness(false,bridge),before=parserHarness(true);
  for(const code of ['08A#.4B>5D','R7R+.6A','99A#.4>5']){
   assert.deepStrictEqual(after.parse(code),before.parse(code),code);
  }
  assert.equal(after.hits.own,before.hits.own);
  assert.equal(after.hits.opponent,before.hits.opponent);
  const diag=after.stats();
  assert.equal(diag.base+diag.native+diag.opponent+diag.own>=3,true);
  assert.doesNotMatch(JSON.stringify(diag),/Jugadora|Rival|08A#/);
 }
});

test('V20.5.41 pure builder is installed without a second writer or schema change',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.69');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20541-action-builder-migration.test.cjs'));
 for(const filename of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(filename+'?v=20.5.69'));
 assert.ok(sw.includes('native-action-builder-20.5.41'));
 const source=read('021-core-scouting-v150-monolithic.js');
 assert.ok(source.includes("const base=v6108SelectDraft('base'"));
 assert.ok(source.includes("v6108SelectDraft('opponent'"));
 assert.ok(source.includes("v6108SelectDraft('own'"));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutActionBuilderBridge(window)'));
 const pure=read('src/domain/scout-action-builder.ts'),
  runtime=read('src/domain/scout-action-builder-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'v121AwardPoint','scoutFindOpponentByNumber','scoutFindOwnByNumber'])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
