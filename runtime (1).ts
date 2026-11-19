/* V20.5.9 · A compact Gestión-only view of the common observable selectors. */
import {createObservableMatchStore,type ObservableMatchStore,type ObservableWindow} from './match-observable';

export function mountObservablePanel(win:ObservableWindow):Readonly<ObservableMatchStore>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_STATE_2059)return win.VC_STATE_2059;
 const store=createObservableMatchStore(win);
 const node=(tag:string,klass='',value='')=>{
  const element=doc.createElement(tag);element.className=klass;element.textContent=value;return element;
 };
 const section=node('section','vc2059-observable');section.id='vc2059-observable';
 const heading=node('div','vc2059-heading'),title=node('div');
 title.append(node('small','','ESTADO OBSERVABLE · V20.5.9'),node('h3','','Lectura unificada del partido'));
 heading.append(title,node('span','','Solo lectura'));
 const description=node('p','','Marcador, saque y rotaciones proceden del partido original. Las actualizaciones se agrupan y solo se avisa a cada consumidor cuando cambian sus datos.');
 const status=node('p','vc2059-status','Esperando partido activo');status.setAttribute('role','status');
 const metrics=node('div','vc2059-metrics'),fields=new Map<string,HTMLElement>();
 for(const [key,label] of [
  ['score','Marcador del set'],['serve','Saque'],['court','Rotaciones'],
  ['rallies','Rallies del set'],['actions','Acciones del rally'],['updates','Actualizaciones selectivas']
 ]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','—');box.append(value);metrics.append(box);fields.set(key,value);
 }
 const button=node('button','vc2059-refresh','Actualizar lectura') as HTMLButtonElement;button.type='button';
 section.append(heading,description,status,metrics,button,
  node('p','vc2059-note','Esta vista no corrige el tanteo, no controla sustituciones y no confirma la recepción en la nube. No contiene otro motor de partido.'));
 const anchor=doc.getElementById('vc2058-grammar')||doc.getElementById('vc2057-committed');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.append(section);
 let disposed=false,pending=false;
 const value=(key:string,content:string)=>{const el=fields.get(key);if(el&&el.textContent!==content)el.textContent=content;};
 const render=()=>{
  if(disposed)return;
  const data=store.getSnapshot(),diagnostics=store.diagnostics();
  section.dataset.state=data.status.matchAvailable?'available':'waiting';
  status.textContent=data.status.matchAvailable?`Partido activo · set ${data.score.set??'—'}`:'No hay partido activo';
  value('score',data.score.us===null||data.score.opponent===null?'—':`${data.score.us} : ${data.score.opponent}`);
  value('serve',data.court.serving==='ours'?'Propio':data.court.serving==='opponent'?'Rival':'—');
  value('court',data.court.rotationUs===null||data.court.rotationOpponent===null?'—':`R${data.court.rotationUs} · Rival R${data.court.rotationOpponent}`);
  value('rallies',data.rally.completed===null?'—':String(data.rally.completed));
  value('actions',data.rally.liveActions===null?'—':String(data.rally.liveActions));
  value('updates',String(diagnostics.updates));
 };
 const schedule=()=>{
  if(disposed||pending||!host.classList.contains('active'))return;
  pending=true;Promise.resolve().then(()=>{pending=false;render();});
 };
 const stops=[store.subscribe('score',schedule),store.subscribe('court',schedule),
  store.subscribe('rally',schedule),store.subscribe('status',schedule)];
 button.addEventListener('click',()=>{store.refresh();render();});
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{
  if(host.classList.contains('active')){store.refresh();render();}
 }):null;
 observer?.observe(host,{attributes:true,attributeFilter:['class']});
 if(host.classList.contains('active'))render();
 const originalDispose=store.dispose;
 const api:Readonly<ObservableMatchStore>=Object.freeze({...store,dispose(){
  if(disposed)return;disposed=true;observer?.disconnect();for(const stop of stops)stop();
  section.remove();originalDispose();if(win.VC_STATE_2059===api)delete win.VC_STATE_2059;
 }});
 win.VC_STATE_2059=api;
 return api;
}
