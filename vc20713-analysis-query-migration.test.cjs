'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const html=read('index.html'),core=read('021-core-scouting-v150-monolithic.js');
const layout=read('011-v5115-pdf-rosters-script.js'),sw=read('service-worker.js');
const names='scoutV640ActionRowsByRally scoutV640DistributionEvents scoutV640Candidates scoutV640FilterDistribution scoutV640FilterAttacks scoutV640Group scoutV640SamplePill scoutV640DrillRows scoutV650Groups scoutV650Attacks scoutV650CandidateMap scoutV650FilterSetter scoutV650FilterAttacker scoutV650Group scoutV650RotationData scoutV650Roster scoutV650DrillRows scoutV670Rallies scoutV670Pair scoutV670MetricValue scoutV670MetricSample scoutV670CellClass scoutV670TopAttackPattern scoutV670ConfidenceCell scoutV670BestWorst scoutV670OwnSummary scoutV670FormatMetric scoutV670RallyCodes'.split(' ');

function migrated(name){
 const begin='/* VC20713_FN_BEGIN:'+name+' */\n',end='\n/* VC20713_FN_END:'+name+' */';
 const from=layout.indexOf(begin),to=layout.indexOf(end,from+begin.length);
 assert.ok(from>=0&&to>from,'original analysis formula is present: '+name);
 return layout.slice(from+begin.length,to);
}
function restored(name){
 const source=migrated(name);
 const injected=source.match(/^function (\w+)\(([^)]*)\)\{const \{([^}]*)\}=ctx;\n/);
 assert.ok(injected&&injected[1]===name,'read-only dependency injection: '+name);
 assert.ok(/(?:,)?ctx$/.test(injected[2]),'context is final argument: '+name);
 const args=injected[2].replace(/,?ctx$/,'');
 return {original:'function '+name+'('+args+'){'+source.slice(injected[0].length),args:args.split(',').filter(Boolean),deps:injected[3].split(',').filter(Boolean)};
}
const mocks={
 $:()=>({value:''}),esc:v=>String(v??''),
 scoutArr:v=>Array.isArray(v)?v:[],
 scoutActionPlayerLabel:a=>a?.playerName||'Jugadora',
 scoutActionCount:()=>0,scoutPlayerKey:a=>String(a?.playerId||0),
 scoutV640Key:a=>String(a?.playerId||0),
 scoutV640DecodedPlayer:()=>'',scoutV640LabelTarget:v=>String(v||''),
 scoutV640Pct:()=>0,scoutV640Eff:()=>0,scoutV640Filters:()=>({team:'ours'}),
 scoutV640Match:()=>null,
 scoutV640ActionRowsByRally:()=>[],scoutV640DistributionEvents:()=>[],
 scoutV640FilterAttacks:()=>[],scoutV640FilterDistribution:()=>[],
 scoutingMatches:[],scoutV650OpponentKey:s=>String(s||'').toLowerCase(),
 scoutV650Distribution:()=>[],scoutV650Attacks:()=>[],
 scoutV650Filters:()=>({player:'',reception:'',rotation:0,phase:''}),
 scoutV650Group:()=>[],scoutV650AllSequences:()=>[],scoutV650AllActions:()=>[],
 scoutV650Matches:()=>[],scoutV650FilterSetter:()=>[],scoutV650FilterAttacker:()=>[],
 scoutV670Matches:()=>[],scoutV670Rallies:()=>[],scoutV670Eff:()=>0,
 scoutV670Pct:()=>0,scoutV670MetricValue:()=>null,scoutV670MetricSample:()=>0
};
const emptyMatch={sets:[]};
const cases={
 scoutV640ActionRowsByRally:[emptyMatch,'ours'],
 scoutV640DistributionEvents:[emptyMatch,'ours'],
 scoutV640Candidates:[emptyMatch,'ours','setter'],
 scoutV640FilterDistribution:[emptyMatch,{team:'ours'}],
 scoutV640FilterAttacks:[emptyMatch,{team:'ours'}],
 scoutV640Group:[[],x=>x],
 scoutV640SamplePill:[4],
 scoutV640DrillRows:['setterTarget',''],
 scoutV650Groups:[],
 scoutV650Attacks:[[]],
 scoutV650CandidateMap:[[],'setter'],
 scoutV650FilterSetter:[[]],
 scoutV650FilterAttacker:[[]],
 scoutV650Group:[[],x=>x],
 scoutV650RotationData:[[]],
 scoutV650Roster:[[]],
 scoutV650DrillRows:['setterTarget',''],
 scoutV670Rallies:[],
 scoutV670Pair:[1,1,[]],
 scoutV670MetricValue:[{total:0,sideTotal:0,breakTotal:0}],
 scoutV670MetricSample:[{total:0,sideTotal:0,breakTotal:0}],
 scoutV670CellClass:[{total:0,sideTotal:0,breakTotal:0}],
 scoutV670TopAttackPattern:[{rallies:[]},'ours'],
 scoutV670ConfidenceCell:[{total:0}],
 scoutV670BestWorst:[[]],
 scoutV670OwnSummary:[[]],
 scoutV670FormatMetric:[{total:0,sideTotal:0,breakTotal:0}],
 scoutV670RallyCodes:[{actions:[]},'ours']
};
function newApi(){
 const end='/* VC20713_ANALYSIS_QUERY_END */';
 const prefix=layout.slice(0,layout.indexOf(end)+end.length);
 const window={};
 vm.runInNewContext(prefix,{window},{filename:'analysis-query.js'});
 return window.VC_SCOUT_ANALYSIS_QUERY_20713;
}
function parity(name,args,api=newApi(),overrides={}){
 const {original,deps}=restored(name),context={...mocks,...overrides};
 const legacy=vm.runInNewContext('('+original+')',{...context,window:{}},{filename:name+'-original.js'});
 const inputs=JSON.stringify(args);
 const ctx=Object.fromEntries(deps.map(dep=>[dep,context[dep]]));
 assert.deepEqual(JSON.stringify(api.functions[name](...args,ctx)),JSON.stringify(legacy(...args)),'same calculation: '+name);
 assert.equal(JSON.stringify(args),inputs,'no input mutation: '+name);
}

test('all 28 analytics functions preserve exact V20.7.12 original bodies',()=>{
 const originals=[];
 for(const name of names){
  const {original}=restored(name);
  originals.push(original);
  new vm.Script(original,{filename:name+'.js'});
  assert.ok(!core.includes(original),'implementation is no longer in main core: '+name);
  assert.match(core,new RegExp('function '+name+'\\([^\\n]*VC_SCOUT_ANALYSIS_QUERY_20713\\.functions\\.'+name+'\\('));
 }
 assert.equal(sha(originals.join('\n\n')),'6edc528a55bbaff77c42b83e71eb0f016d3d89b2b0789fdad303c09431f34b1c');
});

test('all 28 calculations return the same values with identical read-only input',()=>{
 const api=newApi();
 assert.equal(api.VERSION,'20.7.13');
 assert.equal(api.readOnly,true);
 assert.deepEqual(Object.keys(api.functions).sort(),[...names].sort());
 for(const name of names)parity(name,cases[name],api);
});

test('groups, historical attacks and rotation crossings preserve data with populated samples',()=>{
 const api=newApi();
 parity('scoutV640Group',[[{team:'A'},{team:'A'},{team:'B'}],x=>x.team],api);
 parity('scoutV650Group',[[{zone:4},{zone:4},{zone:2}],x=>'Z'+x.zone],api);
 parity('scoutV670OwnSummary',[[{own:1,opp:3,total:1,rallies:[{winner:'ours',servingBefore:'opponent'}],pointPct:100}]],api,{scoutV670Pct:(a,b)=>b?Math.round(a*100/b):0});
 const match={id:8,sets:[{number:1,rallies:[{actions:[{team:'opponent',skill:'A',playerId:5,evaluation:'#'}],servingBefore:'opponent',rotationBefore:2,winner:'opponent'}]}]};
 parity('scoutV650Attacks',[[match]],api);
 parity('scoutV640ActionRowsByRally',[match,'opponent'],api);
 parity('scoutV670Pair',[1,2,[{own:1,opp:2,winner:'ours',servingBefore:'opponent',actions:[]}]],api);
});

test('analytics module loads before scouting without adding any request',()=>{
 const first=html.indexOf('id="v5115-pdf-rosters-script"'),second=html.indexOf('id="core-scouting-v150-monolithic"');
 assert.ok(first>0&&second>first);
 for(const name of ['011-v5115-pdf-rosters-script','021-core-scouting-v150-monolithic']){
  assert.match(html,new RegExp(name+'\\.js\\?v=[^"]+&amp;rev=20\\.7\\.13'));
 }
 assert.ok(Buffer.byteLength(core)<669627-6000,'core shrinks at least 6KB');
 assert.equal(names.length,28);
});

test('writers and deferred-retirement policy remain native and unchanged',async()=>{
 for(const marker of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','const V902_JOURNAL_DB=','window.VC_SCOUT_VIDEO_BRIDGE='])assert.ok(core.includes(marker),marker);
 assert.doesNotMatch(layout,/window\.scoutAwardPoint\s*=/);
 assert.match(sw,/analysis-queries-20\.7\.13/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.ok(audit.retainedCandidates>=41);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.equal(manifest.updatedIn,require('./package.json').version);
 assert.ok(manifest.groups.flatMap(g=>g.files).length>=41);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20713-analysis-query-migration.test.cjs'));
});
