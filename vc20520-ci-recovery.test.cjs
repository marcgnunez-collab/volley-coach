'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('GitHub workflow independently verifies TypeScript, Vite, historical CAS and a required real browser',()=>{
 const workflow=read('.github/workflows/volley-coach-recovery.yml');
 for(const required of ['workflow_dispatch:', 'push:', 'permissions:', 'contents: read',
  'actions/checkout@v4','actions/setup-node@v4','npm ci','npm run test:foundation',
  'v2012-multi-device-validation.test.cjs','v2011-durable-sync-journal.test.cjs',
  'VC_BROWSER_REQUIRED: "1"','npm run test:browser-recovery'])
  assert.ok(workflow.includes(required),required);
 assert.ok(workflow.includes('command -v google-chrome'));
 assert.ok(workflow.includes('exit 1'),'a missing browser must fail the workflow');
 assert.equal(workflow.includes('secrets.'),false,'no tokens or browser credentials needed');
 assert.equal(workflow.includes('pull_request_target'),false);
});

test('browser harness skips only in optional local mode; required CI mode must fail if blocked',()=>{
 const source=read('test-audit/vc20519-browser-recovery.test.cjs');
 assert.ok(source.includes("process.env.VC_BROWSER_REQUIRED==='1'"));
 assert.ok(source.includes('skip:!CHROMIUM&&!REQUIRED'));
 assert.ok(source.includes('if(!REQUIRED&&/socket'));
 assert.ok(source.includes("'SIGKILL'"),'real browser interruption remains part of the test');
 assert.ok(source.includes('guardCleanPull'));
 assert.ok(source.includes('VC2011_ORPHAN'));
});

test('two-device regression exercises recovered checkpoint, CAS acknowledgement and unverified conflict',()=>{
 const source=read('test-audit/v2012-multi-device-validation.test.cjs');
 for(const required of ['recovery checkpoint-before on A','device B divergent offline scout',
  'immediate conflict without a checkpoint','inspectJournalRecovery','autoResumeAllowed,false',
  "result.status,'no-checkpoint'", "result.status,'review'"])
  assert.ok(source.includes(required),required);
 assert.ok(!source.includes('window.scoutAwardPoint=function'));
});

test('V20.5.20 release does not mount an alternative point writer or alter native CAS and journal modules',()=>{
 const pkg=require('./package.json'),html=read('index.html'),sw=read('service-worker.js');
 assert.equal(pkg.version,'20.6.5');
 assert.ok(pkg.scripts['test:foundation'].includes('vc20520-ci-recovery.test.cjs'));
 assert.ok(html.includes('vc2055-domain-core.mjs?v=20.6.5'));
 assert.ok(html.includes('vc2055-domain.css?v=20.6.5'));
 assert.ok(sw.includes('ci-recovery-20.5.20'));
 assert.ok(!html.includes('createRallyTransactionPilot('));
 assert.ok(!html.includes('inspectJournalRecovery('));
 const sha=file=>crypto.createHash('sha256').update(read(file).trimEnd()).digest('hex');
 assert.equal(sha('233-vc20512-match-state-core.js'),'a718483a44036e299869bfc46b4bddd02719b40d981245056768c1153bb46afe');
 assert.equal(sha('234-vc20512-match-state-adapters.js'),'683e6387048a402526a4ceabe27f75c09599744e42bd37ccbfee11ace231a4a8');
 const journal=read('210-vc2011-durable-sync-journal.js');
 assert.ok(journal.includes('vc2011-sync-journal-v1'));
 assert.ok(journal.includes('guardCleanPull'));
});
