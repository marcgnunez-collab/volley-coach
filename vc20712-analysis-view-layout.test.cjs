'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {gzipSync}=require('node:zlib');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const html=read('index.html'),core=read('021-core-scouting-v150-monolithic.js');
const layout=read('011-v5115-pdf-rosters-script.js'),sw=read('service-worker.js');
const functions={
 scoutV640SetterView:{args:'m,f',deps:'$,esc,scoutV640Bar,scoutV640DecodedPlayer,scoutV640DistributionEvents,scoutV640Eff,scoutV640Enc,scoutV640FilterDistribution,scoutV640FilterSummary,scoutV640Group,scoutV640Key,scoutV640LabelTarget,scoutV640Pct',hash:'0291063535451f2b599d4281437f61212fb97680d9be292d6c1a03a5b69f5566'},
 scoutV640AttackerView:{args:'m,f',deps:'$,esc,scoutV640Bar,scoutV640Eff,scoutV640Enc,scoutV640FilterAttacks,scoutV640FilterSummary,scoutV640Group,scoutV640LabelTarget,scoutV640Pct',hash:'bbf60dee915ee3db141bca53342c4bb50087ead3dfb9d2eb8bb3cbf43b75ab1c'},
 scoutV650MatchTable:{args:'matches',deps:'esc,scoutActionRows,scoutArr,scoutV650Result',hash:'a49e67cc64113001b3d58b104d49aa0d6fccb2455339005fa87d478388989333'},
 scoutV650SetterHTML:{args:'matches',deps:'$,esc,scoutV640Eff,scoutV640LabelTarget,scoutV640Pct,scoutV650Bar,scoutV650FilterSetter,scoutV650Group',hash:'2f98d1d70e8f8f42f3c2ea44c13d8e01d4015faeac2937ff7ce8fe93fde99ad5'},
 scoutV650AttackerHTML:{args:'matches',deps:'$,esc,scoutV640Eff,scoutV640LabelTarget,scoutV640Pct,scoutV650Bar,scoutV650FilterAttacker,scoutV650Group',hash:'0065941b7941bce6fda1612c255c710e2f8ffe9bbadcaccb40b98a054180f163'},
 scoutV650RotationHTML:{args:'matches',deps:'esc,scoutV640Pct,scoutV650RotationData',hash:'a9d55f8372212b5fa83a30835d9daf8f71b277836ef6d46d255870f5b7200ab3'},
 scoutV670MatrixHTML:{args:'matrix',deps:'scoutV670CellClass,scoutV670FormatMetric,scoutV670MetricSample',hash:'be40dd510cc3fca29983f05447dd96adb15ee88ac5f1407d1a533772de5660d8'},
 scoutV670InsightsHTML:{args:'matrix',deps:'esc,scoutV670BestWorst,scoutV670FormatMetric,scoutV670OwnSummary,scoutV670PairLabel',hash:'ba38f58f8a6630e9c787577d43c36079712a9b38f17a4cab1b73b93b689304b4'},
 scoutV670SelectedHTML:{args:'pair',deps:'esc,scoutV670CellClass,scoutV670ConfidenceCell,scoutV670PairLabel,scoutV670TopAttackPattern',hash:'9f272771ddbd9d62bdb3ffab8491bb8fc80000aff663c0ba5d3aa63bf46aacf0'},
 scoutV670OwnSummaryHTML:{args:'matrix',deps:'scoutV670OwnSummary',hash:'684efbc4c014be5d17560371c639c7ba886bad6eeec74f7cd2fbad0438087836'},
 scoutV670PatternTable:{args:'pair,team',deps:'esc,scoutArr,scoutV640LabelTarget,scoutV670Eff,scoutV670Pct',hash:'3fcc544143a1632f492550edce424b6463577f079d056ee904e9d6ca089fbf0a'}
};
function extracted(name){
 const start='/* VC20712_FN_BEGIN:'+name+' */\n';
 const end='\n/* VC20712_FN_END:'+name+' */';
 const i=layout.indexOf(start),j=layout.indexOf(end,i+start.length);
 assert.ok(i>0&&j>i,'view was moved: '+name);
 return layout.slice(i+start.length,j);
}
function original(name){
 const {args,deps}=functions[name],source=extracted(name);
 const injected='function '+name+'('+args+',ctx){const {'+deps+'}=ctx;\n';
 assert.ok(source.startsWith(injected),'explicit dependencies of '+name);
 return 'function '+name+'('+args+'){'+source.slice(injected.length);
}
const emptyArray=()=>[];
const mocked={
 $:()=>({selectedOptions:[{textContent:'Jugadora de prueba'}],value:''}),
 esc:v=>String(v??''),scoutArr:v=>Array.isArray(v)?v:[],
 scoutActionRows:()=>[],scoutV650Result:()=>({won:0,lost:0}),
 scoutV640Pct:()=>0,scoutV640Eff:()=>0,scoutV640Enc:v=>encodeURIComponent(v),
 scoutV640DecodedPlayer:()=>'',scoutV640Bar:()=>'',
 scoutV640DistributionEvents:emptyArray,scoutV640FilterDistribution:emptyArray,
 scoutV640FilterAttacks:emptyArray,scoutV640FilterSummary:()=>'',
 scoutV640Group:emptyArray,scoutV640Key:()=>'',scoutV640LabelTarget:v=>String(v||''),
 scoutV650Bar:()=>'',
 scoutV650FilterSetter:emptyArray,scoutV650FilterAttacker:emptyArray,
 scoutV650Group:emptyArray,scoutV650RotationData:emptyArray,
 scoutV670CellClass:()=>'',scoutV670FormatMetric:()=>'',
 scoutV670MetricSample:()=>'',scoutV670BestWorst:()=>({best:null,worst:null}),
 scoutV670OwnSummary:emptyArray,scoutV670PairLabel:()=>'',scoutV670ConfidenceCell:()=>'',
 scoutV670TopAttackPattern:()=>null,scoutV670Eff:()=>0,scoutV670Pct:()=>0
};
const cases={
 scoutV640SetterView:[{sets:[]},{team:'ours'}],
 scoutV640AttackerView:[{sets:[]},{team:'ours'}],
 scoutV650MatchTable:[[]],scoutV650SetterHTML:[[]],scoutV650AttackerHTML:[[]],
 scoutV650RotationHTML:[[]],scoutV670MatrixHTML:[Array.from({length:36},(_,i)=>({own:Math.floor(i/6)+1,opp:i%6+1,total:0,sideTotal:0,breakTotal:0,ourAttacks:0,won:0,lost:0}))],scoutV670InsightsHTML:[[]],
 scoutV670SelectedHTML:[null],scoutV670OwnSummaryHTML:[[]],
 scoutV670PatternTable:[{rallies:[]},'ours']
};

test('all 11 original HTML renderer bodies preserve their V20.7.11 SHA-256 hashes',()=>{
 const all=[];
 for(const [name,meta] of Object.entries(functions)){
  const source=original(name);
  assert.equal(sha(source),meta.hash,name+' byte-level unchanged output algorithm');
  assert.ok(!core.includes(source),name+' no longer lives in scouting core');
  new vm.Script(source,{filename:name+'.js'});
  all.push(source);
 }
 assert.equal(sha(all.join('\n\n')),'03b37a6bf065906d2b3ffb21c741763bf6c0a4ecfb462909be795530188637a1');
});

test('the extracted module generates exactly the same HTML as the original functions',()=>{
 const end='/* VC20712_ANALYSIS_VIEW_LAYOUT_END */';
 const module=layout.slice(0,layout.indexOf(end)+end.length);
 const win={};vm.runInNewContext(module,{window:win},{filename:'analysis-views.js'});
 assert.equal(win.VC_SCOUT_ANALYSIS_VIEWS_20712.VERSION,'20.7.12');
 assert.equal(win.VC_SCOUT_ANALYSIS_VIEWS_20712.presentationOnly,true);
 for(const [name,args] of Object.entries(cases)){
  const meta=functions[name];
  const old=vm.runInNewContext('('+original(name)+')',{...mocked,window:{}},{filename:name+'-original.js'});
  const dependencies=Object.fromEntries(meta.deps.split(',').map(key=>[key,mocked[key]]));
  const unchanged=JSON.stringify(args);
  assert.equal(win.VC_SCOUT_ANALYSIS_VIEWS_20712.functions[name](...args,dependencies),old(...args),'identical HTML for '+name);
  assert.equal(JSON.stringify(args),unchanged,'render does not change input: '+name);
 }
});

test('populated rival, rotation and attack-pattern HTML still matches original output',()=>{
 const marker='/* VC20712_ANALYSIS_VIEW_LAYOUT_END */';
 const win={};vm.runInNewContext(layout.slice(0,layout.indexOf(marker)+marker.length),{window:win});
 const populated={
  scoutV650MatchTable:[[{id:41,date:'2026-11-27',competition:'Liga',sets:[{rallies:[{actions:[]}]}]}]],
  scoutV670SelectedHTML:[{own:1,opp:4,total:5,pointPct:60,sideTotal:2,sidePct:50,breakTotal:3,breakPct:66,ourAttacks:2,ourEff:50,oppAttacks:1,oppEff:0}],
  scoutV670PatternTable:[{rallies:[{actions:[{team:'ours',skill:'A',attackCombo:'Rápida',evaluation:'#',startZone:3,endZone:5},{team:'ours',skill:'A',attackCombo:'Rápida',evaluation:'=',startZone:3,endZone:5}]}]},'ours']
 };
 for(const [name,args] of Object.entries(populated)){
  const deps=Object.fromEntries(functions[name].deps.split(',').map(key=>[key,mocked[key]]));
  const originalFn=vm.runInNewContext('('+original(name)+')',{...mocked,window:{}});
  const expected=originalFn(...args),actual=win.VC_SCOUT_ANALYSIS_VIEWS_20712.functions[name](...args,deps);
  assert.equal(actual,expected,'same output with real data in '+name);
  assert.ok(actual.length>100,'nontrivial HTML generated in '+name);
 }
});

test('the HTML loads the view module before the core and the size reduction is real',()=>{
 const pdfTag=html.indexOf('id="v5115-pdf-rosters-script"');
 const coreTag=html.indexOf('id="core-scouting-v150-monolithic"');
 assert.ok(pdfTag>0&&coreTag>pdfTag,'presentation functions exist before caller');
 for(const asset of ['011-v5115-pdf-rosters-script','021-core-scouting-v150-monolithic']){
  assert.match(html,new RegExp(asset+'\\.js\\?v=[^"]+&amp;rev=20\\.7\\.\\d+'));
 }
 assert.ok(Buffer.byteLength(core)<=669627,'later query extractions cannot expand the core');
 assert.ok(Buffer.byteLength(layout)>67000);
 assert.ok(gzipSync(Buffer.from(core)).length>0);
 assert.equal(Object.keys(functions).length,11);
});

test('all native writers, saved actions, video and network boundaries remain in the original core',()=>{
 for(const marker of [
  'window.scoutAwardPoint=', 'window.scoutUndoRally=', 'window.scoutSaveLineup=',
  'const V902_JOURNAL_DB=', 'window.VC_SCOUT_VIDEO_BRIDGE='
 ])assert.ok(core.includes(marker),'unchanged single native writer '+marker);
 for(const name of Object.keys(functions)){
  assert.match(core,new RegExp('function '+name+'\\([^\\n]*VC_SCOUT_ANALYSIS_VIEWS_20712\\.functions\\.'+name+'\\('));
 }
 assert.doesNotMatch(layout,/window\.scoutAwardPoint\s*=/);
 assert.doesNotMatch(layout,/window\.scoutUndoRally\s*=/);
});

test('service worker updates caches and 41 candidate files are still deferred',async()=>{
 assert.match(sw,/analysis-view-layout-20\.7\.12/);
 assert.match(html,/V20\.7\.12 · VISTAS DE ANÁLISIS MODULARES/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.ok(audit.retainedCandidates>=41);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(manifest.updatedIn,require('./package.json').version);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.ok(manifest.groups.flatMap(group=>group.files).length>=41);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc20712-analysis-view-layout.test.cjs'));
});
