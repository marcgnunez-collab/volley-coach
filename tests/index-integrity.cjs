'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const expected=['vc-sync-v1693.js','vc-recovery-v169.js','vc-csv-reconcile-v1691.js'];
for(const name of expected){
 assert(html.includes('src="./'+name+'"'),'Required script missing: '+name);
 assert(fs.existsSync(name),'Required JS asset absent from repo: '+name);
}
const scripts=[...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script\\s*>/gi)];
let checked=0;
for(const [,body] of scripts){
 if(!body.trim())continue;
 try{new vm.Script(body,{filename:'index.html inline script '+checked});}
 catch(err){throw new Error('Invalid inline script '+checked+': '+err.message)}
 checked++;
}
assert(checked>50,'Unexpectedly few inline scripts, index may be truncated');
assert(html.includes('name="volley-coach-build" content="16.9.3"'),'Build marker drift');
console.log('PASS: index.html '+checked+' inline scripts and external assets');
