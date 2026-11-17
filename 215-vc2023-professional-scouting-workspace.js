/* Volley Coach V20.2.3 · Professional Scouting Workspace
 * Presentation and navigation adapter ONLY. Reuses original video/code/court,
 * scoring, match and synchronization systems. No match writes or cloned controls.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root){
  if(root.VC_PRO_SCOUTING_WORKSPACE_2023)return;
  root.VC_PRO_SCOUTING_WORKSPACE_2023=api;
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',api.boot,{once:true});
  else api.boot();
 }
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const VERSION='20.2.3';
 const MENUS=[
  {name:'Archivo',items:[['open','Abrir o reabrir scouting'],['new','Nuevo scouting'],['save','Guardar ahora'],['backup','Copia JSON'],['recovery','Recuperación de datos']]},
  {name:'Partido',items:[['lineup','Alineación'],['changes','Sustituciones y líberos'],['rotation','Control de rotación'],['event','Añadir evento'],['newset','Nuevo set'],['finishset','Finalizar set'],['result','Resultado final']]},
  {name:'Scouting',items:[['focus','Enfocar código rápido'],['court','Pista interactiva'],['history','Historial de contactos'],['advanced','Editor avanzado de contactos'],['rallyedit','Editor de rallies'],['codes','Códigos Pro'],['cheatsheet','Chuleta de códigos'],['macros','Macros Alt+1–8']]},
  {name:'Vídeo',items:[['source','Cámara / archivo / Delay'],['delay','Configurar Delay'],['review','Revisión de vídeo'],['note','Nota de vídeo']]},
  {name:'Análisis',items:[['intelligence','Inteligencia táctica (ventana)'],['analysis','Análisis completo']]},
  {name:'Vista',items:[['home','Pantalla principal'],['balanced','Vídeo y código equilibrados'],['bigvideo','Vídeo más grande'],['bigcode','Código más grande'],['history','Ventana de historial'],['intelligence','Ventana de inteligencia'],['closeall','Cerrar ventanas']]}
 ];
 const ACTIONS=Object.fromEntries(MENUS.flatMap(m=>m.items));
 const ALLOWED_WINDOWS=['history','intelligence'];
 let mounted=false,initializedFor='',clock=null,activeMenu='',lastHistory='',lastMatchRef=null,winZ=15020;
 const windows=new Map();
 const doc=()=>root?.document;
 const byId=id=>doc()?.getElementById(id)||null;
 const text=v=>String(v??'').trim();
 const escapeHtml=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const visible=()=>!!byId('scout-match-mode')?.classList?.contains('active');
 const live=()=>!!byId('v800-live')&&!byId('v800-live').classList.contains('hidden');
 function match(){try{return root?.VC_SCOUT_VIDEO_BRIDGE?.getActive?.()||null}catch(_){return null}}
 function markup(){
  return `<nav id="vc2023-menubar" class="vc2023-menubar" aria-label="Menús profesionales de Scouting Pro">
   <span class="vc2023-brand">VC <small>SCOUTING PRO</small></span>
   <div class="vc2023-menulist" role="menubar">${MENUS.map((m,i)=>`<div class="vc2023-menu"><button type="button" id="vc2023-menu-${i}" role="menuitem" aria-haspopup="menu" aria-expanded="false" data-vc2023-menu="${i}">${m.name}<span aria-hidden="true">⌄</span></button><div class="vc2023-dropdown" role="menu" aria-labelledby="vc2023-menu-${i}" hidden>${m.items.map(([id,label])=>`<button type="button" role="menuitem" data-vc2023-action="${id}">${escapeHtml(label)}</button>`).join('')}</div></div>`).join('')}</div>
   <button type="button" class="vc2023-return" data-vc2023-action="home" title="Restaurar vídeo, código y pista">◩ Principal</button>
   <span class="vc2023-readonly">V20.2.3</span></nav>
   <div id="vc2023-status" class="vc2023-status" role="status" aria-live="polite" hidden></div>
   <div id="vc2023-windows" aria-label="Ventanas auxiliares del scouting"></div>`;
 }
 function status(message){const el=byId('vc2023-status');if(!el)return;el.textContent=message;el.hidden=false;}
 function menu(index){const bar=byId('vc2023-menubar');if(!bar)return;
  const next=String(index)===activeMenu?'':String(index);
  activeMenu=next;
  bar.querySelectorAll('[data-vc2023-menu]').forEach(b=>{const selected=b.dataset.vc2023Menu===next;b.setAttribute('aria-expanded',String(selected));b.parentElement?.querySelector('.vc2023-dropdown')?.toggleAttribute('hidden',!selected)});
 }
 function closeMenu(){activeMenu='';byId('vc2023-menubar')?.querySelectorAll('[data-vc2023-menu]').forEach(b=>{b.setAttribute('aria-expanded','false');b.parentElement?.querySelector('.vc2023-dropdown')?.setAttribute('hidden','');});}
 function safeFunction(name,...args){const fn=root?.[name];if(typeof fn!=='function'){status(`Herramienta no disponible: ${name}.`);return false;}
  try{fn(...args);return true}catch(_){status(`No se pudo abrir esta herramienta. Comprueba que el scouting esté cargado.`);return false;}}
 function layout(choice){const api=root?.VC_MATCH_WORKSPACE_193196;
  if(typeof api?.setLayout!=='function'){status('El selector de distribución todavía no está disponible.');return false}
  const value={balanced:'balanced',bigvideo:'video',bigcode:'coding'}[choice];return !!api.setLayout(value);
 }
 function ensureHome(){if(!visible()||!live()||typeof root?.vc52SetMode!=='function')return false;
  if(byId('v800-shell')?.dataset?.vc52Mode!=='video'){
   try{if(root.vc52SetMode('video')===false)return false}catch(_){status('No se ha podido activar el modo Vídeo + código.');return false}
  }
  return true;
 }
 function focusCode(){if(!ensureHome())return false;const el=byId('v113-video-code');if(!el)return false;try{el.focus({preventScroll:true})}catch(_){el.focus()}return true}
 function court(){if(!ensureHome())return false;const node=byId('vc1613-board');if(!node)return false;
  try{node.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(_){};
  const button=node.querySelector('[data-zone]');if(button){try{button.focus({preventScroll:true})}catch(_){button.focus()}}return true;
 }
 function collectHistory(m,limit=80){const entries=[];
  if(!m)return entries;
  const sets=Array.isArray(m.sets)?m.sets:[];
  const pending=Array.isArray(m.liveRally?.actions)?m.liveRally.actions:[];
  // The current, unfinished rally has no point or fabricated score.
  for(let i=pending.length-1;i>=0&&entries.length<limit;i--){const a=pending[i];entries.push({set:'—',rally:'Actual',ordinal:i+1,editable:false,code:text(a?.code||a?.raw),skill:text(a?.skill),number:text(a?.number),winner:'Pendiente'});}
  for(let si=sets.length-1;si>=0&&entries.length<limit;si--){
   const set=sets[si],rallies=Array.isArray(set?.rallies)?set.rallies:[];
   for(let ri=rallies.length-1;ri>=0&&entries.length<limit;ri--){
    const r=rallies[ri],actions=Array.isArray(r?.actions)?r.actions:[];
    for(let i=actions.length-1;i>=0&&entries.length<limit;i--){const a=actions[i];entries.push({set:text(set?.number)||'—',rally:String(ri+1),ordinal:i+1,setIndex:si,rallyIndex:ri,actionIndex:i,editable:true,code:text(a?.code||a?.raw),skill:text(a?.skill),number:text(a?.number),winner:r?.winner==='ours'?'Propio':r?.winner==='opponent'?'Rival':'—'});}
   }
  }
  return entries;
 }
 function renderHistory(force=false){const body=byId('vc2023-history-body');if(!body||!windows.has('history'))return false;
  const m=match();const rows=collectHistory(m),signature=JSON.stringify([text(m?.id),rows]);if(!force&&lastHistory===signature)return true;lastHistory=signature;
  body.replaceChildren();const summary=doc().createElement('p');summary.className='vc2023-window-note';summary.textContent=`${rows.length} últimos contactos (máximo 80). Consulta y modifica los códigos con el editor original.`;body.appendChild(summary);
  if(!rows.length){const empty=doc().createElement('p');empty.textContent='No hay contactos registrados en este scouting.';body.appendChild(empty);return true;}
  const wrap=doc().createElement('div');wrap.className='vc2023-table-wrap';const table=doc().createElement('table');
  const head=doc().createElement('thead');const header=doc().createElement('tr');for(const title of ['Set','Rally','Nº','Código','Jugador','Resultado','Editar']){const cell=doc().createElement('th');cell.textContent=title;header.appendChild(cell);}head.appendChild(header);table.appendChild(head);
  const tbody=doc().createElement('tbody');for(const r of rows){const tr=doc().createElement('tr');for(const value of [r.set,r.rally,r.ordinal,r.code||r.skill||'—',r.number||'—',r.winner]){const td=doc().createElement('td');td.textContent=String(value);tr.appendChild(td);}const edit=doc().createElement('td');if(r.editable){const button=doc().createElement('button');button.type='button';button.textContent='Editar';button.setAttribute('aria-label',`Editar set ${r.set}, rally ${r.rally}, contacto ${r.ordinal}`);button.dataset.vc2023Edit=`${r.setIndex}:${r.rallyIndex}:${r.actionIndex}`;edit.appendChild(button);}else edit.textContent='En curso';tr.appendChild(edit);tbody.appendChild(tr)}table.appendChild(tbody);wrap.appendChild(table);body.appendChild(wrap);return true;
 }
 function makeWindow(type){if(!ALLOWED_WINDOWS.includes(type)||!doc())return null;
  let node=byId(`vc2023-window-${type}`);if(node)return node;
  node=doc().createElement('section');node.id=`vc2023-window-${type}`;node.className='vc2023-window';node.dataset.type=type;node.setAttribute('role','dialog');node.setAttribute('aria-modal','false');node.setAttribute('aria-label',type==='history'?'Historial de contactos':'Inteligencia táctica');
  const heading=doc().createElement('header');heading.className='vc2023-window-head';heading.innerHTML=`<strong>${type==='history'?'Historial de contactos':'Inteligencia táctica'}</strong><div><button type="button" data-vc2023-minimize="${type}" title="Minimizar">−</button><button type="button" data-vc2023-close="${type}" title="Cerrar">×</button></div>`;
  const body=doc().createElement('div');body.className='vc2023-window-body';
  if(type==='history'){
   body.id='vc2023-history-body';
   const toolbar=doc().createElement('div');toolbar.className='vc2023-window-tools';toolbar.innerHTML='<button type="button" data-vc2023-action="rallyedit">Editar rallies en herramienta original</button><button type="button" data-vc2023-action="advanced">Editor avanzado del último rally</button><button type="button" data-vc2023-action="codes">Códigos Pro</button>';
   node.append(heading,toolbar,body);
  } else {body.id='vc2023-intelligence-body';node.append(heading,body);}
  byId('vc2023-windows')?.append(node);
  // Drag only via the dedicated header. No reparenting of live players or inputs.
  heading.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('button')||root?.innerWidth<850)return;
   const box=node.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
   const move=e=>{node.style.left=Math.max(8,Math.min(root.innerWidth-node.offsetWidth-8,e.clientX-x))+'px';node.style.top=Math.max(8,Math.min(root.innerHeight-55,e.clientY-y))+'px';node.style.right='auto'};
   const stop=()=>{root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',stop)};
   root.addEventListener('pointermove',move);root.addEventListener('pointerup',stop,{once:true});
  });
  return node;
 }
 function openWindow(type){if(!visible()||!ALLOWED_WINDOWS.includes(type))return false;
  const windowNode=makeWindow(type);if(!windowNode)return false;windowNode.hidden=false;windowNode.classList.remove('vc2023-minimized');windowNode.style.zIndex=String(++winZ);windows.set(type,windowNode);
  if(type==='history')renderHistory(true);
  else{
   const original=byId('vc2022-intelligence'),holder=byId('vc2023-intelligence-body');
   if(original&&holder&&original.parentElement!==holder)holder.appendChild(original);
   try{root?.VC_MATCH_INTELLIGENCE_2022?.render?.()}catch(_){}
  }
  return true;
 }
 function closeWindow(type){const node=byId(`vc2023-window-${type}`);if(!node)return false;node.hidden=true;windows.delete(type);return true;}
 function closeAll(){for(const type of ALLOWED_WINDOWS)closeWindow(type);return true;}
 function openAdvanced(si,ri,ai){
  const m=match(),editor=root?.VC_SCOUTING_EDITOR_19315;
  if(!m||!editor?.openNative){status('Editor avanzado no disponible o sin scouting activo.');return false;}
  const result=editor.openNative(root,m,si,ri,ai);
  if(!result?.ok){status(result?.error||'No se pudo abrir el contacto.');return false;}
  return true;
 }
 function openLatestAdvanced(){
  const m=match(),sets=Array.isArray(m?.sets)?m.sets:[];
  for(let si=sets.length-1;si>=0;si--){const rallies=Array.isArray(sets[si]?.rallies)?sets[si].rallies:[];
   for(let ri=rallies.length-1;ri>=0;ri--){const actions=Array.isArray(rallies[ri]?.actions)?rallies[ri].actions:[];
    if(actions.length)return openAdvanced(si,ri,actions.length-1);
   }
  }
  status('No hay contactos en rallies finalizados. Registra primero un rally o edita el borrador con el código rápido.');return false;
 }
 function runAction(id){if(!Object.hasOwn(ACTIONS,id))return false;
  if(!visible())return false;
  if(id==='home')return ensureHome();
  if(id==='focus')return focusCode();
  if(id==='court')return court();
  if(id==='history'||id==='intelligence')return openWindow(id);
  if(id==='advanced')return openLatestAdvanced();
  if(id==='closeall')return closeAll();
  if(['balanced','bigvideo','bigcode'].includes(id))return ensureHome()&&layout(id);
  if(id==='source'){if(!ensureHome())return false;const details=byId('vc54-video-settings');if(!details)return false;details.open=true;details.scrollIntoView?.({block:'nearest'});return true;}
  if(id==='macros'){if(!ensureHome())return false;const config=byId('vc1645-video')?.querySelector('.vc1645-config-toggle');if(!config)return false;config.click();return true;}
  const functions={open:'v122OpenMatchSwitcher',new:'scoutOpenNewMatch',save:'v117ProSave',backup:'scoutV680DownloadBackup',recovery:'scoutV892OpenRecoveryCenter',lineup:'scoutOpenLineup',changes:'v120OpenChanges',rotation:'v851OpenLineupControl',event:'v120OpenEvent',newset:'v121OpenNewSet',finishset:'v120OpenFinishSet',result:'v120OpenFinalResult',rallyedit:'v857OpenRallyEditor',codes:'v901OpenCodes',cheatsheet:'v841OpenCheatSheet',delay:'v116OpenDelay',review:'v117OpenVideoReview',note:'v851OpenVideoNote',analysis:'v1000GoAnalysis'};
  return functions[id]?safeFunction(functions[id]):false;
 }
 function onClick(event){const nav=byId('vc2023-menubar');const button=event.target.closest?.('[data-vc2023-menu],[data-vc2023-action],[data-vc2023-edit],[data-vc2023-close],[data-vc2023-minimize]');
  if(!button){if(nav&&!nav.contains(event.target))closeMenu();return;}
  if(button.dataset.vc2023Edit!==undefined){const nums=button.dataset.vc2023Edit.split(':').map(Number);if(nums.length===3&&nums.every(n=>Number.isInteger(n)&&n>=0))openAdvanced(...nums);return;}
  if(button.dataset.vc2023Menu!==undefined){menu(button.dataset.vc2023Menu);return;}
  if(button.dataset.vc2023Close){closeWindow(button.dataset.vc2023Close);return;}
  if(button.dataset.vc2023Minimize){byId(`vc2023-window-${button.dataset.vc2023Minimize}`)?.classList.toggle('vc2023-minimized');return;}
  if(button.dataset.vc2023Action){closeMenu();runAction(button.dataset.vc2023Action);}
 }
 function onKey(e){if(e.key==='Escape'){closeMenu();return;}
  const button=e.target.closest?.('[data-vc2023-menu]');if(button&&e.key==='ArrowDown'){e.preventDefault();menu(button.dataset.vc2023Menu);button.parentElement?.querySelector('[data-vc2023-action]')?.focus();}
 }
 function layoutComponents(){if(!visible())return;
  const panel=byId('v113-video-code-panel'),dock=byId('vc2021-dock');
  if(panel&&dock&&dock.parentElement!==panel){const entry=panel.querySelector('.v113-video-code-entry');if(entry)entry.insertAdjacentElement('afterend',dock);else panel.append(dock);}
  const view=byId('scout-match-mode');if(panel&&byId('vc1613-board')&&view&&!view.classList.contains('vc2023-ready'))view.classList.add('vc2023-ready');
 }
 function refresh(){if(!mounted||!visible())return false;
  const m=match();if(m&&live()&&typeof root?.vc52SetMode==='function'){
   const key=text(m.id)||'active-object';
   if(initializedFor!==key){if(ensureHome())initializedFor=key;}
  }
  layoutComponents();
  if(windows.has('history'))renderHistory();
  if(windows.has('intelligence'))try{root?.VC_MATCH_INTELLIGENCE_2022?.render?.()}catch(_){}
  return true;
 }
 function boot(){const score=byId('v800-live')?.querySelector('.v800-scoreboard'),shell=byId('v800-shell');if(!score||!shell)return false;
  if(!byId('vc2023-menubar')){
   const tmp=doc().createElement('div');tmp.innerHTML=markup();const nodes=Array.from(tmp.children);
   score.after(...nodes);
  }
  if(!mounted){mounted=true;doc().addEventListener('click',onClick);doc().addEventListener('keydown',onKey);
   if(root?.MutationObserver){const observer=new root.MutationObserver(refresh);const v=byId('scout-match-mode');if(v)observer.observe(v,{attributes:true,attributeFilter:['class']});observer.observe(shell,{attributes:true,attributeFilter:['data-vc52-mode']});}
   if(typeof root?.setInterval==='function')clock=root.setInterval(()=>{if(visible()&&!doc().hidden)refresh()},2500);
   doc().addEventListener?.('visibilitychange',()=>{if(!doc().hidden)refresh()});
  }
  refresh();return true;
 }
 function diagnostics(){return {version:VERSION,mounted,active:visible(),mode:byId('v800-shell')?.dataset?.vc52Mode||null,windows:[...windows.keys()],menu:activeMenu,video:!!byId('v800-live-video'),code:!!byId('v113-video-code'),zoneBoard:!!byId('vc1613-board'),score:!!byId('v800-score-us'),deviceCount:!!byId('vc52-peer-count'),timer:!!clock};}
 return {VERSION,MENUS,ALLOWED_WINDOWS,collectHistory,markup,boot,refresh,openWindow,closeWindow,closeAll,runAction,ensureHome,diagnostics};
});
