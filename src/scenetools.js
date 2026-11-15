'use strict';
// Tools around custom scenes: scaffold, preview (frames + strip), check (lint + render tests), the look catalog and the shared library.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { NAME, lintSource, listDir } = require('./scenes');

const ROOT = path.join(__dirname, '..');
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return null; } };

/* ---------------- scaffolds ---------------- */
function scaffold(dir, kind, name, opts = {}) {
  if (!NAME.test(String(name))) throw new Error('name "' + name + '" is not valid (letters, digits, dash, underscore; max 49)');
  const sub = kind === 'scene' ? 'scenes' : kind === 'rig' ? 'rigs' : 'looks', f = path.join(dir, sub, name + '.js');
  if (fs.existsSync(f)) throw new Error(f + ' already exists');
  const look = opts.look || 'plain';
  const body = {
    scene: `// scenes/${name}.js: one scene is one beat of the script. Edit draw(c). It must be a pure function of c.t (no Math.random, no Date).
// In the spec:  [startBar, endBar, "scene", "${name}", { }]      Try it:  filmstudio scene preview ${name}
scene({
  look: '${look}',          // palette + background + effects. \`filmstudio look list\` shows them; \`filmstudio guide looks\` explains each.
  setup(c) {
    // optional, runs once: precompute things that never change (rigs, positions from c.rand(seed)). Not for animation.
  },
  draw(c) {
    // c.t   seconds into this shot      c.p  0..1 progress      c.W, c.H  canvas size      c.u  1% of the height
    // c.pal the look's colours          c.pulse  beat pulse 1->0 on every beat      c.speaking  a narration line is playing
    const grow = c.ease.out(c.map(c.t, 0, 1, 0, 1));                        // 0..1 over the first second
    c.circle(c.cx, c.cy, c.u * (10 + 3 * Math.sin(c.t * 3) + 6 * c.pulse) * grow, { fill: c.pal.main });
    c.text(c.type('scenes/${name}.js', 0.3, 14), c.cx, c.H * 0.84, c.u * 4.5, c.pal.ink, 'center', 'serif');
  }
});
`,
    rig: `// rigs/${name}.js: a puppet. Parts are drawn in rest-pose coordinates and rotate about their own pivot; children follow their parent.
// Use it in a scene:  c.rig('${name}').pose({ arm: -30 }).draw(x, y, scale, flip)
rig('${name}', {
  origin: [0, 0],                         // where draw(x, y) puts the puppet (here: the feet)
  parts: [
    { id: 'body', d: 'M-25 0 L-30 -110 Q-30 -150 0 -165 Q30 -150 30 -110 L25 0 Z',
      holes: [kit.holes.diamonds(-18, -140, 36, 80, 4, 3)] },                 // holes are cut out (evenodd), so the lamp shows through
    { id: 'arm', parent: 'body', pivot: [20, -140], d: 'M18 -142 L26 -140 L66 -104 L60 -96 L20 -128 Z' },
  ],
  pose: { arm: 0 },
});
`,
    look: `// looks/${name}.js: a style guide in code (palette, background, effects). Use it with scene({ look: '${name}' }).
look('${name}', {
  desc: 'One sentence: what this look is and when to use it.',
  bright: 0,                               // 1 if the background is light (the player dims overlays on dark ones)
  pal: { bg: '#10131f', ink: '#f3ead9', main: '#ffae5c', accent: '#86e6ff', soft: '#9aa4c7' },
  fx: [{ n: 'vignette', a: 0.4 }],         // vignette, scan, flicker, tint (more with: filmstudio guide scenes)
  bg(c) { c.clear(c.pal.bg); },            // painted before every scene that uses this look
});
`,
  }[kind];
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body);
  return f;
}

/* ---------------- headless rendering of one scene ---------------- */
function previewSpec(name, beats, params) {
  const bars = Math.max(8, Math.ceil(beats / 4) + 1);
  return { version: 1, meta: { title: 'scene: ' + name }, bpm: 128, bars, endCardBar: bars + 10, score: { preset: 'anthem-46' }, shots: [[1, 1 + beats / 4, 'scene', name, params || {}]], narration: [], prompts: [] };
}
async function withPage(dir, name, opts, fn) {
  const { compile } = require('./build'), { launch } = require('./browser');
  const beats = opts.beats || 8, spec = previewSpec(name, beats, opts.params), html = compile(spec, dir);
  const out = path.join(dir, 'build', 'scenes', name); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, 'preview.html'); fs.writeFileSync(file, html);
  const b = await launch(), errors = [];
  try {
    const p = await b.newPage({ viewport: { width: opts.width || 640, height: opts.height || 360 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await p.goto('file://' + path.resolve(file), { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.addStyleTag({ content: '#intro{display:none!important}' });
    return await fn(p, out, errors, beats);
  } finally { await b.close().catch(() => {}); }
}
const sampleBeats = (beats, n) => Array.from({ length: n }, (_, i) => +(beats * (n === 1 ? .5 : (i + 0.15) / (n - 0.7))).toFixed(2));

async function preview(dir, name, opts = {}) {
  const beats = opts.beats || 8, times = opts.frames || sampleBeats(beats, 5);
  return withPage(dir, name, Object.assign({}, opts, { beats }), async (p, out, errors) => {
    const files = [];
    for (const t of times) { await p.evaluate(x => window.__film.seek(x), t); await p.waitForTimeout(opts.settle || 450); const f = path.join(out, 'frame-' + String(files.length + 1).padStart(2, '0') + '.png'); await p.screenshot({ path: f }); files.push(f); }
    const drawErrors = await p.evaluate(() => window.__film.errors());
    let strip = null;
    if (files.length && spawnSync('ffmpeg', ['-version']).status === 0) {
      const list = path.join(out, 'list.txt'); fs.writeFileSync(list, files.map(f => "file '" + path.resolve(f) + "'\nduration 1").join('\n') + "\nfile '" + path.resolve(files[files.length - 1]) + "'\n");
      const sp = path.join(out, 'strip.png'), cols = Math.min(files.length, 3), rows = Math.ceil(files.length / cols);
      const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=' + Math.floor(1500 / cols) + ':-1,tile=' + cols + 'x' + rows, '-frames:v', '1', sp]);
      if (r.status === 0) strip = sp; fs.rmSync(list, { force: true });
    }
    return { ok: !errors.length && !drawErrors.length, scene: name, beats, at: times, frames: files, strip, drawErrors: dedupe(drawErrors), pageErrors: errors, hint: strip ? 'Look at ' + strip + ' (frames at beats ' + times.join(', ') + ').' : 'Look at the frames.' };
  });
}
const dedupe = a => { const seen = new Set(); return a.filter(e => { const k = e.message; if (seen.has(k)) return false; seen.add(k); return true; }); };

/* lint + render tests: errors, blank frames, a scene that never moves, frames that differ between two draws of the same time, and speed */
async function check(dir, name, opts = {}) {
  const f = path.join(dir, 'scenes', name + '.js'), src = read(f), errors = [], warnings = [];
  if (src == null) return { ok: false, scene: name, errors: [{ message: 'scenes/' + name + '.js does not exist', fix: 'filmstudio scene new ' + name }], warnings };
  const lint = lintSource(src, 'scene'); lint.errors.forEach(e => errors.push({ message: (e.line ? 'line ' + e.line + ': ' : '') + e.message, fix: e.fix }));
  if (errors.length) return { ok: false, scene: name, errors, warnings };
  const beats = opts.beats || 8, times = sampleBeats(beats, 7);
  return withPage(dir, name, Object.assign({}, opts, { beats, width: opts.width || 480, height: opts.height || 270 }), async (p, out, pageErrors) => {
    const grabs = [];
    await p.evaluate(() => window.__film.resetMs());
    for (const t of times) { await p.evaluate(x => window.__film.seek(x), t); await p.waitForTimeout(260); grabs.push(await p.evaluate(() => window.__film.grabN(96, 54))); }
    const ms = await p.evaluate(() => window.__film.sceneMs());
    // determinism: the same time drawn twice, with other times in between
    await p.evaluate(x => window.__film.seek(x), times[2]); await p.waitForTimeout(260); const a = await p.evaluate(() => window.__film.grabN(96, 54));
    await p.evaluate(x => window.__film.seek(x), times[5]); await p.waitForTimeout(200);
    await p.evaluate(x => window.__film.seek(x), times[2]); await p.waitForTimeout(260); const b = await p.evaluate(() => window.__film.grabN(96, 54));
    let dd = 0; for (let i = 0; i < a.length; i++) dd = Math.max(dd, Math.abs(a[i] - b[i]));
    const stat = g => { let m = 0, s = 0; const n = g.length / 3; for (let i = 0; i < g.length; i += 3) m += (g[i] + g[i + 1] + g[i + 2]) / 3; m /= n; for (let i = 0; i < g.length; i += 3) s += Math.pow((g[i] + g[i + 1] + g[i + 2]) / 3 - m, 2); return { mean: m, std: Math.sqrt(s / n) }; };
    const st = grabs.map(stat);
    let maxDiff = 0; for (let k = 2; k < grabs.length; k++) /* skip the player's own flash at the start of a shot */ { let d = 0; for (let i = 0; i < grabs[k].length; i++) d += Math.abs(grabs[k][i] - grabs[k - 1][i]); maxDiff = Math.max(maxDiff, d / (grabs[k].length * 255)); }
    const drawErrors = dedupe(await p.evaluate(() => window.__film.errors()));
    drawErrors.forEach(e => errors.push({ message: 'draw error: ' + e.message, fix: 'Fix the line in scenes/' + name + '.js; `filmstudio scene preview` shows the frame.' }));
    pageErrors.forEach(m => errors.push({ message: 'page error: ' + m }));
    if (!drawErrors.length) {
      if (st.every(x => x.std < 3)) errors.push({ message: 'every sampled frame is blank or one flat colour', fix: 'Draw something (c.circle, c.rig(...).draw, c.text) and check coordinates: the canvas is c.W by c.H, origin top-left.' });
      if (dd > 3) errors.push({ message: 'the same time draws differently twice (difference ' + dd + '/255)', fix: 'draw() must depend only on c.t. Remove Math.random/Date and any state you change inside draw; use c.rand(seed) in setup.' });
      if (maxDiff < 0.0008 && st.some(x => x.std >= 3)) warnings.push({ message: 'the scene does not move across the shot', fix: 'Animate something from c.t (position, rotation, glow) so the shot has life; a still image can use the image style instead.' });
      if (ms.avg > 50) errors.push({ message: 'a frame takes ' + ms.avg.toFixed(0) + ' ms to draw (limit 50)', fix: 'Draw fewer objects per frame or precompute in setup(); cache Path2D with c.path(d).' });
      else if (ms.avg > 18) warnings.push({ message: 'a frame takes ' + ms.avg.toFixed(0) + ' ms to draw (a smooth 60 fps film needs under ~16)', fix: 'Reduce per-frame work; MP4 export is fine but live playback may stutter.' });
    }
    return { ok: !errors.length, scene: name, errors, warnings, stats: { sampledFrames: grabs.length, avgDrawMs: +ms.avg.toFixed(1), maxDrawMs: +ms.max.toFixed(1), motion: +maxDiff.toFixed(4), determinismDiff: dd }, note: 'Automatic checks only: they cannot judge whether it looks good. Run `filmstudio scene preview ' + name + '` and look at the strip.' };
  });
}

/* ---------------- looks ---------------- */
function parseLooks(src) {
  const out = {}, stub = (n, o) => { out[n] = { name: n, desc: o.desc || '', bright: !!o.bright, pal: o.pal || {}, fx: (o.fx || []).map(x => typeof x === 'string' ? x : x.n), fps: o.fps || null, pixelate: o.pixelate || null, guide: o.guide || null, family: o.family || null }; return o; };
  try { new Function('scLook', 'look', src)(stub, stub); } catch (e) { out.__error = e.message; }
  return out;
}
function lookCatalog(dir) {
  const cat = parseLooks(read(path.join(ROOT, 'engine', 'plooks.js')) || ''); Object.values(cat).forEach(l => { if (l && typeof l === 'object') l.source = 'built-in'; });
  if (dir) listDir(dir, 'looks').forEach(n => { const l = parseLooks(read(path.join(dir, 'looks', n + '.js')) || ''); Object.values(l).forEach(x => { if (x && x.name) { x.source = 'project looks/' + n + '.js'; cat[x.name] = x; } }); });
  delete cat.__error; return cat;
}

/* ---------------- shared library (~/.filmstudio/library/<kind>/<name>/index.js + assets) ---------------- */
const KINDS = { scene: 'scenes', rig: 'rigs', look: 'looks' };
const libRoot = () => process.env.FILMSTUDIO_LIBRARY ? path.resolve(process.env.FILMSTUDIO_LIBRARY) : path.join(os.homedir(), '.filmstudio', 'library');
function libList(kind) {
  const out = [], kinds = kind ? [kind] : Object.keys(KINDS);
  for (const k of kinds) { const d = path.join(libRoot(), k); try { fs.readdirSync(d).filter(n => fs.existsSync(path.join(d, n, 'index.js'))).forEach(n => out.push({ kind: k, name: n })); } catch (e) { /* none yet */ } }
  return out;
}
function assetRefs(src) { const o = []; for (const m of String(src).matchAll(/\b(?:asset|image)\s*\(\s*(['"])([^'"]+)\1/g)) o.push(m[2]); return o; }
function libSave(dir, kind, name) {
  if (!KINDS[kind]) throw new Error('kind must be scene, rig or look'); if (!NAME.test(name)) throw new Error('bad name');
  const f = path.join(dir, KINDS[kind], name + '.js'), src = read(f); if (src == null) throw new Error(f + ' does not exist');
  const lint = lintSource(src, kind); if (lint.errors.length) throw new Error('lint errors: ' + lint.errors.map(e => e.message).join('; '));
  const d = path.join(libRoot(), kind, name); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.js'), src);
  const assets = [];
  for (const rel of assetRefs(src)) { const from = path.resolve(dir, rel); if (from.startsWith(path.resolve(dir) + path.sep) && fs.existsSync(from)) { const to = path.join(d, 'assets', rel); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); assets.push(rel); } }
  return { saved: d, assets };
}
function libUse(dir, kind, name, opts = {}) {
  if (!KINDS[kind]) throw new Error('kind must be scene, rig or look'); const d = path.join(libRoot(), kind, name), src = read(path.join(d, 'index.js'));
  if (src == null) throw new Error('library has no ' + kind + ' "' + name + '" (see `filmstudio library list`)');
  const f = path.join(dir, KINDS[kind], (opts.as || name) + '.js'); if (fs.existsSync(f) && !opts.force) throw new Error(f + ' already exists (use --force or --as <new name>)');
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, src);
  const copied = [], skipped = [];
  for (const rel of assetRefs(src)) { const from = path.join(d, 'assets', rel), to = path.resolve(dir, rel); if (!fs.existsSync(from)) continue; if (fs.existsSync(to)) { skipped.push(rel); continue; } fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); copied.push(rel); }
  return { wrote: f, assetsCopied: copied, assetsAlreadyThere: skipped };
}

module.exports = { scaffold, preview, check, lookCatalog, parseLooks, libList, libSave, libUse, libRoot, sampleBeats };
