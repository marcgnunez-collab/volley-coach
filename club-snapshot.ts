/* V20.5.62 · One serialization per club partition, with original JSON byte order.
 * Each call observes the current objects: nothing is cached across saves.
 * The existing writer and recovery paths remain the only persistence owners.
 */
export interface ClubSnapshotInput{
 readonly bibliotecaCompartida:unknown;
 readonly equiposData:unknown;
 readonly updatedAt:string;
}
export interface ClubSerializedSnapshot{
 readonly raw:string;
 readonly libraryEntriesJSON:string;
}
export interface ClubIndependentLibraryInput{
 readonly snapshot:ClubSerializedSnapshot;
 readonly updatedAt:string;
 readonly total:number;
}

const encode=(value:unknown,name:string):string=>{
 const json=JSON.stringify(value);
 if(typeof json!=='string')throw Error(`No se pudo serializar ${name}`);
 return json;
};

/** The native payload has exactly these five keys, in this order. */
export function serializeClubSnapshot(input:ClubSnapshotInput):Readonly<ClubSerializedSnapshot>{
 if(!input||typeof input.updatedAt!=='string')throw Error('Instantánea del club no válida');
 const libraryEntriesJSON=encode(input.bibliotecaCompartida,'la biblioteca');
 const teamsJSON=encode(input.equiposData,'los equipos');
 const timestampJSON=encode(input.updatedAt,'la fecha');
 return Object.freeze({
  raw:`{"version":5.8,"bibliotecaCompartida":${libraryEntriesJSON},"bibliotecaVersion":1,"bibliotecaUpdatedAt":${timestampJSON},"equiposData":${teamsJSON}}`,
  libraryEntriesJSON
 });
}

/** Reuses the already serialized exercise list for the existing independent copy. */
export function serializeClubIndependentLibrary(input:ClubIndependentLibraryInput):string{
 if(!input||!input.snapshot||typeof input.snapshot.libraryEntriesJSON!=='string'||
  typeof input.updatedAt!=='string'||!Number.isSafeInteger(input.total)||input.total<0)
  throw Error('Copia de biblioteca no válida');
 const timestampJSON=encode(input.updatedAt,'la fecha de biblioteca');
 return `{"version":1,"updatedAt":${timestampJSON},"total":${input.total},"ejercicios":${input.snapshot.libraryEntriesJSON}}`;
}
