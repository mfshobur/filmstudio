#!/usr/bin/env node
'use strict';
// Voice provider tests against a local mock of the ElevenLabs API (no network, no key, no browser).
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const { synthesize, wordsFromAlignment } = require('../src/elevenlabs');
const { voice } = require('../src/voice');
const sample = fs.readFileSync(path.join(ROOT, 'examples', 'the-only-limit', 'voice', '00.mp3'));
let requests = 0, rateLeft = 0, last = null;
const server = http.createServer((req, res) => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    requests++; last = { method: req.method, url: req.url, key: req.headers['xi-api-key'], body: b ? JSON.parse(b) : null };
    const m = /^\/v1\/text-to-speech\/([^/]+)\/with-timestamps\?output_format=([\w]+)$/.exec(req.url);
    const send = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.method !== 'POST' || !m) return send(404, { detail: 'not found' });
    if (last.key !== 'test-key') return send(401, { detail: 'bad key' });
    if (m[1] === 'RATE' && rateLeft > 0) { rateLeft--; return send(429, { detail: 'slow down' }); }
    if (m[1] === 'INVALID') return send(422, { detail: [{ loc: ['body', 'text'], msg: 'too long', type: 'value_error' }] });
    if (m[1] === 'NOAUDIO') return send(200, {});
    const text = last.body.text, chars = text.split(''), st = chars.map((_, i) => +(i * 0.06).toFixed(3)), en = chars.map((_, i) => +((i + 1) * 0.06).toFixed(3));
    send(200, { audio_base64: sample.toString('base64'), alignment: { characters: chars, character_start_times_seconds: st, character_end_times_seconds: en }, normalized_alignment: null });
  });
});
let pass = 0, fail = 0; const tests = [];
const ta = (name, fn) => tests.push([name, fn]);
const setup = () => new Promise(r => server.listen(0, '127.0.0.1', () => r('http://127.0.0.1:' + server.address().port)));
const noWait = { backoffMs: 1 };

(async () => {
  const base = await setup();
  const prev = { k: process.env.ELEVENLABS_API_KEY, u: process.env.ELEVENLABS_BASE_URL };
  ta('wordsFromAlignment groups characters into timed words', () => {
    const text = 'hi there', chars = text.split(''), al = { characters: chars, character_start_times_seconds: chars.map((_, i) => i * .1), character_end_times_seconds: chars.map((_, i) => (i + 1) * .1) };
    const w = wordsFromAlignment(al); assert.deepStrictEqual(w.map(x => x.word), ['hi', 'there']); assert.ok(w[1].start > w[0].end - 1e-9); assert.strictEqual(wordsFromAlignment(null).length, 0);
  });
  ta('synthesize sends the documented request and parses the response', async () => {
    const r = await synthesize(Object.assign({ text: 'Hello world', voiceId: 'VOICE1', apiKey: 'test-key', baseUrl: base, settings: { stability: .4, speed: .9 } }, noWait));
    assert.strictEqual(last.method, 'POST'); assert.ok(/\/v1\/text-to-speech\/VOICE1\/with-timestamps\?output_format=mp3_44100_128$/.test(last.url)); assert.strictEqual(last.key, 'test-key');
    assert.strictEqual(last.body.text, 'Hello world'); assert.strictEqual(last.body.model_id, 'eleven_multilingual_v2'); assert.strictEqual(last.body.voice_settings.stability, .4); assert.strictEqual(last.body.voice_settings.speed, .9); assert.strictEqual(last.body.voice_settings.similarity_boost, .75);
    assert.ok(r.audio.equals(sample)); assert.deepStrictEqual(r.words.map(w => w.word), ['Hello', 'world']); assert.ok(Math.abs(r.duration - 0.66) < .01, r.duration);
  });
  ta('synthesize retries on 429 and then succeeds', async () => { rateLeft = 2; requests = 0; const r = await synthesize(Object.assign({ text: 'ok', voiceId: 'RATE', apiKey: 'test-key', baseUrl: base }, noWait)); assert.ok(r.audio.length > 0); assert.strictEqual(requests, 3); });
  ta('synthesize reports a rejected key clearly', async () => { await assert.rejects(() => synthesize(Object.assign({ text: 'x', voiceId: 'V', apiKey: 'wrong', baseUrl: base }, noWait)), e => e.code === 'AUTH' && /rejected the API key/.test(e.message) && !/wrong/.test(e.message)); });
  ta('synthesize surfaces a 422 validation detail', async () => { await assert.rejects(() => synthesize(Object.assign({ text: 'x', voiceId: 'INVALID', apiKey: 'test-key', baseUrl: base }, noWait)), e => e.code === 'BAD_REQUEST' && /too long/.test(e.message)); });
  ta('synthesize fails clearly when the response has no audio', async () => { await assert.rejects(() => synthesize(Object.assign({ text: 'x', voiceId: 'NOAUDIO', apiKey: 'test-key', baseUrl: base }, noWait)), e => e.code === 'BAD_RESPONSE'); });
  ta('synthesize needs a key and a voice id', async () => { delete process.env.ELEVENLABS_API_KEY; await assert.rejects(() => synthesize({ text: 'x', voiceId: 'V', baseUrl: base }), e => e.code === 'NO_KEY'); await assert.rejects(() => synthesize({ text: 'x', apiKey: 'test-key', baseUrl: base }), e => e.code === 'NO_VOICE'); });
  const proj = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-el-')); return { d, spec: { narration: [{ text: 'First line', at: [1, 1] }, { text: 'Second line here', at: [3, 1] }], voice: { provider: 'elevenlabs', voiceId: 'VOICE1' } } }; };
  ta('voice --provider elevenlabs refuses to spend quota without --yes', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'; process.env.ELEVENLABS_BASE_URL = base; const { d, spec } = proj(); requests = 0;
    await assert.rejects(() => voice(d, spec, { provider: 'elevenlabs' }), e => e.code === 'NEEDS_CONFIRMATION' && e.characters === 'First line'.length + 'Second line here'.length);
    assert.strictEqual(requests, 0, 'no request may be sent before confirmation');
  });
  ta('voice --provider elevenlabs --yes writes clips, durations and word timings, and is resumable', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key'; process.env.ELEVENLABS_BASE_URL = base; const { d, spec } = proj(); requests = 0;
    const r = await voice(d, spec, { provider: 'elevenlabs', yes: true });
    assert.strictEqual(requests, 2); assert.ok(r.ok !== false); assert.strictEqual(r.generated, 2, JSON.stringify(r));
    assert.ok(fs.existsSync(path.join(d, 'voice', '00.mp3')) && fs.existsSync(path.join(d, 'voice', '01.mp3')) && fs.existsSync(path.join(d, 'voice', '00.words.json')));
    const saved = JSON.parse(fs.readFileSync(path.join(d, 'spec.json'), 'utf8')); assert.strictEqual(saved.narration[0].file, 'voice/00.mp3'); assert.ok(saved.narration[0].dur > 0.5, 'dur ' + saved.narration[0].dur);
    requests = 0; await voice(d, saved, { provider: 'elevenlabs', yes: true }); assert.strictEqual(requests, 0, 'second run must not re-request');
    const all = fs.readdirSync(d, { recursive: true }).map(f => path.join(d, f)).filter(f => fs.statSync(f).isFile()).map(f => fs.readFileSync(f)).some(b => b.includes('test-key')); assert.ok(!all, 'API key leaked into the project');
  });
  for (const [n, f] of tests) { try { await f(); pass++; console.log('ok   ' + n); } catch (e) { fail++; console.log('FAIL ' + n + '\n     ' + (e && e.message)); } }
  process.env.ELEVENLABS_API_KEY = prev.k; if (prev.k === undefined) delete process.env.ELEVENLABS_API_KEY; if (prev.u === undefined) delete process.env.ELEVENLABS_BASE_URL;
  server.close(); console.log('\n' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
