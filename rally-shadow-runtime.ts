/* V20.5.15 · Gestión-only live display of delayed, passive rally comparisons.
 * Native notifications are coalesced; no parser, writer or history scan.
 */
import {createRallyShadowSession,type RallyShadowReport} from './rally-shadow';
import {readCanonicalMatch,type CanonicalMatchWindow} from '../state/match-state-contract';
import type {ObservableMatchStore} from '../state/match-observable';

interface RallyShadowAPI{
 readonly version:'20.5.15';
 readonly readOnly:true;
 readonly getReport:()=>Readonly<RallyShadowReport>;
 readonly clearReport:()=>void;
 readonly dispose:()=>void;
}
type ShadowWindow=CanonicalMatchWindow&{
 VC_SHADOW_20515?:Readonly<RallyShadowAPI>;
 VC_STATE_2059?:Readonly<ObservableMatchStore>;
};

export function mountRallyShadowPanel(win:ShadowWindow):Readonly<RallyShadowAPI>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_SHADOW_20515)return win.VC_SHADOW_20515;
 const session=createRallyShadowSession();
 // One constant-time baseline read. Existing rallies are not counted as events.
 session.observe(readCanonicalMatch(win));
 const node=(tag:string,klass='',value='')=>{
  const element=doc.createElement(tag);element.className=klass;element.textContent=value;return element;
 };
 const section=node('section','vc20515-shadow');section.id='vc20515-shadow';
 const heading=node('div','vc20515-heading'),title=node('div');
 title.append(node('small','','COMPARADOR PASIVO · V20.5.15'),node('h3','','Contraste de puntos y deshacer'));
 heading.append(title,node('span','','Solo lectura'));
 const description=node('p','','Escucha los cambios del motor original y contrasta el último rally con las reglas TypeScript. No interviene en el registro ni en la sincronización.');
 const status=node('p','vc20515-status','Esperando nuevos rallies');status.setAttribute('role','status');
 const stats=node('div','vc20515-stats'),fields=new Map<string,HTMLElement>();
 for(const [key,label] of [['observed','Operaciones comparadas'],['agree','Coincidencias'],
  ['difference','Diferencias'],['unverified','Sin verificar'],['skipped','Cambios omitidos']]){
  const box=node('div');box.append(node('small','',label));
  const value=node('strong','','0');fields.set(key,value);box.append(value);stats.append(box);
 }
 const actions=node('div','vc20515-actions');
 const update=node('button','','Actualizar informe') as HTMLButtonElement;update.type='button';
 const clear=node('button','','Limpiar contadores') as HTMLButtonElement;clear.type='button';
 actions.append(update,clear);
 const recent=node('div','vc20515-recent');
 const areaLabels:Record<string,string>={score:'Marcador',service:'Saque',rotation:'Rotación',set:'Set',
  match:'Partido',actions:'Acciones',lineup:'Alineación',video:'Vídeo','missing-data':'Datos insuficientes',
  'not-native-undo':'Deshacer no confirmado'};
 const verdictLabels={agree:'Coincide',difference:'Diferencia',unverified:'Sin verificar'};
 section.append(heading,description,status,stats,actions,node('h4','','Últimas comprobaciones a revisar'),recent,
  node('p','vc20515-note','Solo compara nuevos cambios observados desde que abriste la aplicación. Las correcciones, los cambios de partido y los saltos de historial se omiten; una diferencia no demuestra un problema de nube.'));
 const anchor=doc.getElementById('vc2059-observable')||doc.getElementById('vc2057-committed');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.append(section);

 let disposed=false,pending=false,timer:number|null=null;
 const render=()=>{
  if(disposed)return;
  const report=session.snapshot(),counts=report.counters;
  section.dataset.state=counts.difference?'review':counts.unverified?'partial':'available';
  status.textContent=!counts.observed?'Esperando nuevos rallies confirmados':
   counts.difference?`${counts.difference} diferencias para revisar`:
   counts.unverified?`${counts.unverified} operaciones sin datos suficientes`:
   `${counts.agree} operaciones coincidentes`;
  for(const [key,target] of fields){
   const value=String(counts[key as keyof typeof counts]);
   if(target.textContent!==value)target.textContent=value;
  }
  recent.replaceChildren();
  if(!report.recent.length)recent.append(node('p','','Sin incidencias registradas en esta sesión.'));
  else for(const finding of report.recent.slice(-6).reverse()){
   const item=node('div','vc20515-finding');
   const operation=finding.operation==='point'?'Punto':'Deshacer';
   item.append(node('strong','',`${operation} · ${verdictLabels[finding.verdict]}`),
    node('span','',finding.areas.map(area=>areaLabels[area]||area).join(', ')));recent.append(item);
  }
 };
 const observe=()=>{
  if(disposed)return;
  session.observe(readCanonicalMatch(win));
  if(host.classList.contains('active'))render();
 };
 const schedule=()=>{
  if(disposed||pending)return;
  pending=true;
  timer=win.setTimeout(()=>{pending=false;timer=null;observe();},0);
 };
 let stop=()=>{},legacyDom=false;
 if(win.VC_STATE_2059)stop=win.VC_STATE_2059.subscribe('change',schedule);
 else{
  legacyDom=true;doc.addEventListener('vc:matchstatechange',schedule);
  try{const unsubscribe=(win.MatchState||win.VC_MATCH_STATE)?.subscribe?.(schedule);
   if(typeof unsubscribe==='function')stop=unsubscribe;}
  catch(_){/* Document event is the fallback. */}
 }
 update.addEventListener('click',render);
 clear.addEventListener('click',()=>{session.clear();render();});
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{
  if(host.classList.contains('active'))render();
 }):null;
 observer?.observe(host,{attributes:true,attributeFilter:['class']});
 if(host.classList.contains('active'))render();
 const api:Readonly<RallyShadowAPI>=Object.freeze({version:'20.5.15',readOnly:true,
  getReport:session.snapshot,clearReport(){session.clear();render();},
  dispose(){if(disposed)return;disposed=true;
   if(timer!==null)win.clearTimeout(timer);timer=null;pending=false;
   observer?.disconnect();stop();if(legacyDom)doc.removeEventListener('vc:matchstatechange',schedule);
   session.dispose();section.remove();if(win.VC_SHADOW_20515===api)delete win.VC_SHADOW_20515;
  }
 });
 win.VC_SHADOW_20515=api;
 return api;
}
