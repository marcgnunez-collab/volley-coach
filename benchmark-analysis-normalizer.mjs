/* V20.5.24 · Reproducible, read-only local benchmark with synthetic scouts.
 * Never reads real club data or browser storage. Performance numbers depend on
 * this machine; use them for local comparisons, not latency guarantees.
 */
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {deepStrictEqual} from 'node:assert/strict';
import {normalizeAnalysisMatch} from '../vc2055-domain-core.mjs';

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
const result={version:'20.5.24',synthetic:true,rallies,actions:rallies*6,
 historicalMs,typescriptMs,baseline:'Median of five warm Node.js runs per implementation',
 note:'No DOM, vídeo, red ni persistencia: no es una garantía de rendimiento en directo.'};
process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
