'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const first=source.indexOf('/* V20.5.75 · Typed orchestration');
const last=source.indexOf('function v857StampVideo',first);
assert.ok(first>=0&&last>first);
const registration=source.slice(first,last);

function harness(bridge,options={}){
 const match=options.noMatch?null:{id:34,status:options.finished?'finished':'live',
  liveRally:{actions:[]}};
 const set=options.noSet?null:{finished:!!options.setFinished};
 const calls={preprocess:0,guard:0,parse:0,push:0,count:0};
 const context={window:{VC_SCOUT_REG_LANE_20575:bridge},Error,
  scoutActive:()=>match,scoutSet:()=>set,
  v857Preprocess(raw){calls.preprocess++;return String(raw||'').trim().toUpperCase();},
  v857CheckedGuard(error){calls.guard++;return error},
  v857LiveCount(m){calls.count++;return m?.liveRally?.actions?.length??0},
  scoutArr:v=>Array.isArray(v)?v:[],
  v857PrepareNativeOnce(raw,m){
   calls.parse++;assert.equal(m,match);
   if(options.throwParse)throw Error('parser-failed');
   if(raw==='BAD')return {error:'Código no reconocido.'};
   const skill=raw.includes('A')?'A':raw.includes('E')?'E':'S';
   return {action:{skill,code:raw,evaluation:raw.includes('#')?'#':'!',
    playerNumberSnapshot:'7',team:'ours',
    videoTime:12.45,videoSourceKey:'camera-01',setterCall:'PIPE'}};
  },
  scoutPushAction(action){
   calls.push++;
   if(options.throwPush)throw Error('writer-failed');
   if(options.mutateOnDecline)match.liveRally.actions.push(action);
   if(options.decline||options.mutateOnDecline)return false;
   if(!options.noMutation)match.liveRally.actions.push(action);
   return true;
  }};
 vm.runInNewContext(registration,context,{timeout:3000});
 return {calls,match,context,register:raw=>context.v857RegisterRaw(raw,match),
  diagnostics:()=>copy(context.window.VC_SCOUT_REG_LANE_DIAGNOSTICS_20575())};
}

test('V20.5.75 typed lane has no writer of its own and is installed once',async()=>{
 const mod=await compiled(),host={},api=mod.installScoutRegistrationLane(host);
 assert.equal(api.VERSION,'20.5.75');assert.equal(api.nativeOnly,true);
 assert.equal(api.singleNativeWriter,true);assert.equal(host.VC_SCOUT_REG_LANE_20575,api);
 assert.equal(mod.installScoutRegistrationLane(host),api);assert.ok(Object.isFrozen(api));
 const src=read('src/domain/scout-registration-lane.ts')+
  read('src/domain/scout-registration-lane-runtime.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage','indexedDB',
  'supabase','fetch(','.awardPoint(','.undoRally(','window.scoutPushAction'])
  assert.equal(src.includes(forbidden),false,forbidden);
});

test('typed registration matches historical path for valid codes and preserves action/video identity',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 const samples=['7S#','7S+', '7E!','7A#', '7A-', 'R12A#',
  '7A#.4>2','7E+:PIPE','7A#!Z6','7S=~JF','7R+','7D-'];
 for(const raw of samples){
  const old=harness(null),modern=harness(api);
  const expected=old.register(raw),actual=modern.register(raw);
  assert.equal(JSON.stringify(actual),JSON.stringify(expected),raw);
  assert.equal(JSON.stringify(modern.match),JSON.stringify(old.match),raw);
  assert.equal(actual.ok,true);assert.equal(actual.match,modern.match);
  assert.equal(actual.action,modern.match.liveRally.actions[0]);
  assert.equal(actual.action.videoTime,12.45);
  assert.equal(actual.action.videoSourceKey,'camera-01');
  assert.equal(actual.action.setterCall,'PIPE');
  assert.equal(actual.raw,raw);
  assert.equal(modern.calls.parse,1);assert.equal(modern.calls.push,1);
  assert.equal(old.calls.parse,1);assert.equal(old.calls.push,1);
  assert.equal(modern.diagnostics().typed,1);
 }
});

test('50 consecutive fast scouting commands each call the original writer once in order',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 const old=harness(null),modern=harness(api),codes=Array.from({length:50},(_,i)=>
  `${(i%18)+1}${i%3===0?'S':i%3===1?'E':'A'}${i%2?'#':'+'}`);
 for(const code of codes){
  assert.equal(JSON.stringify(modern.register(code)),JSON.stringify(old.register(code)),code);
 }
 assert.equal(modern.calls.parse,50);assert.equal(modern.calls.push,50);
 assert.equal(old.calls.parse,50);assert.equal(old.calls.push,50);
 assert.equal(modern.match.liveRally.actions.length,50);
 assert.deepEqual(modern.match.liveRally.actions.map(a=>a.code),codes);
 assert.equal(modern.diagnostics().typed,50);
});

test('invalid code and native registration guards never call a second parser or writer',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 for(const [raw,options,expected] of [
  [' ',{},'Código vacío.'],['7S#',{noMatch:true},'No hay un scouting activo.'],
  ['7S#',{finished:true},'No hay un scouting activo.'],
  ['7S#',{noSet:true},'El set está cerrado.'],
  ['7S#',{setFinished:true},'El set está cerrado.'],
  ['BAD',{},'Código no reconocido.']]){
  const old=harness(null,options),modern=harness(api,options);
  assert.equal(JSON.stringify(modern.register(raw)),JSON.stringify(old.register(raw)));
  const diag=modern.register===undefined?null:modern.diagnostics();
  assert.ok(diag);assert.equal(modern.calls.push,0);
  assert.equal(modern.calls.parse,raw==='BAD'?1:0);
  assert.equal(old.calls.parse,modern.calls.parse);
  assert.equal(old.calls.push,modern.calls.push);
  assert.equal(modern.register===undefined,false);
  assert.equal(modern.match?.liveRally?.actions?.length??0,0);
  if(raw==='BAD')assert.equal(expected,'Código no reconocido.');
 }
});

test('declined write, no state mutation and partial state mutation are never retried',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 for(const options of [{decline:true},{noMutation:true},{mutateOnDecline:true}]){
  const old=harness(null,options),modern=harness(api,options);
  const actual=modern.register('7A#'),expected=old.register('7A#');
  assert.equal(JSON.stringify(actual),JSON.stringify(expected));
  assert.equal(actual.ok,false);assert.equal(actual.error,'La acción no se ha añadido al rally.');
  assert.equal(modern.calls.parse,1);assert.equal(modern.calls.push,1);
  assert.equal(old.calls.push,1);
  assert.equal(modern.match.liveRally.actions.length,old.match.liveRally.actions.length);
 }
});

test('native parser/writer exceptions propagate once with no fallback retry',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 for(const mode of ['throwParse','throwPush']){
  const old=harness(null,{[mode]:true}),modern=harness(api,{[mode]:true});
  assert.throws(()=>modern.register('7A#'),new RegExp(mode==='throwParse'?'parser-failed':'writer-failed'));
  assert.throws(()=>old.register('7A#'),new RegExp(mode==='throwParse'?'parser-failed':'writer-failed'));
  assert.equal(modern.calls.parse,1);assert.equal(modern.calls.push,mode==='throwPush'?1:0);
  assert.equal(modern.calls.parse,old.calls.parse);
  assert.equal(modern.calls.push,old.calls.push);
 }
});

test('missing or early-throwing bridge falls back once; late exceptions never write twice',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 for(const bridge of [null,{VERSION:'20.5.74'},
  {VERSION:'20.5.75',nativeOnly:true,singleNativeWriter:true,
   register:()=>{throw Error('before parser')}}]){
  const old=harness(null),modern=harness(bridge);
  assert.equal(JSON.stringify(modern.register('7S#')),JSON.stringify(old.register('7S#')));
  assert.equal(modern.calls.parse,1);assert.equal(modern.calls.push,1);
  assert.equal(modern.diagnostics().native,1);
 }
 const malicious={VERSION:'20.5.75',nativeOnly:true,singleNativeWriter:true,
  register({port}){const parsed=port.parse();port.push(parsed.action);
   port.push(parsed.action);return {ok:true}}};
 const blocked=harness(malicious);
 assert.throws(()=>blocked.register('7A#'),/ya se envió/);
 assert.equal(blocked.calls.parse,1);assert.equal(blocked.calls.push,1);
 assert.equal(blocked.match.liveRally.actions.length,1,'never dispatches duplicate action');
 assert.equal(blocked.diagnostics().native,0,'no fallback after native dispatch');
 assert.equal(blocked.diagnostics().exceptions,1);
 assert.equal(api.singleNativeWriter,true);
});

test('V20.5.75 retains one native writer, original rally/undo path, Vite and PWA',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),entry=read('src/vc2055-entry.ts');
 assert.equal(pkg.version,'20.6.3');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20575-scout-registration-lane.test.cjs'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.6.3'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.3'));
 assert.ok(read('service-worker.js').includes('scout-registration-lane-20.5.75'));
 assert.ok(entry.includes('installScoutRegistrationLane(window)'));
 assert.equal((source.match(/scoutPushAction=function\(action\)/g)||[]).length,3);
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'),
  'classic fallback retained for early page load');
 assert.ok(source.includes('return scoutPushAction(action);'),
  'typed adapter reaches the one native dispatch');
 assert.ok(source.includes('scoutUndoRally'));
 assert.ok(!read('src/domain/scout-registration-lane.ts').includes('localStorage'));
});
