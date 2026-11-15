#!/usr/bin/env node
'use strict';
// Score parts: the composer inside engine/music.js (run against a fake audio context) and the validation of spec.score.parts.
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const { validate } = require('../src/validate');
const { buildTimeline } = require('../src/timeline');
const M = new Function(fs.readFileSync(path.join(ROOT, 'engine', 'music.js'), 'utf8') + '; return {createMusic,chordVoicing,partFlash,PART_STYLE};')();
let pass = 0, fail = 0; const t = (n, f) => { try { f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.message)); } };

/* a fake AudioContext that only counts what gets created (every sound is at least one oscillator or noise source) */
function fakeCtx() {
  const log = { osc: 0, noise: 0, amp: 0 }, P = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const G = () => ({ value: 0, setValueAtTime(v) { log.amp += Math.abs(v); }, linearRampToValueAtTime(v) { log.amp += Math.abs(v); }, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} }); // sums the levels sounds are scheduled at
  const n = o => Object.assign({ connect() {}, disconnect() {} }, o);
  return { log, c: { sampleRate: 8000,
    createGain: () => n({ gain: G() }), createOscillator: () => { log.osc++; return n({ type: '', frequency: P(), detune: P(), start() {}, stop() {} }); },
    createBiquadFilter: () => n({ type: '', frequency: P(), Q: P(), gain: P() }), createConvolver: () => n({ buffer: null }), createDelay: () => n({ delayTime: P() }),
    createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }), createBufferSource: () => { log.noise++; return n({ buffer: null, loop: false, start() {}, stop() {} }); } } };
}
const run = (parts, bars, from = 1, to = bars) => { const f = fakeCtx(), m = M.createMusic(f.c, {}, 128, { bars, parts }); const out = []; for (let b = from; b <= to; b++) { const before = f.log.osc + f.log.noise; for (let s = 0; s < 16; s++) m.step((b - 1) * 16 + s, 0); out.push(f.log.osc + f.log.noise - before); } return { m, out, log: f.log }; };
const part = (from, to, style, extra) => Object.assign({ from, to, style, chords: ['Am', 'F', 'C', 'G'] }, extra || {});

t('every style plays through its bars without throwing and makes sound on every bar', () => {
  for (const style of ['ambient', 'pulse', 'drive', 'anthem']) { const r = run([part(1, 8, style)], 8); assert.strictEqual(r.m.bars, 8, style); assert.strictEqual(r.m.steps, 128, style); r.out.forEach((n, i) => assert.ok(n > 0, style + ' bar ' + (i + 1) + ' is silent')); }
});
t('the styles really differ: drive is busier than pulse, pulse busier than ambient', () => {
  const sum = style => run([part(1, 8, style, { energy: [1, 1] })], 8).out.reduce((a, b) => a + b, 0), a = sum('ambient'), p = sum('pulse'), d = sum('drive');
  assert.ok(d > p && p > a, 'ambient ' + a + ', pulse ' + p + ', drive ' + d);
});
t('film bars map straight to music bars (no 46-bar arrangement), for any length', () => { for (const bars of [20, 48, 75]) { const m = M.createMusic(fakeCtx().c, {}, 128, { bars, parts: [part(1, bars, 'pulse')] }); assert.strictEqual(m.bars, bars); } });
t('a part can end on a breath: the beat before a drop part is silent', () => {
  const r = run([part(1, 4, 'drive'), part(5, 8, 'anthem', { drop: true })], 8, 4, 4), f = fakeCtx(), m = M.createMusic(f.c, {}, 128, { bars: 8, parts: [part(1, 4, 'drive'), part(5, 8, 'anthem', { drop: true })] });
  for (let s = 0; s < 12; s++) m.step(3 * 16 + s, 0); const before = f.log.osc + f.log.noise; for (let s = 12; s < 16; s++) m.step(3 * 16 + s, 0);
  assert.strictEqual(f.log.osc + f.log.noise, before, 'sound inside the breath'); assert.ok(r.out[0] > 0);
});
t('a part opens with its impact (hit) and ends with its build (into); none means none', () => {
  const first = (parts, bar) => { const f = fakeCtx(), m = M.createMusic(f.c, {}, 128, { bars: 8, parts }); m.step((bar - 1) * 16, 0); return f.log.osc + f.log.noise; };
  const two = (h) => [part(1, 4, 'pulse'), part(5, 8, 'pulse', { hit: h })];
  assert.ok(first(two('both'), 5) > first(two('none'), 5), 'hit adds sound on the first step');
  const lastBar = into => { const f = fakeCtx(), m = M.createMusic(f.c, {}, 128, { bars: 8, parts: [part(1, 4, 'pulse', { into }), part(5, 8, 'pulse')] }); m.step(3 * 16, 0); return f.log.osc + f.log.noise; };
  assert.ok(lastBar('riser') > lastBar('none'), 'riser adds sound on the last bar');
});
t('energy shapes loudness: higher energy schedules louder sounds, and [low, high] is a crescendo across the part', () => {
  const amp = (energy, from, to) => { const f = fakeCtx(), m = M.createMusic(f.c, {}, 128, { bars: 8, parts: [part(1, 8, 'pulse', { energy })] }); const before = f.log.amp; for (let b = from; b <= to; b++) for (let s = 0; s < 16; s++) m.step((b - 1) * 16 + s, 0); return f.log.amp - before; };
  assert.ok(amp([1.2], 1, 8) > amp([0.4], 1, 8) * 1.3, 'energy 1.2 should be clearly louder than 0.4');
  assert.ok(amp([0.2, 1.2], 7, 8) > amp([0.2, 1.2], 1, 2) * 1.3, 'a crescendo is louder at the end than at the start');
});
t('chord names: voicings match the built-in score, extensions work, junk is refused', () => {
  assert.deepStrictEqual(M.chordVoicing('Am'), { root: 33, pad: [45, 52, 57, 60, 64] }); assert.deepStrictEqual(M.chordVoicing('C'), { root: 36, pad: [48, 55, 60, 64, 67] });
  assert.deepStrictEqual(M.chordVoicing('F#m7').root, 30); assert.ok(M.chordVoicing('Bbmaj7') && M.chordVoicing('Csus4') && M.chordVoicing('G7') && M.chordVoicing('Edim'));
  for (const bad of ['H', 'am', 'C#9', '', 'Am/C']) assert.strictEqual(M.chordVoicing(bad), null, bad);
});
t('partFlash: style defaults, per-part override, outside the film', () => {
  const parts = [part(1, 4, 'ambient'), part(5, 8, 'drive', { flash: 0.3 })]; assert.strictEqual(M.partFlash(parts, 2), M.PART_STYLE.ambient.flash); assert.strictEqual(M.partFlash(parts, 6), 0.3); assert.strictEqual(M.partFlash(parts, 99), 0.6); assert.strictEqual(M.partFlash(null, 1), null);
});

/* ---- validation of spec.score.parts ---- */
const EX = path.join(ROOT, 'examples', 'the-only-limit'), base = () => JSON.parse(fs.readFileSync(path.join(EX, 'spec.json'), 'utf8'));
const errs = mut => { const s = base(); s.score = { parts: [part(1, 20, 'ambient'), part(21, 46, 'drive')] }; mut(s); return validate(s, EX).errors.map(e => e.path + ': ' + e.message); };
t('valid parts pass, and a film with parts is no longer bound to the built-in 46-bar lengths', () => {
  assert.deepStrictEqual(errs(() => {}), []);
  const s = base(); s.bars = 47; s.shots[s.shots.length - 1][1] = 48; s.endCardBar = 45; s.score = { parts: [part(1, 20, 'ambient'), part(21, 47, 'drive')] }; assert.ok(!validate(s, EX).errors.some(e => /built-in scores/.test(e.message)), 'built-in length rule should not apply');
});
t('parts must tile the film: first at bar 1, no gap, no overlap, last at the final bar', () => {
  assert.ok(errs(s => { s.score.parts[0].from = 2; }).some(m => /first part must start at bar 1/.test(m)));
  assert.ok(errs(s => { s.score.parts[1].from = 23; }).some(m => /previous part ended at bar 20/.test(m)));
  assert.ok(errs(s => { s.score.parts[1].from = 19; }).some(m => /previous part ended at bar 20/.test(m)));
  assert.ok(errs(s => { s.score.parts[1].to = 40; }).some(m => /parts end at bar 40 but the film has 46/.test(m)));
});
t('bad styles, chords, numbers and shapes are each reported with their own path', () => {
  assert.ok(errs(s => { s.score.parts[0].style = 'disco'; }).some(m => /parts\[0\]\.style: unknown part style "disco"/.test(m)));
  assert.ok(errs(s => { s.score.parts[1].chords = ['Am', 'H']; }).some(m => /parts\[1\]\.chords/.test(m)));
  assert.ok(errs(s => { s.score.parts[0].energy = [2, 0.5]; }).some(m => /energy/.test(m)));
  assert.ok(errs(s => { s.score.parts[0].vol = 9; }).some(m => /vol/.test(m)));
  assert.ok(errs(s => { s.score.parts[0].into = 'fade'; }).some(m => /into/.test(m)));
  assert.ok(errs(s => { s.score.parts[0].from = 'a'; }).some(m => /whole film bars/.test(m)));
  assert.ok(errs(s => { s.score.parts = []; }).some(m => /non-empty array/.test(m)));
  assert.ok(errs(s => { s.score.parts = [5]; }).some(m => /must be an object/.test(m)));
});
t('the timeline music track shows the parts by name', () => {
  const s = base(); s.score = { parts: [part(1, 20, 'ambient', { name: 'Setup' }), part(21, 46, 'drive')] };
  const m = buildTimeline(s, EX).tracks.music; assert.deepStrictEqual(m.map(x => [x.name, x.startBar, x.endBar]), [['Setup', 1, 21], ['drive', 21, 47]]);
  const plain = buildTimeline(base(), EX).tracks.music; assert.ok(plain.length >= 5 && plain[0].name === 'intro', 'built-in preset sections are unchanged');
});
console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
