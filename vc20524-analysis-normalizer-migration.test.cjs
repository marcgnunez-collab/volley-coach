'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const legacy=require('./189-vc1938-professional-data-engine.js');
const search=require('./190-vc1939-rally-search-pro.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const sample=()=>({id:'M-Ñ/7',currentSet:1,sets:[
 {number:1,rallies:[
  {id:'R-1/Ñ',winner:'ours',servingBefore:'opponent',rotationBefore:1,opponentRotationBefore:6,
   scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},actions:[
    {id:'A-1',team:'ours',skill:'r',evaluation:'#',playerNameSnapshot:'Lia',
     startZone:'5A',contactZone:'Z5C',code:'*08R#',videoTime:0,scoutMs:50},
    {id:'A-2',team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Ana',
     setTempo:'2',setTarget:'4B',attackCombo:'X1',contactCoordinate:{x:0.3,y:0.8}},
    {id:'A-3',team:'ours',skill:'A',evaluation:'#',playerNameSnapshot:'Lia',
     startZone:'4B',endZone:'1D',attackTempo:'2',attackDirection:'línea',videoTimestamp:33},
    {team:null,skill:'D',evaluation:'!',playerLabel:'Jugador sin equipo',contactZone:'invalid'},
    {id:'A-5',team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Ana',setTempo:'4'},
    {id:'A-6',team:'ours',skill:'A',evaluation:'/',playerNameSnapshot:'Marta',endZone:'6C'}
   ]},
  {id:'R-1/Ñ',winner:'opponent',servingBefore:'ours',rotationBefore:2,opponentRotationBefore:1,
   actions:[{id:'dup',team:'ours',skill:'S',evaluation:'=',playerNumberSnapshot:9},
    {id:'dup',team:'opponent',skill:'S',evaluation:'?',videoAction:-1},
    {team:'opponent',skill:'E',evaluation:'!',playerNameSnapshot:'Rival Colocador',setTarget:'Z2A'},
    {team:'opponent',skill:'A',evaluation:'#',playerNameSnapshot:'Rival Punta'}]},
  {winner:null,servingBefore:null,rotationBefore:'7',actions:[
   {team:'ours',skill:'E',evaluation:'!',playerLabel:'Colocador',setTarget:'4D'},
   {team:'ours',skill:'A',evaluation:'?',playerLabel:'Atacante',endZone:'0A'}]}
 ]},
 {number:1,rallies:[{id:'R-2',winner:'ours',servingBefore:'ours',actions:[
   {team:'ours',skill:'D',evaluation:'-',playerNameSnapshot:'Lia',startZone:'8B'}]}]},
 {number:3,rallies:[null,{id:'R-4',winner:'opponent',servingBefore:'opponent',actions:[]}]}
]});

test('V20.5.24 TypeScript normalizer exactly matches legacy keys, contacts, zones, possessions and sets',async()=>{
 const {normalizeAnalysisMatch,normalizeAnalysisZone}=await compiled();
 const native=sample(),before=JSON.stringify(native),old=legacy.normalize(native),modern=normalizeAnalysisMatch(native);
 assert.deepStrictEqual(modern,old);
 assert.equal(JSON.stringify(native),before,'raw scout is never changed');
 assert.equal(modern.version,'19.3.8');
 assert.equal(modern.rallies[0].key,'M-%C3%91%2F7|1|id:R-1%2F%C3%91');
 assert.equal(modern.contacts[0].fields.startZone.code,'Z5A');
 assert.equal(modern.contacts[0].video,true,'video time zero is valid');
 assert.equal(modern.rallies[0].possessions.length,2,'unknown team ends the previous possession');
 assert.equal(modern.rallies[0].possessions[0].contacts.length,3);
 assert.equal(modern.rallies[0].possessions[1].contacts.length,2);
 assert.equal(modern.rallies[0].contacts[3].possessionKey,undefined);
 assert.equal(modern.rallies[0].contacts[4].possessionKey,modern.rallies[0].possessions[1].key);
 assert.equal(modern.rallies[0].provenance.stableId,true);
 for(const input of ['1','1A','Z1A','9D','z8b','Z0','Z7E',null,'','15',' 3c '])
  assert.deepStrictEqual(normalizeAnalysisZone(input),legacy.zone(input));
 for(const kind of ['duplicate-set','duplicate-rally','duplicate-action','unknown-team',
  'unknown-evaluation','invalid-zone','unknown-winner','unknown-serve'])
  assert.ok(modern.issues.some(issue=>issue.type===kind),`missing ${kind}`);
});

test('normalization parity is preserved across deterministic edits, malformed rows and undo',async()=>{
 const {normalizeAnalysisMatch}=await compiled();
 const variants=[null,{},0,'text',{sets:[null,{},false,'text']},{sets:[]}];
 for(let i=0;i<160;i++){
  const m=sample(),r=m.sets[0].rallies[0],index=i%r.actions.length;
  if(i%2===0)r.actions[index].team=['ours','opponent',null,'wrong'][i%4];
  if(i%3===0)r.actions[index].evaluation=['#','+','-','=','!','/','??'][i%7];
  if(i%5===0)r.actions[index].startZone=['1D','9C','Z6A','Z0','bad',null][i%6];
  if(i%7===0)m.sets[0].rallies.splice(1,1);
  if(i%11===0)m.sets.push({number:2,rallies:[{winner:'ours',servingBefore:'opponent',actions:[]}]});
  if(i%13===0)m.sets[2].rallies.pop();
  if(i%17===0)m.id='M'+i;
  variants.push(m);
 }
 for(const [i,match] of variants.entries()){
  const original=legacy.normalize(match),migrated=normalizeAnalysisMatch(match);
  assert.deepStrictEqual(migrated,original,`variant ${i}`);
 }
});

test('typed rally search and classic analysis retain identical outputs on the migrated normalized model',async()=>{
 const {normalizeAnalysisMatch,queryRallies}=await compiled();
 const native=sample(),left=legacy.normalize(native),right=normalizeAnalysisMatch(native);
 const choices=[{}, {team:'ours'}, {team:'opponent',skill:'A'},
  {status:'all',team:'ours',reception:'#'}, {team:'ours',setter:'Ana',attacker:'Lia'},
  {team:'opponent',rotation:1,phase:'K1'}, {team:'ours',skill:'A',video:'yes'},
  {team:'ours',evaluation:'=',ownRotation:2}, {status:'open',team:'ours'},
  {team:'ours',tempo:'2',combo:'X1'}];
 for(const filter of choices){
  assert.deepStrictEqual(search.query(right,filter),search.query(left,filter));
  assert.deepStrictEqual(queryRallies(right,filter),search.query(left,filter));
 }
 assert.deepStrictEqual(legacy.filter(right,{team:'ours',skill:'A'}),legacy.filter(left,{team:'ours',skill:'A'}));
 assert.deepStrictEqual(legacy.coverage(right),legacy.coverage(left));
});

test('compatibility adapter uses TypeScript normalizer and falls back if unavailable or broken',async()=>{
 const {installAnalysisNormalizeBridge}=await compiled();
 const native=sample(),win={performance:{now:()=>1}};
 const bridge=installAnalysisNormalizeBridge(win);
 assert.strictEqual(installAnalysisNormalizeBridge(win),bridge);
 const sandbox={window:win};vm.runInNewContext(read('189-vc1938-professional-data-engine.js'),sandbox);
 const api=win.VC_DATA_ENGINE_1938;
 assert.ok(api);assert.equal(api.VERSION,'19.3.8');
 const output=api.normalize(native);
 assert.deepStrictEqual(output,legacy.normalize(native));
 assert.equal(bridge.diagnostics().normalizations,1);
 delete win.VC_ANALYSIS_NORMALIZE_20524;
 assert.equal(JSON.stringify(api.normalize(native)),JSON.stringify(legacy.normalize(native)));
 win.VC_ANALYSIS_NORMALIZE_20524={normalize:()=>{throw Error('simulated module fault')}};
 assert.equal(JSON.stringify(api.normalize(native)),JSON.stringify(legacy.normalize(native)));
 win.VC_ANALYSIS_NORMALIZE_20524={normalize:()=>({version:'19.3.8',rallies:[],contacts:null})};
 assert.equal(JSON.stringify(api.normalize(native)),JSON.stringify(legacy.normalize(native)));
});

test('normalization diagnostics collect only numeric timing data',async()=>{
 const {installAnalysisNormalizeBridge}=await compiled();
 let ms=0;const win={performance:{now:()=>{ms+=7.25;return ms;}}};
 const bridge=installAnalysisNormalizeBridge(win),native=sample();
 for(let i=0;i<3;i++)bridge.normalize(native);
 assert.deepStrictEqual({...bridge.diagnostics()},{readOnly:true,normalizations:3,failures:0,
  slowNormalizations:0,lastMs:7.25,averageMs:7.25,maxMs:7.25,budgetMs:16});
 const info=JSON.stringify(bridge.diagnostics());
 assert.ok(!info.includes('M-Ñ/7'));assert.ok(!info.includes('Lia'));
 assert.ok(!info.includes('scout'));assert.ok(!info.includes('player'));
});

test('V20.5.24 preserves legacy writers, module ordering and the published assets',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js'),engine=read('189-vc1938-professional-data-engine.js');
 assert.equal(pkg.version,'20.5.67');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.67'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.67'));
 assert.ok(sw.includes('analysis-normalizer-20.5.24'));
 assert.ok(entry.includes('installAnalysisNormalizeBridge(window)'));
 assert.ok(entry.includes('normalizeAnalysisMatch'));
 assert.ok(engine.includes('normalize:normalizeCompat'));
 assert.ok(engine.includes('VC_ANALYSIS_NORMALIZE_20524'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20524-analysis-normalizer-migration.test.cjs'));
 assert.ok(pkg.scripts['benchmark:analysis'].includes('scripts/benchmark-analysis-normalizer.mjs'));
 assert.ok(read('scripts/benchmark-analysis-normalizer.mjs').includes('BENCH-SYNTHETIC'));
 for(const file of ['src/state/analysis-normalizer.ts','src/state/analysis-normalize-runtime.ts']){
  const source=read(file);
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(',
   'scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.equal(source.includes(forbidden),false,`${file}: ${forbidden}`);
 }
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
