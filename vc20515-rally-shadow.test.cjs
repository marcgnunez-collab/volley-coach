'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const lineup=()=>({ours:{p1:1,p2:2,p3:3,p4:4,p5:5,p6:6},
 opponent:{p1:11,p2:12,p3:13,p4:14,p5:15,p6:16}});
function fixture(){
 return {id:'PRIVATE-MATCH-ID',opponent:'PRIVATE-TEAM',status:'live',currentSet:1,
  servingTeam:'opponent',rotationNo:1,opponentRotationNo:5,
  lineup:lineup(),sets:[{number:1,scoreUs:0,scoreOpponent:0,finished:false,rallies:[]}],
  liveRally:{id:'PRIVATE-LIVE-ID',actions:[],startSnapshot:null}};
}
function confirm(match,{badScore=false,badServe=false}={}){
 const set=match.sets[0],last=set.rallies.length;
 const start={us:set.scoreUs,opponent:set.scoreOpponent};
 const r={id:'PRIVATE-RALLY-'+last,winner:'ours',servingBefore:match.servingTeam,
  rotationBefore:match.rotationNo,opponentRotationBefore:match.opponentRotationNo,
  scoreBefore:start,scoreAfter:{us:start.us+1+(badScore?1:0),opponent:start.opponent},
  actions:[{code:'PRIVATE-CODE',playerNameSnapshot:'PRIVATE-PLAYER'}],
  lineupBefore:lineup(),baseLineupBefore:lineup(),liberoBefore:{auto:false},lineupRolesBefore:{ours:{},opponent:{}}};
 set.rallies.push(r);set.scoreUs=start.us+1;
 if(!badServe)match.servingTeam='ours';
 if(r.servingBefore==='opponent')match.rotationNo=match.rotationNo===1?6:match.rotationNo-1;
 match.liveRally={id:'new-live-'+last,actions:[],startSnapshot:null};
 return r;
}
function undo(match){
 const set=match.sets[0],r=set.rallies.pop();
 set.scoreUs=r.scoreBefore.us;set.scoreOpponent=r.scoreBefore.opponent;
 match.servingTeam=r.servingBefore;match.rotationNo=r.rotationBefore;
 match.opponentRotationNo=r.opponentRotationBefore;
 match.lineup=structuredClone(r.lineupBefore);
 match.liveRally={id:r.id,actions:r.actions,
  liveVideoSessionId:r.liveVideoSessionId,liveVideoStart:r.liveVideoStart,
  liveVideoEnd:r.liveVideoEnd,liveVideoLinkedAt:r.liveVideoLinkedAt};
}

test('session ignores old history, compares a single newly committed point, and coalesces duplicates',async()=>{
 const {createRallyShadowSession}=await compiled(),session=createRallyShadowSession(),match=fixture();
 assert.equal(session.observe(match),null,'existing match is a baseline');
 assert.equal(session.snapshot().counters.observed,0);
 assert.equal(session.snapshot().counters.skipped,0);
 confirm(match);
 const observed=session.observe(match);
 assert.equal(observed.operation,'point');assert.equal(observed.verdict,'agree');
 assert.equal(session.observe(match),null,'duplicate signals do not double-count');
 const report=session.snapshot();
 assert.equal(report.counters.points,1);assert.equal(report.counters.agree,1);
 assert.equal(report.counters.difference,0);
 assert.equal(report.version,'20.5.15');assert.equal(report.readOnly,true);
 assert.equal(Object.isFrozen(report),true);assert.equal(Object.isFrozen(report.counters),true);
 session.dispose();assert.equal(session.observe(match),null);
});

test('incorrect recorded score or service is detected without rewriting the native record',async()=>{
 const {createRallyShadowSession,compareConfirmedPoint}=await compiled();
 const match=fixture(),session=createRallyShadowSession();session.observe(match);
 const last=confirm(match,{badScore:true,badServe:true}),before=JSON.stringify(match);
 const finding=session.observe(match);
 assert.equal(finding.verdict,'difference');
 assert.ok(finding.areas.includes('score'));
 assert.ok(finding.areas.includes('service'));
 assert.equal(compareConfirmedPoint(match,match.sets[0],last).verdict,'difference');
 assert.equal(JSON.stringify(match),before,'read-only observation cannot edit a rally');
 const json=JSON.stringify(session.snapshot());
 for(const privateValue of ['PRIVATE-PLAYER','PRIVATE-TEAM','PRIVATE-MATCH-ID','PRIVATE-CODE','PRIVATE-RALLY'])
  assert.equal(json.includes(privateValue),false,privateValue);
});

test('a native-like undo is verified against the prior point and its video/lineup markers',async()=>{
 const {createRallyShadowSession}=await compiled(),match=fixture(),session=createRallyShadowSession();
 session.observe(match);
 const rally=confirm(match);
 Object.assign(rally,{liveVideoSessionId:'PRIVATE-VIDEO',liveVideoStart:4,
  liveVideoEnd:12,liveVideoLinkedAt:'PRIVATE-TIME'});
 assert.equal(session.observe(match).verdict,'agree');
 undo(match);
 const verdict=session.observe(match);
 assert.equal(verdict.operation,'undo');assert.equal(verdict.verdict,'agree');
 assert.equal(session.snapshot().counters.undos,1);
 assert.equal(session.snapshot().counters.agree,2);
});

test('mismatched undo flags only observable differences, and arbitrary deletion is skipped',async()=>{
 const {createRallyShadowSession}=await compiled();
 const match=fixture(),session=createRallyShadowSession();session.observe(match);
 confirm(match);session.observe(match);undo(match);
 match.rotationNo=4;match.lineup.ours.p6=99;
 const verdict=session.observe(match);
 assert.equal(verdict.verdict,'difference');
 assert.ok(verdict.areas.includes('rotation'));
 assert.ok(verdict.areas.includes('lineup'));
 assert.equal(session.snapshot().counters.difference,1);
 confirm(match);session.observe(match);
 match.sets[0].rallies.pop();
 match.liveRally={id:'PRIVATE-OTHER-ACTION',actions:[]};
 assert.equal(session.observe(match),null);
 assert.equal(session.snapshot().counters.undos,1);
});

test('a different match, a new set, gaps and in-place corrections do not create false alarms',async()=>{
 const {createRallyShadowSession}=await compiled(),session=createRallyShadowSession();
 const first=fixture();session.observe(first);
 const second=fixture();assert.equal(session.observe(second),null);
 confirm(second);session.observe(second);
 second.sets[0].rallies.at(-1).scoreAfter.us=999;
 assert.equal(session.observe(second),null,'correction does not count as a native point');
 second.currentSet=2;second.sets.push({number:2,scoreUs:0,scoreOpponent:0,finished:false,rallies:[]});
 assert.equal(session.observe(second),null,'set switch is a baseline');
 const secondSet=second.sets[1];
 secondSet.rallies.push({id:'1'},{id:'2'});
 assert.equal(session.observe(second),null,'two rallies between signals are ambiguous');
 assert.equal(session.snapshot().counters.difference,0);
 assert.ok(session.snapshot().counters.skipped>=3);
});

test('no usable before/after data stays unverified, not marked as a definitive mismatch',async()=>{
 const {compareConfirmedPoint}=await compiled();
 const record=fixture(),set=record.sets[0];
 assert.equal(compareConfirmedPoint(record,set,{winner:'ours'}).verdict,'unverified');
 assert.equal(compareConfirmedPoint(null,set,null).verdict,'unverified');
});

test('privacy-safe findings remain bounded after a long sequence of mismatches',async()=>{
 const {createRallyShadowSession}=await compiled(),session=createRallyShadowSession(),match=fixture();
 session.observe(match);
 for(let index=0;index<65;index++){
  confirm(match,{badScore:true});
  session.observe(match);
 }
 const report=session.snapshot();
 assert.equal(report.counters.observed,65);
 assert.equal(report.counters.difference,65);
 assert.equal(report.recent.length,40);
 assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
 assert.equal(Object.isFrozen(report.recent),true);
});

test('Gestión keeps one passive observer and defers reads outside the notification handler',async()=>{
 const {mountRallyShadowPanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,document){super();this.tagName=tag;this.document=document;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attributes={};}
  set id(value){this._id=value;this.document.items.set(value,this)}get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  append(...children){for(const child of children){this.children.push(child);child.parentNode=this}}
  setAttribute(k,v){this.attributes[k]=v}
  insertAdjacentElement(position,element){const parent=position==='afterbegin'?this:this.parentNode;const index=position==='afterbegin'?0:parent.children.indexOf(this)+1;parent.children.splice(index,0,element);element.parentNode=parent}
  replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children)}
  remove(){if(!this.parentNode)return;this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{constructor(){super();this.items=new Map()}createElement(tag){return new Element(tag,this)}getElementById(id){return this.items.get(id)||null}}
 const document=new Document(),host=document.createElement('main');host.id='v11-management';host.className='view active';
 const anchor=document.createElement('section');anchor.id='vc2059-observable';host.append(anchor);
 const match=fixture(),listeners=new Set(),pending=new Map();
 let readCount=0,nextTimer=0;
 const native={getActive(){readCount++;return match}};
 const store={subscribe(topic,fn){assert.equal(topic,'change');listeners.add(fn);return()=>listeners.delete(fn)}};
 const win={document,MatchState:native,VC_STATE_2059:store,
  setTimeout(fn){const id=++nextTimer;pending.set(id,fn);return id},clearTimeout(id){pending.delete(id)}};
 const api=mountRallyShadowPanel(win);
 assert.strictEqual(api,mountRallyShadowPanel(win));
 assert.equal(api.readOnly,true);assert.equal(listeners.size,1);
 assert.equal(readCount,1,'mount only takes a constant-time baseline');
 confirm(match);
 for(const fn of listeners){fn();fn();fn();}
 assert.equal(readCount,1,'a native event does not synchronously inspect the match');
 assert.equal(pending.size,1,'coalesced into one task');
 pending.values().next().value();pending.clear();
 assert.equal(readCount,2);
 assert.equal(api.getReport().counters.agree,1);
 api.clearReport();assert.equal(api.getReport().counters.observed,0);
 confirm(match);for(const fn of listeners)fn();
 assert.equal(pending.size,1);
 api.dispose();assert.equal(pending.size,0);assert.equal(listeners.size,0);
 assert.equal(win.VC_SHADOW_20515,undefined);assert.equal(host.children.length,1);
});

test('release keeps only typed readers and one original writer while publishing the Gestión panel',()=>{
 const html=read('index.html'),sw=read('service-worker.js'),css=read('vc2055-domain.css'),pkg=require('./package.json');
 assert.equal(pkg.version,'20.7.4');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20515-rally-shadow.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(html.includes('vc2055-domain.css?v=20.7.0'));
 assert.ok(sw.includes('rally-shadow-20.5.15'));
 assert.ok(css.includes('.vc20515-shadow'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountRallyShadowPanel(window)'));
 for(const file of ['src/domain/rally-shadow.ts','src/domain/rally-shadow-runtime.ts']){
  const text=read(file);
  for(const illegal of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase',
   'cloudClient.', 'getSnapshot(', 'v121AwardPoint=', 'window.scoutAwardPoint='])
   assert.equal(text.includes(illegal),false,`${file} ${illegal}`);
 }
});
