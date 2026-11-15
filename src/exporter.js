'use strict';
// MP4 export: deterministic frames from the real engine (seek by beat) + offline mixed audio, muxed by ffmpeg. Resumable.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { launch } = require('./browser');
const { compile } = require('./build');
const { buildAudio } = require('./audiomix');

/* Parallel frame rendering: one browser per worker. Frames depend only on their beat, so any worker can draw any frame. Small machines (under 6 GB of RAM, e.g. phones) keep one worker. */
function defaultWorkers() {
  /* measured on an 8 core Mac at 1080p: 1 browser 9 fps, 2 browsers 20 fps, 3 or 4 no faster */
  const cores = os.cpus().length, gb = os.totalmem() / 1e9;
  if (gb < 6) return 1;
  return Math.max(1, Math.min(3, Math.floor(cores / 2), Math.floor(gb / 1.5)));
}
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
    const workers = Math.max(1, Math.min(todo.length, Math.round(opts.workers) || defaultWorkers()));
    log('rendering ' + todo.length + ' frames with ' + workers + ' browser' + (workers > 1 ? 's' : ''));
    const queue = todo.slice(); let next = 0, finished = 0, failures = 0, abort = null; const errs = [];
    const worker = async () => {
      let browser = null, page = null;
      const open = async () => {
        browser = await launch(); page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
        await page.goto('file://' + path.resolve(film), { waitUntil: 'load' }); await page.waitForTimeout(1500);
        await page.addStyleTag({ content: '#intro,.hud{display:none!important}*,*::before,*::after{transition:none!important;animation:none!important}' + (opts.noBars ? '.bar{display:none!important}' : '') });
      };
      try {
        while (!abort) {
          const i = queue[next++]; if (i === undefined) break;
          try {
            if (!page) await open();
            const beat = startBeat + (i / fps) / spb;
            /* drawAt draws the frame for this beat synchronously (no waiting for two animation ticks); older builds fall back to setBeat and waiting */
            await page.evaluate(b => { const f = window.__film; if (f.drawAt) { f.drawAt(b); return; } f.setBeat(b); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, beat);
            if (i % 100 === 0) await page.waitForTimeout(100);
            await page.screenshot({ path: frameFile(i), type: 'jpeg', quality: 88 }); finished++;
            if (finished % 25 === 0 || finished === todo.length) log('frames ' + (N - todo.length + finished) + '/' + N);
          } catch (e) {
            queue.push(i);   // another (or this restarted) worker draws it
            failures++; try { if (browser) await browser.close(); } catch (_) { /* dead */ } browser = null; page = null;
            if (failures > 12 + workers * 2) { abort = new Error('browser kept failing while rendering frames: ' + e.message + ' (re-run to resume)'); break; }
            log('browser died, restarting (' + failures + '): ' + String(e.message).split('\n')[0]);
          }
        }
        if (page && !abort) errs.push(...await page.evaluate(() => window.__film.errors()));
      } catch (e) { abort = abort || e; } finally { if (browser) await browser.close().catch(() => {}); }
    };
    await Promise.all(Array.from({ length: workers }, () => worker()));
    if (abort) throw abort;
    if (errs.length) throw new Error('draw errors while exporting: ' + JSON.stringify(errs.slice(0, 3)));
  }
  if (missing().length) throw new Error('some frames are missing; re-run to resume');
  let audio = null;
  if (!opts.noAudio) audio = await buildAudio(spec, dir, { fromBar, toBar, sr: opts.audioRate || 32000, workDir: work, log });
  const out = opts.out || path.join(dir, 'build', 'film.mp4');
  const venc = hasEncoder('libx264') ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(opts.crf || 20), '-preset', 'veryfast'] : ['-c:v', 'mpeg4', '-q:v', '3', '-pix_fmt', 'yuv420p'];
  const args = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(framesDir, '%06d.jpg')].concat(audio ? ['-i', audio.wav] : [], venc, audio ? ['-c:a', 'aac', '-b:a', '160k', '-shortest'] : [], ['-movflags', '+faststart', out]);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + String(r.stderr).slice(0, 400));
  return { out, bytes: fs.statSync(out).size, frames: N, fps, size: w + 'x' + h, seconds: +seconds.toFixed(2), audio: !!audio, narrationClips: audio ? audio.clips : 0, encoder: venc[1] };
}
module.exports = { defaultWorkers, exportFilm };
