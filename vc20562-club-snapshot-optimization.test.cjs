'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const monolith=read('002-core-training-v150-monolithic.js');
const iso='2026-11-22T19:00:00.000Z';
const clone=value=>JSON.parse(JSON.stringify(value));
const mainKey='volleyCoachStateV43',libKey='volleyCoachLibraryV1';

function fixture(size=3){
 const exercises=Array.from({length:size},(_,i)=>({id:`ex-${i}`,titulo:`Ejercicio ${i}`,
  zonas:[4,3,2,5,6,1],notas:'A\"B\\C 👏',metadatos:{a:null,b:true,c:NaN,omit:undefined}}));
 const team=Array.from({length:size*2},(_,i)=>({id:i,fecha:'2026-11-22',
  rallies:[{code:'*12S#',team:'home',points:[25,24],videoTime:i*1.25},
   {code:'.04R+',team:'away',rotation:i%6+1,zone:i%9+1}],
  jugadores:[{id:12,nombre:'PRIVADO',roles:['s','a']}],sesionActual:{ejercicios:[i]},
  temporada:{nombre:`2026-${i}`}}));
 return {bibliotecaCompartida:exercises,equiposData:{infantil:{scoutingMatches:team},cadete:{historial:team.slice(0,2)}}};
}

const legacy=(input,when=iso)=>JSON.stringify({version:5.8,
 bibliotecaCompartida:clone(input.bibliotecaCompartida),bibliotecaVersion:1,
 bibliotecaUpdatedAt:when,equiposData:clone(input.equiposData)});
const legacyLibrary=(input,when=iso)=>JSON.stringify({version:1,
 updatedAt:when,total:input.bibliotecaCompartida.length,
 ejercicios:clone(input.bibliotecaCompartida)});

function harness(input,{bridge,cloneSpy=clone,writeError=null,libraryError=false}={}){
 const writes=[],stored=new Map();
 const win=bridge?{VC_CLUB_SNAPSHOT_20562:bridge}:{};
 const dateClass=class FixedDate{toISOString(){return iso}};
 const ctx=vm.createContext({window:win,Date:dateClass,baseDeDatos:input.bibliotecaCompartida,
  equiposData:input.equiposData,equipoActivo:'infantil',clonar:cloneSpy,
  APP_STORAGE_KEY:mainKey,LIBRARY_STORAGE_KEY:libKey,ACTIVE_TEAM_KEY:'activeTeam',
  localStorage:{setItem(key,value){
   if(key===libKey&&libraryError)throw Error('PRIVATE-BACKUP-ERROR');
   writes.push({key,value});stored.set(key,value);
  }},
  vc1531WriteState(key,value){if(writeError)throw writeError;
   writes.push({key,value});stored.set(key,value);return 'normal'},
  console:{warn:()=>{},info:()=>{}}
 });
 const a=monolith.indexOf('function guardarBibliotecaIndependiente(');
 const b=monolith.indexOf('function aplicarBorradosBiblioteca(',a);
 const c=monolith.indexOf('function guardarEstadoLocalSinCloud(){');
 const d=monolith.indexOf('function guardarEquipoEnMemoria(){',c);
 assert.ok(a>=0&&b>a&&c>=0&&d>c);
 vm.runInContext(monolith.slice(a,b)+'\n'+monolith.slice(c,d),ctx,{timeout:3000});
 return {writes,stored,save:()=>vm.runInContext('guardarEstadoLocalSinCloud()',ctx,{timeout:3000}),
  library:()=>vm.runInContext('guardarBibliotecaIndependiente()',ctx,{timeout:3000})};
}

test('V20.5.62 installs a single immutable snapshot bridge without owning the writer',async()=>{
 const module=await compiled(),host={};
 const bridge=module.installClubSnapshotBridge(host);
 assert.strictEqual(module.installClubSnapshotBridge(host),bridge);
 assert.strictEqual(host.VC_CLUB_SNAPSHOT_20562,bridge);
 assert.equal(bridge.VERSION,'20.5.62');
 assert.equal(bridge.usesExistingPayload,true);
 assert.strictEqual(bridge.serialize,module.serializeClubSnapshot);
 assert.strictEqual(bridge.serializeLibrary,module.serializeClubIndependentLibrary);
 assert.ok(Object.isFrozen(bridge));
});

test('main state and independent backup remain byte-identical across real-world shapes',async()=>{
 const module=await compiled();
 for(const size of [0,1,3,20,200]){
  const data=fixture(size),snapshot=module.serializeClubSnapshot({...data,updatedAt:iso});
  assert.equal(snapshot.raw,legacy(data),`whole state size ${size}`);
  assert.equal(module.serializeClubIndependentLibrary({snapshot,updatedAt:iso,
   total:data.bibliotecaCompartida.length}),legacyLibrary(data),`library size ${size}`);
  assert.ok(Object.isFrozen(snapshot));
 }
 const data={bibliotecaCompartida:[{stamp:new Date('2020-01-01Z'),nested:{
  value:Infinity,minus:-Infinity,nothing:undefined,withSlash:'/\\',text:'á中文🎯'}}],
  equiposData:{'cañete':{players:[null,NaN,true,undefined,1.002],notes:'\n\r\t'}}};
 const snapshot=module.serializeClubSnapshot({...data,updatedAt:iso});
 assert.equal(snapshot.raw,legacy(data));
 assert.equal(module.serializeClubIndependentLibrary({snapshot,updatedAt:iso,total:1}),legacyLibrary(data));
});

test('typed save serializes exercises once and never invokes redundant deep clones',async()=>{
 const bridge=(await compiled()).installClubSnapshotBridge({});
 const data=fixture(15),expected=legacy(data),library=legacyLibrary(data);
 let cloneCalls=0;
 const app=harness(data,{bridge,cloneSpy:value=>{cloneCalls++;return clone(value)}});
 app.save();
 assert.equal(app.stored.get(mainKey),expected);
 assert.equal(app.stored.get(libKey),library);
 assert.equal(app.stored.get('activeTeam'),'infantil');
 assert.equal(cloneCalls,0,'new normal path skips three historical deep clones');
 assert.equal(app.writes.filter(row=>row.key===mainKey).length,1);
 assert.equal(app.writes.filter(row=>row.key===libKey).length,1);
});

test('without Vite the native data shape, two copies and all side effects remain',()=>{
 const data=fixture(9);let cloneCalls=0;
 const app=harness(data,{cloneSpy:value=>{cloneCalls++;return clone(value)}});
 app.save();
 assert.equal(app.stored.get(mainKey),legacy(data));
 assert.equal(app.stored.get(libKey),legacyLibrary(data));
 assert.equal(cloneCalls,3);
 assert.equal(app.writes.length,3);
});

test('typed preparation failure falls back before any write; independent copy can fall back separately',async()=>{
 const base=(await compiled()).installClubSnapshotBridge({}),data=fixture(4);
 let cloneCalls=0;
 const badMain={...base,serialize:()=>{throw Error('PRIVATE-PREPARE-FAIL')}};
 const native=harness(data,{bridge:badMain,cloneSpy:value=>{cloneCalls++;return clone(value)}});
 native.save();
 assert.equal(native.stored.get(mainKey),legacy(data));
 assert.equal(native.stored.get(libKey),legacyLibrary(data));
 assert.equal(native.writes.filter(row=>row.key===mainKey).length,1);
 assert.equal(cloneCalls,3);
 const badLibrary={...base,serializeLibrary:()=>{throw Error('PRIVATE-LIBRARY-FAIL')}};
 cloneCalls=0;
 const partial=harness(data,{bridge:badLibrary,cloneSpy:value=>{cloneCalls++;return clone(value)}});
 partial.save();
 assert.equal(partial.stored.get(mainKey),legacy(data));
 assert.equal(partial.stored.get(libKey),legacyLibrary(data));
 assert.equal(cloneCalls,1,'only independent copy falls back');
 assert.equal(partial.writes.filter(row=>row.key===mainKey).length,1);
 assert.equal(partial.writes.filter(row=>row.key===libKey).length,1);
});

test('a failed primary write is never retried and cannot trigger the independent copy',async()=>{
 const base=(await compiled()).installClubSnapshotBridge({}),data=fixture(10);
 const app=harness(data,{bridge:base,writeError:Error('PRIVATE-QUOTA')});
 app.stored.set(mainKey,'PREVIOUS-VALID-SNAPSHOT');
 assert.throws(()=>app.save(),/PRIVATE-QUOTA/);
 assert.equal(app.stored.get(mainKey),'PREVIOUS-VALID-SNAPSHOT');
 assert.equal(app.stored.has(libKey),false);
 assert.equal(app.writes.length,0);
});

test('library-only writes stay independent and never serialize/write teams',async()=>{
 const data=fixture(5),bridge=(await compiled()).installClubSnapshotBridge({});
 const app=harness(data,{bridge});app.library();
 assert.equal(app.stored.get(libKey),legacyLibrary(data));
 assert.equal(app.stored.has(mainKey),false);
});

test('badly shaped partitions are rejected before they can create invalid JSON',async()=>{
 const module=await compiled();
 assert.throws(()=>module.serializeClubSnapshot({bibliotecaCompartida:undefined,
  equiposData:{},updatedAt:iso}),/biblioteca/);
 assert.throws(()=>module.serializeClubSnapshot({bibliotecaCompartida:[],
  equiposData:undefined,updatedAt:iso}),/equipos/);
 assert.throws(()=>module.serializeClubSnapshot({bibliotecaCompartida:[],
  equiposData:{},updatedAt:undefined}),/Instantánea/);
 const snap=module.serializeClubSnapshot({...fixture(1),updatedAt:iso});
 assert.throws(()=>module.serializeClubIndependentLibrary({snapshot:snap,
  updatedAt:iso,total:-1}),/biblioteca/);
});

test('version and assets expose the new code with unchanged historical storage keys',()=>{
 const html=read('index.html'),pkg=JSON.parse(read('package.json'));
 const source=read('src/vc2055-entry.ts');
 assert.equal(pkg.version,'20.5.77');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20562-club-snapshot-optimization.test.cjs'));
 assert.ok(source.includes('installClubSnapshotBridge(window)'));
 assert.ok(source.includes('installClubLocalStoreBridge(window)'));
 assert.ok(monolith.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(monolith.includes("const LIBRARY_STORAGE_KEY='volleyCoachLibraryV1';"));
 assert.ok(monolith.includes('vc1531WriteState(APP_STORAGE_KEY,raw)'));
 assert.ok(monolith.includes('guardarBibliotecaIndependiente(prepared)'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.77'));
 assert.ok(read('service-worker.js').includes('club-snapshot-20.5.62'));
});
