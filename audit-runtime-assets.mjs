/* V20.7.0 · Deterministic, read-only audit of deployable root assets.
 * Intentionally conservative: string-referenced or precached files are kept.
 * Does not access club data, browser storage, network or Supabase. */
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const ASSET=/\.(?:js|mjs|css|webmanifest|html|png|svg|ico|webp|jpe?g|gif|woff2?)$/i;
const DEPENDENCY_SOURCE=/\.(?:js|mjs|ts|css)$/i;
const BUILD_CONFIGS=new Set(['vite.config.mjs','vite.domain.config.mjs']);
const REFERENCE_ATTR=/\b(?:src|href|poster)\s*=\s*["'](\.\/[^"']+)["']/gi;
const CSS_URL=/\burl\(\s*["']?(\.\/[^"')\s]+)["']?\s*\)/gi;
const RETIREMENT_MANIFEST='scripts/retained-legacy-assets.json';

function retainedAssets(root,errors){
 const file=path.join(root,RETIREMENT_MANIFEST);
 if(!existsSync(file))return new Set();
 const names=new Set();
 try{
  const data=JSON.parse(readFileSync(file,'utf8'));
  if(data.schema!=='vc-pending-retirement/1'||data.policy!=='KEEP_UNTIL_MIGRATION_FINISHED'||!Array.isArray(data.groups))
   throw Error('invalid schema or policy');
  for(const group of data.groups){
   if(!/^\d+\.\d+\.\d+$/.test(group.identifiedIn)||!Array.isArray(group.files))throw Error('invalid group');
   for(const name of group.files){
    if(typeof name!=='string'||name==='.'||name==='..'||name.includes('/')||name.includes('\\')||names.has(name))
     throw Error(`invalid or duplicated name ${name}`);
    names.add(name);
   }
  }
 }catch(error){errors.push(`${RETIREMENT_MANIFEST}: ${error.message}`);}
 return names;
}

function walk(dir){
 if(!existsSync(dir))return [];
 const output=[];
 for(const item of readdirSync(dir,{withFileTypes:true})){
  const target=path.join(dir,item.name);
  if(item.isDirectory())output.push(...walk(target));
  else if(item.isFile())output.push(target);
 }
 return output;
}
function references(text,pattern){
 return Array.from(text.matchAll(pattern),match=>match[1]);
}
function canonicalLocal(root,source){
 if(!source.startsWith('./'))return null;
 const clean=source.split(/[?#]/,1)[0];
 const absolute=path.resolve(root,clean);
 return absolute.startsWith(root+path.sep)?absolute:null;
}
function shellPaths(source){
 const events=[];
 const sandbox={self:{addEventListener:(name,listener)=>events.push([name,listener])},URL};
 vm.runInNewContext(source+'\n;globalThis.__ASSET_AUDIT_SHELL=SHELL;',sandbox,{timeout:1500});
 const result=sandbox.__ASSET_AUDIT_SHELL;
 if(!Array.isArray(result)||events.length<3)throw Error('Invalid service worker shell structure');
 return Array.from(result);
}

export function auditRuntimeAssets(root=ROOT){
 root=path.resolve(root);
 const errors=[],client=new Set(),precached=new Set();
 const required=['index.html','recuperacion.html','service-worker.js','manifest.webmanifest'];
 for(const file of required)if(!existsSync(path.join(root,file)))errors.push(`Missing required file: ${file}`);
 if(errors.length)return {errors,client:0,precache:0,assets:0,unreferenced:[]};
 const check=(value,origin,owner)=>{
  const target=canonicalLocal(root,value);
  if(!target){errors.push(`${origin}: unsafe local reference ${value}`);return;}
  const name=path.relative(root,target).replaceAll(path.sep,'/');
  if(!existsSync(target)||!statSync(target).isFile())errors.push(`${origin}: missing file ${name}`);
  owner.add(name);
 };
 const htmls=['index.html','recuperacion.html'];
 for(const name of htmls){
  const html=readFileSync(path.join(root,name),'utf8');
  for(const value of references(html,REFERENCE_ATTR))check(value,name,client);
  for(const value of references(html,CSS_URL))check(value,name,client);
  const ids=references(html,/<script\b[^>]*\bid\s*=\s*["']([^"']+)["']/gi),seen=new Set();
  for(const id of ids){if(seen.has(id))errors.push(`${name}: duplicate script id ${id}`);seen.add(id);}
 }
 const manifest=JSON.parse(readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 for(const item of manifest.icons??[])if(typeof item.src==='string')check(item.src,'manifest.webmanifest',client);
 const sw=readFileSync(path.join(root,'service-worker.js'),'utf8');
 let shell=[];try{shell=shellPaths(sw)}catch(error){errors.push(`service-worker.js: ${error.message}`);}
 for(const file of shell){
  if(typeof file!=='string'||precached.has(file)){
   errors.push(`service-worker.js: duplicated or invalid precache entry ${file}`);continue;
  }
  precached.add(file);check(file,'service-worker.js',new Set());
 }
 const retained=retainedAssets(root,errors);
 for(const name of retained)if(client.has(name)||precached.has('./'+name))
  errors.push(`${RETIREMENT_MANIFEST}: retained legacy file is still loaded: ${name}`);
 const top=readdirSync(root,{withFileTypes:true})
  .filter(item=>item.isFile()&&ASSET.test(item.name)).map(item=>item.name);
 const sourceFiles=top.filter(name=>DEPENDENCY_SOURCE.test(name)&&!BUILD_CONFIGS.has(name))
  .map(name=>path.join(root,name));
 sourceFiles.push(...walk(path.join(root,'src')).filter(name=>DEPENDENCY_SOURCE.test(name)));
 const sources=sourceFiles.map(file=>[path.relative(root,file),readFileSync(file,'utf8')]);
 const unreferenced=[];
 for(const name of top){
  if(BUILD_CONFIGS.has(name)||required.includes(name)||client.has(name)||precached.has('./'+name)||retained.has(name))continue;
  if(sources.some(([origin,text])=>origin!==name&&text.includes(name)))continue;
  unreferenced.push(name);errors.push(`Unreferenced deployable asset: ${name}`);
 }
 return {errors,client:client.size,precache:precached.size,assets:top.length,
  retainedPresent:top.filter(name=>retained.has(name)).length,
  retainedCandidates:retained.size,unreferenced:unreferenced.sort()};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditRuntimeAssets();
 if(result.errors.length){
  for(const error of result.errors)console.error('ASSET AUDIT:',error);
  process.exitCode=1;
 }else console.log(`ASSET AUDIT OK · ${result.assets} root assets · ${result.client} client references · ${result.precache} precached paths · ${result.retainedCandidates} deferred-retirement candidates · ${result.retainedPresent} still present · 0 unclassified orphan assets`);
}
