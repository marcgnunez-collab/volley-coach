(()=>{
'use strict';
const SCOUT_VIEWS=new Set(['scout-dashboard','scouting','competicion','scout-analysis','scout-plan','scout-matchup']);
let currentWorkspace=localStorage.getItem('volley_workspace_v610')==='scouting'?'scouting':'training';
function applyWorkspace(mode){currentWorkspace=mode==='scouting'?'scouting':'training';localStorage.setItem('volley_workspace_v610',currentWorkspace);document.getElementById('training-nav')?.classList.toggle('hidden',currentWorkspace!=='training');document.getElementById('scouting-nav')?.classList.toggle('hidden',currentWorkspace!=='scouting');document.getElementById('workspace-training-btn')?.classList.toggle('active',currentWorkspace==='training');document.getElementById('workspace-scouting-btn')?.classList.toggle('active',currentWorkspace==='scouting');document.body.classList.toggle('workspace-scouting',currentWorkspace==='scouting')}
window.openWorkspace=function(mode){applyWorkspace(mode);const target=mode==='scouting'?'scout-dashboard':'dashboard';showView(target,botonVista(target))};
window.botonVista=function(id){return document.querySelector(`.tab-btn[data-view="${id}"]`)||null};
const prevShow=window.showView;
window.showView=function(id,btn){applyWorkspace(SCOUT_VIEWS.has(id)?'scouting':'training');const out=prevShow(id,btn||botonVista(id));if(id==='scout-dashboard'&&typeof window.scoutRenderHome==='function')window.scoutRenderHome();if(id==='scout-analysis'&&typeof window.scoutRenderAnalysis==='function')window.scoutRenderAnalysis();if(id==='scout-plan'&&typeof window.scoutV660Render==='function')window.scoutV660Render();if(id==='scout-matchup'&&typeof window.scoutV670Render==='function')window.scoutV670Render();return out};
/* Restaurar el área sin forzar una vista distinta en la carga inicial */
applyWorkspace(currentWorkspace);
if(currentWorkspace==='scouting'){setTimeout(()=>showView('scout-dashboard',botonVista('scout-dashboard')),0)}
})();
