/* V20.5.44 · Pure R/D contact-zone preparation before the ONLY native writer.
 * Inference from previous plays and any state mutation remain in the original
 * live scouting engine. No match, player, video or cloud dependencies here.
 */
export interface ContactRegistrationFields{
 readonly startZone:string;
 readonly endZone:string;
 readonly contactZone:unknown;
 readonly sourceZone:unknown;
 readonly zoneInferred:false;
}

/** Equivalent to V6.10.8 zone preparation, including explicit source overrides. */
export function prepareContactRegistration(action:unknown):ContactRegistrationFields{
 const a=action as Record<string,unknown>;
 const start=String(a.startZone||'');
 const end=String(a.endZone||a.contactZone||'');
 let zones:{startZone:string;endZone:string;contactZone:string;sourceZone:string;zoneInferred:false};
 if(start&&end){
  zones={startZone:start,endZone:end,contactZone:end,sourceZone:start,zoneInferred:false};
 }else{
  const contact=end||start;
  zones={startZone:'',endZone:contact,contactZone:contact,sourceZone:'',zoneInferred:false};
 }
 return {...zones,contactZone:a.contactZone||zones.contactZone,
  sourceZone:a.sourceZone||zones.sourceZone};
}
