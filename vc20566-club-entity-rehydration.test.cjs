'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const copy=value=>JSON.parse(JSON.stringify(value));

function fakeIDB(){
 const databases=new Map(),ops=[],opens=[];
 const factory={open(name,version){
  opens.push({name,version});let aborted=false;
  const request={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,
   onblocked:null,transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),newDB=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){ops.push({kind:'close'})},
     transaction(keys,mode){
      ops.push({kind:'transaction',mode});
      const staged=new Map([...stores].map(([key,entry])=>[key,{keyPath:entry.keyPath,
       rows:new Map([...entry.rows].map(([k,v])=>[k,copy(v)]))}]));
      let scheduled=false,cancelled=false,pending=0;
      const tx={error:null,oncomplete:null,onabort:null,onerror:null,
       abort(){cancelled=true;queueMicrotask(()=>tx.onabort?.())},
       objectStore(key){
        assert.ok(keys.includes(key));const store=staged.get(key);assert.ok(store);
        const schedule=()=>{
         if(scheduled)return;scheduled=true;
         setTimeout(()=>{
          if(cancelled)return;
          if(pending){scheduled=false;schedule();return}
          if(mode==='readwrite')for(const [name,entry] of staged)stores.get(name).rows=entry.rows;
          tx.oncomplete?.();
         },0);
        };
        return {
         get(id){pending++;const req={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{req.result=store.rows.has(id)?copy(store.rows.get(id)):undefined;
           try{req.onsuccess?.()}finally{pending--;schedule()}});return req},
         put(row){assert.equal(mode,'readwrite');ops.push({kind:'put',store:key});
          store.rows.set(row[store.keyPath],copy(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');ops.push({kind:'delete',store:key});
          store.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     },__records:stores};
   }
   if(newDB||(version!==undefined&&version>db.version)){
    request.result=db;request.onupgradeneeded?.();
    if(aborted){request.error=Error('AbortError');request.onerror?.();return}
    db.version=version??1;databases.set(name,db);
   }
   request.result=db;request.onsuccess?.();
  });return request;
 }};
 return {factory,databases,ops,opens};
}

const fixture=()=>({
 infantil:{jugadores:[{id:'z9',nombre:'NOMBRE-PRIVADO'},{id:'a1',numero:1}],
  historial:[{id:50,fecha:'d2'},{id:4,fecha:'d1'}],
  planificacion:[],plantillas:[],sesionActual:[],temporadas:['2026/27','2025/26'],
  meta:{jugadores:2},temporada:'2026/27',
  scoutingMatches:[{actions:[{code:'*12S#',videoTime:100}]}]},
 cadete:{historial:[],planificacion:[],plantillas:[],sesionActual:[],seasonName:'2026/27'}
});

test('V20.5.66 reconstructs exact array order and absent vs empty fields',async()=>{
 const mod=await compiled(),source=fixture(),original=copy(source);
 const plan=mod.planClubEntities(source,'rebuild');
 assert.equal(plan.complete,true);
 const rows=new Map();
 for(const store of ['playerEntities','trainingEntities','seasonEntities'])
  for(const row of plan.rows[store])rows.set(row.key,row);
 const projected=mod.reconstructClubEntityFields(plan,rows);
 assert.deepEqual(projected.infantil.jugadores.map(p=>p.id),['z9','a1']);
 assert.deepEqual(projected.infantil.historial.map(x=>x.id),[50,4]);
 assert.deepEqual(projected.infantil.temporadas,['2026/27','2025/26']);
 assert.deepEqual(projected.infantil.planificacion,[]);
 assert.equal(Object.hasOwn(projected.cadete,'jugadores'),false);
 assert.equal(Object.hasOwn(projected.infantil,'scoutingMatches'),false);
 assert.equal(mod.sameClubPartitionPlan(mod.planClubPartitions(source,'x'),
  mod.planClubPartitions(projected,'x')),true);
 assert.deepEqual(source,original);
});

test('reordering existing player IDs invalidates the layout guard',async()=>{
 const mod=await compiled(),source=fixture(),first=mod.planClubEntities(source,'one');
 source.infantil.jugadores.reverse();
 const second=mod.planClubEntities(source,'two');
 assert.deepEqual(first.rows.playerEntities,second.rows.playerEntities);
 assert.equal(mod.sameClubEntityData(first,second),false);
 assert.notDeepEqual(first.layout,second.layout);
});

test('a fresh readonly database connection successfully rehearses a complete replica',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 const stored=mod.planClubEntities(source,'saved');
 assert.equal((await mod.pilotClubEntityDelta({factory:mem.factory,plan:stored})).status,'verified');
 const writes=mem.ops.filter(v=>v.kind==='put'||v.kind==='delete').length;
 const result=await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'read-later'),source});
 assert.equal(result.status,'ready');assert.equal(result.readOnly,true);
 assert.equal(result.authoritative,false);assert.equal(result.dryRun,true);
 assert.equal(result.teams,2);
 assert.equal(mem.opens.at(-1).version,undefined);
 assert.equal(mem.ops.filter(v=>v.kind==='put'||v.kind==='delete').length,writes);
 assert.equal(mem.ops.at(-2).mode,'readonly');
});

test('missing replica remains absent, and incomplete IDs cannot be promoted',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 assert.equal((await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'missing'),source})).status,'missing');
 assert.equal(mem.databases.size,0);
 source.infantil.jugadores.push({nombre:'SIN-ID'});
 const opens=mem.opens.length;
 const report=await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'incomplete'),source});
 assert.equal(report.status,'incomplete');assert.ok(report.pendingIds>0);
 assert.equal(mem.opens.length,opens,'a partial club does not start reconstruction');
});

test('stale state, removed rows and old manifests block reconstruction',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(source,'saved')});
 const db=mem.databases.get(mod.CLUB_PILOT_DB);
 source.infantil.jugadores.reverse();
 assert.equal((await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'reordered'),source})).status,'different');
 source.infantil.jugadores.reverse();
 const manifest=db.__records.get('entityManifest').rows.get('current');
 delete manifest.layout;
 assert.equal((await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'legacy'),source})).status,'incompatible');
 manifest.layout=copy(mod.planClubEntities(source,'restored').layout);
 db.__records.get('playerEntities').rows.clear();
 assert.equal((await mod.rehearseClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'missing-row'),source})).status,'different');
});

test('Gestión starts with no reads, exposes only dry-run counts and can be disposed',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 const button={disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}};
 const status={textContent:''};
 const elements={'vc20566-rehearse-recovery':button,'vc20566-rehydration-status':status};
 const win={indexedDB:mem.factory,document:{getElementById:id=>elements[id]||null},
  VC_V1917_TEAM_STATE:()=>source};
 const api=mod.mountClubRehydrationPanel(win);
 assert.equal(api.manualOnly,true);assert.equal(api.authoritative,false);
 assert.equal(mem.opens.length,0);
 assert.equal((await api.rehearse()).status,'missing');
 assert.equal(mem.databases.size,0);assert.equal(status.textContent.includes('NOMBRE-PRIVADO'),false);
 api.dispose();assert.equal(button.disabled,true);
});

test('release V66 exposes manual rehearsal without replacing live state storage',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.5');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20566-club-entity-rehydration.test.cjs'));
 assert.ok(html.includes('id="vc20566-rehearse-recovery" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountClubRehydrationPanel(window)'));
 assert.ok(read('service-worker.js').includes('club-rehydration-dryrun-20.5.66'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
