'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const monolith=read('002-core-training-v150-monolithic.js');
const start=monolith.indexOf('/* V15.3.1 · Guardado local compacto');
const end=monolith.indexOf("const APP_STORAGE_KEY='volleyCoachStateV43';",start);
const source=monolith.slice(start,end);
const clone=value=>JSON.parse(JSON.stringify(value));
const PACK='VC-LZW16-1:';
const KEY='volleyCoachStateV43';

function makeStorage({maxChars=Infinity,error=null,badPackedRead=false}={}){
 const map=new Map(),writes=[],reads=[];
 return {map,writes,reads,
  getItem(key){reads.push(key);const stored=map.get(key)||null;
   if(badPackedRead&&stored?.startsWith(PACK))return stored.slice(0,-2);return stored},
  setItem(key,value){writes.push({key,value});
   if(error){const cause=new Error('PRIVATE-STORAGE');cause.name=error;throw cause}
   if(value.length>maxChars){const cause=new Error('PRIVATE-QUOTA');cause.name='QuotaExceededError';throw cause}
   map.set(key,value);
  }
 };
}
function harness(storage,{bridge}={}){
 const win={...(bridge?{VC_CLUB_LOCAL_STORE_20561:bridge}:{})};
 const context=vm.createContext({window:win,localStorage:storage,TextEncoder,TextDecoder,
  Uint8Array,Number,String,Date,JSON,Map,btoa,atob,console:{info:()=>{},warn:()=>{}}});
 vm.runInContext(source,context,{timeout:2500});
 const write=raw=>vm.runInContext(`vc1531WriteState(${JSON.stringify(KEY)},${JSON.stringify(raw)})`,context);
 const readState=()=>clone(vm.runInContext(`vc1531ReadState(localStorage.getItem(${JSON.stringify(KEY)}))`,context));
 return {win,storage,context,write,readState,
  mode:()=>win.VC_STORAGE_QUOTA_1531.getMode(),
  diag:()=>clone(win.VC_STORAGE_QUOTA_1531.diagnostics()),
  snapshot:()=>storage.map.get(KEY)||null};
}
const fixture=(times=1)=>JSON.stringify({version:5.8,
 bibliotecaCompartida:Array.from({length:times},(_,i)=>({id:i,ejercicio:'SAQUE Y RECEPCION '.repeat(25)})),
 equiposData:{infantil:{jugadores:[{id:7,nombre:'PRIVATE-PLAYER'}],
  historial:[{id:1,fecha:'2026-11-20'}],sesionActual:{ejercicios:[1,2]},
  scoutingMatches:[{id:55,sets:[{scoreUs:25,scoreOpponent:23,rallies:[{code:'PRIVATE-CODE'}]}]}],
  temporada:{competicion:'PRIVATE-LEAGUE'}},cadete:{jugadores:[]}}});

test('V20.5.61 installs one immutable local-state writer with the original codec contract',async()=>{
 const module=await compiled(),host={},bridge=module.installClubLocalStoreBridge(host);
 assert.equal(bridge.VERSION,'20.5.61');assert.equal(bridge.usesExistingKey,true);
 assert.equal(bridge.keepsNativeCodec,true);
 assert.strictEqual(module.installClubLocalStoreBridge(host),bridge);
 assert.strictEqual(host.VC_CLUB_LOCAL_STORE_20561,bridge);
 assert.strictEqual(bridge.write,module.writeClubLocalState);
 assert.ok(Object.isFrozen(bridge));
});

test('normal writes preserve the exact state bytes and never invoke the compressor',async()=>{
 const mod=await compiled(),storage=makeStorage(),raw=fixture(2);
 let packCalls=0;
 assert.equal(mod.writeClubLocalState({storage,key:KEY,raw,compactActive:false,
  pack:()=>{packCalls++;return PACK},unpack:()=>''}),'normal');
 assert.equal(storage.map.get(KEY),raw);assert.equal(storage.writes.length,1);
 assert.equal(packCalls,0);
});

test('native and typed paths save identical full club data in normal and quota-compressed modes',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({});
 for(const times of [1,2,6,20,50])for(const maxChars of [Infinity,1700,3800]){
  const raw=fixture(times),storageA=makeStorage({maxChars}),storageB=makeStorage({maxChars});
  const previous=harness(storageA),current=harness(storageB,{bridge});
  let originalOutcome,typedOutcome;
  try{originalOutcome=previous.write(raw)}catch(err){originalOutcome='ERROR:'+String(err.message)}
  try{typedOutcome=current.write(raw)}catch(err){typedOutcome='ERROR:'+String(err.message)}
  assert.equal(typedOutcome,originalOutcome,`mode ${times}/${maxChars}`);
  assert.equal(current.snapshot(),previous.snapshot(),`bytes ${times}/${maxChars}`);
  assert.equal(storageB.writes.length,storageA.writes.length,`writes ${times}/${maxChars}`);
  if(typedOutcome==='normal'||typedOutcome==='compacto'){
   assert.deepEqual(current.readState(),JSON.parse(raw));
   assert.equal(current.mode(),typedOutcome);
  }
 }
});

test('a previously compacted save remains compact across module activation and restart',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({});
 const storage=makeStorage({maxChars:1800}),raw=fixture(6);
 const first=harness(storage);assert.equal(first.write(raw),'compacto');
 assert.ok(storage.map.get(KEY).startsWith(PACK));
 const later=harness(storage,{bridge});
 assert.equal(later.write(raw),'compacto');
 assert.deepEqual(later.readState(),JSON.parse(raw));
 assert.equal(later.mode(),'compacto');
 assert.equal(later.diag().typedCompact,1);
 assert.equal(later.diag().nativeCompact,0);
});

test('compression errors do not replace a prior recoverable club snapshot',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({});
 const storage=makeStorage({maxChars:1}),current=harness(storage,{bridge});
 storage.map.set(KEY,'ORIGINAL-PRIVATE-STATE');
 assert.throws(()=>current.write('abc'),/No cabe el estado local ni comprimido/);
 assert.equal(current.snapshot(),'ORIGINAL-PRIVATE-STATE');
 assert.equal(current.diag().typedFailures,1);
 assert.equal(storage.writes.length,1,'normal attempt only; unsafe compact write declined');
 const storage2=makeStorage({maxChars:40}),other=harness(storage2,{bridge});
 const raw=fixture(8),old='ORIGINAL-PRIVATE-STATE';storage2.map.set(KEY,old);
 assert.throws(()=>other.write(raw),/Almacenamiento local lleno incluso en formato compacto/);
 assert.equal(other.snapshot(),old);
 assert.equal(other.diag().typedFailures,1);
});

test('unverified compressed round-trip and storage errors stop before any fallback write',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({});
 const storage=makeStorage({maxChars:250}),app=harness(storage,{bridge});
 storage.map.set(KEY,'ORIGINAL-PRIVATE-STATE');
 vm.runInContext("vc1531Unpack=()=> 'CORRUPT';",app.context);
 assert.throws(()=>app.write(fixture(5)),/integridad del estado comprimido/);
 assert.equal(storage.map.get(KEY),'ORIGINAL-PRIVATE-STATE');
 assert.equal(storage.writes.length,1);
 const denied=makeStorage({error:'SecurityError'}),restricted=harness(denied,{bridge});
 assert.throws(()=>restricted.write(fixture(2)),/PRIVATE-STORAGE/);
 assert.equal(denied.writes.length,1);
 assert.equal(restricted.diag().typedFailures,1);
});

test('a typed writer that fails after a write is NEVER followed by the native writer',()=>{
 const storage=makeStorage(),raw=fixture(1),bridge={VERSION:'20.5.61',usesExistingKey:true,
  keepsNativeCodec:true,write:({storage:target,key,value,raw:next})=>{
   target.setItem(key,next);throw Error('PRIVATE-AFTER-WRITE');
  }};
 const app=harness(storage,{bridge});
 assert.throws(()=>app.write(raw),/PRIVATE-AFTER-WRITE/);
 assert.equal(storage.writes.length,1);
 assert.equal(app.diag().typedFailures,1);
 assert.equal(app.diag().nativeNormal,0);
});

test('the V15.3.1 normal/compact APIs remain intact when Vite is absent',()=>{
 const storage=makeStorage(),app=harness(storage),raw=fixture(1);
 assert.equal(app.write(raw),'normal');
 assert.equal(app.mode(),'normal');
 assert.equal(typeof app.win.VC_STORAGE_QUOTA_1531.pack,'function');
 assert.equal(typeof app.win.VC_STORAGE_QUOTA_1531.unpack,'function');
 assert.equal(app.diag().nativeNormal,1);
 assert.equal(app.diag().typedNormal,0);
 assert.equal(app.diag().typedFailures,0);
 assert.equal(JSON.stringify(app.diag()).includes('PRIVATE'),false);
});

test('full-club serialization still covers players, training, scouting and season without modification',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({});
 const raw=fixture(4),expected=JSON.parse(raw),storage=makeStorage(),app=harness(storage,{bridge});
 assert.equal(app.write(raw),'normal');
 const saved=app.readState();
 assert.deepEqual(saved,expected);
 assert.equal(saved.equiposData.infantil.jugadores[0].nombre,'PRIVATE-PLAYER');
 assert.equal(saved.equiposData.infantil.scoutingMatches[0].sets[0].rallies[0].code,'PRIVATE-CODE');
 assert.equal(saved.equiposData.infantil.temporada.competicion,'PRIVATE-LEAGUE');
 assert.equal(saved.equiposData.infantil.sesionActual.ejercicios.length,2);
 const stats=app.diag();assert.equal(stats.typedNormal,1);
 assert.equal(JSON.stringify(stats).includes('PRIVATE'),false);
});

test('the real guardarEstadoLocalSinCloud path keeps library and active-team side effects',async()=>{
 const bridge=(await compiled()).installClubLocalStoreBridge({}),storage=makeStorage();
 const app=harness(storage,{bridge}),context=app.context;
 const active='volleyCoachActiveTeamV43';let librarySaves=0;
 Object.assign(context,{
  APP_STORAGE_KEY:KEY,ACTIVE_TEAM_KEY:active,equipoActivo:'infantil',
  baseDeDatos:[{id:8,title:'PRIVATE-EXERCISE'}],
  equiposData:{infantil:{jugadores:[{nombre:'PRIVATE-PLAYER'}],
   scoutingMatches:[{id:55,sets:[{scoreUs:25,scoreOpponent:21}]}],
   entrenamientos:[{fecha:'2026-11-20'}],temporada:{nombre:'PRIVATE-SEASON'}},
   cadete:{jugadores:[{nombre:'PRIVATE-CADET'}]}},
  clonar:clone,guardarBibliotecaIndependiente:()=>{librarySaves++}
 });
 const saveStart=monolith.indexOf('function guardarEstadoLocalSinCloud(){');
 const saveEnd=monolith.indexOf('function guardarEquipoEnMemoria(){',saveStart);
 vm.runInContext(monolith.slice(saveStart,saveEnd),context,{timeout:2500});
 vm.runInContext('guardarEstadoLocalSinCloud()',context,{timeout:2500});
 const state=JSON.parse(storage.map.get(KEY));
 assert.equal(state.version,5.8);
 assert.equal(state.equiposData.infantil.jugadores[0].nombre,'PRIVATE-PLAYER');
 assert.equal(state.equiposData.infantil.scoutingMatches[0].sets[0].scoreUs,25);
 assert.equal(state.equiposData.infantil.entrenamientos[0].fecha,'2026-11-20');
 assert.equal(state.equiposData.infantil.temporada.nombre,'PRIVATE-SEASON');
 assert.equal(state.equiposData.cadete.jugadores[0].nombre,'PRIVATE-CADET');
 assert.equal(state.bibliotecaCompartida[0].title,'PRIVATE-EXERCISE');
 assert.equal(storage.map.get(active),'infantil');
 assert.equal(librarySaves,1);
 assert.equal(app.diag().typedNormal,1);
 assert.equal(storage.writes.filter(row=>row.key===KEY).length,1);
});

test('release retains the original storage key, quota codec and Vite bridge',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.67');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20561-club-local-store-migration.test.cjs'));
 assert.ok(read('src/vc2055-entry.ts').includes('installClubLocalStoreBridge(window)'));
 assert.ok(monolith.includes("const APP_STORAGE_KEY='volleyCoachStateV43';"));
 assert.ok(monolith.includes("const VC1531_PACK_PREFIX='VC-LZW16-1:';"));
 assert.ok(monolith.includes('const mode=vc1531WriteState(APP_STORAGE_KEY,raw)'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.67'));
 assert.ok(sw.includes('club-local-store-20.5.61'));
});
