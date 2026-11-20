'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const legacy=fs.readFileSync(path.join(root,'021-core-scouting-v150-monolithic.js'),'utf8');
const sourceHTML=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

const domain=()=>import('./vc2055-domain-core.mjs');
function nativeFunction(name,nextMarker){
 const start=legacy.indexOf('function '+name+'(');
 assert.ok(start>=0,name);
 const end=legacy.indexOf(nextMarker,start);
 assert.ok(end>start,name+' end');
 return vm.runInNewContext(`(function(){${legacy.slice(start,end)}return ${name};})()`);
}

test('TypeScript domain compiles to stable ES module and Vite uses it in the production bundle',async()=>{
 const mod=await domain();
 for(const name of ['inspectCodeShape','verifyRallyScore','nextRotation','projectPoint','inspectSubstitution','sideOutBreakPoint','attackEfficiency','inspectMatchDomain'])
  assert.equal(typeof mod[name],'function',name);
 assert.ok(sourceHTML.includes('./vc2055-domain-core.mjs?v=20.5.58'));
 assert.ok(sourceHTML.includes('./vc2055-domain.css?v=20.5.58'));
 assert.ok(sw.includes("'./vc2055-domain-core.mjs'"));
 assert.ok(sw.includes('domain-20.5.5'));
 const built=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 assert.ok(!built.includes('src/vc2055-entry.ts'));
 assert.ok(!built.includes('vc2055-domain-core.mjs?v=20.5.58'));
 assert.ok(fs.existsSync(path.join(root,'dist/vc2055-domain-core.mjs')));
});

test('score traces agree with V20.5.2 for valid, invalid and incomplete rallies',async()=>{
 const {verifyRallyScore,auditMatchScores}=await domain();
 const {verifyScoreTrace}=await import('./vc2052-match-contract.mjs');
 const examples=[
  {winner:'ours',scoreBefore:{us:3,opponent:4},scoreAfter:{us:4,opponent:4}},
  {winner:'opponent',scoreBefore:{us:3,opponent:4},scoreAfter:{us:4,opponent:4}},
  {winner:'ours',scoreBefore:{us:3,opponent:4}},
  {winner:'ours',scoreBefore:{us:-1,opponent:4},scoreAfter:{us:0,opponent:4}},
  {winner:'opponent',scoreBefore:{us:3,opponent:4},scoreAfter:{us:3,opponent:5}}
 ];
 for(const rally of examples){
  const actual=verifyRallyScore(rally).state;
  const expected=verifyScoreTrace(rally).state;
  assert.equal(actual,expected==='valid'?'verified':expected);
 }
 const match={sets:[{rallies:examples}]};
 const frozen=JSON.stringify(match),audit=auditMatchScores(match);
 assert.deepEqual({...audit},{verified:2,inconsistent:1,unknown:2,rallies:5});
 assert.equal(JSON.stringify(match),frozen);
});

test('nextRotation matches the actual legacy helper in both directions for every rotation',async()=>{
 const {nextRotation,projectPoint}=await domain();
 const native=nativeFunction('scoutV6107NextRotation','function scoutV6107OpponentHasData');
 for(let r=1;r<=6;r++)for(const dir of [1,-1])assert.equal(nextRotation(r,dir),native(r,dir));
 assert.equal(nextRotation(0),null);
 const initial={score:{us:7,opponent:8},serving:'opponent',rotationUs:1,rotationOpponent:5};
 const original=JSON.stringify(initial),own=projectPoint(initial,'ours');
 assert.deepEqual({...own.score},{us:8,opponent:8});
 assert.equal(own.rotationUs,6);assert.equal(own.rotationOpponent,5);
 assert.equal(own.serving,'ours');assert.equal(own.sideOut,true);
 const rival=projectPoint(initial,'opponent');
 assert.equal(rival.rotationUs,1);assert.equal(rival.rotationOpponent,5);
 assert.equal(rival.sideOut,false);
 assert.equal(projectPoint({...initial,score:{}},'ours').state,'unknown');
 assert.equal(JSON.stringify(initial),original);
});

test('attack efficiency agrees with legacy arithmetic and SO/BP exclude unknown results',async()=>{
 const {attackEfficiency,sideOutBreakPoint}=await domain();
 const native=nativeFunction('scoutV640Eff','function scoutV640Key');
 const actions=['#','#','=','/','+','!'].map(evaluation=>({skill:'A',evaluation}));
 assert.equal(attackEfficiency(actions).efficiencyPct,native(actions));
 assert.equal(attackEfficiency(actions).attempts,6);
 assert.equal(attackEfficiency([]).efficiencyPct,null);
 const phases=sideOutBreakPoint([
  {servingBefore:'opponent',winner:'ours'},
  {servingBefore:'opponent',winner:'opponent'},
  {servingBefore:'ours',winner:'ours'},
  {servingBefore:'ours',winner:'opponent'},
  {servingBefore:'ours'},
  {winner:'ours'}
 ]);
 assert.deepEqual({...phases.sideOut},{attempts:2,won:1,percent:50,unknown:0});
 assert.deepEqual({...phases.breakPoint},{attempts:2,won:1,percent:50,unknown:1});
});

test('code grammar separates a syntax candidate from native legality',async()=>{
 const {inspectCodeShape,compareNativeCode}=await domain();
 for(const code of ['7A#','R7R+.6','12A#.4B>5D::K1~T','3B#.4&12','12A#.4B>C5']){
  const shape=inspectCodeShape(code);assert.equal(shape.state,'candidate',code);
 }
 assert.equal(inspectCodeShape('12A#.4').state,'unsupported');
 assert.equal(inspectCodeShape('*12S#').state,'unsupported');
 assert.equal(inspectCodeShape('4A#.1>C5').state,'candidate');
 assert.equal(inspectCodeShape('4S#.1>C5').state,'unsupported');
 assert.equal(inspectCodeShape('').state,'empty');
 const good={action:{team:'ours',skill:'A',evaluation:'#',playerNumberSnapshot:7}};
 assert.equal(compareNativeCode('7A#',good).state,'agree');
 assert.equal(compareNativeCode('7A#',{action:{...good.action,skill:'S'}}).state,'disagree');
 assert.equal(compareNativeCode('7A#',{error:'No existe dorsal'}).state,'unknown');
});

test('substitution check detects local conflicts but never claims official eligibility',async()=>{
 const {inspectSubstitution}=await domain();
 const base={position:'p3',outgoingPlayer:3,incomingPlayer:9,lineup:{p1:1,p2:2,p3:3,p4:4,p5:5,p6:6}};
 const good=inspectSubstitution(base);
 assert.equal(good.state,'plausible');assert.equal(good.officialLegality,'not-evaluated');
 assert.equal(inspectSubstitution({...base,incomingPlayer:4}).state,'blocked');
 assert.equal(inspectSubstitution({...base,liberoActivePosition:'p3'}).state,'blocked');
 assert.equal(inspectSubstitution({...base,matchStatus:'finished'}).state,'blocked');
 assert.equal(inspectSubstitution({...base,outgoingPlayer:99}).state,'blocked');
 assert.equal(inspectSubstitution({...base,incomingPlayer:null}).state,'unknown');
 assert.equal(inspectSubstitution({...base,lineup:null}).state,'unknown');
});

test('read-only overview uses exact match facts and never changes the input',async()=>{
 const {inspectMatchDomain}=await domain();
 const match={status:'live',rotationNo:1,opponentRotationNo:5,sets:[{rallies:[
  {winner:'ours',servingBefore:'opponent',scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},actions:[{team:'ours',skill:'A',evaluation:'#'}]},
  {winner:'opponent',servingBefore:'ours',actions:[{team:'ours',skill:'A',evaluation:'='}]}
 ]}]};
 const original=JSON.stringify(match),result=inspectMatchDomain(match);
 assert.equal(result.score.verified,1);assert.equal(result.score.unknown,1);
 assert.equal(result.sideOutPct,100);assert.equal(result.breakPointPct,0);
 assert.equal(result.attackEfficiencyPct,0);assert.equal(result.rotation,'R1 · Rival R5');
 assert.equal(JSON.stringify(match),original);
 assert.equal(inspectMatchDomain(null).matchAvailable,false);
});

test('diagnostic mounts in Gestión, reads canonical data and disposes event listeners',async()=>{
 const {mountDomainDiagnostic}=await domain();
 class Element extends EventTarget{
  constructor(tag,document){super();this.tagName=tag;this.document=document;this.children=[];this.parentNode=null;this.className='';this.textContent='';this.dataset={};this.attributes={};}
  set id(value){this._id=value;this.document.items.set(value,this)}
  get id(){return this._id||''}
  get classList(){return {contains:name=>this.className.split(/\s+/).includes(name)}}
  append(...elements){for(const element of elements){element.parentNode=this;this.children.push(element)}}
  setAttribute(key,value){this.attributes[key]=value}
  insertAdjacentElement(position,element){assert.equal(position,'afterend');const parent=this.parentNode;const i=parent.children.indexOf(this);parent.children.splice(i+1,0,element);element.parentNode=parent;}
  remove(){if(!this.parentNode)return;const i=this.parentNode.children.indexOf(this);this.parentNode.children.splice(i,1);this.parentNode=null;}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('section');host.id='v11-management';host.className='view active';
 const prev=doc.createElement('section');prev.id='vc2053-modular-core';host.append(prev);
 const match={rotationNo:3,opponentRotationNo:2,sets:[{rallies:[{winner:'ours',servingBefore:'opponent',scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0}}]}]};
 const observers=new Set(),win={document:doc,MatchState:{getActive:()=>match,subscribe:fn=>{observers.add(fn);return()=>observers.delete(fn)}}};
 const api=mountDomainDiagnostic(win);
 assert.strictEqual(mountDomainDiagnostic(win),api);
 assert.equal(api.readOnly,true);
 assert.equal(api.inspectCurrent().score.verified,1);
 assert.equal(host.children[1].id,'vc2055-domain');
 assert.equal(observers.size,1);
 doc.dispatchEvent(new Event('vc:matchstatechange'));
 await Promise.resolve();
 api.dispose();
 assert.equal(observers.size,0);
 assert.equal(host.children.length,1);
 assert.equal(win.VC_DOMAIN_2055,undefined);
});

test('TypeScript source and generated domain module contain no second writer or storage path',()=>{
 const dir=path.join(root,'src/domain');
 const texts=fs.readdirSync(dir).filter(name=>name.endsWith('.ts')).map(name=>fs.readFileSync(path.join(dir,name),'utf8'));
 texts.push(fs.readFileSync(path.join(root,'src/vc2055-entry.ts'),'utf8'));
 for(const source of texts)for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
  assert.equal(source.includes(forbidden),false,forbidden);
});
