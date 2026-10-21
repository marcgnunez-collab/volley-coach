(function(){
  function vcPdfUnique(nums){
    const seen=new Set(),out=[];
    (nums||[]).forEach(v=>{const n=Number(v);if(Number.isFinite(n)&&!seen.has(n)){seen.add(n);out.push(n)}});
    return out;
  }
  function vcPdfTeamIdFromName(name){
    try{return typeof vcTeamIdFromName==='function' ? vcTeamIdFromName(name) : equipoActivo}catch(_){return equipoActivo}
  }
  function vcPdfSessionIds(h,teamId){
    let ids=[];
    if(Array.isArray(h?.playerIds)) ids=h.playerIds.map(Number);
    if(!ids.length && Array.isArray(h?.participantSnapshot)) ids=h.participantSnapshot.map(x=>Number(x.id));
    if(!ids.length && teamId===equipoActivo && typeof meta!=='undefined' && Array.isArray(meta.playerIds)) ids=meta.playerIds.map(Number);
    return vcPdfUnique(ids);
  }
  function vcPdfSessionLabels(h,teamId){
    let labels=[];
    try{ if(typeof vcSessionParticipantLabels==='function') labels=vcSessionParticipantLabels(h,teamId)||[]; }catch(_){}
    if(labels.length) return labels;
    const ids=vcPdfSessionIds(h,teamId);
    try{
      if(typeof vcParticipantSnapshot==='function'){
        const snaps=vcParticipantSnapshot(ids,teamId);
        if(snaps.length) return snaps.map(s=>(s.number!==''&&s.number!=null?'#'+s.number+' · ':'') + (s.name||'Jugador'));
      }
    }catch(_){}
    return ids.map(id=>'Jugador '+id);
  }
  function vcPdfExerciseIds(e,h,teamId){
    let ids=[];
    if(Array.isArray(e?.playerIds)) ids=e.playerIds.map(Number);
    if(!ids.length && Array.isArray(e?.participantSnapshot)) ids=e.participantSnapshot.map(x=>Number(x.id));
    if(!ids.length && teamId===equipoActivo && typeof exerciseAssignedIds==='function' && e?.id!=null) ids=(exerciseAssignedIds(e.id)||[]).map(Number);
    if(!ids.length) ids=vcPdfSessionIds(h,teamId);
    return vcPdfUnique(ids);
  }
  function vcPdfExerciseLabels(e,h,teamId){
    let labels=[];
    try{ if(typeof vcExerciseParticipantLabels==='function') labels=vcExerciseParticipantLabels(e,h,teamId)||[]; }catch(_){}
    if(labels.length) return labels;
    const ids=vcPdfExerciseIds(e,h,teamId);
    try{
      if(typeof vcParticipantSnapshot==='function'){
        const snaps=vcParticipantSnapshot(ids,teamId);
        if(snaps.length) return snaps.map(s=>(s.number!==''&&s.number!=null?'#'+s.number+' · ':'') + (s.name||'Jugador'));
      }
    }catch(_){}
    return ids.map(id=>'Jugador '+id);
  }
  function vcPdfSameIdSet(a,b){
    const aa=vcPdfUnique(a),bb=vcPdfUnique(b);
    if(aa.length!==bb.length) return false;
    const sb=new Set(bb);
    return aa.every(x=>sb.has(x));
  }
  function vcPdfField(pdf,yRef,label,value,opts){
    opts=opts||{};
    const W=pdf.internal.pageSize.getWidth(),M=opts.x||15,right=opts.right||W-15;
    const navy=opts.color||[16,43,67], LH=opts.lineHeight||4.6;
    const txt=(typeof limpiarTextoPDF==='function'?limpiarTextoPDF(value):String(value||'').trim())||'-';
    const size=opts.size||9.2;
    pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.setTextColor(...navy);
    const lab=label+':', lw=pdf.getTextWidth(lab+' '), vx=M+lw, maxW=Math.max(24,right-vx);
    pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...navy);
    const lines=pdf.splitTextToSize(txt,maxW);
    lines.forEach((line,i)=>{
      if(i===0){pdf.setFont('helvetica','bold');pdf.text(lab,M,yRef.y);pdf.setFont('helvetica','normal');pdf.text(line,vx,yRef.y)}
      else{pdf.text(line,vx,yRef.y)}
      yRef.y+=LH;
    });
    yRef.y+=(opts.after===undefined?1.2:opts.after);
  }
  function vcPdfTwoColumnRoster(pdf,yStart,labels,opts){
    opts=opts||{};
    const W=pdf.internal.pageSize.getWidth(), H=pdf.internal.pageSize.getHeight();
    const M=opts.margin||15, gap=opts.gap||8, top=yStart;
    const colW=(W-M*2-gap)/2, rowH=opts.rowH||5, boxH=opts.boxH||4.2;
    let y=top, i=0;
    pdf.setFont('helvetica','normal');
    pdf.setFontSize(opts.size||8.8);
    pdf.setTextColor(...(opts.color||[16,43,67]));
    while(i<labels.length){
      if(y>H-(opts.bottom||18)) break;
      const left=labels[i]||'', rightLabel=labels[i+1]||'';
      if(left){
        pdf.setFillColor(...(opts.fill||[245,247,249]));
        pdf.roundedRect(M,y-3.2,colW,boxH,1.3,1.3,'F');
        const leftLines=pdf.splitTextToSize(left,colW-3);
        pdf.text(leftLines,M+1.5,y);
      }
      if(rightLabel){
        const x2=M+colW+gap;
        pdf.setFillColor(...(opts.fill||[245,247,249]));
        pdf.roundedRect(x2,y-3.2,colW,boxH,1.3,1.3,'F');
        const rightLines=pdf.splitTextToSize(rightLabel,colW-3);
        pdf.text(rightLines,x2+1.5,y);
      }
      y+=rowH; i+=2;
    }
    return y;
  }

  generarPDFEntrenamiento=function(h,equipoNombre){
    try{
      if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
      const {jsPDF}=window.jspdf, pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=13,LH=4.6;
      const navy=[16,43,67],navy2=[28,66,96],muted=[102,116,128],light=[245,247,249],line=[213,221,227],orange=[233,154,50],green=[63,124,99];
      let y=15;
      const normal=(s=9.5,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const bold=(s=9.5,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const nueva=()=>{pdf.addPage();y=15};
      const aseg=(a=6)=>{if(y+a>H-FOOT)nueva()};
      const txt=v=>(typeof limpiarTextoPDF==='function'?limpiarTextoPDF(v):String(v==null?'':v).replace(/\s+/g,' ').trim());
      const campo=(lab,val,op={})=>vcPdfField(pdf,{get y(){return y},set y(v){y=v}},lab,val,{...op,color:navy,lineHeight:LH});
      const footer=(page,total)=>{pdf.setPage(page);normal(7.7,muted);pdf.text(`Volley Coach · ${txt(equipoNombre||h.equipo||'Equipo')} · ${txt(h.fecha)||fechaLocalISO()} · ${page}/${total}`,M,H-6)};
      const teamId=vcPdfTeamIdFromName(equipoNombre);
      const rosterLabels=vcPdfSessionLabels(h,teamId);
      const rosterIds=vcPdfSessionIds(h,teamId);

      const lista=(h.ejercicios||[]).map(e=>{
        if(e!=null&&(typeof e==='number'||typeof e==='string')) return baseDeDatos.find(x=>Number(x.id)===Number(e))||{id:Number(e)};
        return typeof enriquecerEjercicioGuardado==='function' ? enriquecerEjercicioGuardado(e) : e;
      });

      let fund=typeof fundamentosConMinutos==='function' ? fundamentosConMinutos(lista) : {};
      let vals=Object.entries(fund).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
      let sum=vals.reduce((a,x)=>a+Number(x[1]||0),0);
      if(!(sum>0)){
        fund={};
        lista.forEach(e=>{
          const fs=typeof normalizarFundamentos==='function' ? normalizarFundamentos(e) : (Array.isArray(e?.fundamentos)?e.fundamentos:(e?.fundamento?[e.fundamento]:[]));
          if(!fs.length) return;
          const peso=1/fs.length; fs.forEach(f=>fund[f]=(fund[f]||0)+peso);
        });
        vals=Object.entries(fund).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
        sum=vals.reduce((a,x)=>a+Number(x[1]||0),0);
      }
      if(!(sum>0)) sum=1;

      pdf.setFillColor(...navy);pdf.rect(0,0,W,43,'F');
      bold(8,[210,221,230]);pdf.text('VOLLEY COACH · DOSSIER DE ENTRENAMIENTO',M,14);
      bold(23,[255,255,255]);pdf.text(txt(equipoNombre||h.equipo||'Equipo'),M,25);
      normal(10,[210,221,230]);pdf.text(txt(h.fecha)||fechaLocalISO(),M,33); y=55;

      bold(9,muted);pdf.text('OBJETIVO PRINCIPAL',M,y); y+=6;
      bold(15,navy);const obj=pdf.splitTextToSize(txt(h.objetivo)||'Sesión de entrenamiento',W-M*2); pdf.text(obj,M,y); y+=obj.length*6+7;

      const asistentesTexto=rosterLabels.length ? String(rosterLabels.length) : (txt(h.jugadores)||'—');
      const metrics=[['Duración',`${Number(h.duracion)|| (typeof minutosListaEjercicios==='function'?minutosListaEjercicios(lista):0)} min`],['Asistentes',asistentesTexto],['Intensidad',txt(h.intensidad)||'Media'],['Ejercicios',String(lista.length)]];
      const gap=3,cw=(W-M*2-gap*3)/4;
      metrics.forEach(([a,b],i)=>{const x=M+i*(cw+gap);pdf.setFillColor(...light);pdf.roundedRect(x,y,cw,20,2,2,'F');normal(7.5,muted);pdf.text(a.toUpperCase(),x+4,y+6);bold(12,navy);pdf.text(String(b),x+4,y+14)}); y+=29;

      bold(9,muted);pdf.text('RESUMEN DE CONTENIDOS',M,y); y+=7;
      const visual=[...vals.slice(0,4)],other=vals.slice(4).reduce((a,x)=>a+Number(x[1]||0),0); if(other>0)visual.push(['Otros',other]);
      if(!visual.length){ normal(9,muted); pdf.text('Sin fundamentos registrados en los ejercicios de esta sesión.',M,y); y+=8; }
      else{
        const raw=visual.map(([,m])=>Number(m||0)/sum*100),pct=raw.map(Math.floor); let faltan=100-pct.reduce((a,b)=>a+b,0);
        raw.map((v,i)=>[i,v-Math.floor(v)]).sort((a,b)=>b[1]-a[1]).forEach(([i])=>{if(faltan>0){pct[i]++;faltan--}});
        visual.forEach(([f,_m],i)=>{const p=pct[i]||0; normal(9,navy); pdf.text(`${f} · ${p}%`,M,y); const bx=M+47,bw=W-M-bx; pdf.setFillColor(233,237,240); pdf.roundedRect(bx,y-3,bw,4,2,2,'F'); pdf.setFillColor(...(i===0?navy2:i===1?orange:i===2?green:[132,151,166])); pdf.roundedRect(bx,y-3,Math.max(2,bw*p/100),4,2,2,'F'); y+=8; });
      }

      y+=4; bold(9,muted); pdf.text('ESTRUCTURA',M,y); y+=7;
      const grupos=typeof ejerciciosPorBloques==='function' ? ejerciciosPorBloques(lista) : {};
      (typeof ORDEN_SECCIONES_ENTRENO!=='undefined'?ORDEN_SECCIONES_ENTRENO:[]).forEach(slug=>{
        const items=grupos[slug]||[], mins=typeof minutosListaEjercicios==='function'?minutosListaEjercicios(items):0;
        if(!items.length && !txt((h.notasBloques||{})[slug])) return;
        normal(9.2,navy); pdf.text(`${SECCIONES_ENTRENO[slug].numero}  ${SECCIONES_ENTRENO[slug].titulo}`,M,y);
        bold(9.2,navy); pdf.text(`${items.length} ej. · ${mins} min`,W-M,y,{align:'right'}); y+=7;
      });

      y+=3; bold(9,muted); pdf.text(`ASISTENTES · ${rosterLabels.length}`,M,y); y+=7;
      if(rosterLabels.length){
        y = vcPdfTwoColumnRoster(pdf,y,rosterLabels,{margin:M,gap:6,rowH:5,boxH:4.2,size:8.5,color:navy,fill:[245,247,249],bottom:18});
      }else{
        normal(9,muted); pdf.text('No hay asistentes registrados para esta sesión.',M,y); y+=7;
      }
      normal(8,muted); pdf.text('Documento generado desde Volley Coach',M,H-15);

      nueva();
      const bloqueTitulo=t=>{aseg(12);bold(13,navy);pdf.text(txt(t),M,y);y+=3;pdf.setDrawColor(...line);pdf.line(M,y,W-M,y);y+=6};
      const dibujarPista=(x,yy,w=39,h=20)=>{pdf.setDrawColor(125,139,153);pdf.setLineWidth(.28);pdf.rect(x,yy,w,h);const c=x+w/2,a=w/6;pdf.setLineWidth(.48);pdf.line(c,yy,c,yy+h);pdf.setLineWidth(.2);pdf.line(c-a,yy,c-a,yy+h);pdf.line(c+a,yy,c+a,yy+h)};
      let contador=0; const notas=typeof normalizarNotasEntreno==='function' ? normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'') : (h.notasBloques||{});
      (typeof ORDEN_SECCIONES_ENTRENO!=='undefined'?ORDEN_SECCIONES_ENTRENO:[]).forEach(slug=>{
        const items=grupos[slug]||[], nota=txt(notas[slug]);
        if(!items.length && !nota) return;
        bloqueTitulo(`${SECCIONES_ENTRENO[slug].numero} ${SECCIONES_ENTRENO[slug].titulo}`);
        if(nota) campo('Notas de fase',nota,{size:8.8,after:2});
        items.forEach(e0=>{
          const e=typeof enriquecerEjercicioGuardado==='function' ? enriquecerEjercicioGuardado(e0) : e0;
          const name=txt(e.nombre)||'Ejercicio', time=Number(e.tiempo)||0, pw=39, px=W-M-pw, pr=px-5;
          aseg(36);
          const exIds=vcPdfExerciseIds(e0,h,teamId), exLabels=vcPdfExerciseLabels(e0,h,teamId), sameAsSession=vcPdfSameIdSet(exIds,rosterIds.length?rosterIds:exIds), numJug=exLabels.length||exIds.length;
          pdf.setFillColor(...light); pdf.roundedRect(M,y-4,W-M*2,7,1.5,1.5,'F');
          bold(10.2,navy); pdf.text(`${++contador}. ${name}`,M+2,y);
          normal(9,muted); pdf.text(`${time} min${numJug?` · ${numJug} jug.`:''}`,W-M-2,y,{align:'right'}); y+=7;
          const py=y+1, pageNo=pdf.getCurrentPageInfo().pageNumber; dibujarPista(px,py,pw,20);
          campo('Función',e.objetivo,{size:9,right:pr}); campo('Desarrollo',e.descripcion,{size:9,right:pr});
          const org=[e.formato?`Formato: ${txt(e.formato)}`:'',e.jugadores?`Jugadores: ${txt(e.jugadores)}`:'',e.material?`Material: ${txt(e.material)}`:''].filter(Boolean).join(' · ');
          campo('Organización',org||'-',{size:9,right:pr});
          if(!sameAsSession && exLabels.length) campo('Participantes',exLabels.join(' · '),{size:8.7,right:pr});
          if(txt(e.errores)) campo('Claves',e.errores,{size:9,right:pr});
          if(txt(e.variantes)) campo('Variantes',e.variantes,{size:9,right:pr});
          if(pdf.getCurrentPageInfo().pageNumber===pageNo) y=Math.max(y,py+24);
          normal(7.8,muted); pdf.text([typeof fundamentosTexto==='function'?fundamentosTexto(e):'',e.tipo||'',e.intensidad||''].filter(Boolean).join(' · '),M,y); y+=7;
        })
      });
      if(txt(h.notas)){bloqueTitulo('Notas del entrenador'); normal(9.2,navy); pdf.splitTextToSize(txt(h.notas),W-M*2).forEach(l=>{aseg(LH); pdf.text(l,M,y); y+=LH});}
      const totalPages=pdf.getNumberOfPages(); for(let p=1;p<=totalPages;p++) footer(p,totalPages);
      const fecha=txt(h.fecha)||fechaLocalISO(), clean=String(equipoNombre||h.equipo||'Equipo').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');
      pdf.save(`Entrenamiento_${clean}_${fecha}.pdf`);
    }catch(err){console.error(err);alert('No se pudo generar el PDF. Comprueba la conexión e inténtalo de nuevo.')}
  };

  generarPDFPartido=function(m,teamId=equipoActivo){
    try{
      if(!window.jspdf||!window.jspdf.jsPDF) throw new Error('jsPDF no disponible');
      const {jsPDF}=window.jspdf, pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.8;
      const navy=[16,43,67],navy2=[28,66,96],muted=[102,116,128],light=[245,247,249],line=[213,221,227],orange=[233,154,50];
      let y=15;
      const normal=(s=9.5,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const bold=(s=9.5,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const nueva=()=>{pdf.addPage();y=15};
      const aseg=(a=6)=>{if(y+a>H-FOOT)nueva()};
      const txt=v=>(typeof limpiarTextoPDF==='function'?limpiarTextoPDF(v):String(v==null?'':v).replace(/\s+/g,' ').trim());
      const campo=(lab,val,op={})=>vcPdfField(pdf,{get y(){return y},set y(v){y=v}},lab,val,{...op,color:navy,lineHeight:LH});
      const footer=(page,total)=>{pdf.setPage(page);normal(7.7,muted);pdf.text(`Volley Coach · Partido · ${txt(m.date)||fechaLocalISO()} · ${page}/${total}`,M,H-6)};
      const section=t=>{aseg(12);bold(13,navy);pdf.text(txt(t),M,y);y+=3;pdf.setDrawColor(...line);pdf.line(M,y,W-M,y);y+=6};

      const roster=typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,teamId):[];
      const called=roster.filter(r=>r.status==='Convocado');
      const unavailable=roster.filter(r=>r.status==='No disponible');
      const calledLabels=called.map(r=>typeof vcMatchPlayerLine==='function'?vcMatchPlayerLine(r):((r.number!==''&&r.number!=null?'#'+r.number+' · ':'')+r.name));
      const noDispLabels=unavailable.map(r=>`${typeof vcMatchPlayerLine==='function'?vcMatchPlayerLine(r):((r.number!==''&&r.number!=null?'#'+r.number+' · ':'')+r.name)}${r.reason?` — ${r.reason}`:''}`);

      pdf.setFillColor(...navy); pdf.rect(0,0,W,43,'F');
      bold(8,[210,221,230]); pdf.text('VOLLEY COACH · DOSSIER DE PARTIDO',M,14);
      bold(23,[255,255,255]); pdf.text(txt(EQUIPOS[teamId]?.nombre||'Equipo'),M,25);
      normal(10,[210,221,230]); pdf.text(txt(m.date)||fechaLocalISO(),M,33); y=55;

      bold(9,muted); pdf.text('PARTIDO',M,y); y+=6;
      bold(15,navy); const rivalLines=pdf.splitTextToSize(`vs ${txt(m.opponent)||'Rival'}`,W-M*2); pdf.text(rivalLines,M,y); y+=rivalLines.length*6+7;

      const metrics=[['Convocatoria',txt(m.callTime)||'—'],['Hora partido',txt(m.time)||'—'],['Estado',txt(m.status)||'Programado'],['Convocados',String(called.length)]];
      const gap=3,cw=(W-M*2-gap*3)/4;
      metrics.forEach(([a,b],i)=>{const x=M+i*(cw+gap);pdf.setFillColor(...light);pdf.roundedRect(x,y,cw,20,2,2,'F');normal(7.5,muted);pdf.text(a.toUpperCase(),x+4,y+6);bold(12,navy);pdf.text(String(b),x+4,y+14)}); y+=28;

      bold(9,muted); pdf.text('RESUMEN DEL PARTIDO',M,y); y+=7;
      const resumen=[
        ['Competición', txt(m.competition)||'—'],
        ['Jornada / fase', txt(m.round)||'—'],
        ['Condición', txt(m.venue)||'—'],
        ['Resultado', m.status==='Jugado' ? `${Number(m.setsFor)||0} - ${Number(m.setsAgainst)||0}` : 'Pendiente']
      ];
      resumen.forEach(([lab,val])=>{ normal(9,navy); pdf.text(`${lab}`,M,y); bold(9,navy); pdf.text(String(val),W-M,y,{align:'right'}); y+=7; });
      if(m.status==='Jugado' && txt(m.setDetail)){ normal(8.6,muted); pdf.text(`Sets: ${txt(m.setDetail)}`,M,y); y+=6; }

      y+=2; bold(9,muted); pdf.text(`CONVOCATORIA · ${called.length}`,M,y); y+=7;
      if(calledLabels.length) y=vcPdfTwoColumnRoster(pdf,y,calledLabels,{margin:M,gap:6,rowH:5,boxH:4.2,size:8.5,color:navy,fill:[245,247,249],bottom:18});
      else { normal(9,muted); pdf.text('No hay convocados registrados.',M,y); y+=7; }

      if(noDispLabels.length){
        y+=3; bold(9,muted); pdf.text('NO DISPONIBLES',M,y); y+=7;
        noDispLabels.forEach((linea,idx)=>{aseg(7); normal(8.8,navy); const ls=pdf.splitTextToSize(`${idx+1}. ${linea}`,W-M*2); pdf.text(ls,M,y); y+=ls.length*4.6; });
      }
      normal(8,muted); pdf.text('Documento generado desde Volley Coach',M,H-15);

      nueva();
      section('Detalle del partido');
      campo('Equipo',EQUIPOS[teamId]?.nombre||'Equipo',{after:1});
      campo('Fecha',m.date||'-',{after:1});
      if(m.callTime) campo('Hora de convocatoria',m.callTime,{after:1});
      if(m.time) campo('Hora del partido',m.time,{after:1});
      campo('Rival',m.opponent||'-',{after:1});
      campo('Competición',m.competition||'-',{after:1});
      campo('Jornada / fase',m.round||'-',{after:1});
      campo('Condición',m.venue||'-',{after:1});
      campo('Estado',m.status||'Programado',{after:3});

      if(m.status==='Jugado'){
        section('Resultado');
        campo('Marcador',`${Number(m.setsFor)||0} – ${Number(m.setsAgainst)||0}`,{after:1});
        if(txt(m.setDetail)) campo('Sets',m.setDetail,{after:3});
      }
      if(called.length){
        section(`Convocados · ${called.length}`);
        called.forEach((r,i)=>{aseg(6); normal(9.2,navy); const ls=pdf.splitTextToSize(`${i+1}. ${typeof vcMatchPlayerLine==='function'?vcMatchPlayerLine(r):r.name}`,W-M*2); pdf.text(ls,M,y); y+=ls.length*4.8;});
      }
      if(unavailable.length){
        section('No disponibles');
        unavailable.forEach((r,i)=>{
          aseg(10);
          normal(9.2,navy); const title=pdf.splitTextToSize(`${i+1}. ${typeof vcMatchPlayerLine==='function'?vcMatchPlayerLine(r):r.name}`,W-M*2); pdf.text(title,M,y); y+=title.length*4.8;
          normal(8.8,muted); const why=pdf.splitTextToSize(`Motivo: ${txt(r.reason)||'No indicado'}`,W-M*2-5); pdf.text(why,M+5,y); y+=why.length*4.2;
        });
      }
      if(Array.isArray(m.focus)&&m.focus.length){ section('Prioridades detectadas'); campo('Trabajar',m.focus.join(' · '),{after:2}); }
      if(txt(m.notes)){ section('Notas / lectura del partido'); normal(9.3,navy); pdf.splitTextToSize(txt(m.notes),W-M*2).forEach(t=>{aseg(LH); pdf.text(t,M,y); y+=LH}); }

      const totalPages=pdf.getNumberOfPages(); for(let p=1;p<=totalPages;p++) footer(p,totalPages);
      const rival=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_'); const date=txt(m.date)||fechaLocalISO();
      pdf.save(`Partido_${rival}_${date}.pdf`);
    }catch(err){console.error(err);alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.')}
  };
})();
