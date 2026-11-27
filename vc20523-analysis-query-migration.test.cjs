'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const legacyData=require('./189-vc1938-professional-data-engine.js');
const legacySearch=require('./190-vc1939-rally-search-pro.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(require('node:path').join(__dirname,file),'utf8');

function nativeFixture(){
 const contact=(team,skill,evaluation,player,extra={})=>({team,skill,evaluation,
  playerNameSnapshot:player,...extra});
 return {id:'PRIVATE-MATCH-7',currentSet:2,status:'live',sets:[
  {number:1,rallies:[
   {id:'r1',rotationBefore:1,opponentRotationBefore:6,servingBefore:'opponent',winner:'ours',actions:[
    contact('ours','R','#','Lia',{startZone:'5A',code:'*08R#'}),
    contact('ours','E','+','Ana',{setTempo:'2',setTarget:'4B',attackCombo:'X5',code:'*03E+'}),
    contact('ours','A','#','Lia',{startZone:'4B',endZone:'1C',attackTempo:'2',attackDirection:'line',videoTime:13,code:'*08A#'}),
    contact('opponent','D','+','Rival',{endZone:'1C'})]},
   {id:'r2',rotationBefore:2,opponentRotationBefore:1,servingBefore:'ours',winner:'opponent',actions:[
    contact('ours','S','=','Ana',{startZone:'1A',endZone:'6D',code:'*03S='}),
    contact('opponent','R','+','Rival',{startZone:'6D'}),
    contact('opponent','E','!','Rival Setter',{setTempo:'3',setTarget:'2B'}),
    contact('opponent','A','#','Rival',{endZone:'5A',code:'a11A#'})]},
   {id:'r3',rotationBefore:3,opponentRotationBefore:2,servingBefore:'opponent',winner:'ours',actions:[
    contact('ours','R','-','Lia'),contact('ours','E','!','Ana',{setTempo:'4'}),
    contact('ours','A','/','Marta',{attackTempo:'4',videoTime:17}),
    contact('opponent','B','#','Rival',{code:'a09B#'}),
    contact('ours','D','+','Lia'),contact('ours','E','+','Ana',{setTempo:'1'}),
    contact('ours','A','#','Lia',{endZone:'6B'})]}
  ]},
  {number:2,rallies:[
   {id:'r4',rotationBefore:4,opponentRotationBefore:3,servingBefore:'ours',winner:'ours',actions:[
    contact('ours','A','+','Marta',{endZone:'5B',videoTimestamp:25})]},
   {id:'r5',rotationBefore:5,opponentRotationBefore:4,servingBefore:'opponent',winner:null,actions:[
    contact('ours','R','!','Lia',{startZone:'5C'}),
    contact('ours','E','+','Ana',{setTempo:'1'}),
    contact('ours','A','=','Marta',{endZone:'4D'}),
    contact(null,'A','??',null,{code:'unknown'})]}
  ]}
 ]};
}

test('the typed tactical query agrees exactly with the historical search on DV4-style filter combinations',async()=>{
 const {queryRallies,normalizeRallySearchFilters,SEARCH_FILTERS}=await compiled();
 const native=nativeFixture(),data=legacyData.normalize(native),before=JSON.stringify(data);
 assert.equal(SEARCH_FILTERS.length,16);
 assert.deepEqual(normalizeRallySearchFilters({code:'x'.repeat(200)}).code,'x'.repeat(100));
 const cases=[
  {},{status:'all'},{status:'open'},{status:'closed'},
  {team:'ours'},{team:'opponent'},{team:'ours',status:'all'},
  {team:'ours',skill:'A',evaluation:'#'},
  {team:'opponent',skill:'R',evaluation:'+'},
  {team:'ours',player:'Lia',status:'all'},
  {team:'ours',setter:'Ana',attacker:'Lia'},
  {team:'ours',reception:'#',setter:'Ana',attacker:'Lia',tempo:'2'},
  {team:'ours',reception:'-',setter:'Ana',attacker:'Marta',tempo:'4'},
  {team:'ours',reception:'#',skill:'A',evaluation:'#',combo:'X5'},
  {team:'ours',code:'*08',video:'yes',outcome:'ours'},
  {team:'ours',startZone:'4B',endZone:'1C',video:'yes'},
  {team:'opponent',setter:'Rival Setter',attacker:'Rival'},
  {set:1,ownRotation:1,rivalRotation:6,phase:'K1',team:'ours'},
  {set:2,ownRotation:5,status:'open',team:'ours'},
  {set:2,rotation:4,phase:'K2',team:'ours',outcome:'ours'},
  {team:'ours',skill:'A',video:'no'},
  {team:'ours',evaluation:'=',status:'open'},
  {team:'ours',reception:'!',status:'all'}
 ];
 // Deterministic extended combinations exercise cross-filtering without random CI flakes.
 const teams=[undefined,'ours','opponent'],skills=[undefined,'R','E','A'],
  assessments=[undefined,'#','+','/','='],states=['closed','all','open'];
 for(let i=0;i<270;i++)cases.push({team:teams[i%3],skill:skills[(i*7)%4],
  evaluation:assessments[(i*11)%5],status:states[(i*13)%3],
  ownRotation:i%5===0?String(i%6+1):undefined,
  set:i%7===0?String(i%2+1):undefined,
  player:i%13===0?'Lia':undefined,video:i%19===0?'yes':undefined});
 for(const filters of cases){
  const old=legacySearch.query(data,filters),modern=queryRallies(data,filters);
  assert.deepStrictEqual(modern,old,`filters: ${JSON.stringify(filters)}`);
  if(old.rallies.length)assert.strictEqual(modern.rallies[0],old.rallies[0]);
 }
 assert.equal(JSON.stringify(data),before,'typed queries do not mutate normalized source');
 assert.equal(JSON.stringify(native),JSON.stringify(nativeFixture()),'native scouting is untouched');
});

test('corrected historical actions, open rallies, missing classifications and sequence isolation remain equivalent',async()=>{
 const {queryRallies}=await compiled();
 const native=nativeFixture();
 const filters=[{status:'all',team:'ours',reception:'#'},
  {team:'ours',setter:'Ana',attacker:'Lia',reception:'#',tempo:'2'},
  {team:'ours',skill:'A',evaluation:'='},{status:'open',team:'ours'}];
 const check=()=>{
  const projection=legacyData.normalize(native);
  for(const f of filters)assert.deepStrictEqual(queryRallies(projection,f),legacySearch.query(projection,f));
 };
 check();
 native.sets[0].rallies[0].actions[2].evaluation='=';
 check();
 native.sets[0].rallies.splice(1,1);
 check();
 native.sets[1].rallies[1].winner='opponent';
 check();
 const d=legacyData.normalize(native);
 const result=queryRallies(d,{team:'ours',reception:'#',setter:'Ana',attacker:'Rival'});
 assert.equal(result.chains.length,0,'a setter cannot borrow a rival attack from another possession');
});

test('Vite analysis bridge measures only aggregate durations and is idempotent',async()=>{
 const {installAnalysisQueryBridge}=await compiled();
 let now=0;
 const win={performance:{now:()=>{now+=4.5;return now}},document:{}};
 const api=installAnalysisQueryBridge(win);
 assert.equal(api.VERSION,'20.5.23');assert.equal(api.readOnly,true);
 assert.strictEqual(installAnalysisQueryBridge(win),api);
 assert.strictEqual(win.VC_ANALYSIS_QUERY_20523,api);
 const source=legacyData.normalize(nativeFixture()),filters={team:'ours',skill:'A'};
 for(let i=0;i<3;i++)assert.deepStrictEqual(api.query(source,filters),legacySearch.query(source,filters));
 assert.deepStrictEqual({...api.diagnostics()},{readOnly:true,queries:3,failures:0,slowQueries:0,
  lastMs:4.5,averageMs:4.5,maxMs:4.5,budgetMs:16});
 assert.equal(JSON.stringify(api.diagnostics()).includes('PRIVATE-MATCH'),false);
 assert.equal(JSON.stringify(api.diagnostics()).includes('Lia'),false);
});

test('legacy tactical analysis delegates to the TypeScript engine but works without it',async()=>{
 const {installAnalysisQueryBridge}=await compiled();
 const data=legacyData.normalize(nativeFixture());
 const win={performance:{now:()=>1},document:{}};installAnalysisQueryBridge(win);
 win.VC_DATA_ENGINE_1938={normalize:()=>data};
 const panel={ownerDocument:{defaultView:win,activeElement:null},dataset:{},querySelector:()=>null};
 legacySearch.decorate(panel,{match:nativeFixture(),team:'ours',set:1,rotation:1,phase:'K1'},'search');
 assert.equal(panel.dataset.vc20523QueryEngine,'typescript');
 assert.equal(win.VC_ANALYSIS_QUERY_20523.diagnostics().queries,1);
 delete win.VC_ANALYSIS_QUERY_20523;
 legacySearch.decorate(panel,{match:nativeFixture(),team:'ours',set:1,rotation:1,phase:'K1'},'search');
 assert.equal(panel.dataset.vc20523QueryEngine,'classic');
 win.VC_ANALYSIS_QUERY_20523={query:()=>{throw Error('simulated late module fault')}};
 legacySearch.decorate(panel,{match:nativeFixture(),team:'ours',set:1,rotation:1,phase:'K1'},'search');
 assert.equal(panel.dataset.vc20523QueryEngine,'classic');
});

test('Gestión has a manually refreshed performance panel with no timers, identifiers or native subscriptions',async()=>{
 const {installAnalysisQueryBridge,mountAnalysisQueryPerformance}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.children=[];this.parentNode=null;
   this.className='';this.textContent='';this.dataset={};this.type='';}
  set id(value){this._id=value;this.doc.nodes.set(value,this)}
  get id(){return this._id||''}
  append(...children){for(const child of children){child.parentNode=this;this.children.push(child)}}
  insertAdjacentElement(_where,child){const group=this.parentNode;
   group.children.splice(group.children.indexOf(this)+1,0,child);child.parentNode=group;}
  remove(){if(!this.parentNode)return;const group=this.parentNode;
   group.children=group.children.filter(c=>c!==this);this.parentNode=null;}
 }
 class Document extends EventTarget{
  constructor(){super();this.nodes=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.nodes.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('section'),anchor=doc.createElement('section'),
  performance=doc.createElement('section'),grid=doc.createElement('div');
 host.id='v11-management';anchor.id='vc2059-observable';performance.id='vc60-diagnostics';
 grid.id='vc60-stat-grid';performance.append(grid);host.append(anchor,performance);
 let tick=0;
 const win={document:doc,performance:{now:()=>++tick*2}};
 const query=installAnalysisQueryBridge(win),panel=mountAnalysisQueryPerformance(win);
 assert.ok(panel);assert.equal(panel.readOnly,true);
 assert.strictEqual(mountAnalysisQueryPerformance(win),panel);
 assert.equal(performance.children[1].id,'vc20523-query-metrics');
 assert.equal(performance.children[1].children[3].children[0].children[1].textContent,'0');
 query.query(legacyData.normalize(nativeFixture()),{team:'ours'});
 panel.refresh();
 assert.equal(performance.children[1].children[3].children[0].children[1].textContent,'1');
 assert.equal(performance.children[1].children[3].children[1].children[1].textContent,'2.00 ms');
 assert.ok(!JSON.stringify(performance.children[1].textContent).includes('PRIVATE-MATCH'));
 panel.dispose();assert.equal(performance.children.length,1);assert.equal(host.children.length,2);
 assert.ok(mountAnalysisQueryPerformance(win));
});

test('V20.5.23 publishes a typed query, stable legacy adapter and no new scoring writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js'),
  entry=read('src/vc2055-entry.ts'),legacy=read('190-vc1939-rally-search-pro.js');
 assert.equal(pkg.version,'20.6.5');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.5'));
 assert.ok(html.includes('vc2055-domain.css?v=20.6.5'));
 assert.ok(sw.includes('analysis-query-migration-20.5.23'));
 assert.ok(entry.includes('installAnalysisQueryBridge(window)'));
 assert.ok(entry.includes('mountAnalysisQueryPerformance(window)'));
 assert.ok(legacy.includes('VC_ANALYSIS_QUERY_20523'));
 assert.ok(!legacy.includes('VC_SCOUT_QUERY_20523'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20523-analysis-query-migration.test.cjs'));
 for(const file of ['src/state/analysis-query.ts','src/state/analysis-query-runtime.ts']){
  const text=read(file);
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'indexedDB', 'localStorage',
   'supabase','cloudClient.','v121AwardPoint=', 'window.MatchState='])
   assert.equal(text.includes(forbidden),false,`${file}: ${forbidden}`);
 }
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
