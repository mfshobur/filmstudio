#!/usr/bin/env node
'use strict';
// The studio's scene endpoints: list with lint status, preview page, source, path safety, and the live "scenes changed" event.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), assert = require('assert');
const { createStudio } = require('../src/studio');
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.message)); } };
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-ss-')); fs.cpSync(path.join(__dirname, '..', 'examples', 'starter'), dir, { recursive: true }); fs.mkdirSync(path.join(dir, 'scenes')); fs.mkdirSync(path.join(dir, 'rigs'));
  fs.writeFileSync(path.join(dir, 'scenes', 'good.js'), "scene({ look: 'paper', draw(c) { c.circle(c.cx, c.cy, 40, { fill: '@main' }); } });"); fs.writeFileSync(path.join(dir, 'scenes', 'bad.js'), 'scene({ draw(c) { Math.random(); } });'); fs.writeFileSync(path.join(dir, 'rigs', 'r.js'), "rig('r', { parts: [] });");
  const st = createStudio({ dir }), port = await st.listen(0), B = 'http://127.0.0.1:' + port;
  await t('/api/scenes lists scenes with lint errors, rigs, and the looks (built-in and project)', async () => { const j = await (await fetch(B + '/api/scenes')).json(); const by = Object.fromEntries(j.scenes.map(s => [s.name, s])); assert.strictEqual(by.good.errors.length, 0); assert.ok(by.bad.errors.some(e => /Math\.random/.test(e.message) && e.fix)); assert.deepStrictEqual(j.rigs, ['r']); assert.ok(j.looks.builtin.length >= 29 && j.looks.builtin.some(l => l.name === 'wayang')); });
  await t('preview.html is a self-contained film for that scene with the playback controller; look and beats are applied', async () => { const r = await fetch(B + '/api/scene/good/preview.html?beats=6&look=ink'); assert.strictEqual(r.status, 200); assert.ok(/text\/html/.test(r.headers.get('content-type'))); const h = await r.text(); assert.ok(h.includes('"good":{"src"') && h.includes('scene-state') && h.includes('beats=6,t0='), 'the requested length must reach the page'); assert.ok(h.includes('"look":"ink"')); });
  await t('source returns the file text', async () => { assert.ok((await (await fetch(B + '/api/scene/good/source')).text()).startsWith('scene({ look')); });
  await t('unknown scenes and path tricks are 404, never a file outside scenes/', async () => { for (const u of ['/api/scene/nope/preview.html', '/api/scene/..%2fspec/source', '/api/scene/%2e%2e/source', '/api/scene/good%2f..%2f..%2fspec/source', '/api/scene/a%00b/source']) { const r = await fetch(B + u); assert.notStrictEqual(r.status, 200, u); assert.ok(!(await r.text()).includes('"shots"'), 'leaked via ' + u); } });
  await t('writing a scene file sends a "scenes" event on the stream (within the poll interval)', async () => {
    const got = await new Promise((resolve, reject) => { const req = http.get(B + '/api/events', res => { res.setEncoding('utf8'); let buf = ''; res.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n\n')) >= 0) { const m = /^data: (.*)$/m.exec(buf.slice(0, i)); buf = buf.slice(i + 2); if (!m) continue; const ev = JSON.parse(m[1]); if (ev.type === 'hello') setTimeout(() => fs.writeFileSync(path.join(dir, 'scenes', 'good.js'), "scene({ look: 'ink', draw(c) { c.circle(c.cx, c.cy, 50, { fill: '@main' }); } });"), 150); if (ev.type === 'scenes') { req.destroy(); resolve(ev); } } }); }); req.on('error', e => { if (e.code !== 'ECONNRESET') reject(e); }); setTimeout(() => { req.destroy(); reject(new Error('no scenes event in 6 s')); }, 6000); });
    assert.strictEqual(got.type, 'scenes');
  });
  await st.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
