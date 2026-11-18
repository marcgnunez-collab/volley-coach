/* Volley Coach V20.5.3 · First live ES module consumer.
 * Diagnostic and match-workspace read-only view, fed by the one canonical match.
 */
import {createMatchReader,READER_VERSION} from './vc2053-match-reader.mjs';

export function formatProjection(projection){
 if(projection?.state!=='available')return Object.freeze({state:'waiting',caption:'Sin partido seleccionado',sets:'—',rallies:'—',actions:'—',verified:'—',unknown:'—'});
 return Object.freeze({
  state:'connected',caption:'Partido conectado al estado original',
  sets:String(projection.sets),rallies:String(projection.rallies),actions:String(projection.actions),
  verified:String(projection.scoreTraces.verified),unknown:String(projection.scoreTraces.unknown),
  inconsistent:String(projection.scoreTraces.inconsistent)
 });
}

export function mountModularCore(win){
 const doc=win?.document;
 if(!doc)return null;
 if(win.VC_MODULAR_CORE_2053)return win.VC_MODULAR_CORE_2053;
 const reader=createMatchReader(win);
 const make=(tag,cls,text)=>{
  const node=doc.createElement(tag);
  if(cls)node.className=cls;
  if(text!=null)node.textContent=text;
  return node;
 };
 const management=doc.getElementById('v11-management');
 let panel=doc.getElementById('vc2053-modular-core');
 if(management&&!panel){
  panel=make('section','vc2053-core');panel.id='vc2053-modular-core';
  const top=make('div','vc2053-core-heading');
  const title=make('div');title.append(make('small','','ARQUITECTURA · V20.5.3'),make('h3','','Núcleo modular ES6'));
  const tag=make('span','vc2053-readonly','Solo lectura');
  top.append(title,tag);
  const description=make('p','','El primer módulo ES6 ya lee el mismo partido que el scouting. No guarda, cambia puntuaciones ni sincroniza datos.');
  const status=make('p','vc2053-status');status.id='vc2053-core-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const counters=make('div','vc2053-counters');
  for(const [key,label] of [['sets','Sets registrados'],['rallies','Rallies cerrados'],['actions','Acciones cerradas'],['verified','Trazas verificadas'],['unknown','Trazas sin datos']]){
   const item=make('div');item.append(make('small','',label));
   const value=make('strong','', '—');value.dataset.vc2053Value=key;item.append(value);counters.append(item);
  }
  const foot=make('p','vc2053-foot','Los contadores proceden del partido existente. Una traza sin datos no se supone válida; esta pantalla no comprueba la recepción en otros dispositivos.');
  const button=make('button','vc2053-refresh','Comprobar conexión del módulo');button.type='button';
  button.addEventListener('click',()=>{
   reader.refresh();render(reader.getSnapshot());
   button.textContent=reader.getSnapshot().state==='available'?'Lectura del partido actualizada':'Módulo operativo · sin partido';
  });
  panel.append(top,description,status,counters,button,foot);
  const anchor=doc.getElementById('vc2052-foundation');
  if(anchor?.parentNode===management)anchor.insertAdjacentElement('afterend',panel);
  else management.insertAdjacentElement('afterbegin',panel);
 }

 const createLiveIndicator=()=>{
  let element=doc.getElementById('vc2053-match-indicator');
  if(element)return element;
  const secondary=doc.querySelector('#vc2020-matchbar .vc2020-secondary');
  if(!secondary)return null;
  element=make('span','vc2053-live-indicator','ES6 · esperando partido');
  element.id='vc2053-match-indicator';element.setAttribute('role','status');
  element.title='Lectura modular del partido canónico; no registra ni guarda acciones.';
  secondary.append(element);
  return element;
 };
 const setText=(key,value)=>{
  const node=panel?.querySelector?.(`[data-vc2053-value="${key}"]`);
  if(node&&node.textContent!==value)node.textContent=value;
 };
 const render=projection=>{
  const view=formatProjection(projection);
  if(panel){
   const status=doc.getElementById('vc2053-core-status');
   if(status)status.textContent=view.caption;
   panel.dataset.state=view.state;
   for(const key of ['sets','rallies','actions','verified','unknown'])setText(key,view[key]);
  }
  const live=createLiveIndicator();
  if(live){
   live.dataset.state=view.state;
   live.textContent=view.state==='connected'?`ES6 conectado · ${view.rallies} rallies`:'ES6 · sin partido';
  }
 };
 const stop=reader.subscribe(render);
 // The legacy workspace creates its matchbar dynamically on boot. Observe only
 // until the indicator appears; no permanent global DOM observer is installed.
 let observer=null;
 if(!doc.getElementById('vc2053-match-indicator')&&win.MutationObserver){
  const host=doc.getElementById('scout-match-mode');
  if(host){
   observer=new win.MutationObserver(()=>{
    if(createLiveIndicator()){render(reader.getSnapshot());observer?.disconnect();observer=null;}
   });
   observer.observe(host,{childList:true,subtree:true});
  }
 }
 const api=Object.freeze({
  version:READER_VERSION,readOnly:true,
  getSnapshot:()=>reader.getSnapshot(),
  refresh:()=>{const value=reader.refresh();render(value);return value;},
  diagnostics:()=>reader.diagnostics(),
  dispose:()=>{stop();observer?.disconnect();reader.dispose();if(win.VC_MODULAR_CORE_2053===api)delete win.VC_MODULAR_CORE_2053;}
 });
 win.VC_MODULAR_CORE_2053=api;
 return api;
}

if(typeof window!=='undefined'&&window.document){
 if(window.document.readyState==='loading')window.document.addEventListener('DOMContentLoaded',()=>mountModularCore(window),{once:true});
 else mountModularCore(window);
}
