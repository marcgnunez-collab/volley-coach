'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');

const frame=()=>({
 status:'live',currentSet:2,servingTeam:'opponent',rotationNo:4,opponentRotationNo:6,
 sets:[{number:1,scoreUs:25,scoreOpponent:23,rallies:[{}]},
  {number:2,scoreUs:0,scoreOpponent:0,rallies:[{},{}]}],
 liveRally:{actions:[{}]}
});
function makeHarness(active){
 const doc=new EventTarget(),listeners=new Set();
 const state={getActive:()=>active,getSet:m=>m?.sets.find(s=>s.number===m.currentSet),
  getSnapshot(){throw Error('deep cloning the legacy match is not allowed');},
  subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};
 return {win:{document:doc,MatchState:state},doc,listeners,
  emit(){for(const fn of listeners)fn();doc.dispatchEvent(new Event('vc:matchstatechange'));},
  replace(value){active=value}};
}

test('V20.5.9 reads only exact current-set primitives and freezes each selector',async()=>{
 const {projectObservableMatch}=await compiled();
 const m=frame(),original=JSON.stringify(m);
 const result=projectObservableMatch(m,m.sets[1]);
 assert.deepEqual({...result.score},{set:2,us:0,opponent:0});
 assert.deepEqual({...result.court},{serving:'opponent',rotationUs:4,rotationOpponent:6});
 assert.deepEqual({...result.rally},{completed:2,liveActions:1});
 assert.deepEqual({...result.status},{matchAvailable:true,phase:'live'});
 assert.equal(Object.isFrozen(result),true);
 for(const part of ['score','court','rally','status'])assert.equal(Object.isFrozen(result[part]),true);
 assert.equal(JSON.stringify(m),original);
 assert.deepEqual({...projectObservableMatch(null).score},{set:null,us:null,opponent:null});
 assert.equal(projectObservableMatch({currentSet:1,rotationNo:0,servingTeam:'unknown',sets:[{number:1,scoreUs:-1,scoreOpponent:3}]}).court.rotationUs,null);
 assert.equal(projectObservableMatch({currentSet:1,sets:[{number:1,scoreUs:-1,scoreOpponent:3}]}).score.us,null);
});

test('V20.5.9 broadcasts changed topics only, coalescing duplicate native notifications',async()=>{
 const {createObservableMatchStore}=await compiled();
 const m=frame(),h=makeHarness(m),store=createObservableMatchStore(h.win);
 const hits={score:0,court:0,rally:0,status:0,change:0};
 const stops=Object.keys(hits).map(topic=>store.subscribe(topic,()=>{hits[topic]++}));
 assert.equal(h.listeners.size,1,'one native subscription for all selectors');
 assert.equal(store.diagnostics().subscribers,5);
 m.sets[1].scoreUs=1;h.emit();h.emit();
 await Promise.resolve();
 assert.deepEqual(hits,{score:1,court:0,rally:0,status:0,change:1});
 assert.equal(store.getSnapshot().score.us,1);
 m.rotationNo=3;m.servingTeam='ours';h.emit();await Promise.resolve();
 assert.deepEqual(hits,{score:1,court:1,rally:0,status:0,change:2});
 m.liveRally.actions.push({});h.emit();await Promise.resolve();
 assert.deepEqual(hits,{score:1,court:1,rally:1,status:0,change:3});
 m.status='finished';h.emit();await Promise.resolve();
 assert.deepEqual(hits,{score:1,court:1,rally:1,status:1,change:4});
 assert.equal(store.diagnostics().updates,4);
 for(const stop of stops)stop();
 assert.equal(store.diagnostics().subscribers,0);
 store.dispose();assert.equal(h.listeners.size,0);
 h.emit();await Promise.resolve();
 assert.equal(store.diagnostics().updates,4);
});

test('an edit to past actions invalidates change observers even if scoreboard selectors stay the same',async()=>{
 const {createObservableMatchStore}=await compiled();
 const m=frame(),h=makeHarness(m),store=createObservableMatchStore(h.win);
 let changed=0,score=0;
 store.subscribe('change',()=>changed++);
 store.subscribe('score',()=>score++);
 m.sets[0].rallies[0].corrected=true;h.emit();await Promise.resolve();
 assert.equal(changed,1);assert.equal(score,0);
 assert.equal(store.diagnostics().updates,0,'no selector content changed');
 store.dispose();
});

test('manual refresh handles selection, missing data and observer exceptions without writing',async()=>{
 const {createObservableMatchStore}=await compiled();
 const m=frame(),h=makeHarness(m),store=createObservableMatchStore(h.win);
 let status=0,change=0;
 store.subscribe('status',()=>{status++;throw Error('external UI failure')});
 store.subscribe('change',()=>{change++});
 h.replace(null);
 assert.equal(store.refresh().status.matchAvailable,false);
 assert.equal(status,1);assert.equal(change,1);
 assert.equal(store.refresh().status.matchAvailable,false);
 assert.equal(change,1,'idempotent manual refresh');
 assert.equal(store.diagnostics().readOnly,true);
 store.dispose();
 assert.equal(h.listeners.size,0);
});

test('Gestión mounts one observable panel and keeps the existing match UI unchanged',async()=>{
 const {mountObservablePanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attrs={};}
  set id(value){this._id=value;this.doc.nodes.set(value,this)}
  get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  setAttribute(name,value){this.attrs[name]=value}
  append(...items){for(const item of items){item.parentNode=this;this.children.push(item)}}
  insertAdjacentElement(where,item){assert.equal(where,'afterend');const p=this.parentNode;p.children.splice(p.children.indexOf(this)+1,0,item);item.parentNode=p}
  remove(){if(!this.parentNode)return;const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{
  constructor(){super();this.nodes=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.nodes.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('section');host.id='v11-management';host.className='view active';
 const anchor=doc.createElement('div');anchor.id='vc2058-grammar';host.append(anchor);
 const m=frame(),h=makeHarness(m),win={...h.win,document:doc};
 const api=mountObservablePanel(win);
 assert.equal(api.version,'20.5.9');assert.equal(api.readOnly,true);
 assert.strictEqual(mountObservablePanel(win),api);
 assert.equal(host.children[1].id,'vc2059-observable');
 assert.equal(api.getSnapshot().score.us,0);
 m.sets[1].scoreUs=2;for(const fn of h.listeners)fn();await Promise.resolve();await Promise.resolve();
 assert.equal(api.getSnapshot().score.us,2);
 assert.equal(host.children[1].children.find(e=>e.className==='vc2059-status').textContent,'Partido activo · set 2');
 api.dispose();assert.equal(host.children.length,1);assert.equal(win.VC_STATE_2059,undefined);assert.equal(h.listeners.size,0);
});

test('existing diagnostics reuse the hub; a past correction marks the committed audit stale',async()=>{
 const {mountDomainDiagnostic,mountCommittedPanel,createObservableMatchStore}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.disabled=false;}
  set id(value){this._id=value;this.doc.nodes.set(value,this)}
  get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  append(...items){for(const item of items){item.parentNode=this;this.children.push(item)}}
  setAttribute(){}
  insertAdjacentElement(where,item){const p=this.parentNode;p.children.splice(p.children.indexOf(this)+1,0,item);item.parentNode=p}
  replaceChildren(...items){this.children=[];this.append(...items)}
  remove(){if(!this.parentNode)return;const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{
  constructor(){super();this.nodes=new Map();this.body=this.createElement('body')}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.nodes.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('section');host.id='v11-management';host.className='view active';
 const anchor=doc.createElement('section');anchor.id='vc2053-modular-core';host.append(anchor);
 const m=frame(),callbacks=new Set();let nativeSubscriptions=0;
 const source={getActive:()=>m,getSet:match=>match.sets[1],subscribe:fn=>{
  callbacks.add(fn);nativeSubscriptions++;return()=>callbacks.delete(fn);
 }};
 const win={document:doc,MatchState:source,setTimeout:()=>{}};
 const observable=createObservableMatchStore(win);win.VC_STATE_2059=observable;
 const domain=mountDomainDiagnostic(win),committed=mountCommittedPanel(win);
 assert.equal(nativeSubscriptions,1,'only the hub subscribes to the native state');
 assert.equal(callbacks.size,1);
 assert.equal(observable.diagnostics().subscribers,5,'four selected domains plus one audit invalidation');
 committed.runAudit();
 const panel=doc.getElementById('vc2057-committed');
 m.sets[0].rallies[0].corrected=true;
 for(const callback of callbacks)callback();
 doc.dispatchEvent(new Event('vc:matchstatechange'));
 await Promise.resolve();
 assert.equal(panel.dataset.state,'stale','historical action edits invalidate the on-demand audit');
 committed.dispose();domain.dispose();
 assert.equal(observable.diagnostics().subscribers,0);
 observable.dispose();assert.equal(callbacks.size,0);
});

test('V20.5.9 is versioned, included in Vite/PWA and has no second writer',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const entry=fs.readFileSync(path.join(root,'src/vc2055-entry.ts'),'utf8');
 const pkg=require('./package.json');
 assert.equal(pkg.version,'20.5.38');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.38'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.38'));
 assert.ok(sw.includes('observable-state-20.5.9'));
 assert.ok(css.includes('.vc2059-observable'));
 assert.ok(entry.includes('mountObservablePanel(window)'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc2059-observable-state.test.cjs'));
 for(const file of ['src/state/match-observable.ts','src/state/runtime.ts']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.equal(source.includes(forbidden),false,`${file}: ${forbidden}`);
 }
});
