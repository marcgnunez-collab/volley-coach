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
 assert.ok(a>=0&&b>a,'extract '+start);return source.slice(a,b);
}
const base=part('function scoutNormalizeAction(a){','function scoutNormalizeRally(r){');
const modern=part('/* V20.5.46 · The existing V6.8','let scoutingMatches=scoutArr(');
const v690=part('const v690NormActionBase=scoutNormalizeAction;','function v690NormalizeWorkflow(');
const v700=read('test-audit/fixtures/v20545-duplicate-video-normalization.txt');

function harness(bridge,mode='modern',extra='',now=1000){
 const calls={date:0,iso:0};
 class StubDate extends Date{static now(){calls.date++;return now;}}
 const context={window:mode==='modern'?{VC_SCOUT_ACTION_NORMALIZER_20546:bridge}:{},
  Date:StubDate,SCOUT_SKILLS:{S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',
   B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Cobertura'},
  scoutArr:v=>Array.isArray(v)?v:[],scoutNow:()=>{calls.iso++;return '2026-11-20T08:30:00Z';}};
 vm.runInNewContext(base+'\n'+(mode==='modern'?modern:'')+'\n'+extra,context,{timeout:3000});
 return {normalize:a=>context.scoutNormalizeAction(a),calls,
  diagnostics:()=>mode==='modern'?json(context.window.VC_SCOUT_ACTION_NORMALIZER_DIAGNOSTICS_20546()):null};
}

test('V20.5.46 action normalization installs once and canonical live actions share exact state identity',async()=>{
 const domain=await compiled(),holder={},api=domain.installScoutActionNormalizerBridge(holder);
 assert.equal(api.VERSION,'20.5.46');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.equal(api,domain.installScoutActionNormalizerBridge(holder));
 assert.equal(holder.VC_SCOUT_ACTION_NORMALIZER_20546,api);
 const live=[{id:15,code:'8A#',videoTime:5.75}];
 const window={MatchState:{getActive:()=>({liveRally:{actions:live}})}};
 assert.strictEqual(domain.readCanonicalLiveActions(window),live,'no copied live array');
 assert.strictEqual(domain.readCanonicalLiveActions(window)[0],live[0],'no copied action');
 assert.deepStrictEqual(domain.readCanonicalLiveActions({MatchState:{getActive:()=>({})}}),[]);
});

test('TypeScript base field projection agrees with native V6.8 normalization across old/new scouting formats',async()=>{
 const {normalizeScoutingActionBase}=await compiled();
 const old=harness(null,'legacy');
 let count=0;
 for(const skill of ['S','R','E','A','B','D','F','C','BAD',null])
 for(const team of ['ours','opponent',null])
 for(const evaluation of ['#','+','!','-','/','=','BAD'])
 for(const startZone of ['','1','4B']){
  const a={id:'101',seq:'2',team,skill,evaluation,startZone,endZone:'5D',
   playerId:'08',playerLabel:'#8',playerNumberSnapshot:'08',playerNameSnapshot:'PRIVATE',
   serveType:'JF',phase:'K1',setTarget:'Z4',attackCombo:'PIPE',attackTempo:'RAP',
   blockers:'2',validationWarnings:['x','y'],createdAt:'2024-01-01T00:00:00Z',
   scoutMs:'12005',videoTime:1.75,videoSource:'private-video',
   uid:'private-uid',videoExactSourceKey:'private-camera',customCode:'X1'};
  const before=JSON.stringify(a);
  const native=old.normalize(a);
  const typed=normalizeScoutingActionBase(a,native.id,native.createdAt);
  assert.deepStrictEqual(json(typed),json(native),JSON.stringify(a));
  assert.equal(JSON.stringify(a),before);
  count++;
 }
 assert.equal(count,630);
});

test('effective native base is called once even when TypeScript accepts its projection',async()=>{
 const bridge=(await compiled()).installScoutActionNormalizerBridge({});
 const modern=harness(bridge),native=harness(null,'legacy');
 const actions=[{},
  {team:'opponent',skill:'A',evaluation:'#',startZone:'4B',endZone:'6D',videoTime:10.25},
  {team:'ours',skill:'R',evaluation:'/',validationWarnings:['falta','doble'],scoutMs:-4},
  {team:'ours',skill:'B',evaluation:'=',playerNumberSnapshot:'11',videoSource:'camera'},
  {team:'ours',skill:'D',evaluation:'+',customCode:'X1',videoStart:3,clipId:'clip-01'}];
 for(const a of actions)assert.deepStrictEqual(json(modern.normalize(a)),json(native.normalize(a)));
 assert.equal(modern.calls.date,native.calls.date,'ID generator not called twice');
 assert.equal(modern.calls.iso,native.calls.iso,'wall clock not requested twice');
 assert.deepStrictEqual(modern.diagnostics(),{typed:actions.length,native:0,mismatches:0,exceptions:0});
});

test('removing duplicate V7.0 video normalization retains V6.9 and intermediate action fields',async()=>{
 const bridge=(await compiled()).installScoutActionNormalizerBridge({});
 const middle=`const prior=scoutNormalizeAction;scoutNormalizeAction=function(a){const x=prior(a);
  x.contactZone=String(a?.contactZone||'');x.opponentPlayerUid=String(a?.opponentPlayerUid||'');
  x.attackDirection=String(a?.attackDirection||'');return x};`;
 const old=harness(null,'legacy',v690+'\n'+middle+'\n'+v700);
 const current=harness(bridge,'modern',v690+'\n'+middle);
 const values=[undefined,null,0,1,12.345,'0','15.25','bad',-1,''];
 let count=0;
 for(const videoStart of values)for(const videoAction of values)
 for(const clipId of ['','clip-a']){
  const a={id:42,createdAt:'2026-01-01T00:00:00Z',skill:'A',evaluation:'#',
   videoStart,videoAction,videoEnd:videoStart,clipId,
   videoTimestamp:24.4,videoTime:10.5,videoExactSourceKey:'SENSITIVE',
   contactZone:'6B',opponentPlayerUid:'private',attackDirection:'LIN'};
  assert.deepStrictEqual(json(current.normalize(a)),json(old.normalize(a)));
  count++;
 }
 assert.equal(count,200);
 assert.equal(current.diagnostics().mismatches,0);
});

test('incorrect and unavailable TypeScript normalization never replaces the native result',async()=>{
 const good=(await compiled()).installScoutActionNormalizerBridge({});
 const corrupt=[null,
  {VERSION:'20.5.45',pureOnly:true,normalizeBase:good.normalizeBase},
  {VERSION:'20.5.46',pureOnly:true,normalizeBase:()=>({id:-99})},
  {VERSION:'20.5.46',pureOnly:true,normalizeBase:()=>{throw Error('typed failed');}},
  {VERSION:'20.5.46',pureOnly:true,normalizeBase:()=>null}];
 const a={id:9,skill:'A',evaluation:'#',startZone:'4',endZone:'6',
  createdAt:'2026-11-20T10:00:00Z',videoTime:10.75,videoExactSourceKey:'private'};
 for(const bad of corrupt){
  const modern=harness(bad),native=harness(null,'legacy');
  assert.deepStrictEqual(json(modern.normalize(a)),json(native.normalize(a)));
  assert.equal(modern.diagnostics().native,1);
  assert.equal(modern.calls.date,native.calls.date);
  if(bad?.VERSION==='20.5.46')assert.ok(modern.diagnostics().mismatches+modern.diagnostics().exceptions>0);
 }
});

test('accessor-bearing records stay on the historical path without second getter reads',async()=>{
 const good=(await compiled()).installScoutActionNormalizerBridge({});
 const modern=harness(good),native=harness(null,'legacy');
 let count=0;
 const a={id:100,skill:'S',evaluation:'+',createdAt:'2026-01-01T00:00:00Z',
  get startZone(){count++;return '1'}};
 assert.deepStrictEqual(json(modern.normalize(a)),json(native.normalize(a)));
 assert.equal(count,4,'the wrapper only reads the same accessor count as native');
 assert.equal(modern.diagnostics().native,1);
});

test('V20.5.46 publishes the canonical state reader and removes only the duplicate normalizer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.7.4');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20546-action-normalizer-migration.test.cjs'));
 for(const asset of ['021-core-scouting-v150-monolithic.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(asset+'?v=20.7.0'));
 assert.ok(sw.includes('action-normalizer-central-20.5.46'));
 assert.ok(source.includes('const v20546NativeNormalizeAction=scoutNormalizeAction'));
 assert.ok(!source.includes('const v700NormActionBase=scoutNormalizeAction'));
 assert.ok(source.includes('const v690NormActionBase=scoutNormalizeAction'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutActionNormalizerBridge(window)'));
 assert.ok(read('src/state/match-state-contract.ts').includes('export function readCanonicalLiveActions('));
 const pure=read('src/domain/scout-action-normalizer.ts'),
  runtime=read('src/domain/scout-action-normalizer-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase',
  'scoutPushAction(', 'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
