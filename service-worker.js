const CACHE_NAME = 'volley-coach-v16.0.8-monolithic';

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
async function cacheShellSafely(){const cache=await caches.open(CACHE_NAME);await Promise.allSettled(APP_SHELL.map(async path=>{try{const response=await fetch(path,{cache:'no-store'});if(response&&(response.ok||response.type==='opaque'))await cache.put(path,response.clone())}catch(_){}}))}
self.addEventListener('install',event=>event.waitUntil(cacheShellSafely().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy)).catch(()=>{}))}return response}).catch(async()=>await caches.match('./index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true})));return}if(url.origin===self.location.origin&&/(?:manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)/.test(url.pathname)){event.respondWith((async()=>{const cached=await caches.match(request,{ignoreSearch:true});const refresh=fetch(request,{cache:'no-store'}).then(async response=>{if(response&&response.ok){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})());return}if(url.origin===self.location.origin){event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{if(response&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(request,copy)).catch(()=>{}))}return response}).catch(()=>caches.match(request,{ignoreSearch:true})));return}event.respondWith((async()=>{const cached=await caches.match(request);const refresh=fetch(request).then(async response=>{if(response&&(response.ok||response.type==='opaque')){const c=await caches.open(CACHE_NAME);await c.put(request,response.clone())}return response}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return await refresh||Response.error()})())});
