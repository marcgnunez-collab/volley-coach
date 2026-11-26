'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');

/* Exercise the actual V6.10.8, V8.3, V8.4, V8.6, V8.7 and V8.8 parser
 * wrappers, stubbing only roster lookup and unrelated normalization/rendering.
 * This is a syntax fixture, NOT a full native gameplay integration test.
 */
function nativeSyntaxHarness(lexerBridge,extensionsBridge){
 const legacy=fs.readFileSync(path.join(root,'021-core-scouting-v150-monolithic.js'),'utf8');
 const part=(start,end)=>{
  const a=legacy.indexOf(start);assert.ok(a>=0,start);
  const b=legacy.indexOf(end,a+start.length);assert.ok(b>a,`end after ${start}`);
  return legacy.slice(a,b);
 };
 const source=[
  part('function v6108NativeLex(raw){','function scoutV6108ParseRaw(raw,m,oldAction=null){'),
  part('function scoutV6108ParseRaw(raw,m,oldAction=null){','// Quick-code console'),
  part('const v20540ParserBase=scoutV6108ParseRaw;','window.v680ParseCode'),
  part('const v20538ExtensionStats=','/* V20.5.39 · This former V8.6 parser wrapper'),
  part('function v870LegacyExtension(original){','/* V20.5.39 · This former V8.7 parser wrapper'),
  part('function v880LegacyExtension(original){','/* V20.5.39 · One canonical extension wrapper'),
  part('const v20539ParserBase=scoutV6108ParseRaw;','window.v680ParseCode')
 ].join('\n');
 const ctx={
  window:{...(lexerBridge?{VC_SCOUT_LEXER_20537:lexerBridge}:{}),
   ...(extensionsBridge?{VC_SCOUT_EXTENSIONS_20538:extensionsBridge}:{})},
  scoutV6108IsContactSkill:skill=>skill==='R'||skill==='D',
  scoutV6108NormalizeZoneInput:(skill,start,end)=>({startZone:start||'',endZone:end||'',contactZone:end||start||''}),
  scoutV6108InferSource:()=>{},
  scoutFindOwnByNumber:number=>({id:Number(number),number,name:'TEST'}),
  scoutFindOpponentByNumber:number=>String(number),
  scoutNormalizeAction:a=>a,
  scoutBuildCode:a=>a.code||'',
  v830InferReceptionMeta:()=>{},
  v840InferBlockTarget:()=>{},
  v870SkillFromRaw:s=>s.match(/^(?:R)?\d+([SREABDFC])/)?.[1]||'',
  v880DataVolleyFields:()=>({})
 };
 vm.runInNewContext(source+'\nthis.parseNative=scoutV6108ParseRaw;',ctx,{timeout:1000});
 return code=>ctx.parseNative(code,{id:42,status:'live'});
}

test('V20.5.37 lexer survives all native parser wrapper layers without changing action fields',async()=>{
 const {installScoutingLexerBridge}=await compiled();
 const typed=nativeSyntaxHarness(installScoutingLexerBridge({}));
 const classic=nativeSyntaxHarness();
 const cases=['7A#','R7R+.6','3D+.5','4S+.1>5~JF^K1',
  '12A#.4B>5D::K1~T','3B#.4&12','12A#.4B>C5',
  '12A#.4>5*DC','12A#.4>5@2:PIPE',
  '7E+::31~Q|F%RAP?S1$X','R12S=~JP','12S#~U',
  '12A#.4','4S#.1>C5','12A#~XX'];
 for(const code of cases){
  const after=JSON.parse(JSON.stringify(typed(code)));
  const before=JSON.parse(JSON.stringify(classic(code)));
  assert.deepStrictEqual(after,before,'wrapper parity '+code);
 }
});

test('V20.5.38 typed subzones, cones and advanced modifiers retain all historical wrapper results',async()=>{
 const {installScoutingLexerBridge,installScoutingExtensionsBridge}=await compiled();
 const typed=nativeSyntaxHarness(installScoutingLexerBridge({}),installScoutingExtensionsBridge({}));
 const classic=nativeSyntaxHarness();
 const cases=['7A#','R7R+.6','3D+.5','4S+.1>5~JF^K1',
  '12A#.4B>5D::K1~T','3B#.4&12','12A#.4B>C5',
  '12A#.4>5*DC','12A#.4>5@2:PIPE',
  '7E+::31~Q|F%RAP?S1$X','R12S=~JP','12S#~U',
  '12A#.4','4S#.1>C5','12A#~XX','R7R+.6B',
  '8A#.2A>6D::K1~T^K2%TIP|F?X$Y'];
 for(const code of cases){
  const after=JSON.parse(JSON.stringify(typed(code)));
  const before=JSON.parse(JSON.stringify(classic(code)));
  assert.deepStrictEqual(after,before,'extended wrapper parity '+code);
 }
});

test('grammar V20.5.8 recognizes the historical native wrappers on representative inputs',async()=>{
 const native=nativeSyntaxHarness(),{inspectCodeShape}=await compiled();
 const examples=[
  '7A#','R7R+.6','3D+.5','4S+.1>5~JF^K1','12A#.4B>5D::K1~T',
  '3B#.4&12','12A#.4B>C5','12A#.4>5*DC',
  '12A#.4>5@2:PIPE','7E+::31~Q|F%RAP?S1$X',
  'R12S=~JP','12A#.4>5~T::31','12S#~U'
 ];
 for(const code of examples){
  const ref=native(code),typed=inspectCodeShape(code);
  assert.ok(ref?.action&&!ref.error,`native refused fixture ${code}: ${ref?.error}`);
  assert.equal(typed.state,'candidate',code);
  assert.equal(typed.team,ref.action.team,code);
  assert.equal(typed.skill,ref.action.skill,code);
  assert.equal(typed.evaluation,ref.action.evaluation,code);
 }
});

test('grammar deliberately declines invalid or unsupported raw command fragments',async()=>{
 const {inspectCodeShape}=await compiled();
 const invalid=[
  '*12S#','12A#.4','4S#.1>C5','12A#~XX','7A#^K9',
  '12A#.4>5*QQ','7A#@9','7A#::LONGCODE','3B#.4&1234',
  '7A#~JF~JP','12A#.4>C9','12A#.4B>5E','3R#.5C>9F',
  '7S#%TOOLONG99','7E#|G','7A#?TOOLONGCODE','7A#$TOOLONG'
 ];
 for(const code of invalid)assert.equal(inspectCodeShape(code).state,'unsupported',code);
 const native=nativeSyntaxHarness();
 for(const code of ['*12S#','12A#.4','4S#.1>C5','12A#~XX','7A#^K9','12A#.4>5*QQ']){
  const result=native(code);assert.ok(result?.error&&!result.action,code);
 }
});

test('typed modifiers are exact, frozen and do not accept duplicate or out-of-range entries',async()=>{
 const {inspectCodeShape}=await compiled();
 const code='12A#.4B>5D*DC~T:Z4^K1@2%TIP|F?X$Y';
 const parsed=inspectCodeShape(code);
 assert.equal(parsed.state,'candidate');
 assert.equal(parsed.startZone,'4B');assert.equal(parsed.endZone,'5D');
 assert.deepEqual({...parsed.modifiers},{
  serveType:null,combination:'Z4',dvCall:null,phase:'K1',blockers:'2',blockTarget:null,
  direction:'DC',tempo:'T',subtype:'TIP',setType:'F',special:'X',custom:'Y'
 });
 assert.equal(Object.isFrozen(parsed),true);assert.equal(Object.isFrozen(parsed.modifiers),true);
 const attack=inspectCodeShape('7A#.4B>C5::31~Q');
 assert.equal(attack.state,'candidate');assert.equal(attack.endZone,'C5');
 assert.equal(attack.modifiers.dvCall,'31');assert.equal(attack.modifiers.tempo,'Q');
 const reception=inspectCodeShape('R7R+.6');
 assert.equal(reception.startZone,null);assert.equal(reception.endZone,'6','a single reception zone is the contact zone');
 const block=inspectCodeShape('3B#.4&12');
 assert.equal(block.startZone,'4');assert.equal(block.endZone,null);
 assert.equal(inspectCodeShape('7A#~T~Q').state,'unsupported','duplicate tempo');
 assert.equal(inspectCodeShape('3B#.4&12&13').state,'unsupported','duplicate block target');
 assert.equal(inspectCodeShape('7A#::T:Q').state,'unsupported','duplicate DV calls');
 assert.equal(inspectCodeShape('7A#').modifiers.custom,null);
});

test('source remains pure and the original scouting records can be rechecked with the new grammar',async()=>{
 const {classifyStoredAction,auditCommittedMatch,inspectCodeShape}=await compiled();
 const match={id:'secret',sets:[{rallies:[{
  winner:'ours',scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},
  actions:[{code:'12A#.4B>C5::31~T',team:'ours',playerNumberSnapshot:12,skill:'A',evaluation:'#',playerNameSnapshot:'PRIVATE'}]
 }]}]};
 const before=JSON.stringify(match);
 assert.equal(classifyStoredAction(match.sets[0].rallies[0].actions[0]).kind,'agree');
 assert.equal(inspectCodeShape(match.sets[0].rallies[0].actions[0].code).modifiers.dvCall,'31');
 const report=auditCommittedMatch(match);
 assert.equal(report.counters.agree,1);
 assert.equal(report.counters.coverageGap,0);
 assert.equal(JSON.stringify(match),before);
 assert.ok(!JSON.stringify(report).includes('PRIVATE'));
 assert.ok(!JSON.stringify(report).includes('12A#.'));
});

test('Gestión reference mounts after the committed audit, only runs when requested and disposes',async()=>{
 const {mountGrammarPanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.className='';this.children=[];this.parentNode=null;this.textContent='';this.dataset={};this.attrs={};this.value='';}
  set id(v){this._id=v;this.doc.nodes.set(v,this)}
  get id(){return this._id||''}
  append(...els){for(const e of els){e.parentNode=this;this.children.push(e)}}
  setAttribute(k,v){this.attrs[k]=v}
  insertAdjacentElement(where,el){assert.equal(where,'afterend');const p=this.parentNode;p.children.splice(p.children.indexOf(this)+1,0,el);el.parentNode=p}
  replaceChildren(...els){this.children=[];this.append(...els)}
  remove(){if(!this.parentNode)return;const p=this.parentNode;p.children.splice(p.children.indexOf(this),1);this.parentNode=null}
 }
 class Document extends EventTarget{
  constructor(){super();this.nodes=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.nodes.get(id)||null}
 }
 const doc=new Document(),host=doc.createElement('section');host.id='v11-management';
 const anchor=doc.createElement('section');anchor.id='vc2057-committed';host.append(anchor);
 const win={document:doc},api=mountGrammarPanel(win);
 assert.equal(api.version,'20.5.8');assert.equal(api.readOnly,true);
 assert.equal(host.children[1].id,'vc2058-grammar');
 assert.strictEqual(mountGrammarPanel(win),api);
 const input=doc.getElementById('vc2058-code'),panel=host.children[1];
 const row=panel.children.find(child=>child.className==='vc2058-entry');
 input.value='7A#.4B>C5::31~T';
 row.children[2].dispatchEvent(new Event('click'));
 assert.equal(panel.dataset.state,'candidate');
 const result=panel.children.find(child=>child.className==='vc2058-result');
 assert.ok(result.children.length>=4);
 const tokens=result.children.map(child=>child.children.map(item=>item.textContent).join(':'));
 assert.ok(tokens.includes('Destino:C5'));
 const reference=api.inspect('7A#');assert.equal(reference.state,'candidate');
 api.dispose();assert.equal(host.children.length,1);
});

test('versioned bundle, stylesheet and cache stay aligned with existing PWA publishing',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const pkg=require('./package.json');
 assert.equal(pkg.version,'20.5.72');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2058-code-grammar.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.72'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.72'));
 assert.ok(css.includes('.vc2058-grammar'));
 assert.ok(sw.includes('code-grammar-20.5.8'));
 for(const file of ['src/domain/code-grammar.ts','src/domain/grammar-runtime.ts']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.equal(source.includes(forbidden),false,file+' '+forbidden);
 }
});
