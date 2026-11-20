'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const original=require('./231-vc2051-scouting-expert.js');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const live={id:42,status:'live'};
const result=code=>{
 if(code==='7A#')return {action:{team:'ours',playerId:7,playerNumberSnapshot:'7',skill:'A',evaluation:'#',startZone:'4B',endZone:'5D',tempo:'T'}};
 if(code==='R12S=')return {action:{team:'opponent',playerNumberSnapshot:'12',skill:'S',evaluation:'='}};
 if(code==='3R')return {action:{team:'ours',playerId:3,skill:'R',evaluation:'!'}};
 if(code==='5A=')return {action:{team:'ours',playerLabel:'#5',playerNumberSnapshot:'5',skill:'A',evaluation:'='}};
 return {error:'Dorsal no encontrado.'};
};
const same=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));

function classicWithBridge(bridge){
 const document={readyState:'loading',addEventListener(){},getElementById:()=>null};
 const window={document,VC_SCOUT_PREFLIGHT_20534:bridge};
 vm.runInNewContext(read('231-vc2051-scouting-expert.js'),{window},{timeout:2000});
 return window.VC_SCOUT_EXPERT_2051;
}

test('TypeScript preflight exactly mirrors every historical preview state',async()=>{
 const {classifyScoutingPreflight}=await compiled();
 const cases=['','7','7A#',' 7a# ','R12S=','3R','5A=','9A#',
  'R','#','R4','7A#BOGUS','X'.repeat(141)];
 for(const code of cases){
  for(const match of [null,{status:'finished'},live]){
   for(const parser of [null,result,()=>{throw Error('blocked')}]){
    let nativeResult,parserThrew=false;
    const wrapped=parser?(raw,m,old)=>{
     try{nativeResult=parser(raw,m,old);return nativeResult;}
     catch(_){parserThrew=true;throw _;}
    }:null;
    const expected=original.inspect(code,match,wrapped);
    const actual=classifyScoutingPreflight(code,!!match,match?.status,!!parser,nativeResult,parserThrew);
    same(actual,expected);
   }
  }
 }
});

test('real legacy Scouting Expert adopts typed classification without a second native parser call',async()=>{
 const typed=await compiled(),holder={};
 const bridge=typed.installScoutingPreflightBridge(holder);
 assert.equal(bridge.VERSION,'20.5.34');assert.equal(bridge.previewOnly,true);
 assert.strictEqual(typed.installScoutingPreflightBridge(holder),bridge);
 assert.ok(Object.isFrozen(bridge));
 const liveApi=classicWithBridge(bridge);let calls=0;
 const parser=(...args)=>{calls++;return result(args[0]);};
 const inputs=['7A#','R12S=','3R','9A#','7',''];
 for(const code of inputs)same(liveApi.inspect(code,live,parser),original.inspect(code,live,result));
 const diagnostic=liveApi.diagnostics();
 assert.equal(calls,4,'only four complete codes call the original parser');
 assert.equal(diagnostic.classification.nativeCalls,4);
 assert.equal(diagnostic.classification.typed,inputs.length);
 assert.equal(diagnostic.classification.classic,0);
 assert.equal(diagnostic.classification.differences,0);
 assert.equal(diagnostic.classification.errors,0);
});

test('missing, conflicting or failing typed preflight always restores the original result',()=>{
 const candidates=[null,{VERSION:'20.5.34',previewOnly:true,classify:()=>({state:'ok'})},
  {VERSION:'20.5.34',previewOnly:true,classify:()=>{throw Error('broken')}}];
 for(const bridge of candidates){
  const api=classicWithBridge(bridge);let calls=0;
  const parser=code=>{calls++;return result(code)};
  same(api.inspect('7A#',live,parser),original.inspect('7A#',live,result));
  assert.equal(calls,1,'fallback must not reparse');
  const counts=api.diagnostics().classification;
  assert.equal(counts.classic,1);
  if(bridge)assert.equal(counts.differences+counts.errors,1);
 }
});

test('typed preview never modifies match, code, scorer or private/cloud records',async()=>{
 const typed=await compiled(),bridge=typed.installScoutingPreflightBridge({});
 const api=classicWithBridge(bridge),match={id:'P1',status:'live',sets:[{rallies:[{actions:[{code:'7A#'}]}]}]};
 const before=JSON.stringify(match),actions=[];
 for(const code of ['7A#','R12S=','3R','9A#']){
  const preview=api.inspect(code,match,raw=>{actions.push(raw);return result(raw)});
  assert.ok(preview.state);
 }
 assert.deepStrictEqual(actions,['7A#','R12S=','3R','9A#']);
 assert.equal(JSON.stringify(match),before);
});

test('V20.5.34 is integrated as one read-only classifier, without modifying native writers',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.44');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20534-preflight-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.44'));
 assert.ok(html.includes('231-vc2051-scouting-expert.js?v=20.5.34'));
 assert.ok(sw.includes('scout-preflight-20.5.34'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutingPreflightBridge(window)'));
 const source=read('src/state/scouting-preflight.ts'),runtime=read('src/state/scouting-preflight-runtime.ts');
 for(const forbidden of ['indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=', 'window.MatchState=', 'localStorage','setItem(','fetch('])
  assert.equal(source.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
