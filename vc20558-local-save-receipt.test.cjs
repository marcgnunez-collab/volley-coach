'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const source=read('index.html');
const start=source.indexOf('<script id="v121-native-score-script">');
const end=source.indexOf('</script>',start);
const inline=source.slice(start+'<script id="v121-native-score-script">'.length,end);
const clone=value=>JSON.parse(JSON.stringify(value));

function fixture({writer,backup,diagnostics,bridge=true}={}){
 const match={id:'PRIVATE-MATCH',opponent:'PRIVATE-RIVAL',status:'live',currentSet:1,
  rotationNo:1,opponentRotationNo:1,servingTeam:'ours',
  sets:[{number:1,scoreUs:3,scoreOpponent:2,finished:false,rallies:[]}],
  liveRally:{actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}]}};
 const status={textContent:'',dataset:{},title:''};
 const elements={
  'v121-live-control':{style:{},classList:{remove:()=>{},add:()=>{}},offsetWidth:12},
  'v121-local-save-status':status
 };
 for(const id of ['us-name','op-name','score','score-meta','rally','actions','service','phase','rotation','op-rotation']){
  elements['v121-'+id]={textContent:''};
 }
 const warnings=[],alerts=[],confirms=[],nativeCalls=[],calls=[];
 const win={VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>match,teamName:()=> 'PRIVATE-TEAM'},
  VC_SCOUT_CORE:{getActive:()=>match,getSet:m=>m.sets[0]},
  scoutV902PerformanceDiagnostics:diagnostics||(()=>({journalFailures:0})),
  scoutAwardPoint:winner=>{
   nativeCalls.push('point:'+winner);
   const s=match.sets[0];
   s.rallies.push({winner,actions:match.liveRally.actions});
   if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;
   match.liveRally={actions:[]};return true;
  },
  scoutUndoRally:()=>{
   nativeCalls.push('undo');const s=match.sets[0],r=s.rallies.pop();
   if(!r)return false;
   if(r.winner==='ours')s.scoreUs--;else s.scoreOpponent--;
   match.liveRally={actions:r.actions};return true;
  },
  v900Render:()=>{},scoutSave:()=>{nativeCalls.push('save')}
 };
 if(writer!==undefined)win.scoutV902Flush=async()=>{calls.push('flush');return writer()};
 if(backup!==undefined)win.scoutV680Backup=async()=>{calls.push('backup');return backup()};
 const document={getElementById:id=>elements[id]||null,addEventListener:()=>{},
  body:{classList:{add:()=>{}}}};
 const context=vm.createContext({window:win,document,Number,Array,Date,Object,String,
  setTimeout:()=>{},console:{warn:message=>warnings.push(message),error:()=>{}},
  alert:message=>alerts.push(message),confirm:message=>{confirms.push(message);return true}});
 vm.runInContext(inline,context,{timeout:2000});
 return {win,match,status,alerts,confirms,warnings,nativeCalls,calls,
  async installBridge(){if(bridge){const module=await compiled();module.installLocalSaveReceiptBridge(win)}},
  diagnostics:()=>clone(win.VC_LOCAL_SAVE_RECEIPT_DIAGNOSTICS_20558())};
}

test('V20.5.58 receipt is pure, frozen and never confuses a local write with journal/cloud confirmation',async()=>{
 const module=await compiled(),host={};
 const api=module.installLocalSaveReceiptBridge(host);
 assert.equal(api.VERSION,'20.5.58');assert.equal(api.readOnly,true);
 assert.strictEqual(api,module.installLocalSaveReceiptBridge(host));
 assert.strictEqual(host.VC_LOCAL_SAVE_20558,api);
 assert.ok(Object.isFrozen(api));
 const cases=[
  [{path:'full-flush',outcome:true},'completed'],
  [{path:'full-flush',outcome:false},'pending'],
  [{path:'full-flush',outcome:undefined},'unverified'],
  [{path:'full-flush',outcome:1},'unverified'],
  [{path:'full-flush',outcome:true,error:true},'failed'],
  [{path:'legacy-backup',outcome:true},'unverified'],
  [{path:'unavailable'},'unverified'],
  [{path:'unavailable',error:true},'failed'],
  [{path:'garbage',outcome:true},'unverified']
 ];
 for(const [input,state] of cases){
  const before=JSON.stringify(input),result=module.classifyLocalSaveReceipt(input);
  assert.equal(result.local,state);assert.equal(result.cloud,'not-confirmed');
  assert.equal(result.journal,'not-confirmed');assert.equal(JSON.stringify(input),before);
  assert.ok(Object.isFrozen(result));
 }
 assert.equal(module.classifyLocalSaveReceipt({path:'full-flush',outcome:true,
  journalFailuresBefore:1,journalFailuresAfter:2}).journal,'issue-observed');
 for(const invalid of [null,undefined,-1,'1',NaN,Infinity]){
  assert.equal(module.classifyLocalSaveReceipt({path:'full-flush',outcome:true,
   journalFailuresBefore:invalid,journalFailuresAfter:1}).journal,'not-confirmed');
 }
});

test('the actual V12.1 point and undo keep one native writer and update a visible receipt',async()=>{
 const app=fixture({writer:()=>true});await app.installBridge();
 const initial=clone(app.match);
 assert.equal(await app.win.v121AwardPoint('ours'),true);
 assert.equal(app.match.sets[0].scoreUs,4);
 assert.equal(app.status.dataset.state,'completed');
 assert.match(app.status.textContent,/Guardado principal completado/);
 assert.match(app.status.textContent,/diario y nube sin confirmar/);
 assert.equal(await app.win.v121UndoRally(),true);
 assert.deepEqual(app.nativeCalls,['point:ours','undo']);
 assert.deepEqual(app.calls,['flush','flush','flush']);
 assert.deepEqual(app.match,initial);
 assert.equal(app.confirms.length,1);
 const report=app.diagnostics();
 assert.equal(report.attempts,3);assert.equal(report.completed,3);
 assert.equal(report.lastOperation,'v121-after-undo');
 assert.equal(report.cloud,'not-confirmed');
 assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
});

test('a busy native flush reports queued without double-writing or inventing success',async()=>{
 const app=fixture({writer:()=>false});await app.installBridge();
 assert.equal(await app.win.v121AwardPoint('opponent'),true);
 assert.deepEqual(app.nativeCalls,['point:opponent']);
 assert.deepEqual(app.calls,['flush']);
 assert.equal(app.match.sets[0].scoreOpponent,3);
 assert.equal(app.status.dataset.state,'pending');
 assert.match(app.status.textContent,/en cola/);
 assert.equal(app.diagnostics().pending,1);
});

test('failed flush warns honestly, but never rolls back an already accepted point',async()=>{
 const app=fixture({writer:()=>{throw new Error('PRIVATE-STORAGE-FAIL')}});
 await app.installBridge();
 assert.equal(await app.win.v121AwardPoint('ours'),true);
 assert.equal(app.match.sets[0].scoreUs,4);
 assert.equal(app.status.dataset.state,'failed');
 assert.match(app.status.textContent,/exporta una copia JSON/);
 assert.equal(app.warnings.length,1);
 assert.equal(app.warnings[0].includes('PRIVATE'),false);
 assert.equal(app.alerts.length,0,'the point is not falsely declared unregistered');
 assert.equal(app.diagnostics().failed,1);
});

test('backup-only, missing writer and missing typed bridge remain explicitly unverified',async()=>{
 for(const options of [{backup:()=>true},{},{writer:()=>true,bridge:false}]){
  const app=fixture(options);await app.installBridge();
  assert.equal(await app.win.v121AwardPoint('ours'),true);
  assert.equal(app.status.dataset.state,'unverified');
  assert.match(app.status.textContent,/sin confirmar/);
  assert.equal(app.diagnostics().unverified,1);
  assert.equal(app.nativeCalls.length,1);
 }
});

test('a changed IndexedDB journal failure counter is a warning, never a confirmation',async()=>{
 let reads=0;
 const app=fixture({writer:()=>true,diagnostics:()=>({journalFailures:reads++===0?5:6})});
 await app.installBridge();await app.win.v121AwardPoint('ours');
 assert.equal(app.diagnostics().journalIssues,1);
 assert.match(app.status.textContent,/incidencia de diario detectada/);
});

test('out-of-order promise completions cannot replace a newer local save receipt',async()=>{
 let release;let writes=0;
 const app=fixture({writer:()=>++writes===1?new Promise(resolve=>{release=resolve}):false});
 await app.installBridge();
 const first=app.win.v121AwardPoint('ours');
 await Promise.resolve();assert.equal(typeof release,'function');
 const second=app.win.v121AwardPoint('opponent');
 await second;
 assert.equal(app.status.dataset.state,'pending');
 release(true);await first;
 assert.equal(app.status.dataset.state,'pending','older confirmation must not overwrite newer pending state');
 assert.equal(app.diagnostics().completed,1);
 assert.equal(app.diagnostics().pending,1);
 assert.equal(app.diagnostics().lastState,'pending');
 assert.deepEqual(app.nativeCalls,['point:ours','point:opponent']);
});

test('HTML and build declarations surface the local receipt while retaining the original writer',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.72');
 assert.match(source,/id="v121-local-save-status"[^>]*role="status"/);
 assert.match(source,/window\.scoutV902Flush\(\)/);
 assert.match(source,/window\.scoutAwardPoint/);
 assert.match(source,/window\.scoutUndoRally/);
 assert.ok(pkg.scripts['test:foundation'].includes('vc20558-local-save-receipt.test.cjs'));
 assert.ok(read('src/vc2055-entry.ts').includes('installLocalSaveReceiptBridge(window)'));
});
