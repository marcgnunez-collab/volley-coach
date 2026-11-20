/* V20.5.54 · Pure projection of historical V6.10.2 match finalization fields.
 * No saved state, video, scorer or cloud mutation belongs in this module.
 */
export interface ScoutMatchFinalizationFields{
 manualSavedAt:string|null;
 reopenedAt:string|null;
 finalizedByUser:boolean;
 resultComplete:boolean;
 resultCompleteAt:string|null;
}

export function normalizeMatchFinalizationFields(input:unknown):ScoutMatchFinalizationFields{
 const m=input as Record<string,any>|null|undefined;
 return {
  manualSavedAt:m?.manualSavedAt?String(m.manualSavedAt):null,
  reopenedAt:m?.reopenedAt?String(m.reopenedAt):null,
  finalizedByUser:!!m?.finalizedByUser,
  resultComplete:!!m?.resultComplete,
  resultCompleteAt:m?.resultCompleteAt?String(m.resultCompleteAt):null
 };
}
