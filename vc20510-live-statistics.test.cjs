'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');

const match=()=>({
 status:'live',currentSet:1,rotationNo:1,servingTeam:'ours',
 sets:[{number:1,scoreUs:3,scoreOpponent:2,rallies:[
  {winner:'ours',servingBefore:'opponent',actions:[{team:'ours',skill:'R',evaluation:'#'},{team:'ours',skill:'A',evaluation:'#'}]},
  {winner:'opponent',servingBefore:'opponent',actions:[{team:'ours',skill:'R',evaluation:'='},{team:'ours',skill:'A',evaluation:'='}]},
  {winner:'ours',servingBefore:'ours',actions:[{team:'ours',skill:'A',evaluation:'/'}]},
  {winner:'opponent',servingBefore:'ours',actions:[{team:'opponent',skill:'R',evaluation:'#'}]},
  {winner:null,servingBefore:'opponent',actions:[{team:'ours',skill:'R',evaluation:'!'}]},
  {winner:'ours',servingBefore:'bad',actions:[{team:'ours',skill:'A',evaluation:'#'}]}
 ]}],
 liveRally:{actions:[{team:'ours',skill:'R',evaluation:'#'},{team:'ours',skill:'A',evaluation:'='}]}
});

test('V20.5.10 calculates SO/BP from completed rallies, positive reception and attack efficiency',async()=>{
 const {inspectLiveSetStatistics}=await compiled();
 const m=match(),before=JSON.stringify(m),stats=inspectLiveSetStatistics(m);
 assert.equal(stats.available,true);assert.equal(stats.set,1);assert.equal(stats.completeRallies,6);
 assert.deepEqual({...stats.sideOut},{attempts:2,successes:1,percent:50});
 assert.deepEqual({...stats.breakPoint},{attempts:2,successes:1,percent:50});
 assert.deepEqual({...stats.reception},{attempts:3,perfect:1,positive:1,positivePct:33,perfectPct:33});
 assert.deepEqual({...stats.attack},{attempts:4,kills:2,errors:1,blocked:1,efficiencyPct:0});
 assert.equal(stats.provisional.receptions,1);assert.equal(stats.provisional.attacks,1);
 assert.deepEqual({...stats.provisional.reception},{attempts:4,perfect:2,positive:2,positivePct:50,perfectPct:50});
 assert.deepEqual({...stats.provisional.attack},{attempts:5,kills:2,errors:2,blocked:1,efficiencyPct:-20});
 assert.equal(JSON.stringify(m),before,'no writes to the live match');
 for(const key of ['sideOut','breakPoint','reception','attack','provisional'])assert.equal(Object.isFrozen(stats[key]),true);
 assert.equal(Object.isFrozen(stats.provisional.attack),true);
});

test('V20.5.10 excludes incomplete phase results, invalid grades and non-own contacts',async()=>{
 const {inspectLiveSetStatistics}=await compiled();
 const m={currentSet:3,sets:[{number:3,rallies:[
  {servingBefore:'opponent',winner:'unknown',actions:[
   {skill:'A',team:'ours',evaluation:'??'},{skill:'A',team:'opponent',evaluation:'#'},
   {skill:'R',team:'ours',evaluation:null},{skill:'R',team:'ours',evaluation:'+'}
  ]}
 ]}],liveRally:{actions:[]}};
 const out=inspectLiveSetStatistics(m);
 assert.equal(out.sideOut.attempts,0);assert.equal(out.sideOut.percent,null);
 assert.equal(out.breakPoint.percent,null);
 assert.equal(out.reception.attempts,1);assert.equal(out.reception.positivePct,100);
 assert.equal(out.attack.attempts,0);assert.equal(out.attack.efficiencyPct,null);
 assert.equal(out.truncated,false);
 assert.equal(inspectLiveSetStatistics(null).available,false);
 assert.equal(inspectLiveSetStatistics({currentSet:1,sets:[{number:2}]}).available,false);
});

test('a corrected past rally, undo and set change recompute deterministically',async()=>{
 const {inspectLiveSetStatistics}=await compiled();
 const m=match();
 const initial=inspectLiveSetStatistics(m);
 m.sets[0].rallies[0].actions[1].evaluation='=';
 const fixed=inspectLiveSetStatistics(m);
 assert.equal(fixed.attack.efficiencyPct,-50);
 assert.equal(initial.attack.efficiencyPct,0);
 m.sets[0].rallies.pop();
 const undone=inspectLiveSetStatistics(m);
 assert.equal(undone.completeRallies,5);assert.equal(undone.attack.attempts,3);
 m.sets.push({number:2,scoreUs:0,scoreOpponent:0,rallies:[]});m.currentSet=2;
 const next=inspectLiveSetStatistics(m);
 assert.equal(next.set,2);assert.equal(next.sideOut.percent,null);
 assert.equal(next.reception.attempts,0);
 assert.equal(next.provisional.actions,2,'open actions only represent the canonical open rally');
});

test('bounded work marks partial results instead of silently claiming complete history',async()=>{
 const {inspectLiveSetStatistics}=await compiled();
 const rally={winner:'ours',servingBefore:'opponent',actions:[{skill:'R',team:'ours',evaluation:'#'}]};
 const m={currentSet:1,sets:[{number:1,rallies:Array.from({length:3001},()=>rally)}],liveRally:{actions:[]}};
 const out=inspectLiveSetStatistics(m);
 assert.equal(out.completeRallies,3001);
 assert.equal(out.examinedRallies,3000);
 assert.equal(out.truncated,true);
 assert.equal(out.sideOut.successes,3000);
 const huge={currentSet:1,sets:[{number:1,rallies:[{winner:'ours',servingBefore:'ours',
  actions:Array.from({length:25001},()=>({skill:'A',team:'ours',evaluation:'#'}))}]}]};
 const limited=inspectLiveSetStatistics(huge);
 assert.equal(limited.examinedActions,25000);assert.equal(limited.truncated,true);
});

test('LIVE panel subscribes only to the observable hub and updates without changing the native boxscore',async()=>{
 const {mountLiveStatisticsPanel}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.className='';this.children=[];this.textContent='';this.parentNode=null;this.dataset={};}
  set id(v){this._id=v;this.doc.items.set(v,this)}
  get id(){return this._id||''}
  get classList(){return {contains:v=>this.className.split(/\s+/).includes(v)}}
  setAttribute(){}
  append(...elements){for(const element of elements){this.children.push(element);element.parentNode=this}}
  replaceChildren(...elements){this.children=[];this.append(...elements)}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const doc=new Document();
 const workspace=doc.createElement('section');workspace.id='scout-workspace-v900';workspace.className='view active';
 const phase=doc.createElement('section');phase.id='v900-phase-scout';phase.className='v900-phase-panel';
 const host=doc.createElement('div');host.id='vc20510-live-stats';
 const legacy=doc.createElement('div');legacy.id='v900-intel';legacy.textContent='ESTADÍSTICAS ORIGINALES';
 const active=match(),topics=new Map();
 const store={subscribe:(topic,cb)=>{topics.set(topic,cb);return()=>topics.delete(topic)}};
 const win={document:doc,VC_STATE_2059:store,MatchState:{getActive:()=>active,subscribe:()=>{throw Error('must not create a native listener')}}};
 const api=mountLiveStatisticsPanel(win);
 assert.equal(api.readOnly,true);assert.equal(api.version,'20.5.10');
 assert.strictEqual(mountLiveStatisticsPanel(win),api);
 assert.deepEqual([...topics.keys()],['change']);
 assert.equal(host.dataset.state,'provisional');
 assert.equal(api.getReport().attack.efficiencyPct,0);
 assert.equal(legacy.textContent,'ESTADÍSTICAS ORIGINALES');
 const grid=host.children.find(el=>el.className==='vc20510-grid');
 assert.equal(grid.children[2].children[1].textContent,'50%','provisional reception is explicit');
 active.liveRally.actions.push({team:'ours',skill:'A',evaluation:'#'});
 topics.get('change')();await Promise.resolve();
 assert.equal(api.getReport().provisional.attack.efficiencyPct,0);
 phase.className='v900-phase-panel hidden';
 const cached=api.getReport();active.liveRally.actions.push({team:'ours',skill:'R',evaluation:'+'});
 topics.get('change')();await Promise.resolve();
 assert.strictEqual(api.getReport(),cached,'hidden panel performs no history scan');
 phase.className='v900-phase-panel';api.refresh();
 assert.equal(api.getReport().provisional.reception.positivePct,60);
 api.dispose();assert.equal(topics.size,0);assert.equal(host.children.length,0);
 assert.equal(win.VC_LIVE_STATS_20510,undefined);
 assert.equal(legacy.textContent,'ESTADÍSTICAS ORIGINALES');
});

test('V20.5.10 assets and Vite entry are versioned without a second writer or cloud path',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const pkg=require('./package.json');
 assert.equal(pkg.version,'20.5.19');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20510-live-statistics.test.cjs'));
 assert.ok(html.includes('id="vc20510-live-stats"'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.19'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.19'));
 assert.ok(css.includes('.vc20510-live-stats'));
 assert.ok(sw.includes('live-statistics-20.5.10'));
 const entry=fs.readFileSync(path.join(root,'src/vc2055-entry.ts'),'utf8');
 assert.ok(entry.includes('mountLiveStatisticsPanel(window)'));
 for(const file of ['src/state/live-statistics.ts','src/state/live-statistics-runtime.ts']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.equal(source.includes(forbidden),false,`${file}: ${forbidden}`);
 }
});
