'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const ts=require('typescript');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const html=read('index.html'),sw=read('service-worker.js');
const groups={
 '102-vc1601-analysis-performance.js':[
 ['100-vc159-stats-video-runtime.js','4f7f1bd483d98c41e049abc52a796d4dd554c0e531c9d23df23d0b9d4205061d'],
 ['101-vc160-video-health-module.js','b0fc45836bf3e3b16305110829fa0d5e457ab1e08b1215a8db88d8a6bfb28c5b'],
 ['102-vc1601-analysis-performance.js','6dd886a125ed7e8535e185d563e1030470eecde9d3823b535cef899502784c27']
 ],
 '147-vc1730-analysis-workspace.js':[
 ['148-vc1750-ui-scheduler.js','41616dc84e0935d7d7a05a8cdb54ce7f825170178f37559b81a87e12b4541aa0'],
 ['170-vc1900-unified-workflow.js','6b99df0bd26d5cb131ed03293f78298c091af552b50aa776b51fce0d8ae31fd8'],
 ['143-vc1700-professional-workspace.js','7a7a03bf54b08207cd9fdc603345154281baf052ec190a9f33643b04b6a8ccd9'],
 ['144-vc1703-functional-audit.js','9723661cd601c93b051971811359b76a84e5cf6ced10c7c7ce3c2a3f2a43eaf6'],
 ['145-vc1710-training-workspace.js','f3823aa8d837a18ab2bae343bb6223ae10971691a1e4f47fce54a48b0adf0e7f'],
 ['146-vc1720-match-workspace.js','060523706eab64d2d90491876e4b3d0445c3ab3070b9846ec336c7bb17333621'],
 ['147-vc1730-analysis-workspace.js','db7ca1c7b9ae918ee3e2c5e70b607b6c0acc78c8a20754d4e595bc76f8a64641']
 ]};
function section(bundle,name){
 const begin='/* VC20716_SOURCE_BEGIN:'+name+' */\n';
 const end='\n/* VC20716_SOURCE_END:'+name+' */';
 const a=bundle.indexOf(begin),b=bundle.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'source segment '+name);
 return bundle.slice(a+begin.length,b);
}

test('ten original UI scripts are byte-identical and keep their original execution order',()=>{
 let count=0;
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);new vm.Script(bundle,{filename:target});
  let last=-1;
  for(const [name,hash] of names){
   const at=bundle.indexOf('/* VC20716_SOURCE_BEGIN:'+name+' */');
   assert.ok(at>last,'ordered script '+name);
   last=at;
   const source=section(bundle,name);
   assert.equal(sha(source),hash,'frozen SHA-256 '+name);
   if(name!==target)assert.equal(sha(read(name)),hash,'old source preserved '+name);
   const ast=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
   assert.equal(ast.parseDiagnostics.length,0,name+' syntax');
   assert.equal(ast.statements.length,1,name+' isolated IIFE');
   assert.equal(ast.statements[0].kind,ts.SyntaxKind.ExpressionStatement,name+' no global declarations');
   assert.doesNotMatch(source,/document\.currentScript/,'not coupled to script identity');
   count++;
  }
 }
 assert.equal(count,10);
});

test('HTML requests exactly two bundles and preserves synchronous versus defer execution',()=>{
 assert.equal(html.split('id="vc1601-analysis-performance"').length-1,1);
 assert.equal(html.split('id="vc1730-analysis-workspace"').length-1,1);
 assert.match(html,/102-vc1601-analysis-performance\.js\?v=16\.0\.2\.1&amp;rev=20\.7\.16" data-vc-module/);
 assert.match(html,/147-vc1730-analysis-workspace\.js\?v=19\.1\.3&amp;rev=20\.7\.16" defer data-vc-module/);
 const first=html.indexOf('id="vc1601-analysis-performance"'),second=html.indexOf('id="vc1730-analysis-workspace"');
 assert.ok(first>0&&second>first);
 assert.ok(html.indexOf('id="vc16022-performance-loader"')>first);
 const old=['vc159-stats-video-runtime','vc160-video-health-module','vc1750-ui-scheduler','vc1900-unified-workflow','vc1700-professional-workspace','vc1703-functional-audit','vc1710-training-workspace','vc1720-match-workspace'];
 for(const id of old)assert.ok(!html.includes('<script id="'+id+'"'),'retired request '+id);
 assert.equal(old.length,8);
});

test('source-preserving bundles save more than 6KB gzip and eight requests',()=>{
 let before=0,after=0;
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);
  for(const [name] of names)before+=zlib.gzipSync(Buffer.from(section(bundle,name)),{level:9}).length;
  after+=zlib.gzipSync(Buffer.from(bundle),{level:9}).length;
 }
 assert.ok(before-after>6000,'compressed JS transfer drops at least 6KB');
 assert.equal(Object.values(groups).flat().length-Object.keys(groups).length,8);
});

test('new offline entries and 67 retirement candidates remain audited',async()=>{
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')));
 for(const f of Object.keys(groups))assert.ok(shell.includes("'./"+f+"'"),'active bundle offline '+f);
 for(const f of ['170-vc1900-unified-workflow.js','143-vc1700-professional-workspace.js','146-vc1720-match-workspace.js'])assert.ok(!shell.includes(f),'old path removed '+f);
 assert.match(sw,/(?:workspace-core-bundles-20\.7\.16|dashboard-analysis-bundles-20\.7\.17)/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const result=auditRuntimeAssets(__dirname);
 assert.deepEqual(result.errors,[]);
 assert.ok(result.retainedCandidates>=67,'newer releases may add candidates');
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 const names=manifest.groups.find(x=>x.identifiedIn==='20.7.16')?.files;
 assert.deepEqual(names,Object.values(groups).flat().map(row=>row[0]).filter(name=>!Object.keys(groups).includes(name)));
 assert.ok(manifest.groups.flatMap(x=>x.files).length>=67);
 assert.equal(manifest.updatedIn,require('./package.json').version);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
});

test('native scoring and existing analysis queries remain untouched',()=>{
 const core=read('021-core-scouting-v150-monolithic.js');
 for(const marker of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(core.includes(marker),marker);
 assert.equal(sha(core),'fdef436c36dd70322e25359925712df6221993bcbebe9b98dd0a2df8fbaec2bf');
 assert.equal(sha(read('011-v5115-pdf-rosters-script.js')),'c5a173e6621dd946b419639534cbeb0d661604483732420d62479fa2b3c7331b');
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20716-ui-bundle-consolidation.test.cjs'));
});
