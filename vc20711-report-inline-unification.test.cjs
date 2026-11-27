'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const html=read('index.html'),sw=read('service-worker.js');
const bundle=read('030-v752-native-pdf-fix.js');
const sources=[
 ['029-v750-professional-reports-module.js','a50a6dbabdb4d81490ef2f08095aca2b9f8e8998f236131ab0c0f4857aefb63e'],
 ['030-v752-native-pdf-fix.js','ada85499365837d916fafc9188cc65b549e96c0be83c63d81413491b4c1f8722'],
 ['v753-pdf-delivery-fix','54005956a5895f9655781a27c47bcb5e692be7290c61b1aa9120ada594fb9b46'],
 ['v754-report-bridge-fix','320fb3da9c29017c7972be6f7877ce6c36c0bbd7202c6d8aac8e3fb6939ccfb8'],
 ['v755-match-selection-fix','f94ce13cdad1dea901930c3710d256295b47e42916e74d0f55210a410cd32a91'],
 ['v756-direct-pdf-route','44c7a9dd875ba05e95fd4a2967b131912e06124bb8e7e01d4e58c03d13f8da3c'],
 ['v757-final-pdf-router','2e0a947bd1e507ae9b974e7df5859c0803144de1a0f10d5323305d8cdc2a88d3']
];
function extract(name){
 const begin=`/* VC20711_SOURCE_BEGIN:${name} */\n`,end=`\n/* VC20711_SOURCE_END:${name} */`;
 const a=bundle.indexOf(begin),b=bundle.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'bundle contains source '+name);
 return bundle.slice(a+begin.length,b);
}

test('all seven original classic report scripts retain their exact bytes and runtime order',()=>{
 let previous=-1;
 for(const [name,hash] of sources){
  const start=bundle.indexOf(`/* VC20711_SOURCE_BEGIN:${name} */`);
  assert.ok(start>previous,'original report module order: '+name);
  previous=start;
  assert.equal(sha(extract(name)),hash,'original content preserved: '+name);
  new vm.Script(extract(name),{filename:name+'.js'});
 }
 new vm.Script(bundle,{filename:'030-v752-native-pdf-fix.js'});
 assert.equal(sha(read('029-v750-professional-reports-module.js')),sources[0][1],'old report script retained without edits');
});

test('HTML no longer embeds five report scripts and requests just one external report bundle',()=>{
 assert.doesNotMatch(html,/<script id="v75[3-7]-(?:pdf-delivery-fix|report-bridge-fix|match-selection-fix|direct-pdf-route|final-pdf-router)"/);
 assert.doesNotMatch(html,/src="\.\/029-v750-professional-reports-module\.js/);
 assert.equal(html.split('id="v752-native-pdf-fix"').length-1,1);
 assert.match(html,/030-v752-native-pdf-fix\.js\?v=16\.0\.2\.1&amp;rev=20\.7\.11/);
 assert.ok(html.includes('id="v753-pdf-delivery-style"'),'report CSS remains intact');
 const video=html.indexOf('id="v740-live-scout-video-module"'),
  style=html.indexOf('id="v753-pdf-delivery-style"'),
  reports=html.indexOf('id="v752-native-pdf-fix"'),
  remote=html.indexOf('id="v760-remote-camera-module"');
 assert.ok(video>0&&style>video&&reports>style&&remote>reports);
});

test('report bundle is precached offline, and old script stays a deletion candidate',async()=>{
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')));
 assert.ok(shell.includes("'./030-v752-native-pdf-fix.js'"));
 assert.doesNotMatch(shell,/029-v750-professional-reports-module/);
 assert.match(sw,/report-router-20\.7\.11/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.retainedCandidates,41);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.deepEqual(manifest.groups.find(g=>g.identifiedIn==='20.7.11').files,['029-v750-professional-reports-module.js']);
 assert.equal(manifest.groups.flatMap(g=>g.files).length,41);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
});

test('new structure cuts HTML source weight and total gzip transfer',()=>{
 assert.ok(Buffer.byteLength(html)<=1771033-32000,'inline report code remains removed despite new release notes');
 const previous=383873+13098+10566;
 const actual=zlib.gzipSync(Buffer.from(html),{level:9}).length+zlib.gzipSync(Buffer.from(bundle),{level:9}).length;
 assert.ok(previous-actual>=2500,'report consolidation should reduce the total compressed payload by at least 2.5KB');
 assert.equal(sources.length-1,6,'six original pieces are now folded into the active report entry');
});

test('release retains one native scorer and report PDF writers with explicit version',()=>{
 const core=read('021-core-scouting-v150-monolithic.js');
 for(const marker of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(core.includes(marker),marker);
 assert.ok(bundle.includes('v757-final-pdf-router'));
 assert.equal(require('./package.json').version,JSON.parse(read('scripts/retained-legacy-assets.json')).updatedIn);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20711-report-inline-unification.test.cjs'));
});
