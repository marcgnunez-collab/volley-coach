'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const arr=v=>Array.isArray(v)?v:[];
const fixture=()=>({id:21,status:'live',currentSet:2,servingTeam:'ours',rotationNo:4,
 sets:[{number:1,scoreUs:25,scoreOpponent:23,rallies:[
  {id:'r0',winner:'ours',scoreBefore:{us:0,opponent:0},scoreAfter:{us:1,opponent:0},rotationBefore:2,
   actions:[{id:'a0',code:'*12S+',videoExactTime:4.6}]},
  {id:'r1',winner:'opponent',actions:[{id:'a1',skill:'A'}]}]},
  {number:2,scoreUs:2,scoreOpponent:1,rallies:[
   {id:'r2',winner:'ours',rotationBefore:4,actions:[{id:'a2',code:'*03A#',liveVideoTime:9.1}]}]}],
 liveRally:{id:'live',actions:[{id:'a3',code:'*04R+',videoExactTime:12}]}});
const nativeRefs=m=>arr(m?.sets).flatMap((set,si)=>arr(set?.rallies).map((rally,ri)=>({set,rally,si,ri})));
const nativeReview=m=>arr(m?.sets).flatMap((set,si)=>arr(set?.rallies).map((rally,ri)=>({
 key:`${si}:${ri}:${String(rally?.id??'').trim()}`,setIndex:si,rallyIndex:ri,
 setNo:set?.number??si+1,rallyNo:ri+1,id:rally?.id,rally,
 actions:arr(rally?.actions),winner:rally?.winner||null,
 rotation:rally?.rotationBefore??null,before:rally?.scoreBefore,after:rally?.scoreAfter
})));
const sameRows=(actual,expected)=>actual.length===expected.length&&actual.every((row,i)=>{
 const old=expected[i],keys=Object.keys(old);
 return keys.length===Object.keys(row).length&&keys.every(key=>Object.is(row[key],old[key]));
});

test('V20.6.2 installs a frozen read-only timeline without shadow scores or writers',async()=>{
 const mod=await compiled(),host={},bridge=mod.installSharedRallyTimeline(host);
 assert.equal(bridge.VERSION,'20.6.2');assert.equal(bridge.readOnly,true);
 assert.equal(bridge.canonicalReferences,true);assert.ok(Object.isFrozen(bridge));
 assert.equal(host.VC_RALLY_TIMELINE_2062,bridge);
 assert.equal(mod.installSharedRallyTimeline(host),bridge);
 for(const name of ['entries','last','rallies','review','recent'])assert.equal(typeof bridge[name],'function');
 assert.notEqual(mod.installSharedRallyTimeline({}),bridge,'Different windows must not share instances');
});

test('chronological set/rally traversal preserves exact original object identities',async()=>{
 const mod=await compiled(),match=fixture(),typed=mod.listClosedRallyRefs(match),native=nativeRefs(match);
 assert.equal(typed.length,native.length);
 for(let i=0;i<typed.length;i++){
  assert.equal(typed[i].set,native[i].set);assert.equal(typed[i].rally,native[i].rally);
  assert.equal(typed[i].setIndex,native[i].si);assert.equal(typed[i].rallyIndex,native[i].ri);
 }
 assert.deepEqual([...mod.listClosedRallies(match)],native.map(r=>r.rally));
 assert.equal(mod.listClosedRallies(match)[0],match.sets[0].rallies[0]);
 assert.equal(Object.isFrozen(match),false);assert.equal(Object.isFrozen(match.sets),false);
 assert.equal(Object.isFrozen(match.liveRally.actions),false);
});

test('newest rally scans past empty sets and keeps last source reference',async()=>{
 const mod=await compiled(),match=fixture(),rally=match.sets[1].rallies[0];
 match.sets.push({number:3,rallies:[]},{number:4,rallies:[]});
 assert.equal(mod.lastClosedRallyRef(match).rally,rally);
 assert.equal(mod.lastClosedRallyRef(match).set,match.sets[1]);
 assert.equal(mod.lastClosedRallyRef({sets:[]}),null);
 assert.equal(mod.lastClosedRallyRef(null),null);
 match.sets[1].rallies.push({id:'r3',winner:'opponent'});
 assert.equal(mod.lastClosedRallyRef(match).rally,match.sets[1].rallies[1]);
});

test('empty, missing and sparse sets follow native flatMap semantics',async()=>{
 const mod=await compiled();
 for(const match of [null,{}, {sets:[]},{sets:[{rallies:[]}]},
  {sets:[{number:1,rallies:[null,undefined,0,'string']}]},
  {sets:[{number:2,rallies:[{id:0},null]},{number:3,rallies:[]}]}
 ]){
  const expected=nativeRefs(match),actual=mod.listClosedRallyRefs(match);
  assert.equal(actual.length,expected.length);
  actual.forEach((row,i)=>{assert.equal(row.set,expected[i].set);assert.equal(row.rally,expected[i].rally)});
  const last=mod.lastClosedRallyRef(match);
  assert.equal(last?.rally??null,expected.at(-1)?.rally??null);
 }
 const sparse=[{number:1,rallies:[{id:'r0'},,{id:'r2'}]},,
  {number:3,rallies:[,{id:'r3'}]}];
 const expected=nativeRefs({sets:sparse}),actual=mod.listClosedRallyRefs({sets:sparse});
 assert.equal(actual.length,expected.length);
 assert.deepEqual(actual.map(r=>r.rallyIndex),[0,2,1]);
 assert.equal(mod.lastClosedRallyRef({sets:sparse}).rally,expected.at(-1).rally);
});

test('Rally Review rows preserve exact historical fields and video time identities',async()=>{
 const mod=await compiled(),match=fixture(),native=nativeReview(match),typed=mod.projectRallyReviewRows(match);
 assert.ok(sameRows(typed,native));
 assert.equal(typed[0].actions,match.sets[0].rallies[0].actions);
 assert.equal(typed[0].rally,match.sets[0].rallies[0]);
 assert.equal(typed[0].actions[0].videoExactTime,4.6);
 assert.equal(typed[2].actions[0].liveVideoTime,9.1);
 assert.equal(mod.projectRallyReviewRows({sets:[{rallies:[{id:null,actions:[]},{winner:null}]}]}).length,2);
});

test('five newest history items preserve ordering, labels and unknown scores',async()=>{
 const mod=await compiled(),match=fixture();
 const api=workspaceApi({}),native=api.summarizeMatch(match,'Local').recent;
 const typed=mod.projectRecentRallies(match,5);
 assert.equal(JSON.stringify(typed),JSON.stringify(native));
 assert.equal(typed[0].winner,'Punto propio');assert.equal(typed[0].code,'*03A#');
 assert.equal(typed[1].winner,'Punto rival');assert.equal(typed[2].set,1);
 assert.equal(mod.projectRecentRallies(match,0).length,0);
 assert.equal(mod.projectRecentRallies(match,1).length,1);
});

const firstLine=(file,prefix)=>{
 const line=read(file).split('\n').find(row=>row.startsWith(prefix));
 assert.ok(line,`${file}: ${prefix}`);return line;
};
function runStandalone(source,name,context,args=[]){
 const sandbox=vm.createContext(context);vm.runInContext(source,sandbox,{timeout:1200});
 sandbox.__args=args;return vm.runInContext(`${name}(...__args)`,sandbox,{timeout:1200});
}
test('effective Scouting analysis uses typed rows when references match, otherwise native',async()=>{
 const mod=await compiled(),match=fixture(),src=firstLine('021-core-scouting-v150-monolithic.js','function scoutAllRallies(');
 const old=runStandalone(src,'scoutAllRallies',{window:{},scoutArr:arr},[match]);
 let used=0;const base=mod.installSharedRallyTimeline({});
 const bridge={...base,rallies:m=>{used++;return base.rallies(m)}};
 const typed=runStandalone(src,'scoutAllRallies',{window:{VC_RALLY_TIMELINE_2062:bridge},scoutArr:arr},[match]);
 assert.equal(used,1);assert.deepEqual([...typed], [...old]);
 assert.equal(typed[0],match.sets[0].rallies[0]);
 for(const broken of [{...base,rallies:()=>[{}]},
  {...base,rallies:()=>{throw Error('read failed')}},{VERSION:'old',rallies:()=>[]}]){
  const fallback=runStandalone(src,'scoutAllRallies',{window:{VC_RALLY_TIMELINE_2062:broken},scoutArr:arr},[match]);
  assert.deepEqual([...fallback],[...old]);
 }
});

test('effective Match Mode traversal shares set/rally identities with safe fallback',async()=>{
 const mod=await compiled(),match=fixture(),src=firstLine('040-v800-match-mode-module.js','function allRallies(');
 const base=mod.installSharedRallyTimeline({});
 const old=runStandalone(src,'allRallies',{window:{},arr},[match]);
 const typed=runStandalone(src,'allRallies',{window:{VC_RALLY_TIMELINE_2062:base},arr},[match]);
 assert.equal(typed.length,old.length);
 typed.forEach((row,i)=>{assert.equal(row.s,old[i].s);assert.equal(row.r,old[i].r)});
 const bad={...base,entries:()=>[{set:{},rally:{}}]};
 const fallback=runStandalone(src,'allRallies',{window:{VC_RALLY_TIMELINE_2062:bad},arr},[match]);
 fallback.forEach((row,i)=>{assert.equal(row.s,old[i].s);assert.equal(row.r,old[i].r)});
});

const videoSource=read('028-v740-live-scout-video-module.js');
const lastSource=videoSource.slice(videoSource.indexOf('function lastClosedRally(m=active()){'),
 videoSource.indexOf('function lastAction(m=active()){'));
test('effective Video last rally keeps original native object shape and identity',async()=>{
 const mod=await compiled(),match=fixture(),bridge=mod.installSharedRallyTimeline({});
 const native=runStandalone(lastSource,'lastClosedRally',{window:{},arr,active:()=>match},[match]);
 const typed=runStandalone(lastSource,'lastClosedRally',{window:{VC_RALLY_TIMELINE_2062:bridge},arr,active:()=>match},[match]);
 assert.equal(typed.r,native.r);assert.equal(typed.set,native.set);
 assert.equal(match.liveRally.actions[0].videoExactTime,12);
 for(const bad of [{...bridge,last:()=>({rally:{id:'wrong'},set:{}})},
  {...bridge,last:()=>{throw Error('failed')}}]){
  const fallback=runStandalone(lastSource,'lastClosedRally',
   {window:{VC_RALLY_TIMELINE_2062:bad},arr,active:()=>match},[match]);
  assert.equal(fallback.r,native.r);assert.equal(fallback.set,native.set);
 }
});

function reviewApi(windowObj){const module={exports:{}};
 vm.runInNewContext(read('217-vc2025-rally-review-pro.js'),{window:windowObj,module},{timeout:1200});
 return module.exports;}
function workspaceApi(windowObj){const module={exports:{}};
 vm.runInNewContext(read('212-vc2020-match-workspace.js'),{window:windowObj,module},{timeout:1200});
 return module.exports;}

test('effective Rally Review collect uses typed rows only on complete field parity',async()=>{
 const mod=await compiled(),match=fixture(),base=mod.installSharedRallyTimeline({});
 const native=reviewApi({}).collect(match);
 let used=0;const good={...base,review:m=>{used++;return base.review(m)}};
 const typed=reviewApi({VC_RALLY_TIMELINE_2062:good}).collect(match);
 assert.equal(used,1);assert.ok(sameRows(typed,native));
 assert.equal(typed[0].rally,native[0].rally);
 for(const bad of [{...base,review:()=>[{key:'corrupt'}]},
  {...base,review:()=>{throw Error('fail')}},{...base,review:()=>[]}]){
  const out=reviewApi({VC_RALLY_TIMELINE_2062:bad}).collect(match);
  assert.ok(sameRows(out,native));
 }
});

test('effective Match Workspace summary uses only equivalent typed newest-first rows',async()=>{
 const mod=await compiled(),match=fixture(),base=mod.installSharedRallyTimeline({});
 const native=workspaceApi({}).summarizeMatch(match,'Local');
 let used=0;const good={...base,recent:(...args)=>{used++;return base.recent(...args)}};
 const typed=workspaceApi({VC_RALLY_TIMELINE_2062:good}).summarizeMatch(match,'Local');
 assert.equal(used,1);assert.equal(JSON.stringify(typed),JSON.stringify(native));
 const bad={...base,recent:()=>[{set:99,index:9,code:'WRONG'}]};
 const fallback=workspaceApi({VC_RALLY_TIMELINE_2062:bad}).summarizeMatch(match,'Local');
 assert.equal(JSON.stringify(fallback),JSON.stringify(native));
});

test('2,000 historical rallies remain ordered and unmodified across all projections',async()=>{
 const mod=await compiled(),match=fixture();
 match.sets=Array.from({length:5},(_,s)=>({number:s+1,rallies:Array.from({length:400},(_,r)=>
  ({id:`set${s}-rally${r}`,actions:[{id:`action-${s}-${r}`,videoExactTime:r+0.5}]}))}));
 const source=nativeRefs(match),entries=mod.listClosedRallyRefs(match);
 assert.equal(entries.length,2000);assert.equal(mod.listClosedRallies(match).length,2000);
 assert.equal(mod.projectRallyReviewRows(match).length,2000);
 assert.equal(mod.lastClosedRallyRef(match).rally,source.at(-1).rally);
 assert.equal(mod.projectRecentRallies(match).length,5);
 for(let i=0;i<source.length;i++)assert.equal(entries[i].rally,source[i].rally);
 assert.equal(entries[1299].rally.actions[0].videoExactTime,99.5);
});

test('V20.6.2 source, service worker, Vite bundle and changed assets are versioned',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.6');
 assert.ok(pkg.scripts['test:foundation'].includes('vc2062-rally-timeline-migration.test.cjs'));
 assert.ok(read('src/vc2055-entry.ts').includes('installSharedRallyTimeline(window)'));
 assert.ok(read('vc2055-domain-core.mjs').includes('VC_RALLY_TIMELINE_2062'));
 assert.ok(html.includes('V20.6.2 · HISTORIAL ÚNICO DE RALLIES'));
 for(const name of ['028-v740-live-scout-video-module.js','040-v800-match-mode-module.js',
  '212-vc2020-match-workspace.js','217-vc2025-rally-review-pro.js'])
  assert.ok(html.includes(name+'?v=20.7.0'),name);
 assert.ok(read('service-worker.js').includes('shared-rally-timeline-20.6.2'));
 const src=read('src/state/shared-rally-timeline.ts')+read('src/state/shared-rally-timeline-runtime.ts');
 for(const forbidden of ['scoutSave(','.rallies.push(','.rallies.pop(',
  'localStorage','indexedDB','supabase','fetch(','.scoreUs++','setItem(','getItem('])
  assert.equal(src.includes(forbidden),false,forbidden);
});
