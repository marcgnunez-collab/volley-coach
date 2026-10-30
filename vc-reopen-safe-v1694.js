/* Volley Coach — explicit, checkpointed reopening of finished scoutings.
   Does not change the score, sets, rallies or action histories. */
(()=>{
'use strict';
if(window.VC_REOPEN_SAFE)return;
const arr=x=>Array.isArray(x)?x:[];
async function reopen(teamId,matchId){
 const team=String(teamId),id=Number(matchId);
 if(!Number.isSafeInteger(id)||id<=0)throw Error('ID de scouting no válido');
 if(String(typeof equipoActivo==='undefined'?'':equipoActivo)!==team)throw Error('Selecciona primero el equipo del partido');
 const saved=arr(equiposData?.[team]?.scoutingMatches).find(m=>Number(m.id)===id);
 const current=arr(window.VC_SCOUT_VIDEO_BRIDGE?.getMatches?.()).find(m=>Number(m.id)===id);
 const m=current||saved;
 if(!m)throw Error('El partido no está en los datos activos. Consulta las copias protegidas');
 if(m.status!=='finished')return window.MatchState?.select?.(id);
 if(!window.VC_SYNC_V1680?.capture)throw Error('No está disponible el guardado protegido');
 if(!confirm('¿Reabrir este partido finalizado para editarlo? Se guardará una copia previa; el resultado y los rallies permanecen intactos.'))return false;
 // Full local snapshot before changing finalization metadata.
 const before=await window.VC_SYNC_V1680.capture('before-explicit-match-reopen');
 if(!before)throw Error('No se pudo guardar la copia previa. Partido sin cambios');
 const timestamp=new Date().toISOString();
 for(const target of [current,saved]){
  if(!target)continue;
  target.status='live';
  target.endedAt=null;
  target.reopenedAt=timestamp;
  target.updatedAt=timestamp;
 }
 try{
  const selected=await window.MatchState.select(id,{saveCurrent:true,openWorkspace:true});
  window.VC_SYNC_V1680.onMutation?.('explicit-match-reopen');
  if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
  if(!(await window.VC_SYNC_V1680.capture('after-explicit-match-reopen')))throw Error('Reabierto pero no se pudo confirmar la copia posterior. Exporta los datos y no cierres la aplicación');
  window.VC_V123?.render?.();window.v119RefreshPro?.();window.VC_V121?.render?.();
  return selected;
 }catch(error){
  // Never claim success; pre-change snapshot remains available for recovery.
  throw error;
 }
}
window.VC_REOPEN_SAFE={version:'16.9.4',reopen};
})();