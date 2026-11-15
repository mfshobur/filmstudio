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
  new <dir> [--example name] [--length 60 [--bpm 128]] [--preset calm-46] [--format 9:16]   create a project (length in seconds sets bars; tempo is independent)
  validate [dir]                         check spec.json, with fix hints
  voice [dir] [--provider kokoro|elevenlabs|file] [--force] [--yes]   generate or import narration (elevenlabs is paid: needs --yes)
  export [dir] [--quality fhd|hd|4k|draft] [--fps 24] [--size 1920x1080] [--crf 18] [--from-bar 1 --to-bar 47] [--no-audio] [--no-bars]   render build/film.mp4 (default Full HD 1080p, 24 fps; slow, resumable)
  listen [dir] [--lines 0,3] [--setup]   read the narration back with speech recognition and compare it with the script (--setup installs it once, about 150 MB)
  voice-check [dir]                      measure narration clips: clipping, glitches, silence, pace, flat delivery
  build [dir]                            write build/film.html
  review [dir] [--beats 10,20] [--size 400x800] [--motion]   screenshot every style variant + contact sheets
  audio-check [dir]                      render the score offline; report loudness, clipping, dynamics
  install-skill [--to dir] [--root workspace] [--force]   install the Claude Code skill; print MCP and AGENTS.md snippets for another repo
  doctor [--deep]                        check this machine
  mcp [--root dir]                       run an MCP server on stdio (tools + the guide as resources)
  scene new <name> [--look wayang]       write a scene: code you draw for one beat of the script (guide: scenes); then preview and check it
  scene preview <name> [--beats 8] [--frames 0,2,4] [--size 960x540] [--look ink]   render frames and a strip you can look at
  scene check <name>                     lint + render tests: errors, blank or frozen scenes, same-frame determinism, draw speed
  scene list | rig new <name> | lib new <name> | look list | look show <name> | look new <name>   scenes, puppet rigs, shared helper code and looks (style guides)
  library list|save <kind> <name>|use <kind> <name>   keep scenes, rigs and looks you want to reuse across films (~/.filmstudio/library)
  length <seconds> [--bpm 128] [--preset calm-46]    bars and bpm for an exact length at about that tempo (length and tempo are independent)
  list [--root dir]                      list the projects in the workspace (default ~/filmstudio-projects or FILMSTUDIO_ROOT)
  serve [dir|--root dir] [--port 4173] [--host 127.0.0.1] [--token t] [--allow-host name.ngrok.app]   local web page: one project if dir has spec.json, else a project picker over the workspace (token required off localhost)
  styles [--mood calm]                   list shot styles and variants (filter by mood)
  guide [topic]                          print the agent guide (no topic = list topics)`;

(async () => {
  const { pos, flags } = parse(process.argv.slice(2));
  let cmd = pos[0]; const dir = pos[1] || '.';
  // bare `filmstudio` in a terminal opens the studio on the default workspace; `filmstudio help` prints the command list
  if (!cmd && !flags.help && process.stdout.isTTY) cmd = 'serve';
  try {
    if (!cmd || cmd === 'help' || flags.help) return console.log(HELP);
    if (cmd === 'styles') return out(Object.fromEntries(Object.entries(STYLES).filter(([k, v]) => !flags.mood || (v.moods || []).includes(String(flags.mood))).map(([k, v]) => [k, { variants: v.variants, moods: v.moods, use: v.use }])));
    if (cmd === 'guide') {
      const gdir = path.join(ROOT, 'docs', 'agent-guide'), topics = fs.readdirSync(gdir).filter(f => f.endsWith('.md')).sort();
      if (!pos[1]) return out({ topics: topics.map(f => f.replace(/\.md$/, '')), hint: 'Run `filmstudio guide <topic>`, or `guide all` for everything.' });
      const want = pos[1] === 'all' ? topics : topics.filter(f => f.replace(/\.md$/, '').replace(/^\d+-/, '') === pos[1] || f.replace(/\.md$/, '') === pos[1]);
      if (!want.length) fail('no guide topic "' + pos[1] + '"', { topics: topics.map(f => f.replace(/\.md$/, '')) });
      return console.log(want.map(f => fs.readFileSync(path.join(gdir, f), 'utf8')).join('\n\n---\n\n'));
    }
    if (cmd === 'mcp') { require('../src/mcp').serve(flags.root ? String(flags.root) : null); return; }
    if (cmd === 'listen' && flags.setup) return out(require('../src/listen').setup(flags.model ? String(flags.model) : 'base.en', m => console.error(m)));  // an installer: no project needed
    if (cmd === 'length') { const sec = Number(pos[1]); if (!(sec > 0)) fail('usage: filmstudio length <seconds> [--bpm 128] [--preset anthem-46|calm-46]'); const r = require('../src/registry').planLength(sec, flags.preset ? String(flags.preset) : 'anthem-46', flags.bpm ? Number(flags.bpm) : null); return out(Object.assign(r, { set: 'In spec.json set "bars": ' + r.bars + ' and "bpm": ' + r.bpm + '. The length is exact and the tempo stays near ' + (flags.bpm || 'the preset tempo') + ': length and tempo are independent.', note: Math.abs(r.seconds - sec) > 0.5 ? 'Could not reach ' + sec + ' s within the tempo limits (40 to 240 bpm); closest is ' + r.seconds + ' s.' : undefined })); }
    if (cmd === 'list') {
      const W = require('../src/workspace'), root = W.resolveRoot(flags.root);
      return out({ ok: true, root, exists: fs.existsSync(root), projects: W.listProjects(root), note: 'A project is a subfolder of the workspace that has spec.json. Set the workspace with --root or FILMSTUDIO_ROOT (default ~/filmstudio-projects).' });
    }
    if (cmd === 'serve') {
      const W = require('../src/workspace'), explicit = pos[1] ? path.resolve(pos[1]) : null;
      const asProject = !flags.root && fs.existsSync(path.join(explicit || process.cwd(), 'spec.json'));
      const mode = asProject ? { dir: explicit || process.cwd() } : { root: W.resolveRoot(flags.root || explicit) };
      const host = String(flags.host || '127.0.0.1'), local = ['127.0.0.1', 'localhost', '::1'].includes(host);
      const allow = flags['allow-host'] ? String(flags['allow-host']).split(',').map(x => x.trim()).filter(Boolean) : [];
      const token = flags.token ? String(flags.token) : (local && !allow.length ? null : require('crypto').randomBytes(16).toString('hex'));
      const st = require('../src/studio').createStudio(Object.assign({ host, token, allowHosts: allow }, mode));
      const port = Number(flags.port || 4173); await st.listen(port);
      console.log(JSON.stringify({ ok: true, url: 'http://' + (host === '0.0.0.0' ? 'localhost' : host) + ':' + port + '/' + (token ? '?token=' + token : ''), mode: mode.dir ? 'project' : 'workspace', dir: mode.dir, root: mode.root, note: 'Ctrl+C to stop. Nothing is exposed beyond ' + host + '.' }, null, 2));
      return;
    }
    if (cmd === 'install-skill') {
      // Copy the Claude Code skill to a skills folder and print ready-to-paste setup for another repo. Edits no settings file.
      const os = require('os'), to = path.resolve(flags.to ? String(flags.to) : path.join(os.homedir(), '.claude', 'skills')), dest = path.join(to, 'film-maker');
      if (fs.existsSync(dest) && !flags.force) fail('already installed: ' + dest, { fix: 'Re-run with --force to replace it.' });
      fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(to, { recursive: true });
      fs.cpSync(path.join(ROOT, 'skills', 'film-maker'), dest, { recursive: true });
      fs.writeFileSync(path.join(dest, 'CLONE_PATH'), ROOT + '\n');
      const cli = path.join(ROOT, 'bin', 'filmstudio.js'), ws = flags.root ? path.resolve(String(flags.root)) : path.join(os.homedir(), 'filmstudio-projects');
      return out({ ok: true, installed: dest, clone: ROOT,
        optional_global_command: 'cd ' + ROOT + ' && npm link   (puts `filmstudio` on PATH)',
        mcp_claude_code: 'claude mcp add filmstudio -- node ' + cli + ' mcp --root ' + ws,
        mcp_json: { mcpServers: { filmstudio: { command: 'node', args: [cli, 'mcp', '--root', ws] } } },
        agents_md_snippet: '## Making videos\nTo make a short film about this project, run `node ' + cli + ' guide explain-a-codebase` and follow it. Keep film projects in ' + ws + ', not in this repo.',
        note: 'The skill lets Claude Code find filmstudio from any repo. Paste the snippet into that repo\'s AGENTS.md or CLAUDE.md so agents know to use it.' });
    }
    if (cmd === 'doctor') return out(await require('../src/doctor').doctor({ deep: !!flags.deep }));
    if (cmd === 'new') {
      const target = path.resolve(pos[1] || 'my-film'); if (fs.existsSync(target) && fs.readdirSync(target).length) fail('folder not empty: ' + target);
      fs.mkdirSync(target, { recursive: true });
      if (flags.example) { const ex = path.join(ROOT, 'examples', String(flags.example)); if (!fs.existsSync(ex)) fail('no such example', { examples: fs.readdirSync(path.join(ROOT, 'examples')) }); fs.cpSync(ex, target, { recursive: true, filter: s => !s.includes(path.sep + 'build') }); }
      else { fs.cpSync(path.join(ROOT, 'examples', 'starter'), target, { recursive: true }); fs.mkdirSync(path.join(target, 'voice'), { recursive: true }); }
      let applied;
      if (!flags.example && (flags.length || flags.preset || flags.format)) {
        const R = require('../src/registry'), sp = path.join(target, 'spec.json'), spc = JSON.parse(fs.readFileSync(sp, 'utf8'));
        if (flags.preset) { if (!R.SCORES[String(flags.preset)]) fail('unknown preset', { presets: Object.keys(R.SCORES) }); spc.score = Object.assign({}, spc.score, { preset: String(flags.preset) }); spc.bpm = R.SCORES[String(flags.preset)].bpm; }
        if (flags.format) { if (!R.FORMATS[String(flags.format)]) fail('unknown format', { formats: Object.keys(R.FORMATS) }); if (flags.format !== '16:9') spc.format = String(flags.format); }
        if (flags.length) { const p = R.planLength(Number(flags.length), (spc.score || {}).preset, flags.bpm ? Number(flags.bpm) : null); const k = p.bars / spc.bars; let prev = 1; const ns = [];
          spc.shots.forEach((s, i) => { let e = i === spc.shots.length - 1 ? p.bars + 1 : Math.round((1 + (s[1] - 1) * k) * 4) / 4; if (e > prev) { ns.push([prev].concat([e], s.slice(2))); prev = e; } });
          if (ns.length) ns[ns.length - 1][1] = p.bars + 1; spc.shots = ns; spc.bars = p.bars; spc.bpm = p.bpm; spc.endCardBar = Math.round((p.bars - 1.4) * 100) / 100; }
        fs.writeFileSync(sp, JSON.stringify(spc, null, 1)); applied = { bars: spc.bars, bpm: spc.bpm, format: spc.format || '16:9', preset: (spc.score || {}).preset, shots: spc.shots.length, note: flags.length ? 'Starter shots were squeezed to fit; they are placeholders, replace them.' : undefined };
      }
      return out({ ok: true, created: target, applied, next: flags.example ? 'cd there, then `filmstudio validate`, `filmstudio build`.' : 'A valid starter spec.json (shots only, no narration) is in place. Edit the shots, meta text and add narration, then `validate`. See `filmstudio guide quick-start`.' });
    }
    if (cmd === 'scene' || cmd === 'rig' || cmd === 'look' || cmd === 'lib' || cmd === 'library') {
      const T = require('../src/scenetools'), sub = pos[1], nm = pos[2], pd = path.resolve(flags.dir ? String(flags.dir) : '.');
      const parseSize = () => { const z = flags.size ? String(flags.size).split('x').map(Number) : []; return z.length === 2 && z[0] > 0 ? { width: z[0], height: z[1] } : {}; };
      const optsFrom = () => Object.assign(parseSize(), { beats: flags.beats ? Number(flags.beats) : undefined, frames: flags.frames ? String(flags.frames).split(',').map(Number) : undefined, params: flags.params ? JSON.parse(String(flags.params)) : (flags.look ? { look: String(flags.look) } : undefined) });
      if (cmd === 'library') {
        if (sub === 'path') return out({ ok: true, library: T.libRoot() });
        if (sub === 'list') return out({ ok: true, library: T.libRoot(), items: T.libList(nm) });
        if (sub === 'save') { if (!pos[3]) fail('usage: filmstudio library save <scene|rig|look> <name> [--dir project]'); return out(Object.assign({ ok: true }, T.libSave(pd, nm, pos[3]))); }
        if (sub === 'use') { if (!pos[3]) fail('usage: filmstudio library use <scene|rig|look> <name> [--as new-name] [--force] [--dir project]'); return out(Object.assign({ ok: true }, T.libUse(pd, nm, pos[3], { as: flags.as ? String(flags.as) : undefined, force: !!flags.force }))); }
        fail('usage: filmstudio library <list [kind]|save <kind> <name>|use <kind> <name>|path>');
      }
      if (cmd === 'look') {
        if (sub === 'new') { if (!nm) fail('usage: filmstudio look new <name>'); return out({ ok: true, created: T.scaffold(pd, 'look', nm), next: 'Edit it, then use it with scene({ look: \'' + nm + '\' }).' }); }
        const cat = T.lookCatalog(pd);
        if (sub === 'list' || !sub) return out({ ok: true, looks: Object.values(cat).map(l => ({ name: l.name, aliases: l.aliases && l.aliases.length ? l.aliases : undefined, follows: l.family || undefined, desc: l.desc, bright: l.bright, source: l.source })), hint: 'Use one with scene({ look: "name" }). `filmstudio look show <name>` has its palette and guide; `filmstudio guide looks` explains them all.' });
        if (sub === 'show') { const l = T.resolveLook(cat, nm); if (!l) fail('no look "' + nm + '"', { looks: Object.keys(cat) }); return out(Object.assign({ ok: true }, l)); }
        fail('usage: filmstudio look <list|show <name>|new <name>>');
      }
      if (cmd === 'lib') { if (sub === 'new') { if (!nm) fail('usage: filmstudio lib new <name>'); return out({ ok: true, created: T.scaffold(pd, 'lib', nm), next: 'Use it in a scene: c.lib(\'' + nm + '\').box(c, x, y, w, h).' }); } if (sub === 'list' || !sub) return out({ ok: true, libs: require('../src/scenes').listDir(pd, 'libs') }); fail('usage: filmstudio lib <list|new <name>>'); }
      if (cmd === 'rig') { if (sub === 'new') { if (!nm) fail('usage: filmstudio rig new <name>'); return out({ ok: true, created: T.scaffold(pd, 'rig', nm), next: 'Draw the parts, then c.rig(\'' + nm + '\').pose({...}).draw(x, y, scale) in a scene.' }); } if (sub === 'list' || !sub) return out({ ok: true, rigs: require('../src/scenes').listDir(pd, 'rigs') }); fail('usage: filmstudio rig <list|new <name>>'); }
      // scene
      if (sub === 'new') { if (!nm) fail('usage: filmstudio scene new <name> [--look wayang]'); return out({ ok: true, created: T.scaffold(pd, 'scene', nm, { look: flags.look ? String(flags.look) : undefined }), next: 'Use it in spec.json: [startBar, endBar, "scene", "' + nm + '"]. Edit draw(c), then `filmstudio scene preview ' + nm + '`.' }); }
      if (sub === 'list' || !sub) return out({ ok: true, scenes: require('../src/scenes').listDir(pd, 'scenes'), rigs: require('../src/scenes').listDir(pd, 'rigs'), looks: require('../src/scenes').listDir(pd, 'looks') });
      if (sub === 'preview') { if (!nm) fail('usage: filmstudio scene preview <name> [--beats 8] [--frames 0,2,4,6] [--size 960x540] [--look ink]'); const r = await T.preview(pd, nm, optsFrom()); out(r); return process.exit(r.ok ? 0 : 1); }
      if (sub === 'check') { if (!nm) fail('usage: filmstudio scene check <name> [--beats 8]'); const r = await T.check(pd, nm, optsFrom()); out(r); return process.exit(r.ok ? 0 : 1); }
      fail('usage: filmstudio scene <new|list|preview|check> <name>');
    }
    const spec = readSpec(dir);
    if (cmd === 'validate') { const r = validate(spec, dir); out(r); return process.exit(r.ok ? 0 : 1); }
    if (cmd === 'build') {
      const v = validate(spec, dir); if (!v.ok) fail('spec has errors; fix them first', { errors: v.errors });
      const html = compile(spec, dir), o = path.join(dir, 'build', 'film.html'); fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, html);
      return out({ ok: true, out: path.resolve(o), bytes: html.length, warnings: v.warnings, hasVoice: html.includes('var VO=['), note: html.includes('var VO=[') ? undefined : 'No narration audio is attached yet; run `filmstudio voice` if the film has narration lines.' });
    }
    if (cmd === 'voice') {
      const r = await require('../src/voice').voice(dir, spec, { provider: flags.provider, force: !!flags.force, yes: !!flags.yes, log: m => console.error(m) });
      return out(Object.assign({ ok: r.missing.length === 0 }, r));
    }
    if (cmd === 'export') {
      const v = validate(spec, dir); if (!v.ok) fail('spec has errors; fix them first', { errors: v.errors });
      const REG = require('../src/registry'), qn = String(flags.quality || REG.DEFAULT_QUALITY), Q = REG.QUALITY[qn];
      if (!Q) fail('unknown quality "' + qn + '"', { fix: 'Use one of: ' + Object.keys(REG.QUALITY).join(', ') });
      const sz = flags.size ? String(flags.size).split('x').map(Number) : REG.sizeFor(spec.format || '16:9', Q.long);
      if (flags.size && !(sz.length === 2 && sz.every(n => n >= 64))) fail('bad --size "' + flags.size + '"', { fix: 'Use WIDTHxHEIGHT, for example 1920x1080.' });
      const r = await require('../src/exporter').exportFilm(dir, spec, { fps: flags.fps ? +flags.fps : Q.fps, crf: flags.crf ? +flags.crf : Q.crf, size: sz, fromBar: flags['from-bar'] ? +flags['from-bar'] : null, toBar: flags['to-bar'] ? +flags['to-bar'] : null, noAudio: !!flags['no-audio'], noBars: !!flags['no-bars'], audioRate: flags['audio-rate'] ? +flags['audio-rate'] : null, log: m => console.error(m) });
      return out(Object.assign({ ok: true }, r));
    }
    if (cmd === 'listen') {
      const LS = require('../src/listen');
      const r = await LS.listen(dir, spec, { model: flags.model ? String(flags.model) : null, lines: flags.lines ? String(flags.lines).split(',').map(Number) : null, log: m => console.error(m) });
      out(r); return process.exit(r.ok ? 0 : 2);
    }
    if (cmd === 'voice-check') { const r = require('../src/voicecheck').voiceCheck(dir, spec); out(r); return process.exit(r.ok ? 0 : 2); }
    if (cmd === 'review') {
      const sz = flags.size ? String(flags.size).split('x').map(Number) : (spec.format ? require('../src/registry').sizeFor(spec.format, 800) : []);
      const r = await require('../src/review').review(dir, spec, { beats: flags.beats ? String(flags.beats).split(',').map(Number) : null, width: sz[0], height: sz[1], motion: !!flags.motion });
      return out(Object.assign({ ok: r.pageErrors.length === 0 && r.drawErrors.length === 0, hint: 'Open build/review/sheet1.png and look for washed-out exposure, cropped labels, overflowing shapes. See `filmstudio guide review`.' }, r));
    }
    if (cmd === 'audio-check') {
      const r = await require('../src/audiocheck').audioCheck(dir, spec, { progress: (a, b) => console.error('rendered bar ' + a + '/' + b) });
      return out(r);
    }
    fail('unknown command "' + cmd + '"', { help: HELP });
  } catch (e) { fail(e.message, { code: e.code, characters: e.characters }); }
})();
