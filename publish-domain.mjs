/* Mechanical output copy after Vite library build, never deletes sources. */
import {copyFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const input=path.join(ROOT,'dist-domain/vc2055-domain-core.mjs');
const output=path.join(ROOT,'vc2055-domain-core.mjs');
const info=await stat(input);
if(!info.isFile()||info.size<1000)throw Error('Domain bundle is empty or missing.');
await copyFile(input,output);
console.log('V20.5.5: módulo de dominio ES6 actualizado desde TypeScript.');
