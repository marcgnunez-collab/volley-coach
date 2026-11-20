/* V20.5.49 · Pure V6.9 identity/video and V6.10.0 opponent fields.
 * The phase is explicit: saved matches load once with V6.9 semantics, then
 * V6.10.0 activates the opponent field before its own normalization pass.
 */
export interface ScoutIdentityFields{
 uid:string;
 videoStart:number|null;
 videoAction:number|null;
 videoEnd:number|null;
 clipId:string;
 opponentPlayerUid?:string;
}

export function normalizeScoutingIdentityFields(input:unknown,normalized:unknown,opponentEnabled:boolean):ScoutIdentityFields{
 const a=input as Record<string,any>|null|undefined;
 const x=normalized as Record<string,any>;
 const fields:ScoutIdentityFields={
  uid:String(a?.uid||`act_${x.id}`),
  videoStart:a?.videoStart==null?null:Number(a.videoStart),
  videoAction:a?.videoAction==null?null:Number(a.videoAction),
  videoEnd:a?.videoEnd==null?null:Number(a.videoEnd),
  clipId:String(a?.clipId||'')
 };
 if(opponentEnabled)fields.opponentPlayerUid=String(a?.opponentPlayerUid||'');
 return fields;
}
