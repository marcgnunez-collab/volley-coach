'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const source=()=>({currentSet:1,status:'live',rotationNo:1,servingTeam:'opponent',
 sets:[{number:1,scoreUs:1,scoreOpponent:0,rallies:[{rotationBefore:1,opponentRotationBefore:6,
  servingBefore:'opponent',winner:'ours',actions:[
   {team:'ours',skill:'R',evaluation:'#',playerId:12,playerNumberSnapshot:8,playerNameSnapshot:'Ana'},
   {team:'ours',skill:'A',evaluation:'#',playerId:12,playerNumberSnapshot:8,playerNameSnapshot:'Ana'}
  ]}]}],liveRally:{actions:[]}});
const filters=(team='ours',scope='current',rotation=null)=>({team,scope,rotation});
function makeHarness(match=source()){
 const listeners=new Set(),document=new EventTarget();let reads=0,nativeSubscriptions=0;
 const win={document,MatchState:{getActive:()=>{reads++;return match},
  getSet:value=>value.sets.find(s=>s.number===value.currentSet),
  subscribe:fn=>{nativeSubscriptions++;listeners.add(fn);return()=>listeners.delete(fn)}}};
 return {win,match,listeners,get reads(){return reads},get nativeSubscriptions(){return nativeSubscriptions},
  signal(){for(const fn of listeners)fn();document.dispatchEvent(new Event('vc:matchstatechange'));}};
}

test('V20.5.22 reuses live and filtered reports without rescanning canonical rallies',async()=>{
 const {createObservableMatchStore,createScoutingProjectionStore}=await compiled();
 const h=makeHarness(),observable=createObservableMatchStore(h.win),queries=createScoutingProjectionStore(h.win,observable);
 const before=JSON.stringify(h.match),reads=h.reads;
 const live=queries.getLiveStatistics(),players=queries.getPlayerBoxscore(filters());
 assert.equal(queries.getLiveStatistics(),live);
 assert.equal(queries.getPlayerBoxscore(filters()),players);
 assert.equal(h.reads,reads+2,'only two canonical reads are required for two different reports');
 assert.equal(queries.getSnapshot().score.us,1);
 assert.deepEqual({...queries.diagnostics()},{readOnly:true,generation:0,calculations:2,cacheHits:2,
  invalidations:0,playerCacheEntries:1,hasLiveCache:true});
 assert.equal(JSON.stringify(h.match),before,'querying never mutates the authoritative scouting');
 queries.dispose();observable.dispose();
 assert.equal(h.listeners.size,0);
});

test('historical correction and undo invalidate cached reports even with the same scoreboard',async()=>{
 const {createObservableMatchStore,createScoutingProjectionStore}=await compiled();
 const h=makeHarness(),observable=createObservableMatchStore(h.win),queries=createScoutingProjectionStore(h.win,observable);
 const oldLive=queries.getLiveStatistics(),oldPlayers=queries.getPlayerBoxscore(filters());
 assert.equal(oldLive.attack.efficiencyPct,100);
 const oldGeneration=queries.diagnostics().generation;
 h.match.sets[0].rallies[0].actions[1].evaluation='=';
 h.signal();h.signal();await Promise.resolve();
 assert.equal(queries.diagnostics().generation,oldGeneration+1,'duplicate native signals are coalesced');
 assert.equal(observable.diagnostics().updates,0,'score selectors did not change');
 const newLive=queries.getLiveStatistics(),newPlayers=queries.getPlayerBoxscore(filters());
 assert.notStrictEqual(newLive,oldLive);assert.notStrictEqual(newPlayers,oldPlayers);
 assert.equal(newLive.attack.efficiencyPct,-100);
 assert.equal(newPlayers.players.find(p=>p.key==='id:12').attack.efficiencyPct,-100);
 h.match.sets[0].rallies.pop();h.signal();await Promise.resolve();
 assert.equal(queries.getLiveStatistics().completeRallies,0);
 assert.equal(queries.getPlayerBoxscore(filters()).players.length,0);
 queries.dispose();observable.dispose();
});

test('cache is capped at eight distinct filter permutations and manual invalidation is safe',async()=>{
 const {createObservableMatchStore,createScoutingProjectionStore}=await compiled();
 const h=makeHarness(),observable=createObservableMatchStore(h.win),queries=createScoutingProjectionStore(h.win,observable);
 let original=queries.getPlayerBoxscore(filters());
 for(const team of ['ours','opponent'])for(const scope of ['current','match'])
  for(const rotation of [null,1,2,3,4,5,6])queries.getPlayerBoxscore(filters(team,scope,rotation));
 assert.equal(queries.diagnostics().playerCacheEntries,8);
 assert.notStrictEqual(queries.getPlayerBoxscore(filters()),original,'evicted report is recomputed');
 original=queries.getPlayerBoxscore(filters());
 queries.invalidate();
 assert.equal(queries.diagnostics().playerCacheEntries,0);
 assert.equal(queries.diagnostics().hasLiveCache,false);
 assert.notStrictEqual(queries.getPlayerBoxscore(filters()),original);
 queries.dispose();observable.dispose();
});

test('mounting shares one native subscriber and disposal removes only the added hub listener',async()=>{
 const {createObservableMatchStore,mountScoutingProjectionStore}=await compiled();
 const h=makeHarness(),observable=createObservableMatchStore(h.win);h.win.VC_STATE_2059=observable;
 const base=observable.diagnostics().subscribers;
 const first=mountScoutingProjectionStore(h.win);
 assert.ok(first);assert.equal(first.version,'20.5.22');assert.equal(first.readOnly,true);
 assert.strictEqual(mountScoutingProjectionStore(h.win),first);
 assert.equal(h.nativeSubscriptions,1);assert.equal(h.listeners.size,1);
 assert.equal(observable.diagnostics().subscribers,base+1);
 first.subscribe('score',()=>{});assert.equal(observable.diagnostics().subscribers,base+2);
 first.dispose();assert.equal(h.win.VC_SCOUT_PROJECTIONS_20522,undefined);
 assert.equal(observable.diagnostics().subscribers,base);
 assert.throws(()=>first.getLiveStatistics(),/cerrada/);
 assert.notStrictEqual(mountScoutingProjectionStore(h.win),first);
 h.win.VC_SCOUT_PROJECTIONS_20522.dispose();observable.dispose();
 assert.equal(h.listeners.size,0);
});

test('LIVE and player UI read the same shared projections without an alternative writer',async()=>{
 const {createObservableMatchStore,mountScoutingProjectionStore,mountLiveStatisticsPanel,mountPlayerBoxscore}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.className='';this.textContent='';this.children=[];
   this.parentNode=null;this.dataset={};this.value='';}
  set id(v){this._id=v;this.doc.items.set(v,this)}
  get id(){return this._id||''}
  get classList(){return {contains:v=>this.className.split(/\s+/).includes(v)}}
  setAttribute(){}
  append(...nodes){for(const child of nodes){this.children.push(child);child.parentNode=this}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const h=makeHarness(),doc=new Document(),win={...h.win,document:doc};
 const workspace=doc.createElement('section');workspace.id='scout-workspace-v900';workspace.className='active';
 for(const id of ['v900-phase-scout','v900-phase-analyze','vc20510-live-stats','vc20511-boxscore']){
  const node=doc.createElement('section');node.id=id;node.className='v900-phase-panel';
 }
 const observable=createObservableMatchStore(win);win.VC_STATE_2059=observable;
 const queries=mountScoutingProjectionStore(win);
 const live=mountLiveStatisticsPanel(win),players=mountPlayerBoxscore(win);
 assert.ok(live);assert.ok(players);assert.equal(h.nativeSubscriptions,1);
 assert.strictEqual(live.getReport(),queries.getLiveStatistics());
 assert.strictEqual(players.getReport(),queries.getPlayerBoxscore(filters()));
 const calculations=queries.diagnostics().calculations;
 h.match.sets[0].rallies[0].actions[1].evaluation='=';
 for(const fn of h.listeners)fn();doc.dispatchEvent(new Event('vc:matchstatechange'));
 await Promise.resolve();await Promise.resolve();
 assert.equal(queries.diagnostics().calculations,calculations+2);
 assert.equal(live.getReport().attack.efficiencyPct,-100);
 assert.equal(players.getReport().players[0].attack.efficiencyPct,-100);
 live.dispose();players.dispose();queries.dispose();observable.dispose();
 assert.equal(h.listeners.size,0);
});

test('V20.5.22 release includes one Vite gateway, no second scoring writer and an updated cache',()=>{
 const entry=read('src/vc2055-entry.ts'),html=read('index.html'),sw=read('service-worker.js'),
  pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.32');
 assert.ok(entry.includes('mountScoutingProjectionStore(window)'));
 assert.ok(entry.indexOf('mountScoutingProjectionStore(window)')<entry.indexOf('mountLiveStatisticsPanel(window)'));
 assert.ok(entry.indexOf('mountScoutingProjectionStore(window)')<entry.indexOf('mountPlayerBoxscore(window)'));
 assert.match(html,/vc2055-domain-core\.mjs\?v=20\.5\.32/);
 assert.match(sw,/scouting-projections-20\.5\.22/);
 assert.ok(pkg.scripts['test:foundation'].includes('vc20522-scouting-projections.test.cjs'));
 const file='src/state/scouting-projections.ts',contents=read(file);
 for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=','window.MatchState=','setItem('])
  assert.ok(!contents.includes(forbidden),`unsafe source in ${file}: ${forbidden}`);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
