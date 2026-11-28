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
 '138-vc1655-tactical-video.js':[
 ['140-vc1657-professional-reports.js','de5698ab7c0be7efc47cb2e5e7d1e5e99c954c03a3779e2d8f3d247c2d4d2fe1'],
 ['139-vc1656-comparisons.js','04d8e5cdc2720c566e9921dc994c3df64cb5bd49ff569a1fe3aabf7b720e7629'],
 ['138-vc1655-tactical-video.js','0f2bff06608fe3468786a6639db19a08105faec3f3b84fa0fe1b685499367b51']
 ],
 '162-vc1830-video-workspaces.js':[
 ['155-vc17100-unified-video.js','cbf540b93e60db2ce865a98d50a6f2aebc03619c81fe88c1809999ba40c6e329'],
 ['156-vc17110-training-video-pro.js','2f7d9dce8ffb98db83a0f088d19160c4f724ccd0e68cd45458d321ea7cff1079'],
 ['157-vc17120-match-recording-pro.js','5652960f2fc18d9afe0bb4bd8669eea822f20dd8dba40d3cf4ece124eeb56d46'],
 ['158-vc17121-install-health.js','8cbaa1bbd94c6f340114340c80298ad5dc4417a25b37899357fbacde3a4839f7'],
 ['159-vc1800-cross-video-evidence.js','a93c71078a22191f974fbf4a633e6b609b5dba09458b0b2d24daf949b7432c8a'],
 ['160-vc1810-video-studio-layout.js','8d086cba172ed27f35f85693fb784dedf8ca3e8fbb3eb91fbc671b00c69af181'],
 ['161-vc1820-video-reliability.js','4c5208059fb9fc02aa21a0f355d5534a6bec9665ecf58674bd6972479e281bc6'],
 ['162-vc1830-video-workspaces.js','9c468a2e39646bf15b84539b4354c11ad805b6d9471e33631b06f3075945d342']
 ]};
function original(bundle,name){
 const start='/* VC20715_SOURCE_BEGIN:'+name+' */\n';
 const end='\n/* VC20715_SOURCE_END:'+name+' */';
 const a=bundle.indexOf(start),b=bundle.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'bundle contains complete '+name);
 return bundle.slice(a+start.length,b);
}

test('all 11 deferred scripts preserve their exact original bytes and relative order',()=>{
 let n=0;
 for(const [target,files] of Object.entries(groups)){
  const bundled=read(target);
  new vm.Script(bundled,{filename:target});
  let last=-1;
  for(const [name,hash] of files){
   const start=bundled.indexOf('/* VC20715_SOURCE_BEGIN:'+name+' */');
   assert.ok(start>last,'original execution order '+name);
   last=start;
   const code=original(bundled,name);
   assert.equal(sha(code),hash,'SHA-256 from V20.7.14: '+name);
   if(name!==target)assert.equal(sha(read(name)),hash,'old script retained without edits: '+name);
   const ast=ts.createSourceFile(name,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
   assert.equal(ast.parseDiagnostics.length,0,'valid syntax: '+name);
   assert.equal(ast.statements.length,1,'independent isolated IIFE: '+name);
   assert.equal(ast.statements[0].kind,ts.SyntaxKind.ExpressionStatement);
   assert.doesNotMatch(code,/document\.currentScript/,'bundle does not change script identity semantics');
   n++;
  }
 }
 assert.equal(n,11);
});

test('HTML replaces 11 deferred requests with only two deferred bundles',()=>{
 const first=html.indexOf('id="vc1655-tactical-video"'),last=html.indexOf('id="vc1830-video-workspaces"');
 assert.ok(first>0&&last>first,'maintains group positions');
 assert.match(html,/138-vc1655-tactical-video\.js\?v=16\.5\.5&amp;rev=20\.7\.15" defer/);
 assert.match(html,/162-vc1830-video-workspaces\.js\?v=18\.4\.3&amp;rev=20\.7\.15" defer/);
 assert.equal(html.split('id="vc1655-tactical-video"').length-1,1);
 assert.equal(html.split('id="vc1830-video-workspaces"').length-1,1);
 assert.ok(html.indexOf('id="vc16158-reliability-loader"')>first);
 assert.ok(html.indexOf('id="vc16158-reliability-loader"')<last);
 const retired=['vc1657-reports','vc1656-comparisons','vc17100-unified-video','vc17110-training-video-pro','vc17120-match-recording-pro','vc17121-install-health','vc1800-video-evidence','vc1810-video-studio-layout','vc1820-video-reliability'];
 for(const id of retired)assert.ok(!html.includes('<script id="'+id+'"'),'old request removed '+id);
 assert.equal(retired.length,9);
});

test('consolidation cuts more than 9.5KB gzip in unchanged JS implementations',()=>{
 let before=0,after=0;
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);
  for(const [name] of names)before+=zlib.gzipSync(Buffer.from(original(bundle,name)),{level:9}).length;
  after+=zlib.gzipSync(Buffer.from(bundle),{level:9}).length;
 }
 assert.ok(before-after>9500,'fewer gzip bytes without semantic minification');
 assert.equal(Object.values(groups).flat().length-Object.keys(groups).length,9);
});

test('offline cache and deferred-retirement inventory track only active bundles',async()=>{
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')));
 for(const target of Object.keys(groups))assert.ok(shell.includes("'./"+target+"'"),'active bundled script precached '+target);
 const oldCache=['155-vc17100-unified-video.js','157-vc17120-match-recording-pro.js','158-vc17121-install-health.js','159-vc1800-cross-video-evidence.js','160-vc1810-video-studio-layout.js','161-vc1820-video-reliability.js','140-vc1657-professional-reports.js','139-vc1656-comparisons.js'];
 for(const name of oldCache)assert.ok(!shell.includes(name),'retired script removed from cache '+name);
 assert.match(sw,/deferred-video-analytics-20\.7\.15/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.retainedCandidates,59);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 const retained=manifest.groups.find(g=>g.identifiedIn==='20.7.15');
 assert.ok(retained);
 assert.deepEqual(retained.files,Object.values(groups).flat().map(x=>x[0]).filter(x=>!Object.keys(groups).includes(x)));
 assert.equal(manifest.groups.flatMap(g=>g.files).length,59);
 assert.equal(manifest.updatedIn,require('./package.json').version);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
});

test('scoring, IDB, cloud writers and prior video bundle remain unchanged',()=>{
 const core=read('021-core-scouting-v150-monolithic.js');
 for(const marker of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(core.includes(marker),marker);
 assert.equal(sha(core),'fdef436c36dd70322e25359925712df6221993bcbebe9b98dd0a2df8fbaec2bf');
 assert.equal(sha(read('011-v5115-pdf-rosters-script.js')),'c5a173e6621dd946b419639534cbeb0d661604483732420d62479fa2b3c7331b');
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20715-deferred-bundle-consolidation.test.cjs'));
});
