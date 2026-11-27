'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const zlib=require('node:zlib');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const scripts=[
 ['202-vc193191-data-contract.js','c9bde99baae951295259d32261e08e0075e4f0393265c5cdb293c26033d9022c'],
 ['203-vc193191-unified-workspace.js','4c0800d2e5174f0416c4fc75acc813d1d229adebd2c4f2e898a8bb1b6e4d92cc'],
 ['204-vc193192-domain-adapters.js','8049ea54896d715873a6948f54bf69cd98b1eeef5b1da4da865baefd487e3d74'],
 ['205-vc193192-club-desk.js','09cc71b4a84b059bb0564e9757f147a870f940b6a6ae0ebb5c291bc2bbee3e45']
];
const styles=[
 ['vc193191-professional-workspace.css','fb02ff986ec110d85de28d7373e87c718c3c58fe04a7e416baf4a6a3bf3551ca'],
 ['vc193192-professional-club.css','b08247a01daf6883d383c8f4519ce6f75777f43908dd772d22d0bb5b3741a43d']
];
const scriptName='vc2074-club-workspace-unified.js';
const styleName='vc2074-club-workspace-unified.css';
const js=read(scriptName),css=read(styleName);
function extract(bundle,name){
 const start=`/* VC2074_SOURCE_BEGIN:${name} */\n`,end=`\n/* VC2074_SOURCE_END:${name} */`;
 const at=bundle.indexOf(start);assert.notEqual(at,-1,`${name}: start`);
 const stop=bundle.indexOf(end,at+start.length);assert.notEqual(stop,-1,`${name}: end`);
 return bundle.slice(at+start.length,stop)+'\n';
}
function verifySources(bundle,entries){
 let previous=-1,oldGzip=0;
 for(const [name,hash] of entries){
  const at=bundle.indexOf(`/* VC2074_SOURCE_BEGIN:${name} */`);
  assert.ok(at>previous,`${name} maintains original order`);previous=at;
  const source=extract(bundle,name);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),hash);
  assert.equal(source,read(name),'the original file remains byte-identical for rollback');
  oldGzip+=zlib.gzipSync(source).length;
 }
 assert.ok(zlib.gzipSync(bundle).length<oldGzip,'bundled gzip transfer is smaller');
}
function runBrowser(code){
 const events=[];
 const doc={readyState:'loading',getElementById:()=>null,addEventListener:(event)=>events.push(event)};
 const win={document:doc,addEventListener:event=>events.push(`window:${event}`)};
 vm.runInNewContext(code,{window:win,console},{timeout:1500});
 return {win,events};
}

test('V20.7.4 preserves all four original JavaScript sources, IIFEs and compressed efficiency',()=>{
 verifySources(js,scripts);
 new vm.Script(js);
});

test('V20.7.4 preserves the two original CSS texts and their cascade order',()=>{
 verifySources(css,styles);
 for(const name of styles.map(([name])=>name))assert.ok(!/@import\s+|@charset\s+/i.test(read(name)),name);
});

test('V20.7.4 browser globals and handlers match the four separate scripts',()=>{
 const bundled=runBrowser(js);
 const separated=runBrowser(scripts.map(([name])=>read(name)).join('\n;\n'));
 const globals=['VC193191_DATA_CONTRACT','VC193191_WORKSPACE','VC193192_DOMAINS','VC193192_CLUB_DESK'];
 assert.deepEqual(bundled.events,separated.events,'same DOM registration and order');
 for(const global of globals){
  assert.ok(bundled.win[global],global);
  assert.deepEqual(Object.keys(bundled.win[global]).sort(),Object.keys(separated.win[global]).sort());
  for(const [field,oldValue] of Object.entries(separated.win[global])){
   const nextValue=bundled.win[global][field];
   if(typeof oldValue==='function')assert.equal(nextValue.toString(),oldValue.toString(),`${global}.${field}`);
   else assert.equal(JSON.stringify(nextValue),JSON.stringify(oldValue),`${global}.${field}`);
  }
 }
});

test('V20.7.4 loads only two bundles instead of six original files',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 const links=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\.\/([^"?]+)/g)].map(m=>m[1]);
 const scriptRefs=[...html.matchAll(/<script\b[^>]*src="\.\/([^"?]+)/g)].map(m=>m[1]);
 assert.equal(links.filter(x=>x===styleName).length,1);
 assert.equal(scriptRefs.filter(x=>x===scriptName).length,1);
 assert.ok(html.includes(`${styleName}?v=20.7.4`));
 assert.ok(html.includes(`${scriptName}?v=20.7.4`));
 for(const [file] of [...scripts,...styles]){
  assert.ok(fs.existsSync(path.join(__dirname,file)),`${file} stays for final cleanup`);
  assert.ok(!links.includes(file)&&!scriptRefs.includes(file),`${file} is no longer loaded`);
  assert.ok(!sw.includes(`'./${file}'`),`${file} is no longer precached`);
 }
 assert.ok(sw.includes(`'./${scriptName}'`)&&sw.includes(`'./${styleName}'`));
 assert.match(sw,/club-workspace-20\.7\.4/);
});

test('V20.7.4 adds six deferred-retirement candidates, but instructs no deletions',async()=>{
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 const all=manifest.groups.flatMap(group=>group.files);
 assert.equal(all.length,32);assert.equal(new Set(all).size,32);
 assert.deepEqual(manifest.groups.at(-1).files,[...scripts,...styles].map(([n])=>n));
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const result=auditRuntimeAssets(__dirname);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.retainedCandidates,32);
 assert.ok(result.retainedPresent>=9&&result.retainedPresent<=32);
 const guide=read('GUIA_V20.7.4_CLUB_WORKSPACE.md');
 assert.ok(guide.includes('No borres ningún archivo'));
 assert.ok(read('MIGRACION_PENDIENTES_DE_BORRADO_V20.7.4.md').includes('32 candidatos'));
 assert.equal(require('./package.json').version,'20.7.4');
});
