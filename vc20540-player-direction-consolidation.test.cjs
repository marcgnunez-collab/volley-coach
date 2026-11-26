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

function playerHarness(bridge){
 const source=read('021-core-scouting-v150-monolithic.js');
 const start=source.indexOf('const v6108PlayerStats=');
 const end=source.indexOf('function scoutV6108ParseRaw(raw,m,oldAction=null){',start);
 assert.ok(start>0&&end>start);
 let called=0,member={id:8,name:'Jugadora de prueba',number:'08'};
 const context={
  window:bridge?{VC_SCOUT_PLAYER_RESOLVER_20540:bridge}:{},
  scoutFindOwnByNumber:num=>{called++;return num==='08'?member:null}
 };
 vm.runInNewContext(source.slice(start,end),context,{timeout:2000});
 return {choose:(num,old)=>context.v6108ChooseOwnPlayer(num,old),
  diagnostics:()=>json(context.window.VC_SCOUT_PLAYER_DIAGNOSTICS_20540()),
  setMember:next=>{member=next},calls:()=>called,member:()=>member};
}

test('TypeScript resolves own candidate by strict reference and preserves player data',async()=>{
 const {resolveOwnScoutingPlayer}=await compiled();
 const own={id:8,name:'PRIVADO',number:'08',role:'OH'};
 const prior={playerNumberSnapshot:'08',playerId:11,playerNameSnapshot:'ANTERIOR'};
 const before=JSON.stringify({own,prior});
 const selected=resolveOwnScoutingPlayer('08',own,prior);
 assert.equal(selected.found,true);assert.equal(selected.fromPreviousAction,false);
 assert.strictEqual(selected.player,own);
 const fallback=resolveOwnScoutingPlayer('08',null,prior);
 assert.deepStrictEqual(fallback,{found:true,fromPreviousAction:true,
  player:{id:11,name:'ANTERIOR',number:'08'}});
 assert.deepStrictEqual(resolveOwnScoutingPlayer('09',null,prior),
  {found:false,fromPreviousAction:false,player:null});
 assert.equal(JSON.stringify({own,prior}),before);
});

test('real native lookup runs exactly once with typed selection or classic fallback',async()=>{
 const bridge=(await compiled()).installScoutPlayerResolverBridge({});
 assert.ok(Object.isFrozen(bridge));assert.equal(bridge.VERSION,'20.5.40');
 assert.equal(bridge.pureOnly,true);
 const h=playerHarness(bridge),member=h.member();
 assert.strictEqual(h.choose('08'),member);
 const old={playerNumberSnapshot:'11',playerId:11,playerNameSnapshot:'NOMBRE'};
 assert.deepStrictEqual(json(h.choose('11',old)),
  {id:11,name:'NOMBRE',number:'11'});
 assert.equal(h.choose('99',old),null);
 assert.equal(h.calls(),3,'exactly one native roster read per attempt');
 assert.deepStrictEqual(h.diagnostics(),
  {typed:3,native:0,mismatches:0,exceptions:0,lookups:3});
 assert.doesNotMatch(JSON.stringify(h.diagnostics()),/NOMBRE|PRIVADO|08/);
});

test('bad or absent typed player module leaves original fallback and no duplicate lookup',async()=>{
 const valid=(await compiled()).installScoutPlayerResolverBridge({});
 for(const bridge of [
  undefined,
  {VERSION:'20.5.40',pureOnly:true,resolveOwn:()=>({found:false,player:null})},
  {VERSION:'20.5.40',pureOnly:true,resolveOwn:()=>{throw Error('offline module')}},
  {VERSION:'20.5.39',pureOnly:true,resolveOwn:valid.resolveOwn}
 ]){
  const h=playerHarness(bridge);
  const ref=h.member();assert.strictEqual(h.choose('08'),ref);
  const old={playerNumberSnapshot:'05',playerId:5,playerNameSnapshot:'Old'};
  assert.deepStrictEqual(json(h.choose('05',old)),
   {id:5,name:'Old',number:'05'});
  assert.equal(h.choose('99',old),null);
  assert.equal(h.calls(),3);
  assert.equal(h.diagnostics().lookups,3);
 }
});

test('literal dorsal comparison retains legacy distinction between 8 and 08',async()=>{
 const {resolveOwnScoutingPlayer}=await compiled();
 const old={playerNumberSnapshot:8,playerId:8,playerNameSnapshot:'Antiguo'};
 assert.equal(resolveOwnScoutingPlayer('08',null,old).found,false);
 assert.equal(resolveOwnScoutingPlayer('8',null,old).found,true);
 const h=playerHarness((await compiled()).installScoutPlayerResolverBridge({}));
 assert.equal(h.choose('08',old).id,8,'existing roster still wins');
 assert.deepStrictEqual(json(h.choose('8',old)),
  {id:8,name:'Antiguo',number:'8'});
});

test('V20.5.40 ships one directional/block wrapper, new player bridge and protected writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.74');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20540-player-direction-consolidation.test.cjs'));
 for(const file of ['021-core-scouting-v150-monolithic.js','213-vc2021-scouting-speed-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(file+'?v=20.5.74'));
 assert.ok(sw.includes('direction-block-consolidation-20.5.40'));
 const source=read('021-core-scouting-v150-monolithic.js');
 assert.equal((source.match(/scoutV6108ParseRaw=function\(/g)||[]).length,2);
 for(const old of ['v830ParseBase','v840ParseBase','v860ParseBase','v870ParseBase','v880ParseBase'])
  assert.equal(source.includes(old),false,old);
 assert.ok(source.includes('const v20540ParserBase=scoutV6108ParseRaw'));
 assert.ok(source.includes('const p=v6108ChooseOwnPlayer(num,oldAction)'));
 assert.ok(source.includes('const pushed=scoutPushAction(parsed.action)'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutPlayerResolverBridge(window)'));
 const pure=read('src/domain/scout-player-resolution.ts'),
  runtime=read('src/domain/scout-player-resolution-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'v121AwardPoint', 'videoTime'])
  assert.equal(pure.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
