/* V20.5.43 · Pure final code builder extensions.
 * Historical execution order: block input -> V8.3 core -> block target ->
 * DV modifiers -> attack cone. Match writes, roster and video stay native.
 */
type ScoutCodeAction=Record<string,any>;
const TEMPO={Q:'Quick',U:'Super',T:'Fast',M:'Medium',H:'High',O:'Other'};
const SET_TYPE={F:'Front',C:'Centre',B:'Back',P:'Pipe',S:'Setter dump'};
function cleanToken(value:unknown,max=10):string{
 return String(value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,max);
}

/** A block uses the contact zone at both ends for the effective V8.3 builder. */
export function prepareScoutingCodeInput(action:unknown):ScoutCodeAction{
 const a=action as ScoutCodeAction;
 if(a?.skill!=='B')return a;
 const zone=String(a.startZone||a.contactZone||'');
 return {...a,startZone:zone,endZone:zone||''};
}

/** Applies all remaining V8.4 / V8.7 / V8.8 formatting in one pure pass. */
export function finishScoutingCode(base:string,action:unknown):string{
 const a=action as ScoutCodeAction;
 let code=base;
 if(a?.skill==='B'){
  const zone=String(a.startZone||a.contactZone||'');
  if(zone)code=code.replace(`.${zone}>${zone}`,`.${zone}`);
  if(a.blockTargetNumber)code+=`&${String(a.blockTargetNumber).replace(/\D/g,'').slice(0,3)}`;
 }
 const dvCode=a?.skill==='A'?a.attackCode:(a?.skill==='E'?a.setterCall:'');
 const tempo=a?.skill==='A'?a.attackTempo:(a?.skill==='E'?a.setTempo:'');
 if(dvCode)code+=`::${cleanToken(dvCode,6)}`;
 if(tempo&&(TEMPO as Record<string,string>)[tempo])code+=`~${tempo}`;
 if(a?.skillSubtype)code+=`%${cleanToken(a.skillSubtype,8)}`;
 if(a?.dvSetType&&(SET_TYPE as Record<string,string>)[a.dvSetType])code+=`|${a.dvSetType}`;
 if(a?.specialCode)code+=`?${cleanToken(a.specialCode,10)}`;
 if(a?.customCode)code+=`$${cleanToken(a.customCode,5)}`;
 if(a?.skill==='A'&&a?.endCone&&a?.startZone){
  const loc=`.${a.startZone}>C${a.endCone}`;
  const prefixRe=/^((?:R)?(?:\d+|P)(?:S|R|E|A|B|D|F|C)[#\+!\-\/=])/;
  if(!code.includes('>C'+a.endCone))code=code.replace(prefixRe,`$1${loc}`);
 }
 return code;
}
