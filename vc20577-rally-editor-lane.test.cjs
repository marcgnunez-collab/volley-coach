'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'021-core-scouting-v150-monolithic.js'),'utf8');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

test('V20.5.77 typed editor bridge is immutable, pure and installed once',async()=>{
 const mod=await compiled(),host={},api=mod.installRallyEditorLane(host);
 assert.equal(api.VERSION,'20.5.77');assert.equal(api.nativeOnly,true);
 assert.equal(api.singleNativeWriter,true);assert.ok(Object.isFrozen(api));
 assert.equal(host.VC_RALLY_EDITOR_LANE_20577,api);
 assert.equal(mod.installRallyEditorLane(host),api);
 const typed=read('src/domain/rally-editor-lane.ts')+read('src/domain/rally-editor-lane-runtime.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB',
  'supabase','fetch(','.awardPoint(','.undoRally(','.scoreUs='])
  assert.equal(typed.includes(forbidden),false,forbidden);
});

test('scope captures exact native match/set/rally/actions identity and revision',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const match={id:1},set={number:2},actions=[{id:7,code:'7A#',videoTime:12.5}];
 const rally={id:15,actions,scoreAfter:{us:4,opponent:2}};
 const scope=api.capture({match,set,rally,actions});
 assert.ok(Object.isFrozen(scope));assert.equal(scope.rally,rally);
 assert.equal(scope.sourceActions,actions);
 const current=()=>({match,set,rally,actions:rally.actions});
 assert.equal(api.current(scope,current()),true);
 for(const now of [
  {...current(),match:{id:1}},
  {...current(),set:{number:2}},
  {...current(),rally:{...rally}},
  {...current(),actions:[...actions]}
 ])assert.equal(api.current(scope,now),false);
 actions[0].videoTime=13;
 assert.equal(api.current(scope,current()),false,'even in-place video changes invalidate edit');
});

test('draft move, remove and insert keep source array intact and action identity',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const a={id:1,code:'7S#'},b={id:2,code:'7R+'},c={id:3,code:'7A#'};
 const original=[a,b],moved=api.draft({actions:original,
  command:{type:'move',index:1,delta:-1}});
 assert.equal(moved.changed,true);assert.deepEqual(moved.actions,[b,a]);
 assert.deepEqual(original,[a,b]);assert.equal(moved.actions[0],b);
 const inserted=api.draft({actions:moved.actions,
  command:{type:'insert',index:1,action:c}});
 assert.deepEqual(inserted.actions,[b,c,a]);
 const removed=api.draft({actions:inserted.actions,
  command:{type:'remove',index:0}});
 assert.deepEqual(removed.actions,[c,a]);
 assert.equal(a.id,1);assert.equal(b.id,2);assert.equal(c.id,3);
});

test('invalid draft indices fail safely without mutation or extra actions',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const actions=[{id:1}];
 for(const command of [
  {type:'remove',index:-1},{type:'remove',index:1},
  {type:'move',index:0,delta:-1},{type:'move',index:0,delta:1},
  {type:'insert',index:2,action:{id:2}},
  {type:'insert',index:0,action:null},
  {type:'move',index:0,delta:0.5}
 ]){
  const result=api.draft({actions,command});
  assert.equal(result.changed,false);
  assert.equal(result.actions,actions);
  assert.deepEqual(actions,[{id:1}]);
 }
});

test('unsaved code input survives row moves and duplication without altering old action metadata',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const video={time:13.2},a={id:1,code:'7A#',video},b={id:2,code:'7S+'};
 const original=[a,b];
 const synced=api.syncCodes({actions:original,codes:['7A+','7S+']});
 assert.equal(original[0].code,'7A#');assert.equal(synced[0].code,'7A+');
 assert.equal(synced[0].video,video);assert.equal(synced[1],b);
 const moved=api.draft({actions:synced,command:{type:'move',index:0,delta:1}});
 assert.deepEqual(moved.actions.map(x=>x.code),['7S+','7A+']);
 const duplicate={...moved.actions[1],id:3};
 const inserted=api.draft({actions:moved.actions,
  command:{type:'insert',index:2,action:duplicate}});
 assert.deepEqual(inserted.actions.map(x=>x.code),['7S+','7A+','7A+']);
 assert.equal(original.length,2);
});

test('typed correction parses 50 edits once, resequences and never mutates source rally',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const match={},set={},actions=[{seq:1,code:'old',videoTime:12.5}];
 const rally={actions,scoreAfter:{us:5,opponent:2}},scope=api.capture({match,set,rally,actions});
 const codes=Array.from({length:50},(_,i)=>({raw:`7A#${i}`,oldAction:actions[0]}));
 let parses=0;
 const plan=api.prepare({scope,codes,
  current:()=>({match,set,rally,actions:rally.actions}),
  parse:(raw,old)=>{parses++;return {action:{...old,code:raw,seq:0}};}
 });
 assert.equal(plan.ok,true);assert.equal(parses,50);
 assert.deepEqual(plan.actions.map(a=>a.seq),Array.from({length:50},(_,i)=>i+1));
 assert.equal(plan.actions[0].videoTime,12.5);
 assert.equal(rally.actions,actions);assert.equal(rally.scoreAfter.us,5);
});

test('typed correction refuses stale state before, during and after parsing',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 for(const trigger of ['before','during']){
  const match={},set={},rally={actions:[{code:'old'}]};
  const scope=api.capture({match,set,rally,actions:rally.actions});
  let currentMatch=trigger==='before'?{}:match,parses=0;
  const result=api.prepare({scope,
   current:()=>({match:currentMatch,set,rally,actions:rally.actions}),
   codes:[{raw:'7S#',oldAction:rally.actions[0]},{raw:'7A#',oldAction:rally.actions[0]}],
   parse:raw=>{parses++;if(trigger==='during')currentMatch={};return {action:{code:raw}};}
  });
  assert.equal(result.ok,false);assert.equal(result.kind,'stale');
  assert.equal(parses,trigger==='before'?0:1);
  assert.equal(rally.actions[0].code,'old');
 }
});

test('invalid code halts preparation on first rejection without committing',async()=>{
 const api=(await compiled()).installRallyEditorLane({});
 const match={},set={},rally={actions:[{code:'old'}]};
 const scope=api.capture({match,set,rally,actions:rally.actions});
 let calls=0;
 const result=api.prepare({scope,
  current:()=>({match,set,rally,actions:rally.actions}),
  codes:['good','BAD','third'].map(raw=>({raw,oldAction:rally.actions[0]})),
  parse:raw=>{calls++;return raw==='BAD'?{error:'Código no reconocido.'}:{action:{code:raw}};}
 });
 assert.equal(result.ok,false);assert.equal(result.kind,'invalid');
 assert.equal(result.index,1);assert.equal(calls,2);
 assert.equal(rally.actions[0].code,'old');
});

const editorStart=source.indexOf('/* V20.5.77 · Historical editor owns');
const editorEnd=source.indexOf('function v680Esc(',editorStart);
const openStart=source.indexOf('window.scoutV680OpenRallyEditor=function');
const openEnd=source.indexOf('window.scoutV680RenderRallyEditor=function',openStart);
const removeStart=source.indexOf('window.scoutV680RemoveEditAction=function',openEnd);
const removeEnd=source.indexOf('window.scoutV680AddEditAction=function',removeStart);
const saveStart=source.indexOf('window.scoutV680SaveRallyEdit=function');
const saveEnd=source.indexOf('window.scoutV680CloseRallyEditor=function',saveStart);
const v840Start=source.indexOf('function v840EditorRally(){');
const v840End=source.indexOf('window.scoutV680AddEditAction=function()',v840Start);
assert.ok(editorStart>=0&&editorEnd>editorStart&&openStart>=0&&saveEnd>saveStart);
const originalHandlers='let v680EditContext=null;\n'+
 source.slice(editorStart,editorEnd)+source.slice(openStart,openEnd)+
 source.slice(removeStart,removeEnd)+
 source.slice(saveStart,saveEnd)+'\nwindow.getEditorContext=()=>v680EditContext;\n'+
 source.slice(v840Start,v840End);

function editorHarness(bridge,options={}){
 const action={id:1,seq:1,code:'7A#',videoTime:13.5,playerNameSnapshot:'Jugador'};
 const rally={id:50,rotationBefore:2,winner:'ours',scoreAfter:{us:6,opponent:4},
  actions:[action],editCount:0};
 const set={number:1,rallies:[rally]},match={id:101,sets:[set]};
 const otherRally={id:50,actions:[{code:'R9S#'}]};
 const other={id:102,sets:[{number:1,rallies:[otherRally]}]};
 let active=match;const calls={parse:0,save:0,backup:0,refresh:0,focus:0,render:0};
 const alerts=[],elements=new Map();
 const ctx={window:{VC_RALLY_EDITOR_LANE_20577:bridge},
  setTimeout(fn){fn();return 1},
  scoutActive:()=>active,scoutArr:x=>Array.isArray(x)?x:[],
  scoutClone:x=>JSON.parse(JSON.stringify(x)),
  scoutNow:()=> '2026-11-26T10:00:00.000Z',
  alert:msg=>alerts.push(msg),
  document:{getElementById:id=>{
   if(!elements.has(id))elements.set(id,{value:'',classList:{add(){}},focus(){calls.focus++;}});
   return elements.get(id);
  }},
  scoutV680RenderRallyEditor(){
   calls.render++;
   const current=ctx.window.getEditorContext?.();
   current?.actions?.forEach((a,i)=>elements.set(`scout-v680-edit-code-${i}`,
    {value:a.code,focus(){calls.focus++;}}));
  },
  scoutV680OpenSetEditor(){calls.refresh++;},
  v840Context:()=>ctx.window.getEditorContext(),
  $84:id=>ctx.document.getElementById(id),
  v680ParseCode(raw,m,old){calls.parse++;assert.equal(m,match);
   if(options.switchDuringParse)active=other;
   if(options.changeDuringParse)rally.actions[0].code='CHANGED';
   return raw==='BAD'?{error:'Código no reconocido.'}:
    {action:{...old,code:raw,seq:0}};
  },
  scoutSave(){calls.save++;},scoutV680Backup(){calls.backup++;}};
 ctx.window.VC_SCOUT_V680_EDITOR={parseCode:(raw,m,old)=>ctx.v680ParseCode(raw,m,old)};
 vm.runInNewContext(originalHandlers,ctx,{timeout:3000});
 const open=()=>ctx.window.scoutV680OpenRallyEditor(1,50);
 const save=()=>ctx.window.scoutV680SaveRallyEdit();
 return {match,set,rally,other,otherRally,action,ctx,calls,alerts,
  open,save,setCode:raw=>{elements.get('scout-v680-edit-code-0')?.value;
   elements.set('scout-v680-edit-code-0',{value:raw,focus(){calls.focus++;}});},
  setNewCode:raw=>elements.set('scout-v680-new-code',{value:raw,focus(){calls.focus++;}}),
  switchMatch(){active=other},
  replaceRally(){set.rallies[0]={...rally}},
  changeSavedAction(){rally.actions[0].code='REMOTE';},
  draft:()=>ctx.window.getEditorContext()};
}

test('actual V680 editor edits the original rally once without changing points or video',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 const env=editorHarness(bridge);
 env.open();env.setCode('7A+');
 const score=env.rally.scoreAfter,original=env.rally.actions;
 assert.equal(env.save(),true);
 assert.equal(env.calls.parse,1);assert.equal(env.calls.save,1);
 assert.equal(env.calls.backup,1);assert.equal(env.calls.refresh,1);
 assert.equal(env.rally.actions[0].code,'7A+');
 assert.equal(env.rally.actions[0].videoTime,13.5);
 assert.equal(env.rally.scoreAfter,score);
 assert.notEqual(env.rally.actions,original);
 assert.equal(env.rally.editCount,1);
 assert.equal(env.ctx.window.VC_RALLY_EDITOR_DIAGNOSTICS_20577().typedSaves,1);
});

test('real V840 duplicate, move, remove and insert preserve pending edits in the draft',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 const env=editorHarness(bridge);
 env.open();env.setCode('7A+');
 env.ctx.window.scoutV840DuplicateEditAction(0);
 assert.deepEqual(env.draft().actions.map(a=>a.code),['7A+','7A+']);
 assert.equal(env.draft().actions[0].videoTime,13.5);
 env.ctx.window.scoutV840MoveEditAction(1,-1);
 assert.equal(env.draft().actions.length,2);
 env.setNewCode('7S#');
 env.ctx.window.scoutV840AddAt('start');
 assert.deepEqual(env.draft().actions.map(a=>a.code),['7S#','7A+','7A+']);
 env.ctx.window.scoutV680RemoveEditAction(1);
 assert.deepEqual(env.draft().actions.map(a=>a.code),['7S#','7A+']);
 assert.equal(env.rally.actions.length,1,'nothing committed before Save');
 assert.equal(env.calls.save,0);assert.equal(env.calls.backup,0);
});

test('editor never redirects an old rally correction to another active match with same rally ID',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 const env=editorHarness(bridge);
 env.open();env.setCode('7A+');env.switchMatch();
 assert.equal(env.save(),false);
 assert.equal(env.calls.parse,0);assert.equal(env.calls.save,0);
 assert.equal(env.calls.backup,0);
 assert.equal(env.rally.actions[0].code,'7A#');
 assert.equal(env.otherRally.actions[0].code,'R9S#');
 assert.match(env.alerts.join(' '),/partido o rally ha cambiado/);
});

test('editor refuses replaced rally, remote action edits and changed set identity',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 for(const mutate of [env=>env.replaceRally(),env=>env.changeSavedAction(),
  env=>{env.match.sets[0]={...env.set}}]){
  const env=editorHarness(bridge);
  env.open();mutate(env);env.setCode('7S#');
  assert.equal(env.save(),false);
  assert.equal(env.calls.parse,0);assert.equal(env.calls.save,0);
  assert.equal(env.calls.backup,0);
 }
});

test('stale match or remote update during parse prevents write and backup',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 for(const mode of ['switchDuringParse','changeDuringParse']){
  const env=editorHarness(bridge,{[mode]:true});
  env.open();env.setCode('7A#');
  assert.equal(env.save(),false);
  assert.equal(env.calls.parse,1);
  assert.equal(env.calls.save,0);assert.equal(env.calls.backup,0);
 }
});

test('invalid editor code never increments edit count or persists',async()=>{
 const bridge=(await compiled()).installRallyEditorLane({});
 const env=editorHarness(bridge);env.open();env.setCode('BAD');
 assert.equal(env.save(),false);
 assert.equal(env.calls.parse,1);assert.equal(env.calls.save,0);
 assert.equal(env.calls.backup,0);assert.equal(env.rally.editCount,0);
 assert.match(env.alerts.join(' '),/Acción 1: Código no reconocido/);
});

test('missing or early-throwing lane has one classic parser and one native save',()=>{
 for(const bridge of [null,{VERSION:'20.5.76'},
  {VERSION:'20.5.77',nativeOnly:true,singleNativeWriter:true,
   prepare:()=>{throw Error('before parser')}}]){
  const env=editorHarness(bridge);env.open();env.setCode('7A+');
  assert.equal(env.save(),true);
  assert.equal(env.calls.parse,1);assert.equal(env.calls.save,1);
  assert.equal(env.calls.backup,1);
  assert.equal(env.ctx.window.VC_RALLY_EDITOR_DIAGNOSTICS_20577().classicSaves,1);
 }
});

test('late adapter throw cannot repeat native parser or commit a partial correction',()=>{
 const malicious={VERSION:'20.5.77',nativeOnly:true,singleNativeWriter:true,
  prepare({codes,parse}){parse(codes[0].raw,codes[0].oldAction);throw Error('late failure')}};
 const env=editorHarness(malicious);env.open();env.setCode('7A+');
 assert.throws(()=>env.save(),/late failure/);
 assert.equal(env.calls.parse,1);assert.equal(env.calls.save,0);
 assert.equal(env.calls.backup,0);assert.equal(env.rally.actions[0].code,'7A#');
});

test('V840 pro editor routes move, duplicate and insert through guarded typed draft',()=>{
 assert.ok(source.includes("v20577UpdateDraft(c,{type:'move'"));
 assert.ok(source.includes("v20577UpdateDraft(c,{type:'insert',index:i+1"));
 assert.ok(source.includes("v20577UpdateDraft(c,{type:'insert',index,action:parsed.action}"));
 assert.ok(source.includes("v20577UpdateDraft(c,{type:'remove'"));
  assert.ok(source.includes('v20577SyncDraftCodes(c)'));
 assert.ok(source.includes("if(!v20577EditorGuard(c))return false;"));
 assert.ok(source.includes("scoutV680Backup('rally-edit',true)"));
 assert.ok(source.includes("scoutSave();scoutV680Backup('rally-edit',true)"));
 assert.ok(source.includes('v20577CaptureRally(m,s,r)'));
});

test('V20.5.77 leaves scoring and synchronization native, publishes Vite and PWA',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.3');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20577-rally-editor-lane.test.cjs'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.7.0'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRallyEditorLane(window)'));
 assert.ok(read('service-worker.js').includes('rally-editor-lane-20.5.77'));
 assert.ok(source.includes('scoutUndoRally'));
});
