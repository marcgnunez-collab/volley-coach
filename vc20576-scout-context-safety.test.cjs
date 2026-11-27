'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const directStart=source.indexOf('/* V20.5.76 · Same native writer');
const directEnd=source.indexOf('function v857RegisterRaw',directStart);
assert.ok(directStart>=0&&directEnd>directStart);
const directCode=source.slice(directStart,directEnd);
const registrationEnd=source.indexOf('function v857StampVideo',directEnd);
const registrationCode=source.slice(directEnd,registrationEnd);

function directHarness(bridge,options={}){
 const match={id:12,status:'live',liveRally:{actions:[]}};
 const set={number:1,finished:false};
 const other={id:13,status:'live',liveRally:{actions:[]}};
 let active=match,activeSet=set;
 const alerts=[],calls={push:0};
 const context={window:{VC_SCOUT_DIRECT_LANE_20576:bridge},Error,
  scoutActive:()=>active,scoutSet:()=>activeSet,
  alert:msg=>alerts.push(msg),
  scoutPushAction(action){calls.push++;
   if(options.throwPush)throw Error('native-writer-failed');
   if(!options.noMutation)active.liveRally.actions.push(action);
   return options.decline?false:true;
  }};
 vm.runInNewContext(directCode,context,{timeout:3000});
 return {match,set,other,calls,alerts,context,
  switchMatch(){active=other;activeSet={number:2,finished:false}},
  closeSet(){set.finished=true},
  dispatch:action=>context.v20576CommitDirectAction(action,match,set),
  stats:()=>context.window.VC_SCOUT_DIRECT_DIAGNOSTICS_20576()};
}

test('V20.5.76 publishes one immutable native-only direct action lane',async()=>{
 const mod=await compiled(),host={},api=mod.installScoutDirectActionLane(host);
 assert.equal(api.VERSION,'20.5.76');assert.equal(api.nativeOnly,true);
 assert.equal(api.singleNativeWriter,true);
 assert.equal(host.VC_SCOUT_DIRECT_LANE_20576,api);
 assert.equal(mod.installScoutDirectActionLane(host),api);
 assert.ok(Object.isFrozen(api));
 const typed=read('src/domain/scout-direct-action-lane.ts')+
  read('src/domain/scout-direct-action-runtime.ts');
 for(const illegal of ['scoutSave(', 'scoutPushAction(', 'localStorage',
  'indexedDB','supabase','fetch(','.awardPoint(','.undoRally('])
  assert.equal(typed.includes(illegal),false,illegal);
});

test('typed direct lane preserves exact object, metadata and native writer result',async()=>{
 const api=(await compiled()).installScoutDirectActionLane({});
 const match={},set={};
 const coordinate={x:0.35,y:0.72};
 const action={skill:'A',evaluation:'#',locationMode:'cones',endCone:5,
  startCoordinate:coordinate,videoTime:12.3,videoSourceKey:'court',
  setterCall:'PIPE',blockers:'2'};
 const calls=[];
 const output=api.dispatch({action,expectedMatch:match,expectedSet:set,port:{
  current:()=>({match,set,open:true}),push:a=>{calls.push(a);return 'native-result';}
 }});
 assert.equal(output,'native-result');assert.equal(calls.length,1);
 assert.equal(calls[0],action);assert.equal(calls[0].startCoordinate,coordinate);
 assert.equal(calls[0].videoTime,12.3);assert.equal(calls[0].endCone,5);
});

test('typed direct lane rejects changed match, changed set and closed contexts',async()=>{
 const api=(await compiled()).installScoutDirectActionLane({});
 const match={},set={},differentMatch={},differentSet={},action={skill:'S'};
 for(const current of [
  {match:differentMatch,set,open:true},
  {match,set:differentSet,open:true},
  {match,set,open:false},
  {match:null,set:null,open:false}
 ]){
  let pushes=0;
  assert.equal(api.dispatch({action,expectedMatch:match,expectedSet:set,port:{
   current:()=>current,push:()=>{pushes++;return true;}
  }}),false);
  assert.equal(pushes,0);
 }
});

test('manual and court action dispatcher never retries after native side effects',async()=>{
 const api=(await compiled()).installScoutDirectActionLane({});
 for(const options of [{},{decline:true},{noMutation:true},{throwPush:true}]){
  const env=directHarness(api,options),action={skill:'A',endCone:3};
  if(options.throwPush)assert.throws(()=>env.dispatch(action),/native-writer-failed/);
  else assert.equal(env.dispatch(action),options.decline?false:true);
  assert.equal(env.calls.push,1);
  assert.equal(env.match.liveRally.actions.length,
   options.noMutation||options.throwPush?0:1);
  assert.equal(env.stats().nativePushes,1);
  assert.equal(env.stats().native,0);
 }
});

test('manual/court dispatcher retains one native fallback and never writes to new match',async()=>{
 const api=(await compiled()).installScoutDirectActionLane({});
 for(const bridge of [null,{VERSION:'20.5.75'},
  {VERSION:'20.5.76',nativeOnly:true,singleNativeWriter:true,
   dispatch(){throw Error('before native writer')}}]){
  const env=directHarness(bridge),a={skill:'A'};
  assert.equal(env.dispatch(a),true);
  assert.equal(env.calls.push,1);assert.equal(env.match.liveRally.actions[0],a);
  assert.equal(env.stats().native,1);
 }
 const swapped=directHarness(api);
 swapped.switchMatch();
 assert.equal(swapped.dispatch({skill:'S'}),false);
 assert.equal(swapped.calls.push,0);
 assert.equal(swapped.other.liveRally.actions.length,0);
 assert.match(swapped.alerts.join(' '),/partido o set ha cambiado/);
 const closed=directHarness(api);closed.closeSet();
 assert.equal(closed.dispatch({skill:'S'}),false);
 assert.equal(closed.calls.push,0);
});

test('malformed direct adapters cannot trigger a second native write',()=>{
 const evil={VERSION:'20.5.76',nativeOnly:true,singleNativeWriter:true,
  dispatch({action,port}){port.push(action);port.push(action);}};
 const env=directHarness(evil);
 assert.throws(()=>env.dispatch({skill:'A'}),/ya se ha enviado/);
 assert.equal(env.calls.push,1);
 assert.equal(env.match.liveRally.actions.length,1);
 assert.equal(env.stats().native,0);
});

function codeHarness(bridge,options={}){
 const match={id:22,status:'live',currentSet:1,liveRally:{actions:[]}};
 const set={number:1,finished:false};
 let active=match,currentSet=set;
 const calls={parse:0,push:0};
 const ctx={window:{VC_SCOUT_REG_LANE_20575:bridge},Error,
  v20575RegistrationStats:{typed:0,native:0,exceptions:0,
   rejected:0,nativeParses:0,nativePushes:0},
  scoutActive:()=>active,scoutSet:()=>currentSet,
  v857Preprocess:r=>r,v857CheckedGuard:e=>e,
  v857LiveCount:m=>m.liveRally.actions.length,
  scoutArr:a=>Array.isArray(a)?a:[],
  v857PrepareNativeOnce(raw){calls.parse++;
   if(options.changeDuringParse)active={id:23,status:'live'};
   if(options.closeDuringParse)currentSet={number:2,finished:false};
   return {action:{skill:'A',code:raw}};
  },
  scoutPushAction(action){calls.push++;active.liveRally.actions.push(action);return true;}};
 vm.runInNewContext(registrationCode,ctx,{timeout:3000});
 return {match,calls,register:()=>ctx.v857RegisterRaw('7A#',match)};
}

test('quick code re-checks match and set after parser, before any writer',async()=>{
 const api=(await compiled()).installScoutRegistrationLane({});
 for(const bridge of [api,null])for(const mode of ['changeDuringParse','closeDuringParse']){
  const env=codeHarness(bridge,{[mode]:true});
  const result=env.register();
  assert.equal(result.ok,false);
  assert.match(result.error,/partido o set ha cambiado/);
  assert.equal(env.calls.parse,1);assert.equal(env.calls.push,0);
  assert.equal(env.match.liveRally.actions.length,0);
 }
});

test('final manual form captures original match, court cone and coordinates',()=>{
 const from=source.lastIndexOf('window.scoutAddManualAction=function(){');
 const to=source.indexOf('const v880FieldsBase',from);
 assert.ok(from>0&&to>from);
 const manual=source.slice(from,to);
 const match={id:4},set={number:1},origin={x:.2,y:.4},destination={x:.6,y:.8};
 const form={
  'scout-action-team':'ours','scout-action-player':'7',
  'scout-action-skill':'A','scout-action-eval':'#',
  'scout-action-start':'4','scout-action-end':'2',
  'scout-action-location-mode':'cones','scout-action-end-cone':'5'};
 const received=[];
 const ctx={window:{},alert:()=>{},
  scoutActive:()=>match,scoutSet:()=>set,
  $:id=>({value:form[id]??''}),
  v860ZoneToken:(zone,sub)=>zone+sub,
  v870CleanToken:v=>v,v870FieldValue:()=>'',
  scoutV6108NormalizeZoneInput:(skill,start,end)=>({startZone:start,endZone:end}),
  v880OriginCoord:origin,v880DestCoord:destination,
  V880_CONTACT_SKILLS:new Set(['A']),
  v880DataVolleyFields:(action,m)=>{assert.equal(m,match);return {dv:'original'}},
  v20576CommitDirectAction:(action,m,s)=>{received.push({action,m,s});return true;}};
 vm.runInNewContext(manual,ctx,{timeout:3000});
 assert.equal(ctx.window.scoutAddManualAction(),true);
 assert.equal(received.length,1);
 assert.equal(received[0].m,match);assert.equal(received[0].s,set);
 assert.equal(received[0].action.endCone,5);
 assert.equal(received[0].action.locationMode,'cones');
 assert.equal(received[0].action.startCoordinate,origin);
 assert.equal(received[0].action.endCoordinate,null);
 assert.equal(received[0].action.contactCoordinate,destination);
 assert.equal(received[0].action.dv,'original');
});

test('public scouting push and every later video wrapper use guarded direct lane',()=>{
 assert.ok(source.includes('push:(action)=>v20576CommitDirectAction(action)'));
 assert.ok(source.includes('commitDirect:(action,m=scoutActive()'));
 for(const file of ['077-v132-scouting-pro-workspace.js',
  '089-v152-smart-rally-reports-exchange.js','index.html']){
  const text=read(file);
  assert.ok(text.includes('window.VC_SCOUT_CORE.commitDirect(a)'),file);
 }
 assert.equal((source.match(/scoutPushAction=function\(action\)/g)||[]).length,3);
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(source.includes('return scoutPushAction(action);'));
});

test('version, Vite, public files and unique cache include V20.5.76',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.7.2');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20576-scout-context-safety.test.cjs'));
 const html=read('index.html'),entry=read('src/vc2055-entry.ts');
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.7.0'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(html.includes('SCOUTING MANUAL Y PISTA'));
 assert.ok(entry.includes('installScoutDirectActionLane(window)'));
 assert.ok(read('service-worker.js').includes('scout-context-20.5.76'));
});
