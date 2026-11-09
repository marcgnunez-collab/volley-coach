/* Volley Coach V16.5.1 — shared Tactical Laboratory engine.
 * Pure, read-only transformations of the canonical studio sequence rows.
 * No writes, network access or derived scouting persistence. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VC_TACTICAL_LAB_1651=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const clean=v=>String(v==null?'':v).trim();
 const zone=v=>{const m=clean(v).toUpperCase().match(/^Z?([1-9])([A-D])?$/);return m?m[1]:'';};
 const blank=()=>({reception:'all',setter:'',attacker:'',tempo:'',outcome:'',destination:''});
 function sanitize(input){
  const x=input&&typeof input==='object'?input:{};
  const f=blank();
  f.reception=['all','positive','other','missing','unknown'].includes(x.reception)?x.reception:'all';
  f.outcome=['','point','error','ongoing','unknown','missing'].includes(x.outcome)?x.outcome:'';
  for(const k of ['setter','attacker','tempo'])f[k]=clean(x[k]).slice(0,160);
  f.destination=/^[1-9]$/.test(clean(x.destination))?clean(x.destination):'';
  return f;
 }
 function apply(items,input){
  const f=sanitize(input);return (Array.isArray(items)?items:[]).filter(row=>
   (f.reception==='all'||row.recClass===f.reception)&&
   (!f.setter||row.setter===f.setter)&&
   (!f.attacker||row.attacker===f.attacker)&&
   (!f.tempo||row.tempo===f.tempo)&&
   (!f.outcome||row.outcome===f.outcome)&&
   (!f.destination||zone(row.attack?.a?.endZone)===f.destination)
  );
 }
 function uniqueKeys(rows){return [...new Set(rows.flatMap(r=>Array.isArray(r.keys)?r.keys:[]).filter(Boolean))]}
 function groups(rows,mapper){
  const out=new Map();
  for(const item of rows){const k=clean(mapper(item))||'Sin registrar';if(!out.has(k))out.set(k,[]);out.get(k).push(item)}
  return [...out].map(([name,items])=>({name,items,n:items.length,keys:uniqueKeys(items)})).sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'es'));
 }
 function rating(rows){
  const scored=rows.filter(x=>x.attack&&['#','+','!','-','=','/'].includes(x.attack.ev));
  const k=scored.filter(x=>x.attack.ev==='#').length,
        e=scored.filter(x=>x.attack.ev==='=').length,
        blocked=scored.filter(x=>x.attack.ev==='/').length;
  return {n:scored.length,k,e,blocked,eff:scored.length?Math.round((k-e-blocked)/scored.length*1000)/10:null};
 }
 function summarize(items){
  const rows=Array.isArray(items)?items:[];
  const linked=rows.filter(x=>x.attack),complete=rows.filter(x=>x.rec&&x.attack);
  const trajectory=rows.filter(x=>x.attack&&zone(x.attack.a?.startZone)&&zone(x.attack.a?.endZone));
  const setterTargets=rows.filter(x=>zone(x.pair?.set?.a?.setTarget));
  const routes=groups(trajectory,x=>`Z${zone(x.attack.a.startZone)} → Z${zone(x.attack.a.endZone)}`);
  const destinations=groups(setterTargets,x=>`Z${zone(x.pair.set.a.setTarget)}`);
  const patterns=groups(rows,x=>JSON.stringify([x.reception,x.setter,x.attacker,x.tempo,x.combo]));
  return {rows,n:rows.length,linked:linked.length,complete:complete.length,trajectories:trajectory.length,setterTargets:setterTargets.length,
   stats:rating(rows),routes,destinations,patterns,attackers:groups(rows,x=>x.attacker),setters:groups(rows,x=>x.setter),keys:uniqueKeys(rows)};
 }
 return Object.freeze({version:'16.5.1',blank,sanitize,apply,summarize,zone,rating,uniqueKeys});
});
