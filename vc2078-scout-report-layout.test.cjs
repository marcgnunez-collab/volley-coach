'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const scout=read('021-core-scouting-v150-monolithic.js'),pdf=read('011-v5115-pdf-rosters-script.js');
const html=read('index.html'),sw=read('service-worker.js');
const depsNames=['scoutAnalysis','scoutSetsScore','scoutSequenceSummary','scoutArr','scoutDistributionRows','v757Safe','v757TableTeam','v757Gp','v757Rows','v757SkillRows','v757Pct','v757PhaseAttack','v757PlayerStats','v757SetStats','v961Group','v961Rows','v961GroupTable','v961CoverageTable','v961Integrity','v890PdfSimpleGroups','v890PdfRecSubtype','v890PdfSetTempo','v890PdfAttackTempo','v890PdfAttackCodes','EQUIPOS','equipoActivo'];
const hash={
 v757OfficialHTML:'64f1947a73a7b0dcc8699eab8f4eee9b4579ada270e9cdf42cbbbb6ec22bc469',
 v757ProPages:'58d6ebe19ba6820793bc0a2c818d196f0dc02aefcc667989880ce75b14432686'
};
function original(name){
 const start=`/* VC2078_FN_BEGIN:${name} */\n`,end=`\n/* VC2078_FN_END:${name} */`;
 const from=pdf.indexOf(start),to=pdf.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'read-only report section: '+name);
 const moved=pdf.slice(from+start.length,to);
 const injected=`function ${name}(m,ctx){const {${depsNames.join(',')}}=ctx;\n`;
 assert.ok(moved.startsWith(injected),'dependencies are explicit and passed on each report invocation');
 const body='{'+moved.slice(injected.length);
 assert.equal(sha(body),hash[name],'original HTML generator body remains byte for byte');
 return {moved,source:`function ${name}(m)`+body};
}
function fixture(){
 const arr=()=>[],str=x=>String(x??''),shape=values=>new Proxy(values,{get:(target,key)=>key in target?target[key]:[]});
 const stats=()=>shape({rows:[],k1:[],k2:[],k1Won:0,k2Won:0});
 const deps={scoutAnalysis:()=>shape({rallies:[],actions:[],rotations:[],opponentRotations:[],sidePct:0,breakPct:0,sideWon:0,sideTotal:0,breakWon:0,breakTotal:0}),
  scoutSetsScore:()=>({us:0,opponent:0}),scoutSequenceSummary:stats,scoutArr:v=>Array.isArray(v)?v:[],
  scoutDistributionRows:arr,v757Safe:str,v757TableTeam:()=>'<table></table>',v757Gp:()=>0,
  v757Rows:arr,v757SkillRows:arr,v757Pct:()=>0,v757PhaseAttack:()=>shape({rows:[],won:0,total:0,pts:0,err:0,blq:0,pct:0}),
  v757PlayerStats:arr,v757SetStats:()=>({s:{perfect:0,error:0},r:{total:0},a:{total:0},b:{perfect:0}}),
  v961Group:arr,v961Rows:arr,v961GroupTable:()=>'',v961CoverageTable:()=>'',v961Integrity:()=>({issues:[]}),
  v890PdfSimpleGroups:arr,v890PdfRecSubtype:arr,v890PdfSetTempo:arr,v890PdfAttackTempo:arr,v890PdfAttackCodes:arr,
  EQUIPOS:{infantil:{nombre:'Volley Coach'}},equipoActivo:'infantil'};
 const match={id:1,date:'2026-11-27',opponent:'Equipo rival',competition:'',sets:[{number:1,scoreUs:0,scoreOpponent:0,rallies:[]}],events:[]};
 return {deps,match};
}

test('V20.7.8 preserves the original PDF roster script and both report generator bodies',()=>{
 const end='/* VC2078_SCOUT_REPORT_LAYOUT_END */\n';
 const index=pdf.indexOf(end);
 assert.ok(index>0);
 const historical=pdf.slice(index+end.length+1);
 assert.equal(Buffer.byteLength(historical),23184);
 assert.equal(sha(historical),'15f59045b26c39e78446acf1863c115aef4a68a2554baaecfee7a63a45fde2fe');
 original('v757OfficialHTML');original('v757ProPages');
 assert.equal(sha(pdf),'f688ee8b60469f02eadbf2fd41604d5edeebf569791263f85e8d5f3bdcd83dbd');
 assert.equal(sha(scout),'7e1e12b1a8f5e33b6470b1bf21e8887dc66dd90d8f1b5f9205a4484a30ee328f');
 assert.equal(Buffer.byteLength(scout),705674);
});

test('the synchronous PDF module exports only read-only report functions',()=>{
 const init=pdf.slice(0,pdf.indexOf('/* VC2078_SCOUT_REPORT_LAYOUT_END */')+'/* VC2078_SCOUT_REPORT_LAYOUT_END */'.length);
 const context={window:{}};
 vm.runInNewContext(init,context,{filename:'011-v5115-pdf-rosters-script.js'});
 const api=context.window.VC_SCOUT_REPORT_LAYOUT_2078;
 assert.equal(api.VERSION,'20.7.8');assert.equal(api.pureOnly,true);
 assert.equal(typeof api.officialHTML,'function');
 assert.equal(typeof api.proPages,'function');
 assert.equal(Object.isFrozen(api),true);
});

test('report HTML matches the original generator on a minimal no-rallies fixture',()=>{
 const {deps,match}=fixture();
 for(const name of ['v757OfficialHTML','v757ProPages']){
  const {source,moved}=original(name);
  const originalFn=vm.runInNewContext('('+source+')',{...deps});
  const movedFn=vm.runInNewContext('('+moved+')',{});
  const expected=originalFn(match);
  const actual=movedFn(match,deps);
  if(name==='v757OfficialHTML')assert.equal(typeof actual,'string');
  else assert.ok(Array.isArray(actual)&&Array.isArray(expected),'multi-page HTML');
  assert.equal(JSON.stringify(actual),JSON.stringify(expected),name+' HTML parity');
 }
});

test('existing synchronous PDF script initializes before Scouting, with both assets refreshed',async()=>{
 const oldIndex=html.indexOf('<script id="v5115-pdf-rosters-script"'),scoutIndex=html.indexOf('<script id="core-scouting-v150-monolithic"');
 assert.ok(oldIndex>0&&scoutIndex>oldIndex);
 assert.match(html,/011-v5115-pdf-rosters-script\.js\?v=16\.0\.2\.1&amp;rev=20\.7\.8/);
 assert.match(html,/021-core-scouting-v150-monolithic\.js\?v=20\.7\.0&amp;rev=20\.7\.8/);
 assert.match(sw,/report-layout-20\.7\.8/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.retainedCandidates,37,'no additional retired assets or file deletions');
});

test('Scouting keeps the report entrypoint and native writers, with one release version',()=>{
 assert.match(scout,/function v757OfficialHTML\(m\)\{return window\.VC_SCOUT_REPORT_LAYOUT_2078\.officialHTML\(/);
 assert.match(scout,/function v757ProPages\(m\)\{return window\.VC_SCOUT_REPORT_LAYOUT_2078\.proPages\(/);
 assert.ok(scout.includes('window.scoutAwardPoint='));
 assert.ok(scout.includes('window.scoutUndoRally='));
 assert.ok(scout.includes('const V902_JOURNAL_DB='));
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(require('./package.json').version,manifest.updatedIn);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc2078-scout-report-layout.test.cjs'));
});
