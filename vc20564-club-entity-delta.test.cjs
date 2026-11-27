'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const copy=v=>JSON.parse(JSON.stringify(v));

function fakeIDB({failPut=false,corruptRead=false}={}){
 const databases=new Map(),ops=[];
 const factory={
  open(name,version){
   const req={result:null,onupgradeneeded:null,onsuccess:null,onerror:null,
    onblocked:null,transaction:{abort(){}}};
   queueMicrotask(()=>{
    let db=databases.get(name);
    if(!db){
     const all=new Map();
     db={version,objectStoreNames:{contains:key=>all.has(key)},
      createObjectStore(store,{keyPath}){all.set(store,{keyPath,rows:new Map()})},
      transaction(stores,mode){
       const next=new Map([...all].map(([key,value])=>[key,{...value,
        rows:new Map([...value.rows].map(([k,v])=>[k,copy(v)]))}]));
       let pending=0,scheduled=false,aborted=false;
       const tx={error:null,oncomplete:null,onerror:null,onabort:null,
        abort(){aborted=true;queueMicrotask(()=>tx.onabort?.())},
        objectStore(store){
         assert.ok(stores.includes(store));const target=next.get(store);
         const schedule=()=>{
          if(scheduled)return;scheduled=true;
          setTimeout(()=>{
           if(aborted)return;
           if(mode==='readwrite')for(const [key,entry] of next)all.get(key).rows=entry.rows;
           tx.oncomplete?.();
          },0);
         };
         return {
          put(row){if(failPut)throw Error('PRIVATE-QUOTA');
           ops.push({op:'put',store,key:row[target.keyPath]});
           target.rows.set(row[target.keyPath],copy(row));schedule();return {}},
          delete(key){ops.push({op:'delete',store,key});target.rows.delete(key);schedule();return {}},
          get(key){const request={result:undefined,onsuccess:null,onerror:null,error:null};
           queueMicrotask(()=>{
            let v=target.rows.get(key);if(corruptRead&&mode==='readonly'&&
              store==='playerEntities'&&v)v={...v,dataJson:'CORRUPTED'};
            request.result=v===undefined?undefined:copy(v);request.onsuccess?.();
           });schedule();return request;
          }
         };
        }
       };
       return tx;
      },
      close() {},
      __records:all
     };
     databases.set(name,db);req.result=db;req.onupgradeneeded?.();
    }else if(version>db.version){db.version=version;req.result=db;req.onupgradeneeded?.();}
    else req.result=db;
    req.onsuccess?.();
   });return req;
  },
  deleteDatabase(name){databases.delete(name);const request={onsuccess:null};
   queueMicrotask(()=>request.onsuccess?.());return request;}
 };
 return {factory,databases,ops};
}

const club=()=>({
 infantil:{jugadores:[{id:'12',nombre:'PRIVADO'},{uuid:'player-3',numero:3}],
  historial:[{id:71,entrenador:'PRIVADO'}],planificacion:[{id:88,semana:4}],
  plantillas:[],sesionActual:[],meta:{equipo:'Infantil',temporada:'2026/27'},
  temporada:'2026/27',temporadas:['2025/26'],
  scoutingMatches:[{rallies:[{code:'*12S#',videoTime:120}]}]},
 cadete:{jugadores:[],historial:[],planificacion:[],sesionActual:[],plantillas:[],
  meta:{equipo:'Cadete'},seasonName:'2026/27'}
});

test('V20.5.73 resolves only genuine stable identities and never stores scouting',async()=>{
 const mod=await compiled(),source=club(),plan=mod.planClubEntities(source,'rev-1');
 assert.equal(plan.schema,2);assert.equal(plan.complete,true);
 assert.equal(plan.rows.playerEntities.length,2);
 assert.equal(plan.rows.trainingEntities.length,4);
 assert.equal(plan.rows.seasonEntities.length,3);
 assert.equal(plan.missingIds,0);assert.equal(plan.duplicatedIds,0);
 const keys=plan.rows.playerEntities.map(row=>JSON.parse(row.key));
 assert.deepEqual(keys.map(k=>k.at(-1)).sort(),['12','player-3']);
 assert.equal(JSON.stringify(plan).includes('scoutingMatches'),false);
 assert.equal(JSON.stringify(plan).includes('*12S#'),false);
 assert.deepEqual(source,club(),'pure projections cannot mutate the original');
});

test('old records without IDs remain unpromoted, duplicates and malformed data are diagnosed',async()=>{
 const mod=await compiled(),source=club();
 source.infantil.jugadores.push({nombre:'PRIVADO-SIN-ID'},{id:'12',nombre:'PRIVADO-DUPLICADO'});
 source.infantil.historial.push({fecha:'2026-11-22'});
 const plan=mod.planClubEntities(source,'rev-2');
 assert.equal(plan.complete,false);
 assert.ok(plan.missingIds>=2);
 assert.equal(plan.duplicatedIds,2);
 assert.equal(plan.rows.playerEntities.length,1,'neither duplicate is guessed to be unique');
 assert.equal(JSON.stringify(source).includes('PRIVADO-SIN-ID'),true);
 assert.equal(mod.sameClubEntityData(plan,mod.planClubEntities(source,'other-revision')),true);
 source.infantil.jugadores[1].numero=12;
 assert.equal(mod.sameClubEntityData(plan,mod.planClubEntities(source,'other-revision')),false);
});

test('repeated season labels cannot be silently selected as stable identities',async()=>{
 const mod=await compiled(),src=club();
 src.infantil.temporadas.push('2025/26');
 const plan=mod.planClubEntities(src,'seasons-duplicate');
 assert.equal(plan.duplicatedIds,2);
 assert.equal(plan.complete,false);
 assert.ok(!plan.rows.seasonEntities.some(v=>v.collection==='temporadas'));
});

test('mounting Gestión previews IDs without opening or changing the pilot database',async()=>{
 const mod=await compiled(),mem=fakeIDB();
 const makeButton=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const inspectBtn=makeButton(),runBtn=makeButton(),status={textContent:''};
 const elements={'vc20564-inspect-ids':inspectBtn,'vc20564-run-delta':runBtn,
  'vc20564-entity-status':status};
 const win={document:{getElementById:id=>elements[id]||null},
  indexedDB:mem.factory,VC_V1917_TEAM_STATE:club};
 const api=mod.mountClubEntityPanel(win);
 assert.ok(api);assert.equal(api.manualOnly,true);assert.equal(api.authoritative,false);
 assert.equal(mem.databases.size,0);
 assert.equal(api.inspect().complete,true);
 assert.equal(mem.databases.size,0);
 assert.equal((await api.run()).status,'verified');
 assert.ok(status.textContent.includes('Piloto incremental verificado'));
 assert.ok(!status.textContent.includes('PRIVADO'));
 api.dispose();assert.equal(runBtn.disabled,true);
 assert.equal(inspectBtn.disabled,true);
});

test('first manual pass inserts entities; next one performs zero entity writes',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=club();
 const one=await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(source,'r1')});
 assert.equal(one.status,'verified');assert.equal(one.authoritative,false);
 assert.equal(one.partial,false);assert.equal(one.added,9);
 const dataWrites=()=>mem.ops.filter(row=>row.store.endsWith('Entities')&&row.op==='put');
 assert.equal(dataWrites().length,9);
 const second=await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(source,'r2')});
 assert.equal(second.added,0);assert.equal(second.changed,0);
 assert.equal(second.unchanged,9);assert.equal(second.removed,0);
 assert.equal(dataWrites().length,9,'only metadata changes on a no-op');
});

test('one changed training and a removed player update only their pilot rows',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=club();
 await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(source,'r1')});
 source.infantil.historial[0].entrenador='PRIVADO-CAMBIO';
 source.infantil.jugadores.splice(0,1);
 const receipt=await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(source,'r2')});
 assert.equal(receipt.changed,1);assert.equal(receipt.removed,1);
 assert.equal(receipt.added,0);assert.equal(receipt.unchanged,7);
 assert.equal(mem.ops.filter(v=>v.op==='delete'&&v.store==='playerEntities').length,1);
 assert.equal(mem.ops.filter(v=>v.op==='put'&&v.store==='trainingEntities').length,5);
 assert.equal(source.infantil.scoutingMatches[0].rallies[0].code,'*12S#');
});

test('verification mismatch and quota failure cannot be reported as a completed migration',async()=>{
 const mod=await compiled(),plan=mod.planClubEntities(club(),'r3');
 const badRead=fakeIDB({corruptRead:true});
 await assert.rejects(mod.pilotClubEntityDelta({factory:badRead.factory,plan}),/no coinciden/);
 const badWrite=fakeIDB({failPut:true});
 await assert.rejects(mod.pilotClubEntityDelta({factory:badWrite.factory,plan}),/PRIVATE-QUOTA/);
 const rows=badWrite.databases.get(mod.CLUB_PILOT_DB).__records;
 assert.equal(rows.get('entityManifest').rows.size,0);
 assert.equal(rows.get('playerEntities').rows.size,0);
});

test('the old team-group pilot still works after the v2 schema upgrade',async()=>{
 const mod=await compiled(),mem=fakeIDB(),src=club();
 const legacy=mod.planClubPartitions(src,'legacy-v2');
 assert.equal((await mod.pilotClubPartitions({factory:mem.factory,plan:legacy})).status,'verified');
 assert.equal((await mod.pilotClubEntityDelta({factory:mem.factory,
  plan:mod.planClubEntities(src,'entity-v2')})).status,'verified');
 assert.equal(mem.databases.get(mod.CLUB_PILOT_DB).version,2);
 assert.equal(mem.databases.get(mod.CLUB_PILOT_DB).__records.get('players').rows.size,2);
 assert.equal(await mod.removeClubPilot(mem.factory),true);
 assert.equal(mem.databases.size,0,'one manual deletion removes both pilot stages');
});

test('management offers manual ID review and delta test without changing main writer',()=>{
 const html=read('index.html'),entry=read('src/vc2055-entry.ts'),
  legacy=read('002-core-training-v150-monolithic.js'),pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.6.5');
 assert.ok(html.includes('id="vc20564-inspect-ids" disabled'));
 assert.ok(html.includes('id="vc20564-run-delta" disabled'));
 assert.ok(entry.includes('mountClubEntityPanel(window)'));
 assert.ok(pkg.scripts['test:foundation'].includes('vc20564-club-entity-delta.test.cjs'));
 assert.ok(legacy.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(read('service-worker.js').includes('club-entities-pilot-20.5.64'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.5'));
});
