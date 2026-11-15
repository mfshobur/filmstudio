'use strict';
// Minimal MCP server over stdio (newline-delimited JSON-RPC 2.0, protocol 2024-11-05). Each tool runs the filmstudio CLI.
// Paths are confined to a workspace root (FILMSTUDIO_ROOT, default: the directory the server was started in).
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const CLI = path.join(__dirname, '..', 'bin', 'filmstudio.js');
const PKG = require('../package.json');
const GUIDE_DIR = path.join(__dirname, '..', 'docs', 'agent-guide');

/* What every client receives when it connects (initialize.instructions), and the `make_film` prompt. This is the whole brief: an agent needs nothing else. */
const INSTRUCTIONS = [
  'filmstudio makes short animated films (drawn by code, a generated score, spoken narration) from a project folder of text files. YOU write the script and DRAW a scene for every beat of it; filmstudio builds, voices and renders it. You can do all of it through these tools, without any other file or shell access.',
  '',
  'START: call filmstudio_guide with topic "quick-start", then "scenes" ("looks", "puppet-rigs", "storyboard", "score-parts" when you need them; "all" returns everything) and follow it exactly. Call filmstudio_doctor once to see what this machine can do (review, export, which voices).',
  '',
  'WORKFLOW',
  '1. filmstudio_list, then filmstudio_new (dir, length in seconds) in the workspace. Keep films in the workspace, never in the user\'s source repo.',
  '2. Write brief.json, treatment.md and the script (narration lines with timing) in spec.json with filmstudio_write; read files with filmstudio_read, list them with filmstudio_files, change part of a file with filmstudio_edit.',
  '3. For EVERY beat of the script: filmstudio_scene_new, write the scene code to scenes/<name>.js, then filmstudio_scene_preview and LOOK at the image it returns, fix, repeat; then filmstudio_scene_check. Reuse characters as rigs and helpers as libs.',
  '4. In spec.json each beat is a shot: [startBar, endBar, "scene", "<name>", {}]. Run filmstudio_validate and fix every error using its "fix" hint.',
  '5. filmstudio_voice (kokoro by default; neutts gives emotional English with an emotion per narration line when filmstudio_doctor says it is installed), then filmstudio_voice_check and filmstudio_listen (reads every clip back with speech recognition and compares it with the script: your substitute for hearing the words; if it is not installed, ask the user before it downloads anything). filmstudio_build. filmstudio_review and LOOK at the contact sheets: does every shot show what its line says? filmstudio_audio_check.',
  '6. filmstudio_export renders build/film.mp4 (Full HD 1080p, 24 fps by default; quality=draft|hd|fhd|4k). It is slow: test with quality=draft, from_bar=1, to_bar=3 first.',
  '',
  'SLOW STEPS (voice, review, export) run as background jobs. If one is not done within about 45 s the tool returns a job id: call filmstudio_job with that id to wait and read progress. Export resumes if interrupted.',
  '',
  'RULES',
  '- Every beat of the script is shown by a scene you draw for it (a rabbit crossing a bridge is drawn as a rabbit crossing a bridge). Built-in styles (filmstudio_styles) are abstract pictures: use one only where an abstract visual is genuinely right. Never tile built-in styles across a film.',
  '- Looks (filmstudio_look_list) are style guides: pick one per part of the story and use it for every scene in that part.',
  '- Keep the picture CLEAN: films with drawn scenes get a clean finish by default (crisp text, almost no grain, no bloom haze, no vignette, plain hard cuts). Do not stack your own vignette, grain, blur or glow on top, keep text sharp (small shadow blur only), and keep key content bright and readable on its background. If review shows haze, dark corners or soft text, fix the scene or set "finish" in spec.json (guide "scenes"); do not export until review looks clean.',
  '- You cannot hear audio or judge taste. Use the measurements, and say plainly what you could not check; ask the user to listen and report timecodes. You can look at images (scene previews and review sheets): do, and fix what you see.',
  '- Ask the user before paid APIs (elevenlabs), model downloads, exposing a server, or deleting files. Never write secrets into files. Ask at most 3 questions, in one message; default the rest.',
  '- Honest limits: 2D drawing by code. No photoreal footage, no 3D, no screen recordings. Complex organic art is out of reach; stylised, graphic drawing is where it is good. Say so when it matters.',
  '- Length is free and independent of tempo: any length at any tempo (5 minutes at 128 bpm is 160 bars). filmstudio_new with length (and optionally bpm) sets bars and bpm exactly. For films longer than about 2 minutes score them with score.parts (guide "score-parts"), or the music loops. Narration clips must fit their slots (validate reports overlaps).',
  '',
  'DELIVER: tell the user where build/film.mp4 and build/film.html are, that running `filmstudio` opens the studio (timeline, preview player), what you checked, and what only they can judge (voice, music, taste).'
].join('\n');
const filmPrompt = a => 'Use filmstudio to make a short film' + (a && a.idea ? ' about: ' + a.idea : '') + (a && a.length ? ' (about ' + a.length + ' seconds)' : '') + '.\n\n' + INSTRUCTIONS;

const dirProp = { type: 'string', description: 'Project folder (relative to the workspace root)' };
const TOOLS = [
  { name: 'filmstudio_new', description: 'Create a project folder with a valid starter spec.json (or copy an example).', props: { dir: dirProp, example: { type: 'string', description: 'Example name, e.g. the-only-limit' }, length: { type: 'number', description: 'Target length in seconds, any length (sets bars; the tempo stays independent)' }, bpm: { type: 'number', description: 'Wanted tempo, 40 to 240 (default 128); the length stays exact' }, preset: { type: 'string', description: 'Score preset, e.g. calm-46' }, format: { type: 'string', description: 'Aspect ratio, e.g. 9:16' } }, req: ['dir'], args: a => ['new', a.dir].concat(a.example ? ['--example', a.example] : [], a.length ? ['--length', String(a.length)] : [], a.bpm ? ['--bpm', String(a.bpm)] : [], a.preset ? ['--preset', a.preset] : [], a.format ? ['--format', a.format] : []) },
  { name: 'filmstudio_list', description: 'List the film projects in the workspace root (name, title, length, format, last updated/built). Use it to find an existing film before creating a new one.', props: {}, req: [], noDir: true, args: () => ['list', '--root', '.'] },
  { name: 'filmstudio_scene_new', description: 'Scaffold a file you will draw in: a scene (one beat of the script, code that draws every frame), a rig (a puppet of jointed parts), a look (a style guide) or a lib (shared helper code). Then edit the file; read the guide "scenes" first.', props: { dir: dirProp, name: { type: 'string', description: 'letters, digits, dash, underscore' }, kind: { type: 'string', enum: ['scene', 'rig', 'look', 'lib'] }, look: { type: 'string', description: 'for a scene: which look to start from (see filmstudio_look_list)' } }, req: ['dir', 'name'], args: a => [a.kind && a.kind !== 'scene' ? a.kind : 'scene', 'new', a.name, '--dir', a.dir].concat(a.look ? ['--look', a.look] : []) },
  { name: 'filmstudio_scene_list', description: 'List the scenes, rigs, libs and looks in a project.', props: { dir: dirProp }, req: ['dir'], args: a => ['scene', 'list', '--dir', a.dir] },
  { name: 'filmstudio_scene_preview', description: 'Render frames of a scene at several moments and return them as one image strip (the image is attached when your client shows images). Use after every edit to look at what you drew; needs a browser.', image: true, props: { dir: dirProp, name: { type: 'string' }, beats: { type: 'number', description: 'length of the preview in beats (default 8; a bar is 4 beats)' }, frames: { type: 'string', description: 'comma separated beats to render, e.g. "0.5,2,4,7"' }, look: { type: 'string', description: 'try the scene in another look without editing it' } }, req: ['dir', 'name'], args: a => ['scene', 'preview', a.name, '--dir', a.dir].concat(a.beats ? ['--beats', String(a.beats)] : [], a.frames ? ['--frames', a.frames] : [], a.look ? ['--look', a.look] : []) },
  { name: 'filmstudio_scene_check', description: 'Lint a scene and render it to test it: errors, blank or frozen scenes, drawing that is not a pure function of time, draw speed. Cannot judge whether it looks good; use preview for that.', props: { dir: dirProp, name: { type: 'string' }, beats: { type: 'number' } }, req: ['dir', 'name'], args: a => ['scene', 'check', a.name, '--dir', a.dir].concat(a.beats ? ['--beats', String(a.beats)] : []) },
  { name: 'filmstudio_look_list', description: 'List the looks (style guides: palette, background, effects) a scene can use, including the ones in the project.', props: { dir: dirProp }, req: [], args: a => ['look', 'list'].concat(a.dir ? ['--dir', a.dir] : []) },
  { name: 'filmstudio_look_show', description: 'Show one look: its palette, effects and a paragraph on how to draw in it.', props: { name: { type: 'string' }, dir: dirProp }, req: ['name'], args: a => ['look', 'show', a.name].concat(a.dir ? ['--dir', a.dir] : []) },
  { name: 'filmstudio_library', description: 'The shared library of scenes, rigs, looks and libs you reuse across films: action list, save (from the project into the library) or use (copy from the library into the project).', props: { action: { type: 'string', enum: ['list', 'save', 'use'] }, kind: { type: 'string', enum: ['scene', 'rig', 'look', 'lib'] }, name: { type: 'string' }, dir: dirProp }, req: ['action', 'dir'], args: a => ['library', a.action].concat(a.action === 'list' ? (a.kind ? [a.kind] : []) : [a.kind || 'scene', a.name || ''], ['--dir', a.dir]) },
  { name: 'filmstudio_validate', description: 'Validate spec.json. Returns errors with fix hints, warnings and film length.', props: { dir: dirProp }, req: ['dir'], args: a => ['validate', a.dir] },
  { name: 'filmstudio_build', description: 'Build build/film.html from spec.json.', props: { dir: dirProp }, req: ['dir'], args: a => ['build', a.dir] },
  { name: 'filmstudio_voice', slow: true, description: 'Generate or import narration clips (kokoro, neutts, elevenlabs, file). neutts reads narration[i].emotion (angry, disgusted, fearful, happy, neutral, sad, surprised) and speaker (emily, sophie, paul, steven). Slow: runs as a background job. elevenlabs is paid and returns NEEDS_CONFIRMATION until yes=true; only set yes after the user agrees.', props: { dir: dirProp, provider: { type: 'string', enum: ['kokoro', 'neutts', 'elevenlabs', 'file'] }, force: { type: 'boolean' }, yes: { type: 'boolean' } }, req: ['dir'], args: a => ['voice', a.dir].concat(a.provider ? ['--provider', a.provider] : [], a.force ? ['--force'] : [], a.yes ? ['--yes'] : []) },
  { name: 'filmstudio_voice_check', description: 'Measure narration clips for clipping, glitches, silence, pace and flat delivery. Cannot judge taste.', props: { dir: dirProp }, req: ['dir'], args: a => ['voice-check', a.dir] },
  { name: 'filmstudio_review', slow: true, description: 'Screenshot every shot (needs a browser) and make contact sheets in build/review. Optional portrait size and motion check.', props: { dir: dirProp, size: { type: 'string', description: 'e.g. 400x800' }, motion: { type: 'boolean' }, beats: { type: 'string', description: 'comma separated beats' } }, req: ['dir'], args: a => ['review', a.dir].concat(a.size ? ['--size', a.size] : [], a.motion ? ['--motion'] : [], a.beats ? ['--beats', a.beats] : []) },
  { name: 'filmstudio_listen', slow: true, description: 'The closest an agent gets to listening: transcribe every narration clip with a local speech recogniser and compare it with the script. Catches garbled, swallowed, cut-off or wrong words, unclear pronunciation and speech that is not in the script. Cannot judge tone, emotion or taste. Needs `filmstudio listen --setup` once (about 150 MB download): if it says not installed, ask the user to approve that, never download without asking.', props: { dir: dirProp, lines: { type: 'string', description: 'comma separated narration line numbers (0 is the first); default all' } }, req: ['dir'], args: a => ['listen', a.dir].concat(a.lines ? ['--lines', String(a.lines)] : []) },
  { name: 'filmstudio_audio_check', description: 'Render the score offline and report loudness, clipping and dynamics.', props: { dir: dirProp }, req: ['dir'], args: a => ['audio-check', a.dir] },
  { name: 'filmstudio_export', slow: true, description: 'Render build/film.mp4 (Full HD 1080p 24 fps by default; slow; resumable). Test first with quality=draft, from_bar=1, to_bar=3.', props: { dir: dirProp, quality: { type: 'string', description: 'draft, hd, fhd (default, 1080p) or 4k' }, fps: { type: 'number' }, size: { type: 'string' }, crf: { type: 'number' }, workers: { type: 'number', description: 'parallel browsers (default: automatic, up to 6; 1 on small machines)' }, from_bar: { type: 'number' }, to_bar: { type: 'number' }, no_audio: { type: 'boolean' } }, req: ['dir'], args: a => ['export', a.dir].concat(a.quality ? ['--quality', String(a.quality)] : [], a.crf ? ['--crf', String(a.crf)] : [], a.workers ? ['--workers', String(a.workers)] : [], a.fps ? ['--fps', String(a.fps)] : [], a.size ? ['--size', a.size] : [], a.from_bar ? ['--from-bar', String(a.from_bar)] : [], a.to_bar ? ['--to-bar', String(a.to_bar)] : [], a.no_audio ? ['--no-audio'] : []) },
  { name: 'filmstudio_styles', description: 'List shot styles and variants, optionally filtered by mood (calm, energetic, playful, serious, warm, nostalgic, mysterious, techy, night, nature, bold, retro).', props: { mood: { type: 'string' } }, req: [], noDir: true, args: a => ['styles'].concat(a.mood ? ['--mood', a.mood] : []) },
  { name: 'filmstudio_guide', description: 'Read the agent guide. No topic lists topics; "all" returns everything.', props: { topic: { type: 'string' } }, req: [], noDir: true, args: a => ['guide'].concat(a.topic ? [a.topic] : []) },
  { name: 'filmstudio_doctor', description: 'Check this machine and say what film-making steps it can do.', props: {}, req: [], noDir: true, args: () => ['doctor'] },

  /* files: so an agent with no file access of its own can author the whole film */
  { name: 'filmstudio_files', description: 'List the files of a project (path and size): spec.json, brief.json, scenes/, rigs/, libs/, looks/, assets/, voice/, build/ outputs.', props: { dir: dirProp }, req: ['dir'], run: (root, a) => toolFiles(root, a) },
  { name: 'filmstudio_read', description: 'Read a text file of a project (up to 300 KB), for example spec.json or scenes/intro.js. PNG/JPEG files (build/review sheets, build/scenes strips) come back as images you can look at.', props: { dir: dirProp, path: { type: 'string', description: 'path inside the project, e.g. scenes/intro.js' } }, req: ['dir', 'path'], run: (root, a) => toolRead(root, a) },
  { name: 'filmstudio_write', description: 'Create or overwrite a project file. Allowed: spec.json, brief.json, treatment.md, feedback.json, scenes/*.js, rigs/*.js, libs/*.js, looks/*.js, assets/* (svg, png, jpg, webp, json, txt), notes/*.md. spec.json must be valid JSON. Run filmstudio_validate afterwards.', props: { dir: dirProp, path: { type: 'string' }, content: { type: 'string' } }, req: ['dir', 'path', 'content'], run: (root, a) => toolWrite(root, a) },
  { name: 'filmstudio_edit', description: 'Replace text inside a project file (same allowed files as filmstudio_write). old_text must occur exactly once unless replace_all is true. Cheaper than rewriting a whole scene.', props: { dir: dirProp, path: { type: 'string' }, old_text: { type: 'string' }, new_text: { type: 'string' }, replace_all: { type: 'boolean' } }, req: ['dir', 'path', 'old_text', 'new_text'], run: (root, a) => toolEdit(root, a) },
  { name: 'filmstudio_job', description: 'Background jobs (voice, review, export). With id: wait up to `wait` seconds (default 40, max 55) for it to finish, then return its progress or result. Without id: list the jobs of this session. Export resumes if the server restarts: just call filmstudio_export again.', props: { id: { type: 'string' }, wait: { type: 'number' } }, req: [], noDir: true, run: (root, a) => toolJob(root, a) },
];

function inRoot(root, p) { const r = path.resolve(root, p), rel = path.relative(root, r); return !rel.startsWith('..') && !path.isAbsolute(rel) ? r : null; }
function runCli(args, cwd) {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [CLI].concat(args), { cwd, env: process.env }); let out = '', err = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('close', code => resolve({ code, out, err })); p.on('error', e => resolve({ code: -1, out: '', err: String(e) }));
  });
}
const WRITABLE = /^(spec\.json|brief\.json|treatment\.md|feedback\.json|(scenes|rigs|libs|looks)\/[A-Za-z0-9_-]+\.js|assets\/[A-Za-z0-9_.-]+\.(svg|png|jpe?g|webp|json|txt)|notes\/[A-Za-z0-9_-]+\.md)$/;
const err = text => ({ isError: true, content: [{ type: 'text', text }] });
const okText = o => ({ isError: false, content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 1) }] });
/* a path inside a project: no absolute paths, no "..", no symlink that leads out */
function projPath(root, dir, rel, forWrite) {
  const d = inRoot(root, dir); if (!d) return { error: 'path is outside the workspace root (' + root + ')' };
  if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) return { error: 'no such project folder: ' + dir + ' (create it with filmstudio_new)' };
  rel = String(rel || '').replace(/\\/g, '/');
  if (!rel || rel.includes('\0') || path.isAbsolute(rel) || rel.split('/').includes('..') || rel.split('/').some(x => x.startsWith('.'))) return { error: 'bad path "' + rel + '": use a path inside the project, like scenes/intro.js' };
  if (forWrite && !WRITABLE.test(rel)) return { error: 'not writable: ' + rel + '. Allowed: spec.json, brief.json, treatment.md, feedback.json, scenes/*.js, rigs/*.js, libs/*.js, looks/*.js, assets/*.(svg|png|jpg|webp|json|txt), notes/*.md' };
  const f = path.resolve(d, rel);
  let probe = f; while (!fs.existsSync(probe)) probe = path.dirname(probe);
  const realD = fs.realpathSync(d), realP = fs.realpathSync(probe), r = path.relative(realD, realP);
  if (r.startsWith('..') || path.isAbsolute(r)) return { error: 'path leaves the project (symlink)' };
  return { dir: d, file: f, rel };
}
function walk(d, base, out, depth) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || (base + e.name) === 'build/export') continue;
    const rel = base + e.name;
    if (e.isDirectory()) { if (depth < 3) walk(path.join(d, e.name), rel + '/', out, depth + 1); }
    else if (e.isFile() && out.length < 400) out.push({ path: rel, bytes: fs.statSync(path.join(d, e.name)).size });
  }
}
function toolFiles(root, a) {
  const d = inRoot(root, a.dir); if (!d) return err('path is outside the workspace root (' + root + ')');
  if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) return err('no such project folder: ' + a.dir + ' (create it with filmstudio_new)');
  const out = []; walk(d, '', out, 0); return okText({ dir: a.dir, files: out });
}
function toolRead(root, a) {
  const p = projPath(root, a.dir, a.path, false); if (p.error) return err(p.error);
  if (!fs.existsSync(p.file) || !fs.statSync(p.file).isFile()) return err('no such file: ' + p.rel + ' (see filmstudio_files)');
  const size = fs.statSync(p.file).size, ext = path.extname(p.file).toLowerCase();
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') { if (size > 4e6) return err(p.rel + ' is too large to return (' + size + ' bytes)'); return { isError: false, content: [{ type: 'image', data: fs.readFileSync(p.file).toString('base64'), mimeType: ext === '.png' ? 'image/png' : 'image/jpeg' }] }; }
  if (size > 300000) return err(p.rel + ' is ' + size + ' bytes; the limit is 300000. Read a smaller file.');
  const buf = fs.readFileSync(p.file); if (buf.includes(0)) return err(p.rel + ' is a binary file');
  return { isError: false, content: [{ type: 'text', text: buf.toString('utf8') }] };
}
function putFile(p, content) {
  if (Buffer.byteLength(content) > 600000) return err('content is larger than 600000 bytes');
  if (p.rel === 'spec.json') { try { const j = JSON.parse(content); if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('not an object'); } catch (e) { return err('spec.json is not valid JSON: ' + e.message + '. Nothing was written.'); } }
  fs.mkdirSync(path.dirname(p.file), { recursive: true });
  const tmp = p.file + '.tmp' + process.pid; fs.writeFileSync(tmp, content); fs.renameSync(tmp, p.file);
  return okText({ ok: true, path: p.rel, bytes: Buffer.byteLength(content), next: 'filmstudio_validate' + (/^scenes\//.test(p.rel) ? ', filmstudio_scene_check and filmstudio_scene_preview' : '') });
}
function toolWrite(root, a) { const p = projPath(root, a.dir, a.path, true); if (p.error) return err(p.error); return putFile(p, String(a.content)); }
function toolEdit(root, a) {
  const p = projPath(root, a.dir, a.path, true); if (p.error) return err(p.error);
  if (!fs.existsSync(p.file)) return err('no such file: ' + p.rel);
  const text = fs.readFileSync(p.file, 'utf8'), old = String(a.old_text);
  if (!old) return err('old_text is empty');
  const n = text.split(old).length - 1;
  if (n === 0) return err('old_text was not found in ' + p.rel + '. Read the file and copy the text exactly.');
  if (n > 1 && !a.replace_all) return err('old_text occurs ' + n + ' times; add more context to make it unique, or set replace_all.');
  return putFile(p, text.split(old).join(String(a.new_text)));
}

/* background jobs: slow tools return after `wait` seconds with a job id instead of blocking past the client's timeout */
const JOBS = new Map(); let jobSeq = 0;
function startJob(t, argv, cwd, key) {
  for (const j of JOBS.values()) if (j.key === key && j.status === 'running') return j;
  const job = { id: 'j' + (++jobSeq), tool: t.name, key, status: 'running', started: Date.now(), out: '', err: '', code: null, waiters: [] };
  const p = spawn(process.execPath, [CLI].concat(argv), { cwd, env: process.env });
  p.stdout.on('data', d => { job.out += d; if (job.out.length > 2e6) job.out = job.out.slice(-1e6); });
  p.stderr.on('data', d => { job.err += d; if (job.err.length > 2e5) job.err = job.err.slice(-1e5); });
  const fin = code => { if (job.status !== 'running') return; job.status = 'done'; job.code = code; job.ended = Date.now(); job.waiters.splice(0).forEach(w => w()); };
  p.on('close', fin); p.on('error', e => { job.err += String(e); fin(-1); });
  JOBS.set(job.id, job); return job;
}
const waitJob = (job, sec) => job.status !== 'running' ? Promise.resolve() : new Promise(res => { const t = setTimeout(res, Math.max(0, sec) * 1000); job.waiters.push(() => { clearTimeout(t); res(); }); });
const lastLines = (txt, n) => String(txt).split(/\r?\n/).filter(Boolean).slice(-n).join('\n');
function jobStatus(root, t, job) {
  if (job.status === 'running') return okText({ status: 'running', job: job.id, tool: job.tool, elapsedSeconds: Math.round((Date.now() - job.started) / 1000), progress: lastLines(job.err || job.out, 6) || '(starting)', next: 'Call filmstudio_job with id "' + job.id + '" to keep waiting. Slow steps are normal: export takes minutes to hours.' });
  return formatResult(root, t, { code: job.code, out: job.out, err: job.err });
}
async function toolJob(root, a) {
  if (!a.id) return okText({ jobs: [...JOBS.values()].map(j => ({ job: j.id, tool: j.tool, status: j.status, elapsedSeconds: Math.round(((j.ended || Date.now()) - j.started) / 1000) })) });
  const job = JOBS.get(String(a.id)); if (!job) return err('no job "' + a.id + '" in this session (the server may have restarted; export resumes, so call filmstudio_export again)');
  await waitJob(job, Math.min(55, a.wait == null ? 40 : a.wait));
  return jobStatus(root, TOOLS.find(x => x.name === job.tool) || {}, job);
}
function formatResult(root, t, r) {
  const text = (r.out || '').trim() || (r.err || '').trim() || '(no output)';
  const content = [{ type: 'text', text }].concat(r.err && r.out ? [{ type: 'text', text: 'stderr: ' + r.err.slice(-1500) }] : []);
  if (t.image || t.name === 'filmstudio_review') {
    try {
      const j = JSON.parse(r.out), files = [].concat(j.strip ? [j.strip] : [], (j.sheets || []).slice(0, 4));
      for (const f of files) if (inRoot(root, f) && fs.existsSync(f) && fs.statSync(f).size < 4e6) content.push({ type: 'image', data: fs.readFileSync(f).toString('base64'), mimeType: 'image/png' });
    } catch (e) { /* no image */ }
  }
  return { isError: r.code !== 0, content };
}
async function callTool(root, name, a) {
  const t = TOOLS.find(x => x.name === name);
  if (!t) return err('unknown tool ' + name);
  a = a || {};
  for (const k of t.req) if (a[k] == null) return err('missing required argument: ' + k);
  if (t.run) { try { return await t.run(root, a); } catch (e) { return err(String(e && e.message || e)); } }
  if (!t.noDir && (a.dir != null || t.req.includes('dir'))) { const d = inRoot(root, a.dir); if (!d) return err('path is outside the workspace root (' + root + ')'); a = Object.assign({}, a, { dir: d }); }
  if (t.slow) {
    const job = startJob(t, t.args(a), root, t.name + ':' + (a.dir || ''));
    await waitJob(job, Math.min(55, a.wait == null ? 45 : a.wait));
    return jobStatus(root, t, job);
  }
  return formatResult(root, t, await runCli(t.args(a), root));
}
const guideTopics = () => fs.readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md')).sort();

async function handle(root, m) {
  const id = m.id, ok = result => ({ jsonrpc: '2.0', id, result }), bad = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  switch (m.method) {
    case 'initialize': return ok({ protocolVersion: '2024-11-05', capabilities: { tools: {}, resources: {}, prompts: {} }, serverInfo: { name: 'filmstudio', version: PKG.version }, instructions: INSTRUCTIONS });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: { type: 'object', properties: t.slow ? Object.assign({}, t.props, { wait: { type: 'number', description: 'seconds to wait for the result before it continues as a background job (default 45)' } }) : t.props, required: t.req } })) });
    case 'prompts/list': return ok({ prompts: [{ name: 'make_film', description: 'Brief an agent to make a short film with filmstudio: workflow, rules and limits in one message.', arguments: [{ name: 'idea', description: 'What the film is about', required: false }, { name: 'length', description: 'Target length in seconds', required: false }] }] });
    case 'prompts/get': { if (!m.params || m.params.name !== 'make_film') return bad(-32602, 'unknown prompt'); return ok({ description: 'Make a short film with filmstudio', messages: [{ role: 'user', content: { type: 'text', text: filmPrompt(m.params.arguments) } }] }); }
    case 'tools/call': return ok(await callTool(root, m.params && m.params.name, m.params && m.params.arguments));
    case 'resources/list': return ok({ resources: guideTopics().map(f => ({ uri: 'filmstudio://guide/' + f.replace(/\.md$/, ''), name: f.replace(/\.md$/, ''), mimeType: 'text/markdown' })) });
    case 'resources/read': { const u = (m.params && m.params.uri) || '', mm = /^filmstudio:\/\/guide\/([\w-]+)$/.exec(u), f = mm && path.join(GUIDE_DIR, mm[1] + '.md'); if (!f || !fs.existsSync(f)) return bad(-32002, 'resource not found: ' + u); return ok({ contents: [{ uri: u, mimeType: 'text/markdown', text: fs.readFileSync(f, 'utf8') }] }); }
    default: return m.id === undefined ? null : bad(-32601, 'method not found: ' + m.method);
  }
}
function serve(root) {
  root = path.resolve(root || process.env.FILMSTUDIO_ROOT || process.cwd());
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
      let m; try { m = JSON.parse(line); } catch (e) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }) + '\n'); continue; }
      Promise.resolve(handle(root, m)).then(r => { if (r && m.id !== undefined) process.stdout.write(JSON.stringify(r) + '\n'); }).catch(e => { if (m.id !== undefined) process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, error: { code: -32603, message: String(e && e.message) } }) + '\n'); });
    }
  });
  process.stdin.on('end', () => process.exit(0));
}
module.exports = { serve, handle, callTool, TOOLS, inRoot, INSTRUCTIONS };
