/* Volley Coach V19.1.6 · Deshacer rally = cambio reversible sincronizable.
   La fusión con nube confirmada se resuelve en el motor original V19.1.6.
   Aquí solo se asegura notificación de operaciones antiguas que no pasan por
   la interfaz MatchState. Nunca se escribe directamente a Supabase. */
(function(root){
  'use strict';
  if(!root||typeof root.scoutUndoRally!=='function')return;
  const original=root.scoutUndoRally;
  if(original.__vc1916Undo)return;
  const count=m=>Array.isArray(m?.sets)?m.sets.reduce((n,s)=>n+(Array.isArray(s?.rallies)?s.rallies.length:0),0):0;
  const active=()=>root.MatchState?.getActive?.()||root.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null;
  const wrapped=function(...args){
    const before=active(),id=before?.id,prior=count(before),priorRevision=Number(root.MatchState?.revision)||0;
    const currentSet=(before?.sets||[]).find(s=>Number(s.number)===Number(before?.currentSet))||before?.sets?.at?.(-1);
    const removed=currentSet?.rallies?.at?.(-1),previousSetCount=currentSet?.rallies?.length||0,setNumber=Number(currentSet?.number)||Number(before?.currentSet)||1;
    const result=original.apply(this,args);
    const after=active();
    if(!id||!removed||String(after?.id)!==String(id)||count(after)!==prior-1)return result;
    // Intención explícita: permite que V19.1.5 distinga una reversión causal
    // de una pérdida accidental cuando la subida del punto original aún está en curso.
    after.vc1916UndoIntent={setNumber,rallyId:String(removed.id),previousCount:previousSetCount,afterCount:previousSetCount-1,at:new Date().toISOString()};
    try{root.VC_SCOUT_VIDEO_BRIDGE?.save?.()}catch(err){console.warn('V19.1.6: metadatos de undo pendientes de guardar',err)}
    // El diario original ya escribe el cambio inmediatamente. Antes de
    // notificar a otros dispositivos, confirmar también la copia principal.
    Promise.resolve().then(()=>root.scoutV902Flush?.()).then(()=>{
      if(String(active()?.id)!==String(id))return;
      const state=root.MatchState;
      if(Number(state?.revision)===priorRevision){
        const emitted=state?.sync?.('score:undo');
        if(!emitted)root.VC_DEVICE_SYNC?.broadcast?.('score:undo');
      }
    }).catch(err=>console.warn('V19.1.6: undo guardado local, pendiente de anunciar',err));
    return result;
  };
  wrapped.__vc1916Undo=true;
  root.scoutUndoRally=wrapped;
  root.VC_V1916_SCOUT_SYNC={version:'19.1.6',undoRealtime:true,cloudAuthoritativeUndo:true};
})(typeof window!=='undefined'?window:null);
