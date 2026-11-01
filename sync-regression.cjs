 'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
const take=id=>{const startTag='<script id="'+id+'">';const start=html.indexOf(startTag);assert(start>=0,'Missing inline '+id);const end=html.indexOf('</script>',start+startTag.length);assert(end>start,'Unclosed script '+id);return html.slice(start+startTag.length,end)};
const source=take('vc1697-sync-inline'),management=take('vc1697-management-inline');
for(const [name,code] of [['sync',source],['management',management],['service-worker',worker]])new vm.Script(code,{filename:name});
// Detect prematurely closed inline blocks (for example, script tags inserted inside template literals).
let checked=0;
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){
 if(m[1].trim()){new vm.Script(m[1],{filename:'inline '+(++checked)})}
}
assert(checked>=100,'Expected the original application code to be present');
assert(html.includes('name="volley-coach-build" content="16.9.7"'));
assert(worker.includes("const BUILD='16.9.7'"));
assert(!html.includes('src="./vc-sync-v1693.js"'));
assert(!html.includes('src="./vc-scout-management-v1695.js"'));
assert(!worker.includes('vc-sync-v1693.js'));
assert(!worker.includes('vc-scout-management-v1695.js'));
const external=[...html.matchAll(/<script\b[^>]*src="(\.\/[^\"]+\.js)"/gi)].map(m=>m[1]);
const expected=['./vc-recovery-v169.js','./vc-csv-reconcile-v1691.js','./vc-reopen-safe-v1694.js','./vc-reopen-entry-v1694.js','./vc-delete-entry-v1694.js'];
assert.deepEqual(external,expected,'Do not drop recovery, CSV import or reopen/delete modules');
for(const asset of expected)assert(worker.includes("'"+asset+"'"),'Missing PWA asset: '+asset);
const first=source.indexOf('const MISSING='),last=source.indexOf('function apply(s){',first);
assert(first>=0&&last>first);
const ctx={console,JSON,Date,Map,Set,Object,Array,String,Number,Symbol};
vm.runInNewContext(source.slice(first,last)+'\nthis.api={mergeThree,normalize,applyDeletes,deleted,eq}',ctx,{timeout:4000});
const {mergeThree,normalize}=ctx.api;
const data=()=>({version:16.8,bibliotecaCompartida:[],bibliotecaBorrados:[],bibliotecaVersion:1,equiposData:{team:{scoutingMatches:[{id:1,status:'finished',opponent:'A',sets:[{number:1,rallies:[{id:1,actions:[{id:'a',type:'attack'}]}]}]}]}}});
const cp=x=>JSON.parse(JSON.stringify(x));
{
 const b=data(),a=cp(b),r=cp(b);r.equiposData.team.scoutingMatches[0].opponent='B';
 const x=mergeThree(b,a,r);assert.equal(x.merged.equiposData.team.scoutingMatches[0].opponent,'B');assert.equal(x.conflicts.length,0);
}
{
 const b=data(),a=cp(b),r=cp(b);a.equiposData.team.scoutingMatches.push({id:2,sets:[]});r.equiposData.team.scoutingMatches.push({id:3,sets:[]});
 const x=mergeThree(b,a,r);assert.deepEqual([...x.merged.equiposData.team.scoutingMatches].map(m=>m.id).sort(),[1,2,3]);
}
for(const side of ['local','remote']){
 const b=data(),a=cp(b),r=cp(b);(side==='local'?a:r).equiposData.team.scoutingDeleted={'1':'2026-11-01T10:00:00Z'};
 const x=mergeThree(b,a,r);assert.equal(x.merged.equiposData.team.scoutingMatches.length,0,'Delete must propagate '+side);
}
{
 const b=data(),a=cp(b),r=cp(b);a.equiposData.team.scoutingMatches[0].sets[0].rallies[0].actions[0].type='block';
 r.equiposData.team.scoutingMatches[0].sets[0].rallies[0].actions[0].type='serve';
 assert(mergeThree(b,a,r).conflicts.length>0,'Concurrent rally edits require review');
}
assert(source.includes('VolleyCoachSyncV1696'),'Preserve existing local backup DB');
assert(source.includes('legacyBaseline'),'Migrate older acknowledged baselines');
console.log('PASS: '+checked+' inline scripts, version/asset integrity, protected merge, deletions and concurrent edits');
