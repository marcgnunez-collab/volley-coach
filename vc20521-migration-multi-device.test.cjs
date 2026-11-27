'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const legacy=require('./test-audit/fixtures/v2012-legacy-device-validator.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const stamp='2026-11-19T10:30:00.000Z';
const fixture=()=>({cloud:{connected:true,lastObservedRemoteStamp:stamp,
 lastConfirmedWriteStamp:stamp,lastAppliedRemoteStamp:stamp,lastReadAt:100},
 device:{realtimeState:'SUBSCRIBED'},journal:{pendingCount:0}});

test('real legacy V20.1.2 report is byte-for-byte equivalent to the new TypeScript API',async()=>{
 const mod=await compiled();
 const scenarios=[
  fixture(),{}, {cloud:{dirty:true,blockedReason:'PRIVATE',accountId:'PRIVATE-ACCOUNT'},
   journal:{pendingCount:2,lastError:'PRIVATE-STORAGE-ERROR'}},
  {cloud:{lastObservedRemoteStamp:'2026-11-19T10:30:00.000+01:00',
   lastAppliedRemoteStamp:'garbage',lastReadAt:'10',lastWriteAt:-9},
   journal:{pendingCount:null}},
  {cloud:{connected:false,lastConfirmedWriteStamp:'2026-99-99T13:00:00Z'},
   device:{realtimeState:'CONNECTING'},journal:{pendingCount:-7}}
 ];
 for(const sample of scenarios){
  const input={...sample,now:10000000};
  assert.deepEqual(mod.reportDeviceValidation(input),legacy.report(input),JSON.stringify(sample));
  const raw=legacy.report(input);
  assert.deepEqual(mod.parseDeviceValidation(JSON.stringify(raw)),legacy.parseReport(JSON.stringify(raw)));
 }
});

test('deterministic permutations of CAS markers and offline flags preserve original comparison decisions',async()=>{
 const mod=await compiled();
 const examples=[
  {connected:true,dirty:false,blockedReason:'',pendingCount:0,write:stamp,applied:stamp},
  {connected:false,dirty:false,blockedReason:'',pendingCount:0,write:stamp,applied:stamp},
  {connected:true,dirty:true,blockedReason:'',pendingCount:1,write:stamp,applied:''},
  {connected:true,dirty:false,blockedReason:'review',pendingCount:0,write:stamp,applied:stamp},
  {connected:true,dirty:false,blockedReason:'',pendingCount:0,write:'',applied:''},
  {connected:true,dirty:false,blockedReason:'',pendingCount:null,write:stamp,applied:stamp}
 ];
 for(const left of examples)for(const right of examples){
  const asInput=value=>({cloud:{connected:value.connected,dirty:value.dirty,
   blockedReason:value.blockedReason,lastConfirmedWriteStamp:value.write,
   lastAppliedRemoteStamp:value.applied},journal:{pendingCount:value.pendingCount},now:10000000});
  const l=legacy.report(asInput(left)),r=legacy.report(asInput(right));
  assert.deepEqual(mod.compareDeviceValidation(l,r),legacy.compareReports(l,r));
 }
});

test('invalid report imports are rejected with the same native validation policy',async()=>{
 const mod=await compiled(),r=legacy.report({...fixture(),now:10000000});
 const bad=['{}','{invalid',JSON.stringify({...r,schema:'PRIVATE'}),
  JSON.stringify({...r,dirty:'yes'}),JSON.stringify({...r,pendingJournal:-1}),
  JSON.stringify({...r,createdAt:'not a date'})];
 for(const input of bad){
  assert.throws(()=>legacy.parseReport(input));
  assert.throws(()=>mod.parseDeviceValidation(input));
 }
});

test('V20.5.21 exposes the original public global API shape from a single TypeScript module',async()=>{
 const {installMultiDeviceAPI,reportDeviceValidation,parseDeviceValidation,
  compareDeviceValidation}=await compiled();
 const win={};
 const api=installMultiDeviceAPI(win);
 assert.strictEqual(win.VC_SYNC_2012,api);
 assert.equal(api.VERSION,'20.1.2');
 assert.equal(api.SCHEMA,'vc-multi-device-validation');
 assert.strictEqual(api.report,reportDeviceValidation);
 assert.strictEqual(api.parseReport,parseDeviceValidation);
 assert.strictEqual(api.compareReports,compareDeviceValidation);
 assert.equal(typeof api.mount,'function');
});

test('migrated panel renders in the existing cloud modal, remains idempotent and disposes',async()=>{
 const {mountMultiDevicePanel,installMultiDeviceAPI}=await compiled();
 class Element extends EventTarget{
  constructor(tag,document){super();this.tagName=tag;this.document=document;this.children=[];
   this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attributes={};
   this.isConnected=false;}
  set id(value){this._id=value;this.document.items.set(value,this);}
  get id(){return this._id||'';}
  append(...elements){for(const element of elements){element.parentNode=this;element.isConnected=true;this.children.push(element);}}
  appendChild(element){this.append(element);return element;}
  set innerHTML(value){this._html=value;
   for(const match of value.matchAll(/id="([^"]+)"/g)){const child=this.document.createElement('div');
    child.id=match[1];this.append(child);}}
  get innerHTML(){return this._html||'';}
  querySelector(selector){return selector==='.vc16040-card'?this.card||null:null;}
  insertAdjacentElement(_where,element){this.parentNode?.append(element);}
  remove(){if(!this.parentNode)return;this.parentNode.children=this.parentNode.children.filter(x=>x!==this);
   this.parentNode=null;this.isConnected=false;}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map();this.readyState='complete';this.body=new Element('body',this);}
  createElement(tag){return new Element(tag,this);}
  getElementById(id){return this.items.get(id)||null;}
 }
 const doc=new Document(),modal=doc.createElement('div'),card=doc.createElement('div');
 modal.id='vc16040-sync-modal';modal.card=card;doc.body.append(modal);modal.append(card);
 const win=new EventTarget();win.document=doc;win.setTimeout=(fn)=>{fn();return 1;};
 win.VC_V962_CLOUD_EFFICIENT={diagnostics:()=>({connected:true,lastConfirmedWriteStamp:stamp}),
  getAccountId:()=> 'PRIVATE-ACCOUNT'};
 win.VC_DEVICE_SYNC={diagnostics:()=>({realtimeState:'SUBSCRIBED'})};
 let reads=0;win.VC_SYNC_2011_JOURNAL={async inspect(){reads++;return {pendingCount:1};}};
 installMultiDeviceAPI(win);
 const panel=mountMultiDevicePanel(win);
 assert.ok(panel);
 await new Promise(resolve=>setImmediate(resolve));
 await panel.refresh();
 assert.equal(doc.getElementById('vc2012-pending').textContent,'1');
 assert.equal(doc.getElementById('vc2012-uploaded').textContent,stamp);
 assert.strictEqual(mountMultiDevicePanel(win),panel);
 assert.ok(reads>=1);
 const container=doc.getElementById('vc2012-multi-validation');
 assert.equal(container.parentNode,card);
 panel.dispose();
 assert.equal(container.parentNode,null);
 assert.equal(mountMultiDevicePanel(win).readOnly,true);
});

test('legacy V20.1.2 script stays for regression, but exactly one active UI is loaded from Vite',()=>{
 const html=read('index.html'),entry=read('src/vc2055-entry.ts'),sw=read('service-worker.js');
 assert.ok(!html.includes('src="./211-vc2012-multi-device-validation.js'));
 assert.ok(!html.includes('id="vc2012-multi-device-validation"'));
 assert.ok(html.includes('vc2071-device-match-unified.css?v=20.7.1'));
 assert.ok(entry.includes('installMultiDeviceAPI(window)'));
 assert.ok(entry.includes('mountMultiDevicePanel(window)'));
 assert.ok(read('test-audit/fixtures/v2012-legacy-device-validator.js').includes('VC_SYNC_2012'));
 assert.ok(sw.includes('domain-20.5.5'));
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
