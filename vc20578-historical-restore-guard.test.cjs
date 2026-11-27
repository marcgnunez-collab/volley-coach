'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const source=read('021-core-scouting-v150-monolithic.js');
const compiled=()=>import('./vc2055-domain-core.mjs');

test('V20.5.78 restore lane exposes a frozen pure guard, never another writer',async()=>{
 const mod=await compiled(),host={},lane=mod.installHistoricalRestoreLane(host);
 assert.equal(lane.VERSION,'20.5.78');
 assert.equal(lane.nativeOnly,true);assert.equal(lane.singleNativeWriter,true);
 assert.ok(Object.isFrozen(lane));
 assert.equal(host.VC_HISTORICAL_RESTORE_LANE_20578,lane);
 assert.equal(mod.installHistoricalRestoreLane(host),lane);
 const typed=read('src/domain/scout-historical-restore-gate.ts')+
  read('src/domain/scout-historical-restore-runtime.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage',
  'indexedDB','supabase','fetch(','.awardPoint(','.undoRally(','.push('])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('restore ticket is ephemeral, read-only and rejects live sessions',async()=>{
 const lane=(await compiled()).installHistoricalRestoreLane({});
 const finished={id:1,status:'finished',rallies:[]},matches=[finished];
 const view={teamKey:'club-a',activeId:1,activeMatch:finished,matches};
 const ticket=lane.capture(view);
 assert.ok(Object.isFrozen(ticket));
 assert.equal(ticket.matches,matches);
 assert.equal(lane.current(ticket,view),true);
 assert.equal(lane.capture({...view,activeMatch:{id:1,status:'live'}}),null);
 assert.equal(lane.current(ticket,{...view,activeMatch:{id:1,status:'live'}}),false);
 assert.equal(lane.capture({...view,matches:null}),null);
 const cyclic={id:1,status:'finished'};cyclic.loop=cyclic;
 assert.equal(lane.capture({...view,matches:[cyclic]}),null);
});

test('team, selection, match identity, list identity or in-place history change invalidate ticket',async()=>{
 const lane=(await compiled()).installHistoricalRestoreLane({});
 const match={id:1,status:'finished',opponent:'Rival',sets:[]},matches=[match];
 const view={teamKey:'club-a',activeId:1,activeMatch:match,matches};
 const ticket=lane.capture(view);
 for(const update of [
  {teamKey:'club-b'}, {activeId:2}, {activeMatch:{...match}},
  {matches:[{...match}]},{activeMatch:{...match,status:'live'}}
 ])assert.equal(lane.current(ticket,{...view,...update}),false);
 match.opponent='Rival modificado';
 assert.equal(lane.current(ticket,view),false);
 assert.equal(ticket.activeMatch,match);
});

test('empty selected match can be restored, but any addition during reading invalidates ticket',async()=>{
 const lane=(await compiled()).installHistoricalRestoreLane({});
 const matches=[],view={teamKey:2,activeId:null,activeMatch:null,matches};
 const ticket=lane.capture(view);
 assert.equal(lane.current(ticket,view),true);
 matches.push({id:25,status:'finished'});
 assert.equal(lane.current(ticket,view),false);
});

const helperStart=source.indexOf('/* V20.5.78 · History restore holds');
const helperEnd=source.indexOf('/* V20.5.77 · Historical editor owns',helperStart);
const restoreStart=source.indexOf("window.scoutV680RestoreSnapshot=async function(which='current'){");
const restoreEnd=source.indexOf('window.scoutV680DownloadBackup=function',restoreStart);
const importStart=source.indexOf('window.scoutV680ImportBackup=function(event){',restoreEnd);
const importEnd=source.indexOf('function v680ParseCode(',importStart);
assert.ok(helperStart>=0&&helperEnd>helperStart);
assert.ok(restoreStart>=0&&restoreEnd>restoreStart);
assert.ok(importStart>=0&&importEnd>importStart);
const legacyHandlers=source.slice(helperStart,helperEnd)+
 source.slice(restoreStart,restoreEnd)+source.slice(importStart,importEnd);

function historicalHarness(bridge){
 const current={id:1,status:'finished',opponent:'Original',sets:[]},matches=[current];
 const incoming={id:1,status:'finished',opponent:'Restaurado',sets:[]};
 const calls={save:0,confirm:0,render:0,close:0,view:0,read:0};
 const alerts=[];
 const pendingDb=[];
 let reader=null,confirmMutate=()=>{},fileTarget=null;
 const ctx={window:{VC_HISTORICAL_RESTORE_LANE_20578:bridge},
  equipoActivo:'club-a',scoutingActiveId:1,scoutingMatches:matches,
  scoutActive:()=>ctx.scoutingMatches.find(m=>Number(m.id)===Number(ctx.scoutingActiveId))||null,
  v680Key:which=>which,
  v680DBGet:()=>{calls.read++;return new Promise(resolve=>{pendingDb.push(resolve)})},
  v680When:iso=>iso,
  confirm:msg=>{calls.confirm++;confirmMutate(msg);return true},
  alert:message=>alerts.push(message),
  scoutNormalizeMatch:m=>JSON.parse(JSON.stringify(m)),
  scoutSave(){calls.save++},scoutV680CloseRecovery(){calls.close++},
  showView(){calls.view++},botonVista:()=>null,scoutRender(){calls.render++},
  FileReader:class {
   readAsText(file){reader=this;this.file=file}
  }};
 vm.runInNewContext(legacyHandlers,ctx,{timeout:3000});
 return {current,incoming,calls,alerts,ctx,
  restore:()=>ctx.window.scoutV680RestoreSnapshot('current'),
  resolveDb:backup=>{assert.ok(pendingDb.length>0);pendingDb.shift()(backup)},
  setConfirmMutation:fn=>confirmMutate=fn,
  switchTeam:()=>{ctx.equipoActivo='club-b'},
  switchMatch:()=>{ctx.scoutingActiveId=2},
  startLive:()=>{current.status='live'},
  modifyHistory:()=>{current.opponent='Cambiado'},
  replaceList:()=>{ctx.scoutingMatches=ctx.scoutingMatches.slice()},
  replaceMatch:()=>{ctx.scoutingMatches[0]={...current}},
  importFile:()=>{
   fileTarget={files:[{name:'backup.json'}],value:'backup.json'};
   return ctx.window.scoutV680ImportBackup({target:fileTarget});
  },
  finishRead:data=>{assert.ok(reader,'reader started');reader.result=data;reader.onload()},
  importedFileValue:()=>fileTarget?.value,
  saved:()=>ctx.scoutingMatches.find(m=>m.id===1),
  stats:()=>ctx.window.VC_HISTORICAL_RESTORE_DIAGNOSTICS_20578()};
}

test('native IndexedDB restore still saves exactly once and keeps original post-save UI',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const env=historicalHarness(api),request=env.restore();
 env.resolveDb({match:env.incoming,savedAt:'2026-11-26T10:00:00Z'});
 assert.equal(await request,true);
 assert.equal(env.calls.read,1);assert.equal(env.calls.confirm,1);
 assert.equal(env.calls.save,1);assert.equal(env.calls.close,1);
 assert.equal(env.calls.view,1);assert.equal(env.calls.render,1);
 assert.equal(env.saved().opponent,'Restaurado');
 assert.equal(env.stats().typed,1);assert.equal(env.stats().classic,0);
});

test('restore never overwrites another club or newly selected match after awaiting IndexedDB',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 for(const change of ['switchTeam','switchMatch','modifyHistory','replaceList','replaceMatch','startLive']){
  const env=historicalHarness(api),request=env.restore();
  env[change]();
  env.resolveDb({match:env.incoming,savedAt:'2026-11-26T10:00:00Z'});
  assert.equal(await request,false,change);
  assert.equal(env.calls.confirm,0,change);
  assert.equal(env.calls.save,0,change);
  assert.equal(env.calls.close,0,change);
  assert.match(env.alerts.join(' '),/Operación cancelada/,change);
 }
});

test('restore checks again after confirmation and cannot commit a newly live match',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const env=historicalHarness(api),request=env.restore();
 env.setConfirmMutation(()=>env.startLive());
 env.resolveDb({match:env.incoming,savedAt:'today'});
 assert.equal(await request,false);
 assert.equal(env.calls.confirm,1);assert.equal(env.calls.save,0);
 assert.equal(env.saved().opponent,'Original');
});

test('missing snapshot, live startup and unavailable typed bridge fail safely',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const missing=historicalHarness(api),request=missing.restore();
 missing.resolveDb(null);
 assert.equal(await request,false);assert.equal(missing.calls.save,0);
 const live=historicalHarness(api);live.startLive();
 assert.equal(await live.restore(),false);assert.equal(live.calls.read,0);
 for(const bridge of [null,{VERSION:'20.5.77'}]){
  const old=historicalHarness(bridge),future=old.restore();
  old.resolveDb({match:old.incoming,savedAt:'today'});
  assert.equal(await future,true);
  assert.equal(old.calls.save,1);assert.equal(old.stats().classic,1);
 }
});

test('file import retains native one-save behavior and clears the file input',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const env=historicalHarness(api);
 assert.equal(env.importFile(),true);
 env.finishRead(JSON.stringify({type:'volley-coach-scout-backup',match:env.incoming}));
 assert.equal(env.calls.save,1);assert.equal(env.calls.confirm,1);
 assert.equal(env.calls.close,1);assert.equal(env.calls.render,1);
 assert.equal(env.saved().opponent,'Restaurado');
 assert.equal(env.importedFileValue(),'');
});

test('file import stops if the club, match or history changes while FileReader is pending',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 for(const change of ['switchTeam','switchMatch','modifyHistory','replaceList','startLive']){
  const env=historicalHarness(api);
  assert.equal(env.importFile(),true);
  env[change]();
  env.finishRead(JSON.stringify({type:'volley-coach-scout-backup',match:env.incoming}));
  assert.equal(env.calls.confirm,0,change);
  assert.equal(env.calls.save,0,change);
  assert.equal(env.calls.close,0,change);
  assert.match(env.alerts.join(' '),/Operación cancelada/,change);
 }
});

test('file import checks state after confirmation and refuses malformed backups',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const env=historicalHarness(api);
 env.importFile();env.setConfirmMutation(()=>env.switchTeam());
 env.finishRead(JSON.stringify({type:'volley-coach-scout-recovery',match:env.incoming}));
 assert.equal(env.calls.confirm,1);assert.equal(env.calls.save,0);
 const broken=historicalHarness(api);
 broken.importFile();broken.finishRead('{bad json');
 assert.equal(broken.calls.save,0);
 assert.match(broken.alerts.join(' '),/No se pudo importar/);
});

test('two concurrent restore requests do not silently overwrite each other',async()=>{
 const api=(await compiled()).installHistoricalRestoreLane({});
 const env=historicalHarness(api);
 const first=env.restore();
 const second=env.restore();
 env.resolveDb({match:env.incoming,savedAt:'today'});
 assert.equal(await first,true);
 env.resolveDb({match:env.incoming,savedAt:'today'});
 assert.equal(await second,false);
 assert.equal(env.calls.save,1);
});

test('V20.5.78 PWA, source guard, old sync journal and compatibility remain wired',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.6.1');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20578-historical-restore-guard.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.1'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.6.1'));
 assert.ok(read('src/vc2055-entry.ts').includes('installHistoricalRestoreLane(window)'));
 assert.ok(read('service-worker.js').includes('historical-restore-20.5.78'));
 assert.ok(source.includes("scoutV680Backup('rally-edit',true)"));
 assert.ok(source.includes('const v6103RestoreBase=window.scoutV680RestoreSnapshot'));
 assert.ok(source.includes('const v6103ImportBase=window.scoutV680ImportBackup'));
});
