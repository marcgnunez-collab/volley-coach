/* Volley Coach - estadísticas */

function renderStats(){
  let mins=historial.reduce((a,h)=>a+(h.duracion||0),0);
  $('stat-sesiones').textContent=historial.length;
  $('stat-ejercicios').textContent=baseDeDatos.length;
  $('stat-minutos').textContent=mins;
  if($('stat-team-name'))$('stat-team-name').textContent=EQUIPOS[equipoActivo].nombre;

  let counts={};
  historial.forEach(h=>(h.ejercicios||[]).forEach(e=>normalizarFundamentos(e).forEach(f=>counts[f]=(counts[f]||0)+(+e.tiempo||0))));
  let max=Math.max(1,...Object.values(counts));
  $('stat-bars').innerHTML=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar"><span style="width:${v/max*100}%"></span></div><b>${v}m</b></div>`).join('')||'<div class="empty">Completa entrenamientos para generar estadísticas.</div>';

  let intens={Baja:0,Media:0,Alta:0};
  historial.forEach(h=>intens[h.intensidad||'Media']++);
  $('stat-intensidad').innerHTML=Object.entries(intens).map(([k,v])=>`<div class="load-card"><span class="small">${k}</span><div style="font-size:22px;font-weight:700;margin-top:5px">${v}</div></div>`).join('');

  let vals=Object.values(counts);let balance='Sin datos suficientes.';
  if(vals.length>=3){let avg=vals.reduce((a,b)=>a+b,0)/vals.length,maxv=Math.max(...vals);balance=maxv<=avg*1.6?'Distribución bastante equilibrada entre los fundamentos trabajados.':'Hay una concentración clara en algunos fundamentos. Conviene revisar la planificación para compensar contenidos menos trabajados.'}
  $('stat-balance').innerHTML=`<span class="badge-balanced">${esc(balance)}</span>`;

  const mapa={};
  historial.forEach(h=>{
    (h.ejercicios||[]).forEach(e=>{
      const key=e.id!=null?'id:'+e.id:'nombre:'+(e.nombre||'').toLowerCase();
      if(!mapa[key])mapa[key]={id:e.id,nombre:e.nombre||'Ejercicio',usos:0,minutos:0,sesiones:[]};
      mapa[key].usos++;
      mapa[key].minutos+=Number(e.tiempo)||0;
      mapa[key].sesiones.push({fecha:h.fecha||'Sin fecha',objetivo:h.objetivo||'',duracion:Number(e.tiempo)||0});
    });
  });
  const usados=Object.values(mapa).sort((a,b)=>b.usos-a.usos||b.minutos-a.minutos||a.nombre.localeCompare(b.nombre));
  $('stat-top').innerHTML=usados.slice(0,5).map((e,i)=>`<p>${i+1}. <b>${esc(e.nombre)}</b> · ${e.usos} ${e.usos===1?'uso':'usos'} · ${e.minutos} min en ${esc(EQUIPOS[equipoActivo].corto)}</p>`).join('')||'<div class="empty">Aún no hay ejercicios utilizados en este equipo.</div>';

  if($('stat-usage-detail')){
    if(!usados.length){
      $('stat-usage-detail').innerHTML='<div class="empty">Cuando finalices entrenamientos, aquí verás exactamente en qué sesiones se ha utilizado cada ejercicio.</div>';
    }else{
      $('stat-usage-detail').innerHTML=`<div class="usage-table-wrap"><table class="usage-table"><thead><tr><th>Ejercicio</th><th>Usos</th><th>Minutos</th><th>Utilizado en</th></tr></thead><tbody>${usados.map(e=>{
        const sesiones=[...e.sesiones].sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha)));
        const chips=sesiones.map(s=>`<span class="usage-chip">${esc(s.fecha)}${s.objetivo?' · '+esc(s.objetivo):''}</span>`).join('');
        return `<tr><td><span class="usage-name">${esc(e.nombre)}</span></td><td><b>${e.usos}</b></td><td>${e.minutos} min</td><td><div class="usage-session-list">${chips}</div></td></tr>`;
      }).join('')}</tbody></table></div>`;
    }
  }
}
