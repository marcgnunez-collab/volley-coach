/* Volley Coach V20.5.0 · Deployment diagnostics.
 * Read-only: never inspects scouting, accounts, IndexedDB or cloud state.
 * Checks optional static assets only when the user explicitly requests it.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.VC_RELEASE_HEALTH_2050 = api;
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => api.mount(root), {once:true});
    } else api.mount(root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const VERSION = '20.5.0.2';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function assets(doc) {
    const found = new Map();
    for (const element of doc.querySelectorAll('link[rel="stylesheet"][href],script[src]')) {
      const uri = element.getAttribute(element.tagName.toLowerCase() === 'link' ? 'href' : 'src');
      if (!uri || !/^\.\//.test(uri)) continue;
      const file = uri.split(/[?#]/)[0];
      if (!found.has(file)) found.set(file, element.tagName.toLowerCase() === 'link' ? 'css' : 'js');
    }
    return [...found].map(([file,type]) => ({file,type}));
  }
  async function check(items, fetcher, base) {
    const results=[];
    // Small batches avoid flooding the deployment server and mobile radios.
    for(let i=0;i<items.length;i+=4) {
      const batch=items.slice(i,i+4);
      results.push(...await Promise.all(batch.map(async item => {
        try {
          const url=new URL(item.file,base);
          if(url.origin!==new URL(base).origin) return {...item,status:'error'};
          const response=await fetcher(url.href,{method:'GET',cache:'no-store',redirect:'follow'});
          // SPA fallback can return index.html as 200 for a missing asset.
          const mime=response.headers?.get?.('content-type') || '';
          const expected=item.type==='js' ? /javascript|ecmascript|text\/plain/i : /css|text\/plain/i;
          const invalidMime=/text\/html/i.test(mime) || (!!mime && !expected.test(mime));
          return {...item,status:response.ok&&!invalidMime?'ok':response.status===404?'missing':'error',http:response.status};
        } catch (_) {return {...item,status:'offline'};}
      })));
    }
    return results;
  }
  function summary(results) {
    return {total:results.length,ok:results.filter(r=>r.status==='ok').length,
      missing:results.filter(r=>r.status==='missing'),error:results.filter(r=>r.status==='error'),
      offline:results.filter(r=>r.status==='offline')};
  }
  function organize(doc,host,section) {
    if(doc.getElementById('vc20501-management-groups'))return true;
    const original=host.querySelector('.v11-management-grid');
    if(!original)return false;
    const buttons=[...original.children].filter(x=>x.tagName?.toLowerCase()==='button');
    if(buttons.length<10)return false; // Never reorganize an unexpected legacy screen.
    const container=doc.createElement('div');container.id='vc20501-management-groups';
    container.className='vc20501-groups';
    const config=[
      {name:'Organización deportiva',sub:'Equipo, partidos y planificación',indices:[0,1,2,3]},
      {name:'Nube y protección de datos',sub:'Sincronización, copias y recuperación',indices:[4,5,6]},
      {name:'Auditorías y mantenimiento',sub:'Herramientas para diagnosticar sin modificar datos',indices:[7,8,9]}
    ];
    for(const group of config){
      const block=doc.createElement('section');block.className='vc20501-group';
      const heading=doc.createElement('div');heading.className='vc20501-group-head';
      const title=doc.createElement('h3');title.textContent=group.name;
      const description=doc.createElement('p');description.textContent=group.sub;
      heading.append(title,description);block.append(heading);
      const grid=doc.createElement('div');grid.className='v11-management-grid';
      for(const index of group.indices)grid.appendChild(buttons[index]);
      if(group.name==='Auditorías y mantenimiento'){
        const card=doc.createElement('button');card.type='button';
        card.className='vc20501-health-card';
        card.innerHTML='<span>◇</span><div><b>Integridad de instalación</b><small>Comprobar archivos de Volley Coach · V20.5.0.1</small></div><strong>→</strong>';
        card.addEventListener('click',()=>{
          section.scrollIntoView?.({behavior:'smooth',block:'start'});
          section.querySelector('.vc2050-check')?.focus?.();
        });
        grid.appendChild(card);
      }
      block.appendChild(grid);container.appendChild(block);
    }
    // Move the original buttons (with their handlers) instead of cloning them.
    original.replaceWith(container);
    return true;
  }
  function mount(root) {
    const doc=root.document;
    const host=doc.getElementById('v11-management') || doc.getElementById('vc60-diagnostics')?.parentElement;
    if(!host)return false;
    let section=doc.getElementById('vc2050-release-health');
    if(!section){
      section=doc.createElement('section');
      section.id='vc2050-release-health';section.className='vc2050-health';
      section.innerHTML='<div class="vc20501-heading"><div><small>COMPROBACIÓN DEL SISTEMA · V20.5.0.2</small><h3>Integridad de instalación</h3><p>Comprueba que los archivos de interfaz están publicados. No lee ni modifica datos del club, vídeos ni la nube.</p></div><span class="vc20501-pill">Solo lectura</span></div><button type="button" class="vc2050-check">Comprobar archivos</button><div class="vc2050-result" role="status" aria-live="polite">Sin comprobar</div>';
      const heading=host.querySelector('.v11-page-head');
      if(heading)heading.insertAdjacentElement('afterend',section);
      else host.prepend(section);
    }
    if(section.dataset.vc2050Bound==='1')return true;
    section.dataset.vc2050Bound='1';
    organize(doc,host,section); // No-op if the HTML already supplies the layout.
    const button=section.querySelector('button'),out=section.querySelector('.vc2050-result');
    button.addEventListener('click',async()=>{
      button.disabled=true;out.textContent='Comprobando archivos locales publicados…';
      try {
        const result=summary(await check(assets(doc),root.fetch.bind(root),doc.baseURI));
        const problems=[...result.missing,...result.error,...result.offline];
        out.innerHTML=`<strong>${result.ok}/${result.total} disponibles</strong> · ${result.missing.length} ausentes · ${result.error.length} con error · ${result.offline.length} sin conexión. `+
          (problems.length?`<details><summary>Ver ${problems.length} incidencias</summary><ul>${problems.map(r=>`<li>${escape(r.file)} — ${escape(r.status)}</li>`).join('')}</ul></details>`:
           '<span>Sin incidencias entre los archivos comprobados.</span>')+
          '<p>La comprobación de archivos no sustituye las pruebas de scouting, vídeo o sincronización real.</p>';
      } catch(_){out.textContent='No se pudo completar la comprobación. Inténtalo de nuevo con conexión.';}
      finally{button.disabled=false;}
    });
    return true;
  }
  return {VERSION,assets,check,summary,mount,organize};
});
