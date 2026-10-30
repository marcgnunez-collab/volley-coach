/* V16.9.4: explicit archive action for finished matches. */
(()=>{
'use strict';
if(window.VC_REOPEN_ENTRY)return;
function attach(){
 const pane=document.getElementById('v1674-archive-content');
 const api=window.VC_ARCHIVE,engine=window.VC_REOPEN_SAFE;
 if(!pane||!api||!engine)return;
 const tools=pane.querySelector('.v1674-tools');
 if(!tools||pane.querySelector('#v1694-reopen-button'))return;
 const entries=api.list?.()||[];
 const detail=pane.querySelector('.v1674-detail');
 if(!detail)return;
 const label=detail.textContent||'';
 const idMatch=label.match(/\bID\s*:?\s*(\d+)\b/i);
 if(!idMatch)return;
 const id=Number(idMatch[1]),team=String(typeof equipoActivo!=='undefined'?equipoActivo:'');
 const match=entries.find(e=>e?.team===team&&Number(e.match?.id)===id&&e.match?.status==='finished');
 const current=typeof equiposData!=='undefined'?equiposData?.[team]?.scoutingMatches?.find(m=>Number(m.id)===id):null;
 if(!match||!current||current.status!=='finished')return;
 const btn=document.createElement('button');btn.id='v1694-reopen-button';btn.type='button';btn.className='ghost';btn.textContent='Reabrir para editar';
 btn.onclick=async()=>{
  btn.disabled=true;
  try{const ok=await engine.reopen(team,id);if(ok!==false)api.close?.()}
  catch(e){alert('No se pudo reabrir: '+(e?.message||String(e)))}
  finally{btn.disabled=false}
 };
 tools.append(btn);
}
function init(){
 const modal=document.getElementById('v1674-archive-modal');
 if(!modal){setTimeout(init,400);return}
 const observer=new MutationObserver(attach);observer.observe(modal,{subtree:true,childList:true});attach();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.VC_REOPEN_ENTRY={version:'16.9.4'};
})();