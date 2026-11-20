/* V20.5.53 · Pure V7.0 rally video bounds. No clock or live video I/O. */
export interface RallyVideoBounds{
 videoStart:number|null;
 videoEnd:number|null;
}

export function normalizeRallyVideoBounds(input:unknown):RallyVideoBounds{
 const r=input as Record<string,any>|null|undefined;
 return {
  videoStart:r?.videoStart==null?null:Number(r.videoStart),
  videoEnd:r?.videoEnd==null?null:Number(r.videoEnd)
 };
}
