'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadPlaywright } = require('./browser');

function which(cmd, args = ['-version']) { const r = spawnSync(cmd, args, { encoding: 'utf8' }); return r.status === 0 ? (r.stdout || r.stderr).split('\n')[0] : null; }
async function doctor(opts = {}) {
  const checks = [];
  const add = (name, ok, detail, fix, optional) => checks.push({ name, ok, optional: !!optional, detail, fix });
  add('node', parseInt(process.versions.node) >= 18, process.version, 'Install Node.js 18 or newer.');
  const ff = which('ffmpeg'); add('ffmpeg', !!ff, ff || 'not found', 'Install ffmpeg (apt/brew/pkg install ffmpeg). Needed for narration and contact sheets.');
  let pw = null; try { pw = loadPlaywright(); } catch (e) { /* reported below */ }
  add('playwright-core', !!pw, pw ? 'found' : 'not found', 'npm i playwright-core && npx playwright-core install chromium (set FILMSTUDIO_PW to its node_modules if installed elsewhere). Needed for review and audio-check.');
  if (pw && opts.deep) { try { const { launch } = require('./browser'); const b = await launch(); await b.close(); add('chromium launch', true, 'ok'); } catch (e) { add('chromium launch', false, String(e.message).split('\n')[0], 'Run `npx playwright-core install chromium` (and install system libraries on Linux).'); } }
  const py = process.env.FILMSTUDIO_PYTHON || 'python3';
  const kok = spawnSync(py, ['-c', 'import kokoro_onnx, soundfile; print("ok")'], { encoding: 'utf8' });
  add('kokoro python packages', kok.status === 0, kok.status === 0 ? py : 'missing', 'python3 -m venv ~/.filmstudio/venv && ~/.filmstudio/venv/bin/pip install kokoro-onnx soundfile; set FILMSTUDIO_PYTHON to that python.', true);
  const model = process.env.FILMSTUDIO_KOKORO_MODEL || path.join(os.homedir(), '.filmstudio', 'models', 'kokoro-v1.0.onnx');
  add('kokoro model files', fs.existsSync(model), model, 'Download kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx GitHub release "model-files-v1.0" into ~/.filmstudio/models/.', true);
  add('ELEVENLABS_API_KEY', !!process.env.ELEVENLABS_API_KEY, process.env.ELEVENLABS_API_KEY ? 'set (value hidden)' : 'not set', 'Optional. export ELEVENLABS_API_KEY=... to use the paid elevenlabs provider (phase 3).', true);
  add('memory', os.totalmem() > 3.5e9, (os.totalmem() / 1e9).toFixed(1) + ' GB RAM', 'Under 4 GB: run jobs in chunks, expect slow Kokoro (about 40 s per short clip) and slow MP4 export.', true);
  const required = checks.filter(c => !c.optional);
  return { ready: required.every(c => c.ok), checks };
}
module.exports = { doctor };
