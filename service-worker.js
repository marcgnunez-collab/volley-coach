/* Volley Coach V17.1.0 · SAFE RECOVERY SERVICE WORKER (Sync Clásico intacto)
   Network-first navigation, no blocking 56-resource install, no deletion of user data. */
'use strict';
const CACHE_NAME='volley-coach-v17.1.0-training-workspace';
const isCloudOrApi=u=>/supabase\.(?:co|in)$/.test(u.hostname)||/(?:\/rest\/v1\/|\/auth\/v1\/|\/realtime\/v1\/|\/storage\/v1\/)/.test(u.pathname);
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(isCloudOrApi(url))return;
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_NAME);
     try{
       const response=await fetch(req,{cache:'no-store'});
       if(response&&response.ok){
         event.waitUntil(cache.put(req,response.clone()).catch(()=>{}));
         return response;
       }
     }catch(_){ }
     const saved=await cache.match(req,{ignoreSearch:true});
     if(saved)return saved;
     if(!/recuperacion\.html$/.test(url.pathname)){
       const home=await cache.match(new URL('./index.html',self.registration.scope));
       if(home)return home;
     }
     return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><title>Volley Coach sin conexión</title><body style="font:16px system-ui;padding:30px"><h1>Volley Coach</h1><p>No se puede abrir esta versión sin conexión. Vuelve a intentarlo cuando tengas Internet. No se han borrado tus datos.</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   })());return;
 }
 if(/\.(?:js|css|png|webmanifest|svg|ico|woff2?)$/i.test(url.pathname)){
   event.respondWith((async()=>{
     const cache=await caches.open(CACHE_NAME);
     const saved=await cache.match(req);
     if(saved)return saved;
     try{
       const response=await fetch(req,{cache:'no-store'});
       if(response&&response.ok)event.waitUntil(cache.put(req,response.clone()).catch(()=>{}));
       return response;
     }catch(_){return Response.error()}
   })());
 }
});
