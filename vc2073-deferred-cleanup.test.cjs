'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
const names=manifest.groups.flatMap(group=>group.files);
const originals=[
 ['230-vc2050-release-health.js','67d575e9d58333a0b216dc0652d10edb6337fb72c1d315bbcde042ab1b81a8e0'],
 ['231-vc2051-scouting-expert.js','95c024c0177ea212f2fcdbe41ac833498cd7f3f4672057d2ebc5dbef1e22ae46'],
 ['232-vc2052-architecture-foundation.js','95716315ea56eed715df1ea5e40849f986e43ff48fae5ec3e1933e1bbbcb8661']
];
const bundleName='vc2073-diagnostics-unified.js';
const bundled=read(bundleName);
function original(name){
 const begin=`/* VC2073_SOURCE_BEGIN:${name} */\n`,end=`\n/* VC2073_SOURCE_END:${name} */`;
 const at=bundled.indexOf(begin);assert.notEqual(at,-1,`${name} begins`);
 const stop=bundled.indexOf(end,at+begin.length);assert.notEqual(stop,-1,`${name} ends`);
 return bundled.slice(at+begin.length,stop)+'\n';
}
function evaluate(code){
 const root={document:{readyState:'loading',addEventListener(){}}};
 vm.runInNewContext(code,{window:root,console},{timeout:1500});return root;
}

test('V20.7.3 preserves the original diagnostics, preflight and performance JavaScript',()=>{
 let last=-1,before=0;
 for(const [name,expected] of originals){
  const pos=bundled.indexOf(`/* VC2073_SOURCE_BEGIN:${name} */`);
  assert.ok(pos>last,`${name} execution order`);last=pos;
  const source=original(name);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),expected);
  assert.equal(source,read(name),'old test/rollback source remains available');
  before+=zlib.gzipSync(source).length;
 }
 assert.ok(zlib.gzipSync(bundled).length<before,'one response compresses better than three');
 new vm.Script(bundled);
});

test('V20.7.3 publishes all existing browser APIs with their original functions',()=>{
 const merged=evaluate(bundled);
 for(const [name] of originals){
  const native=evaluate(original(name));
  const globals=Object.keys(native).filter(name=>name.startsWith('VC_'));
  assert.equal(globals.length,1);
  for(const global of globals){
   assert.ok(global in merged,global);
   assert.deepEqual(Object.keys(merged[global]).sort(),Object.keys(native[global]).sort());
   for(const [key,value] of Object.entries(native[global])){
    if(typeof value==='function')assert.equal(merged[global][key].toString(),value.toString(),`${global}.${key}`);
    else assert.equal(merged[global][key],value,`${global}.${key}`);
   }
  }
 }
});

test('V20.7.3 loads the new script once but keeps three historical sources for now',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 assert.ok(html.includes(`${bundleName}?v=20.7.3`));
 assert.ok(sw.includes(`'./${bundleName}'`));
 for(const [name] of originals){
  assert.ok(fs.existsSync(path.join(__dirname,name)),name);
  assert.ok(!html.includes(`src="./${name}`),name);
  assert.ok(!sw.includes(`'./${name}'`),name);
 }
 assert.match(sw,/diagnostics-retained-20\.7\.3/);
});

test('V20.7.3 historical list remains unchanged while later candidates accumulate',()=>{
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.deepEqual(manifest.groups.slice(0,4).map(group=>group.files.length),[10,10,3,3]);
 assert.equal(manifest.groups.slice(0,4).flatMap(group=>group.files).length,26);
 assert.equal(new Set(names).size,names.length);
 const html=read('index.html'),sw=read('service-worker.js');
 for(const name of names){
  assert.ok(!html.includes(`src="./${name}`),`${name}: no script load`);
  assert.ok(!html.includes(`href="./${name}`),`${name}: no CSS load`);
  assert.ok(!sw.includes(`'./${name}'`),`${name}: no precache`);
 }
 assert.ok(read('MIGRACION_PENDIENTES_DE_BORRADO_V20.7.3.md').includes('NO BORRAR'));
 assert.equal(require('./package.json').version,'20.7.5');
});

test('V20.7.3 audit permits only explicitly listed legacy files, and rejects active legacy use',async()=>{
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const actual=auditRuntimeAssets(__dirname);
 assert.deepEqual(actual.errors,[]);
 assert.equal(actual.retainedCandidates,names.length);
 assert.ok(actual.retainedPresent>=3&&actual.retainedPresent<=names.length,'earlier GitHub files may be retained temporarily');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vc2073-retained-'));
 try{
  fs.mkdirSync(path.join(tmp,'scripts'));
  const put=(name,data)=>fs.writeFileSync(path.join(tmp,name),data);
  put('index.html','<script src="./active.js"></script>');
  put('recuperacion.html','<!doctype html>');
  put('manifest.webmanifest',JSON.stringify({icons:[]}));
  put('service-worker.js',"const SHELL=['./active.js'];self.addEventListener('install',()=>{});self.addEventListener('activate',()=>{});self.addEventListener('fetch',()=>{});");
  put('active.js','(()=>{})();');
  put('old.js','(()=>{})();');
  put('scripts/retained-legacy-assets.json',JSON.stringify({schema:manifest.schema,policy:manifest.policy,groups:[{identifiedIn:'20.7.0',files:['old.js']}]}));
  assert.deepEqual(auditRuntimeAssets(tmp).errors,[],'listed old JS can remain during migration');
  put('unlisted.js','(()=>{})();');
  assert.match(auditRuntimeAssets(tmp).errors.join('\n'),/Unreferenced deployable asset: unlisted\.js/);
  put('index.html','<script src="./active.js"></script><script src="./old.js"></script>');
  assert.match(auditRuntimeAssets(tmp).errors.join('\n'),/retained legacy file is still loaded: old\.js/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
