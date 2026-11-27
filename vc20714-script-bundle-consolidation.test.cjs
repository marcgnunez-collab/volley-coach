'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const ts=require('typescript');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const html=read('index.html'),sw=read('service-worker.js');
const groups={
 '132-vc1642-video-studio-pro.js':[
 ['118-vc1611-video-sync-assistant.js','d1e10e6962582e2d27d60f24f648701abda633d802c1eab6c06d6fc36be7a069'],
 ['119-vc1612-video-analytics.js','d9b111fcea693be4e021414104cdf49aaccbadc4193a0a1af559383b048816fe'],
 ['120-vc1613-zone-board.js','31008a5c8c5b3f980b8140a7efe8efb391ae8726261a77057790d5cbbc841e3e'],
 ['130-vc1640-scouting-pro-cockpit.js','659a4efa5928e9221d941e17eda4629e9d3921f23a8fb43767e9e378e8f1958c'],
 ['131-vc1641-code-assistant.js','186e2450a73e3beb7dccbbca280bbb104ee5f1db2035b0de10bc38b5ee38a313'],
 ['121-vc16131-clip-studio-pro.js','a653193ddb69a4a3cae12fdfa92f34c82761f9edea4a4d704d1a2b0b0a072194'],
 ['132-vc1642-video-studio-pro.js','0a35845f61b0f824ee30d1533989b349588548e74792c02aee652962c633b0e4']
 ],
 '168-vc1881-setter-pro.js':[
 ['135-vc1650-custom-worksheets.js','97efbf82cf1048d24a20e27d83b3bfba71735e5624535d147c1e6f450b68bf98'],
 ['136-vc1651-tactical-laboratory.js','ccb3c82d48e590ba802b5c0c3252a74fb37039dc47a29f2fef1582785934d828'],
 ['167-vc1880-analysis-pro.js','a1b971f2799b785efcb67908ed773d2df3e425b16e0f4542373d9f3771d975b3'],
 ['168-vc1881-setter-pro.js','1b7f6434cc42a13721bb3276dd155fb9847acb0714a926eb20458177663ca0b4']
 ]};
function extract(bundle,name){
 const begin='/* VC20714_SOURCE_BEGIN:'+name+' */\n',end='\n/* VC20714_SOURCE_END:'+name+' */';
 const from=bundle.indexOf(begin),to=bundle.indexOf(end,from+begin.length);
 assert.ok(from>=0&&to>from,'preserved source marker '+name);
 return bundle.slice(from+begin.length,to);
}

test('two bundles preserve every original statement byte-for-byte and in runtime order',()=>{
 let total=0;
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);new vm.Script(bundle,{filename:target});
  let previous=-1;
  for(const [name,hash] of names){
   const start=bundle.indexOf('/* VC20714_SOURCE_BEGIN:'+name+' */');
   assert.ok(start>previous,'source order '+name);
   previous=start;
   const original=extract(bundle,name);
   assert.equal(sha(original),hash,'same SHA-256 '+name);
   if(name!==target)assert.equal(sha(read(name)),hash,'retained original file '+name);
   const parsed=ts.createSourceFile(name,original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
   assert.equal(parsed.parseDiagnostics.length,0,'valid source '+name);
   assert.equal(parsed.statements.length,1,'independent IIFE with no global declarations '+name);
   assert.equal(parsed.statements[0].kind,ts.SyntaxKind.ExpressionStatement);
   assert.doesNotMatch(original,/document\.currentScript/,'no script ID or source-file coupling');
   total++;
  }
 }
 assert.equal(total,11);
});

test('HTML requests only two consolidated scripts with the same sync/defer semantics',()=>{
 const normal='id="vc1642-video-studio-pro"',delayed='id="vc1881-setter-pro"';
 assert.equal(html.split(normal).length-1,1);
 assert.equal(html.split(delayed).length-1,1);
 assert.match(html,/132-vc1642-video-studio-pro\.js\?v=18\.4\.5&amp;rev=20\.7\.14/);
 assert.match(html,/168-vc1881-setter-pro\.js\?v=18\.9\.1&amp;rev=20\.7\.14" defer/);
 const normalAt=html.indexOf(normal),deferAt=html.indexOf(delayed),videoAfter=html.indexOf('id="vc1643-training-pro"');
 assert.ok(normalAt>0&&videoAfter>normalAt&&deferAt>videoAfter);
 assert.ok(html.indexOf('id="vc1890-rotation-matchup-pro"')>deferAt);
 const removed=['vc1611-video-sync-assistant','vc1612-video-analytics','vc1613-zone-board','vc1640-scouting-pro-cockpit','vc1641-code-assistant','vc16131-clip-studio-pro','vc1650-custom-worksheets','vc1651-tactical-laboratory','vc1880-analysis-pro'];
 for(const id of removed)assert.ok(!html.includes('<script id="'+id+'"'),'no retired request: '+id);
 assert.equal(removed.length,9,'nine requests removed');
});

test('combined gzip transfer falls by more than 9KB',()=>{
 let before=0,after=0;
 for(const [target,names] of Object.entries(groups)){
  before+=names.reduce((sum,[name])=>sum+zlib.gzipSync(Buffer.from(name===target?extract(read(target),name):read(name)),{level:9}).length,0);
  after+=zlib.gzipSync(Buffer.from(read(target)),{level:9}).length;
 }
 assert.ok(before-after>9000,'consolidated transfer must be at least 9KB lighter');
 assert.equal(Object.values(groups).flat().length-Object.keys(groups).length,9);
});

test('Service Worker precaches both bundles and excludes replaced script requests',async()=>{
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')));
 assert.ok(shell.includes("'./132-vc1642-video-studio-pro.js'"));
 assert.ok(shell.includes("'./168-vc1881-setter-pro.js'"));
 for(const name of ['121-vc16131-clip-studio-pro.js','136-vc1651-tactical-laboratory.js','167-vc1880-analysis-pro.js'])assert.ok(!shell.includes(name),name+' no longer precached');
 assert.match(sw,/video-analysis-bundles-20\.7\.14/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.retainedCandidates,50);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(manifest.updatedIn,'20.7.14');
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.deepEqual(manifest.groups.find(g=>g.identifiedIn==='20.7.14').files,Object.values(groups).flat().map(x=>x[0]).filter(x=>!Object.keys(groups).includes(x)));
 assert.equal(manifest.groups.flatMap(g=>g.files).length,50);
});

test('native scoring, offline journal and existing read-only scouting bundles remain unchanged',()=>{
 assert.equal(sha(read('021-core-scouting-v150-monolithic.js')),'fdef436c36dd70322e25359925712df6221993bcbebe9b98dd0a2df8fbaec2bf');
 assert.equal(sha(read('011-v5115-pdf-rosters-script.js')),'c5a173e6621dd946b419639534cbeb0d661604483732420d62479fa2b3c7331b');
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20714-script-bundle-consolidation.test.cjs'));
});
