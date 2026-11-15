#!/usr/bin/env node
'use strict';
// Parallel export: frames drawn by several browsers must be byte-identical to frames drawn by one.
// Skips (exit 0) when there is no browser/ffmpeg here.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), assert = require('assert');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const doctor = JSON.parse(spawnSync(process.execPath, [path.join(ROOT, 'bin', 'filmstudio.js'), 'doctor'], { encoding: 'utf8' }).stdout || '{}');
if (!doctor.can || !doctor.can.export) { console.log('skipped: needs a browser (playwright-core + Chrome) and ffmpeg'); process.exit(0); }
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-par-'));
const run = (dir, workers) => { fs.rmSync(path.join(dir, 'build', 'export'), { recursive: true, force: true }); const r = spawnSync(process.execPath, [path.join(ROOT, 'bin', 'filmstudio.js'), 'export', dir, '--quality', 'draft', '--from-bar', '1', '--to-bar', '4', '--no-audio', '--workers', String(workers)], { encoding: 'utf8' }); assert.strictEqual(r.status, 0, r.stderr.slice(-300) + r.stdout.slice(-300)); const fd = path.join(dir, 'build', 'export', 'frames'); return fs.readdirSync(fd).sort().map(f => crypto.createHash('sha1').update(fs.readFileSync(path.join(fd, f))).digest('hex')); };
const proj = path.join(work, 'p'); fs.cpSync(path.join(ROOT, 'examples', 'the-only-limit'), proj, { recursive: true, filter: s => !s.includes(path.sep + 'build') });
const one = run(proj, 1), three = run(proj, 3);
assert.ok(one.length > 30, 'rendered ' + one.length + ' frames');
assert.deepStrictEqual(three, one, 'frames from 3 browsers must equal frames from 1');
const r = spawnSync(process.execPath, [path.join(ROOT, 'bin', 'filmstudio.js'), 'export', proj, '--workers', '0'], { encoding: 'utf8' });   // 0 means automatic, must not break
console.log('ok   parallel export draws exactly the same ' + one.length + ' frames as a single browser');
console.log('\n1 passed, 0 failed');
