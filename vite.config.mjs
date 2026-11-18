/* V20.5.4 · Vite Foundation.
 * Build the first modern modules while retaining the legacy static runtime.
 * No legacy script is rewritten and no data/cloud module is replaced.
 */
import {defineConfig} from 'vite';
import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT=fileURLToPath(new URL('.',import.meta.url));
const STATIC_EXT=/\.(?:js|mjs|css|webmanifest|png|jpe?g|webp|gif|svg|ico|woff2?|html)$/i;

function preserveLegacyRuntime(){
 return {
  name:'volley-coach-preserve-legacy-runtime',
  apply:'build',
  async generateBundle(_options,bundle){
   const entries=await readdir(ROOT,{withFileTypes:true});
   for(const entry of entries){
    if(!entry.isFile()||entry.name==='index.html'||entry.name==='service-worker.js'||!STATIC_EXT.test(entry.name))continue;
    // Vite emits hashed modern bundles. Original filenames remain available
    // for legacy classic scripts, video tools and the existing service worker.
    if(Object.values(bundle).some(asset=>asset.fileName===entry.name))continue;
    this.emitFile({type:'asset',fileName:entry.name,source:await readFile(path.join(ROOT,entry.name))});
   }
   // A fresh offline installation must have the fingerprinted Vite bundles,
   // even if the first page load happened before the SW took control.
   const generated=Object.values(bundle).filter(asset=>asset.fileName.startsWith('assets/')&&
    /\.(?:js|css)$/.test(asset.fileName)).map(asset=>'./'+asset.fileName).sort();
   const original=await readFile(path.join(ROOT,'service-worker.js'),'utf8');
   const marker='/* VC2054_VITE_PRECACHE_INSERTION */';
   if(!original.includes(marker))throw new Error('Missing Vite precache marker in service-worker.js');
   const replacement=generated.length?`SHELL.push(${generated.map(file=>JSON.stringify(file)).join(',')});`:marker;
   this.emitFile({type:'asset',fileName:'service-worker.js',source:original.replace(marker,replacement)});
  }
 };
}

function buildIdentity(){
 return {
  name:'volley-coach-build-identity',
  // Pre-transform is required: normal HTML transforms run too late for Vite
  // to compile and fingerprint the injected TypeScript entrypoint.
  transformIndexHtml:{order:'pre',handler(html){
   // Classic-script preload hints must still target their original filenames.
   // Legacy stylesheet order also matters (the HTML has many inline rules).
   // Hide both temporarily from Vite then restore without changing positions.
   const preserved=html.replace(/<link rel="preload" as="script" href="([^"]+)">/g,
    (_,href)=>`<!--vc2054-legacy-preload:${href}-->`)
    .replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi,tag=>{
     if(!/href="\.\/[^\"]+\.css(?:\?[^\"]*)?"/.test(tag))return tag;
     return `<!--vc2054-legacy-style:${Buffer.from(tag).toString('base64')}-->`;
    });
   return preserved.replace('</head>','<script type="module" src="./src/vc2054-entry.ts"></script>\n</head>');
  }}
 };
}

function restoreLegacyPreloads(){
 return {
  name:'volley-coach-restore-script-preloads',
  transformIndexHtml:{order:'post',handler(html){
   return html.replace(/<!--vc2054-legacy-preload:([^>]+)-->/g,
    (_,href)=>`<link rel="preload" as="script" href="${href}">`)
    .replace(/<!--vc2054-legacy-style:([A-Za-z0-9+/=]+)-->/g,
     (_,encoded)=>Buffer.from(encoded,'base64').toString('utf8'));
  }}
 };
}

export default defineConfig({
 root:ROOT,
 base:'./', // Also works under /volley-coach/ on GitHub Pages.
 publicDir:false,
 plugins:[buildIdentity(),restoreLegacyPreloads(),preserveLegacyRuntime()],
 build:{outDir:'dist',emptyOutDir:true,assetsDir:'assets',sourcemap:false,reportCompressedSize:true},
});
