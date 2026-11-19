'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const old=require('./189-vc1938-professional-data-engine.js');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function match(n=180,duplicate=false){
 const size=Math.ceil(n/3),sets=[1,2,3].map(number=>({number,rallies:[]}));
 for(let i=0;i<n;i++){
  const si=Math.floor(i/size),number=si+1;
  sets[si].rallies.push({id:duplicate&&i===size+4?'r'+size:'r'+i,
   servingBefore:i%9===0?null:i%2===0?'ours':'opponent',
   winner:i%13===0?null:i%3===0?'opponent':'ours',
   rotationBefore:i%6+1,opponentRotationBefore:(i+3)%6+1,
   actions:[
    {id:'s-'+i,team:'ours',skill:'S',evaluation:i%5===0?'#':'=',
     playerNameSnapshot:i%8===0?'=HYPERLINK("bad";A1)':'Lia',startZone:'1A'},
    {id:'r-'+i,team:'opponent',skill:'R',evaluation:i%4===0?'#':'+',
     playerNameSnapshot:'Rival; "citas"',endZone:'6B'},
    {team:'opponent',skill:'E',evaluation:'+',playerNameSnapshot:'Setter',setTarget:'4B'},
    {team:'opponent',skill:'A',evaluation:i%6===0?'/':'#',endZone:'1D',
     playerNameSnapshot:'Rival 08',videoTime:i===0?0:undefined},
    {team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Ana',setTarget:'4A'},
    {team:'ours',skill:'A',evaluation:i%7===0?'=':'#',endZone:'5D',
     playerNameSnapshot:i%11===0?'+WEBSERVICE("x")':'Marta',videoTimestamp:i*3},
    i%11===0?{team:null,skill:'?',evaluation:'?',startZone:'0'}:null
   ]
  });
 }
 return {id:'CSV test ñ;"\n=X',sets};
}

test('V20.5.26 CSV is byte-for-byte the historical 18-column BOM and CRLF export',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,exportAnalysisCSV,escapeAnalysisCSVCell}=await compiled();
 const native=match(120),before=JSON.stringify(native),data=normalizeAnalysisMatch(native);
 for(const f of [{},{team:'ours'},{team:'opponent',skill:'A'},
  {team:'ours',set:2,phase:'K1'},{team:'opponent',rotation:3,video:true},
  {team:'ours',skill:'A',evaluation:'#',endZone:'5D'},
  {team:'opponent',setter:'Setter'}]){
  const selected=filterAnalysis(data,f),source={...data,contacts:selected.contacts};
  const expected=old.toCSV(source),actual=exportAnalysisCSV(source);
  assert.equal(actual,expected,`CSV filters ${JSON.stringify(f)}`);
  assert.ok(actual.startsWith('\ufeff"Partido";"Set";"Rally"'));
  assert.ok(!actual.slice(1).includes('\n"')||actual.includes('\r\n"'));
 }
 for(const input of [null,undefined,'',-2,'-2.5','=SUM(A1:A5)',
  '+WEBSERVICE("bad")','@cmd',';\n=x','"quoted"','13,4','  =SUM(2)  ']){
  const t=escapeAnalysisCSVCell(input);
  assert.equal(t,'"'+String(input??'').trim().replace(/^[\s\u0000-\u001f]*[=+\-@]/,
   match=>/^[-+]?\d+(?:[.,]\d+)?$/.test(String(input??'').trim())?match:"'"+match).replace(/"/g,'""')+'"');
 }
 assert.equal(JSON.stringify(native),before,'export never changes source scouting');
});

test('projection-scoped index preserves filter results and avoids repeated full scans',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics}=await compiled();
 const native=match(480),data=normalizeAnalysisMatch(native);
 const before=inspectAnalysisIndexDiagnostics();
 const options=[{team:'ours',set:1},{team:'opponent',set:2,skill:'A'},
  {team:'opponent',rotation:3,phase:'K1'},{team:'ours',set:3,setter:'Ana'},
  {team:'opponent',set:2,video:true},{team:'ours',set:1,skill:'S',evaluation:'='}];
 for(let pass=0;pass<3;pass++)for(const filter of options)
  assert.deepStrictEqual(filterAnalysis(data,filter),old.filter(data,filter));
 const after=inspectAnalysisIndexDiagnostics();
 assert.equal(after.builds-before.builds,1,'one index per normalized projection');
 assert.ok(after.hits-before.hits>=options.length*3-1);
 assert.ok(after.readOnly);
 for(const secret of ['CSV test','Marta','Setter','Lia'])
  assert.ok(!JSON.stringify(after).includes(secret),'numeric-only telemetry');
});

test('a post-rally correction and undo always produce a fresh index',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics,
  invalidateAnalysisIndex}=await compiled();
 const original=match(300),filters={team:'ours',set:2,skill:'A',evaluation:'#'};
 const first=normalizeAnalysisMatch(original),baseline=filterAnalysis(first,filters);
 const modified=original.sets[1].rallies[6].actions[5];
 assert.equal(modified.evaluation,'#');
 modified.evaluation='='; // edit made through the original native source
 const second=normalizeAnalysisMatch(original),corrected=filterAnalysis(second,filters);
 assert.deepStrictEqual(corrected,old.filter(second,filters));
 assert.ok(corrected.contacts.length<baseline.contacts.length);
 modified.evaluation='#'; // undo using native match
 const third=normalizeAnalysisMatch(original),undone=filterAnalysis(third,filters);
 assert.deepStrictEqual(undone,baseline);
 const before=inspectAnalysisIndexDiagnostics().invalidations;
 first.contacts.reverse(); // defensive structural mutation of a derived projection
 invalidateAnalysisIndex(first);
 assert.equal(inspectAnalysisIndexDiagnostics().invalidations,before+1);
 assert.deepStrictEqual(filterAnalysis(first,filters),old.filter(first,filters),
  'non-canonical projections use the historical order');
});

test('duplicates and shuffled contact order skip the index without changing the answer',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics}=await compiled();
 const duplicate=normalizeAnalysisMatch(match(300,true)),filters={team:'opponent',set:2,skill:'A'};
 assert.ok(duplicate.issues.some(issue=>issue.type==='duplicate-rally'));
 const before=inspectAnalysisIndexDiagnostics().unsupported;
 assert.deepStrictEqual(filterAnalysis(duplicate,filters),old.filter(duplicate,filters));
 assert.ok(inspectAnalysisIndexDiagnostics().unsupported>before);
 const shuffled=normalizeAnalysisMatch(match(300));
 shuffled.contacts.reverse();
 assert.deepStrictEqual(filterAnalysis(shuffled,filters),old.filter(shuffled,filters));
});

test('real historical CSV exporter delegates, keeps fallback and counts only numeric metrics',async()=>{
 const {installAnalysisExportBridge,normalizeAnalysisMatch}=await compiled();
 let now=0;const win={performance:{now:()=>{now+=6;return now;}}};
 const bridge=installAnalysisExportBridge(win);
 assert.strictEqual(installAnalysisExportBridge(win),bridge);
 vm.runInNewContext(read('189-vc1938-professional-data-engine.js'),{window:win});
 const api=win.VC_DATA_ENGINE_1938,data=normalizeAnalysisMatch(match(30));
 assert.equal(api.toCSV(data),old.toCSV(data));
 assert.deepStrictEqual({...bridge.diagnostics()},{readOnly:true,exports:1,failures:0,
  lastMs:6,averageMs:6,maxMs:6,slowExports:0,budgetMs:16});
 delete win.VC_ANALYSIS_CSV_20526;
 assert.equal(api.toCSV(data),old.toCSV(data));
 for(const bogus of [{toCSV:()=>{throw Error('module offline');}},
  {toCSV:()=>''},{toCSV:()=>null},{toCSV:()=>42}]){
  win.VC_ANALYSIS_CSV_20526=bogus;
  assert.equal(api.toCSV(data),old.toCSV(data));
 }
 assert.ok(read('189-vc1938-professional-data-engine.js').includes('const source=toCSVCompat('),
  'real user export button must use typed adapter');
});

test('V20.5.26 deployment leaves native writers and storage untouched',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.30');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.30'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.30'));
 assert.ok(sw.includes('analysis-export-index-20.5.26'));
 assert.ok(entry.includes('installAnalysisExportBridge(window)'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20526-analysis-export-index.test.cjs'));
 assert.ok(read('src/state/analysis-query-runtime.ts').includes('Exportación CSV e índices temporales'));
 for(const file of ['src/state/analysis-export.ts','src/state/analysis-index.ts',
  'src/state/analysis-export-runtime.ts'])for(const forbidden of ['localStorage','indexedDB','supabase',
   'scoutSave(','scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.equal(read(file).includes(forbidden),false,`${file}: ${forbidden}`);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
