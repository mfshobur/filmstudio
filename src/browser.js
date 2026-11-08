'use strict';
const path = require('path');
const fs = require('fs');
// Find playwright-core: normal resolution first, then FILMSTUDIO_PW (colon separated node_modules dirs), then the proot default used on Android.
function loadPlaywright() {
  const tries = [null].concat((process.env.FILMSTUDIO_PW || '').split(':').filter(Boolean), ['/root/shot/node_modules']);
  for (const base of tries) {
    try { return base ? require(path.join(base, 'playwright-core')) : require('playwright-core'); } catch (e) { /* next */ }
  }
  const e = new Error('playwright-core not found. Install it (npm i playwright-core && npx playwright-core install chromium) or set FILMSTUDIO_PW to its node_modules dir.');
  e.code = 'NO_PLAYWRIGHT'; throw e;
}
async function launch() {
  const pw = loadPlaywright();
  const opts = { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] };
  if (process.env.FILMSTUDIO_CHROMIUM) opts.executablePath = process.env.FILMSTUDIO_CHROMIUM;
  if (!process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE && process.platform === 'linux' && fs.existsSync('/root/.cache/ms-playwright')) process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = 'ubuntu24.04-arm64';
  return pw.chromium.launch(opts);
}
module.exports = { launch, loadPlaywright };
