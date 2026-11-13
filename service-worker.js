/* Volley Coach V19.2.5 · App shell y videoteca, conservando la fiabilidad V19.1.
   Navegación y scripts: red primero, caché solo si falla la red.
   Las respuestas privadas de Supabase no se interceptan ni se almacenan.
   No toca localStorage ni IndexedDB. La caché NO garantiza uso completo offline. */
'use strict';
const CACHE_NAME='volley-coach-v19.3.11.3-analysis-visual-refinement';
const APP_PREFIX='volley-coach-v';
const SHELL=['./index.html','./recuperacion.html','./vc17-workspace.css','./vc19-workflow.css','./143-vc1700-professional-workspace.js','./146-vc1720-match-workspace.js','./170-vc1900-unified-workflow.js','./172-vc1912-match-consolidation.js','./manifest.webmanifest','./122-vc1614-analysis-intelligence.js','./124-vc16155-analyst-studio.js','./126-vc1617-all-skills-analytics.js','./136-vc1651-tactical-laboratory.js','./139-vc1656-comparisons.js','./140-vc1657-professional-reports.js','./147-vc1730-analysis-workspace.js','./153-vc1780-cross-analysis.js','./167-vc1880-analysis-pro.js','./168-vc1881-setter-pro.js','./169-vc1890-rotation-matchup-pro.js','./154-vc1790-sync-safety.js','./155-vc17100-unified-video.js','./157-vc17120-match-recording-pro.js','./158-vc17121-install-health.js','./159-vc1800-cross-video-evidence.js','./160-vc1810-video-studio-layout.js','./161-vc1820-video-reliability.js','./162-vc1830-video-workspaces.js','./163-vc1845-video-polish.js','./164-vc1850-home-dashboard.js','./165-vc1851-match-center-pro.js','./166-vc1860-training-planner.js','./171-vc1910-data-reliability.js','./173-vc1915-conflicts-recovery.js','./174-vc1916-scout-undo-realtime.js','./175-vc1917-universal-sync.js','./176-vc1920-video-connection-hub.js','./177-vc1921-delay-policy.js','./178-vc1922-review-policy.js','./179-vc1923-video-timeline-model.js','./180-vc1923-video-scout-links.js','./vc1923-video-scout-links.css','./vc1924-clip-studio.css','./181-vc1924-clip-studio-workbench.js','./182-vc1925-library-health.js','./183-vc1930-tactical-rival-desk.js','./184-vc1933-analysis-engine.js','./185-vc1934-setter-attack-intelligence.js','./186-vc1935-analysis-workspace.js','./187-vc1936-analysis-three-pane.js','./189-vc1938-professional-data-engine.js','./vc1938-data-engine.css','./190-vc1939-rally-search-pro.js','./vc1939-rally-search.css','./188-vc1937-analysis-main-rebuild.js','./191-vc19310-professional-analysis-architecture.js','./vc19310-professional-analysis.css','./192-vc19311-professional-analysis-screens.js','./vc19311-professional-screens.css','./vc1937-analysis-main.css','./vc1936-three-pane.css','./vc1930-tactical-rivals.css','./vc1925-library-health.css','./121-vc16131-clip-studio-pro.js','./106-vc16033-scouting-clips.js','./027-v730-live-delay-module.js','./036-v760-remote-camera-module.js','./037-v770-recording-studio-module.js','./vc1920-connection-hub.css','./vc1922-live-delay.css','./083-v138-realtime-mobile-runtime.js','./002-core-training-v150-monolithic.js','./012-v5116-pdf-summary-patch.js'];
const isCloudOrApi=u=>/supabase\.(?:co|in)$/.test(u.hostname)||/(?:\/rest\/v1\/|\/auth\/v1\/|\/realtime\/v1\/|\/storage\/v1\/)/.test(u.pathname);
const asset=u=>/\.(?:js|css|png|webmanifest|svg|ico|woff2?)$/i.test(u.pathname);
async function cacheSuccessful(cache,request,response){
  if(response&&response.ok&&response.type!=='opaque'){
    try{await cache.put(request,response.clone());}catch(_){}
  }
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Instalación tolerante: un recurso opcional no debe bloquear el despliegue.
    await Promise.allSettled(SHELL.map(async(path)=>{
      const request=new Request(new URL(path,self.registration.scope).href,{cache:'no-store'});
      const response=await fetch(request);
      await cacheSuccessful(cache,request,response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(APP_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||isCloudOrApi(url))return;
  if(request.mode!=='navigate'&&!asset(url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response&&response.ok)event.waitUntil(cacheSuccessful(cache,request,response));
      return response; // No sustituir un 404 de despliegue por JS antiguo.
    }catch(_){
      const saved=await cache.match(request,{ignoreSearch:request.mode==='navigate'});
      if(saved)return saved;
      if(request.mode==='navigate'){
        const home=await cache.match(new URL('./index.html',self.registration.scope));
        if(home)return home;
        return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><title>Volley Coach sin conexión</title><body style="font:16px system-ui;padding:30px"><h1>Sin conexión</h1><p>No se puede abrir esta versión sin Internet. Tus datos locales no se han borrado. Vuelve a conectarte para cargar todos los módulos.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
      return Response.error();
    }
  })());
});
