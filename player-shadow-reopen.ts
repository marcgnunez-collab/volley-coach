/* V20.5.70 · A same-tab, read-only reload durability probe for player entities.
 * The session ticket stores only metadata and a SHA-256 digest, never club JSON.
 * A successful graceful reload does NOT certify OS crash or power-loss durability.
 */
import {inspectPlayerShadow,planPlayerShadow,
 type PlayerShadowCheck} from './player-shadow';

export const PLAYER_REOPEN_TICKET_KEY='vc20570-player-reopen-once';
const TICKET_SCHEMA='vc-player-reopen-v1';
const MAX_AGE_MS=10*60*1000;
export const MAX_COLD_REOPEN_AGE_MS=24*60*60*1000;
type DigestPort=Pick<SubtleCrypto,'digest'>;
export interface PlayerReopenTicket{
 readonly schema:typeof TICKET_SCHEMA;readonly createdAt:number;
 readonly digest:string;readonly records:number;
}
export interface PlayerReopenResult{
 readonly status:'verified'|'missing'|'different'|'incomplete'|'expired'|'invalid';
 readonly readOnly:true;readonly authoritative:false;readonly records:number;
}
const report=(status:PlayerReopenResult['status'],records=0):PlayerReopenResult=>
 Object.freeze({status,readOnly:true,authoritative:false,records});

export async function digestOriginalClub(raw:string,subtle:DigestPort):Promise<string>{
 if(typeof raw!=='string'||raw.length>12000000||typeof subtle?.digest!=='function')
  throw Error('No se puede comprobar la huella de la copia');
 const bytes=await subtle.digest('SHA-256',new TextEncoder().encode(raw));
 return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}

export function parsePlayerReopenTicket(json:string,now:number,maxAgeMs=MAX_AGE_MS):
 {readonly status:'valid';readonly ticket:PlayerReopenTicket}|
 {readonly status:'invalid'|'expired'}{
 if(typeof json!=='string'||json.length>512||!Number.isSafeInteger(now)||
  !Number.isSafeInteger(maxAgeMs)||maxAgeMs<1||maxAgeMs>MAX_COLD_REOPEN_AGE_MS)
  return {status:'invalid'};
 let ticket:unknown;
 try{ticket=JSON.parse(json)}catch(_){return {status:'invalid'}}
 if(!ticket||typeof ticket!=='object')return {status:'invalid'};
 const t=ticket as Partial<PlayerReopenTicket>;
 if(t.schema!==TICKET_SCHEMA||!Number.isSafeInteger(t.createdAt)||
  !Number.isSafeInteger(t.records)||Number(t.records)<0||Number(t.records)>20000||
  typeof t.digest!=='string'||!/^[a-f0-9]{64}$/.test(t.digest))return {status:'invalid'};
 if(Number(t.createdAt)>now||now-Number(t.createdAt)>maxAgeMs)return {status:'expired'};
 return {status:'valid',ticket:t as PlayerReopenTicket};
}

/** Checked against a new readonly database connection before any ticket is written. */
export async function preparePlayerReopenTicket(input:{
 readonly raw:string;readonly factory:Pick<IDBFactory,'open'>;
 readonly subtle:DigestPort;readonly now:number;
}):Promise<string>{
 const plan=planPlayerShadow(input.raw,'reopen-preflight');
 const check:PlayerShadowCheck=await inspectPlayerShadow({factory:input.factory,plan});
 if(check.status!=='verified')throw Error('La copia de jugadores no coincide: '+check.status);
 const digest=await digestOriginalClub(input.raw,input.subtle);
 return JSON.stringify(Object.freeze({schema:TICKET_SCHEMA,createdAt:input.now,
  digest,records:check.records} satisfies PlayerReopenTicket));
}

/** Reconstruct a fresh plan from the unchanged original, then recheck IndexedDB. */
export async function verifyPlayerReopenTicket(input:{
 readonly ticket:string;readonly raw:string;readonly factory:Pick<IDBFactory,'open'>;
 readonly subtle:DigestPort;readonly now:number;readonly maxAgeMs?:number;
}):Promise<PlayerReopenResult>{
 const parsed=parsePlayerReopenTicket(input.ticket,input.now,input.maxAgeMs);
 if(parsed.status!=='valid')return report(parsed.status);
 const t=parsed.ticket;
 let plan;
 try{plan=planPlayerShadow(input.raw,'reopen-after-reload')}
 catch(_){return report('different')}
 if(!plan.complete)return report('incomplete');
 if(plan.rows.length!==t.records)return report('different');
 if(await digestOriginalClub(input.raw,input.subtle)!==t.digest)return report('different');
 const check=await inspectPlayerShadow({factory:input.factory,plan});
 return report(check.status==='verified'?'verified':check.status,check.records);
}
