'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { launch } = require('./browser');

// Screenshot one frame per distinct (style,variant), at 55% through its first shot, then tile contact sheets.
async function review(dir, spec, opts = {}) {
  const film = path.join(dir, 'build', 'film.html');
  if (!fs.existsSync(film)) throw new Error('build/film.html missing. Run `filmstudio build` first.');
  const out = path.join(dir, 'build', 'review'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const seen = new Set(), targets = [];
  if (opts.beats) opts.beats.forEach(b => targets.push({ beat: b, name: 'beat-' + b }));
  else spec.shots.forEach((s, idx) => { const k = s[2] === 'stage' ? 'stage-' + (idx + 1) : s[2] + '-' + s[3]; if (seen.has(k)) return; seen.add(k); targets.push({ beat: (s[0] - 1) * 4 + (s[1] - s[0]) * 4 * 0.55, name: k }); });
  const w = opts.width || 640, h = opts.height || 360;
  const b = await launch(); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('file://' + path.resolve(film), { waitUntil: 'load' }); await p.waitForTimeout(2000);
    await p.addStyleTag({ content: '#intro{display:none!important}' });
    let i = 0; const files = [];
    for (const t of targets) {
      await p.evaluate(x => window.__film.seek(x), t.beat); await p.waitForTimeout(opts.settle || 900);
      const f = path.join(out, String(++i).padStart(2, '0') + '_' + t.name + '.png'); await p.screenshot({ path: f }); files.push(f);
    }
    const sheets = [];
    if (!opts.noSheets && files.length && spawnSync('ffmpeg', ['-version']).status === 0) {
      for (let s = 0; s * 16 < files.length; s++) {
        const chunk = files.slice(s * 16, s * 16 + 16), list = path.join(out, 'list' + s + '.txt');
        const abs = chunk.map(f => path.resolve(f));
        fs.writeFileSync(list, abs.map(f => "file '" + f + "'\nduration 1").join('\n') + "\nfile '" + abs[abs.length - 1] + "'\n");
        const sheet = path.resolve(out, 'sheet' + (s + 1) + '.png');
        const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=480:-1,tile=4x4', '-frames:v', '1', sheet]);
        if (r.status === 0) sheets.push(sheet); fs.rmSync(list, { force: true });
      }
    }
    return { frames: files, sheets, pageErrors: errors };
  } finally { await b.close().catch(() => {}); }
}
module.exports = { review };
