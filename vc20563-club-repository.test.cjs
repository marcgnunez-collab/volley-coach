'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');

// Deterministic asynchronous transaction double. A real browser IDB test is still required.
function fakeIndexedDB({failPut=false,corruptRead=false,blockOpen=false}={}){
 const dbs=new Map(),opened=[],deleted=[],closed=[];
 const copy=value=>JSON.parse(JSON.stringify(value));
 const makeDb=name=>{
  const records=new Map();
  const db={
   objectStoreNames:{contains:store=>records.has(store)},
   createObjectStore(store,options){
    assert.ok(!records.has(store));records.set(store,{keyPath:options.keyPath,rows:new Map()});
   },
   transaction(stores,mode){
    assert.ok(stores.every(s=>records.has(s)));
    const writable=mode==='readwrite';
    const staged=new Map([...records].map(([store,entry])=>[store,{...entry,
     rows:new Map([...entry.rows].map(([key,value])=>[key,copy(value)]))}]));
    let scheduled=false,aborted=false;
    const tx={error:null,oncomplete:null,onerror:null,onabort:null,
     abort(){aborted=true;queueMicrotask(()=>tx.onabort?.())},
     objectStore(store){
      const entry=staged.get(store);
      return {
       put(row){if(!writable)throw Error('READ-ONLY');
        if(failPut)throw Error('SYNTHETIC-QUOTA');
        entry.rows.set(row[entry.keyPath],copy(row));schedule();return {};
       },
       get(key){const request={result:undefined,error:null,onsuccess:null,onerror:null};
        queueMicrotask(()=>{
         let result=entry.rows.get(key);
         if(result&&corruptRead&&store==='players')result={...result,dataJson:'CORRUPTED'};
         request.result=result===undefined?undefined:copy(result);
         request.onsuccess?.();
        });
        schedule();return request;
       }
      };
     }
    };
    function schedule(){if(scheduled)return;scheduled=true;
     setTimeout(()=>{
      if(aborted)return;
      if(writable)for(const [store,entry] of staged)records.get(store).rows=entry.rows;
      tx.oncomplete?.();
     },0);
    }
    return tx;
   },
   close(){closed.push(name)}
  };
  db.__records=records;
  return db;
 };
 const factory={
  open(name,version){opened.push({name,version});
   const req={result:null,transaction:{abort(){}},onupgradeneeded:null,
    onsuccess:null,onerror:null,onblocked:null,error:null};
   queueMicrotask(()=>{
    if(blockOpen){req.onblocked?.();return}
    if(!dbs.has(name)){const db=makeDb(name);dbs.set(name,db);
     req.result=db;req.onupgradeneeded?.();}
    else req.result=dbs.get(name);
    req.onsuccess?.();
   });return req;
  },
  deleteDatabase(name){deleted.push(name);
   const req={onsuccess:null,onerror:null,onblocked:null,error:null};
   queueMicrotask(()=>{dbs.delete(name);req.onsuccess?.()});return req;
  }
 };
 return {factory,dbs,opened,deleted,closed};
}

const source=()=>({
 cadete:{jugadores:[{id:2,nombre:'PRIVATE-A',numero:3}],
  sesionActual:[{id:5,entrenador:'PRIVATE-COACH'}],
  historial:[{fecha:'2026-11-22',ejercicios:[1]}],
  planificacion:[],plantillas:[{id:5}],meta:{temporada:'2026/27'},
  scoutingMatches:[{rallies:[{code:'*12S#',videoTime:1.5}]}]},
 infantil:{jugadores:[],temporada:'2026/27',temporadas:['2025/26'],
  scoutingMatches:[{rallies:Array.from({length:100},(_,i)=>({code:i}))}]}
});

test('V20.5.63 partition plan preserves team data and skips scouting/video',async()=>{
 const module=await compiled(),teams=source();
 const plan=module.planClubPartitions(teams,'pilot-1');
 assert.deepEqual([...plan.teamIds],['cadete','infantil']);
 assert.equal(plan.schema,1);
 assert.equal(plan.rows.players.length,2);
 assert.equal(plan.rows.trainings.length,2);
 assert.equal(plan.rows.seasons.length,2);
 const cadetePlayers=JSON.parse(plan.rows.players[0].dataJson);
 const cadeteTraining=JSON.parse(plan.rows.trainings[0].dataJson);
 const cadeteSeason=JSON.parse(plan.rows.seasons[0].dataJson);
 assert.deepEqual(cadetePlayers.jugadores,teams.cadete.jugadores);
 assert.deepEqual(cadeteTraining.meta,teams.cadete.meta);
 assert.deepEqual(cadeteTraining.historial,teams.cadete.historial);
 assert.deepEqual(cadeteSeason,{});
 assert.equal(plan.rows.seasons[1].dataJson,JSON.stringify({temporada:'2026/27',temporadas:['2025/26']}));
 assert.equal(JSON.stringify(plan).includes('scoutingMatches'),false);
 assert.equal(JSON.stringify(plan).includes('*12S#'),false);
 assert.deepEqual(teams,source(),'the plan never modifies canonical records');
 assert.ok(Object.isFrozen(plan)&&Object.isFrozen(plan.rows.players));
});

test('pilot commits all three stores atomically, reads each back and preserves team keys',async()=>{
 const module=await compiled(),mem=fakeIndexedDB();
 const plan=module.planClubPartitions(source(),'pilot-1');
 const receipt=await module.pilotClubPartitions({factory:mem.factory,plan});
 assert.equal(receipt.status,'verified');
 assert.equal(receipt.authoritative,false);
 assert.equal(receipt.recordCount,6);
 assert.equal(receipt.teamCount,2);
 assert.deepEqual(mem.opened,[{name:module.CLUB_PILOT_DB,version:2}]);
 const records=mem.dbs.get(module.CLUB_PILOT_DB).__records;
 assert.deepEqual([...records.keys()],['players','trainings','seasons','metadata',
  'playerEntities','trainingEntities','seasonEntities','entityManifest']);
 assert.equal(records.get('players').rows.size,2);
 assert.equal(records.get('trainings').rows.size,2);
 assert.equal(records.get('seasons').rows.size,2);
 assert.deepEqual(records.get('metadata').rows.get('current').teamIds,['cadete','infantil']);
 assert.equal(mem.closed.length,1);
 const repeated=module.planClubPartitions(source(),'pilot-2');
 assert.equal((await module.pilotClubPartitions({factory:mem.factory,plan:repeated})).status,'verified');
 assert.equal(records.get('players').rows.size,2,'same team overwrites the pilot mirror only');
 assert.equal(records.get('metadata').rows.get('current').revision,'pilot-2');
});

test('a mismatched readback cannot report a successful replica',async()=>{
 const module=await compiled(),mem=fakeIndexedDB({corruptRead:true});
 const plan=module.planClubPartitions(source(),'pilot-3');
 await assert.rejects(module.pilotClubPartitions({factory:mem.factory,plan}),/no coincide/);
 assert.equal(mem.closed.length,1);
});

test('failed pilot writes cannot touch the original state or return a success receipt',async()=>{
 const module=await compiled(),mem=fakeIndexedDB({failPut:true}),canonical=source();
 const plan=module.planClubPartitions(canonical,'pilot-4');
 await assert.rejects(module.pilotClubPartitions({factory:mem.factory,plan}),/SYNTHETIC-QUOTA/);
 assert.deepEqual(canonical,source());
 assert.equal(mem.closed.length,1);
 const records=mem.dbs.get(module.CLUB_PILOT_DB).__records;
 assert.equal(records.get('players').rows.size,0);
 assert.equal(records.get('metadata').rows.size,0);
});

test('blocked database never claims to be opened or verified',async()=>{
 const module=await compiled(),mem=fakeIndexedDB({blockOpen:true});
 await assert.rejects(module.pilotClubPartitions({factory:mem.factory,
  plan:module.planClubPartitions(source(),'pilot-5')}),/Otra pestaña/);
 assert.equal(mem.closed.length,0);
});

test('only explicitly requested pilot database may be removed',async()=>{
 const module=await compiled(),mem=fakeIndexedDB(),plan=module.planClubPartitions(source(),'pilot-6');
 await module.pilotClubPartitions({factory:mem.factory,plan});
 assert.ok(mem.dbs.has(module.CLUB_PILOT_DB));
 assert.equal(await module.removeClubPilot(mem.factory),true);
 assert.deepEqual(mem.deleted,[module.CLUB_PILOT_DB]);
 assert.equal(mem.dbs.has(module.CLUB_PILOT_DB),false);
 assert.notEqual(module.CLUB_PILOT_DB,'VolleyCoachScoutJournalV902');
});

test('mounting Gestión performs no database operation; only explicit run creates a replica',async()=>{
 const module=await compiled(),mem=fakeIndexedDB();
 const makeButton=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const create=makeButton(),remove=makeButton(),status={textContent:''};
 const elements={'vc20563-run-pilot':create,'vc20563-remove-pilot':remove,
  'vc20563-pilot-status':status};
 const win={document:{getElementById:id=>elements[id]||null},
  indexedDB:mem.factory,VC_V1917_TEAM_STATE:source,confirm:()=>true};
 const api=module.mountClubPilotPanel(win);
 assert.ok(api);assert.equal(api.authoritative,false);
 assert.equal(api.manualOnly,true);
 assert.equal(create.disabled,false);
 assert.equal(remove.disabled,false);
 assert.equal(mem.opened.length,0);
 assert.equal(mem.dbs.size,0);
 assert.strictEqual(module.mountClubPilotPanel(win),api);
 assert.equal((await api.run()).status,'verified');
 assert.equal(mem.opened.length,1);
 assert.match(status.textContent,/Réplica piloto verificada/);
 assert.ok(!status.textContent.includes('PRIVATE'));
 assert.equal(await api.removeReplica(),true);
 assert.equal(mem.deleted.length,1);
 api.dispose();assert.equal(create.disabled,true);
 assert.equal(remove.disabled,true);
 assert.equal(win.VC_CLUB_PILOT_20563,undefined);
});

test('source changes invalidate parity; unsupported data are rejected before any write',async()=>{
 const module=await compiled(),a=source(),b=source();
 const old=module.planClubPartitions(a,'pilot-7');
 assert.equal(module.sameClubPartitionPlan(old,module.planClubPartitions(b,'pilot-8')),true);
 b.cadete.jugadores[0].nombre='PRIVATE-CHANGED';
 assert.equal(module.sameClubPartitionPlan(old,module.planClubPartitions(b,'pilot-8')),false);
 assert.throws(()=>module.planClubPartitions(null,'bad'),/Estado de equipos/);
 assert.throws(()=>module.planClubPartitions({infantil:12},'bad'),/no compatible/);
 assert.throws(()=>module.planClubPartitions({},'bad'),/Número de equipos/);
 assert.throws(()=>module.planClubPartitions({infantil:{jugadores:['x'.repeat(5_000_001)]}},'bad'),/límite/);
});

test('management exposes a visible, explicitly manual pilot with deletion and original save policy',()=>{
 const entry=read('src/vc2055-entry.ts'),html=read('index.html'),legacy=read('002-core-training-v150-monolithic.js'),
  pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.74');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20563-club-repository.test.cjs'));
 assert.ok(html.includes('id="vc20563-club-pilot"'));
 assert.ok(html.includes('id="vc20563-run-pilot" disabled'));
 assert.ok(html.includes('id="vc20563-remove-pilot" disabled'));
 assert.ok(html.includes('<b>Repositorios piloto</b>'));
 assert.ok(entry.includes('mountClubPilotPanel(window)'));
 assert.ok(legacy.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(legacy.includes('vc1531WriteState(APP_STORAGE_KEY,raw)'));
 assert.ok(read('service-worker.js').includes('club-repository-pilot-20.5.63'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.74'));
 assert.equal(read('src/state/club-repository-runtime.ts').includes('guardarEstadoLocalSinCloud('),false);
});
