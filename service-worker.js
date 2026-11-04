const CACHE_NAME = 'volley-coach-v16.0.5.1.2-global-dedup';

const MODULE_ASSETS = [
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
  "./107-vc16034-recording-pro.js"
];

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];
async function cacheShellSafely(){const cache=await caches.open(CACHE_NAME);await Promise.allSettled([...APP_SHELL,...MODULE_ASSETS].map(async path=>{try{const response=await fetch(path,{cache:'no-store'});if(response&&(response.ok||response.type==='opaque'))await cache.put(path,response.clone())}catch(_){}}))}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  await cacheShellSafely();
  const cache=await caches.open(CACHE_NAME);
  for(const path of MODULE_ASSETS){
    let response=await cache.match(path);
    if(!response||!response.ok){
      response=await fetch(path,{cache:'no-store'});
      if(!response.ok)throw new Error('Módulo obligatorio no disponible: '+path);
      await cache.put(path,response.clone());
    }
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('volley-coach-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy)).catch(()=>{}))}return response}).catch(async()=>await caches.match('./index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true})));return}if(url.origin===self.location.origin&&/(?:manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)/.test(url.pathname)){event.respondWith((async()=>{const cached=await caches.match(request,{ignoreSearch:true});const refresh=fetch(request,{cache:'no-store'}).then(async response=>{if(response&&response.ok){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})());return}if(url.origin===self.location.origin){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(request,copy)).catch(()=>{}))}return response}).catch(()=>caches.match(request,{ignoreSearch:true})));return}event.respondWith((async()=>{const cached=await caches.match(request);const refresh=fetch(request).then(async response=>{if(response&&(response.ok||response.type==='opaque')){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})())});
