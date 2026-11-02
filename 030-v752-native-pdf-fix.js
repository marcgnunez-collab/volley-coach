
(()=>{
'use strict';

const VERSION='7.5.2';
const A4={portrait:[595.28,841.89],landscape:[841.89,595.28]};
const B=()=>window.VC_SCOUT_REPORT_BRIDGE||null;
const R=()=>window.VC_V750_REPORTS||null;
const arr=v=>Array.isArray(v)?v:[];
const safeName=v=>(B()?.safeFilename?.(v)||String(v||'reporte').replace(/[\\/:*?"<>|]+/g,'_'));
const teamName=()=>B()?.teamName?.()||'Equipo';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=(n,d)=>d?Math.round((Number(n)||0)*100/(Number(d)||0)):null;
const gp=v=>{v=Number(v)||0;return v>0?`+${v}`:`${v}`};

function notify(on,text=''){
  try{
    if(B()?.exportNotice){B().exportNotice(on,text);return}
  }catch(_){}
  let el=document.getElementById('v751-pdf-status');
  if(!el){
    el=document.createElement('div');el.id='v751-pdf-status';
    el.style.cssText='position:fixed;right:18px;bottom:18px;z-index:60000;background:#102b43;color:#fff;padding:10px 12px;border-radius:8px;font:700 10px Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.22)';
    document.body.appendChild(el);
  }
  el.textContent=text||'Generando PDF…';
  el.style.display=on?'block':'none';
}
function alertErr(title,err){
  console.error(title,err);
  alert(`${title}\n\n${String(err?.message||err||'Error desconocido')}`);
}

/* ---------- CP1252 / PDF helpers ---------- */
function cp1252Hex(input){
  let s=String(input??'')
    .replace(/[–—]/g,'-').replace(/…/g,'...')
    .replace(/[“”]/g,'"').replace(/[‘’]/g,"'")
    .replace(/→/g,'>').replace(/←/g,'<').replace(/·/g,' - ')
    .replace(/≥/g,'>=').replace(/≤/g,'<=');
  let out='';
  for(const ch of s){
    let c=ch.codePointAt(0),b=63;
    if(c<=255)b=c;
    else{
      const map={8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
      b=map[c]??63;
    }
    out+=b.toString(16).padStart(2,'0').toUpperCase();
  }
  return out;
}
function pdfColor(c){
  if(!c)return [0,0,0];
  if(Array.isArray(c))return c.map(x=>Math.max(0,Math.min(255,Number(x)||0)));
  const h=String(c).replace('#','');
  if(h.length===6)return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  return [0,0,0];
}
function rgbCmd(c,stroke=false){
  const [r,g,b]=pdfColor(c).map(x=>(x/255).toFixed(3));
  return `${r} ${g} ${b} ${stroke?'RG':'rg'}`;
}
function approxWidth(text,size,bold=false){
  let n=0;
  for(const ch of String(text??'')){
    if('ilI1.,:;|!'.includes(ch)) n+=.28;
    else if('MW@#%'.includes(ch)) n+=.86;
    else if(ch===' ') n+=.28;
    else n+=bold?.58:.53;
  }
  return n*size;
}
function wrap(text,maxW,size=8,bold=false){
  const words=String(text??'').split(/\s+/).filter(Boolean),lines=[];let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(approxWidth(test,size,bold)<=maxW||!line)line=test;
    else{lines.push(line);line=w}
  }
  if(line)lines.push(line);
  return lines.length?lines:[''];
}
class NativePDF{
  constructor(){this.pages=[];this.page=null}
  addPage(orientation='portrait'){
    const [w,h]=A4[orientation]||A4.portrait;
    this.page={w,h,ops:[]};this.pages.push(this.page);return this.page;
  }
  op(s){this.page.ops.push(s)}
  rect(x,y,w,h,opt={}){
    const py=this.page.h-y-h;
    if(opt.fill)this.op(`${rgbCmd(opt.fill)} ${x.toFixed(2)} ${py.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    if(opt.stroke!==false){
      this.op(`${rgbCmd(opt.stroke||'#000000',true)} ${(opt.lineWidth||.5).toFixed(2)} w ${x.toFixed(2)} ${py.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    }
  }
  line(x1,y1,x2,y2,opt={}){
    const py1=this.page.h-y1,py2=this.page.h-y2;
    this.op(`${rgbCmd(opt.color||'#000000',true)} ${(opt.width||.5).toFixed(2)} w ${x1.toFixed(2)} ${py1.toFixed(2)} m ${x2.toFixed(2)} ${py2.toFixed(2)} l S`);
  }
  text(text,x,y,opt={}){
    const size=opt.size||8,font=opt.font||'F1',color=opt.color||'#000000';
    let tx=x;
    const width=approxWidth(text,size,font==='F2');
    if(opt.align==='center')tx=x-width/2;
    if(opt.align==='right')tx=x-width;
    const py=this.page.h-y-size*.82;
    this.op(`${rgbCmd(color)} BT /${font} ${size.toFixed(2)} Tf 1 0 0 1 ${tx.toFixed(2)} ${py.toFixed(2)} Tm <${cp1252Hex(text)}> Tj ET`);
  }
  textBox(text,x,y,w,opt={}){
    const size=opt.size||8,leading=opt.leading||size*1.25,lines=wrap(text,w,size,opt.font==='F2'),max=opt.maxLines||999;
    lines.slice(0,max).forEach((l,i)=>this.text(l,x,y+i*leading,opt));
    return Math.min(lines.length,max)*leading;
  }
  save(filename){
    const objs=[];
    const font1=3,font2=4,font3=5;
    const pageStart=6;
    const pageRefs=[];
    this.pages.forEach((p,i)=>pageRefs.push(pageStart+i*2));
    objs[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objs[2]=`<< /Type /Pages /Count ${this.pages.length} /Kids [${pageRefs.map(n=>`${n} 0 R`).join(' ')}] >>`;
    objs[font1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[font2]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objs[font3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
    this.pages.forEach((p,i)=>{
      const pageObj=pageStart+i*2,contentObj=pageObj+1,stream=p.ops.join('\n');
      objs[pageObj]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w.toFixed(2)} ${p.h.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObj} 0 R >>`;
      objs[contentObj]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    const max=objs.length-1;
    let pdf='%PDF-1.4\n%VC751\n',offsets=[0];
    for(let i=1;i<=max;i++){
      offsets[i]=pdf.length;
      pdf+=`${i} 0 obj\n${objs[i]||'<<>>'}\nendobj\n`;
    }
    const xref=pdf.length;
    pdf+=`xref\n0 ${max+1}\n0000000000 65535 f \n`;
    for(let i=1;i<=max;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    pdf+=`trailer\n<< /Size ${max+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob=new Blob([pdf],{type:'application/pdf'});
    if(typeof window.scoutV753DeliverPDF==='function'){
      window.scoutV753DeliverPDF(blob,filename);
      return;
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
}

/* ---------- Drawing helpers ---------- */
function header(pdf,title,subtitle,pageNo,total){
  const p=pdf.page,W=p.w,M=28;
  pdf.rect(M,24,W-M*2,46,{fill:'#102b43',stroke:'#102b43'});
  pdf.text('VOLLEY COACH · PROFESSIONAL REPORTS · V7.5.2',M+12,35,{size:7,font:'F2',color:'#B9CBD8'});
  pdf.text(title,M+12,48,{size:17,font:'F2',color:'#FFFFFF'});
  pdf.text(subtitle,M+12,62,{size:7.5,color:'#D6E1E8'});
  pdf.text(`${pageNo}/${total}`,W-M-12,48,{size:8,font:'F2',color:'#FFFFFF',align:'right'});
}
function footer(pdf,text=''){
  const p=pdf.page,M=28,y=p.h-24;
  pdf.line(M,y,p.w-M,y,{color:'#D5DEE4',width:.5});
  pdf.text(text||'Volley Coach V7.5.2',M,y+7,{size:6.5,color:'#72818D'});
  pdf.text('Datos calculados solo a partir de acciones registradas.',p.w-M,y+7,{size:6.5,color:'#72818D',align:'right'});
}
function card(pdf,x,y,w,h,label,value,note=''){
  pdf.rect(x,y,w,h,{fill:'#F7F9FA',stroke:'#D9E2E7'});
  pdf.text(label.toUpperCase(),x+7,y+8,{size:6,font:'F2',color:'#72818D'});
  pdf.text(value,x+7,y+19,{size:15,font:'F2',color:'#17324D'});
  if(note)pdf.textBox(note,x+7,y+38,w-14,{size:6.2,color:'#788792',leading:7.2,maxLines:2});
}
function table(pdf,x,y,width,headers,rows,widths,opt={}){
  const headH=opt.headH||14,rowH=opt.rowH||11,size=opt.size||6.3;
  const totalW=widths.reduce((a,b)=>a+b,0),scale=width/totalW,ws=widths.map(v=>v*scale);
  pdf.rect(x,y,width,headH,{fill:'#E8EDF0',stroke:'#B7C2CA'});
  let cx=x;
  headers.forEach((h,i)=>{
    const align=i===0?'left':'center';
    pdf.text(String(h),align==='left'?cx+3:cx+ws[i]/2,y+4.2,{size:5.5,font:'F2',color:'#314B5F',align});
    cx+=ws[i];
  });
  let cy=y+headH;
  rows.forEach((r,ri)=>{
    if(ri%2)pdf.rect(x,cy,width,rowH,{fill:'#FAFBFC',stroke:false});
    pdf.line(x,cy+rowH,x+width,cy+rowH,{color:'#DCE3E7',width:.35});
    cx=x;
    r.forEach((v,i)=>{
      const align=i===0?'left':'center',font=(opt.boldFirst&&i===0)?'F2':'F1';
      let txt=String(v??'');
      const maxW=ws[i]-5;
      while(txt.length>1&&approxWidth(txt,size,font==='F2')>maxW)txt=txt.slice(0,-1);
      if(txt!==String(v??''))txt=txt.slice(0,-1)+'…';
      pdf.text(txt,align==='left'?cx+3:cx+ws[i]/2,cy+3.3,{size,font,color:'#243D50',align});
      cx+=ws[i];
    });
    cy+=rowH;
  });
  return cy;
}
function sectionTitle(pdf,text,x,y,w){
  pdf.text(text,x,y,{size:10,font:'F2',color:'#17324D'});
  pdf.line(x,y+12,x+w,y+12,{color:'#294D69',width:1});
  return y+18;
}
function selectedMatch(id){
  const b=B();
  return b?.getExportMatch?.(id)||b?.getMatchForAnalysis?.()||R()?.selectedMatch?.(id)||null;
}
function score(m){
  const b=B();
  if(b?.setsScore)return b.setsScore(m);
  const sets=arr(m?.sets),us=sets.filter(s=>s.finished&&s.winner==='ours').length,opponent=sets.filter(s=>s.finished&&s.winner==='opponent').length;
  return {us,opponent};
}

/* ---------- OFFICIAL SHEET ---------- */
function teamOfficial(pdf,m,team,y){
  const rr=R(),data=rr.stats(m,team),name=team==='ours'?teamName():(m.opponent||'Rival'),M=20,W=pdf.page.w-40;
  pdf.rect(M,y,W,15,{fill:'#D8DADB',stroke:'#666666'});
  pdf.text(name,M+4,y+3.7,{size:8.5,font:'F2',color:'#111111'});
  y+=15;

  const headers=['Jugador','S1','S2','S3','S4','S5','Tot','FP','G-P','Saq','Err','Ace','Rec','Err','Pos%','Exc%','Atq','Err','Blq','Pts','Pts%','BLQ'];
  const widths=[122,13,13,13,13,13,18,18,20,18,17,17,18,17,20,20,18,17,17,17,21,18];
  const rows=data.players.map(st=>{
    const s=B().skill(st,'S'),r=B().reception(st),a=B().attack(st),b=B().skill(st,'B'),
      p=B().pointMetrics(m,team,st.key,data.rows),
      forms=[1,2,3,4,5].map(n=>B().initialPos(m,team,st,n)||'');
    const label=String(st.label||'Jugador').replace(/^#(\d+)\s*·\s*/,(_,n)=>`${n} `);
    return [label,...forms,p.won||'.',p.fp||'.',gp(p.gp),s.total||'.',s.total?(s.error||'.'):'.',s.total?(s.perfect||'.'):'.',r.total||'.',r.total?(r.error||'.'):'.',r.total?`${r.posPct}%`:'.',r.total?`${r.excPct}%`:'.',a.total||'.',a.total?(a.error||'.'):'.',a.total?(a.blocked||'.'):'.',a.total?(a.perfect||'.'):'.',a.total?`${a.ptsPct}%`:'.',b.total?(b.perfect||'.'):'.'];
  });
  const st=data.teamStat,s=B().skill(st,'S'),rec=B().reception(st),att=B().attack(st),bl=B().skill(st,'B'),pm=B().pointMetrics(m,team,'team',data.rows);
  rows.push(['TOTALES','','','','','',pm.won,pm.fp,gp(pm.gp),s.total,s.error,s.perfect,rec.total,rec.error,rec.total?`${rec.posPct}%`:'.',rec.total?`${rec.excPct}%`:'.',att.total,att.error,att.blocked,att.perfect,att.total?`${att.ptsPct}%`:'.',bl.perfect]);
  y=table(pdf,M,y,W,headers,rows,widths,{headH:12,rowH:7.4,size:4.45,boldFirst:true});

  const setRows=arr(m.sets).slice(0,5).map(set=>{
    const x=B().setStat(m,team,set.number);
    return [`Set ${set.number}`,x.bd.serve,x.bd.attack,x.bd.block,x.bd.oppErr,x.s.total,x.s.error,x.s.perfect,x.r.total,x.r.error,x.r.total?`${x.r.posPct}%`:'.',x.r.total?`${x.r.excPct}%`:'.',x.a.total,x.a.error,x.a.blocked,x.a.perfect,x.a.total?`${x.a.ptsPct}%`:'.',x.b.perfect];
  });
  y+=3;
  y=table(pdf,M+110,y,W-110,['Set','Saq','Att','BLQ','Er.Ad.','Saq T','Err','Pts','Rec T','Err','Pos%','Exc%','Atq T','Err','Blq','Pts','Pts%','BLQ'],setRows,[32,18,18,18,23,22,18,18,22,18,22,22,22,18,18,18,22,18],{headH:10,rowH:6.7,size:4.4,boldFirst:true});
  return y+4;
}
function drawOfficial(pdf,m){
  pdf.addPage('portrait');
  const rr=R(),meta=rr.meta(m),sc=score(m),M=20,W=pdf.page.w-40;
  pdf.text(meta.competition||'Partido',M,22,{size:13,font:'F2'});
  pdf.text(meta.round||'',M,38,{size:8,color:'#555555'});
  pdf.text('INFORME',M,53,{size:10,font:'F2'});
  pdf.line(M,66,M+210,66,{color:'#555555',width:1});

  pdf.rect(M,74,250,64,{stroke:'#555555'});
  const info=[['Partido',meta.matchCode||'—'],['Fecha',meta.date||'—'],['Hora',meta.time||'—'],['Pabellón',meta.pavilion||'—'],['Ciudad',meta.city||'—']];
  info.forEach((r,i)=>{pdf.text(r[0],M+6,80+i*11,{size:6,font:'F2'});pdf.text(r[1],M+55,80+i*11,{size:6})});
  pdf.rect(M+260,20,W-260,52,{stroke:'#555555'});
  pdf.text(teamName(),M+267,30,{size:8.2,font:'F2'});pdf.text(String(sc.us),M+W-7,30,{size:9,font:'F2',align:'right'});
  pdf.text(m.opponent||'Rival',M+267,45,{size:8.2,font:'F2'});pdf.text(String(sc.opponent),M+W-7,45,{size:9,font:'F2',align:'right'});

  const setHeaders=['Set','Dur.','P1','P2','P3','Resultado'];
  const setRows=arr(m.sets).slice(0,5).map(s=>{
    const cps=rr.checkpoints(s),dur=rr.setDurSeconds(s);
    return [s.number,dur==null?'.':`${Math.floor(dur/60)}.${String(Math.round(dur%60)).padStart(2,'0')}`,cps[0],cps[1],cps[2],`${num(s.scoreUs)}-${num(s.scoreOpponent)}`];
  });
  table(pdf,M+260,76,W-260,setHeaders,setRows,[25,38,42,42,42,55],{headH:12,rowH:8,size:5.4});

  pdf.rect(M,144,W,16,{fill:'#F0F1F2',stroke:'#777777'});
  pdf.text(`Árbitros / observaciones: ${meta.referees||'—'}`,M+5,149,{size:5.5});

  let y=166;
  y=teamOfficial(pdf,m,'ours',y);
  y=teamOfficial(pdf,m,'opponent',y);

  const po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent');
  if(y>720)y=720;
  pdf.rect(M,y,W,14,{fill:'#D8DADB',stroke:'#666666'});
  pdf.text(`${teamName()}                         CAMBIO DE SAQUE / FASE PUNTO                         ${m.opponent||'Rival'}`,M+5,y+4,{size:6.2,font:'F2'});
  y+=17;
  const phaseRows=[
    ['Recepciones / SO',`${po.receptionTotal} / ${po.sideOut}`,`${pr.receptionTotal} / ${pr.sideOut}`],
    ['Cada recepción por punto',po.recPerPoint?po.recPerPoint.toFixed(2):'.',pr.recPerPoint?pr.recPerPoint.toFixed(2):'.'],
    ['Saques / FP',`${po.serveTotal} / ${po.breakPoint}`,`${pr.serveTotal} / ${pr.breakPoint}`],
    ['Cada saque por break',po.servePerPoint?po.servePerPoint.toFixed(2):'.',pr.servePerPoint?pr.servePerPoint.toFixed(2):'.'],
    ['1er ataque tras REC +/#',`${po.positive.pts}/${po.positive.total} · ${po.positive.pct??'.'}%`,`${pr.positive.pts}/${pr.positive.total} · ${pr.positive.pct??'.'}%`],
    ['1er ataque tras REC !/-',`${po.negative.pts}/${po.negative.total} · ${po.negative.pct??'.'}%`,`${pr.negative.pts}/${pr.negative.total} · ${pr.negative.pct??'.'}%`],
    ['Contraataque',`${po.counter.pts}/${po.counter.total} · ${po.counter.pct??'.'}%`,`${pr.counter.pts}/${pr.counter.total} · ${pr.counter.pct??'.'}%`]
  ];
  table(pdf,M,y,W,['Indicador',teamName(),m.opponent||'Rival'],phaseRows,[190,175,175],{headH:11,rowH:8,size:5.1,boldFirst:true});
  pdf.text('FP = fase punto · G-P = ganados - perdidos · Pos% = recepción +/# · Exc% = recepción # · Pts% = ataques # / total',M,pdf.page.h-25,{size:5.2,color:'#555555'});
  pdf.text('Volley Coach V7.5.2 · Hoja estadística',M,pdf.page.h-15,{size:5,color:'#777777'});
}

/* ---------- PROFESSIONAL ANALYSIS ---------- */
function insightBox(pdf,x,y,w,tag,text,kind='info'){
  const color=kind==='good'?'#3F7C63':kind==='warn'?'#D28B2E':'#597B95';
  const lines=wrap(text,w-74,7,false),h=Math.max(28,lines.length*9+10);
  pdf.rect(x,y,w,h,{fill:'#FAFBFC',stroke:'#DEE5E9'});
  pdf.rect(x,y,4,h,{fill:color,stroke:false});
  pdf.text(tag.toUpperCase(),x+10,y+8,{size:6,font:'F2',color:'#526B7D'});
  lines.forEach((l,i)=>pdf.text(l,x+72,y+7+i*9,{size:7,color:'#405565'}));
  return h;
}
function analysisPage1(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Informe técnico del partido',`${teamName()} vs ${m.opponent||'Rival'} · ${m.date||''}`,1,total);
  const rr=R(),po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent'),ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2'),
    os=rr.stats(m,'ours'),ors=B().reception(os.teamStat),oas=B().attack(os.teamStat),bd=rr.terminalBreakdown(m,'ours'),sc=score(m);
  const M=28,g=7,w=(pdf.page.w-M*2-g*3)/4,y=88;
  [
    ['Resultado',`${sc.us}-${sc.opponent}`,arr(m.sets).map(s=>`${s.scoreUs}-${s.scoreOpponent}`).join(' · ')],
    ['K1 Side-out',ok1.length?`${pct(po.sideOut,ok1.length)}%`:'—',`${po.sideOut}/${ok1.length} · rival ${rk1.length?pct(pr.sideOut,rk1.length)+'%':'—'}`],
    ['K2 Break',ok2.length?`${pct(po.breakPoint,ok2.length)}%`:'—',`${po.breakPoint}/${ok2.length} · rival ${rk2.length?pct(pr.breakPoint,rk2.length)+'%':'—'}`],
    ['G-P rallies',gp(bd.won-bd.lost),`${bd.won} ganados / ${bd.lost} perdidos`]
  ].forEach((c,i)=>card(pdf,M+i*(w+g),y,w,57,c[0],c[1],c[2]));
  const y2=153;
  [
    ['Recepción +/#',ors.total?`${ors.posPct}%`:'—',ors.total?`Exc ${ors.excPct}% · ${ors.total} rec.`:'Sin muestra'],
    ['Ataque punto',oas.total?`${oas.ptsPct}%`:'—',oas.total?`${oas.perfect}/${oas.total} · G-P ${gp(oas.gp)}`:'Sin muestra'],
    ['Puntos propios',String(bd.serve+bd.attack+bd.block),`Saq ${bd.serve} · Atq ${bd.attack} · Blq ${bd.block}`],
    ['Error rival',String(bd.oppErr),'puntos por error adversario']
  ].forEach((c,i)=>card(pdf,M+i*(w+g),y2,w,57,c[0],c[1],c[2]));

  let y3=sectionTitle(pdf,'Lectura ejecutiva',M,229,pdf.page.w-M*2);
  rr.insights(m).slice(0,7).forEach(ins=>{const h=insightBox(pdf,M,y3,pdf.page.w-M*2,ins.tag,ins.text,ins.kind);y3+=h+6});
  y3=sectionTitle(pdf,'Evolución por set',M,y3+3,pdf.page.w-M*2);
  const rows=rr.setTrend(m,'ours').map(x=>[`S${x.set}`,x.score,x.k1==null?'—':`${x.k1}% (${x.k1n})`,x.k2==null?'—':`${x.k2}% (${x.k2n})`,x.recN?`${x.recPos}%`:'—',x.recN?`${x.recExc}%`:'—',x.attN?`${x.att}%`:'—',`${x.ace}/${x.serveErr}`,x.block]);
  table(pdf,M,y3,pdf.page.w-M*2,['Set','Marc.','K1','K2','REC Pos','REC Exc','ATQ Pts','Ace/Err','BLQ'],rows,[35,48,60,60,55,55,55,55,35],{headH:14,rowH:12,size:6.3,boldFirst:true});
  footer(pdf,'Página 1 · Resumen ejecutivo');
}
function analysisPage2(pdf,m,total){
  pdf.addPage('landscape');header(pdf,'Rendimiento por jugador','Impacto individual y fundamentos',2,total);
  const M=24,W=pdf.page.w-M*2;
  let y=88;
  const drawPlayers=(team,title)=>{
    y=sectionTitle(pdf,title,M,y,W);
    const rows=R().playerRows(m,team).map(x=>[x.label,x.pts,x.fp,gp(x.gp),`${x.ace}/${x.serveErr}`,x.recTotal||'.',x.recTotal?`${x.recPos}%`:'.',x.recTotal?`${x.recExc}%`:'.',x.attTotal||'.',x.attTotal?x.kill:'.',x.attTotal?`${x.attPct}%`:'.',x.attTotal?gp(x.attGp):'.',x.block||'.']);
    y=table(pdf,M,y,W,['Jugador','PTS','FP','G-P','SAQ A/E','REC','POS%','EXC%','ATQ','PTS','PTS%','ATQ G-P','BLQ'],rows,[150,35,35,40,52,35,42,42,35,35,43,50,35],{headH:15,rowH:10.5,size:6,boldFirst:true});
    y+=10;
  };
  drawPlayers('ours',teamName());
  drawPlayers('opponent',m.opponent||'Rival');
  footer(pdf,'Página 2 · Estadística individual');
}
function analysisPage3(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'K1, K2 y rotaciones','Eficacia de las fases del juego',3,total);
  const rr=R(),po=rr.perf(m,'ours'),pr=rr.perf(m,'opponent'),M=28,W=pdf.page.w-M*2;
  let y=88;
  const ok1=po.rallies.filter(x=>x.phase==='K1'),ok2=po.rallies.filter(x=>x.phase==='K2'),rk1=pr.rallies.filter(x=>x.phase==='K1'),rk2=pr.rallies.filter(x=>x.phase==='K2');
  const cw=(W-14)/4;
  [
    ['Recepciones / SO',po.recPerPoint?po.recPerPoint.toFixed(2):'—',`${po.receptionTotal} rec. · ${po.sideOut} SO`],
    ['Saques / BP',po.servePerPoint?po.servePerPoint.toFixed(2):'—',`${po.serveTotal} saq. · ${po.breakPoint} BP`],
    ['Rival K1',rk1.length?`${pct(pr.sideOut,rk1.length)}%`:'—',`${pr.sideOut}/${rk1.length}`],
    ['Rival K2',rk2.length?`${pct(pr.breakPoint,rk2.length)}%`:'—',`${pr.breakPoint}/${rk2.length}`]
  ].forEach((c,i)=>card(pdf,M+i*(cw+14/3),y,cw,57,c[0],c[1],c[2]));
  y=sectionTitle(pdf,'Ataque según fase',M,158,W);
  const phaseRows=[
    ['1er ataque tras recepción +/#',po.positive.total,po.positive.pts,po.positive.err,po.positive.blq,po.positive.pct==null?'—':`${po.positive.pct}%`,pr.positive.total,pr.positive.pts,pr.positive.pct==null?'—':`${pr.positive.pct}%`],
    ['1er ataque tras recepción !/-',po.negative.total,po.negative.pts,po.negative.err,po.negative.blq,po.negative.pct==null?'—':`${po.negative.pct}%`,pr.negative.total,pr.negative.pts,pr.negative.pct==null?'—':`${pr.negative.pct}%`],
    ['Contraataque',po.counter.total,po.counter.pts,po.counter.err,po.counter.blq,po.counter.pct==null?'—':`${po.counter.pct}%`,pr.counter.total,pr.counter.pts,pr.counter.pct==null?'—':`${pr.counter.pct}%`]
  ];
  y=table(pdf,M,y,W,['Fase','Tot','Pts','Err','Blq','Pts%','Rival T','Rival Pts','Rival %'],phaseRows,[170,40,40,40,40,45,48,48,50],{headH:14,rowH:13,size:6.2,boldFirst:true})+13;
  y=sectionTitle(pdf,'Rotaciones R1-R6',M,y,W);
  const ro=rr.rotationStats(m,'ours'),rp=rr.rotationStats(m,'opponent');
  const rows=ro.map((x,i)=>[`R${x.no}`,x.total,`${x.k1Won}/${x.k1Total}`,x.k1Pct==null?'—':`${x.k1Pct}%`,`${x.k2Won}/${x.k2Total}`,x.k2Pct==null?'—':`${x.k2Pct}%`,gp(x.gp),`R${rp[i].no}`,`${rp[i].k1Won}/${rp[i].k1Total}`,rp[i].k1Pct==null?'—':`${rp[i].k1Pct}%`,`${rp[i].k2Won}/${rp[i].k2Total}`,rp[i].k2Pct==null?'—':`${rp[i].k2Pct}%`,gp(rp[i].gp)]);
  table(pdf,M,y,W,['Rot.','Rallies','K1 G/T','K1%','K2 G/T','K2%','G-P','Rival','K1 G/T','K1%','K2 G/T','K2%','G-P'],rows,[38,43,50,44,50,44,40,38,50,44,50,44,40],{headH:14,rowH:12,size:5.8,boldFirst:true});
  footer(pdf,'Página 3 · Fases y rotaciones');
}
function analysisPage4(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Zonas y distribución','Recepción, saque, ataque y colocación',4,total);
  const rr=R(),M=28,W=pdf.page.w-M*2,half=(W-12)/2;
  let y=88;
  y=sectionTitle(pdf,'Recepción por zona de contacto',M,y,half);
  const rz=rr.receptionZones(m,'ours').slice(0,10).map(x=>[`Z${x.zone}`,x.total,x.pos,`${x.posPct}%`,`${x.excPct}%`,x.err]);
  let yL=table(pdf,M,y,half,['Zona','Tot','Pos','Pos%','Exc%','Err'],rz.length?rz:[['Sin datos','','','','','']],[65,45,45,55,55,40],{headH:14,rowH:12,size:6.2,boldFirst:true});
  let yR=sectionTitle(pdf,'Saque por zona destino',M+half+12,88,half);
  const sz=rr.serveZones(m,'ours').slice(0,10).map(x=>[`Z${x.zone}`,x.total,x.ace,x.err,`${x.pressure} (${x.pressurePct}%)`]);
  yR=table(pdf,M+half+12,yR,half,['Zona','Tot','Ace','Err','Presión #/+'],sz.length?sz:[['Sin datos','','','','']],[65,45,45,45,95],{headH:14,rowH:12,size:6.2,boldFirst:true});
  y=Math.max(yL,yR)+18;
  y=sectionTitle(pdf,'Direcciones de ataque',M,y,half);
  const ad=rr.attackDirections(m,'ours').slice(0,12).map(x=>[x.direction,x.total,x.pts,`${x.ptsPct}%`,x.err,x.blq,`${x.effPct}%`]);
  yL=table(pdf,M,y,half,['Dirección','Tot','Pts','Pts%','Err','Blq','EFF%'],ad.length?ad:[['Sin datos','','','','','','']],[100,35,35,45,35,35,45],{headH:14,rowH:11,size:5.8,boldFirst:true});
  yR=sectionTitle(pdf,'Distribución del colocador',M+half+12,y,half);
  const ds=rr.distribution(m,'ours').slice(0,14).map(x=>[x.label,x.total,`${x.pct}%`]);
  table(pdf,M+half+12,yR,half,['Destino / combinación','Tot','Uso'],ds.length?ds:[['Sin datos','','']],[180,45,50],{headH:14,rowH:11,size:6,boldFirst:true});
  footer(pdf,'Página 4 · Zonas y distribución');
}
function analysisPage5(pdf,m,total){
  pdf.addPage('portrait');header(pdf,'Metodología y calidad de muestra','Qué significan las métricas y cuánta información las sostiene',5,total);
  const rr=R(),q=rr.dataQuality(m),M=28,W=pdf.page.w-M*2,g=8,cw=(W-g*3)/4;
  [
    ['Rallies',q.rallies,'cerrados'],
    ['Con acciones',q.codedRallies,`${q.codedPct}% de cobertura`],
    ['Acciones',q.actions,'codificadas'],
    ['Alertas',q.issues.length,q.issues.length?'revisar muestra':'sin alertas graves']
  ].forEach((c,i)=>card(pdf,M+i*(cw+g),88,cw,57,c[0],String(c[1]),c[2]));
  let y=sectionTitle(pdf,'Definiciones',M,165,W);
  const defs=[
    ['G-P','Puntos directos ganados menos pérdidas terminales atribuibles. En ataque, un balón bloqueado "/" cuenta como pérdida terminal.'],
    ['FP / Break point','Punto conseguido en un rally que comenzó con el equipo al saque.'],
    ['Side-out / K1','Rally ganado después de comenzar en recepción.'],
    ['Recepción Pos%','Recepciones # o + dividido por recepciones totales.'],
    ['Recepción Exc%','Recepciones # dividido por recepciones totales.'],
    ['Ataque Pts%','Ataques # dividido por ataques totales.'],
    ['EFF ataque','(Puntos - errores - bloqueados) / ataques totales.']
  ];
  defs.forEach(d=>{
    const h=insightBox(pdf,M,y,W,d[0],d[1],'info');y+=h+6;
  });
  y=sectionTitle(pdf,'Advertencias automáticas',M,y+3,W);
  if(q.issues.length)q.issues.forEach(t=>{const h=insightBox(pdf,M,y,W,'Muestra',t,'warn');y+=h+6});
  else y+=insightBox(pdf,M,y,W,'Muestra','No se han detectado déficits graves con los umbrales automáticos. Esto no garantiza que todas las acciones estén codificadas correctamente.','good')+6;
  y=sectionTitle(pdf,'Interpretación',M,y+3,W);
  pdf.textBox('Este informe es descriptivo y depende de la calidad del scouting. Las cifras con muestras pequeñas deben utilizarse como indicios, no como tendencias consolidadas. Volley Coach no rellena acciones ausentes ni transforma un dato desconocido en cero.',M,y,W,{size:7.5,leading:10,color:'#405565'});
  footer(pdf,'Página 5 · Metodología');
}

/* ---------- Public exports ---------- */
window.scoutV752ExportOfficialPDF=function(id){
  const m=selectedMatch(id);
  if(!m){alert('No hay scouting seleccionado para exportar.');return false}
  if(!B()){alert('El núcleo de scouting no está disponible para el PDF. Recarga la aplicación con Ctrl+F5.');return false}
  if(!R()){alert('El módulo estadístico V7.5 no está disponible. Recarga la aplicación con Ctrl+F5.');return false}
  notify(true,'Generando PDF hoja oficial…');
  try{
    const pdf=new NativePDF();drawOfficial(pdf,m);
    pdf.save(`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Hoja_Oficial_V752.pdf`);
  }catch(err){alertErr('No se ha podido generar la hoja oficial.',err)}
  finally{notify(false)}
  return false;
};
window.scoutV752ExportAnalysisPDF=function(id){
  const m=selectedMatch(id);
  if(!m){alert('No hay scouting seleccionado para exportar.');return false}
  if(!B()){alert('El núcleo de scouting no está disponible para el PDF. Recarga la aplicación con Ctrl+F5.');return false}
  if(!R()){alert('El módulo estadístico V7.5 no está disponible. Recarga la aplicación con Ctrl+F5.');return false}
  notify(true,'Generando PDF análisis Pro…');
  try{
    const pdf=new NativePDF(),total=5;
    analysisPage1(pdf,m,total);analysisPage2(pdf,m,total);analysisPage3(pdf,m,total);analysisPage4(pdf,m,total);analysisPage5(pdf,m,total);
    pdf.save(`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Analisis_Pro_V752.pdf`);
  }catch(err){alertErr('No se ha podido generar el análisis Pro.',err)}
  finally{notify(false)}
  return false;
};


/* V7.5.6 · Direct PDF core.
   Receives an already-resolved match object. It never searches for the match. */
window.VC_V752_PDF_CORE={
  exportOfficialMatch:function(m){
    if(!m)throw new Error('VC_V752_PDF_CORE: falta el objeto de partido.');
    if(!B())throw new Error('VC_V752_PDF_CORE: el puente del scouting no está disponible.');
    if(!R())throw new Error('VC_V752_PDF_CORE: el módulo estadístico no está disponible.');
    notify(true,'Generando PDF hoja oficial…');
    try{
      const pdf=new NativePDF();
      drawOfficial(pdf,m);
      const filename=`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Hoja_Oficial_V756.pdf`;
      pdf.save(filename);
      return {ok:true,filename};
    }finally{
      notify(false);
    }
  },
  exportAnalysisMatch:function(m){
    if(!m)throw new Error('VC_V752_PDF_CORE: falta el objeto de partido.');
    if(!B())throw new Error('VC_V752_PDF_CORE: el puente del scouting no está disponible.');
    if(!R())throw new Error('VC_V752_PDF_CORE: el módulo estadístico no está disponible.');
    notify(true,'Generando PDF análisis Pro…');
    try{
      const pdf=new NativePDF(),total=5;
      analysisPage1(pdf,m,total);
      analysisPage2(pdf,m,total);
      analysisPage3(pdf,m,total);
      analysisPage4(pdf,m,total);
      analysisPage5(pdf,m,total);
      const filename=`${safeName((m.date||'partido')+'_'+(m.opponent||'rival'))}_Analisis_Pro_V756.pdf`;
      pdf.save(filename);
      return {ok:true,filename};
    }finally{
      notify(false);
    }
  }
};

/* Compatibility aliases so old places in the app also use the repaired exporter. */
window.scoutExportPDF=window.scoutV752ExportOfficialPDF;
window.scoutExportAnalysisPDF=window.scoutV752ExportAnalysisPDF;

/* Repair any buttons generated later by old render functions. */
function repairButtons(root=document){
  (root.matches?.('button')?[root,...root.querySelectorAll('button')]:root.querySelectorAll?.('button')||[]).forEach(b=>{
    const txt=(b.textContent||'').trim().toLowerCase(),oc=b.getAttribute('onclick')||'';
    if(txt.includes('pdf hoja')||txt==='pdf'){
      if(/scoutV752ExportOfficialPDF/.test(oc)){
        // Ya usa el exportador reparado; conserva un posible id de partido.
      }else if(/scoutExportPDF/.test(oc)){
        const arg=(oc.match(/scoutExportPDF\(([^)]*)\)/)||[])[1]||'';
        b.setAttribute('onclick',`return scoutV752ExportOfficialPDF(${arg})`);
      }
    }
    if(txt.includes('pdf análisis pro')||txt.includes('descargar análisis pro')){
      b.setAttribute('onclick','return scoutV752ExportAnalysisPDF()');
    }
  });
}
repairButtons();
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&(n.matches?.('button')||n.querySelector?.('button')))repairButtons(n)}))).observe(document.body,{childList:true,subtree:true});

window.scoutV752PDFDiagnostics=function(){
  return {
    version:VERSION,
    officialFunction:typeof window.scoutV752ExportOfficialPDF,
    analysisFunction:typeof window.scoutV752ExportAnalysisPDF,
    nativeEngine:true,
    html2canvasRequired:false,
    jsPDFRequired:false,
    reportBridge:!!B(),
    reportHelpers:!!R(),
    officialButtons:[...document.querySelectorAll('button')].filter(b=>(b.textContent||'').toLowerCase().includes('pdf hoja')).length,
    analysisButtons:[...document.querySelectorAll('button')].filter(b=>(b.textContent||'').toLowerCase().includes('análisis pro')).length
  };
};
})();
