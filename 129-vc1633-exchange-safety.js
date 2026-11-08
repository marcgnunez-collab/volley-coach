/* Volley Coach V16.3.3 — exchange data safety. Pure, testable helpers. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.document&&!root.VC_EXCHANGE_SAFETY_1633)root.VC_EXCHANGE_SAFETY_1633=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='16.3.3';
 const MAX_MATCHES=250, MAX_CODES=5000;
 const copy=v=>JSON.parse(JSON.stringify(v));
 const ignore=new Set(['updatedAt','lastViewedAt','manualSavedAt','cloudUpdatedAt','remoteUpdatedAt','lastOpenAt','importedAt','importOriginalId']);
 function canonical(v){
  if(Array.isArray(v))return v.map(canonical);
  if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).filter(k=>!ignore.has(k)&&v[k]!==undefined).sort().map(k=>[k,canonical(v[k])]));
  return v;
 }
 function sameMatch(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))}
 function validMatch(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  if(!Number.isSafeInteger(Number(raw.id))||Number(raw.id)<=0)return false;
  if(!Array.isArray(raw.sets))return false;
  if(raw.sets.length>30)return false;
  return raw.sets.every(s=>s&&typeof s==='object'&&!Array.isArray(s)&&(!('rallies' in s)||Array.isArray(s.rallies))&&(!Array.isArray(s.rallies)||s.rallies.every(r=>r&&typeof r==='object'&&!Array.isArray(r)&&(!('actions' in r)||Array.isArray(r.actions)))));
 }
 function planImport(incoming,existing,opts={}){
  if(!Array.isArray(incoming)||!Array.isArray(existing))throw Error('La estructura de scoutings no es válida.');
  if(incoming.length<1||incoming.length>MAX_MATCHES)throw Error(`El archivo debe contener entre 1 y ${MAX_MATCHES} scoutings.`);
  const normalized=[],ids=new Set();
  for(const m of incoming){
   if(!validMatch(m))throw Error('Se ha encontrado un scouting con identificador o sets no válidos. No se importará parcialmente.');
   const id=String(Number(m.id));if(ids.has(id))throw Error(`El archivo contiene IDs duplicados: ${id}.`);ids.add(id);
   let val=copy(m);
   if(typeof opts.normalize==='function')val=opts.normalize(val);
   if(!validMatch(val))throw Error(`La normalización de ${id} produjo un formato no válido.`);
   normalized.push(val);
  }
  const used=new Set(existing.filter(x=>x?.id!=null).map(x=>String(Number(x.id))));
  const local=new Map(existing.filter(x=>x?.id!=null).map(x=>[String(Number(x.id)),x]));
  let generated=Number(opts.seed)||Date.now();generated=Math.max(1,Math.floor(generated));
  const fresh=()=>{while(used.has(String(generated))||ids.has(String(generated)))generated++;used.add(String(generated));return generated++};
  const additions=[];let skipped=0,forked=0;
  for(const source of normalized){
   const id=String(Number(source.id));const old=local.get(id);
   if(old&&sameMatch(old,source)){skipped++;continue}
   // A previously forked copy with the same imported origin must not be cloned twice.
   const forkExists=existing.some(candidate=>String(candidate?.importOriginalId||'')===id && sameMatch({...candidate,id:Number(id)},source));
   if(forkExists){skipped++;continue}
   if(used.has(id)){source.id=fresh();source.importOriginalId=id;source.importedAt=new Date().toISOString();forked++}
   else used.add(id);
   additions.push(source);
  }
  return {additions,skipped,forked,total:incoming.length};
 }
 function csvCell(value){
  let s=String(value??'');
  if(typeof value==='string'&&/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;
  return /[",\r\n;]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
 }
 function csvRows(rows){return '\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'}
 function extractCodes(input){
  const text=String(input||'');
  if(/(?:^|\r?\n)match_id\s*,\s*date\s*,\s*opponent\b/i.test(text))return [];
  const codes=[];
  for(const line of text.split(/\r?\n/)){
   const trimmed=line.trim();if(!trimmed||trimmed.startsWith('#'))continue;
   if(trimmed.includes(','))continue; // An actions CSV is not a code sequence.
   for(const raw of trimmed.split(/[;\s]+/)){
    const p=raw.trim().replace(/^"|"$/g,'');
    if(p.length>160)continue;
    if(/^(?:R)?\d{1,3}[SREABDFC][#+!\/=\-](?:[a-zA-Z0-9#@+!./:=\-]*)$/.test(p)){
     codes.push(p);if(codes.length>MAX_CODES)throw Error(`Solo se admiten ${MAX_CODES} códigos por importación.`);
    }
   }
  }
  return codes; // Repetitions are deliberate and must be preserved.
 }
 return Object.freeze({VERSION,validMatch,planImport,sameMatch,csvCell,csvRows,extractCodes,MAX_MATCHES,MAX_CODES});
});
