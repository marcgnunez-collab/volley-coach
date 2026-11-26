/* V20.5.74 · Manual training durability check after a browser restart.
 * The ticket stores a timestamp, SHA-256 and record count; no training data.
 * This does not prove that an OS crash or power-loss occurred, and never
 * authorizes writing to/replacing the canonical club storage.
 */
import {planTrainingShadow} from './training-shadow';
import {prepareTrainingShadowBackup} from './training-shadow-backup';
import {digestOriginalClub} from './player-shadow-reopen';

export const TRAINING_COLD_REOPEN_KEY='vc20574-training-cold-check-once';
const SCHEMA='vc-training-cold-v1';
const MAX_AGE_MS=24*60*60*1000;
interface Ticket{readonly schema:typeof SCHEMA;readonly createdAt:number;
 readonly digest:string;readonly records:number}
export interface TrainingColdResult{
 readonly status:'verified'|'missing'|'different'|'incomplete'|'incompatible'|'expired'|'invalid';
 readonly readOnly:true;readonly authoritative:false;readonly records:number;
}
interface Input{readonly raw:string;readonly factory:Pick<IDBFactory,'open'>;
 readonly subtle:Pick<SubtleCrypto,'digest'>;readonly now:number}
const report=(status:TrainingColdResult['status'],records=0):TrainingColdResult=>
 Object.freeze({status,records,readOnly:true,authoritative:false});

export function parseTrainingColdTicket(raw:unknown,now:number):
 {readonly status:'valid';readonly ticket:Ticket}|
 {readonly status:'invalid'|'expired'}{
 if(typeof raw!=='string'||raw.length>512||!Number.isSafeInteger(now))return {status:'invalid'};
 let data:unknown;
 try{data=JSON.parse(raw)}catch(_){return {status:'invalid'}}
 if(!data||typeof data!=='object'||Array.isArray(data))return {status:'invalid'};
 const ticket=data as Partial<Ticket>;
 if(ticket.schema!==SCHEMA||!Number.isSafeInteger(ticket.createdAt)||
  !Number.isSafeInteger(ticket.records)||Number(ticket.records)<0||Number(ticket.records)>20000||
  typeof ticket.digest!=='string'||!/^[a-f0-9]{64}$/.test(ticket.digest))
  return {status:'invalid'};
 if(Number(ticket.createdAt)>now||now-Number(ticket.createdAt)>MAX_AGE_MS)
  return {status:'expired'};
 return {status:'valid',ticket:ticket as Ticket};
}

/** Strictly reconstructs, compares and discards the backup before issuing the ticket. */
export async function prepareTrainingColdReopen(input:Input):Promise<string>{
 if(!Number.isSafeInteger(input.now))throw Error('Fecha de comprobación inválida');
 const plan=planTrainingShadow(input.raw,'training-cold-prepare');
 const verified=await prepareTrainingShadowBackup({factory:input.factory,plan,
  originalRaw:input.raw});
 if(verified.status!=='ready')throw Error('Réplica de entrenamientos sin verificar: '+verified.status);
 const digest=await digestOriginalClub(input.raw,input.subtle);
 return JSON.stringify({schema:SCHEMA,createdAt:input.now,digest,
  records:verified.records} satisfies Ticket);
}

/** Independently opens IndexedDB in read-only mode and compares the current original. */
export async function verifyTrainingColdReopen(input:Input&{
 readonly ticket:string;
}):Promise<TrainingColdResult>{
 const parsed=parseTrainingColdTicket(input.ticket,input.now);
 if(parsed.status!=='valid')return report(parsed.status);
 let plan;
 try{plan=planTrainingShadow(input.raw,'training-cold-verify')}
 catch(_){return report('different')}
 if(!plan.complete)return report('incomplete');
 if(plan.rows.length!==parsed.ticket.records)return report('different');
 if(await digestOriginalClub(input.raw,input.subtle)!==parsed.ticket.digest)
  return report('different');
 const checked=await prepareTrainingShadowBackup({factory:input.factory,
  plan,originalRaw:input.raw});
 return report(checked.status==='ready'?'verified':checked.status,checked.records);
}
