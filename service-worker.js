/* Volley Coach V16.9.7: sincronización y gestión integradas en index.html. */
'use strict';
const BUILD='16.9.7';
const CACHE_NAME='volley-coach-v16.9.7-compact';
const PAGE='./index.html';
const ASSETS=['./vc-reopen-safe-v1694.js','./vc-reopen-entry-v1694.js','./vc-delete-entry-v1694.js','./vc-recovery-v169.js','./vc-csv-reconcile-v1691.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
const scopePath=new URL(self.registration.scope).pathname;
const tag=/<meta\b(?=[^>]*\bname\s*=\s*["']volley-coach-build["'])(?=[^>]*\bcontent\s*=\s*["']([\d.]+)["'])[^>]*>/i;
function compare(a,b){const A=String(a||'').split('.').map(x=>Number(x)||0),B=String(b||'').split('.').map(x=>Number(x)||0);for(let i=0;i<Math.max(A.length,B.length);i++){if((A[i]||0)!==(B[i]||0))return A[i]>B[i]?1:-1}return 0}
async function pageBuild(response){
 const body=response.clone().body;
 if(!body?.getReader)return tag.exec((await response.clone().text()).slice(0,4096))?.[1]||null;
 const reader=body.getReader(),decoder=new TextDecoder();let head='';
 try{while(head.length<4096){const r=await reader.read();if(r.done)break;head+=decoder.decode(r.value,{stream:true});const v=tag.exec(head)?.[1];if(v)return v}
  return tag.exec(head)?.[1]||null;
 }finally{void reader.cancel().catch(()=>{})}
}
async function verified(request){const r=await fetch(request,{cache:'no-store',redirect:'follow'});if(!r?.ok)throw Error('HTML no accesible');const v=await pageBuild(r);if(!v||compare(v,BUILD)<0)throw Error('El HTML publicado todavía es anterior a '+BUILD);return r}
async function precache(){const html=await verified(PAGE);const cache=await caches.open(CACHE_NAME);
 await cache.put(PAGE,html);
 // No activamos una PWA que carezca de un módulo crítico.
 await Promise.all(ASSETS.map(async path=>{const response=await fetch(path,{cache:'no-store'});if(!response?.ok)throw Error('Recurso PWA ausente: '+path);await cache.put(path,response.clone())}));
}
self.addEventListener('install',e=>e.waitUntil(precache().then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('volley-coach-v')).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('message',e=>{if(e.data?.type==='VC_GET_BUILD')e.ports?.[0]?.postMessage({version:BUILD});if(e.data==='SKIP_WAITING')e.waitUntil(self.skipWaiting())});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url),same=url.origin===self.location.origin;
 if(req.mode==='navigate'){
  if(!same||!url.pathname.startsWith(scopePath))return;
  e.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);
    try{const r=await verified(req);e.waitUntil(cache.put(PAGE,r.clone()).catch(()=>{}));return r}
    catch{const r=await cache.match(PAGE);return r||new Response('Volley Coach: versión no disponible sin conexión.',{status:503})}
  })());return;
 }
 if(same){e.respondWith((async()=>{const c=await caches.open(CACHE_NAME);
  try{const r=await fetch(req,{cache:'no-store'});if(r?.ok){e.waitUntil(c.put(req,r.clone()).catch(()=>{}));return r}}catch{}
  return await c.match(req,{ignoreSearch:true})||Response.error();
 })());return}
 e.respondWith((async()=>{try{const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){const c=await caches.open(CACHE_NAME);e.waitUntil(c.put(req,r.clone()).catch(()=>{}))}return r}catch{return await caches.match(req)||Response.error()}})());
});
