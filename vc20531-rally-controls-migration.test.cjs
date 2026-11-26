'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const legacy=require('./190-vc1939-rally-search-pro.js');
const engine=require('./189-vc1938-professional-data-engine.js');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function fakeWindow(){
 let seq=0,blob=null,download=null,revoked=null;
 const timers=new Map(),storageMap=new Map(),links=[];
 const win={performance:{now:()=>1},localStorage:{
  getItem:key=>storageMap.get(key)||null,
  setItem:(key,value)=>storageMap.set(key,String(value))},
  prompt:()=>null,
  Blob:class {constructor(chunks,options){this.chunks=chunks;this.type=options.type;blob=this;}},
  URL:{createObjectURL:()=> 'blob:search-test',revokeObjectURL:url=>{revoked=url}},
  setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms});return id},
  clearTimeout:id=>timers.delete(id)};
 const doc={defaultView:win,activeElement:null,createElement:tag=>{
  const el={tagName:tag,href:'',download:'',click(){download=el.download},remove(){}};
  links.push(el);return el;
 },body:{append(){}}};
 const panel={dataset:{},ownerDocument:doc,_vc1939:null,listeners:new Map(),
  addEventListener(type,handler){this.listeners.set(type,handler)},
  removeEventListener(type,handler){if(this.listeners.get(type)===handler)this.listeners.delete(type)},
  fire(type,target){const handler=this.listeners.get(type);assert.ok(handler,`missing ${type}`);handler({target})}};
 return {win,panel,timers,storageMap,
  run(delay){const entry=[...timers.entries()].find(([,item])=>item.ms===delay);
   assert.ok(entry,'expected timer '+delay);timers.delete(entry[0]);entry[1].fn();},
  getBlob:()=>blob,getDownload:()=>download,getRevoked:()=>revoked,links};
}
const field=(name,value,tag='input')=>({dataset:{vc1939Filter:name},value,
 matches:query=>query===`${tag}[data-vc1939-filter]`,closest:()=>null});
const button=attribute=>({closest:query=>query==='button'?{
 hasAttribute:key=>key===attribute}:null});

test('typed preset parser matches the original key, malformed inputs, limits and normalization',async()=>{
 const {readRallySearchPresets,RALLY_SEARCH_PRESETS_KEY}=await compiled();
 assert.equal(RALLY_SEARCH_PRESETS_KEY,'vc1939:search-presets:1');
 for(const raw of [null,'broken JSON','{}','[1,null,{},{"name":"","filters":{}}]',
  JSON.stringify([{name:'abc',filters:{status:'all',code:'Z'.repeat(140),skill:'A'}}]),
  JSON.stringify(Array.from({length:30},(_,i)=>({name:'Filtro '+i,filters:{evaluation:'#'}}))),
  JSON.stringify([{name:'x'.repeat(41),filters:{}},{name:'Ñ&<>',filters:{code:'A4#',status:'closed'}}])]){
  const storage={getItem:key=>{assert.equal(key,RALLY_SEARCH_PRESETS_KEY);return raw}};
  assert.deepStrictEqual(readRallySearchPresets(storage),legacy.readPresets(storage));
 }
 assert.deepStrictEqual(readRallySearchPresets(null),[]);
});

test('typed controller preserves change/input debounce and prevents double binding',async()=>{
 const {installRallySearchControls}=await compiled();
 const sample=fakeWindow(),{win,panel,timers}=sample;
 let refreshed=0;panel._vc1939={filters:{status:'closed'},matchId:'x',result:{},ctx:{}};
 const api=installRallySearchControls(win),hooks={refresh:()=>refreshed++,toCSV:()=>''};
 assert.strictEqual(installRallySearchControls(win),api);
 assert.equal(api.bind(panel,hooks),true);
 assert.equal(api.bind(panel,hooks),true);
 assert.equal(panel.dataset.vc1939Bound,'yes');
 assert.deepStrictEqual([...panel.listeners.keys()].sort(),['change','click','input']);
 panel.fire('change',field('skill','A','select'));
 assert.equal(panel._vc1939.filters.skill,'A');
 assert.deepStrictEqual([...timers.values()].map(x=>x.ms),[0]);
 sample.run(0);assert.equal(refreshed,1);
 panel.fire('input',field('code','A'));
 panel.fire('input',field('code','A4'));
 assert.deepStrictEqual([...timers.values()].map(x=>x.ms),[350],
  'second keystroke cancels the previous search timer');
 sample.run(350);assert.equal(refreshed,2);
 assert.equal(panel._vc1939.filters.code,'A4');
 panel.fire('change',{matches:q=>q==='[data-vc1939-preset]',value:'Guardada'});
 assert.equal(panel._vc1939.preset,'Guardada');
 assert.deepStrictEqual(api.diagnostics().bindings,1);
 assert.equal(api.diagnostics().filters,3);
 const classicBound={...panel,dataset:{vc1939Bound:'yes'},listeners:new Map()};
 assert.equal(api.bind(classicBound,hooks),false,'never duplicate existing classic listeners');
});

test('presets save/load/delete and clear preserve historical storage, trims and 15-item cap',async()=>{
 const {installRallySearchControls,RALLY_SEARCH_PRESETS_KEY}=await compiled();
 const sample=fakeWindow(),{win,panel,storageMap}=sample;
 let refreshed=0;const api=installRallySearchControls(win);
 panel._vc1939={filters:{status:'closed',skill:'A',evaluation:'#'},matchId:'partido',result:{},ctx:{}};
 api.bind(panel,{refresh:()=>refreshed++,toCSV:()=>''});
 win.prompt=()=> '  Nombre <con signos>   ';
 panel.fire('click',button('data-vc1939-save'));
 const saved=JSON.parse(storageMap.get(RALLY_SEARCH_PRESETS_KEY));
 assert.equal(saved.length,1);
 assert.equal(saved[0].name,'Nombre <con signos>');
 assert.equal(saved[0].filters.skill,'A');
 assert.equal(saved[0].filters.evaluation,'#');
 assert.equal(refreshed,1);
 panel._vc1939.filters={status:'closed',skill:'S'};
 panel.fire('click',button('data-vc1939-load'));
 assert.equal(panel._vc1939.filters.skill,'A');assert.equal(refreshed,2);
 panel.fire('click',button('data-vc1939-delete'));
 assert.equal(storageMap.get(RALLY_SEARCH_PRESETS_KEY),'[]');
 assert.equal(panel._vc1939.preset,'');assert.equal(refreshed,3);
 panel.fire('click',button('data-vc1939-clear'));
 assert.deepStrictEqual(panel._vc1939.filters,{status:'closed'});
 assert.equal(refreshed,4);
 assert.deepStrictEqual([api.diagnostics().saved,api.diagnostics().loaded,
  api.diagnostics().deleted],[1,1,1]);
 storageMap.set(RALLY_SEARCH_PRESETS_KEY,JSON.stringify(Array.from({length:15},(_,i)=>({
  name:'Pre'+i,filters:{status:'all'}}))));
 win.prompt=()=> 'Extra';panel.fire('click',button('data-vc1939-save'));
 assert.equal(JSON.parse(storageMap.get(RALLY_SEARCH_PRESETS_KEY)).length,15);
 assert.equal(JSON.parse(storageMap.get(RALLY_SEARCH_PRESETS_KEY))[14].name,'Extra');
});

test('CSV export keeps native content, sanitized filename, Blob MIME and URL cleanup',async()=>{
 const {installRallySearchControls}=await compiled();
 const sample=fakeWindow(),{win,panel}=sample;
 const api=installRallySearchControls(win),content='\ufeff"Partido";"Rally"\r\n"P";"1"';
 panel._vc1939={filters:{},matchId:'Club/Privado &A',result:{contacts:[]},ctx:{}};
 api.bind(panel,{refresh:()=>{},toCSV:()=>content});
 panel.fire('click',button('data-vc1939-export'));
 assert.deepStrictEqual(sample.getBlob().chunks,[content]);
 assert.equal(sample.getBlob().type,'text/csv;charset=utf-8');
 assert.equal(sample.getDownload(),'volley-coach-rally-search-Club_Privado__A.csv');
 assert.equal(api.diagnostics().exports,1);
 sample.run(1000);
 assert.equal(sample.getRevoked(),'blob:search-test');
 assert.equal(api.diagnostics().failures,0);
});

function fixture(){return {id:'P&1',sets:[{number:1,rallies:[
 {id:'r1',winner:'ours',servingBefore:'opponent',rotationBefore:1,actions:[
  {team:'ours',skill:'R',evaluation:'#',playerNameSnapshot:'A'},
  {team:'ours',skill:'A',evaluation:'#',playerNameSnapshot:'B'}]},
 {id:'r2',winner:'ours',servingBefore:'opponent',rotationBefore:2,actions:[
  {team:'ours',skill:'A',evaluation:'#',playerNameSnapshot:'B'}]}
 ]}]};}
function legacyPanel(win){
 const box=marker=>{let html='';return {get innerHTML(){return html},set innerHTML(x){html=x},
  get firstElementChild(){return html?{classList:{contains:cls=>cls===marker}}:null}}};
 const left=box('vc1939-left'),center=box('vc1939-center-body'),list={innerHTML:''},count={textContent:''};
 const handlers=new Map();
 const panel={ownerDocument:{defaultView:win,activeElement:null},dataset:{},
  querySelector:key=>({'.vc1937-left-body':left,'.vc1937-courtbody':center,
   '.vc1937-rallies':list,'.vc1937-rally-count':count}[key]||null),querySelectorAll:()=>[],
  addEventListener:(type,fn)=>handlers.set(type,fn),
  removeEventListener:(type,fn)=>{if(handlers.get(type)===fn)handlers.delete(type)}};
 return {panel,handlers,left};
}

test('real legacy decorate delegates events to TypeScript and redraws corrected/undone rallies',async()=>{
 const {installRallySearchControls,installRallySearchViewBridge}=await compiled();
 const sample=fakeWindow(),{win,timers}=sample;
 win.VC_DATA_ENGINE_1938={normalize:engine.normalize};
 installRallySearchViewBridge(win);const bridge=installRallySearchControls(win);
 vm.runInNewContext(read('190-vc1939-rally-search-pro.js'),{window:win});
 const original=fixture(),ctx={match:original,data:{rallies:[{set:1,id:'r1',index:1,winning:'ours'},
  {set:1,id:'r2',index:2,winning:'ours'}]}};
 const {panel,handlers}=legacyPanel(win),search=win.VC_RALLY_SEARCH_1939;
 search.decorate(panel,ctx,'search');
 assert.equal(panel.dataset.vc20531Controls,'typescript');
 assert.equal(bridge.diagnostics().bindings,1);
 assert.equal(handlers.size,3);
 // The selected filter remains in the session; updates run through typed events.
 handlers.get('change')({target:field('skill','A','select')});sample.run(0);
 assert.equal(panel._vc1939.filters.skill,'A');
 const baseline=panel._vc1939.result.statistics.contacts;
 original.sets[0].rallies[0].actions[1].skill='B';
 search.decorate(panel,ctx,'search');
 assert.ok(panel._vc1939.result.statistics.contacts<baseline);
 original.sets[0].rallies.pop();
 search.decorate(panel,ctx,'search');
 assert.equal(panel._vc1939.result.statistics.contacts,0);
 assert.equal(bridge.diagnostics().bindings,1,'redraw must not add duplicate events');
 assert.equal(handlers.size,3);
});

test('legacy controller remains the fallback if typed binder is absent or fails',async()=>{
 const original=fixture(),ctx={match:original,data:{rallies:[]}};
 for(const faulty of [undefined,{bind(){return false}},{bind(){throw Error('broken')}}]){
  const sample=fakeWindow(),{win}=sample;
  win.VC_DATA_ENGINE_1938={normalize:engine.normalize};
  if(faulty)win.VC_RALLY_CONTROLS_20531=faulty;
  vm.runInNewContext(read('190-vc1939-rally-search-pro.js'),{window:win});
  const {panel,handlers}=legacyPanel(win);
  win.VC_RALLY_SEARCH_1939.decorate(panel,ctx,'search');
  assert.equal(panel.dataset.vc20531Controls,'classic');
  assert.deepStrictEqual([...handlers.keys()].sort(),['change','click','input']);
 }
});

test('V20.5.31 contains exactly one new search control layer and no native writer',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.76');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.76'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.76'));
 assert.ok(sw.includes('rally-search-controls-20.5.31'));
 assert.ok(entry.includes('installRallySearchControls(window)'));
 assert.ok(read('190-vc1939-rally-search-pro.js').includes('VC_RALLY_CONTROLS_20531'));
 assert.ok(read('src/state/analysis-query-runtime.ts').includes('Controles Rally Search Pro migrados a TypeScript'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20531-rally-controls-migration.test.cjs'));
 for(const forbidden of ['indexedDB','supabase','scoutSave(','scoutPushAction(',
  'v121AwardPoint=','window.MatchState='])
  assert.equal(read('src/state/rally-search-controls.ts').includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
