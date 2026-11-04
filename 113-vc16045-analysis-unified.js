/* Volley Coach 16.0.4.5 · Unified Analysis presentation.
 * Only moves existing DOM controls and applies CSS classes. Never changes metrics.
 * The classic presentation remains available for comparison.
 */
(()=>{
'use strict';
if(window.VC_ANALYSIS_UNIFIED_1645)return;
const KEY='vc1645_analysis_classic', $=id=>document.getElementById(id);
let classic=false;try{classic=localStorage.getItem(KEY)==='1'}catch(_){}
const checks={mounts:0,toggles:0,toolMoves:0};
function apply(){const root=$('scout-analysis');if(!root)return;root.classList.toggle('vc1645-analysis-unified',!classic);root.classList.toggle('vc1645-analysis-classic',classic);
 const button=$('vc1645-analysis-view');if(button){button.textContent=classic?'Activar vista unificada':'Ver vista clásica';button.setAttribute('aria-pressed',String(classic))}}
function build(){const root=$('scout-analysis'),bar=root?.querySelector('.scout-analysis-toolbar'),head=root?.querySelector('.scout-analysis-header');if(!root||!bar||!head)return;
 if(!$('vc1645-analysis-view')){const b=document.createElement('button');b.id='vc1645-analysis-view';b.type='button';b.className='ghost';b.title='La vista clásica conserva todas las tablas originales, sin borrar datos';b.addEventListener('click',()=>{classic=!classic;checks.toggles++;try{localStorage.setItem(KEY,classic?'1':'0')}catch(_){}apply();if(classic)window.VC_ANALYSIS_PRO_1643?.render?.()});bar.append(b)}
 if(!$('vc1645-tools')){const menu=document.createElement('details');menu.id='vc1645-tools';menu.className='vc1645-tools';const summary=document.createElement('summary');summary.textContent='Exportar y herramientas';const box=document.createElement('div');box.className='vc1645-tools-menu';menu.append(summary,box);
  const selects=[...bar.children].filter(x=>x.tagName==='SELECT');const insertAfter=selects[0]||null;
  if(insertAfter)insertAfter.after(menu);else bar.prepend(menu);
  // Relocate existing buttons, preserving their original onclick handlers/IDs.
  [...bar.querySelectorAll(':scope > button')].filter(b=>b.id!=='vc1645-analysis-view'&&!/sincronizar|vídeo/i.test(b.textContent||'')).forEach(b=>{box.append(b);checks.toolMoves++});
  const ready=$('scout-v753-pdf-ready');if(ready)box.append(ready);
 }
 const subtitle=head.querySelector(':scope > div:first-child > p');if(subtitle)subtitle.textContent='Un único resumen; las tablas de detalle están organizadas por secciones. Las fórmulas y los PDF originales se conservan.';
 checks.mounts++;apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
window.VC_ANALYSIS_UNIFIED_1645={version:'16.0.4.5',setClassic:value=>{classic=!!value;apply();if(classic)window.VC_ANALYSIS_PRO_1643?.render?.()},diagnostics:()=>({...checks,classic,view:$('scout-analysis')?.dataset.v115Tab||''})};
})();
