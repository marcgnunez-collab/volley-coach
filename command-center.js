function dashProFundamentosSesiones(sesiones){
  const c={};
  (sesiones||[]).forEach(s=>{
    (s.ejercicios||[]).forEach(e=>{
      const ex=enriquecerEjercicioGuardado(e),fs=normalizarFundamentos(ex);
      if(!fs.length)return;
      const m=(Number(ex.tiempo)||0)/fs.length;fs.forEach(f=>c[f]=(c[f]||0)+m);
    });
  });
  return c;
}
function dashProPct(a,b){return b>0?Math.round(a/b*100):0}
function renderDashboardCommandCenter(){
  if(!$('dashboard-command-center'))return;
  const lunes=lunesDeSemana(new Date()),domingo=new Date(lunes);domingo.setDate(lunes.getDate()+6);
  const ini=isoDate(lunes),fin=isoDate(domingo);
  const planes=planificacion.filter(p=>p.fecha>=ini&&p.fecha<=fin);
  const hechos=historial.filter(h=>h.fecha>=ini&&h.fecha<=fin);
  const planMin=planes.reduce((a,p)=>a+(Number(p.duracion)||minutosListaEjercicios(p.ejercicios||[])),0);
  const doneMin=hechos.reduce((a,h)=>a+(Number(h.duracion)||minutosListaEjercicios((h.ejercicios||[]).map(enriquecerEjercicioGuardado))),0);
  const doneSessions=hechos.length;
  $('dash-pro-planned-sessions').textContent=planes.length;
  $('dash-pro-done-sessions').textContent=doneSessions;
  $('dash-pro-planned-min').textContent=planMin;
  $('dash-pro-done-min').textContent=doneMin;
  const maxMin=Math.max(planMin,doneMin,1),maxSes=Math.max(planes.length,doneSessions,1);
  $('dash-pro-compare').innerHTML=`
    <div class="dashboard-compare-row"><span>Sesiones</span><div><div class="dashboard-compare-track"><i style="width:${planes.length/maxSes*100}%"></i></div><div class="dashboard-compare-track" style="margin-top:4px"><i class="real" style="width:${doneSessions/maxSes*100}%"></i></div></div><b>${doneSessions}/${planes.length||0}</b></div>
    <div class="dashboard-compare-row"><span>Minutos</span><div><div class="dashboard-compare-track"><i style="width:${planMin/maxMin*100}%"></i></div><div class="dashboard-compare-track" style="margin-top:4px"><i class="real" style="width:${doneMin/maxMin*100}%"></i></div></div><b>${doneMin}/${planMin||0}</b></div>`;
  const completion=planes.length?dashProPct(doneSessions,planes.length):(doneSessions?100:0);
  const minuteCompletion=planMin?dashProPct(doneMin,planMin):(doneMin?100:0);
  const pills=[];
  pills.push(`<span class="dashboard-week-pill ${completion>=75?'good':completion<40&&planes.length?'warn':''}">${completion}% sesiones completadas</span>`);
  pills.push(`<span class="dashboard-week-pill ${minuteCompletion>=75?'good':minuteCompletion<40&&planMin?'warn':''}">${minuteCompletion}% carga realizada</span>`);
  const foc=dashProFundamentosSesiones(hechos.length?hechos:planes),funds=Object.keys(foc);
  pills.push(`<span class="dashboard-week-pill">${funds.length} fundamentos trabajados</span>`);
  $('dash-pro-week-pills').innerHTML=pills.join('');
  const badge=$('dash-week-status-badge');
  if(badge){badge.textContent=planes.length?`${doneSessions}/${planes.length} sesiones`:(doneSessions?`${doneSessions} realizadas`:'Sin planificación');}

  const alerts=[];
  if(!planes.length) alerts.push({t:'warn',title:'Semana sin planificación',text:'No hay sesiones programadas esta semana.',action:'Planificar'});
  if(planes.length&&doneSessions===0&&new Date().getDay()>=4) alerts.push({t:'warn',title:'Sin sesiones completadas',text:'La semana avanza y todavía no consta ningún entrenamiento realizado.',action:'Revisar'});
  const vals=Object.entries(foc).sort((a,b)=>a[1]-b[1]);
  if(vals.length>=4){
    const total=vals.reduce((a,x)=>a+x[1],0)||1;
    const [lowF,lowM]=vals[0];
    if(lowM/total<.10) alerts.push({t:'warn',title:`${lowF} con poco peso`,text:`Representa aproximadamente el ${Math.round(lowM/total*100)}% del trabajo de la semana.`,action:'Biblioteca',fundamento:lowF});
  }
  const futuros=planes.filter(p=>!p.realizado&&p.fecha>=fechaLocalISO()).length;
  if(futuros===0&&planes.length&&doneSessions>=planes.length) alerts.push({t:'good',title:'Semana al día',text:'Las sesiones previstas de la semana ya están completadas.'});
  if(!alerts.length) alerts.push({t:'good',title:'Planificación equilibrada',text:'No hay desviaciones importantes detectadas en la semana actual.'});
  $('dash-pro-alerts').innerHTML=alerts.slice(0,4).map((a,i)=>`<div class="dashboard-plan-alert ${a.t}"><span class="dot"></span><div><strong>${esc(a.title)}</strong><span>${esc(a.text)}</span></div>${a.action?`<button onclick="dashProAlertAction(${i})">${esc(a.action)} →</button>`:''}</div>`).join('');
  window.__dashProAlerts=alerts;
}
function dashProAlertAction(i){
  const a=(window.__dashProAlerts||[])[i];if(!a)return;
  if(a.action==='Biblioteca'&&a.fundamento){
    abrirBibliotecaNormal(botonVista('ejercicios'));
    document.querySelectorAll('input[name="filtro-fundamento"]').forEach(x=>x.checked=x.value===a.fundamento);
    filtrarEjercicios();return;
  }
  showView('planificacion',botonVista('planificacion'));
}
const _renderDashboardCommandBase=renderDashboard;
renderDashboard=function(){_renderDashboardCommandBase();renderDashboardCommandCenter();};
if($('dashboard')?.classList.contains('active'))renderDashboardCommandCenter();
