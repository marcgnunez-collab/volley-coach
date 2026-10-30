/* Volley Coach V16.9.1 · Importación conservadora del CSV de acciones.
   Reconstituye sets, rallies, marcadores y acciones en una COPIA independiente.
   Nunca sustituye el partido original ni aplica un CSV incompleto en silencio. */
(()=>{
'use strict';
const VERSION='16.9.1';
const $=id=>document.getElementById(id);
const copy=x=>JSON.parse(JSON.stringify(x));
const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>Math.floor(Date.now()*1000+Math.random()*900);
const now=()=>new Date().toISOString();
const parseScore=v=>{const m=String(v||'').trim().match(/^(\d{1,3})\s*[-–—:]\s*(\d{1,3})$/);return m?{us:Number(m[1]),opponent:Number(m[2])}:null};
const num=v=>Number.isFinite(Number(v))?Number(v):0;
let prepared=null,sourceName='';

function csvParse(content){
 const txt=String(content||'').replace(/^\uFEFF/,'');
 const first=txt.split(/\r?\n/)[0]||'';
 const delim=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';
 let rows=[],row=[],field='',quoted=false;
 for(let i=0;i<txt.length;i++){
  const c=txt[i];
  if(c==='"'){
   if(quoted&&txt[i+1]==='"'){field+='"';i++}else quoted=!quoted;
  }else if(c===delim&&!quoted){row.push(field);field=''}
  else if((c==='\r'||c==='\n')&&!quoted){
   if(c==='\r'&&txt[i+1]==='\n')i++;
   row.push(field);if(row.some(x=>String(x).trim()))rows.push(row);row=[];field='';
  }else field+=c;
 }
 if(quoted)throw Error('CSV mal formado: comillas sin cerrar');
 row.push(field);if(row.some(x=>String(x).trim()))rows.push(row);
 if(!rows.length)throw Error('El archivo CSV está vacío');
 const keys=rows.shift().map(x=>String(x).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 const required=['set','rally','secuencia','marcador_antes','marcador_despues'];
 const missing=required.filter(k=>!keys.includes(k));
 if(missing.length||!keys.includes('codigo')&&!keys.includes('fundamento')){
  throw Error('Este CSV no contiene la secuencia de scouting necesaria. Faltan: '+[...missing,...(!keys.includes('codigo')&&!keys.includes('fundamento')?['codigo/fundamento']:[])].join(', ')+'. Usa el CSV de acciones del partido, no un resumen estadístico.');
 }
 return rows.map((cells,idx)=>{const o={__line:idx+2};keys.forEach((k,i)=>o[k]=String(cells[i]??'').trim());return o});
}

function skillOf(row){
 const s=(row.fundamento||'').toLowerCase();
 const names={saque:'S',recepcion:'R',colocacion:'E',ataque:'A',bloqueo:'B',defensa:'D',freeball:'F',cobertura:'C'};
 for(const [k,v] of Object.entries(names))if(s.includes(k))return v;
 const m=(row.codigo||'').match(/(?:R?\d+|P)([SREABDFC])([#+!\-\/=])/i);
 return m?.[1]?.toUpperCase()||'S';
}
function evalOf(row){const ev=String(row.valoracion||'');if(['#','+','!','-','/','='].includes(ev))return ev;return (row.codigo||'').match(/[SREABDFC]([#+!\-\/=])/i)?.[1]||'!'}
function milli(v){const x=String(v||'').trim();if(!x)return 0;if(/^\d+(?:[.,]\d+)?$/.test(x))return Math.round(Number(x.replace(',','.'))*1000);
 const m=x.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d+))?$/);if(!m)return 0;return ((Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3]))*1000+Math.round(Number('0.'+(m[4]||0))*1000))}
function getTeams(){try{return typeof equiposData==='object'?equiposData:{}}catch(_){return {}}}
function teamPlayers(team){return arr(getTeams()[team]?.jugadores)}
function actionOf(row,team){
 const teamAction=String(row.equipo_accion||'').toLowerCase().startsWith('riv')?'opponent':'ours';
 const label=String(row.jugador||'').trim(),dorsal=label.match(/#\s*(\d+)/)?.[1]||label.match(/^\s*(\d+)\s*[·-]/)?.[1];
 const p=teamAction==='ours'?teamPlayers(team).find(x=>String(x.number)===String(dorsal)||String(x.name||'').toLowerCase()===label.toLowerCase()):null;
 const skill=skillOf(row);
 const a={id:id(),seq:num(row.secuencia)||1,team:teamAction,playerId:p?.id??null,playerLabel:teamAction==='opponent'?label:'',playerNameSnapshot:p?.name||label.replace(/^#?\d+\s*[·-]?\s*/,''),playerNumberSnapshot:p?.number??dorsal??'',skill,evaluation:evalOf(row),code:row.codigo||'',startZone:row.zona_origen_vc||row.zona_origen||'',endZone:row.zona_destino_vc||row.zona_destino||'',contactZone:row.contact_zone_vc||'',locationMode:row.location_mode||'',dvStartZone:row.dv_start_zone||'',dvEndZone:row.dv_end_zone||'',dvEndSubzone:row.dv_end_subzone||'',dvEndCone:row.dv_end_cone||'',attackCode:row.attack_code_dv||'',setterCall:row.set_code_dv||'',skillSubtype:row.skill_subtype_dv||'',specialCode:row.special_code_dv||'',customCode:row.custom_code_dv||'',setTempo:row.tempo_dv||'',attackTempo:row.tempo_dv||'',dvSetType:row.set_type_dv||'',attackDirection:row.direccion_ataque_vc||'',blockers:row.bloqueadores||'',blockTargetNumber:row.atacante_objetivo_vc||'',phase:row.fase_vc||'',dvPhase:row.dv_phase||'',dvPointPhase:row.dv_point_phase||'',dvAttackPhase:row.dv_attack_phase||'',scoutMs:milli(row.tiempo_scout),videoTime:row.video_time!==''&&row.video_time!=null?Number(row.video_time):null,restoredFromCSV:true};
 for(const [key,prefix] of [['startCoordinate','start'],['endCoordinate','end'],['contactCoordinate','contact']]){
  if(row[prefix+'_x']!==''&&row[prefix+'_y']!==''&&row[prefix+'_x']!==undefined)a[key]={x:Number(row[prefix+'_x']),y:Number(row[prefix+'_y'])};
 }
 return a;
}
function parseRows(text){
 const rows=csvParse(text),groups=new Map(),warnings=[];
 for(const row of rows){
  const set=num(row.set),rally=num(row.rally),before=parseScore(row.marcador_antes),after=parseScore(row.marcador_despues);
  if(!(set>=1&&set<=10&&rally>=1&&rally<=2000)){warnings.push('Línea '+row.__line+': set/rally inválidos');continue}
  if(!before||!after){warnings.push('Línea '+row.__line+': no hay marcador cerrado (acción en curso o formato desconocido)');continue}
  const winner=after.us===before.us+1&&after.opponent===before.opponent?'ours':after.opponent===before.opponent+1&&after.us===before.us?'opponent':null;
  if(!winner){warnings.push('Línea '+row.__line+': el marcador no corresponde a un único punto válido');continue}
  const key=set+':'+rally;
  if(!groups.has(key))groups.set(key,{set,rally,before,after,winner,rows:[]});
  const g=groups.get(key);
  if(JSON.stringify(g.before)!==JSON.stringify(before)||JSON.stringify(g.after)!==JSON.stringify(after)){
   warnings.push('Línea '+row.__line+': marcador contradictorio dentro del mismo rally');continue;
  }
  g.rows.push(row);
 }
 if(!groups.size)throw Error('No se han encontrado rallies con marcadores válidos. Sin marcadores antes/después no es seguro reconstruir el scouting.');
 const sorted=[...groups.values()].sort((a,b)=>a.set-b.set||a.rally-b.rally);
 return {rows,groups:sorted,warnings,dates:[...new Set(rows.map(r=>r.fecha).filter(Boolean))],opponents:[...new Set(rows.map(r=>r.rival).filter(Boolean))]};
}
function reconstruct(parsed,team,target=null,markFinished=false){
 const original=target?copy(target):{id:id(),date:parsed.dates[0]||new Date().toISOString().slice(0,10),opponent:parsed.opponents[0]||'Rival CSV',competition:parsed.rows[0]?.competicion||'',sets:[],status:'live',currentSet:1,createdAt:now(),lineup:{ours:{},opponent:{}}};
 const recovered=copy(original);
 recovered.id=id();recovered.originMatchId=original.id||null;recovered.restoredFromCSV={at:now(),file:sourceName,sourceRows:parsed.rows.length,validRallies:parsed.groups.length};
 recovered.updatedAt=now();recovered.manualSavedAt=now();
 recovered.opponent=(target?.opponent||parsed.opponents[0]||'Rival CSV')+' · RECUPERADO CSV';
 recovered.sets=arr(recovered.sets);
 const warnings=parsed.warnings.slice();
 for(const g of parsed.groups){
  let set=recovered.sets.find(s=>Number(s.number)===g.set);
  if(!set){set={number:g.set,scoreUs:0,scoreOpponent:0,finished:false,winner:null,rallies:[],startedAt:now(),endedAt:null};recovered.sets.push(set)}
  set.rallies=arr(set.rallies);
  const idx=g.rally-1,old=set.rallies[idx];
  const rows=g.rows.sort((a,b)=>num(a.secuencia)-num(b.secuencia));
  const actions=rows.map(r=>actionOf(r,team));
  const rally={...(old||{}),id:old?.id||id(),setNumber:g.set,servingBefore:String(rows[0]?.saque_antes||'').toLowerCase().startsWith('riv')?'opponent':'ours',rotationBefore:num(rows[0]?.rotacion_nuestra)||old?.rotationBefore||1,opponentRotationBefore:num(rows[0]?.rotacion_rival)||old?.opponentRotationBefore||1,lineupBefore:old?.lineupBefore||copy(recovered.lineup||{ours:{},opponent:{}}),scoreBefore:g.before,scoreAfter:g.after,winner:g.winner,actions,startedAt:old?.startedAt||now(),endedAt:old?.endedAt||now(),scoutStartMs:actions[0]?.scoutMs||0,scoutEndMs:actions.at(-1)?.scoutMs||0,restoredFromCSV:true};
  if(idx>set.rallies.length){warnings.push('Set '+g.set+': faltan rallies anteriores al '+g.rally+' en el CSV');}
  // Never invent unseen rallies. Preserve any existing entries in the target copy.
  if(idx>=set.rallies.length)set.rallies.length=idx+1;
  set.rallies[idx]=rally;
 }
 for(const set of recovered.sets){
  // CSV export contains only scored rallies with coded actions. Uncoded rallies
  // must not be invented, otherwise statistics and score become inconsistent.
  const filtered=arr(set.rallies).filter(Boolean);
  if(filtered.length!==arr(set.rallies).length)warnings.push('Set '+set.number+': hay rallies sin acciones que no pueden reconstruirse del CSV');
  set.rallies=filtered;
  const last=filtered.at(-1);if(last){set.scoreUs=num(last.scoreAfter.us);set.scoreOpponent=num(last.scoreAfter.opponent)}
  const wins=set.scoreUs>=25||set.scoreOpponent>=25||set.number===5&&(set.scoreUs>=15||set.scoreOpponent>=15);
  if(wins&&Math.abs(set.scoreUs-set.scoreOpponent)>=2){set.finished=true;set.winner=set.scoreUs>set.scoreOpponent?'ours':'opponent';set.endedAt=set.endedAt||now()}
 }
 recovered.sets.sort((a,b)=>Number(a.number)-Number(b.number));
 recovered.currentSet=recovered.sets.at(-1)?.number||1;
 recovered.status=target?.status==='finished'||markFinished?'finished':'live';
 if(recovered.status==='finished')recovered.endedAt=target?.endedAt||now();
 recovered.scoutingActiveId=null;
 return {match:recovered,warnings};
}
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
function setSelect(){
 const t=$('vc-csv-team'),m=$('vc-csv-target');if(!t||!m)return;
 const teams=getTeams();const originalTeam=t.value;
 t.innerHTML=Object.keys(teams).filter(k=>teams[k]&&Array.isArray(teams[k].scoutingMatches)).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
 if(Object.keys(teams).includes(originalTeam))t.value=originalTeam;
 else if(typeof equipoActivo!=='undefined')t.value=String(equipoActivo);
 const team=teams[t.value]||{};
 m.innerHTML='<option value="">Sin partido original (reconstruir como copia nueva)</option>'+arr(team.scoutingMatches).map(x=>`<option value="${esc(x.id)}">${esc(x.date)} · ${esc(x.opponent)} · ${x.status==='finished'?'FINALIZADO':'En curso'} · ${arr(x.sets).reduce((n,s)=>n+arr(s.rallies).length,0)} rallies</option>`).join('');
 if(prepared){const match=arr(team.scoutingMatches).find(x=>x.date===prepared.dates[0]&&String(x.opponent||'').toLowerCase()===String(prepared.opponents[0]||'').toLowerCase());if(match)m.value=String(match.id)}
}
async function loadFile(file){
 if(!file)return;if(file.size>20*1024*1024)throw Error('El CSV supera 20 MB');
 sourceName=file.name;prepared=parseRows(await file.text());setSelect();preview();
}
function preview(){
 const box=$('vc-csv-preview');if(!box)return;
 if(!prepared){box.textContent='Selecciona un archivo CSV de acciones exportado por Volley Coach.';return}
 const t=$('vc-csv-team')?.value||'',target=arr(getTeams()[t]?.scoutingMatches).find(x=>String(x.id)===String($('vc-csv-target')?.value));
 let rec;try{rec=reconstruct(prepared,t,target,!!$('vc-csv-finished')?.checked)}catch(err){box.textContent=String(err);return}
 const m=rec.match;
 const actions=arr(m.sets).reduce((n,s)=>n+arr(s.rallies).reduce((a,r)=>a+arr(r.actions).length,0),0);
 box.innerHTML=`<strong>${esc(m.date)} · ${esc(m.opponent)}</strong><div>${m.sets.length} sets · ${m.sets.reduce((n,s)=>n+arr(s.rallies).length,0)} rallies · ${actions} acciones</div><div>Se creará una copia independiente; el partido original NO se modificará.</div>`+
 (target?.status==='finished'?'<div>Se conservará el estado FINALIZADO del original.</div>':'<div>Sin original finalizado: la copia quedará pendiente de revisión.</div>')+
 (rec.warnings.length?`<p style="color:#9f6823">${rec.warnings.length} advertencias. ${esc(rec.warnings.slice(0,4).join(' · '))}</p>`:'');
 $('vc-csv-download').disabled=false;
 $('vc-csv-restore').disabled=false;
}
async function restore(){
 if(!prepared)throw Error('Primero selecciona el CSV');
 const team=$('vc-csv-team').value,target=arr(getTeams()[team]?.scoutingMatches).find(x=>String(x.id)===String($('vc-csv-target').value));
 const result=reconstruct(prepared,team,target,!!$('vc-csv-finished')?.checked);
 const original=getTeams()[team];if(!original)throw Error('Equipo inexistente');
 if(!confirm('Crear una COPIA recuperada del scouting con '+result.match.sets.length+' sets. No modifica el partido original. ¿Confirmar?'))return;
 // This export contains the complete team before inserting any imported record.
 download('VolleyCoach_ANTES_de_importar_CSV_'+team+'_'+Date.now()+'.json',{teamId:team,equipo:original,exportedAt:now(),reason:'copia-previa-importacion-csv'});
 await window.VC_SYNC_V1680?.capture?.('before-csv-restore');
 const list=arr(original.scoutingMatches);
 if(list.some(x=>x.restoredFromCSV?.file===sourceName&&x.originMatchId===result.match.originMatchId)){
  throw Error('Ya hay una copia importada de este archivo para ese partido. No se ha duplicado.');
 }
 list.push(result.match);original.scoutingMatches=list;
 if(team===String(typeof equipoActivo!=='undefined'?equipoActivo:'')){
  const active=window.VC_SCOUT_VIDEO_BRIDGE?.getActiveId?.();
  window.VC_SCOUT_VIDEO_BRIDGE?.replaceMatches?.(list,active);
 }
 // Preserve the complete imported version before any cloud attempt.
 if(typeof guardarEstadoLocalSinCloud==='function')guardarEstadoLocalSinCloud();
 window.VC_SYNC_V1680?.onMutation?.('csv-restored-copy');
 await window.VC_SYNC_V1680?.capture?.('csv-restored-copy');
 alert('Copia recuperada creada: '+result.match.sets.length+' sets. Está guardada localmente y pendiente de confirmar en nube. Abre «Archivo de scoutings» para consultarla.');
 if(window.VC_ARCHIVE?.open)void window.VC_ARCHIVE.open();
}
function ensureUI(){
 if($('vc-csv-panel'))return;
 const anchor=$('vc169-recovery-panel')||$('vc1680-panel')||document.querySelector('#scout-workspace-v900 .v900-shell');
 if(!anchor)return;
 const n=document.createElement('section');n.id='vc-csv-panel';n.style.cssText='margin:12px 0;padding:14px;background:white;border:1px solid #c9d8e7;border-radius:9px;color:#263b4c;font:12px Arial';
 n.innerHTML=`<strong>Recuperar scouting desde CSV de acciones · V16.9.1</strong>
 <p>Reconstruye rallies, códigos y marcadores en una <b>copia independiente</b>. No modifica los partidos originales ni inventa puntos que faltan en el CSV.</p>
 <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label>Archivo CSV <input id="vc-csv-file" type="file" accept=".csv,text/csv"/></label>
 <label>Equipo <select id="vc-csv-team"></select></label><label>Partido original <select id="vc-csv-target" style="min-width:250px"></select></label></div>
 <label style="display:block;margin-top:8px"><input id="vc-csv-finished" type="checkbox" style="width:auto;vertical-align:middle"/> Confirmo que este CSV corresponde a un partido finalizado (si no selecciono un original finalizado).</label>
 <div id="vc-csv-preview" style="padding:10px;background:#f4f7fa;margin:8px 0;line-height:1.6">Selecciona un CSV.</div>
 <button class="ghost" id="vc-csv-download" disabled type="button">Descargar reconstrucción JSON</button>
 <button class="primary" id="vc-csv-restore" disabled type="button">Crear copia recuperada en Scouting</button>`;
 anchor.insertAdjacentElement('afterend',n);
 $('vc-csv-team').addEventListener('change',()=>{setSelect();preview()});$('vc-csv-target').addEventListener('change',preview);
 $('vc-csv-finished').addEventListener('change',preview);
 $('vc-csv-file').addEventListener('change',e=>{void loadFile(e.target.files?.[0]).catch(err=>alert('Importación CSV: '+err.message))});
 $('vc-csv-download').addEventListener('click',()=>{const team=$('vc-csv-team').value,target=arr(getTeams()[team]?.scoutingMatches).find(x=>String(x.id)===String($('vc-csv-target').value));download('VolleyCoach_reconstruido_CSV_'+Date.now()+'.json',{version:VERSION,teamId:team,...reconstruct(prepared,team,target,!!$('vc-csv-finished')?.checked)})});
 $('vc-csv-restore').addEventListener('click',()=>{void restore().catch(err=>alert('Recuperación CSV: '+err.message))});
 setSelect();
}
window.VC_CSV_REPAIR_V1691={parse:parseRows,reconstruct,ensureUI,version:VERSION};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI,{once:true});else ensureUI();
})();
