/* Volley Coach V19.3.18 · Worksheets & Reports Pro
 * Solo lectura. Proyecta datos canónicos de 1938; no modifica matches,
 * puntuaciones, sincronización, vídeo ni almacenamiento de scouting.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VC_WORKSHEETS_19318=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION='19.3.18.0', STORAGE_KEY='vc19318:worksheet-presets:1', MAX_PRESETS=25;
 const SKILLS={S:'Saque',R:'Recepción',E:'Colocación',A:'Ataque',B:'Bloqueo',D:'Defensa',F:'Freeball',C:'Control'};
 const GROUPS={player:'Jugador',rotation:'Rotación',set:'Set',skill:'Fundamento',phase:'Fase K1/K2',zone:'Zona explícita',team:'Equipo',total:'Total'};
 const METRICS={N:{label:'Acciones',format:'count'},EVAL:{label:'Valoradas',format:'count'},UNRATED:{label:'Sin valorar',format:'count'},POINT:{label:'Valoración #',format:'count'},PLUS:{label:'Valoración +',format:'count'},ERROR:{label:'Valoración =',format:'count'},BLOCKED:{label:'Valoración /',format:'count'},POSITIVE:{label:'# / +',format:'count'},POS_RATE:{label:'Positivas %',format:'pct'},ATTACKS:{label:'Ataques',format:'count'},KILL:{label:'Ataques #',format:'count'},ATTACK_RATE:{label:'Kill % ataque',format:'pct'},ATTACK_EFF:{label:'EFF ataque %',format:'pct'},RECEPTIONS:{label:'Recepciones',format:'count'},RECEPTION_POS:{label:'Recepción positiva %',format:'pct'},SERVES:{label:'Saques',format:'count'},SERVE_ACE:{label:'Saques #',format:'count'},SERVE_ACE_RATE:{label:'Saques # %',format:'pct'},FORMULA:{label:'Fórmula personalizada',format:'number'}};
 const KEY_COLS=Object.keys(METRICS);
 const BUILTINS=[
  {name:'Ataque · Eficiencia',group:'player',skill:'A',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_RATE','ATTACK_EFF']},
  {name:'Recepción · Calidad',group:'player',skill:'R',columns:['N','EVAL','POINT','PLUS','ERROR','RECEPTION_POS']},
  {name:'Saque · Valoración',group:'player',skill:'S',columns:['N','EVAL','SERVE_ACE','ERROR','SERVE_ACE_RATE']},
  {name:'Rotaciones · Ataque',group:'rotation',skill:'A',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_EFF']},
  {name:'Colocadores · Acciones',group:'player',skill:'E',columns:['N','EVAL','POINT','PLUS','ERROR','POS_RATE']},
  {name:'Resumen · Fundamentos',group:'skill',skill:'',columns:['N','EVAL','UNRATED','POINT','POSITIVE','POS_RATE']}
 ];
 const arr=x=>Array.isArray(x)?x:[];
 const str=x=>String(x??'').trim();
 const esc=x=>str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(x,n)=>n>0?Math.round(x/n*1000)/10:null;
 const display=(v,fmt='count')=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('es-ES',{maximumFractionDigits:2})+(fmt==='pct'?' %':'');
 const cleanName=s=>str(s).slice(0,55).replace(/[\x00-\x1f]/g,'');
 const defaultConfig=()=>({name:'Ataque · Eficiencia',group:'player',skill:'A',set:'',rotation:'',phase:'',player:'',evaluation:'',zone:'',focus:'',columns:['N','EVAL','KILL','ERROR','BLOCKED','ATTACK_EFF'],formula:'100*(POINT-ERROR-BLOCKED)/EVAL',sort:'volume'});
 function sanitizeConfig(raw){
  if(!raw||typeof raw!=='object')return null;
  const d=defaultConfig(),g=str(raw.group||d.group),skill=str(raw.skill||'').toUpperCase();
  if(!GROUPS[g]||(skill&&!SKILLS[skill]))return null;
  const cols=[...new Set(arr(raw.columns).filter(c=>typeof c==='string'&&KEY_COLS.includes(c)))].slice(0,14);
  if(!cols.length)return null;
  const r={...d,name:cleanName(raw.name)||d.name,group:g,skill,columns:cols};
  for(const key of ['set','rotation','phase','player','evaluation','zone'])r[key]=str(raw[key]||'').slice(0,80);
  if(r.set&&!/^\d{1,2}$/.test(r.set))return null;
  if(r.rotation&&!/^[1-6]$|^unknown$/.test(r.rotation))return null;
  if(r.phase&&!['K1','K2','unknown'].includes(r.phase))return null;
  if(r.evaluation&&!['#','+','!','-','/','='].includes(r.evaluation))return null;
  if(r.zone&&!/^Z[1-9][ABCD]?$|^unknown$/.test(r.zone))return null;
  if(raw.focus)r.focus=str(raw.focus).slice(0,100);
  r.sort=['volume','label','efficiency'].includes(raw.sort)?raw.sort:'volume';
  r.formula=str(raw.formula||d.formula).slice(0,128);
  if(cols.includes('FORMULA')){try{compile(r.formula)}catch(_){return null;}}
  return r;
 }
 function compile(expression){
  const engine=typeof window!=='undefined'?window.VC_ANALYSIS_SCREENS_19311:null;
  // En Node, no se necesita window: la dependencia canónica es inyectable.
  const source=engine||((typeof module==='object'&&module.exports)?require('./192-vc19311-professional-analysis-screens.js'):null);
  if(!source?.compileFormula)throw Error('Motor seguro de fórmulas no disponible');
  return source.compileFormula(expression);
 }
 function storage(win){try{return win?.localStorage||null}catch(_){return null}}
 function readPresets(store){try{const data=JSON.parse(store?.getItem(STORAGE_KEY)||'[]');return arr(data).slice(0,MAX_PRESETS).map(sanitizeConfig).filter(Boolean).map(x=>({...x,focus:''}));}catch(_){return []}}
 function legacyPresets(store){
  try{const data=JSON.parse(store?.getItem('vc19311:worksheet-layouts:v1')||'[]');
   return arr(data).slice(0,24).filter(x=>x&&typeof x.name==='string'&&typeof x.formula==='string').map(x=>sanitizeConfig({...defaultConfig(),...x,name:'Anterior · '+cleanName(x.name),columns:['N','EVAL','FORMULA']})).filter(Boolean).map(c=>({...c,focus:''}));
  }catch(_){return []}
 }
 function savePreset(store,cfg){const clean=sanitizeConfig(cfg);if(!store||!clean)throw Error('La plantilla contiene valores no válidos');
  const presets=readPresets(store).filter(x=>x.name!==clean.name);presets.push({...clean,focus:''});store.setItem(STORAGE_KEY,JSON.stringify(presets.slice(-MAX_PRESETS)));return clean;}
 function deletePreset(store,name){if(!store)throw Error('Almacenamiento local no disponible');store.setItem(STORAGE_KEY,JSON.stringify(readPresets(store).filter(p=>p.name!==name)));}
 function ensureState(state){if(!state.vc19318)state.vc19318={config:defaultConfig(),template:'builtin:Ataque · Eficiencia',editor:false,showReport:true};return state.vc19318;}
 function sourceZone(c){const f=c.fields||{};return c.skill==='E'?f.setTarget?.code||'':c.skill==='R'?f.contactZone?.code||f.startZone?.code||'':f.startZone?.code||'';}
 function lookupRally(base){return new Map(arr(base?.rallies).map(r=>[r.key,r]));}
 function getPhase(r,team){if(!r?.serving)return 'unknown';return r.serving===team?'K2':'K1';}
 function rowContext(c,r,team){const rotation=team==='ours'?r?.ownRotation:r?.rivalRotation;
  return {set:String(c.set),rotation:rotation>=1&&rotation<=6?String(rotation):'unknown',phase:getPhase(r,team),zone:sourceZone(c)||'unknown',player:c.player||'Sin identificar',team:c.team,skill:c.skill||''};
 }
 function filterContacts(projection,team,cfg){const base=projection.base,byRally=lookupRally(base);
  return arr(base.contacts).filter(c=>{
   if(c.team!==team)return false;const x=rowContext(c,byRally.get(c.rallyKey),team);
   if(cfg.skill&&x.skill!==cfg.skill)return false;
   for(const field of ['set','rotation','phase','player','evaluation','zone']){
    if(!cfg[field])continue;
    if(field==='evaluation'){if(c.evaluation!==cfg.evaluation)return false;continue;}
    if(x[field]!==cfg[field])return false;
   }return true;
  });
 }
 function metrics(rows){const rated=rows.filter(c=>c.evaluation),count=code=>rated.filter(c=>c.evaluation===code).length;
  const attacks=rows.filter(c=>c.skill==='A'),evalA=attacks.filter(c=>c.evaluation),aCount=code=>evalA.filter(c=>c.evaluation===code).length;
  const receptions=rows.filter(c=>c.skill==='R'),evalR=receptions.filter(c=>c.evaluation),rPos=evalR.filter(c=>c.evaluation==='#'||c.evaluation==='+').length;
  const serves=rows.filter(c=>c.skill==='S'),evalS=serves.filter(c=>c.evaluation),aces=evalS.filter(c=>c.evaluation==='#').length;
  return {N:rows.length,EVAL:rated.length,UNRATED:rows.length-rated.length,POINT:count('#'),PLUS:count('+'),ERROR:count('='),BLOCKED:count('/'),POSITIVE:count('#')+count('+'),POS_RATE:pct(count('#')+count('+'),rated.length),ATTACKS:attacks.length,KILL:aCount('#'),ATTACK_RATE:pct(aCount('#'),evalA.length),ATTACK_EFF:pct(aCount('#')-aCount('=')-aCount('/'),evalA.length),RECEPTIONS:receptions.length,RECEPTION_POS:pct(rPos,evalR.length),SERVES:serves.length,SERVE_ACE:aces,SERVE_ACE_RATE:pct(aces,evalS.length)};
 }
 function labelGroup(c,r,team,group){const x=rowContext(c,r,team);
  if(group==='total')return 'Total';if(group==='player')return x.player;
  if(group==='rotation')return x.rotation==='unknown'?'Sin rotación':'P'+x.rotation;
  if(group==='set')return 'Set '+x.set;
  if(group==='skill')return SKILLS[x.skill]||'Sin fundamento';
  if(group==='phase')return x.phase==='unknown'?'Saque no registrado':x.phase;
  if(group==='zone')return x.zone==='unknown'?'Sin zona explícita':x.zone;
  if(group==='team')return c.team==='ours'?'Nuestro equipo':'Rival';return 'Total';
 }
 function calc(projection,team,cfg){const clean=sanitizeConfig(cfg);if(!clean)throw Error('Configuración estadística inválida');
  const contacts=filterContacts(projection,team,clean),rallyMap=lookupRally(projection.base),groups=new Map();
  for(const c of contacts){const label=labelGroup(c,rallyMap.get(c.rallyKey),team,clean.group);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(c);}
  const fn=clean.columns.includes('FORMULA')?compile(clean.formula):null;
  const values=rows=>{const m=metrics(rows);if(fn){const scalar=fn({N:m.N,EVAL:m.EVAL,POINT:m.POINT,HASH:m.POINT,PLUS:m.PLUS,ERROR:m.ERROR,BLOCKED:m.BLOCKED,POSITIVE:m.POSITIVE,NEGATIVE:rows.filter(c=>['-','=','/'].includes(c.evaluation)).length,NOT_RATED:m.UNRATED});m.FORMULA=scalar;}return m;};
  const result=[...groups].map(([label,items])=>({label,contacts:items,stats:values(items),rallyKeys:[...new Set(items.map(c=>c.rallyKey))]}));
  result.sort((a,b)=>clean.sort==='label'?a.label.localeCompare(b.label,'es',{numeric:true}):clean.sort==='efficiency'?(b.stats.ATTACK_EFF??-Infinity)-(a.stats.ATTACK_EFF??-Infinity)||b.stats.N-a.stats.N:b.stats.N-a.stats.N||a.label.localeCompare(b.label,'es',{numeric:true}));
  const keys=[...new Set(contacts.map(c=>c.rallyKey))],rallies=arr(projection.base.rallies).filter(r=>keys.includes(r.key));
  const closed=rallies.filter(r=>r.closed),k1=closed.filter(r=>r.serving&&r.serving!==team),k2=closed.filter(r=>r.serving===team);
  const pointStat=list=>({n:list.length,won:list.filter(r=>r.winner===team).length,pct:pct(list.filter(r=>r.winner===team).length,list.length)});
  const chosen=clean.focus?result.find(r=>r.label===clean.focus):null;
  const filtered=chosen?new Set(chosen.rallyKeys):new Set(keys);
  return {config:clean,contacts,rows:result,rallies:rallies.filter(r=>filtered.has(r.key)),summary:values(contacts),coverage:{contacts:contacts.length,groups:result.length,rallies:rallies.length,unrated:contacts.filter(c=>!c.evaluation).length,unknownZone:contacts.filter(c=>!sourceZone(c)).length},points:{k1:pointStat(k1),k2:pointStat(k2),unknownServe:closed.filter(r=>!r.serving).length},team};
 }
 function csvCell(value){let s=str(value);if(/^[\s\x00-\x1f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 function toCSV(data){const c=data.config,head=['Grupo',...c.columns.map(id=>METRICS[id].label),'Rallies únicos'],rows=data.rows.map(r=>[r.label,...c.columns.map(id=>r.stats[id]??''),r.rallyKeys.length]);return '\ufeff'+[head,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');}
 function exportJSON(cfg){const c=sanitizeConfig(cfg);if(!c)throw Error('Configuración inválida');return JSON.stringify({kind:'volley-coach-worksheet',version:1,template:{...c,focus:''}},null,2);}
 function importJSON(value){const parsed=typeof value==='string'?JSON.parse(value):value;if(parsed?.kind!=='volley-coach-worksheet'||parsed.version!==1)throw Error('No es una plantilla V19.3.18 válida');const c=sanitizeConfig(parsed.template);if(!c)throw Error('Configuración de plantilla inválida');return {...c,focus:''};}
 function option(value,label,current){return `<option value="${esc(value)}"${str(current)===str(value)?' selected':''}>${esc(label)}</option>`;}
 function select(items,current,blank='Todos'){return option('',blank,current)+items.map(([id,label])=>option(id,label,current)).join('');}
 function csvSafeName(name){return str(name).replace(/[^a-z0-9-_]+/gi,'-').slice(0,40)||'hoja';}
 function rowTable(data){const cols=data.config.columns;return `<div class="vc19318-table-scroll"><table class="vc19318-stats"><thead><tr><th>Grupo</th>${cols.map(x=>`<th>${esc(METRICS[x].label)}</th>`).join('')}<th>Rallies</th></tr></thead><tbody>${data.rows.map(row=>`<tr class="${data.config.focus===row.label?'is-selected':''}"><th><button type="button" data-vc19318-group="${esc(row.label)}" aria-pressed="${data.config.focus===row.label}">${esc(row.label)}</button></th>${cols.map(x=>`<td>${display(row.stats[x],METRICS[x].format)}</td>`).join('')}<td>${row.rallyKeys.length}</td></tr>`).join('')||`<tr><td colspan="${cols.length+2}">No hay contactos para esta selección.</td></tr>`}</tbody><tfoot><tr><th>TOTAL</th>${cols.map(x=>`<td>${display(data.summary[x],METRICS[x].format)}</td>`).join('')}<td>${data.coverage.rallies}</td></tr></tfoot></table></div>`;}
 function reportPanel(data){const s=data.summary,p=data.points;return `<section class="vc19318-panel vc19318-report"><header><div><small>INFORME TÁCTICO · ${esc(data.config.name)}</small><h3>Resumen estadístico del scouting</h3></div><span>${esc(data.team==='ours'?'Nuestro equipo':'Equipo rival')}</span></header><div class="vc19318-report-metrics"><div><small>Contactos</small><strong>${s.N}</strong></div><div><small>Rallies filtrados</small><strong>${data.coverage.rallies}</strong></div><div><small>EFF ataque</small><strong>${display(s.ATTACK_EFF,'pct')}</strong></div><div><small>Recepción positiva</small><strong>${display(s.RECEPTION_POS,'pct')}</strong></div><div><small>K1 · rallies ganados</small><strong>${display(p.k1.pct,'pct')}</strong><span>${p.k1.won}/${p.k1.n}</span></div><div><small>K2 · rallies ganados</small><strong>${display(p.k2.pct,'pct')}</strong><span>${p.k2.won}/${p.k2.n}</span></div></div><p>Valoración # en la tabla = calificación del contacto, no marcador del partido. K1 y K2 utilizan únicamente rallies cerrados con equipo al saque conocido. Los porcentajes sin denominador se muestran como «—».</p></section>`;}
 function evidence(data){return `<section class="vc19318-panel vc19318-evidence"><header><div><small>EVIDENCIA VINCULADA</small><h3>Rallies de ${esc(data.config.focus||'la muestra')}</h3></div><span>${data.rallies.length} rallies</span></header><div class="vc19318-rally-list">${data.rallies.slice(-80).reverse().map(r=>`<button type="button" data-vc19318-video="${esc(r.key)}"><b>Set ${r.set} · Rally ${r.index}</b><span>${r.winner==='ours'?'Punto propio':r.winner==='opponent'?'Punto rival':'Sin cerrar'} · ${r.contacts.length} contactos</span><strong>Ver vídeo</strong></button>`).join('')||'<p>No hay rallies vinculados.</p>'}</div><p>«Ver vídeo» abre el rally en Video Analysis. El vídeo solo se reproduce si existe una grabación vinculada y disponible.</p></section>`;}
 function render({space,ctx,projection,state,win}){
  if(space!=='worksheets')return null;
  const s=ensureState(state),cfg=s.config,data=calc(projection,ctx.team,cfg),all=projection.base.contacts.filter(c=>c.team===ctx.team),rMap=lookupRally(projection.base),pre=readPresets(storage(win));
  const sets=[...new Set(all.map(c=>String(c.set)))].sort((a,b)=>Number(a)-Number(b)).map(x=>[x,'Set '+x]);
  const players=[...new Set(all.map(c=>c.player||'Sin identificar'))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true})).map(x=>[x,x]);
  const zones=[...new Set(all.map(c=>sourceZone(c)).filter(Boolean))].sort().map(x=>[x,x]);
  const field=(name,key,options)=>`<label>${esc(name)}<select data-vc19318-filter="${key}">${options}</select></label>`;
  const built=BUILTINS.map(t=>option('builtin:'+t.name,t.name,s.template)).join('');const saved=pre.map(t=>option('saved:'+t.name,t.name,s.template)).join('');const legacy=legacyPresets(storage(win)).map(t=>option('legacy:'+t.name,t.name,s.template)).join('');
  const controls=`<div class="vc19318-filtergrid">${field('Fundamento','skill',select(Object.entries(SKILLS),cfg.skill,'Todos'))}${field('Agrupar','group',Object.entries(GROUPS).map(([id,label])=>option(id,label,cfg.group)).join(''))}${field('Set','set',select(sets,cfg.set,'Todos'))}${field('Rotación','rotation',select([...Array.from({length:6},(_,i)=>[String(i+1),'P'+(i+1)]),['unknown','Sin rotación']],cfg.rotation,'Todas'))}${field('Fase','phase',select([['K1','K1 · Recepción'],['K2','K2 · Saque'],['unknown','Sin saque registrado']],cfg.phase,'Todas'))}${field('Jugador','player',select(players,cfg.player,'Todos'))}${field('Valoración','evaluation',select(['#','+','!','-','/','='].map(x=>[x,x]),cfg.evaluation,'Todas'))}${field('Zona explícita','zone',select([...zones,['unknown','Sin zona explícita']],cfg.zone,'Todas'))}</div>`;
  const editor=`<section class="vc19318-panel vc19318-editor"><header><h3>Configurar columnas</h3><span>Selecciona las métricas visibles</span></header><div class="vc19318-colgrid">${Object.entries(METRICS).map(([id,m])=>`<label><input type="checkbox" data-vc19318-column="${id}"${cfg.columns.includes(id)?' checked':''}/>${esc(m.label)}</label>`).join('')}</div><div class="vc19318-formula"><label>Fórmula segura (solo para la columna personalizada)<input id="vc19318-formula" type="text" spellcheck="false" maxlength="128" value="${esc(cfg.formula)}"/></label><button type="button" data-vc19318-act="formula">Aplicar</button><small>Variables: N, EVAL, POINT, HASH, PLUS, ERROR, BLOCKED, POSITIVE, NEGATIVE, NOT_RATED. División entre cero = «—».</small></div></section>`;
  const html=`<div class="vc19318-root"><div class="vc19318-title"><div><small>V19.3.18 · WORKSHEETS & REPORTS PRO</small><h2>Hojas estadísticas e informes configurables</h2><p>Solo lectura del scouting original · recalculado al actualizar · datos no inventados</p></div><div class="vc19318-actions"><button type="button" data-vc19318-act="export-csv">CSV</button><button type="button" data-vc19318-act="export-html">Informe HTML</button><button type="button" data-vc19318-act="print">Imprimir / PDF</button></div></div><section class="vc19318-panel"><div class="vc19318-presets"><label>Plantilla<select data-vc19318-template><optgroup label="Oficiales">${built}</optgroup><optgroup label="Guardadas en este dispositivo">${saved}</optgroup><optgroup label="Plantillas V19.3.11 anteriores">${legacy}</optgroup></select></label><button type="button" data-vc19318-act="load">Aplicar plantilla</button><button type="button" data-vc19318-act="save">Guardar nueva</button><button type="button" data-vc19318-act="delete">Eliminar guardada</button><button type="button" data-vc19318-act="export-json">Exportar plantilla</button><label class="vc19318-import">Importar JSON<input type="file" accept="application/json,.json" data-vc19318-import/></label></div>${controls}<div class="vc19318-options"><button type="button" data-vc19318-act="columns">${s.editor?'Ocultar columnas':'Personalizar columnas'}</button><button type="button" data-vc19318-act="reset">Restablecer filtros</button>${field('Orden','sort',[['volume','Más acciones'],['label','Nombre'],['efficiency','Eficiencia ataque']].map(([id,label])=>option(id,label,cfg.sort)).join(''))}<span>${pre.length} plantillas locales · los datos no se guardan en la plantilla</span></div></section>${s.editor?editor:''}<div class="vc19318-kpis"><div><small>Contactos en muestra</small><strong>${data.coverage.contacts}</strong></div><div><small>Rallies vinculados</small><strong>${data.coverage.rallies}</strong></div><div><small>Grupos</small><strong>${data.coverage.groups}</strong></div><div><small>Sin valoración</small><strong>${data.coverage.unrated}</strong></div><div><small>Sin zona</small><strong>${data.coverage.unknownZone}</strong></div></div><div class="vc19318-grid"><section class="vc19318-panel vc19318-tablepanel"><header><div><small>HOJA MULTICOLUMNA</small><h3>${esc(cfg.name)}</h3></div><span>${data.rows.length} filas</span></header>${rowTable(data)}<p>Haz clic en un grupo para mostrar únicamente sus rallies. Los porcentajes usan contactos valorados del fundamento correspondiente. La zona significa origen de ataque, contacto de recepción o destino de colocación según el fundamento.</p></section>${evidence(data)}</div>${s.showReport?reportPanel(data):''}<div class="vc19318-foot"><p>Las métricas de ataque se calculan solo con acciones A; las de recepción con R y las de saque con S. La eficacia de ataque es (# − = − /) / ataques valorados. Los campos ausentes no se convierten en ceros estadísticos ni en puntos perdidos.</p><div><button type="button" data-vc19310-legacy-page="players:builder">Hojas anteriores</button><button type="button" data-vc19310-legacy-page="reports:">Informes anteriores</button><button type="button" data-vc19318-act="toggle-report">${s.showReport?'Ocultar resumen':'Mostrar resumen'}</button></div></div></div>`;
  return {html,rallies:data.rallies};
 }
 function download(win,name,content,type){if(!win?.Blob||!win?.URL?.createObjectURL||!win.document?.createElement)return false;const b=new win.Blob([content],{type}),url=win.URL.createObjectURL(b),a=win.document.createElement('a');a.href=url;a.download=name;win.document.body.append(a);a.click();a.remove();win.setTimeout?.(()=>win.URL.revokeObjectURL(url),3000);return true;}
 function standaloneHTML(data){const rows=data.rows.map(r=>`<tr><th>${esc(r.label)}</th>${data.config.columns.map(id=>`<td>${display(r.stats[id],METRICS[id].format)}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Volley Coach · ${esc(data.config.name)}</title><style>body{font:14px system-ui;color:#183451;margin:32px}h1{font-size:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bfd0df;padding:9px;text-align:right}th:first-child{text-align:left}thead{background:#eaf3fb}p{color:#415b74}.meta{font-size:12px;color:#607c94}@media print{body{margin:13mm}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><h1>${esc(data.config.name)}</h1><p>Volley Coach V19.3.18 · ${esc(data.team==='ours'?'Nuestro equipo':'Equipo rival')}</p><p class="meta">${data.coverage.contacts} contactos · ${data.coverage.rallies} rallies · ${data.coverage.unrated} sin valoración · exportación local de datos reales</p><table><thead><tr><th>Grupo</th>${data.config.columns.map(id=>`<th>${esc(METRICS[id].label)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><h2>Contexto</h2><p>EFF ataque: (# − = − /) / ataques evaluados; Kill: # / ataques evaluados. Las valoraciones # no son necesariamente puntos del partido. — = sin muestra evaluada.</p><p>K1: ${data.points.k1.won}/${data.points.k1.n} rallies ganados · K2: ${data.points.k2.won}/${data.points.k2.n} rallies ganados. Solo rallies cerrados con saque registrado de la muestra.</p></body></html>`;
 }
 function handleClick({button,state,node,ctx,projection,win,status}){
  const act=button.dataset.vc19318Act,group=button.dataset.vc19318Group,video=button.dataset.vc19318Video;
  if(act===undefined&&group===undefined&&video===undefined)return {handled:false};
  const s=ensureState(state),c=s.config;
  if(group!==undefined){c.focus=c.focus===group?'':group;return {handled:true,repaint:true};}
  if(video!==undefined)return {handled:true,navigateVideo:video};
  if(act==='columns'){s.editor=!s.editor;return {handled:true,repaint:true};}
  if(act==='toggle-report'){s.showReport=!s.showReport;return {handled:true,repaint:true};}
  if(act==='reset'){s.config={...c,set:'',rotation:'',phase:'',player:'',evaluation:'',zone:'',focus:''};return {handled:true,repaint:true};}
  if(act==='formula'){const expr=str(node.querySelector('#vc19318-formula')?.value).slice(0,128);try{compile(expr);c.formula=expr;c.columns=[...new Set([...c.columns,'FORMULA'])];return {handled:true,repaint:true};}catch(e){status?.(e.message);return {handled:true};}}
  if(act==='load'){const id=str(node.querySelector('[data-vc19318-template]')?.value||s.template),kind=id.split(':')[0],name=id.slice(kind.length+1);const selected=kind==='builtin'?BUILTINS.find(x=>x.name===name):kind==='legacy'?legacyPresets(storage(win)).find(x=>x.name===name):kind==='saved'?readPresets(storage(win)).find(x=>x.name===name):null;if(selected){s.config={...defaultConfig(),...selected,focus:''};s.template=id;return {handled:true,repaint:true};}status?.('Selecciona una plantilla válida.');return {handled:true};}
  if(act==='save'){const name=cleanName(win.prompt?.('Nombre de la plantilla (máx. 55 caracteres):',c.name));if(!name)return {handled:true};try{savePreset(storage(win),{...c,name,focus:''});s.config.name=name;s.template='saved:'+name;status?.('Plantilla guardada localmente (solo configuración).');return {handled:true,repaint:true};}catch(e){status?.('No se pudo guardar: '+e.message);return {handled:true};}}
  if(act==='delete'){if(!s.template.startsWith('saved:')){status?.('Solo se pueden borrar plantillas guardadas por el usuario.');return {handled:true};}try{deletePreset(storage(win),s.template.slice(6));s.template='builtin:'+BUILTINS[0].name;status?.('Plantilla local eliminada.');return {handled:true,repaint:true};}catch(e){status?.(e.message);return {handled:true};}}
  let data;try{data=calc(projection,ctx.team,c);}catch(e){status?.(e.message);return {handled:true};}
  if(act==='export-csv'){status?.(download(win,'vc-hoja-'+csvSafeName(c.name)+'.csv',toCSV(data),'text/csv;charset=utf-8')?'CSV exportado.':'Descarga CSV no disponible.');return {handled:true};}
  if(act==='export-json'){status?.(download(win,'vc-plantilla-'+csvSafeName(c.name)+'.json',exportJSON(c),'application/json;charset=utf-8')?'Plantilla JSON exportada.':'Descarga no disponible.');return {handled:true};}
  if(act==='export-html'){status?.(download(win,'vc-informe-'+csvSafeName(c.name)+'.html',standaloneHTML(data),'text/html;charset=utf-8')?'Informe HTML exportado.':'Descarga no disponible.');return {handled:true};}
  if(act==='print'){const tab=win.open?.('','_blank');if(!tab){status?.('Ventana bloqueada: utiliza Exportar informe HTML y después Imprimir > Guardar como PDF.');return {handled:true};}tab.document.write(standaloneHTML(data));tab.document.close();tab.focus?.();tab.print?.();return {handled:true};}
  return {handled:false};
 }
 function handleChange({target,state}){
  const s=ensureState(state);if(target?.dataset?.vc19318Template!==undefined){s.template=target.value;return true;}
  const col=target?.dataset?.vc19318Column;if(col!==undefined){if(!METRICS[col])return false;const cfg=s.config;const next=target.checked?[...new Set([...cfg.columns,col])]:cfg.columns.filter(id=>id!==col);if(!next.length)return true;cfg.columns=next.slice(0,14);cfg.focus='';return true;}
  const key=target?.dataset?.vc19318Filter;if(!key||!['skill','group','set','rotation','phase','player','evaluation','zone','sort'].includes(key))return false;
  const draft={...s.config,[key]:target.value,focus:''};if(!sanitizeConfig(draft))return false;s.config=draft;return true;
 }
 async function handleFile({target,state,win,status}){if(!target?.dataset||target.dataset.vc19318Import===undefined)return false;const file=target.files?.[0];if(!file)return true;
  try{if(file.size>16000)throw Error('El JSON supera el tamaño máximo de 16 KB');const value=await file.text(),cfg=importJSON(value);savePreset(storage(win),cfg);const s=ensureState(state);s.config=cfg;s.template='saved:'+cfg.name;status?.('Plantilla importada y guardada localmente.');win.VC_PRO_ANALYSIS_19310_STATE?.refresh?.();}catch(e){status?.('No se pudo importar: '+e.message);}return true;
 }
 return {VERSION,STORAGE_KEY,SKILLS,GROUPS,METRICS,BUILTINS,defaultConfig,sanitizeConfig,readPresets,legacyPresets,savePreset,deletePreset,ensureState,sourceZone,rowContext,filterContacts,metrics,calc,csvCell,toCSV,importJSON,exportJSON,standaloneHTML,render,handleClick,handleChange,handleFile};
});
