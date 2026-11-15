'use strict';
// A workspace is one folder holding many film projects (each a subfolder with spec.json).
// Shared by `filmstudio list`, the MCP `filmstudio_list` tool and the studio's project picker.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const CLI = path.join(__dirname, '..', 'bin', 'filmstudio.js');
const NAME = /^[A-Za-z0-9][\w.-]{0,63}$/;

const defaultRoot = () => path.join(os.homedir(), 'filmstudio-projects');
/* precedence: explicit flag, then FILMSTUDIO_ROOT, then ~/filmstudio-projects. Never creates the folder. */
const resolveRoot = flag => path.resolve(flag ? String(flag) : (process.env.FILMSTUDIO_ROOT || defaultRoot()));
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } };
const inside = (base, p) => { const r = path.relative(base, p); return r !== '' && !r.startsWith('..') && !path.isAbsolute(r); };

/* A project name is one safe path segment. Returns the real folder, or null if the name is bad, missing,
   not a project (no spec.json), or a symlink that points outside the workspace. */
function projectDir(root, name) {
  if (typeof name !== 'string' || !NAME.test(name)) return null;
  let rr, d;
  try { rr = fs.realpathSync(root); d = fs.realpathSync(path.join(rr, name)); } catch (e) { return null; }
  if (!inside(rr, d) || !fs.existsSync(path.join(d, 'spec.json'))) return null;
  return d;
}

function summarize(root, name) {
  const d = projectDir(root, name); if (!d) return null;
  const spec = readJson(path.join(d, 'spec.json'), null), brief = readJson(path.join(d, 'brief.json'), {});
  const st = p => { try { return fs.statSync(path.join(d, p)); } catch (e) { return null; } };
  const film = st('build/film.html'), sp = st('spec.json');
  let sheet = null; try { sheet = fs.readdirSync(path.join(d, 'build', 'review')).filter(f => /^sheet\d*\.png$/.test(f)).sort()[0] || null; } catch (e) { /* no review yet */ }
  const bars = spec && spec.bars, bpm = spec && spec.bpm;
  return {
    name, title: (spec && spec.meta && spec.meta.title) || brief.title || name, validJson: !!spec,
    bars: bars || null, bpm: bpm || null, seconds: bars && bpm ? Math.round(bars * 2400 / bpm) / 10 : null,
    format: (spec && spec.format) || '16:9', shots: spec && Array.isArray(spec.shots) ? spec.shots.length : 0,
    updated: sp ? sp.mtime.toISOString() : null, built: film ? film.mtime.toISOString() : null,
    stale: !!(film && sp && sp.mtimeMs > film.mtimeMs), hasMp4: !!st('build/film.mp4'), thumb: sheet ? 'review/' + sheet : null,
  };
}

function listProjects(root) {
  let names; try { names = fs.readdirSync(root); } catch (e) { return []; }
  const last = p => Math.max(Date.parse(p.updated) || 0, Date.parse(p.built) || 0);
  return names.filter(n => NAME.test(n)).map(n => summarize(root, n)).filter(Boolean).sort((a, b) => last(b) - last(a) || a.name.localeCompare(b.name));
}

/* Create a starter project by running `filmstudio new` (one scaffold implementation). Creates the workspace on first use. */
function createProject(root, o) {
  o = o || {};
  if (typeof o.name !== 'string' || !NAME.test(o.name)) return { code: 400, error: 'name must be 1 to 64 letters, digits, dot, dash or underscore, and start with a letter or digit' };
  const target = path.join(root, o.name);
  if (fs.existsSync(target)) return { code: 409, error: 'a project named "' + o.name + '" already exists' };
  const args = [CLI, 'new', target];
  if (o.length != null && o.length !== '') { const n = Number(o.length); if (!(n >= 10 && n <= 600)) return { code: 400, error: 'length must be 10 to 600 seconds' }; args.push('--length', String(n)); }
  for (const k of ['format', 'preset']) if (o[k]) { if (!/^[\w:.-]{1,20}$/.test(String(o[k]))) return { code: 400, error: 'bad ' + k }; args.push('--' + k, String(o[k])); }
  fs.mkdirSync(root, { recursive: true });
  try { return { code: 200, result: JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) }; }
  catch (e) { let msg = String(e.message); try { msg = JSON.parse(e.stdout).error || msg; } catch (x) { /* keep message */ } return { code: 400, error: msg }; }
}

module.exports = { resolveRoot, defaultRoot, projectDir, summarize, listProjects, createProject, NAME };
