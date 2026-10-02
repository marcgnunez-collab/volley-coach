/* Volley Coach - núcleo de aplicación, estado, almacenamiento y nube */

const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const defaults=[
{id:1,nombre:'Due Tocchi',escuela:'Italia',fundamento:'Recepción',formato:'3v3',descripcion:'El equipo solo tiene 2 toques por jugada.',objetivo:'Acelerar la transición recepción-ataque.',nivel:'Intermedio',intensidad:'Media',jugadores:'6',material:'Balones',variantes:'Limitar zonas de ataque.',errores:'Evitar precipitar el segundo toque.',video:'',favorito:false,usos:0,tiempo:15},
{id:2,nombre:'Il Cacciatore di Mani',escuela:'Italia',fundamento:'Ataque',formato:'6v6',descripcion:'Ataques al suelo valen 1 punto; block-out deliberado vale 3.',objetivo:'Trabajar decisiones de ataque contra bloqueo.',nivel:'Avanzado',intensidad:'Alta',jugadores:'12',material:'Balones',variantes:'Añadir saque obligatorio.',errores:'No buscar manos sin lectura previa.',video:'',favorito:false,usos:0,tiempo:15},
{id:3,nombre:'Torneo del Rey de la Pista',escuela:'Propia',fundamento:'Juegos',formato:'3v3',descripcion:'Rey de la pista competitivo.',objetivo:'Competición y continuidad.',nivel:'Iniciación',intensidad:'Alta',jugadores:'6-12',material:'Balones',variantes:'Puntuación doble por acción objetivo.',errores:'Evitar tiempos muertos largos.',video:'',favorito:true,usos:0,tiempo:20}
];
let baseDeDatos=[];

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
const OLD_TEAM_STORAGE_KEY='volleyCoachTeamsV42';
const ACTIVE_TEAM_KEY='volleyCoachActiveTeamV43';
const OLD_ACTIVE_TEAM_KEY='volleyCoachActiveTeamV42';
const EQUIPOS={
  infantil:{nombre:'Infantil Masculino',corto:'Infantil masc.'},
  cadete:{nombre:'Cadete Masculino',corto:'Cadete masc.'}
};
const SECCIONES_ENTRENO={
  controles:{titulo:'Control',tipo:null,fundamento:'Control',icono:'🎛️',nota:'Ejercicios con el fundamento Control al inicio del trabajo técnico.'},
  analiticos:{titulo:'Analíticos',tipo:'Analítico',icono:'🎯',nota:'Trabajo técnico analítico.'},
  especificos:{titulo:'Específicos',tipo:null,icono:'🧩',nota:'Aquí eliges tú cualquier ejercicio de la biblioteca.'},
  desarrollo:{titulo:'Desarrollo con el juego',tipo:'Puesta en juego',icono:'🔄',nota:'Muestra los ejercicios clasificados como Puesta en juego.'},
  reducidos:{titulo:'Juegos reducidos',tipo:'Juego reducido',icono:'🔹',nota:'Situaciones de juego reducido.'},
  juego:{titulo:'Juego',tipo:'Juego',icono:'🏐',nota:'Juego global.'}
};
let seccionDestinoSesion=null;
let crearEjercicioDestinoSesion=null;
let equipoActivo=localStorage.getItem(ACTIVE_TEAM_KEY)||localStorage.getItem(OLD_ACTIVE_TEAM_KEY)||'infantil';
if(!EQUIPOS[equipoActivo])equipoActivo='infantil';
let sesionActual=[],planificacion=[],historial=[];
let players=[],playerEvaluations=[],playerGoals=[];
let semanaBase=new Date(); let pizarraParaEjercicio=null;
let meta={fecha:new Date().toISOString().slice(0,10),equipo:EQUIPOS[equipoActivo].nombre,jugadores:'',intensidad:'Media',objetivo:'',calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},playerIds:[],exercisePlayers:{},rosterInitialized:false};
let equiposData=null;

function clonar(v){return JSON.parse(JSON.stringify(v))}
function estadoEquipoVacio(id){
  return {
    sesionActual:[],
    meta:{fecha:new Date().toISOString().slice(0,10),equipo:EQUIPOS[id].nombre,jugadores:'',intensidad:'Media',objetivo:'',calentamiento:'',notas:'',seccionesEjercicios:{},notasBloques:{},playerIds:[],exercisePlayers:{},rosterInitialized:false},
    historial:[],
    planificacion:[],
    players:[],
    playerEvaluations:[],
    playerGoals:[]
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
    players:Array.isArray(raw.players)?clonar(raw.players):[],
    playerEvaluations:Array.isArray(raw.playerEvaluations)?clonar(raw.playerEvaluations):[],
    playerGoals:Array.isArray(raw.playerGoals)?clonar(raw.playerGoals):[]
  };
}
function fusionarBibliotecas(...listas){
  const salida=[],ids=new Set(),firmas=new Set();
  listas.flat().filter(Boolean).forEach(origen=>{
    if(!origen||typeof origen!=='object')return;
    let e=clonar(origen);const fs=normalizarFundamentos(e);e.fundamentos=fs;e.fundamento=fs[0]||'';
    const firma=((e.nombre||'').trim().toLowerCase()+'|'+(e.descripcion||'').trim().toLowerCase());
    if(firma!=='|'&&firmas.has(firma))return;
    let id=Number(e.id)||Date.now()+salida.length;
    if(ids.has(id))id=Date.now()+salida.length+Math.floor(Math.random()*1000);
    e.id=id;ids.add(id);if(firma!=='|')firmas.add(firma);salida.push(e);
  });
  return salida.length?salida:clonar(defaults);
}
function convertirEstadoPersistido(d){
  if(!d)return null;
  if(Array.isArray(d)){
    return {bibliotecaCompartida:fusionarBibliotecas(d),equiposData:{infantil:estadoEquipoVacio('infantil'),cadete:estadoEquipoVacio('cadete')}};
  }
  if(Array.isArray(d.bibliotecaCompartida)&&d.equiposData){
    return {bibliotecaCompartida:fusionarBibliotecas(d.bibliotecaCompartida),equiposData:{infantil:limpiarEquipo(d.equiposData.infantil,'infantil'),cadete:limpiarEquipo(d.equiposData.cadete,'cadete')}};
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
function cargarEstadoLocal(){
  let estado=null;
  try{estado=convertirEstadoPersistido(JSON.parse(localStorage.getItem(APP_STORAGE_KEY)))}catch(_){estado=null}
  if(!estado)estado=migrarLocalAnterior();
  baseDeDatos=clonar(estado.bibliotecaCompartida||defaults);migrarFundamentos();
  equiposData=estado.equiposData||{infantil:estadoEquipoVacio('infantil'),cadete:estadoEquipoVacio('cadete')};
  ['infantil','cadete'].forEach(id=>equiposData[id]=limpiarEquipo(equiposData[id],id));
  guardarEstadoLocalSinCloud();
}
function guardarEstadoLocalSinCloud(){
  localStorage.setItem(APP_STORAGE_KEY,JSON.stringify({version:5.9,bibliotecaCompartida:clonar(baseDeDatos),equiposData:clonar(equiposData)}));
  localStorage.setItem(ACTIVE_TEAM_KEY,equipoActivo);
}
function guardarEquipoEnMemoria(){
  if(!equiposData)equiposData={};
  equiposData[equipoActivo]={
    sesionActual:clonar(sesionActual),
    meta:clonar({...meta,equipo:EQUIPOS[equipoActivo].nombre}),
    historial:clonar(historial),
    planificacion:clonar(planificacion),
    players:clonar(players),
    playerEvaluations:clonar(playerEvaluations),
    playerGoals:clonar(playerGoals)
  };
}
function cargarEquipoEnVariables(id){
  const s=limpiarEquipo(equiposData[id],id);
  equiposData[id]=s;
  sesionActual=clonar(s.sesionActual||[]);
  meta=clonar(s.meta||estadoEquipoVacio(id).meta);meta.equipo=EQUIPOS[id].nombre;
  historial=clonar(s.historial||[]);
  planificacion=clonar(s.planificacion||[]);
  players=clonar(s.players||[]);
  playerEvaluations=clonar(s.playerEvaluations||[]);
  playerGoals=clonar(s.playerGoals||[]);
  if(typeof reconcilePlayerState==='function')reconcilePlayerState();
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
  actualizarSelectorEquipo();cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderHistorial();renderStats();if(typeof renderPlayers==='function')renderPlayers();
  limpiarPizarra();if(meta.pizarra)setTimeout(()=>aplicarPizarra(meta.pizarra),60);
  $('save-indicator').textContent='✓ '+EQUIPOS[id].nombre+' cargado · biblioteca compartida';
}
cargarEstadoLocal();
cargarEquipoEnVariables(equipoActivo);

function save(){meta.equipo=EQUIPOS[equipoActivo].nombre;guardarEquipoEnMemoria();guardarEstadoLocalSinCloud();$('save-indicator').textContent='✓ Guardado · '+EQUIPOS[equipoActivo].corto+' · biblioteca compartida';programarSubidaCloud();}
function showView(id,btn){if(id!=='ejercicios'){seccionDestinoSesion=null;crearEjercicioDestinoSesion=null}document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');if(id==='ejercicios')renderDestinoBiblioteca();if(id==='planificacion')renderPlanificacion();if(id==='historial')renderHistorial();if(id==='estadisticas')renderStats();if(id==='jugadores'&&typeof renderPlayers==='function')renderPlayers();}
function botonVista(id){const orden=['entrenamiento','ejercicios','jugadores','planificacion','historial','estadisticas'];return document.querySelectorAll('.tab-btn')[orden.indexOf(id)]||null}
function abrirBibliotecaNormal(btn){const estabaCreando=!!crearEjercicioDestinoSesion;seccionDestinoSesion=null;crearEjercicioDestinoSesion=null;if(estabaCreando)cancelarEdicion();showView('ejercicios',btn);renderDestinoBiblioteca()}
// ===== VOLLEY COACH CLOUD SYNC (Supabase) =====
let cloudClient=null, cloudUser=null, cloudSaveTimer=null, cloudApplying=false;
const CLOUD_URL_KEY='volleyCoachSupabaseUrlV2';
const CLOUD_ANON_KEY='volleyCoachSupabaseAnonKeyV2';
const DEFAULT_CLOUD_URL='https://iyoxalmcboeomnqgbxdi.supabase.co';
const DEFAULT_CLOUD_KEY='sb_publishable_PsRLv4V2ZG9CjuIcGK0o2g_h8dlLW_z';
function estadoLocal(){guardarEquipoEnMemoria();return {version:5.9,bibliotecaCompartida:clonar(baseDeDatos),equiposData:clonar(equiposData),updatedAt:new Date().toISOString()}}
function aplicarEstadoCloud(s){
  if(!s)return;
  cloudApplying=true;
  const eraAnterior=!(Array.isArray(s.bibliotecaCompartida)&&s.equiposData);
  const conv=convertirEstadoPersistido(s);
  if(!conv){cloudApplying=false;return}
  baseDeDatos=clonar(conv.bibliotecaCompartida);migrarFundamentos();
  equiposData=conv.equiposData;
  ['infantil','cadete'].forEach(id=>equiposData[id]=limpiarEquipo(equiposData[id],id));
  guardarEstadoLocalSinCloud();
  cargarEquipoEnVariables(equipoActivo);
  actualizarSelectorEquipo();
  cargarMeta();renderizarSesion();filtrarEjercicios();renderPlanificacion();renderHistorial();renderStats();if(typeof renderPlayers==='function')renderPlayers();
  cloudApplying=false;
  if(eraAnterior&&cloudUser)setTimeout(()=>subirNube(false),350);
}
function setCloudUI(kind,text){
  const dot=$('cloud-dot'),label=$('cloud-label'),box=$('cloud-status');
  if(dot){dot.className='cloud-dot'+(kind?' '+kind:'')}
  if(label)label.textContent=text||'Nube';
  if(box)box.textContent=text||'Nube';
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
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloudUser)bajarNube(false)});

if(!localStorage.getItem(CLOUD_URL_KEY))localStorage.setItem(CLOUD_URL_KEY,DEFAULT_CLOUD_URL);
if(!localStorage.getItem(CLOUD_ANON_KEY))localStorage.setItem(CLOUD_ANON_KEY,DEFAULT_CLOUD_KEY);

function iniciarVolleyCoach(){
  actualizarSelectorEquipo();
  cargarMeta();
  renderizarSesion();
  filtrarEjercicios();
  renderPlanificacion();
  if(typeof renderPlayers==='function')renderPlayers();
  initCloud();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', iniciarVolleyCoach);
}else{
  iniciarVolleyCoach();
}

/* Actualización automática de Volley Coach PWA */
if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        updateViaCache: 'none'
      });

      // Comprueba si el service worker publicado ha cambiado.
      await registration.update();
      setInterval(() => registration.update().catch(() => {}), 60 * 1000);

      // También comprueba si index.html de GitHub Pages ha cambiado.
      // GitHub Pages normalmente envía ETag/Last-Modified; si cambia, recarga la app.
      const checkPublishedVersion = async () => {
        if (!navigator.onLine || document.visibilityState === 'hidden') return;
        try {
          const response = await fetch('./index.html?update-check=' + Date.now(), {
            method: 'HEAD',
            cache: 'no-store'
          });
          if (!response.ok) return;

          const tag = response.headers.get('etag') || response.headers.get('last-modified');
          if (!tag) return;

          const key = 'volleyCoachPublishedVersion';
          const previous = localStorage.getItem(key);
          localStorage.setItem(key, tag);

          if (previous && previous !== tag) {
            window.location.reload();
          }
        } catch (_) {
          // Sin conexión o comprobación no disponible: la app sigue funcionando offline.
        }
      };

      await checkPublishedVersion();
      setInterval(checkPublishedVersion, 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkPublishedVersion();
      });
    } catch (error) {
      console.error('Error registrando la PWA:', error);
    }
  });
}
