'use strict';
// `filmstudio listen`: an agent cannot hear, but it can read. Each narration clip is transcribed with a local Whisper model
// and compared with the script, which catches garbled or swallowed words, cut-off endings, wrong words and speech that is not in the script.
// It cannot judge tone, emotion or taste: ask a person to listen for those.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const ENV = require('./env');

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function spell(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + spell(n % 100) : '');
  if (n < 1e6) return spell(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + spell(n % 1000) : '');
  return String(n).split('').map(d => ONES[+d]).join(' ');
}
/* words as a speaker would say them, so "29", "Twenty-nine" and "twenty nine" are the same */
function normalize(text) {
  return String(text || '').toLowerCase().replace(/&/g, ' and ').replace(/%/g, ' percent ').replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\d+/g, m => ' ' + spell(parseInt(m, 10)) + ' ').replace(/[’]/g, "'").replace(/[-–—\/]/g, ' ')
    .replace(/[^a-z' ]/g, ' ').replace(/(^|\s)'+|'+(?=\s|$)/g, ' ').replace(/\ba (hundred|thousand|million)\b/g, 'one $1').split(/\s+/).filter(Boolean);
}
/* "filmstudio" and "film studio" sound the same: join neighbouring words when the join is a word on the other side */
function joinCompounds(a, other) {
  const set = new Set(other), out = [];
  for (let i = 0; i < a.length; i++) { if (i + 1 < a.length && set.has(a[i] + a[i + 1])) { out.push(a[i] + a[i + 1]); i++; } else out.push(a[i]); }
  return out;
}
/* word alignment by edit distance: ops are equal, sub, del (in the script, not heard) and ins (heard, not in the script) */
function align(ref, hyp) {
  const n = ref.length, m = hyp.length, d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i; for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
  const ops = []; let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) { ops.push({ op: ref[i - 1] === hyp[j - 1] ? 'equal' : 'sub', ref: ref[i - 1], hyp: hyp[j - 1] }); i--; j--; }
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.push({ op: 'del', ref: ref[i - 1] }); i--; }
    else { ops.push({ op: 'ins', hyp: hyp[j - 1] }); j--; }
  }
  return ops.reverse();
}
/* compare what the script says with what was heard */
function compare(script, heard) {
  let ref = normalize(script), hyp = normalize(heard); const r0 = ref; ref = joinCompounds(ref, hyp); hyp = joinCompounds(hyp, r0); const ops = align(ref, hyp);
  const wrong = ops.filter(o => o.op !== 'equal').length, wer = ref.length ? wrong / ref.length : (hyp.length ? 1 : 0);
  const missing = ops.filter(o => o.op === 'del').map(o => o.ref), extra = ops.filter(o => o.op === 'ins').map(o => o.hyp), subs = ops.filter(o => o.op === 'sub').map(o => [o.ref, o.hyp]);
  const lastRef = ops.filter(o => o.ref !== undefined), tailMissing = []; for (let k = lastRef.length - 1; k >= 0 && lastRef[k].op === 'del'; k--) tailMissing.unshift(lastRef[k].ref);
  const headMissing = []; for (let k = 0; k < lastRef.length && lastRef[k].op === 'del'; k++) headMissing.push(lastRef[k].ref);
  return { wer: Math.round(wer * 100) / 100, words: ref.length, missing, extra, substituted: subs, tailMissing, headMissing };
}
function judge(script, tr, minProb) {
  const c = compare(script, tr.text), flags = [];
  if (!tr.text) flags.push('nothing was heard: the clip may be silent or not speech');
  else {
    if (c.wer >= 0.35) flags.push('does not match the script (' + Math.round(c.wer * 100) + '% of words differ)');
    else if (c.substituted.length || c.missing.length || c.extra.length) flags.push('words differ from the script: ' + c.substituted.map(x => x[0] + ' heard as ' + x[1]).concat(c.missing.map(w => w + ' not heard'), c.extra.map(w => w + ' added')).join('; '));
    if (c.tailMissing.length) flags.push('the end may be cut off: "' + c.tailMissing.join(' ') + '" was not heard');
    if (c.headMissing.length) flags.push('the start may be clipped: "' + c.headMissing.join(' ') + '" was not heard');
    if (c.extra.length >= 3) flags.push('extra speech that is not in the script: "' + c.extra.join(' ') + '"');
  }
  const unclear = (tr.words || []).filter(w => w.p != null && w.p < (minProb == null ? 0.4 : minProb)).map(w => w.w.replace(/[^\w']/g, '')).filter(Boolean);
  const warnings = unclear.length ? ['the recogniser was unsure of: ' + unclear.join(', ') + ' (may be unclear or just an unusual word)'] : [];
  return Object.assign({ script, heard: tr.text, unclearWords: unclear.length ? unclear : undefined, flags, warnings }, c);
}

const modelDir = model => process.env.FILMSTUDIO_LISTEN_MODEL || path.join(ENV.HOME, 'models', 'whisper', model || 'base.en');
const listenPython = () => process.env.FILMSTUDIO_LISTEN_PYTHON || path.join(ENV.HOME, 'venv-listen', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
function available(model) {
  const py = listenPython(), md = modelDir(model);
  return { python: fs.existsSync(py), model: fs.existsSync(path.join(md, 'model.bin')), pythonPath: py, modelPath: md };
}
const SETUP_HELP = 'Speech recognition is not installed. It needs about 150 MB (the faster-whisper package and the base.en model, downloaded from Hugging Face). Ask the user, then run `filmstudio listen --setup`.';

function runWorker(clips, model, onLine) {
  return new Promise((resolve, reject) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-listen-')), job = path.join(tmp, 'job.json'), out = path.join(tmp, 'out.json');
    fs.writeFileSync(job, JSON.stringify(clips));
    const p = spawn(listenPython(), [path.join(__dirname, '..', 'providers', 'listen_whisper.py'), modelDir(model), job, out], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stdout.on('data', d => String(d).split('\n').filter(Boolean).forEach(l => onLine && onLine(l))); p.stderr.on('data', d => err += d);
    p.on('close', code => { try { if (code !== 0) throw new Error('speech recognition failed: ' + err.slice(-400)); resolve(JSON.parse(fs.readFileSync(out, 'utf8'))); } catch (e) { reject(e); } finally { fs.rmSync(tmp, { recursive: true, force: true }); } });
    p.on('error', e => reject(e));
  });
}

async function listen(dir, spec, opts = {}) {
  const narr = spec.narration || [], only = opts.lines ? new Set(opts.lines) : null, log = opts.log || (() => {});
  const clips = [];
  narr.forEach((n, i) => { if (only && !only.has(i)) return; const f = n.file && path.resolve(dir, n.file); if (f && fs.existsSync(f)) clips.push({ index: i, file: f, text: n.text }); });
  if (!clips.length) return { ok: false, error: 'no narration clips found: run `filmstudio voice` first' };
  let transcripts = opts.transcripts;                       // tests pass transcripts in; normally the worker makes them
  if (!transcripts) {
    const a = available(opts.model);
    if (!a.python || !a.model) { const e = new Error(SETUP_HELP); e.code = 'NOT_INSTALLED'; throw e; }
    transcripts = await runWorker(clips.map(c => ({ index: c.index, file: c.file })), opts.model, log);
  }
  const results = clips.map(c => { const tr = (transcripts || []).find(t => t.index === c.index) || { text: '', words: [] }; return Object.assign({ index: c.index }, judge(c.text, tr, opts.minProb)); });
  const flagged = results.filter(r => r.flags.length), avg = results.reduce((s, r) => s + r.wer, 0) / results.length;
  return { ok: flagged.length === 0, clips: results.length, flagged: flagged.length, withWarnings: results.filter(r => !r.flags.length && r.warnings.length).length, meanWordErrorRate: Math.round(avg * 100) / 100, results, note: 'This reads the narration back with a speech recogniser and compares it with the script. It catches garbled, swallowed, cut-off or wrong words. It cannot judge tone, emotion, pacing or whether the voice sounds natural: ask a person to listen and report timecodes.' };
}

function setup(model, log) {
  model = model || 'base.en';
  const home = ENV.HOME, venv = path.join(home, 'venv-listen'), py = listenPython(), sh = (cmd, args, env) => { const r = spawnSync(cmd, args, { encoding: 'utf8', env: Object.assign({}, process.env, env || {}) }); if (r.status !== 0) throw new Error(cmd + ' ' + args.slice(0, 3).join(' ') + ' failed: ' + String(r.stderr || r.stdout).slice(-400)); return r; };
  fs.mkdirSync(home, { recursive: true });
  if (!fs.existsSync(py)) { log('creating ' + venv); sh('python3', ['-m', 'venv', venv]); }
  log('installing faster-whisper'); sh(py, ['-m', 'pip', 'install', '-q', 'faster-whisper']);
  const md = modelDir(model); fs.mkdirSync(md, { recursive: true });
  log('downloading the ' + model + ' model to ' + md + ' (about 150 MB)');
  sh(py, ['-c', 'from huggingface_hub import snapshot_download; snapshot_download("Systran/faster-whisper-' + model + '", local_dir=r"' + md + '")'], { HF_HUB_DISABLE_XET: '1' });
  return { ok: true, model, python: py, modelPath: md };
}
module.exports = { normalize, align, compare, judge, listen, setup, available, SETUP_HELP };
