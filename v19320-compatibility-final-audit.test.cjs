'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=require('../208-vc19320-compatibility-audit.js');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const sample=`[3DATAVOLLEYSCOUT]\r\nFILEFORMAT: 2.0\r\nGENERATOR-PRG: Data Volley\r\n[3MATCH]\r\n16/11/2026;;Liga;Final;;\r\n[3TEAMS]\r\n1;Equipo local;3;\r\n2;Rival;0;\r\n[3SET]\r\nTrue;;;;;\r\n[3SCOUT]\r\n*08S#~~~~;0;0\r\na11R+~~~~;0;0\r\n*09E+~~~~;0;0\r\n*07A#~~~~;0;0\r\n`;
test('DVW 2007 structured text can be inspected without claiming an import',()=>{
 const data=api.inspectDVW(sample);
 assert.deepEqual(data.teams,['Equipo local','Rival']);
 assert.equal(data.scoutLines,4);
 assert.equal(data.recognizedContacts,4);
 assert.equal(data.unclassified,0);
 assert.equal(data.importable,false);
 assert.equal(data.readOnly,true);
 assert.ok(data.sections.includes('3MATCH'));
});
test('DVW inspector rejects binary files, malformed formats and excessive length',()=>{
 assert.throws(()=>api.inspectDVW('[3MATCH]\n[3TEAMS]\na;A'),/3DATAVOLLEYSCOUT/);
 assert.throws(()=>api.inspectDVW(sample+'\0'),/binario/);
 assert.throws(()=>api.inspectDVW('a'.repeat(8*1024*1024+1)),/demasiado grande/);
});
test('malformed and unrecognized DVW lines are counted, never converted into false contacts',()=>{
 const result=api.inspectDVW(sample+'no_entendemos_la_fila\n');
 assert.equal(result.recognizedContacts,4);
 assert.equal(result.unclassified,1);
 assert.ok(result.warnings.length);
});
test('inspectExchange accepts VCX and JSON copies only as previews',()=>{
 const match={id:1,opponent:'Club B',sets:[{number:1,rallies:[]}]};
 const a=api.inspectExchange({type:'volley-coach-exchange',schema:'vcx/1.0',matches:[match]});
 assert.equal(a.format,'vcx');assert.equal(a.matchCount,1);assert.equal(a.matches[0].sets,1);
 assert.equal(a.readOnly,true);
 assert.equal(api.inspectExchange({matches:[match]}).format,'json');
 assert.throws(()=>api.inspectExchange({table:[]}),/no es un intercambio/);
});
test('CSV preview is explicitly not a recoverable scouting backup',()=>{
 const result=api.inspectCSV('match_id,set,rally,skill,evaluation\r\n1,1,1,A,#\r\n');
 assert.equal(result.structured,true);assert.equal(result.estimatedRows,1);assert.equal(result.importable,false);
});
test('auditMatch counts only explicit data, does not fabricate points or mutate input',()=>{
 const match={id:7,opponent:'Rival',sets:[{number:1,rallies:[{
  id:'r1',winner:null,servingBefore:'ours',actions:[
   {id:'a1',team:'ours',skill:'E',evaluation:'+',setTarget:'Z4',playerLabel:'#2'},
   {id:'a1',team:'ours',skill:'A',evaluation:'',startZone:'Z12',playerLabel:'#7'}
  ]}]}]};
 const before=JSON.stringify(match),out=api.auditMatch(match);
 assert.equal(JSON.stringify(match),before);
 assert.equal(out.sets,1);assert.equal(out.rallies,1);assert.equal(out.contacts,2);
 assert.equal(out.closed,0);assert.equal(out.unknownWinner,1);
 assert.equal(out.duplicateAction,1);assert.equal(out.invalidZone,1);
 assert.equal(out.coverage.closedRallies,0);
 assert.equal(out.coverage.evaluatedActions,50);
});
test('build references exactly the new module, CSS and versioned service worker',()=>{
 const html=read('index.html'),sw=read('service-worker.js');
 for(const x of ['208-vc19320-compatibility-audit.js?v=20.5.0.3','vc2071-global-reliability-unified.css?v=20.7.1'])assert.equal(html.split(x).length-1,1);
 assert.match(html,/service-worker\.js\?v=(?:19\.3\.20|20\.1\.0|20\.1\.1|20\.1\.2)/);
 assert.ok(sw.includes('compat-audit-19.3.20'));
 assert.ok(sw.includes('./208-vc19320-compatibility-audit.js'));
 assert.ok(sw.includes('./vc2071-global-reliability-unified.css'));
});
test('legacy importer preserves safe import and exposes a separate DVW inspection only',()=>{
 const js=read('089-v152-smart-rally-reports-exchange.js');
 assert.match(js,/VC_COMPAT_AUDIT_19320\?\.mount/);
 assert.match(js,/El DVW es un formato estructurado/);
 assert.match(js,/Lista de códigos TXT \(no DVW\)/);
 assert.match(js,/async function importMatchesSafely/);
 assert.match(js,/requireSafeBackup/);
 assert.doesNotMatch(js,/Los archivos DVW binarios no son importables/);
});
test('CSS references no longer point to never-committed historical files',()=>{
 const html=read('index.html');
 const styles=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="\.\/([^"?]+)(?:\?[^" ]*)?"/g)].map(m=>m[1]);
 const missing=styles.filter(x=>!fs.existsSync(path.join(root,x))).sort();
 assert.equal(missing.length,0);
 assert.deepEqual([...api.assetIssues].sort(),missing);
});
