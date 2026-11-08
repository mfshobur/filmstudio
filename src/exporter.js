'use strict';
// MP4 export: deterministic frames from the real engine (seek by beat) + offline mixed audio, muxed by ffmpeg. Resumable.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { launch } = require('./browser');
const { compile } = require('./build');
const { buildAudio } = require('./audiomix');

function hasEncoder(name) { const r = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' }); return r.status === 0 && new RegExp('\\b' + name + '\\b').test(r.stdout); }

async function exportFilm(dir, spec, opts = {}) {
  const log = opts.log || (() => {});
  if (spawnSync('ffmpeg', ['-version']).status !== 0) throw new Error('ffmpeg is required for export. Install it (apt/brew/pkg install ffmpeg).');
  const fps = opts.fps || 12, bpm = spec.bpm || 128, spb = 60 / bpm, bars = spec.bars;
  const fromBar = opts.fromBar || 1, toBar = opts.toBar || bars + 1;
  if (!(toBar > fromBar)) throw new Error('--to-bar must be greater than --from-bar');
  let [w, h] = opts.size || [640, 360]; w -= w % 2; h -= h % 2;
  const seconds = (toBar - fromBar) * 4 * spb, N = Math.ceil(seconds * fps), startBeat = (fromBar - 1) * 4;
  const work = path.join(dir, 'build', 'export'), framesDir = path.join(work, 'frames'); fs.mkdirSync(framesDir, { recursive: true });
  const html = compile(spec, dir), film = path.join(dir, 'build', 'film.html'); fs.mkdirSync(path.dirname(film), { recursive: true }); fs.writeFileSync(film, html);
  const sig = JSON.stringify({ w, h, fps, fromBar, toBar, html: html.length }); const sigFile = path.join(work, 'frames.sig');
  if (!fs.existsSync(sigFile) || fs.readFileSync(sigFile, 'utf8') !== sig) { fs.rmSync(framesDir, { recursive: true, force: true }); fs.mkdirSync(framesDir, { recursive: true }); fs.writeFileSync(sigFile, sig); }
  const frameFile = i => path.join(framesDir, String(i + 1).padStart(6, '0') + '.jpg');
  const missing = () => { const m = []; for (let i = 0; i < N; i++) if (!fs.existsSync(frameFile(i))) m.push(i); return m; };
  let todo = missing();
  if (todo.length) {
    let browser = null, page = null, failures = 0;
    const open = async () => {
      browser = await launch(); page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await page.goto('file://' + path.resolve(film), { waitUntil: 'load' }); await page.waitForTimeout(1500);
      await page.addStyleTag({ content: '#intro,.hud{display:none!important}*,*::before,*::after{transition:none!important;animation:none!important}' + (opts.noBars ? '.bar{display:none!important}' : '') });
    };
    try {
      for (let k = 0; k < todo.length;) {
        try {
          if (!page) await open();
          const i = todo[k], beat = startBeat + (i / fps) / spb;
          await page.evaluate(b => { window.__film.setBeat(b); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, beat);
          if (i % 25 === 0) await page.waitForTimeout(200);
          await page.screenshot({ path: frameFile(i), type: 'jpeg', quality: 88 }); k++;
          if (k % 25 === 0 || k === todo.length) log('frames ' + (N - todo.length + k) + '/' + N);
        } catch (e) {
          failures++; try { if (browser) await browser.close(); } catch (_) { /* dead */ } browser = null; page = null;
          if (failures > 12) throw new Error('browser kept failing while rendering frames: ' + e.message + ' (re-run to resume)');
          log('browser died, restarting (' + failures + '): ' + String(e.message).split('\n')[0]);
        }
      }
      const errs = page ? await page.evaluate(() => window.__film.errors()) : [];
      if (errs.length) throw new Error('draw errors while exporting: ' + JSON.stringify(errs.slice(0, 3)));
    } finally { if (browser) await browser.close().catch(() => {}); }
  }
  if (missing().length) throw new Error('some frames are missing; re-run to resume');
  let audio = null;
  if (!opts.noAudio) audio = await buildAudio(spec, dir, { fromBar, toBar, sr: opts.audioRate || 32000, workDir: work, log });
  const out = opts.out || path.join(dir, 'build', 'film.mp4');
  const venc = hasEncoder('libx264') ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'veryfast'] : ['-c:v', 'mpeg4', '-q:v', '3', '-pix_fmt', 'yuv420p'];
  const args = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(framesDir, '%06d.jpg')].concat(audio ? ['-i', audio.wav] : [], venc, audio ? ['-c:a', 'aac', '-b:a', '160k', '-shortest'] : [], ['-movflags', '+faststart', out]);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + String(r.stderr).slice(0, 400));
  return { out, bytes: fs.statSync(out).size, frames: N, fps, size: w + 'x' + h, seconds: +seconds.toFixed(2), audio: !!audio, narrationClips: audio ? audio.clips : 0, encoder: venc[1] };
}
module.exports = { exportFilm };
