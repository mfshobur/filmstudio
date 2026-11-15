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
/* NeuTTS clips start with 0.5-1 s of silence: cut it, keep a short breath of 80 ms */
const TRIM = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,adelay=80:all=1,';
function toMp3(src, dst, trim) {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-af', (trim ? TRIM : '') + MASTER, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k', dst]);
  return r.status === 0;
}
function runPython(args, onLine, python) {
  return new Promise(resolve => {
    const py = python || process.env.FILMSTUDIO_PYTHON || 'python3';
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
  if (provider === 'elevenlabs') {
    const { synthesize } = require('./elevenlabs'), vs = spec.voice || {};
    const pending = narr.map((n, i) => i).filter(i => opts.force || !fs.existsSync(path.join(vdir, num(i) + '.mp3')));
    const chars = pending.reduce((a, i) => a + String(narr[i].text).length, 0);
    if (pending.length && !opts.yes) { const e = new Error('This will send ' + chars + ' characters (' + pending.length + ' clips) to ElevenLabs, which uses your paid quota. Ask the user, then re-run with --yes.'); e.code = 'NEEDS_CONFIRMATION'; e.characters = chars; throw e; }
    for (const i of pending) {
      const r = await synthesize({ text: narr[i].text, voiceId: narr[i].voiceId || vs.voiceId, model: vs.model, settings: Object.assign({}, vs, narr[i].speed ? { speed: narr[i].speed } : {}) });
      const raw = path.join(vdir, num(i) + '.raw.mp3'), m = path.join(vdir, num(i) + '.mp3');
      fs.writeFileSync(raw, r.audio); fs.writeFileSync(path.join(vdir, num(i) + '.words.json'), JSON.stringify({ words: r.words, duration: r.duration }));
      if (toMp3(raw, m)) fs.rmSync(raw, { force: true }); else fs.renameSync(raw, m);
      log('ok voice/' + num(i) + '.mp3 (' + String(narr[i].text).length + ' chars)');
    }
    narr.forEach((n, i) => { const m = path.join(vdir, num(i) + '.mp3'); if (fs.existsSync(m)) n.file = 'voice/' + num(i) + '.mp3'; });
  } else if (provider === 'file') {
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
  } else if (provider === 'neutts') {
    /* NeuTTS-2E: emotional English, speakers emily/sophie/paul/steven, emotion per line. Runs in its own venv (~/.filmstudio/venv-neutts). */
    const home = path.join(os.homedir(), '.filmstudio');
    const gguf = process.env.FILMSTUDIO_NEUTTS_MODEL || path.join(home, 'models', 'neutts', 'neutts-2e-Q8_0.gguf');
    const onnx = process.env.FILMSTUDIO_NEUTTS_CODEC || path.join(home, 'models', 'neutts', 'neucodec-onnx-decoder-int8', 'model.onnx');
    const py = process.env.FILMSTUDIO_NEUTTS_PYTHON || path.join(home, 'venv-neutts', 'bin', 'python');
    for (const f of [gguf, onnx, py]) if (!fs.existsSync(f)) throw new Error('NeuTTS file not found: ' + f + '. See `filmstudio guide voice` (NeuTTS) for setup, or run `filmstudio doctor`.');
    const vs = spec.voice || {}, EMO = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised'], SPK = ['emily', 'sophie', 'paul', 'steven'];
    narr.forEach((n, i) => { const e = n.emotion || vs.emotion || 'neutral', sp = n.speaker || vs.speaker || 'emily'; if (!EMO.includes(e)) throw new Error('narration[' + i + '].emotion "' + e + '" is not one of ' + EMO.join(', ')); if (!SPK.includes(sp)) throw new Error('narration[' + i + '].speaker "' + sp + '" is not one of ' + SPK.join(', ')); });
    for (let attempt = 1; attempt <= 3; attempt++) {
      const pending = narr.map((n, i) => i).filter(i => opts.force || !fs.existsSync(path.join(vdir, num(i) + '.mp3')));
      if (!pending.length) break;
      log('attempt ' + attempt + ': ' + pending.length + ' clip(s) to generate');
      const job = pending.map(i => ({ text: narr[i].text, speaker: narr[i].speaker || vs.speaker || 'emily', emotion: narr[i].emotion || vs.emotion || 'neutral', seed: narr[i].seed != null ? narr[i].seed : (vs.seed != null ? vs.seed + i : undefined), out: path.join(vdir, num(i) + '.wav') }));
      const jf = path.join(vdir, 'job.json'); fs.writeFileSync(jf, JSON.stringify(job));
      await runPython([path.join(__dirname, '..', 'providers', 'neutts_gen.py'), gguf, onnx, jf], l => log(l), py);
      for (const i of pending) {
        const w = path.join(vdir, num(i) + '.wav'), m = path.join(vdir, num(i) + '.mp3');
        if (fs.existsSync(w) && fs.statSync(w).size > 1000 && toMp3(w, m, true)) fs.rmSync(w, { force: true });
      }
      fs.rmSync(jf, { force: true });
    }
    narr.forEach((n, i) => { const m = path.join(vdir, num(i) + '.mp3'); if (fs.existsSync(m)) n.file = 'voice/' + num(i) + '.mp3'; });
  } else throw new Error('unknown voice provider "' + provider + '". Use kokoro, neutts, elevenlabs or file.');
  const durations = narr.map((n, i) => { if (!(n.file && fs.existsSync(path.resolve(dir, n.file)))) return null; const d = probe(path.resolve(dir, n.file)); if (d) return d; try { const w = JSON.parse(fs.readFileSync(path.join(vdir, num(i) + '.words.json'), 'utf8')); return w.duration ? w.duration + 0.15 : null; } catch (e) { return null; } });
  fs.writeFileSync(path.join(vdir, 'durations.json'), JSON.stringify(durations));
  narr.forEach((n, i) => { if (durations[i]) n.dur = +durations[i].toFixed(2); });
  fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
  const missing = narr.map((n, i) => i).filter(i => !durations[i]);
  return { provider, clips: narr.length, generated: narr.length - missing.length, missing, durations };
}
module.exports = { voice, probe };
