#!/usr/bin/env node
'use strict';
// End-to-end export test (needs ffmpeg + a browser): exports bars 1-3 of the example at low res and inspects the MP4 with ffprobe.
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert'), { spawnSync } = require('child_process');
const { exportFilm } = require('../src/exporter');
(async () => {
  const dir = fs.mkdtempSync(path.join(process.env.FILMSTUDIO_QA_TMP || os.tmpdir(), 'fs-export-'));
  fs.cpSync(path.join(__dirname, '..', 'examples', 'the-only-limit'), dir, { recursive: true, filter: s => !s.includes(path.sep + 'build') });
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
  const fps = 6;
  const r = await exportFilm(dir, spec, { fps, size: [320, 180], fromBar: 1, toBar: 3, log: m => console.error(m) });
  const probe = (args) => JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-of', 'json'].concat(args), { encoding: 'utf8' }).stdout);
  const info = probe(['-show_streams', '-show_format', r.out]), v = info.streams.find(s => s.codec_type === 'video'), a = info.streams.find(s => s.codec_type === 'audio');
  const dur = parseFloat(info.format.duration), expect = 2 * 4 * 60 / 128;
  assert.ok(v && a, 'needs both a video and an audio stream');
  assert.strictEqual(v.width, 320); assert.strictEqual(v.height, 180);
  assert.ok(Math.abs(dur - expect) < 0.45, 'duration ' + dur + ' vs ' + expect);
  const frames = parseInt(probe(['-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', r.out]).streams[0].nb_read_frames);
  const want = Math.ceil(expect * fps); assert.ok(frames === want || frames === want - 1, 'frame count ' + frames + ' vs ' + want + ' (the muxer trims video to the audio length)');
  // the audio must not be silent: extract volume stats
  const vol = spawnSync('ffmpeg', ['-i', r.out, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, mean = parseFloat((/mean_volume: (-?[\d.]+) dB/.exec(vol) || [])[1]), max = parseFloat((/max_volume: (-?[\d.]+) dB/.exec(vol) || [])[1]);
  assert.ok(mean > -60 && max > -30, 'audio looks silent: mean ' + mean + ' max ' + max); assert.ok(max <= 0, 'audio clips: max ' + max);
  assert.ok(r.narrationClips >= 1, 'narration must be mixed in');
  // resume: a second run must reuse the frames (no browser needed for them)
  const t0 = Date.now(); const r2 = await exportFilm(dir, spec, { fps, size: [320, 180], fromBar: 1, toBar: 3 }); assert.strictEqual(r2.frames, r.frames);
  console.log(JSON.stringify({ ok: true, durationSeconds: dur, expected: expect, frames, audioMeanDb: mean, audioMaxDb: max, encoder: r.encoder, bytes: r.bytes, resumeSeconds: ((Date.now() - t0) / 1000).toFixed(1) }));
})().catch(e => { console.log(JSON.stringify({ ok: false, error: e.message })); process.exit(1); });
