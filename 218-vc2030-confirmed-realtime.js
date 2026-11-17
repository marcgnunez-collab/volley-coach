/* Volley Coach V20.3.0 — confirmed Realtime protocol.
 * This module contains protocol rules only: no data writes, no blind merges,
 * no database migration. Durable CAS in v962 remains the only cloud writer.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC2030_SYNC_PROTOCOL=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='20.3.0',MAX_RECEIPTS=40;
 const str=v=>String(v??'').trim();
 const stampMs=stamp=>{
  const value=str(stamp);
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value))return NaN;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:NaN;
 };
 function createCommit({deviceId,userId,stamp,revision=0,reason='',commitId='',createdAt=Date.now()}={}){
  if(!str(deviceId)||!str(userId)||!Number.isFinite(stampMs(stamp)))return null;
  if(!/^[a-zA-Z0-9_-]{8,128}$/.test(str(commitId)))return null;
  return {version:VERSION,deviceId:str(deviceId),userId:str(userId),stamp:str(stamp),
   revision:Math.max(0,Math.trunc(Number(revision)||0)),reason:str(reason).slice(0,50),
   commitId:str(commitId),createdAt:Number(createdAt)||Date.now()};
 }
 function validRemoteCommit(p,{accountId='',selfDeviceId=''}={}){
  if(!p||p.version!==VERSION||!str(accountId)||str(p.userId)!==str(accountId))return false;
  if(!str(p.deviceId)||str(p.deviceId)===str(selfDeviceId))return false;
  return !!createCommit(p);
 }
 function canAcknowledge(commit,cloud={},accountId='',selfDeviceId=''){
  if(!validRemoteCommit(commit,{accountId,selfDeviceId}))return false;
  if(!cloud.connected||str(cloud.lastAppliedAccountId)!==str(accountId)||
    cloud.dirty||cloud.syncing||cloud.lastSyncError||cloud.blockedReason)return false;
  const applied=stampMs(cloud.lastAppliedRemoteStamp),requested=stampMs(commit.stamp);
  // Confirm the exact CAS version. A later version could have involved a
  // manual conflict choice, so its greater timestamp is NOT proof that the
  // original commit's data survived.
  return Number.isFinite(applied)&&Number.isFinite(requested)&&
    applied===requested&&str(cloud.lastAppliedRemoteStamp)===str(commit.stamp);
 }
 function createReceipt(commit,{accountId='',deviceId='',cloud={}}={}){
  if(!canAcknowledge(commit,cloud,accountId,deviceId))return null;
  return {version:VERSION,userId:str(accountId),commitId:str(commit.commitId),
   targetDeviceId:str(commit.deviceId),receivedBy:str(deviceId),
   appliedStamp:str(cloud.lastAppliedRemoteStamp),receivedAt:Date.now()};
 }
 function validateReceipt(receipt,{accountId='',deviceId='',commit=null}={}){
  if(!receipt||receipt.version!==VERSION||str(receipt.userId)!==str(accountId)||
    str(receipt.targetDeviceId)!==str(deviceId)||!commit||
    str(commit.userId)!==str(accountId)||
    str(receipt.commitId)!==str(commit.commitId)||
    !str(receipt.receivedBy)||str(receipt.receivedBy)===str(deviceId))return false;
  const applied=stampMs(receipt.appliedStamp),expected=stampMs(commit.stamp);
  return Number.isFinite(applied)&&Number.isFinite(expected)&&
    applied===expected&&str(receipt.appliedStamp)===str(commit.stamp);
 }
 function onlinePeers(peers,selfId){
  const seen=new Map();
  for(const p of Array.isArray(peers)?peers:[]){
   const key=str(p?.deviceId);
   if(!key||key===str(selfId))continue;
   seen.set(key,{deviceId:key,name:str(p.name)||'Otro dispositivo',type:str(p.type),view:str(p.view)});
  }
  return [...seen.values()];
 }
 function rememberBounded(map,key,value,limit=MAX_RECEIPTS){
  if(!key)return map;
  if(map.has(key))map.delete(key);
  map.set(key,value);
  while(map.size>limit)map.delete(map.keys().next().value);
  return map;
 }
 return Object.freeze({VERSION,MAX_RECEIPTS,createCommit,validRemoteCommit,canAcknowledge,
  createReceipt,validateReceipt,onlinePeers,rememberBounded});
});
