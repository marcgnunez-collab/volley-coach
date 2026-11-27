'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const dist=path.join(root,'dist');
const sourceHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
const builtHTML=fs.existsSync(path.join(dist,'index.html'))?fs.readFileSync(path.join(dist,'index.html'),'utf8'):null;
const sourceSW=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const builtSW=fs.existsSync(path.join(dist,'service-worker.js'))?fs.readFileSync(path.join(dist,'service-worker.js'),'utf8'):null;

function allScripts(html){
 return Array.from(html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi),match=>({
  src:match[1],isModule:/\btype="module"/.test(match[0])
 }));
}
function stylesheetLinks(html){
 return Array.from(html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi),match=>match[1]);
}
function assetPath(url){return path.join(dist,url.split('?')[0].replace(/^\.\//,''));}

test('Vite configuration is a separate non-destructive development workflow',()=>{
 const pkg=require('./package.json');
 const config=fs.readFileSync(path.join(root,'vite.config.mjs'),'utf8');
 const ts=JSON.parse(fs.readFileSync(path.join(root,'tsconfig.json'),'utf8'));
 const [major,minor,patch]=pkg.version.split('.').map(Number);
 assert.ok(major===20&&(minor>5||(minor===5&&patch>=4)));
 assert.match(pkg.scripts.build,/vite build$/);
 assert.ok(pkg.devDependencies.vite);assert.ok(pkg.devDependencies.typescript);
 assert.match(config,/base:'\.\/'/);assert.match(config,/publicDir:false/);
 assert.match(config,/preserveLegacyRuntime/);assert.match(config,/vc2054-entry\.ts/);
 assert.equal(ts.compilerOptions.strict,true);
 assert.equal(ts.compilerOptions.allowJs,true);
 assert.equal(ts.compilerOptions.checkJs,false);
 assert.ok(sourceSW.includes('vite-foundation-20.5.4'));
 assert.ok(sourceSW.includes('/* VC2054_VITE_PRECACHE_INSERTION */'));
 assert.ok(sourceHTML.includes('./vc2053-modular-core.mjs?v=20.5.3'));
 assert.equal(sourceHTML.includes('vc2054-entry.ts'),false,'raw GitHub Pages must never load TS directly');
});

test('Vite production output exists and compiles TypeScript into a fingerprinted ES module',()=>{
 assert.ok(builtHTML,'run npm run build before these production checks');
 const assets=fs.readdirSync(path.join(dist,'assets'));
 const bundle=assets.filter(name=>/^index-.*\.js$/.test(name));
 assert.equal(bundle.length,1);
 const js=fs.readFileSync(path.join(dist,'assets',bundle[0]),'utf8');
 assert.ok(js.includes('vc-build-identity'));
 assert.ok(js.includes('20.5.4'));
 assert.equal(builtHTML.includes('src/vc2054-entry.ts'),false);
 assert.ok(builtHTML.includes('./assets/'+bundle[0]));
 assert.ok(builtHTML.includes('<script type="module"'));
});

test('classic scripts and consolidated stylesheet order match between source and Vite',()=>{
 const classic=html=>allScripts(html).filter(row=>!row.isModule).map(row=>row.src);
 assert.deepEqual(classic(builtHTML),classic(sourceHTML));
 assert.deepEqual(stylesheetLinks(builtHTML),stylesheetLinks(sourceHTML));
 assert.ok(classic(builtHTML).length>150);
 assert.ok(stylesheetLinks(builtHTML).length>=25,'V20.7.1 groups ten CSS links into four');
});

test('dist keeps source names and references for the existing PWA and legacy scripts',()=>{
 const scripts=allScripts(builtHTML);
 for(const {src} of scripts){
  if(!src.startsWith('./'))continue;
  assert.ok(fs.existsSync(assetPath(src)),src);
 }
 for(const href of stylesheetLinks(builtHTML)){
  if(!href.startsWith('./'))continue;
  assert.ok(fs.existsSync(assetPath(href)),href);
 }
 for(const filename of ['recuperacion.html','manifest.webmanifest','service-worker.js',
  '021-core-scouting-v150-monolithic.js','002-core-training-v150-monolithic.js',
  '210-vc2011-durable-sync-journal.js','vc2052-match-contract.mjs','vc2053-match-reader.mjs'])
  assert.ok(fs.existsSync(path.join(dist,filename)),filename);
 assert.equal(fs.readdirSync(path.join(dist,'assets')).some(name=>/^(?:002|021)-/.test(name)),false);
});

test('compiled service worker precaches the real Vite bundle and preserves cloud exclusions',()=>{
 assert.ok(builtSW);
 const assets=fs.readdirSync(path.join(dist,'assets')).filter(name=>name.endsWith('.js'));
 for(const name of assets)assert.ok(builtSW.includes('"./assets/'+name+'"'),name);
 assert.equal(builtSW.includes('VC2054_VITE_PRECACHE_INSERTION'),false);
 assert.ok(builtSW.includes('isCloudOrApi'));
 assert.ok(builtSW.includes("request.method!=='GET'"));
 assert.ok(builtSW.includes('cacheSuccessful'));
 assert.ok(sourceSW.includes('indexedDB')===false||sourceSW.includes('No toca localStorage ni IndexedDB'));
});

test('TypeScript pilot does not take over the score writer or storage',()=>{
 const entry=fs.readFileSync(path.join(root,'src/vc2054-entry.ts'),'utf8');
 const contract=fs.readFileSync(path.join(root,'src/vc2054-build-contract.ts'),'utf8');
 for(const content of [entry,contract])for(const mutation of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'v121AwardPoint=', 'window.MatchState='])
  assert.equal(content.includes(mutation),false,mutation);
});
