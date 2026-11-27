'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const arr=value=>Array.isArray(value)?value:[];
const nativeRefs=m=>arr(m?.sets).flatMap((set,si)=>arr(set?.rallies).map((rally,ri)=>({set,rally,si,ri})));
const fixture=()=>({id:'match',sets:[
 {number:1,rallies:[{id:'r1',winner:'ours',actions:[{id:'a1',videoExactTime:1.25}]}]},
 {number:2,rallies:[{id:'r2',winner:'opponent',actions:[{id:'a2'}]},
  {id:'r3',winner:'ours',actions:[]}]},
 {number:3,rallies:[]}],liveRally:{id:'live',actions:[{id:'live-action'}]}});

function sourceFunction(file,prefix,endMarker){
 const source=read(file),start=source.indexOf(prefix);
 assert.ok(start>=0,`${file}: missing ${prefix}`);
 if(endMarker){const end=source.indexOf(endMarker,start+prefix.length);assert.ok(end>start);return source.slice(start,end);}
 return source.split('\n').find(row=>row.startsWith(prefix));
}
const scoutSource=sourceFunction('021-core-scouting-v150-monolithic.js','function scoutAllRallies(');
const matchSource=sourceFunction('040-v800-match-mode-module.js','function allRallies(');
const videoSource=sourceFunction('028-v740-live-scout-video-module.js','function lastClosedRally(m=active()){','function lastAction(m=active()){');
function call(source,name,window,match){
 const sandbox=vm.createContext({window,arr,scoutArr:arr,active:()=>match});
 vm.runInContext(source,sandbox,{timeout:2500});sandbox.match=match;
 return vm.runInContext(`${name}(match)`,sandbox,{timeout:2500});
}
function review(window){const module={exports:{}};
 vm.runInNewContext(read('217-vc2025-rally-review-pro.js'),{window,module},{timeout:2500});
 return module.exports;
}
const bridge=async()=> (await compiled()).installSharedRallyTimeline({});
function countedMatch(){
 const match=fixture();let nativeScans=0;
 Object.defineProperty(match.sets,'flatMap',{value:function(...args){nativeScans++;return Array.prototype.flatMap.apply(this,args)},configurable:true});
 return {match,scans:()=>nativeScans};
}

test('V20.6.5 Scouting consumes the checked shared timeline without a second flatMap',async()=>{
 const base=await bridge(),{match,scans}=countedMatch(),expected=nativeRefs(match).map(r=>r.rally);
 const actual=call(scoutSource,'scoutAllRallies',{VC_RALLY_TIMELINE_2062:base},match);
 assert.equal(scans(),1,'test fixture should perform exactly one native reference scan');
 assert.deepEqual([...actual],expected);assert.equal(actual[0],expected[0]);
 assert.equal(actual.at(-1),expected.at(-1));
});

test('V20.6.5 Scouting rejects reordered, missing and invented typed rows',async()=>{
 const base=await bridge();
 for(const bad of [
  {...base,rallies:match=>base.rallies(match).slice().reverse()},
  {...base,rallies:match=>base.rallies(match).slice(0,-1)},
  {...base,rallies:match=>base.rallies(match).concat({id:'invented'})},
  {...base,rallies:()=>{throw Error('Unavailable')}}
 ]){
  const {match,scans}=countedMatch(),actual=call(scoutSource,'scoutAllRallies',{VC_RALLY_TIMELINE_2062:bad},match);
  assert.equal(scans(),1);assert.deepEqual([...actual],nativeRefs(match).map(x=>x.rally));
 }
});

test('V20.6.5 Match Mode checks original set and rally identity in a single traversal',async()=>{
 const base=await bridge(),{match,scans}=countedMatch();
 const expected=nativeRefs(match);
 const actual=call(matchSource,'allRallies',{VC_RALLY_TIMELINE_2062:base},match);
 assert.equal(scans(),1);assert.equal(actual.length,expected.length);
 actual.forEach((r,i)=>{assert.equal(r.s,expected[i].set);assert.equal(r.r,expected[i].rally)});
 for(const bad of [
  {...base,entries:match=>base.entries(match).slice().reverse()},
  {...base,entries:match=>base.entries(match).slice(1)},
  {...base,entries:()=>[{set:{},rally:{}}]}
 ]){
  const probe=countedMatch(),fallback=call(matchSource,'allRallies',{VC_RALLY_TIMELINE_2062:bad},probe.match);
  assert.equal(probe.scans(),1);assert.equal(fallback.length,expected.length);
  fallback.forEach((r,i)=>{assert.equal(r.s,probe.match.sets[expected[i].si]);assert.equal(r.r,probe.match.sets[expected[i].si].rallies[expected[i].ri])});
 }
});

test('V20.6.5 Rally Review checks all 12 original fields without constructing native duplicates',async()=>{
 const base=await bridge(),{match,scans}=countedMatch();
 const typed=review({VC_RALLY_TIMELINE_2062:base}).collect(match);
 assert.equal(scans(),0);assert.equal(typed.length,3);
 assert.equal(typed[0].rally,match.sets[0].rallies[0]);
 assert.equal(typed[0].actions,match.sets[0].rallies[0].actions);
 for(const override of [row=>({...row,after:{us:99}}),row=>({...row,setNo:42}),
  row=>({...row,key:'wrong'}),row=>({...row,unexpected:true})]){
  const probe=countedMatch(),corrupt={...base,review:m=>{
   const values=base.review(m).slice();values[0]=override(values[0]);return values;
  }};
  const recovered=review({VC_RALLY_TIMELINE_2062:corrupt}).collect(probe.match);
  assert.equal(probe.scans(),1);assert.equal(recovered[0].setNo,1);
  assert.equal(recovered[0].rally,probe.match.sets[0].rallies[0]);
  assert.equal(recovered[0].after,undefined);
 }
});

test('V20.6.5 Video checks last closed rally without flattening complete history',async()=>{
 const base=await bridge(),probe=countedMatch();
 const actual=call(videoSource,'lastClosedRally',{VC_RALLY_TIMELINE_2062:base},probe.match);
 assert.equal(probe.scans(),0);assert.equal(actual.r,probe.match.sets[1].rallies[1]);
 assert.equal(actual.set,probe.match.sets[1]);
 const broken={...base,last:()=>({set:{},rally:{id:'invented'}})};
 const fallback=call(videoSource,'lastClosedRally',{VC_RALLY_TIMELINE_2062:broken},probe.match);
 assert.equal(probe.scans(),1);assert.equal(fallback.r,actual.r);assert.equal(fallback.set,actual.set);
});

test('V20.6.5 sparse arrays, missing fields and unknown winners preserve native results',async()=>{
 const base=await bridge(),match={sets:[{rallies:[{winner:null},,{id:2,actions:null}]},,
  {number:3,rallies:[null,{id:0,winner:'unknown'}]},{rallies:[]}]};
 const expected=nativeRefs(match),scout=call(scoutSource,'scoutAllRallies',{VC_RALLY_TIMELINE_2062:base},match);
 assert.deepEqual([...scout],expected.map(r=>r.rally));
 const rows=call(matchSource,'allRallies',{VC_RALLY_TIMELINE_2062:base},match);
 assert.equal(rows.length,expected.length);
 rows.forEach((r,i)=>{assert.equal(r.s,expected[i].set);assert.equal(r.r,expected[i].rally)});
 const typed=review({VC_RALLY_TIMELINE_2062:base}).collect(match),native=review({}).collect(match);
 assert.equal(typed.length,native.length);
 for(let i=0;i<native.length;i++)for(const key of Object.keys(native[i])){
  if(key==='actions'&&!Array.isArray(native[i].rally?.actions)){
   assert.deepEqual([...typed[i].actions],[...native[i].actions]);continue;
  }
  assert.ok(Object.is(typed[i][key],native[i][key]),`${i}: ${key}`);
 }
 const last=call(videoSource,'lastClosedRally',{VC_RALLY_TIMELINE_2062:base},match);
 assert.equal(last.r,expected.at(-1).rally);assert.equal(last.set,expected.at(-1).set);
});

test('V20.6.5 4,000 closed rallies do not trigger redundant legacy flatMap',async()=>{
 const base=await bridge(),probe=countedMatch();
 probe.match.sets=Array.from({length:8},(_,si)=>({number:si+1,rallies:Array.from({length:500},(_,ri)=>({id:`${si}-${ri}`,actions:[{id:`a-${si}-${ri}`,videoExactTime:ri+0.25}]}))}));
 Object.defineProperty(probe.match.sets,'flatMap',{value:()=>{throw Error('Duplicate traversal in hot path')},configurable:true});
 const typed=call(scoutSource,'scoutAllRallies',{VC_RALLY_TIMELINE_2062:base},probe.match);
 const mode=call(matchSource,'allRallies',{VC_RALLY_TIMELINE_2062:base},probe.match);
 const reviewRows=review({VC_RALLY_TIMELINE_2062:base}).collect(probe.match);
 const video=call(videoSource,'lastClosedRally',{VC_RALLY_TIMELINE_2062:base},probe.match);
 assert.equal(typed.length,4000);assert.equal(mode.length,4000);assert.equal(reviewRows.length,4000);
 assert.equal(video.r,probe.match.sets[7].rallies[499]);
 assert.equal(reviewRows[1000].actions[0].videoExactTime,0.25);
});

test('V20.6.5 release has cache-busted assets and preserves the previous diagnostics panel',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,require('./scripts/retained-legacy-assets.json').updatedIn);
 assert.ok(pkg.scripts['test:foundation'].includes('vc2065-rally-fast-read.test.cjs'));
 assert.ok(sw.includes('rally-fast-read-20.6.5'));
 assert.ok(html.includes('V20.6.5 · LECTURA ÚNICA DE RALLIES'));
 assert.ok(html.includes('id="vc2064-check"'));
 for(const file of ['021-core-scouting-v150-monolithic.js','040-v800-match-mode-module.js',
  '028-v740-live-scout-video-module.js','217-vc2025-rally-review-pro.js',
  'vc2055-domain-core.mjs'])assert.ok(html.includes(`${file}?v=20.7.0`),file);
});
