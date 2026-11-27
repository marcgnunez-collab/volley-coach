'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const source=read('index.html');
const marker='<script id="v121-native-score-script">';
const start=source.indexOf(marker),end=source.indexOf('</script>',start);
const inline=source.slice(start+marker.length,end);
const clone=value=>JSON.parse(JSON.stringify(value));
const match=()=>({id:803,opponent:'PRIVATE-RIVAL',status:'live',currentSet:1,
 servingTeam:'ours',rotationNo:3,opponentRotationNo:4,events:[],lineup:{ours:{p1:12}},
 sets:[{number:1,scoreUs:8,scoreOpponent:7,finished:false,rallies:[]}],
 liveRally:{id:55,actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}]}});
const root=(m,team='cadete')=>JSON.stringify({version:5.8,
 equiposData:{[team]:{scoutingMatches:[clone(m)],scoutingActiveId:m.id}}});

function browserFixture({onFlush,verifyReady=true}={}){
 let current=match(),stored=null;const idle=[],calls=[],messages=[];
 const status={textContent:'',dataset:{},title:''};
 const elements={'v121-local-save-status':status,
  'v121-live-control':{classList:{add:()=>{},remove:()=>{}},offsetWidth:10,style:{}}};
 for(const id of ['us-name','op-name','score','score-meta','rally','actions','service','phase','rotation','op-rotation'])
  elements['v121-'+id]={textContent:''};
 const win={
  localStorage:{getItem:key=>key==='volleyCoachStateV43'?stored:null},
  requestIdleCallback:fn=>{idle.push(fn)},
  scoutV902PerformanceDiagnostics:()=>({journalFailures:0}),
  VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>current,getTeamId:()=> 'cadete',teamName:()=> 'PRIVATE-TEAM'},
  VC_SCOUT_CORE:{getActive:()=>current,getSet:m=>m.sets[0]},
  scoutAwardPoint:winner=>{
   calls.push('point');const s=current.sets[0];
   s.rallies.push({id:s.rallies.length+1,winner,actions:current.liveRally.actions});
   if(winner==='ours')s.scoreUs++;else s.scoreOpponent++;
   current.liveRally={id:56,actions:[]};return true;
  },
  scoutUndoRally:()=>{
   calls.push('undo');const s=current.sets[0],last=s.rallies.pop();if(!last)return false;
   if(last.winner==='ours')s.scoreUs--;else s.scoreOpponent--;
   current.liveRally={id:55,actions:last.actions};return true;
  },
  scoutV902Flush:()=>{calls.push('flush');if(onFlush)return onFlush({current,stored,setStored:v=>stored=v});stored=root(current);return true}
 };
 const document={getElementById:id=>elements[id]||null,addEventListener:()=>{},body:{classList:{add:()=>{}}}};
 const context=vm.createContext({window:win,document,Date,Number,Object,Array,String,
  setTimeout:fn=>{idle.push(fn)},alert:message=>messages.push(message),confirm:()=>true,
  console:{warn:()=>{},error:()=>{}}});
 vm.runInContext(inline,context,{timeout:2500});
 return {win,status,idle,calls,messages,getCurrent:()=>current,setCurrent:m=>{current=m},
  setStored:v=>{stored=v},readStored:()=>stored,
  async install(){const mod=await compiled();mod.installLocalSaveReceiptBridge(win);
   if(verifyReady)mod.installLocalReadbackBridge(win)},
  drain(){while(idle.length)idle.shift()()},
  diag:()=>clone(win.VC_LOCAL_SAVE_RECEIPT_DIAGNOSTICS_20558())};
}

test('V20.5.59 exact bounded readback only confirms the targeted persisted match',async()=>{
 const mod=await compiled(),host={},api=mod.installLocalReadbackBridge(host);
 assert.equal(api.VERSION,'20.5.59');assert.equal(api.readOnly,true);
 assert.strictEqual(api,mod.installLocalReadbackBridge(host));
 assert.strictEqual(host.VC_LOCAL_READBACK_20559,api);
 assert.ok(Object.isFrozen(api));
 const current=match(),snapshot=api.capture(current);
 assert.equal(typeof snapshot,'string');
 const original=root(current);
 const data={raw:original,snapshot,matchId:current.id,teamId:'cadete'};
 const proof=api.verify(data);
 assert.deepEqual(clone(proof),{version:'20.5.59',state:'matched',scope:'primary-local-only',
  journal:'not-confirmed',cloud:'not-confirmed'});
 assert.ok(Object.isFrozen(proof));assert.equal(data.raw,original);
 const changed=clone(current);changed.liveRally.actions[0].code='PRIVATE-CHANGED';
 assert.equal(api.verify({...data,raw:root(changed)}).state,'different',
  'actions differ even if the scoreboard is identical');
 assert.equal(api.verify({...data,raw:root(current,'infantil')}).state,'missing');
 assert.equal(api.verify({...data,matchId:999}).state,'missing');
 assert.equal(api.verify({...data,teamId:'other'}).state,'missing');
 assert.equal(api.verify({...data,teamId:'../cadete'}).state,'unverified');
 assert.equal(api.verify({...data,raw:null}).state,'missing');
 assert.equal(api.verify({...data,raw:'{invalid'}).state,'invalid');
 assert.equal(api.verify({...data,raw:'[]'}).state,'invalid');
 const withDuplicate=JSON.parse(original);
 withDuplicate.equiposData.cadete.scoutingMatches.push(clone(current));
 assert.equal(api.verify({...data,raw:JSON.stringify(withDuplicate)}).state,'invalid');
 assert.equal(api.verify({...data,snapshot:null}).state,'unverified');
 assert.equal(api.capture(null),null);
 assert.equal(api.capture({id:1,large:'x'.repeat(mod.MAX_LOCAL_MATCH_CHARS)}),null);
 assert.equal(api.verify({...data,raw:'x'.repeat(mod.MAX_STORED_STATE_CHARS+1)}).state,'too-large');
});

test('compressed local format is decoded through the EXISTING owner, never re-encoded or rewritten',async()=>{
 const api=(await compiled()).installLocalReadbackBridge({});
 const current=match(),snapshot=api.capture(current),plain=root(current),packed='VC-LZW16-1:PRIVATE';
 let invocations=0;
 const input={raw:packed,snapshot,matchId:current.id,teamId:'cadete'};
 assert.equal(api.verify(input).state,'unverified');
 const decoder=value=>{invocations++;assert.equal(value,packed);return plain};
 assert.equal(api.verify({...input,unpack:decoder}).state,'matched');
 assert.equal(invocations,1);
 assert.equal(api.verify({...input,unpack:()=>{throw Error('PRIVATE-CORRUPT')}}).state,'invalid');
 assert.equal(api.verify({...input,raw:'VC-LZW16-1:'+'x'.repeat(524288),unpack:decoder}).state,'too-large');
 assert.equal(invocations,1,'oversized compressed payload is never decompressed');
});

test('point and undo read persisted state in idle time without adding native writers',async()=>{
 const app=browserFixture();await app.install();
 assert.equal(await app.win.v121AwardPoint('ours'),true);
 assert.equal(app.status.dataset.state,'completed','the input is not blocked on the expensive read');
 assert.equal(app.diag().readbackChecks,0);
 app.drain();
 assert.equal(app.status.dataset.state,'completed');
 assert.match(app.status.textContent,/Lectura local verificada/);
 assert.match(app.status.textContent,/diario y nube sin confirmar/);
 assert.equal(app.diag().readbackMatched,1);
 assert.equal(await app.win.v121UndoRally(),true);
 app.drain();
 assert.equal(app.diag().readbackMatched,2);
 assert.equal(app.getCurrent().sets[0].scoreUs,8);
 assert.deepEqual(app.calls,['point','flush','flush','undo','flush']);
 assert.equal(JSON.stringify(app.diag()).includes('PRIVATE'),false);
});

test('a writer claiming success with stale or missing local data raises a visible warning',async()=>{
 for(const scenario of ['stale','missing','invalid']){
  const app=browserFixture({onFlush:({current,setStored})=>{
   if(scenario==='stale')setStored(root({...current,rotationNo:1}));
   else if(scenario==='invalid')setStored('{bad');
   return true;
  }});
  await app.install();assert.equal(await app.win.v121AwardPoint('ours'),true);
  app.drain();
  assert.equal(app.status.dataset.state,'failed');
  assert.equal(app.diag().lastReadback,scenario==='stale'?'different':
   scenario==='missing'?'missing':'invalid');
  assert.match(app.status.textContent,/exporta JSON/);
  assert.deepEqual(app.calls,['point','flush']);
  assert.equal(app.messages.length,0,'the accepted point is not falsely undone');
 }
});

test('missing typed bridge, queued commit, oversized match and changing context never declare verification',async()=>{
 const without=browserFixture({verifyReady:false});await without.install();
 await without.win.v121AwardPoint('ours');without.drain();
 assert.equal(without.diag().readbackChecks,0);
 assert.equal(without.status.dataset.state,'completed');
 const busy=browserFixture({onFlush:()=>false});await busy.install();
 await busy.win.v121AwardPoint('ours');busy.drain();
 assert.equal(busy.diag().readbackChecks,0);
 assert.equal(busy.status.dataset.state,'pending');
 const changed=browserFixture();await changed.install();
 await changed.win.v121AwardPoint('ours');
 const restored=clone(changed.getCurrent());changed.setCurrent(restored);
 changed.drain();assert.equal(changed.diag().readbackChecks,0);
 assert.equal(changed.diag().readbackMatched,0);
 const tooLarge=browserFixture();await tooLarge.install();
 tooLarge.getCurrent().bigData='x'.repeat(2097152);
 await tooLarge.win.v121AwardPoint('ours');tooLarge.drain();
 assert.equal(tooLarge.diag().readbackChecks,0);
});

test('a later command wins against an older queued readback even with the same match object',async()=>{
 const app=browserFixture();await app.install();
 await app.win.v121AwardPoint('ours');
 await app.win.v121AwardPoint('opponent');
 assert.equal(app.idle.length,2);
 app.drain();
 assert.equal(app.diag().readbackChecks,1);
 assert.equal(app.diag().readbackMatched,1);
 assert.equal(app.getCurrent().sets[0].scoreUs,9);
 assert.equal(app.getCurrent().sets[0].scoreOpponent,8);
 assert.deepEqual(app.calls,['point','flush','point','flush']);
});

test('packaging and Vite include the verifier without changing cloud, journal or rally ownership',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.4');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20559-local-readback.test.cjs'));
 assert.ok(read('src/vc2055-entry.ts').includes('installLocalReadbackBridge(window)'));
 assert.ok(source.includes('scheduleLocalReadback(sequence)'));
 assert.ok(source.includes('VC_LOCAL_READBACK_20559'));
 assert.ok(source.includes('Guardado principal completado'));
 assert.ok(source.includes('window.scoutAwardPoint'));
 assert.ok(source.includes('window.scoutUndoRally'));
});
