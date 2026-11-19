/* V20.5.10 · An observable consumer inside the real Scouting LIVE boxscore.
 * Neither alters the native boxscore nor intercepts point/undo handlers.
 */
import {inspectLiveSetStatistics,type LiveSetStatistics} from './live-statistics';
import type {ObservableWindow} from './match-observable';

interface LiveStatisticsAPI{
 readonly version:'20.5.10';
 readonly readOnly:true;
 getReport:()=>Readonly<LiveSetStatistics>|null;
 refresh:()=>Readonly<LiveSetStatistics>;
 dispose:()=>void;
}
type LiveWindow=ObservableWindow&{VC_LIVE_STATS_20510?:Readonly<LiveStatisticsAPI>};

export function mountLiveStatisticsPanel(win:LiveWindow):Readonly<LiveStatisticsAPI>|null{
 const doc=win.document,host=doc.getElementById('vc20510-live-stats'),workspace=doc.getElementById('scout-workspace-v900'),
  phase=doc.getElementById('v900-phase-scout'),store=win.VC_STATE_2059;
 if(!host||!workspace||!phase||!store)return null;
 if(win.VC_LIVE_STATS_20510)return win.VC_LIVE_STATS_20510;
 const node=(tag:string,klass='',value='')=>{
  const el=doc.createElement(tag);el.className=klass;el.textContent=value;return el;
 };
 const status=node('div','vc20510-status','Esperando partido activo');status.setAttribute('role','status');
 const cards=node('div','vc20510-grid'),output=new Map<string,{value:HTMLElement;detail:HTMLElement}>();
 for(const [key,label] of [
  ['so','SIDE-OUT'],['bp','BREAK POINT'],['receive','RECEPCIÓN (+/#)'],['attack','EFICIENCIA ATAQUE']
 ]){
  const card=node('div','vc20510-metric'),labelNode=node('small','',label);
  const value=node('strong','','—'),detail=node('span','vc20510-metric-detail','Sin datos');
  card.append(labelNode,value,detail);cards.append(card);output.set(key,{value,detail});
 }
 const open=node('div','vc20510-open','Rally abierto: sin acciones');
 const note=node('p','vc20510-note','SO y BP solo incluyen rallies cerrados. La recepción y el ataque muestran una vista provisional si hay acciones del rally abierto.');
 host.append(status,cards,open,note);
 let disposed=false,pending=false,report:Readonly<LiveSetStatistics>|null=null;
 const active=()=>{
  for(const reader of [win.MatchState,win.VC_MATCH_STATE,win.VC_SCOUT_VIDEO_BRIDGE,win.VC_SCOUT_REPORT_BRIDGE]){
   try{const match=reader?.getActive?.();if(match&&typeof match==='object'&&!Array.isArray(match))return match;}
   catch(_){/* Leave native data and existing UI untouched. */}
  }
  return null;
 };
 const visible=()=>workspace.classList.contains('active')&&!phase.classList.contains('hidden');
 const setValue=(key:string,value:string,detail:string)=>{
  const target=output.get(key);if(!target)return;
  if(target.value.textContent!==value)target.value.textContent=value;
  if(target.detail.textContent!==detail)target.detail.textContent=detail;
 };
 const percentage=(value:number|null)=>value===null?'—':`${value}%`;
 const render=(data:Readonly<LiveSetStatistics>)=>{
  if(disposed)return;
  host.dataset.state=!data.available?'waiting':data.truncated?'partial':
   data.provisional.receptions||data.provisional.attacks?'provisional':'available';
  status.textContent=!data.available?'No hay un set activo con datos':
   `SET ${data.set} · ${data.completeRallies} rallies cerrados${data.truncated?' · CÁLCULO PARCIAL':''}`;
  setValue('so',percentage(data.sideOut.percent),`${data.sideOut.successes} ganados / ${data.sideOut.attempts} recepciones de saque`);
  setValue('bp',percentage(data.breakPoint.percent),`${data.breakPoint.successes} ganados / ${data.breakPoint.attempts} saques propios`);
  const liveReceive=data.provisional.receptions>0,liveAttack=data.provisional.attacks>0;
  const r=liveReceive?data.provisional.reception:data.reception;
  const a=liveAttack?data.provisional.attack:data.attack;
  setValue('receive',percentage(r.positivePct),`${r.positive}/${r.attempts} positivas${liveReceive?' · PROVISIONAL':''}`);
  setValue('attack',percentage(a.efficiencyPct),`${a.kills} puntos · ${a.errors+a.blocked} errores/bloqueos · ${a.attempts} intentos${liveAttack?' · PROVISIONAL':''}`);
  open.textContent=`Rally abierto: ${data.provisional.actions} acciones · ${data.provisional.receptions} recepciones · ${data.provisional.attacks} ataques (sin cerrar)`;
 };
 const refresh=()=>{
  const next=inspectLiveSetStatistics(active());report=next;
  if(visible())render(next);
  return next;
 };
 const schedule=()=>{
  if(disposed||pending||!visible())return;
  pending=true;
  Promise.resolve().then(()=>{pending=false;if(!disposed&&visible())refresh();});
 };
 const unsubscribe=store.subscribe('change',schedule);
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{
  if(visible())refresh();
 }):null;
 observer?.observe(workspace,{attributes:true,attributeFilter:['class']});
 observer?.observe(phase,{attributes:true,attributeFilter:['class']});
 if(visible())refresh();
 const api:Readonly<LiveStatisticsAPI>=Object.freeze({version:'20.5.10',readOnly:true,getReport:()=>report,refresh,
  dispose(){if(disposed)return;disposed=true;observer?.disconnect();unsubscribe();host.replaceChildren();report=null;
   if(win.VC_LIVE_STATS_20510===api)delete win.VC_LIVE_STATS_20510;}
 });
 win.VC_LIVE_STATS_20510=api;
 return api;
}
