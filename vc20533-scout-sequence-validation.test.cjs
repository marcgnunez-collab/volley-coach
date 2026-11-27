'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

test('read-only sequence accepts DV-style team markers and existing native prefixes',async()=>{
 const {inspectScoutingSequence}=await compiled();
 const input='*12S+ .04R+ *10A#';const result=inspectScoutingSequence(input);
 assert.equal(result.status,'ready');
 assert.deepStrictEqual(result.counts,{contacts:3,warnings:0,errors:0});
 assert.deepStrictEqual(result.contacts.map(x=>[x.team,x.number,x.skill,x.rating,x.nativePreview]),[
  ['ours','12','S','+','12S+'],['opponent','04','R','+','R04R+'],['ours','10','A','#','10A#']]);
 assert.deepStrictEqual(inspectScoutingSequence('12S+ R04R+ 10A#').contacts.map(x=>x.nativePreview),
  ['12S+','R04R+','10A#']);
 assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.contacts));
 assert.ok(Object.isFrozen(result.contacts[0]));
});

test('likely terminal ratings, double contacts and same-side reception are only advisory',async()=>{
 const {inspectScoutingSequence}=await compiled();
 const ace=inspectScoutingSequence('*12S# .04R+ *10A#');
 assert.equal(ace.status,'review');assert.equal(ace.counts.warnings,1);
 assert.match(ace.issues[0].reason,/parece cerrar el punto/);
 const double=inspectScoutingSequence('*07R+ *07E+');
 assert.equal(double.status,'review');assert.equal(double.counts.warnings,1);
 assert.match(double.issues[0].reason,/posible doble contacto/);
 const side=inspectScoutingSequence('*12S+ *03R+');
 assert.equal(side.status,'review');assert.match(side.issues[0].reason,/mismo equipo/);
 assert.ok(ace.advice.includes('orientativos'));
});

test('empty, incomplete, malformed, unknown suffix and large inputs remain bounded',async()=>{
 const {inspectScoutingSequence,MAX_SEQUENCE_CONTACTS,MAX_SEQUENCE_CHARACTERS}=await compiled();
 assert.equal(inspectScoutingSequence('').status,'empty');
 assert.equal(inspectScoutingSequence('  ').counts.contacts,0);
 const incomplete=inspectScoutingSequence('*12S .04R+');
 assert.equal(incomplete.status,'review');assert.equal(incomplete.counts.warnings,1);
 const unknown=inspectScoutingSequence('*12A#TRAMPA');
 assert.equal(unknown.status,'invalid');
 const suffix=inspectScoutingSequence('*12A#.4B>5D*DC~T::31');
 assert.equal(suffix.status,'ready');
 assert.equal(inspectScoutingSequence('XCODE').status,'invalid');
 assert.equal(inspectScoutingSequence('*12S# '.repeat(MAX_SEQUENCE_CONTACTS+1)).status,'invalid');
 assert.equal(inspectScoutingSequence('X'.repeat(MAX_SEQUENCE_CHARACTERS+1)).status,'invalid');
});

test('the actual Scouting Speed Pro panel checks a sequence without modifying the scorer',async()=>{
 const typed=await compiled(),win={};
 typed.installScoutingDraftBridge(win);
 const value='*12S# .04R+ *10A#',field={value},status={textContent:'',dataset:{}};
 const document={readyState:'loading',addEventListener(){},getElementById:id=>({
  'vc2021-sequence-input':field,'vc2021-sequence-status':status}[id]||null)};
 const window={document,VC_SCOUT_DRAFT_20532:win.VC_SCOUT_DRAFT_20532};
 vm.runInNewContext(read('213-vc2021-scouting-speed-pro.js'),{window},{timeout:2000});
 const classic=window.VC_SCOUT_SPEED_2021;
 assert.equal(classic.checkSequence(),true);
 assert.equal(field.value,value);
 assert.equal(status.dataset.state,'review');
 assert.match(status.textContent,/3 contactos · 1 avisos · 0 errores/);
 assert.doesNotMatch(status.textContent,/12S#|04R\+|10A#/,'UI output does not expose tokens');
 assert.ok(classic.markup().includes('<details class="vc2021-sequence"'));
 window.VC_SCOUT_DRAFT_20532=null;
 assert.equal(classic.checkSequence(),false);
 assert.equal(status.dataset.state,'unavailable');
 assert.equal(field.value,value);
});

test('V20.5.33 publishes an optional sequence check while preserving every writer',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,require('./scripts/retained-legacy-assets.json').updatedIn);
 assert.ok(pkg.scripts['test:foundation'].includes('vc20533-scout-sequence-validation.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(html.includes('vc2021-scouting-speed-pro.css?v=20.5.33'));
 assert.ok(sw.includes('scouting-sequence-check-20.5.33'));
 assert.ok(read('src/vc2055-entry.ts').includes('inspectScoutingSequence'));
 const source=read('src/state/scouting-sequence-check.ts');
 for(const forbidden of ['indexedDB','supabase','scoutSave(', 'scoutPushAction(',
  'v121AwardPoint=', 'window.MatchState=', 'localStorage','setItem(','fetch('])
  assert.equal(source.includes(forbidden),false,forbidden);
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
});
