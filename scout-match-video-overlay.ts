/* V20.5.51 · Pure V7.0 video metadata overlay, applied only after V6.10.2.
 * Match finalization, recordings, rally timestamps and saved state stay native.
 */
export interface MatchVideoOverlay{
 syncOffset:number|null;
 source:string;
 fileSize:number;
 lastModified:number;
 mimeType:string;
 duration:number|null;
 syncedAt:string|null;
 anchor:object|null;
 preRoll:number;
 postRoll:number;
 clips:unknown[];
}

export function normalizeMatchVideoOverlay(input:unknown,normalized:unknown):MatchVideoOverlay{
 const m=input as Record<string,any>|null|undefined;
 const x=normalized as Record<string,any>|null|undefined;
 const raw=m?.video&&typeof m.video==='object'?m.video:{};
 const earlier=x?.video;
 const clips=raw.clips||earlier?.clips;
 return {
  syncOffset:raw.syncOffset==null?earlier?.syncOffset??null:Number(raw.syncOffset),
  source:String(raw.source||earlier?.source||''),
  fileSize:Math.max(0,Number(raw.fileSize)||0),
  lastModified:Math.max(0,Number(raw.lastModified)||0),
  mimeType:String(raw.mimeType||''),
  duration:raw.duration==null?null:Number(raw.duration),
  syncedAt:raw.syncedAt?String(raw.syncedAt):null,
  anchor:raw.anchor&&typeof raw.anchor==='object'?raw.anchor:null,
  preRoll:Math.max(0,Number(raw.preRoll??2)),
  postRoll:Math.max(0,Number(raw.postRoll??2)),
  clips:Array.isArray(clips)?clips:[]
 };
}
