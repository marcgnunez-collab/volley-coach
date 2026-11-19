/* V20.5.38 · Pure selectors for historical scouting parser extensions.
 * No match, player, rally, video, point or cloud objects are read here.
 */
export type SubzoneLexeme=Readonly<{kind:'pass'}>|Readonly<{
 kind:'subzone';cleaned:string;startZone:string;endZone:string;
}>;
export type ConeLexeme=Readonly<{kind:'pass'}>|Readonly<{
 kind:'cone';cleaned:string;startZone:string;endCone:number;
}>;
export type AdvancedLexeme=Readonly<{
 kind:'advanced';cleaned:string;skill:string;dvCode:string;tempo:string;
 subtype:string;setType:string;special:string;custom:string;
}>;

const clean=(raw:unknown)=>String(raw||'').trim().toUpperCase().replace(/\s+/g,'');
const SUBZONES=/^((?:R)?\d+(?:S|R|E|A|B|D|F|C)(?:[#\+!\-\/=])?)\.([1-9])([A-D]?)(?:>([1-9])([A-D]?))?(.*)$/;
const CONES=/^((?:R)?\d+A[#\+!\-\/=]?)\.([1-9][A-D]?)>C([1-8])(.*)$/;
const VALID_COMBOS=['Z4','Z2','Z1','Z6','1T','31','BACK','PIPE','2T','OTR'];

export function scanSubzoneExtension(input:unknown):SubzoneLexeme{
 const zm=clean(input).match(SUBZONES);
 if(!zm||(!zm[3]&&!zm[5]))return {kind:'pass'};
 const prefix=zm[1],z1=zm[2],s1=zm[3]||'',z2=zm[4]||'',s2=zm[5]||'',rest=zm[6]||'';
 return {kind:'subzone',cleaned:prefix+'.'+z1+(z2?('>'+z2):'')+rest,
  startZone:z1+s1,endZone:z2?(z2+s2):''};
}

export function scanConeExtension(input:unknown):ConeLexeme{
 const cm=clean(input).match(CONES);
 if(!cm)return {kind:'pass'};
 return {kind:'cone',cleaned:cm[1]+cm[4],startZone:cm[2],endCone:Number(cm[3])};
}

export function scanAdvancedExtension(input:unknown):AdvancedLexeme{
 const original=clean(input);
 const skill=original.match(/^(?:R)?\d+(S|R|E|A|B|D|F|C)/)?.[1]||'';
 let cleaned=original;
 let dvCode=cleaned.match(/::([A-Z0-9]{1,6})/)?.[1]||'';
 cleaned=cleaned.replace(/::[A-Z0-9]{1,6}/,'');
 if(!dvCode&&(skill==='A'||skill==='E')){
  const single=cleaned.match(/:([A-Z0-9]{1,6})/)?.[1]||'';
  if(single&&!VALID_COMBOS.includes(single)){
   dvCode=single;cleaned=cleaned.replace(':'+single,'');
  }
 }
 let tempo='';
 if(skill==='A'||skill==='E'){
  tempo=cleaned.match(/~([QUTMHO])/)?.[1]||'';
  if(tempo)cleaned=cleaned.replace(/~[QUTMHO]/,'');
 }
 const subtype=cleaned.match(/%([A-Z0-9]{1,8})/)?.[1]||'';
 if(subtype)cleaned=cleaned.replace(/%[A-Z0-9]{1,8}/,'');
 const setType=cleaned.match(/\|([FCBPS])/)?.[1]||'';
 if(setType)cleaned=cleaned.replace(/\|[FCBPS]/,'');
 const special=cleaned.match(/\?([A-Z0-9]{1,10})/)?.[1]||'';
 if(special)cleaned=cleaned.replace(/\?[A-Z0-9]{1,10}/,'');
 const custom=cleaned.match(/\$([A-Z0-9]{1,5})/)?.[1]||'';
 if(custom)cleaned=cleaned.replace(/\$[A-Z0-9]{1,5}/,'');
 return {kind:'advanced',cleaned,skill,dvCode,tempo,subtype,setType,special,custom};
}
