(()=>{
'use strict';
if(window.VC_DELETE_ENTRY)return;
function refresh(){
 const panel=document.getElementById('v1674-archive-content');
 const bar=panel?.querySelector('.v1674-tools');
 const exportButton=bar?.querySelector('[data-action="export"][data-index]');
 if(!exportButton||bar.querySelector('#v1694-delete-match'))return;
 const item=window.VC_ARCHIVE?.list?.()[Number(exportButton.dataset.index)];
 const team=String(item?.team||''),id=String(item?.match?.id||'');
 const active=typeof equiposData==='object'&&equiposData?.[team]?.scoutingMatches?.some(m=>String(m.id)===id);
 if(!active)return;
 const button=document.createElement('button');
 button.id='v1694-delete-match';button.type='button';button.className='danger';
 button.textContent='Eliminar scouting';
 button.onclick=async()=>{
  if(!confirm('¿Eliminar este scouting del equipo y de los dispositivos sincronizados? Se guardará una copia protegida antes de ocultarlo.'))return;
  button.disabled=true;
  try{
   await window.VC_SYNC_V1680.deleteScouting(team,id);
   window.VC_ARCHIVE?.close?.();
   alert('Eliminación guardada localmente. La confirmación en nube puede tardar; comprueba el indicador de sincronización.');
  }catch(e){alert('No se pudo eliminar: '+(e?.message||String(e)))}
  finally{button.disabled=false}
 };
 bar.appendChild(button);
}
function init(){
 const modal=document.getElementById('v1674-archive-modal');
 if(!modal){setTimeout(init,350);return}
 new MutationObserver(refresh).observe(modal,{subtree:true,childList:true});refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.VC_DELETE_ENTRY={version:'16.9.4'};
})();