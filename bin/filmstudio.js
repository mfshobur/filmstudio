#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { compile } = require('../src/build');
const { validate } = require('../src/validate');
const { STYLES } = require('../src/registry');

function parse(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2), nx = argv[i + 1]; if (nx !== undefined && !nx.startsWith('--')) { flags[k] = nx; i++; } else flags[k] = true; }
    else pos.push(a);
  }
  return { pos, flags };
}
const out = o => console.log(JSON.stringify(o, null, 2));
const fail = (msg, extra) => { out(Object.assign({ ok: false, error: msg }, extra || {})); process.exit(1); };
const readSpec = dir => { const f = path.join(dir, 'spec.json'); if (!fs.existsSync(f)) fail('spec.json not found in ' + path.resolve(dir), { fix: 'Run `filmstudio new <dir>` first, or cd into a project folder.' }); try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail('spec.json is not valid JSON: ' + e.message); } };
const HELP = `filmstudio <command> [project-dir] [options]   (all output is JSON)
  new <dir> [--example the-only-limit]   create a project folder
  validate [dir]                         check spec.json, with fix hints
  voice [dir] [--provider kokoro|file] [--force]   generate or import narration, measure durations
  build [dir]                            write build/film.html
  review [dir] [--beats 10,20]           screenshot every style variant + contact sheets
  audio-check [dir]                      render the score offline; report loudness, clipping, dynamics
  doctor [--deep]                        check this machine
  styles                                 list shot styles and variants
  guide [topic]                          print the agent guide (no topic = list topics)`;

(async () => {
  const { pos, flags } = parse(process.argv.slice(2));
  const cmd = pos[0], dir = pos[1] || '.';
  try {
    if (!cmd || cmd === 'help' || flags.help) return console.log(HELP);
    if (cmd === 'styles') return out(Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, { variants: v.variants, use: v.use }])));
    if (cmd === 'guide') {
      const gdir = path.join(ROOT, 'docs', 'agent-guide'), topics = fs.readdirSync(gdir).filter(f => f.endsWith('.md')).sort();
      if (!pos[1]) return out({ topics: topics.map(f => f.replace(/\.md$/, '')), hint: 'Run `filmstudio guide <topic>`, or `guide all` for everything.' });
      const want = pos[1] === 'all' ? topics : topics.filter(f => f.replace(/\.md$/, '').replace(/^\d+-/, '') === pos[1] || f.replace(/\.md$/, '') === pos[1]);
      if (!want.length) fail('no guide topic "' + pos[1] + '"', { topics: topics.map(f => f.replace(/\.md$/, '')) });
      return console.log(want.map(f => fs.readFileSync(path.join(gdir, f), 'utf8')).join('\n\n---\n\n'));
    }
    if (cmd === 'doctor') return out(await require('../src/doctor').doctor({ deep: !!flags.deep }));
    if (cmd === 'new') {
      const target = path.resolve(pos[1] || 'my-film'); if (fs.existsSync(target) && fs.readdirSync(target).length) fail('folder not empty: ' + target);
      fs.mkdirSync(target, { recursive: true });
      if (flags.example) { const ex = path.join(ROOT, 'examples', String(flags.example)); if (!fs.existsSync(ex)) fail('no such example', { examples: fs.readdirSync(path.join(ROOT, 'examples')) }); fs.cpSync(ex, target, { recursive: true, filter: s => !s.includes(path.sep + 'build') }); }
      else {
        fs.mkdirSync(path.join(target, 'voice'), { recursive: true });
        fs.writeFileSync(path.join(target, 'brief.json'), JSON.stringify({ title: '', idea: '', audience: '', length: '60 seconds', tone: [], avoid: [], styles: [], music: { mood: '' }, voice: { provider: 'kokoro', voice: 'bf_emma', pace: 'calm' } }, null, 1));
      }
      return out({ ok: true, created: target, next: flags.example ? 'cd there, then `filmstudio validate`, `filmstudio build`.' : 'Fill brief.json (or tell your agent the idea), then read `filmstudio guide quick-start`.' });
    }
    const spec = readSpec(dir);
    if (cmd === 'validate') { const r = validate(spec, dir); out(r); return process.exit(r.ok ? 0 : 1); }
    if (cmd === 'build') {
      const v = validate(spec, dir); if (!v.ok) fail('spec has errors; fix them first', { errors: v.errors });
      const html = compile(spec, dir), o = path.join(dir, 'build', 'film.html'); fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, html);
      return out({ ok: true, out: path.resolve(o), bytes: html.length, warnings: v.warnings, hasVoice: html.includes('var VO=[') });
    }
    if (cmd === 'voice') {
      const r = await require('../src/voice').voice(dir, spec, { provider: flags.provider, force: !!flags.force, log: m => console.error(m) });
      return out(Object.assign({ ok: r.missing.length === 0 }, r));
    }
    if (cmd === 'review') {
      const r = await require('../src/review').review(dir, spec, { beats: flags.beats ? String(flags.beats).split(',').map(Number) : null });
      return out(Object.assign({ ok: r.pageErrors.length === 0, hint: 'Open build/review/sheet1.png and look for washed-out exposure, cropped labels, overflowing shapes. See `filmstudio guide review`.' }, r));
    }
    if (cmd === 'audio-check') {
      const r = await require('../src/audiocheck').audioCheck(dir, spec, { progress: (a, b) => console.error('rendered bar ' + a + '/' + b) });
      return out(r);
    }
    fail('unknown command "' + cmd + '"', { help: HELP });
  } catch (e) { fail(e.message, { code: e.code }); }
})();
