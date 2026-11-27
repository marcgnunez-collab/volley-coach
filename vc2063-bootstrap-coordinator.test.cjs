'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function documentFixture(readyState='loading'){
 const listeners=new Map(),calls=[];
 const doc={readyState,addEventListener(name,callback,options){
  calls.push({name,callback,options});
  const list=listeners.get(name)||[];list.push(callback);listeners.set(name,list);
 }};
 return {doc,calls,dispatch(name){for(const cb of listeners.get(name)||[])cb();}};
}
function steps(events){return {installBridges:()=>events.push('bridges'),mountUi:()=>events.push('ui')};}

test('V20.6.3 coordinator does not initialize the match before start',async()=>{
 const mod=await compiled(),{doc,calls}=documentFixture(),win={document:doc};
 const events=[],api=mod.installBootstrapCoordinator(win,steps(events));
 assert.equal(api.VERSION,'20.6.3');assert.equal(api.singleInstance,true);
 assert.equal(api.nativeWritersPreserved,true);assert.ok(Object.isFrozen(api));
 assert.equal(win.VC_APP_BOOTSTRAP_2063,api);
 assert.equal(mod.installBootstrapCoordinator(win,steps([])),api);
 assert.deepEqual(events,[]);assert.equal(calls.length,0);
 assert.equal(api.diagnostics().phase,'created');
});

test('loading document installs bridges once and mounts UI once after DOMContentLoaded',async()=>{
 const mod=await compiled(),fixture=documentFixture('loading'),win={document:fixture.doc};
 const events=[],api=mod.installBootstrapCoordinator(win,steps(events));
 assert.equal(api.start(),true);assert.deepEqual(events,['bridges']);
 assert.equal(fixture.calls.length,1);assert.equal(fixture.calls[0].name,'DOMContentLoaded');
 assert.equal(fixture.calls[0].options.once,true);
 assert.equal(api.diagnostics().phase,'waiting');assert.equal(api.diagnostics().listenerPending,true);
 assert.equal(api.start(),true);assert.equal(fixture.calls.length,1);
 fixture.dispatch('DOMContentLoaded');
 assert.deepEqual(events,['bridges','ui']);
 assert.equal(api.diagnostics().phase,'ready');assert.equal(api.diagnostics().listenerPending,false);
 fixture.dispatch('DOMContentLoaded');assert.equal(api.start(),true);
 assert.deepEqual(events,['bridges','ui']);
 assert.equal(api.diagnostics().bridgeRuns,1);assert.equal(api.diagnostics().mountRuns,1);
 assert.equal(api.diagnostics().failures,0);
});

test('interactive and complete document start synchronously in original order',async()=>{
 const mod=await compiled();
 for(const state of ['interactive','complete']){
  const fixture=documentFixture(state),events=[];
  const api=mod.installBootstrapCoordinator({document:fixture.doc},steps(events));
  assert.equal(api.start(),true);assert.deepEqual(events,['bridges','ui']);
  assert.equal(fixture.calls.length,0);
  assert.equal(api.diagnostics().phase,'ready');
 }
});

test('separately loaded entry imports share the same guarded window coordinator',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete'),win={document:fixture.doc};
 const events=[],first=mod.installBootstrapCoordinator(win,steps(events));
 assert.equal(first.start(),true);
 let secondCalls=0;const second=mod.installBootstrapCoordinator(win,{
  installBridges:()=>secondCalls++,mountUi:()=>secondCalls++});
 assert.equal(second,first);assert.equal(second.start(),true);
 assert.equal(secondCalls,0);assert.deepEqual(events,['bridges','ui']);
});

test('nested reentrant start never dispatches a second point/writer initializer',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete'),win={document:fixture.doc};
 let api,installs=0,mounts=0;
 api=mod.installBootstrapCoordinator(win,{
  installBridges(){installs++;assert.equal(api.start(),true);},
  mountUi(){mounts++;assert.equal(api.start(),true);}
 });
 assert.equal(api.start(),true);assert.equal(installs,1);assert.equal(mounts,1);
 assert.equal(api.diagnostics().bridgeRuns,1);assert.equal(api.diagnostics().mountRuns,1);
});

test('a failing native bridge stops boot without retrying previous installers',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete'),win={document:fixture.doc};
 let installations=0,mounts=0;
 const api=mod.installBootstrapCoordinator(win,{
  installBridges(){installations++;throw Error('native bridge unavailable');},
  mountUi(){mounts++;}
 });
 assert.throws(()=>api.start(),/native bridge unavailable/);
 assert.equal(api.start(),false);assert.equal(installations,1);assert.equal(mounts,0);
 const diag=api.diagnostics();assert.equal(diag.phase,'failed');
 assert.equal(diag.bridgeRuns,1);assert.equal(diag.mountRuns,0);
 assert.equal(diag.failures,1);assert.equal(diag.lastError,'native bridge unavailable');
});

test('a mount failure does not double count the failure or mount a second time',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete'),win={document:fixture.doc};
 let installs=0,mounts=0;
 const api=mod.installBootstrapCoordinator(win,{
  installBridges(){installs++;},mountUi(){mounts++;throw Error('panel unavailable');}
 });
 assert.throws(()=>api.start(),/panel unavailable/);
 assert.equal(api.start(),false);assert.equal(installs,1);assert.equal(mounts,1);
 const d=api.diagnostics();assert.equal(d.phase,'failed');assert.equal(d.failures,1);
 assert.equal(d.bridgeRuns,1);assert.equal(d.mountRuns,1);
});

test('late DOMContentLoaded failure remains isolated and cannot cause duplicate mounts',async()=>{
 const mod=await compiled(),fixture=documentFixture('loading'),win={document:fixture.doc};
 let calls=0;const api=mod.installBootstrapCoordinator(win,{
  installBridges(){},mountUi(){calls++;throw Error('late mount failure');}
 });
 assert.equal(api.start(),true);
 assert.throws(()=>fixture.dispatch('DOMContentLoaded'),/late mount failure/);
 assert.equal(api.start(),false);
 assert.equal(api.diagnostics().failures,1);assert.equal(api.diagnostics().listenerPending,false);
 assert.equal(calls,1);
});

test('invalid/stale global startup marker cannot silently suppress the new coordinator',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete');
 const win={document:fixture.doc,VC_APP_BOOTSTRAP_2063:{VERSION:'old',start:()=>false}};
 const events=[],api=mod.installBootstrapCoordinator(win,steps(events));
 assert.equal(win.VC_APP_BOOTSTRAP_2063,api);assert.equal(api.start(),true);
 assert.deepEqual(events,['bridges','ui']);
});

test('diagnostics are frozen snapshots and cannot change running state',async()=>{
 const mod=await compiled(),fixture=documentFixture('complete'),win={document:fixture.doc};
 const api=mod.installBootstrapCoordinator(win,steps([])),before=api.diagnostics();
 assert.ok(Object.isFrozen(before));assert.equal(before.phase,'created');
 api.start();assert.equal(before.phase,'created');
 assert.equal(api.diagnostics().phase,'ready');assert.equal(api.diagnostics().failures,0);
});

test('all effective legacy installers and panel mounts remain inside one ordered start',()=>{
 const entry=read('src/vc2055-entry.ts');
 const section=entry.slice(entry.indexOf("if(typeof window!=='undefined'&&window.document){"));
 const begin=section.indexOf('installBridges:()=>{'),middle=section.indexOf('mountUi:()=>{');
 const end=section.indexOf('bootstrap.start();');
 assert.ok(begin>=0&&middle>begin&&end>middle);
 const installers=[...section.slice(begin,middle).matchAll(/\binstall[A-Z]\w*\(window\)/g)]
  .map(item=>item[0]);
 const mounts=[...section.slice(middle,end).matchAll(/\bmount[A-Z]\w*\(window\)/g)]
  .map(item=>item[0]);
 assert.ok(installers.length>=40,`installed ${installers.length}`);
 assert.equal(new Set(installers).size,installers.length,'No duplicated installers');
 assert.equal(new Set(mounts).size,mounts.length,'No duplicated mounts');
 assert.equal(mounts.length,18);
 assert.equal(installers[0],'installTrainingPlanningBridge(window)');
 assert.equal(installers.at(-1),'installAnalysisExportBridge(window)');
 assert.equal(mounts[0],'mountObservablePanel(window)');
 assert.equal(mounts.at(-1),'mountRuntimeHealthPanel(window)');
 assert.ok(section.includes('installNativeRallyPlan(window)'));
 assert.ok(section.includes('installSharedMatchContext(window)'));
 assert.ok(section.includes('installSharedRallyTimeline(window)'));
});

test('boot coordinator neither stores canonical matches nor owns media or sync writes',()=>{
 const source=read('src/state/bootstrap-coordinator.ts');
 for(const forbidden of ['scoutSave(', 'scoutAwardPoint(', 'scoutPushAction(',
  'localStorage', 'indexedDB','supabase','fetch(','.rallies.push(','.scoreUs++',
  'window.MatchState=', 'getSnapshot(', 'stopLiveDelay(', 'startLiveDelay('])
  assert.equal(source.includes(forbidden),false,forbidden);
});

test('V20.6.3 version, cache, Vite bundle and automation remain wired',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.6');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2063-bootstrap-coordinator.test.cjs'));
 assert.ok(html.includes('V20.6.3 · ARRANQUE ÚNICO'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('service-worker.js').includes('single-bootstrap-20.6.3'));
 assert.ok(read('src/vc2055-entry.ts').includes('installBootstrapCoordinator(window'));
 assert.ok(read('vc2055-domain-core.mjs').includes('VC_APP_BOOTSTRAP_2063'));
});
