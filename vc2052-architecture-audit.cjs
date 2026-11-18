'use strict';
/* V20.5.2: deterministic static architecture inventory. Run: node vc2052-architecture-audit.cjs
 * No credentials, network, browsing data or persistent state accessed.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
function count(text,regex){return [...text.matchAll(regex)].length;}
function scan(directory=root){
 const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
 const list=fs.readdirSync(directory).filter(name=>fs.statSync(path.join(directory,name)).isFile());
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']\.\/([^"'?#]+)(?:\?[^"']*)?["']/gi)].map(m=>m[1]);
 const styles=[...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']\.\/([^"'?#]+)(?:\?[^"']*)?["']/gi)].map(m=>m[1]);
 const references=[...new Set([...scripts,...styles])];
 const missing=references.filter(name=>!fs.existsSync(path.join(directory,name)));
 const duplicates=[...new Set(scripts.filter((name,i)=>scripts.indexOf(name)!==i))];
 const js=list.filter(name=>name.endsWith('.js'));
 const hotspots=js.map(file=>{
  const source=fs.readFileSync(path.join(directory,file),'utf8');
  // These are candidates, not confirmed overwrites or memory leaks.
  const globalBindings=count(source,/(?:window|globalThis|root)\.[A-Za-z_$][\w$]*\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>)/g);
  const wrapperCaptures=count(source,/(?:const|let)\s+[A-Za-z_$][\w$]*(?:Base|Original|Previous)\s*=\s*(?:window\.)?[A-Za-z_$][\w$]*/g);
  return {file,bytes:Buffer.byteLength(source),globalFunctionAssignments:globalBindings,possibleWrapperCaptures:wrapperCaptures};
 }).sort((a,b)=>b.possibleWrapperCaptures-a.possibleWrapperCaptures||b.bytes-a.bytes);
 const manifest={
  version:'20.5.2',generated:'static',
  assets:{htmlBytes:Buffer.byteLength(html),jsFiles:js.length,cssFiles:list.filter(x=>x.endsWith('.css')).length,
   externalScriptReferences:scripts.length,uniqueScriptReferences:new Set(scripts).size,externalStyleReferences:styles.length,
   embeddedScriptBlocks:count(html,/<script\b(?![^>]*\bsrc=)[^>]*>/gi),
   embeddedStyleBlocks:count(html,/<style\b/gi),missingReferences:missing,duplicateScriptReferences:duplicates},
  highestWrapperCandidates:hotspots.filter(x=>x.possibleWrapperCaptures>0).slice(0,15),
  largestJsFiles:hotspots.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,10),
  warnings:['Global function assignment counts do not prove a conflict or leak.',
   'This static inventory does not benchmark actual browser responsiveness.',
   'No business code is deleted or automatically rewritten.']
 };
 return manifest;
}
function format(result){
 const a=result.assets;
 return `Volley Coach ${result.version} · Static architecture inventory\n`+
  `HTML: ${(a.htmlBytes/1024).toFixed(1)} KiB · JS files: ${a.jsFiles} · CSS files: ${a.cssFiles}\n`+
  `Scripts referenced: ${a.externalScriptReferences} · embedded scripts: ${a.embeddedScriptBlocks} · embedded styles: ${a.embeddedStyleBlocks}\n`+
  `Missing referenced assets: ${a.missingReferences.length} · duplicate script imports: ${a.duplicateScriptReferences.length}\n`+
  `Most wrapper candidates:\n${result.highestWrapperCandidates.slice(0,8).map(x=>` - ${x.file}: ${x.possibleWrapperCaptures}`).join('\n')}\n`;
}
if(require.main===module){
 const report=scan();
 process.stdout.write(process.argv.includes('--json')?JSON.stringify(report,null,2)+'\n':format(report));
 if(report.assets.missingReferences.length||report.assets.duplicateScriptReferences.length)process.exitCode=1;
}
module.exports={scan,format};
