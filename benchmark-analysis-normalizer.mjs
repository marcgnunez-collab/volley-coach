/* V20.5.24 · Reproducible, read-only local benchmark with synthetic scouts.
 * Never reads real club data or browser storage. Performance numbers depend on
 * this machine; use them for local comparisons, not latency guarantees.
 */
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {deepStrictEqual} from 'node:assert/strict';
import {normalizeAnalysisMatch,filterAnalysis,evaluateAnalysisContacts,
 calculateAnalysisPoints,inspectAnalysisCoverage,reconcileAnalysisPoints,
 exportAnalysisCSV,invalidateAnalysisIndex,inspectAnalysisIndexDiagnostics} from '../vc2055-domain-core.mjs';

const require=createRequire(import.meta.url);
const historical=require('../189-vc1938-professional-data-engine.js');
const raw=Number(process.env.VC_BENCH_RALLIES||3000);
const rallies=Number.isSafeInteger(raw)?Math.max(100,Math.min(raw,20000)):3000;
const rows=Array.from({length:rallies},(_,i)=>({
 id:`rally-${i}`,servingBefore:i%2===0?'ours':'opponent',
 winner:i%3===0?'opponent':'ours',rotationBefore:i%6+1,opponentRotationBefore:(i+3)%6+1,
 actions:[
  {team:'ours',skill:'S',evaluation:i%9===0?'=':'+',playerNumberSnapshot:12,code:'*12S+'},
  {team:'opponent',skill:'R',evaluation:'+',playerNumberSnapshot:4,startZone:'6B'},
  {team:'opponent',skill:'E',evaluation:'+',playerNumberSnapshot:1,setTempo:'2',setTarget:'4C'},
  {team:'opponent',skill:'A',evaluation:i%4===0?'#':'/',playerNumberSnapshot:8,endZone:'1A'},
  {team:'ours',skill:'D',evaluation:'+',playerNumberSnapshot:6},
  {team:'ours',skill:'A',evaluation:i%3===0?'=':'#',playerNumberSnapshot:9,endZone:'6D'}
 ]
}));
const sample={id:'BENCH-SYNTHETIC',sets:[{number:1,rallies:rows}]};
const old=historical.normalize(sample),modern=normalizeAnalysisMatch(sample);
deepStrictEqual(modern,old,'The benchmark must measure semantically equivalent normalizers.');

function measure(fn){
 const samples=[];
 for(let i=0;i<5;i++){
  const start=performance.now();fn(sample);samples.push(performance.now()-start);
 }
 samples.sort((a,b)=>a-b);
 return Number(samples[2].toFixed(2));
}
const historicalMs=measure(historical.normalize),typescriptMs=measure(normalizeAnalysisMatch);
const engineFilters=[{team:'ours',skill:'A'},{team:'opponent',phase:'K1',rotation:3},
 {team:'opponent',setter:'1',evaluation:'#'},{team:'ours',video:true,endZone:'6D'}];
const expectedData=historical.normalize(sample),newData=normalizeAnalysisMatch(sample);
const previous={points:historical.points(expectedData.rallies,'ours')};
const historicOperations=()=>{
 const selections=engineFilters.map(f=>historical.filter(expectedData,f));
 return {selections,evaluation:historical.evaluate(selections[0].contacts),
  points:historical.points(expectedData.rallies,'ours'),
  coverage:historical.coverage(expectedData),
  reconcile:historical.reconcile(expectedData,previous,'ours')};
};
const typedOperations=()=>{
 const selections=engineFilters.map(f=>filterAnalysis(newData,f));
 return {selections,evaluation:evaluateAnalysisContacts(selections[0].contacts),
  points:calculateAnalysisPoints(newData.rallies,'ours'),
  coverage:inspectAnalysisCoverage(newData),
  reconcile:reconcileAnalysisPoints(newData,previous,'ours')};
};
deepStrictEqual(typedOperations(),historicOperations(),
 'The benchmark must compare equivalent filters, metrics, K1/K2 and coverage.');
const historicalOperationsMs=measure(historicOperations),typescriptOperationsMs=measure(typedOperations);
const selectiveFilters=[{team:'ours',rotation:1,skill:'A'},
 {team:'opponent',rotation:2,skill:'R'},
 {team:'ours',rotation:3,phase:'K2'},
 {team:'opponent',rotation:4,skill:'E',evaluation:'+'}];
const oldSelective=()=>selectiveFilters.map(f=>historical.filter(expectedData,f));
const typedSelective=()=>selectiveFilters.map(f=>filterAnalysis(newData,f));
deepStrictEqual(typedSelective(),oldSelective());
const historicalSelectiveMs=measure(oldSelective);
invalidateAnalysisIndex(newData);
typedSelective(); // warm the scoped index before measuring repeated filter lookups
const indexedSelectiveMs=measure(typedSelective);
const multidimensionalFilters=[{team:'ours',skill:'A',evaluation:'#'},
 {team:'opponent',skill:'R',player:'4'},
 {team:'opponent',skill:'A',endZone:'1A'},
 {team:'ours',skill:'D',evaluation:'+'},
 {team:'opponent',skill:'E',setter:'1'},
 {team:'ours',skill:'S',evaluation:'='}];
const oldMultidimensional=()=>multidimensionalFilters.map(f=>historical.filter(expectedData,f));
const typedMultidimensional=()=>multidimensionalFilters.map(f=>filterAnalysis(newData,f));
deepStrictEqual(typedMultidimensional(),oldMultidimensional());
const historicalMultidimensionalMs=measure(oldMultidimensional);
typedMultidimensional();
const indexedMultidimensionalMs=measure(typedMultidimensional);
const csvSource={...expectedData,contacts:historical.filter(expectedData,{team:'ours',skill:'A'}).contacts};
deepStrictEqual(exportAnalysisCSV(csvSource),historical.toCSV(csvSource));
const historicalCsvMs=measure(()=>historical.toCSV(csvSource));
const typescriptCsvMs=measure(()=>exportAnalysisCSV(csvSource));
const indexStats=inspectAnalysisIndexDiagnostics();
const result={version:'20.5.42',synthetic:true,rallies,actions:rallies*6,
 historicalMs,typescriptMs,baseline:'Median of five warm Node.js runs per implementation',
 operations:{historicalMs:historicalOperationsMs,typescriptMs:typescriptOperationsMs,
  filters:engineFilters.length,includes:['filter','evaluate','points','coverage','reconcile']},
 selectiveFilters:{count:selectiveFilters.length,historicalMs:historicalSelectiveMs,
  indexedMs:indexedSelectiveMs},
 multidimensional:{count:multidimensionalFilters.length,
  historicalMs:historicalMultidimensionalMs,indexedMs:indexedMultidimensionalMs,
  avoidedContactScans:indexStats.avoidedContactScans,
  estimatedReferenceKiB:Number((indexStats.lastEstimatedReferenceBytes/1024).toFixed(1))},
 csv:{rows:csvSource.contacts.length,historicalMs:historicalCsvMs,typescriptMs:typescriptCsvMs},
 note:'No DOM, vídeo, red ni persistencia: no es una garantía de rendimiento en directo.'};
process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
