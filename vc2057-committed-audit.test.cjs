'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const compiled=()=>import('./vc2055-domain-core.mjs');
const root=__dirname;

const sample=()=>({
 id:'private-match-id',opponent:'private-team',status:'live',currentSet:1,sets:[{number:1,rallies:[
  {id:101,servingBefore:'opponent',rotationBefore:1,opponentRotationBefore:5,
   winner:'ours',scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},
   actions:[{id:1,code:'007A#',team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7,playerNameSnapshot:'PRIVATE-PLAYER'}]},
  {id:102,servingBefore:'ours',rotationBefore:6,opponentRotationBefore:5,
   winner:'opponent',scoreBefore:{us:1,opponent:0},scoreAfter:{us:1,opponent:1},
   actions:[{id:2,code:'R12S=',team:'opponent',skill:'S',evaluation:'=',playerNumberSnapshot:12,playerNameSnapshot:'PRIVATE-RIVAL'}]}
 ]}],liveRally:{id:103,actions:[{id:3,code:'9R+',team:'ours',skill:'R',evaluation:'+',playerNumberSnapshot:9}]}
});

test('stored codes are checked from the canonical record without the original parser',async()=>{
 const {classifyStoredAction}=await compiled();
 assert.deepEqual({...classifyStoredAction({code:'007A#',team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:'7'})},{kind:'agree',skill:'A'});
 assert.equal(classifyStoredAction({code:'R12S=',team:'opponent',skill:'S',evaluation:'=',playerNumberSnapshot:12}).kind,'agree');
 assert.equal(classifyStoredAction({code:'7A#',team:'ours',skill:'A',evaluation:'=',playerNumberSnapshot:7}).kind,'difference');
 assert.equal(classifyStoredAction({code:'7A#',team:'ours',skill:'A',evaluation:'#'}).kind,'unverified');
 assert.equal(classifyStoredAction({code:'*12S#',team:'ours',skill:'S',evaluation:'#',playerNumberSnapshot:12}).kind,'coverage-gap');
 assert.equal(classifyStoredAction({skill:'A',evaluation:'#',playerNumberSnapshot:7}).kind,'no-code');
 assert.equal(classifyStoredAction(null).kind,'unverified');
});

test('committed audit verifies actual actions, rally scores and next-rally rotations',async()=>{
 const {auditCommittedMatch}=await compiled(),match=sample(),before=JSON.stringify(match);
 const report=auditCommittedMatch(match);
 assert.equal(report.version,'20.5.7');
 assert.equal(report.matchAvailable,true);
 assert.equal(report.truncated,false);
 assert.deepEqual({...report.counters},{
  actions:3,agree:3,difference:0,coverageGap:0,unverified:0,noCode:0,
  rallies:2,scoreVerified:2,scoreInconsistent:0,scoreUnknown:0,
  scoreLinksChecked:1,scoreLinksMismatch:0,rotationsChecked:1,rotationsMismatch:0
 });
 assert.equal(report.recent.length,0);
 assert.equal(JSON.stringify(match),before,'inspection cannot rewrite a score, code or rally');
 assert.equal(Object.isFrozen(report),true);
 assert.equal(Object.isFrozen(report.counters),true);
 assert.equal(Object.isFrozen(report.recent),true);
 assert.equal(Object.isFrozen(report.limitations),true);
 assert.equal(auditCommittedMatch(null).matchAvailable,false);
});

test('only explicit mismatches are highlighted, and report never includes players or codes',async()=>{
 const {auditCommittedMatch}=await compiled(),match=sample();
 match.sets[0].rallies[0].actions[0].evaluation='=';
 match.sets[0].rallies[0].scoreAfter.us=5;
 match.sets[0].rallies[1].servingBefore='opponent';
 match.liveRally.actions.push({code:'*123A#',team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:123});
 const report=auditCommittedMatch(match);
 assert.equal(report.counters.difference,1);
 assert.equal(report.counters.scoreInconsistent,1);
 assert.equal(report.counters.scoreLinksMismatch,1);
 assert.equal(report.counters.rotationsMismatch,1);
 assert.equal(report.counters.coverageGap,1);
 const kinds=report.recent.map(item=>item.kind);
 for(const name of ['difference','score','score-sequence','rotation','coverage-gap'])assert.ok(kinds.includes(name),name);
 const json=JSON.stringify(report);
 for(const prohibited of ['PRIVATE-PLAYER','PRIVATE-RIVAL','private-match-id','private-team','007A#','R12S=','*123A#','playerNumberSnapshot','playerNameSnapshot','matchId'])
  assert.ok(!json.includes(prohibited),'leak '+prohibited);
 assert.ok(report.recent.every(row=>/^S\d+ · R\d+|^En curso/.test(row.location)));
});

test('unknown scores stay unknown; no definitive rotation finding without enough facts',async()=>{
 const {auditCommittedMatch}=await compiled();
 const report=auditCommittedMatch({sets:[{rallies:[
  {actions:[{code:'7A#',team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7}]},
  {winner:'ours',scoreAfter:{us:1,opponent:0}}
 ]}]});
 assert.equal(report.counters.rallies,2);
 assert.equal(report.counters.scoreUnknown,2);
 assert.equal(report.counters.rotationsChecked,0);
 assert.equal(report.counters.scoreLinksChecked,0);
 assert.equal(report.counters.scoreInconsistent,0);
 assert.equal(report.counters.difference,0);
});

test('limits protect against pathological data while marking the report incomplete',async()=>{
 const {auditCommittedMatch}=await compiled();
 const tooMany=Array.from({length:20001},()=>({actions:[]}));
 const report=auditCommittedMatch({sets:[{rallies:tooMany}]});
 assert.equal(report.truncated,true);
 assert.equal(report.counters.rallies,20000);
 assert.ok(report.recent.length<=80);
 const action={code:'7A#',team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7};
 const actions=Array.from({length:60001},()=>action);
 const actionReport=auditCommittedMatch({sets:[{rallies:[{actions}]}]});
 assert.equal(actionReport.truncated,true);
 assert.equal(actionReport.counters.actions,60000);
});

test('Gestión mounts only a manual audit; change events invalidate instead of scanning live',async()=>{
 const {mountCommittedPanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,document){super();this.tagName=tag;this.document=document;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attributes={};this.disabled=false;}
  set id(value){this._id=value;this.document.items.set(value,this)}
  get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  append(...children){for(const child of children){this.children.push(child);child.parentNode=this}}
  setAttribute(k,v){this.attributes[k]=v}
  insertAdjacentElement(position,element){const parent=position==='afterbegin'?this:this.parentNode;const index=position==='afterbegin'?0:parent.children.indexOf(this)+1;parent.children.splice(index,0,element);element.parentNode=parent}
  replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children)}
  remove(){if(!this.parentNode)return;this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map();this.body=this.createElement('body')}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('main');host.id='v11-management';host.className='view active';
 const previous=doc.createElement('section');previous.id='vc2056-shadow';host.append(previous);
 const callbacks=new Set(),timers=[],match=sample();
 let readCount=0;
 const state={getActive:()=>{readCount++;return match},subscribe:fn=>{callbacks.add(fn);return()=>callbacks.delete(fn)}};
 const win={document:doc,MatchState:state,setTimeout:fn=>{timers.push(fn);return timers.length}};
 const api=mountCommittedPanel(win);
 assert.strictEqual(mountCommittedPanel(win),api);
 assert.equal(api.readOnly,true);
 assert.equal(host.children[1].id,'vc2057-committed');
 assert.equal(readCount,0,'mount and subscriptions must not scan the match');
 assert.equal(callbacks.size,1);
 for(const fn of callbacks)fn();
 doc.dispatchEvent(new Event('vc:matchstatechange'));
 assert.equal(readCount,0,'live notifications only invalidate');
 const checked=api.runAudit();
 assert.equal(checked.counters.actions,3);
 assert.equal(readCount,1);
 assert.equal(api.getReport(),checked);
 for(const fn of callbacks)fn();
 assert.equal(readCount,1);
 assert.equal(host.children[1].dataset.state,'stale');
 const buttons=host.children[1].children.find(child=>child.className==='vc2057-actions').children;
 assert.equal(buttons[1].disabled,true,'stale report cannot be exported');
 buttons[0].dispatchEvent(new Event('click'));
 assert.equal(timers.length,1);
 timers.shift()();
 assert.equal(api.getReport().counters.actions,3);
 assert.equal(buttons[1].disabled,false);
 api.dispose();
 assert.equal(callbacks.size,0);
 assert.equal(win.VC_COMMITTED_2057,undefined);
 assert.equal(host.children.length,1);
 doc.dispatchEvent(new Event('vc:matchstatechange'));
 assert.equal(readCount,2);
});

test('release sources use one TS bundle, preserve native writers and carry a new cache revision',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const pkg=require('./package.json');
 assert.equal(pkg.version,'20.6.4');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2057-committed-audit.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.4'));
 assert.ok(html.includes('vc2055-domain.css?v=20.6.4'));
 assert.ok(css.includes('.vc2057-committed'));
 assert.ok(sw.includes('committed-audit-20.5.7'));
 const {auditCommittedMatch,mountCommittedPanel}=await compiled();
 assert.equal(typeof auditCommittedMatch,'function');
 assert.equal(typeof mountCommittedPanel,'function');
 for(const name of ['src/domain/committed-audit.ts','src/domain/committed-runtime.ts']){
  const source=fs.readFileSync(path.join(root,name),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.equal(source.includes(forbidden),false,`${name}: ${forbidden}`);
 }
 const built=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.match(built,/assets\/index-[\w-]+\.js/);
});
