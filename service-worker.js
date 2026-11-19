/* Volley Coach V19.2.5 · App shell y videoteca, conservando la fiabilidad V19.1.
   Navegación y scripts: red primero, caché solo si falla la red.
   Las respuestas privadas de Supabase no se interceptan ni se almacenan.
   No toca localStorage ni IndexedDB. La caché NO garantiza uso completo offline. */
'use strict';
const CACHE_NAME='volley-coach-v19.3.19.3-setter-distribution-visual-19.3.19.3.1-ux-19.3.19.4-tactical-19.3.19.5-match-video-19.3.19.6-global-ui-19.3.19.7-compat-audit-19.3.20-sync-reliability-20.1.0-durable-journal-20.1.1-two-device-20.1.2-match-center-20.2.0-scout-speed-20.2.1-intelligence-20.2.2-professional-workspace-20.2.3-advanced-editor-20.2.4-video-first-20.2.4.1-20.2.5-20.2.5.1-20.2.5.2-safe-conflict-confirmation-20.2.5.3-20.3.0-20.3.1-20.3.2-20.3.2.1-20.3.3-20.3.3.1-20.3.3.2-training-20.4.0-tactical-intelligence-suite-20.4.3-foundation-20.5.0.3-scouting-expert-20.5.1-architecture-20.5.2-modular-core-20.5.3-vite-foundation-20.5.4-domain-20.5.5-shadow-validation-20.5.6-committed-audit-20.5.7-code-grammar-20.5.8-observable-state-20.5.9-live-statistics-20.5.10-player-boxscore-20.5.11-scout-core-extraction-20.5.12';
const APP_PREFIX='volley-coach-v';
const SHELL=['./index.html','./recuperacion.html','./vc17-workspace.css','./143-vc1700-professional-workspace.js','./146-vc1720-match-workspace.js','./170-vc1900-unified-workflow.js','./172-vc1912-match-consolidation.js','./manifest.webmanifest','./122-vc1614-analysis-intelligence.js','./124-vc16155-analyst-studio.js','./126-vc1617-all-skills-analytics.js','./136-vc1651-tactical-laboratory.js','./139-vc1656-comparisons.js','./140-vc1657-professional-reports.js','./147-vc1730-analysis-workspace.js','./153-vc1780-cross-analysis.js','./167-vc1880-analysis-pro.js','./168-vc1881-setter-pro.js','./169-vc1890-rotation-matchup-pro.js','./154-vc1790-sync-safety.js','./155-vc17100-unified-video.js','./157-vc17120-match-recording-pro.js','./158-vc17121-install-health.js','./159-vc1800-cross-video-evidence.js','./160-vc1810-video-studio-layout.js','./161-vc1820-video-reliability.js','./162-vc1830-video-workspaces.js','./163-vc1845-video-polish.js','./164-vc1850-home-dashboard.js','./165-vc1851-match-center-pro.js','./166-vc1860-training-planner.js','./171-vc1910-data-reliability.js','./173-vc1915-conflicts-recovery.js','./174-vc1916-scout-undo-realtime.js','./175-vc1917-universal-sync.js','./176-vc1920-video-connection-hub.js','./177-vc1921-delay-policy.js','./178-vc1922-review-policy.js','./179-vc1923-video-timeline-model.js','./180-vc1923-video-scout-links.js','./181-vc1924-clip-studio-workbench.js','./182-vc1925-library-health.js','./183-vc1930-tactical-rival-desk.js','./184-vc1933-analysis-engine.js','./185-vc1934-setter-attack-intelligence.js','./186-vc1935-analysis-workspace.js','./187-vc1936-analysis-three-pane.js','./189-vc1938-professional-data-engine.js','./190-vc1939-rally-search-pro.js','./188-vc1937-analysis-main-rebuild.js','./191-vc19310-professional-analysis-architecture.js','./192-vc19311-professional-analysis-screens.js','./193-vc19312-video-scoreboard.js','./194-vc193131-scout-video-score-model.js','./195-vc19314-integrated-video-workspace.js','./196-vc19315-scouting-editor-pro.js','./197-vc19316-smart-scouting.js','./198-vc193161-distribution-intelligence.js','./199-vc19317-video-montage-pro.js','./200-vc19318-worksheets-reports-pro.js','./201-vc19319-bench-client-pro.js','./202-vc193191-data-contract.js','./203-vc193191-unified-workspace.js','./vc193191-professional-workspace.css','./204-vc193192-domain-adapters.js','./205-vc193192-club-desk.js','./vc193192-professional-club.css','./vc1931931-visual-system.css','./vc193194-analysis-workspace.css','./206-vc193195-professional-tactical-tables.js','./vc193195-tactical-tables.css','./207-vc193196-match-video-workspace.js','./vc193196-match-video-workspace.css','./vc19319-bench-client-pro.css','./vc19318-worksheets-reports-pro.css','./vc19317-video-montage-pro.css','./vc193161-distribution-intelligence.css','./vc19315-scouting-editor.css','./vc19316-smart-scouting.css','./vc19314-integrated-video.css','./vc193131-scout-scoreboard-pro.css','./040-v800-match-mode-module.js','./vc19312-video-scoreboard.css','./vc19311-professional-screens.css','./vc1936-three-pane.css','./121-vc16131-clip-studio-pro.js','./106-vc16033-scouting-clips.js','./027-v730-live-delay-module.js','./036-v760-remote-camera-module.js','./037-v770-recording-studio-module.js','./083-v138-realtime-mobile-runtime.js','./002-core-training-v150-monolithic.js','./012-v5116-pdf-summary-patch.js','./vc193197-global-ui-optimization.css','./208-vc19320-compatibility-audit.js','./vc19320-compatibility-audit.css','./209-vc2001-sync-reliability.js','./vc2001-sync-reliability.css','./210-vc2011-durable-sync-journal.js','./vc2011-durable-sync-journal.css','./211-vc2012-multi-device-validation.js','./vc2012-multi-device-validation.css','./212-vc2020-match-workspace.js','./vc2020-match-workspace.css','./213-vc2021-scouting-speed-pro.js','./vc2021-scouting-speed-pro.css','./214-vc2022-match-intelligence.js','./vc2022-match-intelligence.css','./215-vc2023-professional-scouting-workspace.js','./vc2023-professional-scouting-workspace.css','./216-vc20241-data-volley-layout-refinement.js','./vc20241-data-volley-layout-refinement.css'];
SHELL.push('./104-vc16023-analysis-render-guard.js','./173-vc1915-conflicts-recovery.js','./217-vc2025-rally-review-pro.js','./vc2025-rally-review-pro.css','./218-vc2030-confirmed-realtime.js','./219-vc2030-sync-status.js','./220-vc2031-entity-commands.js','./221-vc2031-operation-pilot.js','./222-vc2032-migration-planner.js','./223-vc2032-controlled-migration.js','./224-vc20321-competition-sync-diagnostics.js','./225-vc2033-complete-live-sync.js','./226-vc2040-training-pro-workflow.js','./vc2040-training-pro-workflow.css');
SHELL.push('./039-v790-season-analytics-module.js','./227-vc2041-statistical-integrity.js','./228-vc2042-rival-intelligence.js','./229-vc2043-live-tactical-assistant.js','./vc2041-2043-tactical-intelligence.css');
SHELL.push('./230-vc2050-release-health.js','./vc2050-release-health.css');
SHELL.push('./231-vc2051-scouting-expert.js','./vc2051-scouting-expert.css');
SHELL.push('./232-vc2052-architecture-foundation.js','./vc2052-architecture-foundation.css');
SHELL.push('./vc2052-match-contract.mjs','./vc2053-match-reader.mjs','./vc2053-modular-core.mjs','./vc2053-modular-core.css');
SHELL.push('./233-vc20512-match-state-core.js','./234-vc20512-match-state-adapters.js');
SHELL.push('./vc2055-domain-core.mjs','./vc2055-domain.css');
/* VC2054_VITE_PRECACHE_INSERTION */
const isCloudOrApi=u=>/supabase\.(?:co|in)$/.test(u.hostname)||/(?:\/rest\/v1\/|\/auth\/v1\/|\/realtime\/v1\/|\/storage\/v1\/)/.test(u.pathname);
const asset=u=>/\.(?:m?js|css|png|webmanifest|svg|ico|woff2?)$/i.test(u.pathname);
async function cacheSuccessful(cache,request,response){
  if(response&&response.ok&&response.type!=='opaque'){
    try{await cache.put(request,response.clone());}catch(_){}
  }
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Instalación tolerante. Precarga limitada: una lista larga de módulos no
    // debe abrir una ráfaga de >100 peticiones simultáneas en dispositivos móviles.
    // Se mantienen TODOS los recursos históricos y sus políticas de caché.
    const queue=SHELL.slice();
    async function worker(){
      while(queue.length){
        const path=queue.shift();
        try{
          const request=new Request(new URL(path,self.registration.scope).href,{cache:'no-store'});
          const response=await fetch(request);
          await cacheSuccessful(cache,request,response);
        }catch(_){/* Recurso opcional ausente o red caída: no abortar instalación. */}
      }
    }
    await Promise.all(Array.from({length:Math.min(6,queue.length)},()=>worker()));
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
      // ES modules are pre-cached without query strings, while the entrypoint
      // is cache-busted (?v=20.5.3). Permit that same-file offline fallback.
      const saved=await cache.match(request,{ignoreSearch:request.mode==='navigate'||/\.mjs$/i.test(url.pathname)});
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
