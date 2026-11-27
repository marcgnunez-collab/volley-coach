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
const old=read('test-audit/fixtures/v20547-advanced-normalizers.txt');
const from=source.indexOf('/* V20.5.48 · One field projection replaces');
const to=source.indexOf('const v880PushBase=scoutPushAction;',from);
assert.ok(from>=0&&to>from,'V20.5.48 merged normalizer exists');
const replacement=source.slice(from,to);
const compiled=()=>import('./vc2055-domain-core.mjs');

function harness(mode,bridge){
 const context={window:mode==='new'&&bridge?{VC_SCOUT_ADVANCED_FIELDS_20548:bridge}:{},calls:0,lastBase:null};
 const base=`var scoutNormalizeAction=function(a){calls++;const x={
  ...(a||{}),skill:a?.skill||'S',attackTempo:a?.normalizedTempo??a?.attackTempo??'RAP',
  contactZone:a?.priorContactZone??'6B',baseMarker:'preserved'};lastBase=x;return x;};`;
 const constants=`const V870_TEMPO={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
 const V870_SETTYPE={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};
 const V870_SUBTYPE={A:{HSP:'Hard spike',SSP:'Soft spike/topspin',TIP:'Tip'},
  E:{'1H':'1 hand set','2H':'2 hands set',BUMP:'Bump set',UND:'Underhand set',OTH:'Other set'},
  R:{L:'On left',R:'On right',LOW:'Low',OH:'Overhand',MID:'Middle line'},
  B:{AST:'Block assist',ATT:'Block attempt',SOFT:'Block on soft spike'},
  D:{COV:'Spike cover',AB:'After block',EMG:'Emergency',TIP:'Tip',SOFT:'Soft spike'}};
 const V870_LEGACY_TEMPO={RAP:'T',MED:'M',ALT:'H'};
 function v870CleanToken(v,max=10){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,max)};
 function v880CoordClone(c){return c&&Number.isFinite(Number(c.x))&&Number.isFinite(Number(c.y))?{x:Number(c.x),y:Number(c.y)}:null}`;
 vm.runInNewContext(base+'\n'+(mode==='new'?constants+'\n'+replacement:old),context,{timeout:4000});
 return {normalize:a=>context.scoutNormalizeAction(a),context,
  diagnostics:()=>mode==='new'?json(context.window.VC_SCOUT_ADVANCED_FIELDS_DIAGNOSTICS_20548()):null};
}
function initialFields(a){return {...(a||{}),skill:a?.skill||'S',
 attackTempo:a?.normalizedTempo??a?.attackTempo??'RAP',contactZone:a?.priorContactZone??'6B',baseMarker:'preserved'};}

test('V20.5.48 advanced field bridge is immutable, pure and installed once',async()=>{
 const domain=await compiled(),win={},api=domain.installScoutAdvancedFieldsBridge(win);
 assert.equal(api.VERSION,'20.5.48');assert.equal(api.pureOnly,true);
 assert.ok(Object.isFrozen(api));
 assert.strictEqual(win.VC_SCOUT_ADVANCED_FIELDS_20548,api);
 assert.strictEqual(domain.installScoutAdvancedFieldsBridge(win),api);
});

test('TypeScript matches archived V8.7/V8.8 normalizers across 1,400 action combinations',async()=>{
 const domain=await compiled(),historical=harness('old');
 let count=0;
 for(const skill of ['A','E','R','B','S','D','F'])
 for(const attackTempo of ['Q','U','T','RAP','ALT','MED','BAD',''])
 for(const skillSubtype of ['HSP','2H','LOW','AST',''])
 for(const dvSetType of ['F','C','b','P','?']){
  const input={skill,attackTempo,normalizedTempo:'',skillSubtype,dvSetType,
   setterCall:' Z4-a ',attackCode:' q3/p ',specialCode:'x?42',customCode:'x*9',
   endCone:count%3?String(count%8+1):'C9',locationMode:count%2?'cones':'zones',
   startCoordinate:{x:String(count%4),y:'2.125'},endCoordinate:{x:4.2,y:3.1},
   contactCoordinate:count%4?{x:'bad',y:0}:null,
   dvSourceActionId:count%2?'37':'',dvEndCone:count%3?'8':'BAD',
   dvStartZone:'4A',dvEndZone:'1D',dvEndSubzone:'D',dvPointPhase:'Breakpoint',
   dvPhase:'Transition',dvAttackPhase:'Reception',evaluation:'#',videoTimestamp:8.33};
  const before=JSON.stringify(input),historic=historical.normalize(input);
  const typed=domain.normalizeAdvancedScoutingFields(input,initialFields(input));
  assert.deepStrictEqual(json(typed),json(Object.fromEntries(Object.keys(typed).map(k=>[k,historic[k]]))),
   'advanced parity: '+JSON.stringify({skill,attackTempo,skillSubtype,dvSetType}));
  assert.equal(JSON.stringify(input),before,'pure TypeScript does not modify input');
  count++;
 }
 assert.equal(count,1400);
 assert.equal(historical.context.calls,count);
});

test('merged normalizer preserves every historical action field, property order and base identity',async()=>{
 const bridge=(await compiled()).installScoutAdvancedFieldsBridge({}),oldRun=harness('old'),now=harness('new',bridge);
 const actions=[null,{},
  {skill:'A',attackTempo:'RAP',attackCode:'Pipe_2',dvSetType:'p',
   endCone:'5',startCoordinate:{x:'1.5',y:3},contactCoordinate:{x:0,y:2.75},videoSource:'camA'},
  {skill:'E',setTempo:'MED',setterCall:'Z4/B',skillSubtype:'2H',endCone:9,
   dvEndCone:3,dvSourceActionId:13,priorContactZone:'5D'},
  {skill:'B',skillSubtype:'AST',locationMode:'cones',customCode:'$x20',dvPhase:'Serve'},
  {skill:'R',dvStartZone:'7C',endCoordinate:{x:-2,y:4},endCone:0,sourceActionId:74}];
 for(const a of actions){
  const was=oldRun.normalize(a),is=now.normalize(a);
  assert.deepStrictEqual(json(is),json(was));
  assert.strictEqual(is,now.context.lastBase);
  assert.strictEqual(was,oldRun.context.lastBase);
  assert.deepStrictEqual(Object.keys(is),Object.keys(was));
  if(is.startCoordinate)assert.notStrictEqual(is.startCoordinate,a?.startCoordinate);
 }
 assert.equal(now.context.calls,actions.length);
 assert.equal(oldRun.context.calls,actions.length);
 assert.deepStrictEqual(now.diagnostics(),{typed:actions.length,native:0,mismatches:0,exceptions:0});
});

test('bad, missing and throwing bridges fall back to the precise native V8.7/V8.8 result',async()=>{
 const good=(await compiled()).installScoutAdvancedFieldsBridge({});
 const broken=[null,{VERSION:'20.5.47',pureOnly:true,normalize:good.normalize},
  {VERSION:'20.5.48',pureOnly:true,normalize:()=>({attackTempo:'wrong'})},
  {VERSION:'20.5.48',pureOnly:true,normalize:()=>{throw Error('offline bundle');}},
  {VERSION:'20.5.48',pureOnly:true,normalize:()=>null},
  {VERSION:'20.5.48',pureOnly:true,normalize:(a,x)=>({...good.normalize(a,x),endCoordinate:{x:9,y:9}})}];
 for(const bridge of broken){
  const historical=harness('old'),now=harness('new',bridge);
  const input={skill:'A',attackTempo:'ALT',endCoordinate:{x:3,y:2},dvEndCone:8,customCode:'X'};
  assert.deepStrictEqual(json(now.normalize(input)),json(historical.normalize(input)));
  assert.equal(now.context.calls,1);
  assert.equal(now.diagnostics().native,1);
  if(bridge?.VERSION==='20.5.48')assert.ok(now.diagnostics().exceptions+now.diagnostics().mismatches>0);
 }
});

test('nested coordinate and top-level accessors stay native without new getter reads',async()=>{
 const bridge=(await compiled()).installScoutAdvancedFieldsBridge({});
 const historical=harness('old'),now=harness('new',bridge);
 function withGetter(counter){return {skill:'A',
  get attackTempo(){counter.tempo++;return 'Q'},
  startCoordinate:{get x(){counter.x++;return 1.25},y:3},
  endCoordinate:{x:2,y:1}};}
 const before={x:0,tempo:0},after={x:0,tempo:0};
 assert.deepStrictEqual(json(now.normalize(withGetter(after))),json(historical.normalize(withGetter(before))));
 assert.deepStrictEqual(after,before);
 assert.equal(now.diagnostics().native,1);
});

test('coordinate cloning, integer cones and legacy tempos retain native corner cases',async()=>{
 const bridge=(await compiled()).installScoutAdvancedFieldsBridge({});
 const now=harness('new',bridge),historic=harness('old');
 for(const input of [
  {skill:'A',attackTempo:'RAP',endCone:'08',startCoordinate:{x:0,y:0}},
  {skill:'E',setTempo:'ALT',endCone:'8',dvEndCone:'Infinity',dvSourceActionId:'NaN'},
  {skill:'A',attackTempo:'MED',endCone:3,contactZone:'9A',locationMode:'cones'},
  {skill:'S',attackCode:'AB1',startCoordinate:{x:Infinity,y:4},endCone:-1},
  {skill:'R',dvEndCone:0,customCode:'a-z1',specialCode:'e?10'}]){
  const actual=now.normalize(input),expected=historic.normalize(input);
  assert.deepStrictEqual(json(actual),json(expected));
  assert.equal(Object.is(actual.dvSourceActionId,expected.dvSourceActionId),true);
  assert.equal(actual.attackTempo,expected.attackTempo);
  assert.equal(actual.endCone,expected.endCone);
 }
});

test('advanced normalizer is published once without replacing the scorer, video or sync writers',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.3');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20548-advanced-field-consolidation.test.cjs'));
 const html=read('index.html'),sw=read('service-worker.js');
 for(const file of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js','vc2055-domain-core.mjs'])
  assert.ok(html.includes(file+'?v=20.6.3'),file);
 assert.ok(sw.includes('advanced-fields-consolidation-20.5.48'));
 assert.ok(source.includes('const v20548NormBase=scoutNormalizeAction'));
 assert.ok(!source.includes('const v870NormalizeBase=scoutNormalizeAction'));
 assert.ok(!source.includes('const v880NormalizeBase=scoutNormalizeAction'));
 assert.ok(source.includes('const v880PushBase=scoutPushAction'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutAdvancedFieldsBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('vc20548Advanced'));
 const pure=read('src/domain/scout-action-advanced-fields.ts'),runtime=read('src/domain/scout-action-advanced-fields-runtime.ts');
 for(const forbidden of ['Date.now','scoutNow','localStorage','indexedDB','supabase','scoutPushAction(',
  'scoutSave(', 'v121AwardPoint','window.MatchState='])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
