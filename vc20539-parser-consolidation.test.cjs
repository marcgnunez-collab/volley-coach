'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const json=x=>JSON.parse(JSON.stringify(x));

/* Compare the final parser against the verbatim V20.5.38 wrapper fixture.
 * Only roster lookup and unrelated action normalization are stubbed. */
function createParser(legacy=false,lexer,extensions){
 const source=read('021-core-scouting-v150-monolithic.js');
 const part=(a,b)=>{
  const i=source.indexOf(a),j=source.indexOf(b,i+a.length);
  assert.ok(i>=0&&j>i,'native fragment '+a);return source.slice(i,j);
 };
 const bits=[
  part('function v6108NativeLex(raw){','function scoutV6108ParseRaw(raw,m,oldAction=null){'),
  part('function scoutV6108ParseRaw(raw,m,oldAction=null){','// Quick-code console'),
  legacy?read('test-audit/fixtures/v20539-direction-block-wrappers.txt'):
   part('const v20540ParserBase=scoutV6108ParseRaw;','window.v680ParseCode'),
  part('const v20538ExtensionStats=','/* V20.5.39 · This former V8.6 parser wrapper'),
  part('function v870LegacyExtension(original){','/* V20.5.39 · This former V8.7 parser wrapper'),
  part('function v880LegacyExtension(original){','/* V20.5.39 · One canonical extension wrapper'),
  legacy?read('test-audit/fixtures/v20538-parser-extensions.txt'):
   part('const v20539ParserBase=scoutV6108ParseRaw;','window.v680ParseCode')
 ].join('\n');
 const count={normalize:0,code:0};
 const context={
  window:{...(lexer?{VC_SCOUT_LEXER_20537:lexer}:{}),
   ...(extensions?{VC_SCOUT_EXTENSIONS_20538:extensions}:{})},
  scoutV6108IsContactSkill:skill=>skill==='R'||skill==='D',
  scoutV6108NormalizeZoneInput:(skill,start,end)=>({
   startZone:start||'',endZone:end||'',contactZone:end||start||''}),
  scoutV6108InferSource:()=>{},
  scoutFindOwnByNumber:n=>n==='99'?null:{id:Number(n),number:n,name:'TEST'},
  scoutFindOpponentByNumber:n=>String(n),
  scoutNormalizeAction:action=>{count.normalize++;return action;},
  scoutBuildCode:action=>{count.code++;return action.code||'';},
  v830InferReceptionMeta:()=>{},v840InferBlockTarget:()=>{},
  v870SkillFromRaw:s=>s.match(/^(?:R)?\d+([SREABDFC])/)?.[1]||'',
  v880DataVolleyFields:()=>({})
 };
 vm.runInNewContext(bits+'\nthis.parseNative=scoutV6108ParseRaw;',context,{timeout:2000});
 return {parse:(raw,oldAction=null)=>json(context.parseNative(raw,{id:42,status:'live'},oldAction)),
  count,context};
}

test('single native wrapper matches V20.5.38 for representative extension combinations',async()=>{
 const {installScoutingLexerBridge,installScoutingExtensionsBridge}=await compiled();
 const modern=createParser(false,installScoutingLexerBridge({}),installScoutingExtensionsBridge({}));
 const legacy=createParser(true,installScoutingLexerBridge({}),installScoutingExtensionsBridge({}));
 const initial=['12A#.4B>5D::K1~T','R7R+.6A','12A#.4B>C5',
  '8A#.4>5*DC','3B#.4&12','7E+::31~Q|F%RAP?S1$X','12A#.4B>C5::K1~T%TIP',
  'BAD','12A#.4','12S#~U'];
 let cases=0;
 const compare=code=>{
  assert.deepStrictEqual(modern.parse(code),legacy.parse(code),'parity '+code);
  cases++;
 };
 for(const code of initial)compare(code);
 for(const team of ['','R'])for(const n of ['8','12','99'])
 for(const skill of ['S','R','E','A','B','D'])
 for(const rating of ['#','+','='])for(const zone of ['','.4B>5D','.1','.4B>C5','.4>5'])
 for(const suffix of ['','~JP','::31~Q|F%TIP?X$Y','^K2@2','*DC']){
  compare(team+n+skill+rating+zone+suffix);
 }
 assert.ok(cases>=2700);
});

test('rally editor oldAction fields preserve original values and errors across phases',async()=>{
 const modern=createParser(),legacy=createParser(true);
 const oldAction={playerId:12,playerNumberSnapshot:'12',playerNameSnapshot:'Original',
  attackTempo:'T',attackCode:'FAST',setterCall:'PIPE',setTempo:'Q',skillSubtype:'TIP',
  dvSetType:'F',specialCode:'X',customCode:'Y',sourceActionId:25,videoTime:10.5};
 const cases=['12A#.4B>5D::K1~T%TIP','12A#.4B>C5::K1~T',
  '12A#.4>5','12E+','R7R+.6B','12B#.4&13','12A=.5>1','99A#.4>5'];
 for(const code of cases)assert.deepStrictEqual(modern.parse(code,oldAction),
  legacy.parse(code,oldAction),code);
 const testAction=modern.parse('12A#.4B>5D',oldAction).action;
 assert.equal(testAction.playerId,12);
 assert.equal(testAction.attackCode,'FAST');assert.equal(testAction.attackTempo,'T');
 assert.equal(testAction.videoTime,10.5);
});

test('the canonical path keeps normalization and code-building counts identical to V20.5.38',()=>{
 const modern=createParser(),legacy=createParser(true);
 for(const code of ['12A#','12A#.4B>5D','12A#.4B>C5','R7R+.6A','12E+::31~Q']){
  const beforeA=legacy.count.normalize,beforeB=legacy.count.code;
  const afterA=modern.count.normalize,afterB=modern.count.code;
  legacy.parse(code);modern.parse(code);
  assert.deepStrictEqual([modern.count.normalize-afterA,modern.count.code-afterB],
   [legacy.count.normalize-beforeA,legacy.count.code-beforeB],code);
 }
});

test('missing or mismatching TypeScript selectors keep the same single wrapper output',async()=>{
 const good=(await compiled()).installScoutingExtensionsBridge({});
 const bad={VERSION:'20.5.38',grammarOnly:true,subzone:()=>({kind:'pass'}),
  cone:()=>({kind:'pass'}),advanced:()=>{throw Error('extension unavailable')}};
 for(const bridge of [undefined,good,bad]){
  const modern=createParser(false,undefined,bridge),classic=createParser(true,undefined,bridge);
  for(const code of ['12A#.4B>C5::K1~T%TIP','R7R+.6A','12A#.4B>5D::31~Q']){
   assert.deepStrictEqual(modern.parse(code),classic.parse(code),code);
  }
  const stats=modern.context.window.VC_SCOUT_EXTENSIONS_DIAGNOSTICS_20538();
  assert.ok(stats.native>=0&&stats.mismatches>=0&&stats.exceptions>=0);
 }
});

test('V20.5.39 removes two active wrapper layers without modifying protected writers',()=>{
 const source=read('021-core-scouting-v150-monolithic.js');
 assert.equal((source.match(/scoutV6108ParseRaw=function\(/g)||[]).length,2,
  'V8.4 direction/blocking and the canonical extension wrapper remain');
 assert.equal((source.match(/function scoutV6108ParseRaw\(/g)||[]).length,1);
 for(const old of ['v860ParseBase','v870ParseBase','v880ParseBase'])
  assert.equal(source.includes(old),false,old);
 assert.ok(source.includes('const v20539ParserBase=scoutV6108ParseRaw'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(source.includes('a=scoutNormalizeAction({...a,...v880DataVolleyFields(a,m)})'));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});

test('V20.5.39 sources, assets and service worker are versioned together',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.53');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20539-parser-consolidation.test.cjs'));
 for(const script of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(script+'?v=20.5.53'));
 assert.ok(sw.includes('canonical-parser-20.5.39'));
 assert.ok(read('GUIA_V20.5.39_PARSER_CANONICO.md').includes('V20.5.39'));
});
