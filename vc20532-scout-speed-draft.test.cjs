'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const original=require('./213-vc2021-scouting-speed-pro.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');

function inputHarness(bridge){
 const actions=[{code:'R04R+'},{code:'12A#.4B>5D*DC'}];
 const match={id:'same-match',status:'live',liveRally:{actions},sets:[{rallies:[{
  actions:[{code:'07S#'},{code:'R04R+'},{code:'3A='}]}]}]};
 let events=0;
 const input={id:'v800-code',value:'',disabled:false,readOnly:false,isConnected:true,
  focus(){},setSelectionRange(){},getClientRects:()=>[{}],dispatchEvent(){events++;}};
 const nodes={'v800-code':input,'v800-shell':{dataset:{vc52Mode:'code'}},
  'v800-code-team':{value:'ours'},'v800-code-number':{value:'12'},
  'scout-match-mode':{classList:{contains:key=>key==='active'}}};
 const document={readyState:'loading',activeElement:input,
  addEventListener(){},getElementById:id=>nodes[id]||null};
 const window={document,Event:class{constructor(type){this.type=type}},
  VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>match}};
 if(bridge)window.VC_SCOUT_DRAFT_20532=bridge;
 vm.runInNewContext(read('213-vc2021-scouting-speed-pro.js'),{window},{timeout:2000});
 return {api:window.VC_SCOUT_SPEED_2021,input,match,events:()=>events};
}

test('typed draft helpers match the historical partial-code grammar and transformations',async()=>{
 const typed=await compiled();
 const raws=['','12','R04','7A','7A#','7A#.4>5~JF^FB@2','R004R+.6',
  '3S=~JP','  02a+  ','12A=::31|F','12ABOGUS','+1A#','R','1234A#',
  '12A#bad','7A##','12A#@0','9D!.6','R12E!~Q','12A#%TIPO','12S#?EXTRA'];
 const contexts=[undefined,{team:'ours',number:'12'},{team:'opponent',number:'004'},
  {team:'ours',number:'1234'},{team:'?',number:'12'}];
 for(const raw of raws){
  assert.deepStrictEqual(typed.parseScoutingDraftHead(raw),original.parseHead(raw),`parse ${raw}`);
  for(const skill of ['S','R','E','A','B','D','F','C','X']){
   for(const ctx of contexts)assert.equal(typed.applyScoutingDraftSkill(raw,skill,ctx),original.applySkill(raw,skill,ctx));
  }
  for(const rating of ['#','+','!','-','/','=','?'])
   assert.equal(typed.applyScoutingDraftRating(raw,rating),original.applyRating(raw,rating));
  for(const step of [-2,-1,0,1,2])
   assert.equal(typed.cycleScoutingDraftRating(raw,step),original.cycleRating(raw,step));
 }
});

test('recent codes are deduplicated and read backwards from live rally and finished sets',async()=>{
 const typed=await compiled();const {match}=inputHarness();
 const snapshot=JSON.stringify(match);
 for(const limit of [-1,0,1,3,8,20])
  assert.deepStrictEqual(typed.recentScoutingDraftCodes(match,limit),original.recentCodes(match,limit));
 assert.deepStrictEqual(typed.recentScoutingDraftCodes(match),['12A#.4B>5D*DC','R04R+','3A=','07S#']);
 assert.deepStrictEqual(typed.recentScoutingDraftCodes(null),[]);
 assert.equal(JSON.stringify(match),snapshot,'read-only match must remain unchanged');
});

test('legacy dock uses the typed bridge for real draft edits, undo and repeat without submitting',async()=>{
 const typed=await compiled(),win={};
 const bridge=typed.installScoutingDraftBridge(win);
 assert.equal(bridge.VERSION,'20.5.32');assert.equal(bridge.inputOnly,true);
 assert.strictEqual(typed.installScoutingDraftBridge(win),bridge);
 assert.ok(Object.isFrozen(bridge));
 const {api,input,match,events}=inputHarness(bridge);
 const originalMatch=JSON.stringify(match);
 assert.equal(api.changeSkill('S'),true);assert.equal(input.value,'12S');
 assert.equal(api.changeRating('#'),true);assert.equal(input.value,'12S#');
 assert.equal(api.undoDraft(),true);assert.equal(input.value,'12S');
 assert.equal(api.repeatCode(),true);assert.equal(input.value,'12A#.4B>5D*DC');
 assert.equal(JSON.stringify(match),originalMatch,'draft edits cannot mutate scouting actions');
 assert.ok(events()>=4,'each draft edit emits an input event');
 const diagnostic=api.diagnostics();
 assert.equal(diagnostic.draftEngine,'typescript');
 assert.ok(diagnostic.draftBridge.accepted>=3);
 assert.equal(diagnostic.draftBridge.differences,0);
 assert.equal(diagnostic.draftBridge.errors,0);
 assert.equal(diagnostic.draftBridge.classic,0);
});

test('legacy dock automatically falls back if the TypeScript bridge is missing, altered or throwing',()=>{
 for(const faulty of [null,
  {VERSION:'20.5.32',inputOnly:true,applySkill:()=> 'WRONG'},
  {VERSION:'20.5.32',inputOnly:true,applySkill:()=>{throw Error('bad')}}]){
  const {api,input}=inputHarness(faulty);
  assert.equal(api.changeSkill('S'),true);
  assert.equal(input.value,'12S','never accept a differing draft');
  const diagnostic=api.diagnostics();
  assert.equal(diagnostic.draftBridge.classic,1);
  if(faulty)assert.equal(diagnostic.draftBridge.errors+diagnostic.draftBridge.differences,1);
 }
});

test('release installs exactly one input-only TS bridge, preserves native writers and cache version',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js'),runtime=read('src/state/scouting-speed-draft-runtime.ts'),
  typed=read('src/state/scouting-speed-draft.ts');
 assert.equal(pkg.version,'20.5.35');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20532-scout-speed-draft.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.35'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.35'));
 assert.ok(sw.includes('scouting-speed-draft-20.5.32'));
 assert.ok(entry.includes('installScoutingDraftBridge(window)'));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('typedOrClassic('));
 assert.ok(read('213-vc2021-scouting-speed-pro.js').includes('Borrador TypeScript'));
 for(const forbidden of ['indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=', 'window.MatchState=', 'localStorage','setItem(','fetch('])
  assert.equal(typed.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
