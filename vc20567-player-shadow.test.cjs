'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const copy=value=>JSON.parse(JSON.stringify(value));

function fakeIDB({failPut=false,corruptRead=false}={}){
 const databases=new Map(),ops=[];
 const factory={open(name,version){
  ops.push({kind:'open',version});let aborted=false;
  const req={result:null,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,
   onblocked:null,transaction:{abort(){aborted=true}}};
  queueMicrotask(()=>{
   let db=databases.get(name),fresh=!db;
   if(!db){
    const stores=new Map();
    db={version:version??1,objectStoreNames:{contains:key=>stores.has(key)},
     createObjectStore(key,{keyPath}){stores.set(key,{keyPath,rows:new Map()})},
     close(){ops.push({kind:'close'})},
     transaction(keys,mode){
      ops.push({kind:'transaction',mode});
      const staged=new Map([...stores].map(([key,entry])=>[key,{keyPath:entry.keyPath,
       rows:new Map([...entry.rows].map(([k,v])=>[k,copy(v)]))}]));
      let pending=0,scheduled=false,cancelled=false;
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
         get(id){pending++;const r={result:undefined,error:null,onsuccess:null,onerror:null};
          queueMicrotask(()=>{
           const v=store.rows.get(id);r.result=v===undefined?undefined:copy(v);
           if(corruptRead&&mode==='readonly'&&key==='playerRows'&&r.result)
            r.result.dataJson='TAMPERED';
           try{r.onsuccess?.()}finally{pending--;schedule()}
          });return r},
         put(row){assert.equal(mode,'readwrite');if(failPut)throw Error('PRIVATE-QUOTA');
          ops.push({kind:'put',store:key});store.rows.set(row[store.keyPath],copy(row));
          schedule();return {}},
         delete(id){assert.equal(mode,'readwrite');ops.push({kind:'delete',store:key});
          store.rows.delete(id);schedule();return {}}
        };
       }
      };return tx;
     },__records:stores};
   }
   if(fresh||(version!==undefined&&version>db.version)){
    req.result=db;req.onupgradeneeded?.();
    if(aborted){req.error=Error('AbortError');req.onerror?.();return}
    db.version=version??1;databases.set(name,db);
   }
   req.result=db;req.onsuccess?.();
  });return req;
  },
  deleteDatabase(name){ops.push({kind:'deleteDatabase',name});databases.delete(name);
   const req={onsuccess:null,onerror:null,error:null,onblocked:null};
   queueMicrotask(()=>req.onsuccess?.());return req}
 };
 return {factory,databases,ops};
}
function fakeLocks(){
 let held=false;
 return {request(name,options,callback){
  assert.equal(options.ifAvailable,true);
  if(held)return Promise.resolve(callback(null));
  held=true;
  return Promise.resolve(callback({name})).finally(()=>{held=false});
 }};
}
const fixture=()=>({version:5.8,bibliotecaCompartida:[{id:1,nombre:'BIBLIOTECA'}],
 equiposData:{
  infantil:{jugadores:[{id:'z9',nombre:'NOMBRE-PRIVADO'},{uuid:'a1',numero:1}],
   scoutingMatches:[{rallies:[{code:'*12S#'}]}]},
  cadete:{jugadores:[]}
 }});
const plan=(mod,source,rev='testing')=>mod.planPlayerShadow(JSON.stringify(source),rev);

test('V20.5.67 reads only player entities from confirmed club JSON',async()=>{
 const mod=await compiled(),source=fixture(),original=copy(source);
 const p=plan(mod,source);
 assert.equal(p.complete,true);assert.equal(p.rows.length,2);
 assert.deepEqual(p.order.infantil.map(key=>JSON.parse(key).at(-1)),['z9','a1']);
 assert.equal(p.present.infantil,true);assert.equal(p.present.cadete,true);
 assert.equal(JSON.stringify(p).includes('scoutingMatches'),false);
 assert.equal(JSON.stringify(p).includes('*12S#'),false);
 assert.equal(JSON.stringify(p).includes('BIBLIOTECA'),false);
 assert.deepEqual(source,original);
});

test('missing and duplicate historical IDs reject the write before IndexedDB opens',async()=>{
 const mod=await compiled(),source=fixture(),mem=fakeIDB();
 source.equiposData.infantil.jugadores.push({nombre:'SIN-ID'},
  {id:'z9',nombre:'DUPLICADO'});
 const p=plan(mod,source);
 assert.equal(p.complete,false);assert.equal(p.pendingIds,3);
 await assert.rejects(mod.writePlayerShadow({factory:mem.factory,plan:p}),/IDs pendientes/);
 assert.equal(mem.databases.size,0);
 assert.equal((await mod.inspectPlayerShadow({factory:mem.factory,plan:p})).status,'incomplete');
 assert.equal(mem.ops.length,0);
});

test('manual mirror writes changed players and removes obsolete rows only in its own DB',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 const first=await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'first')});
 assert.equal(first.status,'verified');assert.equal(first.records,2);
 assert.equal(first.added,2);assert.equal(first.authoritative,false);
 const writes=()=>mem.ops.filter(op=>op.kind==='put'&&op.store==='playerRows').length;
 assert.equal(writes(),2);
 const second=await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'again')});
 assert.equal(second.unchanged,2);assert.equal(writes(),2);
 source.equiposData.infantil.jugadores[0].nombre='CAMBIADO';
 source.equiposData.infantil.jugadores.pop();
 const third=await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'changed')});
 assert.equal(third.changed,1);assert.equal(third.removed,1);assert.equal(third.added,0);
 assert.equal(mem.databases.get(mod.PLAYER_SHADOW_DB).__records.get('playerRows').rows.size,1);
 assert.equal(source.equiposData.infantil.scoutingMatches[0].rallies[0].code,'*12S#');
});

test('readonly inspection detects absent and stale replicas without writing',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture();
 assert.equal((await mod.inspectPlayerShadow({factory:mem.factory,plan:plan(mod,source)})).status,'missing');
 assert.equal(mem.databases.size,0);
 await mod.writePlayerShadow({factory:mem.factory,plan:plan(mod,source,'one')});
 const count=mem.ops.filter(op=>op.kind==='put'||op.kind==='delete').length;
 const valid=await mod.inspectPlayerShadow({factory:mem.factory,plan:plan(mod,source,'new-rev')});
 assert.equal(valid.status,'verified');assert.equal(valid.records,2);
 source.equiposData.infantil.jugadores.reverse();
 assert.equal((await mod.inspectPlayerShadow({factory:mem.factory,
  plan:plan(mod,source,'reordered')})).status,'different');
 assert.equal(mem.ops.filter(op=>op.kind==='put'||op.kind==='delete').length,count);
});

test('corruption and quota problems cannot be mistaken for verified shadow writes',async()=>{
 const mod=await compiled(),source=fixture(),p=plan(mod,source);
 const corrupted=fakeIDB({corruptRead:true});
 await assert.rejects(mod.writePlayerShadow({factory:corrupted.factory,plan:p}),/no coincide/);
 const quota=fakeIDB({failPut:true});
 await assert.rejects(mod.writePlayerShadow({factory:quota.factory,plan:p}),/PRIVATE-QUOTA/);
 assert.equal(quota.databases.get(mod.PLAYER_SHADOW_DB).__records.get('playerManifest').rows.size,0);
});

test('Gestion remains unarmed after mounting; after consent it mirrors and can erase only the pilot',async()=>{
 const mod=await compiled(),mem=fakeIDB(),source=fixture(),raw=JSON.stringify(source);
 const makeButton=()=>({disabled:true,listeners:new Map(),
  addEventListener(type,fn){this.listeners.set(type,fn)},
  removeEventListener(type){this.listeners.delete(type)}});
 const arm=makeButton(),pause=makeButton(),check=makeButton(),erase=makeButton(),backup=makeButton(),reopen=makeButton();
 const status={textContent:''};
 const elements={'vc20567-arm-players':arm,'vc20567-pause-players':pause,
  'vc20567-check-players':check,'vc20567-erase-players':erase,
  'vc20569-download-players':backup,
  'vc20570-reopen-players':reopen,'vc20570-reopen-status':{textContent:''},
  'vc20571-prepare-cold':makeButton(),'vc20571-verify-cold':makeButton(),
  'vc20571-cancel-cold':makeButton(),'vc20571-cold-status':{textContent:''},
  'vc20567-player-shadow-status':status};
 const local={state:raw,getItem(key){return key==='volleyCoachStateV43'?this.state:null}};
 const win={document:{getElementById:id=>elements[id]||null},indexedDB:mem.factory,
  navigator:{locks:fakeLocks()},localStorage:local,confirm:()=>true};
 const api=mod.mountPlayerShadowPanel(win);
 assert.equal(api.manualOnly,true);assert.equal(api.authoritative,false);
 assert.equal(api.enabled(),false);assert.equal(mem.ops.length,0);
 await api.arm();await api.whenIdle();assert.equal(api.enabled(),true);
 assert.equal((await api.inspect()).status,'verified');
 source.equiposData.infantil.jugadores[0].nombre='NUEVO';
 local.state=JSON.stringify(source);
 api.onConfirmedWrite(local.state);await api.whenIdle();
 assert.equal((await api.inspect()).status,'verified');
 api.pause();assert.equal(api.enabled(),false);
 api.onConfirmedWrite(local.state);await api.whenIdle();
 assert.equal(await api.erase(),true);assert.equal(mem.databases.size,0);
 assert.equal(local.state,JSON.stringify(source),'canonical storage is never changed');
 assert.ok(!status.textContent.includes('NOMBRE-PRIVADO'));
  source.equiposData.infantil.jugadores.push({nombre:'SIN-ID'});
  local.state=JSON.stringify(source);
  await assert.rejects(api.arm(),/identidades pendientes/);
  assert.equal(api.enabled(),false);assert.equal(mem.databases.size,0);
 api.dispose();assert.equal(arm.disabled,true);
});

test('native save hook runs only AFTER a confirmed main write, never on failure or disabled mode',()=>{
 const native=read('002-core-training-v150-monolithic.js'),
  start=native.indexOf('function guardarEstadoLocalSinCloud(){'),
  end=native.indexOf('function guardarEquipoEnMemoria(){',start);
 assert.ok(start>=0&&end>start);
 const calls=[];let permitted=true,fail=false;
 const window={VC_PLAYER_SHADOW_20567:{VERSION:'20.5.67',manualOnly:true,
  enabled:()=>permitted,onConfirmedWrite:raw=>calls.push({kind:'shadow',raw})}};
 const context={window,console,Date,JSON,
  baseDeDatos:[],equiposData:fixture().equiposData,equipoActivo:'infantil',
  APP_STORAGE_KEY:'volleyCoachStateV43',ACTIVE_TEAM_KEY:'volleyCoachActiveTeamV43',
  clonar:copy,localStorage:{setItem(){}},guardarBibliotecaIndependiente(){},
  vc1531WriteState(key,raw){calls.push({kind:'main',key});if(fail)throw Error('SAVE-FAILED');
   return 'normal'}};
 const fn=vm.runInNewContext(`${native.slice(start,end)}\n guardarEstadoLocalSinCloud`,context);
 fn();assert.deepEqual(calls.map(v=>v.kind),['main','shadow']);
 calls.length=0;permitted=false;
 fn();assert.deepEqual(calls.map(v=>v.kind),['main']);
 calls.length=0;permitted=true;fail=true;
 assert.throws(()=>fn(),/SAVE-FAILED/);
 assert.deepEqual(calls.map(v=>v.kind),['main']);
});

test('release V67 mounts manual opt-in AFTER original save and retains all live owners',()=>{
 const html=read('index.html'),legacy=read('002-core-training-v150-monolithic.js'),
  pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'20.5.81');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20567-player-shadow.test.cjs'));
 assert.ok(html.includes('id="vc20567-arm-players" disabled'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.81'));
 assert.ok(read('src/vc2055-entry.ts').includes('mountPlayerShadowPanel(window)'));
 assert.ok(read('service-worker.js').includes('player-shadow-optin-20.5.67'));
 assert.ok(legacy.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(legacy.indexOf('const shadow=window.VC_PLAYER_SHADOW_20567')>
  legacy.indexOf('const mode=vc1531WriteState(APP_STORAGE_KEY,raw)'));
 assert.ok(legacy.includes('shadow.onConfirmedWrite(raw)'));
});
