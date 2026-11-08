#!/usr/bin/env node
'use strict';
// Browser test of the studio page: every tab renders without JS errors, editing a shot writes spec.json, validation panel reacts.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');
const { launch } = require('../src/browser'), { createStudio } = require('../src/studio');
(async () => {
  const dir = fs.mkdtempSync(path.join(process.env.FILMSTUDIO_QA_TMP || os.tmpdir(), 'fs-ui-'));
  fs.cpSync(path.join(__dirname, '..', 'examples', 'the-only-limit'), dir, { recursive: true, filter: s => !s.includes(path.sep + 'build') });
  const st = createStudio({ dir }); const port = await st.listen(0);
  const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const specNow = () => JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
  try {
    await page.goto('http://127.0.0.1:' + port + '/'); await page.waitForSelector('#tabs button');
    for (const t of ['idea', 'story', 'voice', 'preview', 'review', 'status']) { await page.click('[data-tab=' + t + ']'); await page.waitForTimeout(150); assert.ok((await page.textContent('#view')).length > 40, t + ' renders'); }
    await page.click('[data-tab=story]');
    const n0 = specNow().shots.length;
    await page.click('#addShot'); await page.waitForTimeout(1200);
    assert.strictEqual(specNow().shots.length, n0 + 1, 'add shot persists');
    assert.ok(/error/.test(await page.textContent('#side')), 'overrunning shot should show an error');
    const last = n0; await page.selectOption('.shot[data-i="' + last + '"] select[data-f="2"]', 'ink'); await page.waitForTimeout(1200);
    assert.strictEqual(specNow().shots[last][2], 'ink', 'style change persists');
    await page.click('.shot[data-i="' + last + '"] [data-a=del]'); await page.waitForTimeout(1200);
    assert.strictEqual(specNow().shots.length, n0, 'delete persists');
    assert.ok(/valid/.test(await page.textContent('#side')) && !/\d+ errors?/.test(await page.textContent('#side')), 'valid again: ' + (await page.textContent('#side')).slice(0, 120));
    await page.click('[data-tab=review]'); await page.fill('#fbText', 'slow down the opening'); await page.click('#fbAdd'); await page.waitForTimeout(500);
    assert.ok(/slow down the opening/.test(await page.textContent('#view')), 'note appears');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'feedback.json'), 'utf8')).length, 1);
    await page.click('[data-tab=idea]'); await page.fill('[data-b=title]', 'Edited title'); await page.waitForTimeout(1300);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, 'brief.json'), 'utf8')).title, 'Edited title');
    await page.setViewportSize({ width: 380, height: 800 }); await page.click('[data-tab=story]');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal scroll at phone width');
    assert.deepStrictEqual(errs, [], 'page errors: ' + errs.join('|'));
    console.log('studio UI: all checks passed');
  } finally { await b.close(); await st.close(); }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
