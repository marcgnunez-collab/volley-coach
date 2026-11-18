'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const audit=require('./vc2052-architecture-audit.cjs');
const perf=require('./232-vc2052-architecture-foundation.js');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

test('architectural audit reports no missing assets and no duplicate script imports',()=>{
 const report=audit.scan();
 assert.deepEqual(report.assets.missingReferences,[]);
 assert.deepEqual(report.assets.duplicateScriptReferences,[]);
 assert.ok(report.assets.embeddedScriptBlocks>50);
 assert.ok(report.assets.embeddedStyleBlocks>100);
 assert.ok(report.highestWrapperCandidates.some(x=>x.file.includes('scouting')));
});
test('performance report is numeric and avoids resource names',()=>{
 const metrics=perf.summarize({navigation:[{responseEnd:125.5,domContentLoadedEventEnd:900,loadEventEnd:1100}],
  resources:[{local:true,type:'js',bytes:1024,name:'never expose this'},{local:false,type:'js',bytes:9999}],
  longTasks:[{duration:64},{duration:80}]});
 assert.equal(metrics.localResources.count,1);
 assert.equal(metrics.localResources.transferKiB,1);
 assert.equal(metrics.longTasks.observed,2);
 assert.equal(metrics.longTasks.maxMs,80);
 assert.equal(JSON.stringify(metrics).includes('never expose this'),false);
});
test('runtime module and cache are versioned, with no business mutation',()=>{
 for(const name of ['232-vc2052-architecture-foundation.js','vc2052-architecture-foundation.css']){
  assert.ok(html.includes('./'+name+'?v=20.5.2'));
  assert.ok(sw.includes("'./"+name+"'"));
 }
 assert.ok(sw.includes('20.5.2'));
 const source=fs.readFileSync(path.join(root,'232-vc2052-architecture-foundation.js'),'utf8');
 for(const forbidden of ['scoutPushAction(', 'cloudClient.', 'localStorage.', 'indexedDB.', 'setScore(', 'scoutSave('])
  assert.equal(source.includes(forbidden),false,forbidden);
});
test('pure ES module projection does not infer missing scores or mutate match',async()=>{
 const {projectMatch,verifyScoreTrace}=await import('./vc2052-match-contract.mjs');
 const match={id:'m1',status:'finished',sets:[{rallies:[
  {winner:'ours',scoreBefore:{us:1,opponent:1},scoreAfter:{us:2,opponent:1},actions:[{skill:'A'}]},
  {winner:'opponent',actions:[{skill:'S'}]},
  {winner:'ours',scoreBefore:{us:2,opponent:2},scoreAfter:{us:4,opponent:2},actions:[]}
 ]}]};
 const before=JSON.stringify(match),result=projectMatch(match);
 assert.deepEqual(result.scoreTraces,{verified:1,inconsistent:1,unknown:1});
 assert.equal(result.rallies,3);assert.equal(result.actions,2);
 assert.equal(JSON.stringify(match),before);
 assert.equal(verifyScoreTrace({winner:'ours'}).state,'unknown');
 assert.equal(projectMatch(null).state,'unavailable');
});
