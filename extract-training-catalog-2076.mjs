/* One-time byte-preserving extraction of the seven V20.7.5 training catalog declarations.
 * The input checksum protects against accidentally cutting changed storage/writer code. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePath=path.join(root,'002-core-training-v150-monolithic.js');
const dataPath=path.join(root,'vc2076-training-catalog-data.js');
const original=fs.readFileSync(sourcePath,'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const expectedSha='df5f44ca68036a8a254f5eb54ca4dbe4f29674a3e82228fa68607b061fd51814';
if(sha(original)!==expectedSha)throw new Error('Training core differs from audited V20.7.5; extraction stopped.');
if(fs.existsSync(dataPath))throw new Error('Data file already exists; extraction stopped.');

const names=[
  'defaults','EJERCICIOS_PROPIOS_183','EJERCICIOS_PROPIOS_287_NUEVOS',
  'LIMPIEZA_RECEPCION_V1','LIMPIEZA_COLOCACION_V1',
  'LIMPIEZA_ATAQUE_V1','LIMPIEZA_DEFENSA_BLOQUEO_V1'
];
const ast=ts.createSourceFile('training.js',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const selected=[];
for(const node of ast.statements){
  if(!ts.isVariableStatement(node)||node.declarationList.declarations.length!==1)continue;
  const declaration=node.declarationList.declarations[0];
  const name=declaration.name.getText(ast);
  if(!names.includes(name))continue;
  if(!ts.isArrayLiteralExpression(declaration.initializer))throw new Error(name+' is no longer an array.');
  // This is literal JSON: no calls, accessors, imported symbols or initialization side effects.
  const value=JSON.parse(declaration.initializer.getText(ast));
  if(!Array.isArray(value)||value.length<10)throw new Error(name+' changed catalog structure.');
  selected.push({name,start:node.getStart(ast),end:node.end,text:original.slice(node.getStart(ast),node.end),count:value.length});
}
if(selected.length!==names.length||names.some((name,index)=>selected[index].name!==name))
  throw new Error('The exact seven historical declarations were not found in order.');

let remaining=original;
for(const item of [...selected].reverse()){
  remaining=remaining.slice(0,item.start)+
    '/* V20.7.6: '+item.name+' supplied by the synchronous catalog data module. */'+
    remaining.slice(item.end);
}
const catalog='/* V20.7.6 · Literal training catalog, loaded synchronously before the training core.\n'+
  ' * No setters, IndexedDB, Supabase or app writers live here. */\n'+
  selected.map(item=>item.text).join('\n')+'\n';
fs.writeFileSync(dataPath,catalog);
fs.writeFileSync(sourcePath,remaining);
console.log('Extracted',selected.reduce((n,item)=>n+item.text.length,0),'bytes from',
  selected.length,'pure declarations; training core now',Buffer.byteLength(remaining),'bytes.');
