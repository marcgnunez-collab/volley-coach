/* V20.5.6 · Passive diagnostic of existing preflight events. */
import {createShadowSession,type ShadowSnapshot} from './shadow-validation';

interface ShadowAPI{
 readonly version:'20.5.6';
 readonly readOnly:true;
 readonly getReport:()=>Readonly<ShadowSnapshot>;
 readonly clearReport:()=>void;
 readonly dispose:()=>void;
}
type ShadowWindow=Window&{VC_SHADOW_2056?:Readonly<ShadowAPI>};

export function mountShadowPanel(win:ShadowWindow):Readonly<ShadowAPI>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_SHADOW_2056)return win.VC_SHADOW_2056;
 const session=createShadowSession();
 const node=(tag:string,className='',content='')=>{
  const element=doc.createElement(tag);element.className=className;element.textContent=content;return element;
 };
 const section=node('section','vc2056-shadow');section.id='vc2056-shadow';
 const heading=node('div','vc2056-heading');
 const title=node('div');title.append(node('small','','VALIDACIÓN PARALELA · V20.5.6'),node('h3','','Comparación de códigos · sesión actual'));
 heading.append(title,node('span','','Sin modificar scouting'));
 section.append(heading,node('p','','Compara los borradores ya revisados por el motor nativo con el módulo TypeScript, sin volver a ejecutar el parser.'));
 const stats=node('div','vc2056-stats'),values=new Map<string,HTMLElement>();
 const keys:[string,string][]=[['total','Borradores vistos'],['agree','Coincidencias'],['coverageGap','Cobertura pendiente'],
  ['difference','Diferencias'],['nativeReject','Rechazos nativos'],['unverified','Sin comparar']];
 for(const [key,label] of keys){
  const item=node('div');item.append(node('small','',label));
  const value=node('strong','','0');values.set(key,value);item.append(value);stats.append(item);
 }
 section.append(stats);
 const actions=node('div','vc2056-actions');
 const refresh=node('button','','Actualizar informe');refresh.setAttribute('type','button');
 const download=node('button','','Descargar informe JSON');download.setAttribute('type','button');
 const clear=node('button','','Limpiar sesión');clear.setAttribute('type','button');
 actions.append(refresh,download,clear);section.append(actions);
 const recentHeading=node('h4','','Últimas incidencias de análisis');
 const recent=node('div','vc2056-recent');section.append(recentHeading,recent);
 section.append(node('p','vc2056-note','Solo se recopilan diferencias de previsualización; no se almacenan códigos, dorsales, nombres ni datos en la nube. Una cobertura pendiente no significa un código erróneo.'));
 const anchor=doc.getElementById('vc2055-domain');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.insertAdjacentElement('afterbegin',section);

 const render=()=>{
  const report=session.snapshot(),counts=report.counters;
  const entries:Record<string,number>={total:counts.total,agree:counts.agree,coverageGap:counts.coverageGap,
   difference:counts.difference,nativeReject:counts.nativeReject,unverified:counts.unverified};
  for(const [key,value] of Object.entries(entries)){
   const target=values.get(key);if(target&&target.textContent!==String(value))target.textContent=String(value);
  }
  section.dataset.state=counts.difference?'review':'normal';
  recent.replaceChildren();
  const last=report.recent.slice(-5).reverse();
  if(!last.length)recent.append(node('p','','Todavía no hay incidencias de previsualización.'));
  else for(const finding of last){
   const line=node('div','vc2056-finding');
   line.append(node('strong','',finding.kind),node('span','',`${finding.source} · ${finding.skill} · ${finding.reason}`));
   recent.append(line);
  }
 };
 let pending=false,disposed=false;
 const schedule=()=>{
  if(disposed||pending||!host.classList.contains('active'))return;
  pending=true;Promise.resolve().then(()=>{pending=false;if(!disposed)render();});
 };
 const preflight=(event:Event)=>{
  if(disposed)return;
  session.record((event as CustomEvent<unknown>).detail);
  schedule();
 };
 doc.addEventListener('vc:scout-code-preflight',preflight);
 refresh.addEventListener('click',render);
 clear.addEventListener('click',()=>{session.clear();render();});
 download.addEventListener('click',()=>{
  const report=session.snapshot();
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=doc.createElement('a');
  link.href=url;link.download='volley-coach-v2056-comparacion-codigos.json';
  doc.body.appendChild(link);link.click();link.remove();
  win.setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 const observer=typeof MutationObserver==='function'?new MutationObserver(schedule):null;
 observer?.observe(host,{attributes:true,attributeFilter:['class']});
 if(host.classList.contains('active'))render();
 const api:Readonly<ShadowAPI>=Object.freeze({
  version:'20.5.6',readOnly:true,
  getReport:()=>session.snapshot(),
  clearReport:()=>{session.clear();render();},
  dispose:()=>{
   if(disposed)return;
   disposed=true;observer?.disconnect();doc.removeEventListener('vc:scout-code-preflight',preflight);
   section.remove();if(win.VC_SHADOW_2056===api)delete win.VC_SHADOW_2056;
  }
 });
 win.VC_SHADOW_2056=api;
 return api;
}
