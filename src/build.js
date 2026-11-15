'use strict';
// Assembles a self-contained film.html from a project's spec.json + engine sources + narration files.
const fs = require('fs');
const path = require('path');
const ENGINE = path.join(__dirname, '..', 'engine');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bb = bar => (bar - 1) * 4;

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
// Images referenced by `image` shots are embedded as data URIs so the film stays one self-contained file.
function embedAssets(shots, dir) {
  return shots.map(s => {
    if (s[2] !== 'image' || !s[4] || !s[4].src) return s;
    const f = path.resolve(dir, s[4].src), mime = MIME[path.extname(f).toLowerCase()];
    if (!mime || !fs.existsSync(f)) return s;
    const p = Object.assign({}, s[4], { data: 'data:' + mime + ';base64,' + fs.readFileSync(f).toString('base64') });
    return [s[0], s[1], s[2], s[3], p];
  });
}
function compile(spec, projectDir) {
  const meta = spec.meta || {};
  const narr = spec.narration || [];
  const vo = narr.map(n => {
    if (!n.file) return null;
    const f = path.resolve(projectDir, n.file);
    return fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : null;
  });
  const hasVoice = vo.some(Boolean);
  const prompts = (spec.prompts || []).map(p => [bb(p.bar) + (p.beat || 0), p.hide ? null : (p.text || ''), p.big ? 1 : 0]);
  const sc = require('./scenes').collect(spec, projectDir);
  const vals = {
    SCENES: JSON.stringify(sc.scenes), SCDATA: JSON.stringify(sc.data), RIGS: JSON.stringify(sc.rigs), LOOKS: JSON.stringify(sc.looks), LIBS: JSON.stringify(sc.libs),
    BPM: spec.bpm || 128,
    BARS: spec.bars || 46,
    END_BAR: spec.endCardBar || (spec.bars || 46) - 1.4,
    TITLE_LINES: JSON.stringify(meta.titleLines || ['The end']),
    TITLE_ACCENT: meta.titleAccent == null ? -1 : meta.titleAccent,
    SCORE: JSON.stringify({ calm: ((spec.score && spec.score.preset) || 'anthem-46') === 'calm-46', transpose: (spec.score && spec.score.transpose) || 0, bars: spec.bars || 46, ...(spec.score && spec.score.parts ? { parts: spec.score.parts } : {}) }),
    SHOTS: JSON.stringify(embedAssets(spec.shots, projectDir)),
    VO_AT: JSON.stringify(narr.map(n => n.at)),
    VO_TXT: JSON.stringify(narr.map(n => n.text)),
    VO_DUR: JSON.stringify(narr.map(n => n.dur || 0)),
    CHARACTERS: JSON.stringify(spec.characters || {}),
    PROMPTS: JSON.stringify(prompts),
    VO: hasVoice ? JSON.stringify(vo.map(v => v || '')) : 'null',
  };
  /* spec.finish: the film-wide finish layers. Films that draw their own scenes default to a CLEAN finish (crisp text, almost no grain, a faint glow, light vignette); films made of built-in styles keep the CINEMATIC finish they were designed with (moving grain, strong bloom and light streaks).
     "finish": { "preset": "clean" | "cinematic", "grain": 0..2, "bloom": 0..2, "streak": 0..2, "vignette": 0..2, "cuts": 0..2 }  (the numbers multiply the preset; 0 turns a layer off; cuts = the zoom punch, glitch slices and white flash at every shot start: off in clean, plain hard cuts) */
  const fin = spec.finish || {}, hasScene = (spec.shots || []).some(sh => sh[2] === 'scene');
  const FIN_BASE = { clean: { grain: 0.02, bloom: 0, streak: 0, vignette: 0.1, page: 0, cuts: 0 }, cinematic: { grain: 0.07, bloom: 0.6, streak: 0.22, vignette: 1, page: 1, cuts: 1 } };   /* page = the page-wide edge-darkening overlay (.vig); vignette = the looks' own vignettes */
  const finBase = FIN_BASE[fin.preset] || FIN_BASE[hasScene ? 'clean' : 'cinematic'];
  const fx = k => +(finBase[k] * Math.max(0, Math.min(2, typeof fin[k] === 'number' ? fin[k] : 1))).toFixed(3);
  vals.VIGNETTE = fx('vignette'); vals.CUTS = fx('cuts'); vals.BLOOMK = +(fx('bloom') / 0.6).toFixed(4); vals.STREAKK = +(fx('streak') / 0.22).toFixed(4);   /* the engine sets the bloom and streak opacity from JS at every shot start; these scale its values */
  const htmlVals = {
    GRAIN: fx('grain'), BLOOM: fx('bloom'), STREAK: fx('streak'), VIGPAGE: fx('page'),
    TITLE: esc(meta.title || 'Untitled film'),
    EYEBROW: esc(meta.eyebrow || 'A short film'),
    LEDE: esc(meta.lede || ''),
    FINE: esc(meta.fine || 'Plays with music and narration. Headphones recommended.'),
    END_TITLE: esc(meta.endTitle || meta.title || ''),
    END_LEDE: esc(meta.endLede || ''),
  };
  const fill = (tpl, map) => tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in map)) throw new Error('template placeholder not provided: ' + k);
    return map[k];
  });
  const rd = f => fs.readFileSync(path.join(ENGINE, f), 'utf8');
  const head = fill(rd('head.template.html'), htmlVals);
  const js = rd('p1.js') + rd('music.js') + rd('p2.js') + rd('p2b.js') + rd('p2c.js').replace('CHARS_DATA', () => vals.CHARACTERS) + rd('p2d.js') + rd('p2e.js') + rd('p2f.js') + rd('p2g.js') + rd('p2h.js') + rd('pscene.js') + rd('plooks.js') + fill(rd('p3.template.js'), vals);
  return head + '<script>\n' + js + '\n</script>\n';
}
module.exports = { compile };
