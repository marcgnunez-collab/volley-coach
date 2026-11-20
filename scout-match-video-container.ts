/* V20.5.50 · Pure V6.10.0 video container projection.
 * The original clips array is reused, never copied or persisted here.
 * Historical rally video bounds stay in the native match normalizer.
 */
export interface ScoutMatchVideoContainer{
 syncOffset:number|null;
 source:string;
 clips:unknown[];
}

export function normalizeScoutingMatchVideoContainer(input:unknown):ScoutMatchVideoContainer{
 const m=input as Record<string,any>|null|undefined;
 const video=m?.video;
 return {
  syncOffset:video?.syncOffset==null?null:Number(video.syncOffset),
  source:String(video?.source||''),
  clips:Array.isArray(video?.clips)?video.clips:[]
 };
}
