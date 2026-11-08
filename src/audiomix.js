'use strict';
// Offline audio for MP4 export: render the score in chunks (resumable), place the narration, duck the music under speech, write a WAV.
const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');
const { decode } = require('./voicecheck');

function cutsMap(spec) { // same rule the player uses: a short whoosh/thud on every cut
  const m = {};
  (spec.shots || []).forEach(s => { const b = Math.round((s[0] - 1) * 4); if (b > 0) m[b] = (s[1] - s[0] >= 1 && [13, 29, 21, 36, 5].includes(s[0])) ? .34 : .2; });
  return m;
}
function writeWav16(file, x, sr) {
  const n = x.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, buf);
}
// music gain envelope that dips while a clip speaks (same shape as the player: fast attack, slower release)
function duckEnvelope(n, sr, intervals, depth = 0.5) {
  const env = new Float32Array(n), a = 1 - Math.exp(-1 / (sr * 0.07)), r = 1 - Math.exp(-1 / (sr * 0.3));
  let g = 1, k = 0;
  const iv = intervals.slice().sort((p, q) => p[0] - q[0]);
  for (let i = 0; i < n; i++) {
    const t = i / sr; while (k < iv.length && t > iv[k][1]) k++;
    const target = (k < iv.length && t >= iv[k][0]) ? depth : 1;
    g += (target - g) * (target < g ? a : r); env[i] = g;
  }
  return env;
}
function mixDown(music, voiceClips, sr, opts = {}) { // voiceClips: [{start (s), pcm Float32Array}]
  const n = music.length, intervals = voiceClips.map(v => [v.start - 0.08, v.start + v.pcm.length / sr]);
  const env = duckEnvelope(n, sr, intervals, opts.duck || 0.5), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = music[i] * env[i];
  voiceClips.forEach(v => { const o = Math.round(v.start * sr); for (let i = 0; i < v.pcm.length; i++) { const j = o + i; if (j >= 0 && j < n) out[j] += v.pcm[i] * (opts.voiceGain || 1.25); } });
  const k = 1.3, norm = Math.tanh(k);
  for (let i = 0; i < n; i++) out[i] = Math.tanh(Math.max(-1, Math.min(1, out[i])) * k) / norm * 0.9;
  return out;
}

async function renderMusic(spec, opts) { // returns Float32Array covering [fromBar, toBar) (seconds from the start of fromBar)
  const bpm = spec.bpm || 128, barSec = 60 / bpm * 4, sr = opts.sr, fromBar = opts.fromBar, toBar = opts.toBar, chunk = opts.chunk || 4;
  const preset = (spec.score && spec.score.preset) || 'anthem-46', sc = { calm: preset === 'calm-46', transpose: (spec.score && spec.score.transpose) || 0 };
  const total = new Float32Array(Math.round((toBar - fromBar) * barSec * sr)), cuts = cutsMap(spec);
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'engine', 'audiopcm.template.html'), 'utf8').replace('{{MUSIC}}', () => fs.readFileSync(path.join(__dirname, '..', 'engine', 'music.js'), 'utf8'));
  fs.mkdirSync(opts.workDir, { recursive: true });
  const page = path.join(opts.workDir, 'audiopcm.html'); fs.writeFileSync(page, tpl);
  const key = [bpm, JSON.stringify(sc), sr, JSON.stringify(cuts)].join('|').replace(/[^\w|.,:{}"-]/g, '');
  let browser = null;
  try {
    for (let b0 = Math.floor(fromBar); b0 < toBar; b0 += chunk) {
      const b1 = Math.min(Math.ceil(toBar) - 1, b0 + chunk - 1), cf = path.join(opts.workDir, 'music-' + b0 + '-' + b1 + '.f32'), kf = cf + '.key';
      let pcm = null;
      if (fs.existsSync(cf) && fs.existsSync(kf) && fs.readFileSync(kf, 'utf8') === key) pcm = new Float32Array(fs.readFileSync(cf).buffer.slice(0));
      if (!pcm) {
        let lastErr = null;
        for (let attempt = 1; attempt <= 3 && !pcm; attempt++) {
          try {
            if (!browser) browser = await launch();
            const p = await browser.newPage(); await p.goto('file://' + path.resolve(page));
            const r = await p.evaluate(([x, y, bp, s, rate, c]) => window.renderPcm(x, y, bp, s, rate, c), [b0, b1, bpm, sc, sr, cuts]);
            await p.close(); const b = Buffer.from(r.b64, 'base64'); pcm = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
            fs.writeFileSync(cf, Buffer.from(pcm.buffer)); fs.writeFileSync(kf, key);
          } catch (e) { lastErr = e; try { if (browser) await browser.close(); } catch (_) { /* dead */ } browser = null; if (opts.log) opts.log('music chunk ' + b0 + ' retry ' + attempt + ': ' + String(e.message).split('\n')[0]); }
        }
        if (!pcm) throw new Error('music chunk ' + b0 + '-' + b1 + ' failed 3 times: ' + (lastErr && lastErr.message) + ' (re-run: finished chunks are cached)');
      }
      const start = Math.round(((b0 - fromBar) * barSec - 0.05) * sr);
      for (let i = 0; i < pcm.length; i++) { const j = start + i; if (j >= 0 && j < total.length) total[j] += pcm[i]; }
      if (opts.log) opts.log('music bars ' + b0 + '-' + b1 + ' ready');
    }
  } finally { if (browser) await browser.close().catch(() => {}); }
  return total;
}

async function buildAudio(spec, dir, opts) {
  const sr = opts.sr || 32000, bpm = spec.bpm || 128, spb = 60 / bpm, fromBar = opts.fromBar, toBar = opts.toBar;
  const music = await renderMusic(spec, { sr, fromBar, toBar, workDir: opts.workDir, log: opts.log });
  const clips = [];
  (spec.narration || []).forEach(nn => {
    if (!nn.file) return; const f = path.resolve(dir, nn.file); if (!fs.existsSync(f)) return;
    const startBeat = (nn.at[0] - 1) * 4 + nn.at[1], start = (startBeat - (fromBar - 1) * 4) * spb;
    const pcm = decode(f, sr); if (start + pcm.length / sr < 0 || start > music.length / sr) return;
    clips.push({ start, pcm });
  });
  const mixed = mixDown(music, clips, sr, {});
  const wav = path.join(opts.workDir, 'audio.wav'); writeWav16(wav, mixed, sr);
  return { wav, seconds: music.length / sr, clips: clips.length };
}
module.exports = { cutsMap, writeWav16, duckEnvelope, mixDown, renderMusic, buildAudio };
