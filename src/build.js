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
  const vals = {
    BPM: spec.bpm || 128,
    BARS: spec.bars || 46,
    END_BAR: spec.endCardBar || (spec.bars || 46) - 1.4,
    TITLE_LINES: JSON.stringify(meta.titleLines || ['The end']),
    TITLE_ACCENT: meta.titleAccent == null ? -1 : meta.titleAccent,
    SCORE: JSON.stringify({ calm: ((spec.score && spec.score.preset) || 'anthem-46') === 'calm-46', transpose: (spec.score && spec.score.transpose) || 0 }),
    SHOTS: JSON.stringify(embedAssets(spec.shots, projectDir)),
    VO_AT: JSON.stringify(narr.map(n => n.at)),
    VO_TXT: JSON.stringify(narr.map(n => n.text)),
    VO_DUR: JSON.stringify(narr.map(n => n.dur || 0)),
    CHARACTERS: JSON.stringify(spec.characters || {}),
    PROMPTS: JSON.stringify(prompts),
    VO: hasVoice ? JSON.stringify(vo.map(v => v || '')) : 'null',
  };
  const htmlVals = {
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
  const js = rd('p1.js') + rd('music.js') + rd('p2.js') + rd('p2b.js') + rd('p2c.js').replace('CHARS_DATA', () => vals.CHARACTERS) + rd('p2d.js') + rd('p2e.js') + rd('p2f.js') + rd('p2g.js') + rd('p2h.js') + fill(rd('p3.template.js'), vals);
  return head + '<script>\n' + js + '\n</script>\n';
}
module.exports = { compile };
