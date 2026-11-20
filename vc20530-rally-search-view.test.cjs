'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const search=require('./190-vc1939-rally-search-pro.js');
const engine=require('./189-vc1938-professional-data-engine.js');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

function match(count=90){
 const sets=[{number:1,rallies:[]},{number:2,rallies:[]}];
 for(let i=0;i<count;i++)sets[i%2].rallies.push({
  id:i%17===0?null:`r${i}`,servingBefore:i%6===0?'ours':'opponent',
  winner:i%13===0?null:i%4===0?'opponent':'ours',
  rotationBefore:i%6+1,opponentRotationBefore:(i+2)%6+1,
  actions:[
   {team:'ours',skill:'R',evaluation:i%5===0?'#':'+',playerNameSnapshot:'Receptor <7> &',startZone:'5C'},
   {team:'ours',skill:'E',evaluation:'+',playerNameSnapshot:'Colocador "3"',setTarget:'4D',setTempo:'2',attackCombo:'C3'},
   {team:'ours',skill:'A',evaluation:i%4===0?'=':'#',playerNameSnapshot:'Atacante &8',startZone:'4B',endZone:'1A',videoTime:i},
   {team:'opponent',skill:'S',evaluation:'=',playerNameSnapshot:'Rival 04',startZone:'1D',endZone:'5A'},
   i%15===0?{team:null,skill:'?',evaluation:'?',startZone:'X'}:null
  ]
 });
 return {id:'Secreto & <club>',sets};
}
test('Rally Search Pro HTML from Vite matches the classic template byte-for-byte for realistic filters',async()=>{
 const {normalizeAnalysisMatch,renderRallySearchView,queryRallies}=await compiled();
 for(const count of [0,2,55,140]){
  const native=match(count),before=JSON.stringify(native),data=normalizeAnalysisMatch(native);
  for(const filters of [{},{status:'all'},{status:'open'},{status:'closed'},
   {skill:'A'},{team:'ours',evaluation:'#'},{team:'opponent',evaluation:'='},
   {player:'Atacante &8'},{setter:'Colocador "3"'},
   {team:'ours',startZone:'4B',endZone:'1A'},{video:'yes'},{video:'no'},
   {outcome:'ours',set:2},{ownRotation:4},{rivalRotation:3},
   {team:'ours',reception:'#',attacker:'Atacante &8'},
   {team:'ours',setter:'Colocador "3"',tempo:'2',combo:'C3'},
   {code:'4B',skill:'A',evaluation:'#'},
   {status:'all',team:'ours',phase:'K1'},
   {code:'<script>alert(1)</script>',player:'<script>'}]){
   const expectedSearch=search.query(data,filters),modernSearch=queryRallies(data,filters);
   assert.equal(JSON.stringify(modernSearch),JSON.stringify(expectedSearch));
   const expected=search.renderPanel(data,expectedSearch,filters);
   const actual=renderRallySearchView(data,modernSearch,filters);
   assert.deepStrictEqual(actual,expected,JSON.stringify({count,filters}));
  }
  assert.equal(JSON.stringify(native),before,'scouting stays unchanged');
 }
});

test('typed catalogs retain selection order, 250-option cap and safe HTML escaping',async()=>{
 const {normalizeAnalysisMatch,catalogRallySearch,renderRallySearchView,queryRallies}=await compiled();
 const data=normalizeAnalysisMatch(match(320));
 assert.deepStrictEqual(catalogRallySearch(data),search.catalog(data));
 const modern=renderRallySearchView(data,queryRallies(data,{status:'all'}),{status:'all'});
 assert.ok(modern.left.includes('Atacante &amp;8'));
 assert.ok(modern.left.includes('Receptor &lt;7&gt; &amp;'));
 assert.ok(!modern.left.includes('Receptor <7> &'));
 const special=normalizeAnalysisMatch(match(2));
 for(let i=0;i<300;i++){
  special.contacts.push({...special.contacts[0],player:`Jugador ${i}`});
 }
 const c=catalogRallySearch(special);
 assert.equal(c.players.length,250);
 assert.deepStrictEqual(c,search.catalog(special));
});

test('historic Rally Search actually delegates to TypeScript and recovers from absent or corrupt renderers',async()=>{
 const {installRallySearchViewBridge}=await compiled();
 const win={performance:{now:()=>1}},bridge=installRallySearchViewBridge(win);
 vm.runInNewContext(read('190-vc1939-rally-search-pro.js'),{window:win});
 const api=win.VC_RALLY_SEARCH_1939,native=match(37),original=JSON.stringify(native),
  data=engine.normalize(native),result=api.query(data,{team:'ours',status:'all'});
 const expected=search.renderPanel(data,result,{status:'all'});
 assert.equal(JSON.stringify(api.renderPanel(data,result,{status:'all'})),JSON.stringify(expected));
 assert.equal(bridge.diagnostics().renders,1);
 assert.strictEqual(installRallySearchViewBridge(win),bridge);
 assert.equal(Object.isFrozen(bridge.diagnostics()),true);
 for(const phrase of ['Secreto','Atacante','Colocador','<club>'])
  assert.ok(!JSON.stringify(bridge.diagnostics()).includes(phrase));
 win.VC_RALLY_VIEW_20530={render(){throw Error('broken view')}};
 assert.equal(JSON.stringify(api.renderPanel(data,result,{status:'all'})),JSON.stringify(expected));
 win.VC_RALLY_VIEW_20530={render(){return {left:'',center:'bad'}}};
 assert.equal(JSON.stringify(api.renderPanel(data,result,{status:'all'})),JSON.stringify(expected));
 delete win.VC_RALLY_VIEW_20530;
 assert.equal(JSON.stringify(api.renderPanel(data,result,{status:'all'})),JSON.stringify(expected));
 assert.equal(JSON.stringify(native),original);
});

function fakePanel(win){
 const writes={left:0,center:0};
 const el=key=>{
  let html='';return {get innerHTML(){return html},set innerHTML(next){html=next;writes[key]++},
   get firstElementChild(){const found=html.match(/class="([^"]+)"/);return found?{
    classList:{contains:klass=>found[1].split(/\s+/).includes(klass)}}:null}};
 };
 const left=el('left'),center=el('center'),list={innerHTML:''},count={textContent:''};
 const handlers=new Map(),panel={ownerDocument:{defaultView:win,activeElement:null},dataset:{},
  querySelector:key=>({'.vc1937-left-body':left,'.vc1937-courtbody':center,
   '.vc1937-rallies':list,'.vc1937-rally-count':count}[key]||null),
  querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers.set(type,fn)};
 return {panel,writes,handlers,left,center,count};
}
test('legacy search decoration keeps native rally IDs, filters and single event binding with new view',async()=>{
 const {installRallySearchViewBridge}=await compiled();
 const win={performance:{now:()=>2}},bridge=installRallySearchViewBridge(win);
 win.VC_DATA_ENGINE_1938={normalize:engine.normalize};
 vm.runInNewContext(read('190-vc1939-rally-search-pro.js'),{window:win});
 const native=match(5),ctx={match:native,data:{rallies:[
  {set:1,id:'r2',index:2,winning:'ours'},{set:2,id:'r3',index:2,winning:'ours'},
  {set:1,id:'made-up',index:8,winning:'ours'}]}};
 const {panel,writes,handlers,left}=fakePanel(win);
 win.VC_RALLY_SEARCH_1939.decorate(panel,ctx,'search');
 assert.equal(panel.dataset.vc1939Bound,'yes');
 assert.equal(writes.left,1);assert.equal(writes.center,1);
 assert.deepStrictEqual([...handlers.keys()].sort(),['change','click','input']);
 assert.ok(panel._vc1937VisibleRallies.every(r=>r.id!=='made-up'));
 assert.equal(bridge.diagnostics().renders,1);
 win.VC_RALLY_SEARCH_1939.decorate(panel,ctx,'search');
 assert.equal(writes.left,1,'identical HTML preserves the search controls');
 assert.equal(writes.center,1);
 assert.equal(handlers.size,3,'no duplicate handlers after a second render');
 assert.equal(bridge.diagnostics().renders,2);
 panel._vc1939.filters={...panel._vc1939.filters,skill:'A',evaluation:'='};
 win.VC_RALLY_SEARCH_1939.decorate(panel,ctx,'search');
 assert.ok(writes.left>1,'filters update real DOM');
 assert.ok(left.innerHTML.includes('data-vc1939-save'));
});

test('search templates update after a correction and undo, but presets retain classic storage boundaries',async()=>{
 const {normalizeAnalysisMatch,renderRallySearchView,queryRallies}=await compiled();
 const native=match(8),render=()=>{
  const data=normalizeAnalysisMatch(native),result=queryRallies(data,{team:'ours',skill:'A',evaluation:'#'});
  return renderRallySearchView(data,result,{status:'all'}).center;
 };
 const before=render();
 native.sets[0].rallies[1].actions[2].evaluation='=';
 const corrected=render();assert.notEqual(corrected,before);
 native.sets[0].rallies.pop();
 const undone=render();assert.notEqual(undone,corrected);
 let saved='[{"name":"Prefiltro","filters":{"status":"all","skill":"A"}}]';
 const storage={getItem:key=>key==='vc1939:search-presets:1'?saved:null,
  setItem:(key,value)=>{assert.equal(key,'vc1939:search-presets:1');saved=value;}};
 const presets=search.readPresets(storage);
 assert.deepStrictEqual(presets[0],{name:'Prefiltro',filters:search.normFilters({status:'all',skill:'A'})});
 assert.equal(search.readPresets(null).length,0);
});

test('V20.5.30 adds modular Rally Search while keeping native scoring, cloud and video untouched',()=>{
 const pkg=JSON.parse(read('package.json')),entry=read('src/vc2055-entry.ts'),
  html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.52');
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.52'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.52'));
 assert.ok(sw.includes('rally-search-view-20.5.30'));
 assert.ok(entry.includes('installRallySearchViewBridge(window)'));
 assert.ok(read('190-vc1939-rally-search-pro.js').includes('VC_RALLY_VIEW_20530'));
 assert.ok(read('src/state/analysis-query-runtime.ts').includes('Vista Rally Search Pro migrada a TypeScript'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20530-rally-search-view.test.cjs'));
 for(const file of ['src/state/rally-search-view.ts','src/state/rally-search-view-runtime.ts'])
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(',
   'scoutPushAction(','v121AwardPoint=','window.MatchState='])
   assert.equal(read(file).includes(forbidden),false,`${file} contains ${forbidden}`);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
