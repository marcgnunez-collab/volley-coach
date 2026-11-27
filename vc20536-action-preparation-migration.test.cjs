'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function nativeHarness(prepareBridge){
 const source=read('021-core-scouting-v150-monolithic.js'),
  start=source.indexOf('function v857Preprocess(raw){'),
  end=source.indexOf('function v857StampVideo(action){',start);
 assert.ok(start>0&&end>start,'native preparation and writer must still be separate');
 const match={id:'match-one',status:'live',set:{finished:false},liveRally:{actions:[]}};
 const calls={preprocess:0,set:0,parser:0,push:0};
 let thrown=false,declined=false,lastParsed=null,lastPushed=null;
 const window={VC_SCOUT_REG_GUARD_20535:{VERSION:'20.5.35',preconditionsOnly:true,inspect:c=>
  !c.hasCode?'Código vacío.':!c.hasMatch||c.matchFinished?'No hay un scouting activo.':
  !c.hasSet||c.setFinished?'El set está cerrado.':null}};
 if(prepareBridge)window.VC_SCOUT_PREPARE_20536=prepareBridge;
 const context={window,match,
  scoutActive:()=>match,
  scoutV690PreprocessCode:raw=>{calls.preprocess++;return raw},
  scoutSet:m=>{calls.set++;return m?.set||null},
  v857LiveCount:m=>m.liveRally.actions.length,
  scoutV6108ParseRaw:(raw,m,old)=>{
   calls.parser++;assert.strictEqual(m,match);assert.equal(old,null);
   if(thrown)throw Error('native parser failure');
   if(raw==='REJECT')return {error:'Código no reconocido.'};
   const action={code:raw,team:'ours',playerId:8,playerNumberSnapshot:'08',
    playerNameSnapshot:'Nombre nativo',skill:'A',evaluation:'#',
    startZone:'4B',endZone:'5D',attackDirection:'DC',attackTempo:'T',
    scoutMs:12345,videoTime:12.3,videoExactTime:12.345,videoExactSourceKey:'video-a',
    sourceActionId:'original-1',uid:'uid-1',createdAt:'2026-01-01T12:00:00Z'};
   lastParsed={action};return lastParsed;
  },
  scoutPushAction:action=>{calls.push++;lastPushed=action;if(declined)return false;
   match.liveRally.actions.push(action);return true},
  scoutArr:list=>Array.isArray(list)?list:[]};
 vm.runInNewContext(source.slice(start,end),context,{timeout:2000});
 return {match,calls,window,register:raw=>context.v857RegisterRaw(raw,match),
  getLast:()=>({parsed:lastParsed,pushed:lastPushed}),
  setParserThrown:value=>thrown=value,setPushDeclined:value=>declined=value};
}

test('TypeScript prepares once, returns the same native result identity and only anonymous facts',async()=>{
 const {prepareNativeScoutingAction,inspectNativePreparation}=await compiled();
 const match={id:1},action={team:'ours',skill:'A',evaluation:'#',playerId:3,
  startZone:'4B',endZone:'5D',attackTempo:'T',videoTime:2.5,code:'3A#.4B>5D'};
 const returned={action};let called=0;
 const envelope=prepareNativeScoutingAction('3A#',match,(raw,m,old)=>{
  called++;assert.equal(raw,'3A#');assert.strictEqual(m,match);assert.equal(old,null);return returned;
 });
 assert.equal(called,1);assert.strictEqual(envelope.nativeResult,returned);
 assert.strictEqual(envelope.nativeResult.action,action);
 assert.equal(envelope.mode,'native-once');assert.ok(Object.isFrozen(envelope));
 assert.ok(Object.isFrozen(envelope.facts));
 assert.deepStrictEqual(envelope.facts,{parserReturnedAction:true,parserReturnedError:false,
  propertyCount:9,hasTeam:true,hasSkill:true,hasEvaluation:true,hasPlayer:true,
  hasZones:true,hasTacticalMetadata:true,hasVideoEvidence:true});
 assert.doesNotMatch(JSON.stringify(envelope.facts),/3A#|4B|5D|video-a/);
 assert.strictEqual(inspectNativePreparation({error:'Error de dorsal'}).parserReturnedError,true);
});

test('real native writer passes through original player, zones, tactical fields and video without cloning',async()=>{
 const typed=await compiled(),holder={};
 const bridge=typed.installScoutingPreparationBridge(holder);
 assert.equal(bridge.VERSION,'20.5.36');assert.equal(bridge.nativeOnly,true);
 assert.ok(Object.isFrozen(bridge));assert.strictEqual(typed.installScoutingPreparationBridge(holder),bridge);
 const h=nativeHarness(bridge),result=h.register(' 08a# '),saved=h.match.liveRally.actions[0],last=h.getLast();
 assert.equal(result.ok,true);assert.equal(result.before,0);assert.equal(result.after,1);
 assert.strictEqual(saved,last.parsed.action);assert.strictEqual(saved,last.pushed);
 assert.strictEqual(result.action,saved);
 assert.deepStrictEqual([saved.playerId,saved.playerNumberSnapshot,saved.skill,saved.evaluation,
  saved.startZone,saved.endZone,saved.attackDirection,saved.attackTempo,saved.scoutMs,
  saved.videoTime,saved.videoExactTime,saved.videoExactSourceKey,saved.createdAt],
  [8,'08','A','#','4B','5D','DC','T',12345,12.3,12.345,'video-a','2026-01-01T12:00:00Z']);
 assert.equal(result.raw,'08A#');
 assert.equal(h.calls.parser,1);assert.equal(h.calls.push,1);
 assert.deepStrictEqual(JSON.parse(JSON.stringify(h.window.VC_SCOUT_PREPARE_DIAGNOSTICS_20536())),
  {typed:1,classic:0,differences:0,exceptions:0,nativeCalls:1});
});

test('missing, mismatched or throwing preparation bridge preserves the native single writer',async()=>{
 const typed=await compiled(),reference=typed.installScoutingPreparationBridge({});
 const corrupt=[null,
  {VERSION:'20.5.36',nativeOnly:true,prepare:(raw,m,parser)=>{parser(raw,m,null);return {mode:'wrong',nativeResult:{}}}},
  {VERSION:'20.5.36',nativeOnly:true,prepare:(raw,m,parser)=>{parser(raw,m,null);throw Error('after parser')}},
  {VERSION:'20.5.36',nativeOnly:true,prepare:()=>{throw Error('before parser')}},
  {VERSION:'20.5.36',nativeOnly:true,prepare:(raw,m,parser)=>{
   const first=parser(raw,m,null);const again=parser(raw,m,null);assert.strictEqual(first,again);
   return {mode:'native-once',nativeResult:first};}},
  {VERSION:'20.5.36',nativeOnly:true,prepare:(raw,m,parser)=>parser(raw+'BAD',m,null)},
  {VERSION:'20.5.36',nativeOnly:true,prepare:()=>({mode:'native-once'})},
  reference];
 for(const bridge of corrupt){
  const h=nativeHarness(bridge),r=h.register('08A#');
  assert.equal(r.ok,true,'writer must still accept native result');
  assert.equal(h.calls.parser,1,'never invoke native parser twice');
  assert.equal(h.calls.push,1,'never invoke the writer twice');
  assert.equal(h.match.liveRally.actions.length,1);
  assert.strictEqual(h.match.liveRally.actions[0],h.getLast().parsed.action);
 }
});

test('native parse exceptions, rejections and push failures keep original error and counts',async()=>{
 const typed=await compiled(),bridge=typed.installScoutingPreparationBridge({});
 const h=nativeHarness(bridge);
 h.setParserThrown(true);
 assert.throws(()=>h.register('08A#'),/native parser failure/);
 assert.equal(h.calls.parser,1);assert.equal(h.calls.push,0);
 h.setParserThrown(false);
 const invalid=h.register('REJECT');assert.equal(invalid.ok,false);
 assert.equal(invalid.error,'Código no reconocido.');assert.equal(invalid.before,0);
 assert.equal(h.calls.parser,2);assert.equal(h.calls.push,0);
 h.setPushDeclined(true);
 const declined=h.register('08A#');assert.equal(declined.ok,false);
 assert.equal(declined.error,'La acción no se ha añadido al rally.');
 assert.equal(h.calls.parser,3);assert.equal(h.calls.push,1);
 assert.equal(h.match.liveRally.actions.length,0);
});

test('V20.5.36 installs a typed preparation boundary and preserves protected writers',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.80');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20536-action-preparation-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.80'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.5.80'));
 assert.ok(sw.includes('scout-action-preparation-20.5.36'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutingPreparationBridge(window)'));
 const typed=read('src/domain/scout-action-preparation.ts'),runtime=read('src/domain/scout-action-preparation-runtime.ts');
 for(const forbidden of ['indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=', 'window.MatchState=', 'localStorage','setItem(','fetch('])
  assert.equal(typed.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const native=read('021-core-scouting-v150-monolithic.js');
 assert.ok(native.includes('const parsed=v857PrepareNativeOnce(raw,m)'));
 assert.ok(native.includes('const pushed=scoutPushAction(parsed.action)'));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
