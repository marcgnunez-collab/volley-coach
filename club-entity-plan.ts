/* V20.5.64 · Conservative entity identities for a manual local pilot.
 * No invented player/training IDs. Unsupported historic records are counted,
 * never silently promoted to a stable identity or deleted from club state.
 */
export const CLUB_ENTITY_STORES=['playerEntities','trainingEntities','seasonEntities'] as const;
export type ClubEntityStore=typeof CLUB_ENTITY_STORES[number];
export const MAX_ENTITY_CHARS=5_000_000;
export const MAX_ENTITY_ROWS=20_000;
export interface ClubEntityRow{readonly key:string;readonly teamId:string;
 readonly collection:string;readonly dataJson:string}
export interface ClubEntityLayout{
 readonly fields:readonly string[];
 readonly arrays:Readonly<Record<string,readonly string[]>>;
}
export interface ClubEntityPlan{
 readonly schema:2;readonly revision:string;readonly teamIds:readonly string[];
 readonly rows:Readonly<Record<ClubEntityStore,readonly ClubEntityRow[]>>;
 readonly layout:Readonly<Record<string,Readonly<ClubEntityLayout>>>;
 readonly missingIds:number;readonly duplicatedIds:number;readonly invalidRecords:number;
 readonly totalChars:number;readonly complete:boolean;
}
const obj=(value:unknown):value is Record<string,unknown>=>
 !!value&&typeof value==='object'&&!Array.isArray(value);
const own=(record:Record<string,unknown>,key:string)=>Object.prototype.hasOwnProperty.call(record,key);
const stableId=(row:unknown):string|null=>{
 if(!obj(row))return null;
 for(const key of ['id','uuid','_id']){
  const value=row[key];
  if((typeof value==='string'&&value.trim())||(typeof value==='number'&&Number.isSafeInteger(value)))
   return String(value).trim();
 }
 return null;
};
const recordKey=(store:string,teamId:string,collection:string,id:string)=>
 JSON.stringify([store,teamId,collection,id]);

export function planClubEntities(raw:unknown,revision:string):Readonly<ClubEntityPlan>{
 if(!obj(raw)||typeof revision!=='string'||!revision||revision.length>128)
  throw Error('Datos de club o revisión no válidos');
 const teamIds=Object.keys(raw).sort();
 if(!teamIds.length||teamIds.length>100)throw Error('Número de equipos no válido');
 const rows={playerEntities:[],trainingEntities:[],seasonEntities:[]} as
  Record<ClubEntityStore,ClubEntityRow[]>;
 let missingIds=0,duplicatedIds=0,invalidRecords=0,totalChars=0;
 let rowCount=0;
 const push=(store:ClubEntityStore,teamId:string,collection:string,id:string,value:unknown)=>{
  const dataJson=JSON.stringify(value);
  if(typeof dataJson!=='string'){invalidRecords++;return}
  if(++rowCount>MAX_ENTITY_ROWS)throw Error('Demasiadas entidades para el piloto');
  totalChars+=dataJson.length;
  if(totalChars>MAX_ENTITY_CHARS)throw Error('El piloto de entidades supera el límite local');
  rows[store].push(Object.freeze({key:recordKey(store,teamId,collection,id),teamId,collection,dataJson}));
 };
 const array=(team:Record<string,unknown>,field:string,store:ClubEntityStore)=>{
  if(!own(team,field))return;
  const list=team[field];
  if(!Array.isArray(list)){invalidRecords++;return}
  const all=list.map(item=>stableId(item));
  const counts=new Map<string,number>();
  for(const id of all)if(id!==null)counts.set(id,(counts.get(id)||0)+1);
  for(let i=0;i<list.length;i++){
   const id=all[i];
   if(id===null){missingIds++;continue}
   if((counts.get(id)||0)>1){duplicatedIds++;continue}
   push(store,teamId,field,id,list[i]);
  }
 };
 let teamId='';
 for(teamId of teamIds){
  const team=raw[teamId];if(!obj(team))throw Error('Registro de equipo incompatible');
  array(team,'jugadores','playerEntities');
  for(const collection of ['historial','planificacion','plantillas','sesionActual'])
   array(team,collection,'trainingEntities');
  if(own(team,'meta'))push('trainingEntities',teamId,'meta','singleton',team.meta);
  for(const field of ['temporada','temporadaActual','season','seasonName'])
   if(own(team,field))push('seasonEntities',teamId,field,'singleton',team[field]);
  if(own(team,'temporadas')){
   const seasons=team.temporadas;
   if(!Array.isArray(seasons))invalidRecords++;
   else{
    const ids=seasons.map(season=>typeof season==='string'?season.trim():stableId(season));
    const counts=new Map<string,number>();
    for(const id of ids)if(id)counts.set(id,(counts.get(id)||0)+1);
    let index=0;
    for(const season of seasons){
     const id=ids[index++];
     if(!id){missingIds++;continue}
     if((counts.get(id)||0)>1){duplicatedIds++;continue}
     push('seasonEntities',teamId,'temporadas',id,season);
    }
   }
  }
 }
 for(const store of CLUB_ENTITY_STORES){rows[store].sort((a,b)=>a.key.localeCompare(b.key));Object.freeze(rows[store]);}
 // Order + presence are needed for a lossless rehearsal. Entity keys alone
 // cannot reconstruct an array's original order or distinguish [] from absent.
 const layout:Record<string,Readonly<ClubEntityLayout>>=Object.create(null);
 for(const id of teamIds){
  const team=raw[id] as Record<string,unknown>;
  const arrays:Record<string,readonly string[]>=Object.create(null);
  const fields=['jugadores','historial','planificacion','plantillas','sesionActual',
   'meta','temporada','temporadas','temporadaActual','season','seasonName']
   .filter(field=>own(team,field));
  for(const field of ['jugadores','historial','planificacion','plantillas','sesionActual','temporadas']){
   const list=team[field];
   if(!own(team,field)||!Array.isArray(list))continue;
   const store:ClubEntityStore=field==='jugadores'?'playerEntities':
    field==='temporadas'?'seasonEntities':'trainingEntities';
   arrays[field]=Object.freeze(list.map(item=>{
    const itemId=field==='temporadas'&&typeof item==='string'?item.trim():stableId(item);
    return itemId===null?'':recordKey(store,id,field,itemId);
   }));
  }
  Object.freeze(arrays);
  Object.defineProperty(layout,id,{value:Object.freeze({fields:Object.freeze(fields),arrays}),
   enumerable:true});
 }
 Object.freeze(layout);
 return Object.freeze({schema:2 as const,revision,teamIds:Object.freeze(teamIds),
  rows:Object.freeze(rows),layout,missingIds,duplicatedIds,invalidRecords,totalChars,
  complete:missingIds+duplicatedIds+invalidRecords===0});
}

export function sameClubEntityData(a:ClubEntityPlan,b:ClubEntityPlan):boolean{
 if(a.teamIds.length!==b.teamIds.length||a.missingIds!==b.missingIds||
  a.duplicatedIds!==b.duplicatedIds||a.invalidRecords!==b.invalidRecords)return false;
 for(let i=0;i<a.teamIds.length;i++)if(a.teamIds[i]!==b.teamIds[i])return false;
 for(const store of CLUB_ENTITY_STORES){
  if(a.rows[store].length!==b.rows[store].length)return false;
  for(let i=0;i<a.rows[store].length;i++){
   const x=a.rows[store][i],y=b.rows[store][i];
   if(x.key!==y.key||x.dataJson!==y.dataJson)return false;
  }
 }
 if(JSON.stringify(a.layout)!==JSON.stringify(b.layout))return false;
 return true;
}
