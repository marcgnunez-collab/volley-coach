/* Volley Coach V17.9.0 · Actualizaciones comprobadas y recuperación sin borrar datos.
   Navegación y scripts: red primero, caché solo si falla la red.
   Las respuestas privadas de Supabase no se interceptan ni se almacenan.
   No toca localStorage ni IndexedDB. La caché NO garantiza uso completo offline. */
'use strict';
const CACHE_NAME='volley-coach-v18.7.0-training-pro';
const APP_PREFIX='volley-coach-v';
const SHELL=['./index.html','./recuperacion.html','./vc17-workspace.css','./manifest.webmanifest','./154-vc1790-sync-safety.js','./155-vc17100-unified-video.js','./157-vc17120-match-recording-pro.js','./158-vc17121-install-health.js','./159-vc1800-cross-video-evidence.js','./160-vc1810-video-studio-layout.js','./161-vc1820-video-reliability.js','./162-vc1830-video-workspaces.js','./163-vc1845-video-polish.js','./164-vc1850-home-dashboard.js','./165-vc1851-match-center-pro.js','./166-vc1860-training-planner.js'];
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
