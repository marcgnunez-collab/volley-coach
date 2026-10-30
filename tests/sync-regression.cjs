'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('vc-sync-v1692.js','utf8');
const start=source.indexOf("const now=()=>");
const end=source.indexOf("let database=null",start);
assert(start>0&&end>start,'Merge helpers missing');
const guardStart=source.indexOf("function remoteCoversLocal(");
const guardEnd=source.indexOf("\nasync function sync(",guardStart);
assert(guardStart>0&&guardEnd>guardStart,'Remote coverage guard missing');
const core="const MISSING=Symbol('missing');\n"+source.slice(start,end)+'\n'+source.slice(guardStart,guardEnd)+
 '\nthis.testApi={mergeThree,remoteCoversLocal};';
const context={console,Date,JSON,Map,Set,Symbol,Array,Object,Number,String};
vm.runInNewContext(core,context,{timeout:3000});
const {mergeThree,remoteCoversLocal}=context.testApi;
const data=()=>({version:16.8,equiposData:{cadete:{scoutingMatches:[{id:7,notes:'final',sets:[{number:1,rallies:[{id:101,actions:[{id:'a1',type:'serve'}]}]}]}]}}});
const copy=x=>JSON.parse(JSON.stringify(x));
{
 const base=data(),local=copy(base),remote=copy(base);
 remote.scoutingSyncIndex={cadete:[{id:7,notes:'historical'}]};
 const merged=mergeThree(base,local,remote);
 assert.equal(merged.merged.scoutingSyncIndex.cadete[0].notes,'historical','preserve remote extra fields');
}
{
 const base=data(),local=copy(base),remote=copy(base);
 base.scoutingSyncIndex={cadete:[{id:7}]};
 remote.scoutingSyncIndex=copy(base.scoutingSyncIndex);
 assert.equal(mergeThree(base,local,remote).merged.scoutingSyncIndex.cadete[0].id,7);
}
{
 const base=data(),local=copy(base),remote=copy(base);
 delete remote.equiposData.cadete.scoutingMatches[0].notes;
 assert.equal(remoteCoversLocal(local,remote),false,'reject truncated match fields');
 assert.equal(mergeThree(base,local,remote).merged.equiposData.cadete.scoutingMatches[0].notes,'final');
}
{
 const base=data(),remote=copy(base);
 remote.equiposData.cadete.scoutingMatches[0].sets[0].rallies[0].actions=[{id:'a1',type:'attack'}];
 assert.equal(remoteCoversLocal(base,remote),true,'changed values without missing fields are allowed');
}
{
 const base=data(),remote=copy(base);
 remote.equiposData.cadete.scoutingMatches[0].sets[0].rallies[0].actions=[];
 assert.equal(remoteCoversLocal(base,remote),false,'missing action is protected');
}
{
 const base=data(),local=copy(base),remote=copy(base);
 local.equiposData.cadete.scoutingMatches.push({id:8,sets:[]});
 remote.equiposData.cadete.scoutingMatches.push({id:9,sets:[]});
 const result=mergeThree(base,local,remote);
 assert.equal(result.merged.equiposData.cadete.scoutingMatches.length,3,'merge independent matches');
}
{
 const base=data(),local=copy(base),remote=copy(base);
 local.equiposData.cadete.scoutingMatches[0].sets[0].rallies[0].actions.push({id:'a2',type:'block'});
 remote.equiposData.cadete.scoutingMatches[0].sets[0].rallies[0].actions.push({id:'a3',type:'dig'});
 const result=mergeThree(base,local,remote);
 const ids=result.merged.equiposData.cadete.scoutingMatches[0].sets[0].rallies[0].actions.map(a=>a.id);
 assert(ids.includes('a2')&&ids.includes('a3'),'merge independent actions');
}
assert.equal(source.includes("const VERSION='16.9.2'"),true);
const html=fs.readFileSync('index.html','utf8'),worker=fs.readFileSync('service-worker.js','utf8');
assert(html.includes('src="./vc-sync-v1692.js"'));
assert(worker.includes("./vc-sync-v1692.js"));
assert(html.includes('name="volley-coach-build" content="16.9.2"'));
console.log('PASS: regression checks for guarded synchronization V16.9.2');
