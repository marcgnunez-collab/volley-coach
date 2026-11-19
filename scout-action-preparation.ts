/* V20.5.36 · A narrow preparation boundary around the EXISTING native parser.
 * This adapter returns the exact native result object, never a clone, and
 * only publishes anonymous metadata for comparing historical behavior.
 */

export interface PreparedActionFacts{
 readonly parserReturnedAction:boolean;
 readonly parserReturnedError:boolean;
 readonly propertyCount:number;
 readonly hasTeam:boolean;
 readonly hasSkill:boolean;
 readonly hasEvaluation:boolean;
 readonly hasPlayer:boolean;
 readonly hasZones:boolean;
 readonly hasTacticalMetadata:boolean;
 readonly hasVideoEvidence:boolean;
}

export interface NativePreparationEnvelope<T>{
 readonly mode:'native-once';
 readonly nativeResult:T;
 readonly facts:Readonly<PreparedActionFacts>;
}
export type NativeScoutingParser<T>=(raw:string,match:unknown,oldAction:null)=>T;

const blank=():PreparedActionFacts=>({parserReturnedAction:false,parserReturnedError:false,
 propertyCount:0,hasTeam:false,hasSkill:false,hasEvaluation:false,hasPlayer:false,
 hasZones:false,hasTacticalMetadata:false,hasVideoEvidence:false});
const record=(input:unknown):Record<string,unknown>|null=>
 input&&typeof input==='object'?input as Record<string,unknown>:null;

/** Anonymous, non-blocking assessment. Invalid/unusual actions stay native-owned. */
export function inspectNativePreparation(nativeResult:unknown):Readonly<PreparedActionFacts>{
 try{
  const parsed=record(nativeResult),action=record(parsed?.action);
  if(!action)return Object.freeze({...blank(),parserReturnedError:!!parsed?.error});
  const present=(value:unknown)=>value!==undefined&&value!==null&&value!=='';
  return Object.freeze({
   parserReturnedAction:true,parserReturnedError:!!parsed?.error,
   propertyCount:Object.keys(action).length,
   hasTeam:present(action.team),hasSkill:present(action.skill),
   hasEvaluation:present(action.evaluation),
   hasPlayer:present(action.playerId)||present(action.playerNumberSnapshot)||present(action.playerLabel),
   hasZones:present(action.startZone)||present(action.endZone)||present(action.contactZone)||present(action.endCone),
   hasTacticalMetadata:['serveType','phase','setTarget','attackCombo','attackDirection',
    'attackTempo','blockers','setterCall','attackCode','dvSetType','skillSubtype'].some(key=>present(action[key])),
   hasVideoEvidence:['scoutMs','videoTime','videoExactTime','videoSourceKey','videoSource',
    'videoExactSourceKey','clipId'].some(key=>present(action[key]))
  });
 }catch(_){return Object.freeze(blank());}
}

/** Sole native parser call; the result is passed through by strict identity. */
export function prepareNativeScoutingAction<T>(
 raw:string,match:unknown,parseNative:NativeScoutingParser<T>):Readonly<NativePreparationEnvelope<T>>{
 const nativeResult=parseNative(raw,match,null);
 return Object.freeze({mode:'native-once',nativeResult,facts:inspectNativePreparation(nativeResult)});
}
