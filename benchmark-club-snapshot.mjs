/* Synthetic-only baseline for measuring serialization costs. Never touches club data. */
import {performance} from 'node:perf_hooks';
import {serializeClubSnapshot,serializeClubIndependentLibrary} from '../vc2055-domain-core.mjs';

const requested=Number(process.argv.find(v=>v.startsWith('--rallies='))?.slice(10)||10000);
if(!Number.isSafeInteger(requested)||requested<100||requested>50000)
 throw Error('Utiliza --rallies= entre 100 y 50000');
const clone=value=>JSON.parse(JSON.stringify(value));
const iso='2026-11-22T19:00:00.000Z';
const library=Array.from({length:150},(_,i)=>({id:i,title:`Ejercicio ${i}`,
 notes:`Recepción y ataque ${i}`.repeat(8),zones:[1,2,3,4,5,6]}));
const rallies=Array.from({length:requested},(_,i)=>({id:i,team:i%2?'home':'away',
  rotation:i%6+1,score:[i%25,(i+5)%25],contactCodes:['*12S#','.04R+','*10A#'],
  videoTime:i*1.4,metadata:{set:Math.floor(i/100)+1,sequence:i%15}}));
const teams={infantil:{jugadores:[{name:'Ficticio',number:12}],scoutingMatches:[{rallies}],
  historial:Array.from({length:50},(_,i)=>({id:i,exercises:[i,i+1]}))},cadete:{jugadores:[]}};
const input={bibliotecaCompartida:library,equiposData:teams,updatedAt:iso};
function native(){
 const raw=JSON.stringify({version:5.8,bibliotecaCompartida:clone(library),
  bibliotecaVersion:1,bibliotecaUpdatedAt:iso,equiposData:clone(teams)});
 const backup=JSON.stringify({version:1,updatedAt:iso,total:library.length,
  ejercicios:clone(library)});
 return {raw,backup};
}
function typed(){
 const snap=serializeClubSnapshot(input);
 return {raw:snap.raw,backup:serializeClubIndependentLibrary({
  snapshot:snap,updatedAt:iso,total:library.length})};
}
function sample(fn){const times=[];for(let i=0;i<7;i++){
 const start=performance.now();fn();times.push(performance.now()-start);
 }return times.sort((a,b)=>a-b)[3]}
const prior=native(),current=typed();
if(prior.raw!==current.raw||prior.backup!==current.backup)
 throw Error('ERROR: Paridad de guardado no verificada');
sample(native);sample(typed);
const oldMs=sample(native),newMs=sample(typed);
console.log(JSON.stringify({synthetic:true,rallies:requested,parity:'byte-identical',
  stateBytes:current.raw.length,backupBytes:current.backup.length,
  nativeMedianMs:Number(oldMs.toFixed(2)),typedMedianMs:Number(newMs.toFixed(2)),
  speedup:Number((oldMs/newMs).toFixed(2))},null,2));
