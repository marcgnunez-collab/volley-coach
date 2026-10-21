(function(){
  generarPDFPartido=function(m,teamId=equipoActivo){
    try{
      if(!window.jspdf||!window.jspdf.jsPDF) throw new Error('jsPDF no disponible');

      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=pdf.internal.pageSize.getWidth(), H=pdf.internal.pageSize.getHeight(), M=15;
      const navy=[16,43,67], navy2=[28,66,96], muted=[102,116,128],
            light=[245,247,249], line=[213,221,227], orange=[233,154,50], green=[63,124,99];

      const clean=v=>(typeof limpiarTextoPDF==='function'
        ? limpiarTextoPDF(v)
        : String(v==null?'':v).replace(/\s+/g,' ').trim());

      const normal=(s=9,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const bold=(s=9,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)};
      const thinRule=(y)=>{pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y)};
      const sectionTitle=(title,y)=>{
        bold(8.5,muted);pdf.text(String(title||'').toUpperCase(),M,y);
        thinRule(y+2.2);
        return y+7;
      };
      const valueOrDash=v=>clean(v)||'—';

      const roster=(typeof vcMatchRosterForPDF==='function'?vcMatchRosterForPDF(m,teamId):[]);
      const called=roster.filter(r=>r.status==='Convocado');
      const unavailable=roster.filter(r=>r.status==='No disponible');
      const playerLine=r=>{
        if(typeof vcMatchPlayerLine==='function') return vcMatchPlayerLine(r);
        const left=`${r.number!==''&&r.number!=null?'#'+r.number+' · ':''}${r.name||'Jugador'}`;
        const pos=(r.matchPosition||((r.positions||[]).join(' / '))).trim();
        return pos?`${left} · ${pos}`:left;
      };

      const teamEval=m?.matchEvaluation&&typeof m.matchEvaluation==='object'?m.matchEvaluation:{};
      const individual=Array.isArray(m?.playerEvaluations)?m.playerEvaluations.slice():[];
      if(typeof vcPlayerNumberCompare==='function') individual.sort(vcPlayerNumberCompare);

      /* CABECERA */
      pdf.setFillColor(...navy);pdf.rect(0,0,W,43,'F');
      bold(8,[210,221,230]);pdf.text('VOLLEY COACH · DOSSIER DE PARTIDO',M,14);
      bold(23,[255,255,255]);pdf.text(valueOrDash(EQUIPOS[teamId]?.nombre||'Equipo'),M,25);
      normal(10,[210,221,230]);pdf.text(valueOrDash(m.date||fechaLocalISO()),M,33);

      let y=54;

      /* BLOQUE PRINCIPAL: rival + resultado */
      bold(8.5,muted);pdf.text('PARTIDO',M,y);y+=5.5;
      bold(16,navy);const rivalLines=pdf.splitTextToSize(`vs ${valueOrDash(m.opponent)}`,W-M*2);
      pdf.text(rivalLines,M,y);y+=rivalLines.length*6+5;

      const resultText=m.status==='Jugado'
        ? `${Number(m.setsFor)||0} - ${Number(m.setsAgainst)||0}`
        : 'Pendiente';
      const metrics=[
        ['Convocatoria',valueOrDash(m.callTime)],
        ['Hora partido',valueOrDash(m.time)],
        ['Estado',valueOrDash(m.status||'Programado')],
        ['Resultado',resultText]
      ];
      const gap=3,cw=(W-M*2-gap*3)/4;
      metrics.forEach(([label,value],i)=>{
        const x=M+i*(cw+gap);
        pdf.setFillColor(...light);pdf.roundedRect(x,y,cw,19,2,2,'F');
        normal(7.2,muted);pdf.text(label.toUpperCase(),x+4,y+6);
        bold(11.5,navy);pdf.text(String(value),x+4,y+13.5);
      });
      y+=26;

      /* DATOS DEL PARTIDO EN DOS COLUMNAS */
      y=sectionTitle('Datos del partido',y);
      const dataRows=[
        ['Competición',valueOrDash(m.competition),'Jornada / fase',valueOrDash(m.round)],
        ['Pabellón',valueOrDash(m.pavilion),'Condición',valueOrDash(m.venue)],
        ['Equipación',valueOrDash(m.kit),'Camiseta calentamiento',valueOrDash(m.warmupShirt)],
        ['Convocados',String(called.length),'No disponibles',String(unavailable.length)],
        ['Marcadores de sets',m.status==='Jugado'?valueOrDash(m.setDetail):'—','Estado',valueOrDash(m.status||'Programado')]
      ];
      const colGap=10, colW=(W-M*2-colGap)/2;
      dataRows.forEach(row=>{
        const leftLabel=row[0],leftVal=row[1],rightLabel=row[2],rightVal=row[3];
        normal(7.4,muted);pdf.text(leftLabel.toUpperCase(),M,y);
        bold(9.2,navy);pdf.text(String(leftVal),M,y+4.5);
        const x2=M+colW+colGap;
        normal(7.4,muted);pdf.text(rightLabel.toUpperCase(),x2,y);
        bold(9.2,navy);pdf.text(String(rightVal),x2,y+4.5);
        y+=10;
      });

      /* VALORACIÓN COLECTIVA */
      const evalValues=[
        ['Global',teamEval.overall],
        ['Técnica',teamEval.technique],
        ['Táctica',teamEval.tactics],
        ['Actitud',teamEval.attitude]
      ];
      const hasTeamEval=evalValues.some(([,v])=>Number(v)>0) || clean(teamEval.notes);
      if(hasTeamEval){
        y+=1;y=sectionTitle('Valoración colectiva',y);
        const eg=3,ecw=(W-M*2-eg*3)/4;
        evalValues.forEach(([lab,val],i)=>{
          const x=M+i*(ecw+eg);
          pdf.setFillColor(...light);pdf.roundedRect(x,y,ecw,13,1.5,1.5,'F');
          normal(6.9,muted);pdf.text(lab.toUpperCase(),x+3,y+4.5);
          bold(10.5,navy2);pdf.text(Number(val)>0?`${Number(val)}/5`:'—',x+3,y+10);
        });
        y+=17;
        if(clean(teamEval.notes)){
          normal(7.3,muted);pdf.text('LECTURA COLECTIVA',M,y);y+=4.2;
          normal(8.6,navy);
          const lines=pdf.splitTextToSize(clean(teamEval.notes),W-M*2);
          const maxLines=Math.min(lines.length,4);
          pdf.text(lines.slice(0,maxLines),M,y);
          y+=maxLines*4.2;
        }
      }

      /* CONVOCATORIA */
      y+=2;y=sectionTitle(`Convocatoria · ${called.length}`,y);
      const rosterGap=6, rosterColW=(W-M*2-rosterGap)/2, rosterRowH=5;
      const rosterLabels=called.map(playerLine);
      for(let i=0;i<rosterLabels.length;i+=2){
        const left=rosterLabels[i],right=rosterLabels[i+1];
        pdf.setFillColor(...light);pdf.roundedRect(M,y-3.1,rosterColW,4.1,1.2,1.2,'F');
        normal(8.1,navy);pdf.text(pdf.splitTextToSize(left,rosterColW-3),M+1.5,y);
        if(right){
          const x2=M+rosterColW+rosterGap;
          pdf.setFillColor(...light);pdf.roundedRect(x2,y-3.1,rosterColW,4.1,1.2,1.2,'F');
          pdf.text(pdf.splitTextToSize(right,rosterColW-3),x2+1.5,y);
        }
        y+=rosterRowH;
      }

      /* NO DISPONIBLES */
      if(unavailable.length){
        y+=2;y=sectionTitle('No disponibles',y);
        unavailable.forEach((r,i)=>{
          normal(8.2,navy);
          const text=`${i+1}. ${playerLine(r)}${clean(r.reason)?` · Motivo: ${clean(r.reason)}`:''}`;
          const lines=pdf.splitTextToSize(text,W-M*2);
          pdf.text(lines,M,y);y+=lines.length*4.1;
        });
      }

      /* PRIORIDADES */
      if(Array.isArray(m.focus)&&m.focus.length){
        y+=2;y=sectionTitle('Prioridades detectadas',y);
        normal(8.6,navy);
        const lines=pdf.splitTextToSize(m.focus.join(' · '),W-M*2);
        pdf.text(lines,M,y);y+=lines.length*4.2;
      }

      /* NOTAS / LECTURA */
      if(clean(m.notes)){
        y+=2;y=sectionTitle('Notas / lectura del partido',y);
        normal(8.6,navy);
        const lines=pdf.splitTextToSize(clean(m.notes),W-M*2);
        /* Priorizamos que toda la información quede en esta hoja. */
        const availableLines=Math.max(2,Math.floor((H-42-y)/4.1));
        const shown=lines.slice(0,availableLines);
        pdf.text(shown,M,y);
        y+=shown.length*4.1;
      }

      /* VALORACIÓN INDIVIDUAL COMPACTA, SI EXISTE */
      const rated=individual.filter(r=>Number(r.rating)>0 || clean(r.note) || r.played===false);
      if(rated.length && y < H-38){
        y+=2;y=sectionTitle('Valoración individual',y);
        const byId=new Map(roster.map(r=>[Number(r.id),r]));
        const maxRows=Math.max(1,Math.floor((H-26-y)/5));
        rated.slice(0,maxRows).forEach(r=>{
          const rr=byId.get(Number(r.id))||r;
          const name=playerLine({...rr,name:rr.name||r.name,number:rr.number??r.number});
          const status=r.played===false?'No jugó':(Number(r.rating)>0?`${Number(r.rating)}/5`:'Sin nota');
          const note=clean(r.note);
          normal(7.9,navy);
          const text=`${name} · ${status}${note?` · ${note}`:''}`;
          const lines=pdf.splitTextToSize(text,W-M*2);
          pdf.text(lines,M,y);y+=lines.length*4;
        });
      }

      normal(7.5,muted);
      pdf.text(`Volley Coach · ${valueOrDash(EQUIPOS[teamId]?.nombre||'Equipo')} · ${valueOrDash(m.date)}`,M,H-7);

      const fileRival=String(m.opponent||'Rival').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');
      pdf.save(`Partido_${fileRival}_${clean(m.date)||fechaLocalISO()}.pdf`);
    }catch(err){
      console.error(err);
      alert('No se pudo generar el PDF del partido. Comprueba la conexión e inténtalo de nuevo.');
    }
  };
})();
