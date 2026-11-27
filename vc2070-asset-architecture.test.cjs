'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=__dirname,read=name=>fs.readFileSync(path.join(root,name),'utf8');
const audit=()=>import('./scripts/audit-runtime-assets.mjs');

test('V20.7.0 verifies the full runtime asset graph before production builds',async()=>{
 const {auditRuntimeAssets}=await audit(),out=auditRuntimeAssets(root);
 assert.deepEqual(out.errors,[]);assert.deepEqual(out.unreferenced,[]);
 assert.ok(out.assets>200);assert.ok(out.client>190);assert.ok(out.precache>130);
});

test('asset audit rejects broken HTML, duplicated script ids and orphaned files',async()=>{
 const {auditRuntimeAssets}=await audit(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vc2070-asset-'));
 try{
  const put=(file,content)=>fs.writeFileSync(path.join(tmp,file),content);
  put('index.html','<script id="same" src="./present.js"></script><script id="same" src="./ghost.js"></script>');
  put('recuperacion.html','<!doctype html>');
  put('manifest.webmanifest',JSON.stringify({icons:[{src:'./present.png'}]}));
  put('service-worker.js',"const SHELL=['./present.js','./missing.css','./present.js'];self.addEventListener('install',()=>{});self.addEventListener('activate',()=>{});self.addEventListener('fetch',()=>{});");
  put('present.js','(()=>{})();');put('unused.js','(()=>{})();');put('present.png','image');
  const output=auditRuntimeAssets(tmp),errors=output.errors.join('\n');
  assert.match(errors,/duplicate script id same/);
  assert.match(errors,/missing file ghost\.js/);
  assert.match(errors,/missing file missing\.css/);
  assert.match(errors,/duplicated or invalid precache entry/);
  assert.match(errors,/Unreferenced deployable asset: unused\.js/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('ten obsolete root artifacts are absent; active runtime and historical tests remain',()=>{
 for(const file of ['216-vc20231-dv-layout-refinement.js','vc20231-dv-layout-refinement.css',
  '211-vc2012-multi-device-validation.js',
  'vc-app-192-v1741.png','vc-app-512-v1741.png','vc-app-maskable-v1741.png',
  'v19320-compatibility-final-audit.test.cjs','v2001-sync-engine-reliability.test.cjs',
  'v2011-durable-sync-journal.test.cjs','v2012-multi-device-validation.test.cjs'])
  assert.equal(fs.existsSync(path.join(root,file)),false,file);
 assert.ok(fs.existsSync(path.join(root,'test-audit/fixtures/v2012-legacy-device-validator.js')));
 for(const file of ['v19320-compatibility-final-audit.test.cjs',
  'v2001-sync-engine-reliability.test.cjs','v2011-durable-sync-journal.test.cjs',
  'v2012-multi-device-validation.test.cjs'])
  assert.ok(fs.existsSync(path.join(root,'test-audit',file)),file);
 const html=read('index.html'),manifest=JSON.parse(read('manifest.webmanifest'));
 assert.ok(html.includes('./216-vc20241-data-volley-layout-refinement.js'));
 assert.ok(html.includes('./vc20241-data-volley-layout-refinement.css'));
 assert.ok(html.includes('href="./icon-192.png"'));
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
 const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 assert.equal(hash('icon-192.png'),'afba1cd633c536a9d4c94078f56d670365feae3848ec9dfcb8bebe170029d00d');
 assert.equal(hash('icon-512.png'),'6b246ef164e46dcfb445f0640b6c94f2f4eb072ad2087619930a2ffdb6e14fae');
 assert.equal(hash('icon-maskable-512.png'),'f0dfa741b523dbaba1619fd63c349cd96c6da3b4755f69f2f9c9cfdc5aa612dc');
});

test('GitHub deletion instructions name exactly ten retired files and never current assets',()=>{
 const guide=read('ELIMINAR_DE_GITHUB_V20.7.0.txt');
 const section=guide.split('NO borrar los actuales:')[0].split('DESPUES de subir SOLO_CAMBIOS V20.7.0:')[1];
 assert.ok(section,'must contain an exact delete-only section');
 const paths=section.split('\n').map(line=>line.trim()).filter(Boolean);
 assert.equal(paths.length,10);
 for(const file of paths){
  assert.match(file,/^[a-zA-Z0-9_.-]+$/,'only root filenames may be deleted');
  assert.equal(fs.existsSync(path.join(root,file)),false,file);
 }
 for(const current of ['index.html','service-worker.js','vc2055-domain-core.mjs',
  'icon-192.png','icon-512.png','icon-maskable-512.png',
  '216-vc20241-data-volley-layout-refinement.js'])assert.ok(!paths.includes(current));
});

function workerHarness(fetchImpl,cacheEntries={}){
 const events=new Map(),scope='https://example.invalid/volley/',stored=new Map(Object.entries(cacheEntries));
 const seen=[],expected={error:'offline'};
 const cache={
  async match(request,options={}){
   const target=new URL(request.url??request,scope);seen.push({url:target.href,ignoreSearch:!!options.ignoreSearch});
   const key=options.ignoreSearch?target.pathname:target.pathname+target.search;
   return stored.get(key)||null;
  },
  async put(request,response){stored.set(new URL(request.url??request,scope).pathname,response);}
 };
 const env={
  self:{location:{origin:'https://example.invalid'},registration:{scope},
   addEventListener:(type,handler)=>events.set(type,handler)},
  caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},
  fetch:fetchImpl,URL,
  Request:class{constructor(url){this.url=url;}},
  Response:{error:()=>expected}
 };
 vm.runInNewContext(read('service-worker.js'),env,{timeout:1000});
 async function request(local,{method='GET',mode='cors'}={}){
  let response,intercepted=false;
  events.get('fetch')({request:{method,mode,url:local.startsWith('http')?local:scope+local},
   respondWith(value){intercepted=true;response=value},waitUntil(){}});
  return {intercepted,value:intercepted?await response:null};
 }
 return {request,seen,expected,events,cache};
}

test('offline cache resolves versioned classic scripts, styles and ES modules to the same path',async()=>{
 const script={type:'script'},style={type:'style'},module={type:'module'};
 const app=workerHarness(async()=>{throw Error('offline')},{
  '/volley/021-core-scouting-v150-monolithic.js':script,
  '/volley/vc2055-domain.css':style,
  '/volley/vc2055-domain-core.mjs':module
 });
 assert.equal((await app.request('021-core-scouting-v150-monolithic.js?v=20.7.0')).value,script);
 assert.equal((await app.request('vc2055-domain.css?v=20.7.0')).value,style);
 assert.equal((await app.request('vc2055-domain-core.mjs?v=20.7.0')).value,module);
 assert.equal(app.seen.length,3);assert.ok(app.seen.every(row=>row.ignoreSearch));
});

test('cloud calls, POST and cross-origin requests remain entirely outside service worker cache',async()=>{
 const app=workerHarness(async()=>{throw Error('offline')});
 assert.equal((await app.request('https://third-party.test/asset.js')).intercepted,false);
 assert.equal((await app.request('https://api.supabase.co/rest/v1/volley_state')).intercepted,false);
 assert.equal((await app.request('https://example.invalid/rest/v1/volley_state')).intercepted,false);
 assert.equal((await app.request('021-core-scouting-v150-monolithic.js',{method:'POST'})).intercepted,false);
 assert.equal(app.seen.length,0);
});

test('a server 404 is never disguised as a valid cached old script',async()=>{
 const unavailable={ok:false,status:404},old={ok:true};
 const app=workerHarness(async()=>unavailable,{'/volley/021-core-scouting-v150-monolithic.js':old});
 const response=await app.request('021-core-scouting-v150-monolithic.js?v=20.7.0');
 assert.equal(response.intercepted,true);assert.equal(response.value,unavailable);
 assert.equal(app.seen.length,0,'must not consult the cache when server responds');
});

test('offline files that were never cached fail closed instead of returning stale content',async()=>{
 const app=workerHarness(async()=>{throw Error('offline')});
 assert.equal((await app.request('not-present.js?v=20.7.0')).value,app.expected);
 assert.equal((await app.request('not-present.css?v=20.7.0')).value,app.expected);
});

test('V20.7.0 release scripts audit assets and GitHub CI watches future regressions',()=>{
 const pkg=JSON.parse(read('package.json')),sw=read('service-worker.js'),html=read('index.html');
 const action=read('.github/workflows/volley-coach-recovery.yml');
 assert.equal(pkg.version,'20.7.0');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2070-asset-architecture.test.cjs'));
 assert.ok(pkg.scripts['audit:assets'].includes('scripts/audit-runtime-assets.mjs'));
 assert.ok(pkg.scripts.prebuild.includes('audit:assets'));
 assert.ok(action.includes('"scripts/**"')&&action.includes('"vc*.test.cjs"'));
 assert.ok(sw.includes('asset-architecture-20.7.0'));
 assert.ok(html.includes('V20.7.0 · LIMPIEZA DE ARQUITECTURA'));
 for(const file of ['service-worker.js','vc2055-domain-core.mjs','216-vc20241-data-volley-layout-refinement.js'])
  assert.ok(fs.existsSync(path.join(root,file)));
});
