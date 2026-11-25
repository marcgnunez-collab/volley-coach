'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const legacy=require('./189-vc1938-professional-data-engine.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');

function fixture(count=510){
 const size=Math.ceil(count/3),sets=[1,2,3].map(number=>({number,rallies:[]}));
 for(let i=0;i<count;i++){
  const actions=[
   {id:'S'+i,team:'ours',skill:'S',evaluation:i%4===0?'#':'=',
    playerNameSnapshot:'Lia',startZone:'1A',endZone:'6C',videoTime:i%3===0?i:undefined},
   {id:'R'+i,team:'opponent',skill:'R',evaluation:i%4===0?'#':'+',
    playerNameSnapshot:'Rival 04',startZone:'6C'},
   {team:'opponent',skill:'E',evaluation:'+',playerNameSnapshot:'Setter',setTarget:'2B'},
   {team:'opponent',skill:'A',evaluation:i%7===0?'/':'#',
    playerNameSnapshot:'Rival 08',endZone:'1D',videoTime:i%8===0?i:undefined},
   {team:'ours',skill:'R',evaluation:i%5===0?'#':'-',playerNameSnapshot:'Lia'},
   {team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Ana',setTarget:'4D'},
   {team:'ours',skill:'A',evaluation:i%6===0?'=':'#',
    playerNameSnapshot:'Marta',startZone:'4A',endZone:'5B',videoTimestamp:i%9===0?i:undefined},
   i%17===0?{team:null,skill:'D',evaluation:'?',contactZone:'bad'}:null
  ];
  sets[Math.floor(i/size)].rallies.push({id:'rally-'+i,
   servingBefore:i%2===0?'ours':'opponent',winner:i%11===0?null:i%3===0?'opponent':'ours',
   rotationBefore:i%6+1,opponentRotationBefore:(i+3)%6+1,actions});
 }
 return {id:'Club Secret Ñ',sets};
}

test('multidimensional contact buckets preserve native output and stable order',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics}=await compiled();
 const native=fixture(),data=normalizeAnalysisMatch(native),before=JSON.stringify(native);
 const fields=[{team:'ours'},{team:'opponent',skill:'A'},
  {team:'ours',skill:'A',evaluation:'#'},{team:'opponent',player:'RIVAL 08'},
  {team:'ours',startZone:'4A'},{team:'opponent',endZone:'1D'},
  {team:'ours',video:true},{team:'opponent',skill:'R',evaluation:'+'},
  {team:'ours',set:2,skill:'A',evaluation:'#',player:'Marta'},
  {team:'opponent',rotation:3,skill:'E',setter:'Setter'},
  {team:'ours',phase:'K1',startZone:'4A',endZone:'5B',video:true},
  {team:'opponent',set:1,rotation:5,skill:'A',evaluation:'/'},
  {team:'ours',skill:'?',evaluation:'?',player:'Nadie'},
  {team:'opponent',startZone:'9D',endZone:'1D'}];
 const baseline=inspectAnalysisIndexDiagnostics();
 for(let pass=0;pass<4;pass++)for(const f of fields){
  const modern=filterAnalysis(data,f),old=legacy.filter(data,f);
  assert.deepStrictEqual(modern,old,JSON.stringify(f));
  assert.deepStrictEqual(modern.contacts.map(c=>c.key),old.contacts.map(c=>c.key));
 }
 const after=inspectAnalysisIndexDiagnostics();
 assert.ok(after.dimensionUses-baseline.dimensionUses>=25);
 assert.ok(after.avoidedContactScans>baseline.avoidedContactScans);
 assert.equal(after.builds-baseline.builds,1);
 assert.equal(JSON.stringify(native),before);
});

test('correction of an existing contact and undo cannot read a stale bucket',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,invalidateAnalysisIndex}=await compiled();
 const native=fixture(300),f={team:'ours',skill:'A',evaluation:'#'};
 const first=normalizeAnalysisMatch(native),initial=filterAnalysis(first,f);
 native.sets[1].rallies[6].actions[6].evaluation='=';
 const corrected=normalizeAnalysisMatch(native),after=filterAnalysis(corrected,f);
 assert.deepStrictEqual(after,legacy.filter(corrected,f));
 assert.ok(after.contacts.length<initial.contacts.length);
 native.sets[1].rallies[6].actions[6].evaluation='#';
 const undone=normalizeAnalysisMatch(native);
 assert.deepStrictEqual(filterAnalysis(undone,f),initial);

 const direct=first.contacts.find(c=>c.skill==='A'&&c.team==='ours'&&c.evaluation==='#');
 assert.ok(direct);direct.evaluation='=';
 invalidateAnalysisIndex(first);
 assert.deepStrictEqual(filterAnalysis(first,f),legacy.filter(first,f),
  'directly edited derived projections require explicit invalidation');
});

test('memory guard keeps large scouts functional without building a giant index',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics,
  MAX_INDEXED_CONTACTS}=await compiled();
 const base=normalizeAnalysisMatch(fixture(60)),before=inspectAnalysisIndexDiagnostics();
 const large={...base,contacts:Array.from({length:MAX_INDEXED_CONTACTS+1},()=>base.contacts[0])};
 const f={team:'ours',set:1,skill:'S',evaluation:'#'};
 assert.deepStrictEqual(filterAnalysis(large,f),legacy.filter(large,f));
 const d=inspectAnalysisIndexDiagnostics();
 assert.ok(d.skippedMemoryLimit>before.skippedMemoryLimit);
 assert.equal(d.maxIndexedContacts,40000);
 assert.equal(d.readOnly,true);
});

test('memory diagnostic is an estimate of references, never a promise of module heap',async()=>{
 const {normalizeAnalysisMatch,filterAnalysis,inspectAnalysisIndexDiagnostics}=await compiled();
 const data=normalizeAnalysisMatch(fixture(250));
 filterAnalysis(data,{team:'ours',skill:'A',evaluation:'#'});
 const metrics=inspectAnalysisIndexDiagnostics();
 assert.ok(Number.isFinite(metrics.lastEstimatedReferenceBytes));
 assert.ok(metrics.lastEstimatedReferenceBytes>0);
 assert.ok(metrics.peakEstimatedReferenceBytes>=metrics.lastEstimatedReferenceBytes);
 assert.ok(!JSON.stringify(metrics).includes('Club Secret Ñ'));
 assert.ok(!JSON.stringify(metrics).includes('Marta'));
 const ui=read('src/state/analysis-query-runtime.ts');
 assert.ok(ui.includes('Heap JS navegador'));
 assert.ok(ui.includes('NO memoria real atribuible al módulo'));
 assert.ok(ui.includes("'No disponible'"),'unsupported browsers must not invent a heap reading');
});

test('V20.5.27 bundles typed indexes without native writes or legacy removals',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.66');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.66'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.66'));
 assert.ok(sw.includes('multi-filter-memory-20.5.27'));
 assert.ok(entry.includes('installAnalysisExportBridge(window)'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20527-multidimensional-index-memory.test.cjs'));
 assert.ok(read('189-vc1938-professional-data-engine.js').includes('filter:filterCompat'));
 for(const file of ['src/state/analysis-index.ts','src/state/analysis-operations.ts'])
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(',
   'scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.equal(read(file).includes(forbidden),false,`${file}: ${forbidden}`);
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
