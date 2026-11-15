'use strict';
// Where the optional tools live, found without environment variables. An env var still wins when it is set.
const fs = require('fs');
const os = require('os');
const path = require('path');
const HOME = path.join(os.homedir(), '.filmstudio');
const exists = p => { try { return fs.existsSync(p); } catch (e) { return false; } };

/* node_modules folders that may hold playwright-core */
function pwDirs() {
  return (process.env.FILMSTUDIO_PW || '').split(':').filter(Boolean).concat([path.join(HOME, 'node_modules'), '/root/shot/node_modules']);
}
/* a Chrome / Chromium / Edge binary, or null (then playwright uses its own download) */
function chromiumPath() {
  if (process.env.FILMSTUDIO_CHROMIUM) return process.env.FILMSTUDIO_CHROMIUM;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
  return c.find(exists) || null;
}
/* python with kokoro-onnx: env var, then ~/.filmstudio/venv, then python3 */
function pythonBin() {
  if (process.env.FILMSTUDIO_PYTHON) return process.env.FILMSTUDIO_PYTHON;
  const v = path.join(HOME, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  return exists(v) ? v : 'python3';
}
module.exports = { HOME, pwDirs, chromiumPath, pythonBin };
