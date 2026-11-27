'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const originals=[
 ['227-vc2041-statistical-integrity.js','6b38f0ad57bc3216628c0042a90ffa34dd0145c614bd47374be16f8c4351ff77'],
 ['228-vc2042-rival-intelligence.js','af4a404dc7a3f6fac5fc78e199b5d5e706a9311d60a7309dcb8eaa76c5e5c60f'],
 ['229-vc2043-live-tactical-assistant.js','153af2722a6ed5da3cde9947373425901a96ec5d6a4d233163b449057cfe8e5b']
];
const bundleName='vc2072-tactical-intelligence-unified.js';
const sourceBundle=read(bundleName);
function original(file){
 const begin=`/* VC2072_SOURCE_BEGIN:${file} */\n`;
 const end=`\n/* VC2072_SOURCE_END:${file} */`;
 const at=sourceBundle.indexOf(begin);
 assert.notEqual(at,-1,file);
 const stop=sourceBundle.indexOf(end,at+begin.length);
 assert.notEqual(stop,-1,file);
 return sourceBundle.slice(at+begin.length,stop)+'\n';
}
function run(script){const context={window:{},console};vm.runInNewContext(script,context,{timeout:1000});return context.window;}
function classes(initial=[]){const values=new Set(initial);return {contains:x=>values.has(x),add:x=>values.add(x),remove:x=>values.delete(x),toggle(x,force){const enabled=force===undefined?!values.has(x):!!force;enabled?values.add(x):values.delete(x);return enabled;}}}
function fakeShell(wide=true){
 const store=new Map(),nodes=new Map(),handlers=new Map(),queries=new Map();
 const body={classList:classes(['vc17-shell'])};
 const side={classList:classes()};nodes.set('v11-sidebar',side);
 const overlay={classList:classes()};nodes.set('v11-sidebar-overlay',overlay);
 const view={classList:classes()};nodes.set('scout-match-mode',view);
 const toggle={attributes:{},setAttribute(name,value){this.attributes[name]=value},focus(){this.focused=true}};
 const brand={append(button){nodes.set(button.id,button)}};
 queries.set('#v11-topbar .v11-menu-toggle',toggle);
 queries.set('#v11-sidebar .vc17-brand',brand);
 const doc={readyState:'loading',body,
  getElementById:id=>nodes.get(id)||null,querySelector:selector=>queries.get(selector)||null,
  querySelectorAll:()=>[],createElement:()=>({setAttribute(){},set id(value){this._id=value},get id(){return this._id}}),
  addEventListener:(event,fn)=>handlers.set(event,fn)};
 const screen={matches:wide,addEventListener(){}};
 const win={document:doc,localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},matchMedia:()=>screen};
 const context={window:win,console};vm.runInNewContext(read('216-vc20241-data-volley-layout-refinement.js'),context,{timeout:1000});
 const api=win.VC_DV_LAYOUT_20241;api.boot();
 const dispatch=(id)=>{const element={id,matches:s=>id==='menu'?s==='#v11-topbar .v11-menu-toggle':id==='vc20241-hide-nav'?s==='#vc20241-hide-nav':false};
  const event={target:{closest:()=>element},prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
  handlers.get('click')(event);return event;};
 return {api,body,side,overlay,view,toggle,store,screen,dispatch,handlers};
}

test('V20.7.2 preserves source bytes and order for three read-only tactical engines',()=>{
 let gzipBefore=0;
 let lastIndex=-1;
 for(const [filename,expectedHash] of originals){
  const index=sourceBundle.indexOf(`/* VC2072_SOURCE_BEGIN:${filename} */`);
  assert.ok(index>lastIndex);lastIndex=index;
  const contents=original(filename);
  assert.equal(crypto.createHash('sha256').update(contents).digest('hex'),expectedHash);
  gzipBefore+=zlib.gzipSync(contents).length;
  assert.ok(JSON.parse(read('scripts/retained-legacy-assets.json')).groups.some(group=>group.files.includes(filename)),`${filename} retained until final cleanup`);
 }
 assert.ok(zlib.gzipSync(sourceBundle).length<gzipBefore,'fewer, smaller gzip responses');
 new vm.Script(sourceBundle);
});

test('V20.7.2 tactical modules keep all browser APIs and callable functions',()=>{
 const bundled=run(sourceBundle);
 for(const [file] of originals){
  const standalone=run(original(file));
  for(const [global,value] of Object.entries(standalone)){
   assert.ok(global in bundled,global);
   assert.deepEqual(Object.keys(bundled[global]).sort(),Object.keys(value).sort(),global);
   for(const key of Object.keys(value)){
    if(typeof value[key]==='function')assert.equal(bundled[global][key].toString(),value[key].toString(),`${global}.${key}`);
    else assert.equal(bundled[global][key],value[key]);
   }
  }
 }
});

test('V20.7.2 sidebar hide and restore work throughout the desktop app',()=>{
 const a=fakeShell();
 assert.equal(a.api.diagnostics().leftHidden,false,'dashboard starts with left sidebar visible');
 assert.equal(a.toggle.attributes['aria-expanded'],'true');
 const hide=a.dispatch('vc20241-hide-nav');
 assert.equal(hide.prevented,true);
 assert.equal(hide.stopped,true);
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),true);
 assert.equal(a.toggle.attributes['aria-expanded'],'false');
 assert.equal(a.toggle.attributes['aria-label'],'Mostrar navegación principal');
 assert.equal(a.toggle.focused,true);
 const show=a.dispatch('menu');
 assert.equal(show.prevented,true);
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),false);
 assert.equal(JSON.parse(a.store.get('vc20241.suggestedWorkspace')).globalLeftHidden,false);
});

test('V20.7.2 Match Scouting keeps its independent default and user setting',()=>{
 const a=fakeShell();
 a.view.classList.add('active');a.api.sync();
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),true,'match video opens wide');
 a.dispatch('menu');
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),false);
 assert.equal(a.api.diagnostics().settings.leftHidden,false);
 a.view.classList.remove('active');a.api.sync();
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),false,'dashboard is independently visible');
 a.dispatch('vc20241-hide-nav');
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),true,'dashboard can also be collapsed');
 a.view.classList.add('active');a.api.sync();
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),false,'match restores its own choice');
});

test('V20.7.2 mobile overlay remains handled by the existing navigation code',()=>{
 const a=fakeShell(false);
 assert.equal(a.dispatch('menu').prevented,false,'native hamburger is not intercepted');
 a.side.classList.add('open');a.overlay.classList.add('open');a.api.sync();
 assert.equal(a.toggle.attributes['aria-expanded'],'true');
 assert.equal(a.body.classList.contains('vc20241-left-hidden'),false);
 a.screen.matches=true;a.api.sync();
 assert.equal(a.side.classList.contains('open'),false,'tablet/desktop transition closes stale drawer');
 assert.equal(a.overlay.classList.contains('open'),false);
});

test('V20.7.2 loads just the one unified tactical script and caches it',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),css=read('vc20241-data-volley-layout-refinement.css');
 assert.ok(html.includes(`${bundleName}?v=20.7.2`));
 assert.ok(html.includes('216-vc20241-data-volley-layout-refinement.js?v=20.7.2'));
 assert.ok(html.includes('vc20241-data-volley-layout-refinement.css?v=20.7.2'));
 for(const [file] of originals){assert.ok(!html.includes(`src="./${file}`));assert.ok(!sw.includes(`'./${file}'`));}
 assert.ok(sw.includes(`'./${bundleName}'`));
 assert.match(sw,/tactical-sidebar-20\.7\.2/);
 assert.match(css,/body\.vc17-shell\.vc20241-left-hidden #v11-sidebar/);
 assert.match(css,/body\.vc17-shell:not\(\.v158-view-only\) #v11-topbar \.v11-menu-toggle/);
 const deletion=read('ELIMINAR_DE_GITHUB_V20.7.2.txt').split(/\r?\n/).filter(x=>/^\d{3}-.*\.js$/.test(x));
 assert.deepEqual(deletion,originals.map(([file])=>file));
 assert.equal(require('./package.json').version,'20.7.5');
});
