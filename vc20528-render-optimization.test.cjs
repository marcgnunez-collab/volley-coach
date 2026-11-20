'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const dataEngine=require('./189-vc1938-professional-data-engine.js');
const rallySearch=require('./190-vc1939-rally-search-pro.js');
const compiled=()=>import('./vc2055-domain-core.mjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');

test('render gate skips identical frames, refreshes when stale, supports force, and retries failures',async()=>{
 const {createReadOnlyRenderGate}=await compiled();
 let tick=0,painted=0;const events=[];
 const gate=createReadOnlyRenderGate({now:()=>tick,staleAfterMs:50,
  report:(kind,ms)=>events.push([kind,ms])});
 assert.equal(gate.render('same',()=>{painted++;tick+=2}),true);
 assert.equal(gate.render('same',()=>{painted++}),false);
 assert.equal(gate.render('same',()=>{painted++},true),true);
 tick+=51;
 assert.equal(gate.render('same',()=>{painted++}),true,'stale signatures must refresh');
 assert.equal(gate.render('changed',()=>{painted++}),true);
 assert.throws(()=>gate.render('broken',()=>{throw Error('painting failed')}),/painting failed/);
 assert.equal(gate.render('broken',()=>{painted++}),true,'failed frame cannot poison cache');
 gate.invalidate();assert.equal(gate.render('broken',()=>{painted++}),true);
 assert.equal(painted,6);
 const diag=gate.diagnostics();
 assert.deepEqual([diag.requests,diag.rendered,diag.skipped,diag.failures],[8,6,1,1]);
 assert.ok(events.some(([kind])=>kind==='skip'));
});

test('numeric-only bridge exposes immutable counters and no scouting content',async()=>{
 const {installRenderMetricsBridge}=await compiled();
 const win={};const api=installRenderMetricsBridge(win);
 assert.strictEqual(installRenderMetricsBridge(win),api);
 api.observe('scouting-live','render',2.11);
 api.observe('scouting-live','skip');api.observe('scouting-live','error');
 api.observe('rally-search','render',4);
 const d=api.diagnostics();
 assert.deepEqual([d.areas['scouting-live'].requests,d.areas['scouting-live'].rendered,
  d.areas['scouting-live'].skipped,d.areas['scouting-live'].failures],[3,1,1,1]);
 assert.equal(d.areas['rally-search'].averageMs,4);
 assert.equal(Object.isFrozen(d.areas['scouting-live']),true);
 assert.equal(JSON.stringify(d).includes('jugador'),false);
 assert.equal(api.readOnly,true);
});

class Element extends EventTarget{
 constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.className='';this.children=[];
  this.textContent='';this.dataset={};this.value='';this.replacements=0;}
 set id(value){this._id=value;this.doc.items.set(value,this)}
 get id(){return this._id||''}
 get classList(){return {contains:key=>this.className.split(/\s+/).includes(key)}}
 setAttribute(){}
 append(...els){for(const child of els){child.parentNode=this;this.children.push(child)}}
 replaceChildren(...els){this.replacements++;this.children=[];this.append(...els)}
}
class Doc extends EventTarget{
 constructor(){super();this.items=new Map()}
 createElement(tag){return new Element(tag,this)}
 getElementById(id){return this.items.get(id)||null}
}
function mount(kind){
 const doc=new Doc(),workspace=doc.createElement('section');workspace.id='scout-workspace-v900';workspace.className='view active';
 const phase=doc.createElement('section');phase.id=kind==='live'?'v900-phase-scout':'v900-phase-analyze';
 const host=doc.createElement('section');host.id=kind==='live'?'vc20510-live-stats':'vc20511-boxscore';
 const match={currentSet:1,sets:[{number:1,rallies:[{rotationBefore:1,servingBefore:'opponent',winner:'ours',actions:[
  {team:'ours',skill:'R',evaluation:'#',playerId:7,playerNameSnapshot:'Jugador',playerNumberSnapshot:'7'},
  {team:'ours',skill:'A',evaluation:'#',playerId:7,playerNameSnapshot:'Jugador',playerNumberSnapshot:'7'}
 ]}]}],liveRally:{actions:[]}};
 const listeners=new Map(),store={subscribe:(name,handler)=>{listeners.set(name,handler);return()=>listeners.delete(name)}};
 const win={document:doc,VC_STATE_2059:store,MatchState:{getActive:()=>match,
  subscribe:()=>{throw Error('native subscriptions forbidden')}}};
 return {doc,host,match,listeners,win};
}
test('LIVE and boxscore avoid duplicate DOM frames but redraw corrections and undo',async()=>{
 const {mountLiveStatisticsPanel,mountPlayerBoxscore}=await compiled();
 for(const kind of ['live','boxscore']){
  const sample=mount(kind),api=kind==='live'?mountLiveStatisticsPanel(sample.win):mountPlayerBoxscore(sample.win);
  const initial=sample.win.VC_RENDER_METRICS_20528.diagnostics().areas[kind==='live'?'scouting-live':'scouting-boxscore'];
  assert.equal(initial.rendered,1);
  const box=kind==='boxscore'?sample.host.children.find(x=>x.className==='vc20511-scroll'):null;
  const count=box?.replacements;
  sample.listeners.get('change')();await Promise.resolve();
  const afterSkip=sample.win.VC_RENDER_METRICS_20528.diagnostics().areas[kind==='live'?'scouting-live':'scouting-boxscore'];
  assert.equal(afterSkip.skipped,1);
  if(box)assert.equal(box.replacements,count);
  sample.match.sets[0].rallies[0].actions[1].evaluation='=';
  sample.listeners.get('change')();await Promise.resolve();
  assert.equal(sample.win.VC_RENDER_METRICS_20528.diagnostics().areas[kind==='live'?'scouting-live':'scouting-boxscore'].rendered,2);
  if(box)assert.equal(box.replacements,count+1);
  sample.match.sets[0].rallies[0].actions[1].evaluation='#';
  sample.listeners.get('change')();await Promise.resolve();
  assert.equal(sample.win.VC_RENDER_METRICS_20528.diagnostics().areas[kind==='live'?'scouting-live':'scouting-boxscore'].rendered,3);
  api.refresh();
  assert.equal(sample.win.VC_RENDER_METRICS_20528.diagnostics().areas[kind==='live'?'scouting-live':'scouting-boxscore'].rendered,4);
  api.dispose();assert.equal(sample.listeners.size,0);
 }
});

function legacyPanel(){
 const writes={left:0,center:0,list:0};
 const element=(key,marker)=>{
  let html='';return {
   get innerHTML(){return html},set innerHTML(next){html=next;writes[key]++},
   get firstElementChild(){const match=html.match(/class="([^"]+)"/);return match?{
    classList:{contains:klass=>match[1].split(/\s+/).includes(klass)}}:null}
  };
 };
 const left=element('left'),center=element('center'),list=element('list');
 const count={textContent:''};
 const win={VC_DATA_ENGINE_1938:{normalize:dataEngine.normalize},performance:{now:()=>1},
  VC_RENDER_METRICS_20528:{observe(){}}};
 const panel={ownerDocument:{defaultView:win,activeElement:null},dataset:{},
  querySelector:(key)=>({'.vc1937-left-body':left,'.vc1937-courtbody':center,
   '.vc1937-rallies':list,'.vc1937-rally-count':count}[key]||null),
  querySelectorAll:()=>[],addEventListener(){}};
 const ctx={match:{id:'M',sets:[{number:1,rallies:[{id:'r1',winner:'ours',actions:[
  {team:'ours',skill:'A',evaluation:'#',playerNameSnapshot:'P7'}]}]}]},
  data:{rallies:[{set:1,id:'r1',index:1,winning:'ours'}]}};
 return {panel,ctx,writes,left,center,list};
}
test('historic Data Engine and Rally Search preserve unchanged DOM but invalidate on edits/tab switches',()=>{
 for(const [tab,legacy,marker] of [['data',dataEngine,'vc1938-audit'],['search',rallySearch,'vc1939-left']]){
  const {panel,ctx,writes,left}=legacyPanel();
  legacy.decorate(panel,ctx,tab);
  assert.equal(writes.left,1);assert.equal(writes.center,1);
  legacy.decorate(panel,ctx,tab);
  assert.equal(writes.left,1,'unchanged view should retain controls');
  assert.equal(writes.center,1,'unchanged view should retain result nodes');
  assert.ok(left.firstElementChild.classList.contains(marker));
  left.innerHTML='<div class="other-tab"></div>';
  legacy.decorate(panel,ctx,tab);
  assert.equal(writes.left,3,'tab replacement forces a safe redraw');
  ctx.match.sets[0].rallies[0].actions.push({team:'ours',skill:'A',evaluation:'=',playerNameSnapshot:'P7'});
  legacy.decorate(panel,ctx,tab);
  assert.ok(writes.center>=2,'native correction is accepted on subsequent render');
 }
});

test('V20.5.28 integrates telemetry in Gestión without changing the native scoring writers',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.5.50');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.50'));
 assert.ok(read('service-worker.js').includes('render-optimization-20.5.28'));
 assert.ok(read('src/state/analysis-query-runtime.ts').includes('Actualizaciones visuales de Scouting y Análisis'));
 assert.ok(read('src/vc2055-entry.ts').includes('installRenderMetricsBridge(window)'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20528-render-optimization.test.cjs'));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
