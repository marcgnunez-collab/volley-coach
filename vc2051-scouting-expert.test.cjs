'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('./231-vc2051-scouting-expert.js');
const code=fs.readFileSync(path.join(__dirname,'231-vc2051-scouting-expert.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'service-worker.js'),'utf8');
const match={id:42,status:'live'};
const parser=(input)=>{
 if(input==='7A#')return {action:{team:'ours',playerId:7,playerNumberSnapshot:'7',skill:'A',evaluation:'#'}};
 if(input==='R12S=')return {action:{team:'opponent',playerNumberSnapshot:'12',skill:'S',evaluation:'='}};
 if(input==='3R')return {action:{team:'ours',playerId:3,skill:'R',evaluation:'!'}};
 return {error:'Dorsal no encontrado.'};
};
test('normalizes lowercase input and relies on native parser for acceptance',()=>{
 const r=api.inspect(' 7a# ',match,parser);
 assert.equal(r.state,'ok');assert.equal(r.code,'7A#');assert.match(r.summary,/Nuestro/);
 assert.match(r.message,/Pulsa Enter/);
});
test('opponent prefix remains distinct from reception skill',()=>{
 const r=api.inspect('r12s=',match,parser);
 assert.equal(r.state,'ok');assert.match(r.summary,/Rival/);
});
test('partial, ungraded and invalid drafts never claim registration',()=>{
 assert.equal(api.inspect('7',match,parser).state,'draft');
 assert.equal(api.inspect('3R',match,parser).state,'caution');
 assert.equal(api.inspect('9A#',match,parser).state,'error');
 assert.equal(api.inspect('7A#',null,parser).state,'warning');
 assert.equal(api.inspect('7A#',{status:'finished'},parser).state,'warning');
 assert.equal(api.inspect('7A#',match,null).state,'warning');
});
test('native parser cannot mutate caller input via the preview',()=>{
 const before=JSON.stringify(match);
 api.inspect('7A#',match,parser);
 assert.equal(JSON.stringify(match),before);
});
test('module loads after existing registrar and does not replace it',()=>{
 assert.ok(html.includes('231-vc2051-scouting-expert.js?v=20.5.1'));
 assert.ok(sw.includes("'./231-vc2051-scouting-expert.js'"));
 for(const forbidden of ['scoutPushAction(', 'v857RegisterRaw(', 'scoutSave(', 'awardPoint(', 'cloudClient.', 'localStorage.', 'indexedDB.'])
  assert.ok(!code.includes(forbidden),forbidden);
});
