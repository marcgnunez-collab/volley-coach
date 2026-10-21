// Catálogo depurado: conserva las escuelas originales y fusiona progresiones redundantes sin perder sus variantes.
const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let baseDeDatos=[];

function codigoEjercicioPropio(e){
  if(e&&e.codigo)return String(e.codigo).trim();
  const m=String(e&&e.nombre||'').match(/^([A-Z]+(?:\d+)?(?:-\d+)?|[A-Z]+\d+-\d+)\s*[·\-:]\s*/);
  return m?m[1]:'';
}
function asegurarEjerciciosPropios183(){
  const existentes=new Set(baseDeDatos.map(codigoEjercicioPropio).filter(Boolean));
  let siguiente=Math.max(1000,...baseDeDatos.map(e=>Number(e.id)||0))+1,agregados=0;
  EJERCICIOS_PROPIOS_183.forEach(src=>{
    if(existentes.has(src.codigo))return;
    const fs=[...new Set(src.fundamentos||[])];
    baseDeDatos.push({
      id:siguiente++,codigo:src.codigo,
      nombre:src.codigo+' · '+src.nombre,
      escuela:'Propia',
      fundamentos:fs,fundamento:fs[0]||'',
      tipo:src.tipo||'',
      objetivo:src.objetivo||'',
      descripcion:src.descripcion||'',
      formato:'',nivel:'Intermedio',intensidad:'Media',jugadores:'',material:'',
      variantes:src.variantes||'',errores:src.errores||'',video:'',favorito:false,usos:0,tiempo:0,fase:'Parte principal',pizarra:null
    });
    existentes.add(src.codigo);agregados++;
  });
  return agregados;
}
function asegurarEjerciciosPropios287Nuevos(){
  const existentes=new Set(baseDeDatos.map(codigoEjercicioPropio).filter(Boolean));
  let siguiente=Math.max(2000,...baseDeDatos.map(e=>Number(e.id)||0))+1,agregados=0;
  EJERCICIOS_PROPIOS_287_NUEVOS.forEach(src=>{
    if(existentes.has(src.codigo))return;
    const fs=[...new Set(src.fundamentos||[])];
    baseDeDatos.push({
      id:siguiente++,codigo:src.codigo,
      nombre:src.codigo+' · '+src.nombre,
      escuela:'Propia',
      fundamentos:fs,fundamento:fs[0]||'',
      tipo:src.tipo||'',
      objetivo:src.objetivo||'',
      descripcion:src.descripcion||'',
      formato:'',nivel:'Intermedio',intensidad:'Media',jugadores:'',material:'',
      variantes:src.variantes||'',errores:src.errores||'',video:'',favorito:false,usos:0,tiempo:0,fase:'Parte principal',pizarra:null
    });
    existentes.add(src.codigo);agregados++;
  });
  return agregados;
}

function aplicarLimpiezaRecepcionV1(){
  let cambios=0;const idMap=new Map();
  const porCodigo=c=>baseDeDatos.find(e=>codigoEjercicioPropio(e)===c);
  LIMPIEZA_RECEPCION_V1.forEach(r=>{
    let keep=r.keepCode?porCodigo(r.keepCode):baseDeDatos.find(e=>Number(e.id)===Number(r.keepId));
    if(!keep)return;
    const targets=baseDeDatos.filter(e=>r.targetCodes.includes(codigoEjercicioPropio(e)));
    targets.forEach(t=>idMap.set(Number(t.id),Number(keep.id)));
    const merged=clonar(keep),todos=[keep,...targets],canon=r.canonical||{};
    merged.usos=todos.reduce((a,e)=>a+(Number(e.usos)||0),0);
    merged.favorito=todos.some(e=>!!e.favorito);
    ['tiempo','formato','nivel','intensidad','jugadores','material','video','fase','pizarra'].forEach(k=>{
      const val=todos.map(e=>e&&e[k]).find(v=>v!==undefined&&v!==null&&String(v)!==''&&!(k==='tiempo'&&Number(v)===0));if(val!==undefined)merged[k]=val;
    });
    ['nombre','objetivo','descripcion','variantes','errores','tipo','escuela','codigo','fundamento','fundamentos'].forEach(k=>{if(canon[k]!==undefined)merged[k]=clonar(canon[k])});
    const idx=baseDeDatos.indexOf(keep);baseDeDatos[idx]=merged;
    if(targets.length){baseDeDatos=baseDeDatos.filter(e=>!targets.includes(e));cambios+=targets.length}
    if(keep.nombre!==merged.nombre||keep.descripcion!==merged.descripcion||keep.objetivo!==merged.objetivo)cambios++;
  });
  const mapId=id=>idMap.get(Number(id))||Number(id);
  const migrarSecciones=obj=>{if(!obj||typeof obj!=='object')return obj;const out={};Object.entries(obj).forEach(([k,v])=>out[String(mapId(k))]=v);return out};
  const migrarEjercicios=arr=>Array.isArray(arr)?arr.map(e=>{if(!e||e.id==null)return e;const n=mapId(e.id);return n!==Number(e.id)?{...e,id:n}:e}):arr;
  const migrarEntreno=h=>{if(!h||typeof h!=='object')return h;if(h.ejercicios)h.ejercicios=migrarEjercicios(h.ejercicios);if(h.seccionesEjercicios)h.seccionesEjercicios=migrarSecciones(h.seccionesEjercicios);return h};
  if(equiposData&&typeof equiposData==='object')Object.keys(equiposData).forEach(team=>{const ed=equiposData[team];if(!ed)return;if(Array.isArray(ed.sesionActual))ed.sesionActual=[...new Set(ed.sesionActual.map(mapId))].filter(id=>baseDeDatos.some(e=>Number(e.id)===Number(id)));if(ed.meta&&ed.meta.seccionesEjercicios)ed.meta.seccionesEjercicios=migrarSecciones(ed.meta.seccionesEjercicios);if(Array.isArray(ed.planificacion))ed.planificacion=ed.planificacion.map(migrarEntreno);if(Array.isArray(ed.historial))ed.historial=ed.historial.map(migrarEntreno)});
  return cambios;
}


function aplicarLimpiezaAtaqueV1(){
  let cambios=0;const idMap=new Map();
  const porCodigo=c=>baseDeDatos.find(e=>codigoEjercicioPropio(e)===c);
  LIMPIEZA_ATAQUE_V1.forEach(r=>{
    let keep=r.keepCode?porCodigo(r.keepCode):baseDeDatos.find(e=>Number(e.id)===Number(r.keepId));
    if(!keep)return;
    const tc=new Set(r.targetCodes||[]),ti=new Set((r.targetIds||[]).map(Number));
    const targets=baseDeDatos.filter(e=>e!==keep&&(tc.has(codigoEjercicioPropio(e))||ti.has(Number(e.id))));
    targets.forEach(x=>idMap.set(Number(x.id),Number(keep.id)));
    const merged=clonar(keep),todos=[keep,...targets],canon=r.canonical||{};
    merged.usos=todos.reduce((a,e)=>a+(Number(e.usos)||0),0);merged.favorito=todos.some(e=>!!e.favorito);
    ['tiempo','formato','nivel','intensidad','jugadores','material','video','fase','pizarra'].forEach(k=>{const val=todos.map(e=>e&&e[k]).find(v=>v!==undefined&&v!==null&&String(v)!==''&&!(k==='tiempo'&&Number(v)===0));if(val!==undefined)merged[k]=val});
    ['nombre','objetivo','descripcion','variantes','errores','tipo','escuela','codigo','fundamento','fundamentos'].forEach(k=>{if(canon[k]!==undefined)merged[k]=clonar(canon[k])});
    const idx=baseDeDatos.indexOf(keep);baseDeDatos[idx]=merged;if(targets.length){baseDeDatos=baseDeDatos.filter(e=>!targets.includes(e));cambios+=targets.length}
  });
  const mapId=id=>idMap.get(Number(id))||Number(id);
  const migrarSecciones=obj=>{if(!obj||typeof obj!=='object')return obj;const out={};Object.entries(obj).forEach(([k,v])=>out[String(mapId(k))]=v);return out};
  const migrarEjercicios=arr=>Array.isArray(arr)?arr.map(e=>{if(!e||e.id==null)return e;const n=mapId(e.id);return n!==Number(e.id)?{...e,id:n}:e}):arr;
  const migrarEntreno=h=>{if(!h||typeof h!=='object')return h;if(h.ejercicios)h.ejercicios=migrarEjercicios(h.ejercicios);if(h.seccionesEjercicios)h.seccionesEjercicios=migrarSecciones(h.seccionesEjercicios);return h};
  if(equiposData&&typeof equiposData==='object')Object.keys(equiposData).forEach(team=>{const ed=equiposData[team];if(!ed)return;if(Array.isArray(ed.sesionActual))ed.sesionActual=[...new Set(ed.sesionActual.map(mapId))].filter(id=>baseDeDatos.some(e=>Number(e.id)===Number(id)));if(ed.meta&&ed.meta.seccionesEjercicios)ed.meta.seccionesEjercicios=migrarSecciones(ed.meta.seccionesEjercicios);if(Array.isArray(ed.planificacion))ed.planificacion=ed.planificacion.map(migrarEntreno);if(Array.isArray(ed.historial))ed.historial=ed.historial.map(migrarEntreno)});
  return cambios;
}

function aplicarLimpiezaDefensaBloqueoV1(){
  let cambios=0;const idMap=new Map();const porCodigo=c=>baseDeDatos.find(e=>codigoEjercicioPropio(e)===c);
  LIMPIEZA_DEFENSA_BLOQUEO_V1.forEach(r=>{let keep=r.keepCode?porCodigo(r.keepCode):baseDeDatos.find(e=>Number(e.id)===Number(r.keepId));if(!keep)return;const tc=new Set(r.targetCodes||[]),ti=new Set((r.targetIds||[]).map(Number));const targets=baseDeDatos.filter(e=>e!==keep&&(tc.has(codigoEjercicioPropio(e))||ti.has(Number(e.id))));targets.forEach(x=>idMap.set(Number(x.id),Number(keep.id)));const merged=clonar(keep),todos=[keep,...targets],canon=r.canonical||{};merged.usos=todos.reduce((a,e)=>a+(Number(e.usos)||0),0);merged.favorito=todos.some(e=>!!e.favorito);['tiempo','formato','nivel','intensidad','jugadores','material','video','fase','pizarra'].forEach(k=>{const val=todos.map(e=>e&&e[k]).find(v=>v!==undefined&&v!==null&&String(v)!==''&&!(k==='tiempo'&&Number(v)===0));if(val!==undefined)merged[k]=val});['nombre','objetivo','descripcion','variantes','errores','tipo','escuela','codigo','fundamento','fundamentos'].forEach(k=>{if(canon[k]!==undefined)merged[k]=clonar(canon[k])});const idx=baseDeDatos.indexOf(keep);baseDeDatos[idx]=merged;if(targets.length){baseDeDatos=baseDeDatos.filter(e=>!targets.includes(e));cambios+=targets.length}});
  const mapId=id=>idMap.get(Number(id))||Number(id);const migrarSecciones=obj=>{if(!obj||typeof obj!=='object')return obj;const out={};Object.entries(obj).forEach(([k,v])=>out[String(mapId(k))]=v);return out};const migrarEjercicios=arr=>Array.isArray(arr)?arr.map(e=>{if(!e||e.id==null)return e;const n=mapId(e.id);return n!==Number(e.id)?{...e,id:n}:e}):arr;const migrarEntreno=h=>{if(!h||typeof h!=='object')return h;if(h.ejercicios)h.ejercicios=migrarEjercicios(h.ejercicios);if(h.seccionesEjercicios)h.seccionesEjercicios=migrarSecciones(h.seccionesEjercicios);return h};if(equiposData&&typeof equiposData==='object')Object.keys(equiposData).forEach(team=>{const ed=equiposData[team];if(!ed)return;if(Array.isArray(ed.sesionActual))ed.sesionActual=[...new Set(ed.sesionActual.map(mapId))].filter(id=>baseDeDatos.some(e=>Number(e.id)===Number(id)));if(ed.meta&&ed.meta.seccionesEjercicios)ed.meta.seccionesEjercicios=migrarSecciones(ed.meta.seccionesEjercicios);if(Array.isArray(ed.planificacion))ed.planificacion=ed.planificacion.map(migrarEntreno);if(Array.isArray(ed.historial))ed.historial=ed.historial.map(migrarEntreno)});return cambios;
}

function aplicarLimpiezaColocacionV1(){
  let cambios=0;const idMap=new Map();
  const porCodigo=c=>baseDeDatos.find(e=>codigoEjercicioPropio(e)===c);
  LIMPIEZA_COLOCACION_V1.forEach(r=>{
    let keep=r.keepCode?porCodigo(r.keepCode):baseDeDatos.find(e=>Number(e.id)===Number(r.keepId));
    if(!keep)return;
    const targetCodeSet=new Set(r.targetCodes||[]),targetIdSet=new Set((r.targetIds||[]).map(Number));
    const targets=baseDeDatos.filter(e=>e!==keep&&(targetCodeSet.has(codigoEjercicioPropio(e))||targetIdSet.has(Number(e.id))));
    targets.forEach(x=>idMap.set(Number(x.id),Number(keep.id)));
    const merged=clonar(keep),todos=[keep,...targets],canon=r.canonical||{};
    merged.usos=todos.reduce((a,e)=>a+(Number(e.usos)||0),0);
    merged.favorito=todos.some(e=>!!e.favorito);
    ['tiempo','formato','nivel','intensidad','jugadores','material','video','fase','pizarra'].forEach(k=>{
      const val=todos.map(e=>e&&e[k]).find(v=>v!==undefined&&v!==null&&String(v)!==''&&!(k==='tiempo'&&Number(v)===0));
      if(val!==undefined)merged[k]=val;
    });
    ['nombre','objetivo','descripcion','variantes','errores','tipo','escuela','codigo','fundamento','fundamentos'].forEach(k=>{if(canon[k]!==undefined)merged[k]=clonar(canon[k])});
    const idx=baseDeDatos.indexOf(keep);baseDeDatos[idx]=merged;
    if(targets.length){baseDeDatos=baseDeDatos.filter(e=>!targets.includes(e));cambios+=targets.length}
    if(keep.nombre!==merged.nombre||keep.descripcion!==merged.descripcion||keep.objetivo!==merged.objetivo||keep.variantes!==merged.variantes||keep.errores!==merged.errores)cambios++;
  });
  const mapId=id=>idMap.get(Number(id))||Number(id);
  const migrarSecciones=obj=>{if(!obj||typeof obj!=='object')return obj;const out={};Object.entries(obj).forEach(([k,v])=>out[String(mapId(k))]=v);return out};
  const migrarEjercicios=arr=>Array.isArray(arr)?arr.map(e=>{if(!e||e.id==null)return e;const n=mapId(e.id);return n!==Number(e.id)?{...e,id:n}:e}):arr;
  const migrarEntreno=h=>{if(!h||typeof h!=='object')return h;if(h.ejercicios)h.ejercicios=migrarEjercicios(h.ejercicios);if(h.seccionesEjercicios)h.seccionesEjercicios=migrarSecciones(h.seccionesEjercicios);return h};
  if(equiposData&&typeof equiposData==='object')Object.keys(equiposData).forEach(team=>{
    const ed=equiposData[team];if(!ed)return;
    if(Array.isArray(ed.sesionActual))ed.sesionActual=[...new Set(ed.sesionActual.map(mapId))].filter(id=>baseDeDatos.some(e=>Number(e.id)===Number(id)));
    if(ed.meta&&ed.meta.seccionesEjercicios)ed.meta.seccionesEjercicios=migrarSecciones(ed.meta.seccionesEjercicios);
    if(Array.isArray(ed.planificacion))ed.planificacion=ed.planificacion.map(migrarEntreno);
    if(Array.isArray(ed.historial))ed.historial=ed.historial.map(migrarEntreno);
  });
  return cambios;
}

function normalizarFundamentos(e){
  if(!e)return [];
  if(Array.isArray(e.fundamentos))return [...new Set(e.fundamentos.filter(Boolean))];
  if(Array.isArray(e.fundamento))return [...new Set(e.fundamento.filter(Boolean))];
  if(typeof e.fundamento==='string'&&e.fundamento.trim())return [e.fundamento.trim()];
  return [];
}
function migrarFundamentos(){baseDeDatos.forEach(e=>{let fs=normalizarFundamentos(e);if(e.tipo==='Control'){if(!fs.includes('Control'))fs=['Control',...fs];e.tipo=''}e.fundamentos=[...new Set(fs)];e.fundamento=e.fundamentos[0]||''})}
function fundamentosTexto(e){return normalizarFundamentos(e).join(' + ')||'-'}
function getFundamentosSeleccionados(){return [...document.querySelectorAll('input[name="nuevo-fundamento"]:checked')].map(x=>x.value)}
function setFundamentosSeleccionados(valores){const fs=Array.isArray(valores)?valores:[];document.querySelectorAll('input[name="nuevo-fundamento"]').forEach(x=>x.checked=fs.includes(x.value))}
migrarFundamentos();

const APP_STORAGE_KEY='volleyCoachStateV43';
const LIBRARY_STORAGE_KEY='volleyCoachLibraryV1';
const LIBRARY_DELETED_KEY='volleyCoachLibraryDeletedV1';
const OLD_TEAM_STORAGE_KEY='volleyCoachTeamsV42';
const ACTIVE_TEAM_KEY='volleyCoachActiveTeamV43';
const OLD_ACTIVE_TEAM_KEY='volleyCoachActiveTeamV42';
const EQUIPOS={
  infantil:{nombre:'Infantil Masculino',corto:'Infantil masc.'},
  cadete:{nombre:'Cadete Masculino',corto:'Cadete masc.'}
};
const SECCIONES_ENTRENO={
  activacion:{numero:'01',titulo:'Activación',icono:'',nota:'Movilidad, activación, balón y ritmo de entrada.',filtro:'activacion',tipoDefault:'',faseDefault:'Calentamiento'},
  tecnica:{numero:'02',titulo:'Técnica',icono:'',nota:'Control y trabajo técnico analítico.',filtro:'tecnica',tipoDefault:'Analítico',faseDefault:'Parte principal'},
  especifico:{numero:'03',titulo:'Específico',icono:'',nota:'Trabajo técnico-táctico centrado en el objetivo del día.',filtro:'todos',tipoDefault:'',faseDefault:'Parte principal'},
  aplicado:{numero:'04',titulo:'Juego aplicado',icono:'',nota:'Puesta en juego y situaciones reducidas con intención.',filtro:'aplicado',tipoDefault:'Puesta en juego',faseDefault:'Parte principal'},
  juego:{numero:'05',titulo:'Juego real',icono:'',nota:'Juego global y transferencia al 6x6.',filtro:'juego',tipoDefault:'Juego',faseDefault:'Parte principal'}
};
const ORDEN_SECCIONES_ENTRENO=['activacion','tecnica','especifico','aplicado','juego'];
const MAPA_SECCIONES_LEGACY={controles:'tecnica',analiticos:'tecnica',especificos:'especifico',desarrollo:'aplicado',reducidos:'aplicado',juego:'juego',activacion:'activacion',tecnica:'tecnica',especifico:'especifico',aplicado:'aplicado'};
let seccionDestinoSesion=null;
let crearEjercicioDestinoSesion=null;
function fechaLocalISO(d=new Date()){const x=new Date(d),y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),dia=String(x.getDate()).padStart(2,'0');return `${y}-${m}-${dia}`}
let equipoActivo=localStorage.getItem(ACTIVE_TEAM_KEY)||localStorage.getItem(OLD_ACTIVE_TEAM_KEY)||'infantil';
if(!EQUIPOS[equipoActivo])equipoActivo='infantil';
let sesionActual=[],planificacion=[],historial=[],plantillas=[],jugadoresEquipo=[];
let semanaBase=new Date(); let pizarraParaEjercicio=null;
let meta={fecha:fechaLocalISO(),equipo:EQUIPOS[equipoActivo].nombre,jugadores:'',duracionObjetivo:'',intensidad:'Media',objetivo:'',calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},playerIds:[]};
let equiposData=null;

function clonar(v){return JSON.parse(JSON.stringify(v))}
function estadoEquipoVacio(id){
  return {
    sesionActual:[],
    meta:{fecha:fechaLocalISO(),equipo:EQUIPOS[id].nombre,jugadores:'',duracionObjetivo:'',intensidad:'Media',objetivo:'',calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},playerIds:[]},
    historial:[],
    planificacion:[],
    plantillas:[],
    jugadores:[]
  };
}
function migrarControlHistorial(lista){
  (lista||[]).forEach(h=>(h.ejercicios||[]).forEach(e=>{
    let fs=normalizarFundamentos(e);
    if(e.tipo==='Control'){if(!fs.includes('Control'))fs=['Control',...fs];e.tipo=''}
    e.fundamentos=[...new Set(fs)];e.fundamento=e.fundamentos[0]||'';
  }));
  return lista||[];
}
function limpiarEquipo(raw,id){
  raw=raw&&typeof raw==='object'?raw:{};
  return {
    sesionActual:Array.isArray(raw.sesionActual)?clonar(raw.sesionActual):[],
    meta:{...estadoEquipoVacio(id).meta,...clonar(raw.meta||{}),seccionesEjercicios:{...(raw.meta&&raw.meta.seccionesEjercicios&&typeof raw.meta.seccionesEjercicios==='object'?clonar(raw.meta.seccionesEjercicios):{})},notasBloques:{...(raw.meta&&raw.meta.notasBloques&&typeof raw.meta.notasBloques==='object'?clonar(raw.meta.notasBloques):{})},equipo:EQUIPOS[id].nombre},
    historial:migrarControlHistorial(Array.isArray(raw.historial)?clonar(raw.historial):[]),
    planificacion:Array.isArray(raw.planificacion)?clonar(raw.planificacion):[],
    plantillas:Array.isArray(raw.plantillas)?clonar(raw.plantillas):[],
    jugadores:Array.isArray(raw.jugadores)?clonar(raw.jugadores):[]
  };
}
function fusionarBibliotecas(...listas){
  // Fusiona sin mezclar escuelas. El estado más reciente (listas posteriores) prevalece.
  // Prioridad para identificar el mismo ejercicio: id -> escuela+código -> escuela+nombre+descripción.
  const salida=[],posPorClave=new Map(),idsUsados=new Map();
  const claveEjercicio=e=>{
    const escuela=String(e.escuela||'').trim().toLowerCase();
    const codigo=codigoEjercicioPropio(e);
    if(codigo)return 'cod|'+escuela+'|'+codigo.toLowerCase();
    const nombre=String(e.nombre||'').trim().toLowerCase();
    const desc=String(e.descripcion||'').trim().toLowerCase();
    return 'txt|'+escuela+'|'+nombre+'|'+desc;
  };
  listas.flat().filter(Boolean).forEach(origen=>{
    if(!origen||typeof origen!=='object')return;
    let e=clonar(origen);const fs=normalizarFundamentos(e);e.fundamentos=fs;e.fundamento=fs[0]||'';
    const idOriginal=Number(e.id)||0;
    const claveId=idOriginal?'id|'+idOriginal:null;
    const clave=claveEjercicio(e);
    let pos=null;
    if(claveId&&posPorClave.has(claveId))pos=posPorClave.get(claveId);
    else if(clave&&posPorClave.has(clave))pos=posPorClave.get(clave);
    if(pos!==null){
      const anterior=salida[pos];
      // Mantener el id estable si el reemplazo no lo trae.
      if(!idOriginal)e.id=anterior.id;
      salida[pos]=e;
      if(claveId)posPorClave.set(claveId,pos);
      if(clave)posPorClave.set(clave,pos);
      return;
    }
    let id=idOriginal||Date.now()+salida.length;
    if(idsUsados.has(id)){
      // Mismo id pero ejercicio distinto: generar uno nuevo sin perder ninguno.
      do{id=Date.now()+salida.length+Math.floor(Math.random()*100000)}while(idsUsados.has(id));
    }
    e.id=id;
    const nuevaPos=salida.length;
    salida.push(e);idsUsados.set(id,nuevaPos);
    posPorClave.set('id|'+id,nuevaPos);
    if(clave)posPorClave.set(clave,nuevaPos);
  });
  return salida.length?salida:clonar(defaults);
}
function convertirEstadoPersistido(d){
  if(!d)return null;
  if(Array.isArray(d)){
    return {bibliotecaCompartida:fusionarBibliotecas(d),equiposData:{infantil:estadoEquipoVacio('infantil'),cadete:estadoEquipoVacio('cadete')}};
  }
  if((Array.isArray(d.bibliotecaCompartida)||Array.isArray(d.bibliotecaIndependiente))&&d.equiposData){
    return {bibliotecaCompartida:fusionarBibliotecas(d.bibliotecaCompartida||[],d.bibliotecaIndependiente||[]),equiposData:{infantil:limpiarEquipo(d.equiposData.infantil,'infantil'),cadete:limpiarEquipo(d.equiposData.cadete,'cadete')}};
  }
  if(d.equiposData&&typeof d.equiposData==='object'){
    const ei=d.equiposData.infantil||{},ec=d.equiposData.cadete||{};
    return {bibliotecaCompartida:fusionarBibliotecas(ei.baseDeDatos||[],ec.baseDeDatos||[],d.baseDeDatos||[]),equiposData:{infantil:limpiarEquipo(ei,'infantil'),cadete:limpiarEquipo(ec,'cadete')}};
  }
  if(Array.isArray(d.baseDeDatos)){
    const legado={sesionActual:Array.isArray(d.sesionActual)?d.sesionActual:[],meta:d.meta||{},historial:Array.isArray(d.historial)?d.historial:[],planificacion:Array.isArray(d.planificacion)?d.planificacion:[]};
    return {bibliotecaCompartida:fusionarBibliotecas(d.baseDeDatos),equiposData:{infantil:limpiarEquipo(legado,'infantil'),cadete:limpiarEquipo(legado,'cadete')}};
  }
  return null;
}
function migrarLocalAnterior(){
  let viejo=null;
  try{viejo=JSON.parse(localStorage.getItem(OLD_TEAM_STORAGE_KEY))}catch(_){viejo=null}
  if(viejo){
    const convertido=convertirEstadoPersistido({equiposData:viejo});
    if(convertido)return convertido;
  }
  let legacyDB=null,legacySesion=[],legacyPlan=[],legacyMeta={},legacyHist=[];
  try{legacyDB=JSON.parse(localStorage.getItem('misEjerciciosVoleiV2'))}catch(_){}
  try{legacySesion=JSON.parse(localStorage.getItem('sesionActualVoleiV2'))||[]}catch(_){}
  try{legacyPlan=JSON.parse(localStorage.getItem('planificacionVoleiV3'))||[]}catch(_){}
  try{legacyMeta=JSON.parse(localStorage.getItem('sesionMetaVoleiV2'))||{}}catch(_){}
  try{legacyHist=JSON.parse(localStorage.getItem('historialVoleiV2'))||[]}catch(_){}
  const equipoLegacy={sesionActual:legacySesion,meta:legacyMeta,historial:legacyHist,planificacion:legacyPlan};
  return {bibliotecaCompartida:fusionarBibliotecas(legacyDB||defaults),equiposData:{infantil:limpiarEquipo(equipoLegacy,'infantil'),cadete:limpiarEquipo(equipoLegacy,'cadete')}};
}
function claveBibliotecaPersistente(e){
  if(!e||typeof e!=='object')return '';
  if(e.bibliotecaUid)return 'uid|'+String(e.bibliotecaUid);
  const codigo=codigoEjercicioPropio(e),escuela=String(e.escuela||'').trim().toLowerCase();
  if(codigo)return 'cod|'+escuela+'|'+String(codigo).trim().toLowerCase();
  if(e.id!==undefined&&e.id!==null&&String(e.id)!=='')return 'id|'+String(e.id);
  return 'txt|'+escuela+'|'+String(e.nombre||'').trim().toLowerCase()+'|'+String(e.descripcion||'').trim().toLowerCase();
}
function cargarBibliotecaIndependiente(){
  try{
    const raw=JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)||'null');
    if(Array.isArray(raw))return raw;
    if(raw&&Array.isArray(raw.ejercicios))return raw.ejercicios;
  }catch(_){ }
  return [];
}
function cargarBorradosBiblioteca(){
  try{const x=JSON.parse(localStorage.getItem(LIBRARY_DELETED_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}
}
function guardarBorradosBiblioteca(lista){
  try{localStorage.setItem(LIBRARY_DELETED_KEY,JSON.stringify([...(new Set(lista||[]))]))}catch(_){ }
}
function guardarBibliotecaIndependiente(){
  try{
    localStorage.setItem(LIBRARY_STORAGE_KEY,JSON.stringify({version:1,updatedAt:new Date().toISOString(),total:baseDeDatos.length,ejercicios:clonar(baseDeDatos)}));
  }catch(err){console.warn('No se pudo guardar la biblioteca independiente',err)}
}
function aplicarBorradosBiblioteca(lista){
  const borrados=new Set(cargarBorradosBiblioteca());
  return (lista||[]).filter(e=>!borrados.has(claveBibliotecaPersistente(e)));
}
function actualizarEstadoBibliotecaUI(){
  const box=$('library-storage-state'),txt=$('library-storage-text');if(!box||!txt)return;
  if(cloudUser){box.classList.add('online');txt.textContent='Supabase principal · copia local activa'}
  else{box.classList.remove('online');txt.textContent='Copia local independiente activa'}
}
function marcarBorradoBiblioteca(e){
  const k=claveBibliotecaPersistente(e);if(!k)return;
  const lista=cargarBorradosBiblioteca();if(!lista.includes(k)){lista.push(k);guardarBorradosBiblioteca(lista)}
}
function desmarcarBorradoBiblioteca(e){
  const k=claveBibliotecaPersistente(e);if(!k)return;
  const lista=cargarBorradosBiblioteca().filter(x=>x!==k);guardarBorradosBiblioteca(lista);
}
function exportarBiblioteca(){
  const payload={schema:'volley-coach-library',version:1,exportedAt:new Date().toISOString(),total:baseDeDatos.length,ejercicios:clonar(baseDeDatos)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`Volley_Coach_Biblioteca_${fechaLocalISO()}_${baseDeDatos.length}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importarBibliotecaDesdeArchivo(file){
  if(!file)return;const r=new FileReader();r.onload=()=>{try{
    const d=JSON.parse(r.result),lista=Array.isArray(d)?d:(Array.isArray(d.ejercicios)?d.ejercicios:(Array.isArray(d.bibliotecaCompartida)?d.bibliotecaCompartida:null));
    if(!lista)throw new Error('Formato no válido');
    lista.forEach(desmarcarBorradoBiblioteca);
    baseDeDatos=aplicarBorradosBiblioteca(fusionarBibliotecas(defaults,cargarBibliotecaIndependiente(),baseDeDatos,lista));
    migrarFundamentos();asegurarEjerciciosPropios183();asegurarEjerciciosPropios287Nuevos();baseDeDatos=aplicarBorradosBiblioteca(baseDeDatos);
    guardarBibliotecaIndependiente();save();filtrarEjercicios();renderConteoBiblioteca();renderDashboard();renderStats();
    alert(`Biblioteca importada. Total actual: ${baseDeDatos.length} ejercicios.`);
  }catch(err){console.error(err);alert('No se pudo importar la biblioteca. Usa un JSON exportado desde Volley Coach.')}};r.readAsText(file);
}
function bibliotecasLocalesRescatables(){
  // Recupera bibliotecas de todas las generaciones conocidas del proyecto.
  // Sirve para que una sincronización o una actualización nunca reduzca la biblioteca
  // si todavía existe una copia más completa en este dispositivo.
  const listas=[];
  const agregar=v=>{if(Array.isArray(v)&&v.length)listas.push(v)};
  agregar(cargarBibliotecaIndependiente());
  try{
    const actual=JSON.parse(localStorage.getItem(APP_STORAGE_KEY));
    if(actual){
      agregar(actual.bibliotecaCompartida);agregar(actual.baseDeDatos);
      if(actual.equiposData){agregar(actual.equiposData.infantil?.baseDeDatos);agregar(actual.equiposData.cadete?.baseDeDatos)}
    }
  }catch(_){}
  try{
    const viejo=JSON.parse(localStorage.getItem(OLD_TEAM_STORAGE_KEY));
    if(viejo){
      agregar(viejo.bibliotecaCompartida);agregar(viejo.baseDeDatos);
      if(viejo.equiposData){agregar(viejo.equiposData.infantil?.baseDeDatos);agregar(viejo.equiposData.cadete?.baseDeDatos)}
      agregar(viejo.infantil?.baseDeDatos);agregar(viejo.cadete?.baseDeDatos);
    }
  }catch(_){}
  try{agregar(JSON.parse(localStorage.getItem('misEjerciciosVoleiV2')))}catch(_){}
  return listas;
}
function bibliotecaFusionadaSegura(...extras){
  return aplicarBorradosBiblioteca(fusionarBibliotecas(defaults,...bibliotecasLocalesRescatables(),...extras.filter(Array.isArray)));
}
function cargarEstadoLocal(){
  let estado=null;
  try{estado=convertirEstadoPersistido(JSON.parse(localStorage.getItem(APP_STORAGE_KEY)))}catch(_){estado=null}
  if(!estado)estado=migrarLocalAnterior();
  baseDeDatos=bibliotecaFusionadaSegura(estado.bibliotecaCompartida||[],baseDeDatos||[]);migrarFundamentos();asegurarEjerciciosPropios183();asegurarEjerciciosPropios287Nuevos();
  equiposData=estado.equiposData||{infantil:estadoEquipoVacio('infantil'),cadete:estadoEquipoVacio('cadete')};
  ['infantil','cadete'].forEach(id=>equiposData[id]=limpiarEquipo(equiposData[id],id));
  aplicarLimpiezaRecepcionV1();
  aplicarLimpiezaColocacionV1();
  aplicarLimpiezaAtaqueV1();aplicarLimpiezaDefensaBloqueoV1();
  baseDeDatos=aplicarBorradosBiblioteca(baseDeDatos);
  archivarPlanificacionesPasadasEnEquiposData();
  guardarEstadoLocalSinCloud();
}
function guardarEstadoLocalSinCloud(){
  localStorage.setItem(APP_STORAGE_KEY,JSON.stringify({version:5.8,bibliotecaCompartida:clonar(baseDeDatos),bibliotecaVersion:1,bibliotecaUpdatedAt:new Date().toISOString(),equiposData:clonar(equiposData)}));
  guardarBibliotecaIndependiente();
  localStorage.setItem(ACTIVE_TEAM_KEY,equipoActivo);
}
function guardarEquipoEnMemoria(){
  if(!equiposData)equiposData={};
  equiposData[equipoActivo]={
    sesionActual:clonar(sesionActual),
    meta:clonar({...meta,equipo:EQUIPOS[equipoActivo].nombre}),
    historial:clonar(historial),
    planificacion:clonar(planificacion),
    plantillas:clonar(plantillas),
    jugadores:clonar(jugadoresEquipo)
  };
}
function cargarEquipoEnVariables(id){
  const s=limpiarEquipo(equiposData[id],id);
  equiposData[id]=s;
  sesionActual=clonar(s.sesionActual||[]);
  meta=clonar(s.meta||estadoEquipoVacio(id).meta);meta.equipo=EQUIPOS[id].nombre;meta.seccionesEjercicios=normalizarMapaSecciones(meta.seccionesEjercicios||{});meta.notasBloques=normalizarNotasEntreno(meta.notasBloques||{},meta.calentamiento||'');meta.calentamiento=meta.notasBloques.activacion||meta.calentamiento||'';
  historial=clonar(s.historial||[]);historial.forEach(h=>{h.notasBloques=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');h.calentamiento=h.notasBloques.activacion||h.calentamiento||'';(h.ejercicios||[]).forEach(e=>e.seccionSesion=normalizarSeccionEntreno(e.seccionSesion,e));});
  planificacion=clonar(s.planificacion||[]);planificacion.forEach(p=>{p.seccionesEjercicios=normalizarMapaSecciones(p.seccionesEjercicios||{});p.notasBloques=normalizarNotasEntreno(p.notasBloques||{},p.calentamiento||'');p.calentamiento=p.notasBloques.activacion||p.calentamiento||'';(p.ejercicios||[]).forEach(e=>e.seccionSesion=normalizarSeccionEntreno(e.seccionSesion,e));});
  plantillas=clonar(s.plantillas||[]);
  jugadoresEquipo=clonar(s.jugadores||[]);
  if(typeof sincronizarPlanesConHistorial==='function'&&sincronizarPlanesConHistorial()>0){
    equiposData[id]={...s,sesionActual:clonar(sesionActual),meta:clonar(meta),historial:clonar(historial),planificacion:clonar(planificacion),plantillas:clonar(plantillas),jugadores:clonar(jugadoresEquipo)};
    guardarEstadoLocalSinCloud();
  }
}
function actualizarSelectorEquipo(){
  const info=EQUIPOS[equipoActivo];
  if($('team-active-name'))$('team-active-name').textContent=info.nombre;
  Object.keys(EQUIPOS).forEach(id=>{const b=$('team-btn-'+id);if(b)b.classList.toggle('active',id===equipoActivo)});
  if($('sesion-equipo'))$('sesion-equipo').value=info.nombre;
  if($('plan-equipo'))$('plan-equipo').value=info.nombre;
}
function cambiarEquipo(id){
  if(!EQUIPOS[id]||id===equipoActivo)return;
  seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;
  guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();
  equipoActivo=id;localStorage.setItem(ACTIVE_TEAM_KEY,id);
  cargarEquipoEnVariables(id);
  actualizarSelectorEquipo();cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderHistorial();renderStats();renderDashboard();if(typeof renderPlayers==='function')renderPlayers();if(typeof renderDashboardPlayers==='function')renderDashboardPlayers();if(typeof renderSessionRoster==='function')renderSessionRoster();
  $('save-indicator').textContent='✓ '+EQUIPOS[id].nombre+' cargado · biblioteca compartida';
}

function fechaHumanaDashboard(iso){if(!iso)return {dia:'—',mes:''};const d=new Date(iso+'T12:00:00');return {dia:String(d.getDate()).padStart(2,'0'),mes:d.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()}}
function minutosListaEjercicios(lista){return (lista||[]).reduce((a,e)=>a+(Number(e.tiempo)||0),0)}
function fundamentosConMinutos(lista){const c={};(lista||[]).forEach(e=>{const fs=normalizarFundamentos(e);if(!fs.length)return;const m=(Number(e.tiempo)||0)/fs.length;fs.forEach(f=>c[f]=(c[f]||0)+m)});return c}
function renderFocusRows(conteo,vacio='Sin trabajo registrado todavía.'){const vals=Object.entries(conteo||{}).sort((a,b)=>b[1]-a[1]);if(!vals.length)return `<div class="dashboard-empty">${esc(vacio)}</div>`;const max=Math.max(...vals.map(x=>x[1]),1);return vals.slice(0,5).map(([f,m])=>`<div class="dashboard-focus-row"><span>${esc(f)}</span><div class="dashboard-focus-track"><span style="width:${Math.max(5,m/max*100)}%"></span></div><b>${Math.round(m)}m</b></div>`).join('')}
function abrirSesionDesdeDashboard(){showView('entrenamiento',botonVista('entrenamiento'))}
function abrirSiguientePlanDashboard(id){usarPlan(id)}
function renderFocoSesion(grupos,total){const lista=[];Object.values(grupos||{}).forEach(arr=>(arr||[]).forEach(e=>lista.push(e)));const c=fundamentosConMinutos(lista),vals=Object.entries(c).sort((a,b)=>b[1]-a[1]);const bar=$('session-focus-bar'),leg=$('session-focus-legend'),copy=$('session-focus-copy');if(!bar||!leg)return;if(!vals.length){bar.innerHTML='';leg.innerHTML='';if(copy)copy.textContent='Añade ejercicios para ver el reparto';return}const sum=vals.reduce((a,x)=>a+x[1],0)||1;bar.innerHTML=vals.slice(0,6).map(([f,m],i)=>`<span class="session-focus-seg" title="${esc(f)} ${Math.round(m/sum*100)}%" style="width:${m/sum*100}%"></span>`).join('');leg.innerHTML=vals.slice(0,5).map(([f,m])=>`<span>${esc(f)} ${Math.round(m/sum*100)}%</span>`).join('');if(copy)copy.textContent=`${vals.length} fundamentos · ${total} min de sesión`}
function renderDashboard(){
  if(!$('dashboard'))return;
  guardarEquipoEnMemoria();
  const hoy=fechaLocalISO(),info=EQUIPOS[equipoActivo];
  if($('dashboard-title'))$('dashboard-title').textContent=info.nombre;
  if($('dashboard-subtitle'))$('dashboard-subtitle').textContent=`Control de la semana · ${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}`;
  if($('dash-library'))$('dash-library').textContent=baseDeDatos.length;
  const vivos=sesionActual.map(id=>baseDeDatos.find(e=>e.id===id)).filter(Boolean),minsActual=minutosListaEjercicios(vivos);
  if($('dash-current-count'))$('dash-current-count').textContent=sesionActual.length;
  if($('dash-current-time'))$('dash-current-time').textContent=`${minsActual} min preparados`;
  if($('dash-history-count'))$('dash-history-count').textContent=historial.length;
  const lunes=lunesDeSemana(new Date()),domingo=new Date(lunes);domingo.setDate(lunes.getDate()+6);const ini=isoDate(lunes),fin=isoDate(domingo),planesSemana=planificacion.filter(p=>p.fecha>=ini&&p.fecha<=fin),minSemana=planesSemana.reduce((a,p)=>a+(Number(p.duracion)||minutosListaEjercicios(p.ejercicios||[])),0);
  if($('dash-week-count'))$('dash-week-count').textContent=planesSemana.length;
  if($('dash-week-time'))$('dash-week-time').textContent=`${minSemana} min planificados`;
  const prox=[...planificacion].filter(p=>!p.realizado&&p.fecha>=hoy).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)))[0];
  if($('dash-next-plan'))$('dash-next-plan').innerHTML=prox?(()=>{const f=fechaHumanaDashboard(prox.fecha),n=(prox.ejercicios||[]).length,m=Number(prox.duracion)||minutosListaEjercicios(prox.ejercicios||[]);return `<div class="dashboard-plan-card"><div class="dashboard-plan-date"><b>${f.dia}</b><span>${f.mes}</span></div><div class="dashboard-plan-copy"><strong>${esc(prox.objetivo||'Entrenamiento planificado')}</strong><p>${esc(prox.equipo||info.nombre)}</p><div class="dashboard-mini-meta"><span>${n} ejercicios</span><span>${m} min</span><span>${esc(prox.intensidad||'Media')}</span></div></div><button class="primary" onclick="abrirSiguientePlanDashboard(${prox.id})">Abrir</button></div>`})():`<div class="dashboard-empty">No hay próximos entrenamientos en la planificación. <button class="text-btn" onclick="showView('planificacion',botonVista('planificacion'))">Planificar uno →</button></div>`;
  const objetivo=Number(meta.duracionObjetivo)||0,pct=objetivo?Math.min(100,Math.round(minsActual/objetivo*100)):0;
  if($('dash-current-session'))$('dash-current-session').innerHTML=sesionActual.length?`<div class="dashboard-current-line"><div><b>${sesionActual.length} ejercicios</b><div class="small">${esc(meta.objetivo||'Sin objetivo principal definido')}</div></div><div><b>${minsActual} min</b><div class="small" style="text-align:right">${objetivo?`de ${objetivo} min`:'sin objetivo temporal'}</div></div></div><div class="dashboard-progress"><span style="width:${objetivo?pct:Math.min(100,Math.max(8,minsActual))}%"></span></div><div style="margin-top:9px">${renderFocusRows(fundamentosConMinutos(vivos),'Añade ejercicios para ver el reparto.')}</div>`:`<div class="dashboard-empty">No hay una sesión preparada. Crea una nueva sesión o abre una planificación existente.</div>`;
  const ult=[...historial].sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
  if($('dash-last-session'))$('dash-last-session').innerHTML=ult?`<div class="dashboard-plan-copy"><strong>${esc(ult.objetivo||'Entrenamiento')}</strong><p>${esc(ult.fecha||'')} · ${Number(ult.duracion)||0} min · ${(ult.ejercicios||[]).length} ejercicios</p><div class="dashboard-mini-meta">${fundamentosSesion(ult).slice(0,5).map(f=>`<span>${esc(f)}</span>`).join('')}</div></div>`:`<div class="dashboard-empty">Aún no hay entrenamientos guardados en este equipo.</div>`;
  const listaSem=[];planesSemana.forEach(p=>(p.ejercicios||[]).forEach(e=>listaSem.push(enriquecerEjercicioGuardado(e))));if(!listaSem.length){historial.filter(h=>h.fecha>=ini&&h.fecha<=fin).forEach(h=>(h.ejercicios||[]).forEach(e=>listaSem.push(enriquecerEjercicioGuardado(e))))}
  if($('dash-week-focus'))$('dash-week-focus').innerHTML=renderFocusRows(fundamentosConMinutos(listaSem),'Todavía no hay ejercicios planificados esta semana.');
}

cargarEstadoLocal();
cargarEquipoEnVariables(equipoActivo);

function sincronizarSesionConPlanVinculado(){
  const id=Number(meta&&meta.planificacionId);if(!id||!Array.isArray(planificacion))return false;
  const pos=planificacion.findIndex(p=>Number(p.id)===id);if(pos<0||planificacion[pos].realizado)return false;
  const previo=planificacion[pos],snap=construirPlanSesion(id);
  planificacion[pos]={...previo,...snap,id,realizado:false,historialId:previo.historialId||null,creadoDesdePlanificacion:previo.creadoDesdePlanificacion!==false,actualizadoEnSesion:Date.now()};
  return true;
}
function save(){meta.equipo=EQUIPOS[equipoActivo].nombre;const vinculado=sincronizarSesionConPlanVinculado();guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();$('save-indicator').textContent=vinculado?'✓ Guardado automáticamente en Planificación':'✓ Guardado · '+EQUIPOS[equipoActivo].corto+' · biblioteca compartida';programarSubidaCloud();}
function showView(id,btn){if(id!=='ejercicios'){seccionDestinoSesion=null;crearEjercicioDestinoSesion=null}document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));if($(id))$(id).classList.add('active');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');if(id==='dashboard'){renderDashboard();if(typeof renderDashboardPlayers==='function')renderDashboardPlayers()}if(id==='entrenamiento'){renderizarSesion();if(typeof renderSessionRoster==='function')renderSessionRoster()}if(id==='ejercicios')renderDestinoBiblioteca();if(id==='planificacion')renderPlanificacion();if(id==='jugadores'&&typeof renderPlayers==='function')renderPlayers();if(id==='historial')renderHistorial();if(id==='estadisticas')renderStats();window.scrollTo({top:0,behavior:'smooth'});}
function botonVista(id){const mapa={dashboard:0,entrenamiento:1,planificacion:2,ejercicios:3,jugadores:4,historial:5,estadisticas:6};return document.querySelectorAll('.tab-btn')[mapa[id]]||null}
function abrirBibliotecaNormal(btn){renderConteoBiblioteca();const estabaCreando=!!crearEjercicioDestinoSesion;seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;if(estabaCreando)cancelarEdicion();showView('ejercicios',btn);renderDestinoBiblioteca()}
function normalizarSeccionEntreno(slug,e){
  const limpio=MAPA_SECCIONES_LEGACY[String(slug||'')]||'';
  if(limpio&&SECCIONES_ENTRENO[limpio])return limpio;
  return seccionNaturalEjercicio(e||{});
}
function seccionNaturalEjercicio(e){
  const fs=normalizarFundamentos(e),t=(e&&e.tipo)||'',fase=String((e&&e.fase)||'');
  if(fase==='Calentamiento')return 'activacion';
  if(t==='Analítico'||fs.includes('Control'))return 'tecnica';
  if(t==='Puesta en juego'||t==='Juego reducido')return 'aplicado';
  if(t==='Juego')return 'juego';
  return 'especifico';
}
function normalizarMapaSecciones(mapa){const out={};Object.entries(mapa&&typeof mapa==='object'?mapa:{}).forEach(([id,slug])=>out[id]=normalizarSeccionEntreno(slug));return out}
function combinarNotasEntreno(...partes){return partes.map(x=>String(x||'').trim()).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join('\n')}
function normalizarNotasEntreno(notas,calentamiento=''){
  notas=notas&&typeof notas==='object'?notas:{};
  return {
    activacion:combinarNotasEntreno(notas.activacion,calentamiento),
    tecnica:combinarNotasEntreno(notas.tecnica,notas.controles,notas.analiticos),
    especifico:combinarNotasEntreno(notas.especifico,notas.especificos),
    aplicado:combinarNotasEntreno(notas.aplicado,notas.desarrollo,notas.reducidos),
    juego:combinarNotasEntreno(notas.juego)
  };
}
function mapaSeccionesSesion(){if(!meta.seccionesEjercicios||typeof meta.seccionesEjercicios!=='object')meta.seccionesEjercicios={};meta.seccionesEjercicios=normalizarMapaSecciones(meta.seccionesEjercicios);return meta.seccionesEjercicios}
function mapaNotasBloques(){meta.notasBloques=normalizarNotasEntreno(meta.notasBloques,meta.calentamiento||'');return meta.notasBloques}
function guardarNotaBloque(slug,valor){slug=normalizarSeccionEntreno(slug);if(!SECCIONES_ENTRENO[slug])return;mapaNotasBloques()[slug]=valor;if(slug==='activacion')meta.calentamiento=valor;save()}
function seccionEjercicioSesion(id,e){return normalizarSeccionEntreno(mapaSeccionesSesion()[String(id)],e)}
function coincideFiltroSeccionDestino(e){
  if(!seccionDestinoSesion)return true;const slug=normalizarSeccionEntreno(seccionDestinoSesion,e),t=(e&&e.tipo)||'',fs=normalizarFundamentos(e),fase=String((e&&e.fase)||'');
  if(slug==='activacion')return fase==='Calentamiento'||fs.includes('Control');
  if(slug==='tecnica')return t==='Analítico'||fs.includes('Control');
  if(slug==='aplicado')return t==='Puesta en juego'||t==='Juego reducido';
  if(slug==='juego')return t==='Juego';
  return true;
}
function renderDestinoBiblioteca(){const box=$('session-section-target');if(!box)return;if(!seccionDestinoSesion||!SECCIONES_ENTRENO[seccionDestinoSesion]){box.classList.add('hidden');return}const cfg=SECCIONES_ENTRENO[seccionDestinoSesion];$('session-section-target-name').textContent=cfg.numero+' · '+cfg.icono+' '+cfg.titulo;if(crearEjercicioDestinoSesion===seccionDestinoSesion){$('session-section-target-note').textContent='Crea el ejercicio. Al guardarlo se añadirá directamente a esta fase.'}else{$('session-section-target-note').textContent=seccionDestinoSesion==='especifico'?'Puedes elegir libremente cualquier ejercicio para esta fase.':'La biblioteca muestra primero los ejercicios más adecuados para esta fase. Puedes combinarlo con los filtros normales.'}box.classList.remove('hidden')}
function getFundamentosFiltro(){return [...document.querySelectorAll('input[name="filtro-fundamento"]:checked')].map(x=>x.value)}
function setFundamentosFiltro(valores){const fs=Array.isArray(valores)?valores:[];document.querySelectorAll('input[name="filtro-fundamento"]').forEach(x=>x.checked=fs.includes(x.value));actualizarEtiquetaFundamentosFiltro()}
function actualizarEtiquetaFundamentosFiltro(){const fs=getFundamentosFiltro(),el=$('fundamento-filtro-label');if(!el)return;el.textContent=!fs.length?'— Fundamentos —':(fs.length===1?fs[0]:`Fundamentos (${fs.length})`)}
function limpiarFundamentosFiltro(){setFundamentosFiltro([]);filtrarEjercicios()}
function limpiarFiltrosBiblioteca(){['buscar','escuela','nivel','tipo','favoritos'].forEach(id=>{if($(id))$(id).value=''});setFundamentosFiltro([])}
function abrirBibliotecaParaSeccion(slug){slug=normalizarSeccionEntreno(slug);const cfg=SECCIONES_ENTRENO[slug];if(!cfg)return;crearEjercicioDestinoSesion=null;seccionDestinoSesion=slug;limpiarFiltrosBiblioteca();showView('ejercicios',botonVista('ejercicios'));filtrarEjercicios();renderDestinoBiblioteca();window.scrollTo({top:0,behavior:'smooth'})}
function abrirCrearEjercicioParaSeccion(slug){slug=normalizarSeccionEntreno(slug);const cfg=SECCIONES_ENTRENO[slug];if(!cfg)return;cancelarEdicion();seccionDestinoSesion=slug;crearEjercicioDestinoSesion=slug;['buscar','escuela','nivel','tipo','favoritos'].forEach(id=>{if($(id))$(id).value=''});setFundamentosSeleccionados([]);if($('nuevo-tipo'))$('nuevo-tipo').value=cfg.tipoDefault||'';if($('nuevo-fase'))$('nuevo-fase').value=cfg.faseDefault||'Parte principal';$('form-title').textContent='➕ Crear ejercicio para '+cfg.numero+' · '+cfg.titulo;showView('ejercicios',botonVista('ejercicios'));renderDestinoBiblioteca();filtrarEjercicios();setTimeout(()=>{const el=$('form-title');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},40)}
function cancelarDestinoSesion(){const estabaCreando=!!crearEjercicioDestinoSesion;seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;if(estabaCreando)cancelarEdicion();renderDestinoBiblioteca();limpiarFiltrosBiblioteca();filtrarEjercicios()}
function volverAlEntrenamiento(){seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;renderDestinoBiblioteca();showView('entrenamiento',botonVista('entrenamiento'));renderizarSesion();window.scrollTo({top:0,behavior:'smooth'})}
function cargarMeta(){['fecha','equipo','jugadores','duracionObjetivo','intensidad','objetivo','notas'].forEach(k=>{let id=k==='duracionObjetivo'?'sesion-duracion-objetivo':'sesion-'+k,el=$(id);if(el)el.value=meta[k]||''});mapaNotasBloques();if(typeof renderSessionRoster==='function')renderSessionRoster();}
function guardarSesionMeta(){const roster=(typeof rosterSeleccionados==='function'&&$('session-roster-grid'))?rosterSeleccionados():(meta.playerIds||[]);meta={...meta,fecha:$('sesion-fecha')?.value||meta.fecha,equipo:EQUIPOS[equipoActivo].nombre,jugadores:$('sesion-jugadores')?.value||'',duracionObjetivo:$('sesion-duracion-objetivo')?.value||'',intensidad:$('sesion-intensidad')?.value||'Media',objetivo:$('sesion-objetivo')?.value||'',notas:$('sesion-notas')?.value||'',playerIds:roster};mapaNotasBloques();save();renderizarSesion();if(typeof renderSessionRoster==='function')renderSessionRoster();}
function añadirASesion(id){const e=baseDeDatos.find(x=>x.id===id);if(!e)return;const mapa=mapaSeccionesSesion(),key=String(id),destino=seccionDestinoSesion||seccionNaturalEjercicio(e);if(sesionActual.includes(id)){const actual=seccionEjercicioSesion(id,e);if(seccionDestinoSesion&&actual!==destino){mapa[key]=destino;$('save-indicator').textContent='✓ Movido a '+SECCIONES_ENTRENO[destino].titulo;}else{sesionActual=sesionActual.filter(x=>x!==id);delete mapa[key];$('save-indicator').textContent='✓ Quitado de '+EQUIPOS[equipoActivo].corto;}}else{sesionActual.push(id);mapa[key]=destino;$('save-indicator').textContent='✓ Añadido a '+SECCIONES_ENTRENO[destino].titulo;}meta.seccionesEjercicios=mapa;save();renderizarSesion();filtrarEjercicios();}
function quitarDeSesion(i){const id=sesionActual[i];sesionActual.splice(i,1);if(id!=null)delete mapaSeccionesSesion()[String(id)];save();renderizarSesion();filtrarEjercicios()}
function quitarDeSesionId(id){const i=sesionActual.indexOf(id);if(i>=0)quitarDeSesion(i)}
function moverSesion(i,dir){let j=i+dir;if(j<0||j>=sesionActual.length)return;[sesionActual[i],sesionActual[j]]=[sesionActual[j],sesionActual[i]];save();renderizarSesion();}
function moverSesionEnBloque(id,dir){const e=baseDeDatos.find(x=>x.id===id);if(!e)return;const slug=seccionEjercicioSesion(id,e);const ids=sesionActual.filter(x=>{const ex=baseDeDatos.find(z=>z.id===x);return ex&&seccionEjercicioSesion(x,ex)===slug});const pos=ids.indexOf(id),dest=pos+dir;if(pos<0||dest<0||dest>=ids.length)return;const a=sesionActual.indexOf(ids[pos]),b=sesionActual.indexOf(ids[dest]);[sesionActual[a],sesionActual[b]]=[sesionActual[b],sesionActual[a]];save();renderizarSesion()}
function moverEjercicioAFase(id,slug){const e=baseDeDatos.find(x=>x.id===id);if(!e)return;slug=normalizarSeccionEntreno(slug,e);mapaSeccionesSesion()[String(id)]=slug;save();renderizarSesion();$('save-indicator').textContent='✓ Movido a '+SECCIONES_ENTRENO[slug].titulo}
function snapshotEjercicioCompleto(e){
  if(!e)return null;
  const fs=normalizarFundamentos(e);
  return {id:e.id,nombre:e.nombre||'',tiempo:Number(e.tiempo)||0,escuela:e.escuela||'',fundamentos:fs,fundamento:fs[0]||'',formato:e.formato||'',nivel:e.nivel||'',intensidad:e.intensidad||'Media',tipo:e.tipo||'',jugadores:e.jugadores||'',material:e.material||'',video:e.video||'',objetivo:e.objetivo||'',descripcion:e.descripcion||'',variantes:e.variantes||'',errores:e.errores||'',fase:e.fase||'',pizarra:e.pizarra||null,seccionSesion:seccionEjercicioSesion(e.id,e)};
}
function enriquecerEjercicioGuardado(e){
  const vivo=e&&e.id!=null?baseDeDatos.find(x=>x.id===e.id):null;
  const d={...(vivo||{}),...(e||{})};
  d.fundamentos=normalizarFundamentos(d);d.fundamento=d.fundamentos[0]||'';
  return d;
}
function fichaEjercicioHTML(origen,numero,acciones=''){
  const e=enriquecerEjercicioGuardado(origen),fs=fundamentosTexto(e);
  const organizacion=[e.formato?`Formato: ${e.formato}`:'',e.jugadores?`Jugadores: ${e.jugadores}`:'',e.material?`Material: ${e.material}`:''].filter(Boolean).join(' · ');
  const chips=[`${Number(e.tiempo)||0} min`,fs&&fs!=='-'?fs:'',e.tipo||'',e.intensidad||'',e.fase||''].filter(Boolean).map(x=>`<span class="exercise-explain-chip">${esc(x)}</span>`).join('');
  return `<div class="exercise-explain-card"><div class="exercise-explain-head"><div><div class="exercise-explain-title">${numero?numero+'. ':''}${esc(e.nombre||'Ejercicio')}</div><div class="exercise-explain-meta">${chips}</div></div>${acciones?`<div class="exercise-explain-actions">${acciones}</div>`:''}</div><div class="exercise-explain-grid"><div class="exercise-explain-section"><div class="exercise-explain-label">Función / objetivo</div><div class="exercise-explain-text">${esc(e.objetivo||'Sin función definida')}</div></div><div class="exercise-explain-section"><div class="exercise-explain-label">Organización</div><div class="exercise-explain-text">${esc(organizacion||'Sin organización especificada')}</div></div><div class="exercise-explain-section wide"><div class="exercise-explain-label">Desarrollo</div><div class="exercise-explain-text">${esc(e.descripcion||'Sin desarrollo descrito')}</div></div>${e.errores?`<div class="exercise-explain-section"><div class="exercise-explain-label">Claves / correcciones</div><div class="exercise-explain-text">${esc(e.errores)}</div></div>`:''}${e.variantes?`<div class="exercise-explain-section"><div class="exercise-explain-label">Variantes</div><div class="exercise-explain-text">${esc(e.variantes)}</div></div>`:''}</div></div>`;
}
function ejerciciosPorBloques(lista){
  const grupos={activacion:[],tecnica:[],especifico:[],aplicado:[],juego:[]};
  (lista||[]).forEach(e0=>{const e=enriquecerEjercicioGuardado(e0),slug=normalizarSeccionEntreno(e0.seccionSesion||e.seccionSesion,e);(grupos[slug]||grupos.especifico).push(e0)});
  return grupos;
}
function entrenamientoEstructuradoHTML(h,accionesPorEjercicio=null){
  const orden=ORDEN_SECCIONES_ENTRENO;
  const listaConIndice=(h.ejercicios||[]).map((e,i)=>({...e,__historialIndice:i}));
  const grupos=ejerciciosPorBloques(listaConIndice),notas=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');
  let contador=0;
  const bloques=orden.map(slug=>{
    const items=grupos[slug]||[],nota=String(notas[slug]||'').trim();if(!items.length&&!nota)return '';
    const cfg=SECCIONES_ENTRENO[slug],mins=items.reduce((a,e)=>a+(Number(e.tiempo)||0),0);
    const body=items.map(e=>{
      const acciones=typeof accionesPorEjercicio==='function'?accionesPorEjercicio(e,Number(e.__historialIndice),slug):'';
      return fichaEjercicioHTML(e,++contador,acciones||'');
    }).join('')||'<div class="training-block-empty">Sin ejercicios guardados en esta fase.</div>';
    return `<div class="saved-training-block"><div class="saved-training-block-head"><span>${cfg.numero}</span><span>${cfg.icono}</span><b>${esc(cfg.titulo)}</b><span class="small">${items.length} ejercicio${items.length===1?'':'s'} · ${mins} min</span></div><div class="saved-training-block-body">${nota?`<div class="saved-training-note"><b>Notas de la fase:</b> ${esc(nota)}</div>`:''}${body}</div></div>`;
  }).join('');
  const objetivoTiempo=Number(h.duracionObjetivo)||0;
  return `<div class="saved-training-sheet"><div class="saved-training-summary"><div><b>Objetivo</b><br>${esc(h.objetivo||'-')}</div><div><b>Jugadores</b><br>${esc(h.jugadores||'-')}</div><div><b>Intensidad</b><br>${esc(h.intensidad||'Media')}</div><div><b>Duración</b><br>${Number(h.duracion)||0} min${objetivoTiempo?' / '+objetivoTiempo+' min':''}</div></div>${bloques||'<div class="empty">No hay ejercicios guardados.</div>'}${h.notas?`<div class="saved-training-block"><div class="saved-training-block-head"><span>📝</span><b>Notas del entrenador</b></div><div class="saved-training-block-body"><div class="exercise-explain-text">${esc(h.notas)}</div></div></div>`:''}</div>`;
}
function renderAvisoPlanHoy(){
  const box=$('plan-hoy-aviso');if(!box)return;const hoy=fechaLocalISO(),items=(planificacion||[]).filter(p=>p.fecha===hoy&&!p.realizado&&p.id!==meta.planificacionId);
  if(!items.length){box.innerHTML='';return}
  box.innerHTML=`<div class="today-plan-box"><div class="today-plan-head"><div><b>📅 Entrenamiento planificado para hoy</b><div class="small">Ábrelo para recuperar la sesión completa tal como la preparaste.</div></div></div><div class="today-plan-list">${items.map(p=>`<div class="today-plan-item"><b>${esc(p.objetivo||'Entrenamiento')}</b><div class="small">${(p.ejercicios||[]).length} ejercicios · ${Number(p.duracion)||0} min</div><button class="primary" style="margin-top:7px" onclick="usarPlan(${p.id})">Abrir entrenamiento</button></div>`).join('')}</div></div>`;
}
function tarjetaSesionCompactaHTML(e,numero,slug){
  const fs=normalizarFundamentos(e),chips=[`${Number(e.tiempo)||0} min`,...fs.slice(0,3),e.tipo||''].filter(Boolean).map(x=>`<span class="session-mini-chip">${esc(x)}</span>`).join('');
  const organizacion=[e.formato?`Formato: ${e.formato}`:'',e.jugadores?`Jugadores: ${e.jugadores}`:'',e.material?`Material: ${e.material}`:''].filter(Boolean).join(' · ');
  const opciones=ORDEN_SECCIONES_ENTRENO.map(k=>`<option value="${k}"${k===slug?' selected':''}>${SECCIONES_ENTRENO[k].numero} · ${SECCIONES_ENTRENO[k].titulo}</option>`).join('');
  return `<div class="session-exercise-card"><div class="session-exercise-main"><div class="session-exercise-number">${String(numero).padStart(2,'0')}</div><div class="session-exercise-copy"><div class="session-exercise-name">${esc(e.nombre||'Ejercicio')}</div><div class="session-exercise-function">${esc(e.objetivo||e.descripcion||'Sin función definida')}</div><div class="session-exercise-meta">${chips}</div></div><div class="session-exercise-controls"><details class="exercise-menu"><summary title="Opciones">•••</summary><div class="exercise-menu-pop" onclick="event.stopPropagation()"><label>Mover a fase</label><select onchange="moverEjercicioAFase(${e.id},this.value);this.closest('details').removeAttribute('open')">${opciones}</select><button onclick="moverSesionEnBloque(${e.id},-1);this.closest('details').removeAttribute('open')">↑ Subir en la fase</button><button onclick="moverSesionEnBloque(${e.id},1);this.closest('details').removeAttribute('open')">↓ Bajar en la fase</button><button onclick="abrirBibliotecaParaSeccion('${slug}');this.closest('details').removeAttribute('open')">↔ Sustituir / añadir otro</button><button class="danger-menu" onclick="quitarDeSesionId(${e.id})">× Quitar de la sesión</button></div></details></div></div><details class="session-exercise-details"><summary>Detalles del ejercicio</summary><div class="session-exercise-detail-grid"><div class="session-exercise-detail"><b>Función</b><span>${esc(e.objetivo||'Sin función definida')}</span></div><div class="session-exercise-detail"><b>Organización</b><span>${esc(organizacion||'Sin organización especificada')}</span></div><div class="session-exercise-detail wide"><b>Desarrollo</b><span>${esc(e.descripcion||'Sin desarrollo descrito')}</span></div>${e.errores?`<div class="session-exercise-detail"><b>Claves / correcciones</b><span>${esc(e.errores)}</span></div>`:''}${e.variantes?`<div class="session-exercise-detail"><b>Variantes</b><span>${esc(e.variantes)}</span></div>`:''}</div></details></div>`;
}
function renderizarSesion(){
  let total=0;const grupos={activacion:[],tecnica:[],especifico:[],aplicado:[],juego:[]};
  sesionActual.forEach(id=>{const e=baseDeDatos.find(x=>x.id===id);if(!e)return;total+=Number(e.tiempo)||0;const slug=seccionEjercicioSesion(id,e);(grupos[slug]||grupos.especifico).push(e)});
  const notas=mapaNotasBloques();let numeroGlobal=0;
  const rail=ORDEN_SECCIONES_ENTRENO.map(slug=>{const cfg=SECCIONES_ENTRENO[slug],items=grupos[slug]||[],mins=items.reduce((a,e)=>a+(Number(e.tiempo)||0),0);return `<a class="stage-rail-item" href="#stage-${slug}"><span class="stage-rail-num">${cfg.numero}</span><span class="stage-rail-text"><b>${cfg.icono} ${esc(cfg.titulo)}</b><small>${items.length} ej. · ${mins} min</small></span></a>`}).join('');
  if($('stage-rail'))$('stage-rail').innerHTML=rail;
  $('lista-sesion').innerHTML=ORDEN_SECCIONES_ENTRENO.map(slug=>{const cfg=SECCIONES_ENTRENO[slug],items=grupos[slug]||[],mins=items.reduce((a,e)=>a+(Number(e.tiempo)||0),0),nota=String(notas[slug]||'');const body=items.map(e=>tarjetaSesionCompactaHTML(e,++numeroGlobal,slug)).join('')||`<div class="stage-empty">${slug==='especifico'?'Añade aquí el trabajo principal específico del objetivo del día.':'Aún no hay ejercicios en esta fase.'}</div>`;return `<section class="training-stage" id="stage-${slug}"><div class="training-stage-head"><div class="training-stage-title"><span class="training-stage-index">${cfg.numero}</span><div class="training-stage-name"><strong>${cfg.icono} ${esc(cfg.titulo)}</strong><div class="small">${esc(cfg.nota)}</div><div class="training-stage-stats"><span class="stage-stat">${items.length} ejercicio${items.length===1?'':'s'}</span><span class="stage-stat">${mins} min</span></div></div></div><div class="training-stage-actions"><button class="ghost" onclick="abrirBibliotecaParaSeccion('${slug}')">＋ Biblioteca</button><button class="primary" onclick="abrirCrearEjercicioParaSeccion('${slug}')">＋ Crear</button></div></div><div class="training-stage-body">${body}<details class="stage-notes${nota.trim()?' has-content':''}"><summary>📝 Notas / contenido de la fase</summary><textarea placeholder="Indicaciones, progresiones, consignas o contenido libre..." oninput="guardarNotaBloque('${slug}',this.value)">${esc(nota)}</textarea></details></div></section>`}).join('');
  const objetivo=Number(meta.duracionObjetivo)||0,porcentaje=objetivo?Math.min(100,Math.round(total/objetivo*100)):0;
  $('tiempo-total').textContent=total+' min';$('num-ejercicios').textContent=sesionActual.length;$('intensidad-resumen').textContent=meta.intensidad||'Media';if($('duracion-objetivo-resumen'))$('duracion-objetivo-resumen').textContent=objetivo?objetivo+' min':'—';if($('session-progress-bar'))$('session-progress-bar').style.width=porcentaje+'%';if($('session-progress-label'))$('session-progress-label').textContent=objetivo?`${total} / ${objetivo} min · ${porcentaje}%`:'Define una duración objetivo';renderFocoSesion(grupos,total);if($('action-session-summary'))$('action-session-summary').textContent=`${sesionActual.length} ejercicio${sesionActual.length===1?'':'s'} · ${total} min`;renderAvisoPlanHoy();if($('dashboard')&&$('dashboard').classList.contains('active'))renderDashboard();
}
function getForm(){const fundamentos=getFundamentosSeleccionados();return {nombre:$('nuevo-nombre').value.trim(),tiempo:+$('nuevo-tiempo').value||0,escuela:$('nueva-escuela').value,fundamentos,fundamento:fundamentos[0]||'',formato:$('nuevo-formato').value.trim(),nivel:$('nuevo-nivel').value,intensidad:$('nueva-intensidad').value,tipo:$('nuevo-tipo').value,jugadores:$('nuevo-jugadores').value.trim(),material:$('nuevo-material').value.trim(),video:$('nuevo-video').value.trim(),objetivo:$('nuevo-objetivo').value.trim(),descripcion:$('nueva-descripcion').value.trim(),variantes:$('nuevo-variantes').value.trim(),errores:$('nuevo-errores').value.trim(),fase:$('nuevo-fase').value}}
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
function guardarEjercicio(){let d=getForm();if(!d.nombre||!d.descripcion){alert('Añade al menos nombre y descripción.');return}if(!d.fundamentos.length){alert('Selecciona al menos un grupo / fundamento.');return}let id=+$('edit-id').value;const parecidos=similaresDeEjercicio(d,id||null);if(parecidos.length){const txt=parecidos.slice(0,3).map(x=>'• '+x.e.nombre+' ('+Math.round(x.score*100)+'%)').join('\n');if(!confirm('⚠️ Puede que este ejercicio ya exista o sea muy parecido a otro:\n\n'+txt+'\n\n¿Quieres guardarlo igualmente?'))return}let nuevoId=null;if(id){let idx=baseDeDatos.findIndex(e=>e.id===id);baseDeDatos[idx]={...baseDeDatos[idx],...d}}else{nuevoId=Date.now();const nuevo={id:nuevoId,bibliotecaUid:'usr-'+nuevoId+'-'+Math.random().toString(36).slice(2,8),origenUsuario:true,...d,favorito:false,usos:0};desmarcarBorradoBiblioteca(nuevo);baseDeDatos.push(nuevo)}save();const destinoCreado=(!id&&nuevoId&&crearEjercicioDestinoSesion)?crearEjercicioDestinoSesion:null;cancelarEdicion();if(destinoCreado){const mapa=mapaSeccionesSesion();if(!sesionActual.includes(nuevoId))sesionActual.push(nuevoId);mapa[String(nuevoId)]=destinoCreado;meta.seccionesEjercicios=mapa;crearEjercicioDestinoSesion=null;save();volverAlEntrenamiento();$('save-indicator').textContent='✓ Ejercicio creado y añadido a '+SECCIONES_ENTRENO[destinoCreado].titulo;return}filtrarEjercicios();}
function fillForm(e){crearEjercicioDestinoSesion=null;$('edit-id').value=e.id;$('nuevo-nombre').value=e.nombre;$('nuevo-tiempo').value=e.tiempo;$('nueva-escuela').value=e.escuela;setFundamentosSeleccionados(normalizarFundamentos(e));$('nuevo-formato').value=e.formato||'';$('nuevo-nivel').value=e.nivel||'Intermedio';$('nueva-intensidad').value=e.intensidad||'Media';$('nuevo-tipo').value=e.tipo||'';$('nuevo-jugadores').value=e.jugadores||'';$('nuevo-material').value=e.material||'';$('nuevo-video').value=e.video||'';$('nuevo-objetivo').value=e.objetivo||'';$('nueva-descripcion').value=e.descripcion||'';$('nuevo-variantes').value=e.variantes||'';$('nuevo-errores').value=e.errores||'';$('nuevo-fase').value=e.fase||'Parte principal';$('form-title').textContent='✏️ Editar ejercicio';$('cancel-edit').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
function cancelarEdicion(){['edit-id','nuevo-nombre','nuevo-tiempo','nuevo-formato','nuevo-jugadores','nuevo-material','nuevo-video','nuevo-objetivo','nueva-descripcion','nuevo-variantes','nuevo-errores'].forEach(id=>$(id).value='');setFundamentosSeleccionados([]);$('nuevo-tipo').value='';$('form-title').textContent='➕ Añadir ejercicio a la biblioteca';$('cancel-edit').classList.add('hidden');}
function duplicarEjercicio(id){let e=baseDeDatos.find(x=>x.id===id);if(!e)return;const nid=Date.now(),nuevo={...clonar(e),id:nid,bibliotecaUid:'usr-'+nid+'-'+Math.random().toString(36).slice(2,8),origenUsuario:true,nombre:e.nombre+' (copia)',usos:0,favorito:false};desmarcarBorradoBiblioteca(nuevo);baseDeDatos.push(nuevo);save();filtrarEjercicios();}
function eliminarEjercicio(id){if(!confirm('¿Borrar este ejercicio de la biblioteca compartida? Se quitará también de las sesiones actuales de ambos equipos.'))return;const eliminado=baseDeDatos.find(e=>e.id===id);if(eliminado)marcarBorradoBiblioteca(eliminado);baseDeDatos=baseDeDatos.filter(e=>e.id!==id);sesionActual=sesionActual.filter(x=>x!==id);delete mapaSeccionesSesion()[String(id)];Object.keys(EQUIPOS).forEach(k=>{if(k!==equipoActivo&&equiposData[k]){equiposData[k].sesionActual=(equiposData[k].sesionActual||[]).filter(x=>x!==id);if(equiposData[k].meta&&equiposData[k].meta.seccionesEjercicios)delete equiposData[k].meta.seccionesEjercicios[String(id)]}});save();filtrarEjercicios();renderizarSesion();}
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
function renderConteoBiblioteca(){const box=$('conteo-biblioteca');if(!box)return;const grupos=['Recepción','Ataque','Colocación','Bloqueo','Defensa','Reconstrucción','Juegos','Saque','Control'];const datos=[['Total',baseDeDatos.length],...grupos.map(g=>[g,baseDeDatos.filter(e=>normalizarFundamentos(e).includes(g)).length])];box.innerHTML=datos.map(([g,n])=>`<div class="metric"><span class="small">${g}</span><b>${n}</b></div>`).join('')}
function filtrarEjercicios(){renderConteoBiblioteca();actualizarEtiquetaFundamentosFiltro();let q=$('buscar').value.trim().toLowerCase(),escuela=$('escuela').value,funs=getFundamentosFiltro(),nivel=$('nivel').value,tipo=$('tipo').value,fav=$('favoritos').value;const hayCriterio=!!(q||escuela||funs.length||nivel||tipo||fav||seccionDestinoSesion);if(!hayCriterio){$('contenedor-principal').innerHTML='<div class="empty">Selecciona un filtro o escribe el nombre de un ejercicio.</div>';return}let d=baseDeDatos.filter(e=>{const fs=normalizarFundamentos(e);return (!seccionDestinoSesion||q||coincideFiltroSeccionDestino(e))&&(!escuela||escuela==='Todas'||e.escuela===escuela)&&(!funs.length||funs.every(f=>fs.includes(f)))&&(!nivel||nivel==='Todos'||(e.nivel||'Intermedio')===nivel)&&(!tipo||tipo==='Todos'||(e.tipo||'')===tipo)&&(!fav||fav==='Todos'||e.favorito)&&(!q||[e.nombre,e.descripcion,e.objetivo,fs.join(' '),e.material,e.tipo||''].join(' ').toLowerCase().includes(q))});renderizar(d)}
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
        <div class="actions"><button class="ghost" onclick="toggleFav(${e.id})">${e.favorito?'★ Quitar favorito':'☆ Favorito'}</button><button class="ghost" onclick='fillForm(${JSON.stringify(e).replace(/'/g,"&#39;")})'>✏️ Editar</button><button class="ghost" onclick="duplicarEjercicio(${e.id})">📋 Duplicar</button><button class="danger" onclick="eliminarEjercicio(${e.id})">🗑️ Borrar</button></div>
      </div>
    </div>`;
  }).join('')||'<div class="empty">No hay ejercicios con estos filtros.</div>'
}
function reiniciarSesionActual(){
  sesionActual=[];meta={fecha:fechaLocalISO(),equipo:EQUIPOS[equipoActivo].nombre,jugadores:'',duracionObjetivo:'',intensidad:'Media',objetivo:'',calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},playerIds:[],planificacionId:null};
  save();cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();
}
function construirPlanSesion(id){
  const ejercicios=sesionActual.map(x=>baseDeDatos.find(e=>e.id===x)).filter(Boolean),duracion=ejercicios.reduce((a,e)=>a+(Number(e.tiempo)||0),0);
  return {id,fecha:meta.fecha||fechaLocalISO(),equipo:EQUIPOS[equipoActivo].nombre,jugadores:meta.jugadores||'',playerIds:clonar(meta.playerIds||[]),duracionObjetivo:meta.duracionObjetivo||'',intensidad:meta.intensidad||'Media',objetivo:meta.objetivo||'',calentamiento:mapaNotasBloques().activacion||meta.calentamiento||'',notas:meta.notas||'',notasBloques:clonar(mapaNotasBloques()),seccionesEjercicios:clonar(mapaSeccionesSesion()),duracion,pizarra:null,ejercicios:ejercicios.map(snapshotEjercicioCompleto)};
}
function guardarSesionEnPlanificacion(limpiar=false){
  guardarSesionMeta();
  const tieneNotas=Object.values(mapaNotasBloques()).some(v=>String(v||'').trim());
  if(!sesionActual.length&&!String(meta.calentamiento||'').trim()&&!tieneNotas){alert('La sesión está vacía.');return false}
  if(!meta.fecha){alert('Selecciona una fecha para el entrenamiento.');return false}
  const id=Number(meta.planificacionId)||Date.now();
  const pos=planificacion.findIndex(p=>Number(p.id)===Number(id));
  const anterior=pos>=0?planificacion[pos]:null;
  const plan={
    ...construirPlanSesion(id),
    realizado:anterior?.realizado===true,
    realizadoEn:anterior?.realizadoEn||null,
    historialId:anterior?.historialId||null,
    historialEliminado:anterior?.historialEliminado===true,
    guardadoPlanificacionEn:new Date().toISOString()
  };
  if(pos>=0)planificacion[pos]={...anterior,...plan};else planificacion.push(plan);
  meta.planificacionId=id;
  save();renderPlanificacion();renderAvisoPlanHoy();
  if(limpiar){reiniciarSesionActual()}else{
    if($('save-indicator'))$('save-indicator').textContent=pos>=0?'✓ Cambios guardados en Planificación':'✓ Entrenamiento guardado en Planificación';
    alert(pos>=0?'✅ Cambios guardados en Planificación. El entrenamiento seguirá pendiente hasta que marques «Realizado».':'✅ Entrenamiento guardado en Planificación. No se marcará como realizado hasta que pulses el botón «Realizado».');
  }
  return true;
}
function normalizarTextoPlan(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ')}
function buscarPlanCompatibleSesion(fecha,preferidoId=null){
  const preferido=preferidoId?planificacion.find(p=>p.id===Number(preferidoId)):null;
  if(preferido&&!preferido.realizado)return preferido;
  const candidatos=planificacion.filter(p=>p.fecha===fecha&&!p.realizado);
  if(candidatos.length===1)return candidatos[0];
  if(!candidatos.length)return null;
  const idsSesion=new Set(sesionActual.map(Number));
  const objSesion=normalizarTextoPlan(meta.objetivo);
  let mejor=null,mejorPuntos=0,empate=false;
  candidatos.forEach(p=>{
    let puntos=0;const objPlan=normalizarTextoPlan(p.objetivo);
    if(objSesion&&objPlan&&objSesion===objPlan)puntos+=8;
    const idsPlan=(p.ejercicios||[]).map(e=>Number(e.id)).filter(Boolean);
    idsPlan.forEach(id=>{if(idsSesion.has(id))puntos+=2});
    if(idsPlan.length&&idsSesion.size&&idsPlan.length===idsSesion.size&&idsPlan.every(id=>idsSesion.has(id)))puntos+=5;
    if(puntos>mejorPuntos){mejor=p;mejorPuntos=puntos;empate=false}else if(puntos===mejorPuntos&&puntos>0){empate=true}
  });
  return mejorPuntos>0&&!empate?mejor:null;
}
function ejerciciosHistorialDesdePlan(p){
  const mapa=p.seccionesEjercicios&&typeof p.seccionesEjercicios==='object'?p.seccionesEjercicios:{};
  return (p.ejercicios||[]).map(x=>{
    const e=enriquecerEjercicioGuardado(x),snap=snapshotEjercicioCompleto(e);
    if(!snap)return null;
    snap.seccionSesion=x.seccionSesion||mapa[String(x.id)]||seccionNaturalEjercicio(e);
    return snap;
  }).filter(Boolean);
}
function marcarPlanRealizado(id){
  const p=planificacion.find(x=>Number(x.id)===Number(id));if(!p)return;
  if(p.realizado){if(p.historialId)verPlanEnEntrenamientos(id);return}
  const hoy=fechaLocalISO();
  if((p.fecha||hoy)>hoy){alert('Este entrenamiento todavía está planificado para una fecha futura.');return}
  if(!confirm('¿Marcar este entrenamiento como realizado?'))return;

  let h=p.historialId?historial.find(x=>Number(x.id)===Number(p.historialId)):null;
  if(!h)h=historial.find(x=>Number(x.planificacionId)===Number(p.id));

  if(!h){
    const ejercicios=ejerciciosHistorialDesdePlan(p),historialId=Date.now();
    ejercicios.forEach(s=>{const vivo=baseDeDatos.find(e=>Number(e.id)===Number(s.id));if(vivo)vivo.usos=(vivo.usos||0)+1});
    const duracion=Number(p.duracion)||ejercicios.reduce((a,e)=>a+(Number(e.tiempo)||0),0);
    h={id:historialId,fecha:p.fecha||hoy,equipo:p.equipo||EQUIPOS[equipoActivo].nombre,jugadores:p.jugadores||'',playerIds:clonar(p.playerIds||[]),intensidad:p.intensidad||'Media',objetivo:p.objetivo||'',calentamiento:p.calentamiento||'',notas:p.notas||'',notasBloques:clonar(p.notasBloques||{}),seccionesEjercicios:clonar(p.seccionesEjercicios||{}),planificacionId:p.id,duracion,pizarra:p.pizarra||null,ejercicios};
    historial.unshift(h);
    p.historialId=historialId;
  }else{
    p.historialId=h.id;
    h.planificacionId=p.id;
  }
  p.realizado=true;
  p.realizadoEn=new Date().toISOString();
  p.archivadoAutomaticamente=false;
  p.pendienteConfirmacionManual=false;
  save();renderPlanificacion();renderHistorial();renderStats();renderAvisoPlanHoy();
  alert('✅ Entrenamiento marcado como realizado.');
}
function verPlanEnEntrenamientos(id){
  const p=planificacion.find(x=>x.id===id);if(!p||!p.historialId)return;
  showView('historial',botonVista('historial'));renderHistorial();
  setTimeout(()=>{const el=$('training-'+equipoActivo+'-'+p.historialId);if(el){el.classList.add('open');el.scrollIntoView({behavior:'smooth',block:'center'})}},60);
}
function finalizarEntrenamiento(){
  seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;guardarSesionMeta();
  const tieneNotasBloques=Object.values(mapaNotasBloques()).some(v=>String(v||'').trim());
  if(!sesionActual.length&&!String(meta.calentamiento||'').trim()&&!tieneNotasBloques){alert('La sesión está vacía.');return}
  const hoy=fechaLocalISO(),fecha=meta.fecha||hoy;
  if(fecha>hoy){
    if(!confirm(`Este entrenamiento está fechado para ${fecha}. Se guardará en Planificación, pero no se marcará como realizado. ¿Continuar?`))return;
    if(guardarSesionEnPlanificacion(true))alert('📅 Entrenamiento guardado en Planificación. Seguirá pendiente hasta que marques «Realizado».');
    return;
  }
  if(!confirm('¿Finalizar este entrenamiento? Se guardará en Historial, pero la Planificación seguirá pendiente hasta que pulses «Realizado».'))return;

  const ejercicios=sesionActual.map(id=>baseDeDatos.find(e=>e.id===id)).filter(Boolean);
  const duracion=ejercicios.reduce((a,e)=>a+(Number(e.tiempo)||0),0);
  const planVinculado=buscarPlanCompatibleSesion(fecha,meta.planificacionId),planId=planVinculado?planVinculado.id:null;
  let hExistente=planVinculado?.historialId?historial.find(x=>Number(x.id)===Number(planVinculado.historialId)):null;
  if(!hExistente&&planId)hExistente=historial.find(x=>Number(x.planificacionId)===Number(planId));
  const historialId=hExistente?.id||Date.now();
  const registro={id:historialId,...clonar(meta),calentamiento:mapaNotasBloques().activacion||meta.calentamiento||'',notasBloques:clonar(mapaNotasBloques()),planificacionId:planId,duracion,pizarra:null,ejercicios:ejercicios.map(snapshotEjercicioCompleto)};
  if(hExistente){Object.assign(hExistente,registro)}else{
    ejercicios.forEach(e=>e.usos=(e.usos||0)+1);
    historial.unshift(registro);
  }
  if(planId){
    const posPlan=planificacion.findIndex(p=>Number(p.id)===Number(planId));
    if(posPlan>=0){
      const anterior=planificacion[posPlan];
      const sesionGuardada=construirPlanSesion(planId);
      planificacion[posPlan]={...anterior,...sesionGuardada,realizado:anterior.realizado===true,realizadoEn:anterior.realizadoEn||null,historialId,historialGuardadoEn:new Date().toISOString(),archivadoAutomaticamente:false};
    }
  }
  reiniciarSesionActual();renderHistorial();renderStats();renderPlanificacion();
  alert(planId?'✅ Entrenamiento guardado en Historial. En Planificación sigue pendiente hasta que pulses «Realizado».':'✅ Entrenamiento guardado en Historial.');
}
function fundamentosSesion(h){
  const fs=[];(h.ejercicios||[]).forEach(e=>normalizarFundamentos(e).forEach(f=>{if(!fs.includes(f))fs.push(f)}));return fs;
}
function notasBloquesHistorial(h){const notas=normalizarNotasEntreno(h?.notasBloques||{},h?.calentamiento||'');return ORDEN_SECCIONES_ENTRENO.map(slug=>{const txt=String(notas[slug]||'').trim();return txt?`<p><b>${esc(SECCIONES_ENTRENO[slug].titulo)}:</b> ${esc(txt)}</p>`:''}).join('')}
function toggleTrainingDetail(team,id){const el=$('training-'+team+'-'+id);if(el)el.classList.toggle('open')}
function repetirSesionEquipo(team,id){
  if(team!==equipoActivo)cambiarEquipo(team);
  let h=historial.find(x=>x.id===id);if(!h)return;
  sesionActual=h.ejercicios.map(x=>x.id).filter(id=>baseDeDatos.some(e=>e.id===id));const secciones={};(h.ejercicios||[]).forEach(x=>{if(x.id!=null&&sesionActual.includes(x.id))secciones[String(x.id)]=normalizarSeccionEntreno(x.seccionSesion,baseDeDatos.find(e=>e.id===x.id))});meta={fecha:fechaLocalISO(),equipo:EQUIPOS[equipoActivo].nombre,jugadores:h.jugadores||'',duracionObjetivo:h.duracionObjetivo||'',intensidad:h.intensidad||'Media',objetivo:h.objetivo||'',calentamiento:h.calentamiento||'',notas:'',seccionesEjercicios:secciones,notasBloques:normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||''),planificacionId:null};save();cargarMeta();renderizarSesion();filtrarEjercicios();document.querySelectorAll('.tab-btn')[0].click();
}
function borrarHistorialEquipo(team){
  // Compatibilidad interna: el historial completo ya no se borra desde la interfaz.
  if(!confirm('¿Borrar todo el historial de '+EQUIPOS[team].nombre+'?'))return;
  if(team===equipoActivo){historial=[];save();}else{equiposData[team].historial=[];guardarEstadoLocalSinCloud();programarSubidaCloud();}
  renderHistorial();renderStats();renderDashboard();
}
function borrarEntrenamientoHistorialEquipo(team,entrenamientoId){
  if(!EQUIPOS[team])return;
  guardarEquipoEnMemoria();
  const datos=equiposData?.[team];
  if(!datos)return;
  const hs=Array.isArray(datos.historial)?datos.historial:[];
  const idx=hs.findIndex(x=>Number(x.id)===Number(entrenamientoId));
  if(idx<0)return;
  const h=hs[idx];
  const fecha=h.fecha||'sin fecha';
  const objetivo=String(h.objetivo||'').trim();
  const descripcion=objetivo?`\n${objetivo}`:'';
  if(!confirm(`¿Eliminar el entrenamiento del ${fecha} del historial?${descripcion}\n\nSe eliminará solo este entrenamiento. Los ejercicios seguirán en la Biblioteca y el resto del historial no se modificará.`))return;

  // Si estaba vinculado a una planificación, solo quitamos el enlace al Historial.
  // El estado Realizado nunca cambia automáticamente: depende exclusivamente del botón de Planificación.
  const planes=Array.isArray(datos.planificacion)?datos.planificacion:[];
  planes.forEach(p=>{
    const vinculado=Number(p.historialId)===Number(h.id)||Number(p.id)===Number(h.planificacionId);
    if(vinculado){
      p.historialId=null;
      p.historialEliminado=true;
    }
  });

  // Ajusta el contador de usos únicamente si este historial representaba una sesión real guardada.
  (h.ejercicios||[]).forEach(e=>{
    if(e?.id==null)return;
    const vivo=baseDeDatos.find(x=>Number(x.id)===Number(e.id));
    if(vivo&&Number(vivo.usos)>0)vivo.usos=Math.max(0,Number(vivo.usos)-1);
  });

  hs.splice(idx,1);
  datos.historial=hs;
  datos.planificacion=planes;
  if(team===equipoActivo){
    historial=clonar(hs);
    planificacion=clonar(planes);
  }
  guardarEstadoLocalSinCloud();
  programarSubidaCloud();
  renderHistorial();
  renderPlanificacion();
  renderStats();
  renderDashboard();
  renderAvisoPlanHoy();
  if($('save-indicator'))$('save-indicator').textContent='✓ Entrenamiento eliminado del historial';
}
function renderHistorial(){
  guardarEquipoEnMemoria();
  const column=team=>{
    const hs=clonar(equiposData?.[team]?.historial||[]).sort((a,b)=>String(b.fecha||'').localeCompare(String(a.fecha||'')));
    const items=hs.map(h=>{
      const fs=fundamentosSesion(h),trabajo=fs.length?fs.join(' · '):(h.objetivo||'Sin contenido indicado');
      const detalle=entrenamientoEstructuradoHTML(h);
      return `<div class="training-simple-item" onclick="toggleTrainingDetail('${team}',${h.id})"><div class="training-simple-top"><div><div class="training-date">${esc(h.fecha||'Sin fecha')}</div><div class="training-work">${esc(trabajo)}</div></div><span class="small">${h.duracion||0} min</span></div><div id="training-${team}-${h.id}" class="training-detail">${detalle}<div class="actions" style="margin-top:10px"><button class="ghost" onclick="event.stopPropagation();exportarPDFGuardado('${team}',${h.id})">📄 Exportar PDF</button><button class="primary" onclick="event.stopPropagation();repetirSesionEquipo('${team}',${h.id})">Repetir entrenamiento</button><button class="danger" onclick="event.stopPropagation();borrarEntrenamientoHistorialEquipo('${team}',${h.id})">Eliminar entrenamiento</button></div></div></div>`;
    }).join('')||'<div class="empty">Aún no hay entrenamientos guardados.</div>';
    const totalEjercicios=hs.reduce((a,h)=>a+(Array.isArray(h.ejercicios)?h.ejercicios.length:0),0);
    return `<div class="team-training-column"><div class="team-training-column-head"><h3>${esc(EQUIPOS[team].nombre)}</h3><span class="history-team-count">${hs.length} entrenamientos · ${totalEjercicios} ejercicios</span></div><div class="training-simple-list">${items}</div></div>`;
  };
  $('historial-list').innerHTML=column('cadete')+column('infantil');
}
function repetirSesion(id){repetirSesionEquipo(equipoActivo,id)}
function borrarHistorial(){borrarHistorialEquipo(equipoActivo)}
function renderStats(){
  let mins=historial.reduce((a,h)=>a+(h.duracion||0),0);
  $('stat-sesiones').textContent=historial.length;
  $('stat-ejercicios').textContent=baseDeDatos.length;
  $('stat-minutos').textContent=mins;
  if($('stat-team-name'))$('stat-team-name').textContent=EQUIPOS[equipoActivo].nombre;

  // Reparto por fundamento: cada minuto se distribuye entre los fundamentos del ejercicio,
  // para que los porcentajes representen un total real del 100% sin duplicar minutos.
  let counts={};
  historial.forEach(h=>{
    const lista=(h.ejercicios||[]).map(e=>enriquecerEjercicioGuardado(e));
    const parcial=fundamentosConMinutos(lista);
    Object.entries(parcial).forEach(([f,m])=>counts[f]=(counts[f]||0)+Number(m||0));
  });
  const entradas=Object.entries(counts).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
  const totalTrabajo=entradas.reduce((a,[,v])=>a+Number(v||0),0);
  let porcentajes=[];
  if(totalTrabajo>0&&entradas.length){
    const raw=entradas.map(([,v])=>Number(v||0)/totalTrabajo*100);
    porcentajes=raw.map(Math.floor);
    let faltan=100-porcentajes.reduce((a,b)=>a+b,0);
    raw.map((v,i)=>[i,v-Math.floor(v)]).sort((a,b)=>b[1]-a[1]).forEach(([i])=>{if(faltan>0){porcentajes[i]++;faltan--}});
  }
  $('stat-bars').innerHTML=entradas.map(([k,v],i)=>{
    const pct=porcentajes[i]||0,mins=Math.round(Number(v)||0);
    return `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><span style="width:${pct}%"></span></div><b>${pct}% · ${mins}m</b></div>`;
  }).join('')||'<div class="empty">Completa entrenamientos para generar estadísticas.</div>';

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
function exportarDatos(){guardarEquipoEnMemoria();let payload={version:5.5,equipoActivo,bibliotecaCompartida:clonar(baseDeDatos),equiposData:clonar(equiposData)};let blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Volley_Coach_Copia_V55.json';a.click();URL.revokeObjectURL(a.href)}
$('import-file').addEventListener('change',e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result),conv=convertirEstadoPersistido(d);if(!conv)throw 0;baseDeDatos=bibliotecaFusionadaSegura(baseDeDatos||[],conv.bibliotecaCompartida||[]);migrarFundamentos();asegurarEjerciciosPropios183();asegurarEjerciciosPropios287Nuevos();equiposData=conv.equiposData;['infantil','cadete'].forEach(id=>equiposData[id]=limpiarEquipo(equiposData[id],id));aplicarLimpiezaRecepcionV1();aplicarLimpiezaColocacionV1();aplicarLimpiezaAtaqueV1();aplicarLimpiezaDefensaBloqueoV1();equipoActivo=EQUIPOS[d.equipoActivo]?d.equipoActivo:equipoActivo;guardarEstadoLocalSinCloud();cargarEquipoEnVariables(equipoActivo);actualizarSelectorEquipo();save();cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderHistorial();renderStats();alert('✅ Copia restaurada. Biblioteca compartida y equipos cargados.');}catch(err){console.error(err);alert('❌ Archivo no válido.')}};r.readAsText(f)});
if($('import-library-file'))$('import-library-file').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];importarBibliotecaDesdeArchivo(f);e.target.value='';});
async function exportarImagen(){try{let c=await html2canvas($('export-area'),{backgroundColor:'#eef2f6',scale:2});let a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='Entrenamiento_Volei.png';a.click()}catch{alert('No se pudo generar la imagen.')}}
function limpiarTextoPDF(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function datosSesionActualParaPDF(){
  guardarSesionMeta();
  return construirPlanSesion(Date.now());
}
function exportarPDFGuardado(team,id){
  guardarEquipoEnMemoria();
  const hs=team===equipoActivo?historial:(equiposData?.[team]?.historial||[]),h=hs.find(x=>x.id===id);
  if(!h){alert('No se ha encontrado el entrenamiento guardado.');return}
  generarPDFEntrenamiento(h,EQUIPOS[team]?.nombre||h.equipo||'Equipo');
}
function exportarPDF(){
  const h=datosSesionActualParaPDF();
  if(!(h.ejercicios||[]).length&&!limpiarTextoPDF(h.calentamiento)&&!Object.values(h.notasBloques||{}).some(v=>limpiarTextoPDF(v))){alert('La sesión está vacía.');return}
  generarPDFEntrenamiento(h,EQUIPOS[equipoActivo]?.nombre||h.equipo||'Equipo');
}
function generarPDFEntrenamiento(h,equipoNombre){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=14,LH=4.6;
    const navy=[19,43,68],muted=[91,105,120],light=[245,247,249],line=[130,145,160];
    let y=15;
    const setNormal=(size=9.6,color=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const setBold=(size=9.6,color=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(size);pdf.setTextColor(...color)};
    const nuevaPagina=()=>{pdf.addPage();y=15};
    const asegurar=(alto=6)=>{if(y+alto>H-FOOT)nuevaPagina()};
    const linea=()=>{pdf.setDrawColor(...navy);pdf.setLineWidth(.45);pdf.line(M,y,W-M,y);y+=5};
    const campo=(etiqueta,valor,op={})=>{
      const txt=limpiarTextoPDF(valor)||'-',tam=op.size||9.5,indent=op.indent||0;
      setBold(tam);const lab=etiqueta+':',x=M+indent,labelW=pdf.getTextWidth(lab+' '),valueX=x+labelW,right=Number.isFinite(op.right)?op.right:(W-M),maxW=Math.max(25,right-valueX);
      setNormal(tam);const lines=pdf.splitTextToSize(txt,maxW);
      for(let i=0;i<lines.length;i++){
        asegurar(LH+1);
        if(i===0){setBold(tam);pdf.text(lab,x,y);setNormal(tam);pdf.text(lines[i],valueX,y)}else{setNormal(tam);pdf.text(lines[i],valueX,y)}
        y+=LH;
      }
      y+=op.after==null?1.2:op.after;
    };
    const bloqueTitulo=titulo=>{asegurar(11);setBold(13.5);pdf.text(limpiarTextoPDF(titulo),M,y);y+=3.5;pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,y,W-M,y);y+=5.5};
    const notaBloque=txt=>{if(!limpiarTextoPDF(txt))return;campo('Notas del bloque',txt,{size:9,after:2})};
    const dibujarPistaMini=(x,yy,w=40,h=20)=>{
      pdf.setDrawColor(125,139,153);pdf.setLineWidth(.28);
      pdf.rect(x,yy,w,h);
      const centro=x+w/2,ataque=w/6;
      pdf.setLineWidth(.48);pdf.line(centro,yy,centro,yy+h);
      pdf.setLineWidth(.22);pdf.line(centro-ataque,yy,centro-ataque,yy+h);pdf.line(centro+ataque,yy,centro+ataque,yy+h);
      pdf.setDrawColor(185,194,203);pdf.setLineWidth(.18);
      pdf.line(x,yy+h/2,x+w,yy+h/2);
      pdf.setTextColor(...muted);pdf.setFont('helvetica','normal');pdf.setFontSize(5.8);
      pdf.text('CAMPO',x+w/2,yy+h+3,{align:'center'});
    };
    const ejercicio=(e0,n)=>{
      const e=enriquecerEjercicioGuardado(e0),nombre=limpiarTextoPDF(e.nombre)||'Ejercicio',tiempo=Number(e.tiempo)||0;
      const teamIdPDF=vcTeamIdFromName(equipoNombre),participantes=vcExerciseParticipantLabels(e0,h,teamIdPDF),sessionIds=vcSessionParticipantIds(h),exerciseIds=vcExerciseParticipantIds(e0,h),sessionSet=new Set(sessionIds.map(Number)),exerciseSet=new Set(exerciseIds.map(Number));
      const todosLosAsistentes=sessionIds.length>0&&exerciseIds.length===sessionIds.length&&exerciseIds.every(id=>sessionSet.has(Number(id)))&&sessionIds.every(id=>exerciseSet.has(Number(id)));
      const numeroParticipantes=participantes.length||exerciseIds.length||0;
      const pistaW=40,pistaH=20,pistaGap=5;
      asegurar(36);
      pdf.setFillColor(...light);pdf.rect(M,y-4,W-M*2,7,'F');setBold(10.5);pdf.text(`${n}. ${nombre}`,M+2,y);setNormal(9.3);pdf.text(`${tiempo} min${numeroParticipantes?` · ${numeroParticipantes} jug.`:''}`,W-M-2,y,{align:'right'});y+=7;
      const pistaX=W-M-pistaW,pistaY=y+1,textoRight=pistaX-pistaGap,paginaPista=pdf.getCurrentPageInfo().pageNumber;
      dibujarPistaMini(pistaX,pistaY,pistaW,pistaH);
      campo('Función',e.objetivo,{size:9.3,right:textoRight});
      campo('Desarrollo',e.descripcion,{size:9.3,right:textoRight});
      const org=[e.formato?`Formato: ${limpiarTextoPDF(e.formato)}`:'',e.jugadores?`Organización: ${limpiarTextoPDF(e.jugadores)}`:'',e.material?`Material: ${limpiarTextoPDF(e.material)}`:''].filter(Boolean).join(' · ');
      campo('Organización',org||'-',{size:9.3,right:textoRight});
      if(!todosLosAsistentes)campo('Participantes',participantes.length?participantes.join(' · '):(Array.isArray(e0?.playerIds)?'Sin jugadores asignados':'No registrado'),{size:9.3,right:textoRight});
      campo('Claves / correcciones',e.errores||'-',{size:9.3,right:textoRight});
      if(limpiarTextoPDF(e.variantes))campo('Variantes',e.variantes,{size:9.3,right:textoRight});
      if(pdf.getCurrentPageInfo().pageNumber===paginaPista)y=Math.max(y,pistaY+pistaH+5);
      asegurar(6);setNormal(8.5,muted);const metaEj=[fundamentosTexto(e),e.tipo||'',e.fase||'Parte principal',e.intensidad||'Media'].filter(Boolean).join(' · ');pdf.text(limpiarTextoPDF(metaEj),M,y);y+=7;
    };

    setBold(18);pdf.text('VOLLEY COACH',M,y);y+=8;
    setBold(12.5);pdf.text('Ficha de entrenamiento',M,y);y+=8;linea();
    campo('Equipo',equipoNombre||h.equipo||'Equipo',{size:9.6,after:1});
    campo('Fecha',h.fecha||'-',{size:9.6,after:1});
    campo('Duración',`${Number(h.duracion)||0} min`,{size:9.6,after:1});
    const rosterPDF=vcSessionParticipantLabels(h,vcTeamIdFromName(equipoNombre));
    campo('Asistentes',rosterPDF.length?rosterPDF.join(' · '):(h.jugadores||'-'),{size:9.6,after:1});
    campo('Intensidad',h.intensidad||'Media',{size:9.6,after:1});
    campo('Objetivo',h.objetivo||'-',{size:9.6,after:1});
    if(Number(h.duracionObjetivo)||0)campo('Objetivo de tiempo',`${Number(h.duracionObjetivo)} min`,{size:9.6,after:3});

    const orden=ORDEN_SECCIONES_ENTRENO,grupos=ejerciciosPorBloques(h.ejercicios||[]),notas=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');
    let contador=0;
    orden.forEach(slug=>{const items=grupos[slug]||[],nota=limpiarTextoPDF(notas[slug]);if(!items.length&&!nota)return;bloqueTitulo(`${SECCIONES_ENTRENO[slug]?.numero||''} ${SECCIONES_ENTRENO[slug]?.titulo||slug}`.trim());notaBloque(nota);items.forEach(e=>ejercicio(e,++contador))});
    if(limpiarTextoPDF(h.notas)){bloqueTitulo('Notas del entrenador');setNormal(9.4);const ls=pdf.splitTextToSize(limpiarTextoPDF(h.notas),W-M*2);ls.forEach(t=>{asegurar(LH);pdf.text(t,M,y);y+=LH})}

    const total=pdf.getNumberOfPages(),fecha=limpiarTextoPDF(h.fecha)||fechaLocalISO();
    for(let i=1;i<=total;i++){pdf.setPage(i);setNormal(8,muted);pdf.text(`Volley Coach · ${fecha} · Página ${i}/${total}`,M,H-7)}
    const limpio=String(equipoNombre||h.equipo||'Equipo').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');
    pdf.save(`Entrenamiento_${limpio}_${fecha}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF. Comprueba la conexión e inténtalo de nuevo.')}
}

// Pizarra táctica eliminada de la interfaz.
// Se mantienen estas funciones vacías para compatibilidad con sesiones antiguas guardadas en local/Supabase.
function serializarPizarra(){return null}
function aplicarPizarra(){return}
function limpiarPizarra(){return}
function guardarPizarraSesion(){return}
function cargarPizarraSesion(){return}
function marcarPizarraParaEjercicio(){return}
function cargarPizarraEjercicio(){return}
function lunesDeSemana(d){let x=new Date(d);let day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
function isoDate(d){return fechaLocalISO(d)}
function crearSesionDesdePlanificacion(fechaForzada=''){
  const fecha=fechaForzada||$('plan-fecha')?.value||'';if(!fecha){alert('Selecciona una fecha.');return false}
  const tieneSesion=sesionActual.length||String(meta.objetivo||'').trim()||Object.values(mapaNotasBloques()).some(v=>String(v||'').trim());
  if(tieneSesion&&!meta.planificacionId&&!confirm('Tienes una sesión en edición. ¿Quieres crear una nueva desde Planificación? La sesión actual solo se conservará si ya la habías guardado.'))return false;
  const objetivo=fechaForzada?'':($('plan-objetivo')?.value||'').trim(),duracion=fechaForzada?0:(+$('plan-duracion')?.value||0),intensidad=fechaForzada?'Media':($('plan-intensidad')?.value||'Media'),id=Date.now();
  const plan={id,fecha,equipo:EQUIPOS[equipoActivo].nombre,jugadores:'',objetivo,duracion,duracionObjetivo:duracion,intensidad,calentamiento:'',notas:'',ejercicios:[],notasBloques:{},seccionesEjercicios:{},realizado:false,historialId:null,creadoDesdePlanificacion:true,creadoEn:Date.now()};
  planificacion.push(plan);
  sesionActual=[];meta={fecha,equipo:EQUIPOS[equipoActivo].nombre,jugadores:'',duracionObjetivo:duracion||'',intensidad,objetivo,calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},planificacionId:id,pizarra:null};
  save();
  if($('plan-fecha'))$('plan-fecha').value='';if($('plan-objetivo'))$('plan-objetivo').value='';if($('plan-duracion'))$('plan-duracion').value='';if($('plan-equipo'))$('plan-equipo').value=EQUIPOS[equipoActivo].nombre;
  document.querySelector('.planning-quick-create')?.removeAttribute('open');
  cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderAvisoPlanHoy();showView('entrenamiento',botonVista('entrenamiento'));window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{if($('save-indicator'))$('save-indicator').textContent='✓ Sesión creada desde Planificación · guardado automático activo'},60);return true;
}
function crearSesionDiaPlanificacion(fecha){crearSesionDesdePlanificacion(fecha)}
function guardarPlan(){return crearSesionDesdePlanificacion('')}
function cambiarSemana(n){semanaBase.setDate(semanaBase.getDate()+n);renderPlanificacion()}
function eliminarPlan(id){if(meta.planificacionId===id)meta.planificacionId=null;planificacion=planificacion.filter(x=>x.id!==id);save();renderPlanificacion();renderAvisoPlanHoy()}
function usarPlan(id){
  const p=planificacion.find(x=>x.id===id);if(!p)return;const esRealizado=!!p.realizado;
  const ids=(p.ejercicios||[]).map(x=>x.id).filter(id=>baseDeDatos.some(e=>e.id===id));
  if((p.ejercicios||[]).length&&ids.length<(p.ejercicios||[]).length)alert('Algún ejercicio de esta planificación ya no existe en la biblioteca y no se ha podido cargar.');
  sesionActual=ids;
  const secciones=normalizarMapaSecciones(clonar(p.seccionesEjercicios||{}));(p.ejercicios||[]).forEach(x=>{if(x.id!=null&&ids.includes(x.id)&&!secciones[String(x.id)])secciones[String(x.id)]=normalizarSeccionEntreno(x.seccionSesion,enriquecerEjercicioGuardado(x))});
  meta={fecha:esRealizado?fechaLocalISO():(p.fecha||fechaLocalISO()),equipo:EQUIPOS[equipoActivo].nombre,jugadores:p.jugadores||'',playerIds:clonar(p.playerIds||[]),duracionObjetivo:p.duracionObjetivo||'',intensidad:p.intensidad||'Media',objetivo:p.objetivo||'',calentamiento:p.calentamiento||'',notas:p.notas||'',seccionesEjercicios:secciones,notasBloques:normalizarNotasEntreno(p.notasBloques||{},p.calentamiento||''),planificacionId:esRealizado?null:p.id,pizarra:null};
  save();cargarMeta();renderizarSesion();filtrarEjercicios();showView('entrenamiento',botonVista('entrenamiento'));window.scrollTo({top:0,behavior:'smooth'});if(esRealizado)setTimeout(()=>alert('Este entrenamiento ya estaba realizado. Se ha abierto como una copia nueva y la planificación original seguirá guardada.'),80);
}
function renderPlanificacion(){let lunes=lunesDeSemana(semanaBase);let dias=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],hoy=fechaLocalISO();$('week-label').textContent=`${lunes.toLocaleDateString('es-ES')} – ${new Date(lunes.getTime()+6*86400000).toLocaleDateString('es-ES')}`;$('week-grid').innerHTML=dias.map((nom,i)=>{let d=new Date(lunes);d.setDate(lunes.getDate()+i);let fecha=isoDate(d),items=planificacion.filter(p=>p.fecha===fecha);return `<div class="day-card"><h4>${nom}<br><span class="small">${d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'})}</span></h4>${items.map(p=>{const n=(p.ejercicios||[]).length,actual=meta.planificacionId===p.id,realizado=!!p.realizado,pasado=fecha<hoy,lista=n?`<div class="plan-exercise-list"><b>Ejercicios:</b>${(p.ejercicios||[]).map((e,j)=>`<div>${j+1}. ${esc(e.nombre||'Ejercicio')}</div>`).join('')}</div>`:'',estado=realizado?` <span class="plan-done-badge">✓ Realizado${p.archivadoAutomaticamente?' · archivado automáticamente':''}</span>`:(actual?' <span class="plan-current-badge">Abierto</span>':(pasado?' <span class="plan-pending-badge">Pendiente de confirmar</span>':'')),acciones=realizado?`<button class="primary" onclick="verPlanEnEntrenamientos(${p.id})">Ver en Entrenamientos</button><button class="ghost" onclick="usarPlan(${p.id})">Reutilizar</button>`:`<button class="ghost" onclick="usarPlan(${p.id})">Abrir entrenamiento</button>${fecha<=hoy?`<button class="success" onclick="marcarPlanRealizado(${p.id})">✓ Marcar realizado</button>`:''}`;return `<div class="plan-item${realizado?' plan-done':(pasado?' plan-pending':'')}"><b>${esc(p.equipo||'Sesión')}</b>${estado}<br>${esc(p.objetivo||'Sin objetivo')}<br><span class="small">${p.duracion||0} min · ${esc(p.intensidad||'Media')}${n?' · '+n+' ejercicios':''}</span>${lista}<div class="actions" style="margin-top:6px">${acciones}<button class="danger" onclick="eliminarPlan(${p.id})">×</button></div></div>`}).join('')||'<span class="small">Sin sesión</span>'}</div>`}).join('');renderAvisoPlanHoy()}


function sincronizarPlanesConHistorial(){
  let cambios=0;const usados=new Set();
  historial.forEach(h=>{if(h.planificacionId)usados.add(Number(h.planificacionId))});
  planificacion.forEach(p=>{
    // Migración V5.11.3: lo que se había marcado automáticamente vuelve a quedar pendiente.
    if(p.archivadoAutomaticamente===true){
      if(p.realizado===true){p.realizado=false;cambios++}
      p.realizadoEn=null;p.archivadoAutomaticamente=false;p.pendienteConfirmacionManual=true;cambios++;
    }
    let h=p.historialId?historial.find(x=>Number(x.id)===Number(p.historialId)):null;
    if(!h)h=historial.find(x=>Number(x.planificacionId)===Number(p.id));
    if(!h&&p.fecha){
      const candidatos=historial.filter(x=>x.fecha===p.fecha&&!x.planificacionId&&!usados.has(Number(p.id)));
      const obj=normalizarTextoPlan(p.objetivo),exactos=candidatos.filter(x=>obj&&normalizarTextoPlan(x.objetivo)===obj);
      if(exactos.length===1)h=exactos[0];
    }
    if(h){
      if(Number(p.historialId)!==Number(h.id)){p.historialId=h.id;cambios++}
      if(Number(h.planificacionId)!==Number(p.id)){h.planificacionId=p.id;cambios++}
      usados.add(Number(p.id));
    }
  });
  return cambios;
}
// Archiva automáticamente las planificaciones cuyo día ya ha terminado.
// Si la app estaba cerrada, se procesa al volver a abrirla; si sigue abierta,
// se vuelve a comprobar justo después de medianoche.
function archivarPlanificacionesPasadasEnEquipo(datos,teamId){
  // V5.11.3: nunca se marca ni se archiva una planificación automáticamente.
  // Los entrenamientos pasados permanecen pendientes hasta que el entrenador pulse «Realizado».
  return 0;
}
function archivarPlanificacionesPasadasEnEquiposData(){
  if(!equiposData)return 0;
  let cambios=0;
  Object.keys(EQUIPOS).forEach(team=>{
    if(!equiposData[team])equiposData[team]=estadoEquipoVacio(team);
    cambios+=archivarPlanificacionesPasadasEnEquipo(equiposData[team],team);
  });
  return cambios;
}
function procesarArchivadoAutomaticoPlanificaciones(){
  guardarEquipoEnMemoria();
  const cambios=archivarPlanificacionesPasadasEnEquiposData();
  if(!cambios)return 0;
  const s=limpiarEquipo(equiposData[equipoActivo],equipoActivo);
  equiposData[equipoActivo]=s;
  sesionActual=clonar(s.sesionActual||[]);
  meta=clonar(s.meta||estadoEquipoVacio(equipoActivo).meta);meta.equipo=EQUIPOS[equipoActivo].nombre;
  historial=clonar(s.historial||[]);
  planificacion=clonar(s.planificacion||[]);
  guardarEstadoLocalSinCloud();
  if(typeof programarSubidaCloud==='function')programarSubidaCloud();
  if($('planificacion'))renderPlanificacion();
  if($('historial-list'))renderHistorial();
  if($('stat-sesiones'))renderStats();
  renderAvisoPlanHoy();
  if($('save-indicator'))$('save-indicator').textContent='✓ Planificación pasada archivada automáticamente';
  return cambios;
}
let timerArchivadoCambioDia=null;
function programarArchivadoAlCambiarDia(){
  if(timerArchivadoCambioDia)clearTimeout(timerArchivadoCambioDia);
  const ahora=new Date(),proximo=new Date(ahora);
  proximo.setHours(24,0,3,0);
  timerArchivadoCambioDia=setTimeout(()=>{
    procesarArchivadoAutomaticoPlanificaciones();
    programarArchivadoAlCambiarDia();
  },Math.max(1000,proximo.getTime()-ahora.getTime()));
}


// ===== VOLLEY COACH CLOUD SYNC (Supabase) =====
let cloudClient=null, cloudUser=null, cloudSaveTimer=null, cloudApplying=false;
const CLOUD_URL_KEY='volleyCoachSupabaseUrlV2';
const CLOUD_ANON_KEY='volleyCoachSupabaseAnonKeyV2';
const DEFAULT_CLOUD_URL='https://iyoxalmcboeomnqgbxdi.supabase.co';
const DEFAULT_CLOUD_KEY='sb_publishable_PsRLv4V2ZG9CjuIcGK0o2g_h8dlLW_z';
function estadoLocal(){guardarEquipoEnMemoria();return {version:5.8,bibliotecaCompartida:clonar(baseDeDatos),bibliotecaIndependiente:clonar(baseDeDatos),bibliotecaBorrados:clonar(cargarBorradosBiblioteca()),bibliotecaVersion:1,equiposData:clonar(equiposData),updatedAt:new Date().toISOString()}}
function aplicarEstadoCloud(s){
  if(!s)return;
  cloudApplying=true;
  const eraAnterior=!(Array.isArray(s.bibliotecaCompartida)&&s.equiposData);
  const conv=convertirEstadoPersistido(s);
  if(!conv){cloudApplying=false;return}
  const bibliotecaAntes=clonar(baseDeDatos||[]),bibliotecaNube=fusionarBibliotecas(conv.bibliotecaCompartida||[],Array.isArray(s.bibliotecaIndependiente)?s.bibliotecaIndependiente:[]),tamNube=bibliotecaNube.length;
  if(Array.isArray(s.bibliotecaBorrados)&&s.bibliotecaBorrados.length){guardarBorradosBiblioteca([...cargarBorradosBiblioteca(),...s.bibliotecaBorrados])}
  baseDeDatos=bibliotecaFusionadaSegura(bibliotecaAntes,bibliotecaNube);migrarFundamentos();
  const agregadosPropios=asegurarEjerciciosPropios183()+asegurarEjerciciosPropios287Nuevos();
  equiposData=conv.equiposData;
  ['infantil','cadete'].forEach(id=>equiposData[id]=limpiarEquipo(equiposData[id],id));
  const cambiosRecepcion=aplicarLimpiezaRecepcionV1();
  const cambiosColocacion=aplicarLimpiezaColocacionV1();
  const cambiosAtaque=aplicarLimpiezaAtaqueV1();aplicarLimpiezaDefensaBloqueoV1();
  baseDeDatos=aplicarBorradosBiblioteca(baseDeDatos);
  const cambiosArchivado=archivarPlanificacionesPasadasEnEquiposData();
  guardarEstadoLocalSinCloud();
  cargarEquipoEnVariables(equipoActivo);
  actualizarSelectorEquipo();
  cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderHistorial();renderStats();
  const bibliotecaRecuperada=baseDeDatos.length>tamNube;
  cloudApplying=false;
  if((eraAnterior||bibliotecaRecuperada||agregadosPropios>0||cambiosRecepcion>0||cambiosColocacion>0||cambiosAtaque>0||cambiosArchivado>0)&&cloudUser)setTimeout(()=>subirNube(false),350);
}
function setCloudUI(kind,text){
  const dot=$('cloud-dot'),label=$('cloud-label'),box=$('cloud-status');
  if(dot){dot.className='cloud-dot'+(kind?' '+kind:'')}
  if(label)label.textContent=text||'Nube';
  if(box)box.textContent=text||'Nube';
  actualizarEstadoBibliotecaUI();
}
function abrirCloud(){
  $('cloud-modal').classList.add('open');
  $('cloud-url').value=localStorage.getItem(CLOUD_URL_KEY)||DEFAULT_CLOUD_URL;
  $('cloud-key').value=localStorage.getItem(CLOUD_ANON_KEY)||DEFAULT_CLOUD_KEY;
  actualizarEstadoCloud();
}
function cerrarCloud(){$('cloud-modal').classList.remove('open')}
function crearCloudClient(){
  const url=localStorage.getItem(CLOUD_URL_KEY)||DEFAULT_CLOUD_URL,key=localStorage.getItem(CLOUD_ANON_KEY)||DEFAULT_CLOUD_KEY;
  if(!url||!key||!window.supabase){cloudClient=null;return false}
  try{cloudClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return true}catch(e){cloudClient=null;return false}
}
async function guardarConfigCloud(){
  const url=$('cloud-url').value.trim(),key=$('cloud-key').value.trim();
  if(!url||!key){alert('Introduce la Project URL y la anon/publishable key de Supabase.');return}
  localStorage.setItem(CLOUD_URL_KEY,url);localStorage.setItem(CLOUD_ANON_KEY,key);
  crearCloudClient();await initCloud();alert('Conexión guardada.');
}
async function initCloud(){
  if(!crearCloudClient()){setCloudUI('', 'Nube sin configurar');return}
  const {data:{session}}=await cloudClient.auth.getSession();
  cloudUser=session?.user||null;
  if(cloudUser){setCloudUI('online','Nube conectada');await bajarNube(false)}else setCloudUI('', 'Nube lista · inicia sesión');
  cloudClient.auth.onAuthStateChange(async(event,session)=>{cloudUser=session?.user||null;if(cloudUser){setCloudUI('online','Nube conectada');if(event==='SIGNED_IN')await bajarNube(false)}else setCloudUI('', 'Nube desconectada')});
}
async function cloudSignup(){
  if(!cloudClient&& !crearCloudClient()){alert('Primero configura Supabase.');return}
  const email=$('cloud-email').value.trim(),password=$('cloud-password').value;
  if(!email||password.length<6){alert('Introduce un correo y una contraseña de al menos 6 caracteres.');return}
  setCloudUI('syncing','Creando cuenta…');
  const {data,error}=await cloudClient.auth.signUp({email,password});
  if(error){setCloudUI('error','Error de cuenta');alert(error.message);return}
  cloudUser=data.user||null;
  if(data.session){await subirNube(false);setCloudUI('online','Nube conectada');alert('Cuenta creada y sincronización activada.')}else{setCloudUI('', 'Revisa tu correo');alert('Cuenta creada. Si Supabase pide confirmación por correo, confirma el mensaje y después pulsa Entrar.')}
}
async function cloudLogin(){
  if(!cloudClient&& !crearCloudClient()){alert('Primero configura Supabase.');return}
  const email=$('cloud-email').value.trim(),password=$('cloud-password').value;
  if(!email||!password){alert('Introduce correo y contraseña.');return}
  setCloudUI('syncing','Conectando…');
  const {data,error}=await cloudClient.auth.signInWithPassword({email,password});
  if(error){setCloudUI('error','Error al entrar');alert(error.message);return}
  cloudUser=data.user;await bajarNube(false);setCloudUI('online','Nube conectada');alert('Sincronización activada en este dispositivo.')
}
async function cloudLogout(){if(cloudClient)await cloudClient.auth.signOut();cloudUser=null;setCloudUI('', 'Nube desconectada')}
async function actualizarEstadoCloud(){
  if(!cloudClient)crearCloudClient();
  if(!cloudClient){setCloudUI('', 'Nube sin configurar');return}
  const {data:{session}}=await cloudClient.auth.getSession();cloudUser=session?.user||null;
  setCloudUI(cloudUser?'online':'',cloudUser?('Conectado: '+cloudUser.email):'Nube lista · inicia sesión');
}
function programarSubidaCloud(){
  if(cloudApplying||!cloudUser||!navigator.onLine)return;
  clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(()=>subirNube(false),900);
}
async function subirNube(manual=false){
  if(!cloudClient||!cloudUser){if(manual)alert('Inicia sesión en la nube primero.');return}
  setCloudUI('syncing','Sincronizando…');
  const payload={user_id:cloudUser.id,state:estadoLocal(),updated_at:new Date().toISOString()};
  const {error}=await cloudClient.from('volley_state').upsert(payload,{onConflict:'user_id'});
  if(error){setCloudUI('error','Error de sincronización');if(manual)alert(error.message);return}
  localStorage.setItem('volleyCloudLastSync',payload.updated_at);setCloudUI('online','Nube sincronizada');$('save-indicator').textContent='✓ Guardado y sincronizado';
  if(manual)alert('Datos subidos a la nube.')
}
async function bajarNube(manual=false){
  if(!cloudClient||!cloudUser){if(manual)alert('Inicia sesión en la nube primero.');return}
  setCloudUI('syncing','Descargando…');
  const {data,error}=await cloudClient.from('volley_state').select('state,updated_at').eq('user_id',cloudUser.id).maybeSingle();
  if(error){setCloudUI('error','Error de sincronización');if(manual)alert(error.message);return}
  if(!data){await subirNube(false);if(manual)alert('La nube estaba vacía. Se han subido los datos de este dispositivo.');return}
  aplicarEstadoCloud(data.state);localStorage.setItem('volleyCloudLastSync',data.updated_at||'');setCloudUI('online','Nube sincronizada');$('save-indicator').textContent='✓ Datos sincronizados';
  if(manual)alert('Datos descargados de la nube.')
}
window.addEventListener('online',()=>{if(cloudUser)subirNube(false)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){procesarArchivadoAutomaticoPlanificaciones();if(cloudUser)bajarNube(false)}});


// ===== V5.8.9 CLOUD LIBRARY : biblioteca independiente + PDF con porcentajes robustos =====
// ===== V5.8 PROFESSIONAL+ : resumen, planificación, biblioteca, plantillas y PDF =====
let vistaPlanificacion='semana';
let vistaBiblioteca='compacta';
let modoModalPlantillas='usar';

function fundamentosSesionUnicos(){const s=new Set();sesionActual.forEach(id=>{const e=baseDeDatos.find(x=>x.id===id);if(e)normalizarFundamentos(e).forEach(f=>s.add(f))});return [...s]}

// Sustituye el reparto por Top 3 + Otros para que sea legible como software de planificación.
function renderFocoSesion(grupos,total){
  const lista=[];Object.values(grupos||{}).forEach(arr=>(arr||[]).forEach(e=>lista.push(e)));
  const conteo=fundamentosConMinutos(lista),vals=Object.entries(conteo).sort((a,b)=>b[1]-a[1]);
  const bar=$('session-focus-bar'),leg=$('session-focus-legend'),copy=$('session-focus-copy');if(!bar||!leg)return;
  if(!vals.length){bar.innerHTML='';leg.innerHTML='';if(copy)copy.textContent='Añade ejercicios para ver el reparto';return}
  const sum=vals.reduce((a,x)=>a+x[1],0)||1,top=vals.slice(0,3),rest=vals.slice(3).reduce((a,x)=>a+x[1],0);
  const visual=[...top,...(rest>0?[['Otros',rest]]:[])];
  bar.innerHTML=visual.map(([f,m])=>`<span class="session-focus-seg" title="${esc(f)} ${Math.round(m/sum*100)}%" style="width:${m/sum*100}%"></span>`).join('');
  leg.innerHTML=visual.map(([f,m])=>`<span>${esc(f)} <b>${Math.round(m/sum*100)}%</b></span>`).join('');
  if(copy)copy.textContent=`${vals.length} fundamentos · ${total} min preparados`;
}

const _renderizarSesionV58=renderizarSesion;
renderizarSesion=function(){
  _renderizarSesionV58();
  const nf=fundamentosSesionUnicos().length;if($('num-fundamentos'))$('num-fundamentos').textContent=nf;
};

function setVistaPlanificacion(v){vistaPlanificacion=v==='mes'?'mes':'semana';$('plan-view-week')?.classList.toggle('active',vistaPlanificacion==='semana');$('plan-view-month')?.classList.toggle('active',vistaPlanificacion==='mes');renderPlanificacion()}
function cambiarPeriodoPlan(dir){if(vistaPlanificacion==='mes')semanaBase.setMonth(semanaBase.getMonth()+dir,1);else semanaBase.setDate(semanaBase.getDate()+dir*7);renderPlanificacion()}
function irHoyPlanificacion(){semanaBase=new Date();renderPlanificacion()}
function cambiarSemana(n){semanaBase.setDate(semanaBase.getDate()+n);renderPlanificacion()}
function estadoPlanificacion(p,hoy){if(p.realizado)return {clase:'done',texto:'Realizado'};if(Number(meta.planificacionId)===Number(p.id))return {clase:'editing',texto:'En edición'};if(p.historialId)return {clase:'pending',texto:'En Historial · pendiente de marcar'};if(p.fecha<=hoy)return {clase:'pending',texto:'Pendiente'};return {clase:'future',texto:'Planificado'}}
function editarEntrenamientoPlanificacion(id){
  const p=planificacion.find(x=>Number(x.id)===Number(id));if(!p)return;
  if(p.realizado){alert('Este entrenamiento ya está marcado como realizado. Puedes reutilizarlo, pero no editar el registro completado desde Planificación.');return}
  usarPlan(id);
  setTimeout(()=>{if($('save-indicator'))$('save-indicator').textContent='✎ Editando entrenamiento de Planificación · usa «Guardar en planificación» para conservar los cambios'},50);
}
function tarjetaPlanProHTML(p,hoy){
  const st=estadoPlanificacion(p,hoy),n=(p.ejercicios||[]).length,min=Number(p.duracion)||minutosListaEjercicios(p.ejercicios||[])||0;
  return `<article class="plan-pro-card ${st.clase}"><div class="plan-pro-status">${st.texto}</div><div class="plan-pro-title">${esc(p.objetivo||'Sesión sin objetivo')}</div><div class="plan-pro-meta">${min} min · ${n} ejercicio${n===1?'':'s'} · ${esc(p.intensidad||'Media')}</div>${p.historialId&&!p.realizado?'<div class="plan-manual-note">Historial guardado · falta confirmar realizado</div>':''}<div class="plan-pro-actions">${p.realizado?`<button class="ghost" onclick="verPlanEnEntrenamientos(${p.id})">Historial</button><button class="ghost" onclick="usarPlan(${p.id})">Reutilizar</button>`:`<button class="ghost" onclick="editarEntrenamientoPlanificacion(${p.id})">✎ Editar</button>${p.historialId?`<button class="ghost" onclick="verPlanEnEntrenamientos(${p.id})">Historial</button>`:''}${p.fecha<=hoy?`<button class="success" onclick="marcarPlanRealizado(${p.id})">✓ Realizado</button>`:''}`}<button class="danger" onclick="eliminarPlan(${p.id})" title="Eliminar de Planificación">×</button></div></article>`
}
function renderPlanificacion(){
  const hoy=fechaLocalISO(),week=$('week-grid'),month=$('month-grid');if(!week||!month)return;
  $('plan-view-week')?.classList.toggle('active',vistaPlanificacion==='semana');$('plan-view-month')?.classList.toggle('active',vistaPlanificacion==='mes');
  if(vistaPlanificacion==='semana'){
    const lunes=lunesDeSemana(semanaBase),fin=new Date(lunes);fin.setDate(lunes.getDate()+6);
    $('week-label').textContent=`${lunes.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} — ${fin.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}`;
    const dias=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    week.classList.remove('hidden');month.classList.add('hidden');
    week.innerHTML=dias.map((nom,i)=>{const d=new Date(lunes);d.setDate(lunes.getDate()+i);const fecha=isoDate(d),items=planificacion.filter(p=>p.fecha===fecha).sort((a,b)=>a.id-b.id);return `<div class="planning-day${fecha===hoy?' is-today':''}"><div class="planning-day-head"><strong>${nom}</strong><div class="planning-day-date"><b>${d.getDate()}</b><button class="plan-day-add" onclick="event.stopPropagation();crearSesionDiaPlanificacion('${fecha}')" title="Crear entrenamiento este día">+</button></div></div>${items.map(p=>tarjetaPlanProHTML(p,hoy)).join('')||'<div class="small" style="color:#a0a9b1;padding:8px 0">Sin sesión</div>'}</div>`}).join('');
  }else{
    const base=new Date(semanaBase.getFullYear(),semanaBase.getMonth(),1),year=base.getFullYear(),mon=base.getMonth();
    $('week-label').textContent=base.toLocaleDateString('es-ES',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());week.classList.add('hidden');month.classList.remove('hidden');
    const lunesCab=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(x=>`<div class="month-weekday">${x}</div>`).join('');
    const first=lunesDeSemana(base),last=new Date(year,mon+1,0),end=lunesDeSemana(last);end.setDate(end.getDate()+6);let cells='';
    for(let d=new Date(first);d<=end;d.setDate(d.getDate()+1)){const fecha=isoDate(d),outside=d.getMonth()!==mon,items=planificacion.filter(p=>p.fecha===fecha);cells+=`<div class="month-cell${outside?' outside':''}${fecha===hoy?' today':''}"><div class="month-day-head"><div class="month-day-num">${d.getDate()}</div><button class="month-day-add" onclick="event.stopPropagation();crearSesionDiaPlanificacion('${fecha}')" title="Crear entrenamiento este día">+</button></div>${items.map(p=>{const st=estadoPlanificacion(p,hoy);return `<button class="month-plan ${st.clase}" onclick="editarEntrenamientoPlanificacion(${p.id})" title="Editar: ${esc(p.objetivo||'Sesión')}">${esc(p.objetivo||'Sesión')} · ${Number(p.duracion)||0}m</button>`}).join('')}</div>`}
    month.innerHTML=lunesCab+cells;
  }
  renderAvisoPlanHoy();
}

function setVistaBiblioteca(v){vistaBiblioteca=v==='detallada'?'detallada':'compacta';$('lib-view-compact')?.classList.toggle('active',vistaBiblioteca==='compacta');$('lib-view-detail')?.classList.toggle('active',vistaBiblioteca==='detallada');filtrarEjercicios()}
function filtrarPorChipBiblioteca(f){
  document.querySelectorAll('input[name="filtro-fundamento"]').forEach(c=>c.checked=false);
  if(f){const c=[...document.querySelectorAll('input[name="filtro-fundamento"]')].find(x=>x.value===f);if(c)c.checked=true}
  filtrarEjercicios();
}
function renderConteoBiblioteca(){
  const grupos=['Recepción','Ataque','Colocación','Bloqueo','Defensa','Reconstrucción','Juegos','Saque','Control'];
  const total=Array.isArray(baseDeDatos)?baseDeDatos.length:0;
  const datos=[['','Total',total],...grupos.map(g=>[g,g,baseDeDatos.filter(e=>normalizarFundamentos(e).includes(g)).length])];
  if($('biblioteca-total-big'))$('biblioteca-total-big').textContent=total;
  if($('dash-library'))$('dash-library').textContent=total;
  if($('stat-ejercicios'))$('stat-ejercicios').textContent=total;
  const box=$('conteo-biblioteca');if(box)box.innerHTML=datos.map(([f,g,n])=>`<button class="library-count-chip" onclick="filtrarPorChipBiblioteca('${f}')">${g}<b>${n}</b></button>`).join('');
}
function renderizar(datos){
  const detallada=vistaBiblioteca==='detallada';
  $('contenedor-principal').innerHTML=datos.map(e=>{
    const uso=usoEjercicioGlobal(e.id,e.nombre),enSesion=sesionActual.includes(e.id),actual=enSesion?seccionEjercicioSesion(e.id,e):null,moverA=seccionDestinoSesion&&enSesion&&actual!==seccionDestinoSesion;
    const fs=normalizarFundamentos(e),chips=[...fs,e.tipo||'',`${Number(e.tiempo)||0} min`,e.escuela||''].filter(Boolean).map(x=>`<span class="library-pro-chip">${esc(x)}</span>`).join('');
    const addText=moverA?`Mover a ${SECCIONES_ENTRENO[seccionDestinoSesion].titulo}`:(enSesion?'En sesión ✓':(seccionDestinoSesion?`Añadir a ${SECCIONES_ENTRENO[seccionDestinoSesion].titulo}`:'Añadir al entrenamiento'));
    const useChips=(team)=>uso[team].slice().sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).map(u=>`<span class="usage-chip">${esc(u.fecha)}${u.objetivo?' · '+esc(u.objetivo):''}</span>`).join('')||'<span class="small">Sin usos</span>';
    return `<div class="library-pro-row"><div class="library-pro-main"><div><div class="library-pro-name">${e.favorito?'★ ':''}${esc(e.nombre)}</div><div class="library-pro-sub">${chips}</div></div><div class="library-pro-actions"><button class="library-add-btn ${enSesion&&!moverA?'in-session':''}" onclick="añadirASesion(${e.id})">${esc(addText)}</button><button class="ghost" onclick="toggleInfo(${e.id})">Ficha</button><button class="ghost" onclick="toggleExerciseStats(${e.id})">Uso</button></div></div>${detallada?`<div class="library-detail-copy"><div><b>Función</b>${esc(e.objetivo||'Sin función definida')}</div><div><b>Desarrollo</b>${esc(e.descripcion||'Sin descripción')}</div></div>`:''}<div id="stats-ex-${e.id}" class="exercise-inline-panel"><div class="exercise-stat-grid"><div class="exercise-stat-mini"><span class="small">Usos totales</span><b>${uso.totalUsos}</b></div><div class="exercise-stat-mini"><span class="small">Minutos</span><b>${uso.totalMinutos}</b></div><div class="exercise-stat-mini"><span class="small">Infantil</span><b>${uso.infantil.length}</b></div><div class="exercise-stat-mini"><span class="small">Cadete</span><b>${uso.cadete.length}</b></div></div><p><b>Infantil Masculino</b></p><div class="exercise-use-list">${useChips('infantil')}</div><p style="margin-top:10px"><b>Cadete Masculino</b></p><div class="exercise-use-list">${useChips('cadete')}</div></div><div id="detalles-${e.id}" class="exercise-inline-panel"><div class="library-detail-copy"><div><b>Función</b>${esc(e.objetivo||'-')}</div><div><b>Desarrollo</b>${esc(e.descripcion||'-')}</div><div><b>Organización</b>${esc([e.formato,e.jugadores,e.material].filter(Boolean).join(' · ')||'-')}</div><div><b>Variantes</b>${esc(e.variantes||'-')}</div></div><div class="library-inline-actions"><button class="ghost" onclick="toggleFav(${e.id})">${e.favorito?'Quitar favorito':'Favorito'}</button><button class="ghost" onclick='fillForm(${JSON.stringify(e).replace(/'/g,"&#39;")})'>Editar</button><button class="ghost" onclick="duplicarEjercicio(${e.id})">Duplicar</button><button class="danger" onclick="eliminarEjercicio(${e.id})">Borrar</button></div></div></div>`
  }).join('')||'<div class="empty">No hay ejercicios con estos filtros.</div>';
}

function abrirModalPlantillas(modo='usar'){modoModalPlantillas=modo;const m=$('templates-modal');if(!m)return;m.classList.add('open');if($('template-save-area'))$('template-save-area').style.display=modo==='guardar'?'flex':'none';renderPlantillasModal();setTimeout(()=>$('template-name')?.focus(),80)}
function cerrarModalPlantillas(){$('templates-modal')?.classList.remove('open')}
function renderPlantillasModal(){
  const box=$('templates-list');if(!box)return;const lista=[...(plantillas||[])].sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),'es'));
  box.innerHTML=lista.length?lista.map(t=>`<div class="template-card"><div><strong>${esc(t.nombre||'Plantilla')}</strong><small>${(t.ejercicios||[]).length} ejercicios · ${Number(t.duracion)||minutosListaEjercicios(t.ejercicios||[])} min${t.objetivo?' · '+esc(t.objetivo):''}</small></div><div class="template-actions"><button class="primary" onclick="usarPlantilla(${t.id})">Usar</button><button class="danger" onclick="borrarPlantilla(${t.id})">Borrar</button></div></div>`).join(''):'<div class="template-empty">Todavía no hay plantillas guardadas para este equipo.</div>';
}
function guardarPlantillaActualDesdeModal(){
  guardarSesionMeta();const nombre=$('template-name')?.value.trim();if(!nombre){alert('Escribe un nombre para la plantilla.');return}if(!sesionActual.length&&!Object.values(mapaNotasBloques()).some(v=>String(v||'').trim())){alert('La sesión está vacía.');return}
  const snap=construirPlanSesion(Date.now()),obj={...snap,id:Date.now(),nombre,fecha:'',planificacionId:null,realizado:false,historialId:null};
  const pos=plantillas.findIndex(x=>String(x.nombre||'').toLowerCase()===nombre.toLowerCase());if(pos>=0)plantillas[pos]=obj;else plantillas.push(obj);save();$('template-name').value='';renderPlantillasModal();$('save-indicator').textContent='✓ Plantilla guardada';
}
function usarPlantilla(id){
  const t=plantillas.find(x=>x.id===id);if(!t)return;const ids=(t.ejercicios||[]).map(x=>x.id).filter(id=>baseDeDatos.some(e=>e.id===id));sesionActual=ids;const secciones=normalizarMapaSecciones(clonar(t.seccionesEjercicios||{}));(t.ejercicios||[]).forEach(x=>{if(x.id!=null&&ids.includes(x.id)&&!secciones[String(x.id)])secciones[String(x.id)]=normalizarSeccionEntreno(x.seccionSesion,enriquecerEjercicioGuardado(x))});
  meta={fecha:fechaLocalISO(),equipo:EQUIPOS[equipoActivo].nombre,jugadores:t.jugadores||'',duracionObjetivo:t.duracionObjetivo||'',intensidad:t.intensidad||'Media',objetivo:t.objetivo||'',calentamiento:t.calentamiento||'',notas:t.notas||'',seccionesEjercicios:secciones,notasBloques:normalizarNotasEntreno(t.notasBloques||{},t.calentamiento||''),planificacionId:null,pizarra:null};save();cargarMeta();renderizarSesion();filtrarEjercicios();cerrarModalPlantillas();showView('entrenamiento',botonVista('entrenamiento'));
}
function borrarPlantilla(id){if(!confirm('¿Borrar esta plantilla?'))return;plantillas=plantillas.filter(x=>x.id!==id);save();renderPlantillasModal()}
function nuevaSesionVacia(){if((sesionActual.length||String(meta.objetivo||'').trim())&&!confirm('¿Crear una sesión vacía? La sesión actual seguirá guardada solo si antes la has añadido a Planificación o al Historial.'))return;reiniciarSesionActual();showView('entrenamiento',botonVista('entrenamiento'))}

// PDF profesional: portada ejecutiva + sesión por fases.
function generarPDFEntrenamiento(h,equipoNombre){
  try{
    if(!window.jspdf||!window.jspdf.jsPDF)throw new Error('jsPDF no disponible');
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),M=15,FOOT=13,LH=4.6;
    const navy=[16,43,67],navy2=[28,66,96],muted=[102,116,128],light=[245,247,249],line=[213,221,227],orange=[233,154,50],green=[63,124,99];let y=15;
    const normal=(s=9.5,c=navy)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(s);pdf.setTextColor(...c)},bold=(s=9.5,c=navy)=>{pdf.setFont('helvetica','bold');pdf.setFontSize(s);pdf.setTextColor(...c)};
    const nueva=()=>{pdf.addPage();y=15},aseg=(a=6)=>{if(y+a>H-FOOT)nueva()};
    const txt=(v)=>limpiarTextoPDF(v);
    const campo=(lab,val,op={})=>{const t=txt(val)||'-',sz=op.size||9.2,x=op.x||M,right=op.right||W-M;bold(sz);const lw=pdf.getTextWidth(lab+': '),vx=x+lw,max=Math.max(24,right-vx);normal(sz);const ls=pdf.splitTextToSize(t,max);ls.forEach((l,i)=>{aseg(LH+1);if(i===0){bold(sz);pdf.text(lab+':',x,y);normal(sz);pdf.text(l,vx,y)}else pdf.text(l,vx,y);y+=LH});y+=op.after??1.2};
    const footer=(page,total)=>{pdf.setPage(page);normal(7.7,muted);pdf.text(`Volley Coach · ${txt(equipoNombre||h.equipo||'Equipo')} · ${txt(h.fecha)||fechaLocalISO()} · ${page}/${total}`,M,H-6)};
    // Resumen robusto: recupera los fundamentos desde la biblioteca si el historial es antiguo
    // y, si los ejercicios no tienen minutos asignados, calcula el reparto por peso de ejercicios.
    const lista=(h.ejercicios||[]).map(e=>{
      if(e!=null&&(typeof e==='number'||typeof e==='string')){
        return baseDeDatos.find(x=>Number(x.id)===Number(e))||{id:Number(e)};
      }
      return enriquecerEjercicioGuardado(e);
    });
    let fund=fundamentosConMinutos(lista);
    let vals=Object.entries(fund).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
    let sum=vals.reduce((a,x)=>a+Number(x[1]||0),0);
    if(!(sum>0)){
      fund={};
      lista.forEach(e=>{
        const fs=normalizarFundamentos(e);
        if(!fs.length)return;
        const peso=1/fs.length;
        fs.forEach(f=>fund[f]=(fund[f]||0)+peso);
      });
      vals=Object.entries(fund).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
      sum=vals.reduce((a,x)=>a+Number(x[1]||0),0);
    }
    if(!(sum>0))sum=1;
    // Portada
    pdf.setFillColor(...navy);pdf.rect(0,0,W,43,'F');bold(8,[210,221,230]);pdf.text('VOLLEY COACH · DOSSIER DE ENTRENAMIENTO',M,14);bold(23,[255,255,255]);pdf.text(txt(equipoNombre||h.equipo||'Equipo'),M,25);normal(10,[210,221,230]);pdf.text(txt(h.fecha)||fechaLocalISO(),M,33);y=55;
    bold(9,muted);pdf.text('OBJETIVO PRINCIPAL',M,y);y+=6;bold(15,navy);const obj=pdf.splitTextToSize(txt(h.objetivo)||'Sesión de entrenamiento',W-M*2);pdf.text(obj,M,y);y+=obj.length*6+7;
    const metrics=[['Duración',`${Number(h.duracion)||minutosListaEjercicios(lista)} min`],['Asistentes',txt(h.jugadores)||'—'],['Intensidad',txt(h.intensidad)||'Media'],['Ejercicios',String(lista.length)]];
    const gap=3,cw=(W-M*2-gap*3)/4;metrics.forEach(([a,b],i)=>{const x=M+i*(cw+gap);pdf.setFillColor(...light);pdf.roundedRect(x,y,cw,20,2,2,'F');normal(7.5,muted);pdf.text(a.toUpperCase(),x+4,y+6);bold(12,navy);pdf.text(b,x+4,y+14)});y+=29;
    bold(9,muted);pdf.text('RESUMEN DE CONTENIDOS',M,y);y+=7;
    const visual=[...vals.slice(0,4)];const other=vals.slice(4).reduce((a,x)=>a+Number(x[1]||0),0);if(other>0)visual.push(['Otros',other]);
    if(!visual.length){
      normal(9,muted);pdf.text('Sin fundamentos registrados en los ejercicios de esta sesión.',M,y);y+=8;
    }else{
      const raw=visual.map(([,m])=>Number(m||0)/sum*100),pct=raw.map(Math.floor);
      let faltan=100-pct.reduce((a,b)=>a+b,0);
      raw.map((v,i)=>[i,v-Math.floor(v)]).sort((a,b)=>b[1]-a[1]).forEach(([i])=>{if(faltan>0){pct[i]++;faltan--}});
      visual.forEach(([f,m],i)=>{const p=pct[i]||0;normal(9,navy);pdf.text(`${f} · ${p}%`,M,y);const bx=M+47,bw=W-M-bx;pdf.setFillColor(233,237,240);pdf.roundedRect(bx,y-3,bw,4,2,2,'F');pdf.setFillColor(...(i===0?navy2:i===1?orange:i===2?green:[132,151,166]));pdf.roundedRect(bx,y-3,Math.max(2,bw*p/100),4,2,2,'F');y+=8});
    }
    y+=4;bold(9,muted);pdf.text('ESTRUCTURA',M,y);y+=7;const grupos=ejerciciosPorBloques(lista);ORDEN_SECCIONES_ENTRENO.forEach(slug=>{const items=grupos[slug]||[],mins=minutosListaEjercicios(items);if(!items.length&&!txt((h.notasBloques||{})[slug]))return;normal(9.2,navy);pdf.text(`${SECCIONES_ENTRENO[slug].numero}  ${SECCIONES_ENTRENO[slug].titulo}`,M,y);bold(9.2,navy);pdf.text(`${items.length} ej. · ${mins} min`,W-M,y,{align:'right'});y+=7});
    normal(8,muted);pdf.text('Documento generado desde Volley Coach',M,H-15);
    // Cuerpo
    nueva();
    const bloqueTitulo=(t)=>{aseg(12);bold(13,navy);pdf.text(txt(t),M,y);y+=3;pdf.setDrawColor(...line);pdf.line(M,y,W-M,y);y+=6};
    const dibujarPista=(x,yy,w=39,h=20)=>{pdf.setDrawColor(125,139,153);pdf.setLineWidth(.28);pdf.rect(x,yy,w,h);const c=x+w/2,a=w/6;pdf.setLineWidth(.48);pdf.line(c,yy,c,yy+h);pdf.setLineWidth(.2);pdf.line(c-a,yy,c-a,yy+h);pdf.line(c+a,yy,c+a,yy+h)};
    let contador=0;const notas=normalizarNotasEntreno(h.notasBloques||{},h.calentamiento||'');
    ORDEN_SECCIONES_ENTRENO.forEach(slug=>{const items=grupos[slug]||[],nota=txt(notas[slug]);if(!items.length&&!nota)return;bloqueTitulo(`${SECCIONES_ENTRENO[slug].numero} ${SECCIONES_ENTRENO[slug].titulo}`);if(nota){campo('Notas de fase',nota,{size:8.8,after:2})}items.forEach(e0=>{const e=enriquecerEjercicioGuardado(e0),name=txt(e.nombre)||'Ejercicio',time=Number(e.tiempo)||0,pw=39,px=W-M-pw,pr=px-5;aseg(36);pdf.setFillColor(...light);pdf.roundedRect(M,y-4,W-M*2,7,1.5,1.5,'F');bold(10.2,navy);pdf.text(`${++contador}. ${name}`,M+2,y);normal(9,muted);pdf.text(`${time} min`,W-M-2,y,{align:'right'});y+=7;const py=y+1,page=pdf.getCurrentPageInfo().pageNumber;dibujarPista(px,py,pw,20);campo('Función',e.objetivo,{size:9,right:pr});campo('Desarrollo',e.descripcion,{size:9,right:pr});const org=[e.formato?`Formato: ${txt(e.formato)}`:'',e.jugadores?`Jugadores: ${txt(e.jugadores)}`:'',e.material?`Material: ${txt(e.material)}`:''].filter(Boolean).join(' · ');campo('Organización',org||'-',{size:9,right:pr});if(txt(e.errores))campo('Claves',e.errores,{size:9,right:pr});if(txt(e.variantes))campo('Variantes',e.variantes,{size:9,right:pr});if(pdf.getCurrentPageInfo().pageNumber===page)y=Math.max(y,py+24);normal(7.8,muted);pdf.text([fundamentosTexto(e),e.tipo||'',e.intensidad||''].filter(Boolean).join(' · '),M,y);y+=7})});
    if(txt(h.notas)){bloqueTitulo('Notas del entrenador');normal(9.2,navy);pdf.splitTextToSize(txt(h.notas),W-M*2).forEach(l=>{aseg(LH);pdf.text(l,M,y);y+=LH})}
    const totalPages=pdf.getNumberOfPages();for(let p=1;p<=totalPages;p++)footer(p,totalPages);const fecha=txt(h.fecha)||fechaLocalISO(),clean=String(equipoNombre||h.equipo||'Equipo').replace(/[^a-z0-9áéíóúüñ_-]+/gi,'_');pdf.save(`Entrenamiento_${clean}_${fecha}.pdf`);
  }catch(err){console.error(err);alert('No se pudo generar el PDF. Comprueba la conexión e inténtalo de nuevo.')}
}


const _fillFormV58=fillForm;
fillForm=function(e){_fillFormV58(e);const d=document.querySelector('.library-create-panel');if(d)d.setAttribute('open','');if($('form-title'))$('form-title').textContent='Editar ejercicio'};
const _cancelarEdicionV58=cancelarEdicion;
cancelarEdicion=function(){_cancelarEdicionV58();if($('form-title'))$('form-title').textContent='Nuevo ejercicio'};
const _abrirCrearEjercicioV58=abrirCrearEjercicioParaSeccion;
abrirCrearEjercicioParaSeccion=function(slug){_abrirCrearEjercicioV58(slug);const d=document.querySelector('.library-create-panel');if(d)d.setAttribute('open','');if($('form-title'))$('form-title').textContent='Crear ejercicio para '+SECCIONES_ENTRENO[normalizarSeccionEntreno(slug)].numero+' · '+SECCIONES_ENTRENO[normalizarSeccionEntreno(slug)].titulo};
const _guardarPlanV58=guardarPlan;
guardarPlan=function(){_guardarPlanV58();document.querySelector('.planning-quick-create')?.removeAttribute('open')};


// ===== V5.8.2 · posicionamiento seguro del menú de acciones de ejercicios =====
function posicionarMenuEjercicio(details){
  if(!details || !details.open)return;
  const boton=details.querySelector(':scope > summary');
  const menu=details.querySelector('.exercise-menu-pop');
  if(!boton || !menu)return;
  const margen=10, separacion=6;
  menu.style.visibility='hidden';
  menu.style.left='0px';
  menu.style.top='0px';
  const r=boton.getBoundingClientRect();
  const ancho=menu.offsetWidth;
  const alto=menu.offsetHeight;
  let left=r.right-ancho;
  left=Math.max(margen,Math.min(left,window.innerWidth-ancho-margen));
  let top=r.bottom+separacion;
  if(top+alto>window.innerHeight-margen){
    const arriba=r.top-alto-separacion;
    top=arriba>=margen?arriba:Math.max(margen,window.innerHeight-alto-margen);
  }
  menu.style.left=Math.round(left)+'px';
  menu.style.top=Math.round(top)+'px';
  menu.style.visibility='visible';
}
function recolocarMenusEjercicio(){
  document.querySelectorAll('.exercise-menu[open]').forEach(posicionarMenuEjercicio);
}
document.addEventListener('toggle',event=>{
  const details=event.target;
  if(!(details instanceof HTMLDetailsElement) || !details.classList.contains('exercise-menu'))return;
  if(details.open){
    document.querySelectorAll('.exercise-menu[open]').forEach(other=>{if(other!==details)other.removeAttribute('open')});
    requestAnimationFrame(()=>posicionarMenuEjercicio(details));
  }
},true);
window.addEventListener('resize',()=>requestAnimationFrame(recolocarMenusEjercicio));
window.addEventListener('scroll',()=>requestAnimationFrame(recolocarMenusEjercicio),true);
document.addEventListener('pointerdown',event=>{
  document.querySelectorAll('.exercise-menu[open]').forEach(details=>{
    if(!details.contains(event.target))details.removeAttribute('open');
  });
},true);

if(!localStorage.getItem(CLOUD_URL_KEY))localStorage.setItem(CLOUD_URL_KEY,DEFAULT_CLOUD_URL);
if(!localStorage.getItem(CLOUD_ANON_KEY))localStorage.setItem(CLOUD_ANON_KEY,DEFAULT_CLOUD_KEY);
actualizarSelectorEquipo();cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderDashboard();programarArchivadoAlCambiarDia();actualizarEstadoBibliotecaUI();initCloud();
renderConteoBiblioteca(); // V5.8.9 conteo real de la biblioteca persistente
