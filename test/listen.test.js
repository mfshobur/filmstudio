#!/usr/bin/env node
'use strict';
// `filmstudio listen`: reading a project's narration back against the script (transcripts are injected; no speech model needed).
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');
const { listen } = require('../src/listen');
let pass = 0, fail = 0; const t = async (n, f) => { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + e.message); } };
const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-listen-')); fs.mkdirSync(path.join(d, 'voice'));
fs.writeFileSync(path.join(d, 'voice', '00.mp3'), 'x'); fs.writeFileSync(path.join(d, 'voice', '01.mp3'), 'x');
const spec = { narration: [{ text: 'It is still blank an hour later.', file: 'voice/00.mp3' }, { text: 'What if a film were just a text file?', file: 'voice/01.mp3' }, { text: 'No clip for this one.' }] };
(async () => {
  await t('clips are compared one by one and the bad one is flagged', async () => {
    const r = await listen(d, spec, { transcripts: [{ index: 0, text: 'It is still blank an hour later.', words: [] }, { index: 1, text: 'What if a film were just', words: [] }] });
    assert.strictEqual(r.clips, 2); assert.strictEqual(r.flagged, 1); assert.strictEqual(r.ok, false);
    assert.ok(r.results[1].flags.some(f => /cut off/.test(f))); assert.strictEqual(r.results[0].flags.length, 0);
    assert.ok(/cannot judge tone/.test(r.note));
  });
  await t('a perfect read-back is ok', async () => {
    const r = await listen(d, spec, { lines: [0], transcripts: [{ index: 0, text: 'it is still blank an hour later', words: [{ w: 'it', p: 0.9 }] }] });
    assert.strictEqual(r.ok, true); assert.strictEqual(r.clips, 1); assert.strictEqual(r.meanWordErrorRate, 0);
  });
  await t('without the recogniser it fails with a clear NOT_INSTALLED error that says to ask first', async () => {
    process.env.FILMSTUDIO_LISTEN_PYTHON = '/nonexistent/python';
    try { await listen(d, spec, {}); assert.fail('should throw'); } catch (e) { assert.strictEqual(e.code, 'NOT_INSTALLED'); assert.ok(/Ask the user/.test(e.message)); } finally { delete process.env.FILMSTUDIO_LISTEN_PYTHON; }
  });
  await t('a project with no clips says to run voice first', async () => { const r = await listen(d, { narration: [{ text: 'x' }] }, {}); assert.strictEqual(r.ok, false); assert.ok(/voice/.test(r.error)); });
  console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
