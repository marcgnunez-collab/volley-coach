/* Volley Coach V16.0.6.4 · atomic versioned app shell, cached navigation */
'use strict';
const CACHE_NAME='volley-coach-v16.0.6.4-code-cleanup';
const MODULE_ASSETS=[
  "./002-core-training-v150-monolithic.js",
  "./003-players-pro-v2-script.js",
  "./005-season-player-load-script.js",
  "./006-v511-performance-suite-script.js",
  "./011-v5115-pdf-rosters-script.js",
  "./012-v5116-pdf-summary-patch.js",
  "./020-v5120-efficiency-script.js",
  "./021-core-scouting-v150-monolithic.js",
  "./024-v702-video-persistence-hotfix.js",
  "./025-v710-video-analysis-module.js",
  "./026-v720-clip-studio-module.js",
  "./027-v730-live-delay-module.js",
  "./028-v740-live-scout-video-module.js",
  "./029-v750-professional-reports-module.js",
  "./030-v752-native-pdf-fix.js",
  "./036-v760-remote-camera-module.js",
  "./037-v770-recording-studio-module.js",
  "./038-v780-match-video-hub-module.js",
  "./039-v790-season-analytics-module.js",
  "./040-v800-match-mode-module.js",
  "./042-v900-professional-workspace-script.js",
  "./060-v1000-match-intelligence-runtime.js",
  "./065-v114-analysis-professional-runtime.js",
  "./070-v120-native-management-script.js",
  "./077-v132-scouting-pro-workspace.js",
  "./080-v135-professional-analysis-runtime.js",
  "./081-v136-team-roster-runtime.js",
  "./083-v138-realtime-mobile-runtime.js",
  "./108-vc16040-sync-pro.js",
  "./109-vc16041-team-switch-pro.js",
  "./110-vc16043-analysis-pro.js",
  "./111-vc16044-scouting-video-ux.js",
  "./112-vc16045-scouting-keyboard-pro.js",
  "./113-vc16045-analysis-unified.js",
  "./114-vc16052-scouting-unificado.js",
  "./088-v151-season-performance-module.js",
  "./089-v152-smart-rally-reports-exchange.js",
  "./095-vc154-collaboration-runtime.js",
  "./096-vc155-bench-runtime.js",
  "./097-vc156-historical-pro-runtime.js",
  "./098-vc157-opponent-intelligence-module.js",
  "./099-vc158-bench-runtime.js",
  "./100-vc159-stats-video-runtime.js",
  "./101-vc160-video-health-module.js",
  "./102-vc1601-analysis-performance.js",
  "./104-vc16023-analysis-render-guard.js",
  "./105-vc16032-video-review-pro.js",
  "./106-vc16033-scouting-clips.js",
  "./116-vc16058-video-workspace.js",
  "./107-vc16034-recording-pro.js"
];
const SHELL=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const requiredPaths=new Set(MODULE_ASSETS.map(p=>new URL(p,self.registration.scope).pathname));
const isCloudOrApi=u=>/supabase\.(?:co|in)$/.test(u.hostname)||/(?:\/rest\/v1\/|\/auth\/v1\/|\/realtime\/v1\/|\/storage\/v1\/)/.test(u.pathname);
async function cacheFresh(cache,url){
  const res=await fetch(url,{cache:'no-store'});
  if(!res||!res.ok)throw new Error('Recurso obligatorio no disponible: '+url);
  await cache.put(url,res.clone());return res;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // Mandatory script files: complete installation before becoming the active SW.
  // Parallel network fetching takes place once on update, not on every launch.
  const results=await Promise.allSettled([...MODULE_ASSETS,'./index.html'].map(p=>cacheFresh(cache,p)));
  const errors=results.filter(r=>r.status==='rejected');
  if(errors.length)throw new Error('No se puede activar una versión incompleta: '+errors.length+' recursos');
  // Optional images and manifest must not delay installation.
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('volley-coach-')).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(isCloudOrApi(url))return; // never cache Supabase auth, Realtime or database data.
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   // Version-atomic: HTML is cached with its mandatory JS files during install.
   // Do not update HTML alone on navigation (that could load mismatched scripts).
   const cached=await cache.match('./index.html',{ignoreSearch:true});
   if(cached)return cached;
   try{const res=await fetch(req,{cache:'no-store'});return res&&res.ok?res:Response.error()}
   catch(_){return Response.error()}
  })());return;
 }
 if(url.origin===self.location.origin){
  if(requiredPaths.has(url.pathname)||/\.(?:js|css|webmanifest|png|svg|ico|woff2?)$/i.test(url.pathname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_NAME);
     const cached=await cache.match(req,{ignoreSearch:true});
     if(cached)return cached; // zero network waits for already installed scripts
     try{const res=await fetch(req);if(res&&res.ok)event.waitUntil(cache.put(req,res.clone()).catch(()=>{}));return res}catch(_){return Response.error()}
   })());return;
  }
  return; // dynamic same-origin endpoints use browser/network, never stale cache.
 }
 // External libraries (PDF, Supabase JS) may be cached; API calls must not be.
 if(/(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_NAME);const hit=await cache.match(req);
     if(hit)return hit;
     try{const res=await fetch(req);if(res&&(res.ok||res.type==='opaque'))event.waitUntil(cache.put(req,res.clone()).catch(()=>{}));return res}catch(_){return Response.error()}
   })());
 }
});
