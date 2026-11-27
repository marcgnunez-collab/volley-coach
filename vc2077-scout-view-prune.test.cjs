'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const core=read('021-core-scouting-v150-monolithic.js');
const html=read('index.html'),sw=read('service-worker.js');
const removed=[
 'window.scoutExportPDF',
 'window.scoutV630OpenDrill',
 'window.scoutV6100OpenPostMatch',
 'window.scoutExportCSV',
 'window.scoutExportCSV',
 'window.scoutRenderPlayerAnalytics',
 'window.scoutExportStatsCSV',
 'window.scoutExportStatsCSV'
];
const marker=name=>'/* V20.7.7 · Unreferenced overwritten view/export implementation retired: '+name+' */';

test('V20.7.7 removes only eight noncaptured replaced view/export functions from the monolith',()=>{
 assert.ok(Buffer.byteLength(core)<=729913,'later report migrations can further reduce the monolith');
 assert.ok(749211-Buffer.byteLength(core)>=19000);
 for(const name of new Set(removed)){
  assert.equal(core.split(marker(name)).length-1,removed.filter(n=>n===name).length,name);
  assert.ok(core.includes(name+'='),'active implementation retained: '+name);
 }
 assert.equal(core.split('V20.7.7 · Unreferenced overwritten view/export implementation retired').length-1,8);
});

test('the legacy PDF implementation captured by V7.5.7 is preserved',()=>{
 assert.ok(core.includes('const scoutV757LegacyPDF=window.scoutExportPDF'));
 assert.ok(core.includes('function v757OfficialHTML(m)'));
 assert.ok(core.includes('function v757ProPages(m)'));
 assert.equal(core.split('window.scoutExportPDF=').length-1,2,'captured and final PDF exports remain');
});

test('native point, undo, lineup and live-action ownership stays in Scouting',()=>{
 for(const [name,count] of [
  ['window.scoutAwardPoint=',9],['window.scoutUndoRally=',6],
  ['window.scoutSaveLineup=',8],['window.scoutAddManualAction=',7],
  ['window.scoutCreateMatch=',3]
 ])assert.equal(core.split(name).length-1,count,name);
 assert.ok(core.includes('const V902_JOURNAL_DB='));
 assert.ok(core.includes('let v20560TypedCheckpoints='));
 assert.ok(core.includes('window.VC_SCOUT_VIDEO_BRIDGE='));
});

test('PWA and classic HTML reference the smaller scouting core with a new cache revision',async()=>{
 assert.match(html,/rel="preload" as="script" href="\.\/021-core-scouting-v150-monolithic\.js\?v=20\.7\.0&amp;rev=20\.7\.\d+"/);
 assert.match(html,/<script id="core-scouting-v150-monolithic" src="\.\/021-core-scouting-v150-monolithic\.js\?v=20\.7\.0&amp;rev=20\.7\.\d+"/);
 assert.match(sw,/scout-view-override-dedup-20\.7\.7/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.ok(audit.retainedCandidates>=37);
});

test('release checks now use a shared, explicit version source for future smaller update packages',()=>{
 const pkg=require('./package.json'),manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(pkg.version,manifest.updatedIn);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.ok(manifest.groups.flatMap(group=>group.files).length>=37);
 assert.ok(pkg.scripts['test:foundation'].includes('vc2077-scout-view-prune.test.cjs'));
 const changedTests=fs.readdirSync(__dirname).filter(n=>/^vc.*\.test\.cjs$/.test(n));
 for(const file of changedTests.filter(name=>name!=='vc2077-scout-view-prune.test.cjs')){
  assert.equal(read(file).includes("assert.equal(pkg.version,'20.7.6')"),false,file);
 }
});
