'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const json=value=>JSON.parse(JSON.stringify(value));

function lexicalHarness(bridge){
 const source=read('021-core-scouting-v150-monolithic.js');
 const start=source.indexOf('function v6108NativeLex(raw){');
 const end=source.indexOf('// Quick-code console, now accepting',start);
 assert.ok(start>0&&end>start,'must isolate the actual native base parser');
 const win={};
 if(bridge!==undefined)win.VC_SCOUT_LEXER_20537=bridge;
 const context={window:win,
  scoutV6108IsContactSkill:skill=>skill==='R'||skill==='D',
  scoutV6108NormalizeZoneInput:(skill,z1,z2)=>({startZone:z1,endZone:z2,
   contactZone:skill==='R'||skill==='D'?z2||z1:''}),
  scoutFindOpponentByNumber:(_m,n)=>'#'+n+' · Rival',
  scoutFindOwnByNumber:n=>n==='99'?null:{id:Number(n),name:'Jugadora '+n,number:n},
  scoutV6108InferSource:()=>{},
  scoutNormalizeAction:a=>({...a}),
  scoutBuildCode:a=>a.skill+a.evaluation+(a.startZone?'.'+a.startZone:'')
 };
 vm.runInNewContext(source.slice(start,end),context,{timeout:2000});
 return {window:win,
  lex:raw=>json(context.v6108NativeLex(String(raw||'').trim().toUpperCase().replace(/\s+/g,''))),
  parse:(raw,m={id:'match'},old=null)=>json(context.scoutV6108ParseRaw(raw,m,old)),
  stats:()=>json(win.VC_SCOUT_LEXER_DIAGNOSTICS_20537())};
}

test('TypeScript lexical scanning preserves all classic skill/evaluation/zone/modifier tokens',async()=>{
 const typed=(await compiled()).lexScoutingCode;
 const h=lexicalHarness();
 const cases=['7R#.6','6D+.5','4S+.1>5','12A#.4>5','R7R-.5','R12S=',
  '12A#.4>5:PIPE^K2@3~JF','12A#.4>5@0^FB:Z4~JP','08E+',
  '8A',' 8 a # . 4 > 2 ~ j f ','07B/.3>3','23S!~U',
  '1F=','1C+','1E#:31','9S#~F','0008R+.7>2','12A#.4>5~~JF',
  '1A#.4','1S=.1','R12A#.1>6~F','R12R#.5','12Q#','',
  '  ','12A#.4>5~ZZ','12A#.4>5%%','12A#.4>5@4','12A#.4>5:Z8',
  '12A#.4>5:PIPE:PIPE','12A#.4>5@3@2','12A#.4>5^TR^K1',
  'R12S#.4>5~JF:Z4^FB@2'];
 for(const code of cases){
  const observed=typed(code),legacy=h.lex(code);
  assert.deepStrictEqual(observed,legacy,'lexical parity for '+JSON.stringify(code));
 }
 assert.deepStrictEqual(typed('12A#.4>5~JF:PIPE^K2@3'),{
  kind:'code',rival:false,number:'12',skill:'A',evaluation:'#',
  startZone:'4',endZone:'5',serveType:'JF',combo:'PIPE',phase:'K2',blockers:'3'
 });
});

test('typed lexer maintains lexical parity across deterministic large code matrix',async()=>{
 const typed=(await compiled()).lexScoutingCode;
 const h=lexicalHarness();
 const teams=['','R'],numbers=['0','08','12','99'],
  skills=['S','R','E','A','B','D','F','C','X'],
  ratings=['','#','+','!','-','/','=','?'],
  zoneParts=['','.1','.7>2','.4>5','.9>.2'],
  suffixes=['','~JF',':PIPE','^K1','@3','~JP:Z4^TR@2','~ZZ'];
 let cases=0;
 for(const team of teams)for(const n of numbers)for(const skill of skills)
 for(const rating of ratings)for(const z of zoneParts)for(const suffix of suffixes){
  const raw=team+n+skill+rating+z+suffix;
  assert.deepStrictEqual(typed(raw),h.lex(raw),'mismatch on '+raw);cases++;
 }
 assert.ok(cases>15000,'broad syntax matrix must run');
});

test('base parser consumes typed lexer and keeps native player resolution, action shape and errors',async()=>{
 const api=(await compiled()).installScoutingLexerBridge({});
 const typed=lexicalHarness(api),classic=lexicalHarness();
 const codes=['12A#.4>5:PIPE^K1@2','R8R+.6','6D+.5','04S#.1>6~JP',
  '8E#:31','99A#.4>5','12A#.4','R12F=','bad','08A=.2>4~F^K2','R5B/.3>3'];
 const old={sourceActionId:'ref-1',attackTempo:'T',playerNumberSnapshot:'08',playerId:8,playerNameSnapshot:'Original'};
 for(const code of codes){
  assert.deepStrictEqual(typed.parse(code,undefined,old),
   classic.parse(code,undefined,old),'semantic parity '+code);
 }
 const ok=typed.parse('08A#.4>5:PIPE^K1@2');
 assert.equal(ok.action.playerId,8);
 assert.equal(ok.action.attackCombo,'PIPE');
 assert.equal(ok.action.phase,'K1');
 assert.equal(ok.action.blockers,'2');
 const errors=typed.parse('99S#.1>5');
 assert.match(errors.error,/No encuentro el dorsal 99/);
 assert.equal(typed.stats().typed,codes.length+2);
 assert.equal(typed.stats().mismatches,0);
});

test('missing, invalid, mismatched and throwing TypeScript lexer all revert to classic semantics',async()=>{
 const live=(await compiled()).installScoutingLexerBridge({});
 const variants=[
  undefined,
  {VERSION:'20.5.37',syntaxOnly:true,lex:()=>({kind:'error',error:'False rejection'})},
  {VERSION:'20.5.37',syntaxOnly:true,lex:()=>{throw Error('broken module')}},
  {VERSION:'20.5.36',syntaxOnly:true,lex:live.lex},
  {VERSION:'20.5.37',syntaxOnly:true,lex:()=>({kind:'code',skill:'A'})},
  live
 ];
 for(const bridge of variants){
  const h=lexicalHarness(bridge),raw='12A#.4>5^K2@2';
  const result=h.parse(raw),stats=h.stats();
  assert.equal(result.action.playerId,12);
  assert.equal(result.action.evaluation,'#');
  assert.equal(result.action.phase,'K2');
  assert.equal(result.action.blockers,'2');
  assert.equal(stats.typed+stats.native,1);
  if(bridge===live)assert.equal(stats.typed,1);
  else assert.equal(stats.native,1);
 }
});

test('V20.5.37 lexer remains syntax-only and is included in source, tests and Vite release',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.76');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20537-scout-lexer-migration.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.76'));
 assert.ok(html.includes('021-core-scouting-v150-monolithic.js?v=20.5.76'));
 assert.ok(html.includes('213-vc2021-scouting-speed-pro.js?v=20.5.76'));
 assert.ok(sw.includes('scout-lexical-migration-20.5.37'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutingLexerBridge(window)'));
 assert.ok(read('021-core-scouting-v150-monolithic.js').includes('const lexical=v6108CheckedLex(raw)'));
 assert.ok(read('021-core-scouting-v150-monolithic.js').includes('const pushed=scoutPushAction(parsed.action)'));
 const lexer=read('src/domain/scout-code-lexer.ts'),
  runtime=read('src/domain/scout-code-lexer-runtime.ts');
 for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'v121AwardPoint', 'indexedDB',
  'localStorage','fetch(', 'supabase', 'setItem(', 'videoTime', 'playerNameSnapshot'])
  assert.equal(lexer.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
