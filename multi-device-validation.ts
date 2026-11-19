/* V20.5.21 · Native TypeScript replacement for read-only V20.1.2 diagnostics.
 * Exact report format and comparison semantics preserved from legacy module
 * 211; no CAS writes, point commands, IDs, tokens, player details or DOM.
 */
import {asRecord} from './model';

export const MULTI_DEVICE_VERSION='20.1.2' as const;
export const MULTI_DEVICE_SCHEMA='vc-multi-device-validation' as const;
const asText=(value:unknown)=>String(value??'').trim();
const posInt=(value:unknown)=>{
 const number=Number(value);return Number.isSafeInteger(number)&&number>=0?number:0;
};
const validStamp=(value:unknown)=>{
 const stamp=asText(value);
 return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(stamp)&&
  Number.isFinite(Date.parse(stamp))?stamp:'';
};

export interface MultiDeviceReport{
 schema:typeof MULTI_DEVICE_SCHEMA;
 version:typeof MULTI_DEVICE_VERSION;
 createdAt:string;
 connected:boolean;
 dirty:boolean;
 blocked:boolean;
 realtimeSubscribed:boolean;
 lastReadAt:number;
 lastWriteAt:number;
 lastReadErrorAt:number;
 lastObservedRemoteStamp:string;
 lastAppliedRemoteStamp:string;
 lastConfirmedWriteStamp:string;
 pendingJournal:number|null;
 journalError:boolean;
 warning:string;
}
export interface DeviceReportInput{
 readonly cloud?:unknown;
 readonly device?:unknown;
 readonly journal?:unknown;
 readonly now?:number;
}
export function reportDeviceValidation({cloud={},device={},journal={},now=Date.now()}:DeviceReportInput={}):MultiDeviceReport{
 const c=asRecord(cloud)||{},d=asRecord(device)||{},j=asRecord(journal)||{};
 return {schema:MULTI_DEVICE_SCHEMA,version:MULTI_DEVICE_VERSION,
  createdAt:new Date(now).toISOString(),
  connected:!!c.connected,dirty:!!c.dirty,blocked:!!c.blockedReason,
  realtimeSubscribed:d.realtimeState==='SUBSCRIBED',
  lastReadAt:posInt(c.lastReadAt),lastWriteAt:posInt(c.lastWriteAt),
  lastReadErrorAt:posInt(c.lastReadErrorAt),
  lastObservedRemoteStamp:validStamp(c.lastObservedRemoteStamp),
  lastAppliedRemoteStamp:validStamp(c.lastAppliedRemoteStamp),
  lastConfirmedWriteStamp:validStamp(c.lastConfirmedWriteStamp),
  pendingJournal:typeof j.pendingCount==='number'?posInt(j.pendingCount):null,
  journalError:!!j.lastError,
  warning:'Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo.'};
}

export function parseDeviceValidation(input:unknown):MultiDeviceReport{
 const raw=asRecord(typeof input==='string'?JSON.parse(input):input);
 if(!raw||raw.schema!==MULTI_DEVICE_SCHEMA||raw.version!==MULTI_DEVICE_VERSION)
  throw Error('Informe incompatible: deben ser diagnósticos V20.1.2.');
 if(!Number.isFinite(Date.parse(String(raw.createdAt))))throw Error('Informe sin fecha válida.');
 for(const key of ['connected','dirty','blocked','realtimeSubscribed'])
  if(typeof raw[key]!=='boolean')throw Error('Campo inválido: '+key);
 if(raw.pendingJournal!==null&&(!Number.isInteger(raw.pendingJournal)||Number(raw.pendingJournal)<0))
  throw Error('Diario inválido.');
 return reportDeviceValidation({cloud:raw,device:{realtimeState:raw.realtimeSubscribed?'SUBSCRIBED':''},
  journal:{pendingCount:raw.pendingJournal,lastError:raw.journalError},now:Date.parse(String(raw.createdAt))});
}

export interface DeviceComparison{
 readonly status:'review'|'matched'|'unproven';
 readonly message:string;
}
export function compareDeviceValidation(left:unknown,right:unknown):DeviceComparison{
 const lhs=parseDeviceValidation(left),rhs=parseDeviceValidation(right);
 const ready=(value:MultiDeviceReport)=>
  value.connected&&!value.dirty&&!value.blocked&&!value.journalError&&value.pendingJournal===0;
 if(!ready(lhs)||!ready(rhs))return {status:'review',
  message:'Alguno de los dispositivos tiene cambios pendientes, está bloqueado o no puede comprobar su diario. No se confirma una entrega.'};
 const hits:string[]=[];
 if(lhs.lastConfirmedWriteStamp&&lhs.lastConfirmedWriteStamp===rhs.lastAppliedRemoteStamp)
  hits.push('La versión subida por el primer dispositivo figura como procesada en el segundo.');
 if(rhs.lastConfirmedWriteStamp&&rhs.lastConfirmedWriteStamp===lhs.lastAppliedRemoteStamp)
  hits.push('La versión subida por el segundo dispositivo figura como procesada en el primero.');
 if(hits.length)return {status:'matched',message:hits.join(' ')+
  ' Comparación de marcas, no del contenido ni prueba de la versión más reciente.'};
 return {status:'unproven',
  message:'No hay una marca de subida de un dispositivo que coincida con una versión procesada en el otro. Realiza una edición de prueba y comprueba ambos informes.'};
}
