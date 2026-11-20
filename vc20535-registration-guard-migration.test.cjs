'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function nativeHarness(bridge){
 const original=read('021-core-scouting-v150-monolithic.js');
 const start=original.indexOf('function v857Preprocess(raw){'),end=original.indexOf('function v857StampVideo(action){',start);
 assert.ok(start>0&&end>start,'extract the exact original registration boundary');
 const match={id:'match-1',status:'live',set:{finished:false},liveRally:{actions:[]}};
 const calls={parser:0,push:0,set:0,preprocess:0};
 let declined=false;
 const window={};if(bridge)window.VC_SCOUT_REG_GUARD_20535=bridge;
 const context={window,match,
  scoutActive:()=>match,
  scoutV690PreprocessCode:raw=>{calls.preprocess++;return raw},
  scoutSet:m=>{calls.set++;return m?.set||null},
  v857LiveCount:m=>m.liveRally.actions.length,
  scoutV6108ParseRaw:raw=>{calls.parser++;return raw==='ERR'?{error:'Parser rechaza el código.'}:{action:{code:raw,skill:'A'}}},
  scoutPushAction:action=>{calls.push++;if(declined)return false;match.liveRally.actions.push(action);return true},
  scoutArr:list=>Array.isArray(list)?list:[]};
 vm.runInNewContext(original.slice(start,end),context,{timeout:2000});
 const register=(raw,m=match)=>context.v857RegisterRaw(raw,m);
 return {match,register,calls,window,setDeclined:value=>declined=value};
}

test('typed condition guard matches native precedence for every boolean combination',async()=>{
 const {inspectRegistrationConditions}=await compiled();
 for(let mask=0;mask<32;mask++){
  const c={hasCode:!!(mask&1),hasMatch:!!(mask&2),matchFinished:!!(mask&4),
   hasSet:!!(mask&8),setFinished:!!(mask&16)};
  const native=!c.hasCode?'Código vacío.':!c.hasMatch||c.matchFinished?'No hay un scouting activo.':
   !c.hasSet||c.setFinished?'El set está cerrado.':null;
  assert.equal(inspectRegistrationConditions(c),native);
 }
});

test('actual native registration delegates only the guard and still uses exactly one parser and writer',async()=>{
 const typed=await compiled(),target={};
 const bridge=typed.installRegistrationGuardBridge(target);
 assert.equal(bridge.VERSION,'20.5.35');assert.equal(bridge.preconditionsOnly,true);
 assert.ok(Object.isFrozen(bridge));assert.strictEqual(typed.installRegistrationGuardBridge(target),bridge);
 const h=nativeHarness(bridge);
 const success=h.register(' 12a# ');
 assert.equal(success.ok,true);assert.equal(success.before,0);assert.equal(success.after,1);
 assert.equal(success.raw,'12A#');
 assert.equal(h.match.liveRally.actions.length,1);
 assert.equal(h.calls.parser,1);assert.equal(h.calls.push,1);assert.equal(h.calls.set,1);
 assert.deepStrictEqual(JSON.parse(JSON.stringify(h.window.VC_SCOUT_REG_GUARD_DIAGNOSTICS_20535())),
  {typed:1,classic:0,differences:0,exceptions:0});
});

test('empty code, missing/finished match and missing/closed set return exact old errors without writes',async()=>{
 const typed=await compiled();
 for(const [scenario,expected] of [
  ['empty','Código vacío.'],['missing','No hay un scouting activo.'],
  ['finished','No hay un scouting activo.'],['setmissing','El set está cerrado.'],
  ['setfinished','El set está cerrado.']]){
  const h=nativeHarness(typed.installRegistrationGuardBridge({}));
  if(scenario==='finished')h.match.status='finished';
  if(scenario==='setmissing')h.match.set=null;
  if(scenario==='setfinished')h.match.set.finished=true;
  const result=h.register(scenario==='empty'?'   ':'12S#',scenario==='missing'?null:h.match);
  assert.equal(result.ok,false,scenario);
  assert.equal(result.error,expected,scenario);
  assert.equal(h.calls.parser,0,scenario);assert.equal(h.calls.push,0,scenario);
  assert.equal(h.calls.set,['setmissing','setfinished'].includes(scenario)?1:0,scenario);
 }
});

test('mismatched, throwing or absent typed guard cannot change registration or block valid input',()=>{
 for(const bridge of [null,{VERSION:'20.5.35',preconditionsOnly:true,inspect:()=> 'FORBIDDEN'},
  {VERSION:'20.5.35',preconditionsOnly:true,inspect:()=>{throw Error('faulty')}}]){
  const h=nativeHarness(bridge),empty=h.register('');
  assert.equal(empty.error,'Código vacío.');
  const success=h.register('7A#');
  assert.equal(success.ok,true);assert.equal(h.calls.parser,1);assert.equal(h.calls.push,1);
  const diag=h.window.VC_SCOUT_REG_GUARD_DIAGNOSTICS_20535();
  assert.equal(diag.classic,2);
  if(bridge)assert.equal(diag.differences+diag.exceptions,2);
 }
});

test('native failures after guard still preserve original parser and push outcomes',async()=>{
 const typed=await compiled(),h=nativeHarness(typed.installRegistrationGuardBridge({}));
 const rejected=h.register('ERR');
 assert.equal(rejected.error,'Parser rechaza el código.');
 assert.equal(rejected.before,0);assert.equal(rejected.after,0);
 assert.equal(h.calls.parser,1);assert.equal(h.calls.push,0);
 h.setDeclined(true);
 const declined=h.register('7A#');
 assert.equal(declined.error,'La acción no se ha añadido al rally.');
 assert.equal(h.calls.parser,2);assert.equal(h.calls.push,1);
 assert.equal(h.match.liveRally.actions.length,0);
});

test('V20.5.35 publishes a single pure guard without a second scorer, DB or cloud writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.51');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20535-registration-guard-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.51'));
 assert.ok(sw.includes('native-registration-guard-20.5.35'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRegistrationGuardBridge(window)'));
 const source=read('src/domain/scout-registration-guard.ts'),runtime=read('src/domain/scout-registration-guard-runtime.ts');
 for(const forbidden of ['indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=', 'window.MatchState=', 'localStorage','setItem(','fetch('])
  assert.equal(source.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 assert.ok(read('021-core-scouting-v150-monolithic.js').includes('v857CheckedGuard('));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
