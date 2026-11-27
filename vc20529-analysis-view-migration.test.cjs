'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const legacy=require('./189-vc1938-professional-data-engine.js');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function match(n=55){
 const sets=[{number:1,rallies:[]},{number:2,rallies:[]}];
 for(let i=0;i<n;i++)sets[i%2].rallies.push({
  id:i%10===0?null:'r'+i,servingBefore:i%7===0?null:i%2?'ours':'opponent',
  winner:i%11===0?null:i%3===0?'opponent':'ours',
  rotationBefore:i%6+1,opponentRotationBefore:(i+3)%6+1,
  actions:[
   {team:'ours',skill:'R',evaluation:i%3===0?'#':'+',playerNameSnapshot:'Recepción <A> & «B»'},
   {team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Colocador "1"',setTarget:'4D',setTempo:'2'},
   {team:'ours',skill:'A',evaluation:i%5===0?'=':'#',playerNameSnapshot:'Atacante & z4',endZone:'2A',videoTime:i*2},
   {team:'opponent',skill:'B',evaluation:'/',playerNameSnapshot:'Rival '+i},
   i%13===0?{team:null,skill:'Q',evaluation:'?',startZone:'Z0'}:null
  ]
 });
 return {id:'Partido & <secreto>',sets};
}
const viewInput=(data,selection,legacyMetrics)=>({data,selection,
 coverage:legacy.coverage(data),attack:legacy.evaluate(selection.contacts),
 comparison:legacy.reconcile({rallies:selection.rallies},legacyMetrics,selection.target)});

test('migrated TypeScript Data Engine view has byte-for-byte parity across teams, sets and grades',async()=>{
 const {renderDataEngineView,normalizeAnalysisMatch,filterAnalysis}=await compiled();
 for(const count of [0,2,55,130]){
  const original=match(count),before=JSON.stringify(original),data=normalizeAnalysisMatch(original);
  for(const filters of [{},{team:'ours'},{team:'opponent'},{set:1},{set:2},
   {team:'ours',set:1,skill:'A'},{team:'ours',skill:'A',evaluation:'#'},
   {team:'ours',skill:'A',evaluation:'='},{team:'opponent',phase:'K1'},
   {team:'ours',rotation:3},{team:'ours',phase:'K2'},{skill:'E'},
   {team:'ours',evaluation:'?'},{team:'ours',set:2,rotation:6}]){
   const selection=filterAnalysis(data,filters);
   for(const historical of [undefined,{points:{k1:{n:0},k2:{n:1}}},
    {points:legacy.points(data.rallies,'ours')}]){
    const actual=renderDataEngineView(viewInput(data,selection,historical));
    const expected=legacy.panelHTML(data,selection,historical);
    assert.deepStrictEqual(actual,expected,JSON.stringify({count,filters,historical}));
   }
  }
  assert.equal(JSON.stringify(original),before,'native data never changes');
 }
});

test('HTML encoding survives migration and original player names are never written to telemetry',async()=>{
 const {renderDataEngineView,normalizeAnalysisMatch,filterAnalysis,
  installAnalysisViewBridge}=await compiled();
 const data=normalizeAnalysisMatch(match(3)),selection=filterAnalysis(data,{team:'ours'});
 const result=renderDataEngineView(viewInput(data,selection));
 assert.ok(result.center.includes('Colocador &quot;1&quot;'));
 assert.ok(!result.center.includes('<script>'));
 const win={performance:{now:()=>20}},bridge=installAnalysisViewBridge(win);
 bridge.renderDataEngine(viewInput(data,selection));
 assert.equal(bridge.diagnostics().renders,1);
 for(const value of ['Partido & <secreto>','Colocador "1"','Rival'])
  assert.ok(!JSON.stringify(bridge.diagnostics()).includes(value));
 assert.equal(Object.isFrozen(bridge.diagnostics()),true);
 assert.strictEqual(installAnalysisViewBridge(win),bridge);
});

test('actual historic panel delegates to Vite view and keeps a working classic fallback',async()=>{
 const {installAnalysisViewBridge}=await compiled();
 const win={performance:{now:()=>1}},bridge=installAnalysisViewBridge(win);
 vm.runInNewContext(read('189-vc1938-professional-data-engine.js'),{window:win});
 const engine=win.VC_DATA_ENGINE_1938,original=match(24),before=JSON.stringify(original);
 const data=engine.normalize(original),selection=engine.filter(data,{team:'ours',skill:'A'}),
  previous={points:engine.points(data.rallies,'ours')};
 const expected=legacy.panelHTML(data,selection,previous);
 const modern=engine.panelHTML(data,selection,previous);
 assert.equal(JSON.stringify(modern),JSON.stringify(expected));
 assert.equal(bridge.diagnostics().renders,1,'real view invokes Vite renderer');
 win.VC_ANALYSIS_VIEW_20529={renderDataEngine(){throw Error('unexpected broken module')}};
 assert.equal(JSON.stringify(engine.panelHTML(data,selection,previous)),JSON.stringify(expected));
 win.VC_ANALYSIS_VIEW_20529={renderDataEngine:()=>({left:'',center:'',badges:[],notice:''})};
 assert.equal(JSON.stringify(engine.panelHTML(data,selection,previous)),JSON.stringify(expected));
 delete win.VC_ANALYSIS_VIEW_20529;
 assert.equal(JSON.stringify(engine.panelHTML(data,selection,previous)),JSON.stringify(expected));
 assert.equal(JSON.stringify(original),before,'native match and CAS state are read-only');
});

test('a corrected rally and an undo are reflected in the migrated view on next read',async()=>{
 const {renderDataEngineView,normalizeAnalysisMatch,filterAnalysis}=await compiled();
 const original=match(5);
 const render=()=>{
  const data=normalizeAnalysisMatch(original),selection=filterAnalysis(data,{team:'ours',skill:'A'});
  return renderDataEngineView(viewInput(data,selection)).center;
 };
 const first=render();
 original.sets[0].rallies[1].actions[2].evaluation='=';
 const corrected=render();assert.notEqual(corrected,first);
 original.sets[0].rallies.pop();
 const undone=render();assert.notEqual(undone,corrected);
});

test('V20.5.29 releases a typed analysis view without a new native or cloud writer',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.6.3');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.3'));
 assert.ok(html.includes('vc2055-domain.css?v=20.6.3'));
 assert.ok(sw.includes('analysis-view-20.5.29'));
 assert.ok(entry.includes('installAnalysisViewBridge(window)'));
 assert.ok(read('189-vc1938-professional-data-engine.js').includes('VC_ANALYSIS_VIEW_20529'));
 assert.ok(read('src/state/analysis-query-runtime.ts').includes('Vista Data Engine migrada a TypeScript'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20529-analysis-view-migration.test.cjs'));
 for(const file of ['src/state/analysis-view.ts','src/state/analysis-view-runtime.ts'])
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(',
   'scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.equal(read(file).includes(forbidden),false,`${file} contains ${forbidden}`);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
