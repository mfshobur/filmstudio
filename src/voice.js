'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const MASTER = 'highpass=f=70,bass=g=2:f=140:w=.8,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=140,loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=0.15';
const num = i => String(i).padStart(2, '0');
function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return r.status === 0 ? parseFloat(r.stdout) : null;
}
function toMp3(src, dst) {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-af', MASTER, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k', dst]);
  return r.status === 0;
}
function runPython(args, onLine) {
  return new Promise(resolve => {
    const py = process.env.FILMSTUDIO_PYTHON || 'python3';
    const p = spawn(py, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', d => String(d).split('\n').filter(Boolean).forEach(l => onLine && onLine(l)));
    p.stderr.on('data', () => {});
    p.on('close', code => resolve(code)); p.on('error', () => resolve(-1));
  });
}

async function voice(dir, spec, opts = {}) {
  const vdir = path.join(dir, 'voice'); fs.mkdirSync(vdir, { recursive: true });
  const provider = opts.provider || (spec.voice && spec.voice.provider) || 'kokoro';
  const narr = spec.narration || [];
  const log = opts.log || (() => {});
  if (provider === 'elevenlabs') throw new Error('The elevenlabs provider arrives in phase 3. Use --provider kokoro or --provider file for now.');
  if (provider === 'file') {
    narr.forEach((n, i) => { const f = ['mp3', 'wav', 'm4a', 'ogg'].map(e => path.join(vdir, num(i) + '.' + e)).find(fs.existsSync); if (f) n.file = path.relative(dir, f); else log('missing audio for line ' + i + ': expected voice/' + num(i) + '.mp3'); });
  } else if (provider === 'kokoro') {
    const model = process.env.FILMSTUDIO_KOKORO_MODEL || path.join(os.homedir(), '.filmstudio', 'models', 'kokoro-v1.0.onnx');
    const voices = process.env.FILMSTUDIO_KOKORO_VOICES || path.join(os.homedir(), '.filmstudio', 'models', 'voices-v1.0.bin');
    if (!fs.existsSync(model) || !fs.existsSync(voices)) throw new Error('Kokoro model files not found (' + model + '). Run `filmstudio doctor` for setup steps or set FILMSTUDIO_KOKORO_MODEL / FILMSTUDIO_KOKORO_VOICES.');
    const vs = spec.voice || {};
    for (let attempt = 1; attempt <= 4; attempt++) {
      const pending = narr.map((n, i) => i).filter(i => opts.force || !fs.existsSync(path.join(vdir, num(i) + '.mp3')));
      if (!pending.length) break;
      log('attempt ' + attempt + ': ' + pending.length + ' clip(s) to generate');
      const job = pending.map(i => ({ text: narr[i].text, voice: narr[i].voice || vs.voice || 'bf_emma', speed: narr[i].speed || vs.speed || 0.88, lang: vs.lang, out: path.join(vdir, num(i) + '.wav') }));
      const jf = path.join(vdir, 'job.json'); fs.writeFileSync(jf, JSON.stringify(job));
      await runPython([path.join(__dirname, '..', 'providers', 'kokoro_gen.py'), model, voices, jf], l => log(l));
      for (const i of pending) {
        const w = path.join(vdir, num(i) + '.wav'), m = path.join(vdir, num(i) + '.mp3');
        if (fs.existsSync(w) && fs.statSync(w).size > 1000 && toMp3(w, m)) fs.rmSync(w, { force: true });
      }
      fs.rmSync(jf, { force: true });
    }
    narr.forEach((n, i) => { const m = path.join(vdir, num(i) + '.mp3'); if (fs.existsSync(m)) n.file = 'voice/' + num(i) + '.mp3'; });
  } else throw new Error('unknown voice provider "' + provider + '". Use kokoro or file.');
  const durations = narr.map(n => n.file && fs.existsSync(path.resolve(dir, n.file)) ? probe(path.resolve(dir, n.file)) : null);
  fs.writeFileSync(path.join(vdir, 'durations.json'), JSON.stringify(durations));
  narr.forEach((n, i) => { if (durations[i]) n.dur = +durations[i].toFixed(2); });
  fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
  const missing = narr.map((n, i) => i).filter(i => !durations[i]);
  return { provider, clips: narr.length, generated: narr.length - missing.length, missing, durations };
}
module.exports = { voice, probe };
