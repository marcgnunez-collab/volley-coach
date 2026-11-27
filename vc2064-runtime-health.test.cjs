'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const match=()=>({id:'SENSITIVE-MATCH',status:'live',currentSet:1,opponent:'SENSITIVE-RIVAL',
 sets:[{number:1,scoreUs:25,scoreOpponent:19,rallies:[{id:'SECRET-RALLY',actions:[{code:'PRIVATE-CODE'}]}]}],
 liveRally:{actions:[{id:'SECRET-ACTION',liveVideoTime:36}]}});
function fixture(){const m=match(),set=m.sets[0];const win={
 MatchState:{getActive:()=>m,getSet:()=>set},
 VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>m,getCurrentSet:()=>set},
 VC_MATCH_CONTEXT_2061:{VERSION:'20.6.1',readOnly:true,getSet:()=>set},
 VC_APP_BOOTSTRAP_2063:{diagnostics:()=>({phase:'ready'})},
 VC_DEVICE_SYNC:{diagnostics:()=>({cloudConnected:true,realtimeState:'SUBSCRIBED',
  liveOtherDeviceCount:1,deviceName:'SECRET-DEVICE',accountId:'SECRET-ACCOUNT'})},
 VC_SYNC_2011_JOURNAL:{inspect:()=>{throw Error('Should never inspect private journal');}},
 liveDelayDiagnostics:()=>({running:true,mediaId:'SECRET-VIDEO'})
 };return {win,m,set};}

test('V20.6.4 checks canonical Scouting, Video, online state and presence without writing',async()=>{
 const mod=await compiled(),{win}=fixture(),report=mod.inspectRuntimeHealth(win);
 assert.equal(report.version,'20.6.4');assert.equal(report.readOnly,true);
 assert.equal(report.overall,'ready');assert.equal(report.bootstrap,'ready');
 assert.equal(report.scouting.active,true);
 assert.equal(report.scouting.matchSourcesAgree,true);
 assert.equal(report.scouting.setSourcesAgree,true);
 assert.equal(report.video.moduleAvailable,true);assert.equal(report.video.liveDelayRunning,true);
 assert.equal(report.sync.deviceModuleAvailable,true);
 assert.equal(report.sync.cloudConnected,true);assert.equal(report.sync.realtimeSubscribed,true);
 assert.equal(report.sync.otherDevices,1);assert.equal(report.sync.journalAvailable,true);
 assert.deepEqual([...report.warnings],[]);
});

test('health report never includes private IDs, scores, names or video positions',async()=>{
 const mod=await compiled(),{win}=fixture(),json=JSON.stringify(mod.inspectRuntimeHealth(win));
 for(const secret of ['SENSITIVE-MATCH','SENSITIVE-RIVAL','SECRET-RALLY','SECRET-ACTION',
  'PRIVATE-CODE','SECRET-DEVICE','SECRET-ACCOUNT','SECRET-VIDEO','36','25'])
  assert.equal(json.includes(secret),false,secret);
});

test('an offline account is reported as disconnected, not successful or corrupted',async()=>{
 const mod=await compiled(),{win}=fixture();
 win.VC_DEVICE_SYNC.diagnostics=()=>({cloudConnected:false,realtimeState:'CLOSED',
  liveOtherDeviceCount:3});
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.sync.cloudConnected,false);
 assert.equal(report.sync.realtimeSubscribed,false);
 assert.equal(report.sync.otherDevices,null,'Stale presence is hidden while disconnected');
 assert.equal(report.overall,'ready');
 assert.equal(report.warnings.length,0);
});

test('module existence never pretends a cloud session or a video recording is active',async()=>{
 const mod=await compiled(),{win}=fixture();
 delete win.liveDelayDiagnostics;
 win.VC_DEVICE_SYNC.diagnostics=()=>({});
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.video.moduleAvailable,true);
 assert.equal(report.video.liveDelayRunning,null);
 assert.equal(report.sync.deviceModuleAvailable,true);
 assert.equal(report.sync.cloudConnected,null);
 assert.equal(report.sync.realtimeSubscribed,null);
 assert.equal(report.sync.otherDevices,null);
});

test('different native match references produce a warning without modifying either match',async()=>{
 const mod=await compiled(),{win,m}=fixture(),other=match();
 other.id='SECOND-PRIVATE-MATCH';win.VC_SCOUT_VIDEO_BRIDGE.getActive=()=>other;
 const before=JSON.stringify(m),report=mod.inspectRuntimeHealth(win);
 assert.equal(report.scouting.matchSourcesAgree,false);
 assert.equal(report.overall,'attention');assert.equal(report.warnings.length,1);
 assert.equal(JSON.stringify(m),before);
 assert.equal(other.id,'SECOND-PRIVATE-MATCH');
});

test('disagreement about the active set is visible and never causes an automatic correction',async()=>{
 const mod=await compiled(),{win,m}=fixture();
 const alternate={number:2,scoreUs:0,scoreOpponent:0,rallies:[]};
 m.sets.push(alternate);win.VC_MATCH_CONTEXT_2061.getSet=()=>alternate;
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.scouting.matchSourcesAgree,true);
 assert.equal(report.scouting.setSourcesAgree,false);
 assert.equal(report.overall,'attention');
 assert.equal(m.currentSet,1);assert.equal(m.sets[0].scoreUs,25);
});

test('broken video and sync diagnostic getters do not interrupt Scouting',async()=>{
 const mod=await compiled(),{win}=fixture();
 win.VC_SCOUT_VIDEO_BRIDGE.getActive=()=>{throw Error('SECRET-VIDEO-EXCEPTION')};
 win.VC_DEVICE_SYNC.diagnostics=()=>{throw Error('SECRET-CLOUD-EXCEPTION')};
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.overall,'attention');
 assert.equal(report.sync.cloudConnected,null);assert.equal(report.scouting.active,true);
 assert.equal(report.warnings.length,2);
 assert.equal(JSON.stringify(report).includes('SECRET-'),false);
});

test('throwing property accessors in optional diagnostic modules are contained',async()=>{
 const mod=await compiled(),{win}=fixture();
 Object.defineProperty(win.VC_DEVICE_SYNC,'diagnostics',{
  configurable:true,get(){throw Error('SENSITIVE-CLOUD-GETTER')}});
 Object.defineProperty(win.VC_SCOUT_VIDEO_BRIDGE,'getCurrentSet',{
  configurable:true,get(){throw Error('SENSITIVE-VIDEO-GETTER')}});
 Object.defineProperty(win.VC_SYNC_2011_JOURNAL,'inspect',{
  configurable:true,get(){throw Error('SENSITIVE-JOURNAL-GETTER')}});
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.scouting.active,true);assert.equal(report.overall,'attention');
 assert.equal(report.sync.journalAvailable,false);
 assert.equal(report.warnings.length,3);
 assert.equal(JSON.stringify(report).includes('SENSITIVE-'),false);
});

test('an absent optional bridge is unknown, not falsely declared mismatched',async()=>{
 const mod=await compiled(),{win}=fixture();
 delete win.VC_MATCH_CONTEXT_2061;delete win.VC_SCOUT_VIDEO_BRIDGE;
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.scouting.active,true);
 assert.equal(report.scouting.matchSourcesAgree,null);
 assert.equal(report.scouting.setSourcesAgree,null);
 assert.equal(report.video.moduleAvailable,false);
 assert.equal(report.overall,'attention');
});

test('no active match is a normal idle state, not a fabricated failure',async()=>{
 const mod=await compiled(),{win}=fixture();
 win.MatchState.getActive=()=>null;win.VC_SCOUT_VIDEO_BRIDGE.getActive=()=>null;
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.scouting.active,false);
 assert.equal(report.scouting.matchSourcesAgree,null);
 assert.equal(report.scouting.setSourcesAgree,null);
 assert.equal(report.overall,'ready');
});

test('failed boot is blocked; loading boot is waiting, without retrying it',async()=>{
 const mod=await compiled(),{win}=fixture();
 let attempts=0;win.VC_APP_BOOTSTRAP_2063={diagnostics:()=>({phase:'failed'}),
  start:()=>{attempts++;}};
 let report=mod.inspectRuntimeHealth(win);
 assert.equal(report.bootstrap,'failed');assert.equal(report.overall,'blocked');
 assert.equal(attempts,0);
 win.VC_APP_BOOTSTRAP_2063={diagnostics:()=>({phase:'waiting'}),start:()=>{attempts++;}};
 report=mod.inspectRuntimeHealth(win);
 assert.equal(report.bootstrap,'waiting');assert.equal(report.overall,'waiting');
 assert.equal(attempts,0);
});

test('missing bootstrap, sync and media modules never throw or invent device counts',async()=>{
 const mod=await compiled(),report=mod.inspectRuntimeHealth({});
 assert.equal(report.overall,'waiting');assert.equal(report.bootstrap,'unavailable');
 assert.equal(report.scouting.active,false);assert.equal(report.video.moduleAvailable,false);
 assert.equal(report.sync.deviceModuleAvailable,false);
 assert.equal(report.sync.otherDevices,null);
});

test('a journal API is only checked for availability, never asked for account contents',async()=>{
 const mod=await compiled(),{win}=fixture();
 let inspections=0;win.VC_SYNC_2011_JOURNAL.inspect=()=>{inspections++;return []};
 const report=mod.inspectRuntimeHealth(win);
 assert.equal(report.sync.journalAvailable,true);assert.equal(inspections,0);
});

test('health bridge is frozen, installed once, and never refreshes a cloud connection',async()=>{
 const mod=await compiled(),{win}=fixture();
 let connects=0;win.VC_DEVICE_SYNC.connect=()=>connects++;
 const api=mod.installRuntimeHealthBridge(win);
 assert.ok(Object.isFrozen(api));assert.equal(api.VERSION,'20.6.4');
 assert.equal(api.readOnly,true);assert.equal(win.VC_RUNTIME_HEALTH_2064,api);
 assert.equal(mod.installRuntimeHealthBridge(win),api);
 assert.equal(api.inspect().overall,'ready');assert.equal(connects,0);
});

test('a stale global health marker does not replace the verified native inspector',async()=>{
 const mod=await compiled(),{win}=fixture();
 win.VC_RUNTIME_HEALTH_2064={VERSION:'old',inspect:()=>({overall:'wrong'})};
 const api=mod.installRuntimeHealthBridge(win);
 assert.equal(win.VC_RUNTIME_HEALTH_2064,api);
 assert.equal(api.inspect().overall,'ready');
});

function panelFixture(){
 const listeners=[];
 const button={addEventListener:(event,cb)=>{listeners.push({event,cb})}};
 const output={textContent:'',dataset:{}};
 const {win}=fixture();win.document={getElementById:id=>id==='vc2064-check'?button:
  id==='vc2064-status'?output:null};
 return {win,listeners,button,output};
}
test('Gestion check button is on-demand, idempotent and displays real device status',async()=>{
 const mod=await compiled(),{win,listeners,output}=panelFixture();
 const api=mod.mountRuntimeHealthPanel(win);
 assert.equal(api.VERSION,'20.6.4');assert.equal(listeners.length,1);
 assert.equal(listeners[0].event,'click');
 assert.equal(mod.mountRuntimeHealthPanel(win),api);assert.equal(listeners.length,1);
 assert.equal(output.textContent,'','The check must not run before a click');
 listeners[0].cb();
 assert.ok(output.textContent.includes('Arranque: Listo'));
 assert.ok(output.textContent.includes('Scouting: Partido activo'));
 assert.ok(output.textContent.includes('Nube: Conectada a Realtime'));
 assert.ok(output.textContent.includes('Otros dispositivos: 1'));
 assert.equal(output.dataset.state,'ready');
});

test('Gestion shows disconnected state explicitly, without showing stale presence',async()=>{
 const mod=await compiled(),{win,listeners,output}=panelFixture();
 win.VC_DEVICE_SYNC.diagnostics=()=>({cloudConnected:false,realtimeState:'CLOSED'});
 mod.mountRuntimeHealthPanel(win);listeners[0].cb();
 assert.ok(output.textContent.includes('Nube: Desconectada'));
 assert.ok(output.textContent.includes('Otros dispositivos: —'));
});

test('missing Gestion elements produce no listener or source mutation',async()=>{
 const mod=await compiled(),{win}=panelFixture();win.document.getElementById=()=>null;
 assert.equal(mod.mountRuntimeHealthPanel(win),null);
});

test('all report parts are immutable and the check cannot write match state',async()=>{
 const mod=await compiled(),{win,m}=fixture();
 const before=JSON.stringify(m),report=mod.inspectRuntimeHealth(win);
 for(const part of [report,report.scouting,report.video,report.sync,report.warnings])
  assert.ok(Object.isFrozen(part));
 assert.equal(JSON.stringify(m),before);
});

test('V20.6.4 application shell, Vite exports and safe read-only policy are wired',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.6');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2064-runtime-health.test.cjs'));
 assert.ok(html.includes('V20.6.4 · ESTABILIDAD Y DIAGNÓSTICO'));
 assert.ok(html.includes('id="vc2064-check"'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('service-worker.js').includes('runtime-health-20.6.4'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRuntimeHealthBridge(window)'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountRuntimeHealthPanel(window)'));
 assert.ok(read('vc2055-domain-core.mjs').includes('VC_RUNTIME_HEALTH_2064'));
 const source=read('src/state/runtime-health.ts')+read('src/state/runtime-health-runtime.ts');
 for(const forbidden of ['scoutSave(', 'scoutAwardPoint(', 'scoutPushAction(',
  'localStorage','indexedDB','supabase','fetch(','.rallies.push(','.scoreUs++',
  'connectRealtime(', 'refreshPresence(', 'setItem(', 'getItem('])
  assert.equal(source.includes(forbidden),false,forbidden);
});
