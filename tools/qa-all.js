#!/usr/bin/env node
'use strict';
// Builds a throwaway project containing EVERY style/variant (minimal valid params), then runs review with the motion check.
// usage: node tools/qa-all.js [--size 400x800] [--keep]
const fs = require('fs'), path = require('path'), os = require('os');
const { STYLES } = require('../src/registry');
const { sampleParams, SAMPLE_CHARACTERS } = require('../src/samples');
const { compile } = require('../src/build');
const { validate } = require('../src/validate');
const { review } = require('../src/review');
const { spawnSync } = require('child_process');
const galleryDir = process.argv.includes('--gallery') ? path.resolve(process.argv[process.argv.indexOf('--gallery') + 1]) : null;
(async () => {
  const sz = process.argv.includes('--size') ? process.argv[process.argv.indexOf('--size') + 1].split('x').map(Number) : [640, 360];
  const dir = fs.mkdtempSync(path.join(process.env.FILMSTUDIO_QA_TMP || os.tmpdir(), 'fs-qa-'));
  const list = []; Object.entries(STYLES).forEach(([s, v]) => v.variants.forEach(x => list.push([s, x])));
  const BATCH = 20, results = [];
  const cacheDir = path.join(process.env.FILMSTUDIO_QA_TMP || os.tmpdir(), 'qa-cache'); fs.mkdirSync(cacheDir, { recursive: true });
  for (let b0 = 0; b0 < list.length; b0 += BATCH) {
    const cf = path.join(cacheDir, sz.join('x') + '-' + b0 + '.json');
    if (fs.existsSync(cf)) { results.push(JSON.parse(fs.readFileSync(cf, 'utf8'))); process.stderr.write('cached batch ' + b0 + '\n'); continue; }
    const part = list.slice(b0, b0 + BATCH), shots = []; let bar = 1;
    part.forEach(([s, v], i) => { const e = i < part.length - 1 ? bar + 1 : 47; const p = sampleParams(s, v); shots.push(p ? [bar, e, s, v, p] : [bar, e, s, v]); bar = e; });
    const spec = { version: 1, meta: { title: 'QA all', titleLines: ['QA', 'all', 'styles'], titleAccent: 1 }, bpm: 128, bars: 46, endCardBar: 44.6, score: { preset: 'anthem-46' }, characters: SAMPLE_CHARACTERS, shots, narration: [], prompts: [] };
    const dir = fs.mkdtempSync(path.join(process.env.FILMSTUDIO_QA_TMP || os.tmpdir(), 'fs-qa-'));
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true }); fs.writeFileSync(path.join(dir, 'assets', 'qa.png'), require('../src/png').testPicture(480, 300));
    fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec));
    const v = validate(spec, dir); if (!v.ok) { console.log(JSON.stringify({ ok: false, stage: 'validate', errors: v.errors }, null, 1)); process.exit(1); }
    fs.mkdirSync(path.join(dir, 'build'), { recursive: true }); fs.writeFileSync(path.join(dir, 'build', 'film.html'), compile(spec, dir));
    const r = await review(dir, spec, { width: sz[0], height: sz[1], motion: true, motionEarly: true });
    if (galleryDir) { fs.mkdirSync(galleryDir, { recursive: true }); r.frames.forEach((f, i) => { const out = path.join(galleryDir, r.labels[i] + '.jpg'); spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.resolve(dir, f), '-vf', 'scale=360:-1', '-q:v', '5', out]); }); }
    const res = { dir, sheets: r.sheets, pageErrors: r.pageErrors, drawErrors: r.drawErrors, staticShots: r.staticShots, motion: r.motion };
    fs.writeFileSync(cf, JSON.stringify(res)); results.push(res); process.stderr.write('done batch ' + b0 + '\n');
  }
  const all = k => results.flatMap(r => r[k]);
  const lowest = all('motion').sort((a, b) => a.diff - b.diff).slice(0, 8).map(m => m.name + ':' + m.diff);
  console.log(JSON.stringify({ ok: !all('pageErrors').length && !all('drawErrors').length && !all('staticShots').length, tested: list.length, size: sz.join('x'), sheets: all('sheets'), lowestMotion: lowest, problems: { pageErrors: all('pageErrors'), drawErrors: all('drawErrors'), staticShots: all('staticShots') } }, null, 1));
})().catch(e => { console.log(JSON.stringify({ ok: false, error: e.message })); process.exit(1); });
