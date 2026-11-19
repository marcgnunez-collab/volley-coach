/* V20.5.11 · Professional player and rotation boxscore in Scouting → Analizar.
 * Subscribes to the existing observable hub; native stats/video remain intact.
 */
import {inspectPlayerBoxscore,type BoxscoreFilters,type PlayerBoxscore} from './player-boxscore';
import type {Rotation,Team} from '../domain/model';
import type {ObservableWindow} from './match-observable';

interface PlayerBoxscoreAPI{
 readonly version:'20.5.11';readonly readOnly:true;
 getReport:()=>Readonly<PlayerBoxscore>|null;
 refresh:()=>Readonly<PlayerBoxscore>;
 dispose:()=>void;
}
type BoxscoreWindow=ObservableWindow&{VC_PLAYER_BOXSCORE_20511?:Readonly<PlayerBoxscoreAPI>};

export function mountPlayerBoxscore(win:BoxscoreWindow):Readonly<PlayerBoxscoreAPI>|null{
 const doc=win.document,host=doc.getElementById('vc20511-boxscore'),workspace=doc.getElementById('scout-workspace-v900'),
  phase=doc.getElementById('v900-phase-analyze'),store=win.VC_STATE_2059;
 if(!host||!workspace||!phase||!store)return null;
 if(win.VC_PLAYER_BOXSCORE_20511)return win.VC_PLAYER_BOXSCORE_20511;
 const node=(tag:string,klass='',value='')=>{
  const el=doc.createElement(tag);el.className=klass;el.textContent=value;return el;
 };
 const header=node('div','vc20511-head');
 const heading=node('div');heading.append(node('small','','BOXSCORE PROFESIONAL · V20.5.11'),node('h3','','Jugadores y rotaciones'));
 header.append(heading,node('span','vc20511-chip','Solo acciones confirmadas'));
 const controls=node('div','vc20511-controls');
 const selector=(label:string,choices:readonly [string,string][],name:string)=>{
  const wrapper=node('label');wrapper.append(node('span','',label));
  const field=node('select') as HTMLSelectElement;field.setAttribute('aria-label',name);
  for(const [value,title] of choices){const option=node('option','',title) as HTMLOptionElement;option.value=value;field.append(option);}
  wrapper.append(field);controls.append(wrapper);return field;
 };
 const team=selector('Equipo',[['ours','Nuestro equipo'],['opponent','Rival']],'Filtrar equipo');
 const scope=selector('Periodo',[['current','Set actual'],['match','Partido completo']],'Filtrar periodo');
 const rotation=selector('Rotación',[
  ['0','Todas'],['1','P1'],['2','P2'],['3','P3'],['4','P4'],['5','P5'],['6','P6']
 ],'Filtrar rotación');
 team.value='ours';scope.value='current';rotation.value='0';
 const status=node('p','vc20511-status','Esperando partido activo');status.setAttribute('role','status');
 const tableWrap=node('div','vc20511-scroll');
 const rotationHeading=node('h4','','Rendimiento por rotación');
 const rotationWrap=node('div','vc20511-scroll vc20511-rotation-scroll');
 const note=node('p','vc20511-note','Datos del scouting confirmado; no se infieren puntos a partir de códigos #. P1–P6 corresponde a la rotación del equipo seleccionado al inicio de cada rally.');
 host.append(header,controls,status,tableWrap,rotationHeading,rotationWrap,note);
 let disposed=false,pending=false,report:Readonly<PlayerBoxscore>|null=null;
 const active=()=>{
  for(const reader of [win.MatchState,win.VC_MATCH_STATE,win.VC_SCOUT_VIDEO_BRIDGE,win.VC_SCOUT_REPORT_BRIDGE]){
   try{const match=reader?.getActive?.();if(match&&typeof match==='object'&&!Array.isArray(match))return match;}
   catch(_){/* A missing legacy reader must not interrupt scouting. */}
  }
  return null;
 };
 const visible=()=>workspace.classList.contains('active')&&!phase.classList.contains('hidden');
 const percent=(v:number|null)=>v===null?'—':`${v}%`;
 const cell=(row:HTMLElement,value:string,tag='td')=>row.append(node(tag,'',value));
 const table=(labels:string[])=>{
  const grid=node('table','vc20511-table'),thead=node('thead'),tr=node('tr');
  for(const label of labels)cell(tr,label,'th');
  thead.append(tr);grid.append(thead);
  const tbody=node('tbody');grid.append(tbody);
  return {grid,tbody};
 };
 const render=(next:Readonly<PlayerBoxscore>)=>{
  if(disposed)return;
  host.dataset.state=!next.available?'waiting':next.truncated||next.playersTruncated?'partial':'available';
  status.textContent=!next.available?'No hay datos confirmados del periodo seleccionado.':
   `${next.players.length} jugadores · ${next.selectedActions} acciones evaluadas · ${next.ralliesExamined} rallies examinados`+
   (next.unattributedActions?` · ${next.unattributedActions} sin identificar`:'')+
   (next.missingRotationActions?` · ${next.missingRotationActions} sin rotación`:'')+
   (next.pendingActions?` · ${next.pendingActions} acciones abiertas (excluidas)`:'')+
   (next.truncated||next.playersTruncated?' · RESULTADOS PARCIALES':'');
  const players=table(['JUGADOR','SAQ · #/=','REC · +/#','ATA · K/EFF','BLQ · #','D/E','ACC.']);
  for(const player of next.players){
   const row=node('tr');
   cell(row,`${player.number===null?'—':'#'+player.number} · ${player.name}`);
   cell(row,`${player.serve.attempts} · ${player.serve.aces}/${player.serve.errors}`);
   cell(row,`${player.receive.attempts} · ${percent(player.receive.positivePct)} / ${percent(player.receive.perfectPct)}`);
   cell(row,`${player.attack.attempts} · ${player.attack.kills}/${percent(player.attack.efficiencyPct)}`);
   cell(row,`${player.block.attempts} · ${player.block.points}`);
   cell(row,`${player.digs}/${player.sets}`);
   cell(row,String(player.actions));
   players.tbody.append(row);
  }
  if(!next.players.length){const empty=node('tr');const col=node('td','','No hay acciones confirmadas con estos filtros.');col.setAttribute('colspan','7');empty.append(col);players.tbody.append(empty);}
  tableWrap.replaceChildren(players.grid);
  const rotations=table(['ROT.','RALLIES','SO · G/T','BP · G/T','ATA · K/EFF']);
  for(const item of next.rotations){
   const row=node('tr',next.filters.rotation===item.rotation?'vc20511-selected':'');
   cell(row,`P${item.rotation}`);cell(row,String(item.rallies));
   cell(row,`${percent(item.sideOut.percent)} · ${item.sideOut.won}/${item.sideOut.attempts}`);
   cell(row,`${percent(item.breakPoint.percent)} · ${item.breakPoint.won}/${item.breakPoint.attempts}`);
   cell(row,`${item.attack.attempts} · ${item.attack.kills}/${percent(item.attack.efficiencyPct)}`);
   rotations.tbody.append(row);
  }
  rotationWrap.replaceChildren(rotations.grid);
 };
 const refresh=()=>{
  const filters:BoxscoreFilters={team:team.value==='opponent'?'opponent':'ours' as Team,
   scope:scope.value==='match'?'match':'current',
   rotation:/^[1-6]$/.test(rotation.value)?Number(rotation.value) as Rotation:null};
  const next=inspectPlayerBoxscore(active(),filters);report=next;
  if(visible())render(next);
  return next;
 };
 const schedule=()=>{
  if(disposed||pending||!visible())return;
  pending=true;Promise.resolve().then(()=>{pending=false;if(!disposed&&visible())refresh();});
 };
 const unsubscribe=store.subscribe('change',schedule);
 for(const select of [team,scope,rotation])select.addEventListener('change',refresh);
 const observer=typeof MutationObserver==='function'?new MutationObserver(()=>{if(visible())refresh();}):null;
 observer?.observe(workspace,{attributes:true,attributeFilter:['class']});
 observer?.observe(phase,{attributes:true,attributeFilter:['class']});
 if(visible())refresh();
 const api:Readonly<PlayerBoxscoreAPI>=Object.freeze({version:'20.5.11',readOnly:true,getReport:()=>report,refresh,
  dispose(){if(disposed)return;disposed=true;observer?.disconnect();unsubscribe();
   for(const select of [team,scope,rotation])select.removeEventListener('change',refresh);
   host.replaceChildren();report=null;
   if(win.VC_PLAYER_BOXSCORE_20511===api)delete win.VC_PLAYER_BOXSCORE_20511;}
 });
 win.VC_PLAYER_BOXSCORE_20511=api;
 return api;
}
