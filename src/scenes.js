'use strict';
// Custom scenes: files an agent writes per script beat (scenes/<name>.js), plus rigs/ and looks/. Collected into the film at build,
// linted at validate. A scene is code, so the linter keeps it deterministic (frames must depend only on c.t) and contained (no network, no DOM).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const NAME = /^[a-z0-9][a-z0-9_-]{0,48}$/i;
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
const MAX_SRC = 300 * 1024;
const FORBIDDEN = [
  [/Math\.random\s*\(/, 'Math.random() gives different frames on every run', 'Use c.rand(seed) (a seeded generator) or c.noise(x, y, z).'],
  [/\bDate\.(now|parse)\b|\bnew\s+Date\b|\bperformance\.now\b/, 'wall-clock time makes frames depend on when they are drawn', 'Use c.t (seconds into the shot) or c.tb (beats into the shot).'],
  [/(?<![.\w$])(fetch|XMLHttpRequest|WebSocket|EventSource|importScripts|sendBeacon)\b/, 'network access is not allowed in a scene', 'Put files in the project and use c.asset(\'assets/name.svg\').'],
  [/(?<![.\w$])(document|window|globalThis|localStorage|sessionStorage|indexedDB|navigator)\s*[.\[]/, 'scenes draw only through c (no DOM or global access)', 'Use c.g (the 2D canvas context) and the helpers on c.'],
  [/\beval\s*\(|\bnew\s+Function\b|(^|[^.\w])Function\s*\(/, 'dynamic code is not allowed', 'Write the code directly.'],
  [/\bimport\s*\(|\brequire\s*\(/, 'imports are not available in a scene', 'Everything you need is on c; share parts through rigs/*.js.'],
  [/(?<![.\w$])(setTimeout|setInterval|requestAnimationFrame)\b/, 'timers do not work in a scene (draw runs once per frame)', 'Animate from c.t instead.'],
];

function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

// -> { errors: [{line, message, fix}], warnings: [...] }
function lintSource(src, kind) {
  const errors = [], warnings = [], err = (line, message, fix) => errors.push({ line, message, fix });
  if (typeof src !== 'string') { err(0, 'file is empty or unreadable'); return { errors, warnings }; }
  if (src.length > MAX_SRC) err(0, 'file is ' + Math.round(src.length / 1024) + ' KB (limit ' + MAX_SRC / 1024 + ' KB)', 'Split it into several scenes or rigs.');
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
  try { new vm.Script('(function(scene,rig,look,kit,c){' + src + '\n})', { filename: kind + '.js' }); }
  catch (e) { const m = /:(\d+)/.exec(String(e.stack || '')); err(m ? +m[1] : 0, 'syntax error: ' + e.message, 'Fix the JavaScript syntax on that line.'); return { errors, warnings }; }
  for (const [re, message, fix] of FORBIDDEN) { const m = re.exec(stripped); if (m) err(lineOf(stripped, m.index), message, fix); }
  if (kind === 'scene') {
    if (!/\bscene\s*\(/.test(stripped)) err(0, 'the file never calls scene({ ... })', 'Write: scene({ look: "wayang", draw(c) { ... } });');
    else if (!/\bdraw\b/.test(stripped)) err(0, 'the scene has no draw(c) function', 'Add draw(c) { ... }; it runs every frame.');
    if (/\bwhile\s*\(\s*(true|1)\s*\)|\bfor\s*\(\s*;\s*;\s*\)/.test(stripped)) err(0, 'an endless loop would freeze the film', 'Use a bounded for loop.');
  }
  if (kind === 'rig' && !/\brig\s*\(/.test(stripped)) err(0, 'the file never calls rig("name", { parts: [...] })', 'Write: rig("rabbit", { parts: [ { id: "body", d: "M0 0L10 0L10 10Z" } ] });');
  if (kind === 'lib' && !/\blib\s*\(/.test(stripped)) err(0, 'the file never calls lib("name", { ... })', 'Write: lib("ui", { box(c, x, y, w, h) { c.rrect(x, y, w, h, 8, { fill: "@main" }); } });');
  if (kind === 'look' && !/\blook\s*\(/.test(stripped)) err(0, 'the file never calls look("name", { pal: {...} })', 'Write: look("mylook", { pal: { bg: "#000" }, bg(c) { c.clear(c.pal.bg); } });');
  return { errors, warnings };
}

const scenesDir = dir => path.join(dir, 'scenes');
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return null; } };
function listDir(dir, sub) { try { return fs.readdirSync(path.join(dir, sub)).filter(f => /\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).sort(); } catch (e) { return []; } }

// Everything the film needs: { scenes:{name:{src}}, rigs:{name:src}, looks:{name:src}, data:{assetPath:dataURI} }
function collect(spec, dir) {
  const names = [...new Set((spec.shots || []).filter(s => Array.isArray(s) && s[2] === 'scene').map(s => s[3]))];
  const scenes = {}, rigs = {}, looks = {}, libs = {}, data = {};
  names.forEach(n => { if (NAME.test(n)) { const src = read(path.join(dir, 'scenes', n + '.js')); if (src != null) scenes[n] = { src }; } });
  listDir(dir, 'rigs').forEach(n => { rigs[n] = read(path.join(dir, 'rigs', n + '.js')); });
  listDir(dir, 'looks').forEach(n => { looks[n] = read(path.join(dir, 'looks', n + '.js')); });
  listDir(dir, 'libs').forEach(n => { libs[n] = read(path.join(dir, 'libs', n + '.js')); });
  const all = Object.values(scenes).map(s => s.src).concat(Object.values(rigs), Object.values(looks), Object.values(libs));
  all.forEach(src => { for (const m of String(src).matchAll(/\b(?:asset|image)\s*\(\s*(['"])([^'"]+)\1/g)) {
    const rel = m[2], f = path.resolve(dir, rel), mime = MIME[path.extname(f).toLowerCase()];
    if (!data[rel] && mime && f.startsWith(path.resolve(dir) + path.sep) && fs.existsSync(f)) data[rel] = 'data:' + mime + ';base64,' + fs.readFileSync(f).toString('base64');
  } });
  return { scenes, rigs, looks, libs, data };
}

// Validation of one scene shot: [{path,message,fix}] (empty when fine)
function checkShot(name, dir) {
  const out = [];
  if (!NAME.test(String(name))) { out.push({ message: 'scene name "' + name + '" is not valid', fix: 'Use letters, digits, dash or underscore (max 49), e.g. "rabbit-meets-fox".' }); return out; }
  const f = path.join(dir, 'scenes', name + '.js'), src = read(f);
  if (src == null) { out.push({ message: 'scenes/' + name + '.js does not exist', fix: 'Create it with `filmstudio scene new ' + name + '` and then write the drawing.' }); return out; }
  lintSource(src, 'scene').errors.forEach(e => out.push({ message: 'scenes/' + name + '.js' + (e.line ? ' line ' + e.line : '') + ': ' + e.message, fix: e.fix }));
  for (const m of src.matchAll(/\b(?:asset|image)\s*\(\s*(['"])([^'"]+)\1/g)) if (!fs.existsSync(path.resolve(dir, m[2]))) out.push({ message: 'scenes/' + name + '.js uses ' + m[2] + ', which does not exist', fix: 'Put the file in the project (e.g. assets/) or fix the path.' });
  return out;
}

module.exports = { NAME, lintSource, collect, checkShot, listDir, scenesDir, MIME };
