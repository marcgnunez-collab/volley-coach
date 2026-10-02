/* Volley Coach - biblioteca de ejercicios */

function getForm(){const fundamentos=getFundamentosSeleccionados();return {nombre:$('nuevo-nombre').value.trim(),tiempo:+$('nuevo-tiempo').value||0,escuela:$('nueva-escuela').value,fundamentos,fundamento:fundamentos[0]||'',formato:$('nuevo-formato').value.trim(),nivel:$('nuevo-nivel').value,intensidad:$('nueva-intensidad').value,tipo:$('nuevo-tipo').value,jugadores:$('nuevo-jugadores').value.trim(),material:$('nuevo-material').value.trim(),video:$('nuevo-video').value.trim(),objetivo:$('nuevo-objetivo').value.trim(),descripcion:$('nueva-descripcion').value.trim(),variantes:$('nuevo-variantes').value.trim(),errores:$('nuevo-errores').value.trim(),fase:$('nuevo-fase').value,pizarra:pizarraParaEjercicio}}
function normalizarTextoSimilitud(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function tokensSimilitud(v){const stop=new Set(['de','la','el','los','las','un','una','unos','unas','y','o','en','con','para','por','del','al','que','se','a','e','es','su','sus','como','cada','entre','desde','hasta','sobre','sin','ejercicio','jugador','jugadores','balon','balones']);return normalizarTextoSimilitud(v).split(' ').filter(x=>x.length>2&&!stop.has(x))}
function jaccardSimilitud(a,b){const A=new Set(tokensSimilitud(a)),B=new Set(tokensSimilitud(b));if(!A.size&&!B.size)return 0;let inter=0;A.forEach(x=>{if(B.has(x))inter++});return inter/(A.size+B.size-inter||1)}
function diceNombre(a,b){a=normalizarTextoSimilitud(a).replace(/ /g,'');b=normalizarTextoSimilitud(b).replace(/ /g,'');if(a===b&&a)return 1;if(a.length<2||b.length<2)return 0;const m=new Map();for(let i=0;i<a.length-1;i++){const g=a.slice(i,i+2);m.set(g,(m.get(g)||0)+1)}let hit=0;for(let i=0;i<b.length-1;i++){const g=b.slice(i,i+2),n=m.get(g)||0;if(n){hit++;m.set(g,n-1)}}return (2*hit)/((a.length-1)+(b.length-1))}
function similitudEjercicios(a,b){
  const na=normalizarTextoSimilitud(a.nombre),nb=normalizarTextoSimilitud(b.nombre);if(na&&na===nb)return 1;
  const nombre=Math.max(diceNombre(a.nombre,b.nombre),jaccardSimilitud(a.nombre,b.nombre));
  const contenidoA=[a.descripcion,a.objetivo,a.variantes,a.formato,a.material].join(' '),contenidoB=[b.descripcion,b.objetivo,b.variantes,b.formato,b.material].join(' ');
  const contenido=jaccardSimilitud(contenidoA,contenidoB);
  const fa=new Set(normalizarFundamentos(a)),fb=new Set(normalizarFundamentos(b));let fi=0;fa.forEach(x=>{if(fb.has(x))fi++});const fundamento=(fa.size||fb.size)?fi/Math.max(fa.size,fb.size,1):0;
  const tipo=(a.tipo&&b.tipo&&a.tipo===b.tipo)?1:0;
  let score=.48*nombre+.34*contenido+.12*fundamento+.06*tipo;
  if(nombre>.84&&contenido>.28)score=Math.max(score,.76);
  if(nombre>.92)score=Math.max(score,.82);
  if(contenido>.72&&fundamento>.5)score=Math.max(score,.78);
  return Math.min(1,score);
}
function motivoSimilitud(a,b){const partes=[];const n=Math.max(diceNombre(a.nombre,b.nombre),jaccardSimilitud(a.nombre,b.nombre));const c=jaccardSimilitud([a.descripcion,a.objetivo,a.variantes].join(' '),[b.descripcion,b.objetivo,b.variantes].join(' '));const comunes=normalizarFundamentos(a).filter(x=>normalizarFundamentos(b).includes(x));if(n>=.7)partes.push('nombre parecido');if(c>=.35)partes.push('descripción/objetivo parecido');if(comunes.length)partes.push('mismo fundamento: '+comunes.join(', '));if(a.tipo&&a.tipo===b.tipo)partes.push('mismo tipo: '+a.tipo);return partes.join(' · ')||'coincidencias de contenido'}
function similaresDeEjercicio(d,idExcluir){return baseDeDatos.filter(e=>e.id!==idExcluir).map(e=>({e,score:similitudEjercicios(d,e)})).filter(x=>x.score>=.70).sort((a,b)=>b.score-a.score).slice(0,5)}
function cerrarSimilares(){$('similarity-modal').classList.remove('open')}
function editarDesdeSimilares(id){const e=baseDeDatos.find(x=>x.id===id);if(!e)return;cerrarSimilares();fillForm(e)}
function revisarBibliotecaSimilares(){const pares=[];for(let i=0;i<baseDeDatos.length;i++)for(let j=i+1;j<baseDeDatos.length;j++){const score=similitudEjercicios(baseDeDatos[i],baseDeDatos[j]);if(score>=.70)pares.push({a:baseDeDatos[i],b:baseDeDatos[j],score})}pares.sort((x,y)=>y.score-x.score);const box=$('similarity-results');if(!pares.length){box.innerHTML='<div class="empty">✅ No se han detectado ejercicios suficientemente parecidos como para revisarlos.</div>'}else{box.innerHTML=pares.slice(0,40).map(p=>`<div class="similarity-pair"><span class="similarity-score">${Math.round(p.score*100)}% similar</span><div class="similarity-names"><div class="similarity-ex-name">${esc(p.a.nombre)}</div><div class="similarity-vs">↔</div><div class="similarity-ex-name">${esc(p.b.nombre)}</div></div><div class="similarity-reason">${esc(motivoSimilitud(p.a,p.b))}</div><div class="actions" style="margin-top:9px"><button class="ghost" onclick="editarDesdeSimilares(${p.a.id})">✏️ Revisar primero</button><button class="ghost" onclick="editarDesdeSimilares(${p.b.id})">✏️ Revisar segundo</button></div></div>`).join('');if(pares.length>40)box.innerHTML+=`<div class="small">Se muestran las 40 coincidencias más altas de ${pares.length}.</div>`}$('similarity-modal').classList.add('open')}
function guardarEjercicio(){let d=getForm();if(!d.nombre||!d.descripcion){alert('Añade al menos nombre y descripción.');return}if(!d.fundamentos.length){alert('Selecciona al menos un grupo / fundamento.');return}let id=+$('edit-id').value;const parecidos=similaresDeEjercicio(d,id||null);if(parecidos.length){const txt=parecidos.slice(0,3).map(x=>'• '+x.e.nombre+' ('+Math.round(x.score*100)+'%)').join('\n');if(!confirm('⚠️ Puede que este ejercicio ya exista o sea muy parecido a otro:\n\n'+txt+'\n\n¿Quieres guardarlo igualmente?'))return}let nuevoId=null;if(id){let idx=baseDeDatos.findIndex(e=>e.id===id);baseDeDatos[idx]={...baseDeDatos[idx],...d}}else{nuevoId=Date.now();baseDeDatos.push({id:nuevoId,...d,favorito:false,usos:0})}save();const destinoCreado=(!id&&nuevoId&&crearEjercicioDestinoSesion)?crearEjercicioDestinoSesion:null;cancelarEdicion();if(destinoCreado){const mapa=mapaSeccionesSesion();if(!sesionActual.includes(nuevoId))sesionActual.push(nuevoId);mapa[String(nuevoId)]=destinoCreado;meta.seccionesEjercicios=mapa;crearEjercicioDestinoSesion=null;save();volverAlEntrenamiento();$('save-indicator').textContent='✓ Ejercicio creado y añadido a '+SECCIONES_ENTRENO[destinoCreado].titulo;return}filtrarEjercicios();}
function fillForm(e){crearEjercicioDestinoSesion=null;$('edit-id').value=e.id;$('nuevo-nombre').value=e.nombre;$('nuevo-tiempo').value=e.tiempo;$('nueva-escuela').value=e.escuela;setFundamentosSeleccionados(normalizarFundamentos(e));$('nuevo-formato').value=e.formato||'';$('nuevo-nivel').value=e.nivel||'Intermedio';$('nueva-intensidad').value=e.intensidad||'Media';$('nuevo-tipo').value=e.tipo||'';$('nuevo-jugadores').value=e.jugadores||'';$('nuevo-material').value=e.material||'';$('nuevo-video').value=e.video||'';$('nuevo-objetivo').value=e.objetivo||'';$('nueva-descripcion').value=e.descripcion||'';$('nuevo-variantes').value=e.variantes||'';$('nuevo-errores').value=e.errores||'';$('nuevo-fase').value=e.fase||'Parte principal';pizarraParaEjercicio=e.pizarra||null;$('form-title').textContent='✏️ Editar ejercicio';$('cancel-edit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
function cancelarEdicion(){['edit-id','nuevo-nombre','nuevo-tiempo','nuevo-formato','nuevo-jugadores','nuevo-material','nuevo-video','nuevo-objetivo','nueva-descripcion','nuevo-variantes','nuevo-errores'].forEach(id=>$(id).value='');setFundamentosSeleccionados([]);$('nuevo-tipo').value='';$('form-title').textContent='➕ Añadir ejercicio a la biblioteca';$('cancel-edit').classList.add('hidden');pizarraParaEjercicio=null;}
function duplicarEjercicio(id){let e=baseDeDatos.find(x=>x.id===id);baseDeDatos.push({...e,id:Date.now(),nombre:e.nombre+' (copia)',usos:0,favorito:false});save();filtrarEjercicios();}
function eliminarEjercicio(id){if(!confirm('¿Borrar este ejercicio de la biblioteca compartida? Se quitará también de las sesiones actuales de ambos equipos.'))return;baseDeDatos=baseDeDatos.filter(e=>e.id!==id);sesionActual=sesionActual.filter(x=>x!==id);delete mapaSeccionesSesion()[String(id)];Object.keys(EQUIPOS).forEach(k=>{if(k!==equipoActivo&&equiposData[k]){equiposData[k].sesionActual=(equiposData[k].sesionActual||[]).filter(x=>x!==id);if(equiposData[k].meta&&equiposData[k].meta.seccionesEjercicios)delete equiposData[k].meta.seccionesEjercicios[String(id)]}});save();filtrarEjercicios();renderizarSesion();}
function toggleFav(id){let e=baseDeDatos.find(x=>x.id===id);e.favorito=!e.favorito;save();filtrarEjercicios();}
function toggleInfo(id){const el=$('detalles-'+id);if(el)el.classList.toggle('open');const st=$('stats-ex-'+id);if(st)st.classList.remove('open')}
function usoEjercicioGlobal(id,nombre){
  const out={infantil:[],cadete:[],totalUsos:0,totalMinutos:0};
  Object.keys(EQUIPOS).forEach(team=>{
    const hs=(team===equipoActivo?historial:(equiposData?.[team]?.historial||[]));
    hs.forEach(h=>(h.ejercicios||[]).forEach(e=>{if((id!=null&&e.id===id)||(id==null&&String(e.nombre||'').toLowerCase()===String(nombre||'').toLowerCase())){out[team].push({fecha:h.fecha||'Sin fecha',objetivo:h.objetivo||'',tiempo:Number(e.tiempo)||0});out.totalUsos++;out.totalMinutos+=Number(e.tiempo)||0;}}));
  });
  return out;
}
function toggleExerciseStats(id){const panel=$('stats-ex-'+id);if(!panel)return;const info=$('detalles-'+id);if(info)info.classList.remove('open');panel.classList.toggle('open')}
function filtrarEjercicios(){let q=$('buscar').value.trim().toLowerCase(),escuela=$('escuela').value,fun=$('fundamento').value,nivel=$('nivel').value,tipo=$('tipo').value,fav=$('favoritos').value;const hayCriterio=!!(q||escuela||fun||nivel||tipo||fav);if(!hayCriterio){$('contenedor-principal').innerHTML='<div class="empty">Selecciona un filtro o escribe el nombre de un ejercicio.</div>';return}let d=baseDeDatos.filter(e=>{const fs=normalizarFundamentos(e);return (!escuela||escuela==='Todas'||e.escuela===escuela)&&(!fun||fun==='Todos'||fs.includes(fun))&&(!nivel||nivel==='Todos'||(e.nivel||'Intermedio')===nivel)&&(!tipo||tipo==='Todos'||(e.tipo||'')===tipo)&&(!fav||fav==='Todos'||e.favorito)&&(!q||[e.nombre,e.descripcion,e.objetivo,fs.join(' '),e.material,e.tipo||''].join(' ').toLowerCase().includes(q))});renderizar(d)}
function renderizar(datos){
  $('contenedor-principal').innerHTML=datos.map(e=>{
    const uso=usoEjercicioGlobal(e.id,e.nombre);
    const enSesion=sesionActual.includes(e.id);const seccionActualEj=enSesion?seccionEjercicioSesion(e.id,e):null;const moverA=seccionDestinoSesion&&enSesion&&seccionActualEj!==seccionDestinoSesion;
    const chips=(team)=>uso[team].slice().sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).map(u=>`<span class="usage-chip">${esc(u.fecha)}${u.objetivo?' · '+esc(u.objetivo):''}</span>`).join('')||'<span class="small">Sin usos</span>';
    return `<div class="exercise-row">
      <div class="exercise-row-main"><div class="exercise-row-content"><div class="exercise-name-wrap"><button class="fav-quick ${e.favorito?'is-fav':''}" onclick="toggleFav(${e.id})" title="${e.favorito?'Quitar de favoritos':'Añadir a favoritos'}" aria-label="Favorito">${e.favorito?'★':'☆'}</button><div class="exercise-row-name">${esc(e.nombre)}</div></div>
        <div class="exercise-row-summary">
          <div class="exercise-row-summary-line"><b>Descripción:</b> ${e.descripcion?esc(e.descripcion):'<span class="empty-value">Sin descripción</span>'}</div>
          <div class="exercise-row-summary-line"><b>Función:</b> ${e.objetivo?esc(e.objetivo):'<span class="empty-value">Sin función definida</span>'}</div>
        </div></div>
        <div class="exercise-icon-actions">
          <button class="icon-action" onclick="toggleExerciseStats(${e.id})" title="Estadísticas y uso" aria-label="Estadísticas">📊</button>
          <button class="icon-action" onclick="toggleInfo(${e.id})" title="Información del ejercicio" aria-label="Información">ℹ️</button>
          <button class="icon-action ${enSesion?'active-session':''}" onclick="añadirASesion(${e.id})" title="${moverA?'Mover a '+esc(SECCIONES_ENTRENO[seccionDestinoSesion].titulo):(enSesion?'Quitar del entrenamiento de '+esc(EQUIPOS[equipoActivo].corto):'Añadir al entrenamiento de '+esc(EQUIPOS[equipoActivo].corto))}" aria-label="Añadir, mover o quitar del entrenamiento">${moverA?'↪️':(enSesion?'✓':'➕')}</button>
        </div>
      </div>
      <div id="stats-ex-${e.id}" class="exercise-inline-panel">
        <div class="exercise-stat-grid">
          <div class="exercise-stat-mini"><span class="small">Usos totales</span><b>${uso.totalUsos}</b></div>
          <div class="exercise-stat-mini"><span class="small">Minutos totales</span><b>${uso.totalMinutos}</b></div>
          <div class="exercise-stat-mini"><span class="small">Infantil masc.</span><b>${uso.infantil.length}</b></div>
          <div class="exercise-stat-mini"><span class="small">Cadete masc.</span><b>${uso.cadete.length}</b></div>
        </div>
        <p><b>Infantil Masculino</b></p><div class="exercise-use-list">${chips('infantil')}</div>
        <p style="margin-top:10px"><b>Cadete Masculino</b></p><div class="exercise-use-list">${chips('cadete')}</div>
      </div>
      <div id="detalles-${e.id}" class="exercise-inline-panel">
        <div class="tags" style="margin-bottom:9px">${normalizarFundamentos(e).map(f=>`<span class="tag">${esc(f)}</span>`).join('')}${e.tipo?`<span class="tag">${esc(e.tipo)}</span>`:''}<span class="tag">⏱️ ${e.tiempo||0} min</span><span class="tag">${esc(e.nivel||'Intermedio')}</span><span class="tag">${esc(e.intensidad||'Media')}</span></div>
        <p><b>Función:</b> ${esc(e.objetivo||'-')}</p><p>${esc(e.descripcion)}</p><p><b>Fase:</b> ${esc(e.fase||'Parte principal')} · <b>Material:</b> ${esc(e.material||'-')} · <b>Jugadores:</b> ${esc(e.jugadores||'-')}</p><p><b>Variantes:</b> ${esc(e.variantes||'-')}</p><p><b>Errores/correcciones:</b> ${esc(e.errores||'-')}</p>${e.video?`<p><a href="${esc(e.video)}" target="_blank" rel="noopener">🎥 Ver vídeo</a></p>`:''}
        <div class="actions"><button class="ghost" onclick="toggleFav(${e.id})">${e.favorito?'★ Quitar favorito':'☆ Favorito'}</button><button class="ghost" onclick='fillForm(${JSON.stringify(e).replace(/'/g,"&#39;")})'>✏️ Editar</button>${e.pizarra?`<button class="ghost" onclick="cargarPizarraEjercicio(${e.id})">Ver pizarra</button>`:''}<button class="ghost" onclick="duplicarEjercicio(${e.id})">📋 Duplicar</button><button class="danger" onclick="eliminarEjercicio(${e.id})">🗑️ Borrar</button></div>
      </div>
    </div>`;
  }).join('')||'<div class="empty">No hay ejercicios con estos filtros.</div>'
}
