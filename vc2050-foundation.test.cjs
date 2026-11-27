'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const api=require('./230-vc2050-release-health.js');
const references=[...html.matchAll(/(?:src|href)=["']\.\/([^"'?#]+)(?:\?[^"']*)?["']/g)].map(x=>x[1]);
const absent=[...new Set(references)].filter(f=>!fs.existsSync(path.join(root,f)));

test('all referenced JavaScript modules exist',()=>{
 assert.deepEqual(absent.filter(f=>f.endsWith('.js')),[]);
});
test('historical uncommitted CSS paths are no longer requested',()=>{
 const known=['vc19-workflow.css','vc1924-clip-studio.css','vc1920-connection-hub.css','vc1922-live-delay.css','vc1923-video-scout-links.css','vc1925-library-health.css','vc1930-tactical-rivals.css','vc1937-analysis-main.css','vc1938-data-engine.css','vc1939-rally-search.css','vc19310-professional-analysis.css'];
 assert.deepEqual(absent,[]);
 for(const name of known){
  assert.ok(!html.includes('./'+name));
  assert.ok(!sw.includes("'./"+name+"'"));
 }
});
test('new health module is versioned in HTML and precache',()=>{
 for(const [file,version] of [['vc2073-diagnostics-unified.js','20.7.3'],['vc2050-release-health.css','20.5.0.3']]){
  assert.ok(html.includes('./'+file+'?v='+version));
  assert.ok(sw.includes("'./"+file+"'"));
 }
 assert.match(sw,/foundation-20\.5\.0\.3/);
});
test('asset checker detects SPA fallback and missing responses',async()=>{
 const data=[{file:'./a.js',type:'js'},{file:'./b.css',type:'css'}];
 const result=await api.check(data,async url=>({ok:true,status:200,headers:{get:()=>url.endsWith('.css')?'text/html':'application/javascript'}}),'https://volley.example/');
 assert.deepEqual(result.map(x=>x.status),['ok','error']);
 assert.equal(api.summary(result).error.length,1);
});
test('asset checker does not request cross-origin assets',async()=>{
 let requests=0;
 const result=await api.check([{file:'https://other.example/x.js',type:'js'}],async()=>{requests++;return {ok:true,headers:{get:()=>''}};},'https://volley.example/');
 assert.equal(requests,0);assert.equal(result[0].status,'error');
});
test('new module does not rely on club data or Supabase',()=>{
 const source=fs.readFileSync(path.join(root,'230-vc2050-release-health.js'),'utf8');
 for(const term of ['localStorage','indexedDB','supabase','cloudClient','getMatches'])assert.ok(!source.includes(term));
});
test('management groups retain existing actions and prioritize the health panel',()=>{
 const code=fs.readFileSync(path.join(root,'230-vc2050-release-health.js'),'utf8');
 assert.ok(code.includes("heading.insertAdjacentElement('afterend',section)"));
 assert.ok(code.includes('grid.appendChild(buttons[index])'));
 for(const label of ['Organización deportiva','Nube y protección de datos','Auditorías y mantenimiento'])
  assert.ok(code.includes(label));
 assert.ok(html.includes('id="v11-management"'));
 assert.ok(html.includes('id="vc2050-release-health"'));
 assert.ok(html.includes('id="vc20501-management-groups"'));
});
