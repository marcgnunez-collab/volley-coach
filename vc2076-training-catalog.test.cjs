'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const dataName='vc2076-training-catalog-data.js';
const coreName='002-core-training-v150-monolithic.js';
const data=read(dataName),core=read(coreName),html=read('index.html'),sw=read('service-worker.js');
const names=[
  ['defaults',379],['EJERCICIOS_PROPIOS_183',158],['EJERCICIOS_PROPIOS_287_NUEVOS',215],
  ['LIMPIEZA_RECEPCION_V1',44],['LIMPIEZA_COLOCACION_V1',22],
  ['LIMPIEZA_ATAQUE_V1',14],['LIMPIEZA_DEFENSA_BLOQUEO_V1',14]
];
function declarations(){
 return data.split(/\r?\n/).filter(line=>line.startsWith('const ')).map(line=>{
  const match=line.match(/^const ([A-Za-z_][A-Za-z_0-9]*)=(\[.*\]);$/);
  assert.ok(match,'catalog must contain a single pure JSON array per declaration');
  return {name:match[1],text:line,value:JSON.parse(match[2])};
 });
}

test('V20.7.6 extracts seven pure training catalogs without altering any original declaration',()=>{
 assert.equal(sha(data),'01b8e8bb3bf39398b6670c1af2867cb858de829f357bb4b55b01b19adcf95cf7');
 const all=declarations();
 assert.deepEqual(all.map(x=>[x.name,x.value.length]),names);
 assert.equal(new Set(all.map(x=>x.name)).size,7);
 for(const {name,value} of all){
  assert.ok(Array.isArray(value)&&value.every(x=>x&&typeof x==='object'&&!Array.isArray(x)),name);
  assert.equal(core.includes('const '+name+'='),false,'removed literal from core: '+name);
 }
 assert.ok(Buffer.byteLength(core)<170000,'training core is below 170 KB');
 assert.ok(Buffer.byteLength(data)>475000,'data is retained in a single independent file');
});

test('rejoining the seven exact catalog declarations reproduces the V20.7.5 core byte for byte',()=>{
 let reconstructed=core;
 for(const entry of declarations()){
  const marker='/* V20.7.6: '+entry.name+' supplied by the synchronous catalog data module. */';
  assert.ok(reconstructed.includes(marker),marker);
  reconstructed=reconstructed.replace(marker,entry.text);
 }
 assert.equal(Buffer.byteLength(reconstructed),647727);
 assert.equal(sha(reconstructed),'df5f44ca68036a8a254f5eb54ca4dbe4f29674a3e82228fa68607b061fd51814');
 assert.equal(sha(core),'ea866a9289f9d882bf2e226fabb6464439d5c69dd26f288883823a342a7432e5');
});

test('global lexical data remains available to later independent classic scripts',()=>{
 const context=vm.createContext({});
 vm.runInContext(data,context,{filename:dataName});
 const expected=names.map(([name])=>name);
 const lengths=vm.runInContext('['+expected.map(n=>n+'.length').join(',')+']',context);
 assert.deepEqual(Array.from(lengths),names.map(([,count])=>count));
 // A second classic script sees the same identifiers without window properties or an API adapter.
 vm.runInContext('globalThis.__catalogProbe={first:defaults[0].nombre,remaining:LIMPIEZA_RECEPCION_V1.length}',context);
 assert.equal(typeof context.__catalogProbe.first,'string');
 assert.equal(context.__catalogProbe.remaining,44);
 assert.equal(Object.prototype.hasOwnProperty.call(context,'defaults'),false);
});

test('training data synchronously precedes native writers in HTML and is precached for offline fallback',()=>{
 const dataTag=html.match(/<script id="vc2076-training-catalog-data"[^>]*><\/script>/)?.[0];
 const coreTag=html.match(/<script id="core-training-v150-monolithic"[^>]*><\/script>/)?.[0];
 assert.ok(dataTag&&coreTag);
 assert.ok(dataTag.includes('./'+dataName+'?v=20.7.6'));
 assert.ok(coreTag.includes('./'+coreName+'?v=20.7.6'));
 assert.ok(html.indexOf(dataTag)<html.indexOf(coreTag));
 assert.doesNotMatch(dataTag,/\b(?:defer|async|type="module")\b/);
 assert.doesNotMatch(coreTag,/\b(?:defer|async|type="module")\b/);
 assert.match(html,/rel="preload" as="script" href="\.\/vc2076-training-catalog-data\.js\?v=20\.7\.6"/);
 assert.match(sw,/training-catalog-20\.7\.6/);
 assert.ok(sw.includes("'./"+dataName+"'"));
 assert.ok(sw.includes("'./"+coreName+"'"));
 const dist=path.join(root,'dist');
 if(fs.existsSync(path.join(dist,'index.html'))){
  const built=read('dist/index.html');
  assert.ok(built.includes('./'+dataName+'?v=20.7.6'));
  assert.ok(fs.existsSync(path.join(dist,dataName)));
  assert.equal(sha(fs.readFileSync(path.join(dist,dataName),'utf8')),sha(data));
 }
});

test('V20.7.6 preserves native storage ownership and the no-delete retirement policy',async()=>{
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const result=auditRuntimeAssets(root);
 assert.deepEqual(result.errors,[]);
 assert.ok(result.retainedCandidates>=37,'no fully active training file is retired');
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.ok(manifest.groups.flatMap(x=>x.files).length>=37);
 assert.ok(core.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(core.includes('window.VC_TRAINING_PLANNING_20574'));
 assert.equal(require('./package.json').version,require('./scripts/retained-legacy-assets.json').updatedIn);
});
