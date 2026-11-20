/* V20.5.58 · Classify only the outcome reported by the ORIGINAL local writer.
 * No state snapshots, storage reads, additional writes or cloud assumptions.
 */
export type LocalSavePath='full-flush'|'legacy-backup'|'unavailable';
export type LocalSaveState='completed'|'pending'|'failed'|'unverified';
export type JournalEvidence='issue-observed'|'not-confirmed';
export interface LocalSaveObservation{
 readonly path:LocalSavePath;
 readonly outcome?:unknown;
 readonly error?:boolean;
 readonly journalFailuresBefore?:unknown;
 readonly journalFailuresAfter?:unknown;
}
export interface LocalSaveReceipt{
 readonly version:'20.5.58';
 readonly local:LocalSaveState;
 readonly journal:JournalEvidence;
 readonly cloud:'not-confirmed';
 readonly source:LocalSavePath;
}
const validFailures=(value:unknown):number|null=>
 typeof value==='number'&&Number.isInteger(value)&&value>=0?value:null;

/** `completed` proves only that the synchronous primary write returned normally.
 * It does not prove IndexedDB journal completion, disk durability or cloud delivery.
 */
export function classifyLocalSaveReceipt(input:LocalSaveObservation):Readonly<LocalSaveReceipt>{
 const path=input?.path==='full-flush'||input?.path==='legacy-backup'?input.path:'unavailable';
 const local:LocalSaveState=input?.error===true?'failed':
  path==='full-flush'&&input.outcome===true?'completed':
  path==='full-flush'&&input.outcome===false?'pending':'unverified';
 const before=validFailures(input?.journalFailuresBefore);
 const after=validFailures(input?.journalFailuresAfter);
 const journal:JournalEvidence=before!==null&&after!==null&&after>before?
  'issue-observed':'not-confirmed';
 return Object.freeze({version:'20.5.58',local,journal,cloud:'not-confirmed',source:path});
}
