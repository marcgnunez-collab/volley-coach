'use strict';
/** Optional live-Chromium test. Real IndexedDB, actual V20.1.1 journal module,
 * two browser processes using one isolated profile; first is SIGKILLed after
 * the IndexedDB transaction commits. No Supabase credentials or app user data.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROMIUM=[process.env.VC_CHROMIUM,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome']
 .find(file=>file&&fs.existsSync(file));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fixtures={
 matchId:12345,account:'recovery-test-account',team:'cadete',
 match:{id:12345,status:'live',currentSet:1,servingTeam:'ours',rotationNo:1,opponentRotationNo:2,
  lineup:{ours:{p1:1},opponent:{p1:11}},baseLineup:{ours:{p1:1},opponent:{p1:11}},
  lineupRoles:{},libero:{},sets:[{number:1,scoreUs:8,scoreOpponent:7,rallies:[],finished:false}],
  liveRally:{id:87,actions:[{code:'PRIVATE-CODE'}]}}
};

class CDP{
 constructor(ws){
  this.ws=ws;this.id=0;this.waiting=new Map();
  ws.addEventListener('message',event=>{
   let payload;try{payload=JSON.parse(event.data);}catch(_){return;}
   if(!payload.id)return;
   const item=this.waiting.get(payload.id);if(!item)return;
   this.waiting.delete(payload.id);clearTimeout(item.timer);
   if(payload.error)item.reject(new Error(payload.error.message));
   else item.resolve(payload.result);
  });
 }
 send(method,params={},sessionId){
  const id=++this.id;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.waiting.delete(id);reject(Error('CDP timeout '+method));},12000);
   this.waiting.set(id,{resolve,reject,timer});
   this.ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
 }
 close(){this.ws.close();}
}
async function socket(url){
 const ws=new WebSocket(url);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Chrome websocket timeout')),10000);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Chrome websocket error'));},{once:true});
 });
 return new CDP(ws);
}
async function launch(profile,origin){
 const flags=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--disable-background-networking',
  '--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
 const processChild=spawn(CHROMIUM,flags,{detached:true,stdio:['ignore','ignore','pipe']});
 let stderr='';
 processChild.stderr.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-3000);});
 const portFile=path.join(profile,'DevToolsActivePort');
 let lines=null;
 for(let tries=0;tries<80;tries++){
  if(processChild.exitCode!==null)throw Error('Chrome exited before DevTools was available');
  try{const data=fs.readFileSync(portFile,'utf8').trim().split('\n');
   if(data.length>=2&&Number(data[0])>0){lines=data;break;}
  }catch(_){}
  await delay(100);
 }
 if(!lines){
  try{process.kill(-processChild.pid,'SIGKILL');}catch(_){}
  throw Error('Chrome did not expose DevToolsActivePort: '+stderr);
 }
 const cdp=await socket('ws://127.0.0.1:'+lines[0]+lines[1]);
 const {targetId}=await cdp.send('Target.createTarget',{url:origin+'/test-audit/vc20519-indexeddb-browser.html'});
 const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
 await cdp.send('Runtime.enable',{},sessionId);
 await delay(250);
 return {processChild,cdp,sessionId};
}
async function evaluate(browser,code){
 const payload=await browser.cdp.send('Runtime.evaluate',{
  expression:'(async()=>{'+code+'})()',
  awaitPromise:true,returnByValue:true
 },browser.sessionId);
 if(payload.exceptionDetails)throw Error('Browser JavaScript: '+JSON.stringify(payload.exceptionDetails));
 if(!payload.result||payload.result.type==='undefined')throw Error('Browser returned no result');
 return payload.result.value;
}
function killChrome(browser){
 if(!browser)return;
 try{browser.cdp.close();}catch(_){}
 try{process.kill(-browser.processChild.pid,'SIGKILL');}catch(_){}
}
async function serve(){
 const names={
  '/test-audit/vc20519-indexeddb-browser.html':'test-audit/vc20519-indexeddb-browser.html',
  '/210-vc2011-durable-sync-journal.js':'210-vc2011-durable-sync-journal.js',
  '/vc2055-domain-core.mjs':'vc2055-domain-core.mjs'
 };
 const server=http.createServer((req,res)=>{
  const name=names[new URL(req.url,'http://localhost').pathname];
  if(!name){res.writeHead(404);res.end('not found');return;}
  const file=path.join(ROOT,name);
  try{
   res.writeHead(200,{'Content-Type':name.endsWith('.mjs')?'text/javascript':
    name.endsWith('.js')?'application/javascript':'text/html','Cache-Control':'no-store'});
   res.end(fs.readFileSync(file));
  }catch(err){res.writeHead(500);res.end(String(err.message));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {server,origin:'http://127.0.0.1:'+server.address().port};
}

test('real IndexedDB checkpoint survives SIGKILL and a second Chromium process inspects it read-only',
 {skip:!CHROMIUM,timeout:80000},async t=>{
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'vc20519-idb-'));
  const httpServer=await serve();
  let first=null,second=null;
  try{
   const data=JSON.stringify(fixtures);
   try{first=await launch(profile,httpServer.origin);}
   catch(error){
    if(/socket\(\) failed: Operation not permitted|Operation not permitted.*socket/i.test(String(error.message))){
     t.skip('Chromium bloqueado por restricciones del entorno (socket EPERM); prueba real pendiente.');
     return;
    }
    throw error;
   }
   const staged=await evaluate(first,`
    const values=${data};
    const old=structuredClone(values.match),newer=structuredClone(old);
    newer.sets[0].scoreUs++;
    const journal=window.VC_SYNC_2011_JOURNAL;
    const result=await journal.prepare({accountId:values.account,revision:7,
     state:{equiposData:{[values.team]:{scoutingMatches:[old]}}},mode:'draft'});
    const {inspectJournalRecovery}=await import('/vc2055-domain-core.mjs');
    const inspection=await inspectJournalRecovery({journal,accountId:values.account,
     teamId:values.team,matchId:values.matchId,before:old,after:newer});
    return {result:!!result.id,status:inspection.status,pendingCount:inspection.pendingCount,
     allowed:inspection.autoResumeAllowed};
   `);
   assert.deepEqual(staged,{result:true,status:'checkpoint-before',pendingCount:1,allowed:false});
   // Simulates a sudden browser termination after the transaction completed.
   killChrome(first);first=null;
   await delay(600);
   second=await launch(profile,httpServer.origin);
   const recovered=await evaluate(second,`
    const values=${data};
    const old=structuredClone(values.match),newer=structuredClone(old);
    newer.sets[0].scoreUs++;
    const journal=window.VC_SYNC_2011_JOURNAL;
    const {inspectJournalRecovery}=await import('/vc2055-domain-core.mjs');
    const report=await inspectJournalRecovery({journal,accountId:values.account,
     teamId:values.team,matchId:values.matchId,before:old,after:newer});
    const info=await journal.inspect(values.account);
    let orphanProtection=false;
    try{await journal.guardCleanPull(values.account,false);}
    catch(error){orphanProtection=error.code==='VC2011_ORPHAN';}
    const pending=await journal.newest(values.account);
    return {status:report.status,pendingCount:info.pendingCount,
     orphanProtection,originalDraft:pending?.mode==='draft',
     allowed:report.autoResumeAllowed};
   `);
   assert.deepEqual(recovered,{status:'checkpoint-before',pendingCount:1,
    orphanProtection:true,originalDraft:true,allowed:false});
  }finally{
   killChrome(first);killChrome(second);
   await new Promise(resolve=>httpServer.server.close(resolve));
   await delay(300);
   fs.rmSync(profile,{recursive:true,force:true});
  }
 });
