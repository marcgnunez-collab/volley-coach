/* V20.6.4 · On-demand support check; never connects, syncs or saves. */
import {inspectRuntimeHealth,type RuntimeHealthWindow,type RuntimeHealthReport} from './runtime-health';

export interface RuntimeHealthBridge{
 readonly VERSION:'20.6.4';
 readonly readOnly:true;
 readonly inspect:()=>Readonly<RuntimeHealthReport>;
}
export type RuntimeHealthPanelWindow=RuntimeHealthWindow&{
 VC_RUNTIME_HEALTH_2064?:Readonly<RuntimeHealthBridge>;
};
const installed=new WeakMap<Window,Readonly<RuntimeHealthBridge>>();
const mounted=new WeakSet<HTMLElement>();

export function installRuntimeHealthBridge(win:RuntimeHealthPanelWindow):Readonly<RuntimeHealthBridge>{
 const old=installed.get(win);if(old)return old;
 const api:Readonly<RuntimeHealthBridge>=Object.freeze({VERSION:'20.6.4',readOnly:true,
  inspect:()=>inspectRuntimeHealth(win)});
 installed.set(win,api);
 const published=win.VC_RUNTIME_HEALTH_2064;
 if(!published||published.VERSION!=='20.6.4'||published.readOnly!==true||
  typeof published.inspect!=='function')win.VC_RUNTIME_HEALTH_2064=api;
 return api;
}

/** Attach only the explicit Gestion click; no heartbeat, subscriptions or IO. */
export function mountRuntimeHealthPanel(win:RuntimeHealthPanelWindow):Readonly<RuntimeHealthBridge>|null{
 const button=win.document.getElementById('vc2064-check') as HTMLButtonElement|null;
 const output=win.document.getElementById('vc2064-status');
 if(!button||!output)return null;
 const bridge=installRuntimeHealthBridge(win);
 if(mounted.has(button))return bridge;
 mounted.add(button);
 button.addEventListener('click',()=>{
  const report=bridge.inspect();
  const boot=report.bootstrap==='ready'?'Listo':report.bootstrap==='failed'?'Falló':
   report.bootstrap==='waiting'?'Iniciando':'No disponible';
  const scout=report.scouting.active?'Partido activo':'Sin partido activo';
  const video=report.video.moduleAvailable?'Módulo disponible':'Módulo no detectado';
  const cloud=report.sync.cloudConnected===true&&report.sync.realtimeSubscribed===true?
   'Conectada a Realtime':report.sync.cloudConnected===false||report.sync.realtimeSubscribed===false?
   'Desconectada':'Estado no verificado';
  const peers=report.sync.otherDevices===null?'—':String(report.sync.otherDevices);
  output.textContent=`Arranque: ${boot} · Scouting: ${scout} · Vídeo: ${video} · Nube: ${cloud} · Otros dispositivos: ${peers}`+
   (report.warnings.length?` · Avisos: ${report.warnings.join(' ')}`:'');
  output.dataset.state=report.overall;
 });
 return bridge;
}
