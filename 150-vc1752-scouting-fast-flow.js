/* Volley Coach V17.5.3 · Ruta automática origen > destino.
 * Presentación/draft only: no añade acciones, puntos, rally, nube ni guardado.
 * Reutiliza el teclado 9×4, los dos campos existentes y el motor de scouting.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root?.document){
  const doc=root.document;
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>api.mount(root),{once:true});
  else api.mount(root);
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='17.5.3';
 const ORIENTATION=Object.freeze(['C','B','D','A']);
 const safeUndo=(now,snapshot)=>snapshot&&String(now)===String(snapshot.after)?snapshot.before:null;
 const nextStep=(step,applied)=>!applied?step:step==='origin'?'destination':step==='destination'?'done':'done';
 function mount(root){
  const doc=root.document,$=id=>doc.getElementById(id);
  const panel=$('v113-video-code-panel');if(!panel)return false;
  let step='origin',originToken='',destinationToken='',lastEdit=null,latest=[],mounted=false;
  function input(){const video=$('v113-video-code'),direct=$('v800-code');
   if(video?.getClientRects?.().length)return video;
   if(direct?.getClientRects?.().length)return direct;
   return video||direct||null;
  }
  function board(){return root.VC_1613_ZONE_BOARD}
  function status(message){const node=$('vc1752-feedback');if(node&&node.textContent!==message)node.textContent=message}
  function routeHighlight(){
   const court=$('vc1613-board');if(!court)return;
   for(const b of court.querySelectorAll('[data-zone]')){
    const key=String(b.dataset.zone||'')+String(b.dataset.sub||'');
    b.classList.toggle('vc1752-origin',!!originToken&&key===originToken);
    b.classList.toggle('vc1752-destination',!!destinationToken&&key===destinationToken);
   }
   const summary=$('vc1752-route');
   if(summary)summary.textContent=originToken
    ?'Origen Z'+originToken+(destinationToken?' → Destino Z'+destinationToken:' → toca una casilla diferente para el destino')
    :step==='off'?'Modo manual · solo destino':'Automático · 1.ª casilla: origen · 2.ª casilla: destino';
  }
  function update(){const el=$('vc1752-strip');if(!el)return;
   el.dataset.step=step;
   const guided=$('vc1752-guide');if(guided){guided.setAttribute('aria-pressed',String(step==='origin'||step==='destination'));guided.textContent=step==='origin'?'AUTO · 1/2 ORIGEN':step==='destination'?'AUTO · 2/2 DESTINO':'Activar ruta automática'}
   const undo=$('vc1752-undo');if(undo)undo.disabled=(safeUndo(input()?.value,lastEdit)===null);
   const recent=$('vc1752-recent');if(recent){recent.replaceChildren();for(const token of latest){
    const b=doc.createElement('button');b.type='button';b.dataset.vc1752Token=token;b.textContent=token;b.title='Aplicar Z'+token+' al código';b.setAttribute('aria-label','Repetir zona '+token);recent.appendChild(b)
   }}
   routeHighlight();
  }
  function setStep(value){step=value;
   if(value==='origin'||value==='destination')board()?.setMode?.(value);
   update();
  }
  function ensure(){
   const entry=panel.querySelector('.v113-video-code-entry'),zone=$('vc1613-board');
   if(!entry||!zone)return false;
   let strip=$('vc1752-strip'),created=false;
   if(!strip){created=true;
    strip=doc.createElement('section');strip.id='vc1752-strip';strip.className='vc1752-strip';strip.setAttribute('aria-label','Codificación rápida');
    strip.innerHTML=`<div class="vc1752-heading"><b>SCOUTING RÁPIDO · V${VERSION}</b><small>Dos casillas: origen y destino · sin guardar automáticamente</small></div>
     <div class="vc1752-actions"><button type="button" id="vc1752-guide" aria-pressed="true">AUTO · 1/2 ORIGEN</button><button type="button" id="vc1752-dest">Solo destino</button><button type="button" id="vc1752-focus">Foco código</button><button type="button" id="vc1752-undo" disabled>Deshacer código</button></div>
     <div id="vc1752-route" class="vc1752-route" role="status">Automático · 1.ª casilla: origen · 2.ª casilla: destino</div>
     <div class="vc1752-bottom"><span>Repetir zona:</span><div id="vc1752-recent" aria-label="Últimas cuatro zonas"></div></div>
     <p id="vc1752-feedback" role="status" aria-live="polite">Escribe el código y toca dos casillas diferentes: origen y destino. Pulsa Añadir para registrar.</p>`;
    strip.addEventListener('click',e=>{
     const b=e.target.closest('button');if(!b)return;
     if(b.id==='vc1752-guide'){
      if(step==='origin'||step==='destination'){originToken='';destinationToken='';setStep('off');board()?.setMode?.('destination');status('Ruta automática desactivada: elige solo el destino.')}
      else{originToken='';destinationToken='';setStep('origin');status('Ruta automática activada: toca la casilla de origen.')} 
     }else if(b.id==='vc1752-dest'){originToken='';destinationToken='';setStep('off');board()?.setMode?.('destination');status('Modo manual: selecciona únicamente el destino o contacto.')}
     else if(b.id==='vc1752-focus') {input()?.focus?.({preventScroll:true})}
     else if(b.id==='vc1752-undo'){
      const target=input(),value=safeUndo(target?.value,lastEdit);if(!target||value===null)return;
      const edit=lastEdit;
      target.value=value;target.dispatchEvent(new Event('input',{bubbles:true}));lastEdit=null;
      if(edit?.stage==='destination'){originToken=edit.origin;destinationToken='';setStep('destination');board()?.restoreModeContext?.('origin','destination');status('Destino deshecho: marca una casilla distinta del origen.')}
      else if(edit?.stage==='origin'){originToken='';destinationToken='';setStep('origin');board()?.restoreModeContext?.('destination','origin');status('Origen deshecho: marca una nueva casilla de origen.')}
      else {setStep('off');board()?.setMode?.('destination');status('Última selección deshecha. No se ha modificado el partido.')}
     }else if(b.dataset.vc1752Token){const token=b.dataset.vc1752Token;
      board()?.applyToken?.(token[0],token.slice(1));
     }
    });
   }
   if(strip.parentNode!==entry||strip.nextElementSibling!==zone)entry.insertBefore(strip,zone);
   if(created||!mounted){mounted=true;update()}
   return true;
  }
  function onZone(e){
   const d=e.detail||{};
   if(!d.zone||!d.before||d.before===d.after)return;
   const token=String(d.token||'');
   if(!/^[1-9][ABCD]?$/.test(token))return;
   const stage=step;
   // The second cell must differ from the first. Restore only the draft code.
   if(stage==='destination'&&d.mode==='destination'&&token===originToken){
    const target=input();
    if(target&&target.value===d.after){target.value=d.before;target.dispatchEvent(new Event('input',{bubbles:true}))}
    board()?.restoreModeContext?.('origin','destination');
    status('Has marcado el mismo origen. Toca una casilla diferente para indicar el destino.');
    update();return;
   }
   lastEdit={before:d.before,after:d.after,stage:stage===d.mode?stage:'manual',origin:originToken};
   latest=[token,...latest.filter(x=>x!==token)].slice(0,4);
   if(stage==='origin'&&d.mode==='origin'){
    originToken=token;destinationToken='';setStep('destination');
    status('Origen Z'+token+' marcado. Toca otra casilla para el destino.');
   }else if(stage==='destination'&&d.mode==='destination'){
    destinationToken=token;setStep('origin');
    status('Ruta Z'+originToken+' → Z'+token+' completada en el código. Pulsa Añadir/Enter para registrar; próxima ruta: origen.');
   }else status('Z'+token+' aplicada al código. Revisa antes de registrar.');
   update();
  }
  function onManualMode(e){
   const mode=e.detail?.mode;
   if(mode!=='origin'&&mode!=='destination')return;
   step='off';originToken='';destinationToken='';update();
   status('Selección manual '+(mode==='origin'?'de origen':'de destino')+'. Pulsa «Activar ruta automática» para volver a dos toques.');
  }
  function installStyle(){if($('vc1752-style'))return;
   const el=doc.createElement('style');el.id='vc1752-style';el.textContent=`
 #scout-match-mode #vc1752-strip{display:grid;gap:7px;margin:9px 0;padding:9px;background:#fff;border:1px solid #cbddeb;border-radius:10px;min-width:0;font:650 11px/1.35 system-ui,sans-serif;color:#285477}
 #scout-match-mode .vc1752-heading{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
 #scout-match-mode .vc1752-heading b{font-size:10px;color:#114a7a;letter-spacing:.045em}
 #scout-match-mode .vc1752-heading small{font-size:9px;color:#658098}
 #scout-match-mode .vc1752-actions{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr;gap:5px;min-width:0}
 body.v11-shell #scout-match-mode #vc1752-strip button{min-height:35px!important;min-width:0!important;border:1px solid #bfd3e6!important;border-radius:7px!important;background:#f5f9fd!important;color:#24587f!important;padding:6px!important;font:750 10px/1.15 system-ui,sans-serif!important;box-shadow:none!important}
 body.v11-shell #scout-match-mode #vc1752-guide[aria-pressed="true"]{background:#1e67b2!important;color:white!important;border-color:#1e67b2!important}
 body.v11-shell #scout-match-mode #vc1752-strip button:disabled{opacity:.45!important;cursor:not-allowed}
 body.v11-shell #scout-match-mode #vc1752-strip button:focus-visible{outline:3px solid #83b9ea!important;outline-offset:2px}
 #scout-match-mode .vc1752-route{background:#e5f2fc;border:1px solid #bfd8ec;border-radius:7px;padding:7px 9px;color:#185580;font:800 10px/1.35 system-ui,sans-serif}
 body.v11-shell #scout-match-mode #vc1613-board [data-zone].vc1752-origin{box-shadow:inset 0 0 0 3px #1594bd!important}
 body.v11-shell #scout-match-mode #vc1613-board [data-zone].vc1752-destination{box-shadow:inset 0 0 0 3px #e69b37!important}
 #scout-match-mode .vc1752-bottom{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:#69839a;font-size:9px}
 #scout-match-mode #vc1752-recent{display:flex;gap:4px;flex-wrap:wrap}
 body.v11-shell #scout-match-mode #vc1752-recent button{min-height:27px!important;min-width:36px!important;font-weight:850!important}
 #scout-match-mode #vc1752-feedback{margin:0!important;color:#507c9b;font-size:9px;overflow-wrap:anywhere}
 #scout-match-mode #vc1613-board .vc1613-quads button{min-height:32px!important;font-size:12px!important}
 @media(max-width:650px){#scout-match-mode .vc1752-actions{grid-template-columns:repeat(2,minmax(0,1fr))}body.v11-shell #scout-match-mode #vc1752-strip button{min-height:43px!important}#scout-match-mode #vc1613-board .vc1613-quads button{min-height:38px!important}}
 `;doc.head.appendChild(el)
  }
  installStyle();
  root.addEventListener('vc1752:zone-applied',onZone);
  root.addEventListener('vc1752:zone-mode-manual',onManualMode);
  const observer=new MutationObserver(()=>ensure());
  observer.observe(panel,{childList:true,subtree:true});
  for(const id of ['v113-video-code','v800-code']){const field=$(id);if(field)field.addEventListener('input',update)}
  ensure();
  // The route is active immediately: no extra activation button is needed.
  board()?.setMode?.('origin');
  update();
  return true;
 }
 return {version:VERSION,orientation:ORIENTATION,nextStep,safeUndo,mount};
});
