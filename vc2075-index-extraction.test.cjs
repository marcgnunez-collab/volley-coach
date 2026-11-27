'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const html=read('index.html'),sw=read('service-worker.js');
const styleFile='vc2075-video-styles-extracted.css';
const styleSource=read(styleFile);
const specs=[
 {bundle:'vc2075-analysis-ui-unified.js',sources:[
  ['206-vc193195-professional-tactical-tables.js','03030767a1db0dfecf0a6c15ffc757b2dc04931ec097fb66494a7281bfee251e'],
  ['191-vc19310-professional-analysis-architecture.js','46041cca4cfdb04788fb5b6144da80c75cc38774948b4ab71b8b8ee78fe4db2a']
 ]},
 {bundle:'vc2075-review-tools-unified.js',sources:[
  ['199-vc19317-video-montage-pro.js','44511594943bcd5e7742b62db50ac61926c0918d55ffc6a4a734c8f2f1e5c8f8'],
  ['200-vc19318-worksheets-reports-pro.js','d7d40418ad1e3567678ee5f38c780fb338832adbfa7ef30306186771d0f6a1ec'],
  ['201-vc19319-bench-client-pro.js','323a3d2f9665b2d0c40705fbdb1a6f7442626b80db561065042b0778a308a003']
 ]}
];
function original(code,name){
 const begin=`/* VC2075_SOURCE_BEGIN:${name} */\n`,end=`\n/* VC2075_SOURCE_END:${name} */`;
 const from=code.indexOf(begin);assert.notEqual(from,-1,`${name}: begin`);
 const to=code.indexOf(end,from+begin.length);assert.notEqual(to,-1,`${name}: end`);
 return code.slice(from+begin.length,to)+'\n';
}
function browserRun(code){
 const registered=[];
 const document={readyState:'loading',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:event=>registered.push(event)};
 const win={document,addEventListener:event=>registered.push(`window:${event}`)};
 vm.runInNewContext(code,{window:win,document,console,URL,setTimeout:()=>0},{timeout:2000});
 return {win,registered};
}

test('V20.7.5 moves the exact 69,201-byte video stylesheet out of index.html',()=>{
 assert.equal(Buffer.byteLength(styleSource),69201);
 assert.equal(crypto.createHash('sha256').update(styleSource).digest('hex'),'d815093912c7aa343cd8906ae4b02db5b8131e129c76b78a9cd92de8d6f204d7');
 assert.ok(!html.includes('<style id="vc1843-embedded-video-styles"'));
 assert.match(html,/<link id="vc1843-embedded-video-styles" rel="stylesheet" href="\.\/vc2075-video-styles-extracted\.css\?v=20\.7\.5" data-vc-ui="V18\.4\.3">/);
 assert.ok(Buffer.byteLength(html)<1780000,'HTML is at least 57 KB smaller than V20.7.4');
 assert.ok(sw.includes(`'./${styleFile}'`));
});

test('V20.7.5 bundles five unchanged UI sources in their original execution order',()=>{
 let savings=0;
 for(const spec of specs){
  const bundle=read(spec.bundle);new vm.Script(bundle);
  let index=-1,before=0;
  for(const [filename,expected] of spec.sources){
   const next=bundle.indexOf(`/* VC2075_SOURCE_BEGIN:${filename} */`);
   assert.ok(next>index,`${filename}: original order`);index=next;
   const source=original(bundle,filename);
   assert.equal(source,read(filename),`${filename}: original kept intact`);
   assert.equal(crypto.createHash('sha256').update(source).digest('hex'),expected);
   before+=zlib.gzipSync(source).length;
  }
  const after=zlib.gzipSync(bundle).length;
  assert.ok(after<before,`${spec.bundle}: gzip improvement`);
  savings+=before-after;
 }
 assert.ok(savings>1000);
});

test('V20.7.5 browser APIs and DOM-ready hooks match the former five scripts',()=>{
 for(const spec of specs){
  const merged=browserRun(read(spec.bundle));
  const native=browserRun(spec.sources.map(([name])=>read(name)).join('\n;\n'));
  assert.deepEqual(merged.registered,native.registered,`${spec.bundle}: event order`);
  const keys=Object.keys(native.win).filter(key=>key.startsWith('VC_'));
  assert.ok(keys.length>=spec.sources.length-1);
  for(const global of keys){
   assert.ok(global in merged.win,global);
   assert.deepEqual(Object.keys(merged.win[global]).sort(),Object.keys(native.win[global]).sort());
   for(const [name,value] of Object.entries(native.win[global])){
    const changed=merged.win[global][name];
    if(typeof value==='function')assert.equal(changed.toString(),value.toString(),`${global}.${name}`);
    else assert.equal(JSON.stringify(changed),JSON.stringify(value),`${global}.${name}`);
   }
  }
 }
});

test('V20.7.5 active HTML/precaching uses only replacement assets',()=>{
 const scriptTags=[...html.matchAll(/<script\b[^>]*src="\.\/([^"?]+)/g)].map(x=>x[1]);
 const styleTags=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\.\/([^"?]+)/g)].map(x=>x[1]);
 assert.equal(styleTags.filter(x=>x===styleFile).length,1);
 for(const spec of specs){
  assert.equal(scriptTags.filter(x=>x===spec.bundle).length,1);
  assert.ok(sw.includes(`'./${spec.bundle}'`));
  for(const [filename] of spec.sources){
   assert.ok(!scriptTags.includes(filename),filename);
   assert.ok(!sw.includes(`'./${filename}'`),filename);
  }
 }
 assert.match(sw,/video-style-extraction-20\.7\.5/);
});

test('V20.7.5 retains five old JS files until final GitHub cleanup',async()=>{
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 const names=manifest.groups.flatMap(x=>x.files);
 assert.ok(names.length>=37,'newer migrations may identify more files to retire');
 assert.equal(new Set(names).size,names.length);
 assert.deepEqual(manifest.groups.find(x=>x.identifiedIn==='20.7.5').files,specs.flatMap(spec=>spec.sources.map(([name])=>name)));
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 const result=auditRuntimeAssets(__dirname);
 assert.deepEqual(result.errors,[]);
 assert.ok(result.retainedCandidates>=37,'later safe consolidations may add retired candidates');
 assert.ok(result.retainedPresent>=14&&result.retainedPresent<=names.length);
 assert.ok(read('GUIA_V20.7.5_EXTRACCION_INDEX.md').includes('No borres ningún archivo'));
 assert.equal(require('./package.json').version,require('./scripts/retained-legacy-assets.json').updatedIn);
});
