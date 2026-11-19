/* V20.5.7 · Gestión-only audit of committed scouting state.
 * Changes merely invalidate a report; no scan or parser runs on the live path.
 */
import {auditCommittedMatch,type CommittedAuditReport} from './committed-audit';
import {asRecord} from './model';

interface ReadOnlyMatchSource{
 getActive?:()=>unknown;
 subscribe?:(callback:()=>void)=>(()=>void)|void;
}
interface CommittedAPI{
 readonly version:'20.5.7';
 readonly readOnly:true;
 readonly getReport:()=>Readonly<CommittedAuditReport>|null;
 readonly runAudit:()=>Readonly<CommittedAuditReport>;
 readonly dispose:()=>void;
}
type CommittedWindow=Window&{
 MatchState?:ReadOnlyMatchSource;
 VC_MATCH_STATE?:ReadOnlyMatchSource;
 VC_SCOUT_VIDEO_BRIDGE?:ReadOnlyMatchSource;
 VC_SCOUT_REPORT_BRIDGE?:ReadOnlyMatchSource;
 VC_COMMITTED_2057?:Readonly<CommittedAPI>;
};

export function mountCommittedPanel(win:CommittedWindow):Readonly<CommittedAPI>|null{
 const doc=win.document,host=doc.getElementById('v11-management');
 if(!host)return null;
 if(win.VC_COMMITTED_2057)return win.VC_COMMITTED_2057;
 const node=(tag:string,className='',value='')=>{
  const item=doc.createElement(tag);item.className=className;item.textContent=value;return item;
 };
 const section=node('section','vc2057-committed');section.id='vc2057-committed';
 const heading=node('div','vc2057-heading'),title=node('div');
 title.append(node('small','','ACCIONES CONFIRMADAS · V20.5.7'),node('h3','','Auditoría del scouting registrado'));
 heading.append(title,node('span','','Solo lectura'));
 const description=node('p','','Comprueba códigos ya presentes en el partido, puntuación y continuidad de rotaciones. No añade ni corrige jugadas.');
 const status=node('p','vc2057-status','Pendiente de comprobar');status.setAttribute('role','status');
 const stats=node('div','vc2057-stats'),fields=new Map<string,HTMLElement>();
 const keys:[string,string][]=[
  ['actions','Acciones examinadas'],['agree','Coincidencias'],['difference','Diferencias'],
  ['coverageGap','Cobertura pendiente'],['unverified','Sin verificar'],['noCode','Sin código'],
  ['rallies','Rallies'],['scoreInconsistent','Marcadores inconsistentes'],
  ['scoreLinksMismatch','Continuidad de tanteo'],['rotationsMismatch','Rotaciones a revisar']
 ];
 for(const [key,label] of keys){
  const item=node('div');item.append(node('small','',label));
  const value=node('strong','','—');fields.set(key,value);item.append(value);stats.append(item);
 }
 const actions=node('div','vc2057-actions');
 const check=node('button','','Comprobar partido') as HTMLButtonElement;check.setAttribute('type','button');
 const download=node('button','','Descargar informe JSON') as HTMLButtonElement;download.setAttribute('type','button');download.disabled=true;
 actions.append(check,download);
 const recentHeading=node('h4','','Incidencias que conviene revisar');
 const recent=node('div','vc2057-recent');
 section.append(heading,description,status,stats,actions,recentHeading,recent,
  node('p','vc2057-note','La lectura se realiza únicamente al pulsar «Comprobar partido». No valida la nube ni aplica reglas arbitrales completas. Los códigos y dorsales no aparecen en el informe.'));
 const anchor=doc.getElementById('vc2056-shadow')||doc.getElementById('vc2055-domain');
 if(anchor?.parentNode===host)anchor.insertAdjacentElement('afterend',section);
 else host.insertAdjacentElement('afterbegin',section);

 let report:Readonly<CommittedAuditReport>|null=null,stale=false,disposed=false,generation=0;
 const currentMatch=()=>{
  for(const reader of [win.MatchState,win.VC_MATCH_STATE,win.VC_SCOUT_VIDEO_BRIDGE,win.VC_SCOUT_REPORT_BRIDGE]){
   try{const match=reader?.getActive?.();if(asRecord(match))return match;}catch(_){/* Legacy source unavailable. */}
  }
  return null;
 };
 const render=()=>{
  if(disposed)return;
  if(!report){status.textContent='Pendiente de comprobar';section.dataset.state='waiting';}
  else if(stale){status.textContent='El partido ha cambiado. Repite la comprobación para actualizar el informe.';section.dataset.state='stale';}
  else if(!report.matchAvailable){status.textContent='No hay un partido activo que comprobar.';section.dataset.state='waiting';}
  else if(report.truncated){status.textContent='Comprobación parcial: se alcanzó el límite de seguridad.';section.dataset.state='partial';}
  else{status.textContent='Acciones del estado local examinadas; no implica confirmación en nube.';
   section.dataset.state=report.counters.difference||report.counters.scoreInconsistent||report.counters.scoreLinksMismatch||report.counters.rotationsMismatch?'review':'available';}
  download.disabled=!report||stale||!report.matchAvailable;
  for(const [key,target] of fields){
   const count=report?.counters[key as keyof CommittedAuditReport['counters']];
   const value=count===undefined?'—':String(count);
   if(target.textContent!==value)target.textContent=value;
  }
  recent.replaceChildren();
  const last=report?.recent.slice(-8).reverse()||[];
  if(!last.length)recent.append(node('p','',report?'Sin incidencias en los registros examinados.':'Ejecuta la comprobación para revisar el partido abierto.'));
  else for(const finding of last){
   const line=node('div','vc2057-finding');
   line.append(node('strong','',finding.location),node('span','',finding.reason));
   recent.append(line);
  }
 };
 const runAudit=()=>{
  const next=auditCommittedMatch(currentMatch());
  report=next;stale=false;render();return next;
 };
 const invalidate=()=>{
  if(disposed)return;
  generation++;
  if(report&&!stale){stale=true;status.textContent='El partido ha cambiado. Repite la comprobación para actualizar el informe.';section.dataset.state='stale';download.disabled=true;}
 };
 check.addEventListener('click',()=>{
  if(disposed)return;
  const token=++generation;
  status.textContent='Comprobando los registros locales…';check.disabled=true;
  win.setTimeout(()=>{
   if(disposed||token!==generation){check.disabled=false;render();return;}
   try{runAudit();}catch(_){status.textContent='No se pudo completar la comprobación; el partido permanece intacto.';}
   finally{check.disabled=false;}
  },0);
 });
 download.addEventListener('click',()=>{
  if(disposed||!report||stale||!report.matchAvailable)return;
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=doc.createElement('a');
  link.href=url;link.download='volley-coach-v2057-auditoria-acciones.json';
  doc.body.appendChild(link);link.click();link.remove();
  win.setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 doc.addEventListener('vc:matchstatechange',invalidate);
 let unsubscribe=()=>{};
 try{const stop=(win.MatchState||win.VC_MATCH_STATE)?.subscribe?.(invalidate);if(typeof stop==='function')unsubscribe=stop;}
 catch(_){/* DOM event fallback. */}
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{if(host.classList.contains('active'))render();}):null;
 observer?.observe(host,{attributes:true,attributeFilter:['class']});
 if(host.classList.contains('active'))render();
 const api:Readonly<CommittedAPI>=Object.freeze({version:'20.5.7',readOnly:true,getReport:()=>report,runAudit,
  dispose(){if(disposed)return;disposed=true;generation++;observer?.disconnect();unsubscribe();
   doc.removeEventListener('vc:matchstatechange',invalidate);section.remove();report=null;
   if(win.VC_COMMITTED_2057===api)delete win.VC_COMMITTED_2057;}
 });
 win.VC_COMMITTED_2057=api;
 return api;
}
