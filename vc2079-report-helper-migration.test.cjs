'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const core=read('021-core-scouting-v150-monolithic.js');
const pdf=read('011-v5115-pdf-rosters-script.js');
const html=read('index.html');
const sw=read('service-worker.js');
const helperNames='v757Pct,v757Gp,v757Rows,v757SkillRows,v757Impact,v757PlayerStats,v757PhaseAttack,v757SetStats,v757Safe,v757TableTeam,v890PdfRows,v890PdfPct,v890PdfTop,v890PdfOutcome,v890PdfRecSubtype,v890PdfSetTempo,v890PdfAttackTempo,v890PdfAttackCodes,v890PdfSimpleGroups,v961Rows,v961Pct,v961Group,v961Coverage,v961Integrity,v961CoverageTable,v961GroupTable'.split(',');
const nativeNames='scoutAnalysis,scoutSetsScore,scoutSequenceSummary,scoutArr,scoutDistributionRows,EQUIPOS,equipoActivo,scoutActionRows,scoutPlayerKey,scoutV61010FullStats,scoutSkillMetric,esc'.split(',');
const older='scoutAnalysis,scoutSetsScore,scoutSequenceSummary,scoutArr,scoutDistributionRows,v757Safe,v757TableTeam,v757Gp,v757Rows,v757SkillRows,v757Pct,v757PhaseAttack,v757PlayerStats,v757SetStats,v961Group,v961Rows,v961GroupTable,v961CoverageTable,v961Integrity,v890PdfSimpleGroups,v890PdfRecSubtype,v890PdfSetTempo,v890PdfAttackTempo,v890PdfAttackCodes,EQUIPOS,equipoActivo'.split(',');
function helper(name){
 const begin=`/* VC2079_HELPER_BEGIN:${name} */\n`,end=`\n/* VC2079_HELPER_END:${name} */`;
 const a=pdf.indexOf(begin),b=pdf.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,'original report helper present: '+name);
 return pdf.slice(a+begin.length,b);
}
function originalReport(name){
 const begin=`/* VC2078_FN_BEGIN:${name} */\n`,end=`\n/* VC2078_FN_END:${name} */`;
 const a=pdf.indexOf(begin),b=pdf.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a);
 const moved=pdf.slice(a+begin.length,b),injected=`function ${name}(m,ctx){const {${older.join(',')}}={...ctx,...v2079CreateReportHelpers(ctx)};\n`;
 assert.ok(moved.startsWith(injected));
 return `function ${name}(m)`+'{'+moved.slice(injected.length);
}
function fixture(withRallies){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const action=(team,skill,evaluation,i)=>({team,skill,evaluation,id:i+1,uid:'act-'+i,set:1,rallyIndex:0,actionIndex:i,winner:'ours',playerId:team==='ours'?5:9,playerLabel:team==='ours'?'5 · Ana':'9 · Rival',code:'5'+skill+evaluation,servingBefore:'ours',startZone:'1',endZone:'5',attackTempo:skill==='A'?'Q':'',skillSubtype:skill==='R'?'L':''});
 const rally={id:1,winner:'ours',servingBefore:'ours',rotationBefore:1,opponentRotationBefore:1,actions:withRallies?[
  action('ours','S','#',0),action('opponent','R','-',1),action('opponent','E','+',2),action('ours','A','#',3)
 ]:[]};
 const match={id:101,date:'2026-11-27',opponent:'Rival & Co',competition:'Liga',status:'finished',sets:[{number:1,scoreUs:1,scoreOpponent:0,rallies:withRallies?[rally]:[]}],events:[],currentSet:1,rotationNo:1,opponentRotationNo:1};
 const shape=o=>new Proxy(o,{get:(target,key)=>key in target?target[key]:[]});
 const rows=(m,live=false)=>m.sets.flatMap(set=>set.rallies.flatMap((r,j)=>r.actions.map((a,i)=>({...a,set:set.number,rallyIndex:j,actionIndex:i,winner:r.winner}))));
 const deps={
  scoutAnalysis:m=>shape({rallies:m.sets.flatMap(s=>s.rallies),actions:rows(m),rotations:[],opponentRotations:[],sidePct:0,breakPct:0,sideWon:0,sideTotal:0,breakWon:0,breakTotal:0}),
  scoutSetsScore:m=>({us:1,opponent:0}),scoutSequenceSummary:()=>shape({rows:[],k1:[],k2:[],k1Won:0,k2Won:0}),
  scoutArr:v=>Array.isArray(v)?v:[],scoutDistributionRows:()=>[],
  EQUIPOS:{infantil:{nombre:'Volley Coach'}},equipoActivo:'infantil',
  scoutActionRows:rows,scoutPlayerKey:a=>String(a.playerId??''),
  scoutV61010FullStats:(m,team)=>({rows:rows(m).filter(a=>a.team===team),players:rows(m).some(a=>a.team===team)?[{key:team==='ours'?'5':'9',label:team==='ours'?'Ana':'Rival',total:rows(m).filter(a=>a.team===team).length}]:[]}),
  scoutSkillMetric:()=>({total:0,error:0,perfect:0,positive:0,posPct:0,perfPct:0,veryNegative:0}),
  esc
 };
 return {match,deps};
}

test('all 26 migrated report helpers retain their exact original JavaScript bodies',()=>{
 assert.equal(helperNames.length,26);
 const originals=helperNames.map(name=>helper(name));
 assert.equal(sha(originals.join('\n\n')),'b9bbe70736dfb7a1a689744a44b0f2f4f343f5a7f75ac9f87e5ebeebbc621cfc');
 assert.equal(originals.reduce((n,s)=>n+s.length,0),14786);
 for(const name of helperNames)assert.doesNotMatch(core,new RegExp('\\bfunction '+name+'\\('),'helper no longer inflates the Scouting runtime: '+name);
 assert.ok(pdf.includes('function v2079CreateReportHelpers(ctx)'));
});

test('Scouting passes only native read-only dependencies when requesting PDF reports',()=>{
 for(const name of ['v757OfficialHTML','v757ProPages']){
  const source=core.match(new RegExp('function '+name+'\\(m\\)\\{return window\\.VC_SCOUT_REPORT_LAYOUT_2078\\.[a-zA-Z]+\\(m,\\{([^}]+)\\}\\)\\}'));
  assert.ok(source,'native report adapter '+name);
  assert.deepEqual(source[1].split(','),nativeNames,'only current native data accessors and helpers');
 }
 for(const name of ['window.scoutAwardPoint=','window.scoutUndoRally=','window.scoutSaveLineup=','window.scoutAddManualAction='])assert.ok(core.includes(name),name);
 assert.ok(core.includes('const V902_JOURNAL_DB='));
 assert.ok(core.includes('window.VC_SCOUT_VIDEO_BRIDGE='));
});

test('real report helper calculations and final HTML equal original with and without a closed rally',()=>{
 const before=pdf.slice(0,pdf.indexOf('/* VC2078_SCOUT_REPORT_LAYOUT_END */'));
 const runtime={window:{}};vm.runInNewContext(before,runtime,{filename:'011-v5115-pdf-rosters-script.js'});
 for(const withRallies of [false,true]){
  const {match,deps}=fixture(withRallies),snapshot=JSON.stringify(match);
  for(const [name,exported] of [['v757OfficialHTML','officialHTML'],['v757ProPages','proPages']]){
   const source=`(()=>{\n${helperNames.map(helper).join('\n')}\nreturn ${originalReport(name)};})()`;
   const original=vm.runInNewContext(source,deps);
   const expected=original(match),actual=runtime.window.VC_SCOUT_REPORT_LAYOUT_2078[exported](match,deps);
   assert.equal(JSON.stringify(actual),JSON.stringify(expected),name+' preserved HTML for '+(withRallies?'closed rally':'empty match'));
   assert.equal(JSON.stringify(match),snapshot,'report generation never edits saved scouting actions');
  }
 }
});

test('V20.7.9 refreshes both cached scripts without adding a network request',async()=>{
 assert.match(html,/011-v5115-pdf-rosters-script\.js\?v=16\.0\.2\.1&amp;rev=20\.7\.\d+/);
 assert.match(html,/021-core-scouting-v150-monolithic\.js\?v=20\.7\.0&amp;rev=20\.7\.\d+/);
 assert.ok(html.indexOf('id="v5115-pdf-rosters-script"')<html.indexOf('id="core-scouting-v150-monolithic"'));
 assert.match(sw,/report-helpers-20\.7\.9/);
 const {auditRuntimeAssets}=await import('./scripts/audit-runtime-assets.mjs');
 const audit=auditRuntimeAssets(__dirname);
 assert.deepEqual(audit.errors,[]);
 assert.ok(audit.retainedCandidates>=37);
});

test('migration reduces the main monolith and keeps the version and historical writers consistent',()=>{
 assert.ok(Buffer.byteLength(core)<=690443,'subsequent view migrations must not regrow the monolith');
 assert.ok(Buffer.byteLength(pdf)>49516);
 const manifest=JSON.parse(read('scripts/retained-legacy-assets.json'));
 assert.equal(require('./package.json').version,manifest.updatedIn);
 assert.equal(manifest.policy,'KEEP_UNTIL_MIGRATION_FINISHED');
 assert.ok(manifest.groups.flatMap(g=>g.files).length>=37);
 assert.ok(require('./package.json').scripts['test:foundation'].includes('vc2079-report-helper-migration.test.cjs'));
});
