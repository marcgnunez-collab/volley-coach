/* V20.6.4 · Safe production-readiness snapshot. No network, storage or writes.
 * Availability is not success: cloud presence and live recording are separate. */
import {asRecord} from '../domain/model';
import {readCanonicalMatch,type CanonicalMatchWindow} from './match-state-contract';
import type {BootstrapWindow} from './bootstrap-coordinator';
import type {SharedMatchContextWindow} from './shared-match-context-runtime';

export interface RuntimeHealthReport{
 readonly version:'20.6.4';
 readonly readOnly:true;
 readonly overall:'ready'|'attention'|'waiting'|'blocked';
 readonly bootstrap:'ready'|'waiting'|'failed'|'unavailable';
 readonly scouting:Readonly<{
  active:boolean;
  matchSourcesAgree:boolean|null;
  setSourcesAgree:boolean|null;
 }>;
 readonly video:Readonly<{
  moduleAvailable:boolean;
  liveDelayRunning:boolean|null;
 }>;
 readonly sync:Readonly<{
  deviceModuleAvailable:boolean;
  cloudConnected:boolean|null;
  realtimeSubscribed:boolean|null;
  otherDevices:number|null;
  journalAvailable:boolean;
 }>;
 readonly warnings:readonly string[];
}
type Reader=Record<string,unknown>&{
 getActive?:()=>unknown;
 getCurrentSet?:(match:unknown)=>unknown;
};
type Device=Record<string,unknown>&{diagnostics?:()=>unknown};
export type RuntimeHealthWindow=CanonicalMatchWindow&BootstrapWindow&SharedMatchContextWindow&{
 VC_DEVICE_SYNC?:Device;
 VC_SYNC_2011_JOURNAL?:{inspect?:(account:string)=>unknown};
 liveDelayDiagnostics?:()=>unknown;
};

const caught=<T>(read:()=>T):{ok:true;value:T}|{ok:false}=>{
 try{return {ok:true,value:read()}}catch(_){return {ok:false}}
};
const isPresent=(value:unknown)=>typeof value==='function';

/** Does not expose account IDs, scores, players, raw diagnostics or device names. */
export function inspectRuntimeHealth(win:RuntimeHealthWindow):Readonly<RuntimeHealthReport>{
 const boot=caught(()=>win.VC_APP_BOOTSTRAP_2063?.diagnostics?.().phase);
 const bootstrap=boot.ok&&boot.value==='ready'?'ready':boot.ok&&boot.value==='failed'?'failed':
  boot.ok&&boot.value?'waiting':'unavailable';
 const match=readCanonicalMatch(win),videoReader=win.VC_SCOUT_VIDEO_BRIDGE as Reader|undefined;
 const videoMatch=videoReader?caught(()=>isPresent(videoReader.getActive)?
  asRecord(videoReader.getActive?.()):null):null;
 const matchSourcesAgree=match&&videoMatch?.ok&&videoMatch.value?match===videoMatch.value:null;
 const context=win.VC_MATCH_CONTEXT_2061;
 const sharedSet=match&&context?.VERSION==='20.6.1'&&context.readOnly===true?
  caught(()=>isPresent(context.getSet)?context.getSet(match):null):null;
 const nativeSet=match&&videoReader?
  caught(()=>isPresent(videoReader.getCurrentSet)?asRecord(videoReader.getCurrentSet?.(match)):null):null;
 const setSourcesAgree=sharedSet?.ok&&nativeSet?.ok&&sharedSet.value&&nativeSet.value?
  sharedSet.value===nativeSet.value:null;

 const live=caught(()=>win.liveDelayDiagnostics?.());
 const liveRow=live.ok?asRecord(live.value):null;
 const running=typeof liveRow?.running==='boolean'?liveRow.running:null;
 const device=win.VC_DEVICE_SYNC;
 const rawDevice=device?caught(()=>isPresent(device.diagnostics)?device.diagnostics?.():null):null;
 const info=rawDevice?.ok?asRecord(rawDevice.value):null;
 const cloudConnected=typeof info?.cloudConnected==='boolean'?info.cloudConnected:null;
 const realtimeSubscribed=typeof info?.realtimeState==='string'?info.realtimeState==='SUBSCRIBED':null;
 const peers=info?.liveOtherDeviceCount;
 const otherDevices=cloudConnected===true&&realtimeSubscribed===true&&
  typeof peers==='number'&&Number.isSafeInteger(peers)&&peers>=0?peers:null;
 const journal=caught(()=>isPresent(win.VC_SYNC_2011_JOURNAL?.inspect));

 const warnings:string[]=[];
 if(bootstrap==='failed')warnings.push('El arranque del módulo TypeScript no ha finalizado.');
 if(matchSourcesAgree===false)warnings.push('Los lectores de Scouting señalan partidos diferentes.');
 if(setSourcesAgree===false)warnings.push('Los lectores de vídeo y Scouting señalan sets diferentes.');
 if(videoMatch&&!videoMatch.ok)warnings.push('No ha sido posible consultar el lector nativo de vídeo.');
 if(nativeSet&&!nativeSet.ok)warnings.push('No ha sido posible consultar el set del vídeo.');
 if(rawDevice&&!rawDevice.ok)warnings.push('No ha sido posible consultar el estado de sincronización.');
 if(!journal.ok)warnings.push('No ha sido posible comprobar la disponibilidad del diario local.');
 if(bootstrap==='ready'&&!videoReader)warnings.push('El módulo nativo de vídeo no está disponible.');
 if(bootstrap==='ready'&&!device)warnings.push('El módulo de sincronización no está disponible.');
 // Offline is an observed connection state, not an application corruption.
 const overall=bootstrap==='failed'?'blocked':bootstrap!=='ready'?'waiting':
  warnings.length?'attention':'ready';
 return Object.freeze({
  version:'20.6.4' as const,readOnly:true as const,overall,bootstrap,
  scouting:Object.freeze({active:!!match,matchSourcesAgree,setSourcesAgree}),
  video:Object.freeze({moduleAvailable:!!videoReader,liveDelayRunning:running}),
  sync:Object.freeze({deviceModuleAvailable:!!device,cloudConnected,realtimeSubscribed,
   otherDevices,journalAvailable:journal.ok&&journal.value}),
  warnings:Object.freeze(warnings)
 });
}
