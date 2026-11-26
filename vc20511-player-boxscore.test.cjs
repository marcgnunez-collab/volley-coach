'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const compiled=()=>import('./vc2055-domain-core.mjs');
const action=(team,skill,evaluation,extra={})=>({team,skill,evaluation,...extra});
const fixture=()=>({
 currentSet:1,status:'live',sets:[
  {number:1,rallies:[
   {rotationBefore:1,opponentRotationBefore:5,servingBefore:'opponent',winner:'ours',actions:[
    action('ours','R','#',{playerId:101,playerNumberSnapshot:12,playerNameSnapshot:'Ana'}),
    action('ours','A','#',{playerId:101,playerNumberSnapshot:12,playerNameSnapshot:'Ana'}),
    action('ours','A','=',{playerId:102,playerNumberSnapshot:12,playerNameSnapshot:'Berta'}),
    action('opponent','S','=',{opponentPlayerUid:'uid-7',playerNumberSnapshot:'7',playerNameSnapshot:'Rival 7'})
   ]},
   {rotationBefore:2,opponentRotationBefore:6,servingBefore:'ours',winner:'opponent',actions:[
    action('ours','S','=',{playerId:101,playerNumberSnapshot:12,playerNameSnapshot:'Ana'}),
    action('ours','A','/',{playerId:101,playerNumberSnapshot:12,playerNameSnapshot:'Ana'}),
    action('opponent','R','+',{opponentPlayerUid:'uid-7',playerNumberSnapshot:'7',playerNameSnapshot:'Rival 7'}),
    action('opponent','B','#',{opponentPlayerUid:'uid-7',playerNumberSnapshot:'7',playerNameSnapshot:'Rival 7'})
   ]},
   {rotationBefore:null,opponentRotationBefore:1,servingBefore:'opponent',winner:'ours',actions:[
    action('ours','R','+',{playerNumberSnapshot:'05'}),
    action('ours','R','=',{}),
    action('opponent','A','#',{playerLabel:'#9 · Sosa'})
   ]}
  ]},
  {number:2,rallies:[
   {rotationBefore:1,opponentRotationBefore:5,servingBefore:'ours',winner:'ours',actions:[
    action('ours','A','+',{playerId:101,playerNumberSnapshot:12,playerNameSnapshot:'Ana'}),
    action('ours','B','#',{playerId:103,playerNumberSnapshot:4,playerNameSnapshot:'Celia'})
   ]}
  ]}
 ],liveRally:{actions:[action('ours','A','#',{playerId:101}),action('opponent','S','=',{playerLabel:'#7'})]}
});
const filters=(team='ours',scope='current',rotation=null)=>({team,scope,rotation});

test('V20.5.11 separates players by stable identity, not just jersey, and returns exact confirmed metrics',async()=>{
 const {inspectPlayerBoxscore}=await compiled();
 const match=fixture(),before=JSON.stringify(match),out=inspectPlayerBoxscore(match,filters());
 assert.equal(out.available,true);assert.equal(out.selectedActions,7);
 assert.equal(out.ralliesExamined,3);
 assert.equal(out.players.length,4,'two distinct ID players plus two explicit missing-ID groups');
 const ana=out.players.find(p=>p.key==='id:101');
 const berta=out.players.find(p=>p.key==='id:102');
 const unknown=out.players.find(p=>p.key==='unidentified');
 const jersey5=out.players.find(p=>p.key==='num:05');
 assert.equal(ana.name,'Ana');assert.equal(ana.number,'12');
 assert.equal(ana.receive.attempts,1);assert.equal(ana.receive.positivePct,100);
 assert.equal(ana.attack.attempts,2);assert.equal(ana.attack.kills,1);
 assert.equal(ana.attack.blocked,1);assert.equal(ana.attack.efficiencyPct,0);
 assert.equal(ana.serve.errors,1);
 assert.equal(berta.name,'Berta');assert.equal(berta.attack.attempts,1);
 assert.equal(berta.attack.efficiencyPct,-100);
 assert.equal(jersey5.number,'05');assert.equal(jersey5.receive.positivePct,100);
 assert.equal(unknown.identified,false);assert.equal(unknown.receive.positivePct,0);
 assert.equal(out.unattributedActions,1);assert.equal(out.missingRotationActions,2);
 assert.equal(out.pendingActions,1,'open actions are excluded from confirmed row totals');
 assert.equal(JSON.stringify(match),before);
 assert.equal(Object.isFrozen(out),true);assert.equal(Object.isFrozen(out.players),true);
 assert.equal(Object.isFrozen(out.players[0].attack),true);
 assert.equal(Object.isFrozen(out.rotations),true);
});

test('V20.5.11 filters team, set and P1–P6 without inventing missing rotations',async()=>{
 const {inspectPlayerBoxscore}=await compiled();
 const m=fixture();
 const p1=inspectPlayerBoxscore(m,filters('ours','current',1));
 assert.equal(p1.selectedActions,3);assert.equal(p1.players.length,2);
 assert.equal(p1.players.find(p=>p.key==='id:101').attack.efficiencyPct,100);
 assert.equal(p1.players.some(p=>p.key==='num:05'),false);
 assert.equal(p1.rotations[0].rallies,1);
 assert.equal(p1.rotations[0].sideOut.percent,100);
 assert.equal(p1.rotations[1].breakPoint.percent,0);
 assert.equal(p1.rotations[2].rallies,0);
 assert.equal(p1.rotations[2].sideOut.percent,null);
 const p2=inspectPlayerBoxscore(m,filters('ours','current',2));
 assert.equal(p2.players.length,1);assert.equal(p2.players[0].attack.efficiencyPct,-100);
 const full=inspectPlayerBoxscore(m,filters('ours','match',1));
 assert.equal(full.ralliesExamined,4);
 assert.equal(full.players.some(p=>p.key==='id:103'),true);
 assert.equal(full.rotations[0].rallies,2);
 const rival=inspectPlayerBoxscore(m,filters('opponent','current',null));
 assert.equal(rival.players.length,2);
 const seven=rival.players.find(p=>p.key==='uid:uid-7');
 assert.equal(seven.receive.positivePct,100);
 assert.equal(seven.serve.errors,1);
 assert.equal(seven.block.points,1);
 assert.equal(rival.rotations[4].sideOut.percent,null);
 assert.equal(rival.rotations[5].sideOut.percent,100);
 assert.equal(rival.pendingActions,1);
 assert.equal(rival.players.find(p=>p.key==='num:9').attack.kills,1);
});

test('V20.5.11 reacts to corrected actions and undo; invalid codes never become measured contacts',async()=>{
 const {inspectPlayerBoxscore}=await compiled();
 const m=fixture(),old=inspectPlayerBoxscore(m,filters());
 m.sets[0].rallies[0].actions[1].evaluation='=';
 const corrected=inspectPlayerBoxscore(m,filters());
 assert.equal(old.players.find(p=>p.key==='id:101').attack.efficiencyPct,0);
 assert.equal(corrected.players.find(p=>p.key==='id:101').attack.efficiencyPct,-100);
 m.sets[0].rallies.splice(1,1);
 const undone=inspectPlayerBoxscore(m,filters());
 assert.equal(undone.ralliesExamined,2);
 assert.equal(undone.players.find(p=>p.key==='id:101').attack.attempts,1);
 m.sets[0].rallies[0].actions.push(action('ours','A','??',{playerId:101}));
 const invalid=inspectPlayerBoxscore(m,filters());
 assert.equal(invalid.selectedActions,5,'unrecognized contact is not a validated attempt');
 assert.equal(inspectPlayerBoxscore(m,{team:'ours',scope:'current',rotation:9}).filters.rotation,null);
});

test('V20.5.11 caps pathological history and caps player rows without leaking codes',async()=>{
 const {inspectPlayerBoxscore}=await compiled();
 const many={currentSet:1,sets:[{number:1,rallies:Array.from({length:20001},(_,i)=>({
  rotationBefore:1,opponentRotationBefore:1,servingBefore:'opponent',winner:'ours',actions:[action('ours','S','#',{playerId:i+1,playerNumberSnapshot:i%100})]
 }))}]};
 const report=inspectPlayerBoxscore(many,filters());
 assert.equal(report.ralliesExamined,20000);assert.equal(report.truncated,true);
 assert.equal(report.players.length,80);assert.equal(report.playersTruncated,true);
 assert.equal(report.rotations[0].sideOut.won,20000);
 assert.equal(JSON.stringify(report).includes('code'),false);
 const attacks=Array.from({length:60001},(_,i)=>action('ours','A','#',{playerId:1,playerNumberSnapshot:1,code:`SECRET${i}`}));
 const capped=inspectPlayerBoxscore({currentSet:1,sets:[{number:1,rallies:[{rotationBefore:1,actions:attacks}]}]},filters());
 assert.equal(capped.actionsExamined,60000);assert.equal(capped.truncated,true);
 assert.equal(JSON.stringify(capped).includes('SECRET'),false);
});

test('V20.5.11 UI uses the existing hub, changes filters and keeps previous Analyze cards intact',async()=>{
 const {mountPlayerBoxscore}=await compiled();
 class Element extends EventTarget{
  constructor(tag,doc){super();this.tagName=tag;this.doc=doc;this.className='';this.textContent='';this.children=[];this.parentNode=null;this.dataset={};this.value='';}
  set id(v){this._id=v;this.doc.items.set(v,this)}
  get id(){return this._id||''}
  get classList(){return {contains:v=>this.className.split(/\s+/).includes(v)}}
  setAttribute(){}
  append(...elements){for(const element of elements){element.parentNode=this;this.children.push(element)}}
  replaceChildren(...elements){this.children=[];this.append(...elements)}
 }
 class Document extends EventTarget{
  constructor(){super();this.items=new Map()}
  createElement(tag){return new Element(tag,this)}
  getElementById(id){return this.items.get(id)||null}
 }
 const doc=new Document(),workspace=doc.createElement('section');workspace.id='scout-workspace-v900';workspace.className='view active';
 const phase=doc.createElement('section');phase.id='v900-phase-analyze';phase.className='v900-phase-panel';
 const host=doc.createElement('section');host.id='vc20511-boxscore';
 const other=doc.createElement('div');other.id='v900-analysis-kpis';other.textContent='ORIGINAL';
 const m=fixture(),listeners=new Map(),store={subscribe:(topic,fn)=>{listeners.set(topic,fn);return()=>listeners.delete(topic)}};
 const win={document:doc,VC_STATE_2059:store,MatchState:{getActive:()=>m,subscribe:()=>{throw Error('must use state hub')}}};
 const api=mountPlayerBoxscore(win);
 assert.equal(api.version,'20.5.11');assert.equal(api.readOnly,true);
 assert.strictEqual(mountPlayerBoxscore(win),api);
 assert.deepEqual([...listeners.keys()],['change']);
 assert.equal(api.getReport().players.length,4);
 const controls=host.children.find(el=>el.className==='vc20511-controls');
 const team=controls.children[0].children[1],scope=controls.children[1].children[1],rotation=controls.children[2].children[1];
 team.value='opponent';team.dispatchEvent(new Event('change'));
 assert.equal(api.getReport().filters.team,'opponent');assert.equal(api.getReport().players.length,2);
 scope.value='match';rotation.value='6';rotation.dispatchEvent(new Event('change'));
 assert.equal(api.getReport().filters.rotation,6);
 assert.equal(api.getReport().players.length,1);
 phase.className='v900-phase-panel hidden';const last=api.getReport();
 m.sets[0].rallies[0].actions[0].evaluation='=';listeners.get('change')();await Promise.resolve();
 assert.strictEqual(api.getReport(),last,'do not scan when hidden');
 phase.className='v900-phase-panel';api.refresh();
 assert.notStrictEqual(api.getReport(),last);
 assert.equal(other.textContent,'ORIGINAL');
 api.dispose();assert.equal(listeners.size,0);assert.equal(host.children.length,0);
 assert.equal(win.VC_PLAYER_BOXSCORE_20511,undefined);
});

test('V20.5.11 is bundled, versioned and never writes to the legacy match or cloud',async()=>{
 const pkg=require('./package.json');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'vc2055-domain.css'),'utf8');
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const entry=fs.readFileSync(path.join(root,'src/vc2055-entry.ts'),'utf8');
 assert.equal(pkg.version,'20.5.73');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20511-player-boxscore.test.cjs'));
 assert.ok(html.includes('id="vc20511-boxscore"'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.5.73'));
 assert.ok(html.includes('vc2055-domain.css?v=20.5.73'));
 assert.ok(css.includes('.vc20511-boxscore'));
 assert.ok(sw.includes('player-boxscore-20.5.11'));
 assert.ok(entry.includes('mountPlayerBoxscore(window)'));
 for(const file of ['src/state/player-boxscore.ts','src/state/player-boxscore-runtime.ts']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const forbidden of ['scoutSave(', 'scoutPushAction(', 'localStorage', 'indexedDB', 'supabase', 'cloudClient.', 'v121AwardPoint=', 'window.MatchState='])
   assert.equal(source.includes(forbidden),false,`${file}: ${forbidden}`);
 }
});
