/* V20.5.63 · Explicit pilot projections, not the authoritative club record.
 * Missing values remain missing. Unknown team fields and scouting stay untouched.
 */
export const CLUB_PARTITION_STORES=['players','trainings','seasons'] as const;
export type ClubPartitionStore=typeof CLUB_PARTITION_STORES[number];
export const MAX_CLUB_PARTITION_CHARS=5_000_000;
const FIELDS:Readonly<Record<ClubPartitionStore,readonly string[]>>=Object.freeze({
 players:['jugadores'],
 trainings:['sesionActual','meta','historial','planificacion','plantillas'],
 seasons:['temporada','temporadas','temporadaActual','season','seasonName']
});
export interface ClubPartitionRow{
 readonly teamId:string;
 readonly revision:string;
 readonly dataJson:string;
}
export interface ClubPartitionPlan{
 readonly schema:1;
 readonly revision:string;
 readonly teamIds:readonly string[];
 readonly rows:Readonly<Record<ClubPartitionStore,readonly ClubPartitionRow[]>>;
 readonly totalChars:number;
}

const object=(v:unknown):v is Record<string,unknown>=>
 !!v&&typeof v==='object'&&!Array.isArray(v);

export function planClubPartitions(rawTeams:unknown,revision:string):Readonly<ClubPartitionPlan>{
 if(!object(rawTeams)||!revision||typeof revision!=='string'||revision.length>128)
  throw Error('Estado de equipos o revisión no disponible');
 const teamIds=Object.keys(rawTeams).sort();
 if(!teamIds.length||teamIds.length>100)throw Error('Número de equipos no admitido en el piloto');
 const rows={players:[],trainings:[],seasons:[]} as Record<ClubPartitionStore,ClubPartitionRow[]>;
 let totalChars=0;
 for(const teamId of teamIds){
  const team=rawTeams[teamId];
  if(!object(team))throw Error('Registro de equipo no compatible con el piloto');
  for(const store of CLUB_PARTITION_STORES){
   const fields:Record<string,unknown>={};
   for(const field of FIELDS[store])if(Object.hasOwn(team,field))fields[field]=team[field];
   const dataJson=JSON.stringify(fields);
   if(typeof dataJson!=='string')throw Error('No se pudo convertir la partición a JSON');
   totalChars+=dataJson.length;
   if(totalChars>MAX_CLUB_PARTITION_CHARS)throw Error('El piloto supera el límite local de 5 millones de caracteres');
   rows[store].push(Object.freeze({teamId,revision,dataJson}));
  }
 }
 for(const store of CLUB_PARTITION_STORES)Object.freeze(rows[store]);
 return Object.freeze({schema:1 as const,revision,teamIds:Object.freeze(teamIds),
  rows:Object.freeze(rows),totalChars});
}

export function sameClubPartitionPlan(a:ClubPartitionPlan,b:ClubPartitionPlan):boolean{
 if(a.teamIds.length!==b.teamIds.length)return false;
 for(let i=0;i<a.teamIds.length;i++)if(a.teamIds[i]!==b.teamIds[i])return false;
 for(const store of CLUB_PARTITION_STORES){
  if(a.rows[store].length!==b.rows[store].length)return false;
  for(let i=0;i<a.rows[store].length;i++){
   const x=a.rows[store][i],y=b.rows[store][i];
   if(x.teamId!==y.teamId||x.dataJson!==y.dataJson)return false;
  }
 }
 return true;
}
