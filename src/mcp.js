'use strict';
// Minimal MCP server over stdio (newline-delimited JSON-RPC 2.0, protocol 2024-11-05). Each tool runs the filmstudio CLI.
// Paths are confined to a workspace root (FILMSTUDIO_ROOT, default: the directory the server was started in).
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const CLI = path.join(__dirname, '..', 'bin', 'filmstudio.js');
const PKG = require('../package.json');
const GUIDE_DIR = path.join(__dirname, '..', 'docs', 'agent-guide');

const dirProp = { type: 'string', description: 'Project folder (relative to the workspace root)' };
const TOOLS = [
  { name: 'filmstudio_new', description: 'Create a project folder with a valid starter spec.json (or copy an example).', props: { dir: dirProp, example: { type: 'string', description: 'Example name, e.g. the-only-limit' } }, req: ['dir'], args: a => ['new', a.dir].concat(a.example ? ['--example', a.example] : []) },
  { name: 'filmstudio_validate', description: 'Validate spec.json. Returns errors with fix hints, warnings and film length.', props: { dir: dirProp }, req: ['dir'], args: a => ['validate', a.dir] },
  { name: 'filmstudio_build', description: 'Build build/film.html from spec.json.', props: { dir: dirProp }, req: ['dir'], args: a => ['build', a.dir] },
  { name: 'filmstudio_voice', description: 'Generate or import narration clips (kokoro, elevenlabs, file). elevenlabs is paid and returns NEEDS_CONFIRMATION until yes=true; only set yes after the user agrees.', props: { dir: dirProp, provider: { type: 'string', enum: ['kokoro', 'elevenlabs', 'file'] }, force: { type: 'boolean' }, yes: { type: 'boolean' } }, req: ['dir'], args: a => ['voice', a.dir].concat(a.provider ? ['--provider', a.provider] : [], a.force ? ['--force'] : [], a.yes ? ['--yes'] : []) },
  { name: 'filmstudio_voice_check', description: 'Measure narration clips for clipping, glitches, silence, pace and flat delivery. Cannot judge taste.', props: { dir: dirProp }, req: ['dir'], args: a => ['voice-check', a.dir] },
  { name: 'filmstudio_review', description: 'Screenshot every shot (needs a browser) and make contact sheets in build/review. Optional portrait size and motion check.', props: { dir: dirProp, size: { type: 'string', description: 'e.g. 400x800' }, motion: { type: 'boolean' }, beats: { type: 'string', description: 'comma separated beats' } }, req: ['dir'], args: a => ['review', a.dir].concat(a.size ? ['--size', a.size] : [], a.motion ? ['--motion'] : [], a.beats ? ['--beats', a.beats] : []) },
  { name: 'filmstudio_audio_check', description: 'Render the score offline and report loudness, clipping and dynamics.', props: { dir: dirProp }, req: ['dir'], args: a => ['audio-check', a.dir] },
  { name: 'filmstudio_export', description: 'Render build/film.mp4 (slow; resumable). Test first with from_bar=1,to_bar=3.', props: { dir: dirProp, fps: { type: 'number' }, size: { type: 'string' }, from_bar: { type: 'number' }, to_bar: { type: 'number' }, no_audio: { type: 'boolean' } }, req: ['dir'], args: a => ['export', a.dir].concat(a.fps ? ['--fps', String(a.fps)] : [], a.size ? ['--size', a.size] : [], a.from_bar ? ['--from-bar', String(a.from_bar)] : [], a.to_bar ? ['--to-bar', String(a.to_bar)] : [], a.no_audio ? ['--no-audio'] : []) },
  { name: 'filmstudio_styles', description: 'List shot styles and variants, optionally filtered by mood (calm, energetic, playful, serious, warm, nostalgic, mysterious, techy, night, nature, bold, retro).', props: { mood: { type: 'string' } }, req: [], noDir: true, args: a => ['styles'].concat(a.mood ? ['--mood', a.mood] : []) },
  { name: 'filmstudio_guide', description: 'Read the agent guide. No topic lists topics; "all" returns everything.', props: { topic: { type: 'string' } }, req: [], noDir: true, args: a => ['guide'].concat(a.topic ? [a.topic] : []) },
  { name: 'filmstudio_doctor', description: 'Check this machine and say what film-making steps it can do.', props: {}, req: [], noDir: true, args: () => ['doctor'] },
];

function inRoot(root, p) { const r = path.resolve(root, p), rel = path.relative(root, r); return !rel.startsWith('..') && !path.isAbsolute(rel) ? r : null; }
function runCli(args, cwd) {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [CLI].concat(args), { cwd, env: process.env }); let out = '', err = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('close', code => resolve({ code, out, err })); p.on('error', e => resolve({ code: -1, out: '', err: String(e) }));
  });
}
async function callTool(root, name, a) {
  const t = TOOLS.find(x => x.name === name);
  if (!t) return { isError: true, content: [{ type: 'text', text: 'unknown tool ' + name }] };
  a = a || {};
  for (const k of t.req) if (a[k] == null) return { isError: true, content: [{ type: 'text', text: 'missing required argument: ' + k }] };
  if (!t.noDir) { const d = inRoot(root, a.dir); if (!d) return { isError: true, content: [{ type: 'text', text: 'path is outside the workspace root (' + root + ')' }] }; a = Object.assign({}, a, { dir: d }); }
  const r = await runCli(t.args(a), root);
  const text = (r.out || '').trim() || (r.err || '').trim() || '(no output)';
  return { isError: r.code !== 0, content: [{ type: 'text', text }].concat(r.err && r.out ? [{ type: 'text', text: 'stderr: ' + r.err.slice(-1500) }] : []) };
}
const guideTopics = () => fs.readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md')).sort();

async function handle(root, m) {
  const id = m.id, ok = result => ({ jsonrpc: '2.0', id, result }), bad = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  switch (m.method) {
    case 'initialize': return ok({ protocolVersion: '2024-11-05', capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'filmstudio', version: PKG.version }, instructions: 'Read the resource filmstudio://guide/01-quick-start first. Film length is set by bpm (seconds = 11040 / bpm).' });
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: { type: 'object', properties: t.props, required: t.req } })) });
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
module.exports = { serve, handle, callTool, TOOLS, inRoot };
