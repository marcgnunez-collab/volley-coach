/* Volley Coach V16.5.7 · Informes Pro
 * Read-only reports from the canonical comparisons model. PDF and standalone HTML
 * are entirely separate from the official match PDF and scouting persistence.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.VC_REPORTS_1657=api;})(typeof window!=='undefined'?window:null,function(){
'use strict';
const C=()=>typeof window!=='undefined'?window.VC_COMPARISONS_1656:require('./139-vc1656-comparisons.js');
const str=v=>String(v??'').trim(),num=v=>Number.isFinite(Number(v))?Number(v):0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>v==null?'Sin muestra':`${Number(v).toLocaleString('es-ES',{maximumFractionDigits:1})} %`;
const count=(yes,total)=>`${num(yes)} / ${num(total)}`;
const rate=(ratio,n)=>`${pct(ratio)} · n=${num(n)}`;
const METRICS=['summary','skills','detail','notes','method'];
const LABELS={summary:'Resumen ejecutivo',skills:'Fundamentos y complejos',detail:'Desglose histórico / comparación',notes:'Observaciones del entrenador',method:'Metodología y límites'};
function sanitize(options={}){
 const kind=['match','player','rival'].includes(options.kind)?options.kind:'match';
 const sections={};for(const k of METRICS)sections[k]=options.sections?.[k]!==false;
 return {kind,matchId:str(options.matchId).slice(0,120),compareId:str(options.compareId).slice(0,120),playerKey:str(options.playerKey).slice(0,200),rivalKey:str(options.rivalKey).slice(0,200),title:str(options.title).slice(0,90),notes:String(options.notes??'').slice(0,1500),sections};
}
const row=(a,b)=>[str(a),str(b)];
const section=(title,rows=[])=>({title,rows:rows.map(r=>r.map(x=>str(x)))});
function matchName(e){return `${e.date||'Sin fecha'} · ${e.opponent||'Rival'} (${e.id})`}
function optionsFor(entries){const a=Array.isArray(entries)?entries:[],c=C();return {matches:a.map(e=>({value:e.id,label:matchName(e)})),players:c?.buildPlayers?a.length?c.buildPlayers(a).players.map(p=>({value:p.key,label:`${p.name} · ${p.matches.length} partido(s)`})):[]:[],rivals:c?.buildRivals?a.length?c.buildRivals(a).groups.map(g=>({value:g.key,label:`${g.name} · ${g.matches.length} partido(s)`})):[]:[]};}
function signature(t){const m=C().metrics(t);return [row('K1 · Side-out',rate(m.k1,t.k1n)),row('K2 · Break',rate(m.k2,t.k2n)),row('Ataque · eficiencia',rate(m.attackEff,t.attackN)),row('Ataque · puntos',count(t.attackK,t.attackN)),row('Recepción · #/+',rate(m.reception,t.recN)),row('Saque · aces',count(t.serveAces,t.serveN))]}
function delta(a,b){return a==null||b==null?'No comparable':`${a-b>0?'+':''}${(a-b).toLocaleString('es-ES',{maximumFractionDigits:1})} pp`}
function make(entries,opts={}){
 const c=C(),o=sanitize(opts),list=Array.isArray(entries)?entries:[],available=optionsFor(list),sections=[];
 if(!c?.metrics||!c?.buildPlayers||!c?.buildRivals)return {error:'No se ha cargado Comparativas Pro (módulo 139).',options:o,available};
 let selected=null,identity='',kindLabel='';
 if(o.kind==='match'){
  selected=list.find(e=>e.id===o.matchId)||list[0];
  if(!selected)return {error:'No hay partidos disponibles para crear un informe.',options:o,available};
  const b=list.find(e=>e.id===o.compareId&&e.id!==selected.id);
  identity=matchName(selected);kindLabel='Informe de partido';const t=selected.own,m=c.metrics(t);
  if(o.sections.summary)sections.push(section('Resumen del partido',[
   row('Partido',identity),row('Rallies cerrados',t.rallies),row('Rallies ganados',count(t.won,t.rallies)),row('K1 · Side-out',rate(m.k1,t.k1n)),row('K2 · Break',rate(m.k2,t.k2n))]));
  if(o.sections.skills)sections.push(section('Fundamentos registrados',[
   ...signature(t),row('Ataque · errores',count(t.attackE,t.attackN)),row('Ataque · bloqueado',count(t.attackB,t.attackN)),row('Recepción positiva',count(t.recPositive,t.recN)),row('Saque · errores',count(t.serveErrors,t.serveN)),row('Ataque del rival (solo codificado)',rate(c.metrics(selected.opp).attackEff,selected.opp.attackN))]));
  if(o.sections.detail){
   const detail=b?[
    row('Comparado con',matchName(b)),
    ...[['K1', 'k1','k1n'],['K2','k2','k2n'],['Ataque EFF','attackEff','attackN'],['Recepción #/+','reception','recN']].map(([name,k,den])=>row(name,`${rate(c.metrics(t)[k],t[den])} | B: ${rate(c.metrics(b.own)[k],b.own[den])} | Δ ${delta(c.metrics(t)[k],c.metrics(b.own)[k])}`))
   ]:[row('Comparación','No se ha seleccionado un segundo partido.')];
   sections.push(section('Comparación de partidos',detail));
  }
 } else if(o.kind==='player'){
  const players=c.buildPlayers(list),p=players.players.find(x=>x.key===o.playerKey)||players.players[0];
  if(!p)return {error:'No hay jugadores con ID y nombre verificables en el historial disponible.',options:o,available};
  selected=p;identity=p.name;kindLabel='Informe individual';const t=p.stats,m=c.metrics(t);
  if(o.sections.summary)sections.push(section('Perfil y participación',[
   row('Jugador',p.name),row('Identificador interno',p.id),row('Partidos con acciones',p.matches.length),row('Acciones codificadas',t.actions)]));
  if(o.sections.skills)sections.push(section('Rendimiento por fundamento',[
   row('Ataque · eficiencia',rate(m.attackEff,t.attackN)),row('Ataque · puntos',count(t.attackK,t.attackN)),row('Errores de ataque',count(t.attackE,t.attackN)),row('Ataques bloqueados',count(t.attackB,t.attackN)),row('Recepción positiva',rate(m.reception,t.recN)),row('Saque · aces',count(t.serveAces,t.serveN)),row('Saque · errores',count(t.serveErrors,t.serveN))]));
  if(o.sections.detail)sections.push(section('Evolución por partido',p.matches.slice().sort((a,b)=>str(a.date).localeCompare(str(b.date))).map(e=>row(`${e.date||'Sin fecha'} · ${e.opponent||'Rival'}`,`Ataque ${rate(c.metrics(e.stats).attackEff,e.stats.attackN)}; recepción ${rate(c.metrics(e.stats).reception,e.stats.recN)}`))));
 }else{
  const rivals=c.buildRivals(list),g=rivals.groups.find(x=>x.key===o.rivalKey)||rivals.groups[0];
  if(!g)return {error:'No hay rivales identificados para el historial disponible.',options:o,available};
  selected=g;identity=g.name;kindLabel='Informe del rival';const own=g.own,opp=g.opp;
  if(o.sections.summary)sections.push(section('Resumen del enfrentamiento',[
   row('Rival',g.name),row('Partidos analizados',g.matches.length),row('Rallies cerrados',own.rallies),row('Rallies nuestros ganados',count(own.won,own.rallies))]));
  if(o.sections.skills)sections.push(section('Comportamiento observado',[
   ...signature(own),row('Ataque del rival (solo codificado)',rate(c.metrics(opp).attackEff,opp.attackN)),row('Ataques rivales codificados',opp.attackN)]));
  if(o.sections.detail)sections.push(section('Partidos contra este rival',g.matches.slice().sort((a,b)=>str(a.date).localeCompare(str(b.date))).map(e=>row(e.date||'Sin fecha',`K1 ${rate(c.metrics(e.own).k1,e.own.k1n)}; K2 ${rate(c.metrics(e.own).k2,e.own.k2n)}; ataque rival n=${e.opp.attackN}`))));
 }
 if(o.sections.notes)sections.push(section('Observaciones del entrenador',o.notes.trim()?o.notes.split(/\r?\n/).filter(Boolean).map((x,i)=>row(i+1,x)):[row('Sin observaciones','Puedes añadir notas antes de exportar.') ]));
 if(o.sections.method)sections.push(section('Metodología y límites',[
  row('Fuente','Scouting codificado, motor Analysis Intelligence 16.1.4 y Comparativas Pro 16.5.6.'),
  row('Muestra',`Hasta ${list.length} scoutings disponibles del equipo seleccionado (máximo 24), solo rallies cerrados.`),
  row('Cálculo','Porcentajes basados en la suma de oportunidades válidas; no se promedian porcentajes de partidos.'),
  row('Ausencia de datos','Sin muestra significa que no hay denominador válido; no equivale a 0 %.'),
  row('Identidad de jugadores','Se requieren ID interno y nombre guardado consistentes; no se equiparan por dorsal.'),
  row('Rivales','Solo cuentan acciones rivales realmente codificadas; no se infieren patrones no observados.'),
  row('Filtros','Este informe analiza el historial del equipo, no los filtros individuales de set/rotación del análisis del partido.'),
  row('Uso','Informe descriptivo. No implica causalidad ni ajuste al nivel del rival.')]));
 return {title:o.title||`${kindLabel} · ${identity}`,kind:o.kind,identity,subject:selected,sections,options:o,available,generated:new Date().toISOString().slice(0,16).replace('T',' '),count:list.length};
}
function reportBody(plan){if(plan.error)return `<p class="vc1657-error">${esc(plan.error)}</p>`;return `<header class="vc1657-document-header"><span>VOLLEY COACH · INFORMES PRO</span><h2>${esc(plan.title)}</h2><p>${esc(plan.identity)} · ${esc(plan.generated)} · Equipo seleccionado</p></header>${plan.sections.length?plan.sections.map(s=>`<section class="vc1657-reportsection"><h3>${esc(s.title)}</h3><table><tbody>${s.rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></section>`).join(''):'<p>Selecciona al menos un apartado para incluir información.</p>'}<footer>Informes Pro · Versión 16.5.7 · Datos registrados, sin modificaciones del scouting.</footer>`}
function select(id,values,selected,empty){return `<select id="${id}" aria-label="${esc(id)}">${empty?`<option value="">${esc(empty)}</option>`:''}${values.map(v=>`<option value="${esc(v.value)}" ${v.value===selected?'selected':''}>${esc(v.label)}</option>`).join('')}</select>`}
function render(entries,options={}){
 const p=make(entries,options),o=p.options||sanitize(options),a=p.available||optionsFor(entries);
 const kind=[['match','Partido'],['player','Jugador'],['rival','Rival']].map(([key,label])=>`<option value="${key}" ${o.kind===key?'selected':''}>${label}</option>`).join('');
 const key=o.kind==='match'?'matchId':o.kind==='player'?'playerKey':'rivalKey',list=o.kind==='match'?a.matches:o.kind==='player'?a.players:a.rivals;
 const chosen=o[key]&&list.some(x=>x.value===o[key])?o[key]:list[0]?.value||'';
 const selectors=`<label>${o.kind==='match'?'Partido':'Seleccionar '+(o.kind==='player'?'jugador':'rival')}${select('vc1657-subject',list,chosen)}</label>${o.kind==='match'?`<label>Comparar con (opcional)${select('vc1657-compare',[{value:'',label:'Sin comparación'},...a.matches.filter(x=>x.value!==chosen)],o.compareId)}</label>`:''}`;
 return `<section class="vc1657-work"><header class="vc1657-intro"><div><span>REPORTING STUDIO · V16.5.7</span><h3>Informes configurables</h3><p>Informe nuevo e independiente. El PDF oficial de partido permanece sin cambios.</p></div><span class="vc1657-readonly">SOLO LECTURA</span></header><div class="vc1657-layout"><div class="vc1657-editor"><h4>Configuración</h4><label>Tipo de informe<select id="vc1657-kind">${kind}</select></label>${selectors}<label>Título personalizado<input id="vc1657-title" maxlength="90" placeholder="Título automático" value="${esc(o.title)}"></label><fieldset><legend>Apartados a incluir</legend>${METRICS.map(k=>`<label class="vc1657-toggle"><input type="checkbox" data-vc1657-section="${k}" ${o.sections[k]?'checked':''}>${esc(LABELS[k])}</label>`).join('')}</fieldset><label>Notas del entrenador<textarea id="vc1657-notes" maxlength="1500" rows="5" placeholder="Observaciones, prioridades y aspectos a revisar…">${esc(o.notes)}</textarea></label><p class="vc1657-hint">La configuración se guarda solo en este navegador. Las notas y datos del informe no se suben a la nube.</p><div class="vc1657-buttons"><button id="vc1657-pdf" type="button" ${p.error?'disabled':''}>Descargar PDF</button><button id="vc1657-html" type="button" ${p.error?'disabled':''}>Descargar HTML</button></div><p id="vc1657-status" role="status" aria-live="polite"></p></div><div class="vc1657-preview"><div class="vc1657-previewtop"><strong>Vista previa del informe</strong><small>Generado solo a partir de acciones guardadas</small></div><article id="vc1657-preview-body" class="vc1657-paper">${reportBody(p)}</article></div></div></section>`;
}
// Presentation-only preferences: never persist scouting IDs, player names or notes.
function loadPrefs(){
 try{const raw=JSON.parse(window.localStorage.getItem('vc1657-report-layout')||'{}');return sanitize({kind:raw.kind,sections:raw.sections});}catch(_){return sanitize();}
}
function savePrefs(options){
 try{const o=sanitize(options);window.localStorage.setItem('vc1657-report-layout',JSON.stringify({kind:o.kind,sections:o.sections}));return true;}catch(_){return false;}
}
const DOCUMENT_CSS=`*{box-sizing:border-box}body{background:#f1f5f9;color:#17344d;font:13px/1.5 Arial,sans-serif;margin:0;padding:24px}.vc1657-paper{background:white;max-width:820px;margin:auto;padding:35px 40px;box-shadow:0 5px 25px #162f4920}.vc1657-document-header{border-bottom:3px solid #256995;padding-bottom:18px;margin-bottom:25px}.vc1657-document-header span{font-size:10px;font-weight:bold;letter-spacing:2px;color:#2674a1}.vc1657-document-header h2{font-size:25px;color:#153f5f;margin:8px 0}.vc1657-document-header p{color:#648098;font-size:11px;margin:0}.vc1657-reportsection{margin-bottom:23px;break-inside:avoid-page}.vc1657-reportsection h3{font-size:15px;color:#18567f;margin:0 0 8px}.vc1657-reportsection table{width:100%;border-collapse:collapse;table-layout:fixed}.vc1657-reportsection th,.vc1657-reportsection td{border-bottom:1px solid #e2eaf1;padding:8px;vertical-align:top;text-align:left;overflow-wrap:anywhere}.vc1657-reportsection th{font-size:11px;width:37%;color:#4c6880;background:#f6f9fc}.vc1657-reportsection td{font-size:12px;white-space:pre-wrap}.vc1657-paper footer{border-top:1px solid #d6e2ec;margin-top:22px;padding-top:10px;color:#7a90a2;font-size:10px}@media print{@page{size:A4;margin:14mm}body{background:white;padding:0}.vc1657-paper{box-shadow:none;max-width:none;padding:0}.vc1657-reportsection{break-inside:auto}.vc1657-reportsection tr{break-inside:avoid}}`;
function htmlDocument(plan){const title=plan.error?'Informe no disponible':plan.title;return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${DOCUMENT_CSS}</style></head><body><article class="vc1657-paper">${reportBody(plan)}</article></body></html>`}
function filename(plan,ext){const base=str(plan?.title||'informe').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,75)||'informe';return `volley-coach-${base}-v1657.${ext}`}
function createPDF(plan,PDF){
 if(plan.error)throw new Error(plan.error);
 if(typeof PDF!=='function')throw new Error('No está disponible jsPDF');
 const pdf=new PDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
 const W=210,H=297,L=18,R=18,B=18;let y=28;
 const safeText=s=>str(s).replace(/[\u0000-\u001f]/g,' ').replace(/[—–]/g,'-');
 const color=(r,g,b)=>pdf.setTextColor(r,g,b);
 const addPage=()=>{pdf.addPage();y=23};
 const space=h=>{if(y+h>H-B)addPage()};
 function lines(text,width){return pdf.splitTextToSize(safeText(text),width)}
 function paragraph(content,font=10,bold=false){
  pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(font);
  const pieces=lines(content,W-L-R),h=font*.42+1;
  for(const line of pieces){space(h);pdf.text(line,L,y);y+=h;}
 }
 color(18,80,119);pdf.setFont('helvetica','bold');pdf.setFontSize(10);
 pdf.text('VOLLEY COACH / INFORMES PRO',L,y);y+=11;
 color(24,54,75);paragraph(plan.title,17,true);y+=3;
 color(88,119,142);paragraph(`${plan.identity} · ${plan.generated}`,9);y+=7;
 for(const s of plan.sections){
  space(18);color(20,89,128);paragraph(s.title,12,true);y+=3;
  for(const [label,value] of s.rows){
   pdf.setFont('helvetica','bold');pdf.setFontSize(9);
   const left=lines(label,61),right=lines(value,W-L-R-66),step=4.7;
   // Keep both cells on the same page; a long note may wrap to many lines.
   const h=(Math.max(left.length,right.length,1)+1)*step;
   space(h);
   color(64,96,118);pdf.setFont('helvetica','bold');pdf.setFontSize(9);
   left.forEach((line,i)=>pdf.text(line,L,y+i*step));
   color(24,52,75);pdf.setFont('helvetica','normal');pdf.setFontSize(9);
   right.forEach((line,i)=>pdf.text(line,L+66,y+i*step));
   y+=h;
   pdf.setDrawColor(228,234,240);pdf.line(L,y-1,W-R,y-1);
  }
  y+=8;
 }
 const total=pdf.getNumberOfPages();
 for(let p=1;p<=total;p++){
  pdf.setPage(p);color(113,134,151);pdf.setFont('helvetica','normal');pdf.setFontSize(8);
  pdf.text(`Volley Coach · V16.5.7 · ${p}/${total}`,L,H-10);
 }
 return pdf;
}

const css=`
#vc157-studio[data-vc1657-reports="true"] .vc157-inspector,#vc157-studio[data-vc1657-reports="true"] .vc157-export,#vc157-studio[data-vc1657-reports="true"] .vc157-actions{display:none!important}
#vc157-studio[data-vc1657-reports="true"] .vc157-columns{grid-template-columns:minmax(0,1fr)!important}
#vc157-studio .vc157-tabs{grid-template-columns:repeat(7,minmax(0,1fr))!important}
#vc157-studio .vc1657-work{display:grid;gap:12px;color:#213e56;min-width:0}
#vc157-studio .vc1657-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
#vc157-studio .vc1657-intro span{color:#397da7;font-weight:900;font-size:10px;letter-spacing:.08em}
#vc157-studio .vc1657-intro h3{margin:5px 0;font-size:21px;color:#123e5c}
#vc157-studio .vc1657-intro p,#vc157-studio .vc1657-hint{margin:3px 0;color:#6a8294;font-size:11px;line-height:1.5}
#vc157-studio .vc1657-readonly{background:#e8f3fa;border:1px solid #c7dfe9;padding:8px;border-radius:9px}
#vc157-studio .vc1657-layout{display:grid;grid-template-columns:minmax(250px,.75fr) minmax(0,1.25fr);gap:14px;align-items:start}
#vc157-studio .vc1657-editor,#vc157-studio .vc1657-preview{background:white;border:1px solid #dce7ef;border-radius:12px;padding:17px;min-width:0}
#vc157-studio .vc1657-editor{display:grid;gap:14px}
#vc157-studio .vc1657-editor h4{margin:0;color:#1b4b6c;font-size:16px}
#vc157-studio .vc1657-editor>label{display:grid;gap:5px;font-size:11px;color:#56788f;font-weight:800}
#vc157-studio .vc1657-editor :is(select,input[type=text],input:not([type]),textarea){width:100%;border:1px solid #cbdce8;background:#fff;border-radius:8px;padding:9px 10px;font-size:12px;min-width:0;color:#183c57}
#vc157-studio .vc1657-editor fieldset{border:1px solid #e0eaf1;border-radius:10px;display:grid;gap:8px;padding:12px;margin:0}
#vc157-studio .vc1657-editor legend{font-size:11px;font-weight:850;color:#416a83;padding:0 4px}
#vc157-studio .vc1657-toggle{display:flex;gap:9px;align-items:center;font-size:11px;font-weight:700;color:#375c73}
#vc157-studio .vc1657-toggle input{width:16px;height:16px;margin:0;accent-color:#186c9d}
#vc157-studio .vc1657-buttons{display:flex;gap:8px;flex-wrap:wrap}
#vc157-studio .vc1657-buttons button{background:#176b9f;border:1px solid #176b9f;color:white;border-radius:8px;padding:10px 15px;font-size:12px;font-weight:800;cursor:pointer}
#vc157-studio .vc1657-buttons #vc1657-html{background:#eaf3f9;color:#195a82;border-color:#bfd7e6}
#vc157-studio .vc1657-buttons button:disabled{opacity:.45;cursor:not-allowed}
#vc157-studio #vc1657-status{font-size:11px;color:#336987;margin:0;min-height:14px}
#vc157-studio .vc1657-previewtop{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#426984}
#vc157-studio .vc1657-previewtop small{color:#7995a6}
#vc157-studio .vc1657-paper{background:#fff;border:1px solid #dae8f0;border-radius:10px;padding:26px;box-shadow:0 4px 20px #1b52700a}
#vc157-studio .vc1657-document-header{border-bottom:3px solid #397da7;padding-bottom:13px;margin-bottom:20px}
#vc157-studio .vc1657-document-header span{font-size:10px;font-weight:900;letter-spacing:.10em;color:#397da7}
#vc157-studio .vc1657-document-header h2{font-size:20px;color:#17455f;margin:7px 0}
#vc157-studio .vc1657-document-header p{color:#748da0;font-size:10px}
#vc157-studio .vc1657-reportsection{margin:0 0 20px}
#vc157-studio .vc1657-reportsection h3{font-size:14px;color:#1a6088;margin:0 0 8px}
#vc157-studio .vc1657-reportsection table{width:100%;border-collapse:collapse;table-layout:fixed}
#vc157-studio .vc1657-reportsection :is(td,th){padding:8px;border-bottom:1px solid #e7edf1;text-align:left;vertical-align:top;overflow-wrap:anywhere;font-size:11px;white-space:pre-wrap}
#vc157-studio .vc1657-reportsection th{width:34%;background:#f6f9fc;color:#57778a;font-weight:700}
#vc157-studio .vc1657-paper footer{font-size:9px;color:#7891a3;border-top:1px solid #e4edf3;padding-top:10px}
#vc157-studio .vc1657-error{color:#a3523a;font-size:12px}
@media(max-width:1180px){#vc157-studio .vc1657-layout{grid-template-columns:1fr}#vc157-studio .vc157-tabs{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
@media(max-width:660px){#vc157-studio .vc157-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}#vc157-studio .vc1657-editor,#vc157-studio .vc1657-preview{padding:10px}#vc157-studio .vc1657-paper{padding:12px}}
`;
return Object.freeze({loadPrefs,savePrefs,version:'16.5.7',sanitize,optionsFor,make,render,reportBody,htmlDocument,filename,createPDF,css});
});
