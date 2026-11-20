'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const compiled=()=>import('./vc2055-domain-core.mjs');
const json=value=>JSON.parse(JSON.stringify(value));

function nativeSelectors(bridge){
 const source=read('021-core-scouting-v150-monolithic.js');
 const part=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>0&&end>start,'extract '+a);return source.slice(start,end);
 };
 const pieces=[
  part('const v20538ExtensionStats=','/* V20.5.39 · This former V8.6 parser wrapper'),
  part('function v870LegacyExtension(original){','/* V20.5.39 · This former V8.7 parser wrapper'),
  part('function v880LegacyExtension(original){','/* V20.5.39 · One canonical extension wrapper')
 ].join('\n');
 const context={
  window:bridge?{VC_SCOUT_EXTENSIONS_20538:bridge}:{},
  v870SkillFromRaw:raw=>String(raw||'').trim().toUpperCase().replace(/\s+/g,'')
   .match(/^(?:R)?\d+(S|R|E|A|B|D|F|C)/)?.[1]||''
 };
 vm.runInNewContext(pieces,context,{timeout:2000});
 const call=(name,input)=>json(context[name](String(input||'').trim().toUpperCase().replace(/\s+/g,'')));
 return {subzone:input=>call('v860LegacyExtension',input),
  cone:input=>call('v880LegacyExtension',input),
  advanced:input=>call('v870LegacyExtension',input),
  checked:(name,input)=>{
   const cleaned=String(input||'').trim().toUpperCase().replace(/\s+/g,'');
   const reference=call(name==='subzone'?'v860LegacyExtension':name==='cone'?
    'v880LegacyExtension':'v870LegacyExtension',input);
   return json(context.v20538CheckedExtension(name,cleaned,reference));
  },diagnostics:()=>json(context.window.VC_SCOUT_EXTENSIONS_DIAGNOSTICS_20538())};
}

test('subzone selector preserves exact A/B/C/D input, both courts and cleaned native code',async()=>{
 const {scanSubzoneExtension}=await compiled(),native=nativeSelectors();
 const inputs=['12A#.4B>5D','R7R+.6A','8B/.2D','7D-.9C>1A',
  '12A#.4>5D::K1~T','12A#.4B>C5','12A#.4>5','12A#.4E>5A','not-a-code',
  '08S# . 2A > 9D :Z4 ^K2','12A#.4B>5D::31~Q|F%TIP?X$Y'];
 for(const input of inputs)
  assert.deepStrictEqual(scanSubzoneExtension(input),native.subzone(input),input);
 assert.deepStrictEqual(scanSubzoneExtension('12A#.4B>5D'),{
  kind:'subzone',cleaned:'12A#.4>5',startZone:'4B',endZone:'5D'});
});

test('cones require attack, a valid source zone, and destinations C1..C8',async()=>{
 const {scanConeExtension}=await compiled(),native=nativeSelectors();
 const inputs=['12A#.4B>C5','8A+.1>C8','R9A#.9D>C1^K2','3S#.4>C2',
  '12A#.4>C0','12A#.4>C9','12A#.4B>C3::31~T','12A#.4B>5D',
  '12A#.0>C4','12B#.4>C4','R12A#.4A>C6%TIP','not-a-code'];
 for(const input of inputs)
  assert.deepStrictEqual(scanConeExtension(input),native.cone(input),input);
 assert.deepStrictEqual(scanConeExtension('12A#.4B>C5::K1~T'),{
  kind:'cone',cleaned:'12A#::K1~T',startZone:'4B',endCone:5});
});

test('DV advanced selector preserves exact grammar order, aliases and native leftovers',async()=>{
 const {scanAdvancedExtension}=await compiled(),native=nativeSelectors();
 const inputs=['12A#.4B>5D::K1~T','7E+::31~Q|F%RAP?S1$X',
  '12A#.4>5:PIPE^K1@2','9A#:K1','9A#:31','9E#:OTR','9E#:31',
  'R7R+.6~JF','9R+.5%OH|F','9A#~Q','9S#~Q',
  '12A#.4B>C5::K1~T%TIP','12A#.4B>C5::K1~T%TIP|F?X$Y',
  '7E+::31::K1~Q~T|F|C%TIP%SOFT?X$Y',
  '12A#?S1234567890$ABC12','12A#.1>2:ABCD','bad-code'];
 for(const input of inputs)
  assert.deepStrictEqual(scanAdvancedExtension(input),native.advanced(input),input);
 const result=scanAdvancedExtension('7E+::31~Q|F%RAP?S1$X');
 assert.equal(result.skill,'E');
 assert.equal(result.dvCode,'31');assert.equal(result.tempo,'Q');
 assert.equal(result.subtype,'RAP');assert.equal(result.setType,'F');
 assert.equal(result.special,'S1');assert.equal(result.custom,'X');
});

test('combined deterministic matrix agrees with every historical extension selector',async()=>{
 const typed=await compiled(),native=nativeSelectors();
 let checked=0;
 for(const p of ['','R'])for(const number of ['8','12','99'])
 for(const skill of ['S','R','E','A','B','D'])
 for(const rating of ['#','+','='])for(const z of ['.4B>5D','.2A','.4>C3','.1>9','.9D>C8'])
 for(const suffix of ['',':Z4','::K1~T','%TIP|F?X$Y','^K1@2']){
  const input=p+number+skill+rating+z+suffix;
  assert.deepStrictEqual(typed.scanSubzoneExtension(input),native.subzone(input),input);
  assert.deepStrictEqual(typed.scanConeExtension(input),native.cone(input),input);
  assert.deepStrictEqual(typed.scanAdvancedExtension(input),native.advanced(input),input);
  checked+=3;
 }
 assert.ok(checked>=8000);
});

test('extension runtime is idempotent and failures fall back without changing output',async()=>{
 const typed=await compiled(),holder={};
 const api=typed.installScoutingExtensionsBridge(holder);
 assert.strictEqual(api,typed.installScoutingExtensionsBridge(holder));
 assert.equal(api.VERSION,'20.5.38');assert.equal(api.grammarOnly,true);
 assert.ok(Object.isFrozen(api));
 const broken=[
  undefined,
  {VERSION:'20.5.38',grammarOnly:true,subzone:()=>({kind:'pass'}),
   advanced:()=>({kind:'advanced',cleaned:'WRONG'}),cone:()=>({kind:'pass'})},
  {VERSION:'20.5.38',grammarOnly:true,subzone:()=>{throw Error('broken');},
   advanced:()=>{throw Error('broken');},cone:()=>{throw Error('broken');}},
  {VERSION:'20.5.37',grammarOnly:true,subzone:api.subzone,advanced:api.advanced,cone:api.cone},
  api
 ];
 for(const bridge of broken){
  const h=nativeSelectors(bridge);
  assert.deepStrictEqual(h.checked('subzone','12A#.4B>5D'),h.subzone('12A#.4B>5D'));
  assert.deepStrictEqual(h.checked('cone','12A#.4B>C5'),h.cone('12A#.4B>C5'));
  assert.deepStrictEqual(h.checked('advanced','7E+::31~Q|F%RAP?S1$X'),
   h.advanced('7E+::31~Q|F%RAP?S1$X'));
  const counters=h.diagnostics();
  assert.equal(counters.subzone+counters.cone+counters.advanced+counters.native,3);
  if(bridge===api)assert.equal(counters.native,0);
  else assert.equal(counters.native,3);
 }
});

test('V20.5.38 source integration keeps action writer, video and sync boundaries protected',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.5.41');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20538-scout-extensions-migration.test.cjs'));
 for(const src of ['vc2055-domain-core.mjs','021-core-scouting-v150-monolithic.js',
  '213-vc2021-scouting-speed-pro.js'])
  assert.ok(html.includes(src+'?v=20.5.41'),src);
 assert.ok(sw.includes('scout-extensions-20.5.38'));
 assert.ok(read('src/vc2055-entry.ts').includes('installScoutingExtensionsBridge(window)'));
 const ts=read('src/domain/scout-grammar-extensions.ts'),
  runtime=read('src/domain/scout-grammar-extensions-runtime.ts');
 for(const forbidden of ['indexedDB','localStorage','supabase','fetch(', 'scoutSave(',
  'scoutPushAction(', 'v121AwardPoint', 'videoTime', 'playerNameSnapshot'])
  assert.equal(ts.includes(forbidden)||runtime.includes(forbidden),false,forbidden);
 const native=read('021-core-scouting-v150-monolithic.js');
 assert.ok(native.includes("v20538CheckedExtension('subzone'"));
 assert.ok(native.includes("v20538CheckedExtension('advanced'"));
 assert.ok(native.includes("v20538CheckedExtension('cone'"));
 assert.ok(native.includes('const pushed=scoutPushAction(parsed.action)'));
 const hash=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(hash('233-vc20512-match-state-core.js'),'42efe8e78c530d914c29b454d8a727a7abc840e854158748013be35c9541a8b0');
 assert.equal(hash('234-vc20512-match-state-adapters.js'),'446249d233b7ea9e7bbb5b7f5ff1b87e936035be95ad8785e066c3e1e11943bd');
});
