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
const old=read('test-audit/fixtures/v20548-identity-video-normalizers.txt');
function part(text,start,end){
 const i=text.indexOf(start),j=text.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'extract '+start);
 return text.slice(i,j);
}
const modern=part(source,'/* V20.5.49 · V6.9 media fields','function v690NormalizeWorkflow(');
const oldFirst=part(old,'const v690NormActionBase=scoutNormalizeAction;',
 '/* V6.10.0 · Opponent identity');
const oldSecond=old.slice(old.indexOf('const v6100NormActionBase=scoutNormalizeAction;'));
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context=vm.createContext({window:mode==='new'&&bridge?{VC_SCOUT_IDENTITY_FIELDS_20549:bridge}:{},
  calls:0,lastBase:null});
 const base=`var scoutNormalizeAction=function(a){calls++;
  const x={...(a||{}),id:Number(a?.id)||77,skill:a?.skill||'S',
    videoTime:a?.videoTime==null?null:Number(a.videoTime),baseMarker:'preserved'};
  lastBase=x;return x;};`;
 vm.runInContext(base+'\n'+(mode==='new'?modern:oldFirst),context,{timeout:4000});
 return {normalize:a=>context.scoutNormalizeAction(a),context,
  advance:()=>vm.runInContext(mode==='new'?'v20549OpponentIdentityReady=true;':oldSecond,context,{timeout:4000}),
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_IDENTITY_FIELDS_DIAGNOSTICS_20549()):null};
}

test('V20.5.49 bridge exports an immutable, pure identity/video projection',async()=>{
 const module=await compiled(),holder={},api=module.installScoutIdentityFieldsBridge(holder);
 assert.equal(api.VERSION,'20.5.49');
 assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(holder.VC_SCOUT_IDENTITY_FIELDS_20549,api);
 assert.strictEqual(module.installScoutIdentityFieldsBridge(holder),api);
 const x={id:17},a={uid:'',videoStart:'4.75',videoAction:'',videoEnd:0,clipId:'private'};
 assert.deepStrictEqual(json(module.normalizeScoutingIdentityFields(a,x,false)),{
  uid:'act_17',videoStart:4.75,videoAction:0,videoEnd:0,clipId:'private'});
 assert.equal(Object.hasOwn(module.normalizeScoutingIdentityFields(a,x,false),'opponentPlayerUid'),false);
});

test('V6.9 and V6.10.0 startup phases exactly match their archived historical wrappers',async()=>{
 const api=(await compiled()).installScoutIdentityFieldsBridge({});
 const historical=harness('old'),current=harness('new',api);
 const actions=[{id:14,uid:'',videoStart:'3.5',videoAction:'6',videoEnd:'9',
  clipId:'c-1',opponentPlayerUid:27},
  {id:15,uid:'real-15',videoStart:0,videoAction:0,videoEnd:0,clipId:'',
   opponentPlayerUid:'rival_08',videoTime:10.75},
  {id:16,videoStart:null,videoAction:null,videoEnd:null,opponentPlayerUid:null}];
 const stageOneOld=actions.map(a=>historical.normalize(a));
 const stageOneNew=actions.map(a=>current.normalize(a));
 assert.deepStrictEqual(json(stageOneNew),json(stageOneOld),'first load uses only V6.9 fields');
 for(const a of stageOneNew)assert.equal(Object.hasOwn(a,'opponentPlayerUid'),
  Object.hasOwn(stageOneOld[stageOneNew.indexOf(a)],'opponentPlayerUid'));
 assert.deepStrictEqual(current.diagnostics(),{
  typed:actions.length,native:0,mismatches:0,exceptions:0,opponentEnabled:false});
 historical.advance();current.advance();
 const stageTwoOld=stageOneOld.map(a=>historical.normalize(a));
 const stageTwoNew=stageOneNew.map(a=>current.normalize(a));
 assert.deepStrictEqual(json(stageTwoNew),json(stageTwoOld),'second load activates V6.10.0 identity');
 assert.deepStrictEqual(current.diagnostics(),{
  typed:actions.length*2,native:0,mismatches:0,exceptions:0,opponentEnabled:true});
 assert.equal(current.context.calls,actions.length*2);
 assert.equal(historical.context.calls,actions.length*2);
});

test('TypeScript and the archived wrappers match across 1,200 media/identity combinations',async()=>{
 const api=(await compiled()).installScoutIdentityFieldsBridge({});
 const current=harness('new',api),historical=harness('old');
 const actions=[];
 for(const uid of [null,'','id_9',0,17,'act_2049'])
 for(const videoStart of [null,'',0,'0',-1,'3.5',NaN,Infinity,'invalid',11.25])
 for(const clipId of [null,'camera',0,'c_2'])
 for(const opponentPlayerUid of [null,'','op_11',33,'rival']){
  const index=actions.length;
  actions.push({uid,videoStart,clipId,opponentPlayerUid,id:99,
   videoAction:index%3?'2.5':null,videoEnd:index%4?'-1':'bad',
   videoTime:index%2?11.25:null,videoSource:'video-specific',evaluation:'#'});
 }
 assert.equal(actions.length,1200);
 for(const a of actions){
  const before=JSON.stringify(a);
  assert.deepStrictEqual(json(current.normalize(a)),json(historical.normalize(a)));
  assert.equal(JSON.stringify(a),before);
 }
 historical.advance();current.advance();
 for(const a of actions){
  const expected=historical.normalize(a),actual=current.normalize(a);
  assert.deepStrictEqual(json(actual),json(expected));
  assert.equal(Object.is(actual.videoStart,expected.videoStart),true);
  assert.equal(Object.is(actual.videoAction,expected.videoAction),true);
  assert.equal(Object.is(actual.videoEnd,expected.videoEnd),true);
  assert.strictEqual(actual,current.context.lastBase,'canonical base object is returned');
 }
 assert.equal(current.context.calls,2400);
 assert.deepStrictEqual(current.diagnostics(),{
  typed:2400,native:0,mismatches:0,exceptions:0,opponentEnabled:true});
});

test('corrupt or missing TypeScript always preserves native video and opponent metadata',async()=>{
 const good=(await compiled()).installScoutIdentityFieldsBridge({});
 const bridges=[null,
  {VERSION:'20.5.48',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.49',pureOnly:true,normalize:()=>({uid:'bad'})},
  {VERSION:'20.5.49',pureOnly:true,normalize:()=>{throw Error('load failed')}},
  {VERSION:'20.5.49',pureOnly:true,normalize:()=>null}];
 for(const bridge of bridges){
  const oldRun=harness('old'),newRun=harness('new',bridge);
  oldRun.advance();newRun.advance();
  const action={id:51,uid:'',videoStart:'5.75',videoAction:'6.25',videoEnd:'7.5',
   opponentPlayerUid:'r_04',clipId:'match-clip'};
  assert.deepStrictEqual(json(newRun.normalize(action)),json(oldRun.normalize(action)));
  assert.equal(newRun.context.calls,1);
  assert.equal(newRun.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.49')assert.ok(newRun.diagnostics().mismatches+newRun.diagnostics().exceptions>0);
 }
});

test('accessor-bearing actions use the native branch without extra getter reads',async()=>{
 const good=(await compiled()).installScoutIdentityFieldsBridge({});
 const oldRun=harness('old'),newRun=harness('new',good);
 oldRun.advance();newRun.advance();
 function action(counter){return {id:18,uid:'',
  get videoStart(){counter.reads++;return '2.5';},
  videoAction:5.5,videoEnd:6.5,opponentPlayerUid:'p_2'};}
 const before={reads:0},after={reads:0};
 assert.deepStrictEqual(json(newRun.normalize(action(after))),json(oldRun.normalize(action(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(newRun.diagnostics().native,1);
});

test('one early wrapper keeps both normalization boundaries and leaves writers unchanged',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.7.6');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20549-identity-normalizer-consolidation.test.cjs'));
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(file+'?v=20.7.0'),file);
 assert.ok(sw.includes('identity-video-consolidation-20.5.49'));
 assert.ok(source.includes('const v690NormActionBase=scoutNormalizeAction'));
 assert.ok(source.includes('v20549OpponentIdentityReady=true'));
 assert.ok(!source.includes('const v6100NormActionBase=scoutNormalizeAction'));
 assert.ok(source.includes('v20550MatchVideoReady=true'));
 assert.ok(!source.includes('const v6100NormMatchBase=scoutNormalizeMatch'));
 assert.ok(source.includes('const v6100PushBase=scoutPushAction'));
 assert.ok(source.includes('const v6108NormalizeActionBase=scoutNormalizeAction'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutIdentityFieldsBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20549Identity'));
 const pure=read('src/domain/scout-action-identity-fields.ts'),
  runtime=read('src/domain/scout-action-identity-fields-runtime.ts');
 for(const prohibited of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(prohibited)||runtime.includes(prohibited),false,prohibited);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
