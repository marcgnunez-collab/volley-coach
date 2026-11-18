/* Compile TypeScript business-domain checks to a stable browser ES module.
 * Uses a separate output directory; it cannot erase the source tree.
 */
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({
 root:ROOT,
 publicDir:false,
 build:{
  outDir:'dist-domain',emptyOutDir:true,sourcemap:false,
  lib:{entry:path.join(ROOT,'src/vc2055-entry.ts'),formats:['es'],fileName:()=>'vc2055-domain-core.mjs'}
 }
});
