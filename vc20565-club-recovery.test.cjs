'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const copy=value=>JSON.parse(JSON.stringify(value));

function fakeIDB(){
 const databases=new Map();const ops=[];const openings=[];
 const factory={open(name,version){
  openings.push({name,version});
  let aborted=false;
  const request={result:null,error:null,onupgradeneeded:null,onsuccess:null,
   onerror:null,onblocked:null,transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),isNew=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){ops.push({kind:'close'})},
     transaction(keys,mode){
      ops.push({kind:'transaction',mode,keys:[...keys]});
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
          if(pending>0){scheduled=false;schedule();return}
          if(mode==='readwrite')for(const [name,entry] of staged)stores.get(name).rows=entry.rows;
          tx.oncomplete?.();
         },0);
        };
        return {
         get(id){pending++;const req={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{req.result=store.rows.has(id)?copy(store.rows.get(id)):undefined;
           try{req.onsuccess?.()}finally{pending--;schedule()}});
          return req},
         put(row){assert.equal(mode,'readwrite');ops.push({kind:'put',store:key});
          store.rows.set(row[store.keyPath],copy(row));schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');ops.push({kind:'delete',store:key});
          store.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     },__records:stores};
   }
   if(isNew||(version!==undefined&&version>db.version)){
    request.result=db;request.onupgradeneeded?.();
    if(aborted){request.error=Error('AbortError');request.onerror?.();return}
    db.version=version??1;
    databases.set(name,db);
   }
   request.result=db;request.onsuccess?.();
  });return request;
 }};
 return {factory,databases,ops,openings};
}

const fixture=()=>({
 infantil:{jugadores:[{id:'12',nombre:'NOMBRE-PRIVADO'},{uuid:'p3',numero:3}],
  historial:[{id:71,fecha:'2026-11-26'}],planificacion:[{id:88,turno:4}],
  plantillas:[],sesionActual:[],temporada:'2026/27',temporadas:['2025/26'],
  scoutingMatches:[{rallies:[{code:'*12S#',videoTime:120}]}]},
 cadete:{jugadores:[],historial:[],planificacion:[],plantillas:[],sesionActual:[],
  seasonName:'2026/27'}
});

test('V20.5.65 verifies a fresh readonly connection after closing the manual V64 pilot',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 const plan=mod.planClubEntities(source,'save');
 assert.equal((await mod.pilotClubEntityDelta({factory:mem.factory,plan})).status,'verified');
 const writes=mem.ops.filter(op=>op.kind==='put'||op.kind==='delete').length;
 const report=await mod.inspectClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'after-reopen')});
 assert.deepEqual(report,{status:'verified',readOnly:true,authoritative:false,
  records:plan.rows.playerEntities.length+plan.rows.trainingEntities.length+
   plan.rows.seasonEntities.length,pendingIds:0,partial:false});
 assert.equal(mem.openings.at(-1).version,undefined,'reopens without schema upgrade');
 assert.equal(mem.ops.filter(op=>op.kind==='put'||op.kind==='delete').length,writes);
 assert.equal(mem.ops.at(-2).mode,'readonly');
});

test('checking an absent pilot aborts database creation and returns missing',async()=>{
 const mod=await compiled(),mem=fakeIDB();
 const result=await mod.inspectClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(fixture(),'missing')});
 assert.equal(result.status,'missing');assert.equal(result.records,0);
 assert.equal(mem.databases.size,0,'no empty pilot is created by a read');
 assert.equal(mem.ops.filter(op=>op.kind==='put').length,0);
});

test('stale club content and tampered pilot rows cannot pass recovery',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 await mod.pilotClubEntityDelta({factory:mem.factory,plan:mod.planClubEntities(source,'r1')});
 source.infantil.historial[0].fecha='2026-12-01';
 assert.equal((await mod.inspectClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'r2')})).status,'different');
 source.infantil.historial[0].fecha='2026-11-26';
 const db=mem.databases.get(mod.CLUB_PILOT_DB);
 const row=db.__records.get('playerEntities').rows.values().next().value;
 row.dataJson='TAMPERED';
 assert.equal((await mod.inspectClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'r3')})).status,'different');
 db.__records.get('entityManifest').rows.clear();
 assert.equal((await mod.inspectClubEntityRecovery({factory:mem.factory,
  plan:mod.planClubEntities(source,'r4')})).status,'missing');
});

test('historical identity proposals operate on a stripped temporary clone only',async()=>{
 const mod=await compiled(),source=fixture(),before=copy(source);
 source.infantil.jugadores.push({nombre:'SIN-ID'},{id:'12',nombre:'DUPLICADO'});
 source.infantil.historial.push({fecha:'2026-11-26'});
 const original=copy(source);let counter=0;
 const preview=mod.previewHistoricIds(source,()=>`test-${++counter}`);
 assert.equal(preview.dryRun,true);assert.equal(preview.authoritative,false);
 assert.equal(preview.proposals.length,2);assert.equal(preview.conflicts,2);
 const rehearsal=mod.rehearseHistoricIds(source,preview);
 assert.equal(rehearsal.applied,2);assert.equal(rehearsal.dryRun,true);
 assert.ok(rehearsal.remaining>0,'duplicate IDs remain unresolved');
 assert.equal(rehearsal.projected.infantil.jugadores[2].id,'vc-historic-test-1');
 assert.equal(rehearsal.projected.infantil.historial[1].id,'vc-historic-test-2');
 assert.equal(rehearsal.projected.infantil.scoutingMatches,undefined);
 assert.deepEqual(source,original);
 assert.equal(before.infantil.jugadores.length,2);
});

test('historical rehearsal rejects stale source rows and duplicate proposed IDs',async()=>{
 const mod=await compiled(),source=fixture();
 source.infantil.jugadores.push({nombre:'A'},{nombre:'B'});
 assert.throws(()=>mod.previewHistoricIds(source,()=> 'repeated'),/duplicada/);
 let next=0;const preview=mod.previewHistoricIds(source,()=>`fresh-${++next}`);
 source.infantil.jugadores[2].nombre='CAMBIADO';
 assert.throws(()=>mod.rehearseHistoricIds(source,preview),/cambiaron/);
 assert.equal(source.infantil.jugadores[2].id,undefined);
});

test('Gestión V65 is manual, does not open DB on mount or ID simulation',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 source.infantil.jugadores.push({nombre:'PRIVADO-SIN-ID'});
 const button=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const check=button(),preview=button(),recoveryStatus={textContent:''},idStatus={textContent:''};
 const elements={'vc20565-check-recovery':check,'vc20565-preview-ids':preview,
  'vc20565-recovery-status':recoveryStatus,'vc20565-ids-status':idStatus};
 const win={document:{getElementById:key=>elements[key]||null},indexedDB:mem.factory,
  crypto:{randomUUID:()=> 'secure-unique-1'},VC_V1917_TEAM_STATE:()=>source};
 const api=mod.mountClubRecoveryPanel(win);
 assert.equal(api.manualOnly,true);assert.equal(api.authoritative,false);
 assert.equal(mem.openings.length,0);
 const result=api.previewIds();assert.equal(result.proposed,1);
 assert.equal(mem.openings.length,0);assert.equal(source.infantil.jugadores.at(-1).id,undefined);
 assert.ok(!idStatus.textContent.includes('PRIVADO'));
 assert.equal((await api.verify()).status,'missing');
 assert.equal(mem.databases.size,0);assert.equal(mem.openings.length,1);
 api.dispose();assert.equal(check.disabled,true);assert.equal(preview.disabled,true);
});

test('release V65 keeps live writer intact while exposing both manual checks',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.equal(pkg.version,'20.7.3');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20565-club-recovery.test.cjs'));
 assert.ok(html.includes('id="vc20565-check-recovery" disabled'));
 assert.ok(html.includes('id="vc20565-preview-ids" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.7.0'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountClubRecoveryPanel(window)'));
 assert.ok(read('service-worker.js').includes('club-recovery-pilot-20.5.65'));
 assert.ok(read('002-core-training-v150-monolithic.js').includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
});
