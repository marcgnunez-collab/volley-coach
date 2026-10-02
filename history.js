/* Volley Coach - historial de entrenamientos */

function fundamentosSesion(h){
  const fs=[];(h.ejercicios||[]).forEach(e=>normalizarFundamentos(e).forEach(f=>{if(!fs.includes(f))fs.push(f)}));return fs;
}
function notasBloquesHistorial(h){const notas=h&&h.notasBloques&&typeof h.notasBloques==='object'?h.notasBloques:{};return Object.keys(SECCIONES_ENTRENO).map(slug=>{const txt=String(notas[slug]||'').trim();return txt?`<p><b>${esc(SECCIONES_ENTRENO[slug].titulo)}:</b> ${esc(txt)}</p>`:''}).join('')}
function toggleTrainingDetail(team,id){const el=$('training-'+team+'-'+id);if(el)el.classList.toggle('open')}
function repetirSesionEquipo(team,id){
  if(team!==equipoActivo)cambiarEquipo(team);
  let h=historial.find(x=>x.id===id);if(!h)return;
  sesionActual=h.ejercicios.map(x=>x.id).filter(id=>baseDeDatos.some(e=>e.id===id));const secciones={};(h.ejercicios||[]).forEach(x=>{if(x.id!=null&&sesionActual.includes(x.id))secciones[String(x.id)]=x.seccionSesion||seccionNaturalEjercicio(baseDeDatos.find(e=>e.id===x.id))});meta={fecha:new Date().toISOString().slice(0,10),equipo:EQUIPOS[equipoActivo].nombre,jugadores:h.jugadores||'',intensidad:h.intensidad||'Media',objetivo:h.objetivo||'',calentamiento:h.calentamiento||'',notas:'',seccionesEjercicios:secciones,notasBloques:clonar(h.notasBloques||{})};save();cargarMeta();renderizarSesion();filtrarEjercicios();if(h.pizarra){setTimeout(()=>aplicarPizarra(h.pizarra),100)}document.querySelectorAll('.tab-btn')[0].click();
}
function borrarHistorialEquipo(team){
  if(!confirm('¿Borrar todo el historial de '+EQUIPOS[team].nombre+'?'))return;
  if(team===equipoActivo){historial=[];save();}else{equiposData[team].historial=[];guardarEstadoLocalSinCloud();programarSubidaCloud();}
  renderHistorial();renderStats();
}
function renderHistorial(){
  guardarEquipoEnMemoria();
  const column=team=>{
    const hs=clonar(equiposData?.[team]?.historial||[]).sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
    const items=hs.map(h=>{const fs=fundamentosSesion(h);const trabajo=fs.length?fs.join(' · '):(h.objetivo||'Sin contenido indicado');return `<div class="training-simple-item" onclick="toggleTrainingDetail('${team}',${h.id})"><div class="training-simple-top"><div><div class="training-date">${esc(h.fecha||'Sin fecha')}</div><div class="training-work">${esc(trabajo)}</div></div><span class="small">${h.duracion||0} min</span></div><div id="training-${team}-${h.id}" class="training-detail"><p><b>Objetivo:</b> ${esc(h.objetivo||'-')}</p><p><b>Ejercicios:</b> ${(h.ejercicios||[]).map(e=>esc(e.nombre)).join(' · ')||'-'}</p>${h.notas?`<p><b>Notas:</b> ${esc(h.notas)}</p>`:''}${notasBloquesHistorial(h)}<div class="actions"><button class="primary" onclick="event.stopPropagation();repetirSesionEquipo('${team}',${h.id})">Repetir entrenamiento</button><button class="ghost" onclick="event.stopPropagation();exportarHistorialPDF('${team}',${h.id})">📄 Exportar PDF</button></div></div></div>`}).join('')||'<div class="empty">Aún no hay entrenamientos guardados.</div>';
    return `<div class="team-training-column"><div class="team-training-column-head"><h3>${esc(EQUIPOS[team].nombre)}</h3><button class="ghost" style="background:#fff;color:#17324d" onclick="borrarHistorialEquipo('${team}')">Borrar</button></div><div class="training-simple-list">${items}</div></div>`;
  };
  $('historial-list').innerHTML=column('cadete')+column('infantil');
}
function repetirSesion(id){repetirSesionEquipo(equipoActivo,id)}
function borrarHistorial(){borrarHistorialEquipo(equipoActivo)}
