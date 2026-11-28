'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const ts=require('typescript');
const {gzipSync}=require('node:zlib');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const groups={
  "153-vc1780-cross-analysis.js": [
    "149-vc1751-video-production-workspace.js",
    "150-vc1752-scouting-fast-flow.js",
    "152-vc1770-video-pro.js",
    "153-vc1780-cross-analysis.js"
  ],
  "166-vc1860-training-planner.js": [
    "163-vc1845-video-polish.js",
    "164-vc1850-home-dashboard.js",
    "165-vc1851-match-center-pro.js",
    "166-vc1860-training-planner.js"
  ],
  "193-vc19312-video-scoreboard.js": [
    "184-vc1933-analysis-engine.js",
    "185-vc1934-setter-attack-intelligence.js",
    "186-vc1935-analysis-workspace.js",
    "187-vc1936-analysis-three-pane.js",
    "183-vc1930-tactical-rival-desk.js",
    "189-vc1938-professional-data-engine.js",
    "190-vc1939-rally-search-pro.js",
    "188-vc1937-analysis-main-rebuild.js",
    "192-vc19311-professional-analysis-screens.js",
    "193-vc19312-video-scoreboard.js"
  ]
};
const hashes={
  "149-vc1751-video-production-workspace.js": "d1fe3b8fbe81ca6ec5035f92a90d2bc1036e0ccba940a2af35320ae2e4d21411",
  "150-vc1752-scouting-fast-flow.js": "fdadb52009c108d9f7af26c293a7a6e330346931f1fd18598fc0eb6c0baf96d1",
  "152-vc1770-video-pro.js": "c5f8d8e814538443bc0ef59ff5c0d02b0e029d8a793653034e724b92cabdc6e6",
  "153-vc1780-cross-analysis.js": "a21f153c1ad5fb93cd455aee5d38e4d63c722547200b33f369fa55dd6eb7484c",
  "163-vc1845-video-polish.js": "41bcf5fd164ca37db29fbf2fb004bc79e93934a0ffdffacdd94a4b1f9aad6058",
  "164-vc1850-home-dashboard.js": "b378109942041870320bc91013fd3e2832f496deb46a52318a70cd94d99eeb53",
  "165-vc1851-match-center-pro.js": "ca6dddf35b5ee433597abd6746f50a9b825921ef240e20dfaf1b60711e6c1248",
  "166-vc1860-training-planner.js": "22a2529d640587b2517b4eb6789b38edf7de7f8b90e49e7e9ed7544cd9bd0026",
  "184-vc1933-analysis-engine.js": "de18de445cd2367eb9e388c227c700b498e0cb975c4f75be5a75554089daa08a",
  "185-vc1934-setter-attack-intelligence.js": "00e856c59cdc9273316d18f03e82034f63ec478447f48fc161e200780a893e11",
  "186-vc1935-analysis-workspace.js": "835273380903666389c5bc1546d29435ca91ae8513c8896dc7c174cfb04e8f43",
  "187-vc1936-analysis-three-pane.js": "08135e3ec7c839521a8d48fd17abc42bdee3795d4e2a27f1e72c5bed51c4d1cf",
  "183-vc1930-tactical-rival-desk.js": "51bb323e135b6abfd0626f2b1306787e117d66117154f2b05ba28e364e7e4e15",
  "189-vc1938-professional-data-engine.js": "e7817c935df3e86e11697dde2b722196bc61e2021f7cf4ea6f855eb39b90aa08",
  "190-vc1939-rally-search-pro.js": "b8d3166d14e46b857d7013a163132b399b951c3a0fc2e357a693fafa9c934ced",
  "188-vc1937-analysis-main-rebuild.js": "92835f84154d1292bde1fef175e98d305df44028e650140b3a77716f9c6eb060",
  "192-vc19311-professional-analysis-screens.js": "7232d4b27f69ebe9c3430a19d2114bc45e2201558bf706974b78367501018674",
  "193-vc19312-video-scoreboard.js": "0b7fefdc86f07a8dbe293b1a1377047568052b603dcefc10e9a01d3c4f46abeb"
};
const html=read('index.html'),sw=read('service-worker.js');
const targets=Object.keys(groups);
const originalNames=Object.values(groups).flat();
const retired=originalNames.filter(name=>!targets.includes(name));
function segment(bundle,name){
 const begin='/* VC20717_SOURCE_BEGIN:'+name+' */\n';
 const end='\n/* VC20717_SOURCE_END:'+name+' */';
 const first=bundle.indexOf(begin),last=bundle.indexOf(end,first+begin.length);
 assert.ok(first>=0&&last>first,'missing source segment: '+name);
 return bundle.slice(first+begin.length,last);
}
test('18 original independent scripts preserve exact bytes, checksums and deferred order',()=>{
 assert.equal(originalNames.length,18);
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);
  new vm.Script(bundle,{filename:target});
  let previous=-1;
  for(const name of names){
   const index=bundle.indexOf('/* VC20717_SOURCE_BEGIN:'+name+' */');
   assert.ok(index>previous,'relative execution order: '+name);
   previous=index;
   const source=segment(bundle,name);
   assert.equal(sha(source),hashes[name],'frozen source checksum: '+name);
   if(name!==target)assert.equal(sha(read(name)),hashes[name],'unmodified historical file: '+name);
   assert.doesNotMatch(source,/document\.currentScript/);
   const tree=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
   assert.equal(tree.parseDiagnostics.length,0,name+' valid JavaScript');
   assert.equal(tree.statements.length,1,name+' single isolated expression');
   assert.equal(tree.statements[0].kind,ts.SyntaxKind.ExpressionStatement,name+' IIFE');
  }
 }
});
test('HTML has only three deferred bundles in their former positions, 15 fewer requests',()=>{
 const external=[...html.matchAll(/<script\b[^>]*\bsrc="\.\/([^"]+)"[^>]*><\/script>/g)];
 let last=-1;
 for(const target of targets){
  const found=external.filter(m=>m[1].split('?')[0]===target);
  assert.equal(found.length,1,target+' loaded exactly once');
  assert.match(found[0][0],/\bdefer\b/);
  assert.match(found[0][0],/rev=20\.7\.17/);
  const at=html.indexOf(found[0][0]);assert.ok(at>last,'bundle order '+target);last=at;
 }
 for(const candidate of retired)assert.ok(!external.some(m=>m[1].split('?')[0]===candidate),'old script not active: '+candidate);
 assert.equal(retired.length,15);
});
test('deferring only three bundles saves at least 12KB of script gzip payload',()=>{
 let before=0,after=0;
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);
  before+=names.reduce((sum,name)=>sum+gzipSync(Buffer.from(segment(bundle,name))).length,0);
  after+=gzipSync(Buffer.from(bundle)).length;
 }
 assert.ok(before-after>12000,'gzip saved: '+(before-after)+' bytes');
});
test('service worker and retirement inventory exclusively use the three active bundles',async()=>{
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')))+
             sw.slice(sw.indexOf('SHELL.push('),sw.indexOf(';',sw.indexOf('SHELL.push(')));
 for(const name of targets)assert.ok(shell.includes("'./"+name+"'"),'precached target '+name);
 for(const name of retired)assert.ok(!shell.includes("'./"+name+"'"),'old cached path removed '+name);
 assert.match(sw,/dashboard-analysis-bundles-20\.7\.17/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const result=auditRuntimeAssets(__dirname);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.retainedCandidates,82);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(manifest.updatedIn,require('./package.json').version);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.deepEqual(manifest.groups.find(g=>g.identifiedIn==='20.7.17')?.files,retired);
});
test('point, undo, local journal, native cloud writers and PDF bridge remain unchanged',()=>{
 const core=read('021-core-scouting-v150-monolithic.js');
 assert.equal(sha(core),'fdef436c36dd70322e25359925712df6221993bcbebe9b98dd0a2df8fbaec2bf');
 assert.equal(sha(read('011-v5115-pdf-rosters-script.js')),'c5a173e6621dd946b419639534cbeb0d661604483732420d62479fa2b3c7331b');
 for(const marker of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(core.includes(marker),marker);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20717-dashboard-analysis-consolidation.test.cjs'));
});
