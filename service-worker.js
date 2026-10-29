/* Volley Coach V16.6.1 · PWA estable y anti-retroceso.
   Solo activa esta revisión cuando el HTML publicado es de la misma versión.
   Los datos de entrenamiento/scouting se conservan en storage y Supabase. */
'use strict';
const BUILD='16.6.1';
const CACHE_NAME='volley-coach-v16.6.1-stable-pwa';
const PAGE='./index.html';
const ASSETS=['./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const EXTRA=['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
const scopePath=new URL(self.registration.scope).pathname;
function compare(a,b){
  const A=String(a||'').split('.').map(n=>Number(n)||0), B=String(b||'').split('.').map(n=>Number(n)||0);
  for(let i=0;i<Math.max(A.length,B.length);i++)if((A[i]||0)!==(B[i]||0))return (A[i]||0)>(B[i]||0)?1:-1;
  return 0;
}
const tag=/<meta\s+name=["']volley-coach-build["']\s+content=["']([\d.]+)["']/i;
async function pageBuild(response){
  const body=response.clone().body;
  if(!body||!body.getReader){const t=await response.clone().text();return tag.exec(t.slice(0,4096))?.[1]||null}
  const reader=body.getReader(),decoder=new TextDecoder();let head='';
  try{
    while(head.length<4096){const r=await reader.read();if(r.done)break;head+=decoder.decode(r.value,{stream:true});const v=tag.exec(head)?.[1];if(v)return v}
    return tag.exec(head)?.[1]||null;
  }finally{void reader.cancel().catch(()=>{})}
}
async function verifiedPage(request){
  const response=await fetch(request,{cache:'no-store',redirect:'follow'});
  if(!response||!response.ok)throw new Error('No hay HTML válido publicado');
  const published=await pageBuild(response);
  if(!published||compare(published,BUILD)<0)throw new Error('HTML antiguo o sin versión: no sustituir la versión instalada');
  return response;
}
async function precache(){
  // La instalación FALLA si la publicación todavía muestra un HTML viejo.
  // En tal caso, el Service Worker anterior sigue activo y se reintentará en otra visita.
  const html=await verifiedPage(PAGE);
  const cache=await caches.open(CACHE_NAME);
  await cache.put(PAGE,html);
  await Promise.allSettled(ASSETS.map(async url=>{
    const r=await fetch(url,{cache:'no-store'});
    if(r&&(r.ok||r.type==='opaque'))await cache.put(url,r.clone());
  }));
}
self.addEventListener('install',event=>event.waitUntil(precache().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE_NAME && k.startsWith('volley-coach-v')).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type==='VC_GET_BUILD'){event.ports?.[0]?.postMessage({version:BUILD});return}
  if(event.data==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url),sameOrigin=url.origin===self.location.origin;
  if(request.mode==='navigate'){
    if(!sameOrigin||!url.pathname.startsWith(scopePath))return;
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const fresh=await verifiedPage(request);
        event.waitUntil(cache.put(PAGE,fresh.clone()).catch(()=>{}));
        return fresh;
      }catch(e){
        const stable=await cache.match(PAGE);
        if(stable)return stable;
        return new Response('Volley Coach: versión no disponible sin conexión. Reabre con Internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());return;
  }
  if(sameOrigin){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const r=await fetch(request,{cache:'no-store'});
        if(r&&r.ok){event.waitUntil(cache.put(request,r.clone()).catch(()=>{}));return r}
      }catch(_){}
      return await cache.match(request,{ignoreSearch:true})||Response.error();
    })());return;
  }
  // CDN: la caché es solo apoyo offline, sin interferir con las versiones del HTML.
  event.respondWith((async()=>{
    try{
      const r=await fetch(request);
      if(r&&(r.ok||r.type==='opaque')){const c=await caches.open(CACHE_NAME);event.waitUntil(c.put(request,r.clone()).catch(()=>{}))}
      return r;
    }catch(_){return await caches.match(request)||Response.error()}
  })());
});
