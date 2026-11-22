/* V20.5.61 · The existing V15.3.1 club-state storage policy in TypeScript.
 * The native owner still assembles the entire team/training/season JSON.
 * Only the ORIGINAL browser-state key is written. Never retry a failed typed write.
 */
export type ClubLocalWriteMode='normal'|'compacto';
export interface ClubLocalStoragePort{
 readonly getItem:(key:string)=>string|null;
 readonly setItem:(key:string,value:string)=>void;
}
export interface ClubLocalWriteRequest{
 readonly storage:ClubLocalStoragePort;
 readonly key:string;
 readonly raw:string;
 readonly compactActive:boolean;
 readonly pack:(raw:string)=>string;
 readonly unpack:(packed:string)=>string;
}
const PREFIX='VC-LZW16-1:';
const quotaError=(err:unknown)=>{
 const value=err&&typeof err==='object'?err as {name?:unknown;code?:unknown}:{};
 return value.name==='QuotaExceededError'||value.code===22||value.code===1014;
};

/** Exactly the original V15.3.1 write modes and errors, without new keys or stores. */
export function writeClubLocalState(input:ClubLocalWriteRequest):ClubLocalWriteMode{
 if(!input||!input.storage||typeof input.storage.getItem!=='function'||
  typeof input.storage.setItem!=='function'||typeof input.key!=='string'||!input.key||
  typeof input.raw!=='string'||typeof input.pack!=='function'||typeof input.unpack!=='function')
  throw Error('Guardado local no disponible');

 const old=input.storage.getItem(input.key);
 // The fast normal path avoids expensive full-club compression on every point.
 if(!input.compactActive&&!(old||'').startsWith(PREFIX)){
  try{input.storage.setItem(input.key,input.raw);return 'normal'}
  catch(err){if(!quotaError(err))throw err}
 }
 const packed=input.pack(input.raw);
 if(packed.length>=input.raw.length)
  throw Error('No cabe el estado local ni comprimido. Exporta una copia, no borres datos.');
 if(input.unpack(packed)!==input.raw)
  throw Error('La comprobación de integridad del estado comprimido ha fallado');
 try{input.storage.setItem(input.key,packed)}
 catch(err){
  if(quotaError(err))
   throw Error('Almacenamiento local lleno incluso en formato compacto. La importación se ha cancelado sin eliminar tus datos; exporta una copia de seguridad y avisa del error.');
  throw err;
 }
 if(input.storage.getItem(input.key)!==packed)throw Error('No se pudo verificar el almacenamiento local');
 return 'compacto';
}
