'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

const fixture=()=>({id:'match-1',status:'active',sets:[{number:1,rallies:[
 {winner:'ours',actions:[{code:'7A#'}],scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0}},
 {winner:'opponent',actions:[{code:'R4A#'}]}
 ]}]});
const immutableMatch=match=>{
 Object.freeze(match);
 for(const set of match.sets){Object.freeze(set);Object.freeze(set.rallies);for(const rally of set.rallies){Object.freeze(rally);Object.freeze(rally.actions);}}
 Object.freeze(match.sets);
 return match;
};

test('read-only ES module imports canonical match without mutating it',async()=>{
 const {getCanonicalMatch,readMatchProjection,READER_VERSION}=await import('./vc2053-match-reader.mjs');
 const match=immutableMatch(fixture());
 const win={MatchState:{getActive:()=>match},VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>{throw Error('Should use MatchState')}}};
 const original=JSON.stringify(match);
 assert.equal(READER_VERSION,'20.5.3');
 assert.strictEqual(getCanonicalMatch(win),match);
 const projection=readMatchProjection(win);
 assert.deepEqual({...projection.scoreTraces},{verified:1,inconsistent:0,unknown:1});
 assert.equal(projection.rallies,2);assert.equal(projection.actions,2);
 assert.equal(projection.matchId,'match-1');assert.equal(Object.isFrozen(projection),true);
 assert.equal(JSON.stringify(match),original);
 assert.strictEqual(getCanonicalMatch({MatchState:{getActive:()=>{throw Error('Legacy broken')}},VC_SCOUT_VIDEO_BRIDGE:{getActive:()=>match}}),match);
 assert.equal(readMatchProjection({}).state,'unavailable');
});

test('reader coalesces canonical and DOM events, unsubscribes, and stops cleanly',async()=>{
 const {createMatchReader}=await import('./vc2053-match-reader.mjs');
 let current=fixture();
 const subscribers=new Set();
 const win=new EventTarget();win.document=new EventTarget();
 win.MatchState={getActive:()=>current,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn)}};
 const reader=createMatchReader(win);
 let notifications=[];
 const stop=reader.subscribe(projection=>notifications.push(projection.rallies));
 assert.deepEqual(notifications,[2]);
 current={...current,sets:[{number:1,rallies:[...current.sets[0].rallies,{actions:[],winner:'ours'}]}]};
 for(const fn of subscribers)fn();
 win.document.dispatchEvent(new Event('vc:matchstatechange'));
 await Promise.resolve();
 assert.deepEqual(notifications,[2,3]);
 assert.equal(reader.diagnostics().updates,1);
 reader.refresh();
 assert.deepEqual(notifications,[2,3]);
 stop();
 current={...current,status:'finished'};
 win.document.dispatchEvent(new Event('vc:matchstatechange'));
 await Promise.resolve();
 assert.deepEqual(notifications,[2,3]);
 reader.dispose();reader.dispose();
 assert.equal(reader.diagnostics().disposed,true);
 assert.equal(subscribers.size,0);
});

test('ES6 viewer labels missing facts without inferring scoreboard validity',async()=>{
 const {formatProjection}=await import('./vc2053-modular-core.mjs');
 const {projectMatch}=await import('./vc2052-match-contract.mjs');
 assert.equal(formatProjection(projectMatch(null)).state,'waiting');
 const view=formatProjection(projectMatch(fixture()));
 assert.equal(view.state,'connected');assert.equal(view.rallies,'2');
 assert.equal(view.verified,'1');assert.equal(view.unknown,'1');
});

test('new assets, cache support and setup are bundled as true ES modules',()=>{
 assert.match(html,/<script[^>]*type="module"[^>]*src="\.\/vc2053-modular-core\.mjs\?v=20\.5\.3"/);
 assert.ok(html.includes('./vc2053-modular-core.css?v=20.5.3'));
 for(const name of ['vc2052-match-contract.mjs','vc2053-match-reader.mjs','vc2053-modular-core.mjs','vc2053-modular-core.css']){
  assert.ok(sw.includes("'./"+name+"'"),name);
  assert.ok(fs.existsSync(path.join(root,name)),name);
 }
 assert.match(sw,/const asset=u=>\/\\\.\(\?:m\?js\|css/);
 assert.ok(sw.includes("request.mode==='navigate'||/\\.(?:m?js|css)$/i.test(url.pathname)"));
 assert.ok(sw.includes('modular-core-20.5.3'));
 assert.ok(fs.readFileSync(path.join(root,'vc2053-modular-core.mjs'),'utf8').includes("import {createMatchReader"));
});

test('V20.5.3 contains no independent writer, storage or monkey-patch',()=>{
 const sources=['vc2053-match-reader.mjs','vc2053-modular-core.mjs'].map(name=>fs.readFileSync(path.join(root,name),'utf8'));
 for(const source of sources){
  for(const forbidden of ['localStorage','indexedDB','supabase','scoutSave(', 'scoutPushAction(', 'cloudClient.', 'v857AddCode=', 'v121AwardPoint=', 'setScore(', 'window.MatchState=']){
   assert.equal(source.includes(forbidden),false,forbidden);
  }
 }
});
