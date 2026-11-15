'use strict';
const path = require('path');
const fs = require('fs');
const ENV = require('./env');
// Find playwright-core: normal resolution first, then FILMSTUDIO_PW (colon separated node_modules dirs), then ~/.filmstudio/node_modules and the proot default used on Android (see env.js).
function loadPlaywright() {
  const tries = [null].concat(ENV.pwDirs());
  for (const base of tries) {
    try { return base ? require(path.join(base, 'playwright-core')) : require('playwright-core'); } catch (e) { /* next */ }
  }
  const e = new Error('playwright-core not found. Install it (npm i playwright-core && npx playwright-core install chromium) or set FILMSTUDIO_PW to its node_modules dir.');
  e.code = 'NO_PLAYWRIGHT'; throw e;
}
async function launch() {
  const pw = loadPlaywright();
  /* The real graphics chip is used on macOS and Windows (several times less CPU, much faster); software GL stays the default on Linux, phones and servers, which may have no GPU. FILMSTUDIO_GPU=1 or 0 overrides. */
  const gpu = process.env.FILMSTUDIO_GPU ? process.env.FILMSTUDIO_GPU === '1' : (process.platform === 'darwin' || process.platform === 'win32');
  const opts = { args: ['--no-sandbox'].concat(gpu ? [] : ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'], ['--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required']) };
  const chrome = ENV.chromiumPath(); if (chrome) opts.executablePath = chrome;
  if (!process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE && process.platform === 'linux' && fs.existsSync('/root/.cache/ms-playwright')) process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'ubuntu24.04-arm64';
  return pw.chromium.launch(opts);
}
module.exports = { launch, loadPlaywright };
