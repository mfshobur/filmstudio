'use strict';
const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

// Renders the score offline in chunks (one-shot renders run out of memory on small devices) and reports per-bar loudness.
async function audioCheck(dir, spec, opts = {}) {
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'engine', 'audiocheck.template.html'), 'utf8');
  const html = tpl.replace('{{MUSIC}}', () => fs.readFileSync(path.join(__dirname, '..', 'engine', 'music.js'), 'utf8'));
  const tmp = path.join(dir, 'build'); fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, 'audiocheck.html'); fs.writeFileSync(file, html);
  const os = require('os');
  const preset = (spec.score && spec.score.preset) || 'anthem-46', score = { calm: preset === 'calm-46', transpose: (spec.score && spec.score.transpose) || 0, bars: spec.bars || 46 };
  const chunk = opts.chunk || (os.totalmem() < 6e9 ? 4 : 8), bars = spec.bars, bpm = spec.bpm || 128;
  const cacheFile = path.join(tmp, 'audiocheck.partial.json');
  let cache = {}; try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch (e) { /* none */ }
  const ckey = bars + ':' + bpm + ':' + chunk + ':' + JSON.stringify(score); if (cache.key !== ckey) cache = { key: ckey, done: {} };
  let b = null, peak = 0, clip = 0, nan = 0, all = []; const errors = [];
  try {
    for (let b0 = 1; b0 <= bars; b0 += chunk) {
      const b1 = Math.min(bars, b0 + chunk - 1), id = b0 + '-' + b1;
      if (!cache.done[id]) {
        let r = null, lastErr = null;
        for (let attempt = 1; attempt <= 3 && !r; attempt++) {
          try {
            if (!b) b = await launch();
            const p = await b.newPage(); p.on('pageerror', e => errors.push(e.message));
            await p.goto('file://' + path.resolve(file));
            r = await p.evaluate(([x, y, z, w]) => window.runChunk(x, y, z, w), [b0, b1, bpm, score]);
            await p.close();
          } catch (e) { lastErr = e; try { if (b) await b.close(); } catch (_) { /* already dead */ } b = null; if (opts.progress) opts.progress(b0, bars, 'retry ' + attempt + ': ' + String(e.message).split('\n')[0]); }
        }
        if (!r) throw new Error('chunk ' + id + ' failed 3 times (browser killed?): ' + (lastErr && lastErr.message) + '. Re-run the command; finished chunks are cached.');
        cache.done[id] = r; fs.writeFileSync(cacheFile, JSON.stringify(cache));
      }
      const r = cache.done[id];
      peak = Math.max(peak, r.peak); clip += r.clip; nan += r.nan; all = all.concat(r.bars);
      if (opts.progress) opts.progress(b1, bars);
    }
  } finally { if (b) await b.close().catch(() => {}); }
  const rms = bar => (all.find(x => x[0] === bar) || [0, -99])[1];
  const avg = (a, z) => { let s = 0, n = 0; for (let i = a; i <= z; i++) { s += rms(i); n++ } return n ? s / n : -99 };
  const flags = [];
  if (clip > 0) flags.push('CLIPPING: ' + clip + ' samples at full scale. Lower the master gain.');
  if (nan > 0) flags.push('NaN samples found: a note has a non-finite parameter (scheduler would stop).');
  if (peak > 0.95) flags.push('Peak ' + peak.toFixed(2) + ' is very close to full scale.');
  if (bars === 46 && preset === 'anthem-46') {
    const intro = avg(1, 4), mont = avg(13, 20), brk = avg(21, 28), cli = avg(29, 40);
    if (!(brk <= mont - 1.5)) flags.push('Breakdown (' + brk.toFixed(1) + ' dB) is not clearly quieter than the montage (' + mont.toFixed(1) + ' dB).');
    if (!(cli >= brk + 3)) flags.push('Drop (' + cli.toFixed(1) + ' dB) is less than 3 dB louder than the breakdown (' + brk.toFixed(1) + ' dB).');
    if (!(intro <= mont - 4)) flags.push('Intro (' + intro.toFixed(1) + ' dB) is not clearly quieter than the montage.');
  }
  return { peak: +peak.toFixed(3), clippedSamples: clip, nanSamples: nan, pageErrors: errors, flags, ok: flags.length === 0, bars: all.map(x => ({ bar: x[0], rmsDb: x[1], peakDb: x[2] })) };
}
module.exports = { audioCheck };
