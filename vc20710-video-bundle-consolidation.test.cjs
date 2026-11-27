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
const oldHashes={
 '024-v702-video-persistence-hotfix.js':'7db51e0814df8f869b55cf2755cb4e97d16552500f7a590f182cfdfe105e1ea6',
 '025-v710-video-analysis-module.js':'514b3311e32b28e6b23dd7c92177eec165b000c719ace32814273b6aadda1ce8',
 '026-v720-clip-studio-module.js':'e3bcdb5da6fc5bdbf21326eef9d650587f0f305d3e9aa780a7cd24e678385a8a',
 '027-v730-live-delay-module.js':'3612d6994d90c875f13a1864e0cf18c1f6322d8d74ff7fa49b77130686df8e05',
 '028-v740-live-scout-video-module.js':'f09cf649e4a2c0d57da0140666d7f8e3625b007be611255c564a7d2c5844133e'
};
const groups={
 '026-v720-clip-studio-module.js':['024-v702-video-persistence-hotfix.js','025-v710-video-analysis-module.js','026-v720-clip-studio-module.js'],
 '028-v740-live-scout-video-module.js':['027-v730-live-delay-module.js','028-v740-live-scout-video-module.js']
};
function extract(bundle,name){
 const start=`/* VC20710_SOURCE_BEGIN:${name} */\n`,end=`\n/* VC20710_SOURCE_END:${name} */`;
 const a=bundle.indexOf(start),b=bundle.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'bundle retains the complete original '+name);
 return bundle.slice(a+start.length,b);
}

test('five unchanged original video module bodies execute in the same order from only two bundles',()=>{
 for(const [target,names] of Object.entries(groups)){
  const bundle=read(target);
  new vm.Script(bundle,{filename:target});
  let pos=-1;
  for(const name of names){
   const marker=`/* VC20710_SOURCE_BEGIN:${name} */`,at=bundle.indexOf(marker);
   assert.ok(at>pos,'video module order maintained: '+name);
   pos=at;
   assert.equal(sha(extract(bundle,name)),oldHashes[name],'original module content is byte-for-byte identical');
   if(name!==target)assert.equal(sha(read(name)),oldHashes[name],'retired source remains unchanged until final cleanup');
  }
 }
});

test('HTML requests only the two combined video modules and preserves the delay policy boundary',()=>{
 assert.doesNotMatch(html,/<script[^>]+src="\.\/0(?:24|25|27)-/);
 assert.match(html,/026-v720-clip-studio-module\.js\?v=16\.0\.2\.1&amp;rev=20\.7\.10/);
 assert.match(html,/028-v740-live-scout-video-module\.js\?v=20\.7\.0&amp;rev=20\.7\.10/);
 const clip=html.indexOf('id="v720-clip-studio-module"'),delay=html.indexOf('id="vc1921-delay-policy"'),
  review=html.indexOf('id="vc1922-review-policy"'),live=html.indexOf('id="v740-live-scout-video-module"'),
  reports=Math.max(html.indexOf('id="v750-professional-reports-module"'),html.indexOf('id="v752-native-pdf-fix"'));
 assert.ok(clip>0&&clip<delay&&delay<review&&review<live&&live<reports);
 assert.ok(html.indexOf('id="v710-video-analysis-style"')<clip);
 assert.ok(html.indexOf('id="v730-live-delay-style"')<live);
 assert.ok(html.indexOf('id="v740-live-scout-video-style"')<live);
});

test('PWA precaches the new video bundles and no longer requires the retired live-delay file',async()=>{
 assert.match(sw,/video-unification-20\.7\.10/);
 const shell=sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL=')));
 assert.ok(shell.includes("'./026-v720-clip-studio-module.js'"));
 assert.ok(shell.includes("'./028-v740-live-scout-video-module.js'"));
 assert.ok(!shell.includes("'./027-v730-live-delay-module.js'"));
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.ok(audit.retainedCandidates>=40,'later report consolidation can add retirement candidates');
});

test('consolidation saves three script requests and at least two kilobytes gzipped',()=>{
 const earlier=Object.keys(oldHashes).reduce((sum,name)=>sum+zlib.gzipSync(Buffer.from(extract(read(name==='024-v702-video-persistence-hotfix.js'||name==='025-v710-video-analysis-module.js'?'026-v720-clip-studio-module.js':name==='027-v730-live-delay-module.js'?'028-v740-live-scout-video-module.js':name),name)),{level:9}).length,0);
 const now=Object.keys(groups).reduce((sum,name)=>sum+zlib.gzipSync(Buffer.from(read(name)),{level:9}).length,0);
 assert.ok(earlier-now>=2000,'fewer active assets should also save transfer bytes');
 assert.equal(Object.values(groups).reduce((n,x)=>n+x.length,0)-Object.keys(groups).length,3);
});

test('three replaced filenames remain retained, without removing native video or scouting writers',()=>{
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 const group=manifest.groups.find(g=>g.identifiedIn==='20.7.10');
 assert.deepEqual(group.files,['024-v702-video-persistence-hotfix.js','025-v710-video-analysis-module.js','027-v730-live-delay-module.js']);
 assert.ok(manifest.groups.flatMap(g=>g.files).length>=40);
 assert.equal(require('./package.json').version,manifest.updatedIn);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20710-video-bundle-consolidation.test.cjs'));
 const scouting=read('021-core-scouting-v150-monolithic.js');
 for(const key of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(scouting.includes(key),key);
});
