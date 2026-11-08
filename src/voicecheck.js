'use strict';
// Automatic voice-clip checks. These cannot judge taste; they catch measurable problems:
// clipping, glitches, wrong loudness, long silences, too fast/slow reading, flat (monotone) delivery, clips that don't match each other.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const db = x => 20 * Math.log10(Math.max(x, 1e-9));
function median(a) { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; }

// x: Float32Array mono, sr: sample rate, text: the spoken text (for words per second)
function analyzePcm(x, sr, text) {
  const n = x.length, dur = n / sr;
  let peak = 0, sq = 0, clip = 0, spikes = 0;
  const dArr = new Float32Array(n), P = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = Math.abs(x[i]); if (a > peak) peak = a; sq += x[i] * x[i]; if (a >= 0.999) clip++;
    dArr[i] = i ? Math.abs(x[i] - x[i - 1]) : 0; P[i + 1] = P[i] + dArr[i];
  }
  // a click is an isolated jump: much larger than the average change both BEFORE and AFTER it (a plosive burst keeps going)
  for (let i = 33; i < n - 34; i++) {
    if (dArr[i] > 0.4) { const before = (P[i] - P[i - 32]) / 32, after = (P[i + 33] - P[i + 1]) / 32; if (dArr[i] > 8 * (before + 1e-4) && dArr[i] > 8 * (after + 1e-4)) spikes++; }
  }
  const rmsDb = db(Math.sqrt(sq / Math.max(1, n)));
  // frame energy (20 ms) -> speech/silence
  const fl = Math.round(sr * 0.02), nf = Math.floor(n / fl), fr = [];
  for (let f = 0; f < nf; f++) { let s = 0; for (let i = f * fl; i < (f + 1) * fl; i++) s += x[i] * x[i]; fr.push(db(Math.sqrt(s / fl))); }
  const speechT = Math.max(-50, db(peak) - 38), isSp = fr.map(v => v > speechT);
  let first = isSp.indexOf(true), last = isSp.lastIndexOf(true);
  if (first < 0) { first = 0; last = -1; }
  const lead = first * 0.02, trail = Math.max(0, (nf - 1 - last) * 0.02);
  let longPause = 0, run = 0;
  for (let f = first; f <= last; f++) { if (!isSp[f]) run++; else { if (run * 0.02 > 0.7) longPause++; run = 0; } }
  const speakDur = Math.max(0.2, (last - first + 1) * 0.02);
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length, wps = words / speakDur;
  // pitch (autocorrelation, 16 kHz assumed) on voiced frames
  const win = Math.round(sr * 0.03), hop = Math.round(sr * 0.015), lo = Math.floor(sr / 400), hi = Math.floor(sr / 70), f0 = [];
  for (let s = 0; s + win + hi < n; s += hop) {
    let e = 0; for (let i = 0; i < win; i++) e += x[s + i] * x[s + i];
    if (db(Math.sqrt(e / win)) < speechT + 4) continue;
    const rs = [];
    let best = 0;
    for (let l = lo; l <= hi; l++) { let c = 0, e2 = 0; for (let i = 0; i < win; i++) { c += x[s + i] * x[s + i + l]; e2 += x[s + i + l] * x[s + i + l]; } const r = c / Math.sqrt(e * e2 + 1e-12); rs.push(r); if (r > best) best = r; }
    let bl = 0;
    for (let k = 1; k < rs.length - 1; k++) { if (rs[k] >= best * 0.9 && rs[k] >= rs[k - 1] && rs[k] >= rs[k + 1]) { bl = lo + k; break; } }
    if (best > 0.5 && bl) f0.push(sr / bl);
  }
  const st = f0.map(v => 12 * Math.log2(v / 100));
  const mean = st.reduce((a, b) => a + b, 0) / (st.length || 1), sd = Math.sqrt(st.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (st.length || 1));
  const medF0 = f0.length ? median(f0) : 0;
  return { duration: +dur.toFixed(2), peakDb: +db(peak).toFixed(1), rmsDb: +rmsDb.toFixed(1), clippedSamples: clip, spikes, leadingSilence: +lead.toFixed(2), trailingSilence: +trail.toFixed(2), longPauses: longPause, words, wordsPerSecond: +wps.toFixed(2), voicedFrames: f0.length, medianF0: Math.round(medF0), pitchVariationSemitones: +sd.toFixed(2) };
}

function clipFlags(a) {
  const f = [];
  if (a.clippedSamples > 0) f.push('clipping (' + a.clippedSamples + ' samples at full scale)');
  if (a.peakDb > -0.5) f.push('peak ' + a.peakDb + ' dB is almost full scale');
  if (a.spikes > 4) f.push(a.spikes + ' sudden sample jumps: possible clicks or glitches');
  if (a.rmsDb < -30) f.push('very quiet (' + a.rmsDb + ' dB RMS)');
  if (a.leadingSilence > 0.8) f.push('long silence at the start (' + a.leadingSilence + ' s)');
  if (a.trailingSilence > 1.2) f.push('long silence at the end (' + a.trailingSilence + ' s)');
  if (a.longPauses > 0) f.push(a.longPauses + ' pause(s) longer than 0.7 s inside the clip');
  if (a.words >= 4 && a.wordsPerSecond < 1.0) f.push('very slow reading (' + a.wordsPerSecond + ' words/s)');
  if (a.words >= 4 && a.wordsPerSecond > 4.2) f.push('very fast reading (' + a.wordsPerSecond + ' words/s)');
  if (a.words >= 5 && a.voicedFrames > 25 && a.pitchVariationSemitones < 0.9) f.push('flat delivery (pitch varies only ' + a.pitchVariationSemitones + ' semitones)');
  return f;
}

function decode(file, sr = 16000) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(sr), '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffmpeg could not decode ' + file + ': ' + String(r.stderr).slice(0, 200));
  const b = r.stdout; return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));
}

function voiceCheck(dir, spec) {
  const narr = spec.narration || [], clips = [];
  narr.forEach((nn, i) => {
    if (!nn.file || !fs.existsSync(path.resolve(dir, nn.file))) { clips.push({ index: i, text: nn.text, flags: ['no audio file; run `filmstudio voice`'], missing: true }); return; }
    const a = analyzePcm(decode(path.resolve(dir, nn.file)), 16000, nn.text);
    clips.push(Object.assign({ index: i, text: nn.text, file: nn.file }, a, { flags: clipFlags(a) }));
  });
  const ok = clips.filter(c => !c.missing);
  const medRms = median(ok.map(c => c.rmsDb)), medF0 = median(ok.filter(c => c.medianF0).map(c => c.medianF0));
  ok.forEach(c => {
    if (Math.abs(c.rmsDb - medRms) > 6) c.flags.push('loudness differs from the other clips by ' + (c.rmsDb - medRms).toFixed(1) + ' dB');
    if (medF0 && c.medianF0 && Math.abs(c.medianF0 / medF0 - 1) > 0.35) c.flags.push('pitch ' + c.medianF0 + ' Hz is far from the other clips (' + medF0 + ' Hz): voice may have drifted');
  });
  const flagged = clips.filter(c => c.flags.length);
  return { ok: flagged.length === 0, clips: clips.length, flagged: flagged.length, medianRmsDb: +medRms.toFixed(1), medianF0: medF0, note: 'Automatic checks only. They cannot judge how the voice sounds; ask a person to listen.', results: clips };
}
module.exports = { analyzePcm, clipFlags, voiceCheck, decode };
