const CACHE_NAME = 'volley-coach-v16.0.2-modulos';

const MODULE_ASSETS = [
  "./assets/js/training/002-core-training-v150-monolithic.js",
  "./assets/js/training/003-players-pro-v2-script.js",
  "./assets/js/training/005-season-player-load-script.js",
  "./assets/js/training/006-v511-performance-suite-script.js",
  "./assets/js/reports/011-v5115-pdf-rosters-script.js",
  "./assets/js/reports/012-v5116-pdf-summary-patch.js",
  "./assets/js/training/020-v5120-efficiency-script.js",
  "./assets/js/scouting/021-core-scouting-v150-monolithic.js",
  "./assets/js/video/024-v702-video-persistence-hotfix.js",
  "./assets/js/video/025-v710-video-analysis-module.js",
  "./assets/js/video/026-v720-clip-studio-module.js",
  "./assets/js/video/027-v730-live-delay-module.js",
  "./assets/js/video/028-v740-live-scout-video-module.js",
  "./assets/js/reports/029-v750-professional-reports-module.js",
  "./assets/js/reports/030-v752-native-pdf-fix.js",
  "./assets/js/video/036-v760-remote-camera-module.js",
  "./assets/js/video/037-v770-recording-studio-module.js",
  "./assets/js/video/038-v780-match-video-hub-module.js",
  "./assets/js/analysis/039-v790-season-analytics-module.js",
  "./assets/js/scouting/040-v800-match-mode-module.js",
  "./assets/js/scouting/042-v900-professional-workspace-script.js",
  "./assets/js/scouting/060-v1000-match-intelligence-runtime.js",
  "./assets/js/analysis/065-v114-analysis-professional-runtime.js",
  "./assets/js/scouting/070-v120-native-management-script.js",
  "./assets/js/scouting/077-v132-scouting-pro-workspace.js",
  "./assets/js/analysis/080-v135-professional-analysis-runtime.js",
  "./assets/js/scouting/081-v136-team-roster-runtime.js",
  "./assets/js/sync/083-v138-realtime-mobile-runtime.js",
  "./assets/js/analysis/088-v151-season-performance-module.js",
  "./assets/js/scouting/089-v152-smart-rally-reports-exchange.js",
  "./assets/js/sync/095-vc154-collaboration-runtime.js",
  "./assets/js/bench/096-vc155-bench-runtime.js",
  "./assets/js/analysis/097-vc156-historical-pro-runtime.js",
  "./assets/js/analysis/098-vc157-opponent-intelligence-module.js",
  "./assets/js/bench/099-vc158-bench-runtime.js",
  "./assets/js/video/100-vc159-stats-video-runtime.js",
  "./assets/js/video/101-vc160-video-health-module.js",
  "./assets/js/analysis/102-vc1601-analysis-performance.js"
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
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy)).catch(()=>{}))}return response}).catch(async()=>await caches.match('./index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true})));return}if(url.origin===self.location.origin&&/(?:manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)/.test(url.pathname)){event.respondWith((async()=>{const cached=await caches.match(request,{ignoreSearch:true});const refresh=fetch(request,{cache:'no-store'}).then(async response=>{if(response&&response.ok){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})());return}if(url.origin===self.location.origin){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(request,copy)).catch(()=>{}))}return response}).catch(()=>caches.match(request,{ignoreSearch:true})));return}event.respondWith((async()=>{const cached=await caches.match(request);const refresh=fetch(request).then(async response=>{if(response&&(response.ok||response.type==='opaque')){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})())});
