'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');

const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const groups=[
 ['vc2071-video-editor-unified.css',[
  ['vc19314-integrated-video.css','b61342e643a2dbdb1a297661eb870e28331d6291b8f558bc26370dc4e759c2b1'],
  ['vc19315-scouting-editor.css','0fa9984ca04bb18614e9b404333b9bcc14e8da31eda174623fd2e862364c10db']
 ]],
 ['vc2071-professional-workspaces-unified.css',[
  ['vc1931931-visual-system.css','5f520cbbed156b1e70fabcb38325fe6443cf149db67fc4030d4b33390ef3c4d4'],
  ['vc193194-analysis-workspace.css','69e41b015095e5e7aacad93bbc1a6153ad26ab5dabbbcf5517030bec2ad77eba'],
  ['vc193195-tactical-tables.css','7d603d4b4900d4e97623bca65320b134546a794b7a77fc4fccda3ace78cf1724'],
  ['vc193196-match-video-workspace.css','c78dad3a6d109e3042e5f3ebebc5f25bf620906c6498e6134e5a2da87ebbf381']
 ]],
 ['vc2071-global-reliability-unified.css',[
  ['vc193197-global-ui-optimization.css','7f982805bd86867b1dec30b6f5b46b7d573dde434b2a528d70bfb14456f68983'],
  ['vc19320-compatibility-audit.css','3a12e53a220a008895f1b42db1ec1a143e4f023094553b342e59276bc3406043']
 ]],
 ['vc2071-device-match-unified.css',[
  ['vc2012-multi-device-validation.css','1c183b763c23de49a1a0d52d48828a2733e1b3e34c272537fe2ea89a677e63fe'],
  ['vc2020-match-workspace.css','28bbfb1de077bdd9dfde6f313637f912b08bec473da148b20f59205f474366f1']
 ]]
];
const oldNames=groups.flatMap(([,sources])=>sources.map(([name])=>name));
const newNames=groups.map(([name])=>name);
function originalSource(bundle,name){
 const start=`/* VC2071_SOURCE_BEGIN:${name} */\n`;
 const end=`\n/* VC2071_SOURCE_END:${name} */`;
 const from=bundle.indexOf(start);
 assert.notEqual(from,-1,`${name} has a start marker`);
 const at=from+start.length;
 const to=bundle.indexOf(end,at);
 assert.notEqual(to,-1,`${name} has an end marker`);
 return bundle.slice(at,to)+'\n';
}

test('V20.7.1 preserves all ten historical CSS source texts byte for byte and in order',()=>{
 for(const [name,sources] of groups){
  const bundle=read(name);
  let previous=-1;
  for(const [original,expected] of sources){
   const begin=bundle.indexOf(`/* VC2071_SOURCE_BEGIN:${original} */`);
   assert.ok(begin>previous,`${original}: order preserved`);
   previous=begin;
   const sha=crypto.createHash('sha256').update(originalSource(bundle,original)).digest('hex');
   assert.equal(sha,expected,`${original}: exact original CSS`);
   assert.ok(JSON.parse(read('scripts/retained-legacy-assets.json')).groups.some(group=>group.files.includes(original)),`${original} retained until final cleanup`);
  }
 }
});

test('V20.7.1 loads four stylesheets in their original cascade positions',()=>{
 const html=read('index.html');
 const links=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="\.\/([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]);
 const active=links.filter(name=>newNames.includes(name));
 assert.deepEqual(active,newNames);
 for(const file of newNames)assert.ok(html.includes(`${file}?v=20.7.1`));
 for(const old of oldNames)assert.ok(!links.includes(old),`${old} must not load`);
});

test('V20.7.1 SW precaches exactly the four replacement stylesheets',()=>{
 const sw=read('service-worker.js');
 assert.match(sw,/style-bundles-20\.7\.1/);
 for(const name of newNames)assert.ok(sw.includes(`'./${name}'`),`${name} precached`);
 for(const old of oldNames)assert.ok(!sw.includes(`'./${old}'`),`${old} no longer precached`);
});

test('V20.7.1 cuts six stylesheet requests and reduces combined gzip transfer',()=>{
 let oldGzipBytes=0,newGzipBytes=0;
 for(const [name,sources] of groups){
  const body=read(name);
  newGzipBytes+=zlib.gzipSync(body).length;
  for(const [old] of sources)oldGzipBytes+=zlib.gzipSync(originalSource(body,old)).length;
 }
 assert.equal(oldNames.length-newNames.length,6);
 assert.ok(newGzipBytes<oldGzipBytes,{oldGzipBytes,newGzipBytes});
});

test('V20.7.1 GitHub retire instructions enumerate only the ten old CSS files',()=>{
 const guide=read('ELIMINAR_DE_GITHUB_V20.7.1.txt');
 const listed=guide.split(/\r?\n/).map(line=>line.trim()).filter(line=>/^vc[^\s]+\.css$/.test(line)).sort();
 assert.deepEqual(listed,[...oldNames].sort());
 for(const name of newNames)assert.ok(!listed.includes(name));
});

test('V20.7.1 remains the Vite-enabled, asset-audited incremental release',()=>{
 const pkg=require('./package.json');
 assert.equal(pkg.version,'20.7.3');
 assert.ok(pkg.scripts.prebuild.includes('audit:assets'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc2071-css-consolidation.test.cjs'));
 assert.ok(read('index.html').includes('V20.7.1 · ESTILOS UNIFICADOS'));
});
