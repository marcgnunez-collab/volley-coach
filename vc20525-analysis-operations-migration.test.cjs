'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const legacy=require('./189-vc1938-professional-data-engine.js');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function sample(n=42){
 const rallies=Array.from({length:n},(_,i)=>({
  id:i%13===0?null:'r'+i,winner:i%9===0?null:i%3===0?'opponent':'ours',
  servingBefore:i%7===0?null:i%2===0?'opponent':'ours',
  rotationBefore:i%6+1,opponentRotationBefore:(i+3)%6+1,
  actions:[
   {id:'a1',team:'ours',skill:'S',evaluation:i%2===0?'#':'=',playerNameSnapshot:'Lia',
    startZone:'1A',endZone:'6C',videoTime:i===0?0:undefined},
   {id:'a2',team:'opponent',skill:'R',evaluation:i%4===0?'#':'+',
    playerNameSnapshot:'Rival 04',startZone:'6C'},
   {id:'a3',team:'opponent',skill:'E',evaluation:'+',playerNameSnapshot:'Setter Rival',
    setTarget:i%5===0?'4B':'2A',setTempo:'2'},
   {id:'a4',team:'opponent',skill:'A',evaluation:i%7===0?'/':i%5===0?'=':'#',
    playerNameSnapshot:'Rival 08',endZone:'1D',attackDirection:'línea'},
   {id:'a5',team:'ours',skill:'R',evaluation:i%4===0?'#':'-',playerNameSnapshot:'Lia'},
   {id:'a6',team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Ana',setTarget:'4D'},
   {id:'a7',team:'ours',skill:'A',evaluation:i%6===0?'=':'#',
    playerNameSnapshot:'Marta',endZone:'5B',videoTimestamp:i*3},
   i%11===0?{team:null,skill:'B',evaluation:'?',startZone:'Z0'}:null
  ]
 }));
 return {id:'V20.5.25 Synthetic Ñ',sets:[
  {number:1,rallies:rallies.slice(0,Math.floor(n/2))},
  {number:2,rallies:rallies.slice(Math.floor(n/2))}
 ]};
}

test('typed Data Engine filter gives exact historic results across 1,000 combinations',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis}=await compiled();
 const raw=sample(75),before=JSON.stringify(raw),data=normalizeAnalysisMatch(raw);
 const pick=[{}, {team:'ours'}, {team:'opponent'}, {team:'unknown'},
  {set:1},{set:2},{set:'2'}, {set:'invalid'},
  {rotation:1},{rotation:2},{rotation:6},{rotation:0},{rotation:'wrong'},
  {phase:'K1'},{phase:'K2'},{phase:'k1'},{phase:'K3'},
  {skill:'A'},{skill:'E'},{skill:'R'},{skill:'B'},{skill:'Z'},
  {evaluation:'#'},{evaluation:'='},{evaluation:'/'},{evaluation:'?'},
  {player:'Marta'},{player:'SETTER RIVAL'},{player:'ausente'},
  {startZone:'Z1A'},{startZone:'6C'},{startZone:'wrong'},
  {endZone:'1D'},{endZone:'5B'},{endZone:'9D'},
  {setter:'Ana'},{setter:'Setter Rival'},{setter:'Nadie'},
  {video:true},{video:false},{video:'true'}];
 const filters=[];
 for(const f of pick)filters.push(f);
 for(const team of ['ours','opponent',null]){
  for(const set of [1,2,3,null]){
   for(const phase of ['K1','K2','']){
    for(const other of pick.slice(13)){
     filters.push({team,set,phase,...other});
    }
   }
  }
 }
 assert.ok(filters.length>=1000);
 for(const [index,filtersForCase] of filters.entries()){
  const expected=legacy.filter(data,filtersForCase),actual=filterAnalysis(data,filtersForCase);
  assert.deepStrictEqual(actual,expected,`filter ${index}: ${JSON.stringify(filtersForCase)}`);
  assert.strictEqual(actual.filters,filtersForCase,'caller filters remain same object');
 }
 assert.equal(JSON.stringify(raw),before,'native match never modified');
});

test('attack, point opportunities, data coverage and reconciliation have exact parity',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,evaluateAnalysisContacts,
  calculateAnalysisPoints,inspectAnalysisCoverage,reconcileAnalysisPoints}=await compiled();
 const data=normalizeAnalysisMatch(sample(170)),before=JSON.stringify(data);
 assert.deepStrictEqual(inspectAnalysisCoverage(data),legacy.coverage(data));
 const subsets=[data.contacts,filterAnalysis(data,{team:'ours',phase:'K1'}).contacts,
  filterAnalysis(data,{skill:'E',video:true}).contacts,[],null,undefined];
 for(const rows of subsets)for(const skill of ['A','R','S','E','B','??',''])
  assert.deepStrictEqual(evaluateAnalysisContacts(rows,skill),legacy.evaluate(rows,skill));
 for(const rows of [data.rallies,filterAnalysis(data,{set:2}).rallies,[],null,undefined]){
  for(const teamId of ['ours','opponent','invalid',null,undefined]){
   assert.deepStrictEqual(calculateAnalysisPoints(rows,teamId),legacy.points(rows,teamId));
  }
 }
 for(const t of ['ours','opponent','invalid',null]){
  for(const previous of [null,{}, {points:null}, {points:{}},
   {points:{k1:{n:10},k2:{n:20}}},
   {points:legacy.points(data.rallies,t)},
   {points:{k1:{n:0},k2:{n:0}}}]){
   assert.deepStrictEqual(reconcileAnalysisPoints(data,previous,t),legacy.reconcile(data,previous,t));
  }
 }
 assert.equal(JSON.stringify(data),before,'read-only calculation must not mutate normalized model');
});

test('legacy Data Engine actually delegates five operations and panel metrics to TypeScript',async()=>{
 const {installAnalysisOperationsBridge,installAnalysisNormalizeBridge}=await compiled();
 let now=0;const win={performance:{now:()=>{now+=5;return now;}}};
 const ops=installAnalysisOperationsBridge(win),normalize=installAnalysisNormalizeBridge(win);
 assert.strictEqual(installAnalysisOperationsBridge(win),ops);
 vm.runInNewContext(read('189-vc1938-professional-data-engine.js'),{window:win});
 const api=win.VC_DATA_ENGINE_1938,data=api.normalize(sample(12));
 const controls={team:'opponent',skill:'A',setter:'Setter Rival',phase:'K2'};
 assert.deepStrictEqual(api.filter(data,controls),legacy.filter(data,controls));
 assert.deepStrictEqual(api.evaluate(data.contacts),legacy.evaluate(data.contacts));
 assert.deepStrictEqual(api.points(data.rallies,'ours'),legacy.points(data.rallies,'ours'));
 assert.deepStrictEqual(api.coverage(data),legacy.coverage(data));
 const previous={points:legacy.points(data.rallies,'opponent')};
 assert.deepStrictEqual(api.reconcile(data,previous,'opponent'),legacy.reconcile(data,previous,'opponent'));
 const selection=api.filter(data,{team:'ours'});
 const html=api.panelHTML(data,selection,previous);
 assert.ok(html.left.includes('AUDITORÍA')||html.left.includes('Contactos'));
 assert.ok(html.center.includes('Posesión'));
 const d=ops.diagnostics();
 assert.equal(d.filters,2);
 assert.equal(d.evaluations,2,'real panel uses typed evaluation');
 assert.equal(d.points,1);
 assert.equal(d.coverage,2,'real panel uses typed coverage');
 assert.equal(d.reconciliations,2,'real panel uses typed reconciliation');
 assert.equal(d.operations,9);
 assert.equal(d.failures,0);assert.equal(d.averageMs,5);
 assert.equal(normalize.diagnostics().normalizations,1);
 for(const secret of ['V20.5.25 Synthetic Ñ','Marta','Rival 08'])
  assert.ok(!JSON.stringify(d).includes(secret));
});

test('legacy fallback restores original behavior when operations module is absent, broken or returns invalid data',async()=>{
 const {installAnalysisOperationsBridge}=await compiled(),win={performance:{now:()=>0}};
 const bridge=installAnalysisOperationsBridge(win);
 vm.runInNewContext(read('189-vc1938-professional-data-engine.js'),{window:win});
 const api=win.VC_DATA_ENGINE_1938,data=legacy.normalize(sample(18));
 const checks=[['filter',[data,{team:'ours',skill:'A'}]],
  ['evaluate',[data.contacts,'A']],['points',[data.rallies,'ours']],
  ['coverage',[data]],['reconcile',[data,{points:legacy.points(data.rallies,'ours')},'ours']]];
 for(const fault of [undefined,{}, Object.fromEntries(checks.map(([key])=>[key,()=>{throw Error('failure');}])),
  Object.fromEntries(checks.map(([key])=>[key,()=>({})]))]){
  if(fault===undefined)delete win.VC_ANALYSIS_OPERATIONS_20525;
  else win.VC_ANALYSIS_OPERATIONS_20525=fault;
  for(const [name,args] of checks){
   const actual=api[name](...args),expected=legacy[name](...args);
   assert.equal(JSON.stringify(actual),JSON.stringify(expected),`${name} fallback`);
  }
 }
 assert.equal(bridge.diagnostics().operations,0,'a replaced bridge was never invoked');
});

test('V20.5.25 deployment keeps existing writers and bridge ordering intact',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js'),engine=read('189-vc1938-professional-data-engine.js');
 assert.equal(pkg.version,'20.5.30');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.30'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.30'));
 assert.ok(sw.includes('analysis-operations-20.5.25'));
 assert.ok(entry.includes('installAnalysisOperationsBridge(window)'));
 assert.ok(engine.includes('VC_ANALYSIS_OPERATIONS_20525'));
 for(const name of ['filter','evaluate','points','coverage','reconcile'])
  assert.ok(engine.includes(`${name}:${name}Compat`),name);
 assert.ok(pkg.scripts['test:foundation'].includes('vc20525-analysis-operations-migration.test.cjs'));
 for(const file of ['src/state/analysis-operations.ts','src/state/analysis-operations-runtime.ts']){
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(',
   'scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.ok(!read(file).includes(forbidden),`${file}: ${forbidden}`);
 }
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
