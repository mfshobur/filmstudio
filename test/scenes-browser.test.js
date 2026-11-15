#!/usr/bin/env node
'use strict';
// Custom scenes in a real headless browser: `scene check` must catch broken scenes and pass good ones; `scene preview` must produce frames.
// Skips (exit 0) when playwright-core / a browser is not available.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');
const T = require('../src/scenetools');
let launchOk = true; try { require('../src/browser').loadPlaywright(); } catch (e) { launchOk = false; }
if (!launchOk) { console.log('skipped: playwright-core not found (see the README, "Setting up review, MP4 export and narration")'); process.exit(0); }
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.message)); } };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-scb-')); fs.mkdirSync(path.join(dir, 'scenes')); fs.mkdirSync(path.join(dir, 'rigs'));
const put = (n, src) => fs.writeFileSync(path.join(dir, 'scenes', n + '.js'), src);
put('good', "scene({ look: 'plain', draw(c) { c.circle(c.cx + Math.sin(c.t * 2) * c.u * 10, c.cy, c.u * 12, { fill: c.pal.main }); c.text('hi', c.cx, c.H * .8, c.u * 5); } });");
put('blank', "scene({ look: 'plain', draw(c) {} });");
put('crash', "scene({ draw(c) { c.circle(c.cx, c.cy, 40, { fill: '#0f0' }); c.nothing.here(); } });");
put('state', "let n = 0; scene({ draw(c) { n++; c.circle(c.cx + n * 3 % 200, c.cy, 40, { fill: '#0ff' }); } });");
put('still', "scene({ draw(c) { c.circle(c.cx, c.cy, 60, { fill: c.pal.main }); } });");
put('puppet', "scene({ look: 'wayang', draw(c) { c.rig('p').pose({ arm: Math.sin(c.t * 3) * 30 }).draw(c.cx, c.H * .9, c.H * .004); } });");
fs.mkdirSync(path.join(dir, 'libs'));
fs.writeFileSync(path.join(dir, 'libs', 'ui.js'), "lib('ui', { card(c, x, y, w, h) { c.rrect(x, y, w, h, c.u * 2, { fill: '@main', stroke: '@ink', lw: c.u * .4 }); c.clip(x, y, w, h, () => c.line(x, y, x + w, y + h, { stroke: '@accent', lw: c.u })); } });");
put('kit', "scene({ look: 'paper', draw(c) { const ui = c.lib('ui'); ui.card(c, c.cx - c.u * 30, c.cy - c.u * 15, c.u * 60, c.u * 30); c.trace('M 100 400 C 300 200 500 600 700 400', c.map(c.t, 0, 2, 0, 1), { stroke: '@accent', lw: c.u }); c.panel(c.u * 4, c.u * 4, c.u * 40, c.u * 22, 'synth', pc => { pc.circle(pc.cx, pc.cy, pc.u * 8 + Math.sin(c.t * 3) * pc.u, { fill: '@main' }); }); c.text(c.measure('hi', 20) > 0 ? 'ok' : 'no', c.cx, c.H * .9, c.u * 5, '@ink'); } });");
fs.writeFileSync(path.join(dir, 'rigs', 'p.js'), "rig('p', { parts: [{ id: 'body', d: 'M-25 0L-30 -110Q-30 -150 0 -165Q30 -150 30 -110L25 0Z', holes: [kit.holes.diamonds(-18, -140, 36, 80, 4, 3)] }, { id: 'arm', parent: 'body', pivot: [20, -140], d: 'M18 -142L26 -140L66 -104L60 -96L20 -128Z' }], pose: { arm: 0 } });");
(async () => {
  await t('a good scene passes check with sensible stats', async () => { const r = await T.check(dir, 'good'); assert.ok(r.ok, JSON.stringify(r.errors)); assert.strictEqual(r.stats.determinismDiff, 0); assert.ok(r.stats.motion > 0.002 && r.stats.avgDrawMs < 18, JSON.stringify(r.stats)); });
  await t('a blank scene is reported as blank', async () => { const r = await T.check(dir, 'blank'); assert.ok(!r.ok && r.errors.some(e => /blank or one flat colour/.test(e.message)), JSON.stringify(r)); });
  await t('a scene that throws reports the error', async () => { const r = await T.check(dir, 'crash'); assert.ok(!r.ok && r.errors.some(e => /nothing|undefined/.test(e.message)), JSON.stringify(r.errors)); });
  await t('hidden state (the same time drawn differently) is reported', async () => { const r = await T.check(dir, 'state'); assert.ok(!r.ok && r.errors.some(e => /draws differently twice/.test(e.message)), JSON.stringify(r.errors)); });
  await t('a frozen scene gets a warning, not an error', async () => { const r = await T.check(dir, 'still'); assert.ok(r.ok && r.warnings.some(w => /does not move/.test(w.message)), JSON.stringify(r)); });
  await t('the kit features (libs, colour tokens, trace, clip, measure, look panels) draw and are deterministic', async () => { const r = await T.check(dir, 'kit'); assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(r.stats.determinismDiff, 0); assert.ok(r.stats.motion > 0.001, JSON.stringify(r.stats)); });
  await t('a puppet rig with perforations draws, moves and is deterministic', async () => { const r = await T.check(dir, 'puppet'); assert.ok(r.ok, JSON.stringify(r.errors)); assert.strictEqual(r.stats.determinismDiff, 0); assert.ok(r.stats.motion > 0.001); });
  await t('preview writes frames and a strip, and reports draw errors with the scene name', async () => {
    const r = await T.preview(dir, 'puppet', { frames: [1, 3, 5] }); assert.ok(r.ok && r.frames.length === 3 && r.frames.every(f => fs.statSync(f).size > 2000), JSON.stringify(r)); if (r.strip) assert.ok(fs.statSync(r.strip).size > 5000);
    const bad = await T.preview(dir, 'crash', { frames: [2] }); assert.ok(!bad.ok && bad.drawErrors.some(e => e.variant === 'crash'), JSON.stringify(bad.drawErrors));
  });
  await t('a per-shot look override changes the picture', async () => {
    const a = await T.preview(dir, 'good', { frames: [4], params: {} }), bufA = fs.readFileSync(a.frames[0]); // both previews write frame-01.png: read the first before the second overwrites it
    const b = await T.preview(dir, 'good', { frames: [4], params: { look: 'wayang' } }), bufB = fs.readFileSync(b.frames[0]);
    assert.ok(!bufA.equals(bufB), 'the wayang look must change the frame');
  });
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
