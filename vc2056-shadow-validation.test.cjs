'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');
const native=require('./231-vc2051-scouting-expert.js');

test('V20.5.6 compares a previously parsed preview without invoking the native parser twice',async()=>{
 const {classifyPreflight}=await compiled();
 let parserCalls=0;
 const parser=(input)=>{parserCalls++;return {action:{team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7,playerNameSnapshot:'NOMBRE PRIVADO'}}};
 const preview=native.inspect('007a#',{id:19,status:'live'},parser);
 assert.equal(preview.state,'ok');
 assert.equal(parserCalls,1);
 const finding=classifyPreflight({source:'v800-code',code:preview.code,state:preview.state,nativeShape:preview.nativeShape});
 assert.equal(finding.kind,'agree');
 assert.equal(finding.source,'directo');
 assert.equal(finding.skill,'A');
 assert.equal(parserCalls,1,'the new engine must reuse the native result');
 assert.ok(!JSON.stringify(preview.nativeShape).includes('NOMBRE PRIVADO'));
 assert.ok(!JSON.stringify(finding).includes('007'));
});

test('classifies agreement, divergence, native rejection and unverified previews independently',async()=>{
 const {classifyPreflight}=await compiled();
 const base={source:'v113-video-code',code:'R12S=',state:'ok',nativeShape:{team:'opponent',skill:'S',evaluation:'=',playerNumberSnapshot:'12'}};
 assert.equal(classifyPreflight(base).kind,'agree');
 assert.equal(classifyPreflight(base).source,'video');
 assert.equal(classifyPreflight({...base,nativeShape:{...base.nativeShape,skill:'A'}}).kind,'difference');
 assert.equal(classifyPreflight({...base,code:'*12S#'}).kind,'coverage-gap');
 assert.equal(classifyPreflight({...base,state:'error',nativeShape:null}).kind,'native-reject');
 assert.equal(classifyPreflight({...base,state:'warning',nativeShape:null}).kind,'unverified');
 assert.equal(classifyPreflight(null).kind,'unverified');
});

test('session keeps only 80 bounded non-agreements, never a code, dorsal, player or match identifier',async()=>{
 const {createShadowSession}=await compiled();
 const session=createShadowSession();
 assert.equal(session.snapshot().counters.total,0);
 for(let i=0;i<94;i++)session.record({source:'v800-code',code:`${i+1}A#`,state:'error',
  matchId:'secret-match',playerName:'private-person',nativeShape:null});
 session.record({source:'v800-code',code:'7A#',state:'ok',nativeShape:{team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7}});
 const report=session.snapshot();
 assert.equal(report.counters.total,95);
 assert.equal(report.counters.nativeReject,94);
 assert.equal(report.counters.agree,1);
 assert.equal(report.recent.length,80);
 assert.equal(Object.isFrozen(report),true);
 assert.equal(Object.isFrozen(report.counters),true);
 assert.equal(Object.isFrozen(report.recent),true);
 const json=JSON.stringify(report);
 for(const prohibited of ['secret-match','private-person','7A#','95A#','playerName','matchId','nativeShape'])
  assert.ok(!json.includes(prohibited),`report leaked ${prohibited}`);
 session.clear();
 assert.deepEqual({...session.snapshot().counters},{total:0,agree:0,difference:0,coverageGap:0,nativeReject:0,unverified:0});
 assert.equal(session.snapshot().recent.length,0);
});

test('management panel is read-only, renders preview counts and unsubscribes cleanly',async()=>{
 const {mountShadowPanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,document){super();this.tagName=tag;this.document=document;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attributes={};}
  set id(value){this._id=value;this.document.items.set(value,this)}
  get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  append(...children){for(const child of children){this.children.push(child);child.parentNode=this}}
  setAttribute(key,value){this.attributes[key]=value}
  insertAdjacentElement(position,element){
   const parent=position==='afterbegin'?this:this.parentNode;
   const index=position==='afterbegin'?0:parent.children.indexOf(this)+1;
   parent.children.splice(index,0,element);element.parentNode=parent;
  }
  replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children)}
  remove(){if(!this.parentNode)return;this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map();this.body=this.createElement('body')}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('main');host.id='v11-management';host.className='view active';
 const anchor=doc.createElement('section');anchor.id='vc2055-domain';host.append(anchor);
 const win={document:doc,setTimeout(){throw Error('must only schedule download cleanup after a click')}};
 const api=mountShadowPanel(win);
 assert.strictEqual(api,mountShadowPanel(win));
 assert.equal(api.readOnly,true);
 assert.equal(host.children[1].id,'vc2056-shadow');
 const evt=new Event('vc:scout-code-preflight');Object.defineProperty(evt,'detail',{value:{source:'v800-code',code:'7A#',state:'ok',nativeShape:{team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7}}});
 doc.dispatchEvent(evt);await Promise.resolve();
 assert.equal(api.getReport().counters.agree,1);
 assert.equal(api.getReport().counters.total,1);
 api.clearReport();assert.equal(api.getReport().counters.total,0);
 api.dispose();assert.equal(win.VC_SHADOW_2056,undefined);
 assert.equal(host.children.length,1);
 doc.dispatchEvent(evt);assert.equal(api.getReport().counters.total,0,'disposed panel must ignore future events');
});

test('published assets, source and optional bundle reference V20.5.6 without a new writer',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const packageFile=require('./package.json');
 assert.equal(packageFile.version,'20.5.12');
 assert.ok(packageFile.scripts['test:foundation'].includes('vc2056-shadow-validation.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.12'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.12'));
 assert.ok(css.includes('#vc2056-shadow')||css.includes('.vc2056-shadow'));
 assert.ok(sw.includes('shadow-validation-20.5.6'));
 const dist=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.match(dist,/assets\/index-[\w-]+\.js/,'Vite should replace the module entrypoint with a hashed bundle');
 assert.ok(fs.existsSync(path.join(root,'dist/vc2055-domain-core.mjs')));
 const {mountShadowPanel,classifyPreflight,createShadowSession}=await compiled();
 for(const fn of [mountShadowPanel,classifyPreflight,createShadowSession])assert.equal(typeof fn,'function');
 for(const file of ['src/domain/shadow-validation.ts','src/domain/shadow-runtime.ts']){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.ok(!code.includes(forbidden),`${file}: ${forbidden}`);
 }
});
