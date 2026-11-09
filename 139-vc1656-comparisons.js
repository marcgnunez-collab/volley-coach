/* Volley Coach V16.5.6 · Comparative Center Pro
 * Pure, read-only cross-match calculations based on Analysis Intelligence 16.1.4.
 * No match changes, cloud calls, scouting persistence or inferred player identities.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VC_COMPARISONS_1656=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const text=v=>String(v??'').trim();
 const esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim();
 const n=v=>Number.isFinite(Number(v))?Number(v):0;
 const ratio=(w,total)=>total>0?Math.round(1000*w/total)/10:null;
 const fmt=v=>v===null||v===undefined?'—':`${n(v).toLocaleString('es-ES',{maximumFractionDigits:1})} %`;
 const value=(v,suffix='')=>v===null||v===undefined?'—':`${n(v).toLocaleString('es-ES',{maximumFractionDigits:1})}${suffix}`;
 const safeId=v=>text(v).slice(0,120);
 const blank=()=>({rallies:0,won:0,k1n:0,k1w:0,k2n:0,k2w:0,attackN:0,attackK:0,attackE:0,attackB:0,recN:0,recPositive:0,serveN:0,serveAces:0,serveErrors:0,actions:0});
 function totals(model){
  const p=model?.points||{},s=model?.skills||{},a=s.A||{},r=s.R||{},serve=s.S||{};
  return {rallies:n(p.rallies),won:n(p.won),k1n:n(p.k1?.n),k1w:n(p.k1?.w),k2n:n(p.k2?.n),k2w:n(p.k2?.w),attackN:n(a.n),attackK:n(a.kills),attackE:n(a.errors),attackB:n(a.blocked),recN:n(r.n),recPositive:n(r.positive),serveN:n(serve.n),serveAces:n(serve.kills),serveErrors:n(serve.errors),actions:Array.isArray(model?.actions)?model.actions.length:0};
 }
 function sum(rows){
  const result=blank();for(const row of rows){for(const k of Object.keys(result))result[k]+=n(row?.[k])}return result;
 }
 function metrics(t){
  return {k1:ratio(t.k1w,t.k1n),k2:ratio(t.k2w,t.k2n),attackEff:ratio(t.attackK-t.attackE-t.attackB,t.attackN),attackKill:ratio(t.attackK,t.attackN),reception:ratio(t.recPositive,t.recN),win:ratio(t.won,t.rallies)};
 }
 function entry(match,own,opponent){
  return {id:safeId(match?.id),date:text(match?.date),opponent:text(match?.opponent),status:text(match?.status),own:totals(own),opp:totals(opponent),actions:Array.isArray(own?.actions)?own.actions:[],invalidRallies:n(own?.invalidRallies)};
 }
 function summarizeMatches(entries){
  const arr=Array.isArray(entries)?entries:[];return {count:arr.length,own:sum(arr.map(e=>e.own)),opp:sum(arr.map(e=>e.opp)),missing:arr.filter(e=>!e.own?.rallies).length};
 }
 // A player can only be linked across matches if playerId AND a nonempty
 // normalized saved name agree. Skip a whole match's ID when it has conflicting
 // snapshots. A shirt number is never a cross-match identifier.
 function buildPlayers(entries){
  const players=new Map(),skipped={missingId:0,missingName:0,conflicts:0};
  for(const e of Array.isArray(entries)?entries:[]){
   const ids=new Map();
   for(const row of Array.isArray(e.actions)?e.actions:[]){
    if(row?.team!=='ours')continue;
    const id=Number(row.a?.playerId);
    if(!Number.isSafeInteger(id)||id<=0){skipped.missingId++;continue}
    const name=norm(row.a?.playerNameSnapshot);
    if(!name){skipped.missingName++;continue}
    if(!ids.has(id))ids.set(id,{names:new Set(),actions:[]});
    const item=ids.get(id);item.names.add(name);item.actions.push(row);
   }
   for(const [id,item] of ids){
    if(item.names.size!==1){skipped.conflicts+=item.actions.length;continue}
    const name=[...item.names][0],key=`${id}|${name}`;
    if(!players.has(key))players.set(key,{key,id,name:text(item.actions[0].a.playerNameSnapshot),matches:[],stats:blank()});
    const rec=players.get(key),t=blank();
    for(const row of item.actions){
     const skill=text(row.skill),ev=text(row.ev);t.actions++;
     if(skill==='A'){t.attackN++;if(ev==='#')t.attackK++;if(ev==='=')t.attackE++;if(ev==='/')t.attackB++;}
     if(skill==='R'){t.recN++;if(ev==='#'||ev==='+')t.recPositive++;}
     if(skill==='S'){t.serveN++;if(ev==='#')t.serveAces++;if(ev==='=')t.serveErrors++;}
    }
    rec.matches.push({id:e.id,opponent:e.opponent,date:e.date,stats:t});
    rec.stats=sum([rec.stats,t]);
   }
  }
  return {players:[...players.values()].sort((a,b)=>b.matches.length-a.matches.length||b.stats.actions-a.stats.actions||a.name.localeCompare(b.name,'es')),skipped};
 }
 function buildRivals(entries){
  const groups=new Map();let unidentified=0;
  for(const e of Array.isArray(entries)?entries:[]){
   const key=norm(e.opponent);
   if(!key||['rival','desconocido','sin rival','sin registrar'].includes(key)){unidentified++;continue}
   if(!groups.has(key))groups.set(key,{key,name:e.opponent,matches:[],own:blank(),opp:blank()});
   const g=groups.get(key);g.matches.push(e);g.own=sum([g.own,e.own]);g.opp=sum([g.opp,e.opp]);
  }
  return {groups:[...groups.values()].sort((a,b)=>b.matches.length-a.matches.length||b.own.rallies-a.own.rallies||a.name.localeCompare(b.name,'es')),unidentified};
 }
 function csvSafe(v){let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(s)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
 function csv(rows){return '\ufeff'+rows.map(a=>a.map(csvSafe).join(';')).join('\r\n')}
 function exportRows(entries,mode='matches'){
  const e=Array.isArray(entries)?entries:[];
  if(mode==='players')return csv([['Jugador','ID interno','Partidos','Ataques','Puntos ataque','Errores ataque','Bloqueado','EFF ataque %','Recepciones','Recepciones positivas','Recepción positiva %'],...buildPlayers(e).players.map(p=>[p.name,p.id,p.matches.length,p.stats.attackN,p.stats.attackK,p.stats.attackE,p.stats.attackB,metrics(p.stats).attackEff??'',p.stats.recN,p.stats.recPositive,metrics(p.stats).reception??''])]);
  if(mode==='rivals')return csv([['Rival','Partidos','Rallies válidos','K1 nuestro %','K1 oportunidades','K2 nuestro %','K2 oportunidades','Atq. EFF nuestro %','Ataques nuestros','Atq. EFF rival %','Ataques rival'],...buildRivals(e).groups.map(g=>[g.name,g.matches.length,g.own.rallies,metrics(g.own).k1??'',g.own.k1n,metrics(g.own).k2??'',g.own.k2n,metrics(g.own).attackEff??'',g.own.attackN,metrics(g.opp).attackEff??'',g.opp.attackN])]);
  return csv([['Fecha','Rival','Scouting ID','Rallies válidos','K1 %','K1 n','K2 %','K2 n','Ataque EFF %','Ataques n','Recepción positiva %','Recepciones n'],...e.map(x=>[x.date,x.opponent,x.id,x.own.rallies,metrics(x.own).k1??'',x.own.k1n,metrics(x.own).k2??'',x.own.k2n,metrics(x.own).attackEff??'',x.own.attackN,metrics(x.own).reception??'',x.own.recN])]);
 }
 function selector(id,list,selected){return `<select id="${id}" aria-label="${id}">${list.map(v=>`<option value="${esc(v.key)}" ${v.key===selected?'selected':''}>${esc(v.label)}</option>`).join('')}</select>`}
 const cell=(w,total)=>`${fmt(ratio(w,total))}<small>${n(w)}/${n(total)}</small>`;
 const rateCell=(rate,attempts)=>`${fmt(rate)}<small>n = ${attempts}</small>`;
 const diff=(a,b)=>a===null||b===null?'—':`${a-b>0?'+':''}${value(Math.round((a-b)*10)/10,' pp')}`;
 function renderMatches(entries,state){
  if(!entries.length)return '<p>No hay scoutings disponibles en este equipo.</p>';
  const opts=entries.map(e=>({key:e.id,label:`${e.date||'Sin fecha'} · ${e.opponent||'Rival'} (${e.id})`}));
  const a=entries.find(e=>e.id===state.matchA)||entries[0];
  const b=entries.find(e=>e.id===state.matchB&&e.id!==a.id)||entries.find(e=>e.id!==a.id);
  const overall=summarizeMatches(entries),m=metrics(overall.own);
  const summary=`<div class="vc1656-summary"><div><span>Scoutings</span><strong>${overall.count}</strong></div><div><span>Rallies válidos</span><strong>${overall.own.rallies}</strong></div><div><span>K1 total</span><strong>${fmt(m.k1)}</strong><small>${overall.own.k1w}/${overall.own.k1n}</small></div><div><span>Ataque EFF</span><strong>${fmt(m.attackEff)}</strong><small>${overall.own.attackN} ataques</small></div></div>`;
  const compareRows=[['K1 · Side-out','k1','k1w','k1n'],['K2 · Break','k2','k2w','k2n'],['Ataque · EFF','attackEff',null,'attackN'],['Recepción #/+','reception','recPositive','recN'],['Rallies ganados','win','won','rallies']].map(([title,key,num,den])=>{
   const va=metrics(a.own)[key],vb=b?metrics(b.own)[key]:null;
   return `<tr><th>${title}</th><td>${rateCell(va,a.own[den])}</td><td>${b?rateCell(vb,b.own[den]):'—'}</td><td>${diff(va,vb)}</td></tr>`;
  }).join('');
  const rows=entries.map(e=>{const m=metrics(e.own);return `<tr><td><button type="button" data-season-match="${esc(e.id)}">${esc(e.opponent||'Rival')}</button><small>${esc(e.date||'Sin fecha')}</small></td><td>${e.own.rallies}</td><td>${rateCell(m.k1,e.own.k1n)}</td><td>${rateCell(m.k2,e.own.k2n)}</td><td>${rateCell(m.attackEff,e.own.attackN)}</td><td>${rateCell(m.reception,e.own.recN)}</td></tr>`}).join('');
  return `${summary}<div class="vc1656-card"><h4>Comparar dos partidos</h4><div class="vc1656-controls"><label>Partido A${selector('vc1656-match-a',opts,a.id)}</label><label>Partido B${selector('vc1656-match-b',[{key:'',label:'Sin segundo partido'},...opts.filter(e=>e.id!==a.id)],b?.id||'')}</label></div><div class="vc1656-tablewrap"><table><thead><tr><th>Métrica</th><th>Partido A</th><th>Partido B</th><th>Diferencia A − B</th></tr></thead><tbody>${compareRows}</tbody></table></div><p class="vc1656-foot">Diferencias en puntos porcentuales (pp), no en porcentaje relativo. Cada tasa muestra su propio denominador. Los partidos sin ocasiones registradas muestran «—».</p></div><div class="vc1656-card"><h4>Historial comparable · últimos ${entries.length} partidos</h4><div class="vc1656-tablewrap"><table><thead><tr><th>Scouting</th><th>Rallies</th><th>K1</th><th>K2</th><th>Atq. EFF</th><th>Rec. #/+</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 }
 function renderPlayers(entries,state){
  const data=buildPlayers(entries),players=data.players;
  if(!players.length)return '<div class="vc1656-card">No hay jugadores con identidad verificable (ID interno y nombre guardado) en los scoutings analizados.</div>';
  const opts=players.map(p=>({key:p.key,label:`${p.name} · ${p.matches.length} partido(s)`}));
  const a=players.find(p=>p.key===state.playerA)||players[0],b=players.find(p=>p.key===state.playerB&&p.key!==a.key)||players.find(p=>p.key!==a.key);
  const measures=[['Partidos','matches'],['Acciones','actions'],['Ataques','attackN'],['Puntos en ataque','attackK'],['Errores + bloqueos','negative'],['Ataque EFF','attackEff'],['Recepciones','recN'],['Recepción positiva','reception'],['Aces','serveAces']];
  const datum=(p,k)=>{if(!p)return null;if(k==='matches')return p.matches.length;if(k==='negative')return p.stats.attackE+p.stats.attackB;if(['attackEff','reception'].includes(k))return metrics(p.stats)[k];return p.stats[k]};
  const row=measures.map(([label,key])=>{const x=datum(a,key),y=datum(b,key),rate=['attackEff','reception'].includes(key);const note=k=>key==='attackEff'?`n = ${k?.stats.attackN||0}`:key==='reception'?`n = ${k?.stats.recN||0}`:'';return `<tr><th>${label}</th><td>${rate?fmt(x):value(x)}<small>${note(a)}</small></td><td>${b?(rate?fmt(y):value(y)):'—'}<small>${note(b)}</small></td></tr>`}).join('');
  const history=p=>p.matches.slice().sort((x,y)=>x.date.localeCompare(y.date)).map(m=>`<tr><td><button data-season-match="${esc(m.id)}">${esc(m.opponent||'Rival')}</button><small>${esc(m.date||'Sin fecha')}</small></td><td>${m.stats.attackK}/${m.stats.attackN}</td><td>${rateCell(metrics(m.stats).attackEff,m.stats.attackN)}</td><td>${rateCell(metrics(m.stats).reception,m.stats.recN)}</td></tr>`).join('');
  return `<div class="vc1656-card"><h4>Comparación de jugadores · equipo propio</h4><div class="vc1656-controls"><label>Jugador A${selector('vc1656-player-a',opts,a.key)}</label><label>Jugador B${selector('vc1656-player-b',[{key:'',label:'Sin segundo jugador'},...opts.filter(p=>p.key!==a.key)],b?.key||'')}</label></div><div class="vc1656-tablewrap"><table><thead><tr><th>Métrica</th><th>${esc(a.name)}</th><th>${esc(b?.name||'—')}</th></tr></thead><tbody>${row}</tbody></table></div><p class="vc1656-foot">No se igualan jugadores por dorsal ni por parecido de nombre. Cada identidad requiere ID interno + nombre guardado; partidos con nombres contradictorios para un mismo ID se excluyen. Acciones sin identificación verificable: ${data.skipped.missingId+data.skipped.missingName}; acciones con identidad contradictoria: ${data.skipped.conflicts}.</p></div><div class="vc1656-grid"><div class="vc1656-card"><h4>Evolución · ${esc(a.name)}</h4><div class="vc1656-tablewrap"><table><thead><tr><th>Partido</th><th>Ataque #/n</th><th>EFF</th><th>Rec. #/+</th></tr></thead><tbody>${history(a)}</tbody></table></div></div>${b?`<div class="vc1656-card"><h4>Evolución · ${esc(b.name)}</h4><div class="vc1656-tablewrap"><table><thead><tr><th>Partido</th><th>Ataque #/n</th><th>EFF</th><th>Rec. #/+</th></tr></thead><tbody>${history(b)}</tbody></table></div></div>`:''}</div>`;
 }
 function renderRivals(entries){
  const data=buildRivals(entries);if(!data.groups.length)return '<div class="vc1656-card">No hay nombres de rivales suficientemente identificados en los scoutings disponibles.</div>';
  const rows=data.groups.map(g=>{const own=metrics(g.own),opp=metrics(g.opp);return `<tr><td><strong>${esc(g.name)}</strong><small>${g.matches.length} partido(s)</small></td><td>${g.own.rallies}</td><td>${rateCell(own.k1,g.own.k1n)}</td><td>${rateCell(own.k2,g.own.k2n)}</td><td>${rateCell(own.attackEff,g.own.attackN)}</td><td>${rateCell(opp.attackEff,g.opp.attackN)}</td></tr>`}).join('');
  return `<div class="vc1656-card"><h4>Scouting de rivales · comportamiento observado</h4><p>Compara nuestro rendimiento contra cada rival y la eficiencia de los ataques que hemos registrado del otro equipo. No se atribuye a un jugador rival sin identificación fiable.</p><div class="vc1656-tablewrap"><table><thead><tr><th>Rival</th><th>Rallies</th><th>KI nuestro</th><th>KII nuestro</th><th>Atq. EFF propio</th><th>Atq. EFF rival</th></tr></thead><tbody>${rows}</tbody></table></div><p class="vc1656-foot">Agrupación por nombre completo normalizado; ${data.unidentified} partido(s) sin rival identificado quedan fuera de los agregados. Los porcentajes son cocientes de sumas de acciones, no promedios de porcentajes; los rivales no son necesariamente comparables en nivel o contexto.</p></div>`;
 }
 function render(entries,mode,state={}){
  const arr=Array.isArray(entries)?entries:[],kind=['matches','players','rivals'].includes(mode)?mode:'matches';
  const body=kind==='players'?renderPlayers(arr,state):kind==='rivals'?renderRivals(arr):renderMatches(arr,state);
  return `<section class="vc1656-center"><div class="vc1656-heading"><div><span>CENTRO DE COMPARATIVAS · V16.5.6</span><h3>${kind==='players'?'Jugadores y evolución':kind==='rivals'?'Rivales observados':'Comparador de partidos'}</h3><p>Datos de los últimos ${arr.length} scoutings disponibles. Solo rallies cerrados. Los filtros superiores de equipo, set, rotación y complejo solo afectan al partido individual; estas comparativas utilizan el equipo propio y el historial completo.</p></div><button type="button" id="vc1656-export">Exportar CSV</button></div>${body}<p class="vc1656-foot">No se modifican partidos ni scoutings. Los porcentajes se basan en intentos válidos y los datos ausentes nunca se sustituyen por cero.</p></section>`;
 }
 const css=`
 #vc157-studio[data-vc1656-comparisons="true"] .vc157-export,
 #vc157-studio[data-vc1656-comparisons="true"] .vc157-actions{display:none!important}
 #vc157-studio .vc1656-center{display:grid;gap:14px;min-width:0;color:#203e55}
 #vc157-studio .vc1656-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
 #vc157-studio .vc1656-heading span{font-size:10px;letter-spacing:.09em;font-weight:850;color:#397a9c}
 #vc157-studio .vc1656-heading h3{margin:4px 0;font-size:20px;color:#153c5b}
 #vc157-studio .vc1656-heading p{font-size:12px;color:#687e8e;margin:4px 0}
 #vc157-studio #vc1656-export{border:1px solid #a9c8dd;background:#eaf5fc;color:#174c71;padding:9px 14px;border-radius:9px;font-weight:750;min-height:39px;cursor:pointer}
 #vc157-studio .vc1656-card{border:1px solid #dae7ee;border-radius:13px;background:#fff;padding:14px;min-width:0}
 #vc157-studio .vc1656-card h4{font-size:16px;margin:0 0 12px;color:#1b4563}
 #vc157-studio .vc1656-card p{font-size:12px;color:#536c7e}
 #vc157-studio .vc1656-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
 #vc157-studio .vc1656-summary>div{display:flex;flex-direction:column;padding:12px;background:#f3f8fb;border:1px solid #dbe9f0;border-radius:10px}
 #vc157-studio .vc1656-summary strong{font-size:22px;color:#164a6a;margin-top:4px}
 #vc157-studio .vc1656-summary span,#vc157-studio .vc1656-summary small{font-size:11px;color:#617c8e}
 #vc157-studio .vc1656-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
 #vc157-studio .vc1656-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}
 #vc157-studio .vc1656-controls label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#48637a;min-width:0}
 #vc157-studio .vc1656-controls select{min-height:40px;width:100%;min-width:0;padding:8px;border-radius:8px;border:1px solid #c9dce8;background:white;color:#244d68;font-size:12px}
 #vc157-studio .vc1656-tablewrap{max-width:100%;overflow:auto}
 #vc157-studio .vc1656-tablewrap table{width:100%;border-collapse:collapse;font-size:12px;min-width:490px}
 #vc157-studio .vc1656-tablewrap :is(th,td){padding:10px 9px;border-bottom:1px solid #e8eef3;text-align:left;vertical-align:top;white-space:nowrap}
 #vc157-studio .vc1656-tablewrap thead th{background:#f1f6fa;color:#375a72;font-size:11px}
 #vc157-studio .vc1656-tablewrap small{display:block;color:#7790a0;font-size:10px;margin-top:3px}
 #vc157-studio .vc1656-tablewrap button{border:0;background:transparent;padding:0;text-align:left;color:#16649c;text-decoration:underline;cursor:pointer;font-weight:700}
 #vc157-studio .vc1656-foot{margin:10px 0 2px;font-size:11px!important;color:#718497!important;line-height:1.5}
 @media(max-width:850px){#vc157-studio .vc1656-grid{grid-template-columns:1fr}#vc157-studio .vc1656-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:540px){#vc157-studio .vc1656-controls{grid-template-columns:1fr}#vc157-studio .vc1656-heading h3{font-size:17px}}
 `;
 return Object.freeze({version:'16.5.6',entry,totals,sum,metrics,summarizeMatches,buildPlayers,buildRivals,exportRows,render,css});
});
