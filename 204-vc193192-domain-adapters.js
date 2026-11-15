/* Volley Coach V19.3.19.2 - Domain adapters for the legacy team store.
 * Read-only projection, without migration, IDs persisted or extra sync writer.
 * Seasons and club IDs are only exposed if explicitly present in source data.
 */
(function(root,factory){
 'use strict'; const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC193192_DOMAINS=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.19.2';
 const arr=x=>Array.isArray(x)?x:[];
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const str=x=>String(x??'').trim();
 const present=x=>x!==undefined&&x!==null&&str(x)!=='';
 const identity=x=>present(x?.id)?str(x.id):present(x?.uuid)?str(x.uuid):null;
 const teamName=(id,raw,registry={})=>str(raw?.nombre||raw?.name||registry?.[id]?.nombre||raw?.meta?.equipo||id);
 const seasonLabel=(raw,source={})=>str(raw?.temporada||raw?.season||raw?.seasonName||raw?.meta?.temporada||raw?.meta?.season||source?.temporadaActual||source?.seasonCurrent||'');
 function project(raw,options={}){
  if(!obj(raw)||!obj(raw.equiposData))throw new Error('No hay datos de equipos compatibles.');
  const registry=obj(options.registry)?options.registry:{},teams=[],issues=[];
  const club=raw.club||raw.clubConfig||raw.organizacion||null;
  const clubId=identity(club),clubName=str(club?.nombre||club?.name||'');
  for(const [id,record] of Object.entries(raw.equiposData)){
   if(!obj(record)){issues.push({teamId:id,code:'invalid-team',message:'El registro de equipo no es un objeto'});continue;}
   const players=arr(record.jugadores),matches=arr(record.scoutingMatches),training=arr(record.historial),plans=arr(record.planificacion);
   const playerIds=new Set(),numbers=new Set(),roster=[];
   for(const [index,p] of players.entries()){
    if(!obj(p)){issues.push({teamId:id,code:'invalid-player',index,message:'Registro de jugador incompleto'});continue;}
    const idValue=identity(p),number=str(p.number??p.numero??'');
    if(!idValue)issues.push({teamId:id,code:'provisional-player-id',index,message:'Jugador sin ID estable'});
    if(idValue&&playerIds.has(idValue))issues.push({teamId:id,code:'duplicate-player-id',index,message:'ID de jugador duplicado'});
    if(idValue)playerIds.add(idValue);
    if(number&&numbers.has(number))issues.push({teamId:id,code:'duplicate-shirt-number',index,message:'Dorsal repetido en la plantilla'});
    if(number)numbers.add(number);
    const position=str(p.position||p.posicion||arr(p.positions)[0]||'');
    roster.push({id:idValue,number,name:str(p.name||p.nombre||p.playerName||''),position,status:str(p.status||p.estado||''),
     // Position is only a link to the original record, never a replacement ID.
     sourceIndex:index,identityStable:!!idValue});
   }
   let sets=0,rallies=0,actions=0;
   for(const m of matches)for(const s of arr(m?.sets)){
    sets++;for(const r of arr(s?.rallies)){rallies++;actions+=arr(r?.actions).length;}
   }
   const season=seasonLabel(record,raw),name=teamName(id,record,registry);
   teams.push({id,name,season:season||null,seasonExplicit:!!season,roster,
    counts:{players:players.length,matches:matches.length,training:training.length,plans:plans.length,sets,rallies,actions},
    lastMatches:matches.slice(-3).reverse().map((m,index)=>({id:identity(m),label:str(m?.name||m?.opponent||m?.opponentName||m?.title||'Partido sin nombre'),status:str(m?.status||''),sourceIndex:matches.length-index-1})),
    legacySource:'equiposData.'+id});
  }
  const activeTeamId=str(options.activeTeamId||''),active=teams.find(t=>t.id===activeTeamId)||null;
  const seasonNames=[...new Set(teams.map(t=>t.season).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const total={teams:teams.length,players:0,matches:0,training:0,plans:0,sets:0,rallies:0,actions:0};
  for(const t of teams)for(const key of Object.keys(t.counts))total[key]+=t.counts[key];
  return {version:VERSION,schema:'volley-coach-domain-projection',readOnly:true,club:{id:clubId,name:clubName||null},
   seasons:seasonNames.map(name=>({label:name,teamIds:teams.filter(t=>t.season===name).map(t=>t.id)})),
   teams,total,issues,activeTeamId:active?.id||null,active,unassignedSeasons:teams.filter(t=>!t.season).length,
   note:'Vista derivada del registro legado. No crea clubes, temporadas, IDs ni permisos.'};
 }
 function readLive(root){
  const teams=root?.VC_V1917_TEAM_STATE?.();
  if(obj(teams))return {equiposData:teams};
  if(typeof root?.estadoLocal==='function')return root.estadoLocal();
  throw new Error('Los datos del equipo no están disponibles todavía.');
 }
 function activeFrom(root){
  try{
   const saved=root?.localStorage?.getItem('volleyCoachActiveTeamV43')||root?.localStorage?.getItem('volleyCoachActiveTeamV42');
   if(saved)return str(saved);
  }catch(_){}
  return str(root?.equipoActivo||'');
 }
 function inspect(root){return project(readLive(root),{activeTeamId:activeFrom(root),registry:root?.EQUIPOS});}
 return {VERSION,project,readLive,activeFrom,inspect,identity,seasonLabel};
});
