/* Volley Coach 19.3.13.1 · Pure, read-only model for compact scouting video scoreboard.
 * It never guesses a historical score. No match, storage, network, or video mutations.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_SCOUT_SCORE_MODEL_193131=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.13.1';
 const str=x=>String(x??'').trim();
 const number=v=>(v!==''&&v!=null&&Number.isFinite(Number(v))?Number(v):null);
 const validScore=v=>{const n=number(v);return n!=null&&Number.isInteger(n)&&n>=0?n:null;};
 const validRotation=v=>{const n=number(v);return n!=null&&Number.isInteger(n)&&n>=1&&n<=6?n:null;};
 const shortName=(value,fallback)=>{
  const clean=str(value).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  if(!clean)return fallback;
  const words=clean.split(' ').filter(Boolean);
  return (words.length>=2?words[0].slice(0,1)+words[1].slice(0,1):words[0].slice(0,3)).toLocaleUpperCase('es-ES');
 };
 const setsWon=match=>{
  let ours=0,opponent=0;
  for(const set of Array.isArray(match?.sets)?match.sets:[]){
   if(!set?.finished)continue;
   if(set.winner==='ours')ours++;
   else if(set.winner==='opponent')opponent++;
  }
  return {ours,opponent};
 };
 const modeOf=media=>media?.videoMode==='delay'?'delay':media?.source==='youtube'?'youtube':media?.source==='local'?'local':'live';
 const formatTime=seconds=>{
  const sec=Math.max(0,Math.floor(Number(seconds)||0)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
 };
 function sourceMatches(match,media){
  if(!match?.video)return false;
  const kind=modeOf(media),v=match.video;
  if(kind==='local'){
   const file=media?.localFile;
   if(!file||!str(v.source)||str(v.source)!==str(file.name))return false;
   if(number(v.fileSize)!=null && number(v.fileSize)!==Number(file.size))return false;
   return true;
  }
  if(kind==='youtube')return !!str(media?.youtubeId)&&str(v.youtubeId)===str(media.youtubeId);
  return false;
 }
 function live(match,currentSet,ourName){
  if(!match||!currentSet)return null;
  const ours=validScore(currentSet.scoreUs),opponent=validScore(currentSet.scoreOpponent);
  if(ours==null||opponent==null)return null;
  const set=number(match.currentSet)||number(currentSet.number)||1;
  const serving=match.servingTeam==='ours'||match.servingTeam==='opponent'?match.servingTeam:null;
  return {kind:'live',source:'DIRECTO',set,ours,opponent,serving,
   ownRotation:validRotation(match.rotationNo),rivalRotation:validRotation(match.opponentRotationNo),
   rally:(Array.isArray(currentSet.rallies)?currentSet.rallies.length:0)+1,
   sets:setsWon(match),ourName:shortName(ourName,'VC'),rivalName:shortName(match.opponent,'RIV')};
 }
 function history(match,media,api,seconds,ourName){
  if(!match||!api?.buildTimeline||!api?.atVideoTime||!sourceMatches(match,media))return null;
  if(number(match.video?.syncOffset)==null||number(seconds)==null)return null;
  // Only the same explicitly matched source + syncOffset may produce historical scores.
  const events=api.buildTimeline(match,null,null);
  const snapshot=api.atVideoTime(Number(seconds),events);
  if(!snapshot?.scores?.complete)return null;
  return {kind:'history',source:modeOf(media)==='local'?'ARCHIVO':'YOUTUBE',
   set:snapshot.set,ours:snapshot.scores.ours,opponent:snapshot.scores.opponent,
   serving:snapshot.serving,ownRotation:validRotation(snapshot.ownRotation),rivalRotation:validRotation(snapshot.rivalRotation),
   rally:snapshot.rally,sets:null,ourName:shortName(ourName,'VC'),rivalName:shortName(match.opponent,'RIV'),
   stage:snapshot.stage};
 }
 function presentation({match,currentSet,media,api,seconds,ourName}={}){
  if(!match)return {kind:'empty',reason:'Sin partido activo'};
  const mode=modeOf(media);
  if(mode==='live')return live(match,currentSet,ourName)||{kind:'unavailable',source:'DIRECTO',reason:'Marcador no registrado'};
  if(mode==='delay')return {kind:'unavailable',source:'DELAY',reason:'Marcador histórico no sincronizado'};
  const snapshot=history(match,media,api,seconds,ourName);
  return snapshot||{kind:'unavailable',source:mode==='local'?'ARCHIVO':'YOUTUBE',reason:'Sin marcador histórico verificado'};
 }
 return Object.freeze({VERSION,validScore,validRotation,shortName,setsWon,modeOf,sourceMatches,live,history,presentation,formatTime});
});
