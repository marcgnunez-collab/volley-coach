/* VC20715_BUNDLE: preserved original deferred scripts; keep execution order. */
/* VC20715_SOURCE_BEGIN:140-vc1657-professional-reports.js */
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

/* VC20715_SOURCE_END:140-vc1657-professional-reports.js */

;
/* VC20715_SOURCE_BEGIN:139-vc1656-comparisons.js */
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

/* VC20715_SOURCE_END:139-vc1656-comparisons.js */

;
/* VC20715_SOURCE_BEGIN:138-vc1655-tactical-video.js */
/* Volley Coach V16.5.5 · Tactical Video Integration.
 * Read-only tactical selection. Reparents the ONE existing V7.8 video frame;
 * never constructs video/iframe elements or changes any cloud/scouting engine.
 * Explicit clip saves use the existing Video Engine only on a user click. */
(()=>{
 'use strict';
 if(window.VC_TACTICAL_VIDEO_1655)return;
 const $=id=>document.getElementById(id);
 let dock=null,rail=null,studio=null,analysis=null,videoHub=null,frame=null,homeMarker=null,homeParent=null;
 let inspectorObserver=null,contentObserver=null,navObserver=null,studioObserver=null;
 let selected=[],currentIndex=-1,active=false,mounted=false,lastMatch='',lastSignature='',playCalls=0,clipCalls=0,portalMoves=0;
 const status=(message,kind='info')=>{const el=$('vc1655-status');if(el){el.textContent=message;el.dataset.kind=kind}};
 const currentMatch=()=>String(window.VC_ANALYST_STUDIO_16155?.videoSelection?.().matchId||'');
 const selectedMatch=()=>String($('v780-match')?.value||'');
 const videoReady=()=>{
  const diag=window.v780Diagnostics?.();
  return !!diag?.videoLoaded&&String(diag.match)===currentMatch()&&selectedMatch()===currentMatch();
 };
 function readSelection(){
  const raw=window.VC_ANALYST_STUDIO_16155?.videoSelection?.();
  if(!raw||!Array.isArray(raw.selected))return [];
  return raw.selected.filter(x=>x&&x.key).map(x=>({key:String(x.key),video:!!x.video,code:String(x.code||''),player:String(x.player||''),set:x.set,rally:x.rally}));
 }
 function isLab(){
  return !!(analysis?.classList.contains('active')&&studio&&!studio.hidden&&
   $('vc157-studio')&&window.VC_ANALYST_STUDIO_16155?.videoSelection?.().page==='lab'&&
   window.VC_ANALYST_STUDIO_16155?.videoSelection?.().subpage==='workbench'&&
   !!studio.querySelector('.vc1651-workbench'));
 }
 function restore(){
  if(!homeMarker||!frame||frame.parentElement!==$('vc1655-frame-slot'))return;
  // Restoring the original video node keeps native video/YouTube controls unique.
  if(homeMarker.parentNode)homeMarker.parentNode.replaceChild(frame,homeMarker);
  else homeParent?.appendChild(frame);
  portalMoves++;
 }
 function show(){
  if(!frame||!dock)return;
  const slot=$('vc1655-frame-slot');if(!slot||frame.parentElement===slot)return;
  if(!homeParent){homeParent=frame.parentNode;homeMarker=document.createComment('Video original · slot V7.8');}
  if(homeMarker.parentNode)homeMarker.remove();
  frame.parentNode?.insertBefore(homeMarker,frame);
  slot.appendChild(frame);
  portalMoves++;
 }
 function textFor(row){return `Set ${row.set||'—'} · ${row.player||'Jugador'} · ${row.code||'Acción'}`}
 function renderQueue(){
  const rows=readSelection(),id=currentMatch(),signature=id+'|'+rows.map(x=>x.key+(x.video?'1':'0')).join('|');
  if(signature===lastSignature)return;
  lastSignature=signature;lastMatch=id;selected=rows.filter(x=>x.video);
  if(currentIndex>=selected.length||currentIndex<0||!selected.some(x=>x.key===selected[currentIndex]?.key))currentIndex=selected.length?0:-1;
  const count=$('vc1655-count'),list=$('vc1655-queue');if(count)count.textContent=`${selected.length} con vídeo / ${rows.length} acciones`;
  if(!list)return;
  list.replaceChildren();
  for(let i=0;i<Math.min(selected.length,75);i++){
   const a=selected[i],btn=document.createElement('button');btn.type='button';btn.className='vc1655-queue-item';btn.dataset.vc1655Key=a.key;btn.setAttribute('aria-current',String(i===currentIndex));
   const title=document.createElement('strong');title.textContent=textFor(a);
   const more=document.createElement('small');more.textContent=`Rally ${a.rally||'—'} · ${i+1}/${selected.length}`;
   btn.append(title,more);list.append(btn);
  }
  if(selected.length>75){const p=document.createElement('p');p.className='vc1655-muted';p.textContent='Se muestran 75 jugadas. La playlist utiliza toda la selección.';list.append(p)}
  for(const id of ['vc1655-play','vc1655-playlist','vc1655-save']){const btn=$(id);if(btn)btn.disabled=!selected.length}
  if(!rows.length)status('Selecciona un filtro, flecha o estadística. Todavía no hay jugadas.');
  else if(!selected.length)status(`${rows.length} acciones sin marca temporal de vídeo. Sincroniza primero el vídeo.`, 'warn');
  else status(`${selected.length} acciones vinculadas. Selecciona una para reproducirla.`);
 }
 function refreshStatus(){
  if(!active)return;
  const name=$('vc1655-linked');if(name){const id=selectedMatch();name.textContent=id&&id===currentMatch()?'Partido vinculado':'Vídeo de otro partido / sin vincular';}
  const loaded=$('vc1655-loaded');if(loaded)loaded.textContent=videoReady()?'Vídeo cargado':'Carga el vídeo del partido';
  const good=videoReady();for(const id of ['vc1655-play','vc1655-playlist']){const b=$(id);if(b)b.disabled=!selected.length||!good}
  const save=$('vc1655-save');if(save)save.disabled=!selected.length||!good;
 }
 function sync(){
  if(!mounted)return;
  const should=isLab();
  if(should){active=true;dock.hidden=false;studio.dataset.vc1655Video='true';show();renderQueue();refreshStatus()}
  else {active=false;dock.hidden=true;studio?.removeAttribute('data-vc1655-video');restore()}
 }
 function linkMatch(){
  const id=currentMatch();if(!id){status('Selecciona primero un scouting.', 'warn');return false}
  const select=$('v780-match');if(!select){status('El selector de vídeo original no está disponible.', 'warn');return false}
  if(![...select.options].some(o=>o.value===id))window.v780Open?.();
  if(![...select.options].some(o=>o.value===id)){status('Este scouting no aparece en Video Studio. Revisa el equipo.', 'warn');return false}
  if(select.value!==id){select.value=id;window.v780MatchChanged?.()} // Explicit action. May release previous video source.
  else window.v780Open?.();
  refreshStatus();
  status(videoReady()?'Partido vinculado y vídeo preparado.':'Partido vinculado. Carga su vídeo en Video Studio si todavía no está disponible.');
  return true;
 }
 function safePlayback(){if(!active)return false;
  if(!currentMatch()||selectedMatch()!==currentMatch()){status('El vídeo corresponde a otro partido. Pulsa «Vincular scouting» antes de reproducir.', 'warn');return false}
  if(!videoReady()){status('Carga y sincroniza primero el archivo, la grabación o el vídeo del partido.','warn');return false}
  return true;
 }
 function play(key){
  if(!safePlayback())return false;
  const i=selected.findIndex(x=>x.key===String(key));if(i<0){status('Esta acción no pertenece a la selección actual.','warn');return false}
  const ok=window.VC_SMART_VIDEO_CORE?.playKey?.(String(key));
  if(ok!==true){status('La acción no tiene un intervalo reproducible. Revisa la sincronización temporal.','warn');return false}
  currentIndex=i;playCalls++;
  $('vc1655-queue')?.querySelectorAll('[data-vc1655-key]').forEach(node=>node.setAttribute('aria-current',String(node.dataset.vc1655Key===key)));
  status(`Reproduciendo ${i+1}/${selected.length}: ${textFor(selected[i])}`,'ok');return true;
 }
 function playCurrent(){return currentIndex>=0?play(selected[currentIndex].key):false}
 function next(delta){if(!selected.length)return false;currentIndex=(currentIndex+delta+selected.length)%selected.length;return playCurrent()}
 function playlist(){if(!safePlayback()||!selected.length)return false;
  const ok=window.VC_V159_VIDEO_ENGINE?.playlist?.(selected.map(x=>x.key),'Laboratorio táctico');
  status(ok?`Playlist de ${selected.length} acciones iniciada.`:'La playlist no pudo iniciarse; comprueba los tiempos del vídeo.',ok?'ok':'warn');return !!ok;
 }
 function saveClips(){if(!safePlayback()||!selected.length)return 0;
  const api=window.VC_V159_VIDEO_ENGINE;
  if(typeof api?.clips!=='function'){status('Clip Studio no está disponible.','warn');return 0}
  const n=api.clips(selected.map(x=>x.key));clipCalls++;
  status(n?`${n} clips añadidos al catálogo original. Los duplicados se omiten.`:'No se han añadido clips nuevos. Comprueba tiempos o duplicados.',n?'ok':'warn');return n;
 }
 function goVideo(){restore();window.v11Navigate?.('video');window.vc58SetVideoTab?.('analysis');window.v780Open?.()}
 function make(){
  analysis=$('scout-analysis');videoHub=$('scout-video-hub');studio=$('vc157-studio');
  const columns=studio?.querySelector('.vc157-columns'),inspector=columns?.querySelector('.vc157-inspector');
  frame=$('v780-video-frame');
  if(!analysis||!videoHub||!studio||!columns||!inspector||!frame)return false;
  const style=document.createElement('style');style.id='vc1655-video-style';style.textContent=`
 #vc157-studio .vc1655-sidebar{min-width:0;display:grid;align-content:start;gap:13px}
 #vc157-studio .vc1655-dock{min-width:0;padding:13px;background:#fff;border:1px solid #cfdfea;border-radius:14px;box-shadow:0 4px 16px #18344f0d}
 #vc157-studio .vc1655-head{display:flex;align-items:start;justify-content:space-between;gap:8px;margin-bottom:9px}
 #vc157-studio .vc1655-head strong{font-size:14px;color:#17466a}
 #vc157-studio .vc1655-head small{display:block;color:#6a879c;font-size:10px}
 #vc157-studio .vc1655-head .vc1655-chip{background:#eaf5fc;border-radius:8px;color:#23618b;padding:5px 7px;font-weight:850;font-size:9px;white-space:nowrap}
 #vc157-studio #vc1655-frame-slot .v780-video-frame{aspect-ratio:16/9;min-height:170px;max-height:400px;width:100%;border-radius:9px;background:#050e16;overflow:hidden}
 #vc157-studio #vc1655-frame-slot .v780-video-frame video{width:100%;height:100%;object-fit:contain}
 #vc157-studio #vc1655-frame-slot .v782-youtube-wrap{position:absolute;inset:0}
 #vc157-studio .vc1655-toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
 #vc157-studio .vc1655-toolbar button,#vc157-studio .vc1655-actions button,#vc157-studio .vc1655-head button{border:1px solid #c7dce9!important;border-radius:8px!important;background:#edf6fc!important;color:#1c5a83!important;min-height:36px!important;padding:7px 10px!important;font:800 11px system-ui!important;cursor:pointer}
 #vc157-studio .vc1655-toolbar button:disabled,#vc157-studio .vc1655-actions button:disabled{opacity:.42;cursor:not-allowed!important}
 #vc157-studio .vc1655-toolbar button.vc1655-main{background:#1b669d!important;color:#fff!important;border-color:#1b669d!important}
 #vc157-studio .vc1655-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
 #vc157-studio .vc1655-actions #vc1655-playlist{grid-column:1/-1}
 #vc157-studio .vc1655-statusline{display:flex;justify-content:space-between;gap:7px;flex-wrap:wrap;font-size:10px;font-weight:750;color:#577b95}
 #vc157-studio #vc1655-status{font-size:11px;margin:7px 0;padding:9px;border:1px solid #dce9f1;background:#f6fafd;color:#53728a;border-radius:8px}
 #vc157-studio #vc1655-status[data-kind=warn]{background:#fff6ee;color:#8b6027;border-color:#efd9be}
 #vc157-studio #vc1655-status[data-kind=ok]{background:#eff8f4;color:#27654f}
 #vc157-studio .vc1655-queue{max-height:210px;overflow:auto;display:grid;gap:5px;margin-top:6px}
 #vc157-studio .vc1655-queue-item{display:grid;text-align:left!important;border:1px solid #dce7ef!important;border-radius:8px!important;background:#f7fafd!important;padding:8px!important;min-height:43px!important;color:#345d78!important}
 #vc157-studio .vc1655-queue-item[aria-current=true]{border-color:#3580ad!important;background:#eaf5fc!important}
 #vc157-studio .vc1655-queue-item strong{font-size:10px}#vc157-studio .vc1655-queue-item small{font-size:9px;color:#6d8ba0}
 #vc157-studio .vc1655-muted{font-size:10px;color:#768c9d}
 #vc157-studio[data-vc1655-video=true] .vc157-columns{grid-template-columns:minmax(0,1fr) minmax(350px,41%)}
 #vc157-studio[data-vc1655-video=true] .vc1655-sidebar{position:sticky;top:64px;max-height:calc(100vh - 78px);overflow:auto;overscroll-behavior:contain}
 #vc157-studio[data-vc1655-video=true] .vc157-inspector{position:static;max-height:none;overflow:visible}
 #vc157-studio .vc1655-dock[hidden]{display:none!important}
 @media(max-width:1250px){#vc157-studio[data-vc1655-video=true] .vc157-columns{grid-template-columns:minmax(0,1fr)}#vc157-studio[data-vc1655-video=true] .vc1655-sidebar{position:static;max-height:none;overflow:visible}}
 `;document.head.appendChild(style);
  rail=document.createElement('div');rail.className='vc1655-sidebar';
  dock=document.createElement('section');dock.className='vc1655-dock';dock.id='vc1655-video-dock';dock.setAttribute('aria-label','Reproductor táctico integrado');dock.hidden=true;
  dock.innerHTML=`<div class="vc1655-head"><div><small>TACTICAL VIDEO · V16.5.5</small><strong>Vídeo del Laboratorio</strong></div><span class="vc1655-chip">Reproductor original</span></div>
 <div class="vc1655-statusline"><span id="vc1655-linked">Sin partido vinculado</span><span id="vc1655-loaded">Vídeo no cargado</span></div><div id="vc1655-frame-slot"></div>
 <div class="vc1655-toolbar"><button id="vc1655-prev" type="button" title="Jugada anterior">← Anterior</button><button id="vc1655-play" class="vc1655-main" type="button">▶ Jugada</button><button id="vc1655-next" type="button" title="Siguiente jugada">Siguiente →</button><button id="vc1655-back8" type="button">−8 s</button><button id="vc1655-forward5" type="button">+5 s</button></div>
 <div class="vc1655-actions"><button type="button" id="vc1655-bind">Vincular scouting</button><button type="button" id="vc1655-open-studio">Abrir Video Studio</button><button type="button" id="vc1655-playlist">▶ Playlist filtrada</button><button type="button" id="vc1655-save">＋ Guardar clips filtrados</button></div>
 <p id="vc1655-status" role="status" aria-live="polite">Selecciona una jugada para reproducirla.</p><div class="vc1655-head"><strong>Jugadas seleccionadas</strong><span id="vc1655-count" class="vc1655-chip">0</span></div><div id="vc1655-queue" class="vc1655-queue" aria-label="Jugadas con vídeo disponibles"></div>
 <p class="vc1655-muted">Se utiliza el mismo archivo o transmisión de Video Studio. La selección y los filtros no modifican el scouting. Guardar clips sí añade referencias al catálogo.</p>`;
  columns.insertBefore(rail,inspector);rail.append(dock,inspector);
  homeParent=frame.parentNode;homeMarker=document.createComment('Video original · slot V7.8');
  dock.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.vc1655Key){play(b.dataset.vc1655Key);return}
   switch(b.id){
    case 'vc1655-prev':next(-1);break;
    case 'vc1655-play':playCurrent();break;
    case 'vc1655-next':next(1);break;
    case 'vc1655-back8':if(safePlayback())window.v780Jump?.(-8);break;
    case 'vc1655-forward5':if(safePlayback())window.v780Jump?.(5);break;
    case 'vc1655-bind':linkMatch();break;
    case 'vc1655-open-studio':goVideo();break;
    case 'vc1655-playlist':playlist();break;
    case 'vc1655-save':saveClips();break;
   }
  });
  // Keep the existing analysis inspector's buttons inside the Lab. Do not call
  // the legacy openKeys handler, which navigates away from the lab page.
  analysis.addEventListener('click',e=>{
   if(!active)return;
   const btn=e.target.closest('#vc157-inspector-content [data-vc1622-clip], #vc157-video');
   if(!btn)return;
   e.preventDefault();e.stopPropagation();
   if(btn.id==='vc157-video'){playCurrent();return}
   let key='';try{key=decodeURIComponent(btn.dataset.vc1622Clip||'')}catch(_){return}
   play(key);
  },true);
  contentObserver=new MutationObserver(()=>sync());contentObserver.observe($('vc157-content'),{childList:true});
  inspectorObserver=new MutationObserver(()=>renderQueue());inspectorObserver.observe($('vc157-inspector-content'),{childList:true});
  navObserver=new MutationObserver(()=>sync());navObserver.observe(analysis,{attributes:true,attributeFilter:['class']});
  studioObserver=new MutationObserver(()=>sync());studioObserver.observe(studio,{attributes:true,attributeFilter:['hidden']});
  mounted=true;sync();return true;
 }
 function wait(){
  if(make())return;
  const analysis=$('scout-analysis');if(!analysis)return;
  const obs=new MutationObserver(()=>{if(make())obs.disconnect()});obs.observe(analysis,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else wait();
 window.VC_TACTICAL_VIDEO_1655={version:'16.5.5',sync,play,playlist,restore,diagnostics:()=>({mounted,active,match:lastMatch,videoMatch:selectedMatch(),available:selected.length,playerCount:document.querySelectorAll('#v780-player-video').length,frameCount:document.querySelectorAll('#v780-video-frame').length,atDock:frame?.parentElement?.id==='vc1655-frame-slot',portalMoves,playCalls,clipCalls})};
})();

/* VC20715_SOURCE_END:138-vc1655-tactical-video.js */
