/* V20.5.71 · Manual cold-restart evidence: one metadata-only localStorage token.
 * This cannot prove that a browser process was actually force-terminated.
 * Never use this evidence as permission to replace the canonical club writer.
 */
import {preparePlayerReopenTicket,verifyPlayerReopenTicket,
 MAX_COLD_REOPEN_AGE_MS,type PlayerReopenResult} from './player-shadow-reopen';

export const PLAYER_COLD_REOPEN_KEY='vc20571-player-cold-check-once';
type ColdInput={readonly raw:string;readonly factory:Pick<IDBFactory,'open'>;
 readonly subtle:Pick<SubtleCrypto,'digest'>;readonly now:number};

/** The original save and player mirror must match before storing the ticket. */
export const preparePlayerColdReopen=(input:ColdInput):Promise<string>=>
 preparePlayerReopenTicket(input);

/** One verification uses the same strict read-only check as graceful reload. */
export const verifyPlayerColdReopen=(input:ColdInput&{
 readonly ticket:string;
}):Promise<PlayerReopenResult>=>verifyPlayerReopenTicket({
 ...input,maxAgeMs:MAX_COLD_REOPEN_AGE_MS
});
