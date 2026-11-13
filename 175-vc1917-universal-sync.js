/* Volley Coach V19.1.7 · Universal Sync (colecciones persistidas).
 * Mantiene el único escritor CAS v962 y el canal Realtime v138.
 * Registra las bajas confirmadas en el guardado local y conserva sus marcas
 * al fusionar, para que los demás dispositivos no resuciten los registros.
 * NO sincroniza blobs de vídeo, IndexedDB privado ni datos ajenos a equiposData.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api.pure;
  if(root&&root.document){root.VC_V1917_UNIVERSAL=api;api.install(root);}
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';
  const VERSION='19.1.7';
  const TYPES=Object.freeze(['planificacion','historial','scoutingMatches','jugadores','plantillas','partidos',
    'seasonPlan','teamGoals','scoutingGamePlans','scoutLineupTemplatesV690','scoutRivalProfilesV6100']);
  const LEGACY=Object.freeze({planificacion:'v953DeletedPlanIds',historial:'v953DeletedHistoryIds',scoutingMatches:'v956DeletedScoutIds'});
  const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const arr=v=>Array.isArray(v)?v:[];
  const idOf=r=>{const n=Number(r?.id);return Number.isSafeInteger(n)&&n>0?n:null;};
  function stamp(r){
    const dates=['updatedAt','guardadoPlanificacionEn','historialGuardadoEn','actualizadoEnSesion','realizadoEn','modifiedAt','syncModifiedAt','manualSavedAt'];
    const values=dates.map(k=>{const v=r?.[k];if(typeof v==='number')return v;const d=Date.parse(v||'');return Number.isFinite(d)?d:0;});
    const id=idOf(r)||0;
    return Math.max(0,...values,id>1e11?id:0);
  }
  function tombMap(...lists){
    const map=new Map();
    for(const entry of lists.flatMap(arr)){
      const id=idOf(typeof entry==='object'?entry:{id:entry});if(!id)continue;
      const time=Number(entry?.at)||0;
      map.set(id,Math.max(map.get(id)||0,time));
    }
    return map;
  }
  function tombList(map){return [...map].map(([id,at])=>({id,at})).sort((a,b)=>b.at-a.at||b.id-a.id);}
  function tombstones(team,type){
    const key=LEGACY[type];return arr(key?team?.[key]:team?.v1917DeletedRecords?.[type]);
  }
  function setTombs(team,type,list){
    if(LEGACY[type])team[LEGACY[type]]=list;
    else{team.v1917DeletedRecords={...obj(team.v1917DeletedRecords),[type]:list};}
  }
  function mark(team,type,id,at=Date.now()){
    if(!TYPES.includes(type)||!idOf({id}))return false;
    const map=tombMap(tombstones(team,type));map.set(Number(id),Math.max(map.get(Number(id))||0,at));
    setTombs(team,type,tombList(map));return true;
  }
  function revive(team,type,id){
    const current=tombMap(tombstones(team,type));if(!current.delete(Number(id)))return false;
    setTombs(team,type,tombList(current));return true;
  }
  function filterList(items,marks){
    const removed=tombMap(marks);
    const kept=[],seen=new Set();
    for(const record of arr(items)){
      const id=idOf(record);
      if(id&&seen.has(id))continue;
      if(id&&(removed.get(id)||0)>=stamp(record)&&(removed.get(id)||0)>0)continue;
      if(id)seen.add(id);
      kept.push(record);
    }
    return kept;
  }
  function mergeTeam(local,remote,out){
    const target=out||{},lhs=obj(local),rhs=obj(remote);
    for(const type of TYPES){
      const combined=tombList(tombMap(tombstones(lhs,type),tombstones(rhs,type)));
      if(combined.length)setTombs(target,type,combined);
      if(Array.isArray(target[type]))target[type]=filterList(target[type],combined);
    }
    return target;
  }
  function filterDeletedTeam(team){
    if(!team)return team;
    for(const type of TYPES){
      const marks=tombstones(team,type);
      if(marks.length)team[type]=filterList(team[type],marks);
    }
    if(team.scoutingActiveId!=null&&!arr(team.scoutingMatches).some(m=>idOf(m)===Number(team.scoutingActiveId)))
      team.scoutingActiveId=null;
    return team;
  }
  function indexIds(state){
    const snap={};
    for(const [team,data] of Object.entries(obj(state?.equiposData))){
      snap[team]={};
      for(const type of TYPES)snap[team][type]=arr(data?.[type]).map(idOf).filter(Boolean);
    }
    return snap;
  }
  function diff(before,after){
    const removed=[],added=[];
    for(const [team,types] of Object.entries(obj(before))){
      for(const type of TYPES){
        const prev=new Set(arr(types[type]));const now=new Set(arr(after?.[team]?.[type]));
        for(const id of prev){if(!now.has(id))removed.push({team,type,id});}
        for(const id of now){if(!prev.has(id))added.push({team,type,id});}
      }
    }
    // Newly created teams may already contain records; they are additions, never deletions.
    return {removed,added};
  }
  function authorizedMassDelete(local,remote,risk){
    return arr(risk?.losses).length>0&&arr(risk?.losses).every(loss=>{
      const team=obj(remote?.equiposData?.[loss.team]);
      const tomb=tombMap(tombstones(team,loss.kind));
      return arr(local?.equiposData?.[loss.team]?.[loss.kind])
        .filter(r=>!arr(team[loss.kind]).some(other=>idOf(other)===idOf(r)))
        .every(r=>idOf(r)&&tomb.has(idOf(r))&&tomb.get(idOf(r))>=stamp(r));
    });
  }
  function getBaselineDigest(baseline,team,type,id){return baseline?.records?.[team]?.[type]?.[String(id)];}
  function deletionConflicts(local,remote,baseline,digest){
    if(typeof digest!=='function')return [];
    const issues=[];
    for(const team of new Set([...Object.keys(obj(local?.equiposData)),...Object.keys(obj(remote?.equiposData))])){
      const l=obj(local?.equiposData?.[team]),r=obj(remote?.equiposData?.[team]);
      for(const type of TYPES){
        const lhs=new Map(arr(l[type]).filter(x=>idOf(x)).map(x=>[idOf(x),x]));
        const rhs=new Map(arr(r[type]).filter(x=>idOf(x)).map(x=>[idOf(x),x]));
        const localT=tombMap(tombstones(l,type)),remoteT=tombMap(tombstones(r,type));
        for(const [id,record] of lhs){
          if(rhs.has(id)||!remoteT.has(id))continue;
          const base=getBaselineDigest(baseline,team,type,id);
          if(!base||digest(record)!==base)issues.push({key:JSON.stringify(['delete',team,type,id]),team,type,id,where:'nube',editedDigest:digest(record),deletedAt:remoteT.get(id),label:String(record?.nombre||record?.titulo||record?.opponent||record?.rival||id).slice(0,120),uncertain:!base,reason:'El dispositivo editó un registro que otro dispositivo eliminó.'});
        }
        for(const [id,record] of rhs){
          if(lhs.has(id)||!localT.has(id))continue;
          const base=getBaselineDigest(baseline,team,type,id);
          if(!base||digest(record)!==base)issues.push({key:JSON.stringify(['delete',team,type,id]),team,type,id,where:'local',editedDigest:digest(record),deletedAt:localT.get(id),label:String(record?.nombre||record?.titulo||record?.opponent||record?.rival||id).slice(0,120),uncertain:!base,reason:'La nube editó un registro que este dispositivo eliminó.'});
        }
      }
    }
    return issues;
  }
  // V19.3.11.2: la decisión se aplica sobre COPIAS de ambos estados para que
  // el merge heredado no recupere un scouting eliminado ni pierda una edición.
  // Solo acepta decisiones que prepare() ha comparado contra ambos estados.
  function applyDeletionDecisions(local,remote,decisions){
    const l=JSON.parse(JSON.stringify(local)),r=JSON.parse(JSON.stringify(remote));
    for(const decision of arr(decisions)){
      const {team,type,id,where,use}=decision;
      if(!TYPES.includes(type)||!idOf({id})||!['nube','local'].includes(where)||!['edited','deleted'].includes(use))throw Error('Resolución de borrado no válida.');
      const lt=l.equiposData?.[team],rt=r.equiposData?.[team];
      if(!lt||!rt)throw Error('El equipo ya no coincide con el conflicto revisado.');
      if(use==='edited'){
        // La recuperación explícita elimina la marca de baja antigua de ambos
        // lados; de otro modo la función filterDeletedTeam la descartaría.
        revive(lt,type,id);revive(rt,type,id);
      }else{
        const record=arr((where==='nube'?lt:rt)[type]).find(x=>idOf(x)===Number(id));
        if(!record)throw Error('La edición que se iba a descartar ya no está disponible.');
        const at=Math.max(Date.now(),Number(decision.deletedAt)||0,stamp(record)+1);
        for(const source of [lt,rt]){
          source[type]=arr(source[type]).filter(x=>idOf(x)!==Number(id));
          mark(source,type,id,at);
          if(type==='scoutingMatches'&&Number(source.scoutingActiveId)===Number(id))source.scoutingActiveId=null;
        }
      }
    }
    return {local:l,remote:r};
  }
  const pure={VERSION,TYPES,LEGACY,stamp,tombMap,tombstones,mark,revive,filterList,mergeTeam,filterDeletedTeam,indexIds,diff,authorizedMassDelete,deletionConflicts,applyDeletionDecisions};
  function install(win){
    let previous=null,applying=false,tracked=0,lastChanges=[],error='';
    // equiposData se declara con `let` en el core: no existe como window.equiposData.
    // Consultar la referencia del core evita clonar toda la biblioteca en cada guardado.
    function teams(){return win.VC_V1917_TEAM_STATE?.()||win.equiposData||null;}
    function state(){const data=teams();return data?{equiposData:data}:win.estadoLocal?.()||null;}
    function initialize(){if(!previous){try{previous=indexIds(state());}catch(e){error=String(e?.message||e);}}}
    const rawSave=win.guardarEstadoLocalSinCloud;
    if(typeof rawSave==='function'&&!rawSave.__vc1917){
      const wrapped=function(){
        if(applying)return rawSave.apply(this,arguments);
        initialize();
        const current=indexIds(state());
        const changes=diff(previous||{},current);
        const at=Date.now();
        for(const change of changes.removed){
          const team=teams()?.[change.team];
          if(team&&mark(team,change.type,change.id,at)){tracked++;lastChanges.push({...change,op:'delete',at});}
        }
        for(const change of changes.added){
          const team=teams()?.[change.team];
          if(team&&revive(team,change.type,change.id)){lastChanges.push({...change,op:'restore',at});}
        }
        if(lastChanges.length>30)lastChanges=lastChanges.slice(-30);
        const result=rawSave.apply(this,arguments);
        previous=indexIds(state());error='';
        return result;
      };
      wrapped.__vc1917=true;win.guardarEstadoLocalSinCloud=wrapped;
    }
    const applyBase=win.aplicarEstadoCloud;
    if(typeof applyBase==='function'&&!applyBase.__vc1917){
      const wrapped=function(){applying=true;try{return applyBase.apply(this,arguments)}finally{
        previous=indexIds(state());applying=false;
      }};
      wrapped.__vc1917=true;win.aplicarEstadoCloud=wrapped;
    }
    function diagnostic(){return {version:VERSION,automaticDeletionJournal:true,trackedDeletions:tracked,lastChanges:lastChanges.slice(),lastError:error,
      realtimeWakeup:win.VC_DEVICE_SYNC?.diagnostics?.().realtimeState==='SUBSCRIBED'};}
    win.VC_V1917_UNIVERSAL={version:VERSION,...pure,diagnostics:diagnostic};
    initialize();
  }
  return {version:VERSION,pure,install};
});
