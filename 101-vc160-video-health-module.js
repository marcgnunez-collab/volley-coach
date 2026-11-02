
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 function report(){
   const safe=fn=>{try{return fn()||{}}catch(_){return{}}};
   const delay=safe(()=>window.liveDelayDiagnostics?.());
   const remote=safe(()=>window.VC_REMOTE_CAMERA?.diagnostics?.());
   const rec=safe(()=>window.vcRecordingDiagnostics?.());
   return {version:'16.0.0',delay,remote,recording:{active:!!rec.active,mode:rec.mode||'',bytes:rec.bytes||0,stopping:!!rec.stopping,writeError:rec.writeError||null,recorderError:rec.recorderError||null,healthActive:!!rec.healthActive,liveFrames:rec.liveFrames||null},time:new Date().toISOString()};
 }
 function render(){
   if(!$('live-delay-modal')?.classList.contains('open'))return;
   const d=report();
   const age=d.delay.lastChunkAgeMs;
   const v=$('vc160-health-remote');if(v)v.textContent=d.remote.connected?'Cámara remota: conectada':d.remote.viewerWanted?'Cámara remota: esperando/reconectando':'Cámara remota: desconectada';
   const dl=$('vc160-health-delay');if(dl)dl.textContent=!d.delay.running?'Delay: detenido':age!=null&&age>7000?'Delay: señal sin fragmentos nuevos':`Delay: activo · ${Math.round(d.delay.actualDelay||0)} s reales`;
   const r=$('vc160-health-rec');if(r)r.textContent=d.recording.active?`REC: activo · ${d.recording.mode||'—'}${d.recording.writeError?' · ERROR DE GUARDADO':''}`:'REC: detenido';
   const q=$('vc160-health-queue');if(q)q.textContent=`Cola delay: ${d.delay.queuedChunks||0} fragmentos · ${Math.round((d.delay.queuedBytes||0)/1024/1024*10)/10} MB`;
 }
 window.VC_VIDEO_V160={version:'16.0.0',diagnostics:report};
 window.vc160CopyDiagnostics=async function(){
   const data=JSON.stringify(report(),null,2);
   try{await navigator.clipboard.writeText(data);alert('Diagnóstico copiado. No contiene claves de conexión ni datos personales del partido.');}
   catch(_){window.prompt('Copia el diagnóstico:',data)}
 };
 setInterval(render,1500);
 document.addEventListener('visibilitychange',render);
})();
